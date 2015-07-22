from django.core.management.base import BaseCommand, CommandError
from antenna.api import util_functions
from antenna.rb.models import *

import logging, datetime
logger = logging.getLogger('rb.standard')


class Command(BaseCommand):

    def handle(self, *args, **options):
        n = datetime.datetime.now()
        spdd = util_functions.getSinglePageDataDict(int(args[0]))
        conts = []
        for container in spdd['containers']:
            conts.append(container.hash)
        print conts
        t = datetime.datetime.now()
        td = t - n
        print td.total_seconds()
        
        
        n = datetime.datetime.now()
        print util_functions.getKnownUnknownContainerSummaries(int(args[0]),conts, [])
        t = datetime.datetime.now()
        td = t - n
        print td.total_seconds()
        
        
        