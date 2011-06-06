if (typeof(Reuters) == 'undefined' || Reuters == null) {
	Reuters = new Object();
}

if (typeof(Reuters.nav) == 'undefined' || Reuters.nav == null) {
	Reuters.nav = new Object();
}

if (typeof(Reuters.info) == 'undefined' || Reuters.info == null) {
	Reuters.info = new Object();
}

Reuters.nav.PRIMARY_SITE_URL = 'http://www.reuters.com';
Reuters.nav.hosts = [];
Reuters.nav.hosts["BETAUS"] = 'http://www.reuters.com';
Reuters.nav.hosts["UK"] = 'http://uk.reuters.com';
Reuters.nav.hosts["IN"] = 'http://in.reuters.com';
Reuters.nav.baseUrlPrefix = '';
Reuters.nav.thisUrl = '';
Reuters.nav.isCommerce = false;
Reuters.nav.isBlogs = false;
Reuters.nav.isSiteIndex = false;

Reuters.nav.loadedTimer = null;

Reuters.nav.whitelist = [
	{"host": "https://commerce.us.reuters.com", 			"isProxied": true, "edition": "BETAUS"},
	{"host": "https://beta.commerce.us.reuters.com", 		"isProxied": true, "edition": "BETAUS"},
	{"host": "https://portfolio.us.reuters.com", 			"isProxied": false, "edition": "BETAUS"},
	{"host": "http://portfolio.us.reuters.com", 			"isProxied": false, "edition": "BETAUS"},
	{"host": "https://alerts.us.reuters.com", 				"isProxied": false, "edition": "BETAUS"},
	{"host": "http://alerts.us.reuters.com", 				"isProxied": false, "edition": "BETAUS"},
	{"host": "https://funds.us.reuters.com", 				"isProxied": false, "edition": "BETAUS"},
	{"host": "http://funds.us.reuters.com", 				"isProxied": false, "edition": "BETAUS"},
	{"host": "http://testwsodportfolio.us.reuters.com", 	"isProxied": false, "edition": "BETAUS"},
	{"host": "http://testwsodalerts.us.reuters.com", 		"isProxied": false, "edition": "BETAUS"},
	{"host": "http://testwsodfunds.us.reuters.com", 		"isProxied": false, "edition": "BETAUS"},
	{"host": "http://screener-reuters.wsodqa.com", 	"isProxied": false, "edition": "BETAUS"},
	{"host": "http://stockscreener.us.reuters.com", 	"isProxied": false, "edition": "BETAUS"},

	{"host": "https://commerce.uk.reuters.com", 			"isProxied": true, "edition": "UK"},
	{"host": "https://beta.commerce.uk.reuters.com", 		"isProxied": true, "edition": "UK"},
	{"host": "https://portfolio.uk.reuters.com", 			"isProxied": false, "edition": "UK"},
	{"host": "http://portfolio.uk.reuters.com", 			"isProxied": false, "edition": "UK"},
	{"host": "https://alerts.uk.reuters.com", 				"isProxied": false, "edition": "UK"},
	{"host": "http://alerts.uk.reuters.com", 				"isProxied": false, "edition": "UK"},
	{"host": "https://funds.uk.reuters.com", 				"isProxied": false, "edition": "UK"},
	{"host": "http://funds.uk.reuters.com", 				"isProxied": false, "edition": "UK"},
	{"host": "http://testwsodportfolio.uk.reuters.com", 	"isProxied": false, "edition": "UK"},
	{"host": "http://testwsodalerts.uk.reuters.com", 		"isProxied": false, "edition": "UK"},
	{"host": "http://testwsodfunds.uk.reuters.com", 		"isProxied": false, "edition": "UK"},
	{"host": "http://screener-reuters.wsodqa.com", 	"isProxied": false, "edition": "UK"},
	{"host": "http://stockscreener.uk.reuters.com", 	"isProxied": false, "edition": "UK"},

	{"host": "https://commerce.in.reuters.com", 			"isProxied": true, "edition": "IN"},
	{"host": "https://beta.commerce.in.reuters.com", 		"isProxied": true, "edition": "IN"},
	{"host": "https://portfolio.in.reuters.com", 			"isProxied": false, "edition": "IN"},
	{"host": "http://portfolio.in.reuters.com", 			"isProxied": false, "edition": "IN"},
	{"host": "https://alerts.in.reuters.com", 				"isProxied": false, "edition": "IN"},
	{"host": "http://alerts.in.reuters.com", 				"isProxied": false, "edition": "IN"},
	{"host": "https://funds.in.reuters.com", 				"isProxied": false, "edition": "IN"},
	{"host": "http://funds.in.reuters.com", 				"isProxied": false, "edition": "IN"},
	{"host": "http://testwsodportfolio.in.reuters.com", 	"isProxied": false, "edition": "IN"},
	{"host": "http://testwsodalerts.in.reuters.com", 		"isProxied": false, "edition": "IN"},
	{"host": "http://testwsodfunds.in.reuters.com", 		"isProxied": false, "edition": "IN"},
	{"host": "http://screener-reuters.wsodqa.com", 	"isProxied": false, "edition": "IN"},
	{"host": "http://stockscreener.in.reuters.com", 	"isProxied": false, "edition": "IN"},

	{"host": "http://design.reuters.com", 					"isProxied": false, "edition": "UK"},

	{"host": "http://admincommerce.qa2.g3.reuters.com", 			"isProxied": true, "edition": "BETAUS"},
	{"host": "http://us.admincommerce.qa2.g3.reuters.com", 			"isProxied": true, "edition": "BETAUS"},
	{"host": "http://admincommerce.reuters.com", 					"isProxied": true, "edition": "BETAUS"},
	{"host": "http://us.admincommerce.reuters.com", 				"isProxied": true, "edition": "BETAUS"},

	{"host": "http://portfolio-reuters.wsodqa.com", 		"isProxied": false, "edition": "BETAUS"},
	{"host": "http://alerts-reuters.wsodqa.com", 			"isProxied": false, "edition": "BETAUS"},
	{"host": "http://funds-reuters.wsodqa.com", 			"isProxied": false, "edition": "BETAUS"},
	{"host": "http://10.90.23.217/resources/archive/", 		"isProxied": false, "edition": "BETAUS"},
	{"host": "http://www.reuters.com/resources/archive/", 	"isProxied": false, "edition": "BETAUS"},
	{"host": "http://blogs.reuters.com", 					"isProxied": false, "edition": "BETAUS"},
	{"host": "http://qa2.blogs.reuters.com", 				"isProxied": false, "edition": "BETAUS"},
	{"host": "http://qa3.blogs.reuters.com", 				"isProxied": false, "edition": "BETAUS"},
	{"host": "http://dev.blogs.reuters.com", 				"isProxied": false, "edition": "BETAUS"},
	{"host": "http://debate.reuters.com", 					"isProxied": false, "edition": "BETAUS"},
	{"host": "http://cw-content.reuters.com", 				"isProxied": false, "edition": "BETAUS"},
	{"host": "http://polls.reuters.com", 					"isProxied": false, "edition": "BETAUS"},
	{"host": "http://reuters-en.custhelp.com", 				"isProxied": false, "edition": "BETAUS"},
	{"host": "http://reuters-en--tst.custhelp.com", 		"isProxied": false, "edition": "BETAUS"},
	{"host": "http://reuters-en--pro.custhelp.com", 		"isProxied": false, "edition": "BETAUS"},
	{"host": "http://labs.reuters.com", 					"isProxied": false, "edition": "BETAUS"},
	{"host": "http://preview.commerce.us.reuters.com", 		"isProxied": false, "edition": "BETAUS"},
	{"host": "https://preview.commerce.us.reuters.com", 	"isProxied": false, "edition": "BETAUS"},
	{"host": "http://spotlight.reuters.com", 				"isProxied": false, "edition": "BETAUS"},
	{"host": "http://preview.commerce.in.reuters.com", 		"isProxied": false, "edition": "IN"},
	{"host": "https://preview.commerce.in.reuters.com", 	"isProxied": false, "edition": "IN"},
	{"host": "http://reuters-en--upgrade.custhelp.com", 	"isProxied": false, "edition": "BETAUS"},
	{"host": "http://reuters.zendesk.com", 	"isProxied": false, "edition": "BETAUS"}
];

Reuters.nav.trySetup = function() {
	if ((typeof(Reuters.nav.setup) != 'undefined') && (typeof(Reuters.utils) != 'undefined')) {
		Reuters.nav.setup();
	} else {
		Reuters.nav.loadedTimer = setTimeout(Reuters.nav.trySetup, 500);
	}
}

Reuters.nav.callback = function(obj) {
	if (Reuters.nav.siteUrl == '') {
		if (Reuters.nav.isCommerce) {
			/* strip absolute paths so they get proxied correctly */
			var re = /http:\/\/((static.reuters.com)|(www.reuters.com)|(uk.reuters.com)|(in.reuters.com))/gi;
			document.getElementById('reutersHeader').innerHTML = obj.replace(re, '');
		} else {
			/* use as is */
			document.getElementById('reutersHeader').innerHTML = obj;
		}
	} else {
		/* add absolute paths to all assets */
		var re = /"\/resources_v2/gi; /*"*/
		document.getElementById('reutersHeader').innerHTML = obj.replace(re, '"' + Reuters.nav.baseUrlPrefix + '/resources_v2');
	}
	Reuters.nav.trySetup();
}

Reuters.nav.init = function() {
	for (i=0; i<Reuters.nav.whitelist.length; i++) {
		if (location.href.indexOf(Reuters.nav.whitelist[i].host) === 0) {
			Reuters.nav.thisUrl = Reuters.nav.whitelist[i].host;
			Reuters.info.edition = Reuters.nav.whitelist[i].edition;
			Reuters.nav.PRIMARY_SITE_URL = Reuters.nav.hosts[Reuters.nav.whitelist[i].edition];
			Reuters.nav.baseUrlPrefix = Reuters.nav.PRIMARY_SITE_URL;
			if (Reuters.nav.whitelist[i].isProxied) {
				Reuters.nav.baseUrlPrefix = '';
			}
			break;
		}
	}
	Reuters.nav.sharedModulePrefix = '';
	if (Reuters.info.edition != "BETAUS") {
		Reuters.nav.sharedModulePrefix = Reuters.info.edition + "-";
	}
	if ((Reuters.nav.thisUrl.search("commerce.us.reuters.com") != -1)||(Reuters.nav.thisUrl.search("commerce.uk.reuters.com") != -1)||(Reuters.nav.thisUrl.search("commerce.in.reuters.com") != -1)||(Reuters.nav.thisUrl.search("admincommerce.reuters.com") != -1)||(Reuters.nav.thisUrl.search("admincommerce.qa2.reuters.com") != -1)) {
		Reuters.nav.isCommerce = true;
	} else if (Reuters.nav.thisUrl.search("blogs.reuters.com") != -1) {
		Reuters.nav.isBlogs = true;
	} else if (Reuters.nav.thisUrl.search("/resources/archive/") != -1) {
		Reuters.nav.isSiteIndex = true;
	}
	if (Reuters.nav.isCommerce) {
		document.write('<link href="' + Reuters.nav.baseUrlPrefix + '/resources_v2/css/rcom-navigation.css" rel="stylesheet" />');
		document.write('<scr' + 'ipt src="' + Reuters.nav.baseUrlPrefix + '/resources_v2/js/headerNavFlyout.js"></script>');
		document.write('<div id="reutersHeader"></div><scr' + 'ipt language="JavaScript" type="text/javascript" src="' + Reuters.nav.baseUrlPrefix + '/assets/sharedModuleJS?view=RSM-' + Reuters.nav.sharedModulePrefix + 'baseHeaderCommerce&globalJSVariable=&callback=Reuters.nav.callback&sp=' + Reuters.nav.baseUrlPrefix + '"></script>');
	} else {
		if (!Reuters.nav.isBlogs) {
			document.write('<link href="' + Reuters.nav.baseUrlPrefix + '/resources_v2/css/rcom-main.css" rel="stylesheet" />');
		}
		if (Reuters.nav.isSiteIndex) {
			document.write('<link href="' + Reuters.nav.baseUrlPrefix + '/resources_v2/css/rcom-siteindex.css" rel="stylesheet" />');
		}
		document.write('<link href="' + Reuters.nav.baseUrlPrefix + '/resources_v2/css/rcom-navigation.css" rel="stylesheet" />');
		document.write('<scr' + 'ipt language="javascript" src="' + Reuters.nav.baseUrlPrefix + '/resources_v2/js/libraries/yui_2_7_0/yahoo/yahoo-min.js"></script>');
		document.write('<scr' + 'ipt language="javascript" src="' + Reuters.nav.baseUrlPrefix + '/resources_v2/js/libraries/yui_2_7_0/event/event-min.js"></script>');
		document.write('<scr' + 'ipt language="javascript" src="' + Reuters.nav.baseUrlPrefix + '/resources_v2/js/libraries/yui_2_7_0/dom/dom-min.js"></script>');
		document.write('<scr' + 'ipt language="javascript" src="' + Reuters.nav.baseUrlPrefix + '/resources_v2/js/libraries/yui_2_7_0/yahoo-dom-event/yahoo-dom-event.js"></script>');
		document.write('<scr' + 'ipt language="javascript" src="' + Reuters.nav.baseUrlPrefix + '/resources_v2/js/libraries/yui_2_7_0/animation/animation-min.js"></script>');
		document.write('<scr' + 'ipt language="javascript" src="' + Reuters.nav.baseUrlPrefix + '/resources_v2/js/libraries/yui_2_7_0/connection/connection-min.js"></script>');
		document.write('<scr' + 'ipt language="javascript" src="' + Reuters.nav.baseUrlPrefix + '/resources_v2/js/libraries/yui_2_7_0/cookie/cookie-min.js"></script>');
		document.write('<scr' + 'ipt language="javascript" src="' + Reuters.nav.baseUrlPrefix + '/resources_v2/js/extensions.js"></script>');
		document.write('<scr' + 'ipt language="javascript" src="' + Reuters.nav.baseUrlPrefix + '/resources_v2/js/rcom-main.js"></script>');
		document.write('<scr' + 'ipt language="javascript" src="' + Reuters.nav.baseUrlPrefix + '/resources_v2/js/headerNavFlyout.js"></script>');
		document.write('<div id="reutersHeader"></div><scr' + 'ipt language="javaScript" type="text/javascript" src="' + Reuters.nav.baseUrlPrefix + '/assets/sharedModuleJS?view=RSM-' + Reuters.nav.sharedModulePrefix + 'baseHeader&globalJSVariable=&callback=Reuters.nav.callback&sp=' + Reuters.nav.baseUrlPrefix + '"></script>');
	}
}

Reuters.nav.init();