from django.conf.urls.defaults import *

urlpatterns = patterns('rb.views',
	(r'^$', 'index'),
    #testing keyword arg style
    (r'^(?P<tag_id>\d+)/$', 'tag_detail'),
)