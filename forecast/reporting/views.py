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
        group = Group.objects.filter(short_name = short_name)[0]
        if year and month and day:
            report_date = datetime.datetime(year = year, month = month, day = day, hour = 23, minute = 59)
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
                                                                
        #context['latest_reports'] = mobile_latest_reports
        #context['mlrs'] = mobile_latest_reports
        #context['dlrs'] = desktop_latest_reports
        #print len(desktop_latest_reports)
        mobile  = utils.aggregate_reports(mobile_latest_reports, 20)
        desktop = utils.aggregate_reports(desktop_latest_reports, 20)
        #print 'JSON:', utils.aggregate_reports(desktop_latest_reports, 20)
        merged = utils.merge_desktop_mobile(desktop, mobile, 20)

        # daily_activity = {};

        # for day in desktop['dailies']:
            # print day['report_start'].strftime("%m/%d/%Y")
        
        
        context['aggregate_data'] = json.dumps(merged, cls=utils.DatetimeEncoder)
        context['dailies'] = merged['dailies']
        print context['dailies']
        context['totals'] = merged['totals']

    except Group.DoesNotExist, gdne:
        context['error'] = 'No group'
    return render_to_response(
      "group_event_report.html",
      context,
      context_instance=RequestContext(request)
    )
    
    
    
