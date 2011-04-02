from readrboard.rb.models import *
from django.utils.hashcompat import sha_constructor
import datetime
import json

def createToken(soc_id, auth_token, group_secret):
	print "Creating readr_token"
        return sha_constructor(
	    unicode(soc_id) +
            unicode(auth_token) +
            unicode(group_secret)
        ).hexdigest()[::2]

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
			node = InteractionNode.objects.get_or_create(kind=kind, body=comment)[0]
			print "Success creating InteractionNode with id %s" % node.id
			return node

def createInteraction(page, content, user, interaction_node, parent=None):
	if content and user and interaction_node:
		# Can't rely on Django's auto_now to create the time before storing the node
		now = created=datetime.datetime.now()
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
		return new
