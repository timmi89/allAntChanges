(function(p,r){var b="",f="",h="",a="",o=0,m=[],n='http://map.media6degrees.com/orbserv/hbpix?pixId='+p+'&pcv='+r+'&cb='+Math.floor(Math.random()*9999999999);for(var g=0;3>g;++g){switch(g){case 0:f="top";h=top;break;case 1:f="par";h=parent;break;case 2:f="win";h=window;break}for(var d=0;2>d;++d){b="";a=0==d;try{b=encodeURIComponent(a?h.location.href:h.document.referrer)}catch(l){}if(""!=b){o=0;for(var c=0;m.length>c;++c){if(b==m[c]){o=1;break}}if(1>o){m[m.length]=b;n+="&"+f+(a?"Href=":"Refer=")+b}}}}(new Image(0, 0)).src = n})(6169,48);
