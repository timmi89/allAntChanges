from django.conf.urls.defaults import *

urlpatterns = patterns('',
    url(r'group/^(?P<short_name>[\w\-]+)/$', 'analytics.views.analytics'),
)