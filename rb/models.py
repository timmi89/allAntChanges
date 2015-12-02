from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db.models import Count
#from treebeard.mp_tree import MP_Node
from django.contrib.auth.models import User
from baseconv import base62_encode
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

class InteractionManager(models.Manager):
    def node_count(self):
        subquery = """(SELECT node.body, Count(interaction_node_id) AS count
                       FROM rb_interaction AS interaction, rb_interactionnode AS node
                       GROUP BY interaction_node_id) AS interaction_count"""
        condition = 'interaction.interaction_node_id = node.id' # Join
        order = '-count'
        return self.get_query_set().extra(
            tables=[subquery],
            where=[condition]).order_by(order
        )

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
Antenna Models
"""
class InteractionNode(models.Model):
    body = models.TextField()
    #hash = models.CharField(max_length=32, unique=True, db_index=True)

    def natural_key(self):
        return self.body

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

import os
def get_image_path(instance, filename):
    return os.path.join('users/', str(instance.id) +'/avatars/', filename)


class SocialUser(models.Model):
    GENDER_CHOICES = (
        ('M', 'Male'),
        ('F', 'Female'),
    )

    # For Privacy
    private_profile = models.BooleanField(default=False)
    follow_email_option = models.BooleanField(default=True)
    notification_email_option = models.BooleanField(default=True)


    """Social Auth association model"""
    user = models.OneToOneField(User, related_name='social_user', unique=True)
    provider = models.CharField(max_length=32)
    uid = models.CharField(max_length=255, unique=True)
    full_name = models.CharField(max_length=255)

    # Might not get these -> blank=True
    username = models.CharField(max_length=255, blank=True, null=True)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, blank=True, null=True)
    hometown = models.CharField(max_length=255, blank=True, null=True)
    bio = models.TextField(max_length=255, blank=True, null=True)
    img_url = models.URLField(blank=True)

    avatar = models.ImageField(upload_to=get_image_path, blank=True, null=True)

    default_tags = models.ManyToManyField(InteractionNode, through='UserDefaultTag')

    def admin_groups_unapproved(self):
        ga = GroupAdmin.objects.filter(social_user=self, approved=False)
        return Group.objects.filter(id__in=ga.values('group'))

    def admin_groups(self):
        ga = GroupAdmin.objects.filter(social_user=self, approved=True)
        return Group.objects.filter(id__in=ga.values('group'))

    def admin_group(self):
        return self.admin_groups()[0]

    def __unicode__(self):
        return self.user.username

    class Meta:
        unique_together = ('provider', 'uid', 'username')

class Product(models.Model):
    # just using text fields.  postgre does not care (http://stackoverflow.com/questions/7354588/django-charfield-vs-textfield) and mysql, well, whatever  -- pb.
    # all from schema.org ProductModel -- http://schema.org/ProductModel
    additionalType              = models.TextField(blank=True, null=True)
    alternateName               = models.TextField(blank=True, null=True)
    description                 = models.TextField(blank=True, null=True)
    image                       = models.TextField(blank=True, null=True)
    name                        = models.TextField(blank=True, null=True)
    sameAs                      = models.TextField(blank=True, null=True)
    url                         = models.TextField(blank=True, null=True)
    aggregateRating_ratingValue             = models.TextField(blank=True, null=True)
    brand_name                       = models.TextField(blank=True, null=True)
    color                       = models.TextField(blank=True, null=True)
    gtin13                      = models.TextField(blank=True, null=True)
    gtin14                      = models.TextField(blank=True, null=True)
    gtin8                       = models.TextField(blank=True, null=True)
    logo                        = models.TextField(blank=True, null=True)
    manufacturer                = models.TextField(blank=True, null=True)
    model                       = models.TextField(blank=True, null=True)
    mpn                         = models.TextField(blank=True, null=True)
    offers_price                      = models.TextField(blank=True, null=True)
    offers_priceCurrency                      = models.TextField(blank=True, null=True)
    productID                   = models.TextField(blank=True, null=True)
    releaseDate                 = models.TextField(blank=True, null=True)
    sku                         = models.TextField(blank=True, null=True)
    weight                      = models.TextField(blank=True, null=True)
    width                       = models.TextField(blank=True, null=True)

    def __unicode__(self):
        return self.name

    # class Meta:
    #     ordering = ['name']

class Group(models.Model):
    name = models.CharField(max_length=250)
    short_name = models.CharField(max_length=50, unique=True)
    language = models.CharField(max_length=25, default="en")
    approved = models.BooleanField(default=False)
    activated = models.BooleanField(default=False)
    requires_approval = models.BooleanField(default=False)
    signin_organic_required = models.BooleanField(default=False)
    demo_group = models.BooleanField(default=False)
    word_blacklist = models.TextField(blank=True)
    paragraph_helper = models.BooleanField(default=True)
    media_url_ignore_query = models.BooleanField(default=True)
    ignore_subdomain = models.BooleanField(default=False)
    page_tld = models.CharField(max_length=255, default='', blank=True)

    # is premium?
    premium = models.BooleanField(default=False)
    send_notifications = models.BooleanField(default=True)

    # Customization
    call_to_action = models.CharField(max_length=255, default='', blank=True)
    media_display_pref = models.CharField(max_length=25, default='', blank=True)

    # Jquery settings
    inline_selector = models.CharField(max_length=100, default='', blank=True)
    inline_func = models.CharField(max_length=25, default='', blank=True)

    # new attributes for data dashboard.  all are form fields to support page settings.
    author_selector = models.CharField(max_length=255, blank=True) # jquery()
    author_attribute = models.CharField(max_length=255, blank=True) # jquery .attr()
    topics_selector = models.CharField(max_length=255, blank=True) # jquery()
    topics_attribute = models.CharField(max_length=255, blank=True) # jquery .attr()
    section_selector = models.CharField(max_length=255, blank=True)  # jquery()
    section_attribute = models.CharField(max_length=255, blank=True)  # jquery .attr()

    # new attributes for updated antenna design.
    img_indicator_show_onload = models.BooleanField(default=True)
    img_indicator_show_side = models.CharField(max_length=25, default='', blank=True)
    tag_box_bg_colors = models.TextField(blank=True, null=True)
    tag_box_bg_colors_hover = models.TextField(blank=True, null=True)
    tag_box_text_colors = models.TextField(blank=True, null=True)
    tag_box_font_family = models.TextField(blank=True, null=True)
    tag_box_gradient = models.TextField(blank=True, null=True)
    tags_bg_css = models.TextField(blank=True, null=True)


    # mobile settings
    hideOnMobile = models.BooleanField(default=False)
    hideDoubleTapMessage = models.BooleanField(default=False)
    doubleTapMessage = models.TextField(blank=True)
    doubleTapMessagePosition = models.CharField(max_length=25, default='bottom')

    # Many to many relations
    admins = models.ManyToManyField(SocialUser, through='GroupAdmin')
    blessed_tags = models.ManyToManyField(InteractionNode, through='GroupBlessedTag', related_name = 'Blessed Tag')

    blocked_tags = models.ManyToManyField(InteractionNode, through='BlockedTag', related_name = 'Blocked Tag')
    blocked_promo_tags = models.ManyToManyField(InteractionNode, through='BlockedPromoTag', related_name = 'Blocked Promo Tag')

    all_tags = models.ManyToManyField(InteractionNode, through='AllTag', related_name = 'All Tag')


    # black/whitelist fields
    active_sections = models.CharField(max_length=255, blank=True)
    anno_whitelist = models.CharField(max_length=255, blank=True, default=u"p,img")
    img_whitelist = models.CharField(max_length=255, blank=True)
    img_blacklist = models.CharField(max_length=255, blank=True)
    no_readr = models.CharField(max_length=255, blank=True)
    post_selector = models.CharField(max_length=255, blank=True)
    post_href_selector = models.CharField(max_length=255, blank=True)
    summary_widget_selector = models.CharField(max_length=255, blank=True)
    summary_widget_method = models.CharField(max_length=255, blank=True)
    summary_widget_expanded_mobile = models.BooleanField(default=False)
    br_replace_scope_selector = models.CharField(max_length=255, blank=True)
    separate_cta = models.CharField(max_length=255, blank=True)
    separate_cta_expanded = models.CharField(max_length=255, blank=True, default="none")

    # logo fields
    logo_url_sm = models.CharField(max_length=200, blank=True)
    logo_url_med = models.CharField(max_length=200, blank=True)
    logo_url_lg = models.CharField(max_length=200, blank=True)

    # features
    share = models.ForeignKey(Feature, related_name = 'Share Feature', default=1)
    rate = models.ForeignKey(Feature, related_name = 'Rate Feature', default=1)
    comment = models.ForeignKey(Feature, related_name = 'Comment Feature', default=1)
    bookmark = models.ForeignKey(Feature, related_name = 'Bookmark Feature', default=1)
    search = models.ForeignKey(Feature, related_name = 'Search Feature', default=1)

    # social shiz
    twitter = models.CharField(max_length=64, blank=True)

    sharebox_show  = models.BooleanField(default=False)
    sharebox_fade  = models.BooleanField(default=False)
    sharebox_should_own  = models.BooleanField(default=False)
    sharebox_selector  = models.CharField(max_length=100, default='', blank=True)
    sharebox_facebook  = models.BooleanField(default=False)
    sharebox_twitter  = models.BooleanField(default=False)
    sharebox_stumble  = models.BooleanField(default=False)
    sharebox_digg  = models.BooleanField(default=False)
    sharebox_reddit  = models.BooleanField(default=False)
    sharebox_google  = models.BooleanField(default=False)

    # Antenna Broadcast widget settings.  i.e. the recirc widget.
    show_recirc = models.BooleanField(default=False)
    recirc_selector = models.CharField(max_length=255, blank=True)
    recirc_title = models.CharField(max_length=255, blank=True)
    recirc_background = models.TextField(blank=True, null=True)
    recirc_jquery_method = models.CharField(max_length=255, blank=True)

    image_selector = models.CharField(max_length=255, blank=True)
    image_attribute = models.CharField(max_length=255, blank=True)
    # temporary user settings
    temp_interact = models.IntegerField(default=5)

    # css
    custom_css = models.TextField(blank=True)

    def __unicode__(self):
        return self.name

    class Meta:
        ordering = ['short_name']

class GroupBlessedTag(models.Model):
    group = models.ForeignKey(Group)
    node = models.ForeignKey(InteractionNode)
    order =  models.IntegerField()

    def __unicode__(self):
        return str(self.group) + ":" + str(self.node) + "" + str(self.order)

    class Meta:
        ordering = ['order']

class BlockedTag(models.Model):
    group = models.ForeignKey(Group)
    node = models.ForeignKey(InteractionNode)
    order =  models.IntegerField()

    def __unicode__(self):
        return str(self.group) + ":" + str(self.node) + "" + str(self.order)

    class Meta:
        ordering = ['order']
        unique_together = ('group', 'node')

class BlockedPromoTag(models.Model):
    group = models.ForeignKey(Group)
    node = models.ForeignKey(InteractionNode)
    order =  models.IntegerField()

    def __unicode__(self):
        return str(self.group) + ":" + str(self.node) + "" + str(self.order)

    class Meta:
        ordering = ['order']
        unique_together = ('group', 'node')

class AllTag(models.Model):
    group = models.ForeignKey(Group)
    node = models.ForeignKey(InteractionNode)
    order =  models.IntegerField()

    def __unicode__(self):
        return str(self.group) + ":" + str(self.node) + "" + str(self.order)

    class Meta:
        ordering = ['order']
        unique_together = ('group', 'node')


class UserDefaultTag(models.Model):
    social_user = models.ForeignKey(SocialUser)
    node = models.ForeignKey(InteractionNode)
    order =  models.IntegerField()

    def __unicode__(self):
        return str(self.social_user) + ":" + str(self.node) + "" + str(self.order)

    class Meta:
        ordering = ['order']

class GroupAdmin(models.Model):
    group = models.ForeignKey(Group)
    social_user = models.ForeignKey(SocialUser)
    approved = models.BooleanField(default=False)

    def __unicode__(self):
        return str(self.group) + ":" + self.social_user.full_name + ":" + str(self.approved)

    class Meta:
        unique_together = ('group', 'social_user')

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
    domain = models.CharField(max_length=100, unique=True)
    group = models.ForeignKey(Group)
    include_selectors = models.CharField(max_length=255, blank=True)
    no_rdr_selectors = models.CharField(max_length=255, blank=True)
    css = models.URLField(blank=True)
    querystring_content = models.BooleanField(default=False)

    # social shiz
    twitter = models.CharField(max_length=64, blank=True)

    # logo fields
    logo_url_sm = models.CharField(max_length=200, blank=True)
    logo_url_med = models.CharField(max_length=200, blank=True)
    logo_url_lg = models.CharField(max_length=200, blank=True)

    class Meta:
        unique_together = ('name', 'domain', 'group')

    def __unicode__(self):
        return unicode(self.name)

class Page(models.Model):
    site = models.ForeignKey(Site)
    url = models.URLField()
    title = models.CharField(max_length=255, blank=True)
    canonical_url = models.URLField(blank=True)
    image = models.CharField(max_length=255, blank=True)
    # new for data dashboard v2
    author = models.CharField(max_length=255, blank=True) # text, i.e. "John Dear"
    topics = models.CharField(max_length=255, blank=True) # comma-delimited, i.e. "politics, healthcare, lovin"
    section = models.CharField(max_length=255, blank=True)  # publisher defined, i.e. "Politics"

    created = models.DateTimeField(auto_now_add=True, editable=False)

    def interactions(self):
        return Interaction.objects.filter(page=self)

    def tags(self):
        return Interaction.objects.filter(page=self, kind='tag')

    def top_tags(self):
        pass

    class Meta:
        unique_together = ('site','url', 'canonical_url')

    def __unicode__(self):
        return unicode(self.id)

class Content(DateAwareModel):
    CONTENT_TYPES = (
        ('pag', 'page'),
        ('txt', 'text'),
        ('img', 'img'),
        ('med', 'media'),
    )
    kind = models.CharField(max_length=3, choices=CONTENT_TYPES, default='pag')
    location = models.CharField(max_length=255, blank=True, null=True)
    body = models.TextField()
    height =  models.IntegerField(default = 0, null=True)
    width =  models.IntegerField(default = 0, null=True)
    #hash = models.CharField(max_length=32, unique=True, db_index=True)

    def __unicode__(self):
        return u'Kind: {0}, ID: {1}'.format(self.kind, self.id)

    class Meta:
        verbose_name_plural = "content"

class Container(models.Model):
    hash = models.CharField(max_length=32, unique=True, db_index=True)
    body = models.TextField()
    kind = models.CharField(max_length=25)
    item_type = models.CharField(max_length=64, blank=True, db_index=True)

    def __unicode__(self):
        return unicode(self.id) + " : " + self.hash

class Interaction(DateAwareModel, UserAwareModel):
    objects = InteractionManager()
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
    promotable = models.BooleanField(default=True)
    anonymous = models.BooleanField(default=False)
    parent= models.ForeignKey('self', blank=True, null=True)
    kind = models.CharField(max_length=3, choices=INTERACTION_TYPES)

    rank = models.BigIntegerField(default = 0)

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
        return base62_encode(self.id)

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

class SocialAuth(models.Model):
    social_user = models.ForeignKey(SocialUser, related_name='social_auth')
    auth_token = models.CharField(max_length=255)
    expires = models.DateTimeField(null=True)

    class Meta:
        unique_together = ('auth_token', 'expires')


class Board(DateAwareModel):
    owner = models.ForeignKey(User, related_name='board_owner')
    admins = models.ManyToManyField(User, through='BoardAdmin')
    title = models.CharField(max_length = 255, blank=False, null=False, unique=True)
    description = models.TextField()
    interactions = models.ManyToManyField(Interaction, through='BoardInteraction')
    active = models.BooleanField(default=True)
    visible = models.BooleanField(default=True)


    def __unicode__(self):
        return unicode(str(self.owner.username) + ":" + str(self.active) + ":" + str(self.visible) + ":" + self.title)

    class Meta:
        unique_together = ('owner', 'title')



class BoardInteraction(models.Model):
    board = models.ForeignKey(Board)
    interaction = models.ForeignKey(Interaction)

    def __unicode__(self):
        return unicode(str(self.board) + ":" + str(self.interaction.id))

    class Meta:
        unique_together = ('board','interaction')



class BoardAdmin(models.Model):
    board = models.ForeignKey(Board)
    user = models.ForeignKey(User)
    approved = models.BooleanField(default=True)

    def __unicode__(self):
        return str(self.board) + ":" + self.user.username + ":" + str(self.approved)

    class Meta:
        unique_together = ('board', 'user')



class Follow(models.Model):
    FOLLOW_TYPES = (
        ('pag', 'page'),
        ('usr', 'user'),
        ('grp', 'group'),
        ('brd', 'board'),
    )
    owner = models.ForeignKey(User, related_name='follow_owner')
    type = models.CharField(max_length=3, choices=FOLLOW_TYPES)
    page = models.ForeignKey(Page, blank=True, null=True, related_name='followed_page')
    user = models.ForeignKey(User, blank=True, null=True, related_name='followed_user')
    group = models.ForeignKey(Group, blank=True, null=True, related_name='followed_group')
    board = models.ForeignKey(Board, blank=True, null=True, related_name='followed_board')
    follow_id = models.IntegerField(default = 0)

    def __unicode__(self):
        return unicode(str(self.owner.id) + " " + self.type + " " + str(self.follow_id))

    class Meta:
        unique_together = ('owner', 'type', 'follow_id')





