#from django.template import Context, loader
from models import *
from django.contrib.auth.models import User
from django.http import HttpResponse, HttpResponseRedirect, Http404
from django.shortcuts import render_to_response, get_object_or_404
from django.core import serializers
from settings import FACEBOOK_APP_ID, BASE_URL
from baseconv import base62_decode
from django.core.paginator import Paginator, InvalidPage, EmptyPage
from django.db.models import Count
from api.utils import *
from api.userutils import *
from authentication.token import checkCookieToken
from authentication.decorators import requires_admin
from cards import Card
from django.utils.encoding import smart_str, smart_unicode
from django.template import RequestContext
from django.db.models import Q
from forms import *
from datetime import datetime
from django.contrib.auth.forms import UserCreationForm
from django.core.mail import EmailMessage

import logging
logger = logging.getLogger('rb.standard')

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

def about(request):
    return render_to_response(
      "about.html",
      {'fb_client_id': FACEBOOK_APP_ID},
      context_instance=RequestContext(request)
    )

def faq(request):
    return render_to_response(
      "faq.html",
      {'fb_client_id': FACEBOOK_APP_ID},
      context_instance=RequestContext(request)
    )

def splash(request):
    return render_to_response(
      "splash.html",
      {'fb_client_id': FACEBOOK_APP_ID},
      context_instance=RequestContext(request)
    )

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

def login(request):
    context = {}
    context['fb_client_id'] = FACEBOOK_APP_ID
    cookie_user = checkCookieToken(request)
    context['cookie_user'] = cookie_user
    if cookie_user:
        return HttpResponseRedirect(request.META['HTTP_REFERER'])
    return render_to_response(
        "login.html",
        context,
        context_instance=RequestContext(request)
    )

def sites(request):
    pass

def group(request):
    pass

def main(request, user_id=None, short_name=None, site_id=None, page_id=None, interaction_id=None, **kwargs):
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
            logger.info("SOCIAL USER DOES NOT EXIST FOR: " + str(cookie_user))
        
        
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
            try:
                social = SocialUser.objects.get(user=profile_user)
                if social.private_profile:
                    interactions = interactions.none()
                else:
                    interactions = interactions.exclude(kind="bkm")
            except SocialUser.DoesNotExist:
                interactions = interactions.exclude(kind="bkm")
            
            
        context['profile_user'] = profile_user
    else:
        # If not viewing a user profile, remove bookmarks from interaction set
        interactions = interactions.exclude(kind="bkm")
        if not query_string:
            interactions = interactions.filter(parent=None)

    # Interactions for group profile
    if short_name:
        try:
            group = Group.objects.get(short_name=short_name)
            interactions = interactions.filter(page__site__group__short_name=short_name)
            context['group'] = group
        except Group.DoesNotExist:
            raise Http404
        
    if interaction_id:
        interactions = interactions.filter(id=interaction_id)
        context['singleton'] = True
    
    # Interactions for specific page
    if site_id:
        try:
            site = Site.objects.get(id=site_id)
            interactions = interactions.filter(page__site=site)
            context['site'] = site    
        except Site.DoesNotExist:
            raise Http404
        
    # Interactions for specific page
    if page_id:
        try:
            page = Page.objects.get(id=page_id)
            interactions = interactions.filter(page=page)
            context['page'] = page        
        except Page.DoesNotExist:
            raise Http404
            
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
        logger.info('filtering')
        #interactions = interactions.filter( Q(user = cookie_user) & ~Q(user__email__exact='tempuser@readrboard.com') | Q(page__site__group__approved = True))
        interactions = interactions.filter(page__site__group__approved = True)
        
    # Pagination
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


def react(request, **kwargs):
    context = {}
    return render_to_response("react.html", context, context_instance=RequestContext(request))


def interactions(request):
    pass

def sidebar(request, user_id=None, short_name=None):
    pass
    
def create_group(request):
    context = {}
    cookie_user = checkCookieToken(request)
    if not cookie_user: return HttpResponseRedirect('/')
    
    if request.method == 'POST':
        form = CreateGroupForm(request.POST)
        if form.is_valid():
            form.save(cookie_user)
            context['requested'] = True
    else:
        form = CreateGroupForm()
        
    context['form'] = form
    context['fb_client_id'] = FACEBOOK_APP_ID
    
    return render_to_response(
        "group_create.html",
        context,
        context_instance=RequestContext(request)
    )

def create_rb_user(request):
    context = {}
    cookie_user = checkCookieToken(request)
    #what to do with a cookied user???
    #are they already registered?
    #
    user = None
    
    if request.method == 'POST':
        form = CreateUserForm(request.POST)
        if form.is_valid():
            user = form.save(True)
            
            #user.email_user("ReadrBoard email confirmation", generateConfirmationEmail(user))
            msg = EmailMessage("ReadrBoard email confirmation", generateConfirmationEmail(user), "hello@readrboard.com", [user.email])
            msg.content_subtype='html'
            msg.send(False)
            context['requested'] = True
    else:
        form = CreateUserForm()
        
    context['form'] = form
    response =  render_to_response(
        "user_create.html",
        context,
        context_instance=RequestContext(request)
    )
    
    return response

def modify_rb_social_user(request):
    logger.info("modify user")
    context = {}
    cookie_user = checkCookieToken(request)
    if not cookie_user: return HttpResponseRedirect('/rb_login/')
    try:
        social_user = SocialUser.objects.get(user=cookie_user)
        user_token = generateSocialUserToken(social_user)
    except SocialUser.DoesNotExist:
        social_user = None
        context['not_logged_in'] = True
        context['requested'] = True
        return render_to_response(
                    "social_user_modify.html",
                    context,
                    context_instance=RequestContext(request)
                    )
    
    if request.method == 'POST':
        form = ModifySocialUserForm(request.POST, request.FILES)
        if form.is_valid():
            social_user = form.save(True)
            
            context['requested'] = True
    else:
        form = ModifySocialUserForm(initial={'user_token' : user_token, 'id' : social_user.id})
        
    context['form'] = form
    response =  render_to_response(
        "social_user_modify.html",
        context,
        context_instance=RequestContext(request)
    )
    
    return response

def confirm_rb_user(request):
    context = {}
    confirmed = False
    try:
        confirmation = request.GET['confirmation']
        user_id = request.GET['uid']
        confirmed = confirmUser(user_id, confirmation)
    except KeyError, ke:
        context['message']  = 'There was a problem with your confirmation information.'
    except Exception, e:
        context['message']  = str(e)
        
    context['confirmed'] = confirmed
    response =  render_to_response(
        "user_confirm.html",
        context,
        context_instance=RequestContext(request)
    )
    
    return response


def rb_login(request):
    context = {}
    
    response =  render_to_response(
        "rb_login.html",
        context,
        context_instance=RequestContext(request)
    )
    
    return response

def rb_login_success(request):
    context = {}
    
    response =  render_to_response(
        "rb_login_success.html",
        context,
        context_instance=RequestContext(request)
    )
    
    return response

def request_password_reset(request):
    context = {}
    if request.method == 'POST':
        username = request.POST['username']
        email_addr = request.POST['email']
        (user, password_email) = generatePasswordEmail(username, email_addr)
        if user is not None:
            #user.email_user("Readrboard email confirmation", password_email)
            msg = EmailMessage("ReadrBoard password reset", password_email, "hello@readrboard.com", [user.email])
            msg.content_subtype='html'
            msg.send(False)
            context['requested'] = True
        else:
            context['requested'] = False
            context['message'] = 'Sorry, we don\'t have an account with that user name and/or email address.'
    else:
        # context['message'] = 'Please enter your username'
        context['requested'] = False
        
    response =  render_to_response(
        "password_reset.html",
        context,
        context_instance=RequestContext(request)
    )
    
    return response   

def reset_rb_password(request):
    context = {}
    if request.method == 'GET':
        
        try:
            password_token = request.GET['token']
            user_id = request.GET['uid']
        except KeyError, ke:
            context['message']  = 'There was a problem with your reset token.'
    
        form = ChangePasswordForm(initial={'password_token' : password_token, 'uid' : user_id})
        
    elif request.method == 'POST':
        try:
            password_token = request.POST['password_token']
            user_id = request.POST['uid']
        except KeyError, ke:
            context['message']  = 'There was a problem with your reset token. Please reopen this page from the link in your email.'
            logger.warn(str(ke))
    
        form = ChangePasswordForm(request.POST)
        is_valid_token = validatePasswordToken(user_id, password_token)
        
        if is_valid_token and form.is_valid():
            logger.info("resetting password for " + str(user_id))
            user = form.save(True)            
            context['requested'] = True
    
    context['form'] = form
    
    response =  render_to_response(
        "password_change.html",
        context,
        context_instance=RequestContext(request)
    )
    
    return response

            
@requires_admin
def settings(request, **kwargs):
    context = {}
    group = Group.objects.get(short_name=kwargs['short_name'])
    context['cookie_user'] = kwargs['cookie_user']

    if request.method == 'POST':
        form = GroupForm(request.POST, request.FILES, instance=group)
        if form.is_valid():
            form.save()
    else:
        form = GroupForm(instance=group)

    context['form'] = form
    context['short_name'] = group.short_name
    context['fb_client_id'] = FACEBOOK_APP_ID
    return render_to_response(
        "group_settings.html",
        context,
        context_instance=RequestContext(request)
    )
    
@requires_admin
def admin_approve(request, request_id=None, **kwargs):
    context = {}
    cookie_user = kwargs['cookie_user']
    context['cookie_user'] = cookie_user
    
    groups = cookie_user.social_user.admin_groups()
    
    requests = GroupAdmin.objects.filter(
        group__in=groups,
        approved=False
    ).exclude(social_user=cookie_user.social_user)
    
    if request_id:
        admin_request = requests.get(id=request_id)
        admin_request.approved = True
        admin_request.save()
        requests.exclude(id=request_id)
    
    context['requests'] = requests
    context['fb_client_id'] = FACEBOOK_APP_ID
    return render_to_response(
        "admin_approve.html",
        context,
        context_instance=RequestContext(request)
    )

def admin_request(request, short_name=None):
    context = {}
    context['requested'] = False
    cookie_user = checkCookieToken(request)
    if not cookie_user: return HttpResponseRedirect('/')
    
    # Get the Group and related group admins
    group = Group.objects.get(
        short_name=short_name
    )
    context['group'] = group
    
    # If this is a post request access
    if request.method == 'POST':
        ga = GroupAdmin(
            group = group,
            social_user = cookie_user.social_user,
        )
        ga.save()
    
    # Check if user has already requested admin access
    if cookie_user.social_user.groupadmin_set.filter(group=group):
        context['requested'] = True

    context['fb_client_id'] = FACEBOOK_APP_ID
    return render_to_response(
        "admin_request.html",
        context,
        context_instance=RequestContext(request)
    )

def expander(request, short):
    link_id = base62_decode(short)
    print 'short=', short
    print 'link_id = ', link_id
    # Retrieve Link object
    try:
        link = Link.objects.get(id=link_id)
    except Link.DoesNotExist:
        return HttpResponseRedirect('/')

    # Update usage count
    link.usage_count += 1
    link.save()

    # Retrieve related objects
    interaction = Interaction.objects.get(id=link.interaction.id)
    page = Page.objects.get(id=interaction.page.id)

    # Create redirect response
    url = page.url;
    redirect_response = HttpResponseRedirect(unicode(url))
    
    # Setup cookie for redirect
    redirect_response.set_cookie(key='container_hash', value=smart_str(interaction.container.hash))
    redirect_response.set_cookie(key='location', value=smart_str(interaction.content.location))
    redirect_response.set_cookie(key='content', value=smart_str(interaction.content.body))
    redirect_response.set_cookie(key='reaction', value=smart_str(interaction.interaction_node.body))
    redirect_response.set_cookie(key='referring_int_id', value=smart_str(interaction.id))
    redirect_response.set_cookie(key='content_type', value=smart_str(interaction.content.kind))

    return redirect_response


def interaction_redirect(request, short):
    
    try:
        interaction = Interaction.objects.get(id=short)
    except Interaction.DoesNotExist:
        return HttpResponseRedirect('/')

    page = Page.objects.get(id=interaction.page.id)

    # Create redirect response
    url = page.url;
    redirect_response = HttpResponseRedirect(unicode(url))
    
    # Setup cookie for redirect
    redirect_response.set_cookie(key='container_hash', value=smart_str(interaction.container.hash))
    redirect_response.set_cookie(key='location', value=smart_str(interaction.content.location))
    redirect_response.set_cookie(key='content', value=smart_str(interaction.content.body))
    redirect_response.set_cookie(key='reaction', value=smart_str(interaction.interaction_node.body))
    redirect_response.set_cookie(key='referring_int_id', value=smart_str(interaction.id))
    redirect_response.set_cookie(key='content_type', value=smart_str(interaction.content.kind))

    return redirect_response

def follow_interactions(request, user_id):
    cookie_user = checkCookieToken(request)
    timestamp = datetime.now().date()
    page_num = request.GET.get('page_num', 1)
    context = {
        'fb_client_id': FACEBOOK_APP_ID,
        'user_id': user_id,
        'page_num': page_num,
        'timestamp': timestamp,
        'BASE_URL': BASE_URL
    }

    if cookie_user:
        context['cookie_user'] = cookie_user
        # Look for a better way to do this
    
    owner = User.objects.get(id = user_id)
    context['profile_user'] = owner
    #owner = SocialUser.objects.get(user = django_user)
    requested_types = request.GET.getlist('ftype')
    if len(requested_types) == 0:
        requested_types.append('usr')
    
    follow_objects = Follow.objects.filter(owner = owner, type__in  = requested_types)
    follow_lists = {}
    for type in requested_types:
        follow_lists[type] = []
    for follow in follow_objects:
        follow_lists[follow.type].append(follow.follow_id)
    
    if not follow_lists.has_key('pag'):
        follow_lists['pag'] = [-1]
    if not follow_lists.has_key('grp'):
        follow_lists['grp'] = [-1]
    if not follow_lists.has_key('usr') or len(follow_lists['usr']) == 0 :
        follow_lists['usr'] = [-1]
    
    
    interactions = Interaction.objects.filter(Q(user__id__in = follow_lists['usr']) | 
                        Q(page__id__in = follow_lists['pag']) | 
                        Q(page__site__group__id__in = follow_lists['grp']))
    
    interactions_paginator = Paginator(interactions, 20)
    
    
    try: page_number = int(page_num)
    except ValueError: page_number = 1

    try: current_page = interactions_paginator.page(page_number)
    except (EmptyPage, InvalidPage): current_page = interactions_paginator.page(paginator.num_pages)
    context['current_page'] = current_page
    context['on_follow_page'] = True
    return render_to_response("index.html", context, context_instance=RequestContext(request))


 

