from django.conf.urls.defaults import *
from piston.resource import Resource
from views import *


urlpatterns = patterns('',
    url(r'^chronos/(?P<job_name>[\w\-\.]+)/$', 'chronos.views.main'),
)