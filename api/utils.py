from readrboard.rb.models import *
from datetime import datetime, timedelta
import json
import hashlib
import hmac
import random
from exceptions import FBException, JSONException

def getCountsAndTags(page, containers=None, content=None):
    interaction_counts = list(InteractionCount.objects.filter(page=page))
    tag_counts = list(TagCount.objects.filter(page=page).select_related('tag'))

    if containers:
      data = dict((
          (container[1],
              dict(
                  interaction_counts = filter(lambda x: x.container_id == container[0], interaction_counts),
                  top_tags = filter(lambda x: x.container_id == container[0], tag_counts)
          )) for container in containers
      ))

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

def updateCounts(user, page, container, kind, content, interaction_node):
    #updateUserCount(user)
    updateInteractionCounts(page,container,kind)
    #updateInteractionCounts(page,container,kind,content)
    updateTagCounts(page,container,interaction_node)
    updatePageCount(page)

def updateUserCount(user):
    profile = user.get_profile()
    profile.interaction_count += 1
    profile.save()

def updateInteractionCounts(page, container, kind, content=None):
    try:
      ic = InteractionCount.objects.get_or_create(page=page, container=container, content=content)[0]
      if kind == 'tag': ic.tag_count += 1
      if kind == 'com': ic.comment_count += 1
      ic.interaction_count += 1
      ic.save()
    except:
      raise JSONException("Failed creating/updating InteractionCount object!")

def updateTagCounts(page, container, interaction_node):
    try:
        tc = TagCount.objects.get_or_create(container=container, page=page, tag=interaction_node)[0]
        tc.count += 1
        tc.save()
    except:
       raise JSONException("Failed creating/updating TagCount object!")

def updatePageCount(page):
    try:
        page.interaction_count += 1
        page.save()
    except:
        raise JSONException("Failed creating/updating Page interaction count")

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
        return dict(id=existing.id)
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
        updateCounts(user,page,container,kind,content,interaction_node)
        new.save()
    if tempuser: return dict(id=new.id, num_interactions=num_interactions+1)
    return dict(id=new.id)
