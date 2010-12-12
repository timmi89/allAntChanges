from piston.handler import BaseHandler, AnonymousBaseHandler
from rb.models import *

class ContentNodeHandler(BaseHandler):
    allowed_methods = ('GET',)
    model = ContentNode
    fields = ('hash', 'type',)

    def read(self, request):
        # called on GET requests
        # never modifies data
        return ContentNode.objects.all()

    #def create(self, request):
        # called on POST and creates new
        # objects and should them or rc.CREATED

class GroupHandler(BaseHandler):
    allowed_methods = ('GET',)
    model = RBGroup
    fields = ('include_selectors', 'no_rdr_selectors')

    def read(self, request, group):
        return Group.objects.filter(id=group)
    
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
