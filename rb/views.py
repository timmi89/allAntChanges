#from django.template import Context, loader
from rb.models import *
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render_to_response, get_object_or_404
from django.core import serializers
from settings import FACEBOOK_APP_ID
from baseconv import base62

def widget(request,sn):
    # Widget code is retreived from the server using RBGroup shortname
    try:
        rbg = Group.objects.get(short_name = sn)
    except:
        raise Exception('RB group with this short_name does not exist')
    return render_to_response("widget.js",{'group_id': rbg.id, 'short_name' : sn}, mimetype = 'application/javascript')

def fb(request):
    # Widget code is retreived from the server using RBGroup shortname
    return render_to_response("facebook.html",{'fb_client_id': FACEBOOK_APP_ID})

def fblogin(request):
    # Widget code is retreived from the server using RBGroup shortname
    return render_to_response("fblogin.html",{'fb_client_id': FACEBOOK_APP_ID})

def expander(request, short):
    link_id = base62.to_decimal(short);
    link = Link.objects.get(id=link_id);
    link.usage_count += 1
    link.save()
    interaction = Interaction.objects.get(id=link.interaction.id)
    page = Page.objects.get(id=interaction.page.id)
    url = page.url;
    return HttpResponseRedirect(unicode(url)+ u"#" + unicode(interaction.id))
