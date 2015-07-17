(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var ScriptLoader = require('./script-loader');

var GroupSettingsLoader = require('./group-settings-loader');
var PageDataLoader = require('./page-data-loader');
var PageScanner = require('./page-scanner');

function loadGroupSettings() {
    // Once we have the settings, we can kick off a couple things in parallel:
    //
    // -- start fetching the page data
    // -- start hashing the page
    // -- start inserting the affordances (in the empty state)
    //
    //    Once these three tasks all complete, then we can update the affordances with the data and we're ready
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

var isDataLoaded = false;
var isPageScanned = false;

function dataLoaded(pageData) {
    isDataLoaded = true;
    if (isDataLoaded && isPageScanned) {
        pageReady();
    }
}

function pageScanned() {
    isPageScanned = true;
    if (isDataLoaded && isPageScanned) {
        pageReady();
    }
}

function pageReady() {
    // At this point, the container hashes have been computed, the affordances inserted, and the page data fetched.
    // Now update the summary widgets and affordances.
}

// TODO the cascade is pretty clear, but can we orchestrate this better?
ScriptLoader.load(loadGroupSettings);
},{"./group-settings-loader":2,"./page-data-loader":6,"./page-scanner":9,"./script-loader":10}],2:[function(require,module,exports){

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
},{"./group-settings":3,"./script-loader":10}],3:[function(require,module,exports){

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
},{"./script-loader":10}],4:[function(require,module,exports){

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
    hashText: hashText
};
},{"./md5":5}],5:[function(require,module,exports){

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
},{}],6:[function(require,module,exports){

var PageData = require('./page-data');
var URLs = require('./utils/urls');
var $; require('./script-loader').on$(function(jQuery) { $=jQuery; });


function computePageTitle() {
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
    if ($pageElements.length > 0) {
        $pageElements.each(function() {
            var $pageElement = $(this);
            var url = $pageElement.find(groupSettings.pageHrefSelector()).attr('href');
            pages.push({
                group_id: groupId,
                url: url,
                canonical_url: '', // TODO
                image: '', // TODO
                title: '' // TODO
            });
        });
    } else {
        pages.push({
            group_id: groupId,
            url: URLs.computePageUrl(groupSettings),
            canonical_url: URLs.computeCanonicalUrl(groupSettings),
            image: '', // TODO
            title: computePageTitle()
        });
    }

    return pages;
}

function loadPageData(groupSettings, callback) {
    var pagesParam = computePagesParam(groupSettings);
    $.getJSONP('/api/page', { pages: pagesParam }, success, error);

    function success(json) {
        var pageData = PageData.create(json);
        callback(pageData);
    }

    function error(message) {
        // TODO handle errors that happen when loading page data
    }
}

//noinspection JSUnresolvedVariable
module.exports = {
    load: loadPageData
};
},{"./page-data":7,"./script-loader":10,"./utils/urls":13}],7:[function(require,module,exports){

var $;
require('./script-loader').on$(function(jQuery) {
    $=jQuery;
});

// TODO this is totally speculative!

var elements = {}; // hash --> element
var interactions = {}; // hash --> interactions

function computeHash($element) {
    // TODO
    return 'abc';
}

function getHash(element) { // TODO pass in DOM node or can we assume jQuery?
    var $element = $(element);
    var id = $element.data('ant-id');
    var hash = hashes[id];
    if (!hash) {
        hash = computeHash($element);
    }
}

function setHash(hash, element) {
    elements[hash] = element;
    // TODO
}

function getElement(hash) {
    // TODO return the element with the given hash
}

function getInteractions(content) {

}

function createPage(json) {
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

    return {
        pageId: json.id,
        pageHash: json.urlhash,
        summary: {
            totalReactions: numReactions,
            totalComments: numComments,
            totalShares: numShares
        },
        topReactions: topReactions,
        containers: json.containers // array of objects with 'id' and 'hash' properties, including the magic 'page' hash value
    };
}

function createFromJSON(jsonPages) {
    // TODO Put more structure around this? e.g. Lookup functions?
    pages = [];
    for (var i = 0; i < jsonPages.length; i++) {
        pages[i] = createPage(jsonPages[i]);
    }
    return pages;

}

//noinspection JSUnresolvedVariable
module.exports = {
    create: createFromJSON,
    setHash: setHash,
    getHash: getHash,
    getInteractions: getInteractions
};
},{"./script-loader":10}],8:[function(require,module,exports){

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
},{"./script-loader":10}],9:[function(require,module,exports){

//var $ = require('./jquery');
var Templates = require('./templates');
var Hash = require('./hash');
//var SummaryWidget = require('./summary-widget');
var $;
require('./script-loader').on$(function(jQuery) {
    $=jQuery;
});

var hashes = {};

// Scan the page using the given settings:
// 1. Find all the containers that we care about.
// 2. Insert widget affordances for each.
// 3. Compute hashes for each container.
//    TODO: Also need to compute hashes for any reacted content (i.e. text selections), but we only have that info after
//          We get back the page data. Don't want to wait for that network request before we start doing this work, though.
//          So we should probably just make another pass for those other content pieces later when we get back the page data.
function scanPage(groupSettings, callback) {
    var $activeSections = $(groupSettings.activeSections());
    $activeSections.each(function() {
        var $section = $(this);
        // First, scan for elements that would cause us to insert something into the DOM that takes up space.
        // We want to get any page resizing out of the way as early as possible.
        scanForSummary($section, groupSettings);
        scanForPages($section, groupSettings);
        scanForCallsToAction($section, groupSettings);
        // Then scan for everything else
        scanForText($section, groupSettings);
        scanForImages($section, groupSettings);
        scanForMedia($section, groupSettings);
    });
    callback();
}

function scanForSummary($section, groupSettings) {
    var $summaries = $section.find(groupSettings.summarySelector());
    $summaries.each(function() {
        var container = $('<div></div>');
        insertContent($(this), Templates.summary(), groupSettings.summaryMethod());
        //insertContent($(this), container, groupSettings.summaryMethod());
        //var summaryWidget = SummaryWidget.create(container, {});
    });
}

function scanForPages($section, groupSettings) {
    var pages = $section.find(groupSettings.pageSelector());
    // TODO
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
   scan: scanPage
};
},{"./hash":4,"./script-loader":10,"./templates":12}],10:[function(require,module,exports){

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
        { src: '//cdnjs.cloudflare.com/ajax/libs/jquery/2.1.4/jquery.min.js', callback: jQueryLoaded },
        { src: '//cdnjs.cloudflare.com/ajax/libs/ractive/0.7.3/ractive.min.js'}
    ];
    // TODO: key this off some kind of flag.
    // Uncomment the following to work offline:
    scripts = [
        { src: baseUrl + '/static/js/cdn/jquery/2.1.4/jquery.min.js', callback: jQueryLoaded },
        { src: baseUrl + '/static/js/cdn/ractive/0.7.3/ractive.min.js'}
    ];
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
},{}],11:[function(require,module,exports){
//
////var Ractive = require('ractive');
//
//function createSummaryWidget(container, pageSummary) {
//    var ractive = new Ractive({
//        el: container,
//        template: '<div style="width:50px; height: 20px; border-radius:3px; background-color: blue; float:left;">{{pageSummary.numReactions}}</div>',
//        data: pageSummary
//    });
//    return ractive;
//}
//
//module.exports = {
//    create: createSummaryWidget
//};
},{}],12:[function(require,module,exports){


// TODO use actual templates. :)

function indicator(hash) {
    return $('<div style="width:20px; height: 20px; border-radius:20px; background-color: red; float:right;" ' +
            'data-ant-hash="' + hash + '"></div>');
}

function summary() {
    return $('<div style="width:50px; height: 20px; border-radius:3px; background-color: blue; float:left;"></div>');
}

//noinspection JSUnresolvedVariable
module.exports = {
    indicator: indicator,
    summary: summary
};
},{}],13:[function(require,module,exports){

var $; require('../script-loader').on$(function(jQuery) { $=jQuery; });

// TODO copied from engage_full. Review.
function computePageUrl(groupSettings) {
    var page_url = $.trim( window.location.href.split('#')[0] ).toLowerCase(); // TODO should pass this in instead of recomputing
    return removeSubdomainFromPageUrl(page_url, groupSettings);
}

// TODO copied from engage_full. Review.
function computeCanonicalUrl(groupSettings) {
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
    computePageUrl: computePageUrl,
    computeCanonicalUrl: computeCanonicalUrl
};
},{"../script-loader":10}]},{},[1,2,3,4,5,6,7,8,9,10,11,12])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi93aWRnZXQtbmV3L3NyYy9qcy9hbnRlbm5hLmpzIiwiLi4vd2lkZ2V0LW5ldy9zcmMvanMvZ3JvdXAtc2V0dGluZ3MtbG9hZGVyLmpzIiwiLi4vd2lkZ2V0LW5ldy9zcmMvanMvZ3JvdXAtc2V0dGluZ3MuanMiLCIuLi93aWRnZXQtbmV3L3NyYy9qcy9oYXNoLmpzIiwiLi4vd2lkZ2V0LW5ldy9zcmMvanMvbWQ1LmpzIiwiLi4vd2lkZ2V0LW5ldy9zcmMvanMvcGFnZS1kYXRhLWxvYWRlci5qcyIsIi4uL3dpZGdldC1uZXcvc3JjL2pzL3BhZ2UtZGF0YS5qcyIsIi4uL3dpZGdldC1uZXcvc3JjL2pzL3BhZ2UtcmVhY3Rpb25zLWxvYWRlci5qcyIsIi4uL3dpZGdldC1uZXcvc3JjL2pzL3BhZ2Utc2Nhbm5lci5qcyIsIi4uL3dpZGdldC1uZXcvc3JjL2pzL3NjcmlwdC1sb2FkZXIuanMiLCIuLi93aWRnZXQtbmV3L3NyYy9qcy9zdW1tYXJ5LXdpZGdldC5qcyIsIi4uL3dpZGdldC1uZXcvc3JjL2pzL3RlbXBsYXRlcy5qcyIsIi4uL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL3VybHMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBTY3JpcHRMb2FkZXIgPSByZXF1aXJlKCcuL3NjcmlwdC1sb2FkZXInKTtcblxudmFyIEdyb3VwU2V0dGluZ3NMb2FkZXIgPSByZXF1aXJlKCcuL2dyb3VwLXNldHRpbmdzLWxvYWRlcicpO1xudmFyIFBhZ2VEYXRhTG9hZGVyID0gcmVxdWlyZSgnLi9wYWdlLWRhdGEtbG9hZGVyJyk7XG52YXIgUGFnZVNjYW5uZXIgPSByZXF1aXJlKCcuL3BhZ2Utc2Nhbm5lcicpO1xuXG5mdW5jdGlvbiBsb2FkR3JvdXBTZXR0aW5ncygpIHtcbiAgICAvLyBPbmNlIHdlIGhhdmUgdGhlIHNldHRpbmdzLCB3ZSBjYW4ga2ljayBvZmYgYSBjb3VwbGUgdGhpbmdzIGluIHBhcmFsbGVsOlxuICAgIC8vXG4gICAgLy8gLS0gc3RhcnQgZmV0Y2hpbmcgdGhlIHBhZ2UgZGF0YVxuICAgIC8vIC0tIHN0YXJ0IGhhc2hpbmcgdGhlIHBhZ2VcbiAgICAvLyAtLSBzdGFydCBpbnNlcnRpbmcgdGhlIGFmZm9yZGFuY2VzIChpbiB0aGUgZW1wdHkgc3RhdGUpXG4gICAgLy9cbiAgICAvLyAgICBPbmNlIHRoZXNlIHRocmVlIHRhc2tzIGFsbCBjb21wbGV0ZSwgdGhlbiB3ZSBjYW4gdXBkYXRlIHRoZSBhZmZvcmRhbmNlcyB3aXRoIHRoZSBkYXRhIGFuZCB3ZSdyZSByZWFkeVxuICAgIC8vICAgIGZvciBhY3Rpb24uXG4gICAgR3JvdXBTZXR0aW5nc0xvYWRlci5sb2FkKGZ1bmN0aW9uKGdyb3VwU2V0dGluZ3MpIHtcbiAgICAgICAgZmV0Y2hQYWdlRGF0YShncm91cFNldHRpbmdzKTtcbiAgICAgICAgc2NhblBhZ2UoZ3JvdXBTZXR0aW5ncyk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGZldGNoUGFnZURhdGEoZ3JvdXBTZXR0aW5ncykge1xuICAgIFBhZ2VEYXRhTG9hZGVyLmxvYWQoZ3JvdXBTZXR0aW5ncywgZGF0YUxvYWRlZCk7XG59XG5cbmZ1bmN0aW9uIHNjYW5QYWdlKGdyb3VwU2V0dGluZ3MpIHtcbiAgICBQYWdlU2Nhbm5lci5zY2FuKGdyb3VwU2V0dGluZ3MsIHBhZ2VTY2FubmVkKTtcbn1cblxudmFyIGlzRGF0YUxvYWRlZCA9IGZhbHNlO1xudmFyIGlzUGFnZVNjYW5uZWQgPSBmYWxzZTtcblxuZnVuY3Rpb24gZGF0YUxvYWRlZChwYWdlRGF0YSkge1xuICAgIGlzRGF0YUxvYWRlZCA9IHRydWU7XG4gICAgaWYgKGlzRGF0YUxvYWRlZCAmJiBpc1BhZ2VTY2FubmVkKSB7XG4gICAgICAgIHBhZ2VSZWFkeSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gcGFnZVNjYW5uZWQoKSB7XG4gICAgaXNQYWdlU2Nhbm5lZCA9IHRydWU7XG4gICAgaWYgKGlzRGF0YUxvYWRlZCAmJiBpc1BhZ2VTY2FubmVkKSB7XG4gICAgICAgIHBhZ2VSZWFkeSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gcGFnZVJlYWR5KCkge1xuICAgIC8vIEF0IHRoaXMgcG9pbnQsIHRoZSBjb250YWluZXIgaGFzaGVzIGhhdmUgYmVlbiBjb21wdXRlZCwgdGhlIGFmZm9yZGFuY2VzIGluc2VydGVkLCBhbmQgdGhlIHBhZ2UgZGF0YSBmZXRjaGVkLlxuICAgIC8vIE5vdyB1cGRhdGUgdGhlIHN1bW1hcnkgd2lkZ2V0cyBhbmQgYWZmb3JkYW5jZXMuXG59XG5cbi8vIFRPRE8gdGhlIGNhc2NhZGUgaXMgcHJldHR5IGNsZWFyLCBidXQgY2FuIHdlIG9yY2hlc3RyYXRlIHRoaXMgYmV0dGVyP1xuU2NyaXB0TG9hZGVyLmxvYWQobG9hZEdyb3VwU2V0dGluZ3MpOyIsIlxudmFyIEdyb3VwU2V0dGluZ3MgPSByZXF1aXJlKCcuL2dyb3VwLXNldHRpbmdzJyk7XG52YXIgJDsgcmVxdWlyZSgnLi9zY3JpcHQtbG9hZGVyJykub24kKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG5cbi8vIFRPRE8gZm9sZCB0aGlzIG1vZHVsZSBpbnRvIGdyb3VwLXNldHRpbmdzP1xuXG5mdW5jdGlvbiBsb2FkU2V0dGluZ3MoY2FsbGJhY2spIHtcbiAgICAkLmdldEpTT05QKCcvYXBpL3NldHRpbmdzJywgeyBob3N0X25hbWU6IHdpbmRvdy5hbnRlbm5hX2hvc3QgfSwgc3VjY2VzcywgZXJyb3IpO1xuXG4gICAgZnVuY3Rpb24gc3VjY2Vzcyhqc29uKSB7XG4gICAgICAgIHZhciBncm91cFNldHRpbmdzID0gR3JvdXBTZXR0aW5ncy5jcmVhdGUoanNvbik7XG4gICAgICAgIGNhbGxiYWNrKGdyb3VwU2V0dGluZ3MpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGVycm9yKG1lc3NhZ2UpIHtcbiAgICAgICAgLy8gVE9ETyBoYW5kbGUgZXJyb3JzIHRoYXQgaGFwcGVuIHdoZW4gbG9hZGluZyBjb25maWcgZGF0YVxuICAgIH1cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGxvYWQ6IGxvYWRTZXR0aW5nc1xufTsiLCJcbnZhciAkO1xucmVxdWlyZSgnLi9zY3JpcHQtbG9hZGVyJykub24kKGZ1bmN0aW9uKGpRdWVyeSkge1xuICAgICQ9alF1ZXJ5O1xufSk7XG5cbi8vIFRPRE86IHRyaW0gdHJhaWxpbmcgY29tbWFzIGZyb20gYW55IHNlbGVjdG9yIHZhbHVlc1xuXG4vLyBUT0RPOiBSZXZpZXcuIFRoZXNlIGFyZSBqdXN0IGNvcGllZCBmcm9tIGVuZ2FnZV9mdWxsLlxudmFyIGRlZmF1bHRzID0ge1xuICAgICAgICBwcmVtaXVtOiBmYWxzZSxcbiAgICAgICAgaW1nX3NlbGVjdG9yOiBcImltZ1wiLFxuICAgICAgICBpbWdfY29udGFpbmVyX3NlbGVjdG9yczpcIiNwcmltYXJ5LXBob3RvXCIsXG4gICAgICAgIGFjdGl2ZV9zZWN0aW9uczogXCJib2R5XCIsXG4gICAgICAgIGFubm9fd2hpdGVsaXN0OiBcImJvZHkgcFwiLFxuICAgICAgICBhY3RpdmVfc2VjdGlvbnNfd2l0aF9hbm5vX3doaXRlbGlzdDpcIlwiLFxuICAgICAgICBtZWRpYV9zZWxlY3RvcjogXCJlbWJlZCwgdmlkZW8sIG9iamVjdCwgaWZyYW1lXCIsXG4gICAgICAgIGNvbW1lbnRfbGVuZ3RoOiA1MDAsXG4gICAgICAgIG5vX2FudDogXCJcIixcbiAgICAgICAgaW1nX2JsYWNrbGlzdDogXCJcIixcbiAgICAgICAgY3VzdG9tX2NzczogXCJcIixcbiAgICAgICAgLy90b2RvOiB0ZW1wIGlubGluZV9pbmRpY2F0b3IgZGVmYXVsdHMgdG8gbWFrZSB0aGVtIHNob3cgdXAgb24gYWxsIG1lZGlhIC0gcmVtb3ZlIHRoaXMgbGF0ZXIuXG4gICAgICAgIGlubGluZV9zZWxlY3RvcjogJ2ltZywgZW1iZWQsIHZpZGVvLCBvYmplY3QsIGlmcmFtZScsXG4gICAgICAgIHBhcmFncmFwaF9oZWxwZXI6IHRydWUsXG4gICAgICAgIG1lZGlhX3VybF9pZ25vcmVfcXVlcnk6IHRydWUsXG4gICAgICAgIHN1bW1hcnlfd2lkZ2V0X3NlbGVjdG9yOiAnLmFudC1wYWdlLXN1bW1hcnknLCAvLyBUT0RPOiB0aGlzIHdhc24ndCBkZWZpbmVkIGFzIGEgZGVmYXVsdCBpbiBlbmdhZ2VfZnVsbCwgYnV0IHdhcyBpbiBjb2RlLiB3aHk/XG4gICAgICAgIHN1bW1hcnlfd2lkZ2V0X21ldGhvZDogJ2FmdGVyJyxcbiAgICAgICAgbGFuZ3VhZ2U6ICdlbicsXG4gICAgICAgIGFiX3Rlc3RfaW1wYWN0OiB0cnVlLFxuICAgICAgICBhYl90ZXN0X3NhbXBsZV9wZXJjZW50YWdlOiAxMCxcbiAgICAgICAgaW1nX2luZGljYXRvcl9zaG93X29ubG9hZDogdHJ1ZSxcbiAgICAgICAgaW1nX2luZGljYXRvcl9zaG93X3NpZGU6ICdsZWZ0JyxcbiAgICAgICAgdGFnX2JveF9iZ19jb2xvcnM6ICcjMTg0MTRjOyMzNzYwNzY7MjE1LCAxNzksIDY5OyNlNjg4NWM7I2U0NjE1NicsXG4gICAgICAgIHRhZ19ib3hfdGV4dF9jb2xvcnM6ICcjZmZmOyNmZmY7I2ZmZjsjZmZmOyNmZmYnLFxuICAgICAgICB0YWdfYm94X2ZvbnRfZmFtaWx5OiAnSGVsdmV0aWNhTmV1ZSxIZWx2ZXRpY2EsQXJpYWwsc2Fucy1zZXJpZicsXG4gICAgICAgIHRhZ3NfYmdfY3NzOiAnJyxcbiAgICAgICAgaWdub3JlX3N1YmRvbWFpbjogZmFsc2UsXG4gICAgICAgIC8vdGhlIHNjb3BlIGluIHdoaWNoIHRvIGZpbmQgcGFyZW50cyBvZiA8YnI+IHRhZ3MuXG4gICAgICAgIC8vVGhvc2UgcGFyZW50cyB3aWxsIGJlIGNvbnZlcnRlZCB0byBhIDxydD4gYmxvY2ssIHNvIHRoZXJlIHdvbid0IGJlIG5lc3RlZCA8cD4gYmxvY2tzLlxuICAgICAgICAvL3RoZW4gaXQgd2lsbCBzcGxpdCB0aGUgcGFyZW50J3MgaHRtbCBvbiA8YnI+IHRhZ3MgYW5kIHdyYXAgdGhlIHNlY3Rpb25zIGluIDxwPiB0YWdzLlxuXG4gICAgICAgIC8vZXhhbXBsZTpcbiAgICAgICAgLy8gYnJfcmVwbGFjZV9zY29wZV9zZWxlY3RvcjogXCIuYW50X2JyX3JlcGxhY2VcIiAvL2UuZy4gXCIjbWFpbnNlY3Rpb25cIiBvciBcInBcIlxuXG4gICAgICAgIGJyX3JlcGxhY2Vfc2NvcGVfc2VsZWN0b3I6IG51bGwgLy9lLmcuIFwiI21haW5zZWN0aW9uXCIgb3IgXCJwXCJcbiAgICB9O1xuXG5mdW5jdGlvbiBjcmVhdGVGcm9tSlNPTihqc29uKSB7XG5cbiAgICBmdW5jdGlvbiBkYXRhKGtleSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgdmFsdWUgPSB3aW5kb3cuYW50ZW5uYV9leHRlbmRba2V5XTtcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IGpzb25ba2V5XTtcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCB8fCB2YWx1ZSA9PT0gJycpIHsgLy8gVE9ETzogU2hvdWxkIHRoZSBzZXJ2ZXIgYmUgc2VuZGluZyBiYWNrICcnIGhlcmUgb3Igbm90aGluZyBhdCBhbGw/IChJdCBwcmVjbHVkZXMgdGhlIHNlcnZlciBmcm9tIHJlYWxseSBzYXlpbmcgJ25vdGhpbmcnKVxuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IGRlZmF1bHRzW2tleV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIGdyb3VwSWQ6IGRhdGEoJ2lkJyksXG4gICAgICAgIGFjdGl2ZVNlY3Rpb25zOiBkYXRhKCdhY3RpdmVfc2VjdGlvbnMnKSxcbiAgICAgICAgdXJsOiB7XG4gICAgICAgICAgICBpZ25vcmVTdWJkb21haW46IGRhdGEoJ2lnbm9yZV9zdWJkb21haW4nKSxcbiAgICAgICAgICAgIGNhbm9uaWNhbERvbWFpbjogZGF0YSgncGFnZV90bGQnKSAvLyBUT0RPOiB3aGF0IHRvIGNhbGwgdGhpcyBleGFjdGx5LiBncm91cERvbWFpbj8gc2l0ZURvbWFpbj8gY2Fub25pY2FsRG9tYWluP1xuICAgICAgICB9LFxuICAgICAgICBzdW1tYXJ5U2VsZWN0b3I6IGRhdGEoJ3N1bW1hcnlfd2lkZ2V0X3NlbGVjdG9yJyksXG4gICAgICAgIHN1bW1hcnlNZXRob2Q6IGRhdGEoJ3N1bW1hcnlfd2lkZ2V0X21ldGhvZCcpLFxuICAgICAgICBwYWdlU2VsZWN0b3I6IGRhdGEoJ3Bvc3Rfc2VsZWN0b3InKSxcbiAgICAgICAgcGFnZUhyZWZTZWxlY3RvcjogZGF0YSgncG9zdF9ocmVmX3NlbGVjdG9yJyksXG4gICAgICAgIHRleHRTZWxlY3RvcjogZGF0YSgnYW5ub193aGl0ZWxpc3QnKVxuICAgIH1cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZTogY3JlYXRlRnJvbUpTT05cbn07IiwiXG52YXIgTUQ1ID0gcmVxdWlyZSgnLi9tZDUnKTtcblxuLy8gVE9ETzogVGhpcyBpcyBqdXN0IGNvcHkvcGFzdGVkIGZyb20gZW5nYWdlX2Z1bGxcbi8vIFRPRE86IFRoZSBjb2RlIGlzIGxvb2tpbmcgZm9yIC5hbnRfaW5kaWNhdG9yIHRvIHNlZSBpZiBpdCdzIGFscmVhZHkgYmVlbiBoYXNoZWQuIFJldmlldy5cbmZ1bmN0aW9uIGdldENsZWFuVGV4dCgkZG9tTm9kZSkge1xuICAgIC8vIEFOVC51dGlsLmdldENsZWFuVGV4dFxuICAgIC8vIGNvbW1vbiBmdW5jdGlvbiBmb3IgY2xlYW5pbmcgdGhlIHRleHQgbm9kZSB0ZXh0LiAgcmlnaHQgbm93LCBpdCdzIHJlbW92aW5nIHNwYWNlcywgdGFicywgbmV3bGluZXMsIGFuZCB0aGVuIGRvdWJsZSBzcGFjZXNcblxuICAgIHZhciAkbm9kZSA9ICRkb21Ob2RlLmNsb25lKCk7XG5cbiAgICAkbm9kZS5maW5kKCcuYW50LCAuYW50LWN1c3RvbS1jdGEtY29udGFpbmVyJykucmVtb3ZlKCk7XG5cbiAgICAvL21ha2Ugc3VyZSBpdCBkb2VzbnQgYWxyZWR5IGhhdmUgaW4gaW5kaWNhdG9yIC0gaXQgc2hvdWxkbid0LlxuICAgIHZhciAkaW5kaWNhdG9yID0gJG5vZGUuZmluZCgnLmFudF9pbmRpY2F0b3InKTtcbiAgICBpZigkaW5kaWNhdG9yLmxlbmd0aCl7XG4gICAgICAgIC8vdG9kbzogc2VuZCB1cyBhbiBlcnJvciByZXBvcnQgLSB0aGlzIG1heSBzdGlsbCBiZSBoYXBwZW5pbmcgZm9yIHNsaWRlc2hvd3MuXG4gICAgICAgIC8vVGhpcyBmaXggd29ya3MgZmluZSwgYnV0IHdlIHNob3VsZCBmaXggdGhlIGNvZGUgdG8gaGFuZGxlIGl0IGJlZm9yZSBoZXJlLlxuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gZ2V0IHRoZSBub2RlJ3MgdGV4dCBhbmQgc21hc2ggY2FzZVxuICAgIC8vIFRPRE86IDxicj4gdGFncyBhbmQgYmxvY2stbGV2ZWwgdGFncyBjYW4gc2NyZXcgdXAgd29yZHMuICBleDpcbiAgICAvLyBoZWxsbzxicj5ob3cgYXJlIHlvdT8gICBoZXJlIGJlY29tZXNcbiAgICAvLyBoZWxsb2hvdyBhcmUgeW91PyAgICA8LS0gbm8gc3BhY2Ugd2hlcmUgdGhlIDxicj4gd2FzLiAgYmFkLlxuICAgIHZhciBub2RlX3RleHQgPSAkLnRyaW0oICRub2RlLmh0bWwoKS5yZXBsYWNlKC88ICpiciAqXFwvPz4vZ2ksICcgJykgKTtcbiAgICB2YXIgYm9keSA9ICQudHJpbSggJCggXCI8ZGl2PlwiICsgbm9kZV90ZXh0ICsgXCI8L2Rpdj5cIiApLnRleHQoKS50b0xvd2VyQ2FzZSgpICk7XG5cbiAgICBpZiggYm9keSAmJiB0eXBlb2YgYm9keSA9PSBcInN0cmluZ1wiICYmIGJvZHkgIT09IFwiXCIgKSB7XG4gICAgICAgIHZhciBmaXJzdHBhc3MgPSBib2R5LnJlcGxhY2UoL1tcXG5cXHJcXHRdKy9naSwnICcpLnJlcGxhY2UoKS5yZXBsYWNlKC9cXHN7Mix9L2csJyAnKTtcbiAgICAgICAgLy8gc2VlaW5nIGlmIHRoaXMgaGVscHMgdGhlIHByb3B1YiBpc3N1ZSAtIHRvIHRyaW0gYWdhaW4uICBXaGVuIGkgcnVuIHRoaXMgbGluZSBhYm92ZSBpdCBsb29rcyBsaWtlIHRoZXJlIGlzIHN0aWxsIHdoaXRlIHNwYWNlLlxuICAgICAgICByZXR1cm4gJC50cmltKGZpcnN0cGFzcyk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBoYXNoVGV4dChlbGVtZW50KSB7XG4gICAgLy8gVE9ETzogSGFuZGxlIHRoZSBjYXNlIHdoZXJlIG11bHRpcGxlIGluc3RhbmNlcyBvZiB0aGUgc2FtZSB0ZXh0IGFwcGVhciBvbiB0aGUgcGFnZS4gTmVlZCB0byBhZGQgYW4gaW5jcmVtZW50IHRvXG4gICAgLy8gdGhlIGhhc2hUZXh0LiAoVGhpcyBjaGVjayBoYXMgdG8gYmUgc2NvcGVkIHRvIGEgcG9zdClcbiAgICB2YXIgdGV4dCA9IGdldENsZWFuVGV4dChlbGVtZW50KTtcbiAgICB2YXIgaGFzaFRleHQgPSBcInJkci10ZXh0LVwiK3RleHQ7XG4gICAgcmV0dXJuIE1ENS5oZXhfbWQ1KGhhc2hUZXh0KTtcbn1cblxuZnVuY3Rpb24gaGFzaEltYWdlKGVsZW1lbnQpIHtcblxufVxuXG5mdW5jdGlvbiBoYXNoTWVkaWEoZWxlbWVudCkge1xuXG59XG5cbmZ1bmN0aW9uIGhhc2hFbGVtZW50KGVsZW1lbnQpIHtcbiAgICAvLyBUT0RPIG1ha2UgcmVhbFxuICAgIHJldHVybiAnYWJjJztcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGhhc2hUZXh0OiBoYXNoVGV4dFxufTsiLCJcbi8vIFRPRE86IFRoaXMgY29kZSBpcyBqdXN0IGNvcGllZCBmcm9tIGVuZ2FnZV9mdWxsLmpzLiBSZXZpZXcgd2hldGhlciB3ZSB3YW50IHRvIGtlZXAgaXQgYXMtaXMuXG5cbnZhciBBTlQgPSB7XG4gICAgdXRpbDoge1xuICAgICAgICBtZDU6IHtcbiAgICAgICAgICAgIGhleGNhc2U6MCxcbiAgICAgICAgICAgIGI2NHBhZDpcIlwiLFxuICAgICAgICAgICAgY2hyc3o6OCxcbiAgICAgICAgICAgIGhleF9tZDU6IGZ1bmN0aW9uKHMpe3JldHVybiBBTlQudXRpbC5tZDUuYmlubDJoZXgoQU5ULnV0aWwubWQ1LmNvcmVfbWQ1KEFOVC51dGlsLm1kNS5zdHIyYmlubChzKSxzLmxlbmd0aCpBTlQudXRpbC5tZDUuY2hyc3opKTt9LFxuICAgICAgICAgICAgY29yZV9tZDU6IGZ1bmN0aW9uKHgsbGVuKXt4W2xlbj4+NV18PTB4ODA8PCgobGVuKSUzMik7eFsoKChsZW4rNjQpPj4+OSk8PDQpKzE0XT1sZW47dmFyIGE9MTczMjU4NDE5Mzt2YXIgYj0tMjcxNzMzODc5O3ZhciBjPS0xNzMyNTg0MTk0O3ZhciBkPTI3MTczMzg3ODtmb3IodmFyIGk9MDtpPHgubGVuZ3RoO2krPTE2KXt2YXIgb2xkYT1hO3ZhciBvbGRiPWI7dmFyIG9sZGM9Yzt2YXIgb2xkZD1kO2E9QU5ULnV0aWwubWQ1Lm1kNV9mZihhLGIsYyxkLHhbaSswXSw3LC02ODA4NzY5MzYpO2Q9QU5ULnV0aWwubWQ1Lm1kNV9mZihkLGEsYixjLHhbaSsxXSwxMiwtMzg5NTY0NTg2KTtjPUFOVC51dGlsLm1kNS5tZDVfZmYoYyxkLGEsYix4W2krMl0sMTcsNjA2MTA1ODE5KTtiPUFOVC51dGlsLm1kNS5tZDVfZmYoYixjLGQsYSx4W2krM10sMjIsLTEwNDQ1MjUzMzApO2E9QU5ULnV0aWwubWQ1Lm1kNV9mZihhLGIsYyxkLHhbaSs0XSw3LC0xNzY0MTg4OTcpO2Q9QU5ULnV0aWwubWQ1Lm1kNV9mZihkLGEsYixjLHhbaSs1XSwxMiwxMjAwMDgwNDI2KTtjPUFOVC51dGlsLm1kNS5tZDVfZmYoYyxkLGEsYix4W2krNl0sMTcsLTE0NzMyMzEzNDEpO2I9QU5ULnV0aWwubWQ1Lm1kNV9mZihiLGMsZCxhLHhbaSs3XSwyMiwtNDU3MDU5ODMpO2E9QU5ULnV0aWwubWQ1Lm1kNV9mZihhLGIsYyxkLHhbaSs4XSw3LDE3NzAwMzU0MTYpO2Q9QU5ULnV0aWwubWQ1Lm1kNV9mZihkLGEsYixjLHhbaSs5XSwxMiwtMTk1ODQxNDQxNyk7Yz1BTlQudXRpbC5tZDUubWQ1X2ZmKGMsZCxhLGIseFtpKzEwXSwxNywtNDIwNjMpO2I9QU5ULnV0aWwubWQ1Lm1kNV9mZihiLGMsZCxhLHhbaSsxMV0sMjIsLTE5OTA0MDQxNjIpO2E9QU5ULnV0aWwubWQ1Lm1kNV9mZihhLGIsYyxkLHhbaSsxMl0sNywxODA0NjAzNjgyKTtkPUFOVC51dGlsLm1kNS5tZDVfZmYoZCxhLGIsYyx4W2krMTNdLDEyLC00MDM0MTEwMSk7Yz1BTlQudXRpbC5tZDUubWQ1X2ZmKGMsZCxhLGIseFtpKzE0XSwxNywtMTUwMjAwMjI5MCk7Yj1BTlQudXRpbC5tZDUubWQ1X2ZmKGIsYyxkLGEseFtpKzE1XSwyMiwxMjM2NTM1MzI5KTthPUFOVC51dGlsLm1kNS5tZDVfZ2coYSxiLGMsZCx4W2krMV0sNSwtMTY1Nzk2NTEwKTtkPUFOVC51dGlsLm1kNS5tZDVfZ2coZCxhLGIsYyx4W2krNl0sOSwtMTA2OTUwMTYzMik7Yz1BTlQudXRpbC5tZDUubWQ1X2dnKGMsZCxhLGIseFtpKzExXSwxNCw2NDM3MTc3MTMpO2I9QU5ULnV0aWwubWQ1Lm1kNV9nZyhiLGMsZCxhLHhbaSswXSwyMCwtMzczODk3MzAyKTthPUFOVC51dGlsLm1kNS5tZDVfZ2coYSxiLGMsZCx4W2krNV0sNSwtNzAxNTU4NjkxKTtkPUFOVC51dGlsLm1kNS5tZDVfZ2coZCxhLGIsYyx4W2krMTBdLDksMzgwMTYwODMpO2M9QU5ULnV0aWwubWQ1Lm1kNV9nZyhjLGQsYSxiLHhbaSsxNV0sMTQsLTY2MDQ3ODMzNSk7Yj1BTlQudXRpbC5tZDUubWQ1X2dnKGIsYyxkLGEseFtpKzRdLDIwLC00MDU1Mzc4NDgpO2E9QU5ULnV0aWwubWQ1Lm1kNV9nZyhhLGIsYyxkLHhbaSs5XSw1LDU2ODQ0NjQzOCk7ZD1BTlQudXRpbC5tZDUubWQ1X2dnKGQsYSxiLGMseFtpKzE0XSw5LC0xMDE5ODAzNjkwKTtjPUFOVC51dGlsLm1kNS5tZDVfZ2coYyxkLGEsYix4W2krM10sMTQsLTE4NzM2Mzk2MSk7Yj1BTlQudXRpbC5tZDUubWQ1X2dnKGIsYyxkLGEseFtpKzhdLDIwLDExNjM1MzE1MDEpO2E9QU5ULnV0aWwubWQ1Lm1kNV9nZyhhLGIsYyxkLHhbaSsxM10sNSwtMTQ0NDY4MTQ2Nyk7ZD1BTlQudXRpbC5tZDUubWQ1X2dnKGQsYSxiLGMseFtpKzJdLDksLTUxNDAzNzg0KTtjPUFOVC51dGlsLm1kNS5tZDVfZ2coYyxkLGEsYix4W2krN10sMTQsMTczNTMyODQ3Myk7Yj1BTlQudXRpbC5tZDUubWQ1X2dnKGIsYyxkLGEseFtpKzEyXSwyMCwtMTkyNjYwNzczNCk7YT1BTlQudXRpbC5tZDUubWQ1X2hoKGEsYixjLGQseFtpKzVdLDQsLTM3ODU1OCk7ZD1BTlQudXRpbC5tZDUubWQ1X2hoKGQsYSxiLGMseFtpKzhdLDExLC0yMDIyNTc0NDYzKTtjPUFOVC51dGlsLm1kNS5tZDVfaGgoYyxkLGEsYix4W2krMTFdLDE2LDE4MzkwMzA1NjIpO2I9QU5ULnV0aWwubWQ1Lm1kNV9oaChiLGMsZCxhLHhbaSsxNF0sMjMsLTM1MzA5NTU2KTthPUFOVC51dGlsLm1kNS5tZDVfaGgoYSxiLGMsZCx4W2krMV0sNCwtMTUzMDk5MjA2MCk7ZD1BTlQudXRpbC5tZDUubWQ1X2hoKGQsYSxiLGMseFtpKzRdLDExLDEyNzI4OTMzNTMpO2M9QU5ULnV0aWwubWQ1Lm1kNV9oaChjLGQsYSxiLHhbaSs3XSwxNiwtMTU1NDk3NjMyKTtiPUFOVC51dGlsLm1kNS5tZDVfaGgoYixjLGQsYSx4W2krMTBdLDIzLC0xMDk0NzMwNjQwKTthPUFOVC51dGlsLm1kNS5tZDVfaGgoYSxiLGMsZCx4W2krMTNdLDQsNjgxMjc5MTc0KTtkPUFOVC51dGlsLm1kNS5tZDVfaGgoZCxhLGIsYyx4W2krMF0sMTEsLTM1ODUzNzIyMik7Yz1BTlQudXRpbC5tZDUubWQ1X2hoKGMsZCxhLGIseFtpKzNdLDE2LC03MjI1MjE5NzkpO2I9QU5ULnV0aWwubWQ1Lm1kNV9oaChiLGMsZCxhLHhbaSs2XSwyMyw3NjAyOTE4OSk7YT1BTlQudXRpbC5tZDUubWQ1X2hoKGEsYixjLGQseFtpKzldLDQsLTY0MDM2NDQ4Nyk7ZD1BTlQudXRpbC5tZDUubWQ1X2hoKGQsYSxiLGMseFtpKzEyXSwxMSwtNDIxODE1ODM1KTtjPUFOVC51dGlsLm1kNS5tZDVfaGgoYyxkLGEsYix4W2krMTVdLDE2LDUzMDc0MjUyMCk7Yj1BTlQudXRpbC5tZDUubWQ1X2hoKGIsYyxkLGEseFtpKzJdLDIzLC05OTUzMzg2NTEpO2E9QU5ULnV0aWwubWQ1Lm1kNV9paShhLGIsYyxkLHhbaSswXSw2LC0xOTg2MzA4NDQpO2Q9QU5ULnV0aWwubWQ1Lm1kNV9paShkLGEsYixjLHhbaSs3XSwxMCwxMTI2ODkxNDE1KTtjPUFOVC51dGlsLm1kNS5tZDVfaWkoYyxkLGEsYix4W2krMTRdLDE1LC0xNDE2MzU0OTA1KTtiPUFOVC51dGlsLm1kNS5tZDVfaWkoYixjLGQsYSx4W2krNV0sMjEsLTU3NDM0MDU1KTthPUFOVC51dGlsLm1kNS5tZDVfaWkoYSxiLGMsZCx4W2krMTJdLDYsMTcwMDQ4NTU3MSk7ZD1BTlQudXRpbC5tZDUubWQ1X2lpKGQsYSxiLGMseFtpKzNdLDEwLC0xODk0OTg2NjA2KTtjPUFOVC51dGlsLm1kNS5tZDVfaWkoYyxkLGEsYix4W2krMTBdLDE1LC0xMDUxNTIzKTtiPUFOVC51dGlsLm1kNS5tZDVfaWkoYixjLGQsYSx4W2krMV0sMjEsLTIwNTQ5MjI3OTkpO2E9QU5ULnV0aWwubWQ1Lm1kNV9paShhLGIsYyxkLHhbaSs4XSw2LDE4NzMzMTMzNTkpO2Q9QU5ULnV0aWwubWQ1Lm1kNV9paShkLGEsYixjLHhbaSsxNV0sMTAsLTMwNjExNzQ0KTtjPUFOVC51dGlsLm1kNS5tZDVfaWkoYyxkLGEsYix4W2krNl0sMTUsLTE1NjAxOTgzODApO2I9QU5ULnV0aWwubWQ1Lm1kNV9paShiLGMsZCxhLHhbaSsxM10sMjEsMTMwOTE1MTY0OSk7YT1BTlQudXRpbC5tZDUubWQ1X2lpKGEsYixjLGQseFtpKzRdLDYsLTE0NTUyMzA3MCk7ZD1BTlQudXRpbC5tZDUubWQ1X2lpKGQsYSxiLGMseFtpKzExXSwxMCwtMTEyMDIxMDM3OSk7Yz1BTlQudXRpbC5tZDUubWQ1X2lpKGMsZCxhLGIseFtpKzJdLDE1LDcxODc4NzI1OSk7Yj1BTlQudXRpbC5tZDUubWQ1X2lpKGIsYyxkLGEseFtpKzldLDIxLC0zNDM0ODU1NTEpO2E9QU5ULnV0aWwubWQ1LnNhZmVfYWRkKGEsb2xkYSk7Yj1BTlQudXRpbC5tZDUuc2FmZV9hZGQoYixvbGRiKTtjPUFOVC51dGlsLm1kNS5zYWZlX2FkZChjLG9sZGMpO2Q9QU5ULnV0aWwubWQ1LnNhZmVfYWRkKGQsb2xkZCk7fSByZXR1cm4gQXJyYXkoYSxiLGMsZCk7fSxcbiAgICAgICAgICAgIG1kNV9jbW46IGZ1bmN0aW9uKHEsYSxiLHgscyx0KXtyZXR1cm4gQU5ULnV0aWwubWQ1LnNhZmVfYWRkKEFOVC51dGlsLm1kNS5iaXRfcm9sKEFOVC51dGlsLm1kNS5zYWZlX2FkZChBTlQudXRpbC5tZDUuc2FmZV9hZGQoYSxxKSxBTlQudXRpbC5tZDUuc2FmZV9hZGQoeCx0KSkscyksYik7fSxcbiAgICAgICAgICAgIG1kNV9mZjogZnVuY3Rpb24oYSxiLGMsZCx4LHMsdCl7cmV0dXJuIEFOVC51dGlsLm1kNS5tZDVfY21uKChiJmMpfCgofmIpJmQpLGEsYix4LHMsdCk7fSxcbiAgICAgICAgICAgIG1kNV9nZzogZnVuY3Rpb24oYSxiLGMsZCx4LHMsdCl7cmV0dXJuIEFOVC51dGlsLm1kNS5tZDVfY21uKChiJmQpfChjJih+ZCkpLGEsYix4LHMsdCk7fSxcbiAgICAgICAgICAgIG1kNV9oaDogZnVuY3Rpb24oYSxiLGMsZCx4LHMsdCl7cmV0dXJuIEFOVC51dGlsLm1kNS5tZDVfY21uKGJeY15kLGEsYix4LHMsdCk7fSxcbiAgICAgICAgICAgIG1kNV9paTogZnVuY3Rpb24oYSxiLGMsZCx4LHMsdCl7cmV0dXJuIEFOVC51dGlsLm1kNS5tZDVfY21uKGNeKGJ8KH5kKSksYSxiLHgscyx0KTt9LFxuICAgICAgICAgICAgc2FmZV9hZGQ6IGZ1bmN0aW9uKHgseSl7dmFyIGxzdz0oeCYweEZGRkYpKyh5JjB4RkZGRik7dmFyIG1zdz0oeD4+MTYpKyh5Pj4xNikrKGxzdz4+MTYpO3JldHVybihtc3c8PDE2KXwobHN3JjB4RkZGRik7fSxcbiAgICAgICAgICAgIGJpdF9yb2w6IGZ1bmN0aW9uKG51bSxjbnQpe3JldHVybihudW08PGNudCl8KG51bT4+PigzMi1jbnQpKTt9LFxuICAgICAgICAgICAgLy90aGUgbGluZSBiZWxvdyBpcyBjYWxsZWQgb3V0IGJ5IGpzTGludCBiZWNhdXNlIGl0IHVzZXMgQXJyYXkoKSBpbnN0ZWFkIG9mIFtdLiAgV2UgY2FuIGlnbm9yZSwgb3IgSSdtIHN1cmUgd2UgY291bGQgY2hhbmdlIGl0IGlmIHdlIHdhbnRlZCB0by5cbiAgICAgICAgICAgIHN0cjJiaW5sOiBmdW5jdGlvbihzdHIpe3ZhciBiaW49QXJyYXkoKTt2YXIgbWFzaz0oMTw8QU5ULnV0aWwubWQ1LmNocnN6KS0xO2Zvcih2YXIgaT0wO2k8c3RyLmxlbmd0aCpBTlQudXRpbC5tZDUuY2hyc3o7aSs9QU5ULnV0aWwubWQ1LmNocnN6KXtiaW5baT4+NV18PShzdHIuY2hhckNvZGVBdChpL0FOVC51dGlsLm1kNS5jaHJzeikmbWFzayk8PChpJTMyKTt9cmV0dXJuIGJpbjt9LFxuICAgICAgICAgICAgYmlubDJoZXg6IGZ1bmN0aW9uKGJpbmFycmF5KXt2YXIgaGV4X3RhYj1BTlQudXRpbC5tZDUuaGV4Y2FzZT9cIjAxMjM0NTY3ODlBQkNERUZcIjpcIjAxMjM0NTY3ODlhYmNkZWZcIjt2YXIgc3RyPVwiXCI7Zm9yKHZhciBpPTA7aTxiaW5hcnJheS5sZW5ndGgqNDtpKyspe3N0cis9aGV4X3RhYi5jaGFyQXQoKGJpbmFycmF5W2k+PjJdPj4oKGklNCkqOCs0KSkmMHhGKStoZXhfdGFiLmNoYXJBdCgoYmluYXJyYXlbaT4+Ml0+PigoaSU0KSo4KSkmMHhGKTt9IHJldHVybiBzdHI7fVxuICAgICAgICB9XG4gICAgfVxufTtcblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGhleF9tZDU6IEFOVC51dGlsLm1kNS5oZXhfbWQ1XG59OyIsIlxudmFyIFBhZ2VEYXRhID0gcmVxdWlyZSgnLi9wYWdlLWRhdGEnKTtcbnZhciBVUkxzID0gcmVxdWlyZSgnLi91dGlscy91cmxzJyk7XG52YXIgJDsgcmVxdWlyZSgnLi9zY3JpcHQtbG9hZGVyJykub24kKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG5cblxuZnVuY3Rpb24gY29tcHV0ZVBhZ2VUaXRsZSgpIHtcbiAgICB2YXIgdGl0bGUgPSAkKCdtZXRhW3Byb3BlcnR5PVwib2c6dGl0bGVcIl0nKS5hdHRyKCdjb250ZW50Jyk7XG4gICAgaWYgKCF0aXRsZSkge1xuICAgICAgICB0aXRsZSA9ICQoJ3RpdGxlJykudGV4dCgpIHx8ICcnO1xuICAgIH1cbiAgICByZXR1cm4gJC50cmltKHRpdGxlKTtcbn1cblxuXG4vLyBDb21wdXRlIHRoZSBwYWdlcyB0aGF0IHdlIG5lZWQgdG8gZmV0Y2guIFRoaXMgaXMgZWl0aGVyOlxuLy8gMS4gQW55IG5lc3RlZCBwYWdlcyB3ZSBmaW5kIHVzaW5nIHRoZSBwYWdlIHNlbGVjdG9yIE9SXG4vLyAyLiBUaGUgY3VycmVudCB3aW5kb3cgbG9jYXRpb25cbmZ1bmN0aW9uIGNvbXB1dGVQYWdlc1BhcmFtKGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgcGFnZXMgPSBbXTtcblxuICAgIHZhciBncm91cElkID0gZ3JvdXBTZXR0aW5ncy5ncm91cElkKCk7XG4gICAgdmFyICRwYWdlRWxlbWVudHMgPSAkKGdyb3VwU2V0dGluZ3MucGFnZVNlbGVjdG9yKCkpO1xuICAgIGlmICgkcGFnZUVsZW1lbnRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgJHBhZ2VFbGVtZW50cy5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyICRwYWdlRWxlbWVudCA9ICQodGhpcyk7XG4gICAgICAgICAgICB2YXIgdXJsID0gJHBhZ2VFbGVtZW50LmZpbmQoZ3JvdXBTZXR0aW5ncy5wYWdlSHJlZlNlbGVjdG9yKCkpLmF0dHIoJ2hyZWYnKTtcbiAgICAgICAgICAgIHBhZ2VzLnB1c2goe1xuICAgICAgICAgICAgICAgIGdyb3VwX2lkOiBncm91cElkLFxuICAgICAgICAgICAgICAgIHVybDogdXJsLFxuICAgICAgICAgICAgICAgIGNhbm9uaWNhbF91cmw6ICcnLCAvLyBUT0RPXG4gICAgICAgICAgICAgICAgaW1hZ2U6ICcnLCAvLyBUT0RPXG4gICAgICAgICAgICAgICAgdGl0bGU6ICcnIC8vIFRPRE9cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBwYWdlcy5wdXNoKHtcbiAgICAgICAgICAgIGdyb3VwX2lkOiBncm91cElkLFxuICAgICAgICAgICAgdXJsOiBVUkxzLmNvbXB1dGVQYWdlVXJsKGdyb3VwU2V0dGluZ3MpLFxuICAgICAgICAgICAgY2Fub25pY2FsX3VybDogVVJMcy5jb21wdXRlQ2Fub25pY2FsVXJsKGdyb3VwU2V0dGluZ3MpLFxuICAgICAgICAgICAgaW1hZ2U6ICcnLCAvLyBUT0RPXG4gICAgICAgICAgICB0aXRsZTogY29tcHV0ZVBhZ2VUaXRsZSgpXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiBwYWdlcztcbn1cblxuZnVuY3Rpb24gbG9hZFBhZ2VEYXRhKGdyb3VwU2V0dGluZ3MsIGNhbGxiYWNrKSB7XG4gICAgdmFyIHBhZ2VzUGFyYW0gPSBjb21wdXRlUGFnZXNQYXJhbShncm91cFNldHRpbmdzKTtcbiAgICAkLmdldEpTT05QKCcvYXBpL3BhZ2UnLCB7IHBhZ2VzOiBwYWdlc1BhcmFtIH0sIHN1Y2Nlc3MsIGVycm9yKTtcblxuICAgIGZ1bmN0aW9uIHN1Y2Nlc3MoanNvbikge1xuICAgICAgICB2YXIgcGFnZURhdGEgPSBQYWdlRGF0YS5jcmVhdGUoanNvbik7XG4gICAgICAgIGNhbGxiYWNrKHBhZ2VEYXRhKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBlcnJvcihtZXNzYWdlKSB7XG4gICAgICAgIC8vIFRPRE8gaGFuZGxlIGVycm9ycyB0aGF0IGhhcHBlbiB3aGVuIGxvYWRpbmcgcGFnZSBkYXRhXG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgbG9hZDogbG9hZFBhZ2VEYXRhXG59OyIsIlxudmFyICQ7XG5yZXF1aXJlKCcuL3NjcmlwdC1sb2FkZXInKS5vbiQoZnVuY3Rpb24oalF1ZXJ5KSB7XG4gICAgJD1qUXVlcnk7XG59KTtcblxuLy8gVE9ETyB0aGlzIGlzIHRvdGFsbHkgc3BlY3VsYXRpdmUhXG5cbnZhciBlbGVtZW50cyA9IHt9OyAvLyBoYXNoIC0tPiBlbGVtZW50XG52YXIgaW50ZXJhY3Rpb25zID0ge307IC8vIGhhc2ggLS0+IGludGVyYWN0aW9uc1xuXG5mdW5jdGlvbiBjb21wdXRlSGFzaCgkZWxlbWVudCkge1xuICAgIC8vIFRPRE9cbiAgICByZXR1cm4gJ2FiYyc7XG59XG5cbmZ1bmN0aW9uIGdldEhhc2goZWxlbWVudCkgeyAvLyBUT0RPIHBhc3MgaW4gRE9NIG5vZGUgb3IgY2FuIHdlIGFzc3VtZSBqUXVlcnk/XG4gICAgdmFyICRlbGVtZW50ID0gJChlbGVtZW50KTtcbiAgICB2YXIgaWQgPSAkZWxlbWVudC5kYXRhKCdhbnQtaWQnKTtcbiAgICB2YXIgaGFzaCA9IGhhc2hlc1tpZF07XG4gICAgaWYgKCFoYXNoKSB7XG4gICAgICAgIGhhc2ggPSBjb21wdXRlSGFzaCgkZWxlbWVudCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBzZXRIYXNoKGhhc2gsIGVsZW1lbnQpIHtcbiAgICBlbGVtZW50c1toYXNoXSA9IGVsZW1lbnQ7XG4gICAgLy8gVE9ET1xufVxuXG5mdW5jdGlvbiBnZXRFbGVtZW50KGhhc2gpIHtcbiAgICAvLyBUT0RPIHJldHVybiB0aGUgZWxlbWVudCB3aXRoIHRoZSBnaXZlbiBoYXNoXG59XG5cbmZ1bmN0aW9uIGdldEludGVyYWN0aW9ucyhjb250ZW50KSB7XG5cbn1cblxuZnVuY3Rpb24gY3JlYXRlUGFnZShqc29uKSB7XG4gICAgdmFyIG51bVJlYWN0aW9ucyA9IDA7XG4gICAgdmFyIG51bUNvbW1lbnRzID0gMDtcbiAgICB2YXIgbnVtU2hhcmVzID0gMDtcblxuICAgIHZhciBzdW1tYXJ5RW50cmllcyA9IGpzb24uc3VtbWFyeTtcbiAgICBpZiAoc3VtbWFyeUVudHJpZXMpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdW1tYXJ5RW50cmllcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIHN1bW1hcnlFbnRyeSA9IHN1bW1hcnlFbnRyaWVzW2ldO1xuICAgICAgICAgICAgaWYgKHN1bW1hcnlFbnRyeS5raW5kID09PSAndGFnJykge1xuICAgICAgICAgICAgICAgIG51bVJlYWN0aW9ucyA9IHN1bW1hcnlFbnRyeS5jb3VudDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc3VtbWFyeUVudHJ5LmtpbmQgPT09ICdjb20nKSB7XG4gICAgICAgICAgICAgICAgbnVtQ29tbWVudHMgPSBzdW1tYXJ5RW50cnkuY291bnQ7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHN1bW1hcnlFbnRyeS5raW5kID09PSAnc2hyJykge1xuICAgICAgICAgICAgICAgIG51bVNoYXJlcyA9IHN1bW1hcnlFbnRyeS5jb3VudDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHZhciB0b3BSZWFjdGlvbnMgPSBbXTtcbiAgICB2YXIgcmVhY3Rpb25zRGF0YSA9IGpzb24udG9wdGFncztcbiAgICBpZiAocmVhY3Rpb25zRGF0YSkge1xuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHJlYWN0aW9uc0RhdGEubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIHZhciByZWFjdGlvbiA9IHJlYWN0aW9uc0RhdGFbal07XG4gICAgICAgICAgICB0b3BSZWFjdGlvbnNbal0gPSB7XG4gICAgICAgICAgICAgICAgaWQ6IHJlYWN0aW9uLmlkLFxuICAgICAgICAgICAgICAgIGNvdW50OiByZWFjdGlvbi50YWdfY291bnQsXG4gICAgICAgICAgICAgICAgdGV4dDogcmVhY3Rpb24uYm9keVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcGFnZUlkOiBqc29uLmlkLFxuICAgICAgICBwYWdlSGFzaDoganNvbi51cmxoYXNoLFxuICAgICAgICBzdW1tYXJ5OiB7XG4gICAgICAgICAgICB0b3RhbFJlYWN0aW9uczogbnVtUmVhY3Rpb25zLFxuICAgICAgICAgICAgdG90YWxDb21tZW50czogbnVtQ29tbWVudHMsXG4gICAgICAgICAgICB0b3RhbFNoYXJlczogbnVtU2hhcmVzXG4gICAgICAgIH0sXG4gICAgICAgIHRvcFJlYWN0aW9uczogdG9wUmVhY3Rpb25zLFxuICAgICAgICBjb250YWluZXJzOiBqc29uLmNvbnRhaW5lcnMgLy8gYXJyYXkgb2Ygb2JqZWN0cyB3aXRoICdpZCcgYW5kICdoYXNoJyBwcm9wZXJ0aWVzLCBpbmNsdWRpbmcgdGhlIG1hZ2ljICdwYWdlJyBoYXNoIHZhbHVlXG4gICAgfTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlRnJvbUpTT04oanNvblBhZ2VzKSB7XG4gICAgLy8gVE9ETyBQdXQgbW9yZSBzdHJ1Y3R1cmUgYXJvdW5kIHRoaXM/IGUuZy4gTG9va3VwIGZ1bmN0aW9ucz9cbiAgICBwYWdlcyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwganNvblBhZ2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHBhZ2VzW2ldID0gY3JlYXRlUGFnZShqc29uUGFnZXNbaV0pO1xuICAgIH1cbiAgICByZXR1cm4gcGFnZXM7XG5cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZTogY3JlYXRlRnJvbUpTT04sXG4gICAgc2V0SGFzaDogc2V0SGFzaCxcbiAgICBnZXRIYXNoOiBnZXRIYXNoLFxuICAgIGdldEludGVyYWN0aW9uczogZ2V0SW50ZXJhY3Rpb25zXG59OyIsIlxuLy92YXIgJCA9IHJlcXVpcmUoJy4vanF1ZXJ5Jyk7XG52YXIgJDtcbnJlcXVpcmUoJy4vc2NyaXB0LWxvYWRlcicpLm9uJChmdW5jdGlvbihqUXVlcnkpIHtcbiAgICAkPWpRdWVyeTtcbn0pO1xuXG4vLyBUT0RPIHRoaXMgaXMganVzdCByYW5kb20gaW5jb21wbGV0ZSBzbmlwcGV0c1xuXG5mdW5jdGlvbiBjcmVhdGVQYWdlUGFyYW0oZ3JvdXBTZXR0aW5ncykge1xuICAgIHJldHVybiB7XG4gICAgICAgIGdyb3VwX2lkOiBncm91cFNldHRpbmdzLmlkLFxuICAgICAgICB1cmw6ICcnLFxuICAgICAgICBjYW5vbmljYWxfdXJsOiAnJyxcbiAgICAgICAgdGl0bGU6ICcnLFxuICAgICAgICBpbWFnZTogJydcbiAgICB9O1xufVxuXG5cblxuZnVuY3Rpb24gbG9hZFBhZ2Uoc2V0dGluZ3MpIHtcbiAgICBhbGVydChKU09OLnN0cmluZ2lmeShzZXR0aW5ncywgbnVsbCwgMikpO1xuICAgICQuZ2V0SlNPTlAoJy9hcGkvcGFnZScsIHtcbiAgICAgICAgICAgIHBhZ2VzOiBbe1xuICAgICAgICAgICAgICAgIGdyb3VwX2lkOiBzZXR0aW5ncy5pZCxcblxuICAgICAgICAgICAgfV1cbiAgICAgICAgfSwgZnVuY3Rpb24ocGFnZXMpIHtcbiAgICAgICAgICAgIGFsZXJ0KEpTT04uc3RyaW5naWZ5KHBhZ2VzLCBudWxsLCAyKSk7XG4gICAgICAgIH0pO1xuXG59XG5cbmZ1bmN0aW9uIGxvYWRQYWdlcygpIHtcblxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgbG9hZFBhZ2U6IGxvYWRQYWdlLFxuICAgIGxvYWRQYWdlczogbG9hZFBhZ2VzXG59OyIsIlxuLy92YXIgJCA9IHJlcXVpcmUoJy4vanF1ZXJ5Jyk7XG52YXIgVGVtcGxhdGVzID0gcmVxdWlyZSgnLi90ZW1wbGF0ZXMnKTtcbnZhciBIYXNoID0gcmVxdWlyZSgnLi9oYXNoJyk7XG4vL3ZhciBTdW1tYXJ5V2lkZ2V0ID0gcmVxdWlyZSgnLi9zdW1tYXJ5LXdpZGdldCcpO1xudmFyICQ7XG5yZXF1aXJlKCcuL3NjcmlwdC1sb2FkZXInKS5vbiQoZnVuY3Rpb24oalF1ZXJ5KSB7XG4gICAgJD1qUXVlcnk7XG59KTtcblxudmFyIGhhc2hlcyA9IHt9O1xuXG4vLyBTY2FuIHRoZSBwYWdlIHVzaW5nIHRoZSBnaXZlbiBzZXR0aW5nczpcbi8vIDEuIEZpbmQgYWxsIHRoZSBjb250YWluZXJzIHRoYXQgd2UgY2FyZSBhYm91dC5cbi8vIDIuIEluc2VydCB3aWRnZXQgYWZmb3JkYW5jZXMgZm9yIGVhY2guXG4vLyAzLiBDb21wdXRlIGhhc2hlcyBmb3IgZWFjaCBjb250YWluZXIuXG4vLyAgICBUT0RPOiBBbHNvIG5lZWQgdG8gY29tcHV0ZSBoYXNoZXMgZm9yIGFueSByZWFjdGVkIGNvbnRlbnQgKGkuZS4gdGV4dCBzZWxlY3Rpb25zKSwgYnV0IHdlIG9ubHkgaGF2ZSB0aGF0IGluZm8gYWZ0ZXJcbi8vICAgICAgICAgIFdlIGdldCBiYWNrIHRoZSBwYWdlIGRhdGEuIERvbid0IHdhbnQgdG8gd2FpdCBmb3IgdGhhdCBuZXR3b3JrIHJlcXVlc3QgYmVmb3JlIHdlIHN0YXJ0IGRvaW5nIHRoaXMgd29yaywgdGhvdWdoLlxuLy8gICAgICAgICAgU28gd2Ugc2hvdWxkIHByb2JhYmx5IGp1c3QgbWFrZSBhbm90aGVyIHBhc3MgZm9yIHRob3NlIG90aGVyIGNvbnRlbnQgcGllY2VzIGxhdGVyIHdoZW4gd2UgZ2V0IGJhY2sgdGhlIHBhZ2UgZGF0YS5cbmZ1bmN0aW9uIHNjYW5QYWdlKGdyb3VwU2V0dGluZ3MsIGNhbGxiYWNrKSB7XG4gICAgdmFyICRhY3RpdmVTZWN0aW9ucyA9ICQoZ3JvdXBTZXR0aW5ncy5hY3RpdmVTZWN0aW9ucygpKTtcbiAgICAkYWN0aXZlU2VjdGlvbnMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRzZWN0aW9uID0gJCh0aGlzKTtcbiAgICAgICAgLy8gRmlyc3QsIHNjYW4gZm9yIGVsZW1lbnRzIHRoYXQgd291bGQgY2F1c2UgdXMgdG8gaW5zZXJ0IHNvbWV0aGluZyBpbnRvIHRoZSBET00gdGhhdCB0YWtlcyB1cCBzcGFjZS5cbiAgICAgICAgLy8gV2Ugd2FudCB0byBnZXQgYW55IHBhZ2UgcmVzaXppbmcgb3V0IG9mIHRoZSB3YXkgYXMgZWFybHkgYXMgcG9zc2libGUuXG4gICAgICAgIHNjYW5Gb3JTdW1tYXJ5KCRzZWN0aW9uLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgc2NhbkZvclBhZ2VzKCRzZWN0aW9uLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgc2NhbkZvckNhbGxzVG9BY3Rpb24oJHNlY3Rpb24sIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAvLyBUaGVuIHNjYW4gZm9yIGV2ZXJ5dGhpbmcgZWxzZVxuICAgICAgICBzY2FuRm9yVGV4dCgkc2VjdGlvbiwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIHNjYW5Gb3JJbWFnZXMoJHNlY3Rpb24sIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICBzY2FuRm9yTWVkaWEoJHNlY3Rpb24sIGdyb3VwU2V0dGluZ3MpO1xuICAgIH0pO1xuICAgIGNhbGxiYWNrKCk7XG59XG5cbmZ1bmN0aW9uIHNjYW5Gb3JTdW1tYXJ5KCRzZWN0aW9uLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyICRzdW1tYXJpZXMgPSAkc2VjdGlvbi5maW5kKGdyb3VwU2V0dGluZ3Muc3VtbWFyeVNlbGVjdG9yKCkpO1xuICAgICRzdW1tYXJpZXMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGNvbnRhaW5lciA9ICQoJzxkaXY+PC9kaXY+Jyk7XG4gICAgICAgIGluc2VydENvbnRlbnQoJCh0aGlzKSwgVGVtcGxhdGVzLnN1bW1hcnkoKSwgZ3JvdXBTZXR0aW5ncy5zdW1tYXJ5TWV0aG9kKCkpO1xuICAgICAgICAvL2luc2VydENvbnRlbnQoJCh0aGlzKSwgY29udGFpbmVyLCBncm91cFNldHRpbmdzLnN1bW1hcnlNZXRob2QoKSk7XG4gICAgICAgIC8vdmFyIHN1bW1hcnlXaWRnZXQgPSBTdW1tYXJ5V2lkZ2V0LmNyZWF0ZShjb250YWluZXIsIHt9KTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gc2NhbkZvclBhZ2VzKCRzZWN0aW9uLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIHBhZ2VzID0gJHNlY3Rpb24uZmluZChncm91cFNldHRpbmdzLnBhZ2VTZWxlY3RvcigpKTtcbiAgICAvLyBUT0RPXG59XG5cbmZ1bmN0aW9uIHNjYW5Gb3JDYWxsc1RvQWN0aW9uKCRzZWN0aW9uLCBncm91cFNldHRpbmdzKSB7XG4gICAgLy8gVE9ET1xufVxuXG5mdW5jdGlvbiBzY2FuRm9yVGV4dCgkc2VjdGlvbiwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciAkdGV4dEVsZW1lbnRzID0gJHNlY3Rpb24uZmluZChncm91cFNldHRpbmdzLnRleHRTZWxlY3RvcigpKTtcbiAgICAvLyBUT0RPOiBvbmx5IHNlbGVjdCBcImxlYWZcIiBlbGVtZW50c1xuICAgICR0ZXh0RWxlbWVudHMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRlbGVtZW50ID0gJCh0aGlzKTtcbiAgICAgICAgLy8gVE9ETyBwb3NpdGlvbiBjb3JyZWN0bHlcbiAgICAgICAgLy8gVE9ETyBoYXNoIGFuZCBhZGQgaGFzaCBkYXRhIHRvIGluZGljYXRvclxuICAgICAgICB2YXIgaGFzaCA9IEhhc2guaGFzaFRleHQoJGVsZW1lbnQpO1xuICAgICAgICAkZWxlbWVudC5hcHBlbmQoVGVtcGxhdGVzLmluZGljYXRvcihoYXNoKSk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIHNjYW5Gb3JJbWFnZXMoJHNlY3Rpb24sIGdyb3VwU2V0dGluZ3MpIHtcbiAgICAvLyBUT0RPXG59XG5cbmZ1bmN0aW9uIHNjYW5Gb3JNZWRpYSgkc2VjdGlvbiwgZ3JvdXBTZXR0aW5ncykge1xuICAgIC8vIFRPRE9cbn1cblxuZnVuY3Rpb24gaW5zZXJ0Q29udGVudCgkcGFyZW50LCBjb250ZW50LCBtZXRob2QpIHtcbiAgICBzd2l0Y2ggKG1ldGhvZCkge1xuICAgICAgICBjYXNlICdhcHBlbmQnOlxuICAgICAgICAgICAgJHBhcmVudC5hcHBlbmQoY29udGVudCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAncHJlcGVuZCc6XG4gICAgICAgICAgICAkcGFyZW50LnByZXBlbmQoY29udGVudCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnYmVmb3JlJzpcbiAgICAgICAgICAgICRwYXJlbnQuYmVmb3JlKGNvbnRlbnQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2FmdGVyJzpcbiAgICAgICAgICAgICRwYXJlbnQuYWZ0ZXIoY29udGVudCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICB9XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgIHNjYW46IHNjYW5QYWdlXG59OyIsIlxudmFyIGJhc2VVcmwgPSAnaHR0cDovL2xvY2FsaG9zdDo4MDgxJzsgLy8gVE9ETyBjb21wdXRlIHRoaXNcblxudmFyICQ7XG52YXIgalF1ZXJ5Q2FsbGJhY2tzID0gW107XG5cbmZ1bmN0aW9uIG9uJChjYWxsYmFjaykge1xuICAgIGlmICgkKSB7XG4gICAgICAgIGNhbGxiYWNrKCQpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGpRdWVyeUNhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGpRdWVyeUxvYWRlZCgpIHtcbiAgICAvLyBVcGRhdGUgdGhlICQgdGhhdCB3ZSBkZWZpbmUgd2l0aGluIG91ciBvd24gY2xvc3VyZSB0byB0aGUgdmVyc2lvbiBvZiBqUXVlcnkgdGhhdCB3ZSB3YW50IGFuZCByZXNldCB0aGUgZ2xvYmFsICRcbiAgICAkID0galF1ZXJ5Lm5vQ29uZmxpY3QodHJ1ZSk7XG5cbiAgICAkLmdldEpTT05QID0gZnVuY3Rpb24odXJsLCBkYXRhLCBzdWNjZXNzLCBlcnJvcikge1xuICAgICAgICB2YXIgb3B0aW9ucyA9IHtcbiAgICAgICAgICAgIHVybDogYmFzZVVybCArIHVybCwgLy8gVE9ETyBiYXNlIHVybFxuICAgICAgICAgICAgdHlwZTogXCJnZXRcIixcbiAgICAgICAgICAgIGNvbnRlbnRUeXBlOiBcImFwcGxpY2F0aW9uL2pzb25cIixcbiAgICAgICAgICAgIGRhdGFUeXBlOiBcImpzb25wXCIsXG4gICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbihyZXNwb25zZSwgdGV4dFN0YXR1cywgWEhSKSB7XG4gICAgICAgICAgICAgICAgLy8gVE9ETzogUmV2aXNpdCB3aGV0aGVyIGl0J3MgcmVhbGx5IGNvb2wgdG8ga2V5IHRoaXMgb24gdGhlIHRleHRTdGF0dXMgb3IgaWYgd2Ugc2hvdWxkIGJlIGxvb2tpbmcgYXRcbiAgICAgICAgICAgICAgICAvLyAgICAgICB0aGUgc3RhdHVzIGNvZGUgaW4gdGhlIFhIUlxuICAgICAgICAgICAgICAgIGlmICh0ZXh0U3RhdHVzID09PSAnc3VjY2VzcycpIHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzcyhyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBGb3IgSlNPTlAgcmVxdWVzdHMsIGpRdWVyeSBkb2Vzbid0IGNhbGwgaXQncyBlcnJvciBjYWxsYmFjay4gSXQgY2FsbHMgc3VjY2VzcyBpbnN0ZWFkLlxuICAgICAgICAgICAgICAgICAgICBlcnJvcihyZXNwb25zZS5tZXNzYWdlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIGlmIChkYXRhKSB7XG4gICAgICAgICAgICBvcHRpb25zLmRhdGEgPSB7IGpzb246IEpTT04uc3RyaW5naWZ5KGRhdGEpIH07XG4gICAgICAgIH1cbiAgICAgICAgJC5hamF4KG9wdGlvbnMpO1xuICAgIH07XG5cbiAgICB3aGlsZSAoalF1ZXJ5Q2FsbGJhY2tzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgalF1ZXJ5Q2FsbGJhY2tzLnBvcCgpKCQpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gbG9hZFNjcmlwdHMobG9hZGVkQ2FsbGJhY2spIHtcbiAgICB2YXIgc2NyaXB0cyA9IFtcbiAgICAgICAgeyBzcmM6ICcvL2NkbmpzLmNsb3VkZmxhcmUuY29tL2FqYXgvbGlicy9qcXVlcnkvMi4xLjQvanF1ZXJ5Lm1pbi5qcycsIGNhbGxiYWNrOiBqUXVlcnlMb2FkZWQgfSxcbiAgICAgICAgeyBzcmM6ICcvL2NkbmpzLmNsb3VkZmxhcmUuY29tL2FqYXgvbGlicy9yYWN0aXZlLzAuNy4zL3JhY3RpdmUubWluLmpzJ31cbiAgICBdO1xuICAgIC8vIFRPRE86IGtleSB0aGlzIG9mZiBzb21lIGtpbmQgb2YgZmxhZy5cbiAgICAvLyBVbmNvbW1lbnQgdGhlIGZvbGxvd2luZyB0byB3b3JrIG9mZmxpbmU6XG4gICAgc2NyaXB0cyA9IFtcbiAgICAgICAgeyBzcmM6IGJhc2VVcmwgKyAnL3N0YXRpYy9qcy9jZG4vanF1ZXJ5LzIuMS40L2pxdWVyeS5taW4uanMnLCBjYWxsYmFjazogalF1ZXJ5TG9hZGVkIH0sXG4gICAgICAgIHsgc3JjOiBiYXNlVXJsICsgJy9zdGF0aWMvanMvY2RuL3JhY3RpdmUvMC43LjMvcmFjdGl2ZS5taW4uanMnfVxuICAgIF07XG4gICAgdmFyIGxvYWRpbmdDb3VudCA9IHNjcmlwdHMubGVuZ3RoO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2NyaXB0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgc2NyaXB0ID0gc2NyaXB0c1tpXTtcbiAgICAgICAgbG9hZFNjcmlwdChzY3JpcHQuc3JjLCBmdW5jdGlvbihzY3JpcHRDYWxsYmFjaykge1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmIChzY3JpcHRDYWxsYmFjaykgc2NyaXB0Q2FsbGJhY2soKTtcbiAgICAgICAgICAgICAgICBsb2FkaW5nQ291bnQgPSBsb2FkaW5nQ291bnQgLSAxO1xuICAgICAgICAgICAgICAgIGlmIChsb2FkaW5nQ291bnQgPT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAobG9hZGVkQ2FsbGJhY2spIGxvYWRlZENhbGxiYWNrKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSAoc2NyaXB0LmNhbGxiYWNrKSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBsb2FkU2NyaXB0KHNyYywgY2FsbGJhY2spIHtcbiAgICB2YXIgaGVhZCA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF07XG4gICAgaWYgKGhlYWQpIHtcbiAgICAgICAgdmFyIHNjcmlwdFRhZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuICAgICAgICBzY3JpcHRUYWcuc2V0QXR0cmlidXRlKCdzcmMnLCBzcmMpO1xuICAgICAgICBzY3JpcHRUYWcuc2V0QXR0cmlidXRlKCd0eXBlJywndGV4dC9qYXZhc2NyaXB0Jyk7XG5cbiAgICAgICAgaWYgKHNjcmlwdFRhZy5yZWFkeVN0YXRlKSB7IC8vIElFLCBpbmNsLiBJRTlcbiAgICAgICAgICAgIHNjcmlwdFRhZy5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBpZiAoc2NyaXB0VGFnLnJlYWR5U3RhdGUgPT0gXCJsb2FkZWRcIiB8fCBzY3JpcHRUYWcucmVhZHlTdGF0ZSA9PSBcImNvbXBsZXRlXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgc2NyaXB0VGFnLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNjcmlwdFRhZy5vbmxvYWQgPSBmdW5jdGlvbigpIHsgLy8gT3RoZXIgYnJvd3NlcnNcbiAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIGhlYWQuYXBwZW5kQ2hpbGQoc2NyaXB0VGFnKTtcbiAgICB9XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBsb2FkOiBsb2FkU2NyaXB0cyxcbiAgICBvbiQ6IG9uJFxufTsiLCIvL1xuLy8vL3ZhciBSYWN0aXZlID0gcmVxdWlyZSgncmFjdGl2ZScpO1xuLy9cbi8vZnVuY3Rpb24gY3JlYXRlU3VtbWFyeVdpZGdldChjb250YWluZXIsIHBhZ2VTdW1tYXJ5KSB7XG4vLyAgICB2YXIgcmFjdGl2ZSA9IG5ldyBSYWN0aXZlKHtcbi8vICAgICAgICBlbDogY29udGFpbmVyLFxuLy8gICAgICAgIHRlbXBsYXRlOiAnPGRpdiBzdHlsZT1cIndpZHRoOjUwcHg7IGhlaWdodDogMjBweDsgYm9yZGVyLXJhZGl1czozcHg7IGJhY2tncm91bmQtY29sb3I6IGJsdWU7IGZsb2F0OmxlZnQ7XCI+e3twYWdlU3VtbWFyeS5udW1SZWFjdGlvbnN9fTwvZGl2PicsXG4vLyAgICAgICAgZGF0YTogcGFnZVN1bW1hcnlcbi8vICAgIH0pO1xuLy8gICAgcmV0dXJuIHJhY3RpdmU7XG4vL31cbi8vXG4vL21vZHVsZS5leHBvcnRzID0ge1xuLy8gICAgY3JlYXRlOiBjcmVhdGVTdW1tYXJ5V2lkZ2V0XG4vL307IiwiXG5cbi8vIFRPRE8gdXNlIGFjdHVhbCB0ZW1wbGF0ZXMuIDopXG5cbmZ1bmN0aW9uIGluZGljYXRvcihoYXNoKSB7XG4gICAgcmV0dXJuICQoJzxkaXYgc3R5bGU9XCJ3aWR0aDoyMHB4OyBoZWlnaHQ6IDIwcHg7IGJvcmRlci1yYWRpdXM6MjBweDsgYmFja2dyb3VuZC1jb2xvcjogcmVkOyBmbG9hdDpyaWdodDtcIiAnICtcbiAgICAgICAgICAgICdkYXRhLWFudC1oYXNoPVwiJyArIGhhc2ggKyAnXCI+PC9kaXY+Jyk7XG59XG5cbmZ1bmN0aW9uIHN1bW1hcnkoKSB7XG4gICAgcmV0dXJuICQoJzxkaXYgc3R5bGU9XCJ3aWR0aDo1MHB4OyBoZWlnaHQ6IDIwcHg7IGJvcmRlci1yYWRpdXM6M3B4OyBiYWNrZ3JvdW5kLWNvbG9yOiBibHVlOyBmbG9hdDpsZWZ0O1wiPjwvZGl2PicpO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgaW5kaWNhdG9yOiBpbmRpY2F0b3IsXG4gICAgc3VtbWFyeTogc3VtbWFyeVxufTsiLCJcbnZhciAkOyByZXF1aXJlKCcuLi9zY3JpcHQtbG9hZGVyJykub24kKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG5cbi8vIFRPRE8gY29waWVkIGZyb20gZW5nYWdlX2Z1bGwuIFJldmlldy5cbmZ1bmN0aW9uIGNvbXB1dGVQYWdlVXJsKGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgcGFnZV91cmwgPSAkLnRyaW0oIHdpbmRvdy5sb2NhdGlvbi5ocmVmLnNwbGl0KCcjJylbMF0gKS50b0xvd2VyQ2FzZSgpOyAvLyBUT0RPIHNob3VsZCBwYXNzIHRoaXMgaW4gaW5zdGVhZCBvZiByZWNvbXB1dGluZ1xuICAgIHJldHVybiByZW1vdmVTdWJkb21haW5Gcm9tUGFnZVVybChwYWdlX3VybCwgZ3JvdXBTZXR0aW5ncyk7XG59XG5cbi8vIFRPRE8gY29waWVkIGZyb20gZW5nYWdlX2Z1bGwuIFJldmlldy5cbmZ1bmN0aW9uIGNvbXB1dGVDYW5vbmljYWxVcmwoZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBwYWdlX3VybCA9ICQudHJpbSggd2luZG93LmxvY2F0aW9uLmhyZWYuc3BsaXQoJyMnKVswXSApLnRvTG93ZXJDYXNlKCk7IC8vIFRPRE8gc2hvdWxkIHBhc3MgdGhpcyBpbiBpbnN0ZWFkIG9mIHJlY29tcHV0aW5nXG4gICAgdmFyIGNhbm9uaWNhbF91cmwgPSAoICQoJ2xpbmtbcmVsPVwiY2Fub25pY2FsXCJdJykubGVuZ3RoID4gMCApID9cbiAgICAgICAgICAgICAgICAkKCdsaW5rW3JlbD1cImNhbm9uaWNhbFwiXScpLmF0dHIoJ2hyZWYnKSA6IHBhZ2VfdXJsO1xuXG4gICAgLy8gYW50OnVybCBvdmVycmlkZXNcbiAgICBpZiAoICQoJ1twcm9wZXJ0eT1cImFudGVubmE6dXJsXCJdJykubGVuZ3RoID4gMCApIHtcbiAgICAgICAgY2Fub25pY2FsX3VybCA9ICQoJ1twcm9wZXJ0eT1cImFudGVubmE6dXJsXCJdJykuYXR0cignY29udGVudCcpO1xuICAgIH1cblxuICAgIGNhbm9uaWNhbF91cmwgPSAkLnRyaW0oIGNhbm9uaWNhbF91cmwudG9Mb3dlckNhc2UoKSApO1xuXG4gICAgaWYgKGNhbm9uaWNhbF91cmwgPT0gY29tcHV0ZVBhZ2VVcmwoZ3JvdXBTZXR0aW5ncykgKSB7IC8vIFRPRE8gc2hvdWxkIHBhc3MgdGhpcyBpbiBpbnN0ZWFkIG9mIHJlY29tcHV0aW5nXG4gICAgICAgIGNhbm9uaWNhbF91cmwgPSBcInNhbWVcIjtcbiAgICB9XG5cbiAgICAvLyBmYXN0Y28gZml4IChzaW5jZSB0aGV5IHNvbWV0aW1lcyByZXdyaXRlIHRoZWlyIGNhbm9uaWNhbCB0byBzaW1wbHkgYmUgdGhlaXIgVExELilcbiAgICAvLyBpbiB0aGUgY2FzZSB3aGVyZSBjYW5vbmljYWwgY2xhaW1zIFRMRCBidXQgd2UncmUgYWN0dWFsbHkgb24gYW4gYXJ0aWNsZS4uLiBzZXQgY2Fub25pY2FsIHRvIGJlIHRoZSBwYWdlX3VybFxuICAgIHZhciB0bGQgPSAkLnRyaW0od2luZG93LmxvY2F0aW9uLnByb3RvY29sKycvLycrd2luZG93LmxvY2F0aW9uLmhvc3RuYW1lKycvJykudG9Mb3dlckNhc2UoKTtcbiAgICBpZiAoIGNhbm9uaWNhbF91cmwgPT0gdGxkICkge1xuICAgICAgICBpZiAocGFnZV91cmwgIT0gdGxkKSB7XG4gICAgICAgICAgICBjYW5vbmljYWxfdXJsID0gcGFnZV91cmw7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcmVtb3ZlU3ViZG9tYWluRnJvbVBhZ2VVcmwoJC50cmltKGNhbm9uaWNhbF91cmwpLCBncm91cFNldHRpbmdzKTtcbn1cblxuLy8gVE9ETyBjb3BpZWQgZnJvbSBlbmdhZ2VfZnVsbC4gUmV2aWV3LlxuZnVuY3Rpb24gcmVtb3ZlU3ViZG9tYWluRnJvbVBhZ2VVcmwodXJsLCBncm91cFNldHRpbmdzKSB7XG4gICAgLy8gQU5ULmFjdGlvbnMucmVtb3ZlU3ViZG9tYWluRnJvbVBhZ2VVcmw6XG4gICAgLy8gaWYgXCJpZ25vcmVfc3ViZG9tYWluXCIgaXMgY2hlY2tlZCBpbiBzZXR0aW5ncywgQU5EIHRoZXkgc3VwcGx5IGEgVExELFxuICAgIC8vIHRoZW4gbW9kaWZ5IHRoZSBwYWdlIGFuZCBjYW5vbmljYWwgVVJMcyBoZXJlLlxuICAgIC8vIGhhdmUgdG8gaGF2ZSB0aGVtIHN1cHBseSBvbmUgYmVjYXVzZSB0aGVyZSBhcmUgdG9vIG1hbnkgdmFyaWF0aW9ucyB0byByZWxpYWJseSBzdHJpcCBzdWJkb21haW5zICAoLmNvbSwgLmlzLCAuY29tLmFyLCAuY28udWssIGV0YylcbiAgICBpZiAoZ3JvdXBTZXR0aW5ncy51cmwuaWdub3JlU3ViZG9tYWluKCkgPT0gdHJ1ZSAmJiBncm91cFNldHRpbmdzLnVybC5jYW5vbmljYWxEb21haW4oKSkge1xuICAgICAgICB2YXIgSE9TVERPTUFJTiA9IC9bLVxcd10rXFwuKD86Wy1cXHddK1xcLnhuLS1bLVxcd10rfFstXFx3XXsyLH18Wy1cXHddK1xcLlstXFx3XXsyfSkkL2k7XG4gICAgICAgIHZhciBzcmNBcnJheSA9IHVybC5zcGxpdCgnLycpO1xuXG4gICAgICAgIHZhciBwcm90b2NvbCA9IHNyY0FycmF5WzBdO1xuICAgICAgICBzcmNBcnJheS5zcGxpY2UoMCwzKTtcblxuICAgICAgICB2YXIgcmV0dXJuVXJsID0gcHJvdG9jb2wgKyAnLy8nICsgZ3JvdXBTZXR0aW5ncy51cmwuY2Fub25pY2FsRG9tYWluKCkgKyAnLycgKyBzcmNBcnJheS5qb2luKCcvJyk7XG5cbiAgICAgICAgcmV0dXJuIHJldHVyblVybDtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdXJsO1xuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY29tcHV0ZVBhZ2VVcmw6IGNvbXB1dGVQYWdlVXJsLFxuICAgIGNvbXB1dGVDYW5vbmljYWxVcmw6IGNvbXB1dGVDYW5vbmljYWxVcmxcbn07Il19
