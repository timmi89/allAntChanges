from readrboard.rb.models import *
from datetime import datetime, timedelta
import json
import hashlib
import hmac
import random
from exceptions import FBException, JSONException

def combineData(container, container_counts, tag_counts):
    result = {}
    container_count = container_counts.get(container=container)
    tag_count = tag_counts.filter(container=container)[:10]
    print container_count
    print tag_count
    print " *******"
    #result['tag_count'] = container_count.tag_count
    #result['comment_count'] = container_count.comment_count
    #reuslt['top_tags'] = tag_count
    return result

def containerData(containers, page):
    container_data = InteractionCount.objects.filter(page=page, container__in=containers)
    container_counts = container_data.values('container','comment_count','tag_count','interaction_count')
    tag_counts = TagCount.objects.filter(page=page, container__in=containers)
    
    container_data = dict((
        (container.hash, combineData(container, container_counts, tag_counts)) for container in containers
    ))

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
        else:
            print "Creating Interaction without parent node"
            parent = None

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

        if new == None: raise JSONException(u"Error creating interaction")
        else:
            ic = InteractionCount.objects.get_or_create(container=container, page=page,)[0]
            if kind == 'tag':
                ic.tag_count += 1
                tc = TagCount.objects.get_or_create(container=container, page=page, tag=interaction_node)[0]
                tc.count += 1
                tc.save()
            if kind == 'com': cd.comment_count += 1
            ic.interaction_count += 1
            ic.save()
            new.save()
        if tempuser: return dict(id=new.id, num_interactions=num_interactions+1)
        return dict(id=new.id)
