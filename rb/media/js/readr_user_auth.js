// querystring stuff
// TODO get the parentURL and use it in the postMessage call
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
		if ( fb_response && fb_response.status == "connected" ) {

			var sendData = {
				fb: fb_response,
				group_id: qs_args.group_id
			};
console.log('getReadrToken 1');
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
			console.log('getReadrToken 2');
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