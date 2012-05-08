from piston.handler import AnonymousBaseHandler
from django.http import HttpResponse, HttpResponseBadRequest
from django.db.models import Count
from django.core.paginator import Paginator, InvalidPage, EmptyPage
from decorators import status_response, json_data, json_data_post
from exceptions import JSONException
from utils import *
from userutils import *
from authentication.token import *
from settings import BASE_URL, STATIC_URL
from django.forms.models import model_to_dict


import logging
logger = logging.getLogger('rb.standard')



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
    
class GroupBlessedTagHandlers(AnonymousBaseHandler):
    model = GroupBlessedTag
    fields = ('group','node','order')

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
    @status_response
    @json_data
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
    @status_response
    @json_data
    def read(self, request, data):
        #data['group_id'] = 1
        
        # Check if current user's token has permission
        user = checkToken(data)
        if not user: raise JSONException(u"Token was invalid")
        
        int_id = data.get('int_id')

        try:
            interaction = Interaction.objects.get(id=int_id)
        except Interaction.DoesNotExist, Interaction.MultipleObjectsReturned:
            raise JSONException(u"Interaction Handler: Error getting interaction!")

        group_ids = GroupAdmin.objects.filter(
            social_user=user.social_user,
            approved=True
        ).values_list('group_id', flat=True)
        
        if interaction.page.site.group.id in group_ids:
            interaction.approved = False
            interaction.save()
            #return HttpResponseRedirect(request.path)
        else:
            raise JSONException(u'Admin not approved for this group!')

class InteractionHandler(AnonymousBaseHandler):
    @status_response
    @json_data
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
        container_kind = data['container_kind']
        content_node_data = data['content_node_data']
        content_type = dict(((v,k) for k,v in Content.CONTENT_TYPES))[ content_node_data['kind'] ]

        #optional
        tag_id = data['tag'].get('id', None)
        location = content_node_data.get('location', None)

        content = Content.objects.get_or_create(kind=content_type, body=content_node_data['body'], location=location)[0]

        inode = createInteractionNode(tag_id, tag_body, group)

        # Get the container
        container = Container.objects.get_or_create(
            hash = container_hash,
            defaults = {'kind': container_kind,}
        )[0]

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
        container_kind = data['container_kind']
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
        container = Container.objects.get_or_create(
            hash = container_hash,
            defaults = {'kind': container_kind,}
        )[0]

        # Create appropriate parent
        if referring_int_id:
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
    @status_response
    @json_data
    def read(self, request, data):
        known = {}
        hashes = data.get('hashes', [])
        
        try:
            page = data['pageID']
        except KeyError:
            raise JSONException("Couldn't get pageID")
            
        # Guard against undefined page string being passed in
        if not isinstance(page, int): raise JSONException("Bad Page ID")

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
    @status_response
    @json_data
    def read(self, request, data):
        known = {}

        container_id = data['container_id']
        if not container_id: 
            container_id = data['hash']
            # Get the container.  HACK.  Porter.  Likeocracy.
            container = Container.objects.get_or_create(
                hash = data['hash'],
                defaults = {'kind': "text",}
            )[0]
            container_id = container.id
        page_id = data['page_id']
        # tag_ids = data['top_tags'] # [porter] removing this on 12/28/2011, don't see why it's needed here.

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
    @json_data
    def read(self, request, data, pageid=None):
        requested_pages = data['pages']
        host = getHost(request)
        
        pages = []
        for requested_page in requested_pages:
            pages.append(getPage(host, requested_page))
        
        pages_data = []
        
        # Explicitly call list to evaluate queryset here
        interactions = Interaction.objects.filter(page__in=pages)
        
        for current_page in pages:
            # Find all the interactions on page
            iop = interactions.filter(page=current_page)
        
            # Retrieve containers
            containers = Container.objects.filter(id__in=iop.values('container'))
        
            # Get page interaction counts, grouped by kind
            values = iop.order_by('kind').values('kind')
            # Annotate values with count of interactions
            summary = values.annotate(count=Count('id'))
        
            # ---Find top 10 tags on a given page---
            tags = InteractionNode.objects.filter(
                interaction__kind='tag',
                interaction__page=current_page,
                interaction__approved=True
            )
            ordered_tags = tags.order_by('body')
            tagcounts = ordered_tags.annotate(tag_count=Count('interaction'))
            toptags = tagcounts.order_by('-tag_count')[:10].values('id','tag_count','body')
          
            # ---Find top 10 shares on a give page---
            content = Content.objects.filter(interaction__page=current_page.id)
            shares = content.filter(interaction__kind='shr')
            sharecounts = shares.annotate(Count("id"))
            topshares = sharecounts.values("body").order_by()[:10]

            # ---Find top 10 non-temp users on a given page---
            socialusers = SocialUser.objects.filter(user__interaction__page=current_page.id)

            userinteract = socialusers.annotate(interactions=Count('user__interaction')).select_related('user')
            topusers = userinteract.order_by('-interactions').values('user','full_name','img_url','interactions')[:10]
        
            pages_data.append(
                dict(
                    id=current_page.id,
                    summary=summary,
                    toptags=toptags,
                    topusers=topusers,
                    topshares=topshares,
                    containers=containers
                )
            )
        
        return pages_data

class SettingsHandler(AnonymousBaseHandler):
    model = Group
    """
    Returns the settings for a group
    """
    @status_response
    def read(self, request, group_id=None):
        if not group_id:
            # Get hostname, stripping www if present
            host = getHost(request)
            
            # Get site object
            try:
                site = Site.objects.get(domain=host)
                # Get Group
                group = Group.objects.get(id=site.group.id)
            except Site.DoesNotExist:
                # create a group
                # group = MAKE A GROUP(host)
                # now use group obj to create a site for this host
                # settings:  temp_limit = 0.  blessed_tag_ids(1,2,3,4).  name=host.  short_name=host.  black_words_list: copy from group_id(readboard)
                # approved = true.  requires_approval = false.  share
                # sharing, rating, commenting, searching, bookmarking:  true, true, true
                # anno_whitelist = p
                group = Group.objects.create(
                    name=host,
                    short_name=host,
                    approved=True,
                    temp_interact=0,
                    requires_approval=False,
                    share = Feature.objects.get(id=1),
                    rate = Feature.objects.get(id=1),
                    comment = Feature.objects.get(id=1),
                    bookmark = Feature.objects.get(id=1),
                    search = Feature.objects.get(id=1),
                    
                )
                
                
                default_groups = Group.objects.filter(short_name='default')
                for dgroup in default_groups:
                    if dgroup.short_name == 'default':
                        default_group = dgroup
                
                group.word_blacklist = default_group.word_blacklist
                group.anno_whitelist = default_group.anno_whitelist
                group.save()
                
                blessed = GroupBlessedTag.objects.filter(group = default_group)
                for blessing in blessed:
                    GroupBlessedTag.objects.create(group=group, node=blessing.node, order=blessing.order )
                    
                    
                # site = MAKE A SITE(host, group)
                Site.objects.create(
                    name=host,
                    domain=host,
                    group=group
                    
                )
                
                # Add us to admins
                readr_admins = SocialUser.objects.filter(
                    user__email__in=(
                        'porterbayne@gmail.com',
                        'erchaves@gmail.com',
                        'michael@readrboard.com'
                    )
                )
        
                for admin in readr_admins:
                    GroupAdmin.objects.create(group=group,social_user=admin,approved=True)

                
        
        else:
            group = Group.objects.get(id=group_id)
            
        if group.approved == False:
            return HttpResponse("Group not approved")
        
        settings_dict = model_to_dict(
            group,
            exclude=[
                'admins',
                'word_blacklist',
                'approved',
                'requires_approval',
                'share',
                'rate',
                'comment',
                'bookmark',
                'search',
                'logo_url_sm',
                'logo_url_med',
                'logo_url_lg']
        )
        
        blessed_tags = InteractionNode.objects.filter(
            groupblessedtag__group=group.id
        ).order_by('groupblessedtag__order')
        
        settings_dict['blessed_tags'] = blessed_tags
        
        return settings_dict


class UnFollowHandler(InteractionHandler):
    allowed_methods = ('POST')

    @status_response
    @json_data_post
    def create(self, request, data):
        owner = checkCookieToken(request)
        if owner is None:
            return {'message':'not_logged_in'}
        type = data['type']
        follow_id = data['follow_id']
        Follow.objects.get(owner = owner, type = type, follow_id = follow_id).delete()
        return {}
    
class FollowHandler(InteractionHandler):
    allowed_methods = ('POST','GET')

    @status_response
    @json_data_post
    def create(self, request, data):
        owner = checkCookieToken(request)
        if owner is None:
            return {'message':'not_logged_in'}
        
        type = data['type']
        follow_id = data['follow_id']
        #check type against follow types
        #verify follow is valid (type and id object exists)
        follow = Follow.objects.create(owner = owner, type = type, follow_id = follow_id)
        #if type == 'usr'
            #send followed user notification
        if type == 'usr':
            follow.user = User.objects.get(id=follow_id)
        elif type == 'pag':
            follow.page = Page.objects.get(id=follow_id)
        elif type == 'grp':
            follow.group = Group.objects.get(id=follow_id)
        else:
            return {'message':'bad_type'}
        
        follow.save()
        
        follow_dict = model_to_dict(
            follow,
            exclude=[]
        )
        return follow_dict
    
    @status_response
    @json_data
    def read(self, request, data):
        cookie_user = checkCookieToken(request)
        if cookie_user is None:
            #Not logged in?
            pass
        
        user_id = data['user_id']
        owner = User.objects.get(id = user_id)
        page_num = data['page_num']
        requested_types = data['types']
        follows = {}
        #maybe just do this all in one query... may avoid problems with paginator and interpolation.
        #for type in requested_types:
        follows['paginated_follows'] = []
        follows['page_num'] = page_num
        follow_objects = Follow.objects.filter(owner = owner, type__in  = requested_types) 
            
        follows_paginator = Paginator(follow_objects, 20)

        try: page_number = int(page_num)
        except ValueError: page_number = 1

        try: current_page = follows_paginator.page(page_number)
        except (EmptyPage, InvalidPage): current_page = follows_paginator.page(paginator.num_pages)
        
        follows['follows_count'] = follows_paginator.count
        for follow in current_page.object_list:
            compound_dict = model_to_dict(follow)
            if follow.type == 'usr':
                compound_dict['usr'] = model_to_dict(follow.user, exclude = ['user_permissions', 'email', 'is_superuser', 'is_staff', 'password', 'groups'])
                compound_dict['social_usr'] = model_to_dict(follow.user.social_user, exclude = [])
            elif follow.type == 'grp':
                compound_dict['grp'] = model_to_dict(follow.group)
            elif follow.type == 'pag':
                compound_dict['pag'] = model_to_dict(follow.page)
            follows['paginated_follows'].append(compound_dict)
            
        followed_by = Follow.objects.filter(type = 'usr', follow_id = owner.id)
        followed_by_paginator = Paginator(followed_by, 1)
        try: followed_by_page = followed_by_paginator.page(1)
        except (EmptyPage, InvalidPage): followed_by_page = followed_by_paginator.page(followed_by_paginator.num_pages)
        
        follows['followed_by_count'] = followed_by_paginator.count
        logger.info(follows)
        return follows
    
class FollowedEntityHandler(InteractionHandler):
    allowed_methods = ('GET')
    
    @status_response
    @json_data
    def read(self, request, data):
        cookie_user = checkCookieToken(request)
        if cookie_user is None:
            #Not logged in?
            pass
        
        follow_id = data['entity_id']
        page_num = data['page_num']
        entity_type = data['entity_type']
        follows = {}
        follows['paginated_follows'] = []
        user_is_follower = False
        logger.info("entity: " + str(follow_id) + " type: " + entity_type)
        if entity_type == 'pag':
            followed_by = Follow.objects.filter(page = Page.objects.get(id = follow_id))
            if cookie_user is not None:
                logged_followers = Follow.objects.filter(owner=cookie_user, page = Page.objects.get(id = follow_id))
                if len(logged_followers) > 0:
                    user_is_follower = True
        elif entity_type == 'grp':
            followed_by = Follow.objects.filter(group = Group.objects.get(id = follow_id))
            if cookie_user is not None:
                logged_followers = Follow.objects.filter(owner=cookie_user, group = Group.objects.get(id = follow_id))
                if len(logged_followers) > 0:
                    user_is_follower = True
        elif entity_type == 'usr':        
            followed_by = Follow.objects.filter(user = User.objects.get(id = follow_id))                      
            if cookie_user is not None:
                logged_followers = Follow.objects.filter(owner=cookie_user, user = User.objects.get(id = follow_id))
                if len(logged_followers) > 0:
                    user_is_follower = True
        
        follows['user_is_follower'] = user_is_follower
                                               
        followed_by_paginator = Paginator(followed_by, 20)
        try: followed_by_page = followed_by_paginator.page(page_num)
        except (EmptyPage, InvalidPage): followed_by_page = followed_by_paginator.page(followed_by_paginator.num_pages)
        
        follows['followed_by_count'] = followed_by_paginator.count
        
        for follower in followed_by_page.object_list:
            compound_dict = model_to_dict(follow)
            if follow.type == 'usr':
                compound_dict['usr'] = model_to_dict(follow.user, exclude = ['user_permissions', 'email', 'is_superuser', 'is_staff', 'password', 'groups'])
                compound_dict['social_usr'] = model_to_dict(follow.user.social_user, exclude = [])
            follows['paginated_follows'].append(compound_dict)
        
        
        
        return follows
    
    
    
    
    
