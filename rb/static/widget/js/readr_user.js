// querystring stuff
// used to create an array called qs_args which holds key/value paris from the querystring of the iframe
var qs = ( window.location.search + window.location.hash ).substr(1).split('&');
var qs_args = [];
for ( var i in qs ) {
	var this_arg = qs[i].split('=');
	qs_args[this_arg[0]] = this_arg[1];
}
if ( typeof qs_args.group_id == "undefined" ) qs_args.group_id = "";
if ( typeof $.receiveMessage == "function") {
	$.receiveMessage(
		function(e){
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
	    		$.cookie('page_hash', e.data.split('|')[1], { expires: 365, path: '/' } );
	    	}
		},
		qs_args.parentHost
	);
}

function getWindowProps(options){
    options = options || {};
    var w = options.width || 400;
    var h = options.height || 300;
    var l = (window.screen.width/2)-(w/2);
    var t = (window.screen.height/2)-(h/2);
    return 'menubar=1,resizable=1,scrollbars=yes,width='+w+',height='+h+',top='+t+',left='+l;
};

window.RDRAuth = {
    isOffline: (document.domain == "local.readrboard.com"),
    popupBlockAudit: function( sourceFileStr, sourceFuncStr ){
        // RDRAuth.popupBlockAudit
        sourceFileStr = sourceFileStr || "";
        sourceFuncStr = sourceFuncStr || "";
        var sourceStr = sourceFileStr + ( sourceFuncStr ? "."+sourceFuncStr : "" );

        var eventStr = 'FBLogin failed or was canceled - source: ' +sourceStr;
        RDRAuth.events.track(eventStr);
        RDRAuth.events.trackGoogleEvent('login', 'failed', 'fb - from:'+sourceStr);

        if(RDRAuth.isOffline){
            //uncomment this for quick testing on local
            // alert(eventStr);
        }
    },
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
	events : {
		track : function( data ) {
	        // RDRAuth.events.track
	        // mirrors the event tracker from the widget
	        var standardData = "";

	        if ( RDRAuth.rdr_user && RDRAuth.rdr_user.user_id ) standardData += "||uid::"+RDRAuth.rdr_user.user_id;
	        if ( (qs_args && (qs_args.group_id) ) ) standardData += "||gid::"+(qs_args.group_id);
	        
	        var eventSrc = data+standardData,
	            $event = $('<img src="'+RDR_baseUrl+'/static/widget/images/event.png?'+eventSrc+'" />'); // NOT using STATIC_URL b/c we need the request in our server logs, and not on S3's logs

	        $('#rdr_event_pixels').append($event);

            // if(RDRAuth.isOffline){
            //     console.log(eventSrc);
            // }
    	},
        trackGoogleEvent: function(category, action, opt_label, opt_value, opt_noninteraction){
            //record to google events as well.
            //see https://developers.google.com/analytics/devguides/collection/gajs/eventTrackerGuide#SettingUpEventTracking
            if( typeof _gaq === "undefined" ){
                return;
            }
            _gaq.push(['_trackEvent', category, action, opt_label, opt_value, opt_noninteraction]);
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
	checkFBStatus : function(args) {
		FB.getLoginStatus( function(response) {
			if (response.status && response.status == "connected" ) {

                if( RDRAuth.checkIfWordpressRefresh() ){
                    return;
                }
                if( RDRAuth.closeWindowOnSuccess ){
                    window.close();
                }

				if (top == self) {
					// QUICK KLUDGE
					// TODO what we really need is a /api/getUserInfo call to get first/last name from our server, and store it in a session, not a cookie
					// now write the html for the user
					if ( $.cookie('user_id') || ( RDRAuth.rdr_user && RDRAuth.rdr_user.user_id ) ) {
						var user_id = ($.cookie('user_id')) ? $.cookie('user_id'):RDRAuth.rdr_user.user_id;
						var img_url = ($.cookie('img_url')) ? $.cookie('img_url'):RDRAuth.rdr_user.img_url;

						$('#logged-in').show().css('visibility','visible');
						$('#logged-out').hide().css('visibility','hidden');
						FB.api('/me', function(response) {
							if ( $('#fb-login-button a.logging-in').length ) {
							// 	// reload the window only if they had just taken the action of clicking the login button.  janky-ish.
								if ( $('#fb-login-button a').hasClass('logging-in') ) {
									window.location.reload();
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
									user_name = $.cookie('full_name');
									$user_menu = $('<div id="log-out-link" />');

								$user_menu.append('<a href="/user/'+user_id+'">My Activity</a>' +
						            '<a href="/follows/'+user_id+'">Activity I Follow</a>' +
						            '<a href="javascript:void(0);" onclick="RDRAuth.logout();">Log Out</a>' +
						            '<h5>Settings</h5>' +
						            '<label for="private_profile">' +
						              '(Reload the page to edit your setttings.)' +
						            //   'Profile is private' +
						            // '</label>' +
						            // '<label for="follow_email">' +
						            //   '<input type="checkbox" id="follow_email" {% if cookie_user.social_user.follow_email_option %}checked="checked"{% endif %} /> ' +
						            //   'Send me email when someone follows my activity.' +
						            '</label>');
								$('#logged-in').html( $user ).append($user_menu);
							}
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
            RDRAuth.popupBlockAudit('readr_user', 'FBLoginCallback');
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
		// if no first_name attribute is in the response, this is a temporary user.
		if ( response.data.first_name || response.data.full_name ) RDRAuth.rdr_user.temp_user = false;
		else RDRAuth.rdr_user.temp_user = true;
		RDRAuth.rdr_user.full_name = response.data.full_name;
		RDRAuth.rdr_user.first_name = response.data.full_name;
		RDRAuth.rdr_user.img_url = response.data.img_url;
		RDRAuth.rdr_user.user_id = response.data.user_id;
		RDRAuth.rdr_user.readr_token = response.data.readr_token;
		RDRAuth.rdr_user.user_type = response.data.user_type;
		RDRAuth.rdr_user.user_boards = JSON.stringify(response.data.user_boards);
		$.cookie('first_name', RDRAuth.rdr_user.first_name, { expires: 365, path: '/' });
		$.cookie('full_name', RDRAuth.rdr_user.full_name, { expires: 365, path: '/' });
		$.cookie('temp_user', RDRAuth.rdr_user.temp_user, { expires: 365, path: '/' });
		$.cookie('img_url', RDRAuth.rdr_user.img_url, { expires: 365, path: '/' });
		$.cookie('user_id', RDRAuth.rdr_user.user_id, { expires: 365, path: '/' });
		$.cookie('readr_token', RDRAuth.rdr_user.readr_token, { expires: 365, path: '/' });
		$.cookie('user_type', RDRAuth.rdr_user.user_type, { expires: 365, path: '/' });
		$.cookie('user_boards', RDRAuth.rdr_user.user_boards, { expires: 365, path: '/' });

		var session_expiry = new Date(); 
		session_expiry.setMinutes( session_expiry.getMinutes() + 60 );
		$.cookie('rdr_session', 'true', { expires:session_expiry, path:'/' });
	},
	readUserCookie : function() {
		if ( $.cookie('first_name') ) RDRAuth.rdr_user.first_name = $.cookie('first_name');
		if ( $.cookie('full_name') ) RDRAuth.rdr_user.full_name = $.cookie('full_name');
		if ( $.cookie('img_url') ) RDRAuth.rdr_user.img_url = $.cookie('img_url');
		if ( $.cookie('user_id') ) RDRAuth.rdr_user.user_id = $.cookie('user_id');
		if ( $.cookie('readr_token') ) RDRAuth.rdr_user.readr_token = $.cookie('readr_token');
		if ( $.cookie('temp_user') ) RDRAuth.rdr_user.temp_user = $.cookie('temp_user');
		if ( $.cookie('user_type') ) RDRAuth.rdr_user.user_type = $.cookie('user_type');
		if ( $.cookie('user_boards') ) RDRAuth.rdr_user.user_boards = $.cookie('user_boards');
	},
	returnUser : function() {
		RDRAuth.readUserCookie();
		if (top == self) {
			// we're on the site
			if ( $.cookie('user_type') && $.cookie('user_type') == "facebook" ) {
				RDRAuth.checkFBStatus();
			} else {
				if ( $.cookie('user_id') && $.cookie('full_name') ) {
					$('#logged-in').show().css('visibility','visible');
					$('#logged-out').hide().css('visibility','hidden');

	  				var $user = $('<a/>'),
					// $avatar = $('<img/>'),
					$name = $('<strong/>');

					$user.attr('href', '/user/' + $.cookie('user_id') );
					// $avatar.attr('src', img_url + '?type=square');
					var username = ( $.cookie('full_name') ) ? $.cookie('full_name'):$.cookie('first_name');
					$name.text( username );

					$user.append( $name );

					// $('#logged-in').html( $user ).append('<div id="log-out-link"><a href="javascript:void(0);" onclick="RDRAuth.logout();">Log Out</a></div>');
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
					user_type : RDRAuth.rdr_user.user_type,
					user_boards : RDRAuth.rdr_user.user_boards,
					new_board_id : parseInt($.cookie('new_board_id')),
					new_board_name : $.cookie('new_board_name')
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
					$.cookie('first_name', null, { path: '/' });
					$.cookie('full_name', null, { path: '/' });
					$.cookie('img_url', null, { path: '/' });
					$.cookie('user_id', null, { path: '/' });
					$.cookie('readr_token', null, { path: '/' });
					$.cookie('user_type', null, { path: '/' });
					$.cookie('user_boards', null, { path: '/' });
					$.cookie('rdr_session', null);
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
			$.cookie('img_url', null, { path: '/' });
			$.cookie('user_id', null, { path: '/' });
			$.cookie('readr_token', null, { path: '/' });
			$.cookie('rdr_session', null);
			$.cookie('temp_user', null);
			$.cookie('user_type', null);
			RDRAuth.rdr_user = {};
			if (callback && callback_args) {
				callback(callback_args);
			} else if (callback) {
				callback();
			}
		}
	},

    //only using this sometimes - other cases we call the inner FB.login function inline... try to gauge if one causes more popup blocking
	doFBLogin: function(requesting_action) {
		// RDRAuth.doFBLogin
		FB.login(function(response) {
            RDRAuth.FBLoginCallback(response);
		}, {scope: 'email'});
	},
	doRBLogin: function(requesting_action) {
        // RDRAuth.doRBLogin
        

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
		if ( $.cookie('user_type') && $.cookie('user_type') == "facebook" && !$.cookie('rdr_session' ) ) {
			FB.getLoginStatus( function(response) {
				if ( response.status && response.status == "connected" ) {
					RDRAuth.getReadrToken( response.authResponse, function() {});
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
    RDRAuth.init();
});