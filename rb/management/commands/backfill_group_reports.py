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
            groups = Group.objects.filter(activated = True, approved = True)
            for group in groups:
                for x in range(1,60):
                    start_date = timezone.now() - datetime.timedelta(days=1 + x)
                    end_date = timezone.now() - datetime.timedelta(days=x)
                    try:
                        group_page_scores(group, start_date, end_date)
                    except Exception, ex:
                        traceback.print_exc(50)
                        print 'Exception for group: ', group
            
            
            
        except Exception, ex:
            traceback.print_exc(100)
