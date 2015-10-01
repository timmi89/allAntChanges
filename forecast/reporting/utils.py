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

def aggregate_reports(group_reports, depth):
    if group_reports and len(group_reports):
        agg_dict= {}
        agg_dict['dailies']     = []
        agg_dict['content']     = {}
        agg_dict['reactions']   = {}
        agg_dict['pages']       = {}
        agg_dict['sorted_content'] = []
        agg_dict['sorted_reactions'] = []
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
                #TODO these will need to be separate queries.
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
                    #TODO:  do db lookup after list is trimmed
                    try:
                        agg_dict['content'][cid]['interaction_id']    = Interaction.objects.filter(content__id = cid)[0].id
                    except Interaction.DoesNotExist, idne:
                        logger.warn('No Interaction for Content in Utils Reporting')
                          
            for (rid,pid) in gr.reaction_page.items():
                if agg_dict['reactions'].has_key(rid):
                    agg_dict['reactions'][rid]['score'] += agg_dict['pages'][pid]
                else:
                    agg_dict['reactions'][rid] = {}
                    agg_dict['reactions'][rid]['score'] = agg_dict['pages'][pid]
                    #TODO:  do db lookup after list is trimmed
                    try:
                        interaction = Interaction.objects.get(id=rid)
                        agg_dict['reactions'][rid]['body'] = interaction.interaction_node.body
                    except Interaction.DoesNotExist, idne:
                        logger.warn(idne)
                    
            daily['uniques'] = gr.count_map['uniques']
            daily['engagement'] = gr.count_map['engagement']
            agg_dict['dailies'].append(daily)
        
        agg_dict['sorted_content'].extend(agg_dict['content'].items())
        agg_dict['sorted_reactions'].extend(agg_dict['reactions'].items())
        if len(agg_dict['sorted_content']):
            agg_dict['sorted_content'].sort(key = lambda entry : entry[1]['score'])
            agg_dict['sorted_content'].reverse()
        if len(agg_dict['sorted_reactions']):
            agg_dict['sorted_reactions'].sort(key = lambda entry : entry[1]['score'])
            agg_dict['sorted_reactions'].reverse()
        
        agg_dict.pop('content')
        agg_dict.pop('reactions')
        agg_dict['sorted_content'] = agg_dict['sorted_content'][0:20]
        agg_dict['sorted_reactions'] = agg_dict['sorted_reactions'][0:20]
        #TODO:  do db lookups HERE on trimmed lists
        
        return json.dumps(agg_dict, cls=DatetimeEncoder)
    else:
        return {}