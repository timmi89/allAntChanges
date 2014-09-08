ajax to call to Node with gid

queryQueue[]
create UID on server in first call from queue


queryOrder
  create rdr_sessions
  init what else to get..
    group summaries
    rdr vs non-rdr summaries

    tables
      _rdrSessions
        sts: eb8a793f-8373-4a2a-87c6-5d6e05d3bd87

      _pageLoads
        sts:eb8a793f-8373-4a2a-87c6-5d6e05d3bd87, pid_list:191226,191226,191226,191226,191226,191226, loadCount: 6 

      _sessionPageTimes
        sts:328ad7a1-5476-4f24-8d06-229d6374c873, pid:638085, timeDiff:1000


ddd_demo_c5be086e5f514748822549bc3ebe93db_sessionPageTimes
ddd_demo_c5be086e5f514748822549bc3ebe93db_rdrSessions



  /summaries
  /rdrComparison
  /popularReactions
    "select ev, count(ev) as reaction_count from [events.data] where et='reaction' and gid = gid and ev IS NOT NULL group by ev"
  /popularPages  (page info, popular topics)



DASHBOARD INIT create these tables
  // widget loads only
  RDR_SESSION_ID  PID       where widget_load


  groupname_date_ PAGE COUNTS


  // widget loads only
  // DO WE NEED THIS, OR ALWAYS JSUT DO NOT IN?
  // NON_RDR_SESSION_ID  PID   where widget_load

  // all events & session types
  temp_fastcolabs_sessionPageTimes_IDENTIFIER:  SESSION_ID   PID   createdTime


TIDY UP
  re-enable datepicker
  uncomment in analytics.html RB.group.id = {{ group.id }}

OPEN QUESTIONS
  What is hotness?
