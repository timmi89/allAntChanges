from piston.handler import AnonymousBaseHandler
from django.http import HttpResponse, HttpResponseBadRequest, Http404, HttpResponseForbidden
from django.db.models import Count
from django.core.paginator import Paginator, InvalidPage, EmptyPage
from decorators import status_response, json_data, json_data_post
from exceptions import JSONException
from utils import *
from userutils import *
from authentication.token import *
from authentication.decorators import requires_admin, requires_admin_rest
from settings import BASE_URL, STATIC_URL, RB_SOCIAL_ADMINS
from django.forms.models import model_to_dict
from django.core.mail import EmailMessage
from django.core.cache import cache
from django.db.models import Q
from chronos.jobs import *
from threading import Thread
from itertools import chain
from datetime import datetime, timedelta
import math
from rb.auto_approval import autoCreateGroup
import traceback
import logging
logger = logging.getLogger('rb.standard')

def isValidIntegerId(value):
    if isinstance(value,int):
        return True
    else:
        return False


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
        
class BoardVisibilityHandler(AnonymousBaseHandler):
    @status_response
    @json_data
    def read(self, request, data):
        # Check if current user's token has permission
        user = checkToken(data)
        
        if not user: raise JSONException(u"Token was invalid")
        
        board_id = data['board_id']
        try:
            board = Board.objects.get(id=board_id)
            if user in board.admins:
                board.visible = not board.visible
        except Board.DoesNotExist:
            raise JSONException(u"Board does not exist")
        
        
        
        
        
class FollowEmailHandler(AnonymousBaseHandler):
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
            
        # Update and save social user -- toggle follow_email_option
        su.follow_email_option = not su.follow_email_option
        su.save()

class NotificationEmailHandler(AnonymousBaseHandler):
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
            
        # Update and save social user -- toggle follow_email_option
        su.notification_email_option = not su.notification_email_option
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
            interaction.approved = not interaction.approved
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
        interaction_id = data['tag'].get('parent_id', None)

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
        try:
            notification = AsynchCommentNotification()
            t = Thread(target=notification, kwargs={"interaction_id":parent.id,})
            t.start()
        except Exception, e:
            logger.info(e)
        return interaction

class TagHandler(InteractionHandler):
    def create(self, request, data, user, page, group, kind='tag'):
        tag_body = data['tag']['body']
        if len(tag_body) > 35:
            return
        container_hash = data['hash']
        container_kind = data['container_kind']
        content_node_data = data['content_node_data']
        content_type = dict(((v,k) for k,v in Content.CONTENT_TYPES))[ content_node_data['kind'] ]
        
        #optional
        tag_id = data['tag'].get('id', None)
        location = content_node_data.get('location', None)
        parent_id = data['tag'].get('parent_id', None)

        if content_node_data.get('id'):
            content = Content.objects.get(id = content_node_data['id'])
        else:
            content = Content.objects.get_or_create(kind=content_type, 
                                                    body=content_node_data['body'], 
                                                    location=location, 
                                                    height = int(content_node_data.get('height', 0)), 
                                                    width = int(content_node_data.get('width', 0))
                                                    )[0]

        inode = createInteractionNode(tag_id, tag_body, group)

        # Get the container
        container = Container.objects.get_or_create(
            hash = container_hash,
            defaults = {'kind': container_kind,'item_type':content_node_data['item_type']}
        )[0]

        if parent_id is not None:
            parent = Interaction.objects.get(id = parent_id)
        else:
            parent = None
        # Create an interaction
        interaction = createInteraction(page, container, content, user, kind, inode, group, parent)
        
        return interaction

class MeTooHandler(AnonymousBaseHandler):
    allowed_methods = ('GET', 'POST')

    @status_response
    @json_data_post
    def create(self, request, data):
        owner = checkCookieToken(request)
        if owner is None:
            return {'message':'not_logged_in'}
        
        parent_id = data.get('parent_id', None)
        
        if parent_id is not None:
            try:
                parent = Interaction.objects.get(id = parent_id)
                interaction = createInteraction(parent.page, parent.container, parent.content, owner, parent.kind, parent.interaction_node, parent.page.site.group, parent)
                try:
                    notification = AsynchAgreeNotification()
                    #t = Thread(target=notification, kwargs={"interaction_id":interaction['interaction'].id,})
                    t = Thread(target=notification, kwargs={"interaction_id":parent_id})
                    t.start()
                except Exception, e:
                    logger.info("thread" +  str(e))
            except Interaction.DoesNotExist:
                return {'message' : 'no such interaction for metoo'}
        
        return interaction

class TagRemoveHandler(AnonymousBaseHandler):
    allowed_methods = ('GET', 'POST')

    @status_response
    @json_data_post
    def create(self, request, data):
        owner = checkCookieToken(request)
        if owner is None:
            return {'message':'not_logged_in'}
        
        interaction_id = data.get('interaction_id', None)
        
        if interaction_id is not None:
            try:
                interaction = Interaction.objects.get(id = interaction_id)
                deleteInteraction(interaction, owner)

            except Interaction.DoesNotExist:
                return {'message' : 'no such interaction for tagRemove'}
        
        return interaction_id

class StreamResponseHandler(AnonymousBaseHandler):
    allowed_methods = ('POST')

    @status_response
    @json_data_post
    def create(self, request, data):
        owner = checkCookieToken(request)
        if owner is None:
            return {'message':'not_logged_in'}
        
        parent_id = data.get('parent_id', None)
        
        tag_body = data['tag']['body']
        
        if parent_id is not None:
            try:
                parent = Interaction.objects.get(id = parent_id)
                inode = createInteractionNode(None, tag_body, parent.page.site.group)
                interaction = createInteraction(parent.page, parent.container, parent.content, owner, 'tag', inode, parent.page.site.group, None)
                try:
                    notification = AsynchAgreeNotification()
                    t = Thread(target=notification, kwargs={"interaction_id":parent_id})
                    t.start()
                except Exception, e:
                    logger.info("thread" +  str(e))
            except Interaction.DoesNotExist:
                return {'message' : 'no such interaction for stream response'}
        return interaction
    
class StreamCommentHandler(AnonymousBaseHandler):
    allowed_methods = ('POST')

    @status_response
    @json_data_post
    def create(self, request, data):
        owner = checkCookieToken(request)
        if owner is None:
            return {'message':'not_logged_in'}
        
        parent_id = data.get('parent_id', None)
        
        comment_text = data['comment']
        
        
        if parent_id is not None:
            try:
                parent = Interaction.objects.get(id = parent_id)
                try:
                    comment = createInteractionNode(body=comment_text, group=parent.page.site.group)
                except:
                    raise JSONException(u'Error creating comment interaction node')
        
                # Create the interaction
                interaction = createInteraction(parent.page, parent.container, parent.content, owner, 'com', comment, parent.page.site.group, parent)
                try:
                    notification = AsynchCommentNotification()
                    t = Thread(target=notification, kwargs={"interaction_id":parent.id,})
                    t.start()
                except Exception, e:
                    logger.info(e)
            except Interaction.DoesNotExist:
                return {'message' : 'no such interaction for stream response'}
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
        if content_node_data.get('id'):
            content = Content.objects.get(id = content_node_data['id'])
        else:
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
        crossPageHashes = data.get('crossPageHashes', [])
        try:
            page = data['pageID']
        except KeyError:
            raise JSONException("Couldn't get pageID")
            
        
        # Guard against undefined page string being passed in
        if not isinstance(page, int): 
            errorStr = "Bad Page ID ***" + str(page)+ "***"
            raise JSONException("Bad Page ID ***" + str(page)+ "***")

        if len(hashes) == 1:
            cached_result = cache.get('page_containers' + str(page) + ":" + str(hashes))
        else:
            cached_result = cache.get('page_containers' + str(page))
        
        if cached_result is not None:
            return cached_result
        else:
            cacheable_result = getKnownUnknownContainerSummaries(page, hashes, crossPageHashes)
            if len(hashes) == 1:
                cache.set('page_containers' + str(page) + ":" + str(hashes), cacheable_result)
            else:
                cache.set('page_containers' + str(page), cacheable_result)
        
            return cacheable_result

class ContentSummaryHandler(AnonymousBaseHandler):
    @status_response
    @json_data
    def read(self, request, data):
        known = {}    
        try:
            container_id = data['container_id']

        except KeyError:
            errorStr = "container_id was expected but was not sent with data: " + str(data)
            logger.info(errorStr)
            
            raise JSONException(u"container_id was expected but was not sent")
        
        page_id = data['page_id']

        if not isValidIntegerId(page_id) or not isValidIntegerId(container_id):
            raise JSONException(u"Bad page id or container_id in content summary call")

        if data['cross_page'] == True:
            page = Page.objects.get(id=page_id)
            interactions = list(Interaction.objects.filter(
                    container=container_id,
                    page__site__group = page.site.group,
                    approved=True
                    ))
        else:
            interactions = list(Interaction.objects.filter(
                    container=container_id,
                    page=page_id,
                    approved=True
                    ))
        content_ids = (interaction.content_id for interaction in interactions)
        content = list(Content.objects.filter(id__in=content_ids).values_list('id','body','kind','location'))

        isCrossPage = (data['cross_page'] == True)
        content_summaries = getContentSummaries(interactions, content, isCrossPage=isCrossPage)

        return content_summaries

class PageDataHandler(AnonymousBaseHandler):
    @status_response
    @json_data
    def read(self, request, data, pageid=None):
        # print data
        requested_pages = data['pages']
        host = getHost(request)
        
        pages = []
        for requested_page in requested_pages:
            pages.append(getPage(host, requested_page))
        
        pages_data = []
        
        for current_page in pages:
            cached_result = cache.get('page_data' + str(current_page.id))
            if cached_result is not None:
                #logger.info('returning page data cached result')
                pages_data.append(cached_result)
            else:
                result_dict = getSinglePageDataDict(current_page.id)
                pages_data.append(result_dict)
                try:
                    cache.set('page_data' + str(current_page.id), result_dict)
                except Exception, e:
                    logger.warning(traceback.format_exc(50))   
              
        
        return pages_data

class SettingsHandler(AnonymousBaseHandler):
    model = Group
    """
    Returns the settings for a group
    """
    @status_response
    def read(self, request, group_id=None):
        host = getHost(request)
        
        #check cache by new key:
        cached_result = cache.get('group_settings_'+ str(host))
        if cached_result is not None:
            return cached_result
        else:
            #remove this logging after testing
            logger.warning("Settings cache miss: group_settings_"+ str(host))
            if not group_id:
                # Get site object
                try:
                    site = Site.objects.get(domain=host)
                    # Get Group
                    group = Group.objects.get(id=site.group.id)
    
                except Site.DoesNotExist:
    
                    cookie_user = checkCookieToken(request)
                    cleaned_data = dict(
                        name=host,
                        short_name=host,
                        domain=host
                    )
    
                    group = autoCreateGroup(cleaned_data, cookie_user)
            else:
                group = Group.objects.get(id=group_id)
            
        
            settings_dict = getSettingsDict(group)
            try:
                cache_updater = GroupSettingsDataCacheUpdater(method="update", group=group, host=host)
                t = Thread(target=cache_updater, kwargs={})
                t.start()
            except Exception, e:
                logger.warning(traceback.format_exc(50))   
                  
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
        elif type =='brd':
            follow.board = Board.objects.get(id=follow_id)   
        else:
            return {'message':'bad_type'}
        
        follow.save()
        
        follow_dict = model_to_dict(
            follow,
            exclude=[]
        )
        if follow.user is not None and follow.user.social_user.follow_email_option:
            follow_email = generateFollowEmail(owner)
            msg = EmailMessage("Someone just followed you on Antenna!", follow_email, "hello@antenna.is", [follow.user.email])
            msg.content_subtype='html'
            msg.send(False)
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
            elif follow.type == 'grp' and follow.group is not None:
                compound_dict['grp'] = model_to_dict(follow.group, exclude=['word_blacklist'])
            elif follow.type == 'pag' and follow.page is not None:
                compound_dict['pag'] = model_to_dict(follow.page)
            elif follow.type == 'brd' and follow.board is not None:
                compound_dict['brd'] = model_to_dict(follow.board)
            follows['paginated_follows'].append(compound_dict)
            
        followed_by = Follow.objects.filter(type = 'usr', follow_id = owner.id)
        followed_by_paginator = Paginator(followed_by, 1)
        try: followed_by_page = followed_by_paginator.page(1)
        except (EmptyPage, InvalidPage): followed_by_page = followed_by_paginator.page(followed_by_paginator.num_pages)
        
        follows['followed_by_count'] = followed_by_paginator.count
        #logger.info(follows)
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
        elif entity_type == 'brd':        
            followed_by = Follow.objects.filter(board = Board.objects.get(id = follow_id))                      
            if cookie_user is not None:
                logged_followers = Follow.objects.filter(owner=cookie_user, board = Board.objects.get(id = follow_id))
                if len(logged_followers) > 0:
                    user_is_follower = True
        
        follows['user_is_follower'] = user_is_follower
                                               
        followed_by_paginator = Paginator(followed_by, 20)
        try: followed_by_page = followed_by_paginator.page(page_num)
        except (EmptyPage, InvalidPage): followed_by_page = followed_by_paginator.page(followed_by_paginator.num_pages)
        
        follows['followed_by_count'] = followed_by_paginator.count
        
        for follower in followed_by_page.object_list:
            compound_dict = model_to_dict(follower)
            compound_dict['usr'] = model_to_dict(follower.owner, exclude = ['user_permissions', 'email', 'is_superuser', 'is_staff', 'password', 'groups'])
            compound_dict['social_usr'] = model_to_dict(follower.owner.social_user, exclude = [])
            follows['paginated_follows'].append(compound_dict)
        
        
        
        return follows
    
class EntitySearchHandler(AnonymousBaseHandler):
    allowed_methods = ('GET')
    
    @status_response
    @json_data
    def read(self, request, data):
        cookie_user = checkCookieToken(request)
        if cookie_user is None:
            #Not logged in?
            pass
        entity_type = data.get('entity_type', 'usr')
        search_term = data['search_term']
        page_num = data.get('page_num',1)
        entities = {}
        if entity_type == 'usr':
            entities['users'] = []
            users = User.objects.filter(Q(social_user__full_name__icontains = search_term) | 
                        Q(social_user__username__icontains = search_term))
            user_paginator = Paginator(users, 20)
            try: user_page = user_paginator.page(page_num)
            except (EmptyPage, InvalidPage): user_page = user_paginator.page(user_paginator.num_pages)
            for user in user_page.object_list:
                user_dict = model_to_dict(user, exclude=['user_permissions', 'email', 'is_superuser', 'is_staff', 'password', 'groups'])
                user_dict['social_user'] = model_to_dict(user.social_user)
                entities['users'].append(user_dict)
        
        elif entity_type == 'grp':
            entities['groups'] = []
            groups = Group.objects.filter(Q(name__icontains = search_term) | 
                        Q(short_name__icontains = search_term))
            group_paginator = Paginator(groups, 20)
            try: group_page = group_paginator.page(page_num)
            except (EmptyPage, InvalidPage): group_page = group_paginator.page(group_paginator.num_pages)
            for group in group_page.object_list:
                group_dict = model_to_dict(group, fields=['id', 'name', 'short_name'])
                entities['groups'].append(group_dict)
                
        return entities
        

class PlusOneUserHandler(AnonymousBaseHandler):
    allowed_methods = ('GET')
    
    @status_response
    @json_data
    def read(self, request, data):
        cookie_user = checkCookieToken(request)
        if cookie_user is None:
            #Not logged in?
            pass
        
        parent_id = data['parent_id']
        
        parent_interaction = Interaction.objects.get(id=parent_id)
        child_interactions = Interaction.objects.filter(parent = parent_interaction)
        users = []
        
        for child in child_interactions:
            user_dict = model_to_dict(child.user, exclude=['user_permissions', 'last_login', 'date_joined', 'email', 'is_superuser', 'is_staff', 'password', 'groups'])
            user_dict['social_user'] = model_to_dict(child.user.social_user, exclude=['notification_email_option', 'gender', 'provider', 'bio', 'hometown', 'user',
                                                                                      'follow_email_option'])
            users.append(user_dict)
                
        return users
        

class BoardAddHandler(AnonymousBaseHandler):
    allowed_methods = ('GET')

    @status_response
    @json_data
    def read(self, request, data, **kwargs):
        cookie_user = checkCookieToken(request)
        if cookie_user is None:
            raise JSONException('not logged in')
        board_id = int(data['board_id'])
        interaction_id = int(data['int_id'])
        board = Board.objects.get(id = board_id)
        interaction = Interaction.objects.get(id = interaction_id)
        if cookie_user in board.admins.all():       
            if kwargs.get('action') is not None and kwargs.get('action') == 'delete':
                board_interaction = BoardInteraction.objects.get(board = board, interaction = interaction)
                board_interaction.delete()
                return {'message':'deleted'}
            
            elif kwargs.get('action') is not None and kwargs.get('action') == 'add':
                board_interaction = BoardInteraction.objects.get_or_create(board = board, interaction = interaction)
                board.save()
                return model_to_dict(board_interaction[0])
    
        else:
            return {'message':'whoareyou?'}


class UserBoardsHandler(AnonymousBaseHandler):
    allowed_methods = ('GET')

    @status_response
    def read(self, request, user_id = None, **kwargs):
        if user_id:
            board_user = User.objects.get(id=user_id)
            logged_in_user = checkCookieToken(request)
            if logged_in_user is not None and logged_in_user == board_user:
                visible = False
            else:
                visible = True
        else:    
            board_user = checkCookieToken(request)
            visible = "True" == request.GET.get('visible', "True")
        
        return {'user_boards':getUserBoardsDict(board_user, visible)}
    
class BoardSearchHandler(AnonymousBaseHandler):
    allowed_methods = ('GET')

    @status_response
    @json_data
    def read(self, request, data, **kwargs):
        search_term = data.get('search_term','')
        page_num = data.get('page_num', 1)
        return {'found_boards':searchBoards(search_term, page_num)}
    
class FollowedBoardsHandler(AnonymousBaseHandler):
    allowed_methods = ('GET')
    
    @status_response
    def read(self, request,**kwargs):
        cookie_user = checkCookieToken(request)
        if cookie_user is None:
            raise JSONException('not logged in')
        follow_objects = Follow.objects.filter(owner = cookie_user, type = 'brd')
        board_list = []
        for follow in follow_objects:
            board_dict = model_to_dict(follow.board, fields=['id', 'title', 'description'])
            board_list.append(board_dict)
        return {'followed_boards':board_list}
    


class GlobalActivityHandler(AnonymousBaseHandler):
    allowed_methods = ('GET')

    @status_response
    def read(self, request, **kwargs):
        
        cached_result = cache.get('global_activity')
        if cached_result is not None:
            return cached_result
        
        global_activity = getGlobalActivity()
        
        try:
            cache_updater = GlobalActivityCacheUpdater(method="update")
            t = Thread(target=cache_updater, kwargs={})
            t.start()
        except Exception, e:
            logger.warning(traceback.format_exc(50))   
        
        return global_activity


class BlockedTagHandler(AnonymousBaseHandler):
    allowed_methods = ('GET', 'POST', 'DELETE', 'PUT')

    @requires_admin_rest
    def create(self, request, group_id = None, node_id = None, **kwargs):
        group = Group.objects.get(id=int(group_id))
        i_node = InteractionNode.objects.get(id=int(node_id))
        blocked = BlockedTag.objects.create(group=group, node = i_node, order=0)
        existing_interactions = Interaction.objects.filter(page__site__group=group, interaction_node=i_node)
        existing_interactions.update(approved = False)
        self.clear_caches(existing_interactions)

        if group and group.word_blacklist:
            group.word_blacklist += ','+i_node.body
            group.save()

        return {"created":True}    
    
        
    @requires_admin_rest
    def read(self, request, group_id = None, node_id = None, **kwargs):
        group = Group.objects.get(id=int(group_id))
        i_node = InteractionNode.objects.get(id=int(node_id))
        blocked = BlockedTag.objects.filter(group=group, node=i_node)
        if len(blocked) == 0:
            return {"blocked":False}
        return {"blocked":True}
        
        
    @requires_admin_rest
    def update(self, request, group_id = None, node_id = None, **kwargs):
        group = Group.objects.get(id=int(group_id))
        i_node = InteractionNode.objects.get(id=int(node_id))
        blocked, existed = BlockedTag.objects.get_or_create(group=group, node = i_node, order=0)
        existing_interactions = Interaction.objects.filter(page__site__group=group, interaction_node=i_node)
        existing_interactions.update(approved = False)
        self.clear_caches(existing_interactions)
        return {"updated":True}
    
    @requires_admin_rest
    def delete(self, request, group_id = None, node_id = None, **kwargs):
        group = Group.objects.get(id=int(group_id))
        i_node = InteractionNode.objects.get(id=int(node_id))
        blocked = BlockedTag.objects.get(group=group, node = i_node)
        blocked.delete()
        existing_interactions = Interaction.objects.filter(page__site__group=group, interaction_node=i_node)
        existing_interactions.update(approved = True)
        self.clear_caches(existing_interactions)
        return {"deleted":True}
       
    def clear_caches(self, interactions):
        for interaction in interactions:
            page = interaction.page
            container = interaction.container
            
            try:
                cache.delete('page_data' + str(page.id))
                
                cache.delete('page_containers' + str(page.id))
                
                cache.delete('page_containers' + str(page.id) + ":" + str([container.hash]))
                
                #if not interaction.parent or interaction.kind == 'com':
                #    global_cache_updater = GlobalActivityCacheUpdater(method="update")
                #    t = Thread(target=global_cache_updater, kwargs={})
                #    t.start()
        
            except Exception, e:
                logger.warning(traceback.format_exc(50))
            
class BlockedPromoTagHandler(AnonymousBaseHandler):
    allowed_methods = ('GET', 'POST', 'DELETE', 'PUT')

    @requires_admin_rest
    def create(self, request, group_id = None, node_id = None, **kwargs):
        group = Group.objects.get(id=int(group_id))
        i_node = InteractionNode.objects.get(id=int(node_id))
        blocked = BlockedPromoTag.objects.create(group=group, node = i_node, order=0)
        existing_interactions = Interaction.objects.filter(page__site__group=group, interaction_node=i_node)
        existing_interactions.update(promotable = False)
        self.clear_caches(existing_interactions)

        if group and group.word_blacklist:
            group.word_blacklist += ','+i_node.body
            group.save()

        return {"created":True}    
    
        
    @requires_admin_rest
    def read(self, request, group_id = None, node_id = None, **kwargs):
        group = Group.objects.get(id=int(group_id))
        i_node = InteractionNode.objects.get(id=int(node_id))
        blocked = BlockedPromoTag.objects.filter(group=group, node=i_node)
        if len(blocked) == 0:
            return {"blocked":False}
        return {"blocked":True}
        
        
    @requires_admin_rest
    def update(self, request, group_id = None, node_id = None, **kwargs):
        group = Group.objects.get(id=int(group_id))
        i_node = InteractionNode.objects.get(id=int(node_id))
        blocked, existed = BlockedPromoTag.objects.get_or_create(group=group, node = i_node, order=0)
        existing_interactions = Interaction.objects.filter(page__site__group=group, interaction_node=i_node)
        existing_interactions.update(promotable = False)
        self.clear_caches(existing_interactions)
        return {"updated":True}
    
    @requires_admin_rest
    def delete(self, request, group_id = None, node_id = None, **kwargs):
        group = Group.objects.get(id=int(group_id))
        i_node = InteractionNode.objects.get(id=int(node_id))
        blocked = BlockedPromoTag.objects.get(group=group, node = i_node)
        blocked.delete()
        existing_interactions = Interaction.objects.filter(page__site__group=group, interaction_node=i_node)
        existing_interactions.update(promotable = True)
        self.clear_caches(existing_interactions)
        return {"deleted":True}
       
    def clear_caches(self, interactions):
        for interaction in interactions:
            page = interaction.page
            container = interaction.container
            
            try:
                cache_updater = PageDataCacheUpdater(method="delete", page_id=page.id)
                t = Thread(target=cache_updater, kwargs={})
                t.start()
                
                container_cache_updater = ContainerSummaryCacheUpdater(method="delete", page_id=page.id)
                t = Thread(target=container_cache_updater, kwargs={})
                t.start()
                
                page_container_cache_updater = ContainerSummaryCacheUpdater(method="delete", page_id=str(page.id),hashes=[container.hash])
                t = Thread(target=page_container_cache_updater, kwargs={})
                t.start()
 
                if not interaction.parent or interaction.kind == 'com':
                    global_cache_updater = GlobalActivityCacheUpdater(method="update")
                    t = Thread(target=global_cache_updater, kwargs={})
                    t.start()
        
            except Exception, e:
                logger.warning(traceback.format_exc(50))
            