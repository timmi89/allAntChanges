from rb.models import *
from django.contrib import admin


admin.site.register(Page)
admin.site.register(Tag)
admin.site.register(ReadrUser)

admin.site.register(RBNode)
#This replaces the line above to customize the admin page console
#todo: it doesn't work yet though.. resolve bugs
#and get it back to the nice way Tyler had it before
#see http://docs.djangoproject.com/en/dev/intro/tutorial02/
"""
class RBNodeAdmin(admin.ModelAdmin):
    list_display = ('user','parent','created','modified','body')
    list_filter = ('user',)
    date_hierarchy = 'modified'
    search_fields = ('body',)
    fields = ('user','parent','body')
    
admin.site.register(RBNode, RBNodeAdmin)
"""

#eric: this was causing an error - Comment out for now
#todo: checkout error
"""
admin.site.register(Group)
"""