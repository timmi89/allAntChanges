from rb.models import *
from django.contrib import admin
#from django.contrib import comments

#admin.site.register(Node)
#admin.site.register(Comment)
#admin.site.register(Tag)
admin.site.register(Page)
admin.site.register(Site)
admin.site.register(Group)
admin.site.register(Feature)
admin.site.register(InteractionNode)
admin.site.register(Content)
admin.site.register(Interaction)
#admin.site.register(Container)
#This replaces the line above to customize the admin page console
#todo: it doesn't work yet though.. resolve bugs
#and get it back to the nice way Tyler had it before
#see http://docs.djangoproject.com/en/dev/intro/tutorial02/


class ContainerAdmin(admin.ModelAdmin):
    list_display = ('id',
                    'hash',
                    'body',)
    #list_filter = ('id',)
    #date_hierarchy = 'modified'
    search_fields = ('hash',)
    #fields = ('user','parent','body')

admin.site.register(Container, ContainerAdmin)

