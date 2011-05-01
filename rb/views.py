#from django.template import Context, loader
from rb.models import *
from django.contrib.auth.models import User
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render_to_response, get_object_or_404
from django.core import serializers
from settings import FACEBOOK_APP_ID
from baseconv import base62
from django.core.paginator import Paginator, InvalidPage, EmptyPage

def widget(request,sn):
    # Widget code is retreived from the server using RBGroup shortname
    try:
        rbg = Group.objects.get(short_name = sn)
    except:
        raise Exception('RB group with this short_name does not exist')
    return render_to_response("widget.js",{'group_id': rbg.id, 'short_name' : sn}, mimetype = 'application/javascript')

def fb(request):
    return render_to_response("facebook.html",{'fb_client_id': FACEBOOK_APP_ID})

def fblogin(request):
    return render_to_response("fblogin.html",{'fb_client_id': FACEBOOK_APP_ID})

def xdm_status(request):
    return render_to_response("xdm_status.html",{'fb_client_id': FACEBOOK_APP_ID})

def profile(request, user_id, **kwargs):
    cookies = request.COOKIES
    readr_token = cookies.get('readr_token')
    interactions = Interaction.objects.filter(user=user_id).select_related().order_by('-created')
    if 'view' in kwargs:
        view = kwargs['view']
        if view == 'tags': interactions=interactions.filter(interaction_node__kind="tag")
        if view == 'comments': interactions=interactions.filter(interaction_node__kind="com")
        if view == 'shares': interactions=interactions.filter(interaction_node__kind="shr")
    paginator = Paginator(interactions, 5)

    try:
        page = int(request.GET.get('page', '1'))
    except ValueError:
        page = 1

    try:
        interaction_page = paginator.page(page)
    except (EmptyPage, InvalidPage):
        interaction_page = paginator.page(paginator.num_pages)

    context = {'interactions': interaction_page, 'fb_client_id': FACEBOOK_APP_ID}

    if user_id:
        user = User.objects.get(id=user_id)
        context['user'] = user
    elif cookies.get('user_id'):
        user_id = cookies.get('user_id')
        user = User.objects.get(id=user_id)
        context['user'] = user
    return render_to_response("profile.html", context)

def home(request, **kwargs):
    cookies = request.COOKIES
    user_id = cookies.get('user_id')
    readr_token = cookies.get('readr_token')
    interactions = Interaction.objects.all().select_related().order_by('-created')
    if 'view' in kwargs:
        view = kwargs['view']
        if view == 'tags': interactions=interactions.filter(interaction_node__kind="tag")
        if view == 'comments': interactions=interactions.filter(interaction_node__kind="com")
        if view == 'shares': interactions=interactions.filter(interaction_node__kind="shr")
    interactions = interactions[:5]

    context = {'interactions': interactions, 'fb_client_id': FACEBOOK_APP_ID}
    if user_id:
        user = User.objects.get(id=user_id)
        context['user'] = user
    return render_to_response("index.html", context)

def expander(request, short):
    link_id = base62.to_decimal(short);
    link = Link.objects.get(id=link_id);
    link.usage_count += 1
    link.save()
    interaction = Interaction.objects.get(id=link.interaction.id)
    page = Page.objects.get(id=interaction.page.id)
    url = page.url;
    return HttpResponseRedirect(unicode(url)+ u"#" + unicode(interaction.id))
