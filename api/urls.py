from django.conf.urls.defaults import *
from piston.resource import Resource
from piston.doc import documentation_view
from api.handlers import *
from api.auth_handlers import *

Settings = Resource(handler=SettingsHandler)
PageData = Resource(handler=PageDataHandler)
Containers = Resource(handler=ContainerSummaryHandler)
CreateContainers = Resource(handler=CreateContainerHandler)
Tag = Resource(handler=TagHandler)
Comment = Resource(handler=CommentHandler)
FBLogin = Resource(handler=FBHandler)
Deauthorize = Resource(handler=Deauthorize)
TempUser = Resource(handler=TempUserHandler)
Content = Resource(handler=ContentSummaryHandler)
Share = Resource(handler=ShareHandler)
Bookmark = Resource(handler=BookmarkHandler)

urlpatterns = patterns('',
    url(r'^settings/(\d+)/$', Settings),
    # Page level
    #url(r'^page/(?P<page_id>\d+)/$', Interactions),
    #url(r'^page/(?P<page_id>\d+)/tags/$', Interactions, kwargs={"kind":"tag"}),
    #url(r'^page/(?P<page_id>\d+)/comments/$', Interactions, kwargs={"kind":"com"}),
    # Interaction level
    #url(r'^interaction/(?P<interaction_id>\d+)/$', Interactions),
    #url(r'^interaction/(?P<interaction_id>\d+)/tags/$', Interactions, kwargs={"kind":"tag"}),
    #url(r'^interaction/(?P<interaction_id>\d+)/comments/$', Interactions, kwargs={"kind":"com"}),
    # Container level
    #url(r'^container/(?P<hash>[0-9a-fA-f]{32})+/$', Interactions),
    #url(r'^container/(?P<hash>[0-9a-fA-f]{32})+/tags/$', Interactions, kwargs={"kind":"tag"}),
    #url(r'^container/(?P<hash>[0-9a-fA-f]{32})+/comments/$', Interactions, kwargs={"kind":"com"}),
    
    # Facebook
    url(r'^fb/$', FBLogin),
    
    # Auth
    url(r'^deauthorize/$', Deauthorize),
    url(r'^tempuser/$', TempUser),

    # Widget
    url(r'^page/', PageData),
    url(r'^containers/create/', CreateContainers),
    url(r'^summary/containers/', Containers),
    url(r'^summary/container/content', Content),
    url(r'^tag/create/', Tag, kwargs={'action':'create'}),
    url(r'^tag/remove/', Tag, kwargs={'action':'delete'}),
    url(r'^bookmark/create/', Bookmark, kwargs={'action':'create'}),
    url(r'^bookmark/remove/', Bookmark, kwargs={'action':'delete'}),
    url(r'^share/', Share, kwargs={'action':'create'}),
    #url(r'^tags/(\d*)', Tags),
    url(r'^comment/create/', Comment, kwargs={'action':'create'}),
    url(r'^comment/replies/', Comment, kwargs={'action':'view'})
    #url(r'^comments/', Comments),
)
