from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render_to_response, get_object_or_404
from django.utils import timezone
from datetime import datetime
from django.db.models import Count, Sum
from django.forms.models import model_to_dict
from django.core import serializers
from django.core.cache import cache, get_cache
from django.template import RequestContext


from antenna.authentication.decorators import requires_admin, requires_admin_super
from antenna.forecast.reporting import report_builder, utils
from antenna.forecast.cassandra.models import *
from antenna.rb.models import *

import logging, json
logger = logging.getLogger('rb.standard')

def group_event_report(request, short_name, year = None, month = None, day = None):

    context = {}
    try:
        
        merged = get_merged_report_json(short_name, year, month, day)
        context['group'] = Group.objects.get(short_name=short_name)
                
        context['aggregate_data'] = json.dumps(merged, cls=utils.DatetimeEncoder)
        context['dailies'] = merged['dailies']
        context['totals'] = merged['totals']
        context['sorted_tag_cloud'] = merged['sorted_tag_cloud']
        context['sorted_content'] = merged['sorted_content']
        context['sorted_pages'] = merged['sorted_pages']

        if (year and month and day ):
            context['selected_date'] = month + "/" + day + "/" + year
        else:
            context['selected_date'] = "Today"
        
    except Group.DoesNotExist, gdne:
        context['error'] = 'No group'
    return render_to_response(
      "group_event_report.html",
      context,
      context_instance=RequestContext(request)
    )
    
def weekly_group_event_email(request, short_name, year = None, month = None, day = None):

    context = {}
    try:
        
        merged = get_merged_report_json(short_name, int(year), int(month), int(day))

        context['dailies'] = merged['dailies']
        context['totals'] = merged['totals']
        context['sorted_tag_cloud'] = merged['sorted_tag_cloud']
        context['group'] = group
        context['sorted_content'] = merged['sorted_content']
        context['sorted_pages'] = merged['sorted_pages']
        
    except Group.DoesNotExist, gdne:
        context['error'] = 'No group'
    return render_to_response(
      "weekly_group_event_email.html",
      context,
      context_instance=RequestContext(request)
    )
    
    
    
    
def get_merged_report_json(short_name, year = None, month = None, day = None):    
    group = Group.objects.filter(short_name = short_name)[0]
    print year
    print month
    print day
    if year and month and day:
        report_date = datetime.datetime(year = int(year), month = int(month), day = int(day), hour = 23, minute = 59)
    else:
        report_date = timezone.now()# - datetime.timedelta(days=120)
        
    mobile_latest_reports = LegacyGroupEventsReport.objects.filter(group_id = group.id, mobile = True, 
                                                            report_start__gte = report_date - datetime.timedelta(days=31), 
                                                            report_start__lte = report_date,
                                                            report_end__gte = report_date - datetime.timedelta(days=31), 
                                                            report_end__lte = report_date)
    desktop_latest_reports = LegacyGroupEventsReport.objects.filter(group_id = group.id, mobile = False, 
                                                            report_start__gte = report_date - datetime.timedelta(days=31), 
                                                            report_start__lte = report_date,
                                                            report_end__gte = report_date - datetime.timedelta(days=31), 
                                                            report_end__lte = report_date)
                                                            

    mobile  = utils.aggregate_reports(mobile_latest_reports, 20)
    desktop = utils.aggregate_reports(desktop_latest_reports, 20)
    merged = utils.merge_desktop_mobile(desktop, mobile, 20)
    merged['group_id'] = group.id
    merged['group_short_name'] = group.short_name
    
    return merged
