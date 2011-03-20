from piston.handler import BaseHandler, AnonymousBaseHandler
from django.http import HttpResponse
from settings import FACEBOOK_APP_SECRET
from django.db import transaction
from django.db.models import Count
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User
from lazysignup.decorators import allow_lazy_user
from utils import *

class InteractionsHandler(BaseHandler):
	allowed_methods = ('GET',)
	
	def read(self, request, **kwargs):
		nodes = InteractionNode.objects.all()
		if 'kind' in kwargs:
			nodes = nodes.filter(kind=kwargs['kind'])
		elif 'page_id' in kwargs:
			nodes = nodes.filter(interaction__page=kwargs['page_id'])
		elif 'interaction_id' in kwargs:
			nodes = nodes.filter(interaction__id=kwargs['interaction_id'])
		elif 'hash' in kwargs:
			containers = Container.objects.filter(hash=kwargs['hash'].lower())
			nodes = nodes.filter(interaction__content__container=containers)
		return nodes

class LoginHandler(BaseHandler):
	"""
	Portions of this code are from the following URL:
	http://sunilarora.org/parsing-signedrequest-parameter-in-python-bas
	"""
	allowed_methods = ('POST',)

	@staticmethod
	@allow_lazy_user
	def create(request):
		signed_request = request.POST['signed_request']
		srsplit = signed_request.split('.', 2)
		encoded_sig = srsplit[0]
		payload = srsplit[1]

		sig = base64_url_decode(encoded_sig)
		data = json.loads(base64_url_decode(payload))

		if data.get('algorithm').upper() != 'HMAC-SHA256':
			print 'Unknown FB Algo'
			return None
		else:
			expected_sig = hmac.new(FACEBOOK_APP_SECRET, msg=payload, digestmod=hashlib.sha256).digest()

		if sig != expected_sig:
			return None
				
		return data

class InteractionHandler(BaseHandler):
	allowed_methods = ('GET',)
	
	def read(self, request, id):
		interaction = Interaction.objects.get(id=id)
		tree = Interaction.get_tree(interaction)
		return tree

class UserHandler(AnonymousBaseHandler):
	allower_methods = ('GET',)
	
	def read(self, request):
		pass

class CreateCommentHandler(BaseHandler):
	allowed_methods = ('GET',)
	
	@staticmethod
	@allow_lazy_user
	def read(request):
		data = json.loads(request.GET['json'])
		comment = data['comment']
		interaction_id = data['interaction_id']
		
		user = request.user
		parent = Interaction.objects.get(id=interaction_id)
		
		comment = createInteractionNode(kind='com', body=comment)
		interaction = createInteraction(page=parent.page, content=parent.content, user=user, interaction_node=comment)

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
		page_id = data['page_id']
		
		user = request.user
		page = Page.objects.get(id=page_id)
		content = Content.objects.get_or_create(kind=content_type, body=content_data)[0]
		
		if hash:	
			container = Container.objects.get(hash=hash)
			container.content.add(content)

		interactions = []
		for utag in unknown_tags:
			if utag:
				tag = createInteractionNode(kind='tag', body=utag)
				new = createInteraction(page=page, content=content, user=user, interaction_node=tag)
				interactions.append(new)
		for ktag in known_tags:
			tag = InteractionNode.objects.get(id=ktag)
			new = createInteraction(page=page, content=content, user=user, interaction_node=tag)
			interactions.append(new)

		return Interactions

class CreateContainerHandler(AnonymousBaseHandler):
	allowed_methods = ('GET',)
	
	def read(self, request):
		result = {}
		data = json.loads(request.GET['json'])
		hashes = data['hashes']
		for hash in hashes:
			result[hash] = Container.objects.get_or_create(hash=hash, body=hashes[hash])[1]
		return result

class ContainerHandler(AnonymousBaseHandler):
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
