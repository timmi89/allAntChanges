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
	    	} else if ( e.data == "reauthUser" ) {
		    	RDRAuth.reauthUser();
		    } else if ( e.data == "returnUser" ) {
	    		RDRAuth.returnUser();
		    } else if ( e.data == "killUser" ) {
                RDRAuth.killUser();
            // } else if ( e.data == "close educateUser" ) {
            //  $.cookie('educatedUser', true);
            } else if ( e.data == "openGenericLoginWindow" ) {
                RDRAuth.openGenericLoginWindow();
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

//Do we expect this do work, because it won't - it just redeclares it below.
var RDRAuth = RDRAuth ? RDRAuth: {};

RDRAuth = {
    cookieProps: [
        'user_id',
        'first_name',
        'full_name',
        'img_url',
        'readr_token',
        'user_type',
        'private_profile',
        'follow_email_option',
        'notification_email_option'
    ],
	rdr_user: {},
    popups: {},
    currentPopup: null,
    closeCurrentPopup: function(){

    },

    completeFBWidgetLogin: function(response){
        if (response && response.authResponse) {
            RDRAuth.getReadrToken( response, function(){
                RDRAuth.checkFBStatus();
            });
        }
    },
    openGenericLoginWindow: function(options){
        var windowProps = getWindowProps(options);
        if(RDRAuth.popups.loginWindow){
            RDRAuth.popups.loginWindow.close();
        }
        RDRAuth.popups.loginWindow = window.open(
            RDR_baseUrl+'/generic_login/',
            'readr_login',
            windowProps
        );
        if(RDRAuth.popups.loginWindow){
            RDRAuth.popups.loginWindow.focus();
        }
        return false;
    },
    openRbLoginWindow: function(options){
        var windowProps = getWindowProps(options);
        if(RDRAuth.popups.loginWindow){
            RDRAuth.popups.loginWindow.close();
        }
        RDRAuth.popups.loginWindow = window.open(
            RDR_baseUrl+'/rb_login/',
            'readr_login',
            windowProps
        );
        if(RDRAuth.popups.loginWindow){
            RDRAuth.popups.loginWindow.focus();
        }
        return false;
    },
    openRbCreateNewAccountWindow: function(options){
        if(options && options.childWindow){
            alert(options.childWindow);
            options.childWindow.close();
            alert(options.childWindow);
        }
        var windowProps = getWindowProps(options);
        if(RDRAuth.popups.loginWindow){
            RDRAuth.popups.loginWindow.close();
        }
        RDRAuth.popups.loginWindow = window.open(
            RDR_baseUrl+'/user_create/',
            'readr_create_user',
            windowProps
        );
        if(RDRAuth.popups.loginWindow){
            RDRAuth.popups.loginWindow.focus();
        }
        return false;
    },
    openRbForgotPasswordWindow: function(options){
        var _options = $.extend({height: 370}, options);
        var windowProps = getWindowProps(_options);
        if(RDRAuth.popups.loginWindow){
            RDRAuth.popups.loginWindow.close();
        }
        RDRAuth.popups.loginWindow = window.open(
            RDR_baseUrl+'/request_password/',
            'readr_forgot_pw',
            windowProps
        );
        if(RDRAuth.popups.loginWindow){
            RDRAuth.popups.loginWindow.focus();
        }
        return false;
    },
    openRbAvatarUploadWindow: function(options){
        var windowProps = getWindowProps(options);
        if(RDRAuth.popups.loginWindow){
            RDRAuth.popups.loginWindow.close();
        }
        RDRAuth.popups.loginWindow = window.open(
            RDR_baseUrl+'/user_modify/',
            'readr_avatar_upload',
            windowProps
        );
        if(RDRAuth.popups.loginWindow){
            RDRAuth.popups.loginWindow.focus();
        }
        return false;
    },
	events: {
		track: function( data ) {
	        // RDRAuth.events.track
	        // mirrors the event tracker from the widget
	        var standardData = "";

	        if ( RDRAuth.rdr_user && RDRAuth.rdr_user.user_id ) standardData += "||uid::"+RDRAuth.rdr_user.user_id;
	        if ( (qs_args && (qs_args.group_id) ) ) standardData += "||gid::"+(qs_args.group_id);
	        
	        var eventSrc = data+standardData,
	            $event = $('<img src="'+RDR_baseUrl+'/static/widget/images/event.png?'+eventSrc+'" />'); // NOT using STATIC_URL b/c we need the request in our server logs, and not on S3's logs

	        $('#rdr_event_pixels').append($event);
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
				data: {
					first_name: RDRAuth.rdr_user.first_name,
					full_name: RDRAuth.rdr_user.full_name,
					img_url: RDRAuth.rdr_user.img_url,
					user_id: RDRAuth.rdr_user.user_id,
					readr_token: RDRAuth.rdr_user.readr_token
				}
			};
			RDRAuth.notifyParent(sendData, "returning_user");
		}
	},
	getReadrToken: function(fb_response, callback ) {
		// if ( $.cookie('user_type') == "facebook" ) {
			if ( fb_response ) {
	            var fb_session = (fb_response.authResponse) ? fb_response.authResponse : fb_response
				var sendData = {
					fb: fb_session,
                    
                     // TODO aaaaaaaaaaaaaaagh remove GROUP ID and replace with NONCE
                    //todo: RDRAuth.rdr_user.group_id should be available now - verify
					group_id: (qs_args.group_id) ? qs_args.group_id:1,
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
	createTempUser: function() {
		// if not calling from the iframe, don't create a temp user right now.
		if (parent.location == window.location) return;

		if ( (!RDRAuth.rdr_user.user_id && !RDRAuth.rdr_user.readr_token) ||  // no user data
			 ( RDRAuth.rdr_user.user_id && RDRAuth.rdr_user.readr_token && !RDRAuth.rdr_user.temp_user) ) { // we have user data but believe it is wrong
			var sendData = {
				group_id: qs_args.group_id
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
						data: {
							first_name: RDRAuth.rdr_user.first_name,
							full_name: RDRAuth.rdr_user.full_name,
							img_url: RDRAuth.rdr_user.img_url,
							user_id: RDRAuth.rdr_user.user_id,
							readr_token: RDRAuth.rdr_user.readr_token
						}
					};
					RDRAuth.notifyParent(sendData, "got_temp_user");
				}
			});
		} else {
			var sendData = {
				data: {
					first_name: RDRAuth.rdr_user.first_name,
					full_name: RDRAuth.rdr_user.full_name,
					img_url: RDRAuth.rdr_user.img_url,
					user_id: RDRAuth.rdr_user.user_id,
					readr_token: RDRAuth.rdr_user.readr_token
				}
			};
			RDRAuth.notifyParent(sendData, "got_temp_user");
		}
	},
	reauthUser: function(args) {
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
	checkFBStatus: function(args) {
		FB.getLoginStatus( function(response) {
			if (response.status && response.status == "connected" ) {
				if (top == self) {
					// QUICK KLUDGE
					// TODO what we really need is a /api/getUserInfo call to get first/last name from our server, and store it in a session, not a cookie
					// now write the html for the user
                    var userId = $.cookie('user_id') || ( RDRAuth.rdr_user && RDRAuth.rdr_user.user_id );
                    if( !userId ){
                        RDRAuth.getReadrToken( response.authResponse, function() { 
                            RDRAuth.makeUserSettingsMenu();
                        });
                    }else{
                        FB.api('/me', function(response) {
                            RDRAuth.makeUserSettingsMenu();
                        });

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
	checkRBLoginWindow: function() {
    	// RDRAuth.resetLoginState();
	},
    _initUserSettingsMenu: function(){
        //this can be safely initiated multiple times
        //should be called from makeUserSettingsMenu
        $('#private_profile')
        .unbind('click.userSettingsMenu')
        .bind('click.userSettingsMenu', function() {

            //todo we shouldn't toggle like this - should send the state.
            var isOn = $(this).is(':checked');

            $('label[for="private_profile"] span').remove();
            var sendData = {
              user_id:RDRAuth.rdr_user.user_id, 
              readr_token:RDRAuth.rdr_user.readr_token,
              group_id:1
            };
            $.ajax({
                url: "/api/privacy/toggle/",
                type: "get",
                data: {
                      json: JSON.stringify(sendData)
                    },
                success: function(response) {
                    
                    RDRAuth.writeUserCookie({
                        private_profile: isOn
                    });
                    $('label[for="private_profile"]').append('<strong style="display:inline-block;float:none;margin:0;color:#4b8ac8;">Saved</strong>');
                }
            });
        });

        $('#follow_email')
        .unbind('click.userSettingsMenu')
        .bind('click.userSettingsMenu', function() {

            var isOn = $(this).is(':checked');
            
            $('label[for="follow_email"] span').remove();
            var sendData = {
                user_id:RDRAuth.rdr_user.user_id, 
                readr_token:RDRAuth.rdr_user.readr_token,
                group_id:1
            };
            $.ajax({
                url: "/api/followemail/toggle/",
                type: "get",
                data: {
                    json: JSON.stringify(sendData)
                  },
                success: function(response) {

                    RDRAuth.writeUserCookie({
                        follow_email_option: isOn
                    });
                    $('label[for="follow_email"]').append('<strong style="display:inline-block;float:none;margin:0;color:#4b8ac8;">Saved</strong>');
                }
            });
        });

        $('#activity_notifications')
            .unbind('click.userSettingsMenu')
            .bind('click.userSettingsMenu', function() {
                
                var isOn = $(this).is(':checked');
                
                $('label[for="activity_notifications"] span').remove();
                var sendData = {
                    user_id:RDRAuth.rdr_user.user_id, 
                    readr_token:RDRAuth.rdr_user.readr_token,
                    group_id:1
                };
                $.ajax({
                    url: "/api/notificationemail/toggle/",
                    type: "get",
                    data: {
                        json: JSON.stringify(sendData)
                      },
                    success: function(response) {

                        RDRAuth.writeUserCookie({
                            notification_email_option: isOn
                        });
                        $('label[for="activity_notifications"]').append('<strong style="display:inline-block;float:none;margin:0;color:#4b8ac8;">Saved</strong>');
                    }
                });
        });
    },
    makeUserSettingsMenu: function(){

        var rbUser = RDRAuth.readUserCookie();
        
        //rbUser should be empty of have all props.  Test if it's empty with the ID
        if( !rbUser.user_id ){
            $('#logged-in').hide().css('visibility','hidden');
            $('#logged-out').show().css('visibility','visible');
            return;
        }
        //else
        $('#logged-in').show().css('visibility','visible');
        $('#logged-out').hide().css('visibility','hidden');


        var $user = $('<a/>'),
            $avatar = $('<img/>'),
            $name = $('<strong/>'),
            $user_menu = $('<div id="log-out-link" />');


        $user.attr('href', '/user/' + rbUser.user_id );

        var username = rbUser.full_name ? rbUser.full_name: rbUser.first_name;
        $name.text( username );
        
        $avatar.attr('src', rbUser.img_url + '?type=square');                

        $user.append( $avatar );
        $user.append( $name );

        $('#logged-in').empty();
        $('#logged-in').append($user);
        

        $user_menu.append(
            '<a href="/user/'+rbUser.user_id+'">My Activity</a>' +
            '<a href="/follows/'+rbUser.user_id+'">Activity I Follow</a>' +
            '<a href="javascript:void(0);" onclick="RDRAuth.logout();">Log Out</a>'
        );

        var $userSettingsMenu = $('<div class="userSettingsMenu">');

            var private_profile_str = rbUser.private_profile ? 'checked="checked"': "";
            var follow_email_option_str = rbUser.follow_email_option ? 'checked="checked"': "";
            var notification_email_option_str = rbUser.notification_email_option ? 'checked="checked"': "";



        $userSettingsMenu.append(
            '<h5 id="user_settings">Settings</h5>'
        );
        $userSettingsMenu.append(
            '<label for="private_profile">'+
                '<input type="checkbox" id="private_profile" '+private_profile_str+' />'+
                'Profile is private'+
            '</label>'
        );
        $userSettingsMenu.append(
            '<label for="follow_email">'+
                '<input type="checkbox" id="follow_email" '+follow_email_option_str+' />'+
                'Send me email when someone follows my activity.'+
            '</label>'
        );
        $userSettingsMenu.append(
            '<label for="activity_notifications">'+
                '<input type="checkbox" id="activity_notifications" '+notification_email_option_str+'/>'+
                'Send me activity notifications.'+
            '</label>'
        );

        if(rbUser.user_type === "readrboard" ){
            $userSettingsMenu.append(
                '<hr/>',
                '<a href="javascript:void(0);" onclick="RDRAuth.openRbAvatarUploadWindow();">Upload Profile Picture</a>'
            );
        }
        $user_menu.append($userSettingsMenu);
        $('#logged-in').append($user_menu);

        RDRAuth._initUserSettingsMenu();
    },
	setUser: function(response) {
		RDRAuth.rdr_user = {};
		// if no first_name attribute is in the response, this is a temporary user.
		if ( response.data.first_name || response.data.full_name ) RDRAuth.rdr_user.temp_user = false;
		else RDRAuth.rdr_user.temp_user = true;
        
        RDRAuth.rdr_user = {
            user_id: response.data.user_id,
            first_name: response.data.first_name,
            full_name: response.data.full_name,
            img_url: response.data.img_url,
            readr_token: response.data.readr_token,
            user_type: response.data.user_type,
            private_profile: response.data.private_profile,
            follow_email_option: response.data.follow_email_option,
            notification_email_option: response.data.notification_email_option
        }                    

        $.each( RDRAuth.rdr_user, function(key, val){
            $.cookie(key, val, { expires: 365, path: '/' });
        });

		var session_expiry = new Date(); 
		session_expiry.setMinutes( session_expiry.getMinutes() + 60 );
		$.cookie('rdr_session', 'true', { expires:session_expiry, path:'/' });
        RDRAuth.resetLoginState();
	},
	readUserCookie: function() {
        $.each( RDRAuth.cookieProps, function(idx, str){
            var val = $.cookie(str);
                val = 
                    (val == 'false') ? false : 
                    (val == 'true') ? true : 
                    val;
            RDRAuth.rdr_user[str] = val;
        });

        //return this for convenience
        return RDRAuth.rdr_user;
	},
    writeUserCookie: function(options) {
        $.each( options, function(key, val){
            RDRAuth.rdr_user[key] = val;
            $.cookie(key, val, { expires: 365, path: '/' });
        });

        //return this for convenience
        return RDRAuth.rdr_user;
    },
	returnUser: function() {
		RDRAuth.readUserCookie();
		if (top == self) {
			// we're on the site
			if ( $.cookie('user_type') && $.cookie('user_type') == "facebook" ) {
				RDRAuth.checkFBStatus();
			} else {
                RDRAuth.makeUserSettingsMenu();
            }
		} else {
			var sendData = {
				// arguments are nested under data for consistency with passing values up to the parent
				data: RDRAuth.rdr_user
			};
			RDRAuth.notifyParent(sendData, "returning_user");
		}
	},
	killUser: function(callback, callback_args) {
		// if ( RDRAuth.rdr_user && RDRAuth.rdr_user.user_id && RDRAuth.rdr_user.readr_token && RDRAuth.rdr_user.first_name ) {
		if ( RDRAuth.rdr_user && RDRAuth.rdr_user.temp_user == "false" ) {
			// deauth a full user
			var sendData = {
				user_id: RDRAuth.rdr_user.user_id,
				readr_token: RDRAuth.rdr_user.readr_token
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
                    $.each( RDRAuth.cookieProps, function(key, val){
                        $.cookie(val, null, { path: '/' });
                    });

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
			$.each( RDRAuth.cookieProps, function(key, val){
                $.cookie(val, null, { path: '/' });
            });

			RDRAuth.rdr_user = {};
			if (callback && callback_args) {
				callback(callback_args);
			} else if (callback) {
				callback();
			}
		}
	},
	doFBLogin: function(requesting_action) {
		// RDRAuth.doFBLogin
		FB.login(function(response) {
		  if (response.authResponse) {
		    // FB.api('/me', function(response) {
		      RDRAuth.getReadrToken( FB.getAuthResponse(), function() {
		      	RDRAuth.checkFBStatus();
		      // });
		    });
		  } else {

		  }
		}, {scope: 'email'});
	},
	doRBLogin: function(requesting_action) {
        //not being used right now
    },
    doRBlogout: function() {
        RDRAuth.killUser( function() {
            RDRAuth.resetLoginState(); 
        }); 
    },	
	logout: function() {
		if ( $.cookie('user_type') && $.cookie('user_type') == "facebook" ) {
			FB.getLoginStatus(function(response) {
				if (response) {
					FB.logout(function(response) {
						RDRAuth.killUser( function() {
							RDRAuth.resetLoginState(); 
						});		
					});	
				} else {
					RDRAuth.killUser( function() {
						RDRAuth.resetLoginState();
					});	
				}
			});
		} else {
			RDRAuth.killUser( function() {
				RDRAuth.resetLoginState();
			});	
		}
	},
	init: function() {
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
	decodeDjangoCookie: function(value) {
		if (value) return value.replace(/"/g,'').replace(/\\054/g,",").replace(/\\073/g,";");
	},
    resetLoginState: function(){
        //this will just reload for now.
        //later we could be
        window.location.reload();
    }
}
$(document).ready(function(){
    RDRAuth.init();
});