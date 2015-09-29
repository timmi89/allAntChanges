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
            group_id = int(args[0])
            print group_id
            for x in range(0,30):
                start_date = timezone.now() - datetime.timedelta(days=1 + x)
                end_date = timezone.now() - datetime.timedelta(days=x)
                group  = Group.objects.get(id=group_id)
                
                #start_q = timezone.now()
                group_page_scores(group, start_date, end_date)
            
            
            
            
        except Exception, ex:
            traceback.print_exc(100)