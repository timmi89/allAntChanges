from rb.models import *
from django.contrib import admin
#from piston.models import Nonce, Consumer, Token 
#admin.site.unregister(Consumer) 
#admin.site.unregister(Nonce) 
#admin.site.unregister(Token)

admin.site.register(Feature)
admin.site.register(InteractionNode)
admin.site.register(Content)

class FeatureInline(admin.TabularInline):
    model = Feature

class GroupAdmin(admin.ModelAdmin):
    fieldsets = (
        (None, {
            'fields': ('name', 'short_name')
        }),
        ('Advanced', {
            'fields': ('blessed_tags', 'valid_domains', 'anno_whitelist', 'temp_interact', 'img_whitelist', 'img_blacklist', 'no_readr', 'secret')
        }),
        ('Logos', {
            'fields': ('logo_url_sm', 'logo_url_med' , 'logo_url_lg')
        }),
        ('Features', {
            'fields': ('share', 'rate' , 'comment', 'search', 'bookmark')
        }),
     )

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
        'group'
    )

class PageAdmin(admin.ModelAdmin):
   list_display = (
        'id',
        'site',
        'url',
        'canonical_url'
    )

class ContainerAdmin(admin.ModelAdmin):
    list_display = ('id',
                    'hash',
                    'body')
    #list_filter = ('id',)
    #date_hierarchy = 'modified'
    search_fields = ('hash',)
    #fields = ('user','parent','body')

class InteractionAdmin(admin.ModelAdmin):
	exclude = (
        'path',
		'depth',
		'numchild'
    )
	list_display = (
        'id',
        'user',
        'page',
        'content',
        'interaction_node',
        'created',
        'modified',
        'anonymous'
    )

class NodeValueAdmin(admin.ModelAdmin):
    list_display = ('group', 'node', 'value')
	
class LinkAdmin(admin.ModelAdmin):
    def base62(self, obj):
            return obj.to_base62()
    base62.short_description = 'Short Version'
    list_display = ('id', 'base62', 'interaction', 'usage_count')
    readonly_fields = ('usage_count',)

admin.site.register(SocialAuth, SocialAuthAdmin)
admin.site.register(Link, LinkAdmin)
admin.site.register(Page, PageAdmin)
admin.site.register(Group, GroupAdmin)
admin.site.register(Site, SiteAdmin)
admin.site.register(Container, ContainerAdmin)
admin.site.register(Interaction, InteractionAdmin)
admin.site.register(SocialUser, SocialUserAdmin)
admin.site.register(NodeValue, NodeValueAdmin)
