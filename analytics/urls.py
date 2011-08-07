from django.conf.urls.defaults import *

urlpatterns = patterns('',
    url(r'^group/(?P<short_name>[\w\-]+)/$', 'analytics.views.analytics'),
    url(r'^group/(?P<short_name>[\w\-]+)/tags/popular/$', 'analytics.views.popular', kwargs={"kind":"tag"}),
    url(r'^group/(?P<short_name>[\w\-]+)/tags/frequency/$', 'analytics.views.frequency', kwargs={"kind":"tag"}),
    url(r'^group/(?P<short_name>[\w\-]+)/bookmarks/popular$', 'analytics.views.popular', kwargs={"kind":"bkm"}),
    url(r'^group/(?P<short_name>[\w\-]+)/shares/popular/$', 'analytics.views.popular', kwargs={"kind":"shr"}),
    url(r'^group/(?P<short_name>[\w\-]+)/content/active/$', 'analytics.views.active', kwargs={"subject":"content"}),
    url(r'^group/(?P<short_name>[\w\-]+)/users/active/$', 'analytics.views.active', kwargs={"subject":"users"}),
    url(r'^group/(?P<short_name>[\w\-]+)/pages/active/$', 'analytics.views.active', kwargs={"subject":"pages"}),
    url(r'^group/(?P<short_name>[\w\-]+)/pages/recent/$', 'analytics.views.recent'),
    url(r'^group/(?P<short_name>[\w\-]+)/pages/tagged/$', 'analytics.views.tagged'),
)