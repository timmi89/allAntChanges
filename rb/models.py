from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db.models import Count
#from treebeard.mp_tree import MP_Node
from django.contrib.auth.models import User
from baseconv import base62
import datetime

"""
Custom Managers
"""
class TagManager(models.Manager):
    def get_query_set(self):
        return super(TagManager, self).get_query_set().filter(kind='tag')

class CommentManager(models.Manager):
    def get_query_set(self):
        return super(CommentManager, self).get_query_set().filter(kind='com')

# Sample manager w/ custom sql
class InteractionManager(models.Manager):
    def with_counts(self):
        from django.db import connection
        cursor = connection.cursor()
        cursor.execute("""
            SELECT p.id, p.question, p.poll_date, COUNT(*)
            FROM polls_opinionpoll p, polls_response r
            WHERE p.id = r.poll_id
            GROUP BY 1, 2, 3
            ORDER BY 3 DESC""")
        result_list = []
        for row in cursor.fetchall():
            p = self.model(id=row[0], question=row[1], poll_date=row[2])
            p.num_responses = row[3]
            result_list.append(p)
        return result_list

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
    
    def tag_count(self, page=None, content=None):
        tags = self.interaction_set.filter(kind='tag')
        if page: tags = tags.filter(page=page)
        if content: tags = tags.filter(content=content)
        
        return len(tags)
    
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
    language = models.CharField(max_length=25, default="en")
    requires_approval = models.BooleanField(default=False)
    blessed_tags = models.ManyToManyField(InteractionNode)

    # black/whitelist fields
    anno_whitelist = models.CharField(max_length=255, blank=True, default=u"p,img")
    img_whitelist = models.CharField(max_length=255, blank=True)
    img_blacklist = models.CharField(max_length=255, blank=True)
    no_readr = models.CharField(max_length=255, blank=True)
    word_blacklist = models.TextField(blank=True)
    
    # logo fields
    logo_url_sm = models.URLField(blank=True, verify_exists=False)
    logo_url_med = models.URLField(blank=True, verify_exists=False)
    logo_url_lg = models.URLField(blank=True, verify_exists=False)

    # features
    share = models.ForeignKey(Feature, related_name = 'Share Feature')
    rate = models.ForeignKey(Feature, related_name = 'Rate Feature')
    comment = models.ForeignKey(Feature, related_name = 'Comment Feature')
    bookmark = models.ForeignKey(Feature, related_name = 'Bookmark Feature')
    search = models.ForeignKey(Feature, related_name = 'Search Feature')

    # social shiz
    twitter = models.CharField(max_length=64, blank=True)

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
    include_selectors = models.CharField(max_length=255, blank=True)
    no_rdr_selectors = models.CharField(max_length=255, blank=True)
    css = models.URLField(blank=True)

    class Meta:
        unique_together = ('name', 'domain', 'group')

    def __unicode__(self):
        return unicode(self.name)

class Page(models.Model):
    site = models.ForeignKey(Site)
    url = models.URLField(verify_exists=False)
    title = models.CharField(max_length=255, blank=True)
    canonical_url = models.URLField(verify_exists=False, blank=True)

    def interactions(self):
        return Interaction.objects.filter(page=self)

    def tags(self):
        return Interaction.objects.filter(page=self, kind='tag')
        
    def top_tags(self):
        pass

    def __unicode__(self):
        return unicode(self.id)

class Content(DateAwareModel):
    CONTENT_TYPES = (
        ('txt', 'text'),
        ('img', 'img'),
        ('med', 'media'),
    )
    kind = models.CharField(max_length=3, choices=CONTENT_TYPES, default='txt')
    location = models.CharField(max_length=255, blank=True, null=True)
    body = models.TextField()
    
    def __unicode__(self):
        return u'Kind: {0}, ID: {1}'.format(self.kind, self.id)
    
    class Meta:
        verbose_name_plural = "content"
        #unique_together = ('kind','body') - breaks mySQL

class Container(models.Model):
    hash = models.CharField(max_length=32, unique=True, db_index=True)
    body = models.TextField()
    kind = models.CharField(max_length=25)

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
    approved = models.BooleanField(default=True)
    anonymous = models.BooleanField(default=False)
    parent= models.ForeignKey('self', blank=True, null=True)
    kind = models.CharField(max_length=3, choices=INTERACTION_TYPES)
    
    class Meta:
        ordering = ['-created']
        unique_together = ('page', 'content', 'kind', 'interaction_node', 'user')
        
    def tag_count(self):
        return self.interaction_node.tag_count(
            page=self.page,
            content=self.content
        )
 
    def related_tags(self):
        rt = Interaction.objects.filter(
            page=self.page,
            content=self.content,
            kind='tag'
        ).exclude(interaction_node=self.interaction_node)
        
        ids = rt.values('interaction_node')
        
        interaction_nodes = InteractionNode.objects.filter(id__in=ids)
        
        return interaction_nodes
    
    def human_kind(self):
        return dict(((k,v) for k,v in self.INTERACTION_TYPES))[self.kind]
        
    def comments(self):
        return Interaction.objects.filter(parent=self, kind='com')
   
    def __unicode__(self):
        return u'id: {0}'.format(self.id)

class Link(models.Model):
    interaction = models.ForeignKey(Interaction, unique=True)
    usage_count = models.IntegerField(default=0, editable=False)
    
    def to_base62(self):
        return base62.from_decimal(self.id)

    def short_url(self):
        return settings.SITE_BASE_URL + self.to_base62()
    
    def __unicode__(self):
        return self.to_base62() + ' : ' + self.interaction.page.url

class ScrubList(models.Model):
    group = models.ForeignKey(Group)
    bad_word = models.CharField(max_length=50)
    scrubbed_word = models.CharField(max_length=50)

class Profile(models.Model):
    user = models.OneToOneField(User)
    educated = models.BooleanField()
    #following = models.ForeignKey(User)
    
class SocialUser(models.Model):
    GENDER_CHOICES = (
        ('M', 'Male'),
        ('F', 'Female'),
    )
    
    # For admin
    admin_approved = models.BooleanField(default=False)
    group_admin = models.ForeignKey(Group, blank=True, null=True)

    """Social Auth association model"""
    user = models.OneToOneField(User, related_name='social_user', unique=True)
    provider = models.CharField(max_length=32)
    uid = models.CharField(max_length=255, unique=True)
    full_name = models.CharField(max_length=255)

    # Might not get these -> blank=True
    username = models.CharField(max_length=255, blank=True, unique=True, null=True)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, blank=True, null=True)
    hometown = models.CharField(max_length=255, blank=True, null=True)
    bio = models.TextField(max_length=255, blank=True, null=True)
    img_url = models.URLField(blank=True)
    
    def is_admin(self):
        return admin_approved

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