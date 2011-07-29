var RB = RB ? RB : {};

RB = {
	group : {},
	user_auth : {
		checkFBStatus : function(requesting_action) {
			FB.getLoginStatus(function(response) {
				if ( response.session && response.status && response.status == "connected" ) {
					switch (requesting_action) {
						case "admin_request":
							//user is logged in
							$('#fb-logged-in').show();
							$('#fb-logged-in button').click( function() {
								if ( RB) RB.admin.requestAccess( response, RB.group.id );
							});
							$('#fb-logged-out').hide();
							break;
					}
				} else {
					switch (requesting_action) {
						case "admin_request":
							$('#fb-logged-in').hide();
							$('#fb-logged-out').show();
							break;
					}
				}
			});
		},
		doFBLogin : function(requesting_action) {
			FB.login( function(response) {
				RB.user_auth.checkFBStatus(requesting_action);
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