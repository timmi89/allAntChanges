// querystring stuff
// used to create an array called qs_args which holds key/value paris from the querystring of the iframe
var qs = ( window.location.search + window.location.hash ).substr(1).split('&');
var qs_args = [];
for ( var i in qs ) {
	var this_arg = qs[i].split('=');
	qs_args[this_arg[0]] = this_arg[1];
}

$.receiveMessage(
	function(e){
	    switch( e.data ) {
	    	case "reauthUser":
	    		RDRAuth.reauthUser({write_mode:true});
	    		break;
	    	case "reauthUserFB":
	    		RDRAuth.reauthUser({force_fb:true});
	    		break;
	    	case "fbdo":
	    		RDRAuth.fbdo();
	    		break;
	    	case "returnUser":
	    		RDRAuth.returnUser(true);
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
var RDRAuth = RDRAuth ? RDRAuth : {};
RDRAuth = {
	rdr_user: {},
	FBLoginResponse: function() {}, // define in the including HTML page
	postMessage: function(params) {
		$.postMessage(
			params.message,
			qs_args.parentUrl,
			parent
		);
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
				group_id: qs_args.group_id,
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
						RDRAuth.returnUser(true);
					}
					// RDRAuth.notifyParent(response, "fb_logged_in");
				},
				error: function(response) {
					RDRAuth.createTempUser();
					// RDRAuth.reauthUser({force_fb:true});
				}
			});
			// } else {
			// 	RDRAuth.notifyParent({message:false}, "already had user");
			// }
		} else {
			RDRAuth.doFBLogin();
		}
	},
	// simply tell the widget what we currently know about the user
	// optionally create a temp user
	createTempUser : function() {
		if ( (!RDRAuth.rdr_user.user_id && !RDRAuth.rdr_user.readr_token) ||  // no user data
			 ( RDRAuth.rdr_user.user_id && RDRAuth.rdr_user.readr_token && RDRAuth.rdr_user.first_name) ) { // we have user data but it must be wrong
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
							first_name : RDRAuth.rdr_user.first_name,
							full_name : RDRAuth.rdr_user.full_name,
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
					first_name : RDRAuth.rdr_user.first_name,
					full_name : RDRAuth.rdr_user.full_name,
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
		if ( args.write_mode ) {

				if ( !FB.getSession() || args.force_fb ) {
					
					FB.getLoginStatus(function(response) {
				  		if (response && response.session) {
				  			// we have FB info for them -- so they are logged in and approved to user ReadrBoard
				  			
							// RDRAuth.rdr_user.first_name = null;
							//user is logged in to Facebook




							// TODO:  suspect we only need to killUser if there is a FB session change.
							RDRAuth.killUser( function(response) {
								RDRAuth.getReadrToken(response); // function exists in readr_user_auth.js
							});
				  		} else {
				  			RDRAuth.createTempUser();
				  		}
				  	});
				} else {
					RDRAuth.getReadrToken( FB.getSession() );
					// RDRAuth.returnUser(true);
				}
		} else {
			RDRAuth.returnUser(false);
		}

	},
	setUser : function(response) {
		RDRAuth.rdr_user = {};
		RDRAuth.rdr_user.first_name = response.data.first_name;
		RDRAuth.rdr_user.full_name = response.data.full_name;
		RDRAuth.rdr_user.img_url = response.data.img_url;
		RDRAuth.rdr_user.user_id = response.data.user_id;
		RDRAuth.rdr_user.readr_token = response.data.readr_token;
		$.cookie('first_name', RDRAuth.rdr_user.first_name, { expires: 365, path: '/' });
		$.cookie('full_name', RDRAuth.rdr_user.full_name, { expires: 365, path: '/' });
		$.cookie('img_url', RDRAuth.rdr_user.img_url, { expires: 365, path: '/' });
		$.cookie('user_id', RDRAuth.rdr_user.user_id, { expires: 365, path: '/' });
		$.cookie('readr_token', RDRAuth.rdr_user.readr_token, { expires: 365, path: '/' });
	},
	readUserCookie : function() {
		RDRAuth.rdr_user.first_name = $.cookie('first_name');
		RDRAuth.rdr_user.full_name = $.cookie('full_name');
		RDRAuth.rdr_user.img_url = $.cookie('img_url');
		RDRAuth.rdr_user.user_id = $.cookie('user_id');
		RDRAuth.rdr_user.readr_token = $.cookie('readr_token');
	},
	returnUser : function(send_token) {
		var sendData = {
			// arguments are nested under data for consistency with passing values up to the parent
			data : {
				first_name : RDRAuth.rdr_user.first_name,
				full_name : RDRAuth.rdr_user.full_name,
				img_url : RDRAuth.rdr_user.img_url,
				user_id : RDRAuth.rdr_user.user_id,
				readr_token : RDRAuth.rdr_user.readr_token
			}
		};
		// if (!send_token) sendData.data.readr_token = null;
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
					$.cookie('first_name', null, { path: '/' });
					$.cookie('full_name', null, { path: '/' });
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
	doFBLogin: function() {
		FB.login( function(response) {
			RDRAuth.FBLoginResponse(response);
		}, {perms:'email'});
	},		
	doFBlogout: function() {
		window.location.reload();
	},
	init : function() {
		RDRAuth.readUserCookie();
		RDRAuth.returnUser(true);
		FB.getLoginStatus(function(response) {
			RDRAuth.getReadrToken(response);	
		});
	}
}
RDRAuth.init();

FB.Event.subscribe('auth.sessionChange', function(response) {
  // do something with response.session
  console.log('xdm: fb session change');
  RDRAuth.reauthUser({force_fb:true});
});
FB.Event.subscribe('auth.statusChange', function(response) {
  // do something with response.session
  console.log('xdm: fb status change');
  RDRAuth.reauthUser({force_fb:true});
});
FB.Event.subscribe('auth.login', function(response) {
  // do something with response.session
  console.log('xdm: fb login');
  RDRAuth.reauthUser({force_fb:true});
});
FB.Event.subscribe('auth.logout', function(response) {
  // do something with response.session
  console.log('xdm: fb logout');
  RDRAuth.reauthUser({force_fb:true});
});
