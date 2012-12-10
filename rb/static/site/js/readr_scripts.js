var RDR_offline = (window.location.href.indexOf('local.readrboard.com') != -1 ) ? true:false,
RDR_baseUrl = ( RDR_offline ) ? "http://local.readrboard.com:8080":"http://www.readrboard.com",
RDR_staticUrl = ( RDR_offline ) ? "http://local.readrboard.com:8080/static/":"http://s3.amazonaws.com/readrboard/",
RDR_widgetCssStaticUrl = ( RDR_offline ) ? "http://local.readrboard.com:8080/static/":"http://s3.amazonaws.com/readrboard/";

var RB = RB ? RB : {};

RB = {
    RDR_offline: RDR_offline,
    group: {},
    querystring: function(key) {
        var qs = ( window.location.search + window.location.hash ).substr(1).split('&');
        var qs_args = [];
        for ( var i in qs ) {
            var this_arg = qs[i].split('=');
            qs_args[this_arg[0]] = this_arg[1];
        }
        return qs_args[ key ];
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
        
        //from http://www.aaronpeters.nl/blog/prevent-double-callback-execution-in-IE9#comment-175618750
        loadScript: function(attributes, callbackfunction) {
            var oHead = document.getElementsByTagName('head')[0];
            if(oHead) {
                var oScript = document.createElement('script');

                oScript.setAttribute('src', attributes.src);
                oScript.setAttribute('type','text/javascript');



                if (oScript.readyState) { // IE, incl. IE9
                    oScript.onreadystatechange = function() {
                        if (oScript.readyState == "loaded" || oScript.readyState == "complete") {
                            oScript.onreadystatechange = null;
                            callbackfunction();
                        }
                    };
                } else {
                    oScript.onload = function() { // Other browsers
                        callbackfunction();
                    };
                }

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
            // type: usr, grp, pag, brd
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
                    if ( data.type == "brd") {
                        var follower_count = parseInt($('#board_follower_count').text() ) + 1;
                        $('#board_follower_count').text( follower_count + ' Followers' )
                        $('#board_follow_button').unbind().text('Stop following this board').click( function() {
                            RB.follow.remove(data.follow_id,'brd');
                        });
                    } else {
                        var person_or_group = (data.type=="usr") ? "person":"group";
                        $('#follow_action').text( 'Stop following this '+person_or_group ).unbind().click( function() {
                            var id = (type=="usr") ? RB.profile_user.id:RB.group.id;
                            RB.follow.remove( id, type );
                        });
                        $('#follower_count').html( "<strong>"+(parseInt( $('#follower_count').text() )+1) + "</strong> followers" );
                    }
                }
            });
        },
        remove : function(id, type) {
            // RB.follow.remove
            // type: usr, grp, pag, brd
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
                    if ( data.type == "brd") {
                        var follower_count = parseInt($('#board_follower_count').text() ) - 1;
                        $('#board_follower_count').text( follower_count + ' Followers' )
                        $('#board_follow_button').unbind().text('Follow this board').click( function() {
                            RB.follow.add(data.follow_id,'brd');
                        });
                    } else {
                        var person_or_group = (data.type=="usr") ? "person":"group";
                        $('#follow_action').text( 'Follow this '+person_or_group ).unbind().click( function() {
                            var id = (type=="usr") ? RB.profile_user.id:RB.group.id;
                            RB.follow.add( id, type );
                        });
                        $('#follower_count').html( "<strong>"+(parseInt( $('#follower_count').text() )-1) + "</strong> followers" );
                    }
                }
            });
        },
        following : function(id, page_num, types) {
            // RB.follow.following
            // who am I following?
            if ( typeof types == "undefined" ) {
                var types = ["usr","grp","pag","brd"];
            }
            var data = {
                user_id:parseInt(id),
                page_num:(page_num)?page_num:1,
                types:types
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
                    if ( data.types.length == 1 && $.inArray('brd', data.types) != -1 ) {
                        
                        // abstract this
                        var $boards = $('<div id="board_listing"><h2>ReadrBoards I\'m Following</h2><ul></ul></div>');
                        $.each( response.data.paginated_follows, function(idx, followed_item) {
                            var board_id = followed_item.brd.id;
                            $boards.find('ul').append('<li><a style="font-size:18px;" href="/board/'+followed_item.brd.id+'">'+followed_item.brd.title+'</a></li>');
                        });
                        var boards_width = $('#content').width() + $('#pages').width();
                        $boards.width( boards_width );
                        if ( boards_width < 570 ) {
                            $boards.find('ul').width(285);
                        } else if ( boards_width < 855 ) {
                            $boards.find('ul').width(570);
                        }
                        $('#cards').before( $boards );

                    } else {
                        if ( typeof response.data.follows_count != "undefined" ) {
                            $('#following_count').html( "<strong>"+response.data.follows_count + "</strong> following" );
                        }

                        var $following_html = $('<div><h2>'+$('#avatar h2').text().trim()+' is following:</h2></div>'),
                            $ul = $('<ul/>');
                        $.each( response.data.paginated_follows, function(idx, following) {
                            if ( typeof following.social_usr != "undefined" ) {
                                $ul.append('<li><div class="follow_type">Person</div><a href="/user/'+following.social_usr.user+'/"><img style="margin-bottom:-7px;" src="'+following.social_usr.img_url+'" /> '+following.social_usr.full_name+'</a></li>');
                            } else if ( typeof following.grp != "undefined" ) {
                                $ul.append('<li><div class="follow_type">Website</div><a href="/group/'+following.grp.short_name+'/">'+following.grp.short_name+'</a></li>');
                            }
                        });
                        $('#following_list').html( $following_html.append($ul) );
                    }
                }
            });
        },
        followers : function(id, type) {
            // RB.follow.followers
            // who follows this thing
            // type: usr, grp, pag, brd
            var data = {
                entity_id:parseInt(id),
                entity_type:type,
                page_num:(typeof page_num != "undefined")?page_num:1
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
                    if ( data.entity_type == "brd" ) {
                        $('#board_follower_count').text( response.data.followed_by_count + ' Followers' );
                        if ( response.data.user_is_follower == true ) {
                            $('#board_follow_button').unbind().text('Stop following this board').click( function() {
                                RB.follow.remove(data.entity_id,'brd');
                            });
                        }
                    } else {
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
                            $ul.append('<li><a href="/user/'+following.social_usr.user+'/"><img style="margin-bottom:-7px;" src="'+following.social_usr.img_url+'" /> '+following.social_usr.full_name+'</a></li>');
                        });
                        $('#follower_list').html( $follower_html.append($ul) );
                    }
                }
            });
        },
        agreed : function(parent_id) {
            // RB.follow.agreed
            // who agreed with this reaction?
            var data = {
                parent_id:parseInt(parent_id)
                // page_num:(page_num)?page_num:1,
                // types:["usr","grp","pag"]
            };

            $.ajax({
                beforeSend: function( xhr ) {
                    xhr.setRequestHeader("X-CSRFToken", $.cookie('csrftoken') );
                },
                url: "/api/plusones/",
                type: "get",
                contentType:"application/x-www-form-urlencoded",
                dataType: "json",
                data: { json: $.toJSON(data) },
                success: function(response) {
                    var $agreeing_users = $('<div><h2>These readers had this reaction:</h2></div>'),
                        $ul = $('<ul class="fancy_user_list"/>');
                    $.each( response.data, function(idx, user) {
                        if ( user.social_user.full_name != "undefined" ) {
                            $ul.append('<li><a href="/user/'+user.id+'/"><img style="margin-bottom:-7px;" src="'+user.social_user.img_url+'" /> '+user.social_user.full_name+'</a></li>');
                        // } else if ( typeof following.grp != "undefined" ) {
                            // $ul.append('<li><div class="follow_type">Website</div><a href="/group/'+following.grp.short_name+'/">'+following.grp.short_name+'</a></li>');
                        }
                    });
                    $agreeing_users.append( $ul );

                    $.fancybox($agreeing_users ,{
                      wrapCSS    : 'fancybox-custom',
                      helpers : {
                        overlay : {
                          css : {
                            'background-color' : '#eee'
                          }
                        }
                      }
                    });
                    // $('#agreeing_list').html( $agreeing_users.append($ul) );
                }
            });
        },
    },
    interactions : {
        displayUserBoards : function(user_id) {
            // RB.interactions.displayUserBoards

            $.ajax({
                beforeSend: function( xhr ) {
                    xhr.setRequestHeader("X-CSRFToken", $.cookie('csrftoken') );
                },
                url: "/api/user/boards/"+user_id,
                type: "get",
                success: function(response) {
                    if ( response.data.user_boards.length > 0 ) {
                        // abstract this
                        var $boards = $('<div id="board_listing"><h2>ReadrBoards</h2><ul></ul></div>');
                        $.each( response.data.user_boards, function(idx, board) {
                            var board_id = board.id;
                            $boards.find('ul').append('<li><a style="font-size:18px;" href="/board/'+board.id+'">'+board.title+'</a></li>');
                        });
                        var boards_width = $('#content').width() + $('#pages').width();
                        $boards.width( boards_width );
                        if ( boards_width < 570 ) {
                            $boards.find('ul').width(285);
                        } else if ( boards_width < 855 ) {
                            $boards.find('ul').width(570);
                        }
                        $('#cards').before( $boards );
                    }
                }
            });
        },
        searchBoards : function(search_term) {
            // RB.interactions.searchBoards

            var sendData = {"search_term":search_term, "page_num":1};

            $.ajax({
                beforeSend: function( xhr ) {
                    xhr.setRequestHeader("X-CSRFToken", $.cookie('csrftoken') );
                },
                url: "/api/boardsearch/",
                type: "get",
                data: {
                    json: $.toJSON( sendData )
                },
                success: function(response) {
                    if ( response.data.found_boards.length > 0 ) {
                        if ( search_term != "" ) {
                            var $boards = $('<div id="board_listing"><h2>ReadrBoards matching "'+search_term+'"</h2><ul></ul></div>');
                        } else {
                            var $boards = $('<div id="board_listing"><h2>Recently updated ReadrBoards</h2><ul></ul></div>');
                        }

                        var board_count = 0;
                        $.each( response.data.found_boards, function(idx, board) {
                            var board_id = board.id,
                                $li = $('<li />');
                            $li.append('<div class="user_meta">'+board.social_user.full_name+'</div>');
                            if ( board.social_user.img_url != null ) {
                                $li.find('.user_meta a').prepend('<img src="'+board.social_user.img_url+'" style="margin-bottom: -5px; height:22px; max-width: 22px;"> ');
                            }
                            $li.append('<a style="font-size:18px;" href="/board/'+board.id+'">'+board.title+'</a>');
                            
                            board_count++;
                            if ( board_count < 7 ) {
                                $boards.find('ul').append( $li );
                            }
                        });

                        var boards_width = $('#content').width() + $('#pages').width();

                        $boards.width( boards_width );
                        if ( boards_width < 570 ) {
                            $boards.find('ul').width(285);
                        } else if ( boards_width < 855 ) {
                            $boards.find('ul').width(570);
                        }
                        $('#cards').before( $boards );
                        $boards.find('ul').isotope({
                          masonry: {
                            columnWidth: 285,
                            gutterWidth: 0
                          },
                          itemSelector : 'li'
                        }, function() {});
                    }
                }
            });
        },
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

                        var groupName = $card.data('groupName');

                        $.each(socialNetworks, function(idx, val){
                            $shareLinks.find('ul').append('<li><a href="http://' +val+ '.com" ><img class="no-rdr" src="'+RDR_staticUrl+'widget/images/social-icons-loose/social-icon-' +val+ '.png" /></a></li>');
                            $shareLinks.find('li:last').click( function(e) {
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
        delete_reaction : function(interaction_id) {
            // RB.interactions.delete_reaction
            var sendData = {"interaction_id":interaction_id};
            
            $.ajax({
                beforeSend: function( xhr ) {
                    xhr.setRequestHeader("X-CSRFToken", $.cookie('csrftoken') );
                },
                url: "/api/tagremove/",
                type: "post",
                data: {
                    json: $.toJSON( sendData )
                },
                success: function(response) {

                    if (response.status == "success" ) {

                        var deleteWasSuccessful = response.data == interaction_id;
                        
                        var $card = $('#card_'+interaction_id),
                            //change this name later to make this make more sense.
                            $outcome = $card.find('div.me_too_outcome'),
                            $message;
                        
                        if( deleteWasSuccessful ){
                            $message = $('<div><em>This reaction was removed from <a href="/user/'+$.cookie('user_id')+'">your profile</a>.</em></div>');
                        }else{
                            $message = $('<div><em>This reaction is already removed.</em></div>');
                        }

                        var $close = $('<div class="close"><a href="javascript:void(0);">Close</a>');
                        $close.find('a').click( function() {
                            $('#card_'+interaction_id).find('div.me_too_outcome').hide(333);
                        });

                        $message.append($close );
                        $outcome.html( $message );
                        $outcome.show(333);
                    }
                }
            });
        },
        add_to_board : function(interaction_id, board_id, board_title) {
            // RB.interactions.add_to_board
            var sendData = {"board_id":board_id, "int_id":interaction_id};
            
            $.ajax({
                beforeSend: function( xhr ) {
                    xhr.setRequestHeader("X-CSRFToken", $.cookie('csrftoken') );
                },
                url: "/api/boardadd/",
                type: "get",
                data: {
                    json: $.toJSON( sendData )
                },
                success: function(response) {

                    if (response.status == "success" ) {
                        var $outcome = $('#add_to_board_form'),
                            $successMessage = $('<h2 style="margin-bottom:15px;border-bottom:1px solid #999;padding-bottom:7px;">Add to Board</h2><div><em>Success! You have added this to your board, <a href="/board/'+board_id+'/'+board_title+'">'+board_title+'</a>.</em></div>');
                        $outcome.html( $successMessage );
                        $outcome.show(333);
                    }
                }
            });
        },
        remove_from_board : function(interaction_id, board_id, board_title) {
            // RB.interactions.add_to_board
            var sendData = {"board_id":board_id, "int_id":interaction_id};
            
            $.ajax({
                beforeSend: function( xhr ) {
                    xhr.setRequestHeader("X-CSRFToken", $.cookie('csrftoken') );
                },
                url: "/api/boarddelete/",
                type: "get",
                data: {
                    json: $.toJSON( sendData )
                },
                success: function(response) {
                    if (response.status == "success" ) {
                        $('#card_'+interaction_id).hide(333, function() {
                            $(this).remove();
                            // cardReset();
                        });
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
                short_url = RDR_baseUrl + '/interaction/' + interaction_id;

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
                            contentStr = "[a picture on "+groupName+"] Check it out: ";

                            //for testing offline
                            if(RDR_offline){
                                content = content.replace("local.readrboard.com:8080", "www.readrboard.com");
                                content = content.replace("localhost:8080", "www.readrboard.com");
                            }
                            
                            imageQueryP = '&p[images][0]='+encodeURI(content);
                            mainShareText = _wrapTag(interaction_body) +" "+ contentStr;
                        break;

                        case "media":
                        case "med":
                        case "video":
                            contentStr = "[a video on "+groupName+"] Check it out: ";
                            mainShareText = _wrapTag(interaction_body) +" "+ contentStr;
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
                            content_length = ( 110 - interaction_body.length );
                            contentStr = _shortenContentIfNeeded(content, content_length, true);
                            mainShareText = _wrapTag(interaction_body) +" "+ contentStr;
                        break;

                        case "img":
                        case "image":
                            contentStr = "[a picture on "+groupName+"] Check it out: ";
                            mainShareText = _wrapTag(interaction_body) +" "+ contentStr;
                        break;

                        case "media":
                        case "med":
                        case "video":
                            contentStr = "[a video on "+groupName+"] Check it out: ";
                            mainShareText = _wrapTag(interaction_body) +" "+ contentStr;
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
                            var footerShareText = _wrapTag(interaction_body, true) +
                                '&nbsp;[a <a href="'+short_url+'">quote</a> on '+groupName+' via ReadrBoard]';
                            
                            content_length = 300;
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

                            mainShareText = _wrapTag(interaction_body, true);

                            var footerShareText = '&nbsp;[a <a href="'+short_url+'">picture</a> on '+groupName+' via ReadrBoard]';

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
                            var iframeString = '<iframe src=" '+interaction_body+' "></iframe>';

                            mainShareText = _wrapTag(interaction_body, true);

                            var footerShareText = '&nbsp;[a <a href="'+short_url+'">video</a> on '+groupName+' via ReadrBoard]';

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
                            "&raquo;" :
                            "»"
                    ;


                return doHTMLEscape ?
                    tag + "&nbsp;"+connectorSign :
                    tag + " "+connectorSign;
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