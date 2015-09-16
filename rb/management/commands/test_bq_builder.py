__author__ = 'michael'
from django.core.management.base import BaseCommand, CommandError
from antenna.rb.models import *
from antenna.forecast.cassandra.models import *
from antenna.forecast.reporting import prefab_queries

import logging, datetime, traceback
logger = logging.getLogger('rb.standard')


class Command(BaseCommand):

    def handle(self, *args, **options):
        try:
            group_id = int(args[0])
            
            group  = Group.objects.get(id=group_id)
            print group
            start_date = datetime.datetime.now() - datetime.timedelta(days=30)
            end_date = datetime.datetime.now()
            """
            print datetime.datetime.now()
            mob_lts_rows = prefab_queries.get_mobile_lts(group, start_date, end_date)
            for r in mob_lts_rows:
                print r
            print datetime.datetime.now()
            mob_eng_rows = prefab_queries.get_mobile_engagement(group, start_date, end_date)
            for r in mob_eng_rows:
                print r
            print datetime.datetime.now()
            dsk_lts_rows = prefab_queries.get_desktop_lts(group, start_date, end_date)
            for r in dsk_lts_rows:
                print r
            print datetime.datetime.now()
            dsk_eng_rows = prefab_queries.get_desktop_engagement(group, start_date, end_date)
            for r in dsk_eng_rows:
                print r
            print datetime.datetime.now()
            """
            #pops = prefab_queries.get_popular_reactions(group, start_date, end_date)
            #for p in pops:
            #    print p
            
            print datetime.datetime.now()
            counter = 0
            (reactions_rows, react_views_rows, page_views_rows) = prefab_queries.rough_score(group, start_date, end_date)
            for row in reactions_rows:
                counter += 1
                #print 'page',row['f'][0]['v'],'reactions',row['f'][1]['v']
            for row in react_views_rows:
                counter += 1
                #print 'page:',row['f'][0]['v'],'reaction views',row['f'][1]['v']
            for row in page_views_rows:
                counter += 1
                #print 'page:',row['f'][0]['v'],'views:',row['f'][1]['v']    
            print datetime.datetime.now()
            print counter
        except Exception, ex:
            traceback.print_exc(100)