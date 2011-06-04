from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
#from treebeard.mp_tree import MP_Node
from django.contrib.auth.models import User
from baseconv import base62
import datetime

"""
Abstract Models
"""
class DateAwareModel(models.Model):
    created = models.DateTimeField(auto_now_add=True, editable=False)
    modified = models.DateTimeField(auto_now=True, editable=False)    

    class Meta:
        abstract = True

class UserAwareModel(models.Model):
    user = models.ForeignKey(User)

    class Meta:
        abstract = True

"""
ReadrBoard Models
"""
class InteractionNode(models.Model):
    body = models.CharField(max_length=2048)
    
    def __unicode__(self):
        return u'ID: {0}, Body: {1}'.format(self.id, self.body[:25])

class Feature(models.Model):
    text = models.BooleanField(editable=False)
    images = models.BooleanField(editable=False)
    flash = models.BooleanField(editable=False)

    class Meta:
        unique_together = ('text','images','flash')

    def __unicode__(self):
        return u'Feature(Text: {0}, Images: {1}, Flash: {2})'.format(self.text, self.images, self.flash)

class Group(models.Model):
    name = models.CharField(max_length=250)
    short_name = models.CharField(max_length=25, unique=True)
    language = models.CharField(max_length=25,default="en")
    blessed_tags = models.ManyToManyField(InteractionNode)

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
    name = models.CharField(max_length=100, unique=True)
    domain = models.CharField(max_length=50, unique=True)
    group = models.ForeignKey(Group)
    include_selectors = models.CharField(max_length=250, blank=True)
    no_rdr_selectors = models.CharField(max_length=250, blank=True)
    css = models.URLField(blank=True)

    def __unicode__(self):
        return unicode(self.name)

class Page(models.Model):
    site = models.ForeignKey(Site)
    url = models.URLField(verify_exists=False)
    title = models.TextField(blank=True)
    canonical_url = models.URLField(verify_exists=False, blank=True)
    interaction_count = models.PositiveIntegerField(default=0)

    def __unicode__(self):
        return unicode(self.id)

class Content(DateAwareModel):
    CONTENT_TYPES = (
        ('txt', 'text'),
        ('img', 'image'),
        ('vid', 'video'),
        ('snd', 'sound'),
        ('fla', 'flash')
    )

    kind = models.CharField(max_length=3, choices=CONTENT_TYPES, default='txt')
    location = models.CharField(max_length=255)
    body = models.TextField()
    
    def __unicode__(self):
        return u'Kind: {0}, ID: {1}'.format(self.kind, self.id)
    
    class Meta:
        verbose_name_plural = "content"
        #unique_together = ('kind','body')

class Container(models.Model):
    hash = models.CharField(max_length=32, unique=True, db_index=True)
    body = models.TextField()

    def __unicode__(self):
        return unicode(self.id) + " : " + self.hash

class Interaction(DateAwareModel, UserAwareModel):
    INTERACTION_TYPES = (
        ('tag', 'Tag'),
        ('com', 'Comment'),
        ('bkm', 'Bookmark'),
        ('shr', 'Share'),
        ('vup', 'Vote Up'),
        ('vdn', 'Vote Down')
    )
    page = models.ForeignKey(Page)
    container = models.ForeignKey(Container, blank=True, null=True)
    content = models.ForeignKey(Content)
    interaction_node = models.ForeignKey(InteractionNode)
    anonymous = models.BooleanField(default=False)
    parent= models.ForeignKey('self', blank=True, null=True)
    kind = models.CharField(max_length=3, choices=INTERACTION_TYPES)
    
    # Don't f-ing change this number - super important
    # steplen = 10
    
    class Meta:
        ordering = ['page','container','kind','interaction_node']
        unique_together = ('page', 'content', 'kind', 'interaction_node', 'user')
   
    def __unicode__(self):
        return u'id: {0}'.format(self.id)


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

class Profile(models.Model):
    user = models.OneToOneField(User)
    group_admin = models.ForeignKey(Group, blank=True, null=True)
    educated = models.BooleanField()
    
class SocialUser(models.Model):
    GENDER_CHOICES = (
        ('M', 'Male'),
        ('F', 'Female'),
    )

    """Social Auth association model"""
    user = models.OneToOneField(User, related_name='social_user', unique=True)
    provider = models.CharField(max_length=32)
    uid = models.CharField(max_length=255, unique=True)
    full_name = models.CharField(max_length=255)

    # Might not get these -> blank=True
    username = models.CharField(max_length=255, blank=True, unique=True)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, blank=True)
    hometown = models.CharField(max_length=255, blank=True)
    bio = models.TextField(max_length=255, blank=True, null=True)
    img_url = models.URLField(blank=True)

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