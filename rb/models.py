from django.db import models
from django.contrib.auth.models import User
from django.contrib.sites.models import Site
import datetime

Node_Types = (
    ('TXT', 'Text'),
    ('IMG', 'Image'),
    ('VID', 'Video'),
    ('SND', 'Sound'),
)

class Node(models.Model):
    parent = models.ForeignKey(
        'self',
        related_name='children',
        blank=True,
        null=True)
    inserted = models.DateTimeField(auto_now_add=True, editable=False)
    updated = models.DateTimeField(auto_now=True, editable=False)
    class Meta:
        abstract = True

        
class RBGroup(models.Model):
    name = models.CharField(max_length=250)
    short_name = models.CharField(max_length=25)
    include_selectors = models.CharField(max_length=250)
    no_rdr_selectors = models.CharField(max_length=250)
    css = models.URLField()

    def __unicode__(self):
        return self.name

class RBSite(Site):
	rb_group = models.ForeignKey(RBGroup)
	include_selectors = models.CharField(max_length=250, blank=True)
	no_rdr_selectors = models.CharField(max_length=250, blank=True)
	css = models.URLField(blank=True)

class RBPage(models.Model):
    rb_site = models.ForeignKey(RBSite)
    url = models.URLField()

    def __unicode__(self):
        return self.url

class FacebookProfileModel(models.Model):
    about_me = models.TextField(blank=True, null=True)
    facebook_id = models.IntegerField(blank=True, null=True)
    facebook_name = models.CharField(max_length=255, blank=True, null=True)
    facebook_profile_url = models.TextField(blank=True, null=True)
    website_url = models.TextField(blank=True, null=True)
    blog_url = models.TextField(blank=True, null=True)
    #image = models.ImageField(blank=True, null=True, upload_to='profile_images')
    date_of_birth = models.DateField(blank=True, null=True)
    
    class Meta:
        abstract = True

#class ReadrUser(FacebookProfileModel):
#    user = models.ForeignKey(User, unique=True)

class ContentNode(Node):
    user = models.ForeignKey(User)
    type = models.CharField(max_length=3, choices=Node_Types)
    rb_page = models.ForeignKey(RBPage)
    hash = models.CharField(max_length=32, editable=True)
    content = models.TextField() #make this something better

    def __unicode__(self):
        return self.hash

class Comment(Node):
    user = models.ForeignKey(User)
    comment = models.TextField()

    def __unicode__(self):
        return unicode(self.user+":"+self.parent+":"+self.tag)

class Tag(Node):
    user = models.ForeignKey(User)
    tag = models.CharField(max_length=160)

    def __unicode__(self):
        return unicode(self.tag)
