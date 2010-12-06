from django.conf.urls.defaults import *
from django.conf import settings
# Uncomment the next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('',
    # Example:
    # (r'^readrboard/', include('readrboard.foo.urls')),

    # Uncomment the admin/doc line below and add 'django.contrib.admindocs' 
    # to INSTALLED_APPS to enable admin documentation:
    # (r'^admin/doc/', include('django.contrib.admindocs.urls')),
    (r'^search-form/$', 'rb.views.search_form'),
    (r'^nodes/$', 'rb.views.index'),
    (r'^request-meta/$', 'rb.views.display_meta'),
    (r'^search/$', 'rb.views.search'),
    (r'^comments/', include('django.contrib.comments.urls')),
    (r'^nodes/$', 'rb.views.index'),
    (r'^request-meta/$', 'rb.views.display_meta'),	
    #(r'^nodes/(?P<node_id>\d+)/$', 'rb.views.detail'),
    #(r'^nodes/(?P<node_id>\d+)/$', 'rb.views.detail'),
    #(r'^nodes/(?P<node_id>\d+)/results/$', 'rb.views.results'),
    #(r'^nodes/(?P<node_id>\d+)/vote/$', 'rb.views.vote'),
    # Uncomment the next line to enable the admin:
    
    #testing 'packaging' the urlpatterns within the rb django project
    (r'^tags/', include('rb.urls')),
    
    (r'^admin/', include(admin.site.urls)),
    (r'^json-nodes/', 'rb.views.json_content_node'),
    (r'^json-send/', 'rb.views.send'),
)

if settings.DEBUG:
    urlpatterns += patterns('',
        (r'^static/(?P<path>.*)$', 'django.views.static.serve', {'document_root': settings.MEDIA_ROOT}),
    )
