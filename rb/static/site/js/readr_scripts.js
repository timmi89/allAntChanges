var RB = RB ? RB : {};

RB = {
	group : {},
	user_auth : {
		doFBLogin : function(requesting_action) {
			FB.login(function(response) {
              if (response.authResponse) {
                FB.api('/me', function(response) {
                  RDRAuth.FBLoginResponse(response, requesting_action);
                  // FB.logout(function(response) {
                  // });
                });
              } else {
              }
            }, {scope: 'email'});
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
						
					},
					error: function(response) {

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

                },
                error: function(response) {

                }
            });
		}
	},
	util : {
		getHashValue: function( key ) {
            var hash = window.location.hash;
            if ( hash.length > 0 ) {
                var pairs = hash.split('#');

                for ( var i in pairs ) {
                    if ( key == pairs[i].split('=')[0] ) {
                        // remove any &.... and ?... data.  why?  for a hash value, we don't expect nor want querystring key/value pairs.
                        // it's a bit blunt, but works.
                        var value = pairs[i].split('=');
                        if ( value.length > 1 ) {
                            value[1] = value[1].split('?')[0].split('&')[0];
                            return value[1];
                        } else {
                            // if there's a key but no value, return empty string so we at least knew if the key was present.
                            // lets us distinguish between a key not being present (return false) or presents sans value (return "")
                            // this is called premature optimization.  
                            return "";
                        }
                        
                    }
                }
                // key not found, so return false
                return false;
            }
        },
        setHashValue: function( key, value ) {
            var hash = window.location.hash;
            var newHash = "";

            if ( hash.length > 0 ) {
                var pairs = hash.split('#');
                for ( var i in pairs ) {
                    if ( key == pairs[i].split('=')[0] ) {
                    	newHash += "#" + key + "=" + value;
                    } else if (pairs[i].length > 0 ) {
                    	newHash += "#" + pairs[i];
                    }
                }
                window.location.hash = newHash;
            } else {
            	newHash = "#" + key + "=" + value;
            	window.location.hash = newHash;
            }
        },
		loadScript : function(sScriptSrc,callbackfunction) {
		var oHead = document.getElementsByTagName('head')[0];
		if(oHead) {
		    var oScript = document.createElement('script');

		    oScript.setAttribute('src',sScriptSrc);
		    oScript.setAttribute('type','text/javascript');

		    var loadFunction = function() {
		        if (this.readyState == 'complete' || this.readyState == 'loaded') {
		            callbackfunction();
		        }
		    };
		    oScript.onload = callbackfunction;
		    oScript.onreadystatechange = loadFunction;
		    oHead.appendChild(oScript);
			}
		}
	}
};