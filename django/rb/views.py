#from django.template import Context, loader
#from rb.models import Node
from django.http import HttpResponse


def index(request):
    return HttpResponse("index")

def detail(request, node_id):
    return HttpResponse("You're looking at node %s." % node_id)
