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
      time          :     ti

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


# PAGE NAMES
mydata.people20140325

events.SHORTNAME20140325


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



### DEFINITELY GOOD

## RDR sessions
select sts from [events.data] where gid = 1167 and (et = 're' OR (et = 'rs' and ev='rd')) group by sts

## NON-RDR sessions
select sts from [events.data] where gid = 1167 and sts 
not in (select sts from [events.data] where gid = 1167 and (et = 're' OR (et = 'rs' and ev='rd')) group by sts)
group by sts

# PAGE COUNTS, broken out by session type.  should they be?
# NEEDS pvs, scroll depth

select a.pid, a.wl_count, a.reaction_count, a.reaction_view_count, b.avg_scroll_depth from 
  (select pid
    , COUNT(CASE WHEN et = 'wl' THEN 1 END) AS wl_count
    , COUNT(CASE WHEN et = 're' THEN 1 END) AS reaction_count
    , COUNT(CASE WHEN ( (et = 'rs' and ev = 'rd') OR (et = 'sb' and ev = 'show')) THEN 1 END) AS reaction_view_count
      FROM [events.data] where gid = 1167 
      and sts IN ( select sts from [events.rdrSessions] group by sts )
      group by pid) as a 
  join 
  (select pid, AVG(max_value) as avg_scroll_depth from 
    ( SELECT sts, pid, MAX(ev) as max_value from [events.data]
     WHERE gid = 1167 and et = 'sc' 
     and sts IN ( select sts from [events.rdrSessions] group by sts )
    group by sts, pid 
    ) group by pid ) b
  on a.pid = b.pid;

  -- , avg(loadCount) from (select sts, count(pid) as loadCount from [events.rdrSession_pageLoads] group by sts order by loadCount DESC)


SELECT AVG(a.max_value) as avg_scroll_depth from 
    ( SELECT sts, pid, MAX(ev) as max_value from [events.data] e1 
     WHERE gid = 1167 and et = 'sc' 
     and sts IN ( select sts from [events.data] e2 where gid = 1167 and (et = 're' OR (et = 'rs' and ev='rd')) ) 
    group by sts, pid 
    ) a 


-- select pid, sts FROM [events.data] where gid = 1167 order by TIMESTAMP_TO_MSEC(createdAt) ASC limit 1
# event create times by session, pid
-- select sts, pid, max(createdTime) as maxTime, min(createdTime) as minTime 
-- from (select pid, sts, TIMESTAMP_TO_MSEC(createdAt) as createdTime FROM [events.data] where gid = 1167 group by pid, sts, createdTime DESC)

## sessionContentTimes
select sts, pid, maxTime-minTime as timeDiff 
from (select sts, pid, max(createdTime) as maxTime, min(createdTime) as minTime 
from (select pid, sts, TIMESTAMP_TO_MSEC(createdAt) as createdTime FROM [events.data] where gid = 1167 group by pid, sts, createdTime)
group by sts, pid)
group by sts, pid, timeDiff
having timeDiff > 0
order by timeDiff ASC

# MEDIAN TIME
select NTH(50, QUANTILES(timeDiff, 101)) as median_seconds from [events.sessContentTimes]


## STILL NEED
# AVG PAGEVIEWS
# TOPICS



#### USEFUL....  for the session query
# RB AVG SCROLL DEPTH
SELECT AVG(a.max_value) as avg_scroll_depth from 
    ( SELECT sts, pid, MAX(ev) as max_value from [events.data] e1 
     WHERE gid = 1167 and et = 'sc' 
     and sts IN ( select sts from [events.data] e2 where gid = 1167 and (et = 're' OR (et = 'rs' and ev='rd')) ) 
    group by sts, pid 
    ) a 





############## OLD
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





