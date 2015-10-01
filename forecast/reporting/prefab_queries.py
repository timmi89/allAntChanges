from antenna.forecast.reporting.builder import *
from antenna.rb.models import *
from antenna.forecast.cassandra.models import *
import logging
logger = logging.getLogger('rb.standard')


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
    START_CLAUSE = BQClause('createdAt', '>=', '"'+start_date.strftime('%Y-%m-%d') + ' 00:00:00"')
    END_CLAUSE = BQClause('createdAt', '<=','"'+ end_date.strftime('%Y-%m-%d') + ' 00:00:00"')
    DATE_CLAUSE = BQClause(START_CLAUSE, 'AND', END_CLAUSE)
    b = BQQueryBuilder()
    b.set_group(group).set_start_date(start_date).set_end_date(end_date)
    b.sel_col('count(distinct(lts))')
    b.set_clause(MOBILE).build_query().run_query()
    return b.get_result_rows()[0]
def get_desktop_lts(group, start_date, end_date):
    START_CLAUSE = BQClause('createdAt', '>=', '"'+start_date.strftime('%Y-%m-%d') + ' 00:00:00"')
    END_CLAUSE = BQClause('createdAt', '<=', '"'+end_date.strftime('%Y-%m-%d') + ' 00:00:00"')
    DATE_CLAUSE = BQClause(START_CLAUSE, 'AND', END_CLAUSE)
    b = BQQueryBuilder()
    b.set_group(group).set_start_date(start_date).set_end_date(end_date)
    b.sel_col('count(distinct(lts))')
    b.set_clause(BQClause(DESKTOP, 'AND', DATE_CLAUSE)).build_query().run_query()
    return b.get_result_rows()[0]
def get_desktop_engagement(group, start_date, end_date):
    START_CLAUSE = BQClause('createdAt', '>=', '"'+start_date.strftime('%Y-%m-%d') + ' 00:00:00"')
    END_CLAUSE = BQClause('createdAt', '<=', '"'+end_date.strftime('%Y-%m-%d') + ' 00:00:00"')
    DATE_CLAUSE = BQClause(START_CLAUSE, 'AND', END_CLAUSE)
    b = BQQueryBuilder()
    b.set_group(group).set_start_date(start_date).set_end_date(end_date)
    b.sel_col('count(distinct(lts))')
    b.set_clause(BQClause(BQClause(ENGAGED,'AND',DESKTOP), 'AND', DATE_CLAUSE)).build_query().run_query()
    return b.get_result_rows()[0]
def get_mobile_engagement(group, start_date, end_date):
    START_CLAUSE = BQClause('createdAt', '>=','"'+ start_date.strftime('%Y-%m-%d') + ' 00:00:00"')
    END_CLAUSE = BQClause('createdAt', '<=', '"'+end_date.strftime('%Y-%m-%d') + ' 00:00:00"')
    DATE_CLAUSE = BQClause(START_CLAUSE, 'AND', END_CLAUSE)
    b = BQQueryBuilder()
    b.set_group(group).set_start_date(start_date).set_end_date(end_date)
    b.sel_col('count(distinct(lts))')
    b.set_clause(BQClause(BQClause(ENGAGED,'AND',MOBILE), 'AND', DATE_CLAUSE)).build_query().run_query()
    return b.get_result_rows()[0]
    
def get_popular_reactions(group, start_date, end_date, mobile):  
    START_CLAUSE = BQClause('createdAt', '>=', '"'+start_date.strftime('%Y-%m-%d') + ' 00:00:00"')
    END_CLAUSE = BQClause('createdAt', '<=', '"'+end_date.strftime('%Y-%m-%d') + ' 00:00:00"')
    DATE_CLAUSE = BQClause(START_CLAUSE, 'AND', END_CLAUSE)
    b = BQQueryBuilder()
    b.set_group(group).set_start_date(start_date).set_end_date(end_date)
    b.sel_columns(['ev', 'count(ev) as counts'])  #THIS NEEDS MORE COLUMNS TO BE MORE USEFUL
    b.set_clause(BQClause(ET_RE, 'AND', DATE_CLAUSE)).set_group_by('group by ev').set_order_by('order by counts desc').set_limit(25).build_query().run_query()
    return b.get_result_rows()


def aggregate_counts(group, start_date, end_date, mobile):
    START_CLAUSE = BQClause('createdAt', '>=', '"'+start_date.strftime('%Y-%m-%d') + ' 00:00:00"')
    END_CLAUSE = BQClause('createdAt', '<=', '"'+end_date.strftime('%Y-%m-%d') + ' 00:00:00"')
    DATE_CLAUSE = BQClause(START_CLAUSE, 'AND', END_CLAUSE)
    #daily['top_views_count']        += int(gr.count_map[str(page_id)+'_pageviews'])
    #daily['top_reactions_count']    += int(gr.count_map[str(page_id)+'_reactions'])
    #daily['top_reaction_views_count']    += int(gr.count_map[str(page_id)+'_reaction_views'])
    if mobile:
        PV_QUERY = BQClause(BQClause(WIDGET_LOAD, 'AND', MOBILE), 'AND', DATE_CLAUSE)
        RV_QUERY = BQClause(BQClause(REACT_VIEW, 'AND', MOBILE), 'AND', DATE_CLAUSE)
        RS_QUERY = BQClause(BQClause(ET_RE, 'AND', MOBILE), 'AND', DATE_CLAUSE)
    else:
        PV_QUERY = BQClause(BQClause(WIDGET_LOAD, 'AND', DESKTOP), 'AND', DATE_CLAUSE)
        RV_QUERY = BQClause(BQClause(REACT_VIEW, 'AND', DESKTOP), 'AND', DATE_CLAUSE)
        RS_QUERY = BQClause(BQClause(ET_RE, 'AND', DESKTOP), 'AND', DATE_CLAUSE)
    
    b = BQQueryBuilder()
    b.set_group(group).set_start_date(start_date).set_end_date(end_date).set_max_results(10000)
    b.sel_columns(['count(pid) as pvcounts']).set_clause(PV_QUERY).build_query()
    b.run_query()
    #print b.get_result_rows()
    page_views = int(b.get_result_rows()[0]['f'][0]['v'][0])

    b = BQQueryBuilder()
    b.set_group(group).set_start_date(start_date).set_end_date(end_date).set_max_results(10000)
    b.sel_columns(['count(et) as rvcounts']).set_clause(RV_QUERY).build_query()
    b.run_query()
    reaction_views = int(b.get_result_rows()[0]['f'][0]['v'][0])
    
    b = BQQueryBuilder()
    b.set_group(group).set_start_date(start_date).set_end_date(end_date).set_max_results(10000)
    b.sel_columns(['count(et) as rscounts']).set_clause(RS_QUERY).build_query()
    b.run_query()
    reactions = int(b.get_result_rows()[0]['f'][0]['v'][0])
    return page_views, reaction_views, reactions
    
def rough_score_joined(group, start_date, end_date, mobile):
    START_CLAUSE = BQClause('createdAt', '>=', '"'+start_date.strftime('%Y-%m-%d') + ' 00:00:00"')
    END_CLAUSE = BQClause('createdAt', '<=', '"'+end_date.strftime('%Y-%m-%d') + ' 00:00:00"')
    DATE_CLAUSE = BQClause(START_CLAUSE, 'AND', END_CLAUSE)
    #' createdAt >= "' + start.strftime('%Y-%m-%d') + ' 00:00:00" and createdAt <= "' + end.strftime('%Y-%m-%d') + ' 23:59:59"'
    if mobile:
        PV_QUERY = BQClause(BQClause(WIDGET_LOAD, 'AND', MOBILE), 'AND', DATE_CLAUSE)
        RV_QUERY = BQClause(BQClause(REACT_VIEW, 'AND', MOBILE), 'AND', DATE_CLAUSE)
        RS_QUERY = BQClause(BQClause(ET_RE, 'AND', MOBILE), 'AND', DATE_CLAUSE)
    else:
        PV_QUERY = BQClause(BQClause(WIDGET_LOAD, 'AND', DESKTOP), 'AND', DATE_CLAUSE)
        RV_QUERY = BQClause(BQClause(REACT_VIEW, 'AND', DESKTOP), 'AND', DATE_CLAUSE)
        RS_QUERY = BQClause(BQClause(ET_RE, 'AND', DESKTOP), 'AND', DATE_CLAUSE)
    
    b = BQQueryBuilder()
    b.set_group(group).set_start_date(start_date).set_end_date(end_date).set_max_results(10000)
    b.sel_columns(['pid as pvpid', 'count(et) as pvcounts']).set_clause(PV_QUERY).set_group_by('group by pvpid').set_order_by('order by pvcounts desc').build_query()
    pv_query = b.get_query_str()
    
    b = BQQueryBuilder()
    b.set_group(group).set_start_date(start_date).set_end_date(end_date).set_max_results(10000)
    #b.sel_columns(['pid as rvpid', 'count(et) as rvcounts']).set_clause(REACT_VIEW).set_group_by('group by rvpid').set_order_by('order by rvcounts desc').build_query()
    b.sel_columns(['pid as rvpid', 'count(et) as rvcounts']).set_clause(RV_QUERY).set_group_by('group by rvpid').build_query()
    rv_query = b.get_query_str()
    
    b = BQQueryBuilder()
    b.set_group(group).set_start_date(start_date).set_end_date(end_date).set_max_results(10000)
    #b.sel_columns(['pid as rspid', 'count(et) as rscounts']).set_clause(ET_RE).set_group_by('group by rspid').set_order_by('order by rscounts desc').build_query()
    b.sel_columns(['pid as rspid', 'count(et) as rscounts']).set_clause(RS_QUERY).set_group_by('group by rspid').build_query()
    rs_query = b.get_query_str()
    
    first_join = QueryJoiner(['pvpid','pvcounts','rvcounts'], pv_query, 'pvs', 'left join each', rv_query, 'rvs', 'pvs.pvpid = rvs.rvpid')
    second_join = QueryJoiner(['pvpid','pvcounts','rvcounts', 'rscounts', '((rscounts * 10 + rvcounts) / pvcounts) as score'], first_join.__str__(), 'agg1', 'left join each', rs_query, 'rs', 'agg1.pvpid = rs.rspid')
    
    b = BQQueryBuilder()
    b.set_max_results(10000).set_custom_query(second_join.__str__() + ' order by score desc').build_query()
    print b.get_query_str()
    
    try:
        b.run_query()
        return b.get_result_rows() #{u'f': [{u'v': u'793727'}, {u'v': u'8'}, {u'v': None}, {u'v': None}]}
    except KeyError, ke:
        logger.warn('NO ROWS RETURNED... Probably not on mobile.')
        return []
    
    
    
    
    
    
    
    
    
    
    
    
    
    