#from django.template import Context, loader
from rb.models import *
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render_to_response, get_object_or_404
from django.core import serializers

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

def widget(request,sn):
    try:
        rbg = RBGroup.objects.get(short_name = sn)
    except:
        raise Exception('short_name not unique, this sucks')
    return render_to_response("widget.js",{'group_id': rbg.id, 'short_name' : sn,})

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
