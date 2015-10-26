import settings
from django.utils import timezone 
from antenna.rb.models import * 
from antenna.forecast.cassandra.models import *
from antenna.forecast.reporting import prefab_queries
import datetime, traceback
import logging
logger = logging.getLogger('rb.standard')

class GroupEventsReportBuilder(object):
    def __init__(self, group, mobile, start_date, end_date, depth = 50, group_page_score = None):
        self.group = group
        self.mobile = mobile
        self.start_date = start_date
        self.end_date = end_date
        self.depth = depth
        self.group_page_score = group_page_score
        
    def build(self):
        #get  GroupPageScores for dates
        logger.warn('BUILDING REPORT FROM GPS ' +str( self.mobile ) + ' ' + str(self.start_date) + ' ' + str(self.end_date))
        if self.group_page_score:
            gps = self.group_page_score
        else:
            group_page_scores = GroupPageScores.objects.filter(group_id = self.group.id, mobile = self.mobile, 
                                                               report_start__gte = self.start_date - datetime.timedelta(hours=12), 
                                                               report_start__lte = self.start_date + datetime.timedelta(hours=12),
                                                               report_end__gte = self.end_date  - datetime.timedelta(hours=12), 
                                                               report_end__lte = self.end_date + datetime.timedelta(hours=12))
            group_page_scores.order_by('-created_at')  #maybe unnecessary?
            gps = group_page_scores[0]
            
        sorted_pages_by_scores = gps.scores.items()
        sorted_pages_by_scores.sort(key = lambda entry : entry[1])
        #sort pages by page scores, cut to depth
        sorted_pages_by_scores.reverse()
        if len(sorted_pages_by_scores) > self.depth:
            top_x = sorted_pages_by_scores[0:self.depth]
        else:
            top_x = sorted_pages_by_scores
            
        pop_content = {}
        pop_content_type = {}
        content_page = {}
        pop_reactions = {}
        reaction_page = {}
        count_map = {}
        sorted_page_ids = []
        logger.warn('TOPX: ' + str(self.depth))
        for (page_id, score) in top_x:
            try:
                page = Page.objects.get(id = page_id)
                sorted_page_ids.append(page_id)
                
                count_map[str(page_id) + '_score'] = score
                count_map[str(page_id) + '_pageviews'] = gps.page_views[page_id]
                count_map[str(page_id) + '_reaction_views'] = gps.reaction_views[page_id]
                count_map[str(page_id) + '_reactions'] = gps.reactions[page_id]
                
                pop_page_interactions = page.tags().filter(created__gte = self.start_date, created__lte = self.end_date)
                #print page, len(pop_page_interactions), score
                for ppi in pop_page_interactions:
                    pop_content[ppi.content.id]         = ppi.content.body
                    pop_content_type[ppi.content.id]    = ppi.content.kind
                    content_page[ppi.content.id]        = ppi.page.id
                    pop_reactions[ppi.id]               = ppi.interaction_node.body
                    reaction_page[ppi.id]               = ppi.page.id
            except Exception, ex:
                logger.warn('ERROR generating GERB data for page: ' + str(page_id))
                logger.warn(traceback.format_exc(50))
        #top level metrics
        uniques = -1
        engagement = -1
        total_page_views = -1
        total_reaction_views = -1
        total_reactions = -1
        
        if self.mobile:
            uniques = prefab_queries.get_mobile_lts(self.group, self.start_date, self.end_date)['f'][0]['v'][0]
            engagement = prefab_queries.get_mobile_engagement(self.group, self.start_date, self.end_date)['f'][0]['v'][0]
        else:
            uniques = prefab_queries.get_desktop_lts(self.group, self.start_date, self.end_date)['f'][0]['v'][0] 
            engagement = prefab_queries.get_desktop_engagement(self.group, self.start_date, self.end_date)['f'][0]['v'][0]
        #STUFF ABOVE HERE NEEDS BIG REFACTOR
        total_page_views, total_reaction_views, total_reactions = prefab_queries.aggregate_counts(self.group, self.start_date, self.end_date, self.mobile)
        tag_cloud = {}
        tag_cloud_rows = prefab_queries.get_popular_reactions(self.group, self.start_date, self.end_date, self.mobile)
        for tcr in tag_cloud_rows:
            tag_cloud[tcr['f'][0]['v']] = tcr['f'][1]['v']
         
        count_map['uniques'] = uniques
        count_map['engagement'] = engagement
        count_map['total_page_views'] = total_page_views
        count_map['total_reaction_views'] = total_reaction_views
        count_map['total_reactions'] = total_reactions
        logger.info('Saving report')
        report = LegacyGroupEventsReport.objects.create(group_id = self.group.id, 
                                                        created_at = timezone.now(),
                                                        report_start = self.start_date,
                                                        report_end = self.end_date,
                                                        mobile = self.mobile, 
                                                        count_map = count_map, 
                                                        sorted_pages = sorted_page_ids,
                                                        pop_content = pop_content,
                                                        pop_content_type = pop_content_type,
                                                        content_page = content_page,
                                                        reaction_page = reaction_page,
                                                        pop_reactions = pop_reactions,
                                                        tag_cloud = tag_cloud)
        report.save()
        
        
            
 