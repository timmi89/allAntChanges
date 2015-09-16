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
            """
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
            """
            
            
            
            start_q = datetime.datetime.now()
            """
            (reactions_rows, react_views_rows, page_views_rows) = prefab_queries.rough_score(group, start_date, end_date)
            
            page_scores = {}
            for row in page_views_rows:
                page_scores[row['f'][0]['v']] = {}
                page_scores[row['f'][0]['v']]['page_views'] = row['f'][1]['v']
                page_scores[row['f'][0]['v']]['reactions'] = 0
                page_scores[row['f'][0]['v']]['reaction_views'] = 0
                page_scores[row['f'][0]['v']]['DataMissing'] = False
                #print 'page:',row['f'][0]['v'],'views:',row['f'][1]['v']    
            for row in reactions_rows:
                if not page_scores.has_key(row['f'][0]['v']):
                    page_scores[row['f'][0]['v']] = {}
                    page_scores[row['f'][0]['v']]['page_views'] = -1
                    page_scores[row['f'][0]['v']]['reaction_views'] = 0
                    page_scores[row['f'][0]['v']]['DataMissing'] = True
                page_scores[row['f'][0]['v']]['reactions'] = row['f'][1]['v']
                
                #print 'page',row['f'][0]['v'],'reactions',row['f'][1]['v']
            for row in react_views_rows:
                if not page_scores.has_key(row['f'][0]['v']):
                    page_scores[row['f'][0]['v']] = {}
                    page_scores[row['f'][0]['v']]['page_views'] = -1
                    page_scores[row['f'][0]['v']]['reactions'] = 0
                    page_scores[row['f'][0]['v']]['DataMissing'] = True   
                page_scores[row['f'][0]['v']]['reaction_views'] = row['f'][1]['v']
                #print 'page:',row['f'][0]['v'],'reaction views',row['f'][1]['v']
            
            big_list = []
            for (k,v) in page_scores.items():
                score = (int(v['reactions']) * 10 + int(v['reaction_views'])) / float(v['page_views'])
                v['score'] = score
                v['page_id'] = k 
                big_list.append(v)
            big_list.sort(key = lambda ps:ps['score'])
            big_list.reverse()
            for x in range(0,50):
                print big_list[x]
            print datetime.datetime.now() - start_q
            """
            
            """
            big_list = []
            joined_rows = prefab_queries.rough_score_joined(group, start_date, end_date)
            """
            """
            for row in joined_rows:
                #print row #{u'f': [{u'v': u'793727'}, {u'v': u'8'}, {u'v': None}, {u'v': None}]}
                page_id = int(row['f'][0]['v'])
                page_views = float(row['f'][1]['v'])
                reaction_views = float(row['f'][2]['v']) if row['f'][2]['v'] else 0
                reactions = float(row['f'][3]['v']) if row['f'][3]['v'] else 0
                score = (reactions * 10 + reaction_views) / page_views
                #print 'SCORE:' , score, '\n', row #{u'f': [{u'v': u'793727'}, {u'v': u'8'}, {u'v': None}, {u'v': None}]}
                page_score_data = {'page_id':page_id, 'page_views':page_views,'reaction_views':reaction_views, 'reactions' : reactions, 'score' : score     }  
                big_list.append(page_score_data)
            big_list.sort(key = lambda psd:psd['score'])
            big_list.reverse()
            """
            """
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
            
            GroupPageScores.objects.create(group_id = group.id,created_at = datetime.datetime.now(), 
                                           scores = gpm_scores, reactions = gpm_reacts, reaction_views = gpm_rviews, page_views = gpm_views) 
            
            """
            q_start = datetime.datetime.now()
            
            group_page_scores = GroupPageScores.objects.filter(group_id = group.id, created_at__gte = q_start - datetime.timedelta(days=1), created_at__lte = q_start)
            for gps in group_page_scores:
                print len(gps.page_views.keys())
            
                #page_score = PageScore.objects.create(group_id = group.id, page_id = int(row['f'][0]['v']), created_at = datetime.datetime.now())
                
                #page_score.save()    
            print datetime.datetime.now() - start_q
            
            
        except Exception, ex:
            traceback.print_exc(100)