

var adsafeVisParams = {
	mode : "jspix",
	jsref : "http://web.adblade.com/imps.php?app=4314&ad_width=615&ad_height=250&img_pad=2&title_font=1&title_color=0066cc&description_font=1&description_color=000000&id=147&output=html",
	adsafeSrc : "",
	adsafeSep : "",
	requrl : "http://pixel.adsafeprotected.com/",
	reqquery : "anId=140&pubId=10481&campId=4314",
	debug : "false"
};

(function(){var f="3.6";var o=(adsafeVisParams.debug==="true");var y=2000;var z={INFO:"info",LOG:"log",DIR:"dir"};var k=function(E,G,C){if(typeof G==="undefined"){G=z.INFO;}if(o&&(typeof console!=="undefined")&&(typeof console.info!=="undefined")&&(typeof console.log!=="undefined")){if(typeof console.dir==="undefined"&&G===z.DIR){if(typeof E==="object"){for(var F in E){if(E.hasOwnProperty(F)){var A=(typeof C!=="undefined")?C+" : ":"";k(E[F],G,A+F);}}}else{try{console.log(C+": "+E);}catch(D){}}}else{try{console[G](E);}catch(B){}}}};var r=function(C,B){var A,F,E;k("Server Parameters:");k(adsafeVisParams,z.DIR);var D="Detection Results:\n\n";for(A in C){E=C[A];D+=E.key+": "+decodeURIComponent(E.val)+"\n";}k(D);D="key: \n";for(F in B){if(B.hasOwnProperty(F)){D+=F+": "+B[F]+"\n";}}k(D);};k("v"+f+", mode: "+adsafeVisParams.mode);var j={a:"top.location.href",b:"parent.location.href",c:"parent.document.referrer",d:"window.location.href",e:"window.document.referrer",f:"jsref",g:"ffCheck -- firefox result",q:"ffCheck -- parent.parent.parent... result"};var n=function(){var A={};try{A.a=encodeURIComponent(top.location.href);}catch(D){}try{A.b=encodeURIComponent(parent.location.href);}catch(D){}try{A.c=encodeURIComponent(parent.document.referrer);}catch(D){}try{A.d=encodeURIComponent(window.location.href);}catch(D){}try{A.e=encodeURIComponent(window.document.referrer);}catch(D){}try{A.f=encodeURIComponent(adsafeVisParams.jsref);}catch(D){}try{var C=a();A.g=encodeURIComponent(C.g);A.q=encodeURIComponent(C.q);}catch(D){}A=l(A);A=m(A);var B=[];for(var E in A){if(A.hasOwnProperty(E)){B.push({key:E,val:A[E]});}}B.sort(function(G,F){return(G.val.length>F.val.length)?1:(G.val.length<F.val.length)?-1:0;});r(B,j);return B;};var l=function(A){for(var C in A){if(A.hasOwnProperty(C)){var B=A[C];if(B==""||B=="null"||B=="undefined"||B==null||typeof B=="undefined"){delete A[C];}}}return A;};var m=function(C){var A={};for(var E in C){if(C.hasOwnProperty(E)){var D=C[E];if(typeof A[D]=="undefined"){A[D]=E;}else{A[D]+=E;}}}var B={};for(E in A){if(A.hasOwnProperty(E)){D=A[E];B[D]=E;}}return B;};var a=function(){var A={g:"",q:""};try{A.q=window.parent.parent.parent.parent.parent.parent.parent.parent.parent.parent.location.href;}catch(C){var B=C.message;var D=B.substring(B.lastIndexOf("<")+1,B.lastIndexOf(">"));if(typeof D!="undefined"&&u()){A.g=D;}}return A;};var u=function(){var C=3;var B=6;var F=13;var K=false;if(typeof window.navigator!=="undefined"&&typeof window.navigator.userAgent!==undefined){var D=window.navigator.userAgent;var A=window.navigator.userAgent.match(/Firefox\/([\.0-9]+)/);if(A!==null&&A.length==2){var H=A[1];var E=H.split(".");var I=E[0];if(parseInt(I)==C){var G=E[1];if(parseInt(G)<=B){if(E.length==3){var J=E[2];if(parseInt(J)<=F){K=true;}}else{K=true;}}}}}return K;};var v=function(){var F=window!=top;if(typeof window.mozInnerScreenY=="undefined"||!F||adsafeVisParams.mode=="jsli"){return{screenLoc:"na",embedded:F};}document.write("<span style='height:0px; width:0px; visibility:hidden; overflow:hidden; display:none'>.</span>");try{var G=w();var J=c();var C=h(G.x,G.x+G.width,J.x,J.x+J.width);var B=h(G.y,G.y+G.height,J.y,J.y+J.height);var E=(C<=0||J.width<=0)?0:Math.round(C/J.width*100);var D=(B<=0||J.width<=0)?0:Math.round(B/J.height*100);var H=Math.round(E*D/100);}catch(I){k(I);}var A;if(typeof window.mozInnerScreenY=="undefined"&&typeof window.screenY!="undefined"&&J.y==G.y){A="na";}else{if(H>=75){A="inView";}else{if(H<=25){A="outOfView";}else{A="partialView";}}}return{winDimensions:G,adDimensions:J,overlap:[C,B],percentInViewXY:[E,D],percentInView:H,screenLoc:A,embedded:F};};var w=function(){var A,E,B,C;try{A=(typeof window.screenX!="undefined")?window.screenX:0;E=(typeof window.screenY!="undefined")?window.screenY:0;if(typeof window.outerWidth!="undefined"){B=window.outerWidth;}else{if(typeof screen.availWidth!="undefined"){B=screen.availWidth;}}if(typeof window.outerHeight!="undefined"){C=window.outerHeight;}else{if(typeof screen.availHeight!="undefined"){C=screen.availHeight;}}}catch(D){k(D);if(isNaN(A)){A=0;}if(isNaN(E)){E=0;}if(isNaN(B)){B=0;}if(isNaN(C)){C=0;}}return{x:A,y:E,width:B,height:C};};var c=function(){var A,E,B,C;try{if(typeof window.mozInnerScreenX=="undefined"){A=window.screenLeft;E=window.screenTop;}else{A=Math.round(window.mozInnerScreenX);E=Math.round(window.mozInnerScreenY);}var B=0,C=0;var B=(typeof(window.innerWidth)!="undefined")?window.innerWidth:0;var C=(typeof(window.innerHeight)!="undefined")?window.innerHeight:0;}catch(D){k(D);if(isNaN(A)){A=0;}if(isNaN(E)){E=0;}if(isNaN(B)){B=0;}if(isNaN(C)){C=0;}}return{x:A,y:E,width:B,height:C};};var h=function(B,A,D,C){return Math.min(A,C)-Math.max(D,B);};var b=function(D){var E,C,A;switch(adsafeVisParams.mode){case"jss":E='<script type="text/javascript"';A="<\/script>";break;case"jsi":E='<iframe width="100%" height="100%" frameborder="0" vspace="0" hspace="0" scrolling="no" marginheight="0" marginwidth="0"';A="</iframe>";break;}var B=t(D);B+=s(B.length,false);C=' src="'+B+'">';k("writeOut: "+E+C+A);document.write(E+C+A);};var t=function(B){var A=adsafeVisParams.adsafeSrc+adsafeVisParams.adsafeSep;k("base url: "+A);k("base url length: "+A.length,z.LOG);A+=p(B,A.length);k("final url length: "+A.length,z.LOG);k("FWurl: "+A);return A;};var p=function(C,G){k("Getting urls and types");k("lengthSoFar: "+G,z.LOG);if(G>=y){return"";}var B="";var J=C.length;var K="adsafe_url=";var H="&adsafe_type=";var I=K.length+H.length;var A=false;for(var F=0;F<J;F++){var L=C[F];if(L.key.indexOf("q")!=-1){k("found q",z.LOG);if(B.length+G+I+L.val.length+L.key.length+1<=y){k("adding it",z.LOG);B+=i(L,"");A=true;}else{k("but did not add it",z.LOG);}}else{if(L.key.indexOf("g")!=-1){k("found g",z.LOG);if(B.length+G+I+L.val.length+L.key.length+1<=y){k("adding it",z.LOG);B+=i(L,"");A=true;}else{k("but did not add it",z.LOG);}}}}for(var F=0;F<J;F++){var L=C[F];if(L.key.indexOf("g")===-1&&L.key.indexOf("q")===-1){if(B.length+G+I+L.val.length+L.key.length+1<=y){var E=(A)?1:F;var D=(E>0)?"&":"";k("adding "+L.key,z.LOG);B+=i(L,D);}else{k("skipping "+L.key,z.LOG);}}}return B;};var i=function(A,C){var B=C+"adsafe_url="+A.val;B+="&adsafe_type="+A.key;k("- "+B,z.LOG);return B;};var d=function(D){var B=adsafeVisParams.requrl;if(adsafeVisParams.reqquery.length>0){B+="?"+adsafeVisParams.reqquery;}var C=p(D,B.length+1);if(C!==""){B+="&"+C;}B+=s(B.length,true);k("final url length: "+B.length,z.LOG);var A='<img src="'+B+'"/>';k("Image tag: "+A);document.write(A);};var s=function(E,I){var K="";var H=v();k("Screen Location Results");k(H,z.DIR);if(I){if(adsafeVisParams.reqquery.indexOf("planId=")===-1){var G="&planId="+H.screenLoc;if(E+G.length<=y){k("Adding screenLoc as planId");K+=G;}}}var B="&adsafe_jsinfo=sl:"+H.screenLoc+",em:"+H.embedded;var C=false;if(K.length+E+B.length<=y){k("Adding basic screenLoc");K+=B;C=true;}if(C){if(H.screenLoc!="na"){var F=H.winDimensions;var J=H.adDimensions;var A=",wc:"+F.x+"."+F.y+"."+F.width+"."+F.height;A+=",ac:"+J.x+"."+J.y+"."+J.width+"."+J.height;if(K.length+E+A.length<=y){k("Adding detailed screenLoc");K+=A;}}var D=",v:"+f;if(K.length+E+D.length<=y){k("Adding version param",z.LOG);K+=D;}}return K;};var q=function(E){var C;var B=E.length;var A=E[B-1];for(C=0;C<B;C++){var D=E[C];if(D.key.indexOf("g")!==-1){A=D;}}return A;};var e=function(B){var A=new Image();A.onload=function(){k("Image loaded: "+B);};A.src=B;};var x=n();if(adsafeVisParams.mode=="jsli"){var g=t(x);g+=s(g.length,false);e(g);}else{if(adsafeVisParams.mode=="jspix"){d(x);}else{b(x);}}})();
