// //console.log($)
var jQueryVersion = "1.4.4",
RDRtimer,
RDR, //our global RDR object
$RDR, //our global $RDR object (jquerified RDR object for attaching data and queues and such)
$R = {}, //init var: our clone of jQuery
client$ = {}; //init var: clients copy of jQuery

//init rangy if it hasn't been already, we probably dont need this...
rangy.init();
var demoRindow;

//Our Readrboard function that builds the RDR object which gets returned into the global scope.
//This function gets called above in
function readrBoard($R){

    var $ = $R;

    //todo: [eric] this doesn't really do anything, cause even if we pick up the global RDR into the local version,
        // we're just overwriting it in the next line anyway. 
        //consider using <if (RDR.length) return;> or just omit it.
    var RDR = RDR ? RDR: {};

    // none of this obj's properties are definite.  just jotting down a few ideas.
    RDR = {
        summaries:{},
        current: {},
        content_nodes: {},
        containers:{},
        groupPermData: {
            group_id : "{{ group_id }}",  //make group_id a string partly to make my IDE happy - getting sent as ajax anyway
            short_name : "{{ short_name }}"
        },
        group: {}, //to be set by RDR.actions.initGroupData
        user: {
            first_name:		"",
            full_name:		"",
            img_url:        "", 
            readr_token: 	"",
            user_id:        ""
        },
        errors: {
            actionbar: {
                rating:"",
                commenting:""
            }
        },
        styles: {
        /*
		page: 	"<style type='text/css'>"+
				"body 		{background:#fff;}" +
				"body p		{}" +
				"</style>"
		*/
		},
        // TODO kill this.
		demo: {
		    inPage_one: function(img) {
                var offsets = img.offset();
                
		        var rindow = RDR.rindow.draw({
                    left:offsets.left,
                    top:offsets.top,
					pnlWidth:200,
					panels:2,
					noHeader:true
                });
                demoRindow = rindow;
                
                var $demo = $('<div class="rdr_sentimentBox rdr_new" style="height:310px;width:358px;overflow:hidden;position:relative;" />'),
                $img = $('<img src="/static/images/demo/two_columns.png" style="display:block;position:relative;z-index:2;float:left;cursor:pointer;" />');
                $img.click( function() {
                    $(this).attr('src', '/static/images/demo/two_columns_clicked.png');
                    $(this).unbind('click');
                    $(this).click( function() {
                        var $img_three = $('<img src="/static/images/demo/three_columns.png" style="display:block;position:relative;z-index:1;float:right;margin-top:-310px;cursor:text;" />');
                        $(this).attr('src', '/static/images/demo/two_columns_clicked_twice.png');
                        $(this).after( $img_three );
                        //$(this).attr('src', '/static/images/demo/two_columns_clicked_twice.png');
                        demoRindow.find('div.rdr_sentimentBox').animate({width:538},300);
                    });
                });
                $demo.append( $img );

                rindow.animate({
                    width: rindow.settings.pnlWidth +'px',
                    minHeight: rindow.settings.height +'px'
                }, rindow.settings.animTime, function() {
					$(this).css('width','auto');
					rindow.find('.rdr_contentSpace').append( $demo );
				});
		    }
		},
		rindow: {
            stack:{
              
            },
            defaults:{
                x:100,
                y:100,
                pnlWidth:200,
                animTime:225,
                height:150,
                columns: false
            },
			// content comes later.  this is just to identify or draw the container.
            checkHeight: function( rindow, percentScroll, which ) {

                rindow.find('div.rdr_body').each( function() {
                    var $column = $(this);
                        
                    if ( $column.parents().hasClass('rdr_whyPanel') ) { var this_column_name="whyPanel"; }
                    if ( $column.parents().hasClass('rdr_contentPanel') ) { var this_column_name="contentPanel"; }
                    if ( $column.parents().hasClass('rdr_reactionPanel') ) { var this_column_name="reactionPanel"; }

                    var paneHeight = (rindow.height()-35);
                    var contentHeight = $column.height();

                    if ( contentHeight >= 300 ) {
                        rindow.find('div.rdr_reactionPanel div.rdr_body').animate({
                            minHeight:"300px"
                        }, rindow.settings.animTime );
                        if ( $column.find('.jspVerticalBar').length > 0 ) {
                            $column.data('jsp').reinitialise({ contentWidth:200, showArrows:true });
                        } else {
                            $column.jScrollPane({ contentWidth:200, showArrows:true });
                        }
                    } else if (which && which == this_column_name) {
                        rindow.find('div.rdr_reactionPanel div.rdr_body').animate({
                            minHeight:contentHeight+"px"
                        }, rindow.settings.animTime );
                    }
                });
            },
			draw: function(options) {
				// for now, any window closes all tooltips
                //merge options and defaults
                var settings = $.extend({}, this.defaults, options);
				var $new_rindow = $('div.rdr.rdr_window.rdr_rewritable'); // jquery obj of the rewritable window
				if ( $new_rindow.length == 0 ) { // there's no rewritable window available, so make one
					$new_rindow = $('<div class="rdr rdr_window rdr_rewritable" ></div>');
                    if ( settings.id ) {
                        $('#'+settings.id).remove(); // todo not sure we should always just REMOVE a pre-existing rindow with a particular ID...
                                                     // reason I'm adding this: want a login panel with an ID and data attached to it, so after a user
                                                     // logs in, the login rindow knows what function to then call
                        $new_rindow.attr('id',settings.id);
                    }

                    // may not need selector.  was a test to see if we can embed the rindow within a document, optionally.
					if (options.selector) {
                        $(options.selector).after( $new_rindow );
                    } else {
                        $('body').append( $new_rindow );
                    }
				}

                if ( options.columns == true ) $new_rindow.addClass('rdr_columns');

				if ( $new_rindow.find('h1').length == 0 ) {
                    $new_rindow.html('');
                    $new_rindow.append( '<div class="rdr_close">x</div><h1></h1><div class="rdr rdr_contentSpace"></div>' );
                    $new_rindow.find('div.rdr_close').click( function() {
                        $(this).parents('div.rdr.rdr_window').remove();
                        return false; //make sure rindow for <a><img /></a> doesn't activate link
                    });
					
					if ( settings.noHeader ) $new_rindow.find('h1').remove();
					
                    $new_rindow.draggable({
                        handle:'h1',
                        containment:'document',
                        stack:'.RDR.window',
                        start:function() {
                            $(this).removeClass('rdr_rewritable');
                        }
                    });

                }


				// TODO: this probably should pass in the rindow and calculate, so that it can be done on the fly
				var coords = RDR.util.stayInWindow({left:settings.left, top:settings.top,height:300, ignoreWindowEdges:settings.ignoreWindowEdges});

                $new_rindow.css('left', coords.left + 'px');
                $new_rindow.css('top', coords.top + 'px');    
                RDR.actionbar.closeAll();  

                $new_rindow.settings = settings;

                $dragHandle = $('<div style="width:100%;height:8px;position:absolute;bottom:0;right:0;z-index:1000;cursor:s-resize;"/>');

                $dragHandle.bind('mousedown.rdr', function() {

                    var $this = $(this);
                    var rindow = $this.parents('div.rdr.rdr_window');

                    $(document).bind('mousemove.rdr', function(e) {
                        var height = rindow.find('div.rdr_sntPnl div.rdr_body').first().height();
                        if ( RDR.lastHeight != 0 ) {
                            var diff = e.pageY - RDR.lastHeight;
                            rindow.find('div.rdr_sntPnl div.rdr_body').each( function() {
                                // $(this).css('min-height','none');
                                $(this).height( height + diff );
                            } );
                        }
                        RDR.lastHeight = e.pageY
                    });

                    $('body').bind('mouseup.rdr', function() {
                        $('body').unbind('mouseup.rdr');
                        $(document).unbind('mousemove.rdr');
                        RDR.lastHeight = 0;
                    });
                    RDR.rindow.checkHeight( rindow, 100 );
                    return false;

                });

                $new_rindow.append( $dragHandle );

                return $new_rindow;
			},
			closeAll: function() {
				$('div.rdr.rdr_window').remove();
			}
		},
		actionbar: {
			draw: function(settings) {

				var actionbar_id = "rdr_actionbar_"+RDR.util.md5.hex_md5( settings.content );

				var $actionbars = $('div.rdr.rdr_actionbar');
                
				if ( $('#'+actionbar_id).length > 0 ) return $('#'+actionbar_id);
				// else 

                var left = (settings.left) ? (settings.content_type == "image") ? settings.left-34 : settings.left+2 : 100;
                var top_modifier = (settings.content_type == "image") ? -43:-35;  // if IE, position higher so we're not behind IE's "Accelerator" arrow
                var top = (settings.top) ? (settings.content_type == "image") ? (settings.top + top_modifier):(settings.top + top_modifier) : 100;

				// TODO: this probably should pass in the rindow and calculate, so that it can be done on the fly
				var coords = RDR.util.stayInWindow({left:left, top:top, width:200, height:30, ignoreWindowEdges:settings.ignoreWindowEdges});


                // TODO use settings check for certain features and content types to determine which of these to disable
                var $new_actionbar = $('<div class="rdr rdr_actionbar" id="' + actionbar_id + '" />').css({
                   'left':coords.left,
                   'top':coords.top
                }).append('<ul/>');

				// store the content selected that spawned this actionbar
				// used for determining later on if an actionbar is being called by the same interaction as a
				// currently-visible actionbar

                // if this is an image, make sure we have the image hashed, tagged, and have its hash as a container:
                if (settings.content_type == "image" && !settings.container ) {
                    var hashText = "rdr-img-"+settings.content,
                    hash = RDR.util.md5.hex_md5( hashText );
                    settings.container = hash;
                }

                var items = [
                        {
                            "item":"reaction",
                            "tipText":"React to this",
                            "onclick":function(){
                                RDR.actions.sentimentBox({
                                    "container": settings.container,
                                    "content_type": settings.content_type,
                                    "content": settings.content,
									"coords": coords
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
                    if(idx===0){$item.prepend($('<span class="rdr_icon_divider" />'))}
                });

                //todo: [eric] I added a shareStart function that shows up after the rate-this dialogue,
                //but we're not sure yet if it's going to be the same function as this shareStart () above..

                $('body').append( $new_actionbar );
                $new_actionbar.find('li').hover(
                    function() {
                        $(this).find('a').siblings('.rdr_tooltip').show();
                    },
                    function () {
                        $(this).find('a').siblings('.rdr_tooltip').hide();
                    }
                );

				return $new_actionbar;
			},
			close: function($actionbars, effect){
                $actionbars.each(function(){
                    var $actionbar = $(this),
                    cleanup = function(){
                        var timeoutCloseEvt = $actionbar.data('timeoutCloseEvt');
                        var timeoutCollapseEvt = $actionbar.data('timeoutCollapseEvt');
                        clearTimeout(timeoutCloseEvt);
                        clearTimeout(timeoutCollapseEvt);
                        $actionbar.remove();
                        RDR.util.removeImageShadow();
                    }
                    if(typeof effect !== "undefined"){
                        //make more robust if we want more animations
                        $actionbar.fadeOut(200, cleanup);
                    }
                    else{
                        cleanup();
                    }
                });
			},
            closeSuggest: function(actionbars) {
                
                var $actionbars = ( typeof actionbars == 'undefined' ) ? $('div.rdr.rdr_actionbar') ://cont
                    (actionbars.jquery) ? actionbars : $(actionbars);
                
                var scope = this;
                $actionbars.each(function(){
                    var that = this,
                    timeoutCloseEvt = $(this).data('timeoutCloseEvt');
                    
                    //each actionbar only has one timeout - if one exists, it gets cleared and reset here.
                    clearTimeout(timeoutCloseEvt);
                    timeoutCloseEvt = setTimeout(function(){
                        if( !$(that).data('keepAlive.img') && !$(that).data('keepAlive.self') ){
                            scope.close( $(that), "fade");
                            RDR.util.removeImageShadow();
                        }              
                    },300);
                    $(this).data('timeoutCloseEvt', timeoutCloseEvt);
                });
            },
            closeAll: function(){
                var $actionbars = $('div.rdr_actionbar');
                this.close($actionbars);
            },
            collapse: function(callback){
                //use call or apply to set 'this'
                //not needed because $($(this)) doesn't hurt anything, but still.
                var $this = (this.jquery) ? this : $(this),
                $aboutIcon = $this.find('li.rdr_icon_about'),
                $otherIcons = $aboutIcon.siblings();
                 
                var timeoutCollapseEvt = $(this).data('timeoutCollapseEvt');
                //each actionbar only has one timeoutCollapseEvt - if one exists, it gets reset here.
                clearTimeout(timeoutCollapseEvt);
                timeoutCollapseEvt = setTimeout(function(){
                    if( !$this.data('keepAlive.self') ){
                        $otherIcons.animate({width:'hide'},150, function(){
                            $aboutIcon.find('.rdr_icon_divider').hide();
                        });
                    }
                },250)
                //in order to protect against the dreaded oscillating event loop,
                //this timeoutCollapseEvt time should be at least as long as the collspase animate time
            },
            expand: function(callback){
                //use call or apply to set 'this'
                //not needed because $($(this)) doesn't hurt anything, but still.
                var $this = (this.jquery) ? this : $(this),
                $aboutIcon = $this.find('li.rdr_icon_about'),
                $otherIcons = $aboutIcon.siblings();

                $aboutIcon.find('.rdr_icon_divider').show();
                $otherIcons.animate({width:'show'},150);
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

                //not used. offsets are now relative to actionbar.
                //Is there any other code here we want to integrate to make a more general tooltip function?
                /* 
				// expects a settings object with:
				// settings.message (HTML)
				// settings.obj (to position tooltip next to.  should be a jQ obj).  if absent, position with the mouse.
				// settings.offset_x, settings.offset_y (optional): how many pixels to shit the tooltip from the passed-in object

                var $this = $('div.rdr.rdr_tooltip');
                if ( $this.length !== 0 ) {
                    //alreday exists return it/
                    return $this;
                }
                //(else)

				var $new_tooltip = $('<div class="rdr rdr_tooltip" class="rdr_tooltip_' + settings.name + '">' +
					'<div class="rdr rdr_tooltip-content"> ' + settings.message + '</div>'+
					'<div class="rdr rdr_tooltip-arrow-border"></div>'+
					'<div class="rdr rdr_tooltip-arrow"></div>'+
				'</div>');

				if (settings.obj) {
					var coords = settings.obj.offset();
					var offset_x = (settings.offset_x) ? settings.offset_x:0;
					var offset_y = (settings.offset_y) ? settings.offset_y:0;
					var x = coords.left + parseInt( offset_x );
					var y = coords.top + parseInt( offset_y );
				} else {
					// mouse, if we want it.
				}

				if ( x && y ) {
					// show the tooltip
					$('body').append( $new_tooltip );

					// now that it's in the page, position it (in part based on its calculated height);
					$new_tooltip.css('left', x + 'px');
					$new_tooltip.css('top', (y - $new_tooltip.height()) + 'px');
				}
				return $new_tooltip;
                */
            }
		},
		util: {
            stayInWindow: function(settings) {
                var coords = {},
	                rWin = $(window),
	                winWidth = rWin.width(),
	                winHeight = rWin.height(),
	                winScroll = rWin.scrollTop(),
					w = settings.width,
					h = settings.height,
					left = settings.left,
					top = settings.top,
					ignoreWindowEdges = (settings.ignoreWindowEdges) ? settings.ignoreWindowEdges:""; // ignoreWindowEdges - check for index of t, r, b, l

                if ( ( ignoreWindowEdges.indexOf('r') == -1 ) && (left+w+16) >= winWidth ) {
                    left = winWidth - w - 10;
                }
                if ( ( ignoreWindowEdges.indexOf('b') == -1 ) &&  (top+h) > winHeight + winScroll ) {
                    top = winHeight + winScroll - h + 75;
                }
                if ( ( ignoreWindowEdges.indexOf('l') == -1 ) && left < 10 ) {
					left = 10;
				}
                if ( ( ignoreWindowEdges.indexOf('t') == -1 ) && top - winScroll < 10 ) {
					top = winScroll + 10;
				}
                coords.left = left;
                coords.top = top;
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
				str2binl: function(str){var bin=Array();var mask=(1<<RDR.util.md5.chrsz)-1;for(var i=0;i<str.length*RDR.util.md5.chrsz;i+=RDR.util.md5.chrsz){bin[i>>5]|=(str.charCodeAt(i/RDR.util.md5.chrsz)&mask)<<(i%32);}return bin;},
				binl2hex: function(binarray){var hex_tab=RDR.util.md5.hexcase?"0123456789ABCDEF":"0123456789abcdef";var str="";for(var i=0;i<binarray.length*4;i++){str+=hex_tab.charAt((binarray[i>>2]>>((i%4)*8+4))&0xF)+hex_tab.charAt((binarray[i>>2]>>((i%4)*8))&0xF);} return str;}
			},
            cleanPara: function(para) {
                // common function for cleaning the paragraph.  right now, it's removing spaces, tabs, newlines, and then double spaces
                if(para != "") {
                    return para.replace(/[\n\r\t]+/gi,' ').replace().replace(/\s{2,}/g,' ');
                }
            },
            removeImageShadow: function() {
                $( RDR.group.img_selector+":not('.no-rdr')" ).removeClass('rdr_engage_img');
            }
        },
		session: {
			iframeHost : "http://readr.local:8080", // TODO put this in a template var
            getUser: function(args, callback) {
                if ( RDR.user && RDR.user.user_id && RDR.user.readr_token ) {
                    // we have a user id and token, be it temp or logged in user, so just run the callback
                    if ( callback && args ) callback(args);
                    else if ( callback ) callback();
                } else {
                    // define a new message receiver with this set of args and callback function
                    if ( callback && args ) RDR.session.receiveMessage( args, callback );
                    else if ( callback ) RDR.session.receiveMessage( false, callback );

                    // posting this message then means we'll look in the $.receiveMessage for the response and what to do next
                    // TODO need a timeout and/or try/catch?
                    $.postMessage(
                        "getUser",
                        RDR.session.iframeHost + "/xdm_status/",
                        window.frames['rdr-xdm-hidden']
                    );
                }
            },
            handleGetUserFail: function(response, callback) {
                switch ( response.message ) {
                    case "Error getting user!":
                        // kill the user object and cookie
                        RDR.session.killUser();

                        // TODO tell the user something failed and ask them to try again
                        // pass callback into the login panel
                    break;

                    case "Temporary user interaction limit reached":
                        // TODO: something.  anything at all.
                    break;

                    case "Token was invalid":
                    case "Facebook token expired":  // call fb login
                    case "Social Auth does not exist for user": // call fb login
                        // the token is out of sync.  could be a mistake or a hack.
                        $.postMessage(
                            "checkSocialUser",
                            RDR.session.iframeHost + "/xdm_status/",
                            window.frames['rdr-xdm-hidden']
                        );
                        // init a new receiveMessage handler to fire this callback if it's successful
                        RDR.session.receiveMessage( false, callback );
                    break;
                }
            },
			createXDMframe: function() {
                RDR.session.receiveMessage();

                var iframeUrl = RDR.session.iframeHost + "/xdm_status/",
                parentUrl = window.location.href,
                parentHost = window.location.protocol + "//" + window.location.host;
                $xdmIframe = $('<iframe id="rdr-xdm-hidden" name="rdr-xdm-hidden" src="' + iframeUrl + '?parentUrl=' + parentUrl + '&parentHost=' + parentHost + '&group_id='+RDR.groupPermData.group_id+'&cachebust='+RDR.cachebuster+'" width="1" height="1" style="position:absolute;top:-1000px;left:-1000px;" />'
                );
                $('body').append( $xdmIframe );


				// this is the postMessage receiver for ALL messages posted.
                // TODO: put this elsewhere so it's more logically placed and easier to find??
			},
            receiveMessage: function(args, callback) {
                $.receiveMessage(
                    function(e){
                        var message = JSON.parse( e.data );

                        if ( message.status ) {;
                            switch ( message.status ) {
                                // currently, we don't care HERE what user type it is.  we just need a user ID and token to finish the action
                                // the response of the action itself (say, tagging) will tell us if we need to message the user about temp, log in, etc
                                case "fb_logged_in":
                                case "known_user":
                                case "got_temp_user":
                                    //console.dir(message.data);
                                    for ( var i in message.data ) {
                                        RDR.user[ i ] = message.data[i];
                                    }

                                    if ( callback && args ) {
                                        args.user = RDR.user;
                                        callback(args);
                                    }
                                    else if ( callback ) callback();
                                break;

                                case "checkSocialUser fail":
                                break;

                                case "already had user":
                                    $('#rdr-loginPanel div.rdr_body').html( '<div style="padding: 5px 0; margin:0 8px; border-top:1px solid #ccc;"><strong>Welcome!</strong> You\'re logged in.</div>' );
                                break;

                                case "educate user":
                                    RDR.session.educateUser();
                                break;
                            }
                        }
                    },
                    RDR.session.iframeHost
                );
            },
			login: function() {},
			showLoginPanel: function(args, callback) {

                $('.rdr_rewritable').removeClass('rdr_rewritable');
                $('#rdr-loginPanel').remove();

                //todo: weird, why did commenting this line out not do anything?...look into it
				//porter says: the action bar used to just animate larger and get populated as a window
                //$('div.rdr.rdr_actionbar').removeClass('rdr_actionbar').addClass('rdr_window').addClass('rdr_rewritable');

                var caller = args.rindow;
                var offsets = caller.offset();
                var left = offsets.left ? (offsets.left-34) : 100;
                var top = offsets.top ? (offsets.top+50) : 100;

                // TODO: this probably should pass in the rindow and calculate, so that it can be done on the fly
                // var coords = RDR.util.stayInWindow({left:left, top:top, width:360, height:185 });

                var rindow = RDR.rindow.draw({
                    left:left,
                    top:top,
                    id: "rdr-loginPanel",
                    pnlWidth:360,
                    pnls:1,
                    height:185
                });

                // store the arguments and callback function that were in progress when this Login panel was called
                rindow.data( 'args', args );
                rindow.data( 'callback', callback );

                // create the iframe containing the login panel
				var $loginHtml = $('<div class="rdr_login" />'),
				iframeUrl = RDR.session.iframeHost + "/fblogin/",
				parentUrl = window.location.href,
                parentHost = window.location.protocol + "//" + window.location.host;
				$loginHtml.append( '<h1>Log In</h1><div class="rdr_body rdr_leftShadow" />');
				$loginHtml.find('div.rdr_body').append( '<iframe id="rdr-xdm-login" src="' + iframeUrl + '?parentUrl=' + parentUrl + '&parentHost=' + parentHost + '&group_id='+RDR.groupPermData.group_id+'&cachebust='+RDR.cachebuster+'" width="360" height="150" style="overflow:hidden;" />' );

				
				// rindow.animate({
    //                 width:'500px',
    //                 minHeight:'125px'
    //             }, 300, function() {
    //                 rindow.append( $loginHtml );
    //             });
				rindow.find('div.rdr_contentSpace').append( $loginHtml );
			},
			killUser: function() {
                RDR.user = {};
                $.postMessage(
                    "killUser",
                    RDR.session.iframeHost + "/xdm_status/",
                    window.frames['rdr-xdm-hidden']
                );
            },
            showTempUserMsg: function(args) {
                if ( args.rindow ) {
                    //console.dir(args);
                    var rindow = args.rindow,
                        num_interactions_left = RDR.group.temp_interact - parseInt( args.int_id.num_interactions ),
                        $tempMsgDiv = $('<div class="rdr_tempUserMsg"><span /><strong /></div>'),
                        tempMsg = 'You can react or comment <strong>' + num_interactions_left + ' more times</strong> before you must ',
                        $loginLink = $('<a href="javascript:void(0);">Connect with Facebook</a>.');

                    if ( rindow.find('div.rdr_tempUserMsg').length == 0 ){
                        $loginLink.click( function() {
                            RDR.session.showLoginPanel( args );
                        });
                        $tempMsgDiv.find('span').html( tempMsg );
                        $tempMsgDiv.append( $loginLink );
                        rindow.append( $tempMsgDiv );
                        rindow.animate({height:(rindow.height()+103)+"px"});
                    } else {
                        $tempMsgDiv.find('span').html( tempMsg );
                    }
                    
                }
            },
            educateUser: function() {
                var $educateUser = $('<div id="rdr_ed_user" class="rdr"><div id="rdr_ed_user_1"><h1>Rate or discuss <span>anything</span> on this page!</h1></div><div id="rdr_ed_user_2">Just select text or slide your mouse over an image or video, and look for the <span>pin</span> icon.</div><div id="rdr_ed_user_x">x</div>');
                $('body').append( $educateUser );
                $('#rdr_ed_user_x').click( function() {
                    RDR.session.educateUserClose();
                });
                RDR.group.educateUserLocation = "top";
                if ( RDR.group.educateUserLocation && RDR.group.educateUserLocation=="bottom" ) {
                    $educateUser.css('top','auto');
                    $educateUser.css('bottom','-40px');
                    $('#rdr_ed_user').animate({bottom:0});
                } else {
                    var bodyPaddingTop = parseInt( $('body').css('padding-top') );
                    $('body').animate({ paddingTop: (bodyPaddingTop+35)+"px" });
                    $('#rdr_ed_user').animate({top:0});
                }
            },
            educateUserClose: function() {
                if ( RDR.group.educateUserLocation && RDR.group.educateUserLocation=="bottom" ) {
                    $('#rdr_ed_user').animate({bottom:-40});
                } else {
                    var bodyPaddingTop = parseInt( $('body').css('padding-top') );
                    $('body').animate({ paddingTop: (bodyPaddingTop-35)+"px" });
                    $('#rdr_ed_user').animate({top:-40});
                }
                // set a cookie in the iframe saying not to show this anymore
                $.postMessage(
                    "educatedUser",
                    RDR.session.iframeHost + "/xdm_status/",
                    window.frames['rdr-xdm-hidden']
                );
            }
		},
        actions: {
            aboutReadrBoard: function() {
                alert('Testing... Readrboard gives you more revenue and deeper engagement!');
            },
            bookmarkStart: function() {
                alert('Testing... This will be bookmarked!  Thanks!');
            },
            init: function(){
                var that = this;
                $RDR = $(RDR);
                $RDR.queue('initAjax', function(next){
                    that.initGroupData(RDR.groupPermData.short_name);
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
                    url: "/api/settings/"+RDR.groupPermData.group_id+"/",
                    type: "get",
                    contentType: "application/json",
                    dataType: "jsonp",
                    data: {
                        host_name : window.location.hostname
                    },
                    success: function(response, textStatus, XHR) {
                        RDR.group = response.data;
						RDR.group.group_id

                        //todo:just for testing for now: - add defaults:
                        RDR.group.img_selector = RDR.group.img_selector || "div.container img";
                        RDR.group.selector_whitelist = RDR.group.selector_whitelist || "div.container p";

                        // //todo: REMOVE THIS
                        // RDR.group.blessed_tags = [
                        // {
                        //     name: "Cute",
                        //     tid: 1
                        // },
                        // {
                        //     name: "Great Tip",
                        //     tid: 2
                        // },
                        // {
                        //     name: "Funny",
                        //     tid: 3
                        // },
                        // {
                        //     name: "Wait, what?",
                        //     tid: 4
                        // }
                        // ];
                        $RDR.dequeue('initAjax');
                    },
                    error: function(response) {
                        //for now, ignore error and carry on with mockup
                        console.warn('ajax error');
                        console.log(response);
                    }
                });
            },
            initUserData: function(userShortName){
                // request the RBGroup Data
                $.ajax({
                    url: "/api/rbuser/",
                    type: "get",
                    contentType: "application/json",
                    dataType: "jsonp",
                    data: {
                        short_name : userShortName
                    },
                    success: function(response, textStatus, XHR) {

                        //get this from the DB?
                        //this.anno_whitelist = "#module-article p";

                        $.each(response, function(index, value){
                            var rb_group = value;
                            //Only expects back one user (index==0)

                        });

                    },
                    error: function(response) {
                        //for now, ignore error and carry on with mockup
                        console.warn('ajax error');
                        console.log(response);
                    }
                });
            },
            initPageData: function(){
                // RDR.session.educateUser();
               //? do we want to model this here to be symetrical with user and group data?

                // TODO flesh out Porter's code below and incorporate it into the queue

                var url = window.location.href + window.location.hash;
				var canonical = ( $('link[rel="canonical"]').length > 0 ) ? $('link[rel="canonical"]').attr('href'):"";
                var title = ( $('meta[property="og:title"]').attr('content') ) ? $('meta[property="og:title"]').attr('content'):$('title').text();
                if ( !title ) title = "";

				//TODO: if get request is too long, handle the error (it'd be b/c the URL of the current page is too long)
				//might not want to send canonical, or, send it separately if/only if it's different than URL
				$.ajax({
                    url: "/api/page/",
                    type: "get",
                    contentType: "application/json",
                    dataType: "jsonp",
                    data: {
						group_id: RDR.groupPermData.group_id,
						url: url,
						canonical_url: canonical,
                        title: title
					},
					success: function(response) {
                        
                        makeSummaryWidget(response);
                        insertImgIcons(response);
                                                   
                        //to be normally called on success of ajax call
                        $RDR.dequeue('initAjax');
                    },
                    error: function(response) {
                        //for now, ignore error and carry on with mockup
                        console.warn('ajax error');
                        console.log(response);
                    }
				});

                //helper functions for ajax above
                function makeSummaryWidget(response){
                    // don't forget a design for when there are no tags.
                    RDR.page = response.data;
                    var $summary_widget = $('#rdr-summary');
                    
                    var total_interactions = 0;
                    for ( var i in RDR.page.summary ) {
                        if ( RDR.page.summary[i].count ) total_interactions += RDR.page.summary[i].count;
                    }

                    if ( total_interactions > 0 ) {
                        var people = ( RDR.page.topusers.length > 1 ) ? RDR.page.topusers.length + " people" : "1 person";
                        $summary_widget.append('<div class="rdr-sum-headline">'+total_interactions+' reactions from '+people+'</div>');
                    } else {
                        $summary_widget.append('<div class="rdr-sum-headline">No reactions yet.  Select something and react!</div>');
                    }

                    // summary widget: specific tag totals
                    if ( RDR.page.toptags.length > 0 ){
                        var $toptags = $('<div class="rdr-top-tags" />');

                        for ( var i = 0, j=4; i < j; i++ ) {
                            var this_tag = RDR.page.toptags[i];
                            if ( this_tag ) {
                                $toptags.append(' <span>'+ this_tag.body +' <em>('+this_tag.tag_count+')</em></span>&nbsp;&nbsp;&nbsp;');
                            }
                            
                            // the tag list will NOT line wrap.  if its width exceeds the with of the image, show the "click to see more" indicator
                            if ( $toptags.width() > $summary_widget.width() - 48 ) {
                                $toptags.children().last().html('See More').addClass('rdr_see_more');
                                break;
                            }
                        }

                        $summary_widget.append( $toptags );
                    }

                    if ( RDR.page.topusers.length > 0 ){
                        var $topusers = $('<div class="rdr-top-users" />');

                        for ( var i = 0, j=10; i < j; i++ ) {
                            var this_user = RDR.page.topusers[i];
                            if ( this_user ) {
                                $topusers.append('<img src="'+this_user.img_url+'" class="no-rdr" />');
                            }
                        }

                        $summary_widget.append( $topusers );
                    }
                }

                function insertImgIcons(response){
                    var tempd = $.extend( {}, response );
                    for ( var i in RDR.page.imagedata ){
                        //todo: combine this with the other indicator code and make the imagedata give us a hash from the db
                        var hash = RDR.util.md5.hex_md5(i);
                        RDR.page.imagedata[i].hash = hash; //todo: list these by hash in the first place.

                        //RDR.actions.indicators.make( hash );
                    }
                }
           
            },
            initEnvironment: function(){
                
                //div to hold indicators, filled with insertContainerIcon(), and then shown.
                var $indicatorDetailsWrapper = $('<div id="rdr_indicator_details_wrapper" />').appendTo('body');

                // init the img interactions img selector image selector  (those are keywords for easier-inpage searching)
				$( RDR.group.img_selector+":not('.no-rdr')" ).live( 'mouseover', function() {

                    //todo change this so that .live for imgs just resets coordinates, doesnt instantiate actionbar...
                    
					// TODO check that the image is large enough?
					// TODO keep the actionbar in the window
					// TODO image needs to show in rate window
					// TODO all image functions need CURRENT URL (incl. hash) + IMG SRC URL for rating, SHARING, etc.
					// TODO show activity on an image, without breaking page nor covering up image.
						// create a container for the image, give it same styles but more space?
						// like, inline or float, but with RDR stuff

                    
				    var this_img = $(this),
				    left = this_img.offset().left + 34,
				    top = this_img.offset().top + this_img.height() + 20,
                    // $(this).attr('src') will yield relative path
                    // this.src will yield absolute path
                    // for jQuery selecting ( $(img[src$='foobar.png']) ), we want the relative path
                    src = this_img.attr('src'),
				    src_with_path = this.src;

                    this_img.addClass('rdr_engage_img');

                    // builds a new actionbar or just returns the existing $actionbar if it exists.
				    var $actionbar = RDR.actionbar.draw({ left:left, top:top, content_type:"image", content:src, src_with_path:src_with_path, ignoreWindowEdges:"rb" });
                    $actionbar.data('keepAlive.img',true)

                    //kill all rivals!!
                    var $rivals = $('div.rdr_actionbar').not($actionbar);
                    RDR.actionbar.close( $rivals );

                    // todo: break out these animation effects into functions saved under actionbar.<collspase>
				    $actionbar.hover(
                        function() {
                            $actionbar.data('keepAlive.self',true);
                            RDR.actionbar.expand.call(this);
                        },
                        function() {
                            $actionbar.data('keepAlive.self',false);
                            RDR.actionbar.collapse.call(this);
                            RDR.actionbar.closeSuggest($actionbar);
                        }
				    );

				}).live('mouseleave', function() {
                    
                    //use this instead of $().attr('src') to fix descrepencies between relative and absolute urls
                    var src = this.src;
					var actionbar_id = "rdr_actionbar_"+RDR.util.md5.hex_md5( src );
                    var $actionbar = $('#'+actionbar_id);
                    $actionbar.data('keepAlive.img',false)
                    RDR.actionbar.closeSuggest($actionbar);
				});
				// END


                $(document).bind('mouseup.rdr', this.startSelect );

                //add escape keypress event to document to close all rindows
                $(document).bind('keyup.rdr', function(event) {
                    if (event.keyCode == '27') { //esc
                        RDR.rindow.closeAll();
                        RDR.actionbar.closeAll();
                        //todo: temp - control this better;
                        $('.rdr_clone').remove()
                    }
                    //todo - consider unifying style of close vs closeAll.  Should any of these components 'own' the others?  IE. should tooltips belong to the actionbar?
                });
                $(document).bind('dblclick.rdr',function(event) {
                    var mouse_target = $(event.target);                                

                    if ( !$(mouse_target).parents().hasClass('rdr')) {
                        RDR.rindow.closeAll();
                    }

                });

                this.hashNodes();
				$RDR.dequeue('initAjax');
            },
            hashNodes: function() {
                
                // snag all the nodes that we can set icons next to and send'em next
                // TODO: restrict this to the viewport + a few, rather than all

                //setup text nodes
                //todo: think about .not('img') here
                //todo: look into selector_whitelist vs anno_whitelist
                var $textNodes = $( RDR.group.selector_whitelist ).not('.rdr-hashed').not('img');
                $textNodes.each( function() {
                    // get the node's text and smash case
                    // TODO: <br> tags and block-level tags can screw up words.  ex:
                    // hello<br>how are you?   here becomes
                    // hellohow are you?    <-- no space where the <br> was.  bad.
                    var node_text = $(this).html().replace(/< *br *\/?>/gi, '\n');
                    var body = $.trim( $( "<div>" + node_text + "</div>" ).text().toLowerCase() );
                    body = RDR.util.cleanPara( body );
                    $(this).data('body',body);
                });


                //todo: implement black list
                var $imgNodes = $( RDR.group.img_selector ).not('.rdr-hashed');//.not('.no-rdr'); //todo put back

                $imgNodes.each( function() {
                    var body = $(this).attr('src');
                    $(this).data('body',body);
                });

                $nodes = $textNodes.add($imgNodes);
                $nodes.each(function(){
                    var body = $(this).data('body'),
                    kind = $(this)[0].tagName.toLowerCase();

                    var hashText = ( kind=="img") ? "rdr-"+kind+"-"+body : "rdr-text-"+body, //rdr-img-dailycandy.com/image/cake.jpg || rdr-p-ohshit this is some crazy text up in this paragraph
                    hash = RDR.util.md5.hex_md5( hashText );

                    if ( RDR.containers[hash] ) return
                    if ( typeof body === "undefined" ) return

                    // add an object with the text and hash to the nodes dictionary
                    RDR.containers[hash] = {
                        body:body,
                        kind:kind
                    };
                
                    // add a CSS class to the node that will look something like "rdr-207c611a9f947ef779501580c7349d62"
                    // this makes it easy to find on the page later
                    $(this).addClass( 'rdr-' + hash ).addClass('rdr-hashed');
                    $(this).data('hash', hash);                   
                    
                });
                RDR.actions.sendHashes();
            },
            sendHashes: function() {
                // TODO: dont' send all hashes

                var md5_list = [];
                for (var i in RDR.containers ) {
                    md5_list.push( i );
                }

				var sendData = {
					short_name : RDR.group.short_name,
					pageID : 1,
					//todo: talk to Porter about how to Model the Page Data
					hashes : md5_list
				}
                // send the data!
                $.ajax({
                    url: "/api/summary/containers/",
                    type: "get",
                    contentType: "application/json",
                    dataType: "jsonp",
                    data: {
                    	json: JSON.stringify(sendData)
                    },
                    success: function(response) {
                        var summaries = response.data.known,
                        unknownList = response.data.unknown;
                        
                        if( !$.isEmptyObject(summaries) ){
                            RDR.actions.summaries.save(summaries);
                        }

                        if ( unknownList.length > 0 ) {
                            var sendData = {};
                            $.each( unknownList, function(idx, hash) {
                                sendData[hash] = RDR.containers[hash];
                            });
                            $.ajax({
                                url: "/api/containers/create/",
                                type: "get",
                                contentType: "application/json",
                                dataType: "jsonp",
                                data: {
                                    json: JSON.stringify(sendData)
                                },
                                success: function(response) {
                                    //do nothing for now.
                                    //var newfoundSummaries = response.data;
                                },
                                error: function(response) {
                                    //for now, ignore error and carry on with mockup
                                    console.warn('ajax error');
                                    console.log(response);
                                }
                            });
                        }

                        //todo: account for newbie pins
                        RDR.actions.indicators.show();
                    },
                    error: function(response) {
                        //for now, ignore error and carry on with mockup
                        console.warn('ajax error');
                        console.log(response);
                    }
                });
            },
            indicators: {
                show: function(){
                    //fade in indicators
                    $('.rdr_indicator').css({
                        'opacity':'0',
                        'display':'inline'
                    }).fadeTo('300', '0.4');
                },
                make: function(hash){
                    //kind is optional - defaults to text
                    
                    // if ( RDR.content_nodes[i].info.com_count + RDR.content_nodes[i].info.tag_count > 0 ) {
                    //console.log('-- what we know about container with hash '+hash+' --');
                    //console.log(RDR.content_nodes[hash]);
                    var $container, $indicator, $indicator_details, some_reactions, total, info, top_tags, kind;

                    var summary = RDR.summaries[hash];
                    node = RDR.containers[hash];

                    //todo: prop down var change
                    kind = node.kind;
                    top_tags = summary.top_interactions.tags;
                    //hide indicators and indicatorDetails and show on load.

                    //todo: consider making more effecient.
                    $container = $('.rdr-'+hash); // prepend with the anno_whitelist selector
                    
                    total = summary.counts.tags;
                    if( kind == 'img' ){
                        //is an image
                        //todo: this is all a temp hack.  Consolodate this code!
                        var $this_img, $tagList, imageData;

                        /*
                        $.each(RDR.page.imagedata, function(i,v){
                            if(v.hash == hash){
                                imageData = v;
                            }
                        });
                        */
                        //todo: prop down this change var change
                        
                        $this_img = $container

                        function SortByTagCount(a,b) { return b.count - a.count; }
                        //todo: bring sorting back
                        //imageData.tags.sort( SortByTagCount );
                        
                        //total = imageData.tag_count;
                        total = summary.counts.tags;

                        $indicator = $('<div class="rdr rdr_indicator rdr_image"></div>').hide();
                        $indicator.append(
                            '<img src="/static/images/blank.png" class="no-rdr" />',
                            '<span class="rdr_count">'+ total +' reactions: </span>'
                        );

                        $tagList = $('<div class="rdr_img_tags_list"></div>');  // absolute so that we can calculate content width on the fly
                        $indicator.append($tagList);

                        $this_img.after( $indicator );

                        var tagListMaxWidth = $this_img.width()-100; //subtract a bit of a margin
                        var count = 0;
                        $.each( summary.top_interactions.tags, function(hash, tag){
                            if(count == null) return; //used as a break statement
                            var prefix = count ? ", " : "", //don't include the first time
                            $tag = $('<strong/>').append(tag.body),
                            $count = $('<em/>').append( '('+tag.count+')' ),
                            $span = $('<span />').append( prefix, $tag, $count);
                            
                            $tagList.append( $span );
                            
                            // the tag list will NOT line wrap.  if its width exceeds the with of the image, show the "click to see more" indicator
                            if ( $tagList.width() > tagListMaxWidth ) {
                                $tagList.children().last().html('...').addClass('rdr_see_more');
                                count = null;
                            }
                            count ++;
                        })

                        $indicator.data({ 'which':hash, 'imageData':imageData })//chain
                        .click( function() {
                            RDR.actions.viewContainerReactions( {icon:$indicator, kind:"image"} );
                            return false;
                        })//chain
                        .hover(
                            function() {
                                $(this).css('opacity','0.9');
                            },
                            function() {
                                $(this).css('opacity','0.4')
                            }
                        );
                        $indicator.hide();
                        return;
                    }   

                    $indicator = $('<div id="rdr_indicator_' +hash+ '" class="rdr_indicator" />').hide().appendTo($container);

                    $indicator.append(
                        '<img src="/static/images/blank.png" class="no-rdr" />',
                        '<span class="rdr_count">'+ total +'</span>'
                    )//chain
                    .data( {'which':hash} )//chain
                    .hover( 
                        function() {
                            //todo: what does this do?
                            //$( RDR.group.anno_whitelist + ".rdr-" + $(this).data('hash') ).addClass( 'rdr_highlightContainer' );
                            
                            //todo: maybe make more efficient
                            $indicator_details.find('.rdr_statsClone').html( $indicator.html() );
                            $indicator_details.css({
                                'display':'block',
                                'top': $indicator.offset().top,
                                'left':$indicator.offset().left
                            });
                        },
                        function() {
                            //todo: what does this do?
                            //$( RDR.group.anno_whitelist + ".rdr-" + $(this).data('hash') ).removeClass( 'rdr_highlightContainer' );
                            //dont hide it again here, because we need to do that on the hoveroff event of the rdr_indicator_details

                            //ensure smooth hover behavior
                            /*
                            setTimeout(function(){
                                if( $(this).data('hoverLock') ){
                                    $indicator_details.hide();
                                }
                            },500)
                            */
                        }
                    );                   
                                        

                    //Setup the indicator_details and append them to the #rdr_indicator_details div attached to the body.
                    //These details are shown and positiond upon hover over the indicator which lives inline appended to the container.
                    $indicator_details = $('<div id="rdr_indicator_details_' +hash+ '" class="rdr_indicator_details rdr_text" />');
                    $indicator_details.append(
                        '<div class="rdr_statsClone" />',
                        '<span class="rdr_details"> reactions: </span>'
                    ).appendTo('#rdr_indicator_details_wrapper');                                        
                    $tagList = $('<div class="rdr_img_tags_list"></div>').appendTo( $indicator_details );
                    
                    var tagListMaxWidth = 200;

                    //build tags in $tagList.  Use visibility hidden instead of hide to ensure width is measured without a FOUC.
                    $indicator_details.css({ 'visiblity':'hidden' }).show();

                    var count = 0;
                    $.each( summary.top_interactions.tags, function(hash, tag){
                        if(count == null) return; //used as a break statement
                        var prefix = count ? ", " : "", //don't include the first time
                        $tag = $('<strong/>').append(tag.body),
                        $count = $('<em/>').append( '('+tag.count+')' ),
                        $span = $('<span />').append( prefix, $tag, $count);
                        
                        $tagList.append( $span );
                        
                        // the tag list will NOT line wrap.  if its width exceeds the with of the image, show the "click to see more" indicator
                        if ( $tagList.width() > tagListMaxWidth ) {
                            $tagList.children().last().html('...').addClass('rdr_see_more');
                            count = null;
                        }
                        count ++;
                    })


                    $indicator_details.css({ 'visiblity':'visible' }).hide();

                    $indicator_details.click( function() {
                        RDR.actions.viewContainerReactions( {icon:$indicator, kind:"text"} );
                    })//chain
                    .hover(
                        function() {
                            $indicator.data('hoverLock', true)
                            //do nothing
                        },
                        function() {
                            $indicator.data('hoverLock', false)
                            $(this).hide();
                        }
                    );
                },
                sortReactions: function( hash ){

                    //todo: consider sorting on the backend
                    // order the container's tags by tag_count
                    function SortByTagCount(a,b) { return b.count - a.count; }
                    var info = RDR.content_nodes[ hash ].info;
                    info.tags = [];
                    
                
                    info.total_tags = 0;
                    
                    // info.tags_order = [];

                    // loop through the content object to create a similar object that has tags at the top of the hierarchy, 
                    // to prevent looping through .content over and over
                    for ( var j in info.content ) {
                        // console.dir(content);
                        var content = info.content[j];

                        for ( var i in content.tags ) {
                            var tag = content.tags[i];

                            var tag_idx = -1;
                            for ( var z in info.tags ) {
                                if ( info.tags[z].id == tag.id ) {
                                    tag_idx = z;
                                    break;
                                }
                            }
                            if ( tag_idx == -1 ) {
                                info.tags.push({ id:tag.id, name:tag.tag, count:0, com_count:0, content:{} });
                                tag_idx = ( info.tags.length - 1 );
                            }

                            info.tags[ tag_idx ].count += tag.count;
                            if (tag.comments) info.tags[ tag_idx ].com_count += tag.comments.length;
                            info.tags[ tag_idx ].content[ j ] = { count:tag.count, tag_idx:parseInt(i) };
                            info.total_tags += tag.count;
                        };
                    };

                    info.tags.sort(SortByTagCount);
                    RDR.content_nodes[ hash ].info = info;
                    //todo: consider showing just tags here and simplifying

                    return info;
                }
            },
            summaries:{
                save: function(summaries){
                    $.each(summaries, function(hash,summary){
                        RDR.summaries[hash] = summary;
                        if(summary.counts.tags) {
                            RDR.actions.indicators.make( hash );
                        }
                    });
                }
            },
            insertContainerIcon: function( hash ) {},
            viewContainerReactions: function( args ) {

                var icon = args.icon,
                    which = args.icon.data('which'),
                    kind = args.kind,
                    tempLock = args.tempLock;
                
                var summary = RDR.summaries[which];
                function SortByTagCount(a,b) { return b.count - a.count; }


                var sendData = {
                    "page_id" : RDR.page.id,
                    "container_id":summary.id,
                    "top_tags":summary.top_interactions.tags
                }

                $.ajax({
                    url: "/api/summary/container/content/",
                    type: "get",
                    contentType: "application/json",
                    dataType: "jsonp",
                    data: { json: JSON.stringify(sendData) },
                    success: function(response) {

                        var content_nodes = response.data;
                        //todo: make this generic interactions instead of just tags
                        //summary.interactions.tags = 
                        
                        //throw this tag summary into the container summary
                        summary.content_nodes = content_nodes;
                    },
                    error: function(response) {
                        //for now, ignore error and carry on with mockup
                        console.warn('ajax error');
                        console.log(response);
                    }
                });



                var selector = ".rdr-" + which;

                if (args.kind == "text") {
                    var info = icon.data('info');

                } else if (args.kind == "image") {
                    //todo: this is a temp fix - consolodate.
                    var info = icon.data('imageData');
                }

                var iconOffsets = args.icon.offset();

                var rindow = RDR.rindow.draw({
                    left:iconOffsets.left,
                    top:iconOffsets.top,
                    pnlWidth:200,
                    ignoreWindowEdges:"bl",
                    noHeader:true,
                    selector:selector
                });

                rindow.find('div.rdr_contentSpace').empty();  // empty this out in case it's just repositioning the rindow.

                rindow.css({width:'200px'});
                var $sentimentBox = $('<div class="rdr_sentimentBox rdr_new rdr_reactions rdr_'+kind+'_reactions" />'),

                    $reactionPanel = $('<div class="rdr_reactionPanel rdr_read rdr_sntPnl" />'),
                    $contentPanel = RDR.actions.panel.draw( "contentPanel", rindow ),
                    $whyPanel = RDR.actions.panel.draw( "whyPanel", rindow ),
                    $tagBox = $('<div class="rdr_tagBox" />').append('<ul class="rdr_tags rdr_preselected" />'),
                    $borderLine = $('<div class="rdr_borderLine" />');
                
                var headers = ["Reactions <span>("+(summary.counts.tags)+")</span>", "", ""];  // removing comment count for now +info.com_count
                $sentimentBox.append($reactionPanel, $contentPanel, $whyPanel); //$selectedTextPanel, 
                $sentimentBox.children().each(function(idx){
                    var $header = $('<div class="rdr_header" />').append('<div class="rdr_icon"></div><div class="rdr_headerInnerWrap"><h1>'+ headers[idx] +'</h1></div>'),
                    $body = $('<div class="rdr_body"/>');
                    $(this).append($header, $body).css({
                        // 'width':rindow.settings.pnlWidth
                    });
                });
                RDR.actions.panel.setup("contentPanel", rindow);

                //populate reactionPanel
                $reactionPanel.find('div.rdr_body').append($borderLine, $tagBox);


                var topTags = summary.top_interactions.tags,
                totalTags = summary.counts.tags,
                totalComs = summary.counts.coms;

                ////populate blesed_tags
                $.each( topTags, function( tagID, tag ){
                    
                    var percentage = Math.round( ( tag.count/totalTags ) * 100);                
                    var $li = $('<li class="rdr_tag_'+tagID+'" />').data({
                        'tag':{
                            id:parseInt( tagID ),
                            name:tag.body,
                            count:tag.count
                        },
                        'which':which
                    }),
                    $leftBox = '<div class="rdr_leftBox">'+percentage+'%</div>',
                    $tagText = '<div class="rdr_tagText">'+tag.body+'</div>',
                    $rightBox = '<div class="rdr_rightBox" />';

                    $li.append($leftBox,$tagText,$rightBox);
                    if ( summary.counts.coms > 0 ) $li.addClass('rdr_has_comment');
                    $tagBox.children('ul.rdr_tags').append($li);
                
                });

                rindow.animate({
                    width: rindow.settings.pnlWidth +'px'
                    // minHeight: rindow.settings.height +'px'
                }, rindow.settings.animTime, function() {
                    $(this).css('width','auto');
                    // rindow.append($sentimentBox);

                    rindow.find('div.rdr_contentSpace').html( $sentimentBox );
                    // RDR.actions.sentimentPanel.addCustomTagBox({rindow:rindow, settings:rindow.settings});
                    RDR.rindow.checkHeight( rindow, 0, "reactionPanel" );


                    //this is the read_mode only
                    // enable the "click on a blessed tag to choose it" functionality.  just css class based.
                    //for now disallow img read_mode                    
                    rindow.find('ul.rdr_preselected li').bind('click', function() {
                        //for now disable li clicks for image readmode
                        if(kind == 'image') return false;
                        var $this = $(this);
                        if ( !$this.hasClass('rdr_customTagBox') ) {
                            // if ( $this.hasClass('rdr_selected') ){
                                // $this.removeClass('rdr_selected');
                            // } else {
                            $this.addClass('rdr_selected');
                            $this.siblings().removeClass('rdr_selected');
                            $this.parents('div.rdr.rdr_window').removeClass('rdr_rewritable');
                            RDR.actions.viewReactionContent( $this.data('tag'), $this.data('which'), rindow );
                            //RDR.actions.rateSend({ tag:$this, rindow:rindow, settings:settings });//end rateSend
                        }
                        
                        //todo: branch text and img
                        /*
                        if(false){ //text
                        } else {
                        // skip the CONTENT PANEL and jump to the WHYPANEL
                        }
                        */
                        return false; //so click on <a>img</a> gets overridden
                    });
                
                });
            },
            viewReactionContent: function(tag, which, rindow){
                
                //temp reconnecting:
                var container = RDR.containers[which];
                var summary = RDR.summaries[which];
                
                // zero out the content in the whyPanel, since they just selected a new tag and the comments would not reflect the now-selected tag.
                rindow.find('div.rdr_whyPanel div.rdr_header h1').html('Comments');
                rindow.find('div.rdr_whyPanel div.rdr_body').html('<div class="rdr_commentSet">Select something in the column to the left to leave a comment on it.</div>');

                /*
                var content = [];
                for ( var i in tag.body ) {
                    content.push( {idx:parseInt(i), tag_idx:tag.body[i].tag_idx, count:tag.content[i].count } );
                }
                */
                //todo: temp stuff
                var content = [];
                $.each(summary.content_nodes, function(key, val){
                    content.push(val);
                });

                function SortByTagCount(a,b) { return b.counts.tags - a.counts.tags; }
                content.sort(SortByTagCount);

                //todo: consolodate truncate functions
                var maxHeaderLen = 20;
                var tagName = tag.name.length > maxHeaderLen ? tag.name.slice(0, maxHeaderLen)+"..." : tag.name;
                log (tagName);

                rindow.find('div.rdr_contentPanel div.rdr_header h1').html(tagName+' <span>('+tag.count+')</span>');
                if ( rindow.find('div.rdr_contentPanel div.rdr_body').data('jsp') ) rindow.find('div.rdr_contentPanel div.rdr_body').data('jsp').destroy();
                rindow.find('div.rdr_contentPanel div.rdr_body').empty();

                var tagClone = $.extend({}, tag);

                // ok, get the content associated with this tag!
                $.each(content, function(idx, node){
                    var tag = tagClone;
                    var $contentSet = $('<div class="rdr_contentSet" />'),
                        $header = $('<div class="rdr_contentHeader rdr_leftShadow" />'),
                        $content = $('<div class="rdr_content rdr_leftShadow"><div class="rdr_otherTags"></div></div>');
                    $header.html( '<a class="rdr_tag hover" href="javascript:void(0);"><span class="rdr_tag_share"></span><span class="rdr_tag_count">('+node.counts.tags+')</span> '+tag.name+'</a>' );
                    $header.find('span.rdr_tag_count').click( function() {
                        RDR.actions.rateSendLite({ element:$(this), tag:tag, rindow:rindow, content:node.body, which:which });
                    });

                    if ( node.counts.coms > 0 ) {
                        $comment = $('<div class="rdr_has_comment">' +node.counts.coms+ '</div>');
                    } else {
                        $comment = $('<div class="rdr_can_comment">Comment</div>');
                    }

                    $comment.data('c_idx',node.idx);
                    $comment.click( function() {
                        var $this = $(this);
                        $this.closest('.rdr_contentSet').addClass('rdr_selected').siblings().removeClass('rdr_selected');
                        RDR.actions.viewCommentContent( tag, which, $(this).data('c_idx'), rindow, node);
                    });

                    $header.append( $comment );

                    $content.find('div.rdr_otherTags').before( '"' + node.body + '"' );
                    var otherTags = node.top_interactions.tags;
                    if( !$.isEmptyObject(otherTags) ){
                        $content.find('div.rdr_otherTags').append( '<em>Other Reactions</em>' );
                        for ( var j in otherTags ) {
                            var thisTag = otherTags[j];
                            var $this_tag = $('<a class="rdr_tag hover" href="javascript:void(0);"><span class="rdr_tag_share"></span><span class="rdr_tag_count">('+thisTag.count+')</span> '+thisTag.body+'</a>');
                            $this_tag.find('span.rdr_tag_count').click( function() {
                                RDR.actions.rateSendLite({ element:$(this), tag:thisTag, rindow:rindow, content:node.body, which:which });
                            });
                            $content.find('div.rdr_otherTags').append( $this_tag );
                        }
                    }

                    $contentSet.append( $header, $content );

                    rindow.find('div.rdr_contentPanel div.rdr_body').append( $contentSet );
                });

                RDR.actions.panel.expand("contentPanel", rindow);
            },
            viewCommentContent: function(tag, which, c_idx, rindow, node){
                var $whyBody = rindow.find('div.rdr_whyPanel div.rdr_body');
                // if ( $whyBody.data('jsp') ) $whyBody.data('jsp').destroy();
                $whyBody.empty();
                // $whyBody.empty();
                
                //todo: this function needs work pulling vars back together
                log('node')
                log(node)
                log('tag')
                log(tag)
                log(c_idx)

                //thoguht we might need this but we dont
                /*
                $.ajax({
                    url: "/api/???",
                    type: "get",
                    contentType: "application/json",
                    dataType: "jsonp",
                    data: { json: JSON.stringify(sendData) },
                    success: function(response) {

                    },
                    error: function(response) {
                        //for now, ignore error and carry on with mockup
                        console.warn('ajax error');
                        console.log(response);
                    }
                });
                */


                var comments = node.top_interactions.coms;
                var hasComments = !$.isEmptyObject(comments);

                if (hasComments) {


                    rindow.find('div.rdr_whyPanel div.rdr_header h1').html('Comments <span>('+node.counts.coms+')</span>');

                    // ok, get the content associated with this tag!
                    for ( var i in comments ) {
                        var this_comment = comments[i];
                        if( this_comment.parent == tag.name ){
                            
                            var $commentSet = $('<div class="rdr_commentSet" />'),
                                $commentBy = $('<div class="rdr_commentBy" />'),
                                $comment = $('<div class="rdr_comment" />');

                            var user_image_url = ( this_comment.user.image_url ) ? this_comment.user.image_url:'/static/images/anonymousplode.png';
                            var user_name = ( this_comment.user.first_name == "" ) ? "Anonymous" : this_comment.user.first_name + " " + this_comment.user.last_name;
                            $commentBy.html( '<img src="'+user_image_url+'" /> ' + user_name );
                            $comment.html( '<div class="rdr_comment_body">"'+this_comment.comment+'"</div>' );
                            $comment.append( '<a class="rdr_tag hover" href="javascript:void(0);"><span class="rdr_tag_share"></span><span class="rdr_tag_count">+1</span></a>' );

                            $commentSet.append( $commentBy, $comment );
                        }

                    }
                    $commentSet.append( '<hr />' );
                } else {
                    rindow.find('div.rdr_whyPanel div.rdr_header h1').html('Add a Comment');
                }

                //todo: combine this with the tooltip for the tags
                var helpText = "because..."
                var $leaveComment =  $('<div class="rdr_leave_comment" />');
                $leaveComment.append( '<strong>Leave a comment here:</strong><div class="rdr_comment"><textarea class="leaveComment">' + helpText+ '</textarea><button>Comment</button></div>' );
                $leaveComment.find('textarea').focus(function(){
                    if($('.leaveComment').val() == helpText ){
                        $('.leaveComment').val('');
                    }
                }).blur(function(){
                    if($('.leaveComment').val() == "" ){
                        $('.leaveComment').val(helpText);
                    }
                }).keyup(function(event) {
                    if (event.keyCode == '13') { //enter or comma
                        //RDR.actions.panel.expand(rindow);
                    }
                    else if (event.keyCode == '27') { //esc
                        //return false;
                    }
                });

                // $leaveComment.find('textarea').autogrow();

                $leaveComment.find('button').click(function() {
                    var comment = $leaveComment.find('textarea').val();
                    RDR.actions.comment({ comment:comment, which:which, content:node.body, tag_id:tag.id, rindow:rindow });
                });

                $whyBody.html( $commentSet );
                $whyBody.append( $leaveComment  );

                RDR.actions.panel.expand("whyPanel", rindow);
            },
			sentimentBox: function(settings) {
                
                var $hostNode = $('.rdr-'+settings.container);
                
                // draw the window over the actionbar
                var actionbarOffsets = settings.coords;

				$('.rdr_rewritable').removeClass('rdr_rewritable');

                if( settings.content_type === "text" ){
                    //Trigger the smart text selection and highlight
                    var newSel = $hostNode.selog('helpers', 'smartHilite');
                    if(!newSel) return false;

                    //temp fix to set the content (the text) of the selection to the new selection
                    //todo: make selog more integrated with the rest of the code
                    settings.content = newSel.text;

					actionbarOffsets.left = actionbarOffsets.left + 40;
					actionbarOffsets.top = actionbarOffsets.top + 35;
                
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
                            actionbarOffsets.left = strRight + 5; //with a little padding
                            actionbarOffsets.top = strBottom;
                        }
                    }

                    var kind = "text";
                } else {
                    var kind = "image";
                }
            
                var rindow = RDR.rindow.draw({
                    left:actionbarOffsets.left,
                    top:actionbarOffsets.top,
					pnlWidth:200,
                    columns:true,
					ignoreWindowEdges:"bl",
					noHeader:true
                });

                // TODO this is used to constrain the initial width of this rindow
                // and then it animates larger when we slide the whyPanel out.
                // is there a cleaner way?
                rindow.css({width:'200px'});

                // build the ratePanel

                var $sentimentBox = $('<div class="rdr_sentimentBox rdr_new rdr_reactions rdr_'+kind+'_reactions" />'),
                    $reactionPanel = $('<div class="rdr_reactionPanel rdr_sntPnl" />'),
                    $contentPanel = RDR.actions.panel.draw( "contentPanel", rindow ),
                    $whyPanel = RDR.actions.panel.draw( "whyPanel", rindow ),
                    $tagBox = $('<div class="rdr_tagBox" />').append('<ul class="rdr_tags rdr_preselected" />'),
                    $borderLine = $('<div class="rdr_borderLine" />'),
                    $commentBox = $('<div class="rdr_commentBox" />'),
                    $shareBox = $('<div class="rdr_shareBox" />');

                var headers = ["What's your reaction?", "Say More"];
                $sentimentBox.append($reactionPanel, $whyPanel); //$selectedTextPanel, 
                $sentimentBox.children().each(function(idx){
                    var $header = $('<div class="rdr_header" />').append('<div class="rdr_icon"></div><div class="rdr_headerInnerWrap"><h1>'+ headers[idx] +'</h1></div>'),
                    $body = $('<div class="rdr_body rdr_leftShadow"/>');
                    $(this).append($header, $body).css({
                        // 'width':rindow.settings.pnlWidth
                    });
                });
                RDR.actions.panel.setup("whyPanel", rindow);


                /* temp... ignore..
                        $sentimentBox.children().each(function(idx){
                                    var $header = $('<div class="rdr_header" />'),
                                    hedText = headers[idx].length > maxHeaderLen ? headers[idx].slice(0, maxHeaderLen)+"..." : headers[idx],
                                    $hedTag = $('<h1>'+ hedText +'</h1>'),
                                    $hedInner = $('<div class="rdr_headerInnerWrap" />').append($hedTag),
                                    $body = $('<div class="rdr_body rdr_leftShadow"/>');
                                    
                                    
                                    $header.append($hedInner);
                                    $(this).append($header, $body).css({
                                        // 'width':rindow.settings.pnlWidth
                                    });
                                });
                */

                //populate reactionPanel
                $reactionPanel.find('div.rdr_body').append($borderLine, $tagBox);
                
                ////populate blesed_tags
                $.each(RDR.group.blessed_tags, function(idx, val){
                    
                    var $li = $('<li class="rdr_tag_'+val.id+'" />').data({
                        'tag':{
                            content:parseInt( val.id ),
                            name:val.body
                        }
                    }),
                    $leftBox = '<div class="rdr_leftBox" />',
                    $tagText = '<div class="rdr_tagText">'+val.body+'</div>',
                    $rightBox = '<div class="rdr_rightBox" />';

                    $li.append($leftBox,$tagText,$rightBox);
                    $tagBox.children('ul.rdr_tags').append($li);

                });

                ////customTagDialogue - develop this...

                /*
                $customTagBox.append(
                '<div class="rdr_instruct">Add your own ratings, separated by comma:</div>',
                '<input type="text" class="freeformTagInput" name="unknown-tags" />',
                '<button>Rate</button>',
                '<div class="rdr_help">e.g., Love this, autumn, insightful</div>');

                $reactionPanel.append($selectedTextPanel, $blessedTagBox, $customTagBox)
                */
                // add content and animate the actionbar to accommodate it

                rindow.animate({
                    width: rindow.settings.pnlWidth +'px',
                    minHeight: rindow.settings.height +'px'
                }, rindow.settings.animTime, function() {
					$(this).css('width','auto');
                    // rindow.append($sentimentBox);
                    rindow.find('div.rdr_contentSpace').append($sentimentBox);
                    RDR.actions.sentimentPanel.addCustomTagBox({rindow:rindow, settings:settings});
                    
                    /* can remove I think:  PB, 5/1/2011
					if ( settings.content_type == "text" ) {
                       rindow.find('div.rdr_selectedTextPanel em').text( settings.content );
					} else if ( settings.content_type == "image" ) {
						rindow.find('div.rdr_selectedTextPanel em').css('text-align','center').html( '<img style="max-width:100%;max-height:600px;" src=" ' + settings.content + '" />' );
					}
                    */

                    rindow.find('ul.rdr_preselected li').bind('click', function() {
                        var $this = $(this);
                        if ( !$this.hasClass('rdr_customTagBox') ) {
                            // if ( $this.hasClass('rdr_selected') ){
                                // $this.removeClass('rdr_selected');
                            // } else {
                            $this.addClass('rdr_selected');
                            $this.siblings().removeClass('rdr_selected');
                            $this.parents('div.rdr.rdr_window').removeClass('rdr_rewritable');
                            
                            // todo don't do this?
                            // $whyPanel.find('.rdr_body').html('');

                            // show a loader...
                            RDR.actions.rateSend({ tag:$this, rindow:rindow, settings:settings });//end rateSend
                            // }
                        }
                    });

                
                });
            },
			panel: {
                draw: function(which, rindow, interaction_id) {
                    var which = (which) ? which:"whyPanel";
                    var $thisPanel = $('<div class="rdr_'+which+' rdr_sntPnl rdr_leftShadow" id="'+which+'" />');  // don't seem to need this anymore:  .prepend($('<div class="rdr_pnlShadow"/>'));
                    return $thisPanel;
                },
                setup: function(which, rindow){
                    var which = (which) ? which:"whyPanel";
                    $(rindow).find('.rdr_'+which).children('.rdr_header, .rdr_body').css({
                        'width': rindow.settings.pnlWidth +'px',
                        'right':'0',
                        'position':'absolute'
                    });
                },
                expand: function(which, rindow, interaction_id){
                    var which = (which) ? which:"whyPanel";
                    $thisPanel = $(rindow).find('.rdr_'+which);
                    var num_columns = rindow.find('div.rdr_sntPnl').length;
                    rindow.addClass('rdr_columns'+num_columns);
                    switch (which) {
                        case "contentPanel":
                            var width = 400; // any time we're expanding the contentPanel, the rindow is gonna be 400px wide
                            var minHeight = "auto";
                            break;

                        case "whyPanel":
                            var width = ((num_columns-1)*200)+250;
                            var minHeight = "280px";
                            break;
                    }
                    var rindow_bg = (num_columns==3)?-450:0;

                    //temp hack
                    if( $thisPanel.data('expanded') ){
                    }
                    else{
                        rindow.css('background-position',rindow_bg+'px');
                        rindow.animate({
                            width: width +'px'
                        }, rindow.settings.animTime, function() {
                            // rindow.find('div.rdr_body').animate({
                            //     minHeight:minHeight
                            // }, rindow.settings.animTime );
                            RDR.rindow.checkHeight( rindow, 0, which );
                        });

                        // rindow.animate({
                        //     width: width +'px'
                        // }, rindow.settings.animTime, function() {
                        //     RDR.rindow.checkHeight( rindow, 0 );
                        // } );

                    }
                    $thisPanel.data('expanded', true);
                },
                collapse: function(which, rindow){
                    var which = (which) ? which:"whyPanel";
                    $thisPanel = $(rindow).find('.rdr_'+which);
                    
                    var num_columns = rindow.find('div.rdr_sntPnl').length;
                    rindow.addClass('rdr_columns'+num_columns);
                    switch (which) {
                        case "contentPanel":
                            var width = 200;
                            var minHeight = "125px";
                            break;

                        case "whyPanel":
                            var width = ((num_columns-1)*200);
                            var minHeight = "125px";
                            break;
                    }
                    var rindow_bg = (num_columns==3)?-450:0;

                    if ( rindow.find('div.rdr_tempUserMsg').length > 0 ) {
                        rindow.height( rindow.height()-103 );
                        rindow.find('div.rdr_tempUserMsg').remove();
                    }
                    //temp hack
                    if( !$thisPanel.data('expanded') ){
                    }
                    else{
                        rindow.css('background-position',rindow_bg+'px');
                        rindow.animate({
                            width: width +'px'
                        }, rindow.settings.animTime ).animate({
                            minHeight:minHeight
                        }, rindow.settings.animTime, function() {
                            RDR.rindow.checkHeight( rindow, 0, which );
                        });
                    }
                    $thisPanel.data('expanded', false);
                },
                //todo, fix naming
                subBoxes: [],
                newSubBox: function(){
                }              
			},
            // sentimentBox can be merged with / nested under this as sentimentPanel.draw at a later time mayhaps
            sentimentPanel: {
                addCustomTagBox: function(args) {
                    var rindow = args.rindow,
                        settings = args.settings,
                        $whyPanel = RDR.actions.panel.draw( "whyPanel", rindow ),
                        $customTagBox = $('<li class="rdr_customTagBox"><div class="rdr_rightBox"></div><div class="rdr_leftBox"></div></li>'),
                        $freeformTagDiv = $('<div class="rdr_tagText"><input type="text" class="freeformTagInput" name="unknown-tags" /></div>'),
                        $freeformTagInput = $freeformTagDiv.find('input')//chain
                    .blur(function(){
                        if($('input.freeformTagInput').val() == "" ){
                            $('div.rdr_help').show();   
                        }
                    }).focus(function(){
                       $tagTooltip.hide();
                    }).keyup(function(event) {
                        if (event.keyCode == '13' ) { //enter.  removed comma...  || event.keyCode == '188'
                            $whyPanel.find('div.rdr_body').empty();
                            var tag = $(this).closest('li.rdr_customTagBox');
                            tag.data({
                            'tag':{
                                content:tag.find('input.freeformTagInput').val(),
                                name:tag.find('input.freeformTagInput').val()
                            }});
                            RDR.actions.rateSend({ tag:tag, rindow:rindow, settings:settings, callback: function() {
                                    // todo: at this point, cast the tag, THEN call this in the tag success function:
                                    RDR.actions.panel.expand("whyPanel", rindow);
                                }//end function
                            });//end rateSend
                        }
                        else if (event.keyCode == '27') { //esc
                            //return false;
                        }
                    });

                    var $tagTooltip = $('<div class="rdr_help">Add your own (ex. hip, woot)</div>');
                    $freeformTagDiv.append($tagTooltip);
                    $customTagBox.append($freeformTagDiv);

                    $customTagBox.click(function(){
                        $tagTooltip.hide();
                        $freeformTagInput.focus();
                    });

                    rindow.find('ul.rdr_tags').append( $customTagBox );
                }
            },
            rateSend: function(args) {
                // optional loader.  it's a pacman pic.
                args.tag.find('div.rdr_leftBox').html('<img src="/static/images/loader.gif" style="margin:6px 0 0 5px" />');
    
                
                //example:
                //tag:{name, id}, rindow:rindow, settings:settings, callback: 
			 	
                // tag can be an ID or a string.  if a string, we need to sanitize.
				
				// tag, rindow, settings, callback

                // TODO the args & params thing here is confusing
                RDR.session.getUser( args, function( params ) {
                    // get the text that was highlighted

                    var content = $.trim( params.settings.content ),
                        container = $.trim( params.settings.container ),
                        src_with_path = $.trim( params.settings.src_with_path );

                    var rindow = params.rindow,
                        tag_li = params.tag,
                        tag = params.tag.data('tag');


                    var sendData = {
                        "tag" : tag,
                        "hash": container,
                        "content" : content,
                        "src_with_path" : src_with_path,
                        "content_type" : params.settings.content_type,
                        "user_id" : RDR.user.user_id,
                        "readr_token" : RDR.user.readr_token,
                        "group_id" : RDR.groupPermData.group_id,
                        "page_id" : RDR.page.id
                    };

                    if ( !tag_li.hasClass('rdr_tagged') ) {
                        // send the data!
                        $.ajax({
                            url: "/api/tag/create/",
                            type: "get",
                            contentType: "application/json",
                            dataType: "jsonp",
                            data: { json: JSON.stringify(sendData) },
                            success: function(response) {
                                tag_li.find('div.rdr_leftBox').html('');
                                //[eric] - if we want these params still we need to get them from args:
                                //do we really want to chain pass these through?  Or keep them in a shared scope?

                                if ( response.status == "fail" ) {
                                    console.log('failllllllllll');
                                    if ( response.message.indexOf( "Temporary user interaction limit reached" ) != -1 ) {
                                        console.log('uh oh better login, tempy');
                                        RDR.session.showLoginPanel( args );
                                    } else {
                                        // if it failed, see if we can fix it, and if so, try this function one more time
                                        RDR.session.handleGetUserFail( response, function() {
                                            if ( !args.secondAttempt ) {
                                                args.secondAttempt = true;
                                                RDR.actions.rateSend( args );
                                            }
                                        });
                                    }
                                } else {
                                    if ( tag_li.length == 1 ) {
                                        tag_li.find('div.rdr_leftBox').unbind();
                                        tag_li.find('div.rdr_leftBox').click( function(e) {
                                            e.preventDefault();
                                            args.int_id = response.data; // add the interaction_id info in, we need it for unrateSend
                                            RDR.actions.unrateSend(args);
                                            return false; // prevent the tag call applied to the parent <li> from firing
                                        });
                                        tag_li.addClass('rdr_tagged').addClass('rdr_custom_'+response.data.id);
                                        tag_li.data('interaction_id', response.data.id);

                                        // if it was a custom tag, do a few things
                                        if ( tag_li.hasClass('rdr_customTagBox') ) {
                                            tag_li.removeClass('rdr_customTagBox');
                                            tag_li.siblings().removeClass('rdr_selected');
                                            tag_li.addClass('rdr_selected');
                                            tag_li.find('input').remove();
                                            tag_li.find('div.rdr_help').remove();
                                            tag_li.append( '<div class="rdr_tagText">'+tag.name+'</div>' );
                                            RDR.actions.sentimentPanel.addCustomTagBox({rindow:rindow, settings:params.settings});
                                        }
                                    } 
                                    RDR.actions.shareStart( {rindow:rindow, tag:tag, int_id:response.data });
                                    if ( response.data.num_interactions < RDR.group.temp_interact ) RDR.session.showTempUserMsg({ rindow: rindow, int_id:response.data });
                                    else RDR.session.showLoginPanel( args );
                                }
                            },
                            error: function(response) {
                                //for now, ignore error and carry on with mockup
                                console.warn('ajax error');
                                console.log(response);
                            }
                        });
                    } else {
                        tag_li.find('div.rdr_leftBox').html('');
                        RDR.actions.shareStart( {rindow:rindow, tag:tag, int_id:tag_li.data('interaction_id') });
                    }
                });
            },
            // I KNOW!  THIS IS TERRIBLE CODE DUPLICATION.  I DIDN'T WANT TO ABSTRACT THIS FUNCTION AND THE LAST ONE INTO ONE HANDLER. TOO IN-A-HURRY.
            rateSendLite: function(args) {

                RDR.session.getUser( args, function( params ) {
                    // get the text that was highlighted
                    var content = $.trim( params.content );
                    var container = $.trim( params.which );

                    var rindow = params.rindow,
                        element = params.element,
                        tag = params.tag;

                    var sendData = {
                        "tag" : tag,
                        "hash": container,
                        "content" : content,
                        "content_type" : "text",
                        "user_id" : RDR.user.user_id,
                        "readr_token" : RDR.user.readr_token,
                        "group_id" : RDR.groupPermData.group_id,
                        "page_id" : RDR.page.id
                    };

                    if ( !element.hasClass('rdr_tagged') ) {
                        // send the data!
                        $.ajax({
                            url: "/api/tag/create/",
                            type: "get",
                            contentType: "application/json",
                            dataType: "jsonp",
                            data: { json: JSON.stringify(sendData) },
                            success: function(response) {
                                //[eric] - if we want these params still we need to get them from args:
                                //do we really want to chain pass these through?  Or keep them in a shared scope?
                                if ( response.status == "fail" ) {
                                    console.log('failllllllllll');
                                    if ( response.message.indexOf( "Temporary user interaction limit reached" ) != -1 ) {
                                        console.log('uh oh better login, tempy');
                                        RDR.session.showLoginPanel( args );
                                    } else {
                                        // if it failed, see if we can fix it, and if so, try this function one more time
                                        RDR.session.handleGetUserFail( response, function() {
                                            if ( !args.secondAttempt ) {
                                                args.secondAttempt = true;
                                                RDR.actions.rateSend( args );
                                            }
                                        });
                                    }
                                } else {
                                    if ( element.length == 1 ) {
                                        RDR.actions.updateData( { kind:"tag", element:element, hash:container, rindow:rindow, content:content, tag:tag });

                                        if ( response.data.num_interactions < RDR.group.temp_interact ) RDR.session.showTempUserMsg({ rindow: rindow, int_id:response.data });
                                        else RDR.session.showLoginPanel( args );
                                    }
                                }
                            },
                            error: function(response) {
                                //for now, ignore error and carry on with mockup
                                console.warn('ajax error');
                                console.log(response);
                            }
                        });
                    } else {
                        // show user something to indicate they can't revote?  or to allow them to unvote?
                    }
                });
            },
            updateData: function(args) {
                if ( args.kind == "tag" ) {
                    var rindow = args.rindow,
                        hash = args.hash,
                        content = args.content
                        tag = args.tag;

                    if ( args.element ) {
                        var element_text = args.element.parent().text(); 
                        count = parseInt( element_text.substr(1, element_text.indexOf(')')+1) ) + 1;

                        var tag_text = element_text.substr(element_text.indexOf(')')+2);
                        args.element.text( '('+count+')' );
                        args.element.addClass('rdr_tagged');
                    } else {
                        
                    }

                    var headline_tag = rindow.find('div.rdr_contentPanel h1').text();
                    headline_tag = headline_tag.substr(0, headline_tag.lastIndexOf('(')-1);

                    // make sure that the tag just clicked matches the tag of the column we're in before incrementing the count in the column header
                    if ( headline_tag == tag_text ) {
                        var total_count = rindow.find('div.rdr_contentPanel h1 span').text();
                        total_count = parseInt( total_count.substr(1, total_count.length-1) ) + 1;
                        rindow.find('div.rdr_contentPanel h1 span').text('('+total_count+')');
                    }

                    var total_reactions = rindow.find('div.rdr_reactionPanel h1 span').text();
                    total_reactions = parseInt( total_reactions.substr(1, total_reactions.length-1) ) + 1;
                    rindow.find('div.rdr_reactionPanel h1 span').text('('+total_reactions+')');

                    rindow.find('div.rdr_reactionPanel ul.rdr_tags li').each( function() {
                        var $this = $(this);
                        var this_count = ( $this.data('tag').id == tag.content ) ? count : $this.data('tag').count;
                        var percentage = Math.round( ( this_count / total_reactions) * 100);
                        // this should update all of the counts
                        $this.find(' div.rdr_leftBox').text( percentage+'%' );
                    });


                    $('div.rdr_indicator').each( function() {
                        $this = $(this);
                        if ( $this.data('which') == hash ) $this.find('span.rdr_count').text(total_reactions);
                    });

                    // update the data objects too
                    for ( var i in RDR.content_nodes[hash].info.content ) {
                        if ( RDR.content_nodes[hash].info.content[i].body == content ) {
                            for ( var j in RDR.content_nodes[hash].info.content[i].tags ) {
                                if ( RDR.content_nodes[hash].info.content[i].tags[j].id == tag.content ) {
                                    RDR.content_nodes[hash].info.content[i].tags[j].count++;
                                
                                    // need to increment the .tags count, too
                                    for ( var k in RDR.content_nodes[hash].info.tags ) {
                                        if ( RDR.content_nodes[hash].info.tags[k].id == tag.content ) {
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
            unrateSend: function(args) {
                var rindow = args.rindow, 
                    tag = (args.tag.data) ? args.tag.data('tag'):args.tag,
                    int_id = args.int_id;

                var sendData = {
                    "tag" : tag,
                    "int_id" : int_id,
                    "user_id" : RDR.user.user_id,
                    "readr_token" : RDR.user.readr_token,
                    "group_id" : RDR.groupPermData.group_id,
                    "page_id" : RDR.page.id
                };

                // send the data!
                $.ajax({
                    url: "/api/tag/delete/",
                    type: "get",
                    contentType: "application/json",
                    dataType: "jsonp",
                    data: { json: JSON.stringify(sendData) },
                    success: function(response) {
                        RDR.actions.panel.collapse("whyPanel", rindow);
                        rindow.find('div.rdr_reactionPanel ul.rdr_tags li.rdr_tag_'+tag.content).removeClass('rdr_selected').removeClass('rdr_tagged');
                    },
                    error: function(response) {
                        //for now, ignore error and carry on with mockup
                        console.warn('ajax error');
                        console.log(response);
                    }
                });
                
            },
            shareStart: function(args) {
                var rindow = args.rindow, 
                    tag = args.tag,
                    int_id = args.int_id;


                //todo: for now, I'm just passing in known_tags as a param, but check with Porter about this model.
                //Where is the 'source'/'point of origin' that is the authority of known_tags - I'd think we'd want to just reference that..
                
                /*        
                var tags = "";

                for ( var i in known_tags ) {
                    if ( known_tags[i] && RDR.group.blessed_tags[ parseInt(known_tags[i])-1 ] ) {
                        tags += RDR.group.blessed_tags[ parseInt(known_tags[i])-1 ].name + ", ";
                    }
                }

                //.freeformTagInput
                if ( typeof unknown_tags != 'undefined' ) {
                    tags += unknown_tags;
                }

                tags = $.trim(tags);
                if ( tags.charAt( tags.length-1) == "," ) tags = tags.substring( 0, tags.length-1 );
                $.each(unknown_tags_arr, function(idx, val){
                   tags += (tags.length)? ", " : "";
                   tags += val;
                });
                
                */
                var $whyPanel_body = rindow.find('div.rdr_whyPanel div.rdr_body');
                $whyPanel_body.empty();

                if ( rindow.find('div.rdr_shareBox.rdr_sntPnl_padder').length == 0 || rindow.find('div.rdr_commentBox.rdr_sntPnl_padder').length == 0 ) {
                    var $yourReaction = $('<div class="rdr_tagFeedback">Your reaction to this: <strong>'+tag.name+'</strong>. </div><div class="rdr_shareBox rdr_sntPnl_padder"></div><div class="rdr_commentBox rdr_sntPnl_padder"></div>');
                    var $undoLink = $('<a style="text-decoration:underline;" href="javascript:void(0);">Undo?</a>');
                    $undoLink.bind('click.rdr', function() { RDR.actions.unrateSend(args); });
                    $yourReaction.append( $undoLink );
                    $whyPanel_body.html( $yourReaction );
                }
                var $shareDialogueBox =  rindow.find('div.rdr_shareBox.rdr_sntPnl_padder');
                var $commentBox = rindow.find('div.rdr_commentBox.rdr_sntPnl_padder');

                $commentBox.html( '<div><strong>Leave a comment about your reaction:</strong></div> <div class="rdr_commentComplete"></div>' );

                // TODO add short rdrbrd URL to end of this line, rather than the long URL
                //var url = window.location.href;
                //TODO - replace this demo version with the real shortURL
                var url = 'http://rdrbrd.com/ad4fta3';


                // TODO this eneds to behave differently for images, video
                // maybe just show short URL that leads directly to that image, video on the page
                var share_content = 'tags' + ' because...';
                //[eric] dont remove elements anymore, we're going to try adding this to the bottom of the sentimentBox'
                //[eric] -comment out: //rindow.find('ul, div, input').not('div.rdr_close').remove();

                //todo: combine this with the tooltip for the tags
                var helpText = "because..."
                var $leaveComment =  $('<div class="rdr_comment"><textarea class="leaveComment">' + helpText+ '</textarea><button id="rdr_comment_on_'+int_id.id+'">Comment</button></div>');
                $leaveComment.find('textarea').focus(function(){
                    if($('.leaveComment').val() == helpText ){
                        $('.leaveComment').val('');
                    }
                }).blur(function(){
                    if($('.leaveComment').val() == "" ){
                        $('.leaveComment').val(helpText);
                    }
                }).keyup(function(event) {
                    if (event.keyCode == '13') { //enter or comma
                        //RDR.actions.panel.expand(rindow);
                    }
                    else if (event.keyCode == '27') { //esc
                        //return false;
                    }
                });

                // $leaveComment.find('textarea').autogrow();

                $leaveComment.find('button').click(function() {
                    var comment = $leaveComment.find('textarea').val();
                    RDR.actions.comment({ comment:comment, int_id:int_id.id, rindow:rindow });
                });

                $commentBox.append( $leaveComment );

                var $socialBox = $('<div class="rdr_share_social"><strong>Share your reaction about this on:</strong></div>'),
                $shareLinks = $('<ul class="shareLinks"></ul>'),
                socialNetworks = ["facebook","twitter","tumblr","linkedin"];

                //quick mockup version of this code
                $.each(socialNetworks, function(idx, val){
                    $shareLinks.append('<li><a href="http://' +val+ '.com" ><img src="/static/images/social-icons-loose/social-icon-' +val+ '.png" /></a></li>')
                });
                $socialBox.append($shareLinks);
                // $socialBox.append('<div>herro worrd</div><div>herro worrd</div><div>herro worrd</div><div>herro worrd</div><div>herro worrd</div>');

                //TODO this is prototype code for demo.  fix it.
                $shareDialogueBox.html( $socialBox );
                

                // rindow.find('.rdr_whyPanel .rdr_body').append( $commentFeedback, $shareDialogueBox );
                
                // if ( RDR.pane2 ) {
                    // RDR.pane2.reinitialise();
                // } else {
                    // $('div.rdr_whyPanel div.rdr_body').jScrollPane({contentWidth:250, showArrows:true});
                    // RDR.pane2 = $('div.rdr_whyPanel div.rdr_body').data('jsp');
                // }

                


                // if ( rindow.width() < 450 ) {
                //     rindow.animate( {width:450}, rindow.settings.animTime, function() {
                //         $('div.rdr div.rdr_whyPanel').css('position', 'static');
                //     });
                // }

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
            comment: function(args) {
                RDR.session.getUser( args, function( params ) {
    
                    // get the text that was highlighted
                    var comment = $.trim( params.comment ),
                    int_id = params.int_id,
                    rindow = params.rindow;

                    if (!int_id) {
                        var content = params.content,
                            tag_id = params.tag_id,
                            int_id = "none";
                    } else {
                        var content = "",
                            tag_id = ""
                    }

                    var hash = (params.hash) ? params.hash:"";


                    var sendData = {
                        "int_id" : int_id,
                        "comment" : comment,
                        "content" : content,
                        "tag_id" : tag_id,
                        "hash" : hash,
                        "user_id" : RDR.user.user_id,
                        "readr_token" : RDR.user.readr_token,
                        "group_id" : RDR.groupPermData.group_id,
                        "page_id" : RDR.page.id
                    };

                    // send the data!
                    $.ajax({
                        url: "/api/comment/create/",
                        type: "get",
                        contentType: "application/json",
                        dataType: "jsonp",
                        data: { json: JSON.stringify(sendData) },
                        success: function(response) {

                            if ( response.status == "fail" ) {
                                // if it failed, see if we can fix it, and if so, try this function one more time
                                RDR.session.handleGetUserFail( response, function() {
                                    if ( !args.secondAttempt ) {
                                        args.secondAttempt = true;
                                        RDR.actions.comment( args );
                                    }
                                } );
                            } else {
                                rindow.find('div.rdr_commentBox').find('div.rdr_commentComplete').html('Thank you for your comment. You and others can now read this by clicking on the (pin) icon next to the content you commented upon.').show();
                                rindow.find('div.rdr_commentBox').find('div.rdr_tagFeedback, div.rdr_comment').hide();
                            }

                        },
                        error: function(response) {
                            //for now, ignore error and carry on with mockup
                            console.warn('ajax error');
                            console.log(response);
                        }
                    });
                });
            },
            startSelect: function(e) {
                // make a jQuery object of the node the user clicked on (at point of mouse up)
                var mouse_target = $(e.target),
				selection = {};
								
                //ec: temp blacklist filter
                if( $(mouse_target).parents().hasClass('rdr_blacklist')) return false;				

                // make sure it's not selecting inside the RDR windows.
                if ( !mouse_target.hasClass('rdr') && mouse_target.parents('div.rdr').length == 0 ) {

                    // closes undragged windows
                    $('div.rdr.rdr_window.rdr.rdr_rewritable').remove();

                    //destroy all other actionbars
                    RDR.actionbar.closeAll();

                    // see what the user selected
                    // TODO: need separate image function, which should then prevent event bubbling into this
						// ^ really?  why??
                    selection.sel = RDR.actions.selectedText();

                    //ensure something is selected and it's not just white space
                    if ( selection.sel.text && !(/^\s*$/g.test(selection.sel.text)) ) {

                        // next line's redundant, but this way we just use .content in later functions, based on itemType
                        selection.content = selection.sel.text;
                        selection.itemType = "text";
                        selection.blockParent = null;

                        // first, identify the selection's block parent (selection.blockParent)
                        if ( selection.sel.obj.css('display') != "block" ) {
                            selection.sel.obj.parents().each( function() {
                                // cache the obj... faster!
                                var aParent = $(this);
                                if ( aParent.css('display') == "block" ) {
                                    // we've found the first parent of the selected text that is block-level
                                    selection.blockParent = aParent;
                                    return false;  // exits out of a jQuery.each loop
                                }
                            });
                        } else {
                            // the node initially clicked on is the first block level container
                            selection.blockParent = selection.sel.obj;
                        }

                        // cache the blockParent's text for slightly faster processing
                        selection.blockParent.text = selection.blockParent.text();

						// does blockParent contain text that is long enough to be used here?
						if ( selection.blockParent.text && selection.blockParent.text.length > 0) {

							// is this inside a commentable-container?
							selection.container = "";
							if ( mouse_target.hasClass('rdr-hashed') ) {
								selection.container = mouse_target.data('hash');
                            } else if ( mouse_target.parents('.rdr-hashed:first').length == 1 ) {
                                selection.container = mouse_target.parents('.rdr-hashed:first').data('hash');
							}

                            // strip newlines and tabs -- and then the doublespaces that result
                            selection.blockParentTextClean = RDR.util.cleanPara ( selection.blockParent.text );
                            selection.selectionTextClean = RDR.util.cleanPara ( selection.content );

							// see if it contains the whole selection text
                            if ( selection.blockParentTextClean.indexOf( selection.selectionTextClean ) != -1 ) {
                                RDR.actionbar.draw({
                                    left:parseInt(e.pageX),
                                    top:parseInt(e.pageY)+7,
									content_type:"text",
									content:selection.content,
									container:selection.container
                                });
                            } 
                            //if not text, just ignore it.
                        }
                    }
                }
            },
            selectedText: function(win) {
                /**
			modified from Drew Dodson's code here:
			http://perplexed.co.uk/1020_text_selector_jquery_plugin.htm
			we can remove all of his comments at runtime.  this seems to run fine for me in Firefox.
			TODO: test in IE!
			*/

                var win = win ? win : window;

                var obj = null;
                var text = null;

                // Get parent element to determine the formatting applied to the selected text
                if(win.getSelection){
                    var obj = win.getSelection().anchorNode;

                    var text = win.getSelection().toString();
                    // Mozilla seems to be selecting the wrong Node, the one that comes before the selected node.
                    // I'm not sure if there's a configuration to solve this,
                    var sel = win.getSelection();

                    if(!sel.isCollapsed && $.browser.mozilla){
                    /*
					TODO:  I don't think we need this, but we need to test more and see if we need it back.
						   His code's a year old and I'm thinking Mozilla fixed the need for all this..?

					// If we've selected an element, (note: only works on Anchors, only checked bold and spans)
					// we can use the anchorOffset to find the childNode that has been selected
					if(sel.focusNode.nodeName !== '#text'){
						// Is selection spanning more than one node, then select the parent
						if((sel.focusOffset - sel.anchorOffset)>1)
							//Selected spanning more than one
							obj = sel.anchorNode;
						else if ( sel.anchorNode.childNodes[sel.anchorOffset].nodeName !== '#text' )
							//Selected non-text
							obj = sel.anchorNode.childNodes[sel.anchorOffset]
						else
							//Selected whole element
							obj = sel.anchorNode;
					}
					// if we have selected text which does not touch the boundaries of an element
					// the anchorNode and the anchorFocus will be identical
					else if( sel.anchorNode.data === sel.focusNode.data ){
						//Selected non bounding text
						obj = sel.anchorNode.parentNode;
					}
					// This is the first element, the element defined by anchorNode is non-text.
					// Therefore it is the anchorNode that we want
					else if( sel.anchorOffset === 0 && !sel.anchorNode.data ){
						//Selected whole element at start of paragraph (whereby selected element has not text e.g. &lt;script&gt;
						obj = sel.anchorNode;
					}
					// If the element is the first child of another (no text appears before it)
					else if( typeof sel.anchorNode.data !== 'undefined'
								&& sel.anchorOffset === 0
								&& sel.anchorOffset < sel.anchorNode.data.length ){
						//Selected whole element at start of paragraph
						obj = sel.anchorNode.parentNode
					}
					// If we select text preceeding an element. Then the focusNode becomes that element
					// The difference between selecting the preceeding word is that the anchorOffset is less that the anchorNode.length
					// Thus
					else if( typeof sel.anchorNode.data !== 'undefined'
								&& sel.anchorOffset < sel.anchorNode.data.length ){
						//Selected preceeding element text
						obj = sel.anchorNode.parentNode;
					}
					// Selected text which fills an element, i.e. ,.. <b>some text</b> ...
					// The focusNode becomes the suceeding node
					// The previous element length and the anchorOffset will be identical
					// And the focus Offset is greater than zero
					// So basically we are at the end of the preceeding element and have selected 0 of the current.
					else if( typeof sel.anchorNode.data !== 'undefined'
							&& sel.anchorOffset === sel.anchorNode.data.length
							&& sel.focusOffset === 0 ){
						//Selected whole element text
						obj = (sel.anchorNode.nextSibling || sel.focusNode.previousSibling);
					}
					// if the suceeding text, i.e. it bounds an element on the left
					// the anchorNode will be the preceeding element
					// the focusNode will belong to the selected text
					else if( sel.focusOffset > 0 ){
						//Selected suceeding element text
						obj = sel.focusNode.parentNode;
					}
					*/
                    }
                    else if(sel.isCollapsed) {
                        obj = obj ? (obj.parentNode ? obj.parentNode:obj) : "";
                    }

                }
                else if(win.document.selection){
                    var sel = win.document.selection.createRange();
                    var obj = sel;

                    if(sel.parentElement)
                        obj = sel.parentElement();
                    else
                        obj = sel.item(0);

                    text = sel.text || sel;

                    if(text.toString)
                        text = text.toString();
                }
                else
                    throw 'Error';

                // webkit
                if(obj.nodeName==='#text')
                    obj = obj.parentNode;

                // if the selected object has no tagName then return false.
                if(typeof obj.tagName === 'undefined')
                    return false;

                return {
                    'obj':$(obj),
                    'text':text
                };
            }
        }
    };

    return RDR;
}


//clone object function taken from http://my.opera.com/GreyWyvern/blog/show.dml/1725165


//loadScript copied from http://www.logiclabz.com/javascript/dynamically-loading-javascript-file-with-callback-event-handlers.aspx
function loadScript(sScriptSrc,callbackfunction) {
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
loadScript("/static/js/jquery-1.6.js", function(){
    //callback

    //load jQuery UI while the $ and jQuery still refers to our new version
    loadScript("/static/js/jquery-ui-1.8.6.custom.min.js", function(){
        //callback

        //test that $.ui versioning is working correctly
        
        //within this scope while the $ refers to our version of jQuery, attach it to our Global var $R at least for now, for testing later
        //todo - I don't think it really matters, but consider making this just local later
        $R = $.noConflict(true);

        //test that $.ui versioning is working correctly

        //call scripts that depend on our jQuery version to be loaded
        $RFunctions($R);

    });
});


function $RFunctions($R){
    //called after our version of jQuery is loaded


 //    //init the jquery-json plugin
 //    rdr_jqueryJSON($R);

	// //init Ben Alman's postMessage jquery plugin
	// rdr_postMessage($R);
        
 //    // scrollPane items
 //    rdr_mousewheel($R);
 //    rdr_mousewheelIntent($R);
 //    rdr_scrollPane($R);
    
 //    // init James Padolsey's autoResize plugin
 //    rdr_autogrow($R);

    //init our jquery plugins
    jQueryPlugins($R);
	
    //initiate our RDR object
    RDR = readrBoard($R);
    
    RDR.date = new Date();
    // TODO use the following line.  it creates a cachebuster that represents the current day/week/month
    // RDR.cachebuster = String( parseInt( RDR.date.getDate() / 7 )+1 )+String(RDR.date.getMonth()) + String(RDR.date.getYear()),
    RDR.cachebuster = RDR.date.getTime();

    //run init functions
    RDR.actions.init();

    //testing:
    /*
    var a = $R.evalJSON('[{"test":2}]');


    //show that objects really are unique

    $.client = "client";
    $R.rb = "rb";
    //console.log($.client)   //"client"
    //console.log($R.client)  //undefined
    //console.log($R.rb)      //"rb"
    //console.log($.rb)       //undefined
    */  //end comment out testing:

	//////////////////// TODO: TEST DATA //////////////////

    //[eric]: blessed_tags is ready to be taken from the DB, but we need to decide what the model looks like - right now it's just a charfield
	// RDR.group.blessed_tags = [
	// {
	//     name: "Great!",
	//     tid: 1
	// },
	// {
	//     name: "Hate",
	//     tid: 2
	// },
	// {
	//     name: "Interesting",
	//     tid: 3
	// },
	// {
	//     name: "Booooring",
	//     tid: 4
	// }
	// ];
}

function jQueryPlugins($R){
//All jquery plugins to be loaded using our $R version of jquery and before our widget code;
    
    // parents filter:  http://stackoverflow.com/questions/965816/what-jquery-selector-excludes-items-with-a-parent-that-matches-a-given-selector
    // doesn't seem to be working tho.
    $R.expr[':'].parents = function(a,i,m){
        return $R(a).parents(m[3]).length < 1;
    };


    (function($){
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
            if (window.console && window.console.log) {
                console.log.apply(window.console, arguments)
            }
        };
        $.fn.log = function () {
            var logArgs = arguments || this;
            $.log(logArgs);
            return this
        }

        //alias console.log to global log
        //in case client already has log defined (remove for production anyway)
        if (typeof log === "undefined"){
            log = function(){
                $.each(arguments, function(idx, val){    
                    $.log(val);
                });
            }   
        }

        //add in alias temporaily to client $ so we can use regular $ instead of $R if we want
        jQuery.log = $.log;
        jQuery.fn.log = $.fn.log;

    })($R);

    (function($){
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
    })($R);
    
    (function($){   
        /*
         * jQuery postMessage - v0.5 - 9/11/2009
         * http://benalman.com/projects/jquery-postmessage-plugin/
         * 
         * Copyright (c) 2009 "Cowboy" Ben Alman
         * Dual licensed under the MIT and GPL licenses.
         * http://benalman.com/about/license/
         */
        var g,d,j=1,a,b=this,f=!1,h="postMessage",e="addEventListener",c,i=b[h]&&!$.browser.opera;$[h]=function(k,l,m){if(!l){return}k=typeof k==="string"?k:$.param(k);m=m||parent;if(i){m[h](k,l.replace(/([^:]+:\/\/[^\/]+).*/,"$1"))}else{if(l){m.location=l.replace(/#.*$/,"")+"#"+(+new Date)+(j++)+"&"+k}}};$.receiveMessage=c=function(l,m,k){if(i){if(l){a&&c();a=function(n){if((typeof m==="string"&&n.origin!==m)||($.isFunction(m)&&m(n.origin)===f)){return f}l(n)}}if(b[e]){b[l?e:"removeEventListener"]("message",a,f)}else{b[l?"attachEvent":"detachEvent"]("onmessage",a)}}else{g&&clearInterval(g);g=null;if(l){k=typeof m==="number"?m:typeof k==="number"?k:100;g=setInterval(function(){var o=document.location.hash,n=/^#?\d+&/;if(o!==d&&n.test(o)){d=o;l({data:o.replace(n,"")})}},k)}}}
    })($R);



    (function($){   

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
                bottom = offset.top + this.outerHeight(),
                right = offset.left + this.outerWidth(),
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
    })($R);

    (function($){
        /*
         * jquery.selectionographer.js
         * $.fn.selog aliases to $.fn.selectionographer
         * author: eric@readrboard.com
         * see docs for more info /docs/selectionographer-docs.js
         *
         * to test in the live page, don't forget to use $R(), not $().
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
                selStateOrPartial = selStateOrPartial || {},
                selState;

                //only take the first container for now
                //todo: solution for multiple $objects?
                selStateOrPartial.container = selStateOrPartial.container || $this[0] || document;
                selState = _makeSelState( selStateOrPartial );
                //make sure selState didn't fail (i.e. if it was an empty range)
                if(!selState) return false;

                //push selState into stack
                selStateStack[selState.idx] = selState;
                //temp log to tempOutput    
                    var str,
                    txtLen = selState.text.length; 
                    if(txtLen <= 30){
                        str = selState.text;
                    }
                    else{
                        str = selState.text.substring(0,15)+'...'+selState.text.substring(txtLen-15,txtLen);
                    }
                    $('#rdr_tempOutput').append('<div><b>'+selState.idx+'</b>: '+str+'</div>');
                //end temp log to tempOutput
                log('saved selState ' + selState.idx + ': ' + selState.text); //selog temp logging
                return selState;
            },
            activate: function(idxOrSelState){
                var selState = _fetchselState(idxOrSelState);
                if(!selState) return false;
                methods.clear();
                _WSO().setSingleRange( selState.range );
                log('activated range selection: ')
                log(selState.range)
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
                }
                newSelState = methods.save( newSettings );
                return newSelState
            },
            hilite: function(idxOrSelState, switchOnOffToggle){
                
                // switchOnOffToggle is optional.  Expects a string 'on', 'off', or 'toggle', or defaults to 'on'
                // check if idxOrSelState is omited
                if( typeof idxOrSelState === 'string' && isNaN( parseInt(idxOrSelState) ) ){
                    switchOnOffToggle = idxOrSelState;
                    idxOrSelState = undefined;
                }
                var switchOnOffToggle = switchOnOffToggle || 'on';

                //todo:checkout why first range is picking up new selState range (not a big deal)
                var selState = _fetchselState(idxOrSelState);
                if(!selState) return false;
                
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
                return selState
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
                }

                /*
                //if a single string, make it an array.
                if (typeof strings === "string"){
                    strings = [strings];
                }
                */

                /*
                var re = [], regex, scope=this;
                $.each(strings,function(i,str){
                    if ( str == "") return;
                    str = scope.escapeRegEx(n);
                    re.push(str); 
                });
                regex = re.join("|"); //or
                regex = '(?:'+regex+')';
                */              
                
                string = RegExp.escape(string);
                console.log(string);
                regex = new RegExp(string, "gim");
                
                return $this.each(function(){
                    var text = $(this).text(),
                    match = 0,
                    check = 0, //while testing, avoid infiniteloops
                    ret = [];
                    while( (match = regex.exec(text)) && check < 5 ) {
                        log(match)
                        log(match.index)
                        log(check)
                        ret.push(match.index);
                        check++;
                    }
                    // log(this);
                    // log(text);
                    return ret;
                });
            },
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
                if (startOffset == 0) return range;
                //else 

                //NOTE: this assumes that the function and the range share the same document - change if we ever need to call between iframes.
                //create a helper object to find the word boundary
                var hlpr = {
                    range: rangy.createRange() //rangy function createRange
                }
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
                if (endOffset == 0) return range;
                //else
                
                //NOTE: this assumes that the function and the range share the same document - change if we ever need to call between iframes.
                //create a tester object to find the word boundary
                var hlpr = {
                    range: rangy.createRange() //rangy function createRange
                }
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
        _data = {
            stack: _selStateStack
        }
        
        //private functions:
        function _WSO(){
            return rangy.getSelection();  
        }
        function _makeSelState(settings){
            var scope = this,
            selStateStack = _selStateStack,
            range, serialRange,
            settings = settings || {},
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
            selState = $.extend({}, defaults, settings, overrides);

            //set properties that depend on the others already being initiated

            // if missing param or missing needed range data
            if( !selState.range && !selState.serialRange ){
                //try getting data from browser selection
                var WSO = _WSO();
                if(WSO.isCollapsed) return false;
                //else
                range = WSO.getRangeAt(0);
                //serializing relative to the parent container. The false is omitChecksum=false.
                serialRange = rangy.serializeRange(range, false, selState.container ); //see rangy function serializeRange
            }
            else if(selState.range){
                range = selState.range;
                serialRange = rangy.serializeRange(range, false, selState.container ); //see rangy function serializeRange
            }
            else if(selState.serialRange){
                serialRange = selState.serialRange;
                range = rangy.deserializeRange(serialRange, selState.container ); //see rangy function deserializeRange
            }
            selState.serialRange = serialRange;
            //todo: low: could think more about when to cloneRange to make it a tiny bit more efficient.
            selState.range = range.cloneRange();
            selState.text = selState.range.toString(); //rangy range toString function
            //check for empty selection..
            if(selState.text.length == 0) return false;
            //set hiliter - depends on idx, range, etc. being set already.
            selState.hiliter = _hiliteInit(selState);
            log('created new selState: ');
            log(selState);
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
            console.warn('selState.idx not in stack');
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
            methods.clear();
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
            methods.clear();

            if( !isActive && (switchOnOffToggle === "on" || switchOnOffToggle === "toggle" )){
                //turn on
                hiliter.applyToRange(range);
                //apply the visual styles with the generic classes
                $('.'+hiliter['class']).addClass(styleClass);
                //apply css classes to start and end so we can style those specially
                hiliter['get$start']().addClass(styleClass+'_start');
                hiliter['get$end']().addClass(styleClass+'_end');
                
                //bind an escape keypress to clear it.
                //todo: for a real public API, this should be an option, or passed in function or something
                $(document).bind('keyup.rdr', function(event) {
                    //todo: merge all esc key events (use an array of functions that we can just dequeue?)
                    if (event.keyCode == '27') { //esc
                        _hiliteSwitch(selState, 'off');
                        //remove the binding after it's been called.
                        $(document).unbind('keyup.rdr', arguments.callee);
                    }
                });

                $(document).bind('dblclick.rdr', function(event) {
                    var mouse_target = $(event.target);                                

                    if ( !$(mouse_target).parents().hasClass('rdr')) {
                        _hiliteSwitch(selState, 'off');
                        $(document).unbind('dblclick.rdr', arguments.callee);
                    }
                });

            }else if( isActive && (switchOnOffToggle === "off" || switchOnOffToggle === "toggle" )){
                //turn off
                log('removing hilite for selState ' + selState.idx + ': ' + selState.text ) //selog temp logging
                //remove the classes again so that the hiliter can normalize the selection (paste it back together)
                hiliter['get$start']().removeClass(styleClass+'_start');
                hiliter['get$end']().removeClass(styleClass+'_end');
                $('.'+hiliter['class']).removeClass(styleClass);
                
                //do one more check even though we shouldn't have to.
                if(hiliter.isAppliedToRange(range)){
                    hiliter.undoToRange(range);
                }
                else{
                    log('error ' + range)
                }
            }
            
            return selState;
        }
        function _rangeOffSet(range, opts){ 
            // returns a range or false, which should trigger the caller to fail gracefully.
            var defaults = {
                start: true, //start or end offset?
                offset: undefined, // absolute offset should be a positive or negative number to add to the offset
                relOffset: undefined // (relative offset) is ignored if offset is set
            },
            opts = $.extend({}, defaults, opts),
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
                log(e); //range out of bounds
                return false;
            }
        }
        function _filter(range, filterList){
            // I think only firefox allows for multiple ranges to be selected, and no one really does it.
            // Besides, for our tool, we'd prob have to just use the first one anyway..
            // For now, just use only the first range on the rare case where someone tries to pass more than 1. (ranges[0])
            var scope = this,
            filters = {},
            defaultFilters = _modifierFilters; //make default all filters
            //if filters not specifed, call all filters
            if ( typeof filterList === "undefined" || filterList == null ){
                filters = defaultFilters;
            }
            else{
                $.each(filterList, function(idx, val){
                    filters[val] = defaultFilters[val] || function(){console.error('bad filter name passed in param');return false};
                });
            }                    
            $.each(filters, function(){
                range = this(range);
            });
            return range;
        }

        function _tempTesting(){ 
                /*
            * testing temp function
            */
            //make $tempButtons output
            //hide for now
            var $tempButtons = $('<div id="rdr_selectionographer_tester" class="rdr_blacklist"/>'),
            buttonInfo= [
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
            ]
            $.each(buttonInfo,function(idx, val){
                var $button = $('<div class="rdr_tempButton rdr_tempButton_'+this.name+'"><a href=\"javascript:void(0);\">'+this.name+'</a><input class="input1" /></div>');
                
                $button.find('a').click(function(){
                    var result,
                    input = $(this).parent().find('input').eq(0).val();
                    contextStr = $context.find('input').val();
                    val.attr= (input == "" ) ? undefined : input;
                    if(val.name == "find"){
                        result = $(contextStr).selog(val.func, val.attr);
                    }
                    if(val.name == "hilite"){
                        input2 = $(this).parent().find('input').eq(1).val();
                        var selState = $(contextStr).selog(val.func, val.attr, input2);
                    }
                    else{
                        var selState = $(contextStr).selog(val.func, val.attr);
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

            $('body').append($tempButtons);
        }
        //end private functions

        //init selog on window.
        $(document).selog();

    })($R);

    (function($){
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
                    if ( child.nodeType === 8) return    // comment node leaf, ignore.
                    //else
                    if ( child.nodeType !== 3 )          // if not textnode, look deeper
                        return _mineParentForText(child);
                    //else
                    if ( child.nodeType === 3 )          // eureka. A textnode leaf.
                        return child
                });                
            }

            return $this.map(function(){
                return _mineParentForText(this);
            });
        }
    })($R);
    
    (function($){
        /*
         *
         *
         */
        
        //nothing to see here: starting to work on superRange plugin
        //superRange or SR.
        //this isn't being used right now - ec 

        $.fn.superRange = function(options){
            var $this = this,
            options = options || {};

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
                    hash: null,         //set below
                }, options);

                //complete superRange
                superRange = superRange._parse();
                
                //set text and hash
                //todo: fix this
                $.each(superRange.textnodes, function(idx, val){
                    superRange.text += val.data; //data is textnode's string value
                });
                superRange.hash = "make hash here.."; //todo: make hash                
            });
        }

        //private functions
        function _parse(superRange){
            // if given an explicit startRange and endRange, use those and calculate the start and end.
            // else do the inverse,

            var stepIdx = 0,
            superRange = (typeof superRange !== "undefined") ? superRange : this;
            missingSuperOffsets = ( superRange.start === null || superRange.end === null ),
            missingRanges =  ( superRange.startRange === null || superRange.endRange === null );

            if ( missingSuperOffsets && missingRanges )
                return false;
            if ( !missingSuperOffsets && !missingRanges )
                return superRange;
            if ( missingSuperOffsets && !missingRanges )
                //get start and end
                $.each(superRange.textnodes, function(idx, textnode){
                    if( textnode == superRange.startRange.node ){
                        superRange.start = stepIdx + superRange.startRange.offset
                    }
                    if( textnode == superRange.endRange.node ){
                        superRange.end = stepIdx + superRange.endRange.offset;
                    }
                    stepIdx += textnode.length;
                });
                return superRange

            if ( !missingSuperOffsets && missingRanges )
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
                        }
                    }
                    if( a > end && end < b ){
                        superRange.endRange = {
                            node: textnode,
                            //nodeIndex: idx,
                            offset: stepIdx - end     //lookbehind to get rel end index for this textnode
                        }
                    }
                    stepIdx = b;
                });
                return superRange
            //else impossible
        }
        
    })($R);

    (function($){
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
        }
    })($R);


    (function($){
        /*
         * jQuery postMessage - v0.5 - 9/11/2009
         * http://benalman.com/projects/jquery-postmessage-plugin/
         * 
         * Copyright (c) 2009 "Cowboy" Ben Alman
         * Dual licensed under the MIT and GPL licenses.
         * http://benalman.com/about/license/
         */
        var g,d,j=1,a,b=this,f=!1,h="postMessage",e="addEventListener",c,i=b[h]&&!$.browser.opera;$[h]=function(k,l,m){if(!l){return}k=typeof k==="string"?k:$.param(k);m=m||parent;if(i){m[h](k,l.replace(/([^:]+:\/\/[^\/]+).*/,"$1"))}else{if(l){m.location=l.replace(/#.*$/,"")+"#"+(+new Date)+(j++)+"&"+k}}};$.receiveMessage=c=function(l,m,k){if(i){if(l){a&&c();a=function(n){if((typeof m==="string"&&n.origin!==m)||($.isFunction(m)&&m(n.origin)===f)){return f}l(n)}}if(b[e]){b[l?e:"removeEventListener"]("message",a,f)}else{b[l?"attachEvent":"detachEvent"]("onmessage",a)}}else{g&&clearInterval(g);g=null;if(l){k=typeof m==="number"?m:typeof k==="number"?k:100;g=setInterval(function(){var o=document.location.hash,n=/^#?\d+&/;if(o!==d&&n.test(o)){d=o;l({data:o.replace(n,"")})}},k)}}}
    })($R);

    (function($){
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
                width:      $(this).width() - parseInt($this.css('paddingLeft')) - parseInt($this.css('paddingRight')),
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
                $(this).css('height', Math.max(shadow.height()-10, minHeight));
                RDR.rindow.checkHeight( $this.closest('div.rdr.rdr_window'), 80 );
            }

            $(this).change(update).keyup(update).keydown(update);
            // $(this).keydown(update);

                // update.apply(this);

            // });
            return this;
        }
    })($R);

    (function($){
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
    })($R);

    (function($){
        /**
        * jQuery mousewheelIntent
        * @author trixta
        * @version 1.2
        */
        var mwheelI={pos:[-260,-260]},minDif=3,doc=document,root=doc.documentElement,body=doc.body,longDelay,shortDelay;function unsetPos(){if(this===mwheelI.elem){mwheelI.pos=[-260,-260];mwheelI.elem=false;minDif=3;}}
        $.event.special.mwheelIntent={setup:function(){var jElm=$(this).bind('mousewheel',$.event.special.mwheelIntent.handler);if(this!==doc&&this!==root&&this!==body){jElm.bind('mouseleave',unsetPos);}
        jElm=null;return true;},teardown:function(){$(this).unbind('mousewheel',$.event.special.mwheelIntent.handler).unbind('mouseleave',unsetPos);return true;},handler:function(e,d){var pos=[e.clientX,e.clientY];if(this===mwheelI.elem||Math.abs(mwheelI.pos[0]-pos[0])>minDif||Math.abs(mwheelI.pos[1]-pos[1])>minDif){mwheelI.elem=this;mwheelI.pos=pos;minDif=250;clearTimeout(shortDelay);shortDelay=setTimeout(function(){minDif=10;},200);clearTimeout(longDelay);longDelay=setTimeout(function(){minDif=3;},1500);e=$.extend({},e,{type:'mwheelIntent'});return $.event.handle.apply(this,arguments);}}};$.fn.extend({mwheelIntent:function(fn){return fn?this.bind("mwheelIntent",fn):this.trigger("mwheelIntent");},unmwheelIntent:function(fn){return this.unbind("mwheelIntent",fn);}});$(function(){body=doc.body;$(doc).bind('mwheelIntent.mwheelIntentDefault',$.noop);});
    })($R);

    (function($){
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
        return aP==aa&&aO==I}).bind("touchend.jsp",function(aO){s=false}).bind("click.jsp-touchclick",function(aO){if(aN){aN=false;return false}})}function g(){var s=aB(),aJ=aD();D.removeClass("jspScrollable").unbind(".jsp");D.replaceWith(ap.append(Y.children()));ap.scrollTop(s);ap.scrollLeft(aJ)}b.extend(Q,{reinitialise:function(aJ){aJ=b.extend({},az,aJ);at(aJ)},scrollToElement:function(aK,aJ,s){ab(aK,aJ,s)},scrollTo:function(aK,s,aJ){N(aK,aJ);M(s,aJ)},scrollToX:function(aJ,s){N(aJ,s)},scrollToY:function(s,aJ){M(s,aJ)},scrollToPercentX:function(aJ,s){N(aJ*(T-ak),s)},scrollToPercentY:function(aJ,s){M(aJ*(Z-v),s)},scrollBy:function(aJ,s,aK){Q.scrollByX(aJ,aK);Q.scrollByY(s,aK)},scrollByX:function(s,aK){s=(s>=0)?Math.max(s,1):Math.min(s,-1);var aJ=aD()+s,aL=aJ/(T-ak);W(aL*j,aK)},scrollByY:function(s,aK){s=(s>=0)?Math.max(s,1):Math.min(s,-1);var aJ=aB()+s,aL=aJ/(Z-v);V(aL*i,aK)},positionDragX:function(s,aJ){W(s,aJ)},positionDragY:function(aJ,s){V(aJ,s)},animate:function(aJ,aM,s,aL){var aK={};aK[aM]=s;aJ.animate(aK,{duration:az.animateDuration,ease:az.animateEase,queue:false,step:aL})},getContentPositionX:function(){return aD()},getContentPositionY:function(){return aB()},getContentWidth:function(){return T},getContentHeight:function(){return Z},getPercentScrolledX:function(){return aD()/(T-ak)},getPercentScrolledY:function(){return aB()/(Z-v)},getIsScrollableH:function(){return aF},getIsScrollableV:function(){return aA},getContentPane:function(){return Y},scrollToBottom:function(s){V(i,s)},hijackInternalLinks:function(){m()},destroy:function(){g()}});at(O)}e=b.extend({},b.fn.jScrollPane.defaults,e);b.each(["mouseWheelSpeed","arrowButtonSpeed","trackClickSpeed","keyboardSpeed"],function(){e[this]=e[this]||e.speed});return this.each(function(){var f=b(this),g=f.data("jsp");if(g){g.reinitialise(e)}else{g=new d(f,e);f.data("jsp",g)}})};b.fn.jScrollPane.defaults={showArrows:false,maintainPosition:true,stickToBottom:false,stickToRight:false,clickOnTrack:true,autoReinitialise:false,autoReinitialiseDelay:500,verticalDragMinHeight:0,verticalDragMaxHeight:99999,horizontalDragMinWidth:0,horizontalDragMaxWidth:99999,contentWidth:c,animateScroll:false,animateDuration:300,animateEase:"linear",hijackInternalLinks:false,verticalGutter:4,horizontalGutter:4,mouseWheelSpeed:0,arrowButtonSpeed:0,arrowRepeatFreq:50,arrowScrollOnHover:false,trackClickSpeed:0,trackClickRepeatFreq:70,verticalArrowPositions:"split",horizontalArrowPositions:"split",enableKeyboardNavigation:true,hideFocus:false,keyboardSpeed:0,initialDelay:300,speed:30,scrollPagePercent:0.8}})($R);

}