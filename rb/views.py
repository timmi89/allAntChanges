#from django.template import Context, loader
from rb.models import *
from django.contrib.auth.models import User
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render_to_response, get_object_or_404
from django.core import serializers
from settings import FACEBOOK_APP_ID
from baseconv import base62
from django.core.paginator import Paginator, InvalidPage, EmptyPage
from django.db.models import Count
from api.utils import *
import random

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
    return render_to_response("profile.html", context)

def home(request, **kwargs):
    cookies = request.COOKIES
    user_id = cookies.get('user_id')
    readr_token = cookies.get('readr_token')
    interactions = Interaction.objects.all().select_related().order_by('-created')
    if 'view' in kwargs:
        view = kwargs['view']
        if view == 'tags': interactions=interactions.filter(kind="tag")
        if view == 'comments': interactions=interactions.filter(kind="com")
        if view == 'shares': interactions=interactions.filter(kind="shr")
    interactions = interactions[:5]

    context = {'interactions': interactions, 'fb_client_id': FACEBOOK_APP_ID}
    if user_id:
        user = User.objects.get(id=user_id)
        context['user'] = user
    return render_to_response("index.html", context)

class Tag:
    def __init__(self, tag, interactions):
        self.tag = tag
        self.interactions = interactions.filter(kind='tag')

        # Randomly pick an interaction to show
        self.interaction = random.choice(interactions)
        self.comments = []
    
    def getComments(self, interactions):
        # Get the comments for the randomly selected interaction on this tag
        self.comments.extend(interactions.filter(parent=self.interaction))

class Card:
    def __init__(self, page, interactions):
        self.page = page
        self.interactions = interactions
        self.tags = self.makeTags()

    def makeTags(self):
        tag_interactions = self.interactions.filter(kind='tag')
        interaction_node_ids = tag_interactions.values_list('interaction_node').distinct()
        interaction_nodes = InteractionNode.objects.filter(id__in=interaction_node_ids)

        # Make tag objects for each tag on the page
        tags = [
            Tag(tag, tag_interactions.filter(interaction_node=tag))
            for tag in interaction_nodes
        ]

        # Get comments for each tag - based upon sample interaction
        [tag.getComments(self.interactions) for tag in tags]

        # Sort tags by number of interactions on page
        tags = sorted(tags, key=lambda x: len(x.interactions), reverse=True)
        return tags

def cards(request):
    # Get interaction set based on filter criteria
    interactions = Interaction.objects.all()

    # Get set of pages -- interactions ordered by -created
    page_ids = interactions.values_list('page')[:10]
    pages = Page.objects.filter(id__in=page_ids)
    pages = pages.select_related('group')

    cards = [Card(page, interactions.filter(page=page)) for page in pages]
    context = {'cards': cards}
    return render_to_response("cards.html", context)

def sidebar(request):
    return render_to_response("sidebar.html")

def expander(request, short):
    link_id = base62.to_decimal(short);
    link = Link.objects.get(id=link_id);
    link.usage_count += 1
    link.save()
    interaction = Interaction.objects.get(id=link.interaction.id)
    page = Page.objects.get(id=interaction.page.id)
    url = page.url;
    return HttpResponseRedirect(unicode(url)+ u"#" + unicode(interaction.id))
