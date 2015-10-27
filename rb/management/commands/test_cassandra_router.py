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
            print group_id
            start_date = datetime.datetime.now() - datetime.timedelta(days=30)
            end_date = datetime.datetime.now()
            group  = Group.objects.get(id=group_id)
            
            start_q = datetime.datetime.now()
            
            big_list = []
            mobile_joined_rows = prefab_queries.rough_score_joined(group, start_date, end_date, True)
            gpm_views = {}
            gpm_rviews = {}
            gpm_reacts = {}
            gpm_scores = {}
            
            for row in mobile_joined_rows:
                page_id = int(row['f'][0]['v'])
                page_views = float(row['f'][1]['v'])
                reaction_views = float(row['f'][2]['v']) if row['f'][2]['v'] else 0
                reactions = float(row['f'][3]['v']) if row['f'][3]['v'] else 0
                score = (reactions * 10 + reaction_views) / page_views
                gpm_scores[page_id] = score
                gpm_views[page_id] = page_views
                gpm_rviews[page_id] = reaction_views
                gpm_reacts[page_id] = reactions
            
            GroupPageScores.objects.create(group_id = group.id,created_at = datetime.datetime.now(), mobile = True,
                                           scores = gpm_scores, reactions = gpm_reacts, reaction_views = gpm_rviews, page_views = gpm_views) 
            
            
            
            big_list = []
            joined_rows = prefab_queries.rough_score_joined(group, start_date, end_date, False)
            gpm_views = {}
            gpm_rviews = {}
            gpm_reacts = {}
            gpm_scores = {}
            
            for row in joined_rows:
                page_id = int(row['f'][0]['v'])
                page_views = float(row['f'][1]['v'])
                reaction_views = float(row['f'][2]['v']) if row['f'][2]['v'] else 0
                reactions = float(row['f'][3]['v']) if row['f'][3]['v'] else 0
                score = (reactions * 10 + reaction_views) / page_views
                gpm_scores[page_id] = score
                gpm_views[page_id] = page_views
                gpm_rviews[page_id] = reaction_views
                gpm_reacts[page_id] = reactions
            
            GroupPageScores.objects.create(group_id = group.id,created_at = datetime.datetime.now(), mobile = False,
                                           scores = gpm_scores, reactions = gpm_reacts, reaction_views = gpm_rviews, page_views = gpm_views) 
            
            
            
            q_start = datetime.datetime.now()
            
            group_page_scores = GroupPageScores.objects.filter(group_id = group.id, mobile = True, 
                                                               created_at__gte = q_start - datetime.timedelta(days=1), created_at__lte = q_start)
            for gps in group_page_scores:
                print 'MOBILE: ', len(gps.page_views.keys())
            
            group_page_scores = GroupPageScores.objects.filter(group_id = group.id, mobile = False, 
                                                               created_at__gte = q_start - datetime.timedelta(days=1), created_at__lte = q_start)
            for gps in group_page_scores:
                print 'DESKTOP: ', len(gps.page_views.keys())
            
                #page_score = PageScore.objects.create(group_id = group.id, page_id = int(row['f'][0]['v']), created_at = datetime.datetime.now())
                
                #page_score.save()    
            print datetime.datetime.now() - start_q
            
            
        except Exception, ex:
            traceback.print_exc(100)