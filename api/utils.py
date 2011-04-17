from readrboard.rb.models import *
from datetime import datetime, timedelta
import json
import hashlib
import hmac
import random
from exceptions import FBException, JSONException

def getPage(request, pageid=None):
    canonical = request.GET.get('canonical_url', None)
    fullurl = request.GET.get('url', None)
    host = request.get_host()
    host = host[0:host.find(":")]
    site = Site.objects.get(domain=host)
    if pageid:
        return Page.objects.get(id=pageid)
    elif canonical:
        page = Page.objects.get_or_create(canonical_url=canonical, defaults={'url': fullurl, 'site': site})
    else:
        page = Page.objects.get_or_create(url=fullurl, defaults={'site': site})
        
    if page[1] == True: print "Created page {0}".format(page)

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
            raise JSONException("Something bad happened when we tried to delete the interaction")
        message="Deleting the interaction seems to have worked"
        if tempuser: return dict(message=message,num_interactions=num_interactions-1)
        return dict(message=message)

def createInteraction(page, content, user, interaction_node, group, parent=None):
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
            new = parent.add_child(page=page, 
                           content=content, 
                           user=user, 
                           interaction_node=interaction_node,
                           created=now)
        else:
            print "Creating Interaction without parent node"
            new = Interaction.add_root(page=page, 
                           content=content, 
                           user=user, 
                           interaction_node=interaction_node, 
                           created=now)
        if new == None: raise JSONException(u"Error creating interaction")
        if tempuser: return dict(id=new.id, num_interactions=num_interactions+1)
        return dict(id=new.id)
