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
	    	case "getUser":
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
			if ( !RDRAuth.rdr_user.first_name ) {
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
						RDRAuth.setUser(response);
						RDRAuth.notifyParent(response, "fb_logged_in");
					}
				});
			} else {
				RDRAuth.notifyParent({message:false}, "already had user");
			}
		} else {
			RDRAuth.doFBLogin();
		}
	},
	// simply tell the widget what we currently know about the user
	// optionally create a temp user
	returnUser: function(create_temp) {
		console.log('xdm: returnUser');
		RDRAuth.getUser();
		if ( RDRAuth.rdr_user && RDRAuth.rdr_user.user_id && RDRAuth.rdr_user.readr_token ) {
			console.log('xdm: just send back known values');
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
			RDRAuth.notifyParent(sendData, "known_user");
		} else if ( create_temp ) {
			//console.log('need a temp user');
			// get a temp user
			RDRAuth.createTempUser();
		}
	},
	createTempUser : function() {
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
				RDRAuth.notifyParent(response, "got_temp_user");
			}
		});
	},
	getUser : function() {
		console.log('xdm: getUser');
		// snag values from the cookie, if present
		// if ( !RDRAuth.rdr_user.user_id || RDRAuth.rdr_user.readr_toke ) {
			RDRAuth.rdr_user.first_name = $.cookie('first_name');
			RDRAuth.rdr_user.full_name = $.cookie('full_name');
			RDRAuth.rdr_user.img_url = $.cookie('img_url');
			RDRAuth.rdr_user.user_id = $.cookie('user_id');
			RDRAuth.rdr_user.readr_token = $.cookie('readr_token');
		// }
		if ( RDRAuth.rdr_user.user_id && RDRAuth.rdr_user.readr_token ) return true;
		else return false;
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
	killUser : function(callback) {
		//console.log('killing the user...softly');
console.log('xdm: killUser');
		// if ( RDRAuth.rdr_user && RDRAuth.rdr_user.user_id && RDRAuth.rdr_user.readr_token && RDRAuth.rdr_user.first_name ) {
		if ( $.cookie('first_name') || ( RDRAuth.rdr_user && RDRAuth.rdr_user.first_name ) ) {
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
			// just a temp user
			$.cookie('img_url', null, { path: '/' });
			$.cookie('user_id', null, { path: '/' });
			$.cookie('readr_token', null, { path: '/' });
			RDRAuth.rdr_user = {};
		}
	},
	checkSocialUser : function() {
		// clear the rdr_user and get it again, b/c we're only here if we've been asked if this person is a valid FB user, meaning we think our local info is wrong
		// RDRAuth.rdr_user = {};
		console.log('xdm: checkSocialUser');
		RDRAuth.killUser( function() {
			// var fb_session = FB.getSession();
			// if ( fb_session ) {
				// RDRAuth.getReadrToken( fb_session );
			// } else {
			
			FB.getLoginStatus(function(response) {
		  		if (response.session) {
		  			// we have FB info for them -- so they are logged in and approved to user ReadrBoard
		  			console.log('xdm: fb.getLoginStatus');
					console.dir(response);
					// RDRAuth.rdr_user.first_name = null;
					//user is logged in to Facebook
					RDRAuth.getReadrToken(response); // function exists in readr_user_auth.js
		  		} else {
		  			// remove the readr_token
		  			console.log('xdm: checkSocialUser | no fb.response');
		  			
		  			console.dir(RDRAuth.rdr_user);
		  			// tell the parent that it failed for some reason
		  			RDRAuth.notifyParent({message:false}, "checkSocialUser fail");
		  		}
			});
			// }
		});
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
RDRAuth.returnUser(false);