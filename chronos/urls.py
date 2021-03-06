from django.conf.urls.defaults import *
from piston.resource import Resource
from views import *


urlpatterns = patterns('',
    url(r'^agree/(?P<interaction_id>\d+)/$', 'chronos.views.agree'),
    url(r'^group_node/(?P<interaction_id>\d+)/(?P<group_id>\d+)/$', 'chronos.views.group_node'),
    url(r'^comment/(?P<interaction_id>\d+)/$', 'chronos.views.comment'),
    url(r'^page/(?P<interaction_id>\d+)/$', 'chronos.views.page'),
    url(r'^email/agree/(?P<interaction_id>\d+)/(?P<user_id>\d+)/(?P<count>\d+)/$', 'chronos.views.email_agree'),
    url(r'^email/group_node/(?P<interaction_id>\d+)/(?P<group_id>\d+)/(?P<admin_index>\d+)/$', 'chronos.views.email_group_node'),
    url(r'^email/comment/(?P<interaction_id>\d+)/(?P<user_id>\d+)/$', 'chronos.views.email_comment'),
    url(r'^email/page/(?P<interaction_id>\d+)/(?P<user_id>\d+)/$', 'chronos.views.email_page'),
    url(r'^email/follow/(?P<user_id>\d+)/(?P<follow_id>\d+)/$', 'chronos.views.email_follow'),
)