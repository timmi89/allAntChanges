function amzn_ads(e){"use strict";try{amznads.updateAds(e)}catch(a){try{console.log("amzn_ads: "+a)}catch(t){}}}function aax_render_ad(e){var a=e.html;document.write(a)}var amzn_console=function(){"use strict";var e={};e.log=function(){};return e}();if(window.console){amzn_console=window.console}var amznads=function(e,a,t,n){"use strict";var o="https:"===a.location.protocol;e.protocol=o?"https://":"https://";e.host="aax.amazon-adsystem.com";e.dtb_svc="/e/dtb/bid";e.pb_svc="/x/getad";e.debug_mode=e.debug_mode||false;e.tasks=e.tasks||[];e.log=function(e){try{n.log(e)}catch(a){}};if(e.debug_mode){e.log("Initiating amznads")}if(!e.ads){e.ads={}}e.updateAds=function(a){e.ads=a.ads;if(e.debug_mode){e.log("Updated ads. Executing rest of the task queue")}e.doAllTasks();e.tasks.push=function(a){e.doTask(a)}};e.getAdForSlot=function(n,o,s){e.src_id=n;var d=d||{};var r=d.u;if(!r){r=encodeURIComponent(a.documentURI);try{r=encodeURIComponent(t.top.location.href)}catch(i){}}if(r&&r.indexOf("amzn_debug_mode")!==-1){e.debug_mode=true}if(e.debug_mode){e.log("amznads.getAdForSlot: Using url="+r)}var g="src="+e.src_id+"&slot_uuid="+o+"&c=100"+"&u="+r+"&cb="+Math.round(Math.random()*1e7);var c=e.protocol+e.host+e.pb_svc+"?"+g;if(e.debug_mode){e.log("amznads.getAdAdForSlot: "+(s?"Async ":"")+"Call to: "+c)}if(s){var u=a.createElement("script");u.type="text/javascript";u.async=true;u.src=c;var m=a.getElementsByTagName("script")[0];m.parentNode.insertBefore(u,m)}else{a.write("<script type='text/javascript' src='"+c+"'></script>");a.close()}};e.getAdsAsync=function(a,t,n){e.getAds(a,t,n,true)};e.getAds=function(n,o,s,d){e.src_id=n;var s=s||{};var r=s.u;var i=s.d;if(!r){r=encodeURIComponent(a.documentURI);try{r=encodeURIComponent(t.top.location.href)}catch(g){}}if(r&&r.indexOf("amzn_debug_mode")!==-1){e.debug_mode=true}if(e.ads){if(e.debug_mode){e.log("amznads.getAds(): clear out existing ads")}e.ads={}}if(i){try{a.domain=i;if(e.debug_mode){e.log("amznads.getAds(): Using domain="+i)}}catch(c){if(e.debug_mode){e.log("amznads.getAds(): Unable to override document domain with '"+i+"'; exception="+c)}}}if(e.debug_mode){e.log("amznads.getAds(): Using url="+r)}var u="src="+n+"&u="+r+"&cb="+Math.round(Math.random()*1e7);if(o){u+="&sz="+o}var m=e.protocol+e.host+e.dtb_svc+"?"+u;if(e.debug_mode){e.log("amznads.getAds: "+(d?"Async ":"")+"Call to: "+m)}if(d){var l=a.createElement("script");l.type="text/javascript";l.async=true;l.src=m;var f=a.getElementsByTagName("script")[0];f.parentNode.insertBefore(l,f)}else{a.write("<script type='text/javascript' src='"+m+"'></script>");a.close()}};e.renderAd=function(a,t){if(e.debug_mode){e.log("amznads.renderAd: key="+t+"; ad-tag="+e.ads[t])}if(e.ads[t]){a.write(e.ads[t]);a.close()}else{var n=new Object;n.c="dtb";n.src=e.src_id;n.kvmismatch=1;n.pubReturnedKey=t;n.aaxReturnedKeys=e.getTokens();n.cb=Math.round(Math.random()*1e7);try{n.u=encodeURIComponent(location.host+location.pathname);if(navigator){n.ua=encodeURIComponent(navigator.userAgent)}}catch(o){}var s=encodeURIComponent(JSON.stringify(n));var d=e.protocol+e.host+"/x/px/p/0/"+s;if(e.debug_mode){e.log("amznads.renderAd: keyValueMismatch detected, "+"pubReturnedKey="+t+", aaxReturnedKeys="+e.getTokens())}a.write("<img src='"+d+"'/>");a.close()}};e.hasAds=function(a){var t;if(!a){try{return Object.keys(e.ads).length>0}catch(n){if(e.debug_mode){e.log("amznads.hasAds: looks like IE 8 (and below): "+n)}for(t in e.ads){if(e.ads.hasOwnProperty(t)){return true}}}}for(t in e.ads){if(e.ads.hasOwnProperty(t)){if(t.indexOf(a)>0){return true}}}return false};e.setTargeting=function(a,t){var n;for(n in e.ads){if(e.ads.hasOwnProperty(n)){if(t&&n.indexOf(t)<0){continue}a(n,"1")}}};e.setTargetingForGPTAsync=function(a){try{if(a){var t=e.getTokens();if(typeof t!="undefined"&&t.length>0){googletag.cmd.push(function(){googletag.pubads().setTargeting(a,t)})}}else{var n;for(n in e.ads){if(e.ads.hasOwnProperty(n)){(function(){var a=n;if(e.debug_mode){e.log("amznads.setTargetingForGPTAsync: pushing localKey="+a)}googletag.cmd.push(function(){if(amznads.debug_mode){amznads.log("amznads.setTargetingForGPTAsync: localKey="+a)}googletag.pubads().setTargeting(a,"1")})})()}}}if(e.debug_mode){e.log("amznads.setTargetingForGPTAsync: Completed successfully. Number of ads returned by Amazon: "+Object.keys(e.ads).length)}}catch(o){if(e.debug_mode){e.log("amznads.setTargetingForGPTAsync: ERROR - "+o)}}};e.setTargetingForGPTSync=function(a){try{if(a){var t=e.getTokens();if(typeof t!="undefined"&&t.length>0){googletag.pubads().setTargeting(a,t)}}else{var n;for(n in e.ads){if(e.ads.hasOwnProperty(n)){googletag.pubads().setTargeting(n,"1")}}}if(e.debug_mode){e.log("amznads.setTargetingForGPTSync: Completed successfully. Number of ads returned by Amazon: "+Object.keys(e.ads).length)}}catch(o){if(e.debug_mode){e.log("amznads.setTargetingForGPTSync: ERROR - "+o)}}};e.appendTargetingToAdServerUrl=function(a){var t=a;try{if(a.indexOf("?")===-1){a=a+"?"}var n;for(n in e.ads){if(e.ads.hasOwnProperty(n)){a+="&"+n+"=1"}}if(e.debug_mode){e.log("amznads.appendTargetingToAdServerUrl: Completed successfully. Number of ads returned by Amazon: "+e.ads.length)}}catch(o){if(e.debug_mode){e.log("amznads.appendTargetingToAdServerUrl: ERROR - "+o)}}if(e.debug_mode){e.log("amznads.appendTargetingToAdServerUrl: input url: "+t+"\nreturning url: "+a)}return a};e.appendTargetingToQueryString=function(a){var t=a;try{var n;for(n in e.ads){if(e.ads.hasOwnProperty(n)){a+="&"+n+"=1"}}}catch(o){if(e.debug_mode){e.log("amznads.appendTargetingToQueryString: ERROR - "+o)}}if(e.debug_mode){e.log("amznads.appendTargetingToQueryString: input query-string:"+t+"\nreturning query-string:"+a)}return a};e.getTokens=function(a){var t,n=[];try{for(t in e.ads){if(e.ads.hasOwnProperty(t)){if(a&&t.indexOf(a)<0){continue}n.push(t)}}}catch(o){if(e.debug_mode){e.log("amznads.getTokens: ERROR - "+o)}}if(e.debug_mode){e.log("amznads.getTokens: returning tokens = "+n)}return n};e.getKeys=e.getTokens;e.doAllTasks=function(){while(e.tasks.length>0){var a=e.tasks.shift();e.doTask(a)}};e.doTask=function(a){try{a.call()}catch(t){if(e.debug_mode){e.log("Failed calling task: "+t)}}};e.tryGetAdsAsync=function(){if(e.asyncParams){e.getAdsAsync(e.asyncParams.id,e.asyncParams.size,e.asyncParams.data)}};return e}(amznads||{},document,window,amzn_console);amznads.tryGetAdsAsync();window["amzn_ads"]=amzn_ads;window["amznads"]=amznads;
