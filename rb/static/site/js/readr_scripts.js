var RDR_offline = !!(
    document.domain == "local.readrboard.com" //shouldn't need this line anymore
),
RDR_baseUrl = ( RDR_offline ) ? "http://local.readrboard.com:8080":"http://www.readrboard.com",
RDR_staticUrl = ( RDR_offline ) ? "http://local.readrboard.com:8080/static/":"http://s3.amazonaws.com/readrboard/",
RDR_widgetCssStaticUrl = ( RDR_offline ) ? "http://local.readrboard.com:8080/static/":"http://s3.amazonaws.com/readrboard/";

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
                    var person_or_group = (data.type=="usr") ? "person":"group";
                    $('#follow_action').text( 'Stop following this '+person_or_group ).unbind().click( function() {
                        var id = (type=="usr") ? RB.profile_user.id:RB.group.id;
                        RB.follow.remove( id, type );
                    });
                    $('#follower_count').html( "<strong>"+(parseInt( $('#follower_count').text() )+1) + "</strong> followers" );
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
                    var person_or_group = (data.type=="usr") ? "person":"group";
                    $('#follow_action').text( 'Follow this '+person_or_group ).unbind().click( function() {
                        var id = (type=="usr") ? RB.profile_user.id:RB.group.id;
                        RB.follow.add( id, type );
                    });
                    $('#follower_count').html( "<strong>"+(parseInt( $('#follower_count').text() )-1) + "</strong> followers" );
                }
            });
        },
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
                    if ( typeof response.data.follows_count != "undefined" ) {
                        $('#following_count').html( "<strong>"+response.data.follows_count + "</strong> following" );
                    }

                    var $following_html = $('<div><h2>'+$('#avatar h2').text().trim()+' is following:</h2></div>'),
                        $ul = $('<ul/>');
                    $.each( response.data.paginated_follows, function(idx, following) {
                        if ( typeof following.social_usr != "undefined" ) {
                            $ul.append('<li><div class="follow_type">Person</div><a href="/user/'+following.social_usr.user+'/"><img style="margin-bottom:-15px;" src="'+following.social_usr.img_url+'" /> '+following.social_usr.full_name+'</a></li>');
                        } else if ( typeof following.grp != "undefined" ) {
                            $ul.append('<li><div class="follow_type">Website</div><a href="/group/'+following.grp.short_name+'/">'+following.grp.short_name+'</a></li>');
                        }
                    });
                    $('#following_list').html( $following_html.append($ul) );
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
                    
                    var id = (data.entity_type=="usr") ? RB.profile_user.id:RB.group.id,
                        person_or_group = (data.entity_type=="usr") ? "person":"group";
                    if ( response.data.user_is_follower ) {
                        $('#follow_action').text( 'Stop following this ' + person_or_group ).unbind().click( function() {
                            RB.follow.remove( id, type );
                        });
                    } else {
                        $('#follow_action').text( 'Follow this ' + person_or_group ).unbind().click( function() {
                            RB.follow.add( id, type );
                        });
                    }

                    var $follower_html = $('<div><h2>Following '+$('#avatar h2').text().trim()+':</h2></div>'),
                        $ul = $('<ul/>');
                    $.each( response.data.paginated_follows, function(idx, following) {
                        $ul.append('<li><a href="/user/'+following.social_usr.user+'/"><img style="margin-bottom:-15px;" src="'+following.social_usr.img_url+'" /> '+following.social_usr.full_name+'</a></li>');
                    });
                    $('#follower_list').html( $follower_html.append($ul) );
                }
            });
        }
    },
    interactions : {
        me_too : function(parent_id) {
            // RB.interactions.me_too
            var sendData = {"parent_id":parent_id};
            
            $.ajax({
                beforeSend: function( xhr ) {
                    xhr.setRequestHeader("X-CSRFToken", $.cookie('csrftoken') );
                },
                url: "/api/metoo/",
                type: "post",
                data: {
                    json: $.toJSON( sendData )
                },
                success: function(response) {
                    if (response.status == "success" ) {
                        var $card = $('#card_'+parent_id),
                            $outcome = $card.find('div.me_too_outcome');

                        if (response.data.existing == true ) {
                            var $successMessage = $('<div><em>You have already added this to your profile.</em></div>');
                        } else {
                            var $successMessage = $('<div><em>Success! You have added this to <a href="/user/'+$.cookie('user_id')+'">your profile</a>.</em></div>');
                        }

                        var $shareLinks = $('<div style="overflow:auto;"><strong style="display:block;float:left;margin:5px 5px 0 0;">Share It:</strong> <ul class="shareLinks"></ul>'),
                            socialNetworks = ["facebook","twitter", "tumblr"],
                            kind = ( $card.hasClass('txt') ) ? "txt":($card.hasClass('img')) ? "img":"med",
                            content = "";

                        if ( kind=="txt") {
                            content = $card.find('div.content_body').text();
                        } else if ( kind=="img") {
                            content = $card.find('div.content_body img').attr('src');
                        } else if ( kind=="med") {
                            content = $card.find('div.content_body iframe').attr('src');
                        }

                        var groupName = ($card.find('div.publisher img').length ) ? $card.find('div.publisher img').attr('alt'):$card.find('div.publisher a').text()

                        $.each(socialNetworks, function(idx, val){
                            $shareLinks.find('ul').append('<li><a href="http://' +val+ '.com" ><img class="no-rdr" src="'+RDR_staticUrl+'widget/images/social-icons-loose/social-icon-' +val+ '.png" /></a></li>');
                            $shareLinks.find('li:last').click( function() {
                                RB.shareWindow = window.open(RDR_staticUrl+'share.html', 'readr_share','menubar=1,resizable=1,width=626,height=436');
                                RB.interactions.share(val, kind, parent_id, $card.find('header').attr('title'), groupName, content)
                                // RDR.actions.share_getLink({ hash:args.hash, kind:args.kind, sns:val, rindow:$rindow, tag:tag, content_node:content_node }); // ugh, lots of weird data nesting
                                return false;
                            });
                        });

                        var $close = $('<div class="close"><a href="javascript:void(0);">Close</a>');
                        $close.find('a').click( function() {
                            $('#card_'+parent_id).find('div.me_too_outcome').hide(333);
                        });

                        $successMessage.append( $shareLinks, $close );
                        $outcome.html( $successMessage );
                        $outcome.show(333);
                    }
                }
            });
        },
        add_new_reaction : function(parent_id, tag_body) {
            // RB.interactions.add_new_reaction
            var sendData = {"parent_id":parent_id, "tag":{"body":tag_body}};
            
            $.ajax({
                beforeSend: function( xhr ) {
                    xhr.setRequestHeader("X-CSRFToken", $.cookie('csrftoken') );
                },
                url: "/api/stream/response/",
                type: "post",
                data: {
                    json: $.toJSON( sendData )
                },
                success: function(response) {
                    if (response.status == "success" ) {
                        var $card = $('#card_'+parent_id),
                            $outcome = $('#add_new_reaction_form');

                        if (response.data.existing == true ) {
                            var $successMessage = $('<div><em>You have already added this to your profile.</em></div>');
                        } else {
                            var $successMessage = $('<div><em>Success! You have added this to <a href="/user/'+$.cookie('user_id')+'">your profile</a>.</em></div>');
                        }

                        var $shareLinks = $('<div style="overflow:auto;"><strong style="display:block;float:left;margin:5px 5px 0 0;">Share It:</strong> <ul class="shareLinks"></ul>'),
                            socialNetworks = ["facebook","twitter", "tumblr"],
                            kind = ( $card.hasClass('txt') ) ? "txt":($card.hasClass('img')) ? "img":"med",
                            content = "";

                        if ( kind=="txt") {
                            content = $card.find('div.content_body').text();
                        } else if ( kind=="img") {
                            content = $card.find('div.content_body img').attr('src');
                        } else if ( kind=="med") {
                            content = $card.find('div.content_body iframe').attr('src');
                        }

                        var groupName = ($card.find('div.publisher img').length ) ? $card.find('div.publisher img').attr('alt'):$card.find('div.publisher a').text()

                        $.each(socialNetworks, function(idx, val){
                            $shareLinks.find('ul').append('<li><a href="http://' +val+ '.com" ><img class="no-rdr" src="'+RDR_staticUrl+'widget/images/social-icons-loose/social-icon-' +val+ '.png" /></a></li>');
                            $shareLinks.find('li:last').click( function() {
                                RB.shareWindow = window.open(RDR_staticUrl+'share.html', 'readr_share','menubar=1,resizable=1,width=626,height=436');
                                RB.interactions.share(val, kind, parent_id, $card.find('header').attr('title'), groupName, content)
                                // RDR.actions.share_getLink({ hash:args.hash, kind:args.kind, sns:val, rindow:$rindow, tag:tag, content_node:content_node }); // ugh, lots of weird data nesting
                                return false;
                            });
                        });

                        $successMessage.append( $shareLinks );
                        $outcome.html( $successMessage );
                        $outcome.show(333);
                    }
                }
            });
        },
        add_new_comment : function(parent_id, comment_body) {
            // RB.interactions.add_new_comment
            var sendData = { "parent_id":parent_id, "comment":comment_body };
            
            $.ajax({
                beforeSend: function( xhr ) {
                    xhr.setRequestHeader("X-CSRFToken", $.cookie('csrftoken') );
                },
                url: "/api/stream/comment/",
                type: "post",
                data: {
                    json: $.toJSON( sendData )
                },
                success: function(response) {
                    if (response.status == "success" ) {
                        var $card = $('#card_'+parent_id),
                            $outcome = $('#add_new_comment_form');

                        if (response.data.existing == true ) {
                            var $successMessage = $('<div><em>You have already added this to your profile.</em></div>');
                        } else {
                            var $successMessage = $('<div><em>Success! You have added this comment.<br/><br/>Reload the page or check it out on <a href="/user/'+$.cookie('user_id')+'">your profile</a>.</em></div>');
                        }
                        $outcome.html( $successMessage );
                        $outcome.show(333);
                    }
                }
            });
        },
        share : function(sns, kind, interaction_id, interaction_body, groupName, content) {
            // RB.interactions.share

            var content = content,
                share_url = "",
                contentStr = "",
                content_length = 300,
                short_url = RDR_baseUrl + '/i/' + interaction_id;

            switch (sns) {

                case "facebook":
                    var imageQueryP = "";
                    var videoQueryP = ""; //cant get one of these to work yet without overwriting the rest of the stuff
                    var mainShareText = "";
                    var footerShareText = "A ReadrBoard Reaction on " + groupName;

                    switch ( kind ) {
                        case "txt":
                        case "text":
                            content_length = 300;
                            contentStr = _shortenContentIfNeeded(content, content_length, true);
                            mainShareText = _wrapTag(interaction_body) +" "+ contentStr;
                        break;

                        case "img":
                        case "image":
                            contentStr = "See picture";

                            //for testing offline
                            if(RDR_offline){
                                content = content.replace("local.readrboard.com:8080", "www.readrboard.com");
                                content = content.replace("localhost:8080", "www.readrboard.com");
                            }
                            
                            imageQueryP = '&p[images][0]='+encodeURI(content);
                            mainShareText = _wrapTag(interaction_body, false, true) +" "+ contentStr;
                        break;

                        case "media":
                        case "med":
                        case "video":
                            contentStr = "See video";
                            mainShareText = _wrapTag(interaction_body, false, true) +" "+ contentStr;
                        break;
                    }

                    share_url = 'http://www.facebook.com/sharer.php?s=100' +
                                    '&p[title]='+encodeURI( mainShareText )+
                                    '&p[url]='+short_url+
                                    '&p[summary]='+encodeURI(footerShareText)+
                                    //these will just be "" if not relevant
                                    imageQueryP+
                                    videoQueryP;

                //&p[images][0]=<?php echo $image;?>', 'sharer',
                //window.open('http://www.facebook.com/sharer.php?s=100&amp;p[title]=<?php echo $title;?>&amp;p[summary]=<?php echo $summary;?>&amp;p[url]=<?php echo $url; ?>&amp;&p[images][0]=<?php echo $image;?>', 'sharer', 'toolbar=0,status=0,width=626,height=436');
                break;

                case "twitter":
                    
                    var mainShareText = "";
                    var footerShareText = "A ReadrBoard Reaction on " + groupName;
                    // var twitter_acct = ( RDR.group.twitter ) ? '&via='+RDR.group.twitter : '';
                
                    switch ( kind ) {
                        case "txt":
                        case "text":
                            content_length = ( 100 - interaction_body.length );
                            contentStr = _shortenContentIfNeeded(content, content_length, true);
                            mainShareText = _wrapTag(interaction_body) +" "+ contentStr;
                        break;

                        case "img":
                        case "image":
                            contentStr = "See image";
                            mainShareText = _wrapTag(interaction_body, false, true) +" "+ contentStr;
                        break;

                        case "media":
                        case "med":
                        case "video":
                            contentStr = "See video";
                            mainShareText = _wrapTag(interaction_body, false, true) +" "+ contentStr;
                        break;
                    }

                    share_url = 'http://twitter.com/intent/tweet?'+
                            'url='+short_url+
                            // twitter_acct+
                            '&text='+encodeURI(mainShareText);
                break;

                case "tumblr":
                    
                    var mainShareText = "";

                    switch ( kind ) {
                        case "txt":
                        case "text":
                            //tumblr adds quotes for us - don't pass true to quote it.
                            var footerShareText = _wrapTag(interaction_body, true, true) +
                                "See quote on " +
                                '<a href="'+short_url+'">'+groupName+'</a>';

                            contentStr = _shortenContentIfNeeded(content, content_length);
                            share_url = 'http://www.tumblr.com/share/quote?'+
                            'quote='+encodeURIComponent(contentStr)+
                            '&source='+encodeURIComponent(footerShareText);

                        break;

                        case "img":
                        case "image":
                                                        //for testing offline
                            if(RDR_offline){
                                content = content.replace("local.readrboard.com:8080", "www.readrboard.com");
                                content = content.replace("localhost:8080", "www.readrboard.com");
                            }

                            mainShareText = _wrapTag(interaction_body, true, true);

                            var footerShareText = 'See picture on <a href="'+short_url+'">'+ groupName +'</a>';

                            share_url = 'http://www.tumblr.com/share/photo?'+
                                'source='+encodeURIComponent(content)+
                                '&caption='+encodeURIComponent(mainShareText + footerShareText )+
                                '&click_thru='+encodeURIComponent(short_url);
                        break;

                        case "media":
                        case "med":
                        case "video":
                            //todo: - I haven't gone back to try this yet...

                            //note that the &u= doesnt work here - gives a tumblr page saying "update bookmarklet"
                            var iframeString = '<iframe src=" '+content+' "></iframe>';

                            mainShareText = _wrapTag(interaction_body, true, true);

                            var footerShareText = 'See video on <a href="'+short_url+'">'+ groupName +'</a>';

                            //todo: get the urlencode right and put the link back in
                            var readrLink = mainShareText + footerShareText;
                            share_url = 'http://www.tumblr.com/share/video?&embed='+encodeURIComponent( iframeString )+'&caption='+encodeURIComponent( readrLink );
                        break;
                    }
                break;
            }

            if ( share_url !== "" ) {
                if ( RB.shareWindow ) {
                    RB.shareWindow.location = share_url;
                }
            }

            function _getGroupName(){
                //consider using RDR.group.name
                //todo: make this smarter - check for www. only in start of domain
                return (document.domain).replace('www.', " ")
            }
            
            function _wrapTag(tag, doHTMLEscape, isActionNotContent){
                
                var connectorSign = isActionNotContent ?
                        //use pipe
                        doHTMLEscape ? 
                            "&#124;" :
                            "|"
                    :
                        //use >>
                        doHTMLEscape ? 
                            "&gt;&gt;" :
                            ">>"
                    ;


                return doHTMLEscape ?
                    "&#91;&nbsp;"  + tag + "&nbsp;&#93;&nbsp;&nbsp;"+connectorSign+"&nbsp;" : //[ tag ]  >>
                    "[ "  + tag + " ]  "+connectorSign+" " ;
            }

            function _shortenContentIfNeeded(content, content_length, addQuotes){
                var ext = '...';
                var safeLength = content_length - ext.length;
                var str = ( content.length <= content_length ) ?
                    content :
                    content.substr(0, safeLength) + ext;
                str = addQuotes ? ( '"' + str + '"' ) : str;
                return str;
            }
        }
    }
};