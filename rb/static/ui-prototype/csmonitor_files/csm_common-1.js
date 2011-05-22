 // Wires up the popup links...//
wireUpPopups = function() {

    jQuery('a.popup').each(function() {
    
        if (jQuery(this).attr('href').length > 0) {
			jQuery(this).click(function() {
				popWindow(jQuery(this).attr('href'));
				return false;
			});
        }
    });
}

popWindow = function(url) {
	window.open(url, "Popup", "width=440,height=455, scrollbars=yes");
}

jQuery(document).ready(function() {
    wireUpPopups();
});

function pgallerycarousel_initCallback(carousel) {		jQuery('#pScrollH').append('<a href="#" id="pgallerycarousel-prev"><img src="/extension/csm_base/design/csm_design/images/btn_prev.gif" alt="Previous" height="12" width="6"  /></a><a href="#" id="pgallerycarousel-next"><img src="/extension/csm_base/design/csm_design/images/btn_next.gif" alt="Next" height="12" width="6"  /></a>');
		
		jQuery('#pgallerycarousel-next').bind('click', function() {			carousel.next();
			return false;
		});
	
		jQuery('#pgallerycarousel-prev').bind('click', function() {			carousel.prev();
			return false;
		});};
function pgalleryvertcarousel_initCallback(carousel) {		jQuery('#pScrollV').append('<a href="#" id="pgalleryvertcarousel-prev"><img src="/extension/csm_base/design/csm_design/images/btn_prev.gif" alt="Previous" height="12" width="6"  /></a><a href="#" id="pgalleryvertcarousel-next"><img src="/extension/csm_base/design/csm_design/images/btn_next.gif" alt="Next" height="12" width="6"  /></a>');

		jQuery('#pgalleryvertcarousel-next').bind('click', function() {			carousel.next();
			return false;
		});
	
		jQuery('#pgalleryvertcarousel-prev').bind('click', function() {			carousel.prev();
			return false;
		});};

function pgallerycarousel_itemVisibleInCallbackBeforeAnimation(carousel, item, idx, state) {	jQuery('#psCountH').text("(" + idx + " of " + carousel.size() + ")");
	jQuery('#pgallerycarousel_caption').text(pgallerycarousel_itemList[idx-1].caption);
	jQuery('#pgallerycarousel_credit').html(pgallerycarousel_itemList[idx-1].credit);
	jQuery('#pgallerycarousel_related').html(pgallerycarousel_itemList[idx-1].related);
	jQuery('#pgallerycarousel_enlarge').attr("href", pgallerycarousel_itemList[idx-1].url_lg);
	if (state == 'init')
		return;};

function pgallerycarousel_itemVisibleInCallbackAfterAnimation(carousel, item, idx, state) {	if (state == 'init')
		return;};

function pgalleryvertcarousel_itemVisibleInCallbackBeforeAnimation(carousel, item, idx, state) {	jQuery('#psCountV').text("(" + idx + " of " + carousel.size() + ")");
	jQuery('#pgalleryvertcarousel_caption').text(pgalleryvertcarousel_itemList[idx-1].caption);
	jQuery('#pgalleryvertcarousel_credit').text(pgalleryvertcarousel_itemList[idx-1].credit);
	jQuery('#pgalleryvertcarousel_related').html(pgalleryvertcarousel_itemList[idx-1].related);
	jQuery('#pgalleryvertcarousel_enlarge').attr("href", pgalleryvertcarousel_itemList[idx-1].url_lg);
	if (state == 'init')
		return;};

function pgalleryvertcarousel_itemVisibleInCallbackAfterAnimation(carousel, item, idx, state) {	if (state == 'init')
		return;};
	
function RightslinkPopUp() {
    var url = "https://s100.copyright.com/servlet/DispatchServlet";
    var location = url
		+ "?PublisherName=" + escape( "The Christian Science Monitor" )
		+ "&publication=" + escape( "The Christian Science Monitor" )
		+ "&Title=" + escape(md_headline)
		+ "&PublicationDate=" + escape(md_date_parsed)
		+ "&Author=" + escape(md_byline)
		+ "&Install=S"
		+ "&ContentID=" + escape( md_base_path.replace(/\.html$/,'') );
    PopUp = window.open( location, 'Rightslink', 'location=no,toolbar=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=650,height=550');
}

/*
 * jQuery BBQ: Back Button & Query Library - v1.2.1 - 2/17/2010
 * http://benalman.com/projects/jquery-bbq-plugin/
 * 
 * Copyright (c) 2010 "Cowboy" Ben Alman
 * Dual licensed under the MIT and GPL licenses.
 * http://benalman.com/about/license/
 */
(function($,p){var i,m=Array.prototype.slice,r=decodeURIComponent,a=$.param,c,l,v,b=$.bbq=$.bbq||{},q,u,j,e=$.event.special,d="hashchange",A="querystring",D="fragment",y="elemUrlAttr",g="location",k="href",t="src",x=/^.*\?|#.*$/g,w=/^.*\#/,h,C={};function E(F){return typeof F==="string"}function B(G){var F=m.call(arguments,1);return function(){return G.apply(this,F.concat(m.call(arguments)))}}function n(F){return F.replace(/^[^#]*#?(.*)$/,"$1")}function o(F){return F.replace(/(?:^[^?#]*\?([^#]*).*$)?.*/,"$1")}function f(H,M,F,I,G){var O,L,K,N,J;if(I!==i){K=F.match(H?/^([^#]*)\#?(.*)$/:/^([^#?]*)\??([^#]*)(#?.*)/);J=K[3]||"";if(G===2&&E(I)){L=I.replace(H?w:x,"")}else{N=l(K[2]);I=E(I)?l[H?D:A](I):I;L=G===2?I:G===1?$.extend({},I,N):$.extend({},N,I);L=a(L);if(H){L=L.replace(h,r)}}O=K[1]+(H?"#":L||!K[1]?"?":"")+L+J}else{O=M(F!==i?F:p[g][k])}return O}a[A]=B(f,0,o);a[D]=c=B(f,1,n);c.noEscape=function(G){G=G||"";var F=$.map(G.split(""),encodeURIComponent);h=new RegExp(F.join("|"),"g")};c.noEscape(",/");$.deparam=l=function(I,F){var H={},G={"true":!0,"false":!1,"null":null};$.each(I.replace(/\+/g," ").split("&"),function(L,Q){var K=Q.split("="),P=r(K[0]),J,O=H,M=0,R=P.split("]["),N=R.length-1;if(/\[/.test(R[0])&&/\]$/.test(R[N])){R[N]=R[N].replace(/\]$/,"");R=R.shift().split("[").concat(R);N=R.length-1}else{N=0}if(K.length===2){J=r(K[1]);if(F){J=J&&!isNaN(J)?+J:J==="undefined"?i:G[J]!==i?G[J]:J}if(N){for(;M<=N;M++){P=R[M]===""?O.length:R[M];O=O[P]=M<N?O[P]||(R[M+1]&&isNaN(R[M+1])?{}:[]):J}}else{if($.isArray(H[P])){H[P].push(J)}else{if(H[P]!==i){H[P]=[H[P],J]}else{H[P]=J}}}}else{if(P){H[P]=F?i:""}}});return H};function z(H,F,G){if(F===i||typeof F==="boolean"){G=F;F=a[H?D:A]()}else{F=E(F)?F.replace(H?w:x,""):F}return l(F,G)}l[A]=B(z,0);l[D]=v=B(z,1);$[y]||($[y]=function(F){return $.extend(C,F)})({a:k,base:k,iframe:t,img:t,input:t,form:"action",link:k,script:t});j=$[y];function s(I,G,H,F){if(!E(H)&&typeof H!=="object"){F=H;H=G;G=i}return this.each(function(){var L=$(this),J=G||j()[(this.nodeName||"").toLowerCase()]||"",K=J&&L.attr(J)||"";L.attr(J,a[I](K,H,F))})}$.fn[A]=B(s,A);$.fn[D]=B(s,D);b.pushState=q=function(I,F){if(E(I)&&/^#/.test(I)&&F===i){F=2}var H=I!==i,G=c(p[g][k],H?I:{},H?F:2);p[g][k]=G+(/#/.test(G)?"":"#")};b.getState=u=function(F,G){return F===i||typeof F==="boolean"?v(F):v(G)[F]};b.removeState=function(F){var G={};if(F!==i){G=u();$.each($.isArray(F)?F:arguments,function(I,H){delete G[H]})}q(G,2)};e[d]=$.extend(e[d],{add:function(F){var H;function G(J){var I=J[D]=c();J.getState=function(K,L){return K===i||typeof K==="boolean"?l(I,K):l(I,L)[K]};H.apply(this,arguments)}if($.isFunction(F)){H=F;return G}else{H=F.handler;F.handler=G}}})})(jQuery,this);


/* Quiz related */

function setQuizCookie( quiz_id, item_id, value, correct )
{
	var cookie_str = jQuery.cookie( 'csm_quiz' );
	
	if( cookie_str )
	{
		var csm_quiz_data = jQuery.deparam( cookie_str );
	}
	else
	{
		var csm_quiz_data = new Object();
	}
	
	var key = quiz_id + '-' + item_id;
	
	csm_quiz_data[ key ] = value + '-' + correct;

	jQuery.cookie( 'csm_quiz', jQuery.param( csm_quiz_data ) );
}

function getQuizCookie( quiz_id )
{
	var returnObj = new Object();
	
	var cookie_str = jQuery.cookie( 'csm_quiz' );
	
	if( cookie_str )
	{
		var csm_quiz_data = jQuery.deparam( cookie_str );
	}
	else
	{
		var csm_quiz_data = new Object();
	}

	jQuery.each( csm_quiz_data, function( key )
	{
		keyParts = key.split( '-' );
		
		if( keyParts.length == 2 )
		{
			loopQuizId = keyParts[ 0 ];
			
			if( loopQuizId == quiz_id )
			{
				valueParts = this.split( '-' );
				
				returnObj[ keyParts[ 1 ] ] = { 'value' : valueParts[ 0 ], 'correct' : valueParts[ 1 ] };
			}
		}
	});
	
	return returnObj;
}

function getQuizCookiePage( quiz_id, item_id )
{
	var returnVal = null;
	var quizValues = getQuizCookie( quiz_id );
	
	jQuery.each( quizValues, function( key )
	{
		if( key == item_id )
		{
			returnVal = this[ 'value' ];
		}
	});
	
	return returnVal;
}	

function getQuizCookiePageCorrect( quiz_id, item_id )
{
	var returnVal = null;
	var quizValues = getQuizCookie( quiz_id );
	
	jQuery.each( quizValues, function( key )
	{
		if( key == item_id )
		{
			returnVal = this[ 'correct' ];
		}
	});
	
	return returnVal;
}

function getQuizCookieTotalCorrect( quiz_id )
{
	var returnVal = 0;
	var quizValues = getQuizCookie( quiz_id );
	
	jQuery.each( quizValues, function( key )
	{
		if( this[ 'correct' ] == 1 )
		{
			returnVal++;
		}
	});
	
	return returnVal;
}
