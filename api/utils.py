from antenna.rb.models import *
from antenna.rb.profanity_filter import ProfanitiesFilter
from antenna.chronos.jobs import *
from django.db.models import Q
from django.core.paginator import Paginator, InvalidPage, EmptyPage
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
logger = logging.getLogger('rb.standard')

blacklist = ['fuck','shit','poop','cock','cunt']
    
def getTagCommentData(comment):
    comment_data = {}
    comment_data['comment'] = comment.interaction_node.body
    comment_data['user'] = comment.user

    return comment_data

def getTagSummary(tag, tags):
    tags = filter(lambda x: x.interaction_node==tag, tags)
    
    data = {}
    data['count'] = len(tags)
    data['body'] = tag.body
    for inter in tags:
        if not inter.parent:
            data['parent_id'] = inter.id
            break
    return data

def getSummary(interactions, container=None, content=None, page=None, data=None, isCrossPage=False):
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
        if (page.image is None or len(page.image) < 1) and image is not None and len(image) > 0:
            page.image = image
            page.save()
        return page   
    except Page.DoesNotExist:
        page = Page.objects.get_or_create(
            url = url,
            canonical_url = canonical,
            defaults = {'site': site, 'title':title, 'image':image}
        )
        return page[0]
    
def createInteractionNode(node_id=None, body=None, group=None):
    # Get or create InteractionNode for share
    if node_id:
        # ID known retrieve existing
        inode = InteractionNode.objects.get(id=node_id)
    
    # Body was passed rather than id
    elif body:
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
        raise JSONException(
            u"Temporary user interaction limit reached for user " + unicode(user.id)
        )
    return num_interactions

def deleteInteraction(interaction, user):
    if interaction and user:
        tempuser = False
        if interaction.user != user:
            raise JSONException("User id and interaction's user id do not match")
        if isTemporaryUser(user):
            interactions = Interaction.objects.filter(user=user)
            num_interactions = len(interactions)
            tempuser = True

        # This will delete an interaction and all of it's children
        try:
            interaction.delete();
            try:
                cache_updater = PageDataCacheUpdater(method="delete", page_id=interaction.page.id)
                t = Thread(target=cache_updater, kwargs={})
                t.start()
                
                container_cache_updater = ContainerSummaryCacheUpdater(method="delete", page_id=interaction.page.id)
                t = Thread(target=container_cache_updater, kwargs={})
                t.start()
                
                container_cache_updater = ContainerSummaryCacheUpdater(method="delete", page_id=str(interaction.page.id) + ":" + [interaction.container.hash])
                t = Thread(target=container_cache_updater, kwargs={})
                t.start()
                
            except Exception, e:
                logger.warning(traceback.format_exc(50))   
    
        except:
            raise JSONException("Error deleting the interaction")
        if tempuser: return dict(deleted_interaction=interaction, num_interactions=num_interactions-1)
        return dict(deleted_interaction=interaction)
    else:
        raise JSONException("Missing interaction or user")

def createInteraction(page, container, content, user, kind, interaction_node, group=None, parent=None):
    approveOnCreate = False if group.requires_approval else True

    if kind and kind == 'tag':
        if group and group.blocked_tags:
            for blocked in group.blocked_tags.all():
                if interaction_node.body == blocked.body:
                    raise JSONException("Group has blocked this tag.")

        if group and group.word_blacklist:
            # Check body for blacklisted word
            # if in the blacklist, block it
            blacklist = [word.strip().lower() for word in group.word_blacklist.split(',')]

            # strip punctuation and whitespace, so that f!u ck is not OK
            tagLowerCased = re.sub('[%s]' % re.escape(string.punctuation), '', interaction_node.body.lower())
            tagLowerCased = re.sub('[%s]' % re.escape(string.whitespace), '', tagLowerCased)

            # check the whole reaction (i.e. 'f u c k'), and smash case
            if tagLowerCased in blacklist:
                approveOnCreate = False

            tagNoNumbers = re.sub("^\d+\s|\s\d+\s|\s\d+$", " ", interaction_node.body.lower() )
            tagLowerCasedNoNumbers = re.sub('[%s]' % re.escape(string.punctuation), '', tagNoNumbers)
            tagLowerCasedNoNumbers = re.sub('[%s]' % re.escape(string.whitespace), '', tagLowerCasedNoNumbers)

            # check the whole reaction but with loose digits removed.  does not remove numbers inside a word.
            # so fuck1 is still "fuck1" but "fuck 1" is now "fuck"
            if tagLowerCasedNoNumbers in blacklist:
                approveOnCreate = False

            # let's check for words ending in "er" and see if they match bad words.
            # so check to see if "fucker" --> "fuck" --> blackword match
            if tagLowerCased.endswith('er'):
                if tagLowerCased[:-2] in blacklist:
                    approveOnCreate = False

            # also check individual words, by splitting on a space
            # also, replace dashes with a space first.  a bit simple but a good start.
            # for word in tagLowerCased.replace('-', ' ').split(' '):
            for word in interaction_node.body.lower().replace('-', ' ').split(' '):
                if word.lower() in blacklist:
                    approveOnCreate = False
                    
                #### DO ALL THE SAME STUFF FOR EACH 'word'.  should abstract to a function, but not right now.
                # strip punctuation and whitespace, so that f!u ck is not OK
                tagLowerCased = re.sub('[%s]' % re.escape(string.punctuation), '', word)
                tagLowerCased = re.sub('[%s]' % re.escape(string.whitespace), '', tagLowerCased)

                # check the whole reaction (i.e. 'f u c k'), and smash case
                if tagLowerCased in blacklist:
                    approveOnCreate = False

                tagNoNumbers = re.sub("^\d+\s|\s\d+\s|\s\d+$", " ", word )
                tagLowerCasedNoNumbers = re.sub('[%s]' % re.escape(string.punctuation), '', tagNoNumbers)
                tagLowerCasedNoNumbers = re.sub('[%s]' % re.escape(string.whitespace), '', tagLowerCasedNoNumbers)

                # check the whole reaction but with loose digits removed.  does not remove numbers inside a word.
                # so fuck1 is still "fuck1" but "fuck 1" is now "fuck"
                if tagLowerCasedNoNumbers in blacklist:
                    approveOnCreate = False

                # let's check for words ending in "er" and see if they match bad words.
                # so check to see if "fucker" --> "fuck" --> blackword match
                if tagLowerCased.endswith('er'):
                    if tagLowerCased[:-2] in blacklist:
                        approveOnCreate = False


            if approveOnCreate == False:
                raise JSONException("Group has blocked this tag.")

         
    # Check to see if user has reached their interaction limit
    tempuser = False
    if isTemporaryUser(user):
        num_interactions = checkLimit(user, group)
        tempuser = True

    #temporaryish hack to deal with cdn subdomain prefixes for media!!!
    #On the front end, we are stripping parts of the url out of for images and media
    #so, to keep the content url consistent, just grab it from an existing interaction if it exists.
    if content.kind == "img" or content.kind == "media":
        try:
            existing_interaction_w_content = Interaction.objects.filter(
                container=container
            )[:1].get()
            content_node = existing_interaction_w_content.content
        except Interaction.DoesNotExist:
            content_node = content
    else:
        content_node = content

    interactions = Interaction.objects.filter(user=user)
    # Check unique content_id, user_id, page_id, interaction_node_id
    try:
        existing_interaction = interactions.get(
            user=user,
            page=page,
            content=content_node,
            interaction_node=interaction_node,
            kind=kind
        )
        #logger.info("Found existing Interaction with id %s" % existing_interaction.id)
        return dict(interaction=existing_interaction, existing=True)
    except Interaction.DoesNotExist:
        pass


    if group and group.signin_organic_required:
        if not tempuser:
            pass
        elif parent:
            pass
        else:
            if interaction_node in group.blessed_tags.all():
                pass
            else:
                raise JSONException(u"sign in required for organic reactions")
            
    try:
        new_interaction = Interaction(
            page=page,
            container=container,
            content=content_node,
            user=user,
            kind=kind,
            interaction_node=interaction_node,
            parent=parent,
            rank = int(time.time()*1000),
            approved = approveOnCreate
        )
    except Exception as e:
        raise JSONException(u"Error creating interaction object")

    new_interaction.save()
    try:
        is_new_tag = True
        if new_interaction.kind == 'tag':
            for alltag in page.site.group.all_tags.all():
                if alltag.body == new_interaction.interaction_node.body:
                    is_new_tag = False
            if is_new_tag:
                logger.info("Creating all tag")
                AllTag.objects.create(group=page.site.group, 
                                      node = new_interaction.interaction_node, 
                                      order=len(page.site.group.all_tags.all()))
                try:
                    notification = AsynchNewGroupNodeNotification()
                    t = Thread(target=notification, kwargs={"interaction_id":new_interaction.id, "group_id":group.id})
                    t.start()
                except Exception, ex:
                    pass
            
    except Exception, ex:
        logger.info("NO ALL TAG: " + traceback.format_exc(1500))
        
    ret = dict(
        interaction=new_interaction,
        content_node=content,
        existing=False,
        container=container
    )
    try:
        cache_updater = PageDataCacheUpdater(method="delete", page_id=page.id)
        t = Thread(target=cache_updater, kwargs={})
        t.start()
        
        container_cache_updater = ContainerSummaryCacheUpdater(method="delete", page_id=page.id)
        t = Thread(target=container_cache_updater, kwargs={})
        t.start()
        
        page_container_cache_updater = ContainerSummaryCacheUpdater(method="delete", page_id=str(page.id),hashes=[container.hash])
        t = Thread(target=page_container_cache_updater, kwargs={})
        t.start()
        
        notification = AsynchPageNotification()
        t = Thread(target=notification, kwargs={"interaction_id":new_interaction.id})
        t.start()

        other_interactions = list(Interaction.objects.filter(
                    container=container,
                    page__site__group = page.site.group,
                    approved=True
                    ))

        other_pages = set()
        for other in other_interactions:
            other_pages.add(other.page)
        for other_page in other_pages:
            cache_updater = PageDataCacheUpdater(method="delete", page_id=other_page.id)
            t = Thread(target=cache_updater, kwargs={})
            t.start()
        
            container_cache_updater = ContainerSummaryCacheUpdater(method="delete", page_id=other_page.id)
            t = Thread(target=container_cache_updater, kwargs={})
            t.start()
        
            page_container_cache_updater = ContainerSummaryCacheUpdater(method="delete", page_id=str(other_page.id),hashes=[container.hash])
            t = Thread(target=page_container_cache_updater, kwargs={})
            t.start()

        #if not new_interaction.parent or new_interaction.kind == 'com':
        #    global_cache_updater = GlobalActivityCacheUpdater(method="update")
        #    t = Thread(target=global_cache_updater, kwargs={})
        #    t.start()

    except Exception, e:
        logger.warning(traceback.format_exc(50))   
    
    if tempuser: 
        ret['num_interactions']=num_interactions+1

    return ret



def searchBoards(search_term, page_num):
    board_list = []
    boards = Board.objects.all().filter(visible=True)
    if search_term is not None and len(search_term) > 0:
        boards = Board.objects.filter(Q(title__icontains = search_term) | 
                        Q(description__icontains = search_term))
    boards = boards.order_by('-modified')
    board_paginator = Paginator(boards, 20)
    try: board_page = board_paginator.page(page_num)
    except (EmptyPage, InvalidPage): board_page = board_paginator.page(board_paginator.num_pages)
    board_owners = []
    for board in board_page.object_list:
        board_owners.append(board.owner)
    socials = SocialUser.objects.filter(user__in = board_owners)
    owner_social_map = {}
    for social in socials:
        owner_social_map[social.user.id] = model_to_dict(social, exclude=['notification_email_option', 'gender', 'provider', 'bio', 'hometown', 'user',
                                                                                      'follow_email_option'])
    for board in board_page.object_list:
        board_dict = model_to_dict(board, fields=['id', 'title', 'description'])
        board_dict['social_user'] = owner_social_map[board.owner.id]
        board_list.append(board_dict)
    return board_list


def getSinglePageDataDict(page_id):
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
    
    
    
def getKnownUnknownContainerSummaries(page_id, hashes, crossPageHashes):
    page = Page.objects.get(id=page_id)
    #logger.info("KNOWN UNKNOWN PAGE ID: " + str(page_id))
    containers = list(Container.objects.filter(hash__in=hashes).values_list('id','hash','kind'))
    #logger.info("CONTAINERS: " + str(containers))
    ids = [container[0] for container in containers]
    interactions = list(Interaction.objects.filter(
        container__in=ids,
        page=page,
        approved=True
    ).select_related('interaction_node','content','user',('social_user')))
    #logger.info("K/U I: " + str(interactions))
    known = getContainerSummaries(interactions, containers)

    # crossPageHashes
    if len(crossPageHashes) > 0:
        crossPageContainers = list(Container.objects.filter(hash__in=crossPageHashes).values_list('id','hash','kind'))
        crossPageIds = [container[0] for container in crossPageContainers]
        # MIKE: verify / do?
        # this interaction request should filter by group
        # to do so, we think we need a django query or queries that does this:
            # 1. takes the page_id to find the site its on
            # 2. uses the site_id to find the group_id
            # 3. gets a list of page_ids associated with the group_id (group > site > page)... lets call this group_page_ids
            # ...then that is used in the commented-out part of this query:
        crossPageInteractions = list(Interaction.objects.filter(
            container__in=crossPageIds,
            page__site__group = page.site.group,
            # page__in=group_page_ids,
            approved=True
        ).select_related('interaction_node','content','user',('social_user')))

        crossPageKnown = getContainerSummaries(crossPageInteractions, crossPageContainers, isCrossPage=True)

        
    #logger.info("K KEYS: " + str(known.keys()))
    # MIKE: verify / do?
        # does my solution here correctly handle cache for when there is, and isn't, a crossPageKnown list?
    unknown = list(set(hashes) - set(known.keys()))
    if 'crossPageKnown' in locals():
        cacheable_result = dict(known=known, unknown=unknown, crossPageKnown=crossPageKnown)
    else:
        cacheable_result = dict(known=known, unknown=unknown, crossPageKnown="")
    return cacheable_result

def getSettingsDict(group):
    settings_dict = model_to_dict(
         group,
         exclude=[
             'admins',
             'word_blacklist',
             'blocked_tags',
             'all_tags',
             'approved',
             'requires_approval',
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
    
    blessed_tags = InteractionNode.objects.filter(
         groupblessedtag__group=group.id
     ).order_by('groupblessedtag__order')
    
    settings_dict['blessed_tags'] = blessed_tags
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
    
