from readrboard.rb.models import *
from datetime import datetime, timedelta
import json
import hashlib
import hmac
import random
from exceptions import FBException, JSONException

def getTagCommentData(tag, tags, comments):
    tag_comments = []        
    for comment in comments.filter(parent=tags.filter(interaction_node=tag)):
        comment_data = {}
        comment_data['comment'] = comment.interaction_node.body
        comment_data['user'] = comment.user
        tag_comments.append(comment_data)

    return tag_comments

def getTagData(tags, comments):
    # Get information about the tags
    tags_data = []

    # Make list of unique content and grab the InteractionNode objects
    tag_unique = tags.order_by('interaction_node').distinct().values('interaction_node')
    tag_objs = InteractionNode.objects.filter(id__in=tag_unique)
    
    for tag_item in tag_objs:
        tag_data = {}
        tag_data['tag'] = tag_item.body
        tag_data['id'] = tag_item.id
        tag_data['count'] = tags.filter(interaction_node=tag_item).count()
        tag_data['comments'] = getTagCommentData(tag_item, tags, comments)
        tags_data.append(tag_data)

    return tags_data

def getContentData(interactions, content_objs):
    content = []

    for content_item in content_objs:
        data = {}
        data['body'] = content_item.body
        
        # Filter interactions for this piece of content and get count data
        content_interactions = interactions.filter(content=content_item).select_related('interaction_node')
        content_tags = content_interactions.filter(interaction_node__kind='tag')
        content_coms = content_interactions.filter(interaction_node__kind='com')
        data['tag_count'] = content_tags.count()
        data['comment_count'] = content_coms.count()
        data['tags'] = getTagData(content_tags, content_coms)
        
        content.append(data)

    return content

def getContainerData(hash):
    container_data = {}
    # Get everything we know about this hash
    interactions = Interaction.objects.filter(container__hash=hash)

    # Filter tag and comment interactions
    tags = interactions.filter(interaction_node__kind='tag')
    comments = interactions.filter(interaction_node__kind='com')

    # Get counts of tags and comments -- container level
    container_data['tag_count'] = tags.count()
    container_data['comment_count'] = comments.count()
    
    # Make list of unique content and retrieve their Content objects
    content_unique = interactions.order_by('content').distinct().values('content')
    content_objs = Content.objects.filter(id__in=content_unique)

    container_data['content'] = getContentData(interactions, content_objs)

    return container_data

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
    host = request.get_host()
    host = host[0:host.find(":")]
    site = Site.objects.get(domain=host)
    if pageid:
        return Page.objects.get(id=pageid)
    elif canonical:
        page = Page.objects.get_or_create(
            canonical_url=canonical,
            defaults={'url': fullurl, 'site': site}
        )
    else:
        page = Page.objects.get_or_create(url=fullurl, defaults={'site': site})
        
    return page[0]

def createInteractionNode(kind, body):
    if kind and body:
        node = InteractionNode.objects.get_or_create(kind=kind, body=body)[0]
        print "Success creating InteractionNode with id %s" % node.id
        return node

def isTemporaryUser(user):
    return len(SocialUser.objects.filter(user__id=user.id)) == 0

def checkLimit(user, group):
    interactions = Interaction.objects.filter(user=user)
    num_interactions = len(interactions)
    max_interact = group.temp_interact
    if num_interactions >= max_interact:
        raise JSONException(
            u"Temporary user interaction limit reached"
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

def createInteraction(page, container, content, user, interaction_node, group, parent=None):
    if content and user and interaction_node and page:
        # Check to see if user has reached their interaction limit
        tempuser = False
        if isTemporaryUser(user):
            num_interactions = checkLimit(user, group)
            tempuser =True

        interactions = Interaction.objects.filter(user=user)

        # Check unique content_id, user_id, page_id, interaction_node_id
        try:
            existing = interactions.get(
                page=page,
                content=content,
                interaction_node=interaction_node
            )
            print "Found existing Interaction with id %s" % existing.id
            return dict(id=existing.id)
        except Interaction.DoesNotExist:
            pass

        # Can't rely on Django's auto_now to create the time before storing the node
        now = datetime.now()

        if parent:
            print "Creating Interaction with parent node"
            new = Interaction(
                page=page,
                container=container,
                content=content,
                user=user, 
                interaction_node=interaction_node,
                created=now,
                parent=parent
            )
        else:
            print "Creating Interaction without parent node"
            new = Interaction(
                page=page,
                container=container,
                content=content, 
                user=user, 
                interaction_node=interaction_node, 
                created=now
            )
        if new == None: raise JSONException(u"Error creating interaction")
        new.save()
        if tempuser: return dict(id=new.id, num_interactions=num_interactions+1)
        return dict(id=new.id)
