from piston.handler import BaseHandler, AnonymousBaseHandler
from django.http import HttpResponse
from rb.models import *

class ContentNodeHandler(BaseHandler):
    allowed_methods = ('GET',)
    model = ContentNode
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

class RBPageHandler(BaseHandler):
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
            print "canonical url sent in get request"
            if canonical.find("#!") < 0:
                print "did not find hashbang"
            else:
                print "found hashbang"
        else:
            print "cannonical url was not sent in get request"
        print "*" * 32
        
        return HttpResponse("Page")

class RBGroupHandler(AnonymousBaseHandler):
    allowed_methods = ('GET',)
    model = RBGroup
    ordering = ('name','short_name')
    fields = ('name',
              'short_name',
              'language',
              'blessed_tags',
              'anno_whitelist',
              'img_whitelist',
              'img_blacklist',
              'no_readr',
              'feature_share',
              'feaure_rate',
              'feature_comment',
              'feature_bookmark',
              'feature_search',
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
    	path = request.path
    	fp = request.get_full_path()
        if group:
            group = int(group)
            try:
            	g = RBGroup.objects.get(id=group)
            except RBGroup.DoesNotExist:
            	return HttpResponse("Does not exist")
            setattr(g,'feature_share',g.get_feature('share'))
            setattr(g,'feature_rate',g.get_feature('rate'))
            setattr(g,'feature_comment',g.get_feature('comment'))
            setattr(g,'feature_bookmark',g.get_feature('bookmark'))
            setattr(g,'feature_search',g.get_feature('search'))
            print "Sending RBGRoup data for RBGroup %d" % group
            print g.css_url
            print "----------"
            return g
        else:
            return ("Group not specified")

"""model = ContentNode()
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
