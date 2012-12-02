from rb.models import *
from chronos.models import *
from django.contrib import admin
#from piston.models import Nonce, Consumer, Token 
#admin.site.unregister(Consumer) 
#admin.site.unregister(Nonce) 
#admin.site.unregister(Token)

admin.site.register(Feature)
admin.site.register(InteractionNode)

class ContentAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'kind',
        'location',
        'body',
    )

class FeatureInline(admin.TabularInline):
    model = Feature

class ProfileAdmin(admin.ModelAdmin):
    list_display = (
        'user',
        'admin',
        'educated',
        'interaction_count',
        'follower_count'
    )

class RBGroupAdmin(admin.ModelAdmin):
    list_display = ('name', 'short_name', 'demo_group', 'approved', 'requires_approval')
    fieldsets = (
        (None, {
            'fields': ('name', 'short_name', 'demo_group', 'approved')
        }),
        ('Advanced', {
            'fields': ('custom_css', 'anno_whitelist', 'temp_interact', 'img_whitelist', 'img_blacklist', 'no_readr', 'word_blacklist')
        }),
        ('Logos', {
            'fields': ('logo_url_sm', 'logo_url_med' , 'logo_url_lg')
        }),
        ('Features', {
            'fields': ('share', 'rate' , 'comment', 'search', 'bookmark', 'twitter')
        }),
        ('Selectors', {
            'fields': ('post_selector', 'post_href_selector', 'summary_widget_selector')
        }),
        ('JQuery', {
            'fields': ('inline_selector', 'inline_func')
        }),
        ('Customization', {
            'fields': ('paragraph_helper','call_to_action','media_display_pref', 'sharebox_show', 'sharebox_fade', 
                       'sharebox_should_own', 'sharebox_selector', 'sharebox_facebook', 
                       'sharebox_twitter', 'sharebox_stumble', 'sharebox_digg', 'sharebox_reddit', 'sharebox_google')
            
        }),
     )
    search_fields = ['name','short_name',]

class SocialUserAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'user',
        'provider',
        'uid',
        'full_name',
        'username',
        'gender',
        'hometown'
    )
    search_fields = ['id','username',]

class SocialAuthAdmin(admin.ModelAdmin):
    list_display = (
        'social_user',
        'auth_token',
        'expires'
    )

class SiteAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'domain',
        'group',
        'querystring_content'
    )

class PageAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'site',
        'title',
        'url',
        'canonical_url'
    )
    search_fields = ('id', 'title', 'url')

class ContainerAdmin(admin.ModelAdmin):
    list_display = ('id',
                    'hash',
                    'kind',
                    'body')
    #list_filter = ('id',)
    #date_hierarchy = 'modified'
    search_fields = ('hash',)
    #fields = ('user','parent','body')

class InteractionAdmin(admin.ModelAdmin):
    #exclude = (
    #    'path',
    #    'depth',
    #    'numchild',
    #)
    list_display = (
        'id',
        'user',
        'page',
        'container',
        'content',
        'kind',
        'parent',
        'interaction_node',
        'created',
        'modified',
        'anonymous',
        'approved',
        'rank',
    )
    search_fields = ['id',]

class NodeValueAdmin(admin.ModelAdmin):
    list_display = ('group', 'node', 'value')

class GroupAdminAdmin(admin.ModelAdmin):
    list_display = ('group', 'social_user', 'approved')
    search_fields = ['id','group__name',]
    
class GroupBlessedTagAdmin(admin.ModelAdmin):
    list_display = ('group', 'node', 'order')
    search_fields = ['group__name', 'node__body', 'node__id']

class LinkAdmin(admin.ModelAdmin):
    def base62(self, obj):
            return obj.to_base62()
    base62.short_description = 'Short Version'
    list_display = ('id', 'base62', 'interaction', 'usage_count')
    readonly_fields = ('usage_count',)

admin.site.register(SocialAuth, SocialAuthAdmin)
admin.site.register(Link, LinkAdmin)
admin.site.register(Page, PageAdmin)
admin.site.register(Group, RBGroupAdmin)
admin.site.register(Site, SiteAdmin)
admin.site.register(Container, ContainerAdmin)
admin.site.register(Interaction, InteractionAdmin)
admin.site.register(SocialUser, SocialUserAdmin)
admin.site.register(NodeValue, NodeValueAdmin)
admin.site.register(Content, ContentAdmin)
admin.site.register(Profile)
admin.site.register(GroupAdmin, GroupAdminAdmin)
admin.site.register(GroupBlessedTag, GroupBlessedTagAdmin)
admin.site.register(Follow)
admin.site.register(UserDefaultTag)
admin.site.register(NotificationRule)
admin.site.register(NotificationType)
admin.site.register(InteractionNotification)
admin.site.register(Board)
admin.site.register(BoardAdmin)
admin.site.register(BoardInteraction)

