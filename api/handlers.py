from piston.handler import AnonymousBaseHandler
from django.http import HttpResponse, HttpResponseBadRequest
from django.db.models import Count
from decorators import status_response, json_data
from exceptions import JSONException
from utils import *
from userutils import *
from authentication.token import *
from settings import BASE_URL

class SocialUserHandler(AnonymousBaseHandler):
    model = SocialUser
    fields = ('user','full_name', 'img_url')

class UserHandler(AnonymousBaseHandler):
    model = User
    exclude = (
        'is_active',
        'is_superuser',
        'is_staff',
        'password',
        'last_login',
        'email',
        'date_joined',
        'username'
    )

class InteractionNodeHandler(AnonymousBaseHandler):
    model = InteractionNode
    fields = ('id', 'body', 'kind')

class ContentHandler(AnonymousBaseHandler):
    model = Content
    fields = ('id', 'body', 'kind')

class FeatureHandler(AnonymousBaseHandler):
    model = Feature
    fields = ('feature_type', 'text', 'images', 'flash')

class ContainerHandler(AnonymousBaseHandler):
    model = Container
    fields = ('id', 'hash')

class InteractionInstanceHandler(AnonymousBaseHandler):
    model = Interaction
    fields = ('id', 'interaction_node')

class PrivacyHandler(AnonymousBaseHandler):
    @json_data
    @status_response
    def read(self, request, data):
        # Check if current user's token has permission
        user = checkToken(data)
        if not user: raise JSONException(u"Token was invalid")
        
        # Retrieve social user
        try:
            su = SocialUser.objects.get(user=user)
        except SocialUser.DoesNotExist, SocialUser.MultipleObjectsReturned:
            raise JSONException(u"Privacy Handler: Error getting socialuser!")
            
        # Update and save social user -- toggle privacy
        su.private_profile = not su.private_profile
        su.save()

class ModerationHandler(AnonymousBaseHandler):
    @json_data
    @status_response
    def read(self, request, data):
        data['group_id'] = 1
        
        # Check if current user's token has permission
        user = checkToken(data)
        if not user: raise JSONException(u"Token was invalid")
        
        int_id = data.get('int_id')

        try:
            interaction = Interaction.objects.get(id=int_id)
        except User.DoesNotExist, User.MultipleObjectsReturned:
            raise JSONException(u"Interaction Handler: Error getting interaction!")

        if user.social_user.admin_approved:
            if interaction.page.site.group_id == user.social_user.group_admin_id:
                interaction.approved = False
                interaction.save()
            else:
                raise JSONException(u'Admin not approved for this group!')
        else:
            raise JSONException(u'Admin not approved!')

class InteractionHandler(AnonymousBaseHandler):
    @json_data
    @status_response
    def read(self, request, data, **kwargs):
        # retrieve action flag
        action = kwargs.get('action')

        # do view action
        if action == 'view':
            interaction_id = data['int_id']
            try:
                interactions = Interaction.objects.filter(parent=interaction_id)
            except Interaction.DoesNotExist:
                raise JSONException(u"Interaction did not exist!")
            return interactions
        
        else:
            # check to see if user's token is valid
            user = checkToken(data)
            if not user: raise JSONException(u"Token was invalid")

            # do create action - varies per interaction
            if action == 'create':
                page_id = data.get('page_id')
                try:
                    page = Page.objects.get(id=page_id)
                except Page.DoesNotExist, Page.MultipleObjectsReturned:
                    raise JSONException(u"Interaction Handler: Error getting page!")
                
                group_id = data.get('group_id')
                try:
                    group = Group.objects.get(id=group_id)
                except Group.DoesNotExist, Group.MultipleObjectsReturned:
                    raise JSONException(u"Interaction Handler: Error getting group!")
                
                # do create action for specific type
                return self.create(request, data, user, page, group)

            # do delete action - same for all interactions
            if action == 'delete':
                interaction_id = data['int_id']
                try:
                    interaction = Interaction.objects.get(id=interaction_id)
                except Interaction.DoesNotExist:
                    raise JSONException(u"Interaction did not exist!")

                return deleteInteraction(interaction, user)
                
class VoteHandler(InteractionHandler):
    def create(self, request, data, user, page, group):
        pass

class CommentHandler(InteractionHandler):
    def create(self, request, data, user, page, group):
        comment = data['comment']

        # Optional interaction id
        interaction_id = data.get('int_id', None)

        # Get or create parent interaction
        if interaction_id:        
            try:
                parent = Interaction.objects.get(id=interaction_id)
            except Interaction.DoesNotExist, Interaction.MultipleObjectsReturned:
                raise JSONException(u'Could not find parent interaction specified')
        else:
            parent = TagHandler().create(request, data, user, page, group)['interaction']
        
        # Create the comment interaction node
        try:
            comment = createInteractionNode(body=comment, group=group)
        except:
            raise JSONException(u'Error creating comment interaction node')
        
        # Create the interaction
        interaction = createInteraction(parent.page, parent.container, parent.content, user, 'com', comment, group, parent)
        
        return interaction

class TagHandler(InteractionHandler):
    def create(self, request, data, user, page, group, kind='tag'):
        tag_body = data['tag']['body']
        container_hash = data['hash']
        content_node_data = data['content_node_data']
        content_type = dict(((v,k) for k,v in Content.CONTENT_TYPES))[ content_node_data['kind'] ]
        
        #optional
        tag_id = data['tag'].get('id', None)
        location = content_node_data.get('location', None)

        content = Content.objects.get_or_create(kind=content_type, body=content_node_data['body'], location=location)[0]

        inode = createInteractionNode(tag_id, tag_body, group)

        # Get the container
        try:
            container = Container.objects.get(hash=container_hash)
        except Container.DoesNotExist:
            raise JSONException("Container specified does not exist")
        
        # Create an interaction
        interaction = createInteraction(page, container, content, user, kind, inode, group)

        return interaction

class BookmarkHandler(InteractionHandler):
    def create(self, request, data, user, page, group):
        # Same as a tag but with bookmark kind -- makes private to user
        return dict(interaction=TagHandler().create(request, data, user, page, group, 'bkm')['interaction'])

class ShareHandler(InteractionHandler):
    def create(self, request, data, user, page, group):
        tag_body = data['tag']['body']
        container_hash = data['hash']
        content_node_data = data['content_node_data']
        content_type = dict(((v,k) for k,v in Content.CONTENT_TYPES))[ content_node_data['kind'] ]

        # optional
        tag_id = data['tag'].get('id', None)
        location = content_node_data.get('location', None)
        referring_int_id = data.get('referring_int_id', None)

        parent = None

        # Get or create content
        content = Content.objects.get_or_create(kind=content_type, body=content_node_data['body'], location=location)[0]
        
        inode = createInteractionNode(tag_id, tag_body, group)

        # Get the container
        try:
            container = Container.objects.get(hash=container_hash)
        except Container.DoesNotExist:
            return JSONException("Container specified does not exist")

        # Create appropriate parent
        if referring_int_id:
            print "received referring id"
            try:
                parent = Interaction.objects.get(id=referring_int_id)
            except Interaction.DoesNotExist:
                parent = None
        
        # Create an interaction
        interaction = createInteraction(page, container, content, user, 'shr', inode, group, parent)['interaction']

        # Create a Link
        try:
            link = Link.objects.get_or_create(interaction=interaction)[0]
        except:
            raise JSONException(u"Error creating link")
        
        short_url = BASE_URL + "/s/" + link.to_base62()
        
        return dict(short_url=short_url)

class CreateContainerHandler(AnonymousBaseHandler):
    @status_response
    def read(self, request):
        result = {}
        containers = json.loads(request.GET['json'])
        
        for container in containers:
            try:
                result[container] = Container.objects.get_or_create(
                    hash=container,
                    body=containers[container]['body'],
                    kind=containers[container]['kind']
                )[0].id
            except KeyError:
                raise JSONException(u"Bad key for container")

        return result

class ContainerSummaryHandler(AnonymousBaseHandler):
    @json_data
    @status_response
    def read(self, request, data):
        known = {}
        hashes = data['hashes']
        page = data['pageID']

        # Force evaluation by making lists
        containers = list(Container.objects.filter(hash__in=hashes).values_list('id','hash','kind'))
        ids = [container[0] for container in containers]
        interactions = list(Interaction.objects.filter(
            container__in=ids,
            page=page,
            approved=True
        ).select_related('interaction_node','content','user',('social_user')))

        known = getContainerSummaries(interactions, containers)
        unknown = list(set(hashes) - set(known.keys()))

        return dict(known=known, unknown=unknown)

class ContentSummaryHandler(AnonymousBaseHandler):
    @json_data
    @status_response
    def read(self, request, data):
        known = {}

        container_id = data['container_id']
        page_id = data['page_id']
        tag_ids = data['top_tags']

        # Force queryset evaluation by making lists - reduces interaction queries to 1
        interactions = list(Interaction.objects.filter(
            container=container_id,
            page=page_id,
            approved=True
        ))
        content_ids = (interaction.content_id for interaction in interactions)
        content = list(Content.objects.filter(id__in=content_ids).values_list('id','body','kind','location'))

        content_summaries = getContentSummaries(interactions, content)

        return content_summaries

class PageDataHandler(AnonymousBaseHandler):
    @status_response
    def read(self, request, pageid=None):
        page = getPage(request, pageid)
        
        # Find all the interactions on page
        iop = Interaction.objects.filter(page=page)
        iop = iop.exclude(content__kind='page')
        
        # ---Get page interaction counts, grouped by kind---
        # Focus on values for 'kind'
        values = iop.order_by('kind').values('kind')
        # Annotate values with count of interactions
        summary = values.annotate(count=Count('id'))
        
        # ---Find top 10 tags on a given page---
        tags = InteractionNode.objects.filter(interaction__kind='tag', interaction__page=page)
        ordered_tags = tags.order_by('body')
        tagcounts = ordered_tags.annotate(tag_count=Count('interaction'))
        toptags = tagcounts.order_by('-tag_count')[:10].values('tag_count','body')
          
        # ---Find top 10 shares on a give page---
        content = Content.objects.filter(interaction__page=page.id)
        shares = content.filter(interaction__kind='shr')
        sharecounts = shares.annotate(Count("id"))
        topshares = sharecounts.values("body").order_by()[:10]

        # ---Find top 10 non-temp users on a given page---
        socialusers = SocialUser.objects.filter(user__interaction__page=page.id)

        userinteract = socialusers.annotate(interactions=Count('user__interaction')).select_related('user')
        topusers = userinteract.order_by('-interactions').values('user','full_name','img_url','interactions')[:10]
        
        return dict(
            id=page.id,
            summary=summary,
            toptags=toptags,
            topusers=topusers,
            topshares=topshares,
        )

class SettingsHandler(AnonymousBaseHandler):
    model = Group
    fields = (
        'id',
        'name',
        'short_name',
        'language',
        'blessed_tags',
        'anno_whitelist',
        'img_whitelist',
        'img_blacklist',
        'no_readr',
        ('share', ('images', 'text', 'flash')),
        ('rate', ('images', 'text', 'flash')),
        ('comment', ('images', 'text', 'flash')),
        ('bookmark', ('images', 'text', 'flash')),
        ('search', ('images', 'text', 'flash')),
        'logo_url_sm',
        'logo_url_med',
        'logo_url_lg',
        'css_url',
        'temp_interact',
        'twitter',
        'post_selector',
        'post_href_selector',
        'summary_widget_selector'
    )
             
    """
    Returns the settings for a group
    """
    @status_response
    def read(self, request, group=None):
        # Get hostname, stripping www if present
        host = getHost(request)
        
        # If no group has been provided, set to default
        group_id = int(group) if group else 1
        
        # Get the group object out of the database
        try:
            group_object = Group.objects.get(id=group_id)
        except Group.DoesNotExist:
            return HttpResponse("RB Group does not exist!")
        
        # Get the domains for that particular group from site objects  
        sites = Site.objects.filter(group=group_object)
        domains = sites.values_list('domain', flat=True)
        
        # If site is known, return group settings
        # If not known create site for default group and return settings
        # If site is not registered for group settings request, raise error
        if host in domains:
            return group_object
        elif group_id == 1:
            Site.objects.get_or_create(name=host,domain=host,group_id=1)
            return group_object
        else:
            raise JSONException(
                "Group (" + str(group) + ") settings request invalid for this domain (" + host + ")" + str(domains)
            )
