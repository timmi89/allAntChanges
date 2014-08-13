/* I know, I know, this is a horrible, global namespace-polluting, poorly asbtracted POS.  Was in a big hurry. */

function numberWithCommas(x) {
    if (typeof x!='undefined') {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    } else {
        return '';
    }
}

function notUndefined(x) {
    if ( typeof x =='undefined') {
        return 'Data not returned';
    } else {
        return x;
    }
}

function topSummary() {

readrboardUsageData.no_rdr_sessions_count = (readrboardUsageData.all_sessions_count-readrboardUsageData.rdr_sessions_count);

var $temp_readrboardUsage = $('<div><div class="template"></div></div>');

    var summaryHTML = [];
    summaryHTML.push( '<div class="grid-3 s-grid-whole padded right s-center first-column"> ');
        summaryHTML.push( '<div class="dashboard-name"> ');
            summaryHTML.push( 'Past 72 Hours');
        summaryHTML.push( '</div> ');
        
        summaryHTML.push( '<div class="datapoint people-engaged"> ');
            summaryHTML.push( '<div class="number">'+numberWithCommas(readrboardUsageData.rdr_sessions_count)+'</div> ');
            summaryHTML.push( '<label>engaged sessions</label> ');
        summaryHTML.push( '</div> ');
        
        summaryHTML.push( '<div class="datapoint articles-engaged"> ');
            summaryHTML.push( '<div class="number">'+numberWithCommas(readrboardUsageData.engaged_page_count)+'</div> ');
            summaryHTML.push( '<label>articles actively engaged</label> ');
        summaryHTML.push( '</div> ');

        summaryHTML.push( '<div class="datapoint articles-read"> ');
            summaryHTML.push( '<div class="number">'+numberWithCommas(readrboardUsageData.articles_read_count)+'</div> ');
            summaryHTML.push( '<label>articles read</label> ');
        summaryHTML.push( '</div> ');
    summaryHTML.push( '</div> ');
    summaryHTML.push( '<div class="grid-6 s-grid-whole padded center-column second-column"> ');
        summaryHTML.push( '<div class="dashboard-name"> ');
            summaryHTML.push( 'Past 72 Hours');
        summaryHTML.push( '</div> ');
        summaryHTML.push( '<div class="legend engagement-legend"> ');
            summaryHTML.push( '<div class="legend-title">Engagement Activity</div> ');
            summaryHTML.push( '<div class="legend-content"> ');
                summaryHTML.push( '<div class="legend-value"> ');
                    summaryHTML.push( '<div class="legend-color engaged"></div> ');
                    summaryHTML.push( '<div class="legend-label engaged">Used ReadrBoard</div> ');
                summaryHTML.push( '</div> ');
                summaryHTML.push( '<div class="legend-value"> ');
                    summaryHTML.push( '<div class="legend-color not-engaged"></div> ');
                    summaryHTML.push( '<div class="legend-label not-engaged">Other Visitors</div> ');
                summaryHTML.push( '</div> ');
            summaryHTML.push( '</div> ');
        summaryHTML.push( '</div> ');
        summaryHTML.push( '<div class="row engagement-bar-graphs"> ');
            summaryHTML.push( '<div class="grid-6 graphset pageview-graphset"> ');
                summaryHTML.push( '<div class="graph-title">Pageviews<br/>per Session</div> ');
                summaryHTML.push( '<div class="graph-canvas" id="pageview-graph"></div> ');
                summaryHTML.push( '<div class="grid-2">&nbsp;</div> ');
                summaryHTML.push( '<div class="grid-4 graph-value">'+notUndefined(readrboardUsageData.rdr_avg_pageviews)+'</div> ');
                summaryHTML.push( '<div class="grid-4 graph-value">'+notUndefined(readrboardUsageData.avg_pageviews)+'</div> ');
                summaryHTML.push( '<div class="grid-2">&nbsp;</div> ');
            summaryHTML.push( '</div> ');
            summaryHTML.push( '<div class="grid-6 graphset time-graphset"> ');
                summaryHTML.push( '<div class="graph-title">Time<br/>on Content</div> ');
                summaryHTML.push( '<div class="graph-canvas" id="time-graph"></div> ');
                summaryHTML.push( '<div class="grid-2">&nbsp;</div> ');
                summaryHTML.push( '<div class="grid-4 graph-value">'+notUndefined(readrboardUsageData.rdr_avg_time)+'</div> ');
                summaryHTML.push( '<div class="grid-4 graph-value">'+notUndefined(readrboardUsageData.avg_time)+'</div> ');
                summaryHTML.push( '<div class="grid-2">&nbsp;</div> ');
            summaryHTML.push( '</div> ');
            // summaryHTML.push( '<div class="grid-4 graphset scroll-depth-graphset"> ');
            //     summaryHTML.push( '<div class="graph-title">Scroll<br/>Depth</div> ');
            //     summaryHTML.push( '<div class="graph-canvas" id="scroll-depth-graph"></div> ');
            //     summaryHTML.push( '<div class="grid-2">&nbsp;</div> ');
            //     summaryHTML.push( '<div class="grid-4 graph-value">'+readrboardUsageData.rdr_avg_scroll_depth+'%</div> ');
            //     summaryHTML.push( '<div class="grid-4 graph-value">'+readrboardUsageData.avg_scroll_depth+'%</div> ');
            //     summaryHTML.push( '<div class="grid-2">&nbsp;</div> ');
            // summaryHTML.push( '</div> ');
        summaryHTML.push( '</div> ');
    summaryHTML.push( '</div> ');
    summaryHTML.push( '<div class="grid-3 s-grid-whole padded left s-center third-column"> ');
        summaryHTML.push( '<div class="datapoint reactions"> ');
            summaryHTML.push( '<div class="number">'+numberWithCommas(readrboardUsageData.reaction_count)+'</div> ');
            summaryHTML.push( '<label>reactions</label> ');
        summaryHTML.push( '</div> ');
        summaryHTML.push( '<div class="datapoint reaction-views"> ');
            summaryHTML.push( '<div class="number">'+numberWithCommas(readrboardUsageData.reaction_view_count)+'</div> ');
            summaryHTML.push( '<label>reaction views</label> ');
        summaryHTML.push( '</div> ');
summaryHTML.push( ' ');
        summaryHTML.push( '<div class="datapoint session-donut graph-canvas" id="engaged-sessions" style="height:200px;"></div> ');
    summaryHTML.push( '</div> ');

var $temp_summarySection = $('<div class="template">'+ summaryHTML.join('')  +'</div>');

if (RB.group.name) {
$temp_summarySection.find('.dashboard-name').html(RB.group.name);
}

    $('.section.summary').html($temp_summarySection).find('.template').animate({'opacity':1},500);

    drawSummaryGraphs();
    $(window).smartresize(drawSummaryGraphs);

}

function timeStringToSeconds(timeString) {
    // assumes MM:SS
    var a = timeString.split(':');
    var seconds = (+a[0]) * 60 + (+a[1]);
    return seconds;
}

function drawSummaryGraphs() {
    $('.graph-canvas').html('');
Morris.Bar({
  element: 'pageview-graph',
  data: [
    { datatype: 'Pageviews', a: readrboardUsageData.rdr_avg_pageviews, b: readrboardUsageData.avg_pageviews }
  ],
  xkey: 'datatype',
  ykeys: ['a', 'b'],
  labels: ['', ''],
  grid:false,
  axes:false,
  barColors:['#92c325','#909090']
});

Morris.Bar({
  element: 'time-graph',
  data: [
    { datatype: 'Pageviews', a: readrboardUsageData.rdr_avg_time, b: readrboardUsageData.avg_time }
  ],
  xkey: 'datatype',
  ykeys: ['a', 'b'],
  labels: ['', ''],
  grid:false,
  axes:false,
  barColors:['#92c325','#909090']
});
// Morris.Bar({
//   element: 'scroll-depth-graph',
//   data: [
//     { datatype: 'Pageviews', a: readrboardUsageData.rdr_avg_scroll_depth, b: readrboardUsageData.avg_scroll_depth }
//   ],
//   xkey: 'datatype',
//   ykeys: ['a', 'b'],
//   labels: ['', ''],
//   grid:false,
//   axes:false,
//   barColors:['#92c325','#909090']
// });

var rdr_session_percentage = ((readrboardUsageData.rdr_sessions_count/readrboardUsageData.all_sessions_count) * 100).toFixed(2),
    session_percentage = ((readrboardUsageData.no_rdr_sessions_count/readrboardUsageData.all_sessions_count) * 100).toFixed(2);

    Morris.Donut({
      element: 'engaged-sessions',
      data: [
        {label: "Engaged ReadrBoard", value: rdr_session_percentage },
        {label: "Other Sessions", value: session_percentage }
      ],
      formatter: function (y) { if ( isNaN(y) ) return "Data not returned"; else return y + "%" }
    }).select(0);


} // end drawSummaryGraphs

// for the array sort
function numOrdDesc(a, b){ return (b-a); }

function pageSummary(pages) {
    var $temp_engagedPages = $('<div><div class="template"></div></div>');
    var $table = $('<table><tr><th>Title</th><th>RB Engagement</th><th>Reactions</th><th>Reaction Views</th><th>Reads</th></tr></table>');
    // var $table = $('<table><tr><th>Title</th><th>RB Engagement</th><th>Reactions</th><th>Reaction Views</th><th>Reads</th><th>Scroll Depth</th></tr></table>');

    if (typeof pages != 'undefined') {
        var pageNum = (pages.length > 30) ? 30 : pages.length;

        var engagedPages = [],
            engagementRates = [];
        for (var i=0;i<30;i++) {
            if (typeof pages[i] != 'undefined' ) {
                var engagement_rate = Math.round(((pages[i].a_reaction_count + pages[i].a_reaction_view_count)/pages[i].a_wl_count)*10000)/100;
                // var scroll_rate = Math.round(pages[i].b_median_scroll*100)/100;
                engagedPages.push( { title:pages[i].a_pt, reaction_count:pages[i].a_reaction_count, reaction_view_count:pages[i].a_reaction_view_count, engagement_rate:engagement_rate, wl_count:pages[i].a_wl_count, hotness:pages[i].hotness, page_url:pages[i].a_pu } );
                // engagedPages.push( { title:pages[i].a_pt, reaction_count:pages[i].a_reaction_count, reaction_view_count:pages[i].a_reaction_view_count, engagement_rate:engagement_rate, avg_scroll:scroll_rate, wl_count:pages[i].a_wl_count, hotness:pages[i].hotness, page_url:pages[i].a_pu } );
                engagementRates.push(engagement_rate);
            }
        }
        engagementRateMax = engagementRates.sort(numOrdDesc).shift();

        $.each(engagedPages, function(idx, page) {

            var $page = $('<tr class="page_card">' +
                    '<td class="title"><h1 style="background-size:'+ parseInt((page.engagement_rate / 100)*100) +'% 30px;"><a href="'+page.page_url+'" target="_blank">'+page.title+'</a></h1></td>' +
                    '<td class="attribute">'+ page.engagement_rate +'% <label>Engagement</label></td>' +
                    '<td class="attribute">'+ page.reaction_count +' <label>Reactions</label></td>' +
                    '<td class="attribute">'+ page.reaction_view_count +' <label>Reaction View Count</label></td>' +
                    '<td class="attribute">'+ page.wl_count +' <label>Reads</label></td>' +
                    // '<td class="attribute">'+ page.avg_scroll +'% <label>Avg Scroll</label></td>' +
            '</tr>');

            $table.append($page);

        });
        $temp_engagedPages.find('.template').append( $table );

        $('.section.engaged-pages .hasLoader').html($temp_engagedPages).find('.template').animate({'opacity':1},500);
    }

}
function hotTopics(hotTopics) {
    var $temp_popularTopics = $('<div><div class="template"></div></div>');
    if (typeof hotTopics != 'undefined') {
        var topicNum = (hotTopics.length > 30) ? 30 : hotTopics.length;

        var popularTopics = [];
        for (var i=0;i<30;i++) {
            if (typeof hotTopics[i] != 'undefined' && hotTopics[i][0] != 'null' ) {
                popularTopics.push({ body:hotTopics[i][0], count:hotTopics[i][1] });
            }
        }
        var itemNumber = 1;
        $.each(popularTopics, function(idx, topic) {
            var size = (itemNumber<3) ? 'large' : (itemNumber < 9) ? 'medium' : 'small';
            var charCountModifier = (topic.body.length>20) ? 'smallest':(topic.body.length>14) ? 'smaller':'large';
            // $temp_popularTopics.find('.template').append('<div class="grid-'+gridNum+'"><span class="topic-tag '+charCountModifier+'"><a href="#">'+topic.body+' <span class="counter">'+topic.count+'</span></a></span></div>'); 
            $temp_popularTopics.find('.template').append('<span class="topic-tag '+size+'"><a href="javascript:void(0);" class="'+charCountModifier+'">'+topic.body+'</a></span>'); 
            itemNumber++;
        });

        $('.section.reactions-and-topics').find('.topics-holder').html($temp_popularTopics).find('.template').animate({'opacity':1},500);
    }
}

function refSummary(referrers) {
    var $temp_engagedReferrers = $('<div><div class="template"></div></div>');
    var $table = $('<table><tr><th style="text-align:left;">Domain</th><th>RB Engagement</th><th>Reactions</th><th>Reaction Views</th><th>Reads</th></tr></table>');
    // var $table = $('<table><tr><th style="text-align:left;">Domain</th><th>RB Engagement</th><th>Reactions</th><th>Reaction Views</th><th>Reads</th><th>Scroll Depth</th></tr></table>');

    if (typeof referrers != 'undefined') {

        var referrerNum = (referrers.length > 30) ? 30 : referrers.length;
        var engagedReferrers = [],
            engagementRates = [];
        for (var i=0;i<30;i++) {
            if (typeof referrers[i] != 'undefined') {
                // var engagement_rate = Math.round(((referrers[i].a_reaction_count + referrers[i].a_reaction_view_count)/referrers[i].a_wl_count)*100);
                var engagement_rate = Math.round(((referrers[i].a_reaction_count + referrers[i].a_reaction_view_count)/referrers[i].a_wl_count)*10000)/100;
                // var scroll_rate = Math.round(referrers[i].b_median_scroll*100)/100;
                engagedReferrers.push( { title:referrers[i].a_ref, reaction_count:referrers[i].a_reaction_count, reaction_view_count:referrers[i].a_reaction_view_count, hotness:referrers[i].hotness, engagement_rate:engagement_rate, wl_count:referrers[i].a_wl_count } );
                // engagedReferrers.push( { title:referrers[i].a_ref, reaction_count:referrers[i].a_reaction_count, reaction_view_count:referrers[i].a_reaction_view_count, hotness:referrers[i].hotness, engagement_rate:engagement_rate, avg_scroll:scroll_rate, wl_count:referrers[i].a_wl_count } );
                engagementRates.push(engagement_rate);
            }
        }
        engagementRateMax = engagementRates.sort(numOrdDesc).shift();

        $.each(engagedReferrers, function(idx, referrer) {
            var $referrer = $('<tr class="page_card">' +
                    '<td class="title"><h1 style="background-size:'+ parseInt((referrer.engagement_rate / 100)*100) +'% 30px;"><a href="javascript:void(0);">'+referrer.title+'</a></h1></td>' +
                    // '<td class="attribute">'+ referrer.hotness +' <label>Engagement</label></td>' +
                    '<td class="attribute">'+ referrer.engagement_rate +'% <label>Engagement</label></td>' +
                    '<td class="attribute">'+ referrer.reaction_count +' <label>Reactions</label></td>' +
                    '<td class="attribute">'+ referrer.reaction_view_count +' <label>Reaction View Count</label></td>' +
                    '<td class="attribute">'+ referrer.wl_count +' <label>Reads</label></td>' +
                    // '<td class="attribute">'+ referrer.avg_scroll +'% <label>Avg Scroll</label></td>' +
            '</tr>');

            $table.append($referrer);

        });
        $temp_engagedReferrers.find('.template').append( $table );

        $('.section.engaged-referrers .hasLoader').html($temp_engagedReferrers).find('.template').animate({'opacity':1},500);
    }
}


(function(){

        // put in external file...
        RB.analytics = {
            queryHost: (document.domain != "local.readrboard.com") ? "//events.readrboard.com" : "//localnode.com:3000",
            toggleGlobalLoader: function() {
                // TODO animate something
            },
            initAnalytics: function() {
                if (typeof RB.group == "undefined" || typeof RB.group.id == "undefined") {
                    RB.group = {};
                }
                RB.analytics.getTopPages();
                RB.analytics.getTopReactions();
                RB.analytics.getSummaries();
                RB.analytics.getTopReferrers();
            },
            getSummaries: function() {
                $.ajax({
                url: RB.analytics.queryHost + '/getSummaries',
                type: "get",
                data: {
                    json: $.toJSON( { gid:RB.group.id } )
                },
                success: function(response) {
                    readrboardUsageData = response;
                    topSummary();
                    }
                });
            },
            getTopPages: function() {
                $.ajax({
                    url: RB.analytics.queryHost + '/getTopPages',
                    type: "get",
                    data: {
                        json: $.toJSON( { gid:RB.group.id } )
                    },
                    success: function(response) {
                        pageSummary(response.pages);
                        hotTopics(response.hot_topics);

                    }, error: function(request, status, error) {
                    }, complete:function(request, status) {
                    }
                });
            },
            getTopReferrers: function() {
                // console.log('getTopReferrers');
                $.ajax({
                url: RB.analytics.queryHost + '/getTopReferrers',
                type: "get",
                data: {
                    json: $.toJSON( { gid:RB.group.id } )
                },
                success: function(response) {
                    refSummary(response.referrers);

                }, error: function(request, status, error) {
                }, complete:function(request, status) {
                }
                });
            },
            getTopReactions: function() {
                $.ajax({
                url: RB.analytics.queryHost + '/getTopReactions',
                type: "get",
                data: {
                    json: $.toJSON( { gid:RB.group.id } )
                },
                success: function(response) {

                    var $temp_popularReactions = $('<div><div class="template"></div></div>');
                    var popularReactions = response.reactions;

                    var itemNumber = 1;
                    $.each(popularReactions, function(idx, reaction) {
                        // console.log(reaction);
                        var searchUrl = (RB.group.short_name) ? '/group/'+RB.group.short_name+'/':'/stream/';
                        var size = (itemNumber<3) ? 'large' : (itemNumber < 9) ? 'medium' : 'small';
                        // var charCountModifier = (reaction.body.length>14) ? 'smaller':(reaction.body.length>20) ? 'smallest':'' 
                        var charCountModifier = (reaction.body.length>20) ? 'smallest' : (reaction.body.length>14) ? 'smaller':(reaction.body.length>7) ? 'mediumer':'large';
                        // $temp_popularReactions.find('.template').append('<div class="grid-'+gridNum+'"><span class="reaction-tag '+charCountModifier+'"><a href="/group/'+RB.group.short_name+'/?s='+reaction.body+'" target="_blank">'+reaction.body+' <span class="counter">'+numberWithCommas(reaction.count)+'</span></a></span></div>'); 
                        $temp_popularReactions.find('.template').append('<span class="reaction-tag '+size+'"><a target="_blank" href="'+searchUrl+'?s='+reaction.body+'" class="'+charCountModifier+'">'+reaction.body+' <span class="counter">'+numberWithCommas(reaction.count)+'</span></a></span>'); 
                        itemNumber++;
                    });

                    $('.section.reactions-and-topics').find('.reactions-holder').html($temp_popularReactions).find('.template').animate({'opacity':1},500);

                    }
                });
            },
            updateAll: function() {
                // console.log('group_id: {{ group.id }}');
            },
            simulate: function() {
                var readrboardUsageData = {
                    // sessions, pageviews, scroll, time
                    // rb_last_30:[14984,2.55,58.1,'4:42'],
                    // no_rb:[149510,1.56,58.55,'3:48']
                    // sessions, pageviews, NO scroll, time
                    rb_last_30:[14984,2.55,'4:42'],
                    no_rb:[149510,1.56,'3:48']
                };
                topSummary( readrboardUsageData );
            },
            setDates: function(){

                var nowDate = moment().format("MM/DD/YY");
                RB.analytics.startDate = RB.util.getHashValue('start') || nowDate;
                RB.analytics.endDate = RB.util.getHashValue('end') || moment().add('days',1).format("MM/DD/YY");

                RB.analytics.jsStartDate = RB.analytics.startDate ? new Date(RB.analytics.startDate) : new Date();
                RB.analytics.jsEndDate = RB.analytics.endDate ? new Date(RB.analytics.endDate) : new Date();
            }

        };

        $(function(){

            RB.analytics.setDates();
  
            // $('section[role="datepicker"] input' ).datepicker({ dateFormat: 'mm/dd/y' });

            var start_date = new Pikaday({ field: $('input[name="start_date"]')[0], format: 'MM/DD/YY' });
            var end_date = new Pikaday({ field: $('input[name="end_date"]')[0], format: 'MM/DD/YY' });

            $('input[name="start_date"]').val( RB.analytics.startDate );
            $('input[name="end_date"]').val( RB.analytics.endDate );

            
            // ***** DATE PICKER: re-enable soon.
            // $('section[role="datepicker"] form').submit( function() {

            //     var startDate = $('input[name="start_date"]').val();
            //     var endDate = $('input[name="end_date"]').val();
                
            //     RB.util.setHashValue('start', startDate );
            //     RB.util.setHashValue('end', endDate );

            //     RB.analytics.updateAll();
            //     return false;
            // });

            if ( $('.analyticsReport').length ) {
                RB.analytics.initAnalytics();
            }

        });
})();

