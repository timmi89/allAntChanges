from django.conf.urls.defaults import *
from piston.resource import Resource
from views import *

PopularTag = Resource(handler=PopularTagHandler)
PopularContent = Resource(handler=PopularContentHandler)
Frequency = Resource(handler=FrequencyHandler)
Active = Resource(handler=ActiveHandler)
Tagged = Resource(handler=TaggedHandler)
Recent = Resource(handler=RecentHandler)

urlpatterns = patterns('',
    url(r'^group/(?P<short_name>[\w\-]+)/$', 'analytics.views.analytics'),
    url(r'^group/(?P<short_name>[\w\-]+)/frequency/$', Frequency),
    url(r'^group/(?P<short_name>[\w\-]+)/tags/popular/$', PopularTag),
    url(r'^group/(?P<short_name>[\w\-]+)/tags/frequency/$', Frequency, kwargs={"kind":"tag"}),
    url(r'^group/(?P<short_name>[\w\-]+)/bookmarks/popular/$', PopularContent, kwargs={"kind":"bkm"}),
    url(r'^group/(?P<short_name>[\w\-]+)/shares/popular/$', PopularContent, kwargs={"kind":"shr"}),
    url(r'^group/(?P<short_name>[\w\-]+)/content/active/$', Active, kwargs={"subject":"content"}),
    url(r'^group/(?P<short_name>[\w\-]+)/users/active/$', Active, kwargs={"subject":"user"}),
    url(r'^group/(?P<short_name>[\w\-]+)/pages/active/$', Active, kwargs={"subject":"page"}),
    url(r'^group/(?P<short_name>[\w\-]+)/pages/recent/$', Recent),
    url(r'^group/(?P<short_name>[\w\-]+)/pages/tagged/$', Tagged),
)