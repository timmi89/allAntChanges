__author__ = 'michael'
from django.core.management.base import BaseCommand, CommandError
from antenna.rb.models import *
from antenna.forecast.cassandra.models import *

import logging, datetime, traceback
logger = logging.getLogger('rb.standard')


class Command(BaseCommand):

    def handle(self, *args, **options):
        try:
            group_id = int(args[0])
            print group_id
    
            group  = Group.objects.get(id=group_id)
            test_map = {'mobile_engaged':'20', 'desktop_engaged':'5', 'widget_engages':'200000'}
            test_map2 = {'mobile_engaged':'200', 'desktop_engaged':'15', 'widget_engages':'200000'}
            created  = datetime.datetime.now()
            test_report = EventsReportTestModel.objects.create(group_id = group.id, created_at = created, report = test_map)
            test_report.save()
            old_created = datetime.datetime.now() - datetime.timedelta(days=45)
            month_ago = datetime.datetime.now() - datetime.timedelta(days=30)
            
            test_report2 = EventsReportTestModel.objects.create(group_id = group.id, created_at = old_created, report = test_map2)
            test_report2.save()
            
            engaged = EventsReportTestModel.objects.filter(group_id = group_id)
            for e in engaged:
                print e
            ordered = EventsReportTestModel.objects.filter(group_id = group_id, created_at__gte= month_ago, created_at__lte=created)
            for o in ordered:
                print o, 'filtered'
        except Exception, ex:
            traceback.print_exc(100)