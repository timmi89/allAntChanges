from piston.handler import BaseHandler, AnonymousBaseHandler
from piston.urls import rc, require_mine, require_extended

from rb.models import *

class ContentNodeHandler(BaseHandler):
    model = ContentNode()
    fields = ('id','user','hash')

    def read(self, request, hash=None):
        """
        Returns a ContentNode, if hash is given,
        otherwise all the ContentNodes are returned.
        """
        base = ContentNode.objects

        if hash:
            return base.get(hash.hash)
        else:
            return base.all()

    def create(self, request):
        """
        Creates a new ContentNode
        """
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
