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

from jobs import *

import logging
logger = logging.getLogger('rb.standard')

rules = {'threshold1':ThresholdNotificationRule(threshold = 1), 
         'threshold5':ThresholdNotificationRule(threshold = 5)}

@requires_access_key
def agree(request, interaction_id = None, **kwargs):
    context = {}
    
    try:
        interaction = Interaction.objects.get(id = interaction_id)
        social_user = SocialUser.objects.get(user = interaction.user)
        child_interactions = Interaction.objects.filter(parent = interaction).order_by('-created')
        child_count = child_interactions.count()
        logger.info("agree child count: " + str(child_count))
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

@requires_access_key
def comment(request, interaction_id = None, **kwargs):
    context = {}
    

    return render_to_response(
        "chronos.html",
        context,
        context_instance=RequestContext(request)
    )

   