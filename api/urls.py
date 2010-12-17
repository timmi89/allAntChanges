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

    url(r'^rbgroup/$', ContentNodes),
    url(r'^rbgroup/(?P<emitter_format>.+)/$', ContentNodes),
    url(r'^rbgroup\.(?P<emitter_format>.+)', ContentNodes),

    # automated documentation
    url(r'^$', documentation_view),
)

"""
#note-ec:
#consider changing the above to this?
#test it later, does that work? Does python parse the string first then do the regex..

urlpatterns = patterns('',
    # automated documentation
    url(r'^$', documentation_view),
)

paths = [nodes, rbgroup,] #etc
for path in paths:
    urlpatterns += patterns('',
        url(r'^'+path+'/$', ContentNodes),
        url(r'^'+path+'/(?P<emitter_format>.+)/$', ContentNodes),
        url(r'^'+path+'\.(?P<emitter_format>.+)', ContentNodes),
    )

"""