!function(){function a(a){var b=document.createElement("script");b.setAttribute("src",a),b.setAttribute("type","text/javascript"),b.setAttribute("async","true"),(document.getElementsByTagName("head")[0]||document.body).appendChild(b)}function b(){for(var a,b=window.location.search,c={},d=/\+/g,e=/([^&=]+)=?([^&]*)/g,f=function(a){return decodeURIComponent(a.replace(d," "))},g=b.substring(1);a=e.exec(g);)c[f(a[1])]=f(a[2]);return c}function c(a){var b="local.antenna.is"===window.location.hostname,c="true"===a.antennaDebug,d=b?"http://local-static.antenna.is:8081":"http://www.antenna.is";return c?d+"/static/widget-new/debug/antenna.js":d+"/static/widget-new/antenna.min.js"}function d(a){var b="local.antenna.is"===window.location.hostname,c="true"===a.antennaDebug,d=b?"http://local-static.antenna.is:8081":"http://www.antenna.is";return c?d+"/static/engage_full.js":d+"/static/engage.min.js"}var e=b(),f=d(e),g=c(e),h=f;if("true"===e.antennaNewWidget)h=g;else{var i={"local.antenna.is":50,"perezhilton.com":100,"mobi.perezhilton.com":0,"dlisted.com":0,"wral.com":0,"channel3000.com":0,"wktv.com":0},j=window.antenna_host||window.location.hostname,k=i[j]||0;100*Math.random()<k&&(h=g)}a(h)}();