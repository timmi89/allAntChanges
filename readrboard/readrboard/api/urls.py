from django.conf.urls.defaults import *
from piston.resource import Resource
from piston.authentication import HttpBasicAuthentication
from piston.doc import documentation_view

from api.handlers import ContentNodeHandler

auth = HttpBasicAuthentication(realm='Test API')

ContentNodes = Resource(handler=ContentNodeHandler, authentication=auth)

urlpatterns = patterns('',
    url(r'^nodes/$', ContentNodes),
    url(r'^nodes/(?P<emitter_format>.+)/$', ContentNodes),
    url(r'^nodes\.(?P<emitter_format>.+)', ContentNodes),
    # automated documentation
    url(r'^$', documentation_view),
)
