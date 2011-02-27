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

INTERACTION_TYPES = (
    ('tag', 'Tag'),
    ('com', 'Comment'),
)

#NODE_LOOKUP = dict([(a[0], a[1]) for a in NODE_TYPES])

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

class Group(models.Model):
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

class Site(Site):
    group = models.ForeignKey(Group)
    include_selectors = models.CharField(max_length=250, blank=True)
    no_rdr_selectors = models.CharField(max_length=250, blank=True)
    css = models.URLField(blank=True)

class Page(models.Model):
    site = models.ForeignKey(Site)
    url = models.URLField(verify_exists=False)
    canonical_url = models.URLField(verify_exists=False)

    def __unicode__(self):
        return self.canonical_url

class Content(DateAwareModel):
	hash = models.CharField(max_length=32)
	kind = models.CharField(max_length=3, choices=CONTENT_TYPES, default='txt')
	body = models.TextField()
	
	def __unicode__(self):
		return "Content(Kind: {0}, Body: {1})".format(self.kind, self.body[:25])
	
	class Meta:
		verbose_name_plural = "content"

class InteractionNode(models.Model):
	type = models.CharField(max_length=3, choices=INTERACTION_TYPES)
	body = models.TextField()
	
	def __unicode__(self):
		return "Node(Type: {0}, Body: {1})".format(self.type, self.body[:25])

class Interaction(DateAwareModel,UserAwareModel):
	page = models.ForeignKey(Page)
	content = models.ForeignKey(Content)
	parent = models.ForeignKey('self',blank=True,null=True,default='Null')
	node = models.ForeignKey(InteractionNode)
	
	def __unicode__(self):
		return "Interaction(Page: {0}, Content: {1})".format(self.page, self.content)