from django.db import models
from django.contrib.auth.models import User
from django.contrib.sites.models import Site
import datetime

NODE_TYPES = (
    (0, 'text'),
    (1, 'image'),
    (2, 'video'),
    (3, 'sound'),
)

FEATURE_TYPES = (
    (0, 'share'),
    (1, 'rate'),
    (2, 'comment'),
    (3, 'bookmark'),
    (4, 'search'),
)

FEATURE_LOOKUP = dict([(a[1], a[0]) for a in FEATURE_TYPES])

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
    type = models.CharField(max_length=3, choices=NODE_TYPES)
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
