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
from cards import Card
from django.utils.encoding import smart_str, smart_unicode
from django.template import RequestContext
from django.forms import ModelForm
from django.forms.models import modelformset_factory

def widget(request,sn):
    # Widget code is retreived from the server using RBGroup shortname
    try:
        rbg = Group.objects.get(short_name = sn)
    except Group.DoesNotExist:
        raise Exception('RB group with this short_name does not exist')
    print BASE_URL
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
    return render_to_response(
      "fblogin.html",
      {'fb_client_id': FACEBOOK_APP_ID,
      'group_name': request.GET['group_name'] },
      context_instance=RequestContext(request)
    )

def xdm_status(request):
    return render_to_response(
      "xdm_status.html",
      {'fb_client_id': FACEBOOK_APP_ID},
      context_instance=RequestContext(request)
    )

def profile(request, user_id, **kwargs):
    cookies = request.COOKIES
    readr_token = cookies.get('readr_token')
    interactions = Interaction.objects.filter(user=user_id).select_related().order_by('-created')
    if 'view' in kwargs:
        view = kwargs['view']
        if view == 'tags': interactions=interactions.filter(kind="tag")
        if view == 'comments': interactions=interactions.filter(kind="com")
        if view == 'shares': interactions=interactions.filter(kind="shr")
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
    return render_to_response("profile.html", context, context_instance=RequestContext(request))

def main(request, user_id=None, short_name=None, **kwargs):
    cookies = request.COOKIES
    #cookie_user_id = cookies.get('user_id')
    context = {
        'fb_client_id': FACEBOOK_APP_ID,
        'user_id': user_id,
        'short_name': short_name,
        'kwargs': kwargs
    }
    """
    if cookie_user_id:
        user = User.objects.get(id=cookie_user_id)
        context['user'] = user
    """
    return render_to_response("index.html", context, context_instance=RequestContext(request))

def interactions(request, user_id=None, short_name=None, **kwargs):
    interactions = Interaction.objects.all()
    if user_id:
        interactions = interactions.filter(user=user_id)
        
    if short_name:
        interactions = interactions.filter(page__site__group__short_name=short_name)
    
    if kwargs and 'view' in kwargs:
        view = kwargs['view']
        if view == 'tags': interactions=interactions.filter(kind="tag")
        if view == 'comments': interactions=interactions.filter(kind="com")
        if view == 'shares': interactions=interactions.filter(kind="shr")
        if view == 'bookmarks': interactions=interactions.filter(kind="bkm")
    
    context = {'interactions': interactions}
        
    return render_to_response("interactions.html", context, context_instance=RequestContext(request))

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

def sidebar(request, user_id=None):
    context = {}
    if user_id:
        user = User.objects.get(id=user_id)
        context['user'] = user
    return render_to_response("sidebar.html", context, context_instance=RequestContext(request))

class GroupForm(ModelForm):
    class Meta:
        model = Group

def settings(request, short_name=None):
    group = Group.objects.get(short_name=short_name)
    if request.method == 'POST':
        form = GroupForm(request.POST)
        if form.is_valid():
            form.save()
            # do something.
    else:
        form = GroupForm(instance=group)
    return render_to_response("testform.html", {
        "form": form,
    })

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
