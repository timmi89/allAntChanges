import settings
from django.utils import timezone 
from antenna.rb.models import * 
from antenna.forecast.cassandra.models import *
from antenna.forecast.reporting import prefab_queries
import datetime, traceback
import logging
logger = logging.getLogger('rb.standard')

class GroupEventsReportBuilder(object):
    def __init__(self, group, mobile, start_date, end_date, depth = 50):
        self.group = group
        self.mobile = mobile
        self.start_date = start_date
        self.end_date = end_date
        self.depth = depth
        
    def build(self):
        #get  GroupPageScores for dates
        logger.warn('BUILDING REPORT FROM GPS ' +str( self.mobile ) + ' ' + str(self.start_date) + ' ' + str(self.end_date))
        group_page_scores = GroupPageScores.objects.filter(group_id = self.group.id, mobile = self.mobile, 
                                                           report_start__gte = self.start_date - datetime.timedelta(hours=12), report_start__lte = self.start_date + datetime.timedelta(hours=12),
                                                           report_end__gte = self.end_date  - datetime.timedelta(hours=12), report_end__lte = self.end_date + datetime.timedelta(hours=12))
        group_page_scores.order_by('-created_at')  #maybe unnecessary?
        for g in group_page_scores:
            print g.created_at
            
        gps = group_page_scores[0]
        print len( gps.scores.items())
        sorted_pages_by_scores = gps.scores.items()
        sorted_pages_by_scores.sort(key = lambda entry : entry[1])
        #sort pages by page scores, cut to depth
        if len(sorted_pages_by_scores) > self.depth:
            top_x = sorted_pages_by_scores[0:self.depth]
        else:
            top_x = sorted_pages_by_scores
            
        pop_content = {}
        pop_reactions = {}
        count_map = {}
        sorted_page_ids = []
        logger.warn('TOPX: ' + str(self.depth))
        for (page_id, score) in top_x:
            try:
                page = Page.objects.get(id = page_id)
                sorted_page_ids.append(page_id)
                
                count_map[str(page_id) + '_score'] = score
                count_map[str(page_id) + '_pageviews'] = gps.page_views[page_id]
                count_map[str(page_id) + '_reactions'] = gps.reaction_views[page_id]
                
                pop_page_interactions = page.tags().filter(created__gte = self.start_date, created__lte = self.end_date)
                for ppi in pop_page_interactions:
                    pop_content[ppi.content.id]    = ppi.content.body
                    pop_reactions[ppi.id]          = ppi.interaction_node.body
            except Exception, ex:
                logger.warn('ERROR generating GERB data for page: ' + str(page_id))
                logger.warn(traceback.format_exc(50))
        #top level metrics
        uniques = -1
        engagement = -1
        if self.mobile:
            uniques = prefab_queries.get_mobile_lts(self.group, self.start_date, self.end_date)['f'][0]['v'][0]
            engagement = prefab_queries.get_mobile_engagement(self.group, self.start_date, self.end_date)['f'][0]['v'][0]
        else:
            uniques = prefab_queries.get_desktop_lts(self.group, self.start_date, self.end_date)['f'][0]['v'][0] 
            engagement = prefab_queries.get_desktop_engagement(self.group, self.start_date, self.end_date)['f'][0]['v'][0]
            
        count_map['uniques'] = uniques
        count_map['engagement'] = engagement
        logger.info('Saving report')
        report = LegacyGroupEventsReport.objects.create(group_id = self.group.id, 
                                                        created_at = timezone.now(),
                                                        report_start = self.start_date,
                                                        report_end = self.end_date,
                                                        mobile = self.mobile, 
                                                        count_map = count_map, 
                                                        sorted_pages = sorted_page_ids,
                                                        pop_content = pop_content,
                                                        pop_reactions = pop_reactions)
        report.save()
        
        
            
 