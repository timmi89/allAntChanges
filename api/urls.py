from django.conf.urls.defaults import *
from piston.resource import Resource
from piston.authentication import HttpBasicAuthentication
from piston.doc import documentation_view
from api.handlers import *
auth = HttpBasicAuthentication()

Settings = Resource(handler=SettingsHandler)
PageData = Resource(handler=PageDataHandler)
Containers = Resource(handler=ContainerHandler)
CreateContainers = Resource(handler=CreateContainerHandler)
CreateTags = Resource(handler=CreateTagsHandler)
CreateTag = Resource(handler=CreateTagHandler)
Interaction = Resource(handler=InteractionHandler)
CreateComments = Resource(handler=CreateCommentHandler)
FBLogin = Resource(handler=FBHandler)
TokenKill = Resource(handler=TokenKillHandler)

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
    url(r'^fb/$', FBLogin),
    
    # Token auth
    url(r'^token/kill/$', TokenKill),

    # Widget
    url(r'^page/', PageData),
    url(r'^containers/create/', CreateContainers),
    url(r'^containers/', Containers),
    url(r'^tags/create/', CreateTags),
    url(r'^tag/create', CreateTag),
    #url(r'^tags/(\d*)', Tags),
    url(r'^comments/create/', CreateComments),
    #url(r'^comments/', Comments),
)

# OAuthTest
urlpatterns += patterns(
    'piston.authentication',
    url(r'^oauth/request_token/$','oauth_request_token'),
    url(r'^oauth/authorize/$','oauth_user_auth'),
    url(r'^oauth/access_token/$','oauth_access_token'),
)
