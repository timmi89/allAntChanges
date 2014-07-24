// querystring stuff
// used to create an array called qs_args which holds key/value paris from the querystring of the iframe
var qs = ( window.location.search + window.location.hash ).substr(1).split('&');
var qs_args = [];
for ( var i in qs ) {
    var this_arg = qs[i].split('=');
    qs_args[this_arg[0]] = this_arg[1];
}
if ( typeof qs_args.group_id == "undefined" ) {
    qs_args.group_id = "";
}

function getWindowProps(options){
    options = options || {};
    var w = options.width || 400;
    var h = options.height || 350;
    var l = (window.screen.width/2)-(w/2);
    var t = (window.screen.height/2)-(h/2);
    return 'menubar=1,resizable=1,scrollbars=yes,width='+w+',height='+h+',top='+t+',left='+l;
};

var trackingUrl = (document.domain != "local.readrboard.com") ? "http://events.readrboard.com/insert" : "http://tracker.readrboard.com/insert"
// var trackingUrl = (document.domain != "local.readrboard.com") ? "http://events.readrboard.com/insert" : "http://localnode.com:3000/insert"

// var trackingUrl = "http://events.readrboard.com/insert";

window.RDRAuth = {
    isOffline: (document.domain == "local.readrboard.com"),
    rdr_user: {},
    popups: {},
    //todo: make this stuff better
    openGenericLoginWindow: function(options){
        var windowProps = getWindowProps(options);
        RDRAuth.checkRBLoginWindow();
        RDRAuth.popups.loginWindow = window.open(
            RDR_baseUrl+'/login/',
            'readr_login',
            windowProps
        );
        RDRAuth.popups.loginWindow.focus();
        return false;
    },
    openFBLoginWindowFromPopup: function(options){
        RDRAuth.closeWindowOnSuccess = true;
        RDRAuth.doFBLogin();
        return false;
    },
    openRbLoginWindow: function(options){   
        var windowProps = getWindowProps(options);
        RDRAuth.checkRBLoginWindow();
        
        RDRAuth.popups.loginWindow = window.open(
            RDR_baseUrl+'/rb_login/',
            'readr_login',
            windowProps
        );
        RDRAuth.popups.loginWindow.focus();
        return false;
    },
    openRbCreateNewAccountWindow: function(options, replaceCurrentWindow){
        var windowProps = getWindowProps(options);
        RDRAuth.checkRBLoginWindow();
        RDRAuth.popups.loginWindow = window.open(
            RDR_baseUrl+'/user_create/',
            'readr_create_user',
            windowProps
        );
        RDRAuth.popups.loginWindow.focus();
        if(replaceCurrentWindow){
            window.close();
        }
        return false;
    },
    openRbForgotPasswordWindow: function(options){
        var windowProps = getWindowProps(options);
        RDRAuth.checkRBLoginWindow();
        RDRAuth.popups.loginWindow = window.open(
            RDR_baseUrl+'/request_password/',
            'readr_forgot_pw',
            windowProps
        );
        RDRAuth.popups.loginWindow.focus();
        return false;
    },
    openRbAvatarUploadWindow: function(options){
        var windowProps = getWindowProps(options);
        RDRAuth.popups.loginWindow = window.open(
            RDR_baseUrl+'/user_modify/',
            'readr_avatar_upload',
            windowProps
        );
        RDRAuth.checkRBLoginWindow();
        RDRAuth.popups.loginWindow.focus();
        return false;
    },
    openChangePasswordWindow: function(options){
        var windowProps = getWindowProps(options);
        RDRAuth.popups.loginWindow = window.open(
            RDR_baseUrl+'/change_password/',
            'readr_change_password',
            windowProps
        );
        RDRAuth.checkRBLoginWindow();
        RDRAuth.popups.loginWindow.focus();
        return false;
    },
    events: {
        track: function( data ) {
            // RDRAuth.events.track:
            // mirrors the event tracker from the widget
            var standardData = "";

            if ( RDRAuth.rdr_user && RDRAuth.rdr_user.user_id ) standardData += "||uid::"+RDRAuth.rdr_user.user_id;
            if ( (qs_args && (qs_args.group_id) ) ) standardData += "||gid::"+(qs_args.group_id);
            
            var eventSrc = data+standardData,
                $event = $('<img src="'+RDR_baseUrl+'/static/widget/images/event.png?'+eventSrc+'" />'); // NOT using STATIC_URL b/c we need the request in our server logs, and not on S3's logs

            $('#rdr_event_pixels').append($event);

            if(RDRAuth.isOffline){
                //uncomment for debugging
            }
        },
        trackEventToCloud: function(params){
            // RDRAuth.events.trackEventToCloud
            $.ajax({
                url: trackingUrl,
                type: "get",
                contentType: "application/json",
                dataType: "jsonp",
                data: {
                    json: $.toJSON( params )
                },
                success : function(response)
                {
                }
            });


            return;
            // if (typeof ff_loggedInUser != 'undefined' && typeof ff_loggedInUser.guid != 'undefined') {
            // ff.postObjToExtension(params, "saveEvent", function(response) {});
              

            //   // ff.createObjAtUri(params, 'EventsDev',
              // ff.createObjAtUri(params, 'Events',
              //   function (data, statusMessage) {
              //       // successfully created object
              //       var createdMyStuff = data;
              //       console.log('createdMyStuff');
              //       console.log(createdMyStuff);
              //   },
              //   function (statusCode, statusMessage) {
              //       // error occurred
              //   });

            // }

            // Old.  When Using Parse.
            //Record events to 3rd party event tracking.  These parameters match Google's event tracking API.
            //see https://developers.google.com/analytics/devguides/collection/gajs/eventTrackerGuide#SettingUpEventTracking
            var category = params.category,
                action = params.action,
                opt_label = params.opt_label || null,
                opt_value = params.opt_value  || null,
                opt_noninteraction = params.opt_noninteraction  || null;
                
            // //these are extra params that we are adding only for parse, not google analytics.
            // //google analytics duplicates some of these as json in opt_value
            var shareNetwork = params.shareNetwork || null,
                container_hash = params.container_hash || null,
                container_kind = params.container_kind || null,
                page_id = params.page_id || null,
                tag_body = params.tag_body || null,
                user_id = params.user_id || null,
                group_id = params.group_id || null;

                
            if( typeof Parse !== "undefined" ){
                //uncomment for debugging
                // console.log('trackEventToCloud: '+'category: '+category+', '+'action: '+action+', '+'opt_label: '+opt_label+', '+'opt_value: '+opt_value+', '+'opt_noninteraction: '+opt_noninteraction);
                var parseTrackingRepo = RDRAuth.isOffline ? "EventTracking_Dev" : "EventTracking";
                var ParseTracker = Parse.Object.extend(parseTrackingRepo);
                var parseTracker = new ParseTracker();
                parseTracker.save({
                    category: category,
                    action: action,
                    shareNetwork: shareNetwork,
                    container_hash: container_hash,
                    container_kind: container_kind,
                    page_id: parseInt(page_id),
                    tag_body: tag_body,
                    user_id: user_id,
                    group_id: group_id
                }, {
                  success: function(object) {
                  }
                });
            }
            
            //don't log google tracking events while offline
            // killing for now.  we can't make much use of this.
            // if( typeof _gaq !== "undefined" && !RDRAuth.isOffline ){
                // _gaq.push(['_trackEvent', category, action, opt_label, opt_value, opt_noninteraction]);
            // }
        },
        helpers: {
            trackFBLoginAttempt: function(){
                // RDRAuth.events.helpers.trackFBLoginAttempt

                var eventStr = 'FBLogin attempted';
                RDRAuth.events.track(eventStr);

                RDRAuth.events.trackEventToCloud({
                    // category: 'login',
                    // action: 'attempted',
                    // opt_label: 'auth: fb'
                    event_type: 'login attempt facebook',
                    event_value: 'start'
                });
            },
            trackFBLoginFail: function(){
                // RDRAuth.events.helpers.trackFBLoginFail
                var eventStr = 'FBLogin failed or was canceled';
                RDRAuth.events.track(eventStr);

                RDRAuth.events.trackEventToCloud({
                    // category: 'login',
                    // action: 'failed_or_canceled',
                    // opt_label: 'auth: fb'
                    event_type: 'login attempt facebook',
                    event_value: 'fail'
                });
            },
            trackRBLoginAttempt: function(){
                // RDRAuth.events.helpers.trackFBLoginAttempt

                var eventStr = 'RBLogin attempted';
                RDRAuth.events.track(eventStr);

                RDRAuth.events.trackEventToCloud({
                    // category: 'login',
                    // action: 'attempted',
                    // opt_label: 'auth: rb'
                    event_type: 'login attempt readrboard',
                    event_value: 'start'
                });
            },
            trackRBLoginFail: function(){
                // RDRAuth.events.helpers.trackFBLoginFail

                //I didn't find a clear way to track this yet.  Not being called...
                return;

                var eventStr = 'RBLogin failed or was canceled';
                RDRAuth.events.track(eventStr);

                RDRAuth.events.trackEventToCloud({
                    // category: 'login',
                    // action: 'failed_or_canceled',
                    // opt_label: 'auth: rb'
                    event_type: 'login attempt readrboard',
                    event_value: 'fail'
                });
            }
        }
    },
    postMessage: function(params) {
        if ( typeof $.postMessage == "function" ) {
            $.postMessage(
                params.message,
                qs_args.parentUrl,
                parent
            );
        }
    },
    notifyParent: function(response, status) {
        response.status = status;
        // send this info up to the widget!
        RDRAuth.postMessage({
            message: JSON.stringify( response )
        });
    },
    getUser: function() {
        RDRAuth.readUserCookie();
        if ( !RDRAuth.rdr_user.readr_token ) {
            // user is null.  get a tempUser.
            RDRAuth.createTempUser();
        } else if ( RDRAuth.rdr_user.readr_token ) {  // temp or non-temp.  doesn't matter.
            var sendData = {
                data : {
                    first_name : RDRAuth.rdr_user.first_name,
                    full_name : RDRAuth.rdr_user.full_name,
                    img_url : RDRAuth.rdr_user.img_url,
                    user_id : RDRAuth.rdr_user.user_id,
                    readr_token : RDRAuth.rdr_user.readr_token,
                    user_boards : RDRAuth.rdr_user.user_boards
                }
            };
            RDRAuth.notifyParent(sendData, "returning_user");
        }
    },
    getReadrToken: function(fb_response, callback ) {
        // if ( $.cookie('user_type') == "facebook" ) {
            if ( fb_response ) {
                var fb_session = (fb_response.authResponse) ? fb_response.authResponse:fb_response
                var sendData = {
                    fb: fb_session,
                    group_id: (qs_args.group_id) ? qs_args.group_id:1, // TODO aaaaaaaaaaaaaaagh remove GROUP ID and replace with NONCE
                    user_id: RDRAuth.rdr_user.user_id, // might be temp, might be the ID of a valid FB-created user
                    readr_token: RDRAuth.rdr_user.readr_token
                };

                $.ajax({
                    url: "/api/fb/",
                    type: "get",
                    contentType: "application/json",
                    dataType: "jsonp",
                    data: {
                        json: JSON.stringify( sendData )
                    },
                    success: function(response){
                        if ( response.status == "fail" ) {
                            RDRAuth.createTempUser();
                        } else {
                            RDRAuth.setUser(response);
                            RDRAuth.returnUser();
                            RDRAuth.notifyParent({}, "close login panel");
                            if (callback) callback();
                        }
                    },
                    error: function(response) {
                        RDRAuth.createTempUser();
                    }
                });
            } else {
                RDRAuth.doFBLogin();
            }
        // }
    },
    // simply tell the widget what we currently know about the user
    // optionally create a temp user
    createTempUser : function() {
        // if not calling from the iframe, don't create a temp user right now.
        if (parent.location == window.location) return;

        if ( (!RDRAuth.rdr_user.user_id && !RDRAuth.rdr_user.readr_token) ||  // no user data
             ( RDRAuth.rdr_user.user_id && RDRAuth.rdr_user.readr_token && !RDRAuth.rdr_user.temp_user) ) { // we have user data but believe it is wrong
            var sendData = {
                group_id : qs_args.group_id
            };
            $.ajax({
                url: "/api/tempuser/",
                type: "get",
                contentType: "application/json",
                dataType: "jsonp",
                data: {
                    json: JSON.stringify( sendData )
                },
                success: function(response){
                    // store the data here and in a cookie
                    RDRAuth.setUser(response);
                    var sendData = {
                        data : {
                            first_name : RDRAuth.rdr_user.first_name,
                            full_name : RDRAuth.rdr_user.full_name,
                            img_url : RDRAuth.rdr_user.img_url,
                            user_id : RDRAuth.rdr_user.user_id,
                            readr_token : RDRAuth.rdr_user.readr_token,
                            user_boards : RDRAuth.rdr_user.user_boards
                        }
                    };
                    RDRAuth.notifyParent(sendData, "got_temp_user");
                }
            });
        } else {
            var sendData = {
                data : {
                    first_name : RDRAuth.rdr_user.first_name,
                    full_name : RDRAuth.rdr_user.full_name,
                    img_url : RDRAuth.rdr_user.img_url,
                    user_id : RDRAuth.rdr_user.user_id,
                    readr_token : RDRAuth.rdr_user.readr_token,
                    user_boards : RDRAuth.rdr_user.user_boards
                }
            };
            RDRAuth.notifyParent(sendData, "got_temp_user");
        }
    },
    reauthUser : function(args) {
        if ( $.cookie('user_type') && $.cookie('user_type') == "facebook" || ( !$.cookie('user_type') ) ) {
            RDRAuth.readUserCookie();
            if ( !FB.getAuthResponse() ) {
                FB.getLoginStatus(function(response) {
                    if (response && response.status == "connected") {
                        RDRAuth.killUser( function(response) {
                            RDRAuth.getReadrToken(response); // function exists in readr_user.js
                        }, response);
                    } else {
                        RDRAuth.notifyParent({}, "fb_user_needs_to_login");
                    }
                });
            } else {
                RDRAuth.killUser( function(response) {
                    RDRAuth.getReadrToken(response); // function exists in readr_user.js
                });
            }
        } else {
            // readrboard user.  we don't have a reauth for RB users yet.  but widget should throw the login panel.
        }
    },
    quickFixAjaxLogout: function(){
        // RDRAuth.quickFixAjaxLogout:
        //this will at least give more of an appearance of an ajax log out when the login token expires.
        //it assumes the user will still do a login that will trigger a page refresh to fix it for real.
        $('#group_settings_menu').hide();
        $('#logged-in').hide();
        $('#logged-out').css({
            display: "block",
            visibility: 'visible'
        });
    },
    checkFBStatus: function(args) {
        FB.getLoginStatus( function(response) {
            if (response.status && response.status == "connected" ) {

                if( RDRAuth.checkIfWordpressRefresh() ){
                    return;
                }
                if( RDRAuth.closeWindowOnSuccess ){
                    window.close();
                }

                if (top == self) {
                    // now write the html for the user
                    if ( $.cookie('user_id') || ( RDRAuth.rdr_user && RDRAuth.rdr_user.user_id ) ) {
                        var user_id = ($.cookie('user_id')) ? $.cookie('user_id'):RDRAuth.rdr_user.user_id;
                        var img_url = RDRAuth.rdr_user.img_url;

                        $('#logged-in').show().css('visibility','visible');
                        $('#logged-out').hide().css('visibility','hidden');
                        FB.api('/me', function(response) {
                            
                            //update the login menu html
                            if( !$('#fb-login-button a.logging-in').length ){
                                return;
                            }
                            // reload the window only if they had just taken the action of clicking the login button.  janky-ish.
                            if ( $('#fb-login-button a').hasClass('logging-in') ) {
                                window.location.reload();
                                return;
                            }

                            // shouldn't need this.  the window reload above removes the need for it.
                            var $user = $('<a/>'),
                            $avatar = $('<img/>'),
                            $name = $('<strong/>');

                            $user.attr('href', '/user/'+user_id );
                            $avatar.attr('src', img_url + '?type=square');
                            $name.text( response.name );

                            $user.append( $avatar, $name );

                            var user_id = $.cookie('user_id'),
                                $user_menu = $('<div id="log-out-link" />');

                            $user_menu.append('<a href="/user/'+user_id+'">My Activity</a>' +
                                '<a href="/follows/'+user_id+'">Activity I Follow</a>' +
                                '<a href="javascript:void(0);" onclick="RDRAuth.logout();">Log Out</a>' +
                                '<h5>Settings</h5>' +
                                '<label for="private_profile">' +
                                  '(Reload the page to edit your setttings.)' +
                                '</label>');
                            $('#logged-in').html( $user ).append($user_menu);
                        
                        });
                    } else {
                        RDRAuth.getReadrToken( response.authResponse, function() { });
                    }
                } else {
                    // widget
                    $('#logged-in').show().css('visibility','visible');
                    $('#logged-out').hide().css('visibility','hidden');
                    RDRAuth.returnUser();
                }
            } else {
                if (top == self) {
                    $('#logged-in').hide().css('visibility','hidden');
                    $('#logged-out').show().css('visibility','visible');
                }   
            }
        });
    },
    FBLoginCallback: function(response) {
        if (response.authResponse) {
            RDRAuth.getReadrToken( FB.getAuthResponse(), function() {
                RDRAuth.checkFBStatus();
            });
        }else{
            RDRAuth.events.helpers.trackFBLoginFail();
        }
    },
    checkIfWordpressRefresh : function() {
        //temp hack to check if this is a wordpress iframe
        //todo: do this better
        var isWordpress = (function(){
            var searchStr = window.location.search;
            return searchStr.search(/hostplatform=wordpress/i) > 0;
        })();

        if(isWordpress){
            var wordpressEditUrl = '/wordpress_edit/';
            var query = window.location.search || "?";
            query += "&refresh=true";
            var wordpressRefreshUrl = wordpressEditUrl + query;

            window.location = wordpressRefreshUrl;
            //the page will refresh anyway, so this isn't needed, but it makes it more clear I think.
            return true;
        }
        return false;
    },

    checkRBLoginWindow : function() {
        if (!RDRAuth.checkingRBLoginWindow) {
            RDRAuth.checkingRBLoginWindow = setInterval( function(popup) {
                if ( RDRAuth.popups.loginWindow && RDRAuth.popups.loginWindow.closed ) {
                    RDRAuth.readUserCookie();
                    RDRAuth.returnUser();
                    RDRAuth.notifyParent({}, "close login panel");
                    RDRAuth.popups.loginWindow.close();
                    clearInterval( RDRAuth.checkingRBLoginWindow );
                    
                    // we should delete this here yeah?  I don't think clearInterval will make the if statement above false..  doesn't seem to be breaking shit now though.
                    // delete RDRAuth.checkingRBLoginWindow;

                    if( RDRAuth.checkIfWordpressRefresh() ){
                        return;
                    }
                    if (top == self) {
                        window.location.reload();
                    }
                }
            }, 250 );
        }
    },
    setUser : function(response) {
        RDRAuth.rdr_user = {};
        response.data = response.data || {};
        // if no first_name attribute is in the response, this is a temporary user.
        if ( response.data.first_name || response.data.full_name ) RDRAuth.rdr_user.temp_user = false;
        else RDRAuth.rdr_user.temp_user = true;

        RDRAuth.rdr_user.readr_token = response.data.readr_token;
        RDRAuth.rdr_user.user_id = response.data.user_id;
        RDRAuth.rdr_user.full_name = response.data.full_name;
        RDRAuth.rdr_user.first_name = response.data.full_name;
        RDRAuth.rdr_user.img_url = response.data.img_url;
        RDRAuth.rdr_user.user_type = response.data.user_type;
        RDRAuth.rdr_user.user_boards = JSON.stringify(response.data.user_boards);

        var session_expiry = new Date(); 
        session_expiry.setMinutes( session_expiry.getMinutes() + 60 );
        //Use 1 hour for the rdr_session.  30 days for everything else.
        var expTime = 90;

        $.cookie('temp_user', RDRAuth.rdr_user.temp_user, { expires: expTime, path: '/' });
        $.cookie('readr_token', RDRAuth.rdr_user.readr_token, { expires: expTime, path: '/' });
        $.cookie('user_id', RDRAuth.rdr_user.user_id, { expires: expTime, path: '/' });
        $.cookie('user_type', RDRAuth.rdr_user.user_type, { expires: expTime, path: '/' });

        //try out just using 90 days for everything - we're checking fb login every time anyway.
        // $.cookie('rdr_session', 'true', { expires: expTime, path:'/' });
        // $.cookie('rdr_session', 'true', { expires:session_expiry, path:'/' });
    },
    readUserCookie: function() {
        //set everything every time - let it be null if null.  Otherwise, some old values don't get overwritten.
        RDRAuth.rdr_user.temp_user = $.cookie('temp_user');
        RDRAuth.rdr_user.readr_token = $.cookie('readr_token');
        RDRAuth.rdr_user.user_id = $.cookie('user_id');
        RDRAuth.rdr_user.user_type = $.cookie('user_type');
        
    },
    returnUser: function() {
        RDRAuth.readUserCookie();
        if (top == self) {
            // we're on the site
            if ( $.cookie('user_type') && $.cookie('user_type') == "facebook" ) {
                RDRAuth.checkFBStatus();
            } else {
                if ( $.cookie('user_id') ) {
                    $('#logged-in').show().css('visibility','visible');
                    $('#logged-out').hide().css('visibility','hidden');

                    var $user = $('<a/>'),
                    // $avatar = $('<img/>'),
                    $name = $('<strong/>');

                    $user.attr('href', '/user/' + $.cookie('user_id') );
                    var username = "friend";
                    $name.text( username );

                    $user.append( $name );
                }
            }
        } else {
            var sendData = {
                // arguments are nested under data for consistency with passing values up to the parent
                data : {
                    first_name : RDRAuth.rdr_user.first_name,
                    full_name : RDRAuth.rdr_user.full_name,
                    img_url : RDRAuth.rdr_user.img_url,
                    user_id : RDRAuth.rdr_user.user_id,
                    readr_token : RDRAuth.rdr_user.readr_token,
                    user_type : RDRAuth.rdr_user.user_type
                }
            };
            RDRAuth.notifyParent(sendData, "returning_user");
        }
    },
    killUser : function(callback, callback_args) {
        // if ( RDRAuth.rdr_user && RDRAuth.rdr_user.user_id && RDRAuth.rdr_user.readr_token && RDRAuth.rdr_user.first_name ) {
        if ( RDRAuth.rdr_user && RDRAuth.rdr_user.temp_user == "false" ) {
            // deauth a full user
            var sendData = {
                user_id : RDRAuth.rdr_user.user_id,
                readr_token : RDRAuth.rdr_user.readr_token
            };

            $.ajax({
                url: "/api/deauthorize/",
                type: "get",
                contentType: "application/json",
                context: {callback_args:callback_args},
                dataType: "jsonp",
                data: {
                    json: JSON.stringify( sendData )
                },
                success: function(response){
          
                    RDRAuth.clearSessionCookies();

                    RDRAuth.rdr_user = {};
                    if (callback && this.callback_args) {
                        callback(this.callback_args);
                    } else if (callback) {
                        callback();
                    }
                }
            });
        } else {
            // just a temp user
            RDRAuth.clearSessionCookies();
          
            if (callback && callback_args) {
                callback(callback_args);
            } else if (callback) {
                callback();
            }
        }
    },

    clearSessionCookies: function(){
        // RDRAuth.clearSessionCookies
        $.cookie('temp_user', null, { path: '/' });
        $.cookie('readr_token', null, { path: '/' });
        $.cookie('user_id', null, { path: '/' });
        $.cookie('user_type', null, { path: '/' });
        $.cookie('rdr_session', null, { path: '/' });
        $.cookie('rdr_user', null, { path: '/' });
    },

    doFBLogin: function(requesting_action) {
        // RDRAuth.doFBLogin

        RDRAuth.events.helpers.trackFBLoginAttempt();

        FB.login(function(response) {
            RDRAuth.FBLoginCallback(response);
        }, {scope: 'email'});
    },
    doRBLogin: function(requesting_action) {
        // RDRAuth.doRBLogin
        RDRAuth.events.helpers.trackRBLoginAttempt();
        RDRAuth.openRbLoginWindow();
    },
    doRBlogout: function() {
         RDRAuth.killUser( function() {
                    window.location.reload(); 
                }); 
    },  
    logout: function() {
        if ( $.cookie('user_type') && $.cookie('user_type') == "facebook" ) {
            FB.getLoginStatus(function(response) {
                if (response) {
                    FB.logout(function(response) {
                        RDRAuth.killUser( function() {
                            window.location.reload(); 
                        });     
                    }); 
                } else {
                    RDRAuth.killUser( function() {
                        window.location.reload(); 
                    }); 
                }
            });
        } else {
            RDRAuth.killUser( function() {
                window.location.reload(); 
            }); 
        }
    },
    init : function() {
    RDRAuth.notifyParent({}, "xdm loaded");
        if ( $.cookie('user_type') && $.cookie('user_type') == "facebook") {
            FB.getLoginStatus( function(response) {
                if ( response.status && response.status == "connected" ) {
                    RDRAuth.getReadrToken( response.authResponse, function() {});
                }else{        
                    RDRAuth.killUser( function() {
                    });
                }
            });
        } else {
          RDRAuth.returnUser();
        }
    },
    decodeDjangoCookie : function(value) {
        if (value) return value.replace(/"/g,'').replace(/\\054/g,",").replace(/\\073/g,";");
    }
}

$(document).ready(function(){

    //wait for fb init initing RDRAuth
    window.fb_loader.done(function(){
        RDRAuth.init();
    });
    
    //wait for fb init before receiving messages
    window.fb_loader.done(function(){

        if ( typeof $.receiveMessage == "function") {
            $.receiveMessage(
                function(e){

                    var keys = {
                        registerEvent: "register-event::"
                    };
                    var jsonData;
                    var data;

                    if( e.data == "getUser" ) {
                        RDRAuth.getUser();
                    } else if ( e.data == "reloadXDMframe" ) {
                        window.location.reload();
                    } else if ( e.data == "reauthUser" ) {
                        RDRAuth.reauthUser();
                    } else if ( e.data == "returnUser" ) {
                        RDRAuth.returnUser();
                    } else if ( e.data == "killUser" ) {
                        RDRAuth.killUser();
                    } else if ( e.data == "TESTIT" ) {
                        RDRAuth.testMessage();
                    } else if ( e.data.indexOf("page_hash") != -1 ) {
                        //todo: this seems touchy to set this cookie forever like this.
                        $.cookie('page_hash', e.data.split('|')[1], { expires: 365, path: '/' } );
                    } else if ( e.data.indexOf(keys.registerEvent) != -1 ) {
                        jsonData = e.data.split(keys.registerEvent)[1];
                        data = $.parseJSON(jsonData);
                        RDRAuth.events.trackEventToCloud(data);
                    }
                },
                qs_args.parentHost
            );
        }
    });
});