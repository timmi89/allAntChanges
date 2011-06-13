from piston.handler import AnonymousBaseHandler
from django.http import HttpResponse, HttpResponseBadRequest
from django.db.models import Count
from django.shortcuts import get_object_or_404
from decorators import status_response, json_data
from exceptions import JSONException
from utils import *
from userutils import *
from token import *

class UserHandler(AnonymousBaseHandler):
    model = User
    fields = ('id', 'first_name', 'last_name', 'social_user')

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

class Awesome(AnonymousBaseHandler):
    model = Interaction
    fields = ('id')

class InteractionHandler(AnonymousBaseHandler):
    @status_response
    def read(self, request, **kwargs):
        # load the json data
        data = json.loads(request.GET['json'])

        # check to see if user's token is valid
        if not checkToken(data): raise JSONException(u"Token was invalid")

        # get user data
        user_id = data.get('user_id')
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist, User.MultipleObjectsReturned:
            raise JSONException(u"Interaction Handler: Error getting user!")

        # retrieve action flag
        action = kwargs.get('action')

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
            return self.create(data, user, page, group)

        # do delete action - same for all interactions
        if action == 'delete':
            interaction_id = data['int_id']['id']
            try:
                interaction = Interaction.objects.get(id=interaction_id)
            except Interaction.DoesNotExist:
                raise JSONException(u"Interaction did not exist!")

            return deleteInteraction(interaction, user)

class BookmarkHandler(InteractionHandler):
    def create(self, data, user, page, group):
        pass


class ShareHandler(InteractionHandler):
    def create(self, data, user, page, group):
        tag_id = data['tag']['content']
        hash = data['hash']
        content_data = data['content']['body']
        content_type = dict(((v,k) for k,v in Content.CONTENT_TYPES))[data['content_type']]

        # optional
        location = data['content'].get('location', None)
        interaction_id = data.get('int_id', None)

        parent = None

        # Get or create content
        content = Content.objects.get_or_create(kind=content_type, body=content_data, location=location)[0]
        
        # Get the interaction_node
        try:
            inode = InteractionNode.objects.get(id=tag_id)
        except InteractionNode.DoesNotExist:
            return JSONException("InteractionNode specified does not exist")

        # Get the container
        try:
            container = Container.objects.get(hash=hash)
        except Container.DoesNotExist:
            return JSONException("Container specified does not exist")

        # Create an interaction
        if interaction_id:
            print "here"
            try:
                parent = Interaction.objects.get(id=interaction_id)
            except Interaction.DoesNotExist:
                raise JSONException("Parent interaction did not exist!")

        try:
            interaction = createInteraction(page, container, content, user, 'shr', inode, group, parent)['interaction']
        except:
            raise JSONException(u"Error creating interaction")

        # Create a Link
        try:
            link = Link.objects.get_or_create(interaction=interaction)[0]
        except:
            raise JSONException(u"Error creating link")
        
        short_url = 'http://readr.local:8080/s/' + link.to_base62()
        
        return dict(short_url=short_url)


class CommentHandler(InteractionHandler):
    def create(self, data, user, page, group):
        comment = data['comment']
        interaction_id = data['int_id']
        try:
            parent = Interaction.objects.get(id=interaction_id)
        except Interaction.DoesNotExist, Interaction.MultipleObjectsReturned:
            raise JSONException(u'Could not find parent interaction specified')

        try:
            comment = createInteractionNode(body=comment)
        except:
            raise JSONException(u'Error creating comment interaction node')
        
        try:
            interaction = createInteraction(parent.page, parent.container, parent.content, user, 'com', comment, group, parent)
        except:
            raise JSONException(u'Error creating comment interaction')
        return interaction

class TagHandler(InteractionHandler):
    def create(self, data, user, page, group):
        tag = data['tag']['content']
        hash = data['hash']
        location = data['content'].get('location', None)
        content_data = data['content']['body']
        content_type = dict(((v,k) for k,v in Content.CONTENT_TYPES))[data['content_type']]
        
        content = Content.objects.get_or_create(kind=content_type, body=content_data, location=location)[0]

        try:
            container = Container.objects.get(hash=hash)
        except Container.DoesNotExist:
            raise JSONException("Container specified does not exist")

        new = None
        if tag:
            if isinstance(tag, unicode):
                print "making tag from reaction"
                node = createInteractionNode(body=tag)
                new = createInteraction(page, container, content, user, 'tag', node, group)
            elif isinstance(tag, int):
                print "making tag from existing interaction node id"
                node = InteractionNode.objects.get(id=tag)
                new = createInteraction(page, container, content, user, 'tag', node, group)
            return new
        else:
            raise JSONException(u"No tag provided to tag handler")

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
                )[1]
            except KeyError:
                raise JSONException(u"Bad key for container")

        return result

class ContainerSummaryHandler(AnonymousBaseHandler):
    @status_response
    def read(self, request):
        known = {}

        data = json.loads(request.GET['json'])
        hashes = data['hashes']
        page = data['pageID']

        # Force evaluation by making lists
        containers = list(Container.objects.filter(hash__in=hashes).values_list('id','hash','kind'))
        ids = [container[0] for container in containers]
        interactions = list(Interaction.objects.filter(container__in=ids, page=page).select_related('interaction_node','content'))

        known = getContainerSummaries(interactions, containers)
        unknown = list(set(hashes) - set(known.keys()))

        return dict(known=known, unknown=unknown)

class ContentSummaryHandler(AnonymousBaseHandler):
    @status_response
    def read(self, request):
        known = {}

        data = json.loads(request.GET['json'])
        container_id = data['container_id']
        page_id = data['page_id']
        tag_ids = data['top_tags']

        # Force evaluation by making lists
        interactions = list(Interaction.objects.filter(
            container=container_id,
            page=page_id,
        ))
        content_ids = (interaction.content_id for interaction in interactions)
        content = list(Content.objects.filter(id__in=content_ids).values_list('id','body','kind','location'))

        content_summaries = getContentSummaries(interactions, content)

        return content_summaries
"""
class ContainerSummaryHandler(AnonymousBaseHandler):
    @status_response
    def read(self, request):
        known = {}

        data = json.loads(request.GET['json'])
        hashes = data['hashes']
        page = data['pageID']

        containers = Container.objects.filter(hash__in=hashes)
        interactions = Interaction.objects.filter(container__in=containers)
        grouped_interactions = interactions.values('container','kind').order_by()
        interaction_counts = grouped_interactions.annotate(count=Count('kind'))

        tags = interactions.filter(kind='tag').values('container','interaction_node').order_by()
        tag_counts = tags.annotate(count=Count('interaction_node')).values('count','container','interaction_node')
        top_tags = tag_counts.order_by('-count')

        top_tag_ids = top_tags.values_list('interaction_node')
        interaction_nodes = InteractionNode.objects.filter(id__in=top_tag_ids)

        return dict(containers=containers, interaction_nodes=interaction_nodes, counts=interaction_counts, top_tags=top_tags)
"""
class PageDataHandler(AnonymousBaseHandler):
    @status_response
    def read(self, request, pageid=None):
        page = getPage(request, pageid)
        
        # Find all the interactions on page
        iop = Interaction.objects.filter(page=page)
        
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

        userinteract = socialusers.annotate(interactions=Count('user__interaction'))
        topusers = userinteract.order_by('-interactions').values('full_name','img_url','interactions')[:10]

        #imagedata = dict(((content.body, getData(iop, content=content)) for content in content.filter(kind='image').order_by('id').distinct()))
        #videodata = dict(((content.body, getData(iop, content=content)) for content in content.filter(kind='video').order_by('id').distinct()))
        #flashdata = dict(((content.body, getData(iop, content=content)) for content in content.filter(kind='flash').order_by('id').distinct()))
        
        return dict(
            id=page.id,
            summary=summary,
            toptags=toptags,
            topusers=topusers,
            topshares=topshares,
            #imagedata=imagedata,
            #videodata=videodata,
            #flashdata=flashdata
        )

class SettingsHandler(AnonymousBaseHandler):
    model = Group
    fields = ('id',
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
              'twitter'
             )
             
    @status_response
    def read(self, request, group=None):
        host = request.get_host()
        # Slice off port from hostname
        host = host[0:host.find(":")]
        path = request.path
        fp = request.get_full_path()
        if group:
            group = int(group)
            try:
                g = Group.objects.get(id=group)
            except Group.DoesNotExist:
                return HttpResponse("RB Group does not exist!")
            sites = Site.objects.filter(group=g)
            domains = sites.values_list('domain', flat=True)
            if host in domains:
                return g
            else:
                raise JSONException("Group (" + str(group) + ") settings request invalid for this domain (" + host + ")")
        else:
            return ("Group not specified")
