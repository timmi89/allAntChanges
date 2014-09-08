from django.conf.urls.defaults import *
from piston.resource import Resource
from views import *

PopularTag = Resource(handler=PopularTagHandler)
PopularContent = Resource(handler=PopularContentHandler)
Frequency = Resource(handler=FrequencyHandler)
Active = Resource(handler=ActiveHandler)
Tagged = Resource(handler=TaggedHandler)
Recent = Resource(handler=RecentHandler)
InhouseAnalytics = Resource(handler=InhouseAnalyticsJSONHandler)

urlpatterns = patterns('',
    url(r'^/$', 'analytics.views_v1.analytics'),
    url(r'^/frequency/$', Frequency),
    url(r'^/tags/popular/$', PopularTag),
    url(r'^/tags/frequency/$', Frequency, kwargs={"kind":"tag"}),
    url(r'^/bookmarks/popular/$', PopularContent, kwargs={"kind":"bkm"}),
    url(r'^/shares/popular/$', PopularContent, kwargs={"kind":"shr"}),
    url(r'^/content/active/$', Active, kwargs={"subject":"content"}),
    url(r'^/users/active/$', Active, kwargs={"subject":"user"}),
    url(r'^/pages/active/$', Active, kwargs={"subject":"page"}),
    url(r'^/pages/recent/$', Recent),
    url(r'^/pages/tagged/$', Tagged),
    
    # e.g. /analytics/inhouse/#start=1/03/13#end=11/04/13
    url(r'^/inhouse/$', 'analytics.views_v1.analytics_inhouse'),
    url(r'^/inhouse/test/$', InhouseAnalytics),
)
