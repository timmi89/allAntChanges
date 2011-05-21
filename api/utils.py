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

def getTagData(tag, tags, comments):
    # Make list of unique content and grab the InteractionNode objects
    
    tags = filter(lambda x: x.interaction_node==tag, tags)
    comments = filter(lambda x: x.parent in tags, comments)

    tag_data = {}
    tag_data['tag'] = tag.body
    tag_data['id'] = tag.id
    tag_data['count'] = len(tags)
    
    tag_data['comments'] = [getTagCommentData(comment) for comment in comments]

    return tag_data

def getContentData(content_item, interactions):
    data = {}
    data['body'] = content_item.body
    
    content_interactions = filter(lambda x: x.content==content_item, interactions)

    # Filter tag and comment interactions
    content_tags = filter(lambda x: x.kind=='tag', content_interactions)
    content_coms = filter(lambda x: x.kind=='com', content_interactions)

    data['tag_count'] = len(content_tags)
    data['com_count'] = len(content_coms)

    tags = set((tag.interaction_node for tag in content_tags))

    # Retrieve data on individual tags
    data['tags'] = [getTagData(tag, content_tags, content_coms) for tag in tags]
    
    return data

def getContainerData(hash, interactions, content):
    container_data = {}
    # Get interaction on the provided hash
    hash_interactions = filter(lambda x: x.container==hash, interactions)

    # Filter tag and comment interactions
    tags = filter(lambda x: x.kind=='tag', hash_interactions)
    comments = filter(lambda x: x.kind=='com', hash_interactions)

    # Get counts of tags and comments -- container level
    container_data['tag_count'] = len(tags)
    container_data['com_count'] = len(comments)
    
    # Make list of unique content within container and retrieve their Content objects
    content_unique = set((interaction.content for interaction in hash_interactions))
    
    container_data['content'] = [getContentData(content_item, hash_interactions) for content_item in content_unique]
    
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

def createInteractionNode(body=None):
    if body:
        node = InteractionNode.objects.get_or_create(body=body)[0]
        print "Success creating InteractionNode with id %s" % node.id
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

def createInteraction(page, container, content, user, kind, interaction_node, group, parent=None):
    if content and user and kind and interaction_node and page:
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
                kind=kind,
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
                kind=kind, 
                interaction_node=interaction_node, 
                created=now
            )
        if new == None: raise JSONException(u"Error creating interaction")
        new.save()
        if tempuser: return dict(id=new.id, num_interactions=num_interactions+1)
        return dict(id=new.id)
