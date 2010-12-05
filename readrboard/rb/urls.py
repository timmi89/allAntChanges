from django.conf.urls.defaults import *
from django.views.generic import list_detail
from rb.models import *


urlpatterns = patterns('rb.views',
	(r'^$', 'index'),
    #testing keyword arg style
    (r'^(?P<tag_id>\d+)/$', 'tag_detail'),
)


#test generic views
#see http://docs.djangoproject.com/en/dev/intro/tutorial04/#use-generic-views-less-code-is-better
tag_info = {
    'queryset': Tag.objects.all(),
	'template_name': 'main/tag-list.html',
}

urlpatterns += patterns('',
    (r'^tag-list/$', list_detail.object_list, tag_info)
)
