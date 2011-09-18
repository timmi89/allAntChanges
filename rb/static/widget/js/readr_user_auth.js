// querystring stuff
// used to create an array called qs_args which holds key/value paris from the querystring of the iframe
var qs = ( window.location.search + window.location.hash ).substr(1).split('&');
var qs_args = [];
for ( var i in qs ) {
	var this_arg = qs[i].split('=');
	qs_args[this_arg[0]] = this_arg[1];
}

if ( typeof $.receiveMessage == "function") {
	$.receiveMessage(
		function(e){
		    switch( e.data ) {
		    	case "getUser":
		    		RDRAuth.getUser();
		    		break;
		    	case "reauthUser":
		    		RDRAuth.reauthUser();
		    		break;
		    	case "returnUser":
		    		RDRAuth.returnUser();
		    		break;
		    	case "killUser":
		    		RDRAuth.killUser();
		    		break;
		    	case "close educateUser":
		    		$.cookie('educatedUser', true);
		    		break;
		    }
		},
		qs_args.parentHost
	);
}
var RDRAuth = RDRAuth ? RDRAuth : {};
RDRAuth = {
	rdr_user: {},
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
					// first_name : RDRAuth.rdr_user.first_name,
					// full_name : RDRAuth.rdr_user.full_name,
					img_url : RDRAuth.rdr_user.img_url,
					user_id : RDRAuth.rdr_user.user_id,
					readr_token : RDRAuth.rdr_user.readr_token
				}
			};
			RDRAuth.notifyParent(sendData, "returning_user");
		}
	},
	getReadrToken: function(fb_response, callback ) {
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
							// first_name : RDRAuth.rdr_user.first_name,
							// full_name : RDRAuth.rdr_user.full_name,
							img_url : RDRAuth.rdr_user.img_url,
							user_id : RDRAuth.rdr_user.user_id,
							readr_token : RDRAuth.rdr_user.readr_token
						}
					};
					RDRAuth.notifyParent(sendData, "got_temp_user");
				}
			});
		} else {
			var sendData = {
				data : {
					// first_name : RDRAuth.rdr_user.first_name,
					// full_name : RDRAuth.rdr_user.full_name,
					img_url : RDRAuth.rdr_user.img_url,
					user_id : RDRAuth.rdr_user.user_id,
					readr_token : RDRAuth.rdr_user.readr_token
				}
			};
			RDRAuth.notifyParent(sendData, "got_temp_user");
		}
	},
	reauthUser : function(args) {
		RDRAuth.readUserCookie();
		if ( !FB.getAuthResponse() ) {
			FB.getLoginStatus(function(response) {
		  		if (response && response.status == "connected") {
					RDRAuth.killUser( function(response) {
						RDRAuth.getReadrToken(response); // function exists in readr_user_auth.js
					}, response);
		  		} else {
		  			RDRAuth.notifyParent({}, "fb_user_needs_to_login");
		  		}
		  	});
		} else {
			RDRAuth.killUser( function(response) {
				RDRAuth.getReadrToken(response); // function exists in readr_user_auth.js
			});
			// RDRAuth.getReadrToken( FB.getAuthResponse() );
		}
	},
	checkFBStatus : function(args) {
		FB.getLoginStatus( function(response) {
			if (response.status && response.status == "connected" ) {
				if (top == self) {
					// QUICK KLUDGE
					// TODO what we really need is a /api/getUserInfo call to get first/last name from our server, and store it in a session, not a cookie
					// now write the html for the user
					if ( $.cookie('user_id') || ( RDRAuth.rdr_user && RDRAuth.rdr_user.user_id ) ) {
						var user_id = ($.cookie('user_id')) ? $.cookie('user_id'):RDRAuth.rdr_user.user_id;
						var img_url = ($.cookie('img_url')) ? $.cookie('img_url'):RDRAuth.rdr_user.img_url;

						$('#fb-logged-in').show().css('visibility','visible');
						$('#fb-logged-out').hide().css('visibility','hidden');
						FB.api('/me', function(response) {
		      				var $user = $('<a/>'),
							$avatar = $('<img/>'),
							$name = $('<strong/>');

							$user.attr('href', '/user/'+user_id );
							$avatar.attr('src', img_url + '?type=square');
							$name.text( response.name );

							$user.append( $avatar, $name );

							$('#fb-logged-in').html( $user );
		      			});
					} else {
						RDRAuth.getReadrToken( response.authResponse, function() { 
						});
					}
				} else {
					// widget
					$('#fb-logged-in').show().css('visibility','visible');
					$('#fb-logged-out').hide().css('visibility','hidden');
					RDRAuth.returnUser();
				}
			} else {
				if (top == self) {
					$('#fb-logged-in').hide().css('visibility','hidden');
					$('#fb-logged-out').show().css('visibility','visible');
					// RDRAuth.getReadrToken( response, true );
				}	
			}
		});
	},
	setUser : function(response) {
		RDRAuth.rdr_user = {};
		// if no first_name attribute is in the response, this is a temporary user.
		if ( response.data.first_name ) RDRAuth.rdr_user.temp_user = false;
		else RDRAuth.rdr_user.temp_user = true;
		// RDRAuth.rdr_user.full_name = response.data.full_name;
		RDRAuth.rdr_user.img_url = response.data.img_url;
		RDRAuth.rdr_user.user_id = response.data.user_id;
		RDRAuth.rdr_user.readr_token = response.data.readr_token;
		// $.cookie('first_name', RDRAuth.rdr_user.first_name, { expires: 365, path: '/' });
		// $.cookie('full_name', RDRAuth.rdr_user.full_name, { expires: 365, path: '/' });
		$.cookie('temp_user', RDRAuth.rdr_user.temp_user, { expires: 365, path: '/' });
		$.cookie('img_url', RDRAuth.rdr_user.img_url, { expires: 365, path: '/' });
		$.cookie('user_id', RDRAuth.rdr_user.user_id, { expires: 365, path: '/' });
		$.cookie('readr_token', RDRAuth.rdr_user.readr_token, { expires: 365, path: '/' });

		var session_expiry = new Date(); 
		session_expiry.setMinutes( session_expiry.getMinutes() + 15 );
		$.cookie('rdr_session', 'true', { expires:session_expiry, path:'/' });
	},
	readUserCookie : function() {
		// RDRAuth.rdr_user.first_name = $.cookie('first_name');
		// RDRAuth.rdr_user.full_name = $.cookie('full_name');
		if ( $.cookie('img_url') ) RDRAuth.rdr_user.img_url = $.cookie('img_url');
		if ( $.cookie('user_id') ) RDRAuth.rdr_user.user_id = $.cookie('user_id');
		if ( $.cookie('readr_token') ) RDRAuth.rdr_user.readr_token = $.cookie('readr_token');
		if ( $.cookie('temp_user') ) RDRAuth.rdr_user.temp_user = $.cookie('temp_user');
	},
	returnUser : function() {
		RDRAuth.readUserCookie();
		if (top == self) {
			// we're on the site
			RDRAuth.checkFBStatus();
		} else {
			var sendData = {
				// arguments are nested under data for consistency with passing values up to the parent
				data : {
					// first_name : RDRAuth.rdr_user.first_name,
					// full_name : RDRAuth.rdr_user.full_name,
					img_url : RDRAuth.rdr_user.img_url,
					user_id : RDRAuth.rdr_user.user_id,
					readr_token : RDRAuth.rdr_user.readr_token
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
	doFBlogout: function() {
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
	},
	init : function() {
		RDRAuth.returnUser();
	},
	decodeDjangoCookie : function(value) {
		return value.replace(/"/g,'').replace(/\\054/g,",").replace(/\\073/g,";");
	}
}
RDRAuth.init();

