from antenna.api.util_functions import *
from antenna.rb.models import *
from antenna.rb.profanity_filter import ProfanitiesFilter
from antenna.chronos.jobs import AsynchNewGroupNodeNotification, AsynchPageNotification
from antenna.antenna_celery import app as celery_app
from antenna.analytics.tasks import update_page_newer_cache, update_page_cache, update_page_container_hash_cache
from antenna.api.exceptions import FBException, JSONException
from django.db.models import Q
from django.core.cache import cache
from django.core.paginator import Paginator, InvalidPage, EmptyPage
from django.core.cache import cache
from django.forms.models import model_to_dict
from datetime import datetime, timedelta
import random
import json
import re
import time
import string
from threading import Thread
from urlparse import urlsplit, urlunsplit
import traceback
import logging
import hashlib
logger = logging.getLogger('rb.standard')





def deleteInteraction(interaction, user):
    if interaction and user:
        tempuser = False
        if interaction.user != user:
            raise JSONException("User id and interaction's user id do not match")
        if isTemporaryUser(user):
            interactions = Interaction.objects.filter(user=user)
            num_interactions = len(interactions)
            tempuser = True

        # This will delete an interaction and all of it's children
        try:
            interaction.delete();
            try:
                logger.info("CACHEUPDATE ON DELETE")
                update_page_cache.delay(interaction.page.id)
                update_page_container_hash_cache.delay(interaction.page.id, [interaction.container.hash], [])
                update_page_newer_cache.delay(interaction.page.id)
            except Exception, e:
                logger.warning(traceback.format_exc(50))   
    
        except:
            raise JSONException("Error deleting the interaction")
        if tempuser: return dict(deleted_interaction=interaction, num_interactions=num_interactions-1)
        return dict(deleted_interaction=interaction)
    else:
        raise JSONException("Missing interaction or user")

def createInteraction(page, container, content, user, kind, interaction_node, group=None, parent=None, tag_is_default=False):
    
    # do we need to validate this tag, i.e., check it against the blocked words list?
    checkIfOffensiveTag = True

    approveOnCreate = True

    # if tag is a default tag (which makes this vulnerable to the client-side), pass it on through
    if tag_is_default == True:
        checkIfOffensiveTag = False

    # otherwise, see if this group requires approval for custom reactions, and if this tag is already "blessed"
    elif group and group.requires_approval:
        print "GROUP REQUIRES APPROVAL..."
        if interaction_node in group.blessed_tags.all():
            print "tag already approved"
            checkIfOffensiveTag = False
        else:
            print "tag NOT already approved"
            approveOnCreate = False

    print "approveOnCreate: " + str(approveOnCreate)

    blockThisTag = False

    interaction_node.body = strip_tags(interaction_node.body)
    if interaction_node.body == '':
        raise JSONException("Group has blocked this tag.")

    if checkIfOffensiveTag == True and kind and kind == 'tag':        
        # see if it is a Blocked reaction
        if group and group.blocked_tags:
            for blocked in group.blocked_tags.all():
                if interaction_node.body == blocked.body:
                    raise JSONException("Group has blocked this tag.")

        # see if it is a reaction listed in the more free-flowing "blocked word list"
        if group and group.word_blacklist:
            # Check body for blacklisted word
            # if in the blacklist, block it
            blacklist = [word.strip().lower() for word in group.word_blacklist.split(',')]

            # strip punctuation and whitespace, so that f!u ck is not OK
            tagLowerCased = re.sub('[%s]' % re.escape(string.punctuation), '', interaction_node.body.lower())
            tagLowerCased = re.sub('[%s]' % re.escape(string.whitespace), '', tagLowerCased)

            # check the whole reaction (i.e. 'f u c k'), and smash case
            if tagLowerCased in blacklist:
                blockThisTag = True

            tagNoNumbers = re.sub("^\d+\s|\s\d+\s|\s\d+$", " ", interaction_node.body.lower() )
            tagLowerCasedNoNumbers = re.sub('[%s]' % re.escape(string.punctuation), '', tagNoNumbers)
            tagLowerCasedNoNumbers = re.sub('[%s]' % re.escape(string.whitespace), '', tagLowerCasedNoNumbers)

            # check the whole reaction but with loose digits removed.  does not remove numbers inside a word.
            # so fuck1 is still "fuck1" but "fuck 1" is now "fuck"
            if tagLowerCasedNoNumbers in blacklist:
                blockThisTag = True

            # let's check for words ending in "er" and see if they match bad words.
            # so check to see if "fucker" --> "fuck" --> blackword match
            if tagLowerCased.endswith('er'):
                if tagLowerCased[:-2] in blacklist:
                    blockThisTag = True

            # also check individual words, by splitting on a space
            # also, replace dashes with a space first.  a bit simple but a good start.
            # for word in tagLowerCased.replace('-', ' ').split(' '):
            for word in interaction_node.body.lower().replace('-', ' ').split(' '):
                if word.lower() in blacklist:
                    blockThisTag = True
                    
                #### DO ALL THE SAME STUFF FOR EACH 'word'.  should abstract to a function, but not right now.
                # strip punctuation and whitespace, so that f!u ck is not OK
                tagLowerCased = re.sub('[%s]' % re.escape(string.punctuation), '', word)
                tagLowerCased = re.sub('[%s]' % re.escape(string.whitespace), '', tagLowerCased)

                # check the whole reaction (i.e. 'f u c k'), and smash case
                if tagLowerCased in blacklist:
                    blockThisTag = True

                tagNoNumbers = re.sub("^\d+\s|\s\d+\s|\s\d+$", " ", word )
                tagLowerCasedNoNumbers = re.sub('[%s]' % re.escape(string.punctuation), '', tagNoNumbers)
                tagLowerCasedNoNumbers = re.sub('[%s]' % re.escape(string.whitespace), '', tagLowerCasedNoNumbers)

                # check the whole reaction but with loose digits removed.  does not remove numbers inside a word.
                # so fuck1 is still "fuck1" but "fuck 1" is now "fuck"
                if tagLowerCasedNoNumbers in blacklist:
                    blockThisTag = True

                # let's check for words ending in "er" and see if they match bad words.
                # so check to see if "fucker" --> "fuck" --> blackword match
                if tagLowerCased.endswith('er'):
                    if tagLowerCased[:-2] in blacklist:
                        blockThisTag = True


            if blockThisTag == True:
                raise JSONException("Group has blocked this tag.")



    
    # Check to see if user has reached their interaction limit
    tempuser = False
    if isTemporaryUser(user):
        num_interactions = checkLimit(user, group)
        tempuser = True

    #temporaryish hack to deal with cdn subdomain prefixes for media!!!
    #On the front end, we are stripping parts of the url out of for images and media
    #so, to keep the content url consistent, just grab it from an existing interaction if it exists.
    if content.kind == "img" or content.kind == "med":
        try:
            existing_interaction_w_content = Interaction.objects.filter(
                container=container
            )[:1].get()
            content_node = existing_interaction_w_content.content
        except Interaction.DoesNotExist:
            content_node = content
    else:
        content_node = content

    interactions = Interaction.objects.filter(user=user)
    # Check unique content_id, user_id, page_id, interaction_node_id
    try:
        existing_interaction = interactions.get(
            user=user,
            page=page,
            content=content_node,
            interaction_node=interaction_node,
            kind=kind
        )
        #logger.info("Found existing Interaction with id %s" % existing_interaction.id)
        return dict(interaction=existing_interaction, existing=True)
    except Interaction.DoesNotExist:
        pass


    if group and group.signin_organic_required:
        if not tempuser:
            pass
        elif parent:
            pass
        elif tag_is_default:
            pass
        else:
            if interaction_node in group.blessed_tags.all():
                pass
            else:
                raise JSONException(u"sign in required for organic reactions")
        
    try:
        new_interaction = Interaction(
            page=page,
            container=container,
            content=content_node,
            user=user,
            kind=kind,
            interaction_node=interaction_node,
            parent=parent,
            rank = int(time.time()*1000),
            approved = approveOnCreate
        )
    except Exception as e:
        raise JSONException(u"Error creating interaction object")

    new_interaction.save()
    try:
        is_new_tag = True
        if new_interaction.kind == 'tag':
            for alltag in page.site.group.all_tags.all():
                if alltag.body == new_interaction.interaction_node.body:
                    is_new_tag = False
            if is_new_tag:
                logger.info("Creating all tag")
                AllTag.objects.create(group=page.site.group, 
                                      node = new_interaction.interaction_node, 
                                      order=len(page.site.group.all_tags.all()),
                                      approved=approveOnCreate)
                try:
                    notification = AsynchNewGroupNodeNotification()
                    t = Thread(target=notification, kwargs={"interaction_id":new_interaction.id, "group_id":group.id})
                    t.start()
                except Exception, ex:
                    logger.warn(ex)
            
    except Exception, ex:
        logger.info("NO ALL TAG: " + traceback.format_exc(1500))
        
    ret = dict(
        interaction=new_interaction,
        content_node=content,
        existing=False,
        approved=approveOnCreate,
        container=container
    )
    try:
        logger.info("CACHEUPDATE on CREATE " + str(page.id) + " " + str(container.hash))
        update_page_cache.delay(page.id)
        update_page_container_hash_cache.delay(page.id, [container.hash], [])
        update_page_newer_cache.delay(page.id)
        
        #notification = AsynchPageNotification()
        #t = Thread(target=notification, kwargs={"interaction_id":new_interaction.id})
        #t.start()
        
        #COMMENTING OUT CROSSPAGE TO AVOID RABBITMQ BACKUP WITH OVERLY COMMON CONTAINERS
        
        #if not content.kind == 'pag':
        #    other_interactions = list(Interaction.objects.filter(
        #                container=container,
        #                page__site__group = page.site.group,
        #                approved=True
        #                ))
    
        #    other_pages = set()
        #    for other in other_interactions:
        #        other_pages.add(other.page)
        #    for other_page in other_pages:
        #        logger.info("CACHEUPDATE on OTHER PAGE " + str(container.hash))
        #        update_page_cache.delay(other_page.id)
        #        update_page_container_hash_cache.delay(other_page.id, [container.hash], [])
            
            
        #if not new_interaction.parent or new_interaction.kind == 'com':
        #    global_cache_updater = GlobalActivityCacheUpdater(method="update")
        #    t = Thread(target=global_cache_updater, kwargs={})
        #    t.start()

    except Exception, e:
        logger.warning(traceback.format_exc(50))   
    
    if tempuser: 
        ret['num_interactions']=num_interactions+1

    return ret



def searchBoards(search_term, page_num):
    board_list = []
    boards = Board.objects.all().filter(visible=True)
    if search_term is not None and len(search_term) > 0:
        boards = Board.objects.filter(Q(title__icontains = search_term) | 
                        Q(description__icontains = search_term))
    boards = boards.order_by('-modified')
    board_paginator = Paginator(boards, 20)
    try: board_page = board_paginator.page(page_num)
    except (EmptyPage, InvalidPage): board_page = board_paginator.page(board_paginator.num_pages)
    board_owners = []
    for board in board_page.object_list:
        board_owners.append(board.owner)
    socials = SocialUser.objects.filter(user__in = board_owners)
    owner_social_map = {}
    for social in socials:
        owner_social_map[social.user.id] = model_to_dict(social, exclude=['notification_email_option', 'gender', 'provider', 'bio', 'hometown', 'user',
                                                                                      'follow_email_option'])
    for board in board_page.object_list:
        board_dict = model_to_dict(board, fields=['id', 'title', 'description'])
        board_dict['social_user'] = owner_social_map[board.owner.id]
        board_list.append(board_dict)
    return board_list



def getGlobalActivity():
    makeItLean = True
    historyLen = 5 if makeItLean else 30
    maxInteractions = 200 if makeItLean else None

    today = datetime.now()
    tdelta = timedelta(days = -historyLen)
    the_past = today + tdelta
    interactions = Interaction.objects.all()
    interactions = interactions.filter(
        created__gt = the_past, 
        kind = 'tag', 
        approved=True, 
        page__site__group__approved=True
    ).order_by('-created')[:maxInteractions]
    
    users = {}
    pages = {}
    groups = {}
    nodes ={}
    for inter in interactions:
        if not groups.has_key(inter.page.site.group.name):
            groups[inter.page.site.group.name] = {'count': 1, "group":model_to_dict(inter.page.site.group, 
                                                                                    fields=['id', 'short_name'])}
        else:
            groups[inter.page.site.group.name]['count'] +=1
            
        if not pages.has_key(inter.page.url):
            pages[inter.page.url] = {'count': 1, "page":model_to_dict(inter.page, fields=['id', 'title'])}
        else:
            pages[inter.page.url]['count'] +=1
        
        if not inter.user.email.startswith('tempuser'):    
            if not users.has_key(inter.user.id):
                user_dict = model_to_dict(inter.user, exclude=['username','user_permissions', 
                                                               'last_login', 'date_joined', 'email',
                                                                'is_superuser', 'is_staff', 'password', 'groups'])
                user_dict['social_user'] = model_to_dict(inter.user.social_user, exclude=['notification_email_option', 
                                                                                          'gender', 'provider', 
                                                                                          'bio', 'hometown', 'user',
                                                                                          'follow_email_option'])
                users[inter.user.id] = {'count': 1, "user":user_dict}
            else:
                users[inter.user.id]['count'] +=1
            
        if not nodes.has_key(inter.interaction_node.body):
            nodes[inter.interaction_node.body] = {'count': 1}
        else:
            nodes[inter.interaction_node.body]['count'] +=1
        
            
    return {'nodes':nodes, 'users':users, 'groups':groups, 'pages':pages}

