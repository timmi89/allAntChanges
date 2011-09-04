/*jslint evil:true */
/**
 * Dynamic thread loader
 *
 * 
 * 
 * 
 * 
 * 
*/

// 
var DISQUS;
if (!DISQUS || typeof DISQUS == 'function') {
    throw "DISQUS object is not initialized";
}
// 

// json_data and default_json django template variables will close
// and re-open javascript comment tags

(function () {
    var jsonData, cookieMessages, session, key;

    /* */ jsonData = {"reactions": [], "reactions_limit": 10, "ordered_highlighted": [], "posts": {"299592339": {"edited": false, "author_is_moderator": false, "from_request_user": null, "up_voted": false, "ip": "", "last_modified_date": null, "dislikes": 0, "has_replies": false, "vote": false, "votable": true, "last_modified_by": null, "real_date": "2011-08-31_10:45:10", "date": "2 days ago", "message": "Sounds like an amazing trip! And nothing compares to Italian tomatoes. Nothing.", "approved": true, "is_last_child": false, "can_edit": false, "can_reply": true, "likes": 0, "user_voted": null, "num_replies": 0, "down_voted": false, "is_first_child": false, "has_been_anonymized": false, "highlighted": false, "parent_post_id": null, "depth": 0, "points": 0, "user_key": "42383b6343fad78dfcc7dab99f5e71d7", "author_is_creator": false, "email": "", "killed": false, "is_realtime": false}, "300854215": {"edited": false, "author_is_moderator": false, "from_request_user": false, "up_voted": false, "ip": "", "last_modified_date": null, "dislikes": 0, "has_replies": false, "vote": false, "votable": true, "last_modified_by": null, "real_date": "2011-09-01_21:48:24", "date": "17 hours ago", "message": "That's some GREAT writing! I thoroughly enjoyed it, thank you!", "approved": true, "is_last_child": false, "can_edit": false, "can_reply": true, "likes": 0, "user_voted": null, "num_replies": 0, "down_voted": false, "is_first_child": false, "has_been_anonymized": false, "highlighted": false, "parent_post_id": null, "depth": 0, "points": 0, "user_key": "twitter-151190656", "author_is_creator": false, "email": "", "killed": false, "is_realtime": false}}, "ordered_posts": [300854215, 299592339], "realtime_enabled": false, "ready": true, "mediaembed": [], "has_more_reactions": false, "realtime_paused": true, "integration": {"receiver_url": "", "hide_user_votes": false, "reply_position": false, "disqus_logo": false}, "highlighted": {}, "reactions_start": 0, "media_url": "http://mediacdn.disqus.com/1314858644", "users": {"42383b6343fad78dfcc7dab99f5e71d7": {"username": "Holley", "tumblr": "", "about": "", "display_name": "Holley", "url": "http://disqus.com/guest/42383b6343fad78dfcc7dab99f5e71d7/", "registered": false, "remote_id": null, "linkedin": "", "blog": "", "remote_domain": "", "points": null, "facebook": "", "avatar": "http://media.disqus.com/uploads/anonusers/2890/5201/avatar32.jpg", "delicious": "", "is_remote": false, "verified": false, "flickr": "", "twitter": "", "remote_domain_name": ""}, "twitter-151190656": {"username": "twitter-151190656", "tumblr": "", "about": "", "display_name": "Daniel Dunn", "url": "http://disqus.com/twitter-151190656/", "registered": true, "remote_id": "151190656", "linkedin": "", "blog": "http://twitter.com/danielpdunn", "remote_domain": 2, "points": 1, "facebook": "", "avatar": "http://mediacdn.disqus.com/uploads/users/1632/8924/avatar32.jpg?1314928104", "delicious": "", "is_remote": true, "verified": false, "flickr": "", "twitter": "http://twitter.com/danielpdunn", "remote_domain_name": "Twitter"}}, "messagesx": {"count": 0, "unread": []}, "thread": {"voters_count": 0, "offset_posts": 0, "slug": "its_new_to_me_italy_fathom_travel_blog_and_travel_guides", "paginate": false, "num_pages": 1, "days_alive": 0, "moderate_none": false, "voters": {}, "total_posts": 2, "realtime_paused": false, "queued": false, "pagination_type": "append", "user_vote": null, "likes": 5, "num_posts": 2, "closed": false, "per_page": 0, "id": 394927493, "killed": false, "moderate_all": false}, "forum": {"use_media": true, "avatar_size": 32, "apiKey": "apgNzfzvS4UjujLXDwqJNdljl5E8LzIZdwdWnUeD1tySZAVdBK95jZju5GHQLs6N", "comment_max_words": 0, "mobile_theme_disabled": false, "is_early_adopter": false, "login_buttons_enabled": false, "streaming_realtime": false, "reply_position": false, "id": 705361, "default_avatar_url": "http://mediacdn.disqus.com/1314858644/images/noavatar32.png", "template": {"mobile": {"url": "http://mediacdn.disqus.com/1314858644/build/themes/newmobile.js", "css": "http://mediacdn.disqus.com/1314858644/build/themes/newmobile.css"}, "url": "http://mediacdn.disqus.com/1314858644/build/themes/t_b3e3e393c77e35a4a3f3cbd1e429b5dc.js?1", "api": "1.1", "name": "Houdini", "css": "http://mediacdn.disqus.com/1314858644/build/themes/t_b3e3e393c77e35a4a3f3cbd1e429b5dc.css?1"}, "max_depth": 0, "lastUpdate": "", "use_old_templates": false, "linkbacks_enabled": false, "allow_anon_votes": true, "revert_new_login_flow": false, "stylesUrl": "http://mediacdn.disqus.com/uploads/styles/70/5361/teamfathom.css", "show_avatar": true, "reactions_enabled": false, "disqus_auth_disabled": false, "name": "Fathom", "language": "en", "mentions_enabled": true, "url": "teamfathom", "allow_anon_post": true, "thread_votes_disabled": false, "hasCustomStyles": false, "moderate_all": false}, "settings": {"realtimeHost": "qq.disqus.com", "uploads_url": "http://media.disqus.com/uploads", "ssl_media_url": "https://securecdn.disqus.com/1314858644", "realtime_url": "http://rt.disqus.com/forums/realtime-cached.js", "facebook_app_id": "52254943976", "minify_js": true, "recaptcha_public_key": "6LdKMrwSAAAAAPPLVhQE9LPRW4LUSZb810_iaa8u", "read_only": false, "facebook_api_key": "4aaa6c7038653ad2e4dbeba175a679ba", "realtimePort": "80", "debug": false, "disqus_url": "http://disqus.com", "media_url": "http://mediacdn.disqus.com/1314858644"}, "ranks": {}, "request": {"sort": 4, "is_authenticated": false, "user_type": "anon", "subscribe_on_post": 0, "missing_perm": null, "user_id": null, "remote_domain_name": "", "remote_domain": "", "is_verified": false, "email": "", "profile_url": "", "username": "", "is_global_moderator": false, "sharing": {}, "timestamp": "2011-09-02_15:17:51", "is_moderator": false, "forum": "teamfathom", "is_initial_load": true, "display_username": "", "points": null, "moderator_can_edit": false, "is_remote": false, "userkey": "", "page": 1}, "context": {"use_twitter_signin": false, "use_fb_connect": false, "show_reply": true, "active_switches": ["bespin", "community_icon", "embedapi", "google_auth", "mentions", "new_facebook_auth", "realtime_cached", "show_captcha_on_links", "ssl", "static_reply_frame", "static_styles", "statsd_created", "upload_media", "use_rs_paginator_60m"], "sigma_chance": 10, "use_google_signin": false, "switches": {"olark_admin_addons": true, "listactivity_replies": true, "olark_addons": true, "upload_media": true, "vip_read_slave": true, "embedapi": true, "ssl": true, "html_email": true, "community_icon": true, "send_to_impermium": true, "show_captcha_on_links": true, "olark_admin_packages": true, "static_styles": true, "stats": true, "google_auth": true, "listactivity_replies_30d": true, "statsd.timings": true, "realtime_cached": true, "statsd_created": true, "bespin": true, "olark_support": true, "use_rs_paginator_60m": true, "mentions": true, "olark_install": true, "new_facebook_auth": true, "limit_get_posts_days_30d": true, "compare_spam": true, "static_reply_frame": true}, "forum_facebook_key": "", "use_yahoo": false, "subscribed": false, "active_gargoyle_switches": ["compare_spam", "html_email", "limit_get_posts_days_30d", "listactivity_replies", "listactivity_replies_30d", "olark_addons", "olark_admin_addons", "olark_admin_packages", "olark_install", "olark_support", "send_to_impermium", "show_captcha_on_links", "stats", "statsd.timings", "vip_read_slave"], "realtime_speed": 15000, "use_openid": false}}; /* */
    /* */ cookieMessages = {"user_created": null, "post_has_profile": null, "post_twitter": null, "post_not_approved": null}; session = {"url": null, "name": null, "email": null}; /* */

    DISQUS.jsonData = jsonData;
    DISQUS.jsonData.cookie_messages = cookieMessages;
    DISQUS.jsonData.session = session;

    if (DISQUS.useSSL) {
        DISQUS.useSSL(DISQUS.jsonData.settings);
    }

    // The mappings below are for backwards compatibility--before we port all the code that
    // accesses jsonData.settings to DISQUS.settings

    var mappings = {
        debug:                'disqus.debug',
        minify_js:            'disqus.minified',
        read_only:            'disqus.readonly',
        recaptcha_public_key: 'disqus.recaptcha.key',
        facebook_app_id:      'disqus.facebook.appId',
        facebook_api_key:     'disqus.facebook.apiKey'
    };

    var urlMappings = {
        disqus_url:    'disqus.urls.main',
        media_url:     'disqus.urls.media',
        ssl_media_url: 'disqus.urls.sslMedia',
        realtime_url:  'disqus.urls.realtime',
        uploads_url:   'disqus.urls.uploads'
    };

    if (DISQUS.jsonData.context.switches.realtime_setting_change) {
        urlMappings.realtimeHost = 'realtime.host';
        urlMappings.realtimePort = 'realtime.port';
    }
    for (key in mappings) {
        if (mappings.hasOwnProperty(key)) {
            DISQUS.settings.set(mappings[key], DISQUS.jsonData.settings[key]);
        }
    }

    for (key in urlMappings) {
        if (urlMappings.hasOwnProperty(key)) {
            DISQUS.jsonData.settings[key] = DISQUS.settings.get(urlMappings[key]);
        }
    }
}());

DISQUS.jsonData.context.csrf_token = '21bc467119200cb06806902fa8e2f5b0';

DISQUS.jsonData.urls = {
    login: 'http://disqus.com/profile/login/',
    logout: 'http://disqus.com/logout/',
    upload_remove: 'http://teamfathom.disqus.com/thread/its_new_to_me_italy_fathom_travel_blog_and_travel_guides/async_media_remove/',
    request_user_profile: 'http://disqus.com/AnonymousUser/',
    request_user_avatar: 'http://mediacdn.disqus.com/1314858644/images/noavatar92.png',
    verify_email: 'http://disqus.com/verify/',
    remote_settings: 'http://teamfathom.disqus.com/_auth/embed/remote_settings/',
    embed_thread: 'http://teamfathom.disqus.com/thread.js',
    embed_vote: 'http://teamfathom.disqus.com/vote.js',
    embed_thread_vote: 'http://teamfathom.disqus.com/thread_vote.js',
    embed_thread_share: 'http://teamfathom.disqus.com/thread_share.js',
    embed_queueurl: 'http://teamfathom.disqus.com/queueurl.js',
    embed_hidereaction: 'http://teamfathom.disqus.com/hidereaction.js',
    embed_more_reactions: 'http://teamfathom.disqus.com/more_reactions.js',
    embed_subscribe: 'http://teamfathom.disqus.com/subscribe.js',
    embed_highlight: 'http://teamfathom.disqus.com/highlight.js',
    embed_block: 'http://teamfathom.disqus.com/block.js',
    update_moderate_all: 'http://teamfathom.disqus.com/update_moderate_all.js',
    update_days_alive: 'http://teamfathom.disqus.com/update_days_alive.js',
    show_user_votes: 'http://teamfathom.disqus.com/show_user_votes.js',
    forum_view: 'http://teamfathom.disqus.com/its_new_to_me_italy_fathom_travel_blog_and_travel_guides',
    cnn_saml_try: 'http://disqus.com/saml/cnn/try/',
    realtime: DISQUS.jsonData.settings.realtime_url,
    thread_view: 'http://teamfathom.disqus.com/thread/its_new_to_me_italy_fathom_travel_blog_and_travel_guides/',
    twitter_connect: DISQUS.jsonData.settings.disqus_url + '/_ax/twitter/begin/',
    yahoo_connect: DISQUS.jsonData.settings.disqus_url + '/_ax/yahoo/begin/',
    openid_connect: DISQUS.jsonData.settings.disqus_url + '/_ax/openid/begin/',
    googleConnect: DISQUS.jsonData.settings.disqus_url + '/_ax/google/begin/',
    community: 'http://teamfathom.disqus.com/community.html',
    admin: 'http://teamfathom.disqus.com/admin/moderate/',
    moderate: 'http://teamfathom.disqus.com/admin/moderate/',
    moderate_threads: 'http://teamfathom.disqus.com/admin/moderate-threads/',
    settings: 'http://teamfathom.disqus.com/admin/settings/',
    unmerged_profiles: 'http://disqus.com/embed/profile/unmerged_profiles/',

    channels: {
        def:      'http://disqus.com/default.html', /* default channel */
        auth:     'https://secure.disqus.com/embed/login.html',
        tweetbox: 'http://disqus.com/forums/integrations/twitter/tweetbox.html?f=teamfathom',
        edit:     'http://teamfathom.disqus.com/embed/editcomment.html',

        
        
        reply:    'http://mediacdn.disqus.com/1314858644/build/system/reply.html',
        upload:   'http://mediacdn.disqus.com/1314858644/build/system/upload.html',
        sso:      'http://mediacdn.disqus.com/1314858644/build/system/sso.html',
        facebook: 'http://mediacdn.disqus.com/1314858644/build/system/facebook.html'
        
        
    }
};
