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

GENDER_CHOICES = (
    ('M', 'Male'),
    ('F', 'Female'),
)

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

    class Meta:
        unique_together = ('text', 'images', 'flash')

    def __unicode__(self):
        return u'Feature(Text: {0}, Images: {1}, Flash: {2})'.format(self.text, self.images, self.flash)

class InteractionNode(models.Model):
    kind = models.CharField(max_length=3, choices=INTERACTION_TYPES)
    body = models.TextField()
    
    def __unicode__(self):
        return u'Node(Type: {0}, Body: {1})'.format(self.kind, self.body[:25])

    class Meta:
        unique_together = ('kind', 'body')

class Group(models.Model):
    name = models.CharField(max_length=250)
    short_name = models.CharField(max_length=25, unique=True)
    language = models.CharField(max_length=25,default="en")
    blessed_tags = models.ManyToManyField(InteractionNode)
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
    share = models.ForeignKey(Feature, related_name = 'Share Feature')
    rate = models.ForeignKey(Feature, related_name = 'Rate Feature')
    comment = models.ForeignKey(Feature, related_name = 'Comment Feature')
    bookmark = models.ForeignKey(Feature, related_name = 'Bookmark Feature')
    search = models.ForeignKey(Feature, related_name = 'Search Feature')

    # temporary user settings
    temp_interact = models.IntegerField(default=5)

    # css
    css_url = models.URLField(blank=True,verify_exists=False)
    
    # for token
    secret = models.CharField(max_length=128)

    def __unicode__(self):
        return self.name
        
    class Meta:
        ordering = ['short_name']

class NodeValue(models.Model):
    group = models.ForeignKey(Group)
    node = models.ForeignKey(InteractionNode)
    value = models.IntegerField(default=0)

    def __unicode__(self):
        return unicode(self.value)

    class Meta:
        unique_together = ('group', 'node', 'value')

class Site(models.Model):
    name = models.CharField(max_length=100)
    domain = models.CharField(max_length=50)
    group = models.ForeignKey(Group)
    include_selectors = models.CharField(max_length=250, blank=True)
    no_rdr_selectors = models.CharField(max_length=250, blank=True)
    css = models.URLField(blank=True)

    def __unicode__(self):
        return unicode(self.name)

class Page(models.Model):
    site = models.ForeignKey(Site)
    url = models.URLField(verify_exists=False)
    canonical_url = models.URLField(verify_exists=False, blank=True)

    def __unicode__(self):
        return u'Page {0}'.format(unicode(self.id))

class Content(DateAwareModel):
    kind = models.CharField(max_length=3, choices=CONTENT_TYPES, default='txt')
    body = models.TextField()
    
    def __unicode__(self):
        return u'Content(Kind: {0}, Body: {1})'.format(self.kind, self.body[:50])
    
    class Meta:
        verbose_name_plural = "content"

class Container(models.Model):
    hash = models.CharField(max_length=32,unique=True)
    body = models.TextField()
    content = models.ManyToManyField(Content, blank=True, editable=False)

    def __unicode__(self):
        return self.hash
    
    class Meta:
        ordering = ['id']

class Interaction(DateAwareModel, UserAwareModel):
    page = models.ForeignKey(Page)
    content = models.ForeignKey(Content)
    interaction_node = models.ForeignKey(InteractionNode)
    anonymous = models.BooleanField(default=False)
    parent= models.ForeignKey('self', blank=True, null=True)
    node_order_by = ['created']
    
    # Don't f-ing change this number - super important
    # steplen = 10
    
    class Meta:
        ordering = ['id']
        unique_together = ('page', 'content', 'interaction_node', 'user')

    
    @models.permalink
    def get_absolute_url(self):
        return ('api.urls.Interaction.resource_uri()', [str(self.id)])
    
    def __unicode__(self):
        return u'Interaction(id: {0})'.format(self.id)


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

class SocialUser(models.Model):
    """Social Auth association model"""
    user = models.OneToOneField(User, related_name='social_user')
    provider = models.CharField(max_length=32)
    uid = models.CharField(max_length=255, unique=True)
    full_name = models.CharField(max_length=255)

    # Might not get these -> blank=True
    username = models.CharField(max_length=255, blank=True, unique=True)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, blank=True)
    hometown = models.CharField(max_length=255, blank=True)
    bio = models.TextField(blank=True)
    img_url = models.CharField(max_length=255, blank=True)

    def __unicode__(self):
        return self.user.username

    class Meta:
        unique_together = ('provider', 'uid')

class SocialAuth(models.Model):
    social_user = models.ForeignKey(SocialUser, related_name='social_auth')
    auth_token = models.CharField(max_length=103, unique=True)
    expires = models.DateTimeField(null=True)

    class Meta:
        unique_together = ('auth_token', 'expires')