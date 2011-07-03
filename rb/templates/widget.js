// //log($)
var jQueryVersion = "1.4.4",
RDRtimer,
RDR, //our global RDR object
$RDR, //our global $RDR object (jquerified RDR object for attaching data and queues and such)
$R = {}, //init var: our clone of jQuery
client$ = {}, //init var: clients copy of jQuery
RDR_rootPath = "http://localhost:8080"; //todo: when we get our hosting up change to readrboard.com or our CDN.
var demoRindow;
var xx;

//Our Readrboard function that builds the RDR object which gets returned into the global scope.
//This function gets called by the function $RFunctions() via the function loadScript().
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
        content_nodes: {
            //template: keep commented out
            /*
            body:"",
            location: <range>
            */
        },
        containers:{},
        groupPermData: {
            group_id : {{ group_id }},  //make group_id a string partly to make my IDE happy - getting sent as ajax anyway
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
                    coords:offsets,
					pnlWidth:200,
					panels:2,
					noHeader:true
                });
                demoRindow = rindow;
                
                var $demo = $('<div class="rdr_sentimentBox rdr_new" style="height:310px;width:358px;overflow:hidden;position:relative;" />'),
                $img = $('<img src="'+RDR_rootPath+'/static/images/demo/two_columns.png" style="display:block;position:relative;z-index:2;float:left;cursor:pointer;" />');
                $img.click( function() {
                    $(this).attr('src', RDR_rootPath+'/static/images/demo/two_columns_clicked.png');
                    $(this).unbind('click');
                    $(this).click( function() {
                        var $img_three = $('<img src="'+RDR_rootPath+'/static/images/demo/three_columns.png" style="display:block;position:relative;z-index:1;float:right;margin-top:-310px;cursor:text;" />');
                        $(this).attr('src', RDR_rootPath+'/static/images/demo/two_columns_clicked_twice.png');
                        $(this).after( $img_three );
                        //$(this).attr('src', RDR_rootPath+'/static/images/demo/two_columns_clicked_twice.png');
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
                coords:{
                    left:100,
                    top:100
                },
                pnlWidth:200,
                animTime:100,
                height:150,
                columns: false
            },
			// content comes later.  this is just to identify or draw the container.
            checkHeight: function( rindow, percentScroll, which ) {

                var tallest_column_height = 0;
                rindow.find('div.rdr_body').each( function() {
                    var $column = $(this);
                        
                    if ( $column.parents().hasClass('rdr_whyPanel') ) { var this_column_name="whyPanel"; }
                    if ( $column.parents().hasClass('rdr_contentPanel') ) { var this_column_name="contentPanel"; }
                    if ( $column.parents().hasClass('rdr_reactionPanel') ) { var this_column_name="reactionPanel"; }

                    var paneHeight = (rindow.height()-35);
                    var contentHeight = $column.height();
                    if ( contentHeight > tallest_column_height ) tallest_column_height = contentHeight;

                    if ( tallest_column_height >= 300 ) {
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
                            minHeight:tallest_column_height+"px"
                        }, rindow.settings.animTime );
                    }
                });
            },
			draw: function(options) {
                //RDR.rindow.draw:
                if ( options.selector && !options.container ) {
                    options.container = options.selector.substr(5);
                }
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

                $new_rindow.data(settings);// jquery obj of the rewritable window

                if ( options.columns == true ) $new_rindow.addClass('rdr_columns');

				if ( $new_rindow.find('h1').length == 0 ) {
                    $new_rindow.html('');
                    $new_rindow.append( '<div class="rdr_close">x</div><h1></h1><div class="rdr rdr_contentSpace"></div>' );
                    $new_rindow.find('div.rdr_close').click( function() {
                        //needed to change this to add triggers
                        RDR.rindow.close( $(this).parents('div.rdr.rdr_window') );
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
				var coords = RDR.util.stayInWindow({coords:settings.coords, height:300, ignoreWindowEdges:settings.ignoreWindowEdges});

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
            remove: function(){
                this.remove
            },
            close: function( $rindows ) {
                RDR.rindow.clearHilites( $rindows );
                $rindows.each(function(idx,rindow){
                    $(rindow).remove();
                });
            },
			closeAll: function() {
                var $allRindows = $('div.rdr.rdr_window');
				RDR.rindow.close( $allRindows );
                $('.rdr_shared').removeClass('rdr_shared');
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
                        selStates.push(selState)
                    }

                    //use "|| []"  to let $.each fail gracefully if summary.content_nodes is empty 
                    var content_nodes = summary.content_nodes || [];

                    //now add any content hilites from hover states that might be hanging around.
                    $.each( content_nodes, function(key, node){
                        var selState = node.selState;
                        if ( typeof selState !== 'undefined' ){
                            selStates.push(selState);
                        }
                    });
                });

                $.each( selStates, function(idx, selState){
                    log('selState')
                    log(selState)
                    $().selog('hilite', selState, 'off');
                });
            }
		},
		actionbar: {
			draw: function(settings) {
                
                log('settings')                
                log(settings)     
                //expand to make settings explicit
                var container = settings.container,
                    content_type = settings.content_type,
                    coords = settings.coords;
                
                //todo: change var above to something like containerHash instead of container.
                container = RDR.containers[settings.container];

                var actionbar_id = "rdr_actionbar_"+container.hash;
    			var $actionbars = $('div.rdr.rdr_actionbar');
                
				if ( $('#'+actionbar_id).length > 0 ) return $('#'+actionbar_id);
				// else 

                var top_modifier = (content_type == "image") ? -43:-35;  // todo: if IE, position higher so we're not behind IE's "Accelerator" arrow
                coords.top = (coords.top) ? (content_type == "image") ? (coords.top + top_modifier):(coords.top + top_modifier) : 100;
                coords.left = (coords.left) ? (content_type == "image") ? coords.left-34 : coords.left+2 : 100;
                
                //rewrite coords if needed
				// TODO: this probably should pass in the rindow and calculate, so that it can be done on the fly
				coords = RDR.util.stayInWindow({coords:coords, width:200, height:30, ignoreWindowEdges:settings.ignoreWindowEdges});


                // TODO use settings check for certain features and content types to determine which of these to disable
                var $new_actionbar = $('<div class="rdr rdr_actionbar" id="' + actionbar_id + '" />').css({
                   'left':coords.left,
                   'top':coords.top
                }).append('<ul/>');

				// store the content selected that spawned this actionbar
				// used for determining later on if an actionbar is being called by the same interaction as a
				// currently-visible actionbar

                // if this is an image, make sure we have the image hashed, tagged, and have its hash as a container:
                if (content_type == "image" && !container ) {
                    //changing this to warn, because image should always be hashed already.
                    //if it isn't, we shoulc do this through the hashNodes function.
                    //todo: put in call to hashNodes function here later, if this ever happens, though it shouldn't
                    console.warn('image but no container'); 
                    /*
                    var hashText = "rdr-img-"+settings.content,
                    hash = RDR.util.md5.hex_md5( hashText );
                    settings.container = hash;
                    */
                }

                // ec: I'm removing this - I think it's old and RDR.page.hash doens't exist
                //if ( settings.container == "") settings.container = RDR.page.hash;

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
                        },
                        {
                            "item":"bookmark",
                            "tipText":"Bookmark this",
                            "onclick":function(){
                                RDR.actions.sentimentBox({
                                    "container": settings.container,
                                    "content_type": settings.content_type,
                                    "content": settings.content,
                                    "coords": coords,
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
                        }              
                    },300);
                    $(this).data('timeoutCloseEvt', timeoutCloseEvt);
                });
            },
            closeAll: function(){
                var $actionbars = $('div.rdr_actionbar');
                this.close($actionbars);
            },
            show: function(callback){
                //use call or apply to set 'this'
                //not needed because $($(this)) doesn't hurt anything, but still.
                var $this = (this.jquery) ? this : $(this);
                var timeoutCollapseEvt = $(this).data('timeoutCollapseEvt');
                //each actionbar only has one timeoutCollapseEvt - if one exists, it gets reset here.
                clearTimeout(timeoutCollapseEvt);
                timeoutCollapseEvt = setTimeout(function(){
                    if( !$this.data('keepAlive.self') ){
                        
                    }
                },250)
                //in order to protect against the dreaded oscillating event loop,
                //this timeoutCollapseEvt time should be at least as long as the collspase animate time
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
            stayInWindow: function(settings) {
                
	           var rWin = $(window),
	                winWidth = rWin.width(),
	                winHeight = rWin.height(),
	                winScroll = rWin.scrollTop(),
					w = settings.width,
					h = settings.height,
					coords = settings.coords,
					ignoreWindowEdges = (settings.ignoreWindowEdges) ? settings.ignoreWindowEdges:""; // ignoreWindowEdges - check for index of t, r, b, l

                if ( ( ignoreWindowEdges.indexOf('r') == -1 ) && (coords.left+w+16) >= winWidth ) {
                    coords.left = winWidth - w - 10;
                }
                if ( ( ignoreWindowEdges.indexOf('b') == -1 ) &&  (coords.top+h) > winHeight + winScroll ) {
                    coords.top = winHeight + winScroll - h + 75;
                }
                if ( ( ignoreWindowEdges.indexOf('l') == -1 ) && coords.left < 10 ) {
					coords.left = 10;
				}
                if ( ( ignoreWindowEdges.indexOf('t') == -1 ) && coords.top - winScroll < 10 ) {
					coords.top = winScroll + 10;
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
            alertBar: {
                make: function( whichAlert, data) {
                    //whichAlert to tell us if it's the educate user bar, or the sharedLink bar
                    //data if we want it, not using it now... - expects: 
                    /*
                    data = {
                        location: "2:16\0542:90{ed6a0863}",
                        container_hash: 'c9676b4da28e1e005a1b27676e8b2847'
                    }
                    */

                    //todo: finish making these changes here:, but i didnt' want to do it before the DC demo.
                    var msg1, msg2;
                    if( whichAlert == "educateUser"){
                        msg1 = '<h1>Rate or discuss <span>anything</span> on this page!</h1>';
                        msg2 = 'Just select text or slide your mouse over an image or video, and look for the <span>pin</span> icon.';
                    }
                    if( whichAlert == "fromShareLink"){
                        //put a better message here
                        msg1 = '<h1>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Shared with <span>ReadrBoard</span></h1>';
                        msg2 = '&nbsp;&nbsp;<strong>' + data.reaction + ':</strong> <em>' + data.content.substr(0,40) + '...</em> <strong><a class="rdr_showSelection" href="javascript:void(0);">See It</a></strong>';
                    }

                    var $educateUser = $('<div id="rdr_ed_user" class="rdr" />');

                    $educateUser.append(
                        $('<div id="rdr_ed_user_1" />').append(msg1),
                        $('<div id="rdr_ed_user_2" />').append(msg2),
                        '<div id="rdr_ed_user_x">x</div>'
                    );
                                            
                    $('body').append( $educateUser );
                    $('#rdr_ed_user_x').click( function() {
                        RDR.session.educateUserClose();
                    });

                    $educateUser.find('.rdr_showSelection').click( function() {
                        //show the alertBar sliding closed for just a second before scrolling down..
                        // RDR.session.alertBar.close();
                        setTimeout(function(){
                            RDR.session.revealSharedContent(data);
                        }, 200)
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
                close: function() {
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
            revealSharedContent: function(data){
log('revealSharedContent');
dir(data);
                var $container = $('.rdr-'+data.container_hash);
                $container.addClass('rdr_shared')
                
                if ( data.location && data.location != "None" ) {
                    
                
                    var serialRange = data.location;

                    log($container)
                    if (serialRange) log(serialRange);

                    var selogStack = $().selog('stack'); //just fyi, not using it... Will be an empty stack on page load.

                    /*
                    //no need to check for existing hilites right now
                    var oldSelState = selState || null;
                    if (oldSelState){
                        $().selog('hilite',oldSelState.idx, 'off')
                    }
                    */

                    var selState = $container.selog('save', {'serialRange':serialRange} );
                    log(selState)

                    $().selog('hilite', selState, 'on')

                    /**********/
                    //todo: quick fix!  ... later attach it to a rindow to do it right.
                    //for now at least, make it so we can clear this easily.
                    $(document).bind('click.rdr', function(event) {
                        $().selog('hilite', selState, 'off');
                        $(document).unbind('dblclick.rdr', arguments.callee);
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
                windowPadding = 50,
                scrollTarget = targetOffset-windowPadding || 0;

                $('html,body').animate({scrollTop: scrollTarget}, 1000);
            },
            getSharedLinkInfo: function( data ){
                log('--------data-------------');
                dir(data);
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
			iframeHost : "http://readr.local:8080", // TODO put this in a template var
            getUser: function(args, callback) {

                if ( RDR.user && RDR.user.user_id && RDR.user.readr_token ) {
                    // we have a user id and token, be it temp or logged in user, so just run the callback
                    //todo: ec: make sure it doesn't matter for this that RDR.user.whatever can be spoofed.
                    //Does the callback give access that a fake user shouldn't have?  Call should always pass a token to be validated serverside, yeah? 

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

                        if ( message.status ) {
                            if ( message.status == "fb_logged_in" || message.status == "known_user" || message.status == "got_temp_user" ) {
                                // currently, we don't care HERE what user type it is.  we just need a user ID and token to finish the action
                                // the response of the action itself (say, tagging) will tell us if we need to message the user about temp, log in, etc

                                //dir(message.data);
                                for ( var i in message.data ) {
                                    RDR.user[ i ] = ( !isNaN( message.data[i] ) ) ? parseInt(message.data[i]):message.data[i];
                                }
                                if ( callback && args ) {
                                    args.user = RDR.user;
                                    callback(args);
                                }
                                else if ( callback ) callback();
                            } else if ( message.status == "checkSocialUser fail" ) {
                            } else if ( message.status == "already had user" ) {
                                $('#rdr-loginPanel div.rdr_body').html( '<div style="padding: 5px 0; margin:0 8px; border-top:1px solid #ccc;"><strong>Welcome!</strong> You\'re logged in.</div>' );
                            } else if ( message.status == "educate user" ) {
                                RDR.session.alertBar.make('educateUser');
                            } else if ( message.status.indexOf('sharedLink') != -1 ) {
                                log('-------message.status-----------');
                                log(message.status);
                                var sharedLink = message.status.split('|');
                                if ( sharedLink[5] ) {
                                    RDR.session.referring_int_id = parseInt( sharedLink[5] );
                                }
                                RDR.session.getSharedLinkInfo( { container_hash:sharedLink[1], location:sharedLink[2], reaction:sharedLink[3], content:sharedLink[4] } );
                            }
                        }
                    },
                    RDR.session.iframeHost
                );
            },
			login: function() {},
			showLoginPanel: function(args, callback) {
                log('--showLoginPanel---');
                $('.rdr_rewritable').removeClass('rdr_rewritable');
                $('#rdr-loginPanel').remove();
                //todo: weird, why did commenting this line out not do anything?...look into it
				//porter says: the action bar used to just animate larger and get populated as a window
                //$('div.rdr.rdr_actionbar').removeClass('rdr_actionbar').addClass('rdr_window').addClass('rdr_rewritable');
                var caller = args.rindow;
                var coords = caller.offset();
                coords.left = coords.left ? (coords.left-34) : 100;
                coords.top = coords.top ? (coords.top+50) : 100;

                // TODO: this probably should pass in the rindow and calculate, so that it can be done on the fly
                // var coords = RDR.util.stayInWindow({coords:coords, width:360, height:185 });

                var rindow = RDR.rindow.draw({
                    coords:coords,
                    id: "rdr-loginPanel",
                    pnlWidth:360,
                    pnls:1,
                    height:225
                });

                // store the arguments and callback function that were in progress when this Login panel was called
                rindow.data( 'args', args );
                rindow.data( 'callback', callback );

                // create the iframe containing the login panel
				var $loginHtml = $('<div class="rdr_login" />'),
				iframeUrl = RDR.session.iframeHost + "/fblogin/",
				parentUrl = window.location.href,
                parentHost = window.location.protocol + "//" + window.location.host;
				$loginHtml.append( '<h1>Log In</h1><div class="rdr_body" />');
				$loginHtml.find('div.rdr_body').append( '<iframe id="rdr-xdm-login" src="' + iframeUrl + '?parentUrl=' + parentUrl + '&parentHost=' + parentHost + '&group_id='+RDR.groupPermData.group_id+'&group_name='+RDR.group.name+'&cachebust='+RDR.cachebuster+'" width="360" height="190" style="overflow:hidden;" />' );
				
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
                    //dir(args);
                    var rindow = args.rindow,
                        num_interactions_left = RDR.group.temp_interact - parseInt( args.int_id.num_interactions ),
                        $tempMsgDiv = $('<div class="rdr_tempUserMsg"><span /><strong /></div>'),
                        tempMsg = 'You can react or comment <strong>' + num_interactions_left + ' more times</strong> before you must ',
                        $loginLink = $('<a href="javascript:void(0);">Connect with Facebook</a>.');

                    if ( rindow.find('div.rdr_tempUserMsg').length == 0 ){
                        log('add temp suer msg');
                        $loginLink.click( function() {
                            RDR.session.showLoginPanel( args );
                        });
                        $tempMsgDiv.find('span').html( tempMsg );
                        $tempMsgDiv.append( $loginLink );
                        rindow.append( $tempMsgDiv );
                        rindow.animate({height:(rindow.height()+103)+"px"});
                    } else {
                        log('just modify the temp user msg:' );
                        log(tempMsg);
                        rindow.find('div.rdr_tempUserMsg span').html( tempMsg );
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
                        RDR.group.selector_whitelist = RDR.group.selector_whitelist || "body p";

                        $RDR.dequeue('initAjax');
                    },
                    error: function(response) {
                        //for now, ignore error and carry on with mockup
                        console.warn('ajax error');
                        log(response);
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
                        log(response);
                    }
                });
            },
            initPageData: function(){
                // RDR.session.educateUser(); //this function has changed now
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
                        hash = RDR.util.md5.hex_md5( response.data.id );
                        log('----- page ID hashed: ' + hash );
                        if ( !RDR.containers[hash] ) {
                            RDR.containers[hash] = {};
                            RDR.containers[hash].body = response.data.id;
                            RDR.containers[hash].kind = "page";
                        }

                        makeSummaryWidget(response);
                        insertImgIcons(response);

                        RDR.page.hash = hash;

                        insertImgIcons(response);
                                                   
                        //to be normally called on success of ajax call
                        $RDR.dequeue('initAjax');
                    },
                    error: function(response) {
                        //for now, ignore error and carry on with mockup
                        console.warn('ajax error');
                        log(response);
                    }
				});

                //helper function for ajax above
                function makeSummaryWidget(response){
                    // don't forget a design for when there are no tags.
                    log('building page')
                    RDR.page = response.data;
                    log(RDR.page);
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
                                $toptags.children().last().html('See More').addClass('rdr_see_more').removeClass('rdr_tags_list_tag');
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

                        //hacked in html('') to clear it so that i can re-use this later to update the thingy.  todo: make it pretty.
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
                
                //dont know if it makes sense to return anything here like im doing now...

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

                    
				    var $this_img = $(this),
                        coords = $this_img.offset(),
                        // $(this).attr('src') will yield relative path
                        // this.src will yield absolute path
                        // for jQuery selecting ( $(img[src$='foobar.png']) ), we want the relative path
                        src = $this_img.attr('src'),
    				    src_with_path = this.src;

                    //coords clones the offset, so this ofcourse isn't moving the $this_img.
                    coords.left += 34;
                    coords.top += ( $this_img.height() + 20 );

                    
                    var container = ( $this_img.data('hash') ) ? $this_img.data('hash'):"";

                    $this_img.addClass('rdr_engage_img');

                    // builds a new actionbar or just returns the existing $actionbar if it exists.
				    var $actionbar = RDR.actionbar.draw({ coords:coords, content_type:"image", content:src, container:container, src_with_path:src_with_path, ignoreWindowEdges:"rb" });
                    $actionbar.data('keepAlive.img',true)

                    //kill all rivals!!
                    var $rivals = $('div.rdr_actionbar').not($actionbar);
                    RDR.actionbar.close( $rivals );

				    $actionbar.hover(
                        function() {
                            $actionbar.data('keepAlive.self',true);
                        },
                        function() {
                            $actionbar.data('keepAlive.self',false);
                            RDR.actionbar.closeSuggest($actionbar);
                        }
				    );

				}).live('mouseleave', function() {
                    
                    var hash = $(this).data('hash');
					var actionbar_id = "rdr_actionbar_"+hash;
                    var $actionbar = $('#'+actionbar_id);
                    $actionbar.data('keepAlive.img',false)
                    RDR.actionbar.closeSuggest($actionbar);
				});
				// END


                $(document).bind('mouseup.rdr', function(e){
                    //temp fix for bug where a click that clears a selection still picks up the selected text:
                    //Todo: This should work in the future as well, but I want to look into it further.
                    setTimeout(function(){
                        RDR.actions.startSelect(e);
                    }, 1 ); 
                    //even 0 works, so I'm not worried about 1 being too low.
                    //besides, the fail scenerio here is very minor - just that the actionbar hangs out till you click again.
                });

                $(document).bind('dblclick.rdr',function(event) {
                    var $mouse_target = $(event.target);                                

                    if ( !$mouse_target.parents().hasClass('rdr')) {
                        RDR.rindow.closeAll();
                    }

                });

                //bind an escape keypress to clear it.
                $(document).bind('keyup.rdr', function(event) {
                    if (event.keyCode == '27') { //esc
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

                //todo: make this body get picked up later.
                $imgNodes.each( function() {
                    //var body = $(this).attr('src');
                    var body = this.src;
                    $(this).data({
                        'body':body
                    });
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
                    //todo: consider putting this info directly onto the DOM node data object
                    RDR.containers[hash] = {
                        body:body,
                        kind:kind,
                        hash:hash
                    };
                    // add a CSS class to the node that will look something like "rdr-207c611a9f947ef779501580c7349d62"
                    // this makes it easy to find on the page later
                    $(this).addClass( 'rdr-' + hash ).addClass('rdr-hashed');
                    $(this).data('hash', hash); //todo: consolodate this with the RDR.containers object.  We only need one or the other.
                    
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
					pageID : RDR.page.id,
					//todo: talk to Porter about how to Model the Page Data
					hashes : md5_list
				}
    log('sendData:');
    dir(sendData);
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
                        
                        RDR.actions.summaries.save(summaries);
                        
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
                                    log(response);
                                }
                            });
                        }

                        //todo: account for newbie pins
                        RDR.actions.indicators.show();
                    },
                    error: function(response) {
                        //for now, ignore error and carry on with mockup
                        console.warn('ajax error');
                        log(response);
                    }
                });
            },
            content_node: {
                make: function(settings){
                    //RDR.actions.content_node.make:

                    //makes a new one or returns existing one
                    //expects settings with container, body, and location.

                    var content_node_key = settings.container+"-"+settings.location;
                    log(content_node_key);
                    var existingNode = RDR.content_nodes[content_node_key];
                    if( typeof existingNode !== 'undefined' ) return existingNode
                    //else
                    var content_node = {
                        'container': settings.container,
                        'body': settings.body,
                        'location': settings.location,
                        'content_type':settings.content_type
                    }
                    log(settings)
                    log(settings)

                    RDR.content_nodes[content_node_key] = content_node;
                    // log('content_node final');
                    // log(content_node);
                    return content_node;
                }
            },
            interactions: {
                rate: {
                    start: function(args){
                        var scope = this;
                        var uiMode = args.uiMode; //read or write

                        //This function requires the following args
                        /*

                        interactionButton //get styles from it.

                        "tag" : tag,
                        "hash": content_node_data.container,
                        "content" : content_node_data,
                        "content_type" : content_type,

                        "user_id" : RDR.user.user_id,
                        "readr_token" : RDR.user.readr_token,
                        "group_id" : RDR.groupPermData.group_id,
                        "page_id" : RDR.page.id
                        */

                        //expand args to make it clear what's going on.
                        var $rindow = args.rindow,
                        $tagLi = args.tag,
                        settings = args.settings;

                        
                        //settings: (ex.)
                        /*                
                            container
                                "8930c16c3df989a79fd0c163fc14aeb2"       
                            content
                                "Start Small, Go Big Contest, your chance to launch your bazillion dollar idea"
                            content_type
                                "text"
                            coords
                                Object { left=540.0833129882812, top=815.6000061035156}

                        */

                        //example:
                        //tag:{body, id}, rindow:rindow, settings:settings, callback: 
                        var uiMode = args.uiMode || 'write';
                        //Split by readMode or writeMode

                        //Do UI stuff particular to write mode
                        if (uiMode == "write"){
                            log('write mode')
                            //if tag has already been tried to be submitted, don't try again.
                            //todo: later verify on the backend and don't let user 'stuff the ballot'
                            if ( $tagLi.hasClass('rdr_tagged') ) {      
                                
                                //I think this clears the loader                          
                                $tagLi.find('div.rdr_leftBox').html('');
                                
                                //open the share/comment panel.
                                //todo:EC fix these args, and check for if the window is already open
                                RDR.actions.shareStart( {rindow:rindow, tag:tag, int_id:$tagLi.data('interaction_id'), content_node_info:content_node_data, content_type:content_type, selState:selState });
                                return;
                                //return before we get to RDR.session.getUser
                            }else{
                                // optional loader.
                                args.tag.find('div.rdr_leftBox').html('<img src="'+RDR_rootPath+'/static/images/loader.gif" style="margin:6px 0 0 5px" />');
                                validateUserAndProcceed();
                            }

                    
                        //Do UI stuff particular to read mode
                        }else if(uiMode == "read"){
                            log('read mode')
                            validateUserAndProcceed()
                            
                        }else{
                            console.warn('uiMode is not specified for interactions.rate.send')
                        }

                        //helper function called above
                        function validateUserAndProcceed(){
                            
                            log('about to call getuser')
                            //getUser and execute callback on success
                            RDR.session.getUser( args, function(params){
                                var sendData = RDR.actions.interactions.rate.prepareSendData(params);
                                params.sendData = sendData;
                                log('sendData2')
                                log(sendData)
                                RDR.actions.interactions.rate.send(params);
                                //getUser adds the user to the args object through receiveMessage,
                                //and then calls this callback function using the args object aliased here as args 
                                
                            })
                        }

                    },
                    prepareSendData: function(args){
                        //RDR.actions.interactions.rate.prepareSendData:

                        var content_type = ( args.settings) ? args.settings.content_type : 'text'; //todo: phase this out. - make it an attr of the content node 
                        
                        var rindow = args.rindow,
                            tag_li = args.tag,
                            tag = args.tag.data('tag');

                        var content_node_data = {};

                        if(content_type == 'image'){
                            var container = $.trim( args.settings.container ),
                                content = $.trim( args.settings.content ),
                                src_with_path = $.trim( args.settings.src_with_path );
                            
                            content_node_data = {
                                'container': container,
                                'body': src_with_path,
                                'content_type': content_type
                            };

                        }else{
                            //is text
                            
                            //If readmode, we will have a content_node.  If not, use content_node_data, and build a new content_node on success.
                            var content_node = args.content_node || null,
                            content_node_data,
                            selState;

                            //todo: fix this temp hackery
                            if(content_node){
                                content_node_data = {
                                    'container': rindow.data('container'),
                                    'body': content_node.body,
                                    'location': content_node.location,
                                    'content_type':content_type
                                };
                            }else{
                                selState = rindow.data('selState');
                                
                                content_node_data = {
                                    'container': rindow.data('container'),
                                    'body': selState.text,
                                    'location': selState.serialRange,
                                    'content_type': content_type
                                };
                            }
                        }
                        
     
                        var sendData = {
                            "tag" : tag,
                            "node": content_node,                        //null if writemode
                            "content_node_data":content_node_data,
                            "hash": content_node_data.container,
                            "user_id" : RDR.user.user_id,
                            "readr_token" : RDR.user.readr_token,
                            "group_id" : RDR.groupPermData.group_id,
                            "page_id" : RDR.page.id
                        };
                        return sendData;
                    },
                    send: function(args){
                        //RDR.actions.interactions.rate.send:

                        var sendData = args.sendData;
                        
                        // send the data!
                        $.ajax({
                            url: "/api/tag/create/",
                            type: "get",
                            contentType: "application/json",
                            dataType: "jsonp",
                            data: { json: JSON.stringify(sendData) },
                            success: function(response) {
                                args.response = response;
                                if ( response.status == "success" ) {
                                    RDR.actions.interactions.rate.successCallback(args);
                                }else{
                                    RDR.actions.interactions.rate.failCallback(args);
                                }
                            }
                        });                        

                    },
                    successCallback: function(args){
                        //RDR.actions.interactions.rate.successCallback:
                        var response = args.response;
                        var content_type = (args.settings) ? args.settings.content_type :  "text" ; //todo: phase this out. - make it an attr of the content node
                        var sendData = args.sendData;
                        var rindow = args.rindow,
                            tag_li = args.tag,
                            tag = args.tag.data('tag');

                        var content_node_data = sendData.content_node_data;
                        //I think this clears the loader                          
                        tag_li.find('div.rdr_leftBox').html('');


                    


                        log('successssssssssssss');
                        var $this = args.tag;
                        $this.addClass('rdr_selected');
                        $this.siblings().removeClass('rdr_selected');
                        $this.parents('div.rdr.rdr_window').removeClass('rdr_rewritable');
                        // log('content_node_data');
                        // log(content_node_data);

                        var content_node = args.content_node || RDR.actions.content_node.make(content_node_data);

                        //update indicators
                        var hash = sendData.hash;
                        var tagHelper = {
                            id: response.data.interaction.interaction_node.id,
                            body: response.data.interaction.interaction_node.body,
                            count: 1
                        };
                        var int_id = response.data.interaction.id;

                        var diff = {   
                            tags: {}
                        };
                        diff.tags[ tagHelper['id'] ] = tagHelper; //yeah?, didja get that one?  //todo: make pretty.

                        RDR.actions.indicators.update(hash, diff);
                        //end update indicators



                        if ( tag_li.length == 1 ) {
                            tag_li.find('div.rdr_leftBox').unbind();
                            tag_li.find('div.rdr_leftBox').click( function(e) {
                                e.preventDefault();
                                args.int_id = int_id; // add the interaction_id info in, we need it for unrateSend
                                RDR.actions.unrateSend(args);
                                return false; // prevent the tag call applied to the parent <li> from firing
                            });

                            tag_li.addClass('rdr_tagged').addClass('rdr_int_node_'+response.data.id);
                            tag_li.data('interaction_id', response.data.id);

                            // if it was a custom tag, do a few things
                            if ( tag_li.hasClass('rdr_customTagBox') ) {
                                tag_li.removeClass('rdr_customTagBox');
                                tag_li.siblings().removeClass('rdr_selected');
                                tag_li.addClass('rdr_selected');
                                tag_li.find('input').remove();
                                tag_li.find('div.rdr_help').remove();
                                tag_li.append( '<div class="rdr_tagText">'+tag.body+'</div>' );
                                RDR.actions.sentimentPanel.addCustomTagBox({rindow:rindow, settings:args.settings, actionType:'react'});
                            }
                        }

                        // log('-----tag------');
                        // dir(tag);
                        if ( isNaN( tag.id ) ) tag.id = response.data.tag_id;

                        RDR.actions.shareStart( {rindow:rindow, tag:tag, int_id:int_id, content_node:content_node, content_type:content_type});
                        if ( response.data.num_interactions ) {
                            if ( response.data.num_interactions < RDR.group.temp_interact ) RDR.session.showTempUserMsg({ rindow: rindow, int_id:response.data });
                            else RDR.session.showLoginPanel( args );
                        }
                    },
                    failCallback: function(args){
                        //RDR.actions.interactions.rate.failCallback:
                        var response = args.response;
                        log('failllllllllll');
                        if ( response.message.indexOf( "Temporary user interaction limit reached" ) != -1 ) {
                            log('uh oh better login, tempy 1');
                            RDR.session.showLoginPanel( args );
                        } else {
                            // if it failed, see if we can fix it, and if so, try this function one more time
                            RDR.session.handleGetUserFail( response, function() {
                                if ( !args.secondAttempt ) {
                                    args.secondAttempt = true;
                                    RDR.actions.interactions.rate.start( args );
                                }
                            });
                        }
                    }
                }
                //end RDR.actions.interactions.rate
            },
            indicators: {
                show: function(boolDontFade){
                    //fade in indicators
                    //temp hacl!
                    if(boolDontFade){
                        $('.rdr_indicator').css({
                            'opacity':'0.4',
                            'display':'inline'
                        });

                        return;
                    }
                    //else
                    $('.rdr_indicator').css({
                        'opacity':'0',
                        'display':'inline'
                    }).fadeTo('300', '0.4');
                },
                update: function(hash, diff){
                   log('update indicator');
                   return;
                    if( hash == "pageSummary" ){
                        //waaaiatt a minute... this isn't a hash.  Page level,...Ugly...todo: make not ugly
                        var summary = RDR.page.summary;
                        log('page summary')
                    }else{
                        var summary = RDR.summaries[hash];
                    }
                    //log(summary);

                    /*
                    var altSumm = RDR.summaries[hash];
                    var summary = indicator.data('summary');
                    log(altSumm)
                    log(summary)
                    */ 
                    //interaction categories and for each,
                    //a list of {id:incAmount} - incAmount will be 1 or -1 for decrement;

                    /*
                    //example for testing - keep commented out
                    var diff = {   
                        coms: {
                            
                        },
                        tags: {
                            //'id':{body, count} where count should be 1 for add a new one, or -1 for remove it.
                            '2':{
                                'body':"Tag!!",
                                'count':1
                            }
                        }
                    }
                    */

                    var interaction_count = summary.counts.interactions;
                    
                    $.each( diff, function(intActType, val){
                        // scoped to category of coms or tags
                        
                        var top_intActs_of_this_type = summary.top_interactions[intActType];
                        var counts_of_this_type = summary.counts[intActType];   //this is an integer, so can't assign by refrence.

                        $.each(val, function(id,tag){
                            //coms or tags
                            var delt = tag['count'];

                            if( typeof top_intActs_of_this_type[id] !== 'undefined' ){
                                top_intActs_of_this_type[id].count += delt;
                            }else{
                                //tag doens't exist yet:
                                //graooaooaoanan uggggggglyyyy!!! todo: fix this shit.
                                var body = tag['body'];
                                top_intActs_of_this_type[id] = {
                                    'body':body,
                                    'count': delt //this should always be 1.  Yes, this is ugly.  Should have a make tag function somewhere.
                                }

                            }

                            summary.counts[intActType] += delt;
                            summary.counts.interactions += delt;

                        });
                    });
                    /*
                    log( summary.top_interactions['tags'] )
                    log( summary.counts['tags'] )
                    log(summary.counts.interactions)
                    */

                    if( hash == "pageSummary" ){
                        //waaaiatt a minute... this isn't a hash.  Page level,...Ugly...todo: make not ugly
                        makeSummaryWidget(RDR.page)
                    }else{
                        RDR.actions.indicators.make( hash );
                        RDR.actions.indicators.show(true); //temp hack, 'true' is for 'dont fade in';

                        //now update the page.
                            //not working yet.  Page reads from a different kind of summary. 
                        //RDR.actions.indicators.update( 'pageSummary' );
                    }


                    /**********************/
                    //update html in page  

                    //this was stupid, just remake it with the same function as before RDR.actions.indicators.make( hash );

                    /*
                    var $indicator = $('#rdr_indicator_'+hash),
                    $indicator_details = $('#rdr_indicator_details_'+hash);

                    $indicator.add($indicator_details)//chain
                        .find('.rdr_count').text( summary.counts['tags'] );
                    
                    var t = $indicator_details.find('.rdr_tags_list_tag');
                    log(t)
                    */
                },
                make: function(hash){
                    //kind is optional - defaults to text
                    
                    // if ( RDR.content_nodes[i].info.com_count + RDR.content_nodes[i].info.tag_count > 0 ) {
                    //log('-- what we know about container with hash '+hash+' --');
                    //log(RDR.content_nodes[hash]);
                    var $container, $indicator, $indicator_details, some_reactions, total, info, top_tags, kind;

                    var summary = RDR.summaries[hash];
                    node = RDR.containers[hash];

                    //todo: prop down var change
                    kind = node.kind;
                    top_tags = summary.top_interactions.tags;
                    //hide indicators and indicatorDetails and show on load.

                    //todo: consider making more effecient.
                    $container = $('.rdr-'+hash); // prepend with the anno_whitelist selector
                    
                    var indicatorId = "rdr_indicator_" +hash;
                    //check for ID and remove it if it's exists - for now we're just going to recreate it.
                    //todo: optimze later:
                    $('#'+indicatorId).remove();

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
                                                
                        $indicator = $('<div class="rdr rdr_indicator rdr_image"></div>').attr( 'id', indicatorId ).hide();

                        $indicator.append(
                            '<img src="'+RDR_rootPath+'/static/images/blank.png" class="no-rdr" />',
                            '<span class="rdr_count">'+ total +' reactions: </span>'
                        );

                        summary.indicator = $indicator;
                        $indicator.data({ 'which':hash, 'imageData':imageData, 'summary':summary })//chain
                        .click( function() {
                            RDR.actions.viewContainerReactions( {icon:$indicator, kind:"image", summary:summary, hash:hash} );
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

                        $tagList = $('<div class="rdr_tags_list"></div>');  // absolute so that we can calculate content width on the fly
                        $indicator.append($tagList);

                        $this_img.after( $indicator );

                        var tagListMaxWidth = $this_img.width()-100; //subtract a bit of a margin
                        var count = 0;
                        $.each( summary.top_interactions.tags, function(hash, tag){
                            if(count == null) return; //used as a break statement
                            var prefix = count ? ", " : "", //don't include the first time
                            $tag = $('<strong />').addClass("rdr_stats_body").append(tag.body),
                            $count = $('<em/>').addClass("rdr_stats_count").append( ' ('+tag.count+')' ),
                            $span = $('<span />').addClass("rdr_stats").append($tag, $count);
                            
                            $tagList.append( prefix, $span );
                            
                            // the tag list will NOT line wrap.  if its width exceeds the with of the image, show the "click to see more" indicator
                            if ( $tagList.width() > tagListMaxWidth ) {
                                $tagList.children().last().html('...').addClass('rdr_see_more').removeClass('rdr_tags_list_tag');
                                count = null;
                            }
                            count ++;
                        });

                        return;
                    }   

                    //todo: is this a problem to use IDS here even when this is an el that we make?
                    $indicator = $('<div class="rdr_indicator" />').hide().attr('id',indicatorId).appendTo($container);
                    //log(summary);
                    summary.indicator = $('rdr_in');
                    $indicator.append(
                        '<img src="'+RDR_rootPath+'/static/images/blank.png" class="no-rdr" />',
                        '<span class="rdr_count">'+ total +'</span>'
                    )//chain
                    .data( {'which':hash} )//chain
                    .hover( 
                        function() {
                            //todo: what does this do?
                            //$( RDR.group.anno_whitelist + ".rdr-" + $(this).data('hash') ).addClass( 'rdr_highlightContainer' );
                            
                            RDR.actions.summaries.init( hash )

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
                    $indicator_details = $('<div id="rdr_indicator_details_' +hash+ '" class="rdr rdr_indicator_details rdr_text" />');
                    $indicator_details.append(
                        '<div class="rdr_statsClone" />',
                        '<span class="rdr_details"> reactions: </span>'
                    ).appendTo('#rdr_indicator_details_wrapper');                                        
                    $tagList = $('<div class="rdr_tags_list"></div>').appendTo( $indicator_details );
                    
                    var tagListMaxWidth = 200;

                    //build tags in $tagList.  Use visibility hidden instead of hide to ensure width is measured without a FOUC.
                    $indicator_details.css({ 'visiblity':'hidden' }).show();

                    var count = 0;
                    $.each( summary.top_interactions.tags, function(id, tag){
                        if(count == null) return; //used as a break statement
                        var prefix = count ? ", " : "", //don't include the first time
                        $tag = $('<strong/>').append(tag.body),
                        $count = $('<em/>').append( ' ('+tag.count+')' ),
                        $span = $('<span />').addClass('rdr_tags_list_tag').append( $tag, $count).data('id',id);
                        
                        $tagList.append( prefix, $span );

                        // the tag list will NOT line wrap.  if its width exceeds the with of the image, show the "click to see more" indicator
                        if ( $tagList.width() > tagListMaxWidth ) {
                            $tagList.children().last().html('...').addClass('rdr_see_more').removeClass('rdr_tags_list_tag');
                            count = null;
                        }
                        count ++;
                    })


                    $indicator_details.css({ 'visiblity':'visible' }).hide();

                    $indicator_details.click( function() {
                        RDR.actions.viewContainerReactions( {icon:$indicator, kind:"text", summary:summary, hash:hash} );
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
                        // dir(content);
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
                                info.tags.push({ id:tag.id, body:tag.tag, count:0, com_count:0, content:{} });
                                tag_idx = ( info.tags.length - 1 );
                            }

                            info.tags[ tag_idx ].count += tag.count;
                            if (tag.comments) info.tags[ tag_idx ].com_count += tag.comments.length;
                            info.tags[ tag_idx ].content[ j ] = { count:tag.count, tag_idx:parseInt(i) };
                            info.total_tags += tag.count;
                        };
                    };

                    //log('info.tags')
                    //log(info.tags)
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
                },
                make: {
                    tag_summary: function(){
                        //later move this code here:
                        /*

                        
                        var $tagShareButton = $('<span class="rdr_tag_share"></span>').click(function() {
                            alert(4);
                        });
                        
                        var $tagCountButton = $('<span class="rdr_tag_count">('+thisTag.count+')</span>').click( function() {
                            RDR.actions.interactions.rate.start({ tag:$this, rindow:rindow, settings:settings });
                            RDR.actions.rateSendLite({ element:$(this), tag:thisTag, rindow:rindow, content:node.body, which:which });
                        });

                        $this_tag.append($tagShareButton, $tagCountButton);
                        $content.find('div.rdr_otherTags').append( $this_tag );
                        */
                    }
                },
                init: function(hash){
                    //expects a summary object from RDR.summaries
                    var summary = RDR.summaries[hash];  
                    log(summary);

                    //don't init twice.
                    if( summary.initiated ) return;

                    //todo: I think this sorting needs be put back in
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
                            log('/api/summary/container/content/')
                            //log(content_nodes)
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
                                    console.warn('rangy error');
                                    log(err);
                                    node.selState = undefined;
                                }

                            });

                            //throw this tag summary into the container summary
                            summary.content_nodes = content_nodes;

                            //todo: put this someplace better:
                            //this doesn't need to be re-calculated every time

                            //todo: combine with other li hover function
                            //figure out which nodes belong to each tag.
                            //this is uuuuuuuuuuuuuuuuuuuuugly
                            //(ugly because I'm redundantly recalulating the same thing twice every time the read mode is activated,
                            //when really it just needs to be calulated once on load and then updated when a new interaction is made)
                            
                            var $indicatorDetails = $('#rdr_indicator_details_'+hash);
                            var nodes = content_nodes;

                            $indicatorDetails.find('span.rdr_tags_list_tag').each(function(){
                                var tag_id = $(this).data('id'),
                                $span = $(this);
                                $span.data('selStates',[]);  

                                $.each(nodes, function(id, node){
                                    var nodeTags = node.top_interactions.tags;
                                    var thisTag = nodeTags[ tag_id ];
                                    if(typeof thisTag === "undefined") return;
                                    //else                            
                                    $span.data('selStates').push(node.selState);  
                                });
                                
                                $span.hover( 
                                    function() {
                                        var selStates = $(this).data('selStates');
                                        $.each( selStates, function(idx, selState){
                                            $().selog('hilite', selState, 'on');
                                        });
                                    },
                                    function() {
                                        var selStates = $(this).data('selStates');
                                        $.each( selStates, function(idx, selState){
                                            $().selog('hilite', selState, 'off');
                                        });
                                    }
                                );

                            });

                        }
                    });

                    summary.initated = true;
                }
            },
            insertContainerIcon: function( hash ) {},
            viewContainerReactions: function( args ) {

                //todo: instead of passing args, let's try to use the same summary convention here to unify functions
                log('viewContainerReactions')
                log('args')
                log(args)
                var summary = args.summary,
                hash = args.hash,
                kind = args.kind;

                var selector = ".rdr-" + hash;

                //ec: pretty sure we don't need this anymore
                /*
                if (args.kind == "text") {
                    var info = icon.data('info');

                } else if (args.kind == "image") {
                    //todo: this is a temp fix - consolodate.
                    var info = icon.data('imageData');
                }
                */


                var indicatorCoords = args.icon.offset();

                var rindow = RDR.rindow.draw({
                    coords:indicatorCoords,
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
                topComs = summary.top_interactions.coms,
                totalTags = summary.counts.tags,
                totalComs = summary.counts.coms;

                ////populate blesed_tags
                $.each( topTags, function( tagID, tag ){
                    
                    var percentage = Math.round( ( tag.count/totalTags ) * 100);                
                    var $li = $('<li class="rdr_tag_'+tagID+'" />').data({
                        'tag':{
                            id:parseInt( tagID ),
                            body:tag.body,
                            count:tag.count
                        },
                        'which':hash
                    }),
                    $leftBox = '<div class="rdr_leftBox">'+percentage+'%</div>',
                    $tagText = '<div class="rdr_tagText">'+tag.body+'</div>',
                    $rightBox = '<div class="rdr_rightBox" />';

                    $li.append($leftBox,$tagText,$rightBox);
                    
                    // todo: [porter] i'm looping to see if there is a comment for this TAG.  can we just send this down from server?
                    for ( var i in topComs ) {
                        if ( topComs[i].tag_id == tagID ) $li.addClass('rdr_has_comment');
                    }
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

/*
                    //todo: helper function - move somewhere else:
                    function(){
                                            
                    }
*/  

                    rindow.find('ul.rdr_preselected li').each(function(){
                        var $this = $(this);
                        $this.data('selStates',[]);

                        log($this)                        
                        log($this.data() )
                        var tag_id = $this.data('tag').id;
                        
                        var nodes = summary.content_nodes || [];

                        $.each(nodes, function(id, node){
                            var nodeTags = node.top_interactions.tags;
                            var thisTag = nodeTags[ tag_id ];
                            if(typeof thisTag === "undefined") return;
                            //else                            
                            $this.data('selStates').push(node.selState);  
                        });
                        
                    })

                    .hover( 
                        function() {
                            var selStates = $(this).data('selStates');
                            $.each( selStates, function(idx, selState){
                                $().selog('hilite', selState, 'on');
                            });
                        },
                        function() {
                            var selStates = $(this).data('selStates');
                            $.each( selStates, function(idx, selState){
                                $().selog('hilite', selState, 'off');
                            });
                        }
                    );
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
                    content.push( {idx:parseInt(i), tag_idx:tag.body[i].tag_idx, count:tag.id[i].count } );
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
                var tagBody = tag.body.length > maxHeaderLen ? tag.body.slice(0, maxHeaderLen)+"..." : tag.body;
                log (tagBody);

                rindow.find('div.rdr_contentPanel div.rdr_header h1').html(tagBody+' <span> ('+tag.count+')</span>');
                if ( rindow.find('div.rdr_contentPanel div.rdr_body').data('jsp') ) rindow.find('div.rdr_contentPanel div.rdr_body').data('jsp').destroy();
                rindow.find('div.rdr_contentPanel div.rdr_body').empty();

                // tag.id = tag.id; // kludge
                var tagClone = $.extend({}, tag);

                // ok, get the content associated with this tag!
                $.each(content, function(idx, node){
                    dir(node);

                    var tag = tagClone;

                    // log('tag');
                    // dir(tag);

                    if ( node.top_interactions.tags[ tag.id ] ) {

                        var content_node_key = which+"-"+node.location;
                        // log('content_node_key')

                        //todo: pass everything through the node object- no need to expand all the attrs here in the params.
                        var $contentSet = $('<div />').addClass('rdr_contentSet').data({node:node, content_node_key:content_node_key, hash:which, location:node.location, tag:tag, content:node.body, content_type:"text"}),
                            $header = $('<div class="rdr_contentHeader rdr_leftShadow" />'),
                            $content = $('<div class="rdr_content rdr_leftShadow"><div class="rdr_otherTags"></div></div>');
                        $header.html( '<a class="rdr_tag hover" href="javascript:void(0);"><div class="rdr_tag_share"></div><span class="rdr_tag_count">('+node.counts.tags+')</span> '+tag.body+'</a>' );

                        var $tagButton = $header.find('a.rdr_tag');
                        $tagButton.data( 'tag', tag );
                        log('$tagButton.data')
                        log( $tagButton.data() )

                        $header.find('span.rdr_tag_count').click( function() {
                            var $interactionButton = $(this).closest('.rdr_tag');
                            //$interactionButton.data('test','test');
                            RDR.actions.interactions.rate.start({ tag:$interactionButton, rindow:rindow, content:node.body, which:which, uiMode:'read', content_node:node});
                        });

                        
                        var hash = $contentSet.data('hash');
                        var container = $('.rdr-'+hash);
                        var location = $contentSet.data('location');

                        $contentSet.hover(
                            function() {
                                if(node.selState){
                                    $().selog('hilite', node.selState, 'on');
                                }
                            },
                            function() {
                                if(node.selState){
                                    $().selog('hilite', node.selState, 'off');
                                }
                            }
                        );


                        // todo: [porter] i'm looping to see if there is a comment for this TAG.  can we just send this down from server?
                        for ( var i in summary.top_interactions.coms ) {
                            var node_comments = 0;
                            if ( summary.top_interactions.coms[i].content_id == node.id ) {
                                node_comments++;
                                node.top_interactions.coms.push( summary.top_interactions.coms[i] );
                            }
                        }
                        
                        if ( node_comments > 0 ) {
                            $comment = $('<div class="rdr_has_comment">' +node_comments+ '</div>');
                        } else {
                            $comment = $('<div class="rdr_can_comment">Comment</div>');
                        }

                        // $comment.data('c_idx',node.idx);
                        $comment.click( function() {
                            var $this = $(this);
                            $this.closest('.rdr_contentSet').addClass('rdr_selected').siblings().removeClass('rdr_selected');
log('---- rindow.data --------');
                            dir( rindow.data() );
                            RDR.actions.viewCommentContent( {tag:tag, which:which, rindow:rindow, node:node, selState:node.selState, content_type:"text" });
                        });

                        $header.append( $comment );

                        $content.find('div.rdr_otherTags').before( '"' + node.body + '"' );
                        var otherTags = node.top_interactions.tags;
                        if( !$.isEmptyObject(otherTags) ){
                            for ( var j in otherTags ) {
                                var thisTag = otherTags[j];
                                thisTag.id = parseInt(j);
                                if ( thisTag.body != tag.body ) {
                                    if ( $content.find('div.rdr_otherTags em').length == 0 ) $content.find('div.rdr_otherTags').append( '<em>Other Reactions</em>' );
                                    

                                    // todo should be able to remove the netx 2 lines
                                    // $this_tag.find('span.rdr_tag_count').click( function() {

                                    var $this_tag = $('<a class="rdr_tag hover" href="javascript:void(0);"></a>');
                                    var $tagShareButton = $('<div class="rdr_tag_share"></div>').click(function() {
                                        // get short uRL call
                                        var content_node_key = $(this).closest('div.rdr_contentSet').data('content_node_key');
                                        RDR.content_node[content_node_key];
                                        //log(content_node_key);
                                        //log(RDR.content_node[content_node_key]);
                                        // ({  })
                                    });
                                    var $tagCountButton = $('<span class="rdr_tag_count">('+thisTag.count+')</span>').click( function() {
                                        RDR.actions.interactions.rate.send({ tag:thisTag, rindow:rindow, content:node.body, which:which });
                                    });

                                    $this_tag.append($tagShareButton, $tagCountButton, thisTag.body);
                                    $this_tag.data('tag', thisTag);
                                    $content.find('div.rdr_otherTags').append( $this_tag );

                                }
                            }
                        }

                        $contentSet.append( $header, $content );

                        rindow.find('div.rdr_contentPanel div.rdr_body').append( $contentSet );

                        // create the Share tooltips
                        $contentSet.find( 'div.rdr_tag_share' ).mouseenter( 
                            function() {

                                var $this = $(this),
                                    $shareTip = $( '<div class="rdr rdr_share_container"><div class="rdr rdr_tooltip rdr_top"><div class="rdr rdr_tooltip-content">Share this reaction<br/>'+
                                                    '<img rel="facebook" src="/static/images/social-icons-loose/social-icon-facebook.png" class="rdr_sns no-rdr"/>'+
                                                    '<img rel="twitter" src="/static/images/social-icons-loose/social-icon-twitter.png" class="rdr_sns no-rdr"/>'+
                                                    // '<img rel="tumblr" src="/static/images/social-icons-loose/social-icon-tumblr.png" class="rdr_sns no-rdr"/>'+
                                                    // '<img rel="linkedin" src="/static/images/social-icons-loose/social-icon-linkedin.png" class="rdr_sns no-rdr"/>'+
                                                    '</div><div class="rdr rdr_tooltip-arrow-border" /><div class="rdr rdr_tooltip-arrow" /></div></div>' );
                                var share_offsets = $this.offset(),
                                    rindow_offsets = rindow.offset();
                                
                                $this.append( $shareTip );
                                $shareTip.bind('mouseleave.rdr', function(e) {
                                    $(this).remove();
                                });

                                var content_node_info = $(this).closest('div.rdr_contentSet').data();
                                var tag = $this.closest('a.rdr_tag').data('tag');
                                log('------- attempting to share -------');
                                dir(tag);
                                $shareTip.find('img.rdr_sns').click( function() {
                                    RDR.actions.share_getLink({ sns:$(this).attr('rel'), rindow:rindow, tag:tag, content_node_info:content_node_info });
                                });
                            }
                        );

                    }
                });

                RDR.actions.panel.expand("contentPanel", rindow);
            },
            viewCommentContent: function(args){
                var tag = args.tag, 
                    which = args.which, 
                    rindow = args.rindow,
                    node = args.node,
                    content_type = args.content_type || args.kind;
                    
                if ( args.selState ) var selState = args.selState;

                var $whyBody = rindow.find('div.rdr_whyPanel div.rdr_body');
                // if ( $whyBody.data('jsp') ) $whyBody.data('jsp').destroy();
                $whyBody.empty();
                // $whyBody.empty();
                
                //todo: this function needs work pulling vars back together
                // log('node')
                // dir(node)
                // log('tag')
                // dir(tag)
                // log(c_idx)

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
                        log(response);
                    }
                });
                */


                var comments = node.top_interactions.coms;
                var hasComments = !$.isEmptyObject(comments);

                if (hasComments) {


                    rindow.find('div.rdr_whyPanel div.rdr_header h1').html('Comments <span>('+comments.length+')</span>');

                    // ok, get the content associated with this tag!
                    for ( var i in comments ) {
                        var this_comment = comments[i];
                        if( this_comment.tag_id == tag.id ){
                            
                            var $commentSet = $('<div class="rdr_commentSet" />'),
                                $commentBy = $('<div class="rdr_commentBy" />'),
                                $comment = $('<div class="rdr_comment" />');

                            var user_image_url = ( this_comment.user.social_user.img_url ) ? this_comment.user.social_user.img_url: RDR_rootPath+'/static/images/anonymousplode.png';
                            var user_name = ( this_comment.user.first_name == "" ) ? "Anonymous" : this_comment.user.first_name + " " + this_comment.user.last_name;
                            $commentBy.html( '<img src="'+user_image_url+'" /> ' + user_name );
                            $comment.html( '<div class="rdr_comment_body">"'+this_comment.body+'"</div>' );

                            // var $this_tag = $('<a class="rdr_tag hover" href="javascript:void(0);">'+thisTag.body+'</a>');
                            
                            // var $tagShareButton = $('<span class="rdr_tag_share"></span>').click(function() {
                            //     alert(4);
                            // });
                            
                            // var $tagCountButton = $('<span class="rdr_tag_count">('+thisTag.count+')</span>').click( function() {
                            //     RDR.actions.rateSendLite({ element:$(this), tag:thisTag, rindow:rindow, content:node.body, which:which });
                            // });

                            // $this_tag.append($tagShareButton, $tagCountButton);
                            // $content.find('div.rdr_otherTags').append( $this_tag );
                            $commentSet.append( $commentBy, $comment );

                        }

                    }
                    if ( $commentSet ) $commentSet.append( '<hr />' );
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
                    log('--------- selState 1: '+selState);
                    RDR.actions.comment({ content_node:node, comment:comment, which:which, content:node.body, tag:tag, rindow:rindow, selState:selState});
                });

                if ( $commentSet ) $whyBody.html( $commentSet );
                $whyBody.append( $leaveComment  );

                RDR.actions.panel.expand("whyPanel", rindow);
            },
			sentimentBox: function(settings) {
             log('sentimentBox settings: ');
             dir(settings);
                //settings:
                /*
                {
                    container,   
                    content,
                    content_type,
                    coords
                }
                */
                // log('----- CONTAINER: ' + settings.container);
                var $hostNode = $('.rdr-'+settings.container);

                var actionType = (settings.actionType) ? settings.actionType:"react";

                // draw the window over the actionbar
                var actionbarOffsets = settings.coords;
                var rindowCoords =  $.extend({}, actionbarOffsets);

				$('.rdr_rewritable').removeClass('rdr_rewritable');

                if( settings.content_type === "text" ){
                    //Trigger the smart text selection and highlight
                    var newSel = $hostNode.selog('helpers', 'smartHilite');
                    if(!newSel) return false;

                    //temp fix to set the content (the text) of the selection to the new selection
                    //todo: make selog more integrated with the rest of the code
                    settings.content = newSel.text;

					rindowCoords.left = actionbarOffsets.left + 40;
					rindowCoords.top = actionbarOffsets.top + 35;
                
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
                            rindowCoords.left = strRight + 5; //with a little padding
                            rindowCoords.top = strBottom;
                        }
                    }

                } else {
                    var kind = "image";
                    var newSel = "";
                }
            
                var rindow = RDR.rindow.draw({
                    coords: rindowCoords,
					pnlWidth:200,
                    columns:true,
					ignoreWindowEdges:"bl",
					noHeader:true,
                    container: settings.container,
                    content: settings.content,
                    content_type: settings.content_type,
                    selState: newSel
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

                var firstPanelHeader = (actionType == "react") ? "What's your reaction?":"Bookmark this";
                var headers = [firstPanelHeader, "Say More"];
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
                if (actionType == "react") {
                    $.each(RDR.group.blessed_tags, function(idx, val){
                        
                        var $li = $('<li class="rdr_tag_'+val.id+'" />').data({
                            'tag':{
                                id:parseInt( val.id ),
                                body:val.body
                            }
                        }),
                        $leftBox = '<div class="rdr_leftBox" />',
                        $tagText = '<div class="rdr_tagText">'+val.body+'</div>',
                        $rightBox = '<div class="rdr_rightBox" />';

                        $li.append($leftBox,$tagText,$rightBox);
                        $tagBox.children('ul.rdr_tags').append($li);

                    });
                }

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
                    RDR.actions.sentimentPanel.addCustomTagBox({rindow:rindow, settings:settings, actionType:actionType});
                    
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
                            // todo don't do this?
                            // $whyPanel.find('.rdr_body').html('');

                            if (actionType == "react") {
                                RDR.actions.interactions.rate.start({ tag:$this, rindow:rindow, settings:settings });
                            } else {
                                RDR.actions.bookmarkStart({ tag:$this, rindow:rindow, settings:settings, actionType:"bookmark" });
                            }
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
                        RDR.rindow.checkHeight( rindow, 0, which );
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
                    log('addCustomTagBox args: ');
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
                                body:tag.find('input.freeformTagInput').val()
                            }});
                            if ( args.actionType == "react") {
                                RDR.actions.interactions.rate.start({ tag:tag, rindow:rindow, settings:settings, callback: function() {
                                        // todo: at this point, cast the tag, THEN call this in the tag success function:
                                        RDR.actions.panel.expand("whyPanel", rindow);
                                    }//end function
                                });//end rateSend
                            } else if ( args.actionType == "bookmark" ) {
                                RDR.actions.bookmarkSend({ tag:tag, rindow:rindow, settings:settings, callback: function() {
                                        // todo: at this point, cast the tag, THEN call this in the tag success function:
                                        RDR.actions.panel.expand("whyPanel", rindow);
                                    }//end function
                                });
                            }
                        }
                        else if (event.keyCode == '27') { //esc
                            //return false;
                        }
                    });

                    var $tagTooltip = (args.actionType == "react") ? $('<div class="rdr_help">Add your own (ex. hip, woot)</div>'):$('<div class="rdr_help">Add a tag</div>');
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
                //nothing to see here - this has been moved to RDR.actions.interactions.rate.send
            },
            bookmarkSend: function(args) {
                // optional loader.
                args.tag.find('div.rdr_leftBox').html('<img src="'+RDR_rootPath+'/static/images/loader.gif" style="margin:6px 0 0 5px" />');
        
                //example:
                //tag:{body, id}, rindow:rindow, settings:settings, callback: 
                
                // tag can be an ID or a string.  if a string, we need to sanitize.
                
                // tag, rindow, settings, callback

                // TODO the args & params thing here is confusing
                RDR.session.getUser( args, function( params ) {
                    // get the text that was highlighted
                    // log('params')
                    // log(params)

                    var content_type = params.settings.content_type;
                    
                    var rindow = params.rindow,
                        tag_li = params.tag,
                        tag = params.tag.data('tag');

                    var content_node_data = {};

                    if(content_type == 'image'){
                        var container = $.trim( params.settings.container ),
                            content = $.trim( params.settings.content ),
                            src_with_path = $.trim( params.settings.src_with_path );
                        
                        content_node_data = {
                            'container': container,
                            'body': src_with_path,
                            'content_type': content_type
                        };

                    }else{
                        //is text


                        //save content node
                        var selState = rindow.data('selState') || null;
                        
                        content_node_data = {
                            'container': rindow.data('container'),
                            'body': selState.text,
                            'location': selState.serialRange,
                            'content_type': content_type
                        };
                        
                    }
                    
 
                    var sendData = {
                        "tag" : tag,
                        "hash": content_node_data.container,
                        "content_node_data" : content_node_data,
                        "user_id" : RDR.user.user_id,
                        "readr_token" : RDR.user.readr_token,
                        "group_id" : RDR.groupPermData.group_id,
                        "page_id" : RDR.page.id
                    };


                    if ( !tag_li.hasClass('rdr_tagged') ) {
                        // send the data!
                        $.ajax({
                            url: "/api/bookmark/create/",
                            type: "get",
                            contentType: "application/json",
                            dataType: "jsonp",
                            data: { json: JSON.stringify(sendData) },
                            success: function(response) {
                                tag_li.find('div.rdr_leftBox').html('');
                                //[eric] - if we want these params still we need to get them from args:
                                //do we really want to chain pass these through?  Or keep them in a shared scope?

                                if ( response.status == "fail" ) {
                                    log('failllllllllll');
                                    if ( response.message.indexOf( "Temporary user interaction limit reached" ) != -1 ) {
                                        log('uh oh better login, tempy 1');
                                        RDR.session.showLoginPanel( args );
                                    } else {
                                        // if it failed, see if we can fix it, and if so, try this function one more time
                                        RDR.session.handleGetUserFail( response, function() {
                                            if ( !args.secondAttempt ) {
                                                args.secondAttempt = true;
                                                RDR.actions.interactions.rate.start( args );
                                            }
                                        });
                                    }
                                } else {
                                    log('successssssssssssss');
                                    var $this = params.tag;
                                    $this.addClass('rdr_selected');
                                    $this.siblings().removeClass('rdr_selected');
                                    $this.parents('div.rdr.rdr_window').removeClass('rdr_rewritable');
                                    // log('content_node_data');
                                    // log(content_node_data);
                                    var content_node = RDR.actions.content_node.make(content_node_data);

                                    //update indicators
                                    var hash = sendData.hash;
                                    var tagHelper = {
                                        id: response.data.interaction.interaction_node.id,
                                        body: response.data.interaction.interaction_node.body,
                                        count: 1
                                    };
                                    var int_id = response.data.interaction.id;

                                    var diff = {   
                                        tags: {}
                                    };
                                    diff.tags[ tagHelper['id'] ] = tagHelper; //yeah?, didja get that one?  //todo: make pretty.

                                    // log('hash')
                                    // log(hash)
                                    // log('diff')
                                    // log(diff)
                                    RDR.actions.indicators.update(hash, diff);
                                    //end update indicators
                                    // log('here here')

                                    if ( tag_li.length == 1 ) {
                                        tag_li.find('div.rdr_leftBox').unbind();
                                        tag_li.find('div.rdr_leftBox').click( function(e) {
                                            e.preventDefault();
                                            args.int_id = int_id; // add the interaction_id info in, we need it for unrateSend
                                            RDR.actions.unrateSend(args);
                                            return false; // prevent the tag call applied to the parent <li> from firing
                                        });
                                        tag_li.addClass('rdr_tagged').addClass('rdr_int_node_'+response.data.id);
                                        tag_li.data('interaction_id', response.data.id);

                                        // if it was a custom tag, do a few things
                                        if ( tag_li.hasClass('rdr_customTagBox') ) {
                                            tag_li.removeClass('rdr_customTagBox');
                                            tag_li.siblings().removeClass('rdr_selected');
                                            tag_li.addClass('rdr_selected');
                                            tag_li.find('input').remove();
                                            tag_li.find('div.rdr_help').remove();
                                            tag_li.append( '<div class="rdr_tagText">'+tag.body+'</div>' );
                                            RDR.actions.sentimentPanel.addCustomTagBox({rindow:rindow, settings:params.settings, actionType:'bookmark'});
                                        }
                                    }
                                    // log('-----tag------');
                                    // dir(tag);
                                    if ( isNaN( tag.id ) ) tag.id = response.data.tag_id;
                                    RDR.actions.shareStart( {rindow:rindow, tag:tag, int_id:int_id, content_node_info:content_node_data, content_type:content_type, selState:selState });
                                    if ( response.data.num_interactions ) {
                                        if ( response.data.num_interactions < RDR.group.temp_interact ) RDR.session.showTempUserMsg({ rindow: rindow, int_id:response.data });
                                        else RDR.session.showLoginPanel( args );
                                    }
                                }
                            },
                            error: function(response) {
                                //for now, ignore error and carry on with mockup
                                console.warn('ajax error');
                                log(response);
                            }
                        });
                    } else {
                        tag_li.find('div.rdr_leftBox').html('');
                        RDR.actions.shareStart( {rindow:rindow, tag:tag, int_id:tag_li.data('interaction_id'), content_node_info:content_node_data, content_type:content_type, selState:selState });
                    }
                });
            },
            share_getLink: function(args) {
                log('----share_getLink args----');
                dir(args);
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
                        content_node_info = params.content_node_info,
                        tag = params.tag;

                    // //save content node
                    // log('rindow');
                    // log(rindow);
                    // log(rindow.data('selState'));
                    // var selState = rindow.data('selState');
 
                    var content_node_data = {
                        'container': rindow.settings.container,
                        'body': content_node_info.content,
                        'location': content_node_info.location,
                        'content_type':content_node_info.content_type
                    }    
                    // dir(content_node_data);
                    var content_node = RDR.actions.content_node.make(content_node_data);


                    var sendData = {
                        "tag" : tag,
                        "hash": content_node_info.hash,
                        "content_node_data" : content_node_data,
                        "user_id" : RDR.user.user_id,
                        "readr_token" : RDR.user.readr_token,
                        "group_id" : RDR.groupPermData.group_id,
                        "page_id" : RDR.page.id,
                        "referring_int_id" : RDR.session.referring_int_id
                    };

                    // if ( !tag_li.hasClass('rdr_tagged') ) {
                        // send the data!
                        $.ajax({
                            url: "/api/share/",
                            type: "get",
                            contentType: "application/json",
                            dataType: "jsonp",
                            data: { json: JSON.stringify(sendData) },
                            success: function(response) {
                                log('---- share URL response -----');
                                dir(response);

                                // todo cache the short url
                                // RDR.summaries[content_node_info.hash].content_nodes[IDX].top_interactions.tags[tag.id].short_url = ;


                                if ( response.status == "fail" ) {
                                    log('failllllllllll');
                                    if ( response.message.indexOf( "Temporary user interaction limit reached" ) != -1 ) {
                                        log('uh oh better login, tempy 3');
                                        RDR.session.showLoginPanel( args );
                                    } else {
                                        // if it failed, see if we can fix it, and if so, try this function one more time
                                        RDR.session.handleGetUserFail( response, function() {
                                            if ( !args.secondAttempt ) {
                                                args.secondAttempt = true;
                                                RDR.actions.share_getLink( args );
                                            }
                                        });
                                    }
                                } else {

                                    //successfully got a short URL
                                    RDR.actions.shareContent({ sns:params.sns, content:content_node_info.content, short_url:response.data.short_url, reaction:tag.body });

                                    if ( response.data.num_interactions < RDR.group.temp_interact ) RDR.session.showTempUserMsg({ rindow: rindow, int_id:response.data });
                                    else RDR.session.showLoginPanel( args );
                                }
                            },
                            error: function(response) {
                                //for now, ignore error and carry on with mockup
                                console.warn('ajax error');
                                log(response);
                            }
                        });
                });
            },
            shareContent: function(args) {
                switch (args.sns) {
                    case "facebook":
                        window.open('http://www.facebook.com/sharer.php?s=100&p[title]="'+args.content+'"&p[summary]=hilarious&p[url]='+args.short_url,"readr_share_fb","menubar=1,resizable=1,width=626,height=436");
                    //&p[images][0]=<?php echo $image;?>', 'sharer',
                    break;

                    case "twitter":
                        var content_length = ( 90 - args.reaction.length );
                        window.open('http://twitter.com/intent/tweet?url='+args.short_url+'&via='+RDR.group.twitter+'&text='+escape(args.reaction)+':+"'+escape(args.content.substr(0, content_length) )+'"',"readr_share_tw","menubar=1,resizable=1,width=626,height=436");
                    break;

                    case "tumblr":
                    /*
                    http://www.tumblr.com/share/quote?quote=53%20percent%20of%20Americans%20now%20support%20gay%20marriage.%20Which%20means%20that%2047%25%20of%20the%20country%20are%20still%20assholes.&source=Bill%20Maher

                    http://www.tumblr.com/share/photo?source=http%3A%2F%2Ffarm6.static.flickr.com%2F5030%2F5601726196_08725e1979_z.jpg&caption=%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20This%20example%20uses%20the%20basic%20Tumblr%20Button%20in%20the%20article%27s%20footer%20to%20let%20Tumblr%20users%20easily%20promote%20this%20article%20on%20their%20blogs.%0A%20%20%20%20%20%20%20%20%20%20%20%20&click_thru=http%3A%2F%2Fwww.flickr.com%2Fphotos%2Fjfisher%2F5601726196

                    http://www.tumblr.com/share/video?embed=%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Ciframe%20src%3D%22http%3A%2F%2Fwww.youtube.com%2Fembed%2FtxqiwrbYGrs%22%20title%3D%22YouTube%20video%20player%22%20allowfullscreen%3D%22%22%20frameborder%3D%220%22%20height%3D%22480%22%20width%3D%22600%22%3E%3C%2Fiframe%3E%0A%20%20%20%20%20%20%20%20&caption=%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20This%20example%20uses%20the%20basic%20Tumblr%20Button%20in%20the%20article%27s%20footer%20to%20let%20Tumblr%20users%20easily%20promote%20this%20article%20on%20their%20blogs.%0A
                    */
                    break;

                    case "linkedin":
                    break;
                }
            },
            updateData: function(args) {
                if ( args.kind == "tag" ) {
                    var rindow = args.rindow,
                        hash = args.hash,
                        content = args.content,
                        tag = args.tag,
                        range = args.range;

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
                        var this_count = ( $this.data('tag').id == tag.id ) ? count : $this.data('tag').count;
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
                        rindow.find('div.rdr_reactionPanel ul.rdr_tags li.rdr_int_node_'+int_id).removeClass('rdr_selected').removeClass('rdr_tagged').removeClass('rdr_int_node_'+int_id);
                    },
                    error: function(response) {
                        //for now, ignore error and carry on with mockup
                        console.warn('ajax error');
                        log(response);
                    }
                });
                
            },
            shareStart: function(args) {
                log('--- shareStarting ---');
                dir(args);
                var rindow = args.rindow, 
                    tag = args.tag,
                    int_id = args.int_id,
                    content_node = args.content_node;

                //todo: for now, I'm just passing in known_tags as a param, but check with Porter about this model.
                //Where is the 'source'/'point of origin' that is the authority of known_tags - I'd think we'd want to just reference that..
                
                /*        
                var tags = "";

                for ( var i in known_tags ) {
                    if ( known_tags[i] && RDR.group.blessed_tags[ parseInt(known_tags[i])-1 ] ) {
                        tags += RDR.group.blessed_tags[ parseInt(known_tags[i])-1 ].body + ", ";
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
                    var $yourReaction = $('<div class="rdr_tagFeedback">Your reaction to this: <strong>'+tag.body+'</strong>. </div><div class="rdr_shareBox rdr_sntPnl_padder"></div><div class="rdr_commentBox rdr_sntPnl_padder"></div>');
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
                    log('--------- selState 2: '+content_node.selState);
                    RDR.actions.comment({ content_node:content_node, comment:comment, int_id:int_id, rindow:rindow, selState:content_node.selState });
                });

                $commentBox.append( $leaveComment );

                var $socialBox = $('<div class="rdr_share_social"><strong>Share your reaction about this on:</strong></div>'),
                $shareLinks = $('<ul class="shareLinks"></ul>'),
                socialNetworks = ["facebook","twitter"]; //,"tumblr","linkedin"];

                //quick mockup version of this code
                $.each(socialNetworks, function(idx, val){
                    $shareLinks.append('<li><a href="http://' +val+ '.com" ><img src="'+RDR_rootPath+'/static/images/social-icons-loose/social-icon-' +val+ '.png" /></a></li>')
                    $shareLinks.find('li:last').click( function() {
                        
                        /*
                        "content":
                        {
                            "container":"a470d537885a6de414a8269d3e64c905",
                            "body":"Singing in the shower is for amateurs.",
                            "location":"3:0,3:38"
                        }


                        content
                        "Mail a pump-up dessert ...zarre desk accessories."
                        
                        content_node_key
                        "f15c82d27b6479793ddee2a6fb14ee6e-3:96,3:170"
                        
                        content_type
                        "text"
                        
                        hash
                        "f15c82d27b6479793ddee2a6fb14ee6e"
                        */
                        // var content_node_info = $(this).closest('div.rdr_contentSet').data();


                        RDR.actions.share_getLink({ sns:val, rindow:rindow, tag:tag, content_node:content_node });
                        return false;
                    });
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
                log('---commenting---');
                dir(args);
                RDR.session.getUser( args, function( params ) {
    
                    // get the text that was highlighted
                    var comment = $.trim( params.comment ),
                    int_id = params.int_id,
                    rindow = params.rindow,
                    tag = params.tag,
                    hash = params.which,
                    content_node = params.content_node;

                    //todo: temp fix
                    //almost works
                    content_node.content_type = (content_node.content_type == "img") ? "image" : "text";


                    log('params')
                    log(params)
                    
                    log('content_node_data content_type')
                    log(content_node.content_type)

                    var sendData = {
                        "tag" : tag,
                        "hash": hash,
                        "content_node_data" : content_node,
                        "user_id" : RDR.user.user_id,
                        "readr_token" : RDR.user.readr_token,
                        "group_id" : RDR.groupPermData.group_id,
                        "page_id" : RDR.page.id,
                        "comment" : comment,
                        "int_id" : int_id
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
                                        //RDR.actions.comment( args );
                                        //commenting this out for now because this prob wont work with the new args
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
                            log(response);
                        }
                    });
                });
            },
            startSelect: function(e) {
                // make a jQuery object of the node the user clicked on (at point of mouse up)
                
                var $mouse_target = $(e.target),
				selection = {};
								
                //ec: temp blacklist filter
                if( $mouse_target.parents().hasClass('rdr_blacklist')) return false;				

                // make sure it's not selecting inside the RDR windows.
                if ( !$mouse_target.hasClass('rdr') && $mouse_target.parents('div.rdr').length == 0 ) {

                    // closes undragged windows
                    //i need to remove this way (for now at least) so that I can bind an event to the remove event (thanks ie.)
                    RDR.rindow.close( $('div.rdr.rdr_window.rdr.rdr_rewritable') );

                    //destroy all other actionbars
                    RDR.actionbar.closeAll();

                    // see what the user selected
                    // TODO: need separate image function, which should then prevent event bubbling into this
						// ^ really?  why??

                    selection.sel = RDR.actions.selectedText();
                
                    //todo: consider using rangy's cross browser stuff here instead:
                    /*
                    var currentSelState = $().selog('save'),
                    text = currentSelState.text;
                    */
                    
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
							if ( $mouse_target.hasClass('rdr-hashed') ) {
								selection.container = $mouse_target.data('hash');
                            } else if ( $mouse_target.parents('.rdr-hashed:first').length == 1 ) {
                                selection.container = $mouse_target.parents('.rdr-hashed:first').data('hash');
							}

                            // strip newlines and tabs -- and then the doublespaces that result
                            selection.blockParentTextClean = RDR.util.cleanPara ( selection.blockParent.text );
                            selection.selectionTextClean = RDR.util.cleanPara ( selection.content );

							// see if it contains the whole selection text
                            if ( selection.blockParentTextClean.indexOf( selection.selectionTextClean ) != -1 ) {
                                RDR.actionbar.draw({
                                    coords:{
                                        left:parseInt(e.pageX),
                                        top:parseInt(e.pageY)+7
                                    },
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

                // if the selected object has no tagBody then return false.
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
loadScript( RDR_rootPath+"/static/js/jquery-1.6.js", function(){
    //callback

    //load jQuery UI while the $ and jQuery still refers to our new version
    loadScript( RDR_rootPath+"/static/js/jquery-ui-1.8.6.custom.min.js", function(){
        //callback

        //test that $.ui versioning is working correctly
        
        //within this scope while the $ refers to our version of jQuery, attach it to our Global var $R at least for now, for testing later
        //todo - I don't think it really matters, but consider making this just local later
        $R = $.noConflict(true);

        //test that $.ui versioning is working correctly

        //A function to load all plugins including those (most) that depend on jQuery.
        //The rest of our code is then set off with RDR.actions.init();
        $RFunctions($R);

    });
});

function $RFunctions($R){
    //called after our version of jQuery ($R) is loaded


    //load CSS
    var css = [
        RDR_rootPath+"/static/ui-prototype/css/readrboard.css",
        RDR_rootPath+"/static/css/jquery.jscrollpane.css"
    ];
    
    loadCSS(css);

    function loadCSS(cssFileList){

        $R.each(cssFileList, function(i, val){
            $R('<link>').attr({
                href: val,
                rel: 'stylesheet'
            }).appendTo('head');
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
        plugin_jquery_autogrow($R);
        plugin_jquery_mousewheel($R);
        plugin_jquery_mousewheelIntent($R);
        plugin_jquery_jScrollPane($R);
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

            if (typeof dir === "undefined" && typeof console.dir != "undefined"){
                dir = console.dir;  
            }

            //add in alias temporaily to client $ so we can use regular $ instead of $R if we want
            if(typeof jQuery != 'undefined'){
                jQuery.log = $.log;
                jQuery.fn.log = $.fn.log;
            }

        };
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
        };
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
        };
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
        };
        //end function plugin_jquery_enhancedOffset

        
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
                    //log('saved selState ' + selState.idx + ': ' + selState.text); //selog temp logging
                    return selState;
                },
                activate: function(idxOrSelState){
                    var selState = _fetchselState(idxOrSelState);
                    if(!selState) return false;
                    methods.clear();
                    _WSO().setSingleRange( selState.range );
                    //log('activated range selection: ')
                    //log(selState.range)
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
                    if( typeof idxOrSelState === 'string' && isNaN( idxOrSelState ) ){
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
                        // log(this);
                        // log(text);
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
                    serialRange = rangy.serializeRange(range, true, selState.container ); //see rangy function serializeRange
                }
                else if(selState.range){
                    range = selState.range;
                    serialRange = rangy.serializeRange(range, true, selState.container ); //see rangy function serializeRange
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
                //log('created new selState: ');
                //log(selState);
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
                    hiliter.applyToRange(range);
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
                var $tempButtons = $('<div id="rdr_selectionographer_tester" class="rdr_blacklist"/>').hide(),
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

        };
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
        };
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
            
        };
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
            }
        };
        //end function plugin_jquery_improvedCSS

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
        };
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
        };
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
        };
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
        };
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
             Version: 1.1.2
             Build date: 30 May 2011
            */
            var rangy=function(){function m(o,r){var A=typeof o[r];return A=="function"||!!(A=="object"&&o[r])||A=="unknown"}function N(o,r){return!!(typeof o[r]=="object"&&o[r])}function G(o,r){return typeof o[r]!="undefined"}function F(o){return function(r,A){for(var O=A.length;O--;)if(!o(r,A[O]))return false;return true}}function y(o){window.alert("Rangy not supported in your browser. Reason: "+o);q.initialized=true;q.supported=false}function E(){if(!q.initialized){var o,r=false,A=false;if(m(document,"createRange")){o=
            document.createRange();if(x(o,l)&&s(o,Q))r=true;o.detach()}if((o=N(document,"body")?document.body:document.getElementsByTagName("body")[0])&&m(o,"createTextRange")){o=o.createTextRange();if(x(o,t)&&s(o,p))A=true}!r&&!A&&y("Neither Range nor TextRange are implemented");q.initialized=true;q.features={implementsDomRange:r,implementsTextRange:A};r=f.concat(e);A=0;for(o=r.length;A<o;++A)try{r[A](q)}catch(O){N(window,"console")&&m(window.console,"log")&&window.log("Init listener threw an exception. Continuing.",
            O)}}}function H(o){this.name=o;this.supported=this.initialized=false}var Q=["startContainer","startOffset","endContainer","endOffset","collapsed","commonAncestorContainer","START_TO_START","START_TO_END","END_TO_START","END_TO_END"],l=["setStart","setStartBefore","setStartAfter","setEnd","setEndBefore","setEndAfter","collapse","selectNode","selectNodeContents","compareBoundaryPoints","deleteContents","extractContents","cloneContents","insertNode","surroundContents","cloneRange","toString","detach"],
            p=["boundingHeight","boundingLeft","boundingTop","boundingWidth","htmlText","text"],t=["collapse","compareEndPoints","duplicate","getBookmark","moveToBookmark","moveToElementText","parentElement","pasteHTML","select","setEndPoint"],x=F(m),B=F(N),s=F(G),q={initialized:false,supported:true,util:{isHostMethod:m,isHostObject:N,isHostProperty:G,areHostMethods:x,areHostObjects:B,areHostProperties:s},features:{},modules:{},config:{alertOnWarn:false}};q.fail=y;q.warn=function(o){o="Rangy warning: "+o;if(q.config.alertOnWarn)window.alert(o);
            else typeof window.console!="undefined"&&typeof window.console.log!="undefined"&&window.log(o)};var e=[],f=[];q.init=E;q.addInitListener=function(o){q.initialized?o(q):e.push(o)};var k=[];q.addCreateMissingNativeApiListener=function(o){k.push(o)};q.createMissingNativeApi=function(o){o=o||window;E();for(var r=0,A=k.length;r<A;++r)k[r](o)};H.prototype.fail=function(o){this.initialized=true;this.supported=false;throw Error("Module '"+this.name+"' failed to load: "+o);};H.prototype.warn=function(o){q.warn("Module "+
            this.name+": "+o)};H.prototype.createError=function(o){return Error("Error in Rangy "+this.name+" module: "+o)};q.createModule=function(o,r){var A=new H(o);q.modules[o]=A;f.push(function(O){r(O,A);A.initialized=true;A.supported=true})};q.requireModules=function(o){for(var r=0,A=o.length,O,I;r<A;++r){I=o[r];O=q.modules[I];if(!O||!(O instanceof H))throw Error("Module '"+I+"' not found");if(!O.supported)throw Error("Module '"+I+"' not supported");}};var u=false;B=function(){if(!u){u=true;q.initialized||
            E()}};if(typeof window=="undefined")y("No window found");else if(typeof document=="undefined")y("No document found");else{m(document,"addEventListener")&&document.addEventListener("DOMContentLoaded",B,false);if(m(window,"addEventListener"))window.addEventListener("load",B,false);else m(window,"attachEvent")?window.attachEvent("onload",B):y("Window does not have required addEventListener or attachEvent method");return q}}();
            rangy.createModule("DomUtil",function(m,N){function G(e){for(var f=0;e=e.previousSibling;)f++;return f}function F(e,f){var k=[],u;for(u=e;u;u=u.parentNode)k.push(u);for(u=f;u;u=u.parentNode)if(q(k,u))return u;return null}function y(e,f,k){for(k=k?e:e.parentNode;k;){e=k.parentNode;if(e===f)return k;k=e}return null}function E(e){e=e.nodeType;return e==3||e==4||e==8}function H(e,f){var k=f.nextSibling,u=f.parentNode;k?u.insertBefore(e,k):u.appendChild(e);return e}function Q(e){if(e.nodeType==9)return e;
            else if(typeof e.ownerDocument!="undefined")return e.ownerDocument;else if(typeof e.document!="undefined")return e.document;else if(e.parentNode)return Q(e.parentNode);else throw Error("getDocument: no document found for node");}function l(e){if(!e)return"[No node]";return E(e)?'"'+e.data+'"':e.nodeType==1?"<"+e.nodeName+(e.id?' id="'+e.id+'"':"")+">["+e.childNodes.length+"]":e.nodeName}function p(e){this._next=this.root=e}function t(e,f){this.node=e;this.offset=f}function x(e){this.code=this[e];
            this.codeName=e;this.message="DOMException: "+this.codeName}var B=m.util;B.areHostMethods(document,["createDocumentFragment","createElement","createTextNode"])||N.fail("document missing a Node creation method");B.isHostMethod(document,"getElementsByTagName")||N.fail("document missing getElementsByTagName method");var s=document.createElement("div");B.areHostMethods(s,["insertBefore","appendChild","cloneNode"])||N.fail("Incomplete Element implementation");s=document.createTextNode("test");B.areHostMethods(s,
            ["splitText","deleteData","insertData","appendData","cloneNode"])||N.fail("Incomplete Text Node implementation");var q=function(e,f){for(var k=e.length;k--;)if(e[k]===f)return true;return false};p.prototype={_current:null,hasNext:function(){return!!this._next},next:function(){var e=this._current=this._next,f;if(this._current)if(f=e.firstChild)this._next=f;else{for(f=null;e!==this.root&&!(f=e.nextSibling);)e=e.parentNode;this._next=f}return this._current},detach:function(){this._current=this._next=
            this.root=null}};t.prototype={equals:function(e){return this.node===e.node&this.offset==e.offset},inspect:function(){return"[DomPosition("+l(this.node)+":"+this.offset+")]"}};x.prototype={INDEX_SIZE_ERR:1,HIERARCHY_REQUEST_ERR:3,WRONG_DOCUMENT_ERR:4,NO_MODIFICATION_ALLOWED_ERR:7,NOT_FOUND_ERR:8,NOT_SUPPORTED_ERR:9,INVALID_STATE_ERR:11};x.prototype.toString=function(){return this.message};m.dom={arrayContains:q,getNodeIndex:G,getCommonAncestor:F,isAncestorOf:function(e,f,k){for(f=k?f:f.parentNode;f;)if(f===
            e)return true;else f=f.parentNode;return false},getClosestAncestorIn:y,isCharacterDataNode:E,insertAfter:H,splitDataNode:function(e,f){var k;if(e.nodeType==3)k=e.splitText(f);else{k=e.cloneNode();k.deleteData(0,f);e.deleteData(0,e.length-f);H(k,e)}return k},getDocument:Q,getWindow:function(e){e=Q(e);if(typeof e.defaultView!="undefined")return e.defaultView;else if(typeof e.parentWindow!="undefined")return e.parentWindow;else throw Error("Cannot get a window object for node");},getIframeWindow:function(e){if(typeof e.contentWindow!=
            "undefined")return e.contentWindow;else if(typeof e.contentDocument!="undefined")return e.contentDocument.defaultView;else throw Error("getIframeWindow: No Window object found for iframe element");},getIframeDocument:function(e){if(typeof e.contentDocument!="undefined")return e.contentDocument;else if(typeof e.contentWindow!="undefined")return e.contentWindow.document;else throw Error("getIframeWindow: No Document object found for iframe element");},getBody:function(e){return B.isHostObject(e,"body")?
            e.body:e.getElementsByTagName("body")[0]},comparePoints:function(e,f,k,u){var o;if(e==k)return f===u?0:f<u?-1:1;else if(o=y(k,e,true))return f<=G(o)?-1:1;else if(o=y(e,k,true))return G(o)<u?-1:1;else{f=F(e,k);e=e===f?f:y(e,f,true);k=k===f?f:y(k,f,true);if(e===k)throw Error("comparePoints got to case 4 and childA and childB are the same!");else{for(f=f.firstChild;f;){if(f===e)return-1;else if(f===k)return 1;f=f.nextSibling}throw Error("Should not be here!");}}},inspectNode:l,createIterator:function(e){return new p(e)},
            DomPosition:t};m.DOMException=x});
            rangy.createModule("DomRange",function(m){function N(b,h){return b.nodeType!=3&&(j.isAncestorOf(b,h.startContainer,true)||j.isAncestorOf(b,h.endContainer,true))}function G(b){return j.getDocument(b.startContainer)}function F(b,h,v){if(h=b._listeners[h])for(var z=0,M=h.length;z<M;++z)h[z].call(b,{target:b,args:v})}function y(b){return new Y(b.parentNode,j.getNodeIndex(b))}function E(b){return new Y(b.parentNode,j.getNodeIndex(b)+1)}function H(b){return j.isCharacterDataNode(b)?b.length:b.childNodes?
            b.childNodes.length:0}function Q(b,h,v){var z=b.nodeType==11?b.firstChild:b;if(j.isCharacterDataNode(h))v==h.length?j.insertAfter(b,h):h.parentNode.insertBefore(b,v==0?h:j.splitDataNode(h,v));else v>=h.childNodes.length?h.appendChild(b):h.insertBefore(b,h.childNodes[v]);return z}function l(b){for(var h,v,z=G(b.range).createDocumentFragment();v=b.next();){h=b.isPartiallySelectedSubtree();v=v.cloneNode(!h);if(h){h=b.getSubtreeIterator();v.appendChild(l(h));h.detach(true)}if(v.nodeType==10)throw new T("HIERARCHY_REQUEST_ERR");
            z.appendChild(v)}return z}function p(b,h,v){var z,M;for(v=v||{stop:false};z=b.next();)if(b.isPartiallySelectedSubtree())if(h(z)===false){v.stop=true;return}else{z=b.getSubtreeIterator();p(z,h,v);z.detach(true);if(v.stop)return}else for(z=j.createIterator(z);M=z.next();)if(h(M)===false){v.stop=true;return}}function t(b){for(var h;b.next();)if(b.isPartiallySelectedSubtree()){h=b.getSubtreeIterator();t(h);h.detach(true)}else b.remove()}function x(b){for(var h,v=G(b.range).createDocumentFragment(),z;h=
            b.next();){if(b.isPartiallySelectedSubtree()){h=h.cloneNode(false);z=b.getSubtreeIterator();h.appendChild(x(z));z.detach(true)}else b.remove();if(h.nodeType==10)throw new T("HIERARCHY_REQUEST_ERR");v.appendChild(h)}return v}function B(b,h,v){var z=!!(h&&h.length),M,V=!!v;if(z)M=RegExp("^("+h.join("|")+")$");var ba=[];p(new q(b,false),function(ca){if((!z||M.test(ca.nodeType))&&(!V||v(ca)))ba.push(ca)});return ba}function s(b){return"["+(typeof b.getName=="undefined"?"Range":b.getName())+"("+j.inspectNode(b.startContainer)+
            ":"+b.startOffset+", "+j.inspectNode(b.endContainer)+":"+b.endOffset+")]"}function q(b,h){this.range=b;this.clonePartiallySelectedTextNodes=h;if(!b.collapsed){this.sc=b.startContainer;this.so=b.startOffset;this.ec=b.endContainer;this.eo=b.endOffset;var v=b.commonAncestorContainer;if(this.sc===this.ec&&j.isCharacterDataNode(this.sc)){this.isSingleCharacterDataNode=true;this._first=this._last=this._next=this.sc}else{this._first=this._next=this.sc===v&&!j.isCharacterDataNode(this.sc)?this.sc.childNodes[this.so]:
            j.getClosestAncestorIn(this.sc,v,true);this._last=this.ec===v&&!j.isCharacterDataNode(this.ec)?this.ec.childNodes[this.eo-1]:j.getClosestAncestorIn(this.ec,v,true)}}}function e(b){this.code=this[b];this.codeName=b;this.message="RangeException: "+this.codeName}function f(b,h,v){this.nodes=B(b,h,v);this._next=this.nodes[0];this._position=0}function k(b){return function(h,v){for(var z,M=v?h:h.parentNode;M;){z=M.nodeType;if(j.arrayContains(b,z))return M;M=M.parentNode}return null}}function u(b){for(var h;h=
            b.parentNode;)b=h;return b}function o(b,h){if(C(b,h))throw new e("INVALID_NODE_TYPE_ERR");}function r(b){if(!b.startContainer)throw new T("INVALID_STATE_ERR");}function A(b,h){if(!j.arrayContains(h,b.nodeType))throw new e("INVALID_NODE_TYPE_ERR");}function O(b,h){if(h<0||h>(j.isCharacterDataNode(b)?b.length:b.childNodes.length))throw new T("INDEX_SIZE_ERR");}function I(b,h){if(d(b,true)!==d(h,true))throw new T("WRONG_DOCUMENT_ERR");}function U(b){if(i(b,true))throw new T("NO_MODIFICATION_ALLOWED_ERR");
            }function Z(b,h){if(!b)throw new T(h);}function J(b){if(!d(b.startContainer,true)||!d(b.endContainer,true)||!(b.startOffset<=(j.isCharacterDataNode(b.startContainer)?b.startContainer.length:b.startContainer.childNodes.length))||!(b.endOffset<=(j.isCharacterDataNode(b.endContainer)?b.endContainer.length:b.endContainer.childNodes.length)))throw Error("Range error: Range is no longer valid after DOM mutation ("+b.inspect()+")");}function W(b){b.START_TO_START=P;b.START_TO_END=X;b.END_TO_END=ka;b.END_TO_START=
            la;b.NODE_BEFORE=ma;b.NODE_AFTER=na;b.NODE_BEFORE_AND_AFTER=oa;b.NODE_INSIDE=ja}function da(b){W(b);W(b.prototype)}function ga(b,h,v){function z(c,g){return function(n){r(this);A(n,$);A(u(n),ia);n=(c?y:E)(n);(g?M:V)(this,n.node,n.offset)}}function M(c,g,n){var w=c.endContainer,L=c.endOffset;if(g!==c.startContainer||n!==this.startOffset){if(u(g)!=u(w)||j.comparePoints(g,n,w,L)==1){w=g;L=n}h(c,g,n,w,L)}}function V(c,g,n){var w=c.startContainer,L=c.startOffset;if(g!==c.endContainer||n!==this.endOffset){if(u(g)!=
            u(w)||j.comparePoints(g,n,w,L)==-1){w=g;L=n}h(c,w,L,g,n)}}function ba(c,g,n){if(g!==c.startContainer||n!==this.startOffset||g!==c.endContainer||n!==this.endOffset)h(c,g,n,g,n)}function ca(c){return function(){r(this);J(this);var g=this.startContainer,n=this.startOffset,w=this.commonAncestorContainer,L=new q(this,true);if(g!==w){g=j.getClosestAncestorIn(g,w,true);n=E(g);g=n.node;n=n.offset}p(L,U);L.reset();w=c(L);L.detach();h(this,g,n,g,n);return w}}b.prototype={attachListener:function(c,g){this._listeners[c].push(g)},
            setStart:function(c,g){r(this);o(c,true);O(c,g);M(this,c,g)},setEnd:function(c,g){r(this);o(c,true);O(c,g);V(this,c,g)},setStartBefore:z(true,true),setStartAfter:z(false,true),setEndBefore:z(true,false),setEndAfter:z(false,false),collapse:function(c){r(this);J(this);c?h(this,this.startContainer,this.startOffset,this.startContainer,this.startOffset):h(this,this.endContainer,this.endOffset,this.endContainer,this.endOffset)},selectNodeContents:function(c){r(this);o(c,true);h(this,c,0,c,H(c))},selectNode:function(c){r(this);
            o(c,false);A(c,$);var g=y(c);c=E(c);h(this,g.node,g.offset,c.node,c.offset)},compareBoundaryPoints:function(c,g){r(this);J(this);I(this.startContainer,g.startContainer);var n=c==la||c==P?"start":"end",w=c==X||c==P?"start":"end";return j.comparePoints(this[n+"Container"],this[n+"Offset"],g[w+"Container"],g[w+"Offset"])},insertNode:function(c){r(this);J(this);A(c,aa);U(this.startContainer);if(j.isAncestorOf(c,this.startContainer,true))throw new T("HIERARCHY_REQUEST_ERR");this.setStartBefore(Q(c,this.startContainer,
            this.startOffset))},cloneContents:function(){r(this);J(this);var c,g;if(this.collapsed)return G(this).createDocumentFragment();else{if(this.startContainer===this.endContainer&&j.isCharacterDataNode(this.startContainer)){c=this.startContainer.cloneNode(true);c.data=c.data.slice(this.startOffset,this.endOffset);g=G(this).createDocumentFragment();g.appendChild(c);return g}else{g=new q(this,true);c=l(g);g.detach()}return c}},extractContents:ca(x),deleteContents:ca(t),canSurroundContents:function(){r(this);
            J(this);U(this.startContainer);U(this.endContainer);var c=new q(this,true),g=c._first&&N(c._first,this)||c._last&&N(c._last,this);c.detach();return!g},surroundContents:function(c){A(c,a);if(!this.canSurroundContents())throw new e("BAD_BOUNDARYPOINTS_ERR");var g=this.extractContents();if(c.hasChildNodes())for(;c.lastChild;)c.removeChild(c.lastChild);Q(c,this.startContainer,this.startOffset);c.appendChild(g);this.selectNode(c)},cloneRange:function(){r(this);J(this);for(var c=new K(G(this)),g=D.length,
            n;g--;){n=D[g];c[n]=this[n]}return c},detach:function(){v(this)},toString:function(){r(this);J(this);var c=this.startContainer;if(c===this.endContainer&&j.isCharacterDataNode(c))return c.nodeType==3||c.nodeType==4?c.data.slice(this.startOffset,this.endOffset):"";else{var g=[];c=new q(this,true);p(c,function(n){if(n.nodeType==3||n.nodeType==4)g.push(n.data)});c.detach();return g.join("")}},compareNode:function(c){r(this);J(this);var g=c.parentNode,n=j.getNodeIndex(c);if(!g)throw new T("NOT_FOUND_ERR");
            c=this.comparePoint(g,n);g=this.comparePoint(g,n+1);return c<0?g>0?oa:ma:g>0?na:ja},comparePoint:function(c,g){r(this);J(this);Z(c,"HIERARCHY_REQUEST_ERR");I(c,this.startContainer);if(j.comparePoints(c,g,this.startContainer,this.startOffset)<0)return-1;else if(j.comparePoints(c,g,this.endContainer,this.endOffset)>0)return 1;return 0},createContextualFragment:function(c){r(this);var g=G(this),n=g.createElement("div");n.innerHTML=c;for(c=g.createDocumentFragment();g=n.firstChild;)c.appendChild(g);return c},
            intersectsNode:function(c,g){r(this);J(this);Z(c,"NOT_FOUND_ERR");if(j.getDocument(c)!==G(this))return false;var n=c.parentNode,w=j.getNodeIndex(c);Z(n,"NOT_FOUND_ERR");var L=j.comparePoints(n,w,this.endContainer,this.endOffset);n=j.comparePoints(n,w+1,this.startContainer,this.startOffset);return g?L<=0&&n>=0:L<0&&n>0},isPointInRange:function(c,g){r(this);J(this);Z(c,"HIERARCHY_REQUEST_ERR");I(c,this.startContainer);return j.comparePoints(c,g,this.startContainer,this.startOffset)>=0&&j.comparePoints(c,
            g,this.endContainer,this.endOffset)<=0},intersectsRange:function(c){r(this);J(this);if(G(c)!=G(this))throw new T("WRONG_DOCUMENT_ERR");return j.comparePoints(this.startContainer,this.startOffset,c.endContainer,c.endOffset)<0&&j.comparePoints(this.endContainer,this.endOffset,c.startContainer,c.startOffset)>0},intersection:function(c){if(this.intersectsRange(c)){var g=j.comparePoints(this.startContainer,this.startOffset,c.startContainer,c.startOffset),n=j.comparePoints(this.endContainer,this.endOffset,
            c.endContainer,c.endOffset),w=this.cloneRange();g==-1&&w.setStart(c.startContainer,c.startOffset);n==1&&w.setEnd(c.endContainer,c.endOffset);return w}return null},containsNode:function(c,g){return g?this.intersectsNode(c,false):this.compareNode(c)==ja},containsNodeContents:function(c){return this.comparePoint(c,0)>=0&&this.comparePoint(c,H(c))<=0},splitBoundaries:function(){J(this);var c=this.startContainer,g=this.startOffset,n=this.endContainer,w=this.endOffset,L=c===n;j.isCharacterDataNode(n)&&
            w>0&&w<n.length&&j.splitDataNode(n,w);if(j.isCharacterDataNode(c)&&g>0&&g<c.length){c=j.splitDataNode(c,g);if(L){w-=g;n=c}else n==c.parentNode&&w>=j.getNodeIndex(c)&&w++;g=0}h(this,c,g,n,w)},normalizeBoundaries:function(){J(this);var c=this.startContainer,g=this.startOffset,n=this.endContainer,w=this.endOffset,L=function(S){var R=S.nextSibling;if(R&&R.nodeType==S.nodeType){n=S;w=S.length;S.appendData(R.data);R.parentNode.removeChild(R)}},pa=function(S){var R=S.previousSibling;if(R&&R.nodeType==S.nodeType){c=
            S;var qa=S.length;g=R.length;S.insertData(0,R.data);R.parentNode.removeChild(R);if(c==n){w+=g;n=c}else if(n==S.parentNode){R=j.getNodeIndex(S);if(w==R){n=S;w=qa}else w>R&&w--}}},ha=true;if(j.isCharacterDataNode(n))n.length==w&&L(n);else{if(w>0)(ha=n.childNodes[w-1])&&j.isCharacterDataNode(ha)&&L(ha);ha=!this.collapsed}if(ha)if(j.isCharacterDataNode(c))g==0&&pa(c);else{if(g<c.childNodes.length)(L=c.childNodes[g])&&j.isCharacterDataNode(L)&&pa(L)}else{c=n;g=w}h(this,c,g,n,w)},createNodeIterator:function(c,
            g){r(this);J(this);return new f(this,c,g)},getNodes:function(c,g){r(this);J(this);return B(this,c,g)},collapseToPoint:function(c,g){r(this);J(this);o(c,true);O(c,g);ba(this,c,g)},collapseBefore:function(c){r(this);this.setEndBefore(c);this.collapse(false)},collapseAfter:function(c){r(this);this.setStartAfter(c);this.collapse(true)},getName:function(){return"DomRange"},equals:function(c){return K.rangesEqual(this,c)},inspect:function(){return s(this)}};da(b)}function ea(b){b.collapsed=b.startContainer===
            b.endContainer&&b.startOffset===b.endOffset;b.commonAncestorContainer=b.collapsed?b.startContainer:j.getCommonAncestor(b.startContainer,b.endContainer)}function fa(b,h,v,z,M){var V=b.startContainer!==h||b.startOffset!==v,ba=b.endContainer!==z||b.endOffset!==M;b.startContainer=h;b.startOffset=v;b.endContainer=z;b.endOffset=M;ea(b);F(b,"boundarychange",{startMoved:V,endMoved:ba})}function K(b){this.startContainer=b;this.startOffset=0;this.endContainer=b;this.endOffset=0;this._listeners={boundarychange:[],
            detach:[]};ea(this)}m.requireModules(["DomUtil"]);var j=m.dom,Y=j.DomPosition,T=m.DOMException;q.prototype={_current:null,_next:null,_first:null,_last:null,isSingleCharacterDataNode:false,reset:function(){this._current=null;this._next=this._first},hasNext:function(){return!!this._next},next:function(){var b=this._current=this._next;if(b){this._next=b!==this._last?b.nextSibling:null;if(j.isCharacterDataNode(b)&&this.clonePartiallySelectedTextNodes){if(b===this.ec)(b=b.cloneNode(true)).deleteData(this.eo,
            b.length-this.eo);if(this._current===this.sc)(b=b.cloneNode(true)).deleteData(0,this.so)}}return b},remove:function(){var b=this._current,h,v;if(j.isCharacterDataNode(b)&&(b===this.sc||b===this.ec)){h=b===this.sc?this.so:0;v=b===this.ec?this.eo:b.length;h!=v&&b.deleteData(h,v-h)}else b.parentNode&&b.parentNode.removeChild(b)},isPartiallySelectedSubtree:function(){return N(this._current,this.range)},getSubtreeIterator:function(){var b;if(this.isSingleCharacterDataNode){b=this.range.cloneRange();b.collapse()}else{b=
            new K(G(this.range));var h=this._current,v=h,z=0,M=h,V=H(h);if(j.isAncestorOf(h,this.sc,true)){v=this.sc;z=this.so}if(j.isAncestorOf(h,this.ec,true)){M=this.ec;V=this.eo}fa(b,v,z,M,V)}return new q(b,this.clonePartiallySelectedTextNodes)},detach:function(b){b&&this.range.detach();this.range=this._current=this._next=this._first=this._last=this.sc=this.so=this.ec=this.eo=null}};e.prototype={BAD_BOUNDARYPOINTS_ERR:1,INVALID_NODE_TYPE_ERR:2};e.prototype.toString=function(){return this.message};f.prototype=
            {_current:null,hasNext:function(){return!!this._next},next:function(){this._current=this._next;this._next=this.nodes[++this._position];return this._current},detach:function(){this._current=this._next=this.nodes=null}};var $=[1,3,4,5,7,8,10],ia=[2,9,11],aa=[1,3,4,5,7,8,10,11],a=[1,3,4,5,7,8],d=k([9,11]),i=k([5,6,10,12]),C=k([6,10,12]),D=["startContainer","startOffset","endContainer","endOffset","collapsed","commonAncestorContainer"],P=0,X=1,ka=2,la=3,ma=0,na=1,oa=2,ja=3;ga(K,fa,function(b){r(b);b.startContainer=
            b.startOffset=b.endContainer=b.endOffset=null;b.collapsed=b.commonAncestorContainer=null;F(b,"detach",null);b._listeners=null});K.fromRange=function(b){var h=new K(G(b));fa(h,b.startContainer,b.startOffset,b.endContainer,b.endOffset);return h};K.rangeProperties=D;K.RangeIterator=q;K.copyComparisonConstants=da;K.createPrototypeRange=ga;K.inspect=s;K.getRangeDocument=G;K.rangesEqual=function(b,h){return b.startContainer===h.startContainer&&b.startOffset===h.startOffset&&b.endContainer===h.endContainer&&
            b.endOffset===h.endOffset};K.getEndOffset=H;m.DomRange=K;m.RangeException=e});
            rangy.createModule("WrappedRange",function(m){function N(l,p,t,x){var B=l.duplicate();B.collapse(t);var s=B.parentElement();y.isAncestorOf(p,s,true)||(s=p);if(!s.canHaveHTML)return new E(s.parentNode,y.getNodeIndex(s));p=y.getDocument(s).createElement("span");var q,e=t?"StartToStart":"StartToEnd";do{s.insertBefore(p,p.previousSibling);B.moveToElementText(p)}while((q=B.compareEndPoints(e,l))>0&&p.previousSibling);e=p.nextSibling;if(q==-1&&e&&y.isCharacterDataNode(e)){B.setEndPoint(t?"EndToStart":"EndToEnd",
            l);if(/[\r\n]/.test(e.data)){s=B.duplicate();t=s.text.replace(/\r\n/g,"\r").length;for(t=s.moveStart("character",t);s.compareEndPoints("StartToEnd",s)==-1;){t++;s.moveStart("character",1)}}else t=B.text.length;s=new E(e,t)}else{e=(x||!t)&&p.previousSibling;s=(t=(x||t)&&p.nextSibling)&&y.isCharacterDataNode(t)?new E(t,0):e&&y.isCharacterDataNode(e)?new E(e,e.length):new E(s,y.getNodeIndex(p))}p.parentNode.removeChild(p);return s}function G(l,p){var t,x,B=l.offset,s=y.getDocument(l.node),q=s.body.createTextRange(),
            e=y.isCharacterDataNode(l.node);if(e){t=l.node;x=t.parentNode}else{t=l.node.childNodes;t=B<t.length?t[B]:null;x=l.node}s=s.createElement("span");s.innerHTML="&#feff;";t?x.insertBefore(s,t):x.appendChild(s);q.moveToElementText(s);q.collapse(!p);x.removeChild(s);if(e)q[p?"moveStart":"moveEnd"]("character",B);return q}m.requireModules(["DomUtil","DomRange"]);var F,y=m.dom,E=y.DomPosition,H=m.DomRange;if(m.features.implementsDomRange)(function(){function l(f){for(var k=t.length,u;k--;){u=t[k];f[u]=f.nativeRange[u]}}
            var p,t=H.rangeProperties,x,B;F=function(f){if(!f)throw Error("Range must be specified");this.nativeRange=f;l(this)};H.createPrototypeRange(F,function(f,k,u,o,r){var A=f.endContainer!==o||f.endOffset!=r;if(f.startContainer!==k||f.startOffset!=u||A){f.setEnd(o,r);f.setStart(k,u)}},function(f){f.nativeRange.detach();f.detached=true;for(var k=t.length,u;k--;){u=t[k];f[u]=null}});p=F.prototype;p.selectNode=function(f){this.nativeRange.selectNode(f);l(this)};p.deleteContents=function(){this.nativeRange.deleteContents();
            l(this)};p.extractContents=function(){var f=this.nativeRange.extractContents();l(this);return f};p.cloneContents=function(){return this.nativeRange.cloneContents()};p.surroundContents=function(f){this.nativeRange.surroundContents(f);l(this)};p.collapse=function(f){this.nativeRange.collapse(f);l(this)};p.cloneRange=function(){return new F(this.nativeRange.cloneRange())};p.refresh=function(){l(this)};p.toString=function(){return this.nativeRange.toString()};var s=document.createTextNode("test");y.getBody(document).appendChild(s);
            var q=document.createRange();q.setStart(s,0);q.setEnd(s,0);try{q.setStart(s,1);x=true;p.setStart=function(f,k){this.nativeRange.setStart(f,k);l(this)};p.setEnd=function(f,k){this.nativeRange.setEnd(f,k);l(this)};B=function(f){return function(k){this.nativeRange[f](k);l(this)}}}catch(e){x=false;p.setStart=function(f,k){try{this.nativeRange.setStart(f,k)}catch(u){this.nativeRange.setEnd(f,k);this.nativeRange.setStart(f,k)}l(this)};p.setEnd=function(f,k){try{this.nativeRange.setEnd(f,k)}catch(u){this.nativeRange.setStart(f,
            k);this.nativeRange.setEnd(f,k)}l(this)};B=function(f,k){return function(u){try{this.nativeRange[f](u)}catch(o){this.nativeRange[k](u);this.nativeRange[f](u)}l(this)}}}p.setStartBefore=B("setStartBefore","setEndBefore");p.setStartAfter=B("setStartAfter","setEndAfter");p.setEndBefore=B("setEndBefore","setStartBefore");p.setEndAfter=B("setEndAfter","setStartAfter");q.selectNodeContents(s);p.selectNodeContents=q.startContainer==s&&q.endContainer==s&&q.startOffset==0&&q.endOffset==s.length?function(f){this.nativeRange.selectNodeContents(f);
            l(this)}:function(f){this.setStart(f,0);this.setEnd(f,H.getEndOffset(f))};q.selectNodeContents(s);q.setEnd(s,3);x=document.createRange();x.selectNodeContents(s);x.setEnd(s,4);x.setStart(s,2);p.compareBoundaryPoints=q.compareBoundaryPoints(q.START_TO_END,x)==-1&q.compareBoundaryPoints(q.END_TO_START,x)==1?function(f,k){k=k.nativeRange||k;if(f==k.START_TO_END)f=k.END_TO_START;else if(f==k.END_TO_START)f=k.START_TO_END;return this.nativeRange.compareBoundaryPoints(f,k)}:function(f,k){return this.nativeRange.compareBoundaryPoints(f,
            k.nativeRange||k)};y.getBody(document).removeChild(s);q.detach();x.detach()})();else if(m.features.implementsTextRange){F=function(l){this.textRange=l;this.refresh()};F.prototype=new H(document);F.prototype.refresh=function(){var l,p,t=this.textRange;l=t.parentElement();var x=t.duplicate();x.collapse(true);p=x.parentElement();x=t.duplicate();x.collapse(false);t=x.parentElement();p=p==t?p:y.getCommonAncestor(p,t);p=p==l?p:y.getCommonAncestor(l,p);if(this.textRange.compareEndPoints("StartToEnd",this.textRange)==
            0)p=l=N(this.textRange,p,true,true);else{l=N(this.textRange,p,true,false);p=N(this.textRange,p,false,false)}this.setStart(l.node,l.offset);this.setEnd(p.node,p.offset)};F.rangeToTextRange=function(l){if(l.collapsed)return G(new E(l.startContainer,l.startOffset),true);else{var p=G(new E(l.startContainer,l.startOffset),true),t=G(new E(l.endContainer,l.endOffset),false);l=y.getDocument(l.startContainer).body.createTextRange();l.setEndPoint("StartToStart",p);l.setEndPoint("EndToEnd",t);return l}};H.copyComparisonConstants(F);
            var Q=function(){return this}();if(typeof Q.Range=="undefined")Q.Range=F}F.prototype.getName=function(){return"WrappedRange"};m.WrappedRange=F;m.createNativeRange=function(l){l=l||document;if(m.features.implementsDomRange)return l.createRange();else if(m.features.implementsTextRange)return l.body.createTextRange()};m.createRange=function(l){l=l||document;return new F(m.createNativeRange(l))};m.createRangyRange=function(l){l=l||document;return new H(l)};m.createIframeRange=function(l){return m.createRange(y.getIframeDocument(l))};
            m.createIframeRangyRange=function(l){return m.createRangyRange(y.getIframeDocument(l))};m.addCreateMissingNativeApiListener(function(l){l=l.document;if(typeof l.createRange=="undefined")l.createRange=function(){return m.createRange(this)};l=l=null})});
            rangy.createModule("WrappedSelection",function(m,N){function G(a){return(a||window).getSelection()}function F(a){return(a||window).document.selection}function y(a,d,i){var C=i?"end":"start";i=i?"start":"end";a.anchorNode=d[C+"Container"];a.anchorOffset=d[C+"Offset"];a.focusNode=d[i+"Container"];a.focusOffset=d[i+"Offset"]}function E(a){a.anchorNode=a.focusNode=null;a.anchorOffset=a.focusOffset=0;a.rangeCount=0;a.isCollapsed=true;a._ranges.length=0}function H(a){var d;if(a instanceof k){d=a._selectionNativeRange;
            if(!d){d=m.createNativeRange(e.getDocument(a.startContainer));d.setEnd(a.endContainer,a.endOffset);d.setStart(a.startContainer,a.startOffset);a._selectionNativeRange=d;a.attachListener("detach",function(){this._selectionNativeRange=null})}}else if(a instanceof u)d=a.nativeRange;else if(window.Range&&a instanceof Range)d=a;return d}function Q(a){var d=a.getNodes(),i;a:if(!d.length||d[0].nodeType!=1)i=false;else{i=1;for(var C=d.length;i<C;++i)if(!e.isAncestorOf(d[0],d[i])){i=false;break a}i=true}if(!i)throw Error("getSingleElementFromRange: range "+
            a.inspect()+" did not consist of a single element");return d[0]}function l(a,d){var i=new u(d);a._ranges=[i];y(a,i,false);a.rangeCount=1;a.isCollapsed=i.collapsed}function p(a){a._ranges.length=0;if(a.docSelection.type=="None")E(a);else{var d=a.docSelection.createRange();if(d&&typeof d.text!="undefined")l(a,d);else{a.rangeCount=d.length;for(var i,C=e.getDocument(d.item(0)),D=0;D<a.rangeCount;++D){i=m.createRange(C);i.selectNode(d.item(D));a._ranges.push(i)}a.isCollapsed=a.rangeCount==1&&a._ranges[0].collapsed;
            y(a,a._ranges[a.rangeCount-1],false)}}}function t(a,d){var i=a.docSelection.createRange(),C=Q(d),D=e.getDocument(i.item(0));D=e.getBody(D).createControlRange();for(var P=0,X=i.length;P<X;++P)D.add(i.item(P));try{D.add(C)}catch(ka){throw Error("addRange(): Element within the specified Range could not be added to control selection (does it have layout?)");}D.select();p(a)}function x(a,d,i){this.nativeSelection=a;this.docSelection=d;this._ranges=[];this.win=i;this.refresh()}function B(a,d){var i=e.getDocument(d[0].startContainer);
            i=e.getBody(i).createControlRange();for(var C=0,D;C<rangeCount;++C){D=Q(d[C]);try{i.add(D)}catch(P){throw Error("setRanges(): Element within the one of the specified Ranges could not be added to control selection (does it have layout?)");}}i.select();p(a)}function s(a,d){if(a.anchorNode&&e.getDocument(a.anchorNode)!==e.getDocument(d))throw new o("WRONG_DOCUMENT_ERR");}function q(a){var d=[],i=new r(a.anchorNode,a.anchorOffset),C=new r(a.focusNode,a.focusOffset),D=typeof a.getName=="function"?a.getName():
            "Selection";if(typeof a.rangeCount!="undefined")for(var P=0,X=a.rangeCount;P<X;++P)d[P]=k.inspect(a.getRangeAt(P));return"["+D+"(Ranges: "+d.join(", ")+")(anchor: "+i.inspect()+", focus: "+C.inspect()+"]"}m.requireModules(["DomUtil","DomRange","WrappedRange"]);m.config.checkSelectionRanges=true;var e=m.dom,f=m.util,k=m.DomRange,u=m.WrappedRange,o=m.DOMException,r=e.DomPosition,A,O,I=m.util.isHostMethod(window,"getSelection"),U=m.util.isHostObject(document,"selection");if(I){A=G;m.isSelectionValid=
            function(){return true}}else if(U){A=F;m.isSelectionValid=function(a){a=(a||window).document;var d=a.selection;return d.type!="None"||e.getDocument(d.createRange().parentElement())==a}}else N.fail("No means of obtaining a selection object");m.getNativeSelection=A;I=A();var Z=m.createNativeRange(document),J=e.getBody(document),W=f.areHostObjects(I,f.areHostProperties(I,["anchorOffset","focusOffset"]));m.features.selectionHasAnchorAndFocus=W;var da=f.isHostMethod(I,"extend");m.features.selectionHasExtend=
            da;var ga=typeof I.rangeCount=="number";m.features.selectionHasRangeCount=ga;var ea=false,fa=true;f.areHostMethods(I,["addRange","getRangeAt","removeAllRanges"])&&typeof I.rangeCount=="number"&&m.features.implementsDomRange&&function(){var a=document.createElement("iframe");J.appendChild(a);var d=e.getIframeDocument(a);d.open();d.write("<html><head></head><body>12</body></html>");d.close();var i=e.getIframeWindow(a).getSelection(),C=d.documentElement.lastChild.firstChild;d=d.createRange();d.setStart(C,
            1);d.collapse(true);i.addRange(d);fa=i.rangeCount==1;i.removeAllRanges();var D=d.cloneRange();d.setStart(C,0);D.setEnd(C,2);i.addRange(d);i.addRange(D);ea=i.rangeCount==2;d.detach();D.detach();J.removeChild(a)}();m.features.selectionSupportsMultipleRanges=ea;m.features.collapsedNonEditableSelectionsSupported=fa;var K=false,j;if(J&&f.isHostMethod(J,"createControlRange")){j=J.createControlRange();if(f.areHostProperties(j,["item","add"]))K=true}m.features.implementsControlRange=K;O=W?function(a){return a.anchorNode===
            a.focusNode&&a.anchorOffset===a.focusOffset}:function(a){return a.rangeCount?a.getRangeAt(a.rangeCount-1).collapsed:false};var Y;if(f.isHostMethod(I,"getRangeAt"))Y=function(a,d){try{return a.getRangeAt(d)}catch(i){return null}};else if(W)Y=function(a){var d=e.getDocument(a.anchorNode);d=m.createRange(d);d.setStart(a.anchorNode,a.anchorOffset);d.setEnd(a.focusNode,a.focusOffset);if(d.collapsed!==this.isCollapsed){d.setStart(a.focusNode,a.focusOffset);d.setEnd(a.anchorNode,a.anchorOffset)}return d};
            m.getSelection=function(a){a=a||window;var d=a._rangySelection,i=A(a),C=U?F(a):null;if(d){d.nativeSelection=i;d.docSelection=C;d.refresh(a)}else{d=new x(i,C,a);a._rangySelection=d}return d};m.getIframeSelection=function(a){return m.getSelection(e.getIframeWindow(a))};j=x.prototype;if(W&&f.areHostMethods(I,["removeAllRanges","addRange"])){j.removeAllRanges=function(){this.nativeSelection.removeAllRanges();E(this)};var T=function(a,d){var i=k.getRangeDocument(d);i=m.createRange(i);i.collapseToPoint(d.endContainer,
            d.endOffset);a.nativeSelection.addRange(H(i));a.nativeSelection.extend(d.startContainer,d.startOffset);a.refresh()};j.addRange=ga?function(a,d){if(K&&U&&this.docSelection.type=="Control")t(this,a);else if(d&&da)T(this,a);else{var i;if(ea)i=this.rangeCount;else{this.removeAllRanges();i=0}this.nativeSelection.addRange(H(a));this.rangeCount=this.nativeSelection.rangeCount;if(this.rangeCount==i+1){if(m.config.checkSelectionRanges)if((i=Y(this.nativeSelection,this.rangeCount-1))&&!k.rangesEqual(i,a))a=
            new u(i);this._ranges[this.rangeCount-1]=a;y(this,a,aa(this.nativeSelection));this.isCollapsed=O(this)}else this.refresh()}}:function(a,d){if(d&&da)T(this,a);else{this.nativeSelection.addRange(H(a));this.refresh()}};j.setRanges=function(a){if(K&&a.length>1)B(this,a);else{this.removeAllRanges();for(var d=0,i=a.length;d<i;++d)this.addRange(a[d])}}}else if(f.isHostMethod(I,"empty")&&f.isHostMethod(Z,"select")&&K&&U){j.removeAllRanges=function(){try{this.docSelection.empty();if(this.docSelection.type!=
            "None"){var a;if(this.anchorNode)a=e.getDocument(this.anchorNode);else if(this.docSelection.type=="Control"){var d=this.docSelection.createRange();if(d.length)a=e.getDocument(d.item(0)).body.createTextRange()}if(a){a.body.createTextRange().select();this.docSelection.empty()}}}catch(i){}E(this)};j.addRange=function(a){if(this.docSelection.type=="Control")t(this,a);else{u.rangeToTextRange(a).select();this._ranges[0]=a;this.rangeCount=1;this.isCollapsed=this._ranges[0].collapsed;y(this,a,false)}};j.setRanges=
            function(a){this.removeAllRanges();var d=a.length;if(d>1)B(this,a);else d&&this.addRange(a[0])}}else{N.fail("No means of selecting a Range or TextRange was found");return false}j.getRangeAt=function(a){if(a<0||a>=this.rangeCount)throw new o("INDEX_SIZE_ERR");else return this._ranges[a]};var $;if(f.isHostMethod(I,"getRangeAt")&&typeof I.rangeCount=="number")$=function(a){if(K&&U&&a.docSelection.type=="Control")p(a);else{a._ranges.length=a.rangeCount=a.nativeSelection.rangeCount;if(a.rangeCount){for(var d=
            0,i=a.rangeCount;d<i;++d)a._ranges[d]=new m.WrappedRange(a.nativeSelection.getRangeAt(d));y(a,a._ranges[a.rangeCount-1],aa(a.nativeSelection));a.isCollapsed=O(a)}else E(a)}};else if(W&&typeof I.isCollapsed=="boolean"&&typeof Z.collapsed=="boolean"&&m.features.implementsDomRange)$=function(a){var d;d=a.nativeSelection;if(d.anchorNode){d=Y(d,0);a._ranges=[d];a.rangeCount=1;d=a.nativeSelection;a.anchorNode=d.anchorNode;a.anchorOffset=d.anchorOffset;a.focusNode=d.focusNode;a.focusOffset=d.focusOffset;
            a.isCollapsed=O(a)}else E(a)};else if(f.isHostMethod(I,"createRange")&&U)$=function(a){var d;if(m.isSelectionValid(a.win))d=a.docSelection.createRange();else{d=e.getBody(a.win.document).createTextRange();d.collapse(true)}if(a.docSelection.type=="Control")p(a);else d&&typeof d.text!="undefined"?l(a,d):E(a)};else{N.fail("No means of obtaining a Range or TextRange from the user's selection was found");return false}j.refresh=function(a){var d=a?this._ranges.slice(0):null;$(this);if(a){a=d.length;if(a!=
            this._ranges.length)return false;for(;a--;)if(!k.rangesEqual(d[a],this._ranges[a]))return false;return true}};var ia=function(a,d){var i=a.getAllRanges(),C=false;a.removeAllRanges();for(var D=0,P=i.length;D<P;++D)if(C||d!==i[D])a.addRange(i[D]);else C=true;a.rangeCount||E(a)};j.removeRange=K?function(a){if(this.docSelection.type=="Control"){var d=this.docSelection.createRange();a=Q(a);var i=e.getDocument(d.item(0));i=e.getBody(i).createControlRange();for(var C,D=false,P=0,X=d.length;P<X;++P){C=d.item(P);
            if(C!==a||D)i.add(d.item(P));else D=true}i.select();p(this)}else ia(this,a)}:function(a){ia(this,a)};var aa;if(W&&m.features.implementsDomRange){aa=function(a){var d=false;if(a.anchorNode)d=e.comparePoints(a.anchorNode,a.anchorOffset,a.focusNode,a.focusOffset)==1;return d};j.isBackwards=function(){return aa(this)}}else aa=j.isBackwards=function(){return false};j.toString=function(){for(var a=[],d=0,i=this.rangeCount;d<i;++d)a[d]=""+this._ranges[d];return a.join("")};j.collapse=function(a,d){s(this,
            a);var i=m.createRange(e.getDocument(a));i.collapseToPoint(a,d);this.removeAllRanges();this.addRange(i);this.isCollapsed=true};j.collapseToStart=function(){if(this.rangeCount){var a=this._ranges[0];this.collapse(a.startContainer,a.startOffset)}else throw new o("INVALID_STATE_ERR");};j.collapseToEnd=function(){if(this.rangeCount){var a=this._ranges[this.rangeCount-1];this.collapse(a.endContainer,a.endOffset)}else throw new o("INVALID_STATE_ERR");};j.selectAllChildren=function(a){s(this,a);var d=m.createRange(e.getDocument(a));
            d.selectNodeContents(a);this.removeAllRanges();this.addRange(d)};j.deleteFromDocument=function(){if(K&&U&&this.docSelection.type=="Control"){for(var a=this.docSelection.createRange(),d;a.length;){d=a.item(0);a.remove(d);d.parentNode.removeChild(d)}this.refresh()}else if(this.rangeCount){a=this.getAllRanges();this.removeAllRanges();d=0;for(var i=a.length;d<i;++d)a[d].deleteContents();this.addRange(a[i-1])}};j.getAllRanges=function(){return this._ranges.slice(0)};j.setSingleRange=function(a){this.setRanges([a])};
            j.containsNode=function(a,d){for(var i=0,C=this._ranges.length;i<C;++i)if(this._ranges[i].containsNode(a,d))return true;return false};j.getName=function(){return"WrappedSelection"};j.inspect=function(){return q(this)};j.detach=function(){this.win=this.anchorNode=this.focusNode=this.win._rangySelection=null};x.inspect=q;m.Selection=x;m.addCreateMissingNativeApiListener(function(a){if(typeof a.getSelection=="undefined")a.getSelection=function(){return m.getSelection(this)};a=null})});


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
            a=typeof c;if(a=="string")if(c=="*")this.applyToAnytagBody=true;else this.tagNames=s(c.toLowerCase()).split(/\s*,\s*/);else if(a=="object"&&typeof c.length=="number"){this.tagNames=[];a=0;for(b=c.length;a<b;++a)if(c[a]=="*")this.applyToAnytagBody=true;else this.tagNames.push(c[a].toLowerCase())}else this.tagNames=[q]}h.requireModules(["WrappedSelection","WrappedRange"]);var g=h.dom,q="span",B=function(){function a(b,c,d){return c&&d?" ":""}return function(b,c){if(b.className)b.className=b.className.replace(RegExp("(?:^|\\s)"+
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
            rangy.createModule("SaveRestore",function(h,m){function n(a,g){var e="selectionBoundary_"+ +new Date+"_"+(""+Math.random()).slice(2),c,f=p.getDocument(a.startContainer),d=a.cloneRange();d.collapse(g);c=f.createElement("span");c.id=e;c.style.lineHeight="0";c.style.display="none";c.appendChild(f.createTextNode(q));d.insertNode(c);d.detach();return c}function o(a,g,e,c){if(a=(a||document).getElementById(e)){g[c?"setStartBefore":"setEndBefore"](a);a.parentNode.removeChild(a)}else m.warn("Marker element has been removed. Cannot restore selection.")}
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
        };
        //end function plugin_rangy()

        /** end plugin functions **/        
    }
    //end initPlugins()

}
//end $RFunctions()