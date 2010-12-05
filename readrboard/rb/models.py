from django.db import models
from django.contrib.auth.models import User
from django.contrib.sites.models import Site
import datetime

Node_Types = (
    ('TXT', 'Text'),
    ('IMG', 'Image'),
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

class Page(Node):
    site = models.ForeignKey(Site)
    url = models.URLField()

    def __unicode__(self):
        return self.url

class Group():
    include_selectors = models.CharField(max_length=250)
    no_rdr_selectors = models.CharField(max_length=250)

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
    page = models.ForeignKey(Page)
    hash = models.CharField(max_length=32, editable=False)
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
