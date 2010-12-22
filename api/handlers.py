from piston.handler import BaseHandler, AnonymousBaseHandler
from rb.models import *

class ContentNodeHandler(BaseHandler):
    allowed_methods = ('GET',)
    model = ContentNode
    fields = ('hash', 'type',)

    def read(self, request):
        # called on GET requests
        print request.GET.getlist('hashes[]')
        for node in request.GET.getlist('hashes[]'):
            print node
        return ContentNode.objects.all()

    #def create(self, request):
        # called on POST and creates new
        # objects and should them or rc.CREATED

class RBGroupHandler(BaseHandler):
    allowed_methods = ('GET',)
    model = RBGroup
    fields = ('name', 'short_name', 'selector_whitelist', 'selector_blacklist', 'tag_whitelist', 'tag_blacklist', 'css_url')

    def read(self, request, short_name=None):

        # testing
        #print request '''investigating request object'''
        domain = request.META['REMOTE_ADDR'] # '127.0.0.1'  ...  # or do we use the tools in django sites instead? http://docs.djangoproject.com/en/dev/ref/contrib/sites/
        print "domain is " + domain

        #hack to get a string out of the single unicode list item  - how to do this for real?  str() didn't work.. look into it..
        for str_short_name in request.GET.getlist('short_name'): #TODO: how and where is this data cleaned - investigate piston and forms
            print str_short_name
            return RBGroup.objects.filter(short_name=str_short_name)
        else:
            return RBGroup.objects.all()

        """
class RBUserHandler(BaseHandler):
    allowed_methods = ('GET',)
    model = RBGroup
    fields = ('name', 'first_name', )

    def read(self, request, short_name=None):

        # testing
        #print request '''investigating request object'''
        domain = request.META['REMOTE_ADDR'] # '127.0.0.1'  ...  # or do we use the tools in django sites instead? http://docs.djangoproject.com/en/dev/ref/contrib/sites/
        print "domain is " + domain

        #hack to get a string out of the single unicode list item  - how to do this for real?  str() didn't work.. look into it..
        for str_short_name in request.GET.getlist('short_name'): #TODO: how and where is this data cleaned - investigate piston and forms
            print str_short_name
            return RBGroup.objects.filter(short_name=str_short_name)
        else:
            return RBGroup.objects.all()
"""

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
