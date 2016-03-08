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
}

var trackingUrl = process.env.EVENTS_URL;

window.ANTAuth = {
    ant_user: {},
    popups: {},
    //todo: make this stuff better
    openGenericLoginWindow: function(options){
        var windowProps = getWindowProps(options);
        ANTAuth.checkAntLoginWindow();
        ANTAuth.popups.loginWindow = window.open(
            ANT_baseUrl+'/login/',
            'ant_login',
            windowProps
        );
        ANTAuth.popups.loginWindow.focus();
        return false;
    },
    openFBLoginWindowFromPopup: function(options){
        ANTAuth.closeWindowOnSuccess = true;
        ANTAuth.doFBLogin();
        return false;
    },
    openAntLoginWindow: function(options){   
        var windowProps = getWindowProps(options);
        ANTAuth.checkAntLoginWindow();
        
        ANTAuth.popups.loginWindow = window.open(
            ANT_baseUrl+'/ant_login/',
            'ant_login',
            windowProps
        );
        ANTAuth.popups.loginWindow.focus();
        return false;
    },
    openAntCreateNewAccountWindow: function(options, replaceCurrentWindow){
        var windowProps = getWindowProps(options);
        ANTAuth.checkAntLoginWindow();
        ANTAuth.popups.loginWindow = window.open(
            ANT_baseUrl+'/user_create/',
            'ant_create_user',
            windowProps
        );
        ANTAuth.popups.loginWindow.focus();
        if(replaceCurrentWindow){
            window.close();
        }
        return false;
    },
    openAntForgotPasswordWindow: function(options){
        var windowProps = getWindowProps(options);
        ANTAuth.checkAntLoginWindow();
        ANTAuth.popups.loginWindow = window.open(
            ANT_baseUrl+'/request_password/',
            'ant_forgot_pw',
            windowProps
        );
        ANTAuth.popups.loginWindow.focus();
        return false;
    },
    openAntAvatarUploadWindow: function(options){
        var windowProps = getWindowProps(options);
        ANTAuth.popups.loginWindow = window.open(
            ANT_baseUrl+'/user_modify/',
            'ant_avatar_upload',
            windowProps
        );
        ANTAuth.checkAntLoginWindow();
        ANTAuth.popups.loginWindow.focus();
        return false;
    },
    openChangePasswordWindow: function(options){
        var windowProps = getWindowProps(options);
        ANTAuth.popups.loginWindow = window.open(
            ANT_baseUrl+'/change_password/',
            'ant_change_password',
            windowProps
        );
        ANTAuth.checkAntLoginWindow();
        ANTAuth.popups.loginWindow.focus();
        return false;
    },
    events: {
        track: function( data ) {
            // ANTAuth.events.track:
            // mirrors the event tracker from the widget
            var standardData = "";

            if ( ANTAuth.ant_user && ANTAuth.ant_user.user_id ) standardData += "||uid::"+ANTAuth.ant_user.user_id;
            if ( (qs_args && (qs_args.group_id) ) ) standardData += "||gid::"+(qs_args.group_id);
            
            var eventSrc = data+standardData,
                $event = $('<img src="'+ANT_baseUrl+'/static/widget/images/event.png?'+eventSrc+'" />'); // NOT using STATIC_URL b/c we need the request in our server logs, and not on S3's logs

            $('#ant_event_pixels').append($event);
        },
        trackEventToCloud: function(params){
            $.ajax({
                url: trackingUrl,
                type: "get",
                contentType: "application/json",
                dataType: "jsonp",
                data: {
                    json: JSON.stringify( params )
                },
                success : function(response)
                {
                }
            });
        },
        helpers: {
            trackFBLoginAttempt: function(){
                // ANTAuth.events.helpers.trackFBLoginAttempt

                var eventStr = 'FBLogin attempted';
                ANTAuth.events.track(eventStr);

                ANTAuth.events.trackEventToCloud({
                    // category: 'login',
                    // action: 'attempted',
                    // opt_label: 'auth: fb'
                    event_type: 'login attempt facebook',
                    event_value: 'start'
                });
            },
            trackFBLoginFail: function(){
                // ANTAuth.events.helpers.trackFBLoginFail
                var eventStr = 'FBLogin failed or was canceled';
                ANTAuth.events.track(eventStr);

                ANTAuth.events.trackEventToCloud({
                    // category: 'login',
                    // action: 'failed_or_canceled',
                    // opt_label: 'auth: fb'
                    event_type: 'login attempt facebook',
                    event_value: 'fail'
                });
            },
            trackAntLoginAttempt: function(){
                // ANTAuth.events.helpers.trackFBLoginAttempt

                var eventStr = 'AntLogin attempted';
                ANTAuth.events.track(eventStr);

                ANTAuth.events.trackEventToCloud({
                    // category: 'login',
                    // action: 'attempted',
                    // opt_label: 'auth: ant'
                    event_type: 'login attempt antenna',
                    event_value: 'start'
                });
            },
            trackAntLoginFail: function(){
                // ANTAuth.events.helpers.trackFBLoginFail

                //I didn't find a clear way to track this yet.  Not being called...
                return;

                var eventStr = 'AntLogin failed or was canceled';
                ANTAuth.events.track(eventStr);

                ANTAuth.events.trackEventToCloud({
                    // category: 'login',
                    // action: 'failed_or_canceled',
                    // opt_label: 'auth: ant'
                    event_type: 'login attempt antenna',
                    event_value: 'fail'
                });
            }
        }
    },
    notifyParent: function(messageKey, detail) {
        // Use postMessage to send the message to the parent window
        var message = {
            key: messageKey,
            detail: detail
        };
        window.parent.postMessage(message, qs_args.parentUrl);
    },
    sendUser: function() {
        var user = ANTAuth.ant_user || {};
        var detail = {
            first_name: user.first_name,
            full_name: user.full_name,
            img_url: user.img_url,
            user_id: user.user_id,
            ant_token: user.ant_token,
            user_type: user.user_type
        };
        ANTAuth.notifyParent("sendUser", detail);
    },
    getUser: function() {
        ANTAuth.readUserCookie();
        if ( !ANTAuth.ant_user.ant_token ) {
            ANTAuth.createTempUser();
        } else {
            ANTAuth.sendUser();
        }
    },
    getAntToken: function(fb_response, callback ) {
        if (fb_response) {
            var fb_session = fb_response.authResponse ? fb_response.authResponse : fb_response;
            var sendData = {
                fb: fb_session,
                group_id: (qs_args.group_id) ? qs_args.group_id : 1, // TODO aaaaaaaaaaaaaaagh remove GROUP ID and replace with NONCE
                user_id: ANTAuth.ant_user.user_id, // might be temp, might be the ID of a valid FB-created user
                ant_token: ANTAuth.ant_user.ant_token
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
                        ANTAuth.createTempUser();
                    } else {
                        ANTAuth.setUser(response);
                        ANTAuth.returnUser();
                        ANTAuth.notifyParent("close login panel");
                        if (callback) callback();
                    }
                },
                error: function(response) {
                    ANTAuth.createTempUser();
                }
            });
        } else {
            ANTAuth.doFBLogin();
        }
    },
    // simply tell the widget what we currently know about the user
    // optionally create a temp user
    createTempUser : function() {
        // if not calling from the iframe, don't create a temp user right now.
        if (parent.location == window.location) return;

        if (!ANTAuth.ant_user.user_id || !ANTAuth.ant_user.ant_token || !ANTAuth.ant_user.temp_user) {
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
                success: function(response) {
                    if (!ANTAuth.ant_user.user_id || !ANTAuth.ant_user.ant_token || !ANTAuth.ant_user.temp_user) {
                        // It's possible that multiple of these ajax requests got fired in parallel. Whichever one
                        // comes back first wins.
                        ANTAuth.setUser(response);
                    }
                    ANTAuth.sendUser();
                }
            });
        } else {
            ANTAuth.sendUser();
        }
    },
    reauthUser : function(args) {
        if ( $.cookie('user_type') && $.cookie('user_type') == "facebook" || ( !$.cookie('user_type') ) ) {
            ANTAuth.readUserCookie();
            if ( !FB.getAuthResponse() ) {
                FB.getLoginStatus(function(response) {
                    if (response && response.status == "connected") {
                        ANTAuth.killUser(function() {
                            ANTAuth.getAntToken(response);
                        });
                    } else {
                        ANTAuth.returnUser();
                    }
                });
            } else {
                ANTAuth.killUser( function() {
                    ANTAuth.getAntToken();
                });
            }
        } else {
            // antenna user.  we don't have a reauth for ANT users yet.  but widget should throw the login panel.
            ANTAuth.returnUser();
        }
    },
    quickFixAjaxLogout: function(){
        // ANTAuth.quickFixAjaxLogout:
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

                if( ANTAuth.checkIfWordpressRefresh() ){
                    return;
                }
                if( ANTAuth.closeWindowOnSuccess ){
                    window.close();
                }

                if (top == self) {
                    // now write the html for the user
                    if ( $.cookie('user_id') || ( ANTAuth.ant_user && ANTAuth.ant_user.user_id ) ) {
                        var user_id = ($.cookie('user_id')) ? $.cookie('user_id'):ANTAuth.ant_user.user_id;
                        var img_url = ANTAuth.ant_user.img_url;

                        $('#logged-in').show().css('visibility','visible');
                        $('#logged-out').hide().css('visibility','hidden');
                        FB.api('/me', function(response) {
                            
                            // reload the window only if they had just taken the action of clicking the login button.  janky-ish.
                            if ( $('#fb-login-button a').hasClass('logging-in') ) {
                                window.location.reload();
                                return;
                            }

                            //update the login menu html, if there was no cookie user for base.html to prepopulate
                            if( !$('.userSettingsMenu').length ){
                                var $user = $('<a/>'),
                                $avatar = $('<img/>'),
                                $name = $('<strong/>');

                                $user.attr('href', '/user/'+user_id );
                                $avatar.attr('src', img_url + '?type=square');
                                // $name.text( response.name );

                                // $user.append( $avatar, $name );
                                $user.append( $avatar );

                                var user_id = $.cookie('user_id'),
                                    $user_menu = $('<div id="log-out-link" />');

                                $user_menu.append('<a href="/user/'+user_id+'">My Activity</a>' +
                                    '<a href="/follows/'+user_id+'">Activity I Follow</a>' +
                                    '<a href="javascript:void(0);" onclick="ANTAuth.logout();">Log Out</a>' +
                                    '<h5>Settings</h5>' +
                                    '<label for="private_profile">' +
                                      '(Reload the page to edit your setttings.)' +
                                    '</label>');
                                $('#logged-in').html( $user ).append($user_menu);
                            }
                        
                        });
                    } else {
                        ANTAuth.getAntToken( response.authResponse, function() { });
                    }
                } else {
                    // widget
                    $('#logged-in').show().css('visibility','visible');
                    $('#logged-out').hide().css('visibility','hidden');
                    ANTAuth.returnUser();
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
            ANTAuth.getAntToken( FB.getAuthResponse(), function() {
                ANTAuth.checkFBStatus();
            });
        }else{
            ANTAuth.events.helpers.trackFBLoginFail();
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

    checkAntLoginWindow : function() {
        if (!ANTAuth.checkingAntLoginWindow) {
            ANTAuth.checkingAntLoginWindow = setInterval( function(popup) {
                if ( ANTAuth.popups.loginWindow && ANTAuth.popups.loginWindow.closed ) {
                    ANTAuth.readUserCookie();
                    ANTAuth.returnUser();
                    ANTAuth.notifyParent("close login panel");
                    ANTAuth.popups.loginWindow.close();
                    clearInterval( ANTAuth.checkingAntLoginWindow );
                    
                    // we should delete this here yeah?  I don't think clearInterval will make the if statement above false..  doesn't seem to be breaking shit now though.
                    // delete ANTAuth.checkingAntLoginWindow;

                    if( ANTAuth.checkIfWordpressRefresh() ){
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
        ANTAuth.ant_user = {};
        response.data = response.data || {};
        // if no first_name attribute is in the response, this is a temporary user.
        if ( response.data.first_name || response.data.full_name ) ANTAuth.ant_user.temp_user = false;
        else ANTAuth.ant_user.temp_user = true;

        ANTAuth.ant_user.ant_token = response.data.ant_token;
        ANTAuth.ant_user.user_id = response.data.user_id;
        ANTAuth.ant_user.full_name = response.data.full_name;
        ANTAuth.ant_user.first_name = response.data.full_name;
        ANTAuth.ant_user.img_url = response.data.img_url;
        ANTAuth.ant_user.user_type = response.data.user_type;
        ANTAuth.ant_user.user_boards = JSON.stringify(response.data.user_boards);

        var session_expiry = new Date(); 
        session_expiry.setMinutes( session_expiry.getMinutes() + 60 );
        //Use 1 hour for the ant_session.  30 days for everything else.
        var expTime = 90;

        $.cookie('temp_user', ANTAuth.ant_user.temp_user, { expires: expTime, path: '/' });
        $.cookie('ant_token', ANTAuth.ant_user.ant_token, { expires: expTime, path: '/' });
        $.cookie('user_id', ANTAuth.ant_user.user_id, { expires: expTime, path: '/' });
        $.cookie('user_type', ANTAuth.ant_user.user_type, { expires: expTime, path: '/' });

        //try out just using 90 days for everything - we're checking fb login every time anyway.
        // $.cookie('ant_session', 'true', { expires: expTime, path:'/' });
        // $.cookie('ant_session', 'true', { expires:session_expiry, path:'/' });
    },
    readUserCookie: function() {
        //set everything every time - let it be null if null.  Otherwise, some old values don't get overwritten.
        ANTAuth.ant_user.temp_user = $.cookie('temp_user');
        ANTAuth.ant_user.ant_token = $.cookie('ant_token');
            // handle readr_token cookie so we don't delete those valuable sessions
            if (!$.cookie('ant_token')) {
                ANTAuth.ant_user.ant_token = $.cookie('readr_token');
            }
        ANTAuth.ant_user.user_id = $.cookie('user_id');
        ANTAuth.ant_user.user_type = $.cookie('user_type');
        
    },
    returnUser: function() {
        ANTAuth.readUserCookie();
        if (top == self) {
            // we're on the site
            if ( $.cookie('user_type') && $.cookie('user_type') == "facebook" ) {
                ANTAuth.checkFBStatus();
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
            ANTAuth.sendUser();
        }
    },
    killUser : function(callback) {
        if ( ANTAuth.ant_user && !ANTAuth.ant_user.temp_user ) {
            // deauth a full user
            var sendData = {
                user_id : ANTAuth.ant_user.user_id,
                ant_token : ANTAuth.ant_user.ant_token
            };

            $.ajax({
                url: "/api/deauthorize/",
                type: "get",
                contentType: "application/json",
                dataType: "jsonp",
                data: {
                    json: JSON.stringify( sendData )
                },
                success: function(response) {
                    ANTAuth.clearSessionCookies();
                    ANTAuth.ant_user = {};
                    callback();
                }
            });
        } else {
            ANTAuth.clearSessionCookies(); // Throw out the temp user if we have one.
            callback();
        }
    },

    clearSessionCookies: function(){
        // ANTAuth.clearSessionCookies
        $.cookie('temp_user', null, { path: '/' });
        $.cookie('ant_token', null, { path: '/' });
        $.cookie('user_id', null, { path: '/' });
        $.cookie('user_type', null, { path: '/' });
        $.cookie('ant_session', null, { path: '/' });
        $.cookie('ant_user', null, { path: '/' });
    },

    doFBLogin: function(requesting_action) {
        // ANTAuth.doFBLogin

        ANTAuth.events.helpers.trackFBLoginAttempt();

        FB.login(function(response) {
            ANTAuth.FBLoginCallback(response);
        }, {scope: 'email'});
    },
    doAntLogin: function(requesting_action) {
        // ANTAuth.doAntLogin
        ANTAuth.events.helpers.trackAntLoginAttempt();
        ANTAuth.openAntLoginWindow();
    },
    doAntlogout: function() {
         ANTAuth.killUser( function() {
                    window.location.reload(); 
                }); 
    },  
    logout: function() {
        if ( $.cookie('user_type') && $.cookie('user_type') == "facebook" ) {
            FB.getLoginStatus(function(response) {
                if (response) {
                    FB.logout(function(response) {
                        ANTAuth.killUser( function() {
                            window.location.reload(); 
                        });     
                    }); 
                } else {
                    ANTAuth.killUser( function() {
                        window.location.reload(); 
                    }); 
                }
            });
        } else {
            ANTAuth.killUser( function() {
                window.location.reload(); 
            }); 
        }
    },
    init : function() {
        ANTAuth.notifyParent("xdm loaded");
        if ( $.cookie('user_type') && $.cookie('user_type') == "facebook") {
            FB.getLoginStatus( function(response) {
                if ( response.status && response.status == "connected" ) {
                    ANTAuth.getAntToken( response.authResponse, function() {});
                }else{        
                    ANTAuth.killUser( function() {
                    });
                }
            });
        } else {
          ANTAuth.returnUser();
        }
    },
    decodeDjangoCookie : function(value) {
        if (value) return value.replace(/"/g,'').replace(/\\054/g,",").replace(/\\073/g,";");
    }
}

$(document).ready(function(){

    //wait for fb init initing ANTAuth
    window.fb_loader.done(function(){
        ANTAuth.init();
    });
    
    //wait for fb init before receiving messages
    window.fb_loader.done(function(){

        // Register ourselves to hear messages
        window.addEventListener("message", receiveMessage, false);

        function receiveMessage(e) {
            if (e.origin === qs_args.parentHost && typeof e.data === 'string') {
                // TODO: Review. The rest of this is original code
                var keys = {
                    registerEvent: "register-event::"
                };
                var jsonData;
                var data;

                if( e.data == "getUser" ) {
                    ANTAuth.getUser();
                } else if ( e.data == "reloadXDMframe" ) {
                    window.location.reload();
                } else if ( e.data == "reauthUser" ) {
                    ANTAuth.reauthUser();
                } else if ( e.data == "returnUser" ) {
                    ANTAuth.returnUser();
                } else if ( e.data == "killUser" ) {
                    ANTAuth.killUser();
                } else if ( e.data == "TESTIT" ) {
                    ANTAuth.testMessage();
                } else if ( e.data.indexOf("page_hash") != -1 ) {
                    //todo: this seems touchy to set this cookie forever like this.
                    $.cookie('page_hash', e.data.split('|')[1], { expires: 365, path: '/' } );
                } else if ( e.data.indexOf(keys.registerEvent) != -1 ) {
                    jsonData = e.data.split(keys.registerEvent)[1];
                    data = JSON.parse(jsonData);
                    ANTAuth.events.trackEventToCloud(data);
                }
            }
        }
    });
});
