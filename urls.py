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
  url(r'^fblogin/$', 'rb.views.fblogin'),
  url(r'^xdm_status/$', 'rb.views.xdm_status'),
  
  # For short URL expander
  url(r'^s/(?P<short>[0-9a-zA-Z])+/$', 'rb.views.expander'),

  url(r'^$', 'rb.views.home', name='home'),
  url(r'^tags/$', 'rb.views.home', kwargs={"view":"tags"}),
  url(r'^comments/$', 'rb.views.home', kwargs={"view":"comments"}),
  url(r'^shares/$', 'rb.views.home', kwargs={"view":"shares"}),

  url(r'^profile/(?P<user_id>\d)/$', 'rb.views.profile', name='profile'),
  url(r'^profile/(?P<user_id>\d)/tags/$', 'rb.views.profile', kwargs={"view":"tags"}),
  url(r'^profile/(?P<user_id>\d)/comments/$', 'rb.views.profile', kwargs={"view":"comments"}),
  url(r'^profile/(?P<user_id>\d)/shares/$', 'rb.views.profile', kwargs={"view":"shares"}),

  # For main website
  url(r'^cards/$', 'rb.views.cards'),
  url(r'^sidebar/$', 'rb.views.sidebar'),
  #url(r'^cards/(?P<group_id>\d/$', 'rb.views.cards'),

  url(r'^api/', include('readrboard.api.urls')),
  url(r'^admin/', include(admin.site.urls)),
)

if settings.DEBUG:
  urlpatterns += staticfiles_urlpatterns()
  urlpatterns += patterns('',
      (r'^static/(?P<path>.*)$', 'django.views.static.serve', {'document_root': settings.MEDIA_ROOT}),
  )
