from django.conf.urls.defaults import *
from django.conf import settings
# Uncomment the next two lines to enable the admin:
from django.views.generic import RedirectView
from django.views.generic import TemplateView

from django.contrib import admin
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
admin.autodiscover()

urlpatterns = patterns('',
  # For admin
  url(r'^admin/', include(admin.site.urls)),

  # For widget
  url(r'^widget/(.{,25})/$', 'rb.views.widget'),
  url(r'^widgetCss/', 'rb.views.widgetCss'),
  
  # For Facebook
  url(r'^fb/$', 'rb.views.fb'),
  url(r'^fblogin/$', 'rb.views.fblogin'),
  url(r'^xdm_status/$', 'rb.views.xdm_status'),
  url(r'^fb_channel/$', 'rb.views.fb_channel'),
  
  # For short URL expander
  url(r'^s/(?P<short>[0-9a-zA-Z]+)/$', 'rb.views.expander'),
  url(r'^i/(?P<short>[0-9]+)/$', 'rb.views.interaction_redirect'),
  
  
  # For main website
  url(r'^publishers/$','rb.views.splash'),
  url(r'^about/$','rb.views.splash'),
  url(r'^$', 'rb.views.main', kwargs={"view":"index", "filtered":"charcoal"}),
  url(r'^unfiltered/$', 'rb.views.main', kwargs={"view":"index"}),
  url(r'^stream/$', 'rb.views.main', kwargs={"view":"index"}),
  url(r'^tags/$', 'rb.views.main', kwargs={"view":"tags"}),
  url(r'^comments/$', 'rb.views.main', kwargs={"view":"comments"}),
  url(r'^shares/$', 'rb.views.main', kwargs={"view":"shares"}),
  
  # Client Facing Registration & Settings
  url(r'^settings/$', 'rb.views.settings'),
  url(r'^register/$', 'rb.views.group'),
  url(r'^sites/$', 'rb.views.sites'),
  url(r'^settings/(?P<short_name>[\w\-\.]+)/$', 'rb.views.settings'),
  url(r'^settings_wordpress/(?P<short_name>[\w\-\.]+)/$', 'rb.views.settings_wordpress'),


  # User profile pages
  url(r'^user/(?P<user_id>\d+)/$', 'rb.views.main'),
  url(r'^user/(?P<user_id>\d+)/tags/$', 'rb.views.main', kwargs={"view":"tags"}),
  url(r'^user/(?P<user_id>\d+)/comments/$', 'rb.views.main', kwargs={"view":"comments"}),
  url(r'^user/(?P<user_id>\d+)/shares/$', 'rb.views.main', kwargs={"view":"shares"}),
  url(r'^user/(?P<user_id>\d+)/bookmarks/$', 'rb.views.main', kwargs={"view":"bookmarks"}),
  
  url(r'^follows/(?P<user_id>\d+)/$', 'rb.views.follow_interactions'),
  
  url(r'^board_create/$', 'rb.views.create_board'),
  url(r'^board/(?P<board_id>\d+)/', 'rb.views.board'),
  
  
  # Specific page
  url(r'^page/(?P<page_id>\d+)/$', 'rb.views.main'),
  url(r'^page/(?P<page_id>\d+)/not_approved/$', 'rb.views.main', kwargs={"admin":"not_approved"}),
  url(r'^page/(?P<page_id>\d+)/tags/$', 'rb.views.main', kwargs={"view":"tags"}),
  url(r'^page/(?P<page_id>\d+)/comments/$', 'rb.views.main', kwargs={"view":"comments"}),
  url(r'^page/(?P<page_id>\d+)/shares/$', 'rb.views.main', kwargs={"view":"shares"}),
  url(r'^page/(?P<page_id>\d+)/bookmarks/$', 'rb.views.main', kwargs={"view":"bookmarks"}),

  # Specific site
  url(r'^site/(?P<site_id>\d+)/$', 'rb.views.main'),
  url(r'^site/(?P<site_id>\d+)/not_approved/$', 'rb.views.main', kwargs={"admin":"not_approved"}),
  url(r'^site/(?P<site_id>\d+)/tags/$', 'rb.views.main', kwargs={"view":"tags"}),
  url(r'^site/(?P<site_id>\d+)/comments/$', 'rb.views.main', kwargs={"view":"comments"}),
  url(r'^site/(?P<site_id>\d+)/shares/$', 'rb.views.main', kwargs={"view":"shares"}),
  url(r'^site/(?P<site_id>\d+)/bookmarks/$', 'rb.views.main', kwargs={"view":"bookmarks"}),

  # Specific group
  url(r'^group/(?P<short_name>[\w\-\.]+)/$', 'rb.views.main'),
  url(r'^group/(?P<short_name>[\w\-\.]+)/not_approved/$', 'rb.views.main', kwargs={"admin":"not_approved"}),
  url(r'^group/(?P<short_name>[\w\-\.]+)/tags/$', 'rb.views.main', kwargs={"view":"tags"}),
  url(r'^group/(?P<short_name>[\w\-\.]+)/comments/$', 'rb.views.main', kwargs={"view":"comments"}),
  url(r'^group/(?P<short_name>[\w\-\.]+)/shares/$', 'rb.views.main', kwargs={"view":"shares"}),
  url(r'^group/(?P<short_name>[\w\-\.]+)/bookmarks/$', 'rb.views.main', kwargs={"view":"bookmarks"}), 
  
  #single interaction
  url(r'^interaction/(?P<interaction_id>\d+)/$', 'rb.views.main'),
  
  # Main Site Supporting Pages
  url(r'^team/$', 'rb.views.team'),
  url(r'^faq/$', 'rb.views.faq'),
  url(r'^react/$', 'rb.views.react'),
  url(r'^splash/$', 'rb.views.splash'),
  
  # changed to rb.views.friendlylogin instead of rb.views.login, because login sometimes throws an error.
  # the error is 'str' object has no attribute 'status_code' 
  # and it seems to be caused by the request.META.get('HTTP_REFERER') code, which I don't understand why we want in there.
  # fix this after we investegate and understand.
  url(r'^login/$', 'rb.views.friendlylogin'),
  url(r'^friendlylogin/$', 'rb.views.friendlylogin'),
  url(r'^friendlylogin_wordpress/$', 'rb.views.friendlylogin_wordpress'),
  
  # Sidebar
  url(r'^sidebar/$', 'rb.views.sidebar'),
  url(r'^sidebar/user/(?P<user_id>\d+)/$', 'rb.views.sidebar'),
  url(r'^sidebar/group/(?P<short_name>[\w\-\.]+)/$', 'rb.views.sidebar'),
  #url(r'^cards/(?P<group_id>\d/$', 'rb.views.cards'),

  # Extras
  #url(r'^robots\.txt$', 'django.views.generic.simple.direct_to_template', {'template': 'robots.txt', 'mimetype': 'text/plain'}),
  #url(r'^favicon\.ico$', 'django.views.generic.simple.redirect_to', {'url': '/static/site/images/favicon.ico'}),
  url(r'^favicon\.ico$', RedirectView.as_view(url='/static/site/images/favicon.ico')),

  # API
  url(r'^api/', include('readrboard.api.urls')),
  
  # CHRONS API
  url(r'^chronos/', include('readrboard.chronos.urls')),
  
  
  # Group Supporting Pages
  # dont expose the signup form anymore for now.  We'll use the wufoo form and onboard ourselves - redirect them.
  # url(r'^signup/$', 'rb.views.create_group'),
  url(r'^signup/$', RedirectView.as_view(url='/about/#publishers')),
  url(r'^signup_wordpress/$', 'rb.views.create_group_wordpress'),

  url(r'^analytics/', include('readrboard.analytics.urls')),
  url(r'^admin_request/(?P<short_name>[\w\-\.]+)/$', 'rb.views.admin_request'),
  url(r'^admin_approve/$', 'rb.views.admin_approve'),
  url(r'^admin_approve/(?P<request_id>\d+)/$', 'rb.views.admin_approve'),

  # Plugin Settings
  url(r'^wordpress/$', 'rb.views.wordpress'),
  url(r'^wordpress_edit/$', 'rb.views.wordpress_edit'),
  
  # User creation and registration
  url(r'^user_create/$', 'rb.views.create_rb_user'),
  url(r'^confirmemail/$', 'rb.views.confirm_rb_user'),
  url(r'^reset_password/$', 'rb.views.reset_rb_password'),
  url(r'^request_password/$', 'rb.views.request_password_reset'),
  url(r'^user_modify/$', 'rb.views.modify_rb_social_user'),
  
  url(r'^rb_login/$', 'rb.views.rb_login'),
  url(r'^rb_login_success/$', 'rb.views.rb_login_success'),
  # For demos
  #url(r'^demo/', settings.STATIC_URL)
)

from django.conf.urls.static import static

if settings.DEBUG:
    #urlpatterns += url(r'^static/engage\.js$', 'django.views.generic.simple.redirect_to', {'url': '/static/engage_full.js'}),
    urlpatterns += url(r'^static/engage\.js$', RedirectView.as_view(url='/static/engage_full.js')),

urlpatterns += patterns('django.contrib.staticfiles.views',
        url(r'^static/(?P<path>.*)$', 'serve'),        
    ) + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    
    
    
