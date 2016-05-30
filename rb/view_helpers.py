from models import *
from django.contrib.auth.models import User
from django.http import HttpResponse, HttpResponseRedirect, Http404
from django.shortcuts import render_to_response, get_object_or_404
from django.core import serializers
from settings import FACEBOOK_APP_ID, BASE_URL
from baseconv import base62_decode
from django.core.paginator import Paginator, InvalidPage, EmptyPage
from django.db.models import Count
from django.db import IntegrityError
from api.utils import *
from api.userutils import *
from authentication.token import checkCookieToken
from authentication.decorators import requires_admin
from authentication.decorators import requires_admin_wordpress
from cards import Card
from django.utils.encoding import smart_str, smart_unicode
from django.template import RequestContext
from django.db.models import Q
from forms import *
from django.forms.models import model_to_dict
from datetime import datetime
from django.contrib.auth.forms import UserCreationForm
from django.core.mail import EmailMessage

from django import template
from django.utils.safestring import mark_safe
from django.utils import simplejson

import logging
logger = logging.getLogger('rb.standard')


def main_helper(request, user_id = None, short_name = None, **kwargs):
    cookie_user = checkCookieToken(request)
    timestamp = datetime.now().date()
    page_num = request.GET.get('page_num', 1)
    context = {
        'fb_client_id': FACEBOOK_APP_ID,
        'user_id': user_id,
        'short_name': short_name,
        'kwargs': kwargs,
        'page_num': page_num,
        'timestamp': timestamp,
        'BASE_URL': BASE_URL
    }
    

    if cookie_user:
        context['cookie_user'] = cookie_user
        # Look for a better way to do this
        
        try:
            social_user = SocialUser.objects.get(user=cookie_user)
            context['ga_ids'] = GroupAdmin.objects.filter(
                social_user=social_user,
                approved=True
            ).values_list('group_id', flat=True)
        
        except SocialUser.DoesNotExist:
            pass
            #logger.info("SOCIAL USER DOES NOT EXIST FOR: " + str(cookie_user))
        
    return context

        
def user_helper(user_id, interactions, context):
    try:
        profile_user = User.objects.get(id=user_id)
        
        interactions = interactions.filter(user=user_id)
        if context.has_key('cookie_user') and context['cookie_user'] != profile_user:
            try:
                social = SocialUser.objects.get(user=profile_user)
                if social.private_profile:
                    interactions = interactions.none()
                else:
                    interactions = interactions.exclude(kind="bkm")
            except SocialUser.DoesNotExist:
                interactions = interactions.exclude(kind="bkm")
            
            
        context['profile_user'] = profile_user
        
        return interactions
    except User.DoesNotExist:
        raise Http404


def group_helper(short_name, interactions, context):
    try:
        group = Group.objects.get(short_name=short_name)
        interactions = interactions.filter(page__site__group__short_name=short_name)
        context['group'] = group
        return interactions
    except Group.DoesNotExist:
        raise Http404
    
def singleton_helper(interaction_id, interactions, context):
    interactions = interactions.filter(id=interaction_id)
    context['singleton'] = True
    return interactions

def site_helper(site_id, interactions, context):
    try:
        site = Site.objects.get(id=site_id)
        interactions = interactions.filter(page__site=site)
        context['site'] = site    
        return interactions
    except Site.DoesNotExist:
        raise Http404
        
def page_helper(page_id, interactions, context):
    try:
        page = Page.objects.get(id=page_id)
        interactions = interactions.filter(page=page)
        context['page'] = page  
        return interactions      
    except Page.DoesNotExist:
        raise Http404


def filter_interactions(interactions, context, **kwargs):
    # Process view filters
    if 'view' in kwargs:
        view = kwargs['view']
        if view == 'tags': interactions = interactions.filter(kind="tag")
        if view == 'comments': interactions = interactions.filter(kind="com")
        if view == 'shares': interactions = interactions.filter(kind="shr")
        if view == 'bookmarks': interactions = interactions.filter(kind="bkm")
        
        # Index view involves grouping interactions
        if view == 'index': context['index'] = True
        
    interactions = interactions.exclude(page__site__group__demo_group=True)
            
    # Only show approved interactions -- check this logic
    if 'admin' in kwargs and kwargs['admin'] == 'not_approved':
        interactions = interactions.filter(approved=False)
    else:
        interactions = interactions.filter(approved=True)

    if 'filtered' in kwargs:
        #logger.info('filtering')
        #interactions = interactions.filter( Q(user = cookie_user) & ~Q(user__email__exact='tempuser@readrboard.com') | Q(page__site__group__approved = True))
        interactions = interactions.filter(page__site__group__approved = True)

    return interactions

def paginate_with_children(interactions, page_num, context, query_string=None):
    interactions_paginator = Paginator(interactions, 50)

    try: page_number = int(page_num)
    except ValueError: page_number = 1

    try: current_page = interactions_paginator.page(page_number)
    except (EmptyPage, InvalidPage): current_page = interactions_paginator.page(interactions_paginator.num_pages)
      
    context['current_page'] = current_page
    len(current_page.object_list)
    parent_ids = []
    for inter in current_page.object_list:
        parent_ids.append(inter.id)
    
    child_interactions = Interaction.objects.filter(parent__id__in = parent_ids, kind='tag')
    
    if query_string:
        comment_parents = set()
        for inter in current_page.object_list:
            if inter.kind == 'com':
                comment_parents.add(inter.parent)
        context['comment_parents'] = comment_parents        
        
    context['child_interactions'] = {}
    
    for child_interaction in child_interactions:
        if not context['child_interactions'].has_key(child_interaction.parent.id):
            context['child_interactions'][child_interaction.parent.id] = 0

        context['child_interactions'][child_interaction.parent.id] += 1
        
def admin_helper(request,context):
    cookie_user = checkCookieToken(request)
    if cookie_user:
        if len(SocialUser.objects.filter(user=cookie_user)) == 1:
            admin_groups = cookie_user.social_user.admin_groups()
            if not len(admin_groups) > 0:
                return HttpResponseRedirect('/')
            context['admin_groups'] = admin_groups

    context['cookie_user'] = cookie_user

    return context



