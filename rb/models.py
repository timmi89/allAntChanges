from django.db import models
from django.contrib.auth.models import User
from django.contrib.sites.models import Site
import datetime

CONTENT_TYPES = (
    ('txt', 'text'),
    ('img', 'image'),
    ('vid', 'video'),
    ('snd', 'sound'),
)

NODE_TYPES = (
    ('tag', 'Tag'),
    ('com', 'Comment'),
    ('cnt', 'Content'),
)

NODE_LOOKUP = dict([(a[0], a[1]) for a in NODE_TYPES])

class DateAwareModel(models.Model):
    inserted = models.DateTimeField(auto_now_add=True, editable=False)
    updated = models.DateTimeField(auto_now=True, editable=False)    

    class Meta:
        abstract = True

class UserAwareModel(models.Model):
    user = models.ForeignKey(User)

    class Meta:
        abstract = True

class Feature(models.Model):
    text = models.BooleanField()
    images = models.BooleanField()
    flash = models.BooleanField()

class RBGroup(models.Model):
    name = models.CharField(max_length=250)
    short_name = models.CharField(max_length=25)
    language = models.CharField(max_length=25,default="en")
    blessed_tags = models.CharField(max_length=250,blank=True)
    valid_domains = models.CharField(max_length=250,blank=True)

    # black/whitelist fields
    anno_whitelist = models.CharField(max_length=250,blank=True)
    img_whitelist = models.CharField(max_length=250,blank=True)
    img_blacklist = models.CharField(max_length=250,blank=True)
    no_readr = models.CharField(max_length=250,blank=True)
    
    # logo fields
    logo_url_sm = models.URLField(blank=True,verify_exists=False)
    logo_url_med = models.URLField(blank=True,verify_exists=False)
    logo_url_lg = models.URLField(blank=True,verify_exists=False)
    
    # feature
    share = models.OneToOneField(Feature,related_name='Sharables')
    rate = models.OneToOneField(Feature,related_name='Ratables')
    comment = models.OneToOneField(Feature,related_name='Commentables')
    bookmark = models.OneToOneField(Feature,related_name='Bookmarkables')
    search = models.OneToOneField(Feature,related_name='Searchables')

    # css
    css_url = models.URLField(blank=True,verify_exists=False)
    
    def __unicode__(self):
        return self.name
        
    class Meta:
    	ordering = ['short_name']

class RBSite(Site):
    rb_group = models.ForeignKey(RBGroup)
    include_selectors = models.CharField(max_length=250, blank=True)
    no_rdr_selectors = models.CharField(max_length=250, blank=True)
    css = models.URLField(blank=True)

class RBPage(models.Model):
    rb_site = models.ForeignKey(RBSite)
    url = models.URLField(verify_exists=False)
    canonical_url = models.URLField(verify_exists=False)

    def __unicode__(self):
        return self.canonical_url

class Node(DateAwareModel,UserAwareModel):
    page = models.ForeignKey(RBPage)
    type = models.CharField(max_length=3, choices=NODE_TYPES)
    hash = models.CharField(max_length=32, editable=True,blank=True)
    content = models.TextField()

    def __unicode__(self):
        return str(self.id) + " " + NODE_LOOKUP[self.type] + " " + str(self.user) + " " + self.content[:25] 
"""
    parents = models.ForeignKey('self',related_name="Parent")
    children = models.ForeignKey('self',related_name="Children")
"""

class Edge(models.Model):
    parent = models.ForeignKey(Node,related_name="Parent")
    child = models.ForeignKey(Node,related_name="Child")

    def __unicode__(self):
        return str(self.parent.id) + " -> " + str(self.child.id)
"""
class Comment(Node):
    content = models.TextField(blank=True)

    def __unicode__(self):
        return "CommentNode:" + self.content[:50]
 
class Tag(Node):
    content = models.CharField(max_length=64)

    def __unicode__(self):
        return "TagNode:" + self.content[:50]
"""    
"""
class ContentNode(Node):
    content_type = models.CharField(max_length=3, choices=CONTENT_TYPES)
    rb_page = models.ForeignKey(RBPage)
    hash = models.CharField(max_length=32, editable=True)

    def __unicode__(self):
        return "ContentNode:" + self.hash + ":" + self.content[:50]
"""
