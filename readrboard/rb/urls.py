from django.conf.urls.defaults import *
from django.views.generic import list_detail
from rb.models import *

urlpatterns = patterns('django.views.generic.simple',
    (r'^bar/$', 'direct_to_template', {'template': 'main/tag.html'}),
)
