
console.log($)
var jQueryVersion = "1.4.4",
RDR, //our global RDR object
$R = {}, //init var: our clone of jQuery
client$ = {}; //init var: clients copy of jQuery


//Our Readrboard function that builds the RDR object which gets returned into the global scope.
//This function gets called above in
function readrBoard($R){

    var $ = $R;

    var RDR = RDR ? RDR : {}
    // none of this obj's properties are definite.  just jotting down a few ideas.
    RDR = {
        data : {
            nodes : []
        },
        group : {
            short_name : "dc",
            hashable_nodes : "#module-article p"
        },
        user : {
            short_name:		"JoeReadrOnFB",
            first_name:		"Joe",
            last_name:		"Readr",
            status:		"full",
            auth_token: 	"1234567890"
        },
        errors : {
            actionbar: {
                rating:"",
                commenting:""
            }
        },
        why : {},
        styles : {
        /*
		page: 	"<style type='text/css'>"+
				"body 		{background:#fff;}" +
				"body p		{}" +
				"</style>"
		*/
        },
        rindow : {
            // content comes later.  this is just to identify or draw the container.
            draw: function() {
                // for now, any window closes all tooltips
                RDR.tooltip.closeAll();
			
                var width = arguments[0].width ? arguments[0].width:400;
                var x = arguments[0].x ? arguments[0].x:100;
                var y = arguments[0].y ? arguments[0].y:100;

                new_rindow = $('div.rdr.rdr_window.rdr_rewritable'); // jquery obj of the rewritable window
                if ( new_rindow.length == 0 ) { // there's no rewritable window available, so make one
                    new_rindow = $('<div class="rdr rdr_window rdr_rewritable" style="max-width:' + width + 'px;"></div>');
                    $('body').append( new_rindow );
                }
			
                if ( new_rindow.find('h1').length == 0 ) {
                    new_rindow.html('');
                    new_rindow.append( '<div class="rdr_close">x</div><h1></h1><div class="rdr rdr_contentSpace"></div>' );
                    new_rindow.find('div.rdr_close').click( function() {
                        $(this).parents('div.rdr.rdr_window').remove();
                    } );
                    new_rindow.draggable({
                        handle:'h1',
                        containment:'document',
                        stack:'.RDR.window',
                        start:function() {
                            $(this).removeClass('rdr_rewritable');
                        }
                    });

                }
                // TODO: this probably should pass in the rindow and calculate, so that it can be done on the fly
                var coords = RDR.util.stayInWindow(x,y,width,300);
                new_rindow.css('left', coords.x + 'px');
                new_rindow.css('top', coords.y + 'px');
                RDR.actionbar.close();
                return new_rindow;
            },
            closeAll: function() {
                console.log('closeAll');
                $('div.rdr.rdr_window').remove();
            }
        },
        actionbar : {
            draw: function() {

                if ( $('div.rdr.rdr_actionbar').length == 0 ) {
                    var x = arguments[0].x ? (arguments[0].x-34) : 100;
                    var y = arguments[0].y ? (arguments[0].y-45) : 100;
                    //console.dir( arguments[0] );
                    var coords = RDR.util.stayInWindow(x,y,200,30);
					
                    // TODO use settings check for certain features and content types to determine which of these to disable
                    var new_actionbar = $('<div class="rdr rdr_actionbar" style="left:' + coords.x + 'px;top:' + coords.y + 'px;">' +
                        '<a href="javascript:void(0);" onclick="RDR.actions.aboutReadrBoard();" class="rdr_icon_about">What\' This?</a>' +
                        '<span class="rdr_divider">&nbsp;</span>' +
                        '<a href="javascript:void(0);" onclick="RDR.actions.rateStart({content_type:\''+arguments[0].content_type+'\',content:\''+arguments[0].content+'\'});" class="rdr_icon_rate">Rate This</a>' +
                        // TODO: make all of these also have a set of arguments pass in
                        '<a href="javascript:void(0);" onclick="RDR.actions.searchStart();" class="rdr_icon_search">Search For This</a>' +
                        '<a href="javascript:void(0);" onclick="RDR.actions.bookmarkStart();" class="rdr_icon_bookmark">Bookmark This</a>' +
                        '<a href="javascript:void(0);" onclick="RDR.actions.commentStart();" class="rdr_icon_comment">Comment On This</a>' +
                        '<a href="javascript:void(0);" onclick="RDR.actions.shareStart();" class="rdr_icon_share">Share This</a>' +
                        '</div>');

                    $('body').append( new_actionbar );
				
                    $('div.rdr_actionbar a').hover(
                        function() {
                            var this_link = $(this);
                            var tooltip_args = {
                                name: this_link.attr('class'),
                                message: this_link.text(),
                                offset_x: -35,
                                offset_y: -35,
                                obj: this_link
                            };
                            RDR.tooltip.draw( tooltip_args );
                        },
                        function () {
                            var this_link = $(this);
                            $( '#rdr_tooltip_' + this_link.attr('class') ).remove();
                        }
                        );
                }
            },
            close: function() {
                $('div.rdr.rdr_actionbar').remove();
            }
        },
        tooltip : {
            draw: function() {
                // expected arguments:
                // message (HTML)
                // obj (to position tooltip next to.  should be a jQ obj).  if absent, position with the mouse.
                // offset_x, offset_y (optional): how many pixels to shit the tooltip from the passed-in object
                var new_tooltip = $('<div class="rdr rdr_tooltip" id="rdr_tooltip_' + arguments[0].name + '">' +
                    '<div class="rdr rdr_tooltip-content"> ' + arguments[0].message + '</div>'+
                    '<div class="rdr rdr_tooltip-arrow-border"></div>'+
                    '<div class="rdr rdr_tooltip-arrow"></div>'+
                    '</div>');
			
                if (arguments[0].obj) {
                    var coords = arguments[0].obj.offset();
                    var offset_x = (arguments[0].offset_x) ? arguments[0].offset_x:0;
                    var offset_y = (arguments[0].offset_y) ? arguments[0].offset_y:0;
                    var x = coords.left + parseInt( offset_x );
                    var y = coords.top + parseInt( offset_y );
                } else {
                // mouse, if we want it.
                }
			
                if ( x && y ) {
                    // show the tooltip
                    $('body').append( new_tooltip );
                    new_tooltip.animate( {
                        opacity:1
                    },333);
				
                    // now that it's in the page, position it (in part based on its calculated height);
                    new_tooltip.css('left', x + 'px');
                    new_tooltip.css('top', (y - new_tooltip.height()) + 'px');
                }
            },
            closeAll: function() {
                $( 'div.rdr_tooltip' ).remove();
            }
        },
        util : {
            stayInWindow : function(x,y,w,h) {
                var coords = {};
                var rWin = $(window);
                var winWidth = rWin.width();
                var winHeight = rWin.height();
                var winScroll = rWin.scrollTop();
                if ( (x+w+16) >= winWidth ) {
                    x = winWidth - w - 36;
                }
                if ( (y+h) > winHeight + winScroll ) {
                    y = winHeight + winScroll - h + 75;
                }
                if ( x < 10 ) x = 10;
                if ( y - winScroll < 10 ) y = winScroll + 10;
                coords.x = x;
                coords.y = y;
                return coords;
            },
            md5 : {
                hexcase:0,
                b64pad:"",
                chrsz:8,
                hex_md5 : function(s){
                    return RDR.util.md5.binl2hex(RDR.util.md5.core_md5(RDR.util.md5.str2binl(s),s.length*RDR.util.md5.chrsz));
                },
                core_md5 : function(x,len){
                    x[len>>5]|=0x80<<((len)%32);
                    x[(((len+64)>>>9)<<4)+14]=len;
                    var a=1732584193;
                    var b=-271733879;
                    var c=-1732584194;
                    var d=271733878;
                    for(var i=0;i<x.length;i+=16){
                        var olda=a;
                        var oldb=b;
                        var oldc=c;
                        var oldd=d;
                        a=RDR.util.md5.md5_ff(a,b,c,d,x[i+0],7,-680876936);
                        d=RDR.util.md5.md5_ff(d,a,b,c,x[i+1],12,-389564586);
                        c=RDR.util.md5.md5_ff(c,d,a,b,x[i+2],17,606105819);
                        b=RDR.util.md5.md5_ff(b,c,d,a,x[i+3],22,-1044525330);
                        a=RDR.util.md5.md5_ff(a,b,c,d,x[i+4],7,-176418897);
                        d=RDR.util.md5.md5_ff(d,a,b,c,x[i+5],12,1200080426);
                        c=RDR.util.md5.md5_ff(c,d,a,b,x[i+6],17,-1473231341);
                        b=RDR.util.md5.md5_ff(b,c,d,a,x[i+7],22,-45705983);
                        a=RDR.util.md5.md5_ff(a,b,c,d,x[i+8],7,1770035416);
                        d=RDR.util.md5.md5_ff(d,a,b,c,x[i+9],12,-1958414417);
                        c=RDR.util.md5.md5_ff(c,d,a,b,x[i+10],17,-42063);
                        b=RDR.util.md5.md5_ff(b,c,d,a,x[i+11],22,-1990404162);
                        a=RDR.util.md5.md5_ff(a,b,c,d,x[i+12],7,1804603682);
                        d=RDR.util.md5.md5_ff(d,a,b,c,x[i+13],12,-40341101);
                        c=RDR.util.md5.md5_ff(c,d,a,b,x[i+14],17,-1502002290);
                        b=RDR.util.md5.md5_ff(b,c,d,a,x[i+15],22,1236535329);
                        a=RDR.util.md5.md5_gg(a,b,c,d,x[i+1],5,-165796510);
                        d=RDR.util.md5.md5_gg(d,a,b,c,x[i+6],9,-1069501632);
                        c=RDR.util.md5.md5_gg(c,d,a,b,x[i+11],14,643717713);
                        b=RDR.util.md5.md5_gg(b,c,d,a,x[i+0],20,-373897302);
                        a=RDR.util.md5.md5_gg(a,b,c,d,x[i+5],5,-701558691);
                        d=RDR.util.md5.md5_gg(d,a,b,c,x[i+10],9,38016083);
                        c=RDR.util.md5.md5_gg(c,d,a,b,x[i+15],14,-660478335);
                        b=RDR.util.md5.md5_gg(b,c,d,a,x[i+4],20,-405537848);
                        a=RDR.util.md5.md5_gg(a,b,c,d,x[i+9],5,568446438);
                        d=RDR.util.md5.md5_gg(d,a,b,c,x[i+14],9,-1019803690);
                        c=RDR.util.md5.md5_gg(c,d,a,b,x[i+3],14,-187363961);
                        b=RDR.util.md5.md5_gg(b,c,d,a,x[i+8],20,1163531501);
                        a=RDR.util.md5.md5_gg(a,b,c,d,x[i+13],5,-1444681467);
                        d=RDR.util.md5.md5_gg(d,a,b,c,x[i+2],9,-51403784);
                        c=RDR.util.md5.md5_gg(c,d,a,b,x[i+7],14,1735328473);
                        b=RDR.util.md5.md5_gg(b,c,d,a,x[i+12],20,-1926607734);
                        a=RDR.util.md5.md5_hh(a,b,c,d,x[i+5],4,-378558);
                        d=RDR.util.md5.md5_hh(d,a,b,c,x[i+8],11,-2022574463);
                        c=RDR.util.md5.md5_hh(c,d,a,b,x[i+11],16,1839030562);
                        b=RDR.util.md5.md5_hh(b,c,d,a,x[i+14],23,-35309556);
                        a=RDR.util.md5.md5_hh(a,b,c,d,x[i+1],4,-1530992060);
                        d=RDR.util.md5.md5_hh(d,a,b,c,x[i+4],11,1272893353);
                        c=RDR.util.md5.md5_hh(c,d,a,b,x[i+7],16,-155497632);
                        b=RDR.util.md5.md5_hh(b,c,d,a,x[i+10],23,-1094730640);
                        a=RDR.util.md5.md5_hh(a,b,c,d,x[i+13],4,681279174);
                        d=RDR.util.md5.md5_hh(d,a,b,c,x[i+0],11,-358537222);
                        c=RDR.util.md5.md5_hh(c,d,a,b,x[i+3],16,-722521979);
                        b=RDR.util.md5.md5_hh(b,c,d,a,x[i+6],23,76029189);
                        a=RDR.util.md5.md5_hh(a,b,c,d,x[i+9],4,-640364487);
                        d=RDR.util.md5.md5_hh(d,a,b,c,x[i+12],11,-421815835);
                        c=RDR.util.md5.md5_hh(c,d,a,b,x[i+15],16,530742520);
                        b=RDR.util.md5.md5_hh(b,c,d,a,x[i+2],23,-995338651);
                        a=RDR.util.md5.md5_ii(a,b,c,d,x[i+0],6,-198630844);
                        d=RDR.util.md5.md5_ii(d,a,b,c,x[i+7],10,1126891415);
                        c=RDR.util.md5.md5_ii(c,d,a,b,x[i+14],15,-1416354905);
                        b=RDR.util.md5.md5_ii(b,c,d,a,x[i+5],21,-57434055);
                        a=RDR.util.md5.md5_ii(a,b,c,d,x[i+12],6,1700485571);
                        d=RDR.util.md5.md5_ii(d,a,b,c,x[i+3],10,-1894986606);
                        c=RDR.util.md5.md5_ii(c,d,a,b,x[i+10],15,-1051523);
                        b=RDR.util.md5.md5_ii(b,c,d,a,x[i+1],21,-2054922799);
                        a=RDR.util.md5.md5_ii(a,b,c,d,x[i+8],6,1873313359);
                        d=RDR.util.md5.md5_ii(d,a,b,c,x[i+15],10,-30611744);
                        c=RDR.util.md5.md5_ii(c,d,a,b,x[i+6],15,-1560198380);
                        b=RDR.util.md5.md5_ii(b,c,d,a,x[i+13],21,1309151649);
                        a=RDR.util.md5.md5_ii(a,b,c,d,x[i+4],6,-145523070);
                        d=RDR.util.md5.md5_ii(d,a,b,c,x[i+11],10,-1120210379);
                        c=RDR.util.md5.md5_ii(c,d,a,b,x[i+2],15,718787259);
                        b=RDR.util.md5.md5_ii(b,c,d,a,x[i+9],21,-343485551);
                        a=RDR.util.md5.safe_add(a,olda);
                        b=RDR.util.md5.safe_add(b,oldb);
                        c=RDR.util.md5.safe_add(c,oldc);
                        d=RDR.util.md5.safe_add(d,oldd);
                    }
                    return Array(a,b,c,d);
                },
                md5_cmn : function(q,a,b,x,s,t){
                    return RDR.util.md5.safe_add(RDR.util.md5.bit_rol(RDR.util.md5.safe_add(RDR.util.md5.safe_add(a,q),RDR.util.md5.safe_add(x,t)),s),b);
                },
                md5_ff : function(a,b,c,d,x,s,t){
                    return RDR.util.md5.md5_cmn((b&c)|((~b)&d),a,b,x,s,t);
                },
                md5_gg : function(a,b,c,d,x,s,t){
                    return RDR.util.md5.md5_cmn((b&d)|(c&(~d)),a,b,x,s,t);
                },
                md5_hh : function(a,b,c,d,x,s,t){
                    return RDR.util.md5.md5_cmn(b^c^d,a,b,x,s,t);
                },
                md5_ii : function(a,b,c,d,x,s,t){
                    return RDR.util.md5.md5_cmn(c^(b|(~d)),a,b,x,s,t);
                },
                safe_add : function(x,y){
                    var lsw=(x&0xFFFF)+(y&0xFFFF);
                    var msw=(x>>16)+(y>>16)+(lsw>>16);
                    return(msw<<16)|(lsw&0xFFFF);
                },
                bit_rol : function(num,cnt){
                    return(num<<cnt)|(num>>>(32-cnt));
                },
                str2binl : function(str){
                    var bin=Array();
                    var mask=(1<<RDR.util.md5.chrsz)-1;
                    for(var i=0;i<str.length*RDR.util.md5.chrsz;i+=RDR.util.md5.chrsz){
                        bin[i>>5]|=(str.charCodeAt(i/RDR.util.md5.chrsz)&mask)<<(i%32);
                    }
                    return bin;
                },
                binl2hex : function(binarray){
                    var hex_tab=RDR.util.md5.hexcase?"0123456789ABCDEF":"0123456789abcdef";
                    var str="";
                    for(var i=0;i<binarray.length*4;i++){
                        str+=hex_tab.charAt((binarray[i>>2]>>((i%4)*8+4))&0xF)+hex_tab.charAt((binarray[i>>2]>>((i%4)*8))&0xF);
                    }
                    return str;
                }
            },
            cleanPara : function(para) {
                // common function for cleaning the paragraph.  right now, it's removing spaces, tabs, newlines, and then double spaces
                if(para != "") {
                    return para.replace(/[\n\r\t]+/gi,' ').replace().replace(/\s{2,}/g,' ');
                }
            }
        },
        actions : {
            aboutReadrBoard : function() {
                return true;
            },
            initGroupData : function(groupShortName){
                // request the RBGroup Data

                console.log("requesting rbgroup data")
                console.log(groupShortName)
                $.ajax({
                    url: "/api/rbgroup",
                    type: "get",
                    contentType: "application/json",
                    dataType: "jsonp",
                    data: {
                        short_name : groupShortName
                    },
                    success: function(data, textStatus, XHR) {

                        console.log('rbgroup call success')
                        console.dir(data);
                        console.log(XHR)

                        //get this from the DB?
                        //this.hashable_nodes = "#module-article p";

                        $.each(data, function(index, value){
                            var rb_group = value;
                            //Only expects back one group (index==0)
                            console.log('current group is ' + rb_group.name)
                            console.log(rb_group.name +' requests that RB not touch anything with the class ' + rb_group.selector_blacklist)

                            //not working
                            //console.log(rb_group.tag_whitelist);
                            //var tag_whitelist = $.evalJSON(rb_group.tag_whitelist);
                            //console.log(tag_whitelist);
                            //console.log(3);
                            //RDR.group.blessed_tags = tag_whitelist;
                            RDR.group.blessed_tags = [
                            {
                                name: "Great!",
                                tid: 0
                            },
                            {
                                name: "Hate",
                                tid: 1
                            },
                            {
                                name: "Interesting",
                                tid: 2
                            },
                            {
                                name: "Boooooring",
                                tid: 3
                            }
                            ];
                        });

                    //expects back
                    /*
                        name = models.CharField(max_length=250)
                        short_name = models.CharField(max_length=25)
                        selector_whitelist = models.TextField(blank=True)
                        selector_blacklist = models.TextField(blank=True)
                        tag_whitelist = models.TextField(blank=True)
                        tag_blacklist = models.TextField(blank=True)
                        css_url = models.URLField() #do we need 'blank=True, null=True' here right?
                         */
                    },
                    error: function(XHR){
                    //console.warn(XHR)
                    }
                });

                // the following lines should go into the ajax call success function
                // START
                // TODO: TEST DATA
                RDR.group.img_selector = "div.container img";
                RDR.group.selector_whitelist = "";
				
                // init the img interactions
                $( RDR.group.img_selector ).live( 'mouseover', function() {
                    if ( typeof rdr_img_actionicon != 'undefined' ) clearTimeout( rdr_img_actionicon );
                    RDR.actionbar.close();
					
                    // check that the image is large enough?
                    // TODO keep the actionbar in the window
                    // TODO image needs to show in rate window
                    // TODO all image functions need CURRENT URL (incl. hash) + IMG SRC URL for rating, SHARING, etc.
                    // TODO show activity on an image, without breaking page nor covering up image.
                    // create a container for the image, give it same styles but more space?
                    // like, inline or float, but with RDR stuff
                    var this_img = $(this);
                    var x = this_img.offset().left + 25;
                    var y = this_img.offset().top + this_img.height() + 25;
                    RDR.actionbar.draw({
                        x:x,
                        y:y,
                        content_type:"image",
                        content:this_img.attr('src')
                    });

                    $('div.rdr.rdr_actionbar').css('overflow','hidden');
                    $('div.rdr.rdr_actionbar').width(23);
				
                    $('div.rdr.rdr_actionbar').hover( function() {
                        clearTimeout( rdr_img_actionicon );
                        // the following if statement seems unnecessary, but it is not.
                        if ( $(this).hasClass('rdr_actionbar') ) $(this).animate( {
                            width:174
                        },100 );
                    },
                    function() {
                        // the following if statement seems unnecessary, but it is not.
                        if ( $(this).hasClass('rdr_actionbar') ) $(this).remove();
                    }
                    );

                }).live('mouseleave', function() {
                    rdr_img_actionicon = setTimeout( "RDR.actionbar.close()", 150);
                });
            // END
            },
            initUserData : function(userShortName){
                // request the RBGroup Data
                console.log("requesting user data")
                $.ajax({
                    url: "/api/rbuser",
                    type: "get",
                    contentType: "application/json",
                    dataType: "jsonp",
                    data: {
                        short_name : userShortName
                    },
                    success: function(data, textStatus, XHR) {

                        console.log('rbuser call success')
                        console.dir(data);
                        console.log(XHR)

                        //get this from the DB?
                        //this.hashable_nodes = "#module-article p";

                        $.each(data, function(index, value){
                            var rb_group = value;
                            //Only expects back one user (index==0)
                            console.log('current user is ' + rb_user.name)

                        });

                    },
                    error: function(XHR){
                        console.warn(XHR)
                        console.warn('failed, but thats cool, we were expecting it to');
                        console.log('user is ', userShortName);
                    }
                });
            },
            init : function(){
                var groupShortName = RDR.group.short_name;
                var userShortName = RDR.user.short_name;

                this.hashNodes();
                this.initGroupData(groupShortName);
                //this.initUserData(userShortName);

                //$('body').bind('mouseup.rdr', this.startSelect );
                //change to document instead of body - click events weren't getting picked up in the margin
                $(document).bind('mouseup.rdr', this.startSelect );

                //add escape keypress event to document to close all rindows
                $(document).keyup(function(event) {
                    if (event.keyCode == '27') { //esc
                        RDR.rindow.closeAll();
                        RDR.actionbar.close();
                    }
                });

            },
            hashNodes : function() {
                console.log('hashing nodes');
                // snag all the nodes that we can set icons next to and send'em next
                // TODO: restrict this to the viewport + a few, rather than all
                var content_nodes = $( RDR.group.hashable_nodes ).not('rdr-hashed');

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
                        if ( !RDR.data.nodes[node_hash] ) RDR.data.nodes[node_hash] = node_text;
				
                        // add a CSS class to the node that will look something like "rdr-207c611a9f947ef779501580c7349d62"
                        // this makes it easy to find on the page later
                        $(this).addClass( 'rdr-' + node_hash ).addClass('rdr-hashed');
                    }
                });
			
                RDR.actions.sendHashes();
            },
            sendHashes : function() {
                console.log('sending nodes');
                // TODO: dont' send all hashes
			
                var md5_list = [];
                for (var i in RDR.data.nodes ) {
                    md5_list.push( i );
                }

                // send the data!
                $.ajax({
                    url: "/api/nodes",
                    type: "get",
                    contentType: "application/json",
                    dataType: "jsonp",
                    data: {
                        short_name : RDR.group.short_name,
                        pageID : 1,
                        hashes : md5_list
                    },
                    success: function(data) {
                        console.dir(data);
                    }
                });
            },
            rateStart : function() {
                // draw the window over the actionbar
                var actionbarOffsets = $('div.rdr.rdr_actionbar').offset();
				
                $('.rdr_rewritable').removeClass('rdr_rewritable');

                $('div.rdr.rdr_actionbar').removeClass('rdr_actionbar').addClass('rdr_window').addClass('rdr_rewritable');
                var rindow = RDR.rindow.draw({
                    x:actionbarOffsets.left,
                    y:actionbarOffsets.top
                });
			
                // write content to the window
                var rateStartContent = '<em class="rdr_selected-text"></em><ul class="rdr_tags rdr_preselected">';
                for (var i=0,j=RDR.group.blessed_tags.length; i<j; i++) {
                    rateStartContent += '<li tid="'+RDR.group.blessed_tags[i].tid+'"><a href="javascript:void(0);">'+RDR.group.blessed_tags[i].name+'</a></li>';
                }
                rateStartContent += '</ul>' +
                '<div class="rdr_instruct">Add your own ratings, separated by comma:</div>' +
                '<input type="text" name="unknown-tags" />' +
                '<button>Rate</button>' +
                '<div class="rdr_help">e.g., Love this, autumn, insightful</div>';

                var content_type = arguments[0].content_type;
                var content = arguments[0].content;

                // add content and animate the actionbar to accommodate it
                rindow.animate({
                    width:'400px',
                    minHeight:'125px'
                }, 300, function() {
                    rindow.find('div.rdr_contentSpace').append( rateStartContent );
                    rindow.find('h1').text('Rate This');

                    if ( content_type == "text" ) {
                        rindow.find('em.rdr_selected-text').html( unescape(content) );
                    } else if ( content_type == "image" ) {
                        // rindow.find('em.rdr_selected-text').css('text-align','center').html( '<img style="max-width:100%;max-height:600px;" src=" ' + content + '" />' );
                        rindow.find('em.rdr_selected-text').hide();
                        rindow.find('h1').text('Rate This Image');
                    }
				
                    // enable the "click on a blessed tag to choose it" functionality.  just css class based.
                    rindow.find('ul.rdr_preselected li').toggle(
                        function() {
                            $(this).addClass('rdr_selected');
                            $(this).parents('div.rdr.rdr_window').removeClass('rdr_rewritable');
                        },
                        function() {
                            $(this).removeClass('rdr_selected');
                        }
                        );
				
                    // bind the button with a function (since this isn't in a <form>)
                    rindow.find('button').click( function() {
                        RDR.actions.rateSend( rindow );
                    });

                });
            },
            rateSend : function(rindow) {
                // get the user-added tags from the input field
                var unknown_tags = rindow.find('input[name="unknown-tags"]').val();
                // get the blessed tags the user chose, by checking for the css class
                var known_tags = [];
                rindow.find('ul.rdr_preselected li.rdr_selected').each( function() {
                    known_tags.push( $(this).attr('tid') );
                });
			
                // get the text that was highlighted
                var content = $.trim( RDR.why.sel.text );

                rindow.find('button').text('Rating...').attr('disabled','disabled');
                // send the data!
                $.ajax({
                    url: "/json-send/",
                    contentType: "application/json",
                    //dataType: "jsonp",
                    dataType: "json",
                    data: {
                        "unknown_tags" : unknown_tags,
                        "known_tags" : known_tags,
                        "user" : 10,
                        "page" : 1,
                        "content" : content,
                        "content_type" : "text"
                    },
                    complete: function(msg) {
                        var tags = "";

                        for ( var i in known_tags ) {
                            if ( known_tags[i] && RDR.group.blessed_tags[ known_tags[i] ] ) {
                                tags += RDR.group.blessed_tags[ known_tags[i] ].name + ", ";
                            }
                        }
						
                        if ( typeof unknown_tags != 'undefined' ) {
                            tags += unknown_tags;
                        }
						
                        tags = $.trim(tags);
                        if ( tags.charAt( tags.length-1) == "," ) tags = tags.substring( 0, tags.length-1 );
                        tags += " - ";
						
                        // TODO add short rdrbrd URL to end of this line, rather than the long URL
                        var url = window.location.href;
						
                        // TODO this eneds to behave differently for images, video
                        // maybe just show short URL that leads directly to that image, video on the page
                        var share_content = tags + '"' + content + '" ' + url;
                        rindow.find('ul, div, input').not('div.rdr_close').remove();
                        rindow.find('h1').html('Done!').after('<div><strong>Share your reaction</strong> with others:</div>' +
                            '<div id="rdr_share"><textarea>' + share_content + '</textarea>' +
                            '<div id="rdr_share_count"></div>' +
                            '<div><button>Facebook</button> <button>Twitter</button> <button>Tumblr</button> <button>LinkedIn</button></div>');
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
                        $('#rdr_share_count').text( $('#rdr_share textarea').val().length + " characters");
                        $('#rdr_share textarea').keyup( function() {
                            $('#rdr_share_count').text( $('#rdr_share textarea').val().length + " characters");
                        });
                    }
                });
            },
            startSelect : function(e) {
                // make a jQuery object of the node the user clicked on (at point of mouse up)
                var mouse_target = $(e.target);

                // make sure it's not selecting inside the RDR windows.
                if ( !mouse_target.hasClass('rdr') && mouse_target.parents('div.rdr').length == 0 ) {
				
                    // closes undragged windows
                    $('div.rdr.rdr_window.rdr.rdr_rewritable, div.rdr.rdr_actionbar').remove();

                    // see what the user selected
                    // TODO: need separate image function, which should then prevent event bubbling into this
                    RDR.why.sel = RDR.actions.selectedText();
                    if ( RDR.why.sel.text && RDR.why.sel.text.length > 3 && RDR.why.sel.text.indexOf(" ") != -1 ) {
					
                        // next line's redundant, but this way we just use .content in later functions, based on itemType
                        RDR.why.content = RDR.why.sel.text;
                        RDR.why.itemType = "text";
                        RDR.why.blockParent = null;

                        // can we comment on the selection?
                        // identify the selection's block parent (RDR.why.blockParent)
                        // see it contains the whole selection text
                        // and check for the rdr class.
                        if ( RDR.why.sel.obj.css('display') != "block" ) {
                            RDR.why.sel.obj.parents().each( function() {
                                // cache the obj... faster!
                                var aParent = $(this);
                                if ( aParent.css('display') == "block" ) {
                                    // we've found the first parent of the selected text that is block-level
                                    RDR.why.blockParent = aParent;
                                    return false;  // exits out of a jQuery.each loop
                                }
                            });
                        } else {
                            // the node initially clicked on is the first block level container
                            RDR.why.blockParent = RDR.why.sel.obj;
                        }

                        // cache the blockParent's text for slightly faster processing
                        RDR.why.blockParent.text = RDR.why.blockParent.text();
				
                        if ( RDR.why.blockParent.text && RDR.why.blockParent.text.length > 0) {

                            // now, strip newlines and tabs -- and then the doublespaces that result
                            RDR.why.blockParentTextClean = RDR.util.cleanPara ( RDR.why.blockParent.text );
                            RDR.why.selectionTextClean = RDR.util.cleanPara ( RDR.why.content );

                            if ( RDR.why.blockParentTextClean.indexOf( RDR.why.selectionTextClean ) != -1 ) {
                                // this can be commented on if it's long enough and has at least one space (two words or more)
                                RDR.actionbar.draw({
                                    x:parseInt(e.pageX),
                                    y:parseInt(e.pageY),
                                    content_type:"text",
                                    content:escape(RDR.why.content)
                                });

                            // also should detect if selection has an image, embed, object, audio, or video tag in it
                            } else {
                                RDR.actionbar.draw({
                                    x:parseInt(e.pageX),
                                    y:parseInt(e.pageY),
                                    content_type:"text",
                                    content:escape(RDR.why.content),
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
function jqueryJSON($){
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

//load jQuery overwriting the client's jquery, create our $R clone, and revert the client's jquery back
loadScript("/static/ui-prototype/js/jquery-1.4.4.min.js", function(){
    //callback
    
    //load jQuery UI while the $ and jQuery still refers to our new version
    loadScript("/static/ui-prototype/js/jquery-ui-1.8.6.custom.min.js", function(){
        //callback
        
        //test that $.ui versioning is working correctly
        console.log("testing jQuery UI versioning...")
        console.log("before the $.noConflict call the $.ui.version still refers to ours version = " + $.ui.version)
        var $R = $.noConflict(true);
        
        console.log("after the $.noConflict call, the $.ui.version reverts back to refering to the clients - version = " + $.ui.version)
        console.log("of course $R.ui.version should show our version - version = " + $R.ui.version)

        //call scripts that depend on our jQuery version to be loaded
        $RFunctions($R);

    });
});


function $RFunctions($R){
    //called after our version of jQuery is loaded

    //init the jquery-json plugin
    jqueryJSON($R);
    //initiate our RDR object
    RDR = readrBoard($R);

    //run init functions
    RDR.actions.init();

    //testing:
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

    //////////////////// TODO: TEST DATA //////////////////
    RDR.group.blessed_tags = [
    {
        name: "Great!",
        tid: 0
    },
    {
        name: "Hate",
        tid: 1
    },
    {
        name: "Interesting",
        tid: 2
    },
    {
        name: "Boooooring",
        tid: 3
    }
    ];
    // TODO: don't want to remove Eric's console statements, but don't wanna see them right now, either
    console.clear();
}

