if (typeof(Reuters) == 'undefined' || Reuters == null) {
	Reuters = new Object();
}

if (typeof(Reuters.foot) == 'undefined' || Reuters.foot == null) {
	Reuters.foot = new Object();
}

if (typeof(Reuters.info) == 'undefined' || Reuters.info == null) {
	Reuters.info = new Object();
}

Reuters.foot.PRIMARY_SITE_URL = 'http://www.reuters.com';
Reuters.foot.hosts = [];
Reuters.foot.hosts["BETAUS"] = 'http://www.reuters.com';
Reuters.foot.hosts["UK"] = 'http://uk.reuters.com';
Reuters.foot.hosts["IN"] = 'http://in.reuters.com';
Reuters.foot.baseUrlPrefix = '';
Reuters.foot.thisUrl = '';
Reuters.foot.isCommerce = false;
Reuters.foot.isBlogs = false;
Reuters.foot.isSiteIndex = false;

Reuters.foot.whitelist = [
	{"host": "https://commerce.us.reuters.com", 					"isProxied": true, "edition": "BETAUS"},
	{"host": "https://beta.commerce.us.reuters.com", 			"isProxied": true, "edition": "BETAUS"},
	{"host": "https://portfolio.us.reuters.com", 					"isProxied": false, "edition": "BETAUS"},
	{"host": "http://portfolio.us.reuters.com", 					"isProxied": false, "edition": "BETAUS"},
	{"host": "https://alerts.us.reuters.com", 						"isProxied": false, "edition": "BETAUS"},
	{"host": "http://alerts.us.reuters.com", 							"isProxied": false, "edition": "BETAUS"},
	{"host": "https://funds.us.reuters.com", 							"isProxied": false, "edition": "BETAUS"},
	{"host": "http://funds.us.reuters.com", 							"isProxied": false, "edition": "BETAUS"},
	{"host": "http://testwsodportfolio.us.reuters.com", 	"isProxied": false, "edition": "BETAUS"},
	{"host": "http://testwsodalerts.us.reuters.com", 			"isProxied": false, "edition": "BETAUS"},
	{"host": "http://testwsodfunds.us.reuters.com", 			"isProxied": false, "edition": "BETAUS"},
	{"host": "http://screener-reuters.wsodqa.com", 	"isProxied": false, "edition": "BETAUS"},
	{"host": "http://stockscreener.us.reuters.com", 	"isProxied": false, "edition": "BETAUS"},

	{"host": "https://commerce.uk.reuters.com", 					"isProxied": true, "edition": "UK"},
	{"host": "https://beta.commerce.uk.reuters.com", 			"isProxied": true, "edition": "UK"},
	{"host": "https://portfolio.uk.reuters.com", 					"isProxied": false, "edition": "UK"},
	{"host": "http://portfolio.uk.reuters.com", 					"isProxied": false, "edition": "UK"},
	{"host": "https://alerts.uk.reuters.com", 						"isProxied": false, "edition": "UK"},
	{"host": "http://alerts.uk.reuters.com", 							"isProxied": false, "edition": "UK"},
	{"host": "https://funds.uk.reuters.com", 							"isProxied": false, "edition": "UK"},
	{"host": "http://funds.uk.reuters.com", 							"isProxied": false, "edition": "UK"},
	{"host": "http://testwsodportfolio.uk.reuters.com", 	"isProxied": false, "edition": "UK"},
	{"host": "http://testwsodalerts.uk.reuters.com", 			"isProxied": false, "edition": "UK"},
	{"host": "http://testwsodfunds.uk.reuters.com", 			"isProxied": false, "edition": "UK"},
	{"host": "http://screener-reuters.wsodqa.com", 	"isProxied": false, "edition": "UK"},
	{"host": "http://stockscreener.uk.reuters.com", 	"isProxied": false, "edition": "UK"},

	{"host": "https://commerce.in.reuters.com", 					"isProxied": true, "edition": "IN"},
	{"host": "https://beta.commerce.in.reuters.com", 			"isProxied": true, "edition": "IN"},
	{"host": "https://portfolio.in.reuters.com", 					"isProxied": false, "edition": "IN"},
	{"host": "http://portfolio.in.reuters.com", 					"isProxied": false, "edition": "IN"},
	{"host": "https://alerts.in.reuters.com", 						"isProxied": false, "edition": "IN"},
	{"host": "http://alerts.in.reuters.com", 							"isProxied": false, "edition": "IN"},
	{"host": "https://funds.in.reuters.com", 							"isProxied": false, "edition": "IN"},
	{"host": "http://funds.in.reuters.com", 							"isProxied": false, "edition": "IN"},
	{"host": "http://testwsodportfolio.in.reuters.com", 	"isProxied": false, "edition": "IN"},
	{"host": "http://testwsodalerts.in.reuters.com", 			"isProxied": false, "edition": "IN"},
	{"host": "http://testwsodfunds.in.reuters.com", 			"isProxied": false, "edition": "IN"},
	{"host": "http://screener-reuters.wsodqa.com", 	"isProxied": false, "edition": "IN"},
	{"host": "http://stockscreener.in.reuters.com", 	"isProxied": false, "edition": "IN"},

	{"host": "http://design.reuters.com", 								"isProxied": false, "edition": "UK"},

	{"host": "http://admincommerce.qa2.g3.reuters.com", 			"isProxied": true, "edition": "BETAUS"},
	{"host": "http://us.admincommerce.qa2.g3.reuters.com", 			"isProxied": true, "edition": "BETAUS"},
	{"host": "http://admincommerce.reuters.com", 					"isProxied": true, "edition": "BETAUS"},
	{"host": "http://us.admincommerce.reuters.com", 				"isProxied": true, "edition": "BETAUS"},

	{"host": "http://portfolio-reuters.wsodqa.com", 			"isProxied": false, "edition": "BETAUS"},
	{"host": "http://alerts-reuters.wsodqa.com", 					"isProxied": false, "edition": "BETAUS"},
	{"host": "http://funds-reuters.wsodqa.com", 					"isProxied": false, "edition": "BETAUS"},
	{"host": "http://10.90.23.217/resources/archive/", 		"isProxied": false, "edition": "BETAUS"},
	{"host": "http://www.reuters.com/resources/archive/", "isProxied": false, "edition": "BETAUS"},
	{"host": "http://blogs.reuters.com", 									"isProxied": false, "edition": "BETAUS"},
	{"host": "http://qa2.blogs.reuters.com", 							"isProxied": false, "edition": "BETAUS"},
	{"host": "http://qa3.blogs.reuters.com", 				"isProxied": false, "edition": "BETAUS"},
	{"host": "http://dev.blogs.reuters.com", 				"isProxied": false, "edition": "BETAUS"},
	{"host": "http://debate.reuters.com", 								"isProxied": false, "edition": "BETAUS"},
	{"host": "http://cw-content.reuters.com", 						"isProxied": false, "edition": "BETAUS"},
	{"host": "http://polls.reuters.com", 									"isProxied": false, "edition": "BETAUS"},
	{"host": "http://reuters-en.custhelp.com", 						"isProxied": false, "edition": "BETAUS"},
	{"host": "http://reuters-en--tst.custhelp.com", 			"isProxied": false, "edition": "BETAUS"},
	{"host": "http://reuters-en--pro.custhelp.com", 			"isProxied": false, "edition": "BETAUS"},
	{"host": "http://labs.reuters.com", 									"isProxied": false, "edition": "BETAUS"},
	{"host": "http://preview.commerce.us.reuters.com", 						"isProxied": false, "edition": "BETAUS"},
	{"host": "https://preview.commerce.uk.reuters.com", 					"isProxied": false, "edition": "BETAUS"},
	{"host": "http://spotlight.reuters.com", 							"isProxied": false, "edition": "BETAUS"},
	{"host": "http://preview.commerce.in.reuters.com", 		"isProxied": false, "edition": "IN"},
	{"host": "https://preview.commerce.in.reuters.com", 	"isProxied": false, "edition": "IN"},
	{"host": "http://reuters-en--upgrade.custhelp.com", 	"isProxied": false, "edition": "BETAUS"},
	{"host": "http://reuters.zendesk.com", 	"isProxied": false, "edition": "BETAUS"}
];

Reuters.foot.callback = function(obj) {
	if (Reuters.foot.baseUrlPrefix == '') {
		document.getElementById('reutersFooter').innerHTML = obj;
	} else {
		var re = /"\/resources_v2/gi; //"
		obj = obj.replace(re, '"' + Reuters.foot.baseUrlPrefix + '/resources_v2');
		var re = /http:\/\/((static.reuters.com)|(www.reuters.com)|(uk.reuters.com)|(in.reuters.com))\/http/gi;
		obj = obj.replace(re, 'http');
		var re = /http:\/\/((static.reuters.com)|(www.reuters.com)|(uk.reuters.com)|(in.reuters.com))\/javascript/gi;
		obj = obj.replace(re, 'javascript');
		document.getElementById('reutersFooter').innerHTML = obj;
	}

}

Reuters.foot.init = function() {
	for (i=0; i<Reuters.foot.whitelist.length; i++) {
		if (location.href.indexOf(Reuters.foot.whitelist[i].host) === 0) {
			Reuters.foot.thisUrl = Reuters.foot.whitelist[i].host;
			Reuters.info.edition = Reuters.foot.whitelist[i].edition;
			Reuters.foot.PRIMARY_SITE_URL = Reuters.foot.hosts[Reuters.foot.whitelist[i].edition];
			Reuters.foot.baseUrlPrefix = Reuters.foot.PRIMARY_SITE_URL;
			if (Reuters.foot.whitelist[i].isProxied) {
				Reuters.foot.baseUrlPrefix = '';
			}
			break;
		}
	}
	if ((Reuters.foot.thisUrl.search("commerce.us.reuters.com") != -1) || (Reuters.foot.thisUrl.search("commerce.uk.reuters.com") != -1) || (Reuters.foot.thisUrl.search("commerce.in.reuters.com") != -1)||(Reuters.nav.thisUrl.search("admincommerce.reuters.com") != -1)||(Reuters.nav.thisUrl.search("admincommerce.qa2.reuters.com") != -1)) {
		Reuters.foot.isCommerce = true;
	} else if (Reuters.foot.thisUrl.search("blogs.reuters.com") != -1) {
		Reuters.foot.isBlogs = true;
	} else if (Reuters.foot.thisUrl.search("/resources/archive/") != -1) {
		Reuters.foot.isSiteIndex = true;
	}
	Reuters.foot.sharedModulePrefix = '';
	if (Reuters.info.edition != "BETAUS") {
		Reuters.foot.sharedModulePrefix = Reuters.info.edition + "-";
	}
	document.write('<div id="reutersFooter">Loading...</div>');
	document.write('<scr' + 'ipt language="JavaScript" type="text/javascript" src="' + Reuters.foot.baseUrlPrefix + '/assets/sharedModuleJS?view=RSM-' + Reuters.foot.sharedModulePrefix + 'baseFooter&tracking=false&globalJSVariable=&callback=Reuters.foot.callback&sp=' + Reuters.foot.baseUrlPrefix + '&pn=0"></script>');
}

Reuters.foot.init();