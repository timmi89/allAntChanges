from readrboard.rb.models import *
from readrboard.rb.profanity_filter import ProfanitiesFilter
from readrboard.chronos.jobs import *
from django.db.models import Q
from django.core.paginator import Paginator, InvalidPage, EmptyPage
from django.forms.models import model_to_dict
from datetime import datetime, timedelta
import random
import json
import re
import time
from threading import Thread
from exceptions import FBException, JSONException
from urlparse import urlsplit, urlunsplit
import logging
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

def getSummary(interactions, container=None, content=None, page=None, data=None):
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
    top_tags = dict((
        tag for tag in sorted_counts[:10]
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

def getContainerSummaries(interactions, containers):
    data = dict((
        (container[1], getSummary(interactions, container=container)) for container in containers    
    ))
    return data

def getContentSummaries(interactions, content):
    data = dict((
        (content_item[0], getSummary(interactions, content=content_item)) for content_item in content    
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

    try:
        site = Site.objects.get(domain=host, group=int(group_id))
    except Site.DoesNotExist:
        raise JSONException("Site doesn't exist!")
    except ValueError:
        raise JSONException("Bad Group ID!")

    # Remove querystring if it doesn't determine content
    if not site.querystring_content:
        url = stripQueryString(url)

    # Handle sites with hash but no bang
    if '#' in url and '!' not in url:
        url = url[:url.index('#')]

    if canonical:
        if canonical == "same":
            canonical = url
    else:
        canonical = ""
    page = Page.objects.get_or_create(
        url = url,
        canonical_url = canonical,
        defaults = {'site': site, 'title':title}
    )
        
    return page[0]
    
def createInteractionNode(node_id=None, body=None, group=None):
    # Get or create InteractionNode for share
    if node_id:
        # ID known retrieve existing
        inode = InteractionNode.objects.get(id=node_id)
    
    # Body was passed rather than id
    elif body:
        if group.word_blacklist:
            # Check body for blacklisted word
            """ for bad, good in blacklist.iteritems(): body = body.replace(bad, good) """
            blacklist = [word.strip() for word in group.word_blacklist.split(',')]
            #blacklist = ["%r" % word.strip() for word in group.word_blacklist.split(',')]
        
            # For demo search for bad words inside other bad words
            inside_words = True if group.id == 1 else False
        
            pf = ProfanitiesFilter(blacklist, replacements="*", complete=False, inside_words=inside_words)
            body = pf.clean(body)
        
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
                
                container_cache_updater = ContainerSummaryCacheUpdater(method="delete", page_id=str(interaction.page.id) + ":" + interaction.container.hash)
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
    # Check to see if user has reached their interaction limit
    tempuser = False
    if isTemporaryUser(user):
        num_interactions = checkLimit(user, group)
        tempuser = True

    interactions = Interaction.objects.filter(user=user)
    # Check unique content_id, user_id, page_id, interaction_node_id
    try:
        existing_interaction = interactions.get(
            user=user,
            page=page,
            content=content,
            interaction_node=interaction_node,
            kind=kind
        )
        logger.info("Found existing Interaction with id %s" % existing_interaction.id)
        return dict(interaction=existing_interaction, existing=True)
    except Interaction.DoesNotExist:
        pass

    if parent:
        pass
        #print "Creating Interaction with parent node"
    else:
        #print "Creating Interaction without parent node"
        parent = None
    
    try:
        new_interaction = Interaction(
            page=page,
            container=container,
            content=content,
            user=user,
            kind=kind,
            interaction_node=interaction_node,
            parent=parent,
            rank = int(time.time()*1000),
            approved = False if group.requires_approval else True
        )
    except:
        raise JSONException(u"Error creating interaction object")

    new_interaction.save()
    
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
        
        container_cache_updater = ContainerSummaryCacheUpdater(method="delete", page_id=str(page.id),hashes=container.hash)
        t = Thread(target=container_cache_updater, kwargs={})
        t.start()
        
        notification = AsynchPageNotification()
        t = Thread(target=notification, kwargs={"interaction_id":new_interaction.id})
        t.start()

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
    iop = Interaction.objects.filter(page=current_page)
            
    # Retrieve containers
    containers = Container.objects.filter(id__in=iop.values('container'))

    parents = iop.filter(page=current_page, parent=None)
    par_con = []
    for parent in parents:
        par_con.append({parent.container.id:parent.id})
    # Get page interaction counts, grouped by kind
    values = iop.order_by('kind').values('kind')
    # Annotate values with count of interactions
    summary = values.annotate(count=Count('id'))

    # ---Find top 10 tags on a given page---
    tags = InteractionNode.objects.filter(
        interaction__kind='tag',
        interaction__page=current_page,
        interaction__approved=True
    )
    ordered_tags = tags.order_by('body')
    tagcounts = ordered_tags.annotate(tag_count=Count('interaction'))
    toptags = tagcounts.order_by('-tag_count')[:10].values('id','tag_count','body')
  
    # ---Find top 10 shares on a give page---
    content = Content.objects.filter(interaction__page=current_page.id)
    shares = content.filter(interaction__kind='shr')
    sharecounts = shares.annotate(Count("id"))
    topshares = sharecounts.values("body").order_by()[:10]

    # ---Find top 10 non-temp users on a given page---
    socialusers = SocialUser.objects.filter(user__interaction__page=current_page.id)

    userinteract = socialusers.annotate(interactions=Count('user__interaction')).select_related('user')
    topusers = userinteract.order_by('-interactions').values('user','full_name','img_url','interactions')[:10]
    result_dict = dict(
            id=current_page.id,
            summary=summary,
            toptags=toptags,
            topusers=topusers,
            topshares=topshares,
            containers=containers,
            parents = par_con
        )
    return result_dict
    
    
    
def getKnownUnknownContainerSummaries(page_id, hashes):
    page = Page.objects.get(id=page_id)  
    containers = list(Container.objects.filter(hash__in=hashes).values_list('id','hash','kind'))
    ids = [container[0] for container in containers]
    interactions = list(Interaction.objects.filter(
        container__in=ids,
        page=page,
        approved=True
    ).select_related('interaction_node','content','user',('social_user')))

    known = getContainerSummaries(interactions, containers)
    unknown = list(set(hashes) - set(known.keys()))
    cacheable_result = dict(known=known, unknown=unknown)
    return cacheable_result

def getSettingsDict(group):
    settings_dict = model_to_dict(
         group,
         exclude=[
             'admins',
             'word_blacklist',
             'approved',
             'requires_approval',
             'share',
             'rate',
             'comment',
             'bookmark',
             'search',
             'logo_url_sm',
             'logo_url_med',
             'logo_url_lg']
     )
    
    blessed_tags = InteractionNode.objects.filter(
         groupblessedtag__group=group.id
     ).order_by('groupblessedtag__order')
    
    settings_dict['blessed_tags'] = blessed_tags
    return settings_dict

    
    
