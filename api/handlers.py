from piston.handler import BaseHandler, AnonymousBaseHandler
from django.http import HttpResponse
#from settings import DEBUG
from rb.models import Group, Page, Interaction, InteractionNode, User, Content, Site, Container
from django.db.models import Count

def getPage(request, pageid=None):
	canonical = request.GET['canonical_url']
	fullurl = request.GET['url']
	host = request.get_host()
        host = host[0:host.find(":")]
	site = Site.objects.get(domain=host)
	if pageid:
		return Page.objects.get(id=pageid)
	elif canonical:
		page = Page.objects.get_or_create(canonical_url=canonical, defaults={'url': fullurl, 'site': site})
	else:
		page = Page.objects.get_or_create(url=fullurl, defaults={'site': site.id})
		
	if page[1] == True: print "Created page {0}".format(page)

	return page[0]

class TagHandler(AnonymousBaseHandler):
	allowed_methods = ('GET',)
	
	def read(self, request):
		tag_bodies = request.GET.getlist('tags[]')
		hash = request.GET['hash']
		content = request.GET['content']
		content_type = request.GET['content_type']
		user = request.GET['user']
		page = getPage(request)
		
		content = Content.get_or_create(kind=content_type, body=content)
		containter = Container.get_or_create(hash=hash, content=content, defaults={'body': container_body})
		
		for tag in tag_bodies:
			tag = InteractionNode.get_or_create(kind='tag', body=tag_body)
			new_interaction = Interaction(page=page, content=content, node=tag, user=user)
			new_interaction.save()

class CreateContainerHandler(AnonymousBaseHandler):
	allowed_methods = ('GET',)
	
	def read(self, request):
		result = {}
		data = request.GET['data']
		for hash in data.keys():
			result[hash] = Container.get_or_create(hash=hash, body=data['hash'])[1]
		return result

class ContainerHandler(AnonymousBaseHandler):
	allowed_methods = ('GET',)
	
	def read(self, request, container=None):
		known = {}
		unknown = []
		if container: hashes = [container]
		else: hashes = request.GET.getlist('hashes[]')
		
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
		content = Content.objects.filter(interaction__page=page.id,interaction__node__kind='shr')
		sharecounts = content.annotate(Count("id"))
		topshares = sharecounts.values("body").order_by()[:10]	
		
		# ---Find top 10 users on a given page---
		users = User.objects.filter(interaction__page=page.id)
		usernames = users.values('first_name', 'last_name')
		userinteract = usernames.annotate(interactions=Count('interaction'))[:10]
		
		return dict(summary=summary, toptags=toptags, topusers=userinteract, topshares=topshares)

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
        #testing
        #print request
        #print request.GET['short_name']

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


"""
class ContentNodeHandler(BaseHandler):
    allowed_methods = ('GET',)
    model = Node
    fields = ('hash', 'type',)

    def read(self, request):
        # called on GET requests
        #print request.GET.getlist('hashes[]')
        print "These are the items in the get request:"
        for item in request.GET:
            print item, '=>', request.GET.get(item)
        print "These are the hashes:"
        print "*" * 32
        for node in request.GET.getlist('hashes[]'):
            print node
        print "*" * 32
        return ContentNode.objects.all()

    #def create(self, request):
        # called on POST and creates new
        # objects and should them or rc.CREATED

class RBPageHandler(AnonymousBaseHandler):
    allowed_methods = ('GET',)
    model = RBPage
    def read(self, request):
        print "Items in RBPage request:"
        print "*" * 32
        for item in request.GET:
            print item, '=>', request.GET.get(item)
        print "*" * 32
        print "***URL INFO IN RBPAGE REQUEST***"
        canonical = request.GET.get('canonical_url')
        if canonical:
            print "canonical url sent in get request: %s" % canonical
            if canonical.find("#!") < 0:
                print "did not find hashbang"
            else:
                print "found hashbang"
        else:
            print "cannonical url was not sent in get request"
        print "*" * 32
        
        return HttpResponse("Page")

model = ContentNode()
   fields = ('id','user','hash')

   def read(self, request, hash=None):
       #Returns a ContentNode, if hash is given,
       #otherwise all the ContentNodes are returned.
       ase = ContentNode.objects

       if hash:
           return base.get(hash.hash)
       else:
           return base.all()

   def create(self, request):
       Creates a new ContentNode
       attrs = self.flatten_dict(request.POST)

       if self.exists(**attrs):
           return rc.DUPLICATE_ENTRY
       else:
           node = ConentNode(
               user=attrs['user'],
               type=attrs['type'],
               page=attrs['page'],
               hash=attrs['hash'],
               content=attrs['content'])
           node.save()
           return node
"""
