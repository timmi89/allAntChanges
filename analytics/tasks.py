import settings
from celery.task.schedules import crontab
from celery.decorators import periodic_task
from antenna.analytics.utils import OAuth2EventsUtility
import datetime, json
from antenna.rb.models import * 
from django.forms.models import model_to_dict
from celery.utils.log import get_task_logger

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

# A periodic task that will run every minute (the symbol "*" means every)
@periodic_task(run_every=(crontab(hour="*", minute="*/10", day_of_week="*")))
def group_event_stats():
    logger.info("Start group events task")
    event_util = OAuth2EventsUtility(kwargs={'projectNumber':settings.EVENTS_PROJECT_NUMBER, 
                                      'keyFile':settings.EVENTS_KEY_FILE,
                                      'serviceEmail' : settings.EVENTS_SERVICE_ACCOUNT_EMAIL})
    now = datetime.datetime.now()
    
    groups = Group.objects.filter(id__in=ALL_GROUPS) #use ALL_GROUPS until queue mechanism in place
    group_data_sets = {}
    
    for group in groups:
        group_data = []
        hash_tuples = event_util.get_top_reaction_view_hash_counts(group, now.month, now.year, 3)
        for hash_tuple in hash_tuples:
            hash_data = {}
            hash_data['container_hash'] = hash_tuple[0]
            
            interactions = Interaction.objects.filter(container__hash=hash_tuple[0])
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
            
        group_data_sets[group.id] = group_data
        logger.info(json.dumps(group_data_sets, sort_keys=True,indent=4, separators=(',', ': ')))
    logger.info("Task GROUP EVENTS finished")
    



 
@periodic_task(run_every=(crontab(hour="*", minute="*/2", day_of_week="*")))
def query_all_groups():
    logger.info("Start group events task")
    event_util = OAuth2EventsUtility(kwargs={'projectNumber':settings.EVENTS_PROJECT_NUMBER, 
                                      'keyFile':settings.EVENTS_KEY_FILE,
                                      'serviceEmail' : settings.EVENTS_SERVICE_ACCOUNT_EMAIL})
    now = datetime.datetime.now()
    first_of_month = datetime.datetime(now.year,now. month, now.day, 0, 0, 1)
    
    
    groups = Group.objects.filter(id__in=ALL_GROUPS) #dlisted, fastcolabs, okayplayer
    all_groups = []
    for group in groups:
        try:
            hash_tuple = event_util.get_group_widget_loads(group, now.month, now.year, 1)
            hash_data = {}
            hash_data['group_id'] = hash_tuple[0][0]
            hash_data['widget_loads'] = hash_tuple[0][1]
            hash_data['total_events'] = hash_tuple[0][2]
            
            interactions = Interaction.objects.filter(page__site__group__id = group.id, created__gt = first_of_month )
            hash_data['interaction_count'] = len(interactions)
            
            all_groups.append(hash_data) 
            logger.info(hash_data) 
        except Exception, ex:
            logger.warn(ex)
            
    logger.info(json.dumps(all_groups, sort_keys=True,indent=4, separators=(',', ': ')))
    logger.info("ALL GROUPS finished")
         