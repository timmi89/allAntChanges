from rb.models import Node
from django.contrib import admin

class NodeAdmin(admin.ModelAdmin):
    list_display = ('user','parent','created','modified','body')
    list_filter = ('user',)
    date_hierarchy = 'modified'
    search_fields = ('body',)
    fields = ('user','parent','body')

admin.site.register(Node, NodeAdmin)
