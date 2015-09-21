from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render_to_response, get_object_or_404
from datetime import datetime
from django.db.models import Count, Sum
from django.forms.models import model_to_dict
from django.core import serializers
from django.core.cache import cache, get_cache
from django.template import RequestContext


from antenna.authentication.decorators import requires_admin, requires_admin_super
from antenna.forecast.reporting import report_builder
from antenna.forecast.cassandra.models import *
from antenna.rb.models import *

import logging, json
logger = logging.getLogger('rb.standard')

def group_event_report(request, short_name, year = None, month = None, day = None):

    context = {}
    try:
        group = Group.objects.filter(short_name = short_name)[0]
        if year and month and day:
            report_date = datetime.datetime(year = year, month = month, day = day, hour = 23, minute = 59)
        else:
            report_date = datetime.datetime.now()
            
        latest_report = LegacyGroupEventsReport.objects.filter(group_id = group.id, 
                                                                created_at__gte = report_date - datetime.timedelta(days=7), 
                                                                created_at__lte = report_date)[0]
                                                                
        context['latest_report'] = serializers.serialize('json', latest_report)
    except Group.DoesNotExist, gdne:
        context['error'] = 'No group'
    return render_to_response(
      "group_event_report.html",
      context,
      context_instance=RequestContext(request)
    )
    
    
    
