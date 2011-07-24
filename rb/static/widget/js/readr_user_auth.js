// querystring stuff
// used to create an array called qs_args which holds key/value paris from the querystring of the iframe
var qs = ( window.location.search + window.location.hash ).substr(1).split('&');
var qs_args = [];
for ( var i in qs ) {
	var this_arg = qs[i].split('=');
	qs_args[this_arg[0]] = this_arg[1];
}
//[cleanlogz]console.log('receiving iframe args');
//[cleanlogz]console.log('window.location.search: ' + window.location.search );
//[cleanlogz]console.log('window.location.hash: ' + window.location.hash );
//[cleanlogz]console.dir(qs);
//[cleanlogz]console.dir(qs_args);
$.receiveMessage(
	function(e){
		console.log('xdm: received: '+e.data);
	    switch( e.data ) {
	    	case "reauthUser":
	    		RDRAuth.reauthUser({write_mode:true});
	    		break;
	    	case "returnUser":
	    		RDRAuth.returnUser(true);
	    		break;
	    	case "killUser":
	    		RDRAuth.killUser();
	    		break;
	    	case "checkSocialUser":
	    		RDRAuth.checkSocialUser();
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
		console.log('xdm: notifyParent: ' + status );
		// send this info up to the widget!
		RDRAuth.postMessage({
			message: JSON.stringify( response )
		});
	},
	getReadrToken: function(fb_response) {
		console.log('xdm: getReadrToken');
		console.log(fb_response);
		if ( fb_response ) {
            var fb_session = (fb_response.session) ? fb_response.session:fb_response
			var sendData = {
				fb: fb_session,
				group_id: qs_args.group_id,
				user_id: RDRAuth.rdr_user.user_id, // might be temp, might be the ID of a valid FB-created user
				readr_token: RDRAuth.rdr_user.readr_token
			};
			//console.log(' ----- sendData -----');
			//console.dir(sendData);
			// TODO check cookie for a valid token, id
			//console.log('getuser');
			// if ( !RDRAuth.rdr_user.first_name ) {
				//console.log('send fb user data to log in');
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
					console.log('getReadrToken fail -- create a temp.');
					// RDRAuth.createTempUser();
					RDRAuth.reauthUser({forceFB:true});
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
		console.dir(RDRAuth);
		if ( RDRAuth.rdr_user.user_id && RDRAuth.rdr_user.readr_token && RDRAuth.rdr_user.first_name) console.log('---------yep');
		console.log('createTempUser 1');
		if ( (!RDRAuth.rdr_user.user_id && !RDRAuth.rdr_user.readr_token) ||  // no user data
			 ( RDRAuth.rdr_user.user_id && RDRAuth.rdr_user.readr_token && RDRAuth.rdr_user.first_name) ) { // we have user data but it must be wrong
			console.log('createTempUser 2');
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
					//console.log('got a temp user');
					// store the data here and in a cookie
					RDRAuth.setUser(response);
console.log('tempuser success response:')
console.dir(response);
					//console.log('send the temp user up');
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
			console.log('createTempUser 3');
			var sendData = {
				data : {
					first_name : RDRAuth.rdr_user.first_name,
					full_name : RDRAuth.rdr_user.full_name,
					img_url : RDRAuth.rdr_user.img_url,
					user_id : RDRAuth.rdr_user.user_id,
					readr_token : RDRAuth.rdr_user.readr_token
				}
			};
			console.dir(sendData);
			RDRAuth.notifyParent(sendData, "got_temp_user");
		}
	},
	reauthUser : function(args) {
		RDRAuth.readUserCookie();
		console.log('xdm: reAuth');
		console.dir(RDRAuth);
		if ( args.write_mode ) {
			console.log('reAuth write mode A1');
				// FB.getLoginStatus(function(response) {
					console.log("FB.getSession(): ");
					console.dir(FB.getSession());

				if ( !FB.getSession() || args.forceFB ) {
					console.log('reAuth write mode A2');
					
					FB.getLoginStatus(function(response) {
						console.log('reAuth write mode A3');
						console.dir(response);
				  		if (response && response.session) {
				  			console.log('reAuth write mode A4');
				  			// we have FB info for them -- so they are logged in and approved to user ReadrBoard
				  			console.log('xdm: fb.getLoginStatus');
							console.dir(response);
							// RDRAuth.rdr_user.first_name = null;
							//user is logged in to Facebook




							// TODO:  suspect we only need to killUser if there is a FB session change.
							RDRAuth.killUser( function(response) {
								RDRAuth.getReadrToken(response); // function exists in readr_user_auth.js
							});
				  		} else {
				  			console.log('reAuth write mode A5');
				  			RDRAuth.createTempUser();
				  		}
				  	});
				} else {
					console.log('reAuth: get new token');
					RDRAuth.getReadrToken( FB.getSession() );
					// RDRAuth.returnUser(true);
				}
		} else {
			RDRAuth.returnUser(false);
		}

	},
	setUser : function(response) {
		console.log('xdm: setUser');
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
console.log('sendData');
		console.dir(RDRAuth.rdr_user);
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
		if (!send_token) sendData.data.readr_token = null;
		RDRAuth.notifyParent(sendData, "returning_user");
	},
	killUser : function(callback) {
		//console.log('killing the user...softly');

		// if ( RDRAuth.rdr_user && RDRAuth.rdr_user.user_id && RDRAuth.rdr_user.readr_token && RDRAuth.rdr_user.first_name ) {
		if ( RDRAuth.rdr_user && RDRAuth.rdr_user.first_name ) {
			console.log('xdm: killUser 1');
			console.log( $.cookie('first_name') );
			console.dir(RDRAuth.rdr_user);
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
					console.log('xdm: killUser SUCCESS');
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
			console.log('xdm: killUser 2');
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
	}
}
RDRAuth.readUserCookie();
RDRAuth.returnUser(true);

FB.Event.subscribe('auth.sessionChange', function(response) {
  // do something with response.session
  console.log('fb session change');
  // RDRAuth.killUser();
});
FB.Event.subscribe('auth.statusChange', function(response) {
  // do something with response.session
  console.log('fb status change');
  // RDRAuth.killUser();
});
FB.Event.subscribe('auth.login', function(response) {
  // do something with response.session
  console.log('fb login');
  // RDRAuth.killUser();
});
FB.Event.subscribe('auth.logout', function(response) {
  // do something with response.session
  console.log('fb logout');
  // RDRAuth.killUser();
});
