// querystring stuff
// used to create an array called qs_args which holds key/value paris from the querystring of the iframe
var qs = window.location.search.substr(1).split('&');
var qs_args = [];
for ( var i in qs ) {
	var this_arg = qs[i].split('=');
	qs_args[this_arg[0]] = this_arg[1];
}
$.receiveMessage(
	function(e){
		console.log('---receiving in the iframe---');
	    switch( e.data ) {
	    	case "getUser":
	    		RDRAuth.returnUser();
	    		break;
	    }
	},
	qs_args.parentHost
);
var RDRAuth = RDRAuth ? RDRAuth : {};
RDRAuth = {
	rdr_user: {},
	notifyParent: function() {}, // define in the including HTML page
	FBLoginResponse: function() {}, // define in the including HTML page
	postMessage: function(params) {
		$.postMessage(
			params.message,
			qs_args.parentUrl,
			parent
		);
	},
	notifyParent: function(response, action) {
		response.action = action;

		// send this info up to the widget!
		RDRAuth.postMessage({
			message: JSON.stringify( response )
		});
	},
	getReadrToken: function(fb_response) {
		if ( fb_response ) {
            var fb_session = (fb_response.session) ? fb_response.session:fb_response
			var sendData = {
				fb: fb_session,
				group_id: qs_args.group_id,
				user_id: RDRAuth.rdr_user.user_id, // might be temp, might be the ID of a valid FB-created user
				readr_token: RDRAuth.rdr_user.readr_token
			};
			// TODO check cookie for a valid token, id
			console.log('getuser');
			if ( !RDRAuth.getUser() ) {
				console.log('go getuser');
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
			} else console.log('already had user');
		} else {
			RDRAuth.doFBLogin();
		}
	},
	returnUser: function() {
		RDRAuth.getUser();
		console.log('start return user');
		if ( RDRAuth.rdr_user && RDRAuth.rdr_user.user_id && RDRAuth.rdr_user.readr_token ) {
			console.log('just send back known values');
			var sendData = {
				data : {
					user_id : RDRAuth.rdr_user.user_id,
					readr_token : RDRAuth.rdr_user.readr_token
				}
			};
			RDRAuth.notifyParent(sendData, "known_user");
		} else {
			console.log('need a temp user');
			// get a temp user
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
					console.log('got a temp user');
					// store the data here and in a cookie
					RDRAuth.setUser(response);

					console.log('send the temp user up');
					var sendData = {
						data : {
							user_id : RDRAuth.rdr_user.user_id,
							readr_token : RDRAuth.rdr_user.readr_token
						}
					};
					RDRAuth.notifyParent(response, "got_temp_user");
				}
			});
		}
	},
	getUser : function() {
		console.log('getuser111111111');
		// snag values from the cookie, if present
		// if ( !RDRAuth.rdr_user.user_id || RDRAuth.rdr_user.readr_toke ) {
			RDRAuth.rdr_user.user_id = $.cookie('user_id');
			RDRAuth.rdr_user.readr_token = $.cookie('readr_token');
		// }
		if ( RDRAuth.rdr_user.user_id && RDRAuth.rdr_user.readr_token ) return true;
		else return false;
	},
	setUser : function(response) {
		RDRAuth.rdr_user.user_id = response.data.user_id;
		RDRAuth.rdr_user.readr_token = response.data.readr_token;
		$.cookie('user_id', RDRAuth.rdr_user.user_id);
		$.cookie('readr_token', RDRAuth.rdr_user.readr_token);
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
RDRAuth.returnUser();