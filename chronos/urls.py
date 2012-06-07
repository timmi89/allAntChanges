from django.conf.urls.defaults import *
from piston.resource import Resource
from views import *


urlpatterns = patterns('',
    url(r'^agree/(?P<interaction_id>\d+)/$', 'chronos.views.agree'),
    url(r'^comment/(?P<interaction_id>\d+)/$', 'chronos.views.comment'),
)