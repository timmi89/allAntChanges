from antenna.rb.models import *
from antenna.rb.profanity_filter import ProfanitiesFilter
from antenna.antenna_celery import app as celery_app
from django.db.models import Q
from django.core.cache import cache, get_cache
from django.core.paginator import Paginator, InvalidPage, EmptyPage
from django.core.cache import cache
from django.forms.models import model_to_dict
from datetime import datetime, timedelta
import random
import json
import re
import time
import string
from threading import Thread
from exceptions import FBException, JSONException
from urlparse import urlsplit, urlunsplit
import traceback
import logging
import hashlib
from operator import itemgetter
logger = logging.getLogger('rb.standard')


# BEGIN for the html tag stripping
from HTMLParser import HTMLParser
class MLStripper(HTMLParser):
    def __init__(self):
        self.reset()
        self.fed = []
    def handle_data(self, d):
        self.fed.append(d)
    def get_data(self):
        return ''.join(self.fed)

def strip_tags(html):
    s = MLStripper()
    s.feed(html)
    return s.get_data()
# END for the html tag stripping

blacklist = ['fuck','shit','poop','cock','cunt']

def getTagCommentData(comment):
    comment_data = {}
    comment_data['comment'] = comment.interaction_node.body
    comment_data['user'] = comment.user

    return comment_data

# TODO: This needs to be rewritten or removed. Right now, it's called in an outer loop that goes through each tag and then internally
#       it goes through each tag.
def getTagSummary(node, tags):
    tags = filter(lambda x: x.interaction_node==node, tags)

    data = {}
    data['count'] = len(tags)
    data['body'] = node.body
    for inter in tags:
        if not inter.parent:
            data['parent_id'] = inter.id
            break
    return data

def getSummary(interactions, container=None, content=None, page=None, data=None, isCrossPage=False):
    #logger.info('SUMMARY: ' + ' ' + str(container) + ' ' + str(content) + ' ' + str(page)  + ' ' + str(data))
    if not data: data = {}
    counts = {}
    if container:
        data['kind'] = container[2]
    if content:
        data['id'] = content[0]
        data['body'] = content[1]
        data['kind'] = content[2]
        data['location'] = content[3]

    if container:
        container = container[0]
        interactions = filter(lambda x: x.container_id==container, interactions)
    elif content:
        content = content[0]
        interactions = filter(lambda x: x.content_id==content, interactions)
    elif page:
        interactions = filter(lambda x: x.page==page, interactions)

    # Filter tag and comment interactions
    tags = filter(lambda x: x.kind=='tag', interactions)
    comments = filter(lambda x: x.kind=='com', interactions)

    counts['tags'] = len(tags)
    counts['coms'] = len(comments)
    counts['interactions'] = len(interactions)
    data['counts'] = counts
    data['id'] = container if container else content

    tag_counts = dict((
        (tag.interaction_node.id, getTagSummary(tag.interaction_node, tags)) for tag in tags
    ))
    sorted_counts = sorted(tag_counts.items(), key=lambda x: x[1]['count'], reverse=True)

    tag_limit = 500 if isCrossPage else 10
    top_tags = dict((
        tag for tag in sorted_counts[:tag_limit]
    ))

    top_interactions = {}
    top_interactions['tags'] = top_tags
    top_interactions['coms'] = [dict(id=comment.id, tag_id=comment.parent.interaction_node.id, content_id=comment.content.id, user=comment.user, body=comment.interaction_node.body) for comment in comments]
    for comment in top_interactions['coms']:
        try:
            comment['social_user'] = comment['user'].social_user
        except SocialUser.DoesNotExist:
            comment['social_user'] = {}

    data['top_interactions'] = top_interactions

    return data

def getContainerSummaries(interactions, containers, isCrossPage=False):
    data = dict((
        (container[1], getSummary(interactions, container=container, isCrossPage=isCrossPage)) for container in containers
    ))
    return data

def getContentSummaries(interactions, content, isCrossPage=False):
    data = dict((
        (content_item[0], getSummary(interactions, content=content_item, isCrossPage=isCrossPage)) for content_item in content
    ))
    return data

def getTagCounts(interactions, containers=None, content=None, data=None):
    pass

def getCounts(interactions, containers=None, content=None, data=None):
    if not data: data = {}

    if containers: interactions = interactions.filter(container__in=containers)
    if content: interactions = interactions.filter(content__in=content)

    data['tag_count'] = len(interactions.filter(kind='tag'))
    data['comment_count'] = len(interactions.filter(kind='tag'))

    return data

def interactionNodeCounts(interactions, kinds=[], content=None):
    # Filter interactions for this piece of content and get count data
    counts = []
    if content:
        interactions = interactions.filter(content=content_item)
    for kind in kinds:
        filtered = content_interactions.filter(interaction_node__kind=kind)
        counts.append(filtered.count())
    return counts

def getHost(request):
    # Using referer for now, could be url as well
    url = request.META.get('HTTP_REFERER', None)

    if url:
        split_host = urlsplit(url).netloc.split('.')
        if 'www' in split_host[0]: split_host = split_host[1:]
        host = '.'.join(split_host)
    else:
        host = request.META['HTTP_HOST']

    return host

def stripQueryString(url):
    qs = urlsplit(url).query
    if qs:
        url = url[:url.index(qs)-1]
    return url

def getPage(host, page_request):
    canonical = page_request.get('canonical_url', None)
    url = page_request.get('url', None)
    title = page_request.get('title', None)
    group_id = page_request.get('group_id', 1)
    image = page_request.get('image', None)
    author = page_request.get('author', None)
    topics = page_request.get('topics', None)
    section = page_request.get('section', None)

    try:
        site = Site.objects.get( group=int(group_id))
    except Site.DoesNotExist:
        raise JSONException("Site doesn't exist! "  + host + " " + str(group_id))
    except ValueError:
        raise JSONException("Bad Group ID!")

    # Remove querystring if it doesn't determine content
    if not site.querystring_content:
        url = stripQueryString(url)
        canonical = stripQueryString(canonical)

    # Handle sites with hash but no bang
    if '#' in url and '!' not in url:
        url = url[:url.index('#')]

    if canonical:
        if canonical == "same":
            canonical = url
        else:
            url = canonical
    else:
        canonical = ""

    try:
        page = Page.objects.get(
            url = url,
            canonical_url = canonical
        )
    except Page.DoesNotExist:
        # rewrite branch - make the page title and image optional
        # defaults = {'site': site}
        # if (title and image):
        #     defaults['title'] = title
        #     defaults['image'] = image
        page = Page.objects.get_or_create(
            url = url,
            canonical_url = canonical,
            defaults = {'site': site, 'title':title, 'image':image}
        )[0]
    page_changed = False
    if (page.image is None or len(page.image) < 1) and image is not None and len(image) > 0:
        page.image = image
        page_changed = True
    if (page.author is None or len(page.author) < 1) and author is not None and len(author) > 0:
        page.author = author
        page_changed = True
    if (page.topics is None or len(page.topics) < 1) and topics is not None and len(topics) > 0:
        page.topics = topics
        page_changed = True
    if (page.section is None or len(page.section) < 1) and section is not None and len(section) > 0:
        page.section = section
        page_changed = True

    if page_changed:
        page.save()
    return page

def createInteractionNode(node_id=None, body=None, group=None):
    # Get or create InteractionNode for share
    if node_id:
        # ID known retrieve existing
        inode = InteractionNode.objects.get(id=node_id)

    # Body was passed rather than id
    elif body:
        body = strip_tags(body)
        # No id provided, using body to get_or_create
        check_nodes = InteractionNode.objects.filter(body__exact = body)

        if check_nodes.count() == 0:
            inode = InteractionNode.objects.get_or_create(body=body)[0]

        elif check_nodes.count() > 1:
            inode = check_nodes[0]

        elif check_nodes.count() == 1:
            inode = check_nodes[0]


    return inode

def isTemporaryUser(user):
    return len(SocialUser.objects.filter(user__id=user.id)) == 0

def checkLimit(user, group):
    interactions = Interaction.objects.filter(user=user)
    num_interactions = interactions.count()
    max_interact = group.temp_interact

    if num_interactions >= max_interact:
        """
        raise JSONException(
            u"Temporary user interaction limit reached for user " + unicode(user.id)
        )
        """
        logger.info('Temp interaction limit MET, but ignored. ' + str(user.id))
    return num_interactions



def getSinglePageDataDictOldAndBusted(page_id):
    current_page = Page.objects.get(id=page_id)
    urlhash = hashlib.md5( current_page.url ).hexdigest()
    iop = Interaction.objects.filter(page=current_page, approved=True).exclude(container__item_type='question')
    # Retrieve containers
    containers = Container.objects.filter(id__in=iop.values('container'))
    values = iop.order_by('kind').values('kind')
    # Annotate values with count of interactions
    summary = values.annotate(count=Count('id'))

    tags = InteractionNode.objects.filter(
        interaction__kind='tag',
        interaction__page=current_page,
        interaction__approved=True
    ).exclude(
        interaction__container__item_type='question'
    )

    ordered_tags = tags.order_by('body')
    tagcounts = ordered_tags.annotate(tag_count=Count('interaction'))
    toptags = tagcounts.order_by('-tag_count')[:15].values('id','tag_count','body')

    result_dict = dict(
            id=current_page.id,
            summary=summary,
            toptags=toptags,
            urlhash = urlhash,
            containers=containers
        )
    return result_dict


def getSinglePageDataDict(page_id):
    page = Page.objects.get(id=page_id)
    interactions = Interaction.objects.filter(page=page, approved=True).values('id','container_id','kind','interaction_node_id')
    container_ids = set()
    node_ids = set()
    top_tag_dict = {}
    summary_dict = { 'tag' : 0, 'com': 0 }
    # Collect the ids of all the container and interaction_nodes that we need and add up the summary totals as we go.
    for interaction in interactions:
        container_id = interaction['container_id']
        container_ids.add(container_id)
        kind = interaction['kind']
        if kind == 'tag':
            node_id = interaction['interaction_node_id']
            node_ids.add(node_id)
            top_tag_dict.setdefault(node_id, 0)
            top_tag_dict[node_id] += 1
            summary_dict['tag'] += 1
        elif kind == 'com':
            summary_dict['com'] += 1

    # Next, fetch all of the containers and interaction_nodes that we need
    containers = Container.objects.filter(id__in=container_ids).values('id','hash')
    node_dict = {}
    for node in InteractionNode.objects.filter(id__in=node_ids).values('id','body'):
        node_dict[node['id']] = node

    # Finally, transform the data into the output format
    containers_data = []
    for container in containers:
        container_data = {
            'id': container['id'],
            'hash': container['hash']
        }
        containers_data.append(container_data)

    top_tags = []
    for node_id, count in top_tag_dict.items():
        node = node_dict.get(node_id)
        if node:
            top_tag = {
                'id': node_id,
                'tag_count': count,
                'body': node['body']
            }
            top_tags.append(top_tag)
    top_tags = sorted(top_tags, key=itemgetter('tag_count', 'body'), reverse=True)

    summary_data = []
    if summary_dict['tag'] > 0:
        summary_data.append({ 'kind' : 'tag', 'count': summary_dict['tag'] })
    if summary_dict['com'] > 0:
        summary_data.append({ 'kind' : 'com', 'count': summary_dict['com'] })

    page_data = {
        'urlhash': hashlib.md5(page.url).hexdigest(),
        'id': page_id,
        'containers': containers_data,
        'toptags': top_tags[:15],
        'summary': summary_data
    }
    return page_data


def getSinglePageDataNewerById(page_id):
    page = Page.objects.get(id=page_id)
    return getSinglePageDataNewer(page)


def getSinglePageDataNewer(page):
    interactions = Interaction.objects.filter(page=page, approved=True).values('id','container_id','content_id','kind','interaction_node_id','parent_id')
    interaction_dict = {}
    container_ids = set()
    content_ids = set()
    node_ids = set()
    summary_dict = {}
    # First, make a pass over the interactions to group them by container, content, and kind (reactions/comments).
    # As we go, collect the ids of all the content and interaction_nodes that we need. here's what the map looks like:
    # interaction_dict = {
    #   container_id: {
    #       content_id: {
    #           'reactions': {
    #               node_id: { 'count': count, interaction_id: id }
    #           },
    #           'comments': { parent_interaction_id: count }
    #       }
    #   }
    #
    for interaction in interactions:
        container_id = interaction['container_id']
        container_ids.add(container_id)
        container_interactions = interaction_dict.setdefault(container_id, {})
        content_id = interaction['content_id']
        content_ids.add(content_id)
        content_interactions = container_interactions.setdefault(content_id, {})
        kind = interaction['kind']
        if kind == 'tag':
            content_reactions = content_interactions.setdefault('reactions', {})
            node_id = interaction['interaction_node_id']
            node_ids.add(node_id)
            content_reaction = content_reactions.setdefault(node_id, { 'count': 0 })
            content_reaction['count'] += 1
            if not interaction['parent_id']: # this is a 'root' interaction
                content_reaction['interaction_id'] = interaction['id']
            summary_dict.setdefault(node_id, 0)
            summary_dict[node_id] += 1
        elif kind == 'com':
            content_comments = content_interactions.setdefault('comments', {})
            parent_id = interaction['parent_id']
            if parent_id: # guard against corrupt data (comments should always have a parent_id).
                content_comments.setdefault(parent_id, 0)
                content_comments[parent_id] += 1

    # Next, fetch all of the containers, content, and interaction_nodes that we need
    containers = Container.objects.filter(id__in=container_ids).values('id','hash')
    content_dict = {}
    for content in Content.objects.filter(id__in=content_ids).values('id','kind','location','body'):
        content_dict[content['id']] = content
    node_dict = {}
    for node in InteractionNode.objects.filter(id__in=node_ids).values('id','body'):
        node_dict[node['id']] = node

    # Finally, transform the data into the output format
    containers_data = {}
    for container in containers:
        container_id = container['id']
        reactions_data = []
        container_interactions = interaction_dict[container_id]
        for content_id, content_interactions in container_interactions.items():
            content = content_dict.get(content_id)
            if content:
                content_reactions = content_interactions.get('reactions', {})
                content_comments = content_interactions.get('comments', {})
                for node_id, content_reaction in content_reactions.items():
                    interaction_id = content_reaction.get('interaction_id')
                    if interaction_id: # This can be None due to corrupt data in the DB
                        interaction_node = node_dict.get(node_id)
                        if interaction_node:
                            reaction_data = {
                                'text': interaction_node['body'],
                                'id': node_id,
                                'parentID': interaction_id, # TODO clean up the interaction/interaction_node property names in the API
                                'count': content_reaction['count'],
                                'commentCount': content_comments.get(interaction_id),
                                'content': {
                                    'id': content_id,
                                    'location': content['location'],
                                    'kind': content['kind'],
                                    'body': content['body']
                                }
                            }
                            reactions_data.append(reaction_data)
        # return reactions sorted by count (highest to lowest), then id (lowest to highest)
        reactions_data = sorted(reactions_data, key=lambda x: x['id'])
        reactions_data = sorted(reactions_data, key=lambda x: x['count'], reverse=True)
        container_data = {
            'id': container_id,
            'hash': container['hash'],
            'reactions': reactions_data
        }
        containers_data[container['hash']] = container_data

    summary_data = []
    for node_id, count in summary_dict.items():
        node = node_dict.get(node_id)
        if node:
            summary_reaction = {
                'id': node_id,
                'count': count,
                'text': node['body']
            }
            summary_data.append(summary_reaction)
    # return reactions sorted by count (highest to lowest), then id (lowest to highest)
    summary_data = sorted(summary_data, key=lambda x: x['id'])
    summary_data = sorted(summary_data, key=lambda x: x['count'], reverse=True)

    page_data = {
        'pageHash': hashlib.md5(page.url).hexdigest(),
        'id': page.id,
        'containers': containers_data,
        'summaryReactions': summary_data[:15],
        'title': page.title,
        'image': page.image,
        'topics': page.topics,
        'section': page.section,
        'author': page.author,
        'canonicalURL': page.canonical_url
    }
    return page_data


def getKnownUnknownContainerSummaries(page_id, hashes, crossPageHashes):
    page = Page.objects.get(id=page_id)
    #logger.info("KNOWN UNKNOWN PAGE ID: " + str(page_id))
    containers = list(Container.objects.filter(hash__in=hashes).values_list('id','hash','kind'))
    #logger.info("gkucs HASHES AND CONTAINERS: " + str(hashes) + " " + str(containers))
    ids = [container[0] for container in containers]
    interactions = list(Interaction.objects.filter(
        container__in=ids,
        page=page,
        approved=True
    ).select_related('interaction_node','content','user',('social_user')))
    known = getContainerSummaries(interactions, containers)

    # crossPageHashes
    if len(crossPageHashes) > 0:
        crossPageContainers = list(Container.objects.filter(hash__in=crossPageHashes).values_list('id','hash','kind'))
        crossPageIds = [container[0] for container in crossPageContainers]
        crossPageInteractions = list(Interaction.objects.filter(
            container__in=crossPageIds,
            page__site__group = page.site.group,
            # page__in=group_page_ids,
            approved=True
        ).select_related('interaction_node','content','user',('social_user')))

        crossPageKnown = getContainerSummaries(crossPageInteractions, crossPageContainers, isCrossPage=True)


    unknown = list(set(hashes) - set(known.keys()))
    if 'crossPageKnown' in locals():
        cacheable_result = dict(known=known, unknown=unknown, crossPageKnown=crossPageKnown)
    else:
        cacheable_result = dict(known=known, unknown=unknown, crossPageKnown="")
    #logger.info('CACHEABLE RESULT gkucs: ' + str(cacheable_result))
    return cacheable_result

def getSettingsDict(group, site=None, blessed_tags=None):
    settings_dict = model_to_dict(
         group,
         exclude=[
             'admins',
             'word_blacklist',
             'blocked_tags',
             'blocked_promo_tags',
             'all_tags',
             'approved',
             'share',
             'rate',
             'comment',
             'bookmark',
             'search',
             'logo_url_sm',
             'logo_url_med',
             'logo_url_lg',
             'sharebox_digg',
             'sharebox_facebook',
             'sharebox_fade',
             'sharebox_google',
             'sharebox_reddit',
             'sharebox_selector',
             'sharebox_should_own',
             'sharebox_show',
             'sharebox_stumble',
             'sharebox_twitter']
     )
    if (site is None):
        site = Site.objects.get(group = group)
    settings_dict['querystring_content'] = site.querystring_content

    if (blessed_tags is None):
        blessed_tags = InteractionNode.objects.filter(groupblessedtag__group=group.id).order_by('groupblessedtag__order')

    settings_dict['blessed_tags'] = blessed_tags # deprecated. delete once all client usage is removed.
    settings_dict['default_reactions'] = blessed_tags
    return settings_dict

def getGlobalActivity():
    makeItLean = True
    historyLen = 5 if makeItLean else 30
    maxInteractions = 200 if makeItLean else None

    today = datetime.now()
    tdelta = timedelta(days = -historyLen)
    the_past = today + tdelta
    interactions = Interaction.objects.all()
    interactions = interactions.filter(
        created__gt = the_past,
        kind = 'tag',
        approved=True,
        page__site__group__approved=True
    ).order_by('-created')[:maxInteractions]

    users = {}
    pages = {}
    groups = {}
    nodes ={}
    for inter in interactions:
        if not groups.has_key(inter.page.site.group.name):
            groups[inter.page.site.group.name] = {'count': 1, "group":model_to_dict(inter.page.site.group,
                                                                                    fields=['id', 'short_name'])}
        else:
            groups[inter.page.site.group.name]['count'] +=1

        if not pages.has_key(inter.page.url):
            pages[inter.page.url] = {'count': 1, "page":model_to_dict(inter.page, fields=['id', 'title'])}
        else:
            pages[inter.page.url]['count'] +=1

        if not inter.user.email.startswith('tempuser'):
            if not users.has_key(inter.user.id):
                user_dict = model_to_dict(inter.user, exclude=['username','user_permissions',
                                                               'last_login', 'date_joined', 'email',
                                                                'is_superuser', 'is_staff', 'password', 'groups'])
                user_dict['social_user'] = model_to_dict(inter.user.social_user, exclude=['notification_email_option',
                                                                                          'gender', 'provider',
                                                                                          'bio', 'hometown', 'user',
                                                                                          'follow_email_option'])
                users[inter.user.id] = {'count': 1, "user":user_dict}
            else:
                users[inter.user.id]['count'] +=1

        if not nodes.has_key(inter.interaction_node.body):
            nodes[inter.interaction_node.body] = {'count': 1}
        else:
            nodes[inter.interaction_node.body]['count'] +=1


    return {'nodes':nodes, 'users':users, 'groups':groups, 'pages':pages}

def retry_cache_get(key):
    for x in range(1,9):
        result = cache.get(key)
        if result is not None:
            return result
        else:
            time.sleep( x * 0.25 )
    return None




def check_and_get_locked_cache(key):
    cached_result = cache.get(str(key))
    if cached_result is None and cache.get('LOCKED_'+str(key)) is None:
        logger.info('checking redundant cache')  #REMOVE THIS IN FUTURE IF COSTLY OR INCONSISTENT...
        redundant_cache_result = get_cache('redundant').get(str(key))
        if redundant_cache_result is not None:
            cache.set(key, redundant_cache_result)
            return redundant_cache_result
        cache.set('LOCKED_'+ str(key),'locked',15)
        logger.info("locking to continue for DB: " + str(key))
        return None
    elif cached_result is None:
        for x in range(1,10):
            time.sleep(x * 0.25)
            cached_result = cache.get(str(key))
            if cached_result is not None:
                cache.delete('LOCKED_'+ str(key))
                logger.info('return cached result and cleared LOCKED'+str(key))
                return cached_result
    return cached_result



