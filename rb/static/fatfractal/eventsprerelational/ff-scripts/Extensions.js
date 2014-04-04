var print = print;
var require = require;
var exports = exports;

var ff = require('ffef/FatFractal');

function Events(data) {
    this.clazz = "Events";
    this.site_name = data.site_name;
    this.site_tld = data.site_tld;
    this.site_id = data.site_id;
    this.page__id = data.page__id;
    this.page_title = data.page_title;
    this.page_url = data.page_url;
    this.page_topics = data.page_topics;
    this.referrer = data.referrer;
    this.session_id = data.session_id;
    this.user = data.user;
    this.content_type = data.content_type;
    this.content = data.content;

    this.event_type = data.event_type;
    this.event_value = data.event_value;
    this.event_parent = data.event_parent;

    return this;
}

function Topics(data) {
    this.clazz = "Topics";
    this.tag = data.tag;

    return this;
}

function Content(data) {
    this.clazz = "Content";
    this.tag = data.tag;
    this.page__id = data.page__id;
    this.page_title = data.page_title;
    this.canonical_url = data.canonical_url;
    this.site_id = data.site_id;
    this.content_type = data.content_type;

    return this;
}


// GARY!
exports.getEventCounts = function() {
    var result = [];
    // var array_count = ff.getArrayFromUri('/Events').length;
    // result.push({ array_count:array_count });

    var total_count = ff.getResultCountForQuery('/Events');
    var reaction_count = ff.getResultCountForQuery("/Events/(event_type eq 'reaction')");
    var scroll_count = ff.getResultCountForQuery("/Events/(event_type eq 'scroll')");
    var content_reaction_view_count = ff.getResultCountForQuery("/Events/(event_type eq 'rindow_show' and event_value eq 'readmode')");
    var summarybar_view_count = ff.getResultCountForQuery("/Events/(event_type eq 'summary bar' and event_value eq 'view reactions')");
    var load_count = ff.getResultCountForQuery("/Events/(event_type eq 'widget_load')");
    result.push({ total_count: total_count, reaction_count:reaction_count, summarybar_view_count:summarybar_view_count, content_reaction_view_count:content_reaction_view_count, scroll_count:scroll_count, load_count:load_count });
    ff.response().result = result;
};


exports.getMostScrolled = function() {
    var sql;
    var result = [];

    // avg scroll depth.  convert from string to int then average the values
    sql = "SELECT AVG(CAST(event_value as int)) as scroll_depth, page__id FROM Events where event_type = 'scroll' group by page__id order by scroll_depth DESC";
    result.push({sql:sql,results:ff.executeSQL(sql)});
    ff.response().result = result;

};

exports.getMostLoaded = function() {
    var sql;
    var result = [];

    sql = "SELECT COUNT(CASE WHEN event_type = 'widget_load' THEN 1 END) AS widget_load, page__id FROM Events group by page__id order by widget_load DESC";
    result.push({sql:sql,results:ff.executeSQL(sql)});
    ff.response().result = result;

};


// testing for getMostEngagedPages with PVs/session added.  once we get this right, we don't need both.
// GARY!
// this is probably the hairiest/slowest query?  it's the most important, and almost everything else would be a subset of this
exports.getMostEngagedPagesWithPVs = function() {
    var sql;
    var result = [];

    // grab everything -- raw counts, and the doozy:  avg pageviews per session that viewed a certain page!
    // queyr help via http://stackoverflow.com/questions/22747343/inner-join-on-same-table-with-avg/22748347
    sql = "select distinct a.page__id, a.num_ses, avg(cast(c.num_pg_ld_sespg as decimal(10,8))) as avg_ses_pg_exist "
          + ", a.widget_load_count, a.reaction_count, a.reaction_view_count, a.scroll_count, a.scroll_depth, a.facebook_referrals, a.twitter_referrals "
          + ", ((a.reaction_count + a.reaction_view_count + a.scroll_count + avg(cast(c.num_pg_ld_sespg as decimal(10,8))))/(a.widget_load_count+1.000)) as hotness "
          + "from (select page__id "
                + ", COUNT(distinct session_id) as num_ses "
                + ", COUNT(CASE WHEN event_type = 'widget_load' THEN 1 END) AS widget_load_count "
                + ", COUNT(CASE WHEN event_type = 'reaction' THEN 1 END) AS reaction_count "
                + ", COUNT(CASE WHEN event_type = 'reaction_view' THEN 1 END) AS reaction_view_count "
                + ", COUNT(CASE WHEN event_type = 'scroll' THEN 1 END) AS scroll_count "
                + ", AVG(CASE WHEN event_type = 'scroll' THEN CAST(event_value as int) END) as scroll_depth " 
                + ", COUNT(CASE WHEN referrer = 'facebook' THEN 1 END) AS facebook_referrals "
                + ", COUNT(CASE WHEN referrer = 'twitter' THEN 1 END) AS twitter_referrals "
                  + "from Events "
                  + "group by page__id) a, "
               + "(select session_id, count(event_type) as num_pg_ld_ses "
                  + "from Events "
                  + "where event_type = 'widget_load' "
                  + "group by session_id) b, "
               + "(select session_id, page__id, count(event_type) as num_pg_ld_sespg "
                  + "from Events "
                  + "where event_type = 'widget_load' "
                  + "group by session_id, page__id) c "
         + "where a.page__id = c.page__id "
           + "and b.session_id = c.session_id "
           // + "and a.session_id = 1 "  // filter to the site
         + "group by a.page__id, a.num_ses, a.widget_load_count, a.reaction_count, a.reaction_view_count, a.scroll_count, a.scroll_depth, a.facebook_referrals, a.twitter_referrals " //, c.num_pg_ld_sespg " //, d.reaction_count "
         + "order by hotness DESC ";


    result.push({sql:sql,results:ff.executeSQL(sql)});

    // now, sort / count the PageTopics tags
    // GARY!  NOTE:  tags are stored as "tag1, tag2" in a field.  rather than trying to create grabbags, I thought I'd do it in code
    // by iterating through results, and multipling each tag by that page's engagement score (hotness), creating an array of most-popular-tags like
    // [ ['putin',40], ['russia',39], ['broncos',21] ];
    // --> CAN I DO THIS IN SQL? 
    // --> is this better than the grabbag, since this won't be run very often?  this is only run when viewing a dashboard, at least for now
    
    // porter: see engage_full.js for array sorting code.

    ff.response().result = result;

};


// NOT DONE YET
// make this like getMostEngagedPagesWithPVs, but for content_id
// or keep it simple:  COUNT(reactions) + COUNT(reaction_views)
exports.getContentWithMostPVs = function() {
    var sql;
    var result = [];

    sql = "SELECT "
            + "session_id, page__id, "
            + ", COUNT(CASE WHEN event_type = 'widget_load' THEN 1 END) AS widget_load_count "
    //         + ", COUNT(CASE WHEN event_type = 'reaction' THEN 1 END) AS reaction_count "
    //         + ", COUNT(CASE WHEN event_type = 'reaction_view' THEN 1 END) AS reaction_view_count "
    //         + ", COUNT(CASE WHEN event_type = 'scroll' THEN 1 END) AS scroll_count "
    //         + ", AVG(CASE WHEN event_type = 'scroll' THEN CAST(event_value as int) END) as scroll_depth " 
    //         + ", COUNT(CASE WHEN referrer = 'facebook' THEN 1 END) AS facebook_referrals "
    //         + ", COUNT(CASE WHEN referrer = 'twitter' THEN 1 END) AS twitter_referrals "
            
            + "FROM Events " 
            + "group by session_id, page__id ";   // order by (engagement_rate) DESC

    result.push({sql:sql,results:ff.executeSQL(sql)});
    ff.response().result = result;

};

// GARY!
exports.getPopularReactions = function() {
    var sql;
    var result = [];

    sql = "SELECT event_value as reaction, count(event_value) as reaction_count FROM Events WHERE site_id = 1 and event_type = 'reaction' order by reaction_count DESC"; 
    result.push({sql:sql,results:ff.executeSQL(sql)});
    ff.response().result = result;
};

// how many user sessions used ReadrBoard?
// how many didn't?
// what's the AVG(scrolling-down-the-page) in each session type?
// also, I can probably simplify this using similar subqueries like in getMostEngagedPagesWithPVs
// GARY!
exports.getEngagedSessionTotals = function() {
    var sql;
    var result = [];


    // CAN I MAKE THESE TWO QUERIES BECOME ONE USING 'FULL OUTER JOIN' ?
            // http://blog.codinghorror.com/a-visual-explanation-of-sql-joins/
            // SELECT * FROM TableA
            // FULL OUTER JOIN TableB
            // ON TableA.name = TableB.name
            // WHERE TableA.id IS null
            // OR TableB.id IS null

    
    // sessions with widget_load, scroll but no reaction and reaction_view
    // GARY: I've read "not in()" can be quite slow, whereas in() uses indices.  if true, this query should change methinks.
    var no_readr_sessions_sql = "SELECT "  // DISTINCT is ok.  seems to sort alphabetically
            + "session_id "
            + ", COUNT(CASE WHEN event_type = 'widget_load' THEN 1 END) AS widget_load_count "
            + "FROM Events WHERE event_type = 'widget_load' and session_id not in (select distinct session_id from Events where event_type = 'reaction' or event_type = 'reaction_view') "
            + "group by session_id";

    // sessions with reaction and/or reaction_view
    var readr_sessions_sql = "SELECT DISTINCT "  // DISTINCT is ok.  seems to sort alphabetically
            + "session_id "
            + ", COUNT(CASE WHEN event_type = 'widget_load' THEN 1 END) AS widget_load_count "
            // + "from Events where event_type = 'reaction' or event_type = 'reaction_view' "
            + "FROM Events WHERE event_type = 'widget_load' and session_id in (select distinct session_id from Events where event_type = 'reaction' or event_type = 'reaction_view') "
            + "group by session_id";

    // var total_widget_loads = ff.executeSQL(total_widget_loads)[0]['WIDGET_LOAD_COUNT'];
    var nonReadrBoard = ff.executeSQL(no_readr_sql);
    var ReadrBoard = ff.executeSQL(readr_sql);


    if (nonReadrBoard.length) {
        var nonReadrBoard_session_ids = "";
        var nonReadrBoard_session_widget_load_count = 0;
        for (var i in nonReadrBoard) {
            nonReadrBoard_session_ids += "'" + nonReadrBoard[i].SESSION_ID + "', ";
            nonReadrBoard_session_widget_load_count += nonReadrBoard[i].WIDGET_LOAD_COUNT;
        }
        nonReadrBoard_session_ids = nonReadrBoard_session_ids.substring(0, nonReadrBoard_session_ids.length-2);

        var no_readr_scroll_depth_sql = "SELECT "
                + "AVG(CASE WHEN event_type = 'scroll' THEN CAST(event_value as int) END) as scroll_depth "
                + "FROM Events where session_id in(" + nonReadrBoard_session_ids + ")";

        var nonReadrScrollAvg = ff.executeSQL(no_readr_scroll_depth_sql)[0]['SCROLL_DEPTH'];
    } else {
        nonReadrBoard_session_widget_load_count = 0;
        var nonReadrScrollAvg = 0;
    }



    if (ReadrBoard.length) {
        var ReadrBoard_session_ids = "";
        var ReadrBoard_session_widget_load_count = 0;
        for (var i in ReadrBoard) {
            ReadrBoard_session_ids += "'" + ReadrBoard[i].SESSION_ID + "', ";
            ReadrBoard_session_widget_load_count += ReadrBoard[i].WIDGET_LOAD_COUNT;
        }
        ReadrBoard_session_ids = ReadrBoard_session_ids.substring(0, ReadrBoard_session_ids.length-2);

        var readr_scroll_depth_sql = "SELECT "
                + "AVG(CASE WHEN event_type = 'scroll' THEN CAST(event_value as int) END) as scroll_depth "
                + "FROM Events where session_id in(" + ReadrBoard_session_ids + ")";

        var ReadrScrollAvg = ff.executeSQL(readr_scroll_depth_sql)[0]['SCROLL_DEPTH'];
    } else {
        ReadrBoard_session_widget_load_count = '0';
        var ReadrScrollAvg = 0;
    }

    result.push({nonReadrBoard_session_widget_load_count:nonReadrBoard_session_widget_load_count,ReadrBoard_session_widget_load_count:ReadrBoard_session_widget_load_count,nonReadrBoard_sessions:nonReadrBoard.length,ReadrBoard_sessions:ReadrBoard.length,nonReadrScrollAvg:nonReadrScrollAvg,ReadrScrollAvg:ReadrScrollAvg});
    ff.response().result = result;

};

// GARY!
// while this duplicates some data, it would hopefully be the first/fastest query run to begin populating the dashboard for the user
exports.getGroupAggregate = function() {
    var sql;
    var result = [];

    // try to get 'most engaged'
    sql = "SELECT "
            // + "site_id "
            + "COUNT(CASE WHEN event_type = 'widget_load' THEN 1 END) AS widget_load_count "
            + ", COUNT(CASE WHEN event_type = 'reaction' THEN 1 END) AS reaction_count "
            + ", COUNT(CASE WHEN event_type = 'reaction_view' THEN 1 END) AS reaction_view_count "
            + ", COUNT(CASE WHEN event_type = 'scroll' THEN 1 END) AS scroll_count "
            + ", AVG(CASE WHEN event_type = 'scroll' THEN CAST(event_value as int) END) as scroll_depth " 

            + "FROM Events WHERE site_id = 1 "  //  or site_id = 2 
            // + "group by page__id, site_id order by ((reaction_count + reaction_view_count + scroll_count)/(widget_load_count+1.0)) DESC ";   // order by (engagement_rate) DESC

    result.push({sql:sql,results:ff.executeSQL(sql)});
    ff.response().result = result;

};

// GARY!
// will timestampdiff work?  it should, yes?
exports.timeSiteAvg = function() {
    var sql;
    var result = [];

    // query pseudocode:
    /*
        SELECT AVG(TIMESTAMPDIFF(SECOND, first_session_event_timestamp, last_session_event_timestamp ) ) as avg_session
            where
                subqueries to get all of the first/last timestamps for each unique short_session_id
                by site_id

    */
};

// GARY!
exports.getPopularBrowsers = function() {
    var sql;
    var result = [];

    // query pseudocode:
    // var chrome_count = ff.getResultCountForQuery("/Events/(user_agent contains_any 'Chrome')");
    // etc for each UA we check.
    // this will be called pretty rarely
};










////////// testing and such

exports.writeGrabbagsCron = function() {
/*
DEPRECATED BY TAG ITERATION IN getMostEngagedPagesWithPVs?
*/

    var sql;
    var result = [];

    // query for pages and topics
    // WORKS: sql = "SELECT DISTINCT page__id, page_topics FROM Events where page_topics != '' group by page__id, page_topics";  //  
    // result.push({sql:sql,results:ff.executeSQL(sql)});

    // select all pages in the last 5 minutes
    sql = "SELECT DISTINCT * FROM Events where site_id = 1";
    // sql = "SELECT DISTINCT page__id, page_topics FROM Events where page__id = '1010'";
    result.push({sql:sql,results:ff.executeSQL(sql)});

    var sqlResponse = ff.executeSQL(sql);

    var pagesFromRecentEvents = {}; // store the results for displaying in browser

    // iterate through and create a map of page__id and unique topic tags
    for ( var i in sqlResponse ) {

        var item = sqlResponse[i];

        // does pagesFromRecentEvents[1000] for page_id 1000 exist yet?
        if ( pagesFromRecentEvents[item.PAGE__ID] == undefined ) {
            pagesFromRecentEvents[item.PAGE__ID] = [];
        }

        var topics = item.PAGE_TOPICS.split(',');

        for (var j in topics) {
            var tag = topics[j].trim();
            if ( tag.length >= 1 && pagesFromRecentEvents[item.PAGE__ID].indexOf(tag) == -1 ) {
                pagesFromRecentEvents[item.PAGE__ID].push(tag);
            }
        }
    }
    result.push(pagesFromRecentEvents);

    var ffPageQuery = "page__id contains_any '";
    for ( var pageId in pagesFromRecentEvents ) {
        ffPageQuery += pageId+' '
    }
    ffPageQuery += "'";

    var existingContent = ff.getArrayFromUri("/Content/("+ffPageQuery+")");

    // NOW DO THE WRITE
    // ff.grabBagAdd(dawn, steve, "siblings",
    //     function (obj) {
    //         // success
    //     }
    // );
    // ...
    // to get'em later, something like
    // get Steve's mom's siblings
    //  ff.grabBagGetAll(mom.ffUrl, "siblings",
    //     function (array) {
    //         var auntsAndUncles = array;
    //     }
    // );
    
    result.push({'existing content count':existingContent.length});    

    ff.response().result = result;

};

exports.getEvents = function() {
    var result = [];
    var sql;


    // start WORKS!

    // GLOBAL QUERIES

    // PAGE LEVEL QUERIES
    sql = "SELECT * FROM Events WHERE page__id = '1002'";   
    // result.push({sql:sql,results:ff.executeSQL(sql)});

    // distinct reactions
    // sql = "SELECT DISTINCT event_value FROM Events WHERE page_id = 4213";
    
    // list of reactions, ordered by count from most to least
    // sql = "SELECT event_value as event_value FROM Events WHERE page_id = 3112 and event_type = 'reaction'"; // , count(*) as event_value_count FROM Events"; // WHERE event_type = 'reaction' order by count(*) DESC"; 
    // sql = "select * from Events where o_value like '%:4213%'";
    // sql = "SELECT count(*) FROM Events WHERE page_id = 4213 and event_type = 'reaction'";

    // list of event types, from most to least, for a given site
    // sql = "SELECT event_type as event_type, count(*) as event_type_count FROM Events WHERE site_id = 4 group by event_type order by count(*) DESC"; 

    // avg scroll depth.  convert from string to int then average the values
    // sql = "SELECT AVG(CAST(event_value as int)) as scroll_depth FROM Events where event_type = 'scroll'";

    // end WORKS!

    // experimenting
    // sql = "";

    // from Gary.  these work.
   // sql = "select count(*) from Events";
   // result.push({sql:sql,results:ff.executeSQL(sql)});

   // sql = "select * from Events where page__id = '5544'";
   // result.push({sql:sql,results:ff.executeSQL(sql)});

   // sql = "select page__id, count(*) as eventcount from Events group by page__id order by eventcount desc";
   // result.push({sql:sql,results:ff.executeSQL(sql)});
   // end from Gary



    // topic tag breakout?
    // date-restricted queries?
    // page views per session?   unique widget load page_id by session_id right?

    result.push({sql:sql,results:ff.executeSQL(sql)});

    ff.response().result = result;
};

exports.testStuff = function() {
    requestData = ff.getExtensionRequestData();

    // ip_address:requestData['httpHeaders']['X-Forwarded-For']
    // user_agent:requestData['httpHeaders']['User-Agent']


    var result = [];
    result.push({ requestData:requestData });

    ff.response().result = result;

}


exports.runSomeSql = function() {
    var result = [];
    var sql;

    // sql = "select * from TYPEONE order by NUMERICONE";
    // result.push({sql:sql,results:ff.executeSQL(sql)});

    // sql = "select * from TYPETWO order by NUMERICTWO DESC";
    // result.push({sql:sql,results:ff.executeSQL(sql)});

    sql = "select STRINGONE, count(*) from TYPEONE group by STRINGONE";
    result.push({sql:sql,results:ff.executeSQL(sql)});

    // sql = "select NUMERICONE, count(*) from TYPEONE group by NUMERICONE";
    // result.push({sql:sql,results:ff.executeSQL(sql)});

    // sql = "select * from JOIN_TYPETWO_GB_TYPEONES_TO_TYPEONE";
    // result.push({sql:sql,results:ff.executeSQL(sql)});

    // sql = "select * from TYPETWO, TYPEONE where TYPETWO.REF_TYPEONE = TYPEONE.O_KEY";
    // result.push({sql:sql,results:ff.executeSQL(sql)});

    ff.response().result = result;
};


exports.getMostEngagedPages = function() {
    var sql;
    var result = [];

    // try to get 'most engaged'
    // LOOK UP HOTNESS ALOGIRTHM from reddit etc
    sql = "SELECT "
            + "  page__id as PageID, page_title as PageTitle, site_id as SiteID, page_topics as PageTopics "
            + ", COUNT(CASE WHEN event_type = 'widget_load' THEN 1 END) AS widget_load_count "
            + ", COUNT(CASE WHEN event_type = 'reaction' THEN 1 END) AS reaction_count "
            + ", COUNT(CASE WHEN event_type = 'reaction_view' THEN 1 END) AS reaction_view_count "
            + ", COUNT(CASE WHEN event_type = 'scroll' THEN 1 END) AS scroll_count "
            + ", AVG(CASE WHEN event_type = 'scroll' THEN CAST(event_value as int) END) as scroll_depth " 
            + ", COUNT(CASE WHEN referrer = 'facebook' THEN 1 END) AS facebook_referrals "
            + ", COUNT(CASE WHEN referrer = 'twitter' THEN 1 END) AS twitter_referrals "

            // get session IDs where page__id = PageID
            // + ", ( SELECT DISTINCT b.session_id FROM Events b WHERE b.event_type = 'widget_load' ) as SessionIDs "
            // + "FROM Events WHERE event_type = 'widget_load'

            
            + "FROM Events "  // WHERE site_id = 1 or site_id = 2 
            + "group by PageID, PageTitle, SiteID, PageTopics order by ((reaction_count + reaction_view_count + scroll_count)/(widget_load_count+1.0)) DESC ";   // order by (engagement_rate) DESC

            // couldn't get SQL division to work apart from in the ORDER BY.  was referencing
            // http://stackoverflow.com/questions/9040787/how-to-do-addition-and-division-of-aliased-columns-in-a-query

    result.push({sql:sql,results:ff.executeSQL(sql)});

    // now, sort / count the PageTopics tags
    // by iterating through results, and multipling each tag by that page's engagement score, creating an array of scores like
    // [ ['putin',40], ['russia',39], ['broncos',21] ];
    // see engage_full for array sorting code.
    // --> CAN I DO THIS IN SQL?  doing a IN() command?

    ff.response().result = result;

};




// exports.deleteTestData = function() {
//     ff.deleteAllForQuery("/Events/(page_title ne '')");
// };


// exports.deleteTestUsers = function() {
//     ff.deleteAllForQuery("/FFUser/(userName contains_any 'teamreadrboard readrWidget')");
// };


// exports.createTestContent = function() {
//     var content = ff.createObjAtUri(new Content({
//         page__id:'0', page_title:'test page', canonical_url:'www.google.com', site_id:'0', content_type:'text'
//     }), "/Content");
// };
// exports.createTestEvents = function() {
//     var sites = [
//         {'site_name':'Fast Company', 'site_tld':'www.fastcolabs.com','site_id':1},
//         {'site_name':'Slate', 'site_tld':'www.slate.com','site_id':2},
//         {'site_name':'TechCrunch', 'site_tld':'www.techcrunch.com','site_id':3},
//         {'site_name':'Rasmussen Media', 'site_tld':'www.rmg.com','site_id':4},
//         {'site_name':'Mile High Report', 'site_tld':'www.milehighreport.com','site_id':5},
//         {'site_name':'VentureBeat', 'site_tld':'www.venturebeat.com','site_id':6}
//     ];

//     var adjectives = [
//         'Funny',
//         'Horrible',
//         'Surprising',
//         // 'Insightful',
//         'Obvious',
//         'Painful'
//     ];

//     var nouns = [
//         // 'Obama',
//         'Android',
//         'Flowers',
//         'Fitness',
//         'Tequila',
//         'Coffee'
//     ];

//     var verbs = [
//         'Help',
//         'Surprise',
//         'Wake',
//         'Date',
//         'Contact'
//         // 'Spy'
//     ];

//     var topics = [
//         'society','tech','football','black','white','race','russia','putin','crazy','salary','denver','alcohol','unexpected','us','content','strategy'
//     ];

//     var reactions = [
//         'hilarious','lol','love it','hate it','horrible','thats what im talking about','tell me more','clever','righteous','yikes','no no no','omg','good god','recycle!','i thought so','enjoy!',
//         'meh','screw this','sheesh','uh, no','whatever','surprising','amazeballs','knew it','yea, no','dig it','really?','dont think so','cite your source','sad','i cried','inspiring','please no',
//         'awful','tragic','disturbing','funny','weird'
//     ];

//     var contents = [
//         {type:'page',content:'page'},
//         {type:'text',content:'Newly signed Broncos receiver Emmanuel Sanders said in his press conference on Sunday that playing with Peyton Manning is "like wide receiver heaven."'},
//         {type:'text',content:'In hopes of luring in fresh audiences, Facebook Paper announced its first experiment in working with an outside group to populate the Ideas section of its stylized content reader standalone app. The "Ideas Worth Spreading" conference TED will feed exclusive content from its 2014 summit in Vancouver into Paper from March 17th to 21st. Collaborations like this could turn niche communities into loyal Paper users.'},
//         {type:'text',content:'User experience is not interface design. Not even close. It doesn\'t happen in Photoshop, nor is it the last step of building a product. If you\'re occupied with a user-focused strategy, analysis, user studies, and the psychological aspects of design, that\'s what we consider user experience design. There are multiple methods to help you with this.'},
//         {type:'text',content:'Content collaborations could address both of these issues'},
//         {type:'text',content:'Initially, when Russian troops without insignia appeared in Crimea, the assumption was that Putin was a strategic thinker, taking advantage of a weak central government and appealing to receptive residents who believed Russian propaganda about a fascist government in Kiev.'},
//         {type:'text',content:'lorem ipsum dolor'},
//         {type:'text',content:'hello world'},
//         {type:'text',content:'sangria and snoop dogg'},
//         {type:'image',content:'http://www.vancouverdesi.com/wp-content/uploads/2014/03/jet-300x289.jpg'},
//         {type:'image',content:'http://www.slate.com/content/dam/slate/articles/news_and_politics/foreigners/2014/03/vladimir_putin_s_irrational_behavior_why_the_russian_president_wins_if_we/476616659-russian-president-vladimir-putin-looks-on-during-a.jpg.CROP.promo-mediumlarge.jpg'},
//         {type:'image',content:'http://timedotcom.files.wordpress.com/2014/03/germany-syria_yang.jpg?w=1100&h=734&crop=1'},
//         {type:'image',content:'http://timedotcom.files.wordpress.com/2014/03/screen-shot-2014-03-17-at-2-23-04-pm.png?w=560&h=237'},
//         {type:'video',content:'http://youtube.com/12345'},
//         {type:'video',content:'http://youtube.com/67890'},
//         {type:'video',content:'http://youtube.com/abcde'}
//     ];

//     var users = [
//         'michael','grayson','lakshmi','kieran' //  'joe','paul','susie','porter','eric','anonymous1','anonymous2','anonymous3','anonymous4','anonymous5','anonymous6','anonymous7'
//     ];

//     var referrers = [
//         'twitter','facebook','www.google.com','plus.url.google.com','(direct)'
//     ];

//     var reaction_parents = ['none','1','none','2','none','3','none','4','none','5','none','6','none','7','none','8','none','9','none','10'];

//     var event_types = [
//         // 'reaction',
//         // 'reaction_view',
//         'widget_load','widget_load','widget_load','widget_load','widget_load','widget_load','widget_load','widget_load','widget_load','widget_load','widget_load','widget_load','widget_load','widget_load','widget_load','widget_load','widget_load','widget_load','widget_load',
//         'widget_load','widget_load','widget_load','widget_load','widget_load','widget_load','widget_load','widget_load','widget_load','widget_load','widget_load','widget_load','widget_load','widget_load','widget_load','widget_load','widget_load','widget_load','widget_load',
//         // 'widget_load','widget_load','widget_load','widget_load','widget_load','widget_load','widget_load','widget_load','widget_load','widget_load','widget_load','widget_load','widget_load','widget_load','widget_load','widget_load','widget_load','widget_load','widget_load',
//         'scroll',
//         'time_mark'
//     ];

//     var i, j;

//     for (i=0;i<1000;i++){
//         // CREATE OBJECTTYPE Interaction (site_name STRING, site_tld STRING, site_id NUMERIC, page__id NUMERIC, page_title STRING, page_url STRING, page_topics STRING, user STRING, content STRING, reaction STRING, reaction_parent STRING)

//         // {'site_name':'Fast Company', 'site_tld':'www.fastcolabs.com','site_id':1},
//         var site_choice = Math.floor(Math.random()*sites.length);
//         var event_type = event_types[Math.floor(Math.random()*event_types.length)];

//         var user = users[Math.floor(Math.random()*users.length)];
//         var content = contents[ Math.floor(Math.random()*contents.length) ];
//         var referrer = referrers[ Math.floor(Math.random()*referrers.length) ];

//         var session_id = user+'-'+site_choice+(Math.floor(Math.random()*2)).toString();

//         var adjective_choice = Math.floor(Math.random()*adjectives.length);
//         var adjective = adjectives[adjective_choice];
        
//         var noun_choice = Math.floor(Math.random()*nouns.length);
//         var noun = nouns[noun_choice];
        
//         var verb_choice = Math.floor(Math.random()*verbs.length);
//         var verb = verbs[verb_choice];
//         // var noun = nouns[Math.floor(Math.random()*nouns.length)];
//         // var verb = verbs[Math.floor(Math.random()*verbs.length)];
        
//         var pageId = '' + (site_choice+1) + adjective_choice + noun_choice + verb_choice;

//         var page_title = adjective + " Ways That " + noun + " Can " + verb + " You";
//         var page_url = sites[site_choice].site_tld + '/' + adjective + "-ways-that-" + noun + "-can-" + verb + "-you.html";

//         var num_topics = Math.floor(Math.random()*3);
//         var page_topics = '';
//         for (j=0;j<num_topics;j++) {
//             page_topics += topics[Math.floor(Math.random()*topics.length)] + ', ';
//         }

//         var event_value = '';
//         var event_parent = '';

//         if ( event_type == 'reaction' ){
//             event_value = reactions[Math.floor(Math.random()*reactions.length)];   // randomly select a "reaction" from the reactions[] array above
//             event_parent = reaction_parents[Math.floor(Math.random()*reaction_parents.length)];
//         } else if ( event_type == 'reaction_view' ) {
//             event_value = '';
//             event_parent = content.content.replace(/\s+/g, '').toLowerCase().substr(0,26);  // simulate an MD5 hash
//         } else if ( event_type == 'widget_load' ) {
//             event_value = '';  // later, tag as unique in the widget
//             event_parent = '-';
//         } else if ( event_type == 'scroll' ) {
//             var scroll_values = [20,40,60,80,100];
//             event_value = scroll_values[Math.floor(Math.random()*scroll_values.length)].toString();
//             event_parent = '-';
//         } else if ( event_type == 'time_mark' ) {
//             var time_values = [15,30,45,60,75,90,105,120,135,150];
//             event_value = time_values[Math.floor(Math.random()*time_values.length)].toString();
//             event_parent = '-';
//         }
        
//         var interaction = ff.createObjAtUri(new Events({
//             site_name:sites[site_choice].site_name, site_tld:sites[site_choice].site_tld, site_id:sites[site_choice].site_id, page__id:pageId, page_title:page_title, page_url:page_url, page_topics:page_topics, referrer:referrer, session_id:session_id, user:user, content_type:content.type, content:content.content, event_type:event_type, event_value:event_value, event_parent:event_parent
//         }), "/Events");

//     }

// };
