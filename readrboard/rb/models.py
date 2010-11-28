from django.db import models
from django.contrib.auth.models import User
<<<<<<< HEAD:readrboard/rb/models.py
from django.contrib.sites.models import Site
import datetime

class Node(models.Model):
    inserted = models.DateField(auto_now_add=True, editable=False)    
    updated = models.DateField(auto_now=True, editable=False)
    class Meta:
        abstract = True

class Article(Node):
    site = models.ForeignKey(Site)
    url = models.URLField()

class RBNode(Node):
    article = models.ManyToManyField(Article, editable=False)
    hash = models.CharField(max_length=32, editable=False)

class Tag(Node):
    parent = Node()
    tag = models.CharField(max_length=50)

class Rating(Node):
    parent = RBNode()
    rating = models.PositiveSmallIntegerField()

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
=======
import datetime

# Create your models here.
class Node(models.Model):
    # Time fields
    created = models.DateField(auto_now_add=True, editable=False, verbose_name='time-created')
    modified = models.DateField(auto_now=True, editable=False, verbose_name='time-modified')
    # Connectors
    user = models.ForeignKey(User)
    parent = models.ForeignKey('self', null=True, blank=True)
    # Content
    body = models.TextField()
    shorturl = models.URLField(blank=True)
    
    def __unicode__(self):
        title = self.body
        if len(self.body) > 50:
            title = u"%s ..." % title[0:50]
        return title

    class Meta:
        verbose_name_plural = 'nodes'
        ordering = ['-modified']
>>>>>>> 85cf3579d8b7dcc7e8987d7dffb93cc008c98403:readrboard/rb/models.py
