https://developers.google.com/bigquery/query-reference#datetimefunctions


Schema

    et          event_type
    ev          event_value
    gid         group_id          INTEGER
    uid         user_id           INTEGER
    pid         page_id           INTEGER
    lts         long_term_session
    sts         short_term_session
    ref         referrer_tld
    cid         content_id        INTEGER
    ah          article_height    INTEGER
    ch          container_hash
    ck          container_kind
    r           reaction_body
    pt          page_title
    cu          canonical_url
    pu          page_url
    ru          referrer_url
    ca          content_attributes
    cl          content_location
    ptop        page_topics
    a           author
    sec         site_section
    it          isTouchBrowser    BOOLEAN
    sw          screen_width      INTEGER
    sh          screen_height     INTEGER
    pd          pixel_density     FLOAT
    ua          user_agent
    createdAt                     TIMESTAMP


value abbreviations
    event_type
      share         :     sh
      summary bar   :     sb
      rindow_show   :     rs
      scroll        :     sc
      widget_load   :     wl
      comment       :     c
      reaction      :     re
      time          :     t

    event_value
      view content    :   vc
      view comments   :   vcom
      view reactions  :   vr
      writemode       :   wr
      readmode        :   rd

      default summary bar   :   def
      single summary bar    :   si
      multiple pages        :   mu
      unexpected            :   unex


# RB SESSION ACTIONS
# not comprehensive, but the other options are follow-on events from these:
"et":"rs","ev":"rd"
"et":"sb","ev":"show"
"et":"re"




# EVENT TOTALS
select et, count(et) from [events.data] where et != 't' and et != 'tm'  group by et;

# AVG SCROLL DEPTH
SELECT AVG(a.max_value) as avg_scroll_depth from 
    ( SELECT sts, pid, MAX(ev) as max_value from [events.data] e1 
     WHERE gid = 1441 and et = 'sc' 
    group by sts, pid 
    ) a 


# RB AVG SCROLL DEPTH
SELECT AVG(a.max_value) as avg_scroll_depth from 
    ( SELECT sts, pid, MAX(ev) as max_value from [events.data] e1 
     WHERE gid = 1167 and et = 'sc' 
     and sts IN ( select sts from [events.data] e2 where gid = 1167 and (et = 're' OR (et = 'rs' and ev='rd')) ) 
    group by sts, pid 
    ) a 



select count(sts) as non_engaged_sessions_count 
from [events.test] 
where gid = 0 and sts [NOT] IN 
(select short_term_session from [events.test] where group_id = 0 and event_type != 'widget_load' group by short_term_session) 
group by short_term_session





SELECT AVG(a.max_value) as avg_scroll_depth from (SELECT short_term_session, page_id, MAX(event_value) as max_value from [events.test] WHERE group_id = 0 and event_type = 'scroll' group by short_term_session, page_id) a



# non engaged sessions?
var sql = "select count(distinct short_term_session) as non_engaged_sessions_count " +
"from events " +
"where group_id = "+group_id+" and short_term_session NOT IN" +
"(select distinct short_term_session from events where group_id = "+group_id+" and event_type != 'widget_load')";





