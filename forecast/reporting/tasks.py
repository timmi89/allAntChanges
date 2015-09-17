import settings
from celery.task.schedules import crontab
from celery.decorators import periodic_task, task
import datetime, json, random
from django.forms.models import model_to_dict
from celery.utils.log import get_task_logger
from django.db.models import Count
from django.core.cache import cache, get_cache
import traceback
from antenna.rb.models import * 
from antenna.forecast.reporting.report_builder import *
from antenna.forecast.reporting import prefab_queries

logger = get_task_logger(__name__)


@periodic_task(name='reporting.group.page.scores', ignore_result=True, 
               run_every=(crontab(hour="*/6", minute="30", day_of_week="*")))
def group_page_scores():
    
    start_date = datetime.datetime.now() - datetime.timedelta(days=30)
    end_date = datetime.datetime.now()
    
    groups = Group.objects.filter(approved=True, activated=True) 
        
    for group in groups:
        try:
            #MOBILE
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
                score = float(row['f'][4]['v']) if row['f'][4]['v'] else 0
                gpm_scores[page_id] = score
                gpm_views[page_id] = page_views
                gpm_rviews[page_id] = reaction_views
                gpm_reacts[page_id] = reactions
            
            GroupPageScores.objects.create(group_id = group.id,created_at = datetime.datetime.now(), mobile = True,
                                           scores = gpm_scores, reactions = gpm_reacts, reaction_views = gpm_rviews, page_views = gpm_views) 
            
            group_event_report.delay(group, True, start_date=start_date, end_date=end_date)
            
            #DESKTOP
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
                score = float(row['f'][4]['v']) if row['f'][4]['v'] else 0
                gpm_scores[page_id] = score
                gpm_views[page_id] = page_views
                gpm_rviews[page_id] = reaction_views
                gpm_reacts[page_id] = reactions
            
            GroupPageScores.objects.create(group_id = group.id,created_at = datetime.datetime.now(), mobile = False,
                                           scores = gpm_scores, reactions = gpm_reacts, reaction_views = gpm_rviews, page_views = gpm_views) 
            group_event_report.delay(group, True, start_date=start_date, end_date=end_date)
            
            
        except Exception, ex:
            logger.warn('Nothing easy in this world')
            logger.warn(traceback.format_exc(50))


@task(name='reporting.group.page.scores')
def group_event_report(group, mobile, start_date = None, end_date = None):
    gerb = GroupEventsReportBuilder(group, mobile, start_date, end_date) 
    gerb.build()
    







