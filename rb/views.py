#from django.template import Context, loader
from rb.models import *
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render_to_response, get_object_or_404
from django.core import serializers
from settings import FACEBOOK_APP_ID
from baseconv import base62
from django.utils import simplejson
from django.core import serializers
from django.forms.models import model_to_dict


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
    
def settings(request, group=1):
    host = request.get_host()
    # Slice off port from hostname
    host = host[0:host.find(":")]
    path = request.path
    fp = request.get_full_path()
    if group:
        group = int(group)
        try:
            g = Group.objects.get(id=group)
        except Group.DoesNotExist:
            return HttpResponse("RB Group does not exist!")
            
        if host in g.valid_domains:
            print "host %s is valid for group %d" % (host,group)
        else:
            print "host %s is not valid for group %d" % (host,group)
        
        #model_to_dict(intance, fields=[], exclude=[])
        d = model_to_dict(g)
        for feature in ('rate', 'share', 'search', 'comment', 'bookmark'):
            d[feature] = model_to_dict(Feature.objects.get(id=d[feature]))
        settings = simplejson.dumps([{"settings": d}], sort_keys=True, indent=4);
        #settings = serializers.serialize("json", [g], sort_keys=True, indent=4)
        return HttpResponse(settings, mimetype='application/json')
    else:
        return HttpResponse("Group not specified")
    
def expander(request, short):
    link_id = base62.to_decimal(short);
    link = Link.objects.get(id=link_id);
    link.usage_count += 1
    link.save()
    interaction = Interaction.objects.get(id=link.interaction.id)
    page = Page.objects.get(id=interaction.page.id)
    url = page.url;
    return HttpResponseRedirect(unicode(url)+ u"#" + unicode(interaction.id))

"""
def index(request):
    return HttpResponse("index")

def detail(request, node_id):
    return HttpResponse("You're looking at node %s." % node_id)

#extra test added by eric
def tag_detail(request, tag_id):
	tag = get_object_or_404(Tag, pk=tag_id)
	return render_to_response('main/tag.html', {"tag": tag})

def search_form(request):
    return render_to_response('search_form.html')

def search(request):
    if request.GET['q']:
        message = 'You searched for: %s' % request.GET['q']
    else:
        message = 'You submitted an empty form.'
    return HttpResponse(message)

def display_meta(request):
    values = request.META.items()
    values.sort()
    html = []
    for k, v in values:
        html.append('<tr><td>%s</td><td>%s</td></tr>' % (k, v))
    return HttpResponse('<table>%s</table>' % '\n'.join(html))

def json_content_node(request):
    objects = ContentNode.objects.all()
    js = serializers.get_serializer("json")()
    serialized = js.serialize(objects, ensure_ascii=False)
    return HttpResponse(serialized)

def json_users(request):
    objects = ReadrUser.objects.all()
    js = serializers.get_serializer("json")()
    serialized = js.serialize(objects, ensure_ascii=False)
    return HttpResponse(serialized)

def send(request):
    print request.GET
    return HttpResponse(request.GET)
"""
