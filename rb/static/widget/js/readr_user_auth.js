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
		    console.log( "e.data: "+e.data );
		    switch( e.data ) {
		    	case "reauthUser":
		    		RDRAuth.reauthUser();
		    		break;
		    	case "returnUser":
		    		RDRAuth.returnUser();
		    		break;
		    	case "killUser":
		    		RDRAuth.killUser();
		    		break;
		    	case "educatedUser":
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
	FBLoginResponse: function() {}, // define in the including HTML page
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
	getReadrToken: function(fb_response, force_fb_status) {
		if ( fb_response ) {
            var fb_session = (fb_response.session) ? fb_response.session:fb_response
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
			// console.dir(sendData);
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
		if ( !FB.getSession() || ( args && args.force_fb ) ) {
			console.log('reauthUser 1');
			FB.getLoginStatus(function(response) {
				console.log('reauthUser 2');
		  		if (response && response.session) {
		  			// we have FB info for them -- so they are logged in and approved to user ReadrBoard
		  			console.log('reauthUser 3');
					// RDRAuth.rdr_user.first_name = null;
					//user is logged in to Facebook




					// TODO:  suspect we only need to killUser if there is a FB session change.
					RDRAuth.killUser( function(response) {
						console.log('reauthUser 4');
						RDRAuth.getReadrToken(response); // function exists in readr_user_auth.js
					});
		  		} else {
		  			console.log('reauthUser 5');
		  			// RDRAuth.createTempUser();
		  			RDRAuth.notifyParent("", "fb user needs to login");
		  		}
		  	});
		} else {
			RDRAuth.getReadrToken( FB.getSession() );
		}
	},
	checkFBStatus : function(args) {
		FB.getLoginStatus(function(response) {
			if ( response.session && response.status && response.status == "connected" ) {
				switch (args.requesting_action) {
					case "admin_request":
						// this call is from the website
						$('#fb-logged-in').show();
						$('#fb-logged-in button').click( function() {
							if ( RB ) RB.admin.requestAccess( response, args.group_id );
						});
						$('#fb-logged-out').hide();
						break;
				}
			} else {
				switch (requesting_action) {
					case "admin_request":
						// this call is from the website
						$('#fb-logged-in').hide();
						$('#fb-logged-out').show();
						break;
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
	},
	readUserCookie : function() {
		// RDRAuth.rdr_user.first_name = $.cookie('first_name');
		// RDRAuth.rdr_user.full_name = $.cookie('full_name');
		RDRAuth.rdr_user.img_url = $.cookie('img_url');
		RDRAuth.rdr_user.user_id = $.cookie('user_id');
		RDRAuth.rdr_user.readr_token = $.cookie('readr_token');
	},
	returnUser : function() {
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
	},
	killUser : function(callback) {

		// if ( RDRAuth.rdr_user && RDRAuth.rdr_user.user_id && RDRAuth.rdr_user.readr_token && RDRAuth.rdr_user.first_name ) {
		if ( RDRAuth.rdr_user && RDRAuth.rdr_user.first_name ) {
			// deauth a full user
			var sendData = {
				user_id : RDRAuth.rdr_user.user_id,
				readr_token : RDRAuth.rdr_user.readr_token,
				group_id : qs_args.group_id
			};

			$.ajax({
				url: "/api/deauthorize/",
				type: "get",
				contentType: "application/json",
				dataType: "jsonp",
				data: {
					json: JSON.stringify( sendData )
				},
				success: function(response){
					// $.cookie('first_name', null, { path: '/' });
					// $.cookie('full_name', null, { path: '/' });
					$.cookie('img_url', null, { path: '/' });
					$.cookie('user_id', null, { path: '/' });
					$.cookie('readr_token', null, { path: '/' });
					RDRAuth.rdr_user = {};
					if (callback) callback();
				}
			});
		} else {
			// just a temp user
			$.cookie('img_url', null, { path: '/' });
			$.cookie('user_id', null, { path: '/' });
			$.cookie('readr_token', null, { path: '/' });
			RDRAuth.rdr_user = {};
			if (callback) callback();
		}
	},
	doFBLogin: function(requesting_action) {
		FB.login( function(response) {
			RDRAuth.FBLoginResponse(response, requesting_action);
		}, {perms:'email'});
	},		
	doFBlogout: function() {
		window.location.reload();
	},
	init : function() {
		RDRAuth.readUserCookie();
		RDRAuth.returnUser();

		// now that SERVER is checking, we may not need this code:
		// FB.getLoginStatus(function(response) {
		// FB.getSession(function(response) {
		// 	RDRAuth.getReadrToken(response);	
		// });
	}
}
RDRAuth.init();

FB.Event.subscribe('auth.sessionChange', function(response) {
  // do something with response.session
  console.log('xdm: fb session change');
  RDRAuth.reauthUser();
});
FB.Event.subscribe('auth.statusChange', function(response) {
  // do something with response.session
  console.log('xdm: fb status change');
  RDRAuth.reauthUser();
});
FB.Event.subscribe('auth.login', function(response) {
  // do something with response.session
  console.log('xdm: fb login');
  RDRAuth.reauthUser();
});
FB.Event.subscribe('auth.logout', function(response) {
  // do something with response.session
  console.log('xdm: fb logout');
  RDRAuth.reauthUser();
});
