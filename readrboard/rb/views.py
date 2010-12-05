#from django.template import Context, loader
#from rb.models import Node
from django.http import HttpResponse
from django.shortcuts import render_to_response


def index(request):
    return HttpResponse("index")

def detail(request, node_id):
    return HttpResponse("You're looking at node %s." % node_id)

def tag_detail(request, tag_id):
    return HttpResponse("You're looking at tag %s." % tag_id)

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
