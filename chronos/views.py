from itertools import groupby
from rb.models import *
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render_to_response, get_object_or_404
from datetime import datetime
from django.db.models import Count, Sum
from django.core import serializers
from settings import DEBUG, FACEBOOK_APP_ID
from authentication.decorators import requires_admin, requires_access_key
from django.template import RequestContext
from authentication.token import checkCookieToken
from chronos.models import * 
from django.core.mail import EmailMessage
from api.userutils import *
from api.utils import *
from jobs import *

import logging
logger = logging.getLogger('rb.standard')

rules = {'threshold1':ThresholdNotificationRule(threshold = 1), 
         'threshold5':ThresholdNotificationRule(threshold = 5), 
         'threshold10':ThresholdNotificationRule(threshold = 10), 
         'threshold25':ThresholdNotificationRule(threshold = 25), 
         'threshold50':ThresholdNotificationRule(threshold = 50), 
         'threshold100':ThresholdNotificationRule(threshold = 100)
         }

page_rules = [ThresholdNotificationRule(threshold = 1),
         ThresholdNotificationRule(threshold = 5), 
         ThresholdNotificationRule(threshold = 10),
         ThresholdNotificationRule(threshold = 25), 
         ThresholdNotificationRule(threshold = 50), 
         ThresholdNotificationRule(threshold = 100)
         ]

MILLI_RANK_INC = 60000

def agree(request, interaction_id = None, **kwargs):
    context = {}
    try:
        interaction = Interaction.objects.get(id = interaction_id)
        social_user = SocialUser.objects.get(user = interaction.user)
        new_rank = interaction.rank + MILLI_RANK_INC 
        interaction.rank = new_rank
        interaction.save()
        group = interaction.page.site.group

        logger.info("agree: CHECK IF SEND NOTIFICATION: " + str(social_user.notification_email_option))
        logger.info("agree: CHECK IF GROUP SEND NOTIFICATION: " + str(group.send_notifications))
        if social_user.notification_email_option and group.send_notifications:
            child_interactions = Interaction.objects.filter(parent = interaction, kind = 'tag').order_by('-created')
            child_count = child_interactions.count()
            thresholds = NotificationType.objects.filter(name__startswith = 'agreethreshold')
            for threshold in thresholds:
                passed = True
                for rule in threshold.rules.all():
                    if rules.has_key(rule.name):
                        passed = rules[rule.name].passes(count = child_count) 
                        if not passed:
                            break
                if passed:
                    notification, created = InteractionNotification.objects.get_or_create(interaction = interaction, 
                                                                       social_user = social_user,
                                                                       notification_type = threshold)
                    if created:
                        #SEND EMAIL!
                        msg = EmailMessage("[Antenna] Someone agreed with you!", 
                                           generateAgreeEmail(social_user.user, child_count, interaction), 
                                           "hello@antenna.is", 
                                           [social_user.user.email])
                        msg.content_subtype='html'
                        msg.send(False)
                        logger.info("SHOULD SEND NOTIFICATION: " + threshold.name)
                else:
                    logger.info("DID NOT PASS: " + threshold.name)
                    
    except Interaction.DoesNotExist:
        logger.info("BAD INTERACTION ID")
    except SocialUser.DoesNotExist:
        logger.info("NO SOCIAL USER")
    except Exception, ex:
        logger.info(ex)
    
    return render_to_response(
        "chronos.html",
        context,
        context_instance=RequestContext(request)
    )


def group_node(request, interaction_id = None, group_id = None, **kwargs):
    context = {}
    try:
        interaction = Interaction.objects.get(id = interaction_id)
        group = Group.objects.get(id = group_id)
        admin_index = 0
        for admin in group.admins.all():
            #SEND EMAIL!
            msg = EmailMessage("[Antenna] A new reaction just appeared on your site", 
                               generateGroupNodeEmail(interaction, admin_index), 
                               "hello@antenna.is", 
                               [admin.user.email])
            msg.content_subtype='html'
            msg.send(False)
            logger.info("SHOULD SEND NOTIFICATION: group_node " )
            admin_index += 1
        
    except Interaction.DoesNotExist:
        logger.info("BAD INTERACTION ID")
    except Exception, ex:
        logger.info(ex)
    
    return render_to_response(
        "chronos.html",
        context,
        context_instance=RequestContext(request)
    )




def comment(request, interaction_id = None, **kwargs):
    context = {}
    
    try:
        interaction = Interaction.objects.get(id = interaction_id)
        social_user = SocialUser.objects.get(user = interaction.user)
        new_rank = interaction.rank + MILLI_RANK_INC * 2 
        interaction.rank = new_rank
        interaction.save()
        group = interaction.page.site.group
        logger.info("comment: CHECK IF GROUP SEND NOTIFICATION: " + str(group.send_notifications))
        if social_user.notification_email_option and group.send_notifications:
        # if social_user.notification_email_option:
            child_interactions = Interaction.objects.exclude(user=interaction.user).filter(parent = interaction, kind = 'com').order_by('-created')
            child_count = child_interactions.count()
            thresholds = NotificationType.objects.filter(name__startswith = 'commentthreshold')
            for threshold in thresholds:
                passed = True
                for rule in threshold.rules.all():
                    if rules.has_key(rule.name):
                        passed = rules[rule.name].passes(count = child_count) 
                        if not passed:
                            break
                if passed:
                    notification, created = InteractionNotification.objects.get_or_create(interaction = interaction, 
                                                                       social_user = social_user,
                                                                       notification_type = threshold)
                    
                   # if created:
                    logger.info("sending comment notification")
                    msg = EmailMessage("[Antenna] Someone commented on your reaction!", 
                                           generateCommentEmail(social_user.user, interaction), 
                                           "hello@antenna.is", 
                                           [interaction.user.email])
                    msg.content_subtype='html'
                    msg.send(False)
                    logger.info("SHOULD SEND NOTIFICATION: " + threshold.name)
                else:
                    logger.info("DID NOT PASS: " + threshold.name)
                    
    except Interaction.DoesNotExist:
        logger.info("BAD INTERACTION ID")
    except SocialUser.DoesNotExist:
        logger.info("NO SOCIAL USER")
    
    
    return render_to_response(
        "chronos.html",
        context,
        context_instance=RequestContext(request)
    )

def page(request, interaction_id = None, **kwargs):
    context = {}
    try:
        interaction = Interaction.objects.get(id = interaction_id)
        page = interaction.page
        page_interactions_list = list(page.interactions().order_by('-created'))
        group = page.site.group
        user_set = set()
        distance = 1
        for p_i in page_interactions_list:
            if (
                not p_i.user in user_set and
                interaction.user != p_i.user and 
                (not interaction.parent or interaction.parent != p_i) 
            ):
                try:
                    social_user = SocialUser.objects.get(user = p_i.user)
                    logger.info("CHECK IF SEND NOTIFICATION: " + str(social_user.notification_email_option))
                    logger.info("CHECK IF GROUP SEND NOTIFICATION: " + str(group.send_notifications))
                    if social_user.notification_email_option and group.send_notifications:
                    # if social_user.notification_email_option:
                        for threshold in page_rules:
                            if (
                                threshold.passes(count=distance, exact=True)
                                and not p_i.user.email.startswith('tempuser')
                            ):
                                logger.info("sending page notification to:" + p_i.user.email)
                                msg = EmailMessage("[Antenna] Someone reacted to the same page as you!", 
                                                       generatePageEmail(p_i.user, interaction), 
                                                       "hello@antenna.is", 
                                                       [p_i.user.email])
                                msg.content_subtype='html'
                                msg.send(False)
                                user_set.add(p_i.user)

                except SocialUser.DoesNotExist:
                    logger.info("NO SOCIAL USER")

                distance += 1

    except Interaction.DoesNotExist:
        logger.info("BAD INTERACTION ID")
    except Exception, ex:
        logger.info(ex)
    
    return render_to_response(
        "chronos.html",
        context,
        context_instance=RequestContext(request)
    )


def email_agree(request, interaction_id, user_id, count):
    context = {}
    interaction = Interaction.objects.get(id=interaction_id)
    page = interaction.page
    user = User.objects.get(id=user_id)
    page_interactions = Interaction.objects.filter(page=page)
    context['interaction'] = interaction
    context['page'] = page
    context['user'] = user
    context['count'] = count
    context['page_interactions'] = page_interactions
    context['base_url'] = settings.BASE_URL
    return render_to_response(
        "agree_email.html",
        context,
        context_instance=RequestContext(request)
    )



def email_group_node(request, interaction_id, group_id, admin_index):
    context = {}
    interaction = Interaction.objects.get(id=interaction_id)
    group = Group.objects.get(id=group_id)
    
    context['interaction'] = interaction
    context['group'] = group
    context['admin'] = group.admins.all()[int(admin_index)]
    context['base_url'] = settings.BASE_URL
    return render_to_response(
        "group_node.html",
        context,
        context_instance=RequestContext(request)
    )


def email_comment(request, interaction_id, user_id):
    context = {}
    interaction = Interaction.objects.get(id=interaction_id)
    page = interaction.page
    user = User.objects.get(id=user_id)
    page_interactions = Interaction.objects.filter(page=page)
    context['interaction'] = interaction
    context['page'] = page
    context['user'] = user
    context['page_interactions'] = page_interactions
    context['base_url'] = settings.BASE_URL
    return render_to_response(
        "comment_email.html",
        context,
        context_instance=RequestContext(request)
    )

def email_page(request, interaction_id, user_id):
    context = {}
    interaction = Interaction.objects.get(id=interaction_id)
    page = interaction.page
    user = User.objects.get(id=user_id)
    page_interactions = Interaction.objects.filter(page=page)
    context['interaction'] = interaction
    context['page'] = page
    context['user'] = user
    context['page_interactions'] = page_interactions
    context['base_url'] = settings.BASE_URL
    return render_to_response(
        "page_email.html",
        context,
        context_instance=RequestContext(request)
    )
    
def email_follow(request, user_id, follow_id):
    context = {}
    user = User.objects.get(id=user_id)    
    follower = User.objects.get(id=follow_id)
    follow_social = SocialUser.objects.get(user=follower)
    context['user'] = user
    context['follower'] = follower
    context['follow_social'] = follow_social
    context['base_url'] = settings.BASE_URL
    
    return render_to_response(
        "follow_email.html",
        context,
        context_instance=RequestContext(request)
    )


