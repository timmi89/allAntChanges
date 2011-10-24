var RDR = {}, //our global RDR object
$RDR, //our global $RDR object (jquerified RDR object for attaching data and queues and such)
$R = {}, //init var: our clone of jQuery
RDR_scriptPaths = {},
RDR_baseUrl = ( typeof RDR_offline != "undefined" ) ? "http://www.readrboard.com":"http://local.readrboard.com:8080";
RDR_staticUrl = ( typeof RDR_offline != "undefined" ) ? "http://s3.amazonaws.com/readrboard/":"http://local.readrboard.com:8080/static/";

//test

//testing flipbook_changes branch

//Our Readrboard function that builds the RDR object which gets returned into the global scope.
//This function gets called by the function $RFunctions() via the function rdr_loadScript().
function readrBoard($R){

    var $ = $R;

    //todo: [eric] this doesn't really do anything, cause even if we pick up the global RDR into the local version,
        // we're just overwriting it in the next line anyway. 
        //consider using <if (RDR.length) return;> or just omit it.
    var RDR = RDR ? RDR: {};

    // none of this obj's properties are definite.  just jotting down a few ideas.
    RDR = {
        summaries:{},
        current: {}, //todo: what is this? delete it?
        content_nodes: {
            //template: keep commented out
            /*
            body:"",
            location: <range>
            */
        },
        containers:{},
        pages:{},
        group: {
            //RDR.group:
            //details to be set by RDR.actions.initGroupData which extends defaults
            defaults: {
                img_selector: "img",
                anno_whitelist: "body p",
                media_selector: "embed, video, object, iframe",
                comment_length: 300,
                initial_pin_limit: 30,
                no_readr: "",
                img_blacklist: "",
                custom_css: "",
                //todo: temp inline_indicator defaults to make them show up on all media - remove this later.
                inline_selector: 'img, embed, video, object, iframe',
                slideshow_trigger: '#module-flipbook-wrap',
                slideshow_img_selector: '#module-flipbook div.slideImg img'
            }
        },
        user: {
            img_url: "", 
            readr_token: "",
            user_id: ""
        },
        known_users: {
            
        },
        errors: {
            actionbar: {
                rating:"",
                commenting:""
            }
        },
        styles: {
		},
		rindow: {
            stack:{
                /*

                hash: {
                    settings:{},
                    panels: [
                        {
                            panelCards: { 
                            }
                        }
                    ]
                    ]
                }
                
                */
              
            },
            defaults:{
                coords:{
                    left:100,
                    top:100
                },
                pnlWidth:170,
                animTime:100,
                columns: false,
                defaultHeight:260,
                minHeight: 100,
                maxHeight: 350,
                forceHeight: false
            },
            jspUpdate: function( $rindow ) {
                //RDR.rindow.jspUpdate:
                //updates or inits all $rindow bodies into jScrollPanes

                $rindow.find('div.rdr_body').each( function() {
                    if( !$(this).hasClass('jspScrollable') ){
                        // IE.  for some reason, THIS fires the scrollstop event.  WTF:
                        $(this).jScrollPane({ contentWidth:170, showArrows:true });
                    }else{
                        var API = $(this).data('jsp');
                        API.reinitialise();
                    }
                });
                //$rindow.find('div.rdr_otherTags').animate( {'top':( $rindow.height()-58 ) }, 200 );
            },
            setWidth: function( $rindow, width, callback ) {
                $rindow.animate({
                    width: width
                }, $rindow.settings.animTime, callback );
            },
            setHeight: function( $rindow, options ) {
                //RDR.rindow.setHeight:
                var settings = $.extend({}, this.defaults, options);
                
                //
                
                // var minHeight, maxHeight,
                // height = rindow.height(),
                // gotoHeight = $tagBox.height() + 35 + 10, //+ header height + extra padding;
                // minHeight = gotoHeight;

                // gotoHeight = gotoHeight ? gotoHeight : ( height < minHeight ) ? minHeight : (height > maxHeight) ? maxHeight : null;
                // if( gotoHeight ){
                //     rindow.animate({
                //         height:gotoHeight
                //     }, rindow.settings.animTime, function(){
                //         RDR.rindow.jspUpdate( rindow );
                //     });
                // }   

                var height = $rindow.height(),
                    gotoHeight = settings.targetHeight ? settings.targetHeight : settings.defaultHeight;

                //check for outside range
                gotoHeight = ( gotoHeight < settings.minHeight ) ? settings.minHeight :
                ( gotoHeight > settings.maxHeight ) ? settings.maxHeight : gotoHeight;

                //finally, if forceHeight, overide regardless
                gotoHeight = settings.forceHeight ? settings.forceHeight : gotoHeight;
                
                //for now, just return the height
                /*
                if( !settings.animate ){
                    $rindow.height(gotoHeight);
                }else{
                    $rindow.animate({
                        height:gotoHeight
                    }, settings.animTime)
                }
                */

                return gotoHeight;
            },
            _rindowTypes: {
                //RDR.rindow._rindowTypes:
                writeMode: {
                    //RDR.rindow._rindowTypes.writeMode:
                    make: function(settings){
                        //RDR.rindow._rindowTypes.writeMode.make:
                        //as the underscore suggests, this should not be called directly.  Instead, use RDR.rindow.make(rindowType [,options])

                        var hash = settings.hash;
                        var summary = RDR.summaries[hash],
                            $container = summary.$container,
                            kind = summary.kind;

                            // draw the window over the actionbar
                            var coords = {
                                top: $container.offset().top,
                                left: $container.offset().right
                            };

                        var actionType = (settings.actionType) ? settings.actionType:"react";

                        $('.rdr_rewritable').removeClass('rdr_rewritable');
                        var newSel;
                        if( kind === "text" ){
                            //Trigger the smart text selection and highlight
                            newSel = $container.selog('helpers', 'smartHilite');
                            if(!newSel) return false;

                            //temp fix to set the content (the text) of the selection to the new selection
                            //todo: make selog more integrated with the rest of the code
                            settings.content = newSel.text;

                            coords.left = coords.left + 40;
                            coords.top = coords.top + 35;
                        
                            //if sel exists, reset the offset coords
                            if(newSel){
                                //todo - combine with copy of this
                                var hiliter = newSel.hiliter,
                                $hiliteEnd = hiliter.get$end();

                                //testing adjusting the position with overrides from the hilite span 
                                if( $hiliteEnd ){
                                    var $helper = $('<span />');
                                    $helper.insertAfter( $hiliteEnd );
                                    var strRight = $helper.offset().right;
                                    var strBottom = $helper.offset().bottom;
                                    $helper.remove();
                                    coords.left = strRight + 5; //with a little padding
                                    coords.top = strBottom;
                                }
                            }

                        }
                        var rindow = RDR.rindow.draw({
                            coords: coords,
                            pnlWidth:170,
                            columns:true,
                            noHeader:true,
                            container: hash,
                            content: settings.content,
                            kind: kind,
                            selState: newSel
                        });

                        // TODO this is used to constrain the initial width of this rindow
                        // and then it animates larger when we slide the whyPanel out.
                        // is there a cleaner way?
                        rindow.css({width:'170px'});
                        
                        rindow.addClass('rdr_writemode');
                        //add a reference for the rindow in the container summary
                        summary.$rindow_writemode = rindow;

                        // build the ratePanel

                        var $sentimentBox = $('<div class="rdr_sentimentBox rdr_new" />'),
                            $reactionPanel = $('<div class="rdr_reactionPanel rdr_sntPnl rdr_brtl rdr_brtr rdr_brbr rdr_brbl" />'),
                            $contentPanel = RDR.actions.panel.draw( "contentPanel", rindow ),
                            $whyPanel = RDR.actions.panel.draw( "whyPanel", rindow ),
                            $tagBox = $('<div class="rdr_tagBox" />').append('<ul class="rdr_tags rdr_preselected" />');

                        var firstPanelHeader = (actionType == "react") ? "What's your reaction?":"Bookmark this";
                        var headers = [firstPanelHeader, "Say More"];
                        $sentimentBox.append($reactionPanel, $whyPanel); //$selectedTextPanel, 
                        $sentimentBox.children().each(function(idx){
                            var $header = $('<div class="rdr_header rdr_brtl rdr_brtr" />').append('<div class="rdr_icon"></div><div class="rdr_headerInnerWrap" />'),
                            $body = $('<div class="rdr_body "/>'),
                            $bodyWrap = $('<div class="rdr_body_wrap"/>').append($body),
                            $panelOverlay = $('<div class="rdr_panelOverlay" />'); //for visual effects that need to sit on top of everything - borderline and shadow
                            $header.find('div.rdr_headerInnerWrap').append( '<h1>'+ headers[idx] +'</h1>' );

                            var clearDiv = '<div style="clear:both;"></div>';
                            $(this).append($header, $bodyWrap, clearDiv, $panelOverlay);

                        });
                        RDR.actions.panel.setup("whyPanel", rindow);

                        //populate reactionPanel
                        $reactionPanel.find('div.rdr_body').append($tagBox);

                        ////populate blesed_tags
                        if (actionType == "react") {
                            $.each(RDR.group.blessed_tags, function(idx, val){
                                
                                var $li = $('<li class="rdr_tag_'+val.id+'" />').data({
                                    'tag':{
                                        id:parseInt( val.id, 10 ),
                                        body:val.body
                                    }
                                }),
                                $leftBox = '<div class="rdr_tag_count" ><span class="rdr_not_loader">+</span></div>',
                                $tagText = '<div class="rdr_tagText">'+val.body+'</div>',
                                $rightBox = '<div class="rdr_details" />';

                                $li.append($leftBox,$tagText,$rightBox);
                                $li.hover(
                                    function() {
                                        $(this).addClass('rdr_hover'); // safari/chrome kludge -- :hover isn't working here
                                    },
                                    function() {
                                        $(this).removeClass('rdr_hover'); // safari/chrome kludge -- :hover isn't working here
                                    }
                                );
                                $tagBox.children('ul.rdr_tags').append($li);

                            });
                        }


                        $(this).css('width','auto');
                        // rindow.append($sentimentBox);
                        rindow.find('div.rdr_contentSpace').append($sentimentBox);
                        RDR.actions.sentimentPanel.addCustomTagBox({hash:hash, rindow:rindow, settings:settings, actionType:actionType});
                        

                        rindow.find('ul.rdr_preselected').delegate('li', 'click', function() {
                            var $this = $(this);

                            //take care of case where the tag has already been clicked and submitted
                            if ( $this.hasClass('rdr_tagged') ) {
                                
                                //clears the loader
                                $this.find('div.rdr_tag_count').removeClass('rdr_kill_bg').find('.rdr_loader').remove();

                                $this.addClass('rdr_selected');
                                $this.siblings().removeClass('rdr_selected');
                                
                                //todo: make this expand the panel again if we need it to.
                                //RDR.actions.panel.expand("contentPanel", rindow);

                                var tagID = $this.data('tag').id;

                                //show the rdr_panelCard that belongs to this li tagButton, and hide sibling rdr_panelCards
                                var $panelCards = rindow.find('.rdr_panelCard');

                                //todo: could be prettier, but this works fine
                                $panelCards.each(function(){
                                    if( $(this).data('tagID') == tagID ){
                                        $(this).show()//chain
                                        .siblings('.rdr_panelCard').hide();
                                    }
                                });

                                //expand the panel if it isn't already expanded
                                RDR.actions.panel.expand("whyPanel", rindow);
                                /*
                                RDR.session.rindowUserMessage.hide({
                                    rindow:rindow
                                });
                                */
                                //return false to prevent the rest of the interaction
                                return false;
                            }
                            //else

                            if ( ! $this.hasClass('rdr_customTagBox') ) {
                                // $whyPanel.find('.rdr_body').html('');
                            
                                var newArgs;
                                if (actionType == "react") {
                                    newArgs = { tag:$this, rindow:rindow, settings:settings, hash:hash };
                                    RDR.actions.interactions.ajax( newArgs, 'tag', 'create' );

                                } else {
                                    newArgs = { tag:$this, rindow:rindow, settings:settings, hash:hash };
                                    RDR.actions.interactions.ajax( newArgs, 'bookmark', 'create' );
                                    // RDR.actions.bookmarkStart({ tag:$this, rindow:rindow, settings:settings, actionType:"bookmark" });

                                }
                            }
                        });

                        var rindowHeight = RDR.rindow.setHeight(rindow, {
                            targetHeight: $tagBox.height() + 35 + 10, //+ header height + extra padding;
                            animate:false
                        });

                        var newCoords = RDR.util.stayInWindow({coords:coords, width:170, height:rindowHeight, ignoreWindowEdges:settings.ignoreWindowEdges});

                        rindow.css('left', newCoords.left + 'px');
                        rindow.css('top', newCoords.top + 'px');

                        rindow.width(0).height(0).animate({
                            width:170,
                            height: rindowHeight
                        }, 200, 'swing', function(){
                            RDR.rindow.jspUpdate( rindow );
                        });

                    },
                    customOptions: {
                        
                    },
                    setup: function(){
                        
                    }
                },
                readMode: {
                    //RDR.rindow._rindowTypes.readMode:
                    make: function(settings){
                        //RDR.rindow._rindowTypes.readMode.make:
                        var hash = settings.hash;
                        var summary = RDR.summaries[hash],
                        kind = summary.kind;

                        var selector = ".rdr-" + hash;

                        var $indicator = $('#rdr_indicator_'+hash),
                        $indicator_body = $('#rdr_indicator_body_'+ hash),
                        $indicatorDetails = $('#rdr_indicator_details_'+ hash),
                        $container = $('.rdr-'+hash);

                        var has_inline_indicator = $container.data('inlineIndicator'); //boolean
                        var tempOffsets = has_inline_indicator ? {
                            top: 0,
                            left: 0
                        } : {
                            top: -10,
                            left: -3
                        };

                        //toggled back in RDR.rindow.close:
                        if(has_inline_indicator){
                            $indicatorDetails.find('.rdr_indicator_details_innerWrap').css({
                               'visibility':'hidden'
                            });
                        }

                        //todo: make this nicer
                        var coords = ( (kind == "img" || kind == "media") && !has_inline_indicator ) ?
                        {
                            top: $container.offset().top,
                            left: $container.offset().left + $container.width()
                        } :
                        {
                            //used data instead of offset because offset doesn't work if the node is hidden.  It was giving me problems before.
                            top: $indicatorDetails.data('top') + tempOffsets.top,
                            left: $indicatorDetails.data('left') + tempOffsets.left 
                        };

                        var rindow = RDR.rindow.draw({
                            coords:coords,
                            pnlWidth:170,
                            noHeader:true,
                            selector:selector
                        });

                        rindow.addClass('rdr_readmode');
                        summary.$rindow_readmode = rindow;
                        $indicatorDetails.hide();

                        rindow.find('div.rdr_contentSpace').empty();  // empty this out in case it's just repositioning the rindow.

                        rindow.css({width:'170px'});

                        //todo: use the sentimentBox function instead..  Our Li events are gettign messed up with this duplication


                        var $sentimentBox = $('<div class="rdr_sentimentBox rdr_new" />'),

                            $reactionPanel = $('<div class="rdr_reactionPanel rdr_read rdr_sntPnl rdr_brtl rdr_brtr rdr_brbr rdr_brbl" />'),
                            $contentPanel = RDR.actions.panel.draw( "contentPanel", rindow ),
                            $whyPanel = RDR.actions.panel.draw( "whyPanel", rindow ),
                            $tagBox = $('<div class="rdr_tagBox" />').append('<ul class="rdr_tags rdr_preselected" />'),
                            $indicator_stats = $('<div class="rdr_indicator_stats" />'),
                            $headerOverlay = $('<div class="rdr_header_overlay" />').append($indicator_stats);
                        

                        var headers = ["Reactions", "", ""];  // removing comment count for now +info.com_count
                        $sentimentBox.append($reactionPanel, $contentPanel, $whyPanel); //$selectedTextPanel, 
                        $sentimentBox.children().each(function(idx){
                            var $header = $('<div class="rdr_header rdr_brtl rdr_brtr" />'),
                            $rdr_headerInnerWrap = $('<div class="rdr_headerInnerWrap"><h1>'+ headers[idx] +'</h1></div>').appendTo($header),
                            $body = $('<div class="rdr_body "/>'),
                            $bodyWrap = $('<div class="rdr_body_wrap"/>').append($body),
                            $panelOverlay = $('<div class="rdr_panelOverlay" />'); //for visual effects that need to sit on top of everything - borderline and shadow

                            var clearDiv = '<div style="clear:both;"></div>';
                            $(this).append($header, $bodyWrap, clearDiv, $panelOverlay);

                        });
                        $sentimentBox.prepend($headerOverlay);
            
                        //populate the $indicator_stats.  This will also be updated as needed from summaries.update
                        $indicator_stats.html( $indicator_body.html() );

                        RDR.actions.panel.setup("contentPanel", rindow);

                        //populate reactionPanel
                        $reactionPanel.find('div.rdr_body').append($tagBox);


                        var topTags = summary.top_interactions.tags,
                        topTagsOrder = summary.interaction_order.tags,
                        topComs = summary.top_interactions.coms,
                        totalTags = summary.counts.tags,
                        totalComs = summary.counts.coms;

                        ////populate blesed_tags
                        $.each( topTagsOrder, function( idx, tagOrder ){
                            var tag = topTags[ tagOrder.id ];
                            var percentage = Math.round( ( tag.count/totalTags ) * 100);                
                            var $li = $('<li class="rdr_tag_'+tagOrder.id+'" />').data({
                                'tag':{
                                    id:parseInt( tagOrder.id, 10),
                                    body:tag.body,
                                    count:tag.count
                                },
                                'hash':hash
                            }),
                            $leftBox = '<div class="rdr_tag_count"><span class="rdr_not_loader" >'+RDR.util.prettyNumber( tag.count )+'</span></div>',
                            $tagText = '<div class="rdr_tagText">'+tag.body+'</div>',
                            $rightBox = '<div class="rdr_details" />';

                            $li.append($leftBox,$tagText,$rightBox);
                            
                            // todo: [porter] i'm looping to see if there is a comment for this TAG.  can we just send this down from server?
                            var commentsHere = 0;
                            for ( var i in topComs ) {
                                if ( (topComs[i].tag_id == tagOrder.id) || ( i == tagOrder.id ) ) {  // first is for text, second option is for images/media
                                    $li.addClass('rdr_has_comment');

                                    // loop to see how many content_nodes' comments are under this tag
                                    if ( kind == "text" ) {
                                        for ( var j in summary.content_nodes ) {
                                            for ( var k in summary.content_nodes[j].top_interactions.coms ) {
                                                if ( summary.content_nodes[j].top_interactions.coms[k].tag_id == topComs[i].tag_id ) {
                                                    commentsHere++; 
                                                }
                                            }
                                        }
                                    } else {
                                        for ( var l in summary.top_interactions.coms[i] ) {
                                                commentsHere++; 
                                        }
                                    }
                                }
                            }
                            if ( commentsHere > 0 ) $li.find('div.rdr_details').append('<span>' + RDR.util.prettyNumber( commentsHere ) + '</span>');
                            $tagBox.children('ul.rdr_tags').append($li);
                        
                        });
                        
                        rindow.find('div.rdr_contentSpace').html( $sentimentBox );

                        rindow.find('ul.rdr_preselected li').each( function(){
                            var $this = $(this);

                            var tag = $this.data('tag');

                            $this.find('div.rdr_tag_count').each( function() {
                                var $thisDetails = $(this);
                                var content_node_count = 0;
                                var content_node = {};
                                // how many content nodes are tagged with this particular tag?
                                // TODO: make this loop a RDR.util function, bet we use it or similar in many places.
                                if ( kind == "text" ) {
                                    $.each( summary.content_nodes, function(idx, cnode) {
                                        if ( cnode.top_interactions.tags && cnode.top_interactions.tags[ tag.id ] ) {
                                            content_node_count++;
                                            content_node = cnode;
                                        }
                                    });
                                } else {
                                    if ( summary.top_interactions.tags && summary.top_interactions.tags[ tag.id ] ) {
                                        content_node_count++;
                                        content_node = summary;
                                    }
                                }

                                // if just one content_node with this tag in this hash, then +1 that tag.
                                if ( content_node_count == 1 ) {
                                    $thisDetails.bind('click', function() {
                                        args = { tag:tag, rindow:rindow, hash:hash, content_node:content_node, uiMode:'read'};
                                        RDR.actions.interactions.ajax( args, 'tag', 'create' );
                                    });
                                    // return false;
                                // else, slide open the content panel
                                } else {
                                    
                                }

                                $thisDetails.hover(
                                    function() {
                                        var hoverText = (content_node_count==1) ? "+":"?";
                                        $(this).find('span').text(hoverText);
                                    },
                                    function() {
                                        $(this).find('span').text(tag.count);
                                    }
                                );
                            });

                            $this.click( function() {
                                var $this = $(this);
                                // see how many CONTENT_NODES have this TAG, to know if we should skip straight to the whyPanel on click
                                var nodes_with_this_tag = 0,
                                    content_node;

                                for ( var i in summary.content_nodes ) {
                                    if ( summary.content_nodes[i].top_interactions && summary.content_nodes[i].top_interactions.tags[ $this.data('tag').id ] ) {
                                        nodes_with_this_tag++;
                                        content_node = summary.content_nodes[i];
                                    }
                                }

                                // i.e. it's an image / media
                                if ( !content_node ) {
                                    content_node = RDR.content_nodes[ $this.data('hash') ];
                                }

                                if ( !$this.hasClass('rdr_customTagBox') ) {
                                    $this.addClass('rdr_selected');
                                    $this.siblings().removeClass('rdr_selected');
                                    $this.parents('div.rdr.rdr_window').removeClass('rdr_rewritable');

                                    if ( ( nodes_with_this_tag == 1 ) || kind == "img" || kind == "media" ) {

                                        var hash = $this.data('hash');

                                        //try to add selState to content_node - there should only be one
                                        var selState = $this.data('selStates')[0];
                                        content_node.selState = selState;
                                        RDR.actions.viewCommentContent( {tag:$this.data('tag'), hash:hash, rindow:rindow, kind:kind, content_node:content_node, view_all_state:"hide" });
                                    } else {
                                        RDR.actions.viewReactionContent( $this.data('tag'), $this.data('hash'), rindow );
                                    }
                                }
                                return false; //so click on <a>img</a> gets overridden
                            });

                            // START: WHAT DOES ALL OF THIS DO?
                            $this.data('selStates',[]);

                            var tag_id = $this.data('tag').id;
                            
                            var nodes = summary.content_nodes || [];

                            $.each(nodes, function(id, node){
                                var nodeTags = node.top_interactions.tags;
                                var thisTag = nodeTags[ tag_id ];
                                if(typeof thisTag === "undefined") return;
                                //else                            
                                $this.data('selStates').push(node.selState);  
                            });
                            // END: WHAT DOES ALL OF THIS DO?
                            
                        })//chain
                        .hover( 
                            function() {
                                //don't do this for windows that are resizing
                                if( $(this).closest('.rdr_window.ui-resizable-resizing').length) return;
                                if( $(this).closest('.rdr_window.ui-draggable-dragging').length) return;

                                $(this).addClass('rdr_hover'); // safari/chrome kludge -- :hover isn't working here
                                var selStates = $(this).data('selStates');

                                //quick hack because I don't yet have a good solution for multiple hilites. (overlapping ones cause issues still.)
                                var lastSelState = selStates.length ? selStates[selStates.length-1] : null;
                                if (lastSelState){
                                    $().selog('hilite', lastSelState, 'on');
                                }
                            
                                /*
                                $.each( selStates, function(idx, selState){
                                    $().selog('hilite', selState, 'on');
                                });
                                */
                            },
                            function() {

                                //don't do this for windows that are resizing
                                if( $(this).closest('.rdr_window.ui-resizable-resizing').length) return;
                                if( $(this).closest('.rdr_window.ui-draggable-dragging').length) return;

                                $(this).removeClass('rdr_hover');  // safari/chrome kludge -- :hover isn't working here
                                var selStates = $(this).data('selStates');

                                //quick hack because I don't yet have a good solution for multiple hilites. (overlapping ones cause issues still.)
                                var lastSelState = selStates.length ? selStates[selStates.length-1] : null;
                                if (lastSelState){
                                    $().selog('hilite', lastSelState, 'off');
                                }
                                /*
                                $.each( selStates, function(idx, selState){
                                    $().selog('hilite', selState, 'off');
                                });
                                */
                            }
                        );

                        var rindowHeight = RDR.rindow.setHeight(rindow, {
                            targetHeight: $tagBox.height() + 35 + 10, //+ header height + extra padding;
                            animate:false
                        });

                        var newCoords = RDR.util.stayInWindow({coords:coords, width:170, height:rindowHeight, ignoreWindowEdges:settings.ignoreWindowEdges});

                        rindow.css('left', newCoords.left );
                        rindow.css('top', newCoords.top );

                        rindow.width(0).height(0).animate({
                            width:170,
                            height: rindowHeight
                        }, 200, 'swing', function(){
                            RDR.rindow.jspUpdate( rindow );
                        });

                        rindow.bind( 'mouseleave', function() {
                            var $this = $(this);
                            if ( $this.hasClass('rdr_rewritable') ) {
                                $this.remove();
                            }
                        })
                        
                    },
                    customOptions: {
                        
                    },
                    setup: function(){
                        
                    }
                }
            },
            make: function(rindowType, options){
                //RDR.rindow.make:

                //temp tie-over    
                var hash = options.hash,
                    summary = RDR.summaries[hash],
                    kind = options.kind;
                
                if (!summary) {
                    // setup the summary
                    // FORCING SUMMARY CREATION
                    summary = RDR.util.makeEmptySummary(hash);
                    RDR.actions.containers.setup(summary);
                }
                // summary = RDR.summaries[hash];
                    
                //checks for rindowType
                if ( !rindowType ) rindowType = "readMode";
                if ( !RDR.rindow._rindowTypes.hasOwnProperty(rindowType) ) return;
                //else

                //[cleanlogz]('user');
                var defaultOptions = RDR.rindow.defaults,
                    customOptions = RDR.rindow._rindowTypes[rindowType].customOptions,
                    settings = $.extend( {}, defaultOptions, customOptions, options );
                    
                //call make function for appropriate type
                RDR.rindow._rindowTypes[rindowType].make(settings);

            },
			draw: function(options) {
                //RDR.rindow.draw:
                
                /*
                //options are:
                { 
                    coords:{
                        left:100,
                        top:100
                    },
                    pnlWidth:200,
                    columns:true,
                    noHeader:true,
                    container: hash,
                    content: settings.content,
                    kind: kind,
                    selState: newSel,
                    selector:selector,
                    id: "rdr_loginPanel",
                    pnls:1,
                    height:225,
                    animTime:100,
                    minHeight: 100,
                    maxHeight: 350
                }
                */

                if ( options.selector && !options.container ) {
                    options.container = options.selector.substr(5);
                }
				// for now, any window closes all tooltips
                //merge options and defaults

                var settings = $.extend({}, this.defaults, options);

                var minHeight = settings.minHeight;
                var maxHeight = settings.maxHeight;


				var $new_rindow = $('div.rdr.rdr_window.rdr_rewritable'); // jquery obj of the rewritable window
				if ( $new_rindow.length === 0 ) { // there's no rewritable window available, so make one
					$new_rindow = $('<div class="rdr rdr_window rdr_rewritable rdr_widget"></div>');
                    if ( settings.id ) {
                        $('#'+settings.id).remove(); // todo not sure we should always just REMOVE a pre-existing rindow with a particular ID...
                                                     // reason I'm adding this: want a login panel with an ID and data attached to it, so after a user
                                                     // logs in, the login rindow knows what function to then call
                        $new_rindow.attr('id',settings.id);
                    }

                    // may not need selector.  was a test to see if we can embed the rindow within a document, optionally.
                    //todo: do we still want this feature that uses .selector ?
                    //for now don't do this.  I don't know what it does.
                    
                    //this is instead of the if / else below
                    $('#rdr_sandbox').append( $new_rindow );
                    
                    /*
					if (options.selector) {
                        $(options.selector).after( $new_rindow );
                    } else {
                        $('#rdr_sandbox').append( $new_rindow );
                    }
                    */
				}

                $new_rindow.data(settings);// jquery obj of the rewritable window

                if ( options.columns === true ) $new_rindow.addClass('rdr_columns');

				if ( $new_rindow.find('h1').length === 0 ) {
                    $new_rindow.html('');
                    if ( !options.noCloseButton ) $new_rindow.append( '<div class="rdr_close">x</div>');
                    $new_rindow.append( '<h1></h1><div class="rdr rdr_contentSpace"></div>' );
                    $new_rindow.find('div.rdr_close').click( function() {
                        //needed to change this to add triggers
                        RDR.rindow.close( $(this).parents('div.rdr.rdr_window') );
                        $('#rdr_overlay').remove();
                        return false; //make sure rindow for <a><img /></a> doesn't activate link
                    });
					
					if ( settings.noHeader ) $new_rindow.find('h1').remove();
					
                    $new_rindow.draggable({
                        handle:'.rdr_header, .rdr_header_overlay', //todo: move the header_overlay inside the header so we don't need this hack
                        containment:'document',
                        stack:'.RDR.window',
                        start:function() {
                            $(this).removeClass('rdr_rewritable');
                        }
                    });

                }
                
                var coords = settings.coords;
                               
                $new_rindow.css('left', coords.left + 'px');
                $new_rindow.css('top', coords.top + 'px');
                if(settings.height){
                    $new_rindow.height(settings.height);
                }
               
                RDR.rindow.jspUpdate( $new_rindow );

                RDR.actionbar.closeAll();

                $new_rindow.settings = settings;

                $new_rindow.resizable({
                    grid: [100000, null], /*this is my own hack for locking the movement to the y axis, but I think it works well*/
                    handles:'s',
                    minHeight:minHeight,
                    maxHeight:maxHeight
                });

                var $dragHandle = $new_rindow.find('.ui-resizable-s');
                $dragHandle.addClass('rdr_window_dragHandle');
                $dragHandle.hover(
                    function(){
                        $(this).addClass('rdr_hover');
                    },
                    function(){
                        $(this).removeClass('rdr_hover');
                    }
                );

                $new_rindow.append( $dragHandle );
                
                var $rindowMsgDiv = $('<div class="rdr_rindow_message" />'),
                    $rindowMsgDivInnerwrap = $('<div class="rdr_rindow_message_innerwrap"><span class="rdr_userMsg" /><strong /><div style="clear:both;"/></div>'),
                    $tmpUserMsg = $('<div class="rdr_rindow_message_tempUserMsg" />'),
                    $closeButton = $('<div class="rdr_close">x</div>');

                $closeButton.click(function(){
                    RDR.session.rindowUserMessage.hide( $new_rindow );
                });

                $rindowMsgDivInnerwrap.append( $tmpUserMsg );
                $rindowMsgDivInnerwrap.append( $closeButton );

                $rindowMsgDiv.append($rindowMsgDivInnerwrap).hide();
                $new_rindow.append( $rindowMsgDiv );
                
                
                //now add a watcher to reinitialize these scrollpanes when the rindow is resizing                
                //rindow.res $scrollPanes.add($column);
                /*
                //this was way too slow
                rindow.bind( "resize", function(event, ui) {
                    var APIs = $scrollPanes.data('jsp');
                    APIs.reinitialise();
                });
                */
                $new_rindow.bind( "resizestop", function(event, ui) {
                    RDR.rindow.jspUpdate( $(this) );
                });

                return $new_rindow;
			},
            close: function( $rindows ) {
                //RDR.rindow.close:
                RDR.rindow.clearHilites( $rindows );
                $rindows.each(function(idx,rindow){
                    $(rindow).remove();
                });

                //todo: move this - this is a temp shotgun spray approach.
                //toggled to hidden in RDR.rindow._rindowTypes.readMode.make:
                $('#rdr_indicator_details_wrapper').find('.rdr_indicator_details_innerWrap').css({
                   'visibility':'visible'
                });
            },
            closeAll: function() {
                var $allRindows = $('div.rdr.rdr_window');
				RDR.rindow.close( $allRindows );
                $('.rdr_shared').removeClass('rdr_shared');
                $('#rdr_overlay').remove();
			},
            clearHilites: function( $rindows ){
                var selStates = [];
                $rindows.each(function(idx,rindow){
                    var hash = $(rindow).data('container');

                    //if not a rindow for a container, there won't be any hilites.
                    if ( typeof hash === 'undefined' ) return;
                    //else
                    
                    var summary = RDR.summaries[hash];

                    //todo: think about better name and pattern for how write-mode hilite gets stored.
                    //first find writeMode selState
                    var selState = $(rindow).data('selState');
                    if ( typeof selState !== 'undefined' && selState !== ""){
                        //note that image rindows have no hilite, but this takes care of that.
                        selStates.push(selState);
                    }

                    //let content_nodes stay [] if summary doesn't no data has been loaded (for a page with no reactions)
                    var content_nodes = [];
                    if( summary && summary.hasOwnProperty('content_nodes') ){
                        content_nodes = summary.content_nodes;
                    }

                    //now add any content hilites from hover states that might be hanging around.
                    $.each( content_nodes, function(key, node){
                        var selState = node.selState;
                        if ( typeof selState !== 'undefined' ){
                            selStates.push(selState);
                        }
                    });
                });

                $.each( selStates, function(idx, selState){
                    try{
                        $().selog('hilite', selState, 'off');
                    }
                    catch(err){
                    }
                });
            },
            update: function(hash, diffNode){
                //RDR.rindow.update:

                var summary = RDR.summaries[hash],
                    $rindow_readmode = summary.$rindow_readmode,
                    $rindow_writemode = summary.$rindow_writemode;
                
                if( diffNode.int_type == "coms" ){

                    if($rindow_writemode){
                        _addComIndicator($rindow_writemode, diffNode);
                    }
                    if($rindow_readmode){
                        _addComIndicator($rindow_readmode, diffNode);
                    }
                }

                function _addComIndicator($rindow, diffNode){
                    var $tags, $tag;
                    
                    $tags = $rindow.find('.rdr_tags');
                    
                    //$tags.find('li').removeClass('rdr_has_comment');

                    $tag = $tags.find('.rdr_tag_'+diffNode.parent_interaction_node.id);
                    
                    // todo: add case where diff is -1 and there is only 1 com- remove the comment
                    $tag.addClass('rdr_has_comment');

                    //now do the rdr_contentSet
                    
                    //RDR.actions.content_panel.make(node, tagClone, hash, $rindow);
                    
                    /*
                    var $contentSets = $rindow.find('#rdr_contentPanel .rdr_contentSet');
                    $contentSets.each(function(){
                        var parent_interaction_node = $(this).data('tag');
                        if( parent_interaction_node.id == diffNode.parent_interaction_node.id ){
                            var $header = $(this).find('.rdr_contentHeader');
                            var $comLink = $header.find('div.rdr_comment_link');
                            if( $comLink.hasClass('rdr_can_comment') ){
                                    $comLink.removeClass('rdr_can_comment');
                                    $comLink.addClass('rdr_has_comment');
                            }else{
                                
                            }
                            

                        }
                    });
                    */

                }

                //now update the rindow's indicator copy
                if( $rindow_readmode){
                
                    var $indicator = summary.$indicator,
                        $indicator_body = summary.$indicator_body,
                        $indicator_stats = $rindow_readmode.find('.rdr_indicator_stats');

                    $indicator_stats.fadeOut(100, function(){
                        $indicator_stats.html( $indicator_body.html() );
                        $indicator_stats.fadeIn(300);
                    });
                    
                }
                //this is really a rindow update function and should be moved somewhere here, 
                //but I'm drawing from the existing update function, so leave it there for the time being
                /*
                RDR.actions.newUpdateData(hash);
                */
            }//end RDR.rindow.update
		},
		actionbar: {
			draw: function(settings) {
                //RDR.actionbar.draw:
                //expand to make settings explicit

                //node: summary may not be defined at this point, so get info from settings.
                var hash = settings.hash,
                    coords = settings.coords,
                    kind = settings.kind,
                    content = settings.content,
                    src_with_path = settings.src_with_path || undefined; //used for media only
                
                var actionbar_id = "rdr_actionbar_"+hash;
                var $actionbars = $('div.rdr_actionbar');
                
                if ( $('#'+actionbar_id).length > 0 ) return $('#'+actionbar_id);
                // else 

                // todo: if IE, position higher so we're not behind IE's "Accelerator" arrow
                var actionbarOffsets = {
                    IE: {
                        top: 'add this here',
                        left: 'add this here'
                    },
                    img:  _getMediaCoords, //function below (yeah this is a little weird, make nicer later)
                    text:  {
                        //the extra offsets here move the actionbar above the click - not exact numbers.
                        top: coords.top - 33,
                        left: coords.left + 3
                    }
                };
                
                coords = (kind == 'text') ? actionbarOffsets.text : actionbarOffsets.img(coords);

                //todo: for images and video, put the actionbar on the left side if the image is too far right
                if (kind == 'text') {
                    //rewrite coords if needed
                    coords = RDR.util.stayInWindow({coords:coords, width:45, height:30, paddingY:40, paddingX:40, ignoreWindowEdges:settings.ignoreWindowEdges});                    
                }

                // TODO use settings check for certain features and content types to determine which of these to disable
                var $new_actionbar = $('<div class="rdr rdr_actionbar rdr_widget rdr_widget_bar" id="' + actionbar_id + '" />').css({
                   'top':coords.top,
                   'left':coords.left
                }).data('hash',hash)//chain
                .append('<ul/>');

                var items = [
                        {
                            "item":"reaction",
                            "tipText":"React to this",
                            "onclick":function(){
                                RDR.rindow.make( 'writeMode', {
                                    "hash": hash,
                                    "kind": kind,
                                    "content": content,
                                    "src_with_path":src_with_path
                                });
                            }
                        },
                        {
                            "item":"bookmark",
                            "tipText":"Bookmark this",
                            "onclick":function(){
                                RDR.rindow.make( 'writeMode', {
                                    "hash": hash,
                                    "kind": kind,
                                    "content": content,
                                    "src_with_path":src_with_path,
                                    "actionType":"bookmark"
                                });
                            }
                        }
                ];

                $.each( items, function(idx, val){
                    var $item = $('<li class="rdr_icon_' +val.item+ '" />'),
                    $indicatorAnchor = $('<a href="javascript:void(0);">' +val.item+ '</a>'),
                    $tooltip = RDR.tooltip.draw({"item":val.item,"tipText":val.tipText}).hide();
                    $indicatorAnchor.click(function(){
                        val.onclick();
                        return false;
                    });
                    $item.append($indicatorAnchor,$tooltip).appendTo($new_actionbar.children('ul'));
                    if(idx===0){
                        $item.addClass('rdr_actionbar_first');
                    }else if(idx === items.length - 1){
                        $item.addClass('rdr_actionbar_last');
                    }
                });

                //todo: [eric] I added a shareStart function that shows up after the rate-this dialogue,
                //but we're not sure yet if it's going to be the same function as this shareStart () above..

                $('#rdr_sandbox').append( $new_actionbar );
                $new_actionbar.find('li').hover(
                    function() {
                        $(this).find('a').siblings('.rdr_tooltip').show();
                    },
                    function () {
                        $(this).find('a').siblings('.rdr_tooltip').hide();
                    }
                );

                if(kind == "img" || kind == "media"){
                    $new_actionbar.addClass('rdr_actionbar_for_media');
                    $new_actionbar.append('<div style="clear:both;" />').removeClass('rdr_widget rdr_widget_bar');

                    //for now, just move the actionbar here overridding the positioning from above:



                    /*                    
                    $indicator_details = $('#rdr_indicator_details_'+containerHash).removeClass('rdr_widget rdr_widget_bar');
                    var indicatorDetailsOffset = {
                        'top': $new_actionbar.offset().top,
                        'left': $new_actionbar.offset().left + $new_actionbar.width()
                    }
                    $indicator_details.appendTo($new_actionbar)//chain
                    .css({
                        'display':'block',
                        'position':'relative'
                    });
                    */
                }

                function _getMediaCoords(coords){
                    /*
                    var newCoords = {
                        top: coords.top - 2,
                        left: coords.left + 2
                    };
                    */
                    var $containerTracker = $('#rdr_container_tracker_'+hash),
                        $topHilite = $containerTracker.find('.rdr_mediaHilite_top');
                    
                    var newCoords = {
                        top: $topHilite.offset().top,
                        left: $topHilite.offset().right
                    };
                    return newCoords;
                }

                return $new_actionbar;
                     
            },
			close: function($actionbars, effect){
                //RDR.actionbar.close:
                $actionbars.each(function(){
                    var $actionbar = $(this),
                        hash = $actionbar.data('hash'),
                        $containerTracker = $('#rdr_container_tracker_'+hash),
                        $mediaBorderWrap = $containerTracker.find('.rdr_media_border_wrap');

                    if(typeof effect !== "undefined"){ //quick hack to signal fade effect
                        //make more robust if we want more animations
                        var $fadeSet = $().add($actionbar).add($mediaBorderWrap);
                        //I wanted to combine these into one animation, but jquery didn't like that.
                        $actionbar.fadeOut(200);
                        $mediaBorderWrap.fadeOut(200, function(){
                            $(this).hide();
                            cleanup($actionbar, hash);
                        });
                    }
                    else{
                        cleanup($actionbar, hash);
                        
                        $mediaBorderWrap.hide();
                                            
                        var $indicator = $('#rdr_indicator_'+hash);
                        $indicator.removeClass('rdr_engage_media');
                    }
                });

                //helper function
                function cleanup($actionbar, hash){
                    var timeoutCloseEvt = $actionbar.data('timeoutCloseEvt');
                    var timeoutCollapseEvt = $actionbar.data('timeoutCollapseEvt');
                    clearTimeout(timeoutCloseEvt);
                    clearTimeout(timeoutCollapseEvt);

                    var $container = $('.rdr-'+hash),
                        $indicator = $('#rdr_indicator_'+hash);

                    $container.removeClass('rdr_engage_media');
                    $indicator.removeClass('rdr_engage_media');
                    $actionbar.remove();
                }
       
			},
            closeSuggest: function(hashes) {
                //hashes can be a single hash or a list of hashes
                var $actionbars = $();
                if( !hashes ){
                    $actionbars = $('div.rdr_actionbar');
                }
                else
                if(typeof hashes == "string" ){
                    var hash = hashes;
                    $actionbars = $('#rdr_actionbar_'+hash);
                    $actionbars.data('hash',hash);
                }
                else{
                    $.each( hashes, function(idx, hash){
                        $actionbars = $actionbars.add('#rdr_actionbar_'+hash);
                        $actionbars.data('hash',hash);
                    });
                }
                
                var scope = this;
                $actionbars.each(function(){
                    var $this = $(this),
                    hash = $actionbars.data('hash'),
                    $indicator_details = $('#rdr_indicator_details_'+hash),
                    $containerImg = $('.rdr-'+hash),
                    timeoutCloseEvt = $(this).data('timeoutCloseEvt');
                    
                    //each actionbar only has one timeout - if one exists, it gets cleared and reset here.
                    clearTimeout(timeoutCloseEvt);
                    timeoutCloseEvt = setTimeout(function(){
                        if( $this.data('hover') || $containerImg.data('hover') || $indicator_details.data('hover') ) return;
                        //else
                        scope.close( $this, "fade");
                    },300);
                    $(this).data('timeoutCloseEvt', timeoutCloseEvt);
                });
            },
            closeAll: function(){
                var $actionbars = $('div.rdr_actionbar');
                this.close($actionbars);
            }
		},
		tooltip: {
			draw: function(settings) {
                return $('<div class="rdr rdr_tooltip" class="rdr_tooltip_' +settings.item+ '">' +
                        '<div class="rdr rdr_tooltip-content"> ' +settings.tipText+ '</div>'+
                        '<div class="rdr rdr_tooltip-arrow-border" />'+
                        '<div class="rdr rdr_tooltip-arrow" />'+
                        '</div>'
                );
            }
		},
		util: {
            makeEmptySummary : function(hash, kind) {
                var summary = {};
                summary[hash] = {};
                summary[hash].hash = hash;
                summary[hash].kind = kind;
                summary[hash].top_interactions = {};
                summary[hash].top_interactions.coms = {};
                summary[hash].top_interactions.tags = {};
                summary[hash].top_interactions.shr = {};

                summary[hash].interaction_order = {};
                summary[hash].interaction_order.coms = {};
                summary[hash].interaction_order.tags = {};

                summary[hash].counts = {};
                summary[hash].counts.tags = 0;
                summary[hash].counts.interactions = 0; // TODO not sure why we have this and also "tags"
                summary[hash].counts.coms = 0;

                return summary;
            },
            getPageProperty : function( prop, hash ) {
                if (!prop) prop = "id";
                if (!hash) return false;                
                // do we already have the page_id stored on this element, or do we need to walk up the tree to find one?
                var page_id = ( $('.rdr-'+hash).data('page_id') ) ? $('.rdr-'+hash).data('page_id') : $('.rdr-'+hash).closest('.rdr-page-container').data('page_id');
                
                // store the page_id on this node to prevent walking-up again later
                if ( $('.rdr-'+hash).hasClass('rdr-page-container') && !$('.rdr-'+hash).data('page_id') ) {
                    $('.rdr-'+hash).data('page_id', page_id);
                }

                return page_id;
            },
            stayInWindow: function(settings) {
                
	           var rWin = $(window),
	                winWidth = rWin.width(),
	                winHeight = rWin.height(),
	                winScroll = rWin.scrollTop(),
					w = settings.width,
					h = settings.height,
					coords = settings.coords,
                    paddingY = settings.paddingY || 10,
                    paddingX = settings.paddingX || 10,
                    ignoreWindowEdges = (settings.ignoreWindowEdges) ? settings.ignoreWindowEdges:""; // ignoreWindowEdges - check for index of t, r, b, l

                if ( ( ignoreWindowEdges.indexOf('r') == -1 ) && (coords.left+w+16) >= (winWidth - paddingX) ) {
                    coords.left = winWidth - w - paddingX;
                }
                if ( ( ignoreWindowEdges.indexOf('b') == -1 ) &&  (coords.top+h) > (winHeight + winScroll - paddingY ) ) {
                    coords.top = winHeight + winScroll - h - paddingY;
                }
                if ( ( ignoreWindowEdges.indexOf('l') == -1 ) && coords.left < paddingX ) {
					coords.left = paddingX;
				}
                if ( ( ignoreWindowEdges.indexOf('t') == -1 ) && coords.top < (winScroll + paddingY) ) {
					coords.top = winScroll + paddingY;
				}

                return coords;
            },
            md5: {
				hexcase:0,
				b64pad:"",
				chrsz:8,
				hex_md5: function(s){return RDR.util.md5.binl2hex(RDR.util.md5.core_md5(RDR.util.md5.str2binl(s),s.length*RDR.util.md5.chrsz));},
				core_md5: function(x,len){x[len>>5]|=0x80<<((len)%32);x[(((len+64)>>>9)<<4)+14]=len;var a=1732584193;var b=-271733879;var c=-1732584194;var d=271733878;for(var i=0;i<x.length;i+=16){var olda=a;var oldb=b;var oldc=c;var oldd=d;a=RDR.util.md5.md5_ff(a,b,c,d,x[i+0],7,-680876936);d=RDR.util.md5.md5_ff(d,a,b,c,x[i+1],12,-389564586);c=RDR.util.md5.md5_ff(c,d,a,b,x[i+2],17,606105819);b=RDR.util.md5.md5_ff(b,c,d,a,x[i+3],22,-1044525330);a=RDR.util.md5.md5_ff(a,b,c,d,x[i+4],7,-176418897);d=RDR.util.md5.md5_ff(d,a,b,c,x[i+5],12,1200080426);c=RDR.util.md5.md5_ff(c,d,a,b,x[i+6],17,-1473231341);b=RDR.util.md5.md5_ff(b,c,d,a,x[i+7],22,-45705983);a=RDR.util.md5.md5_ff(a,b,c,d,x[i+8],7,1770035416);d=RDR.util.md5.md5_ff(d,a,b,c,x[i+9],12,-1958414417);c=RDR.util.md5.md5_ff(c,d,a,b,x[i+10],17,-42063);b=RDR.util.md5.md5_ff(b,c,d,a,x[i+11],22,-1990404162);a=RDR.util.md5.md5_ff(a,b,c,d,x[i+12],7,1804603682);d=RDR.util.md5.md5_ff(d,a,b,c,x[i+13],12,-40341101);c=RDR.util.md5.md5_ff(c,d,a,b,x[i+14],17,-1502002290);b=RDR.util.md5.md5_ff(b,c,d,a,x[i+15],22,1236535329);a=RDR.util.md5.md5_gg(a,b,c,d,x[i+1],5,-165796510);d=RDR.util.md5.md5_gg(d,a,b,c,x[i+6],9,-1069501632);c=RDR.util.md5.md5_gg(c,d,a,b,x[i+11],14,643717713);b=RDR.util.md5.md5_gg(b,c,d,a,x[i+0],20,-373897302);a=RDR.util.md5.md5_gg(a,b,c,d,x[i+5],5,-701558691);d=RDR.util.md5.md5_gg(d,a,b,c,x[i+10],9,38016083);c=RDR.util.md5.md5_gg(c,d,a,b,x[i+15],14,-660478335);b=RDR.util.md5.md5_gg(b,c,d,a,x[i+4],20,-405537848);a=RDR.util.md5.md5_gg(a,b,c,d,x[i+9],5,568446438);d=RDR.util.md5.md5_gg(d,a,b,c,x[i+14],9,-1019803690);c=RDR.util.md5.md5_gg(c,d,a,b,x[i+3],14,-187363961);b=RDR.util.md5.md5_gg(b,c,d,a,x[i+8],20,1163531501);a=RDR.util.md5.md5_gg(a,b,c,d,x[i+13],5,-1444681467);d=RDR.util.md5.md5_gg(d,a,b,c,x[i+2],9,-51403784);c=RDR.util.md5.md5_gg(c,d,a,b,x[i+7],14,1735328473);b=RDR.util.md5.md5_gg(b,c,d,a,x[i+12],20,-1926607734);a=RDR.util.md5.md5_hh(a,b,c,d,x[i+5],4,-378558);d=RDR.util.md5.md5_hh(d,a,b,c,x[i+8],11,-2022574463);c=RDR.util.md5.md5_hh(c,d,a,b,x[i+11],16,1839030562);b=RDR.util.md5.md5_hh(b,c,d,a,x[i+14],23,-35309556);a=RDR.util.md5.md5_hh(a,b,c,d,x[i+1],4,-1530992060);d=RDR.util.md5.md5_hh(d,a,b,c,x[i+4],11,1272893353);c=RDR.util.md5.md5_hh(c,d,a,b,x[i+7],16,-155497632);b=RDR.util.md5.md5_hh(b,c,d,a,x[i+10],23,-1094730640);a=RDR.util.md5.md5_hh(a,b,c,d,x[i+13],4,681279174);d=RDR.util.md5.md5_hh(d,a,b,c,x[i+0],11,-358537222);c=RDR.util.md5.md5_hh(c,d,a,b,x[i+3],16,-722521979);b=RDR.util.md5.md5_hh(b,c,d,a,x[i+6],23,76029189);a=RDR.util.md5.md5_hh(a,b,c,d,x[i+9],4,-640364487);d=RDR.util.md5.md5_hh(d,a,b,c,x[i+12],11,-421815835);c=RDR.util.md5.md5_hh(c,d,a,b,x[i+15],16,530742520);b=RDR.util.md5.md5_hh(b,c,d,a,x[i+2],23,-995338651);a=RDR.util.md5.md5_ii(a,b,c,d,x[i+0],6,-198630844);d=RDR.util.md5.md5_ii(d,a,b,c,x[i+7],10,1126891415);c=RDR.util.md5.md5_ii(c,d,a,b,x[i+14],15,-1416354905);b=RDR.util.md5.md5_ii(b,c,d,a,x[i+5],21,-57434055);a=RDR.util.md5.md5_ii(a,b,c,d,x[i+12],6,1700485571);d=RDR.util.md5.md5_ii(d,a,b,c,x[i+3],10,-1894986606);c=RDR.util.md5.md5_ii(c,d,a,b,x[i+10],15,-1051523);b=RDR.util.md5.md5_ii(b,c,d,a,x[i+1],21,-2054922799);a=RDR.util.md5.md5_ii(a,b,c,d,x[i+8],6,1873313359);d=RDR.util.md5.md5_ii(d,a,b,c,x[i+15],10,-30611744);c=RDR.util.md5.md5_ii(c,d,a,b,x[i+6],15,-1560198380);b=RDR.util.md5.md5_ii(b,c,d,a,x[i+13],21,1309151649);a=RDR.util.md5.md5_ii(a,b,c,d,x[i+4],6,-145523070);d=RDR.util.md5.md5_ii(d,a,b,c,x[i+11],10,-1120210379);c=RDR.util.md5.md5_ii(c,d,a,b,x[i+2],15,718787259);b=RDR.util.md5.md5_ii(b,c,d,a,x[i+9],21,-343485551);a=RDR.util.md5.safe_add(a,olda);b=RDR.util.md5.safe_add(b,oldb);c=RDR.util.md5.safe_add(c,oldc);d=RDR.util.md5.safe_add(d,oldd);} return Array(a,b,c,d);},
				md5_cmn: function(q,a,b,x,s,t){return RDR.util.md5.safe_add(RDR.util.md5.bit_rol(RDR.util.md5.safe_add(RDR.util.md5.safe_add(a,q),RDR.util.md5.safe_add(x,t)),s),b);},
				md5_ff: function(a,b,c,d,x,s,t){return RDR.util.md5.md5_cmn((b&c)|((~b)&d),a,b,x,s,t);},
				md5_gg: function(a,b,c,d,x,s,t){return RDR.util.md5.md5_cmn((b&d)|(c&(~d)),a,b,x,s,t);},
				md5_hh: function(a,b,c,d,x,s,t){return RDR.util.md5.md5_cmn(b^c^d,a,b,x,s,t);},
				md5_ii: function(a,b,c,d,x,s,t){return RDR.util.md5.md5_cmn(c^(b|(~d)),a,b,x,s,t);},
				safe_add: function(x,y){var lsw=(x&0xFFFF)+(y&0xFFFF);var msw=(x>>16)+(y>>16)+(lsw>>16);return(msw<<16)|(lsw&0xFFFF);},
				bit_rol: function(num,cnt){return(num<<cnt)|(num>>>(32-cnt));},
                //the line below is called out by jsLint because it uses Array() instead of [].  We can ignore, or I'm sure we could change it if we wanted to.
				str2binl: function(str){var bin=Array();var mask=(1<<RDR.util.md5.chrsz)-1;for(var i=0;i<str.length*RDR.util.md5.chrsz;i+=RDR.util.md5.chrsz){bin[i>>5]|=(str.charCodeAt(i/RDR.util.md5.chrsz)&mask)<<(i%32);}return bin;},
				binl2hex: function(binarray){var hex_tab=RDR.util.md5.hexcase?"0123456789ABCDEF":"0123456789abcdef";var str="";for(var i=0;i<binarray.length*4;i++){str+=hex_tab.charAt((binarray[i>>2]>>((i%4)*8+4))&0xF)+hex_tab.charAt((binarray[i>>2]>>((i%4)*8))&0xF);} return str;}
			},
            cleanPara: function(para) {
                // common function for cleaning the paragraph.  right now, it's removing spaces, tabs, newlines, and then double spaces
                if( para && typeof para == "string" && para !== "" ) { 
                    return para.replace(/[\n\r\t]+/gi,' ').replace().replace(/\s{2,}/g,' ');
                }
            },
            prettyNumber: function(int){
                var parsedInt = parseInt(int, 10); //convert if we can.
                if( isNaN(parsedInt) || parsedInt<0 ) return false;
                //else

                var abr = ["",'K','M','B','T'];
                for(var i=0; i<abr.length; i++){
                    var thisfactor = Math.pow(10, 3*i);
                    var nextfactor = Math.pow(10, 3*(i+1));
                    if( parsedInt < nextfactor ){
                        return ""+ Math.floor( parsedInt/thisfactor ) + abr[i];
                    }
                }
            },
            trimToLastWord: function(str){
                var danglerRE = /\w+$/.exec(str);
                if( !danglerRE){
                    return str;
                }
                else{
                    return str.slice(0, str.length-danglerRE[0].length);
                }
            },
            cssSuperImportant: function($domNode, cssDict){
                //RDR.util.cssSuperImportant:
                var inlineStyleStr = "";
                $.each(cssDict,function(key,val){
                    inlineStyleStr += (key+ ':' +val+ 'px !important; ');
                });
                $domNode.attr('style', inlineStyleStr);
                return $domNode; //return the node for the hell of it.
            },
            fixBodyBorderOffsetIssue: function(){
                //RDR.util.fixBodyBorderOffsetIssue:
                //a fix for the rare case where the body element has a border on it.
                //this is needed because jQuery's offset doesn't account for that.
                //suposedly it also doesn't account for margin or padding on the body, but a fix for those doesnt' seem to be needed.

                //todo: this works fine for now - makes the indicators look right on hypervocal,
                    //but there is still a little functionality outside the sandbox that should be incorporated into this fix.
                    //for example - the stay-in-window function doesn't compensate for the body border, but it doens't matter for a small border anyway.

                var $body = $('body'),
                    borderTop = parseInt( $body.css('border-top-width'), 10 ),
                    borderLeft = parseInt( $body.css('border-left-width'), 10 ),
                    $sandbox = $('#rdr_sandbox');
                
                if( !borderTop && !borderLeft ) return;
                //else

                RDR.util.cssSuperImportant($sandbox, {
                    top: borderTop,
                    left: borderLeft
                });

            }
        },
		session: {
            alertBar: {
                make: function( whichAlert, data) {
                    // RDR.session.alertBar.make
                    //whichAlert to tell us if it's the educate user bar, or the sharedLink bar
                    //data if we want it, not using it now... - expects: 
                    /*
                    data = {
                        location: "2:16\0542:90{ed6a0863}",
                        container_hash: 'c9676b4da28e1e005a1b27676e8b2847'
                    }
                    */

                    //todo: finish making these changes here:, but i didnt' want to do it before the DC demo.
                    var $msg1, $msg2, $pinIcon;
                    if( whichAlert == "educateUser"){
                        $msg1 = $('<h1>Rate &amp; discuss <span>anything</span> on this page!</h1>');
                        $msg2 = $('<div>Just select text or slide your mouse over an image or video, and look for the <span>pin</span> icon.</div>');
                    }
                    if( whichAlert == "fromShareLink"){
                        $msg1 = $('<h1>Shared with <span>ReadrBoard</span></h1>');

                        if ( $('img.rdr-'+data.container_hash).length == 1 ) {
                            $msg2 = $('<strong style="display:block;">' + data.reaction + ':</strong> <img src="' + data.content + '" style="max-width:100px !important;max-height:70px !important;margin:5px 0 !important;display:block !important;" /> <strong style="display:block;"><a class="rdr_showSelection" href="javascript:void(0);">See It</a></strong>');
                        } else {
                            //put a better message here
                            $msg2 = $('<strong>' + data.reaction + ':</strong> <em>' + data.content.substr(0,140) + '...</em> <strong><a class="rdr_showSelection" href="javascript:void(0);">See It</a></strong>');
                        }
                        $msg2.find('a.rdr_showSelection').click( function() {
                            //show the alertBar sliding closed for just a second before scrolling down..
                            // RDR.session.alertBar.close();
                            setTimeout(function(){
                                RDR.session.revealSharedContent(data);
                            }, 200);
                        });
                    }
                    if( whichAlert == "showMorePins"){
                        //put a better message here
                        $msg1 = $('<h1>See <span>more reactions</span> on this page.</h1>');
                        $msg2 = $('<div>Readers like you are reacting to, sharing, and discussing content on this page.  <a class="rdr_show_more_pins" href="javascript:void(0);">Click here</a> to see what they\'re saying.<br><br><strong>Tip:</strong> Look for the <img src="'+RDR_staticUrl+'widget/images/blank.png" class="no-rdr rdr_pin" /> icons.</div>');

                        $msg2.find('a.rdr_show_more_pins').click( function() {
                            RDR.actions.summaries.showLessPopularIndicators();
                            $(this).closest('div.rdr_alert_box').find('div.rdr_alert_box_x').click();
                        });
                    }
                    $pinIcon = $('<img src="'+RDR_staticUrl+'widget/images/blank.png" class="no-rdr rdr_pin" />');

                    var $alertContent = $('<div class="rdr_alert_box rdr rdr_brtl rdr_brtr rdr_' + whichAlert + '" />');

                    $alertContent.append(
                        $('<div class="rdr_alert_box_1 rdr_brtl rdr_brtr" />').append($pinIcon).append($msg1),
                        $('<div class="rdr_alert_box_2" />').append($msg2),
                        '<div class="rdr rdr_alert_box_x">x</div>'
                    );
                                            
                    $('#rdr_sandbox').append( $alertContent );
                    $('div.rdr_alert_box.rdr_'+whichAlert).find('.rdr_alert_box_x').click( function() {
                        RDR.session.alertBar.close( whichAlert );
                    });

                    // TODO put this back in 
                $('div.rdr_alert_box.rdr_'+whichAlert).animate({bottom:0},1000);

                    // OLD -- positioning/animation from when this was a bar
                    // RDR.group.educateUserLocation = "top";
                    // if ( RDR.group.educateUserLocation && RDR.group.educateUserLocation=="bottom" ) {
                    //     $alertContent.css('top','auto');
                    //     $alertContent.css('bottom','-40px');
                    //     $('#rdr_alert_box').animate({bottom:0});
                    // } else {
                    //     var bodyPaddingTop = parseInt( $('body').css('padding-top') );
                    //     $('body').animate({ paddingTop: (bodyPaddingTop+35)+"px" });
                    //     $('#rdr_alert_box').animate({top:0});
                    // }
                    // END OLD
                },
                close: function( whichAlert ) {
                    $('div.rdr_alert_box.rdr_'+whichAlert).remove();
                    // set a cookie in the iframe saying not to show this anymore
                    $.postMessage(
                        "close "+whichAlert,
                        RDR_baseUrl + "/xdm_status/",
                        window.frames['rdr-xdm-hidden']
                    );
                }
            },
            revealSharedContent: function(data){
                var hash = data.container_hash,
                    $container = $('.rdr-'+hash);
                
                var kind = $container.data('kind');
                if(kind == 'img' || kind == 'media'){
                    $container.addClass('rdr_shared');

                    var $containerTracker = $('#rdr_container_tracker_'+hash),
                        $mediaBorderWrap = $containerTracker.find('.rdr_media_border_wrap');
                    //make sure it's still positioned right, though page load should have set it.
                    //todo: reconsider this method of liberally updating everything
                    RDR.actions.indicators.utils.updateContainerTracker(hash);
                    $mediaBorderWrap.show();

                    //we don't need this here, becuase this is already bound to the document
                    
                    $(document).bind('click.rdr', function(event) {
                        $mediaBorderWrap.hide();
                        //remove the binding after it's been called.
                        $(document).unbind('click.rdr', arguments.callee);
                    });
                    $(document).bind('keyup.rdr', function(event) {
                        //todo: merge all esc key events (use an array of functions that we can just dequeue?)
                        if (event.keyCode == '27') { //esc
                            $mediaBorderWrap.hide();
                            //remove the binding after it's been called.
                            $(document).unbind('keyup.rdr', arguments.callee);
                        }
                    });
                }
                
                if ( data.location && data.location != "None" ) {
                    
                
                    var serialRange = data.location;

                    var selogStack = $().selog('stack'); //just fyi, not using it... Will be an empty stack on page load.

                    /*
                    //no need to check for existing hilites right now
                    var oldSelState = selState || null;
                    if (oldSelState){
                        $().selog('hilite',oldSelState.idx, 'off')
                    }
                    */

                    var selState = $container.selog('save', {'serialRange':serialRange} );
                    //[cleanlogz](selState)
                    $().selog('hilite', selState, 'on');

                    /**********/
                    //todo: quick fix!  ... later attach it to a rindow to do it right.
                    //for now at least, make it so we can clear this easily.
                    $(document).bind('click.rdr', function(event) {
                        $().selog('hilite', selState, 'off');
                        $(document).unbind('click.rdr', arguments.callee);
                    });
                   //bind an escape keypress to clear it.
                    //todo: for a real public API, this should be an option, or passed in function or something
                    $(document).bind('keyup.rdr', function(event) {
                        //todo: merge all esc key events (use an array of functions that we can just dequeue?)
                        if (event.keyCode == '27') { //esc
                            $().selog('hilite', selState, 'off');
                            //remove the binding after it's been called.
                            $(document).unbind('keyup.rdr', arguments.callee);
                        }
                    });
                    /**********/ //end quick fix
                }

                var targetOffset = $container.offset().top,
                windowPadding = 350,
                scrollTarget = targetOffset-windowPadding || 0;

                $('html,body').animate({scrollTop: scrollTarget}, 1000);
            },
            getSharedLinkInfo: function( data ){
                //some condition
                    
                //TODO: sample data here, fill with info from cookie
                // var data = {
                //     location: "2:10\0542:32",
                //     container_hash: "c9676b4da28e1e005a1b27676e8b2847"
                // }

                //note: I turned off the checksum in rangy, so the locations will be mising the {####} part.
                // we don't need the checksum, cause we're already doing that.

                //note: the "\054" is actually the octal for a comma.  The back end is passing it back that way. It's working fine though.
                //, so it seems that "2:10\0542:32" == "2:10,2:32"
                RDR.session.alertBar.make('fromShareLink', data);
                return true; //could return something more useful if we need it.
            },
            getUser: function(args, callback) {
                if ( callback && args ) {
                    RDR.session.receiveMessage( args, callback );
                } else if ( callback ) {
                    RDR.session.receiveMessage( false, callback );
                }
                $.postMessage(
                    "getUser",
                    RDR_baseUrl + "/xdm_status/",
                    window.frames['rdr-xdm-hidden']
                );
            },
            handleGetUserFail: function(args, callback) {
                var response = args.response;
                switch ( response.message ) {
                    case "Error getting user!":
                        // kill the user object and cookie
                        RDR.session.killUser();

                        // TODO tell the user something failed and ask them to try again
                        // pass callback into the login panel
                    break;

                    case "Temporary user interaction limit reached":
                        // TODO: something.  anything at all.
                        RDR.session.showLoginPanel( args, callback );
                    break;
                    case "Container specified does not exist":
                        //[cleanlogz]('caught error: Container specified does not exist and implementing temp fix');
                        //[cleanlogz](response);
                    break;

                    case "Token was invalid":
                    case "Facebook token expired":  // call fb login
                    case "FB graph error - token invalid":  // call fb login
                    case "Social Auth does not exist for user": // call fb login
                    case "Data to create token is missing": // call fb login
                        // the token is out of sync.  could be a mistake or a hack.
                        RDR.session.receiveMessage( args, callback );
                        // RDR.session.showLoginPanel( args, callback );
                        $.postMessage(
                            "reauthUser",
                            // "killUser",
                            RDR_baseUrl + "/xdm_status/",
                            window.frames['rdr-xdm-hidden']
                        );

                        // // init a new receiveMessage handler to fire this callback if it's successful
                        // //[cleanlogz]('starting receivemessage')
                    break;
                }
            },
			createXDMframe: function() {

                RDR.session.receiveMessage();

                var iframeUrl = RDR_baseUrl + "/xdm_status/",
                parentUrl = window.location.href,
                parentHost = window.location.protocol + "//" + window.location.host,
                $xdmIframe = $('<iframe id="rdr-xdm-hidden" name="rdr-xdm-hidden" src="' + iframeUrl + '?parentUrl=' + parentUrl + '&parentHost=' + parentHost + '&group_id='+RDR.group.id+'&group_name='+encodeURIComponent(RDR.group.name)+'&cachebust='+RDR.cachebuster+'" width="1" height="1" style="position:absolute;top:-1000px;left:-1000px;" />'
                );
                $('#rdr_sandbox').append( $xdmIframe );


				// this is the postMessage receiver for ALL messages posted.
                // TODO: put this elsewhere so it's more logically placed and easier to find??
			},
            receiveMessage: function(args, callbackFunction) {
                //args is passed through this function into the callback as a parameter.
                //The only side effect is that it adds a user property to args ( args[user] ).

                $.receiveMessage(
                    function(e){
                        var message = $.evalJSON( e.data );

                        if ( message.status ) {
                            if ( message.status == "returning_user" || message.status == "got_temp_user" ) {

                                // currently, we don't care HERE what user type it is.  we just need a user ID and token to finish the action
                                // the response of the action itself (say, tagging) will tell us if we need to message the user about temp, log in, etc

                                for ( var i in message.data ) {
                                    RDR.user[ i ] = ( !isNaN( message.data[i] ) ) ? parseInt(message.data[i],10):message.data[i];
                                }

                                if ( callbackFunction && args ) {
                                    args.user = RDR.user;
                                    callbackFunction(args);
                                    callbackFunction = null;
                                }
                                else if ( callbackFunction ) {
                                    callbackFunction();
                                    callbackFunction = null;
                                }
                            } else if ( message.status == "fb_user_needs_to_login" ) {
                                if ( callbackFunction && args ) {
                                    RDR.session.showLoginPanel( args, callbackFunction );
                                } else {
                                    RDR.session.showLoginPanel( args );
                                }
                            } else if ( message.status == "already had user" ) {
                                // todo: when is this used?
                                $('#rdr_loginPanel div.rdr_body').html( '<div style="padding: 5px 0; margin:0 8px; border-top:1px solid #ccc;"><strong>Welcome!</strong> You\'re logged in.</div>' );
                            } else if ( message.status == "educate user" ) {
                                RDR.session.alertBar.make('educateUser');
                            } else if ( message.status.indexOf('sharedLink') != -1 ) {
                                var sharedLink = message.status.split('|');
                                if ( sharedLink[5] ) {
                                    RDR.session.referring_int_id = parseInt( sharedLink[5], 10 );
                                }
                                RDR.session.getSharedLinkInfo( { container_hash:sharedLink[1], location:sharedLink[2], reaction:sharedLink[3], content:sharedLink[4] } );
                            }
                        }
                    },
                    RDR_baseUrl
                );
            },
			login: function() {},
            checkForMaxInteractions: function(args, callback){
                //later get rid of args if we don't need it for showLoginPanel - if we can use rindow instead.
                
                if ( RDR.user.num_interactions && RDR.user.img_url !== "" ) {
                    if ( RDR.user.num_interactions < RDR.group.temp_interact ) {
                        
                    // }
                // }


                // var num_interactions = args.num_interactions;
                
                // if ( num_interactions ) {
                    // if ( num_interactions < RDR.group.temp_interact ){

                        // var usrMsgArgs = {      
                        //     msgType: "tempUser",
                        //     rindow:args.rindow,
                        //     num_interactions: num_interactions
                        // };

                        // RDR.session.rindowUserMessage.show( usrMsgArgs );
                        return false;
                    }
                }
                return true;
            },
			showLoginPanel: function(args, callback) {
             // RDR.session.showLoginPanel

                $('.rdr_rewritable').removeClass('rdr_rewritable');
                
                if ( $('#rdr_loginPanel').length < 1 ) {
                    // $('#rdr_loginPanel').remove();
                    //todo: weird, why did commenting this line out not do anything?...look into it
                    //porter says: the action bar used to just animate larger and get populated as a window
                    //$('div.rdr.rdr_actionbar').removeClass('rdr_actionbar').addClass('rdr_window').addClass('rdr_rewritable');
                    
                    var coords;

                    if ( args && args.rindow ) {
                        var caller = args.rindow;
                        coords = caller.offset();
                        coords.left = coords.left ? (coords.left-34) : 100;
                        coords.top = coords.top ? (coords.top-25) : 100;
                    } else {
                        coords = [];
                        coords.left = ( $(window).width() / 2 ) - 200;
                        coords.top =  ( $(window).height() / 2 ) - 100 ;
                        coords.top = 150;
                    }


                    var rindow = RDR.rindow.draw({
                        coords:coords,
                        id: "rdr_loginPanel",
                        pnlWidth:360,
                        pnls:1,
                        height:225,
                        ignoreWindowEdges:"bt"
                    });

                    // store the arguments and callback function that were in progress when this Login panel was called
                    if ( args ) rindow.data( 'args', args );
                    if ( callback ) rindow.data( 'callback', callback );

                    // create the iframe containing the login panel
                    var $loginHtml = $('<div class="rdr_login" />'),
                    iframeUrl = RDR_baseUrl + "/fblogin/",
                    parentUrl = window.location.href,
                    parentHost = window.location.protocol + "//" + window.location.host;
                    var h1_text = ( args && args.response && args.response.message.indexOf('Temporary user interaction') != -1 ) ? "Log In to Continue Reacting":"Log In to ReadrBoard";
                    $loginHtml.append( '<h1>'+h1_text+'</h1><div class="rdr_body" />');
                    $loginHtml.find('div.rdr_body').append( '<iframe id="rdr-xdm-login" src="' + iframeUrl + '?parentUrl=' + parentUrl + '&parentHost=' + parentHost + '&group_id='+RDR.group.id+'&group_name='+RDR.group.name+'&cachebust='+RDR.cachebuster+'" width="360" height="190" frameborder="0" style="overflow:hidden;" />' );

                    rindow.find('div.rdr_contentSpace').append( $loginHtml );
                }
			},
			killUser: function() {
                RDR.user = {};
                $.postMessage(
                    "killUser",
                    RDR_baseUrl + "/xdm_status/",
                    window.frames['rdr-xdm-hidden']
                );
            },
            rindowUserMessage: {
                show:  function(args) {
                    //RDR.session.rindowUserMessage.show:
                    var $rindow = args.rindow;
                    var interactionInfo = args.interactionInfo;

                    if ( $rindow ) {
                    
                        var msgType = args.msgType || null, //defaults to tempUser
                            userMsg = null,
                            actionPastTense;

                        var extraHeight = 45,  //$rindowMsgDiv.height(),
                            bodyWrapHeight = 10,
                            rindowHeight = $rindow.height(),
                            durr = 300;

                        var $bodyWraps = $rindow.find('.rdr_body_wrap');
                        var $rindowMsgDiv = $rindow.find('div.rdr_rindow_message'),
                            $rindowMsgDivInnerwrap = $rindow.find('.rdr_rindow_message_innerwrap'),
                            $otherTagsWrap = $('div.rdr_otherTagsWrap'),
                            $tmpUserMsg = $rindow.find('.rdr_rindow_message_tempUserMsg');
                    
                        $rindowMsgDiv.show();

                        switch (msgType) {

                            case "tempUser":
                                //for now, just ignore this
                                var num_interactions_left = RDR.group.temp_interact - parseInt( args.num_interactions, 10 ),
                                    $loginLink = $('<a href="javascript:void(0);">Connect with Facebook</a>.');
                                
                                $loginLink.click( function() {
                                    RDR.session.showLoginPanel( args );
                                });
                                
                                var tmpUserMsg = 'You can react or comment <strong>' + num_interactions_left + ' more times</strong> before you must ';
                                
                                $tmpUserMsg.empty().append('<span>'+tmpUserMsg+'</span>');
                                $tmpUserMsg.append($loginLink);
                                
                                break;
                                
                            case "existingInteraction":
                                userMsg = "You have already given that reaction for this.";
                                break;
                            
                            case "interactionSuccess":
    
                                if(interactionInfo.remove){
                                    userMsg = "The "+interactionInfo.type+" <em>"+interactionInfo.body+"</em><br />has been removed." ;
                                    $tmpUserMsg.empty();
                                }else{
                                    
                                    userMsg = (interactionInfo.type == 'tag') ?
                                        "You have tagged this <em>"+interactionInfo.body+"</em>." :
                                    (interactionInfo.type == 'bookmark') ?
                                        "You have bookmarked this <em>"+interactionInfo.body+"</em>." :
                                    (interactionInfo.type == 'comment') ?
                                        "You have left your comment." :
                                        ""; //this default shouldn't happen
                                    userMsg += " See your "+interactionInfo.type+"s on this page, and at <strong><a href='"+RDR_baseUrl+"' target='_blank'>readrboard.com</a></strong>";
                                }

                                var click_args = args;
                                if ( $rindow.find('div.rdr_rindow_message_tempUserMsg').text().length > 0 ) {
                                    $inlineTempMsg = $('<div />');
                                    $inlineTempMsg.html( '<h4 style="font-size:17px;">You can react '+ $rindow.find('div.rdr_rindow_message_tempUserMsg strong').text() +'.</h4><br/><p><a style="font-weight:bold;color:#008be4;" href="javascript:void(0);">Connect with Facebook</a> to react as much as you want &amp; show other readers here what you think.</p><br/><p>Plus, you can share and comment in-line!</p><br/><a href="javascript:void(0);"><img src="'+RDR_staticUrl+'widget/images/fb-login_to_readrboard.png" alt="Connect with Facebook" /></a>');
                                    $inlineTempMsg.find('a').click( function() {
                                        RDR.session.showLoginPanel( click_args );
                                    });
                                    
                                    $rindow.find('div.rdr_shareBox').html( $inlineTempMsg );
                                    $rindow.find('div.rdr_commentBox').hide();
                                }

                                break;
                        
                        }   
                        
                        if(userMsg){
                            $rindowMsgDiv.find('span.rdr_userMsg').html( userMsg );
                        }

                        $rindowMsgDivInnerwrap.hide();
                        $rindow.queue('userMessage', function(){
                            if( $rindowMsgDiv.height() > 0 ){
                                //already expanded
                                $rindowMsgDivInnerwrap.fadeIn(500);
                                $(this).dequeue('userMessage');
                            }else{
                                //expand it and expand the window with it.
                                //I know this simo animations together are a bit much - this should be redesigned
                                $rindow.animate({ height: rindowHeight+extraHeight }, durr);
                                $otherTagsWrap.animate({ bottom:0 }, durr);
                                $bodyWraps.animate({
                                    bottom: extraHeight
                                }, durr);
                                $rindowMsgDiv.animate({ height:extraHeight },durr, function(){
                                    $rindowMsgDivInnerwrap.fadeIn(500);
                                    $(this).dequeue('userMessage');
                                });
                            }
                        });
                        $rindow.dequeue('userMessage');
                    }
                },
                hide: function($rindow) {
                    //RDR.session.rindowUserMessage.hide:
                    if ( $rindow ) {
                        
                        var $rindowMsgDiv = $('div.rdr_rindow_message');
                            $otherTagsWrap = $('div.rdr_otherTagsWrap');

                        var $bodyWraps = $rindow.find('.rdr_body_wrap');
                            //else

                            //todo: make this a better solution.  The simultaneous animations might not be ideal.
                            var extraHeight = $rindowMsgDiv.height(),  //$rindowMsgDiv.height(),
                                rindowHeight = $rindow.height(),
                                durr = 300,
                                bodyWrapHeight = 10;

                            //no need to use queue like this here, but this is how we can use it when we need to
                            //expand the rindow first and then slide down the msgBar 
                            $rindow.queue('userMessage', function(){
                                $rindow.animate({ height: rindowHeight-extraHeight }, durr);
                                $otherTagsWrap.animate({ bottom: 0-bodyWrapHeight }, durr);
                                $bodyWraps.animate({
                                    bottom: bodyWrapHeight
                                }, durr);
                                $rindowMsgDiv.animate({ height:0 }, durr, function(){
                                    $rindowMsgDiv.hide();
                                    $(this).dequeue('userMessage');
                                });
                            });
                            $rindow.dequeue('userMessage');
                    }
                }
            }
		},
        actions: {
            //RDR.actions:
            aboutReadrBoard: function() {
            },
            init: function(){
                var that = this;
                $RDR = $(RDR);
                $RDR.queue('initAjax', function(next){
                    that.initGroupData(RDR.group.short_name);
                    //next fired on ajax success
                });
                $RDR.queue('initAjax', function(next){
                    that.initPageData();
                    //next fired on ajax success
                });
                $RDR.queue('initAjax', function(next){
                   that.initEnvironment();
                   //next fired on ajax success
                });
				$RDR.queue('initAjax', function(next){
                   // this will check for FB login status, too, and set user data
                   RDR.session.createXDMframe();
                   //next fired on ajax success
                });
                //start the dequeue chain
                $RDR.dequeue('initAjax');
            },
            initGroupData: function(groupShortName){
                // request the RBGroup Data

                $.ajax({
                    url: RDR_baseUrl+"/api/settings/",
                    type: "get",
                    contentType: "application/json",
                    dataType: "jsonp",
                    data: {
                        host_name : window.location.hostname
                    },
                    success: function(response, textStatus, XHR) {

                        var group_settings = response.data;
                        
                        RDR.group = $.extend({}, RDR.group.defaults, group_settings );

                        $(RDR.group.no_readr).each( function() { 
                            $(this).addClass('no-rdr'); 
                            $(this).find('img').addClass('no-rdr');
                        });

                        // it's not a CSS URL, but rather custom CSS rules.  We should change the name in the model...
                        // this embeds custom CSS.
                        if ( RDR.group.custom_css !== "" ) {
                            $('head').append( $('<style type="text/css">' + RDR.group.custom_css + '</style>') );
                        }
                        
                        $RDR.dequeue('initAjax');

                    },
                    error: function(response) {
                        //for now, ignore error and carry on with mockup
                    }
                });
            },
            initPageData: function(){
                //This should be the only thing appended to the host page's body.  Append everything else to this to keep things clean.
                var $rdrSandbox = $('<div id="rdr_sandbox" class="rdr no-rdr"/>').appendTo('body');

                // RDR.session.educateUser(); //this function has changed now
               //? do we want to model this here to be symetrical with user and group data?

                // TODO flesh out Porter's code below and incorporate it into the queue

                // make one call for the page unless post_selector, post_href_selector, summary_widget_selector are all set to not-an-empty-string AND are present on page

                // defaults for just one page / main page
                
                /*
                var urls = [];
                var canonicals = [];
                var titles = [];
                var key = 0; // we use this to know which container to point to in the success call
                */
                var pagesArr = [],
                    urlsArr = [],
                    thisPage,
                    key,
                    url,
                    canonical_url,
                    title;

                // if multiple posts, add additional "pages"
                if ( 
                    ( RDR.group.post_selector !== "" && RDR.group.post_href_selector !== "" && RDR.group.summary_widget_selector !== "" ) &&
                    ( $(RDR.group.post_selector).length > 0 ) 
                   ) {
                        $(RDR.group.post_selector).each( function(){
                            var $post = $(this);
                            var $post_href = $post.find(RDR.group.post_href_selector);
                            var $summary_widget = $post.find(RDR.group.summary_widget_selector);
                            
                            if ( $post_href.attr('href') ) {
                                url = $post_href.attr('href');
                                urlsArr.push(url);

                                thisPage = {
                                    group_id: parseInt(RDR.group.id, 10),
                                    url: url,
                                    canonical_url: 'same',
                                    title: $post_href.text()
                                };
                                pagesArr.push(thisPage);
                                key = pagesArr.length-1;

                                if ( !$post.hasClass('rdr-page-container') ) {
                                    $post.addClass( 'rdr-page-container' ).addClass('rdr-page-key-'+key);
                                }
                                $summary_widget.addClass('rdr-page-widget-key-'+key);
                            }
                        });
                }

                // defaults for just one page / main page.  we want this last, so that the larger page call happens last, and nodes are associated with posts first.
                var pageUrl = window.location.href;
                if ( $.inArray(pageUrl, urlsArr) == -1 || urlsArr.length == 0 ) {
                    canonical_url = $('link[rel="canonical"]').length > 0 ?
                                $('link[rel="canonical"]').attr('href') : pageUrl;
                    title = $('meta[property="og:title"]').attr('content') ? 
                            $('meta[property="og:title"]').attr('content') : 
                                $('title').text() ? 
                                $('title').text() : "";

                    thisPage = {
                        group_id: parseInt(RDR.group.id, 10),
                        url: pageUrl,
                        canonical_url: (pageUrl == canonical_url) ? "same" : canonical_url,
                        title: title
                    };
    
                    pagesArr.push(thisPage);
                    key = pagesArr.length-1;

                    if ( !$( 'body' ).hasClass('rdr-page-container') ) {
                        $( 'body' ).addClass( 'rdr-page-container' ).addClass('rdr-page-key-'+key);
                        
                        if ( $('#rdr-page-summary').length == 1 ) {
                            $('#rdr-page-summary').addClass('rdr-page-widget-key-'+key);
                        } else {
                            var $widget_key_last = $( 'body' ).find(RDR.group.summary_widget_selector).eq(0);
                            // this seems unnecessary, but, on a blogroll, we don't want to have two widget keys on the first post's summary box
                            if ( !$widget_key_last.hasClass('rdr-page-widget-key-0') ) {
                                $widget_key_last.addClass('rdr-page-widget-key-'+key);
                            }
                        }
                    }
                }

                var sendData = {
                    pages: pagesArr
                };
                 
                //TODO: if get request is too long, handle the error (it'd be b/c the URL of the current page is too long)
				//might not want to send canonical, or, send it separately if/only if it's different than URL
				$.ajax({
                    url: RDR_baseUrl+"/api/page/",
                    type: "get",
                    contentType: "application/json",
                    dataType: "jsonp",
                    data: { json: $.toJSON(sendData) },
					success: function(response) {
                        $.each( response.data, function(key,page){
                            //todo: it seems like we should use the page.id as the unique identifier instead of introducting 'key' which is just a counter
                            page.key = key;
                            RDR.actions.pages.save(page.id, page);
                            RDR.actions.pages.initPageContainers(page.id);
                        });

                        $RDR.dequeue('initAjax');
                    },
                    error: function(response) {
                        //for now, ignore error and carry on with mockup
                    }
				});

            },
            initEnvironment: function(){
                
                //This should be the only thing appended to the host page's body.  Append everything else to this to keep things clean.
                var $rdrSandbox = $('div#rdr_sandbox').appendTo('body');
                RDR.util.fixBodyBorderOffsetIssue();

                //div to hold indicatorBodies for media (images and video)
                $('<div id="rdr_container_tracker_wrap" />').appendTo($rdrSandbox);

                //div to hold indicators, filled with insertContainerIcon(), and then shown.
                $('<div id="rdr_indicator_details_wrapper" />').appendTo($rdrSandbox);


                $(document).bind('mouseup.rdr', function(e){
                    //temp fix for bug where a click that clears a selection still picks up the selected text:
                    //Todo: This should work in the future as well, but I want to look into it further.
                    setTimeout(function(){
                        RDR.actions.startSelect(e);
                    }, 1 ); 
                    //even 0 works, so I'm not worried about 1 being too low.
                    //besides, the fail scenerio here is very minor - just that the actionbar hangs out till you click again.
                });

                $(document).bind('click.rdr',function(event) {
                    var $mouse_target = $(event.target);                                

                    if ( !$mouse_target.parents().hasClass('rdr')) {
                        RDR.rindow.closeAll();
                    }

                });

                //bind an escape keypress to clear it.
                $(document).bind('keyup.rdr', function(event) {
                    if (event.keyCode == '27') { //esc
                        RDR.rindow.closeAll();
                        RDR.actionbar.closeAll();
                    }
                });

                $(document).bind('scrollstop', function() {
                    if ( $(window).scrollTop() > 150 && $('#rdr_sandbox') && !$('#rdr_sandbox').data('showingAllIndicator') ) {
                        $('#rdr_sandbox').data('showingAllIndicator', true);
                        if ( RDR.text_container_popularity && RDR.text_container_popularity.length > RDR.group.initial_pin_limit ) {
                            // show the alert bar, which has a link to call RDR.actions.summaries.showLessPopularIndicators
                            RDR.session.alertBar.make('showMorePins');
                            $(document).unbind('scrollstop.rdr');
                        }
                    }
                });

                // todo: this is a pretty wide hackey net - rethink later.
                $('embed, video, object, iframe, img').live('mouseenter', function(){
                    var $this = $(this);
                    var hasBeenHashed = $this.hasClass('rdr-hashed'),
                        isBlacklisted = $this.closest('.rdr, .no-rdr').length;

                    if(!hasBeenHashed && !isBlacklisted){
                        $this.addClass('rdr_live_hover');
                        var hash = RDR.actions.hashNodes( $(this) );
                        if(hash){
                            RDR.actions.sendHashes( hash, function(){
                                if( $this.hasClass('rdr_live_hover') ){
                                    $this.mouseenter();
                                }
                            });
                        }
                    } else {
                        $this.addClass('rdr_live_hover');
                    }
                }).live('mouseleave', function(){
                    $(this).removeClass('rdr_live_hover');
                });

                RDR.actions.slideshows.setup();
                
                //hashNodes without any arguments will fetch the default set from the server.
                // var hashes = this.hashNodes();

                // if(hashes){
                //     RDR.actions.sendHashes( hashes );    
                // }
                
				$RDR.dequeue('initAjax');
            },
            hashNodes: function( $node, nomedia ) {
                //RDR.actions.hashNodes:
                
                // [porter]: needs a node or nodes
                if ( typeof $node==="undefined" ) return;

                //todo: consider how to do this whitelist, initialset stuff right
                var $allNodes = $(),
                nodeGroups = [
                    {
                        kind: 'media',
                        $group: null,
                        whiteList: RDR.group.media_selector,
                        filterParam: 'embed, video, object, iframe',
                        setupFunc: function(){
                            var body = this.src;
                            $(this).data({
                                'body':body
                            });
                        }
                    },
                    {
                        kind: 'img',
                        $group: null,
                        whiteList: RDR.group.img_selector,
                        filterParam: 'img',
                        setupFunc: function(){
                            //var body = $(this).attr('src');
                            var body = this.src;
                            $(this).data({
                                'body':body
                            });
                        }
                    },
                    { 
                        kind: 'text',
                        $group: null,
                        whiteList: RDR.group.anno_whitelist,
                        filterParam: function(idx, node){
                            //todo: reconsider using this - it's not super efficient to grab the text just to verify it's a node that has text.
                            // - Prob fine though since we're only testing hashes we pass in manually.
                            //proves it has text (so ellminates images for example.) //the !! is just a convention indicating it's used as a bool.
                            if ( $(node).text() != $(node).parent().text() ) {
                                return !!$(node).text();
                            }
                        },
                        setupFunc: function(){
                            // get the node's text and smash case
                            // TODO: <br> tags and block-level tags can screw up words.  ex:
                            // hello<br>how are you?   here becomes
                            // hellohow are you?    <-- no space where the <br> was.  bad.
                            var node_text = $(this).html().replace(/< *br *\/?>/gi, '\n');
                            var body = $.trim( $( "<div>" + node_text + "</div>" ).text().toLowerCase() );
                            body = RDR.util.cleanPara( body );
                            $(this).data('body',body);
                        }
                        
                    }
                ];

                //go through the groups in order and pick out valid nodes of that type. Default to text if it's valid for that.
                $.each( nodeGroups, function( idx, group ){

                    // take the $node passed in, add it to group via filters
                    var $group = $node.filter( group.filterParam );

                    // add vaild descendants of the $node
                    $group = $group.add( $node.find( group.whiteList ) );

                    //take out prev categorized nodes (text is last, so we default to that)
                    $group = $group.not($allNodes);

                    //filter out blacklisted stuff
                    $group = $group.not('.rdr-hashed, .no-rdr');
                    group.$nodes = $group;

                    //setup the group as needed
                    $group.each( function(){
                        group.setupFunc.apply(this);
                        $(this).data('kind', group.kind);
                    });
                    $allNodes = $allNodes.add($group);

                    //flag exceptions for inline_indicators
                    var $inlineMediaSet = $allNodes.filter(RDR.group.inline_selector);

                    $inlineMediaSet.each(function(){
                        $(this).data('inlineIndicator', true);
                    });

                });


                // TODO when would this do anything?
                // (eric) wow - I really can't figure out why this is here - I guess it's checking to see if everything is blank, but that's weird.
                            // I guess we can take it out if you didn't want it here either.
                if( !$allNodes.data('body') ) return false;
                //else

                var hashList = [];
                $allNodes.each(function(){
                    var $this = $(this);
                    var body = $this.data('body'),
                    kind = $this.data('kind'),
                    HTMLkind = $this.get(0).nodeName.toLowerCase();

                    // if ( nomedia && ( 
                        // HTMLkind == "img" || HTMLkind == "embed" || HTMLkind == "iframe" || HTMLkind == "object" || HTMLkind == "video" ) ) {

                    var hashText = "rdr-"+kind+"-"+body; //examples: "rdr-img-http://dailycandy.com/images/dailycandy-header-home-garden.png" || "rdr-p-ohshit this is some crazy text up in this paragraph"
                    var hash = RDR.util.md5.hex_md5( hashText );

                    // add an object with the text and hash to the RDR.containers dictionary
                    //todo: consider putting this info directly onto the DOM node data object
                    RDR.actions.containers.save({
                        body:body,
                        kind:kind,
                        hash:hash,
                        HTMLkind:HTMLkind,
                        $this: $this
                    });

                    // add a CSS class to the node that will look something like "rdr-207c611a9f947ef779501580c7349d62"
                    // this makes it easy to find on the page later
                    
                    //don't do this here - do it on success of callback from server
                    // [ porter ]  DO do it here, need it for sendHashes, which needs to know what page it is on, and this is used to find out.
                    $this.addClass( 'rdr-' + hash );//.addClass('rdr-hashed');

                    summary = RDR.actions.summaries.init(hash);
                    RDR.actions.summaries.save(summary);

                    
                    var page_id = RDR.util.getPageProperty('id', hash );
                    if ( !hashList[ page_id ] ) hashList[ page_id ] = [];
                    
                    hashList[ page_id ].push(hash);
                    $this.data('hash', hash); //todo: consolodate this with the RDR.containers object.  We only need one or the other.
                    
                });

                RDR.actions.containers.setup(hashList);
                return hashList;
            },
            sendHashes: function( hashes, onSuccessCallback ) {
                // RDR.actions.sendHashes

                // if ( hashes.length == 1 ) {
                //     var hash = hashes[0];
                //     var page_id = RDR.util.getPageProperty( 'id', hash );
                //     hashes = [];
                //     hashes[ page_id ] = hash;
                // }

                // if( !hashes || !hashes.length ){ 
                //     hashes = getAllHashes();
                // }
        
                // function getAllHashes(){
                //     var hashes = [];
                //     for (var hashKey in RDR.containers ) {
                //         if ( RDR.containers[hashkey].kind != "page" ) hashes.push( hashKey );
                //     }
                //     return hashes;
                // }

                var page_id, sendable_hashes, $hashable_node, sendData;

                for (var i in hashes) {
                    page_id = i;
                    sendable_hashes = hashes[i];
                
                    if ( !page_id || typeof sendable_hashes != "object" ) {
                        break;
                    }
                    
                    for ( var j in sendable_hashes ) {
                        if ( typeof sendable_hashes[j] == "string" ) {
                            if ( sendable_hashes[j] ) {
                                $hashable_node = $('.rdr-' + sendable_hashes[j]);
                                if ( $hashable_node && $hashable_node.length == 1 ) {
                                    $hashable_node.addClass('rdr-hashed');
                                }
                            }
                        }
                        // } else {
                        //     delete sendable_hashes[j];
                        // }
                    }

                    //build the sendData with the hashes from above
                    sendData = {
	                   short_name : RDR.group.short_name,
	                   pageID: page_id,
	                   hashes: sendable_hashes
                    };

                    // send the data!
                    $.ajax({
                        url: RDR_baseUrl+"/api/summary/containers/",
                        type: "get",
                        contentType: "application/json",
                        dataType: "jsonp",
                        data: {
                            json: $.toJSON(sendData)
                        },
                        success: function(response) {
                            var summaries = {};
                            summaries[ page_id ] = response.data.known;
                            
                            // TODO this is a hack.  we should change how we receive known and unknown to make them the same format.
                            // this shouldn't be doing ANYTHING AT ALL (b/c we don't receive back unknown containers):
                            for ( var i in response.data.unknown ) {
                                
                                var hash = response.data.unknown[i];
                                if (typeof hash == "string") {
                                    // get the kind
                                    if ( $('img.rdr-'+hash).length == 1 ) {
                                        unknown_summary = RDR.util.makeEmptySummary( hash, "img" );
                                    } else if ( $('.rdr-'+hash).text() ) { // TODO seems fragile.
                                        unknown_summary = RDR.util.makeEmptySummary( hash, "text" );
                                    } else {
                                        unknown_summary = RDR.util.makeEmptySummary( hash, "media" );
                                    }
                                    summaries[ hash ] = unknown_summary;
                                }
                            }

                            
                            //the callback implementation here is a litte unintuitive:
                            //it only gets passsed in when a single hash is run through here, 
                            //so it will only get run here either on the $container that is a known summary,
                            //or as a callback after the unknownhash is sent through the containers.send call.

                            // if ( unknownList.length > 0 ) {
                                
                            //     //send the containers to the server.
                            //     //On sucess, these unknown hashes will get passed to RDR.actions.containers.setup with dummy summaries
                            //     RDR.actions.containers.send(unknownList, onSuccessCallback);
                            // }

                            // [ porter ]: since we're not storing containers anymore, just setup all hashes regardless of "known" status
                            if ( !$.isEmptyObject(summaries) ){

                                //setup the summaries
                                RDR.actions.containers.setup(summaries);
                                
                                //the callback verifies the new container and draws the actionbar
                                //wont get run if this single hash is unknown.
                                if(typeof onSuccessCallback !== 'undefined'){
                                    onSuccessCallback();
                                }      
                            }
                        }
                    });
                }
            },
            slideshows: {
                setup: function() {
                    // RDR.actions.slideshows.setup
                    if ( RDR.group.slideshow_trigger ) {
                        $(window).hashchange( function() {
                            var hash = RDR.actions.slideshows.findActiveHash();

                            // TODO: DC demo...  this forces the indicator for a slide to rebuild 
                            $('div.rdr_indicator_details_for_media_inline').remove();
                            RDR.actions.indicators.init(hash);
                        });
                        
                        var $slideshows = $(RDR.group.slideshow_trigger);
                        $.each( $slideshows, function( idx, slideshow ) {
                            var $slideshow = $(slideshow);
                            $slideshow.hover(
                                function(){
                                    var hash = RDR.actions.slideshows.findActiveHash();
                                    // TODO: DC demo...  this forces the indicator for a slide to rebuild 
                                    $('div.rdr_indicator_details_for_media_inline').remove();
                                    RDR.actions.indicators.init(hash);
                                    RDR.actions.containers.media.onEngage( hash );
                                },
                                function(){
                                    RDR.actions.containers.media.onDisengage( RDR.actions.slideshows.findActiveHash() );
                                }
                            );
                        });
                    }
                },
                findActiveHash: function() {
                    // RDR.actions.slideshows.findActiveHash
                    if ( RDR.group.slideshow_trigger && RDR.group.slideshow_img_selector ) {
                        var $slideshow_images = $(RDR.group.slideshow_img_selector),
                            hash = "";

                        $.each( $slideshow_images, function( idx, img ) {
                            var $img = $(img);
                            if ( $img.is(':visible') && $img.parents(':hidden').length == 0 && $img.data('hash') ) {
                                hash = $img.data('hash');
                                return false;
                            }
                        });
                        return hash;
                    } else {
                        return "";
                    }
                }
            },
            containers: {
                media: {
                    //RDR.actions.containers.media:
                    //actions for the special cases of media containers
                    onEngage: function(hash){
                        //RDR.actions.containers.media.onEngage:
                        // action to be run when media container is engaged - typically with a hover over the container



                        var $this = $R('img.rdr-'+hash+', iframe.rdr-'+hash+',embed.rdr-'+hash+',video.rdr-'+hash+',object.rdr-'+hash+'').eq(0);
                        var hasBeenHashed = $this.hasClass('rdr-hashed'),
                            isBlacklisted = $this.closest('.rdr, .no-rdr').length;

                        if(!hasBeenHashed && !isBlacklisted){
                            $this.addClass('rdr_live_hover');
                            var hash = RDR.actions.hashNodes( $this );
                            if(hash){
                                RDR.actions.sendHashes( hash, function(){
                                    if( $this.hasClass('rdr_live_hover') ){
                                        $this.mouseenter();
                                    }
                                });
                            }
                        } else {
                            $this.addClass('rdr_live_hover');
                        }




                        var containerInfo = RDR.containers[hash];
                        if ( containerInfo ) {

                            var $container = containerInfo.$this;

                            $container.data('hover',true);

                            var $indicator = $('#rdr_indicator_'+hash),
                                $containerTracker = $('#rdr_container_tracker_'+hash),
                                $mediaBorderWrap = $containerTracker.find('.rdr_media_border_wrap');
                            
                            $indicator.addClass('rdr_engage_media');

                            //update here just to make sure at least a mouse hover always resets any unexpected weirdness
                            RDR.actions.indicators.utils.updateContainerTracker(hash);
                            $mediaBorderWrap.show();

                            var src = $container.attr('src'),
                            src_with_path = this.src;

                            var coords = {
                                top: $container.offset().top,
                                left: $container.offset().right
                            };

                            $container.addClass('rdr_engage_media');

                            //todo: make this more efficient by making actionbars persistent instead of recreating them each time. 
                            // builds a new actionbar or just returns the existing $actionbar if it exists.

                            //use the image container info as the content, because the img itself is the content_node.
                            var $actionbar = RDR.actionbar.draw({ hash:hash, kind:containerInfo.kind, coords:coords, content:containerInfo.body, src_with_path:containerInfo.body, ignoreWindowEdges:"tb" });

                            //kill all rivals!!
                            var $rivals = $('div.rdr_actionbar').not($actionbar);
                            RDR.actionbar.close( $rivals );

                            //this looks bad because it's adding a hover event on every container hover event, but we need to because
                            //the actionbar is being recreated every time.  We if the actionbar hasn't faded out yet though it will be the
                            //same one, so check for that to avoid excessive events (not that would really hurt anything)
                            if ( $actionbar.data('hasHoverEvent') ) return;
                            //else
                            $actionbar.hover(
                                function() {
                                    $(this).data('hover',true);
                                    
                                },
                                function() {
                                    $(this).data('hover',false);
                                    RDR.actionbar.closeSuggest(hash);
                                }
                            );
                            $actionbar.data('hasHoverEvent', true);
                        }
                    },
                    onDisengage: function(hash){
                        //RDR.actions.containers.media.onDisengage:
                        //actions to be run when media container is disengaged - typically with a hover off of the container

                        var containerInfo = RDR.containers[hash];
                        if ( containerInfo ) {
                            var $container = containerInfo.$this;

                            var actionbar_id = "rdr_actionbar_"+hash;
                            var $actionbar = $('#'+actionbar_id);
                            $container.data('hover',false);
                            RDR.actionbar.closeSuggest(hash);
                        }
                    }
                },
                save: function(settings){
                    //RDR.actions.containers.save:

                    //makes a new one or returns existing one
                    //expects settings with body, kind, and hash.
                    if( RDR.containers.hasOwnProperty(settings.hash) ) return RDR.containers[settings.hash];
                    //else
                    var pageId = ( typeof settings.id === 'undefined' || settings.id === null ) ? null : settings.id;

                    var container = {
                        'id': pageId,
                        'body': settings.body || null,
                        'kind': settings.kind,
                        'hash': settings.hash,
                        'HTMLkind': settings.HTMLkind || null,
                        '$this': settings.$this || null
                    };
                    RDR.containers[settings.hash] = container;
                    return container;
                },
                setup: function(summaries){
                    //RDR.actions.containers.setup:
                    //then define type-specific setup functions and run them

                    var _setupFuncs = {
                        img: function(hash, summary){
                            var containerInfo = RDR.containers[hash];
                            var $container = containerInfo.$this;

                            //generate the content_node for this image container.  (the content_node is just the image itself)
                            //todo: I'm pretty sure it'd be more efficient and safe to run on image hover, or image indicator click.
                            var body = $container[0].src;

                            var content_node_data = {
                                'body': body,
                                'kind':summary.kind,
                                'container': hash, //todo: Should we use this or hash? 
                                'hash':hash
                            };

                            RDR.content_nodes[hash] = content_node_data;

                            $container.hover(
                                function(){
                                    RDR.actions.containers.media.onEngage(hash);
                                },
                                function(){
                                    RDR.actions.containers.media.onDisengage(hash);
                                }
                            );
                        },
                        media: function(hash, summary){
                            //for now, just pass through to img.
                            this.img(hash, summary);
                        },
                        text: function(hash, summary){
                            
                        }
                    };

                    //todo: what does this do?  break this out into a function with a descriptive name.
                    var hashesToShow = []; //filled below

                    for ( var i in summaries ) {
                        var page_id = i;

                        for ( var j in summaries[i] ) {
                            
                            if ( typeof j == "string" && typeof summaries[i][j] == "object" ) {

                                var hash = j;
                                var summary = summaries[i][j]; // ( RDR.summaries[hash] ) ? RDR.summaries[hash] : RDR.util.makeEmptySummary( hash );

                                //first do generic stuff
                                //save the hash as a summary attr for convenience.
                                summary.hash = hash;

                                var containerInfo = RDR.containers[hash];

                                if ( containerInfo) {
                                    var $container = containerInfo.$this;
                                    
                                    // neeed this?
                                    // $container.addClass( 'rdr-' + hash ).addClass('rdr-hashed');
                                    // $container.addClass('rdr-hashed');
                                                     
                                    //temp type conversion for top_interactions.coms;
                                    var newComs = {},
                                        coms = summary.top_interactions.coms;

                                    $.each(coms, function(arrIdx, com){
                                        //sortby tag_id

                                        // [ porter ] this shouldn't be needed, but it is, 
                                        // because the correct comment set, for text, is actually found in summary.content_nodes.top_interactions, which does not exist for images
                                        if ( summary.kind == "text" ) {
                                            newComs[com.tag_id] = com;
                                        } else {
                                            if ( !newComs[com.tag_id] ) newComs[com.tag_id] = [];
                                            newComs[com.tag_id].push(com);
                                        }
                                    });

                                    summary.top_interactions.coms = newComs;
                                    RDR.actions.summaries.save(summary);
                                    RDR.actions.indicators.init( hash );

                                    //now run the type specific function with the //run the setup func above
                                    var kind = summary.kind;
                                    _setupFuncs[kind](hash, summary);
                                    
                                    //note:all of them should have interactions, because these are fresh from the server.  But, check anyway.
                                    //if(summary.counts.interactions > 0){ //we're only showing tags for now, so use that instead.
                                    if(summary.counts.tags > 0){
                                        hashesToShow.push(hash);
                                    }
                                }
                            }
                        }
                    }

                    // create the container sort to see which containers have the most activity
                    RDR.actions.summaries.sortPopularTextContainers();
                    RDR.actions.summaries.displayPopularIndicators();
                    
                    RDR.actions.indicators.show(hashesToShow);
                },
                send: function(hashList, onSuccessCallback){
                    //RDR.actions.containers.send:
                    // gets the containers from the hashList
                    // and cuts them up into delicious bite-sized chunks
                    // to ensure that the ajax sendData isn't over 2000 chars.

                    var containers = {}, 
                    curLen = 0,
                    proposedLen = 0,
                    thisLen,
                    tempEncode,
                    bodyCharLimit = 300, //todo: make this nicer - see below
                    charLimit = 1400; //keep it safely under 2000 to allow for header;

                    $.each( hashList, function(idx, hash){
                        //container is {body:,kind:,hash:}
                        var container = RDR.containers[hash];

                        //quick fix - copy the container object but without the $this obj
                        //for now we're just not sending the body
                        var sendContainer = {
                            HTMLkind: container.HTMLkind,
                            body: "",
                            //body: container.body,
                            hash: container.hash,
                            id: container.id,
                            kind: container.kind
                        };

                        tempEncode = encodeURIComponent ( $.toJSON(sendContainer) );

                        thisLen = tempEncode.length;
                        
                        //[cleanlogz]('container');
                        //[cleanlogz](container);

                        //todo: solve for this.  We don't expect to see this though.
                        if(thisLen > charLimit){


                            //container chunk solution for later.  For now, just dissalow this container.
                            /*
                            var body = container.body,
                                fragment,
                                incr = 0,
                                bodyParts = [],
                            while( body.length ){
                                incr += bodyCharLimit;
                                fragment = body.slice(incr);
                                if(fragment){
                                    bodyParts.push[fragment];
                                }
                            } 
                            
                            $.each(function(idx, partialBody){

                                sendContainer = {
                                    HTMLkind: container.HTMLkind,
                                    partialBody: partialBody,
                                    partialBodyIdx: idx,
                                    partialBodyIdx: idx,
                                    hash: container.hash,
                                    id: container.id,
                                    kind: container.kind
                                };
                                containers[hash] = sendContainer;
                                RDR.actions.containers._ajaxSend(sendContainer);
                            });
                            */

                            //signals the call to not save this container
                            sendContainer = false;
                        }
                        else{
                            proposedLen += thisLen;
                            if(proposedLen > charLimit){
                                //send the existing set that is curLen, not proposedLen

                                RDR.actions.containers._ajaxSend(containers);
                                resetChunks();
                            }
                            containers[hash] = sendContainer;
                            curLen += thisLen;

                        }

                    });
                    //do one last send.  Often this will be the only send.
                    if( ! $.isEmptyObject(containers) ) {
                        RDR.actions.containers._ajaxSend(containers, onSuccessCallback);
                    }

                    //helper functions
                    function resetChunks(){
                        containers = {};
                        curLen = 0;
                        proposedLen = 0;
                    }
                },
                _ajaxSend: function(containers, onSuccessCallback){
                    //RDR.actions.containers._ajaxSend:
                    //this is a helper for this.send:
                    //don't call this directly! Always use this.send so you don't choke on your ajax.

                    var sendData = containers;

                    // TODO do we even need this anymore?
                    $.ajax({
                        url: RDR_baseUrl+"/api/containers/create/",
                        type: "get",
                        contentType: "application/json",
                        dataType: "jsonp",
                        data: {
                            json: $.toJSON(sendData)
                        },
                        success: function(response) {
                            //[cleanlogz]('response for containers create');
                            var savedHashes = response.data;
                            //savedHashes is in the form {hash:id}

                            //a dict for dummy zero'ed out summaries for containers.setup below
                            var dummySummaries = {};

                            $.each( savedHashes, function(hash, id){
                                //todo: we prob don't need to check with the bool - Tyler, do we need this?
                                if( !id ){
                                    return;
                                }
                                //else
                                var node = RDR.containers[hash];
                                node.id = id;
                                dummySummaries[hash] = RDR.actions.summaries.init(hash);
                            });

                            RDR.actions.containers.setup(dummySummaries);
       
                            //the callback verifies the new container and draws the actionbar
                            //this only gets called when a single hash gets passed through all the way from startSelect 
                            if(typeof onSuccessCallback !== 'undefined'){
                                onSuccessCallback();
                            }      

                        }
                    });
                }
            },
            content_nodes: {
                make: function(settings){
                    //RDR.actions.content_nodes.make:

                    //makes a new one or returns existing one
                    //expects settings with container, body, and location.
                    
                    var hash = settings.hash;

                    var content_node_key;
                    if (settings.location){
                        content_node_key = settings.container+"-"+settings.location;
                    }
                    else{
                        content_node_key = settings.container;
                    }

                    if( RDR.content_nodes.hasOwnProperty(content_node_key) ) return RDR.content_nodes[content_node_key];
                    //else
                    var content_node = {
                        'container': settings.container,
                        'body': settings.body,
                        'location': settings.location,
                        'hash': hash
                    };
                    
                    RDR.content_nodes[content_node_key] = content_node;
                    
                    return content_node;
                },
                init: function(hash, onSuccessCallback){
                    //RDR.actions.content_nodes.init:
                    //gets this summary's content_nodes from the server and populates the summary with them.

                    var summary = RDR.summaries[hash];

                    var sendData = {
                        "page_id" : RDR.util.getPageProperty('id', hash),
                        "container_id":summary.id,
                        "top_tags":summary.top_interactions.tags
                    };

                    $.ajax({
                        url: RDR_baseUrl+"/api/summary/container/content/",
                        type: "get",
                        contentType: "application/json",
                        dataType: "jsonp",
                        data: { json: $.toJSON(sendData) },
                        success: function(response) {
                            if ( response.status !== "success" ) {
                                return false;
                            }
                            //else
                            //summary.initiated = true;

                            var content_nodes = response.data;
                            //todo: make this generic interactions instead of just tags
                            //summary.interactions.tags = 
                            
                            //todo: think about this more later:
                            //make selStates for these nodes and give the nodes a reference to them
                            $.each(content_nodes, function(key, node){
                                var $container = $('.rdr-'+hash);
                                try{
                                    node.selState = $container.selog('save', { 'serialRange': node.location });
                                }
                                catch(err){
                                    node.selState = undefined;
                                }

                            });

                            //throw the content_nodes into the container summary
                            summary.content_nodes = content_nodes;

                            //finally, run the success callback function
                            if ( onSuccessCallback ) onSuccessCallback();
                        }
                    });
                },
                utils: {
                    makeDictSortedByTag: function(content_nodes){
                        //RDR.actions.content_nodes.utils.makeDictSortedByTag:

                        //make a helper dictionary that inverts our dict of {content_nodes: {tags...} }
                        var invertedDict = {}; //dict will be { tag_id: [ list of content_node_ids }
                        
                        //populate invertedDict - for each tag_node, get all its content_nodes in the summary
                        $.each( content_nodes, function(content_node_id, content_node){
                            $.each(content_node.top_interactions.tags, function(tag_node_id, tag_node){
                                if ( !invertedDict.hasOwnProperty(tag_node_id) ){
                                    invertedDict[tag_node_id] = [];
                                }
                                invertedDict[tag_node_id].push(content_node);
                            });
                        });
                        return invertedDict;
                    },
                    initHiliteStates: function( $tagSpan, content_nodes ){
                        //todo: combine with others - i think this is just being used for indicator details

                        //RDR.actions.content_nodes.utils.initHiliteStates:

                        //add selStates to $tagSpan data.
                        $.each( content_nodes, function(arrIdx, content_node){
                            if( content_node.selState ){
                                $tagSpan.data('selStates').push(content_node.selState);
                            }
                        });
                        
                        //setup hover event to hilite and unhlite
                        $tagSpan.hover(
                            function() {
                                    
                                var selStates = $(this).data('selStates');

                                //quick hack because I don't yet have a good solution for multiple hilites. (overlapping ones cause issues still.)
                                var lastSelState = selStates.length ? selStates[selStates.length-1] : null;
                                if (lastSelState){
                                    $().selog('hilite', lastSelState, 'on');
                                }
                                /*
                                $.each( selStates, function(idx, selState){
                                    $().selog('hilite', selState, 'on');
                                });
                                */
                            },
                            function() {
                                 
                                var selStates = $(this).data('selStates');
                                //quick hack because I don't yet have a good solution for multiple hilites. (overlapping ones cause issues still.)
                                var lastSelState = selStates.length ? selStates[selStates.length-1] : null;
                                if (lastSelState){
                                    $().selog('hilite', lastSelState, 'off');
                                }
                                /*
                                $.each( selStates, function(idx, selState){
                                    $().selog('hilite', selState, 'off');
                                });
                                */
                            }
                        );
                    }
                }//end RDR.actions.content_nodes.utils
            },
            interactions: {
                //RDR.actions.interactions:
                ajax: function(args, int_type, action_type){
                    //RDR.actions.interactions.ajax:

                    //temp tie-over    
                    var hash = args.hash,
                        summary = RDR.summaries[hash],
                        kind = (summary) ? summary.kind:"";
                        
                    if ( !action_type ) action_type = "create";

                    if( !RDR.actions.interactions.hasOwnProperty(int_type) ){
                        return false; //don't continue
                    }
                    
                    // take care of pre-ajax stuff, mostly UI stuff
                    RDR.actions.interactions[int_type].preAjax(args, action_type);

                    //get user and only procceed on success of that.
                    RDR.session.getUser( args, function(newArgs){
                        var defaultSendData = RDR.actions.interactions.defaultSendData(newArgs),
                            customSendData = RDR.actions.interactions[int_type].customSendData(newArgs),
                            sendData = $.extend( {}, defaultSendData, customSendData );
                        
                        newArgs.sendData = sendData;

                        //fix hash
                        newArgs.hash = hash;
                        newArgs.sendData.hash = hash;

                        //run the send function for the appropriate interaction type
                        //RDR.actions.interactions[int_type].send(args);

                        RDR.actions.interactions.send(newArgs, int_type, action_type);
                    });
                },
                send: function(args, int_type, action_type){
                    // /api/tag/create
                    // /api/comment/create
                    // hack to cleanup the send data
                    var sendData = $.extend( true, {}, args.sendData);

                    if (sendData.rindow) delete sendData.rindow;
                    if (sendData.settings) delete sendData.settings;
                    if (sendData.selState) delete sendData.selState;
                    if (sendData.content_node ) delete sendData.content_node;
                    if (sendData.content_node_data && sendData.content_node_data.selState ) delete sendData.content_node_data.selState;
                    if (sendData.content_node_data && sendData.content_node_data.counts ) delete sendData.content_node_data.counts;
                    if (sendData.content_node_data && sendData.content_node_data.top_interactions ) delete sendData.content_node_data.top_interactions;
                    if (sendData.content_node_data && sendData.content_node_data.$container) delete sendData.content_node_data.$container; //this was happening for delete calls.
                    if (sendData.content_node_data && sendData.content_node_data.$indicator) delete sendData.content_node_data.$indicator; //this was happening for delete calls.
                    if (sendData.content_node_data && sendData.content_node_data.$indicator_details) delete sendData.content_node_data.$indicator_details; //this was happening for delete calls.
                    if (sendData.content_node_data && sendData.content_node_data.$rindow_readmode) delete sendData.content_node_data.$rindow_readmode; //this was happening for delete calls.
                    if (sendData.node) delete sendData.node;
                    if (sendData.uiMode) delete sendData.uiMode;
                    if (sendData.sendData) delete sendData.sendData; //this was happening for delete calls.

// TODO force forcing
if ( RDR.summaries[sendData.hash] ) sendData.container_kind = RDR.summaries[sendData.hash].kind;
// sendData.container_kind = sendData.hash;
if (sendData.content_node_data && sendData.content_node_data.container ) delete sendData.content_node_data.container;

                    //todo: consider making a generic url router
                    var url = RDR_baseUrl+"/api/" +int_type+ "/"+action_type+"/";

                    var hitMax = RDR.session.checkForMaxInteractions(args);

                    if (hitMax) {
                        // send the data!
                        $.ajax({
                            url: url,
                            type: "get",
                            contentType: "application/json",
                            dataType: "jsonp",
                            data: { json: $.toJSON(sendData) },
                            success: function(response) {
                                args.response = response;
                                if ( response.data && response.data.num_interactions ) RDR.user.num_interactions = response.data.num_interactions;
                                if ( response.status == "success" ) {
                                    //[cleanlogz](action_type);
                                    
                                    var existing = args.response.data.existing;
                                    if(existing){
                                        args.response.message = "existing interaction";
                                        RDR.actions.interactions[int_type].onFail(args);
                                        return;
                                    }
                                    //else
                                    if(args.response.data.deleted_interaction){
                                        args.deleted_interaction = args.response.data.deleted_interaction;
                                    }

                                    RDR.actions.interactions[int_type].onSuccess[action_type](args);
                                }else{
                                    if ( int_type == "tag" ) RDR.actions.interactions[int_type].onFail(args);
                                    else {
                                        if (response.message.indexOf( "Temporary user interaction limit reached" ) != -1 ) {
                                            //[cleanlogz]('uh oh better login, tempy 1');
                                            RDR.session.showLoginPanel( args );
                                        } if ( response.message == "existing interaction" ) {
                                            //todo: I think we should use adapt the showTempUserMsg function to show a message "you have already said this" or something.
                                            //showTempUserMsg should be adapted to be rindowUserMessage:{show:..., hide:...}
                                                //with a message param.
                                                //and a close 'x' button.
                                                args.msgType = "existingInteraction";
                                                RDR.session.rindowUserMessage.show( args );
                                        }
                                        else {
                                            // if it failed, see if we can fix it, and if so, try this function one more time
                                            RDR.session.handleGetUserFail( args, function() {
                                                RDR.actions.interactions.ajax( args, int_type, 'create' );
                                            });
                                        }
                                    }
                                }
                            }
                        });
                    } else {
                        RDR.session.showLoginPanel( args, function() { RDR.actions.interactions.ajax( args, int_type, 'create' ); } );
                    }
                },
                defaultSendData: function(args){
                    //RDR.actions.interactions.defaultSendData:
                    args.user_id = RDR.user.user_id;
                    args.readr_token = RDR.user.readr_token;
                    args.group_id = RDR.group.id;
                    args.page_id = RDR.util.getPageProperty('id', args.hash);
                    return args;

                },
                comment: {
                    preAjax: function(){
                        
                    },
                    customSendData: function(args){
                        //RDR.actions.interactions.comment.customSendData:
                    },
                    onSuccess: {
                        //RDR.actions.interactions.comment.onSuccess:
                        create: function(args){
                            //RDR.actions.interactions.comment.onSuccess.create:
                            var rindow = args.rindow,
                                hash = args.hash,
                                response = args.response,
                                tag = args.tag;

                            var interaction = response.data.interaction;

                            rindow.find('div.rdr_commentBox').find('div.rdr_commentComplete').html('Thank you for your comment. <br><br><strong>Reload the page to see your comment.</strong>').show();
                            rindow.find('div.rdr_commentBox').find('div.rdr_tagFeedback, div.rdr_comment').hide();
                            // RDR.actions.summaries.hack.updateCommentSet( args );

                            //todo: consider adding these fields to the summary
                            // update the comments for this hash
                            // var newComment = {
                            //     body: comment,
                            //     content_id: ,
                            //     id: response.data.interaction.id, // interaction id
                            //     social_user: ,
                            //     tag_id: ,
                            //     user: 
                            // }
                            //do updates

                            //todo: unify this with the rest of the interactions
                            var intHelper = {
                                id: interaction.id,
                                body: interaction.interaction_node.body,
                                parent_id: args.parent_id,
                                content_id: args.content_id,
                                parent_interaction_node: args.tag,
                                delta: 1,
                                user: args.user,
                                social_user: args.social_user
                            };

                            var diff = {   
                                coms: {}
                            };
                            diff.coms[ tag.id ] = intHelper;
                            RDR.actions.summaries.update(hash, diff);

                            var usrMsgArgs = {      
                                msgType: "interactionSuccess",
                                interactionInfo: {
                                    type: 'comment'
                                },
                                rindow:rindow
                            };
                            //queued up to be released in the sharestart function after the animation finishes    
                            rindow.queue('userMessage', function(){
                                RDR.session.rindowUserMessage.show( usrMsgArgs );
                            });
                            //the comment doesn't rely on any panel movement, so just dequeue now
                            rindow.dequeue('userMessage');

                        },
                        remove: function(args){
                            //RDR.actions.interactions.comment.onSuccess.remove:

/*
                            var sendData = args.sendData;
                            var interaction_node = args.response.data.deleted_interaction.interaction_node;
                            var rindow = args.rindow,
                                $tagLi = args.tag,
                                tag = args.tag,
                                int_id = args.int_id;

                            RDR.actions.panel.collapse("whyPanel", rindow);
                            var $thisTagButton = rindow.find('div.rdr_reactionPanel ul.rdr_tags li.rdr_int_node_'+int_id);
                            $thisTagButton.removeClass('rdr_tagged').removeClass('rdr_int_node_'+int_id);

                            //todo: quick hack -- fix later
                            if( ! $tagLi.jquery ){
                                $tagLi = rindow.find('.rdr_tag_'+args.tag.id);
                            }
                            $tagLi.find('div.rdr_tag_count').html('');

                            //do updates
                            var hash = sendData.hash;
                            var intNodeHelper = {
                                id: interaction_node.id,
                                body: interaction_node.body,
                                delta: -1
                            };

                            var diff = {   
                                tags: {}
                            };
                            diff.tags[ intNodeHelper.id ] = intNodeHelper;

                            RDR.actions.summaries.update(hash, diff);
                        */

                        }
                    
                    },
                    onFail: function(){
                        
                    }
                },
                share: {
                    preAjax: function(){
                        
                    },
                    customSendData: function(){
                        return {};
                    },
                    onSuccess: function(){
                        
                    },
                    onFail: function(){
                        
                    }
                },
                tag: {
                    preAjax: function(args, action_type){
                        if (args.kind && args.kind == "page") {
                        } else {
                            //RDR.actions.interactions.tag.preAjax:
                            //expected to be called from RDR.actions.interactions.ajax
                            var $rindow = args.rindow;
                            
                            //example:
                            var uiMode = args.uiMode || 'write';
                            //Split by readMode or writeMode
                            
                            //expand args to make it clear what's going on.
                            var $tagLi = args.tag,
                            settings = args.settings;

                            //todo: quick hack - do this right later.
                            if( ! $tagLi.jquery ){
                                $tagLi = $rindow.find('.rdr_tag_'+args.tag.id);
                            }
                            if (uiMode === "write"){
                                //nothing here now
                            }else if(uiMode === "read"){
                                //superhack!
                                $tagLi.data('html', $tagLi.html() );
                            }
                            //Do UI stuff particular to write mode
                            var $loader = $('<span class="rdr_loader" />').append('<img src="'+RDR_staticUrl+'widget/images/loader.gif" />');
                            $tagLi.find('div.rdr_tag_count').addClass('rdr_kill_bg').find('span').addClass('rdr_not_loader').hide();
                            $tagLi.find('div.rdr_tag_count').append($loader);
                        }
                    },
                    customSendData: function(args){
                        ////RDR.actions.interactions.tag.customSendData:
                        //temp tie-over    

                        var hash = args.hash,
                            summary = RDR.summaries[hash],
                            kind,
                            tag,
                            sendData;

                        if (args.kind && args.kind == "page") {    
                            kind = "page";
                            tag = args.tag;

                            content_node_data = {
                                'container': hash,
                                'body': "",
                                'kind':kind,
                                'hash':hash
                            };

                            sendData = {
                                //interaction level attrs
                                "tag" : tag,
                                "node": null,
                                "content_node_data":content_node_data,
                                "hash": hash,
                                //page level attrs
                                "user_id" : RDR.user.user_id,
                                "readr_token" : RDR.user.readr_token,
                                "group_id" : RDR.group.id,
                                "page_id" : RDR.util.getPageProperty('id', hash)
                            };
                        } else  {

                            kind = summary.kind;
                          
                            var $container = $('.rdr-'+hash);

                            var rindow = args.rindow,
                                tag_li = args.tag;
                            
                            tag = ( typeof args.tag.data == "function" ) ? args.tag.data('tag'):args.tag;

                            var content_node_data = {};
                            //If readmode, we will have a content_node.  If not, use content_node_data, and build a new content_node on success.
                            var content_node = args.content_node || null;

                            //[cleanlogz](content_node_data);
                            if(kind == 'img' || kind == 'media'){
                                var body = $container[0].src;

                                content_node_data = {
                                    'container': rindow.data('container'),
                                    'body': body,
                                    'kind':kind,
                                    'hash':hash
                                };

                            }else{
                                //is text
                                
                                //todo: fix this temp hackery
                                if(content_node){
                                    content_node_data = {
                                        'container': rindow.data('container'),
                                        'body': content_node.body,
                                        'location': content_node.location,
                                        'kind':kind
                                    };
                                }else{
                                    var selState = rindow.data('selState');
                                    
                                    content_node_data = {
                                        'container': rindow.data('container'),
                                        'body': selState.text,
                                        'location': selState.serialRange,
                                        'kind': kind
                                    };
                                }
                            }

                            sendData = {
                                //interaction level attrs
                                "tag" : tag,
                                "node": content_node,                        //null if writemode
                                "content_node_data":content_node_data,
                                "hash": content_node_data.container,
                                //page level attrs
                                "user_id" : RDR.user.user_id,
                                "readr_token" : RDR.user.readr_token,
                                "group_id" : RDR.group.id,
                                "page_id" : RDR.util.getPageProperty('id', hash),
                                "int_id" : args.int_id
                            };
                        }

                        return sendData;

                    },
                    onSuccess: {
                        //RDR.actions.interactions.tag.onSuccess:
                        create: function(args){
                            //RDR.actions.interactions.tag.onSuccess.create:
                            //todo: clean up these args.
                            if (args.kind && args.kind == "page") {
                                $summary_box = $('.rdr-page-container.rdr-'+args.hash+' div.rdr-summary');
                                $span = $summary_box.find('a.rdr_tag_' + args.tag.id + ' span');

                                if ( $span.length === 0 && $summary_box.find('a.rdr_tag_' + args.tag.id).length === 0 ) { // it's a custom tag
                                    $summary_box.find('a.rdr_custom_tag').html( args.tag.body );
                                    $summary_box.find('a.rdr_custom_tag').append( '<span class="rdr_tag_count">1</span>' );
                                    $('#rdr-tooltip-summary-tag-custom').remove();
                                }

                                var tagCount = ( $span.text() === "+" ) ? 0 : parseInt( $span.text(), 10 );
                                tagCount++;

                                $span.text( tagCount );

                                $span.show(200).css('visibility','visible');

                                $summary_box.find('div.rdr_note').html( $('<em>Thanks!  You reacted <strong style="color:#008be4;font-style:italic !important;">'+args.tag.body+'</strong>.</em><br><br><strong>Tip:</strong> You can <strong style="color:#008be4;">react to anything on the page</strong>. <ins>Select some text, or roll your mouse over any image or video, and look for the pin icon: <img src="'+RDR_staticUrl+'widget/images/blank.png" class="no-rdr" style="background:url('+RDR_staticUrl+'widget/images/readr_icons.png) 0px 0px no-repeat;margin:0 0 -5px 0;" /></ins>') );
                                //todo: reconsider this method of liberally updating everything with updateContainerTrackers
                                $summary_box.find('div.rdr_note').show(400, RDR.actions.indicators.utils.updateContainerTrackers );
                            } else {
                                
                                var uiMode = args.uiMode || 'write';

                                var response = args.response,
                                    interaction = args.response.interaction,
                                    interaction_node = response.data.interaction.interaction_node;
                                
                                var sendData = args.sendData;
                                var rindow = args.rindow,
                                    $tag_li = args.tag,
                                    tag = ( typeof args.tag.data == "function" ) ? args.tag.data('tag'):args.tag,
                                    int_id = response.data.interaction.id;

                                //temp tie-over    
                                var hash = args.hash,
                                    summary = RDR.summaries[hash],
                                    kind = summary.kind;


                                //more freaking tie-overs
                                args.settings = args.sendData.content_node_data;

                                //todo: untangle these argument translations.
                                var content_node_data = sendData.content_node_data;

                                //temp tie over
                                content_node_data.hash = content_node_data.container;
                                content_node_data.kind = sendData.kind;

                                //clear the loader        
                                if ( typeof $tag_li.find != "function" ) {
                                    $tag_li = rindow.find('li.rdr_tag_' + args.tag.id);
                                }
                                $tag_li.find('div.rdr_tag_count').removeClass('rdr_kill_bg').find('.rdr_loader').remove();

                                // var $this = $tag_li; // not sure why we are doing this.
                                $tag_li.addClass('rdr_selected');
                                $tag_li.siblings().removeClass('rdr_selected');
                                $tag_li.parents('div.rdr.rdr_window').removeClass('rdr_rewritable');
                                
                                //reset this var for now
                                content_node_data = args.content_node || RDR.actions.content_nodes.make(content_node_data);

                                if ( $tag_li.length == 1 ) {
                                    var $tagCount = $tag_li.find('div.rdr_tag_count');
                                    $tagCount.unbind();

                                    //temp quick fix to show msg for vote up in 3rd panel

                                        rindow.dequeue('userMessage');
                                        //hackity hack number incrementer
                                        var $number = $tagCount.find('.rdr_not_loader');
                                        var tagCount = ( isNaN( parseInt($number.text(), 10) ) ) ? parseInt("1", 10):parseInt( $number.text(), 10 );
                                        $number.text( RDR.util.prettyNumber( tagCount ) );
                                        $number.show();

                                        //this one's even more hacky - doesn't really matter, but fix this soon.
                                        var $number2 = rindow.find('.rdr_info_summary').find('.rdr_reaction_count');
                                        if($number2.length){
                                            var theNumber = RDR.util.prettyNumber( $number2.data('count')+1 );
                                            $number2.find('span').text( '(' +theNumber+ ') ');
                                        }
                                        //hack complete.
                                        

                                    /* let's remove the "undo" functionality from the tag count for now. [pb]
                                    $tagCount.click( function(e) {
                                        e.preventDefault();
                                                            
                                        var newArgs = {    
                                            content_node_data: args.content_node_data,
                                            hash: hash,
                                            int_id: int_id,
                                            tag:$tag_li,
                                            rindow: args.rindow
                                        };
                                        // RDR.actions.unrateSend(args);
                                        RDR.actions.interactions.ajax( newArgs, 'tag', 'remove' );
                                        return false; // prevent the tag call applied to the parent <li> from firing
                                    });
                                    */

                                    $tag_li.addClass('rdr_tagged').addClass('rdr_int_node_'+int_id);
                                    $tag_li.data('interaction_id', int_id);

                                    // if it was a custom tag, do a few things
                                    if ( $tag_li.hasClass('rdr_customTagBox') ) {
                                        $tag_li.removeClass('rdr_customTagBox');
                                        $tag_li.siblings().removeClass('rdr_selected');
                                        $tag_li.addClass('rdr_selected');
                                        $tag_li.find('input').remove();
                                        $tag_li.find('div.rdr_help').remove();
                                        $tag_li.find('.rdr_tagText').html(tag.body);
                                        RDR.actions.sentimentPanel.addCustomTagBox({hash:hash, rindow:rindow, settings:args.settings, actionType:'react'});
                                    }
                                }

                                var usrMsgArgs = {      
                                    msgType: "interactionSuccess",
                                    interactionInfo: {
                                        type: 'tag',
                                        body: tag.body
                                    },
                                    rindow:rindow
                                };

                                //queued up to be released in the sharestart function after the animation finishes    
                                rindow.queue('userMessage', function(){
                                    RDR.session.rindowUserMessage.show( usrMsgArgs );
                                });

                                // if( uiMode !== "read" ){
                                    RDR.actions.shareStart( {rindow:rindow, tag:tag, int_id:int_id, content_node_data:content_node_data, hash:hash});
                                // }

                                //do updates
                                var intNodeHelper = {
                                    id: interaction_node.id,
                                    parent_id: null,
                                    parent_interaction_node: tag,
                                    content_id: null, //todo add later
                                    body: interaction_node.body,
                                    delta: 1,
                                    user: args.user,
                                    social_user: args.social_user
                                };

                                var diff = {   
                                    tags: {}
                                };
                                diff.tags[ intNodeHelper.id ] = intNodeHelper;

                                RDR.actions.summaries.update(hash, diff);
                            }

                        },
                        remove: function(args){
                            //RDR.actions.interactions.tag.onSuccess.remove:
                            var sendData = args.sendData;
                            var interaction_node = args.response.data.deleted_interaction.interaction_node;
                            var rindow = args.rindow,
                                $tagLi = args.tag,
                                tag = args.tag,
                                int_id = args.int_id;

                            //todo: quick hack -- fix later
                            if( ! $tagLi.jquery ){
                                $tagLi = rindow.find('.rdr_tag_'+args.tag.id);
                            }
                            $tagLi.find('div.rdr_tag_count').removeClass('rdr_kill_bg').find('.rdr_loader').remove();

                            //do updates
                            var hash = sendData.hash;
                            var intNodeHelper = {
                                id: interaction_node.id,
                                parent_id: null,
                                content_id: null, //todo add later
                                body: interaction_node.body,
                                delta: -1,
                                user: args.user,
                                social_user: args.social_user
                            };

                            var diff = {   
                                tags: {}
                            };
                            diff.tags[ intNodeHelper.id ] = intNodeHelper;

                            RDR.actions.summaries.update(hash, diff);

                            var usrMsgArgs = {      
                                msgType: "interactionSuccess",
                                interactionInfo: {
                                    type: 'tag',
                                    body: interaction_node.body,
                                    remove: true
                                },
                                rindow:rindow
                            };
                            //queued up to be released in the sharestart function after the animation finishes    
                            rindow.queue('userMessage', function(){
                                RDR.session.rindowUserMessage.show( usrMsgArgs );
                            });
                            RDR.actions.panel.collapse("whyPanel", rindow);

                            var $thisTagButton = rindow.find('div.rdr_reactionPanel ul.rdr_tags li.rdr_int_node_'+int_id);
                            $thisTagButton.removeClass('rdr_selected').removeClass('rdr_tagged').removeClass('rdr_int_node_'+int_id);
                        }
                    },
                    onFail: function(args){
                        if (args.kind && args.kind == "page") {
                            var $message = "";
                            if ( args.response.data && args.response.data.existing && args.response.data.existing === true ) {
                                $message = $('<em>You have already given that reaction.</em><br><br><strong>Tip:</strong> You can <strong style="color:#008be4;">react to anything on the page</strong>. <ins>Select some text, or roll your mouse over any image or video, and look for the pin icon: <img src="'+RDR_staticUrl+'widget/images/blank.png" class="no-rdr" style="background:url('+RDR_staticUrl+'widget/images/readr_icons.png) 0px 0px no-repeat;margin:0 0 -5px 0;" /></ins>');
                            } else if ( args.response.message.indexOf("Temporary user interaction limit reached") != -1 ) {
                                $message = $('<em>To continue adding reactions, please <a href="javascript:void(0);" style="color:#008be4;" onclick="RDR.session.showLoginPanel();">Connect with Facebook</a>.</em><br><br><strong>Why:</strong> To encourage <strong style="color:#008be4;">high-quality participation from the community</strong>, <ins>we ask that you log in with Facebook. You\'ll also have a profile where you can revisit your reactions, bookmarks, and comments made using <strong style="color:#008be4;">ReadrBoard</strong>!</ins>');
                            } else {
                                RDR.session.handleGetUserFail( args, function() {
                                    RDR.actions.interactions.ajax( args, 'tag', 'create' );
                                });
                            }

                            if ( typeof $message == "object" ) {
                                $summary_box = $('.rdr-page-container.rdr-'+args.hash+' div.rdr-summary');
                                $summary_box.find('div.rdr_note').html( $message );
                                //todo: reconsider this method of liberally updating everything
                                $summary_box.find('div.rdr_note').show(400, RDR.actions.indicators.utils.updateContainerTrackers );
                            }
                        } else {
                            //RDR.actions.interactions.tag.onFail:

                            //todo: we prob want to move most of this to a general onFail for all interactions.
                            // So this function would look like: doSpecificOnFailStuff....; RDR.actions.interactions.genericOnFail();

                            var rindow = args.rindow,
                                tag_li = args.tag;

                            var response = args.response;

                            //clear the loader                  
                            if ( typeof tag_li.find != "function" ) {
                                tag_li = rindow.find('li.rdr_tag_' + args.tag.id);
                            }
                            tag_li.find('div.rdr_tag_count').removeClass('rdr_kill_bg').find('.rdr_loader').remove();
                            tag_li.find('div.rdr_tag_count').find('.rdr_not_loader').show();
                            
                            if (response.message.indexOf( "Temporary user interaction limit reached" ) != -1 ) {
                                RDR.session.receiveMessage( args, function() { RDR.actions.interactions.ajax( args, 'tag', 'create' ); } );
                                RDR.session.showLoginPanel( args );
                            } if ( response.message == "existing interaction" ) {
                                //todo: I think we should use adapt the showTempUserMsg function to show a message "you have already said this" or something.
                                //showTempUserMsg should be adapted to be rindowUserMessage:{show:..., hide:...}
                                    //with a message param.
                                    //and a close 'x' button.
                                    args.msgType = "existingInteraction";
                                    RDR.session.rindowUserMessage.show( args );
                            }
                            else {
                                // if it failed, see if we can fix it, and if so, try this function one more time
                                RDR.session.handleGetUserFail( args, function() {
                                    RDR.actions.interactions.ajax( args, 'tag', 'create' );
                                });
                            }
                        }
                    }
                },
                bookmark: {
                    preAjax: function(args){
                        var uiMode = "write"; //always write mode for tagging
                        //expand args to make it clear what's going on.
                        var $rindow = args.rindow,
                        $tagLi = args.tag,
                        settings = args.settings;

                        //Do UI stuff particular to write mode
                        if (uiMode == "write"){
                            //if tag has already been tried to be submitted, don't try again.
                            //todo: later verify on the backend and don't let user 'stuff the ballot'

                            // optional loader.
                            if ( typeof args.tag.find == "function" ){
                                var $loader = $('<span class="rdr_loader" />').append('<img src="'+RDR_staticUrl+'widget/images/loader.gif" />');
                                args.tag.find('div.rdr_tag_count').addClass('rdr_kill_bg').find('span').hide().append($loader);
                            }

                        }else{

                        }
                        
                    },
                    customSendData: function(args){
                        //RDR.actions.interactions.bookmark.customSendData:
                      
                       var hash = args.hash,
                            summary = RDR.summaries[hash],
                            kind = summary.kind;
                      
                                            
                        var $container = $('.rdr-'+hash);

                        var rindow = args.rindow,
                            tag_li = args.tag;
                        var $tag = args.tag,
                            tag = $tag.data('tag');


                        var content_node_data = {};
                        //If readmode, we will have a content_node.  If not, use content_node_data, and build a new content_node on success.
                        var content_node = args.content_node || null;

                        //[cleanlogz](content_node_data);
                        if(kind == 'img' || kind == 'media'){

                            var body = $container[0].src;

                            content_node_data = {
                                'container': rindow.data('container'),
                                'body': body,
                                'kind':kind,
                                'hash':hash
                            };

                        }else{
                            //is text
                            
                            //todo: fix this temp hackery
                            if(content_node){
                                content_node_data = {
                                    'container': rindow.data('container'),
                                    'body': content_node.body,
                                    'location': content_node.location,
                                    'kind':kind
                                };
                            }else{
                                var selState = rindow.data('selState');
                                content_node_data = {
                                    'container': rindow.data('container'),
                                    'body': selState.text,
                                    'location': selState.serialRange,
                                    'kind': kind
                                };
                            }
                        }

                        var sendData = {
                            //interaction level attrs
                            "tag":tag,
                            "node": content_node,                        //null if writemode
                            "content_node_data":content_node_data,
                            "hash": content_node_data.container,
                            //page level attrs
                            "user_id" : RDR.user.user_id,
                            "readr_token" : RDR.user.readr_token,
                            "group_id" : RDR.group.id,
                            "page_id" : RDR.util.getPageProperty('id', hash),
                            "int_id" : args.int_id
                        };
                        return sendData;
                    },
                    onSuccess: {
                        //RDR.actions.interactions.bookmark.onSuccess:
                        create: function(args){

                            var response = args.response;
                            var sendData = args.sendData;
                            var rindow = args.rindow,
                                tag_li = args.tag,
                                tag = args.tag.data('tag');

                            var content_node_data = sendData.content_node_data;
                            var int_id = response.data.interaction.id;

                            //temp tie over
                            content_node_data.hash = content_node_data.container;
                            var hash = content_node_data.hash;

                            //clears the loader                          
                            tag_li.find('div.rdr_tag_count').removeClass('rdr_kill_bg').find('.rdr_loader').remove();

                            //[cleanlogz]('bookmark successssssssssssss');

                            var $this = args.tag;
                            $this.addClass('rdr_selected');
                            $this.siblings().removeClass('rdr_selected');
                            $this.parents('div.rdr.rdr_window').removeClass('rdr_rewritable');
                            
                            var content_node = args.content_node || RDR.actions.content_nodes.make(content_node_data);

                            if ( tag_li.length == 1 ) {
                                tag_li.find('div.rdr_tag_count').unbind();
                                tag_li.find('div.rdr_tag_count').click( function(e) {
                                    e.preventDefault();
                                    
                                    var newArgs = {    
                                        content_node_data: args.content_node_data,
                                        hash: hash,
                                        int_id: int_id,
                                        tag:tag_li,
                                        rindow: args.rindow
                                    };

                                    RDR.actions.interactions.ajax( newArgs, 'bookmark', 'remove' );
                                    return false; // prevent the tag call applied to the parent <li> from firing
                                });


                                tag_li.addClass('rdr_tagged').addClass('rdr_int_node_'+int_id);
                                tag_li.data('interaction_id', int_id);

                                // if it was a custom tag, do a few things
                                if ( tag_li.hasClass('rdr_customTagBox') ) {
                                    tag_li.removeClass('rdr_customTagBox');
                                    tag_li.siblings().removeClass('rdr_selected');
                                    tag_li.addClass('rdr_selected');
                                    tag_li.find('input').remove();
                                    tag_li.find('div.rdr_help').remove();
                                    tag_li.append( '<div class="rdr_tagText">'+tag.body+'</div>' );
                                    RDR.actions.sentimentPanel.addCustomTagBox({hash:hash, rindow:rindow, settings:args.settings, actionType:'bookmark'});
                                }
                            }


                            var $whyPanel = rindow.find('div.rdr_whyPanel div.rdr_body');
                            var $whyPanel_body = rindow.find('div.rdr_whyPanel div.rdr_body');
                            var $whyPanel_body_jsp = $whyPanel_body.find('.jspPane');
                            
                            var $whyPanel_panelCard = $('<div />').addClass('rdr_panelCard rdr_panelCard'+int_id);
                            $whyPanel_panelCard.data({
                                'tagID':tag.id,
                                'intactID':int_id
                            });


                            //$whyPanel_body.empty();
                        
                            //add to the $whyPanel_body and hide any sibling panels that have been made;
                            if($whyPanel_body_jsp.length){
                                $whyPanel_panelCard.appendTo($whyPanel_body_jsp);
                            }else{
                                $whyPanel_panelCard.appendTo($whyPanel_body);
                            }
                            $whyPanel_panelCard.siblings('.rdr_panelCard').hide();


                            $whyPanel.find('h1').text('Bookmark Saved');
                            
                            //build $whyPanel_panelCard
                            var $tagFeedback = $('<div class="rdr_tagFeedback">You bookmarked this and tagged it: <strong>'+tag.body+'</strong></div>');
                            var $undoLink = $('<a style="text-decoration:underline;" href="javascript:void(0);">Undo</a>')//chain
                            .bind('click.rdr', {args:args, int_id:int_id}, function(event){
                                // RDR.actions.unrateSend(args); 
                                var args = event.data.args;
                                
                                var newArgs = {    
                                    content_node_data: args.content_node_data,
                                    hash: hash,
                                    int_id: event.data.int_id,
                                    tag: args.tag,
                                    rindow: args.rindow
                                };
                                RDR.actions.interactions.ajax( newArgs, 'bookmark', 'remove' );
                                
                            });

                            // TODO make this link to the user profile work
                            var $seeTags = $('<div class="rdr_sntPnl_padder"><div>Your bookmarks are private - only you can see them.</div><br/ ><strong>To view your bookmarks, visit your <a href="'+RDR_baseUrl+'/user/'+RDR.user.user_id+'" target="_blank">ReadrBoard profile</a>.</strong></div>');
                            
                            $whyPanel_panelCard.append(
                                $tagFeedback.append($undoLink),
                                $seeTags
                            );
                            

                            var usrMsgArgs = {      
                                msgType: "interactionSuccess",
                                interactionInfo: {
                                    type: 'bookmark',
                                    body: tag.body
                                },
                                rindow:rindow
                            };

                            //queued up to be released in the sharestart function after the animation finishes    
                            rindow.queue('userMessage', function(){
                                RDR.session.rindowUserMessage.show( usrMsgArgs );
                            });



                            //(tag success expand the comment section)                            
                            RDR.actions.panel.expand("whyPanel", rindow);
                            
                        },
                        remove: function(args){
                            //RDR.actions.interactions.bookmark.onSuccess.remove:
                            
                            var rindow = args.rindow,
                                tag = args.tag,
                                int_id = args.int_id,
                                deleted_interaction_node = args.deleted_interaction.interaction_node;

                            var usrMsgArgs = {      
                                msgType: "interactionSuccess",
                                interactionInfo: {
                                    type: 'bookmark',
                                    body: deleted_interaction_node.body,
                                    remove: true
                                },
                                rindow:rindow
                            };
                            //queued up to be released in the sharestart function after the animation finishes    
                            rindow.queue('userMessage', function(){
                                RDR.session.rindowUserMessage.show( usrMsgArgs );
                            });

                            RDR.actions.panel.collapse("whyPanel", rindow);
                            var $thisTagButton = rindow.find('div.rdr_reactionPanel ul.rdr_tags li.rdr_int_node_'+int_id);
                            $thisTagButton.remove();
                        }
                    },
                    onFail: function(args){
                        //RDR.actions.interactions.bookmark.onFail:

                        //todo: we prob want to move most of this to a general onFail for all interactions.
                        // So this function would look like: doSpecificOnFailStuff....; RDR.actions.interactions.genericOnFail();

                        var rindow = args.rindow,
                            tag_li = args.tag;

                        var response = args.response;

                        //clear the loader                  
                        tag_li.find('div.rdr_tag_count').removeClass('rdr_kill_bg').find('.rdr_loader').remove();


                        if ( response.message.indexOf( "Temporary user interaction limit reached" ) != -1 ) {
                            //[cleanlogz]('uh oh better login, tempy 1');
                            RDR.session.showLoginPanel( args );
                        } else {
                            // if it failed, see if we can fix it, and if so, try this function one more time
                            RDR.session.handleGetUserFail( args, function() {
                                RDR.actions.interactions.ajax( args, 'bookmark', 'create' );
                            });
                        }
                    }
                }
                //end RDR.actions.interactions
            },
            indicators: {
                show: function(hashes, boolDontFade){
                    //RDR.actions.indicators.show:
                    //todo: boolDontFade is a quick fix to not fade in indicators
                    //hashes should be an array or a single hash string
                    var $indicators = this.fetch(hashes);
                    //todo: this works for now, but use a differnet signal later
                    if ( $indicators.length == 1 ) $indicators.removeClass('rdr_dont_show');

                    // var textIndicatorOpacity = ( !$.browser.msie ) ? '0.4':'1.0';
                    var textIndicatorOpacity = ( !$.browser.msie ) ? '1.0':'1.0';

                    $indicators.not('.rdr_dont_show').css({
                        'opacity':'0',
                        'visibility':'visible'
                    });
                    if(boolDontFade){
                        $indicators.not('.rdr_dont_show').css({
                            'opacity':textIndicatorOpacity
                        });
                        return;
                    } else {
                        $indicators.filter('div.rdr_indicator_for_text').not('.rdr_dont_show').stop().fadeTo(800, textIndicatorOpacity);
                        $indicators.filter('div.rdr_indicator_for_media').not('.rdr_dont_show').stop().fadeTo(800, 0.4);
                    }

                    //use stop to ensure animations are smooth: http://api.jquery.com/fadeTo/#dsq-header-avatar-56650596
                },
                hide: function(hashes){
                    //RDR.actions.indicators.hide:
                    //hashes should be an array or a single hash string
                    //it fails gracefully if there are no indicators for the hashed container ( $indcators will just be empty and do nothing )
                    var $indicators = this.fetch(hashes);
                    $indicators.css({
                        'opacity':'0',
                        'visibility':'hidden'
                    });
                },
                fetch: function(hashOrHashes){
                    //RDR.actions.indicators.fetch:
                    //a helper to get an $indicators obj from a hash or list of hashes
                    var $indicators = $();
                    if( typeof hashOrHashes === "string" ){
                        var hash = hashOrHashes;
                        $indicators = $('#rdr_indicator_'+hash);
                    }
                    else{
                        //should be an array of hashes
                        var hashes = hashOrHashes;
                        $.each(hashes, function(idx, hash){
                            $indicators = $indicators.add( $('#rdr_indicator_'+hash) );
                        });                        
                    }
                    return $indicators;
                },
                init: function(hash){
                    //RDR.actions.indicators.init:
                    //note: this should generally be called via RDR.actions.containers.setup
                    var scope = this;
                    var summary = RDR.summaries[hash],
                        kind = summary.kind,
                        $container = summary.$container,                    
                        indicatorId = 'rdr_indicator_'+hash,
                        indicatorBodyId = 'rdr_indicator_body_'+hash,
                        indicatorDetailsId = 'rdr_indicator_details_'+hash;

                    // don't insert floating pins for page-level interactions
                    if ( $container.hasClass('rdr-page-container') ) return;
                    //else

                    //check for and remove any existing indicator and indicator_details and remove for now.
                    //this shouldn't happen though.
                    //todo: solve for duplicate content that will have the same hash.
                    $('#'+indicatorId, '#'+indicatorDetailsId).each(function(){
                        $(this).remove();
                    });

                    var $indicator = summary.$indicator = $('<div class="rdr_indicator" />').attr('id',indicatorId);
                    //init with the visibility hidden so that the hover state doesn't run the ajax for zero'ed out indicators.
                    $indicator.css('visibility','hidden');

                    
                    var has_inline_indicator = $container.data('inlineIndicator'); //boolean
                    
                    if(has_inline_indicator){
                        _setupInlineIndicators();
                    }else{
                        _setupAbsoluteIndicators();
                    }
                    
                    //run setup specific to this type
                    scope.utils.kindSpecificSetup[kind]( hash );
                    RDR.actions.indicators.update(hash);

                    //todo: combine this with the kindSpecificSetup above right?
                    if (kind == 'text'){
                        _setupTriggerToFetchContentNodes();
                    }
                    
                    function _setupAbsoluteIndicators(){
                        //$indicator_body is used to help position the whole visible part of the indicator away from the indicator 'bug' directly at 
                        var $indicator_body = summary.$indicator_body = $('<div class="rdr rdr_indicator_body" />').attr('id',indicatorBodyId)//chain
                        .appendTo($indicator)//chain
                        .append(
                            '<img src="'+RDR_staticUrl+'widget/images/blank.png" class="no-rdr rdr_pin" />',
                            '<span class="rdr_count" />' //the count will get added automatically later, and on every update.
                        )//chain
                        .data( {'which':hash} );

                        //Setup the indicator_details and append them to the #rdr_indicator_details div attached to the sandbox.
                        //These details are shown and positiond upon hover over the indicator which lives inline appended to the container.
                        var $indicator_details = summary.$indicator_details = $('<div />').attr('id',indicatorDetailsId)//chain
                        .addClass('rdr rdr_indicator_details rdr_widget rdr_widget_bar')//chain
                        .appendTo('#rdr_indicator_details_wrapper');

                        $indicator.hover(
                            function() {

                                //shouldn't need this if anymore - make sure visibility:hidden consistently disables hover event.
                                if( !$indicator_details.children().length ) return;
                                //else
                                if ( $indicator_details.data('freshlyKilled')) return false;
                                //else
                                var indicatorOffsets = $indicator_body.offset();

                                // if ( indicatorOffsets.top == 0 )
                                // rdr_indicator_631eb4d994595a8a3ec836f71a1d88a3
                                $indicator_details.css({
                                    'top': indicatorOffsets.top,
                                    'left': indicatorOffsets.left
                                });

                                $indicator_details.data( 'top', indicatorOffsets.top );
                                $indicator_details.data( 'left', indicatorOffsets.left );

                                if ( kind != "text" ) $indicator_details.show();
                            },
                            function() {
                                $indicator_details.data( 'freshlyKilled', false);
                                //$indicator_details.show(); //[eric] commenting this out: I don't think this makes sense here.
                            }
                        );

                        $indicator_details.click( function() {
                            //store it's offset in data(), because offset doesn't work if the node is hidden.  It was giving me problems before
                            // $indicator_details.data( 'top', $indicator_details.offset().top );
                            // $indicator_details.data( 'left', $indicator_details.offset().left );
                            $indicator_details.data( 'freshlyKilled', true);
                            var selStates = $(this).data('selStates');

                            $indicator_details.hide();
                            RDR.rindow.make( "readMode", {hash:hash} );
                        })//chain
                        .hover(
                            function() {
                                var timeout = $(this).data('timeout');
                                clearTimeout(timeout);
                            },
                            function() {
                                var $this = $(this);
                                var timeout = setTimeout(function(){
                                    $this.fadeOut(300);
                                },500);
                                $(this).data('timeout', timeout);
                            }
                        );
                    }
                    function _setupInlineIndicators(){
                        //$indicator_body is used to help position the whole visible part of the indicator away from the indicator 'bug' directly at 
                        var $indicator_body = summary.$indicator_body = $('<div class="rdr rdr_indicator_body" />').attr('id',indicatorBodyId)//chain
                        .appendTo($indicator)//chain
                        .append(
                            '<img src="'+RDR_staticUrl+'widget/images/blank.png" class="no-rdr rdr_pin" />',
                            '<span class="rdr_count" />' //the count will get added automatically later, and on every update.
                        )//chain
                        .data( {'which':hash} );

                        //Setup the indicator_details and append them to the #rdr_indicator_details div attached to the sandbox.
                        //These details are shown and positiond upon hover over the indicator which lives inline appended to the container.
                        var $indicator_details = summary.$indicator_details = $('<div />').attr('id',indicatorDetailsId)//chain
                        .addClass('rdr rdr_indicator_details rdr_widget rdr_widget_bar')//chain
                        .appendTo('#rdr_indicator_details_wrapper');
                        
                        var $container = summary.$container;

                        //used for the rindow draw
                        //store it's offset in data(), because offset doesn't work if the node is hidden.  It was giving me problems before
                        $indicator_details.data( 'top', $container.offset().bottom );
                        $indicator_details.data( 'left', $container.offset().left );
                                                

                        //todo: DC: Temp hack for DC slideshow
                        $container.find('.slideCredit').css({
                            'margin-top':'25'
                        });

                        $indicator_details.show()//chain
                        .click( function() {
                            var selStates = $(this).data('selStates');

                            RDR.rindow.make( "readMode", {hash:hash} );
                        });
                        $indicator.css('visibility','visible');
                    }

                    function _setupTriggerToFetchContentNodes(){
                        //Note that the text indicators still don't have content_node info.
                        //The content_nodes will only be populated and shown after hitting the server for details triggered by $indicator mouseover.
                        //Setup callback for a successful fetch of the content_nodes for this container
                        var onSuccessCallback = function(){
                            $indicator.unbind('mouseover.contentNodeInit');
                            RDR.actions.indicators.utils.setupContentNodeHilites(hash);

                            $indicator.bind('mouseover.showRindow', function(){
                                var selStates = $(this).data('selStates');

                                RDR.rindow.make( "readMode", {hash:hash} );
                            });
                            $indicator.triggerHandler('mouseover.showRindow');
                        };
                        //bind the hover event that will only be run once.  It gets removed on the success callback above.
                        $indicator.bind('mouseover.contentNodeInit', function(){
                            RDR.actions.content_nodes.init(hash, onSuccessCallback);
                        });
                    }
                },
                update: function(hash){
                    //RDR.actions.indicators.update:
                    
                    var scope = this;

                    var summary = RDR.summaries[hash];
                    //check if $indicator does not exist and run scope.init if needed. 
                    if( !summary.hasOwnProperty('$indicator') ){
                        //init will add an $indicator object to summary and then re-call update.  This failsafe isn't really needed..
                        summary.$indicator = "infinte loop failsafe.  This will get overritten immediately by the indicators.init function.";
                        RDR.actions.indicators.init(hash);
                    }

                    var $container = summary.$container,
                        $indicator = summary.$indicator,
                        $indicator_body = summary.$indicator_body,
                        $indicator_details = summary.$indicator_details;

                    

                    //check if the total is 0.  If so, just return here.
                    if(summary.counts.interactions <= 0) return;
                    //else
                                        
                    //$indicator_body is used to help position the whole visible part of the indicator away from the indicator 'bug' directly at 
                    var $count = $indicator_body.find('.rdr_count');
                    $count.html( RDR.util.prettyNumber( summary.counts.tags ) );

                    //build tags in $tagsList.  Use visibility hidden instead of hide to ensure width is measured without a FOUC.
                    $indicator_details.css({ 'visiblity':'hidden' }).show();
                    scope.utils.makeDetailsContent( hash );

                    var kind = summary.kind;
                    
                    $indicator_details.css({ 'visiblity':'visible' }).hide();
                    //note that rdr_indicator_for_media_inline have an !important in the css so they won't get hidden.
                              
                },
                utils:{
                    //RDR.actions.indicators.utils:
                    kindSpecificSetup:{
                        img: function( hash ){
                            var summary = RDR.summaries[hash],
                                $container = summary.$container,
                                $indicator = summary.$indicator,
                                $indicator_body = summary.$indicator_body,
                                $indicator_details = summary.$indicator_details,
                                $container_tracker_wrap = $('#rdr_container_tracker_wrap'),
                                $container_tracker = $('<div class="rdr_container_tracker" />');

                            var has_inline_indicator = $container.data('inlineIndicator'); //boolean
    
                            $container_tracker.attr('id', 'rdr_container_tracker_'+hash).appendTo($container_tracker_wrap);
                            //position the containerTracker at the top left of the image or videos.  We'll position the indicator and hiliteborder relative to this.
                            
                            if(has_inline_indicator){
                                //todo: consider using a plugin pattern for this later if we want the publisher to be able to customize this in detail.
                                _inlineIndicatorSetup();
                            }
                            else{
                                _standardSetup();
                            }
                            _commonSetup();

                            RDR.actions.indicators.utils.updateContainerTracker(hash);

                            function _commonSetup(){
                                $indicator_details.addClass('rdr_indicator_details_for_media').hover(
                                    function() {
                                        $(this).data('hover', true).addClass('rdr_hover');
                                    },
                                    function() {
                                        $(this).data('hover', false).removeClass('rdr_hover');
                                    }
                                );
                            }

                            function _inlineIndicatorSetup(){
                                $indicator.appendTo($container_tracker);
                                $indicator.addClass('rdr_indicator_for_media rdr_indicator_for_media_inline'); 

                                $indicator.hover(
                                    function(){
                                        $(this).addClass('rdr_engage_media');
                                    },function(){
                                        $(this).removeClass('rdr_engage_media');
                                    }
                                );

                                $indicator_details.addClass('rdr_indicator_details_for_media_inline');
                            }

                            function _standardSetup(){
                                $indicator.appendTo($container_tracker);
                                $indicator.addClass('rdr_indicator_for_media');
                                
                                $indicator.hover(
                                    function() {
                                        $indicator_details.css({
                                            'width': 'auto'
                                        });                     
                                        
                                        var indDetailsWidth = $indicator_details.width(),
                                        indDetailsLeftOffset = $indicator_body.offset().left + $indicator_body.width() - indDetailsWidth + 8; //account for padding and border 

                                        $indicator_details.css({
                                            'width': 10
                                        });
                                        $indicator_details.stop().animate({
                                            'left': indDetailsLeftOffset,
                                            'width': indDetailsWidth
                                        },200);

                                    },
                                    function() {
                                    }
                                );
                            }
                        },
                        media: function( hash ){
                            //for now just treat it like an img
                            this.img( hash );
                        },
                        text: function( hash ){
                            var summary = RDR.summaries[hash],
                                $container = summary.$container,
                                $indicator = summary.$indicator,
                                $indicator_body = summary.$indicator_body,
                                $indicator_details = summary.$indicator_details,
                                $actionbar = $('rdr_actionbar_'+hash);


                            $indicator.addClass('rdr_indicator_for_text').addClass('rdr_dont_show');
                            $indicator_details.addClass('rdr_indicator_details_for_text');

                            $indicator.appendTo($container);

                        }
                    },
                    makeDetailsContent: function( hash ){
                        //RDR.actions.indicators.utils.makeDetailsContent:
                        var scope = this;
                        var summary = RDR.summaries[hash],
                            $container = summary.$container,
                            $indicator = summary.$indicator,
                            $indicator_body = summary.$indicator_body,
                            $indicator_details = summary.$indicator_details,
                            $actionbar = $('rdr_actionbar_'+hash);

                        var $indicator_details_body = $('<div class="rdr rdr_indicator_details_body" />'),
                            $indicator_details_innerWrap = $('<div class="rdr rdr_indicator_details_innerWrap" />'),
                            categoryTitleText = (summary.counts.tags == 1) ? "&nbsp;reaction:&nbsp;" : "&nbsp;reactions:&nbsp;",
                            categoryTitle = '<span class="rdr_indicator_categoryTitle">' +categoryTitleText+ '</span>',
                            $tagsList = $('<div class="rdr_tags_list" />');

                        
                        $indicator_details_body.html( $indicator_body.html() );

                        //use an innerWrap so that we can move padding to that and measuring the width of the indicator_details will be consistent
                        $indicator_details.empty().append( $indicator_details_innerWrap );
                        $indicator_details_innerWrap.append( $indicator_details_body, categoryTitle, $tagsList );

                        //builds out the $tagsList contents
                        scope.makeTagsList( hash );
                        //I ususally prefer the format: "$tagsList = _makeTagsList()" where the function returns the $() object,
                        //but we need the function to register the nodes in the DOM in order to calc width.
                    },
                    makeTagsList: function( hash ){
                        var summary = RDR.summaries[hash],
                            $indicator_details = summary.$indicator_details,
                            $container = summary.$container,
                            $tagsList = $indicator_details.find('.rdr_tags_list');

                        var has_inline_indicator = $container.data('inlineIndicator'), //boolean
                            tagsListMaxWidth,
                            buffer = 120, //for prefix and the "more..." span
                            count = 0; //used as a break statement below
                        
                        if(has_inline_indicator){
                            tagsListMaxWidth = $indicator_details.outerWidth();
                        }else{
                            tagsListMaxWidth = 300;
                        }
                        
                        $.each( summary.interaction_order.tags, function( idx, tagOrder ){
                            var tag = summary.top_interactions.tags[ tagOrder.id ];

                            
                            if(count === null) return; //a helper incrementer, set to 'null' below to mimic a 'break' out of the 'each' loop 
                            if( !tag || tag.count < 0) return; //this shouldn't happen, should be taken care of in summaries.update.  But just in case.

                            var $prefix = count ? $('<span>, </span>') : $(), //check for count to omit the comma prefix on the first case.
                                $tag = $('<strong/>').append(tag.body),
                                $count = $('<em/>').append( ' ('+tag.count+')' ),
                                $span = $('<span />').addClass('rdr_tags_list_tag');

                            $span.append( $tag, $count).data('id',tagOrder.id).data('selStates',[]);


                            $tagsList.append( $prefix, $span );

                            // the tag list will NOT line wrap.  if its width exceeds the with of the image, show the "click to see more" indicator
                            if ( $tagsList.width() > ( tagsListMaxWidth - buffer ) ) {
                                //the tag pushed the length over the limit, so kill it, and replace with ...
                                $span.remove();
                                $prefix.remove();
                                var $moreText = $('<span>...</span>').addClass('rdr_see_more');
                                $tagsList.append($moreText);
                                //signal the rest of the each loop to just return;
                                count = null;
                                return;
                            }
                            count++;
                            
                        });
                    },
                    setupContentNodeHilites: function( hash ){
                        //RDR.actions.indicators.utils.setupContentNodeHilites:
                        var summary = RDR.summaries[hash],
                            content_nodes = summary.content_nodes,
                            $indicator_details = summary.$indicator_details,
                            $tags = $indicator_details.find('.rdr_tags_list_tag');

                        var invertedDict = RDR.actions.content_nodes.utils.makeDictSortedByTag( content_nodes );
                        
                        $tags.each(function(){
                            var tag_id = $(this).data('id');
                            var relevant_content_nodes = invertedDict[tag_id];
                            RDR.actions.content_nodes.utils.initHiliteStates( $(this), relevant_content_nodes );
                        });
                    },
                    updateContainerTrackers: function(){
                        $.each( RDR.containers, function(idx, container) {
                            if ( container.kind && ( container.kind == "img" || container.kind == "media" ) ) {
                                RDR.actions.indicators.utils.updateContainerTracker( container.hash );
                            }
                        });
                    },
                    updateContainerTracker: function(hash){
                        //RDR.actions.indicators.utils.updateContainerTracker:
                        var summary = RDR.summaries[hash],
                            $container = summary.$container,
                            $container_tracker = $('#rdr_container_tracker_'+hash);
                        
                        var padding = {
                            top: parseInt( $container.css('padding-top'), 10 ),
                            right: parseInt( $container.css('padding-right'), 10 ),
                            bottom: parseInt( $container.css('padding-bottom'), 10 ),
                            left: parseInt( $container.css('padding-left'), 10 )
                        };

                        var hasBorder = parseInt( $container.css('border-top-width'), 10 ) + 
                            parseInt( $container.css('border-bottom-width'), 10 ) + 
                            parseInt( $container.css('border-left-width'), 10 ) + 
                            parseInt( $container.css('border-right-width'), 10 );

                        var paddingOffset = {};
                        paddingOffset.top = !hasBorder ? padding.top : 0;
                        paddingOffset.left = !hasBorder ? padding.left : 0;

                        //compensate for padding - which we want to ignore
                        RDR.util.cssSuperImportant($container_tracker, {
                            top: $container.offset().top + paddingOffset.top,
                            left: $container.offset().left + paddingOffset.left
                        });
                        
                        this.updateMediaTracker(hash);
                        this.borderHilites.update(hash);
                        
                    },
                    updateInlineIndicator: function(hash){
                        //RDR.actions.indicators.utils.updateInlineIndicator:
                        var summary = RDR.summaries[hash],
                            $container = summary.$container,
                            $indicator_details = summary.$indicator_details;

                        $indicator_details.css({
                           top: $container.offset().bottom,
                           left: $container.offset().left,
                           width:$container.outerWidth()
                        });
                    },
                    updateMediaTracker: function(hash){
                        //RDR.actions.indicators.utils.updateMediaTracker:
                        var summary = RDR.summaries[hash],
                            $container = summary.$container,
                            $indicator = summary.$indicator,
                            $indicator_body = summary.$indicator_body,
                            $indicator_details = summary.$indicator_details,
                            $container_tracker = $('#rdr_container_tracker_'+hash);

                        if ( $indicator_body ) {
                            //todo: consolodate this with the other case of it
                            var containerWidth, containerHeight;
                            //this will calc to 0 if there is no border. 
                            var hasBorder = parseInt( $container.css('border-top-width'), 10 ) + 
                                parseInt( $container.css('border-bottom-width'), 10 ) + 
                                parseInt( $container.css('border-left-width'), 10 ) + 
                                parseInt( $container.css('border-right-width'), 10 );

                            if(hasBorder){
                                containerWidth = $container.outerWidth();
                                containerHeight = $container.outerHeight();
                            }else{
                                containerWidth = $container.width();
                                containerHeight = $container.height();
                            }
                            
                            var padding = {
                                top: parseInt( $container.css('padding-top'), 10 ),
                                right: parseInt( $container.css('padding-right'), 10 ),
                                bottom: parseInt( $container.css('padding-bottom'), 10 ),
                                left: parseInt( $container.css('padding-left'), 10 )
                            };

                            var cornerPadding = 8,
                                indicatorBodyWidth = $indicator_body.width();
                            
                            $indicator.css({
                                top: 0,
                                left: containerWidth
                            });

                            RDR.util.cssSuperImportant($indicator_body, {
                                top: cornerPadding,
                                right: cornerPadding
                            });

                            var has_inline_indicator = $container.data('inlineIndicator'); //boolean                        
                            if(has_inline_indicator){
                                RDR.actions.indicators.utils.updateInlineIndicator(hash);
                            }else{
                                
                            }
                        }  
                    },
                    borderHilites: {
                        makeAttempt: 0, //this isn't really needed, just an extra failsave against an infinite loop that shouldn't happen.
                        make: function(hash){
                            //RDR.actions.indicators.utils.borderHilites.make:
                            var $indicator = $('#rdr_indicator_'+hash),
                                $container = $('.rdr-'+hash),
                                $container_tracker = $('#rdr_container_tracker_'+hash),
                                $mediaBorderWrap = $container_tracker.find('.rdr_media_border_wrap'); //probably null, will make it below.
                            
                            if( !$mediaBorderWrap.length ){
                                $mediaBorderWrap = $('<div class="rdr_media_border_wrap" />').appendTo($container_tracker);
                            }
                            $mediaBorderWrap.hide(); //start with it hidden.  It will fade in on hover

                            var borders = {
                                'top': {
                                    $side: null,
                                    css: {}
                                },
                                'right': {
                                    $side: null,
                                    css: {}
                                },
                                'bottom': {
                                    $side: null,
                                    css: {}
                                },
                                'left': {
                                    $side: null,
                                    css: {}
                                }
                            };

                            $mediaBorderWrap.data('borders',borders);
                            RDR.actions.indicators.utils.borderHilites.update(hash);

                        },
                        update: function(hash){
                            //RDR.actions.indicators.utils.borderHilites.update:
                            var $indicator = $('#rdr_indicator_'+hash),
                                $container = $('.rdr-'+hash),
                                $container_tracker = $('#rdr_container_tracker_'+hash),
                                $mediaBorderWrap = $container_tracker.find('.rdr_media_border_wrap');
                            
                            if( !$mediaBorderWrap.length ){
                                //failsafe that shouldnt be needed.
                                if( this.makeAttempt > 1 ) return;
                                this.makeAttempt ++;
                                RDR.actions.indicators.utils.borderHilites.make(hash);
                                //just return here.  the make function will call this update function again and this will be bypassed.
                                return;
                            }
                            //else
                            this.makeAttempt = 0;

                            $mediaBorderWrap.hide(); //start with it hidden.  It will fade in on hover

                            var borders = {
                                'top': {
                                    $side: null,
                                    css: {}
                                },
                                'right': {
                                    $side: null,
                                    css: {}
                                },
                                'bottom': {
                                    $side: null,
                                    css: {}
                                },
                                'left': {
                                    $side: null,
                                    css: {}
                                }
                            };
                            
                            var hiliteThickness = 2,
                                containerWidth,
                                containerHeight;

                            var hasBorder = false;
                            //for checking if it has a border.
                            //If so we'll use outerWidth and outerHeight to take it into account.
                            //If not, we use just the regular height and width so we'll ignore padding which would make the borderHilite look crappy.

                            $.each( borders, function(side, data){
                                //set the value in the object using the key's string as a helper
                                var hiliteClass = 'rdr_mediaHilite_'+side; //i.e. rdr_mediaHilite_top
                                
                                data.$side = $mediaBorderWrap.find('.'+hiliteClass);
                                if( !data.$side.length ){
                                    data.$side = $('<div />').addClass(hiliteClass).appendTo($mediaBorderWrap);
                                }

                                //if any side has a border - set hasBorder to true
                                if( parseInt( $container.css('border-'+side+'-width'), 10 ) ){
                                    hasBorder = true;
                                }

                            });
                            
                            //figure out dims
                            if(hasBorder){
                                containerWidth = $container.outerWidth();
                                containerHeight = $container.outerHeight();
                            }else{
                                containerWidth = $container.width();
                                containerHeight = $container.height();
                            }

                            //use dims to make the css rules for each border side
                            borders.top.css = {
                                width: containerWidth,
                                height: 0,
                                top: -hiliteThickness,
                                left: -hiliteThickness
                            };
                            borders.right.css = {
                                width:0,
                                height: containerHeight,
                                top: 0,
                                left: containerWidth
                            };
                            borders.bottom.css = {
                                width: containerWidth,
                                height: 0,
                                top: containerHeight,
                                left: -hiliteThickness
                            };
                            borders.left.css = {
                                width: 0,
                                height: containerHeight,
                                top: 0,
                                left: -hiliteThickness
                            };

                            $.each( borders, function( side, data ){
                                RDR.util.cssSuperImportant( data.$side, data.css );
                            });                       
                    
                        }
                    }
                }//end RDR.actions.indicators.utils
            },
            summaries:{
                hack: {
                    updateCommentSet: function(args) {
                        var rindow = args.rindow,
                            tag = args.tag,
                            hash = args.hash,
                            user = args.user;

                        var $whyPanel = rindow.find('div.rdr_whyPanel'),
                            $whyPanel_body = $whyPanel.find('div.rdr_body'),
                            $whyPanel_body_jsp = $whyPanel_body.find('.jspPane'),
                            $whyPanel_panelCard = $whyPanel_body_jsp.find('div.rdr_panelCard');

                        var $otherComments = ( rindow.find('div.rdr_otherCommentsBox').length == 1 ) ? rindow.find('div.rdr_otherCommentsBox') : $('<div class="rdr_otherCommentsBox rdr_sntPnl_padder"></div>').hide().html(
                        '<div><h4>(<span>0</span>) Comment:</h4></div>').appendTo($whyPanel_panelCard);

                        $otherComments.show();
                        $otherComments.find('h4 span').text( parseInt( $otherComments.find('h4 span').text() ) + 1 );
                            
                        var $commentSet = $('<div class="rdr_commentSet" />'),
                            $commentBy = $('<div class="rdr_commentBy" />'),
                            $comment = $('<div class="rdr_comment" />'),
                            $commentReplies = $('<div class="rdr_commentReplies" />'),
                            $commentReply = $('<div class="rdr_commentReply" />'),
                            $commentReply_link = $('<a href="javascript:void(0);">Reply</a>');
                        var user_image_url = ( user.img_url ) ? user.img_url: ''+RDR_staticUrl+'widget/images/anonymousplode.png';
                        var user_name = "You";
                        $commentBy.html( '<img src="'+user_image_url+'" class="no-rdr" /> ' + user_name );
                        $comment.html( '<div class="rdr_comment_body">"'+args.comment+'"</div>' );

                        $commentSet.append( $commentBy, $comment ); // , $commentReplies, $commentReply 
                        $otherComments.append( $commentSet );

                        var comment = {
                            body:args.comment,
                            // content_id:
                            id:args.response.data.interaction.id,
                            social_user : {
                                full_name:"You",
                                img_url:user_image_url,
                                user: {
                                    first_name:"You",
                                    id:user.user_id,
                                    last_name:""
                                }
                            },
                            tag_id:tag.id,
                            user: {
                                first_name:"You",
                                id:user.user_id,
                                last_name:""
                            }
                        };

                        if ( typeof RDR.summaries[hash].top_interactions.coms[tag.id] == "undefined" ) {
                            RDR.summaries[hash].top_interactions.coms[tag.id] = [];
                            // RDR.summaries[hash].top_interactions.coms[tag.id].count = 0;
                        }
                        RDR.summaries[hash].top_interactions.coms[tag.id].push( comment );

                    }
                },
                init: function(hash){
                    //RDR.actions.summaries.init:

                    //todo: it might make sense to just get this from the backend, since it has a function to do this already.
        
                    //data is in form {body:,kind:,hash:}
                    //todo: combine with above
                    var container = RDR.containers[hash];

                    //create an 'empty' summary object
                    var summary = {
                        "hash": hash,
                        "kind": container.kind,
                        "id": container.id,
                        "counts": {
                            "coms": 0, 
                            "tags": 0, 
                            "interactions": 0
                        }, 
                        "top_interactions": {
                            "coms": {}, 
                            "tags": {}
                        }
                    };
                    //dont save anymore
                    //RDR.actions.summaries.save(summary);

                    return summary;
                },
                save: function(summary){
                    //RDR.actions.summaries.save:
                        
                    var hash = summary.hash;
                    if( RDR.summaries.hasOwnProperty(hash) ){
                    }
                    //save the summary and add the $container as a property
                    RDR.summaries[hash] = summary;
                    summary.$container = $('.rdr-'+hash);

                    RDR.actions.summaries.sortInteractions(hash);
                                
                },
                update: function(hash, diff){
                    //RDR.actions.summaries.update:
                    /*
                    //EXAMPLE: diff object.  keep commented out, but leave it here.
                    var diff = {   
                        coms: {
                        },
                        tags: {
                            //this should be an obj: { 'id':{body:body, count:count, id:id} } where count should be 1 for add a new one, or -1 for remove it.
                            '2':{
                                'body':"Tag!!",
                                'delta':1, //this should always be 1 or -1.  Note there is no count attr, just the diff.
                                'id':id,
                                'parent_id':parent_id
                            }
                        }
                    }
                    */

                    
                    //get summary, or if it doesn't exist, get a zero'ed out template of one.

                    //todo: use a try catch instead;
                    var summary;
                    if( !RDR.summaries.hasOwnProperty(hash) ){
                        summary = RDR.actions.summaries.init(hash);
                    }else{
                        summary = RDR.summaries[hash];
                    }
                    
                    //todo: not sure if this is being used. - no it's not being used yet.  never got to it.
                    // if( hash == "pageSummary" ){
                        //waaaiatt a minute... this isn't a hash.  Page level,...Ugly...todo: make not ugly
                        // summary = RDR.util.getPageProperty ('summary');
                    // }

                    $.each( diff, function(interaction_node_type, nodes){
                        // This is now scoped to node_type - so nodes, summary_nodes, and counts here only pertain to their category (tag or comment, etc.)
                        var summary_nodes = summary.top_interactions[interaction_node_type];

                        //todo: i realized that coms are in an array and tags are in an object, so we have to split this way up here.  Change later.
                    
                            //will usually be just one interaction_node passed in, but can acoomodate a diff with many interaction_nodes
                        $.each(nodes, function(id,diffNode){
                            //coms or tags
                            if( summary_nodes.hasOwnProperty(id) && typeof summary_nodes[id] !== 'undefined' ){
                                var summary_node = summary_nodes[id];
                                summary_node.count += diffNode.delta;

                                //if this cleared out the last of this node, delete it. (i.e. if a first-ever tag was made, and then undone )
                                if( summary_node.count <= 0 ){
                                    delete summary_nodes[id]; //don't try to use summary_node here instead of summary_nodes[id].
                                }

                            }else{
                                //tag doens't exist yet:
                                //todo: implement a diffNode.make function instead of this.
                                summary_nodes[id] = {
                                    body: diffNode.body,
                                    count: diffNode.delta, //this should always be 1.
                                    id: id,
                                    parent_id: diffNode.parent_id,
                                    parent_interaction_node: diffNode.parent_interaction_node
                                };

                            }

                            //update the summary's counts object
                            summary.counts[interaction_node_type] += diffNode.delta;
                            summary.counts.interactions += diffNode.delta;

                            diffNode.int_type = interaction_node_type;
                            //now update rindow
                            RDR.rindow.update(hash, diffNode);

                        });

                    });

                    RDR.actions.summaries.sortInteractions(hash);

                    if( hash == "pageSummary" ){
                        //waaaiatt a minute... this isn't a hash.  Page level,...Ugly...todo: make not ugly
                        makeSummaryWidget(RDR.page);
                    }else{     
                        
                        RDR.actions.indicators.update( hash );

                        //if(summary.counts.interactions > 0){ //we're only showing tags for now, so use that instead.
                        if(summary.counts.tags > 0){
                           RDR.actions.indicators.show(hash); //temp hack, 'true' is for 'dont fade in';   
                        }else{
                            RDR.actions.indicators.hide(hash); //if deleted back to 0
                        }

                        //now update the page.
                            //not working yet.  Page reads from a different kind of summary. 
                        //RDR.actions.summaries.update( 'pageSummary' );
                    }

                     //update the page summaries:
                    //$(document).rdrWidgetSummary('update');

                },
                sortInteractions: function(hash) {
                    // RDR.actions.summaries.sortInteractions
                    function SortByCount(a,b) { return b.count - a.count; }

                    var summary = RDR.summaries[hash];
                    summary.interaction_order = { coms:[], tags:[] };

                    var topTags = summary.top_interactions.tags,
                    topComs = summary.top_interactions.coms;

                    // tags
                    if ( !$.isEmptyObject( summary.top_interactions.tags ) ) {
                        $.each( topTags, function( tagID, tag ){
                            summary.interaction_order.tags.push( { id:tagID, count:tag.count } );
                        });
                    }
                    summary.interaction_order.tags.sort( SortByCount );

                    // comments
                    if ( !$.isEmptyObject( summary.top_interactions.coms ) ) {
                        $.each( topComs, function( comID, com ){
                            summary.interaction_order.coms.push( { id:comID, count:com.count } );
                        });
                    }
                    summary.interaction_order.coms.sort( SortByCount );

                },
                sortPopularTextContainers: function() {
                    // RDR.actions.summaries.sortPopularTextContainers
                    // only sort the most popular whitelisted 
                    function SortByCount(a,b) { return b.interactions - a.interactions; }

                    RDR.text_container_popularity = [];

                    $.each( RDR.summaries, function( hash, container ){
                        if ( container.kind == "text" && container.counts.interactions > 0 ) {
                            RDR.text_container_popularity.push( { hash:hash, interactions:container.counts.interactions } );
                        }
                    });

                    RDR.text_container_popularity.sort( SortByCount );

                },
                displayPopularIndicators: function () {
                    // RDR.actions.summaries.displayPopularIndicators

                    for ( var i=0; i < RDR.group.initial_pin_limit; i++) {
                        if ( RDR.text_container_popularity[i] ) $('#rdr_indicator_' + RDR.text_container_popularity[i].hash).removeClass('rdr_dont_show');
                    }
                },
                showLessPopularIndicators: function() {
                    // RDR.actions.summaries.showLessPopularIndicators
                    var hashesToShow = [];

                    for ( var i=RDR.group.initial_pin_limit; i<RDR.text_container_popularity.length; i++) {
                        if ( RDR.text_container_popularity[i] ) {
                            if ( RDR.text_container_popularity[i].interactions > 0 ) {
                                $('#rdr_indicator_' + RDR.text_container_popularity[i].hash).removeClass('rdr_dont_show');
                                hashesToShow.push( RDR.text_container_popularity[i].hash );
                            }
                        }
                    }
                    
                    RDR.actions.indicators.show(hashesToShow);
                }
            },
            insertContainerIcon: function( hash ) {},
            viewContainerReactions: function( hash ) {
                //Note: No longer used --> moved to RDR.rindow.make('readMode', options)
            },
            viewReactionContent: function(tag, hash, rindow){
                //temp reconnecting:
                var container = RDR.containers[hash];
                var summary = RDR.summaries[hash];
                
                var $reactionPanel = rindow.find('div.rdr_reactionPanel'),
                    $contentPanel = rindow.find('div.rdr_contentPanel'),
                    $whyPanel = rindow.find('div.rdr_whyPanel');

                // DONTNEED: $whyPanel.removeClass('rdr_whyShowing');


                /*
                var content = [];
                for ( var i in tag.body ) {
                    content.push( {idx:parseInt(i), tag_idx:tag.body[i].tag_idx, count:tag.id[i].count } );
                }
                */

                //todo: temp stuff
                var content = [];
                var content_nodes = summary.hasOwnProperty('content_nodes') ? summary.content_nodes : {}; //fail gracefully if content_node ajax fails.
                $.each( content_nodes, function(key, val){
                    content.push(val);
                });
                function SortByTagCount(a,b) { return b.counts.tags - a.counts.tags; }
                content.sort(SortByTagCount);

                //todo: consolodate truncate functions
                var maxHeaderLen = 20;
                var tagBody = tag.body.length > maxHeaderLen ? tag.body.slice(0, maxHeaderLen)+"..." : tag.body;

                $contentPanel.find('div.rdr_header h1').html(tagBody);

                // zero out the content in the whyPanel, since they just selected a new tag and the comments would not reflect the now-selected tag.
                // DONTNEED: if animating in whypanel:
                // DONTNEED: $whyPanel.find('div.rdr_header h1').html(tagBody + ": ");
                // DONTNEED: $whyPanel.find('div.rdr_body').html('<div class="rdr_commentSet rdr_panelCard rdr_panelCard_default ">Select something in the column to the left to leave a comment on it.</div>');

                //todo: this is for testing style for now, we need to swap it out when we click on the different sections
                //$contentPanel.find('div.rdr_header h1').after('<h2><span> : </span>todo: quote here ...</h2>');
                
                //todo: just a test - delete
                //$contentPanel.find('div.rdr_headerInnerWrap').append('<h2>test</h2>');
                
                if ( rindow.find('div.rdr_contentPanel div.rdr_body').data('jsp') ) rindow.find('div.rdr_contentPanel div.rdr_body').data('jsp').destroy();
                rindow.find('div.rdr_contentPanel div.rdr_body').empty();

                // tag.id = tag.id; // kludge
                var tagClone = $.extend({}, tag),
                    hashClone = hash;

                // ok, get the content associated with this tag!
                $.each(content, function(idx, node){
                    RDR.actions.content_panel.make(node, tagClone, hash, rindow);
                });

                RDR.actions.panel.collapse("whyPanel", rindow  );
                RDR.actions.panel.expand("contentPanel", rindow);
            },
            viewCommentContent: function(args){

                var tag = args.tag, 
                    rindow = args.rindow,
                    content_node = args.content_node;
                
                
                //temp tie-over    
                var hash = args.hash,
                    summary = RDR.summaries[hash],
                    kind = summary.kind; // text, img, media

                if ( args.selState ) var selState = args.selState;
                var view_all_state = (args.view_all_state) ? args.view_all_state:"show";

                var $whyPanel = rindow.find('div.rdr_whyPanel'),
                    $whyPanel_body = $whyPanel.find('div.rdr_body'),
                    $whyPanel_body_jsp = $whyPanel_body.find('.jspPane');
                
                // DONTNEED: $whyPanel.addClass('rdr_whyShowing');
                var int_id = "null"; //don't worry about this for now - we don't need it

                var $whyPanel_panelCard = $('<div />').addClass('rdr_panelCard rdr_panelCard'+int_id).addClass('rdr_viewAll_'+view_all_state);
                $whyPanel_panelCard.data({
                    'tagID':tag.id,
                    'intactID':int_id,
                    'content_node':content_node
                });
                //note: hover event on the whyPanel to hilite the content is done on the whole panel instead of just the panelCard,
                // because there is always only one panelCard showing, and it is not always the whole height.

                $whyPanel.find('div.rdr_view_all').remove();

                //I don't think we need this anymore
                $whyPanel_body.css({
                     top:0
                });
                
                if ( view_all_state != "hide" ) {
                    var $backToQuotes = $('<div class="rdr_view_all rdr_'+view_all_state+'">&lt;&lt; View All</div>');
                    $whyPanel.find('.rdr_body_wrap').append( $backToQuotes );
                    $whyPanel_body.css({
                         top:16
                    });
                    $backToQuotes.click( function() {
                        // $whyPanel.removeClass('rdr_whyShowing');
                        //rindow.find('div.rdr_contentPanel div.rdr_header h1 span').remove();
                        RDR.actions.panel.collapse("whyPanel", rindow, kind );
                    });
                }

                //$whyPanel_body.empty();

                if($whyPanel_body_jsp.length){
                    if ( view_all_state != "hide" ) {
                        //$whyPanel_body_jsp.before( $backToQuotes );
                    }
                    $whyPanel_panelCard.appendTo( $whyPanel_body_jsp );
                }else{
                    if ( view_all_state != "hide" ) {
                        //$whyPanel_panelCard.before( $backToQuotes );
                    }
                    $whyPanel_panelCard.appendTo($whyPanel_body);
                }
                $whyPanel_panelCard.siblings('.rdr_panelCard').hide();
                $whyPanel_panelCard.append( _makeInfoBox(content_node) );

                _makeHeaders();
                _makeOtherReactions();
                _makeOtherComments();

                $whyPanel_panelCard.append( _makeCommentBox() );


                //helper functions 
                function _makeHeaders(){
                    var maxHeaderLen = 35,
                        headerFullText,
                        abrvBodyText,
                        $headerBody;

                    //note: tag.body length should never be the full width
                    if ( kind != "img" && kind != "media" ) {
                        headerFullText = ""+tag.body + content_node.body;
                        abrvBodyText = content_node.body;
                        if( ( headerFullText.length ) > maxHeaderLen ){
                            abrvBodyText = content_node.body.slice(0, (maxHeaderLen - tag.body.length) ) +  "...";
                        }
                        $headerBody = $("<span class='rdr_tag_text'>"+tag.body+"</span> : <span class='rdr_contentNode_text'>" + abrvBodyText +"</span>");
                    } else {
                        $headerBody = "<span class='rdr_tag_text'>"+tag.body+"</span>";
                    }
                    
                    //trying this out:  I'm going to copy the same header into the whypanel, and then do some tricky hiding
                    // to make it look like the header slides in.
                    rindow.find('div.rdr_contentPanel div.rdr_header h1').html(tag.body);
                    rindow.find('div.rdr_whyPanel div.rdr_header h1').empty().append($headerBody);
                    rindow.find('div.rdr_whyPanel div.rdr_header span.rdr_tag_text').css('visibility','hidden');                    
                }
                function _makeOtherReactions(){
                    
                    function SortByCount(a,b) { return b.count - a.count; }

                    $whyPanel.find('div.rdr_otherTagsWrap').remove();
                    $whyPanel.find('.rdr_body').css({
                        bottom:0
                    });

                    var other_tags = [];
                    if ( kind == "text" ) {
                        for ( var i in content_node.top_interactions.tags ) {
                            if ( i != tag.id ) other_tags.push({ tag_id:i, count:content_node.top_interactions.tags[i].count, body:content_node.top_interactions.tags[i].body });
                        }
                    } else {
                        for ( var j in summary.top_interactions.tags ) {
                            if ( j != tag.id ) other_tags.push({ tag_id:j, count:summary.top_interactions.tags[j].count, body:summary.top_interactions.tags[j].body });
                        }
                    }

                    if ( other_tags.length > 0 ) {
                        other_tags.sort( SortByCount );
                        // we set this div far down, then animate it up, because position:fixed doesn't stay within a rindow, it stays within the browser viewport
                        var $otherTagsWrap = $('<div class="rdr_otherTagsWrap" />'),
                            $otherTags = $('<div class="rdr_otherTags" ><strong>Other Reactions:</strong>&nbsp;</div>');
                        $otherTags.appendTo($otherTagsWrap);

                        $whyPanel.find('.rdr_body_wrap').append( $otherTagsWrap );
                        $whyPanel.find('.rdr_body').css({
                            bottom:14
                        });

                        //todo: consolodate with other truncate functions
                        var count = 0, //a helper incrementer, set to 'null' below to mimic a 'break' out of each for loop 
                            tagsListMaxWidth = 300,
                            buffer = 20; //for the "other reactions" label and stuff
                        $.each( other_tags, function(key, tag){

                            if(count === null) return;
                            
                            var prefix = count ? ", " : "", //don't include the first time
                                $tag = $('<span/>').append(tag.body),
                                $count = $('<span/>').append( ' ('+tag.count+')' ),
                                $wrap = $('<span />').addClass('rdr_tags_list_tag');
                            $wrap.append( prefix, $tag, $count);
                            $otherTags.append( $wrap );

                            // the tag list will NOT line wrap.  if its width exceeds the with of the image, show the "click to see more" indicator
                            
                            if ( $otherTags.width() > ( tagsListMaxWidth - buffer ) ) {
                                //the tag pushed the length over the limit, so kill it, and replace with ...
                                $wrap.remove();
                                var $moreText = $('<span> ...</span>').addClass('rdr_see_more');
                                $otherTags.append($moreText);
                                //signal the rest of the each loop to just return;
                                count = null;
                                return;
                            }
                            count++;
                            
                        });
                    }
                }

                function _makeInfoBox(content_node){

                    var $socialBox = $('<div class="rdr_shareBox"><strong>Share It:</strong><div class="rdr_share_social" /></div>'), 
                    $shareLinks = $('<ul class="shareLinks"></ul>'),
                    socialNetworks = ["facebook","twitter", "tumblr"]; //,"tumblr","linkedin"];

                    var shareHash = hash;
                    //quick mockup version of this code
                    $.each(socialNetworks, function(idx, val){
                        $shareLinks.append('<li><a href="http://' +val+ '.com" ><img class="no-rdr" src="'+RDR_staticUrl+'widget/images/social-icons-loose/social-icon-' +val+ '.png" /></a></li>');
                        $shareLinks.find('li:last').click( function() {
                            // var real_content_node = ( RDR.content_nodes[hash] ) ? RDR.content_nodes[hash] : RDR.summaries[hash].content;
                            RDR.shareWindow = window.open(RDR_staticUrl+'share.html', 'readr_share','menubar=1,resizable=1,width=626,height=436');
                            RDR.actions.share_getLink({ hash:shareHash, kind:kind, sns:val, rindow:rindow, tag:tag, content_node:content_node });
                            return false;
                        });
                    });
                    $socialBox.append($shareLinks, '<div style="clear:both;" />');

                    var reaction_count, reaction_body;
                    if ( kind == "text" ) {
                        reaction_count = content_node.top_interactions.tags[ tag.id ].count;
                        reaction_body = content_node.top_interactions.tags[ tag.id ].body;
                    } else {
                        reaction_count = tag.count;
                        reaction_body = tag.body;
                    }

                    var peoples = (reaction_count>1) ? "people" : "person",
                        $reactionCount = $('<div class="rdr_reaction_count"><span>'+reaction_count+'</span> '+peoples+' reacted </div>').data('count', reaction_count),
                        $h4 = $('<h4>'+reaction_body+'</h4>').prepend($reactionCount),
                        $infoSummary = $('<div class="rdr_info_summary" />').append($h4);

                    // $tooltip = RDR.tooltip.draw({ "item":"vote_up","tipText":"Vote reaction up" }).addClass('rdr_top').hide();
                    // $infoSummary.append( $tooltip );

                    // $infoSummary.click( function() {
                    //     // click
                    //     args = { tag:tag, rindow:rindow, hash:hash, content_node:content_node, uiMode:'read'};
                    //     RDR.actions.interactions.ajax( args, 'tag', 'create' );
                    // });
                    // .hover( function() {
                    //     // hover
                    //     $(this).find('div.rdr_tooltip').show();
                    // }, function() {
                    //     // hover out
                    //     $(this).find('div.rdr_tooltip').hide();
                    // });

                    var $infoBox = $('<div />');
                    $infoBox.append( $infoSummary, $socialBox );
                    
                    return $infoBox;
                }

                function _makeCommentBox(){

                    //todo: combine this with the tooltip for the tags
                    // var $commentDiv =  $('<div class="rdr_comment"><textarea class="leaveComment">' + helpText+ '</textarea><button id="rdr_comment_on_'+tag.id+'">Comment</button></div>');
                    var $commentBox = $('<div class="rdr_commentBox rdr_sntPnl_padder"></div>').html(
                        '<div class="rdr_commentComplete"><div><h4>Leave a comment:</h4></div></div>'
                    );
                   //todo: combine this with the other make comments code
                    var helpText = "because...",
                        $commentDiv =  $('<div class="rdr_comment">'),
                        $commentTextarea = $('<textarea class="commentTextArea">' +helpText+ '</textarea>'),
                        $rdr_charCount =  $('<div class="rdr_charCount">'+RDR.group.comment_length+' characters left</div>'),
                        $submitButton =  $('<button id="rdr_comment_on_'+int_id.id+'">Comment</button>');
                    
                    $commentDiv.append( $commentTextarea, $rdr_charCount, $submitButton );
                    
                    $commentTextarea.focus(function(){
                        if( $(this).val() == helpText ){
                            $(this).val('');
                        }
                    }).blur(function(){
                        if( $(this).val() === "" ){
                            $(this).val( helpText );
                        }
                    }).keyup(function(event) {
                        var commentText = $commentTextarea.val();
                        if (event.keyCode == '27') { //esc
                            //return false;
                        } else if ( commentText.length > RDR.group.comment_length ) {
                            commentText = commentText.substr(0, RDR.group.comment_length);
                            $commentTextarea.val( commentText );
                        }
                        $commentTextarea.siblings('div.rdr_charCount').text( ( RDR.group.comment_length - commentText.length ) + " characters left" );
                    });

                    // $commentDiv.find('textarea').autogrow();
                                        
                    $submitButton.click(function(e) {
                        var commentText = $commentTextarea.val();

                        //keyup doesn't guarentee this, so check again (they could paste in for example);
                        if ( commentText.length > RDR.group.comment_length ) {
                            commentText = commentText.substr(0, RDR.group.comment_length);
                            $commentTextarea.val( commentText );
                            $commentTextarea.siblings('div.rdr_charCount').text( ( RDR.group.comment_length - commentText.length ) + " characters left" );
                        }
                        
                        if ( commentText != helpText ) {
                            //temp translations..
                            //quick fix
                            content_node.kind = summary.kind;
                            
                            var args = {  hash:hash, content_node_data:content_node, comment:commentText, content:content_node.body, tag:tag, rindow:rindow, selState:selState};
                            //leave parent_id undefined for now - backend will find it.
                            RDR.actions.interactions.ajax( args, 'comment', 'create');

                        } else{
                            $commentTextarea.focus();
                        }
                        return false; //so the page won't reload
                    });

                    return $commentBox.append( $commentDiv );
                }

                function _makeOtherComments(){

                    var comments;
                    // () ? text_node : image_node
                    if ( kind == "text" ) {
                        comments = summary.content_nodes[ content_node.id ].top_interactions.coms;
                    } else {
                        comments = summary.top_interactions.coms[tag.id];
                    }
                    
                    var node_comments = 0;
                    for (var com in comments ) {
                        if ( comments[com].tag_id == tag.id ) {
                            node_comments++;
                        }
                    }
                    var hasComments = !$.isEmptyObject(comments);
                    if(!hasComments) return;
                    //else

                    // rindow.find('div.rdr_whyPanel div.rdr_header h1').html('Comments');

                    // ok, get the content associated with this tag!
                    var $otherComments = $('<div class="rdr_otherCommentsBox rdr_sntPnl_padder"></div>').hide().html(
                        '<div><h4>(<span>' + node_comments + '</span>) Comments:</h4></div>'
                    ).appendTo($whyPanel_panelCard);

                    for ( var i in comments ) {
                        var this_comment = comments[i];
                        if( this_comment.tag_id == tag.id ){
                            
                            $otherComments.show();
                            
                            var $commentSet = $('<div class="rdr_commentSet" />'),
                                $commentBy = $('<div class="rdr_commentBy" />'),
                                $comment = $('<div class="rdr_comment" />'),
                                $commentReplies = $('<div class="rdr_commentReplies" />'),
                                $commentReply = $('<div class="rdr_commentReply" />'),
                                $commentReply_link = $('<a href="javascript:void(0);">Reply</a>');
                            var user_image_url = ( this_comment.social_user.img_url ) ? this_comment.social_user.img_url: RDR_staticUrl+'widget/images/anonymousplode.png';
                            var user_name = ( this_comment.user.first_name === "" ) ? "Anonymous" : this_comment.user.first_name + " " + this_comment.user.last_name;
                            $commentBy.html( '<img src="'+user_image_url+'" class="no-rdr" /> ' + user_name );
                            $comment.html( '<div class="rdr_comment_body">"'+this_comment.body+'"</div>' );
                            /*
                            $commentReply_link.bind( 'click.rdr', function() {
                            });
                            */

                            // $commentReply.append( $commentReply_link );


                            // var $this_tag = $('<a class="rdr_tag hover" href="javascript:void(0);">'+thisTag.body+'</a>');
                            
                            // var $tagShareButton = $('<span class="rdr_tag_share"></span>').click(function() {
                            // });
                            
                            // var $tagCountButton = $('<span class="rdr_tag_count">('+thisTag.count+')</span>').click( function() {
                            //     RDR.actions.rateSendLite({ element:$(this), tag:thisTag, rindow:rindow, content:content_node.body, which:which });
                            // });

                            $commentSet.append( $commentBy, $comment ); // , $commentReplies, $commentReply 
                            $otherComments.append( $commentSet );
                        }
                    }
                    //do later for IE maybe
                    //$otherComments.find('.rdr_commentSet:last-child').addClass('rdr_lastchild');

                } //end makeOtherComments

                // if ( kind == "img" || kind == "media" )  {
                //     rindow.find('div.rdr_contentPanel').remove();
                // }

                //expand comment section for readmode
                RDR.actions.panel.expand("whyPanel", rindow, kind );
            },
			sentimentBox: function(settings) {
                //Note: No longer used --> moved to RDR.rindow.make('writeMode', options)
            },
			panel: {
                draw: function(_panel, rindow, interaction_id) {
                    //RDR.actions.panel.draw:
                    var panel = _panel || "whyPanel";
                    
                    var isReadmode = rindow.hasClass('rdr_readmode');
                    var $thisPanel = $('<div class="rdr_'+panel+' rdr_sntPnl rdr_brtl rdr_brtr rdr_brbr rdr_brbl" id="rdr_'+panel+'" />');
                    if ( panel == "whyPanel" ) {
                        
                        $thisPanel.removeClass('rdr_brtl');
                        //this is just a little bit hacky
                        if(isReadmode){
                            $thisPanel.hover(
                                function() {
                                    //don't do this for windows that are resizing
                                    if( $(this).closest('.rdr_window.ui-resizable-resizing').length) return;
                                    if( $(this).closest('.rdr_window.ui-draggable-dragging').length) return;
                                    //else
                                    var $activePanelCard = $(this).find('.rdr_panelCard:visible');
                        
                                    var content_node = $activePanelCard.data('content_node');
                                    $activePanelCard.addClass('rdr_hover');
                                    if(content_node.selState){
                                        $().selog('hilite', content_node.selState, 'on');
                                    }
                                },
                                function() {
                                    //don't do this for windows that are resizing
                                    if( $(this).closest('.rdr_window.ui-resizable-resizing').length) return;
                                    if( $(this).closest('.rdr_window.ui-draggable-dragging').length) return;
                                    //else
                                    var $activePanelCard = $(this).find('.rdr_panelCard:visible');
                                    var content_node = $activePanelCard.data('content_node');

                                    $activePanelCard.removeClass('rdr_hover');
                                    if(content_node && content_node.selState){
                                        $().selog('hilite', content_node.selState, 'off');
                                    }
                                }
                            );
                        }

                    }
                    return $thisPanel;
                },
                setup: function(_panel, rindow){
                    //RDR.actions.panel.setup:
                    var panel = _panel || "whyPanel";
                    
                    //note: it appears this isn't doing anything anymore
                    $(rindow).find('.rdr_'+panel).find('.rdr_header, .rdr_body').css({
                        'width': rindow.settings.pnlWidth +'px',
                        'right':'0',
                        'position':'absolute'
                    });
                },
                expand: function(_panel, rindow, interaction_id){
                    //RDR.actions.panel.expand:
                    var panel = _panel || "whyPanel";
                    // hack.  chrome and safari don't like rounded corners if the whyPanel is showing since it is wider than panel1
                    rindow.find('div.rdr_whyPanel').css('visibility','visible');

                    $thisPanel = $(rindow).find('.rdr_'+panel);
                    var num_columns = rindow.find('div.rdr_sntPnl').length;
                    rindow.addClass('rdr_columns'+num_columns);
                    var width, minHeight, maxHeight, targetHeight, gotoHeight = null;

                    var isReadMode = rindow.hasClass('rdr_readmode');

                    minHeight = RDR.rindow.defaults.minHeight; //100
                    maxHeight = RDR.rindow.defaults.maxHeight; //350
                    contentPanelWidth = 300; //temp var - Later will be a property of a panel object
                    whyPanelWidth = 300; //temp var - Later will be a property of a panel object

                    rindow.resizable('option', {
                        minHeight:minHeight,
                        maxHeight:maxHeight
                    });

                    switch (panel) {
                        case "contentPanel":
                            width = 170 + contentPanelWidth;

                            // corner logic
                            $thisPanel.removeClass('rdr_brtl').removeClass('rdr_brbl');
                            $thisPanel.find('div.rdr_header').removeClass('rdr_brtl').removeClass('rdr_brbl');

                            break;

                        case "whyPanel":

                            // corner logic
                            $thisPanel.removeClass('rdr_brtl rdr_brbl');
                            $thisPanel.find('div.rdr_header').removeClass('rdr_brtl rdr_brbl');
                            // rindow.find('div.rdr_contentPanel, div.rdr_contentPanel div.rdr_header').removeClass('rdr_brbr rdr_brtr');
                            
                            // old, from when whyPanel was next to, not over, the contentPanel:
                            // width = (num_columns == 3) ? 170 + contentPanelWidth + 250 : 170 + 250;
                            width = 170 + contentPanelWidth; // any time we're expanding the contentPanel, the rindow is gonna be 400px wide
                            targetHeight = 225; //quick hack to make it look a bit nicer

                            rindow.queue('panels', function(){
                                $thisPanel.animate( {right:0 }, rindow.settings.animTime, function(){
                                    rindow.dequeue('panels');
                                });
                            });
                            
                            break;
                    }
                    
                    //temp hack
                    if( $thisPanel.data('expanded') ){
                        RDR.rindow.jspUpdate( rindow );
                        rindow.dequeue('userMessage');
                    }
                    else{

                        gotoHeight = RDR.rindow.setHeight(rindow, {
                            targetHeight: targetHeight
                        });
                                            
                        var coords = rindow.offset();
                        coords = RDR.util.stayInWindow({coords:coords, width:width, height:gotoHeight });

                        rindow.queue('panels', function(){

                            rindow.animate({
                                width: width,
                                left: coords.left,
                                height: gotoHeight,
                                top: coords.top
                            }, rindow.settings.animTime, function() {
                                RDR.rindow.jspUpdate( rindow );
                                rindow.dequeue('panels');
                                rindow.dequeue('userMessage');
                            });
                        });
                        rindow.dequeue('panels');
                    }
                    $thisPanel.data('expanded', true);
                },
                collapse: function(_panel, rindow){
                    //RDR.actions.panel.collapse:

                    //note: I'm commenting this out because I think it helps to see the why panel slide back
                    //rindow.find('div.rdr_whyPanel').css('visibility','hidden');
                    //but I don't like seeing the header slide out, becuase the contentPanel header switches immediately
                    rindow.find('div.rdr_whyPanel .rdr_header h1').empty();

                    var panel = _panel || "whyPanel",
                        $thisPanel = rindow.find('.rdr_'+panel),
                        $sizeToContent = ( $thisPanel.find('div.jspPane').length == 1 ) ?$thisPanel.find('div.jspPane'):rindow.find('div.rdr_tagBox');
                    
                    var isReadMode = rindow.hasClass('rdr_readmode');

                    var num_columns = rindow.find('div.rdr_sntPnl').length;
                    rindow.addClass('rdr_columns'+num_columns);
                    
                    var width, minHeight, maxHeight, gotoHeight, targetHeight;

                    minHeight = RDR.rindow.defaults.minHeight; //100
                    maxHeight = RDR.rindow.defaults.maxHeight; //350
                    targetHeight = $sizeToContent.height() + 35 + 10; //+ header height + extra padding;

                    rindow.resizable('option', {
                        minHeight:minHeight,
                        maxHeight:maxHeight
                    });
                    
                    width = 170;

                    switch (panel) {
                        case "contentPanel":
                            
                            // corner logic
                            $thisPanel.addClass('rdr_brtl').addClass('rdr_brbl');
                            $thisPanel.find('div.rdr_header').addClass('rdr_brtl').addClass('rdr_brbl');

                            break;

                        case "whyPanel":
                            
                            // corner logic
                            $thisPanel.addClass('rdr_brtl').addClass('rdr_brbl');
                            $thisPanel.find('div.rdr_header').addClass('rdr_brtl').addClass('rdr_brbl');
                            rindow.find('div.rdr_contentPanel, div.rdr_contentPanel div.rdr_header').addClass('rdr_brtr');
                            rindow.find('div.rdr_reactionPanel div.rdr_body').attr('style','');
                            gotoHeight = 225;

                            if( isReadMode ){
                                width = 470;

                                rindow.queue('panels', function(){
                                    $thisPanel.animate( {right:-300 }, rindow.settings.animTime, function(){
                                        rindow.find('div.rdr_contentPanel .rdr_contentSet').removeClass('rdr_selected');
                                        rindow.dequeue('panels');
                                    });
                                });
                            }

                            break;
                    }
                    
                    if ( rindow.find('div.rdr_rindow_message').length > 0 ) {
                        //rinh rindow.height( rindow.height()-103 );
                        /*
                        RDR.session.rindowUserMessage.hide({
                            rindow:rindow
                        });
                        */
                    }
                    //temp hack
                    if( !$thisPanel.data('expanded') ){
                        
                        rindow.dequeue('userMessage');
                    }
                    else{

                        gotoHeight = RDR.rindow.setHeight(rindow, {
                            targetHeight: targetHeight
                        });
                        rindow.queue('panels', function(){
                            rindow.animate({
                                width: width,
                                height: gotoHeight
                            }, rindow.settings.animTime, function() {
                                RDR.rindow.jspUpdate( rindow );
                                rindow.dequeue('panels');
                                rindow.dequeue('userMessage');
                            });
                        });
                        rindow.dequeue('panels');
                    }
                    
                    $thisPanel.data('expanded', false);
                },
                //todo, fix naming
                subBoxes: [],
                newSubBox: function(){
                },
                update:{
                    
                }              
			},
            comment_panel: {
                //RDR.actions.comment_panel:
                make: function(hash, rindow, tag ){
                    //todo: add this and break out duplicate comment panel stuff
                }
            },
            content_panel: {
                //RDR.actions.content_panel:
                make: function(content_node, tag, hash, rindow){
                    //RDR.actions.content_panel.make:
                    
                    var summary = RDR.summaries[hash];

                    var $contentSet;
                    if ( content_node.top_interactions.tags[ tag.id ] ) {

                        var content_node_key = hash+"-"+content_node.location;

                        //todo: pass everything through the content_node object- no need to expand all the attrs here in the params.
                        $contentSet = $('<div />').addClass('rdr_contentSet').data({node:content_node, content_node_key:content_node_key, hash:hash, location:content_node.location, tag:tag, content:content_node.body});

                        var $header = $('<div class="rdr_contentHeader" />'),
                            $content = $('<div class="rdr_content"></div>'),
                            $tagInfo = $('<div class="rdr_tag_info" />'),
                            $rightBox = $('<div class="rdr_details" />');
                    
                         /*                     
                         
                        var $tagButton = $header.find('a.rdr_tag');
                        $tagButton.data( 'tag', tag );
      
                        TODO: return the abillity to +1 a tag
                        $header.find('span.rdr_tag_count').click( function() {
                            var $interactionButton = $(this).closest('.rdr_tag');
                            var args = { tag:$interactionButton, rindow:rindow, content:content_node.body, hash:hash, uiMode:'read', content_node:content_node, thumbsUp:true};
                            RDR.actions.interactions.ajax( args, 'tag', 'create' );
                        });
                        */

                        var container = $('.rdr-'+hash);
                        var location = $contentSet.data('location');

                        $contentSet.hover(
                            function() {
                                //don't do this for windows that are resizing
                                if( $(this).closest('.rdr_window.ui-resizable-resizing').length) return;
                                if( $(this).closest('.rdr_window.ui-draggable-dragging').length) return;
                                $(this).addClass('rdr_hover');
                                if(content_node.selState){
                                    $().selog('hilite', content_node.selState, 'on');
                                }
                            },
                            function() {
                                //don't do this for windows that are resizing
                                if( $(this).closest('.rdr_window.ui-resizable-resizing').length) return;
                                if( $(this).closest('.rdr_window.ui-draggable-dragging').length) return;
                                $(this).removeClass('rdr_hover');
                                if(content_node.selState){
                                    $().selog('hilite', content_node.selState, 'off');
                                }
                            }
                        ).click( function() {
                            var $this = $(this);
                            $this.closest('.rdr_contentSet').addClass('rdr_selected').siblings().removeClass('rdr_selected');
                            RDR.actions.viewCommentContent( {tag:tag, hash:hash, rindow:rindow, content_node:content_node, selState:content_node.selState});
                        });


                        var tagCount = RDR.util.prettyNumber( content_node.top_interactions.tags[tag.id].count ),
                            tagCountNode = '<span class="rdr_tag_count">'+ '('+tagCount+')' +'</span>',
                            label = ( tagCount == 1 ) ? 'Reaction' : 'Reactions';
                        
                        $tagInfo.html( tagCountNode + '&nbsp;&nbsp;<span class="rdr_tag_rep">'+tag.body+'</span>&nbsp;&nbsp;'+label + ' for:');

                        $header.append( $tagInfo, $rightBox );
                        if ( !$.isEmptyObject( content_node.top_interactions.coms ) ) {
                            var num_comments = 0;
                            for ( var i in content_node.top_interactions.coms ) {
                                if ( content_node.top_interactions.coms[i].tag_id == tag.id ) num_comments++;
                            }
                            if ( num_comments > 0 ) {
                                $header.find('div.rdr_details').append('<span>' + RDR.util.prettyNumber( num_comments ) + '</span>');
                                $header.addClass('rdr_has_comment');
                            }
                        }

                        //todo: consolodate truncate functions
                        var content_node_body = content_node.body,
                            maxLen = 60,
                            content_node_body_trunc;
                            
                        content_node_body_trunc = (content_node_body.length > maxLen) ? RDR.util.trimToLastWord( content_node_body.slice(0, maxLen) )+"..." : content_node_body;

                        $content.html( '<p>'+content_node_body_trunc+'</p>');
                        
                        //this code isn't used here anymore, but we will still need something like it in the new 3rd panel
                        /* 
                        $content.find('div.rdr_otherTags').before( '"' + content_node.body + '"' );
                        var otherTags = content_node.top_interactions.tags;
                        if( !$.isEmptyObject(otherTags) ){
                            for ( var j in otherTags ) {
                                var thisTag = otherTags[j];
                                thisTag.id = parseInt(j);
                                if ( thisTag.body != tag.body ) {
                                    if ( $content.find('div.rdr_otherTags em').length === 0 ) $content.find('div.rdr_otherTags').append( '<em>Other Reactions</em>' );
                                    

                                    // todo should be able to remove the netx 2 lines
                                    // $this_tag.find('span.rdr_tag_count').click( function() {

                                    var $this_tag = $('<a class="rdr_tag hover" href="javascript:void(0);"></a>');
                                    var $tagShareButton = $('<div class="rdr_tag_share" />');
                                    $tagShareButton.click(function() {
                                        // get short uRL call
                                        var content_node_key = $(this).closest('div.rdr_contentSet').data('content_node_key');
                                        
                
                                    });
                                    var $tagCountButton = $('<span class="rdr_tag_count">('+RDR.util.prettyNumber(thisTag.count)+')</span>');
                                    $tagCountButton.click( function() {
                                        var $interactionButton = $(this).closest('.rdr_tag');
                                        var newArgs = { tag:$interactionButton, rindow:rindow, content:content_node.body, hash:hash, uiMode:'read', content_node:content_node, thumbsUp:true};
                                        RDR.actions.interactions.ajax( newArgs, 'tag', 'create' );
                                    });
                                    
                                    $this_tag.append($tagShareButton, $tagCountButton, thisTag.body);
                                    $this_tag.data('tag', thisTag);
                                    $content.find('div.rdr_otherTags').append( $this_tag );

                                }
                            }
                        }
                        */

                        $contentSet.append( $header, $content );

                        rindow.find('div.rdr_contentPanel div.rdr_body').append( $contentSet );
                    }

                    return $contentSet;
                }//end RDR.actions.content_panel.make
            },
            // sentimentBox can be merged with / nested under this as sentimentPanel.draw at a later time mayhaps
            sentimentPanel: {
                addCustomTagBox: function(args) {

                    var hash = args.hash;

                    var rindow = args.rindow,
                        settings = args.settings,
                        $whyPanel = RDR.actions.panel.draw( "whyPanel", rindow ),
                        $customTagBox = $('<li class="rdr_customTagBox"><div class="rdr_tag_count">&nbsp;<span></span></div></li>'),
                        $freeformTagDiv = $('<div class="rdr_tagText"><input type="text" class="freeformTagInput" name="unknown-tags" /></div><div class="rdr_details"></div>'),
                        $freeformTagInput = $freeformTagDiv.find('input');

                    $freeformTagInput.blur(function(){
                        if($('input.freeformTagInput').val() === "" ){
                            $('div.rdr_help').show();   
                        }
                    }).focus(function(){
                       $tagTooltip.hide();
                    }).keyup( {args: args}, function(event) {
                        var args = event.data.args;
                        var $tag = $(this).closest('li.rdr_customTagBox'),
                            $tagInput = $tag.find('input.freeformTagInput');
                        if (event.keyCode == '13') { //enter.  removed comma...  || event.keyCode == '188'
                            $whyPanel.find('div.rdr_body').empty();
                            $tag.data({
                            'tag':{
                                body:$tagInput.val()
                            }});

                            if ( args.actionType == "react") {
                                args = { tag:$tag, rindow:rindow, settings:settings, hash:hash };                            
                                RDR.actions.interactions.ajax( args, 'tag', 'create' );
                            } else if ( args.actionType == "bookmark" ) {
                                args = { tag:$tag, rindow:rindow, settings:settings, hash:hash };                            
                                RDR.actions.interactions.ajax( args, 'bookmark', 'create' );
                                // RDR.actions.bookmarkSend({ tag:tag, rindow:rindow, settings:settings, callback: function() {
                                //         // todo: at this point, cast the tag, THEN call this in the tag success function:
                                //         //RDR.actions.panel.expand("whyPanel", rindow);
                                //     }//end function
                                // });
                            }
                        }
                        else if (event.keyCode == '27') { //esc
                            //return false;
                        // TODO make tag length configurable?
                        } else if ( $tagInput.val().length > 20 ) {
                            var customTag = $tagInput.val();
                            $tagInput.val( customTag.substr(0, 20) );
                        }
                    });

                    var $tagTooltip = (args.actionType == "react") ? $('<div class="rdr_help">Add your own</div>') : $('<div class="rdr_help">Add a tag</div>');
                    $freeformTagDiv.append($tagTooltip);
                    $customTagBox.append($freeformTagDiv);

                    $customTagBox.hover(
                        function() {
                            $(this).addClass('rdr_hover'); // safari/chrome kludge -- :hover isn't working here
                        },
                        function() {
                            $(this).removeClass('rdr_hover'); // safari/chrome kludge -- :hover isn't working here
                        }
                    );

                    $customTagBox.click(function(){
                        $(this).find('div.rdr_help').hide();
                        $freeformTagInput.focus();
                    });

                    rindow.find('ul.rdr_tags').append( $customTagBox );
                    RDR.rindow.jspUpdate( rindow );
                }
            },
            rateSend: function(args) {
                //nothing to see here - this has been moved to RDR.actions.interactions.ajax()
            },
            bookmarkSend: function(args) {
                //nothing to see here - this has been moved to RDR.actions.interactions.ajax()
            },
            share_getLink: function(args) {

                var hash = args.hash,
                    summary = RDR.summaries[hash],
                    kind = summary.kind;

                //example:
                //tag:{body, id}, rindow:rindow, settings:settings, callback: 
                
                // tag can be an ID or a string.  if a string, we need to sanitize.
                
                // tag, rindow, settings, callback

                // TODO the args & params thing here is confusing
                RDR.session.getUser( args, function( params ) {
                    // get the text that was highlighted

                    // var content = $.trim( params.settings.content ),
                    //     container = $.trim( params.settings.container ),
                    //     src_with_path = $.trim( params.settings.src_with_path );

                    var rindow = params.rindow,
                        tag = params.tag;

                    var content_node_info = (params.content_node_info) ? params.content_node_info:params.content_node;

                    // translations.  TODO clean and remove
                    if ( !content_node_info.hash ) content_node_info.hash = ( content_node_info.container ) ? content_node_info.container:params.hash;
                    if ( !content_node_info.content ) content_node_info.content = content_node_info.body;

                    //patching in reliable info todo: redo this formating

                    // //save content node
                    
                    // var selState = rindow.data('selState');
 
                    var content_node_data = {
                        'hash': hash,
                        'body': content_node_info.content,
                        'location': content_node_info.location,
                        'kind':kind
                    };

                    var content_node = RDR.actions.content_nodes.make(content_node_data);

                    var sendData = {
                        "tag" : tag,
                        "hash": content_node_info.hash,
                        "content_node_data" : content_node_data,
                        "user_id" : RDR.user.user_id,
                        "readr_token" : RDR.user.readr_token,
                        "group_id" : RDR.group.id,
                        "page_id" : RDR.util.getPageProperty('id', hash),
                        "referring_int_id" : RDR.session.referring_int_id,
                        "container_kind" : RDR.summaries[hash].kind
                    };

                    // if ( !tag_li.hasClass('rdr_tagged') ) {
                        // send the data!
                        $.ajax({
                            url: RDR_baseUrl+"/api/share/",
                            type: "get",
                            contentType: "application/json",
                            dataType: "jsonp",
                            data: { json: $.toJSON(sendData) },
                            success: function(response) {
                                // todo cache the short url
                                // RDR.summaries[content_node_info.hash].content_nodes[IDX].top_interactions.tags[tag.id].short_url = ;
                                args.response = response;

                                if ( response.status == "fail" ) {
                                    //[cleanlogz]('failllllllllll');
                                    if ( response.message.indexOf( "Temporary user interaction limit reached" ) != -1 ) {
                                        //[cleanlogz]('uh oh better login, tempy 3');
                                        RDR.session.showLoginPanel( args );
                                    } else {
                                        // if it failed, see if we can fix it, and if so, try this function one more time
                                        RDR.session.handleGetUserFail( args, function() {
                                            RDR.actions.share_getLink( args );
                                        });
                                    }
                                } else {
                                    //successfully got a short URL
                                    RDR.actions.shareContent({ sns:params.sns, content_node_info:content_node_info, short_url:response.data.short_url, reaction:tag.body });
                                }
                            },
                            error: function(response) {
                                //for now, ignore error and carry on with mockup
                            }
                        });
                });
            },
            shareContent: function(args) {
                var content = args.content_node_info.content,
                    share_url = "";
                switch (args.sns) {
                    case "facebook":
                        share_url = 'http://www.facebook.com/sharer.php?s=100&p[title]='+encodeURI(content.substr(0, content_length) )+'&p[summary]='+encodeURI(args.reaction)+'&p[url]='+args.short_url;
                    //&p[images][0]=<?php echo $image;?>', 'sharer',
                    break;

                    case "twitter":
                        var content_length = ( 90 - args.reaction.length );
                        var twitter_acct = ( RDR.group.twitter ) ? '&via='+RDR.group.twitter : '';
                        share_url = 'http://twitter.com/intent/tweet?url='+args.short_url+twitter_acct+'&text='+encodeURI(args.reaction)+':+"'+encodeURI(content.substr(0, content_length) );
                    break;

                    case "tumblr":
                        var source = '&t=' + args.reaction +' ... from ' + RDR.group.name;
                        switch ( args.content_node_info.kind) {
                            case "txt":
                                share_url = 'http://www.tumblr.com/share?v=3&type=quote&u='+encodeURIComponent(args.short_url)+'&t='+encodeURI(RDR.group.name)+'&s='+encodeURI(content.substr(0, content_length) );
                            break;

                            case "img":
                                var canonical_url = ( $('link[rel="canonical"]').length > 0 ) ? $('link[rel="canonical"]').attr('href'):window.location.href;
                                share_url = 'http://www.tumblr.com/share/photo?clickthru='+encodeURIComponent(args.short_url)+'&source='+encodeURIComponent(args.content_node_info.body)+'&caption='+encodeURIComponent(args.reaction);
                            break;

                            case "media":
                                share_url = 'http://www.tumblr.com/share/video?u='+encodeURIComponent(args.short_url)+'&embed='+encodeURIComponent(args.content_node_info.body)+'&caption='+encodeURIComponent(args.reaction);
                            break;
                        }
                    break;

                    case "linkedin":
                    break;
                }
                if ( share_url !== "" ) {
                    if ( RDR.shareWindow ) {
                        RDR.shareWindow.location = share_url;
                    }
                }
            },
            newUpdateData: function(hash){
                //RDR.actions.newUpdateData:
                //not using this yet...
                var summary = RDR.summaries[hash],
                    $rindow_readmode = summary.$rindow_readmode,
                    $rindow_writemode = summary.$rindow_writemode;
                    
            },
            updateData: function(args) {
                var tag_text;

                if ( args.kind == "tag" ) {
                    var rindow = args.rindow,
                        hash = args.hash,
                        content = args.content,
                        tag = args.tag,
                        range = args.range;

                    if ( args.element ) {
                        var element_text = args.element.parent().text();
                        count = parseInt( element_text.substr(1, element_text.indexOf(')')-1), 10 ) + 1;
                        tag_text = element_text.substr(element_text.indexOf(')')+2);
                        args.element.text( '('+count+')' );
                        args.element.addClass('rdr_tagged');
                    } else {
                        
                    }

                    
                    //no count in headers anymore
                    /*
                    var headline_tag = rindow.find('div.rdr_contentPanel h1').text();
                    headline_tag = headline_tag.substr(0, headline_tag.lastIndexOf('(')-1);
                    // make sure that the tag just clicked matches the tag of the column we're in before incrementing the count in the column header
                    if ( headline_tag == tag_text ) {
                        var total_count = rindow.find('div.rdr_contentPanel h1 span').text();
                        total_count = parseInt( total_count.substr(1, total_count.length-1) ) + 1;
                        rindow.find('div.rdr_contentPanel h1 span').text('('+total_count+')');
                    }*/

                    var total_reactions = rindow.find('div.rdr_reactionPanel h1 span').text();
                    total_reactions = parseInt( total_reactions.substr(1, total_reactions.length-1), 10 ) + 1;
                    rindow.find('div.rdr_reactionPanel h1 span').text('('+total_reactions+')');

                    rindow.find('div.rdr_reactionPanel ul.rdr_tags li').each( function() {
                        var $this = $(this);
                        // var this_count = ( $this.data('tag').id == tag.id ) ? count : $this.data('tag').count;
                        // var percentage = Math.round( ( this_count / total_reactions) * 100);
                        // this should update all of the counts
                        // $this.find(' div.rdr_tag_count span').text( percentage+'%' );
                    });

                    //I'm doing this somewhere else
                    /*
                    $('div.rdr_indicator').each( function() {
                        $this = $(this);
                        if ( $this.data('hash') == hash ) $this.find('span.rdr_count').text(total_reactions);
                    });
                    */
                    
                    // update the data objects too
                    for ( var i in RDR.content_nodes[hash].info.content ) {
                        if ( RDR.content_nodes[hash].info.content[i].body == content ) {
                            for ( var j in RDR.content_nodes[hash].info.content[i].tags ) {
                                if ( RDR.content_nodes[hash].info.content[i].tags[j].id == tag.id ) {
                                    RDR.content_nodes[hash].info.content[i].tags[j].count++;
                                
                                    // need to increment the .tags count, too
                                    for ( var k in RDR.content_nodes[hash].info.tags ) {
                                        if ( RDR.content_nodes[hash].info.tags[k].id == tag.id ) {
                                            if ( RDR.content_nodes[hash].info.tags[k].content[i] ) {
                                                RDR.content_nodes[hash].info.tags[k].count++;
                                                RDR.content_nodes[hash].info.tags[k].content[i].count++;
                                                RDR.content_nodes[hash].info.tag_count++;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                }
            },
            shareStart: function(args) {
                var rindow = args.rindow, 
                    tag = args.tag,
                    int_id = args.int_id,
                    content_node = args.content_node_data;
                
                //temp tie-over    
                var hash = args.hash,
                    summary = RDR.summaries[hash],
                    kind = args.kind;


                //todo: temp hack
                if( !content_node ){
                    //content_node_info;
                }

                var $whyPanel_body = rindow.find('div.rdr_whyPanel div.rdr_body');
                var $whyPanel_body_jsp = $whyPanel_body.find('.jspPane');
            
                var $whyPanel_panelCard = $('<div />').addClass('rdr_panelCard rdr_panelCard'+int_id);
                $whyPanel_panelCard.data({
                    'tagID':tag.id,
                    'intactID':int_id
                });
                
                //$whyPanel_body.empty();
            
                //add to the $whyPanel_body and hide any sibling panels that have been made;
                if($whyPanel_body_jsp.length){
                    $whyPanel_panelCard.appendTo($whyPanel_body_jsp);
                }else{
                    $whyPanel_panelCard.appendTo($whyPanel_body);
                }
                
                $whyPanel_panelCard.siblings('.rdr_panelCard').hide();

                
                //build $whyPanel_panelCard
                var $tagFeedback = $('<div class="rdr_tagFeedback">Your reaction: <strong>'+tag.body+'</strong></div>');
                var $shareDialogueBox = $('<div class="rdr_shareBox"><strong>Share It:</strong></div>');
                var $commentBox = $('<div class="rdr_commentBox rdr_sntPnl_padder"></div>').html(
                    '<div><h4>Leave a comment:</h4></div> <div class="rdr_commentComplete"></div>'
                );
                var $undoLink = $('<a class="rdr_undo_link" href="javascript:void(0);">Undo</a>')//chain
                .bind('click.rdr', { args:args }, function(event){
                    // RDR.actions.unrateSend(args);
                    var args = event.data.args;
                    
                    var newArgs = {    
                        content_node_data: args.content_node_data,
                        hash: hash,
                        int_id: args.int_id,
                        tag: args.tag,
                        rindow: args.rindow
                    };
                    RDR.actions.interactions.ajax( newArgs, 'tag', 'remove' );
                });

                $whyPanel_panelCard.append(
                    $tagFeedback.append($undoLink),
                    $shareDialogueBox,
                    $commentBox
                );

               //todo: combine this with the other make comments code
                var helpText = "because...",
                    $commentDiv =  $('<div class="rdr_comment">'),
                    $commentTextarea = $('<textarea class="commentTextArea">' +helpText+ '</textarea>'),
                    $rdr_charCount =  $('<div class="rdr_charCount">'+RDR.group.comment_length+' characters left</div>'),
                    $submitButton =  $('<button id="rdr_comment_on_'+int_id.id+'">Comment</button>');
                
                $commentDiv.append( $commentTextarea, $rdr_charCount, $submitButton );
                
                $commentTextarea.focus(function(){
                    if( $(this).val() == helpText ){
                        $(this).val('');
                    }
                }).blur(function(){
                    if( $(this).val() === "" ){
                        $(this).val( helpText );
                    }
                }).keyup(function(event) {
                    var commentText = $commentTextarea.val();
                    if (event.keyCode == '27') { //esc
                        //return false;
                    } else if ( commentText.length > RDR.group.comment_length ) {
                        commentText = commentText.substr(0, RDR.group.comment_length);
                        $commentTextarea.val( commentText );
                    }
                    $commentTextarea.siblings('div.rdr_charCount').text( ( RDR.group.comment_length - commentText.length ) + " characters left" );
                });

                // $commentDiv.find('textarea').autogrow();
                                    
                $submitButton.click(function(e) {
                    var commentText = $commentTextarea.val();

                    //keyup doesn't guarentee this, so check again (they could paste in for example);
                    if ( commentText.length > RDR.group.comment_length ) {
                        commentText = commentText.substr(0, RDR.group.comment_length);
                        $commentTextarea.val( commentText );
                        $commentTextarea.siblings('div.rdr_charCount').text( ( RDR.group.comment_length - commentText.length ) + " characters left" );
                    }
                    
                    if ( commentText != helpText ) {
                        //temp translations..
                        //quick fix
                        content_node.kind = summary.kind;

                        var args = { hash:hash, kind:summary.kind, content_node_data:content_node, comment:commentText, int_id:int_id, rindow:rindow, selState:content_node.selState, tag:tag};                            
                        //leave parent_id undefined for now - backend will find it.
                        RDR.actions.interactions.ajax( args, 'comment', 'create');

                    } else{
                        $commentTextarea.focus();
                    }
                    return false; //so the page won't reload
                });
                //end comment.make section - to be merged later with other duplicated code

                $commentBox.append( $commentDiv );

                var $socialBox = $('<div class="rdr_share_social" />'),
                $shareLinks = $('<ul class="shareLinks"></ul>'),
                socialNetworks = ["facebook","twitter", "tumblr"]; //,"tumblr","linkedin"];

                // embed icons/links for diff SNS
                var shareHash = hash;
                $.each(socialNetworks, function(idx, val){
                    $shareLinks.append('<li><a href="http://' +val+ '.com" ><img class="no-rdr" src="'+RDR_staticUrl+'widget/images/social-icons-loose/social-icon-' +val+ '.png" /></a></li>');
                    $shareLinks.find('li:last').click( function() {
                        RDR.shareWindow = window.open(RDR_staticUrl+'share.html', 'readr_share','menubar=1,resizable=1,width=626,height=436');
                        RDR.actions.share_getLink({ hash:shareHash, kind:kind, sns:val, rindow:rindow, tag:tag, content_node:content_node });
                        return false;
                    });
                });
                $socialBox.append($shareLinks, '<div style="clear:both;" />');

                $shareDialogueBox.append( $socialBox );

                RDR.actions.panel.expand("whyPanel", rindow);

                /*
                TUMBLR SHARING URLs
                http://www.tumblr.com/share?v=3&u=http%3A%2F%2Fjsbeautifier.org%2F&t=Online%20javascript%20beautifier&s=
                -- QUOTE --
                http://www.tumblr.com/share?v=3&
                type=quote&
                u=http%3A%2F%2Finstalyrics.com%2Fartists%2F121-u2%2Flyrics%2F682239-zooropa&
                t=Zooropa%20-%20on%20InstaLyrics&
                s=Zooropa%2C%20a%20bluer%20kind%20of%20white


                -- IMAGE --
                http://www.tumblr.com/share?v=3&type=photo&u=http%3A%2F%2Fwww.wired.com%2Fimages_blogs%2Fdangerroom%2F2011%2F01%2F28858.jpg&t=t%20value&s=s%20value
                */

                // TODO: removing character counter for moment.  not sure we'll have a textarea for sharing anymore.
                /*
                $('.rdr_share_count').text( $('.rdr_share textarea').val().length + " characters");
                $('.rdr_share textarea').keyup( function() {
                    $('.rdr_share_count').text( $('.rdr_share textarea').val().length + " characters");
                });
                */
            },
            startSelect: function(e) {
                //RDR.actions.startSelect:
                // make a jQuery object of the node the user clicked on (at point of mouse up)

                //destroy all other actionbars
                RDR.actionbar.closeAll();
                
                var $mouse_target = $(e.target);
                var maxChars = 800;
                
                // make sure it's not selecting inside the RDR windows.
                // todo: (the rdr_indicator is an expection.
                // The way we're dealing with this is a little weird.  It works, but could be cleaner)
                if ( $mouse_target.closest('.rdr, .no-rdr').length && !$mouse_target.closest('.rdr_indicator').length ) return;
                //else

                var $blockParent = null;
                if( _isValid($mouse_target) ) {
                    // the node initially clicked on is the first block level container
                    $blockParent = $mouse_target;
                } else {
                    $blockParent = findNearestValidParent($mouse_target); 
                }
                //if no valid blockParent was found, we're done here.
                if( $blockParent === null ) return;
                else {
                    $rdrParent = $blockParent.closest('.rdr-hashed');
                }
                //else
                //let selog use serialrange to check if the selected text is contained in the $blockParent (also check for "" of just whitespace)
                var selected = $blockParent.selog('save');
                if ( !selected.serialRange || !selected.text || (/^\s*$/g.test(selected.text)) ) return;
                //else

                //don't send text that's too long - mostly so that the ajax won't choke.
                if(selected.text.length > maxChars) return;

                // check if the blockparent is already hashed
                if ( $rdrParent.hasClass('rdr-hashed') && !$rdrParent.hasClass('rdr-page-container') ) {
                    _drawActionBar($rdrParent);
                }
                else{
                    //hasn't been hashed yet.
                    //try to submit node to server.  Draw the actionbar using an onsuccess function so we don't draw it if it fails.
                    //note: hashes in this case will just be a single hash. That's cool.
                    var hash = RDR.actions.hashNodes( $blockParent );
                    if(hash){
                        RDR.actions.sendHashes( hash, function(){
                            _drawActionBar($blockParent);
                        });
                    }
                }

                //helper functions
                function findNearestValidParent($mouse_target){
                    // find the nearest valid parent
                    var $blockParent = null;
                    var foundClosest = false;
                    $mouse_target.parents().each( function() {
                        if(foundClosest) return;
                        //else
                        
                        var $thisNode = $(this);
                        if(  _isValid( $thisNode ) ){
                            // we've found the first parent of the selected text that is block-level
                            $blockParent = $(this);
                            foundClosest = true;
                        }
                    });
                    return $blockParent;
                }
                function _drawActionBar ($blockParent){
                    var hash = $blockParent.data('hash');

                    if ( _writeModeOpenForThisContainer(hash) ) return false;
                    //else

                    // closes undragged windows
                    //close with our own event instead of removing directly so that I can bind an event to the remove event (thanks ie.)
                    RDR.rindow.close( $('div.rdr.rdr_window.rdr.rdr_rewritable') );

                    RDR.actionbar.draw({
                        coords:{
                            top:parseInt(e.pageY, 10),
                            left:parseInt(e.pageX, 10)
                        },
                        kind:"text",
                        content:selected.textClean,
                        hash:$blockParent.data('hash')
                    });
                }
                function _writeModeOpenForThisContainer(hash){

                    /*todo: quick fix - check for other writemode rindows for this container that are already open.*/
                    /*
                    if it has a summary, check for a rindow.
                    Of course, if it's brand new, it won't have a summary, but then it wont have a rindow either
                    */
                    var summary = RDR.summaries[hash] || 'undefined';
                    if( !summary ) return false;
                    //only allow one writemode per container at a time, check for writemode rindow.
                    var $rindow_writemode = summary.$rindow_writemode;
                    if( $rindow_writemode && $rindow_writemode.filter(":visible").length ){
                        return $rindow_writemode;
                    }else{
                        return false;
                    }
                }
                function _isValid($node){
                    var validity = ( $node.css('display') == "block" && 
                        $node.css('float') == "none" &&
                        ! $node.closest('.rdr_indicator').length &&
                        ! $node.is('html, body')
                    );
                    return validity;
                }


            },//end RDR.actions.startSelect
            pages: {
                //RDR.actions.pages:
                save: function(id, page){
                    //RDR.actions.pages.save:
                    RDR.pages[page.id] = page;
                },
                initPageContainers: function(pageId){
                    var page = RDR.pages[pageId],
                        key = page.key; //todo: consider phasing out - use id instead

                    var $container = ( $(RDR.group.post_selector + '.rdr-page-key-'+key).length == 1 ) ? $(RDR.group.post_selector + '.rdr-page-key-'+key):$('body.rdr-page-key-'+key);

                    if ( $container.length !== 1 ) return;
                    //else

                    //[eric] not a big deal, but why did we add this class and then remove it?
                    $container.removeClass( 'rdr-page-key-' + key );

                    //todo: [eric] this can't be right - we shouldn't just hash a single number like '1'.
                    var hash = RDR.util.md5.hex_md5( String(page.id) );
                    var tagName = $container.get(0).nodeName.toLowerCase();  //todo: looks like we're not using this for pages?

                    //[eric] using our containers.save method to ensure out model is consistent througout.
                    RDR.actions.containers.save({ 
                        id: String(page.id),
                        kind: "page",
                        hash: hash,
                        HTMLkind: null
                    });

                    $container.data( 'page_id', String(page.id) ); // the page ID

                    //todo: I don't think this is doing anything... the hash doesn't make sense and containers seems to always be empty.
                    
                    // hash the "page" descendant nodes
                    // RDR.actions.hashNodes( $container, "nomedia" );
                    RDR.actions.hashNodes( $container );

                    if ( page.containers.length > 0 ) {
                        var hashes = [];
                        hashes[ page.id ] = [];
                        for ( var i in page.containers ) {
                            hashes[ page.id ].push( page.containers[i].hash );
                        }
                        RDR.actions.sendHashes( hashes );
                    }

                    //todo: everythign below here should be a separate function.  What is it doing?
                    //todo: [eric] let the widget plugin handle this stuff.  Porter lets talk
                                            
                    //init the widgetSummary
                    var widgetSummarySettings = page;
                    
                    widgetSummarySettings.key = key;
                    if ( $container.find( RDR.group.summary_widget_selector + '.rdr-page-widget-key-' + key).length == 1 ) {
                        widgetSummarySettings.$anchor = $container.find(RDR.group.summary_widget_selector + '.rdr-page-widget-key-'+key);
                        widgetSummarySettings.jqFunc = "after";
                    } else {
                        widgetSummarySettings.$anchor = $("#rdr-page-summary"); //change to group.summaryWidgetAnchorNode or whatever
                        widgetSummarySettings.jqFunc = "append";
                    }
                    
                    if ( ($('div.rdr-summary').length===0) || ( $('div.rdr-summary').length < $(RDR.group.post_selector).length ) ) {
                        widgetSummarySettings.$anchor.rdrWidgetSummary(widgetSummarySettings);
                    }
                }
            },
            users: {
                //RDR.actions.users:
                save: function(id, settings){
                    //RDR.actions.users.save:

                }
            }
        }//end RDR.actions
    };

    return RDR;
}


//rdr_loadScript copied from http://www.logiclabz.com/javascript/dynamically-loading-javascript-file-with-callback-event-handlers.aspx
function rdr_loadScript(sScriptSrc,callbackfunction) {
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

//load jQuery overwriting the client's jquery, create our $R clone, and revert the client's jquery back
RDR_scriptPaths.jquery = RDR.offline ?
    RDR_staticUrl+"global/js/jquery-1.6.2.min.js" :
    "http://ajax.googleapis.com/ajax/libs/jquery/1.6.2/jquery.min.js";
RDR_scriptPaths.jqueryUI = RDR.offline ?
    RDR_staticUrl+"global/js/jquery-ui-1.8.14.custom.min.js" :
    "http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.14/jquery-ui.min.js";
RDR_scriptPaths.jqueryUI_CSS = RDR.offline ?
    RDR_staticUrl+"global/css/jquery-ui-1.8.14.base.css" :
    "http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.14/themes/base/jquery-ui.css";

rdr_loadScript( RDR_scriptPaths.jquery, function(){
    //callback
    if ( $.browser.msie  && parseInt($.browser.version, 10) < 8 ) {
        return false;
    }
    if ( $.browser.msie  && parseInt($.browser.version, 10) == 8 ) {
        $('body').addClass('rdr_ie');
    }
    
    rdr_loadScript( RDR_scriptPaths.jqueryUI, function(){
        //callback

        //within this scope while the $ refers to our version of jQuery, attach it to our Global var $R at least for now, for testing later
        //todo - I don't think it really matters, but consider making this just local later
        $R = jQuery.noConflict(true);
        
        //A function to load all plugins including those (most) that depend on jQuery.
        //The rest of our code is then set off with RDR.actions.init();
        $RFunctions($R);

    });
});

function $RFunctions($R){
    //called after our version of jQuery ($R) is loaded

    //load CSS
    var css = [];

    if ( !$R.browser.msie || ( $R.browser.msie && parseInt( $R.browser.version, 10 ) > 8 ) ) {
        css.push( RDR_staticUrl+"global/css/readrleague.css" );
    } 
    if ( $R.browser.msie ) {
        css.push( RDR_staticUrl+"widget/css/ie.css" );
        //todo: make sure that if this css file doens't exist, it won't bork.  Otherwise as soon as IE10 comes out, this will kill it.
        css.push( RDR_staticUrl+"widget/css/ie"+parseInt( $R.browser.version, 10) +".css" );
    }

    css.push( RDR_staticUrl+"widget/css/widget.css" );
    css.push( RDR_scriptPaths.jqueryUI_CSS );
    css.push( RDR_staticUrl+"widget/css/jquery.jscrollpane.css" );
    
    loadCSS(css);

    function loadCSS(cssFileList){

        $R.each(cssFileList, function(i, val){
            $R('<link>').attr({
                href: val,
                rel: 'stylesheet'
            }).appendTo('body');
        });
    }

    //init our plugins (includes rangy, but otherwise, mostly jquery plugins. The $R passed is our jQuery alias)
    initPlugins($R);
        
    //initiate our RDR object
    RDR = readrBoard($R);
    
    RDR.date = new Date();
    // TODO use the following line.  it creates a cachebuster that represents the current day/week/month
    // RDR.cachebuster = String( parseInt( RDR.date.getDate() / 7 )+1 )+String(RDR.date.getMonth()) + String(RDR.date.getYear()),
    RDR.cachebuster = RDR.date.getTime();

    //run init functions
    RDR.actions.init();


    function initPlugins($R){
        //All jquery plugins to be loaded using our $R version of jquery and before our widget code;

        //Rangy - init before our jquery
        var rangy = plugin_rangy();
        rangy.init();

        //jQuery Plugins
        plugin_jquery_log($R);
        plugin_jquery_json($R);
        plugin_jquery_postMessage($R);
        plugin_jquery_enhancedOffset($R);
        // plugin_jquery_textnodes($R);                     //not needed now
        // plugin_jquery_superRange($R);                    //not needed now
        // plugin_jquery_improvedCSS($R);                   //not needed now
        plugin_jquery_hashChange($R);
        plugin_jquery_autogrow($R);
        plugin_jquery_mousewheel($R);
        plugin_jquery_mousewheelIntent($R);
        plugin_jquery_scrollStartAndStop($R);
        plugin_jquery_jScrollPane($R);
        plugin_jquery_rdrWidgetSummary($R);
        plugin_jquery_selectionographer($R, rangy);


        /* are we using this */
        //todo: maybe need to fix this...
        // parents filter:  http://stackoverflow.com/questions/965816/what-jquery-selector-excludes-items-with-a-parent-that-matches-a-given-selector
        // doesn't seem to be working tho.
        $R.expr[':'].parents = function(a,i,m){
            return $R(a).parents(m[3]).length < 1;
        };

        
        /** start plugin functions **/
            
        function plugin_jquery_log($){
            /**
             * jQuery Log
             * Fast & safe logging in Firebug console
             * 
             * @param mixed - as many parameters as needed
             * @return void
             * 
             * @url http://plugins.jquery.com/project/jQueryLog
             * @author Amal Samally [amal.samally(at)gmail.com]
             * @version 1.0
             * @example:
             *      $.log(someObj, someVar);
             *      $.log("%s is %d years old.", "Bob", 42);
             *      $('div.someClass').log().hide();
             */
            $.log = function () {
                if ( window.console && window.console.log && window.console.log.apply ) {
                    window.console.log.apply(window.console, arguments);
                }
            };
            $.fn.log = function () {
                var logArgs = arguments || this;
                $.log(logArgs);
                return this;
            };


            //alias console.log to global log
            //in case client already has log defined (remove for production anyway)
            if (typeof log === "undefined"){
                log = function(){
                    $.each(arguments, function(idx, val){    
                        $.log(val);
                    });
                };
            }

            //add in alias temporaily to client $ so we can use regular $ instead of $R if we want
            if(typeof jQuery !== 'undefined'){
                jQuery.log = $.log;
                jQuery.fn.log = $.fn.log;
            }

        }
        //end function plugin_jquery_log

        function plugin_jquery_json($){
            /* jquery json v2.2 */
            /* http://code.google.com/p/jquery-json/ */
            $.toJSON=function(o)

            {
                if(typeof(JSON)=='object'&&JSON.stringify)
                    return JSON.stringify(o);
                var type=typeof(o);
                if(o===null)
                    return"null";
                if(type=="undefined")
                    return undefined;
                if(type=="number"||type=="boolean")
                    return o+"";
                if(type=="string")
                    return $.quoteString(o);
                if(type=='object')

                {
                    if(typeof o.toJSON=="function")
                        return $.toJSON(o.toJSON());
                    if(o.constructor===Date)

                    {
                        var month=o.getUTCMonth()+1;
                        if(month<10)month='0'+month;
                        var day=o.getUTCDate();
                        if(day<10)day='0'+day;
                        var year=o.getUTCFullYear();
                        var hours=o.getUTCHours();
                        if(hours<10)hours='0'+hours;
                        var minutes=o.getUTCMinutes();
                        if(minutes<10)minutes='0'+minutes;
                        var seconds=o.getUTCSeconds();
                        if(seconds<10)seconds='0'+seconds;
                        var milli=o.getUTCMilliseconds();
                        if(milli<100)milli='0'+milli;
                        if(milli<10)milli='0'+milli;
                        return'"'+year+'-'+month+'-'+day+'T'+
                        hours+':'+minutes+':'+seconds+'.'+milli+'Z"';
                    }
                    if(o.constructor===Array)
                    {
                        var ret=[];
                        for(var i=0;i<o.length;i++)
                            ret.push($.toJSON(o[i])||"null");
                        return"["+ret.join(",")+"]";
                    }
                    var pairs=[];
                    for(var k in o){
                        var name;
                        var type=typeof k;
                        if(type=="number")
                            name='"'+k+'"';
                        else if(type=="string")
                            name=$.quoteString(k);else
                            continue;
                        if(typeof o[k]=="function")
                            continue;
                        var val=$.toJSON(o[k]);
                        pairs.push(name+":"+val);
                    }
                    return"{"+pairs.join(", ")+"}";
                }
            };

            $.evalJSON=function(src)

            {
                if(typeof(JSON)=='object'&&JSON.parse)
                    return JSON.parse(src);
                return eval("("+src+")");
            };

            $.secureEvalJSON=function(src)

            {
                if(typeof(JSON)=='object'&&JSON.parse)
                    return JSON.parse(src);
                var filtered=src;
                filtered=filtered.replace(/\\["\\\/bfnrtu]/g,'@');
                filtered=filtered.replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,']');
                filtered=filtered.replace(/(?:^|:|,)(?:\s*\[)+/g,'');
                if(/^[\],:{}\s]*$/.test(filtered))
                    return eval("("+src+")");else
                    throw new SyntaxError("Error parsing JSON, source is not valid.");
            };

            $.quoteString=function(string)
            {

                if(string.match(_escapeable))

                {
                    return'"'+string.replace(_escapeable,function(a)

                    {
                            var c=_meta[a];
                            if(typeof c==='string')return c;
                            c=a.charCodeAt();
                            return'\\u00'+Math.floor(c/16).toString(16)+(c%16).toString(16);
                        })+'"';
                }
                return'"'+string+'"';
            };

            var _escapeable=/["\\\x00-\x1f\x7f-\x9f]/g;
            var _meta={
                '\b':'\\b',
                '\t':'\\t',
                '\n':'\\n',
                '\f':'\\f',
                '\r':'\\r',
                '"':'\\"',
                '\\':'\\\\'
            };
        }
        //end function plugin_jquery_json
        
        function plugin_jquery_postMessage($){
            /*
             * jQuery postMessage - v0.5 - 9/11/2009
             * http://benalman.com/projects/jquery-postmessage-plugin/
             * 
             * Copyright (c) 2009 "Cowboy" Ben Alman
             * Dual licensed under the MIT and GPL licenses.
             * http://benalman.com/about/license/
             */
            var g,d,j=1,a,b=this,f=!1,h="postMessage",e="addEventListener",c,i=b[h]&&!$.browser.opera;$[h]=function(k,l,m){if(!l){return}k=typeof k==="string"?k:$.param(k);m=m||parent;if(i){m[h](k,l.replace(/([^:]+:\/\/[^\/]+).*/,"$1"))}else{if(l){m.location=l.replace(/#.*$/,"")+"#"+(+new Date)+(j++)+"&"+k}}};$.receiveMessage=c=function(l,m,k){if(i){if(l){a&&c();a=function(n){if((typeof m==="string"&&n.origin!==m)||($.isFunction(m)&&m(n.origin)===f)){return f}l(n)}}if(b[e]){b[l?e:"removeEventListener"]("message",a,f)}else{b[l?"attachEvent":"detachEvent"]("onmessage",a)}}else{g&&clearInterval(g);g=null;if(l){k=typeof m==="number"?m:typeof k==="number"?k:100;g=setInterval(function(){var o=document.location.hash,n=/^#?\d+&/;if(o!==d&&n.test(o)){d=o;l({data:o.replace(n,"")})}},k)}}}
        }
        //end function plugin_jquery_postMessage

        function plugin_jquery_enhancedOffset($){
            /**
             * Enhanced .offset()
             * Abstracts offset().right and offset().bottom into a built-in getter, and adds .offset(top, left) as a setter.
             *
             * @version 1.0
             * @example $('#tester').offset().bottom
             * @example $('#tester').offset().right
             * @example $('#tester').offset(10, 20);
             * @example $('#tester').offset(10, 20, 'fast');
             * @example $('#tester').offset('+=10', '+=20');
             * @example $('#tester').offset('+=5', '-=30');
             * @author Brian Schweitzer (BrianFreud)
             * @author Charles Phillips, first half of the return conditional ( http://groups.google.com/group/jquery-dev/browse_thread/thread/10fa400d3f9d9521/ )
             *
             * Dual licensed under the MIT and GPL licenses:
             *   http://www.opensource.org/licenses/mit-license.php
             *   http://www.gnu.org/licenses/gpl.html
             */
            var offsetMethod = $.fn.offset;
            $.fn.offset = function () {
                var offset = offsetMethod.call(this),
                    bottom = (offset) ? offset.top + this.outerHeight():0,
                    right = (offset) ? offset.left + this.outerWidth():0,
                    a = arguments;
                return (a.length) ? this.animate({
                                                 top  : a[0].top  || a[0],
                                                 left : a[0].left || a[1]
                                                 }, (a[0].top ? a[1] : a[2]) || 1)
                                  : $.extend(offset, {
                                                     bottom: bottom,
                                                     right: right
                                                     });
            };
        }
        //end function plugin_jquery_enhancedOffset

        function plugin_jquery_rdrWidgetSummary($){
            /*
             * jQuery Plugin by readrboard.com
             * builds the readrboard widget's summary widget.
             * accepts settings to customize the format
             */

            $.fn.rdrWidgetSummary = function( params ) {
                //jQuery plugin pattern :http://docs.jquery.com/Plugins/Authoring
                if ( methods[params] ) {
                    return methods[params].apply( this, Array.prototype.slice.call( arguments, 1 ));
                } else if ( typeof params === 'object' || ! params ) {
                    return methods.init.apply( this, arguments );
                } else {
                    $.error( 'Method ' +  params + ' does not exist.' );
                }
            };

            var defaults = {
                initTest:'init',
                passedIn: 'nothing to see here...'
            };

            var methods = {
                init: function( options ) {
                    var $this = ( this[0] === document ) ? $('.rdr-summary') : this,
                        settings;
                    
                    return $this.each(function(){

                        // merge default and user parameters
                        settings = options ? $.extend(defaults, options) : defaults;
                        
                        settings.parentContainer = this;
                        _makeSummaryWidget(settings);
                        
                    });
                },
                update: function(param){
                    //todo check this
                    var $this = ( this[0] === document ) ? $('.rdr-summary') : this;
                    return $this.each(function(index){
                    });
                }


            };
            //end methods

            //private functions:
            function _secret(){
            }

            //helper function for ajax above
            function _makeSummaryWidget(settings){

                    var page = settings;

                    var widgetClass = 'rdr-summary-key-'+page.key;

                    //first kill any existing instances; we're going to recreate them.
                    $('.'+widgetClass).remove();

                    var $summary_widget_parent = $(page.parentContainer),
                        $summary_widget = $('<div class="rdr rdr-summary" />').addClass(widgetClass);

                    //page.jqFunc would be something like 'append' or 'after',
                    //so this would read $summary_widget_parent.append($summary_widget);
                    $summary_widget_parent[page.jqFunc]($summary_widget);
                    
                    var total_interactions = 0;
                    for ( var i in page.summary ) {
                        if ( page.summary[i].kind == "tag" ) total_interactions = page.summary[i].count;
                    }

                    var $react = $('<div class="rdr-sum-headline"></div>');
                    $summary_widget.append( $react );

                    // if ( total_interactions > 0 ) {
                    //     var people = ( page.topusers.length > 1 ) ? page.topusers.length + " people" : "1 person";
                    //     // racialicious:
                    //     // $summary_widget.append('<div class="rdr-sum-headline">'+total_interactions+' reactions from '+people+'</div>');
                    //     $summary_widget.append('<div class="rdr-sum-headline">'+total_interactions+' reactions:</div>');
                    // } else {

                    // }

                    // summary widget: specific tag totals
                    if ( page.toptags.length > 0 ){
                        // var $toptags = $('<div class="rdr-top-tags" />');
                        // $summary_widget.append( $toptags );

                        for ( var i = 0, j=4; i < j; i++ ) {
                            var this_tag = page.toptags[i];

                            if ( this_tag ) {
                                writeTag( this_tag );

                                // $toptags.append(' <span>'+ this_tag.body +' <em>('+this_tag.tag_count+')</em></span>&nbsp;&nbsp;&nbsp;');
                            }
                            
                            // the tag list will NOT line wrap.  if its width exceeds the with of the image, show the "click to see more" indicator
                            // if ( $react.width() > $summary_widget.width() - 125 ) {
                                // $react.children().last().html('and more...').addClass('rdr_see_more').removeClass('rdr_tags_list_tag');
                                // break;
                            // }
                        }

                    }

                    for ( var i = 0; i < RDR.group.blessed_tags.length; i++) {
                        writeTag( RDR.group.blessed_tags[i] );
                    }

                    // add custom tag
                    var $a_custom = $('<a class="rdr_tag rdr_custom_tag"><input type="text" value="Add yours..." class="rdr_default"/></a>');
                    $a_custom.find('input').focus( function() {
                        var $input = $(this);
                        $input.removeClass('rdr_default');
                        if ( $input.val() == "Add yours..." ) {
                            $input.val('');
                        }
                    }).blur( function() {
                        var $input = $(this);
                        if ( $input.val() === "" ) {
                            $input.val('Add yours...');
                        }
                        if ( $input.val() == "Add yours..." ) {
                            $input.addClass('rdr_default');
                        }
                    }).keyup( function(event) {
                        var $input = $(this),
                            tag = {},
                            hash = $input.closest('.rdr-page-container').data('hash');

                        if (event.keyCode == '13') { //enter.  removed comma...  || event.keyCode == '188'
                            // $whyPanel.find('div.rdr_body').empty();

                            tag.body = $input.val();

                            args = { tag:tag, hash:hash, kind:"page" };                            
                            RDR.actions.interactions.ajax( args, 'tag', 'create' );
                            $input.blur();
                        }
                        else if (event.keyCode == '27') { //esc
                            //return false;
                            $input.blur();
                        } else if ( $input.val().length > 20 ) {
                            var customTag = $input.val();
                            $input.val( customTag.substr(0, 20) );
                        }
                    });

                    var $a_custom_tooltip = RDR.tooltip.draw({"item":"tooltip","tipText":"Add your own reaction to this page."}).addClass('rdr_tooltip_top').addClass('rdr_tooltip_wide').hide();
                    $a_custom_tooltip.attr( 'id', 'rdr-tooltip-summary-tag-custom' );
                    $('#rdr_sandbox').append( $a_custom_tooltip );
                    
                    $react.append( $a_custom, " " );

                    $a_custom.hover(
                        function() {
                            var $a_custom = $(this),
                                $tooltip = $('#rdr-tooltip-summary-tag-custom'),
                                aOffsets = $a_custom.offset();

                            var tooltip_top = ( aOffsets.top - 42 ),
                                tooltip_left = ( aOffsets.left + ( $a_custom.width() / 2 ) - 110 );

                            $tooltip.css('top', tooltip_top + "px" );
                            $tooltip.css('left', tooltip_left + "px" );
                            $tooltip.show();
                        },
                        function() {
                            $('#rdr-tooltip-summary-tag-custom').hide();
                        }
                    );




                    if ( page.topusers.length > 0 ){
                        var $topusers = $('<div class="rdr-top-users" />');

                        for ( var i = 0, j=10; i < j; i++ ) {
                            var this_user = page.topusers[i];
                        
                            if ( this_user ) {
                                var $userLink = $('<a href="'+RDR_baseUrl+'/user/'+this_user.user+'" class="no-rdr rdr-top-user" target="_blank" />'),
                                    userPic = '<img src="'+this_user.img_url+'" class="no-rdr" alt="'+this_user.full_name+'" title="'+this_user.full_name+'" />';
                                // $topusers.append( $userLink.append(userPic) );
                                $react.append( $userLink.append(userPic) );
                            }
                        }

                        //hacked in html('') to clear it so that i can re-use this later to update the thingy.  todo: make it pretty.
                        // $react.append( $topusers );

                    }

                    $summary_widget.append( $('<div class="rdr_note" />') );
                    

                    // instructional tooltip summary box tooltip
                    // var $tooltip = RDR.tooltip.draw({"item":"tooltip","tipText":"<strong style='font-weight:bold;'>Tell us what you think!</strong><br>React by selecting any text, or roll your mouse over images and video, and look for the pin icon."}).addClass('rdr_tooltip_top').addClass('rdr_tooltip_wide').hide();
                    // $tooltip.attr( 'id', 'rdr-tooltip-'+page.id );
                    // $('#rdr_sandbox').append( $tooltip );

                    // var summaryOffsets = $summary_widget.offset();
                    // var tooltip_top = ( summaryOffsets.top - $(window).scrollTop() - 82 ),
                    //     tooltip_left = ( summaryOffsets.left + ( $summary_widget.width() / 2 ) - 125 );

                    // $tooltip.css('top', tooltip_top + "px" );
                    // $tooltip.css('left', tooltip_left + "px" );

                    // $summary_widget.hover(
                    //     function() {
                    //         $('#rdr-tooltip-' + page.id).show();
                    //     },
                    //     function() {
                    //         $('#rdr-tooltip-' + page.id).hide();
                    //     }
                    // );


                function writeTag(tag) {
                    var tagCount, $span;
                    if ( $react.find('a.rdr_tag_'+tag.id).length === 0 && $react.find('a.rdr_tag').length < 4 ) {
                        tagCount = ( tag.tag_count ) ? tag.tag_count:"+";
                        
                        var peoples = ( tagCount == 1 ) ? "person":"people";
                        var $a = $('<a class="rdr_tag rdr_tag_'+tag.id+'">'+tag.body+'</a>').data('tag_id',tag.id);
                        
                        $span = $('<span class="rdr_tag_count">'+tagCount+'</span>');

                        $a.append( $span );

                        var $a_tooltip = RDR.tooltip.draw({"item":"tooltip","tipText":"Add this reaction to this page."}).addClass('rdr_tooltip_top').addClass('rdr_tooltip_wide').hide();
                        $a_tooltip.attr( 'id', 'rdr-tooltip-summary-tag-'+tag.id );
                        $('#rdr_sandbox').append( $a_tooltip );
                        
                        $react.append( $a, " " );
                        $span.css('width', $span.width() + 'px' );

                        $a.hover(
                            function() {
                                var $a = $(this),
                                    $tooltip = $('#rdr-tooltip-summary-tag-' + $a.data('tag_id') ),
                                    aOffsets = $a.offset();

                                var tooltip_top = ( aOffsets.top - 42 ),
                                    tooltip_left = ( aOffsets.left + ( $a_custom.width() / 2 ) - 110 );

                                $tooltip.css('top', tooltip_top + "px" );
                                $tooltip.css('left', tooltip_left + "px" );
                                $tooltip.show();

                                $a.data('tagCount', $a.find('span').text() );
                                $a.find('span').text( '+' );
                            },
                            function() {
                                var $a = $(this);
                                $('#rdr-tooltip-summary-tag-' + $a.data('tag_id') ).hide();
                                $a.find('span').text( $a.data('tagCount') );

                            }
                        ).click( function() {
                            var hash = $(this).closest('.rdr-page-container').data('hash');
                            args = { tag:tag, hash:hash, uiMode:'write', kind:"page"};
                            RDR.actions.interactions.ajax( args, 'tag', 'create');
                        });
                    }
                    if ( tagCount === "" ) {
                        $span.hide();
                    }
                }

            }

        }
        //end function plugin_jquery_rdrWidgetSummary

        function plugin_jquery_selectionographer($, rangy){
            /*
             * jquery.selectionographer.js
             * $.fn.selog aliases to $.fn.selectionographer
             * author: eric@readrboard.com
             * see docs for more info /docs/selectionographer-docs.js
             *
             * depends on all of the rangy pacakge:
             * rangy-core.js
             * rangy-cssclassapplier.js
             * rangy-selectionsaverestore.js
             * rangy-serializer.js
             *
             * expects params of ( $, rangy ) where $ is the jQuery alias
             * 
             * //temp readr note: to test in the live page, don't forget to use $R(), not $().
            */        
            $.fn.selectionographer = function( params ) {
                //jQuery plugin pattern :http://docs.jquery.com/Plugins/Authoring
                if ( methods[params] ) {
                    return methods[params].apply( this, Array.prototype.slice.call( arguments, 1 ));
                } else if ( typeof params === 'object' || ! params ) {
                    return methods.init.apply( this, arguments );
                } else {
                    $.error( 'Method ' +  params + ' does not exist.' );
                }
            };
            $.fn.selog = $.fn.selectionographer;

            var defaults = {};

            var methods = {
                //note: In these methods, 'this' is the jQuery object that the plugin was invoked on. See plugin pattern above.
                init : function( options ) {
                    var $this = this;
                    options = options || {};
                    _tempTesting();

                    //todo: make _settings an object unique to each 'this';
                    return $this.each(function(){
                        // merge default and user parameters
                        _settings = $.extend(defaults, options);
                    });
                },
                save: function(selStateOrPartial){
                    // selStateOrPartial is an optional object.
                    // If selStateOrPartial is a full selState, or has a range, or a serialRange, it will clone it and save a new one.
                    // If it is omited or if both selStateOrPartial.range and selStateOrPartial.serialRange are ommited,
                    // it will use the current selection to build the selState.  If nothing is selected it returns false;
                    var $this = this,
                    selStateStack = _selStateStack,
                    state = selStateOrPartial || {},
                    selState;

                    //only take the first container for now
                    //todo: solution for multiple $objects?
                    state.container = state.container || $this[0] || document;
                    selState = _makeSelState( state );
                    //make sure selState didn't fail (i.e. if it was an empty range)
                    if(!selState) return false;

                    //push selState into stack
                    selStateStack[selState.idx] = selState;

                    return selState;
                },
                activate: function(idxOrSelState){
                    var selState = _fetchselState(idxOrSelState);
                    if(!selState) return false;
                    methods.clear();
                    _WSO().setSingleRange( selState.range );

                    return selState;
                },
                clear: function(){
                    _WSO().removeAllRanges();  
                },
                modify: function(idxOrSelState, filterList) {
                    //let filterList be optionally called without idxOrSelState - letting the selState default to the latest.
                    if( idxOrSelState instanceof Array ){
                        filterList = idxOrSelState;
                        idxOrSelState = undefined; //will trigger default latest idx
                    }
                    var iniSelState = _fetchselState(idxOrSelState),
                    newSettings, newRange,
                    newSelState;

                    if(!iniSelState) return false;

                    //todo: it looks like the rangy method cloneRange breaks the ability to re-activate it later?
                    //we shouldn't need that though, anyway, but maybe it will get fixed down the line.
                    newRange = iniSelState.range.cloneRange();
                    //filter the ranges
                    newRange = _filter(newRange, filterList);
                    newSettings = {
                        range:newRange,
                        container:iniSelState.container
                    };
                    newSelState = methods.save( newSettings );
                    return newSelState;
                },
                hilite: function(idxOrSelState, switchOnOffToggleParam){
                    // switchOnOffToggle is optional.  Expects a string 'on', 'off', or 'toggle', or defaults to 'on'
                    // check if idxOrSelState is omited
                    var switchOnOffToggle = switchOnOffToggleParam;
                    if( typeof idxOrSelState === 'string' && isNaN( idxOrSelState ) ){
                        switchOnOffToggle = idxOrSelState;
                        idxOrSelState = undefined;
                    }
                    switchOnOffToggle = switchOnOffToggle || 'on';

                    //todo:checkout why first range is picking up new selState range (not a big deal)
                    var selState = _fetchselState(idxOrSelState);
                    if(!selState){
                        return false;
                    }
                    
                    //extra protection against hiliting a ndoe with an invalid serialRange - flagged as false (not just undefined)
                    if( typeof selState.serialRange !== "undefined" && selState.serialRange === false ){
                        return false;
                    }
                    
                    //todo: not using this yet..
                    /*
                    var range = selState.range;
                    var host = range.commonAncestorContainer;
                    //get the closest parent that isn't a textNode or CDATA node
                    while( host.nodeType == 3 || host.nodeType == 4 ){ //Node.TEXT_NODE equals 3, CDATA_SECTION_NODE = 4
                        host = host.parentNode;
                    }
                    */

                    //switch the hilite state
                    _hiliteSwitch(selState, switchOnOffToggle);
                    return selState;
                },
                helpers: function(helperPack){
                    var func = _helperPacks[helperPack];
                    return func ? func.apply( this, Array.prototype.slice.call( arguments, 1 ) ) : false;
                },
                find: function(string){
                    var re = [],
                    $this = this,
                    regex;
                    
                    if( !string ) return false;

                    /*
                    function escapeRegEx( str ) {
                        // http://kevin.vanzonneveld.net
                        return (str+'').replace(/(\\)/g, "\\$1");
                    }
                    */

                    //todo: verify that this is best practice
                    //http://simonwillison.net/2006/Jan/20/escape/
                    RegExp.escape = function(text) {
                        return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
                    };

                    /*
                    //if a single string, make it an array.
                    if (typeof strings === "string"){
                        strings = [strings];
                    }
                    */

                    /*
                    var re = [], regex, scope=this;
                    $.each(strings,function(i,str){
                        if ( str === "") return;
                        str = scope.escapeRegEx(n);
                        re.push(str); 
                    });
                    regex = re.join("|"); //or
                    regex = '(?:'+regex+')';
                    */              
                    
                    string = RegExp.escape(string);
                    regex = new RegExp(string, "gim");
                    
                    return $this.each(function(){
                        var text = $(this).text(),
                        match = 0,
                        check = 0, //while testing, avoid infiniteloops
                        ret = [];
                        while( (match = regex.exec(text)) && check < 5 ) {
                            ret.push(match.index);
                            check++;
                        }

                        return ret;
                    });
                },
                stack: function(){
                   return _selStateStack;
                },
                //prob wont use this
                data: function(name){
                   return _data[name];
                }
            };

            //private objects
            var _settings = {}, //set on init
            //for all helperPacks, 'this' is passed in with apply.
            _helperPacks = {
                smartHilite: function(){
                    return methods.hilite( methods.modify( methods.save.apply(this) ) ); //oooh lispy.
                },
                activateRange: function(rangeOrSerialRange){
                    //todo: not using this anyway, but not sure if this still works completely..
                    var settings = {};
                    if (!rangeOrSerialRange) return false;
                    if( typeof rangeOrSerialRange === "string" ){
                        //assume it's a serialRange
                        settings.serialRange = rangeOrSerialRange;
                    }
                    else{
                        //assume it's a range
                        settings.range = rangeOrSerialRange;
                    }
                    return methods.activate( methods.save(settings) );
                }
            },
            _selStateStack = [
            /*
                //keep commented out:
                //Example template: Set by save and added to the stack.
                 {
                    todo: update this is old...

                    selection: selectionObj || rangy.getSelection(),
                    idx: selStateStack.length,
                    timestamp: $.now(),
                    revisionParent: null, //set below
                    ranges: null,       //set below
                    text: ""            //set below
                }
            */
            ],
            _modifierFilters = {
                filterOutRDRIndicator: function(range, params){
                    //check if $indicator is contained in the range, and if so, move the range's end to just before it.

                    var commonAncestorContainer = range.commonAncestorContainer;
                    var $indicator = $(commonAncestorContainer).find('.rdr_indicator');
                    if($indicator.length){
                        var inTheRange = range.containsNode($indicator[0], true); //2nd param is 'partial': (rangy docs for containsNode)
                        if(inTheRange){
                            range.setEndBefore( $indicator[0] );
                        }
                    }
                    return range;
                },
                stripWhiteSpace: function(range){
                    var rangeStr = range.toString(),
                    s = {}, //start
                    e = {}; //end
                    //see rangy core for range attributes used here
                    s.textnode = range.startContainer;
                    s.offset = range.startOffset;
                    s.regx = /^\s+/; //start, then one or more whitespace chars
                    s.result = s.regx.exec(rangeStr);

                    e.textnode = range.endContainer;
                    e.offset = range.endOffset;
                    e.regx = /\s+$/; //one or more whitespace chars, then end
                    e.result = e.regx.exec(rangeStr);
                    
                    //change the range offsets by the length of the whitespace found
                    if(s.result){
                        s.resultStrLen = s.result[0].length;
                        _rangeOffSet( range, {relOffset: (s.resultStrLen)} );
                    }
                    if(e.result){
                        e.resultStrLen = e.result[0].length;
                        _rangeOffSet( range, {relOffset: (-e.resultStrLen), start:false} );
                    }
                    return range;
                },
                firstWordSnap: function(range){
                    //find the extra word characters the range cut off at the beginning of the selState, and add em'.
                    //and change the offset of the range
                    var textnode = range.startContainer, //rangy attribute startContainer
                    startOffset = range.startOffset,
                    testRange;
                    if (startOffset === 0) return range;
                    //else 

                    //NOTE: this assumes that the function and the range share the same document - change if we ever need to call between iframes.
                    //create a helper object to find the word boundary
                    var hlpr = {
                        range: rangy.createRange() //rangy function createRange
                    };
                    hlpr.range.setStart(textnode, 0);
                    hlpr.range.setEnd(textnode, startOffset);
                    hlpr.str0 = (hlpr.range.toString());
                    //zero or more whitespace chars, then one ore more non-whitespace chars, then the end.
                    hlpr.regx1 = /\s*\S+$/;
                    hlpr.result1 = hlpr.regx1.exec(hlpr.str0);
                    if (hlpr.result1 === null) return range;
                    //else

                    hlpr.str1 = hlpr.result1[0]; //result[0] is string representation of regex object - see exec() for info
                    //strip any white space off beginning of string
                    hlpr.str2 = hlpr.str1.replace(/\s*/,"");
                    hlpr.extraWordChars = hlpr.str2.length;
                    _rangeOffSet(range, {relOffset: (-hlpr.extraWordChars) });
                    return range;
                },
                lastWordSnap: function(range){
                    //find the extra word characters the range cut off at the end of the selState, and add em'.
                    var textnode = range.endContainer, //rangy attribute endContainer
                    endOffset = range.endOffset,
                    testRange;
                    if (endOffset === 0) return range;
                    //else
                    
                    //NOTE: this assumes that the function and the range share the same document - change if we ever need to call between iframes.
                    //create a tester object to find the word boundary
                    var hlpr = {
                        range: rangy.createRange() //rangy function createRange
                    };
                    hlpr.range.setStart(textnode, endOffset);
                    hlpr.range.setEnd(textnode, textnode.length);
                    hlpr.str0 = (hlpr.range.toString());
                    //zero or more whitespace chars, then one ore more non-whitespace chars, then the end.
                    hlpr.regx1 = /^\S+(?=(\s|$))/;
                    hlpr.result1 = hlpr.regx1.exec(hlpr.str0);
                    if (hlpr.result1 === null) return range;
                    //else

                    hlpr.str1 = hlpr.result1[0]; //result[0] is string representation of regex object - see exec() for info
                    hlpr.extraWordChars = hlpr.str1.length;
                    _rangeOffSet(range, {relOffset: (hlpr.extraWordChars), start:false});
                    return range;
                }
            },
            //prob won't use this.
            _data = {
                stack: _selStateStack
            };
            
            //private functions:
            function _WSO(){
                return rangy.getSelection();  
            }
            function _makeSelState(settings){
                var scope = this,
                selStateStack = _selStateStack,
                range, serialRange,
                theSettings = settings || {},
                defaults = {
                    styleName: 'rdr_hilite',
                    container: document,        // likely passed in by save()
                    serialRange: null,          // set below - overwritten by explicit range object
                    range: null                 // set below - overwrites serial range
                },
                overrides = {
                    idx: selStateStack.length,  // can't overide
                    timestamp: $.now(),         // don't really need this..
                    interactionID: null,        // for later use
                    hiliter: null,              // set below
                    revisionParent: null,       // set below
                    text: ""                    // set below
                },
                selState = $.extend({}, defaults, theSettings, overrides);

                //set properties that depend on the others already being initiated

                // if missing param or missing needed range data
                if( !selState.range && !selState.serialRange ){
                    //try getting data from browser selection
                    var WSO = _WSO();
                    if(WSO.isCollapsed) return false;
                    //else
                    range = WSO.getRangeAt(0);
                    //serializing relative to the parent container. The false is omitChecksum=false.
                    try{
                        serialRange = rangy.serializeRange(range, true, selState.container ); //see rangy function serializeRange
                    } catch(e) {
                        serialRange = false;
                    }
                }
                else if(selState.range){
                    range = selState.range;
                    try{
                        serialRange = rangy.serializeRange(range, true, selState.container ); //see rangy function serializeRange
                        //using the name e2 because jslint says use a new name here: http://stackoverflow.com/questions/6100230/javascript-catch-parameter-already-defined
                    } catch(e2) {
                        serialRange = false;
                    }
                }
                else if(selState.serialRange){
                    serialRange = selState.serialRange;
                    range = rangy.deserializeRange(serialRange, selState.container ); //see rangy function deserializeRange
                }
                else{
                }
                selState.serialRange = serialRange;
                //todo: low: could think more about when to cloneRange to make it a tiny bit more efficient.
                selState.range = range.cloneRange();
                selState.text = selState.range.toString(); //rangy range toString function
                //check for empty selection..
                if(selState.text.length === 0) return false;
                //set hiliter - depends on idx, range, etc. being set already.
                selState.hiliter = _hiliteInit(selState);

                return selState;
            }
            function _fetchselState(idxOrSelState){
                //check if idxOrSelState is selState false (error signal from up the chain - return false),
                //else, if object, it's a selState,
                //else, get the selState from idx,
                //else if param is undefined, return the latest on the stack
                
                if( idxOrSelState === false ) return false;

                if(typeof idxOrSelState === 'object') return idxOrSelState;
                                
                var selStateStack = _selStateStack,
                //set idx to declared idx, else last idx on the stack
                idx = (typeof idxOrSelState == "string" || typeof idxOrSelState == "number" ) ? idxOrSelState : selStateStack.length-1,
                selState = selStateStack[idx];
                if(selState)
                    return selState;
                
                //else
                return false;
            }
            function _hiliteInit(selState){
                //only init once
                if(selState.hiliter){
                    return selState.hiliter;
                }
                // todo: make hiliter a proper js class object
                var range = selState.range,
                styleClass = selState.styleName,
                hiliter;

            
                //use a unique indexed version of style to uniquely identify spans
                var uniqueClass = styleClass + "_" + selState.idx;
                //methods.clear();
                hiliter = rangy.createCssClassApplier( uniqueClass, true ); //see rangy docs for details
                hiliter['class'] = uniqueClass;
                hiliter['get$start'] = function(){
                    return $(range.startContainer).closest('.'+hiliter['class']);
                };
                hiliter['get$end'] = function(){
                    return $(range.endContainer).closest('.'+hiliter['class']); 
                };
                hiliter['isActive'] = function(){
                    return hiliter['isAppliedToRange'](range);
                };
                
                return hiliter;
            }
            function _hiliteSwitch(selState, switchOnOffToggle) {
                
                // it looks like the rangy cssClassApplier is still buggy.  Keep this commented out for a while and see how things go.

                //args required
                //switchOnOffToggle must be a string 'on','off',or 'toggle'
                var range = selState.range,
                styleClass = selState.styleName,
                hiliter = selState.hiliter,
                isActive = hiliter['isActive']();
                //methods.clear();

                if( !isActive && (switchOnOffToggle === "on" || switchOnOffToggle === "toggle" )){
                    //turn on
                    //log('adding hilite for selState ' + selState.idx + ': ' + selState.text ) //selog temp logging
                    hiliter.applyToRange(range);
                    //log('trying to apply range:  ' +range )
                    //apply the visual styles with the generic classes
                    $('.'+hiliter['class']).addClass(styleClass);
                    //apply css classes to start and end so we can style those specially
                    hiliter['get$start']().addClass(styleClass+'_start');
                    hiliter['get$end']().addClass(styleClass+'_end');

                    //clear the selection
                    methods.clear();
                    
                }else if( isActive && (switchOnOffToggle === "off" || switchOnOffToggle === "toggle" )){
                    //turn off
                    //log('removing hilite for selState ' + selState.idx + ': ' + selState.text ) //selog temp logging
                    //remove the classes again so that the hiliter can normalize the selection (paste it back together)
                    //log('trying to remove range:  ' +range )
                    hiliter['get$start']().removeClass(styleClass+'_start');
                    hiliter['get$end']().removeClass(styleClass+'_end');
                    $('.'+hiliter['class']).removeClass(styleClass);
                    
                    //do one more check even though we shouldn't have to.
                    if(hiliter.isAppliedToRange(range)){
                        hiliter.undoToRange(range);
                    }
                    else{
                    }
                }
                
                return selState;
            }
            function _rangeOffSet(range, optsParam){ 
                // returns a range or false, which should trigger the caller to fail gracefully.
                var defaults = {
                    start: true, //start or end offset?
                    offset: undefined, // absolute offset should be a positive or negative number to add to the offset
                    relOffset: undefined // (relative offset) is ignored if offset is set
                },
                opts = $.extend({}, defaults, optsParam),
                iniOffset = (opts.start) ? range.startOffset : range.endOffset; //rangy range properties startOffset, endOffset
                if(typeof opts.offset === "undefined" ){
                    if(typeof opts.relOffset === "undefined" ){
                        return iniOffset;
                    }//else
                    opts.offset = iniOffset + opts.relOffset;
                }
                try{
                    if(opts.start){
                        range.setStart(range.startContainer, opts.offset); //rangy function setStart, attribute startContainer
                    }else{
                        range.setEnd(range.endContainer, opts.offset); //rangy function setEnd, attribute endContainer   
                    }
                    return range;
                }catch(e){
                    //[cleanlogz](e); //range out of bounds
                    return false;
                }
            }
            function _filter(range, filterList){
                // I think only firefox allows for multiple ranges to be selected, and no one really does it.
                // Besides, for our tool, we'd prob have to just use the first one anyway..
                // For now, just use only the first range on the rare case where someone tries to pass more than 1. (ranges[0])

                //filterList should be a filter-name string or an arr of filters,
                // which in turn are either a filter-name string or an arr: [filterNameStr, params.,.,. ];
                //todo: this syntax is a liiiiittle bit crazy.

                var scope = this,
                filters = _modifierFilters, //make default all filters
                //defaultFilters = ['stripWhiteSpace', 'firstWordSnap', 'lastWordSnap'],
                doFilters = {};  //will be {filter:paramList}

                //if filters not specifed, call all filters
                if ( typeof filterList === "undefined" || filterList === null ){
                    $.each(filters, function(funcName, func){
                        doFilters[funcName] = [];
                    });
                }
                else if ( typeof filterList === "string" ){
                    doFilters[filterList] = [];
                }
                else{
                    //todo: combine with above with a recurse call instead?
                    $.each(filterList, function(idx, func){
                        if ( typeof func === "string" ){
                            doFilters[func] = [];
                        }else{
                            //func is an arr
                            var funcName = func[0];
                            var params = (func.length > 1) ? func.slice(1) : [];
                            doFilters[funcName] = params;
                        }
                    
                    });
                }
                $.each(doFilters, function(funcName, params){
                    var filterFunc = filters[ funcName ] || function(){
                    };
                    //finally, run em'.
                    range = filterFunc(range, params);
                });              
                return range;
            }

            function _tempTesting(){ 
                    /*
                * testing temp function
                */
                //make $tempButtons output
                //hide for now
                var $tempButtons = $('<div id="rdr_selectionographer_tester" class="no-rdr"/>').hide(),
                buttonInfo = [
                    //note, remember to use $R instead of $ if calling in firebug
                    {
                        name:'save',
                        func:'save',
                        attr:undefined
                    },
                    {
                        name:'clear',
                        func:'clear',
                        attr:undefined
                    },
                    {
                        name:'activate',
                        func:'activate',
                        attr:undefined
                    },
                    {
                        name:'modify',
                        func:'modify',
                        attr:undefined
                    },
                    {
                        name:'hilite',
                        func:'hilite',
                        attr:undefined
                    },
                    {
                        name:'find',
                        func:'find',
                        attr:undefined
                    }
                ];
                $.each(buttonInfo,function(idx, val){
                    var $button = $('<div class="rdr_tempButton rdr_tempButton_'+this.name+'"><a href=\"javascript:void(0);\">'+this.name+'</a><input class="input1" /></div>');
                    
                    $button.find('a').click(function(){
                        var result, selState,
                        input = $(this).parent().find('input').eq(0).val(),
                        contextStr = $context.find('input').val();
                        val.attr= (input === "" ) ? undefined : input;
                        if(val.name == "find"){
                            result = $(contextStr).selog(val.func, val.attr);
                        }
                        if(val.name == "hilite"){
                            input2 = $(this).parent().find('input').eq(1).val();
                            selState = $(contextStr).selog(val.func, val.attr, input2);
                        }
                        else{
                            selState = $(contextStr).selog(val.func, val.attr);
                        }
                    });
                    $tempButtons.append($button);
                });
                
                var $output = $('<div id="rdr_tempOutput" />').css({'font-size':'12px'}); //filled out for now with save function
                var $context = $('<div><span style="margin-left:13px;"> in: </span><input class="input2"  /></div>');
                $tempButtons.append($context, $output);

                $tempButtons.css({'position':'fixed', 'margin-left':'5px', 'top': '75px'});
                $tempButtons.children('.rdr_tempButton').css({'margin':'4px 0'});
                $tempButtons.find('input').css({'left':'55px', 'width':'60px','position':'absolute'});

                $tempButtons.find('input:lt(2)').remove();
                $tempButtons.find('.rdr_tempButton_hilite')//cont
                .append('<input class="" style="left: 100px; position: relative; width:50px;" value="toggle"/>'); /*default toggle*/

                $('#rdr_sandbox').append($tempButtons);
            }
            //end private functions

            //init selog on window.
            $(document).selog();

        }
        //end function plugin_jquery_selectionographer

        function plugin_jquery_textnodes($){
            /*
             * jQuery Plugin by eric@readrboard.com
             * gets or sets delicious raw textnode leafs within a $() set.
             * todo: confirm if we need anymore 'ignore' checks for other nodetypes
             */

             //this isn't being used right now - ec 

            $.fn.textnodes = function(injectText){
                // If injectText is passed as a string or array of strings, replace 'this' content with corresponding textnodes.
                // Else, return all offspring textnodes in a flattened array.
                var $ret = $('<span/>'),
                $this = this,
                doc = ($this[0] && $this[0].ownerDocument || document);

                if ( typeof injectText != 'undefined' ){
                    $.each(injectText, function(idx, val){
                        var textnode = doc.createTextNode( val );
                        $ret.append(textnode);
                    });
                    $this.each(function(){
                        $(this).empty();
                        $(this).append($ret.contents());
                    });
                }
                //else no param: find textnodes

                //recursive function to look depth first for textnodes
                //param: a parent node, returns: an array of textnodes
                function _mineParentForText(parent){
                    return $.map( parent.childNodes, function(child){
                        if ( child.nodeType === 8) return;    // comment node leaf, ignore.
                        //else
                        if ( child.nodeType !== 3 )          // if not textnode, look deeper
                            return _mineParentForText(child);
                        //else
                        if ( child.nodeType === 3 )          // eureka. A textnode leaf.
                            return child;
                    });                
                }

                return $this.map(function(){
                    return _mineParentForText(this);
                });
            };
        }
        //end function plugin_jquery_textnodes
        

        function plugin_jquery_superRange($){
            /*
             *
             *
             */
            
            //nothing to see here: starting to work on superRange plugin
            //superRange or SR.
            //this isn't being used right now - ec 

            $.fn.superRange = function(options){
                var $this = this,
                settings = options || {};

                return $this.each(function(idx, val){
                    var contextNode = this,
                    superRange = $.extend({
                        contextNode: contextNode,
                        textnodes: $(contextNode).textnodes(),  //requires jquery.textnodes.js plugin
                        start: null,
                        end: null,
                        startRange: null,   //set below
                        endRange: null,     //set below
                        text: "",           //set below
                        hash: null          //set below
                    }, settings);

                    //complete superRange
                    superRange = superRange._parse();
                    
                    //set text and hash
                    //todo: fix this
                    $.each(superRange.textnodes, function(idx, val){
                        superRange.text += val.data; //data is textnode's string value
                    });
                    superRange.hash = "make hash here.."; //todo: make hash                
                });
            };

            //private functions
            function _parse(superRangeParam){
                // if given an explicit startRange and endRange, use those and calculate the start and end.
                // else do the inverse,

                var stepIdx = 0,
                superRange = (typeof superRangeParam !== "undefined") ? superRangeParam : this,
                missingSuperOffsets = ( superRange.start === null || superRange.end === null ),
                missingRanges =  ( superRange.startRange === null || superRange.endRange === null );

                if ( missingSuperOffsets && missingRanges ) return false;
                if ( !missingSuperOffsets && !missingRanges ) return superRange;
                if ( missingSuperOffsets && !missingRanges ){
                    //get start and end
                    $.each(superRange.textnodes, function(idx, textnode){
                        if( textnode == superRange.startRange.node ){
                            superRange.start = stepIdx + superRange.startRange.offset;
                        }
                        if( textnode == superRange.endRange.node ){
                            superRange.end = stepIdx + superRange.endRange.offset;
                        }
                        stepIdx += textnode.length;
                    });
                    return superRange;
                }
                if ( !missingSuperOffsets && missingRanges ){
                    //get startRange and endRange
                    $.each(superRange.textnodes, function(idx, textnode){
                        var a = stepIdx,
                        start = superRange.start,
                        end = superRange.end,
                        b = stepIdx + textnode.length;

                        if( a > start && start < b ){
                            superRange.startRange = {
                                node: textnode,
                                //nodeIndex: idx,
                                offset: stepIdx - start   //lookbehind to get rel start index for this textnode
                            };
                        }
                        if( a > end && end < b ){
                            superRange.endRange = {
                                node: textnode,
                                //nodeIndex: idx,
                                offset: stepIdx - end     //lookbehind to get rel end index for this textnode
                            };
                        }
                        stepIdx = b;
                    });
                    return superRange;
                }
                //else impossible
            }
            
        }
        //end function plugin_jquery_superRange

        function plugin_jquery_improvedCSS($){
            //improvedCSS.js  http://plugins.jquery.com/node/8726/release
            /**
            * @Keith Bentrup
            */
            $.fn.css2 = $.fn.css; 
            $.fn.css = function () {
                if (arguments.length) return $.fn.css2.apply(this,arguments);
                var attr = ['font-family','font-size','font-weight','font-style','color',
                  'text-transform','text-decoration','letter-spacing','word-spacing',
                  'lineHeight','text-align','vertical-align','direction','background-color',
                  'background-image','background-repeat','background-position',
                  'background-attachment','opacity','width','height','top','right','bottom',
                  'left','margin-top','margin-right','margin-bottom','margin-left',
                  'padding-top','padding-right','padding-bottom','padding-left',
                  'border-top-width','border-right-width','border-bottom-width',
                  'border-left-width','border-top-color','border-right-color',
                  'border-bottom-color','border-left-color','border-top-style',
                  'border-right-style','border-bottom-style','border-left-style','position',
                  'display','visibility','z-index','overflow-x','overflow-y','white-space',
                  'clip','float','clear','cursor','list-style-image','list-style-position',
                  'list-style-type','marker-offset'
                ];
                var len = attr.length, obj = {}, val;
                for (var i = 0; i < len; i++) {
                    //correct for ie
                    val = attr[i];


                    obj[val] = $.fn.css2.call(this, val);

                    if(val == "lineHeight"){
                        obj[val] = $.fn.css2.call(this, "auto");
                    }
                    val = (typeof val === "undefined") ? 'auto' :  val;
                }
                return obj;
            };
        }
        //end function plugin_jquery_improvedCSS

        //todo: I don't think we're using this any more - remove it?
        function plugin_jquery_hashChange($){
            /*
             * jQuery hashchange event - v1.3 - 7/21/2010
             * http://benalman.com/projects/jquery-hashchange-plugin/
             * 
             * Copyright (c) 2010 "Cowboy" Ben Alman
             * Dual licensed under the MIT and GPL licenses.
             * http://benalman.com/about/license/
             */
            
            // args passed into minified function
            var e = window,
                b = undefined;

            var c="hashchange",h=document,f,g=$.event.special,i=h.documentMode,d="on"+c in e&&(i===b||i>7);function a(j){j=j||location.href;return"#"+j.replace(/^[^#]*#?(.*)$/,"$1")}$.fn[c]=function(j){return j?this.bind(c,j):this.trigger(c)};$.fn[c].delay=50;g[c]=$.extend(g[c],{setup:function(){if(d){return false}$(f.start)},teardown:function(){if(d){return false}$(f.stop)}});f=(function(){var j={},p,m=a(),k=function(q){return q},l=k,o=k;j.start=function(){p||n()};j.stop=function(){p&&clearTimeout(p);p=b};function n(){var r=a(),q=o(m);if(r!==m){l(m=r,q);$(e).trigger(c)}else{if(q!==m){location.href=location.href.replace(/#.*/,"")+q}}p=setTimeout(n,$.fn[c].delay)}$.browser.msie&&!d&&(function(){var q,r;j.start=function(){if(!q){r=$.fn[c].src;r=r&&r+a();q=$('<iframe tabindex="-1" title="empty"/>').hide().one("load",function(){r||l(a());n()}).attr("src",r||"javascript:0").insertAfter("body")[0].contentWindow;h.onpropertychange=function(){try{if(event.propertyName==="title"){q.document.title=h.title}}catch(s){}}}};j.stop=k;o=function(){return a(q.location.href)};l=function(v,s){var u=q.document,t=$.fn[c].domain;if(v!==s){u.title=h.title;u.open();t&&u.write('<script>document.domain="'+t+'"<\/script>');u.close();q.location.hash=v}}})();return j})();
        }

        function plugin_jquery_autogrow($){
            /*
             * modified by PB from...
             * jQuery autoResize (textarea auto-resizer)
             * @copyright James Padolsey http://james.padolsey.com
             * @version 1.04
             */

            // a.fn.autogrow=function(j){var b=a.extend({onResize:function(){},animate:true,animateDuration:150,animateCallback:function(){},extraSpace:20,limit:1000},j);this.filter('textarea').each(function(){var c=a(this).css({resize:'none','overflow-y':'hidden'}),k=c.height(),f=(function(){var l=['height','width','lineHeight','textDecoration','letterSpacing'],h={};a.each(l,function(d,e){h[e]=c.css(e)});return c.clone().removeAttr('id').removeAttr('name').css({position:'absolute',top:0,left:-9999}).css(h).attr('tabIndex','-1').insertBefore(c)})(),i=null,g=function(){f.height(0).val(a(this).val()).scrollTop(10000);var d=Math.max(f.scrollTop(),k)+b.extraSpace,e=a(this).add(f);if(i===d){return}i=d;if(d>=b.limit){a(this).css('overflow-y','');return}b.onResize.call(this);b.animate&&c.css('display')==='block'?e.stop().animate({height:d},b.animateDuration,b.animateCallback):e.height(d)};c.unbind('.dynSiz').bind('keyup.dynSiz',g).bind('keydown.dynSiz',g).bind('change.dynSiz',g)});return this};
            $.fn.autogrow = function() {
                // this.filter('textarea').each(function() {
                $('#rdr_shadow').remove();

                var $this       = $(this),
                    minHeight   = 67,
                    lineHeight  = $this.css('fontSize'); // used to be 'lineHeight' but that made the textarea too tall

                var shadow = $('<div id="rdr_shadow"></div>').css({
                    position:   'absolute',
                    top:        -10000,
                    left:       -10000,
                    width:      $(this).width() - parseInt($this.css('paddingLeft'), 10) - parseInt($this.css('paddingRight'), 10),
                    fontSize:   $this.css('fontSize'),
                    fontFamily: $this.css('fontFamily'),
                    lineHeight: $this.css('fontSize'), // used to be 'lineHeight' but that made the textarea too tall
                    resize:     'none'
                }).appendTo(document.body);

                var update = function() {

                    var times = function(string, number) {
                        for (var i = 0, r = ''; i < number; i ++) r += string;
                        return r;
                    };
                    
                    var val = this.value.replace(/</g, '&lt;')
                                        .replace(/>/g, '&gt;')
                                        .replace(/&/g, '&amp;')
                                        .replace(/\n$/, '<br/>&nbsp;')
                                        .replace(/\n/g, '<br/>')
                                        .replace(/ {2,}/g, function(space) { return times('&nbsp;', space.length -1) + ' ' });
                    
                    shadow.html(val);
                    //rinh $(this).css('height', Math.max(shadow.height()-10, minHeight));
                    RDR.rindow.jspUpdate( $this.closest('div.rdr.rdr_window') );
                };

                $(this).change(update).keyup(update).keydown(update);
                // $(this).keydown(update);

                    // update.apply(this);

                // });
                return this;
            };
        }
        //end function plugin_jquery_autogrow
        
        function plugin_jquery_mousewheel($){
            /*
            * jQuery mousewheel
            * ! Copyright (c) 2010 Brandon Aaron (http://brandonaaron.net)
            * Licensed under the MIT License (LICENSE.txt).
            *
            * Thanks to: http://adomas.org/javascript-mouse-wheel/ for some pointers.
            * Thanks to: Mathias Bank(http://www.mathias-bank.de) for a scope bug fix.
            * Thanks to: Seamus Leahy for adding deltaX and deltaY
            *
            * Version: 3.0.4
            * 
            * Requires: 1.2.2+
            */
            var types=['DOMMouseScroll','mousewheel'];$.event.special.mousewheel={setup:function(){if(this.addEventListener){for(var i=types.length;i;){this.addEventListener(types[--i],handler,false);}}else{this.onmousewheel=handler;}},teardown:function(){if(this.removeEventListener){for(var i=types.length;i;){this.removeEventListener(types[--i],handler,false);}}else{this.onmousewheel=null;}}};$.fn.extend({mousewheel:function(fn){return fn?this.bind("mousewheel",fn):this.trigger("mousewheel");},unmousewheel:function(fn){return this.unbind("mousewheel",fn);}});function handler(event){var orgEvent=event||window.event,args=[].slice.call(arguments,1),delta=0,returnValue=true,deltaX=0,deltaY=0;event=$.event.fix(orgEvent);event.type="mousewheel";if(event.wheelDelta){delta=event.wheelDelta/120;}
            if(event.detail){delta=-event.detail/3;}
            deltaY=delta;if(orgEvent.axis!==undefined&&orgEvent.axis===orgEvent.HORIZONTAL_AXIS){deltaY=0;deltaX=-1*delta;}
            if(orgEvent.wheelDeltaY!==undefined){deltaY=orgEvent.wheelDeltaY/120;}
            if(orgEvent.wheelDeltaX!==undefined){deltaX=-1*orgEvent.wheelDeltaX/120;}
            args.unshift(event,delta,deltaX,deltaY);return $.event.handle.apply(this,args);}
        }
        //end function plugin_jquery_mousewheel

        function plugin_jquery_mousewheelIntent($){
            /**
            * jQuery mousewheelIntent
            * @author trixta
            * @version 1.2
            */
            var mwheelI={pos:[-260,-260]},minDif=3,doc=document,root=doc.documentElement,body=doc.body,longDelay,shortDelay;function unsetPos(){if(this===mwheelI.elem){mwheelI.pos=[-260,-260];mwheelI.elem=false;minDif=3;}}
            $.event.special.mwheelIntent={setup:function(){var jElm=$(this).bind('mousewheel',$.event.special.mwheelIntent.handler);if(this!==doc&&this!==root&&this!==body){jElm.bind('mouseleave',unsetPos);}
            jElm=null;return true;},teardown:function(){$(this).unbind('mousewheel',$.event.special.mwheelIntent.handler).unbind('mouseleave',unsetPos);return true;},handler:function(e,d){var pos=[e.clientX,e.clientY];if(this===mwheelI.elem||Math.abs(mwheelI.pos[0]-pos[0])>minDif||Math.abs(mwheelI.pos[1]-pos[1])>minDif){mwheelI.elem=this;mwheelI.pos=pos;minDif=250;clearTimeout(shortDelay);shortDelay=setTimeout(function(){minDif=10;},200);clearTimeout(longDelay);longDelay=setTimeout(function(){minDif=3;},1500);e=$.extend({},e,{type:'mwheelIntent'});return $.event.handle.apply(this,arguments);}}};$.fn.extend({mwheelIntent:function(fn){return fn?this.bind("mwheelIntent",fn):this.trigger("mwheelIntent");},unmwheelIntent:function(fn){return this.unbind("mwheelIntent",fn);}});$(function(){body=doc.body;$(doc).bind('mwheelIntent.mwheelIntentDefault',$.noop);});
        }
        //end function plugin_jquery_mousewheelIntent

        function plugin_jquery_scrollStartAndStop(jQuery){
            /**
            * jQuery scrollstart and scrollstop
            * @author james padolsey
            * @version ??
            */
            // (function(){
                var a=jQuery.event.special,b="D"+ +(new Date),c="D"+(+(new Date)+1);a.scrollstart={setup:function(){var c,d=function(b){var d=this,e=arguments;if(c){clearTimeout(c)}else{b.type="scrollstart";jQuery.event.handle.apply(d,e)}c=setTimeout(function(){c=null},a.scrollstop.latency)};jQuery(this).bind("scroll",d).data(b,d)},teardown:function(){jQuery(this).unbind("scroll",jQuery(this).data(b))}};a.scrollstop={latency:300,setup:function(){var b,d=function(c){var d=this,e=arguments;if(b){clearTimeout(b)}b=setTimeout(function(){b=null;c.type="scrollstop";jQuery.event.handle.apply(d,e)},a.scrollstop.latency)};jQuery(this).bind("scroll",d).data(c,d)},teardown:function(){jQuery(this).unbind("scroll",jQuery(this).data(c))}}
            // })
        }
        //end function plugin_jquery_mousewheelIntent

        function plugin_jquery_jScrollPane($){
            /*
             * jScrollPane - v2.0.0beta11 - 2011-05-02
             * http://jscrollpane.kelvinluck.com/
             *
             * Copyright (c) 2010 Kelvin Luck
             * Dual licensed under the MIT and GPL licenses.
             */

            //fix minifier quirks
            var b = $,
            a = window,
            c = undefined;

            b.fn.jScrollPane=function(e){function d(D,O){var az,Q=this,Y,ak,v,am,T,Z,y,q,aA,aF,av,i,I,h,j,aa,U,aq,X,t,A,ar,af,an,G,l,au,ay,x,aw,aI,f,L,aj=true,P=true,aH=false,k=false,ap=D.clone(false,false).empty(),ac=b.fn.mwheelIntent?"mwheelIntent.jsp":"mousewheel.jsp";aI=D.css("paddingTop")+" "+D.css("paddingRight")+" "+D.css("paddingBottom")+" "+D.css("paddingLeft");f=(parseInt(D.css("paddingLeft"),10)||0)+(parseInt(D.css("paddingRight"),10)||0);function at(aR){var aM,aO,aN,aK,aJ,aQ,aP=false,aL=false;az=aR;if(Y===c){aJ=D.scrollTop();aQ=D.scrollLeft();D.css({overflow:"hidden",padding:0});ak=D.innerWidth()+f;v=D.innerHeight();D.width(ak);Y=b('<div class="jspPane" />').css("padding",aI).append(D.children());am=b('<div class="jspContainer" />').css({width:ak+"px",height:v+"px"}).append(Y).appendTo(D)}else{D.css("width","");aP=az.stickToBottom&&K();aL=az.stickToRight&&B();aK=D.innerWidth()+f!=ak||D.outerHeight()!=v;if(aK){ak=D.innerWidth()+f;v=D.innerHeight();am.css({width:ak+"px",height:v+"px"})}if(!aK&&L==T&&Y.outerHeight()==Z){D.width(ak);return}L=T;Y.css("width","");D.width(ak);am.find(">.jspVerticalBar,>.jspHorizontalBar").remove().end()}Y.css("overflow","auto");if(aR.contentWidth){T=aR.contentWidth}else{T=Y[0].scrollWidth}Z=Y[0].scrollHeight;Y.css("overflow","");y=T/ak;q=Z/v;aA=q>1;aF=y>1;if(!(aF||aA)){D.removeClass("jspScrollable");Y.css({top:0,width:am.width()-f});n();E();R();w();ai()}else{D.addClass("jspScrollable");aM=az.maintainPosition&&(I||aa);if(aM){aO=aD();aN=aB()}aG();z();F();if(aM){N(aL?(T-ak):aO,false);M(aP?(Z-v):aN,false)}J();ag();ao();if(az.enableKeyboardNavigation){S()}if(az.clickOnTrack){p()}C();if(az.hijackInternalLinks){m()}}if(az.autoReinitialise&&!aw){aw=setInterval(function(){at(az)},az.autoReinitialiseDelay)}else{if(!az.autoReinitialise&&aw){clearInterval(aw)}}aJ&&D.scrollTop(0)&&M(aJ,false);aQ&&D.scrollLeft(0)&&N(aQ,false);D.trigger("jsp-initialised",[aF||aA])}function aG(){if(aA){am.append(b('<div class="jspVerticalBar" />').append(b('<div class="jspCap jspCapTop" />'),b('<div class="jspTrack" />').append(b('<div class="jspDrag" />').append(b('<div class="jspDragTop" />'),b('<div class="jspDragBottom" />'))),b('<div class="jspCap jspCapBottom" />')));U=am.find(">.jspVerticalBar");aq=U.find(">.jspTrack");av=aq.find(">.jspDrag");if(az.showArrows){ar=b('<a class="jspArrow jspArrowUp" />').bind("mousedown.jsp",aE(0,-1)).bind("click.jsp",aC);af=b('<a class="jspArrow jspArrowDown" />').bind("mousedown.jsp",aE(0,1)).bind("click.jsp",aC);if(az.arrowScrollOnHover){ar.bind("mouseover.jsp",aE(0,-1,ar));af.bind("mouseover.jsp",aE(0,1,af))}al(aq,az.verticalArrowPositions,ar,af)}t=v;am.find(">.jspVerticalBar>.jspCap:visible,>.jspVerticalBar>.jspArrow").each(function(){t-=b(this).outerHeight()});av.hover(function(){av.addClass("jspHover")},function(){av.removeClass("jspHover")}).bind("mousedown.jsp",function(aJ){b("html").bind("dragstart.jsp selectstart.jsp",aC);av.addClass("jspActive");var s=aJ.pageY-av.position().top;b("html").bind("mousemove.jsp",function(aK){V(aK.pageY-s,false)}).bind("mouseup.jsp mouseleave.jsp",ax);return false});o()}}function o(){aq.height(t+"px");I=0;X=az.verticalGutter+aq.outerWidth();Y.width(ak-X-f);try{if(U.position().left===0){Y.css("margin-left",X+"px")}}catch(s){}}function z(){if(aF){am.append(b('<div class="jspHorizontalBar" />').append(b('<div class="jspCap jspCapLeft" />'),b('<div class="jspTrack" />').append(b('<div class="jspDrag" />').append(b('<div class="jspDragLeft" />'),b('<div class="jspDragRight" />'))),b('<div class="jspCap jspCapRight" />')));an=am.find(">.jspHorizontalBar");G=an.find(">.jspTrack");h=G.find(">.jspDrag");if(az.showArrows){ay=b('<a class="jspArrow jspArrowLeft" />').bind("mousedown.jsp",aE(-1,0)).bind("click.jsp",aC);x=b('<a class="jspArrow jspArrowRight" />').bind("mousedown.jsp",aE(1,0)).bind("click.jsp",aC);
            if(az.arrowScrollOnHover){ay.bind("mouseover.jsp",aE(-1,0,ay));x.bind("mouseover.jsp",aE(1,0,x))}al(G,az.horizontalArrowPositions,ay,x)}h.hover(function(){h.addClass("jspHover")},function(){h.removeClass("jspHover")}).bind("mousedown.jsp",function(aJ){b("html").bind("dragstart.jsp selectstart.jsp",aC);h.addClass("jspActive");var s=aJ.pageX-h.position().left;b("html").bind("mousemove.jsp",function(aK){W(aK.pageX-s,false)}).bind("mouseup.jsp mouseleave.jsp",ax);return false});l=am.innerWidth();ah()}}function ah(){am.find(">.jspHorizontalBar>.jspCap:visible,>.jspHorizontalBar>.jspArrow").each(function(){l-=b(this).outerWidth()});G.width(l+"px");aa=0}function F(){if(aF&&aA){var aJ=G.outerHeight(),s=aq.outerWidth();t-=aJ;b(an).find(">.jspCap:visible,>.jspArrow").each(function(){l+=b(this).outerWidth()});l-=s;v-=s;ak-=aJ;G.parent().append(b('<div class="jspCorner" />').css("width",aJ+"px"));o();ah()}if(aF){Y.width((am.outerWidth()-f)+"px")}Z=Y.outerHeight();q=Z/v;if(aF){au=Math.ceil(1/y*l);if(au>az.horizontalDragMaxWidth){au=az.horizontalDragMaxWidth}else{if(au<az.horizontalDragMinWidth){au=az.horizontalDragMinWidth}}h.width(au+"px");j=l-au;ae(aa)}if(aA){A=Math.ceil(1/q*t);if(A>az.verticalDragMaxHeight){A=az.verticalDragMaxHeight}else{if(A<az.verticalDragMinHeight){A=az.verticalDragMinHeight}}av.height(A+"px");i=t-A;ad(I)}}function al(aK,aM,aJ,s){var aO="before",aL="after",aN;if(aM=="os"){aM=/Mac/.test(navigator.platform)?"after":"split"}if(aM==aO){aL=aM}else{if(aM==aL){aO=aM;aN=aJ;aJ=s;s=aN}}aK[aO](aJ)[aL](s)}function aE(aJ,s,aK){return function(){H(aJ,s,this,aK);this.blur();return false}}function H(aM,aL,aP,aO){aP=b(aP).addClass("jspActive");var aN,aK,aJ=true,s=function(){if(aM!==0){Q.scrollByX(aM*az.arrowButtonSpeed)}if(aL!==0){Q.scrollByY(aL*az.arrowButtonSpeed)}aK=setTimeout(s,aJ?az.initialDelay:az.arrowRepeatFreq);aJ=false};s();aN=aO?"mouseout.jsp":"mouseup.jsp";aO=aO||b("html");aO.bind(aN,function(){aP.removeClass("jspActive");aK&&clearTimeout(aK);aK=null;aO.unbind(aN)})}function p(){w();if(aA){aq.bind("mousedown.jsp",function(aO){if(aO.originalTarget===c||aO.originalTarget==aO.currentTarget){var aM=b(this),aP=aM.offset(),aN=aO.pageY-aP.top-I,aK,aJ=true,s=function(){var aS=aM.offset(),aT=aO.pageY-aS.top-A/2,aQ=v*az.scrollPagePercent,aR=i*aQ/(Z-v);if(aN<0){if(I-aR>aT){Q.scrollByY(-aQ)}else{V(aT)}}else{if(aN>0){if(I+aR<aT){Q.scrollByY(aQ)}else{V(aT)}}else{aL();return}}aK=setTimeout(s,aJ?az.initialDelay:az.trackClickRepeatFreq);aJ=false},aL=function(){aK&&clearTimeout(aK);aK=null;b(document).unbind("mouseup.jsp",aL)};s();b(document).bind("mouseup.jsp",aL);return false}})}if(aF){G.bind("mousedown.jsp",function(aO){if(aO.originalTarget===c||aO.originalTarget==aO.currentTarget){var aM=b(this),aP=aM.offset(),aN=aO.pageX-aP.left-aa,aK,aJ=true,s=function(){var aS=aM.offset(),aT=aO.pageX-aS.left-au/2,aQ=ak*az.scrollPagePercent,aR=j*aQ/(T-ak);if(aN<0){if(aa-aR>aT){Q.scrollByX(-aQ)}else{W(aT)}}else{if(aN>0){if(aa+aR<aT){Q.scrollByX(aQ)}else{W(aT)}}else{aL();return}}aK=setTimeout(s,aJ?az.initialDelay:az.trackClickRepeatFreq);aJ=false},aL=function(){aK&&clearTimeout(aK);aK=null;b(document).unbind("mouseup.jsp",aL)};s();b(document).bind("mouseup.jsp",aL);return false}})}}function w(){if(G){G.unbind("mousedown.jsp")}if(aq){aq.unbind("mousedown.jsp")}}function ax(){b("html").unbind("dragstart.jsp selectstart.jsp mousemove.jsp mouseup.jsp mouseleave.jsp");if(av){av.removeClass("jspActive")}if(h){h.removeClass("jspActive")}}function V(s,aJ){if(!aA){return}if(s<0){s=0}else{if(s>i){s=i}}if(aJ===c){aJ=az.animateScroll}if(aJ){Q.animate(av,"top",s,ad)}else{av.css("top",s);ad(s)}}function ad(aJ){if(aJ===c){aJ=av.position().top}am.scrollTop(0);I=aJ;var aM=I===0,aK=I==i,aL=aJ/i,s=-aL*(Z-v);if(aj!=aM||aH!=aK){aj=aM;aH=aK;D.trigger("jsp-arrow-change",[aj,aH,P,k])}u(aM,aK);Y.css("top",s);D.trigger("jsp-scroll-y",[-s,aM,aK]).trigger("scroll")}function W(aJ,s){if(!aF){return}if(aJ<0){aJ=0}else{if(aJ>j){aJ=j}}if(s===c){s=az.animateScroll}if(s){Q.animate(h,"left",aJ,ae)
            }else{h.css("left",aJ);ae(aJ)}}function ae(aJ){if(aJ===c){aJ=h.position().left}am.scrollTop(0);aa=aJ;var aM=aa===0,aL=aa==j,aK=aJ/j,s=-aK*(T-ak);if(P!=aM||k!=aL){P=aM;k=aL;D.trigger("jsp-arrow-change",[aj,aH,P,k])}r(aM,aL);Y.css("left",s);D.trigger("jsp-scroll-x",[-s,aM,aL]).trigger("scroll")}function u(aJ,s){if(az.showArrows){ar[aJ?"addClass":"removeClass"]("jspDisabled");af[s?"addClass":"removeClass"]("jspDisabled")}}function r(aJ,s){if(az.showArrows){ay[aJ?"addClass":"removeClass"]("jspDisabled");x[s?"addClass":"removeClass"]("jspDisabled")}}function M(s,aJ){var aK=s/(Z-v);V(aK*i,aJ)}function N(aJ,s){var aK=aJ/(T-ak);W(aK*j,s)}function ab(aW,aR,aK){var aO,aL,aM,s=0,aV=0,aJ,aQ,aP,aT,aS,aU;try{aO=b(aW)}catch(aN){return}aL=aO.outerHeight();aM=aO.outerWidth();am.scrollTop(0);am.scrollLeft(0);while(!aO.is(".jspPane")){s+=aO.position().top;aV+=aO.position().left;aO=aO.offsetParent();if(/^body|html$/i.test(aO[0].nodeName)){return}}aJ=aB();aP=aJ+v;if(s<aJ||aR){aS=s-az.verticalGutter}else{if(s+aL>aP){aS=s-v+aL+az.verticalGutter}}if(aS){M(aS,aK)}aQ=aD();aT=aQ+ak;if(aV<aQ||aR){aU=aV-az.horizontalGutter}else{if(aV+aM>aT){aU=aV-ak+aM+az.horizontalGutter}}if(aU){N(aU,aK)}}function aD(){return -Y.position().left}function aB(){return -Y.position().top}function K(){var s=Z-v;return(s>20)&&(s-aB()<10)}function B(){var s=T-ak;return(s>20)&&(s-aD()<10)}function ag(){am.unbind(ac).bind(ac,function(aM,aN,aL,aJ){var aK=aa,s=I;Q.scrollBy(aL*az.mouseWheelSpeed,-aJ*az.mouseWheelSpeed,false);return aK==aa&&s==I})}function n(){am.unbind(ac)}function aC(){return false}function J(){Y.find(":input,a").unbind("focus.jsp").bind("focus.jsp",function(s){ab(s.target,false)})}function E(){Y.find(":input,a").unbind("focus.jsp")}function S(){var s,aJ,aL=[];aF&&aL.push(an[0]);aA&&aL.push(U[0]);Y.focus(function(){D.focus()});D.attr("tabindex",0).unbind("keydown.jsp keypress.jsp").bind("keydown.jsp",function(aO){if(aO.target!==this&&!(aL.length&&b(aO.target).closest(aL).length)){return}var aN=aa,aM=I;switch(aO.keyCode){case 40:case 38:case 34:case 32:case 33:case 39:case 37:s=aO.keyCode;aK();break;case 35:M(Z-v);s=null;break;case 36:M(0);s=null;break}aJ=aO.keyCode==s&&aN!=aa||aM!=I;return !aJ}).bind("keypress.jsp",function(aM){if(aM.keyCode==s){aK()}return !aJ});if(az.hideFocus){D.css("outline","none");if("hideFocus" in am[0]){D.attr("hideFocus",true)}}else{D.css("outline","");if("hideFocus" in am[0]){D.attr("hideFocus",false)}}function aK(){var aN=aa,aM=I;switch(s){case 40:Q.scrollByY(az.keyboardSpeed,false);break;case 38:Q.scrollByY(-az.keyboardSpeed,false);break;case 34:case 32:Q.scrollByY(v*az.scrollPagePercent,false);break;case 33:Q.scrollByY(-v*az.scrollPagePercent,false);break;case 39:Q.scrollByX(az.keyboardSpeed,false);break;case 37:Q.scrollByX(-az.keyboardSpeed,false);break}aJ=aN!=aa||aM!=I;return aJ}}function R(){D.attr("tabindex","-1").removeAttr("tabindex").unbind("keydown.jsp keypress.jsp")}function C(){if(location.hash&&location.hash.length>1){var aK,aJ;try{aK=b(location.hash)}catch(s){return}if(aK.length&&Y.find(location.hash)){if(am.scrollTop()===0){aJ=setInterval(function(){if(am.scrollTop()>0){ab(location.hash,true);b(document).scrollTop(am.position().top);clearInterval(aJ)}},50)}else{ab(location.hash,true);b(document).scrollTop(am.position().top)}}}}function ai(){b("a.jspHijack").unbind("click.jsp-hijack").removeClass("jspHijack")}function m(){ai();b("a[href^=#]").addClass("jspHijack").bind("click.jsp-hijack",function(){var s=this.href.split("#"),aJ;if(s.length>1){aJ=s[1];if(aJ.length>0&&Y.find("#"+aJ).length>0){ab("#"+aJ,true);return false}}})}function ao(){var aK,aJ,aM,aL,aN,s=false;am.unbind("touchstart.jsp touchmove.jsp touchend.jsp click.jsp-touchclick").bind("touchstart.jsp",function(aO){var aP=aO.originalEvent.touches[0];aK=aD();aJ=aB();aM=aP.pageX;aL=aP.pageY;aN=false;s=true}).bind("touchmove.jsp",function(aR){if(!s){return}var aQ=aR.originalEvent.touches[0],aP=aa,aO=I;Q.scrollTo(aK+aM-aQ.pageX,aJ+aL-aQ.pageY);aN=aN||Math.abs(aM-aQ.pageX)>5||Math.abs(aL-aQ.pageY)>5;
            return aP==aa&&aO==I}).bind("touchend.jsp",function(aO){s=false}).bind("click.jsp-touchclick",function(aO){if(aN){aN=false;return false}})}function g(){var s=aB(),aJ=aD();D.removeClass("jspScrollable").unbind(".jsp");D.replaceWith(ap.append(Y.children()));ap.scrollTop(s);ap.scrollLeft(aJ)}b.extend(Q,{reinitialise:function(aJ){aJ=b.extend({},az,aJ);at(aJ)},scrollToElement:function(aK,aJ,s){ab(aK,aJ,s)},scrollTo:function(aK,s,aJ){N(aK,aJ);M(s,aJ)},scrollToX:function(aJ,s){N(aJ,s)},scrollToY:function(s,aJ){M(s,aJ)},scrollToPercentX:function(aJ,s){N(aJ*(T-ak),s)},scrollToPercentY:function(aJ,s){M(aJ*(Z-v),s)},scrollBy:function(aJ,s,aK){Q.scrollByX(aJ,aK);Q.scrollByY(s,aK)},scrollByX:function(s,aK){s=(s>=0)?Math.max(s,1):Math.min(s,-1);var aJ=aD()+s,aL=aJ/(T-ak);W(aL*j,aK)},scrollByY:function(s,aK){s=(s>=0)?Math.max(s,1):Math.min(s,-1);var aJ=aB()+s,aL=aJ/(Z-v);V(aL*i,aK)},positionDragX:function(s,aJ){W(s,aJ)},positionDragY:function(aJ,s){V(aJ,s)},animate:function(aJ,aM,s,aL){var aK={};aK[aM]=s;aJ.animate(aK,{duration:az.animateDuration,ease:az.animateEase,queue:false,step:aL})},getContentPositionX:function(){return aD()},getContentPositionY:function(){return aB()},getContentWidth:function(){return T},getContentHeight:function(){return Z},getPercentScrolledX:function(){return aD()/(T-ak)},getPercentScrolledY:function(){return aB()/(Z-v)},getIsScrollableH:function(){return aF},getIsScrollableV:function(){return aA},getContentPane:function(){return Y},scrollToBottom:function(s){V(i,s)},hijackInternalLinks:function(){m()},destroy:function(){g()}});at(O)}e=b.extend({},b.fn.jScrollPane.defaults,e);b.each(["mouseWheelSpeed","arrowButtonSpeed","trackClickSpeed","keyboardSpeed"],function(){e[this]=e[this]||e.speed});return this.each(function(){var f=b(this),g=f.data("jsp");if(g){g.reinitialise(e)}else{g=new d(f,e);f.data("jsp",g)}})};b.fn.jScrollPane.defaults={showArrows:false,maintainPosition:true,stickToBottom:false,stickToRight:false,clickOnTrack:true,autoReinitialise:false,autoReinitialiseDelay:500,verticalDragMinHeight:0,verticalDragMaxHeight:99999,horizontalDragMinWidth:0,horizontalDragMaxWidth:99999,contentWidth:c,animateScroll:false,animateDuration:300,animateEase:"linear",hijackInternalLinks:false,verticalGutter:4,horizontalGutter:4,mouseWheelSpeed:0,arrowButtonSpeed:0,arrowRepeatFreq:50,arrowScrollOnHover:false,trackClickSpeed:0,trackClickRepeatFreq:70,verticalArrowPositions:"split",horizontalArrowPositions:"split",enableKeyboardNavigation:true,hideFocus:false,keyboardSpeed:0,initialDelay:300,speed:30,scrollPagePercent:0.8}
        }
        //end function plugin_jquery_jScrollPane

                
        function plugin_rangy(){

            /***************/
            /*rangy scripts*/
            /***************/

            //rangy-core.js
            /*
             Rangy, a cross-browser JavaScript range and selection library
             http://code.google.com/p/rangy/

             Copyright 2011, Tim Down
             Licensed under the MIT license.
             //todo: update the version number
             Version: 1.1.2 - I believe this is now using Rangy 1.2 beta 2 release from 5 August 2011 
             Build date: 30 May 2011 - I believe this is now using Rangy 1.2 beta 2 release from 5 August 2011 
            */
            
            /*readrboard tweak to code:  replaced 4 instances of "span" with the var rdr_node */
            var rdr_node = "ins"; /*use the html node ins instead of span to avoid having the client's css affect our hilite wrapper*/

            var rangy=function(){function k(o,u){var x=typeof o[u];return x=="function"||!!(x=="object"&&o[u])||x=="unknown"}function L(o,u){return!!(typeof o[u]=="object"&&o[u])}function J(o,u){return typeof o[u]!="undefined"}function K(o){return function(u,x){for(var B=x.length;B--;)if(!o(u,x[B]))return false;return true}}function z(o){return o&&A(o,y)&&v(o,s)}function C(o){window.alert("Rangy not supported in your browser. Reason: "+o);c.initialized=true;c.supported=false}function N(){if(!c.initialized){var o,
            u=false,x=false;if(k(document,"createRange")){o=document.createRange();if(A(o,n)&&v(o,h))u=true;o.detach()}if((o=L(document,"body")?document.body:document.getElementsByTagName("body")[0])&&k(o,"createTextRange")){o=o.createTextRange();if(z(o))x=true}!u&&!x&&C("Neither Range nor TextRange are implemented");c.initialized=true;c.features={implementsDomRange:u,implementsTextRange:x};u=j.concat(f);x=0;for(o=u.length;x<o;++x)try{u[x](c)}catch(B){L(window,"console")&&k(window.console,"log")&&window.console.log("Init listener threw an exception. Continuing.",
            B)}}}function P(o){this.name=o;this.supported=this.initialized=false}var h=["startContainer","startOffset","endContainer","endOffset","collapsed","commonAncestorContainer","START_TO_START","START_TO_END","END_TO_START","END_TO_END"],n=["setStart","setStartBefore","setStartAfter","setEnd","setEndBefore","setEndAfter","collapse","selectNode","selectNodeContents","compareBoundaryPoints","deleteContents","extractContents","cloneContents","insertNode","surroundContents","cloneRange","toString","detach"],
            s=["boundingHeight","boundingLeft","boundingTop","boundingWidth","htmlText","text"],y=["collapse","compareEndPoints","duplicate","getBookmark","moveToBookmark","moveToElementText","parentElement","pasteHTML","select","setEndPoint"],A=K(k),p=K(L),v=K(J),c={version:"1.2beta2",initialized:false,supported:true,util:{isHostMethod:k,isHostObject:L,isHostProperty:J,areHostMethods:A,areHostObjects:p,areHostProperties:v,isTextRange:z},features:{},modules:{},config:{alertOnWarn:false,preferTextRange:false}};
            c.fail=C;c.warn=function(o){o="Rangy warning: "+o;if(c.config.alertOnWarn)window.alert(o);else typeof window.console!="undefined"&&typeof window.console.log!="undefined"&&window.console.log(o)};if({}.hasOwnProperty)c.util.extend=function(o,u){for(var x in u)if(u.hasOwnProperty(x))o[x]=u[x]};else C("hasOwnProperty not supported");var f=[],j=[];c.init=N;c.addInitListener=function(o){c.initialized?o(c):f.push(o)};var r=[];c.addCreateMissingNativeApiListener=function(o){r.push(o)};c.createMissingNativeApi=
            function(o){o=o||window;N();for(var u=0,x=r.length;u<x;++u)r[u](o)};P.prototype.fail=function(o){this.initialized=true;this.supported=false;throw Error("Module '"+this.name+"' failed to load: "+o);};P.prototype.warn=function(o){c.warn("Module "+this.name+": "+o)};P.prototype.createError=function(o){return Error("Error in Rangy "+this.name+" module: "+o)};c.createModule=function(o,u){var x=new P(o);c.modules[o]=x;j.push(function(B){u(B,x);x.initialized=true;x.supported=true})};c.requireModules=function(o){for(var u=
            0,x=o.length,B,D;u<x;++u){D=o[u];B=c.modules[D];if(!B||!(B instanceof P))throw Error("Module '"+D+"' not found");if(!B.supported)throw Error("Module '"+D+"' not supported");}};var M=false;p=function(){if(!M){M=true;c.initialized||N()}};if(typeof window=="undefined")C("No window found");else if(typeof document=="undefined")C("No document found");else{k(document,"addEventListener")&&document.addEventListener("DOMContentLoaded",p,false);if(k(window,"addEventListener"))window.addEventListener("load",
            p,false);else k(window,"attachEvent")?window.attachEvent("onload",p):C("Window does not have required addEventListener or attachEvent method");return c}}();
            rangy.createModule("DomUtil",function(k,L){function J(c){for(var f=0;c=c.previousSibling;)f++;return f}function K(c,f){var j=[],r;for(r=c;r;r=r.parentNode)j.push(r);for(r=f;r;r=r.parentNode)if(v(j,r))return r;return null}function z(c,f,j){for(j=j?c:c.parentNode;j;){c=j.parentNode;if(c===f)return j;j=c}return null}function C(c){c=c.nodeType;return c==3||c==4||c==8}function N(c,f){var j=f.nextSibling,r=f.parentNode;j?r.insertBefore(c,j):r.appendChild(c);return c}function P(c){if(c.nodeType==9)return c;
            else if(typeof c.ownerDocument!="undefined")return c.ownerDocument;else if(typeof c.document!="undefined")return c.document;else if(c.parentNode)return P(c.parentNode);else throw Error("getDocument: no document found for node");}function h(c){if(!c)return"[No node]";return C(c)?'"'+c.data+'"':c.nodeType==1?"<"+c.nodeName+(c.id?' id="'+c.id+'"':"")+">["+c.childNodes.length+"]":c.nodeName}function n(c){this._next=this.root=c}function s(c,f){this.node=c;this.offset=f}function y(c){this.code=this[c];
            this.codeName=c;this.message="DOMException: "+this.codeName}var A=k.util;A.areHostMethods(document,["createDocumentFragment","createElement","createTextNode"])||L.fail("document missing a Node creation method");A.isHostMethod(document,"getElementsByTagName")||L.fail("document missing getElementsByTagName method");var p=document.createElement("div");A.areHostMethods(p,["insertBefore","appendChild","cloneNode"])||L.fail("Incomplete Element implementation");p=document.createTextNode("test");A.areHostMethods(p,
            ["splitText","deleteData","insertData","appendData","cloneNode"])||L.fail("Incomplete Text Node implementation");var v=function(c,f){for(var j=c.length;j--;)if(c[j]===f)return true;return false};n.prototype={_current:null,hasNext:function(){return!!this._next},next:function(){var c=this._current=this._next,f;if(this._current)if(f=c.firstChild)this._next=f;else{for(f=null;c!==this.root&&!(f=c.nextSibling);)c=c.parentNode;this._next=f}return this._current},detach:function(){this._current=this._next=
            this.root=null}};s.prototype={equals:function(c){return this.node===c.node&this.offset==c.offset},inspect:function(){return"[DomPosition("+h(this.node)+":"+this.offset+")]"}};y.prototype={INDEX_SIZE_ERR:1,HIERARCHY_REQUEST_ERR:3,WRONG_DOCUMENT_ERR:4,NO_MODIFICATION_ALLOWED_ERR:7,NOT_FOUND_ERR:8,NOT_SUPPORTED_ERR:9,INVALID_STATE_ERR:11};y.prototype.toString=function(){return this.message};k.dom={arrayContains:v,getNodeIndex:J,getNodeLength:function(c){var f;return C(c)?c.length:(f=c.childNodes)?f.length:
            0},getCommonAncestor:K,isAncestorOf:function(c,f,j){for(f=j?f:f.parentNode;f;)if(f===c)return true;else f=f.parentNode;return false},getClosestAncestorIn:z,isCharacterDataNode:C,insertAfter:N,splitDataNode:function(c,f){var j=c.cloneNode(false);j.deleteData(0,f);c.deleteData(f,c.length-f);N(j,c);return j},getDocument:P,getWindow:function(c){c=P(c);if(typeof c.defaultView!="undefined")return c.defaultView;else if(typeof c.parentWindow!="undefined")return c.parentWindow;else throw Error("Cannot get a window object for node");
            },getIframeWindow:function(c){if(typeof c.contentWindow!="undefined")return c.contentWindow;else if(typeof c.contentDocument!="undefined")return c.contentDocument.defaultView;else throw Error("getIframeWindow: No Window object found for iframe element");},getIframeDocument:function(c){if(typeof c.contentDocument!="undefined")return c.contentDocument;else if(typeof c.contentWindow!="undefined")return c.contentWindow.document;else throw Error("getIframeWindow: No Document object found for iframe element");
            },getBody:function(c){return A.isHostObject(c,"body")?c.body:c.getElementsByTagName("body")[0]},getRootContainer:function(c){for(var f;f=c.parentNode;)c=f;return c},comparePoints:function(c,f,j,r){var M;if(c==j)return f===r?0:f<r?-1:1;else if(M=z(j,c,true))return f<=J(M)?-1:1;else if(M=z(c,j,true))return J(M)<r?-1:1;else{f=K(c,j);c=c===f?f:z(c,f,true);j=j===f?f:z(j,f,true);if(c===j)throw Error("comparePoints got to case 4 and childA and childB are the same!");else{for(f=f.firstChild;f;){if(f===c)return-1;
            else if(f===j)return 1;f=f.nextSibling}throw Error("Should not be here!");}}},inspectNode:h,createIterator:function(c){return new n(c)},DomPosition:s};k.DOMException=y});
            rangy.createModule("DomRange",function(k){function L(a,e){return a.nodeType!=3&&(l.isAncestorOf(a,e.startContainer,true)||l.isAncestorOf(a,e.endContainer,true))}function J(a){return l.getDocument(a.startContainer)}function K(a,e,g){if(e=a._listeners[e])for(var q=0,G=e.length;q<G;++q)e[q].call(a,{target:a,args:g})}function z(a){return new E(a.parentNode,l.getNodeIndex(a))}function C(a){return new E(a.parentNode,l.getNodeIndex(a)+1)}function N(a,e,g){var q=a.nodeType==11?a.firstChild:a;if(l.isCharacterDataNode(e))g==
            e.length?l.insertAfter(a,e):e.parentNode.insertBefore(a,g==0?e:l.splitDataNode(e,g));else g>=e.childNodes.length?e.appendChild(a):e.insertBefore(a,e.childNodes[g]);return q}function P(a){for(var e,g,q=J(a.range).createDocumentFragment();g=a.next();){e=a.isPartiallySelectedSubtree();g=g.cloneNode(!e);if(e){e=a.getSubtreeIterator();g.appendChild(P(e));e.detach(true)}if(g.nodeType==10)throw new Q("HIERARCHY_REQUEST_ERR");q.appendChild(g)}return q}function h(a,e,g){var q,G;for(g=g||{stop:false};q=a.next();)if(a.isPartiallySelectedSubtree())if(e(q)===
            false){g.stop=true;return}else{q=a.getSubtreeIterator();h(q,e,g);q.detach(true);if(g.stop)return}else for(q=l.createIterator(q);G=q.next();)if(e(G)===false){g.stop=true;return}}function n(a){for(var e;a.next();)if(a.isPartiallySelectedSubtree()){e=a.getSubtreeIterator();n(e);e.detach(true)}else a.remove()}function s(a){for(var e,g=J(a.range).createDocumentFragment(),q;e=a.next();){if(a.isPartiallySelectedSubtree()){e=e.cloneNode(false);q=a.getSubtreeIterator();e.appendChild(s(q));q.detach(true)}else a.remove();
            if(e.nodeType==10)throw new Q("HIERARCHY_REQUEST_ERR");g.appendChild(e)}return g}function y(a,e,g){var q=!!(e&&e.length),G,U=!!g;if(q)G=RegExp("^("+e.join("|")+")$");var ba=[];h(new p(a,false),function(m){if((!q||G.test(m.nodeType))&&(!U||g(m)))ba.push(m)});return ba}function A(a){return"["+(typeof a.getName=="undefined"?"Range":a.getName())+"("+l.inspectNode(a.startContainer)+":"+a.startOffset+", "+l.inspectNode(a.endContainer)+":"+a.endOffset+")]"}function p(a,e){this.range=a;this.clonePartiallySelectedTextNodes=
            e;if(!a.collapsed){this.sc=a.startContainer;this.so=a.startOffset;this.ec=a.endContainer;this.eo=a.endOffset;var g=a.commonAncestorContainer;if(this.sc===this.ec&&l.isCharacterDataNode(this.sc)){this.isSingleCharacterDataNode=true;this._first=this._last=this._next=this.sc}else{this._first=this._next=this.sc===g&&!l.isCharacterDataNode(this.sc)?this.sc.childNodes[this.so]:l.getClosestAncestorIn(this.sc,g,true);this._last=this.ec===g&&!l.isCharacterDataNode(this.ec)?this.ec.childNodes[this.eo-1]:l.getClosestAncestorIn(this.ec,
            g,true)}}}function v(a){this.code=this[a];this.codeName=a;this.message="RangeException: "+this.codeName}function c(a,e,g){this.nodes=y(a,e,g);this._next=this.nodes[0];this._position=0}function f(a){return function(e,g){for(var q,G=g?e:e.parentNode;G;){q=G.nodeType;if(l.arrayContains(a,q))return G;G=G.parentNode}return null}}function j(a,e){if(F(a,e))throw new v("INVALID_NODE_TYPE_ERR");}function r(a){if(!a.startContainer)throw new Q("INVALID_STATE_ERR");}function M(a,e){if(!l.arrayContains(e,a.nodeType))throw new v("INVALID_NODE_TYPE_ERR");
            }function o(a,e){if(e<0||e>(l.isCharacterDataNode(a)?a.length:a.childNodes.length))throw new Q("INDEX_SIZE_ERR");}function u(a,e){if(d(a,true)!==d(e,true))throw new Q("WRONG_DOCUMENT_ERR");}function x(a){if(i(a,true))throw new Q("NO_MODIFICATION_ALLOWED_ERR");}function B(a,e){if(!a)throw new Q(e);}function D(a){r(a);if(!l.arrayContains(Y,a.startContainer.nodeType)&&!d(a.startContainer,true)||!l.arrayContains(Y,a.endContainer.nodeType)&&!d(a.endContainer,true)||!(a.startOffset<=(l.isCharacterDataNode(a.startContainer)?
            a.startContainer.length:a.startContainer.childNodes.length))||!(a.endOffset<=(l.isCharacterDataNode(a.endContainer)?a.endContainer.length:a.endContainer.childNodes.length)))throw Error("Range error: Range is no longer valid after DOM mutation ("+a.inspect()+")");}function W(){}function ea(a){a.START_TO_START=O;a.START_TO_END=Z;a.END_TO_END=ka;a.END_TO_START=la;a.NODE_BEFORE=ma;a.NODE_AFTER=na;a.NODE_BEFORE_AND_AFTER=oa;a.NODE_INSIDE=ja}function $(a){ea(a);ea(a.prototype)}function X(a,e){return function(){D(this);
            var g=this.startContainer,q=this.startOffset,G=this.commonAncestorContainer,U=new p(this,true);if(g!==G){g=l.getClosestAncestorIn(g,G,true);q=C(g);g=q.node;q=q.offset}h(U,x);U.reset();G=a(U);U.detach();e(this,g,q,g,q);return G}}function ca(a,e,g){function q(m,t){return function(w){r(this);M(w,fa);M(b(w),Y);w=(m?z:C)(w);(t?G:U)(this,w.node,w.offset)}}function G(m,t,w){var I=m.endContainer,R=m.endOffset;if(t!==m.startContainer||w!==this.startOffset){if(b(t)!=b(I)||l.comparePoints(t,w,I,R)==1){I=t;R=
            w}e(m,t,w,I,R)}}function U(m,t,w){var I=m.startContainer,R=m.startOffset;if(t!==m.endContainer||w!==this.endOffset){if(b(t)!=b(I)||l.comparePoints(t,w,I,R)==-1){I=t;R=w}e(m,I,R,t,w)}}function ba(m,t,w){if(t!==m.startContainer||w!==this.startOffset||t!==m.endContainer||w!==this.endOffset)e(m,t,w,t,w)}a.prototype=new W;k.util.extend(a.prototype,{setStart:function(m,t){r(this);j(m,true);o(m,t);G(this,m,t)},setEnd:function(m,t){r(this);j(m,true);o(m,t);U(this,m,t)},setStartBefore:q(true,true),setStartAfter:q(false,
            true),setEndBefore:q(true,false),setEndAfter:q(false,false),collapse:function(m){D(this);m?e(this,this.startContainer,this.startOffset,this.startContainer,this.startOffset):e(this,this.endContainer,this.endOffset,this.endContainer,this.endOffset)},selectNodeContents:function(m){r(this);j(m,true);e(this,m,0,m,l.getNodeLength(m))},selectNode:function(m){r(this);j(m,false);M(m,fa);var t=z(m);m=C(m);e(this,t.node,t.offset,m.node,m.offset)},extractContents:X(s,e),deleteContents:X(n,e),canSurroundContents:function(){D(this);
            x(this.startContainer);x(this.endContainer);var m=new p(this,true),t=m._first&&L(m._first,this)||m._last&&L(m._last,this);m.detach();return!t},detach:function(){g(this)},splitBoundaries:function(){D(this);var m=this.startContainer,t=this.startOffset,w=this.endContainer,I=this.endOffset,R=m===w;l.isCharacterDataNode(w)&&I>0&&I<w.length&&l.splitDataNode(w,I);if(l.isCharacterDataNode(m)&&t>0&&t<m.length){m=l.splitDataNode(m,t);if(R){I-=t;w=m}else w==m.parentNode&&I>=l.getNodeIndex(m)&&I++;t=0}e(this,
            m,t,w,I)},normalizeBoundaries:function(){D(this);var m=this.startContainer,t=this.startOffset,w=this.endContainer,I=this.endOffset,R=function(V){var S=V.nextSibling;if(S&&S.nodeType==V.nodeType){w=V;I=V.length;V.appendData(S.data);S.parentNode.removeChild(S)}},pa=function(V){var S=V.previousSibling;if(S&&S.nodeType==V.nodeType){m=V;var qa=V.length;t=S.length;V.insertData(0,S.data);S.parentNode.removeChild(S);if(m==w){I+=t;w=m}else if(w==V.parentNode){S=l.getNodeIndex(V);if(I==S){w=V;I=qa}else I>S&&
            I--}}},ga=true;if(l.isCharacterDataNode(w))w.length==I&&R(w);else{if(I>0)(ga=w.childNodes[I-1])&&l.isCharacterDataNode(ga)&&R(ga);ga=!this.collapsed}if(ga)if(l.isCharacterDataNode(m))t==0&&pa(m);else{if(t<m.childNodes.length)(R=m.childNodes[t])&&l.isCharacterDataNode(R)&&pa(R)}else{m=w;t=I}e(this,m,t,w,I)},collapseToPoint:function(m,t){D(this);j(m,true);o(m,t);ba(this,m,t)}});$(a)}function ha(a){a.collapsed=a.startContainer===a.endContainer&&a.startOffset===a.endOffset;a.commonAncestorContainer=a.collapsed?
            a.startContainer:l.getCommonAncestor(a.startContainer,a.endContainer)}function da(a,e,g,q,G){var U=a.startContainer!==e||a.startOffset!==g,ba=a.endContainer!==q||a.endOffset!==G;a.startContainer=e;a.startOffset=g;a.endContainer=q;a.endOffset=G;ha(a);K(a,"boundarychange",{startMoved:U,endMoved:ba})}function T(a){this.startContainer=a;this.startOffset=0;this.endContainer=a;this.endOffset=0;this._listeners={boundarychange:[],detach:[]};ha(this)}k.requireModules(["DomUtil"]);var l=k.dom,E=l.DomPosition,
            Q=k.DOMException;p.prototype={_current:null,_next:null,_first:null,_last:null,isSingleCharacterDataNode:false,reset:function(){this._current=null;this._next=this._first},hasNext:function(){return!!this._next},next:function(){var a=this._current=this._next;if(a){this._next=a!==this._last?a.nextSibling:null;if(l.isCharacterDataNode(a)&&this.clonePartiallySelectedTextNodes){if(a===this.ec)(a=a.cloneNode(true)).deleteData(this.eo,a.length-this.eo);if(this._current===this.sc)(a=a.cloneNode(true)).deleteData(0,
            this.so)}}return a},remove:function(){var a=this._current,e,g;if(l.isCharacterDataNode(a)&&(a===this.sc||a===this.ec)){e=a===this.sc?this.so:0;g=a===this.ec?this.eo:a.length;e!=g&&a.deleteData(e,g-e)}else a.parentNode&&a.parentNode.removeChild(a)},isPartiallySelectedSubtree:function(){return L(this._current,this.range)},getSubtreeIterator:function(){var a;if(this.isSingleCharacterDataNode){a=this.range.cloneRange();a.collapse()}else{a=new T(J(this.range));var e=this._current,g=e,q=0,G=e,U=l.getNodeLength(e);
            if(l.isAncestorOf(e,this.sc,true)){g=this.sc;q=this.so}if(l.isAncestorOf(e,this.ec,true)){G=this.ec;U=this.eo}da(a,g,q,G,U)}return new p(a,this.clonePartiallySelectedTextNodes)},detach:function(a){a&&this.range.detach();this.range=this._current=this._next=this._first=this._last=this.sc=this.so=this.ec=this.eo=null}};v.prototype={BAD_BOUNDARYPOINTS_ERR:1,INVALID_NODE_TYPE_ERR:2};v.prototype.toString=function(){return this.message};c.prototype={_current:null,hasNext:function(){return!!this._next},next:function(){this._current=
            this._next;this._next=this.nodes[++this._position];return this._current},detach:function(){this._current=this._next=this.nodes=null}};var fa=[1,3,4,5,7,8,10],Y=[2,9,11],ia=[1,3,4,5,7,8,10,11],aa=[1,3,4,5,7,8],b=l.getRootContainer,d=f([9,11]),i=f([5,6,10,12]),F=f([6,10,12]),H=["startContainer","startOffset","endContainer","endOffset","collapsed","commonAncestorContainer"],O=0,Z=1,ka=2,la=3,ma=0,na=1,oa=2,ja=3;W.prototype={attachListener:function(a,e){this._listeners[a].push(e)},compareBoundaryPoints:function(a,
            e){D(this);u(this.startContainer,e.startContainer);var g=a==la||a==O?"start":"end",q=a==Z||a==O?"start":"end";return l.comparePoints(this[g+"Container"],this[g+"Offset"],e[q+"Container"],e[q+"Offset"])},insertNode:function(a){D(this);M(a,ia);x(this.startContainer);if(l.isAncestorOf(a,this.startContainer,true))throw new Q("HIERARCHY_REQUEST_ERR");this.setStartBefore(N(a,this.startContainer,this.startOffset))},cloneContents:function(){D(this);var a,e;if(this.collapsed)return J(this).createDocumentFragment();
            else{if(this.startContainer===this.endContainer&&l.isCharacterDataNode(this.startContainer)){a=this.startContainer.cloneNode(true);a.data=a.data.slice(this.startOffset,this.endOffset);e=J(this).createDocumentFragment();e.appendChild(a);return e}else{e=new p(this,true);a=P(e);e.detach()}return a}},canSurroundContents:function(){D(this);x(this.startContainer);x(this.endContainer);var a=new p(this,true),e=a._first&&L(a._first,this)||a._last&&L(a._last,this);a.detach();return!e},surroundContents:function(a){M(a,
            aa);if(!this.canSurroundContents())throw new v("BAD_BOUNDARYPOINTS_ERR");var e=this.extractContents();if(a.hasChildNodes())for(;a.lastChild;)a.removeChild(a.lastChild);N(a,this.startContainer,this.startOffset);a.appendChild(e);this.selectNode(a)},cloneRange:function(){D(this);for(var a=new T(J(this)),e=H.length,g;e--;){g=H[e];a[g]=this[g]}return a},toString:function(){D(this);var a=this.startContainer;if(a===this.endContainer&&l.isCharacterDataNode(a))return a.nodeType==3||a.nodeType==4?a.data.slice(this.startOffset,
            this.endOffset):"";else{var e=[];a=new p(this,true);h(a,function(g){if(g.nodeType==3||g.nodeType==4)e.push(g.data)});a.detach();return e.join("")}},compareNode:function(a){D(this);var e=a.parentNode,g=l.getNodeIndex(a);if(!e)throw new Q("NOT_FOUND_ERR");a=this.comparePoint(e,g);e=this.comparePoint(e,g+1);return a<0?e>0?oa:ma:e>0?na:ja},comparePoint:function(a,e){D(this);B(a,"HIERARCHY_REQUEST_ERR");u(a,this.startContainer);if(l.comparePoints(a,e,this.startContainer,this.startOffset)<0)return-1;else if(l.comparePoints(a,
            e,this.endContainer,this.endOffset)>0)return 1;return 0},createContextualFragment:function(a){r(this);var e=J(this),g=e.createElement("div");g.innerHTML=a;for(a=e.createDocumentFragment();e=g.firstChild;)a.appendChild(e);return a},toHtml:function(){D(this);var a=J(this).createElement("div");a.appendChild(this.cloneContents());return a.innerHTML},intersectsNode:function(a,e){D(this);B(a,"NOT_FOUND_ERR");if(l.getDocument(a)!==J(this))return false;var g=a.parentNode,q=l.getNodeIndex(a);B(g,"NOT_FOUND_ERR");
            var G=l.comparePoints(g,q,this.endContainer,this.endOffset);g=l.comparePoints(g,q+1,this.startContainer,this.startOffset);return e?G<=0&&g>=0:G<0&&g>0},isPointInRange:function(a,e){D(this);B(a,"HIERARCHY_REQUEST_ERR");u(a,this.startContainer);return l.comparePoints(a,e,this.startContainer,this.startOffset)>=0&&l.comparePoints(a,e,this.endContainer,this.endOffset)<=0},intersectsRange:function(a,e){D(this);if(J(a)!=J(this))throw new Q("WRONG_DOCUMENT_ERR");var g=l.comparePoints(this.startContainer,
            this.startOffset,a.endContainer,a.endOffset),q=l.comparePoints(this.endContainer,this.endOffset,a.startContainer,a.startOffset);return e?g<=0&&q>=0:g<0&&q>0},intersection:function(a){if(this.intersectsRange(a)){var e=l.comparePoints(this.startContainer,this.startOffset,a.startContainer,a.startOffset),g=l.comparePoints(this.endContainer,this.endOffset,a.endContainer,a.endOffset),q=this.cloneRange();e==-1&&q.setStart(a.startContainer,a.startOffset);g==1&&q.setEnd(a.endContainer,a.endOffset);return q}return null},
            union:function(a){if(this.intersectsRange(a,true)){var e=this.cloneRange();l.comparePoints(a.startContainer,a.startOffset,this.startContainer,this.startOffset)==-1&&e.setStart(a.startContainer,a.startOffset);l.comparePoints(a.endContainer,a.endOffset,this.endContainer,this.endOffset)==1&&e.setEnd(a.endContainer,a.endOffset);return e}else throw new v("Ranges do not intersect");},containsNode:function(a,e){return e?this.intersectsNode(a,false):this.compareNode(a)==ja},containsNodeContents:function(a){return this.comparePoint(a,
            0)>=0&&this.comparePoint(a,l.getNodeLength(a))<=0},containsRange:function(a){return this.intersection(a).equals(a)},containsNodeText:function(a){var e=this.cloneRange();e.selectNode(a);var g=e.getNodes([3]);if(g.length>0){e.setStart(g[0],0);a=g.pop();e.setEnd(a,a.length);a=this.containsRange(e);e.detach();return a}else return this.containsNodeContents(a)},createNodeIterator:function(a,e){D(this);return new c(this,a,e)},getNodes:function(a,e){D(this);return y(this,a,e)},getDocument:function(){return J(this)},
            collapseBefore:function(a){r(this);this.setEndBefore(a);this.collapse(false)},collapseAfter:function(a){r(this);this.setStartAfter(a);this.collapse(true)},getName:function(){return"DomRange"},equals:function(a){return T.rangesEqual(this,a)},inspect:function(){return A(this)}};ca(T,da,function(a){r(a);a.startContainer=a.startOffset=a.endContainer=a.endOffset=null;a.collapsed=a.commonAncestorContainer=null;K(a,"detach",null);a._listeners=null});k.rangePrototype=W.prototype;T.rangeProperties=H;T.RangeIterator=
            p;T.copyComparisonConstants=$;T.createPrototypeRange=ca;T.inspect=A;T.getRangeDocument=J;T.rangesEqual=function(a,e){return a.startContainer===e.startContainer&&a.startOffset===e.startOffset&&a.endContainer===e.endContainer&&a.endOffset===e.endOffset};k.DomRange=T;k.RangeException=v});
            rangy.createModule("WrappedRange",function(k){function L(h,n,s,y){var A=h.duplicate();A.collapse(s);var p=A.parentElement();z.isAncestorOf(n,p,true)||(p=n);if(!p.canHaveHTML)return new C(p.parentNode,z.getNodeIndex(p));n=z.getDocument(p).createElement(rdr_node);var v,c=s?"StartToStart":"StartToEnd";do{p.insertBefore(n,n.previousSibling);A.moveToElementText(n)}while((v=A.compareEndPoints(c,h))>0&&n.previousSibling);c=n.nextSibling;if(v==-1&&c&&z.isCharacterDataNode(c)){A.setEndPoint(s?"EndToStart":"EndToEnd",
            h);if(/[\r\n]/.test(c.data)){p=A.duplicate();s=p.text.replace(/\r\n/g,"\r").length;for(s=p.moveStart("character",s);p.compareEndPoints("StartToEnd",p)==-1;){s++;p.moveStart("character",1)}}else s=A.text.length;p=new C(c,s)}else{c=(y||!s)&&n.previousSibling;p=(s=(y||s)&&n.nextSibling)&&z.isCharacterDataNode(s)?new C(s,0):c&&z.isCharacterDataNode(c)?new C(c,c.length):new C(p,z.getNodeIndex(n))}n.parentNode.removeChild(n);return p}function J(h,n){var s,y,A=h.offset,p=z.getDocument(h.node),v=p.body.createTextRange(),
            c=z.isCharacterDataNode(h.node);if(c){s=h.node;y=s.parentNode}else{s=h.node.childNodes;s=A<s.length?s[A]:null;y=h.node}p=p.createElement(rdr_node);p.innerHTML="&#feff;";s?y.insertBefore(p,s):y.appendChild(p);v.moveToElementText(p);v.collapse(!n);y.removeChild(p);if(c)v[n?"moveStart":"moveEnd"]("character",A);return v}k.requireModules(["DomUtil","DomRange"]);var K,z=k.dom,C=z.DomPosition,N=k.DomRange;if(k.features.implementsDomRange&&(!k.features.implementsTextRange||!k.config.preferTextRange)){(function(){function h(f){for(var j=
            s.length,r;j--;){r=s[j];f[r]=f.nativeRange[r]}}var n,s=N.rangeProperties,y,A;K=function(f){if(!f)throw Error("Range must be specified");this.nativeRange=f;h(this)};N.createPrototypeRange(K,function(f,j,r,M,o){var u=f.endContainer!==M||f.endOffset!=o;if(f.startContainer!==j||f.startOffset!=r||u){f.setEnd(M,o);f.setStart(j,r)}},function(f){f.nativeRange.detach();f.detached=true;for(var j=s.length,r;j--;){r=s[j];f[r]=null}});n=K.prototype;n.selectNode=function(f){this.nativeRange.selectNode(f);h(this)};
            n.deleteContents=function(){this.nativeRange.deleteContents();h(this)};n.extractContents=function(){var f=this.nativeRange.extractContents();h(this);return f};n.cloneContents=function(){return this.nativeRange.cloneContents()};n.surroundContents=function(f){this.nativeRange.surroundContents(f);h(this)};n.collapse=function(f){this.nativeRange.collapse(f);h(this)};n.cloneRange=function(){return new K(this.nativeRange.cloneRange())};n.refresh=function(){h(this)};n.toString=function(){return this.nativeRange.toString()};
            var p=document.createTextNode("test");z.getBody(document).appendChild(p);var v=document.createRange();v.setStart(p,0);v.setEnd(p,0);try{v.setStart(p,1);y=true;n.setStart=function(f,j){this.nativeRange.setStart(f,j);h(this)};n.setEnd=function(f,j){this.nativeRange.setEnd(f,j);h(this)};A=function(f){return function(j){this.nativeRange[f](j);h(this)}}}catch(c){y=false;n.setStart=function(f,j){try{this.nativeRange.setStart(f,j)}catch(r){this.nativeRange.setEnd(f,j);this.nativeRange.setStart(f,j)}h(this)};
            n.setEnd=function(f,j){try{this.nativeRange.setEnd(f,j)}catch(r){this.nativeRange.setStart(f,j);this.nativeRange.setEnd(f,j)}h(this)};A=function(f,j){return function(r){try{this.nativeRange[f](r)}catch(M){this.nativeRange[j](r);this.nativeRange[f](r)}h(this)}}}n.setStartBefore=A("setStartBefore","setEndBefore");n.setStartAfter=A("setStartAfter","setEndAfter");n.setEndBefore=A("setEndBefore","setStartBefore");n.setEndAfter=A("setEndAfter","setStartAfter");v.selectNodeContents(p);n.selectNodeContents=
            v.startContainer==p&&v.endContainer==p&&v.startOffset==0&&v.endOffset==p.length?function(f){this.nativeRange.selectNodeContents(f);h(this)}:function(f){this.setStart(f,0);this.setEnd(f,N.getEndOffset(f))};v.selectNodeContents(p);v.setEnd(p,3);y=document.createRange();y.selectNodeContents(p);y.setEnd(p,4);y.setStart(p,2);n.compareBoundaryPoints=v.compareBoundaryPoints(v.START_TO_END,y)==-1&v.compareBoundaryPoints(v.END_TO_START,y)==1?function(f,j){j=j.nativeRange||j;if(f==j.START_TO_END)f=j.END_TO_START;
            else if(f==j.END_TO_START)f=j.START_TO_END;return this.nativeRange.compareBoundaryPoints(f,j)}:function(f,j){return this.nativeRange.compareBoundaryPoints(f,j.nativeRange||j)};z.getBody(document).removeChild(p);v.detach();y.detach()})();k.createNativeRange=function(h){h=h||document;return h.createRange()}}else if(k.features.implementsTextRange){K=function(h){this.textRange=h;this.refresh()};K.prototype=new N(document);K.prototype.refresh=function(){var h,n,s=this.textRange;h=s.parentElement();var y=
            s.duplicate();y.collapse(true);n=y.parentElement();y=s.duplicate();y.collapse(false);s=y.parentElement();n=n==s?n:z.getCommonAncestor(n,s);n=n==h?n:z.getCommonAncestor(h,n);if(this.textRange.compareEndPoints("StartToEnd",this.textRange)==0)n=h=L(this.textRange,n,true,true);else{h=L(this.textRange,n,true,false);n=L(this.textRange,n,false,false)}this.setStart(h.node,h.offset);this.setEnd(n.node,n.offset)};K.rangeToTextRange=function(h){if(h.collapsed)return J(new C(h.startContainer,h.startOffset),true);
            else{var n=J(new C(h.startContainer,h.startOffset),true),s=J(new C(h.endContainer,h.endOffset),false);h=z.getDocument(h.startContainer).body.createTextRange();h.setEndPoint("StartToStart",n);h.setEndPoint("EndToEnd",s);return h}};N.copyComparisonConstants(K);var P=function(){return this}();if(typeof P.Range=="undefined")P.Range=K;k.createNativeRange=function(h){h=h||document;return h.body.createTextRange()}}K.prototype.getName=function(){return"WrappedRange"};k.WrappedRange=K;k.createRange=function(h){h=
            h||document;return new K(k.createNativeRange(h))};k.createRangyRange=function(h){h=h||document;return new N(h)};k.createIframeRange=function(h){return k.createRange(z.getIframeDocument(h))};k.createIframeRangyRange=function(h){return k.createRangyRange(z.getIframeDocument(h))};k.addCreateMissingNativeApiListener(function(h){h=h.document;if(typeof h.createRange=="undefined")h.createRange=function(){return k.createRange(this)};h=h=null})});
            rangy.createModule("WrappedSelection",function(k,L){function J(b){return(b||window).getSelection()}function K(b){return(b||window).document.selection}function z(b,d,i){var F=i?"end":"start";i=i?"start":"end";b.anchorNode=d[F+"Container"];b.anchorOffset=d[F+"Offset"];b.focusNode=d[i+"Container"];b.focusOffset=d[i+"Offset"]}function C(b){b.anchorNode=b.focusNode=null;b.anchorOffset=b.focusOffset=0;b.rangeCount=0;b.isCollapsed=true;b._ranges.length=0}function N(b){var d;if(b instanceof j){d=b._selectionNativeRange;
            if(!d){d=k.createNativeRange(c.getDocument(b.startContainer));d.setEnd(b.endContainer,b.endOffset);d.setStart(b.startContainer,b.startOffset);b._selectionNativeRange=d;b.attachListener("detach",function(){this._selectionNativeRange=null})}}else if(b instanceof r)d=b.nativeRange;else if(k.features.implementsDomRange&&b instanceof c.getWindow(b.startContainer).Range)d=b;return d}function P(b){var d=b.getNodes(),i;a:if(!d.length||d[0].nodeType!=1)i=false;else{i=1;for(var F=d.length;i<F;++i)if(!c.isAncestorOf(d[0],
            d[i])){i=false;break a}i=true}if(!i)throw Error("getSingleElementFromRange: range "+b.inspect()+" did not consist of a single element");return d[0]}function h(b,d){var i=new r(d);b._ranges=[i];z(b,i,false);b.rangeCount=1;b.isCollapsed=i.collapsed}function n(b){b._ranges.length=0;if(b.docSelection.type=="None")C(b);else{var d=b.docSelection.createRange();if(d&&typeof d.text!="undefined")h(b,d);else{b.rangeCount=d.length;for(var i,F=c.getDocument(d.item(0)),H=0;H<b.rangeCount;++H){i=k.createRange(F);
            i.selectNode(d.item(H));b._ranges.push(i)}b.isCollapsed=b.rangeCount==1&&b._ranges[0].collapsed;z(b,b._ranges[b.rangeCount-1],false)}}}function s(b,d){var i=b.docSelection.createRange(),F=P(d),H=c.getDocument(i.item(0));H=c.getBody(H).createControlRange();for(var O=0,Z=i.length;O<Z;++O)H.add(i.item(O));try{H.add(F)}catch(ka){throw Error("addRange(): Element within the specified Range could not be added to control selection (does it have layout?)");}H.select();n(b)}function y(b,d,i){this.nativeSelection=
            b;this.docSelection=d;this._ranges=[];this.win=i;this.refresh()}function A(b,d){var i=c.getDocument(d[0].startContainer);i=c.getBody(i).createControlRange();for(var F=0,H;F<rangeCount;++F){H=P(d[F]);try{i.add(H)}catch(O){throw Error("setRanges(): Element within the one of the specified Ranges could not be added to control selection (does it have layout?)");}}i.select();n(b)}function p(b,d){if(b.anchorNode&&c.getDocument(b.anchorNode)!==c.getDocument(d))throw new M("WRONG_DOCUMENT_ERR");}function v(b){var d=
            [],i=new o(b.anchorNode,b.anchorOffset),F=new o(b.focusNode,b.focusOffset),H=typeof b.getName=="function"?b.getName():"Selection";if(typeof b.rangeCount!="undefined")for(var O=0,Z=b.rangeCount;O<Z;++O)d[O]=j.inspect(b.getRangeAt(O));return"["+H+"(Ranges: "+d.join(", ")+")(anchor: "+i.inspect()+", focus: "+F.inspect()+"]"}k.requireModules(["DomUtil","DomRange","WrappedRange"]);k.config.checkSelectionRanges=true;var c=k.dom,f=k.util,j=k.DomRange,r=k.WrappedRange,M=k.DOMException,o=c.DomPosition,u,x,
            B=k.util.isHostMethod(window,"getSelection"),D=k.util.isHostObject(document,"selection"),W=D&&(!B||k.config.preferTextRange);if(W){u=K;k.isSelectionValid=function(b){b=(b||window).document;var d=b.selection;return d.type!="None"||c.getDocument(d.createRange().parentElement())==b}}else if(B){u=J;k.isSelectionValid=function(){return true}}else L.fail("Neither document.selection or window.getSelection() detected.");k.getNativeSelection=u;B=u();var ea=k.createNativeRange(document),$=c.getBody(document),
            X=f.areHostObjects(B,f.areHostProperties(B,["anchorOffset","focusOffset"]));k.features.selectionHasAnchorAndFocus=X;var ca=f.isHostMethod(B,"extend");k.features.selectionHasExtend=ca;var ha=typeof B.rangeCount=="number";k.features.selectionHasRangeCount=ha;var da=false,T=true;f.areHostMethods(B,["addRange","getRangeAt","removeAllRanges"])&&typeof B.rangeCount=="number"&&k.features.implementsDomRange&&function(){var b=document.createElement("iframe");$.appendChild(b);var d=c.getIframeDocument(b);d.open();
            d.write("<html><head></head><body>12</body></html>");d.close();var i=c.getIframeWindow(b).getSelection(),F=d.documentElement.lastChild.firstChild;d=d.createRange();d.setStart(F,1);d.collapse(true);i.addRange(d);T=i.rangeCount==1;i.removeAllRanges();var H=d.cloneRange();d.setStart(F,0);H.setEnd(F,2);i.addRange(d);i.addRange(H);da=i.rangeCount==2;d.detach();H.detach();$.removeChild(b)}();k.features.selectionSupportsMultipleRanges=da;k.features.collapsedNonEditableSelectionsSupported=T;var l=false,E;
            if($&&f.isHostMethod($,"createControlRange")){E=$.createControlRange();if(f.areHostProperties(E,["item","add"]))l=true}k.features.implementsControlRange=l;x=X?function(b){return b.anchorNode===b.focusNode&&b.anchorOffset===b.focusOffset}:function(b){return b.rangeCount?b.getRangeAt(b.rangeCount-1).collapsed:false};var Q;if(f.isHostMethod(B,"getRangeAt"))Q=function(b,d){try{return b.getRangeAt(d)}catch(i){return null}};else if(X)Q=function(b){var d=c.getDocument(b.anchorNode);d=k.createRange(d);d.setStart(b.anchorNode,
            b.anchorOffset);d.setEnd(b.focusNode,b.focusOffset);if(d.collapsed!==this.isCollapsed){d.setStart(b.focusNode,b.focusOffset);d.setEnd(b.anchorNode,b.anchorOffset)}return d};k.getSelection=function(b){b=b||window;var d=b._rangySelection,i=u(b),F=D?K(b):null;if(d){d.nativeSelection=i;d.docSelection=F;d.refresh(b)}else{d=new y(i,F,b);b._rangySelection=d}return d};k.getIframeSelection=function(b){return k.getSelection(c.getIframeWindow(b))};E=y.prototype;if(!W&&X&&f.areHostMethods(B,["removeAllRanges",
            "addRange"])){E.removeAllRanges=function(){this.nativeSelection.removeAllRanges();C(this)};var fa=function(b,d){var i=j.getRangeDocument(d);i=k.createRange(i);i.collapseToPoint(d.endContainer,d.endOffset);b.nativeSelection.addRange(N(i));b.nativeSelection.extend(d.startContainer,d.startOffset);b.refresh()};E.addRange=ha?function(b,d){if(l&&D&&this.docSelection.type=="Control")s(this,b);else if(d&&ca)fa(this,b);else{var i;if(da)i=this.rangeCount;else{this.removeAllRanges();i=0}this.nativeSelection.addRange(N(b));
            this.rangeCount=this.nativeSelection.rangeCount;if(this.rangeCount==i+1){if(k.config.checkSelectionRanges)if((i=Q(this.nativeSelection,this.rangeCount-1))&&!j.rangesEqual(i,b))b=new r(i);this._ranges[this.rangeCount-1]=b;z(this,b,aa(this.nativeSelection));this.isCollapsed=x(this)}else this.refresh()}}:function(b,d){if(d&&ca)fa(this,b);else{this.nativeSelection.addRange(N(b));this.refresh()}};E.setRanges=function(b){if(l&&b.length>1)A(this,b);else{this.removeAllRanges();for(var d=0,i=b.length;d<i;++d)this.addRange(b[d])}}}else if(f.isHostMethod(B,
            "empty")&&f.isHostMethod(ea,"select")&&l&&W){E.removeAllRanges=function(){try{this.docSelection.empty();if(this.docSelection.type!="None"){var b;if(this.anchorNode)b=c.getDocument(this.anchorNode);else if(this.docSelection.type=="Control"){var d=this.docSelection.createRange();if(d.length)b=c.getDocument(d.item(0)).body.createTextRange()}if(b){b.body.createTextRange().select();this.docSelection.empty()}}}catch(i){}C(this)};E.addRange=function(b){if(this.docSelection.type=="Control")s(this,b);else{r.rangeToTextRange(b).select();
            this._ranges[0]=b;this.rangeCount=1;this.isCollapsed=this._ranges[0].collapsed;z(this,b,false)}};E.setRanges=function(b){this.removeAllRanges();var d=b.length;if(d>1)A(this,b);else d&&this.addRange(b[0])}}else{L.fail("No means of selecting a Range or TextRange was found");return false}E.getRangeAt=function(b){if(b<0||b>=this.rangeCount)throw new M("INDEX_SIZE_ERR");else return this._ranges[b]};var Y;if(W)Y=function(b){var d;if(k.isSelectionValid(b.win))d=b.docSelection.createRange();else{d=c.getBody(b.win.document).createTextRange();
            d.collapse(true)}if(b.docSelection.type=="Control")n(b);else d&&typeof d.text!="undefined"?h(b,d):C(b)};else if(f.isHostMethod(B,"getRangeAt")&&typeof B.rangeCount=="number")Y=function(b){if(l&&D&&b.docSelection.type=="Control")n(b);else{b._ranges.length=b.rangeCount=b.nativeSelection.rangeCount;if(b.rangeCount){for(var d=0,i=b.rangeCount;d<i;++d)b._ranges[d]=new k.WrappedRange(b.nativeSelection.getRangeAt(d));z(b,b._ranges[b.rangeCount-1],aa(b.nativeSelection));b.isCollapsed=x(b)}else C(b)}};else if(X&&
            typeof B.isCollapsed=="boolean"&&typeof ea.collapsed=="boolean"&&k.features.implementsDomRange)Y=function(b){var d;d=b.nativeSelection;if(d.anchorNode){d=Q(d,0);b._ranges=[d];b.rangeCount=1;d=b.nativeSelection;b.anchorNode=d.anchorNode;b.anchorOffset=d.anchorOffset;b.focusNode=d.focusNode;b.focusOffset=d.focusOffset;b.isCollapsed=x(b)}else C(b)};else{L.fail("No means of obtaining a Range or TextRange from the user's selection was found");return false}E.refresh=function(b){var d=b?this._ranges.slice(0):
            null;Y(this);if(b){b=d.length;if(b!=this._ranges.length)return false;for(;b--;)if(!j.rangesEqual(d[b],this._ranges[b]))return false;return true}};var ia=function(b,d){var i=b.getAllRanges(),F=false;b.removeAllRanges();for(var H=0,O=i.length;H<O;++H)if(F||d!==i[H])b.addRange(i[H]);else F=true;b.rangeCount||C(b)};E.removeRange=l?function(b){if(this.docSelection.type=="Control"){var d=this.docSelection.createRange();b=P(b);var i=c.getDocument(d.item(0));i=c.getBody(i).createControlRange();for(var F,
            H=false,O=0,Z=d.length;O<Z;++O){F=d.item(O);if(F!==b||H)i.add(d.item(O));else H=true}i.select();n(this)}else ia(this,b)}:function(b){ia(this,b)};var aa;if(!W&&X&&k.features.implementsDomRange){aa=function(b){var d=false;if(b.anchorNode)d=c.comparePoints(b.anchorNode,b.anchorOffset,b.focusNode,b.focusOffset)==1;return d};E.isBackwards=function(){return aa(this)}}else aa=E.isBackwards=function(){return false};E.toString=function(){for(var b=[],d=0,i=this.rangeCount;d<i;++d)b[d]=""+this._ranges[d];return b.join("")};
            E.collapse=function(b,d){p(this,b);var i=k.createRange(c.getDocument(b));i.collapseToPoint(b,d);this.removeAllRanges();this.addRange(i);this.isCollapsed=true};E.collapseToStart=function(){if(this.rangeCount){var b=this._ranges[0];this.collapse(b.startContainer,b.startOffset)}else throw new M("INVALID_STATE_ERR");};E.collapseToEnd=function(){if(this.rangeCount){var b=this._ranges[this.rangeCount-1];this.collapse(b.endContainer,b.endOffset)}else throw new M("INVALID_STATE_ERR");};E.selectAllChildren=
            function(b){p(this,b);var d=k.createRange(c.getDocument(b));d.selectNodeContents(b);this.removeAllRanges();this.addRange(d)};E.deleteFromDocument=function(){if(l&&D&&this.docSelection.type=="Control"){for(var b=this.docSelection.createRange(),d;b.length;){d=b.item(0);b.remove(d);d.parentNode.removeChild(d)}this.refresh()}else if(this.rangeCount){b=this.getAllRanges();this.removeAllRanges();d=0;for(var i=b.length;d<i;++d)b[d].deleteContents();this.addRange(b[i-1])}};E.getAllRanges=function(){return this._ranges.slice(0)};
            E.setSingleRange=function(b){this.setRanges([b])};E.containsNode=function(b,d){for(var i=0,F=this._ranges.length;i<F;++i)if(this._ranges[i].containsNode(b,d))return true;return false};E.toHtml=function(){var b="";if(this.rangeCount){b=j.getRangeDocument(this._ranges[0]).createElement("div");for(var d=0,i=this._ranges.length;d<i;++d)b.appendChild(this._ranges[d].cloneContents());b=b.innerHTML}return b};E.getName=function(){return"WrappedSelection"};E.inspect=function(){return v(this)};E.detach=function(){this.win=
            this.anchorNode=this.focusNode=this.win._rangySelection=null};y.inspect=v;k.Selection=y;k.selectionPrototype=E;k.addCreateMissingNativeApiListener(function(b){if(typeof b.getSelection=="undefined")b.getSelection=function(){return k.getSelection(this)};b=null})});


            //rangy-cssclassapplier.js
            /*
             CSS Class Applier module for Rangy.
             Adds, removes and toggles CSS classes on Ranges and Selections

             Part of Rangy, a cross-browser JavaScript range and selection library
             http://code.google.com/p/rangy/

             Depends on Rangy core.

             Copyright 2011, Tim Down
             Licensed under the MIT license.
             Version: 1.1.2
             Build date: 30 May 2011
            */
            rangy.createModule("CssClassApplier",function(h){function s(a){return a.replace(/^\s\s*/,"").replace(/\s\s*$/,"")}function n(a,b){return a.className&&RegExp("(?:^|\\s)"+b+"(?:\\s|$)").test(a.className)}function t(a,b){if(a.className)n(a,b)||(a.className+=" "+b);else a.className=b}function o(a){return a.className.split(/\s+/).sort().join(" ")}function u(a,b){return o(a)==o(b)}function v(a){for(var b=a.parentNode;a.hasChildNodes();)b.insertBefore(a.firstChild,a);b.removeChild(a)}function w(a,b){var c=
            a.cloneRange();c.selectNodeContents(b);var d=c.intersection(a);d=d?d.toString():"";c.detach();return d!=""}function x(a,b){if(a.attributes.length!=b.attributes.length)return false;for(var c=0,d=a.attributes.length,e,f;c<d;++c){e=a.attributes[c];f=e.name;if(f!="class"){f=b.attributes.getNamedItem(f);if(e.specified!=f.specified)return false;if(e.specified&&e.nodeValue!==f.nodeValue)return false}}return true}function y(a){for(var b=0,c=a.attributes.length;b<c;++b)if(a.attributes[b].specified&&a.attributes[b].name!=
            "class")return true;return false}function z(a,b){if(g.isCharacterDataNode(a))return b==0?!!a.previousSibling:b==a.length?!!a.nextSibling:true;return b>0&&b<a.childNodes.length}function l(a,b,c){var d;if(g.isCharacterDataNode(b))if(c==0){c=g.getNodeIndex(b);b=b.parentNode}else if(c==b.length){c=g.getNodeIndex(b)+1;b=b.parentNode}else d=g.splitDataNode(b,c);if(!d){d=b.cloneNode(false);d.id&&d.removeAttribute("id");for(var e;e=b.childNodes[c];)d.appendChild(e);g.insertAfter(d,b)}return b==a?d:l(a,d.parentNode,
            g.getNodeIndex(d))}function A(a,b){var c=a.nodeType==3,d=c?a.parentNode:a,e=b?"nextSibling":"previousSibling";if(c){if((c=a[e])&&c.nodeType==3)return c}else if((c=d[e])&&a.tagName==c.tagName&&u(a,c)&&x(a,c))return c[b?"firstChild":"lastChild"];return null}function p(a){this.firstTextNode=(this.isElementMerge=a.nodeType==1)?a.lastChild:a;if(this.isElementMerge)this.sortedCssClasses=o(a);this.textNodes=[this.firstTextNode]}function m(a,b,c){this.cssClass=a;this.normalize=b;this.applyToAnytagBody=false;
            a=typeof c;if(a=="string")if(c=="*")this.applyToAnytagBody=true;else this.tagNames=s(c.toLowerCase()).split(/\s*,\s*/);else if(a=="object"&&typeof c.length=="number"){this.tagNames=[];a=0;for(b=c.length;a<b;++a)if(c[a]=="*")this.applyToAnytagBody=true;else this.tagNames.push(c[a].toLowerCase())}else this.tagNames=[q]}h.requireModules(["WrappedSelection","WrappedRange"]);var g=h.dom,q=rdr_node,B=function(){function a(b,c,d){return c&&d?" ":""}return function(b,c){if(b.className)b.className=b.className.replace(RegExp("(?:^|\\s)"+
            c+"(?:\\s|$)"),a)}}();p.prototype={doMerge:function(){for(var a=[],b,c,d=0,e=this.textNodes.length;d<e;++d){b=this.textNodes[d];c=b.parentNode;a[d]=b.data;if(d){c.removeChild(b);c.hasChildNodes()||c.parentNode.removeChild(c)}}return this.firstTextNode.data=a=a.join("")},getLength:function(){for(var a=this.textNodes.length,b=0;a--;)b+=this.textNodes[a].length;return b},toString:function(){for(var a=[],b=0,c=this.textNodes.length;b<c;++b)a[b]="'"+this.textNodes[b].data+"'";return"[Merge("+a.join(",")+
            ")]"}};m.prototype={appliesToElement:function(a){return this.applyToAnytagBody||g.arrayContains(this.tagNames,a.tagName.toLowerCase())},getAncestorWithClass:function(a){for(a=a.parentNode;a;){if(a.nodeType==1&&this.appliesToElement(a)&&n(a,this.cssClass))return a;a=a.parentNode}return false},postApply:function(a,b){for(var c=a[0],d=a[a.length-1],e=[],f,j=c,C=d,D=0,E=d.length,k,F,i=0,r=a.length;i<r;++i){k=a[i];if(F=A(k,false)){if(!f){f=new p(F);e.push(f)}f.textNodes.push(k);if(k===c){j=f.firstTextNode;
            D=j.length}if(k===d){C=f.firstTextNode;E=f.getLength()}}else f=null}if(c=A(d,true)){if(!f){f=new p(d);e.push(f)}f.textNodes.push(c)}if(e.length){i=0;for(r=e.length;i<r;++i)e[i].doMerge();b.setStart(j,D);b.setEnd(C,E)}},createContainer:function(a){a=a.createElement(q);a.className=this.cssClass;return a},applyToTextNode:function(a){var b=a.parentNode;if(b.childNodes.length==1&&this.appliesToElement(b))t(b,this.cssClass);else{b=this.createContainer(g.getDocument(a));a.parentNode.insertBefore(b,a);b.appendChild(a)}},
            isRemovable:function(a){return a.tagName.toLowerCase()==q&&s(a.className)==this.cssClass&&!y(a)},undoToTextNode:function(a,b,c){if(!b.containsNode(c)){a=b.cloneRange();a.selectNode(c);if(a.isPointInRange(b.endContainer,b.endOffset)&&z(b.endContainer,b.endOffset)){l(c,b.endContainer,b.endOffset);b.setEndAfter(c)}if(a.isPointInRange(b.startContainer,b.startOffset)&&z(b.startContainer,b.startOffset))c=l(c,b.startContainer,b.startOffset)}this.isRemovable(c)?v(c):B(c,this.cssClass)},applyToRange:function(a){a.splitBoundaries();
            var b=a.getNodes([3],function(f){return w(a,f)});if(b.length){for(var c,d=0,e=b.length;d<e;++d){c=b[d];this.getAncestorWithClass(c)||this.applyToTextNode(c)}a.setStart(b[0],0);c=b[b.length-1];a.setEnd(c,c.length);this.normalize&&this.postApply(b,a)}},applyToSelection:function(a){a=a||window;a=h.getSelection(a);var b,c=a.getAllRanges();a.removeAllRanges();for(var d=c.length;d--;){b=c[d];this.applyToRange(b);a.addRange(b)}},undoToRange:function(a){a.splitBoundaries();var b=a.getNodes([3]),c,d,e=b[b.length-
            1];if(b.length){for(var f=0,j=b.length;f<j;++f){c=b[f];(d=this.getAncestorWithClass(c))&&this.undoToTextNode(c,a,d);a.setStart(b[0],0);a.setEnd(e,e.length)}this.normalize&&this.postApply(b,a)}},undoToSelection:function(a){a=a||window;a=h.getSelection(a);var b=a.getAllRanges(),c;a.removeAllRanges();for(var d=0,e=b.length;d<e;++d){c=b[d];this.undoToRange(c);a.addRange(c)}},isAppliedToRange:function(a){for(var b=a.getNodes([3]),c=0,d=b.length;c<d;++c)if(w(a,b[c])&&!this.getAncestorWithClass(b[c]))return false;
            return true},isAppliedToSelection:function(a){a=a||window;a=h.getSelection(a).getAllRanges();for(var b=a.length;b--;)if(!this.isAppliedToRange(a[b]))return false;return true},toggleRange:function(a){this.isAppliedToRange(a)?this.undoToRange(a):this.applyToRange(a)},toggleSelection:function(a){this.isAppliedToSelection(a)?this.undoToSelection(a):this.applyToSelection(a)},detach:function(){}};m.util={hasClass:n,addClass:t,removeClass:B,hasSameClasses:u,replaceWithOwnChildren:v,elementsHaveSameNonClassAttributes:x,
            elementHasNonClassAttributes:y,splitNodeAt:l};h.CssClassApplier=m;h.createCssClassApplier=function(a,b,c){return new m(a,b,c)}});
            

            //rangy-selectionsaverestore.js
            /*
             Selection save and restore module for Rangy.
             Saves and restores user selections using marker invisible elements in the DOM.

             Part of Rangy, a cross-browser JavaScript range and selection library
             http://code.google.com/p/rangy/

             Depends on Rangy core.

             Copyright 2011, Tim Down
             Licensed under the MIT license.
             Version: 1.1.2
             Build date: 30 May 2011
            */
            rangy.createModule("SaveRestore",function(h,m){function n(a,g){var e="selectionBoundary_"+ +new Date+"_"+(""+Math.random()).slice(2),c,f=p.getDocument(a.startContainer),d=a.cloneRange();d.collapse(g);c=f.createElement(rdr_node);c.id=e;c.style.lineHeight="0";c.style.display="none";c.appendChild(f.createTextNode(q));d.insertNode(c);d.detach();return c}function o(a,g,e,c){if(a=(a||document).getElementById(e)){g[c?"setStartBefore":"setEndBefore"](a);a.parentNode.removeChild(a)}else m.warn("Marker element has been removed. Cannot restore selection.")}
            function r(a,g){return g.compareBoundaryPoints(a.START_TO_START,a)}function k(a,g){var e=(a||document).getElementById(g);e&&e.parentNode.removeChild(e)}h.requireModules(["DomUtil","DomRange","WrappedRange"]);var p=h.dom,q="\ufeff";h.saveSelection=function(a){a=a||window;var g=a.document;if(h.isSelectionValid(a)){var e=h.getSelection(a),c=e.getAllRanges(),f=[],d,j;c.sort(r);for(var b=0,i=c.length;b<i;++b){d=c[b];if(d.collapsed){j=n(d,false);f.push({markerId:j.id,collapsed:true})}else{j=n(d,false);
            d=n(d,true);f[b]={startMarkerId:d.id,endMarkerId:j.id,collapsed:false,backwards:c.length==1&&e.isBackwards()}}}for(b=i-1;b>=0;--b){d=c[b];if(d.collapsed)d.collapseBefore((g||document).getElementById(f[b].markerId));else{d.setEndBefore((g||document).getElementById(f[b].endMarkerId));d.setStartAfter((g||document).getElementById(f[b].startMarkerId))}}e.setRanges(c);return{win:a,doc:g,rangeInfos:f,restored:false}}else m.warn("Cannot save selection. This usually happens when the selection is collapsed and the selection document has lost focus.")};
            h.restoreSelection=function(a,g){if(!a.restored){for(var e=a.rangeInfos,c=h.getSelection(a.win),f=[],d=e.length,j=d-1,b,i;j>=0;--j){b=e[j];i=h.createRange(a.doc);if(b.collapsed)if(b=(a.doc||document).getElementById(b.markerId)){b.style.display="inline";var l=b.previousSibling;if(l&&l.nodeType==3){b.parentNode.removeChild(b);i.collapseToPoint(l,l.length)}else{i.collapseBefore(b);b.parentNode.removeChild(b)}}else m.warn("Marker element has been removed. Cannot restore selection.");else{o(a.doc,i,b.startMarkerId,
            true);o(a.doc,i,b.endMarkerId,false)}d==1&&i.normalizeBoundaries();f[j]=i}if(d==1&&g&&h.features.selectionHasExtend&&e[0].backwards){c.removeAllRanges();c.addRange(f[0],true)}else c.setRanges(f);a.restored=true}};h.removeMarkerElement=k;h.removeMarkers=function(a){for(var g=a.rangeInfos,e=0,c=g.length,f;e<c;++e){f=g[e];if(f.collapsed)k(a.doc,f.markerId);else{k(a.doc,f.startMarkerId);k(a.doc,f.endMarkerId)}}}});


            //rangy-serializer.js
            /*
             Serializer module for Rangy.
             Serializes Ranges and Selections. An example use would be to store a user's selection on a particular page in a
             cookie or local storage and restore it on the user's next visit to the same page.

             Part of Rangy, a cross-browser JavaScript range and selection library
             http://code.google.com/p/rangy/

             Depends on Rangy core.

             Copyright 2011, Tim Down
             Licensed under the MIT license.
             Version: 1.1.2
             Build date: 30 May 2011
            */
            rangy.createModule("Serializer",function(h,n){function o(c,a){a=a||[];var b=c.nodeType,e=c.childNodes,d=e.length,f=[b,c.nodeName,d].join(":"),g="",k="";switch(b){case 3:g=c.nodeValue.replace(/</g,"&lt;").replace(/>/g,"&gt;");break;case 8:g="<!--"+c.nodeValue.replace(/</g,"&lt;").replace(/>/g,"&gt;")+"--\>";break;default:g="<"+f+">";k="</>";break}g&&a.push(g);for(b=0;b<d;++b)o(e[b],a);k&&a.push(k);return a}function j(c){c=o(c).join("");return u(c).toString(16)}function l(c,a,b){var e=[],d=c;for(b=
            b||i.getDocument(c).documentElement;d&&d!=b;){e.push(i.getNodeIndex(d,true));d=d.parentNode}return e.join("/")+":"+a}function m(c,a,b){if(a)b||i.getDocument(a);else{b=b||document;a=b.documentElement}c=c.split(":");a=a;b=c[0]?c[0].split("/"):[];for(var e=b.length,d;e--;){d=parseInt(b[e],10);if(d<a.childNodes.length)a=a.childNodes[parseInt(b[e],10)];else throw n.createError("deserializePosition failed: node "+i.inspectNode(a)+" has no child with index "+d+", "+e);}return new i.DomPosition(a,parseInt(c[1],
            10))}function p(c,a,b){b=b||h.DomRange.getRangeDocument(c).documentElement;if(!i.isAncestorOf(b,c.commonAncestorContainer,true))throw Error("serializeRange: range is not wholly contained within specified root node");c=l(c.startContainer,c.startOffset,b)+","+l(c.endContainer,c.endOffset,b);a||(c+="{"+j(b)+"}");return c}function q(c,a,b){if(a)b=b||i.getDocument(a);else{b=b||document;a=b.documentElement}c=/^([^,]+),([^,\{]+)({([^}]+)})?$/.exec(c);var e=c[4],d=j(a);if(e&&e!==j(a))throw Error("deserializeRange: checksums of serialized range root node ("+
            e+") and target root node ("+d+") do not match");e=m(c[1],a,b);a=m(c[2],a,b);b=h.createRange(b);b.setStart(e.node,e.offset);b.setEnd(a.node,a.offset);return b}function r(c,a,b){if(a)b||i.getDocument(a);else{b=b||document;a=b.documentElement}c=/^([^,]+),([^,]+)({([^}]+)})?$/.exec(c)[3];return!c||c===j(a)}function s(c,a,b){c=c||rangy.getSelection();c=c.getAllRanges();for(var e=[],d=0,f=c.length;d<f;++d)e[d]=p(c[d],a,b);return e.join("|")}function t(c,a,b){if(a)b=b||i.getWindow(a);else{b=b||window;a=
            b.document.documentElement}c=c.split("|");for(var e=h.getSelection(b),d=[],f=0,g=c.length;f<g;++f)d[f]=q(c[f],a,b.document);e.setRanges(d);return e}h.requireModules(["WrappedSelection","WrappedRange"]);if(typeof encodeURIComponent=="undefined"||typeof decodeURIComponent=="undefined")n.fail("Global object is missing encodeURIComponent and/or decodeURIComponent method");var u=function(){var c=null;return function(a){for(var b=[],e=0,d=a.length,f;e<d;++e){f=a.charCodeAt(e);if(f<128)b.push(f);else f<
            2048?b.push(f>>6|192,f&63|128):b.push(f>>12|224,f>>6&63|128,f&63|128)}a=-1;if(!c){e=[];d=0;for(var g;d<256;++d){g=d;for(f=8;f--;)if((g&1)==1)g=g>>>1^3988292384;else g>>>=1;e[d]=g>>>0}c=e}e=c;d=0;for(f=b.length;d<f;++d){g=(a^b[d])&255;a=a>>>8^e[g]}return(a^-1)>>>0}}(),i=h.dom;h.serializePosition=l;h.deserializePosition=m;h.serializeRange=p;h.deserializeRange=q;h.canDeserializeRange=r;h.serializeSelection=s;h.deserializeSelection=t;h.canDeserializeSelection=function(c,a,b){var e;if(a)e=b?b.document:
            i.getDocument(a);else{b=b||window;a=b.document.documentElement}c=c.split("|");b=0;for(var d=c.length;b<d;++b)if(!r(c[b],a,e))return false;return true};h.restoreSelectionFromCookie=function(c){c=c||window;var a;a:{a=c.document.cookie.split(/[;,]/);for(var b=0,e=a.length,d;b<e;++b){d=a[b].split("=");if(d[0].replace(/^\s+/,"")=="rangySerializedSelection")if(d=d[1]){a=decodeURIComponent(d.replace(/\s+$/,""));break a}}a=null}a&&t(a,c.doc)};h.saveSelectionCookie=function(c,a){c=c||window;a=typeof a=="object"?
            a:{};var b=a.expires?";expires="+a.expires.toUTCString():"",e=a.path?";path="+a.path:"",d=a.domain?";domain="+a.domain:"",f=a.secure?";secure":"",g=s(rangy.getSelection(c));c.document.cookie=encodeURIComponent("rangySerializedSelection")+"="+encodeURIComponent(g)+b+e+d+f};h.getElementChecksum=j});


            //keep this return here - this is how we pass the rangy object to the rest of the code.
            //Rangy assumes it to be global, but it's better to keep the pub's namespace clean.   
            return rangy;
        }
        //end function plugin_rangy()

        /** end plugin functions **/        
    }
    //end initPlugins()

}
//end $RFunctions()