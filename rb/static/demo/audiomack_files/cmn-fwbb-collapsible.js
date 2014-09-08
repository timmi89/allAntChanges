var fwbb_candy_name = fwbb_fullName + '-Banner-State';

// Cache elements
var fwbanner      = document.getElementById('fwbanner');
var fwbb_holder   = document.getElementById('fwbb_holder');
var fwbb_container;

var head_container = document.getElementById("cmn_ad_tag_head");

if (typeof(head_container) != 'undefined' && head_container != null) {
    fwbb_container = head_container;
}
else {
    fwbb_container = document.getElementById("fw_promo");
}

// load the banner into its initial state
function fwbb_init() {
	if (typeof fwbb_onAdReady === 'function') {
		fwbb_onAdReady();
	}
	
	var deviceClass = (fwbb_device === 'tablet') ? 'fwbb_istablet' : 'fwbb_isdesktop';
	fwbanner.className += ' ' + deviceClass;
	
	var state = fwbb_getCandy(fwbb_candy_name);
	if (state != null && state != "") {
		if (state == 'opened') {
			fwbb_expandAd();
		} else {
			fwbb_collapseAd();
		}
	} else {
		fwbb_expandAd();
	}
}

// expand banner
function fwbb_expandAd() {
	fwbb_holder.innerHTML = fwbb_expanded_src;
	fwbanner.style.backgroundImage = "url('"+fwbb_expanded_bg+"')";
	fwbanner.style.height = fwbb_expanded_height;
	fwbb_container.style.height = fwbb_expanded_height;
	fwbb_setCandy(fwbb_candy_name, 'opened', 6);
	if (typeof fwbb_onExpand === 'function') {
		fwbb_onExpand();
	}
}

// collapse banner
function fwbb_collapseAd() {
	fwbb_holder.innerHTML = fwbb_collapsed_src;
	fwbanner.style.backgroundImage = "url('"+fwbb_collapsed_bg+"')";
	fwbanner.style.height = fwbb_collapsed_height;
	fwbb_container.style.height = fwbb_collapsed_height;
	fwbb_setCandy(fwbb_candy_name, 'collapsed', 6);
	if (typeof fwbb_onCollapse === 'function') {
		fwbb_onCollapse();
	}
}

//set candy
function fwbb_setCandy(c_name,value,exhours) {  
    var now = new Date();
    var time = now.getTime();
    time += exhours * 3600 * 1000;
    now.setTime(time);
    var c_value=escape(value) + ((exhours==null) ? "" : "; expires="+now.toGMTString());
    document.cookie =c_name + "=" + c_value;
}

//get candy
function fwbb_getCandy(c_name) {
    var i,x,y,ARRcandies=document.cookie.split(";");
    for (i=0;i<ARRcandies.length;i++) {
        x=ARRcandies[i].substr(0,ARRcandies[i].indexOf("="));
        y=ARRcandies[i].substr(ARRcandies[i].indexOf("=")+1);
        x=x.replace(/^\s+|\s+$/g,"");
        if (x==c_name) {
            return unescape(y);
        }
    } 
}

// MANUAL expand
function fwbb_expand_and_track() {
	fwbb_expandAd();
	_gaq.push(['d._trackEvent', fwbb_campaign, fwbb_fullName, 'ExpandBanner']);
};

// MANUAL collapse
function fwbb_collapse_and_track() {
	fwbb_collapseAd();
	_gaq.push(['d._trackEvent', fwbb_campaign, fwbb_fullName, 'CollapseBanner']);
};

fwbb_init();