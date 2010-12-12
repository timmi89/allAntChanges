from rb.models import *
from django.contrib import admin
#from django.contrib import comments

admin.site.register(RBPage)
admin.site.register(RBSite)
admin.site.register(Tag)
admin.site.register(Comment)
admin.site.register(RBGroup)

#This replaces the line above to customize the admin page console
#todo: it doesn't work yet though.. resolve bugs
#and get it back to the nice way Tyler had it before
#see http://docs.djangoproject.com/en/dev/intro/tutorial02/

class TagAdmin(admin.ModelAdmin):
    list_display = ('id',
                    'user',
                    'inserted',
                    'updated',
                    'parent',
                    'tag',)
    search_fields = ('tag',)

class ContentNodeAdmin(admin.ModelAdmin):
    list_display = ('id',
                    'user',
                    'inserted',
                    'updated',
                    'type',
                    'hash',)
    list_filter = ('user',)
    #date_hierarchy = 'modified'
    search_fields = ('content',)
    #fields = ('user','parent','body')

admin.site.register(ContentNode, ContentNodeAdmin)
