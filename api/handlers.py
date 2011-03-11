from piston.handler import BaseHandler, AnonymousBaseHandler
from django.http import HttpResponse
#from settings import DEBUG
from rb.models import Group, Page, Interaction, InteractionNode, User, Content, Site, Container, Interaction
from django.db import transaction
from django.db.models import Count
from django.shortcuts import get_object_or_404
from django.utils.encoding import smart_unicode
from django.contrib.auth.models import User
from lazysignup.decorators import allow_lazy_user
import datetime
import json

def getPage(request, pageid=None):
	canonical = request.GET.get('canonical_url', None)
	fullurl = request.get_full_path()
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

class InteractionHandler(BaseHandler):
	allowed_methods = ('GET',)
	
	def read(self, request, id):
		interaction = Interaction.objects.get(id=id)
		tree = Interaction.get_tree(interaction)
		return tree

class UserHandler(AnonymousBaseHandler):
	allower_methods = ('GET',)
	
	def read(self, request):
		print "Creating anonymous user"
		user = User.objects.create_user('temp', 'anonymous@readrboard')
		user.set_unusable_password()
		user.save()
		return user.id

class CreateCommentHandler(BaseHandler):
	allowed_methods = ('GET',)
	
	def read(self, request):
		data = json.loads(request.GET['json'])
		comment = data['comment']
		interaction_id = data['interaction_id']
		user_id = data['user_id']
		
		user = User.objects.get(id=user_id)
		parent = Interaction.objects.get(id=interaction_id)
		
		now = created=datetime.datetime.now()
		
		comment = InteractionNode.objects.get_or_create(kind='com', body=comment)[0]
		parent.add_child(page=parent.page, content=parent.content, user=user, interaction_node=comment, created=now)

class TagHandler(AnonymousBaseHandler):
	allowed_methods = ('GET',)
	
	def read(self, request, id):
		if tag:
			tags = InteractionNode.objects.get_or_create(kind='tag', id=id)

class CreateTagHandler(BaseHandler):
	allowed_methods = ('GET',)
	
	@staticmethod
	@allow_lazy_user
	def read(request):
		data = json.loads(request.GET['json'])
		unknown_tags = data['unknown_tags']	
		known_tags = data['known_tags']
		hash = data['hash']
		content_data = data['content']
		content_type = data['content_type']
		user_id = data['user_id']
		page_id = data['page_id']
		
		user = User.objects.get(id=user_id)
		page = Page.objects.get(id=page_id)
		content = Content.objects.get_or_create(kind=content_type, body=content_data)[0]
		
		if hash:	
			container = Container.objects.get(hash=hash)
			container.content.add(content)

		# Can't rely on Django's auto_now to create the time before storing the node
		now = created=datetime.datetime.now()
		
		for utag in unknown_tags:
			if utag:
				tag = InteractionNode.objects.get_or_create(kind='tag', body=utag)[0]
				Interaction.add_root(page=page, content=content, user=user, interaction_node=tag, created=now)
			
		for ktag in known_tags:
			tag = InteractionNode.objects.get(id=ktag)
			Interaction.add_root(page=page, content=content, user=user, interaction_node=tag, created=now)
		
		return "Success!"

class CreateContainerHandler(BaseHandler):
	allowed_methods = ('GET',)
	def read(self, request):
		result = {}
		data = json.loads(request.GET['json'])
		hashes = data['hashes']
		for hash in hashes:
			result[hash] = Container.objects.get_or_create(hash=hash, body=hashes[hash])[1]
		return result

class ContainerHandler(BaseHandler):
	allowed_methods = ('GET',)
	
	def read(self, request, container=None):
		data = json.loads(request.GET['json'])
		known = {}
		unknown = []
		if container: hashes = [container]
		else: hashes = data['hashes']
		for hash in hashes:
			try:
				known[hash] = Container.objects.get(hash=hash)
			except Container.DoesNotExist:
				unknown.append(hash)

		for hash in known.keys():
			info = {}
			nodes = InteractionNode.objects.filter(interaction__content__container__hash=hash)
			info['knowntags'] = nodes.filter(kind='tag').values('body')
			info['comments'] = nodes.filter(kind='com').values('body')
			info['bookmarks'] = nodes.filter(kind='bkm').values('body')
			known[hash] = info
			
		return dict(known=known, unknown=unknown)

class PageDataHandler(AnonymousBaseHandler):
	allowed_methods = ('GET',)
	#model = InteractionNode
	#fields = ('page',('node', ('id', 'kind')),)
	
	def read(self, request, pageid=None):
		page = getPage(request, pageid)
		
		# Find all the interaction nodes on page
		nop = InteractionNode.objects.filter(interaction__page=page.id)
		
		# ---Get page interaction counts, grouped by kind---
		# Filter values for 'kind'
		values = nop.values('kind')
		# Annotate values with count of interactions
		summary = values.annotate(Count('interaction'))
		
		# ---Find top 10 tags on a given page---
		tags = nop.filter(kind='tag')
		tagcounts = tags.annotate(Count("id"))
		toptags = tagcounts.values("body").order_by()[:10]
			
		# ---Find top 10 shares on a give page---
		content = Content.objects.filter(interaction__page=page.id,interaction__interaction_node__kind='shr')
		sharecounts = content.annotate(Count("id"))
		topshares = sharecounts.values("body").order_by()[:10]	
		
		# ---Find top 10 users on a given page---
		users = User.objects.filter(interaction__page=page.id)
		usernames = users.values('first_name', 'last_name')
		userinteract = usernames.annotate(interactions=Count('interaction'))[:10]
		
		return dict(id=page.id, summary=summary, toptags=toptags, topusers=userinteract, topshares=topshares)

class SettingsHandler(AnonymousBaseHandler):
    allowed_methods = ('GET',)
    model = Group
    ordering = ('name','short_name')
    fields = ('id',
              'name',
              'short_name',
              'language',
              'blessed_tags',
              'anno_whitelist',
              'img_whitelist',
              'img_blacklist',
              'no_readr',
              ('share', ('images', 'text', 'flash')),
              ('rate', ('images', 'text', 'flash')),
              ('comment', ('images', 'text', 'flash')),
              ('bookmark', ('images', 'text', 'flash')),
              ('search', ('images', 'text', 'flash')),
              'logo_url_sm',
              'logo_url_med',
              'logo_url_lg',
              'css_url',
             )

    def read(self, request, group=None):
        host = request.get_host()
        # Slice off port from hostname
        host = host[0:host.find(":")]
    	path = request.path
        """
        print "host: ", host[0:host.find(":")]
        print "path: ", path
        print "sent host: ", request.GET['host_name']
        """
        fp = request.get_full_path()
        if group:
            group = int(group)
            try:
            	g = Group.objects.get(id=group)
            except Group.DoesNotExist:
            	return HttpResponse("RB Group does not exist!")
            if host in g.valid_domains:
                print "host %s is valid for group %d" % (host,group)
            else:
                print "host %s is not valid for group %d" % (host,group)
            print "Sending RBGRoup data for RBGroup %d" % group
            print g.css_url
            print "----------"
            return g
        else:
            return ("Group not specified")
