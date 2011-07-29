from django.conf.urls.defaults import *
from django.conf import settings
# Uncomment the next two lines to enable the admin:
from django.contrib import admin
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
admin.autodiscover()

urlpatterns = patterns('',
  # For widget
  url(r'^widget/(.{,25})/$', 'rb.views.widget'),
  url(r'^widgetCss/', 'rb.views.widgetCss'),
  
  # For Facebook
  url(r'^fb/$', 'rb.views.fb'),
  url(r'^fblogin/$', 'rb.views.fblogin', kwargs={"admin_req": False}),
  url(r'^xdm_status/$', 'rb.views.xdm_status'),
  url(r'^admin_request/(?P<short_name>\w+)/$', 'rb.views.admin_request'),
  
  # For short URL expander
  url(r'^s/(?P<short>[0-9a-zA-Z])+/$', 'rb.views.expander'),

  # For main website
  url(r'^$', 'rb.views.main'),
  url(r'^tags/$', 'rb.views.main', kwargs={"view":"tags"}),
  url(r'^comments/$', 'rb.views.main', kwargs={"view":"comments"}),
  url(r'^shares/$', 'rb.views.main', kwargs={"view":"shares"}),
  
  url(r'^settings/$', 'rb.views.settings'),
  url(r'^settings/(?P<short_name>\w+)/$', 'rb.views.settings'),

  url(r'^cards/$', 'rb.views.cards'),
  url(r'^interactions/user/(?P<user_id>\d+)/$', 'rb.views.interactions'),
  url(r'^interactions/user/(?P<user_id>\d+)/tags/$', 'rb.views.interactions', kwargs={"view":"tags"}),
  url(r'^interactions/user/(?P<user_id>\d+)/comments/$', 'rb.views.interactions', kwargs={"view":"comments"}),
  url(r'^interactions/user/(?P<user_id>\d+)/shares/$', 'rb.views.interactions', kwargs={"view":"shares"}),
  url(r'^interactions/user/(?P<user_id>\d+)/bookmarks/$', 'rb.views.interactions', kwargs={"view":"bookmarks"}),

  url(r'^interactions/group/(?P<short_name>\w+)/$', 'rb.views.interactions'),
  url(r'^interactions/group/(?P<short_name>\w+)/not_approved/$', 'rb.views.interactions', kwargs={"view":"not_approved"}),
  url(r'^interactions/group/(?P<short_name>\w+)/tags/$', 'rb.views.interactions', kwargs={"view":"tags"}),
  url(r'^interactions/group/(?P<short_name>\w+)/comments/$', 'rb.views.interactions', kwargs={"view":"comments"}),
  url(r'^interactions/group/(?P<short_name>\w+)/shares/$', 'rb.views.interactions', kwargs={"view":"shares"}),
  url(r'^interactions/group/(?P<short_name>\w+)/bookmarks/$', 'rb.views.interactions', kwargs={"view":"bookmarks"}),

  url(r'^user/(?P<user_id>\d+)/$', 'rb.views.main', kwargs={"view":"tags"}),
  url(r'^user/(?P<user_id>\d+)/tags/$', 'rb.views.main', kwargs={"view":"tags"}),
  url(r'^user/(?P<user_id>\d+)/comments/$', 'rb.views.main', kwargs={"view":"comments"}),
  url(r'^user/(?P<user_id>\d+)/shares/$', 'rb.views.main', kwargs={"view":"shares"}),
  url(r'^user/(?P<user_id>\d+)/bookmarks/$', 'rb.views.main', kwargs={"view":"bookmarks"}),

  url(r'^group/(?P<short_name>\w+)/$', 'rb.views.main', kwargs={"view":"tags"}),
  url(r'^group/(?P<short_name>\w+)/not_approved/$', 'rb.views.main', kwargs={"view":"not_approved"}),
  url(r'^group/(?P<short_name>\w+)/tags/$', 'rb.views.main', kwargs={"view":"tags"}),
  url(r'^group/(?P<short_name>\w+)/comments/$', 'rb.views.main', kwargs={"view":"comments"}),
  url(r'^group/(?P<short_name>\w+)/shares/$', 'rb.views.main', kwargs={"view":"shares"}),
  url(r'^group/(?P<short_name>\w+)/bookmarks/$', 'rb.views.main', kwargs={"view":"bookmarks"}), 
  
  url(r'^sidebar/$', 'rb.views.sidebar'),
  url(r'^sidebar/user/(?P<user_id>\d+)/$', 'rb.views.sidebar'),
  #url(r'^cards/(?P<group_id>\d/$', 'rb.views.cards'),

  url(r'^api/', include('readrboard.api.urls')),
  url(r'^admin/', include(admin.site.urls)),
)

if settings.DEBUG:
  urlpatterns += staticfiles_urlpatterns()
  urlpatterns += patterns('',
      (r'^static/(?P<path>.*)$', 'django.views.static.serve', {'document_root': settings.MEDIA_ROOT}),
  )
