from piston.handler import BaseHandler
from django.http import HttpResponse, HttpResponseBadRequest
from django.db.models import Count
from django.shortcuts import get_object_or_404
from decorators import status_response, json_data
from exceptions import JSONException
from utils import *
from userutils import *
from token import *


class InteractionNodeHandler(BaseHandler):
    model = User
    fields = ('id', 'first_name', 'last_name')

class InteractionNodeHandler(BaseHandler):
    model = InteractionNode
    fields = ('id', 'body', 'kind')

class ContentHandler(BaseHandler):
    model = Content
    fields = ('id', 'body', 'kind')

class ContentHandler(BaseHandler):
    model = Interaction
    fields = ('id', 'content', 'user')

"""
class InteractionHandler(BaseHandler):
    @status_response
    def read(self, request, **kwargs):
        # load the json data
        data = json.loads(request.GET['json'])

        # check to see if user token is valid
        if not checkToken(data): raise JSONException(u"Token was invalid")

        # get necessary variables from data
        user = data.get('user_id')
        group_id = data.get('group_id')
        page_id = data.get('page_id')

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

        action = kwargs['action']

        if action == 'create':
            self.createInteraction(self, request, user, group_id, page_id, **data)

        if action == 'delete':
            self.deleteInteraction(self, request, **data)

class CommentHandler(InteractionHandler):
    def createInteraction(self, requst, **data):

"""
class CommentHandler(BaseHandler):
    
    @status_response
    def read(self, request, **kwargs):
        data = json.loads(request.GET['json'])
        if not checkToken(data): raise JSONException(u"Token was invalid")
        print "Token looks good, going ahead with comment handler actions..."
        action = kwargs['action']
        if action == 'create':
            comment = data['comment']
            interaction_id = data['int_id']
            user = data['user_id']
            group_id = data['group_id']
            page_id = data['page_id']

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

            try:
                parent = Interaction.objects.get(id=interaction_id)
            except Interaction.DoesNotExist, Interaction.MultipleObjectsReturned:
                raise JSONException(u'Could not find parent interaction specified')

            try:
                comment = createInteractionNode(kind='com', body=comment)
            except:
                raise JSONException(u'Error creating comment interaction node')
            #try:
            interaction = createInteraction(parent.page, parent.container, parent.content, user, comment, group, parent)
            #except:
            #    raise JSONException(u'Error creating comment interaction')
            return interaction

        if action == 'delete':
            interaction_id = data['int_id']['id']
            try:
                interaction = Interaction.objects.get(id=interaction_id)
            except Interaction.DoesNotExist:
                raise JSONException("Interaction did not exist!")
            user_id = data['user_id']
            try:
                user = User.objects.get(id=user_id)
            except Interaction.DoesNotExist:
                raise JSONException("User did not exist!")

            return deleteInteraction(interaction, user)

class TagHandler(BaseHandler):
    """ Create action ='delete'"""
    @status_response
    def read(self, request, **kwargs):
        data = json.loads(request.GET['json'])
        if not checkToken(data): raise JSONException(u"Token was invalid")
        print "Token looks good, going ahead with tag handler actions..."
        action = kwargs['action']
        if action == 'create':
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
                    new = createInteraction(
                        page=page,
                        container=container,
                        content=content,
                        user=user,
                        interaction_node=node,
                        group=group
                    )
                return new
            else:
                return JSONException(u"No tag provided to tag handler")
                
        if action == 'delete':
            interaction_id = data['int_id']['id']
            try:
                interaction = Interaction.objects.get(id=interaction_id)
            except Interaction.DoesNotExist:
                raise JSONException("Interaction did not exist!")
            user_id = data['user_id']
            try:
                user = User.objects.get(id=user_id)
            except Interaction.DoesNotExist:
                raise JSONException("User did not exist!")

            return deleteInteraction(interaction, user)

class CreateContainerHandler(BaseHandler):
    
    @status_response
    def read(self, request):
        result = {}
        data = json.loads(request.GET['json'])
        print data
        hashes = data['hashes']
        for hash in hashes:
            result[hash] = Container.objects.get_or_create(
                hash=hash,
                body=hashes[hash]['content']
            )[1]
        return result

class ContainerHandler(BaseHandler):
    
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
            info = {}
            # Get everything we know about this hash
            interactions = Interaction.objects.filter(container__hash=hash)

            # Filter tag and comment interactions
            tags = interactions.filter(interaction_node__kind='tag')
            comments = interactions.filter(interaction_node__kind='com')

            # Get counts of tags and comments -- container level
            info['tag_count'] = tags.count()
            info['comment_count'] = comments.count()
            
            # Content level data begins here
            content = []

            # Make list of unique content and retrieve their Content objects
            content_unique = interactions.order_by('content').distinct().values('content')#.values_list('content_id', flat=True)
            content_objs = Content.objects.filter(id__in=content_unique)

            for content_item in content_objs:
                data = {}
                data['body'] = content_item.body
                
                # Filter interactions for this piece of content and get count data
                content_interactions = interactions.filter(content=content_item).select_related('interaction_node')
                content_tags = content_interactions.filter(interaction_node__kind='tag')
                content_coms = content_interactions.filter(interaction_node__kind='com')
                data['tag_count'] = content_tags.count()
                data['comment_count'] = content_coms.count()
                
                # Get information about the tags
                tags_data = []

                # Make list of unique content and grab the InteractionNode objects
                tag_unique = content_tags.order_by('interaction_node').distinct().values('interaction_node')#values_list('interaction_node__id', flat=True)
                tag_objs = InteractionNode.objects.filter(id__in=tag_unique)
                
                for tag_item in tag_objs:
                    tag_data = {}
                    tag_data['tag'] = tag_item.body
                    tag_data['id'] = tag_item.id
                    tag_data['count'] = content_interactions.filter(interaction_node=tag_item).count()
                    comments = []
                
                    for comment in content_coms.filter(parent=content_tags.filter(interaction_node=tag_item)):
                        comment_data = {}
                        comment_data['comment'] = comment.interaction_node.body
                        comment_data['user'] = comment.user
                        comments.append(comment_data)

                    tag_data['comments'] = comments
                    tags_data.append(tag_data);
                data['tags'] = tags_data
                
                content.append(data)

            info['content'] = content
            
            known[hash] = info
            
        return dict(known=known, unknown=unknown)

class PageDataHandler(BaseHandler):

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
