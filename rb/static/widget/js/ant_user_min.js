var qs=(window.location.search+window.location.hash).substr(1).split("&");var qs_args=[];for(var i in qs){var this_arg=qs[i].split("=");qs_args[this_arg[0]]=this_arg[1]}if(typeof qs_args.group_id=="undefined"){qs_args.group_id=""}function getWindowProps(options){options=options||{};var w=options.width||400;var h=options.height||350;var l=window.screen.width/2-w/2;var t=window.screen.height/2-h/2;return"menubar=1,resizable=1,scrollbars=yes,width="+w+",height="+h+",top="+t+",left="+l}var trackingUrl=document.domain!="local.antenna.is"?"http://events.readrboard.com/insert":"http://localnode.com:3000/insert";window.ANTAuth={isOffline:document.domain=="local.antenna.is",ant_user:{},popups:{},openGenericLoginWindow:function(options){var windowProps=getWindowProps(options);ANTAuth.checkAntLoginWindow();ANTAuth.popups.loginWindow=window.open(ANT_baseUrl+"/login/","ant_login",windowProps);ANTAuth.popups.loginWindow.focus();return false},openFBLoginWindowFromPopup:function(options){ANTAuth.closeWindowOnSuccess=true;ANTAuth.doFBLogin();return false},openAntLoginWindow:function(options){var windowProps=getWindowProps(options);ANTAuth.checkAntLoginWindow();ANTAuth.popups.loginWindow=window.open(ANT_baseUrl+"/ant_login/","ant_login",windowProps);ANTAuth.popups.loginWindow.focus();return false},openAntCreateNewAccountWindow:function(options,replaceCurrentWindow){var windowProps=getWindowProps(options);ANTAuth.checkAntLoginWindow();ANTAuth.popups.loginWindow=window.open(ANT_baseUrl+"/user_create/","ant_create_user",windowProps);ANTAuth.popups.loginWindow.focus();if(replaceCurrentWindow){window.close()}return false},openAntForgotPasswordWindow:function(options){var windowProps=getWindowProps(options);ANTAuth.checkAntLoginWindow();ANTAuth.popups.loginWindow=window.open(ANT_baseUrl+"/request_password/","ant_forgot_pw",windowProps);ANTAuth.popups.loginWindow.focus();return false},openAntAvatarUploadWindow:function(options){var windowProps=getWindowProps(options);ANTAuth.popups.loginWindow=window.open(ANT_baseUrl+"/user_modify/","ant_avatar_upload",windowProps);ANTAuth.checkAntLoginWindow();ANTAuth.popups.loginWindow.focus();return false},openChangePasswordWindow:function(options){var windowProps=getWindowProps(options);ANTAuth.popups.loginWindow=window.open(ANT_baseUrl+"/change_password/","ant_change_password",windowProps);ANTAuth.checkAntLoginWindow();ANTAuth.popups.loginWindow.focus();return false},events:{track:function(data){var standardData="";if(ANTAuth.ant_user&&ANTAuth.ant_user.user_id)standardData+="||uid::"+ANTAuth.ant_user.user_id;if(qs_args&&qs_args.group_id)standardData+="||gid::"+qs_args.group_id;var eventSrc=data+standardData,$event=$('<img src="'+ANT_baseUrl+"/static/widget/images/event.png?"+eventSrc+'" />');$("#ant_event_pixels").append($event);if(ANTAuth.isOffline){}},trackEventToCloud:function(params){$.ajax({url:trackingUrl,type:"get",contentType:"application/json",dataType:"jsonp",data:{json:$.toJSON(params)},success:function(response){}});return;var category=params.category,action=params.action,opt_label=params.opt_label||null,opt_value=params.opt_value||null,opt_noninteraction=params.opt_noninteraction||null;var shareNetwork=params.shareNetwork||null,container_hash=params.container_hash||null,container_kind=params.container_kind||null,page_id=params.page_id||null,tag_body=params.tag_body||null,user_id=params.user_id||null,group_id=params.group_id||null;if(typeof Parse!=="undefined"){var parseTrackingRepo=ANTAuth.isOffline?"EventTracking_Dev":"EventTracking";var ParseTracker=Parse.Object.extend(parseTrackingRepo);var parseTracker=new ParseTracker;parseTracker.save({category:category,action:action,shareNetwork:shareNetwork,container_hash:container_hash,container_kind:container_kind,page_id:parseInt(page_id),tag_body:tag_body,user_id:user_id,group_id:group_id},{success:function(object){}})}},helpers:{trackFBLoginAttempt:function(){var eventStr="FBLogin attempted";ANTAuth.events.track(eventStr);ANTAuth.events.trackEventToCloud({event_type:"login attempt facebook",event_value:"start"})},trackFBLoginFail:function(){var eventStr="FBLogin failed or was canceled";ANTAuth.events.track(eventStr);ANTAuth.events.trackEventToCloud({event_type:"login attempt facebook",event_value:"fail"})},trackAntLoginAttempt:function(){var eventStr="AntLogin attempted";ANTAuth.events.track(eventStr);ANTAuth.events.trackEventToCloud({event_type:"login attempt antenna",event_value:"start"})},trackAntLoginFail:function(){return;var eventStr="AntLogin failed or was canceled";ANTAuth.events.track(eventStr);ANTAuth.events.trackEventToCloud({event_type:"login attempt antenna",event_value:"fail"})}}},postMessage:function(params){if(typeof $.postMessage=="function"){$.postMessage(params.message,qs_args.parentUrl,parent)}},notifyParent:function(response,status){response.status=status;ANTAuth.postMessage({message:JSON.stringify(response)})},getUser:function(){ANTAuth.readUserCookie();if(!ANTAuth.ant_user.ant_token){ANTAuth.createTempUser()}else if(ANTAuth.ant_user.ant_token){var sendData={data:{first_name:ANTAuth.ant_user.first_name,full_name:ANTAuth.ant_user.full_name,img_url:ANTAuth.ant_user.img_url,user_id:ANTAuth.ant_user.user_id,ant_token:ANTAuth.ant_user.ant_token,user_boards:ANTAuth.ant_user.user_boards}};ANTAuth.notifyParent(sendData,"returning_user")}},getAntToken:function(fb_response,callback){if(fb_response){var fb_session=fb_response.authResponse?fb_response.authResponse:fb_response;var sendData={fb:fb_session,group_id:qs_args.group_id?qs_args.group_id:1,user_id:ANTAuth.ant_user.user_id,ant_token:ANTAuth.ant_user.ant_token};$.ajax({url:"/api/fb/",type:"get",contentType:"application/json",dataType:"jsonp",data:{json:JSON.stringify(sendData)},success:function(response){if(response.status=="fail"){ANTAuth.createTempUser()}else{ANTAuth.setUser(response);ANTAuth.returnUser();ANTAuth.notifyParent({},"close login panel");if(callback)callback()}},error:function(response){ANTAuth.createTempUser()}})}else{ANTAuth.doFBLogin()}},createTempUser:function(){if(parent.location==window.location)return;if(!ANTAuth.ant_user.user_id&&!ANTAuth.ant_user.ant_token||ANTAuth.ant_user.user_id&&ANTAuth.ant_user.ant_token&&!ANTAuth.ant_user.temp_user){var sendData={group_id:qs_args.group_id};$.ajax({url:"/api/tempuser/",type:"get",contentType:"application/json",dataType:"jsonp",data:{json:JSON.stringify(sendData)},success:function(response){ANTAuth.setUser(response);var sendData={data:{first_name:ANTAuth.ant_user.first_name,full_name:ANTAuth.ant_user.full_name,img_url:ANTAuth.ant_user.img_url,user_id:ANTAuth.ant_user.user_id,ant_token:ANTAuth.ant_user.ant_token,user_boards:ANTAuth.ant_user.user_boards}};ANTAuth.notifyParent(sendData,"got_temp_user")}})}else{var sendData={data:{first_name:ANTAuth.ant_user.first_name,full_name:ANTAuth.ant_user.full_name,img_url:ANTAuth.ant_user.img_url,user_id:ANTAuth.ant_user.user_id,ant_token:ANTAuth.ant_user.ant_token,user_boards:ANTAuth.ant_user.user_boards}};ANTAuth.notifyParent(sendData,"got_temp_user")}},reauthUser:function(args){if($.cookie("user_type")&&$.cookie("user_type")=="facebook"||!$.cookie("user_type")){ANTAuth.readUserCookie();if(!FB.getAuthResponse()){FB.getLoginStatus(function(response){if(response&&response.status=="connected"){ANTAuth.killUser(function(response){ANTAuth.getAntToken(response)},response)}else{ANTAuth.notifyParent({},"fb_user_needs_to_login")}})}else{ANTAuth.killUser(function(response){ANTAuth.getAntToken(response)})}}else{}},quickFixAjaxLogout:function(){$("#group_settings_menu").hide();$("#logged-in").hide();$("#logged-out").css({display:"block",visibility:"visible"})},checkFBStatus:function(args){FB.getLoginStatus(function(response){if(response.status&&response.status=="connected"){if(ANTAuth.checkIfWordpressRefresh()){return}if(ANTAuth.closeWindowOnSuccess){window.close()}if(top==self){if($.cookie("user_id")||ANTAuth.ant_user&&ANTAuth.ant_user.user_id){var user_id=$.cookie("user_id")?$.cookie("user_id"):ANTAuth.ant_user.user_id;var img_url=ANTAuth.ant_user.img_url;$("#logged-in").show().css("visibility","visible");$("#logged-out").hide().css("visibility","hidden");FB.api("/me",function(response){if($("#fb-login-button a").hasClass("logging-in")){window.location.reload();return}if(!$(".userSettingsMenu").length){var $user=$("<a/>"),$avatar=$("<img/>"),$name=$("<strong/>");$user.attr("href","/user/"+user_id);$avatar.attr("src",img_url+"?type=square");$user.append($avatar);var user_id=$.cookie("user_id"),$user_menu=$('<div id="log-out-link" />');$user_menu.append('<a href="/user/'+user_id+'">My Activity</a>'+'<a href="/follows/'+user_id+'">Activity I Follow</a>'+'<a href="javascript:void(0);" onclick="ANTAuth.logout();">Log Out</a>'+"<h5>Settings</h5>"+'<label for="private_profile">'+"(Reload the page to edit your setttings.)"+"</label>");$("#logged-in").html($user).append($user_menu)}})}else{ANTAuth.getAntToken(response.authResponse,function(){})}}else{$("#logged-in").show().css("visibility","visible");$("#logged-out").hide().css("visibility","hidden");ANTAuth.returnUser()}}else{if(top==self){$("#logged-in").hide().css("visibility","hidden");$("#logged-out").show().css("visibility","visible")}}})},FBLoginCallback:function(response){if(response.authResponse){ANTAuth.getAntToken(FB.getAuthResponse(),function(){ANTAuth.checkFBStatus()})}else{ANTAuth.events.helpers.trackFBLoginFail()}},checkIfWordpressRefresh:function(){var isWordpress=function(){var searchStr=window.location.search;return searchStr.search(/hostplatform=wordpress/i)>0}();if(isWordpress){var wordpressEditUrl="/wordpress_edit/";var query=window.location.search||"?";query+="&refresh=true";var wordpressRefreshUrl=wordpressEditUrl+query;window.location=wordpressRefreshUrl;return true}return false},checkAntLoginWindow:function(){if(!ANTAuth.checkingAntLoginWindow){ANTAuth.checkingAntLoginWindow=setInterval(function(popup){if(ANTAuth.popups.loginWindow&&ANTAuth.popups.loginWindow.closed){ANTAuth.readUserCookie();ANTAuth.returnUser();ANTAuth.notifyParent({},"close login panel");ANTAuth.popups.loginWindow.close();clearInterval(ANTAuth.checkingAntLoginWindow);if(ANTAuth.checkIfWordpressRefresh()){return}if(top==self){window.location.reload()}}},250)}},setUser:function(response){ANTAuth.ant_user={};response.data=response.data||{};if(response.data.first_name||response.data.full_name)ANTAuth.ant_user.temp_user=false;else ANTAuth.ant_user.temp_user=true;ANTAuth.ant_user.ant_token=response.data.ant_token;ANTAuth.ant_user.user_id=response.data.user_id;ANTAuth.ant_user.full_name=response.data.full_name;ANTAuth.ant_user.first_name=response.data.full_name;ANTAuth.ant_user.img_url=response.data.img_url;ANTAuth.ant_user.user_type=response.data.user_type;ANTAuth.ant_user.user_boards=JSON.stringify(response.data.user_boards);var session_expiry=new Date;session_expiry.setMinutes(session_expiry.getMinutes()+60);var expTime=90;$.cookie("temp_user",ANTAuth.ant_user.temp_user,{expires:expTime,path:"/"});$.cookie("ant_token",ANTAuth.ant_user.ant_token,{expires:expTime,path:"/"});$.cookie("user_id",ANTAuth.ant_user.user_id,{expires:expTime,path:"/"});$.cookie("user_type",ANTAuth.ant_user.user_type,{expires:expTime,path:"/"})},readUserCookie:function(){ANTAuth.ant_user.temp_user=$.cookie("temp_user");ANTAuth.ant_user.ant_token=$.cookie("ant_token");if(!$.cookie("ant_token")){ANTAuth.ant_user.ant_token=$.cookie("readr_token")}ANTAuth.ant_user.user_id=$.cookie("user_id");ANTAuth.ant_user.user_type=$.cookie("user_type")},returnUser:function(){ANTAuth.readUserCookie();if(top==self){if($.cookie("user_type")&&$.cookie("user_type")=="facebook"){ANTAuth.checkFBStatus()}else{if($.cookie("user_id")){$("#logged-in").show().css("visibility","visible");$("#logged-out").hide().css("visibility","hidden");var $user=$("<a/>"),$name=$("<strong/>");$user.attr("href","/user/"+$.cookie("user_id"));var username="friend";$name.text(username);$user.append($name)}}}else{var sendData={data:{first_name:ANTAuth.ant_user.first_name,full_name:ANTAuth.ant_user.full_name,img_url:ANTAuth.ant_user.img_url,user_id:ANTAuth.ant_user.user_id,ant_token:ANTAuth.ant_user.ant_token,user_type:ANTAuth.ant_user.user_type}};ANTAuth.notifyParent(sendData,"returning_user")}},killUser:function(callback,callback_args){if(ANTAuth.ant_user&&ANTAuth.ant_user.temp_user=="false"){var sendData={user_id:ANTAuth.ant_user.user_id,ant_token:ANTAuth.ant_user.ant_token};$.ajax({url:"/api/deauthorize/",type:"get",contentType:"application/json",context:{callback_args:callback_args},dataType:"jsonp",data:{json:JSON.stringify(sendData)},success:function(response){ANTAuth.clearSessionCookies();ANTAuth.ant_user={};if(callback&&this.callback_args){callback(this.callback_args)}else if(callback){callback()}}})}else{ANTAuth.clearSessionCookies();if(callback&&callback_args){callback(callback_args)}else if(callback){callback()}}},clearSessionCookies:function(){$.cookie("temp_user",null,{path:"/"});$.cookie("ant_token",null,{path:"/"});$.cookie("user_id",null,{path:"/"});$.cookie("user_type",null,{path:"/"});$.cookie("ant_session",null,{path:"/"});$.cookie("ant_user",null,{path:"/"})},doFBLogin:function(requesting_action){ANTAuth.events.helpers.trackFBLoginAttempt();FB.login(function(response){ANTAuth.FBLoginCallback(response)},{scope:"email"})},doAntLogin:function(requesting_action){ANTAuth.events.helpers.trackAntLoginAttempt();ANTAuth.openAntLoginWindow()},doAntlogout:function(){ANTAuth.killUser(function(){window.location.reload()})},logout:function(){if($.cookie("user_type")&&$.cookie("user_type")=="facebook"){FB.getLoginStatus(function(response){if(response){FB.logout(function(response){ANTAuth.killUser(function(){window.location.reload()})})}else{ANTAuth.killUser(function(){window.location.reload()})}})}else{ANTAuth.killUser(function(){window.location.reload()})}},init:function(){ANTAuth.notifyParent({},"xdm loaded");if($.cookie("user_type")&&$.cookie("user_type")=="facebook"){FB.getLoginStatus(function(response){if(response.status&&response.status=="connected"){ANTAuth.getAntToken(response.authResponse,function(){})}else{ANTAuth.killUser(function(){})}})}else{ANTAuth.returnUser()}},decodeDjangoCookie:function(value){if(value)return value.replace(/"/g,"").replace(/\\054/g,",").replace(/\\073/g,";")}};$(document).ready(function(){window.fb_loader.done(function(){ANTAuth.init()});window.fb_loader.done(function(){if(typeof $.receiveMessage=="function"){$.receiveMessage(function(e){var keys={registerEvent:"register-event::"};var jsonData;var data;if(e.data=="getUser"){ANTAuth.getUser()}else if(e.data=="reloadXDMframe"){window.location.reload()}else if(e.data=="reauthUser"){ANTAuth.reauthUser()}else if(e.data=="returnUser"){ANTAuth.returnUser()}else if(e.data=="killUser"){ANTAuth.killUser()}else if(e.data=="TESTIT"){ANTAuth.testMessage()}else if(e.data.indexOf("page_hash")!=-1){$.cookie("page_hash",e.data.split("|")[1],{expires:365,path:"/"})}else if(e.data.indexOf(keys.registerEvent)!=-1){jsonData=e.data.split(keys.registerEvent)[1];data=$.parseJSON(jsonData);ANTAuth.events.trackEventToCloud(data)}},qs_args.parentHost)}})});