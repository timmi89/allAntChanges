import settings
from celery.task.schedules import crontab
from celery.decorators import periodic_task, task
from analytics.utils import OAuth2EventsUtility
import datetime, json, random
from antenna.rb.models import * 
from antenna.api.util_functions import *
from django.forms.models import model_to_dict
from celery.utils.log import get_task_logger
from models import *
from django.db.models import Count
from django.core.cache import cache, get_cache
import traceback
import hashlib
import httplib

logger = get_task_logger(__name__)


@task(name='page.cache.update')
def update_page_cache(page_id):
    if cache.get('LOCKED_page_data' + str(page_id)) is None:
        cache_data = getSinglePageDataDict(page_id)
        try:
            cache.set('LOCKED_page_data' + str(page_id),'locked',15)
            cache.set('page_data' + str(page_id), cache_data )
            cache.delete('LOCKED_page_data' + str(page_id))
        except Exception, ex:
            logger.info(ex)
        try:
            get_cache('redundant').set('LOCKED_page_data' + str(page_id),'locked',15)
            get_cache('redundant').set('page_data' + str(page_id), cache_data )
            get_cache('redundant').delete('LOCKED_page_data' + str(page_id))
        except Exception, ex:
            logger.info('REDUNDANT CACHE EXCEPTION')
            logger.warn(ex)
        if settings.CACHE_SYNCBACK:
            refresh_url = '/api/cache/page/refresh/'+ str(page_id)

            try:
                hcon = httplib.HTTPConnection(settings.OTHER_DATACENTER, timeout=5)
                hcon.request('GET', refresh_url)
                resp = hcon.getresponse()
                lines = resp.read()
                hcon.close()
            except Exception, e:
                logger.info("Other datacenter refresh: " + str(e))
#    logger.info('updating page_data: ' + str(page_id))
#   cache.set('page_data' + str(page_id), getSinglePageDataDict(page_id))


@task(name='page.containers.cache.update')
def update_page_container_hash_cache(page_id, hashes, crossPageHashes):
    if len(hashes) == 1:
        key = 'page_containers' + str(page_id) + ":" + str(hashes)
        #cache.delete('page_containers' + str(page_id))
        update_page_cache(page_id)
        spdd = cache.get('page_data'+str(page_id))
        new_hashes = []
        for container in spdd['containers']:
            if container.hash != 'page':
                new_hashes.append(container.hash)
        if len(new_hashes) != 1: #no infinite recursion, please
            update_page_container_hash_cache(page_id, new_hashes, crossPageHashes)
    else:
        key = 'page_containers' + str(page_id)
    if cache.get('LOCKED_'+key) is None:
        logger.info('updating page container cache ' + str(hashes) + ' ' +  str(crossPageHashes))
        logger.info(key)
        cache_data = getKnownUnknownContainerSummaries(page_id, hashes, crossPageHashes)
        try:
            cache.set('LOCKED_'+key,'locked',15)
            cache.set(key, cache_data )
            cache.delete('LOCKED_'+key)
        except Exception, ex:
            logger.info(ex)
        try:
            get_cache('redundant').set('LOCKED_'+key,'locked',15)
            get_cache('redundant').set(key, cache_data)
            get_cache('redundant').delete('LOCKED_'+key)
        except Exception, ex:
            logger.info(ex)

    else:
        logger.warning('LOCKED CACHE KEY: ' + key)
#    logger.info('updating page container cache ' + str(hashes) + ' ' +  str(crossPageHashes))
#    cache.set(key, getKnownUnknownContainerSummaries(page_id, hashes, crossPageHashes))
    if settings.CACHE_SYNCBACK:
        if len(hashes) == 1:
            refresh_url = '/api/cache/page/refresh/'+ str(page_id) + '/' +str(hashes[0])
        else:
            refresh_url = '/api/cache/page/refresh/'+ str(page_id)

        try:
            hcon = httplib.HTTPConnection( settings.OTHER_DATACENTER, timeout=5)
            hcon.request('GET', refresh_url)
            resp = hcon.getresponse()
            lines = resp.read()
            hcon.close()
        except Exception, e:
            logger.info("Other datacenter refresh: " + str(e))

@periodic_task(name='do_all_groups_recirc', ignore_result=True, 
               run_every=(crontab(hour="5,17", minute="14", day_of_week="*")))
def do_all_groups_recirc():
    TVHRC_SLOTS = 15
    MRCON_SLOTS = 15
    
    try:
        groups = get_approved_active_groups()
    except:
        groups = Group.objects.filter(approved=True, activated=True) 
    
    for group in groups:
        logger.info("STARTING GROUP RECIRC: " + str(group.id))
        unique_pages = {}
        final_recs = []
        try:
            tvhrc = json.loads(JSONGroupReport.objects.filter(group=group, kind='tvhrc').order_by('-created')[0].body)
            for hash_report in tvhrc:
                if  not hash_report.has_key('page'):
                    continue
                
                if unique_pages.has_key(hash_report['page']['id']):
                    continue
                
                unique_pages[hash_report['page']['id']] = True
                if len(unique_pages) == TVHRC_SLOTS:
                    break
                else:
                    (display_interaction, display_vote) = get_display_interaction_and_count(hash_report['container_hash'], group, hash_report['page']['id'])
                    if display_interaction is not None:
                        recirc = {}
                        recirc['page'] = hash_report['page']
                        recirc['content'] = model_to_dict(display_interaction.content, fields = ['kind', 'body'])
                        recirc['group'] = model_to_dict(group, fields = ['id', 'short_name', 'name'])
                        recirc['reaction'] = {'body':display_interaction.interaction_node.body, 
                                              'id':display_interaction.id, 'count':display_vote}
                        final_recs.append(recirc)
                    
         
            mrcon = json.loads(JSONGroupReport.objects.filter(group=group, kind='mrcon').order_by('-created')[0].body)
            for mrc in mrcon:
                if  not mrc.has_key('page'):
                    continue
                
                if unique_pages.has_key(mrc['page']['id']):
                    continue
                
                content_dict = mrc['content']
                unique_pages[mrc['page']['id']] = True
                if len(unique_pages) == TVHRC_SLOTS + MRCON_SLOTS:
                    break
                else:
                    (display_interaction, display_vote) = get_display_interaction_and_count(mrc['container_hash'], group, mrc['page']['id'])
                    if display_interaction is not None:       
                        recirc = {}
                        recirc['page'] = mrc['page']
                        recirc['content'] = model_to_dict(display_interaction.content, fields = ['kind', 'body'])
                        recirc['group'] = model_to_dict(group, fields = ['id', 'short_name', 'name'])
                        recirc['reaction'] = {'body':display_interaction.interaction_node.body, 
                                              'id':display_interaction.id, 'count':display_vote}
                        
                        final_recs.append(recirc)
            JSONGroupReport.objects.create(body=json.dumps(final_recs), group=group, kind='recrc')
            try:
                cache.set('group_recirc_' + str(group.id), json.dumps(final_recs))
            except Exception, ex:
                logger.info(ex)
            try:
                get_cache('redundant').set('group_recirc_' + str(group.id), json.dumps(final_recs))
            except Exception, ex:
                logger.warn('REDUNDANT CACHE EXCEPTION')
                logger.warn(ex)
        except Exception, ex:
            logger.warn(ex)
            
            
def get_display_interaction_and_count(hash, group, page_id):
    interactions = Interaction.objects.filter(container__hash=hash, page__id = int(page_id), page__site__group = group, approved=True, promotable=True)
    i_count = {}
    display_interaction = None
    display_vote = 0
    for interaction in interactions:
        if i_count.has_key(interaction.interaction_node.body):
            i_count[interaction.interaction_node.body] = i_count[interaction.interaction_node.body] + 1
        else:
            i_count[interaction.interaction_node.body] = 1
        if i_count[interaction.interaction_node.body] > display_vote:
            display_interaction = interaction
            display_vote = i_count[interaction.interaction_node.body]
    return (display_interaction, display_vote)
                
@periodic_task(name='do_all_group_reports', ignore_result=True, 
               run_every=(crontab(hour="7,22", minute="45", day_of_week="*")))
def do_all_group_reports():
    event_util = OAuth2EventsUtility(kwargs={'projectNumber':settings.EVENTS_PROJECT_NUMBER, 
                                      'keyFile':settings.EVENTS_KEY_FILE,
                                      'serviceEmail' : settings.EVENTS_SERVICE_ACCOUNT_EMAIL})
    now = datetime.datetime.now()
    td = datetime.timedelta(days=30)
    
    try:
        groups = get_approved_active_groups()
    except:
        groups = Group.objects.filter(approved=True, activated=True) 
    
    global_data = {'A_user_count' : 0, 'B_user_count' : 0, 'engaged_user_count' : 0}
    group_count = len(groups)
    for group in groups:
        try:
            logger.info("STARTING GROUP: " + str(group.id))
            start_date = now - td
            try:
                event_util.check_last_month_table(group, start_date, now)
            except Exception, ex:
                logger.info('fixing this bug with missing tables over 30 days?')
                logger.info(ex)
                start_date = datetime.datetime.now().replace(day = 1, hour =0, minute = 1)
                
            group_general = event_util.get_group_general_user_data(group, start_date, now)
            JSONGroupReport.objects.create(body=json.dumps(group_general), group=group, kind='guser')
            
            group_data = group_top_reaction_view_hash_count(event_util, now, group)
            if group_data:
                JSONGroupReport.objects.create(body=json.dumps(group_data), group=group)
            else:
                logger.info("No group tvhrc data generated: " + str(group.id))
            
            A_B_script_loads(event_util, now, group)
            
            most_reacted_content(now,group)
            
            global_data['A_user_count'] = int(global_data['A_user_count']) + int(group_general['A_user_count'])
            global_data['B_user_count'] = int(global_data['B_user_count']) + int(group_general['B_user_count'])
            global_data['engaged_user_count'] = int(global_data['engaged_user_count']) + int(group_general['engaged_user_count'])
            group_count = group_count - 1
            logger.info("Groups left: " + str(group_count))
        except Exception, ex:
            group_count = group_count - 1
            logger.warn("Group Report Exception: " + str(group.id))
            logger.warn(ex)
            
    JSONGlobalReport.objects.create(body=json.dumps(global_data), kind='guser')
    logger.info('DO ALL GROUPS FINISHED')

            
def group_top_reaction_view_hash_count(event_util, now, group):
    group_data = []
    td = datetime.timedelta(days=30)
    start_date = now - td
    try:
        event_util.check_last_month_table(group, start_date, now)
    except Exception, ex:
        logger.info('fixing this bug with missing tables over 30 days?')
        logger.info(ex)
        start_date = datetime.datetime.now().replace(day = 1, hour =0, minute = 1)
    hash_tuples = event_util.get_top_reaction_view_hash_counts(group, start_date, now, 10)
    
    if hash_tuples is None:
        return None
 
    for hash_tuple in hash_tuples:
        #only continue processing for groups with at least one reaction view...
        if int(hash_tuple[1]) > 0:
            hash_data = {}
            hash_data['container_hash'] = hash_tuple[0]
            
            interactions = Interaction.objects.filter(container__hash=hash_tuple[0], page__site__group = group)
            logger.info("Interactions for: " + hash_tuple[0] + " " + str(len(interactions)))
            
            hash_data['contents'] = {}
            for interaction in interactions:
                if hash_data['contents'].has_key(interaction.content.id):
                    hash_data['contents'][interaction.content.id]['count'] = hash_data['contents'][interaction.content.id]['count'] + 1
                else:
                    hash_data['contents'][interaction.content.id] = {}
                    hash_data['contents'][interaction.content.id]['count'] = 1
                hash_data['page'] = model_to_dict(interaction.page)
                hash_data['container'] = model_to_dict(interaction.container)
                hash_data['contents'][interaction.content.id]['content'] = model_to_dict(interaction.content)
                
            hash_data['reaction_views'] = hash_tuple[1]
            group_data.append( hash_data )
    return group_data
  



def A_B_script_loads(event_util, now, group):
    try:
        td = datetime.timedelta(days=30)
        start_date = now - td
        try:
            event_util.check_last_month_table(group, start_date, now)
        except Exception, ex:
            logger.info('fixing this bug with missing tables over 30 days?')
            logger.info(ex)
            start_date = datetime.datetime.now().replace(day = 1, hour =0, minute = 1)
        A_script_loads = event_util.get_event_type_count_by_event_value(group, start_date, now, 1, 'sl', 'A')
        B_script_loads = event_util.get_event_type_count_by_event_value(group, start_date, now, 1, 'sl', 'B')
        hash_data = {}
        hash_data['group_id'] = group.id
        hash_data['A_script_loads'] = A_script_loads
        hash_data['B_script_loads'] = B_script_loads
        
        interactions = Interaction.objects.filter(page__site__group__id = group.id)
        hash_data['interaction_count'] = len(interactions)
        JSONGroupReport.objects.create(body=json.dumps(hash_data), group=group, kind='ABsld')
        
    except Exception, ex:
        logger.warn(ex)
            
    logger.info("A_B script loads finished")

    
def most_reacted_content(now, group):
    td = datetime.timedelta(days=30)
    thirty_days = datetime.datetime.now() - td
    interactions = Interaction.objects.filter(page__site__group = group, created__gt = thirty_days)
    content_data = {}
    content_counts = {}
    most_reacted = []
    for interaction in interactions:
        try:
            content = interaction.content
            if not content_data.has_key(content.id):
                content_counts[content.id] = {}
                content_counts[content.id] = 0
                content_data[content.id] = {}
                content_data[content.id]['content'] = model_to_dict(content)
                content_data[content.id]['page']= model_to_dict(interaction.page)
                content_data[content.id]['container_hash'] = interaction.container.hash
            else:
                content_counts[content.id] = content_counts[content.id] + 1
        except Exception, ex:
            logger.warn(ex)
            
    sorted_counts_keys = sorted(content_counts, key=content_counts.get, reverse=True)
    for key in sorted_counts_keys:
        c_d = content_data[key]
        c_d['count'] = content_counts[key]
        most_reacted.append(c_d)
    
    JSONGroupReport.objects.create(body=json.dumps(most_reacted), group=group, kind='mrcon')  

#@periodic_task(name='generate_seeds', ignore_result=True, 
#               run_every=(crontab(hour="*", minute="*/12", day_of_week="*")))
def sowing_seeds_of_love():
    try:
        groups = get_approved_active_groups()
    except:
        groups = Group.objects.filter(approved=True, activated=True) 
    
    now = datetime.datetime.now()
    td = datetime.timedelta(minutes=12)
    then = now - td
    for group in groups:
        pages = Page.objects.filter(site__group = group, created__gt = then ).all()
        for page in pages:
            love_seed = random.choice(group.blessed_tags.all())
            inseminator = random.choice(User.objects.filter(id__in = settings.SEEDERS).all())   
            
            interactions = Interaction.objects.filter(page = page)
            for interaction in interactions:
                if interaction.parent is None:
                    try:
                        zygote = Interaction(
                            page=page,
                            container=interaction.container,
                            content=interaction.content,
                            user=inseminator,
                            kind=interaction.kind,
                            interaction_node=interaction.interaction_node,
                            parent=interaction,
                            rank = 0,
                            approved = True
                        )
                        zygote.save()
                        logger.info('CACHEUPDATE SEEDS')
                        #UPDATE CACHE!
                        update_page_cache.delay(page.id)
                        update_page_container_hash_cache.delay(page.id, [interaction.container.hash], [])
                        break
                    except Exception, e:
                        logger.warn(e)
                    
            #page level seed
            logger.info('container and content get or create')
            page_container = Container.objects.get_or_create(hash='page')[0]
            page_content = Content.objects.get_or_create(kind='pag', body='')[0]
            logger.info('got container and content')
            try:
                zygote = Interaction(
                    page=page,
                    container=page_container,
                    content=page_content,
                    user=inseminator,
                    kind='tag',
                    interaction_node=love_seed,
                    parent=None,
                    rank = 0,
                    approved = True
                )
                zygote.save()
                logger.info("CACHEUPDATE SEEDS2")
            except Exception, e:
                logger.warn(e)
            update_page_cache.delay(page.id)
            update_page_container_hash_cache.delay(page.id, [page_container.hash], [])
    
@periodic_task(name='generate_approved_active_groups', ignore_result=True, 
               run_every=(crontab(hour="7", minute="30", day_of_week="*")))
def generate_approved_active_groups():  
    event_util = OAuth2EventsUtility(kwargs={'projectNumber':settings.EVENTS_PROJECT_NUMBER, 
                                      'keyFile':settings.EVENTS_KEY_FILE,
                                      'serviceEmail' : settings.EVENTS_SERVICE_ACCOUNT_EMAIL})
    now = datetime.datetime.now()
    groups = Group.objects.filter(approved=True, activated=True)
    group_report = {}
    for group in groups:
        active = event_util.check_activity(group, now.month, now.year)
        group_report[group.id] = active
    JSONGlobalReport.objects.create(body=json.dumps(group_report), kind='apact') 

def get_approved_active_groups():
    most_recent_db = JSONGlobalReport.objects.filter(kind='apact').order_by('-created')[0]
    most_recent = json.loads(most_recent_db.body)
    approved_active = []
    for key in most_recent.keys():
        if most_recent[key]:
            approved_active.append(key)
            
    logger.info("APPROVED and ACTIVE: " + str(approved_active))     
    return Group.objects.filter(id__in=approved_active)



