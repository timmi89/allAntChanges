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

# REFERRERS that used Antenna
# (not yet a most-engaged count)
select ref, count(et) evCount from [events.data] where gid = 1661 and (et = 're' OR (et = 'rs' and ev='rd') OR ( et='sb' and ev='show' )) group by ref
order by evCount DESC

# REFERRERS
select a.ref, a.wl_count, a.reaction_count, a.reaction_view_count, b.median_scroll, 
  ((a.reaction_count + a.reaction_view_count + b.median_scroll)/(a.wl_count+1.000)) as hotness
  from 
  (select ref
    , COUNT(CASE WHEN et = 'wl' THEN 1 END) AS wl_count
    , COUNT(CASE WHEN et = 're' THEN 1 END) AS reaction_count
    , COUNT(CASE WHEN ( (et = 'rs' and ev = 'rd') OR (et = 'sb' and ev = 'show')) THEN 1 END) AS reaction_view_count
      FROM [events.data] where gid = 1660 
      group by ref) as a 
  join 
  (select ref, avg(scroll_depth) as median_scroll from  
    (select sts, ref, MAX(ev) as scroll_depth from [events.data] 
     where et='sc' and gid = 1660 
     group by sts, ref )
  group by ref) as b
  on a.ref = b.ref
  where a.wl_count > 5 and a.reaction_count>0 
  order by hotness desc



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

select a.pid, a.wl_count, a.reaction_count, a.reaction_view_count, a.page_topics, b.median_scroll, 
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
  where a.wl_count > 5 and a.reaction_count>0 
  order by hotness desc
  
## NOT RIGHT NOW
 # join
 # (select pid, NTH(5, QUANTILES(timeDiff, 11)) as median_mseconds from [events.sessContentTimes] group by pid) as c
 # on a.pid = c.pid 
 # where a.wl_count > 5
 # order by hotness DESC
  
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
# NEW:
# TIME DIFF, no avg yet

#NO NTILE
  select avg(rdr_timeDiff) as rdr_avg_time, avg(timeDiff) as avg_time from 
    (
      select rdr_timeDiff from (
        select sts, (max(TIMESTAMP_TO_SEC(createdTime)) - min(TIMESTAMP_TO_SEC(createdTime))) as rdr_timeDiff 
        from (select sts, createdAt as createdTime FROM [events.data] where gid = 1660 and YEAR(createdAt)=2014 group by sts, createdTime)    
        where sts IN ( select sts from [events.data] where gid = 1660 and (et = 're' OR (et = 'rs' and ev='rd') OR ( et='sb' and ev='show' ) ) ) 
        group by sts
      ) where rdr_timeDiff > 0 and rdr_timeDiff < 1800
    ),
   (
      SELECT timeDiff from (
        select sts, (max(TIMESTAMP_TO_SEC(createdTime)) - min(TIMESTAMP_TO_SEC(createdTime))) as timeDiff 
        from (select sts, createdAt as createdTime FROM [events.data] where gid = 1660 and YEAR(createdAt)=2014 group by sts, createdTime)    
        group by sts
        ) where timeDiff > 0 and timeDiff < 1800
   )



## TAKE FIVE WIHT NTILE
select rdr_avg_time, avg_time from 
  (
  select avg(rdr_timeDiff) as rdr_avg_time from 
    (
    SELECT rdr_timeDiff, NTILE(100) OVER (order by rdr_timeDiff ASC) as rdr_ntile from 
      (
        select rdr_timeDiff from (
          select sts, (max(TIMESTAMP_TO_SEC(createdTime)) - min(TIMESTAMP_TO_SEC(createdTime))) as rdr_timeDiff 
          from (select sts, createdAt as createdTime FROM [events.data] where gid = 1660 and YEAR(createdAt)=2014 group by sts, createdTime)    
          where sts IN ( select sts from [events.data] where gid = 1660 and (et = 're' OR (et = 'rs' and ev='rd') OR ( et='sb' and ev='show' ) ) ) 
          group by sts
        ) where rdr_timeDiff > 0 and rdr_timeDiff < 2700
      )
    ) where rdr_ntile BETWEEN 20 and 80
   ),
   (
  select avg(timeDiff) as avg_time from 
    (
    SELECT timeDiff, NTILE(100) OVER (order by timeDiff ASC) as ntile from 
      (
        SELECT timeDiff from (
          select sts, (max(TIMESTAMP_TO_SEC(createdTime)) - min(TIMESTAMP_TO_SEC(createdTime))) as timeDiff 
          from (select sts, createdAt as createdTime FROM [events.data] where gid = 1660 and YEAR(createdAt)=2014 group by sts, createdTime)    
          group by sts
          ) where timeDiff > 0 and timeDiff < 2700
      )
    ) where ntile BETWEEN 20 and 80
   )



## TAKE FOUR -- No PID ##
select avg(timeDiff) as sessionTime from (
SELECT timeDiff, NTILE(100) OVER (order by timeDiff) as ntile from (

select sts, (max(TIMESTAMP_TO_SEC(createdTime)) - min(TIMESTAMP_TO_SEC(createdTime))) as timeDiff 
    from (select sts, createdAt as createdTime FROM [events.data] where gid = 1660 and YEAR(createdAt)=2014 group by sts, createdTime)    
    where sts IN ( select sts from [events.data] where gid = 1660 and (et = 're' OR (et = 'rs' and ev='rd') OR ( et='sb' and ev='show' ) ) ) 
    group by sts

    )
) where timeDiff > 0 and ntile BETWEEN 20 and 80;

## TAKE THREE -- uses PID ##
select avg(timeDiff) as sessionTime from (
SELECT timeDiff, NTILE(100) OVER (order by timeDiff) as ntile from (

select sts, pid, (max(TIMESTAMP_TO_SEC(createdTime)) - min(TIMESTAMP_TO_SEC(createdTime))) as timeDiff 
    from (select pid, sts, createdAt as createdTime FROM [events.data] where gid = 1660 and YEAR(createdAt)=2014 group by pid, sts, createdTime)    
    where sts IN ( select sts from [events.data] e2 where gid = 1660 and (et = 're' OR (et = 'rs' and ev='rd') OR ( et='sb' and ev='show' ) ) ) 
    group by sts, pid

    )
) where timeDiff > 0 and ntile BETWEEN 10 and 90



#################### 
#################### ref
#################### 
# outliers
# from http://jasonsouthwell.com/blog/removing-outliers-in-a-sql-server-query
-- select w.Gender, Avg(w.Weight) as AvgWeight
--     from ScaleData w
--     join ( select d.Gender, Avg(d.Weight) as AvgWeight, 
--                   2*STDEVP(d.Weight) StdDeviation
--              from ScaleData d
--             group by d.Gender
--          ) d
--       on w.Gender = d.Gender
--      and w.Weight between d.AvgWeight-d.StdDeviation 
--                       and d.AvgWeight+d.StdDeviation
--    group by w.Gender





-- select AVG(a.timeDiff) as avgTimeDiff 
--   from (
--     select sts, pid, (max(TIMESTAMP_TO_SEC(createdTime)) - min(TIMESTAMP_TO_SEC(createdTime))) as timeDiff 
--     from (select pid, sts, createdAt as createdTime FROM [events.data] where gid = 1167 group by pid, sts, createdTime)    
--     group by sts, pid
--     ) a
--   join (
--     select AVG(timeDiff) as avgTimeDiff, 2*STDDEV(timeDiff) StdDeviation from (
--         select sts, pid, (max(TIMESTAMP_TO_SEC(createdTime)) - min(TIMESTAMP_TO_SEC(createdTime))) as timeDiff 
--         from (select pid, sts, createdAt as createdTime FROM [events.data] where gid = 1167 group by pid, sts, createdTime)    
--         group by sts, pid
--       ) b
--     ) b
--   on a.timeDiff between b.avgTimeDiff-b.StdDeviation
--                     and b.avgTimeDiff+b.StdDeviation


#################### 



## TAKE TWO ##
select sts, pid, maxTime-minTime as timeDiff 
  from (

select sts, pid, max(TIMESTAMP_TO_SEC(createdTime)) as maxTime, min(TIMESTAMP_TO_SEC(createdTime)) as minTime  #, MINUTE(createdTime) as timeUnit
    from (select pid, sts, createdAt as createdTime FROM [events.data] where gid = 1167 group by pid, sts, createdTime)    
    group by sts, pid

    )

## TAKE ONE ##
select sts, pid, maxTime-minTime as timeDiff 
from (select sts, pid, max(createdTime) as maxTime, min(createdTime) as minTime 
from (select pid, sts, TIMESTAMP_TO_MSEC(createdAt) as createdTime FROM [events.data] where gid = 1660 and YEAR(createdAt)=2014 group by pid, sts, createdTime)
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





