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


# SESSION TOTALS
select sts, count(sts) from [events.data] where gid = 1660 group by sts

# AVG SCROLL DEPTH
SELECT AVG(a.max_value) as avg_scroll_depth from 
    ( SELECT sts, pid, MAX(ev) as max_value from [events.data] e1 
     WHERE gid = 1660 and et = 'sc' 
    group by sts, pid 
    ) a 


# RB AVG SCROLL DEPTH
SELECT AVG(a.max_value) as avg_scroll_depth from 
    ( SELECT sts, pid, MAX(ev) as max_value from [events.data] e1 
     WHERE gid = 1660 and et = 'sc' 
     and sts IN ( select sts from [events.data] e2 where gid = 1660 and (et = 're' OR (et = 'rs' and ev='rd') OR ( et='sb' and ev='show' ) ) ) 
    group by sts, pid 
    ) a 


# avg page loads
select (avg(loadCount)) from 
(select sts, GROUP_CONCAT(STRING(pid)) as pid_list, count(pid) as loadCount
from [events.data] where et='wl' and gid = 1660 
group by sts
order by loadCount DESC);

# avg RDR page loads
select (avg(loadCount)) from 
(select sts, GROUP_CONCAT(STRING(pid)) as pid_list, count(pid) as loadCount
from [events.data] where et='wl' and gid = 1660 
  and sts IN ( select sts from [events.data] e2 where gid = 1660 and (et = 're' OR (et = 'rs' and ev='rd') OR ( et='sb' and ev='show' )) ) 
group by sts
order by loadCount DESC);

# REFERRERS
select ref, count(et) evCount from [events.data] where gid = 1661 and (et = 're' OR (et = 'rs' and ev='rd') OR ( et='sb' and ev='show' )) group by ref
order by evCount DESC






### NEXT

## CREATE TABLE:  RDR sessions
/initAnalytics
select sts from [events.data] where gid = 1660 and (et = 're' OR (et = 'rs' and ev='rd') OR ( et='sb' and ev='show' )) group by sts
####DONE

## CREATE TABLE:  session_pageLoads
## GIVES ME: avg page views per rdr session
## "this session load pages from this list, a total of N times"
/createSessionPageloads

select sts, GROUP_CONCAT(STRING(pid)) as pid_list, count(pid) as loadCount
from [events.data] where et='wl' and gid = 1660 
group by sts
order by loadCount DESC;

## CREATE TABLE:  pageloads_with_sessionList
## NEED?????  it creates some massively ugly columns
## "this session load pages from this list, a total of N times"
####
#     select pid, GROUP_CONCAT(sts) as sts_list, count(pid) as loadCount
#     from [events.data] where et='wl' and gid = 1660 
#     group by pid
#     order by loadCount DESC;
####

## event totals
select et, count(ev) as event_count from [events.data] where gid = 1660 group by et

## NON-RDR sessions
-- select sts from [events.data] where gid = 1660 and sts 
-- not in (select sts from [events.data] where gid = 1660 and (et = 're' OR (et = 'rs' and ev='rd') OR ( et='sb' and ev='show' )) group by sts)
-- group by sts

# PAGE COUNTS, broken out by session type.  should they be?
# NEEDS pvs, scroll depth

select a.pid, a.wl_count, a.reaction_count, a.reaction_view_count, a.page_topics, b.median_scroll, c.median_mseconds, 
  ((a.reaction_count + a.reaction_view_count + b.median_scroll)/(a.wl_count+1.000)) as hotness
  from 
  (select pid
    , COUNT(CASE WHEN et = 'wl' THEN 1 END) AS wl_count
    , LAST(CASE WHEN et = 'wl' THEN ptop END) AS page_topics
    , COUNT(CASE WHEN et = 're' THEN 1 END) AS reaction_count
    #, COUNT(CASE WHEN et = 'sc' THEN 1 END) AS scroll_count
    , COUNT(CASE WHEN ( (et = 'rs' and ev = 'rd') OR (et = 'sb' and ev = 'show')) THEN 1 END) AS reaction_view_count
      FROM [events.data] where gid = 1660 
      # and sts IN ( select sts from [events.rdrSessions] group by sts )
      group by pid) as a 
  join 
  (select pid, avg(scroll_depth) as median_scroll from  
    (select sts, pid, MAX(ev) as scroll_depth from [events.data] 
     where et='sc' and gid = 1660 
     # and sts IN ( select sts from [events.rdrSessions] group by sts )
     group by sts, pid )
  group by pid) as b
  on a.pid = b.pid
  join
  (select pid, NTH(5, QUANTILES(timeDiff, 11)) as median_mseconds from [events.sessContentTimes] group by pid) as c
  on a.pid = c.pid 
  where a.wl_count > 5
  order by hotness DESC
  
  -- join
  -- (select avg(loadCount) from 
  --   (select pid_list, loadCount from [events.session_pageLoads]
  --   where pid_list CONTAINS '634702') as c 
  -- group by sts, loadCount)) as C



## WORKING ON PAGE COUNT
## by page_id.  WORKS but unsure how to stuff into engagedPages
##### perhaps via additional ajax call for now.
select avg(loadCount) from 
(select sts, loadCount from [events.session_pageLoads]
where pid_list CONTAINS '634702'
#and sts NOT IN ( select sts from [events.rdrSessions] group by sts )
group by sts, loadCount)




  -- , avg(loadCount) from (select sts, count(pid) as loadCount from [events.rdrSession_pageLoads] group by sts order by loadCount DESC)


SELECT AVG(a.max_value) as avg_scroll_depth from 
    ( SELECT sts, pid, MAX(ev) as max_value from [events.data] e1 
     WHERE gid = 1660 and et = 'sc' 
    group by sts, pid 
    ) a


-- select pid, sts FROM [events.data] where gid = 1660 order by TIMESTAMP_TO_MSEC(createdAt) ASC limit 1
# event create times by session, pid
-- select sts, pid, max(createdTime) as maxTime, min(createdTime) as minTime 
-- from (select pid, sts, TIMESTAMP_TO_MSEC(createdAt) as createdTime FROM [events.data] where gid = 1660 group by pid, sts, createdTime DESC)



## CREATE TABLE: sessionContentTimes
select sts, pid, maxTime-minTime as timeDiff 
from (select sts, pid, max(createdTime) as maxTime, min(createdTime) as minTime 
from (select pid, sts, TIMESTAMP_TO_MSEC(createdAt) as createdTime FROM [events.data] where gid = 1660 group by pid, sts, createdTime)
group by sts, pid)
group by sts, pid, timeDiff
having timeDiff > 0
order by timeDiff ASC

# QUERY TABLE: MEDIAN TIME.  
# already filtered by group ID at table create time
## median time, all sessions
select NTH(5, QUANTILES(timeDiff, 11)) as median_mseconds from [events.sessContentTimes]


## STILL NEED
# AVG PAGEVIEWS
# TOPICS





#### USEFUL....  for the session query
# RB AVG SCROLL DEPTH
SELECT AVG(a.max_value) as avg_scroll_depth from 
    ( SELECT sts, pid, MAX(ev) as max_value from [events.data] e1 
     WHERE gid = 1660 and et = 'sc' 
     and sts IN ( select sts from [events.data] e2 where gid = 1660 and (et = 're' OR (et = 'rs' and ev='rd') OR ( et='sb' and ev='show' )) ) 
    group by sts, pid 
    ) a 




#### FAIL TO GET GROUP SUMMARIES
select SUM(a.wl_count) wl, SUM(a.reaction_count) rc, SUM(a.reaction_view_count) rvc, NTH(5, QUANTILES(b.median_scroll,11)) as ms, NTH(5, QUANTILES(c.median_mseconds,11)) as mm from (
select a.pid, a.wl_count, a.reaction_count, a.reaction_view_count, a.page_topics, b.median_scroll, c.median_mseconds, 
  ((a.reaction_count + a.reaction_view_count + b.median_scroll)/(a.wl_count+1.000)) as hotness
  from 
  (select pid
    , COUNT(CASE WHEN et = 'wl' THEN 1 END) AS wl_count
    , LAST(CASE WHEN et = 'wl' THEN ptop END) AS page_topics
    , COUNT(CASE WHEN et = 're' THEN 1 END) AS reaction_count
    , COUNT(CASE WHEN ( (et = 'rs' and ev = 'rd') OR (et = 'sb' and ev = 'show')) THEN 1 END) AS reaction_view_count
      FROM [events.data] where gid = 1660 
      # and sts IN ( select sts from [events.rdrSessions] group by sts )
      group by pid) as a 
  join 
  (select pid, avg(scroll_depth) as median_scroll from  
    (select sts, pid, MAX(ev) as scroll_depth from [events.data] 
     where et='sc' and gid = 1660 
     # and sts IN ( select sts from [events.rdrSessions] group by sts )
     group by sts, pid )
  group by pid) as b
  on a.pid = b.pid
  join
  (select pid, NTH(5, QUANTILES(timeDiff, 11)) as median_mseconds from [events.sessContentTimes] group by pid) as c
  on a.pid = c.pid 
  where a.wl_count > 5
  order by hotness DESC
  )








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





