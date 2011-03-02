from piston.handler import BaseHandler, AnonymousBaseHandler
from django.http import HttpResponse
from settings import DEBUG
from rb.models import Group, Page, Page, Interaction, InteractionNode
from django.db.models import Count

class PageDataHandler(AnonymousBaseHandler):
	allowed_methods = ('GET',)
	#model = InteractionNode
	#fields = ('page',('node', ('id', 'kind')),)
	def read(self, request):
		canonical = request.GET.get('canonical_url')
		if DEBUG:
			page = Page.objects.get(id=1)
		else:
			page = Page.objects.get(canonical_url=canonical)
		
		# ---Get page interaction counts, grouped by kind---
		# Find all the interaction nodes on page
		nop = InteractionNode.objects.filter(interaction__page=page.id)
		# Filter values for 'kind'
		values = nop.values('kind')
		# Annotate values with count of interactions
		annotated = values.annotate(Count('interaction'))
		
		# ---Find top ten tags on a given page---
		tags = InteractionNode.objects.filter(
			interaction__page=page.id,
			kind='tag'
			).annotate(Count("id")).values("body").order_by()[:10]
			
		return annotated,tags

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
