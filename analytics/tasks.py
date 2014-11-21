import settings
from celery.task.schedules import crontab
from celery.decorators import periodic_task
from analytics.utils import OAuth2EventsUtility
import datetime, json, random
from antenna.rb.models import * 
from antenna.utils import cache as antenna_cache
from django.forms.models import model_to_dict
from celery.utils.log import get_task_logger
from models import *
from django.db.models import Count
from django.core.cache import cache

logger = get_task_logger(__name__)

ALL_GROUPS = [102, 1027, 105, 108, 1097, 1104, 1125, 1153, 1163, 1167, 1168, 
              1169, 117, 1207, 1215, 1224, 1278, 1339, 1350, 1355, 1358, 1362, 
              1376, 140, 1419, 1431, 1441, 1443, 1454, 1460, 1468, 1491, 15, 1509, 
              1514, 1524, 1545, 1548, 1554, 1557, 156, 1563, 1584, 1585, 1587, 
              1590, 1594, 1602, 1612, 1614, 1626, 1629, 1634, 1642, 1647, 1648, 
              1655, 1657, 1659, 1660, 1661, 1669, 1673, 1679, 1680, 1681, 1682, 
              1687, 1688, 1689, 1693, 1699, 17, 1700, 1702, 1706, 1707, 1710, 
              1717, 172, 1727, 1734, 1741, 1754, 1757, 1758, 1760, 1761, 1766, 
              1772, 1774, 1776, 1782, 1783, 1784, 179, 1790, 1794, 1796, 
              1797, 1799, 1802, 1814, 1818, 1820, 1835, 1843, 1844, 1846, 1851, 
              1854, 1864, 1867, 1873, 1880, 1883, 1884, 1888, 1891, 1892, 1899, 
              1901, 1905, 1910, 1914, 1919, 1926, 1927, 1928, 1933, 1934, 1935, 
              1937, 1990, 1992, 2007, 2014, 2015, 2016, 2018, 2022, 2024, 2026,
              2034, 2043, 2048, 2050, 2061, 2069, 2074, 208, 2081, 2084, 2099, 
              2102, 2107, 2109, 2111, 2113, 2122, 2124, 2129, 2133, 2135, 2140, 
              2147, 2150, 2153, 2155, 2156, 2169, 2178, 2182, 2184, 2185, 2189, 
              2196, 2198, 2199, 2215, 2216, 2217, 2218, 2227, 2243, 2249, 2250, 
              2252, 2254, 2268, 2281, 2293, 2297, 2298, 2301, 2303, 2310, 2330, 
              2343, 2347, 2350, 2352, 2353, 2357, 2361, 2383, 2385, 2390, 2393, 
              2394, 2395, 2398, 2399, 2400, 2401, 2402, 2403, 2405, 2406, 2408, 
              2409, 2411, 2415, 2418, 2424, 2426, 2427, 2430, 2433, 2434, 2436, 
              2437, 2438, 2440, 2450, 2460, 2461, 2464, 2468, 2469, 2473, 2475, 
              2477, 2480, 2488, 2498, 2499, 2507, 2529, 2545, 2566, 2568, 2570, 
              2581, 2582, 2584, 2595, 2612, 2616, 2617, 2620, 2621, 2623, 2625, 
              2630, 2631, 2633, 2639, 2641, 2643, 2646, 2647, 2649, 2650, 2653, 
              2654, 2655, 2656, 2658, 2659, 2661, 2665, 2667, 2668, 2669, 2670, 
              2672, 2673, 2674, 2677, 2680, 2683, 2686, 2689, 269, 2692, 2693, 
              2696, 2700, 2701, 2702, 2706, 2708, 2709, 2715, 2716, 28, 29, 32, 
              341, 35, 378, 4, 5, 501, 508, 55, 571, 6, 624, 648, 658, 66, 662, 
              667, 729, 738, 77, 778, 80, 83, 848, 853, 894, 918, 960, 997]


@periodic_task(name='do_all_groups_recirc', ignore_result=True, 
               run_every=(crontab(hour="*", minute="14,44", day_of_week="*")))
def do_all_groups_recirc():
    TVHRC_SLOTS = 5
    MRCON_SLOTS = 5
    
    try:
        groups = get_approved_active_groups()
    except:
        groups = Group.objects.filter(id__in=ALL_GROUPS, approved=True) 
    
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
                    (display_interaction, display_vote) = get_display_interaction_and_count(hash_report['container_hash'], group)
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
                
                (display_interaction, display_vote) = get_display_interaction_and_count(mrc['container_hash'], group)       
                recirc = {}
                recirc['page'] = mrc['page']
                recirc['content'] = {'kind':content_dict['kind'], 'body':content_dict['body']}
                recirc['group'] = model_to_dict(group, fields = ['id', 'short_name', 'name'])
                recirc['reaction'] = {'body':display_interaction.interaction_node.body, 
                                      'id':display_interaction.id, 'count':display_vote}
                
                final_recs.append(recirc)
            JSONGroupReport.objects.create(body=json.dumps(final_recs), group=group, kind='recrc')
            cache.set('group_recirc_' + str(group.id), json.dumps(final_recs))
        except Exception, ex:
            logger.warn(ex)
            
            
def get_display_interaction_and_count(hash, group):
    interactions = Interaction.objects.filter(container__hash=hash, page__site__group = group, approved=True)
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
               run_every=(crontab(hour="*", minute="45", day_of_week="*")))
def do_all_group_reports():
    event_util = OAuth2EventsUtility(kwargs={'projectNumber':settings.EVENTS_PROJECT_NUMBER, 
                                      'keyFile':settings.EVENTS_KEY_FILE,
                                      'serviceEmail' : settings.EVENTS_SERVICE_ACCOUNT_EMAIL})
    now = datetime.datetime.now()
    td = datetime.timedelta(days=30)
    try:
        groups = get_approved_active_groups()
    except:
        groups = Group.objects.filter(id__in=ALL_GROUPS, approved=True) 
    
    global_data = {'A_user_count' : 0, 'B_user_count' : 0, 'engaged_user_count' : 0}
    group_count = len(groups)
    for group in groups:
        try:
            logger.info("STARTING GROUP: " + str(group.id))
            
            group_general = event_util.get_group_general_user_data(group, now - td, now)
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
            logger.warn("Group Report Exception: " + str(group.id))
            logger.warn(ex)
            
    JSONGlobalReport.objects.create(body=json.dumps(global_data), kind='guser')
    logger.info('DO ALL GROUPS FINISHED')

            
def group_top_reaction_view_hash_count(event_util, now, group):
    group_data = []
    td = datetime.timedelta(days=30)
    hash_tuples = event_util.get_top_reaction_view_hash_counts(group, now - td, now, 10)
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
        A_script_loads = event_util.get_event_type_count_by_event_value(group, now - td, now, 1, 'sl', 'A')
        B_script_loads = event_util.get_event_type_count_by_event_value(group, now - td, now, 1, 'sl', 'B')
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
    thirty_days = datetime.now() - td
    interactions = Interaction.objects.filter(page__site__group = group, created__gt = thirty_days)
    content_data = {}
    content_counts = {}
    most_reacted = []
    for interaction in interactions:
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
    sorted_counts_keys = sorted(content_counts, key=content_counts.get, reverse=True)
    for key in sorted_counts_keys:
        c_d = content_data[key]
        c_d['count'] = content_counts[key]
        most_reacted.append(c_d)
    
    JSONGroupReport.objects.create(body=json.dumps(most_reacted), group=group, kind='mrcon')  

@periodic_task(name='generate_seeds', ignore_result=True, 
               run_every=(crontab(hour="*", minute="*/12", day_of_week="*")))
def sowing_seeds_of_love():
    try:
        groups = get_approved_active_groups()
    except:
        groups = Group.objects.filter(id__in=ALL_GROUPS, approved=True) 
    
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
                        logger.info('zygote saved')
                        antenna_cache.clear_interaction_caches(page, interaction.container)
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
                logger.info("saved zygote")
            except Exception, e:
                logger.warn(e)
            antenna_cache.clear_interaction_caches(page, page_container)

    
@periodic_task(name='generate_approved_active_groups', ignore_result=True, 
               run_every=(crontab(hour="7", minute="0", day_of_week="*")))
def generate_approved_active_groups():  
    event_util = OAuth2EventsUtility(kwargs={'projectNumber':settings.EVENTS_PROJECT_NUMBER, 
                                      'keyFile':settings.EVENTS_KEY_FILE,
                                      'serviceEmail' : settings.EVENTS_SERVICE_ACCOUNT_EMAIL})
    now = datetime.datetime.now()
    groups = Group.objects.filter(approved=True)
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

        