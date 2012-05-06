var RB = RB ? RB : {};

RB = {
	group: {},
	user_auth: {
		doFBLogin: function(requesting_action) {
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
	admin: {
		requestAccess: function(fb_response, group_id) {
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
		blockContent: function(int_id) {
			var sendData = {
                "int_id": int_id,
                "user_id": RDRAuth.rdr_user.user_id,
                "readr_token": RDRAuth.rdr_user.readr_token
            };

            // send the data!
            $.ajax({
                url: "/api/moderate/toggle/",
                type: "get",
                contentType: "application/json",
                dataType: "jsonp",
                data: { json: JSON.stringify(sendData) },
                success: function(response) {
                    if (response.status == "success") {
                        var $blockLink = $('#moderate_'+int_id);
                        var blockText = $.trim( $blockLink.text() );
                        if ( blockText == "Block this" ) {
                            $blockLink.text('Unblock');
                        } else {
                            $blockLink.text('Block this');
                        }
                    }
                },
                error: function(response) {

                }
            });
		}
	},
	util: {
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
            var newHash = "",
                foundKey = false;

            if ( hash.length > 0 ) {
                var pairs = hash.split('#');
                for ( var i in pairs ) {
                    if ( key == pairs[i].split('=')[0] ) {
                    	newHash += "#" + key + "=" + value;
                        foundKey = true;
                    } else if (pairs[i].length > 0 ) {
                    	newHash += "#" + pairs[i];
                    }
                }

                if ( !foundKey ) {
                    newHash += "#" + key + "=" +value;
                }

                window.location.hash = newHash;
            } else {
            	newHash = "#" + key + "=" + value;
            	window.location.hash = newHash;
            }
        },
		loadScript: function(sScriptSrc,callbackfunction) {
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
	},

    fixUrlParams: function (urlOrNull, newQParams, replaceNotMerge) {
        //given a url (or defaulting to the window url if null),
        //pulls out the query params,
        //merges in newQParams if replaceNotMerge is false or null (default null)
        //or replaces them completely if replaceNotMerge is truee

        var self = this;
        
        function _getQueryParams (optQueryString) {
            var queryString = optQueryString || window.location.search;
            //thanks: http://stackoverflow.com/a/2880929/1289255
            //I haven't verfied that this is 100% perfect for every url case, but it's solid.

            var urlParams = {};
            var e,
            a = /\+/g,  // Regex for replacing addition symbol with a space
            r = /([^&=]+)=?([^&]*)/g,
            d = function (s) { return decodeURIComponent(s.replace(a, " ")); },
            q = queryString.substring(1);

            while (e = r.exec(q))
                urlParams[d(e[1])] = d(e[2]);

            return urlParams;
        }

        //todo
        var url = urlOrNull || window.location,
            qIndex = url.indexOf('?'),
            hrefBase,
            hrefQuery,
            qParams,
            _newQParams;

        //if qIndex == -1, there was no ?
        if(qIndex == -1 ) {
            hrefBase = url;
            hrefQuery = "";
        }else{
            hrefBase = url.slice(0, qIndex);
            hrefQuery = url.slice(qIndex);
        }

        qParams = replaceNotMerge ? {} : _getQueryParams(hrefQuery);
        _newQParams = newQParams || {};

        //add or override the params we need:
        $.extend(qParams, _newQParams);

        //overwrite hrefQuery with new settings
        hrefQuery = $.param(qParams);
        
        var finalUrl = hrefQuery ?
            hrefBase + '?' + hrefQuery : 
            hrefBase;

        return finalUrl;
    },
    follow : {
        add : function(id, type) {
            // RB.follow.add
            // type: usr, grp, pag
            var data = {
                follow_id:parseInt(id),
                type:type
            };

            $.ajax({
                beforeSend: function( xhr ) {
                    xhr.setRequestHeader("X-CSRFToken", $.cookie('csrftoken') );
                },
                url: "/api/follow/",
                type: "post",
                contentType:"application/x-www-form-urlencoded",
                dataType: "json",
                data: { json: $.toJSON(data) },
                success: function(response) {
                    $('#follow_action').text( 'Stop following' ).unbind().click( function() {
                        var id = (type=="usr") ? RB.profile_user.id:RB.group.id;
                        RB.follow.remove( id, type );
                    });
                    $('#follower_count').text( (parseInt( $('#follower_count').text() )+1) + " followers" );
                }
            });
        },
        remove : function(id, type) {
            // RB.follow.remove
            // type: usr, grp, pag
            var data = {
                follow_id:parseInt(id),
                type:type
            };

            $.ajax({
                beforeSend: function( xhr ) {
                    xhr.setRequestHeader("X-CSRFToken", $.cookie('csrftoken') );
                },
                url: "/api/unfollow/",
                type: "post",
                contentType:"application/x-www-form-urlencoded",
                dataType: "json",
                data: { json: $.toJSON(data) },
                success: function(response) {
                    $('#follow_action').text( 'Follow' ).unbind().click( function() {
                        var id = (type=="usr") ? RB.profile_user.id:RB.group.id;
                        RB.follow.add( id, type );
                    });
                    $('#follower_count').text( (parseInt( $('#follower_count').text() )-1) + " followers" );
                }
            });
        },

// function follow() {
//   var data = {
//     follow_id:57,
//     type:"usr"
// };

// $.ajax({
//   beforeSend: function( xhr ) {
//     xhr.setRequestHeader("X-CSRFToken", $.cookie('csrftoken') );
//   },
//   url: "/api/follow/",
//   type: "post",
//   // contentType: "application/json",
//   contentType:"application/x-www-form-urlencoded",
//   dataType: "json",
//   data: { json: $.toJSON(data) },
//   success: function(response) {
//   }
// });
// }
        following : function(id, page_num) {
            // RB.follow.following
            // who am I following?
            var data = {
                user_id:parseInt(id),
                page_num:(page_num)?page_num:1,
                types:["usr","grp","pag"]
            };

            $.ajax({
                beforeSend: function( xhr ) {
                    xhr.setRequestHeader("X-CSRFToken", $.cookie('csrftoken') );
                },
                url: "/api/follow/",
                type: "get",
                contentType:"application/x-www-form-urlencoded",
                dataType: "json",
                data: { json: $.toJSON(data) },
                success: function(response) {
                    if ( typeof response.data.followed_by_count != "undefined" ) {
                        $('#following_count').html( "<strong>"+response.data.followed_by_count + "</strong> following" );
                    }
                }
            });
        },

        followers : function(id, type) {
            // RB.follow.followers
            // who follows this thing
            // type: usr, grp, pag
            var data = {
                entity_id:parseInt(id),
                entity_type:type,
                page_num:(typeof page_num != "undefined")?page_num:1,
            };

            $.ajax({
                beforeSend: function( xhr ) {
                    xhr.setRequestHeader("X-CSRFToken", $.cookie('csrftoken') );
                },
                url: "/api/entity/follow/",
                type: "get",
                contentType:"application/x-www-form-urlencoded",
                dataType: "json",
                data: { json: $.toJSON(data) },
                success: function(response) {
                    if ( typeof response.data.followed_by_count != "undefined" ) {
                        $('#follower_count').html( "<strong>"+response.data.followed_by_count + "</strong> followers" );
                    }
                    
                    var id = (type=="usr") ? RB.profile_user.id:RB.group.id;
                    if ( response.data.user_is_follower ) {
                        $('#follow_action').text( 'Stop following' ).unbind().click( function() {
                            RB.follow.remove( id, type );
                        });
                    } else {
                        $('#follow_action').text( 'Follow' ).unbind().click( function() {
                            RB.follow.add( id, type );
                        });
                    }
                }
            });
        }

// function who_follows_group(id) {
//   // who follows this thing
//   var data = {
//     entity_id:parseInt(id),
//     entity_type:"grp",
//     page_num:1
// };

// $.ajax({
//   beforeSend: function( xhr ) {
//     xhr.setRequestHeader("X-CSRFToken", $.cookie('csrftoken') );
//   },
//   url: "/api/entity/follow/",
//   type: "get",
//   // contentType: "application/json",
//   contentType:"application/x-www-form-urlencoded",
//   dataType: "json",
//   data: { json: $.toJSON(data) },
//   success: function(response) {
//   }
// });
// }
    }   
};