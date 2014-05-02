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



select count(short_term_session) as non_engaged_sessions_count 
from [events.test] 
where group_id = 0 and short_term_session NOT IN 
(select short_term_session from [events.test] where group_id = 0 and event_type != 'widget_load' group by short_term_session) 
group by short_term_session





SELECT AVG(a.max_value) as avg_scroll_depth from (SELECT short_term_session, page_id, MAX(event_value) as max_value from [events.test] WHERE group_id = 0 and event_type = 'scroll' group by short_term_session, page_id) a



# non engaged sessions?
var sql = "select count(distinct short_term_session) as non_engaged_sessions_count " +
"from events " +
"where group_id = "+group_id+" and short_term_session NOT IN" +
"(select distinct short_term_session from events where group_id = "+group_id+" and event_type != 'widget_load')";