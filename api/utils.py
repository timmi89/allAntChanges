from readrboard.rb.models import *
from datetime import datetime, timedelta
import json
import hashlib
import hmac
import random
from exceptions import FBException, JSONException

def getTagCommentData(comment):
    print comment
    comment_data = {}
    comment_data['comment'] = comment.interaction_node.body
    comment_data['user'] = comment.user

    return comment_data

def getTagSummary(tag, tags):
    tags = filter(lambda x: x.interaction_node==tag, tags)
    data = {}
    data['count'] = len(tags)
    data['body'] = tag.body
    return data

def getSummary(interactions, container=None, content=None, page=None, data=None):
    if not data: data = {}
    counts = {}
    if container:
        data['kind'] = container[2]
    if content:
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
        tag for tag in sorted_counts[:5]
    ))
    top_interactions = {}
    top_interactions['tags'] = top_tags
    top_interactions['coms'] = [dict(id=comment.id, tag_id=comment.parent.interaction_node.id, content_id=comment.content.id, user=comment.user, body=comment.interaction_node.body) for comment in comments]

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

def getPage(request, pageid=None):
    canonical = request.GET.get('canonical_url', None)
    fullurl = request.GET.get('url', None)
    title = request.GET.get('title', None)
    host = request.get_host()
    host = host[0:host.find(":")]
    site = Site.objects.get(domain=host)
    if pageid:
        return Page.objects.get(id=pageid)
    elif canonical:
        page = Page.objects.get_or_create(
            canonical_url=canonical,
            defaults={'url':fullurl, 'site':site, 'title':title}
        )
    else:
        page = Page.objects.get_or_create(url=fullurl, defaults={'site': site})
        
    return page[0]

def createInteractionNode(body=None):
    if body:
        node = InteractionNode.objects.get_or_create(body=body)[0]
        print "Success getting/creating InteractionNode with id %s" % node.id
        return node

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
            tempuser =True

        # This will delete an interaction and all of it's children
        try:
            interaction.delete();
        except:
            raise JSONException("Error deleting the interaction")
        message="Deleting the interaction seems to have worked"
        if tempuser: return dict(message=message,num_interactions=num_interactions-1)
        return dict(message=message)

def createInteraction(page, container, content, user, kind, interaction_node, group=None, parent=None):
    # Check to see if user has reached their interaction limit
    tempuser = False
    if isTemporaryUser(user):
        num_interactions = checkLimit(user, group)
        tempuser =True

    interactions = Interaction.objects.filter(user=user)

    # Check unique content_id, user_id, page_id, interaction_node_id
    try:
        existing = interactions.get(
            user=user,
            page=page,
            content=content,
            interaction_node=interaction_node,
            kind=kind
        )
        print "Found existing Interaction with id %s" % existing.id
        return dict(id=existing.id, interaction=existing)
    except Interaction.DoesNotExist:
        pass

    if parent:
        print "Creating Interaction with parent node"
    else:
        print "Creating Interaction without parent node"
        parent = None
    
    try:
        new = Interaction(
            page=page,
            container=container,
            content=content,
            user=user,
            kind=kind,
            interaction_node=interaction_node,
            parent=parent
        )
    except:
        raise JSONException(u"Error creating interaction object")

    if new == None: raise JSONException(u"Error creating interaction")
    else:
        new.save()
    
    if tempuser: return dict(id=new.id, num_interactions=num_interactions+1, interaction=new)
    return dict(id=new.id, interaction=new)
