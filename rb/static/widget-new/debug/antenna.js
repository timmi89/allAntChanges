(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/Users/jburns/antenna/rb/static/widget-new/src/js/antenna.js":[function(require,module,exports){

var ScriptLoader = require('./script-loader');
var CssLoader = require('./css-loader');
var GroupSettingsLoader = require('./group-settings-loader');
var PageDataLoader = require('./page-data-loader');
var PageScanner = require('./page-scanner');
var PageData = require('./page-data');
var XDMLoader = require('./utils/xdm-loader');

function loadGroupSettings() {
    // Once we have the settings, we can kick off a couple things in parallel:
    //
    // -- start fetching the page data
    // -- start hashing the page and inserting the affordances (in the empty state)
    //
    //    Once these tasks complete, then we can update the affordances with the data and we're ready
    //    for action.
    GroupSettingsLoader.load(function(groupSettings) {
        initXdmFrame(groupSettings);
        fetchPageData(groupSettings);
        scanPage(groupSettings);
    });
}

function initXdmFrame(groupSettings) {
    XDMLoader.createXDMframe(groupSettings.groupId);
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
},{"./css-loader":"/Users/jburns/antenna/rb/static/widget-new/src/js/css-loader.js","./group-settings-loader":"/Users/jburns/antenna/rb/static/widget-new/src/js/group-settings-loader.js","./page-data":"/Users/jburns/antenna/rb/static/widget-new/src/js/page-data.js","./page-data-loader":"/Users/jburns/antenna/rb/static/widget-new/src/js/page-data-loader.js","./page-scanner":"/Users/jburns/antenna/rb/static/widget-new/src/js/page-scanner.js","./script-loader":"/Users/jburns/antenna/rb/static/widget-new/src/js/script-loader.js","./utils/xdm-loader":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/xdm-loader.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/css-loader.js":[function(require,module,exports){

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
            // TODO bringing in multiple css files breaks the way we wait until our CSS is loaded before showing our content.
            //      we need to find a way to bring that back. one simple way - also compile the antenna-font.css into the antenna.css file.
            //      open question - how does it all play with font icons that are downloaded as yet another file?
            baseUrl + '/static/css/antenna-font/antenna-font.css',
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
},{"./script-loader":"/Users/jburns/antenna/rb/static/widget-new/src/js/script-loader.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/page-data-loader.js":[function(require,module,exports){

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
var Hash = require('./utils/hash');
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
        var container = $('<div class="ant-summary-container"></div>');
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
},{"./page-data":"/Users/jburns/antenna/rb/static/widget-new/src/js/page-data.js","./script-loader":"/Users/jburns/antenna/rb/static/widget-new/src/js/script-loader.js","./summary-widget":"/Users/jburns/antenna/rb/static/widget-new/src/js/summary-widget.js","./templates":"/Users/jburns/antenna/rb/static/widget-new/src/js/templates.js","./utils/hash":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/hash.js","./utils/urls":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/urls.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/reactions-widget.js":[function(require,module,exports){

var $; require('./script-loader').on$(function(jQuery) { $=jQuery; });
var XDMClient = require('./utils/xdm-client');
var URLs = require('./utils/urls');

var ractive;

function createReactionsWidget(container, pageData) {
    var reactionsData = pageData.topReactions;
    var layoutClasses = computeLayoutClasses(reactionsData);
    ractive = Ractive({
        el: container,
        magic: true,
        data: {
            reactions: reactionsData,
            layoutClass: function(index) {
                console.log(reactionsData);
                return layoutClasses[index];
            }
        },
        template: require('../templates/reactions-widget.html')
    });
    ractive.on('complete', function() {
        $(rootElement())
                .on('mouseover', keepWindowOpen)
                .on('mouseout', delayedCloseWindow);
    });
    ractive.on('change', function() {
        layoutClasses = computeLayoutClasses(reactionsData);
    });
    ractive.on('plusone', function(event) {
        var reactionData = event.context;
        reactionData.count = reactionData.count + 1;
        // TODO: check back on this as the way to propogate data changes back to the summary
        pageData.summary.totalReactions = pageData.summary.totalReactions + 1;


        // TODO send the click to the server

        XDMClient.getUser(function(response) {
            var userInfo = response.data;
            // TODO extract the shape of this data and possibly the whole API call
            // TODO this is only handling the summary case. need to generalize the widget to handle containers/content
            var data = {
                tag: {
                    body: reactionData.text,
                    id: reactionData.id,
                    tag_count: reactionData.count // TODO why??
                },
                hash: 'page',
                kind: 'page',
                content_node: '',
                user: {
                    img_url: '', // TODO why?
                    ant_token: userInfo.ant_token,
                    user_id: userInfo.user_id,
                    sts: '', // TODO ??
                    lts: '', // TODO ??
                    user_type: userInfo.user_type // TODO what is this?
                },
                user_id: userInfo.user_id

            };
            var success = function(json) {
                console.log('success!');
            };
            var error = function(message) {
                console.log("error!");
            };
            $.getJSONP(URLs.createReactionUrl(), data, success, error);
        });
    });
    return {
        open: openWindow
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
        total += reactionsData[i].count;
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
        var $relativeElement = $(relativeElement);
        var offset = $relativeElement.offset();
        var coords = {
            top: offset.top + $relativeElement.height(),
            left: offset.left
        };
        var $element = $(rootElement());
        $element.stop(true, true).addClass('open').css(coords);
    }

}

var closeTimer;

function keepWindowOpen() {
    if (closeTimer) { clearTimeout(closeTimer); }
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
},{"../templates/reactions-widget.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/reactions-widget.html","./script-loader":"/Users/jburns/antenna/rb/static/widget-new/src/js/script-loader.js","./utils/urls":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/urls.js","./utils/xdm-client":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/xdm-client.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/script-loader.js":[function(require,module,exports){

var isOffline = require('./utils/offline');

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
    if (isOffline) {
        // Use the offline versions of the libraries for development.
        scripts = [
            {src: baseUrl + '/static/js/cdn/jquery/2.1.4/jquery.js', callback: jQueryLoaded},
            {src: baseUrl + '/static/js/cdn/ractive/0.7.3/ractive.runtime.js'}
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
},{"./utils/offline":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/offline.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/summary-widget.js":[function(require,module,exports){

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
        oncomplete: function() {
            var that = this;
            $(rootElement()).on('click', function(event) { // TODO: delete. this is just toy
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
    // TODO: our click handler is getting called twice, so it looks like this somehow gets the wrong element if there are two summary widgets together?
    return ractive.find('div');
}

function openReactionsWindow(pageData) {
    if (!reactionsWidget) {
        // TODO: consider prepopulating this
        var bucket = getWidgetBucket();
        var container = document.createElement('div');
        bucket.appendChild(container);
        reactionsWidget = ReactionsWidget.create(container, pageData);
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
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/hash.js":[function(require,module,exports){

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
},{"./md5":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/md5.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/md5.js":[function(require,module,exports){

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
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/offline.js":[function(require,module,exports){

var offline;

function isOffline() {
    if (offline === undefined) {
        // TODO: Do something cross-browser here. This won't work in IE.
        // TODO: Make this more flexible so it works in everyone's dev environment
        offline = document.currentScript.src === 'http://localhost:8081/static/widget-new/debug/antenna.js';
    }
    return offline;
}

module.exports = isOffline();
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/urls.js":[function(require,module,exports){

var $; require('../script-loader').on$(function(jQuery) { $=jQuery; });

var offline = require('./offline.js');

function antennaHome() {
    if (offline) {
        return window.location.protocol + "//local.antenna.is:8081";
    }
    return window.location.protocol + "//www.antenna.is";
}

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

function getCreateReactionUrl() {
    return '/api/tag/create';
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
    computeCanonicalUrl: computePageElementCanonicalUrl,
    antennaHome: antennaHome,
    createReactionUrl: getCreateReactionUrl
};
},{"../script-loader":"/Users/jburns/antenna/rb/static/widget-new/src/js/script-loader.js","./offline.js":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/offline.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/xdm-client.js":[function(require,module,exports){

var URLs = require('./urls');

// Register ourselves to hear messages
window.addEventListener("message", receiveMessage, false);

var callbacks = { 'xdm loaded': xdmLoaded };
var cache = {};

var isXDMLoaded = false;
// The initial message that XDM sends out when it loads
function xdmLoaded(data) {
    isXDMLoaded = true;
}

function getUser(callback) {
    var message = 'getUser';
    postMessage(message, 'returning_user', true, callback);
}

function receiveMessage(event) {
    var eventOrigin = event.origin;
    if (eventOrigin === URLs.antennaHome()) {
        var response = JSON.parse(event.data);
        // TODO: The event.source property gives us the source window of the message and currently the XDM frame fires out
        // events that we receive before we ever try to post anything. So we *could* hold onto the window here and use it
        // for posting messages rather than looking for the XDM frame ourselves. Need to look at which events the XDM frame
        // fires out to all windows before being asked. Currently, it's more than "xdm loaded". Why?
        //var sourceWindow = event.source;

        var callbackKey = response.status; // TODO: change the name of this property in xdm.html
        cache[callbackKey] = response;
        var callback = callbacks[callbackKey];
        if (callback) {
            callback(response);
        }
    }
}

function postMessage(message, callbackKey, accept_cached, callback) {

    var targetOrigin = URLs.antennaHome();
    callbacks[callbackKey] = callback;

    if (isXDMLoaded) {
        if (accept_cached && cache[callbackKey] !== undefined) {
            callback(cache[callbackKey]);
        } else {
            var xdmFrame = getXDMFrame();
            if (xdmFrame) {
                xdmFrame.postMessage(message, targetOrigin);
            }
        }
    }
}

function getXDMFrame() {
    // TODO: Is this a security problem? What prevents someone from using this same name and intercepting our messages?
    return window.frames['ant-xdm-hidden'];
}

module.exports = {
    getUser: getUser
};
},{"./urls":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/urls.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/xdm-loader.js":[function(require,module,exports){

var URLs = require('./urls');

function createXDMframe(groupId) {
    //ANT.session.receiveMessage({}, function() {
    //    ANT.util.userLoginState();
    //});


    var iframeUrl = URLs.antennaHome() + "/static/widget-new/xdm/xdm.html",
    parentUrl = window.location.href,
    parentHost = window.location.protocol + "//" + window.location.host,
    // TODO: Restore the bookmarklet attribute on the iFrame?
    //bookmarklet = ( ANT.engageScriptParams.bookmarklet ) ? "bookmarklet=true":"",
    bookmarklet = "",
    // TODO: Restore the groupName attribute. (What is it for?)
    $xdmIframe = $('<iframe id="ant-xdm-hidden" name="ant-xdm-hidden" src="' + iframeUrl + '?parentUrl=' + parentUrl + '&parentHost=' + parentHost + '&group_id='+groupId+'" width="1" height="1" style="position:absolute;top:-1000px;left:-1000px;" />');
    //$xdmIframe = $('<iframe id="ant-xdm-hidden" name="ant-xdm-hidden" src="' + iframeUrl + '?parentUrl=' + parentUrl + '&parentHost=' + parentHost + '&group_id='+groupId+'&group_name='+encodeURIComponent(groupName)+'&'+bookmarklet+'" width="1" height="1" style="position:absolute;top:-1000px;left:-1000px;" />');
    $(getWidgetBucket()).append( $xdmIframe );
}

// TODO refactor this with the copy of it in summary-widget
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
    createXDMframe: createXDMframe
};
},{"./urls":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/urls.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/templates/reactions-widget.html":[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna antenna-reactions-widget"},"f":[{"t":7,"e":"div","a":{"class":"antenna-header"},"f":[]}," ",{"t":7,"e":"div","a":{"class":"antenna-body"},"f":[{"t":4,"f":[{"t":7,"e":"div","v":{"click":"plusone"},"a":{"class":["antenna-reaction ",{"t":2,"x":{"r":["layoutClass","index","./count"],"s":"_0(_1,_2)"}}]},"f":[" ",{"t":7,"e":"div","a":{"class":"antenna-reaction-text"},"f":[{"t":2,"r":"./text"}]}," ",{"t":7,"e":"div","a":{"class":"antenna-reaction-count"},"f":[{"t":2,"r":"./count"}]}]}],"n":52,"i":"index","r":"reactions"}]}," ",{"t":7,"e":"div","a":{"class":"antenna-footer"},"f":[]}]}]}
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/templates/summary-widget.html":[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna ant-summary-widget","ant-hash":[{"t":2,"r":"pageHash"}]},"f":[{"t":7,"e":"a","a":{"href":"http://www.antenna.is","target":"_blank"},"f":[{"t":7,"e":"span","a":{"class":"ant-antenna-logo"}}]}," ",{"t":4,"f":[{"t":7,"e":"span","a":{"class":"antenna-summary-text"},"f":[{"t":4,"f":[{"t":2,"r":"summary.totalReactions"}],"n":50,"r":"summary.totalReactions"}," Reactions"]}],"n":50,"x":{"r":["summary.totalReactions"],"s":"_0!==undefined"}}]}]}
},{}]},{},["/Users/jburns/antenna/rb/static/widget-new/src/js/antenna.js","/Users/jburns/antenna/rb/static/widget-new/src/js/css-loader.js","/Users/jburns/antenna/rb/static/widget-new/src/js/group-settings-loader.js","/Users/jburns/antenna/rb/static/widget-new/src/js/group-settings.js","/Users/jburns/antenna/rb/static/widget-new/src/js/page-data-loader.js","/Users/jburns/antenna/rb/static/widget-new/src/js/page-data.js","/Users/jburns/antenna/rb/static/widget-new/src/js/page-reactions-loader.js","/Users/jburns/antenna/rb/static/widget-new/src/js/page-scanner.js","/Users/jburns/antenna/rb/static/widget-new/src/js/reactions-widget.js","/Users/jburns/antenna/rb/static/widget-new/src/js/script-loader.js","/Users/jburns/antenna/rb/static/widget-new/src/js/summary-widget.js","/Users/jburns/antenna/rb/static/widget-new/src/js/templates.js","/Users/jburns/antenna/rb/static/widget-new/src/templates/reactions-widget.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/summary-widget.html"])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi93aWRnZXQtbmV3L3NyYy9qcy9hbnRlbm5hLmpzIiwiLi4vd2lkZ2V0LW5ldy9zcmMvanMvY3NzLWxvYWRlci5qcyIsIi4uL3dpZGdldC1uZXcvc3JjL2pzL2dyb3VwLXNldHRpbmdzLWxvYWRlci5qcyIsIi4uL3dpZGdldC1uZXcvc3JjL2pzL2dyb3VwLXNldHRpbmdzLmpzIiwiLi4vd2lkZ2V0LW5ldy9zcmMvanMvcGFnZS1kYXRhLWxvYWRlci5qcyIsIi4uL3dpZGdldC1uZXcvc3JjL2pzL3BhZ2UtZGF0YS5qcyIsIi4uL3dpZGdldC1uZXcvc3JjL2pzL3BhZ2UtcmVhY3Rpb25zLWxvYWRlci5qcyIsIi4uL3dpZGdldC1uZXcvc3JjL2pzL3BhZ2Utc2Nhbm5lci5qcyIsIi4uL3dpZGdldC1uZXcvc3JjL2pzL3JlYWN0aW9ucy13aWRnZXQuanMiLCIuLi93aWRnZXQtbmV3L3NyYy9qcy9zY3JpcHQtbG9hZGVyLmpzIiwiLi4vd2lkZ2V0LW5ldy9zcmMvanMvc3VtbWFyeS13aWRnZXQuanMiLCIuLi93aWRnZXQtbmV3L3NyYy9qcy90ZW1wbGF0ZXMuanMiLCIuLi93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9oYXNoLmpzIiwiLi4vd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvbWQ1LmpzIiwiLi4vd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvb2ZmbGluZS5qcyIsIi4uL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL3VybHMuanMiLCIuLi93aWRnZXQtbmV3L3NyYy9qcy91dGlscy94ZG0tY2xpZW50LmpzIiwiLi4vd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMveGRtLWxvYWRlci5qcyIsIi4uL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9yZWFjdGlvbnMtd2lkZ2V0Lmh0bWwiLCIuLi93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvc3VtbWFyeS13aWRnZXQuaHRtbCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTs7QUNBQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJcbnZhciBTY3JpcHRMb2FkZXIgPSByZXF1aXJlKCcuL3NjcmlwdC1sb2FkZXInKTtcbnZhciBDc3NMb2FkZXIgPSByZXF1aXJlKCcuL2Nzcy1sb2FkZXInKTtcbnZhciBHcm91cFNldHRpbmdzTG9hZGVyID0gcmVxdWlyZSgnLi9ncm91cC1zZXR0aW5ncy1sb2FkZXInKTtcbnZhciBQYWdlRGF0YUxvYWRlciA9IHJlcXVpcmUoJy4vcGFnZS1kYXRhLWxvYWRlcicpO1xudmFyIFBhZ2VTY2FubmVyID0gcmVxdWlyZSgnLi9wYWdlLXNjYW5uZXInKTtcbnZhciBQYWdlRGF0YSA9IHJlcXVpcmUoJy4vcGFnZS1kYXRhJyk7XG52YXIgWERNTG9hZGVyID0gcmVxdWlyZSgnLi91dGlscy94ZG0tbG9hZGVyJyk7XG5cbmZ1bmN0aW9uIGxvYWRHcm91cFNldHRpbmdzKCkge1xuICAgIC8vIE9uY2Ugd2UgaGF2ZSB0aGUgc2V0dGluZ3MsIHdlIGNhbiBraWNrIG9mZiBhIGNvdXBsZSB0aGluZ3MgaW4gcGFyYWxsZWw6XG4gICAgLy9cbiAgICAvLyAtLSBzdGFydCBmZXRjaGluZyB0aGUgcGFnZSBkYXRhXG4gICAgLy8gLS0gc3RhcnQgaGFzaGluZyB0aGUgcGFnZSBhbmQgaW5zZXJ0aW5nIHRoZSBhZmZvcmRhbmNlcyAoaW4gdGhlIGVtcHR5IHN0YXRlKVxuICAgIC8vXG4gICAgLy8gICAgT25jZSB0aGVzZSB0YXNrcyBjb21wbGV0ZSwgdGhlbiB3ZSBjYW4gdXBkYXRlIHRoZSBhZmZvcmRhbmNlcyB3aXRoIHRoZSBkYXRhIGFuZCB3ZSdyZSByZWFkeVxuICAgIC8vICAgIGZvciBhY3Rpb24uXG4gICAgR3JvdXBTZXR0aW5nc0xvYWRlci5sb2FkKGZ1bmN0aW9uKGdyb3VwU2V0dGluZ3MpIHtcbiAgICAgICAgaW5pdFhkbUZyYW1lKGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICBmZXRjaFBhZ2VEYXRhKGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICBzY2FuUGFnZShncm91cFNldHRpbmdzKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gaW5pdFhkbUZyYW1lKGdyb3VwU2V0dGluZ3MpIHtcbiAgICBYRE1Mb2FkZXIuY3JlYXRlWERNZnJhbWUoZ3JvdXBTZXR0aW5ncy5ncm91cElkKTtcbn1cblxuZnVuY3Rpb24gZmV0Y2hQYWdlRGF0YShncm91cFNldHRpbmdzKSB7XG4gICAgUGFnZURhdGFMb2FkZXIubG9hZChncm91cFNldHRpbmdzLCBkYXRhTG9hZGVkKTtcbn1cblxuZnVuY3Rpb24gc2NhblBhZ2UoZ3JvdXBTZXR0aW5ncykge1xuICAgIFBhZ2VTY2FubmVyLnNjYW4oZ3JvdXBTZXR0aW5ncywgcGFnZVNjYW5uZWQpO1xufVxuXG52YXIganNvbkRhdGE7XG52YXIgaXNQYWdlU2Nhbm5lZCA9IGZhbHNlO1xuXG5mdW5jdGlvbiBkYXRhTG9hZGVkKGpzb24pIHtcbiAgICBqc29uRGF0YSA9IGpzb247XG4gICAgaWYgKGpzb25EYXRhICYmIGlzUGFnZVNjYW5uZWQpIHtcbiAgICAgICAgcGFnZVJlYWR5KCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBwYWdlU2Nhbm5lZCgpIHtcbiAgICBpc1BhZ2VTY2FubmVkID0gdHJ1ZTtcbiAgICBpZiAoanNvbkRhdGEgJiYgaXNQYWdlU2Nhbm5lZCkge1xuICAgICAgICBwYWdlUmVhZHkoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHBhZ2VSZWFkeSgpIHtcbiAgICAvLyBBdCB0aGlzIHBvaW50LCB0aGUgY29udGFpbmVyIGhhc2hlcyBoYXZlIGJlZW4gY29tcHV0ZWQsIHRoZSBhZmZvcmRhbmNlcyBpbnNlcnRlZCwgYW5kIHRoZSBwYWdlIGRhdGEgZmV0Y2hlZC5cbiAgICAvLyBOb3cgdXBkYXRlIHRoZSBzdW1tYXJ5IHdpZGdldHMgYW5kIGFmZm9yZGFuY2VzLlxuXG4gICAgUGFnZURhdGEudXBkYXRlQWxsKGpzb25EYXRhKTtcblxuICAgIC8vIEJPT00uIFRoZSBtYWdpYyBvZiBSYWN0aXZlLiBOb3cgd2UganVzdCBjYWxsIFBhZ2VEYXRhLnVwZGF0ZSBpbnN0ZWFkIG9mIGFsbCB0aGlzLlxuICAgIC8vZm9yICh2YXIgaSA9IDA7IGkgPCBwYWdlRGF0YS5sZW5ndGg7IGkrKykge1xuICAgIC8vICAgIHZhciBwYWdlID0gcGFnZURhdGFbaV07XG4gICAgLy8gICAgdmFyIGhhc2ggPSBwYWdlLnBhZ2VIYXNoO1xuICAgIC8vICAgIC8vIFRPRE8gZXh0cmFjdCBhdHRyaWJ1dGUgY29uc3RhbnRzXG4gICAgLy8gICAgdmFyICRzdW1tYXJpZXMgPSAkKCdbYW50LWhhc2g9XFwnJyArIGhhc2ggKyAnXFwnXScpO1xuICAgIC8vICAgICRzdW1tYXJpZXMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAvLyAgICAgICAgdmFyICRzdW1tYXJ5ID0gJCh0aGlzKTtcbiAgICAvLyAgICAgICAgdmFyIHN1bW1hcnlSYWN0aXZlID0gU3VtbWFyeVdpZGdldC5jcmVhdGUoJHN1bW1hcnksIHBhZ2UpOyAvLyBUT0RPOiBtdWx0aXBsZSBpbnN0YW5jZXNcbiAgICAvLyAgICB9KVxuICAgIC8vfVxufVxuXG4vLyBUT0RPIHRoZSBjYXNjYWRlIGlzIHByZXR0eSBjbGVhciwgYnV0IGNhbiB3ZSBvcmNoZXN0cmF0ZSB0aGlzIGJldHRlcj9cblNjcmlwdExvYWRlci5sb2FkKGxvYWRHcm91cFNldHRpbmdzKTtcbkNzc0xvYWRlci5sb2FkKCk7IiwiXG52YXIgYmFzZVVybCA9ICdodHRwOi8vbG9jYWxob3N0OjgwODEnOyAvLyBUT0RPIGNvbXB1dGUgdGhpc1xuXG5mdW5jdGlvbiBsb2FkQ3NzKCkge1xuICAgIHZhciBoZWFkID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKVswXTtcbiAgICBpZiAoaGVhZCkge1xuICAgICAgICAvLyBUbyBtYWtlIHN1cmUgbm9uZSBvZiBvdXIgY29udGVudCByZW5kZXJzIG9uIHRoZSBwYWdlIGJlZm9yZSBvdXIgQ1NTIGlzIGxvYWRlZCwgd2UgYXBwZW5kIGEgc2ltcGxlIGlubGluZSBzdHlsZVxuICAgICAgICAvLyBlbGVtZW50IHRoYXQgdHVybnMgb2ZmIG91ciBlbGVtZW50cyAqYmVmb3JlKiBvdXIgQ1NTIGxpbmtzLiBUaGlzIGV4cGxvaXRzIHRoZSBjYXNjYWRlIHJ1bGVzIC0gb3VyIENTUyBmaWxlcyBhcHBlYXJcbiAgICAgICAgLy8gYWZ0ZXIgdGhlIGlubGluZSBzdHlsZSBpbiB0aGUgZG9jdW1lbnQsIHNvIHRoZXkgdGFrZSBwcmVjZWRlbmNlIChhbmQgbWFrZSBldmVyeXRoaW5nIGFwcGVhcikgb25jZSB0aGV5J3JlIGxvYWRlZC5cbiAgICAgICAgdmFyIHN0eWxlVGFnID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcbiAgICAgICAgc3R5bGVUYWcuaW5uZXJIVE1MID0gJy5hbnRlbm5he2Rpc3BsYXk6bm9uZTt9JztcbiAgICAgICAgaGVhZC5hcHBlbmRDaGlsZChzdHlsZVRhZyk7XG5cbiAgICAgICAgdmFyIGNzc0hyZWZzID0gW1xuICAgICAgICAgICAgLy8gVE9ETyBicmluZ2luZyBpbiBtdWx0aXBsZSBjc3MgZmlsZXMgYnJlYWtzIHRoZSB3YXkgd2Ugd2FpdCB1bnRpbCBvdXIgQ1NTIGlzIGxvYWRlZCBiZWZvcmUgc2hvd2luZyBvdXIgY29udGVudC5cbiAgICAgICAgICAgIC8vICAgICAgd2UgbmVlZCB0byBmaW5kIGEgd2F5IHRvIGJyaW5nIHRoYXQgYmFjay4gb25lIHNpbXBsZSB3YXkgLSBhbHNvIGNvbXBpbGUgdGhlIGFudGVubmEtZm9udC5jc3MgaW50byB0aGUgYW50ZW5uYS5jc3MgZmlsZS5cbiAgICAgICAgICAgIC8vICAgICAgb3BlbiBxdWVzdGlvbiAtIGhvdyBkb2VzIGl0IGFsbCBwbGF5IHdpdGggZm9udCBpY29ucyB0aGF0IGFyZSBkb3dubG9hZGVkIGFzIHlldCBhbm90aGVyIGZpbGU/XG4gICAgICAgICAgICBiYXNlVXJsICsgJy9zdGF0aWMvY3NzL2FudGVubmEtZm9udC9hbnRlbm5hLWZvbnQuY3NzJyxcbiAgICAgICAgICAgIGJhc2VVcmwgKyAnL3N0YXRpYy93aWRnZXQtbmV3L2RlYnVnL2FudGVubmEuY3NzJyAvLyBUT0RPIHRoaXMgbmVlZHMgYSBmaW5hbCBwYXRoLiBDRE4gZm9yIHByb2R1Y3Rpb24gYW5kIGxvY2FsIGZpbGUgZm9yIGRldmVsb3BtZW50P1xuICAgICAgICBdO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNzc0hyZWZzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBsb2FkRmlsZShjc3NIcmVmc1tpXSwgaGVhZCk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGxvYWRGaWxlKGhyZWYsIGhlYWQpIHtcbiAgICB2YXIgbGlua1RhZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpbmsnKTtcbiAgICBsaW5rVGFnLnNldEF0dHJpYnV0ZSgnaHJlZicsIGhyZWYpO1xuICAgIGxpbmtUYWcuc2V0QXR0cmlidXRlKCdyZWwnLCAnc3R5bGVzaGVldCcpO1xuICAgIGxpbmtUYWcuc2V0QXR0cmlidXRlKCd0eXBlJywgJ3RleHQvY3NzJyk7XG4gICAgaGVhZC5hcHBlbmRDaGlsZChsaW5rVGFnKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgbG9hZCA6IGxvYWRDc3Ncbn07IiwiXG52YXIgR3JvdXBTZXR0aW5ncyA9IHJlcXVpcmUoJy4vZ3JvdXAtc2V0dGluZ3MnKTtcbnZhciAkOyByZXF1aXJlKCcuL3NjcmlwdC1sb2FkZXInKS5vbiQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcblxuLy8gVE9ETyBmb2xkIHRoaXMgbW9kdWxlIGludG8gZ3JvdXAtc2V0dGluZ3M/XG5cbmZ1bmN0aW9uIGxvYWRTZXR0aW5ncyhjYWxsYmFjaykge1xuICAgICQuZ2V0SlNPTlAoJy9hcGkvc2V0dGluZ3MnLCB7IGhvc3RfbmFtZTogd2luZG93LmFudGVubmFfaG9zdCB9LCBzdWNjZXNzLCBlcnJvcik7XG5cbiAgICBmdW5jdGlvbiBzdWNjZXNzKGpzb24pIHtcbiAgICAgICAgdmFyIGdyb3VwU2V0dGluZ3MgPSBHcm91cFNldHRpbmdzLmNyZWF0ZShqc29uKTtcbiAgICAgICAgY2FsbGJhY2soZ3JvdXBTZXR0aW5ncyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZXJyb3IobWVzc2FnZSkge1xuICAgICAgICAvLyBUT0RPIGhhbmRsZSBlcnJvcnMgdGhhdCBoYXBwZW4gd2hlbiBsb2FkaW5nIGNvbmZpZyBkYXRhXG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgbG9hZDogbG9hZFNldHRpbmdzXG59OyIsIlxudmFyICQ7XG5yZXF1aXJlKCcuL3NjcmlwdC1sb2FkZXInKS5vbiQoZnVuY3Rpb24oalF1ZXJ5KSB7XG4gICAgJD1qUXVlcnk7XG59KTtcblxuLy8gVE9ETzogdHJpbSB0cmFpbGluZyBjb21tYXMgZnJvbSBhbnkgc2VsZWN0b3IgdmFsdWVzXG5cbi8vIFRPRE86IFJldmlldy4gVGhlc2UgYXJlIGp1c3QgY29waWVkIGZyb20gZW5nYWdlX2Z1bGwuXG52YXIgZGVmYXVsdHMgPSB7XG4gICAgICAgIHByZW1pdW06IGZhbHNlLFxuICAgICAgICBpbWdfc2VsZWN0b3I6IFwiaW1nXCIsXG4gICAgICAgIGltZ19jb250YWluZXJfc2VsZWN0b3JzOlwiI3ByaW1hcnktcGhvdG9cIixcbiAgICAgICAgYWN0aXZlX3NlY3Rpb25zOiBcImJvZHlcIixcbiAgICAgICAgYW5ub193aGl0ZWxpc3Q6IFwiYm9keSBwXCIsXG4gICAgICAgIGFjdGl2ZV9zZWN0aW9uc193aXRoX2Fubm9fd2hpdGVsaXN0OlwiXCIsXG4gICAgICAgIG1lZGlhX3NlbGVjdG9yOiBcImVtYmVkLCB2aWRlbywgb2JqZWN0LCBpZnJhbWVcIixcbiAgICAgICAgY29tbWVudF9sZW5ndGg6IDUwMCxcbiAgICAgICAgbm9fYW50OiBcIlwiLFxuICAgICAgICBpbWdfYmxhY2tsaXN0OiBcIlwiLFxuICAgICAgICBjdXN0b21fY3NzOiBcIlwiLFxuICAgICAgICAvL3RvZG86IHRlbXAgaW5saW5lX2luZGljYXRvciBkZWZhdWx0cyB0byBtYWtlIHRoZW0gc2hvdyB1cCBvbiBhbGwgbWVkaWEgLSByZW1vdmUgdGhpcyBsYXRlci5cbiAgICAgICAgaW5saW5lX3NlbGVjdG9yOiAnaW1nLCBlbWJlZCwgdmlkZW8sIG9iamVjdCwgaWZyYW1lJyxcbiAgICAgICAgcGFyYWdyYXBoX2hlbHBlcjogdHJ1ZSxcbiAgICAgICAgbWVkaWFfdXJsX2lnbm9yZV9xdWVyeTogdHJ1ZSxcbiAgICAgICAgc3VtbWFyeV93aWRnZXRfc2VsZWN0b3I6ICcuYW50LXBhZ2Utc3VtbWFyeScsIC8vIFRPRE86IHRoaXMgd2Fzbid0IGRlZmluZWQgYXMgYSBkZWZhdWx0IGluIGVuZ2FnZV9mdWxsLCBidXQgd2FzIGluIGNvZGUuIHdoeT9cbiAgICAgICAgc3VtbWFyeV93aWRnZXRfbWV0aG9kOiAnYWZ0ZXInLFxuICAgICAgICBsYW5ndWFnZTogJ2VuJyxcbiAgICAgICAgYWJfdGVzdF9pbXBhY3Q6IHRydWUsXG4gICAgICAgIGFiX3Rlc3Rfc2FtcGxlX3BlcmNlbnRhZ2U6IDEwLFxuICAgICAgICBpbWdfaW5kaWNhdG9yX3Nob3dfb25sb2FkOiB0cnVlLFxuICAgICAgICBpbWdfaW5kaWNhdG9yX3Nob3dfc2lkZTogJ2xlZnQnLFxuICAgICAgICB0YWdfYm94X2JnX2NvbG9yczogJyMxODQxNGM7IzM3NjA3NjsyMTUsIDE3OSwgNjk7I2U2ODg1YzsjZTQ2MTU2JyxcbiAgICAgICAgdGFnX2JveF90ZXh0X2NvbG9yczogJyNmZmY7I2ZmZjsjZmZmOyNmZmY7I2ZmZicsXG4gICAgICAgIHRhZ19ib3hfZm9udF9mYW1pbHk6ICdIZWx2ZXRpY2FOZXVlLEhlbHZldGljYSxBcmlhbCxzYW5zLXNlcmlmJyxcbiAgICAgICAgdGFnc19iZ19jc3M6ICcnLFxuICAgICAgICBpZ25vcmVfc3ViZG9tYWluOiBmYWxzZSxcbiAgICAgICAgLy90aGUgc2NvcGUgaW4gd2hpY2ggdG8gZmluZCBwYXJlbnRzIG9mIDxicj4gdGFncy5cbiAgICAgICAgLy9UaG9zZSBwYXJlbnRzIHdpbGwgYmUgY29udmVydGVkIHRvIGEgPHJ0PiBibG9jaywgc28gdGhlcmUgd29uJ3QgYmUgbmVzdGVkIDxwPiBibG9ja3MuXG4gICAgICAgIC8vdGhlbiBpdCB3aWxsIHNwbGl0IHRoZSBwYXJlbnQncyBodG1sIG9uIDxicj4gdGFncyBhbmQgd3JhcCB0aGUgc2VjdGlvbnMgaW4gPHA+IHRhZ3MuXG5cbiAgICAgICAgLy9leGFtcGxlOlxuICAgICAgICAvLyBicl9yZXBsYWNlX3Njb3BlX3NlbGVjdG9yOiBcIi5hbnRfYnJfcmVwbGFjZVwiIC8vZS5nLiBcIiNtYWluc2VjdGlvblwiIG9yIFwicFwiXG5cbiAgICAgICAgYnJfcmVwbGFjZV9zY29wZV9zZWxlY3RvcjogbnVsbCAvL2UuZy4gXCIjbWFpbnNlY3Rpb25cIiBvciBcInBcIlxuICAgIH07XG5cbmZ1bmN0aW9uIGNyZWF0ZUZyb21KU09OKGpzb24pIHtcblxuICAgIGZ1bmN0aW9uIGRhdGEoa2V5KSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IHdpbmRvdy5hbnRlbm5hX2V4dGVuZFtrZXldO1xuICAgICAgICAgICAgaWYgKHZhbHVlID09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHZhbHVlID0ganNvbltrZXldO1xuICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlID09PSAnJykgeyAvLyBUT0RPOiBTaG91bGQgdGhlIHNlcnZlciBiZSBzZW5kaW5nIGJhY2sgJycgaGVyZSBvciBub3RoaW5nIGF0IGFsbD8gKEl0IHByZWNsdWRlcyB0aGUgc2VydmVyIGZyb20gcmVhbGx5IHNheWluZyAnbm90aGluZycpXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gZGVmYXVsdHNba2V5XTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgZ3JvdXBJZDogZGF0YSgnaWQnKSxcbiAgICAgICAgYWN0aXZlU2VjdGlvbnM6IGRhdGEoJ2FjdGl2ZV9zZWN0aW9ucycpLFxuICAgICAgICB1cmw6IHtcbiAgICAgICAgICAgIGlnbm9yZVN1YmRvbWFpbjogZGF0YSgnaWdub3JlX3N1YmRvbWFpbicpLFxuICAgICAgICAgICAgY2Fub25pY2FsRG9tYWluOiBkYXRhKCdwYWdlX3RsZCcpIC8vIFRPRE86IHdoYXQgdG8gY2FsbCB0aGlzIGV4YWN0bHkuIGdyb3VwRG9tYWluPyBzaXRlRG9tYWluPyBjYW5vbmljYWxEb21haW4/XG4gICAgICAgIH0sXG4gICAgICAgIHN1bW1hcnlTZWxlY3RvcjogZGF0YSgnc3VtbWFyeV93aWRnZXRfc2VsZWN0b3InKSxcbiAgICAgICAgc3VtbWFyeU1ldGhvZDogZGF0YSgnc3VtbWFyeV93aWRnZXRfbWV0aG9kJyksXG4gICAgICAgIHBhZ2VTZWxlY3RvcjogZGF0YSgncG9zdF9zZWxlY3RvcicpLFxuICAgICAgICBwYWdlSHJlZlNlbGVjdG9yOiBkYXRhKCdwb3N0X2hyZWZfc2VsZWN0b3InKSxcbiAgICAgICAgdGV4dFNlbGVjdG9yOiBkYXRhKCdhbm5vX3doaXRlbGlzdCcpXG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlOiBjcmVhdGVGcm9tSlNPTlxufTsiLCJcbnZhciBVUkxzID0gcmVxdWlyZSgnLi91dGlscy91cmxzJyk7XG52YXIgJDsgcmVxdWlyZSgnLi9zY3JpcHQtbG9hZGVyJykub24kKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG5cblxuZnVuY3Rpb24gY29tcHV0ZVBhZ2VUaXRsZSgpIHtcbiAgICAvLyBUT0RPOiBIb3cgYXJlIHBhZ2UgdGl0bGVzIGNvbXB1dGVkIHdpdGggbXVsdGlwbGUgcGFnZXM/IFRoZSBjb2RlIGJlbG93IGNvbXB1dGVzIHRoZSB0aXRsZSBmb3IgYSB0b3AtbGV2ZWwgcGFnZS5cbiAgICB2YXIgdGl0bGUgPSAkKCdtZXRhW3Byb3BlcnR5PVwib2c6dGl0bGVcIl0nKS5hdHRyKCdjb250ZW50Jyk7XG4gICAgaWYgKCF0aXRsZSkge1xuICAgICAgICB0aXRsZSA9ICQoJ3RpdGxlJykudGV4dCgpIHx8ICcnO1xuICAgIH1cbiAgICByZXR1cm4gJC50cmltKHRpdGxlKTtcbn1cblxuXG4vLyBDb21wdXRlIHRoZSBwYWdlcyB0aGF0IHdlIG5lZWQgdG8gZmV0Y2guIFRoaXMgaXMgZWl0aGVyOlxuLy8gMS4gQW55IG5lc3RlZCBwYWdlcyB3ZSBmaW5kIHVzaW5nIHRoZSBwYWdlIHNlbGVjdG9yIE9SXG4vLyAyLiBUaGUgY3VycmVudCB3aW5kb3cgbG9jYXRpb25cbmZ1bmN0aW9uIGNvbXB1dGVQYWdlc1BhcmFtKGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgcGFnZXMgPSBbXTtcblxuICAgIHZhciBncm91cElkID0gZ3JvdXBTZXR0aW5ncy5ncm91cElkKCk7XG4gICAgdmFyICRwYWdlRWxlbWVudHMgPSAkKGdyb3VwU2V0dGluZ3MucGFnZVNlbGVjdG9yKCkpO1xuICAgIC8vIFRPRE86IENvbXBhcmUgdGhpcyBleGVjdXRpb24gZmxvdyB0byB3aGF0IGhhcHBlbnMgaW4gZW5nYWdlX2Z1bGwuanMuIEhlcmUgd2UgdHJlYXQgdGhlIGJvZHkgZWxlbWVudCBhcyBhIHBhZ2Ugc29cbiAgICAvLyB0aGUgZmxvdyBpcyB0aGUgc2FtZSBmb3IgYm90aCBjYXNlcy4gSXMgdGhlcmUgYSByZWFzb24gZW5nYWdlX2Z1bGwuanMgYnJhbmNoZXMgaGVyZSBpbnN0ZWFkIGFuZCB0cmVhdHMgdGhlc2Ugc28gZGlmZmVyZW50bHk/XG4gICAgaWYgKCRwYWdlRWxlbWVudHMubGVuZ3RoID09IDApIHtcbiAgICAgICAgJHBhZ2VFbGVtZW50cyA9ICQoJ2JvZHknKTtcbiAgICB9XG4gICAgJHBhZ2VFbGVtZW50cy5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgJHBhZ2VFbGVtZW50ID0gJCh0aGlzKTtcbiAgICAgICAgcGFnZXMucHVzaCh7XG4gICAgICAgICAgICBncm91cF9pZDogZ3JvdXBJZCxcbiAgICAgICAgICAgIHVybDogVVJMcy5jb21wdXRlUGFnZVVybCgkcGFnZUVsZW1lbnQsIGdyb3VwU2V0dGluZ3MpLFxuICAgICAgICAgICAgY2Fub25pY2FsX3VybDogVVJMcy5jb21wdXRlQ2Fub25pY2FsVXJsKCRwYWdlRWxlbWVudCwgZ3JvdXBTZXR0aW5ncyksXG4gICAgICAgICAgICBpbWFnZTogJycsIC8vIFRPRE9cbiAgICAgICAgICAgIHRpdGxlOiBjb21wdXRlUGFnZVRpdGxlKCkgLy8gVE9ETzogVGhpcyBjb2RlIG9ubHkgd29ya3MgZm9yIHRoZSB0b3AtbGV2ZWwgcGFnZS4gU2VlIGNvbXB1dGVQYWdlVGl0bGUoKVxuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIHJldHVybiBwYWdlcztcbn1cblxuZnVuY3Rpb24gbG9hZFBhZ2VEYXRhKGdyb3VwU2V0dGluZ3MsIGNhbGxiYWNrKSB7XG4gICAgdmFyIHBhZ2VzUGFyYW0gPSBjb21wdXRlUGFnZXNQYXJhbShncm91cFNldHRpbmdzKTtcbiAgICAkLmdldEpTT05QKCcvYXBpL3BhZ2UnLCB7IHBhZ2VzOiBwYWdlc1BhcmFtIH0sIHN1Y2Nlc3MsIGVycm9yKTtcblxuICAgIGZ1bmN0aW9uIHN1Y2Nlc3MoanNvbikge1xuICAgICAgICBjYWxsYmFjayhqc29uKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBlcnJvcihtZXNzYWdlKSB7XG4gICAgICAgIC8vIFRPRE8gaGFuZGxlIGVycm9ycyB0aGF0IGhhcHBlbiB3aGVuIGxvYWRpbmcgcGFnZSBkYXRhXG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgbG9hZDogbG9hZFBhZ2VEYXRhXG59OyIsIlxudmFyICQ7IHJlcXVpcmUoJy4vc2NyaXB0LWxvYWRlcicpLm9uJChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xuXG52YXIgcGFnZXMgPSB7fTtcblxuZnVuY3Rpb24gZ2V0UGFnZURhdGEoaGFzaCkge1xuICAgIHZhciBwYWdlRGF0YSA9IHBhZ2VzW2hhc2hdO1xuICAgIGlmICghcGFnZURhdGEpIHtcbiAgICAgICAgLy8gVE9ETzogR2l2ZSB0aGlzIHNlcmlvdXMgdGhvdWdodC4gSW4gb3JkZXIgZm9yIG1hZ2ljIG1vZGUgdG8gd29yaywgdGhlIG9iamVjdCBuZWVkcyB0byBoYXZlIHZhbHVlcyBpbiBwbGFjZSBmb3JcbiAgICAgICAgLy8gdGhlIG9ic2VydmVkIHByb3BlcnRpZXMgYXQgdGhlIG1vbWVudCB0aGUgcmFjdGl2ZSBpcyBjcmVhdGVkLiBCdXQgdGhpcyBpcyBwcmV0dHkgdW51c3VhbCBmb3IgSmF2YXNjcmlwdCwgdG8gaGF2ZVxuICAgICAgICAvLyB0byBkZWZpbmUgdGhlIHdob2xlIHNrZWxldG9uIGZvciB0aGUgb2JqZWN0IGluc3RlYWQgb2YganVzdCBhZGRpbmcgcHJvcGVydGllcyB3aGVuZXZlciB5b3Ugd2FudC5cbiAgICAgICAgLy8gVGhlIGFsdGVybmF0aXZlIHdvdWxkIGJlIGZvciB1cyB0byBrZWVwIG91ciBvd24gXCJkYXRhIGJpbmRpbmdcIiBiZXR3ZWVuIHRoZSBwYWdlRGF0YSBhbmQgcmFjdGl2ZSBpbnN0YW5jZXMgKDEgdG8gbWFueSlcbiAgICAgICAgLy8gYW5kIHRlbGwgdGhlIHJhY3RpdmVzIHRvIHVwZGF0ZSB3aGVuZXZlciB0aGUgZGF0YSBjaGFuZ2VzLlxuICAgICAgICBwYWdlRGF0YSA9IHtcbiAgICAgICAgICAgIHBhZ2VIYXNoOiBoYXNoLFxuICAgICAgICAgICAgc3VtbWFyeToge31cbiAgICAgICAgfTtcbiAgICAgICAgcGFnZXNbaGFzaF0gPSBwYWdlRGF0YTtcbiAgICB9XG4gICAgcmV0dXJuIHBhZ2VEYXRhO1xufVxuXG5mdW5jdGlvbiB1cGRhdGVBbGxQYWdlRGF0YShqc29uUGFnZXMpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGpzb25QYWdlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB1cGRhdGVQYWdlRGF0YShqc29uUGFnZXNbaV0pO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gdXBkYXRlUGFnZURhdGEoanNvbikge1xuICAgIHZhciBwYWdlRGF0YSA9IGdldFBhZ2VEYXRhKGpzb24udXJsaGFzaCk7XG5cbiAgICB2YXIgbnVtUmVhY3Rpb25zID0gMDtcbiAgICB2YXIgbnVtQ29tbWVudHMgPSAwO1xuICAgIHZhciBudW1TaGFyZXMgPSAwO1xuXG4gICAgdmFyIHN1bW1hcnlFbnRyaWVzID0ganNvbi5zdW1tYXJ5O1xuICAgIGlmIChzdW1tYXJ5RW50cmllcykge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN1bW1hcnlFbnRyaWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgc3VtbWFyeUVudHJ5ID0gc3VtbWFyeUVudHJpZXNbaV07XG4gICAgICAgICAgICBpZiAoc3VtbWFyeUVudHJ5LmtpbmQgPT09ICd0YWcnKSB7XG4gICAgICAgICAgICAgICAgbnVtUmVhY3Rpb25zID0gc3VtbWFyeUVudHJ5LmNvdW50O1xuICAgICAgICAgICAgfSBlbHNlIGlmIChzdW1tYXJ5RW50cnkua2luZCA9PT0gJ2NvbScpIHtcbiAgICAgICAgICAgICAgICBudW1Db21tZW50cyA9IHN1bW1hcnlFbnRyeS5jb3VudDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc3VtbWFyeUVudHJ5LmtpbmQgPT09ICdzaHInKSB7XG4gICAgICAgICAgICAgICAgbnVtU2hhcmVzID0gc3VtbWFyeUVudHJ5LmNvdW50O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgdmFyIHRvcFJlYWN0aW9ucyA9IFtdO1xuICAgIHZhciByZWFjdGlvbnNEYXRhID0ganNvbi50b3B0YWdzO1xuICAgIGlmIChyZWFjdGlvbnNEYXRhKSB7XG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgcmVhY3Rpb25zRGF0YS5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgdmFyIHJlYWN0aW9uID0gcmVhY3Rpb25zRGF0YVtqXTtcbiAgICAgICAgICAgIHRvcFJlYWN0aW9uc1tqXSA9IHtcbiAgICAgICAgICAgICAgICBpZDogcmVhY3Rpb24uaWQsXG4gICAgICAgICAgICAgICAgY291bnQ6IHJlYWN0aW9uLnRhZ19jb3VudCxcbiAgICAgICAgICAgICAgICB0ZXh0OiByZWFjdGlvbi5ib2R5XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBUT0RPIENvbnNpZGVyIHN1cHBvcnRpbmcgaW5jcmVtZW50YWwgdXBkYXRlIG9mIGRhdGEgdGhhdCB3ZSBhbHJlYWR5IGhhdmUgZnJvbSB0aGUgc2VydmVyLiBUaGF0IHdvdWxkIG1lYW4gb25seVxuICAgIC8vIHVwZGF0aW5nIGZpZWxkcyBpbiB0aGUgbG9jYWwgb2JqZWN0IGlmIHRoZXkgZXhpc3QgaW4gdGhlIGpzb24gZGF0YS5cbiAgICBwYWdlRGF0YS5wYWdlSWQgPSBqc29uLmlkO1xuICAgIHBhZ2VEYXRhLnN1bW1hcnkgPSB7XG4gICAgICAgIHRvdGFsUmVhY3Rpb25zOiBudW1SZWFjdGlvbnMsXG4gICAgICAgIHRvdGFsQ29tbWVudHM6IG51bUNvbW1lbnRzLFxuICAgICAgICB0b3RhbFNoYXJlczogbnVtU2hhcmVzXG4gICAgfTtcbiAgICBwYWdlRGF0YS50b3BSZWFjdGlvbnMgPSB0b3BSZWFjdGlvbnM7XG4gICAgcGFnZURhdGEuY29udGFpbmVycyA9IGpzb24uY29udGFpbmVyczsgLy8gYXJyYXkgb2Ygb2JqZWN0cyB3aXRoICdpZCcgYW5kICdoYXNoJyBwcm9wZXJ0aWVzLCBpbmNsdWRpbmcgdGhlIG1hZ2ljICdwYWdlJyBoYXNoIHZhbHVlXG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBnZXQ6IGdldFBhZ2VEYXRhLFxuICAgIHVwZGF0ZUFsbDogdXBkYXRlQWxsUGFnZURhdGFcbn07IiwiXG4vL3ZhciAkID0gcmVxdWlyZSgnLi9qcXVlcnknKTtcbnZhciAkO1xucmVxdWlyZSgnLi9zY3JpcHQtbG9hZGVyJykub24kKGZ1bmN0aW9uKGpRdWVyeSkge1xuICAgICQ9alF1ZXJ5O1xufSk7XG5cbi8vIFRPRE8gdGhpcyBpcyBqdXN0IHJhbmRvbSBpbmNvbXBsZXRlIHNuaXBwZXRzXG5cbmZ1bmN0aW9uIGNyZWF0ZVBhZ2VQYXJhbShncm91cFNldHRpbmdzKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZ3JvdXBfaWQ6IGdyb3VwU2V0dGluZ3MuaWQsXG4gICAgICAgIHVybDogJycsXG4gICAgICAgIGNhbm9uaWNhbF91cmw6ICcnLFxuICAgICAgICB0aXRsZTogJycsXG4gICAgICAgIGltYWdlOiAnJ1xuICAgIH07XG59XG5cblxuXG5mdW5jdGlvbiBsb2FkUGFnZShzZXR0aW5ncykge1xuICAgIGFsZXJ0KEpTT04uc3RyaW5naWZ5KHNldHRpbmdzLCBudWxsLCAyKSk7XG4gICAgJC5nZXRKU09OUCgnL2FwaS9wYWdlJywge1xuICAgICAgICAgICAgcGFnZXM6IFt7XG4gICAgICAgICAgICAgICAgZ3JvdXBfaWQ6IHNldHRpbmdzLmlkLFxuXG4gICAgICAgICAgICB9XVxuICAgICAgICB9LCBmdW5jdGlvbihwYWdlcykge1xuICAgICAgICAgICAgYWxlcnQoSlNPTi5zdHJpbmdpZnkocGFnZXMsIG51bGwsIDIpKTtcbiAgICAgICAgfSk7XG5cbn1cblxuZnVuY3Rpb24gbG9hZFBhZ2VzKCkge1xuXG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBsb2FkUGFnZTogbG9hZFBhZ2UsXG4gICAgbG9hZFBhZ2VzOiBsb2FkUGFnZXNcbn07IiwiXG52YXIgJDsgcmVxdWlyZSgnLi9zY3JpcHQtbG9hZGVyJykub24kKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgVGVtcGxhdGVzID0gcmVxdWlyZSgnLi90ZW1wbGF0ZXMnKTtcbnZhciBIYXNoID0gcmVxdWlyZSgnLi91dGlscy9oYXNoJyk7XG52YXIgVVJMcyA9IHJlcXVpcmUoJy4vdXRpbHMvdXJscycpO1xudmFyIFN1bW1hcnlXaWRnZXQgPSByZXF1aXJlKCcuL3N1bW1hcnktd2lkZ2V0Jyk7XG52YXIgUGFnZURhdGEgPSByZXF1aXJlKCcuL3BhZ2UtZGF0YScpO1xuXG52YXIgaW5kaWNhdG9yTWFwID0ge307XG5cbi8vIFNjYW4gZm9yIGFsbCBwYWdlcyBhdCB0aGUgY3VycmVudCBicm93c2VyIGxvY2F0aW9uLiBUaGlzIGNvdWxkIGp1c3QgYmUgdGhlIGN1cnJlbnQgcGFnZSBvciBpdCBjb3VsZCBiZSBhIGNvbGxlY3Rpb25cbi8vIG9mIHBhZ2VzIChha2EgJ3Bvc3RzJykuXG5mdW5jdGlvbiBzY2FuQWxsUGFnZXMoZ3JvdXBTZXR0aW5ncywgY2FsbGJhY2spIHtcbiAgICB2YXIgJHBhZ2VzID0gJChncm91cFNldHRpbmdzLnBhZ2VTZWxlY3RvcigpKTtcbiAgICBpZiAoJHBhZ2VzLmxlbmd0aCA9PSAwKSB7XG4gICAgICAgIC8vIElmIHdlIGRvbid0IGRldGVjdCBhbnkgcGFnZSBtYXJrZXJzLCB0cmVhdCB0aGUgd2hvbGUgZG9jdW1lbnQgYXMgdGhlIHNpbmdsZSBwYWdlXG4gICAgICAgICRwYWdlcyA9ICQoJ2JvZHknKTsgLy8gVE9ETyBJcyB0aGlzIHRoZSByaWdodCBiZWhhdmlvcj9cbiAgICB9XG4gICAgJHBhZ2VzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkcGFnZSA9ICQodGhpcyk7XG4gICAgICAgIHNjYW5QYWdlKCRwYWdlLCBncm91cFNldHRpbmdzKTtcbiAgICB9KTtcbiAgICBjYWxsYmFjaygpO1xufVxuXG4vLyBTY2FuIHRoZSBwYWdlIHVzaW5nIHRoZSBnaXZlbiBzZXR0aW5nczpcbi8vIDEuIEZpbmQgYWxsIHRoZSBjb250YWluZXJzIHRoYXQgd2UgY2FyZSBhYm91dC5cbi8vIDIuIEluc2VydCB3aWRnZXQgYWZmb3JkYW5jZXMgZm9yIGVhY2guXG4vLyAzLiBDb21wdXRlIGhhc2hlcyBmb3IgZWFjaCBjb250YWluZXIuXG5mdW5jdGlvbiBzY2FuUGFnZSgkcGFnZSwgZ3JvdXBTZXR0aW5ncykge1xuXG4gICAgLy8gRmlyc3QsIHNjYW4gZm9yIGVsZW1lbnRzIHRoYXQgd291bGQgY2F1c2UgdXMgdG8gaW5zZXJ0IHNvbWV0aGluZyBpbnRvIHRoZSBET00gdGhhdCB0YWtlcyB1cCBzcGFjZS5cbiAgICAvLyBXZSB3YW50IHRvIGdldCBhbnkgcGFnZSByZXNpemluZyBvdXQgb2YgdGhlIHdheSBhcyBlYXJseSBhcyBwb3NzaWJsZS5cbiAgICAvLyBUT0RPOiBDb25zaWRlciBkb2luZyB0aGlzIHdpdGggcmF3IEphdmFzY3JpcHQgYmVmb3JlIGpRdWVyeSBsb2FkcywgdG8gZnVydGhlciByZWR1Y2UgdGhlIGRlbGF5LiBXZSB3b3VsZG4ndFxuICAgIC8vIHNhdmUgYSAqdG9uKiBvZiB0aW1lIGZyb20gdGhpcywgdGhvdWdoLCBzbyBpdCdzIGRlZmluaXRlbHkgYSBsYXRlciBvcHRpbWl6YXRpb24uXG4gICAgc2NhbkZvclN1bW1hcmllcygkcGFnZSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgc2NhbkZvckNhbGxzVG9BY3Rpb24oJHBhZ2UsIGdyb3VwU2V0dGluZ3MpO1xuXG4gICAgdmFyICRhY3RpdmVTZWN0aW9ucyA9ICRwYWdlLmZpbmQoZ3JvdXBTZXR0aW5ncy5hY3RpdmVTZWN0aW9ucygpKTtcbiAgICAkYWN0aXZlU2VjdGlvbnMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRzZWN0aW9uID0gJCh0aGlzKTtcbiAgICAgICAgLy8gVGhlbiBzY2FuIGZvciBldmVyeXRoaW5nIGVsc2VcbiAgICAgICAgc2NhbkZvclRleHQoJHNlY3Rpb24sIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICBzY2FuRm9ySW1hZ2VzKCRzZWN0aW9uLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgc2NhbkZvck1lZGlhKCRzZWN0aW9uLCBncm91cFNldHRpbmdzKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gc2NhbkZvclN1bW1hcmllcygkZWxlbWVudCwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciB1cmwgPSBVUkxzLmNvbXB1dGVQYWdlVXJsKCRlbGVtZW50LCBncm91cFNldHRpbmdzKTtcbiAgICB2YXIgdXJsSGFzaCA9IEhhc2guaGFzaFVybCh1cmwpO1xuXG4gICAgdmFyICRzdW1tYXJpZXMgPSAkZWxlbWVudC5maW5kKGdyb3VwU2V0dGluZ3Muc3VtbWFyeVNlbGVjdG9yKCkpO1xuICAgICRzdW1tYXJpZXMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gVE9ETzogY29tcHV0ZSB0aGUgdXJsIGhhc2ggZm9yIHRoZSBwYWdlLCBlaXRoZXIgdXNpbmcgdGhlIHBhZ2Ugc2VsZWN0b3Igb3IgdGhlIHdpbmRvdyBsb2NhdGlvbi4gU2VlIGVuZ2FnZV9mdWxsOjQyMjZcbiAgICAgICAgLy8gICAgICAgYXR0YWNoIHRoZSB1cmwgdG8gdGhlIGluZGljYXRvciBhcyBhbiBhdHRyaWJ1dGVcbiAgICAgICAgLy8gICAgICAgYWRkIHRoZSBlbGVtZW50IHRvIHRoZSBpbmRpY2F0b3IgbWFwXG4gICAgICAgIC8vICAgICAgIC4uLnRoZW4gd2UgY2FuIGluc3RhbnRpYXRlIHRoZSBTdW1tYXJ5V2lkZ2V0IHJhY3RpdmUgYmFzZWQgb24gdGhlIGhhc2ggb25jZSB0aGUgZGF0YSBpcyBsb2FkZWRcbiAgICAgICAgdmFyICRzdW1tYXJ5ID0gJCh0aGlzKTtcbiAgICAgICAgLy9pbnNlcnRDb250ZW50KCRzdW1tYXJ5LCBUZW1wbGF0ZXMuc3VtbWFyeSh1cmxIYXNoKSwgZ3JvdXBTZXR0aW5ncy5zdW1tYXJ5TWV0aG9kKCkpO1xuICAgICAgICB2YXIgY29udGFpbmVyID0gJCgnPGRpdiBjbGFzcz1cImFudC1zdW1tYXJ5LWNvbnRhaW5lclwiPjwvZGl2PicpO1xuICAgICAgICB2YXIgc3VtbWFyeVdpZGdldCA9IFN1bW1hcnlXaWRnZXQuY3JlYXRlKGNvbnRhaW5lciwgUGFnZURhdGEuZ2V0KHVybEhhc2gpKTsgLy8gVE9ETyBzdGFzaCB0aGlzIGF3YXkgc29tZXdoZXJlXG4gICAgICAgIGluc2VydENvbnRlbnQoJHN1bW1hcnksIGNvbnRhaW5lciwgZ3JvdXBTZXR0aW5ncy5zdW1tYXJ5TWV0aG9kKCkpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBzY2FuRm9yQ2FsbHNUb0FjdGlvbigkc2VjdGlvbiwgZ3JvdXBTZXR0aW5ncykge1xuICAgIC8vIFRPRE9cbn1cblxuZnVuY3Rpb24gc2NhbkZvclRleHQoJHNlY3Rpb24sIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgJHRleHRFbGVtZW50cyA9ICRzZWN0aW9uLmZpbmQoZ3JvdXBTZXR0aW5ncy50ZXh0U2VsZWN0b3IoKSk7XG4gICAgLy8gVE9ETzogb25seSBzZWxlY3QgXCJsZWFmXCIgZWxlbWVudHNcbiAgICAkdGV4dEVsZW1lbnRzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkZWxlbWVudCA9ICQodGhpcyk7XG4gICAgICAgIC8vIFRPRE8gcG9zaXRpb24gY29ycmVjdGx5XG4gICAgICAgIC8vIFRPRE8gaGFzaCBhbmQgYWRkIGhhc2ggZGF0YSB0byBpbmRpY2F0b3JcbiAgICAgICAgdmFyIGhhc2ggPSBIYXNoLmhhc2hUZXh0KCRlbGVtZW50KTtcbiAgICAgICAgJGVsZW1lbnQuYXBwZW5kKFRlbXBsYXRlcy5pbmRpY2F0b3IoaGFzaCkpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBzY2FuRm9ySW1hZ2VzKCRzZWN0aW9uLCBncm91cFNldHRpbmdzKSB7XG4gICAgLy8gVE9ET1xufVxuXG5mdW5jdGlvbiBzY2FuRm9yTWVkaWEoJHNlY3Rpb24sIGdyb3VwU2V0dGluZ3MpIHtcbiAgICAvLyBUT0RPXG59XG5cbmZ1bmN0aW9uIGluc2VydENvbnRlbnQoJHBhcmVudCwgY29udGVudCwgbWV0aG9kKSB7XG4gICAgc3dpdGNoIChtZXRob2QpIHtcbiAgICAgICAgY2FzZSAnYXBwZW5kJzpcbiAgICAgICAgICAgICRwYXJlbnQuYXBwZW5kKGNvbnRlbnQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3ByZXBlbmQnOlxuICAgICAgICAgICAgJHBhcmVudC5wcmVwZW5kKGNvbnRlbnQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2JlZm9yZSc6XG4gICAgICAgICAgICAkcGFyZW50LmJlZm9yZShjb250ZW50KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdhZnRlcic6XG4gICAgICAgICAgICAkcGFyZW50LmFmdGVyKGNvbnRlbnQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICBzY2FuOiBzY2FuQWxsUGFnZXNcbn07IiwiXG52YXIgJDsgcmVxdWlyZSgnLi9zY3JpcHQtbG9hZGVyJykub24kKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgWERNQ2xpZW50ID0gcmVxdWlyZSgnLi91dGlscy94ZG0tY2xpZW50Jyk7XG52YXIgVVJMcyA9IHJlcXVpcmUoJy4vdXRpbHMvdXJscycpO1xuXG52YXIgcmFjdGl2ZTtcblxuZnVuY3Rpb24gY3JlYXRlUmVhY3Rpb25zV2lkZ2V0KGNvbnRhaW5lciwgcGFnZURhdGEpIHtcbiAgICB2YXIgcmVhY3Rpb25zRGF0YSA9IHBhZ2VEYXRhLnRvcFJlYWN0aW9ucztcbiAgICB2YXIgbGF5b3V0Q2xhc3NlcyA9IGNvbXB1dGVMYXlvdXRDbGFzc2VzKHJlYWN0aW9uc0RhdGEpO1xuICAgIHJhY3RpdmUgPSBSYWN0aXZlKHtcbiAgICAgICAgZWw6IGNvbnRhaW5lcixcbiAgICAgICAgbWFnaWM6IHRydWUsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIHJlYWN0aW9uczogcmVhY3Rpb25zRGF0YSxcbiAgICAgICAgICAgIGxheW91dENsYXNzOiBmdW5jdGlvbihpbmRleCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlYWN0aW9uc0RhdGEpO1xuICAgICAgICAgICAgICAgIHJldHVybiBsYXlvdXRDbGFzc2VzW2luZGV4XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgdGVtcGxhdGU6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9yZWFjdGlvbnMtd2lkZ2V0Lmh0bWwnKVxuICAgIH0pO1xuICAgIHJhY3RpdmUub24oJ2NvbXBsZXRlJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICQocm9vdEVsZW1lbnQoKSlcbiAgICAgICAgICAgICAgICAub24oJ21vdXNlb3ZlcicsIGtlZXBXaW5kb3dPcGVuKVxuICAgICAgICAgICAgICAgIC5vbignbW91c2VvdXQnLCBkZWxheWVkQ2xvc2VXaW5kb3cpO1xuICAgIH0pO1xuICAgIHJhY3RpdmUub24oJ2NoYW5nZScsIGZ1bmN0aW9uKCkge1xuICAgICAgICBsYXlvdXRDbGFzc2VzID0gY29tcHV0ZUxheW91dENsYXNzZXMocmVhY3Rpb25zRGF0YSk7XG4gICAgfSk7XG4gICAgcmFjdGl2ZS5vbigncGx1c29uZScsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHZhciByZWFjdGlvbkRhdGEgPSBldmVudC5jb250ZXh0O1xuICAgICAgICByZWFjdGlvbkRhdGEuY291bnQgPSByZWFjdGlvbkRhdGEuY291bnQgKyAxO1xuICAgICAgICAvLyBUT0RPOiBjaGVjayBiYWNrIG9uIHRoaXMgYXMgdGhlIHdheSB0byBwcm9wb2dhdGUgZGF0YSBjaGFuZ2VzIGJhY2sgdG8gdGhlIHN1bW1hcnlcbiAgICAgICAgcGFnZURhdGEuc3VtbWFyeS50b3RhbFJlYWN0aW9ucyA9IHBhZ2VEYXRhLnN1bW1hcnkudG90YWxSZWFjdGlvbnMgKyAxO1xuXG5cbiAgICAgICAgLy8gVE9ETyBzZW5kIHRoZSBjbGljayB0byB0aGUgc2VydmVyXG5cbiAgICAgICAgWERNQ2xpZW50LmdldFVzZXIoZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIHZhciB1c2VySW5mbyA9IHJlc3BvbnNlLmRhdGE7XG4gICAgICAgICAgICAvLyBUT0RPIGV4dHJhY3QgdGhlIHNoYXBlIG9mIHRoaXMgZGF0YSBhbmQgcG9zc2libHkgdGhlIHdob2xlIEFQSSBjYWxsXG4gICAgICAgICAgICAvLyBUT0RPIHRoaXMgaXMgb25seSBoYW5kbGluZyB0aGUgc3VtbWFyeSBjYXNlLiBuZWVkIHRvIGdlbmVyYWxpemUgdGhlIHdpZGdldCB0byBoYW5kbGUgY29udGFpbmVycy9jb250ZW50XG4gICAgICAgICAgICB2YXIgZGF0YSA9IHtcbiAgICAgICAgICAgICAgICB0YWc6IHtcbiAgICAgICAgICAgICAgICAgICAgYm9keTogcmVhY3Rpb25EYXRhLnRleHQsXG4gICAgICAgICAgICAgICAgICAgIGlkOiByZWFjdGlvbkRhdGEuaWQsXG4gICAgICAgICAgICAgICAgICAgIHRhZ19jb3VudDogcmVhY3Rpb25EYXRhLmNvdW50IC8vIFRPRE8gd2h5Pz9cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGhhc2g6ICdwYWdlJyxcbiAgICAgICAgICAgICAgICBraW5kOiAncGFnZScsXG4gICAgICAgICAgICAgICAgY29udGVudF9ub2RlOiAnJyxcbiAgICAgICAgICAgICAgICB1c2VyOiB7XG4gICAgICAgICAgICAgICAgICAgIGltZ191cmw6ICcnLCAvLyBUT0RPIHdoeT9cbiAgICAgICAgICAgICAgICAgICAgYW50X3Rva2VuOiB1c2VySW5mby5hbnRfdG9rZW4sXG4gICAgICAgICAgICAgICAgICAgIHVzZXJfaWQ6IHVzZXJJbmZvLnVzZXJfaWQsXG4gICAgICAgICAgICAgICAgICAgIHN0czogJycsIC8vIFRPRE8gPz9cbiAgICAgICAgICAgICAgICAgICAgbHRzOiAnJywgLy8gVE9ETyA/P1xuICAgICAgICAgICAgICAgICAgICB1c2VyX3R5cGU6IHVzZXJJbmZvLnVzZXJfdHlwZSAvLyBUT0RPIHdoYXQgaXMgdGhpcz9cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHVzZXJfaWQ6IHVzZXJJbmZvLnVzZXJfaWRcblxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHZhciBzdWNjZXNzID0gZnVuY3Rpb24oanNvbikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdzdWNjZXNzIScpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHZhciBlcnJvciA9IGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcImVycm9yIVwiKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAkLmdldEpTT05QKFVSTHMuY3JlYXRlUmVhY3Rpb25VcmwoKSwgZGF0YSwgc3VjY2VzcywgZXJyb3IpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbiAgICByZXR1cm4ge1xuICAgICAgICBvcGVuOiBvcGVuV2luZG93XG4gICAgfTtcbn1cblxuZnVuY3Rpb24gY29tcHV0ZUxheW91dENsYXNzZXMocmVhY3Rpb25zRGF0YSkge1xuICAgIC8vIFRPRE8gVmVyaWZ5IHRoYXQgdGhlIHJlYWN0aW9uc0RhdGEgaXMgY29taW5nIGJhY2sgZnJvbSB0aGUgc2VydmVyIHNvcnRlZC4gSWYgbm90LCBzb3J0IGl0IGFmdGVyIGl0cyBmZXRjaGVkLlxuXG4gICAgdmFyIG51bVJlYWN0aW9ucyA9IHJlYWN0aW9uc0RhdGEubGVuZ3RoO1xuICAgIC8vIFRPRE86IENvcGllZCBjb2RlIGZyb20gZW5nYWdlX2Z1bGwuY3JlYXRlVGFnQnVja2V0c1xuICAgIHZhciBtYXggPSByZWFjdGlvbnNEYXRhWzBdLmNvdW50O1xuICAgIHZhciBtZWRpYW4gPSByZWFjdGlvbnNEYXRhWyBNYXRoLmZsb29yKHJlYWN0aW9uc0RhdGEubGVuZ3RoLzIpIF0uY291bnQ7XG4gICAgdmFyIG1pbiA9IHJlYWN0aW9uc0RhdGFbIHJlYWN0aW9uc0RhdGEubGVuZ3RoLTEgXS5jb3VudDtcbiAgICB2YXIgdG90YWwgPSAwO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbnVtUmVhY3Rpb25zOyBpKyspIHtcbiAgICAgICAgdG90YWwgKz0gcmVhY3Rpb25zRGF0YVtpXS5jb3VudDtcbiAgICB9XG4gICAgdmFyIGF2ZXJhZ2UgPSBNYXRoLmZsb29yKHRvdGFsIC8gbnVtUmVhY3Rpb25zKTtcbiAgICB2YXIgbWlkVmFsdWUgPSAoIG1lZGlhbiA+IGF2ZXJhZ2UgKSA/IG1lZGlhbiA6IGF2ZXJhZ2U7XG5cbiAgICB2YXIgbGF5b3V0Q2xhc3NlcyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbnVtUmVhY3Rpb25zOyBpKyspIHtcbiAgICAgICAgaWYgKHJlYWN0aW9uc0RhdGFbaV0uY291bnQgPiBtaWRWYWx1ZSkge1xuICAgICAgICAgICAgbGF5b3V0Q2xhc3Nlc1tpXSA9ICdmdWxsJztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGxheW91dENsYXNzZXNbaV0gPSAnaGFsZic7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGxheW91dENsYXNzZXM7XG59XG5cbmZ1bmN0aW9uIHJvb3RFbGVtZW50KCkge1xuICAgIC8vIFRPRE86IGdvdHRhIGJlIGEgYmV0dGVyIHdheSB0byBnZXQgdGhpc1xuICAgIHJldHVybiByYWN0aXZlLmZpbmQoJ2RpdicpO1xufVxuXG5mdW5jdGlvbiBvcGVuV2luZG93KHJlbGF0aXZlRWxlbWVudCkge1xuICAgIGlmIChyYWN0aXZlKSB7XG4gICAgICAgIHZhciAkcmVsYXRpdmVFbGVtZW50ID0gJChyZWxhdGl2ZUVsZW1lbnQpO1xuICAgICAgICB2YXIgb2Zmc2V0ID0gJHJlbGF0aXZlRWxlbWVudC5vZmZzZXQoKTtcbiAgICAgICAgdmFyIGNvb3JkcyA9IHtcbiAgICAgICAgICAgIHRvcDogb2Zmc2V0LnRvcCArICRyZWxhdGl2ZUVsZW1lbnQuaGVpZ2h0KCksXG4gICAgICAgICAgICBsZWZ0OiBvZmZzZXQubGVmdFxuICAgICAgICB9O1xuICAgICAgICB2YXIgJGVsZW1lbnQgPSAkKHJvb3RFbGVtZW50KCkpO1xuICAgICAgICAkZWxlbWVudC5zdG9wKHRydWUsIHRydWUpLmFkZENsYXNzKCdvcGVuJykuY3NzKGNvb3Jkcyk7XG4gICAgfVxuXG59XG5cbnZhciBjbG9zZVRpbWVyO1xuXG5mdW5jdGlvbiBrZWVwV2luZG93T3BlbigpIHtcbiAgICBpZiAoY2xvc2VUaW1lcikgeyBjbGVhclRpbWVvdXQoY2xvc2VUaW1lcik7IH1cbn1cblxuZnVuY3Rpb24gZGVsYXllZENsb3NlV2luZG93KCkge1xuICAgIGNsb3NlVGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICBjbG9zZVRpbWVyID0gbnVsbDtcbiAgICAgICAgY2xvc2VXaW5kb3coKTtcbiAgICB9LCAxNTAwKTtcbn1cblxuZnVuY3Rpb24gY2xvc2VXaW5kb3coKSB7XG4gICAgdmFyICRlbGVtZW50ID0gJChyYWN0aXZlLmZpbmQoJ2RpdicpKTtcbiAgICAkZWxlbWVudC5zdG9wKHRydWUsIHRydWUpLmZhZGVPdXQoJ2Zhc3QnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgJGVsZW1lbnQuY3NzKCdkaXNwbGF5JywgJycpOyAvLyBDbGVhciB0aGUgZGlzcGxheTpub25lIHRoYXQgZmFkZU91dCBwdXRzIG9uIHRoZSBlbGVtZW50XG4gICAgICAgICRlbGVtZW50LnJlbW92ZUNsYXNzKCdvcGVuJyk7XG4gICAgfSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZTogY3JlYXRlUmVhY3Rpb25zV2lkZ2V0XG59OyIsIlxudmFyIGlzT2ZmbGluZSA9IHJlcXVpcmUoJy4vdXRpbHMvb2ZmbGluZScpO1xuXG52YXIgYmFzZVVybCA9ICdodHRwOi8vbG9jYWxob3N0OjgwODEnOyAvLyBUT0RPIGNvbXB1dGUgdGhpc1xuXG52YXIgJDtcbnZhciBqUXVlcnlDYWxsYmFja3MgPSBbXTtcblxuZnVuY3Rpb24gb24kKGNhbGxiYWNrKSB7XG4gICAgaWYgKCQpIHtcbiAgICAgICAgY2FsbGJhY2soJCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgalF1ZXJ5Q2FsbGJhY2tzLnB1c2goY2FsbGJhY2spO1xuICAgIH1cbn1cblxuZnVuY3Rpb24galF1ZXJ5TG9hZGVkKCkge1xuICAgIC8vIFVwZGF0ZSB0aGUgJCB0aGF0IHdlIGRlZmluZSB3aXRoaW4gb3VyIG93biBjbG9zdXJlIHRvIHRoZSB2ZXJzaW9uIG9mIGpRdWVyeSB0aGF0IHdlIHdhbnQgYW5kIHJlc2V0IHRoZSBnbG9iYWwgJFxuICAgICQgPSBqUXVlcnkubm9Db25mbGljdCh0cnVlKTtcblxuICAgICQuZ2V0SlNPTlAgPSBmdW5jdGlvbih1cmwsIGRhdGEsIHN1Y2Nlc3MsIGVycm9yKSB7XG4gICAgICAgIHZhciBvcHRpb25zID0ge1xuICAgICAgICAgICAgdXJsOiBiYXNlVXJsICsgdXJsLCAvLyBUT0RPIGJhc2UgdXJsXG4gICAgICAgICAgICB0eXBlOiBcImdldFwiLFxuICAgICAgICAgICAgY29udGVudFR5cGU6IFwiYXBwbGljYXRpb24vanNvblwiLFxuICAgICAgICAgICAgZGF0YVR5cGU6IFwianNvbnBcIixcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uKHJlc3BvbnNlLCB0ZXh0U3RhdHVzLCBYSFIpIHtcbiAgICAgICAgICAgICAgICAvLyBUT0RPOiBSZXZpc2l0IHdoZXRoZXIgaXQncyByZWFsbHkgY29vbCB0byBrZXkgdGhpcyBvbiB0aGUgdGV4dFN0YXR1cyBvciBpZiB3ZSBzaG91bGQgYmUgbG9va2luZyBhdFxuICAgICAgICAgICAgICAgIC8vICAgICAgIHRoZSBzdGF0dXMgY29kZSBpbiB0aGUgWEhSXG4gICAgICAgICAgICAgICAgaWYgKHRleHRTdGF0dXMgPT09ICdzdWNjZXNzJykge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEZvciBKU09OUCByZXF1ZXN0cywgalF1ZXJ5IGRvZXNuJ3QgY2FsbCBpdCdzIGVycm9yIGNhbGxiYWNrLiBJdCBjYWxscyBzdWNjZXNzIGluc3RlYWQuXG4gICAgICAgICAgICAgICAgICAgIGVycm9yKHJlc3BvbnNlLm1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgaWYgKGRhdGEpIHtcbiAgICAgICAgICAgIG9wdGlvbnMuZGF0YSA9IHsganNvbjogSlNPTi5zdHJpbmdpZnkoZGF0YSkgfTtcbiAgICAgICAgfVxuICAgICAgICAkLmFqYXgob3B0aW9ucyk7XG4gICAgfTtcblxuICAgIHdoaWxlIChqUXVlcnlDYWxsYmFja3MubGVuZ3RoID4gMCkge1xuICAgICAgICBqUXVlcnlDYWxsYmFja3MucG9wKCkoJCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBsb2FkU2NyaXB0cyhsb2FkZWRDYWxsYmFjaykge1xuICAgIHZhciBzY3JpcHRzID0gW1xuICAgICAgICB7c3JjOiAnLy9jZG5qcy5jbG91ZGZsYXJlLmNvbS9hamF4L2xpYnMvanF1ZXJ5LzIuMS40L2pxdWVyeS5taW4uanMnLCBjYWxsYmFjazogalF1ZXJ5TG9hZGVkfSxcbiAgICAgICAge3NyYzogJy8vY2RuanMuY2xvdWRmbGFyZS5jb20vYWpheC9saWJzL3JhY3RpdmUvMC43LjMvcmFjdGl2ZS5ydW50aW1lLm1pbi5qcyd9XG4gICAgXTtcbiAgICBpZiAoaXNPZmZsaW5lKSB7XG4gICAgICAgIC8vIFVzZSB0aGUgb2ZmbGluZSB2ZXJzaW9ucyBvZiB0aGUgbGlicmFyaWVzIGZvciBkZXZlbG9wbWVudC5cbiAgICAgICAgc2NyaXB0cyA9IFtcbiAgICAgICAgICAgIHtzcmM6IGJhc2VVcmwgKyAnL3N0YXRpYy9qcy9jZG4vanF1ZXJ5LzIuMS40L2pxdWVyeS5qcycsIGNhbGxiYWNrOiBqUXVlcnlMb2FkZWR9LFxuICAgICAgICAgICAge3NyYzogYmFzZVVybCArICcvc3RhdGljL2pzL2Nkbi9yYWN0aXZlLzAuNy4zL3JhY3RpdmUucnVudGltZS5qcyd9XG4gICAgICAgIF07XG4gICAgfVxuICAgIHZhciBsb2FkaW5nQ291bnQgPSBzY3JpcHRzLmxlbmd0aDtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNjcmlwdHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIHNjcmlwdCA9IHNjcmlwdHNbaV07XG4gICAgICAgIGxvYWRTY3JpcHQoc2NyaXB0LnNyYywgZnVuY3Rpb24oc2NyaXB0Q2FsbGJhY2spIHtcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBpZiAoc2NyaXB0Q2FsbGJhY2spIHNjcmlwdENhbGxiYWNrKCk7XG4gICAgICAgICAgICAgICAgbG9hZGluZ0NvdW50ID0gbG9hZGluZ0NvdW50IC0gMTtcbiAgICAgICAgICAgICAgICBpZiAobG9hZGluZ0NvdW50ID09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxvYWRlZENhbGxiYWNrKSBsb2FkZWRDYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gKHNjcmlwdC5jYWxsYmFjaykpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gbG9hZFNjcmlwdChzcmMsIGNhbGxiYWNrKSB7XG4gICAgdmFyIGhlYWQgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaGVhZCcpWzBdO1xuICAgIGlmIChoZWFkKSB7XG4gICAgICAgIHZhciBzY3JpcHRUYWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKTtcbiAgICAgICAgc2NyaXB0VGFnLnNldEF0dHJpYnV0ZSgnc3JjJywgc3JjKTtcbiAgICAgICAgc2NyaXB0VGFnLnNldEF0dHJpYnV0ZSgndHlwZScsJ3RleHQvamF2YXNjcmlwdCcpO1xuXG4gICAgICAgIGlmIChzY3JpcHRUYWcucmVhZHlTdGF0ZSkgeyAvLyBJRSwgaW5jbC4gSUU5XG4gICAgICAgICAgICBzY3JpcHRUYWcub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNjcmlwdFRhZy5yZWFkeVN0YXRlID09IFwibG9hZGVkXCIgfHwgc2NyaXB0VGFnLnJlYWR5U3RhdGUgPT0gXCJjb21wbGV0ZVwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHNjcmlwdFRhZy5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzY3JpcHRUYWcub25sb2FkID0gZnVuY3Rpb24oKSB7IC8vIE90aGVyIGJyb3dzZXJzXG4gICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICBoZWFkLmFwcGVuZENoaWxkKHNjcmlwdFRhZyk7XG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgbG9hZDogbG9hZFNjcmlwdHMsXG4gICAgb24kOiBvbiRcbn07IiwiXG52YXIgUmVhY3Rpb25zV2lkZ2V0ID0gcmVxdWlyZSgnLi9yZWFjdGlvbnMtd2lkZ2V0Jyk7XG5cbnZhciByYWN0aXZlO1xudmFyIHJlYWN0aW9uc1dpZGdldDtcblxuZnVuY3Rpb24gY3JlYXRlU3VtbWFyeVdpZGdldChjb250YWluZXIsIHBhZ2VEYXRhKSB7XG4gICAgLy8vLyBUT0RPIHJlcGxhY2UgZWxlbWVudFxuICAgIHJhY3RpdmUgPSBSYWN0aXZlKHtcbiAgICAgICAgZWw6IGNvbnRhaW5lcixcbiAgICAgICAgZGF0YTogcGFnZURhdGEsXG4gICAgICAgIG1hZ2ljOiB0cnVlLFxuICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL3N1bW1hcnktd2lkZ2V0Lmh0bWwnKSxcbiAgICAgICAgb25jb21wbGV0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgICAgICAkKHJvb3RFbGVtZW50KCkpLm9uKCdjbGljaycsIGZ1bmN0aW9uKGV2ZW50KSB7IC8vIFRPRE86IGRlbGV0ZS4gdGhpcyBpcyBqdXN0IHRveVxuICAgICAgICAgICAgICAgdGhhdC5hZGQoJ3N1bW1hcnkudG90YWxSZWFjdGlvbnMnKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgJChyb290RWxlbWVudCgpKS5vbignbW91c2VlbnRlcicsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICAgICBvcGVuUmVhY3Rpb25zV2luZG93KHBhZ2VEYXRhKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHJhY3RpdmU7XG59XG5cbmZ1bmN0aW9uIHJvb3RFbGVtZW50KCkge1xuICAgIC8vIFRPRE86IGdvdHRhIGJlIGEgYmV0dGVyIHdheSB0byBnZXQgdGhpc1xuICAgIC8vIFRPRE86IG91ciBjbGljayBoYW5kbGVyIGlzIGdldHRpbmcgY2FsbGVkIHR3aWNlLCBzbyBpdCBsb29rcyBsaWtlIHRoaXMgc29tZWhvdyBnZXRzIHRoZSB3cm9uZyBlbGVtZW50IGlmIHRoZXJlIGFyZSB0d28gc3VtbWFyeSB3aWRnZXRzIHRvZ2V0aGVyP1xuICAgIHJldHVybiByYWN0aXZlLmZpbmQoJ2RpdicpO1xufVxuXG5mdW5jdGlvbiBvcGVuUmVhY3Rpb25zV2luZG93KHBhZ2VEYXRhKSB7XG4gICAgaWYgKCFyZWFjdGlvbnNXaWRnZXQpIHtcbiAgICAgICAgLy8gVE9ETzogY29uc2lkZXIgcHJlcG9wdWxhdGluZyB0aGlzXG4gICAgICAgIHZhciBidWNrZXQgPSBnZXRXaWRnZXRCdWNrZXQoKTtcbiAgICAgICAgdmFyIGNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBidWNrZXQuYXBwZW5kQ2hpbGQoY29udGFpbmVyKTtcbiAgICAgICAgcmVhY3Rpb25zV2lkZ2V0ID0gUmVhY3Rpb25zV2lkZ2V0LmNyZWF0ZShjb250YWluZXIsIHBhZ2VEYXRhKTtcbiAgICB9XG4gICAgcmVhY3Rpb25zV2lkZ2V0Lm9wZW4ocm9vdEVsZW1lbnQoKSk7XG59XG5cbmZ1bmN0aW9uIGdldFdpZGdldEJ1Y2tldCgpIHtcbiAgICB2YXIgYnVja2V0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2FudGVubmEtd2lkZ2V0LWJ1Y2tldCcpO1xuICAgIGlmICghYnVja2V0KSB7XG4gICAgICAgIGJ1Y2tldCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBidWNrZXQuc2V0QXR0cmlidXRlKCdpZCcsICdhbnRlbm5hLXdpZGdldC1idWNrZXQnKTtcbiAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChidWNrZXQpO1xuICAgIH1cbiAgICByZXR1cm4gYnVja2V0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGU6IGNyZWF0ZVN1bW1hcnlXaWRnZXRcbn07IiwiXG5cbi8vIFRPRE8gdXNlIGFjdHVhbCB0ZW1wbGF0ZXMuIDopXG5cbmZ1bmN0aW9uIGluZGljYXRvcihoYXNoKSB7XG4gICAgcmV0dXJuICQoJzxkaXYgc3R5bGU9XCJ3aWR0aDoyMHB4OyBoZWlnaHQ6IDIwcHg7IGJvcmRlci1yYWRpdXM6MjBweDsgYmFja2dyb3VuZC1jb2xvcjogcmVkOyBmbG9hdDpyaWdodDtcIiAnICtcbiAgICAgICAgICAgICdhbnQtaGFzaD1cIicgKyBoYXNoICsgJ1wiPjwvZGl2PicpO1xufVxuXG5mdW5jdGlvbiBzdW1tYXJ5KGhhc2gpIHtcbiAgICByZXR1cm4gJCgnPGRpdiBzdHlsZT1cIm1pbi13aWR0aDo1MHB4OyBoZWlnaHQ6IDIwcHg7IGJvcmRlci1yYWRpdXM6M3B4OyBiYWNrZ3JvdW5kLWNvbG9yOiBibHVlOyBmbG9hdDpsZWZ0O1wiJyArICcgYW50LWhhc2g9XCInICsgaGFzaCArICdcIj48L2Rpdj4nKTtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGluZGljYXRvcjogaW5kaWNhdG9yLFxuICAgIHN1bW1hcnk6IHN1bW1hcnlcbn07IiwiXG52YXIgTUQ1ID0gcmVxdWlyZSgnLi9tZDUnKTtcblxuLy8gVE9ETzogVGhpcyBpcyBqdXN0IGNvcHkvcGFzdGVkIGZyb20gZW5nYWdlX2Z1bGxcbi8vIFRPRE86IFRoZSBjb2RlIGlzIGxvb2tpbmcgZm9yIC5hbnRfaW5kaWNhdG9yIHRvIHNlZSBpZiBpdCdzIGFscmVhZHkgYmVlbiBoYXNoZWQuIFJldmlldy5cbmZ1bmN0aW9uIGdldENsZWFuVGV4dCgkZG9tTm9kZSkge1xuICAgIC8vIEFOVC51dGlsLmdldENsZWFuVGV4dFxuICAgIC8vIGNvbW1vbiBmdW5jdGlvbiBmb3IgY2xlYW5pbmcgdGhlIHRleHQgbm9kZSB0ZXh0LiAgcmlnaHQgbm93LCBpdCdzIHJlbW92aW5nIHNwYWNlcywgdGFicywgbmV3bGluZXMsIGFuZCB0aGVuIGRvdWJsZSBzcGFjZXNcblxuICAgIHZhciAkbm9kZSA9ICRkb21Ob2RlLmNsb25lKCk7XG5cbiAgICAkbm9kZS5maW5kKCcuYW50LCAuYW50LWN1c3RvbS1jdGEtY29udGFpbmVyJykucmVtb3ZlKCk7XG5cbiAgICAvL21ha2Ugc3VyZSBpdCBkb2VzbnQgYWxyZWR5IGhhdmUgaW4gaW5kaWNhdG9yIC0gaXQgc2hvdWxkbid0LlxuICAgIHZhciAkaW5kaWNhdG9yID0gJG5vZGUuZmluZCgnLmFudF9pbmRpY2F0b3InKTtcbiAgICBpZigkaW5kaWNhdG9yLmxlbmd0aCl7XG4gICAgICAgIC8vdG9kbzogc2VuZCB1cyBhbiBlcnJvciByZXBvcnQgLSB0aGlzIG1heSBzdGlsbCBiZSBoYXBwZW5pbmcgZm9yIHNsaWRlc2hvd3MuXG4gICAgICAgIC8vVGhpcyBmaXggd29ya3MgZmluZSwgYnV0IHdlIHNob3VsZCBmaXggdGhlIGNvZGUgdG8gaGFuZGxlIGl0IGJlZm9yZSBoZXJlLlxuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gZ2V0IHRoZSBub2RlJ3MgdGV4dCBhbmQgc21hc2ggY2FzZVxuICAgIC8vIFRPRE86IDxicj4gdGFncyBhbmQgYmxvY2stbGV2ZWwgdGFncyBjYW4gc2NyZXcgdXAgd29yZHMuICBleDpcbiAgICAvLyBoZWxsbzxicj5ob3cgYXJlIHlvdT8gICBoZXJlIGJlY29tZXNcbiAgICAvLyBoZWxsb2hvdyBhcmUgeW91PyAgICA8LS0gbm8gc3BhY2Ugd2hlcmUgdGhlIDxicj4gd2FzLiAgYmFkLlxuICAgIHZhciBub2RlX3RleHQgPSAkLnRyaW0oICRub2RlLmh0bWwoKS5yZXBsYWNlKC88ICpiciAqXFwvPz4vZ2ksICcgJykgKTtcbiAgICB2YXIgYm9keSA9ICQudHJpbSggJCggXCI8ZGl2PlwiICsgbm9kZV90ZXh0ICsgXCI8L2Rpdj5cIiApLnRleHQoKS50b0xvd2VyQ2FzZSgpICk7XG5cbiAgICBpZiggYm9keSAmJiB0eXBlb2YgYm9keSA9PSBcInN0cmluZ1wiICYmIGJvZHkgIT09IFwiXCIgKSB7XG4gICAgICAgIHZhciBmaXJzdHBhc3MgPSBib2R5LnJlcGxhY2UoL1tcXG5cXHJcXHRdKy9naSwnICcpLnJlcGxhY2UoKS5yZXBsYWNlKC9cXHN7Mix9L2csJyAnKTtcbiAgICAgICAgLy8gc2VlaW5nIGlmIHRoaXMgaGVscHMgdGhlIHByb3B1YiBpc3N1ZSAtIHRvIHRyaW0gYWdhaW4uICBXaGVuIGkgcnVuIHRoaXMgbGluZSBhYm92ZSBpdCBsb29rcyBsaWtlIHRoZXJlIGlzIHN0aWxsIHdoaXRlIHNwYWNlLlxuICAgICAgICByZXR1cm4gJC50cmltKGZpcnN0cGFzcyk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBoYXNoVGV4dChlbGVtZW50KSB7XG4gICAgLy8gVE9ETzogSGFuZGxlIHRoZSBjYXNlIHdoZXJlIG11bHRpcGxlIGluc3RhbmNlcyBvZiB0aGUgc2FtZSB0ZXh0IGFwcGVhciBvbiB0aGUgcGFnZS4gTmVlZCB0byBhZGQgYW4gaW5jcmVtZW50IHRvXG4gICAgLy8gdGhlIGhhc2hUZXh0LiAoVGhpcyBjaGVjayBoYXMgdG8gYmUgc2NvcGVkIHRvIGEgcG9zdClcbiAgICB2YXIgdGV4dCA9IGdldENsZWFuVGV4dChlbGVtZW50KTtcbiAgICB2YXIgaGFzaFRleHQgPSBcInJkci10ZXh0LVwiK3RleHQ7XG4gICAgcmV0dXJuIE1ENS5oZXhfbWQ1KGhhc2hUZXh0KTtcbn1cblxuZnVuY3Rpb24gaGFzaFVybCh1cmwpIHtcbiAgICByZXR1cm4gTUQ1LmhleF9tZDUodXJsKTtcbn1cblxuZnVuY3Rpb24gaGFzaEltYWdlKGVsZW1lbnQpIHtcblxufVxuXG5mdW5jdGlvbiBoYXNoTWVkaWEoZWxlbWVudCkge1xuXG59XG5cbmZ1bmN0aW9uIGhhc2hFbGVtZW50KGVsZW1lbnQpIHtcbiAgICAvLyBUT0RPIG1ha2UgcmVhbFxuICAgIHJldHVybiAnYWJjJztcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGhhc2hUZXh0OiBoYXNoVGV4dCxcbiAgICBoYXNoVXJsOiBoYXNoVXJsXG59OyIsIlxuLy8gVE9ETzogVGhpcyBjb2RlIGlzIGp1c3QgY29waWVkIGZyb20gZW5nYWdlX2Z1bGwuanMuIFJldmlldyB3aGV0aGVyIHdlIHdhbnQgdG8ga2VlcCBpdCBhcy1pcy5cblxudmFyIEFOVCA9IHtcbiAgICB1dGlsOiB7XG4gICAgICAgIG1kNToge1xuICAgICAgICAgICAgaGV4Y2FzZTowLFxuICAgICAgICAgICAgYjY0cGFkOlwiXCIsXG4gICAgICAgICAgICBjaHJzejo4LFxuICAgICAgICAgICAgaGV4X21kNTogZnVuY3Rpb24ocyl7cmV0dXJuIEFOVC51dGlsLm1kNS5iaW5sMmhleChBTlQudXRpbC5tZDUuY29yZV9tZDUoQU5ULnV0aWwubWQ1LnN0cjJiaW5sKHMpLHMubGVuZ3RoKkFOVC51dGlsLm1kNS5jaHJzeikpO30sXG4gICAgICAgICAgICBjb3JlX21kNTogZnVuY3Rpb24oeCxsZW4pe3hbbGVuPj41XXw9MHg4MDw8KChsZW4pJTMyKTt4WygoKGxlbis2NCk+Pj45KTw8NCkrMTRdPWxlbjt2YXIgYT0xNzMyNTg0MTkzO3ZhciBiPS0yNzE3MzM4Nzk7dmFyIGM9LTE3MzI1ODQxOTQ7dmFyIGQ9MjcxNzMzODc4O2Zvcih2YXIgaT0wO2k8eC5sZW5ndGg7aSs9MTYpe3ZhciBvbGRhPWE7dmFyIG9sZGI9Yjt2YXIgb2xkYz1jO3ZhciBvbGRkPWQ7YT1BTlQudXRpbC5tZDUubWQ1X2ZmKGEsYixjLGQseFtpKzBdLDcsLTY4MDg3NjkzNik7ZD1BTlQudXRpbC5tZDUubWQ1X2ZmKGQsYSxiLGMseFtpKzFdLDEyLC0zODk1NjQ1ODYpO2M9QU5ULnV0aWwubWQ1Lm1kNV9mZihjLGQsYSxiLHhbaSsyXSwxNyw2MDYxMDU4MTkpO2I9QU5ULnV0aWwubWQ1Lm1kNV9mZihiLGMsZCxhLHhbaSszXSwyMiwtMTA0NDUyNTMzMCk7YT1BTlQudXRpbC5tZDUubWQ1X2ZmKGEsYixjLGQseFtpKzRdLDcsLTE3NjQxODg5Nyk7ZD1BTlQudXRpbC5tZDUubWQ1X2ZmKGQsYSxiLGMseFtpKzVdLDEyLDEyMDAwODA0MjYpO2M9QU5ULnV0aWwubWQ1Lm1kNV9mZihjLGQsYSxiLHhbaSs2XSwxNywtMTQ3MzIzMTM0MSk7Yj1BTlQudXRpbC5tZDUubWQ1X2ZmKGIsYyxkLGEseFtpKzddLDIyLC00NTcwNTk4Myk7YT1BTlQudXRpbC5tZDUubWQ1X2ZmKGEsYixjLGQseFtpKzhdLDcsMTc3MDAzNTQxNik7ZD1BTlQudXRpbC5tZDUubWQ1X2ZmKGQsYSxiLGMseFtpKzldLDEyLC0xOTU4NDE0NDE3KTtjPUFOVC51dGlsLm1kNS5tZDVfZmYoYyxkLGEsYix4W2krMTBdLDE3LC00MjA2Myk7Yj1BTlQudXRpbC5tZDUubWQ1X2ZmKGIsYyxkLGEseFtpKzExXSwyMiwtMTk5MDQwNDE2Mik7YT1BTlQudXRpbC5tZDUubWQ1X2ZmKGEsYixjLGQseFtpKzEyXSw3LDE4MDQ2MDM2ODIpO2Q9QU5ULnV0aWwubWQ1Lm1kNV9mZihkLGEsYixjLHhbaSsxM10sMTIsLTQwMzQxMTAxKTtjPUFOVC51dGlsLm1kNS5tZDVfZmYoYyxkLGEsYix4W2krMTRdLDE3LC0xNTAyMDAyMjkwKTtiPUFOVC51dGlsLm1kNS5tZDVfZmYoYixjLGQsYSx4W2krMTVdLDIyLDEyMzY1MzUzMjkpO2E9QU5ULnV0aWwubWQ1Lm1kNV9nZyhhLGIsYyxkLHhbaSsxXSw1LC0xNjU3OTY1MTApO2Q9QU5ULnV0aWwubWQ1Lm1kNV9nZyhkLGEsYixjLHhbaSs2XSw5LC0xMDY5NTAxNjMyKTtjPUFOVC51dGlsLm1kNS5tZDVfZ2coYyxkLGEsYix4W2krMTFdLDE0LDY0MzcxNzcxMyk7Yj1BTlQudXRpbC5tZDUubWQ1X2dnKGIsYyxkLGEseFtpKzBdLDIwLC0zNzM4OTczMDIpO2E9QU5ULnV0aWwubWQ1Lm1kNV9nZyhhLGIsYyxkLHhbaSs1XSw1LC03MDE1NTg2OTEpO2Q9QU5ULnV0aWwubWQ1Lm1kNV9nZyhkLGEsYixjLHhbaSsxMF0sOSwzODAxNjA4Myk7Yz1BTlQudXRpbC5tZDUubWQ1X2dnKGMsZCxhLGIseFtpKzE1XSwxNCwtNjYwNDc4MzM1KTtiPUFOVC51dGlsLm1kNS5tZDVfZ2coYixjLGQsYSx4W2krNF0sMjAsLTQwNTUzNzg0OCk7YT1BTlQudXRpbC5tZDUubWQ1X2dnKGEsYixjLGQseFtpKzldLDUsNTY4NDQ2NDM4KTtkPUFOVC51dGlsLm1kNS5tZDVfZ2coZCxhLGIsYyx4W2krMTRdLDksLTEwMTk4MDM2OTApO2M9QU5ULnV0aWwubWQ1Lm1kNV9nZyhjLGQsYSxiLHhbaSszXSwxNCwtMTg3MzYzOTYxKTtiPUFOVC51dGlsLm1kNS5tZDVfZ2coYixjLGQsYSx4W2krOF0sMjAsMTE2MzUzMTUwMSk7YT1BTlQudXRpbC5tZDUubWQ1X2dnKGEsYixjLGQseFtpKzEzXSw1LC0xNDQ0NjgxNDY3KTtkPUFOVC51dGlsLm1kNS5tZDVfZ2coZCxhLGIsYyx4W2krMl0sOSwtNTE0MDM3ODQpO2M9QU5ULnV0aWwubWQ1Lm1kNV9nZyhjLGQsYSxiLHhbaSs3XSwxNCwxNzM1MzI4NDczKTtiPUFOVC51dGlsLm1kNS5tZDVfZ2coYixjLGQsYSx4W2krMTJdLDIwLC0xOTI2NjA3NzM0KTthPUFOVC51dGlsLm1kNS5tZDVfaGgoYSxiLGMsZCx4W2krNV0sNCwtMzc4NTU4KTtkPUFOVC51dGlsLm1kNS5tZDVfaGgoZCxhLGIsYyx4W2krOF0sMTEsLTIwMjI1NzQ0NjMpO2M9QU5ULnV0aWwubWQ1Lm1kNV9oaChjLGQsYSxiLHhbaSsxMV0sMTYsMTgzOTAzMDU2Mik7Yj1BTlQudXRpbC5tZDUubWQ1X2hoKGIsYyxkLGEseFtpKzE0XSwyMywtMzUzMDk1NTYpO2E9QU5ULnV0aWwubWQ1Lm1kNV9oaChhLGIsYyxkLHhbaSsxXSw0LC0xNTMwOTkyMDYwKTtkPUFOVC51dGlsLm1kNS5tZDVfaGgoZCxhLGIsYyx4W2krNF0sMTEsMTI3Mjg5MzM1Myk7Yz1BTlQudXRpbC5tZDUubWQ1X2hoKGMsZCxhLGIseFtpKzddLDE2LC0xNTU0OTc2MzIpO2I9QU5ULnV0aWwubWQ1Lm1kNV9oaChiLGMsZCxhLHhbaSsxMF0sMjMsLTEwOTQ3MzA2NDApO2E9QU5ULnV0aWwubWQ1Lm1kNV9oaChhLGIsYyxkLHhbaSsxM10sNCw2ODEyNzkxNzQpO2Q9QU5ULnV0aWwubWQ1Lm1kNV9oaChkLGEsYixjLHhbaSswXSwxMSwtMzU4NTM3MjIyKTtjPUFOVC51dGlsLm1kNS5tZDVfaGgoYyxkLGEsYix4W2krM10sMTYsLTcyMjUyMTk3OSk7Yj1BTlQudXRpbC5tZDUubWQ1X2hoKGIsYyxkLGEseFtpKzZdLDIzLDc2MDI5MTg5KTthPUFOVC51dGlsLm1kNS5tZDVfaGgoYSxiLGMsZCx4W2krOV0sNCwtNjQwMzY0NDg3KTtkPUFOVC51dGlsLm1kNS5tZDVfaGgoZCxhLGIsYyx4W2krMTJdLDExLC00MjE4MTU4MzUpO2M9QU5ULnV0aWwubWQ1Lm1kNV9oaChjLGQsYSxiLHhbaSsxNV0sMTYsNTMwNzQyNTIwKTtiPUFOVC51dGlsLm1kNS5tZDVfaGgoYixjLGQsYSx4W2krMl0sMjMsLTk5NTMzODY1MSk7YT1BTlQudXRpbC5tZDUubWQ1X2lpKGEsYixjLGQseFtpKzBdLDYsLTE5ODYzMDg0NCk7ZD1BTlQudXRpbC5tZDUubWQ1X2lpKGQsYSxiLGMseFtpKzddLDEwLDExMjY4OTE0MTUpO2M9QU5ULnV0aWwubWQ1Lm1kNV9paShjLGQsYSxiLHhbaSsxNF0sMTUsLTE0MTYzNTQ5MDUpO2I9QU5ULnV0aWwubWQ1Lm1kNV9paShiLGMsZCxhLHhbaSs1XSwyMSwtNTc0MzQwNTUpO2E9QU5ULnV0aWwubWQ1Lm1kNV9paShhLGIsYyxkLHhbaSsxMl0sNiwxNzAwNDg1NTcxKTtkPUFOVC51dGlsLm1kNS5tZDVfaWkoZCxhLGIsYyx4W2krM10sMTAsLTE4OTQ5ODY2MDYpO2M9QU5ULnV0aWwubWQ1Lm1kNV9paShjLGQsYSxiLHhbaSsxMF0sMTUsLTEwNTE1MjMpO2I9QU5ULnV0aWwubWQ1Lm1kNV9paShiLGMsZCxhLHhbaSsxXSwyMSwtMjA1NDkyMjc5OSk7YT1BTlQudXRpbC5tZDUubWQ1X2lpKGEsYixjLGQseFtpKzhdLDYsMTg3MzMxMzM1OSk7ZD1BTlQudXRpbC5tZDUubWQ1X2lpKGQsYSxiLGMseFtpKzE1XSwxMCwtMzA2MTE3NDQpO2M9QU5ULnV0aWwubWQ1Lm1kNV9paShjLGQsYSxiLHhbaSs2XSwxNSwtMTU2MDE5ODM4MCk7Yj1BTlQudXRpbC5tZDUubWQ1X2lpKGIsYyxkLGEseFtpKzEzXSwyMSwxMzA5MTUxNjQ5KTthPUFOVC51dGlsLm1kNS5tZDVfaWkoYSxiLGMsZCx4W2krNF0sNiwtMTQ1NTIzMDcwKTtkPUFOVC51dGlsLm1kNS5tZDVfaWkoZCxhLGIsYyx4W2krMTFdLDEwLC0xMTIwMjEwMzc5KTtjPUFOVC51dGlsLm1kNS5tZDVfaWkoYyxkLGEsYix4W2krMl0sMTUsNzE4Nzg3MjU5KTtiPUFOVC51dGlsLm1kNS5tZDVfaWkoYixjLGQsYSx4W2krOV0sMjEsLTM0MzQ4NTU1MSk7YT1BTlQudXRpbC5tZDUuc2FmZV9hZGQoYSxvbGRhKTtiPUFOVC51dGlsLm1kNS5zYWZlX2FkZChiLG9sZGIpO2M9QU5ULnV0aWwubWQ1LnNhZmVfYWRkKGMsb2xkYyk7ZD1BTlQudXRpbC5tZDUuc2FmZV9hZGQoZCxvbGRkKTt9IHJldHVybiBBcnJheShhLGIsYyxkKTt9LFxuICAgICAgICAgICAgbWQ1X2NtbjogZnVuY3Rpb24ocSxhLGIseCxzLHQpe3JldHVybiBBTlQudXRpbC5tZDUuc2FmZV9hZGQoQU5ULnV0aWwubWQ1LmJpdF9yb2woQU5ULnV0aWwubWQ1LnNhZmVfYWRkKEFOVC51dGlsLm1kNS5zYWZlX2FkZChhLHEpLEFOVC51dGlsLm1kNS5zYWZlX2FkZCh4LHQpKSxzKSxiKTt9LFxuICAgICAgICAgICAgbWQ1X2ZmOiBmdW5jdGlvbihhLGIsYyxkLHgscyx0KXtyZXR1cm4gQU5ULnV0aWwubWQ1Lm1kNV9jbW4oKGImYyl8KCh+YikmZCksYSxiLHgscyx0KTt9LFxuICAgICAgICAgICAgbWQ1X2dnOiBmdW5jdGlvbihhLGIsYyxkLHgscyx0KXtyZXR1cm4gQU5ULnV0aWwubWQ1Lm1kNV9jbW4oKGImZCl8KGMmKH5kKSksYSxiLHgscyx0KTt9LFxuICAgICAgICAgICAgbWQ1X2hoOiBmdW5jdGlvbihhLGIsYyxkLHgscyx0KXtyZXR1cm4gQU5ULnV0aWwubWQ1Lm1kNV9jbW4oYl5jXmQsYSxiLHgscyx0KTt9LFxuICAgICAgICAgICAgbWQ1X2lpOiBmdW5jdGlvbihhLGIsYyxkLHgscyx0KXtyZXR1cm4gQU5ULnV0aWwubWQ1Lm1kNV9jbW4oY14oYnwofmQpKSxhLGIseCxzLHQpO30sXG4gICAgICAgICAgICBzYWZlX2FkZDogZnVuY3Rpb24oeCx5KXt2YXIgbHN3PSh4JjB4RkZGRikrKHkmMHhGRkZGKTt2YXIgbXN3PSh4Pj4xNikrKHk+PjE2KSsobHN3Pj4xNik7cmV0dXJuKG1zdzw8MTYpfChsc3cmMHhGRkZGKTt9LFxuICAgICAgICAgICAgYml0X3JvbDogZnVuY3Rpb24obnVtLGNudCl7cmV0dXJuKG51bTw8Y250KXwobnVtPj4+KDMyLWNudCkpO30sXG4gICAgICAgICAgICAvL3RoZSBsaW5lIGJlbG93IGlzIGNhbGxlZCBvdXQgYnkganNMaW50IGJlY2F1c2UgaXQgdXNlcyBBcnJheSgpIGluc3RlYWQgb2YgW10uICBXZSBjYW4gaWdub3JlLCBvciBJJ20gc3VyZSB3ZSBjb3VsZCBjaGFuZ2UgaXQgaWYgd2Ugd2FudGVkIHRvLlxuICAgICAgICAgICAgc3RyMmJpbmw6IGZ1bmN0aW9uKHN0cil7dmFyIGJpbj1BcnJheSgpO3ZhciBtYXNrPSgxPDxBTlQudXRpbC5tZDUuY2hyc3opLTE7Zm9yKHZhciBpPTA7aTxzdHIubGVuZ3RoKkFOVC51dGlsLm1kNS5jaHJzejtpKz1BTlQudXRpbC5tZDUuY2hyc3ope2JpbltpPj41XXw9KHN0ci5jaGFyQ29kZUF0KGkvQU5ULnV0aWwubWQ1LmNocnN6KSZtYXNrKTw8KGklMzIpO31yZXR1cm4gYmluO30sXG4gICAgICAgICAgICBiaW5sMmhleDogZnVuY3Rpb24oYmluYXJyYXkpe3ZhciBoZXhfdGFiPUFOVC51dGlsLm1kNS5oZXhjYXNlP1wiMDEyMzQ1Njc4OUFCQ0RFRlwiOlwiMDEyMzQ1Njc4OWFiY2RlZlwiO3ZhciBzdHI9XCJcIjtmb3IodmFyIGk9MDtpPGJpbmFycmF5Lmxlbmd0aCo0O2krKyl7c3RyKz1oZXhfdGFiLmNoYXJBdCgoYmluYXJyYXlbaT4+Ml0+PigoaSU0KSo4KzQpKSYweEYpK2hleF90YWIuY2hhckF0KChiaW5hcnJheVtpPj4yXT4+KChpJTQpKjgpKSYweEYpO30gcmV0dXJuIHN0cjt9XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgaGV4X21kNTogQU5ULnV0aWwubWQ1LmhleF9tZDVcbn07IiwiXG52YXIgb2ZmbGluZTtcblxuZnVuY3Rpb24gaXNPZmZsaW5lKCkge1xuICAgIGlmIChvZmZsaW5lID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgLy8gVE9ETzogRG8gc29tZXRoaW5nIGNyb3NzLWJyb3dzZXIgaGVyZS4gVGhpcyB3b24ndCB3b3JrIGluIElFLlxuICAgICAgICAvLyBUT0RPOiBNYWtlIHRoaXMgbW9yZSBmbGV4aWJsZSBzbyBpdCB3b3JrcyBpbiBldmVyeW9uZSdzIGRldiBlbnZpcm9ubWVudFxuICAgICAgICBvZmZsaW5lID0gZG9jdW1lbnQuY3VycmVudFNjcmlwdC5zcmMgPT09ICdodHRwOi8vbG9jYWxob3N0OjgwODEvc3RhdGljL3dpZGdldC1uZXcvZGVidWcvYW50ZW5uYS5qcyc7XG4gICAgfVxuICAgIHJldHVybiBvZmZsaW5lO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzT2ZmbGluZSgpOyIsIlxudmFyICQ7IHJlcXVpcmUoJy4uL3NjcmlwdC1sb2FkZXInKS5vbiQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcblxudmFyIG9mZmxpbmUgPSByZXF1aXJlKCcuL29mZmxpbmUuanMnKTtcblxuZnVuY3Rpb24gYW50ZW5uYUhvbWUoKSB7XG4gICAgaWYgKG9mZmxpbmUpIHtcbiAgICAgICAgcmV0dXJuIHdpbmRvdy5sb2NhdGlvbi5wcm90b2NvbCArIFwiLy9sb2NhbC5hbnRlbm5hLmlzOjgwODFcIjtcbiAgICB9XG4gICAgcmV0dXJuIHdpbmRvdy5sb2NhdGlvbi5wcm90b2NvbCArIFwiLy93d3cuYW50ZW5uYS5pc1wiO1xufVxuXG4vLyBUT0RPIGNvcGllZCBmcm9tIGVuZ2FnZV9mdWxsLiBSZXZpZXcuXG5mdW5jdGlvbiBjb21wdXRlUGFnZVVybChncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIHBhZ2VfdXJsID0gJC50cmltKCB3aW5kb3cubG9jYXRpb24uaHJlZi5zcGxpdCgnIycpWzBdICkudG9Mb3dlckNhc2UoKTsgLy8gVE9ETyBzaG91bGQgcGFzcyB0aGlzIGluIGluc3RlYWQgb2YgcmVjb21wdXRpbmdcbiAgICByZXR1cm4gcmVtb3ZlU3ViZG9tYWluRnJvbVBhZ2VVcmwocGFnZV91cmwsIGdyb3VwU2V0dGluZ3MpO1xufVxuXG4vLyBUT0RPIGNvcGllZCBmcm9tIGVuZ2FnZV9mdWxsLiBSZXZpZXcuXG5mdW5jdGlvbiBjb21wdXRlVG9wTGV2ZWxDYW5vbmljYWxVcmwoZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBwYWdlX3VybCA9ICQudHJpbSggd2luZG93LmxvY2F0aW9uLmhyZWYuc3BsaXQoJyMnKVswXSApLnRvTG93ZXJDYXNlKCk7IC8vIFRPRE8gc2hvdWxkIHBhc3MgdGhpcyBpbiBpbnN0ZWFkIG9mIHJlY29tcHV0aW5nXG4gICAgdmFyIGNhbm9uaWNhbF91cmwgPSAoICQoJ2xpbmtbcmVsPVwiY2Fub25pY2FsXCJdJykubGVuZ3RoID4gMCApID9cbiAgICAgICAgICAgICAgICAkKCdsaW5rW3JlbD1cImNhbm9uaWNhbFwiXScpLmF0dHIoJ2hyZWYnKSA6IHBhZ2VfdXJsO1xuXG4gICAgLy8gYW50OnVybCBvdmVycmlkZXNcbiAgICBpZiAoICQoJ1twcm9wZXJ0eT1cImFudGVubmE6dXJsXCJdJykubGVuZ3RoID4gMCApIHtcbiAgICAgICAgY2Fub25pY2FsX3VybCA9ICQoJ1twcm9wZXJ0eT1cImFudGVubmE6dXJsXCJdJykuYXR0cignY29udGVudCcpO1xuICAgIH1cblxuICAgIGNhbm9uaWNhbF91cmwgPSAkLnRyaW0oIGNhbm9uaWNhbF91cmwudG9Mb3dlckNhc2UoKSApO1xuXG4gICAgaWYgKGNhbm9uaWNhbF91cmwgPT0gY29tcHV0ZVBhZ2VVcmwoZ3JvdXBTZXR0aW5ncykgKSB7IC8vIFRPRE8gc2hvdWxkIHBhc3MgdGhpcyBpbiBpbnN0ZWFkIG9mIHJlY29tcHV0aW5nXG4gICAgICAgIGNhbm9uaWNhbF91cmwgPSBcInNhbWVcIjtcbiAgICB9XG5cbiAgICAvLyBmYXN0Y28gZml4IChzaW5jZSB0aGV5IHNvbWV0aW1lcyByZXdyaXRlIHRoZWlyIGNhbm9uaWNhbCB0byBzaW1wbHkgYmUgdGhlaXIgVExELilcbiAgICAvLyBpbiB0aGUgY2FzZSB3aGVyZSBjYW5vbmljYWwgY2xhaW1zIFRMRCBidXQgd2UncmUgYWN0dWFsbHkgb24gYW4gYXJ0aWNsZS4uLiBzZXQgY2Fub25pY2FsIHRvIGJlIHRoZSBwYWdlX3VybFxuICAgIHZhciB0bGQgPSAkLnRyaW0od2luZG93LmxvY2F0aW9uLnByb3RvY29sKycvLycrd2luZG93LmxvY2F0aW9uLmhvc3RuYW1lKycvJykudG9Mb3dlckNhc2UoKTtcbiAgICBpZiAoIGNhbm9uaWNhbF91cmwgPT0gdGxkICkge1xuICAgICAgICBpZiAocGFnZV91cmwgIT0gdGxkKSB7XG4gICAgICAgICAgICBjYW5vbmljYWxfdXJsID0gcGFnZV91cmw7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcmVtb3ZlU3ViZG9tYWluRnJvbVBhZ2VVcmwoJC50cmltKGNhbm9uaWNhbF91cmwpLCBncm91cFNldHRpbmdzKTtcbn1cblxuZnVuY3Rpb24gZ2V0Q3JlYXRlUmVhY3Rpb25VcmwoKSB7XG4gICAgcmV0dXJuICcvYXBpL3RhZy9jcmVhdGUnO1xufVxuXG5mdW5jdGlvbiBjb21wdXRlUGFnZUVsZW1lbnRDYW5vbmljYWxVcmwoJHBhZ2VFbGVtZW50LCBncm91cFNldHRpbmdzKSB7XG4gICAgLy8gVE9ETyBSZXZpZXcgYWdhaW5zdCBlbmdhZ2VfZnVsbC4gVGhlcmUsIHRoZSBuZXN0ZWQgcGFnZXMgYW5kIHRvcC1sZXZlbCBwYWdlIGhhdmUgYSB0b3RhbGx5IGRpZmZlcmVudCBmbG93LiBEb2VzIHRoaXNcbiAgICAvLyB1bmlmaWNhdGlvbiB3b3JrPyBUaGUgaWRlYSBpcyB0aGF0IHRoZSBuZXN0ZWQgcGFnZXMgd291bGQgaGF2ZSBhbiBocmVmIHNlbGVjdG9yIHRoYXQgc3BlY2lmaWVzIHRoZSBVUkwgdG8gdXNlLCBzbyB3ZVxuICAgIC8vIGp1c3QgdXNlIGl0LiBCdXQgY29tcHV0ZSB0aGUgdXJsIGZvciB0aGUgdG9wLWxldmVsIGNhc2UgZXhwbGljaXRseS5cbiAgICBpZiAoJHBhZ2VFbGVtZW50LmZpbmQoZ3JvdXBTZXR0aW5ncy5wYWdlSHJlZlNlbGVjdG9yKCkpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgcmV0dXJuICdzYW1lJztcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gY29tcHV0ZVRvcExldmVsQ2Fub25pY2FsVXJsKGdyb3VwU2V0dGluZ3MpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gY29tcHV0ZVBhZ2VFbGVtZW50VXJsKCRwYWdlRWxlbWVudCwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciB1cmwgPSAkcGFnZUVsZW1lbnQuZmluZChncm91cFNldHRpbmdzLnBhZ2VIcmVmU2VsZWN0b3IoKSkuYXR0cignaHJlZicpO1xuICAgIGlmICghdXJsKSB7XG4gICAgICAgIHVybCA9ICQudHJpbSggd2luZG93LmxvY2F0aW9uLmhyZWYuc3BsaXQoJyMnKVswXSApLnRvTG93ZXJDYXNlKCk7IC8vIHRvcC1sZXZlbCBwYWdlIHVybFxuICAgIH1cbiAgICByZXR1cm4gcmVtb3ZlU3ViZG9tYWluRnJvbVBhZ2VVcmwodXJsLCBncm91cFNldHRpbmdzKTtcbn1cblxuLy8gVE9ETyBjb3BpZWQgZnJvbSBlbmdhZ2VfZnVsbC4gUmV2aWV3LlxuZnVuY3Rpb24gcmVtb3ZlU3ViZG9tYWluRnJvbVBhZ2VVcmwodXJsLCBncm91cFNldHRpbmdzKSB7XG4gICAgLy8gQU5ULmFjdGlvbnMucmVtb3ZlU3ViZG9tYWluRnJvbVBhZ2VVcmw6XG4gICAgLy8gaWYgXCJpZ25vcmVfc3ViZG9tYWluXCIgaXMgY2hlY2tlZCBpbiBzZXR0aW5ncywgQU5EIHRoZXkgc3VwcGx5IGEgVExELFxuICAgIC8vIHRoZW4gbW9kaWZ5IHRoZSBwYWdlIGFuZCBjYW5vbmljYWwgVVJMcyBoZXJlLlxuICAgIC8vIGhhdmUgdG8gaGF2ZSB0aGVtIHN1cHBseSBvbmUgYmVjYXVzZSB0aGVyZSBhcmUgdG9vIG1hbnkgdmFyaWF0aW9ucyB0byByZWxpYWJseSBzdHJpcCBzdWJkb21haW5zICAoLmNvbSwgLmlzLCAuY29tLmFyLCAuY28udWssIGV0YylcbiAgICBpZiAoZ3JvdXBTZXR0aW5ncy51cmwuaWdub3JlU3ViZG9tYWluKCkgPT0gdHJ1ZSAmJiBncm91cFNldHRpbmdzLnVybC5jYW5vbmljYWxEb21haW4oKSkge1xuICAgICAgICB2YXIgSE9TVERPTUFJTiA9IC9bLVxcd10rXFwuKD86Wy1cXHddK1xcLnhuLS1bLVxcd10rfFstXFx3XXsyLH18Wy1cXHddK1xcLlstXFx3XXsyfSkkL2k7XG4gICAgICAgIHZhciBzcmNBcnJheSA9IHVybC5zcGxpdCgnLycpO1xuXG4gICAgICAgIHZhciBwcm90b2NvbCA9IHNyY0FycmF5WzBdO1xuICAgICAgICBzcmNBcnJheS5zcGxpY2UoMCwzKTtcblxuICAgICAgICB2YXIgcmV0dXJuVXJsID0gcHJvdG9jb2wgKyAnLy8nICsgZ3JvdXBTZXR0aW5ncy51cmwuY2Fub25pY2FsRG9tYWluKCkgKyAnLycgKyBzcmNBcnJheS5qb2luKCcvJyk7XG5cbiAgICAgICAgcmV0dXJuIHJldHVyblVybDtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdXJsO1xuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY29tcHV0ZVBhZ2VVcmw6IGNvbXB1dGVQYWdlRWxlbWVudFVybCxcbiAgICBjb21wdXRlQ2Fub25pY2FsVXJsOiBjb21wdXRlUGFnZUVsZW1lbnRDYW5vbmljYWxVcmwsXG4gICAgYW50ZW5uYUhvbWU6IGFudGVubmFIb21lLFxuICAgIGNyZWF0ZVJlYWN0aW9uVXJsOiBnZXRDcmVhdGVSZWFjdGlvblVybFxufTsiLCJcbnZhciBVUkxzID0gcmVxdWlyZSgnLi91cmxzJyk7XG5cbi8vIFJlZ2lzdGVyIG91cnNlbHZlcyB0byBoZWFyIG1lc3NhZ2VzXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcIm1lc3NhZ2VcIiwgcmVjZWl2ZU1lc3NhZ2UsIGZhbHNlKTtcblxudmFyIGNhbGxiYWNrcyA9IHsgJ3hkbSBsb2FkZWQnOiB4ZG1Mb2FkZWQgfTtcbnZhciBjYWNoZSA9IHt9O1xuXG52YXIgaXNYRE1Mb2FkZWQgPSBmYWxzZTtcbi8vIFRoZSBpbml0aWFsIG1lc3NhZ2UgdGhhdCBYRE0gc2VuZHMgb3V0IHdoZW4gaXQgbG9hZHNcbmZ1bmN0aW9uIHhkbUxvYWRlZChkYXRhKSB7XG4gICAgaXNYRE1Mb2FkZWQgPSB0cnVlO1xufVxuXG5mdW5jdGlvbiBnZXRVc2VyKGNhbGxiYWNrKSB7XG4gICAgdmFyIG1lc3NhZ2UgPSAnZ2V0VXNlcic7XG4gICAgcG9zdE1lc3NhZ2UobWVzc2FnZSwgJ3JldHVybmluZ191c2VyJywgdHJ1ZSwgY2FsbGJhY2spO1xufVxuXG5mdW5jdGlvbiByZWNlaXZlTWVzc2FnZShldmVudCkge1xuICAgIHZhciBldmVudE9yaWdpbiA9IGV2ZW50Lm9yaWdpbjtcbiAgICBpZiAoZXZlbnRPcmlnaW4gPT09IFVSTHMuYW50ZW5uYUhvbWUoKSkge1xuICAgICAgICB2YXIgcmVzcG9uc2UgPSBKU09OLnBhcnNlKGV2ZW50LmRhdGEpO1xuICAgICAgICAvLyBUT0RPOiBUaGUgZXZlbnQuc291cmNlIHByb3BlcnR5IGdpdmVzIHVzIHRoZSBzb3VyY2Ugd2luZG93IG9mIHRoZSBtZXNzYWdlIGFuZCBjdXJyZW50bHkgdGhlIFhETSBmcmFtZSBmaXJlcyBvdXRcbiAgICAgICAgLy8gZXZlbnRzIHRoYXQgd2UgcmVjZWl2ZSBiZWZvcmUgd2UgZXZlciB0cnkgdG8gcG9zdCBhbnl0aGluZy4gU28gd2UgKmNvdWxkKiBob2xkIG9udG8gdGhlIHdpbmRvdyBoZXJlIGFuZCB1c2UgaXRcbiAgICAgICAgLy8gZm9yIHBvc3RpbmcgbWVzc2FnZXMgcmF0aGVyIHRoYW4gbG9va2luZyBmb3IgdGhlIFhETSBmcmFtZSBvdXJzZWx2ZXMuIE5lZWQgdG8gbG9vayBhdCB3aGljaCBldmVudHMgdGhlIFhETSBmcmFtZVxuICAgICAgICAvLyBmaXJlcyBvdXQgdG8gYWxsIHdpbmRvd3MgYmVmb3JlIGJlaW5nIGFza2VkLiBDdXJyZW50bHksIGl0J3MgbW9yZSB0aGFuIFwieGRtIGxvYWRlZFwiLiBXaHk/XG4gICAgICAgIC8vdmFyIHNvdXJjZVdpbmRvdyA9IGV2ZW50LnNvdXJjZTtcblxuICAgICAgICB2YXIgY2FsbGJhY2tLZXkgPSByZXNwb25zZS5zdGF0dXM7IC8vIFRPRE86IGNoYW5nZSB0aGUgbmFtZSBvZiB0aGlzIHByb3BlcnR5IGluIHhkbS5odG1sXG4gICAgICAgIGNhY2hlW2NhbGxiYWNrS2V5XSA9IHJlc3BvbnNlO1xuICAgICAgICB2YXIgY2FsbGJhY2sgPSBjYWxsYmFja3NbY2FsbGJhY2tLZXldO1xuICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKHJlc3BvbnNlKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gcG9zdE1lc3NhZ2UobWVzc2FnZSwgY2FsbGJhY2tLZXksIGFjY2VwdF9jYWNoZWQsIGNhbGxiYWNrKSB7XG5cbiAgICB2YXIgdGFyZ2V0T3JpZ2luID0gVVJMcy5hbnRlbm5hSG9tZSgpO1xuICAgIGNhbGxiYWNrc1tjYWxsYmFja0tleV0gPSBjYWxsYmFjaztcblxuICAgIGlmIChpc1hETUxvYWRlZCkge1xuICAgICAgICBpZiAoYWNjZXB0X2NhY2hlZCAmJiBjYWNoZVtjYWxsYmFja0tleV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY2FsbGJhY2soY2FjaGVbY2FsbGJhY2tLZXldKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciB4ZG1GcmFtZSA9IGdldFhETUZyYW1lKCk7XG4gICAgICAgICAgICBpZiAoeGRtRnJhbWUpIHtcbiAgICAgICAgICAgICAgICB4ZG1GcmFtZS5wb3N0TWVzc2FnZShtZXNzYWdlLCB0YXJnZXRPcmlnaW4pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBnZXRYRE1GcmFtZSgpIHtcbiAgICAvLyBUT0RPOiBJcyB0aGlzIGEgc2VjdXJpdHkgcHJvYmxlbT8gV2hhdCBwcmV2ZW50cyBzb21lb25lIGZyb20gdXNpbmcgdGhpcyBzYW1lIG5hbWUgYW5kIGludGVyY2VwdGluZyBvdXIgbWVzc2FnZXM/XG4gICAgcmV0dXJuIHdpbmRvdy5mcmFtZXNbJ2FudC14ZG0taGlkZGVuJ107XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGdldFVzZXI6IGdldFVzZXJcbn07IiwiXG52YXIgVVJMcyA9IHJlcXVpcmUoJy4vdXJscycpO1xuXG5mdW5jdGlvbiBjcmVhdGVYRE1mcmFtZShncm91cElkKSB7XG4gICAgLy9BTlQuc2Vzc2lvbi5yZWNlaXZlTWVzc2FnZSh7fSwgZnVuY3Rpb24oKSB7XG4gICAgLy8gICAgQU5ULnV0aWwudXNlckxvZ2luU3RhdGUoKTtcbiAgICAvL30pO1xuXG5cbiAgICB2YXIgaWZyYW1lVXJsID0gVVJMcy5hbnRlbm5hSG9tZSgpICsgXCIvc3RhdGljL3dpZGdldC1uZXcveGRtL3hkbS5odG1sXCIsXG4gICAgcGFyZW50VXJsID0gd2luZG93LmxvY2F0aW9uLmhyZWYsXG4gICAgcGFyZW50SG9zdCA9IHdpbmRvdy5sb2NhdGlvbi5wcm90b2NvbCArIFwiLy9cIiArIHdpbmRvdy5sb2NhdGlvbi5ob3N0LFxuICAgIC8vIFRPRE86IFJlc3RvcmUgdGhlIGJvb2ttYXJrbGV0IGF0dHJpYnV0ZSBvbiB0aGUgaUZyYW1lP1xuICAgIC8vYm9va21hcmtsZXQgPSAoIEFOVC5lbmdhZ2VTY3JpcHRQYXJhbXMuYm9va21hcmtsZXQgKSA/IFwiYm9va21hcmtsZXQ9dHJ1ZVwiOlwiXCIsXG4gICAgYm9va21hcmtsZXQgPSBcIlwiLFxuICAgIC8vIFRPRE86IFJlc3RvcmUgdGhlIGdyb3VwTmFtZSBhdHRyaWJ1dGUuIChXaGF0IGlzIGl0IGZvcj8pXG4gICAgJHhkbUlmcmFtZSA9ICQoJzxpZnJhbWUgaWQ9XCJhbnQteGRtLWhpZGRlblwiIG5hbWU9XCJhbnQteGRtLWhpZGRlblwiIHNyYz1cIicgKyBpZnJhbWVVcmwgKyAnP3BhcmVudFVybD0nICsgcGFyZW50VXJsICsgJyZwYXJlbnRIb3N0PScgKyBwYXJlbnRIb3N0ICsgJyZncm91cF9pZD0nK2dyb3VwSWQrJ1wiIHdpZHRoPVwiMVwiIGhlaWdodD1cIjFcIiBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlO3RvcDotMTAwMHB4O2xlZnQ6LTEwMDBweDtcIiAvPicpO1xuICAgIC8vJHhkbUlmcmFtZSA9ICQoJzxpZnJhbWUgaWQ9XCJhbnQteGRtLWhpZGRlblwiIG5hbWU9XCJhbnQteGRtLWhpZGRlblwiIHNyYz1cIicgKyBpZnJhbWVVcmwgKyAnP3BhcmVudFVybD0nICsgcGFyZW50VXJsICsgJyZwYXJlbnRIb3N0PScgKyBwYXJlbnRIb3N0ICsgJyZncm91cF9pZD0nK2dyb3VwSWQrJyZncm91cF9uYW1lPScrZW5jb2RlVVJJQ29tcG9uZW50KGdyb3VwTmFtZSkrJyYnK2Jvb2ttYXJrbGV0KydcIiB3aWR0aD1cIjFcIiBoZWlnaHQ9XCIxXCIgc3R5bGU9XCJwb3NpdGlvbjphYnNvbHV0ZTt0b3A6LTEwMDBweDtsZWZ0Oi0xMDAwcHg7XCIgLz4nKTtcbiAgICAkKGdldFdpZGdldEJ1Y2tldCgpKS5hcHBlbmQoICR4ZG1JZnJhbWUgKTtcbn1cblxuLy8gVE9ETyByZWZhY3RvciB0aGlzIHdpdGggdGhlIGNvcHkgb2YgaXQgaW4gc3VtbWFyeS13aWRnZXRcbmZ1bmN0aW9uIGdldFdpZGdldEJ1Y2tldCgpIHtcbiAgICB2YXIgYnVja2V0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2FudGVubmEtd2lkZ2V0LWJ1Y2tldCcpO1xuICAgIGlmICghYnVja2V0KSB7XG4gICAgICAgIGJ1Y2tldCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBidWNrZXQuc2V0QXR0cmlidXRlKCdpZCcsICdhbnRlbm5hLXdpZGdldC1idWNrZXQnKTtcbiAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChidWNrZXQpO1xuICAgIH1cbiAgICByZXR1cm4gYnVja2V0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGVYRE1mcmFtZTogY3JlYXRlWERNZnJhbWVcbn07IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEgYW50ZW5uYS1yZWFjdGlvbnMtd2lkZ2V0XCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWhlYWRlclwifSxcImZcIjpbXX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1ib2R5XCJ9LFwiZlwiOlt7XCJ0XCI6NCxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcInZcIjp7XCJjbGlja1wiOlwicGx1c29uZVwifSxcImFcIjp7XCJjbGFzc1wiOltcImFudGVubmEtcmVhY3Rpb24gXCIse1widFwiOjIsXCJ4XCI6e1wiclwiOltcImxheW91dENsYXNzXCIsXCJpbmRleFwiLFwiLi9jb3VudFwiXSxcInNcIjpcIl8wKF8xLF8yKVwifX1dfSxcImZcIjpbXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1yZWFjdGlvbi10ZXh0XCJ9LFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcIi4vdGV4dFwifV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcmVhY3Rpb24tY291bnRcIn0sXCJmXCI6W3tcInRcIjoyLFwiclwiOlwiLi9jb3VudFwifV19XX1dLFwiblwiOjUyLFwiaVwiOlwiaW5kZXhcIixcInJcIjpcInJlYWN0aW9uc1wifV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtZm9vdGVyXCJ9LFwiZlwiOltdfV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYSBhbnQtc3VtbWFyeS13aWRnZXRcIixcImFudC1oYXNoXCI6W3tcInRcIjoyLFwiclwiOlwicGFnZUhhc2hcIn1dfSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJhXCIsXCJhXCI6e1wiaHJlZlwiOlwiaHR0cDovL3d3dy5hbnRlbm5hLmlzXCIsXCJ0YXJnZXRcIjpcIl9ibGFua1wifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudC1hbnRlbm5hLWxvZ29cIn19XX0sXCIgXCIse1widFwiOjQsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXN1bW1hcnktdGV4dFwifSxcImZcIjpbe1widFwiOjQsXCJmXCI6W3tcInRcIjoyLFwiclwiOlwic3VtbWFyeS50b3RhbFJlYWN0aW9uc1wifV0sXCJuXCI6NTAsXCJyXCI6XCJzdW1tYXJ5LnRvdGFsUmVhY3Rpb25zXCJ9LFwiIFJlYWN0aW9uc1wiXX1dLFwiblwiOjUwLFwieFwiOntcInJcIjpbXCJzdW1tYXJ5LnRvdGFsUmVhY3Rpb25zXCJdLFwic1wiOlwiXzAhPT11bmRlZmluZWRcIn19XX1dfSJdfQ==
