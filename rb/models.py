from django.db import models
from treebeard.mp_tree import MP_Node
from django.contrib.auth.models import User
from django.contrib.sites.models import Site
from baseconv import base62
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
    ('bkm', 'Bookmark'),
    ('shr', 'Share'),
)

#NODE_LOOKUP = dict([(a[0], a[1]) for a in NODE_TYPES])

class DateAwareModel(models.Model):
    created = models.DateTimeField(auto_now_add=True, editable=False)
    modified = models.DateTimeField(auto_now=True, editable=False)    

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

    def __unicode__(self):
        return u"Feature(Text: {0}, Images: {1}, Flash: {2})".format(self.text, self.images, self.flash) 

class Group(models.Model):
    name = models.CharField(max_length=250)
    short_name = models.CharField(max_length=25, unique=True)
    language = models.CharField(max_length=25,default="en")
    blessed_tags = models.CharField(max_length=250,blank=True)
    valid_domains = models.CharField(max_length=250,blank=True)

    # black/whitelist fields
    anno_whitelist = models.CharField(max_length=250,blank=True,default=u"p")
    img_whitelist = models.CharField(max_length=250,blank=True)
    img_blacklist = models.CharField(max_length=250,blank=True)
    no_readr = models.CharField(max_length=250,blank=True)
    
    # logo fields
    logo_url_sm = models.URLField(blank=True,verify_exists=False)
    logo_url_med = models.URLField(blank=True,verify_exists=False)
    logo_url_lg = models.URLField(blank=True,verify_exists=False)
    
    # features
    share = models.OneToOneField(Feature, related_name = 'Share Feature')
    rate = models.OneToOneField(Feature, related_name = 'Rate Feature')
    comment = models.OneToOneField(Feature, related_name = 'Comment Feature')
    bookmark = models.OneToOneField(Feature, related_name = 'Bookmark Feature')
    search = models.OneToOneField(Feature, related_name = 'Search Feature')

    # css
    css_url = models.URLField(blank=True,verify_exists=False)
    
    def __unicode__(self):
        return self.name
        
    class Meta:
        ordering = ['short_name']

class Site(models.Model):
    name = models.CharField(max_length=100)
    domain = models.CharField(max_length=50)
    group = models.ForeignKey(Group)
    include_selectors = models.CharField(max_length=250, blank=True)
    no_rdr_selectors = models.CharField(max_length=250, blank=True)
    css = models.URLField(blank=True)

    def __unicode__(self):
        return self.name

class Page(models.Model):
    site = models.ForeignKey(Site)
    url = models.URLField(verify_exists=False)
    canonical_url = models.URLField(verify_exists=False, blank=True)

    def __unicode__(self):
        return u"Page %d" % self.id

class Content(DateAwareModel):
    kind = models.CharField(max_length=3, choices=CONTENT_TYPES, default='txt')
    body = models.TextField()
    
    def __unicode__(self):
        return u"Content(Kind: {0}, Body: {1})".format(self.kind, self.body[:25])
    
    class Meta:
        verbose_name_plural = "content"

class Container(models.Model):
    hash = models.CharField(max_length=32,unique=True)
    body = models.TextField()
    content = models.ManyToManyField(Content, blank=True, editable=False)
    
    class Meta:
        ordering = ['id']
    
class InteractionNode(models.Model):
    kind = models.CharField(max_length=3, choices=INTERACTION_TYPES)
    body = models.TextField(unique=True)
    
    def __unicode__(self):
        return u"Node(Type: {0}, Body: {1})".format(self.kind, self.body[:25])

class Interaction(DateAwareModel, UserAwareModel, MP_Node):
    page = models.ForeignKey(Page)
    content = models.ForeignKey(Content)
    interaction_node = models.ForeignKey(InteractionNode)
    anonymous = models.BooleanField(default=False)
    node_order_by = ['created']
    
    # Don't f-ing change this number - super important
    steplen = 10
    
    class Meta:
        ordering = ['id']

    @models.permalink
    def get_absolute_url(self):
        return ('api.urls.Interaction.resource_uri()', [str(self.id)])

    def __unicode__(self):
        return u"Interaction(Page: {0}, Content: {1})".format(self.page, self.content)

class Link(models.Model):
    # I think we have this already from the interaction table
    #url = models.URLField(verify_exists=True, unique=True)
    interaction = models.ForeignKey(Interaction, unique=True)
    usage_count = models.IntegerField(default=0, editable=False)
    
    def to_base62(self):
        return base62.from_decimal(self.id)

    def short_url(self):
        return settings.SITE_BASE_URL + self.to_base62()
    
    def __unicode__(self):
        return self.to_base62() + ' : ' + self.interaction.page.url

class LazyUserManager(models.Manager):

    def create_lazy_user(self, username):
        """
        Create a lazy user.
        """
        user = User.objects.create_user(username, '')
        self.create(user=user)
        return user

class LazyUser(models.Model):
    user = models.ForeignKey('auth.User', unique=True)
    objects = LazyUserManager()

