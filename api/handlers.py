from piston.handler import BaseHandler, AnonymousBaseHandler
from django.http import HttpResponse, HttpResponseBadRequest
from settings import FACEBOOK_APP_SECRET
from django.db import transaction
from django.db.models import Count
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User
from extras.facebook import GraphAPI, GraphAPIError
from django.contrib.auth import login
from django.contrib.auth import authenticate
from datetime import datetime
from decorators import status_response, json_data
from exceptions import JSONException
from utils import *
import hashlib


"""
Readrboard Widget API - Uses Piston
Note: By default, AnonymousBaseHandler has 'allow_methods' only set to 'GET'.
"""

class CreateTempUser(BaseHandler):
    def read():
        user = User.objects.create_user(
            username=CreateUsername(), 
            email='tempuser@readrboard.com'
        )
        return user

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

class TokenKillHandler(BaseHandler):

    def read(self, request):
        data = json.loads(request.GET['json'])
        SocialAuth.objects.filter(
            socialuser__user=data['user_id']
        ).delete()

class FBHandler(BaseHandler):

    @status_response
    def read(self, request):
        data = json.loads(request.GET['json'])
        #temp_user = data.get('user_id')
        fb_session = data['fb']
        group_id = data['group_id']
        access_token = fb_session.get('access_token', None)

        if(access_token):
            graph = GraphAPI(access_token)
        else:
            raise JSONException("No access token")

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

        #if(temp_user): convertUser(temp_user, django_user)
        readr_token = createToken(django_user.id, social_auth.auth_token, group_id)

        return dict(user_id=django_user.id,
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
        
        user = request.user
        parent = Interaction.objects.get(id=interaction_id)
        
        if not checkToken(data): raise JSONException("Token was invalid")

        comment = createInteractionNode(kind='com', body=comment)
        interaction = createInteraction(parent.page, parent.content, user, comment)

class CreateTagHandler(BaseHandler):

    @status_response
    def read(self, request):
        data = json.loads(request.GET['json'])
        tag = data['tag']
        hash = data['hash']
        content_data = data['content']
        content_type = data['content_type']
        page_id = data['page_id']
        
        user = User.objects.get(id=data['user_id'])
        page = Page.objects.get(id=page_id)

        if not checkToken(data): raise JSONException("Token was invalid")
        content = Content.objects.get_or_create(kind=content_type, body=content_data)[0]
        
        if hash:    
            container = Container.objects.get(hash=hash)
            container.content.add(content)

        new = None

        if tag:
            if isinstance(tag, str):
                node = createInteractionNode(kind='tag', body=tag)
                new = createInteraction(page, content, user, node)
            elif isinstance(tag, int):
                node = InteractionNode.objects.get(id=tag)
                new = createInteraction(
                    page=page,
                    content=content,
                    user=user,
                    interaction_node=node
                )
                return new.id
        else:
            return HttpResponse("No tag provided to tag handler")

class CreateTagsHandler(BaseHandler):

    @status_response
    def read(self, request):
        data = json.loads(request.GET['json'])
        unknown_tags = data['unknown_tags'] 
        known_tags = data['known_tags']
        hash = data['hash']
        content_data = data['content']
        content_type = data['content_type']
        page_id = data['page_id']
        
        user = request.user
        page = Page.objects.get(id=page_id)
        if not checkToken(data): raise JSONException("Token was invalid")
        content = Content.objects.get_or_create(
            kind=content_type,
            body=content_data
        )[0]
        
        if hash:    
            container = Container.objects.get(hash=hash)
            container.content.add(content)

        interactions = []
        for utag in unknown_tags:
            if utag:
                tag = createInteractionNode(kind='tag', body=utag)
                new = createInteraction(page, content, user, tag)
                interactions.append(new)
        for ktag in known_tags:
            tag = InteractionNode.objects.get(id=ktag)
            new = createInteraction(
                page=page,
                content=content,
                user=user,
                interaction_node=tag
            )
            interactions.append(new)

        return Interactions

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
        nop = InteractionNode.objects.filter(interaction__page=page.id)
        
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
            interaction__interaction_node__kind='shr')
        sharecounts = content.annotate(Count("id"))
        topshares = sharecounts.values("body").order_by()[:10]  
        
        # ---Find top 10 users on a given page---
        users = User.objects.filter(interaction__page=page.id)
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
