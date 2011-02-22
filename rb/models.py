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

FEATURE_TYPES = (
    (0, 'share'),
    (1, 'rate'),
    (2, 'comment'),
    (3, 'bookmark'),
    (4, 'search'),
)

FEATURE_LOOKUP = dict([(a[1], a[0]) for a in FEATURE_TYPES])

class DateAwareModel(models.Model):
    inserted = models.DateTimeField(auto_now_add=True, editable=False)
    updated = models.DateTimeField(auto_now=True, editable=False)    

    class Meta:
        abstract = True

class UserAwareModel(models.Model):
    user = models.ForeignKey(User)

    class Meta:
        abstract = True

class Node(DateAwareModel,UserAwareModel):
    pass
"""
    parents = models.ForeignKey('self',related_name="Parent")
    children = models.ForeignKey('self',related_name="Children")
"""

class Edge(models.Model):
    parent = models.ForeignKey(Node,related_name="Parent")
    child = models.ForeignKey(Node,related_name="Child")

class Comment(Node):
    content = models.TextField(blank=True)

    def __unicode__(self):
        return "CommentNode:" + self.content[:50]
 
class Tag(Node):
    content = models.CharField(max_length=64)

    def __unicode__(self):
        return "TagNode:" + self.content[:50]

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
    
    # css
    css_url = models.URLField(blank=True,verify_exists=False)
    
    def get_feature(self, name):
        try:
            feature_id = FEATURE_LOOKUP[name]
        except:
            raise Exception("Invalid feature name")
        try:
            return self.feature_set.values('text','images','flash').get(kind=feature_id)
        except:
            raise Exception("Feature instance not yet created")

    # TODO: write code to overwrite save method + create feature instances on
    # the first save of the model.
    # def save(self):

    def __unicode__(self):
        return self.name
        
    class Meta:
    	ordering = ['short_name']

class Feature(models.Model):
    kind = models.PositiveSmallIntegerField(choices=FEATURE_TYPES,default=1)
    text = models.BooleanField()
    images = models.BooleanField()
    flash = models.BooleanField()
    rb_group = models.ForeignKey(RBGroup,default=1)

    def __unicode__(self):
        return (self.rb_group.short_name +":"+  FEATURE_TYPES[self.kind][1])

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

class ContentNode(Node):
    content_type = models.CharField(max_length=3, choices=CONTENT_TYPES)
    content = models.TextField()
    rb_page = models.ForeignKey(RBPage)
    hash = models.CharField(max_length=32, editable=True)

    def __unicode__(self):
        return "ContentNode:" + self.hash + ":" + self.content[:50]
