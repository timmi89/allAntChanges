// querystring stuff
// used to create an array called qs_args which holds key/value paris from the querystring of the iframe
var qs = window.location.search.substr(1).split('&');
var qs_args = [];
for ( var i in qs ) {
	var this_arg = qs[i].split('=');
	qs_args[this_arg[0]] = this_arg[1];
}

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
	getReadrToken: function(fb_response) {
		if ( fb_response ) {
            var fb_session = (fb_response.session) ? fb_response.session:fb_response
			var sendData = {
				fb: fb_session,
				group_id: qs_args.group_id
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
					RDRAuth.notifyParent(response);
				}
			});
		} else {
			RDRAuth.doFBLogin();
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