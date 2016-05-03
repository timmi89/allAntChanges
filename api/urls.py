from django.conf.urls.defaults import *
from piston.resource import Resource
from piston.doc import documentation_view
from api.handlers import *
from api.auth_handlers import *

Settings = Resource(handler=SettingsHandler)
PageData = Resource(handler=PageDataHandler)
PageDataNewer = Resource(handler=PageDataHandlerNewer)
CrossPageContainer = Resource(handler=CrossPageContainerHandler)
Containers = Resource(handler=ContainerSummaryHandler)
CreateContainers = Resource(handler=CreateContainerHandler)
ContentBodies = Resource(handler=ContentBodiesHandler)
Tag = Resource(handler=TagHandler)
MeToo = Resource(handler=MeTooHandler)
TagRemove = Resource(handler=TagRemoveHandler)
Comment = Resource(handler=CommentHandler)
FBLogin = Resource(handler=FBHandler)
ANTLogin = Resource(handler=ANTHandler)
Deauthorize = Resource(handler=Deauthorize)
TempUser = Resource(handler=TempUserHandler)
Content = Resource(handler=ContentSummaryHandler)
Share = Resource(handler=ShareHandler)
Bookmark = Resource(handler=BookmarkHandler)
Vote = Resource(handler=VoteHandler)
Moderate = Resource(handler=ModerationHandler)
Privacy = Resource(handler=PrivacyHandler)
FollowEmail = Resource(handler=FollowEmailHandler)
NotificationEmail = Resource(handler=NotificationEmailHandler)
Confirmation = Resource(handler=ConfirmUserHandler)
Follow = Resource(handler=FollowHandler)
UnFollow = Resource(handler=UnFollowHandler)
FollowedEntity = Resource(handler=FollowedEntityHandler)
EntitySearch = Resource(handler=EntitySearchHandler)
StreamResponse = Resource(handler=StreamResponseHandler)
StreamComment = Resource(handler=StreamCommentHandler)
PlusOneUsers = Resource(handler=PlusOneUserHandler)
BoardAdd = Resource(handler=BoardAddHandler)
UserBoards = Resource(handler=UserBoardsHandler)
BoardSearch = Resource(handler=BoardSearchHandler)
FollowsBoards = Resource(handler=FollowedBoardsHandler)
GlobalActivity = Resource(handler=GlobalActivityHandler)
BlockedTag = Resource(handler=BlockedTagHandler)
ApprovedTag = Resource(handler=ApprovedTagHandler)
BlockedPromoTag = Resource(handler=BlockedPromoTagHandler)
CachePageRefresh = Resource(handler=CachePageRefreshHandler)
CachePageRefreshNewer = Resource(handler=CachePageRefreshHandlerNewer)
CacheSettingsRefresh = Resource(handler=CacheSettingsRefreshHandler)
CacheContentRecRefresh = Resource(handler=CacheContentRecRefreshHandler)
Uptime = Resource(handler=UptimeHandler)
ContentRec = Resource(handler=ContentRecHandler)


urlpatterns = patterns('',
    url(r'^settings/$', Settings),
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
    url(r'^ant/$', ANTLogin),
    
    # Auth
    url(r'^deauthorize/$', Deauthorize),
    url(r'^tempuser/$', TempUser),
    url(r'^confirmuser/$', Confirmation),

    #Utility
    url(r'^cache/page/refresh/(?P<page_id>\d+)', CachePageRefresh),
    url(r'^cache/page/refresh/(?P<page_id>\d+)/(?P<hash>\d+)', CachePageRefresh),
    url(r'^cache/page/newer/refresh/(?P<page_id>\d+)', CachePageRefreshNewer),
    url(r'^cache/settings/refresh/(?P<group_id>\d+)', CacheSettingsRefresh),
    url(r'^cache/contentrec/refresh/(?P<group_id>\d+)', CacheContentRecRefresh),
    url(r'^uptime_check/', Uptime),

    # Content Rec
    url(r'^contentrec/', ContentRec),

    # Widget
    url(r'^pagenewer/', PageDataNewer),
    url(r'^page/', PageData),
    url(r'^crosspage/', CrossPageContainer),
    url(r'^containers/create/', CreateContainers),
    url(r'^content/bodies/', ContentBodies),
    url(r'^summary/containers/', Containers),
    url(r'^summary/container/content', Content),
    url(r'^metoo', MeToo),
    url(r'^tagremove', TagRemove),
    url(r'^tag/block/(?P<group_id>\d+)/(?P<node_id>\d+)', BlockedTag),
    url(r'^tag/approve/(?P<group_id>\d+)/(?P<node_id>\d+)', ApprovedTag),
    url(r'^promotag/block/(?P<group_id>\d+)/(?P<node_id>\d+)', BlockedPromoTag),
    url(r'^tag/create/', Tag, kwargs={'action':'create'}),
    url(r'^tag/remove/', Tag, kwargs={'action':'delete'}),
    url(r'^bookmark/create/', Bookmark, kwargs={'action':'create'}),
    url(r'^bookmark/remove/', Bookmark, kwargs={'action':'delete'}),
    url(r'^share/', Share, kwargs={'action':'create'}),
    url(r'^vote/up/', Vote, kwargs={'action': 'create', 'direction': 'up'}),
    #url(r'^tags/(\d*)', Tags),
    url(r'^comment/create/', Comment, kwargs={'action':'create'}),
    url(r'^comment/replies/', Comment, kwargs={'action':'view'}),
    url(r'^admin_request/', FBLogin, kwargs={"admin_req": True}),
    url(r'^moderate/toggle/', Moderate),
    url(r'^privacy/toggle/', Privacy),
    url(r'^followemail/toggle/', FollowEmail),
    url(r'^notificationemail/toggle/', NotificationEmail),
    url(r'^follow/', Follow),
    url(r'^unfollow/', UnFollow),
    url(r'^entity/follow/', FollowedEntity),
    url(r'^entity/search/', EntitySearch),
    url(r'^stream/response/', StreamResponse),
    url(r'^stream/comment/', StreamComment),
    url(r'^plusones', PlusOneUsers),
    url(r'^boardadd', BoardAdd, kwargs={'action':'add'}),
    url(r'^boarddelete', BoardAdd, kwargs={'action':'delete'}),
    url(r'^boardsearch', BoardSearch),
    url(r'^user/boards/$', UserBoards),
    url(r'^user/boards/(?P<user_id>\d+)', UserBoards),
    url(r'^follows/boards', FollowsBoards),
    url(r'^global/activity', GlobalActivity),
    #url(r'^comments/', Comments),
)
