from django.conf.urls.defaults import *
from piston.resource import Resource
from piston.authentication import OAuthAuthentication
from piston.doc import documentation_view
from api.handlers import *
auth = OAuthAuthentication

#ContentNodes = Resource(handler=ContentNodeHandler, authentication=auth)
#RBGroups = Resource(handler=RBGroupHandler)
#RBPages = Resource(handler=RBPageHandler, authentication=auth)
Settings = Resource(handler=SettingsHandler, authentication=auth)
PageData = Resource(handler=PageDataHandler, authentication=auth)
Containers = Resource(handler=ContainerHandler, authentication=auth)
CreateContainers = Resource(handler=CreateContainerHandler, authentication=auth)
CreateTags = Resource(handler=CreateTagHandler, authentication=auth)
Interaction = Resource(handler=InteractionHandler, authentication=auth)
CreateComments = Resource(handler=CreateCommentHandler, authentication=auth)
FBLogin = Resource(handler=FBHandler, authentication=auth)

# Organized Resources
Interactions = Resource(handler=InteractionsHandler)

urlpatterns = patterns('',
    url(r'^settings/(\d+)/', Settings),
    # Page level
    url(r'^page/(?P<page_id>\d+)/$', Interactions),
    url(r'^page/(?P<page_id>\d+)/tags/$', Interactions, kwargs={"kind":"tag"}),
    url(r'^page/(?P<page_id>\d+)/comments/$', Interactions, kwargs={"kind":"com"}),
    # Interaction level
    url(r'^interaction/(?P<interaction_id>\d+)/$', Interactions),
    url(r'^interaction/(?P<interaction_id>\d+)/tags/$', Interactions, kwargs={"kind":"tag"}),
    url(r'^interaction/(?P<interaction_id>\d+)/comments/$', Interactions, kwargs={"kind":"com"}),
    # Container level
    url(r'^container/(?P<hash>[0-9a-fA-f]{32})+/$', Interactions),
    url(r'^container/(?P<hash>[0-9a-fA-f]{32})+/tags/$', Interactions, kwargs={"kind":"tag"}),
    url(r'^container/(?P<hash>[0-9a-fA-f]{32})+/comments/$', Interactions, kwargs={"kind":"com"}),
    
    # Facebook
    url(r'^fb/(?P<access_token>.*)/$', FBLogin),
    
    # Widget
    url(r'^page/', PageData),
    url(r'^containers/create/', CreateContainers),
    url(r'^containers/', Containers),
    url(r'^tags/create/', CreateTags),
    #url(r'^tags/(\d*)', Tags),
    url(r'^comments/create/', CreateComments),
    #url(r'^comments/', Comments),
)