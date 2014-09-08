var RDR_offline = (window.location.href.indexOf('local.readrboard.com') != -1 ) ? true:false,
RDR_baseUrl = ( RDR_offline ) ? "http://local.readrboard.com:8081":"http://www.readrboard.com",
RDR_staticUrl = ( RDR_offline ) ? "http://local.readrboard.com:8081/static/":"http://s3.amazonaws.com/readrboard/",
RDR_widgetCssStaticUrl = ( RDR_offline ) ? "http://local.readrboard.com:8081/static/":"http://s3.amazonaws.com/readrboard/";

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
    anonUserImg: RDR_staticUrl+"site/images/anonymous-user.png",
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
                        $blockLink.closest('.card').hide();
                        // var blockText = $.trim( $blockLink.text() );
                        // if ( blockText == "Block this" ) {
                        //     $blockLink.text('Unblock');
                        // } else {
                        //     $blockLink.text('Block this');
                        // }
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
                        $('#board_follow_button').unbind().html('<i class="fa fa-minus"></i>').click( function() {
                            RB.follow.remove(data.follow_id,'brd');
                        });
                    } else {
                        var person_or_group = (data.type=="usr") ? "person":"group";
                        $('#follow_action').html( '<i class="fa fa-minus"></i>' ).unbind().click( function() {
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
                        $('#board_follow_button').unbind().html('<i class="fa fa-plus"></i>').click( function() {
                            RB.follow.add(data.follow_id,'brd');
                        });
                    } else {
                        var person_or_group = (data.type=="usr") ? "person":"group";
                        $('#follow_action').html( '<i class="fa fa-plus"></i>' ).unbind().click( function() {
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
                        
                        // 1/13/2014:  I'm disabling Boards for now!  -- pb.
                        // abstract this
                        // var $boards = $('<div id="board_listing"><h2>ReadrBoards I\'m Following</h2><ul></ul></div>');
                        // $.each( response.data.paginated_follows, function(idx, followed_item) {
                        //     var board_id = followed_item.brd.id;
                        //     $boards.find('ul').append('<li><a class="btn btn-info" style="font-size:18px;" href="/board/'+followed_item.brd.id+'">'+followed_item.brd.title+'</a></li>');
                        // });
                        // var boards_width = $('#content').width() + $('#pages').width();
                        // $boards.width( boards_width );
                        // if ( boards_width < 570 ) {
                        //     $boards.find('ul').width(285);
                        // } else if ( boards_width < 855 ) {
                        //     $boards.find('ul').width(570);
                        // }
                        // $('#cards').before( $boards );

                    } else {
                        
                        if ( typeof response.data.follows_count != "undefined" ) {
                            $('#following_count').html( "<strong>"+response.data.follows_count + "</strong> following" );
                        }

                        var $following_html = $('<div><h2>'+$('#avatar h2').text().trim()+' is following:</h2></div>'),
                            $ul = $('<ul/>');
                        
                        var followerList = response.data.paginated_follows;
                        $.each(followerList, function(idx, following) {
                            if ( typeof following.social_usr != "undefined" ) {
                                var userImg = following.social_usr.img_url||RB.anonUserImg;
                                $ul.append('<li><a href="/user/'+following.social_usr.user+'/" class="clearfix"><img src="'+userImg+'" /><span>'+following.social_usr.full_name+'</span></a></li>');
                            } else if ( typeof following.grp != "undefined" ) {
                                $ul.append('<li><a href="/group/'+following.grp.short_name+'/" class="clearfix">'+following.grp.short_name+'</a></li>');
                            }
                        });
                        $('#following_list').html( $following_html.append($ul) );
                        if(!followerList.length){
                            $('#following_list').append('No follows yet')
                        }
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
                            $('#follow_action').html( '<i class="fa fa-minus"></i>' ).unbind().click( function() {
                                RB.follow.remove( id, type );
                            });
                        } else {
                            $('#follow_action').html( '<i class="fa fa-plus"></i>' ).unbind().click( function() {
                                RB.follow.add( id, type );
                            });
                        }

                        var followerList = response.data.paginated_follows,
                            $follower_html = $('<div><h2>Following '+$('#avatar h2').text().trim()+':</h2></div>'),
                            $ul = $('<ul/>');
                        
                        $.each(followerList, function(idx, following) {
                            var userImg = following.social_usr.img_url||RB.anonUserImg;
                            $ul.append('<li><a href="/user/'+following.social_usr.user+'/"><img src="'+userImg+'" /><span>'+following.social_usr.full_name+'</span></a></li>');
                        });
                        $('#follower_list').html( $follower_html.append($ul) );
                        
                        if(!followerList.length){
                            $('#follower_list').append('<span>no followers yet</span>');
                        }

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
                            var userImg = user.social_user.img_url||RB.anonUserImg;
                            $ul.append('<li><a href="/user/'+user.id+'/"><img src="'+userImg+'" /> '+user.social_user.full_name+'</a></li>');
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
                            'background' : 'rgba(100,100,100,0.8)'
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
            return; // disabling for now
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
                            $boards.find('ul').append('<li><a style="font-size:18px;" class="btn btn-info" href="/board/'+board.id+'">'+board.title+'</a></li>');
                        });
                        // var boards_width = $('#content').width() + $('#pages').width();
                        // $boards.width( boards_width );
                        // if ( boards_width < 570 ) {
                        //     $boards.find('ul').width(285);
                        // } else if ( boards_width < 855 ) {
                        //     $boards.find('ul').width(570);
                        // }
                        $('#cards').before( $boards );
                    }
                }
            });
        },
        searchBoards : function(search_term) {
            // RB.interactions.searchBoards

            // DO NOT DO THIS RIGHT NOW.
            return;

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
                            $li.append('<a style="font-size:18px;" class="btn btn-info" href="/board/'+board.id+'">'+board.title+'</a>');
                            
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
                        var $card = $('.interaction_'+parent_id),
                            $outcome = $card.find('div.me_too_outcome'),
                            $message;

                        var needToLogin = (response.data.message && response.data.message == "not_logged_in");

                        if (needToLogin) {
                            RDRAuth.killUser( function() {
                                RDRAuth.quickFixAjaxLogout();
                            });
                            $message = $('<div><em>Your login has expired.  Please Log in.</em></div>');
                        } else if (response.data.existing == true ) {
                            $message = $('<div><em>You have already added this to your profile.</em></div>');
                        } else {
                            $message = $('<div><em>Success! You have added this to <a href="/user/'+$.cookie('user_id')+'">your profile</a>.</em></div>');
                        }

                        var $shareLinks = $('<div style="overflow:auto;"><strong style="display:block;float:left;margin:5px 5px 0 0;">Share It:</strong> <ul class="shareLinks"></ul>'),
                            socialNetworks = ["facebook","twitter", "tumblr"];

                        var cardData = $card.data();
                        var kind = cardData.kind,
                            interaction_id = cardData.interactionId,
                            interaction_body = cardData.interactionBody,
                            groupName = cardData.groupName,
                            content = "";

                        if ( kind=="txt") {
                            content = $card.find('.contentBody').text();
                        } else if ( kind=="img") {
                            content = $card.find('img.contentBody').attr('src');
                        } else if ( kind=="med") {
                            content = $card.find('img.contentBody').attr('src');
                        }

                        $.each(socialNetworks, function(idx, val){
                            var $li = $('<li><a href="http://' +val+ '.com" ><img class="no-rdr" src="'+RDR_staticUrl+'widget/images/social-icons-loose/social-icon-' +val+ '.png" /></a></li>');
                            $li.find('a').click( function(e) {
                                e.preventDefault();
                                RB.shareWindow = window.open(RDR_staticUrl+'share.html', 'readr_share','menubar=1,resizable=1,width=626,height=436');
                                RB.interactions.share(val, kind, parent_id, interaction_body, groupName, content);
                                return false;
                            });
                            $shareLinks.find('ul').append($li);
                        });


                        $message.append( $shareLinks );
                        
                        $.fancybox($message ,{
                          wrapCSS    : 'fancybox-custom',
                          helpers : {
                            overlay : {
                              css : {
                                'background' : 'rgba(100,100,100,0.8)'
                              }
                            }
                          }
                        });
                        
                        // $message.append( $close, $shareLinks );
                        // var $close = $('<div class="close"><i class="icon-remove"></i></div>');
                        // $close.find('i').click( function() {
                        //     $('.interaction_'+parent_id).find('div.me_too_outcome').hide(333);
                        // });
                        // $outcome.html( $message );
                        // $outcome.show(333);
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

                        var needToLogin = (response.data.message && response.data.message == "not_logged_in");
                        var deleteWasSuccessful = response.data == interaction_id;

                        var $card = $('.interaction_'+interaction_id),
                            //change this name later to make this make more sense.
                            $outcome = $card.find('div.me_too_outcome'),
                            $message;
                        
                        if( needToLogin ){
                            RDRAuth.killUser( function() {
                                RDRAuth.quickFixAjaxLogout();
                            });
                            $message = $('<div><em>Your login has expired.  Please Log in.</em></div>');
                        }
                        else if( deleteWasSuccessful ){
                            $message = $('<div><em>This reaction was removed from <a href="/user/'+$.cookie('user_id')+'">your profile</a>.</em></div>');
                        }else{
                            $message = $('<div><em>This reaction is already removed.</em></div>');
                        }


                        $.fancybox($message ,{
                          wrapCSS    : 'fancybox-custom',
                          helpers : {
                            overlay : {
                              css : {
                                'background' : 'rgba(100,100,100,0.8)'
                              }
                            }
                          },
                          afterClose: function(){
                            window.location.reload();
                          }
                        });

                        // var $close = $('<div class="close"><i class="icon-remove"></i></div>');
                        // $close.find('i').click( function() {
                        //     $('.interaction_'+interaction_id).find('div.me_too_outcome').hide(333);
                        // });
                    
                        // $message.prepend( $close );
                        // $outcome.html( $message );
                        // $outcome.show(333);
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
                            $message = $('<h2 style="margin-bottom:15px;border-bottom:1px solid #999;padding-bottom:7px;">Add to Board</h2><div><em>Success! You have added this to your board, <a href="/board/'+board_id+'/'+board_title+'">'+board_title+'</a>.</em></div>');
                        
                        $.fancybox($message ,{
                          wrapCSS    : 'fancybox-custom',
                          helpers : {
                            overlay : {
                              css : {
                                'background' : 'rgba(100,100,100,0.8)'
                              }
                            }
                          }
                        });

                        // $outcome.html( $message );
                        // $outcome.show(333);
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
                        $('.interaction_'+interaction_id).hide(333, function() {
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
                        var $card = $('.interaction_'+parent_id),
                            $outcome = $('#add_new_reaction_form'),
                            $message;

                        var needToLogin = (response.data.message && response.data.message == "not_logged_in");

                        if (needToLogin) {
                            RDRAuth.killUser( function() {
                                RDRAuth.quickFixAjaxLogout();
                            });
                            $message = $('<div><em>Your login has expired.  Please Log in.</em></div>');
                        } else if (response.data.existing == true ) {
                            var $message = $('<div><em>You have already added this to your profile.</em></div>');
                        } else {
                            var $message = $('<div><em>Success! You have added this to <a href="/user/'+$.cookie('user_id')+'">your profile</a>.</em></div>');
                        }

                        var cardData = $card.data();
                        var kind = cardData.kind,
                            interaction_id = cardData.interactionId,
                            interaction_body = cardData.interactionBody,
                            groupName = cardData.groupName,
                            content = "";

                        var $shareLinks = $('<div style="overflow:auto;"><strong style="display:block;float:left;margin:5px 5px 0 0;">Share It:</strong> <ul class="shareLinks"></ul>'),
                            socialNetworks = ["facebook","twitter", "tumblr"],
                            kind = cardData.kind,
                            groupName = cardData.groupName,
                            content = "";

                        if ( kind=="txt") {
                            content = $card.find('.contentBody').text();
                        } else if ( kind=="img") {
                            content = $card.find('img.contentBody').attr('src');
                        } else if ( kind=="med") {
                            content = $card.find('img.contentBody').attr('src');
                        }

                        $.each(socialNetworks, function(idx, val){
                            var $li = $('<li><a href="http://' +val+ '.com" ><img class="no-rdr" src="'+RDR_staticUrl+'widget/images/social-icons-loose/social-icon-' +val+ '.png" /></a></li>');
                            $li.find('a').click( function(e) {
                                e.preventDefault();
                                RB.shareWindow = window.open(RDR_staticUrl+'share.html', 'readr_share','menubar=1,resizable=1,width=626,height=436');
                                RB.interactions.share(val, kind, parent_id, interaction_body, groupName, content);
                                return false;
                            });
                            $shareLinks.find('ul').append($li);
                        });

                        $message.append( $shareLinks );
                     
                        $.fancybox($message ,{
                          wrapCSS    : 'fancybox-custom',
                          helpers : {
                            overlay : {
                              css : {
                                'background' : 'rgba(100,100,100,0.8)'
                              }
                            }
                          }
                        });

                        // $outcome.html( $message );
                        // $outcome.show(333);
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
                        var $card = $('.interaction_'+parent_id),
                            $outcome = $('#add_new_comment_form');

                        if (response.data.existing == true ) {
                            var $message = $('<div><em>You have already added this to your profile.</em></div>');
                        } else {
                            var $message = $('<div><em>Success! You have added this comment.<br/><br/>Reload the page or check it out on <a href="/user/'+$.cookie('user_id')+'">your profile</a>.</em></div>');
                        }
                        
                        $.fancybox($message ,{
                          wrapCSS    : 'fancybox-custom',
                          helpers : {
                            overlay : {
                              css : {
                                'background' : 'rgba(100,100,100,0.8)'
                              }
                            }
                          }
                        });

                        // $outcome.html( $message );
                        // $outcome.show(333);
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
                                content = content.replace("local.readrboard.com:8081", "www.readrboard.com");
                                content = content.replace("localhost:8081", "www.readrboard.com");
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
                                content = content.replace("local.readrboard.com:8081", "www.readrboard.com");
                                content = content.replace("localhost:8081", "www.readrboard.com");
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


// usage: log('inside coolFunc', this, arguments);
// paulirish.com/2009/log-a-lightweight-wrapper-for-consolelog/
window.log = function(){
  log.history = log.history || [];   // store logs to an array for reference
  log.history.push(arguments);
  if(this.console) {
    arguments.callee = arguments.callee.caller;
    var newarr = [].slice.call(arguments);
    (typeof console.log === 'object' ? log.apply.call(console.log, console, newarr) : console.log.apply(console, newarr));
  }
};

// make it safe to use console.log always
(function(b){function c(){}for(var d="assert,clear,count,debug,dir,dirxml,error,exception,firebug,group,groupCollapsed,groupEnd,info,log,memoryProfile,memoryProfileEnd,profile,profileEnd,table,time,timeEnd,timeStamp,trace,warn".split(","),a;a=d.pop();){b[a]=b[a]||c}})((function(){try
{console.log();return window.console;}catch(err){return window.console={};}})());


// place any jQuery/helper plugins in here, instead of separate, slower script files.

// debounce the window resize
// via http://www.paulirish.com/2009/throttled-smartresize-jquery-event-handler/
(function($,sr){

  // debouncing function from John Hann
  // http://unscriptable.com/index.php/2009/03/20/debouncing-javascript-methods/
  var debounce = function (func, threshold, execAsap) {
      var timeout;

      return function debounced () {
          var obj = this, args = arguments;
          function delayed () {
              if (!execAsap)
                  func.apply(obj, args);
              timeout = null;
          };

          if (timeout)
              clearTimeout(timeout);
          else if (execAsap)
              func.apply(obj, args);

          timeout = setTimeout(delayed, threshold || 100);
      };
  }
  // smartresize 
  jQuery.fn[sr] = function(fn){  return fn ? this.bind('resize', debounce(fn)) : this.trigger(sr); };

})(jQuery,'smartresize');

