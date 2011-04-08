// console.log($)
var jQueryVersion = "1.4.4",
RDRtimer,
RDR, //our global RDR object
$RDR, //our global $RDR object (jquerified RDR object for attaching data and queues and such)
$R = {}, //init var: our clone of jQuery
client$ = {}; //init var: clients copy of jQuery

var demoRindow;

//Our Readrboard function that builds the RDR object which gets returned into the global scope.
//This function gets called above in
function readrBoard($R){

    var $ = $R;

    //todo: [eric] this doesn't really do anything, cause even if we pick up the global RDR into the local version,
        // we're just overwriting it in the next line anyway. 
        //consider using <if (RDR.length) return;> or just omit it.
    var RDR = RDR ? RDR : {};

    // none of this obj's properties are definite.  just jotting down a few ideas.
    RDR = {
        current : {},
        content_nodes : {},
        groupPermData: {
            group_id : "{{ group_id }}",  //make group_id a string partly to make my IDE happy - getting sent as ajax anyway
            short_name : "{{ short_name }}"
        },
        group : {}, //to be set by RDR.actions.initGroupData
        user : {
            first_name:		"",
            full_name:		"",
            img_url:        "", 
            readr_token: 	"",
            user_id:        ""
        },
        errors : {
            actionbar: {
                rating:"",
                commenting:""
            }
        },
        styles : {
        /*
		page: 	"<style type='text/css'>"+
				"body 		{background:#fff;}" +
				"body p		{}" +
				"</style>"
		*/
		},
		demo :{
		    inPage_one : function(img) {
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
                    minHeight: rindow.settings.height +'px',
                }, rindow.settings.animTime, function() {
					$(this).css('width','auto');
					rindow.find('.rdr_contentSpace').append( $demo );
				});
		    }
		},
		rindow : {
            defaults:{
                x:100,
                y:100,
                pnlWidth:200,
                animTime:300,
                height:150
            },
			// content comes later.  this is just to identify or draw the container.
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
					$('body').append( $new_rindow );
				}

				if ( $new_rindow.find('h1').length == 0 ) {
                    $new_rindow.html('');
                    $new_rindow.append( '<div class="rdr_close">x</div><h1></h1><div class="rdr rdr_contentSpace"></div>' );
                    $new_rindow.find('div.rdr_close').click( function() {
                        $(this).parents('div.rdr.rdr_window').remove();
                    } );
					
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
                return $new_rindow;
			},
			closeAll: function() {
				$('div.rdr.rdr_window').remove();
			}
		},
		actionbar : {
			draw: function(settings) {


				var actionbar_id = "rdr_actionbar_"+RDR.util.md5.hex_md5( settings.content );

				var $actionbars = $('div.rdr.rdr_actionbar');
                
				if ( $('#'+actionbar_id).length > 0 ) return $('#'+actionbar_id);
				// else 
			 	
                var left = settings.left ? (settings.left-34) : 100;
                var top = settings.top ? (settings.top-50) : 100;

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

                var items = [
                        {
                            "item":"about",
                            "tipText":"What's This?",
                            "onclick": RDR.actions.aboutReadrBoard
                        },
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
                            "tipText":"Bookmark This",
                            "onclick":RDR.actions.bookmarkStart
                        }
                ];

                $.each( items, function(idx, val){
                    var $item = $('<li class="rdr_icon_' +val.item+ '" />'),
                    $iconAnchor = $('<a href="javascript:void(0);">' +val.item+ '</a>'),
                    $tooltip = RDR.tooltip.draw({"item":val.item,"tipText":val.tipText}).hide();
                    $iconAnchor.click(function(){
                        val.onclick();
                        return false;
                    });
                    $item.append($iconAnchor,$tooltip).appendTo($new_actionbar.children('ul'));
                    if(idx===0){$item.prepend($('<span class="rdr_icon_divider" />'))}
                });

                //'<a href="javascript:void(0);" onclick="(function(){RDR.actions.sentimentBox({content_type:\''+settings.content_type+'\',content:\''+settings.content+'\'});/*RDR.actions.shareStart();*/}())" class="rdr_icon_comment">Comment On This</a>' +

                //todo: [eric] I added a shareStart function that shows up after the rate-this dialogue,
                //but we're not sure yet if it's going to be the same function as this shareStart() above..

                $('body').append( $new_actionbar );
                $new_actionbar.find('li').hover(
                    function() {
                        $(this).find('a').siblings('.rdr_tooltip').show();
                    },
                    function () {
                        $(this).find('a').siblings('.rdr_tooltip').hide();
                    }
                );

                //for images, only show the about icon, hide the rest
                if(settings.content_type == "image"){
                    var $aboutIcon = $new_actionbar.find('li:first'),
                    $otherIcons = $aboutIcon.siblings();
                    $aboutIcon.find('.rdr_icon_divider').hide();
                    $otherIcons.hide();
                }

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
                    },500);
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
		tooltip : {
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
		util : {
            stayInWindow : function(settings) {
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
            md5 : {
				hexcase:0,
				b64pad:"",
				chrsz:8,
				hex_md5 : function(s){return RDR.util.md5.binl2hex(RDR.util.md5.core_md5(RDR.util.md5.str2binl(s),s.length*RDR.util.md5.chrsz));},
				core_md5 : function(x,len){x[len>>5]|=0x80<<((len)%32);x[(((len+64)>>>9)<<4)+14]=len;var a=1732584193;var b=-271733879;var c=-1732584194;var d=271733878;for(var i=0;i<x.length;i+=16){var olda=a;var oldb=b;var oldc=c;var oldd=d;a=RDR.util.md5.md5_ff(a,b,c,d,x[i+0],7,-680876936);d=RDR.util.md5.md5_ff(d,a,b,c,x[i+1],12,-389564586);c=RDR.util.md5.md5_ff(c,d,a,b,x[i+2],17,606105819);b=RDR.util.md5.md5_ff(b,c,d,a,x[i+3],22,-1044525330);a=RDR.util.md5.md5_ff(a,b,c,d,x[i+4],7,-176418897);d=RDR.util.md5.md5_ff(d,a,b,c,x[i+5],12,1200080426);c=RDR.util.md5.md5_ff(c,d,a,b,x[i+6],17,-1473231341);b=RDR.util.md5.md5_ff(b,c,d,a,x[i+7],22,-45705983);a=RDR.util.md5.md5_ff(a,b,c,d,x[i+8],7,1770035416);d=RDR.util.md5.md5_ff(d,a,b,c,x[i+9],12,-1958414417);c=RDR.util.md5.md5_ff(c,d,a,b,x[i+10],17,-42063);b=RDR.util.md5.md5_ff(b,c,d,a,x[i+11],22,-1990404162);a=RDR.util.md5.md5_ff(a,b,c,d,x[i+12],7,1804603682);d=RDR.util.md5.md5_ff(d,a,b,c,x[i+13],12,-40341101);c=RDR.util.md5.md5_ff(c,d,a,b,x[i+14],17,-1502002290);b=RDR.util.md5.md5_ff(b,c,d,a,x[i+15],22,1236535329);a=RDR.util.md5.md5_gg(a,b,c,d,x[i+1],5,-165796510);d=RDR.util.md5.md5_gg(d,a,b,c,x[i+6],9,-1069501632);c=RDR.util.md5.md5_gg(c,d,a,b,x[i+11],14,643717713);b=RDR.util.md5.md5_gg(b,c,d,a,x[i+0],20,-373897302);a=RDR.util.md5.md5_gg(a,b,c,d,x[i+5],5,-701558691);d=RDR.util.md5.md5_gg(d,a,b,c,x[i+10],9,38016083);c=RDR.util.md5.md5_gg(c,d,a,b,x[i+15],14,-660478335);b=RDR.util.md5.md5_gg(b,c,d,a,x[i+4],20,-405537848);a=RDR.util.md5.md5_gg(a,b,c,d,x[i+9],5,568446438);d=RDR.util.md5.md5_gg(d,a,b,c,x[i+14],9,-1019803690);c=RDR.util.md5.md5_gg(c,d,a,b,x[i+3],14,-187363961);b=RDR.util.md5.md5_gg(b,c,d,a,x[i+8],20,1163531501);a=RDR.util.md5.md5_gg(a,b,c,d,x[i+13],5,-1444681467);d=RDR.util.md5.md5_gg(d,a,b,c,x[i+2],9,-51403784);c=RDR.util.md5.md5_gg(c,d,a,b,x[i+7],14,1735328473);b=RDR.util.md5.md5_gg(b,c,d,a,x[i+12],20,-1926607734);a=RDR.util.md5.md5_hh(a,b,c,d,x[i+5],4,-378558);d=RDR.util.md5.md5_hh(d,a,b,c,x[i+8],11,-2022574463);c=RDR.util.md5.md5_hh(c,d,a,b,x[i+11],16,1839030562);b=RDR.util.md5.md5_hh(b,c,d,a,x[i+14],23,-35309556);a=RDR.util.md5.md5_hh(a,b,c,d,x[i+1],4,-1530992060);d=RDR.util.md5.md5_hh(d,a,b,c,x[i+4],11,1272893353);c=RDR.util.md5.md5_hh(c,d,a,b,x[i+7],16,-155497632);b=RDR.util.md5.md5_hh(b,c,d,a,x[i+10],23,-1094730640);a=RDR.util.md5.md5_hh(a,b,c,d,x[i+13],4,681279174);d=RDR.util.md5.md5_hh(d,a,b,c,x[i+0],11,-358537222);c=RDR.util.md5.md5_hh(c,d,a,b,x[i+3],16,-722521979);b=RDR.util.md5.md5_hh(b,c,d,a,x[i+6],23,76029189);a=RDR.util.md5.md5_hh(a,b,c,d,x[i+9],4,-640364487);d=RDR.util.md5.md5_hh(d,a,b,c,x[i+12],11,-421815835);c=RDR.util.md5.md5_hh(c,d,a,b,x[i+15],16,530742520);b=RDR.util.md5.md5_hh(b,c,d,a,x[i+2],23,-995338651);a=RDR.util.md5.md5_ii(a,b,c,d,x[i+0],6,-198630844);d=RDR.util.md5.md5_ii(d,a,b,c,x[i+7],10,1126891415);c=RDR.util.md5.md5_ii(c,d,a,b,x[i+14],15,-1416354905);b=RDR.util.md5.md5_ii(b,c,d,a,x[i+5],21,-57434055);a=RDR.util.md5.md5_ii(a,b,c,d,x[i+12],6,1700485571);d=RDR.util.md5.md5_ii(d,a,b,c,x[i+3],10,-1894986606);c=RDR.util.md5.md5_ii(c,d,a,b,x[i+10],15,-1051523);b=RDR.util.md5.md5_ii(b,c,d,a,x[i+1],21,-2054922799);a=RDR.util.md5.md5_ii(a,b,c,d,x[i+8],6,1873313359);d=RDR.util.md5.md5_ii(d,a,b,c,x[i+15],10,-30611744);c=RDR.util.md5.md5_ii(c,d,a,b,x[i+6],15,-1560198380);b=RDR.util.md5.md5_ii(b,c,d,a,x[i+13],21,1309151649);a=RDR.util.md5.md5_ii(a,b,c,d,x[i+4],6,-145523070);d=RDR.util.md5.md5_ii(d,a,b,c,x[i+11],10,-1120210379);c=RDR.util.md5.md5_ii(c,d,a,b,x[i+2],15,718787259);b=RDR.util.md5.md5_ii(b,c,d,a,x[i+9],21,-343485551);a=RDR.util.md5.safe_add(a,olda);b=RDR.util.md5.safe_add(b,oldb);c=RDR.util.md5.safe_add(c,oldc);d=RDR.util.md5.safe_add(d,oldd);} return Array(a,b,c,d);},
				md5_cmn : function(q,a,b,x,s,t){return RDR.util.md5.safe_add(RDR.util.md5.bit_rol(RDR.util.md5.safe_add(RDR.util.md5.safe_add(a,q),RDR.util.md5.safe_add(x,t)),s),b);},
				md5_ff : function(a,b,c,d,x,s,t){return RDR.util.md5.md5_cmn((b&c)|((~b)&d),a,b,x,s,t);},
				md5_gg : function(a,b,c,d,x,s,t){return RDR.util.md5.md5_cmn((b&d)|(c&(~d)),a,b,x,s,t);},
				md5_hh : function(a,b,c,d,x,s,t){return RDR.util.md5.md5_cmn(b^c^d,a,b,x,s,t);},
				md5_ii : function(a,b,c,d,x,s,t){return RDR.util.md5.md5_cmn(c^(b|(~d)),a,b,x,s,t);},
				safe_add : function(x,y){var lsw=(x&0xFFFF)+(y&0xFFFF);var msw=(x>>16)+(y>>16)+(lsw>>16);return(msw<<16)|(lsw&0xFFFF);},
				bit_rol : function(num,cnt){return(num<<cnt)|(num>>>(32-cnt));},
				str2binl : function(str){var bin=Array();var mask=(1<<RDR.util.md5.chrsz)-1;for(var i=0;i<str.length*RDR.util.md5.chrsz;i+=RDR.util.md5.chrsz){bin[i>>5]|=(str.charCodeAt(i/RDR.util.md5.chrsz)&mask)<<(i%32);}return bin;},
				binl2hex : function(binarray){var hex_tab=RDR.util.md5.hexcase?"0123456789ABCDEF":"0123456789abcdef";var str="";for(var i=0;i<binarray.length*4;i++){str+=hex_tab.charAt((binarray[i>>2]>>((i%4)*8+4))&0xF)+hex_tab.charAt((binarray[i>>2]>>((i%4)*8))&0xF);} return str;}
			},
            cleanPara : function(para) {
                // common function for cleaning the paragraph.  right now, it's removing spaces, tabs, newlines, and then double spaces
                if(para != "") {
                    return para.replace(/[\n\r\t]+/gi,' ').replace().replace(/\s{2,}/g,' ');
                }
            }
        },
		session : {
			iframeHost : "http://readr.local:8080", // TODO put this in a template var
            checkUser : function(args, callback) {
                console.log('checking user');
                if ( RDR.user && RDR.user.user_id && RDR.user.readr_token ) {
                    callback(args);
                } else {
                    // RECEIVE MESSAGE WILL 'execute'

                    // posting this message then means we'll look in the $.receiveMessage for the response and what to do next
                    // TODO need a timeout and/or try/catch?
                    $.postMessage(
                        "getUser",
                        RDR.session.iframeHost + "/xdm_status/",
                        window.frames['rdr-xdm-hidden']
                    );
                }
            },
			createXDMframe : function() {
				var iframeUrl = RDR.session.iframeHost + "/xdm_status/",
				parentUrl = window.location.href,
                parentHost = window.location.protocol + "//" + window.location.host;
				$xdmIframe = $('<iframe id="rdr-xdm-hidden" name="rdr-xdm-hidden" src="' + iframeUrl + '?parentUrl=' + parentUrl + '&parentHost=' + parentHost + '&group_id='+RDR.groupPermData.group_id+'&cachebust='+RDR.cachebuster+'" width="1" height="1" style="position:absolute;top:-1000px;left:-1000px;" />'
				);
				$('body').append( $xdmIframe );

				// this is the postMessage receiver for ALL messages posted.
                // TODO: put this elsewhere so it's more logically placed and easier to find??
                $.receiveMessage(
                    function(e){
                        console.log( JSON.parse( e.data ) );
                        var message = JSON.parse( e.data );

                        if ( message.action ) {;
                            switch (message.action) {
                                // currently, we don't care HERE what user type it is.  we just need a user ID and token to finish the action
                                // the response of the action itself (say, tagging) will tell us if we need to message the user about temp, log in, etc
                                case "fb_logged_in":
                                case "known_user":
                                case "got_temp_user":
                                    console.dir(message.data);
                                    for ( var i in message.data ) {
                                        RDR.user[ i ] = message.data[i];
                                    }
                                    if ( typeof args != "undefined" ) {
                                        args.user = RDR.user;
                                        callback( args );
                                    }
                                    // TODO do we def want to remove the login panel if it was showing?
                                    // user rdr-loginPanel for the temp user message, too
                                    $('#rdr-loginPanel').remove();
                                    break;
                            }
                        }
                    },
                    RDR.session.iframeHost
                );

			},
			login : function() {},
			showLoginPanel : function(args, callback) {

                $('.rdr_rewritable').removeClass('rdr_rewritable');


                //todo: weird, why did commenting this line out not do anything?...look into it
				//porter says: the action bar used to just animate larger and get populated as a window
                //$('div.rdr.rdr_actionbar').removeClass('rdr_actionbar').addClass('rdr_window').addClass('rdr_rewritable');

                var rindow = RDR.rindow.draw({
                    left:100,
                    top:100,
                    id: "rdr-loginPanel"
                });

                // store the arguments and callback function that were in progress when this Login panel was called
                rindow.data( 'args', args );
                rindow.data( 'callback', callback );

                // create the iframe containing the login panel
				var $loginHtml = $('<div class="rdr_login" />'),
				iframeUrl = RDR.session.iframeHost + "/fblogin/",
				parentUrl = window.location.href,
                parentHost = window.location.protocol + "//" + window.location.host;
				$loginHtml.append( '<h1>Log In</h1>',
				'<iframe id="rdr-xdm-login" src="' + iframeUrl + '?parentUrl=' + parentUrl + '&parentHost=' + parentHost + '&group_id='+RDR.groupPermData.group_id+'&cachebust='+RDR.cachebuster+'" width="300" height="300" />'
				);
				
				rindow.animate({
                    width:'500px',
                    minHeight:'125px'
                }, 300, function() {
					rindow.append( $loginHtml );
				});
			},
			logout : function() {}
		},
        actions : {
            aboutReadrBoard : function() {
                alert('Testing... Readrboard gives you more revenue and deeper engagement!');
            },
            bookmarkStart : function() {
                alert('Testing... This will be bookmarked!  Thanks!');
            },
            init : function(){
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
            initGroupData : function(groupShortName){
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
                        console.dir(response);
                        console.log('--------------------');
                        RDR.group = response.data;
						RDR.group.group_id

                        //todo:just for testing for now: - add defaults:
                        RDR.group.img_selector = RDR.group.img_selector || "div.container img";
                        RDR.group.selector_whitelist = RDR.group.selector_whitelist || "";

                        //todo: REMOVE THIS
                        RDR.group.blessed_tags = [
                        {
                            name: "Cute",
                            tid: 1
                        },
                        {
                            name: "Great Tip",
                            tid: 2
                        },
                        {
                            name: "Funny",
                            tid: 3
                        },
                        {
                            name: "Wait, what?",
                            tid: 4
                        }
                        ];
                        $RDR.dequeue('initAjax');
                    },
                    error: function(response){
                        console.warn(response)
                    }
                });
            },
            initUserData : function(userShortName){
                // request the RBGroup Data
                console.log("requesting user data")
                $.ajax({
                    url: "/api/rbuser/",
                    type: "get",
                    contentType: "application/json",
                    dataType: "jsonp",
                    data: {
                        short_name : userShortName
                    },
                    success: function(response, textStatus, XHR) {

                        console.log('rbuser call success')
                        console.dir(response);
                        console.log(XHR)

                        //get this from the DB?
                        //this.anno_whitelist = "#module-article p";

                        $.each(response, function(index, value){
                            var rb_group = value;
                            //Only expects back one user (index==0)
                            console.log('current user is ' + rb_user.name)

                        });

                    },
                    error: function(response){
                        console.warn(response);
                        console.warn('failed, but thats cool, we were expecting it to');
                        console.log('user is ', userShortName);
                    }
                });
            },
            initPageData : function(){
               //? do we want to model this here to be symetrical with user and group data?

                // TODO flesh out Porter's code below and incorporate it into the queue

                var url = window.location.href + window.location.hash;
				var canonical = ( $('link[rel="canonical"]').length > 0 ) ? $('link[rel="canonical"]').attr('href'):"";

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
						canonical_url: canonical
					},
					success: function(response) {
						RDR.page = response.data;
					}
				});
               
               //to be normally called on success of ajax call
               $RDR.dequeue('initAjax');
            },
            initEnvironment : function(){
                this.hashNodes();

                // init the img interactions
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
                    //use this instead of $().attr('src') to fix descrepencies between relative and absolute urls
				    src = this.src;

                    // builds a new actionbar or just returns the existing $actionbar if it exists.
				    var $actionbar = RDR.actionbar.draw({ left:left, top:top, content_type:"image", content:src, ignoreWindowEdges:"rb" });
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
                $(document).keyup(function(event) {
                    if (event.keyCode == '27') { //esc
                        RDR.rindow.closeAll();
                        RDR.actionbar.closeAll();
                    }
                    //todo - consider unifying style of close vs closeAll.  Should any of these components 'own' the others?  IE. should tooltips belong to the actionbar?
                });
				$RDR.dequeue('initAjax');
            },
            hashNodes : function() {
                console.log('hashing nodes');
                // snag all the nodes that we can set icons next to and send'em next
                // TODO: restrict this to the viewport + a few, rather than all
                var content_nodes = $( RDR.group.anno_whitelist ).not('.rdr-hashed');

                content_nodes.each( function() {

                    // get the node's text and smash case
                    // TODO: <br> tags and block-level tags can screw up words.  ex:
                    // hello<br>how are you?   here becomes
                    // hellohow are you?    <-- no space where the <br> was.  bad.
                    var node_text = $(this).html().replace(/< *br *\/?>/gi, '\n');
                    node_text = $( "<div>" + node_text + "</div>" ).text().toLowerCase();

                    // if there's any content...
                    if ( node_text && node_text!="undefined" && node_text.length > 5 ) {
                        // clean whitespace
                        node_text = RDR.util.cleanPara ( node_text );

                        // hash the text
                        var node_hash = RDR.util.md5.hex_md5( node_text );

                        // add an object with the text and hash to the nodes dictionary
                        if ( !RDR.content_nodes[node_hash] ) {
                            RDR.content_nodes[node_hash] = {};
                            RDR.content_nodes[node_hash].content = node_text;
                        }

                        // add a CSS class to the node that will look something like "rdr-207c611a9f947ef779501580c7349d62"
                        // this makes it easy to find on the page later
                        $(this).addClass( 'rdr-' + node_hash ).addClass('rdr-hashed');
						$(this).data('hash', node_hash);
                    }
                });

                RDR.actions.sendHashes();
            },
            sendHashes : function() {
                console.log('sending nodes');
                // TODO: dont' send all hashes

                var md5_list = [];
                for (var i in RDR.content_nodes ) {
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
                    url: "/api/containers/",
                    type: "get",
                    contentType: "application/json",
                    dataType: "jsonp",
                    data: {
                    	json: JSON.stringify(sendData)
                    },
                    success: function(response) {
                        var data = response.data;
    					// TODO: Eric, should this go in a jquery queue?
    					var sendData = {};
    					sendData.hashes = {};
    					console.log("data.unknown length: "+data.unknown.length);
					
    					if ( data.unknown.length > 0 ) {
    						$.each( data.unknown, function( index, value ) {
    							sendData.hashes[value] = RDR.content_nodes[value];
    						});
    						console.dir(sendData);

    						$.ajax({
    			                    url: "/api/containers/create/",
    			                    type: "get",
    			                    contentType: "application/json",
    			                    dataType: "jsonp",
    			                    data: {
    			                     	json: JSON.stringify(sendData)
    			                     },
    			                    success: function(response) {
    			                        console.dir(response);
    			                    }
    						});
    					}
					}
				});
			},
			sentimentBox : function(settings) {

                // draw the window over the actionbar
                var actionbarOffsets = settings.coords;

				$('.rdr_rewritable').removeClass('rdr_rewritable');

                //todo: weird, why did commenting this line out not do anything?...look into it
				//porter says: the action bar used to just animate larger and get populated as a window.  we can remove this.
                //$('div.rdr.rdr_actionbar').removeClass('rdr_actionbar').addClass('rdr_window').addClass('rdr_rewritable');
				if ( settings.content_type == "text" ) {
					actionbarOffsets.left = actionbarOffsets.left + 40;
					actionbarOffsets.top = actionbarOffsets.top + 35;
				}
                var rindow = RDR.rindow.draw({
                    left:actionbarOffsets.left,
                    top:actionbarOffsets.top,
					pnlWidth:200,
					ignoreWindowEdges:"bl",
					noHeader:true
                });

                // build the ratePanel

                var $sentimentBox = $('<div class="rdr_sentimentBox rdr_new" />'),
                // $selectedTextPanel = $('<div class="rdr_selectedTextPanel rdr_sntPnl" />'),
                $reactionPanel = $('<div class="rdr_reactionPanel rdr_sntPnl" />'),
                $whyPanel = RDR.actions.whyPanel.draw( rindow ),
                $blessedTagBox = $('<div class="rdr_blessedTagBox" />').append('<ul class="rdr_tags rdr_preselected" />'),
                $customTagBox = $('<div class="rdr_customTagBox rdr_sntPnl_padder" />'),
                $commentBox = $('<div class="rdr_commentBox" />'),
                $shareBox = $('<div class="rdr_shareBox" />'),
                $freeformTagInput = $('<input type="text" class="freeformTagInput" name="unknown-tags" />')//chain
                .blur(function(){
                    if($('.freeformTagInput').val() == "" ){
                        $('div.rdr_help').show();   
                    }
                }).focus(function(){
                   $tagTooltip.hide();
                }).keyup(function(event) {
                    if (event.keyCode == '13' || event.keyCode == '188' ) { //enter or comma
                        $whyPanel.find('.rdr_body').empty();
                        var customTag = {
                            name: $(this).val(),
                            tid: false
                        }
                        RDR.actions.rateSend({ tag:customTag, rindow:rindow, settings:settings, callback: function() {
                                // todo: at this point, cast the tag, THEN call this in the tag success function:
                                RDR.actions.whyPanel.expand(rindow);
                            }//end function
                        });//end rateSend
                    }
                    else if (event.keyCode == '27') { //esc
                        //return false;
                    }
                });
                var $tagTooltip = $('<div class="rdr_help">Add your own (ex. hip, woot)</div>').click(function(){            
                    $tagTooltip.hide();
                    $freeformTagInput.focus();
                });
                
                var headers = ["What's your reaction?", "Say More"];
                $sentimentBox.append($reactionPanel, $whyPanel); //$selectedTextPanel, 
                $sentimentBox.children().each(function(idx){
                    var $header = $('<div class="rdr_header" />').append('<div class="rdr_headerInnerWrap"><h1>'+ headers[idx] +'</h1></div>'),
                    $body = $('<div class="rdr_body"/>');
                    $(this).append($header, $body).css({
                        'width':rindow.settings.pnlWidth
                    });
                });
                RDR.actions.whyPanel.setup(rindow);

                //populate selectedTextPanel
				//$selectedTextPanel.find('div.rdr_body').append( '<div class="rdr_selected"><em></em><div class="rdr_arrow"></div></div>' );

                //populate reactionPanel

                $reactionPanel.find('div.rdr_body').append($blessedTagBox, $customTagBox);
                ////populate blesed_tags
                $.each(RDR.group.blessed_tags, function(idx, val){
                    var $li = $('<li />').data({
                        'tag':parseInt( val.tid )
                    }).append('<a href="javascript:void(0);">'+val.name+'</a><div class="rdr_arrow"></div>');
                    
                    $blessedTagBox.children('ul.rdr_tags').append($li);
                });

                ////customTagDialogue - develop this...
                $customTagBox.append($freeformTagInput, $tagTooltip)//chain
                .add($tagTooltip);

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
                    minHeight: rindow.settings.height +'px',
                }, rindow.settings.animTime, function() {
					$(this).css('width','auto');
					rindow.append($sentimentBox);
					
                    
					if ( settings.content_type == "text" ) {
                       rindow.find('div.rdr_selectedTextPanel em').text( settings.content );
					} else if ( settings.content_type == "image" ) {
						rindow.find('div.rdr_selectedTextPanel em').css('text-align','center').html( '<img style="max-width:100%;max-height:600px;" src=" ' + settings.content + '" />' );
					}

                    // enable the "click on a blessed tag to choose it" functionality.  just css class based.
                    rindow.find('ul.rdr_preselected li').click(function() {
                        if ( $(this).hasClass('rdr_selected') ){
                            $(this).removeClass('rdr_selected');
                        }else{
                            $(this).addClass('rdr_selected');
                            $(this).siblings().removeClass('rdr_selected');
                            $(this).parents('div.rdr.rdr_window').removeClass('rdr_rewritable');
                                
                            $whyPanel.find('.rdr_body').empty();
                            RDR.actions.rateSend({ tag:$(this).data('tag'), rindow:rindow, settings:settings, callback: function() {
                                    // todo: at this point, cast the tag, THEN call this in the tag success function:
                                    RDR.actions.whyPanel.expand(rindow);
                                }//end function
                            });//end rateSend
                        }
                    });
                });
            },
			whyPanel: {
                draw: function(rindow, interaction_id) {
                    var $whyPanel = $('<div class="rdr_whyPanel rdr_sntPnl" />').prepend($('<div class="rdr_pnlShadow"/>'));
                    return $whyPanel;
                },
                setup: function(rindow){
                    $(rindow).find('.rdr_whyPanel').children('.rdr_header, .rdr_body').css({
                        'width': rindow.settings.pnlWidth +'px',
                        'right':'0',
                        'position':'absolute'
                    });
                },
                expand: function(rindow, interaction_id){
                    $whyPanel = $(rindow).find('.rdr_whyPanel');
                    //temp hack
                    if( $whyPanel.data('expanded') ){

                    }
                    else{
                        $(rindow).animate({
                            width: (2 * rindow.settings.pnlWidth) +'px'
                        }, rindow.settings.animTime, function() {
                        });   
                    }
                    $whyPanel.data('expanded', true);
                },
                collapse: function(rindow){
                    $whyPanel = $(rindow).find('.rdr_whyPanel');
                    $whyPanel.animate({
                        width: rindow.settings.pnlWidth +'px'
                    }, rindow.settings.animTime, function() {
                        //pass for now
                    });
                    //todo: this is a temp work around - i don't like these simotaneous animations
                    $('.rdr_sentimentBox').animate({
                        width: 2* (rindow.settings.pnlWidth) +'px'
                    }, rindow.settings.animTime, function() {
                        //pass for now
                    });
                },
                //todo, fix naming
                subBoxes: [],
                newSubBox: function(){
                }              
			},
            rateSend : function(args) {
                
                //example:
                //tag:{name, id}, rindow:rindow, settings:settings, callback: 
			 	
                // tag can be an ID or a string.  if a string, we need to sanitize.
				
				// tag, rindow, settings, callback

                // TODO the args & params thing here is confusing
                RDR.session.checkUser( args, function( params ) {
    
                    // get the text that was highlighted
                    var content = $.trim( params.settings.content );
                    var container = $.trim( params.settings.container );


                    var sendData = {
                        "tag" : params.tag,
                        "hash": container,
                        "content" : content,
                        "content_type" : params.settings.content_type,
                        "user_id" : RDR.user.user_id,
                        "readr_token" : RDR.user.readr_token,
                        "group_id" : RDR.groupPermData.group_id,
                        "page_id" : RDR.page.id
                    };

                    // send the data!
                    $.ajax({
                        url: "/api/tag/create/",
                        type: "get",
                        contentType: "application/json",
                        dataType: "jsonp",
                        data: { json: JSON.stringify(sendData) },
                        success: function(response) {
                            console.dir(response);
                            //[eric] - if we want these params still we need to get them from args:
                            //do we really want to chain pass these through?  Or keep them in a shared scope?
                            //RDR.actions.shareStart(rindow, known_tags, unknown_tags_arr);

                            RDR.actions.shareStart( {rindow:params.rindow, tag:params.tag, int_id:response.data });
                            // params.callback();
                        },
                        //for now, ignore error and carry on with mockup
                        error: function(response) {
                            console.log("an error occurred while trying to tag");
                        }
                    });
                });
            },
            shareStart : function(args) {
                var rindow = args.rindow, 
                    tag = args.tag,
                    int_id = args.int_id;
                //todo: for now, I'm just passing in known_tags as a param, but check with Porter about this model.
                //Where is the 'source'/'point of origin' that is the authority of known_tags - I'd think we'd want to just reference that..

                //console.log(rindow, known_tags, unknown_tags_arr);
                
                /*        
                var tags = "";
                console.log(tags);

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


                console.log(tags)
                
                */

                var $shareDialogueBox = $('<div class="rdr_shareBox rdr_sntPnl_padder"></div>')

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
                var $commentBox =  $('<div class="rdr_share"><textarea class="commentBox">' + helpText+ '</textarea><button>Comment</button></div>');
                $commentBox.find('textarea').focus(function(){
                    if($('.commentBox').val() == helpText ){
                        $('.commentBox').val('');
                    }
                }).blur(function(){
                    if($('.commentBox').val() == "" ){
                        $('.commentBox').val(helpText);
                    }
                }).keyup(function(event) {
                    if (event.keyCode == '13') { //enter or comma
                        //RDR.actions.whyPanel.expand(rindow);
                    }
                    else if (event.keyCode == '27') { //esc
                        //return false;
                    }
                });

                $commentBox.find('button').click(function(){
                    $(this).closest('.rdr_share').css({'visibility':'hidden'});
                    $(this).closest('.rdr_body').children('.rdr_commentFeedback')
                    .find('.rdr_tagFeedback').hide().end()//chain
                    .find('.rdr_commentComplete').text('Thanks for your comment.')
                });
                var $socialBox = $('<div class="rdr_share_social"><strong>Share your reaction</strong></div>'),
                $shareLinks = $('<ul class="shareLinks"></ul>'),
                socialNetworks = ["facebook","twitter","tumblr","linkedin"];

                //quick mockup version of this code
                $.each(socialNetworks, function(idx, val){
                    $shareLinks.append('<li><a href="http://' +val+ '.com" ><img src="/static/ui-prototype/images/social-icons-loose/social-icon-' +val+ '.png" /></a></li>')
                });
                $socialBox.append($shareLinks);

                //TODO this is prototype code for demo.  fix it.
                $shareDialogueBox.append($commentBox, $socialBox);
                var $commentFeedback = $('<div class="rdr_commentFeedback rdr_sntPnl_padder"> <div class="rdr_tagFeedback">You tagged this '+tag.name+'</div> <div class="rdr_commentComplete"></div> </div>');
                rindow.find('.rdr_whyPanel .rdr_body').append($commentFeedback, $shareDialogueBox);
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
            startSelect : function(e) {
                // make a jQuery object of the node the user clicked on (at point of mouse up)
                var mouse_target = $(e.target),
				selection = {};
				
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
                    if ( selection.sel.text && selection.sel.text.length > 3 && selection.sel.text.indexOf(" ") != -1 ) {

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
                                // this can be commented on if it's long enough and has at least one space (two words or more)
                                RDR.actionbar.draw({
                                    left:parseInt(e.pageX),
                                    top:parseInt(e.pageY)+7,
									content_type:"text",
									content:selection.content,
									container:selection.container
                                });

                            // TODO: also should detect if selection has an image, embed, object, audio, or video tag in it
                            } else {
                                RDR.actionbar.draw({
                                    left:parseInt(e.pageX),
                                    top:parseInt(e.pageY),
									content_type:"text",
									content:selection.content,
									container:selection.container,
                                    cant_comment:true
                                });
                            }
                        }
                    }
                }
            },
            selectedText : function(win) {
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

// jquery plugins to be calld above with $R on the getjQuery callback

/* jquery json v2.2 */
/* http://code.google.com/p/jquery-json/ */
function rdr_jqueryJSON($){
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

function rdr_postMessage($) {
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

//load jQuery overwriting the client's jquery, create our $R clone, and revert the client's jquery back
loadScript("/static/ui-prototype/js/jquery-1.4.4.min.js", function(){
    //callback

    //load jQuery UI while the $ and jQuery still refers to our new version
    loadScript("/static/ui-prototype/js/jquery-ui-1.8.6.custom.min.js", function(){
        //callback

        //test that $.ui versioning is working correctly
        // console.log("testing jQuery UI versioning...")
        // console.log("before the $.noConflict call the $.ui.version still refers to ours version = " + $.ui.version)
        
        //within this scope while the $ refers to our version of jQuery, attach it to our Global var $R at least for now, for testing later
        //todo - I don't think it really matters, but consider making this just local later
        $R = $.noConflict(true);

        //test that $.ui versioning is working correctly
        // console.log("after the $.noConflict call, the $.ui.version reverts back to refering to the clients - version = " + $.ui.version)
        // console.log("of course $R.ui.version should show our version - version = " + $R.ui.version)

        //call scripts that depend on our jQuery version to be loaded
        $RFunctions($R);

    });
});


function $RFunctions($R){
    //called after our version of jQuery is loaded

    //init the jquery-json plugin
    rdr_jqueryJSON($R);

	//init Ben Alman's postMessage jquery plugin
	rdr_postMessage($R);
	
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
    console.log(a)


    //show that objects really are unique
    console.log("test that our jQuery copy is unique...")
    $.client = "client";
    $R.rb = "rb";
    console.log($.client)   //"client"
    console.log($R.client)  //undefined
    console.log($R.rb)      //"rb"
    console.log($.rb)       //undefined
    */  //end comment out testing:

	//////////////////// TODO: TEST DATA //////////////////

    //[eric]: blessed_tags is ready to be taken from the DB, but we need to decide what the model looks like - right now it's just a charfield
	RDR.group.blessed_tags = [
	{
	    name: "Great!",
	    tid: 1
	},
	{
	    name: "Hate",
	    tid: 2
	},
	{
	    name: "Interesting",
	    tid: 3
	},
	{
	    name: "Booooring",
	    tid: 4
	}
	];
}
//test commit...