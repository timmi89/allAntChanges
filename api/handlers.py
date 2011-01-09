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
        for node in request.GET.getlist('hashes[]'):
            print node
        return ContentNode.objects.all()

    #def create(self, request):
        # called on POST and creates new
        # objects and should them or rc.CREATED

class RBGroupHandler(BaseHandler):
    allowed_methods = ('GET',)
    model = RBGroup
    fields = ('name', 'short_name', 'include_selectors', 'no_rdr_selectors', 'css')

    def read(self, request, group=None):
    	host = request.get_host()
    	path = request.path
    	fp = request.get_full_path()
        if group:
            group = int(group)
            #return RBGroup.objects.filter(id=group)
            try:
            	g = RBGroup.objects.get(id=group)
            except RBGroup.DoesNotExist:
            	return HttpResponse("Does not exist")
            else:
            	return g
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
