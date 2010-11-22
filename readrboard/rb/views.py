#from django.template import Context, loader
#from rb.models import Node
from django.http import HttpResponse

def index(request):
    return HttpResponse("index")

def detail(request, node_id):
    return HttpResponse("You're looking at node %s." % node_id)

def display_meta(request):
    values = request.META.items()
    values.sort()
    html = []
    for k, v in values:
        html.append('<tr><td>%s</td><td>%s</td></tr>' % (k, v))
    return HttpResponse('<table>%s</table>' % '\n'.join(html))
