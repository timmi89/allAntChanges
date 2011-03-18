from django.conf.urls.defaults import *
from piston.resource import Resource
from piston.authentication import HttpBasicAuthentication
from piston.doc import documentation_view

#from api.handlers import ContentNodeHandler, RBGroupHandler, RBPageHandler
from api.handlers import *
auth = HttpBasicAuthentication(realm='Test API')

#ContentNodes = Resource(handler=ContentNodeHandler, authentication=auth)
#RBGroups = Resource(handler=RBGroupHandler)
#RBPages = Resource(handler=RBPageHandler, authentication=auth)
Settings = Resource(handler=SettingsHandler)
PageData = Resource(handler=PageDataHandler)
Containers = Resource(handler=ContainerHandler)
CreateContainers = Resource(handler=CreateContainerHandler)
CreateTags = Resource(handler=CreateTagHandler)
Interaction = Resource(handler=InteractionHandler)
CreateComments = Resource(handler=CreateCommentHandler)
User = Resource(handler=UserHandler)
Login = Resource(handler=LoginHandler)

# Organized Resources
Tags = Resource(handler=TagHandler)
Comments = Resource(handler=CommentsHandler)

urlpatterns = patterns('',
	url(r'^settings/(\d+)/', Settings),
	# Page level data
	url(r'^page/(?P<page_id>\d+)/$', PageData),
	url(r'^page/(?P<page_id>\d+)/tags/$', Tags),
	url(r'^page/(?P<page_id>\d+)/comments/$', Comments),
	# Interaction level data
	url(r'^interaction/(?P<interaction_id>\d+)$/', Interaction),
	url(r'^interaction/(?P<interaction_id>\d+)/tags/$', Tags),
	url(r'^interaction/(?P<interaction_id>\d+)/comments/$', Comments),
	# Container level data
	url(r'^container/(?P<hash>[0-9a-zA-Z]]{32})?', Container),
	url(r'^container/(?P<hash>[0-9a-zA-Z]]{32})?/tags/$', Tags),
	url(r'^container/(?P<hash>[0-9a-zA-Z]]{32})?/comments/$', Comments),
	
	# Older
	url(r'^containers/create/', CreateContainers),
	url(r'^containers/([0-9a-zA-Z]]{32})?/', Containers),
	url(r'^tags/create/', CreateTags),
	#url(r'^tags/(\d*)', Tags),
	url(r'^comments/create/', CreateComments),
	#url(r'^comments/', Comments),
	url(r'^user/', User),
	url(r'^login/', Login),
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
