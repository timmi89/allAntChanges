/*
 * FancyBox - jQuery Plugin
 * Simple and fancy lightbox alternative
 *
 * Examples and documentation at: http://fancybox.net
 * 
 * Copyright (c) 2008 - 2010 Janis Skarnelis
 *
 * Version: 1.3.1 (05/03/2010)
 * Requires: jQuery v1.3+
 *
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 */

(function(b){var m,u,x,g,D,i,z,A,B,p=0,e={},q=[],n=0,c={},j=[],E=null,s=new Image,G=/\.(jpg|gif|png|bmp|jpeg)(.*)?$/i,S=/[^\.]\.(swf)\s*$/i,H,I=1,k,l,h=false,y=b.extend(b("<div/>")[0],{prop:0}),v=0,O=!b.support.opacity&&!window.XMLHttpRequest,J=function(){u.hide();s.onerror=s.onload=null;E&&E.abort();m.empty()},P=function(){b.fancybox('<p id="fancybox_error">The requested content cannot be loaded.<br />Please try again later.</p>',{scrolling:"no",padding:20,transitionIn:"none",transitionOut:"none"})},
K=function(){return[b(window).width(),b(window).height(),b(document).scrollLeft(),b(document).scrollTop()]},T=function(){var a=K(),d={},f=c.margin,o=c.autoScale,t=(20+f)*2,w=(20+f)*2,r=c.padding*2;if(c.width.toString().indexOf("%")>-1){d.width=a[0]*parseFloat(c.width)/100-40;o=false}else d.width=c.width+r;if(c.height.toString().indexOf("%")>-1){d.height=a[1]*parseFloat(c.height)/100-40;o=false}else d.height=c.height+r;if(o&&(d.width>a[0]-t||d.height>a[1]-w))if(e.type=="image"||e.type=="swf"){t+=r;
w+=r;o=Math.min(Math.min(a[0]-t,c.width)/c.width,Math.min(a[1]-w,c.height)/c.height);d.width=Math.round(o*(d.width-r))+r;d.height=Math.round(o*(d.height-r))+r}else{d.width=Math.min(d.width,a[0]-t);d.height=Math.min(d.height,a[1]-w)}d.top=a[3]+(a[1]-(d.height+40))*0.5;d.left=a[2]+(a[0]-(d.width+40))*0.5;if(c.autoScale===false){d.top=Math.max(a[3]+f,d.top);d.left=Math.max(a[2]+f,d.left)}return d},U=function(a){if(a&&a.length)switch(c.titlePosition){case "inside":return a;case "over":return'<span id="fancybox-title-over">'+
a+"</span>";default:return'<span id="fancybox-title-wrap"><span id="fancybox-title-left"></span><span id="fancybox-title-main">'+a+'</span><span id="fancybox-title-right"></span></span>'}return false},V=function(){var a=c.title,d=l.width-c.padding*2,f="fancybox-title-"+c.titlePosition;b("#fancybox-title").remove();v=0;if(c.titleShow!==false){a=b.isFunction(c.titleFormat)?c.titleFormat(a,j,n,c):U(a);if(!(!a||a==="")){b('<div id="fancybox-title" class="'+f+'" />').css({width:d,paddingLeft:c.padding,
paddingRight:c.padding}).html(a).appendTo("body");switch(c.titlePosition){case "inside":v=b("#fancybox-title").outerHeight(true)-c.padding;l.height+=v;break;case "over":b("#fancybox-title").css("bottom",c.padding);break;default:b("#fancybox-title").css("bottom",b("#fancybox-title").outerHeight(true)*-1);break}b("#fancybox-title").appendTo(D).hide()}}},W=function(){b(document).unbind("keydown.fb").bind("keydown.fb",function(a){if(a.keyCode==27&&c.enableEscapeButton){a.preventDefault();b.fancybox.close()}else if(a.keyCode==
37){a.preventDefault();b.fancybox.prev()}else if(a.keyCode==39){a.preventDefault();b.fancybox.next()}});if(b.fn.mousewheel){g.unbind("mousewheel.fb");j.length>1&&g.bind("mousewheel.fb",function(a,d){a.preventDefault();h||d===0||(d>0?b.fancybox.prev():b.fancybox.next())})}if(c.showNavArrows){if(c.cyclic&&j.length>1||n!==0)A.show();if(c.cyclic&&j.length>1||n!=j.length-1)B.show()}},X=function(){var a,d;if(j.length-1>n){a=j[n+1].href;if(typeof a!=="undefined"&&a.match(G)){d=new Image;d.src=a}}if(n>0){a=
j[n-1].href;if(typeof a!=="undefined"&&a.match(G)){d=new Image;d.src=a}}},L=function(){i.css("overflow",c.scrolling=="auto"?c.type=="image"||c.type=="iframe"||c.type=="swf"?"hidden":"auto":c.scrolling=="yes"?"auto":"visible");if(!b.support.opacity){i.get(0).style.removeAttribute("filter");g.get(0).style.removeAttribute("filter")}b("#fancybox-title").show();c.hideOnContentClick&&i.one("click",b.fancybox.close);c.hideOnOverlayClick&&x.one("click",b.fancybox.close);c.showCloseButton&&z.show();W();b(window).bind("resize.fb",
b.fancybox.center);c.centerOnScroll?b(window).bind("scroll.fb",b.fancybox.center):b(window).unbind("scroll.fb");b.isFunction(c.onComplete)&&c.onComplete(j,n,c);h=false;X()},M=function(a){var d=Math.round(k.width+(l.width-k.width)*a),f=Math.round(k.height+(l.height-k.height)*a),o=Math.round(k.top+(l.top-k.top)*a),t=Math.round(k.left+(l.left-k.left)*a);g.css({width:d+"px",height:f+"px",top:o+"px",left:t+"px"});d=Math.max(d-c.padding*2,0);f=Math.max(f-(c.padding*2+v*a),0);i.css({width:d+"px",height:f+
"px"});if(typeof l.opacity!=="undefined")g.css("opacity",a<0.5?0.5:a)},Y=function(a){var d=a.offset();d.top+=parseFloat(a.css("paddingTop"))||0;d.left+=parseFloat(a.css("paddingLeft"))||0;d.top+=parseFloat(a.css("border-top-width"))||0;d.left+=parseFloat(a.css("border-left-width"))||0;d.width=a.width();d.height=a.height();return d},Q=function(){var a=e.orig?b(e.orig):false,d={};if(a&&a.length){a=Y(a);d={width:a.width+c.padding*2,height:a.height+c.padding*2,top:a.top-c.padding-20,left:a.left-c.padding-
20}}else{a=K();d={width:1,height:1,top:a[3]+a[1]*0.5,left:a[2]+a[0]*0.5}}return d},N=function(){u.hide();if(g.is(":visible")&&b.isFunction(c.onCleanup))if(c.onCleanup(j,n,c)===false){b.event.trigger("fancybox-cancel");h=false;return}j=q;n=p;c=e;i.get(0).scrollTop=0;i.get(0).scrollLeft=0;if(c.overlayShow){O&&b("select:not(#fancybox-tmp select)").filter(function(){return this.style.visibility!=="hidden"}).css({visibility:"hidden"}).one("fancybox-cleanup",function(){this.style.visibility="inherit"});
x.css({"background-color":c.overlayColor,opacity:c.overlayOpacity}).unbind().show()}l=T();V();if(g.is(":visible")){b(z.add(A).add(B)).hide();var a=g.position(),d;k={top:a.top,left:a.left,width:g.width(),height:g.height()};d=k.width==l.width&&k.height==l.height;i.fadeOut(c.changeFade,function(){var f=function(){i.html(m.contents()).fadeIn(c.changeFade,L)};b.event.trigger("fancybox-change");i.empty().css("overflow","hidden");if(d){i.css({top:c.padding,left:c.padding,width:Math.max(l.width-c.padding*
2,1),height:Math.max(l.height-c.padding*2-v,1)});f()}else{i.css({top:c.padding,left:c.padding,width:Math.max(k.width-c.padding*2,1),height:Math.max(k.height-c.padding*2,1)});y.prop=0;b(y).animate({prop:1},{duration:c.changeSpeed,easing:c.easingChange,step:M,complete:f})}})}else{g.css("opacity",1);if(c.transitionIn=="elastic"){k=Q();i.css({top:c.padding,left:c.padding,width:Math.max(k.width-c.padding*2,1),height:Math.max(k.height-c.padding*2,1)}).html(m.contents());g.css(k).show();if(c.opacity)l.opacity=
0;y.prop=0;b(y).animate({prop:1},{duration:c.speedIn,easing:c.easingIn,step:M,complete:L})}else{i.css({top:c.padding,left:c.padding,width:Math.max(l.width-c.padding*2,1),height:Math.max(l.height-c.padding*2-v,1)}).html(m.contents());g.css(l).fadeIn(c.transitionIn=="none"?0:c.speedIn,L)}}},F=function(){m.width(e.width);m.height(e.height);if(e.width=="auto")e.width=m.width();if(e.height=="auto")e.height=m.height();N()},Z=function(){h=true;e.width=s.width;e.height=s.height;b("<img />").attr({id:"fancybox-img",
src:s.src,alt:e.title}).appendTo(m);N()},C=function(){J();var a=q[p],d,f,o,t,w;e=b.extend({},b.fn.fancybox.defaults,typeof b(a).data("fancybox")=="undefined"?e:b(a).data("fancybox"));o=a.title||b(a).title||e.title||"";if(a.nodeName&&!e.orig)e.orig=b(a).children("img:first").length?b(a).children("img:first"):b(a);if(o===""&&e.orig)o=e.orig.attr("alt");d=a.nodeName&&/^(?:javascript|#)/i.test(a.href)?e.href||null:e.href||a.href||null;if(e.type){f=e.type;if(!d)d=e.content}else if(e.content)f="html";else if(d)if(d.match(G))f=
"image";else if(d.match(S))f="swf";else if(b(a).hasClass("iframe"))f="iframe";else if(d.match(/#/)){a=d.substr(d.indexOf("#"));f=b(a).length>0?"inline":"ajax"}else f="ajax";else f="inline";e.type=f;e.href=d;e.title=o;if(e.autoDimensions&&e.type!=="iframe"&&e.type!=="swf"){e.width="auto";e.height="auto"}if(e.modal){e.overlayShow=true;e.hideOnOverlayClick=false;e.hideOnContentClick=false;e.enableEscapeButton=false;e.showCloseButton=false}if(b.isFunction(e.onStart))if(e.onStart(q,p,e)===false){h=false;
return}m.css("padding",20+e.padding+e.margin);b(".fancybox-inline-tmp").unbind("fancybox-cancel").bind("fancybox-change",function(){b(this).replaceWith(i.children())});switch(f){case "html":m.html(e.content);F();break;case "inline":b('<div class="fancybox-inline-tmp" />').hide().insertBefore(b(a)).bind("fancybox-cleanup",function(){b(this).replaceWith(i.children())}).bind("fancybox-cancel",function(){b(this).replaceWith(m.children())});b(a).appendTo(m);F();break;case "image":h=false;b.fancybox.showActivity();
s=new Image;s.onerror=function(){P()};s.onload=function(){s.onerror=null;s.onload=null;Z()};s.src=d;break;case "swf":t='<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" width="'+e.width+'" height="'+e.height+'"><param name="movie" value="'+d+'"></param>';w="";b.each(e.swf,function(r,R){t+='<param name="'+r+'" value="'+R+'"></param>';w+=" "+r+'="'+R+'"'});t+='<embed src="'+d+'" type="application/x-shockwave-flash" width="'+e.width+'" height="'+e.height+'"'+w+"></embed></object>";m.html(t);
F();break;case "ajax":a=d.split("#",2);f=e.ajax.data||{};if(a.length>1){d=a[0];if(typeof f=="string")f+="&selector="+a[1];else f.selector=a[1]}h=false;b.fancybox.showActivity();E=b.ajax(b.extend(e.ajax,{url:d,data:f,error:P,success:function(r){if(E.status==200){m.html(r);F()}}}));break;case "iframe":b('<iframe id="fancybox-frame" name="fancybox-frame'+(new Date).getTime()+'" frameborder="0" hspace="0" scrolling="'+e.scrolling+'" src="'+e.href+'"></iframe>').appendTo(m);N();break}},$=function(){if(u.is(":visible")){b("div",
u).css("top",I*-40+"px");I=(I+1)%12}else clearInterval(H)},aa=function(){if(!b("#fancybox-wrap").length){b("body").append(m=b('<div id="fancybox-tmp"></div>'),u=b('<div id="fancybox-loading"><div></div></div>'),x=b('<div id="fancybox-overlay"></div>'),g=b('<div id="fancybox-wrap"></div>'));if(!b.support.opacity){g.addClass("fancybox-ie");u.addClass("fancybox-ie")}D=b('<div id="fancybox-outer"></div>').append('<div class="fancy-bg" id="fancy-bg-n"></div><div class="fancy-bg" id="fancy-bg-ne"></div><div class="fancy-bg" id="fancy-bg-e"></div><div class="fancy-bg" id="fancy-bg-se"></div><div class="fancy-bg" id="fancy-bg-s"></div><div class="fancy-bg" id="fancy-bg-sw"></div><div class="fancy-bg" id="fancy-bg-w"></div><div class="fancy-bg" id="fancy-bg-nw"></div>').appendTo(g);
D.append(i=b('<div id="fancybox-inner"></div>'),z=b('<a id="fancybox-close"></a>'),A=b('<a href="javascript:;" id="fancybox-left"><span class="fancy-ico" id="fancybox-left-ico"></span></a>'),B=b('<a href="javascript:;" id="fancybox-right"><span class="fancy-ico" id="fancybox-right-ico"></span></a>'));z.click(b.fancybox.close);u.click(b.fancybox.cancel);A.click(function(a){a.preventDefault();b.fancybox.prev()});B.click(function(a){a.preventDefault();b.fancybox.next()});if(O){x.get(0).style.setExpression("height",
"document.body.scrollHeight > document.body.offsetHeight ? document.body.scrollHeight : document.body.offsetHeight + 'px'");u.get(0).style.setExpression("top","(-20 + (document.documentElement.clientHeight ? document.documentElement.clientHeight/2 : document.body.clientHeight/2 ) + ( ignoreMe = document.documentElement.scrollTop ? document.documentElement.scrollTop : document.body.scrollTop )) + 'px'");D.prepend('<iframe id="fancybox-hide-sel-frame" src="javascript:\'\';" scrolling="no" frameborder="0" ></iframe>')}}};
b.fn.fancybox=function(a){b(this).data("fancybox",b.extend({},a,b.metadata?b(this).metadata():{})).unbind("click.fb").bind("click.fb",function(d){d.preventDefault();if(!h){h=true;b(this).blur();q=[];p=0;d=b(this).attr("rel")||"";if(!d||d==""||d==="nofollow")q.push(this);else{q=b("a[rel="+d+"], area[rel="+d+"]");p=q.index(this)}C();return false}});return this};b.fancybox=function(a,d){if(!h){h=true;d=typeof d!=="undefined"?d:{};q=[];p=d.index||0;if(b.isArray(a)){for(var f=0,o=a.length;f<o;f++)if(typeof a[f]==
"object")b(a[f]).data("fancybox",b.extend({},d,a[f]));else a[f]=b({}).data("fancybox",b.extend({content:a[f]},d));q=jQuery.merge(q,a)}else{if(typeof a=="object")b(a).data("fancybox",b.extend({},d,a));else a=b({}).data("fancybox",b.extend({content:a},d));q.push(a)}if(p>q.length||p<0)p=0;C()}};b.fancybox.showActivity=function(){clearInterval(H);u.show();H=setInterval($,66)};b.fancybox.hideActivity=function(){u.hide()};b.fancybox.next=function(){return b.fancybox.pos(n+1)};b.fancybox.prev=function(){return b.fancybox.pos(n-
1)};b.fancybox.pos=function(a){if(!h){a=parseInt(a,10);if(a>-1&&j.length>a){p=a;C()}if(c.cyclic&&j.length>1&&a<0){p=j.length-1;C()}if(c.cyclic&&j.length>1&&a>=j.length){p=0;C()}}};b.fancybox.cancel=function(){if(!h){h=true;b.event.trigger("fancybox-cancel");J();e&&b.isFunction(e.onCancel)&&e.onCancel(q,p,e);h=false}};b.fancybox.close=function(){function a(){x.fadeOut("fast");g.hide();b.event.trigger("fancybox-cleanup");i.empty();b.isFunction(c.onClosed)&&c.onClosed(j,n,c);j=e=[];n=p=0;c=e={};h=false}
if(!(h||g.is(":hidden"))){h=true;if(c&&b.isFunction(c.onCleanup))if(c.onCleanup(j,n,c)===false){h=false;return}J();b(z.add(A).add(B)).hide();b("#fancybox-title").remove();g.add(i).add(x).unbind();b(window).unbind("resize.fb scroll.fb");b(document).unbind("keydown.fb");i.css("overflow","hidden");if(c.transitionOut=="elastic"){k=Q();var d=g.position();l={top:d.top,left:d.left,width:g.width(),height:g.height()};if(c.opacity)l.opacity=1;y.prop=1;b(y).animate({prop:0},{duration:c.speedOut,easing:c.easingOut,
step:M,complete:a})}else g.fadeOut(c.transitionOut=="none"?0:c.speedOut,a)}};b.fancybox.resize=function(){var a,d;if(!(h||g.is(":hidden"))){h=true;a=i.wrapInner("<div style='overflow:auto'></div>").children();d=a.height();g.css({height:d+c.padding*2+v});i.css({height:d});a.replaceWith(a.children());b.fancybox.center()}};b.fancybox.center=function(){h=true;var a=K(),d=c.margin,f={};f.top=a[3]+(a[1]-(g.height()-v+40))*0.5;f.left=a[2]+(a[0]-(g.width()+40))*0.5;f.top=Math.max(a[3]+d,f.top);f.left=Math.max(a[2]+
d,f.left);g.css(f);h=false};b.fn.fancybox.defaults={padding:10,margin:20,opacity:false,modal:false,cyclic:false,scrolling:"auto",width:560,height:340,autoScale:true,autoDimensions:true,centerOnScroll:false,ajax:{},swf:{wmode:"transparent"},hideOnOverlayClick:true,hideOnContentClick:false,overlayShow:true,overlayOpacity:0.3,overlayColor:"#666",titleShow:true,titlePosition:"outside",titleFormat:null,transitionIn:"fade",transitionOut:"fade",speedIn:300,speedOut:300,changeSpeed:300,changeFade:"fast",
easingIn:"swing",easingOut:"swing",showCloseButton:true,showNavArrows:true,enableEscapeButton:true,onStart:null,onCancel:null,onComplete:null,onCleanup:null,onClosed:null};b(document).ready(function(){aa()})})(jQuery);
/**
 * jQuery.ScrollTo - Easy element scrolling using jQuery.
 * Copyright (c) 2007-2009 Ariel Flesler - aflesler(at)gmail(dot)com | http://flesler.blogspot.com/
 * Dual licensed under MIT and GPL.
 * Date: 5/25/2009
 * @author Ariel Flesler
 * @version 1.4.2
 *
 * http://flesler.blogspot.com/2007/10/jqueryscrollto.html
 */
;(function(d){var k=d.scrollTo=function(a,i,e){d(window).scrollTo(a,i,e)};k.defaults={axis:'xy',duration:parseFloat(d.fn.jquery)>=1.3?0:1};k.window=function(a){return d(window)._scrollable()};d.fn._scrollable=function(){return this.map(function(){var a=this,i=!a.nodeName||d.inArray(a.nodeName.toLowerCase(),['iframe','#document','html','body'])!=-1;if(!i)return a;var e=(a.contentWindow||a).document||a.ownerDocument||a;return d.browser.safari||e.compatMode=='BackCompat'?e.body:e.documentElement})};d.fn.scrollTo=function(n,j,b){if(typeof j=='object'){b=j;j=0}if(typeof b=='function')b={onAfter:b};if(n=='max')n=9e9;b=d.extend({},k.defaults,b);j=j||b.speed||b.duration;b.queue=b.queue&&b.axis.length>1;if(b.queue)j/=2;b.offset=p(b.offset);b.over=p(b.over);return this._scrollable().each(function(){var q=this,r=d(q),f=n,s,g={},u=r.is('html,body');switch(typeof f){case'number':case'string':if(/^([+-]=)?\d+(\.\d+)?(px|%)?$/.test(f)){f=p(f);break}f=d(f,this);case'object':if(f.is||f.style)s=(f=d(f)).offset()}d.each(b.axis.split(''),function(a,i){var e=i=='x'?'Left':'Top',h=e.toLowerCase(),c='scroll'+e,l=q[c],m=k.max(q,i);if(s){g[c]=s[h]+(u?0:l-r.offset()[h]);if(b.margin){g[c]-=parseInt(f.css('margin'+e))||0;g[c]-=parseInt(f.css('border'+e+'Width'))||0}g[c]+=b.offset[h]||0;if(b.over[h])g[c]+=f[i=='x'?'width':'height']()*b.over[h]}else{var o=f[h];g[c]=o.slice&&o.slice(-1)=='%'?parseFloat(o)/100*m:o}if(/^\d+$/.test(g[c]))g[c]=g[c]<=0?0:Math.min(g[c],m);if(!a&&b.queue){if(l!=g[c])t(b.onAfterFirst);delete g[c]}});t(b.onAfter);function t(a){r.animate(g,j,b.easing,a&&function(){a.call(this,n,b)})}}).end()};k.max=function(a,i){var e=i=='x'?'Width':'Height',h='scroll'+e;if(!d(a).is('html,body'))return a[h]-d(a)[e.toLowerCase()]();var c='client'+e,l=a.ownerDocument.documentElement,m=a.ownerDocument.body;return Math.max(l[h],m[h])-Math.min(l[c],m[c])};function p(a){return typeof a=='object'?a:{top:a,left:a}}})(jQuery);
var DAILYCANDY = DAILYCANDY ? DAILYCANDY : {};

$(document).ready(function() {
    DAILYCANDY.account.init();
	DAILYCANDY.utils.searchGo();
	DAILYCANDY.utils.dropDown();
	DAILYCANDY.utils.tooltips();
	DAILYCANDY.utils.shareBox();
	DAILYCANDY.utils.action();
//	DAILYCANDY.utils.autocompleteSearch();
	DAILYCANDY.utils.photoGallery();
	DAILYCANDY.utils.modalLogin();
	DAILYCANDY.onestepsignup();
	DAILYCANDY.video.init();	
	
	$('form.signup-form input[type="submit"]').attr("disabled", "false"); 
	$('form.signup-form input[type="submit"]').removeAttr("disabled");

	
	$('a[href="/logout.jsp"]').click(function(event){
		$.cookie("subscribed-swirl", null, {path: '/'});
	});	
	
	/* Forgot Password */
	$("a.forgot-password").click(function() {
		$.fancybox('/tools/password.jsp?iframe&email='+ $("#email").val(), {
			'type' : 'iframe',
			'padding': 10,
			'height': 290,
			'width': 430,
			'zoomSpeedIn': 300,
			'zoomSpeedOut': 300
		});
		return false;
	});

	/* Submit correction */
	$("#module-article-tools a.correct").fancybox({
		'overlayShow': true,
		'padding': 0,
		'frameWidth': 502,
		'frameHeight': 425,
		'hideOnContentClick': false,
		'centerOnScroll': false,
		'zoomSpeedIn': 300,
		'zoomSpeedOut': 300
	});

	/* Unsubscribe form */
	$('#module-account-subscriptions form.subscribe').submit(function() {
		$.cookie("subscribed-swirl", null, {path: '/'});
		return true;
	});
	
	/* Subscribe forms */
	$('#subscribe-form').submit(function() {
		$.cookie("subscribed-swirl", null, {path: '/'});
		return true; 
	});	
	
	$('form.signup-form').submit(function() {
		var $that	= $(this);
		var $errors = $(this).find("ul.errors");
		$that.find('input[type="submit"]').attr("disabled", "true");
		var email =  $(this).find(".email").val();
		
		DAILYCANDY.subscriber.create( email, $(this).serializeArray(), {
            error: function() {
				$that.find('input[type="submit"]').attr("disabled", "false");
				$that.find('input[type="submit"]').removeAttr("disabled");

				$errors.empty();
				$errors.append("<li>Sorry, there was an error processing the form.</li>");
				$errors.fadeIn("fast");
            },
            beforeSend: function() {
				$errors.hide();
				$that.find('input[type="submit"]').attr("disabled", "true");
				$that.find('input[type="submit"]').attr("value", "Loading");
			},
			invalid: function(fieldErrors, globalErrors) {
				$errors.empty();
				$that.find('input[type="submit"]').attr("disabled", "false");
				$that.find('input[type="submit"]').removeAttr("disabled");
				$that.find('input[type="submit"]').attr("value", "Subscribe");

				if (fieldErrors) {
                    for (var i = 0, ii = fieldErrors.length; i < ii; i++) {
                        var err = fieldErrors[i];
                        if (err.field == "email") {
							$errors.append('<li>Please check your e-mail address.</li>');
						}
						if (err.field == "editions") {
							$errors.append('<li>Please pick at least one edition.</li>', function() { $('#onestepsignup a.showEditionList').click(); });
						}
                    }
				}
				if (globalErrors) {
					for (var j = 0, jj = globalErrors.length; j < jj; j++) {
						var globalErr = globalErrors[j];
						$errors.append('<li>'+globalErr.message+'</li>');
					}
				}
				$errors.show();
			},
            valid: function(json) {
				$errors.hide();				
				$that.find('input[type="submit"]').attr("disabled", "true");
				
				window.location = "/account/upgrade.jsp?source=subscribe&onestep=1&edition="+$('input[name="editions"]').val();
            }
		});

        return false;
    });
});

DAILYCANDY = {
	utils: {
		tooltips: function() {
			var xOffset = 10;
			var yOffset = 20;
			$("a.tooltip, span.tooltip, h2.tooltip").hover(function(e) {
				this.t = this.title;
				this.title = "";
				$("body").append("<span id='tooltip'>"+ this.t +"</span>");
				$("#tooltip")
					.css("top",(e.pageY - xOffset) + "px")
					.css("left",(e.pageX + yOffset) + "px")
					.fadeIn("fast");
			},
			function() {
				this.title = this.t;
				$("#tooltip").remove();
		    });
			$("a.tooltip, span.tooltip, h2.tooltip").mousemove(function(e) {
				$("#tooltip")
					.css("top",(e.pageY - xOffset) + "px")
					.css("left",(e.pageX + yOffset) + "px");
			});
		},
		citiesMenu: function(){
			$("#module-header").find("#module-brand ul").each(function() {
				$(this).hover(function() {
					$("ul", this).show();
				}, function() {
					$("ul", this).hide();
				});
			});
		},
		modalLogin: function(){
			$(".loginModal").fancybox({
				'href'			: "/modal/login.jsp",
				'width'			: 340,
				'height'		: 160,
				'autoScale'		: false,
				'transitionIn'	: 'none',
				'transitionOut'	: 'none',
				'type'			: 'iframe',
				'centerOnScroll': 'true',
				'scrolling'		: 'no',
				'titleShow'		: false
			});
		},
		photoGallery: function() {
			if ($("#module-photo-gallery").find("#showLastCard").length > 0 && $("#module-photo-gallery").find("#module-last-card").length > 0) {
				$("#module-photo-gallery").find("#showLastCard").click(function() {
					$("#module-photo-gallery").find("#module-last-card").fadeIn("fast").css("height", $("#module-photo-gallery").height());
				});
			} else {
				$("#showLastCard").parent().hide();
			}

			$("#module-last-card").find(".close").click(function() {
				$("#module-photo-gallery").find("#module-last-card").fadeOut("fast");
				return false;
			});

			if ($("#module-photo-gallery").find("#show-inter").length > 0 && $("#module-photo-gallery-ad").length > 0 && !DAILYCANDY.ads.isBlank("#module-photo-gallery-ad")) {
				$("#module-photo-gallery").find("#show-inter").one("click", function() {
					$("#module-photo-gallery-ad").show();
					$("#module-photo-gallery").find("#image").hide();
					$("#module-photo-gallery").find("#image-copy").hide();
					return false;
				});
			}
		},
		dropDown: function() {
			$(".drop-down").toggle(function() {
				if ($(this).siblings().length === 0) {
					$(this).parent().addClass("active").siblings().show();
				} else {
					$(this).siblings().show();
				}
			}, function() {
				if ($(this).siblings().length === 0) {
					$(this).parent().removeClass("active").siblings().hide();
				} else {
					$(this).siblings().hide();
				}
			});
		},
		shareBox: function() {
			$(".see-all").each(function() {
				var articleTitle = $(this).attr("title");
				var articleURL = $(this).attr("name");

				$(this).attr("title", "");
				$(this).attr("name", "");
				
				var share_html = '<div class="share-box">' +
					'<ul class="network-icons">';
					if ( $(this).hasClass('fb_twt_su') ) {
						share_html  += '<li><a class="facebook" target="_blank" href="http://www.facebook.com/share.php?u=' +
							articleURL +
							'"><span>&nbsp;<\/span>Facebook</a></li>' +
						'<li><a class="twitter" target="_blank" href="http://twitter.com/home?status=' +
							articleURL +
							'"><span>&nbsp;<\/span>Twitter</a></li>' +
						'<li><a class="stumbleupon" target="_blank" href="http://www.stumbleupon.com/submit?url=' +
							articleURL +
							'"><span>&nbsp;<\/span>StumbleUpon</a></li>';
						}
						
						share_html  += '<li><a class="delicious" href="http://del.icio.us/post?url=' +
							articleURL +
							'&amp;title=' +
							articleTitle +
							'" target="_blank"><span>&nbsp;<\/span>del.i.cio.us</a></li>' +
						'<li><a class="digg" href="http://digg.com/submit?phase=2&amp;url=' +
							articleURL +
							'&amp;title=' +
							articleTitle +
							'" target="_blank"><span>&nbsp;<\/span>Digg</a></li>' +
						'<li><a class="myspace" href="http://www.myspace.com/Modules/PostTo/Pages/?l=3&amp;u=' +
							articleURL +
							'&amp;t=' +
							articleTitle +
							'" target="_blank"><span>&nbsp;<\/span>MySpace</a></li>' +
						'<li><a class="reddit" href="http://reddit.com/submit?url=' +
							articleURL +
							'&amp;title=' +
							articleTitle +
							'" target="_blank"><span>&nbsp;<\/span>Reddit</a></li>' +
						'<li><a class="technorati"    href="http://www.technorati.com/faves?add=' +
							articleURL +
							'" target="_blank"><span>&nbsp;<\/span>Technorati</a></li>' +						
						'<li><a class="blogger" href="javascript:popw=\'\';Q=\'\';x=document;y=window;if(x.selection)%20{Q=x.selection.createRange().text;}%20else%20if%20(y.getSelection)%20{Q=y.getSelection();}%20else%20if%20(x.getSelection)%20{Q=x.getSelection();}popw%20=%20y.open(\'http://www.blogger.com/blog_this.pyra?t=\'%20+%20escape(Q)%20+%20\'&amp;u=\'%20+%20escape(\'' +
							articleURL +
							'\')%20+%20\'&amp;n=\'%20+%20escape(\'' +
							articleTitle +
							'\'),\'bloggerForm\',\'scrollbars=no,width=475,height=300,top=175,left=75,status=yes,resizable=yes\');if%20(!document.all)%20T%20=%20setTimeout(\'popw.focus()\',50);void(0);"><span>&nbsp;<\/span>Blogger</a></li>' +
						'<li><a class="yahoo_buzz"    href="http://buzz.yahoo.com/submit?submitUrl=' +
							articleURL +
							'&amp;submitHeadline=' +
							articleTitle +
							'" target="_blank"><span>&nbsp;<\/span>Yahoo!<br\/> Buzz</a></li>' +	
						'<li><a class="google_bmarks" href="http://www.google.com/bookmarks/mark?op=edit&amp;bkmk=' +
							articleURL +
							'&amp;title=' +
							articleTitle +
							'" target="_blank"><span>&nbsp;<\/span>Google<br\/> Bookmarks</a></li>' +
						'<li><a class="yahoo_bmarks"  href="http://bookmarks.yahoo.com/toolbar/savebm?opener=tb&amp;u=' +
							articleURL +
							'&amp;t=' +
							articleTitle +
							'" target="_blank"><span>&nbsp;<\/span>Yahoo!<br\/> Bookmarks</a></li>' +
					'</ul>' +
				'</div>';
				
				$(this).append( share_html );
			});
		},
		searchGo: function(){
			$("#module-header").find("form#module-search-dc").submit(function() {
				var query = $("input.search-query");

				if (query.val() == "Search DailyCandy") {
					query.val("");
				}
			});
		},
		autocompleteSearch: function() {
			$("#module-search").find("input.search-query").autocomplete("/rest/search/autocomplete", {
				minChars: 3,
				width: 232,
				matchSubset: 1,
				autoFill: false,
				selectFirst: false,
				formatItem: function(row, i, max) {
					return "<div>" + row[0] + "<div class='autoDimension'>" + row[1] + "</div></div>";
				}
			});
		},
		action: function() {
			
			/* Send to a friend */
			$("#module-article-tools a.email, #module-dossier-tools a.email, #module-video-tools a.email, #module-account-lists a.email, #module-flipbook-content a.email, #module-flipbook-end-share a.email").fancybox({
				'overlayShow': true,
				'padding': 0,
				'width': 505,
				'height': 580,
				'hideOnContentClick': false,
				'centerOnScroll': false,
				'zoomSpeedIn': 300,
				'zoomSpeedOut': 300,
				'type': 'iframe'
			});

			$("#module-article-tools a.print, #module-dossier-tools a.print").click(function() {
				window.print();
				return false;
			});
	
			var results = new RegExp('[?&]action=([^&#]*)').exec(window.location.href);
			var fromDc = (!!(document.referrer) && document.referrer.match(window.location.host) !== null);

			if (!fromDc && results !== null && results[1] == 'send') {
				$("#module-article-tools a.email, #module-dossier-tools a.email").click();
			}

			else if (!fromDc && results !== null && results[1] == 'print') {
				$("#module-article-tools a.print, #module-dossier-tools a.print").click();
			}

			else if (!fromDc && results !== null && results[1] == 'save') {
				$("#module-article-tools a.save, #module-dossier-tools a.save").click();
			}
		},
		checkViewed: function( what, id ) {
			// cookie should store a value like local-list-home|yes
			// "what": 	the string to the left of the | ... e.g. local-list-home
			// "id":	the ID of the element to show if this feature has not yet been viewed
			var viewed = [];
			if ( $.cookie("viewed") ) viewed = $.cookie("viewed").split(",");
			if ( viewed.length > 0 ) {
				for (var i=0,j=viewed.length;i<j;i++) {
					if ( viewed[i].indexOf(what) != -1 ) {
						if ( viewed[i].split('|')[1] != "yes" ) {
							$('#'+id).slideDown(400);
						}
					}
				}
			} else {
				$('#'+id).slideDown(400);
			}
		},
		markViewed: function( what, val ) {
			// this function will add the string "{what}|{val}" to the cookie, "viewed"
			// it will check for an existing instance of {what} in the cookie and remove that before adding the new value
			var viewed = [];
			if ( $.cookie("viewed") ) viewed = $.cookie("viewed").split(",");
			
			if ( viewed.length > 0 ) {
				for (var i=0,j=viewed.length;i<j;i++) {
					if ( viewed[i].indexOf(what) != -1 ) {
						viewed.splice(i,1);
					}
				}
			}
			var new_viewed = what + "|" + val;
			if ( viewed.length > 0 ) new_viewed += "," + viewed.join(",");
			
			$.cookie("viewed", new_viewed);
		}
	},
	homepageCarousel: function() {
		if (typeof products != "undefined") {
			var buttons = [];
			var divslidecontrols = $('#slides-controls');

			var ulslideitems = $('#slide-items');
			ulslideitems.empty();

			var subtitle = "";

			for (var i = 0, jj = products.length; i < jj; i++) {
				subtitle = products[i].type;

				if(subtitle == "Gallery") {
					subtitle = "Photo Gallery";
				}else if(subtitle == "DealsEmail") {
					subtitle = "Deals";
				}else {
					subtitle = products[i].subtitle;
				}

				var target = "";
				if (typeof products[i].target != 'undefined') {
					target = ' target="' + products[i].target + '"';
				}
				
				ulslideitems.append(
					"<li><a href='" + products[i].url + "'" + target + "><img src='" + products[i].img + "' alt='" + products[i].title + "' width='380' height='285' /></a>" +
						"<span class='box'>" +
							"<h1><a href='" + products[i].url + "'>" + products[i].title + "</a></h1>" +
							"<h2>" + subtitle + "</h2>" +
							"<p>"+products[i].summary+"</p>"+
						"</span>"+
					"<\/li>");
			}
			
			$('#slide-items').cycle({ 
				fx:     'scrollHorz', 
				timeout: 5000,
				speed:	800,
				easing:  'easeInOutQuint',
				pager:  '.slides-control',
				next: '.next',
				prev: '.prev',
				activePagerClass: 'active',
				cleartype: !$.support.opacity
			});

		}
	},
	onestepsignup: function() {
		var $editions = $("#module-signup-sidebar").find("#hidden-editions");

		$("#module-signup-sidebar").find("input.email").focus(function() {
			if ($editions.css('display') == "none") {
				$editions.slideDown("fast");
			}
		});

		$("#module-signup-sidebar a.see-more").click(function() {
			if ($editions.css('display') == "none") {
				$editions.slideDown("fast");
				$(this).addClass('active');
				return false;
			} else {
				$editions.slideUp();
				$(this).removeClass('active');
				return false;
			}
		});
	},
	account: {
		init: function() {
			$("div#module-account-activity dl").mouseover(function() {
				$(this).addClass("active");
				$("a.delete", this).show();
			}).mouseout(function() {
				$(this).removeClass("active");
				$("a.delete", this).hide();
			});
			
			$("div#module-account-lists dl").mouseover(function() {
				$(this).addClass("active");
				$("a.delete", this).show();
			}).mouseout(function() {
				$(this).removeClass("active");
				$("a.delete", this).hide();
			});

			$("a.pause-subscriptions").click(function() {
				$(this).toggleClass('on');
				$("#module-pause-subscriptions").slideToggle('fast');
				return false;
			});

			var ew = $('ul#local-editions li #ew');
			var local7 = $('ul#local-editions li .local7');

			local7.each(function() {
				$(this).click(function() {
					if ($(this).is(':checked')) {
						ew.attr('checked', true);
					}
				});
			});

			//check swirl cookie
			var email =  $("div#module-account-settings input#email").val();
			
			var checkSwirlCookie = "";
			
			if (checkSwirlCookie == null) {
			
				if (email) {
					if (DAILYCANDY.subscriber.checkSubscribedToSwirl(email))
						$('input#swirl').attr('checked', true);
					else if ($("div#module-account-subscribe ul.errors").length != 0)
						$('input#swirl').attr('checked', true); //error on form submit
				}
				else if ($("div#module-account-settings input").length != 0){
					//on the create account page but email not pre-entered
					$('input#swirl').attr('checked', true);
				}
				else{
					//for unsubscribe page
					email =  $("p#email strong").text();
					if (email) {
						if (DAILYCANDY.subscriber.checkSubscribedToSwirl(email)){
							$('input#swirl').attr('checked', true);
						}
					}
				}
			}
			else {
				if (checkSwirlCookie == 'true')
					$('input#swirl').attr('checked', true);
			}
			
		}
	},
	video: {
		init: function(){
				var articleHeight = $("#video-article-content").css('height','auto').height();
				$("#video-article-content").css('height',84);
				
				$("#video-article-see-all").click(function(){
					var link = $(this);
					if($("#video-article-content").height() == 84) {
						$("#video-article-content").animate({ height: articleHeight}, '100000', function(){link.find("em").text("Collapse the Article").end().addClass("up");});
					}else{
						$("#video-article-content").animate({height: 84}, '100000', function(){link.find("em").text("Read the Full Article").end().removeClass("up");});
					}
					return false;
				});
			
			this.pagination();
			this.channels();
			this.playlist();
			this.videoNext();
				
		},
		pagination: function() {
			$('#module-video-gallery #module-page-nav a').live('click',function(){

				var pattern = new RegExp("http:\/\/[a-zA-Z0-9\\.:]*\/");
				var url = $(this).attr('href');

				if (pattern.exec(url) !== null) {
					url = url.replace(pattern.exec(url),'/');
				}

				$.ajax({
					url: '/channel' + url,	
					beforeSend: function() {
						$('#gallery').addClass("loading");
						$('#module-video-gallery').append('<div class="share-progress"><img src="/i/gfx/loading.gif" alt="" /></div>');
					},				
					complete: function() {
						$('#gallery').removeClass("loading");
						$('.share-progress').remove();
					},						
					success: function(data){
						$("#module-video-gallery #gallery").html(data);
					}
				});
			
				return false;				
			});			
		},
		channels: function() {
			$('#module-video-gallery-menu a').live('click',function(){
				var section = $(this);
				var cookie = "";
				if ($.cookie('dcVideoPlaylist') !== null) {
					cookie = $.cookie('dcVideoPlaylist');
				} else {
					if($(this).parents().attr('id') == 'playlistlink') {
						$(this).html('MY PLAYLIST (0)');
					}
				}				
				$.ajax({
					url: '/channel' + $(this).attr('href'),
					data: 'dcVideoPlaylist=' +  cookie,
					beforeSend: function() {
						$('#gallery').addClass("loading");
						$('#module-video-gallery').append('<div class="share-progress"><img src="/i/gfx/loading.gif" alt="" /></div>');
					},				
					complete: function() {
						$('#gallery').removeClass("loading");
						$('.share-progress').remove();
					},				
					success: function(data){
						$('#module-video-gallery-menu ul li').each(function(){
							$(this).removeClass('active');
						});
						var selected = $(section).parent();
						$(selected).addClass('active');
						
						$('#gallery').html(data);
					}
				});
				return false;
			});
		},
		playlist: function(){
				var playlist = [];
				var cookie = null;
				
				if(cookie !== null) {
					playlist = cookie.split(',');
				}			
				
				function addToPlaylist(id) {
					playlist.push(id);
					$.cookie('dcVideoPlaylist',playlist.toString(),{expires: 365, path: '/'});
					$('#module-video-gallery-menu #playlistlink a').html('MY PLAYLIST ('+ playlist.length +')');
						
					if($('#module-video-gallery-menu ul li.active').attr('id') == 'playlistlink') {
						$.ajax({
							url: '/channel' + window.location.pathname + '?playlist',
							data: 'dcVideoPlaylist=' +  playlist,
							success: function(data) { $('#gallery').html(data); }
						});
					}	
					
					if ($('#module-video-tools a.playlist').attr('id') == id ) {
						$('#module-video-tools a.playlist').addClass('inplaylist').removeClass('playlist').text('REMOVE FROM PLAYLIST');
					}			
					
					$('button[id=' + id + ']').parent().addClass('playlist-thumbnail').removeClass('gallery-thumbnail');						
				}
				
				function removeFromPlaylist(id){
					if(cookie !== null) {
						playlist = $.unique(playlist);
						playlist = $.grep(playlist, function(val) { return val != id; });
												
						if ($('#module-video-tools a.inplaylist').attr('id') == id ) {
							$('#module-video-tools a.inplaylist').addClass('playlist').removeClass('inplaylist').text('MY PLAYLIST');
						}		
						
						if (playlist.length > 0) {
							$('#module-video-gallery-menu #playlistlink a').html('MY PLAYLIST ('+ playlist.length +')');
							$.cookie('dcVideoPlaylist',playlist.toString(),{expires: 365, path: '/'});
						} else {
							$.cookie('dcVideoPlaylist',null,{expires: -1, path: '/'});
							$('#module-video-gallery-menu #playlistlink a').html('MY PLAYLIST (0)');			
							playlist = null;
						}

						if ($('#module-video-gallery-menu ul li.active').attr('id') == 'playlistlink') {	
							$.ajax({
								url: '/channel' + window.location.pathname + '?playlist',
								data: 'dcVideoPlaylist=' +  playlist,
								success: function(data) { $('#gallery').html(data);}
							});
						}	
										
						$('#module-video-next h6:contains("MY PLAYLIST")~div li button[id=' + id + ']').parents('li').remove();
						$('button[id=' + id + ']').parent().addClass('gallery-thumbnail').removeClass('playlist-thumbnail');
						
					}	
				}
			
			$('#module-video-gallery #gallery button, #module-video-next  button, #module-video-tools a.playlist, #module-video-tools a.inplaylist').live('click',function(){
					
				if ($(this).hasClass('playlist-add')) {
					addToPlaylist($(this).attr("id"));
				} else if ($(this).hasClass('playlist-remove')) {
					removeFromPlaylist($(this).attr("id"));
				}
				
				if ($(this).hasClass('playlist')) {
					addToPlaylist($(this).attr("id"));
				} else if ($(this).hasClass('inplaylist')) { 
					removeFromPlaylist($(this).attr("id"));		
				}
				
				return false;
			}); 
		},
		videoNext: function(){
			
			var slidesNum = $('#video-next-carousel li').length;
			
			if(slidesNum > 2) {
				$('#module-video-next a.next').removeClass('disabled');		
			}
						
			function onAfter(curr,next,opts) {
				var next = $('#module-video-next a.next');
				var prev = $('#module-video-next a.prev');
				opts.currSlide == slidesNum - 1 ? next.addClass('disabled') : next.removeClass('disabled');
				opts.currSlide == 0 ? prev.addClass('disabled') : prev.removeClass('disabled');
			}

			
			$('#video-next-carousel').css('visibility','visible');
		}
	},
	misc: {
		comcastbar: function() {
			return;
		}
	},
	ads: {
		hideBlank: function(divId) {
			if (DAILYCANDY.ads.isBlank(divId)) {
				$(divId).hide();
			}
		},
		isBlank: function(divId) {
			return (/\/viewad\/817-grey\.gif/.test($(divId + " a img").attr("src")));
		}
	},
	subscriber: {
			checkSubscribedToSwirl: function(email){
			if (email === null || email == "") {
				return false;
			}
			else{
				//call SWIRL API
				
				var retValue = false;
				var url = "/rest/subscriber/" + email + "/swirl/";

				
				$.ajax({
					  async: false,
					  url: url,
					  dataType: 'json',
					  success: function (data){
						if ((data != null) && (data.valid == true) && (data.subscribed == true))
								retValue = true;
						}
					});

				return retValue;
				
			}
		},	
		validate: function(email, editions, options){
			if (email === null || email == "") {
				options.invalid([{
					field: "email",
					message: "no email address"
				}], []);
				return false;
			}

			return true;
		},
		doUpdate: function(email, editions, type, options) {
			// TODO include session cookie

			var url, method;

			if (type == "create") {
				url = "/rest/subscriber/" + email; // XXX urlencode
				method = "PUT";
			} else {
				if (type == "addSubscriptions") {
					url = "/rest/subscriber/" + email + "/subscriptions"; // XXX urlencode
					method = "PUT";
				}
			}

			$.ajax({
				data: editions,
				cache: false,
				url: url,
				dataType: 'json',
				type: method,
				timeout: 20000,
				error: options.error ||
				function(){
				},
				beforeSend: function(xhr){
					xhr.setRequestHeader("X-HTTP-Method-Override", method);
					options.beforeSend && options.beforeSend(xhr);
				},
				success: function(json){
					if (json.valid == 'true') {
						
						if (json.variables != null){						
							for (var i=0; i< json.variables.length; i++) {
								var map = json.variables[i];
	
								if ((map['swirl']) && (map['swirl'] == true)){
									$.cookie("subscribed-swirl", "true", {path: '/'});
									break;
								}
							}
						}
						
						options.valid(json);
					} else {
						options.invalid(json.errors, json.globalErrors);
					}
				}
			});
		},
		create: function(email, editions, options){
			if (!this.validate(email, editions, options)) {
				return;
			}

			this.doUpdate(email, editions, "create", options);
		},
		addSubscriptions: function(email, editions, options){
			if (!this.validate(email, editions, options)) {
				return;
			}

			this.doUpdate(email, editions, "addSubscriptions", options);
		}
	},
	lists: {
		addListing: function(subscriberId, itemId, itemTitle, listId, listTitle){

			var lists = {
				subscriberId	:	subscriberId,
				contentListId	:	listId,
				linkedContentId	:	itemId
			}
			if (!itemTitle) itemTitle = ""; // placeholder
			if (!listTitle) listTitle = "Your new Local List"; // placeholder
			
			$.cookie("last_list", listId, { path: '/' });
			
			$.ajax({
				type: 'POST',
				url: '/rest/subscriber/contentlist/linkedcontent',
				data: lists,
				error: function(XMLHttpRequest, textStatus, errorThrown) {
					alert('There was a problem adding selected listing to your List.');
				},		
				success: function(data, textStatus, XMLHttpRequest){
					var callingLink = $("#item-"+itemId);
					if (callingLink.length != 0) {
						callingLink.text('Added!');
						callingLink.removeAttr('onclick');
						callingLink.addClass('completed');
					}
					
					// if this is the modal
					if ($("#num_items").length > 0) {

						$("#num_items").parent().show();
						var num_items = parseInt($("#num_items").text()) + 1;
						var items = (num_items == 1) ? " item" : " items";
						$('#num_items').text(String(num_items) + items);
						$('#itinerary-stats button').unbind();
						$('#itinerary-stats button').click( function() { parent.location.reload(true); });
						
						DAILYCANDY.lists.modifyModalSearchLinks(num_items);
					} else {
						$("#create, #name").hide();
						$("#complete").fadeIn();
						$("#complete").html("You added <strong>"+ itemTitle +"</strong> to:<br><a target='_top' href='/account/"+subscriberId+"/local-list/"+listId+"'>"+ listTitle +"</a>  <div id='be-patient'>(It may take just a few minutes before others can view it.)</div>");

						var p_url = parent.window.location.pathname;
						var i_url = "/account/"+subscriberId+"/local-list/"+listId;
						if (p_url==i_url) { parent.document.getElementById('fancybox-close').style.display = 'none'; }

						parent.document.getElementById('fancybox-frame').setAttribute('item', itemId);
					}
				}
			});

		},
		modifyModalSearchLinks: function(num_items) {
			if (num_items && num_items > 0) {
				$('#sort a, a.searchLink, div.page-numbers a, .next a, .prev a').each( function() {
					
					var current_href = $(this).attr('href');
					if (current_href.indexOf('num_items') != -1) {
						var current_href_parts = current_href.split("num_items");
						current_href_parts[1] = (current_href_parts[1].indexOf('&') != -1) ? current_href_parts[1].substr(current_href_parts[1].indexOf('&')+1):"";
						var new_url = current_href_parts[0] + current_href_parts[1] + "num_items=" + String(num_items);
					} else {
						var new_url = current_href + "&num_items=" + String(num_items);
					}
					$(this).attr('href',  new_url);
				});
			}
		},
		createList: function( listTitle, subscriberId, itemId ){
			var lists = {
				title 			:	listTitle,
				subscriberId	:	subscriberId
			};
			
			$.ajax({
				type: 'POST',
				url: '/rest/subscriber/contentlist',
				data: lists,
				error: function(XMLHttpRequest, textStatus, errorThrown) {
					alert("There was a problem creating your List");
				},		
				success: function(data, textStatus, XMLHttpRequest){
					if (!itemId) {
						$('#create').hide();
						$('#name').hide();
						$('#complete p').html( 'You\'ve created the Local List, <strong>' + listTitle + '</strong>.  <a target="_top" href="/account/'+subscriberId+'/local-list/'+data.variables[0].contentListId+'">Go view it.</a>' );
						$('#complete').show();
						$.cookie("last_list", data.variables[0].contentListId, { path: '/' });
						parent.document.getElementById('fancybox-close').style.display = 'none';
					} else {
						DAILYCANDY.lists.addListing(subscriberId, itemId, "", data.variables[0].contentListId, "");
					}
				}
			});
		},
		initListModal: function(subscriberId, itemId, itemTitle, newList){
			var data = { subscriberId :	subscriberId };
			if (newList == "") {
				//populate select with existing lists
				$.ajax({
					type: 'GET',
					url: '/rest/subscriber/contentlist',
					dataType: "json",
					data: data,
					error: function(XMLHttpRequest, textStatus, errorThrown) {
						alert('There was a problem loading your List');
					},		
					success: function(data, textStatus, XMLHttpRequest){					
						var output = [];
						for(var i=0, jj = data.variables[0].contentLists.length;  i < jj; i++) {
							output.push('<option value="'+ 	
											data.variables[0].contentLists[i].contentListId +'" title="'+
											data.variables[0].contentLists[i].contentListTitle +'">'+
											data.variables[0].contentLists[i].contentListTitle +
										'</option>');
						}
						output.push('<option value="">Create a new List &rarr;</option>');
			
						$("#my-lists").html(output.join(''));

						var last_list = ( $.cookie("last_list") !== null ) ? $.cookie("last_list"):0;
						$("#my-lists").val(last_list);
					}
				});

				//select existing list or create a new one
				$("#new-list").bind('click', {itemId:itemId, itemTitle:itemTitle}, function(event) {
					var list = $("#my-lists");
					var listId = list.val();
					var listTitle = $(list+":selected").text();

					if(listId == "") {
						$("#create").hide();
						$("#name").fadeIn();
						$("#list-name").val("");
					} else {
						DAILYCANDY.lists.addListing(subscriberId, event.data.itemId, event.data.itemTitle, listId, listTitle);
					}
				});
				
				// "GO" button on new list form
				$('#new-list-name').click( function() {
					var listTitle = $("#list-name").val();
					if (listTitle.length > 1) DAILYCANDY.lists.createList( listTitle, subscriberId, itemId );
				});
			} else {
				$('#create').hide();
				$('#complete').hide();
				$('#name').show();
				$('#new-list-name').click( function() {
					var listTitle = $("#list-name").val();
					if ( listTitle.length > 1 ) DAILYCANDY.lists.createList( listTitle, subscriberId );
				});
			}
		},
		lengthCheck: function() {
			if ( $('#list-items li.local-list-item').length >= 99 ) {
				$('#warnings').html( '<h2>This Local List has the maximum number of businesses!</h2>Please remove some if you would like to add more.' );
				$('#warnings').show();
				$('.controls').hide();
			} else {
				$('#warnings').hide();
				$('.controls').show();
			}
		},
		modalCreateList: function(subscriberId){
			$.fancybox({
				'href'			: "/modal/lists.jsp?newList=newList&subscriberId="+subscriberId,
				'width'			: 380,
				'height'		: 100,
				'autoScale'		: false,
				'transitionIn'	: 'none',
				'transitionOut'	: 'none',
				'type'			: 'iframe',
				'centerOnScroll': 'true',
				'scrolling'		: 'no',
				'titleShow'		: false,
				'hideOnOverlayClick'	: false
			});
		},
		reorderList: function(subscriberId, contentListId, linkedContentOrder){
			$.ajax({
				type: 'POST',
				url: '/rest/subscriber/contentlist/reorder',
				data: "subscriberId="+subscriberId+"&contentListId="+contentListId+"&linkedContentOrder="+linkedContentOrder,
				error: function(XMLHttpRequest, textStatus, errorThrown) {
					alert('There was a problem ordering your List');
				},
				success: function(data, textStatus, XMLHttpRequest){
					poi.init($("#list-items").sortable('toArray'));
				}
			});
		},
		removeList: function(subscriberId, contentListId){
			var deleteList = confirm("Are you sure you want to delete this Local List? It will be gone forever!")
			if (deleteList) {
				var lists = {
					subscriberId : subscriberId,
					contentListId : contentListId
				}
				$.ajax({
					type: 'DELETE',
					url: '/rest/subscriber/contentlist/',
					data: lists,
					error: function(XMLHttpRequest, textStatus, errorThrown) {
						alert('There was a problem deleting your List');
					},		
					success: function(data, textStatus, XMLHttpRequest){
						if ($('#list-title-'+contentListId).length > 0) {
							$('#list-title-'+contentListId).parent().fadeOut( function() { $(this).remove(); });
							$('#list-title-'+contentListId).parent().prev('.hr').fadeOut( function() { $(this).remove(); });
						} else {
							window.location = "/account/guides.jsp";
						}
					}
				});
			} else {
				return;
			}
		},
		removeListing: function(subscriberId, itemId, listId){
			var lists = {
				subscriberId : subscriberId,
				contentListId : listId,
				subscriberLinkedContentId : itemId
			}
			$.ajax({
				type: 'DELETE',
				url: '/rest/subscriber/contentlist/linkedcontent',
				data: lists,
				error: function(XMLHttpRequest, textStatus, errorThrown) {
					alert("There was a problem deleting this business.");
				},		
				success: function(data, textStatus, XMLHttpRequest){
					var reordered = $("#list-items").sortable('toArray');
					
					var removedItemIndex = jQuery.inArray(itemId.toString(), reordered);
					
					$('#'+itemId).fadeOut(200, function() { 
						$(this).remove(); 
					});

					reordered.splice(removedItemIndex,1);
					poi.init(reordered);

					DAILYCANDY.lists.lengthCheck()
				}
			});

		},
		startAdding: function(itemId, itemTitle, guideId, subscriberId) {
			if (itemId == 0) {}
			if (itemTitle == "") {}
			if (guideId == 0) {
				$.fancybox({
					'href'			: "/modal/lists.jsp?subscriberId="+subscriberId+"&itemId="+itemId+"&itemTitle="+itemTitle,
					'width'			: 400,
					'height'		: 100,
					'autoScale'		: false,
					'transitionIn'	: 'none',
					'transitionOut'	: 'none',
					'type'			: 'iframe',
					'centerOnScroll': 'true',
					'hideOnOverlayClick'	: false,
					'scrolling'		: 'no',
					'titleShow'		: false,
					'onCleanup'		: function() {
									// see if the iframe had a custom element, item, added
									// that is done in the addListing success function
									// and is how we tell the window containing an iframe that an item was successfully added
									// so that here, we can set the link in the parent to say "Added!"
									var iframe = document.getElementById('fancybox-frame');
									var itemId = iframe.getAttribute('item');
									if (itemId) {
										var callingLink = $('#item-'+itemId);
										if (callingLink.length != 0) {
											callingLink.text('Added!');
											callingLink.removeAttr('onclick');
											callingLink.addClass('completed');
										}
									}
								}
				});
			} else {
				var listTitle = ""
				DAILYCANDY.lists.addListing(subscriberId, itemId, itemTitle, guideId, listTitle);
			}
		},
		toggleEdit: function(which) {
			if (!which) which = "show";
			if (which == "show") {
				$('#module-local-lists-summary .view-mode').hide(0);
				$('#module-local-lists-summary .edit-mode').show(0);
				$('#edit_title').val( $('#list_title').text() );
				$('#edit_description').val( $('#list_description').text() );
				$('#share-tools').hide(0);
			} else {
				$('#module-local-lists-summary .view-mode').show(0);
				$('#module-local-lists-summary .edit-mode').hide(0);
				$('#share-tools').show(0);
			}
		},
		updateList: function(contentListId) {

			var title = $('#edit_title').val();
			var description = $('#edit_description').val();
			
			var update_list = {
				subscriberId : s.prop14,
				contentListId : contentListId,
				title : title,
				description	: description
			}
			
			$.ajax({
				type: 'POST',
				url: '/rest/subscriber/contentlist',
				data: update_list,
				error: function(XMLHttpRequest, textStatus, errorThrown) {
					alert("There was a problem saving your changes.");
				},		
				success: function(data, textStatus, XMLHttpRequest){

					$('#edit_title').val(title);
					$('#list_title').text(title);
					
					$('#edit_description').val(description);
					$('#list_description').text(description);
					
					DAILYCANDY.lists.toggleEdit('hide');
				}
			});
		}
	},
	bookmarks: {
		save: function(contentId, subscriberEmail) {
			$.ajax({
				url: "/rest/favorites/" + subscriberEmail,
				type: "post",
				data: {"contentId" : contentId },
				complete: function(response) {
					if (response.error) {
						alert("There was a problem saving this item to your favorites. Error was" + response.error);
						$(this).html('BOOKMARK');
					} else {
						$('li.favorite-li').each( function() {
							$(this).addClass('saved');
							$(this).html('SAVED');
							$(this).css('background-position','');
						});
					}
				}
			});
		}
	},
	fashionWeek: {
		
			carousel: function() {
				if (typeof products != "undefined") {
					var buttons = [];
					var divslidecontrols = $('#slides-controls');
		
					var ulslideitems = $('#slide-items');
					ulslideitems.empty();
		
					var subtitle = "";
		
					for (var i = 0, jj = products.length; i < jj; i++) {
						subtitle = products[i].type;
		
						if(subtitle == "Gallery") {
							subtitle = "Photo Gallery";
						}else if(subtitle == "DealsEmail") {
							subtitle = "Deals";
						}else {
							subtitle = products[i].subtitle;
						}
		
						var target = "";
						if (typeof products[i].target != 'undefined') {
							target = ' target="' + products[i].target + '"';
						}
						
						ulslideitems.append(
							"<li><a href='" + products[i].url + "'" + target + "><img src='" + products[i].img + "' alt='" + products[i].title + "' width='380' height='285' /></a>" +
								"<span class='box'>" +
									"<h3>" + products[i].date + "</h3>" +
									"<h1><a href='" + products[i].url + "'>" + products[i].title + "</a></h1>" +
									"<h2>" + subtitle + "</h2>" +
									"<p>"+products[i].summary+"</p>"+
								"</span>"+
							"<\/li>");
					}
					
					
					$('div.slides-control a').each( function() {
						if ( $(this).text().length == 2 ) $(this).addClass('double-digit');
					});
		
				}
			}
		},
	flipbook: function (){
		if (typeof slides != "undefined") {

			var slideItems = $('#module-flipbook');
			slideItems.empty();
			var slideCredit = "";
			for (var i = 0, jj = slides.length; i < jj; i++) {
			
				if(slides[i].credit != "No Credit") {
				 	slideCredit = "Photo: "+ slides[i].credit;
				} else {
					slideCredit = ""
				}
				
				slideItems.append("<div>"+
					"<div class='slideImg'><img src='" + slides[i].img + "' alt='" + slides[i].title + "' height='345' /><div class='slideCredit'>"+ slideCredit + "</div><\/div>" + 
						"<div class='slideCopy'><h2>" + slides[i].title + "</h2>" +
							"<div id='slideDesc"+i+"'></div>" +
					 	"<\/div>"+
				 	"<\/div>");
				 	$("#slideDesc"+i).html($("#slideContent"+i).html());
			}
			var prevSlide 	= null,
			firstSlide 		= false,
			trackQueue 	= [];

			function trackSlides() {
				var current = null;
				while(trackQueue.length > 0) {
					current = trackQueue.shift();
					s.pageName = current;
					s.t();
				}
			}
			
			function refreshFrame(srcId) {
				var adUrl = $(srcId).attr('src');
				if(typeof adUrl != 'undefined') {
					var cb = '&cb=',
					ts = new Date().getTime(),
					lastIdx = adUrl.lastIndexOf(cb),
					ordRx = /ord=(\d+)\?/,
					regOrd = adUrl.match(ordRx),
					newOrd = parseInt(regOrd[1])+1;
					adOrd = newOrd; // adOrd defined in flipbook template
					
					if(lastIdx > -1) {	
						adUrl = adUrl.substring(0,lastIdx);
					}
					
					adUrl = adUrl.replace(ordRx,"ord="+newOrd+"?");
					$(srcId).attr('src',adUrl+cb+ts);
				}
			}
			
			function insertFinalAd(){
				var lazyEndAd = document.createElement("iframe");
				lazyEndAd.setAttribute("id","flipBook-end-ad300x250");
				lazyEndAd.setAttribute("name","flipBook-end-ad300x250");
				lazyEndAd.setAttribute("src","/modal/flipbook-iframe-end-ad.jsp?url="+endAdURL+"&i="+endAdI+"&t="+endAdT+"&ord="+adOrd+"&iframe=true");
				lazyEndAd.setAttribute("scrolling","no");
				lazyEndAd.setAttribute("frameBorder","0");
				lazyEndAd.setAttribute("allowTransparency","true");
				$(".flipbook-end-ad-copy").after(lazyEndAd);
				$("#flipBook-end-ad300x250").css({border:"none",margin:0,padding:0,overflow:"hidden",width:"300px",height:"250px"});
			}
			

			$('#pause').click(function() { 
				$('#module-flipbook').cycle('pause'); 
				$(this).hide();
				$('#resume').show();
			});
			
			$('#resume').click(function() { 
				$('#module-flipbook').cycle('next'); 
				$('#module-flipbook').cycle('resume'); 
				$(this).hide();
				$('#pause').show();
			});

			$("#module-flipbook-wrap").hover(function() {
		    	$("#module-flipbook-hover-nav, .slideCredit").fadeIn('fast');
		  	},
		  		function() {
		    	$("#module-flipbook-hover-nav").fadeOut('fast');
		  	});
			
			$('.nextSlide').click(function() {
				if(DAILYCANDY.flipbook.currentSlide + 1 > DAILYCANDY.flipbook.lastSlide){
					$("#module-flipbook-controls, #module-flipbook-wrap, #module-flipbook, #module-flipbook-like-tweet").remove();
					$("#module-flipbook-end").show();
					refreshFrame('#flipBook-ad728x90');
					refreshFrame('#flipBook-ad300x250');
					insertFinalAd();
				}
			});

			if ( $('#module-flipbook').children().length == 1 ) {
				$('#module-flipbook-controls').remove();
				$('#module-flipbook-hover-nav').remove();
			}
			
		}
	},
	holiday: {
		
		carousel: function() {
			if (typeof products != "undefined") {
				var buttons = [];
				var divslidecontrols = $('#slides-controls');
	
				var ulslideitems = $('#slide-items');
				ulslideitems.empty();
	
				var subtitle = "";
	
				for (var i = 0, jj = products.length; i < jj; i++) {
					subtitle = products[i].type;
	
					if(subtitle == "Gallery") {
						subtitle = "Photo Gallery";
					}else if(subtitle == "DealsEmail") {
						subtitle = "Deals";
					}else {
						subtitle = products[i].subtitle;
					}
	
					var target = "";
					if (typeof products[i].target != 'undefined') {
						target = ' target="' + products[i].target + '"';
					}
					
					ulslideitems.append(
						"<li><a href='" + products[i].url + "'" + target + "><img src='" + products[i].img + "' alt='" + products[i].title + "' width='380' height='285' /></a>" +
							"<span class='box'>" +
								"<h3>" + products[i].date + "</h3>" +
								"<h1><a href='" + products[i].url + "'>" + products[i].title + "</a></h1>" +
								"<h2>" + subtitle + "</h2>" +
								"<p>"+products[i].summary+"</p>"+
							"</span>"+
						"<\/li>");
				}
				
				$('#slide-items').cycle({ 
					fx:     'scrollHorz', 
					timeout: 5000,
					speed:	800,
					easing:  'easeInOutQuint',
					pager:  '.slides-control',
					next: '.next',
					prev: '.prev',
					activePagerClass: 'active',
					cleartype: !$.support.opacity
				});
				
				$('div.slides-control a').each( function() {
					if ( $(this).text().length == 2 ) $(this).addClass('double-digit');
				});
	
			}
		}
	}
};

jQuery.extend( jQuery.easing, {
	easeInOutQuint: function (x, t, b, c, d) {
		if ((t/=d/2) < 1) {return c/2*t*t*t*t*t + b;}
		return c/2*((t-=2)*t*t*t*t + 2) + b;
	}
});


$(document).ready(function() {

	//top comment icon
	$("#module-article .comments, #module-listing .comments").click(function() {
		$.scrollTo( '#comments', 800, { easing:'easeInOutQuint' });

		return false;
	});

	//cancel comment
	$("#module-comments").find(".cancel-button").click(function() {
		$("#commentArea").val('');
		$("#inReplyTo").html('').slideUp("fast");
		$("#replyToId").val('0');
		$("#postComment a").html("Post a comment...");
		$.scrollTo('#comments', 1000, { easing:'easeInOutQuint' });

		if ($("#module-comments").find(".comment-error").length > 0 ) {
			$("#module-comments").find(".comment-error").slideUp("fast");
		}

		return false;
	});
	
	
	
    $("#module-comments").find("a.reply").click(function() {

        if ($("#module-comments").find(".comment-error").length > 0 ) {
            $("#module-comments").find(".comment-error").hide();
        }

        $("#postComment a").html("Post a comment in reply to:");

        var replyID = $(this).attr("id").substring(6);

        var cText = $("#comment-"+replyID+" p.text").html();
        var cSubscriber = $("#comment-"+replyID+" p.info span.subscriber").html();
        var cPostDate = $("#comment-"+replyID+" p.info span.postDate").html();
        
        $("#replyToId").val(replyID);

        $("#inReplyTo").html(
            '<div class="comment">' + 
            '<p class="info">Posted by <span>' + cSubscriber + '</span> on ' + cPostDate + '</p>' + 
            '<p>' + cText + '</p>' + 
            '</div>').slideDown("fast");

        $.scrollTo('#postComment', 1200, { easing:'easeInOutQuint' });

        return false;
    });

    
    //delete comment
    $("#module-comments").find("a.delete").click(function() {

        if ($("#module-comments").find(".comment-error").length > 0 ) {
            $("#module-comments").find(".comment-error").hide();
        }
        var confirmed = confirm('Are you sure you want to delete this comment? Click OK to delete, or Cancel to abort.');
        if (confirmed) {
            var deleteID = $(this).attr("id").substring(7);
            var subscriberID = $(this).attr("name");
            var dataD = {commentId: deleteID};
            $.ajax({
                url: '/rest/comment/'+subscriberID+'/delete',  
                type: 'POST',
                data: dataD,                                    
                success: function(data){
                    location.reload();
                },
                error: function(XMLHttpRequest, textStatus, errorThrown) {
                    alert("ERROR " + XMLHttpRequest.status);
                }
            });

        }

        return false;
    });
    ;

	//report this
	$("a.inline").fancybox({
		'overlayShow': true,
		'hideOnContentClick': false,
		'padding': 0,
		'frameHeight': 220,
		'frameWidth': 450
	});

});


