#from django.template import Context, loader
from models import *
from django.contrib.auth.models import User
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render_to_response, get_object_or_404
from django.core import serializers
from settings import FACEBOOK_APP_ID, BASE_URL
from baseconv import base62
from django.core.paginator import Paginator, InvalidPage, EmptyPage
from django.db.models import Count
from api.utils import *
from api.exceptions import JSONException
from api.token import checkCookieToken
from cards import Card
from django.utils.encoding import smart_str, smart_unicode
from django.template import RequestContext
from django.db.models import Q
from forms import *

def widget(request, sn):
    # Widget code is retreived from the server using RBGroup shortname
    try:
        rbg = Group.objects.get(short_name = sn)
    except Group.DoesNotExist:
        raise Exception('RB group with this short_name does not exist')
    return render_to_response("widget.js",{'group_id': rbg.id, 'short_name': sn, 'BASE_URL': BASE_URL}, context_instance=RequestContext(request), mimetype = 'application/javascript')

def widgetCss(request):
    # Widget code is retreived from the server using RBGroup shortname
    return render_to_response("widget.css",
      context_instance=RequestContext(request),
      mimetype = 'text/css')

def fb(request):
    return render_to_response(
      "facebook.html",
      {'fb_client_id': FACEBOOK_APP_ID},
      context_instance=RequestContext(request)
    )

def fblogin(request):
    group_name =  request.GET.get('group_name', None)
    return render_to_response(
      "fblogin.html",
      {'fb_client_id': FACEBOOK_APP_ID, 'group_name': group_name},
      context_instance=RequestContext(request)
    )

def xdm_status(request):
    return render_to_response(
      "xdm_status.html",
      {'fb_client_id': FACEBOOK_APP_ID},
      context_instance=RequestContext(request)
    )

def group(request):
    pass

def main(request, user_id=None, short_name=None, site_id=None, page_id=None, **kwargs):
    cookie_user = checkCookieToken(request)
    page_num = request.GET.get('page_num', 1)
    context = {
        'fb_client_id': FACEBOOK_APP_ID,
        'user_id': user_id,
        'short_name': short_name,
        'kwargs': kwargs,
        'page_num': page_num
    }

    if cookie_user:
        context['cookie_user'] = cookie_user
        
    """ For interactions.html """
    interactions = Interaction.objects.all()

    # Search interaction node body and content body
    # for instances of the 's' query string parameter
    query_string = request.GET.get('s', None)
    if query_string:
        interactions = interactions.filter(
            Q(interaction_node__body__icontains=query_string) |
            Q(content__body__icontains=query_string)
        )

    context['query_string'] = query_string

    # Interactions for user profile
    if user_id:
        profile_user = User.objects.get(id=user_id)
        interactions = interactions.filter(user=user_id)
        if cookie_user != profile_user:
            interactions = interactions.exclude(kind="bkm")
        context['profile_user'] = profile_user
    else:
        # If not viewing a user profile, remove bookmarks from interaction set
        interactions = interactions.exclude(kind="bkm")

    # Interactions for group profile
    if short_name:
        group = Group.objects.get(short_name=short_name)
        interactions = interactions.filter(page__site__group__short_name=short_name)
        context['group'] = group
    
    # Interactions for specific page
    if site_id:
        site = Site.objects.get(id=site_id)
        interactions = interactions.filter(page__site=site)
        context['site'] = site    

    # Interactions for specific page
    if page_id:
        page = Page.objects.get(id=page_id)
        interactions = interactions.filter(page=page)
        context['page'] = page        

    # Process view filters
    if 'view' in kwargs:
        view = kwargs['view']
        if view == 'tags': interactions = interactions.filter(kind="tag")
        if view == 'comments': interactions = interactions.filter(kind="com")
        if view == 'shares': interactions = interactions.filter(kind="shr")
        if view == 'bookmarks': interactions = interactions.filter(kind="bkm")
        
        # Index view involves grouping interactions
        if view == 'index': context['index'] = True
            
    # Only show approved interactions -- check this logic
    if 'admin' in kwargs and kwargs[admin] == 'not_approved':
        interactions = interactions.filter(approved=False)
    else:
        interactions = interactions.filter(approved=True)

    # Pagination
    interactions_paginator = Paginator(interactions, 20)

    try: page_number = int(page_num)
    except ValueError: page_number = 1

    try: current_page = interactions_paginator.page(page_number)
    except (EmptyPage, InvalidPage): current_page = paginator.page(paginator.num_pages)

    context['current_page'] = current_page

    return render_to_response("index.html", context, context_instance=RequestContext(request))

def cards(request, **kwargs):
    # Get interaction set based on filter criteria
    interactions = Interaction.objects.all()

    # Get set of pages -- interactions ordered by -created
    page_ids = interactions.values_list('page')
    pages = Page.objects.filter(id__in=page_ids)[:10]
    pages = pages.select_related('group')

    cards = [Card(page, interactions.filter(page=page)) for page in pages]
    context = {'cards': cards}
    return render_to_response("cards.html", context, context_instance=RequestContext(request))

def interactions(request):
    pass

def sidebar(request, user_id=None, short_name=None):
    pass

@requires_admin
def settings(request, group=None):
    if request.method == 'POST':
        form = GroupForm(request.POST, instance=group)
        if form.is_valid():
            form.save()
    else:
        form = GroupForm(instance=group)

    return render_to_response(
        "group_form.html", 
        {"form": form, "short_name": group.short_name},
        context_instance=RequestContext(request)
    )

def admin_request(request, short_name=None):
    try:
        group = Group.objects.get(short_name=short_name)
    except Group.DoesNotExist:
        return JSONException(u'Invalid group')

    return render_to_response(
        "admin_request.html",
        {"group": group},
        context_instance=RequestContext(request)
    )

def expander(request, short):
    link_id = base62.to_decimal(short);

    # Retrieve Link object
    try:
        link = Link.objects.get(id=link_id);
    except Link.DoesNotExist:
        raise JSONException("Link didn't exist (it's in ur base killin ur dudez)")

    # Update usage count
    link.usage_count += 1
    link.save()

    # Retrieve related objects
    interaction = Interaction.objects.get(id=link.interaction.id)
    page = Page.objects.get(id=interaction.page.id)

    # Create redirect response
    url = page.url;
    redirect_response = HttpResponseRedirect(unicode(url))
    redirect_response.set_cookie(key='container_hash', value=smart_str(interaction.container.hash))
    redirect_response.set_cookie(key='location', value=smart_str(interaction.content.location))
    redirect_response.set_cookie(key='content', value=smart_str(interaction.content.body))
    redirect_response.set_cookie(key='reaction', value=smart_str(interaction.interaction_node.body))
    redirect_response.set_cookie(key='referring_int_id', value=smart_str(interaction.id))
    redirect_response.set_cookie(key='content_type', value=smart_str(interaction.content.kind))

    return redirect_response
