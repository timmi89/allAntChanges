from piston.handler import BaseHandler, AnonymousBaseHandler
from django.http import HttpResponse, HttpResponseBadRequest
from settings import FACEBOOK_APP_SECRET
from django.db import transaction
from django.db.models import Count
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from utils import *
from extras.facebook import GraphAPI, GraphAPIError
from django.contrib.auth import login
from django.contrib.auth import authenticate
from datetime import datetime, timedelta

"""
Readrboard Widget API - Uses Piston
Note: By default, AnonymousBaseHandler has 'allow_methods' only set to 'GET'.
"""

class InteractionsHandler(AnonymousBaseHandler):
    allowed_methods = ('GET',)
    
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
        
class TokenCheckHandler:
    pass

class FBHandler(AnonymousBaseHandler):
    allowed_methods = ('GET',)

    def read(self, request):
        args = []
        kwargs = {}
        base = 'http://graph.facebook.com'
        data = json.loads(request.GET['json'])
        access_token = data['fb']['session']['access_token']
        if(access_token):
            graph = GraphAPI(access_token)
        else:
            return HttpResponse("No access token")

        # Get user profile from facebook graph
        profile = graph.get_object("me")

        # Create new Django user if one doesn't exist
        user = User.objects.get_or_create(
            username=profile['email'],
            defaults = {
                "email": profile['email'],
                "first_name": profile['first_name'].capitalize(),
                "last_name": profile['last_name'].capitalize(),
            },
        )

        # Print out the result
        djangouser = user[0]
        result = "Created new" if user[1] else "Retreived existing"
        print result, "django user %s %s (%s)" % (
            djangouser.first_name, 
            djangouser.last_name, 
            djangouser.email
        )

        if 'gender' in profile.keys():
            profile ['gender'] = profile['gender'].capitalize()[:1]

        # Create social user object for user
        social = SocialUser.objects.get_or_create(
            user = djangouser,
            provider = 'Facebook',
            uid = profile['id'],
            defaults = {
                "full_name": profile['name'],
                "username": profile.get('username', None),
                "gender": profile.get('gender', None),
                "hometown": profile['hometown']['name'] if (profile.get('hometown', None)) else None,
                "bio": profile.get('bio', None)
            }
        )

        # Print out the result
        social_user = social[0]
        result = ("Created new" if social[1] else "Retreived existing")
        print result, "social user %s (%s: %s)" % (
            social_user.full_name,
            social_user.provider, 
            social_user.uid
        )
        
        dt = datetime.fromtimestamp(data['fb']['session']['expires'])

        group_secret = Group.objects.get(data['group_id']).secret
        readr_token = utils.createToken(social_user.id, auth_token, group_secret)

        social_auth = SocialAuth.objects.get_or_create(
            social_user = social_user,
            auth_token = access_token,
            expires = dt,
            readr_token = hash
        )

        # Remove stale tokens (if they exist)
        SocialAuth.objects.all().filter(social_user=social_user).exclude(readr_token=readr_token).delete()

        img_url = '%s/%s/picture' % (base, social_user.uid)
        
        return dict(django_user_id=djangouser.id,
                    first_name=djangouser.first_name,
                    full_name=social_user.full_name,
                    image_url=img_url,
                    readr_token=social_auth[0].readr_token,
               )

class InteractionHandler(AnonymousBaseHandler):
    allowed_methods = ('GET',)
    
    def read(self, request, id):
        interaction = Interaction.objects.get(id=id)
        tree = Interaction.get_tree(interaction)
        return tree

class CreateCommentHandler(AnonymousBaseHandler):
    allowed_methods = ('GET',)
    
    def read(self, request):
        data = json.loads(request.GET['json'])
        comment = data['comment']
        interaction_id = data['interaction_id']
        
        user = request.user
        parent = Interaction.objects.get(id=interaction_id)
        
        comment = createInteractionNode(kind='com', body=comment)
        interaction = createInteraction(parent.page, parent.content, user, comment)

class CreateTagHandler(AnonymousBaseHandler):
    allowed_methods = ('GET',)

    def read(self, request):
        data = json.loads(request.GET['json'])
        tag = data['tag']
        hash = data['hash']
        content_data = data['content']
        content_type = data['content_type']
        page_id = data['page_id']
        
        user = User.objects.get(id=data['user_id'])
        page = Page.objects.get(id=page_id)
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
                print "about to create interaction"
                new = createInteraction(page=page, content=content, user=user, interaction_node=node)
                print "created interaction"
                return new.id
        else:
            return HttpResponse("No tag provided to tag handler")

class CreateTagsHandler(AnonymousBaseHandler):
    allowed_methods = ('GET',)

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
        content = Content.objects.get_or_create(kind=content_type, body=content_data)[0]
        
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
            new = createInteraction(page=page, content=content, user=user, interaction_node=tag)
            interactions.append(new)

        return Interactions

class CreateContainerHandler(AnonymousBaseHandler):
    
    def read(self, request):
        result = {}
        data = json.loads(request.GET['json'])
        hashes = data['hashes']
        for hash in hashes:
            result[hash] = Container.objects.get_or_create(hash=hash, body=hashes[hash])[1]
        return result

class ContainerHandler(AnonymousBaseHandler):
    
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

class PageDataHandler(AnonymousBaseHandler):

    def read(self, request, pageid=None):
        page = getPage(request, pageid)
        
        # Find all the interaction nodes on page
        nop = InteractionNode.objects.filter(interaction__page=page.id)
        
        # ---Get page interaction counts, grouped by kind---
        # Filter values for 'kind'
        values = nop.values('kind')
        # Annotate values with count of interactions
        summary = values.annotate(Count('interaction'))
        
        # ---Find top 10 tags on a given page---
        tags = nop.filter(kind='tag')
        tagcounts = tags.annotate(Count("id"))
        toptags = tagcounts.values("body").order_by()[:10]
            
        # ---Find top 10 shares on a give page---
        content = Content.objects.filter(interaction__page=page.id,interaction__interaction_node__kind='shr')
        sharecounts = content.annotate(Count("id"))
        topshares = sharecounts.values("body").order_by()[:10]  
        
        # ---Find top 10 users on a given page---
        users = User.objects.filter(interaction__page=page.id)
        usernames = users.values('first_name', 'last_name')
        userinteract = usernames.annotate(interactions=Count('interaction'))[:10]
        
        return dict(id=page.id, summary=summary, toptags=toptags, topusers=userinteract, topshares=topshares)

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
             )
             
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
