from django.conf.urls.defaults import *

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('',
    # Example:
    # (r'^readrboard/', include('readrboard.foo.urls')),

    # Uncomment the admin/doc line below and add 'django.contrib.admindocs' 
    # to INSTALLED_APPS to enable admin documentation:
    # (r'^admin/doc/', include('django.contrib.admindocs.urls')),

    (r'^nodes/$', 'rb.views.index'),
    (r'^request-meta/$', 'rb.views.display_meta'),
	#(r'^nodes/(?P<node_id>\d+)/$', 'rb.views.detail'),
    #(r'^nodes/(?P<node_id>\d+)/$', 'nodes.views.detail'),
    #(r'^nodes/(?P<node_id>\d+)/results/$', 'nodes.views.results'),
    #(r'^nodes/(?P<node_id>\d+)/vote/$', 'nodes.views.vote'),


    # Uncomment the next line to enable the admin:
    (r'^admin/', include(admin.site.urls)),
)
