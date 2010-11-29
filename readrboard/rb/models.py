from django.db import models
from django.contrib.auth.models import User
from django.contrib.sites.models import Site
import datetime

class Node(models.Model):
    inserted = models.DateField(auto_now_add=True, editable=False)    
    updated = models.DateField(auto_now=True, editable=False)
    class Meta:
        abstract = True

class Page(Node):
    site = models.ForeignKey(Site)
    url = models.URLField()

class RBNode(Node):
    page = models.ManyToManyField(Page, editable=False)
    hash = models.CharField(max_length=32, editable=False)
    content = models.TextField() #make this something better

class Tag(Node):
    parent = Node()
    tag = models.CharField(max_length=50)

class Group():
    include_selectors = models.CharField(max_length=250)
    no_rdr_selectors = models.CharField(max_length=250)
    group_tags = models.ManyToManyField(Tag)

class FacebookProfileModel(models.Model):
    about_me = models.TextField(blank=True, null=True)
    facebook_id = models.IntegerField(blank=True, null=True)
    facebook_name = models.CharField(max_length=255, blank=True, null=True)
    facebook_profile_url = models.TextField(blank=True, null=True)
    website_url = models.TextField(blank=True, null=True)
    blog_url = models.TextField(blank=True, null=True)
    image = models.ImageField(blank=True, null=True, upload_to='profile_images')
    date_of_birth = models.DateField(blank=True, null=True)
    
    class Meta:
        abstract = True

class ReadrUser(FacebookProfileModel):
    user = models.ForeignKey(User, unique=True)
