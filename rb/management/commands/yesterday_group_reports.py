__author__ = 'michael'
from django.core.management.base import BaseCommand, CommandError
from antenna.rb.models import *
from antenna.forecast.cassandra.models import *
from antenna.forecast.reporting.tasks import *
from django.utils import timezone
import logging, datetime, traceback
logger = logging.getLogger('rb.standard')


class Command(BaseCommand):

    def handle(self, *args, **options):
        try:
            if len(args) > 0:
                gids = []
                for arg in args:
                    print arg
                    gids.append(int(arg))
                groups = Group.objects.filter(activated = True, approved = True, id__in = gids)
                for group in groups:
                    print group
                    
            else:
                groups = Group.objects.filter(activated = True, approved = True)
                
            from_date = timezone.now()
            from_date.replace(hour=0,minute=0,second=0, microsecond = 0)
            for group in groups:
                print 'Starting yesterday group report for: ', group
                start_date = from_date - datetime.timedelta(days=1)
                end_date = from_date
                try:
                    group_page_scores(group, start_date, end_date)
                except Exception, ex:
                    traceback.print_exc(50)
                    print 'Exception for group: ', group
            
            
            
        except Exception, ex:
            traceback.print_exc(100)
