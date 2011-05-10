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
    fields = ('id', 'first_name', 'last_name')

class InteractionNodeHandler(AnonymousBaseHandler):
    model = InteractionNode
    fields = ('id', 'body', 'kind')

class ContentHandler(AnonymousBaseHandler):
    model = Content
    fields = ('id', 'body', 'kind')

"""
class InteractionHandler(AnonymousBaseHandler):
    model = Interaction
    fields = ('id', 'content', 'user')

"""

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
                raise JSONException("Interaction did not exist!")

            return deleteInteraction(interaction, user)

class CommentHandler(InteractionHandler):

    def create(self, data, user, page, group):
        comment = data['comment']
        interaction_id = data['int_id']
        try:
            parent = Interaction.objects.get(id=interaction_id)
        except Interaction.DoesNotExist, Interaction.MultipleObjectsReturned:
            raise JSONException(u'Could not find parent interaction specified')

        try:
            comment = createInteractionNode(kind='com', body=comment)
        except:
            raise JSONException(u'Error creating comment interaction node')
        
        try:
            interaction = createInteraction(parent.page, parent.container, parent.content, user, comment, group, parent)
        except:
            raise JSONException(u'Error creating comment interaction')
        return interaction

class TagHandler(InteractionHandler):
    
    def create(self, data, user, page, group):
        tag = data['tag']['content']
        hash = data['hash']
        content_data = data['content']
        content_type = data['content_type']
        
        content = Content.objects.get_or_create(kind=content_type, body=content_data)[0]
        
        container = None
        if hash:
            container = Container.objects.get(hash=hash)

        new = None
        if tag:
            if isinstance(tag, unicode):
                node = createInteractionNode(kind='tag', body=tag)
                new = createInteraction(page, container, content, user, node, group)
            elif isinstance(tag, int):
                node = InteractionNode.objects.get(id=tag)
                new = createInteraction(page, container, content, user, node, group)
            return new
        else:
            raise JSONException(u"No tag provided to tag handler")

class CreateContainerHandler(AnonymousBaseHandler):
    
    @status_response
    def read(self, request):
        result = {}
        data = json.loads(request.GET['json'])
        hashes = data['hashes']
        for hash in hashes:
            result[hash] = Container.objects.get_or_create(
                hash=hash,
                body=hashes[hash]['content']
            )[1]
        return result

class ContainerHandler(AnonymousBaseHandler):
    
    @status_response
    def read(self, request, container=None):
        known = {}
        unknown = []
        if container: hashes = [container]
        else:
            data = json.loads(request.GET['json'])
            hashes = data['hashes']
        for hash in hashes:
            try:
                known[hash] = Container.objects.get(hash=hash)
            except Container.DoesNotExist:
                unknown.append(hash)

        for hash in known.keys():
            known[hash] = getContainerData(hash)
            
        return dict(known=known, unknown=unknown)

class PageDataHandler(AnonymousBaseHandler):

    @status_response
    def read(self, request, pageid=None):
        page = getPage(request, pageid)
        
        # Find all the interaction nodes on page
        nop = InteractionNode.objects.filter(
            interaction__page=page.id,
        )
        
        # ---Get page interaction counts, grouped by kind---
        # Focus on values for 'kind'
        values = nop.values('kind')
        # Annotate values with count of interactions
        summary = values.annotate(count=Count('interaction'))
        
        # ---Find top 10 tags on a given page---
        tags = nop.filter(kind='tag')
        # Annotate tags on page with count of interactions
        tagcounts = tags.annotate(tag_count=Count('interaction'))
        # Get tag_count and tag body ordered by tag count
        toptags = tagcounts.values("tag_count","body").order_by('-tag_count')[:10]
            
        # ---Find top 10 shares on a give page---
        content = Content.objects.filter(interaction__page=page.id)
        shares = content.filter(interaction__interaction_node__kind='shr')
        sharecounts = shares.annotate(Count("id"))
        topshares = sharecounts.values("body").order_by()[:10]
        
        # ---Find top 10 non-temp users on a given page---
        socialusers = SocialUser.objects.filter(user__interaction__page=page.id)

        userinteract = socialusers.annotate(interactions=Count('user__interaction'))
        topusers = userinteract.order_by('-interactions').values('full_name','img_url','interactions')[:10]

        imagedata = getContentData(content.filter(kind='image').order_by('id').distinct())
        videodata = getContentData(content.filter(kind='video').order_by('id').distinct())
        flashdata = getContentData(content.filter(kind='flash').order_by('id').distinct())
        
        return dict(
            id=page.id,
            summary=summary,
            toptags=toptags,
            topusers=topusers,
            topshares=topshares,
            imagedata=imagedata,
            videodata=videodata,
            flashdata=flashdata
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
              'temp_interact'
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
            return g
        else:
            return ("Group not specified")
