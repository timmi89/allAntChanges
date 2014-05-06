DASHBOARD INIT create these tables
  groupname_date_ PAGE COUNTS

  // widget loads only
  RDR_SESSION_ID  PID       where widget_load

  // widget loads only
  NON_RDR_SESSION_ID  PID   where widget_load

  // all events & session types
  temp_fastcolabs_sessionContentTimes_IDENTIFIER:  SESSION_ID   PID   createdTime
