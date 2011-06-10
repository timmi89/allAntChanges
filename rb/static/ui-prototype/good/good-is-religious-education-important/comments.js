                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                
try { if(!window.JSK$EPB && navigator.appVersion.match(/[345]\.[.0-9 ]+Safari/)) {
	var d = document.createElement('div');
	d.style.height = 0;
	var tgt = 'jsk-ifrmsess-' + Math.random();
	d.innerHTML = '<iframe id="' + tgt + '" name="' + tgt + '" src="about:blank" width=0 height=0 style="border: none"></iframe>';
	var f = function() {
		document.body.appendChild(d);
		var ifrsess = d.firstChild;
		var getFrame = function(FrameName, Parent) {
			var tp = Parent ? getFrameDoc(Parent) : document;
			var fr = tp.getElementById(FrameName).contentWindow;
			return fr;
		}
		var getFrameDoc = function(FrameName, Parent) {
			var FEl = getFrame(FrameName, Parent);
			return FEl.contentDocument || FEl.document;
		}

		var iDOC = getFrameDoc(tgt);
		var frm = iDOC.createElement('form');
		frm.method = 'post';frm.action = window.location.protocol + '//js-kit.com/api/session/refresh.js';
		iDOC.body.appendChild(frm);
		ifrsess.onreadystatechange = ifrsess.onload = function() {
			if(ifrsess.readyState && ifrsess.readyState != 'loaded'
				&& ifrsess.readyState != 'complete') return;
			ifrsess.onload = ifrsess.onreadystatechange = null;
			
		};
		frm.submit();
	}
	if(document.body) f();
	else setTimeout(f, 0);
} else {}} catch(e) {};
/*
 * Copyright (c) 2006-2009 JS-Kit <support@js-kit.com>. All rights reserved.
 * You may copy and modify this script as long as the above copyright notice,
 * this condition and the following disclaimer is left intact.
 * This software is provided by the author "AS IS" and no warranties are
 * implied, including fitness for a particular purpose. In no event shall
 * the author be liable for any damages arising in any way out of the use
 * of this software, even if advised of the possibility of such damage.
 * $Id: comments.js 32210 2011-04-07 07:09:41Z jskit $
 */

if(!window.$JCA) {
  var $JCA = [];
  var $JCLT = {
	leaveComment: 'Leave a comment',
	leaveCommentAs: 'Leave a comment as:',
	guest: 'Guest',
	url: 'URL:',
	nameLabel: 'Your name:',
	nicknameLabel: 'Nickname (required):',
	nicknameRequired: 'Please enter your name to leave a comment',
	emailLabel: 'Send replies to email:',
	emailNote: '(if provided, email will not be displayed or shared)',
	ratingLabel: 'Rating:',
	commentLabel: 'Comment:',
	commentsCountLabel: '{Count} Items',
	submit: 'Submit comment',
	save: 'Save',
	cancel: 'Cancel',
	avatar: 'Avatar:',
	tooShort: 'The comment field can\'t be blank',
	tooLong: 'Message size should not exceed {maxCommentLength} characters',
	junkCtl: 'Junk control',
	byVotes: 'by',
	logout: 'logout',
	loggingOut: 'Logging out ...',
	less: 'less',
	more: 'more',
	optionsU: 'Options &#x25b2;',
	optionsD: 'Options &#x25bc;',
	isJunkVote: 'Is this an inappropriate message?',
	loading: 'Loading ...',
	submitPM: 'Leave private message',
	welcomeToComments: 'Welcome to JS-Kit Comments &mdash; we\'re very happy to see you!',
	adminNote: 'Administration Note - JS-Kit Comments widget',
	openWelcome: 'Open Administration Panel',
	closeWelcome: 'Close Administration Panel',
	contactSupport: 'Contact our support team',
	editProfile: 'Edit your public profile',
	readFAQ: 'Read our FAQ',
	customizeLook: 'Customize the look and feel',
	adminDashboard: 'Admin Dashboard',
	followTwitter: 'Follow us on Twitter',
	readOurBlog: 'Read our Blog',
	loginRequiredNotice: 'Login required, click here to begin',
	deleteImage: 'Delete image',
	editImage: 'Edit description',
	imgUploadErrorBigImage: 'The image file you are trying to upload is too big.',
	imgUploadErrorWrongFormat: 'The image file you are trying to upload has wrong format.',
	imgUploadErrorInternal: 'An internal error occurred during image upload. Please try again later.',
	uploadImage: 'Upload new image <span class="js-kit-images-imgSizeSpec">(up to 10 megabytes)</span>:',
	addImgText: 'Add images',
	addPicText: 'Add pictures',
	picTitle: 'PICTURES',
	commentMoveNotice: "Page reload will cause your comment to move according to your sorting and ordering preferences.",
	shareVia_yahoo: "Share via ",
	shareVia_twitter: "Tweet this",
	shareVia_friendfeed: "Share via FriendFeed",
	shareVia_facebook: "Share via Facebook",
	shareVia_gfc: "Share via Google Friend Connect",
	getPermalinkURL: 'URL of this comment',
	getWidgetLikeThis: 'Get a widget like this',
	options: 'More',
	showUserProfile: 'Show user\'s profile',
	markAsOffensive: 'Mark comment as offensive',
	post: 'Post',
	retry: 'Retry',
	messagePostFailed: 'Could not post your comment to the server. Please try again.',
	posting: 'Posting',
	messagePostingInProgress: 'Posting in progress. Please wait',
	attempt: 'attempt',
	userIsAdmin: 'This user is an administrator',
	defaultThreadTitle: 'Echo',
	defaultCommentText: 'What\'s on your mind...',
	expandXMoreReplies: '{count} more (expand)',
	sharedThisOn: 'I shared this on {service_name}...',
	statePaused: 'Paused',
	stateLive: 'Live',
	itemsNew: 'new',
	leftToday: 'Today',
	leftYesterday: 'Yesterday',
	leftDaysAgo: ' days ago',
	vote: 'vote',
	votes: 'votes',
	youSearchedFor: 'You searched for',
	clearSearch: 'Clear Search',
	page: 'Page: ',
	pagePrevious: 'Previous page',
	pageNext: 'Next page',
	btnPagePrevious: '&lt; Prev',
	btnPageNext: 'Next &gt;',
	administratorOptions: 'Administrator Options',
	viewOptions: 'View Options',
	moderation: 'Moderation',
	urlIsOptional: 'URL is optional',
	emailIsOptional: 'email is optional',
	controls: 'Controls',
	sortBy: 'Sort by',
	order: 'Order',
	threading: 'Threading',
	search: 'Search',
	btnDelete: 'delete',
	btnEdit: 'edit',
	btnFlag: 'flag',
	btnLike: 'like',
	btnModerate: 'moderate',
	btnReply: 'reply',
	no: 'no',
	More: 'More',
	Score: 'Score',
	Welcome: 'Welcome',
	yes: 'yes',
	getInvolved: 'Get involved',
	getStarted: 'Get started',
	likeThisComment: 'Like this comment?',
	communityAssignedCarmaScore: 'Community assigned karma score',
	userHasTrustedStatus: 'This user has a trusted status',
	messageIsNotBlocked: 'The message is not blocked',
	approveMessagesFromUser: 'Approve this and future messages from this user',
	messageIsNotSpam: 'This message is not spam or junk',
	approveMessage: 'Approve this message',
	approveFutureMessagesFromUser: 'Approve future messages from this user',
	acceptMessage: 'Accept this message as good',
	unblockCommenter: 'Unblock this commenter',
	liftBanFromUser: 'Lift ban from this user/IP',
	unbanUser: 'Unban User',
	approveUser: 'Approve user',
	approveMessage: 'Approve message',
	deleteUnwantedComment: 'Delete unwanted comment',
	getRidOfComment: 'Get rid of comment without prejudice',
	deleteMessage: 'Delete',
	flagAsSpam: 'Flag as Spam or Junk',
	trainAksimet: 'Train <a href:"http://akismet.com">Akismet</a> to flag similar comments in the future',
	spamJunk: 'Spam/Junk',
	blockCommenter: 'Block this commenter',
	hideCommentsFromUser: 'Make comments from this user invisible to other users',
	blockUser: 'Block User',
	blockCommenterIP: 'Block commenter\'s IP',
	hideCommentsFromIP: 'Make comments from this IP invisible to other users',
	blockIP: 'Block IP',
	markoffMessage: 'Thank you',
	askingFacebook: 'Asking Facebook...',
	askingGoogle: 'Asking Google...',
	loggingIn: 'Logging in ',
	loginWithGFC: 'Log in with Google Friend Connect',
	justPostedCommentOn: ' just posted the following comment on',
	poweredBy: 'Powered by',
	clickToEditEmpty: 'Empty value (click to edit)',
	savingScriptMessage: 'Enclose the script in a <BODY></BODY> tag!',

	//Like
	like_you: 'You',
	like_like: 'Like',
	like_guest: 'Guest',
	like_unlike: 'Unlike',
	like_guests: '{guestsCount} Guests',
	like_likedBy: 'Liked by',
	like_andXMore: 'And {count} more',
	like_like_title: 'Click here if you like this item',
	like_unlike_title: 'Made a mistake?',
	like_collapseList: 'Collapse list',
	like_like_progress: 'Liking...',
	like_unlike_progress: 'Unliking...',

	// Menu labels
	menuAdmin: 'Admin',
	menuLogin: 'Log In',
	menuLogout: 'Log Out',
	menuFollow: 'Follow',
	menuEditProfile: 'Edit My Profile',
	menuModeration: 'Moderation',
	menuSettings: 'General Settings',
	menuAdminNotices: 'Admin Notices',
	menuGetThis: 'Get this for your site',
	menuJSKBlog: 'Echo Blog',
	menuJSKTwitter: 'Echo on Twitter',
	menuHelp: 'Help',

	menuUnbindIdentity: 'Unbind this service',

	from: 'Login',
	to: 'Share',
	Iam: 'Login with:',
	shareWith: 'Share with:',
	myWebsites: 'My Websites:',
	thisPage: 'This Page',
	addAnotherSite: 'Add another site',
	myURL: 'My Site (click to edit)',
	urlIsEmpty: 'URL cannot be empty!',
	urlAlreadyExists: 'The same URL already exists!',
	follow: "Follow",
	addImagesSectionNotice: '<strong>Add images:</strong> this site allows you to attach pictures to your comment.',
	miniProf_viewDetails: 'View details',
	miniProf_ILeft: 'I have left ',
	miniProf_userLeft: 'User left ',
	miniProf_commentsStats: 'comment(s)',
	miniProf_visitMeOn: 'Visit me on...',
	miniProf_openFullProfile: 'View profile',
	miniProf_ext_profile_gfc: 'View Google Friend Connect profile',
	miniProf_ext_profile_facebook: 'View Facebook profile',
	miniProf_ext_profile_yahoo: 'View Yahoo! profile',
	miniProf_ext_profile_twitter: 'View Twitter profile',
	miniProf_ext_profile_friendfeed: 'View FriendFeed profile',
	miniProf_ext_profile_blogspot: 'Visit Blogger site',
	miniProf_ext_profile_jskit: 'Visit JS-Kit profile',
	miniProf_ext_profile_epb: 'View external profile',
	follow_emailNotification: 'Notify me by Email:',
	follow_emailNotificationDesc: 'Send Email notification each time a user leaves a new comment',
	follow_rssThread: 'Subscribe to this Stream via RSS:',
	follow_popupHeader: 'Follow',
	follow_editMyNotifications: 'Edit my notifications',
	follow_cancelButton: 'Cancel',
	follow_doneButton: 'Done',
	follow_subscriptionInProgress: 'Saving...',
	follow_notifyMode_noemail: 'Never for this Stream',
	follow_notifyMode_email: 'Only when someone replies to my comments in this stream',
	follow_notifyMode_anymails: 'Each time a new item is added to the Stream',
	follow_emailAddressLabel: 'My Email address is:',
	follow_editProfile: 'Edit',
	follow_emptyEmail: 'Not provided',
	follow_openingProfile: 'Opening Profile...',
	shareWith_facebook: "My Facebook Friends",
	shareWith_yahoo: "My Yahoo! Friends",
	shareWith_gfc: "My Google Friends",
	shareWith_twitter: "My Twitter Followers",
	shareWith_friendfeed: "My FriendFeed Followers",
	expirationBanner_title: "The Echo subscription for this domain has expired.",
	expirationBanner_description: "Renew your subscription now and enjoy a smooth continuation of the service.<br /> You are getting this notice because your subscription or your free trial period has expired.",
	expirationBanner_domain: "Domain:",
	expirationBanner_subscriptionType: "Subscription type:",
	expirationBanner_serviceFirstDate: "First date of service:",
	expirationBanner_expirationDate: "Expiration date:",
	yourNameHere: "Your name here...",
	yourNameRequired: "Your name (required)",
	clickToEdit: "Click to edit",

	confirmMessage_unbindAccount: "Note: This will unbind this service from your Account. Are you sure?",
	confirmMessage_unbindLastAccount: "WARNING: This is the last remaining service bound to this account.\nIf you proceed, you will not be able to access this account anymore. Are you sure?"
  };
  var $JCL = window.JSCC_Translate || function(t, tmpl) {
	var text = (window.JSKitLabels && window.JSKitLabels[t]) || (window.$JCLTL && $JCLTL[t]) || $JCLT[t] || t;
	if(tmpl) JSKitLib.fmap(tmpl,
		function(v,k){text=text.replace(new RegExp('{'+k+'}','g'),v);});
	return text;
  }
}



if(!window.JSKitAPI) JSKitAPI = {};

JSKitAPI.allowed_event_names = {
	"comment-submit": true,
	"comment-added": true,
	"comment-deleting": true,
	"comment-deleted": true,
	"comments-data-loaded": true,
	"comments-count-updated": true,
	"user-login": true,
	"user-logout": true
};

JSKitAPI.subscribe = function(kit_event, callback) {
	if(this.allowed_event_names.hasOwnProperty(kit_event)) {
		return JSKW$Events.registerEventCallback(null,
		function(name, base, args) {
			try {
				var v = callback.apply(base['this'], args);
				var rvalue = { 'type': 'value', 'value': v };
			} catch(e) {
				var rvalue = { 'type':'exception', 'value': e };
			}
			base.returns.push(rvalue);
		}, "STABLE-API-" + kit_event);
	} else {
		return null;
	}
}
JSKitAPI.unsubscribe = function(token) {
	JSKW$Events.invalidateContext(token);
}
JSKitAPI.publish = function(kit_event) {
	var elist = window.JSKitEvents;
	if (elist) {
		JSKitLib.map(function(v) {
			JSKitAPI.subscribe(v.subscribe, v.callback);
		}, elist);
		window.JSKitEvents = null;
	}
	var base = { 'this': this, returns: [] };
	JSKW$Events.syncBroadcast("STABLE-API-" + kit_event, base, arguments);
	return base.returns;
}
// .askpublic() publishes the event, interprets the response and _throws_
// if any called callback threw. Otherwise, a simple .publish will ignore
// throws. This is used to translate errors generated in the callback
// to the application itself.
JSKitAPI.askpublic = function(kit_event) {
	return JSKitAPI._interpret(JSKitAPI.publish.apply(this, arguments));
}
JSKitAPI._interpret = function(returns) {
	var rvalue = { 'type': 'value', 'value': true };
	// Throw _some_ observed exception or returns _some_ value.
	// "_some_" because the subscription order can not be relied upon.
	return JSKitLib.foldl(rvalue, returns, function(r) {
		if(r.type == 'exception') throw(r.value);
		rvalue.value = r.value;
	}).value;
}





if(!window.JSKitEPB){
	var JSKitEPB = new JSKitEPBLib();
}

function JSKitEPBLib() {
	this.JSK$EPB = window.JSK$EPB ? window.JSK$EPB : {};
}

JSKitEPBLib.prototype.isExists = function() {
	return (this.JSK$EPB.mac && this.JSK$EPB.profile) ? 1: 0;
}

JSKitEPBLib.prototype.getValue = function(ValueName) {
	return !this.isExists() || this.JSK$EPB.profile[ValueName] == undefined ? undefined : this.JSK$EPB.profile[ValueName];
}

JSKitEPBLib.prototype.getElement = function(Pref,El,ArrKey) {
	var rslt = [];
	if(typeof(El) == 'object') {
		if(El instanceof Array) {
			if(ArrKey) {
				var len = El.length;
				for(var i=0; i<len; i++)
					rslt = rslt.concat(this.getElement(Pref,El[i],ArrKey));
			}
		} else {
			for(var i in El)
				rslt = rslt.concat(this.getElement(Pref,El[i],i));
		}
	} else {
		if(ArrKey) {
			rslt.push({'Name': Pref+ArrKey, 'Value': El});
		}
	}
	return rslt;
}

JSKitEPBLib.prototype.getAsObj = function() {
	var rslt = [];
	var pref = "epb-";
	var epb = this.JSK$EPB;
	if(!epb.profile || !epb.mac) return rslt;
	rslt.push({'Name': pref+"mac",'Value': epb.mac});
	return rslt.concat(this.getElement(pref,epb.profile));
}

JSKitEPBLib.prototype.getURIEncodedSerialize = function() {
	var ser = this.getAsObj();
	var ar = [];
	for(var i=0; i<ser.length; i++) {
		ar.push(ser[i].Name + "=" + encodeURIComponent(ser[i].Value));
	}
	return ar.join("&");
}

JSKitEPBLib.prototype.getAsHash = function(obj) {
	var ser = this.getAsObj();
	obj = obj || {};
	JSKitLib.fmap(ser, function(v) { obj[v.Name] = v.Value; });
	return obj;
}





if(!window.JSKitLib) JSKitLib = {vars:{}};





JSKitLib.cr = function(arg) {
	if(!arg) return document.createElement("div");
	arg.t = arg.t || "div";
	var div = document.createElement(arg.t);
	if(arg.className) div.className = arg.className;
	if(arg.style) JSKitLib.addStyle(div, arg.style);
	return div;
}

JSKitLib.deleteProperty = function(obj, prop) {
	if (typeof obj[prop] == 'function') {
		obj[prop] = null;
	} else {
		try {
			delete obj[prop];
		} catch (e) {
			obj[prop] = null;
		}
	}
}

JSKitLib.trim = function(str) {
	if (typeof(str) != "string") return "";
	var str = str.replace(/^\s\s*/, ''), ws = /\s/, i = str.length;
	while (ws.test(str.charAt(--i)));
	return str.slice(0, i + 1);
}

JSKitLib.truncate = function(text, maxLength, postfix, cutWords) {
        if (text.length <= maxLength) return text;
        var match = text.match(new RegExp("^.{1," + maxLength + "}\\b"));
        return ((match && !cutWords ? match[0] : false) || text.substr(0, maxLength)) + (postfix || "");
}

JSKitLib.extractDomain = function(url) {
	var match = url.match(/(https?:\/\/)?(www.)?([^\/]*)/);
	return match ? match[3] : url;
}

JSKitLib.encodeJSONLiteral = function(string) {
	var replacements = {'\b': '\\b', '\t': '\\t', '\n': '\\n', '\f': '\\f', '\r': '\\r', '"' : '\\"', '\\': '\\\\'};
	return string.replace(/[\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff\\]/g, 
		function (a) { return (replacements.hasOwnProperty(a)) ? replacements[a] : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4); });
}

JSKitLib.Object2JSON = function(obj) {
	var out;
	switch (typeof(obj)) {
		case "number"  : out = isFinite(obj) ? obj : 'null'; break; 
		case "string"  : out = '"' + JSKitLib.encodeJSONLiteral(obj) + '"'; break;	
		case "boolean" : out = '"' + obj.toString() + '"'; break;
		default :
			if (obj instanceof Array) {
				var container = JSKitLib.fmap(obj, function(element) { return JSKitLib.Object2JSON(element); });
				out = '[' + container.join(",") + ']';
			} else if(obj instanceof Object) {
				var source = obj.exportProperties || obj;
				var container = JSKitLib.fmap(source, function(value, property) {
					if (source instanceof Array) { property = value; value = obj[property]; } 
					return '"' + property + '":' + JSKitLib.Object2JSON(value);
				});
	      			out = '{' + container.join(",") + '}';
			} else {
				out = 'null';
			}
	}
	return out;
}

JSKitLib.appendExternalParams = function(service, requestType, currentParams) {
	if (!window.JSKitExternalParams) return currentParams;
	JSKitLib.fmap(window.JSKitExternalParams, function(data) {
		var serviceRegExp = new RegExp(data.service || "*");
		var requestTypeRegExp = new RegExp(data.requestType || "*");
		if (serviceRegExp.test(service) && requestTypeRegExp.test(requestType)) {
			JSKitLib.fmap(data.params, function(value, key) { currentParams[key] = value; });
		}
	});
	return currentParams;
}





/////////////////////////////////////////
//	JS Menu base class
/////////////////////////////////////////
function JSMenuItemBase(obj) {
	if(!obj) return;
	this.init(obj);
}

JSMenuItemBase.prototype.init = function(obj) {
	JSKitLib.fmap.call(this, obj, function(value, key) {this[key] = value;});
	this.items = [];
	this.createItem();
	this.createContainer();
	this.attachContainer();
	if(obj.disabled) {
		this.disableItem();
	} else {
		this.addItemHighlighting();
		this.setAction(this.action);
	}
	if (this.oninit) this.oninit();
	JSKitLib.hide(this.outerCnt);
	if(this.hidden) JSKitLib.hide(this.itemNode);
}

JSMenuItemBase.prototype.createItem = function() {
	this.itemNode = JSKitLib.cr({t:"tr", className: "jskit-MenuItem"});
	JSKitLib.fmap.call(this, ["Icon", "Title", "Ending"], function(part, i) {
		var td = JSKitLib.cr({t:"td", className: "jskit-MenuItem"});
		this.itemNode.appendChild(td);
		var div = td.appendChild(JSKitLib.cr({className: "jskit-MenuItem" + part}));
		this["render" + part](div);
		if (!this.enableSelect) JSKitLib.preventSelect(div);
		this[part.toLowerCase() + "Node"] = div;
		this[part.toLowerCase() + "NodeCnt"] = td;
	});
}

JSMenuItemBase.prototype.renderIcon = function(cnt) {
	if(this.icon) JSKitLib.addPNG(cnt, this.icon);
}

JSMenuItemBase.prototype.renderTitle = function(cnt) {
	JSKitLib.text(this.title, cnt);
}

JSMenuItemBase.prototype.renderEnding = function(cnt) {};

JSMenuItemBase.prototype.disableItem = function() {
	var self = this;
	JSKitLib.fmap(["item", "icon", "title", "ending"], function(part) {
		JSKitLib.addClass(self[part + "Node"], "jsk-DisabledFontColor");
	});
}

JSMenuItemBase.prototype.addItemHighlighting = function() {
	var self = this;
	JSKitLib.fmap([{event: "mouseover", action: "addClass"}, {event: "mouseout", action: "removeClass"}], function(e) {
		JSKitLib.addEventHandler(self.itemNode, [e.event], function() {
			if(self.statusText) {
					window.status = e.event == "mouseover" ? self.statusText : "";
			}
			JSKitLib.fmap(["icon", "title", "ending"], function(part) {
				JSKitLib[e.action](self[part + "NodeCnt"], "jskit-MenuItemMO");
			});
		});
	});
}

JSMenuItemBase.prototype.createContainer = function() {
	this.outerCnt = JSKitLib.cr({className: "jskit-MenuContainer"});	
	if(JSKitLib.isIE()) this.outerCnt.style.zoom = "1";
	var tbl = JSKitLib.cr({t:"table"});
	tbl.cellSpacing = tbl.cellPadding = "0";
	this.innerCnt = JSKitLib.cr({t:"tbody"});
	this.outerCnt.appendChild(tbl);
	tbl.appendChild(JSKitLib.cr({t:"thead"}));
	tbl.appendChild(this.innerCnt);
	tbl.appendChild(JSKitLib.cr({t:"tfoot"}));
}

JSMenuItemBase.prototype.attachContainer = function() {
	JSKitLib.show(this.outerCnt, "inline");
	this.endingNode.parentNode.appendChild(this.outerCnt);
}

JSMenuItemBase.prototype.appendItem = function(item, after) {
	if(!this.items.length) {
		this.addExpandMarker();
		this.addExpandHandler();
		this.addCollapseCallback();
	}
	this.innerCnt.insertBefore(item.itemNode, after ? after.itemNode.nextSibling : null);
	this.items.push(item);
	item.parent = this;
}

JSMenuItemBase.prototype.removeItem = function(item2del) {
	JSKitLib.fmap.call(this, this.items, function(item, i) {
		if(item != item2del) return;
		this.innerCnt.removeChild(item.itemNode);
		this.items.splice(i, 1);
	});
}

JSMenuItemBase.prototype.addExpandMarker = function() {
	JSKitLib.text("\u25BA", this.endingNode);
}

JSMenuItemBase.prototype.addExpandHandler = function() {
	var self = this;
	JSKitLib.fmap([{event: "mouseover", display: "inline"}, {event: "mouseout", display: "none"}], function(e) {
		JSKitLib.addEventHandler(self.itemNode, [e.event], function() {
			JSKitLib.show(self.outerCnt, e.display);
		});
	});
}

JSMenuItemBase.prototype.addCollapseCallback = function() {
	var self = this;
	JSKW$Events.registerEventCallback(undefined, function() {
		self.outerCnt.style.display = "none";
	}, "JSMenu-CollapseAll");
}

JSMenuItemBase.prototype.setAction = function(action) {
	var self = this;
	this.action = action;
	if (action) this.itemNode.onclick = function() {action.call(self);};
}

JSMenuItemBase.prototype.rename = function(text) {
	this.title = text;
	this.titleNode.replaceChild(JSKitLib.text(text), this.titleNode.firstChild);
}

JSMenuItemBase.prototype.hide = function() {
	this.hidden = true;
	JSKitLib.hide(this.itemNode);
}

JSMenuItemBase.show = function() {
	this.hidden = false;
	JSKitLib.show(this.itemNode);
}

/////////////////////////////////////////
//	JS Menu with inner HTML
/////////////////////////////////////////

function JSMenuItemHTML(obj) {
	this.init(obj);
}

JSMenuItemHTML.prototype = new JSMenuItemBase();

JSMenuItemHTML.prototype.createItem = function() {
	this.itemNode = JSKitLib.cr({t: "tr"});
	var td = this.itemNode.appendChild(JSKitLib.cr({t: "td"}));
	td.colSpan = "3";
	JSKitLib.fmap.call(this, ["Title", "Ending"], function(part) {
		this[part.toLowerCase() + "Node"] = td.appendChild(JSKitLib.cr({style: "float: left;"}));
	});
	this.titleNode.appendChild(this.title);
	JSKitLib.addStyle(this.titleNode, "overflow: hidden; width: 100%;");
}

JSMenuItemHTML.prototype.addItemHighlighting = function(){};

/////////////////////////////////////////
//	JS Menu with checkboxes
/////////////////////////////////////////
function JSMenuItemCheckbox(obj) {
	if(!obj) return;
	obj.controlElementType = "Checkbox";
	this.init(obj);
	this.addCheckEvents();
	this.addDeleteEvent();
	this.setState();
}

JSMenuItemCheckbox.prototype = new JSMenuItemBase();

JSMenuItemCheckbox.prototype.renderIcon = function(cnt) {
	this.checkbox = cnt.appendChild(JSKitLib.html('<div class="jskit-MenuItem' + this.controlElementType + '"></div>'));
	if(this.hideCheckbox) this.checkbox.style.visibility = "hidden";
	JSKitLib.addPNG(cnt.appendChild(JSKitLib.cr({className: "jskit-MenuItemIcon"})), this.icon);
	JSKitLib.addClass(cnt, "jskit-MenuItem" + this.controlElementType + "Cnt");
}

JSMenuItemCheckbox.prototype.renderTitle = function(cnt) {
	JSKitLib.text(this.displayTitle || this.title, cnt);
}

JSMenuItemCheckbox.prototype.renderEnding = function(cnt) {
	if (this.deletable) {
		JSKitLib.addClass(cnt, "jskit-MenuDeleteButton");
		JSKitLib.addPNG(cnt, "//cdn.js-kit.com/images/menu/menu-delete-button.png");
		cnt.title = this.deleteLabel;
	}
}

JSMenuItemCheckbox.prototype.addDeleteEvent = function() {
	var self = this;
	this.endingNode.onclick = function(e) {
		JSKitLib.stopEventPropagation(e);
		if(self.ondelete) self.ondelete.apply(self);
	}
}

JSMenuItemCheckbox.prototype.addCheckEvents = function() {
	var self = this;
	JSKitLib.addEventHandler(self.itemNode, ["click"], function(e) {
		if (!self.state.match(/disabled/)) JSKitLib.stopEventPropagation(e);
		if (self.hideCheckbox) return;
		switch(self.state) {
			case "unchecked": if(self.oncheck) self.oncheck(self.title); self.setState("checked"); break;
			case "checked": if(self.onuncheck) self.onuncheck(self.title); self.setState("unchecked"); break;
		}
	});
}

JSMenuItemCheckbox.prototype.setState = function(state) {
	this.state = state || this.state;
	JSKitLib[(this.state == "disabled" ? "add" : "remove") + "Class"](this.titleNode, "jsk-DisabledFontColor");
	JSKitLib.addPNG(this.checkbox, "//cdn.js-kit.com/images/common/" + this.controlElementType.toLowerCase() + "_" + this.state + ".png");
	if (this.state == "disabled" && this.endingNode) this.endingNode.style.display = 'none';
}

/////////////////////////////////////////
//      JS Menu with radio buttons
/////////////////////////////////////////
function JSMenuItemRadio(obj) {
	if(!obj) return;
	var self = this;
	obj.enableSelect = true;
	obj.controlElementType = "Radio";
	JSKitLib.fmap(obj.extend || {}, function(extendFunc, name) {
		var basicFunc = self[name];
		self[name] = function() {
			basicFunc.apply(self, arguments);
			extendFunc.apply(self, arguments);
		};
	});
	this.init(obj);
	this.addCheckEvents();
	this.setState();
}

JSMenuItemRadio.prototype = new JSMenuItemCheckbox();

JSMenuItemRadio.prototype.renderTitle = function(cnt) {
	cnt.appendChild(this.title);
}

JSMenuItemRadio.prototype.addCheckEvents = function() {
	var self = this;
	JSKitLib.addEventHandler(self.itemNode, ["click"], function(e) {
		if (!self.state.match(/disabled/)) JSKitLib.stopEventPropagation(e);
		self.setActiveState(function() {
			if (self.oncheck) self.oncheck(self.title);
		});
	});
}

JSMenuItemRadio.prototype.setActiveState = function(onActivateCallback) {
	var self = this;
	if (self.state == "unchecked") {
		if (onActivateCallback) onActivateCallback();
		JSKitLib.fmap(self.parent.items, function(item) {
			if (item.type == "Radio" && item.state == "checked") {
				if (item.onuncheck) item.onuncheck(item.title);
				item.setState("unchecked");
			}
		});
		self.setState("checked");
	}
}


/////////////////////////////////////////
//	JS Root Menu class
/////////////////////////////////////////

function JSMenuItemRoot(obj) {
	if(!obj) return;
	this.init(obj);
	JSKitLib.addClass(this.outerCnt, "jskit-MenuRootContainer");
}

JSMenuItemRoot.prototype = new JSMenuItemBase();

JSMenuItemRoot.prototype.createItem = function() {
	this.itemNode = JSKitLib.cr();
	JSKitLib.fmap.call(this, [{name: "title", suff: ""}, {name: "ending", suff: "ExpandMarker"}], function(part) {
		this[part.name + "Node"] = JSKitLib.cr({className: "jskit-MenuTitle" + part.suff});
	});
	if(this.title) {
		var tbl = JSKitLib.cr({t:"table"});
		tbl.cellSpacing = tbl.cellPadding = "0";
		var row = tbl.insertRow(0);
		JSKitLib.fmap.call(this, ["title", "ending"], function(part, i) {
			row.insertCell(i).appendChild(this[part + "Node"]);
		});
		JSKitLib.preventSelect(this.titleNode);
		JSKitLib.addPNG(this.endingNode, "//cdn.js-kit.com/images/menu/vertical-menu-expand-marker.png");
		JSKitLib.text(this.title, this.titleNode);
		this.itemNode.appendChild(tbl);
	}
}

JSMenuItemRoot.prototype.addItemHighlighting = function() {
	var self = this;
	JSKitLib.fmap([{event: "mouseover", action: "addClass"}, {event: "mouseout", action: "removeClass"}], function(e) {
		JSKitLib.addEventHandler(self.itemNode, [e.event], function() {
			JSKitLib[e.action](self.itemNode, "js-kitMenuTitleMO");
		});
	});
}

JSMenuItemRoot.prototype.addExpandHandler = function() {
	var self = this;
	JSKW$Events.registerEventCallback(undefined, function(eventName, menuNode) {
		if (self.itemNode != menuNode) return;
		var need2hide = (self.outerCnt.style.display != "none");
		JSKW$Events.syncBroadcast("JSMenu-CollapseAll");
		if (need2hide) {
			JSKitLib.removeClass(self.titleNode, "js-kitMenuTitlePressed");
		} else {
			JSKitLib.addClass(self.titleNode, "jskit-MenuTitlePressed");
			JSKitLib.show(self.outerCnt, "block");
			if (self.layer && !self.leftPosCorrection) {
				var titleNodePos = JSKitLib.findPos(self.titleNode);
				self.leftPosCorrection = titleNodePos[0] + self.outerCnt.offsetWidth - JSKitLib.findPos(self.layer)[2];
				if (self.leftPosCorrection > 0) self.outerCnt.style.left = (self.outerCnt.offsetLeft - self.leftPosCorrection) + "px";
			}
		}
	}, 'JSMenu-Opened');
	JSKitLib.addEventHandler(this.itemNode, ['click'], function(e) {
		JSKitLib.stopEventPropagation(e);
		JSKW$Events.syncBroadcast('JSMenu-Opened', self.itemNode);
	});
}

JSMenuItemRoot.prototype.addCollapseCallback = function() {
	var self = this;
	JSKW$Events.registerEventCallback(undefined, function() {
		self.outerCnt.style.display = "none";
		JSKitLib.removeClass(self.titleNode, "jskit-MenuTitlePressed");
	}, "JSMenu-CollapseAll");
}

JSMenuItemRoot.prototype.attachContainer = function() {
	this.itemNode.appendChild(this.outerCnt);
}

JSMenuItemRoot.prototype.addExpandMarker = function() {};

/////////////////////////////////////////
//	JS Menus Delimeter
/////////////////////////////////////////

function JSMenuItemDelimeter(obj) {
	this.level = obj.level;
	this.itemNode = JSKitLib.cr({t:"tr"});
	var td = JSKitLib.cr({t:"td"});
	td.colSpan = "3";
	var delim = JSKitLib.cr({className: "jskit-MenuDelimeter"});
	td.appendChild(delim);
	this.itemNode.appendChild(td);
}

/////////////////////////////////////////
//	JS Menus with dynamic text input
/////////////////////////////////////////

function JSMenuItemDTI(obj) {
	this.init(obj);
}

JSMenuItemDTI.prototype = new JSMenuItemBase();

JSMenuItemDTI.prototype.renderTitle = function(cnt) {
	var input = JSKitLib.html('<input type="text" readonly style="display:none" value="' + this.inputValue + '" class="' + 'jskit-MenuItemInput">');
	JSKitLib.text(this.title, cnt);
	cnt.parentNode.insertBefore(input, cnt);
	JSKitLib.addEventHandler(this.itemNode, ["click"], function(e) {
		JSKitLib.stopEventPropagation(e);
		cnt.style.visibility = "hidden";
		JSKitLib.show(input);
		input.focus();
		input.select();
	});
	input.onblur = function() {
		JSKitLib.hide(input);
		cnt.style.visibility = "visible";
	}
}

/////////////////////////////////////////
//	JS Root menu with HTML inside
/////////////////////////////////////////
function JSMenuItemRootHTML(obj) {
	this.init(obj);
	JSKitLib.addClass(this.outerCnt, "jskit-MenuRootContainer");
}

JSMenuItemRootHTML.prototype = new JSMenuItemRoot();

JSMenuItemRootHTML.prototype.createItem = function() {
	this.itemNode = JSKitLib.cr();
	JSKitLib.fmap.call(this, ["Title", "Ending"], function(part) {
		this[part.toLowerCase() + "Node"] = this.itemNode.appendChild(JSKitLib.cr());
	});
	JSKitLib.preventSelect(this.titleNode);
	JSKitLib.addClass(this.itemNode, "jskit-MenuRootHTML");
	this.titleNode.appendChild(this.title);
}

JSMenuItemRootHTML.prototype.addItemHighlighting = function() {}

JSMenuItemRootHTML.prototype.attachContainer = function() {
	this.endingNode.appendChild(this.outerCnt);
}

/////////////////////////////////////////
//	JS Self-Reproducing Checkbox Menu
/////////////////////////////////////////

function JSMenuItemSRCheckbox(obj) {
	var self = this;
	if(!obj) return;
	obj.enableSelect = true;
	obj.controlElementType = "Checkbox";
	this.init(obj);
	this.defaultData = obj;
	this.addCheckEvents();
	this.addDeleteEvent();
	this.setState(this.state || "checked");
}

JSMenuItemSRCheckbox.prototype = new JSMenuItemCheckbox();

JSMenuItemSRCheckbox.prototype.renderTitle = function(cnt) {
	var self = this;
	var title = this.title;
	duplicate = function() {
		if(!self.alreadyEdited && self.title != self.defaultData.title) {
			self.alreadyEdited = true;
			if(!self.unclonable) {
				self.parent.appendItem(new JSMenuItemSRCheckbox(self.defaultData), self);
			}
			self.checkbox.style.visibility = "visible";
			self.hideCheckbox = false;
			if(self.oncreate) self.oncreate(self.title);
			self.setState("checked");
			self.endingNode.style.display = "block";
		} else {
			if(self.onupdate && title != self.title) {
				self.onupdate([title, self.title]);
				title = self.title;
			}
		}
	}
	this.ipe = new JSIPE2({obj: self, property: 'title', jsk$wasEdited: duplicate, maxLength: 100, hideApplyBtn: true, jsk$validate: function(newValue) {if(self.validator) return self.validator.call(self, newValue); else return true;}})
	JSKW$Events.registerEventCallback(0, function() {self.ipe.resetChanges();}, "JSMenu-CollapseAll");
	cnt.appendChild(this.ipe.div);
}

JSMenuItemSRCheckbox.prototype.renderEnding = function(cnt) {
	JSKitLib.addClass(cnt, "jskit-MenuDeleteButton");
	JSKitLib.addPNG(cnt, "//cdn.js-kit.com/images/menu/menu-delete-button.png");
	if(!this.alreadyEdited || this.unclonable) cnt.style.display = "none";
}

JSMenuItemSRCheckbox.prototype.addDeleteEvent = function() {
	var self = this;
	this.endingNode.onclick = function(e) {
		JSKitLib.stopEventPropagation(e);
		if(self.ondelete) self.ondelete(self.title);
		self.parent.removeItem(self);
	}
}

/////////////////////////////////////////
//	JS Menus interface
/////////////////////////////////////////

function JSMenu(title, data, type, layer) {
	var root = new window["JSMenuItemRoot" + (type || "")]({title: title, level: 0, layer: layer});
	var curItem = root;
	root.itemNode.items = [];
	JSKitLib.fmap(data, function(itemData) {
		if (typeof(itemData.level) == "undefined") itemData.level = 1;
		var item = itemData.type ? (new window["JSMenuItem" + itemData.type](itemData)) : (new JSMenuItemBase(itemData));
		while(item.level <= curItem.level) curItem = curItem.parent;
		curItem.appendItem(item);
		root.itemNode.items.push(item);
		curItem = item;
	});
	JSKitLib.addEventHandler(document, ["click"], function(e) {
		if(JSKitLib.getBrowser() != "gecko" || e.button != 2) JSKW$Events.syncBroadcast("JSMenu-CollapseAll");
	});
	return root.itemNode;
}

function JSDogtag(data) {
	var obj = JSKitLib.cr({className: "jskit-Dogtag"});
	JSKitLib.fmap(["Icon", "Text", "Cross"], function(part) {
		var node = JSKitLib.cr({className: "jskit-Dogtag" + part});
		obj.appendChild(node);
		obj[part.toLowerCase() + "Node"] = node;
	});
	JSKitLib.text(JSKitLib.truncate(data.text, 17, "...", true), obj.textNode);
	JSKitLib.preventSelect(obj.textNode);
	JSKitLib.addEventHandler(obj, ['click'], function(e) {
		JSKitLib.stopEventPropagation(e);
	});
	if(data.icon) JSKitLib.addPNG(obj.iconNode, data.icon);
	JSKitLib.addPNG(obj.crossNode, "//cdn.js-kit.com/images/cross.png");
	if (data.onclose) obj.crossNode.onclick = data.onclose; else JSKitLib.hide(obj.crossNode);
	obj.title = data.text;
	obj.hide = function() {
		JSKitLib.hide(obj);
	}
	obj.show = function(newText) {
		JSKitLib.show(obj);
		obj.title = newText || obj.title;
		obj.textNode.replaceChild(JSKitLib.text(JSKitLib.truncate(obj.title, data.maxLength || 12, "...", true)), obj.textNode.firstChild);
	}
	return obj;
}






JSKitLib.isPreIE7 = function() {
	if (document.body && document.body.filters && parseInt(navigator.appVersion.split("MSIE") [1]) < 7)
		return true;
}

JSKitLib.isPreIE8 = function() {
	if (document.body && document.body.filters && parseInt(navigator.appVersion.split("MSIE") [1]) < 8)
		return true;
}

JSKitLib.isIE = function() {
	if (document.body && document.body.filters && navigator.appVersion.match(/MSIE/))
		return true;
}

JSKitLib.getBrowser = function() {
	if (JSKitLib.vars.browser) return JSKitLib.vars.browser;
	if (document.body && document.body.filters && navigator.appVersion.match(/MSIE/)) {
			JSKitLib.vars.browser = "IE";
	} else if ((navigator.appCodeName.toLowerCase()=="mozilla") 
		&& (navigator.appName.toLowerCase()=="netscape") 
		&& (navigator.product.toLowerCase()=="gecko") 
	) {
		if (navigator.userAgent.toLowerCase().indexOf("safari")!=-1) {
			JSKitLib.vars.browser = "safari";
		} else if (navigator.userAgent.toLowerCase().indexOf("firefox")!=-1) {
			JSKitLib.vars.browser = "gecko";
		}
	} else if (navigator.product && navigator.product.toLowerCase()=="gecko") {
		JSKitLib.vars.browser = "gecko";
	} else if (navigator.appName.match(/Opera/)) { 
		JSKitLib.vars.browser = "opera"; 
	}
	return JSKitLib.vars.browser;
}

JSKitLib.isFF3 = function() {
	return (navigator.userAgent.indexOf("Firefox/3") != -1);
}

JSKitLib.isGChrome = function() {
	return (navigator.userAgent.toLowerCase().indexOf('chrome') != -1);
}

JSKitLib.isSafari = function() {
	if (navigator.appVersion.match(/Safari/)) {
		return true;
	}
}

JSKitLib.isOpera = function() {
	if (navigator.appName.match(/Opera/)) {
		return true;
	}
}





JSKitLib.setEventHandler = function(obj, eventNames, eventHandler) {
	JSKitLib.fmap(eventNames, function(eventName) {
		obj["on" + eventName] = function(){
			eventHandler();
			return false;
		}
	});
}

JSKitLib.resetEventHandler = function(obj, eventNames) {
	JSKitLib.fmap(eventNames, function(eventName) {
		obj["on" + eventName] = function(){};
	});
}

JSKitLib.addEventHandler = function(obj, eventNames, eventHandler, capture) {
	JSKitLib.fmap(eventNames, function(e) {
		if (obj.addEventListener) {
			obj.addEventListener(e, eventHandler, !!capture);
		} else if (obj.attachEvent) {
			if (capture) {
				if (capture === true) capture = obj;
				capture.setCapture();
				capture.attachEvent('onlosecapture', eventHandler);
			}
			obj.attachEvent('on' + e, eventHandler);
		}
	});
}

JSKitLib.removeEventHandler = function(obj, eventNames, eventHandler, capture) {
	JSKitLib.fmap(eventNames, function(e) {
		if (obj.removeEventListener) {
			obj.removeEventListener(e, eventHandler, !!capture);
		} else if (obj.detachEvent) {
			if (capture) {
				if (capture === true) capture = obj;
				capture.detachEvent('onlosecapture', eventHandler);
				capture.releaseCapture();
			}
			obj.detachEvent('on' + e, eventHandler);
		}
	});
}

JSKitLib.setMouseEvent = function(obj, eventName, eventHandler) {
	var normalize = function(pr_event){
		e = pr_event || window.event;
		if (!e.target)
			e.target = e.srcElement || document;
		if (e.target.nodeType == 3)
			e.target = e.target.parentNode;
		if (!e.relatedTarget && e.fromElement)
			e.relatedTarget = (e.fromElement == e.target) ? e.toElement : e.fromElement;
		return e;
	};
	obj["onmouse" + eventName] = function(pr_event) {
		var e = normalize(pr_event);
		if (e.relatedTarget == obj || JSKitLib.isChildNodeOf(obj, e.relatedTarget)) return false;
		eventHandler(e);
	};
}

JSKitLib.stopEventPropagation = function(e) {
	if (!e) e = window.event;
	e.cancelBubble = true;
	if (e.stopPropagation) e.stopPropagation();
}

JSKitLib.preventDefaultEvent = function(e) {
  if (!e) e = window.event;
  e.returnValue = false;
  if (e.preventDefault) e.preventDefault();
}

JSKitLib.deferCall = function(func, onlyIE) {
	if (!JSKitLib.vars.windowOnLoadFired && (!onlyIE || (onlyIE && JSKitLib.isIE() && !window.$JSKitNoDeferCallIfIE))) {
		JSKitLib.addEventHandler(window, ['load'], func);
	} else {
		func();
	}
}

JSKitLib.addHandlers = function(obj, moveHandler, upHandler, capture) {
	JSKitLib.addEventHandler(obj, ['mousemove'], moveHandler, capture);
	JSKitLib.addEventHandler(obj, ['mouseup'], upHandler, capture);
}

JSKitLib.removeHandlers = function(obj, moveHandler, upHandler, capture) {
	JSKitLib.removeEventHandler(obj, ['mousemove'], moveHandler, capture);
	JSKitLib.removeEventHandler(obj, ['mouseup'], upHandler, capture);
}

JSKitLib.notDraggable = function(element) {
	element.onselectstart = function(ev) { JSKitLib.stopEventPropagation(ev); return true; }
	element.onmousedown = JSKitLib.stopEventPropagation;
	return element;
}

JSKitLib.getMousePosition = function(e) {
	if (!e) var e = window.event;
	if (e.clientX || e.clientY) {
		return {x:e.clientX, y:e.clientY};
	} else {
		return {x:e.pageX, y:e.pageY};
	}
}

JSKitLib.preventSelect = function(element, exceptions) {
	var browser = JSKitLib.getBrowser();
	var prevent = function() {
		if (browser == 'IE' || browser == 'safari') {
			element.onselectstart = function() { return false; }
		} else if (browser == 'gecko') {
			JSKitLib.addClass(element, 'js-nsgecko');
		}
	}
	if (typeof exceptions == 'object') {
		var include = exceptions.include || [];
		var exclude = exceptions.exclude || [];
		// Do not handle for certain browsers
		if (exclude.length) {
			for (var i=0; i < exclude.length; i++) {
				if (exclude[i] != browser) {
					prevent();
				}
			}
		}
		// Handle for certain browsers
		if (include.length) {
			for (var i=0; i < include.length; i++) {
				if (include[i] == browser) {
					prevent();
				}
			}
		}
	} else {
		prevent();
	}
}

JSKitLib.timedRetry = function(obj) {
	if(obj.pred()) {
		obj.onSuccess();
	} else {
		obj.currentRetries = (obj.currentRetries || 0) + 1;
		if(obj.currentRetries > obj.maxRetries) {
			if(obj.onFailure) obj.onFailure();
		} else {
			if(obj.onRetry) obj.onRetry();
			setTimeout(function(){
					JSKitLib.timedRetry(obj);
				}, obj.timeout);
		}
	}
}

JSKitLib.addDOMLoadedListener = function(callback) {
	window.JSK$DOMLoadedCallbacks = window.JSK$DOMLoadedCallbacks || [];
	window.JSK$DOMLoadedCallbacks.push(callback);
	if (window.JSK$DOMLoadedCallbacks.length > 1)
		return;
	var totalListener = function() {
		JSKitLib.fmap(window.JSK$DOMLoadedCallbacks, function(c) { c(); });
	}
	switch (JSKitLib.getBrowser()) {
		case 'gecko':
		case 'opera':
			document.addEventListener("DOMContentLoaded", totalListener, false);
			break;
		case 'IE':
			var temp = document.createElement('div');
			(function() {
				try {
					temp.doScroll('left');
				} catch (e) {
					setTimeout(arguments.callee, 100);
					return;
				}
				totalListener();
			})();
			break;
		case 'safari':
			(function() {
				if (document.readyState != 'complete') {
					setTimeout(arguments.callee, 100);
					return;
				}
				totalListener();
			})();
			break;
		default:
			JSKitLib.addEventHandler(window, ['load'], totalListener);
	}
}






JSKitLib.addCss = function(cssCode, name, content) {
	var doc = content || document;
	if(name) {
		name = "js-" + name + "-css";
		if (doc.getElementById(name)) return;
	}
	var se = doc.createElement("style");
	se.type = "text/css";
	if(name) se.id = name;
	if (se.styleSheet) se.styleSheet.cssText = cssCode;
	else se.appendChild(doc.createTextNode(cssCode));
	var hd = doc.getElementsByTagName("head");
	if(hd && hd[0]) hd[0].appendChild(se);
	else if (JSKitLib.isGChrome()) {
		doc.body.insertBefore(se, doc.body.firstChild);
	} else doc.write('<style>'+cssCode+'</style>');
}

JSKitLib.getElementsByClass = function(node, searchClass, tag) {
	var classElements = [];
	node = node || document;
	tag = tag || '*';
	var tagElements = node.getElementsByTagName(tag);
	var regex = new RegExp("(^|\\s)" + searchClass + "(\\s|$)");
	for (var i=0, j=0; i < tagElements.length; i++) {
		if (regex.test(tagElements[i].className)) {
			classElements[j] = tagElements[i];
			j++;
		}
	}
	return classElements;
};

JSKitLib.mapClass2Object = function(ctl, e) {
        if(e.className) {
                var arr = String(e.className).split(/[ ]+/);
                JSKitLib.map(function(el) { ctl[el] = e }, arr);
        }
        if(e.name) ctl[e.name] = e;
        try {
                var self = this;
                JSKitLib.map(function(child) {
                        JSKitLib.mapClass2Object(ctl, child);
                }, e.childNodes);
        } catch(e){}
        return ctl;
}

JSKitLib.hasClass = function(element, className) {
	return element.className.match(new RegExp('(\\s|^)' + className + '(\\s|$)'));
}

JSKitLib.addClass = function(element, className) {
	if (!JSKitLib.hasClass(element, className)) {
		element.className += ' ' + className;
	}
}

JSKitLib.removeClass = function(element, className) {
	if (JSKitLib.hasClass(element, className)) {
		var regex = new RegExp('(\\s|^)' + className + '(\\s|$)');
		element.className = element.className.replace(regex, ' ');
	}
}





JSKitLib.removeChildren = function(element) {
	while(element && element.hasChildNodes())
		element.removeChild(element.firstChild);
}

JSKitLib.visible = function(element) {
	return element.style.display != 'none';
}

JSKitLib.show = function(element, style) {
	element.style.display = style || '';
}

JSKitLib.hide = function(element) {
	element.style.display = 'none';
}

JSKitLib.toggle = function(element, style) {
	(element.style.display == 'none') ? JSKitLib.show(element, style) :  JSKitLib.hide(element);
}

JSKitLib.getStyle = function(element) {
	if (typeof element.style.cssText != "undefined") {
		return element.style.cssText;
	} else {
		return element.getAttribute("style");
	}
}

JSKitLib.setStyle = function(element, style) {
	if (typeof element.style.cssText != "undefined") {
		element.style.cssText = style;
	} else {
		element.setAttribute("style", style);
	}
}

JSKitLib.addStyle = function(element, style) {
	var oldStyle = JSKitLib.getStyle(element);
	JSKitLib.setStyle(element, oldStyle + '; ' + style); // IE needs ;
}

JSKitLib.getStyleProperty = function(el, prop) {
	if (typeof el == 'string') {
		el = document.getElementById(el);
	}
	if (el.currentStyle) {
		return el.currentStyle[prop];
	} else if (window.getComputedStyle) {
		return document.defaultView.getComputedStyle(el, null).getPropertyValue(prop);
	} else {
		return el.style[prop];
	}
}

JSKitLib.findPos = function(obj) {
	var origObj = obj;
	var curleft = curtop = curright = curbottom = 0;
	if (obj.offsetParent) {
		curleft = obj.offsetLeft;
		curtop = obj.offsetTop;
		while (obj = obj.offsetParent) {
			curleft += obj.offsetLeft;
			curtop += obj.offsetTop;
		}
	}
	curright = curleft + origObj.offsetWidth;
	curbottom = curtop + origObj.offsetHeight;
	return [curleft,curtop,curright,curbottom];
}

JSKitLib.calcCenterPos = function(elmWidth, elmHeight) {
	var doc = (document.compatMode == "BackCompat") ? document.body : document.documentElement;
	var scroll = JSDL.prototype.getCurScroll();
	return [
		scroll.scroll_left + Math.max(0, Math.round((doc.clientWidth - elmWidth)/2)),
		scroll.scroll_top + Math.max(0, Math.round((doc.clientHeight - elmHeight)/2))
	];
}

JSKitLib.getDocSize = function (){
	var doc_width,doc_height;
	if(typeof window.innerWidth=="number"){
		if(document.documentElement && document.defaultView && typeof document.defaultView.scrollMaxY=="number"){
			doc_height=document.documentElement.offsetHeight-document.defaultView.scrollMaxY;
			doc_width=document.documentElement.offsetWidth;
		} else {
			doc_height=window.innerHeight;
			doc_width=window.innerWidth;
		}
	} else {
		if(document.documentElement && typeof document.documentElement.clientWidth=="number" && document.documentElement.clientWidth){
			doc_height=document.documentElement.clientHeight;
			doc_width=document.documentElement.clientWidth;
		} else {
			if(document.compatMode == "BackCompat"){
				doc_height=document.body.offsetHeight;
				doc_width=document.body.offsetWidth;
			} else {                                
				doc_height=document.body.clientHeight;
				doc_width=document.body.clientWidth;
			}
		}
	}
	return [doc_height,doc_width];
}

JSKitLib.getJSKitBodyElement = function() {
	var be = document.getElementById('js-kit-body-element');
	if (!be) {
		be = document.createElement('div');
		be.id = "js-kit-body-element";
		document.body.appendChild(be);
	}
	return be;
}

JSKitLib.isChildNodeOf = function(parent, child) {
	if (parent === child) 
		return false
	while (child && child !== parent) {
		try {child = child.parentNode;}
		catch(e){child = parent;}
	}
	return child === parent;
}

JSKitLib.replaceChildren = function(where, replacement) {
	JSKitLib.removeChildren(where);
	JSKitLib.addChild(where, replacement);
}

JSKitLib.addChild = function(to, what) {
	if (typeof(to) != 'object')
		return;
	if(arguments.length == 3 && arguments[2])
		to.insertBefore(what, to.firstChild);
	else
		to.appendChild(what);
}

JSKitLib.hasParentNode = function(el) {
	return el && el.parentNode && el.parentNode.nodeType != 11;
}

JSKitLib.setOpacity = function(div, val) {
	if(document.body.filters) {
		if(val == 1) div.style.filter = '';
		else div.style.filter = 'alpha(opacity: ' + Math.round(val * 100) + ')';
	} else {
		div.style.opacity = val;
	}
}





JSKitLib.addPNG = function(node, imageURL) {
	if (JSKitLib.isIE()) {
		var cp = $JSKitGlobal.cachedPngs;
		JSKitLib.fmap(cp, function(img) {
			img.nodes = JSKitLib.filter(function(elm) { return elm != node; }, img.nodes);
		});
		if(cp[imageURL]) {
			if(cp[imageURL].loaded) {
				node.runtimeStyle.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='" + imageURL + "', sizingMethod='crop')"
			} else {
				cp[imageURL].nodes.push(node);
			}
		} else {
			cp[imageURL] = {nodes:[node]};
			var tPng = document.createElement("IMG");
			tPng.style.display = "none";
			tPng.onload = function() {
				cp[imageURL].loaded = true;
				var n = cp[imageURL].nodes;
				for(var i=0; i<n.length; i++) {
					n[i].runtimeStyle.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='" + imageURL + "', sizingMethod='crop')";
				}
				cp[imageURL].nodes = [];
			};
			node.appendChild(tPng);
			tPng.src = imageURL;
		}
	} else {
		node.style.backgroundImage = 'url(' + imageURL + ')';
		node.style.backgroundRepeat = 'no-repeat';        
	}
	return node;
}

JSKitLib.preloadImg = function(imgURL) { 
	if (!JSKitLib.preloadImgList) JSKitLib.preloadImgList = {};
	if (!JSKitLib.preloadImgList[imgURL]) {
		(new Image()).src = imgURL; 
		JSKitLib.preloadImgList[imgURL] = true;
	}
};

JSKitLib.pngBar = function(color, div, fixed) {
	var str;
	var url = "'//cdn.js-kit.com/images/bars/bar-" + color + ".png'";
	if(document.body && document.body.filters) {
		str = "progid:DXImageTransform.Microsoft.AlphaImageLoader(src="
			+ url + ", sizingMethod='"+(fixed?'crop':'scale')+"')";
		if(div) div.runtimeStyle.filter = str;
		return "filter: " + str + ";";
	} else {
		str = "url(" + url + ")";
		if(div) div.style.backgroundImage = str;
		return "background: " + str + ";";
	}
};

JSKitLib.createMiniStarObject = function(rating, scale, specs) {
	var fullStar = specs.full;
	var emptyStar = specs.empty;
	var starWidth = specs.width;
	var starHeight = specs.height;

	var setImage = function(star, imageURL) {
		if(star.imageURL == imageURL)
			return; // Already set and we know it

		star.imageURL = imageURL;
		JSKitLib.addPNG(star, imageURL);
	}

	var obj = document.createElement('div');
	var objWidth = 0;
	var objHeight = starHeight;

	/* Increment by Full Star Ratings */
	for (var i=2; i <= scale; i += 2) {
		var star = document.createElement('div');

		star.style.cssFloat   = 'left';
		star.style.styleFloat = 'left';
		star.style.width    = starWidth + 'px';
		star.style.height   = starHeight + 'px';
		star.style.fontSize = starHeight + 'px'; // ie6

		objWidth += starHeight;

		if (rating >= i) {
			setImage(star, fullStar);
		} else {
			setImage(star, emptyStar);
		}

		obj.appendChild(star);
	}

	JSKitLib.setStyle(obj, "height: " + objHeight + "px; width: " + objWidth + "px; float: left; margin-right: 5px;");

	return obj;
}





JSKitLib.getOuterHTML = function(node) {
	var clone = node.cloneNode(true);
	var parent = document.createElement('div');
	parent.appendChild(clone);
	var ihtml = parent.innerHTML;

    // ff converts sp characters inside of href to hex ascii
	var ihtmlHref = ihtml.match(/href\s*=\s*"[^"]*(%7B|%7D)[^"]*"/g) || [];
	for (var i=0; i< ihtmlHref.length; i++) {
		var a = ihtmlHref[i];
		var b = a.replace(/%7B/g, '{');
		b = b.replace(/%7D/g, '}');
		ihtml = ihtml.replace(a, b);
	}
	return ihtml;
};

JSKitLib.html = function() {
        var div = document.createElement("div");
        for(var text = '', i = 0; i < arguments.length; i++)
                text += arguments[i];
        div.innerHTML = text;
        var ch = div.firstChild;
        div = null;
        return ch;
}

JSKitLib.text = function(text, element, clear) {
	var textNode = document.createTextNode(text);
	if (element) {
		if (clear) JSKitLib.removeChildren(element);
		element.appendChild(textNode);
	}
	return textNode;
}

JSKitLib.attachDescriptors2Elements = function(elements, layoutBlocksPrefix, descriptors, parentStructure) {
	JSKitLib.fmap(elements, function(element, id) {
		var pattern = id.match(layoutBlocksPrefix + "(.*)");
		var name = pattern ? pattern[1] : undefined;
		if (name && typeof(descriptors[name]) == "function") {
			var node = descriptors[name](element, parentStructure);
			if (node) element.appendChild(node);
		}
	});
}

JSKitLib.toDOM = function(template, layoutBlocksPrefix, descriptors) {
	var content = JSKitLib.html(template);
	var elements = JSKitLib.mapClass2Object({}, content);
	var structure = {
		"set" : function(name, element) { elements[layoutBlocksPrefix + name] = element; },
		"get" : function(name, ignorePrefix) { return elements[((ignorePrefix) ? "" : layoutBlocksPrefix) + name]; },
		"content" : content
	};
	JSKitLib.attachDescriptors2Elements(elements, layoutBlocksPrefix, descriptors, structure);
	return structure;
}

JSKitLib.htmlQuote = function (newValue, param) {
	newValue = newValue.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
	param = param || {};
	if(!param.title)
		newValue = newValue.replace(/ /,"&nbsp;");
	if(param.attribute)
		newValue = newValue.replace(/"/g,"&quot;");
	return newValue;
}

JSKitLib.htmlUnquote = function (newValue) {
	return newValue.replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&");
}

JSKitLib.addScript = function(src, content, callback) {
	var sId = "js-kit-script-"+src.replace(/[\/.]/g, '');
	content.jsk$scriptId = sId;
	if(document.getElementById(sId)) {
		if (callback) callback();
		return;
	}
	var s = document.createElement('script');
	s.id = sId;
	s.type ='text/javascript';
	s.charset = 'utf-8';
	s.src = src;
	content.appendChild(s);
	if (callback) {
		s.onload = s.onreadystatechange = function() {
			if (s.readyState && s.readyState != 'loaded' && s.readyState != 'complete') return;
			s.onreadystatechange = s.onload = null;
			callback();
		}
	}
	return s;
}

JSKitLib.stripTags = function(text) {
	var r = /<\/?(a|em|strong|i|b|u|sup|sub|object|param|embed|span|pre|p)(.|\n)*?>/gi;
	text = text.replace(/<object(.|\n)+?<\/object>/gi,"[video]");
	text = text.replace(r,"");
	return (text.length > 150) ? text.slice(0,150) + "..." : text;
}

JSKitLib.createHiddenIframe = function(id, target, cb, clearOnload, src) {
	clearOnload = (typeof clearOnload == 'undefined' ? true : !!clearOnload);
	src = src || 'about:blank';
	target = target || document.body;
	var d = document.createElement('div');
	d.style.height = 0;
	d.innerHTML = '<iframe id="' + id + '" name="' + id + '" src="' + src + '" width="0" height="0" frameborder="0"  style="border: none"></iframe>';
	target.appendChild(d);
	var ifr = d.firstChild;
	if (cb) {
		ifr.onreadystatechange = function(e) {
			if (ifr.readyState && ifr.readyState != 'loaded' && ifr.readyState != 'complete') return;
			if (clearOnload) {
				ifr.onreadystatechange = ifr.onload = null;
			}
			cb();
		};
		if (!JSKitLib.isOpera()) {
			ifr.onload = ifr.onreadystatechange;
		}
	}
	return ifr;
}

JSKitLib.overlapSelectsIE = function(target) {
	var container = document.createElement('div');
	container.innerHTML = '<iframe style="position: absolute; z-index: -1; filter: mask(); border: 0; margin: 0; padding: 0; top: 0; left: 0; width: 9999px; height: 9999px; overflow: hidden;"></iframe>';
	target.appendChild(container.firstChild);
}

JSKitLib.openPopup = function(url, extConfig){
	var target = '_blank';
	var config = { 
		'width' : '960',
		'height' : '800',
		'status' : 'no',
		'menubar' : 'no',
		'toolbar' : 'no',
		'resizable' : 'no',
		'location'  : 'yes',
		'scrollbars' : 'yes',
		'directories': 'no'};

	JSKitLib.fmap(extConfig || [], function(value, key){
		if (key == 'target') target = value; else config[key] = value; 
	});

	var calcScreenDimensions = function(){
		if (JSKitLib.isOpera()) {
			var doc = (document.compatMode == "BackCompat") ? document.body : document.documentElement;
			return {'width': doc.clientWidth,
				'height': doc.clientHeight};
		}
		return {'width': screen.width,
			'height': screen.height};
	};

	var calcCorrections = function() {
		if (JSKitLib.isOpera()) return {'height': 35, 'width': 10, 'top' : 0}; 
		if (JSKitLib.isSafari() && !JSKitLib.isGChrome()) return {'height': 150, 'width': 0, 'top' : 100};
		return {'height': 0, 'width': 0, 'top' : 0};
	};

	var screenDimensions = calcScreenDimensions();
	var corrections = calcCorrections();

	if (config.height > screenDimensions.height - corrections.height) config.height = screenDimensions.height - corrections.height;
	if (config.width > screenDimensions.width - corrections.width) config.width = screenDimensions.width - corrections.width;

	if (!(config.left && config.top) && config.width && config.height) {
		config.left = Math.round((screenDimensions.width - config.width)/2);
		config.top = Math.round((screenDimensions.height - corrections.top - config.height)/2);
	}

	var params = JSKitLib.fmap(config, function(value, key) {return key + "=" + value;}).join(", ");
	return window.open(url, target, params);
}





JSKitLib.map = function(f, arr) {
	if(arr) for(var i = 0; i < arr.length; i++) f(arr[i], i, arr);
	return arr;
}

JSKitLib.filter = function(f, arr) {
	var newArr = [];
	if(arr)
		for(var i = 0; i < arr.length; i++)
			if(f(arr[i], i, arr))
				newArr.push(arr[i]);
	return newArr;
}

JSKitLib.lookup = function(f, arr){
	return JSKitLib.filter(f, arr).shift();
}

JSKitLib.fmap = function(o,f) {
	var r, a = [], l = o.length;
	if(l > 0 || l === 0)
		for(var i = 0; i < l; i++) {
			r = f.call(this,o[i],i,arguments);
			if(r !== undefined) a.push(r);
		}
	else
		for(var i in o)
			if(o.hasOwnProperty(i)) {
				r = f.call(this,o[i],i,arguments);
				if(r !== undefined) a.push(r);
			}
	return a;
}

JSKitLib.foldl = function(acc,o,f) {
	var r, l = o.length;
	if(l > 0 || l === 0)
		for(var i = 0; i < l; i++) {
			r = f.call(this,o[i],acc,i);
			if(r != undefined) acc = r;
		}
	else
		for(var i in o)
			if(o.hasOwnProperty(i)) {
				r = f.call(this,o[i],acc,i);
				if(r != undefined) acc = r;
			}
	return acc;
}

JSKitLib.intersperse = function(f) {
	return JSKitLib.foldl([], this, function(e, acc, i) {
		if(acc.length) acc.push(f);
		acc.push(e);
	});
}

JSKitLib.merge = function() {
	return Array.prototype.concat.apply([], arguments);
}

JSKitLib.cloneObject = function(obj) {
	return JSKitLib.foldl({}, obj, function(value, acc, key) { acc[key] = value; });
}





if (typeof JSKitLib.vars.windowOnLoadFired == 'undefined') {
        JSKitLib.vars.windowOnLoadFired = false;
        JSKitLib.addEventHandler(window, ['load'], function(){ JSKitLib.vars.windowOnLoadFired = true; });
}





var JSKitGlobal = function() {

	this._appAvailable = {};
	this._appObjects = {};  // Specific objects of an application type 
	this._appObjectActions = {}; // app.object.actions
	
	this.cachedPngs = {};

	this._isAppAvailable = function(app) {
		return (this._appAvailable[app]) ? true : false;
	}

	this.isRatingsAppAvailable = function() {
		return this._isAppAvailable('ratings');
	}

	this.isCommentsAppAvailable = function() {
		return this._isAppAvailable('comments');
	}

	this._setAppAvailable = function(app) {
		this._appAvailable[app] = true;
		/* index this app */
		this.indexAppObjects(app);
		/* execute any queued actions */
		this.executeAppObjectActions(app);
	}

	this.setRatingsAppAvailable = function() {
		this._setAppAvailable('ratings');
	}

	this.setCommentsAppAvailable = function() {
		this._setAppAvailable('comments');
	}

	this.indexAppObjects = function(app) {
		if (app == 'ratings') {
			var appArray = $JRA;
		} else if (app == 'comments') {
			var appArray = $JCA;
		} else {
			alert('Attempt to index invalid app type');
			return;
		}
		for (var i=0; i < appArray.length; i++) {
			// Check that it's not standalone
			if (appArray[i].isStandalone()) {
				continue;
			}
			var uniq = appArray[i].uniq;
			if ( ! this._appObjects[uniq] ) {
				this._appObjects[uniq] = {};
			}
			if ( ! this._appObjects[uniq][app]) {
				this._appObjects[uniq][app] = [];
			}
			this._appObjects[uniq][app].push(appArray[i]);
		}
	}

	this.executeAppObjectActions = function(app) {
		if (this._appObjectActions[app]) {
			for (var i=0; i < this._appObjectActions[app].length; i++) {
				var uniq = this._appObjectActions[app][i].uniq;
				if (this._getAppObject(app, uniq)) {
					this._appObjectActions[app][i].action();
				}
			}
		}
	}

	this._getAppObject = function(app, uniq) {
		if (this._appObjects[uniq] && this._appObjects[uniq][app]) {
			return this._appObjects[uniq][app][0];  // Return only the first
		}
		return null;
	}

	this.getCommentsAppObject = function(uniq) {
		return this._getAppObject('comments', uniq);
	}

	/* Returns a Ratings Object */
	this.getRatingsAppObject = function(uniq) {
		return this._getAppObject('ratings', uniq);
	}

	this.copyRatingsAppObject = function(uniq, node) {
		if ( ! this.isRatingsAppAvailable()) {
			return;
		}
		var oldObj = this.getRatingsAppObject(uniq);
		var newObj = oldObj.clone(node, { 'view':'user', 'commentprompt':'no', 'menu':'no'  } );
		return newObj;
	}

	this._tryAppObjectAction = function(app, uniq, action) {
		if (this._isAppAvailable(app)) {
			if (this._getAppObject(app, uniq)) {
				action();
			}
		} else {
			if ( ! this._appObjectActions[app]) {
				this._appObjectActions[app] = [];
			}
			this._appObjectActions[app].push( { 'uniq' : uniq, 'action' : action } );
		}
	}

	this.tryRatingsAppObjectAction = function(uniq, action) {
		this._tryAppObjectAction('ratings', uniq, action);
	}

	this.tryCommentsAppObjectAction = function(uniq, action) {
		this._tryAppObjectAction('comments', uniq, action);
	}
}

/* Singleton-like handler */
JSKitGlobal.getInstance = function() {
	if (!window.JSKitGlobalInstance) {
		JSKitGlobalInstance = new JSKitGlobal();
	}
	return JSKitGlobalInstance;
}





/* JSKitGlobal  object */
$JSKitGlobal = JSKitGlobal.getInstance();





JSKitLib.getRef = function(self) {
	var wl = window.location;
	return wl.protocol + "//" + self.config.domain + wl.pathname;
}

JSKitLib.readConfig = function(wtype, target, cf) {
	cf = cf || {};
	var gtags = JSKitLib.parseConfigTags(document, wtype, 'span');
	var ltags = JSKitLib.parseConfigTags(target, '', 'span');
	var gc = window.JSKitConfig || {};
	for(var i = 3; i < arguments.length; i++) {
		var arg = arguments[i];
		if(typeof(arg) == 'string') arg = [arg];
		var name = arg[0];
		var value = cf[name] || target.getAttribute(name) || ltags[name]
			|| gc[wtype + '-' + name] || gtags[name];
		var wl = window.location;
		switch (name) {
			case 'path': value = JSKitLib._normPath(target, value); break;
			case 'permalink':
				value = value || wl.href.replace(wl.hash,'');
				if (!value.match(/^https?:\/\//))
					value = "http://" + wl.host + value.replace(/^([^\/]+)/, "/$1");
				break;
			case 'title': value = value || document.title; break;
			case 'domain': value = value || wl.host; break;
		}
		if(arg.length > 1) {
			if(typeof(arg[1]) == 'number') {
				if(value) {
					var n = parseInt(value);
					if(isNaN(n) || n < 0) {
						if(value == "no") value = 0;
						else value = arg[1];
					} else value = n;
				} else value = arg[1];
			} else if(typeof(arg[1]) == 'object') {
				for(var j=arg[1].length; j; j--)
					if(arg[1][j-1] == value) break;
				if(!j) value = arg[1][j];
			} else {
				if(!value) value = arg[1];
			}
		}
		cf[name] = value;
	}
	return cf;
}

JSKitLib.parseConfigTags = function(target, wtype, tag) {
	var cache = document._widgets_config;
	if (wtype && cache && cache[wtype])
		return cache[wtype];
	var regp = wtype ? wtype+'?-' : '';
	var nodes = target.getElementsByTagName(tag);
	var config = {};
	for (var i = 0; i < nodes.length; i++) {
		var reg = RegExp("^js-kit-config-"+regp+"(.*)$");
		var m = reg.exec(nodes[i].className);
		if (m && m.length) {
			config[m[1].toLowerCase()] = nodes[i].innerHTML;
			nodes[i].style.display = 'none';
		}
	}
	if (wtype) {
		document._widgets_config = document._widgets_config || {};
		document._widgets_config[wtype] = config;
	}
	return config;
}

JSKitLib._normPath = function(target, path) {
	var wl = window.location;
	var uniq = String(target.getAttribute("uniq") || target.getAttribute("unique") || '');
	/* trim uniq */
	var uniq = uniq.replace(/^\s\s*/, ''), ws = /\s/, i = uniq.length;
	while (ws.test(uniq.charAt(--i)));
	uniq = uniq.slice(0, i + 1);
	/* end of trim */
	var plus = true;
	if (uniq) {
		plus = uniq.match(/^\+\/*(.*)/);
		if (plus) path = plus[1];
		else path = uniq;
	}
	if(path) {
		path = String(path);
		var ar = path.match(/^https?:\/\/[^\/]+(.*)/);
		if(ar) path = ar[1];
		else path = path.replace(/^([^\/]+)/, (plus ? wl.pathname : "") + "/$1");
		path = path.replace(/^\/+/, "/");
	} else { path=wl.pathname; }
	return path;
}

JSKitLib.initWidgets = function(widget_type, request, constructor) {
	var sendRequest = function(domain, multiParams, target) {
		if (!multiParams.length)
			return;
		var wl = window.location;
		request = request || {"extra_params": {}};
		var req = {
			uri: request.base_uri,
			ref: wl.protocol + "//" + domain + wl.pathname,
			epb: window.JSKitEPB ? JSKitEPB.getAsHash() : {},
			request: request.extra_params,
			variableRequest: multiParams,
			transport: 'GET',
			target: target,
			trailer: request.trailer
		};
		new JSRVC(req);
	}

	var els = document.body.getElementsByTagName("div");
	if(!els || !els.length)
		return;

	var multiI = {};
	var multiQ = {};
	var obj;
	var reg = new RegExp('js-kit-' + widget_type + '?');
	for (var i = 0; i < els.length; i++) {
		var m = reg.exec(els[i].className);
		if (!m || !m.length || els[i].jsk$initialized)
			continue;

		obj = constructor(els[i]);
		els[i].jsk$initialized = true;
		if (obj.config.disabled && obj.config.disabled != "no") continue;
		var d = obj.config.domain;

		if (!multiQ[d]) {
			multiQ[d] = [];
			multiI[d] = 0;
		}
		multiQ[d].push(obj.singleRequestParams);
		multiI[d]++;
	}
	JSKitLib.fmap(multiQ, function(v, k){ if (v) sendRequest(k, v, obj.target); });
}





JHI2 = {};
JHI2.create = function(hint, element) {
	element = element || JSKitLib.html("<input type='text'>");
	element.origColor = element.style.color || 'black';
	element.hint = hint;
	element.defaultRemoved = !!element.value;
	if (!element.value) {
		element.style.color = 'gray';
		element.value = element.hint;
	}
	element.onclick = function() {
		if(JSKitLib.isIE()) {
			window.focus();
			element.focus();
		}
		return true;
	}
	element.onblur = function() {
		if (!this.defaultRemoved || JSKitLib.trim(this.value) == '') {
			this.defaultRemoved = false;
			this.style.color = 'gray';
			this.value = this.hint;
		}
	}
	element.onfocus = function() {
		if (!this.defaultRemoved) {
			this.defaultRemoved = true;
			this.style.color = this.origColor;
			this.value = '';
		}
	}
	return element;
}

JHI2.set = function(element, value) {
	if (element.onfocus) element.onfocus();
	element.value = value;
}

JHI2.isEmpty = function(element) {
	return (element.hint && !element.defaultRemoved || !element.hint && !element.value);
}

JHI2.remove = function(element) {
	if (!element || !element.hint) return;
	element.onfocus();
	JSKitLib.fmap(['origColor', 'hint', 'defaultRemoved', 'onclick', 'onblur', 'onfocus'], function(v){ JSKitLib.deleteProperty(element, v); });
}





JSKitFBSDK.prototype.displayState = function(el) {
	var s = this;
	var d = function(id) { return document.getElementById(id+'-'+s.form_id); };
	JSKitLib.fmap(['wait','login','process'],
		function(v) {
			if (d(v)) d(v).style.display = (el==v) ? 'block' : 'none';
		}
	);
}

JSKitFBSDK.prototype.processProfile = function() {
	var s = this;
	s.displayState('process');
	s.fetchUserInfo(['name', 'profile_url', 'pic_big', 'pic_square', 'pic_square_with_logo'], function(data){
		if(!data) {
			s.processLoginStatus();
		} else {
			var session = FB.getSession();
			var params = {
				"profile_data" : JSKitLib.Object2JSON(data),
				"access_token" : session.access_token,
				"expires" : session.expires,
				"api_key" : s.api_key,
				"ref" : s.ref,
				"rnd" : Math.random()
			};
			var url = "http://js-kit.com/api/facebook/process_profile?" +
				JSKitLib.fmap(params, function(value, key) {
					return key + "=" + encodeURIComponent(value);
				}).join("&");
			JSKitLib.addScript(url, s.target);
		}
	});
}

JSKitFBSDK.prototype.fetchUserInfo = function(flds, cb) {
	var s = this;
	var session = FB.getSession();
	if(!session) return(cb(undefined));
	FB.api({
		method: 'Users.getInfo',
		session_key: session.session_key,
		api_key: s.api_key,
		sig: session.sig,
		uids: [session.uid],
		fields: flds,
		v: "1.0"}, function(data){
					cb(data);
				});
}

JSKitFBSDK.prototype.processLogin = function() {
	var slf = this;
	FB.login(function(r){
		if(r.session){
			slf.processLoginStatus();
		} else {
			slf.displayState('login');
		}
	}, {perms:'publish_stream'});
}

JSKitFBSDK.prototype.processLoginStatus = function() {
	var s = this;
	s.displayState('login');
	FB.getLoginStatus(function(response){
		if(response.session){
			s.processProfile();
		} else {
			s.displayState('login');
		}
	}, true);
}

JSKitFBSDK.prototype.createHiddenContainer = function() {
	var div = document.getElementById('fb-root');
	if (div) return div;
	var div = JSKitLib.html('<div id="fb-root" style="position:absolute; top: -10000px; left: -10000px; width: 0px; height: 0px;"></div>');
	document.body.insertBefore(div, document.body.firstChild);
	return div;
}

JSKitFBSDK.prototype.shareComment = function(whiteLabel) {
	var s = this;
	var sd = this.sharedata;
	FB.getLoginStatus(function() {
		var sess = FB.getSession();
		if(sess) {
			s.fetchUserInfo(['name'], function(data) {
				if(data && !data.error_code){
					var al = whiteLabel ? null :
						[{'text': 'Visit JS-Kit', 'href': 'http://js-kit.com/'}];
					FB.api({
						method: 'stream.Publish',
						session_key: sess.session_key,
						api_key: s.api_key,
						sig: sess.sig,
						v: "1.0",
						message: sd.Text,
						attachment: {
							'name': data[0].name + ' participated in a discussion on ' + sd.domain,
							'href': sd.permalink},
						action_links: al
						});
				}
			});
		} else {
			FB.login(function(r){
				if(r.session){
					s.shareComment(whiteLabel);
				}}, {perms:'publish_stream'});
		}
	}, true);
}

JSKitFBSDK.prototype.init = function(cb) {
	var s = this;
	if(!s.api_key || !s.target) return;
	window.jsk$fb_init = true;
	var initFB = function() {
		FB.init({
			appId: s.api_key,
			status: false,
			cookie: true,
			xfbml: true
		});
		if(cb) cb();
	};
	if(!window.FB || !FB.init) {
		JSKitLib.addScript('http://connect.facebook.net/en_US/all.js', s.target, function() { initFB(); });
	} else {
		initFB();
	}
}

JSKitFBSDK.prototype.logout = function() {
	FB.logout();
}

function JSKitFBSDK(ref, api_key, xd_receiver, cb, form_id, sharedata) {
	this.ref = ref;
	this.form_id = form_id;
	this.target = this.createHiddenContainer();
	this.api_key = api_key;
	this.xd_receiver = xd_receiver;
	this.sharedata = sharedata;
	var s = this;
	var f = function() {
		if (cb) cb.apply(s);
	};
	if (window.jsk$fb_init) {
		f();
	} else {
		this.init(f);
	}
}

JSKitFBSDK.prototype.detectXD = function(target) {
	// nothing to do
}





JSKitGFC.prototype.init = function(cb) {
	var s = this;
	if(!s.site || !s.target) return;
	window.jsk$gfc_init = true;
	var initGFC = function() {
		google.friendconnect.container.setParentUrl('/');
		google.friendconnect.container.loadOpenSocialApi({
			site: s.site,
			onload: function(securityToken) {
				window.jsk$gfc_token = securityToken;
				if(cb) cb();
			}
		});
	};
	if(!window.google || !window.opensocial) {
		JSKitLib.addScript('http://www.google.com/friendconnect/script/friendconnect.js?key=notsupplied&v=0.8', s.target, function() { initGFC(); });
	} else {
		initGFC();
	}
}

JSKitGFC.prototype.processProfile = function(profileData) {
	JSKitLib.addScript('//js-kit.com/api/google/process_profile?'
		+'id='+encodeURIComponent(profileData.getId())
		+'&st='+encodeURIComponent(window.jsk$gfc_token)
		+'&rnd='+Math.random(),this.target);
	if(this.onready) this.onready();
}

JSKitGFC.prototype.displayState = function(el) {
	var s = this;
	var d = function(id) { return document.getElementById(id+'-'+s.tgt); };
	JSKitLib.fmap(['wait','login','process'],
		function(v) {
			d(v).style.display = (el==v) ? 'block' : 'none';
		}
	);
}

JSKitGFC.prototype.getViewerData = function(success_cb, fail_cb) {
	var onData = function(data) {
		var vd = data.get("viewer_data");
		if (!vd.hadError() && vd.getData()) {
			if(success_cb) success_cb(vd.getData());
		} else {
			if(fail_cb) fail_cb(vd);
		}
	};
	var req = opensocial.newDataRequest();
	req.add(req.newFetchPersonRequest("VIEWER"), "viewer_data");
	req.send(onData);
}

JSKitGFC.prototype.processLoginStatus = function() {
	var s = this;
	s.getViewerData(function(profileData){
		var processEl = document.getElementById('process-' + s.tgt);
		if(processEl) processEl.innerHTML = $JCL("loggingIn") + profileData.getDisplayName() + '...';
		s.displayState('process');
		s.processProfile(profileData);
	}, function() {
		s.displayState('login');
		google.friendconnect.renderSignInButton({ 'id': 'login-' + s.tgt, 'text' : $JCL("loginWithGFC"), 'style': 'long' });
	});
}

JSKitGFC.prototype.shareComment = function() {
	var s = this;
	s.getViewerData(function(data){
		var sd = s.sharedata;
		var UserName = data.getDisplayName();
		var params = {};
		params[opensocial.Activity.Field.TITLE] = UserName + $JCL("justPostedCommentOn") + ' <a href="' + sd.permalink + '">' + sd.domain + '</a>';
		params[opensocial.Activity.Field.BODY] = ((sd.Text.length > 128) ? sd.Text.substr(0, 128) + '...' : sd.Text) + '<br><br>' + $JCL("poweredBy") + ' <a href="http://js-kit.com/">JS-Kit Echo</a>';
		var activity = opensocial.newActivity(params);
		opensocial.requestCreateActivity(activity, opensocial.CreateActivityPriority.HIGH);
	},function(){
		google.friendconnect.requestSignIn();
	});
}

JSKitGFC.prototype.processLogout = function() {
	google.friendconnect.requestSignOut();
}

function JSKitGFC(ref, tgt, site, cb) {
	this.ref = ref;
	this.tgt = tgt;
	this.site = site;
	var s = this;
	s.target = document.getElementById(s.tgt);
	var f = function() { cb.apply(s); };
	if(window.jsk$gfc_init) {
		f();
	} else {
		this.init(f);
	}
}





if(!window.JSKitAuthInstance) var JSKitAuthInstance = null;

$JALT = {
	//Authentication methods labels:
	identityLabel_short_epb: "EPB",
	identityLabel_short_gfc: "Google Friend Connect",
	identityLabel_short_home: "My Site",
	identityLabel_short_jskit: "JS-Kit",
	identityLabel_short_yahoo: "Yahoo!",
	identityLabel_short_openid: "Openid",
	identityLabel_short_twitter: "Twitter",
	identityLabel_short_haloscan: "Haloscan",
	identityLabel_short_blogspot: "Blogger",
	identityLabel_short_facebook: "Facebook",
	identityLabel_short_friendfeed: "FriendFeed",

	identityLabel_full_epb: "My EPB Account",
	identityLabel_full_gfc: "My Google Profile",
	identityLabel_full_jskit: "My JS-Kit Account",
	identityLabel_full_yahoo: "My Yahoo! Account",
	identityLabel_full_openid: "My OpenID",
	identityLabel_full_twitter: "My Twitter Account",
	identityLabel_full_haloscan: "My Haloscan Account",
	identityLabel_full_blogspot: "My Blogger Account",
	identityLabel_full_facebook: "My Facebook Profile",
	identityLabel_full_register: "New JS-Kit Account",
	identityLabel_full_friendfeed: "My FriendFeed Account",

	//Error messages:
	error: 'Error',
	no_email: 'Email not found for this account',
	long_login: 'Login is too long (should be not more 63 characters)',
	empty_login: 'Enter your login',
	empty_email: 'Enter your e-mail',
	short_login: 'Login is too short (should be at least 6 characters)',
	cookies_are_disabled: 'Unfortunately authentication is not available for you because the cookies are disabled in your browser. Please enable cookies and retry',
	empty_openid: 'Enter your OpenID URL',
	empty_blogspot: 'Enter your Blogspot URL',
	empty_password: 'Enter your password',
	empty_password2: 'Enter your password',
	incorrect_login: 'Login must begin with a letter and contain 6 or more characters, including numbers, a dash and a dot.',
	incorrect_email: 'Your email is incorrect, please check it',
	full_description: 'JS-Kit login need to start with a letter and may also contain numbers, a dash and a dot. Login and password must have a minimum of 6 characters. Example of a good login name: Joe.Bloggs',
	nonexisting_login: 'Login does not exist ',
	password_is_short: 'Password is too short (should be at least 6 characters)',
	user_already_logged: 'You are already signed in with this login',
	incorrect_recovery_key: 'Incorrect recovery key',
	login_is_already_used: 'Login name is already taken by someone else',
	incorrect_blogspot_url: 'Your Blogspot URL doesn\'t seem to be valid',
	incorrect_login_or_password: 'Login or password is incorrect',
	user_already_has_other_login: 'You are logged in already',
	password2_mismatch: 'Passwords do not match',
	//Common labels
	authentication: 'Authentication',
	passwordRecovery_jskit: 'JS-Kit Password Recovery',
	passwordRecovery_haloscan: 'Haloscan Password Recovery',
	enterYourLoginNote: 'Enter your login you registered with below and click "Send Password". Then check your email (Inbox or SPAM folder).',
	forgotYourPassword: 'forgot your password?',
	registerNewAccount: 'register a new account?',
	sendPassword: 'Send Password',
	authCode: 'Auth Code',
	jskaLogout: 'Logout',
	submit: 'Submit',
	back: 'Back',
	login: 'Login',
	username: 'Username',
	loginWith: 'Login with:',
	loginBtn: 'Login',
	register: 'Register',
	openID: 'OpenID:',
	password: 'Password:',
	retypePassword: 'Re-type Password:',
	loginWith: 'Login with:',
	cancel: 'Cancel',
	loading: 'Loading ...',
	allFieldsAreMandatory: 'All fields are mandatory',
	yourEmail: 'Your Email',
	blogspotUrl: 'Blogspot URL:',
	//EPB
	epb_LoginOrRegisterInHostSiteText: 'Please login or register on this site'
}
$JAL = window.JSKA_Translate || function(t) { return (window.JSKitLabels && window.JSKitLabels[t]) || $JALT[t] || t; }

JSKAuth.prototype.getIdentityLabel = function(type, isfull){
	return $JAL("identityLabel_" + (isfull ? "full_" : "short_") + type);
} 

JSKAuth.prototype.setAuthInstance = function() {
	if (window.JSKitAuthInstance) {
		var authForm = JSKitAuthInstance.authForm;
		if(authForm && authForm.parentNode)
			JSKitLib.hide(authForm);
	}
	JSKitAuthInstance = this;
}

JSKAuth.prototype.show = function(areaName, data) {
	areaName = areaName || this.defaultActiveArea;
	this.setAuthInstance();
	this.showBackdrop();
	var authForm = this.authForm;
	if (this.mode == "popup") {
		var pos = JSKitLib.calcCenterPos(300, 200);
		authForm.style.top = parseInt(pos[1]) + "px";
		authForm.style.left = parseInt(pos[0]) + "px";
	}
	JSKitLib.show(authForm);
	this.authSelector.value = areaName;
	this.setActiveArea(areaName, data);
}

JSKAuth.prototype.loadCss = function() {
        JSKitLib.addCss(
		".jska-backdrop { opacity: 0; background-color: #404040; z-Index: 14500; " +
			(JSKitLib.isPreIE8()
			? "filter:progid:DXImageTransform.Microsoft.Alpha(opacity='0'); position: absolute; top: expression(eval(-(document.body.offsetTop + (document.body.offsetHeight - document.body.clientHeight)/2))); left: expression(eval(-(document.body.offsetLeft + (document.body.offsetWidth - document.body.clientWidth)/2))); height: expression(eval(Math.max(document.body.offsetHeight, document.documentElement.scrollHeight))); width: expression(eval(Math.max(document.body.offsetWidth, document.documentElement.scrollWidth)));"
			: "position: fixed; left: 0; top: 0; height: 100%; width: 100%; -webkit-transition: opacity 0.5s ease-out;" ) + 
		"}" +
		".jska-wrapper { " + (this.mode != "embedded" ? "position: absolute;" : "") + "background-color: white; z-index: 20000; border: solid 4px #cbcbcb; text-align: left; width: 350px; font-weight: normal; }" +
		".jska-facebookFrame { height: 27px; width: 194px; background-color: transparent; border: none; z-Index: 14000; }" +
		".jska-yahoo { margin-left: auto; margin-right: auto; width:161px; height:22px; cursor:pointer; }" +
		".jska-twitter { margin-left: auto; margin-right: auto; width:176px; height:28px; cursor:pointer; }" +
		".jska-friendfeed { margin-left: auto; margin-right: auto; width:216px; height:28px; cursor:pointer; }" +
		".jska-selector { margin-left: 5px;}" +
		".jska-header { background-color: #ececec; padding: 8px 0 6px 10px; }" +
		".jska-headerText { font-family: Verdana, Helvetica; font-weight: bold; font-size: 12pt; color: grey; float: left; }" +
		".jska-infoText { margin: 0; padding: 0;}" +
		".jska-infoContainer { margin: 0 10px;}" +
		".jska-showMore { color: #403030; font-family: Arial, Helvetica, sans-serif; }" +
		".jska-selectorContainer { background-color: #ececec; padding: 0 0 4px 10px;}" +
		".jska-container { border-top: solid 1px #cbcbcb; padding-top: 20px;}" +
		".jska-controls { background-color: #ececec; width: 100%; padding: 5px 0 5px 0; margin-top: 20px;}" +
		".jska-rightColumn { float: right; width: 65%; margin-bottom: 2px;}" +
		".jska-leftColumn { float: right; width: 33%; padding: 2px 5px 0 0; text-align: right;}" +
		".jska-label { font-size: 9pt; font-family: Arial; color: #000000 !important; }" +
		".jska-input { border: solid 1px #7f99b9; width: 80%;}" +
		".jska-openidInput { background: url(//cdn.js-kit.com/images/openid-16x16.png) no-repeat; background-position: 0 50%; padding-left: 18px;}" +
		".jska-blogspotInput { background: url(//cdn.js-kit.com/images/blogger-16x16.png) no-repeat; background-position: 0 50%; padding-left: 18px;}" +
		".jska-errorText { color: #FF3030; font: 11px Arial; margin-bottom: 2px; }" +
		".jska-error { color: #FF3030; font: 11px Arial; display: none; }" +
		".jska-cancelBtn { float: right; margin-right: 5px; cursor: pointer;}" +
		".jska-text { color: #404040; font: 11px Arial; }" +
		".jska-back { font: 15px Helvetica; cursor: pointer; margin-left: 10px; float: left;}" +
		".jska-logout { float: left; margin-left: 10px; cursor: pointer;}" +
		".jska-passwordRecoveryText { margin: 0px 0px 5px 10px; }" +
		".jska-links, a.jska-links:hover, a.jska-links:visited { color: #001faa; cursor: pointer; }" +
		".jska-progressArea { display: none; }" +
		".jska-progressPic { display: inline; float: left; margin-right: 0.2em; margin-left: 1em; margin-top: 0.3em; width: 16px; height: 16px; background: no-repeat url(//cdn.js-kit.com/images/loading.gif); }" +
		".jska-progressLbl { display: inline; margin-left: 0.3em; margin-top: 0.5em; float: left; }" +
		".jska-authButton {float: right; margin-right: 7px; cursor: pointer;}" +
		".jska-clear { clear: both;}", "jska");
}

JSKAuth.prototype.cancelRequests = function(){
	var self = this;
	JSKitLib.fmap(this.identities.auth, function(identity){
		if(identity.group != "third_party") return;
		if(self.areas && self.areas[identity.type] && self.areas[identity.type].rpickup) {
			try{ self.areas[identity.type].rpickup.cancelRequest(); } 
			catch(e){};
		}
	 });
}

JSKAuth.prototype.hide = function() {
	this.hideBackdrop();
	this.cancelRequests();
	JSKitLib.hide(this.authForm);
}

JSKAuth.prototype.destroy = function() {
	this.hide();
	var prn = this.authForm.parentNode;
	if (prn) prn.removeChild(this.authForm);
}

JSKAuth.prototype.prepareAuthForm = function() {
	var self = this;
	var div = self.authForm;
	JSKitLib.hide(div);
	if (self.mode == "popup"){
		document.body.insertBefore(div, document.body.firstChild);
	} else {
		self.target.appendChild(div);
	}
}

JSKAuth.prototype.showBackdrop = function() {
	if (this.withBackdrop && this.mode == "popup") {
		if(!window.backdrop) {
			window.backdrop = document.createElement('DIV');
			backdrop.className = 'jska-backdrop';
			document.body.insertBefore(backdrop, document.body.firstChild);
		}
		JSKitLib.show(backdrop);
		JSKitLib.setOpacity(backdrop, 0.5);
	}
}

JSKAuth.prototype.hideBackdrop = function() {
	if (this.withBackdrop && window.backdrop){
		JSKitLib.setOpacity(backdrop, 0);
		JSKitLib.hide(backdrop);
	}
}

JSKAuth.prototype.assemble = function() {
	var self = this;
	var authForm = self.toDom(self.authFormTmpl);
	var authFormElements = JSKitLib.mapClass2Object({}, authForm);
	authForm.dragElements = [authFormElements["jska-header"]];

	self.areaContainer = authFormElements["jska-container"];
	self.selectorContainer = authFormElements["jska-selectorContainer"];

	self.authSelector = self.createAuthSelector(self.defaultActiveArea, function(ev){ self.setActiveArea(this.value); });
	authFormElements["jska-selectorContainer"].appendChild(self.authSelector);

	return authForm;
}

JSKAuth.prototype.createRVCPickupRequest = function(provider, target, area) {
	var self = this;
	var params = {
		'session_nonce': ((new Date()).valueOf() + Math.random()).toString()
	};

	return new JSRVC({
		'uri': self.uriDomain + '/api/server-answer.js',
		'ref': self.ref,
		'request': params,
		'target': target,
		'pickup': true,
		'epb': window.JSKitEPB ? JSKitEPB.getAsHash() : {},
		'onreturn': function (error) 
		{
			if (error == "attempts_number_exceeded") 
			{
				if (provider == "jskit" || provider == "haloscan" || provider == "register")
				{
					try 
					{
						if (window['JSKitAuthInstance']) window['JSKitAuthInstance'].serverCallback(provider, 'cookies_are_disabled');
					} catch(e){}
				}else
				{
					var areaElements = JSKitLib.mapClass2Object({}, area);
					areaElements["js-errorMessageHandle"].innerHTML = $JAL('cookies_are_disabled');
                        		areaElements["js-errorMessageHandle"].style.display = 'block';
				}
			}
		},
		'requestId': provider + '_connect'});
}

JSKAuth.prototype.setActiveArea = function(name, data){
	var self = this;
	self.cancelRequests();
	self.currentArea = name;
	if (name.match(/passwordRecovery/)) JSKitLib.hide(self.selectorContainer); else JSKitLib.show(self.selectorContainer);
	JSKitLib.removeChildren(self.areaContainer);
	self.areas[name] = self.createArea(name, data);
	self.areaContainer.appendChild(self.areas[name]);
	if (self.HNDL && self.HNDL[name] && self.HNDL[name]["input"] && self.HNDL[name]["input"].login){
		self.HNDL[name]["input"].login.blur();	
		self.HNDL[name]["input"].login.focus();
	}

	if (name == "yahoo"){ self.areas["yahoo"].rpickup = self.createRVCPickupRequest("yahoo", self.target, self.areas["yahoo"]); }
	if (name == "gfc"){
		var gfc_cb = function() {
			self.areas["gfc"].rpickup = self.createRVCPickupRequest("gfc", self.target, self.areas["gfc"]);
		};
		var gfc = self.getAuthIdentity("gfc");
		if(gfc && gfc.params.site) {
			var jsk$gfc = new JSKitGFC(
				self.ref,
				self.areas["gfc"].id,
				gfc.params.site,
				function(){
					this.onready = gfc_cb();
					this.processLoginStatus();
				});
		} else {
			gfc_cb();
		}
	}
	if (name == "twitter"){ self.areas["twitter"].rpickup = self.createRVCPickupRequest("twitter", self.target, self.areas["twitter"]); }
	if (name == "friendfeed"){ self.areas["friendfeed"].rpickup = self.createRVCPickupRequest("friendfeed", self.target, self.areas["friendfeed"]); }
	if (name == "facebook" && self.getAuthIdentity("facebook")) {
		var facebook = self.getAuthIdentity("facebook");
		var jsk$fb = new JSKitFBSDK(
			self.ref,
			facebook.params.app_id,
			facebook.params.xd_receiver,
			function() {
				this.processLoginStatus();
				self.areas["facebook"].rpickup = self.createRVCPickupRequest("facebook", self.target, self.areas["facebook"]);
			},
			self.areas["facebook"].id
		);

		var logel = document.getElementById('login-' + self.areas["facebook"].id);
		logel.onclick = function() { jsk$fb.processLogin(); };
	}
}

JSKAuth.prototype.getErrorTarget = function(errCode) {
	if (errCode.match(/no_email/)) return "login";
	if (errCode.match(/email/)) return "email";
	if (errCode.match(/password2/)) return "password2";
	if (errCode.match(/password/)) return "password";
	return "login";
}

JSKAuth.prototype.processControls = function(name, type, func){
	JSKitLib.fmap(this.HNDL[name][type], func);	
}

JSKAuth.prototype.addKeyHandler = function(name) {
	var self = this;
	var button = self.HNDL[name]["button"].button;
	this.processControls(name, "input", function(element){ if (element) {
		if(JSKitLib.isIE() || JSKitLib.isOpera()) element.onkeydown = function(ev) { return self.keyHandler(ev, button);}
		else element.onkeypress = function(ev) { return self.keyHandler(ev, button);}
	}});	
}

JSKAuth.prototype.hideMessages = function(name) {
	this.processControls(name, "message", function(element){ if (element) JSKitLib.hide(element); });
}

JSKAuth.prototype.disableControls = function(name, value) {
	JSKitLib.fmap.call(this, ["input", "button"], function(type){ this.processControls(name, type, function(element){ if (element) element.disabled = value; })});
}

JSKAuth.prototype.clearInputFields = function(name) {
	this.processControls(name, "input", function(element){ if (element) { element.value = ""; if (typeof(element.onblur) == "function") element.onblur(); } });
}

JSKAuth.prototype.toDom = function(template) {
	return JSKitLib.html(template.replace(/{Label:([^:}]+[^}]*)}/g, function(a,m) {
		return $JAL(m);
	}));
}

JSKAuth.prototype.autoComplete = (JSKitLib.getBrowser() == 'gecko' ? ' autocomplete="Off"' : '');

JSKAuth.prototype.keyHandler = function(e, button){
	e = e || window.event;
	switch(e.keyCode) {
		case 10: case 13:
			JSKitLib.preventDefaultEvent(e);
			button.click();
		break;
	}
}

JSKAuth.prototype.getIdentityParam = function(name, identity, defaultValue) {
	return (identity.type == 'epb' && identity.params[name]) ? 
		identity.params[name] :
		defaultValue;
}


JSKAuth.prototype.authFormTmpl =
'<div class="jska-wrapper">' +
	'<div class="jska-header">' +
		'<div class="jska-headerText">{Label:authentication}</div>' +
		'<div class="jska-clear"></div>' +
	'</div>' +
	'<div class="jska-selectorContainer jska-label">{Label:loginWith}</div>' +
	'<div class="jska-container"></div>' +
'</div>';

JSKAuth.prototype.progressAreaTmpl =
'<div class="jska-progressArea js-progressHandle">' +
	'<div class="jska-progressPic"></div>' +
	'<div class="jska-progressLbl jska-label">{Label:loading}</div>' +
	'<div class="jska-clear"></div>' +
'</div>';

JSKAuth.prototype.loginSectionTmpl = function(identity_type) {
	return '<div>' + JSKAuth.prototype.progressAreaTmpl +
	'<div class="jska-rightColumn">' +
		'<input class="jska-input" name="loginInput"' + JSKAuth.prototype.autoComplete +'>' +
		'<div class="jska-error js-loginMessageHandle"></div>' +
	'</div>' +
	'<div class="jska-leftColumn jska-label">{Label:username}:</div>' +
	'<div class="jska-rightColumn">' +
		'<input class="jska-input" name="passwordInput" type="password">' +
		'<div class="jska-error js-passwordMessageHandle"></div>' +
		'<div><a class="jska-forgotPassword jska-links jska-text">{Label:forgotYourPassword}</a></div>' +
	'</div>' +
	'<div class="jska-leftColumn jska-label">{Label:password}</div>' +
	'<div class="jska-clear"></div>' +
	'<div class="jska-controls">' +
		'<input name="provider" value="jskit" type="hidden">' +
		'<input value="{Label:jskaLogout}" class="jska-logout" type="button">' +
		'<input value="{Label:loginBtn}" name="authButton" class="jska-authButton" type="button">' +
		'<input value="{Label:cancel}" name=cancelBtn type="button" class="jska-cancelBtn">' +
		'<div class="jska-clear"></div>' +
	'</div>' +
	'<div class="jska-clear"></div>' +
	'</div>';
}

JSKAuth.prototype.jskitSectionTmpl = JSKAuth.prototype.loginSectionTmpl('jskit');
JSKAuth.prototype.haloscanSectionTmpl = JSKAuth.prototype.loginSectionTmpl('haloscan');

JSKAuth.prototype.openidSectionTmpl =
'<div>' + JSKAuth.prototype.progressAreaTmpl +
	'<div class="jska-rightColumn">' +
		'<input class="jska-input jska-openidInput" name="loginInput"' + JSKAuth.prototype.autoComplete + '>' +
		'<div class="jska-error js-loginMessageHandle"></div>' +
	'</div>' +
	'<div class="jska-leftColumn jska-label">{Label:openID}</div>' +
	'<div class="jska-clear"></div>' +
	'<div class="jska-controls">' +
		'<input value="{Label:jskaLogout}" class="jska-logout" type="button">' +
		'<input value="{Label:loginBtn}" name="authButton" class="jska-authButton" type="button">' +
		'<input value="{Label:cancel}" name=cancelBtn type="button" class="jska-cancelBtn">' +
		'<div class="jska-clear"></div>' +
	'</div>' +
	'<div class="jska-clear"></div>' +
'</div>';

JSKAuth.prototype.blogspotSectionTmpl =
'<div>' + JSKAuth.prototype.progressAreaTmpl +
	'<div class="jska-rightColumn">' +
		'<input class="jska-input jska-blogspotInput" name="loginInput"' + JSKAuth.prototype.autoComplete + '>' +
		'<div class="jska-error js-loginMessageHandle"></div>' +
	'</div>' +
	'<div class="jska-leftColumn jska-label">{Label:blogspotUrl}</div>' +
	'<div class="jska-clear"></div>' +
	'<div class="jska-controls">' +
		'<input value="{Label:jskaLogout}" class="jska-logout" type="button">' +
		'<input value="{Label:loginBtn}" name="authButton" class="jska-authButton" type="button">' +
		'<input value="{Label:cancel}" name=cancelBtn type="button" class="jska-cancelBtn">' +
		'<div class="jska-clear"></div>' +
	'</div>' +
	'<div class="jska-clear"></div>' +
'</div>';

JSKAuth.prototype.yahooSectionTmpl =
'<div style="text-align: center">' +
'<div class="jska-progressArea js-progressHandle"></div>' +
'<div class="jska-error js-errorMessageHandle"></div>' +
'<div class="jska-yahoo"></div>' +
	'<div class="jska-controls">' +
		'<input value="{Label:jskaLogout}" class="jska-logout" type="button">' +
		'<input value="{Label:cancel}" name=cancelBtn type="button" class="jska-cancelBtn">' +
		'<div class="jska-clear"></div>' +
	'</div>' +
'</div>';

JSKAuth.prototype.twitterSectionTmpl =
'<div style="text-align: center">' +
'<div class="jska-progressArea js-progressHandle"></div>' +
'<div class="jska-error js-errorMessageHandle"></div>' +
'<div class="jska-twitter"></div>' +
	'<div class="jska-controls">' +
		'<input value="{Label:jskaLogout}" class="jska-logout" type="button">' +
		'<input value="{Label:cancel}" name=cancelBtn type="button" class="jska-cancelBtn">' +
		'<div class="jska-clear"></div>' +
	'</div>' +
'</div>';

JSKAuth.prototype.friendfeedSectionTmpl =
'<div style="text-align: center">' +
'<div class="jska-progressArea js-progressHandle"></div>' +
'<div class="jska-error js-errorMessageHandle"></div>' +
'<div class="jska-friendfeed"></div>' +
	'<div class="jska-controls">' +
		'<input value="{Label:jskaLogout}" class="jska-logout" type="button">' +
		'<input value="{Label:cancel}" name=cancelBtn type="button" class="jska-cancelBtn">' +
		'<div class="jska-clear"></div>' +
	'</div>' +
'</div>';

JSKAuth.prototype.epbSectionTmpl = function() {
	var epb = this.identities.auth.epb;
	var auth_prompt = JSKAuth.prototype.getIdentityParam('auth_prompt', epb, '{Label:epb_LoginOrRegisterInHostSiteText}');
	var template = 
'<div style="text-align: center">' +
	'<p class="jska-text">' + auth_prompt + '</p>' +
	'<div class="jska-controls">' +
		'<input value="{Label:cancel}" name=cancelBtn type="button" class="jska-cancelBtn">' +
		'<div class="jska-clear"></div>' +
	'</div>' +
'</div>';
	return template;
}

JSKAuth.prototype.facebookSectionTmpl = function() {
	var tgt = "facebook-" + Math.random();
	return ('<div id="' + tgt + '" style="text-align: center;">' +
'<div class="jska-progressArea js-progressHandle"></div>' +
'<div class="jska-error js-errorMessageHandle"></div>' +
'<div name=' + tgt + '" style="width: 200px; height: 27px; margin: auto; "><div id="wait-' + tgt + '">' + $JCL("askingFacebook") + '</div><div id="login-' + tgt + '" style="display: none; width: 200px; height: 27px; ' + (JSKitLib.isIE() ? 'filter:progid:DXImageTransform.Microsoft.AlphaImageLoader(src=\'//cdn.js-kit.com/images/facebook/connect_white_large_long.gif\', sizingMethod=\'crop\');' : 'background: no-repeat url(//cdn.js-kit.com/images/facebook/connect_white_large_long.gif);') + ' cursor:pointer;"></div><div id="process-' + tgt + '" style="display: none;">' + $JCL("loggingIn") + '<fb:name uid="loggedinuser" linked="false" capitalize="true" useyou="false"></fb:name>...</div></div>' +
	'<div class="jska-controls">' +
		'<input value="{Label:jskaLogout}" class="jska-logout" type="button">' +
		'<input value="{Label:cancel}" name=cancelBtn type="button" class="jska-cancelBtn">' +
		'<div class="jska-clear"></div>' +
	'</div>' +
'</div>');
}

JSKAuth.prototype.gfcSectionTmpl = function() {
	var gfc = this.identities.auth.gfc;
	var tgt = "gfc-" + Math.random();
return '<div id="' + tgt + '" style="text-align: center">' +
'<div class="jska-progressArea js-progressHandle"></div>' +
'<div class="jska-error js-errorMessageHandle"></div>' +
(gfc && gfc.params.site ? '<div name="' + tgt + '"><div id="wait-' + tgt + '">' + $JCL("askingGoogle") + '</div><div id="login-' + tgt + '" style="display: none;"></div><div id="process-' + tgt + '" style="display: none;"></div></div>' :
'<div style="width: 270px; height: 30px; margin: auto; overflow: hidden; "><iframe src="//js-kit.com/api/google/connect-button" height="50px" width="300px" allowtransparency="true" style="background-color: transparent; border: none; z-Index: 14000;" frameborder="0" scrolling="no"></iframe></div>')+
	'<div class="jska-controls">' +
		'<input value="{Label:jskaLogout}" class="jska-logout" type="button">' +
		'<input value="{Label:cancel}" name=cancelBtn type="button" class="jska-cancelBtn">' +
		'<div class="jska-clear"></div>' +
	'</div>' +
'</div>';
}

JSKAuth.prototype.registerSectionTmpl =
'<div>' + JSKAuth.prototype.progressAreaTmpl +
	'<p class="jska-infoText jska-errorText" style="text-align: center;">{Label:allFieldsAreMandatory}</p>' +
	'<div class="jska-rightColumn">' +
		'<input class="jska-input" name="loginInput"' + JSKAuth.prototype.autoComplete +'>' +
		'<div class="jska-error js-loginMessageHandle"></div>' +
	'</div>' +
	'<div class="jska-leftColumn jska-label">{Label:username}:</div>' +
	'<div class="jska-rightColumn">' +
		'<input class="jska-input" name="emailInput"' + JSKAuth.prototype.autoComplete +'>' +
		'<div class="jska-error js-emailMessageHandle"></div>' +
	'</div>' +
	'<div class="jska-leftColumn jska-label">{Label:yourEmail}:</div>' +
	'<div class="jska-rightColumn">' +
		'<input class="jska-input" name="passwordInput" type="password">' +
		'<div class="jska-error js-passwordMessageHandle"></div>' +
	'</div>' +
	'<div class="jska-leftColumn jska-label">{Label:password}</div>' +
	'<div class="jska-rightColumn">' +
		'<input class="jska-input" name="password2Input" type="password">' +
		'<div class="jska-error js-password2MessageHandle"></div>' +
	'</div>' +
	'<div class="jska-leftColumn jska-label">{Label:retypePassword}</div>' +
	'<div class="jska-clear"></div>' +
	'<div class="jska-controls">' +
		'<input value="{Label:jskaLogout}" class="jska-logout" type="button">' +
		'<input value="{Label:register}" name="authButton" class="jska-authButton" type="button">' +
		'<input value="{Label:cancel}" name=cancelBtn type="button" class="jska-cancelBtn">' +
		'<div class="jska-clear"></div>' +
	'</div>' +
	 '<div class="jska-clear"></div>' +
'</div>';

JSKAuth.prototype.passwordRecoveryRequestSectionTmpl = function(params) {
	return '<div>' +
	'<p class="jska-text jska-passwordRecoveryText"><b>{Label:passwordRecovery_'+params.provider+'}</b></p>' +
	JSKAuth.prototype.progressAreaTmpl +
	'<p class="jska-text jska-passwordRecoveryText">{Label:enterYourLoginNote}</p>' +
	'<div class="jska-rightColumn">' +
		'<input class="jska-input" name="loginInput"' + JSKAuth.prototype.autoComplete +'>' +
		'<div class="jska-error js-loginMessageHandle"></div>' +
	'</div>' +
	'<div class="jska-leftColumn jska-label">{Label:username}:</div>' +
	'<div class="jska-clear"></div>' +
	'<div class="jska-controls">' +
		'<span class="jska-back">{Label:back}</span>' +
		'<input name="provider" value="jskit" type="hidden">' +
		'<input value="{Label:sendPassword}" name="authButton" class="jska-authButton" type="button">' +
		'<input value="{Label:cancel}" name=cancelBtn type="button" class="jska-cancelBtn">' +
		'<div class="jska-clear"></div>' +
	'</div>' +
	'<div class="jska-clear"></div>' +
	'</div>';
}

JSKAuth.prototype.passwordRecoverySetPasswordSectionTmpl = function(params) {
	return '<div>' +
	'<p class="jska-text jska-passwordRecoveryText"><b>{Label:passwordRecovery_'+params.provider+'}</b></p>' +
	JSKAuth.prototype.progressAreaTmpl +
	'<p class="jska-text jska-passwordRecoveryText">Please enter the new password</p>' +
	'<div class="jska-rightColumn">' +
		'<input class="jska-input" name="loginInput"' + JSKAuth.prototype.autoComplete +'>' +
		'<div class="jska-error js-loginMessageHandle"></div>' +
	'</div>' +
	'<div class="jska-leftColumn jska-label">{Label:username}:</div>' +
	'<div class="jska-rightColumn">' +
		'<input class="jska-input" name="authCodeInput"' + JSKAuth.prototype.autoComplete +'>' +
		'<div class="jska-error js-authCodeMessageHandle"></div>' +
	'</div>' +
	'<div class="jska-leftColumn jska-label">{Label:authCode}:</div>' +
	'<div class="jska-rightColumn">' +
		'<input class="jska-input" name="passwordInput" type="password">' +
		'<div class="jska-error js-passwordMessageHandle"></div>' +
	'</div>' +
	'<div class="jska-leftColumn jska-label">{Label:password}</div>' +
	'<div class="jska-rightColumn">' +
		'<input class="jska-input" name="password2Input" type="password">' +
		'<div class="jska-error js-password2MessageHandle"></div>' +
	'</div>' +
	'<div class="jska-leftColumn jska-label">{Label:retypePassword}</div>' +
	'<div class="jska-clear"></div>' +
	'<div class="jska-controls">' +
		'<span class="jska-back">{Label:back}</span>' +
		'<input name="provider" value="jskit" type="hidden">' +
		'<input value="{Label:submit}" name="authButton" class="jska-authButton" type="button">' +
		'<input value="{Label:cancel}" name=cancelBtn type="button" class="jska-cancelBtn">' +
		'<div class="jska-clear"></div>' +
	'</div>' +
	'<div class="jska-clear"></div>' +
	'</div>';
}

JSKAuth.prototype.passwordRecoverySuccessSectionTmpl = function(params) {
	return '<div>' +
	'<div class="jska-passwordRecoveryText">' +
		'<p class="jska-text"><b>{Label:passwordRecovery_'+params.provider+'}</b></p>' +
		'<p class="jska-text">New password was set successfully. </p>' +
		'<a class="jska-linkToLogin jska-links jska-text">Click here to log in</a>' +
	'</div>' +
	'<div class="jska-controls">' +
		'<span class="jska-back">{Label:back}</span>' +
		'<input value="{Label:cancel}" name=cancelBtn type="button" class="jska-cancelBtn">' +
		'<div class="jska-clear"></div>' +
	'</div>' +
	'</div>';
}

JSKAuth.prototype.processMessage = function(name, errCode, data) {
	if(errCode=='success') {
		this.disableControls(name, false);
		this.clearInputFields(name);
		switch (name) {
			case "passwordRecoveryRequest" : this.show("passwordRecoverySetPassword", this.passwordRecoveryData);break;
			case "passwordRecoverySetPassword" : this.show("passwordRecoverySuccess", this.passwordRecoveryData); break;
			default : if (window.JSKW$Events) JSKW$Events.syncBroadcast('JSKitAuth_success_login', data); if (this.mode != "embedded") this.hide();	
		}
	} else {
		this.showErrorMessage(name, errCode);
	}
}

JSKAuth.prototype.showErrorMessage = function(name, errCode){
	JSKitLib.hide(this.HNDL[name].progress);
	this.disableControls(name, false);
	var errorTarget = this.getErrorTarget(errCode);
	if(errorTarget) {
		var inputHandle = this.HNDL[name]["input"][errorTarget];
		var errorMessageHandle = this.HNDL[name]["message"][errorTarget + "Msg"];
		if (inputHandle) {inputHandle.blur(); inputHandle.focus();}
		if (errorMessageHandle) {
			errorMessageHandle.innerHTML = $JAL(errCode);
			if (name == "register" && errorTarget != "email") errorMessageHandle.appendChild(this.buildShowMore());
			errorMessageHandle.style.display = 'block';
		}
	}
}

JSKAuth.prototype.serverCallback = function(type, errCode, data) {
	if (this.HNDL && this.HNDL[type]) JSKitLib.hide(this.HNDL[type].progress)
	if (type == "register" && data && data.yours) data.yours.newUser = true;
	this.processMessage(type, errCode, data);
}

JSKAuth.prototype.logout = function() {
	var self = this;
	setTimeout(function(){
		new JSRVC({uri: self.uriDomain + '/api/session/logout.js', 'target': self.target, request: {}});
	}, 0);
}

JSKAuth.prototype.createArea = function(name, data) {
	var self = this;
	var sectionTmpl = self[name + "SectionTmpl"];
	var area = self.toDom(typeof(sectionTmpl) == "function" ? sectionTmpl.apply(self, [data]) : sectionTmpl);
	var areaElements = JSKitLib.mapClass2Object({}, area);

	var bindOnclick = function(element, func){
		if (element) element.onclick = function(){ func(); return false; }
	}

	if (self.mode != "embedded") bindOnclick(areaElements["jska-cancelBtn"], function(){ self.hide(); })
	else JSKitLib.hide(areaElements["jska-cancelBtn"]);

	bindOnclick(areaElements["jska-logout"], function(){ self.logout(); self.hide();});
	if (areaElements["jska-logout"] && (!self.loginStatus || JSKitEPB.isExists())) {
		JSKitLib.hide(areaElements["jska-logout"]);
	}

	bindOnclick(areaElements["jska-forgotPassword"], function(){ self.show("passwordRecoveryRequest", {'provider': name}) });
	bindOnclick(areaElements["jska-linkToLogin"], function(){ self.show(data.provider) });
	if (name.match(/passwordRecovery/)) {
		bindOnclick(areaElements["jska-back"], function(){ self.show(data.provider) });
	}

	bindOnclick(areaElements["jska-yahoo"], function(){ JSKitLib.openPopup(self.uriDomain + '/api/oauth/yahoo.html?ref='+encodeURIComponent(self.ref), {height: "450", width: "600", scrollbars: "no"}); });
	bindOnclick(areaElements["jska-twitter"], function(){ JSKitLib.openPopup(self.uriDomain + '/api/oauth/twitter.html?ref='+encodeURIComponent(self.ref), {height: "435", width: "800", scrollbars: "no"}); });
	bindOnclick(areaElements["jska-friendfeed"], function(){ JSKitLib.openPopup(self.uriDomain + '/api/oauth/friendfeed.html?ref='+encodeURIComponent(self.ref), {height: "435", width: "800", scrollbars: "no"}); });
	if (areaElements["jska-yahoo"]) JSKitLib.addPNG(areaElements["jska-yahoo"], "//cdn.js-kit.com/images/yahoo/yos.png");
	if (areaElements["jska-twitter"]) JSKitLib.addPNG(areaElements["jska-twitter"], "//cdn.js-kit.com/images/twitter/twitter.png");
	if (areaElements["jska-friendfeed"]) JSKitLib.addPNG(areaElements["jska-friendfeed"], "//cdn.js-kit.com/images/friendfeed/friendfeed.png");
	var identity = this.getAuthIdentity(name);
	if (identity && identity.group == "third_party") return area;

	var createAction = function(type){
		return function(){
			var error = undefined;
			var params = {
				login: self.HNDL[type]["input"].login.value,
				password: self.HNDL[type]["input"].password.value,
				type: type};
			if (self.loginReturnUrl) params["returnUrl"] = self.loginReturnUrl;
			if (type == "register") {
				params["retype_password"] = self.HNDL["register"]["input"].password2.value;
				params["email"] = self.HNDL["register"]["input"].email.value;
				params["version"] = "1";
				if (self.registerReturnUrl) {
					params["returnUrl"] = self.registerReturnUrl;
				}
			}
			if (params['login'].length < 1 || !self.HNDL[type]["input"].login.defaultRemoved) error = 'empty_login';
			if (!error && type == "register" && params['email'].length < 1) error = 'empty_email';
			if (!error && params['password'].length < 1) error = 'empty_password';
			if (!error && type == "register" && params['retype_password'].length<1) error = 'empty_password2';
			if (error) { self.showErrorMessage(type, error); return false; };
			var scripts = {"register" : "/user-registration", "jskit" : "/user-login", "haloscan" : "/user-haloscan-login"};
			new JSRVC({
					'uri': self.uriDomain + scripts[type],
					'transport': "POST", 
					'target': self.target, 
					'ref': self.ref,
					'request': params,
					'requestId': type + '_connect',
					'onreturn': function () {
						area.rpickup = self.createRVCPickupRequest(type, self.target)
					},	 
					'epb': window.JSKitEPB ? JSKitEPB.getAsHash() : {}
				});
		}
	};

	var createOpenidAction = function(type){
		return function(){
			var random = function() {return Math.floor(Math.random() * 10000000000);};
			var PPID = 'prfl_' + random() + '-' + random() + '-' + random();
			var params = { jsktid: PPID};
			if (type == "blogspot") params.provider = "blogspot";
			if (self.mode == "popup" && self.LoginWindow && !self.LoginWindow.closed) {
				self.LoginWindow.focus();
				new JSRVC({uri: self.uriDomain + '/openid-auth-prolongate', 'target': self.target, request: params});
				return false;
			}
			var OpenID = self.HNDL[type]["input"].login;
			if(OpenID.value.length < 1 || !OpenID.defaultRemoved) {
				self.showErrorMessage(type, 'empty_' + type);
				return false;
			}
			if(type == "blogspot" && !OpenID.value.match(/\.blogspot\.com\/?$/)) {
				self.showErrorMessage(type, 'incorrect_blogspot_url');
				return false;
			}
			var AuthUrl = self.uriDomain + '/settings/auth.cgi?openid_url=' + OpenID.value;
			if (self.mode == "popup") {
				new JSRVC({uri: self.uriDomain + '/openid-auth-wait-for-completion', 'target': self.target, request: params});
				self.LoginWindow = JSKitLib.openPopup(AuthUrl + '&action=prfl&jsktid=' + PPID);
			} else {
				window.location = AuthUrl + '&action=prfl' + (self.loginReturnUrl ? ("&returnUrl=" + self.loginReturnUrl) : "");
			}
		}
	}

	var constructPasswordRecoveryRequest = function(){
		return function(){
			var loginInputBox = self.HNDL["passwordRecoveryRequest"]["input"].login;
			var provider = self.HNDL["passwordRecoveryRequest"]["input"].provider.value;
			if (loginInputBox.value.length < 1 || !loginInputBox.defaultRemoved) {
				self.showErrorMessage('passwordRecoveryRequest', 'empty_login');
			} else {
				self.passwordRecoveryData["login"] = loginInputBox.value;
				self.passwordRecoveryData["provider"] = provider;
				new JSRVC({uri: self.uriDomain + '/user-password-recovery', 'target': self.target, request: {login: loginInputBox.value, provider: provider}});
			}
		}
	}


	var constructPasswordRecoverySetPassword = function(){
		return function(){
			var inputCollection = self.HNDL["passwordRecoverySetPassword"]["input"]
			var provider = self.HNDL["passwordRecoverySetPassword"]["input"].provider.value;
			var params = {
				step: "set-password",
				provider: provider,
				login: inputCollection.login.value,
				key: JSKitLib.trim(inputCollection.authCode.value),
				password: inputCollection.password.value,
				retype_password: inputCollection.password2.value
			}
			new JSRVC({uri: self.uriDomain + '/user-password-recovery', 'target': self.target, request: params});
		}
	}

	var specificSubmitActions = {
		jskit : createAction("jskit"),
		openid : createOpenidAction("openid"),
		blogspot : createOpenidAction("blogspot"), 
		haloscan : createAction("haloscan"), 
		register: createAction("register"),
		passwordRecoveryRequest     : constructPasswordRecoveryRequest(), 
		passwordRecoverySetPassword : constructPasswordRecoverySetPassword()
	};

	var submitAction = function() {
		self.hideMessages(name);
		self.disableControls(name, true);
		self.HNDL[name].progress.style.display = "inline";
		specificSubmitActions[name].call(self);
		return false;
	};	

	if (!self.HNDL) self.HNDL = [];
	self.HNDL[name] = {
		progress  : areaElements['js-progressHandle'],
		container : area,
		button :
			{button : areaElements["authButton"]},
		message :
			{loginMsg : areaElements["js-loginMessageHandle"],
			emailMsg : areaElements["js-emailMessageHandle"],
			passwordMsg : areaElements["js-passwordMessageHandle"],
			password2Msg : areaElements["js-password2MessageHandle"]},
		input :
			{login : areaElements["loginInput"],
			authCode : areaElements["authCodeInput"],
			email: areaElements["emailInput"],
			password : areaElements["passwordInput"],
			password2 : areaElements["password2Input"],
			provider : areaElements["provider"]}
	};

	if (name != "passwordRecoverySetPassword") JHI2.create( (name == "openid" ? "http://user.myopenid.com" : (name == "blogspot" ? "http://yourblog.blogspot.com" : "Joe.Bloggs")), self.HNDL[name]["input"].login); 

	data = data || {};
	if (name == "jskit" || name == "haloscan")
		data.provider = name;
	JSKitLib.fmap(data, function(value, key){
		if (self.HNDL[name]["input"][key])
			self.HNDL[name]["input"][key].value = value;
	});
	bindOnclick(self.HNDL[name]["button"].button, submitAction);
	self.addKeyHandler(name);
	return area;
}

JSKAuth.prototype.buildShowMore = function() {
	var template = 
	'<span class="jska-showMore"> (' + 
		'<a class="js-fullDescLink" href="javascript:void(0);">Learn more...</a>)' +
		'<div style="display: none;" class="js-fullDescDiv">' + $JAL('full_description') + '</div>' 
	'</span>';

	var span = this.toDom(template);
	var handlers = JSKitLib.mapClass2Object({}, span);

	var fullDescLink = handlers['js-fullDescLink'];
	var fullDescDiv = handlers['js-fullDescDiv']; 
	fullDescLink.onclick = function(ev){
		JSKitLib.stopEventPropagation(ev);
		fullDescLink.innerHTML = this.visFullDesc ? 'Learn more...' : 'Hide';
		fullDescDiv.style.display = this.visFullDesc ? 'none' : '';
		this.visFullDesc = !this.visFullDesc;
		return false;
	}
	return span;
}

JSKAuth.prototype.createAuthSelector = function(selected, onchange, includeUserName) {
	var authSelector = this.toDom(
		'<select class="jska-selector">' +   
			JSKitLib.foldl("", this.getAuthOptions(includeUserName), function(text, acc, option) {
				return acc + '<option value="' + option + '"' + ((selected == option) ? ' selected="true"' : '') + '>' + text + '</option>';
			}) +
		'</select>');
	authSelector.onchange = onchange;
	return authSelector;
}

JSKAuth.prototype.getAuthOptions = function(includeUserName) {
	var s = this;
	var calcLogin  = function() {
		var identities = s.getAuthenticatedIdentities();
		var firstLoggedIdentity = identities.length ? identities.shift() : undefined;
		return firstLoggedIdentity
			? (firstLoggedIdentity.name || firstLoggedIdentity.user) + ' @ '
				+ JSKAuth.prototype.getIdentityLabel(firstLoggedIdentity.type)
			: undefined;
	}

	var authOptions = {};
	var login = calcLogin();
	if (includeUserName) {
		authOptions = login
			? {"opt-user": login}
			: {"opt-anonymous": $JCL('guest')};
	}
	JSKitLib.fmap(s.identities.auth, function(v, k) {
		authOptions[k] = JSKAuth.prototype.getIdentityParam('long_label', v, JSKAuth.prototype.getIdentityLabel(k, true));
	});
	return authOptions;
}

JSKAuth.prototype.isLogged = function() {
	var self = this;
	if (this.loginStatus === undefined) {
		JSKitLib.fmap(this.identities.auth, function(identity, type) {
			if (!self.loginStatus) self.loginStatus = !!identity.user;
		});
		this.loginStatus = JSKitEPB.isExists() || this.loginStatus;
	}
	return this.loginStatus;
}

JSKAuth.prototype.isAvailable = function(type) {
	return !!this.identities.auth[type];
}

JSKAuth.prototype.assembleIdentity = function(url, type, group) {
	var identity = this.getAuthIdentity(type);
	return {
		"url": url,
		"type": type,
		"group": group,
		"use_as_from": true,
		"params": identity && identity.params || {}
	};
}

JSKAuth.prototype.appendIdentity = function(identity) {
	if (identity.group == "web") {
		this.identities.web.push(identity);
	} else {
		this.identities.auth[identity.type] = identity;
	}
}

JSKAuth.prototype.getAuthIdentity = function(type) {
	return this.identities.auth[type];
}

JSKAuth.prototype.getIdentities = function(group) {
	return group ? this.identities[group] : this.identities;
}

JSKAuth.prototype.getAuthenticatedIdentities = function() {
	return JSKitLib.fmap(this.getIdentities("auth"), function(identity) {
		if (identity.user) return identity;
	});
}

JSKAuth.prototype.getFirstAuthIdentity = function() {
	var identities = this.getIdentities("auth");
	for (var key in identities) {
		if (identities.hasOwnProperty(key)) return identities[key];
	}
}

JSKAuth.prototype.readIdentities = function(identities) {
	identities = identities || [];
	return JSKitLib.foldl({"auth": {}, "web": []}, identities,
		function(identity, accumulator) {
			if (identity.group == "web") accumulator.web.push(identity);
			else {
				identity.params = identity.params || {};
				accumulator.auth[identity.type] = identity;
			}
		}
	);
}

JSKAuth.prototype.setWebIdentities = function(identities) {
	this.identities.web = identities;
}

JSKAuth.prototype.identityServerAction = function(action, identity, newData, onSuccess) {
	newData = newData || {};
	var self = this;
	var f = function(eventName) {
		switch (action) {
			case "unbind":
				if (identity.group == "web") {
					self.identities.web = JSKitLib.filter(function(i) {
						return i.url != identity.url;
					}, self.identities.web);
				} else {
					identity.user = undefined;
					identity.use_as_from = false;
				}
				break;
			case "bind":
				self.appendIdentity(identity);
				break;
			case "update":
				identity.url = newData.url;
				break;
		}
		JSKW$Events.deRegisterEventCallback(eventContext, f, eventName);
		if (onSuccess) onSuccess();
	}
	var eventContext = JSKW$Events.registerEventCallback(undefined, f, "JSKitAuth_identityAction");
	var params = {
		'action': action,
		'type': identity.type,
		'group': identity.group,
		'url': identity.url
	}
	if (action == "update") params.newurl = newData.url;
	new JSRVC({uri: this.uriDomain + '/user-identity-action',
		'ref': this.ref,
		'epb': window.JSKitEPB ? JSKitEPB.getAsHash() : {},
		'target': this.target, request: params});
}

JSKAuth.prototype.actualizeGFCprofileURL = function(url, domain, siteID) {
	url = url.replace(/\/\/js-kit.com/, "//" + domain);
	url = url.replace(/site=(.*)/, "site=" + siteID);
	return url;
}

JSKAuth.prototype.drawSelector = function(container) {
	if (!container) return;
	var self = this;
	var selector = this.createAuthSelector(0, function() {
		if (this.selectedIndex == 0) return;
		self.show(this.value);
	}, true);
	JSKitLib.removeChildren(container);
	container.appendChild(selector);
}

function JSKAuth(config) {
	this.areas = {};
	this.uriDomain = (window.location.protocol.substr(0, 4) != 'http' ? 'http:' : '') + '//js-kit.com';
	this.passwordRecoveryData = {};
	JSKitLib.fmap.call(this, config, function(v, k){ this[k] = v; });
	this.identities = this.readIdentities(config.identities);
	var firstIdentity = this.getFirstAuthIdentity();
	this.defaultActiveArea = firstIdentity && firstIdentity.type;
	this.authForm = this.assemble();
	this.prepareAuthForm();
	this.loadCss();
}






function JSDL(elmParent, arrDragElms) {
       var self = this;
       self.isIE = JSKitLib.isIE();
       var drgElms = arrDragElms || [elmParent];
       for(var i=0; i<drgElms.length; i++) {
               self.addDraggableChild(drgElms[i]);
       }
       self.elmParent = elmParent;
       self.setParent = 1;
}

JSDL.prototype.reSetDragParent = function () {
       if(!this.setParent) return;
       if(this.elmParent.parentNode!=document.body
       || JSKitLib.getStyleProperty(this.elmParent, 'position') != 'absolute') {
               var elmPos;
               if(this.elmParent.parentNode) {
                       elmPos = this.getElmAbsPos(this.elmParent, false);
                       this.elmParent.parentNode.removeChild(this.elmParent);
               }
               document.body.appendChild(this.elmParent);
               this.elmParent.style.position = 'absolute';
               if(elmPos) {
                       this.elmParent.style.left = elmPos.x + "px";
                       this.elmParent.style.top = elmPos.y + "px";
               }
       }
       this.setParent = 0;
}

JSDL.prototype.getCurScroll = function() {
       var scroll_left=0,scroll_top=0;
       if(self.pageXOffset){
               scroll_left=self.pageXOffset;
       } else {
               if(document.documentElement&&document.documentElement.scrollLeft){
                       scroll_left=document.documentElement.scrollLeft;
               } else {
                       if(document.body){
                               scroll_left=document.body.scrollLeft;
                       }
               }
       }
       if(self.pageYOffset){
               scroll_top=self.pageYOffset;
       } else {
               if(document.documentElement&&document.documentElement.scrollTop){
                       scroll_top=document.documentElement.scrollTop;
               } else {
                       if(document.body){
                               scroll_top=document.body.scrollTop;
                       }
               }
       }
       return {"scroll_left":scroll_left,"scroll_top":scroll_top};
}

JSDL.prototype.getElmAbsPos = function (element, usescroll){
       var x=0;
       var y=0;
       var e=element;
       var scroll_left=0,scroll_top=0,cur_scroll;
       if(usescroll){
               cur_scroll=this.getCurScroll();
               scroll_left=cur_scroll.scroll_left;
               scroll_top=cur_scroll.scroll_top;
       }
       if(!this.isIE){
               while(e){
                       x+=e.offsetLeft;
                       y+=e.offsetTop;
                       e=e.offsetParent;
               }
               e=element;
               while(e && e!=document.body && e!=document.documentElement){
		       x -= e.scrollLeft || 0;
		       y -= e.scrollTop || 0;
                       e=e.parentNode;
               }
               if(usescroll){
                       x-=scroll_left;
                       y-=scroll_top;
               }
               return {x:x,y:y};
       }
       e=element;
       while(e){
               var left_border=0;
               var top_border=0;
               if(e!=element){
                       var left_border = parseInt(e.style.borderLeftWidth) || 0;
                       var top_border = parseInt(e.style.borderTopWidth) || 0;
               }
               if(document.compatMode == "BackCompat"){
                       x+=e.offsetLeft-left_border;
                       y+=e.offsetTop-top_border;
               } else {
                       x+=e.offsetLeft+left_border;
                       y+=e.offsetTop+top_border;
               }
               try {
                       e=e.offsetParent;
               } catch(err) { e=null; };
       }
       if(usescroll){
               x-=scroll_left;
               y-=scroll_top;
       }
       return {x:x,y:y};
}

JSDL.prototype.addDraggableChild = function(dragElm) {
       var self = this;
       dragElm.style.cursor = "move";
       dragElm.onmousedown = function(e){self.onStartDragHandler(e);}
}

JSDL.prototype.onStartDragHandler = function (e) {
       var self = this;
       self.reSetDragParent();
       e=e || window.event;
       var elmPos = self.getElmAbsPos(this.elmParent, false);
       var mousePos = JSKitLib.getMousePosition(e);
       self.startx = mousePos.x - elmPos.x;
       self.starty = mousePos.y - elmPos.y;
       var maxLeft = document.body.clientWidth - self.elmParent.offsetWidth -
               (parseInt(self.elmParent.style.marginLeft) || 0) -
               (parseInt(self.elmParent.style.marginRight) || 0);

       var onMoveDragHandler = function(event) {
               event = event || window.event;
               var mousePos = JSKitLib.getMousePosition(event);
               var left = mousePos.x - self.startx;
	       self.elmParent.style.left = (left >= maxLeft ? maxLeft : (left < 0 ? 0 : left)) + "px";
               self.elmParent.style.top = (mousePos.y - self.starty < 0) ? 0 : (mousePos.y - self.starty) + "px";
       }

       var onStopDragHandler = function(event) {
               event = event || window.event;
               JSKitLib.removeHandlers(document, onMoveDragHandler, onStopDragHandler, self.elmParent);
               JSKitLib.stopEventPropagation(event);
               if(self.elmParent.jsk$on_stop_drag) self.elmParent.jsk$on_stop_drag(e);
       }

       JSKitLib.addHandlers(document, onMoveDragHandler, onStopDragHandler, self.elmParent);
       JSKitLib.stopEventPropagation(e);
       JSKitLib.preventDefaultEvent(e);
       if(self.elmParent.jsk$on_start_drag) self.elmParent.jsk$on_start_drag(e);
}





function JSKAvatars(config) {
	JSKitLib.fmap.call(this, config, function(value, key) { this[key] = value; });
	this.controls = this.controls || [];
	this.avatarPreviewImgs = {};
	this.avatars = this.getAsHash(this.avatars);
	this.menuItems = this.prepareMenuItems(this.identities, this.avatars);
	this.activateEvents();
	this.loadCSS();
}

JSKAvatars.prototype._labels = {
	"anonymousAvatar": "No avatar",
	"jskitAvatar": "My computer",
	"gravatarEmail": "Gravatar email",
	"useAvatarFrom": "Use my avatar from...",
	"clickToEditAvatars": "Click to edit avatars",
	"actionUploadAvatar": "Click to upload avatar from your computer",
	"actionEditGravatarEmail": "Click to edit Gravatar email"
}

JSKAvatars.prototype.label = function(name) {
	return this.labels && this.labels(name) != name && this.labels(name) || this._labels[name] || name;
}

JSKAvatars.prototype.getAsHash = function(avatars) {
	return JSKitLib.foldl({}, avatars, function(avatar, acc) { acc[avatar.type] = avatar; });
}

JSKAvatars.prototype.getAvatarByType = function(type) {
	return this.avatars[type] || this.anonymousAvatarData();
}

JSKAvatars.prototype.formatMenuItem = function(type, descriptors, extraParams, icon, title) {
	var self = this;
	var avatar = this.getAvatarByType(type);
	var item = {
		"type": "Radio",
		"icon": icon || ("//cdn.js-kit.com/images/favicons/" + type + ".png"),
		"title": self.assembleMenuItemTitle(type, avatar, title, descriptors),
		"state": avatar.chosen ? "checked" : "unchecked",
		"avatarType": type,
		"extend": {
			"setState": function() {
				if (this.endingNode) JSKitLib.show(this.endingNode);
			},
			"renderEnding": function(element) {
				JSKitLib.addClass(element, "jskit-AvatarMenuItemEnding");
				self.avatarPreviewImgs[type] = element;
				self.setPreviewImage(type, avatar);
			}
		},
		"oncheck": function(title) {
			self.updateActiveAvatar(self.getAvatarByType(type));
			if (self.autoSave) {
				self.saveAvatarState();
				JSKW$Events.syncBroadcast("JSKitAvatars_replaceAvatars",
					[self.getAvatarByType(type)], undefined, self.id);
			}
			if (extraParams["oncheckCallback"]) {
				extraParams["oncheckCallback"].call(this);
			}
		}
	};
	return JSKitLib.foldl(item, extraParams || {}, function(value, acc, key) { acc[key] = value; });
}

JSKAvatars.prototype.saveAvatarState = function() {
	var activeAvatar = this.getActiveAvatar();
	this.sendServerRequest("activate", activeAvatar ? {"name": activeAvatar.name} : {});
}

JSKAvatars.prototype.prepareMenuItems = function(identities, avatars) {
	var self = this;
	var itemsEPB = JSKitLib.fmap(avatars, function(avatar, type) {
		if (!type.match(/^http:\/\/.*/)) return;
		var params = avatars[type].params || {};
		var item = self.formatMenuItem(
			type,
			{},
			{"state": self.getAvatarByType(type).chosen ? "checked" : "unchecked"},
			params.favicon || '//cdn.js-kit.com/images/favicons/default.png',
			params.long_label || JSKAuth.prototype.getIdentityLabel('epb')
		);
		return item;
	});
	var itemsThirdParty = JSKitLib.fmap(identities, function(identity, type) {
		if (identity.authenticated && !avatars[type]) return;
		return self.formatMenuItem(type, {}, {
			"state": identity.authenticated ?
				self.getAvatarByType(type).chosen ? "checked" : "unchecked" :
				"disabled",
			"action": identity.action ? function() { identity.action(); } : undefined 
		}, undefined, identity.title);
	});
	return JSKitLib.merge(
		{"title": JSKitLib.html('<div class="js-kit-avatars-menu-title">' + this.label("useAvatarFrom") + '</div>'), "type": "HTML"},
		this.assembleAnonymousFormItem(),
		this.assembleUploadFormItem(),
		itemsEPB,
		itemsThirdParty,
		this.assembleGravatarsForm(),
		{"title": JSKitLib.html('<div class="js-kit-avatars-menu-footer"></div>'), "type": "HTML"}
	);
}

JSKAvatars.prototype.anonymousAvatarData = function() {
	return {"name": "gxpA99f0jKlohF_DgthroT.png", "type": "anonymous", "width": "100", "height": "100"};
}

JSKAvatars.prototype.classifyAvatarType = function(type) {
	return type.match(/^http:\/\//) ? 'epb' : type;
}

JSKAvatars.prototype.assembleMenuItemTitle = function(type, avatar, title, descriptors) {
	type = this.classifyAvatarType(type);
	var template =
	'<div class="js-kit-avatars-itemTitleContainer js-kit-avatars-itemTitleCnt-' + type + '">' +
		'<div class="js-kit-avatars-itemTitle">' + (title || this.label(type + "Avatar")) + '</div>' +
	'</div>';
	return JSKitLib.toDOM(template, "js-kit-avatars-", descriptors || {}).content;
}

JSKAvatars.prototype.assembleAnonymousFormItem = function() {
	return this.formatMenuItem("anonymous", {}, {
		"state": this.getActiveAvatar() ? "unchecked" : "checked"
	}, "//cdn.js-kit.com/images/favicons/noname.png");
}

JSKAvatars.prototype.assembleUploadFormItem = function() {
	var self = this;
	var descriptor = function(element, dom) {
		dom.get("itemTitle").title = self.label("actionUploadAvatar");
		self.uploadForm = self.assembleUploadForm(element);
		self.uploadForm.label = dom.get("itemTitle");
		JSKitLib.addChild(element, self.uploadForm.content);
		JSKitLib.hide(self.uploadForm.content);
		element.onclick = function() {
			render("form");
		};
	};
	var render = function(element) {
		var isFormVisible = element == "form";
		JSKitLib.hide(self.uploadForm[isFormVisible ? "label" : "content"]);
		JSKitLib.show(self.uploadForm[isFormVisible ? "content" : "label"]);
	};
	JSKW$Events.registerEventCallback(self.eventsCtx, function() {
		render("label");
	}, "JSMenu-CollapseAll");
	return this.formatMenuItem("jskit", {"itemTitleContainer": descriptor}, {
		"onuncheck": function() { render("label"); },
		"oncheckCallback": function() { if (!self.avatars["jskit"]) render("form"); }
	}, "//cdn.js-kit.com/images/favicons/default.png");
}

JSKAvatars.prototype.assembleGravatarsForm = function() {
	var self = this;
	var descriptor = function(element) {
		self.gravatarControlContainer = element;
		self.renderGravatarControl();
	};
	return this.formatMenuItem("gravatar", {"itemTitle": descriptor}, {
		"onuncheck": function() {
			if (!self.gravatarEmail) self.gravatarEmailIPE.displayMode();
		},
		"oncheckCallback": function() {
			if (!self.gravatarEmail) self.gravatarEmailIPE.editMode();
		}
	});
}

JSKAvatars.prototype.setDefaultGravatar = function() {
	var anonymous = this.anonymousAvatarData();
	this.avatars["gravatar"] = anonymous;
	this.setPreviewImage("gravatar", anonymous);
	this.updateActiveAvatar(anonymous);
}

JSKAvatars.prototype.renderGravatarControl = function() {
	var self = this;
	var size = this.splitAvatarDim(this.size);
	var anonymous = this.anonymousAvatarData();
	var defaultUrl = this.avatarURL(this.calcAvatarDim(size, anonymous).name);
	this.gravatarEmailIPE = new JSIPE2({
		"obj": self,
		"property": "gravatarEmail",
		"title": self.label("actionEditGravatarEmail"),
		"width": "120px",
		"maxLength": 50,
		"hideApplyBtn": true,
		"defaultText": self.label("gravatarEmail"),
		"textModeDisplayCSS": "block",
		"editModeEventEnabled": true,
		"jsk$wasEdited": function() {
			self.setPreviewImage("gravatar");
			var params = self.gravatarEmail ? {
				"email": self.gravatarEmail,
				"defaultUrl": defaultUrl,
				"rating": "X",
				"size": 64
			} : {};
			if (!self.gravatarEmail) {
				self.setDefaultGravatar();
			}
			if (self.autoSave) {
				JSKW$Events.syncBroadcast("JSKitAvatars_gravatarEmailUpdated",
						self.gravatarEmail, undefined, self.id);
			}
			self.sendServerRequest("update_gravatar", params);
		}
	});
	JSKitLib.replaceChildren(self.gravatarControlContainer, self.gravatarEmailIPE.div);
}

JSKAvatars.prototype.setPreviewImage = function(type, avatar) {
	if (!this.avatarPreviewImgs[type]) return;
	var loading = {
		"name": "//cdn.js-kit.com/images/loading.gif",
		"width": "16",
		"height": "16"
	};
	this.assembleAvatar({
		"instance": this.avatarPreviewImgs[type],
		"width": "24",
		"height": "24"
	}, avatar || loading);
}

JSKAvatars.prototype.getGravatarURL = function(gravatarID, size) {
        if (!gravatarID || gravatarID.match(/^https?:\/\//)) return gravatarID;
        var defaultUrl = this.calcAvatarDim(size, this.anonymousAvatarData()).name;
        return 'http://www.gravatar.com/avatar.php?' 
                + 'gravatar_id=' + gravatarID
                + '&default=' + this.avatarURL(defaultUrl)
                + '&rating=X'
                + '&size=' + size.width + 'x' + size.height;
}

JSKAvatars.prototype.splitAvatarDim = function(dim) {
	var re = /(\d+)x(\d+)/;
	var size = re.exec(dim) || ['96x96', '96', '96'];
	return {"width": size[1], "height": size[2]};
}

JSKAvatars.prototype.calcAvatarDim = function(size, avatar) {
	if (!size || typeof(size) != "object") size = this.splitAvatarDim(size);
	var width = parseInt(avatar.width);
	var height = parseInt(avatar.height);
	var MW = parseInt(size.width || 96);
	var MH = parseInt(size.height || 96);
	if(avatar.name.match(/https?:\/\//)) {
		return {'width': width, 'height': height, 'name': avatar.name};
	} else if ((MW>=96)&&(MH>=96)&&(width<=100)&&(height<=100)){
		return {'width': width, 'height': height, 'name': avatar.name};
	} else if ((MW<width)||(MH<height)){
		var DW = MW<width ? MW/width : 1;
		var DH = MH<height ? MH/height : 1;
		var D = DW < DH ? DW : DH;
		DW = Math.round(width*D+0.000001);
		DH = Math.round(height*D+0.000001);
		var Name = (avatar.name.match(/https?:\/\//)) ?
			avatar.name :
			avatar.name.substr(0,avatar.name.length-4)+'-'+DW.toString()+'x'+DH.toString()+avatar.name.substr(avatar.name.length-4);
		return {'width': DW, 'height': DH, 'name': Name};
	} else {
		return {'width': width,'height': height,'name': avatar.name};
	}
}

JSKAvatars.prototype.assembleAvatarArea = function(container) {
	if (!container) return;
	this.container = this.updateActiveAvatar(this.getActiveAvatar() || this.anonymousAvatarData());
	if (this.yours) {
		this.menu = JSMenu(this.container, this.menuItems, "HTML", this.layer);
		var wrapper = this.menu.firstChild;
		wrapper.title = this.label("clickToEditAvatars");
		JSKitLib.addClass(wrapper, "js-kit-avatars-avatarWrapper");
		JSKitLib.addChild(container, this.menu);
		JSKitLib.addClass(container, "js-kit-avatars-wrapper");
	} else {
		JSKitLib.replaceChildren(container, this.container);
	}
}

JSKAvatars.prototype.assembleAvatar = function(container, avatar) {
	if (!avatar) avatar = this.getActiveAvatar();
	var setSize = function(element, dims) {
		JSKitLib.addStyle(element,
			"width: " + dims.width + "px;" +
			"height: " + dims.height + "px;");
	};
	var wrapper = container.instance || JSKitLib.html('<div></div>');
	var image = JSKitLib.html('<img src="' + this.avatarURL(avatar.name) + '" />');
	if (avatar.onerror) {
		image.onerror = avatar.onerror;
	}
	var adjustedAvatar = this.calcAvatarDim(container, avatar);
	var getMinSize = function(dim) {
		return Math.min(adjustedAvatar[dim], container[dim]);
	};
	var getSizeDiff = function(dim) {
		return Math.max(0, container[dim] - adjustedAvatar[dim])/2;
	};
	setSize(image, {
		"width": getMinSize("width"),
		"height": getMinSize("height")
	});
	setSize(wrapper, container);
	JSKitLib.addStyle(image,
		"margin-top: " + getSizeDiff("height") + "px;" +
		"margin-left: " + getSizeDiff("width") + "px;");
	JSKitLib.replaceChildren(wrapper, image);
	return wrapper;
}

JSKAvatars.prototype.updateActiveAvatar = function(avatar) {
	var size = this.splitAvatarDim(this.size);
	var data = this.calcAvatarDim(size, avatar);
	var container = {
		"instance": this.container,
		"width": size.width,
		"height": size.height
	};
	JSKitLib.fmap(this.avatars, function(avt) { avt.chosen = avt.type == avatar.type; });
	return this.assembleAvatar(container, data);
}

JSKAvatars.prototype.getAvatars = function() { return this.avatars || []; }

JSKAvatars.prototype.getActiveAvatar = function() {
	return JSKitLib.foldl(undefined, this.avatars || [], function(avatar) {
		if (avatar.chosen) return avatar;
	});
}

JSKAvatars.prototype.avatarURL = function(avatar) {
	if(avatar.match(/^(https?:)*\/\//)) {
		return JSKitLib.htmlUnquote(avatar);
	} else if(avatar.match(/^[^/]+$/)) {
		return this.uriAvatar + avatar;
	} else return "";
}

JSKAvatars.prototype.sendServerRequest = function(action, params) {
	JSKitLib.fmap.call(this, ["id", "ref"], function(name) { params[name] = this[name]; });
	new JSRVC({"uri": this.uriAvatar + action, "request": JSKitEPB.getAsHash(params)});
}

JSKAvatars.prototype.replaceAvatars = function(avatars) {
	if (!avatars.length) return;
	var avatar = JSKitLib.cloneObject(avatars[0]);
	this.avatars[avatar.type] = avatar;
	if (!this.menu) return;
	this.setPreviewImage(avatar.type, avatar);
	this.updateActiveAvatar(avatar);
	this.updateMenuItemsStatus(avatar);
}

JSKAvatars.prototype.updateMenuItemsStatus = function(avatar) {
	JSKitLib.fmap(this.menu.items, function(item) {
		if (avatar.type == item.avatarType) item.setActiveState();
	});
}

JSKAvatars.prototype.activateEvents = function() {
	var self = this;
	var handlers = {
		"replaceAvatars": function(avatars) {
			self.replaceAvatars(avatars);
		},
		"gravatarEmailUpdated" : function(gravatarEmail) {
			self.gravatarEmail = gravatarEmail;
			self.renderGravatarControl();
			if (!self.gravatarEmail) {
				self.setDefaultGravatar();
			}
		}
	};
	JSKitLib.fmap(handlers, function(handler, name) {
		JSKW$Events.registerEventCallback(self.eventsCtx, function(name, data, id, callerId) {
			if (!self.yours) return;
			if ((id && (id == self.id || id.match(/profile/))) || (callerId && callerId != self.id)) handler(data);
		}, "JSKitAvatars_" + name);
	});
}

JSKAvatars.prototype.deActivateEvents = function() {
	if (this.eventsCtx) JSKW$Events.invalidateContext(this.eventsCtx);
}

JSKAvatars.prototype.syncAvatarsChanges = function() {
	JSKW$Events.syncBroadcast("JSAvatars_replaceAvatars", this.getAvatars(), undefined, this.id);
}

JSKAvatars.prototype.assembleUploadForm = function(container) {
	var self = this;
	var template =
	'<form class="js-kit-avatars-upload-form" method="POST" enctype="multipart/form-data" action="' + this.uriAvatar + 'add">' +
		'<input type="file" name="image" class="js-kit-avatars-upload-control" />' +
	'</form>';
	var setControlsState = function(state) {
		JSKitLib.fmap(self.controls, function(control) {
			if (control && !control.btnLocked) control.disabled = (state == "lock") ? "true" : "";
		});
	}
	var descriptors = {
		"form": function(element) {
			JSKitLib.fmap(JSKitEPB.getAsHash({"ref": self.ref}), function(v, k) {
				element.appendChild(JSKitLib.html('<input type="hidden" name="' + k + '" value="' + encodeURIComponent(v) + '">'));
			});
			container.appendChild(element);
		},
		"control": function(element, dom) {
			var form = dom.get("form");
			var onload = function() {
				setControlsState("unlock");
				form.reset();
				self.sendServerRequest("list", {"onlyjskit": "true"});
			};
			self.controls.push(element);
			element.onchange = function() {
				self.setPreviewImage("jskit");
				if (!form.target) {
					var tgt = 'js-ifrm-' + Math.random();
					JSKitLib.createHiddenIframe(tgt, self.target, onload, false);
					form.target = tgt;
				}
				form.submit();
				setControlsState("lock");
			}
		}
	};
	return JSKitLib.toDOM(template, "js-kit-avatars-upload-", descriptors);
}

JSKAvatars.prototype.loadCSS = function() {
	JSKitLib.addCss(
		".js-kit-avatars-wrapper { cursor: pointer; }" +
		".js-kit-avatars-wrapper .jskit-MenuItemTitle { margin: 1px; }" +
		".js-kit-avatars-wrapper div.jskit-MenuRootHTML { text-align: left; }" +
		".js-kit-avatars-avatarWrapper { text-align: left; " + (JSKitLib.isPreIE8() ? "zoom: 1;" : "") + "}" +
		".js-kit-avatars-itemTitleContainer { margin: 4px 5px 0px 0px; }" +
		".js-kit-avatars-itemTitleCnt-jskit, .js-kit-avatars-itemTitleCnt-gravatar { margin-top: 0px; line-height: 20px; }" +
		".js-kit-avatars-menu-title { font-size: 10px; font-weight: bold; font-family: Lucida grande,Tahoma,Verdana,Arial; margin: 5px 8px; }" +
		".js-kit-avatars-menu-footer { margin-top: 8px; }" +
		".js-kit-avatars-upload-form { margin: 0px; }" +
		".js-kit-clear { clear: both; }", "avatars"
	);
}





function JSTabsManager(tabs, areas, config) {
	var self = this;
	if (tabs.length < 1 || !areas) return;
	JSKitLib.fmap({
		"tabs" : tabs,
		"areas" : areas,
		"config": config || {}
	}, function(value, key) { self[key] = value; });
	this.loadCSS();
	this.setActiveTab(this.getActiveTab());
	this.displayTabs(tabs, this.areas.titles);
}

JSTabsManager.prototype.displayTabs = function(tabs, container) {
	JSKitLib.removeChildren(container);
	JSKitLib.fmap.call(this, tabs, function(tab) { container.appendChild(this.initFromData(tab)); });
	container.appendChild(JSKitLib.html('<div class="js-kit-clear"></div>'));
	if (tabs.length == 1) JSKitLib.addClass(container, "js-kit-tabs-singleTab");
	var activeTab = this.getActiveTab();
	if (this.config.mode != "toggle" || activeTab) this.displayTab(activeTab);
	else if (!activeTab) JSKitLib.hide(this.areas.content);
}

JSTabsManager.prototype.initFromData = function(tab) {
	var self = this;
	var prefix = "js-kit-tab-";
	var descriptors = {
		"icon": function(element) {
			if (tab.icon) JSKitLib.addPNG(element, tab.icon); else JSKitLib.hide(element);
		},
		"title": function(element) {
			if (typeof(tab.title) == "string") tab.title = JSKitLib.text(tab.title);
			element.appendChild(tab.title);
			JSKitLib.preventSelect(element);
		}
	};
	var dom = JSKitLib.toDOM(this.config.template || this.template, prefix, descriptors);
	if (this.config.descriptors) {
		var elements = JSKitLib.foldl({}, this.config.descriptors, function(value, acc, key) { if (dom.get(key)) acc[prefix + key] = dom.get(key); });
		JSKitLib.attachDescriptors2Elements(elements, prefix, this.config.descriptors);
	}
	dom.content.onclick = function(e) {
		if (self.config.mode == "toggle" && tab.active) {
			tab.active = false;
			self.renderView();
			self.processCallback(tab, "Closed");
			JSKitLib.hide(self.areas.content);
		} else {
			if (tab.active) return;
			self.processCallback(self.activeTab, "Closed");
			self.setActiveTab(tab);
			self.displayTab(tab);
		}
		JSKitLib.stopEventPropagation(e);
	}
	if (tab.name) JSKitLib.addClass(dom.content, prefix + tab.name);
	tab.cache = {"title" : dom.content};
	return dom.content;
}

JSTabsManager.prototype.processCallback = function(tab, action) {
	if (tab && tab.callbacks && tab.callbacks["onTab" + action]) tab.callbacks["onTab" + action](tab);
}

JSTabsManager.prototype.getActiveTab = function() {
	return JSKitLib.foldl(undefined, this.tabs, function(tab, result) { if (tab.active) return tab; }) || (this.config.mode != "toggle" ? this.tabs[0] : undefined);
}

JSTabsManager.prototype.setActiveTab = function(tab) {
	if (!tab) return;
	if (this.activeTab) this.activeTab.active = false;
	this.activeTab = tab;
	this.activeTab.active = true;
}

JSTabsManager.prototype.renderView = function() {
	var area = this.areas.content;
	var activeTabPosition;
	JSKitLib.removeClass(area, "js-kit-lastTabActive");
	JSKitLib.removeClass(area, "js-kit-firstTabActive");
	JSKitLib.fmap.call(this, this.tabs, function(tab, idx) {
		if (tab.cache.title) JSKitLib[(tab.active ? "add" : "remove") + "Class"].call(this, tab.cache.title, "js-kit-tab-active");
		if (tab.active) activeTabPosition = (idx == this.tabs.length - 1) ? "last" : (idx == 0 ? "first" : undefined);
	});
	if (activeTabPosition) JSKitLib.addClass(area, "js-kit-" + activeTabPosition + "TabActive");
}

JSTabsManager.prototype.displayTab = function(tab) {
	var area = this.areas.content;
	this.renderView();
	if (this.config.mode == "toggle") JSKitLib.show(area);
	if (!tab.cache.content || this.config.nocache) tab.cache.content = tab.content(area);
	JSKitLib.replaceChildren(area, tab.cache.content);
	this.processCallback(tab, "Opened");
}

JSTabsManager.prototype.collapseTabs = function() {
	if (this.config.mode != "toggle") return;
	if (this.activeTab) {
		this.activeTab.active = false;
		delete this.activeTab;
	}
	this.renderView();
	JSKitLib.hide(this.areas.content);
}

JSTabsManager.prototype.template =
 '<div class="js-kit-tab">' +
   '<div class="js-kit-tab-icon"></div>' +
   '<div class="js-kit-tab-title"></div>' +
   '<div class="js-kit-clear"></div>' +
 '</div>';

JSTabsManager.prototype.loadCSS = function() {
	JSKitLib.addCss(
		".js-kit-tab { " + (JSKitLib.isIE() ? "zoom: 1;" : "") + " float: left; cursor: pointer; margin: 0; font-size: 14px; background: transparent; padding: 5px 10px " + (JSKitLib.isIE() ? "0" : "5") + "px 10px; }" +
		".js-kit-tab-icon { float: left; width: 17px; height: 17px; margin: 0px 5px 0 0; }" +
		".js-kit-tab-title { font-size: 12px; float: left; }" +
		".js-kit-tab-active { font-weight: bold; cursor: text; background: #FFFFFF; }" +
		".js-kit-tabs-singleTab { display: none; }" +
		".js-nsgecko { -moz-user-select: none; }" + 
		".js-kit-clear { clear: both; }", "tabsManagement");
}





function JSKitMiniProfile(target, data, config) {
	var self = this;
	this.data = data;
	this.target = target;
	this.config = this.merge(config, {
		"mode": "popup",
		"template": this.template,
		"cssPrefix": "js-kit-miniProfileWrap",
		"elmPrefix": "js-kit-miniProfile-",
		"descriptors": {}
	});
	this.loadCSS();
	if (this.config.mode == "popup")
		JSKW$Events.registerEventCallback(undefined, function() { self.hide(); }, "miniProfile_collapseAll");
	this.assemble();
}

JSKitMiniProfile.prototype.assemble = function() {
	var self = this;
	this.descriptors = {
		"name": function() { return JSKitLib.html('<span>' + JSKitLib.trim(self.data.Name) + '</span>'); },
		"viewDetails": function() { return JSKitLib.text(self.label("viewDetails")); },
		"siteLinksIcons": function(element) { return self.assembleSiteLinks("icons", element); },
		"siteLinksExtended": function(element) { return self.assembleSiteLinks("extended", element); }
	};
	this.dom = JSKitLib.toDOM(this.config.template, this.config.elmPrefix, this.descriptors);
	JSKitLib.addClass(this.dom.content, this.config.cssPrefix + " " + this.config.elmPrefix + this.config.mode);
	var elements = JSKitLib.foldl({}, this.config.descriptors, function(descriptor, container, name) {
		if (self.dom.get(name)) container[name] = self.dom.get(name);
	});
	JSKitLib.attachDescriptors2Elements(elements, "", this.config.descriptors);
	this.display();
}

JSKitMiniProfile.prototype.display = function(target) {
	if (!this.dom) return;
	if (this.config.mode == "popup") JSKW$Events.syncBroadcast("miniProfile_collapseAll");
	JSKitLib.addChild(target || this.target, this.dom.content);
	this.dom.content.onclick = function(e) { JSKitLib.stopEventPropagation(e); };
	this.isVisible = true;
}

JSKitMiniProfile.prototype.render = function(block, data) {
	var self = this;
	var element = this.dom.get(block);
	if (!element) return;
	JSKitLib.removeChildren(element);
	this.data = this.merge(data, this.data);
	var name = this.config.elmPrefix + block;
	var replacement = {};
	replacement[name] = element.cloneNode(true);
	JSKitLib.fmap([self, self.config], function(obj) {
		JSKitLib.attachDescriptors2Elements(replacement, self.config.elmPrefix, obj.descriptors || {});
	});
	element.parentNode.replaceChild(replacement[name], element);
	this.dom.set(block, replacement[name]);
}

JSKitMiniProfile.prototype.hide = function() {
	if (!this.isVisible || !this.dom) return;
	this.isVisible = false;
	this.dom.content.parentNode.removeChild(this.dom.content);
}

JSKitMiniProfile.prototype.getContent = function() {
	return this.dom ? this.dom.content : undefined;
}

JSKitMiniProfile.prototype.assembleSiteLinks = function(mode, element) {
	var self = this;
	var auth = JSKitLib.fmap(self.data.identities.auth, function(identity) {
		if (identity.user) return identity;
	});
	var identities = JSKitLib.merge(auth, self.data.identities.web);
	if (identities.length < 1) return JSKitLib.hide(element); else JSKitLib.show(element);
	var setAction = function(element, type, url, domain, identity, isLogin) {
		var isExternalProfile = isLogin && !!url && !type.match(/jskit|haloscan|openid/);
		var isDisabled = isLogin && !isExternalProfile && self.config.isNativeProfileDisabled;
		element.onclick = function() {
			if (isLogin && !isExternalProfile) {
				if (!isDisabled) self.config.openFullProfile();
				return;
			}
			if (isLogin) {
				// validation of old format profile URLs
				if ((type == "gfc" && !url.match(/canvas.html/))
				|| (type == "yahoo" && !url.match(/profiles.yahoo.com\/u\//))) {
					element.title = self.label("openFullProfile");
					self.config.openFullProfile();
					return;
				}
				if (type == "gfc" && identity.params.site) {
					url = JSKAuth.prototype.actualizeGFCprofileURL(url, identity.params.domain, identity.params.site);
				}
			}
			window.open(url.replace(/\ /g, "%20"));
		};
		if (isDisabled) {
			JSKitLib.addClass(element, "js-kit-miniProfile-profileDisabled");
		} else {
			var title = isExternalProfile ? "ext_profile_" + type : "openFullProfile";
			element.title = isLogin ? self.label(title) : url;
		}
	};
	var container = JSKitLib.html('<div class="js-kit-miniProfile-linksContainer"></div>');
	var specificTemplate = mode == "icons" ?
		'<div class="js-kit-clear"></div>':
		'<div class="js-kit-linksContainerTitle">' + this.label("visitMeOn") + '</div>';
	container.appendChild(JSKitLib.html(specificTemplate));
	JSKitLib.fmap.call(this, mode == "icons" ? identities.reverse() : identities, function(identity) {
		if (!identity.use_as_from) return;
		var isLogin = identity.group != "web";
		var type = isLogin ? identity.type : "default";
		var url = '';
		var domain = '';
		if (identity.url) {
			url = (isLogin || identity.url.match(/^(https?:)*\/\//) ? "" : "http://") + identity.url;
			domain = JSKitLib.extractDomain(url);
		}
		var title = !isLogin ? domain : JSKAuth.prototype.getIdentityParam('short_label', identity, JSKAuth.prototype.getIdentityLabel(type)) || domain;
		var template =
		'<div class="js-kit-linksItem">' +
		    '<div class="js-kit-linksItem-icon"></div>' +
		    '<div class="js-kit-linksItem-link">' + title + '</div>' +
		    '<div class="js-kit-clear"></div>' +
		'</div>';
		var descriptors = {
			"icon": function(element) {
				JSKitLib.addPNG(element, JSKAuth.prototype.getIdentityParam('favicon', identity, "//cdn.js-kit.com/images/favicons/" + type + ".png"));
				setAction(element, type, url, domain, identity, isLogin);
			},
			"link": function(element) {
				if (mode == "icons") JSKitLib.hide(element); else setAction(element, type, url, domain, identity, isLogin);
			}
		};
		JSKitLib.addChild(container, JSKitLib.toDOM(template, "js-kit-linksItem-", descriptors).content, mode == "icons");
	});
	return container;
}

JSKitMiniProfile.prototype.label = function(name) { return this.config.labels("miniProf_" + name); }

JSKitMiniProfile.prototype.merge = function(masterObj, slaveObj) {
	var merge = function(cnt, obj) { return JSKitLib.foldl(cnt, obj || {}, function(v, acc, k) { acc[k] = v; }); };
	return merge(merge({}, slaveObj), masterObj);
}

JSKitMiniProfile.prototype.template =
  '<div class="js-kit-miniProfile">' +
      '<div class="js-kit-miniProfile-avatar"></div>' +
      '<div class="js-kit-miniProfileDataContainer">' +
          '<div class="js-kit-miniProfileDataWrap">' +
              '<div class="js-kit-miniProfile-name"></div>' +
              '<div class="js-kit-miniProfile-stats"></div>' +
              '<div class="js-kit-miniProfile-details">' +
	          '<span class="js-kit-miniProfile-viewDetails"></span>' +
              '</div>' +
          '</div>' +
      '</div>' +
      '<div class="js-kit-clear"></div>' +
      '<div class="js-kit-miniProfile-siteLinksExtended"></div>' +
  '</div>';

JSKitMiniProfile.prototype.loadCSS = function() {
	var dims = this.config.avatarSize;
	var zoom = JSKitLib.isIE() ? "zoom: 1;" : "";
	var prefix = "." + this.config.cssPrefix.match(/[^\ ]*/);
	var margin = parseInt(dims.width) + 10;
	JSKitLib.addCss(
		prefix + " .js-kit-miniProfileDataWrap { " + zoom + "margin-left: " + margin + "px; }" +
		prefix + " .js-kit-miniProfile-avatar { float: left; margin-right: -" + margin + "px; width: " + dims.width + "px; height: " + dims.height + "px; }", "miniProfile-" + this.config.cssPrefix.replace(/[^a-zA-Z-]/g, "-"));
	JSKitLib.addCss(
		".js-kit-miniProfile { padding: 7px; text-align: left; font-weight: normal; cursor: default; background: #FFFFFF; }" +
		".js-kit-miniProfile-popup { position: absolute; z-index: 13490; width: 275px; border: 2px solid #d6e2e9; -moz-border-radius: 5px; -webkit-border-radius: 5px; }" +
		".js-kit-miniProfile-embedded { border: 1px solid #BBBBBB; }" +
		".js-kit-miniProfile-avatar { position: relative; }" +
		".js-kit-miniProfile-embedded .js-kit-miniProfile-avatar { border: 1px solid #BBBBBB; }" +
		".js-kit-miniProfileDataContainer { float: left; width: 100%; }" +
		".js-kit-miniProfile-stats { color: #0066CC; font-size: 10px; }" +
		".js-kit-miniProfile-viewDetails { color: #0066CC; font-size: 10px; }" +
		".js-kit-miniProfile-name { font-size: 18px; color: #000000; }" +
		".js-kit-miniProfile-siteLinksExtended { margin-top: 5px; font-size: 20px; border-top: 2px dotted #E4E4E4; }" +
		".js-kit-miniProfile-siteLinksIcons { border-top: 2px dotted #7d7d7d; }" +
		".js-kit-miniProfile-siteLinksIcons .js-kit-linksItem { width: 16px; height: 16px; float: left; }" +
		".js-kit-linksItem { margin: " + (JSKitLib.isIE() ? "3px 3px" : "4px 6px") + " 0px 0px; line-height: 16px; }" +
		".js-kit-linksItem-link  { float: left; " + zoom + " color: #476CB8 !important; margin-left: 5px; font-size: 12px; cursor: pointer; }" +
		".js-kit-linksItem-icon { float: left; width: 16px; height: 16px; margin: 0px " + (JSKitLib.isIE() ? "5" : "3") + "px 0px 0px; font-size: 12px; padding: 0px; cursor: pointer; }" +
		".js-kit-linksContainerTitle { margin: 7px 3px; color: #000000; font-size: 12px; font-weight: bold; }" +
		".js-kit-miniProfile-profileDisabled { cursor: default; }" +
		".js-kit-clear { clear: both; }", "miniProfile");
}





function JSKbdHandler(element, events) {

	this.kbdCallback = function(e) {
		var event = e || window.event;
		var key = event.charCode || event.keyCode;
		if (key == 9 || key == 13 || key == 27) JSKitLib.preventDefaultEvent(event);
		if(JSKitLib.isSafari()) JSKitLib.stopEventPropagation(event);
		for(var i = 0; i < events.length; i++) {
			for(var j = 0; j < events[i].keys.length; j++) {
				if(typeof(events[i].keys[j]) == "string") events[i].keys[j] = String.charCodeAt(events[i].keys[j]);
				var shiftCondition = (events[i].shift != undefined) ? events[i].shift == event.shiftKey : true; 
				if (events[i].keys[j] == key && shiftCondition) {
					if(!events[i].args)
						(events[i].action)();
					else
						events[i].action.apply(events[i], events[i].args);
				}
			}
		}
	}

	if(element.addEventListener) {
		if(JSKitLib.isSafari()) element.addEventListener("keydown", this.kbdCallback, false);
		else if(JSKitLib.isOpera()) element.addEventListener("keydown", this.kbdCallback, false);
		else element.addEventListener("keypress", this.kbdCallback, false);
	} else {
		element.onkeydown = this.kbdCallback;
	}
}





function JSIPE2(obj) {
/* 
	JSIPE2 API

	obj:		object contains property
	title: 		hint
	defaultText:	default text in created div
	property:	property where save the result
	maxLength:	max string length
	width: 		input width
	jsk$validate	callback, validates the value before applying
	jsk$wasEdited	callback, called at the end of editing 
	readonly:	readonly mode
	
	example: 
	var jsipe = new JSIPE2({obj: elem,
				property: 'descr',
				title: 'Description',
				defaultText: 'Add caption',
				width: '90px',
				maxLength: 12,
				jsk$wasEdited: function(){...},
				readonly: true
	});

*/

	for(var i in obj)
		this[i] = obj[i];
	var div = JSKitLib.cr();
	div.title = this.readonly ? "" : (this.title || $JCL("clickToEdit"));
	var defaultText = this.readonly ? "" : (this.defaultText || $JCL("clickToEditEmpty"));
	var maxTextLength = this.maxLength || 256;
	var isFocused = false;

	var self = this;

	var textDivDisplayCSS = typeof(self.textModeDisplayCSS) != "undefined" ? self.textModeDisplayCSS : "inline";
	var textDiv = JSKitLib.cr({style:{display:textDivDisplayCSS}});
	var textValue = (JSKitLib.trim(self.obj[self.property]).length > 0) ? self.obj[self.property] : defaultText;
	var text = JSKitLib.text(textValue);
	textDiv.appendChild(text);
	div.appendChild(textDiv);

	var editDiv = JSKitLib.cr();
	editDiv.style.display = "none";
	div.appendChild(editDiv);
	var edit = JSKitLib.cr({t:"input", type:"edit", className:"jsipe-input",
		style: "width: " + (self.width || "150px"), readonly: this.readonly});
	edit.value = this.obj[this.property] || "";
	editDiv.appendChild(edit);

	if (!this.hideApplyBtn) {
		var applyDiv = JSKitLib.cr();
		JSKitLib.addClass(applyDiv, "jsipe-applyButton");
		applyDiv.title = "Apply";
		JSKitLib.addPNG(applyDiv, "//cdn.js-kit.com/images/tick.png");
		editDiv.appendChild(applyDiv);
	}

	this.div = div;

	if (this.readonly) return;

	textDiv.onmouseover = function() { JSKitLib.addClass(textDiv, "jsipe-onmouseover"); }
	textDiv.onmouseout  = function() { JSKitLib.removeClass(textDiv, "jsipe-onmouseover"); }

	this.displayMode = function() {
		JSKitLib.show(textDiv, textDivDisplayCSS);
		JSKitLib.hide(editDiv);
		textDiv.removeChild(text);
		text = JSKitLib.text(self.obj[self.property] || defaultText);
		textDiv.appendChild(text);
	}

	this.editMode = function(e) {
		if(!self.editModeEventEnabled) JSKitLib.stopEventPropagation(e);
		JSKitLib.hide(textDiv);
		JSKitLib.show(editDiv, "inline");
		edit.focus();
		edit.select();
	}

	var applyChanges = function() {
		if(typeof self.jsk$validate == "function" && !self.jsk$validate(edit.value)) return;
		if(edit.value == self.obj[self.property]) { self.displayMode(); return;}
		if(edit.value.length > maxTextLength) {
			alert("The text you entered cannot exceed "+ maxTextLength +" symbols");
			resetChanges();
			return;
		}
		self.obj[self.property] = edit.value = JSKitLib.trim(edit.value);
		if(isFocused) edit.blur();
		self.displayMode();
		if(self.jsk$wasEdited) self.jsk$wasEdited();
	}

	this.resetChanges = function() {
		edit.value = self.obj[self.property];
		if(isFocused) edit.blur();
		self.displayMode();
	}

	var jumpNextSibling = function() {
		if(isFocused) edit.blur();
		if(self.nextSib)
			self.nextSib.editMode();
	}

	var jumpPrevSibling = function() {
		if(isFocused) edit.blur();
		if(self.prevSib)
			self.prevSib.editMode();
	}

	if(this.dblclick)
		textDiv.ondblclick = this.editMode;
	else
		textDiv.onclick = this.editMode;
	edit.onblur = function() { applyChanges(); isFocused = false; };
	edit.onfocus = function() { isFocused = true; };
	edit.onclick = function(e) { JSKitLib.stopEventPropagation(e); }
	if (!this.hideApplyBtn) applyDiv.onmousedown = applyChanges;

	new JSKbdHandler(edit, [
					{action:applyChanges, keys:[10,13]}
					,{action:this.resetChanges, keys:[27]}
					,{action:jumpNextSibling, keys:[9], shift:false}
					,{action:jumpPrevSibling, keys:[9], shift:true}
					]);
}

JSIPE2.prototype.addNextSibling = function(next) {
	if (next) {
		this.nextSib = next;
		next.prevSib = this;
	}
}





function JSIPE(obj) {
	var self = this;
	self.obj = obj;
	var form = this.makeForm(obj.title);
	var inp = form.input;
	self.form = form;

	form.cleaner.onmousedown = function(e){
		inp.value = "";
		form.cleaner.style.visibility = "hidden";
		inp.focus();
		JSKitLib.preventDefaultEvent(e || window.event);
	}
	
	var keyHandler = function(e) {
		e = e || window.event;
		setTimeout(function(){
			form.cleaner.style.visibility = (inp.value.length != 0) ? "visible" : "hidden";
			if(obj.type == "Tab" || obj.type == "Image") form.cleaner.style.display = "none";
		}, 0);
		switch(e.keyCode || e.which) {
			case 27:
				JSKitLib.preventDefaultEvent(e);
				if(obj.mode == "full") self.finishEditing(obj.field, obj.field.lastValue);
				if(obj.jsk$on_cancel_exit) obj.jsk$on_cancel_exit();
			break;
			case 10: case 13:
				JSKitLib.preventDefaultEvent(e);
				if (inp.value && obj.mode == "full")
					self.finishEditing(obj.field, inp.value);
				if(obj.jsk$on_submit_exit) obj.jsk$on_submit_exit(inp.value);
			break;
			case 9:
				JSKitLib.preventDefaultEvent(e);
				if (obj.siblings) obj.siblings[(obj.field.pos+1)%obj.siblings.length].tabKeyHandler();
			break;
		}
	}
	self.addKeyHndl(keyHandler);		
	if (obj.inpSize) inp.style.width = obj.inpSize;
	form.cleaner.style.visibility = "hidden";
	if(obj.mode == "form") return form;

	if(!window.jsipe$glob) window.jsipe$glob = {};
	var glob = window.jsipe$glob;
	obj.field.style.cursor = "pointer";
	if(obj.siblings) obj.field.pos = obj.siblings.length;

	this.finishEditing = function(field, newValue) {
		if(!field.input) return;
		glob.isEditing = false;
		field.input.onblur = JSKitLib.isOpera() ? undefined : "";
		field.input.onkeypress = JSKitLib.isOpera() ? undefined : "";
		field.input = null;
		field.wasEdited(newValue);
		field.style.textDecoration = field.oldDecoration;
	}

	var onclickHandler = function() {
		if(obj.field.input) return false;
		if(obj.jsipe$start && !obj.jsipe$start()) return false;
		if(glob.stopEditing) glob.stopEditing();
		if(obj.containerElement.tId) {
			clearTimeout(obj.containerElement.tId);
			obj.containerElement.tId = 0} 
		obj.field.oldDecoration = obj.field.style.textDecoration;
		obj.field.isHtmlLink = obj.field.firstChild.tagName == 'A';
		obj.field.lastValue = obj.itemObject[obj.Property];
		obj.field.ondblclick = JSKitLib.isOpera() ? undefined : "";
		inp.type = 'text';
		inp.value = obj.itemObject[obj.Property];
		self.addKeyHndl(keyHandler);		

		inp.onblur = function(e) {
			if(self.form.input.value) {
				self.finishEditing(self.obj.field, self.form.input.value);
				if (obj.field.lastValue == self.form.input.value) {
					if(obj.jsk$on_cancel_exit) obj.jsk$on_cancel_exit(self.form.input.value)}
				else{
					if(obj.jsk$on_submit_exit) obj.jsk$on_submit_exit(self.form.input.value)}
			};
			//Do not close field until non-empty
		}

		obj.field.input = inp;
		glob.stopEditing = function() {
			glob.stopEditing = null;
			if((obj.field.input)&&obj.field.input.value) self.finishEditing(obj.field, obj.field.input.value);
		}
		JSKitLib.removeChildren(obj.field);
		obj.field.appendChild(form.main);
		obj.field.style.textDecoration = "none";
		form.cleaner.style.visibility = (inp.value.length != 0) ? "visible" : "hidden";
		if(obj.type == "Tab"  || obj.type == "Image") form.cleaner.style.display = "none";
		inp.onselectstart = function(e) {
			JSKitLib.stopEventPropagation(e || window.event);
			return true;
		};
		obj.containerElement.onselectstart = function(e) { return true };
		inp.focus();
		inp.select();
		glob.isEditing = true;
		return false;
	}

	var ondblclickHandler = function() {
		if(0 && obj.field.isHtmlLink)
			window.location.href = this.firstChild.value;
	}

	switch(obj.type) {
	case "Tab":
		obj.field.ondblclick = onclickHandler;
		break;
	case "Others":
                obj.field.onclick = onclickHandler;
                obj.field.tabKeyHandler = onclickHandler;
                obj.field.ondblclick = ondblclickHandler;
		break;
	case "Search": case "Image":
		obj.field.onclick = onclickHandler;
		break;
	}
}

JSIPE.prototype.addKeyHndl = function(keyHandler){
	var inp = this.form.input;
        switch(this.obj.type) {
        case "Tab":
                if (JSKitLib.isIE()) inp.onkeydown = keyHandler;
                else if(JSKitLib.isSafari()) inp.onkeyup = keyHandler;
                else inp.onkeypress = keyHandler;
                break;
        case "Others": case "Image":
		if(JSKitLib.isOpera()) inp.onkeypress = keyHandler;
		else inp.onkeydown = keyHandler;
                break;
        case "Search":
		if (JSKitLib.isIE() || JSKitLib.isSafari())
			inp.onkeydown = keyHandler;
		else inp.onkeypress = keyHandler;
                break;
        }
}

JSIPE.prototype.makeForm = function(title){
	var text = this.dtContent.replace(/TITLE/, title || "");
	var div = JSKitLib.html(text);
	var ctls = JSKitLib.mapClass2Object({}, div);
	if(!title) ctls['js-JSIPETitle'].style.display = "none";
	return {'main': div,'input': ctls['js-JSIPEInput'], 'cleaner':ctls['js-JSIPECleaner']};
}

JSIPE.prototype.dtContent
='<table border=0 style="padding: 0px; display: inline" cellspacing="0px" cellpadding="0px">'
+'      <tr>'
+'              <td class="js-JSIPETitle" style="padding:0px 4px 0px 0px; cursor: text;"><b>TITLE</b></td>'
+'              <td style="padding: 0px;">'
+'                      <input class="js-JSIPEInput" style="vertical-align:middle; padding: 0px;"></input></td>'
+'              <td style="padding: 0px;">'
+'                      <img class="js-JSIPECleaner" style="margin-left: 4px; vertical-align:bottom; cursor: pointer;" src="//cdn.js-kit.com/images/clear-search-button.gif" width="16" height="16"></img></td>'
+'      </tr>'
+'</table>';





if(!window.JSKW$Events){
        var JSKW$Events = new JSEC();
}

/////////////////////////////////////
// JS Event Class
/////////////////////////////////////
function JSEC() {
	this.contextHandles = [];
}

JSEC.prototype.registerEventCallback = function (contextHandle, eventHandle, eventName) {
	if(!contextHandle) {
		contextHandle = new JSECC(eventHandle, eventName);
		this.contextHandles.push(contextHandle);
		contextHandle.cHdlId = this.contextHandles.length - 1;
	} else {
		contextHandle.registerEventCallback(eventHandle, eventName);
	}
	return contextHandle;
}

JSEC.prototype.deRegisterEventCallback = function (contextHandle, eventHandle, eventName) {
	contextHandle.deRegisterEventCallback(eventHandle, eventName);
}

JSEC.prototype.syncBroadcast = function (eventName) {
	var args = arguments;
	JSKitLib.fmap(this.contextHandles, function(c){
		if(c) c.broadCast.apply(c, args);
	});
}

JSEC.prototype.asyncBroadcast = function (eventName) {
	var self = this;
	var args = arguments;
	setTimeout(function(){
		self.syncBroadcast.apply(self, args);
	}, 0);
}

JSEC.prototype.invalidateContext = function (contextHandle) {
	if(contextHandle) {
		contextHandle.invalidateContext();
		delete this.contextHandles[contextHandle.cHdlId];
	}
}

/////////////////////////////////////
// JS Event Context Class
/////////////////////////////////////
function JSECC(eventHandle, eventName) {
	this.registeredCallbacks = [];
	if(eventName || eventHandle) this.registerEventCallback(eventHandle, eventName);
}

JSECC.prototype.registerEventCallback = function (eventHandle, eventName) {
	var ev = eventName || '';
	if(!this.registeredCallbacks[ev]) this.registeredCallbacks[ev] = [];
	this.registeredCallbacks[ev].push(eventHandle);
}

JSECC.prototype.deRegisterEventCallback = function (eventHandle, eventName) {
	var ev = eventName || '';
	var self = this;
	if(!eventHandle) {
		delete this.registeredCallbacks[ev];
		return;
	}
	var k=0;
	while(k<this.registeredCallbacks[ev].length) {
		if(this.registeredCallbacks[ev][k] == eventHandle) {
			self.registeredCallbacks[ev].splice(k, 1);
		} else k++;
	}
	if(!this.registeredCallbacks[ev].length) delete this.registeredCallbacks[ev];
}

JSECC.prototype.invalidateContext = function () {
	this.registeredCallbacks = [];
	try {
		if(this.jsk$invalidate) this.jsk$invalidate();
	} catch(e) { ; };
}

JSECC.prototype.broadCast = function (eventName) {
	var self = this;
	var ar = [''];
	var args = arguments;
	if(eventName!='') ar.push(eventName);
	JSKitLib.fmap(ar, function(ev){
		if(self.registeredCallbacks[ev]) JSKitLib.fmap(self.registeredCallbacks[ev], function(evHdl){
			evHdl.apply(self, args);
		});
	});
}





function JSPGC(itemsCount, itemsPerPage) {
	this.itemsPerPage = itemsPerPage;
	this.items = [];
	this.itemsCount = 0;
	this.pages = [];
	this.pageCount = 0;
	this.setPageCount(this.getPageCntByItemCnt(itemsCount), itemsCount);
}

JSPGC.prototype.newItem = function(item) {
	var newItem = { obj: undefined, html: undefined, div: undefined };
	if(item) JSKitLib.fmap(item, function(V,K){ newItem[K] = V; });
	return newItem;
};

JSPGC.prototype.setItems = function (sIdx, Cnt, itemsArr) {
	for(var i=sIdx; i<sIdx+Cnt; i++) {
		this.items[i] = itemsArr[i-sIdx];
	}
}

JSPGC.prototype.addItem = function (item, sIdx) {
	this.items.splice(sIdx, 0, item);
	this.itemsCount++;
}

JSPGC.prototype.getItems = function (sIdx, Cnt) {
	return (sIdx>=0 && Cnt) ? this.items.slice(sIdx, sIdx+Cnt) : [];
}

JSPGC.prototype.deleteItems = function (sIdx, Cnt) {
	var items = this.getItems(sIdx, Cnt);
	var res = 0;
	JSKitLib.fmap(this.getItems(sIdx, Cnt), function(e) {
		res += (e && e.obj && 
			e.obj.status!='D' && e.obj.status!='DT') ? 1 : 0;
			});
	this.items.splice(sIdx, Cnt);
	this.itemsCount -= Cnt;
	return res;
}

JSPGC.prototype.setItemsCount = function (newItemsCount) {
	if(newItemsCount<this.itemsCount) {
		this.deleteItems(newItemsCount, this.itemsCount-newItemsCount);
	} else {
		if(newItemsCount>0) this.items[newItemsCount-1] = undefined;
		this.itemsCount = newItemsCount;
	}
}

JSPGC.prototype.getItemIdxById = function (itemId) {
	var itemIdx;
	for(var i=0; i<this.itemsCount; i++) {
		if(this.items[i] && this.items[i].obj.ID==itemId) {
			itemIdx = i;
			break;
		}
	}
	return itemIdx;
}

JSPGC.prototype.invalidateItemsAttr = function(itemIdx, Cnt, Attr) {
	JSKitLib.fmap(this.getItems(itemIdx, Cnt), function(item) {
		item[Attr] = undefined;
	});
}

JSPGC.prototype.invalidateItems = function(itemIdx, Cnt) {
	var items = this.getItems(itemIdx, Cnt);
	JSKitLib.fmap(items, function(V,K) {
		items[K] = undefined;
	});
}

JSPGC.prototype.newPage = function (page) {
	var newPage = {invalidVisualization: true, invalidData: true};
	if(page) JSKitLib.fmap(page, function(V,K){ newPage[K] = V; });
	return newPage;
}

JSPGC.prototype.addPage = function (page) {
	this.pages[this.pages.length] = page || this.newPage();
	this.pageCount++;
}

JSPGC.prototype.deletePage = function () {
	delete this.pages[this.pages.length];
	this.pageCount--;
}

JSPGC.prototype.getPages = function (pageIdx, Cnt) {
	return (pageIdx>=0 && Cnt) ? this.pages.slice(pageIdx, pageIdx+Cnt) : [];
}

JSPGC.prototype.getPage = function (pageIdx) {
	var pageArr = this.getPages(pageIdx, 1);
	return (pageArr.length>0) ? pageArr[0] : undefined;
}

JSPGC.prototype.getStartPageItem = function (pageIdx) {
	return pageIdx * this.itemsPerPage;
}

JSPGC.prototype.setPageCount = function (newPageCount, newItemsCount) {
	while(this.pageCount<newPageCount) this.addPage();
	while(this.pageCount-newPageCount>0) this.deletePage();
	this.pageCount = newPageCount;
	this.setItemsCount(newItemsCount);
	if(!newItemsCount && newPageCount) this.setPageAttr(0, 1, {invalidData: false});
}

JSPGC.prototype.getPageAttr = function (pageIdx, Attr) {
	var page = this.getPage(pageIdx);
	return page ? page[Attr] : undefined;
}

JSPGC.prototype.setPageAttr = function (pageIdx, Cnt, Attrs) {
	JSKitLib.fmap(this.getPages(pageIdx, Cnt),
		function(curPage) {
			JSKitLib.fmap(Attrs, function(V,K){ curPage[K] = V }) 
		});
}

JSPGC.prototype.getPageByItemIdx = function(index) {
	return Math.floor(index/this.itemsPerPage);
}

JSPGC.prototype.getPageCntByItemCnt = function(itemCnt) {
	return Math.ceil(itemCnt/this.itemsPerPage);
}

JSPGC.prototype.setPageItems = function (startPage, newData) {
	var pageCount = this.getPageCntByItemCnt(newData.length);
	this.setPageAttr(startPage, pageCount, {invalidData: false, invalidVisualization: true});
	var startItem = this.getStartPageItem(startPage);
	var self = this;
	this.setItems(startItem, newData.length, JSKitLib.fmap(newData, function(C){ return self.newItem({obj: C}); }));
}

JSPGC.prototype.addPageItem = function (item, itemIdx) {
	if(this.pageCount*this.itemsPerPage==this.itemsCount) {
		this.addPage();
		this.setPageAttr(this.pageCount-1, 1, {invalidData: false});
	}
	var idx = (typeof itemIdx == "undefined") ? this.itemsCount : itemIdx;
	this.addItem(item, idx);
	var insertPageIdx = this.getPageByItemIdx(idx);
	this.setPageAttr(insertPageIdx, this.pageCount-insertPageIdx, { invalidVisualization: true});
	for(var i=insertPageIdx+1; i<this.pageCount; i++) {
		if(!this.getPageAttr(i, 'invalidData')) {
			if(!(this.getPageItems(i)[0])) {
				this.setPageAttr(i, 1, {invalidData: true});
			}
		}
	}
}

JSPGC.prototype.deletePageItem = function (itemIdx) {
	var deletePageIdx = this.getPageByItemIdx(itemIdx);
	var res = this.deleteItems(itemIdx, 1);
	this.setPageAttr(deletePageIdx, this.pageCount-deletePageIdx, { invalidVisualization: true});
	for(var i=deletePageIdx; i<this.pageCount-1; i++) {
		if(!this.getPageAttr(i, 'invalidData')) {
			var itemsCnt = this.getPageItemsCnt(i);
			if(!(this.getPageItems(i)[itemsCnt-1])) {
				this.setPageAttr(i, 1, {invalidData: true});
			}
		}
	}
	if((this.pageCount-1)*this.itemsPerPage==this.itemsCount && this.pageCount>1) this.deletePage();
	return res;
}

JSPGC.prototype.getPageItems = function (pageIdx) {
	var startItem = this.getStartPageItem(pageIdx);
	var itemsCnt = this.getPageItemsCnt(pageIdx);
	return this.getItems(startItem, itemsCnt);
}

JSPGC.prototype.invalidatePagesView = function (pageIdx, Cnt) {
	this.setPageAttr(pageIdx, Cnt, {invalidVisualization: true});
}

JSPGC.prototype.invalidatePages = function (pageIdx, Cnt) {
	for(var i=0; i<Cnt; i++) {
		var startItem = this.getStartPageItem(pageIdx+i);
		var itemsCnt = this.getPageItemsCnt(pageIdx+i);
		this.invalidateItems(startItem, itemsCnt);
	}
	this.setPageAttr(pageIdx, Cnt, {invalidData: true, invalidVisualization: true});
}

JSPGC.prototype.newData = function (newItemsCount, startPage, newData) {
	var newPageCount = this.getPageCntByItemCnt(newItemsCount);
	this.setPageCount(newPageCount || 1, newItemsCount);
	this.setPageItems(startPage, newData);
}

JSPGC.prototype.addNewItem = function (obj, itemId, isPrepend) {
	var item = this.newItem();
	item.obj = obj;
	this.addPageItem(item, itemId ? this.getItemIdxById(itemId) + (isPrepend ? 0 : 1) : undefined);
}

JSPGC.prototype.deleteItem = function (itemId) {
	return this.deletePageItem(this.getItemIdxById(itemId));
}

JSPGC.prototype.getPageVisualization = function (pageIdx, cb) {
	var self = this;
	if(pageIdx<0 || pageIdx>=this.pageCount) return cb(undefined);
	var curPage = this.getPage(pageIdx);
	var getPageFunc = function(){ self.getPageVisualization(pageIdx, cb); };
	if(this.getPageAttr(pageIdx, 'invalidData'))
		return this.dataRequest(pageIdx, curPage, cb);
	if(this.getPageAttr(pageIdx, 'invalidVisualization')) {
		curPage.invalidVisualization = false;
		return this.dataVisualizator(this.getStartPageItem(pageIdx), this.getPageItems(pageIdx), curPage, getPageFunc);
	}
	return cb(this.getPage(pageIdx).target, true);
}

JSPGC.prototype.getPageItemsCnt = function(pageIdx) {
	if(pageIdx<0 || pageIdx>=this.pageCount) return 0;
	return (pageIdx==this.pageCount-1 ? (this.itemsCount-pageIdx*this.itemsPerPage) : this.itemsPerPage);
}

JSPGC.prototype.getItemById = function(itemId) {
	var itemsArr = this.getItems(this.getItemIdxById(itemId), 1);
	return (itemsArr.length>0) ? itemsArr[0] : undefined;
}

JSPGC.prototype.getPageByItemId = function(itemId) {
	return this.getPageByItemIdx(this.getItemIdxById(itemId));
}

JSPGC.prototype.getFirstItem = function () {
	if(this.itemsCount) {
		var itemsArr = this.getItems(0, 1);
		return (itemsArr.length>0) ? itemsArr[0] : undefined;
	} else {
		return undefined;
	}
}

JSPGC.prototype.invalidateItemView = function (itemId) {
	var itemIdx = this.getItemIdxById(itemId);
	this.invalidateItemsAttr(itemIdx, 1, 'html');
	var pageIdx = this.getPageByItemIdx(itemIdx);
	this.invalidatePagesView(pageIdx, 1);
}

JSPGC.prototype.invalidate = function () {
	this.invalidatePages(0, this.pageCount);
}





//////////////////// JSRVC
// requestObj
// request: {uri: someuri, param1: val1, param2: val2, ...}
// [transport: ("GET" | "POST")]
// [target: some_DOM_element]
// [variableRequest: [{param1_1: val1_1, param1_2: val1_2, ...},
//			{param2_1: val2_1, param2_2: val2_2,...}, ...]]
// [form: some_form]
// [onreturn: some_callback]
// [randevu : (true | false)]
// [requestId: some request identity]
// [trailer: specifies the name of parameter which should terminate
//						each sub-request of multi-request]

function JSRVC(requestObj) {
	var s = this;
	s.requestId = requestObj.requestId || s.generateRequestId();
	s.requestsInProgress = 0;
	s.requestsQueue = [];
	s.trailer = requestObj.trailer;
	s.processRequest(requestObj);
}

JSRVC.prototype.generateRequestId = function() {
	return ((new Date()).valueOf() + Math.random()).toString();
}

JSRVC.prototype.processRequest = function(requestObj) {
	var s = this;
	s.error = undefined;
	if(s.requestsInProgress) {
		s.requestsQueue.push(requestObj);
		return;
	}
	s.requestObj = requestObj;
	if(s.requestObj.pickup && !s.eventCtx) s.eventCtx = JSKW$Events.registerEventCallback(s.eventCtx, function() {s.eventCallback.apply(s, arguments);}, "randevu_answer");
	var req = s.requestObj;
	s.preProcessRequest();
	if(!req.transport)
		req.transport = req.form ? "POST" : s.getRequestTransport();
	req.target = req.target || document.body;
	var onCompleteCB = req.timeout ? function() {
		s.startTimeoutTimer.call(s);
	} : undefined;
	var handlers = {'onload': s.onLoadRequest, 'onreadystatechange': s.onLoadRequest};
	switch(req.transport) {
	case "GET":
		s.processGETRequest(onCompleteCB, handlers);
		break;
	case "POST":
		s.processPOSTRequest(onCompleteCB, handlers);
		break;
	}
}

JSRVC.prototype.preProcessRequest = function() {
	var req = this.requestObj;
	if(!req.request) req.request = {};
	JSKitLib.fmap(req.epb || {}, function(v, k) { req.request[k] = v; });
	if (req.ref) req.request.ref = req.ref;
	req.request.randevuId = this.requestId;
	if(!req.variableRequest) req.variableRequest = [];
	if(req.pickup) req.request.randevuRnd = Math.random();
}

JSRVC.prototype.calcGetRequest = function() {
	var s = this;
	var req = s.requestObj;
	var reqvar = req.variableRequest;
	var permGETReq = s.serializeRequest(req.request);
	var varGETReq = JSKitLib.fmap(reqvar, function(el, idx){
		return s.serializeRequest(el, '[' + idx + ']');
	});
	return [permGETReq, varGETReq];
}

JSRVC.prototype.getRequestTransport = function() {
	var ser = this.calcGetRequest();
	var permReq = ser[0];
	var varReq = ser[1];
	var firstReqLen = permReq.length +
		(varReq.length>0 ? varReq[0].length : 0);
	var totalReqLen = 0;
	for(var i=0; i<varReq.length; i++)
		totalReqLen += varReq[i].length;
	
	return ((firstReqLen > 1700) || (totalReqLen > 3400) ?
		"POST" : "GET");
}

JSRVC.prototype.startTimeoutTimer = function() {
	var s = this;
	if(s.timeoutTimer) clearTimeout(s.timeoutTimer);
	s.timeoutTimer = setTimeout(function() { s.timeoutExpired(); }, s.requestObj.timeout);
}

JSRVC.prototype.timeoutExpired = function() {
	this.timeoutTimer = undefined;
	this.error = "timeout";
	this.returnAnswer();
}

JSRVC.prototype.returnAnswer = function(answerData) {
	var s = this;
	answerData = answerData || {};
	if(answerData.script) {
		var script = document.createElement('script');
		script.text = answerData.script;
		this.requestObj.target.appendChild(script);
	}
	if(s.requestObj.onreturn) {
		s.requestObj.onreturn.call(s, s.error || "data", answerData.data);
	}
}

JSRVC.prototype.serializeRequest = function(obj, prefix) {
	var s = this;
	var toString = function(k, v) {
		return encodeURIComponent(k) + (prefix || '') + "=" + encodeURIComponent(v);
	};
	var request = JSKitLib.fmap(obj, function(v, k) {
		if (s.trailer != k) return toString(k, v);
	});
	if (s.trailer && typeof(obj[s.trailer]) != "undefined") {
		request.push(toString(s.trailer, obj[s.trailer]));
	}
	return request.join("&");
}

JSRVC.prototype.setElementAttributes = function(obj, attrs) {
	var s = this;
	if (!obj) return;
	JSKitLib.fmap(attrs, function(v, k) {
		obj[k] = function() { v.call(s, obj) };
	});
}

JSRVC.prototype.runScript = function(src, data, handlers) {
	var script = document.createElement('script');
	this.setElementAttributes(script, handlers);
	script.setAttribute("charset", "utf-8");
	script.setAttribute("src",  src + (data ? '?' + data : ''));
	this.requestsInProgress++;
	this.requestObj.target.appendChild(script);
	this.script = script;
}

JSRVC.prototype.processGETRequest = function(onCompleteCB, handlers) {
	var s = this;
	var ser = s.calcGetRequest();
	var reqperm = ser[0];
	var reqpermlen = reqperm.length;
	var reqvar = ser[1];
	var reqvarlen = reqvar.length;
	var currequest = '';
	for(var i=0; i<reqvarlen; i++) {
		currequest += '&' + reqvar[i];
		if(currequest.length + reqpermlen +
			(i+1<reqvarlen ? reqvar[i+1].length : 0) > 2000) {
			s.runScript(s.requestObj.uri,
				reqperm + currequest, handlers);
			currequest = '';
		}
	}
	if((currequest) || (!reqvarlen))
		s.runScript(s.requestObj.uri,
			reqperm + '&' + currequest, handlers);
	if(onCompleteCB) onCompleteCB();
}

JSRVC.prototype.processPOSTRequest = function(onCompleteCB, handlers) {
	var s = this;
	var req = s.requestObj.request;
	var reqvar = s.requestObj.variableRequest;
	var reqvarlen = s.requestObj.variableRequest.length;
	var createForm = function() {
		var iframe = 'js-ifrm-' + Math.random();
		var ifr = JSKitLib.createHiddenIframe(iframe, s.requestObj.target);
		var doc = ifr.contentDocument ? ifr.contentDocument : ifr.document;
		var f = doc.createElement('FORM');
		f.doc = doc;
		if(JSKitLib.isIE()) doc.charset = "utf-8";
		f.target = iframe;
		JSKitLib.timedRetry({
				timeout: 100,
				maxRetries: 50,
				onSuccess: function() {
						doc.body.appendChild(f); },
				pred: function() { return !!doc.body; }
			});
		return f;
	};
	var getForm = function() {
		return (s.requestObj.form && !reqvarlen) ?
			s.requestObj.form : createForm();
	}
	var fillForm = function(form, obj) {
		form.method  = 'POST';
		form.enctype = "application/x-www-form-urlencoded";
		form.acceptCharset = 'UTF-8';
		form.action  = s.requestObj.uri;
		JSKitLib.fmap(obj, function(v, k) {
			var frmel = (form.doc || document).createElement('INPUT');
			frmel.type = "hidden";
			frmel.name = k;
			frmel.value = v;
			form.appendChild(frmel);
		});
	}
	var postRequest = function(pobj, vobj) {
		var form = getForm();
		fillForm(form, pobj);
		if(vobj) fillForm(form, vobj);
		if (form.target) s.setElementAttributes(document.getElementById(form.target), handlers);
		JSKitLib.fmap(handlers, function(v, k) {
			form[k] = v;
		});
		s.requestsInProgress++;
		JSKitLib.timedRetry({
				timeout: 100,
				maxRetries: 50,
				onSuccess: function() {
						form.submit(); },
				pred: function() {
					return (form.parentNode &&
						form.parentNode.nodeType!=11); }
			});
	}
	JSKitLib.fmap(reqvar, function(v) {
		postRequest(req, v);
	});
	if(!reqvarlen) postRequest(req);
	if(onCompleteCB) onCompleteCB();
}

JSRVC.prototype.onLoadRequest = function(el) {
	var s = this;
	if(el.readyState && el.readyState != 'loaded'
		&& el.readyState != 'complete') return;
	el.onreadystatechange = el.onload = null;
	if(!s.requestObj.pickup) {
		s.requestObj.checked = true;
		s.requestsInProgress--;
	}
	s.postProcessRequest();
}

JSRVC.prototype.postProcessRequest = function(source, data) {
	var s = this;
	if(s.requestObj.pickup && source!="pickup") return;
	if(s.requestObj.randevu && !s.error && s.requestObj.transport == "POST") {
		s.processRequest({
			'uri': '//js-kit.com/api/server-answer.js',
			'ref': s.requestObj.ref,
			'epb': s.requestObj.epb,
			'pickup': true,
			'onreturn': s.requestObj.onreturn,
			'target': s.requestObj.target});
		return;
	}
	s.returnAnswer(data);
	if(!s.requestsInProgress) {
		if(s.timeoutTimer) {
			clearTimeout(s.timeoutTimer);
			s.timeoutTimer = undefined;
		}
		if(s.requestsQueue.length && !s.error)
			s.processRequest(s.requestsQueue.pop());
	}
}

JSRVC.prototype.eventCallback = function(eventName, randevuId, status, data) {
	if(this.requestId != randevuId) return;
	this.requestsInProgress--;
	if(this.script && this.script.parentNode) {
		this.script.parentNode.removeChild(this.script);
		this.script = undefined;
	}
	switch(status) {
	case "ready":
		if(this.eventCtx) {
			JSKW$Events.invalidateContext(this.eventCtx);
			this.eventCtx = undefined;
		}
		this.postProcessRequest("pickup", data);
		break;
	case "timeout":
		if(this.error) {
			this.returnAnswer(data);
		} else {
			this.processRequest(this.requestObj);
		}
		break;
	case "exceeded": 
		this.error = "attempts_number_exceeded";
		this.returnAnswer(); 
		break;
	}
}

JSRVC.prototype.cancelRequest = function() {
	this.error = 'canceled';
}





function JSKitModalDialog(content, config) {
	this.config = config;
	this.content = content;
	this.backdrop = JSKitLib.html('<div class="js-kit-modal-dialog-backdrop"></div>');
	this.loadCSS();
	JSKitLib.hide(this.backdrop);
	JSKitLib.addChild(document.body, this.backdrop, true);
	JSKitLib.setOpacity(this.backdrop, 0.5);
}

JSKitModalDialog.prototype.open = function() {
	if (!this.container) {
		var pos = JSKitLib.calcCenterPos(this.config.width, this.config.height);
		this.container = JSKitLib.html('<div class="' + this.config.cssClass + ' js-kit-modal-dialog-container"></div>');
		JSKitLib.addStyle(this.container,
			"width: " + this.config.width + "px;" +
			"height: " + this.config.height + "px;" + 
			"left: " + pos[0] + "px;" + 
			"top: " + pos[1] + "px;");
		JSKitLib.addChild(this.container, this.content);
		JSKitLib.addChild(document.body, this.container, true);
	}
	JSKitLib.show(this.backdrop);
	JSKitLib.show(this.container);
}

JSKitModalDialog.prototype.close = function() {
	JSKitLib.hide(this.container);
	JSKitLib.hide(this.backdrop);
}

JSKitModalDialog.prototype.loadCSS = function() {
	JSKitLib.addCss(
		".js-kit-modal-dialog-container { position: absolute; z-index: 12000; background: #FFFFFF; }" +
		".js-kit-modal-dialog-backdrop { opacity: 0; background-color: #404040; z-Index: 11500; " +
			(JSKitLib.isPreIE8()
			? "filter:progid:DXImageTransform.Microsoft.Alpha(opacity='0'); position: absolute; top: expression(eval(-(document.body.offsetTop + (document.body.offsetHeight - document.body.clientHeight)/2))); left: expression(eval(-(document.body.offsetLeft + (document.body.offsetWidth - document.body.clientWidth)/2))); height: expression(eval(Math.max(document.body.offsetHeight, document.documentElement.scrollHeight))); width: expression(eval(Math.max(document.body.offsetWidth, document.documentElement.scrollWidth)));"
			: "position: fixed; left: 0; top: 0; height: 100%; width: 100%; -webkit-transition: opacity 0.5s ease-out;" ) +
		"", "modalDialog");
}





function JSKitUniversalObject() {}

JSKitUniversalObject.prototype.applyProperties = function(properties, sourceObject) {
	var obj = sourceObject || this;
	JSKitLib.fmap(properties || {}, function(value, name) { obj[name] = value; });
}

JSKitUniversalObject.prototype.applyConfig = function() {
	var self = this;
	var args = arguments;
	this._config = JSKitLib.foldl({}, ["basic", "local", "global"], function(name, container, idx) { container[name] = args[idx] || {}; });
	return {
		"set" : function(key, value) { self._config.local[key] = value; },
		"get" : function(key, defaultValue) { return self._config.local[key] || self._config.global[key] || defaultValue || self._config.basic[key] || ""; }
	};
}

JSKitUniversalObject.prototype.assemble = function(template, layoutBlocksPrefix, descriptors) {
	var content = JSKitLib.html(template);
	var components = JSKitLib.mapClass2Object({}, content);
	var structure = {
		"get" : function(name, noPrefix) { return components[((noPrefix) ? "" : layoutBlocksPrefix + "-") + name]; },
		"content" : content
	};
	JSKitLib.fmap(components, function(component, id) {
		var pattern = id.match(layoutBlocksPrefix + "-(.*)");
		var descriptor = (pattern) ? pattern[1] : undefined;
		if (descriptor && typeof(descriptors[descriptor]) == "function") {
			var node = descriptors[descriptor](component);
			if (node) component.appendChild(node);
		}
	});
	return structure;
}

JSKitUniversalObject.prototype.data2DOM = function(data, target) {
	var dom;
	switch (typeof(data)) {
		case "function" : dom = data(target); break;
		case "string"   : dom = JSKitLib.html("<div>" + data + "</div>"); break;
		default : dom = data;
	}
	return dom;
}

JSKitUniversalObject.prototype.processCallback = function(name, sourceObject) {
	var obj = sourceObject || this;
	if (obj.callbacks && obj.callbacks.hasOwnProperty(name)) obj.callbacks[name]();
}

JSKitUniversalObject.prototype.append = function(element, content) {
	JSKitLib.removeChildren(element);
	element.appendChild(content);
	return element;
}

JSKitUniversalObject.prototype.mergeObjects = function(master, slave) {
	return JSKitLib.foldl.call(this, master, slave, function(value, acc, name) {
		if (typeof(value) == "object") { 
			if (!master[name]) master[name] = {};
			this.mergeObjects(master[name], slave[name]); 
		} else { if (!acc[name]) acc[name] = value; }
	});
}





function JSKitUniversalContainer(content, options, callbacks, target) {
	if (!target) target = document.createElement("DIV");
	if (!target.parentNode) JSKitLib.addChild(document.body, target, true);
	this.config = this.applyConfig({
		"mode" : "popup",
		"size" : {"width" : "550", "height" : "500"},
		"title" : "Untitled",
		"opacity" : false,
		"backdrop" : "yes",
		"resizable" : "yes",
		"cssPrefix" : "",
		"sizeLimit" : {"width" : "550", "height" : "450"},
		"whiteLabel" : false,
		"contentOverflow" : "auto"
	}, options);
	this.applyProperties({
		"target" : target,
		"isOpen" : true,
		"callbacks" : callbacks || {},
		"imagesPath" : "//cdn.js-kit.com/images/container/"
	});
	this.loadCSS();
	this.render(content);
}

JSKitUniversalContainer.prototype = new JSKitUniversalObject();

JSKitUniversalContainer.prototype.render = function(content, title, isRerendering) {
	var self = this;
	this.applyProperties({
		"title" : title || self.config.get("title"),
		"content" : content || document.createElement("DIV")
	});
	this.dom = this.assemble(this.template, "jskit-container", this.prepareDescriptors());
	this.append(this.target, this.dom.content);
	JSKitLib.addClass(this.target, this.config.get("cssPrefix") + " js-kit-widgetsContainer js-kit-widgetsContainer-" + this.config.get("mode"));
	var dimensions = this.config.get("size", {
		"width" : self.dom.get("main").offsetWidth,
		"height" : self.dom.get("main").offsetHeight
	});
	if (!isRerendering) JSKitLib.addStyle(this.target, "width: " + parseInt(dimensions.width) + "px; height: " + parseInt(dimensions.height) + "px;");
	this.dom.get("content").style.overflow = this.config.get("contentOverflow");
	if (this.config.get("whiteLabel")) JSKitLib.hide(this.dom.get("poweredBy"));

	if (this.config.get("mode") == "popup") {
		new JSDL(this.target, [this.dom.get("header"), this.dom.get("footer")]);
		var opacity = this.config.get("opacity");
		if (opacity) {
			this.target.jsk$on_start_drag = function(e) { JSKitLib.setOpacity(this, opacity); };
			this.target.jsk$on_stop_drag = function(e) { JSKitLib.setOpacity(this, "1"); };
		}
		if (!isRerendering) {
			var calcPos = JSKitLib.calcCenterPos(dimensions.width, dimensions.height);
			var pos = this.config.get("position", {x: calcPos[0], y: calcPos[1]});
			JSKitLib.addStyle(this.target, "left: " + parseInt(pos.x) + "px; top: " + parseInt(pos.y) + "px;");
		}

		// make container resizable
		if (this.config.get("resizable") == "yes")
			this.makeResizableContainer(this.target, this.dom.get("resizeControl"), this.dom.get("content"));

		// display backdrop
		if (this.config.get("backdrop") == "yes") {
			if (!this.containerBackdrop) {
				this.containerBackdrop = JSKitLib.html('<div class="js-kit-containerBackdrop"></div>');
				JSKitLib.addChild(document.body, this.containerBackdrop, true);
			}
			JSKitLib.show(this.containerBackdrop);
			JSKitLib.setOpacity(this.containerBackdrop, 0.3);
		}
	}
	this.processCallback("onContainerOpened");
}

JSKitUniversalContainer.prototype.updateTitle = function(title) {
	this.append(this.dom.get("title"), this.data2DOM(title || this.config.get("title")));
}

JSKitUniversalContainer.prototype.makeResizableContainer = function(target, resizeCtrl, stretchBlock) {
	var self = this;
	var data;
	var limit = this.config.get("sizeLimit");
	var opacity = this.config.get("opacity");
	var useStretchBlock = JSKitLib.isPreIE7() || (JSKitLib.isIE() && document.compatMode == "BackCompat");
	var getMousePos = function(e) {
		var scroll = JSDL.prototype.getCurScroll();
		var mousePos = JSKitLib.getMousePosition(e);
		return {"x" : mousePos.x + scroll.scroll_left, "y" : mousePos.y + scroll.scroll_top};
	};
	var onStartResize = function(e) {
		data = {"pos" : getMousePos(e), "size" : {"width" : target.offsetWidth, "height" : target.offsetHeight}};
		JSKitLib.stopEventPropagation(e);
		JSKitLib.preventDefaultEvent(e);
		if (opacity) JSKitLib.setOpacity(target, opacity);
		JSKitLib.addHandlers(document, onResize, onEndResize);
	};
	var onResize = function(e) {
		var mousePos = getMousePos(e);
		target.style.width = Math.max(limit.width, data.size.width + mousePos.x - data.pos.x) + "px";
		target.style.height = Math.max(limit.height, data.size.height + mousePos.y - data.pos.y) + "px";
		if (useStretchBlock && stretchBlock) stretchBlock.style.width = target.style.width;
		JSKitLib.preventDefaultEvent(e);
	};
	var onEndResize = function(e) {
		data = undefined;
		if (JSKitLib.isOpera() || JSKitLib.isIE()) 
			target.style.width = (((useStretchBlock && stretchBlock) ? stretchBlock : target).offsetWidth - 1) + "px";
		if (opacity) JSKitLib.setOpacity(target, "1");
		JSKitLib.removeHandlers(document, onResize, onEndResize);
	};
	JSKitLib.addEventHandler(resizeCtrl, ["mousedown"], onStartResize);
}

JSKitUniversalContainer.prototype.close = function() {
	this.processCallback("onContainerBeforeClose");
	this.target.parentNode.removeChild(this.target);
	// Remove backdrop
	if (this.containerBackdrop) {
		JSKitLib.setOpacity(this.containerBackdrop, 0);
		JSKitLib.hide(this.containerBackdrop);
	}
	this.isOpen = false;
	this.processCallback("onContainerClosed");
}

JSKitUniversalContainer.prototype.getElement = function(name) { return this.dom ? this.dom.get(name) : false; }

JSKitUniversalContainer.prototype.prepareDescriptors = function() {
	var self = this;
	return {
		"title" : function() { return self.data2DOM(self.title || self.config.get("title")); },
		"content" : function() { return self.content; },
		"closeButton" : function(element) { self.assembleCloseButton(element); },
		"resizeControl" : function(element) { self.assembleResizeControl(element); },
		"closeButtonImg" : function(element) { if (self.config.get("mode") != "embedded") JSKitLib.addPNG(element, self.imagesPath + "closeWindow.png"); }
	};
}

JSKitUniversalContainer.prototype.assembleCloseButton = function(element) {
	var self = this;
	if (this.config.get("mode") != "embedded") {
		JSKitLib.notDraggable(element);
		element.onclick = function(e) {
			self.close();
			JSKitLib.stopEventPropagation(e);
		}
	} else JSKitLib.hide(element);
}

JSKitUniversalContainer.prototype.assembleResizeControl = function(element) {
	if (this.config.get("mode") != "embedded" && this.config.get("resizable") == "yes") {
		JSKitLib.addPNG(element, this.imagesPath + "resizeHandle.png");
		return;
	}
	JSKitLib.hide(element);
}

JSKitUniversalContainer.prototype.template =
 '<div class="jskit-container-main">' +
     '<div class="jskit-container-wrapper">' +
 	'<div class="jskit-container-header">' +
 	    '<div class="jskit-container-title"></div>' +
 	    '<div class="jskit-container-closeButton">' +
		'<div class="jskit-container-closeButtonImg"></div>' +
	    '</div>' +
 	    '<div class="js-kit-clear"></div>' +
 	'</div>' +
 	'<div class="jskit-container-content"></div>' +
 	'<div class="jskit-container-footer">' +
 	    '<div class="jskit-container-footerArea"></div>' +
	    '<div class="jskit-container-poweredBy"><a href="//js-kit.com/" target="_blank">Powered by JS-Kit</a></div>' +
 	    '<div class="js-kit-clear"></div>' +
 	'</div>' +
     '</div>' +
     '<div class="jskit-container-resizeControl">&nbsp;&nbsp;&nbsp;</div>' +
 '</div>';

JSKitUniversalContainer.prototype.loadCSS = function() {
	var oldStyleIE = JSKitLib.isPreIE8() || (JSKitLib.isIE() && !JSKitLib.isPreIE8() && document.compatMode == "BackCompat");
	JSKitLib.addCss(
		".js-kit-containerBackdrop { opacity: 0; background-color: #404040; z-Index: 13800; width: 100%; " + (oldStyleIE ? "filter:progid:DXImageTransform.Microsoft.Alpha(opacity='0'); position: absolute; top: expression(eval(document.documentElement.scrollTop ? document.documentElement.scrollTop : document.body.scrollTop) + 'px'); right: 0; bottom: 0; height: expression(eval(document.documentElement.clientHeight ? document.documentElement.clientHeight : document.body.clientHeight)); width: expression(eval(document.documentElement.clientWidth ? document.documentElement.clientWidth : document.body.clientWidth));" : "position: fixed; left: 0; top: 0; height: 100%; -webkit-transition: opacity 0.5s ease-out;" ) + "}" +
		".js-kit-widgetsContainer { " + (oldStyleIE ? "width: " + parseInt(this.config.get("size").width) + "px; height:" + parseInt(this.config.get("size").height) + "px;" : "") + " cursor: default; text-align: left; line-height: normal; color: #000000; font-weight: normal; }" +
		"div.js-kit-widgetsContainer a, div.js-kit-widgetsContainer a:visited { background-color: transparent; font-weight: normal; }" +
		".js-kit-widgetsContainer-embedded {}" +
		".js-kit-widgetsContainer-popup { position: absolute; -webkit-box-shadow: 0px 10px 50px #222; " + (JSKitLib.isGChrome() ? "" : "-webkit-border-radius: 7px;") + " z-Index: 14000; }" +
		".jskit-container-main { position: relative; font-family: Helvetica, sans-serif; background: #dfebf2; padding: 0px; " + (JSKitLib.isGChrome() ? "" : "-moz-border-radius: 7px; -webkit-border-radius: 7px;") + " border: 1px solid #C4CFD5; height: 100%; }" +
		".jskit-container-wrapper { " + (oldStyleIE ? "position: relative; border: 0px; height: 100%;" : "position: absolute; top: 0px; bottom: 0px; left: 0px; right: 0px; border: 5px solid #DFEBF2;") + " -moz-border-radius: 7px; -webkit-border-radius: 7px; }" +
		".jskit-container-header { height: 27px; " + (oldStyleIE ? "margin-top: 5px;" : "") + "}" +
		".jskit-container-title { float: left; font-size: 18px; font-weight: bold; margin: 0px 0px 2px 5px; color: #424242; width: 90%; overflow: hidden; height: 23px; }" +
		".jskit-container-closeButton { width: 18px; height: 18px; float: right; margin: 1px " + (JSKitLib.isIE() ? (JSKitLib.isPreIE7() ? "0" : "5") : "1") + "px 0px; color: #95a0a9; cursor: pointer; }" +
		".jskit-container-closeButtonImg { width: 10px; height: 10px; margin: 4px; }" +
		".jskit-container-content { " + (oldStyleIE ? "zoom: 1; position: relative; height: expression(eval(this.parentNode.offsetHeight - 63) + 'px'); width: expression(eval(this.parentNode.offsetWidth - 10) + 'px'); margin: 0px 5px;" : "position: absolute; top: 0px; bottom: 0px; margin : 32px 0px 25px 0px; width: 100%; -moz-border-radius: 5px;") + " padding: 0px; background: #FFFFFF; }" +
		".jskit-container-footer { " + (oldStyleIE ? "margin-right: 5px;" : "position: absolute; bottom: 0px; right: 0px;") + " width: 100%; }" +
		".jskit-container-footerArea { float: left; }" +
		".jskit-container-poweredBy { float: right; border: 0px; cursor: pointer; font-size: 10px; color: #808080; margin: 6px " + (JSKitLib.isPreIE7() ? "5" : "20") + "px 5px 0px; }" +
		"div.jskit-container-poweredBy a, div.jskit-container-poweredBy a:hover { font-size: 10px; color: #808080; text-decoration: none; background-color: transparent; }" +
		".jskit-container-resizeControl { position: absolute; " + (JSKitLib.isPreIE7() ? "top: expression(eval(this.parentNode.offsetHeight - 14) + 'px');" : "bottom: 0px;" ) + " right: 0px; width: 12px; height: 12px; cursor: se-resize; font-size: 10px; }" +
		".js-SettingsWindow { z-index: 16000 !important; }" +
		".js-kit-clear { clear: both; }", "universalContainer");
}





function jskEchoInit(ref, target) {
	return (window.JSK$Echo || (window.JSK$Echo = new JSKEcho(ref, target)));
}

function JSKEcho(ref, target) {
	var s = this;
	s.ref = ref;
	s.target = target;
	s.existingRenderers = [];
	s.subscribers = [];
	s.subscribeRequest = [];
	s.uriDomain = '//js-kit.com';
}

JSKEcho.prototype.getRendererById = function(rendererId) {
	var rs = this.existingRenderers;
	var rsl = rs.length;
	for(var i=0; i<rsl; i++) {
		if(rs[i].id==rendererId) return rs[i];
	}
}

JSKEcho.prototype.createSubscribeRequest = function() {
	var s = this;
	var existingRenderersIds = JSKitLib.fmap(s.existingRenderers,
		function(renderer){
			return renderer.id;
		});
	JSKitLib.fmap(s.subscribeRequest, function(el) {
			el.requestRange = s.subscribers[el.id].requestRange;
		});
	return {
			'uri': s.uriDomain + '/api/echo/subscribe',
			'target': s.target,
			'onreturn': function(){
				s.subscribeAnswer.apply(s, arguments) },
			'pickup': true,
			'ref': s.ref,
			'epb': window.JSKitEPB ? JSKitEPB.getAsHash() : {},
			'request': {existingRenderers:
				JSKitLib.Object2JSON(existingRenderersIds)},
			'variableRequest': s.subscribeRequest,
			'trailer': 'id',
			'timeout': 60000
		};
}

JSKEcho.prototype.subscribeAnswer = function(error, data) {
	var s = this;
	var restartRequest = function() {
		s.jsrvcSubscribe.processRequest(s.createSubscribeRequest());
	}
	if(error=="timeout") {
		s.jsrvcSubscribe.requestsInProgress--;
		restartRequest();
		return;
	}
	if(error!="data"){
		alert(error);
		return;
	}
	JSKitLib.map(function(requestRange) {
		s.subscribers[requestRange.id].requestRange=requestRange.value;
	}, data.requestRanges);
	JSKitLib.map(function(renderer) {
		var er = s.existingRenderers;
		var erl = s.existingRenderers.length;
		var r = s.getRendererById(renderer.id);
		eval('var f = ' + renderer.content);
		if(!r) {
			er.push({'id': renderer.id});
			r = er[er.length-1];
		}
		r.content = f;
	}, data.renderers);
	JSKitLib.map(function(item){
		var subscriberId = item.id;
		var echoItems = item.echoItems;
		JSKitLib.map(function(echoItem) {
			var renderer = s.getRendererById(echoItem.renderer);
			if(renderer)
				echoItem.dom = renderer.content(echoItem);
		}, echoItems);
		s.subscribers[subscriberId].callback(echoItems);
	}, data.items);
	if(data.items.length) {
		restartRequest();
	} else {
		setTimeout(function(){
			restartRequest();
		}, data.timeout || 5000);
	}
}

JSKEcho.prototype.subscribe = function(multiParams) {
	var s = this;
	s.subscribeRequest = s.subscribeRequest.concat(
		JSKitLib.fmap(multiParams, function(param){
			var subscriber = {
				id: param.id || s.subscribers.length,
				callback: param.callback,
				requestRange: param.requestRange || 0
			};
			s.subscribers.push(subscriber);
			param.request.id = subscriber.id;
			param.request.requestRange =
				param.request.requestRange ||
							subscriber.requestRange;
			return param.request;
		})
	);
	if(!s.jsrvcSubscribe)
		s.jsrvcSubscribe = new JSRVC(s.createSubscribeRequest());
}

JSKEcho.prototype.publish = function(multiParams, callback) {
	var s = this;
	var publishRequest = JSKitLib.fmap(multiParams, function(param){
		return {operation: param.operation,
			echoItem: JSKitLib.Object2JSON(param.echoItem)};
	});
	new JSRVC({
		'uri': s.uriDomain + '/api/echo/publish',
		'target': s.target,
		'onreturn': callback,
		'request': {},
		'ref': s.ref,
		'epb': window.JSKitEPB ? JSKitEPB.getAsHash() : {},
		'variableRequest': publishRequest
	});
}





function JSKEchoPGC(itemsPerPage) {
	this.itemsPerPage = itemsPerPage;
	this.invalidate();
}

JSKEchoPGC.prototype.getItemById = function(itemId) {
	var itemsArr = this.getItems(this.getItemIdxById(itemId), 1);
	return (itemsArr.length>0) ? itemsArr[0] : undefined;
}

JSKEchoPGC.prototype.getItemIdxById = function (itemId) {
	var itemIdx;
	for(var i=0; i<this.itemsCount; i++) {
		if(this.items[i] && this.items[i].obj.ID==itemId) {
			itemIdx = i;
			break;
		}
	}
	return itemIdx;
}

JSKEchoPGC.prototype.getItems = function (sIdx, Cnt) {
	return (sIdx>=0 && Cnt) ? this.items.slice(sIdx, sIdx+Cnt) : [];
}

JSKEchoPGC.prototype.deleteItem = function (itemId) {
	var itemIdx = this.getItemIdxById(itemId);
	if(typeof itemIdx == 'undefined') return 0;

	var r = 0;
	var self = this;
	var item = this.items[itemIdx];
	if(item.obj && item.obj.thread) {
		JSKitLib.fmap(item.obj.thread,
			function(c) {
				r += self.deleteItem(c.ID);
			});
	}
	if(item.obj && item.obj.status!='D' && item.obj.status!='DT') r++;
	if(itemIdx <= this.displayItemIdx) {
		this.displayItemIdx--;
		var div = item.div;
		if(div && div.parentNode) div.parentNode.removeChild(div);
	}
	this.items.splice(itemIdx, 1);
	this.itemsCount--;
	return r;
}

JSKEchoPGC.prototype.getPageByItemId = function(itemId) {
	var itemIdx = this.getItemIdxById(itemId);
	return (itemIdx <= this.displayItemIdx) ||
		(!itemIdx && this.displayItemIdx == -1) ? 0 : 1;
}

JSKEchoPGC.prototype.invalidateItemView = function (itemId) {
	var itemIdx = this.getItemIdxById(itemId);
	if(itemIdx <= this.displayItemIdx) {
		delete this.items[itemIdx].html;
		this.invalidVisualization = true;
	}
}

JSKEchoPGC.prototype.invalidatePagesView = function (pageIdx, Cnt) {
	if(!pageIdx) this.invalidVisualization = true;
}

JSKEchoPGC.prototype.getFirstItem = function () {
	if(this.itemsCount) {
		var itemsArr = this.getItems(0, 1);
		return (itemsArr.length>0) ? itemsArr[0] : undefined;
	} else {
		return undefined;
	}
}

JSKEchoPGC.prototype.getPageItemsCnt = function(pageIdx) {
	return pageIdx ? undefined : this.displayItemIdx + 1;
}

JSKEchoPGC.prototype.invalidate = function () {
	this.invalidData = true;
	this.invalidVisualization = true;
	this.items = [];
	this.itemsCount = 0;
	this.displayItemIdx = -1;
}

JSKEchoPGC.prototype.getItemsToDisplay = function () {
	return this.getItems(0, this.displayItemIdx + 1);
}

JSKEchoPGC.prototype.getPageVisualization = function (pageIdx, cb) {
	var self = this;
	var getPageFunc = function(){ self.getPageVisualization(pageIdx, cb); };
	var getMore = (this.itemsPerPage + this.displayItemIdx) >= this.itemsCount && pageIdx && this.echo_after ? true : false;
	if(this.invalidData || getMore) {
		this.invalidVisualization = true;
		return this.dataRequest(0, getMore, this.echo_after, cb);
	}
	if(this.invalidVisualization || pageIdx) {
		this.displayItemIdx = this.itemsCount-1;
		this.invalidVisualization = false;
		return this.dataVisualizator(this.getItemsToDisplay(), getPageFunc);
	}
	return cb(this.target, true);
}

JSKEchoPGC.prototype.getPlaceIdxByTS = function(TS) {
	var items = this.getItems(0, this.itemsCount);
	for(var i=0; i<this.itemsCount; i++) {
		if(TS>=items[i].obj.TS) return items[i].obj.ID;
	}
	return 0;
}

JSKEchoPGC.prototype.newItem = function(item) {
	var newItem = { obj: undefined, html: undefined, div: undefined };
	if(item) JSKitLib.fmap(item, function(V,K){ newItem[K] = V; });
	return newItem;
};

JSKEchoPGC.prototype.addNewItem = function (obj, itemId, isPrepend) {
	var item = this.newItem({'obj': obj});
	var itemIdx = itemId ? this.getItemIdxById(itemId) + (isPrepend ? 0 : 1) : this.itemsCount;
	this.items.splice(itemIdx, 0, item);
	this.itemsCount++;
	if(itemIdx<=this.displayItemIdx ||
		(!obj.paginated && itemIdx==this.displayItemIdx+1) ||
		(!itemIdx && this.displayItemIdx == -1)) {
		this.displayItemIdx++;
		this.invalidVisualization = true;
	}
}

JSKEchoPGC.prototype.newData = function (newData, echo_after) {
	var s = this;
	s.$old_echo_after = s.echo_after;
	s.echo_after = echo_after;
	JSKitLib.fmap(newData, function(o) {
		var itemIdx = s.getItemIdxById(o.ID);
		if(typeof itemIdx != 'undefined') {
			JSKitLib.fmap(s.items[itemIdx].obj, function(v, k){
					s.items[itemIdx].obj[k] = o[k]; });
			if(itemIdx<=s.displayItemIdx) {
				delete s.items[itemIdx].html;
				s.invalidVisualization = true;
			}
		} else {
			s.items[s.itemsCount++] = s.newItem({'obj': o});
		}
	});
	this.displayItemIdx = this.itemsCount - 1;
	this.invalidData = false;
	this.loading = false;
}





if(!window.JSFSearch) JSFSearch = { threshold: 0.9 };

JSFSearch.get_hash_list = function(s) {
	return s.split(/[ \t]+/);
}

JSFSearch.normalize = function(s) {
	return s.toLowerCase().replace(/<wbr><\/wbr>/g, '').replace(/<[^<]*>/g,' ');
}

JSFSearch.make_hash = function(s) {
	var hash_list = JSFSearch.get_hash_list(JSFSearch.normalize(s));
	var hash_length = JSKitLib.foldl(0, hash_list,
				function(v, acc){ return acc + v.length });
	return {'hash_length': hash_length, 'hash_list': hash_list.sort()};
}

JSFSearch.get_hash_info = function(obj) {
	if(!obj.$hash_info)
		obj.$hash_info = JSFSearch.make_hash(obj.Text);
	return obj.$hash_info;
}

JSFSearch.compare_hash_lists$ = function(hash1, hash2, cnt1, cnt2, matched_count, mismatched1, mismatched2) {
	var hl1 = hash1.length;
	var hl2 = hash2.length;
	if(cnt1 >= hl1 && cnt2 >= hl2)
		return {'matched_count': matched_count,
			'mismatched1': mismatched1, 'mismatched2': mismatched2};
	if(cnt1 >= hl1) {
		mismatched2.push(hash2[cnt2]);
		cnt2++;
	} else
	if(cnt2 >= hl2) {
		mismatched1.push(hash1[cnt1]);
		cnt1++;
	} else
	if(hash1[cnt1] == hash2[cnt2]) {
		matched_count += hash1[cnt1].length;
		cnt1++;
		cnt2++;
	} else
	if(hash1[cnt1] <= hash2[cnt2]) {
		mismatched1.push(hash1[cnt1]);
		cnt1++;
	} else {
		mismatched2.push(hash2[cnt2]);
		cnt2++;
	}
	return JSFSearch.compare_hash_lists$(hash1, hash2, cnt1, cnt2,
			 matched_count, mismatched1, mismatched2);

}

JSFSearch.compare_hash_lists = function(hash1, hash2) {
	return JSFSearch.compare_hash_lists$(hash1, hash2, 0, 0, 0, [], []);
}

JSFSearch.get_avg = function(hash) {
	var flat_list = hash.join('');
	var sum = 0;
	var len = flat_list.length;
	for(var i=0; i<len; i++) {
		sum += flat_list.charCodeAt(i);
	}
	var avg = len ? sum/len : 0;
	return {'avg': avg, 'list': flat_list};
}

JSFSearch.corr_coeff = function(avg1, avg2) {
	var sum1 = sum2 = sum3 = 0;
	var calc_summs = function(e1, e2) {
		var d1 = e1 - avg1.avg;
		var d2 = e2 - avg2.avg;
		sum1 += d1 * d2;
		sum2 += d1 * d1;
		sum3 += d2 * d2;
	}
	var l1 = avg1.list.length;
	var l2 = avg2.list.length;
	var l = Math.max(l1, l2);
	while (l > 0) {
		l--;
		if(l>=l1) calc_summs(0, avg2.list.charCodeAt(l))
		else if(l>=l2) calc_summs(avg1.list.charCodeAt(l), 0)
		else calc_summs(avg1.list.charCodeAt(l),avg2.list.charCodeAt(l));
	}
	return {'sum1': sum1, 'sum2': sum2, 'sum3': sum3};
}

JSFSearch.calc_distance = function(hash1, hash2) {
	var avg_info1 = JSFSearch.get_avg(hash1);
	var avg_info2 = JSFSearch.get_avg(hash2);
	var sums = JSFSearch.corr_coeff(avg_info1, avg_info2);
	return ((sums.sum2 < 0.1 || sums.sum3 < 0.1) ? 0 :
		sums.sum1/Math.sqrt(sums.sum2)/Math.sqrt(sums.sum3));
}

JSFSearch.compare_hashes = function(hash1, hash2) {
	var hl1 = hash1.hash_length;
	var hl2 = hash2.hash_length;
	if(hl1 == 0 && hl2 == 0) return 1;
	var compare_info = JSFSearch.compare_hash_lists(hash1.hash_list,
							hash2.hash_list);
	var total_len = (hl1 + hl2) / 2;
	var matched_pcnt = compare_info.matched_count / total_len;
	if(total_len - compare_info.matched_count < 0.1) return 1;
	if(compare_info.matched_count < total_len/2) return 0;
	if(matched_pcnt > JSFSearch.threshold) return 0.99;
	if(matched_pcnt > 0.75 && compare_info.matched_count > hl1 * 0.9)
		return 0.99;
	if(matched_pcnt > 0.75 && compare_info.matched_count > hl2 * 0.9)
		return 0.99;
	return (matched_pcnt +
		Math.abs(JSFSearch.calc_distance(
			compare_info.mismatched1, compare_info.mismatched2)) *
		(total_len - compare_info.matched_count) / total_len);
}

JSFSearch.compare_obj = function(obj1, obj2) {
	return (JSFSearch.compare_hashes(JSFSearch.get_hash_info(obj1),
			JSFSearch.get_hash_info(obj2)) > JSFSearch.threshold);
}

JSFSearch.search = function(items, obj) {
	if(!obj.event_publisher || obj.ParentID || obj.depth || !obj.Text)
		return obj.ParentID;
	for (var i=0; i<items.length; i++) {
		var curobj = items[i].obj;
		if(curobj.event_publisher && !curobj.depth && curobj.Text) {
			if(JSFSearch.compare_obj(obj, curobj))
				return curobj.ID;
		}
	}
}



/* Constants */
JSCC.DOMAIN = (window.location.protocol.substr(0, 4) != 'http' ? 'http:' : '')
              + '//js-kit.com';
JSCC.URI = JSCC.DOMAIN + '/comment';
JSCC.URI_AVATAR = JSCC.DOMAIN + '/avatar/';
JSCC.URI_IMAGE = JSCC.DOMAIN + '/image/';
JSCC.MINI_PROFILE_TTL = 1000;
JSCC.REPOST_COMMENT_TIMEOUT = 20000;

/* JavaScript Comment Class */
new JSCC();

/* JSKitGlobal : App is ready */
$JSKitGlobal.setCommentsAppAvailable();

function JSCC(target, extra) {
	this.get = function(id) { return document.getElementById(id); }
	var idName = "js-kit-comments";
	if (target && target.jsk$initialized) return;

	this.cr = function(tag) { return document.createElement(tag); }
	var wl = window.location;
	this.uriDomain = JSCC.DOMAIN;
	this.uriAvatar = JSCC.URI_AVATAR;
	this.uriImage = JSCC.URI_IMAGE;
	this.uri = JSCC.URI;
	this.fieldDfl = {};
	this.TC = {};
	this.tmpID = 0;
	this.pathOverride = "";
	this.uniq = wl.pathname;
	this.objById = {};
	this.utmpl={};
	this.config = (extra?extra.config:null)||{};
	this.IM = this.config.nolc && extra && extra.sargs && extra.sargs.source=='profileIM' ? (extra.sargs['destProfile'] ? 'foreign' : 'own') : false;
	this.gen = 0;
	this.ctag = null;
	this.czidx = 300;
	this.stripecount = 2;
	this.extraFormFields = {};
	this.pause = {
		'state': false,
		'queue': [],
		'visible': false,
		'forced': false
	};
	this.moderationCommentsList = {};
	var self = this;

	var groupSingleRequestParams = function(self, obj) {
		var params = obj || {};
		var filter = self.sourceFilter;
		params.jx = self.jcaIndex;
		params.p = self.config.path;
		params.gen = self.gen || 0;
		params.srt = self.config.sort;
		params.sp = params.sp || 1;
		params.skin = self.config.skin || "echo";
		if(self.config.paginate) params.ps = self.config.paginate;
		if(self.config.backwards == 'yes') params.ord = 'desc';
		if(self.config.thread != 'yes') params.prs = 'flat';
		if(self.config.moderate) params.mod = 1;
		if(self.config["display-mode"]) params.dm = self.config["display-mode"];
		if(filter) params[filter.type] = filter.sources.list;
		if(self.config.permalink) params.permalink = self.config.permalink;
		return params;
	}

	var initSourceFilter = function(config) {
		var filter = {};
		JSKitLib.fmap(["include", "exclude"], function(key) {
			if (config[key + "-sources"]) filter.type = key;
		});
		if (!filter.type) return;
		filter.normalize = function(name) {
			return JSKitLib.trim(name.toLowerCase());
		};
		filter.sources = JSKitLib.foldl({"hash": {}, "list": []}, config[filter.type + "-sources"].split(",") || [], function(name, acc) {
			name = filter.normalize(name);
			if (!name || acc.hash[name]) return;
			acc.hash[name] = filter.type == "include";
			acc.list.push(name);
		});
		if (!filter.sources.list.length) return;
		filter.sources.list = filter.sources.list.join(",");
		return filter;
	}

	var cl = wl.hash.match(/^#(jsid-[0-9]+-?[0-9]*)$/i);
	this.comment_location = cl ? cl[1] : undefined;

	this.isStandalone = function() {
		return (this.config.standalone == 'yes');
	}

	this.scoringEnabled = function() {
		return ((this.config.scoring != 'no') && (this.serverOptions.scoring) && !this.useEcho());
	}

	if(target) {
		this.jcaIndex = $JCA.length;
		$JCA.push(this);

		var cn = target.childNodes;
		for(var n=0;n < cn.length;n++) {
			if(cn[n].className) {
				var arr = String(cn[n].className).split(/[ ]+/);
				JSKitLib.fmap(arr, function(c) {
					if(c.substr(0, 3) == 'js-')
						self.utmpl[c] = JSKitLib.getOuterHTML(cn[n]);
				});
			}
		}

		if(cn.length) target.innerHTML = "";
		var utsc = this.utmpl['js-singleComment'];
		if(utsc) this.dtComment = utsc;
		var utgm = this.utmpl['js-groupModeration'];
		if(utgm) this.dtGroupModeration = utgm;

		// Override
		var jovs = window.JSKit$Override;
		if(jovs) {
		  for(var i = jovs.length-1; i>=0; i--) {
			var fName = jovs[i][0];
			var func = jovs[i][1];
			this[fName] = func;
		  }
		}
	} else {
		if(!document.body){
			alert($JCL("savingScriptMessage"));
			return;
		}
		JSKitLib.preloadImg('//cdn.js-kit.com/images/loading-yellow.gif');

		var request = {
			base_uri: JSCC.URI + 's-data.js',
			trailer: 'jx',
			extra_params: this.comment_location ? {'jsid': this.comment_location} : {}
		};
		JSKitLib.initWidgets('comments', request, function(div) {
			var obj = new JSCC(div, {'config': {'noDataRequest': true}});
			var params = groupSingleRequestParams(obj); 
			obj.singleRequestParams = params;
			return obj;
		});

		JSKitLib.fmap([
			'comment-deleting',
			'comment-deleted',
			'comment-added',
			'comments-data-loaded',
			'comments-count-updated'
		], function(e) {
			JSKitAPI.subscribe(e, function(eventName, eventParams) {
				$JCA[eventParams.jcaIndex].eventsHandler(eventName, eventParams);
			});
		});
		JSKitLib.fmap({
			'JSKitAuth_logout': 'user-logout',
			'JSKitAuth_success_login': 'user-login'
		}, function(v, k) {
			JSKW$Events.registerEventCallback(undefined, function() {
				JSKitAPI.publish(v, {"nofocus": false});
			}, k);
		});

		return;
	}
	target.jsk$initialized = true;
	target.className = idName;
	target.id = "";

	// Handling user configuration settings
	this.config = JSKitLib.readConfig("comments",
		target,
		this.config,
		'path',
		'display-mode',
		['standalone', 'no'],
		['scoring', 'yes'],
		'paginate',
		'backwards',
		['disabled', 'no'],
		'domain',
		['sort', ['date','karma','name','status','rating']],
		['thread', ['yes','no']],
		'adminBgColor',
		'flashColor',
		'moderate',
		'permalink',
		'skin',
		'noautoexpand',
		'label',
		['smiles', 'no'],
		['editable', 'no'],
		['thread-title', $JCL("defaultThreadTitle")],
		'popup-title',
		'popup-width',
		'popup-height',
		'include-sources',
		'exclude-sources',
		['page-title', document.title]
	);
	if (!this.config.backwards) {
		if (this.config.paginate)
			this.config.backwards = 'yes';
		else
			this.config.backwards = this.config.nolc && !this.IM ? 'yes' : 'no';
	}
	this.uniq = this.config.path;
	this.pathOverride = this.config.path;
	this.sourceFilter = initSourceFilter(this.config);
	this.config.thread = this.config.nolc && !this.IM ? 'no' : this.config.thread;
	this.config.domain = this.config.moderate || this.config.domain;
	this.config.noautoexpand = this.config.noautoexpand == 'yes';

	self.target = target;

	this.server = function(ext, data, ajax, rvcparams) {
		if((self.serverFilter && !self.serverFilter(ext)) || self.config.disabled == 'yes') return;

		// ensure window.location is current (re:blogspot)
		var wl = window.location;
		var prms = data;
		JSKitLib.fmap(((extra||{})['sargs']||{}),
			function(v, k){ prms[k] = v; });
		var getAction = function(scr) {
			return scr.match(self.uriDomain) ? wl.protocol + scr : wl.protocol + self.uri + scr;
		};
		var action = getAction(ext);
		var so = this.serverOptions;
		prms = JSKitLib.appendExternalParams("comments", ext, prms);
		prms.p = this.pathOverride;
		prms.nonce = so && so.nonce || "";
		prms['page-title'] = self.config['page-title'];
		var req = {
			uri: action,
			ref: JSKitLib.getRef(self),
			epb: JSKitEPB.getAsHash({}),
			request: prms,
			target: self.target,
			randevu: !!ajax
		};
		if (rvcparams) JSKitLib.fmap(rvcparams, function(v, k) { req[k] = v; });
		new JSRVC(req);
	}

	this.getpages = function(sp, ap) {
		self.loading = (new Date()).valueOf();
		var prms = {};
		JSKitLib.fmap(groupSingleRequestParams(self, {sp: sp}), function(v, k) {prms[k + "[0]"] = v;});
		if(ap) JSKitLib.fmap(ap, function(v,k){ prms[k] = v ;});
		self.server("s-data.js", prms);
	}

	JSKitLib.fmap(['user-login', 'user-logout'], function(e) {
		JSKitAPI.subscribe(e, function(eventName, eventParams) {
			self.eventsHandler(eventName, eventParams);
		});
	});

	if (!this.config.noDataRequest) this.getpages();
}

JSKitLib.addCss(''
+ '.js-WelcomePanel { margin: 0px 0px 10px 0px; font: 12px Arial; text-align: left; }'
+ '.js-WelcomePanelBottom { margin: 10px 0px 0px 0px; }'
+ '.js-WelcomePanelTitle { padding-left: 7px; border-bottom: 1px solid #d1bea4; background: #e4d0b3; color: #fff; font: 14px Arial; font-weight: bold; line-height: 21px; }'
+ '.js-WelcomePanelClose { height: 21px; width: 20px; float: right; cursor: pointer; position: relative; top: 7px; ' + (JSKitLib.isIE() ? 'filter:progid:DXImageTransform.Microsoft.AlphaImageLoader(src="//cdn.js-kit.com/images/welcome/close.png", sizingMethod="crop")' : 'background: no-repeat url(//cdn.js-kit.com/images/welcome/close.png);') + ' }'
+ '.js-WelcomePanelContent { padding: 18px 20px; background-color: #fffae4; color: #2e2e30; line-height: 21px; ' + (JSKitLib.isIE() ? 'zoom: 1' : '') + ' }'
+ '.js-WelcomePanelContentBlock a, .js-WelcomePanelContentBlock a:link, .js-WelcomePanelContentBlock a:visited, .js-WelcomePanelContentBlock a:hover, .js-WelcomePanelContentBlock a:active { text-decoration: none; color: #2e2e30; font: 12px Arial; white-space: nowrap; }'
+ '.js-WelcomePanelContentBlock a:hover, .js-WelcomePanelContentBlock a:active { text-decoration: underline; }'
+ '.js-WelcomePanelHeader { font: 16px Arial; font-weight: bold; color: #2e2e30; padding: 0px; line-height: 20px; ' + (JSKitLib.isIE() ? 'zoom: 1' : '') + ' }'
+ '.js-WelcomePanelContentBlock { float: left; padding-bottom: 5px; ' + (JSKitLib.isIE() ? 'zoom: 1' : '') + '}'
+ '.js-WelcomePanelContentBlock table img { vertical-align: middle; }'
+ '.js-WelcomePanelCtls { float: left; text-align: center; margin-top: 9px; line-height: 15px; }'
+ '.js-WelcomePanelCtls a, .js-WelcomePanelCtls a:active, .js-WelcomePanelCtls a:visited, .js-WelcomePanelCtls a:hover { color: #2e2e30; font: 11px Arial; }'
+ '.js-WelcomePanelArrow { height: 12px; }'
+ JSKitLib.fmap({Info: 'information', Reg: 'pencil', Profile: 'edit_profile', Help: 'help', Custom: 'bullet_wrench', Dashboard: 'dashboard', Twitter: 'twitter', Support: 'support', Widgets: 'widgets', Panel: 'admin_panel' }, function(v, k) {
	var paddingTop = (k == 'Info' || k == 'Reg' ? 4 : 1);
	var paddingLeft = (k == 'Info' || k == 'Reg' ? 23 : 25) - (JSKitLib.isIE() ? 2 : 0);
	return '.js-WelcomeImg' + k + ' { height: 16px; line-height: 16px; padding: ' + paddingTop + 'px 0px 0px ' + paddingLeft + 'px; float: left; ' + (JSKitLib.isIE() ? 'filter:progid:DXImageTransform.Microsoft.AlphaImageLoader(src="//cdn.js-kit.com/images/welcome/' + v + '.png", sizingMethod="crop");' : 'background: url(//cdn.js-kit.com/images/welcome/' + v + '.png) no-repeat left center;') + ' }';
}).join('')
, 'welcome');

JSKitLib.addCss(""
+ ".js-CommentsSkin-smoothgray .js-commentInputName { margin-right: 110px; " + (JSKitLib.isIE() ? "zoom: 1;" : "") + "}"
+ ".js-CommentsSkin-smoothgray .js-commentInputEmail { margin-right: 110px; " + (JSKitLib.isIE() ? "zoom: 1;" : "") + "}"
+ ".js-CommentsSkin-smoothgray .js-commentInputUrl { margin-right: 110px; " + (JSKitLib.isIE() ? "zoom: 1;" : "") + "}"
+ ".js-CommentsSkin-smoothgray .js-AuthAreaWrap { margin-right: 110px; " + (JSKitLib.isIE() ? "zoom: 1;" : "") + "}"
+ ".js-CommentsSkin-smoothgray .js-CCButtons { margin: 0.3em 0 0.5em 5px; width: 100%;" + (JSKitLib.isIE() ? "zoom: 1; " : "") + "}"
+ ".js-authSelector { float: left; margin-bottom: 5px; }"
+ ".js-logoutSpan { display:none; margin-left: 5px;" + (JSKitLib.isIE() ? "zoom: 1; " : "margin-top: 3px; ") + "}", "AuthAreaWrap");

// Optionally leave all CSS up to template
if (!window.$JSKitNoCommentCss) {
	JSKitLib.addCss(''
	+ ".js-OldComments { margin-bottom: 1px; clear:both;}"
	+ ".js-LeaveComment { margin: 5px 0 0 5px; }"
	+ ".js-CreateComment, .js-EditComment { text-align: left; display: none; }"
	+ ".js-commentInputUrl { display: none; }"
	+ ".js-CCMore { padding-left: 3px }"
	+ ".js-commentOptions { float: left; }"
	+ ".js-commentPubOptions { float: left; padding: 2px 5px; }"
	+ ".js-commentShareCheckbox { float: left; margin: " + (JSKitLib.isIE() ? "-3px" : "1px") + " 0 0 5px; }"
	+ ".js-commentShareLabel { margin: 1px 3px 0 3px; line-height: 13px; float: left; }"
	+ ".js-commentYahooShareLabelLogo {margin: 1px 0 0 0; float: left; width: 49px; height: 13px; " + (JSKitLib.isIE() ? 'filter:progid:DXImageTransform.Microsoft.AlphaImageLoader(src="//cdn.js-kit.com/images/yahoo/yoslogo.png", sizingMethod="crop");' : 'background: no-repeat url(//cdn.js-kit.com/images/yahoo/yoslogo.png);') + " }"
	+ ".js-commentSubmit { text-align: right; }"
	+ ".js-CreateCommentBg { margin: 1em; padding: 0.5em; border: solid 1px #c0c0c0; text-align: left; float: left; }"
	+ ".js-EditComment .js-CreateCommentBg { float: none; border: none; padding: 0; }"
	+ ".js-CreateCommentArea { -moz-border-radius: 7px; -webkit-border-radius: 7px; padding: 5px 5px 5px 9px; }"
	+ ".js-CommentsArea .js-CreateCommentArea { background-color: #cbcbcb; }"
	+ ".js-OldComments { background-color: transparent; }"
	+ ".js-CreateCommentFieldsWrap { margin-left: -4px; background-color: #ececec; border: solid 1px #b0b0b0; padding: 4px; -moz-border-radius-topleft: 6px; -webkit-border-top-left-radius: 6px; -moz-border-radius-bottomleft: 6px; -webkit-border-bottom-left-radius: 6px; }"
	+ '.js-CreateCommentFields {zoom: 1; color: #404040; background-color: #e8e8e8; padding: 4px; -moz-border-radius-topleft: 6px; -webkit-border-top-left-radius: 6px; -moz-border-radius-bottomleft: 6px; -webkit-border-bottom-left-radius: 6px; }'
	+ ".js-PageNavTop { margin-bottom: 3px; }"
	+ ".js-PageNavBottom { margin-top: 3px; clear: both; }"
	+ ".js-PageNOther { text-decoration: none; }"
	+ ".js-PageNCur { font-weight: bold; }"
	+ ".js-PageArrowCur { opacity: 0.3; zoom:1; filter:progid:DXImageTransform.Microsoft.Alpha(opacity=30); }"
	+ ".js-commentFieldSubject { font-weight: bold; margin-bottom: 5px;}"
	+ ".js-commentFieldLabel { margin-top: 5px; clear:both; margin-right: 0.5em;}"
	+ ".js-pmFieldLabel { margin-top: 5px; clear:both; margin-right: 0.5em; text-align: left;}"
	+ ".js-commentFieldNote { font-family: Verdana; font-size: 7pt; color: #808080; }"
	+ ".js-siteAdmin { font-weight: bold; }"
	+ ".js-singleComment { zoom: 1; font-size: 8pt; font-family: Verdana, Helvetica; border: solid 1px #c0c0c0; text-align: left; margin-bottom: -1px; }"
	+ ".js-singleCommentBg { zoom: 1; padding: 0.3em; }"
	+ ".js-singleCommentCheckbox { float: left; margin: " + (JSKitLib.isIE()?"0":"2") + "px 2px 0px 0px; width: 16px; height: 16px; cursor: pointer; }"
	+ '.js-singleCommentHeader { color: #484848; margin: 3px 0; }'
	+ '.js-singleCommentBody { clear: both; color: #404040; background-color: #fefefe; padding: 4px 4px 4px 8px; -moz-border-radius-topleft: 6px; -webkit-border-top-left-radius: 6px; -moz-border-radius-bottomleft: 6px; -webkit-border-bottom-left-radius: 6px; }'
	+ 'table.js-singleCommentBodyT { margin: 0; padding: 0; font-family: Verdana, Helvetica; text-align: left; font-size: 8pt; color: #404040; }'
	+ '.js-singleCommentQuote { position:relative; top: 4px; font-family: "Times New Roman"; font-size: 32px; line-height: 24px; padding-right: 1px; display: none; }'
	+ ".js-singleCommentINFO { color: #808080; float: right; padding: 3px; margin-left: 2em; text-align: right;}"
	+ ".js-singleCommentAvatar { float: right; }"
	+ ".js-singleCommentAvatarCell { text-align: right; }"
	+ ".js-singleCommentText { padding-top: " + (JSKitLib.isIE()?"0":"4") + "px; }"
	+ ".js-singleCommentName { font-weight: bold; text-decoration: underline; }"
	+ ".js-singleCommentUrl { margin: 0px 0px 0px 2px; padding: 0px; border: 0px; width: 10px; height: 10px; display: none; vertical-align: top; }"
	+ ".js-singleCommentDate { font-size: 7pt; }"
	+ ".js-singleCommentOrigin { display: inline; bottom: 0.3em; font-size: 7pt; color: #808080; }"
	+ ".js-singleCommentKarmaComMod { clear: both; }"
	+ ".js-singleCommentKarma { float: left; font-size: 7pt; color: #808080; margin-right: 1em; padding-top: 3px; }"
	+ ".js-singleCommentKarmaShow { float: left; font-size: 7pt; color: #808080; margin-right: 2em; padding-top: 3px; display: none; }"
	+ ".js-singleCommentKarmaScore { display: none; }"
	+ ".js-singleCommentComMod { float: left; font-size: 7pt; color: #808080; display: inline; padding-top: 3px; margin-right: 1em; }"
	+ ".js-singleCommentCtls { float: right; white-space: nowrap; }"
	+ ".js-singleCommentMenu { float: left; margin: -4px 15px 0px 0px; " + (JSKitLib.isIE() ? "zoom: 1; " : "") + " white-space: nowrap; }"
	+ ".js-singleCommentControl, .js-singleCommentKarmaY, .js-singleCommentKarmaN { cursor: pointer; }"
	+ ".jskit-MenuTitle { cursor:pointer; padding: 3px; white-space: nowrap; color: #476cb8; font-size: 11px; width: 100%; }"
	+ ".jskit-MenuTitleMO { }"
	+ ".jskit-MenuTitlePressed { }"
	+ ".jskit-MenuTitleExpandMarker { width: 16px; height: 16px; margin: 1px 0px 0px -2px; }"
	+ ".jskit-MenuContainer { border: 1px solid #D6E2E9; background-color: #FFFFFF; cursor:pointer; position: absolute; margin-left: -2px; -moz-border-radius: 4px; -webkit-border-radius: 4px; z-index: 20000;}"
	+ ".jsk-MenuAdmin td, .js-kit-miniProfile-addAnotherSite td, .jskit-MenuContainer td, .js-singleCommentMenu td, .jsk-HeaderPauseBox td { padding: 0px !important; vertical-align: middle !important; border-collapse: separate !important; border: 0px solid !important;}"
	+ ".jsk-MenuAdmin table, .js-kit-miniProfile-addAnotherSite table, .jskit-MenuContainer table, .js-singleCommentMenu table, .jsk-HeaderPauseBox table { margin: 0px !important; border-collapse: separate !important; border: 0px solid !important; width: auto !important; }"
	+ ".jskit-MenuRootContainer { margin: 2px 0px 0px -3px; }"
	+ ".jskit-MenuRootHTML { float: left; height: 2em; }"
	+ ".jskit-MenuItem { border: 1px 0px solid #FFFFFF; line-height: 14px; }"
	+ ".jskit-MenuItemIcon { width: 16px; height: 16px; margin: 4px 6px;" + (JSKitLib.isIE() ? " zoom: 1;" : " float: left;" ) + " }"
	+ ".jskit-MenuItemCheckboxCnt, .jskit-MenuItemRadioCnt { height: 24px; width: 65px; float: left; white-space: nowrap; margin: 0px; line-height: 14px;" + (JSKitLib.isIE() ? "zoom: 1;" : "") + "}"
	+ ".jskit-MenuItemTitle { margin: 5px 20px 4px 0px; color: #000000; font: 12px Arial; text-decoration: none; white-space: nowrap; zoom: 1;}"
	+ ".jskit-MenuItemEnding { height: 16px; margin: 2px; font-size: 14px; color: #000000; display: inline; font-family: Arial; }"
	+ "div.jskit-AvatarMenuItemEnding { display: block; margin: 1px 3px; }"
	+ ".jskit-MenuItemMO { background-color: #EDEDED; }"
	+ ".jskit-MenuItemMO .jskit-MenuDeleteButton { visibility: visible; }"
	+ ".jskit-MenuDelimeter { margin: 2px 0px; height: 1px; width: 100%; background-color: #CCCCCC; font-size: 1px; width: 100%; }"
	+ ".jskit-MenuItemInput { line-height: 16px; font: 12px Arial; padding: 0px; border: 1px solid #AAAAAA; height: 16px; margin: " + (JSKitLib.isIE() ? "3px" : "3px") + " 0px; width: 120px; position: absolute; }"
	+ ".jskit-MenuItemCheckbox, .jskit-MenuItemRadio { margin: 4px 4px 4px 10px; padding: 0px 8px; line-height: 16px; height: 16px; float: left; }"
	+ ".jskit-MenuDeleteButton { width: 16px; height: 16px; margin: 7px 0px 0px 2px; display: block; visibility: hidden; }"
	+ 'div.js-singleCommentEdit, div.js-singleCommentReply, div.js-singleCommentDelete, div.js-singleCommentModerate { background: right top url(//cdn.js-kit.com/images/button-clear.png) no-repeat; height: 16px; font-size: 8pt; line-height: 9px; color: #404040; cursor: pointer; float: left; margin: 0 0.5em 0 4px; }'
	+ 'div.js-singleCommentEdit div, div.js-singleCommentReply div, div.js-singleCommentDelete div, div.js-singleCommentModerate div { background: left top url(//cdn.js-kit.com/images/button-clear.png) no-repeat; height: 16px; padding: 2px 4px 0px 5px; position: relative; left: -1px; float: left; }'
	+ ".js-kit-lcf-miniProfile { " + (JSKitLib.isIE() ? "zoom: 1;" : "") + " }"
	+ ".js-kit-singleCmtProfileEnabled .js-kit-miniProfile-avatar, .js-kit-singleCmtProfileEnabled .js-kit-miniProfile-stats, .js-kit-singleCmtProfileEnabled .js-kit-miniProfile-viewDetails, .js-kit-singleCmtProfileEnabled .js-kit-miniProfile-name { cursor: pointer; }"
	+ ".js-kit-lcj-miniProfile-name-ipe { cursor: text; }"
	+ ".js-kit-singleCmtProfileDisabled .js-kit-miniProfile-viewDetails { display: none; }"
	+ ".js-kit-lcf-miniProfile .js-kit-miniProfileNameWrap { padding-bottom: 5px; }"
	+ ".js-kit-lcf-miniProfile .js-kit-miniProfile-name, .js-kit-lcf-miniProfile .js-kit-miniProfile-siteLinksIcons { float: left; }"
	+ ".js-kit-lcf-miniProfile .js-kit-miniProfileSitesWrap { border-top: 2px dotted #E4E4E4; padding-top: 5px; " + (JSKitLib.isIE() ? "zoom: 1;" : "") + " }"
	+ ".js-kit-lcf-miniProfile .js-kit-miniProfile-addAnotherSite { float: left; " + (JSKitLib.isIE() ? "zoom: 1;" : "") + "margin: 1px 0px 0px 0px; cursor: pointer; }"
	+ ".js-kit-lcf-miniProfile .js-kit-miniProfile-addAnotherSite span.text { color: #0066CC; margin-right: 5px; }"
	+ ".js-kit-lcf-miniProfile .js-kit-miniProfile-siteLinksIcons { border: 0px; }"
	+ ".js-kit-lcf-miniProfile .js-kit-miniProfile-name-ipe { margin-right: 70px; height: 24px; line-height: 20px; font-size: 16px; border: 0px; outline: 0px;}"
	+ ".js-kit-lcf-miniProfile .js-kit-miniProfile-logout { " + (JSKitEPB.isExists() ? "display: none" : "float: right; margin: 1px 0px 0px -70px; cursor: pointer; color: #0066CC; font-size: 10px;") + "}"
	+ ".js-kit-lcf-miniProfile .js-kit-miniProfile-logoutIcon { float: left; " + (JSKitLib.isIE() ? "zoom: 1;" : "") + " margin: 2px 0px 0px 5px; padding: 0px 5px; font-size: 8px; width: 10px; height: 10px; }"
	+ ".js-kit-lcf-miniProfile .js-kit-miniProfile-logoutLink { float: left; " + (JSKitLib.isIE() ? "zoom: 1; padding-bottom: 2px;" : "") + " }"
	+ ".js-kit-lcf-extraControlsMenuWrapper { float: left; }"
	+ ".js-kit-relative { position: relative; }"
	+ ".js-CreateComment .js-kit-tabs-singleTab { display: block; }"
	+ ".js-CreateComment .js-kit-tab { padding: 5px 0px 5px 0px; margin-right: 20px; background: transparent; cursor: pointer; }"
	+ ".js-CreateComment .js-kit-tab-title { color: #0066CC; }"
	+ ".js-CreateComment .js-kit-tab .js-kit-tab-expandMarker { float: left; width: 16px; height: 16px; }"
	+ ".js-kit-lcf-extraControlsMenuContent { border: 1px solid #BBBBBB; background: #FFFFFF; margin-top: 10px; color: #3a3a3a;}"
	+ ".js-kit-images-wrapper, .js-kit-follow-wrapper { padding: 10px; " + (JSKitLib.isIE() ? "zoom: 1;" : "") + " }"
	+ ".js-kit-images-form { margin: 20px 0px; }"
	+ ".js-kit-images-form .js-uploadImageForm { display: inline; }"
	+ ".js-kit-images-form .js-uploadImageInputLabel { display: inline; margin-right: 5px; font-size: 12px; }"
	+ ".js-kit-images-form .js-kit-images-imgSizeSpec { display: none; }"
	+ ".js-kit-follow-openingProfile { cursor: default; text-decoration: none; }"
	+ ".js-kit-follow-activeNotifyMode-noemail { background: none; }"
	+ ".js-kit-follow-activeNotifyMode-email, .js-kit-follow-activeNotifyMode-anymails { background: #fffea9; }"
	+ ".js-kit-follow-notifyOptionRadio { float: left; width: 16px; height: 16px; cursor: pointer; }"
	+ ".js-kit-follow-notifyOptionLabel { float: left; margin-left: 3px; font-size: 12px; cursor: pointer; }"
	+ ".js-kit-follow-emailAddress { margin: 0px 5px; }"
	+ ".js-kit-follow-leftColumn { float: left; margin-right: -26px; position: relative; width: 26px; }"
	+ ".js-kit-follow-rightColumnWrapper { float: left; width: 100%; }"
	+ ".js-kit-follow-rightColumn { margin-left: 26px; }"
	+ ".js-kit-follow-emailContainer { " + (JSKitLib.isPreIE8() ? "zoom: 1; margin-left: 5px;" : "") + " font-size: 12px; margin-bottom: 10px; }"
	+ ".js-kit-follow-rssContainer { " + (JSKitLib.isPreIE8() ? "zoom: 1;" : "") + " }"
	+ ".js-kit-follow-rightSubColumn { float: right; position: relative; margin-left: -95px; width: 85px; }"
	+ ".js-kit-follow-leftSubColumnWrapper { float: right; width: 100%; }"
	+ ".js-kit-follow-leftSubColumn { margin-right: 95px; }"
	+ ".js-kit-follow-notifyModeSelector { margin: 5px 0px; }"
	+ ".js-kit-follow-rssThreadButton { padding: 0px; margin-left: 5px; cursor: pointer; }"
	+ ".js-kit-follow-label { font-size: 12px; font-weight: bold; }"
	+ ".js-kit-follow-emailIcon, .js-kit-follow-rssIcon { width: 16px; height: 16px; }"
	+ ".js-kit-follow-input { width: " + (JSKitLib.isIE() ? "98%" : "100%") + "; }"
	+ ".js-kit-exp-banner-container { background: #fffac3; border: 1px solid #fee747; position: absolute; z-index: 20100; width: 320px; height: 200px; margin: 0px; padding: 15px 20px; font-size: 12px; line-height: 120%; text-align: left; }"
	+ ".js-kit-exp-banner-header { margin-bottom: 10px; text-align: center; }"
	+ ".js-kit-exp-banner-title { font-weight: bold; }"
	+ ".js-kit-exp-banner-label { font-weight: bold; margin-right: 5px; }"
	+ ".js-kit-exp-banner-button-container { text-align: center; margin-top: 20px; }"
	+ ".js-kit-exp-banner-button { background-color: transparent; background-image: url('//cdn.js-kit.com/images/common/continue.png'); border: none; cursor: pointer; margin: 0; padding: 0; width: 112px; height: 39px; }"
	+ ".js-kit-replies-expand-container { padding: 10px 0px; cursor: pointer; text-align: center; background: url(//cdn.js-kit.com/images/replies-expand-bg.png) repeat-x center; }"
	+ ".js-kit-replies-expand-wrapper { display: inline; padding: 0px 10px; }"
	+ ".js-kit-replies-expand-label { display: inline; background: url(//cdn.js-kit.com/images/whirlpool-comments.png) center left no-repeat; padding-left: 15px; }"
	+ ".js-singleCommentNotice { color: #ff0000; font-size: 8pt; }"
	+ ".js-commentControl { float: left; margin-right: 2em; }"
	+ '.js-commentFieldInput { border: solid 1px #7f99b9; width:' +(JSKitLib.isPreIE7()?'98%':'100%')+';}'
	+ '.js-commentFieldInputProfile { border: solid 1px #7f99b9; width:' +(JSKitLib.isIE()?'98%':'100%')+' !important;}'
	+ ".js-CmtButton { margin-right: 0.5em }"
	+ ".js-CCButtons { margin: 0.3em 0 0.5em 0 }"
	+ ".js-CCButtons INPUT { font-size: 8pt; }"
	+ ".js-poweredBy { margin-top: 2pt; color: #808080; font-size: 7pt; font-family: Verdana, Helvetica; }"
	+ ".js-poweredBy A, .js-poweredBy A .js-poweredBy-text { text-decoration: none; color: #8080a0 !important; cursor: pointer; }"
	+ ".js-antispamBy { text-align: right; }"
	+ ".js-Progress { position: absolute; visibility: hidden; right: 5px; top: 5px; width: 15px; height: 15px; }"
	+ ".js-SettingsWindow { padding: 0.3em; border: solid 1px #cccccc; color: #404040; white-space: normal; font-family: Verdana, Helvetica; font-size: small; z-index: 400; }"
	+ ".js-SettingsWindowNolc { z-index: 14400 }"
	+ ".js-SettingsWindowHeader { text-align:center; padding: 5px 0; margin-bottom: 5px; background-color: #e6e9ec; font-size: 10pt; font-family: Verdana, Helvetica; color: #435362}"
	+ ".js-ControlBlockText, .js-ControlBlockTextDisabled {font-size: 8pt; text-align: left;}"
	+ ".js-ControlBlockButton {font-size: 8pt;}"
	+ ".js-ControlBlockTextDisabled {color: #808080}"
        + ".js-showBorder {border:ridge 2px #a0a0a0;}"
	+ ".js-hideBorder {border:solid 2px #fefefe;}"
	+ ".js-SearchTitle {margin-right: 5px;}"
	+ ".js-SearchWords {padding: 0px; margin-right: 5px; border-bottom: 1px dashed #0000ff}"
	+ ".js-uploadAvatarForm {margin-top: 0px;}"
	+ ".js-singleCommentConversationHead {padding: 0.3em; " + (JSKitLib.isIE() ? "margin-top: 36px !important;" : "margin-top: 26px !important;") + "}"
	+ ".js-singleCommentConversationChild {padding: 0.3em; margin-top: -1px !important}"
	+ ".js-Conversation {padding: 0.3em; position: relative; top: -20px; display: inline; }"
	+ ".js-ConversationWrapper { height: 0px; " + (JSKitLib.isIE() ? "overflow: hidden;" : "") + "}"
	+ ".js-TornPageTop { margin-left: -5px; margin-right: -5px; " + (JSKitLib.isIE() ? "height: 6px;" : "height: 11px; margin-top: -5px; background: url(//cdn.js-kit.com/images/tornPaperT.gif) no-repeat;") + " }"
	+ ".js-TornPageBottom { margin-left: -5px; margin-right: -5px; " + (JSKitLib.isIE() ? "height: 6px;" : "height: 11px; margin-bottom: -5px; background: url(//cdn.js-kit.com/images/tornPaperB.gif) no-repeat;") + " }"
	+ ".js-TornPageTopImg { " + (JSKitLib.isIE() ? (JSKitLib.isPreIE7() ? "position: absolute;" : "float: left;") : "") + " margin-top: -5px; height: 11px; width: 100%; }"
	+ ".js-TornPageBottomImg { " + (JSKitLib.isIE() ? (JSKitLib.isPreIE7() ? "position: absolute;" : "float: left;") : "") + " margin-bottom: -5px; height: 11px; width: 100%; }"
	+ ".js-TornPageDivider { margin-left: -5px; margin-right: -5px;" + (JSKitLib.isPreIE7()?"":"margin-bottom: -1px;") + " height: 22px; background-color: #CBCBCB; }"
	+ ".js-TornPageDividerTop { height: 10px; background-color: #ECECEC; border: solid 1px #b0b0b0; border-top-width: 0; -moz-border-radius-bottomleft: 6px; -webkit-border-bottom-left-radius: 6px; margin-bottom: 6px; }"
	+ ".js-TornPageDividerBottom { height: 10px; background-color: #ECECEC; border: solid 1px #b0b0b0; border-bottom-width: 0; -moz-border-radius-topleft: 6px; -webkit-border-top-left-radius: 6px; }"
	+ ".js-commentBodyLabel { clear: both; }"
        + ".js-CreateCommentFieldsBaseInfo { float: right; margin-bottom : 5px; width: 100%; }"
	+ ".js-commentCmtTextarea { clear: both; }"
	+ ".js-CommentsSkin-wireframe .js-commentAvatar { background: #FFFFFF; border: 1px solid #c0c0c0; width: 96px; height: 96px; margin: 0px 0px 5px 0px; }"
	+ ".js-CommentsSkin-smoothgray .js-commentAvatar { background: #FFFFFF; position: relative; float: right; margin-left: -102px; border: 1px solid #c0c0c0; width: 96px; height: 96px; }"
	+ ".js-kit-lcf-avatarsManagerWrapper { float: left; position: relative; width: 64px; height: 64px; margin-right: 10px; margin-right: -75px; overflow: visible !important; }"
	+ ".js-kit-basicUserInfoWrap { float: left; width: 100%; }"
	+ ".js-kit-lcf-userInfoWrapper { " + (JSKitLib.isIE() ? "zoom: 1;" : "") + " }"
	+ ".js-kit-nonLoggedUserInfo .js-kit-lcf-fromMenuAnonymous, .js-kit-nonLoggedUserInfo .js-kit-lcf-toMenu, .js-kit-nonLoggedUserInfo .js-kit-fromMenuAnonymous { margin-left: 75px; }"
	+ ".js-kit-from-to-menu-title { margin: 5px 8px 0px 8px; font-weight: bold; font-size: 10px; }"
	+ ".js-kit-from-to-menu-footer { margin-top: 8px; }"
	+ ".js-kit-lcf-toMenu { margin: 9px 0px; }"
	+ ".js-kit-lcf-toField, .js-kit-from-menuAnonymousWrap { background-color: #FFFFFF; border: 1px solid #BBBBBB; }"
	+ ".js-kit-from-menuAnonymousWrap { " + (JSKitLib.isIE() ? "zoom: 1;" : "") + " }"
	+ ".js-kit-lcf-toField .jskit-MenuRootHTML { cursor: pointer; }"
	+ ".js-kit-lcf-toField { cursor: pointer; " + (JSKitLib.isIE() ? "zoom: 1;" : "") + " }"
	+ ".jskit-MenuRootHTML { cursor: pointer; }"
	+ ".js-kit-from-control { float: left; margin-right: -85px; position: relative; }"
	+ ".js-kit-from-field { float: left; width: 100%; height: 26px; cursor: text; }"
	+ ".js-kit-from-name { margin: 5px 0px 0px " + (JSKitLib.isIE() ? "85" : "81") + "px; font-size: 14px; border: 0px; cursor:text; width: 15em; line-height: 14px; outline: 0px;}"
	+ ".js-kit-from-name input.jsipe-input { margin: 0px; padding: 0px; border: 0px; background: #FFFFFF; outline: 0px; font-size: 14px !important; }"
	+ ".js-kit-disabledNameField { background-color: #fffea9; cursor: pointer; }"
	+ ".js-kit-disabledNameField .js-kit-from-name, .js-kit-disabledNameField .js-kit-miniProfile-name-ipe { width: auto; cursor: pointer; }"
	+ ".js-kit-loggedUserInfo { margin-left: 0px; }"
	+ ".js-CmtSpam { background: url(//cdn.js-kit.com/images/bio-hazard.gif) bottom right repeat-x !important; background-color: #ffffe0 !important; color: #404040; }"
	+ (JSKitLib.isIE() ? ".js-CreateComment { zoom: 1; }" : "")
        + ".js-previewImageDescr { width: 102px; left: 0px; bottom: 0px; }"
	+ ".js-previewImage { position: relative; text-align: center; margin: 4px; float: left; width: 102px; }"
	+ ".js-all-previewImages {margin-top: 15px; border-top: 1px solid #ececec; border-bottom: 1px solid #ececec; " + (JSKitLib.isIE() ? "zoom: 1;" : "") + "}"
	+ ".js-all-previewImages .js-previewImage { position: static; " + (JSKitLib.isIE() ? "zoom: 1;" : "") + " }"
	+ ".js-uploadImageButton { float: left; color: blue; cursor: pointer; }"
	+ ".js-previewImageTitle { background-color: #ececec; font-size: 7pt; float: left;}"
	+ ".js-uploadImageInputWrapper2 { margin: 0; padding: 0; position: absolute; top: 0px; left: 0px;}"
	+ ".js-uploadImageInputWrapper1 {position: relative;}"
	+ ".js-uploadGreyDescr { color: #c0c0c0; }"
	+ ".js-uploadImageIcon { height: 16px; vertical-align: "+(JSKitLib.isSafari()?"sub":"middle")+"; margin-right: 5px; }"
	+ ".js-CommentsPopupLink { cursor: pointer; }"
	+ ".js-kit-popupComments { z-index: 13900 !important; }"
	+ ".js-kit-popupComments .js-CommentsArea { padding: 7px }"
	+ ".js-kit-popupComments .js-LeaveComment { font-family: Arial; font-size: 11pt; }"
	+ ".js-kit-follow-popup-container { border: 4px solid #CBCBCB; text-align: left; }"
	+ ".js-kit-follow-popup-header { font-family: Verdana, Helvetica; font-weight: bold; font-size: 12pt; color: gray; }"
	+ ".js-kit-follow-popup-header, .js-kit-follow-popup-footer { padding: 10px; background: #ECECEC; }"
	+ ".js-kit-follow-popup-editNotifications { float: left; cursor: pointer; font-size: 14px; padding-top: 3px; }"
	+ ".js-kit-follow-popup-cancelButtonContainer, .js-kit-follow-popup-doneButtonContainer { float: right; }"
	+ ".js-kit-follow-popup-cancelButton { margin-right: 5px; }"
	+ ".js-kit-clickable { cursor: pointer; }"
	, 'cmt');
	if(JSKitLib.isOpera()) JSKitLib.addCss("wbr:after{content:\"\\00200B\"}", 'wbr');
	else JSKitLib.addCss(".js-singleCommentTEXT{word-wrap:break-word}", 'wbr');

	JSKitLib.addCss(""
	+ ".js-CommentsSkin-smoothgray .js-OldCommentsWrap {zoom:1; margin-bottom: 1px; clear: both; background-color: #cbcbcb; -moz-border-radius: 7px; -webkit-border-radius: 7px; padding: 5px; }"
	+ ".js-CommentsSkin-smoothgray .js-OldComments { background-color: #ececec; border: solid 1px #b0b0b0; padding: 4px; -moz-border-radius-topleft: 6px; -webkit-border-top-left-radius: 6px; -moz-border-radius-bottomleft: 6px; -webkit-border-bottom-left-radius: 6px; }"
	+ ".js-CommentsSkin-smoothgray .js-singleComment { border-style: none; margin: 0px; " + (JSKitLib.isIE() ? "zoom:1;" : "") + "; background: transparent; }"
	+ ".js-CommentsSkin-smoothgray .js-PageNOther { font-weight: bold; color: #0066cc; text-decoration: none; } "
	+ ".js-CommentsSkin-smoothgray .js-PageNCur { color: #fe9600; } "
	+ ".js-CommentsSkin-smoothgray .js-OldComments .js-CreateCommentArea { background-color: transparent; }"
	+ ".js-CommentsSkin-smoothgray .js-OldComments .js-singleCommentName { color: #0066cc; }"
	+ ".js-CommentsSkin-smoothgray .js-singleCommentBody { clear: both; color: #404040; background-color: #fefefe; padding: 4px 4px 4px 8px; -moz-border-radius-topleft: 6px; -webkit-border-top-left-radius: 6px; -moz-border-radius-bottomleft: 6px; -webkit-border-bottom-left-radius: 6px; " + (JSKitLib.isIE() ? "zoom:1;" : "") + "}"
	+ ".js-CommentsSkin-smoothgray .js-singleCommentCtls { float: right; }"
	+ ".js-CommentsSkin-smoothgray .js-singleCommentBg { zoom: 1; padding: 0.3em; position: relative; }"
	, "comments-skin-smoothgray");
	JSKitLib.addCss(".js-CommentsSkin-haloscan .js-singleComment { font-size: 11px; font-family: Verdana, Helvetica; border: none; zoom: 0; }"
	+ ".js-CommentsSkin-haloscan .js-singleCommentCtls { float: right; white-space: nowrap; }"
	+ ".js-CommentsSkin-haloscan .js-singleCommentAvatar { padding-bottom: 1em }"
	+ ".js-CommentsSkin-haloscan .js-LeaveComment { text-align: center; }"
	+ ".js-CommentsSkin-haloscan .js-commentControl, .js-CommentsSkin-haloscan .js-commentTool, .js-CommentsSkin-haloscan .js-poweredBy, .js-CommentsSkin-haloscan .js-poweredBy div { display: inline; float: none; }"
	+ ".js-CommentsSkin-haloscan .js-antispamBy { display: block; }"
	+ ".js-CommentsSkin-haloscan .js-CreateCommentBg { width: 30em; margin-top: 1em; margin-left: auto; margin-right: auto; padding: 0.5em; text-align: left; float: none; border: none; }"
	+ ".js-CommentsSkin-haloscan .js-singleCommentBg { padding: 0em }"
	, "comments-skin-haloscan");

	// new skin layout
	JSKitLib.addCss(''
	+ '.js-CommentsSkin-echo .jsk-ThreadWrapper { margin-bottom: 1em; padding: 10px; -moz-border-radius: 0.5em; -webkit-border-radius: 0.5em; ' + (JSKitLib.isIE() ? 'zoom:1;' : '') + ' }'
	+ '.js-CommentsSkin-echo .jsk-StreamWrapper { margin-bottom: 1em; background: url(//cdn.js-kit.com/images/dot-gray.png) repeat-x bottom; }'
	+ '.js-CommentsSkin-echo .jsk-HeaderWrapper { padding-top: 1em; padding-bottom: 1em; }'
	+ '.js-CommentsSkin-echo textarea.js-CmtText-noWYSIWYG, .js-CommentsSkin-echo textarea.js-CmtTextEdit-noWYSIWYG { border: 0px; background: #FFFFFF; padding: 0px; }'
	+ '.js-CommentsSkin-echo .jsk-CommentFormBody-noWYSIWYG, .js-CommentsSkin-echo .jsk-CommentEditFormBody-noWYSIWYG { ' + (JSKitLib.isIE() ? "zoom: 1;" : "") + ' border: 1px solid #BBBBBB; padding: 5px 7px; background: #FFFFFF; }'
	+ '.js-CommentsSkin-echo .js-commentTool { display: none; }'
	+ ".js-CommentsSkin-echo .js-singleCommentAvatar { background-position: center; }"
	+ ".js-PageMore { text-align: center; border: solid 1px #E4E4E4; padding: 10px; -moz-border-radius: 0.5em; -webkit-border-radius: 0.5em; cursor: pointer; font-weight: bold; background-color: #FFFFFF; " + (JSKitLib.isIE() ? "zoom: 1;" : "") + "}"
	+ '.jsk-HeaderInfoBox { float: left; }'
	+ '.jsk-HeaderInfoBoxImg { float: left; padding: 0px; width: 16px; height: 16px; }'
	+ '.jsk-CommentsCountWrap { float: left; ' + (JSKitLib.isIE() ? "zoom: 1;" : "") + ' padding: 0px; margin-left: 5px; line-height: normal !important; }'
	+ '.jsk-CommentsCount { font-weight: bold !important; }'
	+ '.jsk-HeaderMenu { float: right; }'
	+ '.jsk-HeaderPauseBox { display: none; margin: 0px; padding: 3px; float: right; vertical-align: middle;}'
	+ '.jsk-HeaderPauseBoxImg { float: left; width: 16px; margin-right: 2px; }'
	+ '.jsk-MenuAdmin { float: right; }'
	+ '.jsk-MenuAdmin .jskit-MenuItem { text-align: left; }'
	+ '.jsk-ItemWrapper { padding-bottom: 1em; padding-top: 1em; background: url(//cdn.js-kit.com/images/dot-gray.png) repeat-x top; line-height: 150%; }'
	+ '.jsk-ItemWrapper-borderless { background: none; }'
	+ '.jsk-ItemUserAvatarWrapper { float: left; padding: 2px; }'
	+ '.jsk-ItemContentWrapper { margin-left: 10px }'
	+ '.jsk-ItemFooter { text-align: left; }'
	+ '.jsk-ItemAttachmentsTitle { float: left; line-height: 100%; font-size: 0.8em; padding: 1px; }'
	+ '.jsk-ItemAttachmentIconWrapper { padding: 5px; border: 1px solid #ECECEC; }'
	+ '.jsk-ItemAttachmentWrapper { float: left; margin: 0px; margin: 5px 12px 5px 12px; text-align: center; width: 110px; }'
	+ '.js-singleCommentAdminStar { border: 0; width: 16px; height: 16px; vertical-align: middle; display: none; }'

	+ ".jsk-CommentFormSurface { zoom: 1; -moz-border-radius: 0.5em; -webkit-border-radius: 0.5em; border: 1px solid #dddddd; padding: 11px; line-height: normal; }"
	+ ".jsk-CommentFormAvatar { float: left; }"
	+ ".jsk-CommentFormFooter { margin-top: 11px; width: 100%; }"
	+ ".jsk-CommentFormAvatarsArea { border: 1px solid #bbbbbb; margin: 0em 0em 0.6em 0em; padding: 0.3em; }"
	+ ".jsk-CommentFormAvatarsArea .jsk-avt-section-label { font-weight: bold; font-size: 12px; }"
	+ ".jsk-CommentFormAvatarsArea .jsk-avt-upload-label { font-size: 8pt; }"
	+ ".jsk-CommentFormInputsWrapper { padding-left: 113px; margin-bottom: 11px; }"
	+ ".jsk-CommentFormButton { margin-left: 0.5em; }"
	+ ".jsk-CommentFormWrapper { margin-bottom: 1em; }"

	// new pager
	+ '.jsk-PagerWrapper { width: 100%; text-align: center; padding: 0.75em 0px; }'
	+ '.jsk-Pager { border: 0; margin: 0; padding: 0; display: inline; }'
	+ '.jsk-Pager li { border:0; margin:0; padding:0; list-style:none; display: inline; margin-left: 3px; }'
	+ '.jsk-Pager a { border: solid 1px #DDDDDD; }'
	+ '.jsk-Pager .jsk-PrevOff, .jsk-Pager .jsk-NextOff { color:#666666; padding: 5px 8px; }'
	+ '.jsk-Pager .jsk-Prev a, .jsk-Pager .jsk-Next a { border:solid 1px #DDDDDD; }'
	+ '.jsk-Pager .jsk-Active { color:#ff0084; font-weight:bold; padding: 5px 8px; }'
	+ '.jsk-Pager a:link, .jsk-Pager a:visited { color:#0063e3; padding: 4px 7px; text-decoration:none; }'
	+ '.jsk-Pager a:hover { border:solid 1px #666666; }'
	+ '.jsk-PagerItemHover { background-color: #E4E4E4; }'

	// new skin theme
	// colors:
	+ '.jsk-PrimaryBackgroundColor { background-color: #FFFFFF; }'
	+ '.jsk-SecondaryBackgroundColor { background-color: #f4f4f4; }'
	+ '.jsk-TrinaryBackgroundColor { background-color: #ECEFF5; }'
	+ '.jsk-PrimaryHighlightColor { color: #fffea9; }'
	+ '.jsk-SecondaryHighlightColor { color: #ffff00; }'
	+ '.jsk-PrimaryFontColor { color: #3a3a3a; }'
	+ '.jsk-SecondaryFontColor, .jsk-ThreadWrapper a.jsk-SecondaryFontColor { color: #c6c6c6; }'
	+ '.jsk-ThreadWrapper a, .jsk-LinkColor { color: #476cb8; }'
	+ '.jsk-H1Color { color: #878487; }'
	// fonts:
	+ '.jsk-PrimaryFont, .jsk-PrimaryFont a:hover, .jsk-CommentFormSurface input, .js-kit-follow-popup-container input { font-family: Lucida grande, Tahoma, Verdana, Arial; }'
	+ '.jsk-PrimaryFont { font-size: 8pt; font-weight: normal; }'
	+ '.jsk-H1Font { font-size: 1.38em; font-weight: bold; line-height: 1.4em; }'
	+ '.jsk-LinkFont, .jsk-ThreadWrapper a, .jsk-ThreadWrapper a:hover { text-decoration: none; font-weight: normal; }'

	// other skin's properties
	+ '.jsk-DisabledFontColor { color: #9c9c9c; }'
	+ '.jsk-ItemName { font-weight: bold; }'
	+ 'input.jsk-CommentFormButton { font-size: 1.25em; }'
	+ '.jsk-HeaderMenu table td { border-spacing: 0; padding: 0; margin: 0; vertical-align: middle; height: 16px; }'
	+ '.jsk-HeaderMenu table td .js-singleCommentMenuTitleExpandMarker { margin: 0; padding: 0; }'
	+ '.jsk-HeaderMenu .js-singleCommentMenuTitle { padding: 0; margin: 0; }'
	+ '.js-CommentsSkin-echo .js-poweredBy { font-family: Arial; font-size: 9px; color: #bbbbbb; margin-top: 1.2em; white-space: nowrap; line-height: normal; text-align: right; }'
	+ '.js-CommentsSkin-echo .js-poweredBy-wrapper { float: right; }'
	+ '.js-CommentsSkin-echo .js-poweredBy-logo { ' + (JSKitLib.isPreIE8() ? "zoom: 1;" : "") + ' border: none; margin-left: 5px; height: 14px; width: 25px; float: right; }'
	+ '.js-CommentsSkin-echo .js-poweredBy-text { ' + (JSKitLib.isIE() ? "zoom: 1; padding-bottom: 3px;" : "") + 'float: right; }'
	+ '.js-CommentsSkin-echo .js-commentAvatar { margin: 0; }'
	+ ".js-CommentsSkin-echo .js-commentFieldInput { outline: 0px; border: 0px solid; width: 100%; }"
	+ ".js-CommentsSkin-echo .js-commentFieldLabel { clear: none; margin: 0; }"
	+ ".js-CommentsSkin-echo .js-authSelector { float: none; }"
	+ '.js-CommentsSkin-echo .js-singleComment { border: none; }'
	+ '.js-CommentsSkin-echo .js-singleCommentBg { padding: 0; position: static; }'
	+ '.js-CommentsSkin-echo .jsk-ItemChildrenMarker { border-color: transparent transparent #ECEFF5; border-width: 0px 11px 11px; border-style: solid; margin: 3px 0px 0px 67px; height: 1px; width: 0px; display: none;' + (JSKitLib.isIE() ? ' font-size: 1px; line-height: 1px; filter: chroma(color=black);' : '') + ' }' // This is magic "arrow up". Only color and margins could be changed
	+ '.js-CommentsSkin-echo .jsk-ItemWrapperThread { padding-bottom: 1px; }'
	+ '.js-CommentsSkin-echo .jsk-ItemWrapperThread .jsk-ItemChildrenMarker { display: block; }'
	+ '.js-CommentsSkin-echo .jsk-ItemWrapperChild { padding: 10px; margin: 0px 20px 2px 0px; background-image: none; }'
	+ '.js-CommentsSkin-echo .js-singleCommentCtls { float: left; white-space: normal; }'
	+ '.js-CommentsSkin-echo .js-singleCommentDate { font-size: 1em; }'
	+ '.js-CommentsSkin-echo .js-previewImageDescr { width: 110px; }'
	+ '.js-CommentsSkin-echo .jsk-ItemAge { float: left; margin: 0 0.5em 0 0; }'
	+ '.js-CommentsSkin-echo .js-CommentWaitSubmit { position: absolute; left: 11px; bottom: 3px; }'
	+ '.js-CommentsSkin-echo .js-CommentWaitSubmitImg { margin-bottom: -3px; }'
	+ '.js-CommentsSkin-echo .js-CommentWaitSubmitLabel { margin-left: 5px; color: #000000; }'
	+ '.js-CommentsSkin-echo .js-CommentWaitSubmitRetry { display: none; }'
	+ '.js-CommentsSkin-echo .js-CommentWaitSubmitMsg { position: relative; -moz-border-radius: 0.5em; -webkit-border-radius: 0.7em; background-color: #FFFF99; border: solid 1px #C6C677; padding: 10px; margin: 0 40px; }'
	+ '.js-CommentsSkin-echo .js-CommentWaitSubmitWrapper { background-color: #FFFFFF; position: absolute; top: 0; left: 0; width: 100%; height: 100%; -webkit-transition: opacity 0.5s ease-out; -moz-border-radius: 0.5em; -webkit-border-radius: 0.7em; vertical-align : middle; text-align: center; }'
	+ '.js-singleViaLinkWrapper { text-align: right; float: right; margin-right: 7px; }'
	+ '.js-singleCommentViaIcon { ' + (JSKitLib.isIE() ? "zoom: 1;": "") + ' border: 0; margin: 0.1em 0.3em 0 0.3em; width: 16px; height: 16px; float: right; }'
	+ '.js-singleViaText { ' + (JSKitLib.isIE() ? "zoom: 1;": "") + ' margin-bottom: 0.5em; white-space: nowrap; float: right; }'
	+ 'table.mceToolbar { width: auto !important; }'
	+ 'table.mceLayout td { padding: 0px !important; }'
	+ (JSKitLib.isIE() && !JSKitLib.isPreIE8() ? 'table.mceLayout a { display: none; }' : '') // hiding <a> with empty text

	, 'comments-skin-echo');

	JSKitLib.addCss(""
	+ ".js-kit-lcf-Border { border: 1px solid #BBBBBB; overflow: hidden; }"
	+ ".jskit-GoogleLikeMenuBar { width: " + (JSKitLib.isIE() ? "79" : "75") + "px; height: 26px; border-right: 1px solid #BBBBBB; font-size: 12px; line-height: 26px; cursor: pointer; text-align: right; white-space: nowrap; background: url(//cdn.js-kit.com/images/google-like-button.png);}"
	+ ".jskit-GoogleLikeMenuBarExpandMarker { float: right; line-height: 12px; height: 10px; width: 10px; margin: 9px 5px 0px 5px; }"
	+ ".jskit-GoogleLikeMenuBarText { float: right; font-weight: bold; color: #3a3a3a; }"
	+ ".jskit-Dogtag { background-color: #E2E9FF; float: left; margin: 1px; -webkit-border-radius: 5px; -moz-border-radius: 5px; border: 1px solid #88AADD; white-space: nowrap; height: 22px; cursor: default; }"
	+ ".jskit-DogtagIcon { width: 16px; height: 16px; margin: 3px; float: left; }"
	+ ".jskit-DogtagCross { width: 10px; height: 10px; margin: 6px 5px 6px 0px; float: left; cursor: pointer; line-height: 10px; }"
	+ ".jskit-DogtagText { float: left; margin: 4px 7px 3px 2px; font-size: 11px; " + (JSKitLib.isIE() && document.compatMode == "BackCompat" ? "line-height: 22px; margin-top: 0px;" : "") + " }"
	+ ".js-nsgecko { -moz-user-select: none; }");
}

JSCC.prototype.setStreamState = function(paused, forced) {
	if (!forced && this.pause.forced) return;
	this.pause.state = paused;
	this.pause.forced = !!forced;
	this.renderPauseIndicator();
	if(!paused) {
		if(this.pause.queue.length > 0) {
			var events = this.pause.queue;
			this.pause.queue = [];
			this.renderSubscribeEvents(events);
		}
		this.renderPauseCounter();
	}
}

JSCC.prototype.renderPauseIndicator = function() {
	if(!this.pause.visible) return;
	JSKitLib.show(this.TC["jsk-HeaderPauseBox"], 'block');
	var state = this.pause.state;
	if(!this.pause.forced && !this.pause.visible) {
		this.pause.state = false;
	}
	JSKitLib.setStyle(this.TC["jsk-HeaderPauseBoxImg"], "background: url('//cdn.js-kit.com/images/control_" + (state ? "pause" : "play") + ".png') no-repeat center center");
	JSKitLib.text($JCL(state ? 'statePaused' : 'stateLive'), this.TC["jsk-HeaderPauseBoxName"], true);
	JSKitLib.preventSelect(this.TC["jsk-HeaderPauseBoxName"]);
}

JSCC.prototype.renderPauseCounter = function() {
	if(!this.pause.visible) return;
	JSKitLib.text(this.pause.queue.length == 0 ? '' : 
		'(' + this.pause.queue.length + ' ' + $JCL('itemsNew') + ')', this.TC["jsk-HeaderPauseBoxCount"], true);
	JSKitLib.preventSelect(this.TC["jsk-HeaderPauseBoxCount"]);
}

JSCC.prototype.setDefaultField = function(name,value) {
	JSKitLib.fmap.call(this, ["fieldDfl", "extraFormFields"], function(section) {
		this[section][name] = JSKitEPB.getValue(name) || value || "";
	});
}

JSCC.prototype.addChild = function(to, what) {
	if (typeof(to) != 'object')
		return;

	if(arguments.length == 3 && arguments[2])
		to.insertBefore(what, to.firstChild);
	else
		to.appendChild(what);
}

JSCC.prototype.a = function() {
	var a = this.cr("a");
	a.href = "javascript:void(0);";
	for(var text = '', i = 0; i < arguments.length; i++)
		text += arguments[i];
	a.innerHTML += text;
	return a;
}

JSCC.prototype.div = function(id) {
	var self = this;
	var div = this.cr("div");
	for(var i = 1; i < arguments.length; i++) {
		var arg = arguments[i];
		switch(typeof(arg)) {
		case "string":
			this.addChild(div, document.createTextNode(arg));
			break;
		case "undefined":
			break;
		default:
		case "object":
			if(!arg) break;
			this.addChild(div, arg);
			break;
		}
	}
	if(id) {
		div.className = id;
		var arr = String(id).split(/[ ]+/);
		JSKitLib.map(function(el) {
			if(el.substr(0, 3) == 'js-')
				self.TC[el] = div;
		}, arr);
	}
	return div;
}

JSCC.prototype.dtComment
 = '<div class="js-singleComment">'
 + '<div class="js-singleCommentBg">'
 + '<div class="js-singleCommentAvatar"></div>'
 + '<div class="js-singleCommentINFO">'
   + '<span class="js-singleCommentName">{Name}</span>'
   + '<img class="js-singleCommentUrl" src="//cdn.js-kit.com/images/icon10-external-url.png" />'
   + '<div class="js-singleCommentDate">{Date}</div>'
 + '</div>'
 + '<div class="js-singleCommentRating" style="display:none;"></div>'
 + '<div class="js-singleCommentText">{Text}</div>'
 + '<div style="clear: both"></div>'
 + '<div class="js-singleCommentNotice">{Notice}</div>'
 + '<div class="js-singleCommentPreviewImage"></div>'
 + '<div class="js-singleCommentKarmaComMod">'
     + '<div class="js-singleCommentMenu"></div>'
     + '<div class="js-singleCommentKarma">{Label:likeThisComment}'
         + ' [<a class="js-singleCommentKarmaY">{Label:yes}</a>]'
         + ' [<a class="js-singleCommentKarmaN">{Label:no}</a>]'
     + ' <span class="js-singleCommentKarmaScore">({Label:Score}:'
     + ' <span class="js-singleCommentKarmaValue">0</span> {Label:byVotes}'
     + ' <span class="js-singleCommentKarmaVoters">0</span>)'
     + '</span>'
     + '</div>'
     + '<div class="js-singleCommentKarmaShow">{Label:communityAssignedCarmaScore}:'
     + ' <span class="js-singleCommentKarmaValueShow">0</span> {Label:byVotes}'
     + ' <span class="js-singleCommentKarmaVotersShow">0</span>'
     + '</div>'
   + '<div class="js-singleCommentCtls">'
     + '<span class="js-singleCommentReplyable">[<a class="js-singleCommentReply">{Label:btnReply}</a>]</span>'
     + '<span class="js-singleCommentDeletable"> [<a class="js-singleCommentDelete">{Label:btnDelete}</a>]</span>'
     + '<span class="js-singleCommentEditable"> [<a class="js-singleCommentEdit">{Label:btnEdit}</a>]</span>'
     + '<span class="js-singleCommentModeratable"> [<a class="js-singleCommentModerate">{Label:btnModerate}</a>]</span>'
   + '</div>'
 + '</div>'
 + '<br clear="all" />'
 + '</div>'
 + '</div>'
;

JSCC.prototype.dtComment2
 = '<div class="js-singleComment">'
 + '<div class="js-singleCommentBg">'
 + '<div class="js-singleCommentHeader">'
 + '<div style="float: left;">'
   + '<span class="js-singleCommentName">{Name}</span>'
   + '<img class="js-singleCommentUrl" src="//cdn.js-kit.com/images/icon10-external-url.png" />'
   + ' {Label::depth?replies:says}:'
 + '</div>'
 + '<div class="js-singleCommentDate" style="float: right;">{Age}</div>'
 + '<div style="clear: both"></div>'
 + '</div>'
 + '<div class="js-singleCommentBody">'
 + '<table border="0" width="100%" cellspacing="0" cellpadding="0" class="js-singleCommentBodyT">'
 + '<tr style="vertical-align: top"><td colspan="2" style="padding-bottom: 8px;">'
 + '<div class="js-singleCommentRating" style="display:none;"></div>'
 + '<div class="js-singleCommentText"><span class="js-singleCommentQuote">&#x201C;</span>{Text}</div>'
 + '<div class="js-singleCommentNotice">{Notice}</div>'
 + '<div class="js-singleCommentPreviewImage"></div>'
 + '</td><td width="{avatarPlaceWidth+4}" align="right" rowspan="2">'
 + '<div class="js-singleCommentAvatar"></div>'
 + '</td></tr><tr><td style="vertical-align: bottom">'
     + '<div class="js-singleCommentMenu"></div>'
     + '<div class="js-singleCommentKarma"><span>{Label:likeThisComment}</span>'
         + ' [<a class="js-singleCommentKarmaY">{Label:yes}</a>]'
         + ' [<a class="js-singleCommentKarmaN">{Label:no}</a>]'
     + ' <span class="js-singleCommentKarmaScore">({Label:Score}:'
     + ' <span class="js-singleCommentKarmaValue">0</span> {Label:byVotes}'
     + ' <span class="js-singleCommentKarmaVoters">0</span>)'
     + '</span>'
     + '</div>'
     + '<div class="js-singleCommentKarmaShow">{Label:communityAssignedCarmaScore}:'
     + ' <span class="js-singleCommentKarmaValueShow">0</span> {Label:byVotes}'
     + ' <span class="js-singleCommentKarmaVotersShow">0</span>'
     + '</div>'
 + '</td><td style="vertical-align: bottom;">'
   + '<div class="js-singleCommentCtls">'
     + '<span class="js-singleCommentReplyable"><div class="js-singleCommentReply"><div>{Label:btnReply}</div></div></span>'
     + '<span class="js-singleCommentDeletable"><div class="js-singleCommentDelete"><div>{Label:btnDelete}</div></div></span>'
     + '<span class="js-singleCommentEditable"><div class="js-singleCommentEdit"><div>{Label:btnEdit}</div></div></span>'
     + '<span class="js-singleCommentModeratable"><div class="js-singleCommentModerate"><div>{Label:btnModerate}</div></div></span>'
   + '</div>'
 + '</td></tr></table>'
 + '</div>'	// Body
 + '</div>'
 + '</div>'
;

JSCC.prototype.dtComment3
 = '<div class="js-singleComment"><div class="js-singleCommentBg">'
 + '<div class="MessageCell">'
 + '<a name="{ID}"></a>'
 + '<div class="former_p"><div class="js-singleCommentAvatar"></div>'
 + '<span class="js-singleCommentText">{Text}</span><br />'
 + '<div class="js-singleCommentPreviewImage"></div>'
 + '<span class="byline"><span class="js-singleCommentName">{Name}</span>'
 + '<img class="js-singleCommentUrl" src="//cdn.js-kit.com/images/icon10-external-url.png" /> '
 + '<span class="js-singleCommentEditable">'
 + '<a href="" class="js-singleCommentEdit" title="Edit comment">'
 + '<img src="//cdn.js-kit.com/images/halo-button-edit.png" title="Edit comment" alt="Edit comment" border="0">'
 + '</a>'
 + '</span>'
 + '<span class="js-singleCommentModeratable">'
 + '<a href="" class="js-singleCommentDelete" title="Delete comment">'
 + '<img src="//cdn.js-kit.com/images/halo-button-delete.png" title="Delete comment" alt="Delete comment" border="0">'
 + '</a>'
 + '</span>'
 + ' <span class="js-singleCommentDate">{Date}</span> - <span class="js-singleCommentDate">{Time}</span> | <a href="#{ID}" title="Link to this comment">#</a>'
 + '</span></div>'
 + '</div></div><div style="clear: both;"><hr /></div></div>'
;

JSCC.prototype.dtCommentEcho
 = '<div class="js-singleComment jsk-ItemWrapper jsk-PrimaryFont">'
 + '<div class="js-singleCommentBg">'
	 + '<div class="js-singleCommentAvatar jsk-ItemUserAvatarWrapper"></div>'
	 + '<div style="margin-left: {avatarPlaceWidth}px;">'
		 + '<div class="jsk-ItemContentWrapper">'
			 + '<div class="jsk-ItemBody jsk-PrimaryFontColor">'
				 + '<img src="//cdn.js-kit.com/images/stars/admin-comment.png" class="js-singleCommentAdminStar" title="{Label:userIsAdmin}" /> '
				 + '<span class="js-singleCommentName jsk-ItemName jsk-LinkColor jsk-LinkFont">{Name}</span>'
				 + '<span class="js-singleCommentIP jsk-SecondaryFontColor">{IP}</span>'
				 + '<img class="js-singleCommentUrl" src="//cdn.js-kit.com/images/icon10-external-url.png" /> '
				 + '<br />'
				 + '<span class="js-singleCommentText jsk-ItemBodyText">{Text}</span>'
				 + '<div class="js-singleCommentRating" style="display:none;"></div>'
			 + '</div>'
			 + '<div class="js-singleCommentPreviewImage jsk-ItemAttachmentsWrapper">'
			 + '</div>'
			 + '<div class="jsk-ItemFooter">'
				 + '<div>'
				 	 + '<div class="js-singleCommentDate jsk-ItemAge jsk-SecondaryFontColor">{Age}</div>'
					 + '<div class="js-singleCommentCtls">'
						 + '<span class="js-singleCommentFlagable">'
							 + '<span class="jsk-SecondaryFontColor"> &ndash; </span>'
							 + '<a class="js-singleCommentFlag js-singleCommentControl jsk-SecondaryFontColor">{Label:btnFlag|ucf}</a>'
						 + '</span>'
						 + '<span class="js-singleCommentLikeable">'
							 + '<span class="jsk-SecondaryFontColor"> &ndash; </span>'
							 + '<a class="js-singleCommentLike js-singleCommentControl jsk-SecondaryFontColor">{Label:btnLike|ucf}</a>'
						 + '</span>'
						 + '<span class="js-singleCommentReplyable">'
							 + '<span class="jsk-SecondaryFontColor"> &ndash; </span>'
							 + '<a class="js-singleCommentReply js-singleCommentControl jsk-SecondaryFontColor">{Label:btnReply|ucf}</a>'
						 + '</span>'
						 + '<span class="js-singleCommentDeletable">'
							 + '<span class="jsk-SecondaryFontColor"> &ndash; </span>'
							 + '<a class="js-singleCommentDelete js-singleCommentControl jsk-SecondaryFontColor">{Label:btnDelete|ucf}</a>'
						 + '</span>'
						 + '<span class="js-singleCommentEditable">'
							 + '<span class="jsk-SecondaryFontColor"> &ndash; </span>'
							 + '<a class="js-singleCommentEdit js-singleCommentControl jsk-SecondaryFontColor">{Label:btnEdit|ucf}</a>'
						 + '</span>'
						 + '<span class="js-singleCommentModeratable">'
							 + '<span class="jsk-SecondaryFontColor"> &ndash; </span>'
							 + '<a class="js-singleCommentModerate js-singleCommentControl jsk-SecondaryFontColor">{Label:btnModerate|ucf}</a>'
						 + '</span>'
					 + '</div>'
					+ '<div style="clear: both;"></div>'
					+ '<div class="js-singleCommentLikedBy jsk-SecondaryFontColor"></div>'
					+ '<div style="clear: both;"></div>'
			 	+ '</div>'
			 + '</div>'
		 + '</div>'
	 + '</div>'
	 + '<div class="jsk-ItemChildrenMarker"></div>'
	 + '<div style="clear: both;"></div>'
 + '</div>'
 + '</div>'
;

JSCC.prototype.ffComment
 = '<div class="js-singleComment jsk-ItemWrapper jsk-PrimaryFont">'
 + '<div class="js-singleCommentBg">'
	 + '<div class="js-singleCommentAvatar jsk-ItemUserAvatarWrapper"></div>'
	 + '<div style="margin-left: {avatarPlaceWidth}px;">'
		 + '<div class="jsk-ItemContentWrapper">'
			 + '<div class="jsk-ItemBody jsk-PrimaryFontColor">'
				 + '<img src="//cdn.js-kit.com/images/stars/admin-comment.png" class="js-singleCommentAdminStar" title="{Label:userIsAdmin}" /> '
				 + '<span class="js-singleCommentName jsk-ItemName jsk-LinkColor jsk-LinkFont">{content.user.name}</span>'
				 + '<img class="js-singleCommentUrl" src="//cdn.js-kit.com/images/icon10-external-url.png" /> '
				 + '<br />'
				 + '<span class="js-singleCommentText jsk-ItemBodyText">{content.title}</span>'
				 + '<div class="js-singleCommentRating" style="display:none;"></div>'
			 + '</div>'
			 + '<div class="js-singleCommentPreviewImage jsk-ItemAttachmentsWrapper">'
			 + '</div>'
			 + '<div class="jsk-ItemFooter">'
			 	 + '<div class="js-singleCommentDate jsk-ItemAge jsk-SecondaryFontColor">{Age}</div>'
				 + '<div class="js-singleCommentCtls">'
					 + '<span class="js-singleCommentFlagable">'
						 + '<span class="jsk-SecondaryFontColor"> &ndash; </span>'
						 + '<a class="js-singleCommentFlag js-singleCommentControl jsk-SecondaryFontColor">{Label:btnFlag|ucf}</a>'
					 + '</span>'
					 + '<span class="js-singleCommentLikeable">'
						 + '<span class="jsk-SecondaryFontColor"> &ndash; </span>'
						 + '<a class="js-singleCommentLike js-singleCommentControl jsk-SecondaryFontColor">{Label:btnLike|ucf}</a>'
					 + '</span>'
					 + '<span class="js-singleCommentReplyable">'
						 + '<span class="jsk-SecondaryFontColor"> &ndash; </span>'
						 + '<a class="js-singleCommentReply js-singleCommentControl jsk-SecondaryFontColor">{Label:btnReply|ucf}</a>'
					 + '</span>'
					 + '<span class="js-singleCommentDeletable">'
						 + '<span class="jsk-SecondaryFontColor"> &ndash; </span>'
						 + '<a class="js-singleCommentDelete js-singleCommentControl jsk-SecondaryFontColor">{Label:btnDelete|ucf}</a>'
					 + '</span>'
				 + '</div>'
				 + '<div class="js-singleViaLinkWrapper">'
				 	+ '<a class="js-singleCommentViaThirdPartyService jsk-SecondaryFontColor" href="{Via}" target="_blank">'
						+ '<div class="js-singleViaText"> via {content.service.name}</div>'
						+ '<div class="js-singleCommentViaIcon"></div>'
					+ '</a>'
			 	+ '</div>'
				+ '<div style="clear: both;"></div>'
				+ '<div class="js-singleCommentLikedBy jsk-SecondaryFontColor"></div>'
				+ '<div style="clear: both;"></div>'
			 + '</div>'
		 + '</div>'
	 + '</div>'
	 + '<div class="jsk-ItemChildrenMarker"></div>'
	 + '<div style="clear: both;"></div>'
 + '</div>'
 + '</div>'
;

JSCC.prototype.dtHeaderEcho
 = '<div class="jsk-HeaderWrapper jsk-PrimaryFont">'
	 + '<div class="jsk-HeaderInfoBox">'
		 + '<div class="jsk-HeaderInfoBoxImg"></div>'
		 + '<div class="jsk-CommentsCountWrap jsk-CommentsCount jsk-H1Color jsk-H1Font">{Title}'
		 + '&nbsp;<span class="jsk-CommentsCount jsk-SecondaryFontColor jsk-PrimaryFont">{CountLabel}</span></div>'
		 + '<div class="js-kit-clear"></div>'
	 + '</div>'
	 + '<div class="jsk-HeaderMenu jsk-LinkFont jsk-LinkColor">'
		 + '<div class="jsk-MenuAdmin"></div>'
		 + '<div class="jsk-HeaderPauseBox jsk-SecondaryFontColor">'
			+ '<div class="jsk-HeaderPauseBoxImg">&nbsp;</div>'
			+ '<span class="jsk-HeaderPauseBoxName"></span>'
			+ '&nbsp;'
			+ '<span class="jsk-HeaderPauseBoxCount jsk-PrimaryFont"></span>'
			+ '&nbsp;&ndash;'
		+ '</div>'
	 + '</div>'
	 + '<div style="clear: both;"></div>'
 + '</div>'
;

JSCC.prototype.dtCreate
 = '<div class="js-CreateComment">'
 + '<div class="js-CreateCommentBg">'
 + '<div class="js-commentFieldSubject">{Label:leaveComment}</div>'
 + '<div class="js-AuthAreaWrap"></div>'
 + '<div class="js-commentFieldLabel">{Label:nicknameLabel}</div>'
 + '<div><input class="js-commentFieldInput" name="js-CmtName" size="32" maxlength="100"/></div>'
 + '<div class="js-commentInputUrl">'
 + '<div class="js-commentFieldLabel">{Label:url}</div>'
 + '<div><input class="js-commentFieldInput" name="js-CmtUrl" size="32" maxlength="100"/></div>'
 + '</div>'
 + '<div class="js-commentInputEmail">'
 + '<div class="js-commentFieldLabel">{Label:emailLabel}'
   + '<div class="js-commentFieldNote">{Label:emailNote}</div>'
 + '</div>'
 + '<div><input class="js-commentFieldInput" name="js-CmtEmail" type="text" SIZE=32 /></div>'
 + '</div>'
 + '<div class="js-commentFieldLabel js-commentRatingDisplay">{Label:ratingLabel}</div>'
 + '<div class="js-commentFieldRating js-commentRatingDisplay"></div>'
 + '<div class="js-commentFieldLabel">{Label:commentLabel}</div>'
 + '<div><textarea class="js-commentFieldInput" name="js-CmtText" ROWS=4 COLS=32></textarea></div>'
 + '<div class="js-commentAvatarLabel js-commentFieldLabel">{Label:avatar}</div>'
 + '<div class="js-commentAvatar"></div>'
 + '<div class="js-commentImageArea"></div>'
 + '<div class="js-uploadImageInput"></div>'
 + '<div class="js-CCButtons">'
   + '<input type="submit" name="js-Cmtsubmit" class="js-CmtButton" VALUE="{Label:submit}">'
   + '<input type="reset" name="js-Cmtcancel" class="js-CmtButton" VALUE="{Label:cancel}">'
   + '<span class="js-CCMore">[<a class="js-commentMore">{Label:more}</a>]</span>'
 + '</div>'
 + '<div class="js-poweredBy js-antispamBy js-poweredByJSKit">(<a href="http://js-kit.com/comments?wow" target="js-kit">Powered by JS-kit</a>)</div>'
 + '<div class="js-poweredBy js-antispamBy">(Spam filtering by <a href="http://akismet.com/" target="akismet">Akismet</a>)</div>'
 + '</div><br clear="all" /></div>'
;

JSCC.prototype.dtCreate2
 = '<div class="js-CreateComment">'
 + '<div class="js-CreateCommentArea">'
 + '<div class="js-commentFieldSubject" style="margin: 0">{Label:leaveComment}</div>'
 + '<div class="js-CreateCommentFieldsWrap">'
 + '<div class="js-CreateCommentFields">'
 + '<div class="js-commentAvatar"></div>'
 + '<div class="js-CreateCommentFieldsBaseInfo">'
 + '<div class="js-AuthAreaWrap"></div>'
 + '<div class="js-commentInputName">'
 + '<div class="js-commentFieldLabel">{Label:nicknameLabel}</div>'
 + '<div class="js-authContainer"><input class="js-commentFieldInput" name="js-CmtName" size="32" maxlength="100"/></div>'
 + '</div>'
 + '<div class="js-commentInputUrl">'
 + '<div class="js-commentFieldLabel">{Label:url}</div>'
 + '<div class="js-authContainer"><input class="js-commentFieldInput" name="js-CmtUrl" size="32" maxlength="100"/></div>'
 + '</div>'
 + '<div class="js-commentInputEmail">'
 + '<div class="js-commentFieldLabel">{Label:emailLabel}'
   + '<div class="js-commentFieldNote">{Label:emailNote}</div>'
 + '</div>'
 + '<div class="js-authContainer"><input class="js-commentFieldInput" name="js-CmtEmail" type="text" SIZE=32 /></div>'
 + '</div>'
 + '</div>'
 + '<div class="js-commentFieldLabel js-commentRatingDisplay">{Label:ratingLabel}</div>'
 + '<div class="js-commentFieldRating js-commentRatingDisplay"></div>'
 + '<div class="js-commentFieldLabel js-commentBodyLabel">{Label:commentLabel}</div>'
 + '<div class="js-commentCmtTextarea"><textarea class="js-commentFieldInput" name="js-CmtText" ROWS=4 COLS=32></textarea></div>'
 + '<div class="js-commentImageArea"></div>'
 + '</div>' // Fields
 + '<div class="js-CCButtons">'
   + '<div class="js-uploadImageButton">'
    + '<img class="js-uploadImageIcon" src="//cdn.js-kit.com/images/picture_add.png"></img>{Label:addPicText}'
   + '</div>'
   + '<div class="js-commentPubOptions"></div>'
   + '<div class="js-commentSubmit">'
   + '<input type="reset" name="js-Cmtcancel" class="js-CmtButton" VALUE="{Label:cancel}">'
   + '<input type="submit" name="js-Cmtsubmit" class="js-CmtButton" VALUE="{Label:submit}">'
 + '</div>'
 + '<div style="clear: both"></div>'
 + '</div>'
 + '<div class="js-uploadImageInputWrapper1">'
   + '<div class="js-uploadImageInputWrapper2">'
     + '<div class="js-uploadImageInput"></div>'
   + '</div>'
 + '</div>'
 + '<div class="js-poweredBy js-antispamBy js-poweredByJSKit">(<a href="http://js-kit.com/comments?wow" target="js-kit">Powered by JS-kit</a>)</div>'
 + '<div class="js-poweredBy js-antispamBy">(Spam filtering by <a href="http://akismet.com/" target="akismet">Akismet</a>)</div>'
 + '</div>'
 + '</div><br clear="all" /></div>'
;

JSCC.prototype.dtCreate3
 = '<div class="js-CreateComment">'
 + '<div class="js-CreateCommentBg">'
 + '<div class="js-commentFieldSubject">{Label:leaveComment}</div>'
 + '<div class="js-AuthAreaWrap"></div>'
 + '<div class="js-commentFieldLabel">{Label:nicknameLabel}</div>'
 + '<div><input class="js-commentFieldInput" name="js-CmtName" size="32" maxlength="100"/></div>'
 + '<div class="js-commentInputEmail">'
 + '<div class="js-commentFieldLabel">{Label:emailLabel}'
   + '<div class="js-commentFieldNote">{Label:emailNote}</div>'
 + '</div>'
 + '<div><input class="js-commentFieldInput" name="js-CmtEmail" type="text" SIZE=32 /></div>'
 + '</div>'
 + '<div class="js-commentInputUrl">'
 + '<div class="js-commentFieldLabel">{Label:url}</div>'
 + '<div><input class="js-commentFieldInput" name="js-CmtUrl" SIZE=32 /></div>'
 + '</div>'
 + '<div class="js-commentFieldLabel js-commentRatingDisplay">{Label:ratingLabel}</div>'
 + '<div class="js-commentFieldRating js-commentRatingDisplay"></div>'
 + '<div class="js-commentFieldLabel">{Label:commentLabel}</div>'
 + '<div><textarea class="js-commentFieldInput" name="js-CmtText" ROWS=4 COLS=32></textarea></div>'
 + '<div class="js-commentImageArea"></div>'
 + '<div class="js-uploadImageInput"></div>'
 + '<div class="js-CCButtons"><input type="submit" name="js-Cmtsubmit" class="js-CmtButton" VALUE="{Label:submit}">'
 + '<input type="reset" name="js-Cmtcancel" class="js-CmtButton" VALUE="{Label:cancel}">'
 + '<span class="js-CCMore">[<a class="js-commentMore">{Label:more}</a>]</span>'
 + '</div>'
 + '<div class="js-poweredBy js-antispamBy js-poweredByJSKit">(<a href="http://js-kit.com/comments?wow" target="js-kit">Powered by JS-kit</a>)</div>'
 + '<div class="js-poweredBy js-antispamBy">(Spam filtering by <a href="http://akismet.com/" target="akismet">Akismet</a>)</div>'
 + '</div><br clear="all" /></div>'
;

JSCC.prototype.dtCreateEcho 
= '<div class="js-CreateComment jsk-CommentFormWrapper jsk-PrimaryFont jsk-PrimaryFontColor">'
	+ '<div class="jsk-CommentFormSurface jsk-SecondaryBackgroundColor">'
		+ '<div class="js-kit-lcf-userInfoWrapper"></div>'
		+ '<div class="js-commentFieldRating js-commentRatingDisplay"></div>'
		+ '<div class="jsk-CommentFormBody"><textarea class="js-commentFieldInput jsk-PrimaryFont" name="js-CmtText" ROWS="6" COLS="32"></textarea></div>'
		+ '<div class="jsk-CommentFormFooter">'
			+ '<div class="js-kit-lcf-extraControlsMenuWrapper"></div>'
			+ '<div class="js-commentSubmit">'
				+ '<input type="reset" name="js-Cmtcancel" class="jsk-CommentFormButton" value="{Label:cancel}">'
				+ '<input type="submit" name="js-Cmtsubmit" class="jsk-CommentFormButton" value="{Label:post}">'
			+ '</div>'
			+ '<div style="clear: both;"></div>'
		+ '</div>'
		+ '<div class="js-kit-lcf-extraControlsMenuContent"></div>'
	+ '</div>'
	+ '<div class="js-poweredBy js-poweredBy-echo"></div>'
	+ '<div style="clear: both;"></div>'
+ '</div>';

JSCC.prototype.dtProfileCreate
 = '<div class="js-CreateComment">'
 + '<div class="js-CreateCommentArea">'
 + '<div class="js-commentFieldSubject" style="margin: 0">{Label:leaveComment}</div>'
 + '<div class="js-CreateCommentFieldsWrap">'
 + '<div class="js-CreateCommentFields">'
 + '<div class="js-AuthAreaWrap"></div>'
 + '<div class="js-pmFieldLabel">{Label:nicknameLabel}</div>'
 + '<div><input class="js-commentFieldInputProfile" name="js-CmtName" size="32" maxlength="100"/></div>'
 + '<div>'
 + '<div class="js-pmFieldLabel">{Label:emailLabel}'
   + '<div class="js-commentFieldNote">{Label:emailNote}</div>'
 + '</div>'
 + '<div><input class="js-commentFieldInputProfile" name="js-CmtEmail" type="text" SIZE=32 /></div>'
 + '</div>'
 + '<div class="js-pmFieldLabel">{Label:commentLabel}</div>'
 + '<div><textarea class="js-commentFieldInputProfile" name="js-CmtText" ROWS=4 COLS=32></textarea></div>'
 + '</div>' // Fields
 + '<div class="js-CCButtons">'
 + '<div class="js-commentSubmit">'
 + '<input type="reset" name="js-Cmtcancel" class="js-CmtButton" VALUE="{Label:cancel}">'
 + '<input type="submit" name="js-Cmtsubmit" class="js-CmtButton" VALUE="{Label:submitPM}">'
 + '</div>'
 + '<div style="clear: both"></div>'
 + '</div>'
 + '</div>'
 + '</div><br clear="all" /></div>'
;

JSCC.prototype.dtEditComment
 = '<div class="js-EditComment" style="display: none">'
 + '<div class="js-CreateCommentBg">'
 + '<div class="jsk-CommentEditFormBody"><textarea class="js-commentFieldInput" name="js-CmtTextEdit" ROWS=4 COLS=32></textarea></div>'
 + '<div class="js-CCButtons"><input type="submit" name="js-CmtsubmitEdit" class="js-CmtButton" VALUE="{Label:save}">'
 + '<input type="reset" name="js-CmtcancelEdit" class="js-CmtButton" VALUE="{Label:cancel}">'
 + '</div></div></div>'
;

JSCC.prototype.dtEditComment2
 = '<div class="js-EditComment" style="display: none">'
 + '<div class="js-CreateCommentArea">'
 + '<div class="js-CreateCommentFieldsWrap">'
 + '<div><textarea class="js-commentFieldInput" name="js-CmtTextEdit" ROWS=4 COLS=32></textarea></div>'
 + '<div class="js-CCButtons">'
 + '<div class="js-commentSubmit">'
 + '<input type="reset" name="js-CmtcancelEdit" class="js-CmtButton" VALUE="{Label:cancel}">'
 + '<input type="submit" name="js-CmtsubmitEdit" class="js-CmtButton" VALUE="{Label:save}">'
 + '</div>'
 + '<div style="clear: both"></div>'
 + '</div></div></div></div>'
;

JSCC.prototype.dtConversation
 = '<div class="js-ConversationWrapper">'
 + '<div class="js-Conversation">'
 + '{Label}<span class="js-ConversationName"><b>{Name}</b></span>'
 + '</div>'
 + '</div>'
;

JSCC.prototype.dtMiniProfileLeaveComment =
  '<div class="js-kit-miniProfile">' +
      '<div class="js-kit-miniProfile-avatar"></div>' +
      '<div class="js-kit-miniProfileDataContainer">' +
          '<div class="js-kit-miniProfileDataWrap">' +
              '<div class="js-kit-miniProfileNameWrap">' +
                  '<div class="js-kit-miniProfile-name"></div>' +
                  '<div class="js-kit-miniProfile-logout">' +
                      '<div class="js-kit-miniProfile-logoutLink"></div>' +
                      '<div class="js-kit-miniProfile-logoutIcon"></div>' +
               	      '<div class="js-kit-clear"></div>' +
                  '</div>' +
                  '<div class="js-kit-clear"></div>' +
              '</div>' +
              '<div class="js-kit-miniProfileSitesWrap">' +
                  '<div class="js-kit-miniProfile-siteLinksIcons"></div>' +
                  '<div class="js-kit-miniProfile-addAnotherSite"></div>' +
                  '<div class="js-kit-clear"></div>' +
              '</div>' +
          '</div>' +
      '</div>' +
      '<div class="js-kit-clear"></div>' +
  '</div>';

JSCC.prototype.dtCreateUserInfoLogged =
  '<div class="js-kit-userInfoWrap js-kit-loggedUserInfo">' +
    '<div class="js-kit-lcf-miniProfileWrapper"></div>' +
    '<div class="js-kit-lcf-toMenu"></div>' +
  '</div>';

JSCC.prototype.dtCreateUserInfoNonLogged =
  '<div class="js-kit-userInfoWrap js-kit-nonLoggedUserInfo">' +
    '<div class="js-kit-lcf-avatarsManagerWrapper js-kit-lcf-Border"></div>' +
    '<div class="js-kit-basicUserInfoWrap">' +
      '<div class="js-kit-lcf-fromMenuAnonymous"></div>' +
      '<div class="js-kit-lcf-toMenu"></div>' +
    '</div>' +
    '<div class="js-kit-clear"></div>' +
  '</div>';

JSCC.prototype.dtCommentsPopupLink
 = '<a class="js-CommentsPopupLink" href=\"javascript:void(0);\">{LinkLabel}</a>';

JSCC.prototype.dtPostingCommentDialog
 = '<div class="js-CommentWaitSubmitWrapper">'
	+ '<div class="js-CommentWaitSubmitMsg">'
		+ '<img class="js-CommentWaitSubmitImg" src="//cdn.js-kit.com/images/loading-yellow.gif" />'
		+ '<b><span class="js-CommentWaitSubmitLabel"></span>'
		+ '<span class="js-CommentWaitSubmitRetry"> ('
		+ '<a class="js-CommentWaitSubmitPost">{Label:retry}</a>/'
		+ '<a class="js-CommentWaitSubmitCancel">{Label:cancel}</a>'
		+')</span></b>'
	+ '</div>'
 + '</div>';

JSCC.prototype.dtFollowPanel =
'<div class="js-kit-follow-wrapper">' +
	'<div class="js-kit-follow-leftColumn">' +
		'<div class="js-kit-follow-emailIcon"></div>' +
	'</div>' +
	'<div class="js-kit-follow-rightColumnWrapper">' +
		'<div class="js-kit-follow-rightColumn">' +
			'<div class="js-kit-follow-label">{Label:follow_emailNotification}</div>' +
			'<div class="js-kit-follow-notifyModeSelector">' +
				'<div class="js-kit-follow-notifyOptionContainer">' +
					'<div class="js-kit-follow-notifyOptionRadio js-kit-follow-notifyOptionRadio-noemail"></div>' +
					'<div class="js-kit-follow-notifyOptionLabel js-kit-follow-notifyOptionLabel-noemail">{Label:follow_notifyMode_noemail}</div>' +
					'<div class="js-kit-clear"></div>' +
				'</div>' +
				'<div class="js-kit-follow-notifyOptionContainer">' +
					'<div class="js-kit-follow-notifyOptionRadio js-kit-follow-notifyOptionRadio-email"></div>' +
					'<div class="js-kit-follow-notifyOptionLabel js-kit-follow-notifyOptionLabel-email">{Label:follow_notifyMode_email}</div>' +
					'<div class="js-kit-clear"></div>' +
				'</div>' +
				'<div class="js-kit-follow-notifyOptionContainer">' +
					'<div class="js-kit-follow-notifyOptionRadio js-kit-follow-notifyOptionRadio-anymails"></div>' +
					'<div class="js-kit-follow-notifyOptionLabel js-kit-follow-notifyOptionLabel-anymails">{Label:follow_notifyMode_anymails}</div>' +
					'<div class="js-kit-clear"></div>' +
				'</div>' +
			'</div>' +
			'<div class="js-kit-follow-emailContainer">' +
				'<span>{Label:follow_emailAddressLabel}</span>' +
				'<span class="js-kit-follow-emailAddress"></span>' +
				'<span>' +
					'(<a class="js-kit-follow-editProfileLink" href="javascript:void(0);">{Label:follow_editProfile}</a>)' +
				'</span>' +
			'</div>' +
		'</div>' +
	'</div>' +
	'<div class="js-kit-clear"></div>' +
	'<div class="js-kit-follow-leftColumn">' +
		'<div class="js-kit-follow-rssIcon"></div>' +
	'</div>' +
	'<div class="js-kit-follow-rightColumnWrapper">' +
		'<div class="js-kit-follow-rightColumn">' +
			'<div class="js-kit-follow-label">{Label:follow_rssThread}</div>' +
			'<div class="js-kit-follow-rssContainer">' +
				'<div class="js-kit-follow-rightSubColumn">' +
					'<img src="//cdn.js-kit.com/images/rssButton.png" class="js-kit-follow-rssThreadButton" />' +
				'</div>' +
				'<div class="js-kit-follow-leftSubColumnWrapper">' +
					'<div class="js-kit-follow-leftSubColumn">' +
						'<input type="text" class="js-kit-follow-rssThreadInput js-kit-follow-input" />' +
					'</div>' +
				'</div>' +
				'<div class="js-kit-clear"></div>' +
			'</div>' +
		'</div>' +
	'</div>' +
	'<div class="js-kit-clear"></div>' +
'</div>';

JSCC.prototype.dtFollowPanelPopup =
  '<div class="js-kit-follow-popup-container jsk-PrimaryFont jsk-PrimaryFontColor">' +
      '<div class="js-kit-follow-popup-header">{Label:follow_popupHeader}</div>' +
      '<div class="js-kit-follow-popup-content"></div>' +
      '<div class="js-kit-follow-popup-footer">' +
	  '<div class="js-kit-follow-popup-editNotifications jsk-LinkColor">{Label:follow_editMyNotifications}</div>' +
	  '<div class="js-kit-follow-popup-doneButtonContainer">' +
	      '<input class="js-kit-follow-popup-doneButton" value="{Label:follow_doneButton}" type="button" />' +
	  '</div>' +
	  '<div class="js-kit-follow-popup-cancelButtonContainer">' +
	      '<input class="js-kit-follow-popup-cancelButton" value="{Label:follow_cancelButton}" type="button" />' +
	  '</div>' +
	  '<div class="js-kit-clear"></div>'
      '</div>' +
  '</div>';

JSCC.prototype.dtExpirationBanner =
  '<div class="js-kit-exp-banner-container">' +
      '<div class="js-kit-exp-banner-header">' +
          '<div class="js-kit-exp-banner-title">{Label:expirationBanner_title}</div>' +
          '<div class="js-kit-exp-banner-description">{Label:expirationBanner_description}</div>' +
      '</div>' +
      '<div class="js-kit-exp-banner-domain-wrap">' +
          '<span class="js-kit-exp-banner-label">{Label:expirationBanner_domain}</span>' +
          '<span class="js-kit-exp-banner-domain"></span>' +
      '</div>' +
      '<div class="js-kit-exp-banner-subscription-wrap">' +
          '<span class="js-kit-exp-banner-label">{Label:expirationBanner_subscriptionType}</span>' +
          '<span class="js-kit-exp-banner-subscription"></span>' +
      '</div>' +
      '<div class="js-kit-exp-banner-creation-wrap">' +
          '<span class="js-kit-exp-banner-label">{Label:expirationBanner_serviceFirstDate}</span>' +
          '<span class="js-kit-exp-banner-creation"></span>' +
      '</div>' +
      '<div class="js-kit-exp-banner-expiration-wrap">' +
          '<span class="js-kit-exp-banner-label">{Label:expirationBanner_expirationDate}</span>' +
          '<span class="js-kit-exp-banner-expiration"></span>' +
      '</div>' +
      '<div class="js-kit-exp-banner-button-container">' +
          '<input class="js-kit-exp-banner-button" type="button">' +
      '</div>' +
  '</div>';

JSCC.prototype.localDate = function(t) {
	if(!t) return "";
	var d = new Date(t * 1000);
	return d.toLocaleDateString();
}

JSCC.prototype.localTime = function(t) {
	if(!t) return "";
	var d = new Date(t * 1000);
	return d.toLocaleTimeString();
}

JSCC.prototype.localAge = function(t) {
	if(!t) return "";
	if(t)
	var d = new Date(t * 1000);
	var offset = d.getTimezoneOffset() * 60;
	var day = Math.ceil(((new Date()).valueOf() - offset * 1000) / 86400000) * 86400;
	var when = Math.floor((day - t + offset) / 86400);
	switch(when) {
	case 0: when = $JCL("leftToday"); break;
	case 1: when = $JCL("leftYesterday"); break;
	default:
		if(when > 0 && when < 6)
			when = when + $JCL("leftDaysAgo");
		else
			when = d.toLocaleDateString();
	}
	return when + ", " + d.toLocaleTimeString();
}

JSCC.prototype.viaLink = function(content) {
	if (!content) return "";

	if (content.service && content.service.profileUrl) {
		return content.service.profileUrl;
	} else if (content.user && content.user.profileUrl) {
		return content.user.profileUrl;
	} else {
		return "";
	}
}

JSCC.prototype.JCL = function(v) {
	return $JCL(
		(v == 'leaveComment') ? (this.config.label || v) : v
	);
}

JSCC.prototype.gtmpl = function(t, mObj) {
	var s = this;
	var lowercase = function(a, m) { return String(m).toLowerCase(); }
	t = t.replace(/^[^<]*(<[\s\S]*>)[^>]*$/, "$1");
	t = t.replace(/(<[\/]?[A-Z]+)/g, lowercase);
	if(mObj && mObj.ID) t = t.replace(/(<[a-z]+)/, '$1 id="' + mObj.ID + '"');
	t = t.replace(/{Label:([^:\|}]+[^\|}]*)\|?([^}]*)}/g,
		function(a, m, modifier) {
			var loc = s.JCL(m);
			switch (modifier) {
				case 'uc' : loc = loc.toUpperCase(); break;
				case 'lc' : loc = loc.toLowerCase(); break;
				case 'ucf': loc = loc.substr(0, 1).toUpperCase() + loc.substr(1); break;
			}
			return loc;
		});
	t = t.replace(/{([a-zA-Z]+\.)+([a-zA-Z]+)}/g,
		function(a) {
			var arr = a.substr(1,a.length-2).split(/\./);
			var res = mObj;
			JSKitLib.fmap(arr, function(v) {
				if(res[v]) {
					res = res[v]
				} else {
					return '';
				}
			});
			return res || '';
		});
	return t;
}

JSCC.prototype.tmpl = function(t, obj, dontPutId) {
	var self = this;
	t = self.gtmpl(t, dontPutId ? false : obj);
	t = t.replace(/{Age}/g, self.localAge(obj.TS));
	t = t.replace(/{Date}/g, self.localDate(obj.TS));
	t = t.replace(/{Time}/g, self.localTime(obj.TS));
	t = t.replace(/{Via}/g, self.viaLink(obj.content));
	if (obj.IP) t = t.replace(/{IP}/g, " (" + obj.IP + ")");
	var text = String(obj.Text);
	if ((obj.status == 'M' || obj.status == 'H')
		&& (this.serverOptions.mmode == 'pre' || this.serverOptions.mmode == 'onhold' || (obj.msgtype && obj.msgtype.match(/T|P/)))) {
		text += (this.serverOptions.mtext || '');
	}
	text = text.replace(/^[ \s]+|[ \s]+$/, '');
	text = text.replace(/\n\n+/g, '\n\n');
	text = text.replace(/\n/g, '&nbsp;<br />');
	if(text.indexOf('<') == -1)
	text = text.replace(/([^&<>\s]{12})([^&<>\s]{12})/g, '$1<wbr></wbr>$2');
	text = text.replace(/{/g, '&#123;');
	t = t.replace(/{Text}/g, text);
	t = t.replace(/{Label:(:([a-z]+)\?([^:}]*):([^}]*))?([^}]*)}/g,
		function(a,b,p,f,s,m){
			if(p) m = (obj[p]?f:s)+m;
			return $JCL(m);
		});
	var d = {"SO:":this.serverOptions,"":obj};
	t = t.replace(/{([A-Z]+:)?([A-Za-z0-9]+)(\+\d+)?}/g,
		function(a,t,m,p){ var v = ((d[t]||obj)[m])||''; if(p) v = parseInt(v) + parseInt(p); return v; });
	return t;
}

JSCC.prototype.setCommentStyle = function(cmt, className) {
	var el = cmt.ctls['js-singleCommentBody'] || cmt;
	if(el) JSKitLib.addClass(el,className);
}

JSCC.prototype.cmtSetSpamStatus = function(cmt, s) {
	cmt.cobj.status = s ? 'S' : 'A';
	if(s) {
		this.setCommentStyle(cmt, "js-CmtSpam");
	} else {
		cmt.style.backgroundColor = "";
		cmt.style.backgroundImage = "";
		cmt.style.color = '';
	}
	if(cmt.domINFO) cmt.domINFO.style.backgroundColor = s ? '#ffffe0' : "";
}

JSCC.prototype.cmtSetOffensiveStatus = function(cmt, s) {
	cmt.cobj.status = s ? 'O' : 'A';
	if(s) {
		this.setCommentStyle(cmt, "js-CmtSpam");
	} else {
		cmt.style.backgroundColor = "";
		cmt.style.backgroundImage = "";
		cmt.style.color = '';
	}
	if(cmt.domINFO) cmt.domINFO.style.backgroundColor = s ? '#ffffe0' : "";
}

JSCC.prototype.blockAction = function(action) {
	var s = this;
	var cid = s.ctBlock.forId;
	var cmt = s.jspg.getItemById(cid).div;
	s.hideSettingsWindow('ctBlock');
	switch(action) {
	case "approve":
		s.cmtApprove(cid);
		break;
	case "approveuser":
		s.cmtApproveUser(cid);
		break;
	case "delete":
		s.cmtDelete(cid, 'delete');
		break;
	case "spam":
		s.cmtSetSpamStatus(cmt, true);
		s.cmtDelete(cid, 'spam');
		break;
	case "ip":
	case "user":
		s.cmtDelete(cid, 'block_by_action', action);
		break;
	case "unban":
		s.cmtDelete(cid, action);
	}
}

JSCC.prototype.moderationCommentsListUpdate = function(id, moderate) {
	if (moderate) this.moderationCommentsList[id] = true;
	else delete this.moderationCommentsList[id];
	return true;
}

JSCC.prototype.hideExpirationBanner = function() {
	if (!this.expirationBanner) return;
	this.expirationBanner.parentNode.removeChild(this.expirationBanner);
	delete this.expirationBanner;
}

JSCC.prototype.showExpirationBanner = function(target) {
	var s = this;
	var recalcPosition = function() {
		var coords = {
			"local": JSKitLib.findPos(target),
			"global": JSKitLib.findPos(s.target)
		};
		s.expirationBanner.style.top = (coords.local[1] + target.offsetHeight) + "px";
		s.expirationBanner.style.left = (coords.global[0] + (s.target.offsetWidth - s.expirationBanner.offsetWidth)/2) + "px";
	};
	if (s.expirationBanner) {
		recalcPosition();
		return;
	}
	var template = s.gtmpl(s.dtExpirationBanner);
	var descriptors = {
		"domain": function() {
			return JSKitLib.text(s.config.domain);
		},
		"creation": function(element, dom) {
			if (s.account.creation) {
				return JSKitLib.text(s.localDate(s.account.creation));
			}
			JSKitLib.hide(dom.get("creation-wrap"));
		},
		"expiration": function() {
			return JSKitLib.text(s.localDate(s.account.expiration));
		},
		"subscription": function() {
			var subscriptions = {
				"free": "Echo Free",
				"pro": "Echo Live",
				"proplus": "Echo PRO"
			};
			return JSKitLib.text(subscriptions[s.account.subscription || "free"]);
		},
		"button": function(element) {
			JSKitLib.setEventHandler(element, ["click"], function() {
				window.open("//js-kit.com/settings/pricing.cgi?site=" + s.config.domain, "_blank");
			});
		}
	};
	s.expirationBanner = JSKitLib.toDOM(template, "js-kit-exp-banner-", descriptors).content;
	s.target.appendChild(s.expirationBanner);
	recalcPosition();
}

JSCC.prototype.cmtBlock = function(cid) {
	var s = this;
	var cmt = s.jspg.getItemById(cid).div;
	if (s.account.expired) {
		s.showExpirationBanner(cmt.domCtls || cmt.domINFO);
		return;
	}
	var status = cmt.cobj.status;
	var msgtype = cmt.cobj.msgtype || '';
	var cmtreason;
	if (status && status=='S' && cmt.cobj.reason) {
		switch (cmt.cobj.reason) {
		case 'Blocked by User':
		case 'User':
			cmtreason = 'User';
			break;
		case 'IP':
		case 'Blocked by IP':
			cmtreason = 'IP';
			break;
		}
	}
	if(s.ctBlock) { s.hideSettingsWindow('ctBlock'); return; }
	if(!s.blockDom) { s.blockDom = {}; }
	if(!s.blockDom[status]) { s.blockDom[status] = {}; }
	if(!s.blockDom[status][cmtreason]) { var jca = '$JCA[' + s.jcaIndex + '].blockAction';
	var cb = function(a, d) {
		return '" class="js-ControlBlockButton" '+(d ? 'disabled="on"' : '')+'" onclick="this.blur();'+jca+"('"+a+'\');return false;" /></span></td></tr>';}
	var trth =  '<tr><td style="font-size: 9pt; background-color: #8192a2; color: #ffffff;"align=left><nobr>';
	var trtd = '</nobr></td></tr><tr><td class="js-ControlBlockText">';
	var trtdd = '</nobr></td></tr><tr><td class="js-ControlBlockTextDisabled">';
	var tinp = '<span style="float:right"><input type=submit value="';

	var mtrt = trtd, aumsg, ammsg;
	switch(status) {
	case 'A':
		mtrt = trtdd;
		aumsg = $JCL("userHasTrustedStatus");
		ammsg = $JCL("messageIsNotBlocked");
		break;
	case 'S':
		aumsg = $JCL("approveMessagesFromUser");
		ammsg = $JCL("messageIsNotSpam");
		break;
	case 'O':
		aumsg = $JCL("approveMessage");
		ammsg = $JCL("messageIsNotSpam");
	default: // M/H
		aumsg = $JCL("approveFutureMessagesFromUser");
		ammsg = $JCL("acceptMessage");
	}

	var unbantext = trth + $JCL("unblockCommenter")
		+ trtd + $JCL("liftBanFromUser")
		+ tinp + $JCL("unbanUser")+cb('unban');

	s.blockDom[status][cmtreason] = JSKitLib.html('<table border="0" cellpadding="4" cellspacing="0">'
	+ (s.serverOptions.mmode != 'onhold' ? '' : (
		trth + $JCL("approveUser") + trtd + aumsg
		+ tinp + $JCL("approveUser") + cb('approveuser')))
	+ trth + $JCL("approveMessage")
	+ mtrt + ammsg
	+ tinp + $JCL("approveMessage") + cb('approve')
	+ trth + $JCL("deleteUnwantedComment")
	+ trtd + $JCL("getRidOfComment")
	+ tinp + $JCL("deleteMessage") + cb('delete')
	+ ((cmtreason == 'User' || cmtreason == 'IP') ?
		'' :
		trth + $JCL("flagAsSpam")
		+ trtd + $JCL("trainAksimet")
		+ tinp + $JCL("spamJunk") + cb('spam'))
	+ ((cmtreason == 'User') ?
		unbantext
		: trth + $JCL("blockCommenter")
		+ trtd + $JCL("hideCommentsFromUser")
		+ tinp + $JCL("blockUser")+cb('user'))
	+ ((cmtreason == 'IP') ?
		unbantext
		: trth + $JCL("blockCommenterIP")
		+ trtd + $JCL("hideCommentsFromIP")
		+ tinp + $JCL("blockIP")+cb('ip'))
	+ "</table>");
	}
	s.settingsWindow('ctBlock', cmt.domCtls || cmt.domINFO, s.blockDom[status][cmtreason]);
	s.ctBlock.forId = cid;
}
JSCC.prototype.cmtApprove = function(cid) {
	var cmt = this.jspg.getItemById(cid).div;
	if(cmt.cobj.status == 'S') {
		this.cmtSetSpamStatus(cmt, false);
		cmt.cobj.status = 'S'; // cmtDelete's deal
	}
	if(cmt.cobj.status == 'O') {
		this.cmtSetOffensiveStatus(cmt, false);
		cmt.cobj.status = 'O';
	}
	this.cmtDelete(cid, 'message');
}

JSCC.prototype.cmtApproveUser = function(cid) {
	var cmt = this.jspg.getItemById(cid).div;
	if(cmt.cobj.status == 'S') {
		this.cmtSetSpamStatus(cmt, false);
		cmt.cobj.status = 'S'; // cmtDelete's deal
	}
	this.cmtDelete(cid, 'user');
}

JSCC.prototype.routeAction = function(fun) {
	var a = [this];
	for(var i = 0; i < $JCA.length; i++) {
		if($JCA[i].jcaIndex != this.jcaIndex
		&& $JCA[i].config.domain == this.config.domain
		&& $JCA[i].config.path == this.config.path
		&& $JCA[i].config['display-mode'] == 'inline'
		&& !this.IM && !$JCA[i].IM && !$JCA[i].config.userProfileComments)
			a.push($JCA[i]);
	}
	for(var i = 0; i < a.length; i++) {
		var e = a[i];
		if(i) e.serverFilter = function(n) {
			return (n == 's-data.js'); }
		fun.apply(e);
		delete e.serverFilter;
	}
}

JSCC.prototype.cmtDelete = function(cid, approvalMode) {
	var args = arguments;
	this.routeAction(function() {
		this.cmtDeleteAct.apply(this, args);
	});
}

JSCC.prototype.cmtDeleteAct = function(cid, approvalMode, action) {
	var s = this;
	var item = this.jspg.getItemById(cid);
	if (!item) return;
	var cmt = item.div;
	if(!cmt) {
		(this.objById[cid]||{}).status = 'D';
		this.jspg.deleteItem(cid);
		this.reCalcPages();
		return;
	}

	if(arguments.length == 1) approvalMode = 'delete';

	var oldStatus = cmt.cobj.status;
    
	var path = (this.config.moderate || (this.config.nolc && !this.IM)) ?
		cmt.cobj.path : this.config.path;
	if(this.config.nolc && !this.IM)
		this.config.domain = cmt.cobj.domain;
	this.moderationCommentsListUpdate(cid);
	var idlist = [{'id': cid, 'p': path}];
	switch(approvalMode) {
	case 'message':
		if (!this.inlineModeration) {
			this.preHandlerDelete(cmt);
		}
		if(oldStatus == 'S') {
			this.groupModerationRequest(approvalMode,
				{'spam': idlist, 'appr': [], 'del': []});
			cmt.cobj.action = 'unban';
		} else if(oldStatus == 'O') {
			this.groupModerationRequest(approvalMode,
				{'spam': [], 'appr': idlist, 'del': []});
		} else {
			this.groupModerationRequest(approvalMode,
				{'spam': [], 'appr': [], 'del': idlist});
		}
		if (this.inlineModeration) this.postHandlerModerate(cid);
		break;
	case 'user':
		if (!this.inlineModeration) {
			this.preHandlerDelete(cmt);
		}
		this.groupModerationRequest(approvalMode, idlist,
				(oldStatus == 'S' ? {'junk': 'no'} : {}));
		if (this.inlineModeration) this.postHandlerModerate(cid);
		break;
	case 'delete':
		this.preHandlerDelete(cmt);
		this.groupModerationRequest(approvalMode, idlist);
		break;
	case 'block_by_action':
		this.preHandlerDelete(cmt);
		this.groupModerationRequest('block' + action, idlist);
		cmt.cobj.action = 'ban';
		break;
	case 'unban':
		if (!this.inlineModeration) {
			this.preHandlerDelete(cmt);
		}
		this.groupModerationRequest(approvalMode, idlist);
		cmt.cobj.action = 'ban';
		if (this.inlineModeration) this.postHandlerModerate(cid);
		break;
	case 'spam':
		this.groupModerationRequest(approvalMode, idlist);
		setTimeout(function() { // screen del
			s.removeComment(cmt, true);
		}, 1000);
		break;
	case 'ignore':
		/* Just delete from screen */
	default:
		this.removeComment(cmt, true);
	}
}

JSCC.prototype.preHandlerDelete = function(cmt) {
	this.publishEvent('comment-deleting', {'cmtId': cmt.cobj.ID});
}

JSCC.prototype.postHandlerDelete = function(cmt) {
	this.publishEvent('comment-deleted', {'cmtId': cmt.cobj.ID});
}

JSCC.prototype.removeComment = function(cmt, useRecursion) {
	var cobj = cmt.cobj;
	var deletedPageIdx = this.jspg.getPageByItemId(cobj.ID);
	if(cobj.ParentID && this.objById[cobj.ParentID]) {
		var prn = this.objById[cobj.ParentID];
		this.jspg.invalidateItemView(cobj.ParentID);
		var parentPageIdx = this.jspg.getPageByItemId(cobj.ParentID);
		this.jspg.invalidatePagesView(parentPageIdx, deletedPageIdx-parentPageIdx);
	} else {
		if(deletedPageIdx && cobj.ParentID) this.jspg.invalidatePagesView(deletedPageIdx-1, 1);
	}
	if(cobj.cedge) {
		var curItemIdx = this.jspg.getItemIdxById(cobj.ID);
		if((cobj.cedge==1 && !this.IM && typeof curItemIdx!='undefined') || (cobj.cedge==2 && typeof curItemIdx!='undefined')) {
			var itemIdxD = cobj.cedge==1 ? 1 : -1;
			var items = this.jspg.getItems(curItemIdx+itemIdxD, 1);
			if(items.length && items[0]) items[0].obj.cedge += cobj.cedge;
		}
	}
	var self = this;
	var deletedComment = function(dobj) {
		return (dobj.status=='D' || dobj.status=='DT');
	}
	var delCount = deletedComment(cobj) ? 0 : 1;
	if(this.IM) {
		var cnt = 0;
		var deletedPageItems = this.jspg.getPageItems(deletedPageIdx);
		JSKitLib.fmap(deletedPageItems, function(V){
			if(!deletedComment(V.obj) && V.obj.conversation==cobj.conversation) cnt++;
		});
		if(cnt>1) {
			if(cmt.cobj.hasCnvs) {
				cmt.cobj.status = 'DT';
				this.jspg.invalidateItemView(cobj.ID);
			} else {
				this.jspg.deleteItem(cmt.cobj.ID);
			}
		} else if(cnt<=1){
			JSKitLib.fmap(deletedPageItems, function(V){
					if(V.obj.conversation==cobj.conversation) self.jspg.deleteItem(V.obj.ID);
			});
		}
	} else {
		delCount = this.jspg.deleteItem(cobj.ID);
		this.reCalcPages();
	}
	this.ctag = null;
	var pageNo = this.curPage;
	this.curPage = 0;
	this.displayPage(pageNo, function(immed){
			if(immed) {
				if(useRecursion && this.jspg.getItemById(cmt.cobj.ID)) {
					self.removeComment(cmt);
				}
			}
	});
	return delCount;
}

JSCC.prototype.postHandlerModerate = function(cid) {
	var cmt = this.jspg.getItemById(cid).div;
	cmt.cobj.status = 'A';
	this.jspg.invalidateItemView(cid);
	var pageNo = this.curPage;
	this.curPage = 0;
	this.displayPage(pageNo);
}

JSCC.prototype.createCommentAsHTML = function(obj) {
	if(obj.status == 'D') return '';
	if(this.objppc) this.objppc(obj);
	return this.tmpl(this.dtComment, obj);
}

JSCC.prototype.getUserProperty = function(name, defaultValue) {
	return JSKitEPB.getValue(name) || this.TC && this.TC["js-Cmt" + name] && !JHI2.isEmpty(this.TC["js-Cmt" + name]) && this.TC["js-Cmt" + name].value || defaultValue;
}

JSCC.prototype.markOffensive = function(cid) {
	if(confirm($JCL("isJunkVote"))) {
		if ((this.adminMode) && (!this.inlineModeration)) {
			this.cmtDelete(cid);
		} else {
			var item = this.jspg.getItemById(cid);
			if(!item) return;
			var obj = item.obj;
			var req = {
				'id': cid,
				'permalink': this.config.permalink,
				'Text': obj.Text ||
					(obj.content ? obj.content.title : ''),
				'Name': this.getUserProperty("Name", $JCL("guest"))
			};
			this.server('-mark.off', req);
		}
	}
}

JSCC.prototype.getLikeInstanceByID = function(cid){
	var comment = this.jspg.getItemById(cid);
	return comment.obj.likeInstance; 
}

JSCC.prototype.postLikeVote = function(cid, obj) {
	var voter = {
		"name" : this.getUserProperty("Name", "")
	};
	var avatar = this.avatarsManager.getActiveAvatar();
	if (avatar) {
		voter.avatar = avatar.name;
		voter.avatar_width = avatar.width;
		voter.avatar_height = avatar.height;
	}
	var likeInstance = this.getLikeInstanceByID(cid);
	if (likeInstance.busy) return;
	likeInstance.busy = true;
	likeInstance.renderLikeControl("progress");
	likeInstance.sendRequest(voter);	
}

JSCC.prototype.handleLikeResponse = function(cid, action, data){
	this.routeAction(function() {
		this.serverOptions.profile = data.profile;
		var likeInstance = this.getLikeInstanceByID(cid);
		likeInstance.busy = false;
		likeInstance.vote(action, data);
	});
}

JSCC.prototype.showProfile = function(target, data, extraConfig) {
	if (data.ProfileURL && !data.profile) {
		window.open(data.ProfileURL);
		return;
	}
	var s = this;
	var so = s.serverOptions;
	if (!data.profile || (data.profile != so.profile && !so.showProfile) || $JSKitGlobal.isProfileLoaded == "no") return;
	var applyFollowPanelsCallback = function(func) {
		JSKitLib.fmap([s.followPanel, s.followPanelPopup], function(panel) {
			if (panel) func(panel);
		});
	};
	var config = JSKitLib.foldl({
		"parentTarget" : s.target,
		"targetRef" : JSKitLib.getRef(s),
		"whiteLabel" : so.whitelabel,
		"callbacks" : {
			"onsave" : function(profile) {
				s.extraFormFields["Email"] = profile.getEmail() || "";
				var email = s.extraFormFields["Email"] || $JCL("follow_emptyEmail");
				applyFollowPanelsCallback(function(panel) {
					var link = panel.get("emailAddress");
					var action = s.extraFormFields["Email"] ? "remove" : "add";
					JSKitLib.text(email, link, true);
					JSKitLib[action + "Class"](link,
						"js-kit-follow-activeNotifyMode-" + so.notifyMode);
				});
			},
			"onload" : function(profile) {
				if (profile.isYours()) so.profile = profile.getProfileID();
				applyFollowPanelsCallback(function(panel) {
					var link = panel.get("editProfileLink");
					JSKitLib.text($JCL("follow_editProfile"), link, true);
					JSKitLib.removeClass(link, "js-kit-follow-openingProfile");
					JSKitLib.addClass(panel.get("rssThreadButton"), "js-kit-follow-rssButton");
				});
			}
		}
	}, extraConfig || {}, function(value, acc, key) { acc[key] = value; });
	if (!$JSKitGlobal.profileObjectInitialized) {
		$JSKitGlobal.isProfileLoaded = "no";
		JSKitLib.addScript(s.uriDomain + "/widgets/profile.js", target, function() {
			$JSKitGlobal.isProfileLoaded = "yes";
			JSKW$openProfile(data.profile, target, config);
		});
	} else JSKW$openProfile(data.profile, target, config);
}

JSCC.prototype.appendProfileHandler = function(target, data) {
	var self = this;
	var isAvailable = this.serverOptions.showProfile && (data.profile || data.ProfileURL);
	var avatarDims = {"width": "48", "height": "48"};
	var openProfile = function(element) {
		JSKitLib.addEventHandler(element, ["click"], function(e) {
			JSKitLib.stopEventPropagation(e);
			JSKitLib.preventDefaultEvent(e);
			self.showProfile(target, data);
			return false;
		});
	};
	JSKitLib.addClass(target, "js-kit-clickable");
	if (this.IM || this.getSkin() != "echo") return openProfile(target); 
	if (data.event_publisher) {
		data.Name = data.content.user.name
	}
	var descr = {
		"avatar": function(element) {
			var container = {
				"instance": element,
				"width": avatarDims.width,
				"height": avatarDims.height
			};
			self.appendAvatarImage(container, data);
			if (isAvailable) openProfile(element);
		}
	};
	if (isAvailable) descr.name = descr.viewDetails = function(element) { openProfile(element); };
	var config = {
		"labels": $JCL,
		"uriDomain": self.uriDomain,
		"uriAvatar": self.uriAvatar,
		"avatarSize": avatarDims,
		"cssPrefix": "js-kit-singleCmtMiniProfile js-kit-singleCmtProfile" + (isAvailable ? "Enabled" : "Disabled"),
		"descriptors": descr,
		"openFullProfile": function() { self.showProfile(target, data); },
		"isNativeProfileDisabled": !isAvailable
	};
	
	eval("var wp = " + JSKitLib.htmlUnquote((data.Webpresence || "[]")));
	var webpresence = JSKitLib.fmap(wp, function(item) {
		if (!item[2] || item[2] == "checked") {
			var type = item[0].replace(/login-/, "");
			var group = item[0].match(/login-/) ? "login" : "web";
			if (group == "web" && !self.serverOptions.extraFieldURL) return;
			var identity = self.jskauth.assembleIdentity(item[1], type, group);
			if (type == "gfc" && self.jskauth.getAuthIdentity("gfc")) {
				identity.url = item[1];
				identity.params.domain = self.config.domain;
			}
			return identity;
		}
	});
	var url = data.Url ? [self.jskauth.assembleIdentity(data.Url, "home", "web")] : [];
	data.identities = {"auth": {}, "web": JSKitLib.merge(webpresence, url)};
	
	var clearTimer = function(timer) {
		clearTimeout(timer);
		timer = undefined;
	};
	var openMiniProfile = function(ttl) {
		clearTimer(self.miniProfileCollapseTimer);
		self.miniProfileExpandTimer = setTimeout(function() {
			if (data.miniProfile) {
				data.miniProfile.display(target);
			} else {
				data.miniProfile = new JSKitMiniProfile(target, data, config);
			}
			data.miniProfile.getContent().onmouseover = function() {
				clearTimer(self.miniProfileCollapseTimer);
			};
		}, ttl);
	};
	target.onclick = function() { openMiniProfile(0); }
	target.onmouseover = function() { openMiniProfile(JSCC.MINI_PROFILE_TTL); }
	target.onmouseout = function() {
		clearTimer(self.miniProfileExpandTimer);
		self.miniProfileCollapseTimer = setTimeout(function() {
			JSKW$Events.syncBroadcast("miniProfile_collapseAll");
		}, JSCC.MINI_PROFILE_TTL);
	};
}

JSCC.prototype.fixComment = function(cmt, obj, pageIdx, globalIdx, itemsOnPage) {
	var self = this;
	if (obj.profile == this.serverOptions.profile) obj.yours = true;
	var so = this.serverOptions;
	var cfg = this.config;
	var typeCondition = obj.msgtype && obj.msgtype.match(/T|P/) && !so.trackbackreply;
	var flagCondition = !so.commod || obj.yours || cfg.nolc || typeCondition;
	var anonymous = so.anonymousCmt && !self.jskauth.isLogged();
 
	self.objById[obj.ID] = obj;
	if(obj.status == 'D') {
		cmt.style.display = 'none';
		return;
	}

	if(obj.depth) {
		cmt.style.marginLeft = this.level4margin(obj.depth)
	} else {
		obj.depth = 0;
	}

	var ctls = JSKitLib.mapClass2Object({}, cmt);
	cmt.ctls = ctls;
	cmt.cobj = obj;
	var imgArea = cmt.ctls["js-singleCommentPreviewImage"];
	if (imgArea && cmt.cobj.imgs && cmt.cobj.imgs.length && self.config.uploadImages){ 
		self.addChild(imgArea,self.createImages(cmt.cobj.imgs));
		imgArea.style.display = "block";
	}

	var jsc = function(t){return ctls['js-singleComment'+t]}

	var switchClasses = function(controls, class2add, class2remove) {
		JSKitLib.fmap(controls, function(element) {
			JSKitLib.addClass(element, class2add);
			JSKitLib.removeClass(element, class2remove);
		});
	};

	var appendHoverActions = function(controls){
		var container = jsc("");
		if (!container || self.getSkin() != "echo") return;
		JSKitLib.addEventHandler(container, ["mouseout"], function() {
			switchClasses(controls, "jsk-SecondaryFontColor", "jsk-LinkColor");
		});
		JSKitLib.addEventHandler(container, ["mouseover"], function() {
			switchClasses(controls, "jsk-LinkColor", "jsk-SecondaryFontColor");
		});
	};

	cmt.bg = jsc('Bg');
	var stripe = jsc('Body') || jsc('');
	stripe.className += " js-singleCommentDepth" + (obj.depth || 0);
	if (this.useEcho()) {
		if (obj.depth) {
			stripe.className += " jsk-TrinaryBackgroundColor jsk-ItemWrapperChild";
			switchClasses([cmt.bg], 'jsk-TrinaryBackgroundColor', 'js-singleCommentBg');
		} else if (obj.thread && obj.thread.length) {
			stripe.className += " jsk-ItemWrapperThread";
		}
	}
	if(!(cmt.style.display.match(/none/))){
		stripe.className += " js-comment-stripe-" + ((globalIdx % this.stripecount) + 1);
	}

	if(self.IM && typeof(obj.conversation)=='number') {
		if(obj.hasCnvs) {
			this.appendConversation(cmt, obj.conversation);
		} else {
			this.appendConversationChild(cmt);
		}
	}

	/* Handle avatars */
	if(obj.status!='DT' && obj.status!='DD') self.placeAvatar(obj, jsc('Avatar'));

	/* Handle if ratings are present */
	if (obj.Rating > 0 && ( ! this.isStandalone()) ) {
		var self = this;
		var action = function() {
			if (!jsc('Rating')) return;
			jsc('Rating').appendChild(self.createMiniStarObject(obj.Rating, 10));
			jsc('Rating').appendChild(JSKitLib.html('<div style="clear: left;"></div>'));
			JSKitLib.show(jsc('Rating'));
		}
		$JSKitGlobal.tryRatingsAppObjectAction(this.uniq, action);
	} else {
		if (jsc('Rating')) JSKitLib.hide(jsc('Rating'));
	}

	var sa = jsc("Name");
	if(sa) {
		self.rerenderName(cmt);
		if(obj.admin) sa.className = sa.className + " js-siteAdmin";
	}

	var renderKarmaView = function(karma, container, value, voters) {
		JSKitLib.text(karma.score, value, true);
		JSKitLib.text(karma.votesText, voters, true);
		JSKitLib.show(container, "inline");
	};
	var kS = jsc("KarmaScore");
	if(kS && obj.karma) {
		var kVal = jsc("KarmaValue");
		var kVot = jsc("KarmaVoters");
		if(obj.karma.votes) renderKarmaView(obj.karma, kS, kVal, kVot);
		var setKarmaAction = function(name, score) {
			if (!jsc(name)) return;
			JSKitLib.setEventHandler(jsc(name), ['click'], function() {
				obj.karma.recomputeScore(score);
				renderKarmaView(obj.karma, kS, kVal, kVot);
				this.blur();
			});
		}
		setKarmaAction("KarmaY", 1);
		setKarmaAction("KarmaN", -1);
	}
	if(jsc("KarmaShow") && obj.karma && obj.yours && obj.karma.votes) {
		renderKarmaView(obj.karma, jsc("KarmaShow"), jsc("KarmaValueShow"), jsc("KarmaVotersShow"));
	}
	if (so.likedBy && jsc("LikedBy")){
		var anonymousAvatar = self.avatarsManager.anonymousAvatarData();
		eval("var votersList = " + (obj.like || "[]") + ";");
		obj.likeInstance = new JSCCLike({
			"ID" : obj.ID,
			"jx": self.jcaIndex,
			"ref": JSKitLib.getRef(self),
			"path": self.pathOverride,
			"voters" : votersList,
			"target" : jsc("LikedBy"),
			"profile": function(){ return self.serverOptions.profile; },
			"translator" : $JCL,
			"onInit" : function(){
				var expandMarker = this.getExpandMarker();
				if (expandMarker) appendHoverActions([expandMarker]);
			},
			"onVoterInit" : function(target, data){
				var avatar = data.avatarData || anonymousAvatar;
				data.avatar = avatar.name;
				data.avatarWidth = avatar.width;
				data.avatarHeight = avatar.height;
				delete data.avatarData;
				self.appendProfileHandler(target, data);
			},
			"onVoterRender" : function(dom, data){
				self.avatarsManager.assembleAvatar({
					"instance": dom.get("avatar"),
					"width": "16",
					"height": "16"
				}, data.avatar || anonymousAvatar);
			},
			"likeControl": jsc("Like")
		});
	}

	var functionsToBind = [
		["Edit", "ShowCommentDialog", [{isEditing: true}]],
		["Flag", "markOffensive"],
		["Like", "postLikeVote"],
		["Reply", "ShowCommentDialog"],
		["Block", "cmtBlock"],
		["Delete", "cmtDelete"],
		["Approve", "cmtApprove"],
		["Moderate","cmtBlock"],
		["ComModMark", "markOffensive"],
		["ApproveUser", "cmtApproveUser"]
	];

	JSKitLib.fmap(functionsToBind, function(list){
		(function(elementName, funcName, args) {
			if (!jsc(elementName)) return;
			args = args || [];
			args.unshift(cmt.id);
			JSKitLib.setEventHandler(jsc(elementName), ['click'], function(){
				self[funcName].apply(self, args);
			});
		}).apply(self, list);
	});

	var elementVisibilityConditions = {
		"IP" : !self.adminMode,
		"Url" : obj.Url,
		"Karma" : !this.scoringEnabled() || obj.yours || !obj.karma || typeCondition || cfg.nolc,
		"ComMod" : flagCondition,  
		"LikedBy" : !so.likedBy,
		"Editable" : cfg.editable != 'yes' || cfg.nolc || !(self.adminMode || self.ownerMode),
		"Likeable" : !so.likedBy || anonymous,
		"Flagable" : flagCondition,
		"Deletable" : (!self.adminMode || !obj.event_type) && ((!obj.yours && !self.IM && !self.ownerMode) || (self.adminMode && !cfg.nolc)),
		/* FIXME(?) Lev, this.serverOptions are not defined in moderation mode but the result is likely as desired, i.e. admin can still reply */
		"Replyable" : so.mmode == "pause" || !self.isSourceAvailable("Comments") || typeCondition || (cfg.nolc && (!self.IM || obj.yours)),
		"Moderatable" : !self.adminMode || cfg.nolc,
		"ApproveUser" : so.mmode != "onhold",
		"ProfileLinkable" : !obj.profile || cfg.nolc
	};
	JSKitLib.fmap(elementVisibilityConditions, function(flag, name){
		if (jsc(name) && flag) JSKitLib.hide(jsc(name));
	});

	cmt.bg.style.zIndex = this.czidx - (pageIdx % this.czidx);
	cmt.domINFO = jsc('INFO');
	cmt.domCtls = jsc('Ctls') || jsc('controls');

	if(obj.status == 'S')
		this.cmtSetSpamStatus(cmt, true);

	if(obj.status == 'O')
		this.cmtSetOffensiveStatus(cmt, true);

	if(obj.admin) {
		JSKitLib.addClass(cmt, "js-commentByAdmin");
		if(cfg.adminBgColor) {
			cmt.style.backgroundColor = cfg.adminBgColor;
			cmt.bg.style.backgroundColor = cfg.adminBgColor;
		}
		var star = jsc('AdminStar');
		if(star) JSKitLib.show(star, 'inline');
	}

	if(obj.status == 'DT') {
		if(cmt.domINFO) JSKitLib.hide(cmt.domINFO);
		if(cmt.domCtls) JSKitLib.hide(cmt.domCtls);
	}
	if(obj.status == 'DD') {
		if(cmt.domCtls) JSKitLib.hide(cmt.domCtls);
		this.placeProcessAvatar(jsc('Avatar'));
	}
	if(jsc("Checkbox")) {
		var checkbox = jsc("Checkbox");
		var state = this.moderationCommentsList[obj.ID] ? "checked" : "unchecked";
		this.setInputState("checkbox", checkbox, state);
		checkbox.onclick = function() {
			var state = self.moderationCommentsList[obj.ID] ? "unchecked" : "checked";
			self.setInputState("checkbox", checkbox, state);
			self.moderationCommentsListUpdate(obj.ID, state == "checked");
		};
	}
	if(jsc("Menu")) {
		if(!obj.menu) 
			obj.menu = self.addMenu(cmt, obj);
		if(obj.menu) 
			jsc("Menu").appendChild(obj.menu);
	}
	if(jsc("ViaIcon")) JSKitLib.addPNG(jsc("ViaIcon"), obj.content.service.iconUrl); 
	var controls = JSKitLib.fmap(["Flag", "Like", "Reply", "Moderate", "Edit", "Delete", "ViaThirdPartyService"], function(name){
		var element = jsc(name);
		if (element) return element;
	});
	appendHoverActions(controls);
}

JSCC.prototype.setInputState = function(type, element, state) {
	JSKitLib.addPNG(element, "//cdn.js-kit.com/images/common/" + type + "_" + state + ".png");
}

JSCC.prototype.level2margin = function(level) {
	if(level < 20) return "10px";
	if(level < 40) return "4px";
	return "0px";
}
JSCC.prototype.level4margin = function(level) {
	switch (this.config.skin) {
		case 'echo':
			if(level > 1) level = 1;
			return ((parseInt(this.maxAvatarDims.width) + 10) * level) + 'px';
		default:
			if(level <= 20) return (10 * level) + 'px';
			if(level <= 40) return (200 + 4 * level) + 'px';
			return '280px';
	}
}
JSCC.prototype.cmtInDiv = function(div, obj, fincb) {
	JSKW$Events.syncBroadcast("smileys-newCommentInDiv", obj);
	if (!obj.isEditing) {
		var cIdx, insBefore = false;
		if(this.config.backwards == 'yes') {
			var fitem = this.jspg.getFirstItem();
			if(fitem) {
				cIdx = fitem.obj.ID;
				insBefore = true;
			}
		}
		if(this.config.thread != 'yes') {
			obj.Notice = $JCL('commentMoveNotice');
			cIdx = obj.ParentID || cIdx;
			delete obj.ParentID;
			delete obj.depth;
		}
		if(this.useEcho()) {
			cIdx = this.jspg.getPlaceIdxByTS(obj.TS);
			insBefore = true;
		}
		obj.cedge = 3;
		if(obj.ParentID) {
			obj.cedge = 0;
			var prn = this.objById[obj.ParentID];
			var td = (prn && prn.depth) ? prn.depth : 0;
			if(prn) {
				if (this.useEcho()) {
					JSKitLib.addClass(this.jspg.getItemById(obj.ParentID).div, 'jsk-ItemWrapperThread');
				}
				if(!obj.depth) {
					prn.thread.push(obj);
					obj.depth = 1 + td;
				}
				if(this.IM && typeof(prn.conversation)=='number') obj.conversation = prn.conversation;
				cIdx = this.getLastReply(obj.ParentID).obj.ID;
				insBefore = false;
				var curItem = this.jspg.getItemById(cIdx);
				if(curItem && curItem.obj.cedge>1) {
					obj.cedge = 2;
					curItem.obj.cedge -= 2; 
					var parentPageIdx = this.jspg.getPageByItemId(obj.ParentID);
					var insertedPageIdx = this.jspg.getPageByItemId(cIdx);
					this.jspg.invalidatePagesView(parentPageIdx, insertedPageIdx-parentPageIdx+1);
				}
			}
		}
	
		if(this.IM) {
			for(var i=0; i<this.conversations.length; i++) {
				if(this.conversations[i].current) {
					obj.conversation = i;
					break;
				}
			}
			if(typeof(obj.conversation)!='number') {
				this.conversations.push({'direction':'out'});
				obj.waitConversation = {cnvsIdx: this.conversations.length-1};
			}
		}
		this.jspg.addNewItem(obj, cIdx, insBefore);
	}
	var pn = this.jspg.getPageByItemId(obj.ID);
	var item = this.jspg.getItemById(obj.ID);
	if (obj.isEditing) {
		item.obj.Text = obj.Text;
		this.jspg.invalidateItemView(obj.ID);
	}
	if(!this.useEcho() || pn+1==this.curPage) {
		if(pn+1==this.curPage) this.curPage = 0;
		var self = this;
		this.markCollapsedReplies(item.obj);
		this.displayPage(pn+1, function(immed) {
			if(immed) {
				if(!item.div) {
					self.cmtInDiv(undefined, obj, fincb);
				} else {
					fincb.apply(this, [item.div]);
				}
			} else {
				delete obj.echoItemFirstTime;
			}
			delete item.obj.isEditing;
		});
	} else {
		delete obj.echoItemFirstTime;
	}
}

JSCC.prototype.setOpacity = function(div, val) {
	if(div) {
		div.style.opacity = val;
		div.style.filter = 'alpha(opacity: ' + Math.round(val * 100) + ')';
	} else {
		if(document.body.filters)
			return 'zoom:1;filter:progid:DXImageTransform.Microsoft.Alpha(opacity=' + Math.round(val * 100) + ');';
		else
			return 'opacity: ' + val + ';';
	}
}

JSCC.prototype.flash = function(cmt) {
	if(!cmt) return;

	var self = this;
	var echoSkin = self.getSkin() == 'echo';
	var obj = cmt.cobj;
	if(!obj.echoItemFirstTime && !obj.ParentID) cmt.scrollIntoView(true);
	var bg = echoSkin ? cmt.ctls['jsk-ItemUserAvatarWrapper'] : cmt.bg;

	try {
		bg.style.backgroundColor = self.config.flashColor || "#ffff00";
		if (!obj.echoItemFirstTime) {
			self.setOpacity(bg, 0);
		}
	} catch(e) { return; }

	obj.cntDown = 3.14 / 2;
	obj.cntMode = echoSkin && obj.echoItemFirstTime;
	obj.cntBorderPause = 8;
	obj.cntBorderUp = 0;
	obj.havingEffect = true;

	var decr = echoSkin ?
		(obj.echoItemFirstTime ? {f:0.2,s:0.2} : {f:0.1, s:0.1}) :
		{f: 0.5, s: 0.3};
	var cmtHeight = Math.round(cmt.bg.scrollHeight*decr.f/obj.cntDown);
	if(obj.echoItemFirstTime) cmt.style.visibility = "";

	var calcOpacity = function(cnt) {
		cnt = cnt || obj.cntDown;
		return obj.cntMode ? 
			Math.sin(cnt) : Math.cos(cnt);
	}
	var effectStep = function(cmt) {
		var echoEffectStep = function(cmt) {
			if (cmt.cobj.cntDown > 0) {
				cmt.cobj.height += cmtHeight;
				cmt.style.height = cmt.cobj.height + 'px';
				return true;
			} else if (cmt.cobj.cntBorderPause == 8) {
				cmt.style.overflow = "";
				cmt.style.height = "";
				cmt.cobj.height = -1;
				cmt.cobj.cntBorderPause--;
				return true;
			} else if (cmt.cobj.cntBorderPause > 0) {
				cmt.cobj.cntBorderPause--;
				return true;
			} else if (cmt.cobj.cntBorderUp < 256) {
				cmt.cobj.cntBorderUp += 10;
				var blue = cmt.cobj.cntBorderUp;
				bg.style.backgroundColor = "rgb(256, 256, " + (blue > 256 ? 256 : blue) + ")";
				return true;
			} else {
				self.setOpacity(bg, 1);
				bg.style.backgroundColor = "";
				delete cmt.cobj.echoItemFirstTime;
				return false;
			}
		}
		var oldEffectStep = function(cmt) {
			if (cmt.cobj.cntDown > 0) {
				self.setOpacity(bg, calcOpacity());
				return true;
			} else {
				bg.style.backgroundColor = "";
				self.setOpacity(bg, 1);
				return false;
			}
		}
		cmt.cobj.cntDown -= cmt.cobj.cntMode ? decr.f : decr.s;
		return cmt.cobj.echoItemFirstTime ? echoEffectStep(cmt) : oldEffectStep(cmt);
	}

	var runStep = function() {
		obj.intvl = setTimeout(function() {
			var nextStep = effectStep(cmt);
			if (nextStep) runStep();
			else {
				obj.intvl = null;
				delete obj.havingEffect;
			}
		}, 50);
	};
	runStep();
}

JSCC.prototype.foldInputFields = function(e, acc, f) {
  if(e.getAttribute) {
	var name = e.getAttribute('NAME');
	if(name && (name.substr(0, 6) == 'js-Cmt')) {
		var shortName = name.substr(6);
		acc = f.call(this, e, acc, shortName) || acc;
	}
  }
  var cn = e.childNodes;
  if(cn) {
	var clen = cn.length;
	for(var i = 0; i < clen; i++)
		acc = this.foldInputFields(cn[i], acc, f);
  }
  return acc;
}

JSCC.prototype.inputFieldsMsg = function(ctl, cmtObj, pText) {
	return this.foldInputFields(ctl, [], function(e, a, name){
		if (e.jsk$not_specified || JHI2.isEmpty(e)) return;
		var isText = /^Text(Edit)?$/.test(name);
		var text = isText ? pText : e.value;
		a.push({"Name": "js-Cmt" + name, "Value": text});
		if(isText && this.serverOptions.htmlMode)
			text = text.replace(/<[\/]?[a-z]{1,3}(\s+(href)=[^>]+)?>/g, '');
		//text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
		cmtObj[name] = text;
	});
}

JSCC.prototype.cmtAvatarPlaceWidth = function(cobj) {
	return cobj.ParentID ? this.maxAvatarDims.width/2 : this.maxAvatarDims.width;
}

JSCC.prototype.cmtInPlace = function(cobj, fincb) {
	var div = this.TC["js-OldComments"];
	cobj.Name = cobj.Name || $JCL("guest");
	this.cmtInDiv(div, cobj, function(cmt) {
		if(cmt) this.flash(cmt);
		if(fincb) fincb.apply(this, [cmt]);
	});
}

JSCC.prototype.ShowCommentDialog = function(msgId, extra) {
	if(this.commentPostingProcess) {
		alert($JCL('messagePostingInProgress'));
		return;
	}
	var s = this;
	msgId = msgId || '';
	this.forMsg = this.objById[msgId];

	/* Remove dialog from sight */
	this.CommentCancelled();
	
	extra = extra || {};
	if (s.getSkin() == "echo") {
		if (this.TC["js-CmtText"] && (this.jskauth.isLogged() || !this.anonymousCmt)) {
			var hint = $JCL("defaultCommentText");
			var input = s.TC["js-CmtText"];
			if (s.serverOptions.wysiwyg) {
				hint = '<span style="color: #808080;">' + hint  + '</span>';
				input.hint = hint;
				input.value = hint;
			} else {
				JHI2.remove(input);
				JHI2.create(hint, input);
			}
		}
		JSKitLib.fmap(s.serverOptions.wysiwyg ? [] : ["js-CmtText", "js-CmtTextEdit", "jsk-CommentFormBody", "jsk-CommentEditFormBody"], function(name) {
			if (s.TC[name]) JSKitLib.addClass(s.TC[name], name + "-noWYSIWYG");
		});
	}

	var isReply = !!msgId;
	var cct = this.TC["js-LeaveComment"];

	if (!this.getSkin().match(/smoothgray|echo/)) this.onAddImgButton(this.imgShow);

	var ccd = this.TC[extra.isEditing ? "js-EditComment" : "js-CreateComment"];
	if (extra.isEditing) {
		isReply = false;
		var cte = this.TC['js-CmtTextEdit'];
		if (this.forMsg.originalText) {
			cte.value = this.forMsg.originalText;
		} else {
			cte.value = this.forMsg.Text.replace(/<wbr><\/wbr>/g, '');
			if (!this.serverOptions.wysiwyg) {
				cte.value = JSKitLib.htmlUnquote(cte.value);
				JSKW$Events.syncBroadcast("smileys-beforePostNewComment", cte);
			}
		}
	}
	this.replyForId = (isReply ? msgId : '');

	var placeDialog = function(immediate, apl) {
		if (!apl) apl = [this.TC["js-CommentsArea"], this.TC["js-CommentsArea"].firstChild];
		if(msgId){
			apl[0].insertBefore(ccd, apl[1]);
		} else if (this.config.backwards == 'yes') {
			apl[0].insertBefore(ccd, this.TC['js-WelcomePanel'] ? apl[1].nextSibling : apl[1]);
		} else {
			this.addChild(apl[0], ccd);
		}
		if (extra.isEditing) JSKitLib.hide(apl[1]);

		if(this.config.backwards == 'yes'  && msgId)
			cct.style.visibility = "hidden";
		else
			cct.style.display = "none";
		ccd.style.display = "block";
		try {
			var name_suffix = (extra.isEditing ? 'Edit' : '');
			var text = this.TC["js-CmtText" + name_suffix];
			/* TinyMCE support (A) */
			if(!text.id) text.id = "js-CmtText" + name_suffix + "-" + this.jcaIndex;
			if(!text.richEditor && this.serverOptions.wysiwyg) try {
				text.smoothWysiwygLoading = (s.getSkin() == 'echo' && !extra.isEditing);
				if (text.smoothWysiwygLoading) {
					if (!text.jsk$cover) {
						text.jsk$cover = JSKitLib.html('<div style="background: #FFFFFF; border: 1px solid #CCCCCC; height: ' + (text.offsetHeight + 27) + 'px; text-align: center"><img src="//cdn.js-kit.com/images/loading.gif" style="display: block; margin: 50px auto 0px auto"></div>');
						text.jsk$wrapper = s.TC['jsk-CommentFormBody'];
					}
					text.jsk$wrapper.parentNode.replaceChild(text.jsk$cover, text.jsk$wrapper);
					JSKitLib.hide(text.jsk$wrapper);
					text.jsk$cover.parentNode.insertBefore(text.jsk$wrapper, text.jsk$cover);
				}
				var addMCECtrl = function(){
					text.jsk$nofocus = extra.nofocus;
					text.jsk$widget = s;
					if(s.tmce.foreign) tinyMCE.settings = s.tmce.cfg;
					tinyMCE.settings.auto_focus = (extra.nofocus ? null : text.id);
					text.jsk$hasDefaultValue = (s.getSkin() == 'echo' && !extra.isEditing);
					if (text.jsk$hasDefaultValue) {
						var re = new RegExp('(<p>)?' + text.hint + '(</p>)?');
						text.defaultRemoved = !text.value.match(re);
					}
					tinyMCE.execCommand('mceAddControl', false, text.id);
					text.richEditor = true;
					if(text.mceLoadedCtx) {
						JSKW$Events.invalidateContext(text.mceLoadedCtx);
						text.mceLoadedCtx = null;
					}
				}
				if(window.tinyMCE) {
					if(tinyMCE.getInstanceById(text.id) == null) {
						setTimeout(function() { addMCECtrl(); }, 0);
					}
				} else text.mceLoadedCtx = JSKW$Events.registerEventCallback(undefined, addMCECtrl, "mceLoaded");
			} catch(e) {}

			var sub = this.TC["js-Cmtsubmit" + name_suffix];
			var can = this.TC["js-Cmtcancel" + name_suffix];
			var prev = function(e){JSKitLib.stopEventPropagation(e); JSKitLib.preventDefaultEvent(e); return false;}

			if(JSKitLib.isOpera()) {
				var onkey = function(){};
			} else if(JSKitLib.isIE()) {
				var onkey = function(d,f){d.onkeydown=f};
			} else {
				var onkey = function(d,f){d.onkeypress=f};
			}

			/* combined ratings */
			var commentRatingElements = JSKitLib.getElementsByClass(ccd, "js-commentRatingDisplay");
			var commentRatingDisplay = 'none';
			this.submitRating = false;
			if (this.hasRatingsAppObject() && ( ! isReply)) {
 				if (this.TC["js-commentFieldRating"]) {
 					this.embedRatingsAppObject(this.TC["js-commentFieldRating"]);
 					commentRatingDisplay = '';
					this.submitRating = true;
				}
			}
			for (var i=0; i < commentRatingElements.length; i++) {
				commentRatingElements[i].style.display = commentRatingDisplay;
			}


			var flds = this.foldInputFields(ccd, [],
			function(e, a, name) {
				var dfl = this.fieldDfl[name];
				if(dfl) {
					if(e.jsk$setdfl)
						e.jsk$setdfl(dfl);
					else if(!e.value)
						e.value = dfl;
				}
				var aclen = a.length;
				if(e.richEditor) {
					if (e.value) {
						e.value = e.value.replace(/^\n\n+/, '');
						if(!e.value.match(/^<p>(\n|.)*<\/p>$/)) e.value = '<p>' + e.value + '</p>';
					}
					var o = { focus: function() {
						var setupFocusing = function(ed) {
							var keyHandler = function(ed, e) { 
								if(e.keyCode != 9) return true;
								window.focus();
		try {
								a[aclen+(e.shiftKey?-1:1)].focus();
		} catch(ex) { ; }
								return prev(e);
							};
							if (JSKitLib.isIE()) ed.onKeyDown.add(keyHandler); else ed.onKeyPress.add(keyHandler);
						}
						var ed = tinyMCE.getInstanceById(text.id);
						if(ed) {
							setupFocusing(ed);
						} else {
							var t = setInterval(function() {
								var ed = tinyMCE.getInstanceById(text.id);
								if(ed) { clearInterval(t); setupFocusing(ed); }
							}, 100);
						}
					} };
					if(aclen) onkey(a[aclen-1], function(e) { 
						e = e || window.event; 
						if(e.keyCode == 9 && !e.shiftKey) { 
							this.blur();
							o.focus(); 
							return prev(e); 
						}
					});
					a.push(o);
				} else {
					a.push(e);
				}
			});

			var okd = function(offset) { return function(e) {
				e = e || window.event;
				if(e.keyCode != 9) return true;
				this.blur();
				flds[offset+(e.shiftKey?(flds.length-2):0)].focus();
				return prev(e);
			} }

			onkey(flds[flds.length-1], okd(0));
			onkey(flds[0], okd(1));

			// Place initial focus.
			if(!extra.nofocus) {
				for(var i = 0; i < flds.length; i++)
					if(!flds[i].value || flds[i].type == 'submit') {
						flds[i].focus();
						break;
					}
				if (s.config.backwards != 'yes')
					sub.scrollIntoView(false);
			}
		} catch(e) { }
	};
	if(!msgId) {
		placeDialog.apply(this,[true]);
	} else {
		var id = this.useReplyThreadsCollapsing() || extra.isEditing ?
				msgId : this.getLastReply(msgId).obj.ID;
		var pn = this.jspg.getPageByItemId(id);
		var item = this.jspg.getItemById(id);
		item.obj.isEditing = extra.isEditing;
		this.displayPage(pn+1, function(immed) {
			if (!immed) return;
			if (!s.useEcho()) item = s.jspg.getItemById(id);
			var placement = [item.div.parentNode, item.div.nextSibling];
			if (extra.isEditing) {
				s.editingCmt = item.div.ctls['js-singleCommentText'];
				placement = [s.editingCmt.parentNode, s.editingCmt];
			}
			placeDialog.apply(s, [true, placement]);
		});
		s.setStreamState(true, true);
	}
	var pb = this.TC["js-poweredBy-echo"] || this.TC["js-poweredByJSKit"];
	if (this.serverOptions.whitelabel && pb) JSKitLib.hide(pb);

	if (s.getSkin() != 'echo') {
		var oiddiv = s.TC['js-logoutSpan'];
		if (oiddiv) oiddiv.style.display = s.jskauth.isLogged() ? 'inline' : 'none';
		s.jskauth.drawSelector(s.TC['js-authSelector']);
		s.setThirdPartyShare();
		s.setNameFieldValue();
	}
	return false;
}

JSCC.prototype.CommentCancelled = function() {
	if(this.tmce && (this.serverOptions.media || this.serverOptions.smiley)) 
		this.tmce.cfg.closePopups();
	var cct = this.TC["js-LeaveComment"];
	var ccd = [this.TC["js-EditComment"], this.TC["js-CreateComment"]];
	if (cct) {
		cct.style.visibility = "";
		cct.style.display = "";
	}
	var name_suffix = (this.editingCmt ? 'Edit' : '');
	var text = this.TC["js-CmtText" + name_suffix];
	if(text && text.richEditor) {
		try {
			if (!this.anonymousCmt) {
				tinyMCE.triggerSave(false, false);
			}
			var v = text.value;
			tinyMCE.execCommand('mceRemoveControl', false, text.id); //tmce set value from its internal property
			text.value = v;
		} catch(e) { ; };
		text.richEditor = false;
		if(text.mceLoadedCtx) {
			JSKW$Events.invalidateContext(text.mceLoadedCtx);
			text.mceLoadedCtx = null;
		}
	}
	var s = this;
	JSKitLib.fmap(ccd, function(el, i){
		el && el.parentNode && el.parentNode.removeChild(el);
	});
	if (this.editingCmt) {
		JSKitLib.show(this.editingCmt);
		delete this.editingCmt;
	}
	return false;
}

JSCC.prototype.smileTag = function(smile) {
        return '<img src="' + window.location.protocol  + '//cdn.js-kit.com/extra/tiny_mce/plugins/emotions/img/smiley-' + smile.file + '" title="' + smile.title + '" border="0" alt="' + smile.title + '" />';
}

JSCC.prototype.textSmiles2Graphical = function(text, reverse) {
	var s = this;
	if(window.tinyMCE) tinyMCE.settings.smiley = false;
	var flag = true;
	var orig = text;
	JSKitLib.fmap(s.smiles, function(el, i){
		text = reverse ? text.replace(el.regexpTag, ' ' + i + ' ') : text.replace(el.regexpText, function($0, $1){return ($1 ? $0 : s.smileTag(el));});
		if(window.tinyMCE && flag && (text !== orig)) {
			tinyMCE.settings.smiley = true;
			flag = false;
		}
	});
	return text;
}

JSCC.prototype.thirdPartyImport = function(KVLMsg) {
	var s = this;
	var text = JSKitLib.stripTags(KVLMsg['js-CmtText']);
	var permalink = KVLMsg['permalink'] || s.config.permalink;
	var reg = RegExp("^http(.)?://(.*?)/");
	var m = reg.exec(permalink);
	var domain = (m && m.length>1) ? m[2] : s.config.domain;
	var share_data = {
			'domain': domain,
			'permalink': permalink,
			'Text': text
	};
	var createTargetDiv = function() {
		var tgt = 'div-sharing-' + Math.random();
		var div = JSKitLib.html('<div id="' + tgt + '" name="' + tgt + '" style="display: none; width: 0px; height: 0px;"></div>');
		s.target.appendChild(div);
		return tgt;
	}
	var facebook = s.jskauth.getAuthIdentity("facebook");
	if(facebook && KVLMsg['js-CmtShare-facebook']=='on') {
		var jsk$fb = new JSKitFBSDK(
			JSKitLib.getRef(s),
			facebook.params.app_id,
			facebook.params.xd_receiver,
			function() {
				this.shareComment(s.serverOptions.whitelabel);
			},
			undefined,
			share_data);
	}
	var gfc = s.jskauth.getAuthIdentity("gfc");
	if(gfc && gfc.params.site && KVLMsg['js-CmtShare-gfc']=='on') {
		var jsk$gfc = new JSKitGFC(
			JSKitLib.getRef(s),
			createTargetDiv(),
			gfc.params.site,
			function(){
				this.sharedata = share_data;
				this.shareComment();
			});
	}
}

JSCC.prototype.appendFormFields = function(fields, tmpObj) {
	var self = this;
	var formFields = this.getKVListFromMsg(fields);
	var extraFields = JSKitLib.foldl({}, this.extraFormFields, function(value, acc, name) {
		if (name != "Email" || self.getSkin() != "echo") acc["js-Cmt" + name] = value;
	});
	var mergedFields = JSKitLib.foldl(extraFields, formFields, function(value, acc, name) { acc[name] = value; });
	return JSKitLib.fmap(mergedFields, function(value, name) {
		tmpObj[name.replace("js-Cmt", "")] = value;
		return {"Name": name, "Value": value};
	});
}

JSCC.prototype.CommentSubmitted = function() {
	var s = this;
	var prn = this.forMsg;
	var isEditing = prn && prn.isEditing;

	if(!isEditing && this.serverOptions.requireUsername && this.TC["js-CmtName"] && JHI2.isEmpty(this.TC["js-CmtName"])) {
		alert($JCL('nicknameRequired'));
		s.TC["js-CmtName"].focus();
		return;
	}
	
	/* TinyMCE support (B) */
	var name_suffix = (isEditing ? 'Edit' : '');
	var text = this.TC["js-CmtText" + name_suffix];
	var textValue;
	if(text.richEditor) {
		tinyMCE.triggerSave(false, false);
		JSKW$Events.syncBroadcast("smileys-beforePostNewComment", text);
		textValue = String(text.value).
                                replace(/(<\/p>)[\r\n]+(<p>)/g, '$1$2').
				replace(/(<p>)&nbsp;(<\/p>)/g, '$1$2').
				replace(/<p>/g, '\n').replace(/<\/p>/g, '').replace(/<br\s?\/?>/g, '\n').
				replace(/^\n/, '');
	} else {
		textValue = String(text.value).replace(/&/g, '&amp;');
	}

	var textMsg = (this.getSkin() != "echo" || !JHI2.isEmpty(text)) ? encodeURIComponent(textValue) : "";
	if(!textMsg || !textMsg.length) {
		alert($JCL("tooShort"));
		return;
	}

	var mcl = this.serverOptions.maxCommentLength || 3000;
	if(text.value.length > mcl) {
		alert($JCL("tooLong",{"maxCommentLength":mcl}));
		return;
	}

	var form = this.TC[isEditing ? "js-EditComment" : "js-CreateComment"];
	var avt = this.avatarsManager.getActiveAvatar() || 'no';
	var permalink = this.config.permalink;
	var moderate = this.config.moderate;

	var tmpObj = {yours:true};
	if(prn) {
		if (isEditing) {
			tmpObj.ID = prn.ID;
		} else {
			tmpObj.ParentID = prn.ID;
		}
		tmpObj.path = prn.path;
		if(prn.permalink) {
			tmpObj.permalink = prn.permalink;
			permalink = prn.permalink;
		}
	}

	if (this.getSkin() == "echo" && this.extraFormFields["Url"] && this.jskauth.isLogged()) {
		this.extraFormFields["Url"] = "";
	}
	this.extraFormFields["Name"] = this.getUserProperty("Name", "");
	this.extraFormFields["Email"] = this.getUserProperty("Email", "");
	this.extraFormFields["Webpresence"] = this.getSelectedIdentities();

	var message = this.appendFormFields(this.inputFieldsMsg(form, tmpObj, textValue), tmpObj);
	if (this.getSkin() == "echo") {
		message.push({'Name': 'js-CmtNotifyMode', 'Value': s.serverOptions.notifyMode});
	}

	tmpObj["Name"] = tmpObj["Name"] || $JCL("guest");
	
	/* combined ratings */
	if (this.submitRating) {
		rating = this.getRatingsAppObject().userRating;
		message.push({'Name': 'js-CmtRating', 'Value': rating});
		tmpObj.Rating = rating;
	}
	if(prn && !isEditing) {
		message.push({'Name': 'js-CmtParentID', 'Value': prn.ID});
		if(this.IM=='own' && prn.profile) {
			message.push({'Name': 'destProfile', 'Value': prn.profile});
		}
	}
	if(permalink) message.push({'Name': 'permalink', 'Value': permalink});
	if (!isEditing) {
		if(avt) message.push({'Name': 'avatar', 'Value': (avt.name ? avt.name : avt)});
	} else {
		tmpObj.isEditing = true;
	}

	if(moderate) this.pathOverride = this.forMsg.path;

	var onsuccess = function(cmtObj) {
		var KVLCmt = s.getKVListFromMsg(message);
		// API: subscriber expects
		// (ConstructedMessageObject[, FormDOM])
		try {
			JSKitAPI.askpublic.call(s, "comment-submit",
				s.generateEventParams(KVLCmt), form);
		} catch(e) {
			return;
		}
		s.CommentCancelled();
		if (s.TC['js-CmtText' + name_suffix]) {
			s.TC['js-CmtText' + name_suffix].value = '';
		}
		if (s.clearImgs) {
			s.clearImgs();
		}
		if (!isEditing) {
			s.thirdPartyImport(KVLCmt);
		}
		if (s.extraControlsMenu) {
			s.extraControlsMenu.collapseTabs();
		}
		var am = s.avatarsManagement;
		if (am && am.avatarsListContainer) {
			JSKitLib.hide(am.avatarsListContainer);
		}
		delete s.replyForId;
	}
	var onerror = function() {
		var cover = s.commentPostingProcess.cover;
		if (cover) {
			JSKitLib.text($JCL('messagePostFailed'), cover.get("Label"), true);
			cover.get("Img").src = "//cdn.js-kit.com/images/warning.gif";
			JSKitLib.show(cover.get("Retry"), "inline");
		} else {
			alert($JCL("messagePostFailed"));
			s.setStateLCF("enable");
		}
	}
	this.postComment(tmpObj, message, {
		'onsuccess': onsuccess,
		'onerror': onerror
	});
}

JSCC.prototype.prepareCommentObj = function(tmpObj) {
	var cobj = JSKitLib.cloneObject(tmpObj);
	if(cobj.isEditing) {
		cobj.Text = cobj.TextEdit;
		delete cobj.TextEdit;
	} else if (cobj.echoItem) {
		cobj.extra = {};
		cobj.thread = [];
	} else {
		this.tmpID++;
		cobj.ID = "jst-" + this.tmpID;
		cobj.status = 'A';
		cobj.profile = this.serverOptions.profile;
		var avatar = this.avatarsManager.getActiveAvatar();
		if (avatar) {
			cobj.avatar = avatar.name;
			cobj.avatarWidth = avatar.width;
			cobj.avatarHeight = avatar.height;
		}
		cobj.avatarPlaceWidth = this.cmtAvatarPlaceWidth(cobj);
		cobj.extra = {};
		cobj.thread = [];
		cobj.depth = 0;
		cobj.admin = this.adminMode;
		var d = new Date();
		cobj.TS = Math.round(d.valueOf() / 1000) + (this.serverDiffTS || 0);
 	}
	cobj.jcaIndex = this.jcaIndex;
	return cobj;
}

JSCC.prototype.postComment = function(tmpObj, tmpMsg, options) {
	var s = this;
	var cmtObj = JSKitLib.cloneObject(tmpObj);
	if (s.useEcho()) {
		cmtObj.echoItemFirstTime = true;
	}
	if(s.images) cmtObj.imgs = s.images;
	var msg = JSKitLib.fmap(tmpMsg, function(e){ return e; });

	if(cmtObj.ParentID && !this.objById[cmtObj.ParentID]) {
		this.invalidateJSPG();
		if(options && options.onerror) options.onerror();
		return;
	}

	cmtObj = this.prepareCommentObj(cmtObj);
	/* Kick in message submission */
	msg.push({'Name': 'tid', 'Value': cmtObj.ID});
	s.prepareImgData(msg);
	var src = (cmtObj.isEditing ? '.edit' : '.put');
	var prms = this.getKVListFromMsg(msg);
	s.commentPostingProcess = {
		attempts: 1,
		attemptsMax: 3,
		cmtObj: cmtObj,
		start: function(){
			s.commentPostingProcess.timer = setTimeout(function(){
				var p = s.commentPostingProcess;
				if(!p) return;
				if(p.attempts < p.attemptsMax) {
					p.attempts++;
					s.commentPostingProcess.start();
				} else {
					if(options && options.onerror)
						options.onerror();
				}
			}, JSCC.REPOST_COMMENT_TIMEOUT);
			s.setStateLCF("disable");
			s.server(src, prms, true, {transport: 'POST'});
		},
		stop: function(){
			s.setStateLCF("enable");
			clearTimeout(s.commentPostingProcess.timer);
			delete s.commentPostingProcess;
			if(options && options.onsuccess)
				options.onsuccess(cmtObj);
		},
		disableLCF: function() {
			var container = s.TC["jsk-CommentFormSurface"];
			if (!container || cmtObj.isEditing) return;
			JSKitLib.addClass(container, "js-kit-relative");
			var p = s.commentPostingProcess;
			p.enableLCF();
			p.cover = s.assembleCoverLCF();
			container.appendChild(p.cover.content);
			p.adjustCoverPosition(container);
		},
		enableLCF: function() {
			var cover = s.commentPostingProcess.cover;
			if (cover && cover.content.parentNode) {
				var container = cover.content.parentNode;
				container.removeChild(cover.content); 
				JSKitLib.removeClass(container, "js-kit-relative");
			}
		},
		adjustCoverPosition: function(container) {
			var cover = s.commentPostingProcess.cover;
			if (JSKitLib.isIE()) {
				cover.content.style.width = container.offsetWidth+ "px";
				cover.content.style.height = container.offsetHeight + "px";
			}
			cover.get("Msg").style.top = (container.offsetHeight - cover.get("Msg").offsetHeight)/2 + "px"; 
		}
	};
	s.commentPostingProcess.start();
}

JSCC.prototype.setStateLCF = function(state) {
	this.setControlsStateLCF(state, [this.TC['js-Cmtcancel']]);
	this.commentPostingProcess[state + "LCF"]();
}

JSCC.prototype.assembleCoverLCF = function() {
	var s = this;
	var attachEvent = function(element, extraCallback) {
		element.href = "javascript:void(0);";
		element.onclick = function() {
			s.setStateLCF("enable");
			delete s.commentPostingProcess;
			if (extraCallback) extraCallback();
			return false;
		};
	};
	var descriptors = {
		"Wrapper": function(element) {
			JSKitLib.setOpacity(element, 0.7);
		},
		"Label": function(element) {
			var attempts = s.commentPostingProcess.attempts;
			JSKitLib.text($JCL("posting") + (attempts > 1 ? " (" + $JCL("attempt") + " " + attempts + ")" : "") + "...", element, true);
		},
		"Post": function(element) {
			attachEvent(element, function() {
				s.CommentSubmitted();
			});
		},
		"Cancel": function(element) {
			attachEvent(element);
		}
	};
	return JSKitLib.toDOM(s.gtmpl(s.dtPostingCommentDialog), "js-CommentWaitSubmit", descriptors);
}

JSCC.prototype.getKVListFromMsg = function(msg) {
	var prms = {};
	JSKitLib.fmap(msg, function(v) { prms[v.Name] = v.Value; });
	return prms;
}

JSCC.prototype.getRatingsAppObject = function() {
	return this.isStandalone() ? null : $JSKitGlobal.getRatingsAppObject(this.uniq);
}

JSCC.prototype.hasRatingsAppObject = function() {
	return this.getRatingsAppObject() ? true : false;
}

JSCC.prototype.embedRatingsAppObject = function(node) {
	// One time
	if ( ! this.embedRatingsAppObjectCompleted) {
		$JSKitGlobal.copyRatingsAppObject(this.uniq, node);
		this.embedRatingsAppObjectCompleted = true;
	}
}

JSCC.prototype.createMiniStarObject = function(rating, scale) {

	var rao = this.getRatingsAppObject();
	var fullStar = rao.miniFullStar['user'];
	var emptyStar = rao.miniEmptyStar['user'];
	var starWidth = rao.miniStarWidth + 'px';
	var starHeight = rao.miniStarHeight + 'px';

	var setImage = function(star, imageURL) {
		if(star.imageURL == imageURL)
			return; // Already set and we know it

		star.imageURL = imageURL;

		if(document.body.filters) {
			star.runtimeStyle.filter
				= "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='"
				+ imageURL + "', sizingMethod='crop')"
		} else {
			star.style.backgroundImage = 'url(' + imageURL + ')';
		}
	}

	var obj = document.createElement('div');

	/* Increment by Full Star Ratings */
	for (var i=2; i <= scale; i += 2) {

		var star = this.cr('div');

		star.style.cssFloat   = 'left';
		star.style.styleFloat = 'left';
		star.style.width    = starWidth;
		star.style.height   = starHeight;

		setImage(star, (rating >= i ? fullStar : emptyStar));

		obj.appendChild(star);
	}

	return obj;
}

JSCC.prototype.rerenderName = function(cmt) {
	var self = this;
	var ctls = cmt.ctls;
	var jsc = function(t){return ctls['js-singleComment'+t]};
	var sn = jsc("Name");
	if(sn && !(cmt.cobj.msgtype && cmt.cobj.msgtype.match(/T|P/))) {
		sn.style.cursor = 'pointer';
		self.appendProfileHandler(sn, cmt.cobj);
	}
	var su = jsc("Url");
	if(su && cmt.cobj.Url && self.serverOptions.extraFieldURL
	&& !(cmt.cobj.msgtype && cmt.cobj.msgtype.match(/T|P/))) {
		su.style.cursor = 'pointer';
		su.setAttribute('title', cmt.cobj.Url);
		su.style.display = 'inline';
		su.onclick = function() {
			window.open(cmt.cobj.Url, '_blank');
			return false;
		}
	}
}

JSCC.prototype.gotPermanentId = function(tmpid, msgId) {
	var self = this;
	if (!this.commentPostingProcess) return;
	var cobj = this.commentPostingProcess.cmtObj;
	this.commentPostingProcess.stop();
	cobj.ID = msgId;
	self.objById[msgId] = cobj;
	var aux = arguments.length > 2 ? arguments[2] : {};
	var props = {
		'status': cobj,
		'Text': cobj,
		'originalText': cobj,
		'mtext': self.serverOptions,
		'mmode': self.serverOptions};
	for(var pname in props) {
		if(aux.hasOwnProperty(pname)) {
			props[pname][pname] = aux[pname];
		}
	}
	if (aux.Text) {
		JSKW$Events.syncBroadcast('smileys-loadCommentsWidget', cobj, self.jcaIndex);
	}
	if(!self.serverOptions.profile && aux.profile) {
		self.serverOptions.profile = aux.profile;
	}
	if (aux.profile) {
                cobj.profile = aux.profile;
        }
	var fillObject = function(obj) {
		if (aux.avatar) {
			obj.avatar = aux.avatar;
			obj.avatarWidth = aux.avatarWidth;
			obj.avatarHeight = aux.avatarHeight;
			obj.avatarPlaceWidth = self.cmtAvatarPlaceWidth(obj);
		}
		if (aux.destName) {
			obj.destName = aux.destName;
		}
		if (aux.gravatarId) {
			obj.GravatarID = aux.gravatarId;
		}
		return obj;
	};
	cobj = fillObject(cobj);
	var cnvsObj = fillObject({"Name": cobj.Name});
	if(aux.avatar || aux.gravatarId) {
		self.placeAvatar(cobj);
	}
	if(this.IM && cobj.waitConversation) {
		cnvsObj.direction = "out";
		this.conversations[cobj.waitConversation.cnvsIdx] = cnvsObj;
		cobj.conversation = cobj.waitConversation.cnvsIdx;
		cobj.waitConversation = false;
		cobj.hasCnvs = false;
	}
	this.isCommentSender = true; 
	this.routeAction(function() {
		if (!this.isSourceAvailable("Comments")) return;
		this.cmtInPlace(cobj, function() {
			if (!this.isCommentSender) return;
			this.controls.reveal();
			this.reCalcPages();
			if (this.useEcho() && this.serverOptions.expandLeaveCmt && !this.config.noautoexpand) {
				this.ShowCommentDialog(undefined, {nofocus: true});
			}
			delete this.isCommentSender;
		});
	});
	this.publishEvent(tmpid == msgId ? 'comment-edited' : 'comment-added', {'cmtId': msgId});
}

function JSReplyMSGId(tmpid, msgId) {
	try {
		var cobj;
		var widget;
		for(var i = 0; i < $JCA.length; i++) {
			var p = $JCA[i].commentPostingProcess;
			if(p && p.cmtObj && p.cmtObj.ID == tmpid && p.cmtObj.jcaIndex == $JCA[i].jcaIndex) {
				cobj = p.cmtObj;
				widget = $JCA[i];
				break;
			}
		}
		if (widget) widget.gotPermanentId.apply(widget, arguments);
	} catch(e){}
}

function JSDeleteMSGId(msgId, jcaIndex, deletedCount) {
	try {
		var self = $JCA[jcaIndex];
		var item = self.jspg.getItemById(msgId);
		if(item) {
			var cmt = item.div;
			if(cmt.cobj.action)
				JSKW$Events.syncBroadcast("comments_serverRequest_" + cmt.cobj.action);
			self.routeAction(function() {
				if(deletedCount>1){
					this.tag = null;
					this.invalidateJSPG();
					var pageNo = this.curPage;
					this.curPage = 0;
					this.displayPage(pageNo);
				} else {
					this.postHandlerDelete(cmt);
				}
			});
		}
	} catch(e){}
}

function JSMarkOffensive() {
	alert($JCL('markoffMessage'));
}

function JSCCLike(config) {
	this.uriAvatar = JSCC.URI_AVATAR;
	this.uriDomain = JSCC.DOMAIN;
	this.avatarSize = {"width": "16", "height": "16"};
	JSKitLib.fmap.call(this, config, function(v, k){ this[k] = v; });
	this.voters = {"raw": this.voters};
	this.initVoters();
	this.loadCSS();
}

JSCCLike.prototype.loadCSS = function() {
	JSKitLib.addCss(
	".js-kit-like-label { float: left; margin-right: 5px; }" +
	".js-kit-like-expand { float: left; cursor: pointer; }" +
	".js-kit-like-name { float: left; }" +
	".js-kit-like-avatar { float: left; margin-right: 2px; }" +
	".js-kit-like-userButton { float: left; height: 16px; margin: 0px 5px 2px 0px; cursor: pointer; }" , "like");
}

JSCCLike.prototype.label = function(key, data){
	return this.translator("like_" + key, data);
}

JSCCLike.prototype.initVoters = function(){
	var self = this;

	//if voters list contains more than 7 voters - display 5 voters and expand marker
	this.displayLimit = {"reduced": 5, "full": 7};

	var i = 0;
	while (i < this.voters["raw"].length){
		if (this.voters["raw"][i].profile == this.profile()){
			//if voters list contains your profile we will show it first
			this.voters["raw"].unshift(this.voters["raw"].splice(i, 1).shift());
			this.voted = true;
			break;
		}
		i++;
	}
	this.guestsCount = 0;
	this.voters["normalized"] = JSKitLib.filter(function(voter){
		if (voter.name == "" && voter.profile != self.profile()) self.guestsCount++;
		return (voter.name != "" || voter.profile == self.profile());
	}, this.voters["raw"]);
	if (this.guestsCount > 0) {
		this.displayLimit["full"]--;
		this.displayLimit["reduced"]--;
	}
	if (this.voters["normalized"].length > this.displayLimit["full"]) {
		this.voters["reduced"] = this.voters["normalized"].slice(0, this.displayLimit["reduced"]);
	} else delete(this.voters["reduced"]);
	this.assemble();
	this.renderLikeControl();
}

JSCCLike.prototype.renderLikeControl = function(flag) {
	var label = this.voted ? "unlike" : "like";
	JSKitLib.text(this.label(label + (flag ? "_progress" : "")), this.likeControl, true);
	this.likeControl.title = this.label(label + "_title");
}

JSCCLike.prototype.sendRequest = function(obj) {
	var params = {
		"p": this.path,
		"id": this.ID,
		"jx": this.jx,
		"action": this.voted ? "unlike" : "like" 
	};
	var request = JSKitLib.foldl(obj, params, function(value, acc, key) { acc[key] = value; });
	new JSRVC({
		"uri": this.uriDomain + '/comment-karma',
		"request": request,
		"ref": this.ref,
		"epb": window.JSKitEPB ? JSKitEPB.getAsHash() : {}
	});
}

JSCCLike.prototype.vote = function(action, obj) {
	var voterInList = JSKitLib.lookup(function(voter){
		return voter.profile == obj.profile;
	}, this.voters["raw"]);

	if (action == "like" && !voterInList) {
		this.voters["raw"].unshift(obj);
		this.initVoters();
	}
	if (action == "unlike" && voterInList) {
		this.voters["raw"] = JSKitLib.filter(function(voter){
			return voter.profile != obj.profile;
		}, this.voters["raw"]);
		this.voted = false;
		this.initVoters();
	}
}

JSCCLike.prototype.assembleVotersList = function(voters) {
	var self = this;
	var container = [];
	var assembleSingleVoter = function(textLabel, avatar){
		var template =
		'<div class="js-kit-like-userButton">' +
			'<div class="js-kit-like-avatar"></div>' +
			'<div class="js-kit-like-name">' + textLabel + '</div>' +
			'<div class="js-kit-clear"></div>' +
		'</div>';
		var dom = JSKitLib.toDOM(template, "js-kit-like-", {});
		self.onVoterRender(dom, {"avatar": avatar});
		return dom.content;
	};
	JSKitLib.fmap(voters || [], function(voter){
		var avatar = voter.avatar ? {
			"name": voter.avatar,
			"width": voter.avatar_width,
			"height": voter.avatar_height
		} : undefined;
		var textLabel = (voter["profile"] == self.profile()) ? self.label("you") : voter["name"];
		var singleVoter = assembleSingleVoter(textLabel, avatar);
		self.onVoterInit(singleVoter, {
			"Name": voter.name,
			"profile": voter.profile,
			"avatarData": avatar
		});
		container.push(singleVoter);
	});
	if (this.guestsCount > 0){
		var textLabel = self.label((self.guestsCount > 1) ? "guests" : "guest", {"guestsCount": self.guestsCount});
		container.push(assembleSingleVoter(textLabel));
	}
	return container;
}

JSCCLike.prototype.assemble = function() {
	var self = this;
	if (!self.voters["normalized"].length && self.guestsCount == 0) {
		JSKitLib.removeChildren(self.target);
		return;
	}

	var descriptors = [ 
		function(container) {
			container.appendChild(JSKitLib.html('<div class="js-kit-like-label">' + self.label("likedBy") + '</div>'));
		},
		function(container){
			JSKitLib.fmap(self.assembleVotersList(self.voters["reduced"] && !self.expanded ? self.voters["reduced"] : self.voters["normalized"]), function(userButton){
				container.appendChild(userButton);
			});
		},
		function(container){
			if (!self.voters["reduced"]) return;
			self.expandMarker = JSKitLib.html('<div class="js-kit-like-expand jsk-SecondaryFontColor"></div>');
			var expandLabel = self.label(self.expanded ? "collapseList" : "andXMore", {"count" : self.voters["normalized"].length - self.displayLimit["reduced"]});
			JSKitLib.text(expandLabel, self.expandMarker, true);
			JSKitLib.preventSelect(self.expandMarker);
			JSKitLib.setEventHandler(self.expandMarker, ["click"], function(){
				self.expanded = !self.expanded;
				JSKitLib.removeChildren(self.target);
				self.assemble();
			});
			container.appendChild(self.expandMarker);
		}
	];
	JSKitLib.removeChildren(self.target);
	JSKitLib.fmap(descriptors, function(descriptor){
		descriptor(self.target);
	});
	this.onInit();
}

JSCCLike.prototype.getExpandMarker = function(element){
	return this.expandMarker;
}

function JSCCKarma(cObj, self) {
	var kObj = { p: cObj.karmaP || 0, n: cObj.karmaN || 0 };
	this.score = kObj.p - kObj.n;
	this.votes = kObj.p + kObj.n;
	this.cObj = cObj;
	this.self = self;
	this.vote2text();
	return this;
}
JSCCKarma.prototype.vote2text = function() {
	this.votesText = this.votes + ' '
			+ ((this.votes == 1) ? $JCL("vote") : $JCL("votes"));
}

JSCCKarma.prototype.recomputeScore = function(scoreAdjustment) {
	var now = new Date();
	if(this.votedAlready) {
		this.score -= this.myVote;
	} else {
		this.votes += 1;
		this.votedAlready = true;
		var kObj = this;
		setTimeout(function() {
			var action = kObj.myVote > 0 ? '+' : '-';
			kObj.self.server('-karma', {'id': kObj.cObj.ID,
					'action': action});
			}, 2000);
	}
	this.score += scoreAdjustment;
	this.myVote = scoreAdjustment;
	this.vote2text();
}

JSCC.prototype.divPages = function(so, items) {
	var srv = so.pages;
	this.curPage = 0;
	var self = this;
	if(!this.jspg && !this.useEcho()) {
		this.jspg = new JSPGC(items.length, srv.ps);
		this.jspg.dataRequest = function(pageIdx, pg, cb) {
			var pageNo = pageIdx+1;
			if(!pg.target) pg.target = self.cr('div');
			var tgt = pg.target;
			if(tgt.parentNode) tgt.parentNode.removeChild(tgt);
			self.dataLoader = function() {
				self.renderLeaveCommentForm();
				self.curPage = 0;
				self.displayPage(pageNo, function(immed){ cb.apply(self, [undefined, immed])});
			}
			if(srv.pn < 10)
				srv.pn += 5;
			self.getpages(pageNo - Math.ceil(srv.pn / 2), {'pn[0]': srv.pn});
			JSKitLib.text($JCL("loading"), tgt, true);
			return cb(tgt, false);
			};
		this.jspg.dataVisualizator = function(sIdx, arr, pg, cb) {
			if(!pg.target) pg.target = self.cr('div');
			var tgt = pg.target;
			if(tgt.parentNode) tgt.parentNode.removeChild(tgt);
			var itemsOnPage = arr.length;
			var cnvs = [];
			var cn = JSKitLib.fmap(arr,function(V,K){
				if(!V.html) {
					var oldN = V.obj.Name;
					V.obj.Name = (self.IM && V.obj.yours) ? 'Me' : oldN;
					var oldT = V.obj.Text;
					if(V.obj.status=='DT') V.obj.Text = 'Deleted';
					if (V.obj.Url && !V.obj.Url.match(/^https?:\/\//) ) {
						V.obj.Url = "http://" + V.obj.Url;
					}
					V.obj.avatarPlaceWidth = self.cmtAvatarPlaceWidth(V.obj);
					V.html = self.createCommentAsHTML(V.obj);
					V.obj.Name = oldN;
					V.obj.Text = oldT;
					delete V.div;
				}
				V.div = JSKitLib.html(V.html);
				V.div.id = V.obj.ID;
				V.obj.hasCnvs = !cnvs[V.obj.conversation];
				cnvs[V.obj.conversation] = true;
				self.fixComment(V.div, V.obj, K, K+sIdx, itemsOnPage);
				return V;
			});
			JSKitLib.removeChildren(tgt);
			self.pageHeader(tgt, sIdx, arr, itemsOnPage);
			if(self.dtGroupModeration)
				tgt.appendChild(self.groupModerationBlock(self.dtGroupModeration));
			for(var i=0; i<cn.length; i++) {
				tgt.appendChild(cn[i].div);
				if(!self.IM && (!self.adminMode || self.inlineModeration) && i<cn.length-1 && self.getSkin()=='smoothgray' && cn[i].obj.cedge>1) {
					var crdiv = function(className) {
						var div = self.cr("div");
						div.className = className;
						return div;
					};
					var div = crdiv("js-TornPageDivider");
					var divT = crdiv("js-TornPageDividerTop");
					var divB = crdiv("js-TornPageDividerBottom");
					div.appendChild(divT);
					div.appendChild(divB);
					tgt.appendChild(div);
				}
			}
			self.pageFooter(tgt, sIdx, arr, itemsOnPage);
			if(self.dtGroupModeration)
				tgt.appendChild(self.groupModerationBlock(self.dtGroupModeration));
			return cb(tgt, true);
		};
	}
	if(!this.jspg && this.useEcho()) {
		this.jspg = new JSKEchoPGC(srv.ps, srv.echo_after);
		this.jspg.dataRequest = function(pageIdx, more, echo_after, cb) {
			var pageNo = pageIdx+1;
			if(!self.jspg.target) self.jspg.target = self.cr('div');
			var tgt = self.jspg.target;
			if(tgt.parentNode) tgt.parentNode.removeChild(tgt);
			if(!more) JSKitLib.removeChildren(tgt);
			self.dataLoader = function() {
				self.renderLeaveCommentForm();
				self.curPage = 0;
				self.displayPage(pageNo, function(immed){ cb.apply(self, [undefined, immed])});
			}
			var params = {'echo[0]': true};
			if (more && echo_after) params['echo_after[0]'] = echo_after;
			self.getpages(undefined, params);
			var pageNav = self.TC['js-PageNavBottom'];
			if(pageNav) {
				JSKitLib.removeChildren(pageNav);
				pageNav.appendChild(JSKitLib.html('<div><div class="js-PageMore">' + $JCL("loading") + '</div></div>'));
			}
			self.jspg.loading = true;
			return cb(tgt, false);
		};
		this.jspg.dataVisualizator = function(arr, cb) {
			if(!self.jspg.target) self.jspg.target = self.cr('div');
			var tgt = self.jspg.target;
			var itemsOnPage = arr.length;
			var cnvs = [];
			var cn = JSKitLib.fmap(arr,function(V,K){
				if(!V.html) {
					var oldN = V.obj.Name;
					V.obj.Name = (self.IM && V.obj.yours) ? 'Me' : oldN;
					var oldT = V.obj.Text;
					if(V.obj.status=='DT') V.obj.Text = 'Deleted';
					if (V.obj.Url && !V.obj.Url.match(/^https?:\/\//) ) {
						V.obj.Url = "http://" + V.obj.Url;
					}

					if(V.obj.event_publisher) {
						if(typeof(V.obj.content) == 'string')
							eval('var content = ' + V.obj.content + '; V.obj.content = content;');
						
						// Removing links to this page
						var sanitizer = function(url) {
							if (!url) return '';
							if ('/' != url[url.length - 1]) url = url + '/';
							return url.split('#', 2)[0]
								.toLowerCase()
								.replace(/\butm_(source|medium|term|content|campaign)=[^&$]+(&|$)/g, '')
								.replace(/\?*&*$/, '')
								.replace(/^https?:\/\/(www\.)?/, '')
								.replace(/\/\/+/, '/');
						};

						var el = document.createElement('div');
						el.innerHTML = V.obj.content.title;
						var ref = sanitizer(self.config.permalink);
						var links= JSKitLib.getElementsByClass(el, '*', 'a');

						JSKitLib.fmap(links, function(link) {
							var data_resolved = sanitizer(link.getAttribute('data-resolved'));
							var href = sanitizer(link.href);
							if((href == ref) || (data_resolved == ref))
								link.parentNode.removeChild(link);
						});

						var clearText = JSKitLib.trim(el.innerHTML.replace(/<\/?wbr>/g, ''));
						if (clearText == "") {
							el.innerHTML = $JCL("sharedThisOn", {"service_name": V.obj.content.service.name || V.obj.event_publisher});
						}

						V.obj.content.title = el.innerHTML;

						if(V.obj.content.user && (V.obj.content.user.profileUrl || V.obj.content.user.avatarUrl)) {
							V.obj.avatar = V.obj.GravatarID = (V.obj.content.user.avatarUrl ||
								V.obj.content.user.profileUrl + "/picture?size=medium");
							V.obj.avatarWidth = "50";
							V.obj.avatarHeight = "50";
							V.obj.avatarPlaceWidth = self.cmtAvatarPlaceWidth(V.obj);
							V.obj.ProfileURL = V.obj.content.user.profileUrl;
						}
						V.html = self.tmpl(self.ffComment, V.obj);
					} else {
						V.obj.avatarPlaceWidth = self.cmtAvatarPlaceWidth(V.obj);
						V.html = self.createCommentAsHTML(V.obj);
					}
					V.obj.Name = oldN;
					V.obj.Text = oldT;
					V.$olddiv = V.div;
					V.$isnew = true;
					V.div = JSKitLib.html(V.html);
					if (V.obj.extra && V.obj.extra.cssClass) {
						JSKitLib.addClass(V.div, V.obj.extra.cssClass);
					}
				}
				V.div.id = V.obj.ID;
				V.obj.hasCnvs = !cnvs[V.obj.conversation];
				cnvs[V.obj.conversation] = true;
				if(V.obj.echoItemFirstTime && !V.obj.havingEffect) {
					V.div.style.overflow = 'hidden';
					V.div.style.height = "1px";
					V.obj.height = 1;
				}
				if(V.$isnew)
					self.fixComment(V.div, V.obj, K, K, itemsOnPage);
				return V;
			});
			for(var i=0; i<cn.length; i++) {
				var V = cn[i];
				var div = V.div;
				if(V.$isnew) {
					var parent = self.findRootParent(V.obj);
					if(V.obj.extra.collapsed) {
						JSKitLib.hide(div);
					}
					if(V.$olddiv && JSKitLib.hasParentNode(V.$olddiv)) {
						tgt.replaceChild(div, V.$olddiv);
					} else {
						if(!i) {
							if(tgt.firstChild) {
								tgt.insertBefore(div, tgt.firstChild);
							} else {
								tgt.appendChild(div);
							}
						} else {
							tgt.insertBefore(div, cn[i-1].div.nextSibling);
						}
					}
					delete V.$isnew;
					delete V.$olddiv;
					if (V.obj.extra.collapsed && parent && parent.extra.areRepliesCollapsed && !parent.extra.expandMarker) {
						parent.extra.expandMarker = self.assembleExpandRepliesMarker(parent);
						tgt.insertBefore(parent.extra.expandMarker, cn[i-1].div.nextSibling);
					}
				}
			}
			return cb(tgt, true);
		};
	}
	if(this.useEcho()) {
		this.jspg.newData(items, srv.echo_after);
	} else {
		this.jspg.newData(srv.tc, srv.sp-1, items);
	}
}

JSCC.prototype.groupModerationBlock = function(tm) {
	var self = this;
	var prefix = "js-groupModerationCtrl-";
	var controls = tm.match(new RegExp(prefix + "([A-Za-z0-9_-]+)", 'g'));
	var descriptors = JSKitLib.foldl({}, controls, function(ctrl, acc) {
		var name = ctrl.replace(prefix, "");
		acc[name] = function(element) {
			JSKitLib.setEventHandler(element, ["click"], function() {
				self.groupModerationAction(name);
			});
		}
	});
	return JSKitLib.toDOM(tm, prefix, descriptors).content;
}

JSCC.prototype.selectComments = function(mode) {
	var self = this;
	JSKitLib.fmap(this.jspg.getPageItems(this.curPage-1), function(item) {
		var checkbox = item.div.ctls["js-singleCommentCheckbox"];
		if (!checkbox) return;
		var state = "unchecked";
		switch (mode) {
			case "all" : state = "checked"; break;
			case "none" : state = "unchecked"; break;
			case "spam" : if (item.obj.status == 'S'){ state = "checked"; } break;
			case "offensive" : if (item.obj.status == 'O'){ state = "checked"; } break;
		}
		self.setInputState("checkbox", checkbox, state);
		self.moderationCommentsListUpdate(item.obj.ID, state == "checked");
	});
}

JSCC.prototype.groupModerationAction = function(action) {
	if (action.match(/select-/)) {
		this.selectComments(action.replace("select-",""));
		return false;
	}
	var all = new Array();
	var categories = {'spam': [], 'appr': [], 'del': []};
	var s = this;
	JSKitLib.fmap(this.moderationCommentsList, function(item, id) {
		var cmt = s.jspg.getItemById(id).div;
		if (!cmt) return;
		var it = {'id': id, 'p': cmt.cobj.path};
		all.push(it);
		var status = cmt.cobj.status;
		switch (status) {
			case "S" : categories.spam.push(it); break;
			case "D" : categories.appr.push(it); break;
			default  : categories.del.push(it);
		}
	});
	s.groupModerationRequest(action, (action == 'message' ?  categories : all));
	s.moderationCommentsList = {};
}

JSCC.prototype.groupModerationRequest = function(action, idlist, extra) {
	if (!idlist || (action != "message" && idlist.length == 0)) return;
	var so = this.serverOptions;
	var req = {};
	req.epb = window.JSKitEPB ? JSKitEPB.getAsHash() : {};	
	req.request = { jx: this.jcaIndex, ref: JSKitLib.getRef(this), nonce: so && so.nonce || ""};
	if(this.config.moderate) req.request.mod = 1;
	if(this.inlineModeration && (action != 'delete')) req.request.inln = 1;
	req.variableRequest = idlist;
	JSKitLib.fmap(extra || [], function(extraItem, id) {
		req.request[id] = extraItem;
	});
	switch(action) {
		case 'message':
			if(this.config.permalink) req.request.permalink = this.config.permalink;
			if(idlist.spam.length>0) {
				req.variableRequest = idlist.spam;
				req.request.junk = 'no';
				req.uri = this.uriDomain + '/comments-junk';
				new JSRVC(req);
			}
			if(idlist.appr.length>0) {
				req.variableRequest = idlist.appr;
				req.uri = this.uriDomain + '/comments-approve';
				new JSRVC(req);
			}
			if(idlist.del.length>0) {
				req.variableRequest = idlist.del;
				req.request.apr = 'message';
				req.uri = this.uriDomain + '/comments-del';
				new JSRVC(req);
			}
			break;
		case 'delete':
			req.uri = this.uriDomain + '/comments-del';
			new JSRVC(req);
			break;
		case 'spam':
			req.request.junk = 'yes';
			req.uri = this.uriDomain + '/comments-junk';
			new JSRVC(req);
			break;
		case 'user':
			req.request.apr = 'user';
			req.uri = this.uriDomain + '/comments-del';
			new JSRVC(req);
			break;
		case 'blockuser':
			req.request.by = 'user';
			req.uri = this.uriDomain + '/comments-block';
			new JSRVC(req);
			break;
		case 'blockip':
			req.request.by = 'ip';
			req.uri = this.uriDomain + '/comments-block';
			new JSRVC(req);
			break;
		case 'unban':
			if(this.config.permalink) req.request.permalink = this.config.permalink;
			req.request.unban = 1;
			req.uri = this.uriDomain + '/comments-approve';
			new JSRVC(req);
			break;
	};
}

JSCC.prototype.pageHeader = function(target, globalIndex, items, itemsOnPage) {
	if(this.getSkin()=='smoothgray' && itemsOnPage>0 && items.length>0 && (!this.adminMode || this.inlineModeration)) {
		var obj = items[0].obj;
		if(obj.cedge!=3 && obj.cedge!=1) {
			var div = this.cr("div");
			div.className = "js-TornPageTop";
			if(JSKitLib.isIE()) {
				var img = this.cr("img");
				img.className = "js-TornPageTopImg";
				img.src = "//cdn.js-kit.com/images/tornPaperT.gif";
				div.appendChild(img);
			}
			target.appendChild(div);
		}
	}
}

JSCC.prototype.pageFooter = function(target, globalIndex, items, itemsOnPage) {
	if(this.getSkin()=='smoothgray' && itemsOnPage>0 && items.length==itemsOnPage && (!this.adminMode || this.inlineModeration)) {
		var obj = items[itemsOnPage-1].obj;
		if(obj.cedge!=3 && obj.cedge!=2) {
			var div = this.cr("div");
			div.className = "js-TornPageBottom";
			if(JSKitLib.isIE()) {
				var img = this.cr("img");
				img.className = "js-TornPageBottomImg";
				img.src = "//cdn.js-kit.com/images/tornPaperB.gif";
				div.appendChild(img);
			}
			target.appendChild(div);
		}
	}
}

JSCC.prototype.htmlPaginate = function(thread) {
	return this.htmlPaginator(thread, []);
}

JSCC.prototype.htmlPaginator = function(thread, arr) {
	var tl = thread.length;
	for(var i = 0; i < tl; i++) {
		var obj = thread[i];
		var present = (obj.status == 'D') ? 0 : 1;
		if(present) {
			arr.push(obj);
		}
		this.htmlPaginator(obj.thread, arr);
	}
	return arr;
}

JSCC.prototype.restoreEchoAfter = function() {
	if(this.useEcho()) {
		this.jspg.echo_after = this.jspg.$old_echo_after;
	}
}

JSCC.prototype.invalidateJSPG = function() {
	this.restoreEchoAfter();
	this.jspg.invalidate();
}

// Part of externally useable API
JSCC.prototype.rerender = function() {
	var pageToDisplay = this.curPage;
	this.restoreEchoAfter();
	this.curPage = 0;
	this.jspg.invalidatePagesView(pageToDisplay-1, 1);
	this.displayPage(pageToDisplay);
}

JSCC.prototype.setPath = function(path) {
	this.pathOverride = path;    
}

JSCC.prototype.detectCommentDialogOpened = function() {
	var ccd = this.TC[this.forMsg && this.forMsg.isEditing ? "js-EditComment" : "js-CreateComment"];
	return !!ccd && JSKitLib.hasParentNode(ccd) && ccd.style.display == 'block';
}

JSCC.prototype.displayPage = function(pageNo, cb) {
	if(this.loading && !cb) {
		var nt = (new Date()).valueOf();
		if((nt - this.loading) > 5000) {
			this.gen++;
		} else  {
			return;
		}
	}

	if(pageNo < 1)
		return;

	if(pageNo > this.jspg.pageCount)
		pageNo = this.jspg.pageCount;

	var immediate = true;

	if(this.curPage != pageNo) {
		var cd = this.detectCommentDialogOpened();
		try {
			if (!this.useEcho() || this.forMsg) this.CommentCancelled();
		} catch(e) { }

		if(!this.useEcho())
			try {
				if(this.curPage) {
					var p = this.jspg.getPage(this.curPage - 1);
					if(p && p.target && p.target.parentNode)
						p.target.parentNode.removeChild(p.target);
				}
			} catch(e) { }
		var oc = this.TC["js-OldComments"];
		var self = this;
		if(this.useEcho()) {
			this.curPage = 1;
			var pcb = function(p, immed) {
				if(p) {
					if(self.jspg.target && !JSKitLib.hasParentNode(self.jspg.target)) oc.appendChild(p);
					p.style.display = '';
				}
				if(immed && cb) cb.apply(self, [immed]);
			};
			this.jspg.getPageVisualization(pageNo-1, pcb);
			if(cd && this.replyForId) {
				var parentMsg = this.jspg.getItemById(this.replyForId);
				this.ShowCommentDialog(parentMsg ? this.replyForId : undefined);
			}
			cd = undefined;
		} else {
			this.curPage = pageNo;
			var pcb = function(p, immed) {
				if(p) {
					oc.appendChild(p);
					p.style.display = '';
				}
				if(immed && cb) cb.apply(self, [immed]);
			};
			this.jspg.getPageVisualization(pageNo-1, pcb);
		}
		immediate = false;
		if (cd && !this.forMsg) { // show only if not reply and not editing
			if (((this.config.nolc && this.IM == 'foreign') || (this.serverOptions.expandLeaveCmt && !this.config.noautoexpand)) && !this.config.moderate) {
				this.ShowCommentDialog(undefined, {nofocus: true});
			}
		}
	}

	var ocw = this.TC["js-OldCommentsWrap"];
        if (this.jspg.itemsCount != 0)
        {
          JSKitLib.show(ocw);
        }
        else
        {
          JSKitLib.hide(ocw);
        }

	if(!this.jspg.loading || !this.useEcho()) this.rePageNavigator(this.curPage-1);
	if(immediate && cb) cb.apply(this, [immediate]);
}

JSCC.prototype.SearchLine = function() {
	var self = this;	
	var sExit = self.cr('span');
	var title = self.cr('span');
	title.className = 'js-SearchTitle';
	title.innerHTML = '<b>'+$JCL("youSearchedFor")+':</b>';
	sExit.appendChild(title);
	var line = self.cr('span');
	line.className = 'js-SearchWords';
	text = JSKitLib.truncate(self.searchString, 15, "...", true);
	line.insertBefore(JSKitLib.text(text),line.firstChild);
	sExit.appendChild(line);
	var del = self.cr('input');
	del.type = 'button';
	del.value = $JCL('clearSearch');
	sExit.appendChild(del);
	var obj={
		 'containerElement':	 	sExit,
		 'field': 			line,
		 'itemObject': 			self,
		 'type':			'Search',
		 'Property': 			'searchString',
		 'title':			$JCL("youSearchedFor")+': ',
		 'mode': 			'full'
		};
	obj.jsipe$start = function(){
		del.style.display = "none";
		line.style.border = "0px";
		title.style.display = "none";
		return true;
	}
	obj.jsk$on_submit_exit = function(value){
		self.searchString = value;	
		self.viewControl({name: "search"});
	}
	line.wasEdited = function(value){
		JSKitLib.text(JSKitLib.truncate(value, 15, "...", true), line, true);
		del.style.display = "";
		line.style.borderBottom = "";
		title.style.display = "";
	}
	del.onclick = function(){
		this.name="del-line";
		self.viewControl(this);
	}
	var jsipe = new JSIPE(obj);
	return sExit;
}

JSCC.prototype.navSym = { "prev": "&larr;", "next": "&rarr;" };

JSCC.prototype.rePageNavigator = function(pageIdx) {
	var s = this;
	var hasMultiplePages = s.jspg.pageCount > 1 || s.jspg.echo_after;
	var display = s.searchString || hasMultiplePages ? "" : "none";
	var assemblePageNavigation = function() {
		var navigation = '';
		if (hasMultiplePages) {
			navigation = s.useEcho()
				? s.pageNavigatorEchoLive(s.jspg.pageCount, s.jspg.echo_after)
				: s.getSkin() == "echo"
					? s.pageNavigatorEcho(s.jspg.pageCount, s.curPage)
					: s.pageNavigator(s.jspg.pageCount, s.curPage);
		}
		return (typeof(navigation) == "string")
			? JSKitLib.html('<div>' + (navigation || '') + '</div>')
			: navigation;
	};
	var nvs = s.useEcho() ? ['Bottom'] : ['Top','Bottom'];
	for(var i = 0; i < nvs.length; i++) {
		var bar = s.TC['js-PageNav' + nvs[i]];
		if (!bar) continue;
		JSKitLib.replaceChildren(bar, assemblePageNavigation());
		JSKitLib.preventSelect(bar);
		bar.style.display = display;
		if(i) bar.style.display = ((pageIdx==undefined) ? 'none' : '');
		if(s.searchString) s.addChild(bar, s.SearchLine(), true);
	}
}

JSCC.prototype.pageNavigator = function(pages, cur) {
	var self = this;
	var arr = [];
	var postingProcessValidation = "if ($JCA["+self.jcaIndex+"].commentPostingProcess) { alert($JCL('messagePostingInProgress')); return false; }";
	var f = function(i, txt, cmt, cls, cf) {
		return '<a href="#'+cmt+'" onclick="' + postingProcessValidation + (cf || '$JCA['+self.jcaIndex+'].displayPage('+i+');') + ' return false;" onmouseover="window.status='+"'"+cmt+"'"+'; return false;" onmouseout="window.status=\'\'; return true;" class="js-PageNOther'+(cls?' '+cls:'')+'">' + txt + '</a> '; }
	arr.push($JCL('page'));
	arr.push(f(cur - 1, this.navSym.prev, $JCL('pagePrevious'),
		'js-PageArrow' + ((cur == 1)?' js-PageArrowCur':'')));
	for(var i = 1; i <= pages; i++) {
		if((i == 4 || i == 3) && (cur - i) > 3) {
			i = Math.floor((cur - i) / 2 + i);
			arr.push(f(i, '&hellip;', 'Page-' + i));
			i = cur - ((pages - cur > 3 || cur == pages) ? 2 : 1);
		}
		if((i == cur + 3) && (pages - cur) > 4) {
			i = Math.floor((pages - cur) / 2 + cur);
			arr.push(f(i, '&hellip;', 'Page-' + i));
			i = pages - 1;
		}
		if(i == cur) {
			arr.push(f(i, i, 'Page-' + i, "js-PageNCur", '$JCA['+self.jcaIndex+'].jspg.invalidate(); $JCA['+self.jcaIndex+'].rerender();'));
		} else {
			arr.push(f(i, i, 'Page-' + i));
		}
	}
	arr.push(f(cur + 1, this.navSym.next, $JCL('pageNext'),
		'js-PageArrow' + ((pages == cur)?' js-PageArrowCur':'')));
	return arr.join('');
}

JSCC.prototype.pageNavigatorEcho = function(pages, cur) {
	var self = this;
	var assemble = function(container, i, txt, cmt, cls, cf) {
		var isInactive = function(cls) {
			return cls && cls.match(/PrevOff|NextOff|Active/);
		};
		var template =
		'<li class="' + (cls ? cls : '') + '">' +
			(isInactive(cls) ? txt : '<a name="js-PageLink">' + txt + '</a>') +
		'</li>';
		var scroll = function() {
			var anchor = self.TC['jsk-HeaderWrapper'];
			if (!anchor || JSKitLib.getStyleProperty(anchor, 'display') == 'none') {
				anchor = self.TC['jsk-ThreadWrapper'];
			}
			if (anchor) anchor.scrollIntoView(true);
		};
		var linkHandler = function(element) {
			element.href = "#" + cmt;
			element.onclick = function() {
				if (self.commentPostingProcess) {
					alert($JCL('messagePostingInProgress'));
					return false;
				}
				if (cf) {
					cf();
					return false;
				}
				self.displayPage(i, function() {
					self.hideExpirationBanner();
					setTimeout(scroll, 0);
				});
				return false;
			};
			JSKitLib.setMouseEvent(element, "over", function() {
				window.status = cmt;
			});
			JSKitLib.setMouseEvent(element, "out", function() {
				window.status = '';
			});
		};
		container.appendChild(JSKitLib.toDOM(template, "js-Page",
						{"Link": linkHandler}).content);
	}
	var template =
	'<div class="jsk-PagerWrapper jsk-PrimaryFont">' +
		'<ul class="jsk-Pager"></ul>' +
	'</div>';
	var assemblePages = function(element) {
		assemble(element, cur - 1, $JCL('btnPagePrevious'), $JCL('pagePrevious'),
					((cur == 1) ? 'jsk-PrevOff' : 'jsk-Prev'));
		for(var i = 1; i <= pages; i++) {
			if((i == 4 || i == 3) && (cur - i) > 3) {
				i = Math.floor((cur - i) / 2 + i);
				assemble(element, i, '&hellip;', 'Page-' + i);
				i = cur - ((pages - cur > 3 || cur == pages) ? 2 : 1);
			}
			if((i == cur + 3) && (pages - cur) > 4) {
				i = Math.floor((pages - cur) / 2 + cur);
				assemble(element, i, '&hellip;', 'Page-' + i);
				i = pages - 1;
			}
			if(i == cur) {
				var cb = function() {
					self.jspg.invalidate();
					self.rerender();
				};
				assemble(element, i, i, 'Page-' + i, 'jsk-Active', cb);
			} else {
				assemble(element, i, i, 'Page-' + i);
			}
		}
		assemble(element, cur + 1, $JCL('btnPageNext'), $JCL('pageNext'),
					((pages == cur) ? 'jsk-NextOff' : 'jsk-Next'));
	};
	return JSKitLib.toDOM(template, "jsk-", {"Pager": assemblePages}).content;
}

JSCC.prototype.pageNavigatorEchoLive = function(pages, cur) {
	var self = this;
	var template =
	'<div class="js-PageMore">' +
		'<span>{Label:More}</span>' +
	'</div>';
	var moreButtonHandler = function(element) {
		element.onclick = function() {
			self.displayPage(2);
		};
		JSKitLib.setMouseEvent(element, "over", function() {
			JSKitLib.addClass(element, "jsk-PagerItemHover");
		});
		JSKitLib.setMouseEvent(element, "out", function() {
			JSKitLib.removeClass(element, "jsk-PagerItemHover");
		});
	};
	return JSKitLib.toDOM(this.gtmpl(template), "js-Page", {"More": moreButtonHandler}).content;
} 

JSCC.prototype.hideSettingsWindow = function(wname) {
	if(this[wname]) this.settingsWindow(wname);
}

JSCC.prototype.showProgress = function(wname, on) {
	if(this[wname]) this[wname].showProgress(on);
}

JSCC.prototype.settingsWindow = function(wname, atDiv, html) {
	var s = this;
	if(s[wname]) {
		if(!s.sWHideable) return;
		s[wname].parentNode.removeChild(s[wname]);
		delete s[wname];
		return;
	}
	var nohide = function() {
		s.sWHideable = false;
		if(s.swsHidt) clearTimeout(s.swsHidt);
		s.swsHidt = setTimeout(function(){s.sWHideable=true}, 100);
	}
	var div = this.cr("div");
	div.className = "js-SettingsWindow";
	if (s.config.nolc) JSKitLib.addClass(div, "js-SettingsWindowNolc");
	div.style.background = '#FFFFFF url('+this.uriDomain
				+'/images/bg-header-gray.png) bottom repeat-x';
	div.onclick = nohide;
	div.onselectstart = function() { return false; }
	if(typeof(html) == 'string') {
		div.innerHTML = html;
	} else {
		if(!html.dropWidth) div.style.width = '20em';
		div.appendChild(html);
	}

	if (wname == 'ctWnd' && s.TC['js-WelcomePanel']) {
		var aoh = s.cr('div');
		aoh.className = 'js-SettingsWindowHeader';
		JSKitLib.text($JCL('administratorOptions'), aoh);
		div.appendChild(aoh);
		var wp = s.TC['js-WelcomePanel'];
		var links = JSKitLib.html(''
			+ '<table border=0 cellpadding=4 align=center width="220" style="white-space: nowrap">'
			+ '<tr valign="top"><td class="js-WelcomeOpenPanel"><div class="js-WelcomeImgPanel"><a href="javascript:void(0);">' + $JCL(JSKitLib.visible(wp) ? 'closeWelcome' : 'openWelcome') + '</a></div></td></tr>'
			+ '<tr><td class="js-WelcomeContact"><div class="js-WelcomeImgSupport"><a href="javascript:void(0);">' + $JCL('contactSupport') + '</a></div></td></tr>'
			+ '</table>');
		var tc = JSKitLib.mapClass2Object({}, links);
		div.appendChild(links);
		tc['js-WelcomeOpenPanel'].onclick = function() {
			JSKitLib.toggle(wp);
			JSKitLib.text($JCL(JSKitLib.visible(wp) ? 'closeWelcome' : 'openWelcome'), this.lastChild.lastChild);
		};
		tc['js-WelcomeContact'].onclick = function(){location.href = s.uriDomain + '/comments/qa.html';};
	}

	var pgr = this.cr('div');
	pgr.className = "js-Progress";
	var url = this.uriDomain + '/images/progress-wg.png';
	if(document.body.filters) {
                pgr.runtimeStyle.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(src=" + url + ", sizingMethod=crop)";
       	} else pgr.style.backgroundImage = 'url(' + url + ')';
	div.appendChild(pgr);
	div.showProgress = function(on) {
		if(!on) {
			if(div.pIntvl) clearInterval(div.pIntvl);
			div.pIntvl = null;
			pgr.style.visibility  = 'hidden';
			return;
		} else if(div.pIntvl) return;
		var f = function() {
			pgr.vison = !pgr.vison;
			pgr.style.visibility = pgr.vison
				? 'visible' : 'hidden';
		}
		f();
		div.pIntvl = setInterval(f, 500);
	}

	s[wname] = div;
	var swh = this.cr("div");
	swh.className = "js-SettingsWindowHeader";
	JSKitLib.text($JCL(wname == 'ctWnd' ? "viewOptions" : "moderation"), swh);
	div.insertBefore(swh, div.firstChild);
	div.style.position = "absolute";

	var jsd = new JSDL(div, [swh]);
	document.body.appendChild(div);
	div.style.left = jsd.getElmAbsPos(atDiv, false).x + "px";
	div.style.top =  jsd.getElmAbsPos(atDiv, false).y + atDiv.offsetHeight + "px";

	try {
		if (document.body.clientWidth < jsd.getElmAbsPos(atDiv, false).x + div.offsetWidth)
			div.style.left = document.body.clientWidth - div.offsetWidth -
                        	(parseInt(div.style.marginLeft) || 0) -
                                (parseInt(div.style.marginRight) || 0) + "px";
	} catch(e) {;}
	
	var ifrWr;
	if(JSKitLib.getBrowser() == 'gecko' && !atDiv.notShowIfr) {
                ifrWr = this.cr("div");
                ifrWr.id = "jsk-yIfr";
                var yIfr = this.cr("iframe");
                yIfr.style.position = "absolute";
                yIfr.style.top = 0;
                yIfr.style.left = 0;
                yIfr.style.zIndex = -1;
                yIfr.style.display = "block";
                yIfr.style.height = div.offsetHeight + "px";
                yIfr.style.width = div.offsetWidth + "px";
                yIfr.scrolling = "no";
                yIfr.frameBorder = "0";
                ifrWr.appendChild(yIfr);
                div.appendChild(ifrWr);
	}
	div.jsk$on_start_drag = function(){if(ifrWr) ifrWr.style.display = "none"};
	div.jsk$on_stop_drag = function(){if(ifrWr) ifrWr.style.display = ""};
	nohide();
}

JSCC.prototype.getImages = function(id) {
	var arg = {rnd: id, jx: this.jcaIndex};
	this.server(this.uriDomain + '/api/images/pick-attachments.js', arg);
}

JSCC.prototype.prepareImgData = function(msg) {
	if(this.images){
		JSKitLib.removeChildren(this.imgArea);
		JSKitLib.map(function(elem, i){
			JSKitLib.fmap(['img','orig','width','height','descr','mime'],
				function(E) { msg.push({'Name': 'js-CmtattachFile_'+i+'_'+E, 'Value': elem[E]})}
			);
		},this.images);
	}
}

JSCC.prototype.parseImgData = function(obj) {
	var re = /attachFile_(\d+)_(\w+)/;
	var imgs = [];
	for (var i in obj){
		var keys = re.exec(i);
		if (keys) {
                        if (!imgs[keys[1]]) imgs[keys[1]] = {};
                        imgs[keys[1]][keys[2]] = obj[i];
		}
	}
	return imgs;
}

JSCC.prototype.createImages = function(imgs, isPreview){
	var s = this;
	var d=function(){return s.div.apply(s,arguments);}

	var content = isPreview ? d() :
		      d("js-all-previewImages",d("js-previewImageTitle jsk-ItemAttachmentsTitle jsk-SecondaryBackgroundColor", $JCL('picTitle')),
			JSKitLib.html('<div style="clear:both;"></div>'));

	var bloburl = function(name) {
		return name.match(/^[^\/]+$/)?(s.uriDomain+"/blob/"+name):"";
	}

	var crImg = function(elem, i){
		var img = d("js-previewImage jsk-ItemAttachmentWrapper");
		var thumb = s.cr("img");
		elem.descr = elem.descr || '';
		thumb.src = bloburl(elem.img);
		JSKitLib.setStyle(thumb, " width: "+elem.width+"px; height: "+elem.height+"px; cursor: pointer;");
		JSKitLib.addClass(thumb, "jsk-ItemAttachmentIcon");
		var wrap = d("js-imageWrap jsk-ItemAttachmentIconWrapper");
		JSKitLib.setStyle(wrap, "margin-top: " + ((96-elem.height)/2) + "px; margin-bottom: " + ((96-elem.height)/2) + "px;");
		thumb.onclick = function() { window.open(bloburl(elem.orig)); }
		var text = d("js-previewImageDescr jsk-ItemAttachmentLabel");
		s.addChild(wrap, thumb);
		s.addChild(img, wrap);
		if (isPreview) {
			var wasEdited = function(){
				if(elem.descr != "" ) JSKitLib.removeClass(text,"js-uploadGreyDescr");
				else JSKitLib.addClass(text,"js-uploadGreyDescr");
			}
			var jsipe = new JSIPE2({obj: elem,
						property: 'descr',
						title: 'Description',
						defaultText: 'Add caption',
						width: '90px',
						maxLength: 80,
						hideApplyBtn: true,
						jsk$wasEdited: wasEdited
			});
			text.appendChild(jsipe.div);
			var onEditBtnClick = function(e){ 
				if(jsipe.editMode) jsipe.editMode(e);
				JSKitLib.stopEventPropagation(e || window.event); 
			}
			var onDeleteBtnClick = function(e){
				img.parentNode.removeChild(img);
				if(imgs && imgs[i]) imgs.splice(i, 1);
				JSKitLib.stopEventPropagation(e || window.event);
			}		
			var editBtn   = s.crImgCtrl("edit",   {top: "60px", left: "15px"}, onEditBtnClick);
			var deleteBtn = s.crImgCtrl("delete", {top: "60px", left: "57px"}, onDeleteBtnClick);
			var displayMode = function(mode){
				editBtn.style.display = mode;
                                deleteBtn.style.display = mode;
			}
			img.onmouseover = function(e) { displayMode("inline"); }
			img.onmouseout = function(e) { displayMode("none"); }
			s.addChild(img, editBtn);
			s.addChild(img, deleteBtn);
			if(elem.descr == "") JSKitLib.addClass(text,"js-uploadGreyDescr");
		} else {
			text.innerHTML = elem.descr.replace(/</g,"&lt;").replace(/>/g,"&gt;");
		}
		thumb.title = JSKitLib.htmlUnquote(elem.descr);
		s.addChild(img, text);
		s.addChild(content, img);
	}
	JSKitLib.map(crImg,imgs);
	s.addChild(content, JSKitLib.html('<div style="clear:both;"></div>'));

	return content;
}

JSCC.prototype.crImgCtrl = function(type, position, onClick) {
	var btn = this.cr("div");
	var ctrlBtn = { width : "30px", height : "30px", imgWidth :  "30px", imgHeight : "30px" };
	JSKitLib.setStyle(btn, "display:none; background:transparent; position:absolute; float:left; padding:0; margin:0; "
		+ "width:" + ctrlBtn.width + "; height:" + ctrlBtn.height + "; cursor: pointer;"
		+ "top:" + position.top + "; left:" + position.left);
	btn.title = $JCL(type + "Image");
	btn.onclick = onClick;
	imgUrl = this.uriDomain + "/images/" + "avatar-" + type + ".png";
	JSKitLib.addPNG(btn, imgUrl);

	return btn;
}


JSCC.prototype.addImage = function(img) {
	if(this.lbliChange) this.lbliChange(0);
	if (typeof(img) == "object"){
		if (img.error) {
			switch (img.error) {
				case 'big_image':
					alert($JCL('imgUploadErrorBigImage'));
					break;
				case 'wrong_format':
					alert($JCL('imgUploadErrorWrongFormat'));
					break;
				case 'internal_error':
				default:
					alert($JCL('imgUploadErrorInternal'));
			}
			return;
		}
		if (this.images) this.images.push(img)
		else this.images = [img];
		if (!this.imgArea) return;
		JSKitLib.removeChildren(this.imgArea);
		var content = this.createImages(this.images, true);
		this.addChild(this.imgArea, content);
	}
}

JSCC.prototype.viewControl = function(sel) {
	var s = this;
	var ap = { "usr": "yes" };
	switch(sel.name) {
	case "jss-srt":
		var newSortBy = sel.options[sel.selectedIndex].value;
		if(newSortBy == s.config.sort) return true;
		s.config.sort = newSortBy;
		s.showProgress('ctWnd', true);
		break;
	case "jss-rev":
		var backwardsNewStatus = sel.selectedIndex?'yes':'no';
		if(s.config.backwards == backwardsNewStatus) return true;
		s.config.backwards = backwardsNewStatus;
		s.showProgress('ctWnd', true);
		break;
	case "jss-prs":
		var newThr = sel.options[sel.selectedIndex].value == 'flat' ? 'no' : 'yes';
		if(newThr == s.config.thread) return true;
		s.config.thread = newThr;
		s.showProgress('ctWnd', true);
		break;
        case "search":
                ap.srch = s.searchString;
                break;
        case "del-line":
                break;
	default: return false;
	}
	s.dataLoader = function() {
		this.showProgress('ctWnd', false);
		this.curPage = 0;
		this.displayPage(1); }
	if(this.curPage) {
		var p = this.jspg.getPage(this.curPage - 1);
		if(p && p.target && p.target.parentNode)
			p.target.parentNode.removeChild(p.target);
	}
	s.ctag = null;
	ap.opts = s.config.sort+'|'+(s.config.backwards == "yes" ? "desc" : "asc")+'|'+(s.config.thread == "yes" ? "thr" : "flat");
	s.getpages(0, ap);
	return true;
}

JSCC.prototype.placeAvatar = function(obj, div) {
	div = div || obj.avatarPlace;
	if(!div) return;

	if(this.getSkin() != 'echo' && !obj.avatar && !obj.GravatarID) {
		obj.avatarPlace = div;
		return;
	}
	var container = {
		"instance": div,
		"width": obj.avatarPlaceWidth,
		"height": obj.avatarPlaceWidth
	};
	this.appendAvatarImage(container, obj);
	this.appendProfileHandler(div, obj);
	return div;
}

JSCC.prototype.appendAvatarImage = function(container, obj) {
	var self = this;
	obj = obj || {};
	var avtCtrl = this.avatarsManager;
	var data = obj.avatar ? 
		{"name": obj.avatar, "width": obj.avatarWidth, "height": obj.avatarHeight} :
		avtCtrl.anonymousAvatarData();

	var avatar = avtCtrl.calcAvatarDim(container, data);
	avatar.name = obj.GravatarID ?
		avtCtrl.getGravatarURL(obj.GravatarID, this.maxAvatarDims) :
		avtCtrl.avatarURL(avatar.name);
	avatar.onerror = function() {
		this.onerror = null;
		self.appendAvatarImage(container);
	}
	avtCtrl.assembleAvatar(container, avatar);
}

JSCC.prototype.placeProcessAvatar = function(div) {
	if(!div) return;
	JSKitLib.removeChildren(div);
	JSKitLib.addPNG(div, '//cdn.js-kit.com/images/progress-wg.png');
	JSKitLib.addStyle(div, "width: 15px; height: 15px;");
}

JSCC.prototype.refreshComments = function(params) {
	var s = this;
	params = params || {};
	s.deleteWelcomePanel();
	s.hideExpirationBanner();
	s.invalidateJSPG();
	s.objById = {};
	if (s.curPage == 1) s.curPage = 0;
	s.displayPage(1, function() {
		if (!s.isSourceAvailable("Comments")) return;
		s.preventAnonymousComments();
		s.makeWelcomePanel();
		s.ShowCommentDialog(s.replyForId, params);
	});
}

JSCC.prototype.preventAnonymousComments = function() { 
	var anonymCond = this.anonymousCmt && !this.jskauth.isLogged();
	this.setControlsStateLCF(anonymCond ? "disable" : "enable");
}

JSCC.prototype.setControlsStateLCF = function(state, extraControls) {
	var s = this;
	var disable = state == "disable";
	var disableCtrls = JSKitLib.merge([s.TC['js-CmtText'], s.TC['js-CmtTextEdit'], s.TC['js-Cmtsubmit'], s.TC['js-CmtsubmitEdit'], s.TC['js-CmtcancelEdit'], s.TC['js-CmtName'], s.TC['js-CmtEmail'], s.imgUpload], extraControls || []);
	var lockCtrls = [s.TC['js-Cmtsubmit']];
	var imgArea = s.TC['js-commentImageArea'];

	JSKitLib.fmap(disableCtrls, function(V){ if (V) V.disabled = disable; });
	JSKitLib.fmap(lockCtrls, function(V){ if (V) V.btnLocked = (disable) ? "true" : null; });
	if (imgArea) imgArea.disableUpload = disable;
} 

JSCC.prototype.setThirdPartyShare = function() {
	var s = this;
	var po = s.TC["js-commentPubOptions"];
	if(!po) return;
	JSKitLib.removeChildren(po);
	var appendSharingControl = function(type, extraElement) {
		var identity = s.jskauth.getAuthIdentity(type);
		var publish = identity && identity.publish;	
		var control = JSKitLib.html('<input type="checkbox" class="js-commentShareCheckbox js-commentShareCheckbox-' + type + '" name="js-CmtShare-' + type + '" />');
		control.defaultChecked = !!publish;
		control.checked = !!publish;
		control.value = control.checked ? "on" : "off";
		control.onchange = function() {
			this.value = this.checked ? "on" : "off";
		};
		var label = JSKitLib.html('<div class="js-commentShareLabel js-commentShareLabel-' + type + '">' + $JCL('shareVia_' + type) + '</div>');
		po.appendChild(control);
		po.appendChild(label);
		if (extraElement) po.appendChild(extraElement);
	};
	JSKitLib.fmap(s.jskauth.getIdentities("auth"), function(identity) {
		if (identity.can_publish && identity.user) {
			var extraElement = (identity.type == "yahoo") ? JSKitLib.html('<div class="js-commentYahooShareLabelLogo"></div>') : undefined;
			appendSharingControl(identity.type, extraElement);
		}
	});
}

JSCC.prototype.wrapJSKAuth = function() {
	var s = this;
	var tc = s.TC;
	var appendAuthSelector = !tc["js-kit-lcf-userInfoWrapper"];

	if (s.config.nolc) return; 
	if (!tc['js-AuthAreaWrap']) {
		var items = ['js-commentOpenID', 'js-commentInputOpenID', 'js-CmtOpenID', 'js-OpenIDError'];
		JSKitLib.fmap(items, function(item) {
			if (tc[item]) tc[item].parentNode.removeChild(tc[item]);
		});
		if (appendAuthSelector) return;
	}

	var authAreaTmpl =
	'<div>' +
		'<div class="js-commentFieldLabel">{Label:leaveCommentAs}</div>' +
		'<div class="js-authSelector">' + 
		'</div>' +
		'<span class="js-logoutSpan">[<a class="js-commentOpenIDLogout">{Label:logout}</a>]</span>' +
		'<div class="js-authArea"></div>' +
	'</div>';

	if (tc['js-commentInputOpenID']) JSKitLib.hide(tc['js-commentInputOpenID']);

	if (appendAuthSelector) {
		var authAreaContainer = JSKitLib.html(s.gtmpl(authAreaTmpl));
		tc['js-AuthAreaWrap'].appendChild(authAreaContainer);
		JSKitLib.mapClass2Object(tc, authAreaContainer);
	}
}

JSCC.prototype.initAvatarsManager = function(size) {
	var s = this;
	var so = s.serverOptions;
	if (s.avatarsManager) s.avatarsManager.deActivateEvents();
	var identities = JSKitLib.foldl({}, s.jskauth.identities.auth, function(identity, acc) {
		if (identity.group != "third_party") return;
		acc[identity.type] = {
			"title": s.jskauth.getIdentityLabel(identity.type, true),
			"action": identity.user ? null : function() {
				s.jskauth.show(identity.type);
			},
			"authenticated": !!identity.user
		};
	});
	var avatars = so.avatars || [];
	var addEPBAvatar = function(identity) {
		if (JSKitEPB.isExists() && identity) {
			var type = 'http://' + s.config.domain;
			var index = -1;
			JSKitLib.fmap(avatars, function(av, i) {
				if (av.type == type) {
					index = i;
				}
			});
			var avatar = JSKitEPB.getValue('Avatar');
			if (avatar) {
				if (index < 0) {
					JSKitLib.fmap(avatars, function(av) { delete av.chosen; });
					avatars.push({name: avatar, width: 64, height: 64, type: type, params: identity.params, chosen: true});
				} else {
					avatars[index].name = avatar;
				}
			} else if (index >= 0) {
				avatars.splice(index, 1);
			}
		}
	}
	addEPBAvatar(s.jskauth.getAuthIdentity('epb'));

	var config = {
		"id": "comments-" + s.jcaIndex,
		"ref": JSKitLib.getRef(s),
		"size": size,
		"yours": !s.config.nolc,
		"layer": s.getSkin() == "smoothgray" ? this.target : undefined,
		"target": this.target,
		"labels": $JCL,
		"avatars": avatars,
		"autoSave": false,
		"controls": [s.TC["js-Cmtsubmit"]],
		"uriAvatar": s.uriAvatar,
		"identities": identities,
		"gravatarEmail": so.gravatarEmail
	};
	return new JSKAvatars(config);
}

JSCC.prototype.setFormFields = function(fields) {
	var s = this;
	var tc = s.TC;
	var emptyLabels = {
		'Url': $JCL('urlIsOptional'),
		'Email': $JCL('emailIsOptional')
	}

	JSKitLib.fmap(fields, function(v, name) {
		var o = tc['js-Cmt'+name];
		if(o) {
			o.jsk$setdfl = function(val) {
				o.style.color = '';
				o.jsk$setdfl = false;
				o.jsk$not_specified = false;
				o.value = val || '';
			}
			if (v) {
				o.jsk$setdfl(v);
			} else {
				o.style.color = '#808080';
				o.value = emptyLabels[name];
				o.jsk$not_specified = true;
			}
			o.onfocus = function() { if (o.jsk$setdfl) o.jsk$setdfl(); }
		}
	});
}

JSCC.prototype.getThreadHeader = function() {
	var s = this;
	var header;
	if (s.config.skin == 'echo') {
		var replacements = {
			"Title": s.config["thread-title"],
			"CountLabel": $JCL("commentsCountLabel", {"Count": s.serverOptions.pages.tc})
		};
		var template = s.dtHeaderEcho;
		JSKitLib.fmap(replacements, function(replacement, pattern) {
			template = template.replace(new RegExp("{" + pattern + "}", "g"), replacement);
		});
		header = JSKitLib.html(s.gtmpl(template));
		JSKitLib.mapClass2Object(s.TC, header);
		if (s.TC["jsk-HeaderInfoBoxImg"]) JSKitLib.addPNG(s.TC["jsk-HeaderInfoBoxImg"], "//cdn.js-kit.com/images/echo.png");
		s.renderPauseIndicator();
		s.renderPauseCounter();
	} else {
		header = s.div();
	}
	return header;
}

JSCC.prototype.assembleImagesUploadForm = function(uInp, imgArea) {
	var s = this;
	var tc = s.TC;
	s.imgArea = imgArea;
	var handler = function(e){
		e = e || window.event;
		if(e.keyCode == 27 || e.which == 27) JSKitLib.preventDefaultEvent(e);
	};
	if (uInp && !uInp.ifri){
		var frmi = s.cr('form');
		JSKitLib.setStyle(frmi, "clear: both;");
		JSKitLib.addClass(frmi, "js-uploadImageForm");
		frmi.method = 'post';
		frmi.acceptCharset = 'UTF-8';
		frmi.encoding = 'multipart/form-data';
		frmi.style.margin = "0px";
		var lbli = s.cr('div');
		JSKitLib.addClass(lbli, "js-uploadImageInputLabel");
		s.lbliChange = function(mode) {
			JSKitLib.removeChildren(lbli);
			lbli.appendChild(JSKitLib.html("<span>" + $JCL(mode ? "loading" : "uploadImage") + "</span>"));
		}
		s.lbliChange(0);

		params = JSKitEPB.getAsHash({ref: JSKitLib.getRef(s)});
		JSKitLib.fmap(params, function(v, k) {
			var item = s.cr('input');
			item.type = 'hidden';
			item.name = k;
			item.value = encodeURIComponent(v);
			frmi.appendChild(item);
		});

		var upfi = s.cr('input');
		s.imgUpload = upfi; 
		upfi.disabled = ( s.imgArea && s.imgArea.disableUpload ) ? true : false ;
		upfi.type = 'file';
		upfi.name = 'image';
		var formitems = JSKitLib.mapClass2Object({}, frmi);
		var val;
		var fi = function() {
			if(val) {
				var subi = s.TC["js-Cmtsubmit"];
				subi.disabled = false;
				upfi.disabled = false;
				frmi.reset();
				JSKitLib.fmap(params, function(v, k) {
					formitems[k].value = encodeURIComponent(v);
				});
				JSKitLib.removeEventHandler(document, ["keydown"], handler);
				s.getImages(val);
				val = undefined;
			}
		}
		var tgti = 'js-ifrm-'+s.jcaIndex + Math.random();
		var ifri = JSKitLib.createHiddenIframe(tgti, uInp, fi, false);
		frmi.target = tgti;
		upfi.onchange = function() {
			val = (new Date()).getUTCMilliseconds() + "-" + Math.random( );
			frmi.action = s.uriImage+'add?rnd='+val;
			s.lbliChange(1);
			frmi.submit();
			var subi = s.TC["js-Cmtsubmit"];
			subi.disabled = true;
			upfi.disabled = true;
			JSKitLib.addEventHandler(document, ["keydown"], handler);
		};
		uInp.appendChild(lbli)
		frmi.appendChild(upfi);
		uInp.appendChild(frmi);
		uInp.ifri = ifri;
	}
	s.preventAnonymousComments();
}

JSCC.prototype.assembleEchoBrand = function() {
	var template =
	'<div class="js-poweredBy">' +
	    '<div class="js-poweredBy-wrapper">' +
	        '<a href="http://aboutecho.com/about_echo1.html">' +
	            '<div class="js-poweredBy-text">Social Networking by Echo</div>' +
	            '<div class="js-kit-clear"></div>' +
	        '</a>' +
	    '</div>' +
	    '<div class="js-kit-clear"></div>' +
	'</div>';
	return JSKitLib.toDOM(template, "js-poweredBy-", {}).content;
}

JSCC.prototype.isSourceAvailable = function(source) {
	var filter = this.sourceFilter;
	if (!filter || !this.useEcho()) return true;
	source = filter.normalize(source);
	var sourceInList = filter.sources.hash.hasOwnProperty(source);
	return sourceInList ? filter.sources.hash[source] : filter.type == "exclude";
}

JSCC.prototype.avatarsManagerWrapper = function(element) {
	this.avatarsManager.assembleAvatarArea(element);
}

JSCC.prototype.dataLoader = function(so, nc) {
	var s = this;
	var so = s.serverOptions;
	var tc = s.TC;
	var d = function(){return s.div.apply(s,arguments);}
	
	if (this.config.disabled != 'no') return;

	var cc = JSKitLib.html(s.gtmpl(s.utmpl['js-CreateComment'] || (s.config.nolc ? s.dtProfileCreate : s.dtCreate)));
	JSKitLib.mapClass2Object(tc, cc);
	JSKitLib.attachDescriptors2Elements(tc, "js-kit-lcf-", this);
	if (JSKitEPB.isExists()) {
		JSKitLib.fmap(['Name', 'Email'], function(field) {
			if (tc['js-Cmt' + field]) {
				tc['js-Cmt' + field].disabled = true;
			}
		});
	}
	var ec = JSKitLib.html(s.gtmpl(s.dtEditComment));
	JSKitLib.mapClass2Object(tc, ec);
	if(s.config.profileLC) {
		var cin = tc['js-commentInputName'];
		if(cin) cin.style.display = 'none';
		var cie = tc['js-commentInputEmail'];
		if(cie) cie.style.display = 'none';
	}
	if(so.extraFieldURL) {
		var ciu = tc['js-commentInputUrl'];
		if (ciu) ciu.style.display = 'block';
	}
	var ac = function(name, cb) {
		var o = tc['js-'+name];
		if(!o) return;
		if(o.tagName == 'A') o.href="javascript:void(0);";
		o.style.cursor = 'pointer';
		o.onselectstart = function() { return false; }
		o.onclick = cb;
	}

	var uInp = tc['js-uploadImageInput'];
	var uInpW = tc['js-uploadImageInputWrapper1'];
	
	s.clearImgs = function(){
		JSKitLib.removeChildren(s.imgArea);
		if(uInpW) uInpW.style.paddingTop = '0px';
		if(uInp && uInp.ifri) {
			JSKitLib.removeChildren(uInp);
			JSKitLib.hide(uInp);
			uInp.ifri = undefined;
		}
		if(s.images) delete(s.images);
	}

	JSKitLib.fmap(['', 'Edit'], function(el, i) {
		ac('Cmtsubmit' + el, function() {
			s.pause.forced = false;
			s.CommentSubmitted();
			return false;
		});
		ac('Cmtcancel' + el, function() {
			s.clearImgs();
			if(s.onCancel) s.onCancel();
			s.CommentCancelled();
			if (s.useReplyThreadsCollapsing() && s.replyForId) {
				var pageNo = s.curPage;
				var comment = s.objById[s.replyForId];
				delete s.replyForId;
				if (comment) s.markCollapsedReplies(comment);
				s.pause.forced = false;
				s.curPage = 0;
				s.displayPage(pageNo);
			}
			return false;
		});
	});
	if (JSKitLib.isIE()) {
		var op = tc['js-commentOptions'];
		var sub = tc['js-commentSubmit'];
		if (op) op.style.paddingLeft = "3px";
		if (sub) sub.style.paddingLeft = "3px";
	}

	s.anonymousCmt = so.anonymousCmt;

	if (tc["js-commentAvatar"]) s.avatarsManager.assembleAvatarArea(tc["js-commentAvatar"]);

	if (s.getSkin() != 'echo') {
		s.setFormFields({'Email': '', 'Url': ''});
		s.wrapJSKAuth();
	}
	s.preventAnonymousComments();

	ac('commentOpenIDLogout', function() {
		setTimeout(function(){
			var gfc = s.jskauth.getAuthIdentity("gfc");
			if(gfc && gfc.params.site && gfc.user) {
				new JSKitGFC(
					JSKitLib.getRef(s),
					s.target,
					gfc.params.site,
					function(){
						this.processLogout();
					});
			}
			s.server(s.uriDomain + '/api/session/logout.js', {});
		}, 0);
		return false;
	});
	if(!tc['js-commentMore']) { 
		var m = tc['js-CCMore']; 
		if(m) m.style.display = 'none'; 
	} 

	s.onAddImgButton = function(isShow) {
		if(s.commentPostingProcess) {
			alert($JCL('messagePostingInProgress'));
			return;
		}
		if(s.config.uploadImages) {
			s.imgArea = tc['js-commentImageArea'];
			if(uInp && s.imgArea) {
				uInp.style.display = isShow ? 'block' : 'none';
				if(uInpW) uInpW.style.paddingTop = isShow ? '15px' : '0px';
				s.imgShow = isShow;
			}
		}
		s.assembleImagesUploadForm(uInp, s.imgArea);
	};

	var uImg = tc['js-uploadImageButton'];
	if (uInp) JSKitLib.hide(uInp);
	if(uInp && uImg && !s.config.uploadImages) {
		JSKitLib.hide(uImg);
		JSKitLib.hide(uInp);
	}
	ac('uploadImageButton', function(){
		s.onAddImgButton(!JSKitLib.visible(uInp));
	});

	var toggleAvatarArea = function(isVisible) {
		JSKitLib.fmap(["Avatar", "AvatarLabel"], function(key) {
			var element = tc["js-comment" + key];
			if (!element) return;
			JSKitLib[isVisible ? "show" : "hide"](element);
		});
	};
	if (s.getSkin() == "") {
		toggleAvatarArea(false);
	}
	var onCommentMore = function(obj, label) {
		obj.ashown = !obj.ashown;
		JSKitLib.text(obj.ashown ? label.less : label.more, obj, true);
		s.onAddImgButton(obj.ashown);	
		toggleAvatarArea(obj.ashown);
		return false;
	};

	ac('commentAddAvatar', function() {
		var label = {'less': '-', 'more': '+'};
		return onCommentMore(this, label);
	});
	ac('commentMore', function() {
		var label = {'less': this.getAttribute("less") || $JCL('less'),
			'more': this.getAttribute("more") || $JCL('more') };
		return onCommentMore(this, label);
	});

	if (!tc["js-commentAvatar"] && (!s.config.uploadImages || tc['js-uploadImageButton'] || !tc['js-uploadImageInput'])) {
		JSKitLib.fmap(['js-commentMore', 'js-CCMore'], function(element) { if (tc[element]) JSKitLib.hide(tc[element]); });
	}

	if(so.mmode == "pause" || !s.isSourceAvailable("Comments")) {
		var lca = null;
	} else {
		var lca = d('js-commentControl', s.a(s.JCL('leaveComment')));
		lca.onclick = function() { return s.ShowCommentDialog(); };
	}

	var jmg = d('js-commentControl js-commentTool', JSKitLib.html('<font face="Webdings">&#64;</font>&nbsp;'), s.a($JCL("controls")));
	jmg.onclick = function() {
		var srt = ["date", "name"];
		if(!s.config.moderate && s.scoringEnabled()) srt.push("karma");
		if(s.adminMode) srt.push("status");
		/* s.submitRating check is not good for all the cases */
		if ( $JSKitGlobal.isRatingsAppAvailable() ) srt.push("rating");
		var srtOpts = [];
		for(var i = 0; i < srt.length; i++) {
			srtOpts.push('<option value="'+srt[i] + '"'
				+ (srt[i]==s.config.sort?" selected":"")+'>'
				+$JCL(srt[i])+'</option>');
		}
		var bkw = ["ascending", "descending"];
		var bkwOpts = [];
		for(var i = 0; i < bkw.length; i++) {
			bkwOpts.push('<option value="'+bkw[i]+'"'
				+ ((!!i) == (s.config.backwards=='yes')?" selected":"")+'>'
				+$JCL(bkw[i])+'</option>');
		}
		var prs = ["on (threaded)", "off (flat)"];
		var prsMap = {'on (threaded)':'yes','off (flat)':'no'}
		var prsOpts = [];
		for(var i = 0; i < prs.length; i++) {
			prsOpts.push('<option value="'+prsMap[prs[i]]+'"'
				+ (prsMap[prs[i]] == s.config.thread?" selected":"")+'>'
				+$JCL(prs[i])+'</option>');
		}
		var div = s.cr("div");
		div.innerHTML = 
			"<table border=0 cellpadding=4>"
			+ "<tr><td align=right>" + $JCL("sortBy") + '</td><td align=left><select name="jss-srt" onchange="$JCA['+s.jcaIndex+'].viewControl(this);return true;">'
			+ srtOpts.join("")
			+ "</select></td></tr>"
			+ "<tr><td align=right>" + $JCL("order") + '</td><td align=left><select name="jss-rev" onchange="$JCA['+s.jcaIndex+'].viewControl(this);return true;">'
			+ bkwOpts.join("")
			+ "</select></td></tr>"
			+ "<tr><td align=right>" + $JCL("threading") + '</td><td align=left><select name="jss-prs" onchange="$JCA['+s.jcaIndex+'].viewControl(this);return true;">'
			+ prsOpts.join("")
			+ "</select></td></tr>"
			+ "<tr><td align=right>" + $JCL("search") + '</td><td id="js-SearchCell-'+s.jcaIndex+'" align=left></td></tr>'
			+ (s.adminMode && !s.config.moderate?('<tr><td align=center colspan=2><a href="'+s.uriDomain+'/moderate/'+s.config.domain+'" onclick="window.location.href = this.href; return true;">Moderate whole site</a></td></tr>'):'')
			+ "</table>"
		this.notShowIfr = true;
		s.settingsWindow('ctWnd', this, div);
                var obj={'mode': 'form', 'inpSize': '121px', type: 'Search'};
                var form = new JSIPE(obj);
                obj.jsk$on_submit_exit = function(){
                        s.searchString = form.input.value;
                        s.viewControl({name: "search"});
			s.hideSettingsWindow('ctWnd');
                }
		form.input.value = s.searchString || "";
		if (s.searchString) form.cleaner.style.visibility = "visible";
		var sCell = document.getElementById("js-SearchCell-"+s.jcaIndex);
		if (sCell) s.addChild(sCell, form.main);

		return false;
	}
	s.controls = jmg;
	if(nc || s.config.moderate) {
		s.controls.reveal = function(){};
	} else {
		s.controls.style.display = 'none';
		s.controls.reveal = function(){s.controls.style.display=''}
	}

	var pb;
	if(so.subs || so.noJunk || so.whitelabel) {
		pb = "";
	} else {
		if (s.getSkin() != "echo") {
			var propLink = JSKitLib.html('<a href="http://js-kit.com/comments?wow" target="js-kit">Powered by JS-Kit</a>');
			var prop = d('', "(", propLink, ")");
			prop.style.position = 'relative';
			pb = d("js-commentControl js-poweredBy", prop);
		}
	}

	var ca = d("js-CommentsArea",
		(s.config.nolc && !s.IM)?null:d("js-LeaveComment", s.config.moderate || s.IM=='own' ?null:lca, s.IM ? null : jmg, !s.config.nolc ? pb : null,
			JSKitLib.html('<br clear="all"/>')),
		tc["js-CreateComment"], tc["js-EditComment"]);
	this.makeWelcomePanel();

	if (!so.wysiwyg && so.smiley) {
		JSKitLib.fmap(['Text', 'TextEdit'], function(v) {
			var sd = s.cr('div');
			sd.style.margin = '3px 0px 0px 3px';
			var text = tc['js-Cmt' + v];
			var processed = {};
			var index = 0;
			JSKitLib.fmap(s.smiles, function(el, i) {
				if (!processed[el.file]) {
					processed[el.file] = 1;
					var smile = JSKitLib.html(s.smileTag(el));
					smile.style.display = 'inline';
					smile.style.cursor = 'pointer';
					smile.style.marginRight = '5px';
					smile.onclick = function() {
						if (s.getSkin() == "echo" && JHI2.isEmpty(text)) {
							JHI2.set(text, i);
						} else text.value += ' ' + i;
						text.focus();
						if (JSKitLib.isSafari()) {
							text.setSelectionRange(text.value.length, text.value.length);
						}
					};
					sd.appendChild(smile);
				}
			});
			var element = (s.getSkin() == "echo") ? s.TC[v == "Text" ? "jsk-CommentFormBody" : "jsk-CommentEditFormBody"] : text; 
			element.parentNode.insertBefore(sd, element.nextSibling);
		});
	}

	var pageNavTop = s.config.skin == 'echo' ? null : d('js-PageNavTop');
	var pageNavBottom = d('js-PageNavBottom');
	var header = s.getThreadHeader();
	var thread = d("jsk-ThreadWrapper jsk-PrimaryFont jsk-PrimaryBackgroundColor", pageNavTop, d("js-OldCommentsWrap jsk-StreamWrapper", d("js-OldComments")), pageNavBottom);
	s.TC["jsk-ThreadWrapper"] = thread;
	if(s.config.backwards == 'yes') {
		s.addChild(ca, header);
		s.addChild(ca, thread);
	} else {
		s.addChild(ca, thread, true);
		s.addChild(ca, header, true);
	}
	if (s.getSkin() == "echo" && !so.whitelabel) s.addChild(thread, s.assembleEchoBrand());
	if(s.useEcho()) {
		JSKitLib.setMouseEvent(thread, "over", function() { s.setStreamState(true); });
		JSKitLib.setMouseEvent(thread, "out", function() { s.setStreamState(false); });
	}
	var pageToDisplay = so.pages.sp;
	var dpCB;
	if(s.comment_location) {
		var obj = s.jspg.getItemById(s.comment_location);
		if(obj) {
			pageToDisplay = s.jspg.getPageByItemId(s.comment_location) + 1;
			dpCB = function() {
				if(obj.div) s.flash(obj.div);
			};
		}
		delete s.comment_location;
	}
	s.displayPage(pageToDisplay, dpCB);

	var closeControlsPopup = function() {
                s.hideSettingsWindow('ctWnd');
                s.hideSettingsWindow('ctBlock');
	}
	JSKW$Events.registerEventCallback(undefined, closeControlsPopup, "comments_closeControlsPopup");

	ca.onclick = function() {
		closeControlsPopup();
		JSKW$Events.syncBroadcast("miniProfile_collapseAll");
	}
	s.addChild(s.target, ca);
	if (lca && !s.config.moderate && (s.config.nolc && s.IM == 'foreign' || (so.expandLeaveCmt && !s.config.noautoexpand)) && !s.config.userProfileComments) {
		s.ShowCommentDialog(undefined, {nofocus: true});
	}
}

JSCC.prototype.objRerender = function(obj, cmt) {
	cmt.ctls['js-singleCommentText'].innerHTML =
		this.tmpl("{Text}", obj, true);
}

JSCC.prototype.getLastReply = function(pobjId) {
	var pobj = this.jspg.getItemById(pobjId);
	var lreplyObj = null;
	for(var i=pobj.obj.thread.length-1; i>=0; i--){
		if(pobj.obj.thread[i].status!='D') {
			var c = this.jspg.getItemById(pobj.obj.thread[i].ID);
			if(c) {
				lreplyObj = this.getLastReply(c.obj.ID);
				break;
			}
		}
	}
	return lreplyObj || pobj;
}

JSCC.prototype.reCalcPages = function() {
	if(this.curPage>this.jspg.pageCount) this.displayPage(this.jspg.pageCount);
	this.rePageNavigator(this.jspg.pageCount>0 ? this.jspg.pageCount-1 : undefined);
}

JSCC.prototype.appendConversation = function (cmt, conversation) {
	var cnvsObj = {};
	var cnvs = this.conversations[conversation];
	if(!cnvs) return;
	JSKitLib.fmap(["Name","avatar","avatarHeight","avatarWidth"],
		function(V){ cnvsObj[V] = cnvs.direction=="in" ? cnvs[V] : cnvs["dest"+V] });
	cnvsObj.Label = "Conversation with ";
	var dtc = JSKitLib.html(this.tmpl(this.dtConversation, cnvsObj));
	var ctls = JSKitLib.mapClass2Object({}, dtc);
	var nm = ctls['js-ConversationName'];
	if(nm && this.serverOptions.showProfile) {
		nm.style.textDecoration = 'underline';
		this.appendProfileHandler(nm, {profile: cnvs.profile});
	}
	cmt.insertBefore(dtc, cmt.firstChild);
	JSKitLib.addClass(cmt, "js-singleCommentConversationHead");
}

JSCC.prototype.removeConversation = function (cmt) {
	JSKitLib.removeClass(cmt, "js-singleCommentConversationHead");
	cmt.removeChild(cmt.firstChild);
}

JSCC.prototype.appendConversationChild = function (cmt) {
	JSKitLib.addClass(cmt, "js-singleCommentConversationChild");
}

JSCC.prototype.removeConversationChild = function (cmt) {
	JSKitLib.removeClass(cmt, "js-singleCommentConversationChild");
}

JSCC.prototype.getSkin = function() {
	return this.config.skin==="wireframe" ? "" : (this.config.skin || "");
}

JSCC.prototype.generateEventParams = function(extra_params) {
	extra_params = extra_params || {};
	var s = this;
	var params = {
		jcaIndex: s.jcaIndex,
		uniq: s.config.path.replace(/^\//, ''),
		domain: s.config.domain
	};
	JSKitLib.fmap(extra_params, function(v, k) {
		params[k] = v;
	});
	return params;
}

JSCC.prototype.publishEvent = function(event_name, params) {
	JSKitAPI.publish(event_name,
		this.generateEventParams(params));
}

JSCC.prototype.eventsHandler = function(eventName, eventParams) {
	var self = this;
	var so = self.serverOptions;
	eventParams = eventParams || {};
	switch (eventName) {
	case "comment-deleting":
		var item = self.jspg.getItemById(eventParams.cmtId);
		if(!item || !item.div) return;
		var div = item.div;
		if(div.domCtls) div.domCtls.style.visibility = "hidden";
		var av = div.ctls['js-singleCommentAvatar'];
		self.placeProcessAvatar(av);
		item.obj.origstatus = item.obj.status;
		item.obj.status = 'DP';
		item.obj.dTimer = setTimeout(function(){
			item.obj.status = 'A';
			if(div.domCtls) div.domCtls.style.visibility = "";
			if(av) self.placeAvatar(item.obj, av);
			delete item.obj.dTimer;
		}, 30000);
		break;

	case "comment-deleted":
		var item = self.jspg.getItemById(eventParams.cmtId);
		if(!item || !item.div) return;
		var div = item.div;
		if(item.obj.dTimer) clearTimeout(item.obj.dTimer);
		if(item.obj.ParentID) {
			var parentCmt = self.objById[item.obj.ParentID];
			if (parentCmt) {
				parentCmt.thread = JSKitLib.filter(function(obj) {
					return obj.ID != eventParams.cmtId;
				}, parentCmt.thread);
			}
			self.markCollapsedReplies(self.objById[eventParams.cmtId]);
		} else {
			if (self.useReplyThreadsCollapsing()) {
				self.removeRepliesExpandMarker(item.obj);
			}
		}
		so.pages.tc -= self.removeComment(div, true);
		self.publishEvent("comments-count-updated", {'count': so.pages.tc});
		break;

	case "comment-added":
		so.pages.tc++;
		self.publishEvent("comments-count-updated", {'count': so.pages.tc});
		break;

	case "comments-data-loaded":
		self.publishEvent("comments-count-updated", {'count': so.pages.tc});
		break;

	case "comments-count-updated":
		self.refreshThreadHeader();
		if(self.popupInstance) {
			var title = self.replaceCountTemplate(self.config['popup-title'],
				eventParams.count);
			self.popupInstance.updateTitle(title);
		}
		if(self.parentWidget && self.parentWidget.popupLink) {
			self.drawCommentLink.call(self.parentWidget, eventParams.count);
		}
		break;
	case "user-login":
		if (self.config['display-mode'] == "inline") {
			var nofocus = typeof(eventParams.nofocus) == "undefined"
								|| eventParams.nofocus;
			self.refreshComments({"nofocus": nofocus});
		}
		break;
	case "user-logout":
		if (self.config['display-mode'] == "inline") {
			var nofocus = typeof(eventParams.nofocus) == "undefined"
								|| eventParams.nofocus;
			JSKW$Events.invalidateContext(self.miniProfileCtx);
			setTimeout(function(){
				self.refreshComments({"nofocus": nofocus});
			}, 0);
		}
		break;
	}
}

JSCC.prototype.refreshThreadHeader = function() {
	var hdr = this.TC['jsk-HeaderWrapper'];
	if(hdr && hdr.parentNode) {
		hdr.parentNode.replaceChild(this.getThreadHeader(), hdr);
		this.addAdminMenu(this.TC['jsk-MenuAdmin']);
	}
}

JSCC.prototype.makeWelcomePanel = function() {
	var s = this;
	if (s.jcaIndex) return;
	if (!s.adminMode) {
		s.deleteWelcomePanel();
		return;
	}
	if (s.TC['js-WelcomePanel'] || s.config.moderate || s.config.nolc) return;

	var wp_html = ''
	+ '<div class="js-WelcomePanel' + (s.config.backwards == 'yes'? '' : ' js-WelcomePanelBottom') + '"' + (s.serverOptions.welcome ? '' : ' style="display: none"') + '>'
		+ '<div class="js-WelcomePanelTitle"><div class="js-WelcomePanelClose"></div>{Label:adminNote}</div>'
		+ '<div class="js-WelcomePanelContent">'
			+ '<div class="js-WelcomePanelHeader"><div class="js-WelcomeImgInfo"></div>{Label:Welcome}</div>'
			+ ((s.serverOptions.welcome || {}).message || $JCL('welcomeToComments'))
			+ '<div>'
			+ '<div class="js-WelcomePanelContentBlock" style="padding-right: 50px">'
				+ '<b>{Label:getStarted}:</b>'
				+ '<table border="0" cellspacing="0" cellpadding="0">'
				+ '<tr style="display: none"><td><div class="js-WelcomeImgProfile"><a href="javascript:void(0);" class="js-WelcomeProfileLink">{Label:editProfile}</a></div></td></tr>'
				+ '<tr><td><div class="js-WelcomeImgHelp"><a href="http://wiki.js-kit.com/Frequently-Asked-Questions">{Label:readFAQ}</a></div></td></tr>'
				+ '<tr><td><div class="js-WelcomeImgCustom"><a href="http://wiki.js-kit.com/Skinning-Guide">{Label:customizeLook}</a></div></td></tr>'
				+ '<tr><td><div class="js-WelcomeImgDashboard"><a href="' + s.uriDomain + '/settings/">{Label:adminDashboard}</a></td></div></tr>'
				+ '</table>'
			+ '</div>'
			+ '<div class="js-WelcomePanelContentBlock">'
				+ '<b>{Label:getInvolved}:</b>'
				+ '<table border="0" cellspacing="0" cellpadding="0">'
				+ '<tr><td><div class="js-WelcomeImgTwitter"><a href="http://twitter.com/echoenabled">{Label:followTwitter}</a></div></td></tr>'
				+ '<tr><td><div class="js-WelcomeImgSupport"><a href="http://js-kit.com/support">{Label:contactSupport}</a></div></td></tr>'
				+ '<tr><td><div class="js-WelcomeImgWidgets"><a href="http://blog.js-kit.com">{Label:readOurBlog}</a></div></td></tr>'
				+ '</table>'
			+ '</div>'
			+ '<br style="clear: both" />'
			+ '</div>'
		+ '</div>'
		+ '<div class="js-WelcomePanelArrow"></div>'
	+ '</div>';
	var wp = JSKitLib.html(s.gtmpl(wp_html));
	JSKitLib.mapClass2Object(s.TC, wp);
	s.TC['js-WelcomePanelClose'].onclick = function() {
		s.TC['js-WelcomePanel'].style.display = 'none';
		if (s.serverOptions.welcome && s.serverOptions.welcome.ts) {
			s.server('s-welcome-close', {'ts': 
					s.serverOptions.welcome.ts});
		}
	}
	s.appendProfileHandler(s.TC['js-WelcomeProfileLink'], {profile: s.serverOptions.profile});
	JSKitLib.addPNG(s.TC['js-WelcomePanelArrow'], s.uriDomain + "/images/welcome/triangle.png");
	var lc = s.TC['js-LeaveComment'];
	if (lc) lc.parentNode.insertBefore(wp, lc);
}

JSCC.prototype.deleteWelcomePanel = function() {
	if (this.TC['js-WelcomePanel']) {
		this.TC['js-WelcomePanel'].parentNode.removeChild(this.TC['js-WelcomePanel']);
		delete this.TC['js-WelcomePanel'];
	}
}

JSCC.prototype.addMenu = function(cmt, obj) {
	var self = this;
	var showOffensive = this.serverOptions.commod && !obj.yours && !this.config.nolc && (!obj.msgtype || !obj.msgtype.match(/T|P/) || this.serverOptions.trackbackreply);
	var showProfile = obj.profile && self.serverOptions.showProfile && !(obj.msgtype && obj.msgtype.match(/T|P/)) && !this.config.nolc;
	var cmtURL = ((obj.permalink || this.config.permalink).replace(/#jsid-*/, "") + "#") + obj.ID;
	var data = [
		{title: $JCL("showUserProfile"), action: function() {self.showProfile(cmt.firstChild, obj);}, hidden: !showProfile, icon: this.uriDomain + "/images/menu/show-user-profile.png"},
		{title: $JCL("markAsOffensive"), icon: this.uriDomain + "/images/menu/mark-comment-as-offensive.png", action: function(){self.markOffensive(obj.ID)}, hidden: !showOffensive},
		{title: $JCL("getPermalinkURL"), icon: this.uriDomain + "/images/menu/comment-permalink.png", inputValue: cmtURL, type: "DTI"}
	];
	if (!this.serverOptions.whitelabel) {
		data.push({type: "Delimeter"});
		data.push({title: $JCL("getWidgetLikeThis"), action: function() { window.open("http://js-kit.com/comments?menu", "_blank");}, statusText: "http://js-kit.com/comments?menu"});
	}
	var mtgt = this.config.nolc ? self.target.parentNode.parentNode : undefined;
	return JSMenu($JCL("options"), data);
}

JSCC.prototype.addAdminMenu = function(container) {
	if (!container) return;
	var s = this;
	var so = s.serverOptions;
	var isEPB = JSKitEPB.isExists();
	var isLogged = s.jskauth.isLogged();
	var isCmtAvailable = s.isSourceAvailable("Comments");
	var showProfile = function() {
		s.showProfile(container, {"profile": so.profile}, {"activeSection": "editProfile"});
	};
	var mkItem = function(label, icon, action, guard, extra) {
		return guard ? JSKitLib.foldl({
			"icon": icon ? '//cdn.js-kit.com/images/menu/' + icon : undefined,
			"title": $JCL("menu" + label),
			"action": action
		}, extra || {}, function(value, acc, key) { acc[key] = value; }) : [];
	};
	var mkLink = function(label, icon, url, guard, disabled) {
		return mkItem(label, icon, function() { window.open(url, '_blank'); }, guard, {
			"disabled": disabled,
			"statusText": url
		});
	};
	var mkDelimeter = function(guard) {
		return guard ? {"type": "Delimeter"} : []; 
	};
	var items = JSKitLib.merge(
		mkItem("Logout", "key.png", function() { s.jskauth.logout(); },
			!isEPB && isLogged && isCmtAvailable),
		mkItem("Login", "key.png", function() { s.jskauth.show(); },
			!isEPB && !isLogged && isCmtAvailable),
		mkItem("EditProfile", "user-edit.png", function() { showProfile(); },
			so.showProfile && isCmtAvailable && !so.isNullSession),
		mkItem("Follow", "follow.png", function() { s.openFollowPopup(); },
			!isEPB && isCmtAvailable, {"disabled" : so.anonymousCmt && !isLogged}),
		mkDelimeter(isCmtAvailable),
		mkLink("Moderation", "comment-edit.png", s.uriDomain + "/moderate/",
			isCmtAvailable, !so.adminMode),
		mkLink("Settings", "wrench.png", s.uriDomain + "/settings/",
			isCmtAvailable, !so.adminMode),
		mkLink("AdminNotices", null, "http://blog.js-kit.com/tag/admin/",
			isCmtAvailable, !so.adminMode),
		mkDelimeter(isCmtAvailable && !so.whitelabel),
		mkLink("GetThis", "script-code.png", s.uriDomain + "/comments?menu",
			!so.whitelabel),
		mkLink("JSKBlog", "newspaper.png", "http://blog.js-kit.com/",
			!so.whitelabel),
		mkLink("JSKTwitter", "twitter-favicon.png", "http://twitter.com/echoenabled",
			!so.whitelabel),
		mkLink("Help", "information.png", s.uriDomain + '/support/',
			!so.whitelabel)
	);
	if (!items.length) {
		JSKitLib.removeChildren(container);
		return;
	}
	JSKitLib.replaceChildren(container, JSMenu($JCL("menuAdmin"), items, "", s.target));
}

JSCC.prototype.getSelectedIdentities = function() {
	var self = this;
	var format = function(type, prefix, filter) {
		return JSKitLib.fmap(self.jskauth.getIdentities(type), function(identity) {
			if (!filter || filter(identity)) {
				var flag = identity.use_as_from ? "checked" : "unchecked";
				return [prefix + identity.type, identity.url || '', flag, false];
			}
		});
	}
	var identities = JSKitLib.merge(
		format("auth", "login-", function(identity) { return !!identity.user; }),
		format("web", ""));
	return JSKitLib.Object2JSON(identities);
}

JSCC.prototype.constructFromToButtons = function(type) {
	var template = 
		'<div class="jskit-GoogleLikeMenuBar">' +
			'<div class="jskit-GoogleLikeMenuBarExpandMarker"></div>' +
			'<div class="jskit-GoogleLikeMenuBarText">' + $JCL(type) + '</div>' +	
			'<div class="js-kit-clear"></div>' +
		'</div>';
	var descriptors = {
		"BarExpandMarker" : function(element){ JSKitLib.addPNG(element, "//cdn.js-kit.com/images/common/arrow-down-10x10.png") }
	};
	return JSKitLib.toDOM(template, "jskit-GoogleLikeMenu", descriptors).content;
}

JSCC.prototype.fromMenuAnonymous = function() {
	var self = this;
	var template =
	'<div class="js-kit-from-menuAnonymousWrap">' +
	    '<div class="js-kit-from-control"></div>' +
	    '<div class="js-kit-from-field"></div>' +
	    '<div class="js-kit-clear"></div>' +
	'</div>';
	var updateAnonymousURL = function(url) {
		if (typeof url == "object") url = url[1];
		self.extraFormFields["Url"] = url;
	};
	var identities = JSKitLib.fmap(self.jskauth.getIdentities("auth"), function(identity) {
		return {
			"icon": JSKAuth.prototype.getIdentityParam('favicon', identity, "//cdn.js-kit.com/images/favicons/" + identity.type + ".png"),
			"type": "Checkbox",
			"state": "disabled",
			"title": JSKAuth.prototype.getIdentityParam('long_label', identity, JSKAuth.prototype.getIdentityLabel(identity.type, true)),
			"action": function() { self.jskauth.show(identity.type); }
		};
	});
	var items = JSKitLib.merge(
		{"type": "HTML", "title": JSKitLib.html('<div class="js-kit-from-to-menu-title">' + $JCL("Iam") + '</div>')},
		identities,
		self.serverOptions.extraFieldURL ? [
			{
				"type": "HTML", 
				"title": JSKitLib.html('<div class="js-kit-from-to-menu-title">' + $JCL("myWebsites") + '</div>'),
				"hidden": self.serverOptions.anonymousCmt
			},
			{
				"type": "SRCheckbox",
				"icon": "//cdn.js-kit.com/images/favicons/default.png",
				"title": self.extraFormFields["Url"] || $JCL("myURL"),
				"oncreate": updateAnonymousURL,
				"onupdate": updateAnonymousURL,
				"deletable": false,
				"unclonable": true,
				"hideCheckbox": true,
				"hidden": self.serverOptions.anonymousCmt
			}
		] : [],
		{"type": "HTML", "title": JSKitLib.html('<div class="js-kit-from-to-menu-footer"></div>')}
	);
	var menu = JSMenu(self.constructFromToButtons("from"), items, "HTML");
	var descriptors = {
		"control": function() {
			return menu;
		},
		"field": function(element) {
			self.renderNameField(element, "js-kit-from-name");
			if (self.serverOptions.anonymousCmt) {
				JSKitLib.preventSelect(element);
				JSKitLib.addEventHandler(element, ['click'], function(e) {
					JSKitLib.stopEventPropagation(e);
					JSKW$Events.syncBroadcast('JSMenu-Opened', menu);
				});
			}
		}
	};
	return JSKitLib.toDOM(template, "js-kit-from-", descriptors).content;
}

JSCC.prototype.setNameFieldValue = function() {
	var input = this.TC["js-CmtName"];
	if (!input) return;
	JHI2.remove(input);
	input.value = (!JHI2.isEmpty(input) && input.value) || this.extraFormFields["Name"] || "";
	JHI2.create(this.serverOptions.requireUsername ? $JCL("yourNameRequired") : $JCL("yourNameHere"), input);
}

JSCC.prototype.renderNameField = function(container, className, readonly) {
	var element;
	var anonymousCondition = this.serverOptions.anonymousCmt && !this.jskauth.isLogged();
	if (readonly || anonymousCondition) {
		var text = this.extraFormFields["Name"] || ""; 
		if (anonymousCondition) {
			text = $JCL("loginRequiredNotice");
			JSKitLib.addClass(container, "js-kit-disabledNameField");
		}
		element = JSKitLib.html("<div class='jsk-PrimaryFont " + className + "'>" + text + "</div>");
	} else {
		element = JSKitLib.html("<input type='text' class='" + className + "' />");
		if(this.TC) this.TC["js-CmtName"] = element;
		JSKitLib.addEventHandler(container, ["click"], function(e) {
			JSKitLib.stopEventPropagation(e);
			element.focus();
		});
		element.title = $JCL("clickToEdit");
		this.setNameFieldValue();
	}
	JSKitLib.replaceChildren(container, element);
}

JSCC.prototype.fromMenuActionsHandler = function(identity, action, data) {
	var self = this;
	var rerenderUserInfo = function() {
		self.userInfoWrapper(self.TC["js-kit-lcf-userInfoWrapper"]);
	}
	var rerenderLinksIcon = function() {
		self.miniProfile.render("siteLinksIcons", {"identities": self.jskauth.getIdentities()});
	}
	switch (action) {
		case "delete": if (identity.group == "web") {
			self.jskauth.identityServerAction("unbind", identity, {}, rerenderLinksIcon);
			break;
		};
		case "delete":
			var loggedCount = JSKitLib.foldl(0, self.jskauth.getIdentities("auth"), function(identity, acc) {
				return acc += identity.user ? 1 : 0;
			});
			var firstConfirmed;
			if (
				(firstConfirmed = confirm($JCL("confirmMessage_unbindAccount"))) && loggedCount > 1
				|| firstConfirmed && loggedCount == 1 && confirm($JCL("confirmMessage_unbindLastAccount"))
			) {
				self.jskauth.identityServerAction("unbind", identity, {}, rerenderUserInfo);
			}
			break;
		case "create":
			self.jskauth.identityServerAction("bind", identity, {}, rerenderLinksIcon);
			break;
		case "update":
			self.jskauth.identityServerAction("update", identity, {url: data[1]}, rerenderLinksIcon);
			break;
		case "check":
			identity.use_as_from = true;
			rerenderLinksIcon();
			break;
		case "uncheck":
			identity.use_as_from = false;
			rerenderLinksIcon();
			break;
	}
}

JSCC.prototype.fromMenuLoggedIn = function() {
	var self = this;
	var identities = {"auth": {}, "web": {}};
	var applyCallbacks = function(item) {
		JSKitLib.fmap(["check", "uncheck", "delete", "update", "create"], function(action) {
			item["on" + action] = function(data) {
				if (!this.identity)
					this.identity = self.jskauth.assembleIdentity(data, "home", "web");
				self.fromMenuActionsHandler(this.identity, action, data);
			}
		});
		return item;
	}
	var validateURLs = function(url) {
		if(!url) {
			alert($JCL("urlIsEmpty"));
			return false;
		}
		for(var i = 0; i < this.parent.items.length; i++) {
			if(this.parent.items[i].title == url && this.parent.items[i] != this) {
				alert($JCL("urlAlreadyExists"));
				return false;
			}
		}
		return true;
	}
	identities.auth = JSKitLib.fmap(this.jskauth.getIdentities("auth"), function(identity) {
		var state;
		if (!identity.user) {
			state = "disabled";
		} else if (identity.use_as_from) {
			state = "checked";
		} else {
			state = "unchecked";
		}
		return applyCallbacks({
			"type": "Checkbox",
			"icon": JSKAuth.prototype.getIdentityParam('favicon', identity, "//cdn.js-kit.com/images/favicons/" + identity.type + ".png"),
			"state": state,
			"title": identity.url,
			"action": state == "disabled" ? function() { self.jskauth.show(identity.type); } : null,
			"identity": identity,
			"displayTitle": (function(){
				if(identity.user) {
					var Name;
					if(identity.group == "epb" && JSKitEPB.isExists())
						Name = JSKitEPB.getValue("Name");
					Name = Name || identity.name || identity.user;
					return Name + " @ " + JSKAuth.prototype.getIdentityParam('short_label', identity, JSKAuth.prototype.getIdentityLabel(identity.type));
				} else {
					return JSKAuth.prototype.getIdentityParam('long_label', identity, JSKAuth.prototype.getIdentityLabel(identity.type, true));
				}
			}()),
			"deletable": identity.user && identity.group != 'epb',
			"deleteLabel": $JCL("menuUnbindIdentity")
		});
	});
	identities.web = JSKitLib.fmap(this.jskauth.getIdentities("web"), function(identity) {
		return applyCallbacks({
			"type": "SRCheckbox",
			"icon": "//cdn.js-kit.com/images/favicons/default.png",
			"state": identity.use_as_from ? "checked" : "unchecked",
			"title": identity.url,
			"identity": identity,
			"alreadyEdited": true
		});
	});
	var items = JSKitLib.merge(
		{"type": "HTML", "title": JSKitLib.html('<div class="js-kit-from-to-menu-title">' + $JCL("Iam") + '</div>')},
		identities.auth,
		self.serverOptions.extraFieldURL ? JSKitLib.merge(
			{
				"type": "HTML", 
				"title": JSKitLib.html('<div class="js-kit-from-to-menu-title">' + $JCL("myWebsites") + '</div>')
			}, 
			identities.web,
			applyCallbacks({
				"type": "SRCheckbox",
				"icon": "//cdn.js-kit.com/images/favicons/default.png",
				"title": $JCL("myURL"),
				"hideCheckbox": true
			})
		) : [],
		{"type": "HTML", "title": JSKitLib.html('<div class="js-kit-from-to-menu-footer"></div>')}
	);
	return JSMenu($JCL("addAnotherSite"), items);
}

JSCC.prototype.toMenu = function() {
	var self = this;
	var share = function(identity, publish) {
		identity.publish = publish;
		self.extraFormFields["Share-" + identity.type] = publish ? "on" : "off";
	}
	var sharingServices = JSKitLib.fmap(this.jskauth.getIdentities("auth"), function(identity) {
		if (!identity.can_publish) return;
		self.extraFormFields["Share-" + identity.type] = "off";
		var sharing_available = identity.user && !identity.expired;
		return {
			"type": "Checkbox",
			"icon": "//cdn.js-kit.com/images/favicons/" + identity.type + ".png",
			"title": $JCL("shareWith_" + identity.type),
			"state": sharing_available ? (identity.publish || self.$temp_publish == identity.type ? "checked" : "unchecked") : "disabled",
			"action": sharing_available ? null : function() {
				self.$temp_publish = identity.type;
				self.jskauth.show(identity.type);
			},
			"oninit": function() {
				if (sharing_available && (identity.publish || self.$temp_publish == identity.type)) this.oncheck(this.title);
			},
			"oncheck": function(title) {
				var item = this;
				share(identity, true);
				item.dt = cnt.insertBefore(
					JSDogtag({
						"text": title,
						"icon": "//cdn.js-kit.com/images/favicons/" + identity.type + ".png",
						"onclose": function() {
							item.setState("unchecked");
							cnt.removeChild(item.dt);
							share(identity, false);
						}
					}),
				cnt.lastChild);
			},
			"onuncheck": function(title) {
				share(identity, false);
				if (this.dt) cnt.removeChild(this.dt);
			}
		};
	});
	var items = JSKitLib.merge(
		{"type": "HTML", "title": JSKitLib.html('<div class="js-kit-from-to-menu-title">' + $JCL("shareWith") + '</div>')},
		{
			"type": "Checkbox",
			"icon": "//cdn.js-kit.com/images/favicons/default.png",
			"title": $JCL("thisPage"),
			"state": "checked-disabled"
		},
		sharingServices,
		{"type": "HTML", "title": JSKitLib.html('<div class="js-kit-from-to-menu-footer"></div>')});

	var cnt = JSKitLib.cr({className: "js-kit-lcf-toField"});
	cnt.appendChild(new JSDogtag({"text": $JCL("thisPage"), "icon": "//cdn.js-kit.com/images/favicons/default.png"}, cnt));
	cnt.appendChild(JSKitLib.html('<div class="js-kit-clear"></div>'));
	var menu = JSMenu(self.constructFromToButtons("to"), items, "HTML");
	cnt.insertBefore(menu, cnt.firstChild);
	JSKitLib.addEventHandler(cnt, ['click'], function(e) {
		JSKitLib.stopEventPropagation(e);
		JSKW$Events.syncBroadcast('JSMenu-Opened', menu);
	});
	delete this.$temp_publish;
	return cnt;
}

JSCC.prototype.miniProfileWrapper = function(target) {
	var self = this;
	var so = this.serverOptions;
	var avatar = this.avatarsManager.getActiveAvatar() || this.avatarsManager.anonymousAvatarData();
	this.miniProfileCtx = JSKW$Events.registerEventCallback(undefined, function(name, newSites) {
		if (!self.serverOptions.extraFieldURL) return;
		self.jskauth.setWebIdentities(JSKitLib.fmap(newSites, function(site) {
			return self.jskauth.assembleIdentity(site.data[1], site.data[0], 'web');
		}));
		self.miniProfile.render("addAnotherSite");
		self.miniProfile.render("siteLinksIcons", {"identities": self.jskauth.getIdentities()});
	}, "profile_socialSitesUpdated");
	var descriptors = {
		"name": function(element) {
			self.renderNameField(element, "js-kit-miniProfile-name-ipe", JSKitEPB.isExists());
		},
		"avatar": function(element) {
			self.avatarsManager.assembleAvatarArea(element);
		},
		"logout": function(element) {
			element.onclick = function() {
				if (element.busy) return;
				element.busy = true;
				JSKitLib.text($JCL("loggingOut"), element, true);
				self.jskauth.logout();
			};
		},
		"logoutLink": function(element) { JSKitLib.text($JCL("menuLogout"), element); },
		"logoutIcon": function(element) { JSKitLib.addPNG(element, "//cdn.js-kit.com/images/cross.png"); },
		"addAnotherSite": function(element) {
			return self.fromMenuLoggedIn();
		}
	};
	var gfc = this.jskauth.getAuthIdentity("gfc");
	if (gfc && gfc.params.site) gfc.params.domain = this.config.domain;
	var data = {
		"Name": this.getUserProperty("Name", $JCL("guest")),
		"profile": so.profile,
		"avatarData": avatar,
		"identities": this.jskauth.getIdentities()
	};
	var config = {
		"mode": "embedded",
		"labels": $JCL,
		"template": this.dtMiniProfileLeaveComment,
		"uriDomain": this.uriDomain,
		"uriAvatar": this.uriAvatar,
		"cssPrefix": "js-kit-lcf-miniProfile",
		"avatarSize": {"width": "64", "height": "64"},
		"descriptors": descriptors,
		"openFullProfile": function() { self.showProfile(target, data); },
		"isNativeProfileDisabled": !self.serverOptions.showProfile
        };
	this.miniProfile = new JSKitMiniProfile(target, data, config);
}

JSCC.prototype.renderLeaveCommentForm = function() {
	var s = this;
	if (s.getSkin() != 'echo') {
		if (s.TC["js-commentAvatar"]) {
			JSKitLib.removeChildren(s.TC["js-commentAvatar"]);
			s.avatarsManager.assembleAvatarArea(s.TC["js-commentAvatar"]);
		}
		return;
	}
	JSKitLib.fmap(["userInfoWrapper", "extraControlsMenuWrapper"], function(name) {
		var element = s.TC["js-kit-lcf-" + name];
		if (element && typeof(s[name]) == "function") s[name](element);
	});
}

JSCC.prototype.userInfoWrapper = function(target) {
	var template = this["dtCreateUserInfo" + (this.jskauth.isLogged() ? "" : "Non") + "Logged"];
	JSKitLib.replaceChildren(target, JSKitLib.toDOM(template, "js-kit-lcf-", this).content);
}

JSCC.prototype.getRSSUrl = function() {
	var config = this.config;
	return this.serverOptions.customRSSLink
		? window.location.protocol + "//rss." + config.domain + "/comments" + config.path
		: window.location.protocol + "//js-kit.com/rss/" + config.domain + config.path;
}

JSCC.prototype.openFollowPopup = function() {
	var self = this;
	var dialog, eventCtx;
	if (window.JSKW$currentProfile) {
		window.JSKW$currentProfile.hideProfile();
	}
	var notifyMode = self.serverOptions.notifyMode; 
	var followPanel = this.followPanelPopup = this.assembleFollowPanel("popup");
	followPanel.get("rssThreadInput").value = this.getRSSUrl();
	var closeDialog = function() {
		dialog.close();
		JSKW$Events.invalidateContext(eventCtx);
		delete self.followPanelPopup;
	};
	var template = this.gtmpl(this.dtFollowPanelPopup);
	var descriptors = {
		"content": function() {
			return followPanel.content;
		},
		"doneButton": function(element, dom) {
			element.onclick = function() {
				new JSRVC({
					"uri": self.uriDomain + "/manage-email-subscription",
					"ref": JSKitLib.getRef(self),
					"target": self.target,
					"request": {
						"p": self.pathOverride,
						"mode": self.serverOptions.notifyMode
					}
				});
				element.value = $JCL("follow_subscriptionInProgress");
				JSKitLib.fmap([ 
					element, 
					dom.get("cancelButton")
				], function(control) { 
					if (control) control.disabled = true; 
				}); 
			}
		},
		"cancelButton": function(element) {
			element.onclick = function() {
				closeDialog();
				self.serverOptions.notifyMode = notifyMode;
			};
		},
		"editNotifications": function(element) {
			element.onclick = function() {
				window.open(self.uriDomain + "/settings/pctl.cgi?site=" + self.config.domain);
			}
		}
	};
	var dom = JSKitLib.toDOM(template, "js-kit-follow-popup-", descriptors);
	var config = {
		"width": 450,
		"height": 230,
		"cssClass": "js-kit-follow-popup"
	};
	dialog = new JSKitModalDialog(dom.content, config); 
	dialog.open();
	var handleServerResponse = function(eventName, data) {
		self.serverOptions.profile = data.profile;
		if (data.hasOwnProperty("mode")) {
			self.serverOptions.notifyMode = data.mode;
		}
		self.updateFollowPanel(self.followPanel);
		closeDialog();
	}
	eventCtx = JSKW$Events.registerEventCallback(undefined,
			handleServerResponse, "JSKit_emailSubscription");
}

JSCC.prototype.updateFollowPanel = function(dom) {
	var self = this;
	JSKitLib.fmap(["noemail", "email", "anymails"], function(notifyMode) {
		self.setInputState("radio",
			dom.get("notifyOptionRadio-" + notifyMode),
			self.serverOptions.notifyMode == notifyMode ? "checked" : "unchecked");
	});
}

JSCC.prototype.assembleFollowPanel = function(postfix) {
	var self = this;
	var rssUrl = this.getRSSUrl();
	var template = this.gtmpl(this.dtFollowPanel);
	var getEmail = function(emptyEmailLabel) {
		return self.extraFormFields["Email"] || emptyEmailLabel;
	};
	var descriptors = {
		"rssIcon": function(element) {
			JSKitLib.addPNG(element, "//cdn.js-kit.com/images/rss.png");
		},
		"rssThreadInput": function(element) {
			element.title = rssUrl;
		},
		"rssThreadButton": function(element) {
			element.onclick = function() { window.open(rssUrl); };
		},
		"emailAddress": function(element) {
			JSKitLib.text(getEmail($JCL("follow_emptyEmail")), element, true);
		},
		"editProfileLink": function(element) {
			element.onclick = function() {
				var profile = window.JSKW$currentProfile;
				if (profile && profile.isYours()) return;
				setTimeout(function() {
					self.showProfile(self.target,
						{"profile": self.serverOptions.profile},
						{"activeSection": "editProfile"});
				}, 0);
				JSKitLib.text($JCL("follow_openingProfile"), element, true);
				JSKitLib.addClass(element, "js-kit-follow-openingProfile");
			};
		},
		"emailIcon": function(element) {
			JSKitLib.addPNG(element, "//cdn.js-kit.com/images/email.png");
		}
	};
	JSKitLib.fmap(["noemail", "email", "anymails"], function(mode) {
		var notifyOptionHandler = function(element, dom) {
			var updateNotifyControlsLayout = function(previousMode) {
				if (!getEmail()) {
					var link = dom.get("emailAddress");
					var getClass = function(notifyMode) {
						return "js-kit-follow-activeNotifyMode-" + notifyMode;
					};
					if (previousMode) {
						JSKitLib.removeClass(link, getClass(previousMode));
					}
					JSKitLib.addClass(link, getClass(mode));
				}
				self.updateFollowPanel(dom);
			};
			if (self.serverOptions.notifyMode == mode) {
				updateNotifyControlsLayout();
			}
			element.onclick = function() {
				var previousMode = self.serverOptions.notifyMode;
				self.serverOptions.notifyMode = mode;
				updateNotifyControlsLayout(previousMode);
			};
		};
		descriptors["notifyOptionRadio-" + mode] = notifyOptionHandler;
		descriptors["notifyOptionLabel-" + mode] = notifyOptionHandler;
	});
	return JSKitLib.toDOM(template, "js-kit-follow-", descriptors);
}

JSCC.prototype.extraControlsMenuWrapper = function(target) {
	var self = this;
	var container = this.TC["js-kit-lcf-extraControlsMenuContent"];
	if (!container) return;
	var tabs = [];
	if (this.config.uploadImages) tabs.push({
		"name": "images",
		"icon": "//cdn.js-kit.com/images/picture_add.png",
		"title": $JCL("addImgText"),
		"content": function() {
			var template =
			'<div class="js-kit-images-wrapper">' +
			    '<div class="js-kit-images-label">{Label:addImagesSectionNotice}</div>' +
			    '<div class="js-kit-images-form"></div>' +
			    '<div class="js-kit-images-list"></div>' +
			'</div>';
			var dom = JSKitLib.toDOM(self.gtmpl(template), "js-kit-images-", {});
			self.assembleImagesUploadForm(dom.get("form"), dom.get("list"));
			return dom.content;
		}
	});
	var panel = this.followPanel = this.assembleFollowPanel();
	tabs.push({
		"name": "follow",
		"icon": "//cdn.js-kit.com/images/follow.png",
		"title": $JCL("follow"),
		"callbacks" : {
			"onTabOpened": function() {
				self.updateFollowPanel(panel);
				setTimeout(function() {
					panel.get("rssThreadInput").value = self.getRSSUrl();
				}, 0);				
			},
			"onTabClosed": function() {
				panel.get("rssThreadInput").value = "";
			}
		},
		"content": function() {
			return panel.content;
		}
	});
	var template =
	'<div class="js-kit-tab">' +
	    '<div class="js-kit-tab-icon"></div>' +
	    '<div class="js-kit-tab-title"></div>' +
	    '<div class="js-kit-tab-expandMarker"></div>' +
	    '<div class="js-kit-clear"></div>' +
	'</div>';
	var marker = function(element) {
		JSKitLib.addPNG(element, "//cdn.js-kit.com/images/menu/vertical-menu-expand-marker.png");
	};
	this.extraControlsMenu = new JSTabsManager(tabs, {
		"titles": target,
		"content": container
	}, {
		"mode": "toggle",
		"template": template,
		"descriptors": {"expandMarker": marker}
	});
}

JSCC.prototype.renderSubscribeEvents = function(subscribeEvents) {
	var s = this;
	if(subscribeEvents.error) {
		alert(subscribeEvents.errorDescription);
		return;
	}
	var appliedEvents = 0;
	JSKitLib.fmap(subscribeEvents, function(subscribeEvent){
		var item = s.jspg.getItemById(subscribeEvent.ID);
		var f;
		f = function(operation) {
		  if(operation=='add') {
			if(!item) {
				var cmtobj = subscribeEvent.content;
				if(cmtobj.ParentID && !s.jspg.getItemById(cmtobj.ParentID)) return; 
				s.pause.visible = true;
				s.renderPauseIndicator();
				if(!s.pause.state) {
					cmtobj.ID = subscribeEvent.ID;
					if (s.serverOptions.clustering)
						cmtobj.ParentID = JSFSearch.search(s.jspg.getItemsToDisplay(), cmtobj);
					cmtobj.echoItem = true;
					cmtobj.echoItemFirstTime = true;
					cmtobj.imgs = s.parseImgData(cmtobj);
					s.cmtInPlace(s.prepareCommentObj(cmtobj));
					s.publishEvent('comment-added', {'cmtId': cmtobj.ID});
					appliedEvents++;
				}
			} else {
				f('edit');
			}
		  }
		  if(s.pause.state) {
			s.pause.queue.push(subscribeEvent);
			if(operation=='add') {
				s.renderPauseCounter();
			}
			return;
		  }
		  if(operation=='edit') {
			if(item) {
				var msgId = subscribeEvent.ID;
				var cobj = s.objById[msgId];
				JSKitLib.fmap(subscribeEvent.content,
					function(v,k){
						cobj[k] = v;
					});
				JSKW$Events.syncBroadcast("smileys-newCommentInDiv", cobj);
				s.jspg.invalidateItemView(msgId);
				if(s.jspg.getPageByItemId(msgId)==s.curPage-1){
					var pageNo = s.curPage;
					s.curPage = 0;
					s.displayPage(pageNo);
				}
				JSKW$Events.syncBroadcast("comment-edited", s.jcaIndex, msgId);
				appliedEvents++;
			}
		  }
		  if(operation=='delete') {
			if(item) {
				s.postHandlerDelete(item.div);
				appliedEvents++;
			}
		  }
		  if(operation=='like_vote') {
			if(item) {
				var cobj = s.objById[subscribeEvent.ID];
				cobj.likeInstance.vote(subscribeEvent.content.action, subscribeEvent.content);
			}
		  }
		}
		f(subscribeEvent.operation);
	});
	if(appliedEvents > 0) {
		s.reCalcPages();
		s.controls.reveal();
	}
}

JSCC.prototype.useEcho = function() {
	return (this.getSkin() == 'echo') && this.serverOptions.echoLiveUpdates && !this.IM && !this.config.nolc && !this.config.moderate;
}

JSCC.prototype.useReplyThreadsCollapsing  = function() {
	return this.useEcho() && this.serverOptions.collapseReplyThreads;
}

JSCC.prototype.replaceCountTemplate = function(template, count) {
	return template.replace(/{Count}/, count);
}

JSCC.prototype.constructPopupLink = function(count) {
	var s = this;
	var so = s.serverOptions;
	var tmpl = s.utmpl['js-CommentsPopupLink'] || s.dtCommentsPopupLink;
	var link = tmpl.replace(/{LinkLabel}/, s.constructCommentsLabel(count, so.countLabels));
	link = s.replaceCountTemplate(link, count);
	popupLink = JSKitLib.html(s.gtmpl(link));
	JSKitLib.addEventHandler(popupLink, ['click'],
		function(e) {
			s.popComments();
			JSKitLib.preventDefaultEvent(e);
		});
	return popupLink;
}

JSCC.prototype.drawCommentLink = function(count) {
	var s = this;
	if (s.popupLink) {
		var oldPopupLink = s.popupLink;
		s.popupLink = s.constructPopupLink(count);
		s.target.parentNode.replaceChild(s.popupLink, oldPopupLink);
	} else {
		s.popupLink = s.constructPopupLink(count);
		s.target.parentNode.insertBefore(s.popupLink, s.target);
		JSKitLib.hide(s.target);
	}
}

JSCC.prototype.constructCommentsLabel = function(c, labels) {
	if (typeof window.JSKitCommentsCountFilter == 'function')
		return JSKitCommentsCountFilter(c);
	labels = labels || ["Comments", "Comments (1)", "Comments ({Count})"];
	switch (c) {
		case 0: return labels[0];
		case 1: return labels[1];
		default: return this.replaceCountTemplate(labels[2], c);
	}
}

JSCC.prototype.popComments = function() {
	var self = this;
	var config = this.config;
	switch (config['display-mode']) {
		case 'ext-popup':
			var wl = window.location;
			var url = this.uriDomain + "/api/static/pop_comments?ref=" 
				+ encodeURIComponent(JSKitLib.getRef(self))
				+ "&title=" + encodeURIComponent(config['page-title']);

			url += '&' + JSKitLib.fmap(config, function(v, k) {
				if (v && !k.match(/^(domain|popup-width|popup-height|display-mode|disabled|noDataRequest)$/)) 
					return k + "=" + encodeURIComponent(v);
			}).join('&');

			var params = 'width=' + config['popup-width'] + ", height=" + config['popup-height'] + ", status=yes, resizable=yes, scrollbars=yes";
			var w = window.open(url, "js_kit_popup_" + self.jcaIndex, params);
			w.focus();
			break;
		case 'int-popup':
			var divc = this.target.cloneNode(false);
			divc.jsk$initialized = false;
			var title = this.config['popup-title'];
			var popupWidget = new JSCC(divc, {'config': {'display-mode': 'inline'}});
			var popupInstance = new JSKitUniversalContainer(divc,
				{
					'mode': 'popup', 'title': self.replaceCountTemplate(title, '0'),
					'backdrop': 'yes', 'opacity': 0.4,
					'size': {'width': config['popup-width'], 'height': config['popup-height']},
					'cssPrefix': 'js-kit-popupComments',
					'whiteLabel': self.serverOptions.whitelabel
				},
				{
					'onContainerBeforeClose': function() {
						if (window.JSKW$currentProfile) window.JSKW$currentProfile.hideProfile();
						JSKW$Events.syncBroadcast("comments_closeControlsPopup");
						popupWidget.CommentCancelled();
					}
				}
			);
			popupWidget.parentWidget = this;
			popupWidget.popupInstance = popupInstance;
			break;
	}
}

JSCC.prototype.initAuth = function() {
	var s = this;

	var old_facebook = s.jskauth && s.jskauth.getAuthIdentity("facebook");

	if (s.jskauth) s.jskauth.destroy();
	s.jskauth = new JSKAuth({
		ref: JSKitLib.getRef(s),
		mode: "popup",
		target: s.target,
		identities: s.serverOptions.identities,
		withBackdrop: "true"
	});

	var facebook = s.jskauth.getAuthIdentity("facebook");
	if (facebook) {
		JSKitFBSDK.prototype.detectXD(s.target);
	}
	if (old_facebook && old_facebook.user
	&& (!facebook || facebook.user != old_facebook.user)) {
		new JSKitFBSDK(
			JSKitLib.getRef(s),
			old_facebook.params.app_id,
			old_facebook.params.xd_receiver,
			function() {
				this.logout();
			}
		);
	}
}

JSCC.prototype.updateConfigFromServer = function(so) {
	var s = this;
	JSKitLib.fmap({
		'display-mode': 'displayMode',
		'popup-title': 'popupTitle',
		'popup-width': 'popupWidth',
		'popup-height': 'popupHeight'
	}, function(v, k) { s.config[k] = s.config[k] || so[v]; });
	s.config.skin = s.hasOwnProperty("dtComment") ? s.config.skin : (s.config.skin || so.skin);
	s.config['display-mode'] = s.config['display-mode'] || "inline";
}

JSCC.prototype.findRootParent = function(comment) {
	return (comment && comment.ParentID) ?
		this.findRootParent(this.objById[comment.ParentID]) : comment;
}

JSCC.prototype.assembleExpandRepliesMarker = function(comment) {
	var self = this;
	var template = 
	'<div class="js-kit-replies-expand-container">' +
		'<div class="js-kit-replies-expand-wrapper jsk-PrimaryBackgroundColor">' +
			'<div class="js-kit-replies-expand-label jsk-LinkColor"></div>' +
		'</div>' +
	'</div>';
	var descriptors = {
		"label": function() {
			return JSKitLib.text($JCL("expandXMoreReplies", {"count": comment.extra.collapsedCmtsCount}));
		},
		"container": function(element) {
			JSKitLib.addStyle(element, "margin-left: " + self.level4margin(1) + ";");
			JSKitLib.setEventHandler(element, ["click"], function() {
				var pageNo = self.curPage;
				self.markCollapsedReplies(comment, false);
				self.curPage = 0;
				self.displayPage(pageNo);
			});
		}
	};
	return JSKitLib.toDOM(template, "js-kit-replies-expand-", descriptors).content;
}

JSCC.prototype.removeRepliesExpandMarker = function(comment) {
	if (!comment.extra.expandMarker) return; 
	var marker = comment.extra.expandMarker;
	if (JSKitLib.hasParentNode(marker)) {
		marker.parentNode.removeChild(marker);
		delete comment.extra.expandMarker;
	}

}

JSCC.prototype.markCollapsedReplies = function(comment, collapse) {
	if (!this.useReplyThreadsCollapsing()) return;
	var self = this;
	if (comment.ParentID) {
		comment = this.findRootParent(comment);
	}
	if (!comment) return;
	if (typeof(collapse) == "undefined") {
		collapse = typeof(comment.extra.areRepliesCollapsed) == "undefined" ||
					comment.extra.areRepliesCollapsed;
	}
	var threadWalk = function(cmt, callback, idx) {
		if (!idx) idx = 0;
		JSKitLib.fmap(cmt.thread, function(reply) {
			idx++;
			if (callback) callback(reply, idx);
			idx = threadWalk(reply, callback, idx);
		});
		return idx;
	};
	var limits = {"chunk": 2, "full": 5};
	var totalRepliesCount = threadWalk(comment);
	threadWalk(comment, function(cmt, idx) {
		cmt.extra.collapsed = collapse &&
			totalRepliesCount > limits.full &&
			idx - limits.chunk > 0 &&
			idx + limits.chunk <= totalRepliesCount;
		cmt.extra.cssClass = (collapse && totalRepliesCount - idx == limits.chunk - 1) ?
			"jsk-ItemWrapper-borderless" : undefined;

		if (cmt.extra.collapsed && cmt.ID == self.replyForId) {
			cmt.extra.cssClass = "jsk-ItemWrapper-borderless";
			cmt.extra.collapsed = false;
		}
	
		if (self.jspg) {
			self.jspg.invalidateItemView(cmt.ID);
		}
	});
	var collapsedCmtsCount = totalRepliesCount - limits.chunk*2;
	comment.extra.collapsedCmtsCount = collapsedCmtsCount > 0 ? collapsedCmtsCount : 0;
	comment.extra.areRepliesCollapsed = collapse;
	this.removeRepliesExpandMarker(comment);
}

JSCC.prototype.newCount = function(count, so) {
	var s = this;
	s.serverOptions = so;
	s.updateConfigFromServer(so);
	s.drawCommentLink(count);
	s.publishEvent('comments-count-updated', {'count': count});
}

/* Must be last to support Opera */
JSCC.prototype.newData = function(arr, so) {
	var s = this;

	s.updateConfigFromServer(so);

	if (s.config['display-mode'] == "inline") {
   		s.target.style.display = "block";
   		s.target.style.visibility = "visible";
	}
	JSKitLib.fmap(arr, function(obj) {
		obj.Name = obj.Name || $JCL("guest");
	});
	s.serverOptions = so;
	s.account = so.account || {};
	s.searchString = so.srch;
	s.adminMode = !!so.adminMode;
	s.ownerMode = !!so.ownerMode;
	s.inlineModeration = (s.adminMode && !s.config.moderate);

	s.initAuth();

	so.smiley = so.smiley || s.config.smiles == "yes";
	s.config.uploadImages = so.uploadImages;
	if (s.useEcho()) {
		s.config.backwards = 'yes';
		if (s.extraFormFields["Url"]) {
			var identity = s.jskauth.assembleIdentity(s.extraFormFields["Url"], "home", "web");
			s.jskauth.appendIdentity(identity);
		}
	}

	if(so.TS)
		this.serverDiffTS = so.TS - Math.round((new Date()).valueOf() / 1000);

	var dims = {
		"form": (s.getSkin() == 'echo') ? '64x64' : '96x96',
		"thread": (s.config.nolc || s.getSkin() == 'echo') ? '48x48' : so.avatardim
	};
	s.avatarsManager = s.initAvatarsManager(dims.form);
	s.maxAvatarDims = s.avatarsManager.splitAvatarDim(dims.thread);

	JSKitLib.addClass(s.target, "js-CommentsSkin-" + (s.getSkin() || "wireframe"));

	switch (s.config.skin) {
	case "smoothgray":
		s.navSym = JSKitLib.isIE() ? { "prev": '&larr;', "next": '&rarr;'} : { "prev": '&#x25c0;', "next": '&#x25b6;' };
		if(!s.hasOwnProperty("dtComment")) s.dtComment = JSCC.prototype.dtComment2;
		s.dtCreate = JSCC.prototype.dtCreate2;
		s.dtEditComment = JSCC.prototype.dtEditComment2;
		break;
	case "haloscan":
		s.dtComment = JSCC.prototype.dtComment3;
		s.dtCreate = JSCC.prototype.dtCreate3;
		s.dtEditComment = JSCC.prototype.dtEditComment;
		if (window.JK$HS$haloscan_style)
			JSKitLib.addCss(window.JK$HS$haloscan_style, "comments-skin-haloscan-custom");
		break;
	case "echo":
		s.dtComment = JSCC.prototype.dtCommentEcho;
		s.dtCreate = JSCC.prototype.dtCreateEcho;
		s.dtEditComment = JSCC.prototype.dtEditComment;
		break;
	}

	if (so.smiley) {
		s.smiles = {
			"O:-)"  : {file: 'innocent.gif', title: 'Innocent'},
			"&gt;:o": {file: 'yell.gif', title: 'Yell'},
			":)"    : {file: 'smile.gif', title: 'Smile'},
			":-)"   : {file: 'smile.gif', title: 'Smile'},
			";)"    : {file: 'wink.gif', title: 'Wink'},
			";-)"   : {file: 'wink.gif', title: 'Wink'},
			":'("   : {file: 'cry.gif', title: 'Cry'},
			"8-)"   : {file: 'cool.gif', title: 'Cool'},
			":("    : {file: 'frown.gif', title: 'Frown'},
			":-("   : {file: 'frown.gif', title: 'Frown'},
			":*"    : {file: 'kiss.gif', title: 'Kiss'},
			":-*"   : {file: 'kiss.gif', title: 'Kiss'},
			":-D"   : {file: 'laughing.gif', title: 'Laughing'},
			"=-O"   : {file: 'surprised.gif', title: 'Surprised'},
			"=-X"   : {file: 'sealed.gif', title: 'Sealed'},
			":-["   : {file: 'embarassed.gif', title: 'Embarassed'},
			":-$"   : {file: 'money-mouth.gif', title: 'Money mouth'},
			":-P"   : {file: 'tongue-out.gif', title: 'Tongue out'},
			":-E"   : {file: 'foot-in-mouth.gif', title: 'Foot in mouth'},
			"*DONT_KNOW*"   : {file: 'undecided.gif', title: 'Undecided'}
		};
		var f = function(v) { return v.replace(/([\W])/g,"\\$1"); };
		JSKitLib.fmap(s.smiles, function(el, i) {
			/* fix for case ">)" */
			s.smiles[i].regexpText = new RegExp('(&gt|&lt)?' + f(i), 'g');
			s.smiles[i].regexpTag = new RegExp(' ?' + f(s.smileTag(el)) + ' ?', 'g');
		});
	}
	var cb = function(name, obj, jcaIndex) {
		switch(name) {
			case "smileys-onchangeCommentText":
				if(so.smiley && obj && obj.Text) obj.Text = s.textSmiles2Graphical(obj.Text.replace(/&amp;/g, "&")); 
			break;
			case "smileys-beforePostNewComment":
				if(so.smiley && obj && obj.value) obj.value = s.textSmiles2Graphical(obj.value, 1);
			break;
			case "smileys-loadCommentsWidget": 
				if (s.jcaIndex != jcaIndex) return;
			/* no break needed !!! */
			case "smileys-newCommentInDiv":
				var needAutolink = (so.htmlMode || s.config.nolc);
				if ((so.smiley || needAutolink) && obj && obj.Text) {
					obj.Text = obj.Text.split('<wbr></wbr>').join('');
					if (needAutolink) {
						var tags;
						var tags2meta = function(t){tags = []; t = t.replace(/<a\s+[^>]*>.*?<\/a>|<.*?>/ig, function(m){tags.push(m); return ' %#HTML_TAG#% ';}); return t;};
						var meta2tags = function(t){JSKitLib.map(function(v){t = t.replace(' %#HTML_TAG#% ', v);}, tags); return t;};
						obj.Text = tags2meta(obj.Text);
						obj.Text = obj.Text.replace(/((?:http|ftp|https):\/\/(?:[a-z0-9#:\/\;\?\-\.\+,@&=%!\*\'(){}\[\]$_|^~`](?!gt;|lt;))+)/ig, '<a href="$1">$1</a>');
						obj.Text = tags2meta(meta2tags(obj.Text));
					}
					obj.Text = obj.Text.replace(/&amp;/g, '&');
					if (so.smiley) obj.Text = s.textSmiles2Graphical(obj.Text);
					if (needAutolink) {
						obj.Text = meta2tags(obj.Text);
					}
					obj.Text = obj.Text.replace(/(<a\s+[^>]*)?([^&<>\s\/\-]{12})([^&<>\s\/\-]{12})/ig, function($0, $1, $2, $3){if($1)return $0; return $2+'<wbr></wbr>'+$3;});
				}
			break;
		}
	}
	var ctx = JSKW$Events.registerEventCallback(undefined, cb, "smileys-newCommentInDiv");
	JSKW$Events.registerEventCallback(ctx, cb, "smileys-loadCommentsWidget");
	JSKW$Events.registerEventCallback(ctx, cb, "smileys-beforePostNewComment");
	JSKW$Events.registerEventCallback(ctx, cb, "smileys-onchangeCommentText");

	if(so.req) {
		s.config.sort = so.req.srt;
		s.config.backwards = so.req.ord == 'desc' ? 'yes' : 'no';
		s.config.thread = ((so.req.prs == 'flat') ? 'no' : 'yes');
	}

	s.gen++;
	s.loading = false;

	if(s.ctag != so.tag) {
		s.objById = {};
		if(s.jspg) s.invalidateJSPG();
	}

	var flat = (s.searchString) ? true : s.config.thread != 'yes';

	var ttt = []; // top level thread
	var newChildren = {};
	var nc = 0;
	JSKitLib.fmap(arr, function(obj) {
		if(!obj.ID) return;
		if(s.IM && obj.yours) obj.Name = 'Me';
		if(flat) {
			delete(obj.ParentID);
			delete(obj.depth);
		}
		s.objById[obj.ID] = obj;
		obj.extra = {};
		obj.thread = [];
		JSKW$Events.syncBroadcast("smileys-loadCommentsWidget", obj, s.jcaIndex);
		obj.karma = new JSCCKarma(obj, s);
		if(obj.status != 'D') nc++;
		var prn = s.objById[obj.ParentID];
		if(prn) {
			if(!newChildren[obj.ParentID]) {
				ttt.push(obj);
			}
			prn.thread.push(obj);
		} else {
			ttt.push(obj);
		}
		newChildren[obj.ID] = 1;
		obj.imgs = s.parseImgData(obj);
	});
	if (s.useReplyThreadsCollapsing()) {
		JSKitLib.fmap(ttt, function(cmt) {
			s.markCollapsedReplies(cmt, true);
		});
	}
	s.divPages(so, s.htmlPaginate(ttt));

	if(this.IM) this.conversations = so.conversations;

	s.ctag = so.tag;

	if (so.wysiwyg) {
		if (so.smiley) {
			so.allowedHTMLTags.push('img/src', 'img/title', 'img/border', 'img/alt');
		}
		var attrsByTag = {};
		JSKitLib.fmap(so.allowedHTMLTags, function(v) {
			var p = v.split('/');
			var tag = p[0] || p;
			var attr = p[1];
			if (!attrsByTag[tag]) {
				attrsByTag[tag] = ["style"];
			}
			if (attr) {
				attrsByTag[tag].push(attr);
			}
		});
		var allowedTags = JSKitLib.fmap(attrsByTag, function(attrs, tag) {
			return tag + (attrs.length ? '[' + attrs.join('|') + ']' : '');
		}).join(',');
		s.tmce = { foreign: true, cfg: {
			document_base_url: '//cdn.js-kit.com',
			convert_newlines_to_brs: true,
			relative_urls: 0,
			remove_script_host: 0,
			uri_domain: '//cdn.js-kit.com',
			width: '100%',
			closePopups: function() {
				var cns = document.body.childNodes;
				var i = 0;
				while(i < cns.length) {
					if(cns[i].id && cns[i].id.match(/^mce_\d+$/) && cns[i].className.match(/clearlooks2/)) document.body.removeChild(cns[i]);
					else i++;
				}
			},
			bookMark: function() { 
				tinyMCE.settings.curBM = tinyMCE.activeEditor.selection.getBookmark(); 
			},
			mode: "none",
			plugins: "inlinepopups" + (so.smiley?",emotions":"") + (so.media?",youtube":""),
			theme: "advanced",
			theme_advanced_buttons1: 
				"bold,italic,underline,|,undo,redo,link,unlink"
				+ (so.media?",youtube":"") + (so.smiley?",emotions":""),
			theme_advanced_buttons2: "",
			theme_advanced_buttons3: "",
			theme_advanced_toolbar_location: "top",
			theme_advanced_toolbar_align: "left",
			valid_elements: allowedTags,
			setup: function(ed) {
				var setContent = function(ed, value, extra) {
					if(JSKitLib.isIE()) {
						ed.setContent(value, extra);
						tinyMCE.execInstanceCommand(ed.id, 'selectall');
						ed.selection.collapse(0);
					} else {
						ed.setContent('', extra);
						ed.execCommand('mceInsertContent', false, value, extra);
					}
				};
				JSKitLib.fmap(["onClick","onKeyUp"], function(ev) {
					ed[ev].add(function(ed, e){
						tinyMCE.settings.bookMark();
						if (ev == 'onClick') {
							JSKW$Events.syncBroadcast('JSMenu-CollapseAll');
							JSKW$Events.syncBroadcast('miniProfile_collapseAll');
						}
					});
				});
				if (ed.getElement().smoothWysiwygLoading) {
					ed.onBeforeRenderUI.add(function(ed, e) {
						var el = ed.getElement();
						el.jsk$cover.parentNode.replaceChild(el.jsk$wrapper, el.jsk$cover);
					});
					ed[JSKitLib.getBrowser() == 'gecko' ? 'onInit' : 'onPostRender'].add(function(ed, e) {
						var el = ed.getElement();
						JSKitLib.show(el.jsk$wrapper);
						if (!el.jsk$nofocus && el.jsk$widget.config.backwards != 'yes')
							el.jsk$widget.TC["js-Cmtsubmit"].scrollIntoView(false);
					});
				}
				if(JSKitLib.getBrowser() == 'gecko') {
					ed.onInit.add(function(ed, e) {
						var d = ed.getDoc();
						try {
							d.designMode = 'on';
						} catch(e) { ; }
					});
				}
				if (ed.getElement().jsk$hasDefaultValue && (s.jskauth.loginStatus || !s.anonymousCmt)) {
					ed.onInit.add(function(ed, e) {
						var d = (JSKitLib.getBrowser() == 'gecko' ? ed.getDoc() : ed.getWin());
						tinymce.dom.Event.add(d, 'focus', function(e) {
							var el = ed.getElement();
							if (!el.defaultRemoved) {
								setContent(ed, '', {format: 'raw', skip_undo: true});
								el.defaultRemoved = true;
							}
							tinyMCE.settings.auto_focus = el.id;
						});
					});
				}
				if (!so.smiley) return;
				ed.onKeyUp.add(function(ed, e) {
					var content = {Text: ed.getContent({format: 'raw'})};
					JSKW$Events.syncBroadcast("smileys-onchangeCommentText", content);
					if(tinyMCE.settings.smiley) {
						setContent(ed, content.Text, {format: 'raw'});
					}
				});
			}
		}};
	}

	s.dataLoader(so, nc);

	var showCD = function() {
		if(so.ShowSavedCommentDialog)
			so.ShowSavedCommentDialog(s);
	}

	if(so.wysiwyg && !window.tinyMCE) {
		JSKitLib.preloadImg('//cdn.js-kit.com/images/loading.gif');
		var inittmce = function() {
			s.tmce.foreign = false;
			s.tmce.cfg.plugins = "inlinepopups"+(so.smiley?",emotions":"")+(so.media?",youtube":""); // !inl-pop
			s.tmce.cfg.strict_loading_mode = true;
			tinyMCE.init(s.tmce.cfg);
			showCD();
		}
		var oldcb = window.jsk$tmcecb;
		if(oldcb) {
			window.jsk$tmcecb = function() { if(oldcb) oldcb(); showCD(); };
		} else {
			window.jsk$tmcecb = inittmce;
			JSKitLib.addScript('//cdn.js-kit.com/extra/tiny_mce/tmce.js', this.target);
		}
	} else {
		showCD();
	}

	var f = s.onDataLoad;
	if(f) { s.onDataLoad = null; setTimeout(f, 0); }
	s.publishEvent('comments-data-loaded', {'count': so.pages.tc});

	if(this.useEcho() && (!s.echoSubscribed)) {
		var jsk$echo = jskEchoInit(JSKitLib.getRef(s), s.target);
		var voidRenderer = function(rendererIdx) {
			if(!jsk$echo.getRendererById(rendererIdx)) {
				jsk$echo.existingRenderers.push({
					id: rendererIdx,
					content: function() {}
				});
			}
		}
		voidRenderer(0);
		voidRenderer(1);
		var request = {
			p: s.config.path,
			permalink: s.config.permalink
		};
		if (s.sourceFilter) request[s.sourceFilter.type] = s.sourceFilter.sources.list;
		jsk$echo.subscribe([{
			request: request,
			callback: function() {
				s.renderSubscribeEvents.apply(s, arguments)
			}
		}]);
		s.echoSubscribed = true;
	}
}

