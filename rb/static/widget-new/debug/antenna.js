(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/Users/jburns/antenna/rb/static/widget-new/src/js/antenna.js":[function(require,module,exports){

var ScriptLoader = require('./script-loader');
var CssLoader = require('./css-loader');
var GroupSettingsLoader = require('./group-settings-loader');
var PageDataLoader = require('./page-data-loader');
var PageScanner = require('./page-scanner');
var PageData = require('./page-data');

function loadGroupSettings() {
    // Once we have the settings, we can kick off a couple things in parallel:
    //
    // -- start fetching the page data
    // -- start hashing the page and inserting the affordances (in the empty state)
    //
    //    Once these tasks complete, then we can update the affordances with the data and we're ready
    //    for action.
    GroupSettingsLoader.load(function(groupSettings) {
        fetchPageData(groupSettings);
        scanPage(groupSettings);
    });
}

function fetchPageData(groupSettings) {
    PageDataLoader.load(groupSettings, dataLoaded);
}

function scanPage(groupSettings) {
    PageScanner.scan(groupSettings, pageScanned);
}

var jsonData;
var isPageScanned = false;

function dataLoaded(json) {
    jsonData = json;
    if (jsonData && isPageScanned) {
        pageReady();
    }
}

function pageScanned() {
    isPageScanned = true;
    if (jsonData && isPageScanned) {
        pageReady();
    }
}

function pageReady() {
    // At this point, the container hashes have been computed, the affordances inserted, and the page data fetched.
    // Now update the summary widgets and affordances.

    PageData.updateAll(jsonData);

    // BOOM. The magic of Ractive. Now we just call PageData.update instead of all this.
    //for (var i = 0; i < pageData.length; i++) {
    //    var page = pageData[i];
    //    var hash = page.pageHash;
    //    // TODO extract attribute constants
    //    var $summaries = $('[ant-hash=\'' + hash + '\']');
    //    $summaries.each(function() {
    //        var $summary = $(this);
    //        var summaryRactive = SummaryWidget.create($summary, page); // TODO: multiple instances
    //    })
    //}
}

// TODO the cascade is pretty clear, but can we orchestrate this better?
ScriptLoader.load(loadGroupSettings);
CssLoader.load();
},{"./css-loader":"/Users/jburns/antenna/rb/static/widget-new/src/js/css-loader.js","./group-settings-loader":"/Users/jburns/antenna/rb/static/widget-new/src/js/group-settings-loader.js","./page-data":"/Users/jburns/antenna/rb/static/widget-new/src/js/page-data.js","./page-data-loader":"/Users/jburns/antenna/rb/static/widget-new/src/js/page-data-loader.js","./page-scanner":"/Users/jburns/antenna/rb/static/widget-new/src/js/page-scanner.js","./script-loader":"/Users/jburns/antenna/rb/static/widget-new/src/js/script-loader.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/css-loader.js":[function(require,module,exports){

var baseUrl = 'http://localhost:8081'; // TODO compute this

function loadCss() {
    var head = document.getElementsByTagName('head')[0];
    if (head) {
        // To make sure none of our content renders on the page before our CSS is loaded, we append a simple inline style
        // element that turns off our elements *before* our CSS links. This exploits the cascade rules - our CSS files appear
        // after the inline style in the document, so they take precedence (and make everything appear) once they're loaded.
        var styleTag = document.createElement('style');
        styleTag.innerHTML = '.antenna{display:none;}';
        head.appendChild(styleTag);

        var cssHrefs = [
            baseUrl + '/static/widget-new/debug/antenna.css' // TODO this needs a final path. CDN for production and local file for development?
        ];
        for (var i = 0; i < cssHrefs.length; i++) {
            loadFile(cssHrefs[i], head);
        }
    }
}

function loadFile(href, head) {
    var linkTag = document.createElement('link');
    linkTag.setAttribute('href', href);
    linkTag.setAttribute('rel', 'stylesheet');
    linkTag.setAttribute('type', 'text/css');
    head.appendChild(linkTag);
}

module.exports = {
    load : loadCss
};
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/js/group-settings-loader.js":[function(require,module,exports){

var GroupSettings = require('./group-settings');
var $; require('./script-loader').on$(function(jQuery) { $=jQuery; });

// TODO fold this module into group-settings?

function loadSettings(callback) {
    $.getJSONP('/api/settings', { host_name: window.antenna_host }, success, error);

    function success(json) {
        var groupSettings = GroupSettings.create(json);
        callback(groupSettings);
    }

    function error(message) {
        // TODO handle errors that happen when loading config data
    }
}

//noinspection JSUnresolvedVariable
module.exports = {
    load: loadSettings
};
},{"./group-settings":"/Users/jburns/antenna/rb/static/widget-new/src/js/group-settings.js","./script-loader":"/Users/jburns/antenna/rb/static/widget-new/src/js/script-loader.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/group-settings.js":[function(require,module,exports){

var $;
require('./script-loader').on$(function(jQuery) {
    $=jQuery;
});

// TODO: trim trailing commas from any selector values

// TODO: Review. These are just copied from engage_full.
var defaults = {
        premium: false,
        img_selector: "img",
        img_container_selectors:"#primary-photo",
        active_sections: "body",
        anno_whitelist: "body p",
        active_sections_with_anno_whitelist:"",
        media_selector: "embed, video, object, iframe",
        comment_length: 500,
        no_ant: "",
        img_blacklist: "",
        custom_css: "",
        //todo: temp inline_indicator defaults to make them show up on all media - remove this later.
        inline_selector: 'img, embed, video, object, iframe',
        paragraph_helper: true,
        media_url_ignore_query: true,
        summary_widget_selector: '.ant-page-summary', // TODO: this wasn't defined as a default in engage_full, but was in code. why?
        summary_widget_method: 'after',
        language: 'en',
        ab_test_impact: true,
        ab_test_sample_percentage: 10,
        img_indicator_show_onload: true,
        img_indicator_show_side: 'left',
        tag_box_bg_colors: '#18414c;#376076;215, 179, 69;#e6885c;#e46156',
        tag_box_text_colors: '#fff;#fff;#fff;#fff;#fff',
        tag_box_font_family: 'HelveticaNeue,Helvetica,Arial,sans-serif',
        tags_bg_css: '',
        ignore_subdomain: false,
        //the scope in which to find parents of <br> tags.
        //Those parents will be converted to a <rt> block, so there won't be nested <p> blocks.
        //then it will split the parent's html on <br> tags and wrap the sections in <p> tags.

        //example:
        // br_replace_scope_selector: ".ant_br_replace" //e.g. "#mainsection" or "p"

        br_replace_scope_selector: null //e.g. "#mainsection" or "p"
    };

function createFromJSON(json) {

    function data(key) {
        return function() {
            var value = window.antenna_extend[key];
            if (value == undefined) {
                value = json[key];
                if (value === undefined || value === '') { // TODO: Should the server be sending back '' here or nothing at all? (It precludes the server from really saying 'nothing')
                    value = defaults[key];
                }
            }
            return value;
        };
    }

    return {
        groupId: data('id'),
        activeSections: data('active_sections'),
        url: {
            ignoreSubdomain: data('ignore_subdomain'),
            canonicalDomain: data('page_tld') // TODO: what to call this exactly. groupDomain? siteDomain? canonicalDomain?
        },
        summarySelector: data('summary_widget_selector'),
        summaryMethod: data('summary_widget_method'),
        pageSelector: data('post_selector'),
        pageHrefSelector: data('post_href_selector'),
        textSelector: data('anno_whitelist')
    }
}

//noinspection JSUnresolvedVariable
module.exports = {
    create: createFromJSON
};
},{"./script-loader":"/Users/jburns/antenna/rb/static/widget-new/src/js/script-loader.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/hash.js":[function(require,module,exports){

var MD5 = require('./md5');

// TODO: This is just copy/pasted from engage_full
// TODO: The code is looking for .ant_indicator to see if it's already been hashed. Review.
function getCleanText($domNode) {
    // ANT.util.getCleanText
    // common function for cleaning the text node text.  right now, it's removing spaces, tabs, newlines, and then double spaces

    var $node = $domNode.clone();

    $node.find('.ant, .ant-custom-cta-container').remove();

    //make sure it doesnt alredy have in indicator - it shouldn't.
    var $indicator = $node.find('.ant_indicator');
    if($indicator.length){
        //todo: send us an error report - this may still be happening for slideshows.
        //This fix works fine, but we should fix the code to handle it before here.
        return;
    }

    // get the node's text and smash case
    // TODO: <br> tags and block-level tags can screw up words.  ex:
    // hello<br>how are you?   here becomes
    // hellohow are you?    <-- no space where the <br> was.  bad.
    var node_text = $.trim( $node.html().replace(/< *br *\/?>/gi, ' ') );
    var body = $.trim( $( "<div>" + node_text + "</div>" ).text().toLowerCase() );

    if( body && typeof body == "string" && body !== "" ) {
        var firstpass = body.replace(/[\n\r\t]+/gi,' ').replace().replace(/\s{2,}/g,' ');
        // seeing if this helps the propub issue - to trim again.  When i run this line above it looks like there is still white space.
        return $.trim(firstpass);
    }
}

function hashText(element) {
    // TODO: Handle the case where multiple instances of the same text appear on the page. Need to add an increment to
    // the hashText. (This check has to be scoped to a post)
    var text = getCleanText(element);
    var hashText = "rdr-text-"+text;
    return MD5.hex_md5(hashText);
}

function hashUrl(url) {
    return MD5.hex_md5(url);
}

function hashImage(element) {

}

function hashMedia(element) {

}

function hashElement(element) {
    // TODO make real
    return 'abc';
}

//noinspection JSUnresolvedVariable
module.exports = {
    hashText: hashText,
    hashUrl: hashUrl
};
},{"./md5":"/Users/jburns/antenna/rb/static/widget-new/src/js/md5.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/md5.js":[function(require,module,exports){

// TODO: This code is just copied from engage_full.js. Review whether we want to keep it as-is.

var ANT = {
    util: {
        md5: {
            hexcase:0,
            b64pad:"",
            chrsz:8,
            hex_md5: function(s){return ANT.util.md5.binl2hex(ANT.util.md5.core_md5(ANT.util.md5.str2binl(s),s.length*ANT.util.md5.chrsz));},
            core_md5: function(x,len){x[len>>5]|=0x80<<((len)%32);x[(((len+64)>>>9)<<4)+14]=len;var a=1732584193;var b=-271733879;var c=-1732584194;var d=271733878;for(var i=0;i<x.length;i+=16){var olda=a;var oldb=b;var oldc=c;var oldd=d;a=ANT.util.md5.md5_ff(a,b,c,d,x[i+0],7,-680876936);d=ANT.util.md5.md5_ff(d,a,b,c,x[i+1],12,-389564586);c=ANT.util.md5.md5_ff(c,d,a,b,x[i+2],17,606105819);b=ANT.util.md5.md5_ff(b,c,d,a,x[i+3],22,-1044525330);a=ANT.util.md5.md5_ff(a,b,c,d,x[i+4],7,-176418897);d=ANT.util.md5.md5_ff(d,a,b,c,x[i+5],12,1200080426);c=ANT.util.md5.md5_ff(c,d,a,b,x[i+6],17,-1473231341);b=ANT.util.md5.md5_ff(b,c,d,a,x[i+7],22,-45705983);a=ANT.util.md5.md5_ff(a,b,c,d,x[i+8],7,1770035416);d=ANT.util.md5.md5_ff(d,a,b,c,x[i+9],12,-1958414417);c=ANT.util.md5.md5_ff(c,d,a,b,x[i+10],17,-42063);b=ANT.util.md5.md5_ff(b,c,d,a,x[i+11],22,-1990404162);a=ANT.util.md5.md5_ff(a,b,c,d,x[i+12],7,1804603682);d=ANT.util.md5.md5_ff(d,a,b,c,x[i+13],12,-40341101);c=ANT.util.md5.md5_ff(c,d,a,b,x[i+14],17,-1502002290);b=ANT.util.md5.md5_ff(b,c,d,a,x[i+15],22,1236535329);a=ANT.util.md5.md5_gg(a,b,c,d,x[i+1],5,-165796510);d=ANT.util.md5.md5_gg(d,a,b,c,x[i+6],9,-1069501632);c=ANT.util.md5.md5_gg(c,d,a,b,x[i+11],14,643717713);b=ANT.util.md5.md5_gg(b,c,d,a,x[i+0],20,-373897302);a=ANT.util.md5.md5_gg(a,b,c,d,x[i+5],5,-701558691);d=ANT.util.md5.md5_gg(d,a,b,c,x[i+10],9,38016083);c=ANT.util.md5.md5_gg(c,d,a,b,x[i+15],14,-660478335);b=ANT.util.md5.md5_gg(b,c,d,a,x[i+4],20,-405537848);a=ANT.util.md5.md5_gg(a,b,c,d,x[i+9],5,568446438);d=ANT.util.md5.md5_gg(d,a,b,c,x[i+14],9,-1019803690);c=ANT.util.md5.md5_gg(c,d,a,b,x[i+3],14,-187363961);b=ANT.util.md5.md5_gg(b,c,d,a,x[i+8],20,1163531501);a=ANT.util.md5.md5_gg(a,b,c,d,x[i+13],5,-1444681467);d=ANT.util.md5.md5_gg(d,a,b,c,x[i+2],9,-51403784);c=ANT.util.md5.md5_gg(c,d,a,b,x[i+7],14,1735328473);b=ANT.util.md5.md5_gg(b,c,d,a,x[i+12],20,-1926607734);a=ANT.util.md5.md5_hh(a,b,c,d,x[i+5],4,-378558);d=ANT.util.md5.md5_hh(d,a,b,c,x[i+8],11,-2022574463);c=ANT.util.md5.md5_hh(c,d,a,b,x[i+11],16,1839030562);b=ANT.util.md5.md5_hh(b,c,d,a,x[i+14],23,-35309556);a=ANT.util.md5.md5_hh(a,b,c,d,x[i+1],4,-1530992060);d=ANT.util.md5.md5_hh(d,a,b,c,x[i+4],11,1272893353);c=ANT.util.md5.md5_hh(c,d,a,b,x[i+7],16,-155497632);b=ANT.util.md5.md5_hh(b,c,d,a,x[i+10],23,-1094730640);a=ANT.util.md5.md5_hh(a,b,c,d,x[i+13],4,681279174);d=ANT.util.md5.md5_hh(d,a,b,c,x[i+0],11,-358537222);c=ANT.util.md5.md5_hh(c,d,a,b,x[i+3],16,-722521979);b=ANT.util.md5.md5_hh(b,c,d,a,x[i+6],23,76029189);a=ANT.util.md5.md5_hh(a,b,c,d,x[i+9],4,-640364487);d=ANT.util.md5.md5_hh(d,a,b,c,x[i+12],11,-421815835);c=ANT.util.md5.md5_hh(c,d,a,b,x[i+15],16,530742520);b=ANT.util.md5.md5_hh(b,c,d,a,x[i+2],23,-995338651);a=ANT.util.md5.md5_ii(a,b,c,d,x[i+0],6,-198630844);d=ANT.util.md5.md5_ii(d,a,b,c,x[i+7],10,1126891415);c=ANT.util.md5.md5_ii(c,d,a,b,x[i+14],15,-1416354905);b=ANT.util.md5.md5_ii(b,c,d,a,x[i+5],21,-57434055);a=ANT.util.md5.md5_ii(a,b,c,d,x[i+12],6,1700485571);d=ANT.util.md5.md5_ii(d,a,b,c,x[i+3],10,-1894986606);c=ANT.util.md5.md5_ii(c,d,a,b,x[i+10],15,-1051523);b=ANT.util.md5.md5_ii(b,c,d,a,x[i+1],21,-2054922799);a=ANT.util.md5.md5_ii(a,b,c,d,x[i+8],6,1873313359);d=ANT.util.md5.md5_ii(d,a,b,c,x[i+15],10,-30611744);c=ANT.util.md5.md5_ii(c,d,a,b,x[i+6],15,-1560198380);b=ANT.util.md5.md5_ii(b,c,d,a,x[i+13],21,1309151649);a=ANT.util.md5.md5_ii(a,b,c,d,x[i+4],6,-145523070);d=ANT.util.md5.md5_ii(d,a,b,c,x[i+11],10,-1120210379);c=ANT.util.md5.md5_ii(c,d,a,b,x[i+2],15,718787259);b=ANT.util.md5.md5_ii(b,c,d,a,x[i+9],21,-343485551);a=ANT.util.md5.safe_add(a,olda);b=ANT.util.md5.safe_add(b,oldb);c=ANT.util.md5.safe_add(c,oldc);d=ANT.util.md5.safe_add(d,oldd);} return Array(a,b,c,d);},
            md5_cmn: function(q,a,b,x,s,t){return ANT.util.md5.safe_add(ANT.util.md5.bit_rol(ANT.util.md5.safe_add(ANT.util.md5.safe_add(a,q),ANT.util.md5.safe_add(x,t)),s),b);},
            md5_ff: function(a,b,c,d,x,s,t){return ANT.util.md5.md5_cmn((b&c)|((~b)&d),a,b,x,s,t);},
            md5_gg: function(a,b,c,d,x,s,t){return ANT.util.md5.md5_cmn((b&d)|(c&(~d)),a,b,x,s,t);},
            md5_hh: function(a,b,c,d,x,s,t){return ANT.util.md5.md5_cmn(b^c^d,a,b,x,s,t);},
            md5_ii: function(a,b,c,d,x,s,t){return ANT.util.md5.md5_cmn(c^(b|(~d)),a,b,x,s,t);},
            safe_add: function(x,y){var lsw=(x&0xFFFF)+(y&0xFFFF);var msw=(x>>16)+(y>>16)+(lsw>>16);return(msw<<16)|(lsw&0xFFFF);},
            bit_rol: function(num,cnt){return(num<<cnt)|(num>>>(32-cnt));},
            //the line below is called out by jsLint because it uses Array() instead of [].  We can ignore, or I'm sure we could change it if we wanted to.
            str2binl: function(str){var bin=Array();var mask=(1<<ANT.util.md5.chrsz)-1;for(var i=0;i<str.length*ANT.util.md5.chrsz;i+=ANT.util.md5.chrsz){bin[i>>5]|=(str.charCodeAt(i/ANT.util.md5.chrsz)&mask)<<(i%32);}return bin;},
            binl2hex: function(binarray){var hex_tab=ANT.util.md5.hexcase?"0123456789ABCDEF":"0123456789abcdef";var str="";for(var i=0;i<binarray.length*4;i++){str+=hex_tab.charAt((binarray[i>>2]>>((i%4)*8+4))&0xF)+hex_tab.charAt((binarray[i>>2]>>((i%4)*8))&0xF);} return str;}
        }
    }
};

//noinspection JSUnresolvedVariable
module.exports = {
    hex_md5: ANT.util.md5.hex_md5
};
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/js/page-data-loader.js":[function(require,module,exports){

var URLs = require('./utils/urls');
var $; require('./script-loader').on$(function(jQuery) { $=jQuery; });


function computePageTitle() {
    // TODO: How are page titles computed with multiple pages? The code below computes the title for a top-level page.
    var title = $('meta[property="og:title"]').attr('content');
    if (!title) {
        title = $('title').text() || '';
    }
    return $.trim(title);
}


// Compute the pages that we need to fetch. This is either:
// 1. Any nested pages we find using the page selector OR
// 2. The current window location
function computePagesParam(groupSettings) {
    var pages = [];

    var groupId = groupSettings.groupId();
    var $pageElements = $(groupSettings.pageSelector());
    // TODO: Compare this execution flow to what happens in engage_full.js. Here we treat the body element as a page so
    // the flow is the same for both cases. Is there a reason engage_full.js branches here instead and treats these so differently?
    if ($pageElements.length == 0) {
        $pageElements = $('body');
    }
    $pageElements.each(function() {
        var $pageElement = $(this);
        pages.push({
            group_id: groupId,
            url: URLs.computePageUrl($pageElement, groupSettings),
            canonical_url: URLs.computeCanonicalUrl($pageElement, groupSettings),
            image: '', // TODO
            title: computePageTitle() // TODO: This code only works for the top-level page. See computePageTitle()
        });
    });

    return pages;
}

function loadPageData(groupSettings, callback) {
    var pagesParam = computePagesParam(groupSettings);
    $.getJSONP('/api/page', { pages: pagesParam }, success, error);

    function success(json) {
        callback(json);
    }

    function error(message) {
        // TODO handle errors that happen when loading page data
    }
}

//noinspection JSUnresolvedVariable
module.exports = {
    load: loadPageData
};
},{"./script-loader":"/Users/jburns/antenna/rb/static/widget-new/src/js/script-loader.js","./utils/urls":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/urls.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/page-data.js":[function(require,module,exports){

var $; require('./script-loader').on$(function(jQuery) { $=jQuery; });

var pages = {};

function getPageData(hash) {
    var pageData = pages[hash];
    if (!pageData) {
        // TODO: Give this serious thought. In order for magic mode to work, the object needs to have values in place for
        // the observed properties at the moment the ractive is created. But this is pretty unusual for Javascript, to have
        // to define the whole skeleton for the object instead of just adding properties whenever you want.
        // The alternative would be for us to keep our own "data binding" between the pageData and ractive instances (1 to many)
        // and tell the ractives to update whenever the data changes.
        pageData = {
            pageHash: hash,
            summary: {}
        };
        pages[hash] = pageData;
    }
    return pageData;
}

function updateAllPageData(jsonPages) {
    for (var i = 0; i < jsonPages.length; i++) {
        updatePageData(jsonPages[i]);
    }
}

function updatePageData(json) {
    var pageData = getPageData(json.urlhash);

    var numReactions = 0;
    var numComments = 0;
    var numShares = 0;

    var summaryEntries = json.summary;
    if (summaryEntries) {
        for (var i = 0; i < summaryEntries.length; i++) {
            var summaryEntry = summaryEntries[i];
            if (summaryEntry.kind === 'tag') {
                numReactions = summaryEntry.count;
            } else if (summaryEntry.kind === 'com') {
                numComments = summaryEntry.count;
            } else if (summaryEntry.kind === 'shr') {
                numShares = summaryEntry.count;
            }
        }
    }

    var topReactions = [];
    var reactionsData = json.toptags;
    if (reactionsData) {
        for (var j = 0; j < reactionsData.length; j++) {
            var reaction = reactionsData[j];
            topReactions[j] = {
                id: reaction.id,
                count: reaction.tag_count,
                text: reaction.body
            }
        }
    }

    // TODO Consider supporting incremental update of data that we already have from the server. That would mean only
    // updating fields in the local object if they exist in the json data.
    pageData.pageId = json.id;
    pageData.summary = {
        totalReactions: numReactions,
        totalComments: numComments,
        totalShares: numShares
    };
    pageData.topReactions = topReactions;
    pageData.containers = json.containers; // array of objects with 'id' and 'hash' properties, including the magic 'page' hash value
}

//noinspection JSUnresolvedVariable
module.exports = {
    get: getPageData,
    updateAll: updateAllPageData
};
},{"./script-loader":"/Users/jburns/antenna/rb/static/widget-new/src/js/script-loader.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/page-reactions-loader.js":[function(require,module,exports){

//var $ = require('./jquery');
var $;
require('./script-loader').on$(function(jQuery) {
    $=jQuery;
});

// TODO this is just random incomplete snippets

function createPageParam(groupSettings) {
    return {
        group_id: groupSettings.id,
        url: '',
        canonical_url: '',
        title: '',
        image: ''
    };
}



function loadPage(settings) {
    alert(JSON.stringify(settings, null, 2));
    $.getJSONP('/api/page', {
            pages: [{
                group_id: settings.id,

            }]
        }, function(pages) {
            alert(JSON.stringify(pages, null, 2));
        });

}

function loadPages() {

}

//noinspection JSUnresolvedVariable
module.exports = {
    loadPage: loadPage,
    loadPages: loadPages
};
},{"./script-loader":"/Users/jburns/antenna/rb/static/widget-new/src/js/script-loader.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/page-scanner.js":[function(require,module,exports){

var $; require('./script-loader').on$(function(jQuery) { $=jQuery; });
var Templates = require('./templates');
var Hash = require('./hash');
var URLs = require('./utils/urls');
var SummaryWidget = require('./summary-widget');
var PageData = require('./page-data');

var indicatorMap = {};

// Scan for all pages at the current browser location. This could just be the current page or it could be a collection
// of pages (aka 'posts').
function scanAllPages(groupSettings, callback) {
    var $pages = $(groupSettings.pageSelector());
    if ($pages.length == 0) {
        // If we don't detect any page markers, treat the whole document as the single page
        $pages = $('body'); // TODO Is this the right behavior?
    }
    $pages.each(function() {
        var $page = $(this);
        scanPage($page, groupSettings);
    });
    callback();
}

// Scan the page using the given settings:
// 1. Find all the containers that we care about.
// 2. Insert widget affordances for each.
// 3. Compute hashes for each container.
function scanPage($page, groupSettings) {

    // First, scan for elements that would cause us to insert something into the DOM that takes up space.
    // We want to get any page resizing out of the way as early as possible.
    // TODO: Consider doing this with raw Javascript before jQuery loads, to further reduce the delay. We wouldn't
    // save a *ton* of time from this, though, so it's definitely a later optimization.
    scanForSummaries($page, groupSettings);
    scanForCallsToAction($page, groupSettings);

    var $activeSections = $page.find(groupSettings.activeSections());
    $activeSections.each(function() {
        var $section = $(this);
        // Then scan for everything else
        scanForText($section, groupSettings);
        scanForImages($section, groupSettings);
        scanForMedia($section, groupSettings);
    });
}

function scanForSummaries($element, groupSettings) {
    var url = URLs.computePageUrl($element, groupSettings);
    var urlHash = Hash.hashUrl(url);

    var $summaries = $element.find(groupSettings.summarySelector());
    $summaries.each(function() {
        // TODO: compute the url hash for the page, either using the page selector or the window location. See engage_full:4226
        //       attach the url to the indicator as an attribute
        //       add the element to the indicator map
        //       ...then we can instantiate the SummaryWidget ractive based on the hash once the data is loaded
        var $summary = $(this);
        //insertContent($summary, Templates.summary(urlHash), groupSettings.summaryMethod());
        var container = $('<div></div>');
        var summaryWidget = SummaryWidget.create(container, PageData.get(urlHash)); // TODO stash this away somewhere
        insertContent($summary, container, groupSettings.summaryMethod());
    });
}

function scanForCallsToAction($section, groupSettings) {
    // TODO
}

function scanForText($section, groupSettings) {
    var $textElements = $section.find(groupSettings.textSelector());
    // TODO: only select "leaf" elements
    $textElements.each(function() {
        var $element = $(this);
        // TODO position correctly
        // TODO hash and add hash data to indicator
        var hash = Hash.hashText($element);
        $element.append(Templates.indicator(hash));
    });
}

function scanForImages($section, groupSettings) {
    // TODO
}

function scanForMedia($section, groupSettings) {
    // TODO
}

function insertContent($parent, content, method) {
    switch (method) {
        case 'append':
            $parent.append(content);
            break;
        case 'prepend':
            $parent.prepend(content);
            break;
        case 'before':
            $parent.before(content);
            break;
        case 'after':
            $parent.after(content);
            break;
    }
}

//noinspection JSUnresolvedVariable
module.exports = {
   scan: scanAllPages
};
},{"./hash":"/Users/jburns/antenna/rb/static/widget-new/src/js/hash.js","./page-data":"/Users/jburns/antenna/rb/static/widget-new/src/js/page-data.js","./script-loader":"/Users/jburns/antenna/rb/static/widget-new/src/js/script-loader.js","./summary-widget":"/Users/jburns/antenna/rb/static/widget-new/src/js/summary-widget.js","./templates":"/Users/jburns/antenna/rb/static/widget-new/src/js/templates.js","./utils/urls":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/urls.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/reactions-widget.js":[function(require,module,exports){


var ractive;

function createReactionsWidget(container, reactionsData) {
    var layoutClasses = computeLayoutClasses(reactionsData);
    ractive = Ractive({
        el: container,
        data: {
            reactions: reactionsData,
            layoutClass: function(index) {
                return layoutClasses[index];
            }
        },
        template: require('../templates/reactions-widget.html'),
        oncomplete: function() {
            var that = this;
            $(rootElement())
                .on('mouseover', keepWindowOpen)
                .on('mouseout', delayedCloseWindow);
        }
    });
    return {
        open: openWindow,
        close: closeWindow,
        delayedClose: delayedCloseWindow
    };
}

function computeLayoutClasses(reactionsData) {
    // TODO Verify that the reactionsData is coming back from the server sorted. If not, sort it after its fetched.

    var numReactions = reactionsData.length;
    // TODO: Copied code from engage_full.createTagBuckets
    var max = reactionsData[0].count;
    var median = reactionsData[ Math.floor(reactionsData.length/2) ].count;
    var min = reactionsData[ reactionsData.length-1 ].count;
    var total = 0;
    for (var i = 0; i < numReactions; i++) {
        total += reactionsData[i];
    }
    var average = Math.floor(total / numReactions);
    var midValue = ( median > average ) ? median : average;

    var layoutClasses = [];
    for (var i = 0; i < numReactions; i++) {
        if (reactionsData[i].count > midValue) {
            layoutClasses[i] = 'full';
        } else {
            layoutClasses[i] = 'half';
        }
    }
    return layoutClasses;
}

function rootElement() {
    // TODO: gotta be a better way to get this
    return ractive.find('div');
}

function openWindow(relativeElement) {
    if (ractive) {
        var offset = $(relativeElement).offset();
        var coords = {
            top: offset.top,
            left: offset.left
        };
        var $element = $(rootElement());
        $element.stop(true, true).addClass('open').css(coords);
    }

}

var closeTimer;

function keepWindowOpen() {
    if (closeTimer) { closeTimer.clearTimeout(); }
}

function delayedCloseWindow() {
    closeTimer = setTimeout(function() {
        closeTimer = null;
        closeWindow();
    }, 1500);
}

function closeWindow() {
    var $element = $(ractive.find('div'));
    $element.stop(true, true).fadeOut('fast', function() {
        $element.css('display', ''); // Clear the display:none that fadeOut puts on the element
        $element.removeClass('open');
    });
}

module.exports = {
    create: createReactionsWidget
};
},{"../templates/reactions-widget.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/reactions-widget.html"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/script-loader.js":[function(require,module,exports){

var baseUrl = 'http://localhost:8081'; // TODO compute this

var $;
var jQueryCallbacks = [];

function on$(callback) {
    if ($) {
        callback($);
    } else {
        jQueryCallbacks.push(callback);
    }
}

function jQueryLoaded() {
    // Update the $ that we define within our own closure to the version of jQuery that we want and reset the global $
    $ = jQuery.noConflict(true);

    $.getJSONP = function(url, data, success, error) {
        var options = {
            url: baseUrl + url, // TODO base url
            type: "get",
            contentType: "application/json",
            dataType: "jsonp",
            success: function(response, textStatus, XHR) {
                // TODO: Revisit whether it's really cool to key this on the textStatus or if we should be looking at
                //       the status code in the XHR
                if (textStatus === 'success') {
                    success(response.data);
                } else {
                    // For JSONP requests, jQuery doesn't call it's error callback. It calls success instead.
                    error(response.message);
                }
            }
        };
        if (data) {
            options.data = { json: JSON.stringify(data) };
        }
        $.ajax(options);
    };

    while (jQueryCallbacks.length > 0) {
        jQueryCallbacks.pop()($);
    }
}

function loadScripts(loadedCallback) {
    var scripts = [
        {src: '//cdnjs.cloudflare.com/ajax/libs/jquery/2.1.4/jquery.min.js', callback: jQueryLoaded},
        {src: '//cdnjs.cloudflare.com/ajax/libs/ractive/0.7.3/ractive.runtime.min.js'}
    ];
    // TODO: key this off some kind of flag.
    if (document.currentScript.src === 'http://localhost:8081/static/widget-new/debug/antenna.js') {
        // Use the offline versions of the libraries for development.
        scripts = [
            {src: baseUrl + '/static/js/cdn/jquery/2.1.4/jquery.min.js', callback: jQueryLoaded},
            {src: baseUrl + '/static/js/cdn/ractive/0.7.3/ractive.runtime.min.js'}
        ];
    }
    var loadingCount = scripts.length;
    for (var i = 0; i < scripts.length; i++) {
        var script = scripts[i];
        loadScript(script.src, function(scriptCallback) {
            return function() {
                if (scriptCallback) scriptCallback();
                loadingCount = loadingCount - 1;
                if (loadingCount == 0) {
                    if (loadedCallback) loadedCallback();
                }
            };
        } (script.callback));
    }
}

function loadScript(src, callback) {
    var head = document.getElementsByTagName('head')[0];
    if (head) {
        var scriptTag = document.createElement('script');
        scriptTag.setAttribute('src', src);
        scriptTag.setAttribute('type','text/javascript');

        if (scriptTag.readyState) { // IE, incl. IE9
            scriptTag.onreadystatechange = function() {
                if (scriptTag.readyState == "loaded" || scriptTag.readyState == "complete") {
                    scriptTag.onreadystatechange = null;
                    callback();
                }
            };
        } else {
            scriptTag.onload = function() { // Other browsers
                callback();
            };
        }

        head.appendChild(scriptTag);
    }
}

//noinspection JSUnresolvedVariable
module.exports = {
    load: loadScripts,
    on$: on$
};
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/js/summary-widget.js":[function(require,module,exports){

var ReactionsWidget = require('./reactions-widget');

var ractive;
var reactionsWidget;

function createSummaryWidget(container, pageData) {
    //// TODO replace element
    ractive = Ractive({
        el: container,
        data: pageData,
        magic: true,
        template: require('../templates/summary-widget.html'),
        complete: function() {
            var that = this;
            $(rootElement()).on('click', function(event) {
               that.add('summary.totalReactions');
            });
            $(rootElement()).on('mouseenter', function(event) {
               openReactionsWindow(pageData);
            });
        }
    });
    return ractive;
}

function rootElement() {
    // TODO: gotta be a better way to get this
    return ractive.find('div');
}

function openReactionsWindow(pageData) {
    if (!reactionsWidget) {
        // TODO: consider prepopulating this
        var bucket = getWidgetBucket();
        var container = document.createElement('div');
        bucket.appendChild(container);
        reactionsWidget = ReactionsWidget.create(container, pageData.topReactions);
    }
    reactionsWidget.open(rootElement());
}

function getWidgetBucket() {
    var bucket = document.getElementById('antenna-widget-bucket');
    if (!bucket) {
        bucket = document.createElement('div');
        bucket.setAttribute('id', 'antenna-widget-bucket');
        document.body.appendChild(bucket);
    }
    return bucket;
}

module.exports = {
    create: createSummaryWidget
};
},{"../templates/summary-widget.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/summary-widget.html","./reactions-widget":"/Users/jburns/antenna/rb/static/widget-new/src/js/reactions-widget.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/templates.js":[function(require,module,exports){


// TODO use actual templates. :)

function indicator(hash) {
    return $('<div style="width:20px; height: 20px; border-radius:20px; background-color: red; float:right;" ' +
            'ant-hash="' + hash + '"></div>');
}

function summary(hash) {
    return $('<div style="min-width:50px; height: 20px; border-radius:3px; background-color: blue; float:left;"' + ' ant-hash="' + hash + '"></div>');
}

//noinspection JSUnresolvedVariable
module.exports = {
    indicator: indicator,
    summary: summary
};
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/urls.js":[function(require,module,exports){

var $; require('../script-loader').on$(function(jQuery) { $=jQuery; });

// TODO copied from engage_full. Review.
function computePageUrl(groupSettings) {
    var page_url = $.trim( window.location.href.split('#')[0] ).toLowerCase(); // TODO should pass this in instead of recomputing
    return removeSubdomainFromPageUrl(page_url, groupSettings);
}

// TODO copied from engage_full. Review.
function computeTopLevelCanonicalUrl(groupSettings) {
    var page_url = $.trim( window.location.href.split('#')[0] ).toLowerCase(); // TODO should pass this in instead of recomputing
    var canonical_url = ( $('link[rel="canonical"]').length > 0 ) ?
                $('link[rel="canonical"]').attr('href') : page_url;

    // ant:url overrides
    if ( $('[property="antenna:url"]').length > 0 ) {
        canonical_url = $('[property="antenna:url"]').attr('content');
    }

    canonical_url = $.trim( canonical_url.toLowerCase() );

    if (canonical_url == computePageUrl(groupSettings) ) { // TODO should pass this in instead of recomputing
        canonical_url = "same";
    }

    // fastco fix (since they sometimes rewrite their canonical to simply be their TLD.)
    // in the case where canonical claims TLD but we're actually on an article... set canonical to be the page_url
    var tld = $.trim(window.location.protocol+'//'+window.location.hostname+'/').toLowerCase();
    if ( canonical_url == tld ) {
        if (page_url != tld) {
            canonical_url = page_url;
        }
    }

    return removeSubdomainFromPageUrl($.trim(canonical_url), groupSettings);
}

function computePageElementCanonicalUrl($pageElement, groupSettings) {
    // TODO Review against engage_full. There, the nested pages and top-level page have a totally different flow. Does this
    // unification work? The idea is that the nested pages would have an href selector that specifies the URL to use, so we
    // just use it. But compute the url for the top-level case explicitly.
    if ($pageElement.find(groupSettings.pageHrefSelector()).length > 0) {
        return 'same';
    } else {
        return computeTopLevelCanonicalUrl(groupSettings);
    }
}

function computePageElementUrl($pageElement, groupSettings) {
    var url = $pageElement.find(groupSettings.pageHrefSelector()).attr('href');
    if (!url) {
        url = $.trim( window.location.href.split('#')[0] ).toLowerCase(); // top-level page url
    }
    return removeSubdomainFromPageUrl(url, groupSettings);
}

// TODO copied from engage_full. Review.
function removeSubdomainFromPageUrl(url, groupSettings) {
    // ANT.actions.removeSubdomainFromPageUrl:
    // if "ignore_subdomain" is checked in settings, AND they supply a TLD,
    // then modify the page and canonical URLs here.
    // have to have them supply one because there are too many variations to reliably strip subdomains  (.com, .is, .com.ar, .co.uk, etc)
    if (groupSettings.url.ignoreSubdomain() == true && groupSettings.url.canonicalDomain()) {
        var HOSTDOMAIN = /[-\w]+\.(?:[-\w]+\.xn--[-\w]+|[-\w]{2,}|[-\w]+\.[-\w]{2})$/i;
        var srcArray = url.split('/');

        var protocol = srcArray[0];
        srcArray.splice(0,3);

        var returnUrl = protocol + '//' + groupSettings.url.canonicalDomain() + '/' + srcArray.join('/');

        return returnUrl;
    } else {
        return url;
    }
}

module.exports = {
    computePageUrl: computePageElementUrl,
    computeCanonicalUrl: computePageElementCanonicalUrl
};
},{"../script-loader":"/Users/jburns/antenna/rb/static/widget-new/src/js/script-loader.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/templates/reactions-widget.html":[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna antenna-reactions-widget"},"f":[{"t":7,"e":"div","a":{"class":"antenna-header"},"f":[]}," ",{"t":7,"e":"div","a":{"class":"antenna-body"},"f":[{"t":4,"f":[{"t":7,"e":"div","a":{"class":["antenna-reaction ",{"t":2,"x":{"r":["layoutClass","index"],"s":"_0(_1)"}}]},"f":[{"t":7,"e":"div","a":{"class":"antenna-reaction-text"},"f":[{"t":2,"r":"./text"}]}," ",{"t":7,"e":"div","a":{"class":"antenna-reaction-count"},"f":[{"t":2,"r":"./count"}]}]}],"n":52,"i":"index","r":"reactions"}]}," ",{"t":7,"e":"div","a":{"class":"antenna-footer"},"f":[]}]}]}
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/templates/summary-widget.html":[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna ant-summary-widget","ant-hash":[{"t":2,"r":"pageHash"}]},"f":["Reactions ",{"t":4,"f":[{"t":2,"r":"summary.totalReactions"}],"n":50,"r":"summary.totalReactions"},{"t":4,"n":51,"f":[{"t":7,"e":"span","a":{"class":"three-quarters-loader"}}],"r":"summary.totalReactions"}]}]}
},{}]},{},["/Users/jburns/antenna/rb/static/widget-new/src/js/antenna.js","/Users/jburns/antenna/rb/static/widget-new/src/js/css-loader.js","/Users/jburns/antenna/rb/static/widget-new/src/js/group-settings-loader.js","/Users/jburns/antenna/rb/static/widget-new/src/js/group-settings.js","/Users/jburns/antenna/rb/static/widget-new/src/js/hash.js","/Users/jburns/antenna/rb/static/widget-new/src/js/md5.js","/Users/jburns/antenna/rb/static/widget-new/src/js/page-data-loader.js","/Users/jburns/antenna/rb/static/widget-new/src/js/page-data.js","/Users/jburns/antenna/rb/static/widget-new/src/js/page-reactions-loader.js","/Users/jburns/antenna/rb/static/widget-new/src/js/page-scanner.js","/Users/jburns/antenna/rb/static/widget-new/src/js/script-loader.js","/Users/jburns/antenna/rb/static/widget-new/src/js/summary-widget.js","/Users/jburns/antenna/rb/static/widget-new/src/js/templates.js","/Users/jburns/antenna/rb/static/widget-new/src/templates/summary-widget.html"])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi93aWRnZXQtbmV3L3NyYy9qcy9hbnRlbm5hLmpzIiwiLi4vd2lkZ2V0LW5ldy9zcmMvanMvY3NzLWxvYWRlci5qcyIsIi4uL3dpZGdldC1uZXcvc3JjL2pzL2dyb3VwLXNldHRpbmdzLWxvYWRlci5qcyIsIi4uL3dpZGdldC1uZXcvc3JjL2pzL2dyb3VwLXNldHRpbmdzLmpzIiwiLi4vd2lkZ2V0LW5ldy9zcmMvanMvaGFzaC5qcyIsIi4uL3dpZGdldC1uZXcvc3JjL2pzL21kNS5qcyIsIi4uL3dpZGdldC1uZXcvc3JjL2pzL3BhZ2UtZGF0YS1sb2FkZXIuanMiLCIuLi93aWRnZXQtbmV3L3NyYy9qcy9wYWdlLWRhdGEuanMiLCIuLi93aWRnZXQtbmV3L3NyYy9qcy9wYWdlLXJlYWN0aW9ucy1sb2FkZXIuanMiLCIuLi93aWRnZXQtbmV3L3NyYy9qcy9wYWdlLXNjYW5uZXIuanMiLCIuLi93aWRnZXQtbmV3L3NyYy9qcy9yZWFjdGlvbnMtd2lkZ2V0LmpzIiwiLi4vd2lkZ2V0LW5ldy9zcmMvanMvc2NyaXB0LWxvYWRlci5qcyIsIi4uL3dpZGdldC1uZXcvc3JjL2pzL3N1bW1hcnktd2lkZ2V0LmpzIiwiLi4vd2lkZ2V0LW5ldy9zcmMvanMvdGVtcGxhdGVzLmpzIiwiLi4vd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvdXJscy5qcyIsIi4uL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9yZWFjdGlvbnMtd2lkZ2V0Lmh0bWwiLCIuLi93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvc3VtbWFyeS13aWRnZXQuaHRtbCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3REQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pGQTs7QUNBQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJcbnZhciBTY3JpcHRMb2FkZXIgPSByZXF1aXJlKCcuL3NjcmlwdC1sb2FkZXInKTtcbnZhciBDc3NMb2FkZXIgPSByZXF1aXJlKCcuL2Nzcy1sb2FkZXInKTtcbnZhciBHcm91cFNldHRpbmdzTG9hZGVyID0gcmVxdWlyZSgnLi9ncm91cC1zZXR0aW5ncy1sb2FkZXInKTtcbnZhciBQYWdlRGF0YUxvYWRlciA9IHJlcXVpcmUoJy4vcGFnZS1kYXRhLWxvYWRlcicpO1xudmFyIFBhZ2VTY2FubmVyID0gcmVxdWlyZSgnLi9wYWdlLXNjYW5uZXInKTtcbnZhciBQYWdlRGF0YSA9IHJlcXVpcmUoJy4vcGFnZS1kYXRhJyk7XG5cbmZ1bmN0aW9uIGxvYWRHcm91cFNldHRpbmdzKCkge1xuICAgIC8vIE9uY2Ugd2UgaGF2ZSB0aGUgc2V0dGluZ3MsIHdlIGNhbiBraWNrIG9mZiBhIGNvdXBsZSB0aGluZ3MgaW4gcGFyYWxsZWw6XG4gICAgLy9cbiAgICAvLyAtLSBzdGFydCBmZXRjaGluZyB0aGUgcGFnZSBkYXRhXG4gICAgLy8gLS0gc3RhcnQgaGFzaGluZyB0aGUgcGFnZSBhbmQgaW5zZXJ0aW5nIHRoZSBhZmZvcmRhbmNlcyAoaW4gdGhlIGVtcHR5IHN0YXRlKVxuICAgIC8vXG4gICAgLy8gICAgT25jZSB0aGVzZSB0YXNrcyBjb21wbGV0ZSwgdGhlbiB3ZSBjYW4gdXBkYXRlIHRoZSBhZmZvcmRhbmNlcyB3aXRoIHRoZSBkYXRhIGFuZCB3ZSdyZSByZWFkeVxuICAgIC8vICAgIGZvciBhY3Rpb24uXG4gICAgR3JvdXBTZXR0aW5nc0xvYWRlci5sb2FkKGZ1bmN0aW9uKGdyb3VwU2V0dGluZ3MpIHtcbiAgICAgICAgZmV0Y2hQYWdlRGF0YShncm91cFNldHRpbmdzKTtcbiAgICAgICAgc2NhblBhZ2UoZ3JvdXBTZXR0aW5ncyk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGZldGNoUGFnZURhdGEoZ3JvdXBTZXR0aW5ncykge1xuICAgIFBhZ2VEYXRhTG9hZGVyLmxvYWQoZ3JvdXBTZXR0aW5ncywgZGF0YUxvYWRlZCk7XG59XG5cbmZ1bmN0aW9uIHNjYW5QYWdlKGdyb3VwU2V0dGluZ3MpIHtcbiAgICBQYWdlU2Nhbm5lci5zY2FuKGdyb3VwU2V0dGluZ3MsIHBhZ2VTY2FubmVkKTtcbn1cblxudmFyIGpzb25EYXRhO1xudmFyIGlzUGFnZVNjYW5uZWQgPSBmYWxzZTtcblxuZnVuY3Rpb24gZGF0YUxvYWRlZChqc29uKSB7XG4gICAganNvbkRhdGEgPSBqc29uO1xuICAgIGlmIChqc29uRGF0YSAmJiBpc1BhZ2VTY2FubmVkKSB7XG4gICAgICAgIHBhZ2VSZWFkeSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gcGFnZVNjYW5uZWQoKSB7XG4gICAgaXNQYWdlU2Nhbm5lZCA9IHRydWU7XG4gICAgaWYgKGpzb25EYXRhICYmIGlzUGFnZVNjYW5uZWQpIHtcbiAgICAgICAgcGFnZVJlYWR5KCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBwYWdlUmVhZHkoKSB7XG4gICAgLy8gQXQgdGhpcyBwb2ludCwgdGhlIGNvbnRhaW5lciBoYXNoZXMgaGF2ZSBiZWVuIGNvbXB1dGVkLCB0aGUgYWZmb3JkYW5jZXMgaW5zZXJ0ZWQsIGFuZCB0aGUgcGFnZSBkYXRhIGZldGNoZWQuXG4gICAgLy8gTm93IHVwZGF0ZSB0aGUgc3VtbWFyeSB3aWRnZXRzIGFuZCBhZmZvcmRhbmNlcy5cblxuICAgIFBhZ2VEYXRhLnVwZGF0ZUFsbChqc29uRGF0YSk7XG5cbiAgICAvLyBCT09NLiBUaGUgbWFnaWMgb2YgUmFjdGl2ZS4gTm93IHdlIGp1c3QgY2FsbCBQYWdlRGF0YS51cGRhdGUgaW5zdGVhZCBvZiBhbGwgdGhpcy5cbiAgICAvL2ZvciAodmFyIGkgPSAwOyBpIDwgcGFnZURhdGEubGVuZ3RoOyBpKyspIHtcbiAgICAvLyAgICB2YXIgcGFnZSA9IHBhZ2VEYXRhW2ldO1xuICAgIC8vICAgIHZhciBoYXNoID0gcGFnZS5wYWdlSGFzaDtcbiAgICAvLyAgICAvLyBUT0RPIGV4dHJhY3QgYXR0cmlidXRlIGNvbnN0YW50c1xuICAgIC8vICAgIHZhciAkc3VtbWFyaWVzID0gJCgnW2FudC1oYXNoPVxcJycgKyBoYXNoICsgJ1xcJ10nKTtcbiAgICAvLyAgICAkc3VtbWFyaWVzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgLy8gICAgICAgIHZhciAkc3VtbWFyeSA9ICQodGhpcyk7XG4gICAgLy8gICAgICAgIHZhciBzdW1tYXJ5UmFjdGl2ZSA9IFN1bW1hcnlXaWRnZXQuY3JlYXRlKCRzdW1tYXJ5LCBwYWdlKTsgLy8gVE9ETzogbXVsdGlwbGUgaW5zdGFuY2VzXG4gICAgLy8gICAgfSlcbiAgICAvL31cbn1cblxuLy8gVE9ETyB0aGUgY2FzY2FkZSBpcyBwcmV0dHkgY2xlYXIsIGJ1dCBjYW4gd2Ugb3JjaGVzdHJhdGUgdGhpcyBiZXR0ZXI/XG5TY3JpcHRMb2FkZXIubG9hZChsb2FkR3JvdXBTZXR0aW5ncyk7XG5Dc3NMb2FkZXIubG9hZCgpOyIsIlxudmFyIGJhc2VVcmwgPSAnaHR0cDovL2xvY2FsaG9zdDo4MDgxJzsgLy8gVE9ETyBjb21wdXRlIHRoaXNcblxuZnVuY3Rpb24gbG9hZENzcygpIHtcbiAgICB2YXIgaGVhZCA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF07XG4gICAgaWYgKGhlYWQpIHtcbiAgICAgICAgLy8gVG8gbWFrZSBzdXJlIG5vbmUgb2Ygb3VyIGNvbnRlbnQgcmVuZGVycyBvbiB0aGUgcGFnZSBiZWZvcmUgb3VyIENTUyBpcyBsb2FkZWQsIHdlIGFwcGVuZCBhIHNpbXBsZSBpbmxpbmUgc3R5bGVcbiAgICAgICAgLy8gZWxlbWVudCB0aGF0IHR1cm5zIG9mZiBvdXIgZWxlbWVudHMgKmJlZm9yZSogb3VyIENTUyBsaW5rcy4gVGhpcyBleHBsb2l0cyB0aGUgY2FzY2FkZSBydWxlcyAtIG91ciBDU1MgZmlsZXMgYXBwZWFyXG4gICAgICAgIC8vIGFmdGVyIHRoZSBpbmxpbmUgc3R5bGUgaW4gdGhlIGRvY3VtZW50LCBzbyB0aGV5IHRha2UgcHJlY2VkZW5jZSAoYW5kIG1ha2UgZXZlcnl0aGluZyBhcHBlYXIpIG9uY2UgdGhleSdyZSBsb2FkZWQuXG4gICAgICAgIHZhciBzdHlsZVRhZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XG4gICAgICAgIHN0eWxlVGFnLmlubmVySFRNTCA9ICcuYW50ZW5uYXtkaXNwbGF5Om5vbmU7fSc7XG4gICAgICAgIGhlYWQuYXBwZW5kQ2hpbGQoc3R5bGVUYWcpO1xuXG4gICAgICAgIHZhciBjc3NIcmVmcyA9IFtcbiAgICAgICAgICAgIGJhc2VVcmwgKyAnL3N0YXRpYy93aWRnZXQtbmV3L2RlYnVnL2FudGVubmEuY3NzJyAvLyBUT0RPIHRoaXMgbmVlZHMgYSBmaW5hbCBwYXRoLiBDRE4gZm9yIHByb2R1Y3Rpb24gYW5kIGxvY2FsIGZpbGUgZm9yIGRldmVsb3BtZW50P1xuICAgICAgICBdO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNzc0hyZWZzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBsb2FkRmlsZShjc3NIcmVmc1tpXSwgaGVhZCk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGxvYWRGaWxlKGhyZWYsIGhlYWQpIHtcbiAgICB2YXIgbGlua1RhZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpbmsnKTtcbiAgICBsaW5rVGFnLnNldEF0dHJpYnV0ZSgnaHJlZicsIGhyZWYpO1xuICAgIGxpbmtUYWcuc2V0QXR0cmlidXRlKCdyZWwnLCAnc3R5bGVzaGVldCcpO1xuICAgIGxpbmtUYWcuc2V0QXR0cmlidXRlKCd0eXBlJywgJ3RleHQvY3NzJyk7XG4gICAgaGVhZC5hcHBlbmRDaGlsZChsaW5rVGFnKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgbG9hZCA6IGxvYWRDc3Ncbn07IiwiXG52YXIgR3JvdXBTZXR0aW5ncyA9IHJlcXVpcmUoJy4vZ3JvdXAtc2V0dGluZ3MnKTtcbnZhciAkOyByZXF1aXJlKCcuL3NjcmlwdC1sb2FkZXInKS5vbiQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcblxuLy8gVE9ETyBmb2xkIHRoaXMgbW9kdWxlIGludG8gZ3JvdXAtc2V0dGluZ3M/XG5cbmZ1bmN0aW9uIGxvYWRTZXR0aW5ncyhjYWxsYmFjaykge1xuICAgICQuZ2V0SlNPTlAoJy9hcGkvc2V0dGluZ3MnLCB7IGhvc3RfbmFtZTogd2luZG93LmFudGVubmFfaG9zdCB9LCBzdWNjZXNzLCBlcnJvcik7XG5cbiAgICBmdW5jdGlvbiBzdWNjZXNzKGpzb24pIHtcbiAgICAgICAgdmFyIGdyb3VwU2V0dGluZ3MgPSBHcm91cFNldHRpbmdzLmNyZWF0ZShqc29uKTtcbiAgICAgICAgY2FsbGJhY2soZ3JvdXBTZXR0aW5ncyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZXJyb3IobWVzc2FnZSkge1xuICAgICAgICAvLyBUT0RPIGhhbmRsZSBlcnJvcnMgdGhhdCBoYXBwZW4gd2hlbiBsb2FkaW5nIGNvbmZpZyBkYXRhXG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgbG9hZDogbG9hZFNldHRpbmdzXG59OyIsIlxudmFyICQ7XG5yZXF1aXJlKCcuL3NjcmlwdC1sb2FkZXInKS5vbiQoZnVuY3Rpb24oalF1ZXJ5KSB7XG4gICAgJD1qUXVlcnk7XG59KTtcblxuLy8gVE9ETzogdHJpbSB0cmFpbGluZyBjb21tYXMgZnJvbSBhbnkgc2VsZWN0b3IgdmFsdWVzXG5cbi8vIFRPRE86IFJldmlldy4gVGhlc2UgYXJlIGp1c3QgY29waWVkIGZyb20gZW5nYWdlX2Z1bGwuXG52YXIgZGVmYXVsdHMgPSB7XG4gICAgICAgIHByZW1pdW06IGZhbHNlLFxuICAgICAgICBpbWdfc2VsZWN0b3I6IFwiaW1nXCIsXG4gICAgICAgIGltZ19jb250YWluZXJfc2VsZWN0b3JzOlwiI3ByaW1hcnktcGhvdG9cIixcbiAgICAgICAgYWN0aXZlX3NlY3Rpb25zOiBcImJvZHlcIixcbiAgICAgICAgYW5ub193aGl0ZWxpc3Q6IFwiYm9keSBwXCIsXG4gICAgICAgIGFjdGl2ZV9zZWN0aW9uc193aXRoX2Fubm9fd2hpdGVsaXN0OlwiXCIsXG4gICAgICAgIG1lZGlhX3NlbGVjdG9yOiBcImVtYmVkLCB2aWRlbywgb2JqZWN0LCBpZnJhbWVcIixcbiAgICAgICAgY29tbWVudF9sZW5ndGg6IDUwMCxcbiAgICAgICAgbm9fYW50OiBcIlwiLFxuICAgICAgICBpbWdfYmxhY2tsaXN0OiBcIlwiLFxuICAgICAgICBjdXN0b21fY3NzOiBcIlwiLFxuICAgICAgICAvL3RvZG86IHRlbXAgaW5saW5lX2luZGljYXRvciBkZWZhdWx0cyB0byBtYWtlIHRoZW0gc2hvdyB1cCBvbiBhbGwgbWVkaWEgLSByZW1vdmUgdGhpcyBsYXRlci5cbiAgICAgICAgaW5saW5lX3NlbGVjdG9yOiAnaW1nLCBlbWJlZCwgdmlkZW8sIG9iamVjdCwgaWZyYW1lJyxcbiAgICAgICAgcGFyYWdyYXBoX2hlbHBlcjogdHJ1ZSxcbiAgICAgICAgbWVkaWFfdXJsX2lnbm9yZV9xdWVyeTogdHJ1ZSxcbiAgICAgICAgc3VtbWFyeV93aWRnZXRfc2VsZWN0b3I6ICcuYW50LXBhZ2Utc3VtbWFyeScsIC8vIFRPRE86IHRoaXMgd2Fzbid0IGRlZmluZWQgYXMgYSBkZWZhdWx0IGluIGVuZ2FnZV9mdWxsLCBidXQgd2FzIGluIGNvZGUuIHdoeT9cbiAgICAgICAgc3VtbWFyeV93aWRnZXRfbWV0aG9kOiAnYWZ0ZXInLFxuICAgICAgICBsYW5ndWFnZTogJ2VuJyxcbiAgICAgICAgYWJfdGVzdF9pbXBhY3Q6IHRydWUsXG4gICAgICAgIGFiX3Rlc3Rfc2FtcGxlX3BlcmNlbnRhZ2U6IDEwLFxuICAgICAgICBpbWdfaW5kaWNhdG9yX3Nob3dfb25sb2FkOiB0cnVlLFxuICAgICAgICBpbWdfaW5kaWNhdG9yX3Nob3dfc2lkZTogJ2xlZnQnLFxuICAgICAgICB0YWdfYm94X2JnX2NvbG9yczogJyMxODQxNGM7IzM3NjA3NjsyMTUsIDE3OSwgNjk7I2U2ODg1YzsjZTQ2MTU2JyxcbiAgICAgICAgdGFnX2JveF90ZXh0X2NvbG9yczogJyNmZmY7I2ZmZjsjZmZmOyNmZmY7I2ZmZicsXG4gICAgICAgIHRhZ19ib3hfZm9udF9mYW1pbHk6ICdIZWx2ZXRpY2FOZXVlLEhlbHZldGljYSxBcmlhbCxzYW5zLXNlcmlmJyxcbiAgICAgICAgdGFnc19iZ19jc3M6ICcnLFxuICAgICAgICBpZ25vcmVfc3ViZG9tYWluOiBmYWxzZSxcbiAgICAgICAgLy90aGUgc2NvcGUgaW4gd2hpY2ggdG8gZmluZCBwYXJlbnRzIG9mIDxicj4gdGFncy5cbiAgICAgICAgLy9UaG9zZSBwYXJlbnRzIHdpbGwgYmUgY29udmVydGVkIHRvIGEgPHJ0PiBibG9jaywgc28gdGhlcmUgd29uJ3QgYmUgbmVzdGVkIDxwPiBibG9ja3MuXG4gICAgICAgIC8vdGhlbiBpdCB3aWxsIHNwbGl0IHRoZSBwYXJlbnQncyBodG1sIG9uIDxicj4gdGFncyBhbmQgd3JhcCB0aGUgc2VjdGlvbnMgaW4gPHA+IHRhZ3MuXG5cbiAgICAgICAgLy9leGFtcGxlOlxuICAgICAgICAvLyBicl9yZXBsYWNlX3Njb3BlX3NlbGVjdG9yOiBcIi5hbnRfYnJfcmVwbGFjZVwiIC8vZS5nLiBcIiNtYWluc2VjdGlvblwiIG9yIFwicFwiXG5cbiAgICAgICAgYnJfcmVwbGFjZV9zY29wZV9zZWxlY3RvcjogbnVsbCAvL2UuZy4gXCIjbWFpbnNlY3Rpb25cIiBvciBcInBcIlxuICAgIH07XG5cbmZ1bmN0aW9uIGNyZWF0ZUZyb21KU09OKGpzb24pIHtcblxuICAgIGZ1bmN0aW9uIGRhdGEoa2V5KSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IHdpbmRvdy5hbnRlbm5hX2V4dGVuZFtrZXldO1xuICAgICAgICAgICAgaWYgKHZhbHVlID09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHZhbHVlID0ganNvbltrZXldO1xuICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlID09PSAnJykgeyAvLyBUT0RPOiBTaG91bGQgdGhlIHNlcnZlciBiZSBzZW5kaW5nIGJhY2sgJycgaGVyZSBvciBub3RoaW5nIGF0IGFsbD8gKEl0IHByZWNsdWRlcyB0aGUgc2VydmVyIGZyb20gcmVhbGx5IHNheWluZyAnbm90aGluZycpXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gZGVmYXVsdHNba2V5XTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgZ3JvdXBJZDogZGF0YSgnaWQnKSxcbiAgICAgICAgYWN0aXZlU2VjdGlvbnM6IGRhdGEoJ2FjdGl2ZV9zZWN0aW9ucycpLFxuICAgICAgICB1cmw6IHtcbiAgICAgICAgICAgIGlnbm9yZVN1YmRvbWFpbjogZGF0YSgnaWdub3JlX3N1YmRvbWFpbicpLFxuICAgICAgICAgICAgY2Fub25pY2FsRG9tYWluOiBkYXRhKCdwYWdlX3RsZCcpIC8vIFRPRE86IHdoYXQgdG8gY2FsbCB0aGlzIGV4YWN0bHkuIGdyb3VwRG9tYWluPyBzaXRlRG9tYWluPyBjYW5vbmljYWxEb21haW4/XG4gICAgICAgIH0sXG4gICAgICAgIHN1bW1hcnlTZWxlY3RvcjogZGF0YSgnc3VtbWFyeV93aWRnZXRfc2VsZWN0b3InKSxcbiAgICAgICAgc3VtbWFyeU1ldGhvZDogZGF0YSgnc3VtbWFyeV93aWRnZXRfbWV0aG9kJyksXG4gICAgICAgIHBhZ2VTZWxlY3RvcjogZGF0YSgncG9zdF9zZWxlY3RvcicpLFxuICAgICAgICBwYWdlSHJlZlNlbGVjdG9yOiBkYXRhKCdwb3N0X2hyZWZfc2VsZWN0b3InKSxcbiAgICAgICAgdGV4dFNlbGVjdG9yOiBkYXRhKCdhbm5vX3doaXRlbGlzdCcpXG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlOiBjcmVhdGVGcm9tSlNPTlxufTsiLCJcbnZhciBNRDUgPSByZXF1aXJlKCcuL21kNScpO1xuXG4vLyBUT0RPOiBUaGlzIGlzIGp1c3QgY29weS9wYXN0ZWQgZnJvbSBlbmdhZ2VfZnVsbFxuLy8gVE9ETzogVGhlIGNvZGUgaXMgbG9va2luZyBmb3IgLmFudF9pbmRpY2F0b3IgdG8gc2VlIGlmIGl0J3MgYWxyZWFkeSBiZWVuIGhhc2hlZC4gUmV2aWV3LlxuZnVuY3Rpb24gZ2V0Q2xlYW5UZXh0KCRkb21Ob2RlKSB7XG4gICAgLy8gQU5ULnV0aWwuZ2V0Q2xlYW5UZXh0XG4gICAgLy8gY29tbW9uIGZ1bmN0aW9uIGZvciBjbGVhbmluZyB0aGUgdGV4dCBub2RlIHRleHQuICByaWdodCBub3csIGl0J3MgcmVtb3Zpbmcgc3BhY2VzLCB0YWJzLCBuZXdsaW5lcywgYW5kIHRoZW4gZG91YmxlIHNwYWNlc1xuXG4gICAgdmFyICRub2RlID0gJGRvbU5vZGUuY2xvbmUoKTtcblxuICAgICRub2RlLmZpbmQoJy5hbnQsIC5hbnQtY3VzdG9tLWN0YS1jb250YWluZXInKS5yZW1vdmUoKTtcblxuICAgIC8vbWFrZSBzdXJlIGl0IGRvZXNudCBhbHJlZHkgaGF2ZSBpbiBpbmRpY2F0b3IgLSBpdCBzaG91bGRuJ3QuXG4gICAgdmFyICRpbmRpY2F0b3IgPSAkbm9kZS5maW5kKCcuYW50X2luZGljYXRvcicpO1xuICAgIGlmKCRpbmRpY2F0b3IubGVuZ3RoKXtcbiAgICAgICAgLy90b2RvOiBzZW5kIHVzIGFuIGVycm9yIHJlcG9ydCAtIHRoaXMgbWF5IHN0aWxsIGJlIGhhcHBlbmluZyBmb3Igc2xpZGVzaG93cy5cbiAgICAgICAgLy9UaGlzIGZpeCB3b3JrcyBmaW5lLCBidXQgd2Ugc2hvdWxkIGZpeCB0aGUgY29kZSB0byBoYW5kbGUgaXQgYmVmb3JlIGhlcmUuXG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBnZXQgdGhlIG5vZGUncyB0ZXh0IGFuZCBzbWFzaCBjYXNlXG4gICAgLy8gVE9ETzogPGJyPiB0YWdzIGFuZCBibG9jay1sZXZlbCB0YWdzIGNhbiBzY3JldyB1cCB3b3Jkcy4gIGV4OlxuICAgIC8vIGhlbGxvPGJyPmhvdyBhcmUgeW91PyAgIGhlcmUgYmVjb21lc1xuICAgIC8vIGhlbGxvaG93IGFyZSB5b3U/ICAgIDwtLSBubyBzcGFjZSB3aGVyZSB0aGUgPGJyPiB3YXMuICBiYWQuXG4gICAgdmFyIG5vZGVfdGV4dCA9ICQudHJpbSggJG5vZGUuaHRtbCgpLnJlcGxhY2UoLzwgKmJyICpcXC8/Pi9naSwgJyAnKSApO1xuICAgIHZhciBib2R5ID0gJC50cmltKCAkKCBcIjxkaXY+XCIgKyBub2RlX3RleHQgKyBcIjwvZGl2PlwiICkudGV4dCgpLnRvTG93ZXJDYXNlKCkgKTtcblxuICAgIGlmKCBib2R5ICYmIHR5cGVvZiBib2R5ID09IFwic3RyaW5nXCIgJiYgYm9keSAhPT0gXCJcIiApIHtcbiAgICAgICAgdmFyIGZpcnN0cGFzcyA9IGJvZHkucmVwbGFjZSgvW1xcblxcclxcdF0rL2dpLCcgJykucmVwbGFjZSgpLnJlcGxhY2UoL1xcc3syLH0vZywnICcpO1xuICAgICAgICAvLyBzZWVpbmcgaWYgdGhpcyBoZWxwcyB0aGUgcHJvcHViIGlzc3VlIC0gdG8gdHJpbSBhZ2Fpbi4gIFdoZW4gaSBydW4gdGhpcyBsaW5lIGFib3ZlIGl0IGxvb2tzIGxpa2UgdGhlcmUgaXMgc3RpbGwgd2hpdGUgc3BhY2UuXG4gICAgICAgIHJldHVybiAkLnRyaW0oZmlyc3RwYXNzKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGhhc2hUZXh0KGVsZW1lbnQpIHtcbiAgICAvLyBUT0RPOiBIYW5kbGUgdGhlIGNhc2Ugd2hlcmUgbXVsdGlwbGUgaW5zdGFuY2VzIG9mIHRoZSBzYW1lIHRleHQgYXBwZWFyIG9uIHRoZSBwYWdlLiBOZWVkIHRvIGFkZCBhbiBpbmNyZW1lbnQgdG9cbiAgICAvLyB0aGUgaGFzaFRleHQuIChUaGlzIGNoZWNrIGhhcyB0byBiZSBzY29wZWQgdG8gYSBwb3N0KVxuICAgIHZhciB0ZXh0ID0gZ2V0Q2xlYW5UZXh0KGVsZW1lbnQpO1xuICAgIHZhciBoYXNoVGV4dCA9IFwicmRyLXRleHQtXCIrdGV4dDtcbiAgICByZXR1cm4gTUQ1LmhleF9tZDUoaGFzaFRleHQpO1xufVxuXG5mdW5jdGlvbiBoYXNoVXJsKHVybCkge1xuICAgIHJldHVybiBNRDUuaGV4X21kNSh1cmwpO1xufVxuXG5mdW5jdGlvbiBoYXNoSW1hZ2UoZWxlbWVudCkge1xuXG59XG5cbmZ1bmN0aW9uIGhhc2hNZWRpYShlbGVtZW50KSB7XG5cbn1cblxuZnVuY3Rpb24gaGFzaEVsZW1lbnQoZWxlbWVudCkge1xuICAgIC8vIFRPRE8gbWFrZSByZWFsXG4gICAgcmV0dXJuICdhYmMnO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgaGFzaFRleHQ6IGhhc2hUZXh0LFxuICAgIGhhc2hVcmw6IGhhc2hVcmxcbn07IiwiXG4vLyBUT0RPOiBUaGlzIGNvZGUgaXMganVzdCBjb3BpZWQgZnJvbSBlbmdhZ2VfZnVsbC5qcy4gUmV2aWV3IHdoZXRoZXIgd2Ugd2FudCB0byBrZWVwIGl0IGFzLWlzLlxuXG52YXIgQU5UID0ge1xuICAgIHV0aWw6IHtcbiAgICAgICAgbWQ1OiB7XG4gICAgICAgICAgICBoZXhjYXNlOjAsXG4gICAgICAgICAgICBiNjRwYWQ6XCJcIixcbiAgICAgICAgICAgIGNocnN6OjgsXG4gICAgICAgICAgICBoZXhfbWQ1OiBmdW5jdGlvbihzKXtyZXR1cm4gQU5ULnV0aWwubWQ1LmJpbmwyaGV4KEFOVC51dGlsLm1kNS5jb3JlX21kNShBTlQudXRpbC5tZDUuc3RyMmJpbmwocykscy5sZW5ndGgqQU5ULnV0aWwubWQ1LmNocnN6KSk7fSxcbiAgICAgICAgICAgIGNvcmVfbWQ1OiBmdW5jdGlvbih4LGxlbil7eFtsZW4+PjVdfD0weDgwPDwoKGxlbiklMzIpO3hbKCgobGVuKzY0KT4+PjkpPDw0KSsxNF09bGVuO3ZhciBhPTE3MzI1ODQxOTM7dmFyIGI9LTI3MTczMzg3OTt2YXIgYz0tMTczMjU4NDE5NDt2YXIgZD0yNzE3MzM4Nzg7Zm9yKHZhciBpPTA7aTx4Lmxlbmd0aDtpKz0xNil7dmFyIG9sZGE9YTt2YXIgb2xkYj1iO3ZhciBvbGRjPWM7dmFyIG9sZGQ9ZDthPUFOVC51dGlsLm1kNS5tZDVfZmYoYSxiLGMsZCx4W2krMF0sNywtNjgwODc2OTM2KTtkPUFOVC51dGlsLm1kNS5tZDVfZmYoZCxhLGIsYyx4W2krMV0sMTIsLTM4OTU2NDU4Nik7Yz1BTlQudXRpbC5tZDUubWQ1X2ZmKGMsZCxhLGIseFtpKzJdLDE3LDYwNjEwNTgxOSk7Yj1BTlQudXRpbC5tZDUubWQ1X2ZmKGIsYyxkLGEseFtpKzNdLDIyLC0xMDQ0NTI1MzMwKTthPUFOVC51dGlsLm1kNS5tZDVfZmYoYSxiLGMsZCx4W2krNF0sNywtMTc2NDE4ODk3KTtkPUFOVC51dGlsLm1kNS5tZDVfZmYoZCxhLGIsYyx4W2krNV0sMTIsMTIwMDA4MDQyNik7Yz1BTlQudXRpbC5tZDUubWQ1X2ZmKGMsZCxhLGIseFtpKzZdLDE3LC0xNDczMjMxMzQxKTtiPUFOVC51dGlsLm1kNS5tZDVfZmYoYixjLGQsYSx4W2krN10sMjIsLTQ1NzA1OTgzKTthPUFOVC51dGlsLm1kNS5tZDVfZmYoYSxiLGMsZCx4W2krOF0sNywxNzcwMDM1NDE2KTtkPUFOVC51dGlsLm1kNS5tZDVfZmYoZCxhLGIsYyx4W2krOV0sMTIsLTE5NTg0MTQ0MTcpO2M9QU5ULnV0aWwubWQ1Lm1kNV9mZihjLGQsYSxiLHhbaSsxMF0sMTcsLTQyMDYzKTtiPUFOVC51dGlsLm1kNS5tZDVfZmYoYixjLGQsYSx4W2krMTFdLDIyLC0xOTkwNDA0MTYyKTthPUFOVC51dGlsLm1kNS5tZDVfZmYoYSxiLGMsZCx4W2krMTJdLDcsMTgwNDYwMzY4Mik7ZD1BTlQudXRpbC5tZDUubWQ1X2ZmKGQsYSxiLGMseFtpKzEzXSwxMiwtNDAzNDExMDEpO2M9QU5ULnV0aWwubWQ1Lm1kNV9mZihjLGQsYSxiLHhbaSsxNF0sMTcsLTE1MDIwMDIyOTApO2I9QU5ULnV0aWwubWQ1Lm1kNV9mZihiLGMsZCxhLHhbaSsxNV0sMjIsMTIzNjUzNTMyOSk7YT1BTlQudXRpbC5tZDUubWQ1X2dnKGEsYixjLGQseFtpKzFdLDUsLTE2NTc5NjUxMCk7ZD1BTlQudXRpbC5tZDUubWQ1X2dnKGQsYSxiLGMseFtpKzZdLDksLTEwNjk1MDE2MzIpO2M9QU5ULnV0aWwubWQ1Lm1kNV9nZyhjLGQsYSxiLHhbaSsxMV0sMTQsNjQzNzE3NzEzKTtiPUFOVC51dGlsLm1kNS5tZDVfZ2coYixjLGQsYSx4W2krMF0sMjAsLTM3Mzg5NzMwMik7YT1BTlQudXRpbC5tZDUubWQ1X2dnKGEsYixjLGQseFtpKzVdLDUsLTcwMTU1ODY5MSk7ZD1BTlQudXRpbC5tZDUubWQ1X2dnKGQsYSxiLGMseFtpKzEwXSw5LDM4MDE2MDgzKTtjPUFOVC51dGlsLm1kNS5tZDVfZ2coYyxkLGEsYix4W2krMTVdLDE0LC02NjA0NzgzMzUpO2I9QU5ULnV0aWwubWQ1Lm1kNV9nZyhiLGMsZCxhLHhbaSs0XSwyMCwtNDA1NTM3ODQ4KTthPUFOVC51dGlsLm1kNS5tZDVfZ2coYSxiLGMsZCx4W2krOV0sNSw1Njg0NDY0MzgpO2Q9QU5ULnV0aWwubWQ1Lm1kNV9nZyhkLGEsYixjLHhbaSsxNF0sOSwtMTAxOTgwMzY5MCk7Yz1BTlQudXRpbC5tZDUubWQ1X2dnKGMsZCxhLGIseFtpKzNdLDE0LC0xODczNjM5NjEpO2I9QU5ULnV0aWwubWQ1Lm1kNV9nZyhiLGMsZCxhLHhbaSs4XSwyMCwxMTYzNTMxNTAxKTthPUFOVC51dGlsLm1kNS5tZDVfZ2coYSxiLGMsZCx4W2krMTNdLDUsLTE0NDQ2ODE0NjcpO2Q9QU5ULnV0aWwubWQ1Lm1kNV9nZyhkLGEsYixjLHhbaSsyXSw5LC01MTQwMzc4NCk7Yz1BTlQudXRpbC5tZDUubWQ1X2dnKGMsZCxhLGIseFtpKzddLDE0LDE3MzUzMjg0NzMpO2I9QU5ULnV0aWwubWQ1Lm1kNV9nZyhiLGMsZCxhLHhbaSsxMl0sMjAsLTE5MjY2MDc3MzQpO2E9QU5ULnV0aWwubWQ1Lm1kNV9oaChhLGIsYyxkLHhbaSs1XSw0LC0zNzg1NTgpO2Q9QU5ULnV0aWwubWQ1Lm1kNV9oaChkLGEsYixjLHhbaSs4XSwxMSwtMjAyMjU3NDQ2Myk7Yz1BTlQudXRpbC5tZDUubWQ1X2hoKGMsZCxhLGIseFtpKzExXSwxNiwxODM5MDMwNTYyKTtiPUFOVC51dGlsLm1kNS5tZDVfaGgoYixjLGQsYSx4W2krMTRdLDIzLC0zNTMwOTU1Nik7YT1BTlQudXRpbC5tZDUubWQ1X2hoKGEsYixjLGQseFtpKzFdLDQsLTE1MzA5OTIwNjApO2Q9QU5ULnV0aWwubWQ1Lm1kNV9oaChkLGEsYixjLHhbaSs0XSwxMSwxMjcyODkzMzUzKTtjPUFOVC51dGlsLm1kNS5tZDVfaGgoYyxkLGEsYix4W2krN10sMTYsLTE1NTQ5NzYzMik7Yj1BTlQudXRpbC5tZDUubWQ1X2hoKGIsYyxkLGEseFtpKzEwXSwyMywtMTA5NDczMDY0MCk7YT1BTlQudXRpbC5tZDUubWQ1X2hoKGEsYixjLGQseFtpKzEzXSw0LDY4MTI3OTE3NCk7ZD1BTlQudXRpbC5tZDUubWQ1X2hoKGQsYSxiLGMseFtpKzBdLDExLC0zNTg1MzcyMjIpO2M9QU5ULnV0aWwubWQ1Lm1kNV9oaChjLGQsYSxiLHhbaSszXSwxNiwtNzIyNTIxOTc5KTtiPUFOVC51dGlsLm1kNS5tZDVfaGgoYixjLGQsYSx4W2krNl0sMjMsNzYwMjkxODkpO2E9QU5ULnV0aWwubWQ1Lm1kNV9oaChhLGIsYyxkLHhbaSs5XSw0LC02NDAzNjQ0ODcpO2Q9QU5ULnV0aWwubWQ1Lm1kNV9oaChkLGEsYixjLHhbaSsxMl0sMTEsLTQyMTgxNTgzNSk7Yz1BTlQudXRpbC5tZDUubWQ1X2hoKGMsZCxhLGIseFtpKzE1XSwxNiw1MzA3NDI1MjApO2I9QU5ULnV0aWwubWQ1Lm1kNV9oaChiLGMsZCxhLHhbaSsyXSwyMywtOTk1MzM4NjUxKTthPUFOVC51dGlsLm1kNS5tZDVfaWkoYSxiLGMsZCx4W2krMF0sNiwtMTk4NjMwODQ0KTtkPUFOVC51dGlsLm1kNS5tZDVfaWkoZCxhLGIsYyx4W2krN10sMTAsMTEyNjg5MTQxNSk7Yz1BTlQudXRpbC5tZDUubWQ1X2lpKGMsZCxhLGIseFtpKzE0XSwxNSwtMTQxNjM1NDkwNSk7Yj1BTlQudXRpbC5tZDUubWQ1X2lpKGIsYyxkLGEseFtpKzVdLDIxLC01NzQzNDA1NSk7YT1BTlQudXRpbC5tZDUubWQ1X2lpKGEsYixjLGQseFtpKzEyXSw2LDE3MDA0ODU1NzEpO2Q9QU5ULnV0aWwubWQ1Lm1kNV9paShkLGEsYixjLHhbaSszXSwxMCwtMTg5NDk4NjYwNik7Yz1BTlQudXRpbC5tZDUubWQ1X2lpKGMsZCxhLGIseFtpKzEwXSwxNSwtMTA1MTUyMyk7Yj1BTlQudXRpbC5tZDUubWQ1X2lpKGIsYyxkLGEseFtpKzFdLDIxLC0yMDU0OTIyNzk5KTthPUFOVC51dGlsLm1kNS5tZDVfaWkoYSxiLGMsZCx4W2krOF0sNiwxODczMzEzMzU5KTtkPUFOVC51dGlsLm1kNS5tZDVfaWkoZCxhLGIsYyx4W2krMTVdLDEwLC0zMDYxMTc0NCk7Yz1BTlQudXRpbC5tZDUubWQ1X2lpKGMsZCxhLGIseFtpKzZdLDE1LC0xNTYwMTk4MzgwKTtiPUFOVC51dGlsLm1kNS5tZDVfaWkoYixjLGQsYSx4W2krMTNdLDIxLDEzMDkxNTE2NDkpO2E9QU5ULnV0aWwubWQ1Lm1kNV9paShhLGIsYyxkLHhbaSs0XSw2LC0xNDU1MjMwNzApO2Q9QU5ULnV0aWwubWQ1Lm1kNV9paShkLGEsYixjLHhbaSsxMV0sMTAsLTExMjAyMTAzNzkpO2M9QU5ULnV0aWwubWQ1Lm1kNV9paShjLGQsYSxiLHhbaSsyXSwxNSw3MTg3ODcyNTkpO2I9QU5ULnV0aWwubWQ1Lm1kNV9paShiLGMsZCxhLHhbaSs5XSwyMSwtMzQzNDg1NTUxKTthPUFOVC51dGlsLm1kNS5zYWZlX2FkZChhLG9sZGEpO2I9QU5ULnV0aWwubWQ1LnNhZmVfYWRkKGIsb2xkYik7Yz1BTlQudXRpbC5tZDUuc2FmZV9hZGQoYyxvbGRjKTtkPUFOVC51dGlsLm1kNS5zYWZlX2FkZChkLG9sZGQpO30gcmV0dXJuIEFycmF5KGEsYixjLGQpO30sXG4gICAgICAgICAgICBtZDVfY21uOiBmdW5jdGlvbihxLGEsYix4LHMsdCl7cmV0dXJuIEFOVC51dGlsLm1kNS5zYWZlX2FkZChBTlQudXRpbC5tZDUuYml0X3JvbChBTlQudXRpbC5tZDUuc2FmZV9hZGQoQU5ULnV0aWwubWQ1LnNhZmVfYWRkKGEscSksQU5ULnV0aWwubWQ1LnNhZmVfYWRkKHgsdCkpLHMpLGIpO30sXG4gICAgICAgICAgICBtZDVfZmY6IGZ1bmN0aW9uKGEsYixjLGQseCxzLHQpe3JldHVybiBBTlQudXRpbC5tZDUubWQ1X2NtbigoYiZjKXwoKH5iKSZkKSxhLGIseCxzLHQpO30sXG4gICAgICAgICAgICBtZDVfZ2c6IGZ1bmN0aW9uKGEsYixjLGQseCxzLHQpe3JldHVybiBBTlQudXRpbC5tZDUubWQ1X2NtbigoYiZkKXwoYyYofmQpKSxhLGIseCxzLHQpO30sXG4gICAgICAgICAgICBtZDVfaGg6IGZ1bmN0aW9uKGEsYixjLGQseCxzLHQpe3JldHVybiBBTlQudXRpbC5tZDUubWQ1X2NtbihiXmNeZCxhLGIseCxzLHQpO30sXG4gICAgICAgICAgICBtZDVfaWk6IGZ1bmN0aW9uKGEsYixjLGQseCxzLHQpe3JldHVybiBBTlQudXRpbC5tZDUubWQ1X2NtbihjXihifCh+ZCkpLGEsYix4LHMsdCk7fSxcbiAgICAgICAgICAgIHNhZmVfYWRkOiBmdW5jdGlvbih4LHkpe3ZhciBsc3c9KHgmMHhGRkZGKSsoeSYweEZGRkYpO3ZhciBtc3c9KHg+PjE2KSsoeT4+MTYpKyhsc3c+PjE2KTtyZXR1cm4obXN3PDwxNil8KGxzdyYweEZGRkYpO30sXG4gICAgICAgICAgICBiaXRfcm9sOiBmdW5jdGlvbihudW0sY250KXtyZXR1cm4obnVtPDxjbnQpfChudW0+Pj4oMzItY250KSk7fSxcbiAgICAgICAgICAgIC8vdGhlIGxpbmUgYmVsb3cgaXMgY2FsbGVkIG91dCBieSBqc0xpbnQgYmVjYXVzZSBpdCB1c2VzIEFycmF5KCkgaW5zdGVhZCBvZiBbXS4gIFdlIGNhbiBpZ25vcmUsIG9yIEknbSBzdXJlIHdlIGNvdWxkIGNoYW5nZSBpdCBpZiB3ZSB3YW50ZWQgdG8uXG4gICAgICAgICAgICBzdHIyYmlubDogZnVuY3Rpb24oc3RyKXt2YXIgYmluPUFycmF5KCk7dmFyIG1hc2s9KDE8PEFOVC51dGlsLm1kNS5jaHJzeiktMTtmb3IodmFyIGk9MDtpPHN0ci5sZW5ndGgqQU5ULnV0aWwubWQ1LmNocnN6O2krPUFOVC51dGlsLm1kNS5jaHJzeil7YmluW2k+PjVdfD0oc3RyLmNoYXJDb2RlQXQoaS9BTlQudXRpbC5tZDUuY2hyc3opJm1hc2spPDwoaSUzMik7fXJldHVybiBiaW47fSxcbiAgICAgICAgICAgIGJpbmwyaGV4OiBmdW5jdGlvbihiaW5hcnJheSl7dmFyIGhleF90YWI9QU5ULnV0aWwubWQ1LmhleGNhc2U/XCIwMTIzNDU2Nzg5QUJDREVGXCI6XCIwMTIzNDU2Nzg5YWJjZGVmXCI7dmFyIHN0cj1cIlwiO2Zvcih2YXIgaT0wO2k8YmluYXJyYXkubGVuZ3RoKjQ7aSsrKXtzdHIrPWhleF90YWIuY2hhckF0KChiaW5hcnJheVtpPj4yXT4+KChpJTQpKjgrNCkpJjB4RikraGV4X3RhYi5jaGFyQXQoKGJpbmFycmF5W2k+PjJdPj4oKGklNCkqOCkpJjB4Rik7fSByZXR1cm4gc3RyO31cbiAgICAgICAgfVxuICAgIH1cbn07XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBoZXhfbWQ1OiBBTlQudXRpbC5tZDUuaGV4X21kNVxufTsiLCJcbnZhciBVUkxzID0gcmVxdWlyZSgnLi91dGlscy91cmxzJyk7XG52YXIgJDsgcmVxdWlyZSgnLi9zY3JpcHQtbG9hZGVyJykub24kKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG5cblxuZnVuY3Rpb24gY29tcHV0ZVBhZ2VUaXRsZSgpIHtcbiAgICAvLyBUT0RPOiBIb3cgYXJlIHBhZ2UgdGl0bGVzIGNvbXB1dGVkIHdpdGggbXVsdGlwbGUgcGFnZXM/IFRoZSBjb2RlIGJlbG93IGNvbXB1dGVzIHRoZSB0aXRsZSBmb3IgYSB0b3AtbGV2ZWwgcGFnZS5cbiAgICB2YXIgdGl0bGUgPSAkKCdtZXRhW3Byb3BlcnR5PVwib2c6dGl0bGVcIl0nKS5hdHRyKCdjb250ZW50Jyk7XG4gICAgaWYgKCF0aXRsZSkge1xuICAgICAgICB0aXRsZSA9ICQoJ3RpdGxlJykudGV4dCgpIHx8ICcnO1xuICAgIH1cbiAgICByZXR1cm4gJC50cmltKHRpdGxlKTtcbn1cblxuXG4vLyBDb21wdXRlIHRoZSBwYWdlcyB0aGF0IHdlIG5lZWQgdG8gZmV0Y2guIFRoaXMgaXMgZWl0aGVyOlxuLy8gMS4gQW55IG5lc3RlZCBwYWdlcyB3ZSBmaW5kIHVzaW5nIHRoZSBwYWdlIHNlbGVjdG9yIE9SXG4vLyAyLiBUaGUgY3VycmVudCB3aW5kb3cgbG9jYXRpb25cbmZ1bmN0aW9uIGNvbXB1dGVQYWdlc1BhcmFtKGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgcGFnZXMgPSBbXTtcblxuICAgIHZhciBncm91cElkID0gZ3JvdXBTZXR0aW5ncy5ncm91cElkKCk7XG4gICAgdmFyICRwYWdlRWxlbWVudHMgPSAkKGdyb3VwU2V0dGluZ3MucGFnZVNlbGVjdG9yKCkpO1xuICAgIC8vIFRPRE86IENvbXBhcmUgdGhpcyBleGVjdXRpb24gZmxvdyB0byB3aGF0IGhhcHBlbnMgaW4gZW5nYWdlX2Z1bGwuanMuIEhlcmUgd2UgdHJlYXQgdGhlIGJvZHkgZWxlbWVudCBhcyBhIHBhZ2Ugc29cbiAgICAvLyB0aGUgZmxvdyBpcyB0aGUgc2FtZSBmb3IgYm90aCBjYXNlcy4gSXMgdGhlcmUgYSByZWFzb24gZW5nYWdlX2Z1bGwuanMgYnJhbmNoZXMgaGVyZSBpbnN0ZWFkIGFuZCB0cmVhdHMgdGhlc2Ugc28gZGlmZmVyZW50bHk/XG4gICAgaWYgKCRwYWdlRWxlbWVudHMubGVuZ3RoID09IDApIHtcbiAgICAgICAgJHBhZ2VFbGVtZW50cyA9ICQoJ2JvZHknKTtcbiAgICB9XG4gICAgJHBhZ2VFbGVtZW50cy5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgJHBhZ2VFbGVtZW50ID0gJCh0aGlzKTtcbiAgICAgICAgcGFnZXMucHVzaCh7XG4gICAgICAgICAgICBncm91cF9pZDogZ3JvdXBJZCxcbiAgICAgICAgICAgIHVybDogVVJMcy5jb21wdXRlUGFnZVVybCgkcGFnZUVsZW1lbnQsIGdyb3VwU2V0dGluZ3MpLFxuICAgICAgICAgICAgY2Fub25pY2FsX3VybDogVVJMcy5jb21wdXRlQ2Fub25pY2FsVXJsKCRwYWdlRWxlbWVudCwgZ3JvdXBTZXR0aW5ncyksXG4gICAgICAgICAgICBpbWFnZTogJycsIC8vIFRPRE9cbiAgICAgICAgICAgIHRpdGxlOiBjb21wdXRlUGFnZVRpdGxlKCkgLy8gVE9ETzogVGhpcyBjb2RlIG9ubHkgd29ya3MgZm9yIHRoZSB0b3AtbGV2ZWwgcGFnZS4gU2VlIGNvbXB1dGVQYWdlVGl0bGUoKVxuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIHJldHVybiBwYWdlcztcbn1cblxuZnVuY3Rpb24gbG9hZFBhZ2VEYXRhKGdyb3VwU2V0dGluZ3MsIGNhbGxiYWNrKSB7XG4gICAgdmFyIHBhZ2VzUGFyYW0gPSBjb21wdXRlUGFnZXNQYXJhbShncm91cFNldHRpbmdzKTtcbiAgICAkLmdldEpTT05QKCcvYXBpL3BhZ2UnLCB7IHBhZ2VzOiBwYWdlc1BhcmFtIH0sIHN1Y2Nlc3MsIGVycm9yKTtcblxuICAgIGZ1bmN0aW9uIHN1Y2Nlc3MoanNvbikge1xuICAgICAgICBjYWxsYmFjayhqc29uKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBlcnJvcihtZXNzYWdlKSB7XG4gICAgICAgIC8vIFRPRE8gaGFuZGxlIGVycm9ycyB0aGF0IGhhcHBlbiB3aGVuIGxvYWRpbmcgcGFnZSBkYXRhXG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgbG9hZDogbG9hZFBhZ2VEYXRhXG59OyIsIlxudmFyICQ7IHJlcXVpcmUoJy4vc2NyaXB0LWxvYWRlcicpLm9uJChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xuXG52YXIgcGFnZXMgPSB7fTtcblxuZnVuY3Rpb24gZ2V0UGFnZURhdGEoaGFzaCkge1xuICAgIHZhciBwYWdlRGF0YSA9IHBhZ2VzW2hhc2hdO1xuICAgIGlmICghcGFnZURhdGEpIHtcbiAgICAgICAgLy8gVE9ETzogR2l2ZSB0aGlzIHNlcmlvdXMgdGhvdWdodC4gSW4gb3JkZXIgZm9yIG1hZ2ljIG1vZGUgdG8gd29yaywgdGhlIG9iamVjdCBuZWVkcyB0byBoYXZlIHZhbHVlcyBpbiBwbGFjZSBmb3JcbiAgICAgICAgLy8gdGhlIG9ic2VydmVkIHByb3BlcnRpZXMgYXQgdGhlIG1vbWVudCB0aGUgcmFjdGl2ZSBpcyBjcmVhdGVkLiBCdXQgdGhpcyBpcyBwcmV0dHkgdW51c3VhbCBmb3IgSmF2YXNjcmlwdCwgdG8gaGF2ZVxuICAgICAgICAvLyB0byBkZWZpbmUgdGhlIHdob2xlIHNrZWxldG9uIGZvciB0aGUgb2JqZWN0IGluc3RlYWQgb2YganVzdCBhZGRpbmcgcHJvcGVydGllcyB3aGVuZXZlciB5b3Ugd2FudC5cbiAgICAgICAgLy8gVGhlIGFsdGVybmF0aXZlIHdvdWxkIGJlIGZvciB1cyB0byBrZWVwIG91ciBvd24gXCJkYXRhIGJpbmRpbmdcIiBiZXR3ZWVuIHRoZSBwYWdlRGF0YSBhbmQgcmFjdGl2ZSBpbnN0YW5jZXMgKDEgdG8gbWFueSlcbiAgICAgICAgLy8gYW5kIHRlbGwgdGhlIHJhY3RpdmVzIHRvIHVwZGF0ZSB3aGVuZXZlciB0aGUgZGF0YSBjaGFuZ2VzLlxuICAgICAgICBwYWdlRGF0YSA9IHtcbiAgICAgICAgICAgIHBhZ2VIYXNoOiBoYXNoLFxuICAgICAgICAgICAgc3VtbWFyeToge31cbiAgICAgICAgfTtcbiAgICAgICAgcGFnZXNbaGFzaF0gPSBwYWdlRGF0YTtcbiAgICB9XG4gICAgcmV0dXJuIHBhZ2VEYXRhO1xufVxuXG5mdW5jdGlvbiB1cGRhdGVBbGxQYWdlRGF0YShqc29uUGFnZXMpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGpzb25QYWdlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB1cGRhdGVQYWdlRGF0YShqc29uUGFnZXNbaV0pO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gdXBkYXRlUGFnZURhdGEoanNvbikge1xuICAgIHZhciBwYWdlRGF0YSA9IGdldFBhZ2VEYXRhKGpzb24udXJsaGFzaCk7XG5cbiAgICB2YXIgbnVtUmVhY3Rpb25zID0gMDtcbiAgICB2YXIgbnVtQ29tbWVudHMgPSAwO1xuICAgIHZhciBudW1TaGFyZXMgPSAwO1xuXG4gICAgdmFyIHN1bW1hcnlFbnRyaWVzID0ganNvbi5zdW1tYXJ5O1xuICAgIGlmIChzdW1tYXJ5RW50cmllcykge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN1bW1hcnlFbnRyaWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgc3VtbWFyeUVudHJ5ID0gc3VtbWFyeUVudHJpZXNbaV07XG4gICAgICAgICAgICBpZiAoc3VtbWFyeUVudHJ5LmtpbmQgPT09ICd0YWcnKSB7XG4gICAgICAgICAgICAgICAgbnVtUmVhY3Rpb25zID0gc3VtbWFyeUVudHJ5LmNvdW50O1xuICAgICAgICAgICAgfSBlbHNlIGlmIChzdW1tYXJ5RW50cnkua2luZCA9PT0gJ2NvbScpIHtcbiAgICAgICAgICAgICAgICBudW1Db21tZW50cyA9IHN1bW1hcnlFbnRyeS5jb3VudDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc3VtbWFyeUVudHJ5LmtpbmQgPT09ICdzaHInKSB7XG4gICAgICAgICAgICAgICAgbnVtU2hhcmVzID0gc3VtbWFyeUVudHJ5LmNvdW50O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgdmFyIHRvcFJlYWN0aW9ucyA9IFtdO1xuICAgIHZhciByZWFjdGlvbnNEYXRhID0ganNvbi50b3B0YWdzO1xuICAgIGlmIChyZWFjdGlvbnNEYXRhKSB7XG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgcmVhY3Rpb25zRGF0YS5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgdmFyIHJlYWN0aW9uID0gcmVhY3Rpb25zRGF0YVtqXTtcbiAgICAgICAgICAgIHRvcFJlYWN0aW9uc1tqXSA9IHtcbiAgICAgICAgICAgICAgICBpZDogcmVhY3Rpb24uaWQsXG4gICAgICAgICAgICAgICAgY291bnQ6IHJlYWN0aW9uLnRhZ19jb3VudCxcbiAgICAgICAgICAgICAgICB0ZXh0OiByZWFjdGlvbi5ib2R5XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBUT0RPIENvbnNpZGVyIHN1cHBvcnRpbmcgaW5jcmVtZW50YWwgdXBkYXRlIG9mIGRhdGEgdGhhdCB3ZSBhbHJlYWR5IGhhdmUgZnJvbSB0aGUgc2VydmVyLiBUaGF0IHdvdWxkIG1lYW4gb25seVxuICAgIC8vIHVwZGF0aW5nIGZpZWxkcyBpbiB0aGUgbG9jYWwgb2JqZWN0IGlmIHRoZXkgZXhpc3QgaW4gdGhlIGpzb24gZGF0YS5cbiAgICBwYWdlRGF0YS5wYWdlSWQgPSBqc29uLmlkO1xuICAgIHBhZ2VEYXRhLnN1bW1hcnkgPSB7XG4gICAgICAgIHRvdGFsUmVhY3Rpb25zOiBudW1SZWFjdGlvbnMsXG4gICAgICAgIHRvdGFsQ29tbWVudHM6IG51bUNvbW1lbnRzLFxuICAgICAgICB0b3RhbFNoYXJlczogbnVtU2hhcmVzXG4gICAgfTtcbiAgICBwYWdlRGF0YS50b3BSZWFjdGlvbnMgPSB0b3BSZWFjdGlvbnM7XG4gICAgcGFnZURhdGEuY29udGFpbmVycyA9IGpzb24uY29udGFpbmVyczsgLy8gYXJyYXkgb2Ygb2JqZWN0cyB3aXRoICdpZCcgYW5kICdoYXNoJyBwcm9wZXJ0aWVzLCBpbmNsdWRpbmcgdGhlIG1hZ2ljICdwYWdlJyBoYXNoIHZhbHVlXG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBnZXQ6IGdldFBhZ2VEYXRhLFxuICAgIHVwZGF0ZUFsbDogdXBkYXRlQWxsUGFnZURhdGFcbn07IiwiXG4vL3ZhciAkID0gcmVxdWlyZSgnLi9qcXVlcnknKTtcbnZhciAkO1xucmVxdWlyZSgnLi9zY3JpcHQtbG9hZGVyJykub24kKGZ1bmN0aW9uKGpRdWVyeSkge1xuICAgICQ9alF1ZXJ5O1xufSk7XG5cbi8vIFRPRE8gdGhpcyBpcyBqdXN0IHJhbmRvbSBpbmNvbXBsZXRlIHNuaXBwZXRzXG5cbmZ1bmN0aW9uIGNyZWF0ZVBhZ2VQYXJhbShncm91cFNldHRpbmdzKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZ3JvdXBfaWQ6IGdyb3VwU2V0dGluZ3MuaWQsXG4gICAgICAgIHVybDogJycsXG4gICAgICAgIGNhbm9uaWNhbF91cmw6ICcnLFxuICAgICAgICB0aXRsZTogJycsXG4gICAgICAgIGltYWdlOiAnJ1xuICAgIH07XG59XG5cblxuXG5mdW5jdGlvbiBsb2FkUGFnZShzZXR0aW5ncykge1xuICAgIGFsZXJ0KEpTT04uc3RyaW5naWZ5KHNldHRpbmdzLCBudWxsLCAyKSk7XG4gICAgJC5nZXRKU09OUCgnL2FwaS9wYWdlJywge1xuICAgICAgICAgICAgcGFnZXM6IFt7XG4gICAgICAgICAgICAgICAgZ3JvdXBfaWQ6IHNldHRpbmdzLmlkLFxuXG4gICAgICAgICAgICB9XVxuICAgICAgICB9LCBmdW5jdGlvbihwYWdlcykge1xuICAgICAgICAgICAgYWxlcnQoSlNPTi5zdHJpbmdpZnkocGFnZXMsIG51bGwsIDIpKTtcbiAgICAgICAgfSk7XG5cbn1cblxuZnVuY3Rpb24gbG9hZFBhZ2VzKCkge1xuXG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBsb2FkUGFnZTogbG9hZFBhZ2UsXG4gICAgbG9hZFBhZ2VzOiBsb2FkUGFnZXNcbn07IiwiXG52YXIgJDsgcmVxdWlyZSgnLi9zY3JpcHQtbG9hZGVyJykub24kKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgVGVtcGxhdGVzID0gcmVxdWlyZSgnLi90ZW1wbGF0ZXMnKTtcbnZhciBIYXNoID0gcmVxdWlyZSgnLi9oYXNoJyk7XG52YXIgVVJMcyA9IHJlcXVpcmUoJy4vdXRpbHMvdXJscycpO1xudmFyIFN1bW1hcnlXaWRnZXQgPSByZXF1aXJlKCcuL3N1bW1hcnktd2lkZ2V0Jyk7XG52YXIgUGFnZURhdGEgPSByZXF1aXJlKCcuL3BhZ2UtZGF0YScpO1xuXG52YXIgaW5kaWNhdG9yTWFwID0ge307XG5cbi8vIFNjYW4gZm9yIGFsbCBwYWdlcyBhdCB0aGUgY3VycmVudCBicm93c2VyIGxvY2F0aW9uLiBUaGlzIGNvdWxkIGp1c3QgYmUgdGhlIGN1cnJlbnQgcGFnZSBvciBpdCBjb3VsZCBiZSBhIGNvbGxlY3Rpb25cbi8vIG9mIHBhZ2VzIChha2EgJ3Bvc3RzJykuXG5mdW5jdGlvbiBzY2FuQWxsUGFnZXMoZ3JvdXBTZXR0aW5ncywgY2FsbGJhY2spIHtcbiAgICB2YXIgJHBhZ2VzID0gJChncm91cFNldHRpbmdzLnBhZ2VTZWxlY3RvcigpKTtcbiAgICBpZiAoJHBhZ2VzLmxlbmd0aCA9PSAwKSB7XG4gICAgICAgIC8vIElmIHdlIGRvbid0IGRldGVjdCBhbnkgcGFnZSBtYXJrZXJzLCB0cmVhdCB0aGUgd2hvbGUgZG9jdW1lbnQgYXMgdGhlIHNpbmdsZSBwYWdlXG4gICAgICAgICRwYWdlcyA9ICQoJ2JvZHknKTsgLy8gVE9ETyBJcyB0aGlzIHRoZSByaWdodCBiZWhhdmlvcj9cbiAgICB9XG4gICAgJHBhZ2VzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkcGFnZSA9ICQodGhpcyk7XG4gICAgICAgIHNjYW5QYWdlKCRwYWdlLCBncm91cFNldHRpbmdzKTtcbiAgICB9KTtcbiAgICBjYWxsYmFjaygpO1xufVxuXG4vLyBTY2FuIHRoZSBwYWdlIHVzaW5nIHRoZSBnaXZlbiBzZXR0aW5nczpcbi8vIDEuIEZpbmQgYWxsIHRoZSBjb250YWluZXJzIHRoYXQgd2UgY2FyZSBhYm91dC5cbi8vIDIuIEluc2VydCB3aWRnZXQgYWZmb3JkYW5jZXMgZm9yIGVhY2guXG4vLyAzLiBDb21wdXRlIGhhc2hlcyBmb3IgZWFjaCBjb250YWluZXIuXG5mdW5jdGlvbiBzY2FuUGFnZSgkcGFnZSwgZ3JvdXBTZXR0aW5ncykge1xuXG4gICAgLy8gRmlyc3QsIHNjYW4gZm9yIGVsZW1lbnRzIHRoYXQgd291bGQgY2F1c2UgdXMgdG8gaW5zZXJ0IHNvbWV0aGluZyBpbnRvIHRoZSBET00gdGhhdCB0YWtlcyB1cCBzcGFjZS5cbiAgICAvLyBXZSB3YW50IHRvIGdldCBhbnkgcGFnZSByZXNpemluZyBvdXQgb2YgdGhlIHdheSBhcyBlYXJseSBhcyBwb3NzaWJsZS5cbiAgICAvLyBUT0RPOiBDb25zaWRlciBkb2luZyB0aGlzIHdpdGggcmF3IEphdmFzY3JpcHQgYmVmb3JlIGpRdWVyeSBsb2FkcywgdG8gZnVydGhlciByZWR1Y2UgdGhlIGRlbGF5LiBXZSB3b3VsZG4ndFxuICAgIC8vIHNhdmUgYSAqdG9uKiBvZiB0aW1lIGZyb20gdGhpcywgdGhvdWdoLCBzbyBpdCdzIGRlZmluaXRlbHkgYSBsYXRlciBvcHRpbWl6YXRpb24uXG4gICAgc2NhbkZvclN1bW1hcmllcygkcGFnZSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgc2NhbkZvckNhbGxzVG9BY3Rpb24oJHBhZ2UsIGdyb3VwU2V0dGluZ3MpO1xuXG4gICAgdmFyICRhY3RpdmVTZWN0aW9ucyA9ICRwYWdlLmZpbmQoZ3JvdXBTZXR0aW5ncy5hY3RpdmVTZWN0aW9ucygpKTtcbiAgICAkYWN0aXZlU2VjdGlvbnMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRzZWN0aW9uID0gJCh0aGlzKTtcbiAgICAgICAgLy8gVGhlbiBzY2FuIGZvciBldmVyeXRoaW5nIGVsc2VcbiAgICAgICAgc2NhbkZvclRleHQoJHNlY3Rpb24sIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICBzY2FuRm9ySW1hZ2VzKCRzZWN0aW9uLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgc2NhbkZvck1lZGlhKCRzZWN0aW9uLCBncm91cFNldHRpbmdzKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gc2NhbkZvclN1bW1hcmllcygkZWxlbWVudCwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciB1cmwgPSBVUkxzLmNvbXB1dGVQYWdlVXJsKCRlbGVtZW50LCBncm91cFNldHRpbmdzKTtcbiAgICB2YXIgdXJsSGFzaCA9IEhhc2guaGFzaFVybCh1cmwpO1xuXG4gICAgdmFyICRzdW1tYXJpZXMgPSAkZWxlbWVudC5maW5kKGdyb3VwU2V0dGluZ3Muc3VtbWFyeVNlbGVjdG9yKCkpO1xuICAgICRzdW1tYXJpZXMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gVE9ETzogY29tcHV0ZSB0aGUgdXJsIGhhc2ggZm9yIHRoZSBwYWdlLCBlaXRoZXIgdXNpbmcgdGhlIHBhZ2Ugc2VsZWN0b3Igb3IgdGhlIHdpbmRvdyBsb2NhdGlvbi4gU2VlIGVuZ2FnZV9mdWxsOjQyMjZcbiAgICAgICAgLy8gICAgICAgYXR0YWNoIHRoZSB1cmwgdG8gdGhlIGluZGljYXRvciBhcyBhbiBhdHRyaWJ1dGVcbiAgICAgICAgLy8gICAgICAgYWRkIHRoZSBlbGVtZW50IHRvIHRoZSBpbmRpY2F0b3IgbWFwXG4gICAgICAgIC8vICAgICAgIC4uLnRoZW4gd2UgY2FuIGluc3RhbnRpYXRlIHRoZSBTdW1tYXJ5V2lkZ2V0IHJhY3RpdmUgYmFzZWQgb24gdGhlIGhhc2ggb25jZSB0aGUgZGF0YSBpcyBsb2FkZWRcbiAgICAgICAgdmFyICRzdW1tYXJ5ID0gJCh0aGlzKTtcbiAgICAgICAgLy9pbnNlcnRDb250ZW50KCRzdW1tYXJ5LCBUZW1wbGF0ZXMuc3VtbWFyeSh1cmxIYXNoKSwgZ3JvdXBTZXR0aW5ncy5zdW1tYXJ5TWV0aG9kKCkpO1xuICAgICAgICB2YXIgY29udGFpbmVyID0gJCgnPGRpdj48L2Rpdj4nKTtcbiAgICAgICAgdmFyIHN1bW1hcnlXaWRnZXQgPSBTdW1tYXJ5V2lkZ2V0LmNyZWF0ZShjb250YWluZXIsIFBhZ2VEYXRhLmdldCh1cmxIYXNoKSk7IC8vIFRPRE8gc3Rhc2ggdGhpcyBhd2F5IHNvbWV3aGVyZVxuICAgICAgICBpbnNlcnRDb250ZW50KCRzdW1tYXJ5LCBjb250YWluZXIsIGdyb3VwU2V0dGluZ3Muc3VtbWFyeU1ldGhvZCgpKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gc2NhbkZvckNhbGxzVG9BY3Rpb24oJHNlY3Rpb24sIGdyb3VwU2V0dGluZ3MpIHtcbiAgICAvLyBUT0RPXG59XG5cbmZ1bmN0aW9uIHNjYW5Gb3JUZXh0KCRzZWN0aW9uLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyICR0ZXh0RWxlbWVudHMgPSAkc2VjdGlvbi5maW5kKGdyb3VwU2V0dGluZ3MudGV4dFNlbGVjdG9yKCkpO1xuICAgIC8vIFRPRE86IG9ubHkgc2VsZWN0IFwibGVhZlwiIGVsZW1lbnRzXG4gICAgJHRleHRFbGVtZW50cy5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgJGVsZW1lbnQgPSAkKHRoaXMpO1xuICAgICAgICAvLyBUT0RPIHBvc2l0aW9uIGNvcnJlY3RseVxuICAgICAgICAvLyBUT0RPIGhhc2ggYW5kIGFkZCBoYXNoIGRhdGEgdG8gaW5kaWNhdG9yXG4gICAgICAgIHZhciBoYXNoID0gSGFzaC5oYXNoVGV4dCgkZWxlbWVudCk7XG4gICAgICAgICRlbGVtZW50LmFwcGVuZChUZW1wbGF0ZXMuaW5kaWNhdG9yKGhhc2gpKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gc2NhbkZvckltYWdlcygkc2VjdGlvbiwgZ3JvdXBTZXR0aW5ncykge1xuICAgIC8vIFRPRE9cbn1cblxuZnVuY3Rpb24gc2NhbkZvck1lZGlhKCRzZWN0aW9uLCBncm91cFNldHRpbmdzKSB7XG4gICAgLy8gVE9ET1xufVxuXG5mdW5jdGlvbiBpbnNlcnRDb250ZW50KCRwYXJlbnQsIGNvbnRlbnQsIG1ldGhvZCkge1xuICAgIHN3aXRjaCAobWV0aG9kKSB7XG4gICAgICAgIGNhc2UgJ2FwcGVuZCc6XG4gICAgICAgICAgICAkcGFyZW50LmFwcGVuZChjb250ZW50KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdwcmVwZW5kJzpcbiAgICAgICAgICAgICRwYXJlbnQucHJlcGVuZChjb250ZW50KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdiZWZvcmUnOlxuICAgICAgICAgICAgJHBhcmVudC5iZWZvcmUoY29udGVudCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnYWZ0ZXInOlxuICAgICAgICAgICAgJHBhcmVudC5hZnRlcihjb250ZW50KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgIH1cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgc2Nhbjogc2NhbkFsbFBhZ2VzXG59OyIsIlxuXG52YXIgcmFjdGl2ZTtcblxuZnVuY3Rpb24gY3JlYXRlUmVhY3Rpb25zV2lkZ2V0KGNvbnRhaW5lciwgcmVhY3Rpb25zRGF0YSkge1xuICAgIHZhciBsYXlvdXRDbGFzc2VzID0gY29tcHV0ZUxheW91dENsYXNzZXMocmVhY3Rpb25zRGF0YSk7XG4gICAgcmFjdGl2ZSA9IFJhY3RpdmUoe1xuICAgICAgICBlbDogY29udGFpbmVyLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICByZWFjdGlvbnM6IHJlYWN0aW9uc0RhdGEsXG4gICAgICAgICAgICBsYXlvdXRDbGFzczogZnVuY3Rpb24oaW5kZXgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbGF5b3V0Q2xhc3Nlc1tpbmRleF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHRlbXBsYXRlOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvcmVhY3Rpb25zLXdpZGdldC5odG1sJyksXG4gICAgICAgIG9uY29tcGxldGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICAgICAgJChyb290RWxlbWVudCgpKVxuICAgICAgICAgICAgICAgIC5vbignbW91c2VvdmVyJywga2VlcFdpbmRvd09wZW4pXG4gICAgICAgICAgICAgICAgLm9uKCdtb3VzZW91dCcsIGRlbGF5ZWRDbG9zZVdpbmRvdyk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4ge1xuICAgICAgICBvcGVuOiBvcGVuV2luZG93LFxuICAgICAgICBjbG9zZTogY2xvc2VXaW5kb3csXG4gICAgICAgIGRlbGF5ZWRDbG9zZTogZGVsYXllZENsb3NlV2luZG93XG4gICAgfTtcbn1cblxuZnVuY3Rpb24gY29tcHV0ZUxheW91dENsYXNzZXMocmVhY3Rpb25zRGF0YSkge1xuICAgIC8vIFRPRE8gVmVyaWZ5IHRoYXQgdGhlIHJlYWN0aW9uc0RhdGEgaXMgY29taW5nIGJhY2sgZnJvbSB0aGUgc2VydmVyIHNvcnRlZC4gSWYgbm90LCBzb3J0IGl0IGFmdGVyIGl0cyBmZXRjaGVkLlxuXG4gICAgdmFyIG51bVJlYWN0aW9ucyA9IHJlYWN0aW9uc0RhdGEubGVuZ3RoO1xuICAgIC8vIFRPRE86IENvcGllZCBjb2RlIGZyb20gZW5nYWdlX2Z1bGwuY3JlYXRlVGFnQnVja2V0c1xuICAgIHZhciBtYXggPSByZWFjdGlvbnNEYXRhWzBdLmNvdW50O1xuICAgIHZhciBtZWRpYW4gPSByZWFjdGlvbnNEYXRhWyBNYXRoLmZsb29yKHJlYWN0aW9uc0RhdGEubGVuZ3RoLzIpIF0uY291bnQ7XG4gICAgdmFyIG1pbiA9IHJlYWN0aW9uc0RhdGFbIHJlYWN0aW9uc0RhdGEubGVuZ3RoLTEgXS5jb3VudDtcbiAgICB2YXIgdG90YWwgPSAwO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbnVtUmVhY3Rpb25zOyBpKyspIHtcbiAgICAgICAgdG90YWwgKz0gcmVhY3Rpb25zRGF0YVtpXTtcbiAgICB9XG4gICAgdmFyIGF2ZXJhZ2UgPSBNYXRoLmZsb29yKHRvdGFsIC8gbnVtUmVhY3Rpb25zKTtcbiAgICB2YXIgbWlkVmFsdWUgPSAoIG1lZGlhbiA+IGF2ZXJhZ2UgKSA/IG1lZGlhbiA6IGF2ZXJhZ2U7XG5cbiAgICB2YXIgbGF5b3V0Q2xhc3NlcyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbnVtUmVhY3Rpb25zOyBpKyspIHtcbiAgICAgICAgaWYgKHJlYWN0aW9uc0RhdGFbaV0uY291bnQgPiBtaWRWYWx1ZSkge1xuICAgICAgICAgICAgbGF5b3V0Q2xhc3Nlc1tpXSA9ICdmdWxsJztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGxheW91dENsYXNzZXNbaV0gPSAnaGFsZic7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGxheW91dENsYXNzZXM7XG59XG5cbmZ1bmN0aW9uIHJvb3RFbGVtZW50KCkge1xuICAgIC8vIFRPRE86IGdvdHRhIGJlIGEgYmV0dGVyIHdheSB0byBnZXQgdGhpc1xuICAgIHJldHVybiByYWN0aXZlLmZpbmQoJ2RpdicpO1xufVxuXG5mdW5jdGlvbiBvcGVuV2luZG93KHJlbGF0aXZlRWxlbWVudCkge1xuICAgIGlmIChyYWN0aXZlKSB7XG4gICAgICAgIHZhciBvZmZzZXQgPSAkKHJlbGF0aXZlRWxlbWVudCkub2Zmc2V0KCk7XG4gICAgICAgIHZhciBjb29yZHMgPSB7XG4gICAgICAgICAgICB0b3A6IG9mZnNldC50b3AsXG4gICAgICAgICAgICBsZWZ0OiBvZmZzZXQubGVmdFxuICAgICAgICB9O1xuICAgICAgICB2YXIgJGVsZW1lbnQgPSAkKHJvb3RFbGVtZW50KCkpO1xuICAgICAgICAkZWxlbWVudC5zdG9wKHRydWUsIHRydWUpLmFkZENsYXNzKCdvcGVuJykuY3NzKGNvb3Jkcyk7XG4gICAgfVxuXG59XG5cbnZhciBjbG9zZVRpbWVyO1xuXG5mdW5jdGlvbiBrZWVwV2luZG93T3BlbigpIHtcbiAgICBpZiAoY2xvc2VUaW1lcikgeyBjbG9zZVRpbWVyLmNsZWFyVGltZW91dCgpOyB9XG59XG5cbmZ1bmN0aW9uIGRlbGF5ZWRDbG9zZVdpbmRvdygpIHtcbiAgICBjbG9zZVRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgY2xvc2VUaW1lciA9IG51bGw7XG4gICAgICAgIGNsb3NlV2luZG93KCk7XG4gICAgfSwgMTUwMCk7XG59XG5cbmZ1bmN0aW9uIGNsb3NlV2luZG93KCkge1xuICAgIHZhciAkZWxlbWVudCA9ICQocmFjdGl2ZS5maW5kKCdkaXYnKSk7XG4gICAgJGVsZW1lbnQuc3RvcCh0cnVlLCB0cnVlKS5mYWRlT3V0KCdmYXN0JywgZnVuY3Rpb24oKSB7XG4gICAgICAgICRlbGVtZW50LmNzcygnZGlzcGxheScsICcnKTsgLy8gQ2xlYXIgdGhlIGRpc3BsYXk6bm9uZSB0aGF0IGZhZGVPdXQgcHV0cyBvbiB0aGUgZWxlbWVudFxuICAgICAgICAkZWxlbWVudC5yZW1vdmVDbGFzcygnb3BlbicpO1xuICAgIH0pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGU6IGNyZWF0ZVJlYWN0aW9uc1dpZGdldFxufTsiLCJcbnZhciBiYXNlVXJsID0gJ2h0dHA6Ly9sb2NhbGhvc3Q6ODA4MSc7IC8vIFRPRE8gY29tcHV0ZSB0aGlzXG5cbnZhciAkO1xudmFyIGpRdWVyeUNhbGxiYWNrcyA9IFtdO1xuXG5mdW5jdGlvbiBvbiQoY2FsbGJhY2spIHtcbiAgICBpZiAoJCkge1xuICAgICAgICBjYWxsYmFjaygkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBqUXVlcnlDYWxsYmFja3MucHVzaChjYWxsYmFjayk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBqUXVlcnlMb2FkZWQoKSB7XG4gICAgLy8gVXBkYXRlIHRoZSAkIHRoYXQgd2UgZGVmaW5lIHdpdGhpbiBvdXIgb3duIGNsb3N1cmUgdG8gdGhlIHZlcnNpb24gb2YgalF1ZXJ5IHRoYXQgd2Ugd2FudCBhbmQgcmVzZXQgdGhlIGdsb2JhbCAkXG4gICAgJCA9IGpRdWVyeS5ub0NvbmZsaWN0KHRydWUpO1xuXG4gICAgJC5nZXRKU09OUCA9IGZ1bmN0aW9uKHVybCwgZGF0YSwgc3VjY2VzcywgZXJyb3IpIHtcbiAgICAgICAgdmFyIG9wdGlvbnMgPSB7XG4gICAgICAgICAgICB1cmw6IGJhc2VVcmwgKyB1cmwsIC8vIFRPRE8gYmFzZSB1cmxcbiAgICAgICAgICAgIHR5cGU6IFwiZ2V0XCIsXG4gICAgICAgICAgICBjb250ZW50VHlwZTogXCJhcHBsaWNhdGlvbi9qc29uXCIsXG4gICAgICAgICAgICBkYXRhVHlwZTogXCJqc29ucFwiLFxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24ocmVzcG9uc2UsIHRleHRTdGF0dXMsIFhIUikge1xuICAgICAgICAgICAgICAgIC8vIFRPRE86IFJldmlzaXQgd2hldGhlciBpdCdzIHJlYWxseSBjb29sIHRvIGtleSB0aGlzIG9uIHRoZSB0ZXh0U3RhdHVzIG9yIGlmIHdlIHNob3VsZCBiZSBsb29raW5nIGF0XG4gICAgICAgICAgICAgICAgLy8gICAgICAgdGhlIHN0YXR1cyBjb2RlIGluIHRoZSBYSFJcbiAgICAgICAgICAgICAgICBpZiAodGV4dFN0YXR1cyA9PT0gJ3N1Y2Nlc3MnKSB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3MocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gRm9yIEpTT05QIHJlcXVlc3RzLCBqUXVlcnkgZG9lc24ndCBjYWxsIGl0J3MgZXJyb3IgY2FsbGJhY2suIEl0IGNhbGxzIHN1Y2Nlc3MgaW5zdGVhZC5cbiAgICAgICAgICAgICAgICAgICAgZXJyb3IocmVzcG9uc2UubWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBpZiAoZGF0YSkge1xuICAgICAgICAgICAgb3B0aW9ucy5kYXRhID0geyBqc29uOiBKU09OLnN0cmluZ2lmeShkYXRhKSB9O1xuICAgICAgICB9XG4gICAgICAgICQuYWpheChvcHRpb25zKTtcbiAgICB9O1xuXG4gICAgd2hpbGUgKGpRdWVyeUNhbGxiYWNrcy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGpRdWVyeUNhbGxiYWNrcy5wb3AoKSgkKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGxvYWRTY3JpcHRzKGxvYWRlZENhbGxiYWNrKSB7XG4gICAgdmFyIHNjcmlwdHMgPSBbXG4gICAgICAgIHtzcmM6ICcvL2NkbmpzLmNsb3VkZmxhcmUuY29tL2FqYXgvbGlicy9qcXVlcnkvMi4xLjQvanF1ZXJ5Lm1pbi5qcycsIGNhbGxiYWNrOiBqUXVlcnlMb2FkZWR9LFxuICAgICAgICB7c3JjOiAnLy9jZG5qcy5jbG91ZGZsYXJlLmNvbS9hamF4L2xpYnMvcmFjdGl2ZS8wLjcuMy9yYWN0aXZlLnJ1bnRpbWUubWluLmpzJ31cbiAgICBdO1xuICAgIC8vIFRPRE86IGtleSB0aGlzIG9mZiBzb21lIGtpbmQgb2YgZmxhZy5cbiAgICBpZiAoZG9jdW1lbnQuY3VycmVudFNjcmlwdC5zcmMgPT09ICdodHRwOi8vbG9jYWxob3N0OjgwODEvc3RhdGljL3dpZGdldC1uZXcvZGVidWcvYW50ZW5uYS5qcycpIHtcbiAgICAgICAgLy8gVXNlIHRoZSBvZmZsaW5lIHZlcnNpb25zIG9mIHRoZSBsaWJyYXJpZXMgZm9yIGRldmVsb3BtZW50LlxuICAgICAgICBzY3JpcHRzID0gW1xuICAgICAgICAgICAge3NyYzogYmFzZVVybCArICcvc3RhdGljL2pzL2Nkbi9qcXVlcnkvMi4xLjQvanF1ZXJ5Lm1pbi5qcycsIGNhbGxiYWNrOiBqUXVlcnlMb2FkZWR9LFxuICAgICAgICAgICAge3NyYzogYmFzZVVybCArICcvc3RhdGljL2pzL2Nkbi9yYWN0aXZlLzAuNy4zL3JhY3RpdmUucnVudGltZS5taW4uanMnfVxuICAgICAgICBdO1xuICAgIH1cbiAgICB2YXIgbG9hZGluZ0NvdW50ID0gc2NyaXB0cy5sZW5ndGg7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzY3JpcHRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBzY3JpcHQgPSBzY3JpcHRzW2ldO1xuICAgICAgICBsb2FkU2NyaXB0KHNjcmlwdC5zcmMsIGZ1bmN0aW9uKHNjcmlwdENhbGxiYWNrKSB7XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNjcmlwdENhbGxiYWNrKSBzY3JpcHRDYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgIGxvYWRpbmdDb3VudCA9IGxvYWRpbmdDb3VudCAtIDE7XG4gICAgICAgICAgICAgICAgaWYgKGxvYWRpbmdDb3VudCA9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChsb2FkZWRDYWxsYmFjaykgbG9hZGVkQ2FsbGJhY2soKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICB9IChzY3JpcHQuY2FsbGJhY2spKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGxvYWRTY3JpcHQoc3JjLCBjYWxsYmFjaykge1xuICAgIHZhciBoZWFkID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKVswXTtcbiAgICBpZiAoaGVhZCkge1xuICAgICAgICB2YXIgc2NyaXB0VGFnID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XG4gICAgICAgIHNjcmlwdFRhZy5zZXRBdHRyaWJ1dGUoJ3NyYycsIHNyYyk7XG4gICAgICAgIHNjcmlwdFRhZy5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCd0ZXh0L2phdmFzY3JpcHQnKTtcblxuICAgICAgICBpZiAoc2NyaXB0VGFnLnJlYWR5U3RhdGUpIHsgLy8gSUUsIGluY2wuIElFOVxuICAgICAgICAgICAgc2NyaXB0VGFnLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmIChzY3JpcHRUYWcucmVhZHlTdGF0ZSA9PSBcImxvYWRlZFwiIHx8IHNjcmlwdFRhZy5yZWFkeVN0YXRlID09IFwiY29tcGxldGVcIikge1xuICAgICAgICAgICAgICAgICAgICBzY3JpcHRUYWcub25yZWFkeXN0YXRlY2hhbmdlID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2NyaXB0VGFnLm9ubG9hZCA9IGZ1bmN0aW9uKCkgeyAvLyBPdGhlciBicm93c2Vyc1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgaGVhZC5hcHBlbmRDaGlsZChzY3JpcHRUYWcpO1xuICAgIH1cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGxvYWQ6IGxvYWRTY3JpcHRzLFxuICAgIG9uJDogb24kXG59OyIsIlxudmFyIFJlYWN0aW9uc1dpZGdldCA9IHJlcXVpcmUoJy4vcmVhY3Rpb25zLXdpZGdldCcpO1xuXG52YXIgcmFjdGl2ZTtcbnZhciByZWFjdGlvbnNXaWRnZXQ7XG5cbmZ1bmN0aW9uIGNyZWF0ZVN1bW1hcnlXaWRnZXQoY29udGFpbmVyLCBwYWdlRGF0YSkge1xuICAgIC8vLy8gVE9ETyByZXBsYWNlIGVsZW1lbnRcbiAgICByYWN0aXZlID0gUmFjdGl2ZSh7XG4gICAgICAgIGVsOiBjb250YWluZXIsXG4gICAgICAgIGRhdGE6IHBhZ2VEYXRhLFxuICAgICAgICBtYWdpYzogdHJ1ZSxcbiAgICAgICAgdGVtcGxhdGU6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9zdW1tYXJ5LXdpZGdldC5odG1sJyksXG4gICAgICAgIGNvbXBsZXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgICAgICQocm9vdEVsZW1lbnQoKSkub24oJ2NsaWNrJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgICAgIHRoYXQuYWRkKCdzdW1tYXJ5LnRvdGFsUmVhY3Rpb25zJyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICQocm9vdEVsZW1lbnQoKSkub24oJ21vdXNlZW50ZXInLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgICAgb3BlblJlYWN0aW9uc1dpbmRvdyhwYWdlRGF0YSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiByYWN0aXZlO1xufVxuXG5mdW5jdGlvbiByb290RWxlbWVudCgpIHtcbiAgICAvLyBUT0RPOiBnb3R0YSBiZSBhIGJldHRlciB3YXkgdG8gZ2V0IHRoaXNcbiAgICByZXR1cm4gcmFjdGl2ZS5maW5kKCdkaXYnKTtcbn1cblxuZnVuY3Rpb24gb3BlblJlYWN0aW9uc1dpbmRvdyhwYWdlRGF0YSkge1xuICAgIGlmICghcmVhY3Rpb25zV2lkZ2V0KSB7XG4gICAgICAgIC8vIFRPRE86IGNvbnNpZGVyIHByZXBvcHVsYXRpbmcgdGhpc1xuICAgICAgICB2YXIgYnVja2V0ID0gZ2V0V2lkZ2V0QnVja2V0KCk7XG4gICAgICAgIHZhciBjb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgYnVja2V0LmFwcGVuZENoaWxkKGNvbnRhaW5lcik7XG4gICAgICAgIHJlYWN0aW9uc1dpZGdldCA9IFJlYWN0aW9uc1dpZGdldC5jcmVhdGUoY29udGFpbmVyLCBwYWdlRGF0YS50b3BSZWFjdGlvbnMpO1xuICAgIH1cbiAgICByZWFjdGlvbnNXaWRnZXQub3Blbihyb290RWxlbWVudCgpKTtcbn1cblxuZnVuY3Rpb24gZ2V0V2lkZ2V0QnVja2V0KCkge1xuICAgIHZhciBidWNrZXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYW50ZW5uYS13aWRnZXQtYnVja2V0Jyk7XG4gICAgaWYgKCFidWNrZXQpIHtcbiAgICAgICAgYnVja2V0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIGJ1Y2tldC5zZXRBdHRyaWJ1dGUoJ2lkJywgJ2FudGVubmEtd2lkZ2V0LWJ1Y2tldCcpO1xuICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGJ1Y2tldCk7XG4gICAgfVxuICAgIHJldHVybiBidWNrZXQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZTogY3JlYXRlU3VtbWFyeVdpZGdldFxufTsiLCJcblxuLy8gVE9ETyB1c2UgYWN0dWFsIHRlbXBsYXRlcy4gOilcblxuZnVuY3Rpb24gaW5kaWNhdG9yKGhhc2gpIHtcbiAgICByZXR1cm4gJCgnPGRpdiBzdHlsZT1cIndpZHRoOjIwcHg7IGhlaWdodDogMjBweDsgYm9yZGVyLXJhZGl1czoyMHB4OyBiYWNrZ3JvdW5kLWNvbG9yOiByZWQ7IGZsb2F0OnJpZ2h0O1wiICcgK1xuICAgICAgICAgICAgJ2FudC1oYXNoPVwiJyArIGhhc2ggKyAnXCI+PC9kaXY+Jyk7XG59XG5cbmZ1bmN0aW9uIHN1bW1hcnkoaGFzaCkge1xuICAgIHJldHVybiAkKCc8ZGl2IHN0eWxlPVwibWluLXdpZHRoOjUwcHg7IGhlaWdodDogMjBweDsgYm9yZGVyLXJhZGl1czozcHg7IGJhY2tncm91bmQtY29sb3I6IGJsdWU7IGZsb2F0OmxlZnQ7XCInICsgJyBhbnQtaGFzaD1cIicgKyBoYXNoICsgJ1wiPjwvZGl2PicpO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgaW5kaWNhdG9yOiBpbmRpY2F0b3IsXG4gICAgc3VtbWFyeTogc3VtbWFyeVxufTsiLCJcbnZhciAkOyByZXF1aXJlKCcuLi9zY3JpcHQtbG9hZGVyJykub24kKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG5cbi8vIFRPRE8gY29waWVkIGZyb20gZW5nYWdlX2Z1bGwuIFJldmlldy5cbmZ1bmN0aW9uIGNvbXB1dGVQYWdlVXJsKGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgcGFnZV91cmwgPSAkLnRyaW0oIHdpbmRvdy5sb2NhdGlvbi5ocmVmLnNwbGl0KCcjJylbMF0gKS50b0xvd2VyQ2FzZSgpOyAvLyBUT0RPIHNob3VsZCBwYXNzIHRoaXMgaW4gaW5zdGVhZCBvZiByZWNvbXB1dGluZ1xuICAgIHJldHVybiByZW1vdmVTdWJkb21haW5Gcm9tUGFnZVVybChwYWdlX3VybCwgZ3JvdXBTZXR0aW5ncyk7XG59XG5cbi8vIFRPRE8gY29waWVkIGZyb20gZW5nYWdlX2Z1bGwuIFJldmlldy5cbmZ1bmN0aW9uIGNvbXB1dGVUb3BMZXZlbENhbm9uaWNhbFVybChncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIHBhZ2VfdXJsID0gJC50cmltKCB3aW5kb3cubG9jYXRpb24uaHJlZi5zcGxpdCgnIycpWzBdICkudG9Mb3dlckNhc2UoKTsgLy8gVE9ETyBzaG91bGQgcGFzcyB0aGlzIGluIGluc3RlYWQgb2YgcmVjb21wdXRpbmdcbiAgICB2YXIgY2Fub25pY2FsX3VybCA9ICggJCgnbGlua1tyZWw9XCJjYW5vbmljYWxcIl0nKS5sZW5ndGggPiAwICkgP1xuICAgICAgICAgICAgICAgICQoJ2xpbmtbcmVsPVwiY2Fub25pY2FsXCJdJykuYXR0cignaHJlZicpIDogcGFnZV91cmw7XG5cbiAgICAvLyBhbnQ6dXJsIG92ZXJyaWRlc1xuICAgIGlmICggJCgnW3Byb3BlcnR5PVwiYW50ZW5uYTp1cmxcIl0nKS5sZW5ndGggPiAwICkge1xuICAgICAgICBjYW5vbmljYWxfdXJsID0gJCgnW3Byb3BlcnR5PVwiYW50ZW5uYTp1cmxcIl0nKS5hdHRyKCdjb250ZW50Jyk7XG4gICAgfVxuXG4gICAgY2Fub25pY2FsX3VybCA9ICQudHJpbSggY2Fub25pY2FsX3VybC50b0xvd2VyQ2FzZSgpICk7XG5cbiAgICBpZiAoY2Fub25pY2FsX3VybCA9PSBjb21wdXRlUGFnZVVybChncm91cFNldHRpbmdzKSApIHsgLy8gVE9ETyBzaG91bGQgcGFzcyB0aGlzIGluIGluc3RlYWQgb2YgcmVjb21wdXRpbmdcbiAgICAgICAgY2Fub25pY2FsX3VybCA9IFwic2FtZVwiO1xuICAgIH1cblxuICAgIC8vIGZhc3RjbyBmaXggKHNpbmNlIHRoZXkgc29tZXRpbWVzIHJld3JpdGUgdGhlaXIgY2Fub25pY2FsIHRvIHNpbXBseSBiZSB0aGVpciBUTEQuKVxuICAgIC8vIGluIHRoZSBjYXNlIHdoZXJlIGNhbm9uaWNhbCBjbGFpbXMgVExEIGJ1dCB3ZSdyZSBhY3R1YWxseSBvbiBhbiBhcnRpY2xlLi4uIHNldCBjYW5vbmljYWwgdG8gYmUgdGhlIHBhZ2VfdXJsXG4gICAgdmFyIHRsZCA9ICQudHJpbSh3aW5kb3cubG9jYXRpb24ucHJvdG9jb2wrJy8vJyt3aW5kb3cubG9jYXRpb24uaG9zdG5hbWUrJy8nKS50b0xvd2VyQ2FzZSgpO1xuICAgIGlmICggY2Fub25pY2FsX3VybCA9PSB0bGQgKSB7XG4gICAgICAgIGlmIChwYWdlX3VybCAhPSB0bGQpIHtcbiAgICAgICAgICAgIGNhbm9uaWNhbF91cmwgPSBwYWdlX3VybDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiByZW1vdmVTdWJkb21haW5Gcm9tUGFnZVVybCgkLnRyaW0oY2Fub25pY2FsX3VybCksIGdyb3VwU2V0dGluZ3MpO1xufVxuXG5mdW5jdGlvbiBjb21wdXRlUGFnZUVsZW1lbnRDYW5vbmljYWxVcmwoJHBhZ2VFbGVtZW50LCBncm91cFNldHRpbmdzKSB7XG4gICAgLy8gVE9ETyBSZXZpZXcgYWdhaW5zdCBlbmdhZ2VfZnVsbC4gVGhlcmUsIHRoZSBuZXN0ZWQgcGFnZXMgYW5kIHRvcC1sZXZlbCBwYWdlIGhhdmUgYSB0b3RhbGx5IGRpZmZlcmVudCBmbG93LiBEb2VzIHRoaXNcbiAgICAvLyB1bmlmaWNhdGlvbiB3b3JrPyBUaGUgaWRlYSBpcyB0aGF0IHRoZSBuZXN0ZWQgcGFnZXMgd291bGQgaGF2ZSBhbiBocmVmIHNlbGVjdG9yIHRoYXQgc3BlY2lmaWVzIHRoZSBVUkwgdG8gdXNlLCBzbyB3ZVxuICAgIC8vIGp1c3QgdXNlIGl0LiBCdXQgY29tcHV0ZSB0aGUgdXJsIGZvciB0aGUgdG9wLWxldmVsIGNhc2UgZXhwbGljaXRseS5cbiAgICBpZiAoJHBhZ2VFbGVtZW50LmZpbmQoZ3JvdXBTZXR0aW5ncy5wYWdlSHJlZlNlbGVjdG9yKCkpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgcmV0dXJuICdzYW1lJztcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gY29tcHV0ZVRvcExldmVsQ2Fub25pY2FsVXJsKGdyb3VwU2V0dGluZ3MpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gY29tcHV0ZVBhZ2VFbGVtZW50VXJsKCRwYWdlRWxlbWVudCwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciB1cmwgPSAkcGFnZUVsZW1lbnQuZmluZChncm91cFNldHRpbmdzLnBhZ2VIcmVmU2VsZWN0b3IoKSkuYXR0cignaHJlZicpO1xuICAgIGlmICghdXJsKSB7XG4gICAgICAgIHVybCA9ICQudHJpbSggd2luZG93LmxvY2F0aW9uLmhyZWYuc3BsaXQoJyMnKVswXSApLnRvTG93ZXJDYXNlKCk7IC8vIHRvcC1sZXZlbCBwYWdlIHVybFxuICAgIH1cbiAgICByZXR1cm4gcmVtb3ZlU3ViZG9tYWluRnJvbVBhZ2VVcmwodXJsLCBncm91cFNldHRpbmdzKTtcbn1cblxuLy8gVE9ETyBjb3BpZWQgZnJvbSBlbmdhZ2VfZnVsbC4gUmV2aWV3LlxuZnVuY3Rpb24gcmVtb3ZlU3ViZG9tYWluRnJvbVBhZ2VVcmwodXJsLCBncm91cFNldHRpbmdzKSB7XG4gICAgLy8gQU5ULmFjdGlvbnMucmVtb3ZlU3ViZG9tYWluRnJvbVBhZ2VVcmw6XG4gICAgLy8gaWYgXCJpZ25vcmVfc3ViZG9tYWluXCIgaXMgY2hlY2tlZCBpbiBzZXR0aW5ncywgQU5EIHRoZXkgc3VwcGx5IGEgVExELFxuICAgIC8vIHRoZW4gbW9kaWZ5IHRoZSBwYWdlIGFuZCBjYW5vbmljYWwgVVJMcyBoZXJlLlxuICAgIC8vIGhhdmUgdG8gaGF2ZSB0aGVtIHN1cHBseSBvbmUgYmVjYXVzZSB0aGVyZSBhcmUgdG9vIG1hbnkgdmFyaWF0aW9ucyB0byByZWxpYWJseSBzdHJpcCBzdWJkb21haW5zICAoLmNvbSwgLmlzLCAuY29tLmFyLCAuY28udWssIGV0YylcbiAgICBpZiAoZ3JvdXBTZXR0aW5ncy51cmwuaWdub3JlU3ViZG9tYWluKCkgPT0gdHJ1ZSAmJiBncm91cFNldHRpbmdzLnVybC5jYW5vbmljYWxEb21haW4oKSkge1xuICAgICAgICB2YXIgSE9TVERPTUFJTiA9IC9bLVxcd10rXFwuKD86Wy1cXHddK1xcLnhuLS1bLVxcd10rfFstXFx3XXsyLH18Wy1cXHddK1xcLlstXFx3XXsyfSkkL2k7XG4gICAgICAgIHZhciBzcmNBcnJheSA9IHVybC5zcGxpdCgnLycpO1xuXG4gICAgICAgIHZhciBwcm90b2NvbCA9IHNyY0FycmF5WzBdO1xuICAgICAgICBzcmNBcnJheS5zcGxpY2UoMCwzKTtcblxuICAgICAgICB2YXIgcmV0dXJuVXJsID0gcHJvdG9jb2wgKyAnLy8nICsgZ3JvdXBTZXR0aW5ncy51cmwuY2Fub25pY2FsRG9tYWluKCkgKyAnLycgKyBzcmNBcnJheS5qb2luKCcvJyk7XG5cbiAgICAgICAgcmV0dXJuIHJldHVyblVybDtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdXJsO1xuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY29tcHV0ZVBhZ2VVcmw6IGNvbXB1dGVQYWdlRWxlbWVudFVybCxcbiAgICBjb21wdXRlQ2Fub25pY2FsVXJsOiBjb21wdXRlUGFnZUVsZW1lbnRDYW5vbmljYWxVcmxcbn07IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEgYW50ZW5uYS1yZWFjdGlvbnMtd2lkZ2V0XCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWhlYWRlclwifSxcImZcIjpbXX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1ib2R5XCJ9LFwiZlwiOlt7XCJ0XCI6NCxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOltcImFudGVubmEtcmVhY3Rpb24gXCIse1widFwiOjIsXCJ4XCI6e1wiclwiOltcImxheW91dENsYXNzXCIsXCJpbmRleFwiXSxcInNcIjpcIl8wKF8xKVwifX1dfSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1yZWFjdGlvbi10ZXh0XCJ9LFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcIi4vdGV4dFwifV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcmVhY3Rpb24tY291bnRcIn0sXCJmXCI6W3tcInRcIjoyLFwiclwiOlwiLi9jb3VudFwifV19XX1dLFwiblwiOjUyLFwiaVwiOlwiaW5kZXhcIixcInJcIjpcInJlYWN0aW9uc1wifV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtZm9vdGVyXCJ9LFwiZlwiOltdfV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYSBhbnQtc3VtbWFyeS13aWRnZXRcIixcImFudC1oYXNoXCI6W3tcInRcIjoyLFwiclwiOlwicGFnZUhhc2hcIn1dfSxcImZcIjpbXCJSZWFjdGlvbnMgXCIse1widFwiOjQsXCJmXCI6W3tcInRcIjoyLFwiclwiOlwic3VtbWFyeS50b3RhbFJlYWN0aW9uc1wifV0sXCJuXCI6NTAsXCJyXCI6XCJzdW1tYXJ5LnRvdGFsUmVhY3Rpb25zXCJ9LHtcInRcIjo0LFwiblwiOjUxLFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwidGhyZWUtcXVhcnRlcnMtbG9hZGVyXCJ9fV0sXCJyXCI6XCJzdW1tYXJ5LnRvdGFsUmVhY3Rpb25zXCJ9XX1dfSJdfQ==
