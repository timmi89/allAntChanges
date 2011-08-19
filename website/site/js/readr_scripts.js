var RB = RB ? RB : {};

RB = {
	group : {},
	user_auth : {
		doFBLogin : function(requesting_action) {
			FB.login( function(response) {
				RDRAuth.checkFBStatus(requesting_action);
			}, {perms:'email'});
		}
	},
	admin : {
		requestAccess : function(fb_response, group_id) {
			if ( fb_response ) {
		        var fb_session = (fb_response.session) ? fb_response.session:fb_response
				var sendData = {
					fb: fb_session,
					group_id: group_id
				};

				$.ajax({
					url: "/api/admin_request/",
					type: "get",
					contentType: "application/json",
					dataType: "jsonp",
					data: {
						json: JSON.stringify( sendData )
					},
					success: function(response){
						console.log('requested admin access');
						console.dir(response);
						
					},
					error: function(response) {
						console.log('woops');
					}
				});
			}
		},
		blockContent : function(int_id) {
			var sendData = {
                "int_id" : int_id,
                "user_id" : RDRAuth.rdr_user.user_id,
                "readr_token" : RDRAuth.rdr_user.readr_token
            };

            // send the data!
            $.ajax({
                url: "/api/moderate/toggle/",
                type: "get",
                contentType: "application/json",
                dataType: "jsonp",
                data: { json: JSON.stringify(sendData) },
                success: function(response) {
                	console.log('successfully toggled!');
                    console.dir(response);
                },
                error: function(response) {
                	console.log('TOGGLE FAIL');
                    console.dir(response);
                }
            });
		}
	}
};