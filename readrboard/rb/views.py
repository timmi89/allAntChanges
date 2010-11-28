#from django.template import Context, loader
#from rb.models import Node
from django.http import HttpResponse
<<<<<<< HEAD:readrboard/rb/views.py
from django.shortcuts import render_to_response
=======
>>>>>>> 85cf3579d8b7dcc7e8987d7dffb93cc008c98403:readrboard/rb/views.py

def index(request):
    return HttpResponse("index")

def detail(request, node_id):
    return HttpResponse("You're looking at node %s." % node_id)

<<<<<<< HEAD:readrboard/rb/views.py
def search_form(request):
    return render_to_response('search_form.html')

def search(request):
    if request.GET['q']:
        message = 'You searched for: %s' % request.GET['q']
    else:
        message = 'You submitted an empty form.'
    return HttpResponse(message)

=======
>>>>>>> 85cf3579d8b7dcc7e8987d7dffb93cc008c98403:readrboard/rb/views.py
def display_meta(request):
    values = request.META.items()
    values.sort()
    html = []
    for k, v in values:
        html.append('<tr><td>%s</td><td>%s</td></tr>' % (k, v))
    return HttpResponse('<table>%s</table>' % '\n'.join(html))
