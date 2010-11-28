<<<<<<< HEAD:readrboard/rb/admin.py
from rb.models import *
from django.contrib import admin

admin.site.register(Article)
admin.site.register(RBNode)
admin.site.register(Tag)
admin.site.register(Rating)
admin.site.register(ReadrUser)
=======
from rb.models import Node
from django.contrib import admin

class NodeAdmin(admin.ModelAdmin):
    list_display = ('user','parent','created','modified','body')
    list_filter = ('user',)
    date_hierarchy = 'modified'
    search_fields = ('body',)
    fields = ('user','parent','body')

admin.site.register(Node, NodeAdmin)
>>>>>>> 85cf3579d8b7dcc7e8987d7dffb93cc008c98403:readrboard/rb/admin.py
