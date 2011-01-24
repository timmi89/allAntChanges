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
    # Is this right? - ask Tyler..
    #url(r'^rbgroup/(\d+)', RBGroups),
    url(r'^rbgroup/(?P<group>\d+)', RBGroups),

    # automated documentation
    #url(r'^$', documentation_view),
)

"""
#note-ec:
#Thinking outloud, if we have a lot of similar lines for different paths,
#might be fun later to think of how to write it effiecently?
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