from rb.models import *
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render_to_response, get_object_or_404

def analytics(request, short_name=None):
    return HttpResponse("Test")
