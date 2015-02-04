#from django.template import Context, loader
from models import *
from django.contrib.auth.models import User
from django.http import HttpResponse, HttpResponseRedirect, Http404
from django.shortcuts import render_to_response, get_object_or_404, redirect
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
from view_helpers import *
from django.utils.encoding import smart_str, smart_unicode
from django.template import RequestContext
from django.db.models import Q
from forms import *
from django.forms.models import model_to_dict
from datetime import datetime
from django.contrib.auth.forms import UserCreationForm
from django.core.mail import EmailMessage
from django.views.decorators.cache import cache_page
from django.views.decorators.vary import vary_on_headers
from django import template
from django.utils.safestring import mark_safe
from django.utils import simplejson
# for the page reset thing...  hacky, i know:
from django.core.cache import cache
from chronos.jobs import *
from threading import Thread

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

def home(request):
    cookie_user = checkCookieToken(request)
    context = {
        'fb_client_id': FACEBOOK_APP_ID,
        'BASE_URL': BASE_URL
    }

    if cookie_user:
        context['cookie_user'] = cookie_user

    return render_to_response(
      "home.html",
      context,
      context_instance=RequestContext(request)
    )

def see(request):
    cookie_user = checkCookieToken(request)
    context = {
        'fb_client_id': FACEBOOK_APP_ID,
        'BASE_URL': BASE_URL
    }

    if cookie_user:
        context['cookie_user'] = cookie_user

    return render_to_response(
      "see.html",
      context,
      context_instance=RequestContext(request)
    )
    # return HttpResponseRedirect('/learn/')

def team(request):
    cookie_user = checkCookieToken(request)
    context = {
        'fb_client_id': FACEBOOK_APP_ID,
        'BASE_URL': BASE_URL
    }

    if cookie_user:
        context['cookie_user'] = cookie_user

    return render_to_response(
        "team.html",
        context,
        context_instance=RequestContext(request)
    )

def faq(request):
    cookie_user = checkCookieToken(request)
    context = {
        'fb_client_id': FACEBOOK_APP_ID,
        'BASE_URL': BASE_URL
    }

    if cookie_user:
        context['cookie_user'] = cookie_user

    return render_to_response(
        "faq.html",
        context,
        context_instance=RequestContext(request)
    )

def terms(request):
    cookie_user = checkCookieToken(request)
    context = {
        'fb_client_id': FACEBOOK_APP_ID,
        'BASE_URL': BASE_URL
    }

    if cookie_user:
        context['cookie_user'] = cookie_user

    return render_to_response(
      "terms.html",
      context,
      context_instance=RequestContext(request)
    )

def privacy(request):
    cookie_user = checkCookieToken(request)
    context = {
        'fb_client_id': FACEBOOK_APP_ID,
        'BASE_URL': BASE_URL
    }

    if cookie_user:
        context['cookie_user'] = cookie_user

    return render_to_response(
      "privacy.html",
      context,
      context_instance=RequestContext(request)
    )

def learn(request):
    return HttpResponseRedirect('/')
    # cookie_user = checkCookieToken(request)
    # context = {
    #     'fb_client_id': FACEBOOK_APP_ID,
    #     'BASE_URL': BASE_URL
    # }
    # context['hasSubheader'] = True

    # if cookie_user:
    #     context['cookie_user'] = cookie_user

    # return render_to_response(
    #   "learn.html",
    #   context,
    #   context_instance=RequestContext(request)
    # )
    
    # return HttpResponseRedirect('/')

def retailers(request):
    cookie_user = checkCookieToken(request)
    context = {
        'fb_client_id': FACEBOOK_APP_ID,
        'BASE_URL': BASE_URL
    }
    # context['hasSubheader'] = True

    if cookie_user:
        context['cookie_user'] = cookie_user

    return render_to_response(
      "retailers.html",
      context,
      context_instance=RequestContext(request)
    )

def about(request):
    return redirect('/', permanent=True)

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

def fb_channel(request):
    return render_to_response(
        "fb_channel.html",
        {'fb_client_id': FACEBOOK_APP_ID},
        context_instance=RequestContext(request)
    )

def login(request):
    context = {}
    context['fb_client_id'] = FACEBOOK_APP_ID
    cookie_user = checkCookieToken(request)
    context['cookie_user'] = cookie_user
    if cookie_user and request.META.get('HTTP_REFERER'):
        # return HttpResponseRedirect(request.META['HTTP_REFERER'])
        return request.META.get('HTTP_REFERER', '')
    return render_to_response(
        "login.html",
        context,
        context_instance=RequestContext(request)
    )

#I was getting an error: 'str' object has no attribute 'status_code' .. so I made this to get around it for now.
def friendlylogin(request, **kwargs):
    context = kwargs.get('context', {})
    context['fb_client_id'] = FACEBOOK_APP_ID
    cookie_user = checkCookieToken(request)
    context['cookie_user'] = cookie_user

    return render_to_response(
        "login.html",
        context,
        context_instance=RequestContext(request)
    )

#I was getting an error: 'str' object has no attribute 'status_code' .. so I made this for the wordpress plugin
def friendlylogin_wordpress(request, **kwargs):
    context = kwargs.get('context', {})
    context['fb_client_id'] = FACEBOOK_APP_ID
    cookie_user = checkCookieToken(request)
    context['cookie_user'] = cookie_user

    params = [
        'hostplatform',
        'host_xdm_url',
        'hostdomain',
        'short_name',
        'company_name',
        'group_not_approved',
        'user_not_admin',
        'user_unapproved_admin',
    ];
    for param in params:
        context[param] = request.GET.get(param, "")

    return render_to_response(
        "login_wordpress.html",
        context,
        context_instance=RequestContext(request)
    )

def sites(request):
    pass

def group(request):
    pass


def main(request, user_id=None, short_name=None, site_id=None, page_id=None, interaction_id=None, **kwargs):
    page_num = request.GET.get('page_num', 1)
    context = main_helper(request, user_id, short_name, **kwargs)
    """ For interactions.html """
    interactions = Interaction.objects.all()
    
    interactions.order_by('-rank')
    
    singleton = False;
    # Search interaction node body and content body
    # for instances of the 's' query string parameter
    query_string = request.GET.get('s', None)
    if query_string:
        interactions = interactions.filter(
            Q(interaction_node__body__icontains=query_string) |
            Q(content__body__icontains=query_string) |
            Q(page__site__name__icontains=query_string) |
            Q(page__title__icontains=query_string)
        )
        

    context['query_string'] = query_string

    # Interactions for user profile
    if user_id:
        interactions = user_helper(user_id, interactions, context)
        context['hasSubheader'] = True
    else:
        # If not viewing a user profile, remove bookmarks from interaction set
        interactions = interactions.exclude(kind="bkm")
        if not query_string and not interaction_id:
            interactions = interactions.filter(parent=None)

    # Interactions for group profile
    if short_name:
        interactions = group_helper(short_name, interactions, context)
        context['hasSubheader'] = True
        
    if interaction_id:
        interactions = singleton_helper(interaction_id, interactions, context)
        singleton = True;
    
    # Interactions for specific page
    if site_id:
        interactions = site_helper(site_id, interactions, context)
        
    # Interactions for specific page
    if page_id:
        interactions = page_helper(page_id, interactions, context)
            
    #view filters
    interactions = filter_interactions(interactions, context, **kwargs)

    #interactions.prefetch_related("page").prefetch_related("content").prefetch_related("page__site").prefetch_related("page__site__group")    
    
    paginate_with_children(interactions, page_num, context, query_string)
    

    template = "single_interaction.html" if singleton else "index.html"
    return render_to_response(template, context, context_instance=RequestContext(request))


def board(request, board_id=None, **kwargs):
    cookie_user = checkCookieToken(request)
    timestamp = datetime.now().date()
    page_num = request.GET.get('page_num', 1)
    context = {
        'fb_client_id': FACEBOOK_APP_ID,
        'board_id': board_id,
        'kwargs': kwargs,
        'page_num': page_num,
        'timestamp': timestamp,
        'BASE_URL': BASE_URL
    }

    if cookie_user:
        context['cookie_user'] = cookie_user
        
        #context['board_admins'] = Board.objects.filter(admins__in=[cookie_user]).values_list('admins', flat=True)
        
        
    """ For interactions.html """
    try:
        board = Board.objects.get(id=board_id)
        context['board'] = board
        try:
            social = SocialUser.objects.get(user=board.owner)
            context['social_user'] = model_to_dict(social, fields=('id','full_name', 'img_url'))
        except SocialUser.DoesNotExist:
            logger.warning("Balls")
            
        if cookie_user in board.admins.all():
            context['board_admin'] = True
        else:
            context['board_admin'] = False
    except Board.DoesNotExist:
        raise Http404
    
    interactions = board.interactions.all()
    
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

@requires_admin_wordpress
def wordpress(request, **kwargs):
    context = kwargs.get('context', {})
    
    # urls:
    isNotAdminUrl = '/friendlylogin_wordpress/'+context['qParams']
    hasNotRegisteredUrl = '/signup_wordpress/'+context['qParams']
    wordpressEdit = '/wordpress_edit/'+context['qParams']
    settingsUrl = lambda shortname: '/settings_wordpress/'+shortname+"/"+context['qParams']

    host_xdm_url = kwargs.get('host_xdm_url', None)
    hostdomain = kwargs.get('hostdomain', None)
    cookie_user = kwargs.get('cookie_user', None)
    short_name = context.get('short_name', None)
    true_short_name = context.get('true_short_name', None)
    company_name = context.get('company_name', None)
    group = context.get('hostdomaingroup', None)
    hasRegistered = group != None

    admin_just_approved = kwargs.get('admin_just_approved', False)
    # just to refresh the page
    if admin_just_approved:
        # quick hack - 'requested' has been passed in, so this is actually the 'hasRegisted' url
        return HttpResponseRedirect( hasNotRegisteredUrl )

    if cookie_user:
        if hasRegistered:
            admin_groups = kwargs.get('admin_groups', None)
            if admin_groups and (group in admin_groups):
                if not true_short_name == short_name:
                    return HttpResponseRedirect( wordpressEdit )


                return HttpResponseRedirect( settingsUrl(short_name) )

            else:
                return HttpResponseRedirect(isNotAdminUrl)

        else:
            return HttpResponseRedirect( hasNotRegisteredUrl )

    else:
        return HttpResponseRedirect(isNotAdminUrl)



@requires_admin_wordpress
def create_group_wordpress(request, **kwargs):
    context = kwargs.get('context', {})
    cookie_user = checkCookieToken(request)
    if not cookie_user: return HttpResponseRedirect('/')

    if request.method == 'POST':
        form = CreateGroupForm(request.POST)
        if form.is_valid():
            form.save(
                cookie_user,
                isAutoApproved=True,
                querystring_content=True,
            )
            context['requested'] = True
    else:
        form = CreateGroupForm()
        
    context['form'] = form
    context['fb_client_id'] = FACEBOOK_APP_ID

    return render_to_response(
        "group_create_wordpress.html",
        context,
        context_instance=RequestContext(request)
    )

def wordpress_edit(request):
    context = {}
    context['fb_client_id'] = FACEBOOK_APP_ID
    return render_to_response(
        "wordpress_edit.html",
        context,
        context_instance=RequestContext(request)
    )

def create_board(request):
    context = {}
    context['is_popup'] = request.GET.get('popup')
    context['int_id'] = request.GET.get('int_id')

    cookie_user = checkCookieToken(request)
    if not cookie_user: return HttpResponseRedirect('/')
    
    if request.method == 'POST':
        form = CreateBoardForm(request.POST)
        if form.is_valid():
            try:
                board = form.save(cookie_user)
                context['requested'] = True
                context['board']  = board

            except IntegrityError, e:
                context['title_error']  = 'You already have a board with this name.  Please choose a new name!'

            
    else:
        form = CreateBoardForm()
        
    context['form'] = form
    context['fb_client_id'] = FACEBOOK_APP_ID

    context['user_boards'] = mark_safe(simplejson.dumps(getUserBoardsDict(cookie_user)))
    
    return render_to_response(
        "board_create.html",
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
            
            #user.email_user("Antenna email confirmation", generateConfirmationEmail(user))
            msg = EmailMessage("Antenna email confirmation", generateConfirmationEmail(user), "hello@antenna.is", [user.email])
            msg.content_subtype='html'
            msg.send(False)
            context['requested'] = True
    else:
        form = CreateUserForm()
        
    context['form'] = form
    response =  render_to_response(
        "popup-forms/user_create.html",
        context,
        context_instance=RequestContext(request)
    )
    
    return response

def modify_rb_social_user(request):
    logger.info("modify user")
    context = {}
    cookie_user = checkCookieToken(request)
    if not cookie_user: return HttpResponseRedirect('/ant_login/')
    try:
        social_user = SocialUser.objects.get(user=cookie_user)
        user_token = generateSocialUserToken(social_user)
    except SocialUser.DoesNotExist:
        social_user = None
        context['not_logged_in'] = True
        context['requested'] = True
        return render_to_response(
            "popup-forms/social_user_modify.html",
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
        "popup-forms/social_user_modify.html",
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
        "popup-forms/user_confirm.html",
        context,
        context_instance=RequestContext(request)
    )
    
    return response


def ant_login(request):
    context = {}
    
    response =  render_to_response(
        "popup-forms/ant_login.html",
        context,
        context_instance=RequestContext(request)
    )
    
    return response

def ant_login_success(request):
    context = {}
    
    response =  render_to_response(
        "popup-forms/ant_login_success.html",
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
            msg = EmailMessage("Antenna password reset", password_email, "hello@antenna.is", [user.email])
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
        "popup-forms/password_reset.html",
        context,
        context_instance=RequestContext(request)
    )
    
    return response   

def change_rb_password(request):
    data = {}
    context = {}
    cookie_user = checkCookieToken(request)
    # cookies = request.COOKIES
    # data['user_id'] = cookies.get('user_id', None)
    # data['ant_token'] = cookies.get('ant_token', None)

    if not cookie_user: return HttpResponseRedirect('/')

    if request.method == 'GET':
        form = ChangePasswordWhileLoggedInForm(initial={'uid' : cookie_user.id })

    elif request.method == 'POST':
        try:
            user_id = request.POST['uid']
        except KeyError, ke:
            context['message']  = 'There was a problem with your request.  Looks like you are not logged in.'
            logger.warning(str(ke))
    
        form = ChangePasswordWhileLoggedInForm(request.POST)
        # is_valid_token = validatePasswordToken(user_id, password_token)
        
        if form.is_valid():
            logger.info("resetting password for " + str(user_id))
            user = form.save(True)            
            context['requested'] = True
    

    context['form'] = form
    
    response =  render_to_response(
        "popup-forms/password_change_loggedin.html",
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
            logger.warning(str(ke))
    
        form = ChangePasswordForm(request.POST)
        is_valid_token = validatePasswordToken(user_id, password_token)
        
        if is_valid_token and form.is_valid():
            logger.info("resetting password for " + str(user_id))
            user = form.save(True)            
            context['requested'] = True
    
    context['form'] = form
    
    response =  render_to_response(
        "popup-forms/password_change.html",
        context,
        context_instance=RequestContext(request)
    )
    
    return response

@requires_admin
def settings(request, **kwargs):
    context = kwargs.get('context', {})
    group = Group.objects.get(short_name=kwargs['short_name'])
    context['cookie_user'] = kwargs['cookie_user']
    context['hasSubheader'] = True

    # todo move wordpress stuff
    if request.method == 'POST':
        form = GroupForm(request.POST, request.FILES, instance=group)
        if form.is_valid():
            form.save()
            context['saved'] = True
        else:
            # print form.errors
            pass

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

@requires_admin_wordpress
def settings_wordpress(request, **kwargs):
    context = kwargs.get('context', {})

    group = Group.objects.get(short_name=kwargs['short_name'])
    site = Site.objects.get(group=group.id)

    #not sure why these got lost from @requires_admin_wordpress - figure out later.
    context['cookie_user'] = kwargs['cookie_user']
    context['short_name'] = group.short_name
    # this isn't needed in the template.  If we need it later, figure out why it's getting lost in the decorator
    # context['host_xdm_url'] = '...'
    context['hostdomain'] = site.domain
    context['fb_client_id'] = FACEBOOK_APP_ID
    
    # todo move wordpress stuff
    if request.method == 'POST':
        form = GroupForm(request.POST, request.FILES, instance=group)
        if form.is_valid():
            form.save()
            context['saved'] = True

    else:
        form = GroupForm(instance=group)

    context['form'] = form
    #these come from settings_wordpress now...

    return render_to_response(
        "group_settings_wordpress.html",
        context,
        context_instance=RequestContext(request)
    )

    
@requires_admin
def admin_approve(request, request_id=None, **kwargs):
    context = {}
    cookie_user = kwargs['cookie_user']
    context['cookie_user'] = cookie_user
    context['hasSubheader'] = True
    
    groups = cookie_user.social_user.admin_groups()
    
    requests = GroupAdmin.objects.filter(
        group__in=groups,
        approved=False
    ).exclude(social_user=cookie_user.social_user)
    
    try:
        if request_id:
            admin_request = requests.get(id=request_id)
            admin_request.approved = True
            admin_request.save()
            requests.exclude(id=request_id)
    except Exception, ex:
        pass
    
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

    if interaction.content.kind == 'pag':
        url = interaction.page.url
    elif interaction.parent:
        url = BASE_URL + '/i/' + str(interaction.parent.id)
    else:
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
    redirect_response.set_cookie(key='redirect_type', value=smart_str('/s/'))

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
    redirect_response.set_cookie(key='redirect_type', value=smart_str('/i/'))

    return redirect_response

def click_redirect(request, short):
    
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
    redirect_response.set_cookie(key='redirect_type', value=smart_str('/r/'))
    redirect_response['Referer'] = 'www.antenna.is/r/'
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

    context['hasSubheader'] = True

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


@requires_admin
def group_blocked_tags(request, **kwargs):
    context = kwargs.get('context', {})
    group = Group.objects.get(short_name=kwargs['short_name'])
    context['group'] = group
    context['hasSubheader'] = True
    return render_to_response(
        "group_blocked_tags.html",
        context,
        context_instance=RequestContext(request)
    )


@requires_admin
def group_all_tags(request, **kwargs):
    context = kwargs.get('context', {})
    group = Group.objects.get(short_name=kwargs['short_name'])
    context['group'] = group
    context['hasSubheader'] = True
    
    all_set = set(group.all_tags.all())
    blocked_set = set(group.blocked_tags.all())
    all_unblocked = all_set - blocked_set
    all_promo_unblocked = all_set - set(group.blocked_promo_tags.all())
    
    context['all_unblocked'] = all_unblocked
    context['all_promo_unblocked'] = all_promo_unblocked
    
    return render_to_response(
        "group_all_tags.html",
        context,
        context_instance=RequestContext(request)
    )
 
 

def manage_groups(request, **kwargs):
    context = kwargs.get('context', {})
    cookie_user = checkCookieToken(request)
    if cookie_user:
        if len(SocialUser.objects.filter(user=cookie_user)) == 1:
            admin_groups = cookie_user.social_user.admin_groups()
            if not len(admin_groups) > 0:
                return HttpResponseRedirect('/')
            context['admin_groups'] = admin_groups
            context['cookie_user'] = cookie_user
        else:
            return HttpResponseRedirect('/')
        
    return render_to_response(
        "group_manage.html",
        context,
        context_instance=RequestContext(request)
    )

