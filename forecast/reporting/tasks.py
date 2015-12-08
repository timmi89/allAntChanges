import settings
from celery.task.schedules import crontab
from celery.decorators import periodic_task, task
import datetime, json, random
from django.forms.models import model_to_dict
from django.utils import timezone
#from celery.utils.log import get_task_logger
from django.db.models import Count
from django.core.cache import cache, get_cache
from django.core.mail import send_mail
import traceback, logging, httplib
from antenna.rb.models import * 
from antenna.forecast.reporting.report_builder import *
from antenna.forecast.reporting import prefab_queries

logger = logging.getLogger('rb.standard')


@periodic_task(name='reporting.group.page.scores', ignore_result=True,
               run_every=(crontab(hour="3", minute="30", day_of_week="*")))
def all_group_page_scores():
    
    start_date = timezone.now() - datetime.timedelta(days=1)
    end_date = timezone.now()
    start_date, end_date = adjust_start_end_dates(start_date, end_date)
    groups = Group.objects.filter(approved=True, activated=True) 
        
    for group in groups:
        try:
            group_page_scores(group, start_date, end_date)
        except Exception, ex:
            logger.warn('Nothing easy in this world')
            logger.warn(traceback.format_exc(50))


def adjust_start_end_dates(start_date, end_date):
    sd = start_date.replace(hour=0,minute=0,second=0, microsecond = 0)
    ed = end_date.replace(hour=0,minute=0,second=0, microsecond = 0)
    return sd,ed

def group_page_scores(group, start_date, end_date):
    #MOBILE
    try:
        big_list = []
        mobile_joined_rows = prefab_queries.rough_score_joined(group, start_date, end_date, True)
        gpm_views = {}
        gpm_rviews = {}
        gpm_reacts = {}
        gpm_scores = {}
        logger.info('Group Page Scores 1')
        if len(mobile_joined_rows) > 0:
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
            
            gps = GroupPageScores.objects.create(group_id = group.id,created_at = timezone.now(), mobile = True, report_start = start_date, report_end = end_date,
                                           scores = gpm_scores, reactions = gpm_reacts, reaction_views = gpm_rviews, page_views = gpm_views) 
            
            group_event_report(group, True, start_date=start_date, end_date=end_date, group_page_score = gps)
    except Exception, ex:
        logger.warn('HERE I AM')
        logger.warn(ex)
        logger.warn(traceback.format_exc(50))
        
    try:    
        #DESKTOP
        logger.warn('Starting Desktop GERB for ' + str(group))
        big_list = []
        joined_rows = prefab_queries.rough_score_joined(group, start_date, end_date, False)
        logger.warn('JOined queries ' + str(len(joined_rows)))
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
            
        
        logger.warn('Creating Group PageScores for : ' + str(group) + ' at ' + str(timezone.now()))
        gps = GroupPageScores.objects.create(group_id = group.id,created_at = timezone.now(), mobile = False, report_start = start_date, report_end = end_date,
                                       scores = gpm_scores, reactions = gpm_reacts, reaction_views = gpm_rviews, page_views = gpm_views) 
        logger.warn('calling group_event_report')
        group_event_report(group, False, start_date=start_date, end_date=end_date, group_page_score = gps)
    except Exception, ex:
        logger.warn('THIS SPACE NOT BLANK IS BAD')
        logger.warn(traceback.format_exc(50))
    
    

def group_event_report(group, mobile, start_date = None, end_date = None, group_page_score = None):
    gerb = GroupEventsReportBuilder(group, mobile, start_date, end_date, group_page_score = group_page_score) 
    logger.info('bulding gerb')
    gerb.build()
    logger.info('gerb built')
    



@periodic_task(name='reporting.weekly.email.report', ignore_result=True, 
               run_every=(crontab(hour="5", minute="30", day_of_week="1")))
def weekly_email_report():
    #SCRAPE HTML
    groups = Group.objects.filter(approved=True, activated=True) 
    fail_silently = False
    auth_user = 'broadcast@antenna.is'
    auth_password = 'br04dc45t'
    message = 'Testing django email lib'
    from_email = 'broadcast@antenna.is'
    
    for group in groups:
        group_weekly_email(group, fail_silently, auth_user, auth_password, message, from_email)
  
def group_weekly_email(group, fail_silently, auth_user, auth_password, message, from_email):
    try:
        subject = 'Test Weekly Broadcast'
        recipient_list = ['michael@antenna.is']
        url = '/group/' + group.short_name + '/analytics_email/'
        hcon = httplib.HTTPConnection(settings.URL_NO_PROTO, timeout=30)
        #hcon.connect()
        hcon.request('GET', url)
        resp = hcon.getresponse()
        message = resp.read()
        if message is not None:
            logger.info("PAGE GENERATED: " + url)
        else:
            logger.info("NONE PAGE" + url)
        hcon.close()   
        print 'sending message?'
         
        send_mail(subject, message, from_email, recipient_list, fail_silently, auth_user, auth_password)
        print 'sent message'    
    except Exception, ex:
        logger.warn('Nothing easy in this world')
        logger.warn(traceback.format_exc(50))


