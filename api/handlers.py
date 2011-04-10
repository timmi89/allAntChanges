from piston.handler import BaseHandler, AnonymousBaseHandler
from django.http import HttpResponse, HttpResponseBadRequest
from settings import FACEBOOK_APP_SECRET
from django.db import transaction
from django.db.models import Count
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User
from extras.facebook import GraphAPI, GraphAPIError
from decorators import status_response, json_data
from exceptions import JSONException
from utils import *
from userutils import *
from token import *

"""
Readrboard Widget API
"""

class TempUserHandler(BaseHandler):

    @status_response
    def read(self, request):
        data = json.loads(request.GET['json'])
        group_id = data['group_id']
        user = User.objects.create_user(
            username=generateUsername(), 
            email='tempuser@readrboard.com'
        )
        readr_token = createToken(user.id, 'R3dRB0aRdR0X', group_id)
        return dict(
            user_id=user.id,
            readr_token=readr_token
        )

class InteractionNodeHandler(BaseHandler):
    model = InteractionNode
    fields = ('id', 'body', 'kind')

class InteractionsHandler(BaseHandler):

    @status_response
    def read(self, request, **kwargs):
        nodes = InteractionNode.objects.all()
        if 'kind' in kwargs:
            nodes = nodes.filter(kind=kwargs['kind'])
        elif 'page_id' in kwargs:
            nodes = nodes.filter(interaction__page=kwargs['page_id'])
        elif 'interaction_id' in kwargs:
            nodes = nodes.filter(interaction__id=kwargs['interaction_id'])
        elif 'hash' in kwargs:
            containers = Container.objects.filter(hash=kwargs['hash'].lower())
            nodes = nodes.filter(interaction__content__container=containers)
        return nodes

class Deauthorize(BaseHandler):

    def read(self, request):
        data = json.loads(request.GET['json'])
        if not checkToken(data): raise JSONException(u"Token was invalid")
        SocialAuth.objects.filter(
            user__id=data['user_id']
        ).delete()

class FBHandler(BaseHandler):

    @status_response
    def read(self, request):
        data = json.loads(request.GET['json'])
        fb_session = data['fb']
        group_id = data['group_id']
        access_token = fb_session.get('access_token', None)
        user_id = data.get('user_id', None)

        if(access_token):
            graph = GraphAPI(access_token)
        else:
            raise JSONException(u"No access token")

        # Get user profile from facebook graph
        profile = graph.get_object("me")

        django_user = createDjangoUser(profile);
        social_user = createSocialUser(django_user, profile)
        social_auth = createSocialAuth(
            social_user,
            django_user,
            group_id,
            fb_session
        )

        if user_id and len(SocialUser.objects.filter(user__id=user_id)) == 0:
            convertUser(user_id, django_user)

        readr_token = createToken(django_user.id, social_auth.auth_token, group_id)

        return dict(
            user_id=django_user.id,
            first_name=django_user.first_name,
            full_name=social_user.full_name,
            img_url=social_user.img_url,
            readr_token=readr_token
        )

class InteractionHandler(BaseHandler):
    
    def read(self, request, id):
        interaction = Interaction.objects.get(id=id)
        tree = Interaction.get_tree(interaction)
        return tree

class CreateCommentHandler(BaseHandler):
    
    @status_response
    def read(self, request):
        data = json.loads(request.GET['json'])
        comment = data['comment']
        interaction_id = data['interaction_id']
        user = data['user_id']
        
        if not checkToken(data): raise JSONException(u"Token was invalid")

        try:
            parent = Interaction.objects.get(id=interaction_id)
        except Interaction.DoesNotExist, Interaction.MultipleObjectsReturned:
            raise JSONException(u'Could not find parent interaction specified')

        comment = createInteractionNode(kind='com', body=comment)
        interaction = createInteraction(parent.page, parent.content, user, comment)

class TagHandler(BaseHandler):
    """ Create action ='delete'"""
    @status_response
    def read(self, request, **kwargs):
        action = kwargs['action']
        if action == 'create':
            data = json.loads(request.GET['json'])
            tag = data['tag']['content']
            hash = data['hash']
            content_data = data['content']
            content_type = data['content_type']
            page_id = data['page_id']
            group_id = data['group_id']
            
            try:
                user = User.objects.get(id=data['user_id'])
            except User.DoesNotExist, User.MultipleObjectsReturned:
                raise JSONException(u"Error getting user!")
            try:
                page = Page.objects.get(id=page_id)
            except Page.DoesNotExist, Page.MultipleObjectsReturned:
                raise JSONException(u"Error getting page!")
            try:
                group = Group.objects.get(id=group_id)
            except Group.DoesNotExist, Group.MultipleObjectsReturned:
                raise JSONException(u"Error getting group!")

            if not checkToken(data): raise JSONException(u"Token was invalid")
            content = Content.objects.get_or_create(kind=content_type, body=content_data)[0]
            
            if hash:
                try:
                    container = Container.objects.get(hash=hash)
                except Container.DoesNotExist, Container.MultipleObjectsReturned:
                    raise JSONException(u'Hash was sent but there was an error retreiving container')
                try:
                    container.content.add(content)
                except:
                    raise JSONException(u'Error adding content to container')

            new = None
            if tag:
                if isinstance(tag, unicode):
                    node = createInteractionNode(kind='tag', body=tag)
                    new = createInteraction(page, content, user, node, group)
                elif isinstance(tag, int):
                    node = InteractionNode.objects.get(id=tag)
                    new = createInteraction(
                        page=page,
                        content=content,
                        user=user,
                        interaction_node=node,
                        group=group
                    )
                return new
            else:
                return JSONException(u"No tag provided to tag handler")

class CreateContainerHandler(BaseHandler):
    
    @status_response
    def read(self, request):
        result = {}
        data = json.loads(request.GET['json'])
        hashes = data['hashes']
        for hash in hashes:
            result[hash] = Container.objects.get_or_create(hash=hash, body=hashes[hash])[1]
        return result

class ContainerHandler(BaseHandler):
    
    @status_response
    def read(self, request, container=None):
        data = json.loads(request.GET['json'])
        known = {}
        unknown = []
        if container: hashes = [container]
        else: hashes = data['hashes']
        for hash in hashes:
            try:
                known[hash] = Container.objects.get(hash=hash)
            except Container.DoesNotExist:
                unknown.append(hash)

        for hash in known.keys():
            info = {}
            nodes = InteractionNode.objects.filter(interaction__content__container__hash=hash)
            info['knowntags'] = nodes.filter(kind='tag').values('body')
            info['comments'] = nodes.filter(kind='com').values('body')
            info['bookmarks'] = nodes.filter(kind='bkm').values('body')
            known[hash] = info
            
        return dict(known=known, unknown=unknown)

class PageDataHandler(BaseHandler):

    @status_response
    def read(self, request, pageid=None):
        page = getPage(request, pageid)
        
        # Find all the interaction nodes on page
        #su = User.objects.filter(social_user__isnull=False)
        nop = InteractionNode.objects.filter(
            interaction__page=page.id,
            #interaction__user__in=su
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
        content = Content.objects.filter(
            interaction__page=page.id,
            interaction__interaction_node__kind='shr',
        )
        sharecounts = content.annotate(Count("id"))
        topshares = sharecounts.values("body").order_by()[:10]  
        
        # ---Find top 10 non-temp users on a given page---
        users = User.objects.filter(
            interaction__page=page.id,
            social_user__isnull=False
        )
        usernames = users.values('first_name', 'last_name')
        userinteract = usernames.annotate(interactions=Count('interaction'))
        topusers = userinteract.order_by('-interactions')[:10]
        
        return dict(
            id=page.id,
            summary=summary,
            toptags=toptags,
            topusers=topusers,
            topshares=topshares
        )

class SettingsHandler(BaseHandler):
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
            if host in g.valid_domains:
                print "host %s is valid for group %d" % (host,group)
            else:
                print "host %s is not valid for group %d" % (host,group)
            return g
        else:
            return ("Group not specified")
