from antenna.rb.models import *
import logging, json
from datetime import datetime, date
logger = logging.getLogger('rb.standard')


class DatetimeEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.strftime('%Y-%m-%dT%H:%M:%SZ')
        elif isinstance(obj, date):
            return obj.strftime('%Y-%m-%d')
        # Let the base class default method raise the TypeError
        return json.JSONEncoder.default(self, obj)

def init_day(dailies, formatted_date):
    if not formatted_date in dailies:
        dailies[formatted_date] = {}
        dailies[formatted_date]['reactions'] = {
            'desktop':0,
            'mobile':0
        }
        dailies[formatted_date]['reaction_views'] = {
            'desktop':0,
            'mobile':0
        }

    return dailies

def merge_desktop_mobile(desktop, mobile, depth):
    merged = {}
    # merged['mobile_dailies'] = mobile.get('dailies',[])
    # merged['desktop_dailies'] = desktop.get('dailies',[])

    mobile_dailies = mobile.get('dailies',[])
    desktop_dailies = desktop.get('dailies',[])
    dailies = {}
    totals = {
        'reactions': {
            'desktop':0,
            'mobile':0,
            'total':0
        },
        'reaction_views': {
            'desktop':0,
            'mobile':0,
            'total':0
        }
    }

    for day in desktop_dailies:
        formatted_date = day['report_start'].strftime("%m/%d/%Y")
        dailies = init_day(dailies, formatted_date)

        if 'total_reactions' in day:
            dailies[formatted_date]['reactions']['desktop'] += day['total_reactions']
            totals['reactions']['desktop'] += day['total_reactions']
            totals['reactions']['total'] += day['total_reactions']
        
        if 'total_reaction_views' in day:
            dailies[formatted_date]['reaction_views']['desktop'] += day['total_reaction_views']
            totals['reaction_views']['desktop'] += day['total_reaction_views']
            totals['reaction_views']['total'] += day['total_reaction_views']

    for day in mobile_dailies:
        formatted_date = day['report_start'].strftime("%m/%d/%Y")
        dailies = init_day(dailies, formatted_date)

        if 'total_reactions' in day:
            dailies[formatted_date]['reactions']['mobile'] += day['total_reactions']
            totals['reactions']['mobile'] += day['total_reactions']
            totals['reactions']['total'] += day['total_reactions']
        
        if 'total_reaction_views' in day:
            dailies[formatted_date]['reaction_views']['mobile'] += day['total_reaction_views']
            totals['reaction_views']['mobile'] += day['total_reaction_views']
            totals['reaction_views']['total'] += day['total_reaction_views']
        
    merged['dailies'] = dailies
    merged['totals'] = totals

    merged['sorted_content'] = []
    sc_holding = {}
    merged['sorted_tag_cloud'] = []
    tc_holding = {}
    merged['sorted_pages'] = []
    sp_holding = {}
    
    if 'sorted_content' in desktop:
        for sc in desktop['sorted_content']:
            sc_holding[sc[0]] = sc[1]
    if 'sorted_content' in mobile:
        for sc in mobile['sorted_content']:
            if sc[0] in sc_holding:
                sc_holding[sc[0]]['score'] += sc[1]['score']
            else:
                sc_holding[sc[0]] = sc[1] 
    
    if 'sorted_tag_cloud' in desktop:
        for tc in desktop['sorted_tag_cloud']:
            tc_holding[tc[0]]  = tc[1]
    if 'sorted_tag_cloud' in mobile:
        for tc in mobile['sorted_tag_cloud']:
            if tc[0] in tc_holding:
                tc_holding[tc[0]] += tc[1]
            else:
                tc_holding[tc[0]]  = tc[1]
    
    if 'sorted_pages' in desktop:
        for sp in desktop['sorted_pages']:
            sp_holding[sp[0]] = sp[1]
    if 'sorted_pages' in mobile:
        for sp in mobile['sorted_pages']:
            if sp[0] in sp_holding:
                sp_holding[sp[0]]['score'] += sp[1]['score']
                print 'ADDING???', sp[1]   
            else:
                sp_holding[sp[0]] = sp[1]
                print sp[1]
    
 
    merged['sorted_content'].extend(sc_holding.items())
    merged['sorted_tag_cloud'].extend(tc_holding.items())
    merged['sorted_pages'].extend(sp_holding.items())
    
    if len(merged['sorted_content']):
        merged['sorted_content'].sort(key = lambda entry : entry[1]['score'])
        merged['sorted_content'].reverse()
        merged['sorted_content'] = merged['sorted_content'][0:depth]

    if len(merged['sorted_tag_cloud']):
        merged['sorted_tag_cloud'].sort(key = lambda entry : entry[1])
        merged['sorted_tag_cloud'].reverse()
        merged['sorted_tag_cloud'] = merged['sorted_tag_cloud'][0:depth]
    if len(merged['sorted_pages']):
        merged['sorted_pages'].sort(key = lambda entry : entry[1]['score'])
        merged['sorted_pages'].reverse()
        merged['sorted_pages'] = merged['sorted_pages'][0:depth]

                
    return merged
    
def aggregate_reports(group_reports, depth):
    if group_reports and len(group_reports):
        agg_dict= {}
        agg_dict['dailies']     = []
        agg_dict['content']     = {}
        agg_dict['pages']       = {}
        agg_dict['sorted_pages'] = []
        agg_dict['sorted_content'] = []
        agg_dict['sorted_reactions'] = []
        agg_dict['tag_cloud'] = {}
        agg_dict['sorted_tag_cloud'] = []
        
        
        for gr in group_reports:
            logger.info('aggregating group report ' + str(gr.report_start) + ' ' + str(gr.mobile))
            daily = {}
            daily['created_at'] = gr.created_at
            daily['report_start'] = gr.report_start
            daily['report_end'] = gr.report_end
            daily['top_views_count'] = 0
            daily['top_reactions_count'] = 0
            daily['top_reaction_views_count'] = 0 
            for page_id in gr.sorted_pages:
                if not page_id in agg_dict['pages']:
                    agg_dict['pages'][page_id] = {}
                    agg_dict['pages'][page_id]['score'] = 0
                    page = Page.objects.get(id=page_id)
                    agg_dict['pages'][page_id]['url'] = page.url
                    agg_dict['pages'][page_id]['title'] = page.title
                    agg_dict['pages'][page_id]['views'] = 0
                    agg_dict['pages'][page_id]['reaction_views'] = 0
                    agg_dict['pages'][page_id]['reactions'] = 0
                    
                agg_dict['pages'][page_id]['score']             += round((gr.count_map[str(page_id)+'_score'])*100, 2)
                agg_dict['pages'][page_id]['views']             += int(gr.count_map[str(page_id)+'_pageviews'])
                agg_dict['pages'][page_id]['reaction_views']    += int(gr.count_map[str(page_id)+'_reaction_views'])
                agg_dict['pages'][page_id]['reactions']         += int(gr.count_map[str(page_id)+'_reactions'])
                #print agg_dict['pages'][page_id]['reactions'], int(gr.count_map[str(page_id)+'_reactions'])
                daily['total_pageviews']        = int(gr.count_map['total_page_views'])
                daily['total_reactions']        = int(gr.count_map['total_reactions'])
                daily['total_reaction_views']   = int(gr.count_map['total_reaction_views'])
                
            for (cid,pid) in gr.content_page.items():
                if cid in agg_dict['content']:
                    agg_dict['content'][cid]['score'] += round((agg_dict['pages'][pid]['score'])*100, 2)
                else:
                    agg_dict['content'][cid] = {}
                    agg_dict['content'][cid]['score']   = round((agg_dict['pages'][pid]['score'])*100, 2)
                    agg_dict['content'][cid]['type']    = gr.pop_content_type[cid]
                    agg_dict['content'][cid]['body']    = gr.pop_content[cid]                                    
      
            daily['uniques'] = gr.count_map['uniques']
            daily['engagement'] = gr.count_map['engagement']
            agg_dict['dailies'].append(daily)
            #TAG_CLOUD aggregation
            for pop_tag in gr.tag_cloud.keys():
                if not pop_tag in agg_dict['tag_cloud']:
                    agg_dict['tag_cloud'][pop_tag] = 0
                agg_dict['tag_cloud'][pop_tag] += gr.tag_cloud[pop_tag]
        
        agg_dict['sorted_content'].extend(agg_dict['content'].items())
        #agg_dict['sorted_reactions'].extend(agg_dict['reactions'].items())
        agg_dict['sorted_tag_cloud'].extend(agg_dict['tag_cloud'].items())
        agg_dict['sorted_pages'].extend(agg_dict['pages'].items())
        
        if len(agg_dict['sorted_content']):
            agg_dict['sorted_content'].sort(key = lambda entry : entry[1]['score'])
            agg_dict['sorted_content'].reverse()
            agg_dict['sorted_content'] = agg_dict['sorted_content'][0:depth]

        if len(agg_dict['tag_cloud']):
            agg_dict['sorted_tag_cloud'].sort(key = lambda entry : entry[1])
            agg_dict['sorted_tag_cloud'].reverse()
            agg_dict['sorted_tag_cloud'] = agg_dict['sorted_tag_cloud'][0:depth]
        if len(agg_dict['sorted_pages']):
            agg_dict['sorted_pages'].sort(key = lambda entry : entry[1]['score'])
            agg_dict['sorted_pages'].reverse()
            agg_dict['sorted_pages'] = agg_dict['sorted_pages'][0:depth]
          
        agg_dict.pop('pages')    
        agg_dict.pop('content')
        agg_dict.pop('tag_cloud')
        
        agg_dict['sorted_content'] = agg_dict['sorted_content'][0:depth]
        for sc in agg_dict['sorted_content']:
            try:
                sc[1]['interaction_id']    = Interaction.objects.filter(content__id = sc[0])[0].id
            except Interaction.DoesNotExist, idne:
                logger.warn('No Interaction for Content in Utils Reporting')
        
       
        return agg_dict
    else:
        return {}
    
    
    
    