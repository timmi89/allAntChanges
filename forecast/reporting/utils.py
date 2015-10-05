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


def merge_desktop_mobile(desktop, mobile, depth):
    merged = {}
    merged['mobile_dailies'] = mobile.get('dailes',[])
    merged['desktop_dailies'] = desktop.get('dailies',[])
    merged['sorted_content'] = []
    sc_holding = {}
    merged['sorted_tag_cloud'] = []
    tc_holding = {}
    merged['sorted_pages'] = []
    sp_holding = {}
    
    if desktop.has_key('sorted_content'):
        for sc in desktop['sorted_content']:
            sc_holding[sc[0]] = sc[1]
    if mobile.has_key('sorted_content'):
        for sc in mobile['sorted_content']:
            if sc_holding.has_key(sc[0]):
                sc_holding[sc[0]]['score'] += sc[1]['score']
            else:
                sc_holding[sc[0]] = sc[1] 
    
    if desktop.has_key('sorted_tag_cloud'):
        for tc in desktop['sorted_tag_cloud']:
            tc_holding[tc[0]]  = tc[1]
    if mobile.has_key('sorted_tag_cloud'):
        for tc in mobile['sorted_tag_cloud']:
            if tc_holding.has_key(tc[0]):
                tc_holding[tc[0]]['score'] += tc[1]['score']
            else:
                tc_holding[tc[0]]  = tc[1]
    
    if desktop.has_key('sorted_pages'):
        for sp in desktop['sorted_pages']:
            sp_holding[sp[0]] = sp[1]
    if mobile.has_key('sorted_pages'):
        for sp in mobile['sorted_pages']:
            if sp_holding.has_key(sp[0]):
                sp_holding[sp[0]]['score'] += sp[1]['score']    
            else:
                sp_holding[sp[0]] = sp[1]
    
 
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
            daily = {}
            daily['created_at'] = gr.created_at
            daily['report_start'] = gr.report_start
            daily['report_end'] = gr.report_end
            daily['top_views_count'] = 0
            daily['top_reactions_count'] = 0
            daily['top_reaction_views_count'] = 0 
            for page_id in gr.sorted_pages:
                if not agg_dict['pages'].has_key(page_id):
                    agg_dict['pages'][page_id] = {}
                    agg_dict['pages'][page_id]['score'] = 0
                    page = Page.objects.get(id=page_id)
                    agg_dict['pages'][page_id]['url'] = page.url
                    agg_dict['pages'][page_id]['title'] = page.title
                    agg_dict['pages'][page_id]['views'] = 0
                    agg_dict['pages'][page_id]['reaction_views'] = 0
                    agg_dict['pages'][page_id]['reactions'] = 0
                    
                agg_dict['pages'][page_id]['score']             += gr.count_map[str(page_id)+'_score']
                agg_dict['pages'][page_id]['views']             += int(gr.count_map[str(page_id)+'_pageviews'])
                agg_dict['pages'][page_id]['reaction_views']    += int(gr.count_map[str(page_id)+'_reaction_views'])
                agg_dict['pages'][page_id]['reactions']         += int(gr.count_map[str(page_id)+'_reactions'])
                
                daily['total_pageviews']        = int(gr.count_map['total_page_views'])
                daily['total_reactions']        = int(gr.count_map['total_reactions'])
                daily['total_reaction_views']   = int(gr.count_map['total_reaction_views'])
                
            for (cid,pid) in gr.content_page.items():
                if agg_dict['content'].has_key(cid):
                    agg_dict['content'][cid]['score'] += agg_dict['pages'][pid]['score']
                else:
                    agg_dict['content'][cid] = {}
                    agg_dict['content'][cid]['score']   = agg_dict['pages'][pid]['score']
                    agg_dict['content'][cid]['type']    = gr.pop_content_type[cid]
                    agg_dict['content'][cid]['body']    = gr.pop_content[cid]                                    
      
            daily['uniques'] = gr.count_map['uniques']
            daily['engagement'] = gr.count_map['engagement']
            agg_dict['dailies'].append(daily)
            #TAG_CLOUD aggregation
            for pop_tag in gr.tag_cloud.keys():
                if not agg_dict['tag_cloud'].has_key(pop_tag):
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
    
    
    
    