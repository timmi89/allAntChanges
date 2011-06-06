var navFlyout = { init : function() { Reuters.nav.setup(); } };

if (typeof(Reuters) == 'undefined' || Reuters == null) {
	Reuters = new Object();
}

if (typeof(Reuters.nav) == 'undefined' || Reuters.nav == null) {
	Reuters.nav = new Object();
}

if (typeof(Reuters.info) == 'undefined' || Reuters.info == null) {
	Reuters.info = new Object();
}

if (typeof Reuters.info.edition == "undefined") {
	Reuters.info.edition = "BETAUS";
}

if (typeof(Reuters.nav.baseUrlPrefix) == 'undefined') {
	Reuters.nav.baseUrlPrefix = '';
}

if (typeof(Reuters.nav.PRIMARY_SITE_URL) == 'undefined') {
	Reuters.nav.PRIMARY_SITE_URL = 'http://www.reuters.com';
}

Reuters.nav.flyoutScript1 = '';
Reuters.nav.flyoutScript2 = '';
Reuters.nav.flyoutScript3 = '';
Reuters.nav.scriptsLoaded = false;
Reuters.nav.closeTimer = null;
Reuters.nav.recheckCloseTimer = null;

Reuters.nav.editions = [
		{"key": "AF", "edition": "AF", "label": "Africa", "link": "http://af.reuters.com", "id": ""},
		{"key": "ARA", "edition": '<img src="' + Reuters.nav.baseUrlPrefix + '/resources_v2/images/edition_ara.gif" border="0" alt="ARA" />', "label": "Arabic", "link": "http://ara.reuters.com", "id": "edition_ara"},
		{"key": "AR", "edition": "AR", "label": "Argentina", "link": "http://ar.reuters.com", "id": ""},
		{"key": "BR", "edition": "BR", "label": "Brazil", "link": "http://br.reuters.com", "id": ""},
		{"key": "CA", "edition": "CA", "label": "Canada", "link": "http://ca.reuters.com", "id": ""},
		{"key": "CN", "edition": '<img src="' + Reuters.nav.baseUrlPrefix + '/resources_v2/images/edition_cn.gif" border="0" alt="CN" />', "label": "China", "link": "http://cn.reuters.com", "id": "edition_cn"},
		{"key": "FR", "edition": "FR", "label": "France", "link": "http://fr.reuters.com", "id": ""},
		{"key": "DE", "edition": "DE", "label": "Germany", "link": "http://de.reuters.com", "id": ""},
		{"key": "IN", "edition": "IN", "label": "India", "link": "http://in.reuters.com", "id": ""},
		{"key": "IT", "edition": "IT", "label": "Italy", "link": "http://it.reuters.com", "id": ""},
		{"key": "JP", "edition": '<img src="' + Reuters.nav.baseUrlPrefix + '/resources_v2/images/edition_jp.gif" border="0" alt="JP" />', "label": "Japan", "link": "http://jp.reuters.com", "id": "edition_jp"},
		{"key": "LTA", "edition": "LTAM", "label": "Latin America", "link": "http://lta.reuters.com", "id": ""},
		{"key": "MX", "edition": "MX", "label": "Mexico", "link": "http://mx.reuters.com", "id": ""},
		{"key": "RU", "edition": "RU", "label": "Russia", "link": "http://ru.reuters.com", "id": ""},
		{"key": "ES", "edition": "ES", "label": "Spain", "link": "http://es.reuters.com", "id": ""},
		{"key": "BETAUS", "edition": "US", "label": "United States", "link": "http://www.reuters.com", "id": ""},
		{"key": "UK", "edition": "UK", "label": "United Kingdom", "link": "http://uk.reuters.com", "id": ""}
];

Reuters.nav.findEdition = function(edition) {
	for (i=0; i<Reuters.nav.editions.length; i++) {
		if (Reuters.nav.editions[i].key == edition) {
			return Reuters.nav.editions[i];
			break;
		}
	}
	return '';
}

Reuters.nav.loadEditionChanger = function() {
	var thisEdition = Reuters.nav.findEdition(Reuters.info.edition);
	Reuters.nav.PRIMARY_SITE_URL = thisEdition.link;
	var h = '';
	h += '<div class="viewingLabelContainer"><div class="viewingLabelFull"><span>YOU\'RE VIEWING:</span><br />';
	h += '<span class="selectedEdition">' + thisEdition.label + '</span></div>';
	h += '<div class="viewingLabelAbbr">' + thisEdition.edition + '</div></div><div>';
	for (var i=0; i<Reuters.nav.editions.length; i++){
		if (thisEdition.key != Reuters.nav.editions[i].key) {
			h += '<div class="editionListContainer" onclick="window.location=\'' + Reuters.nav.editions[i].link + '\';" onmouseover="this.style.backgroundColor=\'#0096CA\';" onmouseout="this.style.backgroundColor=\'#333333\';"><div class="editionFull">'
			h += '<a href="'+Reuters.nav.editions[i].link+'">' + Reuters.nav.editions[i].label+'</a>';
			h += '</div><div class="editionAbbr"';
			if(Reuters.nav.editions[i].id != '') {
				h += ' id="'+ Reuters.nav.editions[i].id +'"></div></div>';
			} else {
				h += '>'+Reuters.nav.editions[i].edition+'</div></div>';
			}			
		}
	}
	h += '</div>';
	if (document.getElementById("submenu_editions")) {
		document.getElementById("submenu_editions").innerHTML = h;
	}
}

Reuters.nav.openFlyout = function() {
	if (Reuters.nav.scriptsLoaded == false) {
		Reuters.utils.loadScript('NavFlyoutContent1', navFlyout.navContent1);
		Reuters.utils.loadScript('NavFlyoutContent2', navFlyout.navContent2);
		Reuters.utils.loadScript('NavFlyoutContent3', navFlyout.navContent3);
		Reuters.nav.loadEditionChanger();
		Reuters.nav.scriptsLoaded	= true;
	}
	Reuters.nav.cancelCloseFlyoutTimer();
	if (Reuters.nav.activeFlyout) {
		Reuters.nav.activeFlyout.style.display = 'none';
	}
	Reuters.nav.activeFlyout = document.getElementById('submenu_' + Reuters.nav.activeFlyoutId);
	Reuters.nav.activeFlyout.style.display = 'block';
	if (typeof (is_ie6) != 'undefined') {
		if (is_ie6) {
			aFlyoutElemDivs = Reuters.nav.activeFlyout.getElementsByTagName("div");
			for(var i=0;i<aFlyoutElemDivs.length;i++) {
				var pattern = /column[0-9]/g;
				if(aFlyoutElemDivs[i].className.search(pattern) != -1) {
					aFlyoutElemDivs[i].style.width = aFlyoutElemDivs[i].offsetWidth - 1 + "px";
					aFlyoutElemDivs[i].style.width = aFlyoutElemDivs[i].offsetWidth + 1 + "px";
				}
			}
		}
	} else if (typeof (is_ie6) == 'undefined') {
		aFlyoutElemDivs = Reuters.nav.activeFlyout.getElementsByTagName("div");
		for(var i=0;i<aFlyoutElemDivs.length;i++) {
			var pattern = /column[0-9]/g;
			if(aFlyoutElemDivs[i].className.search(pattern) != -1) {
				aFlyoutElemDivs[i].style.width = aFlyoutElemDivs[i].offsetWidth - 1 + "px";
				aFlyoutElemDivs[i].style.width = aFlyoutElemDivs[i].offsetWidth + 1 + "px";
			}
		}
	}
	if (Reuters.nav.activeFlyout != document.getElementById("submenu_editions")) {
		var activeFlyoutHeight = Reuters.nav.activeFlyout.offsetHeight;
		var activeFlyoutHeightAdjust = activeFlyoutHeight + 3;
		var activeFlyoutShadowHeight = activeFlyoutHeightAdjust + 'px';
		document.getElementById('flyoutDropshadowContainer_'+Reuters.nav.activeFlyoutId).style.height = activeFlyoutShadowHeight;
	}
}

Reuters.nav.openFlyoutTimed = function() {
	Reuters.nav.cancelCloseFlyoutTimer();
	Reuters.nav.activeFlyoutId = this.id.split("_")[1];
	Reuters.nav.closeTimer = window.setTimeout(Reuters.nav.openFlyout, 100);
}

Reuters.nav.closeFlyout = function() {
	if (Reuters.nav.activeFlyout) {
		Reuters.nav.activeFlyout.style.display = 'none';
	}
}

Reuters.nav.closeFlyoutTimed = function() {
	if (!document.getElementById("tnsSaver")) {
		window.clearTimeout(Reuters.nav.closeTimer);
		Reuters.nav.closeTimer = window.setTimeout(Reuters.nav.closeFlyout, 100);
	} else {
		Reuters.nav.recheckCloseTimer = window.setTimeout(Reuters.nav.closeFlyoutTimed, 500);
	}
}

Reuters.nav.cancelCloseFlyoutTimer = function() {
	if (Reuters.nav.closeTimer) {
		window.clearTimeout(Reuters.nav.closeTimer);
		window.clearTimeout(Reuters.nav.recheckCloseTimer);
		Reuters.nav.closeTimer = null;
		Reuters.nav.recheckCloseTimer = null;
	}
}

Reuters.nav.registerEvents = function() {
	document.getElementById('change_editions').onmouseover = Reuters.nav.openFlyoutTimed;
	document.getElementById('change_editions').onmouseout = Reuters.nav.closeFlyoutTimed;
	document.getElementById('submenu_editions').onmouseover = Reuters.nav.cancelCloseFlyoutTimer;
	document.getElementById('submenu_editions').onmouseout = Reuters.nav.closeFlyoutTimed;
	for (j=1; j<=3; j++) {
		document.getElementById('MenuItem_' + j).onmouseover = Reuters.nav.openFlyoutTimed;
		document.getElementById('MenuItem_' + j).onmouseout = Reuters.nav.closeFlyoutTimed;
		document.getElementById('submenu_' + j).onmouseover = Reuters.nav.cancelCloseFlyoutTimer;
		document.getElementById('submenu_' + j).onmouseout = Reuters.nav.closeFlyoutTimed;
	}
}

Reuters.nav.loadScripts = function() {
	Reuters.utils.loadScript('NavFlyoutContent1', Reuters.nav.flyoutScript1);
	Reuters.utils.loadScript('NavFlyoutContent2', Reuters.nav.flyoutScript2);
	Reuters.utils.loadScript('NavFlyoutContent3', Reuters.nav.flyoutScript3);
	Reuters.nav.loadEditionChanger();
	// if (Reuters.nav.isCommerce) { Reuters.nav.checkReplaceNavLinks(); }
}

Reuters.nav.scrubAssets = function(obj) {
	var re = /"\/resources_v2/gi; //"
	obj = obj.replace(re, '"' + Reuters.nav.baseUrlPrefix + '/resources_v2');
	var re = /http:\/\/www.reuters.com\/http/gi;
  var re = /http:\/\/((static.reuters.com)|(www.reuters.com)|(uk.reuters.com)|(in.reuters.com))\/http/gi;
	obj = obj.replace(re, 'http');
	return obj;
}

Reuters.nav.scrubCommerceAssets = function (sText) {
	if (Reuters.nav.isCommerce) {
        var re = /http:\/\/((static.reuters.com)|(www.reuters.com)|(uk.reuters.com)|(in.reuters.com))/gi;
		sText = sText.replace(re, '');
		var re = /a href="\//gi;      //"
        sText = sText.replace(re, 'a href="' + Reuters.nav.PRIMARY_SITE_URL + '/');
	}
	return sText;
}

Reuters.nav.callback1 = function (sReturn) {
	if (Reuters.nav.baseUrlPrefix == '') {
		document.getElementById('nav1').innerHTML = Reuters.nav.scrubCommerceAssets(sReturn);
	} else {
		document.getElementById('nav1').innerHTML = Reuters.nav.scrubAssets(sReturn);
	}

	function fnCallback(e) {
		if (typeof(dcsMultiTrack) == "function") {
			dcsMultiTrack ('DCSext.VirtualEvent', '1', 'DCSext.rChannel', 'Top Nav', 'WT.cg_n', 'Top Nav - News and Markets Click', 'DCSext.modURL', this.href);
		}
	}

    var nav1 = document.getElementById('nav1');
    var elemList = nav1.getElementsByTagName('A');
    for (i=0; i< elemList.length; i++ ) {
        elemList[i].onclick = fnCallback;
    }
}

Reuters.nav.callback2 = function (sReturn) {
	if (Reuters.nav.baseUrlPrefix == '') {
		document.getElementById('nav2').innerHTML = Reuters.nav.scrubCommerceAssets(sReturn);
	} else {
		document.getElementById('nav2').innerHTML = Reuters.nav.scrubAssets(sReturn);
	}

	function fnCallback(e) {
		if (typeof(dcsMultiTrack) == "function") {
			dcsMultiTrack ('DCSext.VirtualEvent', '1', 'DCSext.rChannel', 'Top Nav', 'WT.cg_n', 'Top Nav - Sectors and Industries Click', 'DCSext.modURL', this.href);
		}
	}

    var nav2 = document.getElementById('nav2');
    var elemList = nav2.getElementsByTagName('A');
    for (i=0; i< elemList.length; i++ ) {
        elemList[i].onclick = fnCallback;
    }
}

Reuters.nav.callback3 = function (sReturn) {
	if (Reuters.nav.baseUrlPrefix == '') {
		document.getElementById('nav3').innerHTML = Reuters.nav.scrubCommerceAssets(sReturn);
	} else {
		document.getElementById('nav3').innerHTML = Reuters.nav.scrubAssets(sReturn);
	}
}

Reuters.nav.setup = function() {
	Reuters.nav.PRIMARY_SITE_URL = Reuters.nav.findEdition(Reuters.info.edition).link;
	Reuters.nav.registerEvents();
	Reuters.nav.sharedModulePrefix = '';
	if (Reuters.info.edition != "BETAUS") {
		Reuters.nav.sharedModulePrefix = Reuters.info.edition + "-";
	}
	Reuters.nav.flyoutScript1 = Reuters.nav.baseUrlPrefix + "/assets/sharedModuleJS?view=RSM-" + Reuters.nav.sharedModulePrefix + "NavFlyoutContent1&globalJSVariable=&callback=Reuters.nav.callback1&sp=" + Reuters.nav.baseUrlPrefix;
	Reuters.nav.flyoutScript2 = Reuters.nav.baseUrlPrefix + "/assets/sharedModuleJS?view=RSM-" + Reuters.nav.sharedModulePrefix + "NavFlyoutContent2&globalJSVariable=&callback=Reuters.nav.callback2&sp=" + Reuters.nav.baseUrlPrefix;
	Reuters.nav.flyoutScript3 = Reuters.nav.baseUrlPrefix + "/assets/sharedModuleJS?view=RSM-" + Reuters.nav.sharedModulePrefix + "NavFlyoutContent3&globalJSVariable=&callback=Reuters.nav.callback3&sp=" + Reuters.nav.baseUrlPrefix;
	if (Reuters.nav.scriptsLoaded == false) {
		Reuters.nav.loadScripts();
		if (Reuters.nav.isCommerce) {
			document.getElementById('searchForm').getAttributeNode("action").value = Reuters.nav.PRIMARY_SITE_URL + document.getElementById('searchForm').getAttributeNode("action").value;
		}
		Reuters.nav.scriptsLoaded = true;
	}
	/* Fix the "Reuters" logo on top */
	if (Reuters.nav.baseUrlPrefix != "") {
		document.getElementById('logoLink').href = Reuters.nav.baseUrlPrefix;
	} else if (Reuters.nav.isCommerce) {
		document.getElementById('logoLink').href = Reuters.nav.PRIMARY_SITE_URL;
	} else {
		document.getElementById('logoLink').href = '/';
	}
}

