$(document).ready(function() {
/*   search_box(); */
  //jQuery('.recent-stories article').equalHeightColumns();

/*
	var message = jQuery( "#social-trick-wrap" );
	var originalMessageTop = message.offset().top;
	var view = jQuery( window );
	view.bind(
		"scroll resize",
		function(){
			var viewTop = view.scrollTop();
			if ((viewTop > originalMessageTop) && !message.is( ".social-fixed" )){
				message.removeClass( "social-absolute" ).addClass( "social-fixed" );
			} else if ((viewTop <= originalMessageTop) && message.is( ".social-fixed" )){
				message.removeClass( "social-fixed" ).addClass( "social-absolute" );
			}
		}
	);
*/
    search_box();

    $('.counter').each(function() {
        var el = $(this),
            url = el.attr('data-url'),
            urtak_post_id = el.attr('data-post-id');
        load_reactions(url, el, urtak_post_id);
    });
});

function twitter(url){
    return $.ajax({
        url: "http://urls.api.twitter.com/1/urls/count.json?url="+url+"&callback=?",
        dataType: "json",
        timeout: 5000,
        success: function(twitter_data) {}
    });
}

function facebook(url){
    return $.ajax({
        url: "http://graph.facebook.com/?ids="+url,
        dataType: "json",
        timout: 5000,
        success: function(fb_data) {}
    });
}

function linkedin(url){
    return $.ajax({
        url: "http://www.linkedin.com/countserv/count/share?url="+url+"&format=jsonp&callback=?",
        dataType: "jsonp",
        timeout: 5000,
        success: function(linkedin_data) {}
    });
}

function urtaks(urtak_id) {
    return $.ajax({
        url: Urtak_Vars.ajaxurl,
        type: 'POST',
        dataType: 'json',
        data: {
			action: 'urtak_fetch_responses_counts',
			post_ids: urtak_id
        },
        success: function(urtak_data) {}
    });
}

function gplus(url){
    return $.ajax({
        type: "POST",
        url: "/blog/wp-content/themes/roosevelt/gplusone.php",
        data: {action: 'getReactions', url: url},
        success: function(gplus_data){},
        error: function(error) {
            console.log(error);
        }
    });
}

function load_reactions(url, target, urtak_id) {
    $.when(twitter(url), facebook(url), linkedin(url), gplus(url), urtaks(urtak_id)).done(function(twitter_data, fb_data, linkedin_data, gplus_data, urtak_data){
        var tw_count = twitter_data[0]['count'],
            fb_count = fb_data[0][url]['shares'],
            li_count = linkedin_data[0]['count'],
            gplusone_count = parseFloat(gplus_data[0]),
            urtak_count = urtak_data[0]['urtaks'][urtak_id];
        if (typeof fb_count != "undefined") {
            fb_count = fb_data[0][url]['shares'];
        } else { 
            fb_count = "0";
        }
        var total_count = parseFloat(tw_count) + parseFloat(fb_count) + parseFloat(li_count) + parseFloat(gplusone_count) + parseFloat(urtak_count);
        $(target).html(total_count);
        //console.log("URL: " + url + "\nFacebook: " + fb_count + "\nTwitter: " + tw_count + "\nLinkedin: " + li_count + "\nPlus One: " + gplusone_count + "\nUrtaks: " + urtak_count + "\n----------------------------\nTOTAL: " + total_count);
    });
}

function search_box(){
	jQuery('.main-search a').click(function () {
		jQuery('.main-search form').toggleClass('open');
	});
};