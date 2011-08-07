from rb.models import *
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render_to_response, get_object_or_404
from datetime import datetime
from django.db.models import Count
from django.core import serializers

def analytics(request, short_name=None):
    group = Group.objects.get(short_name=short_name)
    context = {}
    context['group'] = group
    return render_to_response("analytics.html", context)

def analytics_request(func):
    def wrapper(request, *args, **kwargs):
        params = request.GET
        data = {}
        data['start'] = params.get('start', None)
        data['end'] = params.get('end', None)
        data['max_count'] = params.get('max_count', None)
        return func(request, data, *args, **kwargs)
    return wrapper
    
@analytics_request
def popular(request, data, short_name, **kwargs):
    interactions = Interaction.objects.all()
    group = Group.objects.get(short_name=short_name)
    interactions = interactions.filter(page__site__group=group)
    interacitons = interactions.filter(kind=kwargs['kind'])
    
    if data['start']:
        interactions = interactions.filter(created__gte=datetime.strptime(data['start'], "%m/%d/%y"))
    if data['end']:
        interactions = interactions.filter(created__lte=datetime.strptime(data['end'], "%m/%d/%y"))
    if data['max_count']:
        interactions = interactions[:max_count]
    
    interactions = interactions.order_by('interaction_node').values('interaction_node')
    interactions = interactions.annotate(count=Count('id'))
    
    return HttpResponse(interactions)
    
    
@analytics_request
def active(request, short_name):
    pass

@analytics_request
def recent(request, short_name):
    pass

@analytics_request
def tagged(request, short_name):
    pass

@analytics_request
def frequency(request, short_name):
    pass