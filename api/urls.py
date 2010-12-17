from django.conf.urls.defaults import *
from piston.resource import Resource
from piston.authentication import HttpBasicAuthentication
from piston.doc import documentation_view

from api.handlers import ContentNodeHandler, RBGroupHandler

auth = HttpBasicAuthentication(realm='Test API')

ContentNodes = Resource(handler=ContentNodeHandler, authentication=auth)
RBGroups = Resource(handler=RBGroupHandler, authentication=auth)

urlpatterns = patterns('',
    url(r'^nodes/$', ContentNodes),
    url(r'^nodes/(?P<emitter_format>.+)/$', ContentNodes),
    url(r'^nodes\.(?P<emitter_format>.+)', ContentNodes),
    url(r'^rbgroup/$', RBGroups),
    url(r'^rbgroup/(\d+)', RBGroups),
    # automated documentation
    #url(r'^$', documentation_view),
)
