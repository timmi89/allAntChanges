from piston.handler import BaseHandler, AnonymousBaseHandler
from rb.models import *

class ContentNodeHandler(BaseHandler):
    allowed_methods = ('GET',)
    model = ContentNode
    fields = ('hash', 'type',)

    def read(self, request):
        # called on GET requests
        #print request.GET.getlist('hashes[]')
        for node in request.GET.getlist('hashes[]'):
            print node
        return ContentNode.objects.all()

    #def create(self, request):
        # called on POST and creates new
        # objects and should them or rc.CREATED

class RBGroupHandler(BaseHandler):
    allowed_methods = ('GET',)
    model = RBGroup
    fields = ('name', 'public_id', 'selector_whitelist', 'selector_blacklist', 'tag_whitelist', 'tag_blacklist', 'css_url')

    def read(self, request, public_id=None):
        if public_id:
            public_id = str(public_id)  #TODO: how and where is this data cleaned
            return RBGroup.objects.filter(public_id=public_id)
        else:
            return RBGroup.objects.all()

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
