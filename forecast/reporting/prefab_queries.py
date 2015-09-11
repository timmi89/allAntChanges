from antenna.forecast.reporting.builder import *
from antenna.rb.models import *
from antenna.forecast.cassandra.models import *
 
MOBILE      = BQCrit('it','=','T') #Boolean special casing for string quoting in builder.  For now these are reserved values for BQCrit
DESKTOP     = BQCrit('it','=','F')
ET_RE       = BQCrit('et','=','re') # event type reaction
ET_RS       = BQCrit('et','=','rs')
EV_SHOW     = BQCrit('ev','=', 'show')
ET_SB       = BQCrit('et','=','sb')
EV_VW       = BQCrit('ev','=', 'vw')
EV_LIKE_RD  = BQCrit('ev','LIKE', 'rd%')
CL1         = BQClause(ET_RS, 'AND', EV_LIKE_RD)
CL2         = BQClause(ET_SB, 'AND', EV_SHOW)
CL3         = BQClause(ET_SB, 'AND', EV_VW)
CL4         = BQClause(ET_RE, 'OR', CL1)
CL5         = BQClause(CL2, 'OR', CL3)
ENGAGED     = BQClause(CL4, 'OR', CL5)
REACT_VIEW  = BQClause(CL1, 'OR', CL5)
WIDGET_LOAD = BQCrit('et','=','wl')

def get_mobile_lts(group, start_date, end_date):
    b = BQQueryBuilder()
    b.set_group(group).set_start_date(start_date).set_end_date(end_date)
    b.sel_col('count(distinct(lts))')
    b.set_clause(MOBILE).build_query().run_query()
    return b.get_result_rows()
def get_desktop_lts(group, start_date, end_date):
    b = BQQueryBuilder()
    b.set_group(group).set_start_date(start_date).set_end_date(end_date)
    b.sel_col('count(distinct(lts))')
    b.set_clause(DESKTOP).build_query().run_query()
    return b.get_result_rows()
def get_desktop_engagement(group, start_date, end_date):
    b = BQQueryBuilder()
    b.set_group(group).set_start_date(start_date).set_end_date(end_date)
    b.sel_col('count(distinct(lts))')
    b.set_clause(BQClause(ENGAGED,'AND',DESKTOP)).build_query().run_query()
    return b.get_result_rows()
def get_mobile_engagement(group, start_date, end_date):
    b = BQQueryBuilder()
    b.set_group(group).set_start_date(start_date).set_end_date(end_date)
    b.sel_col('count(distinct(lts))')
    b.set_clause(BQClause(ENGAGED,'AND',MOBILE)).build_query().run_query()
    return b.get_result_rows()
    
def get_popular_reactions(group, start_date, end_date):  
    b = BQQueryBuilder()
    b.set_group(group).set_start_date(start_date).set_end_date(end_date)
    b.sel_columns(['ev', 'count(ev) as counts'])  #THIS NEEDS MORE COLUMNS TO BE MORE USEFUL
    b.set_clause(ET_RE).set_group_by('group by ev').set_order_by('order by counts desc').set_limit(25).build_query().run_query()
    return b.get_result_rows()
    
def rough_score(group, start_date, end_date):
    b = BQQueryBuilder()
    b.set_group(group).set_start_date(start_date).set_end_date(end_date).set_max_results(3000)
    b.sel_columns(['pid', 'count(et) as counts']).set_clause(WIDGET_LOAD).set_group_by('group by pid').set_order_by('order by counts desc').build_query().run_query()
    page_views_rows =  b.get_result_rows()
    
    b = BQQueryBuilder()
    b.set_group(group).set_start_date(start_date).set_end_date(end_date).set_max_results(3000)
    b.sel_columns(['pid', 'count(et) as counts']).set_clause(REACT_VIEW).set_group_by('group by pid').set_order_by('order by counts desc').build_query().run_query()
    react_views_rows =  b.get_result_rows()
    
    b = BQQueryBuilder()
    b.set_group(group).set_start_date(start_date).set_end_date(end_date).set_max_results(3000)
    b.sel_columns(['pid', 'count(et) as counts']).set_clause(ET_RE).set_group_by('group by pid').set_order_by('order by counts desc').build_query().run_query()
    reactions_rows =  b.get_result_rows()
    
    
    big_dict = {}
    missed_rviews = 0
    missed_reactions = 0
    missed_pageviews = 0
    for row in page_views_rows:
        little_dict = {'rview':False,'react':False}
        little_dict['views'] = row['f'][1]['v']
        big_dict[row['f'][0]['v']] = little_dict
        #print 'page:',row['f'][0]['v'],'views:',row['f'][1]['v']   
    for row in react_views_rows:
        if big_dict.has_key(row['f'][0]['v']):
            big_dict[row['f'][0]['v']]['react_views'] = row['f'][1]['v']
            big_dict[row['f'][0]['v']]['rview'] = True
        else:
            #print 'missed page for reaction views: ', row['f'][0]['v']
            missed_rviews += 1
    for row in reactions_rows:
        if big_dict.has_key(row['f'][0]['v']):
            big_dict[row['f'][0]['v']]['reactions'] = row['f'][1]['v']
            big_dict[row['f'][0]['v']]['react'] = True
        else:
            #print 'Missed page for reaction views: ', row['f'][0]['v']
            missed_reactions += 1
    for (k,v) in big_dict.items():
        if not v['rview'] or not v['react']:
            #print 'Pageviews with missed numerators:', k, v['views']
            missed_pageviews +=1
    print len(page_views_rows), len(react_views_rows), len(reactions_rows)  
    print missed_pageviews, missed_rviews, missed_reactions         
    return (reactions_rows, react_views_rows, page_views_rows) 
    
    
    
    
    
    
    
    
    
    
    
    
    
    