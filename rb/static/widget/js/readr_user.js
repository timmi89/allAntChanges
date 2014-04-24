// querystring stuff
// used to create an array called qs_args which holds key/value paris from the querystring of the iframe
var qs = ( window.location.search + window.location.hash ).substr(1).split('&');
var qs_args = [];
for ( var i in qs ) {
	var this_arg = qs[i].split('=');
	qs_args[this_arg[0]] = this_arg[1];
}
if ( typeof qs_args.group_id == "undefined" ) {
    qs_args.group_id = "";
}

function getWindowProps(options){
    options = options || {};
    var w = options.width || 400;
    var h = options.height || 350;
    var l = (window.screen.width/2)-(w/2);
    var t = (window.screen.height/2)-(h/2);
    return 'menubar=1,resizable=1,scrollbars=yes,width='+w+',height='+h+',top='+t+',left='+l;
};

// FatFractal minified
/*
*/
function RegisterRequest(){return this.userName=null,this.password=null,this.firstName=null,this.lastName=null,this.email=null,this}function FFUser(){return this.clazz="FFUser",this.userName=null,this.firstName=null,this.lastName=null,this.email=null,this.active=null,this}function FFMetaData(a){return this.clazz=null,this.ffUrl=null,this.guid=null,this.ffRL=null,this.objVersion=null,this.createdBy=null,this.createdAt=null,this.updatedBy=null,this.updatedAt=null,this.ffRefs=[],this.ffUserCanEdit=!1,a&&(this.clazz=a.clazz,this.ffUrl=a.ffUrl,this.guid=a.guid,this.ffRL=a.ffRL,this.objVersion=a.objVersion,this.createdBy=a.createdBy,this.createdAt=a.createdAt,this.updatedBy=a.updatedBy,this.updatedAt=a.updatedAt,this.ffRefs=a.ffRefs,this.ffUserCanEdit=a.ffUserCanEdit),this}function Token(a,b){this.token=a,this.secret=b}function FatFractal(){function v(){var a=location.href;i&&console.log("FatFractal().getWindowURL(String) url is: "+a);var b=a.substring(0,a.indexOf("/",14));i&&console.log("FatFractal().getWindowURL(String) baseURL is: "+b);var c,d,e;c=location.pathname,d=a.indexOf(c),e=a.indexOf("/",d+1);var f=a.substr(0,e)+"/";return i&&console.log("FatFractal().getWindowURL(String) returning : "+f),f}function x(a){l=a===!0?!0:!1}function z(a){function b(a,b,c,d,e){var f=new XDomainRequest;f.onload=function(){var a;try{a=JSON.parse(f.responseText)}catch(b){e?e(f.status,f.responseText):y(f.status,f.responseText)}a&&d&&d(a,f)},f.onerror=f.ontimeout=function(){console.error&&console.error("FatFractal.m_ajax "+f.status+", "+f.responseText),e&&e(f.status,f.responseText)},f.onprogress=function(){},f.open(a,b),f.send(c)}var c;try{c=new XMLHttpRequest}catch(f){try{c=new ActiveXObject("Msxml2.XMLHTTP")}catch(f){try{c=new ActiveXObject("Microsoft.XMLHTTP")}catch(f){try{"undefined"!=typeof XDomainRequest&&b(a.type,a.url,a.data,a.success,a.error)}catch(f){var g="A browser that supports AJAX requests is required!";throw alert(g),g}}}}var h=!1;c.open(a.type.toUpperCase(),a.url,!0),a.dataType?"application/json"==a.dataType.toLowerCase()||"json"==a.dataType.toLowerCase()?c.setRequestHeader("Data-type","application/json"):c.setRequestHeader("Data-type",a.dataType):c.setRequestHeader("Data-type","application/json"),a.contentType?"application/json"==a.contentType.toLowerCase()||"json"==a.contentType.toLowerCase()?c.setRequestHeader("Content-type","application/json"):c.setRequestHeader("Content-type",a.contentType):c.setRequestHeader("Content-type","application/json"),a.contentLength&&c.setRequestHeader("Content-Length",a.contentLength),a.contentName&&c.setRequestHeader("Content-Name",a.contentName),a.fileName&&c.setRequestHeader("x-file-name",a.fileName),a.fileSize&&c.setRequestHeader("x-file-size",a.fileSize),a.fileType&&c.setRequestHeader("x-file-type",a.fileType),l&&d&&(c.setRequestHeader("X-Ff-Auth-User-Guid",e.guid),c.setRequestHeader("X-Ff-Auth-Session-Id",k)),c.send(a.data),c.onreadystatechange=function(){if(4==c.readyState){if(i&&console.log("xmlHTTP.status: "+c.status+", xmlHTTP.readyState: "+c.readyState+", xmlHTTP.responseText: "+c.responseText),h)return;if(h=!0,c.status>=200&&c.status<300){var b=JSON.parse(c.responseText);a.success?(i&&console.log(JSON.stringify(b)),a.success(b)):i&&console.log("no success callback")}else 304==c.status||(console.error&&console.error(c.status+": "+c.statusText),401==c.status&&(console.error&&console.error("Got a 401 - clearing all session info"),d=!1,e=null,k=null,J()),a.error?(a.error(c),console.error&&console.error("xmlHTTP : "+u(c))):i&&console.log("no success callback"))}else i&&console.log("xmlHTTP.status: "+c.status+", xmlHTTP.readyState: "+c.readyState+", xmlHTTP.responseText: "+c.responseText)}}function G(a){var b,c,d,e=document.cookie.split(";");for(b=0;b<e.length;b++)if(c=e[b].substr(0,e[b].indexOf("=")),d=e[b].substr(e[b].indexOf("=")+1),c=c.replace(/^\s+|\s+$/g,""),c==a)return unescape(d);return null}function I(a){return null==c&&(c=H.getBaseUrl()),c+"::"+a}function J(){sessionStorage.removeItem(I("user")),sessionStorage.removeItem(I("sessionID"))}function K(a,b){i&&console.log("Storing session info for "+I("user"),a),sessionStorage.setItem(I("user"),JSON.stringify(a)),i&&console.log("Storing session info for "+I("sessionID"),b),sessionStorage.setItem(I("sessionID"),b),g[a.ffUrl]=a}function L(){var a;return a=l===!0?sessionStorage.getItem(I("sessionID")):G("sessionId"),a?a:null}function M(){i&&console.log("Retrieving user info for "+I("user"));var a=JSON.parse(sessionStorage.getItem(I("user")));return null===a||void 0===a?(console.log&&console.log("No existing user info found - creating new FFUser"),a=new FFUser):i&&console.log("Found existing FFUser session info: ",a),g[a.ffUrl]=a,a}var a=this,b=b;b||(b={}),b.console&&"undefined"!=typeof b.console||(b.console={}),b.console.log&&"undefined"!=typeof b.console.log||(b.console.log={log:function(){}}),b.console.error&&"undefined"!=typeof b.console.error||(b.console.error={error:function(){}}),Array.isArray||(Array.isArray=function(a){return"[object Array]"===Object.prototype.toString.call(a)}),Object.prototype.__defineGetter__&&!Object.defineProperty&&(Object.defineProperty=function(a,b,c){"get"in c&&a.__defineGetter__(b,c.get),"set"in c&&a.__defineSetter__(b,c.set)}),Array.prototype.indexOf||(Array.prototype.indexOf=function(a,b){for(var c=b||0,d=this.length;d>c;c++)if(this[c]===a)return c;return-1});var c=null,d=!1,e=null,f=null,g={},h={},i=!1,j=!1,k=null,l=!1,m={},n={},o={},p=!0,q=!1,r="FF_JS_CS_SDK_R1.2.0_R2656";this.SCRIPT_AUTH_SERVICE_FACEBOOK="FACEBOOK",this.SCRIPT_AUTH_SERVICE_TWITTER="TWITTER";var t=function(){var a=new XMLHttpRequest;return a.upload?!0:!1},u=function(a){var b=[];return JSON.stringify(a,function(a,c){if("object"==typeof c){if(b.indexOf(c)>=0)return void 0;b.push(c)}return c})};this.setDebug=function(a){i=a?!0:!1,console.log("FatFractal().setDebug(boolean) set debug mode to: "+i)},this.setAutoLoadRefs=function(a){p=a?!0:!1},this.setAutoLoadBlobs=function(a){q=a?!0:!1},this.getDebug=function(){return i&&console.log("FatFractal().getDebug() determined debug mode is: "+i),i?!0:!1},this.version=function(){return i&&console.log("FatFractal().version() determined version is: "+r),r};var w=function(a,b){i&&console.log("FatFractal().m_validUrl received url: "+a),i&&console.log("FatFractal().m_validUrl received type: "+b);var c=null;return c="extension"==b?"/"==a.substring(0,1)?"/ff/ext/"==a.substring(0,8)?a.substring(1,a.length):"ff/ext"+a:"ff/ext/"==a.substring(0,7)?a:"ff/ext/"+a:"resources"==b||"resource"==b?"/"==a.substring(0,1)?"/ff/resources/"==a.substring(0,14)?a.substring(1,a.length):"ff/resources"+a:"ff/resources/"==a.substring(0,13)?a:"ff/resources/"+a:"/"==a.substring(0,1)?"/ff/resources/"==a.substring(0,14)?a.substring(1,a.length):"/ff/ext/"==a.substring(0,8)?a.substring(1,a.length):"ff/resources"+a:"ff/resources/"==a.substring(0,13)?a:"ff/ext/"==a.substring(0,7)?a:"ff/resources/"+a,i&&console.log("FatFractal().m_validUrl returned validUrl: "+c),c};this.setBaseUrl=function(a){return c=a?"/"==a.charAt(a.length-1)?a:a+"/":null,i&&console.log("FatFractal().setBaseUrl(String) m_baseUrl to: "+c),c},this.getBaseUrl=function(){var a=null;return null==c?(a=v(),i&&console.log("FatFractal().getBaseUrl() window location is: "+a)):a=c,i&&console.log("FatFractal().getBaseUrl() determined base url is: "+a),a},this.setSSLUrl=function(){},this.getSSLUrl=function(){return this.getBaseUrl()},this.setSimulateCookies=x,this.loggedIn=function(){return k=L(),i&&console.log("FatFractal().loggedIn() determined m_sessionId is: "+k),M().guid&&(e=M()),i&&console.log("FatFractal().loggedIn() determined m_loggedInUser is: "+u(e)),k&&e?d=!0:(k=null,d=!1,e=null,J()),i&&console.log("FatFractal().loggedIn() determined loggedIn is: "+d),d},this.loggedInUser=function(){return k=L(),i&&console.log("FatFractal().loggedInUser() determined m_sessionId is: "+k),M().guid&&(e=M()),i&&console.log("FatFractal().loggedInUser() determined m_loggedInUser is: "+u(e)),k&&e?d=!0:(k=null,d=!1,e=null,J()),i&&console.log("FatFractal().loggedInUser() determined m_loggedInUser is: "+u(e)),e},this.sessionId=function(){return null==k&&(k=L(),i&&console.log("FatFractal().sessionId() determined m_sessionId is: "+k),M().guid&&(e=M()),i&&console.log("FatFractal().sessionId() determined m_loggedInUser is: "+u(e)),k&&e?d=!0:(k=null,d=!1,e=null,J())),i&&console.log("FatFractal().sessionId() determined sessionId is: "+k),k},this.getCallbackUriForScriptAuthService=function(a){return m[a]},this.setCallbackUriForScriptAuthService=function(a,b){m[a]=b},this.getTokenForScriptAuthService=function(a){return n[a]},this.setTokenForScriptAuthService=function(a,b){n[a]=b},this.clearTokenForScriptAuthService=function(a){delete n[a]},this.getRequestTokenForScriptAuthService=function(a){return o[a]},this.setRequestTokenForScriptAuthService=function(a,b){o[a]=b},this.clearRequestTokenForScriptAuthService=function(a){delete o[a]},this.serverStatusMessage=function(){return f},this.defaultErrorCallback=function(a,b){console.error&&console.error(a+": "+b)};var y=this.defaultErrorCallback;this.defaultSuccessCallback=function(a){console.log&&console.log(a)},this._toJSON=JSON.stringify,this._fromJSON=JSON.parse,this.AjaxParams=function(){this.dataType=null,this.contentType=null,this.contentLength=null,this.contentName=null,this.fileName=null,this.fileType=null,this.fileSize=null},this.setDefaultPermission=function(a,b,d){var e=w(a.ffUrl)+"/ffACL";c&&(e=c+e),z({type:"PUT",url:e,dataType:"json",contentType:"application/json",data:null,success:function(a){b&&b(a)},error:function(a){console.error&&console.error("FatFractal.setDefaultPermission "+a.status+", "+a.responseText),f="HTTP request failed - response code was "+a.status+" responseText was "+a.responseText,d&&d(a.status,a.responseText)}})},this.PermissionObject=function(a,b,c,d){this.readUsers=a?a:null,this.readGroups=b?b:null,this.writeUsers=c?c:null,this.writeGroups=d?d:null},this.setPermission=function(b,d,e,g,h,i,j){var k=new this.PermissionObject(d,e,g,h),l=w(b.ffUrl)+"/ffACL";c&&(l=c+l),z({type:"PUT",url:l,dataType:"json",contentType:"application/json",data:a._toJSON(k),success:function(a){i&&i(a)},error:function(a){console.error&&console.error("FatFractal.setPermission "+a.status+", "+a.responseText),f="HTTP request failed - response code was "+a.status+" responseText was "+a.responseText,j&&j(a.status,a.responseText)}})},this.grabBagGetAll=function(b,c,d,e){a.grabBagGetAllForQuery(b,c,null,d,e)},this.grabBagGetAllForQuery=function(b,c,d,e,f){var g=b.ffUrl+"/"+c;null!=d&&(g=g+"/("+d+")"),a.getArrayFromUri(g,e,f)},this.grabBagAdd=function(b,c,d,e,f){a.handleGrabBagRequest(b,c,d,!0,e,f)},this.grabBagRemove=function(b,c,d,e,f){a.handleGrabBagRequest(b,c,d,!1,e,f)},this.GrabBagAddOrRemoveObj=function(a,b){this.ffUrl=a?a:null,this.AddOrRemove=b?b:null},this.handleGrabBagRequest=function(b,d,e,g,h,i){if(!h)throw new Error("FatFractal.handleGrabBagRequest: successCallback not supplied");if(i||(i=a.defaultErrorCallback),!i)throw new Error("FatFractal.handleGrabBagRequest: errorCallback not supplied");var j=g?"ADD":"REMOVE",k=d.ffUrl+"/"+e,l=b.ffUrl,m=new this.GrabBagAddOrRemoveObj(l,j),n=w(k);c&&(n=c+n),z({type:"POST",url:n,dataType:"json",contentType:"application/json",data:a._toJSON(m),success:function(a){h&&h(a)},error:function(a){console.error&&console.error("FatFractal.handleGrabBagRequest "+a.status+", "+a.responseText),f="HTTP request failed - response code was "+a.status+" responseText was "+a.responseText,i&&i(a.status,a.responseText)}})},this.register=function(b,c,g){if(!c)throw new Error("FatFractal.register: successCallback not supplied");if(g||(g=a.defaultErrorCallback),!g)throw new Error("FatFractal.register: errorCallback not supplied");var h=this.getBaseUrl()+"ff/register";z({type:"POST",url:h,dataType:"json",contentType:"application/json",data:a._toJSON(b),success:function(a){null!=a.result&&null!=a.result.loggedInUser?(d=!0,e=a.result.loggedInUser,k=a.result.authResult.session.sessionId,K(e,k),c&&c(e)):g&&g(500,"No result.loggedInUser in response")},error:function(a){console.error&&console.error("FatFractal.register "+a.status+", "+a.responseText),f="HTTP request failed - response code was "+a.status+" responseText was "+a.responseText,g&&g(a.status,a.responseText)}})},this.registerWithScriptAuthService=function(a,b,c){var d=new RegisterRequest;d.authDomain="SCRIPT",d.scriptAuthService=a;var e=this.getTokenForScriptAuthService(a);d.token=e.token,d.secret=e.secret,this.register(d,b,c)},this.login=function(a,b,c,d){var e={userName:a,password:b};this.loginUsingCredential(e,c,d)},this.loginUsingConsoleCredentials=function(a,b,c,d){var e={authDomain:"FFCONSOLE",userName:a,password:b};this.loginUsingCredential(e,c,d)},this.loginWithScriptAuthService=function(a,b,c){var d=this.getTokenForScriptAuthService(a),e={authDomain:"SCRIPT",scriptAuthService:a,token:d.token,secret:d.secret};this.loginUsingCredential(e,b,c)},this.loginUsingCredential=function(b,c,g){if(!c)throw new Error("FatFractal.loginUsingConsoleCredentials: successCallback not supplied");if(g||(g=a.defaultErrorCallback),!g)throw new Error("FatFractal.loginUsingConsoleCredentials: errorCallback not supplied");var h={credential:b},i=this.getBaseUrl()+"ff/login";z({type:"POST",url:i,dataType:"json",contentType:"application/json",data:a._toJSON(h),success:function(a){null!=a.result&&null!=a.result.loggedInUser?(d=!0,e=a.result.loggedInUser,k=a.result.authResult.session.sessionId,K(e,k),c&&c(e)):g&&g(500,"No result.loggedInUser in response")},error:function(a){console.error&&console.error("FatFractal.login "+a.status+", "+a.responseText),f="HTTP request failed - response code was "+a.status+" responseText was "+a.responseText,g&&g(a.status,a.responseText)}})},this.logout=function(b,h){if(b||(b=a.defaultSuccessCallback),!b)throw new Error("FatFractal.logout: successCallback not supplied");if(h||(h=a.defaultErrorCallback),!h)throw new Error("FatFractal.logout: errorCallback not supplied");var i="ff/logout";c&&(i=c+"ff/logout"),z({type:"POST",url:i,dataType:"json",contentType:"application/json",success:function(a){d=!1,e=null,k=null,J(),g={},b&&b(a)},error:function(a){console.error&&console.error("FatFractal.logout "+a.status+", "+a.responseText),f="HTTP request failed - response code was "+a.status+" responseText was "+a.responseText,h&&h(a.status,a.responseText)}})},this.authUriForScriptAuthService=function(a,b,c){var d=this.getCallbackUriForScriptAuthService(a);if(!d)throw new Error("FatFractal.authUriForScriptAuthService: no callback URI found for ScriptAuth service "+a);var e=this.getBaseUrl()+"/ff/auth?action=getAuthUri&scriptAuthService="+a+"&callbackUri="+encodeURIComponent(d),g=this;z({type:"GET",url:e,dataType:"JSON",data:null,success:function(c){if(!c.result)throw new Error("FatFractal.authUriForScriptAuthService: response does not contain 'result'");var d=c.result.authorizationUri;if(!d)throw new Error("FatFractal.authUriForScriptAuthService: response does not contain 'authorizationUri'");var e=c.result.token,f=c.result.secret;e&&g.setRequestTokenForScriptAuthService(a,new Token(e,f)),b(d,c.statusMessage)},error:function(a){console.error&&console.error("FatFractal.authUriForScriptAuthService "+a.status+", "+a.responseText),f="HTTP request failed - response code was "+a.status+" responseText was "+a.responseText,c&&c(a.status,a.responseText)}})},this.retrieveAccessTokenForScriptAuthService=function(a,b,c,d){var e=this.getCallbackUriForScriptAuthService(a);if(!e)throw new Error("FatFractal.authUriForScriptAuthService: no callback URI found for ScriptAuth service "+a);var g=b.substr(b.indexOf("?")+1);g.indexOf("#")>=0&&(g=g.substr(0,g.indexOf("#")));var h=this.getBaseUrl()+"ff/auth?action=getToken&scriptAuthService="+a+"&callbackUri="+encodeURIComponent(e)+"&codeQuery="+encodeURIComponent(g),i=o[a];i?(h+="&token="+i.token+"&secret="+i.secret,delete o[a]):console.log("Did not find token");var j=this;z({type:"GET",url:h,dataType:"JSON",data:null,success:function(b){if(!b.result)throw new Error("FatFractal.authUriForScriptAuthService: response does not contain 'result'");if(!b.result.credential)throw new Error("FatFractal.authUriForScriptAuthService: response does not contain 'credential'");var d=b.result.credential.token;if(!d)throw new Error("FatFractal.authUriForScriptAuthService: response does not contain token");var e=b.result.credential.secret;j.setTokenForScriptAuthService(a,new Token(d,e)),c(null,b.statusMessage)},error:function(a){console.error&&console.error("FatFractal.retrieveAccessTokenForScriptAuthService "+a.status+", "+a.responseText),f="HTTP request failed - response code was "+a.status+" responseText was "+a.responseText,d&&d(a.status,a.responseText)}})};var A=function(a,b){for(var c in b)a[c]=b[c]};this.createObjAtUri=function(b,d,e,j){function l(a){if(a&&a.constructor&&a.constructor.toString){var b=a.constructor.toString().match(/function\s*(\w+)/);if(b&&2==b.length)return b[1]}return void 0}var k=this;if(i&&console.log("FatFractal.createObjAtUri was called."),e||(e=a.defaultSuccessCallback),!e)throw new Error("FatFractal.createObjAtUri: successCallback not supplied");if(j||(j=a.defaultErrorCallback),!j)throw new Error("FatFractal.createObjAtUri: errorCallback not supplied");var m=l(b);b.clazz?console.log("object has clazz defined: "+b.clazz):m?b.clazz=m:console.error&&console.error("cannot resolve the class name for this object"),i&&console.log("FatFractal.createObjAtUri thinks this class is: "+m+".");var n=F(b),o=b.ffUrl,p=w(d);c&&(p=c+p),z({type:"POST",url:p,dataType:"json",contentType:"application/json",data:n,success:function(a){function l(a,b,c){i&&console.log("pendingBlobs is "+JSON.stringify(b,null,2));var d=b.shift();d?(i&&console.log("blob is "+JSON.stringify(d)),i&&console.log("FatFractal.createObjAtUri will save a blob called: "+d.name),i&&console.log("FatFractal.createObjAtUri is saving a blob with byteLength : "+d.blob.byteLength+" bytes: "),k.updateBlobForObj(a,d.blob,d.name,null,function(a){l(a,b,c)},function(a,b){j(a,"Failed to upload blob member: "+b)})):c(a)}i&&console.log("FatFractal.createObjAtUri: CREATE response is "+u(a)),A(b,a.result),i&&console.log("FatFractal.createObjAtUri: Adding object to local cache"),g[a.result.ffUrl]=b;var c=h[o];if(c){var d=[];for(var f in c)d.push({name:f,blob:c[f]});l(b,d,function(){C(b,function(){e(b,a.statusMessage)})})}else C(b,function(){e(b,a.statusMessage)})},error:function(a){console.error&&console.error("FatFractal.createObjAtUri "+a.status+", "+a.responseText),f="HTTP request failed - response code was "+a.status+" responseText was "+a.responseText,j(a.status,a.responseText)}})},this.updateObj=function(b,d,e){if(d||(d=a.defaultSuccessCallback),!d)throw new Error("FatFractal.updateObj: successCallback not supplied");if(e||(e=a.defaultErrorCallback),!e)throw new Error("FatFractal.updateObj: errorCallback not supplied");if(!b.ffUrl)throw new Error("Cannot update this object - doesn't have FatFractal metadata");var h=F(b),j=w(b.ffUrl);c&&(j=c+j),z({type:"PUT",url:j,dataType:"json",contentType:"application/json",data:h,success:function(a){i&&console.log("FatFractal.updateObj: UPDATE response is "+u(a)),A(b,a.result),i&&console.log("FatFractal.updateObj: Updating local cache"),g[a.result.ffUrl]=b,C(b),d(b,a.statusMessage)},error:function(a){console.error&&console.error("FatFractal.updateObj "+a.status+", "+a.responseText),f="HTTP request failed - response code was "+a.status+" responseText was "+a.responseText,e&&e(a.status,a.responseText)}})},this.updateBlobForObj=function(b,d,e,g,h,j){if(!b)throw new Error("updateBlobForObj - obj argument must be supplied");if(!b.ffUrl)throw new Error("updateBlobForObj - obj argument does not have ffUrl field");if("string"!=typeof b.ffUrl)throw new Error("updateBlobForObj - obj.ffUrl should be a string");if(!e||"string"!=typeof e||0==e.length)throw new Error("updateBlobForObj - memberName not supplied");if(!d||!d.byteLength||0==d.byteLength)throw new Error("updateBlobForObj - blob not supplied");if(h||(h=a.defaultSuccessCallback),!h)throw new Error("FatFractal.updateBlobForObj: successCallback not supplied");if(j||(j=a.defaultErrorCallback),!j)throw new Error("FatFractal.updateBlobForObj: errorCallback not supplied");if(i&&console.log("FatFractal.updateBlobForObj "+b.ffUrl+" memberName "+e+" mimeType "+g),g&&g.length&&0!=g.length||(g="application/octet-stream"),d.byteLength>0){var k=w(b.ffUrl);c&&(k=c+k),z({type:"PUT",url:k+"/"+e,dataType:g,contentType:g,data:d,success:function(a){i&&console.log("FatFractal.updateBlobForObj "+b.ffUrl+" memberName "+e+" : response status "+a.statusMessage),A(b,a.result),h(b,a.statusMessage)},error:function(a){console.error&&console.error("FatFractal.updateBlobForObj "+a.status+", "+a.responseText),f="HTTP request failed - response code was "+a.status+" responseText was "+a.responseText,j&&j(a.status,a.responseText)}})}},this.deleteBlobForObj=function(b,d,e,g){if(!b)throw new Error("deleteBlobForObj - obj argument must be supplied");if(!b.ffUrl)throw new Error("deleteBlobForObj - obj argument does not have ffUrl field");if("string"!=typeof b.ffUrl)throw new Error("deleteBlobForObj - obj.ffUrl should be a string");if(!d||"string"!=typeof d||0==d.length)throw new Error("deleteBlobForObj - memberName not supplied");if(!e)throw new Error("FatFractal.deleteBlobForObj: successCallback not supplied");if(g||(g=a.defaultErrorCallback),!g)throw new Error("FatFractal.deleteBlobForObj: errorCallback not supplied");i&&console.log("FatFractal.deleteBlobForObj "+b.ffUrl+" memberName "+d);var h=w(b.ffUrl);c&&(h=c+h),z({type:"DELETE",url:h+"/"+d,dataType:"json",success:function(a){console.log&&console.log("FatFractal.deleteBlobForObj "+b.ffUrl+" memberName "+d+" : response status "+a.status+", "+a.responseText),e(b,a.statusMessage)},error:function(a){console.error&&console.error("FatFractal.deleteBlobForObj "+a.status+", "+a.responseText),f="HTTP request failed - response code was "+a.status+" responseText was "+a.responseText,g&&g(a.status,a.responseText)}})},this.deleteObj=function(b,d,e){if(d||(d=a.defaultSuccessCallback),!d)throw new Error("FatFractal.deleteObj: successCallback not supplied");if(e||(e=a.defaultErrorCallback),!e)throw new Error("FatFractal.deleteObj: errorCallback not supplied");if(!b.ffUrl)throw new Error("Cannot delete this object - doesn't have FatFractal metadata");var h=w(b.ffUrl);c&&(h=c+h),z({type:"DELETE",url:h,dataType:"json",data:null,success:function(a){i&&console.log("FatFractal.deleteObj: Removing deleted object from local cache"),delete g[b.ffUrl],d(a.statusMessage)},error:function(a){console.error&&console.error("FatFractal.deleteObj "+a.status+", "+a.responseText),f="HTTP request failed - response code was "+a.status+" responseText was "+a.responseText,e&&e(a.status,a.responseText)}})},this.postObjToExtension=function(b,c,d,e){if(d||(d=a.defaultSuccessCallback),!d)throw new Error("FatFractal.postObjToExtension: successCallback not supplied");if(e||(e=a.defaultErrorCallback),!e)throw new Error("FatFractal.postObjToExtension: errorCallback not supplied");var g=w(c,"extension");this.createObjAtUri(b,g,function(a,b){d(a,b)},function(a,b){console.error&&console.error("FatFractal.postObjToExtension "+a+", "+b),f="HTTP request failed - response code was "+a+" responseText was "+b,e&&e(a,b)})},this.getObjFromExtension=function(a,b,c){var d=w(a,"extension");this.getArrayFromUri(d,function(a){var c=null;if(a.length>1)throw"getObjFromExtension received "+a.length+" objects from the server. Suggest use getArrayFromExtension() instead.";a.length>0&&(c=a[0]),b(c,a.statusMessage)},function(a,b){console.error&&console.error("FatFractal.getObjFromExtension "+a+", "+b),f="HTTP request failed - response code was "+a+" responseText was "+b,c&&c(a,b)})},this.getArrayFromExtension=function(a,b,c){var d=w(a,"extension");this.getArrayFromUri(d,function(a){b(a,a.statusMessage)},function(a,b){console.error&&console.error("FatFractal.getArrayFromExtension "+a+", "+b),f="HTTP request failed - response code was "+a+" responseText was "+b,c&&c(a,b)})},this.getObjFromUri=function(b,c,d){if(!c)throw new Error("FatFractal.getObjFromUri: successCallback not supplied");if(d||(d=a.defaultErrorCallback),!d)throw new Error("FatFractal.getObjFromUri: errorCallback not supplied");var e=w(b,"resources");this.getArrayFromUri(e,function(a){var b=null;a.length>0&&(b=a[0]),c(b,a.statusMessage)},function(a,b){console.error&&console.error("FatFractal.getObjFromUri.getArrayFromUri "+a+", "+b),f="HTTP request failed - response code was "+a+" responseText was "+b,d&&d(a,b)})};var B=function(a,b){var c=g[a.ffUrl];if(null==c)i&&console.log("FatFractal.getArrayFromUri: Adding "+a.ffUrl+" to cache"),g[a.ffUrl]=a;else{i&&console.log("FatFractal.getArrayFromUri: Updating existing "+a.ffUrl+" in cache");for(d in c)c[d]=null;for(var d in a)c[d]=a[d]}a=g[a.ffUrl],C(a,b)};this.getArrayFromUri=function(b,d,e){if(!d)throw new Error("FatFractal.getArrayFromUri: successCallback not supplied");if(e||(e=a.defaultErrorCallback),!e)throw new Error("FatFractal.getArrayFromUri: errorCallback not supplied");var h=w(b);c&&(h=c+h),z({type:"GET",url:h,dataType:"json",data:null,success:function(a){function n(c,e){h[c]&&(h[c].count--,0===h[c].count&&delete h[c]),l++,j&&console.log("getArrayFromUri.incrThingsDone for "+b+" : "+c+" : "+e+" : "+l+"/"+f+" remaining: "+JSON.stringify(h,null,2)),i&&console.log("thingsDone for "+b+" : "+l+"/"+f),l===f&&d(m,a.statusMessage)}var c;c=null===a||null===a.result?[]:Array.isArray(a.result)?a.result:[a.result];for(var e=a.references,f=(e?e.length:0)+2*c.length,h={},k=0;k<c.length;k++)c[k].ffUrl&&(h[c[k].ffUrl]={count:2});var l=0,m=[];if(j&&console.log("getArrayFromUri starting: "+b+" : "+l+"/"+f+" remaining: "+JSON.stringify(h,null,2)),e)for(var o=0;o<e.length;o++)B(e[o],function(){n()});for(k=0;k<c.length;k++)c[k].ffUrl?(B(c[k],function(a,b){n(a,"processResultCallback from "+b)}),m.push(g[c[k].ffUrl]),n(c[k].ffUrl,"Just because")):(m.push(c[k]),n(c[k].ffUrl,"Once"),n(c[k].ffUrl,"Twice"));0===f&&d(m,a.statusMessage)},error:function(a){console.error&&console.error("FatFractal.getArrayFromUri "+a.status+", "+a.responseText),f="HTTP request failed - response code was "+a.status+" responseText was "+a.responseText,e&&e(a.status,a.responseText)}})},this.executeFFDL=function(b,c,d){if(c||(c=a.defaultSuccessCallback),!c)throw new Error("FatFractal.executeFFDL: successCallback not supplied");if(d||(d=a.defaultErrorCallback),!d)throw new Error("FatFractal.executeFFDL: errorCallback not supplied");var e=this.getBaseUrl()+"ff/metadata";z({type:"POST",url:e,dataType:"json",contentType:"application/json",data:a._toJSON({ffdl:b}),success:function(a){c(a)},error:function(a){d&&d(a)}})},this.getFFDL=function(b,c){if(!b)throw new Error("FatFractal.getFFDL: successCallback not supplied");if(c||(c=a.defaultErrorCallback),!c)throw new Error("FatFractal.getFFDL: errorCallback not supplied");var d=this.getBaseUrl()+"ff/metadata";z({type:"GET",url:d,dataType:"json",data:null,success:function(a){b(a.result)},error:function(a){c&&c(a)}})},this.forgetObj=function(a){if(null==a||null==a.ffUrl)throw"forgetObj: An object with an ffUrl field must be supplied";i&&console.log("forgetObj: forgetting object "+a.ffUrl),delete g[a.ffUrl]},this.getFromInMemCache=function(a){return g[a]};var C=function(a,b){function c(){i&&console.log("m_loadAllReferences for "+a.ffUrl+" DONE"),b&&b(a.ffUrl,"Load All References")}function f(){e++,i&&console.log("loaded refs: "+e+"/"+d),e===d&&c()}if(p)if(null!=a.ffRefs&&0!=a.ffRefs.length){i&&console.log("m_loadAllReferences: Iterating over references: "+u(a.ffRefs));for(var d=a.ffRefs.length,e=0,h=0;d>e&&h<a.ffRefs.length;h++){var j=a.ffRefs[h],k=g[j.url];k?(a[j.name]=k,i&&console.log("m_loadAllReferences: Found cached reference for : "+u(j)),f()):(i&&console.log("m_loadAllReferences: Loading reference: "+u(j)+" for "+a.ffUrl),D(j,a,f))}}else c();else c()},D=function(b,d,e){function f(){i&&console.log("m_loadReference Calling done for reference "+u(b)+" of obj "+d.ffUrl),e&&e(d.ffUrl,"Load One Reference")}i&&console.log("m_loadReference: referringObj = "+JSON.stringify(d));var h=g[b.url];if(null==h)if(("FFO"==b.type||"FFB"==b.type&&q)&&(h={ffUrl:b.url},g[b.url]=h,d[b.name]=h),i&&console.log("m_loadReference: refItem.url is - "+b.url),"FFO"==b.type)a.getObjFromUri(b.url,function(a){if(!a)return console.error&&console.error("Reference for ["+b.url+"] was not returned to m_loadReference's success block"),f(),void 0;i&&console.log("Loaded reference: "+u(a));for(var c in a)h[c]=a[c];f()},function(){console.error&&console.error("Warning: Failed to load reference: "+u(b)),f()});else if("FFB"==b.type)if(q)if(t){i&&console.log("Warning: Attempting to load a blob: "+u(b));var j=w(d.ffUrl);c&&(j=c+j);var k=new XMLHttpRequest;k.open("GET",j+"/"+b.name,!0),k.responseType="arraybuffer",k.onload=function(){var c=k.response;if(i&&console.log("FatFractal.m_loadReference: arrayBuffer.byteLength "+c.byteLength),c){var e=new Uint8Array(c);d[b.name]=e,g[b.url]=e}f()},k.send(null)}else console.error&&(console.error("FatFractal.m_loadReference: browser does not support XMLHttpRequest version 2, cannot load blob as data."),f());else i&&console.log("FatFractal.m_loadReference: autoLoadBlobs is false so NOT loading "+u(b)),f();else console.error&&(console.error("FatFractal.m_loadReference: for "+b.url+" cannot determine the type of reference"),f());else console.error&&console.error("FatFractal.m_loadReference: for "+b.url+" called but the object is already in cache"),d[b.name]=h,f()},E=1e6,F=function(b){b.ffRefs&&delete b.ffRefs;var c={},d=!1,e=!1,f=null;b.ffUrl||(b.ffUrl=""+E++),h[b.ffUrl]&&delete h[b.ffUrl];for(var g in b){var j=b[g];i&&console.log("m_transformReferencesForPersistence: Checking if "+g+" ("+typeof j+") is a reference"),null!=j&&"object"==typeof j&&(i&&console.log("m_transformReferencesForPersistence: Found non-null : "+u(j)),null!=j.ffUrl&&""!=j.ffUrl?(i&&console.log("m_transformReferencesForPersistence: Found object field ["+g+"] : "+j.ffUrl+" - treating as reference"),c[g]=j.ffUrl,d=!0):j.byteLength&&(i&&console.log("m_transformReferencesForPersistence: Found BLOB for field : "+g),f=h[b.ffUrl],f||(f={},h[b.ffUrl]=f),f[g]=j,e=!0))}var k={};for(var l in b)k[l]=b[l];if(d){k.ffRefs=[];for(var m in c)delete k[m],k.ffRefs.push({name:m,type:"FFO",url:c[m]})}if(e&&f)for(var n in f)delete k[n];return a._toJSON(k)},H=this;return this}

var ff = new FatFractal();

// ff.setDebug(true);
ff.setSimulateCookies(true);
if (document.domain.indexOf('local.readrboard') != -1 ) {
  ff.setBaseUrl("http://readrboard.fatfractal.com/eventsdev");
} else {
  ff.setBaseUrl("http://readrboard.fatfractal.com/events");
}

window.RDRAuth = {
    isOffline: (document.domain == "local.readrboard.com"),
	rdr_user: {},
    popups: {},
    //todo: make this stuff better
    openGenericLoginWindow: function(options){
        var windowProps = getWindowProps(options);
        RDRAuth.checkRBLoginWindow();
        RDRAuth.popups.loginWindow = window.open(
            RDR_baseUrl+'/login/',
            'readr_login',
            windowProps
        );
        RDRAuth.popups.loginWindow.focus();
        return false;
    },
    openFBLoginWindowFromPopup: function(options){
        RDRAuth.closeWindowOnSuccess = true;
        RDRAuth.doFBLogin();
        return false;
    },
    openRbLoginWindow: function(options){   
        var windowProps = getWindowProps(options);
        RDRAuth.checkRBLoginWindow();
        
        RDRAuth.popups.loginWindow = window.open(
            RDR_baseUrl+'/rb_login/',
            'readr_login',
            windowProps
        );
        RDRAuth.popups.loginWindow.focus();
        return false;
    },
    openRbCreateNewAccountWindow: function(options, replaceCurrentWindow){
        var windowProps = getWindowProps(options);
        RDRAuth.checkRBLoginWindow();
        RDRAuth.popups.loginWindow = window.open(
            RDR_baseUrl+'/user_create/',
            'readr_create_user',
            windowProps
        );
        RDRAuth.popups.loginWindow.focus();
        if(replaceCurrentWindow){
            window.close();
        }
        return false;
    },
    openRbForgotPasswordWindow: function(options){
        var windowProps = getWindowProps(options);
        RDRAuth.checkRBLoginWindow();
        RDRAuth.popups.loginWindow = window.open(
            RDR_baseUrl+'/request_password/',
            'readr_forgot_pw',
            windowProps
        );
        RDRAuth.popups.loginWindow.focus();
        return false;
    },
    openRbAvatarUploadWindow: function(options){
        var windowProps = getWindowProps(options);
        RDRAuth.popups.loginWindow = window.open(
            RDR_baseUrl+'/user_modify/',
            'readr_avatar_upload',
            windowProps
        );
        RDRAuth.checkRBLoginWindow();
        RDRAuth.popups.loginWindow.focus();
        return false;
    },
	events: {
		track: function( data ) {
	        // RDRAuth.events.track:
	        // mirrors the event tracker from the widget
	        var standardData = "";

	        if ( RDRAuth.rdr_user && RDRAuth.rdr_user.user_id ) standardData += "||uid::"+RDRAuth.rdr_user.user_id;
	        if ( (qs_args && (qs_args.group_id) ) ) standardData += "||gid::"+(qs_args.group_id);
	        
	        var eventSrc = data+standardData,
	            $event = $('<img src="'+RDR_baseUrl+'/static/widget/images/event.png?'+eventSrc+'" />'); // NOT using STATIC_URL b/c we need the request in our server logs, and not on S3's logs

	        $('#rdr_event_pixels').append($event);

            if(RDRAuth.isOffline){
                //uncomment for debugging
            }
    	},
        trackEventToCloud: function(params){
            // RDRAuth.events.trackEventToCloud
            
            // if (typeof ff_loggedInUser != 'undefined' && typeof ff_loggedInUser.guid != 'undefined') {
            ff.postObjToExtension(params, "saveEvent", function(response) {});
              

            //   // ff.createObjAtUri(params, 'EventsDev',
              // ff.createObjAtUri(params, 'Events',
              //   function (data, statusMessage) {
              //       // successfully created object
              //       var createdMyStuff = data;
              //       console.log('createdMyStuff');
              //       console.log(createdMyStuff);
              //   },
              //   function (statusCode, statusMessage) {
              //       // error occurred
              //   });

            // }

            // Old.  When Using Parse.
            //Record events to 3rd party event tracking.  These parameters match Google's event tracking API.
            //see https://developers.google.com/analytics/devguides/collection/gajs/eventTrackerGuide#SettingUpEventTracking
            var category = params.category,
                action = params.action,
                opt_label = params.opt_label || null,
                opt_value = params.opt_value  || null,
                opt_noninteraction = params.opt_noninteraction  || null;
                
            // //these are extra params that we are adding only for parse, not google analytics.
            // //google analytics duplicates some of these as json in opt_value
            var shareNetwork = params.shareNetwork || null,
                container_hash = params.container_hash || null,
                container_kind = params.container_kind || null,
                page_id = params.page_id || null,
                tag_body = params.tag_body || null,
                user_id = params.user_id || null,
                group_id = params.group_id || null;

                
            if( typeof Parse !== "undefined" ){
                //uncomment for debugging
                // console.log('trackEventToCloud: '+'category: '+category+', '+'action: '+action+', '+'opt_label: '+opt_label+', '+'opt_value: '+opt_value+', '+'opt_noninteraction: '+opt_noninteraction);
                var parseTrackingRepo = RDRAuth.isOffline ? "EventTracking_Dev" : "EventTracking";
                var ParseTracker = Parse.Object.extend(parseTrackingRepo);
                var parseTracker = new ParseTracker();
                parseTracker.save({
                    category: category,
                    action: action,
                    shareNetwork: shareNetwork,
                    container_hash: container_hash,
                    container_kind: container_kind,
                    page_id: parseInt(page_id),
                    tag_body: tag_body,
                    user_id: user_id,
                    group_id: group_id
                }, {
                  success: function(object) {
                  }
                });
            }
            
            //don't log google tracking events while offline
            // killing for now.  we can't make much use of this.
            // if( typeof _gaq !== "undefined" && !RDRAuth.isOffline ){
                // _gaq.push(['_trackEvent', category, action, opt_label, opt_value, opt_noninteraction]);
            // }
        },
        helpers: {
            trackFBLoginAttempt: function(){
                // RDRAuth.events.helpers.trackFBLoginAttempt

                var eventStr = 'FBLogin attempted';
                RDRAuth.events.track(eventStr);

                RDRAuth.events.trackEventToCloud({
                    // category: 'login',
                    // action: 'attempted',
                    // opt_label: 'auth: fb'
                    event_type: 'login attempt facebook',
                    event_value: 'start'
                });
            },
            trackFBLoginFail: function(){
                // RDRAuth.events.helpers.trackFBLoginFail
                var eventStr = 'FBLogin failed or was canceled';
                RDRAuth.events.track(eventStr);

                RDRAuth.events.trackEventToCloud({
                    // category: 'login',
                    // action: 'failed_or_canceled',
                    // opt_label: 'auth: fb'
                    event_type: 'login attempt facebook',
                    event_value: 'fail'
                });
            },
            trackRBLoginAttempt: function(){
                // RDRAuth.events.helpers.trackFBLoginAttempt

                var eventStr = 'RBLogin attempted';
                RDRAuth.events.track(eventStr);

                RDRAuth.events.trackEventToCloud({
                    // category: 'login',
                    // action: 'attempted',
                    // opt_label: 'auth: rb'
                    event_type: 'login attempt readrboard',
                    event_value: 'start'
                });
            },
            trackRBLoginFail: function(){
                // RDRAuth.events.helpers.trackFBLoginFail

                //I didn't find a clear way to track this yet.  Not being called...
                return;

                var eventStr = 'RBLogin failed or was canceled';
                RDRAuth.events.track(eventStr);

                RDRAuth.events.trackEventToCloud({
                    // category: 'login',
                    // action: 'failed_or_canceled',
                    // opt_label: 'auth: rb'
                    event_type: 'login attempt readrboard',
                    event_value: 'fail'
                });
            }
        }
	},
	postMessage: function(params) {
		if ( typeof $.postMessage == "function" ) {
			$.postMessage(
				params.message,
				qs_args.parentUrl,
				parent
			);
		}
	},
	notifyParent: function(response, status) {
        response.status = status;
		// send this info up to the widget!
		RDRAuth.postMessage({
			message: JSON.stringify( response )
		});
	},
	getUser: function() {
		RDRAuth.readUserCookie();
		if ( !RDRAuth.rdr_user.readr_token ) {
			// user is null.  get a tempUser.
			RDRAuth.createTempUser();
		} else if ( RDRAuth.rdr_user.readr_token ) {  // temp or non-temp.  doesn't matter.
			var sendData = {
				data : {
					first_name : RDRAuth.rdr_user.first_name,
					full_name : RDRAuth.rdr_user.full_name,
					img_url : RDRAuth.rdr_user.img_url,
					user_id : RDRAuth.rdr_user.user_id,
					readr_token : RDRAuth.rdr_user.readr_token,
					user_boards : RDRAuth.rdr_user.user_boards
				}
			};
			RDRAuth.notifyParent(sendData, "returning_user");
		}
	},
	getReadrToken: function(fb_response, callback ) {
		// if ( $.cookie('user_type') == "facebook" ) {
			if ( fb_response ) {
	            var fb_session = (fb_response.authResponse) ? fb_response.authResponse:fb_response
				var sendData = {
					fb: fb_session,
					group_id: (qs_args.group_id) ? qs_args.group_id:1, // TODO aaaaaaaaaaaaaaagh remove GROUP ID and replace with NONCE
					user_id: RDRAuth.rdr_user.user_id, // might be temp, might be the ID of a valid FB-created user
					readr_token: RDRAuth.rdr_user.readr_token
				};

				$.ajax({
					url: "/api/fb/",
					type: "get",
					contentType: "application/json",
					dataType: "jsonp",
					data: {
						json: JSON.stringify( sendData )
					},
					success: function(response){
						if ( response.status == "fail" ) {
							RDRAuth.createTempUser();
						} else {
							RDRAuth.setUser(response);
							RDRAuth.returnUser();
							RDRAuth.notifyParent({}, "close login panel");
							if (callback) callback();
						}
					},
					error: function(response) {
						RDRAuth.createTempUser();
					}
				});
			} else {
				RDRAuth.doFBLogin();
			}
		// }
	},
	// simply tell the widget what we currently know about the user
	// optionally create a temp user
	createTempUser : function() {
		// if not calling from the iframe, don't create a temp user right now.
		if (parent.location == window.location) return;

		if ( (!RDRAuth.rdr_user.user_id && !RDRAuth.rdr_user.readr_token) ||  // no user data
			 ( RDRAuth.rdr_user.user_id && RDRAuth.rdr_user.readr_token && !RDRAuth.rdr_user.temp_user) ) { // we have user data but believe it is wrong
			var sendData = {
				group_id : qs_args.group_id
			};
			$.ajax({
				url: "/api/tempuser/",
				type: "get",
				contentType: "application/json",
				dataType: "jsonp",
				data: {
					json: JSON.stringify( sendData )
				},
				success: function(response){
					// store the data here and in a cookie
					RDRAuth.setUser(response);
					var sendData = {
						data : {
							first_name : RDRAuth.rdr_user.first_name,
							full_name : RDRAuth.rdr_user.full_name,
							img_url : RDRAuth.rdr_user.img_url,
							user_id : RDRAuth.rdr_user.user_id,
							readr_token : RDRAuth.rdr_user.readr_token,
							user_boards : RDRAuth.rdr_user.user_boards
						}
					};
					RDRAuth.notifyParent(sendData, "got_temp_user");
				}
			});
		} else {
			var sendData = {
				data : {
					first_name : RDRAuth.rdr_user.first_name,
					full_name : RDRAuth.rdr_user.full_name,
					img_url : RDRAuth.rdr_user.img_url,
					user_id : RDRAuth.rdr_user.user_id,
					readr_token : RDRAuth.rdr_user.readr_token,
					user_boards : RDRAuth.rdr_user.user_boards
				}
			};
			RDRAuth.notifyParent(sendData, "got_temp_user");
		}
	},
	reauthUser : function(args) {
		if ( $.cookie('user_type') && $.cookie('user_type') == "facebook" || ( !$.cookie('user_type') ) ) {
			RDRAuth.readUserCookie();
			if ( !FB.getAuthResponse() ) {
				FB.getLoginStatus(function(response) {
			  		if (response && response.status == "connected") {
						RDRAuth.killUser( function(response) {
							RDRAuth.getReadrToken(response); // function exists in readr_user.js
						}, response);
			  		} else {
			  			RDRAuth.notifyParent({}, "fb_user_needs_to_login");
			  		}
			  	});
			} else {
				RDRAuth.killUser( function(response) {
					RDRAuth.getReadrToken(response); // function exists in readr_user.js
				});
			}
		} else {
			// readrboard user.  we don't have a reauth for RB users yet.  but widget should throw the login panel.
		}
	},
    quickFixAjaxLogout: function(){
        // RDRAuth.quickFixAjaxLogout:
        //this will at least give more of an appearance of an ajax log out when the login token expires.
        //it assumes the user will still do a login that will trigger a page refresh to fix it for real.
        $('#group_settings_menu').hide();
        $('#logged-in').hide();
        $('#logged-out').css({
            display: "block",
            visibility: 'visible'
        });
    },
	checkFBStatus: function(args) {
		FB.getLoginStatus( function(response) {
			if (response.status && response.status == "connected" ) {

                if( RDRAuth.checkIfWordpressRefresh() ){
                    return;
                }
                if( RDRAuth.closeWindowOnSuccess ){
                    window.close();
                }

				if (top == self) {
					// now write the html for the user
					if ( $.cookie('user_id') || ( RDRAuth.rdr_user && RDRAuth.rdr_user.user_id ) ) {
						var user_id = ($.cookie('user_id')) ? $.cookie('user_id'):RDRAuth.rdr_user.user_id;
						var img_url = RDRAuth.rdr_user.img_url;

						$('#logged-in').show().css('visibility','visible');
						$('#logged-out').hide().css('visibility','hidden');
						FB.api('/me', function(response) {
							
                            //update the login menu html
                            if( !$('#fb-login-button a.logging-in').length ){
                                return;
                            }
                            // reload the window only if they had just taken the action of clicking the login button.  janky-ish.
							if ( $('#fb-login-button a').hasClass('logging-in') ) {
								window.location.reload();
                                return;
							}

							// shouldn't need this.  the window reload above removes the need for it.
		      				var $user = $('<a/>'),
							$avatar = $('<img/>'),
							$name = $('<strong/>');

							$user.attr('href', '/user/'+user_id );
							$avatar.attr('src', img_url + '?type=square');
							$name.text( response.name );

							$user.append( $avatar, $name );

							var user_id = $.cookie('user_id'),
								$user_menu = $('<div id="log-out-link" />');

							$user_menu.append('<a href="/user/'+user_id+'">My Activity</a>' +
					            '<a href="/follows/'+user_id+'">Activity I Follow</a>' +
					            '<a href="javascript:void(0);" onclick="RDRAuth.logout();">Log Out</a>' +
					            '<h5>Settings</h5>' +
					            '<label for="private_profile">' +
					              '(Reload the page to edit your setttings.)' +
					            '</label>');
							$('#logged-in').html( $user ).append($user_menu);
						
		      			});
					} else {
						RDRAuth.getReadrToken( response.authResponse, function() { });
					}
				} else {
					// widget
					$('#logged-in').show().css('visibility','visible');
					$('#logged-out').hide().css('visibility','hidden');
					RDRAuth.returnUser();
				}
			} else {
				if (top == self) {
					$('#logged-in').hide().css('visibility','hidden');
					$('#logged-out').show().css('visibility','visible');
				}	
			}
		});
	},
    FBLoginCallback: function(response) {
        if (response.authResponse) {
            RDRAuth.getReadrToken( FB.getAuthResponse(), function() {
                RDRAuth.checkFBStatus();
            });
        }else{
            RDRAuth.events.helpers.trackFBLoginFail();
        }
    },
    checkIfWordpressRefresh : function() {
        //temp hack to check if this is a wordpress iframe
        //todo: do this better
        var isWordpress = (function(){
            var searchStr = window.location.search;
            return searchStr.search(/hostplatform=wordpress/i) > 0;
        })();

        if(isWordpress){
            var wordpressEditUrl = '/wordpress_edit/';
            var query = window.location.search || "?";
            query += "&refresh=true";
            var wordpressRefreshUrl = wordpressEditUrl + query;

            window.location = wordpressRefreshUrl;
            //the page will refresh anyway, so this isn't needed, but it makes it more clear I think.
            return true;
        }
        return false;
    },

	checkRBLoginWindow : function() {
        if (!RDRAuth.checkingRBLoginWindow) {
			RDRAuth.checkingRBLoginWindow = setInterval( function(popup) {
				if ( RDRAuth.popups.loginWindow && RDRAuth.popups.loginWindow.closed ) {
					RDRAuth.readUserCookie();
					RDRAuth.returnUser();
                    RDRAuth.notifyParent({}, "close login panel");
                    RDRAuth.popups.loginWindow.close();
                    clearInterval( RDRAuth.checkingRBLoginWindow );
                    
                    // we should delete this here yeah?  I don't think clearInterval will make the if statement above false..  doesn't seem to be breaking shit now though.
                    // delete RDRAuth.checkingRBLoginWindow;

                    if( RDRAuth.checkIfWordpressRefresh() ){
                        return;
                    }
                    if (top == self) {
						window.location.reload();
					}
				}
			}, 250 );
		}
	},
	setUser : function(response) {
		RDRAuth.rdr_user = {};
		response.data = response.data || {};
        // if no first_name attribute is in the response, this is a temporary user.
		if ( response.data.first_name || response.data.full_name ) RDRAuth.rdr_user.temp_user = false;
		else RDRAuth.rdr_user.temp_user = true;

        RDRAuth.rdr_user.readr_token = response.data.readr_token;
        RDRAuth.rdr_user.user_id = response.data.user_id;
        RDRAuth.rdr_user.full_name = response.data.full_name;
        RDRAuth.rdr_user.first_name = response.data.full_name;
        RDRAuth.rdr_user.img_url = response.data.img_url;
        RDRAuth.rdr_user.user_type = response.data.user_type;
        RDRAuth.rdr_user.user_boards = JSON.stringify(response.data.user_boards);

		var session_expiry = new Date(); 
		session_expiry.setMinutes( session_expiry.getMinutes() + 60 );
        //Use 1 hour for the rdr_session.  30 days for everything else.
        var expTime = 90;

        $.cookie('temp_user', RDRAuth.rdr_user.temp_user, { expires: expTime, path: '/' });
        $.cookie('readr_token', RDRAuth.rdr_user.readr_token, { expires: expTime, path: '/' });
        $.cookie('user_id', RDRAuth.rdr_user.user_id, { expires: expTime, path: '/' });
        $.cookie('user_type', RDRAuth.rdr_user.user_type, { expires: expTime, path: '/' });

        //try out just using 90 days for everything - we're checking fb login every time anyway.
        // $.cookie('rdr_session', 'true', { expires: expTime, path:'/' });
        // $.cookie('rdr_session', 'true', { expires:session_expiry, path:'/' });
    },
    readUserCookie: function() {
        //set everything every time - let it be null if null.  Otherwise, some old values don't get overwritten.
        RDRAuth.rdr_user.temp_user = $.cookie('temp_user');
        RDRAuth.rdr_user.readr_token = $.cookie('readr_token');
        RDRAuth.rdr_user.user_id = $.cookie('user_id');
		RDRAuth.rdr_user.user_type = $.cookie('user_type');
        
	},
	returnUser: function() {
		RDRAuth.readUserCookie();
		if (top == self) {
			// we're on the site
			if ( $.cookie('user_type') && $.cookie('user_type') == "facebook" ) {
				RDRAuth.checkFBStatus();
			} else {
				if ( $.cookie('user_id') ) {
					$('#logged-in').show().css('visibility','visible');
					$('#logged-out').hide().css('visibility','hidden');

	  				var $user = $('<a/>'),
					// $avatar = $('<img/>'),
					$name = $('<strong/>');

					$user.attr('href', '/user/' + $.cookie('user_id') );
					var username = "friend";
					$name.text( username );

					$user.append( $name );
				}
			}
		} else {
			var sendData = {
				// arguments are nested under data for consistency with passing values up to the parent
				data : {
					first_name : RDRAuth.rdr_user.first_name,
					full_name : RDRAuth.rdr_user.full_name,
					img_url : RDRAuth.rdr_user.img_url,
					user_id : RDRAuth.rdr_user.user_id,
					readr_token : RDRAuth.rdr_user.readr_token,
					user_type : RDRAuth.rdr_user.user_type
				}
			};
			RDRAuth.notifyParent(sendData, "returning_user");
		}
	},
	killUser : function(callback, callback_args) {
		// if ( RDRAuth.rdr_user && RDRAuth.rdr_user.user_id && RDRAuth.rdr_user.readr_token && RDRAuth.rdr_user.first_name ) {
		if ( RDRAuth.rdr_user && RDRAuth.rdr_user.temp_user == "false" ) {
			// deauth a full user
			var sendData = {
				user_id : RDRAuth.rdr_user.user_id,
				readr_token : RDRAuth.rdr_user.readr_token
			};

			$.ajax({
				url: "/api/deauthorize/",
				type: "get",
				contentType: "application/json",
				context: {callback_args:callback_args},
				dataType: "jsonp",
				data: {
					json: JSON.stringify( sendData )
				},
				success: function(response){
          
                    RDRAuth.clearSessionCookies();

					RDRAuth.rdr_user = {};
					if (callback && this.callback_args) {
						callback(this.callback_args);
					} else if (callback) {
						callback();
					}
				}
			});
		} else {
			// just a temp user
            RDRAuth.clearSessionCookies();
          
    		if (callback && callback_args) {
    			callback(callback_args);
    		} else if (callback) {
    			callback();
    		}
		}
	},

    clearSessionCookies: function(){
        // RDRAuth.clearSessionCookies
        $.cookie('temp_user', null, { path: '/' });
        $.cookie('readr_token', null, { path: '/' });
        $.cookie('user_id', null, { path: '/' });
        $.cookie('user_type', null, { path: '/' });
        $.cookie('rdr_session', null, { path: '/' });
        $.cookie('rdr_user', null, { path: '/' });
    },

    doFBLogin: function(requesting_action) {
		// RDRAuth.doFBLogin

        RDRAuth.events.helpers.trackFBLoginAttempt();

		FB.login(function(response) {
            RDRAuth.FBLoginCallback(response);
		}, {scope: 'email'});
	},
	doRBLogin: function(requesting_action) {
        // RDRAuth.doRBLogin
        RDRAuth.events.helpers.trackRBLoginAttempt();
        RDRAuth.openRbLoginWindow();
    },
    doRBlogout: function() {
         RDRAuth.killUser( function() {
                    window.location.reload(); 
                }); 
    },	
	logout: function() {
		if ( $.cookie('user_type') && $.cookie('user_type') == "facebook" ) {
			FB.getLoginStatus(function(response) {
				if (response) {
					FB.logout(function(response) {
						RDRAuth.killUser( function() {
							window.location.reload(); 
						});		
					});	
				} else {
					RDRAuth.killUser( function() {
						window.location.reload(); 
					});	
				}
			});
		} else {
			RDRAuth.killUser( function() {
				window.location.reload(); 
			});	
		}
	},
	init : function() {
    RDRAuth.notifyParent({}, "xdm loaded");
		if ( $.cookie('user_type') && $.cookie('user_type') == "facebook") {
            FB.getLoginStatus( function(response) {
                if ( response.status && response.status == "connected" ) {
                    RDRAuth.getReadrToken( response.authResponse, function() {});
			    }else{        
                    RDRAuth.killUser( function() {
                    });
                }
			});
		} else {
		  RDRAuth.returnUser();
		}
	},
	decodeDjangoCookie : function(value) {
		if (value) return value.replace(/"/g,'').replace(/\\054/g,",").replace(/\\073/g,";");
	}
}

$(document).ready(function(){

    //wait for fb init initing RDRAuth
    window.fb_loader.done(function(){
        RDRAuth.init();
    });
    
    //wait for fb init before receiving messages
    window.fb_loader.done(function(){

        if ( typeof $.receiveMessage == "function") {
            $.receiveMessage(
                function(e){

                    var keys = {
                        registerEvent: "register-event::"
                    };
                    var jsonData;
                    var data;

                    if( e.data == "getUser" ) {
                        RDRAuth.getUser();
                    } else if ( e.data == "reloadXDMframe" ) {
                        window.location.reload();
                    } else if ( e.data == "reauthUser" ) {
                        RDRAuth.reauthUser();
                    } else if ( e.data == "returnUser" ) {
                        RDRAuth.returnUser();
                    } else if ( e.data == "killUser" ) {
                        RDRAuth.killUser();
                    } else if ( e.data == "TESTIT" ) {
                        RDRAuth.testMessage();
                    } else if ( e.data.indexOf("page_hash") != -1 ) {
                        //todo: this seems touchy to set this cookie forever like this.
                        $.cookie('page_hash', e.data.split('|')[1], { expires: 365, path: '/' } );
                    } else if ( e.data.indexOf(keys.registerEvent) != -1 ) {
                        jsonData = e.data.split(keys.registerEvent)[1];
                        data = $.parseJSON(jsonData);
                        RDRAuth.events.trackEventToCloud(data);
                    }
                },
                qs_args.parentHost
            );
        }
    });
});