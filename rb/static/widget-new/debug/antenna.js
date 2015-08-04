(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/Users/jburns/antenna/rb/static/widget-new/src/js/antenna.js":[function(require,module,exports){

var ScriptLoader = require('./script-loader');
var CssLoader = require('./css-loader');
var GroupSettingsLoader = require('./group-settings-loader');
var PageDataLoader = require('./page-data-loader');
var PageScanner = require('./page-scanner');
var XDMLoader = require('./utils/xdm-loader');


// Step 1 - kick off the asynchronous loading of the Javascript and CSS we need.
ScriptLoader.load(loadGroupSettings);
CssLoader.load();

function loadGroupSettings() {
    // Step 2 - Once we have the settings, we can kick off a couple things in parallel:
    //
    // -- create the hidden iframe we use for cross-domain cookies (primarily user login)
    // -- start fetching the page data
    // -- start hashing the page and inserting the affordances (in the empty state)
    //
    // As the page is scanned, the widgets are created and bound to the page data that comes in.
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
    PageDataLoader.load(groupSettings);
}

function scanPage(groupSettings) {
    PageScanner.scan(groupSettings);
}
},{"./css-loader":"/Users/jburns/antenna/rb/static/widget-new/src/js/css-loader.js","./group-settings-loader":"/Users/jburns/antenna/rb/static/widget-new/src/js/group-settings-loader.js","./page-data-loader":"/Users/jburns/antenna/rb/static/widget-new/src/js/page-data-loader.js","./page-scanner":"/Users/jburns/antenna/rb/static/widget-new/src/js/page-scanner.js","./script-loader":"/Users/jburns/antenna/rb/static/widget-new/src/js/script-loader.js","./utils/xdm-loader":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/xdm-loader.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/css-loader.js":[function(require,module,exports){

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

    function backgroundColor(accessor) {
        return function() {
            var colors = [];
            var value = accessor();
            if (value) {
                colors = value.split(';');
                colors = migrateValues(colors);
            }
            return colors;

            // Migrate any colors from the '1, 2, 3' format to 'rgb(1, 2, 3)'. This code can be deleted once we've updated
            // all sites to specifying valid CSS color values
            function migrateValues(colorValues) {
                var migrationMatcher = /^\s*\d+\s*,\s*\d+\s*,\s*\d+\s*$/gim;
                for (var i = 0; i < colorValues.length; i++) {
                    var value = colorValues[i];
                    if (migrationMatcher.test(value)) {
                        colorValues[i] = 'rgb(' + value + ')';
                    }
                }
                return colorValues;
            }
        }
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
        textSelector: data('anno_whitelist'),
        reactionBackgroundColors: backgroundColor(data('tag_box_bg_colors'))
    }
}

//noinspection JSUnresolvedVariable
module.exports = {
    create: createFromJSON
};
},{"./script-loader":"/Users/jburns/antenna/rb/static/widget-new/src/js/script-loader.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/indicator-widget.js":[function(require,module,exports){

var $; require('./script-loader').on$(function(jQuery) { $=jQuery; });


function createIndicatorWidget(container, containerData) {
    // TODO: Basically everything.
    // Actually get container data.
    // Adjust visibility based on whether there are reactions on the content (honoring the flag about how many to show at once).
    // Show the reaction widget on hover.
    // etc.
    var ractive = Ractive({
        el: container,
        magic: true,
        data: {
            containerData: containerData
        },
        template: require('../templates/indicator-widget.html')
    });
}


module.exports = {
    create: createIndicatorWidget
};
},{"../templates/indicator-widget.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/indicator-widget.html","./script-loader":"/Users/jburns/antenna/rb/static/widget-new/src/js/script-loader.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/page-data-loader.js":[function(require,module,exports){

var $; require('./script-loader').on$(function(jQuery) { $=jQuery; });
var URLs = require('./utils/urls');
var PageData = require('./page-data');


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

function loadPageData(groupSettings) {
    var pagesParam = computePagesParam(groupSettings);
    $.getJSONP('/api/page', { pages: pagesParam }, success, error);

    function success(json) {
        PageData.updateAllPageData(json, groupSettings, function(updatedPages) {
            // TODO revisit this. we probably don't want to go out and aggressively load all data for all pages
            for (var i = 0; i < updatedPages.length; i++) {
                loadContainerData(updatedPages[i]);
            }
        });
    }

    function error(message) {
        // TODO handle errors that happen when loading page data
    }
}

function loadContainerData(pageData) {
    var containers = pageData.containers;
    // TODO consider optimizing the data storage so we don't have to iterate like this
    var hashes = [];
    for (var hash in containers) {
        if (containers.hasOwnProperty(hash)) {
            hashes.push(hash);
        }
    }
    var data = {
        short_name: '', // TODO
        pageID: pageData.pageId,
        hashes: hashes,
        crossPageHashes: [] // TODO
    };
    $.getJSONP('/api/summary/containers', data, success, error);

    function success(json) {
        PageData.updateAllContainerData(json, pageData);
    }

    function error(message) {
        // TODO handle errors that happen when loading container data
    }
}

//noinspection JSUnresolvedVariable
module.exports = {
    load: loadPageData
};
},{"./page-data":"/Users/jburns/antenna/rb/static/widget-new/src/js/page-data.js","./script-loader":"/Users/jburns/antenna/rb/static/widget-new/src/js/script-loader.js","./utils/urls":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/urls.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/page-data.js":[function(require,module,exports){

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
            summary: {},
            containers: {}
        };
        pages[hash] = pageData;
    }
    return pageData;
}

function updateAllPageData(jsonPages, groupSettings, callback) {
    var allPages = [];
    for (var i = 0; i < jsonPages.length; i++) {
        allPages.push(updatePageData(jsonPages[i], groupSettings));
    }
    callback(allPages);
}

function updatePageData(json, groupSettings) {
    var pageHash = json.urlhash;
    var pageData = getPageData(pageHash);

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

    var containerEntries = json.containers;
    if (containerEntries) {
        // Note that the set of hashes that comes back includes a pair with a key of "page".
        // TODO: Should we keep the entry in the data model with "page" as the key or use the value of urlhash instead?
        for (var i = 0; i < containerEntries.length; i++) {
            var containerEntry = containerEntries.length;
            var containerData = getContainerData(pageData, containerEntry.hash);
            containerData.id = containerEntry.id;
        }
    }

    // TODO Consider supporting incremental update of data that we already have from the server. That would mean only
    // updating fields in the local object if they exist in the json data.
    pageData.groupId = groupSettings.groupId();
    pageData.pageId = json.id;
    pageData.urlHash = json.urlhash;
    pageData.summary = {
        totalReactions: numReactions,
        totalComments: numComments,
        totalShares: numShares
    };
    pageData.topReactions = topReactions;
    // pageData.containers is initialized by above loop

    return pageData;
}

function getContainerData(pageData, containerHash) {
    var containerData = pageData.containers[containerHash];
    if (!containerData) {
        containerData = {
            hash: containerHash
        };
        pageData.containers[containerHash] = containerData;
    }
    return containerData;
}

function updateAllContainerData(json, pageData, groupSettings) {
    var containerData = json.known;
    for (var hash in containerData) {
        if (containerData.hasOwnProperty(hash)) {
            updateContainerData(hash, containerData[hash], pageData, groupSettings);
        }
    }
    //json.unknown; TODO: anything to do with this data?
}

function updateContainerData(containerHash, jsonData, pageData, groupSettings) {
    var containerData = getContainerData(pageData, containerHash);

    var topReactions = [];
    var reactionsData = jsonData.top_interactions.tags; // TODO top_interactions.coms?
    for (var id in reactionsData) {
        if (reactionsData.hasOwnProperty(id)) {
            var reaction = reactionsData[id];
            topReactions.push({
                id: id,
                count: reaction.count,
                text: reaction.body,
                parentId: reaction.parent_id
            });
        }
    }

    containerData.commentCount =  jsonData.counts.coms;
    containerData.reactionCount = jsonData.counts.interactions; // TODO: what is containerData.counts.tags?
    containerData.id = jsonData.id;
    containerData.kind = jsonData.kind;
    containerData.topReactions = topReactions;
}

//noinspection JSUnresolvedVariable
module.exports = {
    getPageData: getPageData,
    updateAllPageData: updateAllPageData,
    getContainerData: getContainerData,
    updateAllContainerData: updateAllContainerData
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
var Hash = require('./utils/hash');
var URLs = require('./utils/urls');
var SummaryWidget = require('./summary-widget');
var IndicatorWidget = require('./indicator-widget');
var PageData = require('./page-data');


// Scan for all pages at the current browser location. This could just be the current page or it could be a collection
// of pages (aka 'posts').
function scanAllPages(groupSettings) {
    var $pages = $(groupSettings.pageSelector());
    if ($pages.length == 0) {
        // If we don't detect any page markers, treat the whole document as the single page
        $pages = $('body'); // TODO Is this the right behavior?
    }
    $pages.each(function() {
        var $page = $(this);
        scanPage($page, groupSettings);
    });
}

// Scan the page using the given settings:
// 1. Find all the containers that we care about.
// 2. Compute hashes for each container.
// 3. Insert widget affordances for each which are bound to the data model by the hashes.
function scanPage($page, groupSettings) {
    var url = URLs.computePageUrl($page, groupSettings);
    var urlHash = Hash.hashUrl(url);
    var pageData = PageData.getPageData(urlHash);

    // First, scan for elements that would cause us to insert something into the DOM that takes up space.
    // We want to get any page resizing out of the way as early as possible.
    // TODO: Consider doing this with raw Javascript before jQuery loads, to further reduce the delay. We wouldn't
    // save a *ton* of time from this, though, so it's definitely a later optimization.
    scanForSummaries($page, pageData, groupSettings);
    scanForCallsToAction($page, groupSettings);

    var $activeSections = $page.find(groupSettings.activeSections());
    $activeSections.each(function() {
        var $section = $(this);
        // Then scan for everything else
        scanForText($section, pageData, groupSettings);
        scanForImages($section, groupSettings);
        scanForMedia($section, groupSettings);
    });
}

function scanForSummaries($element, pageData, groupSettings) {
    var $summaries = $element.find(groupSettings.summarySelector());
    $summaries.each(function() {
        var $summary = $(this);
        var container = $('<div class="ant-summary-container"></div>');
        SummaryWidget.create(container, pageData, groupSettings);
        insertContent($summary, container, groupSettings.summaryMethod());
    });
}

function scanForCallsToAction($section, groupSettings) {
    // TODO
}

function scanForText($section, pageData, groupSettings) {
    var $textElements = $section.find(groupSettings.textSelector());
    // TODO: only select "leaf" elements
    $textElements.each(function() {
        var $element = $(this);
        // TODO position correctly
        // TODO hash and add hash data to indicator
        var hash = Hash.hashText($element);
        var container = $('<div class="ant-indicator-container" style="display:inline-block;"></div>'); // TODO
        PageData.getContainerData(pageData, hash);
        var containerData = {}; // TODO get this from a central data store (probably PageData)
        var indicator = IndicatorWidget.create(container, containerData);
        $element.append(container); // TODO is this configurable ala insertContent(...)?
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
},{"./indicator-widget":"/Users/jburns/antenna/rb/static/widget-new/src/js/indicator-widget.js","./page-data":"/Users/jburns/antenna/rb/static/widget-new/src/js/page-data.js","./script-loader":"/Users/jburns/antenna/rb/static/widget-new/src/js/script-loader.js","./summary-widget":"/Users/jburns/antenna/rb/static/widget-new/src/js/summary-widget.js","./utils/hash":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/hash.js","./utils/urls":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/urls.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/reactions-widget.js":[function(require,module,exports){

var $; require('./script-loader').on$(function(jQuery) { $=jQuery; });
var XDMClient = require('./utils/xdm-client');
var URLs = require('./utils/urls');
var Moveable = require('./utils/moveable');

function createReactionsWidget(container, pageData, groupSettings) {
    var reactionsData = pageData.topReactions;
    var colors = groupSettings.reactionBackgroundColors();
    var layoutData = computeLayoutData(reactionsData, colors);
    var ractive = Ractive({
        el: container,
        magic: true,
        data: {
            reactions: reactionsData,
            response: {},
            layoutClass: function(index) {
                return layoutData.layoutClasses[index];
            },
            backgroundColor: function(index) {
                return layoutData.backgroundColors[index];
            }
        },
        template: require('../templates/reactions-widget.html'),
        decorators: {
            sizetofit: sizeToFit
        }
    });
    ractive.on('complete', function() {
        var $rootElement = $(rootElement(ractive));
        Moveable.makeMoveable($rootElement, $rootElement.find('.antenna-header'));
    });
    ractive.on('change', function() {
        layoutData = computeLayoutData(reactionsData, colors);
    });
    ractive.on('update', function() {
        console.log('update!');
    });
    ractive.on('plusone', plusOne(pageData, ractive));
    return {
        open: openWindow(ractive)
    };
}

function sizeToFit(node) {
    var $element = $(node);
    var $rootElement = $element.closest('.antenna-reactions-widget');
    if ($rootElement.length > 0) {
        $rootElement.css({display: 'block', left: '100%'});

        var $parent = $element.closest('.antenna-reaction-box');
        var ratio = $parent.outerWidth() / node.scrollWidth;
        if (ratio < 1.0) {
            // If the text doesn't fit, first try to wrap it to two lines. Then scale it down if still necessary.
            var text = node.innerHTML;
            // Look for the closest space to the middle, weighted slightly (Math.ceil) toward a space in the second half.
            var mid = Math.ceil(text.length / 2);
            var secondHalfIndex = text.indexOf(' ', mid);
            var firstHalfIndex = text.lastIndexOf(' ', mid);
            var splitIndex = Math.abs(secondHalfIndex - mid) < Math.abs(mid - firstHalfIndex) ? secondHalfIndex : firstHalfIndex;
            if (splitIndex > 1) {
                node.innerHTML = text.slice(0, splitIndex) + '<br>' + text.slice(splitIndex);
                ratio = $parent.outerWidth() / node.scrollWidth;
            }
            if (ratio < 1.0) {
                var minSize = 10;
                var newSize = Math.max(minSize, Math.floor(parseInt($element.css('font-size')) * ratio) - 1);
                $element.css('font-size', newSize);
            }
        }

        $rootElement.css({display: '', left: ''});
    }
    return {
        teardown: function() {}
    };
}

function plusOne(pageData, ractive) {
    return function(event) {
        // Optimistically update our local data store and the UI. Then send the request to the server.
        var reactionData = event.context;
        reactionData.count = reactionData.count + 1;
        // TODO: check back on this as the way to propogate data changes back to the summary
        pageData.summary.totalReactions = pageData.summary.totalReactions + 1;

        XDMClient.getUser(function(response) {
            var userInfo = response.data;
            postPlusOne(reactionData, userInfo, pageData, ractive);
        });
    };
}

function postPlusOne(reactionData, userInfo, pageData, ractive) {
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
        user_id: userInfo.user_id,
        ant_token: userInfo.ant_token,
        page_id: pageData.pageId,
        group_id: pageData.groupId,
        container_kind: 'text', // TODO: why is this 'text' for a page reaction?
        content_node: '',
        content_node_data: {
            body: '',
            kind: 'page',
            item_type: 'page'
        }
    };
    var success = function(json) {
        var response = { // TODO: just capturing the api format...
            existing: json.existing,
            interaction: {
                id: json.interaction.id,
                interaction_node: {
                    body: json.interaction.interaction_node.body,
                    id: json.interaction.interaction_node.id
                }
            }
        };
        //if (json.existing) {
        //    handleDuplicateReaction(reactionData);
        //} else {
        //    handleNewReaction(reactionData);
        //}
        // TODO: We can either access this data through the ractive keypath or by passing the data object around. Pick one.
        ractive.set('response.existing', response.existing);
        showReactionResult(ractive);
        console.log('success!');
    };
    var error = function(message) {
        console.error("Error posting reaction: " + message);
    };
    $.getJSONP(URLs.createReactionUrl(), data, success, error);
}

function computeLayoutData(reactionsData, colors) {
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
    var numHalfsies = 0;
    for (var i = 0; i < numReactions; i++) {
        if (reactionsData[i].count > midValue) {
            layoutClasses[i] = 'full';
        } else {
            layoutClasses[i] = 'half';
            numHalfsies++;
        }
    }
    if (numHalfsies % 2 !==0) {
        layoutClasses[numReactions - 1] = 'full'; // If there are an odd number, the last one goes full.
    }

    var numColors = colors.length;
    var backgroundColors = [];
    var colorIndex = 0;
    var pairWithNext = 0;
    for (var i = 0; i < numReactions; i++) {
        backgroundColors[i] = colors[colorIndex%numColors];
        if (layoutClasses[i] === 'full') {
            colorIndex++;
        } else {
            // TODO gotta be able to make this simpler
            if (pairWithNext > 0) {
                pairWithNext--;
                if (pairWithNext == 0) {
                    colorIndex++;
                }
            } else {
                pairWithNext = 1; // If we want to allow N boxes per row, this number would become conditional.
            }
        }
    }

    return {
        layoutClasses: layoutClasses,
        backgroundColors: backgroundColors
    };
}

function rootElement(ractive) {
    // TODO: gotta be a better way to get this
    return ractive.find('div');
}

function showReactionResult(ractive) {
    var $root = $(rootElement(ractive));
    // TODO: This is probably where a Ractive partial comes in. Need a nested template here for showing the result.
    $root.find('.antenna-confirm-page').animate({ left: 0 });
    $root.animate({ width: 300 }, { delay: 100 });
    setTimeout(function() {
        showReactions(ractive, true);
    }, 1000);
}

function showReactions(ractive, animate) {
    var $root = $(rootElement(ractive));
    if (animate) {
        $root.find('.antenna-confirm-page').animate({ left: '100%' });
        $root.animate({ width: 200 });
    } else {
        $root.find('.antenna-confirm-page').css({ left: '100%' });
        $root.css({ width: 200 });
    }
}

function openWindow(ractive) {
    return function(relativeElement) {
        var $relativeElement = $(relativeElement);
        var offset = $relativeElement.offset();
        var coords = {
            top: offset.top + 5,//$relativeElement.height(),
            left: offset.left + 5
        };
        var $rootElement = $(rootElement(ractive));
        $rootElement.stop(true, true).addClass('open').css(coords);

        setupWindowClose(ractive);
    };
}

function setupWindowClose(ractive) {
    var $rootElement = $(rootElement(ractive));

    $rootElement
        .on('mouseout.antenna', delayedCloseWindow())
        .on('mouseover.antenna', keepWindowOpen)
        .on('focusin.antenna', function() {
            // Once the window has focus, don't close it on mouseout.
            keepWindowOpen();
            $rootElement.off('mouseout.antenna');
            $rootElement.off('mouseover.antenna');
        })
        .on('focusout.antenna', function() {
            closeWindow();
        });

    var closeTimer;

    function delayedCloseWindow() {
        return function() {
            closeTimer = setTimeout(function() {
                closeTimer = null;
                closeWindow();
            }, 500);
        };
    }

    function keepWindowOpen() {
        clearTimeout(closeTimer);
    }

    function closeWindow() {
        clearTimeout(closeTimer);

        $rootElement.stop(true, true).fadeOut('fast', function() {
            $rootElement.css('display', ''); // Clear the display:none that fadeOut puts on the element
            $rootElement.removeClass('open');

            $rootElement.off('.antenna'); // Unbind all of the handlers in our namespace
        });
    }
}

module.exports = {
    create: createReactionsWidget
};
},{"../templates/reactions-widget.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/reactions-widget.html","./script-loader":"/Users/jburns/antenna/rb/static/widget-new/src/js/script-loader.js","./utils/moveable":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/moveable.js","./utils/urls":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/urls.js","./utils/xdm-client":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/xdm-client.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/script-loader.js":[function(require,module,exports){

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
                // Note: The server comes back with 200 responses with a nested status of "fail"...
                if (textStatus === 'success' && response.status !== 'fail') {
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

var $; require('./script-loader').on$(function(jQuery) { $=jQuery; });
var ReactionsWidget = require('./reactions-widget');

function createSummaryWidget(container, pageData, groupSettings) {
    //// TODO replace element
    var ractive = Ractive({
        el: container,
        data: pageData,
        magic: true,
        template: require('../templates/summary-widget.html')
    });
    ractive.on('complete', function() {
        $(rootElement(ractive)).on('mouseenter', function(event) {
           openReactionsWindow(pageData, groupSettings, ractive);
        });
    });
}

function rootElement(ractive) {
    // TODO: gotta be a better way to get this
    // TODO: our click handler is getting called twice, so it looks like this somehow gets the wrong element if there are two summary widgets together?
    return ractive.find('div');
}

function openReactionsWindow(pageData, groupSettings, ractive) {
    if (!ractive.reactionsWidget) {
        // TODO: consider prepopulating this
        var bucket = getWidgetBucket();
        var container = document.createElement('div');
        bucket.appendChild(container);
        ractive.reactionsWidget = ReactionsWidget.create(container, pageData, groupSettings);
    }
    ractive.reactionsWidget.open(rootElement(ractive));
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
},{"../templates/summary-widget.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/summary-widget.html","./reactions-widget":"/Users/jburns/antenna/rb/static/widget-new/src/js/reactions-widget.js","./script-loader":"/Users/jburns/antenna/rb/static/widget-new/src/js/script-loader.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/hash.js":[function(require,module,exports){

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
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/moveable.js":[function(require,module,exports){

var $; require('../script-loader').on$(function(jQuery) { $=jQuery; });

function makeMoveable($element, $dragHandle) {
    $dragHandle.on('mousedown.antenna', function(event) {
        var offsetX = event.pageX - $dragHandle.offset().left;
        var offsetY = event.pageY - $dragHandle.offset().top;
        $(document).on('mouseup.antenna', function(event) {
            $(document).off('mousemove.antenna');
        });
        $(document).on('mousemove.antenna', function(event) {
            $element.css({
                top: event.pageY - offsetY,
                left: event.pageX - offsetX
            });
        });
    });
}

module.exports = {
    makeMoveable: makeMoveable
};
},{"../script-loader":"/Users/jburns/antenna/rb/static/widget-new/src/js/script-loader.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/offline.js":[function(require,module,exports){

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
    postMessage(message, 'returning_user', callback, validCacheEntry);

    function validCacheEntry(response) {
        var userInfo = response.data;
        return userInfo && userInfo.ant_token && userInfo.user_id; // TODO && userInfo.user_type?
    }
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

function postMessage(message, callbackKey, callback, validCacheEntry) {

    var targetOrigin = URLs.antennaHome();
    callbacks[callbackKey] = callback;

    if (isXDMLoaded) {
        var cachedResponse = cache[callbackKey];
        if (cachedResponse !== undefined && validCacheEntry && validCacheEntry(cache[callbackKey])) {
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
},{"./urls":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/urls.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/templates/indicator-widget.html":[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"span","a":{"class":"antenna-indicator-widget"},"f":[{"t":7,"e":"span","a":{"class":"ant-antenna-logo"}}," ",{"t":4,"f":[{"t":7,"e":"span","f":[{"t":2,"r":"containerData.count"}]}],"r":"containerData"}]}]}
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/templates/reactions-widget.html":[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna antenna-reactions-widget","tabindex":"0"},"f":[{"t":7,"e":"div","a":{"class":"antenna-header"},"f":[{"t":7,"e":"span","a":{"class":"ant-antenna-logo"}}," Reactions"]}," ",{"t":7,"e":"div","a":{"class":"antenna-body"},"f":[{"t":7,"e":"div","a":{"class":"antenna-reactions-page"},"f":[{"t":4,"f":[{"t":7,"e":"div","v":{"click":"plusone"},"a":{"class":["antenna-reaction ",{"t":2,"x":{"r":["layoutClass","index","./count"],"s":"_0(_1,_2)"}}],"style":["background-color:",{"t":2,"x":{"r":["backgroundColor","index"],"s":"_0(_1)"}}]},"f":[" ",{"t":7,"e":"div","a":{"class":"antenna-reaction-box"},"f":[{"t":7,"e":"div","a":{"class":"antenna-reaction-text"},"o":"sizetofit","f":[{"t":2,"r":"./text"}]}," ",{"t":7,"e":"div","a":{"class":"antenna-reaction-count"},"f":[{"t":2,"r":"./count"}]}]}]}],"i":"index","r":"reactions"}]}," ",{"t":7,"e":"div","a":{"class":"antenna-confirm-page"},"f":[{"t":4,"f":["Looks like you still feel the same way."],"n":50,"r":"response.existing"},{"t":4,"n":51,"f":["New reaction received."],"r":"response.existing"}]}]}," ",{"t":7,"e":"div","a":{"class":"antenna-footer"},"f":["What do you think?"]}]}]}
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/templates/summary-widget.html":[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna ant-summary-widget","ant-hash":[{"t":2,"r":"pageHash"}]},"f":[{"t":7,"e":"a","a":{"href":"http://www.antenna.is","target":"_blank"},"f":[{"t":7,"e":"span","a":{"class":"ant-antenna-logo"}}]}," ",{"t":4,"f":[{"t":7,"e":"span","a":{"class":"antenna-summary-text"},"f":[{"t":4,"f":[{"t":2,"r":"summary.totalReactions"}],"n":50,"r":"summary.totalReactions"}," Reactions"]}],"n":50,"x":{"r":["summary.totalReactions"],"s":"_0!==undefined"}}]}]}
},{}]},{},["/Users/jburns/antenna/rb/static/widget-new/src/js/antenna.js","/Users/jburns/antenna/rb/static/widget-new/src/js/css-loader.js","/Users/jburns/antenna/rb/static/widget-new/src/js/group-settings-loader.js","/Users/jburns/antenna/rb/static/widget-new/src/js/group-settings.js","/Users/jburns/antenna/rb/static/widget-new/src/js/indicator-widget.js","/Users/jburns/antenna/rb/static/widget-new/src/js/page-data-loader.js","/Users/jburns/antenna/rb/static/widget-new/src/js/page-data.js","/Users/jburns/antenna/rb/static/widget-new/src/js/page-reactions-loader.js","/Users/jburns/antenna/rb/static/widget-new/src/js/page-scanner.js","/Users/jburns/antenna/rb/static/widget-new/src/js/reactions-widget.js","/Users/jburns/antenna/rb/static/widget-new/src/js/script-loader.js","/Users/jburns/antenna/rb/static/widget-new/src/js/summary-widget.js","/Users/jburns/antenna/rb/static/widget-new/src/templates/indicator-widget.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/reactions-widget.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/summary-widget.html"])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi93aWRnZXQtbmV3L3NyYy9qcy9hbnRlbm5hLmpzIiwiLi4vd2lkZ2V0LW5ldy9zcmMvanMvY3NzLWxvYWRlci5qcyIsIi4uL3dpZGdldC1uZXcvc3JjL2pzL2dyb3VwLXNldHRpbmdzLWxvYWRlci5qcyIsIi4uL3dpZGdldC1uZXcvc3JjL2pzL2dyb3VwLXNldHRpbmdzLmpzIiwiLi4vd2lkZ2V0LW5ldy9zcmMvanMvaW5kaWNhdG9yLXdpZGdldC5qcyIsIi4uL3dpZGdldC1uZXcvc3JjL2pzL3BhZ2UtZGF0YS1sb2FkZXIuanMiLCIuLi93aWRnZXQtbmV3L3NyYy9qcy9wYWdlLWRhdGEuanMiLCIuLi93aWRnZXQtbmV3L3NyYy9qcy9wYWdlLXJlYWN0aW9ucy1sb2FkZXIuanMiLCIuLi93aWRnZXQtbmV3L3NyYy9qcy9wYWdlLXNjYW5uZXIuanMiLCIuLi93aWRnZXQtbmV3L3NyYy9qcy9yZWFjdGlvbnMtd2lkZ2V0LmpzIiwiLi4vd2lkZ2V0LW5ldy9zcmMvanMvc2NyaXB0LWxvYWRlci5qcyIsIi4uL3dpZGdldC1uZXcvc3JjL2pzL3N1bW1hcnktd2lkZ2V0LmpzIiwiLi4vd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvaGFzaC5qcyIsIi4uL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL21kNS5qcyIsIi4uL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL21vdmVhYmxlLmpzIiwiLi4vd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvb2ZmbGluZS5qcyIsIi4uL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL3VybHMuanMiLCIuLi93aWRnZXQtbmV3L3NyYy9qcy91dGlscy94ZG0tY2xpZW50LmpzIiwiLi4vd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMveGRtLWxvYWRlci5qcyIsIi4uL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9pbmRpY2F0b3Itd2lkZ2V0Lmh0bWwiLCIuLi93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvcmVhY3Rpb25zLXdpZGdldC5odG1sIiwiLi4vd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL3N1bW1hcnktd2lkZ2V0Lmh0bWwiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBOztBQ0FBOztBQ0FBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIlxudmFyIFNjcmlwdExvYWRlciA9IHJlcXVpcmUoJy4vc2NyaXB0LWxvYWRlcicpO1xudmFyIENzc0xvYWRlciA9IHJlcXVpcmUoJy4vY3NzLWxvYWRlcicpO1xudmFyIEdyb3VwU2V0dGluZ3NMb2FkZXIgPSByZXF1aXJlKCcuL2dyb3VwLXNldHRpbmdzLWxvYWRlcicpO1xudmFyIFBhZ2VEYXRhTG9hZGVyID0gcmVxdWlyZSgnLi9wYWdlLWRhdGEtbG9hZGVyJyk7XG52YXIgUGFnZVNjYW5uZXIgPSByZXF1aXJlKCcuL3BhZ2Utc2Nhbm5lcicpO1xudmFyIFhETUxvYWRlciA9IHJlcXVpcmUoJy4vdXRpbHMveGRtLWxvYWRlcicpO1xuXG5cbi8vIFN0ZXAgMSAtIGtpY2sgb2ZmIHRoZSBhc3luY2hyb25vdXMgbG9hZGluZyBvZiB0aGUgSmF2YXNjcmlwdCBhbmQgQ1NTIHdlIG5lZWQuXG5TY3JpcHRMb2FkZXIubG9hZChsb2FkR3JvdXBTZXR0aW5ncyk7XG5Dc3NMb2FkZXIubG9hZCgpO1xuXG5mdW5jdGlvbiBsb2FkR3JvdXBTZXR0aW5ncygpIHtcbiAgICAvLyBTdGVwIDIgLSBPbmNlIHdlIGhhdmUgdGhlIHNldHRpbmdzLCB3ZSBjYW4ga2ljayBvZmYgYSBjb3VwbGUgdGhpbmdzIGluIHBhcmFsbGVsOlxuICAgIC8vXG4gICAgLy8gLS0gY3JlYXRlIHRoZSBoaWRkZW4gaWZyYW1lIHdlIHVzZSBmb3IgY3Jvc3MtZG9tYWluIGNvb2tpZXMgKHByaW1hcmlseSB1c2VyIGxvZ2luKVxuICAgIC8vIC0tIHN0YXJ0IGZldGNoaW5nIHRoZSBwYWdlIGRhdGFcbiAgICAvLyAtLSBzdGFydCBoYXNoaW5nIHRoZSBwYWdlIGFuZCBpbnNlcnRpbmcgdGhlIGFmZm9yZGFuY2VzIChpbiB0aGUgZW1wdHkgc3RhdGUpXG4gICAgLy9cbiAgICAvLyBBcyB0aGUgcGFnZSBpcyBzY2FubmVkLCB0aGUgd2lkZ2V0cyBhcmUgY3JlYXRlZCBhbmQgYm91bmQgdG8gdGhlIHBhZ2UgZGF0YSB0aGF0IGNvbWVzIGluLlxuICAgIEdyb3VwU2V0dGluZ3NMb2FkZXIubG9hZChmdW5jdGlvbihncm91cFNldHRpbmdzKSB7XG4gICAgICAgIGluaXRYZG1GcmFtZShncm91cFNldHRpbmdzKTtcbiAgICAgICAgZmV0Y2hQYWdlRGF0YShncm91cFNldHRpbmdzKTtcbiAgICAgICAgc2NhblBhZ2UoZ3JvdXBTZXR0aW5ncyk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGluaXRYZG1GcmFtZShncm91cFNldHRpbmdzKSB7XG4gICAgWERNTG9hZGVyLmNyZWF0ZVhETWZyYW1lKGdyb3VwU2V0dGluZ3MuZ3JvdXBJZCk7XG59XG5cbmZ1bmN0aW9uIGZldGNoUGFnZURhdGEoZ3JvdXBTZXR0aW5ncykge1xuICAgIFBhZ2VEYXRhTG9hZGVyLmxvYWQoZ3JvdXBTZXR0aW5ncyk7XG59XG5cbmZ1bmN0aW9uIHNjYW5QYWdlKGdyb3VwU2V0dGluZ3MpIHtcbiAgICBQYWdlU2Nhbm5lci5zY2FuKGdyb3VwU2V0dGluZ3MpO1xufSIsIlxudmFyIGJhc2VVcmwgPSAnaHR0cDovL2xvY2FsaG9zdDo4MDgxJzsgLy8gVE9ETyBjb21wdXRlIHRoaXNcblxuZnVuY3Rpb24gbG9hZENzcygpIHtcbiAgICB2YXIgaGVhZCA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF07XG4gICAgaWYgKGhlYWQpIHtcbiAgICAgICAgLy8gVG8gbWFrZSBzdXJlIG5vbmUgb2Ygb3VyIGNvbnRlbnQgcmVuZGVycyBvbiB0aGUgcGFnZSBiZWZvcmUgb3VyIENTUyBpcyBsb2FkZWQsIHdlIGFwcGVuZCBhIHNpbXBsZSBpbmxpbmUgc3R5bGVcbiAgICAgICAgLy8gZWxlbWVudCB0aGF0IHR1cm5zIG9mZiBvdXIgZWxlbWVudHMgKmJlZm9yZSogb3VyIENTUyBsaW5rcy4gVGhpcyBleHBsb2l0cyB0aGUgY2FzY2FkZSBydWxlcyAtIG91ciBDU1MgZmlsZXMgYXBwZWFyXG4gICAgICAgIC8vIGFmdGVyIHRoZSBpbmxpbmUgc3R5bGUgaW4gdGhlIGRvY3VtZW50LCBzbyB0aGV5IHRha2UgcHJlY2VkZW5jZSAoYW5kIG1ha2UgZXZlcnl0aGluZyBhcHBlYXIpIG9uY2UgdGhleSdyZSBsb2FkZWQuXG4gICAgICAgIHZhciBzdHlsZVRhZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XG4gICAgICAgIHN0eWxlVGFnLmlubmVySFRNTCA9ICcuYW50ZW5uYXtkaXNwbGF5Om5vbmU7fSc7XG4gICAgICAgIGhlYWQuYXBwZW5kQ2hpbGQoc3R5bGVUYWcpO1xuXG4gICAgICAgIHZhciBjc3NIcmVmcyA9IFtcbiAgICAgICAgICAgIC8vIFRPRE8gYnJpbmdpbmcgaW4gbXVsdGlwbGUgY3NzIGZpbGVzIGJyZWFrcyB0aGUgd2F5IHdlIHdhaXQgdW50aWwgb3VyIENTUyBpcyBsb2FkZWQgYmVmb3JlIHNob3dpbmcgb3VyIGNvbnRlbnQuXG4gICAgICAgICAgICAvLyAgICAgIHdlIG5lZWQgdG8gZmluZCBhIHdheSB0byBicmluZyB0aGF0IGJhY2suIG9uZSBzaW1wbGUgd2F5IC0gYWxzbyBjb21waWxlIHRoZSBhbnRlbm5hLWZvbnQuY3NzIGludG8gdGhlIGFudGVubmEuY3NzIGZpbGUuXG4gICAgICAgICAgICAvLyAgICAgIG9wZW4gcXVlc3Rpb24gLSBob3cgZG9lcyBpdCBhbGwgcGxheSB3aXRoIGZvbnQgaWNvbnMgdGhhdCBhcmUgZG93bmxvYWRlZCBhcyB5ZXQgYW5vdGhlciBmaWxlP1xuICAgICAgICAgICAgYmFzZVVybCArICcvc3RhdGljL2Nzcy9hbnRlbm5hLWZvbnQvYW50ZW5uYS1mb250LmNzcycsXG4gICAgICAgICAgICBiYXNlVXJsICsgJy9zdGF0aWMvd2lkZ2V0LW5ldy9kZWJ1Zy9hbnRlbm5hLmNzcycgLy8gVE9ETyB0aGlzIG5lZWRzIGEgZmluYWwgcGF0aC4gQ0ROIGZvciBwcm9kdWN0aW9uIGFuZCBsb2NhbCBmaWxlIGZvciBkZXZlbG9wbWVudD9cbiAgICAgICAgXTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjc3NIcmVmcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgbG9hZEZpbGUoY3NzSHJlZnNbaV0sIGhlYWQpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBsb2FkRmlsZShocmVmLCBoZWFkKSB7XG4gICAgdmFyIGxpbmtUYWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaW5rJyk7XG4gICAgbGlua1RhZy5zZXRBdHRyaWJ1dGUoJ2hyZWYnLCBocmVmKTtcbiAgICBsaW5rVGFnLnNldEF0dHJpYnV0ZSgncmVsJywgJ3N0eWxlc2hlZXQnKTtcbiAgICBsaW5rVGFnLnNldEF0dHJpYnV0ZSgndHlwZScsICd0ZXh0L2NzcycpO1xuICAgIGhlYWQuYXBwZW5kQ2hpbGQobGlua1RhZyk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGxvYWQgOiBsb2FkQ3NzXG59OyIsIlxudmFyIEdyb3VwU2V0dGluZ3MgPSByZXF1aXJlKCcuL2dyb3VwLXNldHRpbmdzJyk7XG52YXIgJDsgcmVxdWlyZSgnLi9zY3JpcHQtbG9hZGVyJykub24kKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG5cbi8vIFRPRE8gZm9sZCB0aGlzIG1vZHVsZSBpbnRvIGdyb3VwLXNldHRpbmdzP1xuXG5mdW5jdGlvbiBsb2FkU2V0dGluZ3MoY2FsbGJhY2spIHtcbiAgICAkLmdldEpTT05QKCcvYXBpL3NldHRpbmdzJywgeyBob3N0X25hbWU6IHdpbmRvdy5hbnRlbm5hX2hvc3QgfSwgc3VjY2VzcywgZXJyb3IpO1xuXG4gICAgZnVuY3Rpb24gc3VjY2Vzcyhqc29uKSB7XG4gICAgICAgIHZhciBncm91cFNldHRpbmdzID0gR3JvdXBTZXR0aW5ncy5jcmVhdGUoanNvbik7XG4gICAgICAgIGNhbGxiYWNrKGdyb3VwU2V0dGluZ3MpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGVycm9yKG1lc3NhZ2UpIHtcbiAgICAgICAgLy8gVE9ETyBoYW5kbGUgZXJyb3JzIHRoYXQgaGFwcGVuIHdoZW4gbG9hZGluZyBjb25maWcgZGF0YVxuICAgIH1cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGxvYWQ6IGxvYWRTZXR0aW5nc1xufTsiLCJcbnZhciAkO1xucmVxdWlyZSgnLi9zY3JpcHQtbG9hZGVyJykub24kKGZ1bmN0aW9uKGpRdWVyeSkge1xuICAgICQ9alF1ZXJ5O1xufSk7XG5cbi8vIFRPRE86IHRyaW0gdHJhaWxpbmcgY29tbWFzIGZyb20gYW55IHNlbGVjdG9yIHZhbHVlc1xuXG4vLyBUT0RPOiBSZXZpZXcuIFRoZXNlIGFyZSBqdXN0IGNvcGllZCBmcm9tIGVuZ2FnZV9mdWxsLlxudmFyIGRlZmF1bHRzID0ge1xuICAgIHByZW1pdW06IGZhbHNlLFxuICAgIGltZ19zZWxlY3RvcjogXCJpbWdcIixcbiAgICBpbWdfY29udGFpbmVyX3NlbGVjdG9yczpcIiNwcmltYXJ5LXBob3RvXCIsXG4gICAgYWN0aXZlX3NlY3Rpb25zOiBcImJvZHlcIixcbiAgICBhbm5vX3doaXRlbGlzdDogXCJib2R5IHBcIixcbiAgICBhY3RpdmVfc2VjdGlvbnNfd2l0aF9hbm5vX3doaXRlbGlzdDpcIlwiLFxuICAgIG1lZGlhX3NlbGVjdG9yOiBcImVtYmVkLCB2aWRlbywgb2JqZWN0LCBpZnJhbWVcIixcbiAgICBjb21tZW50X2xlbmd0aDogNTAwLFxuICAgIG5vX2FudDogXCJcIixcbiAgICBpbWdfYmxhY2tsaXN0OiBcIlwiLFxuICAgIGN1c3RvbV9jc3M6IFwiXCIsXG4gICAgLy90b2RvOiB0ZW1wIGlubGluZV9pbmRpY2F0b3IgZGVmYXVsdHMgdG8gbWFrZSB0aGVtIHNob3cgdXAgb24gYWxsIG1lZGlhIC0gcmVtb3ZlIHRoaXMgbGF0ZXIuXG4gICAgaW5saW5lX3NlbGVjdG9yOiAnaW1nLCBlbWJlZCwgdmlkZW8sIG9iamVjdCwgaWZyYW1lJyxcbiAgICBwYXJhZ3JhcGhfaGVscGVyOiB0cnVlLFxuICAgIG1lZGlhX3VybF9pZ25vcmVfcXVlcnk6IHRydWUsXG4gICAgc3VtbWFyeV93aWRnZXRfc2VsZWN0b3I6ICcuYW50LXBhZ2Utc3VtbWFyeScsIC8vIFRPRE86IHRoaXMgd2Fzbid0IGRlZmluZWQgYXMgYSBkZWZhdWx0IGluIGVuZ2FnZV9mdWxsLCBidXQgd2FzIGluIGNvZGUuIHdoeT9cbiAgICBzdW1tYXJ5X3dpZGdldF9tZXRob2Q6ICdhZnRlcicsXG4gICAgbGFuZ3VhZ2U6ICdlbicsXG4gICAgYWJfdGVzdF9pbXBhY3Q6IHRydWUsXG4gICAgYWJfdGVzdF9zYW1wbGVfcGVyY2VudGFnZTogMTAsXG4gICAgaW1nX2luZGljYXRvcl9zaG93X29ubG9hZDogdHJ1ZSxcbiAgICBpbWdfaW5kaWNhdG9yX3Nob3dfc2lkZTogJ2xlZnQnLFxuICAgIHRhZ19ib3hfYmdfY29sb3JzOiAnIzE4NDE0YzsjMzc2MDc2OzIxNSwgMTc5LCA2OTsjZTY4ODVjOyNlNDYxNTYnLFxuICAgIHRhZ19ib3hfdGV4dF9jb2xvcnM6ICcjZmZmOyNmZmY7I2ZmZjsjZmZmOyNmZmYnLFxuICAgIHRhZ19ib3hfZm9udF9mYW1pbHk6ICdIZWx2ZXRpY2FOZXVlLEhlbHZldGljYSxBcmlhbCxzYW5zLXNlcmlmJyxcbiAgICB0YWdzX2JnX2NzczogJycsXG4gICAgaWdub3JlX3N1YmRvbWFpbjogZmFsc2UsXG4gICAgLy90aGUgc2NvcGUgaW4gd2hpY2ggdG8gZmluZCBwYXJlbnRzIG9mIDxicj4gdGFncy5cbiAgICAvL1Rob3NlIHBhcmVudHMgd2lsbCBiZSBjb252ZXJ0ZWQgdG8gYSA8cnQ+IGJsb2NrLCBzbyB0aGVyZSB3b24ndCBiZSBuZXN0ZWQgPHA+IGJsb2Nrcy5cbiAgICAvL3RoZW4gaXQgd2lsbCBzcGxpdCB0aGUgcGFyZW50J3MgaHRtbCBvbiA8YnI+IHRhZ3MgYW5kIHdyYXAgdGhlIHNlY3Rpb25zIGluIDxwPiB0YWdzLlxuXG4gICAgLy9leGFtcGxlOlxuICAgIC8vIGJyX3JlcGxhY2Vfc2NvcGVfc2VsZWN0b3I6IFwiLmFudF9icl9yZXBsYWNlXCIgLy9lLmcuIFwiI21haW5zZWN0aW9uXCIgb3IgXCJwXCJcblxuICAgIGJyX3JlcGxhY2Vfc2NvcGVfc2VsZWN0b3I6IG51bGwgLy9lLmcuIFwiI21haW5zZWN0aW9uXCIgb3IgXCJwXCJcbn07XG5cbmZ1bmN0aW9uIGNyZWF0ZUZyb21KU09OKGpzb24pIHtcblxuICAgIGZ1bmN0aW9uIGRhdGEoa2V5KSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IHdpbmRvdy5hbnRlbm5hX2V4dGVuZFtrZXldO1xuICAgICAgICAgICAgaWYgKHZhbHVlID09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHZhbHVlID0ganNvbltrZXldO1xuICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlID09PSAnJykgeyAvLyBUT0RPOiBTaG91bGQgdGhlIHNlcnZlciBiZSBzZW5kaW5nIGJhY2sgJycgaGVyZSBvciBub3RoaW5nIGF0IGFsbD8gKEl0IHByZWNsdWRlcyB0aGUgc2VydmVyIGZyb20gcmVhbGx5IHNheWluZyAnbm90aGluZycpXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gZGVmYXVsdHNba2V5XTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYmFja2dyb3VuZENvbG9yKGFjY2Vzc29yKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBjb2xvcnMgPSBbXTtcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IGFjY2Vzc29yKCk7XG4gICAgICAgICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICBjb2xvcnMgPSB2YWx1ZS5zcGxpdCgnOycpO1xuICAgICAgICAgICAgICAgIGNvbG9ycyA9IG1pZ3JhdGVWYWx1ZXMoY29sb3JzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBjb2xvcnM7XG5cbiAgICAgICAgICAgIC8vIE1pZ3JhdGUgYW55IGNvbG9ycyBmcm9tIHRoZSAnMSwgMiwgMycgZm9ybWF0IHRvICdyZ2IoMSwgMiwgMyknLiBUaGlzIGNvZGUgY2FuIGJlIGRlbGV0ZWQgb25jZSB3ZSd2ZSB1cGRhdGVkXG4gICAgICAgICAgICAvLyBhbGwgc2l0ZXMgdG8gc3BlY2lmeWluZyB2YWxpZCBDU1MgY29sb3IgdmFsdWVzXG4gICAgICAgICAgICBmdW5jdGlvbiBtaWdyYXRlVmFsdWVzKGNvbG9yVmFsdWVzKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1pZ3JhdGlvbk1hdGNoZXIgPSAvXlxccypcXGQrXFxzKixcXHMqXFxkK1xccyosXFxzKlxcZCtcXHMqJC9naW07XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb2xvclZhbHVlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgdmFsdWUgPSBjb2xvclZhbHVlc1tpXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG1pZ3JhdGlvbk1hdGNoZXIudGVzdCh2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yVmFsdWVzW2ldID0gJ3JnYignICsgdmFsdWUgKyAnKSc7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbG9yVmFsdWVzO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgZ3JvdXBJZDogZGF0YSgnaWQnKSxcbiAgICAgICAgYWN0aXZlU2VjdGlvbnM6IGRhdGEoJ2FjdGl2ZV9zZWN0aW9ucycpLFxuICAgICAgICB1cmw6IHtcbiAgICAgICAgICAgIGlnbm9yZVN1YmRvbWFpbjogZGF0YSgnaWdub3JlX3N1YmRvbWFpbicpLFxuICAgICAgICAgICAgY2Fub25pY2FsRG9tYWluOiBkYXRhKCdwYWdlX3RsZCcpIC8vIFRPRE86IHdoYXQgdG8gY2FsbCB0aGlzIGV4YWN0bHkuIGdyb3VwRG9tYWluPyBzaXRlRG9tYWluPyBjYW5vbmljYWxEb21haW4/XG4gICAgICAgIH0sXG4gICAgICAgIHN1bW1hcnlTZWxlY3RvcjogZGF0YSgnc3VtbWFyeV93aWRnZXRfc2VsZWN0b3InKSxcbiAgICAgICAgc3VtbWFyeU1ldGhvZDogZGF0YSgnc3VtbWFyeV93aWRnZXRfbWV0aG9kJyksXG4gICAgICAgIHBhZ2VTZWxlY3RvcjogZGF0YSgncG9zdF9zZWxlY3RvcicpLFxuICAgICAgICBwYWdlSHJlZlNlbGVjdG9yOiBkYXRhKCdwb3N0X2hyZWZfc2VsZWN0b3InKSxcbiAgICAgICAgdGV4dFNlbGVjdG9yOiBkYXRhKCdhbm5vX3doaXRlbGlzdCcpLFxuICAgICAgICByZWFjdGlvbkJhY2tncm91bmRDb2xvcnM6IGJhY2tncm91bmRDb2xvcihkYXRhKCd0YWdfYm94X2JnX2NvbG9ycycpKVxuICAgIH1cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZTogY3JlYXRlRnJvbUpTT05cbn07IiwiXG52YXIgJDsgcmVxdWlyZSgnLi9zY3JpcHQtbG9hZGVyJykub24kKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG5cblxuZnVuY3Rpb24gY3JlYXRlSW5kaWNhdG9yV2lkZ2V0KGNvbnRhaW5lciwgY29udGFpbmVyRGF0YSkge1xuICAgIC8vIFRPRE86IEJhc2ljYWxseSBldmVyeXRoaW5nLlxuICAgIC8vIEFjdHVhbGx5IGdldCBjb250YWluZXIgZGF0YS5cbiAgICAvLyBBZGp1c3QgdmlzaWJpbGl0eSBiYXNlZCBvbiB3aGV0aGVyIHRoZXJlIGFyZSByZWFjdGlvbnMgb24gdGhlIGNvbnRlbnQgKGhvbm9yaW5nIHRoZSBmbGFnIGFib3V0IGhvdyBtYW55IHRvIHNob3cgYXQgb25jZSkuXG4gICAgLy8gU2hvdyB0aGUgcmVhY3Rpb24gd2lkZ2V0IG9uIGhvdmVyLlxuICAgIC8vIGV0Yy5cbiAgICB2YXIgcmFjdGl2ZSA9IFJhY3RpdmUoe1xuICAgICAgICBlbDogY29udGFpbmVyLFxuICAgICAgICBtYWdpYzogdHJ1ZSxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgY29udGFpbmVyRGF0YTogY29udGFpbmVyRGF0YVxuICAgICAgICB9LFxuICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL2luZGljYXRvci13aWRnZXQuaHRtbCcpXG4gICAgfSk7XG59XG5cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlOiBjcmVhdGVJbmRpY2F0b3JXaWRnZXRcbn07IiwiXG52YXIgJDsgcmVxdWlyZSgnLi9zY3JpcHQtbG9hZGVyJykub24kKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgVVJMcyA9IHJlcXVpcmUoJy4vdXRpbHMvdXJscycpO1xudmFyIFBhZ2VEYXRhID0gcmVxdWlyZSgnLi9wYWdlLWRhdGEnKTtcblxuXG5mdW5jdGlvbiBjb21wdXRlUGFnZVRpdGxlKCkge1xuICAgIC8vIFRPRE86IEhvdyBhcmUgcGFnZSB0aXRsZXMgY29tcHV0ZWQgd2l0aCBtdWx0aXBsZSBwYWdlcz8gVGhlIGNvZGUgYmVsb3cgY29tcHV0ZXMgdGhlIHRpdGxlIGZvciBhIHRvcC1sZXZlbCBwYWdlLlxuICAgIHZhciB0aXRsZSA9ICQoJ21ldGFbcHJvcGVydHk9XCJvZzp0aXRsZVwiXScpLmF0dHIoJ2NvbnRlbnQnKTtcbiAgICBpZiAoIXRpdGxlKSB7XG4gICAgICAgIHRpdGxlID0gJCgndGl0bGUnKS50ZXh0KCkgfHwgJyc7XG4gICAgfVxuICAgIHJldHVybiAkLnRyaW0odGl0bGUpO1xufVxuXG5cbi8vIENvbXB1dGUgdGhlIHBhZ2VzIHRoYXQgd2UgbmVlZCB0byBmZXRjaC4gVGhpcyBpcyBlaXRoZXI6XG4vLyAxLiBBbnkgbmVzdGVkIHBhZ2VzIHdlIGZpbmQgdXNpbmcgdGhlIHBhZ2Ugc2VsZWN0b3IgT1Jcbi8vIDIuIFRoZSBjdXJyZW50IHdpbmRvdyBsb2NhdGlvblxuZnVuY3Rpb24gY29tcHV0ZVBhZ2VzUGFyYW0oZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBwYWdlcyA9IFtdO1xuXG4gICAgdmFyIGdyb3VwSWQgPSBncm91cFNldHRpbmdzLmdyb3VwSWQoKTtcbiAgICB2YXIgJHBhZ2VFbGVtZW50cyA9ICQoZ3JvdXBTZXR0aW5ncy5wYWdlU2VsZWN0b3IoKSk7XG4gICAgLy8gVE9ETzogQ29tcGFyZSB0aGlzIGV4ZWN1dGlvbiBmbG93IHRvIHdoYXQgaGFwcGVucyBpbiBlbmdhZ2VfZnVsbC5qcy4gSGVyZSB3ZSB0cmVhdCB0aGUgYm9keSBlbGVtZW50IGFzIGEgcGFnZSBzb1xuICAgIC8vIHRoZSBmbG93IGlzIHRoZSBzYW1lIGZvciBib3RoIGNhc2VzLiBJcyB0aGVyZSBhIHJlYXNvbiBlbmdhZ2VfZnVsbC5qcyBicmFuY2hlcyBoZXJlIGluc3RlYWQgYW5kIHRyZWF0cyB0aGVzZSBzbyBkaWZmZXJlbnRseT9cbiAgICBpZiAoJHBhZ2VFbGVtZW50cy5sZW5ndGggPT0gMCkge1xuICAgICAgICAkcGFnZUVsZW1lbnRzID0gJCgnYm9keScpO1xuICAgIH1cbiAgICAkcGFnZUVsZW1lbnRzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkcGFnZUVsZW1lbnQgPSAkKHRoaXMpO1xuICAgICAgICBwYWdlcy5wdXNoKHtcbiAgICAgICAgICAgIGdyb3VwX2lkOiBncm91cElkLFxuICAgICAgICAgICAgdXJsOiBVUkxzLmNvbXB1dGVQYWdlVXJsKCRwYWdlRWxlbWVudCwgZ3JvdXBTZXR0aW5ncyksXG4gICAgICAgICAgICBjYW5vbmljYWxfdXJsOiBVUkxzLmNvbXB1dGVDYW5vbmljYWxVcmwoJHBhZ2VFbGVtZW50LCBncm91cFNldHRpbmdzKSxcbiAgICAgICAgICAgIGltYWdlOiAnJywgLy8gVE9ET1xuICAgICAgICAgICAgdGl0bGU6IGNvbXB1dGVQYWdlVGl0bGUoKSAvLyBUT0RPOiBUaGlzIGNvZGUgb25seSB3b3JrcyBmb3IgdGhlIHRvcC1sZXZlbCBwYWdlLiBTZWUgY29tcHV0ZVBhZ2VUaXRsZSgpXG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHBhZ2VzO1xufVxuXG5mdW5jdGlvbiBsb2FkUGFnZURhdGEoZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBwYWdlc1BhcmFtID0gY29tcHV0ZVBhZ2VzUGFyYW0oZ3JvdXBTZXR0aW5ncyk7XG4gICAgJC5nZXRKU09OUCgnL2FwaS9wYWdlJywgeyBwYWdlczogcGFnZXNQYXJhbSB9LCBzdWNjZXNzLCBlcnJvcik7XG5cbiAgICBmdW5jdGlvbiBzdWNjZXNzKGpzb24pIHtcbiAgICAgICAgUGFnZURhdGEudXBkYXRlQWxsUGFnZURhdGEoanNvbiwgZ3JvdXBTZXR0aW5ncywgZnVuY3Rpb24odXBkYXRlZFBhZ2VzKSB7XG4gICAgICAgICAgICAvLyBUT0RPIHJldmlzaXQgdGhpcy4gd2UgcHJvYmFibHkgZG9uJ3Qgd2FudCB0byBnbyBvdXQgYW5kIGFnZ3Jlc3NpdmVseSBsb2FkIGFsbCBkYXRhIGZvciBhbGwgcGFnZXNcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdXBkYXRlZFBhZ2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgbG9hZENvbnRhaW5lckRhdGEodXBkYXRlZFBhZ2VzW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZXJyb3IobWVzc2FnZSkge1xuICAgICAgICAvLyBUT0RPIGhhbmRsZSBlcnJvcnMgdGhhdCBoYXBwZW4gd2hlbiBsb2FkaW5nIHBhZ2UgZGF0YVxuICAgIH1cbn1cblxuZnVuY3Rpb24gbG9hZENvbnRhaW5lckRhdGEocGFnZURhdGEpIHtcbiAgICB2YXIgY29udGFpbmVycyA9IHBhZ2VEYXRhLmNvbnRhaW5lcnM7XG4gICAgLy8gVE9ETyBjb25zaWRlciBvcHRpbWl6aW5nIHRoZSBkYXRhIHN0b3JhZ2Ugc28gd2UgZG9uJ3QgaGF2ZSB0byBpdGVyYXRlIGxpa2UgdGhpc1xuICAgIHZhciBoYXNoZXMgPSBbXTtcbiAgICBmb3IgKHZhciBoYXNoIGluIGNvbnRhaW5lcnMpIHtcbiAgICAgICAgaWYgKGNvbnRhaW5lcnMuaGFzT3duUHJvcGVydHkoaGFzaCkpIHtcbiAgICAgICAgICAgIGhhc2hlcy5wdXNoKGhhc2gpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHZhciBkYXRhID0ge1xuICAgICAgICBzaG9ydF9uYW1lOiAnJywgLy8gVE9ET1xuICAgICAgICBwYWdlSUQ6IHBhZ2VEYXRhLnBhZ2VJZCxcbiAgICAgICAgaGFzaGVzOiBoYXNoZXMsXG4gICAgICAgIGNyb3NzUGFnZUhhc2hlczogW10gLy8gVE9ET1xuICAgIH07XG4gICAgJC5nZXRKU09OUCgnL2FwaS9zdW1tYXJ5L2NvbnRhaW5lcnMnLCBkYXRhLCBzdWNjZXNzLCBlcnJvcik7XG5cbiAgICBmdW5jdGlvbiBzdWNjZXNzKGpzb24pIHtcbiAgICAgICAgUGFnZURhdGEudXBkYXRlQWxsQ29udGFpbmVyRGF0YShqc29uLCBwYWdlRGF0YSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZXJyb3IobWVzc2FnZSkge1xuICAgICAgICAvLyBUT0RPIGhhbmRsZSBlcnJvcnMgdGhhdCBoYXBwZW4gd2hlbiBsb2FkaW5nIGNvbnRhaW5lciBkYXRhXG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgbG9hZDogbG9hZFBhZ2VEYXRhXG59OyIsIlxudmFyICQ7IHJlcXVpcmUoJy4vc2NyaXB0LWxvYWRlcicpLm9uJChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xuXG52YXIgcGFnZXMgPSB7fTtcblxuZnVuY3Rpb24gZ2V0UGFnZURhdGEoaGFzaCkge1xuICAgIHZhciBwYWdlRGF0YSA9IHBhZ2VzW2hhc2hdO1xuICAgIGlmICghcGFnZURhdGEpIHtcbiAgICAgICAgLy8gVE9ETzogR2l2ZSB0aGlzIHNlcmlvdXMgdGhvdWdodC4gSW4gb3JkZXIgZm9yIG1hZ2ljIG1vZGUgdG8gd29yaywgdGhlIG9iamVjdCBuZWVkcyB0byBoYXZlIHZhbHVlcyBpbiBwbGFjZSBmb3JcbiAgICAgICAgLy8gdGhlIG9ic2VydmVkIHByb3BlcnRpZXMgYXQgdGhlIG1vbWVudCB0aGUgcmFjdGl2ZSBpcyBjcmVhdGVkLiBCdXQgdGhpcyBpcyBwcmV0dHkgdW51c3VhbCBmb3IgSmF2YXNjcmlwdCwgdG8gaGF2ZVxuICAgICAgICAvLyB0byBkZWZpbmUgdGhlIHdob2xlIHNrZWxldG9uIGZvciB0aGUgb2JqZWN0IGluc3RlYWQgb2YganVzdCBhZGRpbmcgcHJvcGVydGllcyB3aGVuZXZlciB5b3Ugd2FudC5cbiAgICAgICAgLy8gVGhlIGFsdGVybmF0aXZlIHdvdWxkIGJlIGZvciB1cyB0byBrZWVwIG91ciBvd24gXCJkYXRhIGJpbmRpbmdcIiBiZXR3ZWVuIHRoZSBwYWdlRGF0YSBhbmQgcmFjdGl2ZSBpbnN0YW5jZXMgKDEgdG8gbWFueSlcbiAgICAgICAgLy8gYW5kIHRlbGwgdGhlIHJhY3RpdmVzIHRvIHVwZGF0ZSB3aGVuZXZlciB0aGUgZGF0YSBjaGFuZ2VzLlxuICAgICAgICBwYWdlRGF0YSA9IHtcbiAgICAgICAgICAgIHBhZ2VIYXNoOiBoYXNoLFxuICAgICAgICAgICAgc3VtbWFyeToge30sXG4gICAgICAgICAgICBjb250YWluZXJzOiB7fVxuICAgICAgICB9O1xuICAgICAgICBwYWdlc1toYXNoXSA9IHBhZ2VEYXRhO1xuICAgIH1cbiAgICByZXR1cm4gcGFnZURhdGE7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZUFsbFBhZ2VEYXRhKGpzb25QYWdlcywgZ3JvdXBTZXR0aW5ncywgY2FsbGJhY2spIHtcbiAgICB2YXIgYWxsUGFnZXMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGpzb25QYWdlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBhbGxQYWdlcy5wdXNoKHVwZGF0ZVBhZ2VEYXRhKGpzb25QYWdlc1tpXSwgZ3JvdXBTZXR0aW5ncykpO1xuICAgIH1cbiAgICBjYWxsYmFjayhhbGxQYWdlcyk7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZVBhZ2VEYXRhKGpzb24sIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgcGFnZUhhc2ggPSBqc29uLnVybGhhc2g7XG4gICAgdmFyIHBhZ2VEYXRhID0gZ2V0UGFnZURhdGEocGFnZUhhc2gpO1xuXG4gICAgdmFyIG51bVJlYWN0aW9ucyA9IDA7XG4gICAgdmFyIG51bUNvbW1lbnRzID0gMDtcbiAgICB2YXIgbnVtU2hhcmVzID0gMDtcblxuICAgIHZhciBzdW1tYXJ5RW50cmllcyA9IGpzb24uc3VtbWFyeTtcbiAgICBpZiAoc3VtbWFyeUVudHJpZXMpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdW1tYXJ5RW50cmllcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIHN1bW1hcnlFbnRyeSA9IHN1bW1hcnlFbnRyaWVzW2ldO1xuICAgICAgICAgICAgaWYgKHN1bW1hcnlFbnRyeS5raW5kID09PSAndGFnJykge1xuICAgICAgICAgICAgICAgIG51bVJlYWN0aW9ucyA9IHN1bW1hcnlFbnRyeS5jb3VudDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc3VtbWFyeUVudHJ5LmtpbmQgPT09ICdjb20nKSB7XG4gICAgICAgICAgICAgICAgbnVtQ29tbWVudHMgPSBzdW1tYXJ5RW50cnkuY291bnQ7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHN1bW1hcnlFbnRyeS5raW5kID09PSAnc2hyJykge1xuICAgICAgICAgICAgICAgIG51bVNoYXJlcyA9IHN1bW1hcnlFbnRyeS5jb3VudDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHZhciB0b3BSZWFjdGlvbnMgPSBbXTtcbiAgICB2YXIgcmVhY3Rpb25zRGF0YSA9IGpzb24udG9wdGFncztcbiAgICBpZiAocmVhY3Rpb25zRGF0YSkge1xuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHJlYWN0aW9uc0RhdGEubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIHZhciByZWFjdGlvbiA9IHJlYWN0aW9uc0RhdGFbal07XG4gICAgICAgICAgICB0b3BSZWFjdGlvbnNbal0gPSB7XG4gICAgICAgICAgICAgICAgaWQ6IHJlYWN0aW9uLmlkLFxuICAgICAgICAgICAgICAgIGNvdW50OiByZWFjdGlvbi50YWdfY291bnQsXG4gICAgICAgICAgICAgICAgdGV4dDogcmVhY3Rpb24uYm9keVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgdmFyIGNvbnRhaW5lckVudHJpZXMgPSBqc29uLmNvbnRhaW5lcnM7XG4gICAgaWYgKGNvbnRhaW5lckVudHJpZXMpIHtcbiAgICAgICAgLy8gTm90ZSB0aGF0IHRoZSBzZXQgb2YgaGFzaGVzIHRoYXQgY29tZXMgYmFjayBpbmNsdWRlcyBhIHBhaXIgd2l0aCBhIGtleSBvZiBcInBhZ2VcIi5cbiAgICAgICAgLy8gVE9ETzogU2hvdWxkIHdlIGtlZXAgdGhlIGVudHJ5IGluIHRoZSBkYXRhIG1vZGVsIHdpdGggXCJwYWdlXCIgYXMgdGhlIGtleSBvciB1c2UgdGhlIHZhbHVlIG9mIHVybGhhc2ggaW5zdGVhZD9cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb250YWluZXJFbnRyaWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgY29udGFpbmVyRW50cnkgPSBjb250YWluZXJFbnRyaWVzLmxlbmd0aDtcbiAgICAgICAgICAgIHZhciBjb250YWluZXJEYXRhID0gZ2V0Q29udGFpbmVyRGF0YShwYWdlRGF0YSwgY29udGFpbmVyRW50cnkuaGFzaCk7XG4gICAgICAgICAgICBjb250YWluZXJEYXRhLmlkID0gY29udGFpbmVyRW50cnkuaWQ7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBUT0RPIENvbnNpZGVyIHN1cHBvcnRpbmcgaW5jcmVtZW50YWwgdXBkYXRlIG9mIGRhdGEgdGhhdCB3ZSBhbHJlYWR5IGhhdmUgZnJvbSB0aGUgc2VydmVyLiBUaGF0IHdvdWxkIG1lYW4gb25seVxuICAgIC8vIHVwZGF0aW5nIGZpZWxkcyBpbiB0aGUgbG9jYWwgb2JqZWN0IGlmIHRoZXkgZXhpc3QgaW4gdGhlIGpzb24gZGF0YS5cbiAgICBwYWdlRGF0YS5ncm91cElkID0gZ3JvdXBTZXR0aW5ncy5ncm91cElkKCk7XG4gICAgcGFnZURhdGEucGFnZUlkID0ganNvbi5pZDtcbiAgICBwYWdlRGF0YS51cmxIYXNoID0ganNvbi51cmxoYXNoO1xuICAgIHBhZ2VEYXRhLnN1bW1hcnkgPSB7XG4gICAgICAgIHRvdGFsUmVhY3Rpb25zOiBudW1SZWFjdGlvbnMsXG4gICAgICAgIHRvdGFsQ29tbWVudHM6IG51bUNvbW1lbnRzLFxuICAgICAgICB0b3RhbFNoYXJlczogbnVtU2hhcmVzXG4gICAgfTtcbiAgICBwYWdlRGF0YS50b3BSZWFjdGlvbnMgPSB0b3BSZWFjdGlvbnM7XG4gICAgLy8gcGFnZURhdGEuY29udGFpbmVycyBpcyBpbml0aWFsaXplZCBieSBhYm92ZSBsb29wXG5cbiAgICByZXR1cm4gcGFnZURhdGE7XG59XG5cbmZ1bmN0aW9uIGdldENvbnRhaW5lckRhdGEocGFnZURhdGEsIGNvbnRhaW5lckhhc2gpIHtcbiAgICB2YXIgY29udGFpbmVyRGF0YSA9IHBhZ2VEYXRhLmNvbnRhaW5lcnNbY29udGFpbmVySGFzaF07XG4gICAgaWYgKCFjb250YWluZXJEYXRhKSB7XG4gICAgICAgIGNvbnRhaW5lckRhdGEgPSB7XG4gICAgICAgICAgICBoYXNoOiBjb250YWluZXJIYXNoXG4gICAgICAgIH07XG4gICAgICAgIHBhZ2VEYXRhLmNvbnRhaW5lcnNbY29udGFpbmVySGFzaF0gPSBjb250YWluZXJEYXRhO1xuICAgIH1cbiAgICByZXR1cm4gY29udGFpbmVyRGF0YTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlQWxsQ29udGFpbmVyRGF0YShqc29uLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBjb250YWluZXJEYXRhID0ganNvbi5rbm93bjtcbiAgICBmb3IgKHZhciBoYXNoIGluIGNvbnRhaW5lckRhdGEpIHtcbiAgICAgICAgaWYgKGNvbnRhaW5lckRhdGEuaGFzT3duUHJvcGVydHkoaGFzaCkpIHtcbiAgICAgICAgICAgIHVwZGF0ZUNvbnRhaW5lckRhdGEoaGFzaCwgY29udGFpbmVyRGF0YVtoYXNoXSwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8vanNvbi51bmtub3duOyBUT0RPOiBhbnl0aGluZyB0byBkbyB3aXRoIHRoaXMgZGF0YT9cbn1cblxuZnVuY3Rpb24gdXBkYXRlQ29udGFpbmVyRGF0YShjb250YWluZXJIYXNoLCBqc29uRGF0YSwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgY29udGFpbmVyRGF0YSA9IGdldENvbnRhaW5lckRhdGEocGFnZURhdGEsIGNvbnRhaW5lckhhc2gpO1xuXG4gICAgdmFyIHRvcFJlYWN0aW9ucyA9IFtdO1xuICAgIHZhciByZWFjdGlvbnNEYXRhID0ganNvbkRhdGEudG9wX2ludGVyYWN0aW9ucy50YWdzOyAvLyBUT0RPIHRvcF9pbnRlcmFjdGlvbnMuY29tcz9cbiAgICBmb3IgKHZhciBpZCBpbiByZWFjdGlvbnNEYXRhKSB7XG4gICAgICAgIGlmIChyZWFjdGlvbnNEYXRhLmhhc093blByb3BlcnR5KGlkKSkge1xuICAgICAgICAgICAgdmFyIHJlYWN0aW9uID0gcmVhY3Rpb25zRGF0YVtpZF07XG4gICAgICAgICAgICB0b3BSZWFjdGlvbnMucHVzaCh7XG4gICAgICAgICAgICAgICAgaWQ6IGlkLFxuICAgICAgICAgICAgICAgIGNvdW50OiByZWFjdGlvbi5jb3VudCxcbiAgICAgICAgICAgICAgICB0ZXh0OiByZWFjdGlvbi5ib2R5LFxuICAgICAgICAgICAgICAgIHBhcmVudElkOiByZWFjdGlvbi5wYXJlbnRfaWRcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY29udGFpbmVyRGF0YS5jb21tZW50Q291bnQgPSAganNvbkRhdGEuY291bnRzLmNvbXM7XG4gICAgY29udGFpbmVyRGF0YS5yZWFjdGlvbkNvdW50ID0ganNvbkRhdGEuY291bnRzLmludGVyYWN0aW9uczsgLy8gVE9ETzogd2hhdCBpcyBjb250YWluZXJEYXRhLmNvdW50cy50YWdzP1xuICAgIGNvbnRhaW5lckRhdGEuaWQgPSBqc29uRGF0YS5pZDtcbiAgICBjb250YWluZXJEYXRhLmtpbmQgPSBqc29uRGF0YS5raW5kO1xuICAgIGNvbnRhaW5lckRhdGEudG9wUmVhY3Rpb25zID0gdG9wUmVhY3Rpb25zO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgZ2V0UGFnZURhdGE6IGdldFBhZ2VEYXRhLFxuICAgIHVwZGF0ZUFsbFBhZ2VEYXRhOiB1cGRhdGVBbGxQYWdlRGF0YSxcbiAgICBnZXRDb250YWluZXJEYXRhOiBnZXRDb250YWluZXJEYXRhLFxuICAgIHVwZGF0ZUFsbENvbnRhaW5lckRhdGE6IHVwZGF0ZUFsbENvbnRhaW5lckRhdGFcbn07IiwiXG4vL3ZhciAkID0gcmVxdWlyZSgnLi9qcXVlcnknKTtcbnZhciAkO1xucmVxdWlyZSgnLi9zY3JpcHQtbG9hZGVyJykub24kKGZ1bmN0aW9uKGpRdWVyeSkge1xuICAgICQ9alF1ZXJ5O1xufSk7XG5cbi8vIFRPRE8gdGhpcyBpcyBqdXN0IHJhbmRvbSBpbmNvbXBsZXRlIHNuaXBwZXRzXG5cbmZ1bmN0aW9uIGNyZWF0ZVBhZ2VQYXJhbShncm91cFNldHRpbmdzKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZ3JvdXBfaWQ6IGdyb3VwU2V0dGluZ3MuaWQsXG4gICAgICAgIHVybDogJycsXG4gICAgICAgIGNhbm9uaWNhbF91cmw6ICcnLFxuICAgICAgICB0aXRsZTogJycsXG4gICAgICAgIGltYWdlOiAnJ1xuICAgIH07XG59XG5cblxuXG5mdW5jdGlvbiBsb2FkUGFnZShzZXR0aW5ncykge1xuICAgIGFsZXJ0KEpTT04uc3RyaW5naWZ5KHNldHRpbmdzLCBudWxsLCAyKSk7XG4gICAgJC5nZXRKU09OUCgnL2FwaS9wYWdlJywge1xuICAgICAgICAgICAgcGFnZXM6IFt7XG4gICAgICAgICAgICAgICAgZ3JvdXBfaWQ6IHNldHRpbmdzLmlkLFxuXG4gICAgICAgICAgICB9XVxuICAgICAgICB9LCBmdW5jdGlvbihwYWdlcykge1xuICAgICAgICAgICAgYWxlcnQoSlNPTi5zdHJpbmdpZnkocGFnZXMsIG51bGwsIDIpKTtcbiAgICAgICAgfSk7XG5cbn1cblxuZnVuY3Rpb24gbG9hZFBhZ2VzKCkge1xuXG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBsb2FkUGFnZTogbG9hZFBhZ2UsXG4gICAgbG9hZFBhZ2VzOiBsb2FkUGFnZXNcbn07IiwiXG52YXIgJDsgcmVxdWlyZSgnLi9zY3JpcHQtbG9hZGVyJykub24kKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgSGFzaCA9IHJlcXVpcmUoJy4vdXRpbHMvaGFzaCcpO1xudmFyIFVSTHMgPSByZXF1aXJlKCcuL3V0aWxzL3VybHMnKTtcbnZhciBTdW1tYXJ5V2lkZ2V0ID0gcmVxdWlyZSgnLi9zdW1tYXJ5LXdpZGdldCcpO1xudmFyIEluZGljYXRvcldpZGdldCA9IHJlcXVpcmUoJy4vaW5kaWNhdG9yLXdpZGdldCcpO1xudmFyIFBhZ2VEYXRhID0gcmVxdWlyZSgnLi9wYWdlLWRhdGEnKTtcblxuXG4vLyBTY2FuIGZvciBhbGwgcGFnZXMgYXQgdGhlIGN1cnJlbnQgYnJvd3NlciBsb2NhdGlvbi4gVGhpcyBjb3VsZCBqdXN0IGJlIHRoZSBjdXJyZW50IHBhZ2Ugb3IgaXQgY291bGQgYmUgYSBjb2xsZWN0aW9uXG4vLyBvZiBwYWdlcyAoYWthICdwb3N0cycpLlxuZnVuY3Rpb24gc2NhbkFsbFBhZ2VzKGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgJHBhZ2VzID0gJChncm91cFNldHRpbmdzLnBhZ2VTZWxlY3RvcigpKTtcbiAgICBpZiAoJHBhZ2VzLmxlbmd0aCA9PSAwKSB7XG4gICAgICAgIC8vIElmIHdlIGRvbid0IGRldGVjdCBhbnkgcGFnZSBtYXJrZXJzLCB0cmVhdCB0aGUgd2hvbGUgZG9jdW1lbnQgYXMgdGhlIHNpbmdsZSBwYWdlXG4gICAgICAgICRwYWdlcyA9ICQoJ2JvZHknKTsgLy8gVE9ETyBJcyB0aGlzIHRoZSByaWdodCBiZWhhdmlvcj9cbiAgICB9XG4gICAgJHBhZ2VzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkcGFnZSA9ICQodGhpcyk7XG4gICAgICAgIHNjYW5QYWdlKCRwYWdlLCBncm91cFNldHRpbmdzKTtcbiAgICB9KTtcbn1cblxuLy8gU2NhbiB0aGUgcGFnZSB1c2luZyB0aGUgZ2l2ZW4gc2V0dGluZ3M6XG4vLyAxLiBGaW5kIGFsbCB0aGUgY29udGFpbmVycyB0aGF0IHdlIGNhcmUgYWJvdXQuXG4vLyAyLiBDb21wdXRlIGhhc2hlcyBmb3IgZWFjaCBjb250YWluZXIuXG4vLyAzLiBJbnNlcnQgd2lkZ2V0IGFmZm9yZGFuY2VzIGZvciBlYWNoIHdoaWNoIGFyZSBib3VuZCB0byB0aGUgZGF0YSBtb2RlbCBieSB0aGUgaGFzaGVzLlxuZnVuY3Rpb24gc2NhblBhZ2UoJHBhZ2UsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgdXJsID0gVVJMcy5jb21wdXRlUGFnZVVybCgkcGFnZSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgdmFyIHVybEhhc2ggPSBIYXNoLmhhc2hVcmwodXJsKTtcbiAgICB2YXIgcGFnZURhdGEgPSBQYWdlRGF0YS5nZXRQYWdlRGF0YSh1cmxIYXNoKTtcblxuICAgIC8vIEZpcnN0LCBzY2FuIGZvciBlbGVtZW50cyB0aGF0IHdvdWxkIGNhdXNlIHVzIHRvIGluc2VydCBzb21ldGhpbmcgaW50byB0aGUgRE9NIHRoYXQgdGFrZXMgdXAgc3BhY2UuXG4gICAgLy8gV2Ugd2FudCB0byBnZXQgYW55IHBhZ2UgcmVzaXppbmcgb3V0IG9mIHRoZSB3YXkgYXMgZWFybHkgYXMgcG9zc2libGUuXG4gICAgLy8gVE9ETzogQ29uc2lkZXIgZG9pbmcgdGhpcyB3aXRoIHJhdyBKYXZhc2NyaXB0IGJlZm9yZSBqUXVlcnkgbG9hZHMsIHRvIGZ1cnRoZXIgcmVkdWNlIHRoZSBkZWxheS4gV2Ugd291bGRuJ3RcbiAgICAvLyBzYXZlIGEgKnRvbiogb2YgdGltZSBmcm9tIHRoaXMsIHRob3VnaCwgc28gaXQncyBkZWZpbml0ZWx5IGEgbGF0ZXIgb3B0aW1pemF0aW9uLlxuICAgIHNjYW5Gb3JTdW1tYXJpZXMoJHBhZ2UsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICBzY2FuRm9yQ2FsbHNUb0FjdGlvbigkcGFnZSwgZ3JvdXBTZXR0aW5ncyk7XG5cbiAgICB2YXIgJGFjdGl2ZVNlY3Rpb25zID0gJHBhZ2UuZmluZChncm91cFNldHRpbmdzLmFjdGl2ZVNlY3Rpb25zKCkpO1xuICAgICRhY3RpdmVTZWN0aW9ucy5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgJHNlY3Rpb24gPSAkKHRoaXMpO1xuICAgICAgICAvLyBUaGVuIHNjYW4gZm9yIGV2ZXJ5dGhpbmcgZWxzZVxuICAgICAgICBzY2FuRm9yVGV4dCgkc2VjdGlvbiwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICBzY2FuRm9ySW1hZ2VzKCRzZWN0aW9uLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgc2NhbkZvck1lZGlhKCRzZWN0aW9uLCBncm91cFNldHRpbmdzKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gc2NhbkZvclN1bW1hcmllcygkZWxlbWVudCwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgJHN1bW1hcmllcyA9ICRlbGVtZW50LmZpbmQoZ3JvdXBTZXR0aW5ncy5zdW1tYXJ5U2VsZWN0b3IoKSk7XG4gICAgJHN1bW1hcmllcy5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgJHN1bW1hcnkgPSAkKHRoaXMpO1xuICAgICAgICB2YXIgY29udGFpbmVyID0gJCgnPGRpdiBjbGFzcz1cImFudC1zdW1tYXJ5LWNvbnRhaW5lclwiPjwvZGl2PicpO1xuICAgICAgICBTdW1tYXJ5V2lkZ2V0LmNyZWF0ZShjb250YWluZXIsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgaW5zZXJ0Q29udGVudCgkc3VtbWFyeSwgY29udGFpbmVyLCBncm91cFNldHRpbmdzLnN1bW1hcnlNZXRob2QoKSk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIHNjYW5Gb3JDYWxsc1RvQWN0aW9uKCRzZWN0aW9uLCBncm91cFNldHRpbmdzKSB7XG4gICAgLy8gVE9ET1xufVxuXG5mdW5jdGlvbiBzY2FuRm9yVGV4dCgkc2VjdGlvbiwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgJHRleHRFbGVtZW50cyA9ICRzZWN0aW9uLmZpbmQoZ3JvdXBTZXR0aW5ncy50ZXh0U2VsZWN0b3IoKSk7XG4gICAgLy8gVE9ETzogb25seSBzZWxlY3QgXCJsZWFmXCIgZWxlbWVudHNcbiAgICAkdGV4dEVsZW1lbnRzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkZWxlbWVudCA9ICQodGhpcyk7XG4gICAgICAgIC8vIFRPRE8gcG9zaXRpb24gY29ycmVjdGx5XG4gICAgICAgIC8vIFRPRE8gaGFzaCBhbmQgYWRkIGhhc2ggZGF0YSB0byBpbmRpY2F0b3JcbiAgICAgICAgdmFyIGhhc2ggPSBIYXNoLmhhc2hUZXh0KCRlbGVtZW50KTtcbiAgICAgICAgdmFyIGNvbnRhaW5lciA9ICQoJzxkaXYgY2xhc3M9XCJhbnQtaW5kaWNhdG9yLWNvbnRhaW5lclwiIHN0eWxlPVwiZGlzcGxheTppbmxpbmUtYmxvY2s7XCI+PC9kaXY+Jyk7IC8vIFRPRE9cbiAgICAgICAgUGFnZURhdGEuZ2V0Q29udGFpbmVyRGF0YShwYWdlRGF0YSwgaGFzaCk7XG4gICAgICAgIHZhciBjb250YWluZXJEYXRhID0ge307IC8vIFRPRE8gZ2V0IHRoaXMgZnJvbSBhIGNlbnRyYWwgZGF0YSBzdG9yZSAocHJvYmFibHkgUGFnZURhdGEpXG4gICAgICAgIHZhciBpbmRpY2F0b3IgPSBJbmRpY2F0b3JXaWRnZXQuY3JlYXRlKGNvbnRhaW5lciwgY29udGFpbmVyRGF0YSk7XG4gICAgICAgICRlbGVtZW50LmFwcGVuZChjb250YWluZXIpOyAvLyBUT0RPIGlzIHRoaXMgY29uZmlndXJhYmxlIGFsYSBpbnNlcnRDb250ZW50KC4uLik/XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIHNjYW5Gb3JJbWFnZXMoJHNlY3Rpb24sIGdyb3VwU2V0dGluZ3MpIHtcbiAgICAvLyBUT0RPXG59XG5cbmZ1bmN0aW9uIHNjYW5Gb3JNZWRpYSgkc2VjdGlvbiwgZ3JvdXBTZXR0aW5ncykge1xuICAgIC8vIFRPRE9cbn1cblxuZnVuY3Rpb24gaW5zZXJ0Q29udGVudCgkcGFyZW50LCBjb250ZW50LCBtZXRob2QpIHtcbiAgICBzd2l0Y2ggKG1ldGhvZCkge1xuICAgICAgICBjYXNlICdhcHBlbmQnOlxuICAgICAgICAgICAgJHBhcmVudC5hcHBlbmQoY29udGVudCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAncHJlcGVuZCc6XG4gICAgICAgICAgICAkcGFyZW50LnByZXBlbmQoY29udGVudCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnYmVmb3JlJzpcbiAgICAgICAgICAgICRwYXJlbnQuYmVmb3JlKGNvbnRlbnQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2FmdGVyJzpcbiAgICAgICAgICAgICRwYXJlbnQuYWZ0ZXIoY29udGVudCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICB9XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgIHNjYW46IHNjYW5BbGxQYWdlc1xufTsiLCJcbnZhciAkOyByZXF1aXJlKCcuL3NjcmlwdC1sb2FkZXInKS5vbiQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciBYRE1DbGllbnQgPSByZXF1aXJlKCcuL3V0aWxzL3hkbS1jbGllbnQnKTtcbnZhciBVUkxzID0gcmVxdWlyZSgnLi91dGlscy91cmxzJyk7XG52YXIgTW92ZWFibGUgPSByZXF1aXJlKCcuL3V0aWxzL21vdmVhYmxlJyk7XG5cbmZ1bmN0aW9uIGNyZWF0ZVJlYWN0aW9uc1dpZGdldChjb250YWluZXIsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIHJlYWN0aW9uc0RhdGEgPSBwYWdlRGF0YS50b3BSZWFjdGlvbnM7XG4gICAgdmFyIGNvbG9ycyA9IGdyb3VwU2V0dGluZ3MucmVhY3Rpb25CYWNrZ3JvdW5kQ29sb3JzKCk7XG4gICAgdmFyIGxheW91dERhdGEgPSBjb21wdXRlTGF5b3V0RGF0YShyZWFjdGlvbnNEYXRhLCBjb2xvcnMpO1xuICAgIHZhciByYWN0aXZlID0gUmFjdGl2ZSh7XG4gICAgICAgIGVsOiBjb250YWluZXIsXG4gICAgICAgIG1hZ2ljOiB0cnVlLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICByZWFjdGlvbnM6IHJlYWN0aW9uc0RhdGEsXG4gICAgICAgICAgICByZXNwb25zZToge30sXG4gICAgICAgICAgICBsYXlvdXRDbGFzczogZnVuY3Rpb24oaW5kZXgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbGF5b3V0RGF0YS5sYXlvdXRDbGFzc2VzW2luZGV4XTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IGZ1bmN0aW9uKGluZGV4KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGxheW91dERhdGEuYmFja2dyb3VuZENvbG9yc1tpbmRleF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHRlbXBsYXRlOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvcmVhY3Rpb25zLXdpZGdldC5odG1sJyksXG4gICAgICAgIGRlY29yYXRvcnM6IHtcbiAgICAgICAgICAgIHNpemV0b2ZpdDogc2l6ZVRvRml0XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByYWN0aXZlLm9uKCdjb21wbGV0ZScsIGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgJHJvb3RFbGVtZW50ID0gJChyb290RWxlbWVudChyYWN0aXZlKSk7XG4gICAgICAgIE1vdmVhYmxlLm1ha2VNb3ZlYWJsZSgkcm9vdEVsZW1lbnQsICRyb290RWxlbWVudC5maW5kKCcuYW50ZW5uYS1oZWFkZXInKSk7XG4gICAgfSk7XG4gICAgcmFjdGl2ZS5vbignY2hhbmdlJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIGxheW91dERhdGEgPSBjb21wdXRlTGF5b3V0RGF0YShyZWFjdGlvbnNEYXRhLCBjb2xvcnMpO1xuICAgIH0pO1xuICAgIHJhY3RpdmUub24oJ3VwZGF0ZScsIGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zb2xlLmxvZygndXBkYXRlIScpO1xuICAgIH0pO1xuICAgIHJhY3RpdmUub24oJ3BsdXNvbmUnLCBwbHVzT25lKHBhZ2VEYXRhLCByYWN0aXZlKSk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgb3Blbjogb3BlbldpbmRvdyhyYWN0aXZlKVxuICAgIH07XG59XG5cbmZ1bmN0aW9uIHNpemVUb0ZpdChub2RlKSB7XG4gICAgdmFyICRlbGVtZW50ID0gJChub2RlKTtcbiAgICB2YXIgJHJvb3RFbGVtZW50ID0gJGVsZW1lbnQuY2xvc2VzdCgnLmFudGVubmEtcmVhY3Rpb25zLXdpZGdldCcpO1xuICAgIGlmICgkcm9vdEVsZW1lbnQubGVuZ3RoID4gMCkge1xuICAgICAgICAkcm9vdEVsZW1lbnQuY3NzKHtkaXNwbGF5OiAnYmxvY2snLCBsZWZ0OiAnMTAwJSd9KTtcblxuICAgICAgICB2YXIgJHBhcmVudCA9ICRlbGVtZW50LmNsb3Nlc3QoJy5hbnRlbm5hLXJlYWN0aW9uLWJveCcpO1xuICAgICAgICB2YXIgcmF0aW8gPSAkcGFyZW50Lm91dGVyV2lkdGgoKSAvIG5vZGUuc2Nyb2xsV2lkdGg7XG4gICAgICAgIGlmIChyYXRpbyA8IDEuMCkge1xuICAgICAgICAgICAgLy8gSWYgdGhlIHRleHQgZG9lc24ndCBmaXQsIGZpcnN0IHRyeSB0byB3cmFwIGl0IHRvIHR3byBsaW5lcy4gVGhlbiBzY2FsZSBpdCBkb3duIGlmIHN0aWxsIG5lY2Vzc2FyeS5cbiAgICAgICAgICAgIHZhciB0ZXh0ID0gbm9kZS5pbm5lckhUTUw7XG4gICAgICAgICAgICAvLyBMb29rIGZvciB0aGUgY2xvc2VzdCBzcGFjZSB0byB0aGUgbWlkZGxlLCB3ZWlnaHRlZCBzbGlnaHRseSAoTWF0aC5jZWlsKSB0b3dhcmQgYSBzcGFjZSBpbiB0aGUgc2Vjb25kIGhhbGYuXG4gICAgICAgICAgICB2YXIgbWlkID0gTWF0aC5jZWlsKHRleHQubGVuZ3RoIC8gMik7XG4gICAgICAgICAgICB2YXIgc2Vjb25kSGFsZkluZGV4ID0gdGV4dC5pbmRleE9mKCcgJywgbWlkKTtcbiAgICAgICAgICAgIHZhciBmaXJzdEhhbGZJbmRleCA9IHRleHQubGFzdEluZGV4T2YoJyAnLCBtaWQpO1xuICAgICAgICAgICAgdmFyIHNwbGl0SW5kZXggPSBNYXRoLmFicyhzZWNvbmRIYWxmSW5kZXggLSBtaWQpIDwgTWF0aC5hYnMobWlkIC0gZmlyc3RIYWxmSW5kZXgpID8gc2Vjb25kSGFsZkluZGV4IDogZmlyc3RIYWxmSW5kZXg7XG4gICAgICAgICAgICBpZiAoc3BsaXRJbmRleCA+IDEpIHtcbiAgICAgICAgICAgICAgICBub2RlLmlubmVySFRNTCA9IHRleHQuc2xpY2UoMCwgc3BsaXRJbmRleCkgKyAnPGJyPicgKyB0ZXh0LnNsaWNlKHNwbGl0SW5kZXgpO1xuICAgICAgICAgICAgICAgIHJhdGlvID0gJHBhcmVudC5vdXRlcldpZHRoKCkgLyBub2RlLnNjcm9sbFdpZHRoO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHJhdGlvIDwgMS4wKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1pblNpemUgPSAxMDtcbiAgICAgICAgICAgICAgICB2YXIgbmV3U2l6ZSA9IE1hdGgubWF4KG1pblNpemUsIE1hdGguZmxvb3IocGFyc2VJbnQoJGVsZW1lbnQuY3NzKCdmb250LXNpemUnKSkgKiByYXRpbykgLSAxKTtcbiAgICAgICAgICAgICAgICAkZWxlbWVudC5jc3MoJ2ZvbnQtc2l6ZScsIG5ld1NpemUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgJHJvb3RFbGVtZW50LmNzcyh7ZGlzcGxheTogJycsIGxlZnQ6ICcnfSk7XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICAgIHRlYXJkb3duOiBmdW5jdGlvbigpIHt9XG4gICAgfTtcbn1cblxuZnVuY3Rpb24gcGx1c09uZShwYWdlRGF0YSwgcmFjdGl2ZSkge1xuICAgIHJldHVybiBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAvLyBPcHRpbWlzdGljYWxseSB1cGRhdGUgb3VyIGxvY2FsIGRhdGEgc3RvcmUgYW5kIHRoZSBVSS4gVGhlbiBzZW5kIHRoZSByZXF1ZXN0IHRvIHRoZSBzZXJ2ZXIuXG4gICAgICAgIHZhciByZWFjdGlvbkRhdGEgPSBldmVudC5jb250ZXh0O1xuICAgICAgICByZWFjdGlvbkRhdGEuY291bnQgPSByZWFjdGlvbkRhdGEuY291bnQgKyAxO1xuICAgICAgICAvLyBUT0RPOiBjaGVjayBiYWNrIG9uIHRoaXMgYXMgdGhlIHdheSB0byBwcm9wb2dhdGUgZGF0YSBjaGFuZ2VzIGJhY2sgdG8gdGhlIHN1bW1hcnlcbiAgICAgICAgcGFnZURhdGEuc3VtbWFyeS50b3RhbFJlYWN0aW9ucyA9IHBhZ2VEYXRhLnN1bW1hcnkudG90YWxSZWFjdGlvbnMgKyAxO1xuXG4gICAgICAgIFhETUNsaWVudC5nZXRVc2VyKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICB2YXIgdXNlckluZm8gPSByZXNwb25zZS5kYXRhO1xuICAgICAgICAgICAgcG9zdFBsdXNPbmUocmVhY3Rpb25EYXRhLCB1c2VySW5mbywgcGFnZURhdGEsIHJhY3RpdmUpO1xuICAgICAgICB9KTtcbiAgICB9O1xufVxuXG5mdW5jdGlvbiBwb3N0UGx1c09uZShyZWFjdGlvbkRhdGEsIHVzZXJJbmZvLCBwYWdlRGF0YSwgcmFjdGl2ZSkge1xuICAgIC8vIFRPRE8gZXh0cmFjdCB0aGUgc2hhcGUgb2YgdGhpcyBkYXRhIGFuZCBwb3NzaWJseSB0aGUgd2hvbGUgQVBJIGNhbGxcbiAgICAvLyBUT0RPIHRoaXMgaXMgb25seSBoYW5kbGluZyB0aGUgc3VtbWFyeSBjYXNlLiBuZWVkIHRvIGdlbmVyYWxpemUgdGhlIHdpZGdldCB0byBoYW5kbGUgY29udGFpbmVycy9jb250ZW50XG4gICAgdmFyIGRhdGEgPSB7XG4gICAgICAgIHRhZzoge1xuICAgICAgICAgICAgYm9keTogcmVhY3Rpb25EYXRhLnRleHQsXG4gICAgICAgICAgICBpZDogcmVhY3Rpb25EYXRhLmlkLFxuICAgICAgICAgICAgdGFnX2NvdW50OiByZWFjdGlvbkRhdGEuY291bnQgLy8gVE9ETyB3aHk/P1xuICAgICAgICB9LFxuICAgICAgICBoYXNoOiAncGFnZScsXG4gICAgICAgIGtpbmQ6ICdwYWdlJyxcbiAgICAgICAgdXNlcl9pZDogdXNlckluZm8udXNlcl9pZCxcbiAgICAgICAgYW50X3Rva2VuOiB1c2VySW5mby5hbnRfdG9rZW4sXG4gICAgICAgIHBhZ2VfaWQ6IHBhZ2VEYXRhLnBhZ2VJZCxcbiAgICAgICAgZ3JvdXBfaWQ6IHBhZ2VEYXRhLmdyb3VwSWQsXG4gICAgICAgIGNvbnRhaW5lcl9raW5kOiAndGV4dCcsIC8vIFRPRE86IHdoeSBpcyB0aGlzICd0ZXh0JyBmb3IgYSBwYWdlIHJlYWN0aW9uP1xuICAgICAgICBjb250ZW50X25vZGU6ICcnLFxuICAgICAgICBjb250ZW50X25vZGVfZGF0YToge1xuICAgICAgICAgICAgYm9keTogJycsXG4gICAgICAgICAgICBraW5kOiAncGFnZScsXG4gICAgICAgICAgICBpdGVtX3R5cGU6ICdwYWdlJ1xuICAgICAgICB9XG4gICAgfTtcbiAgICB2YXIgc3VjY2VzcyA9IGZ1bmN0aW9uKGpzb24pIHtcbiAgICAgICAgdmFyIHJlc3BvbnNlID0geyAvLyBUT0RPOiBqdXN0IGNhcHR1cmluZyB0aGUgYXBpIGZvcm1hdC4uLlxuICAgICAgICAgICAgZXhpc3Rpbmc6IGpzb24uZXhpc3RpbmcsXG4gICAgICAgICAgICBpbnRlcmFjdGlvbjoge1xuICAgICAgICAgICAgICAgIGlkOiBqc29uLmludGVyYWN0aW9uLmlkLFxuICAgICAgICAgICAgICAgIGludGVyYWN0aW9uX25vZGU6IHtcbiAgICAgICAgICAgICAgICAgICAgYm9keToganNvbi5pbnRlcmFjdGlvbi5pbnRlcmFjdGlvbl9ub2RlLmJvZHksXG4gICAgICAgICAgICAgICAgICAgIGlkOiBqc29uLmludGVyYWN0aW9uLmludGVyYWN0aW9uX25vZGUuaWRcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIC8vaWYgKGpzb24uZXhpc3RpbmcpIHtcbiAgICAgICAgLy8gICAgaGFuZGxlRHVwbGljYXRlUmVhY3Rpb24ocmVhY3Rpb25EYXRhKTtcbiAgICAgICAgLy99IGVsc2Uge1xuICAgICAgICAvLyAgICBoYW5kbGVOZXdSZWFjdGlvbihyZWFjdGlvbkRhdGEpO1xuICAgICAgICAvL31cbiAgICAgICAgLy8gVE9ETzogV2UgY2FuIGVpdGhlciBhY2Nlc3MgdGhpcyBkYXRhIHRocm91Z2ggdGhlIHJhY3RpdmUga2V5cGF0aCBvciBieSBwYXNzaW5nIHRoZSBkYXRhIG9iamVjdCBhcm91bmQuIFBpY2sgb25lLlxuICAgICAgICByYWN0aXZlLnNldCgncmVzcG9uc2UuZXhpc3RpbmcnLCByZXNwb25zZS5leGlzdGluZyk7XG4gICAgICAgIHNob3dSZWFjdGlvblJlc3VsdChyYWN0aXZlKTtcbiAgICAgICAgY29uc29sZS5sb2coJ3N1Y2Nlc3MhJyk7XG4gICAgfTtcbiAgICB2YXIgZXJyb3IgPSBmdW5jdGlvbihtZXNzYWdlKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBwb3N0aW5nIHJlYWN0aW9uOiBcIiArIG1lc3NhZ2UpO1xuICAgIH07XG4gICAgJC5nZXRKU09OUChVUkxzLmNyZWF0ZVJlYWN0aW9uVXJsKCksIGRhdGEsIHN1Y2Nlc3MsIGVycm9yKTtcbn1cblxuZnVuY3Rpb24gY29tcHV0ZUxheW91dERhdGEocmVhY3Rpb25zRGF0YSwgY29sb3JzKSB7XG4gICAgLy8gVE9ETyBWZXJpZnkgdGhhdCB0aGUgcmVhY3Rpb25zRGF0YSBpcyBjb21pbmcgYmFjayBmcm9tIHRoZSBzZXJ2ZXIgc29ydGVkLiBJZiBub3QsIHNvcnQgaXQgYWZ0ZXIgaXRzIGZldGNoZWQuXG5cbiAgICB2YXIgbnVtUmVhY3Rpb25zID0gcmVhY3Rpb25zRGF0YS5sZW5ndGg7XG4gICAgLy8gVE9ETzogQ29waWVkIGNvZGUgZnJvbSBlbmdhZ2VfZnVsbC5jcmVhdGVUYWdCdWNrZXRzXG4gICAgdmFyIG1heCA9IHJlYWN0aW9uc0RhdGFbMF0uY291bnQ7XG4gICAgdmFyIG1lZGlhbiA9IHJlYWN0aW9uc0RhdGFbIE1hdGguZmxvb3IocmVhY3Rpb25zRGF0YS5sZW5ndGgvMikgXS5jb3VudDtcbiAgICB2YXIgbWluID0gcmVhY3Rpb25zRGF0YVsgcmVhY3Rpb25zRGF0YS5sZW5ndGgtMSBdLmNvdW50O1xuICAgIHZhciB0b3RhbCA9IDA7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBudW1SZWFjdGlvbnM7IGkrKykge1xuICAgICAgICB0b3RhbCArPSByZWFjdGlvbnNEYXRhW2ldLmNvdW50O1xuICAgIH1cbiAgICB2YXIgYXZlcmFnZSA9IE1hdGguZmxvb3IodG90YWwgLyBudW1SZWFjdGlvbnMpO1xuICAgIHZhciBtaWRWYWx1ZSA9ICggbWVkaWFuID4gYXZlcmFnZSApID8gbWVkaWFuIDogYXZlcmFnZTtcblxuICAgIHZhciBsYXlvdXRDbGFzc2VzID0gW107XG4gICAgdmFyIG51bUhhbGZzaWVzID0gMDtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG51bVJlYWN0aW9uczsgaSsrKSB7XG4gICAgICAgIGlmIChyZWFjdGlvbnNEYXRhW2ldLmNvdW50ID4gbWlkVmFsdWUpIHtcbiAgICAgICAgICAgIGxheW91dENsYXNzZXNbaV0gPSAnZnVsbCc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsYXlvdXRDbGFzc2VzW2ldID0gJ2hhbGYnO1xuICAgICAgICAgICAgbnVtSGFsZnNpZXMrKztcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAobnVtSGFsZnNpZXMgJSAyICE9PTApIHtcbiAgICAgICAgbGF5b3V0Q2xhc3Nlc1tudW1SZWFjdGlvbnMgLSAxXSA9ICdmdWxsJzsgLy8gSWYgdGhlcmUgYXJlIGFuIG9kZCBudW1iZXIsIHRoZSBsYXN0IG9uZSBnb2VzIGZ1bGwuXG4gICAgfVxuXG4gICAgdmFyIG51bUNvbG9ycyA9IGNvbG9ycy5sZW5ndGg7XG4gICAgdmFyIGJhY2tncm91bmRDb2xvcnMgPSBbXTtcbiAgICB2YXIgY29sb3JJbmRleCA9IDA7XG4gICAgdmFyIHBhaXJXaXRoTmV4dCA9IDA7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBudW1SZWFjdGlvbnM7IGkrKykge1xuICAgICAgICBiYWNrZ3JvdW5kQ29sb3JzW2ldID0gY29sb3JzW2NvbG9ySW5kZXglbnVtQ29sb3JzXTtcbiAgICAgICAgaWYgKGxheW91dENsYXNzZXNbaV0gPT09ICdmdWxsJykge1xuICAgICAgICAgICAgY29sb3JJbmRleCsrO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gVE9ETyBnb3R0YSBiZSBhYmxlIHRvIG1ha2UgdGhpcyBzaW1wbGVyXG4gICAgICAgICAgICBpZiAocGFpcldpdGhOZXh0ID4gMCkge1xuICAgICAgICAgICAgICAgIHBhaXJXaXRoTmV4dC0tO1xuICAgICAgICAgICAgICAgIGlmIChwYWlyV2l0aE5leHQgPT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBjb2xvckluZGV4Kys7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBwYWlyV2l0aE5leHQgPSAxOyAvLyBJZiB3ZSB3YW50IHRvIGFsbG93IE4gYm94ZXMgcGVyIHJvdywgdGhpcyBudW1iZXIgd291bGQgYmVjb21lIGNvbmRpdGlvbmFsLlxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgbGF5b3V0Q2xhc3NlczogbGF5b3V0Q2xhc3NlcyxcbiAgICAgICAgYmFja2dyb3VuZENvbG9yczogYmFja2dyb3VuZENvbG9yc1xuICAgIH07XG59XG5cbmZ1bmN0aW9uIHJvb3RFbGVtZW50KHJhY3RpdmUpIHtcbiAgICAvLyBUT0RPOiBnb3R0YSBiZSBhIGJldHRlciB3YXkgdG8gZ2V0IHRoaXNcbiAgICByZXR1cm4gcmFjdGl2ZS5maW5kKCdkaXYnKTtcbn1cblxuZnVuY3Rpb24gc2hvd1JlYWN0aW9uUmVzdWx0KHJhY3RpdmUpIHtcbiAgICB2YXIgJHJvb3QgPSAkKHJvb3RFbGVtZW50KHJhY3RpdmUpKTtcbiAgICAvLyBUT0RPOiBUaGlzIGlzIHByb2JhYmx5IHdoZXJlIGEgUmFjdGl2ZSBwYXJ0aWFsIGNvbWVzIGluLiBOZWVkIGEgbmVzdGVkIHRlbXBsYXRlIGhlcmUgZm9yIHNob3dpbmcgdGhlIHJlc3VsdC5cbiAgICAkcm9vdC5maW5kKCcuYW50ZW5uYS1jb25maXJtLXBhZ2UnKS5hbmltYXRlKHsgbGVmdDogMCB9KTtcbiAgICAkcm9vdC5hbmltYXRlKHsgd2lkdGg6IDMwMCB9LCB7IGRlbGF5OiAxMDAgfSk7XG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgc2hvd1JlYWN0aW9ucyhyYWN0aXZlLCB0cnVlKTtcbiAgICB9LCAxMDAwKTtcbn1cblxuZnVuY3Rpb24gc2hvd1JlYWN0aW9ucyhyYWN0aXZlLCBhbmltYXRlKSB7XG4gICAgdmFyICRyb290ID0gJChyb290RWxlbWVudChyYWN0aXZlKSk7XG4gICAgaWYgKGFuaW1hdGUpIHtcbiAgICAgICAgJHJvb3QuZmluZCgnLmFudGVubmEtY29uZmlybS1wYWdlJykuYW5pbWF0ZSh7IGxlZnQ6ICcxMDAlJyB9KTtcbiAgICAgICAgJHJvb3QuYW5pbWF0ZSh7IHdpZHRoOiAyMDAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgJHJvb3QuZmluZCgnLmFudGVubmEtY29uZmlybS1wYWdlJykuY3NzKHsgbGVmdDogJzEwMCUnIH0pO1xuICAgICAgICAkcm9vdC5jc3MoeyB3aWR0aDogMjAwIH0pO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gb3BlbldpbmRvdyhyYWN0aXZlKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHJlbGF0aXZlRWxlbWVudCkge1xuICAgICAgICB2YXIgJHJlbGF0aXZlRWxlbWVudCA9ICQocmVsYXRpdmVFbGVtZW50KTtcbiAgICAgICAgdmFyIG9mZnNldCA9ICRyZWxhdGl2ZUVsZW1lbnQub2Zmc2V0KCk7XG4gICAgICAgIHZhciBjb29yZHMgPSB7XG4gICAgICAgICAgICB0b3A6IG9mZnNldC50b3AgKyA1LC8vJHJlbGF0aXZlRWxlbWVudC5oZWlnaHQoKSxcbiAgICAgICAgICAgIGxlZnQ6IG9mZnNldC5sZWZ0ICsgNVxuICAgICAgICB9O1xuICAgICAgICB2YXIgJHJvb3RFbGVtZW50ID0gJChyb290RWxlbWVudChyYWN0aXZlKSk7XG4gICAgICAgICRyb290RWxlbWVudC5zdG9wKHRydWUsIHRydWUpLmFkZENsYXNzKCdvcGVuJykuY3NzKGNvb3Jkcyk7XG5cbiAgICAgICAgc2V0dXBXaW5kb3dDbG9zZShyYWN0aXZlKTtcbiAgICB9O1xufVxuXG5mdW5jdGlvbiBzZXR1cFdpbmRvd0Nsb3NlKHJhY3RpdmUpIHtcbiAgICB2YXIgJHJvb3RFbGVtZW50ID0gJChyb290RWxlbWVudChyYWN0aXZlKSk7XG5cbiAgICAkcm9vdEVsZW1lbnRcbiAgICAgICAgLm9uKCdtb3VzZW91dC5hbnRlbm5hJywgZGVsYXllZENsb3NlV2luZG93KCkpXG4gICAgICAgIC5vbignbW91c2VvdmVyLmFudGVubmEnLCBrZWVwV2luZG93T3BlbilcbiAgICAgICAgLm9uKCdmb2N1c2luLmFudGVubmEnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIE9uY2UgdGhlIHdpbmRvdyBoYXMgZm9jdXMsIGRvbid0IGNsb3NlIGl0IG9uIG1vdXNlb3V0LlxuICAgICAgICAgICAga2VlcFdpbmRvd09wZW4oKTtcbiAgICAgICAgICAgICRyb290RWxlbWVudC5vZmYoJ21vdXNlb3V0LmFudGVubmEnKTtcbiAgICAgICAgICAgICRyb290RWxlbWVudC5vZmYoJ21vdXNlb3Zlci5hbnRlbm5hJyk7XG4gICAgICAgIH0pXG4gICAgICAgIC5vbignZm9jdXNvdXQuYW50ZW5uYScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY2xvc2VXaW5kb3coKTtcbiAgICAgICAgfSk7XG5cbiAgICB2YXIgY2xvc2VUaW1lcjtcblxuICAgIGZ1bmN0aW9uIGRlbGF5ZWRDbG9zZVdpbmRvdygpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY2xvc2VUaW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgY2xvc2VUaW1lciA9IG51bGw7XG4gICAgICAgICAgICAgICAgY2xvc2VXaW5kb3coKTtcbiAgICAgICAgICAgIH0sIDUwMCk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24ga2VlcFdpbmRvd09wZW4oKSB7XG4gICAgICAgIGNsZWFyVGltZW91dChjbG9zZVRpbWVyKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjbG9zZVdpbmRvdygpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KGNsb3NlVGltZXIpO1xuXG4gICAgICAgICRyb290RWxlbWVudC5zdG9wKHRydWUsIHRydWUpLmZhZGVPdXQoJ2Zhc3QnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICRyb290RWxlbWVudC5jc3MoJ2Rpc3BsYXknLCAnJyk7IC8vIENsZWFyIHRoZSBkaXNwbGF5Om5vbmUgdGhhdCBmYWRlT3V0IHB1dHMgb24gdGhlIGVsZW1lbnRcbiAgICAgICAgICAgICRyb290RWxlbWVudC5yZW1vdmVDbGFzcygnb3BlbicpO1xuXG4gICAgICAgICAgICAkcm9vdEVsZW1lbnQub2ZmKCcuYW50ZW5uYScpOyAvLyBVbmJpbmQgYWxsIG9mIHRoZSBoYW5kbGVycyBpbiBvdXIgbmFtZXNwYWNlXG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlOiBjcmVhdGVSZWFjdGlvbnNXaWRnZXRcbn07IiwiXG52YXIgaXNPZmZsaW5lID0gcmVxdWlyZSgnLi91dGlscy9vZmZsaW5lJyk7XG5cbnZhciBiYXNlVXJsID0gJ2h0dHA6Ly9sb2NhbGhvc3Q6ODA4MSc7IC8vIFRPRE8gY29tcHV0ZSB0aGlzXG5cbnZhciAkO1xudmFyIGpRdWVyeUNhbGxiYWNrcyA9IFtdO1xuXG5mdW5jdGlvbiBvbiQoY2FsbGJhY2spIHtcbiAgICBpZiAoJCkge1xuICAgICAgICBjYWxsYmFjaygkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBqUXVlcnlDYWxsYmFja3MucHVzaChjYWxsYmFjayk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBqUXVlcnlMb2FkZWQoKSB7XG4gICAgLy8gVXBkYXRlIHRoZSAkIHRoYXQgd2UgZGVmaW5lIHdpdGhpbiBvdXIgb3duIGNsb3N1cmUgdG8gdGhlIHZlcnNpb24gb2YgalF1ZXJ5IHRoYXQgd2Ugd2FudCBhbmQgcmVzZXQgdGhlIGdsb2JhbCAkXG4gICAgJCA9IGpRdWVyeS5ub0NvbmZsaWN0KHRydWUpO1xuXG4gICAgJC5nZXRKU09OUCA9IGZ1bmN0aW9uKHVybCwgZGF0YSwgc3VjY2VzcywgZXJyb3IpIHtcbiAgICAgICAgdmFyIG9wdGlvbnMgPSB7XG4gICAgICAgICAgICB1cmw6IGJhc2VVcmwgKyB1cmwsIC8vIFRPRE8gYmFzZSB1cmxcbiAgICAgICAgICAgIHR5cGU6IFwiZ2V0XCIsXG4gICAgICAgICAgICBjb250ZW50VHlwZTogXCJhcHBsaWNhdGlvbi9qc29uXCIsXG4gICAgICAgICAgICBkYXRhVHlwZTogXCJqc29ucFwiLFxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24ocmVzcG9uc2UsIHRleHRTdGF0dXMsIFhIUikge1xuICAgICAgICAgICAgICAgIC8vIFRPRE86IFJldmlzaXQgd2hldGhlciBpdCdzIHJlYWxseSBjb29sIHRvIGtleSB0aGlzIG9uIHRoZSB0ZXh0U3RhdHVzIG9yIGlmIHdlIHNob3VsZCBiZSBsb29raW5nIGF0XG4gICAgICAgICAgICAgICAgLy8gICAgICAgdGhlIHN0YXR1cyBjb2RlIGluIHRoZSBYSFJcbiAgICAgICAgICAgICAgICAvLyBOb3RlOiBUaGUgc2VydmVyIGNvbWVzIGJhY2sgd2l0aCAyMDAgcmVzcG9uc2VzIHdpdGggYSBuZXN0ZWQgc3RhdHVzIG9mIFwiZmFpbFwiLi4uXG4gICAgICAgICAgICAgICAgaWYgKHRleHRTdGF0dXMgPT09ICdzdWNjZXNzJyAmJiByZXNwb25zZS5zdGF0dXMgIT09ICdmYWlsJykge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEZvciBKU09OUCByZXF1ZXN0cywgalF1ZXJ5IGRvZXNuJ3QgY2FsbCBpdCdzIGVycm9yIGNhbGxiYWNrLiBJdCBjYWxscyBzdWNjZXNzIGluc3RlYWQuXG4gICAgICAgICAgICAgICAgICAgIGVycm9yKHJlc3BvbnNlLm1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgaWYgKGRhdGEpIHtcbiAgICAgICAgICAgIG9wdGlvbnMuZGF0YSA9IHsganNvbjogSlNPTi5zdHJpbmdpZnkoZGF0YSkgfTtcbiAgICAgICAgfVxuICAgICAgICAkLmFqYXgob3B0aW9ucyk7XG4gICAgfTtcblxuICAgIHdoaWxlIChqUXVlcnlDYWxsYmFja3MubGVuZ3RoID4gMCkge1xuICAgICAgICBqUXVlcnlDYWxsYmFja3MucG9wKCkoJCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBsb2FkU2NyaXB0cyhsb2FkZWRDYWxsYmFjaykge1xuICAgIHZhciBzY3JpcHRzID0gW1xuICAgICAgICB7c3JjOiAnLy9jZG5qcy5jbG91ZGZsYXJlLmNvbS9hamF4L2xpYnMvanF1ZXJ5LzIuMS40L2pxdWVyeS5taW4uanMnLCBjYWxsYmFjazogalF1ZXJ5TG9hZGVkfSxcbiAgICAgICAge3NyYzogJy8vY2RuanMuY2xvdWRmbGFyZS5jb20vYWpheC9saWJzL3JhY3RpdmUvMC43LjMvcmFjdGl2ZS5ydW50aW1lLm1pbi5qcyd9XG4gICAgXTtcbiAgICBpZiAoaXNPZmZsaW5lKSB7XG4gICAgICAgIC8vIFVzZSB0aGUgb2ZmbGluZSB2ZXJzaW9ucyBvZiB0aGUgbGlicmFyaWVzIGZvciBkZXZlbG9wbWVudC5cbiAgICAgICAgc2NyaXB0cyA9IFtcbiAgICAgICAgICAgIHtzcmM6IGJhc2VVcmwgKyAnL3N0YXRpYy9qcy9jZG4vanF1ZXJ5LzIuMS40L2pxdWVyeS5qcycsIGNhbGxiYWNrOiBqUXVlcnlMb2FkZWR9LFxuICAgICAgICAgICAge3NyYzogYmFzZVVybCArICcvc3RhdGljL2pzL2Nkbi9yYWN0aXZlLzAuNy4zL3JhY3RpdmUucnVudGltZS5qcyd9XG4gICAgICAgIF07XG4gICAgfVxuICAgIHZhciBsb2FkaW5nQ291bnQgPSBzY3JpcHRzLmxlbmd0aDtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNjcmlwdHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIHNjcmlwdCA9IHNjcmlwdHNbaV07XG4gICAgICAgIGxvYWRTY3JpcHQoc2NyaXB0LnNyYywgZnVuY3Rpb24oc2NyaXB0Q2FsbGJhY2spIHtcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBpZiAoc2NyaXB0Q2FsbGJhY2spIHNjcmlwdENhbGxiYWNrKCk7XG4gICAgICAgICAgICAgICAgbG9hZGluZ0NvdW50ID0gbG9hZGluZ0NvdW50IC0gMTtcbiAgICAgICAgICAgICAgICBpZiAobG9hZGluZ0NvdW50ID09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxvYWRlZENhbGxiYWNrKSBsb2FkZWRDYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gKHNjcmlwdC5jYWxsYmFjaykpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gbG9hZFNjcmlwdChzcmMsIGNhbGxiYWNrKSB7XG4gICAgdmFyIGhlYWQgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaGVhZCcpWzBdO1xuICAgIGlmIChoZWFkKSB7XG4gICAgICAgIHZhciBzY3JpcHRUYWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKTtcbiAgICAgICAgc2NyaXB0VGFnLnNldEF0dHJpYnV0ZSgnc3JjJywgc3JjKTtcbiAgICAgICAgc2NyaXB0VGFnLnNldEF0dHJpYnV0ZSgndHlwZScsJ3RleHQvamF2YXNjcmlwdCcpO1xuXG4gICAgICAgIGlmIChzY3JpcHRUYWcucmVhZHlTdGF0ZSkgeyAvLyBJRSwgaW5jbC4gSUU5XG4gICAgICAgICAgICBzY3JpcHRUYWcub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNjcmlwdFRhZy5yZWFkeVN0YXRlID09IFwibG9hZGVkXCIgfHwgc2NyaXB0VGFnLnJlYWR5U3RhdGUgPT0gXCJjb21wbGV0ZVwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHNjcmlwdFRhZy5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzY3JpcHRUYWcub25sb2FkID0gZnVuY3Rpb24oKSB7IC8vIE90aGVyIGJyb3dzZXJzXG4gICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICBoZWFkLmFwcGVuZENoaWxkKHNjcmlwdFRhZyk7XG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgbG9hZDogbG9hZFNjcmlwdHMsXG4gICAgb24kOiBvbiRcbn07IiwiXG52YXIgJDsgcmVxdWlyZSgnLi9zY3JpcHQtbG9hZGVyJykub24kKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgUmVhY3Rpb25zV2lkZ2V0ID0gcmVxdWlyZSgnLi9yZWFjdGlvbnMtd2lkZ2V0Jyk7XG5cbmZ1bmN0aW9uIGNyZWF0ZVN1bW1hcnlXaWRnZXQoY29udGFpbmVyLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIC8vLy8gVE9ETyByZXBsYWNlIGVsZW1lbnRcbiAgICB2YXIgcmFjdGl2ZSA9IFJhY3RpdmUoe1xuICAgICAgICBlbDogY29udGFpbmVyLFxuICAgICAgICBkYXRhOiBwYWdlRGF0YSxcbiAgICAgICAgbWFnaWM6IHRydWUsXG4gICAgICAgIHRlbXBsYXRlOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvc3VtbWFyeS13aWRnZXQuaHRtbCcpXG4gICAgfSk7XG4gICAgcmFjdGl2ZS5vbignY29tcGxldGUnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgJChyb290RWxlbWVudChyYWN0aXZlKSkub24oJ21vdXNlZW50ZXInLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICBvcGVuUmVhY3Rpb25zV2luZG93KHBhZ2VEYXRhLCBncm91cFNldHRpbmdzLCByYWN0aXZlKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIHJvb3RFbGVtZW50KHJhY3RpdmUpIHtcbiAgICAvLyBUT0RPOiBnb3R0YSBiZSBhIGJldHRlciB3YXkgdG8gZ2V0IHRoaXNcbiAgICAvLyBUT0RPOiBvdXIgY2xpY2sgaGFuZGxlciBpcyBnZXR0aW5nIGNhbGxlZCB0d2ljZSwgc28gaXQgbG9va3MgbGlrZSB0aGlzIHNvbWVob3cgZ2V0cyB0aGUgd3JvbmcgZWxlbWVudCBpZiB0aGVyZSBhcmUgdHdvIHN1bW1hcnkgd2lkZ2V0cyB0b2dldGhlcj9cbiAgICByZXR1cm4gcmFjdGl2ZS5maW5kKCdkaXYnKTtcbn1cblxuZnVuY3Rpb24gb3BlblJlYWN0aW9uc1dpbmRvdyhwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncywgcmFjdGl2ZSkge1xuICAgIGlmICghcmFjdGl2ZS5yZWFjdGlvbnNXaWRnZXQpIHtcbiAgICAgICAgLy8gVE9ETzogY29uc2lkZXIgcHJlcG9wdWxhdGluZyB0aGlzXG4gICAgICAgIHZhciBidWNrZXQgPSBnZXRXaWRnZXRCdWNrZXQoKTtcbiAgICAgICAgdmFyIGNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBidWNrZXQuYXBwZW5kQ2hpbGQoY29udGFpbmVyKTtcbiAgICAgICAgcmFjdGl2ZS5yZWFjdGlvbnNXaWRnZXQgPSBSZWFjdGlvbnNXaWRnZXQuY3JlYXRlKGNvbnRhaW5lciwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgIH1cbiAgICByYWN0aXZlLnJlYWN0aW9uc1dpZGdldC5vcGVuKHJvb3RFbGVtZW50KHJhY3RpdmUpKTtcbn1cblxuZnVuY3Rpb24gZ2V0V2lkZ2V0QnVja2V0KCkge1xuICAgIHZhciBidWNrZXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYW50ZW5uYS13aWRnZXQtYnVja2V0Jyk7XG4gICAgaWYgKCFidWNrZXQpIHtcbiAgICAgICAgYnVja2V0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIGJ1Y2tldC5zZXRBdHRyaWJ1dGUoJ2lkJywgJ2FudGVubmEtd2lkZ2V0LWJ1Y2tldCcpO1xuICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGJ1Y2tldCk7XG4gICAgfVxuICAgIHJldHVybiBidWNrZXQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZTogY3JlYXRlU3VtbWFyeVdpZGdldFxufTsiLCJcbnZhciBNRDUgPSByZXF1aXJlKCcuL21kNScpO1xuXG4vLyBUT0RPOiBUaGlzIGlzIGp1c3QgY29weS9wYXN0ZWQgZnJvbSBlbmdhZ2VfZnVsbFxuLy8gVE9ETzogVGhlIGNvZGUgaXMgbG9va2luZyBmb3IgLmFudF9pbmRpY2F0b3IgdG8gc2VlIGlmIGl0J3MgYWxyZWFkeSBiZWVuIGhhc2hlZC4gUmV2aWV3LlxuZnVuY3Rpb24gZ2V0Q2xlYW5UZXh0KCRkb21Ob2RlKSB7XG4gICAgLy8gQU5ULnV0aWwuZ2V0Q2xlYW5UZXh0XG4gICAgLy8gY29tbW9uIGZ1bmN0aW9uIGZvciBjbGVhbmluZyB0aGUgdGV4dCBub2RlIHRleHQuICByaWdodCBub3csIGl0J3MgcmVtb3Zpbmcgc3BhY2VzLCB0YWJzLCBuZXdsaW5lcywgYW5kIHRoZW4gZG91YmxlIHNwYWNlc1xuXG4gICAgdmFyICRub2RlID0gJGRvbU5vZGUuY2xvbmUoKTtcblxuICAgICRub2RlLmZpbmQoJy5hbnQsIC5hbnQtY3VzdG9tLWN0YS1jb250YWluZXInKS5yZW1vdmUoKTtcblxuICAgIC8vbWFrZSBzdXJlIGl0IGRvZXNudCBhbHJlZHkgaGF2ZSBpbiBpbmRpY2F0b3IgLSBpdCBzaG91bGRuJ3QuXG4gICAgdmFyICRpbmRpY2F0b3IgPSAkbm9kZS5maW5kKCcuYW50X2luZGljYXRvcicpO1xuICAgIGlmKCRpbmRpY2F0b3IubGVuZ3RoKXtcbiAgICAgICAgLy90b2RvOiBzZW5kIHVzIGFuIGVycm9yIHJlcG9ydCAtIHRoaXMgbWF5IHN0aWxsIGJlIGhhcHBlbmluZyBmb3Igc2xpZGVzaG93cy5cbiAgICAgICAgLy9UaGlzIGZpeCB3b3JrcyBmaW5lLCBidXQgd2Ugc2hvdWxkIGZpeCB0aGUgY29kZSB0byBoYW5kbGUgaXQgYmVmb3JlIGhlcmUuXG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBnZXQgdGhlIG5vZGUncyB0ZXh0IGFuZCBzbWFzaCBjYXNlXG4gICAgLy8gVE9ETzogPGJyPiB0YWdzIGFuZCBibG9jay1sZXZlbCB0YWdzIGNhbiBzY3JldyB1cCB3b3Jkcy4gIGV4OlxuICAgIC8vIGhlbGxvPGJyPmhvdyBhcmUgeW91PyAgIGhlcmUgYmVjb21lc1xuICAgIC8vIGhlbGxvaG93IGFyZSB5b3U/ICAgIDwtLSBubyBzcGFjZSB3aGVyZSB0aGUgPGJyPiB3YXMuICBiYWQuXG4gICAgdmFyIG5vZGVfdGV4dCA9ICQudHJpbSggJG5vZGUuaHRtbCgpLnJlcGxhY2UoLzwgKmJyICpcXC8/Pi9naSwgJyAnKSApO1xuICAgIHZhciBib2R5ID0gJC50cmltKCAkKCBcIjxkaXY+XCIgKyBub2RlX3RleHQgKyBcIjwvZGl2PlwiICkudGV4dCgpLnRvTG93ZXJDYXNlKCkgKTtcblxuICAgIGlmKCBib2R5ICYmIHR5cGVvZiBib2R5ID09IFwic3RyaW5nXCIgJiYgYm9keSAhPT0gXCJcIiApIHtcbiAgICAgICAgdmFyIGZpcnN0cGFzcyA9IGJvZHkucmVwbGFjZSgvW1xcblxcclxcdF0rL2dpLCcgJykucmVwbGFjZSgpLnJlcGxhY2UoL1xcc3syLH0vZywnICcpO1xuICAgICAgICAvLyBzZWVpbmcgaWYgdGhpcyBoZWxwcyB0aGUgcHJvcHViIGlzc3VlIC0gdG8gdHJpbSBhZ2Fpbi4gIFdoZW4gaSBydW4gdGhpcyBsaW5lIGFib3ZlIGl0IGxvb2tzIGxpa2UgdGhlcmUgaXMgc3RpbGwgd2hpdGUgc3BhY2UuXG4gICAgICAgIHJldHVybiAkLnRyaW0oZmlyc3RwYXNzKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGhhc2hUZXh0KGVsZW1lbnQpIHtcbiAgICAvLyBUT0RPOiBIYW5kbGUgdGhlIGNhc2Ugd2hlcmUgbXVsdGlwbGUgaW5zdGFuY2VzIG9mIHRoZSBzYW1lIHRleHQgYXBwZWFyIG9uIHRoZSBwYWdlLiBOZWVkIHRvIGFkZCBhbiBpbmNyZW1lbnQgdG9cbiAgICAvLyB0aGUgaGFzaFRleHQuIChUaGlzIGNoZWNrIGhhcyB0byBiZSBzY29wZWQgdG8gYSBwb3N0KVxuICAgIHZhciB0ZXh0ID0gZ2V0Q2xlYW5UZXh0KGVsZW1lbnQpO1xuICAgIHZhciBoYXNoVGV4dCA9IFwicmRyLXRleHQtXCIrdGV4dDtcbiAgICByZXR1cm4gTUQ1LmhleF9tZDUoaGFzaFRleHQpO1xufVxuXG5mdW5jdGlvbiBoYXNoVXJsKHVybCkge1xuICAgIHJldHVybiBNRDUuaGV4X21kNSh1cmwpO1xufVxuXG5mdW5jdGlvbiBoYXNoSW1hZ2UoZWxlbWVudCkge1xuXG59XG5cbmZ1bmN0aW9uIGhhc2hNZWRpYShlbGVtZW50KSB7XG5cbn1cblxuZnVuY3Rpb24gaGFzaEVsZW1lbnQoZWxlbWVudCkge1xuICAgIC8vIFRPRE8gbWFrZSByZWFsXG4gICAgcmV0dXJuICdhYmMnO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgaGFzaFRleHQ6IGhhc2hUZXh0LFxuICAgIGhhc2hVcmw6IGhhc2hVcmxcbn07IiwiXG4vLyBUT0RPOiBUaGlzIGNvZGUgaXMganVzdCBjb3BpZWQgZnJvbSBlbmdhZ2VfZnVsbC5qcy4gUmV2aWV3IHdoZXRoZXIgd2Ugd2FudCB0byBrZWVwIGl0IGFzLWlzLlxuXG52YXIgQU5UID0ge1xuICAgIHV0aWw6IHtcbiAgICAgICAgbWQ1OiB7XG4gICAgICAgICAgICBoZXhjYXNlOjAsXG4gICAgICAgICAgICBiNjRwYWQ6XCJcIixcbiAgICAgICAgICAgIGNocnN6OjgsXG4gICAgICAgICAgICBoZXhfbWQ1OiBmdW5jdGlvbihzKXtyZXR1cm4gQU5ULnV0aWwubWQ1LmJpbmwyaGV4KEFOVC51dGlsLm1kNS5jb3JlX21kNShBTlQudXRpbC5tZDUuc3RyMmJpbmwocykscy5sZW5ndGgqQU5ULnV0aWwubWQ1LmNocnN6KSk7fSxcbiAgICAgICAgICAgIGNvcmVfbWQ1OiBmdW5jdGlvbih4LGxlbil7eFtsZW4+PjVdfD0weDgwPDwoKGxlbiklMzIpO3hbKCgobGVuKzY0KT4+PjkpPDw0KSsxNF09bGVuO3ZhciBhPTE3MzI1ODQxOTM7dmFyIGI9LTI3MTczMzg3OTt2YXIgYz0tMTczMjU4NDE5NDt2YXIgZD0yNzE3MzM4Nzg7Zm9yKHZhciBpPTA7aTx4Lmxlbmd0aDtpKz0xNil7dmFyIG9sZGE9YTt2YXIgb2xkYj1iO3ZhciBvbGRjPWM7dmFyIG9sZGQ9ZDthPUFOVC51dGlsLm1kNS5tZDVfZmYoYSxiLGMsZCx4W2krMF0sNywtNjgwODc2OTM2KTtkPUFOVC51dGlsLm1kNS5tZDVfZmYoZCxhLGIsYyx4W2krMV0sMTIsLTM4OTU2NDU4Nik7Yz1BTlQudXRpbC5tZDUubWQ1X2ZmKGMsZCxhLGIseFtpKzJdLDE3LDYwNjEwNTgxOSk7Yj1BTlQudXRpbC5tZDUubWQ1X2ZmKGIsYyxkLGEseFtpKzNdLDIyLC0xMDQ0NTI1MzMwKTthPUFOVC51dGlsLm1kNS5tZDVfZmYoYSxiLGMsZCx4W2krNF0sNywtMTc2NDE4ODk3KTtkPUFOVC51dGlsLm1kNS5tZDVfZmYoZCxhLGIsYyx4W2krNV0sMTIsMTIwMDA4MDQyNik7Yz1BTlQudXRpbC5tZDUubWQ1X2ZmKGMsZCxhLGIseFtpKzZdLDE3LC0xNDczMjMxMzQxKTtiPUFOVC51dGlsLm1kNS5tZDVfZmYoYixjLGQsYSx4W2krN10sMjIsLTQ1NzA1OTgzKTthPUFOVC51dGlsLm1kNS5tZDVfZmYoYSxiLGMsZCx4W2krOF0sNywxNzcwMDM1NDE2KTtkPUFOVC51dGlsLm1kNS5tZDVfZmYoZCxhLGIsYyx4W2krOV0sMTIsLTE5NTg0MTQ0MTcpO2M9QU5ULnV0aWwubWQ1Lm1kNV9mZihjLGQsYSxiLHhbaSsxMF0sMTcsLTQyMDYzKTtiPUFOVC51dGlsLm1kNS5tZDVfZmYoYixjLGQsYSx4W2krMTFdLDIyLC0xOTkwNDA0MTYyKTthPUFOVC51dGlsLm1kNS5tZDVfZmYoYSxiLGMsZCx4W2krMTJdLDcsMTgwNDYwMzY4Mik7ZD1BTlQudXRpbC5tZDUubWQ1X2ZmKGQsYSxiLGMseFtpKzEzXSwxMiwtNDAzNDExMDEpO2M9QU5ULnV0aWwubWQ1Lm1kNV9mZihjLGQsYSxiLHhbaSsxNF0sMTcsLTE1MDIwMDIyOTApO2I9QU5ULnV0aWwubWQ1Lm1kNV9mZihiLGMsZCxhLHhbaSsxNV0sMjIsMTIzNjUzNTMyOSk7YT1BTlQudXRpbC5tZDUubWQ1X2dnKGEsYixjLGQseFtpKzFdLDUsLTE2NTc5NjUxMCk7ZD1BTlQudXRpbC5tZDUubWQ1X2dnKGQsYSxiLGMseFtpKzZdLDksLTEwNjk1MDE2MzIpO2M9QU5ULnV0aWwubWQ1Lm1kNV9nZyhjLGQsYSxiLHhbaSsxMV0sMTQsNjQzNzE3NzEzKTtiPUFOVC51dGlsLm1kNS5tZDVfZ2coYixjLGQsYSx4W2krMF0sMjAsLTM3Mzg5NzMwMik7YT1BTlQudXRpbC5tZDUubWQ1X2dnKGEsYixjLGQseFtpKzVdLDUsLTcwMTU1ODY5MSk7ZD1BTlQudXRpbC5tZDUubWQ1X2dnKGQsYSxiLGMseFtpKzEwXSw5LDM4MDE2MDgzKTtjPUFOVC51dGlsLm1kNS5tZDVfZ2coYyxkLGEsYix4W2krMTVdLDE0LC02NjA0NzgzMzUpO2I9QU5ULnV0aWwubWQ1Lm1kNV9nZyhiLGMsZCxhLHhbaSs0XSwyMCwtNDA1NTM3ODQ4KTthPUFOVC51dGlsLm1kNS5tZDVfZ2coYSxiLGMsZCx4W2krOV0sNSw1Njg0NDY0MzgpO2Q9QU5ULnV0aWwubWQ1Lm1kNV9nZyhkLGEsYixjLHhbaSsxNF0sOSwtMTAxOTgwMzY5MCk7Yz1BTlQudXRpbC5tZDUubWQ1X2dnKGMsZCxhLGIseFtpKzNdLDE0LC0xODczNjM5NjEpO2I9QU5ULnV0aWwubWQ1Lm1kNV9nZyhiLGMsZCxhLHhbaSs4XSwyMCwxMTYzNTMxNTAxKTthPUFOVC51dGlsLm1kNS5tZDVfZ2coYSxiLGMsZCx4W2krMTNdLDUsLTE0NDQ2ODE0NjcpO2Q9QU5ULnV0aWwubWQ1Lm1kNV9nZyhkLGEsYixjLHhbaSsyXSw5LC01MTQwMzc4NCk7Yz1BTlQudXRpbC5tZDUubWQ1X2dnKGMsZCxhLGIseFtpKzddLDE0LDE3MzUzMjg0NzMpO2I9QU5ULnV0aWwubWQ1Lm1kNV9nZyhiLGMsZCxhLHhbaSsxMl0sMjAsLTE5MjY2MDc3MzQpO2E9QU5ULnV0aWwubWQ1Lm1kNV9oaChhLGIsYyxkLHhbaSs1XSw0LC0zNzg1NTgpO2Q9QU5ULnV0aWwubWQ1Lm1kNV9oaChkLGEsYixjLHhbaSs4XSwxMSwtMjAyMjU3NDQ2Myk7Yz1BTlQudXRpbC5tZDUubWQ1X2hoKGMsZCxhLGIseFtpKzExXSwxNiwxODM5MDMwNTYyKTtiPUFOVC51dGlsLm1kNS5tZDVfaGgoYixjLGQsYSx4W2krMTRdLDIzLC0zNTMwOTU1Nik7YT1BTlQudXRpbC5tZDUubWQ1X2hoKGEsYixjLGQseFtpKzFdLDQsLTE1MzA5OTIwNjApO2Q9QU5ULnV0aWwubWQ1Lm1kNV9oaChkLGEsYixjLHhbaSs0XSwxMSwxMjcyODkzMzUzKTtjPUFOVC51dGlsLm1kNS5tZDVfaGgoYyxkLGEsYix4W2krN10sMTYsLTE1NTQ5NzYzMik7Yj1BTlQudXRpbC5tZDUubWQ1X2hoKGIsYyxkLGEseFtpKzEwXSwyMywtMTA5NDczMDY0MCk7YT1BTlQudXRpbC5tZDUubWQ1X2hoKGEsYixjLGQseFtpKzEzXSw0LDY4MTI3OTE3NCk7ZD1BTlQudXRpbC5tZDUubWQ1X2hoKGQsYSxiLGMseFtpKzBdLDExLC0zNTg1MzcyMjIpO2M9QU5ULnV0aWwubWQ1Lm1kNV9oaChjLGQsYSxiLHhbaSszXSwxNiwtNzIyNTIxOTc5KTtiPUFOVC51dGlsLm1kNS5tZDVfaGgoYixjLGQsYSx4W2krNl0sMjMsNzYwMjkxODkpO2E9QU5ULnV0aWwubWQ1Lm1kNV9oaChhLGIsYyxkLHhbaSs5XSw0LC02NDAzNjQ0ODcpO2Q9QU5ULnV0aWwubWQ1Lm1kNV9oaChkLGEsYixjLHhbaSsxMl0sMTEsLTQyMTgxNTgzNSk7Yz1BTlQudXRpbC5tZDUubWQ1X2hoKGMsZCxhLGIseFtpKzE1XSwxNiw1MzA3NDI1MjApO2I9QU5ULnV0aWwubWQ1Lm1kNV9oaChiLGMsZCxhLHhbaSsyXSwyMywtOTk1MzM4NjUxKTthPUFOVC51dGlsLm1kNS5tZDVfaWkoYSxiLGMsZCx4W2krMF0sNiwtMTk4NjMwODQ0KTtkPUFOVC51dGlsLm1kNS5tZDVfaWkoZCxhLGIsYyx4W2krN10sMTAsMTEyNjg5MTQxNSk7Yz1BTlQudXRpbC5tZDUubWQ1X2lpKGMsZCxhLGIseFtpKzE0XSwxNSwtMTQxNjM1NDkwNSk7Yj1BTlQudXRpbC5tZDUubWQ1X2lpKGIsYyxkLGEseFtpKzVdLDIxLC01NzQzNDA1NSk7YT1BTlQudXRpbC5tZDUubWQ1X2lpKGEsYixjLGQseFtpKzEyXSw2LDE3MDA0ODU1NzEpO2Q9QU5ULnV0aWwubWQ1Lm1kNV9paShkLGEsYixjLHhbaSszXSwxMCwtMTg5NDk4NjYwNik7Yz1BTlQudXRpbC5tZDUubWQ1X2lpKGMsZCxhLGIseFtpKzEwXSwxNSwtMTA1MTUyMyk7Yj1BTlQudXRpbC5tZDUubWQ1X2lpKGIsYyxkLGEseFtpKzFdLDIxLC0yMDU0OTIyNzk5KTthPUFOVC51dGlsLm1kNS5tZDVfaWkoYSxiLGMsZCx4W2krOF0sNiwxODczMzEzMzU5KTtkPUFOVC51dGlsLm1kNS5tZDVfaWkoZCxhLGIsYyx4W2krMTVdLDEwLC0zMDYxMTc0NCk7Yz1BTlQudXRpbC5tZDUubWQ1X2lpKGMsZCxhLGIseFtpKzZdLDE1LC0xNTYwMTk4MzgwKTtiPUFOVC51dGlsLm1kNS5tZDVfaWkoYixjLGQsYSx4W2krMTNdLDIxLDEzMDkxNTE2NDkpO2E9QU5ULnV0aWwubWQ1Lm1kNV9paShhLGIsYyxkLHhbaSs0XSw2LC0xNDU1MjMwNzApO2Q9QU5ULnV0aWwubWQ1Lm1kNV9paShkLGEsYixjLHhbaSsxMV0sMTAsLTExMjAyMTAzNzkpO2M9QU5ULnV0aWwubWQ1Lm1kNV9paShjLGQsYSxiLHhbaSsyXSwxNSw3MTg3ODcyNTkpO2I9QU5ULnV0aWwubWQ1Lm1kNV9paShiLGMsZCxhLHhbaSs5XSwyMSwtMzQzNDg1NTUxKTthPUFOVC51dGlsLm1kNS5zYWZlX2FkZChhLG9sZGEpO2I9QU5ULnV0aWwubWQ1LnNhZmVfYWRkKGIsb2xkYik7Yz1BTlQudXRpbC5tZDUuc2FmZV9hZGQoYyxvbGRjKTtkPUFOVC51dGlsLm1kNS5zYWZlX2FkZChkLG9sZGQpO30gcmV0dXJuIEFycmF5KGEsYixjLGQpO30sXG4gICAgICAgICAgICBtZDVfY21uOiBmdW5jdGlvbihxLGEsYix4LHMsdCl7cmV0dXJuIEFOVC51dGlsLm1kNS5zYWZlX2FkZChBTlQudXRpbC5tZDUuYml0X3JvbChBTlQudXRpbC5tZDUuc2FmZV9hZGQoQU5ULnV0aWwubWQ1LnNhZmVfYWRkKGEscSksQU5ULnV0aWwubWQ1LnNhZmVfYWRkKHgsdCkpLHMpLGIpO30sXG4gICAgICAgICAgICBtZDVfZmY6IGZ1bmN0aW9uKGEsYixjLGQseCxzLHQpe3JldHVybiBBTlQudXRpbC5tZDUubWQ1X2NtbigoYiZjKXwoKH5iKSZkKSxhLGIseCxzLHQpO30sXG4gICAgICAgICAgICBtZDVfZ2c6IGZ1bmN0aW9uKGEsYixjLGQseCxzLHQpe3JldHVybiBBTlQudXRpbC5tZDUubWQ1X2NtbigoYiZkKXwoYyYofmQpKSxhLGIseCxzLHQpO30sXG4gICAgICAgICAgICBtZDVfaGg6IGZ1bmN0aW9uKGEsYixjLGQseCxzLHQpe3JldHVybiBBTlQudXRpbC5tZDUubWQ1X2NtbihiXmNeZCxhLGIseCxzLHQpO30sXG4gICAgICAgICAgICBtZDVfaWk6IGZ1bmN0aW9uKGEsYixjLGQseCxzLHQpe3JldHVybiBBTlQudXRpbC5tZDUubWQ1X2NtbihjXihifCh+ZCkpLGEsYix4LHMsdCk7fSxcbiAgICAgICAgICAgIHNhZmVfYWRkOiBmdW5jdGlvbih4LHkpe3ZhciBsc3c9KHgmMHhGRkZGKSsoeSYweEZGRkYpO3ZhciBtc3c9KHg+PjE2KSsoeT4+MTYpKyhsc3c+PjE2KTtyZXR1cm4obXN3PDwxNil8KGxzdyYweEZGRkYpO30sXG4gICAgICAgICAgICBiaXRfcm9sOiBmdW5jdGlvbihudW0sY250KXtyZXR1cm4obnVtPDxjbnQpfChudW0+Pj4oMzItY250KSk7fSxcbiAgICAgICAgICAgIC8vdGhlIGxpbmUgYmVsb3cgaXMgY2FsbGVkIG91dCBieSBqc0xpbnQgYmVjYXVzZSBpdCB1c2VzIEFycmF5KCkgaW5zdGVhZCBvZiBbXS4gIFdlIGNhbiBpZ25vcmUsIG9yIEknbSBzdXJlIHdlIGNvdWxkIGNoYW5nZSBpdCBpZiB3ZSB3YW50ZWQgdG8uXG4gICAgICAgICAgICBzdHIyYmlubDogZnVuY3Rpb24oc3RyKXt2YXIgYmluPUFycmF5KCk7dmFyIG1hc2s9KDE8PEFOVC51dGlsLm1kNS5jaHJzeiktMTtmb3IodmFyIGk9MDtpPHN0ci5sZW5ndGgqQU5ULnV0aWwubWQ1LmNocnN6O2krPUFOVC51dGlsLm1kNS5jaHJzeil7YmluW2k+PjVdfD0oc3RyLmNoYXJDb2RlQXQoaS9BTlQudXRpbC5tZDUuY2hyc3opJm1hc2spPDwoaSUzMik7fXJldHVybiBiaW47fSxcbiAgICAgICAgICAgIGJpbmwyaGV4OiBmdW5jdGlvbihiaW5hcnJheSl7dmFyIGhleF90YWI9QU5ULnV0aWwubWQ1LmhleGNhc2U/XCIwMTIzNDU2Nzg5QUJDREVGXCI6XCIwMTIzNDU2Nzg5YWJjZGVmXCI7dmFyIHN0cj1cIlwiO2Zvcih2YXIgaT0wO2k8YmluYXJyYXkubGVuZ3RoKjQ7aSsrKXtzdHIrPWhleF90YWIuY2hhckF0KChiaW5hcnJheVtpPj4yXT4+KChpJTQpKjgrNCkpJjB4RikraGV4X3RhYi5jaGFyQXQoKGJpbmFycmF5W2k+PjJdPj4oKGklNCkqOCkpJjB4Rik7fSByZXR1cm4gc3RyO31cbiAgICAgICAgfVxuICAgIH1cbn07XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBoZXhfbWQ1OiBBTlQudXRpbC5tZDUuaGV4X21kNVxufTsiLCJcbnZhciAkOyByZXF1aXJlKCcuLi9zY3JpcHQtbG9hZGVyJykub24kKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG5cbmZ1bmN0aW9uIG1ha2VNb3ZlYWJsZSgkZWxlbWVudCwgJGRyYWdIYW5kbGUpIHtcbiAgICAkZHJhZ0hhbmRsZS5vbignbW91c2Vkb3duLmFudGVubmEnLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICB2YXIgb2Zmc2V0WCA9IGV2ZW50LnBhZ2VYIC0gJGRyYWdIYW5kbGUub2Zmc2V0KCkubGVmdDtcbiAgICAgICAgdmFyIG9mZnNldFkgPSBldmVudC5wYWdlWSAtICRkcmFnSGFuZGxlLm9mZnNldCgpLnRvcDtcbiAgICAgICAgJChkb2N1bWVudCkub24oJ21vdXNldXAuYW50ZW5uYScsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICAkKGRvY3VtZW50KS5vZmYoJ21vdXNlbW92ZS5hbnRlbm5hJyk7XG4gICAgICAgIH0pO1xuICAgICAgICAkKGRvY3VtZW50KS5vbignbW91c2Vtb3ZlLmFudGVubmEnLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgJGVsZW1lbnQuY3NzKHtcbiAgICAgICAgICAgICAgICB0b3A6IGV2ZW50LnBhZ2VZIC0gb2Zmc2V0WSxcbiAgICAgICAgICAgICAgICBsZWZ0OiBldmVudC5wYWdlWCAtIG9mZnNldFhcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgbWFrZU1vdmVhYmxlOiBtYWtlTW92ZWFibGVcbn07IiwiXG52YXIgb2ZmbGluZTtcblxuZnVuY3Rpb24gaXNPZmZsaW5lKCkge1xuICAgIGlmIChvZmZsaW5lID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgLy8gVE9ETzogRG8gc29tZXRoaW5nIGNyb3NzLWJyb3dzZXIgaGVyZS4gVGhpcyB3b24ndCB3b3JrIGluIElFLlxuICAgICAgICAvLyBUT0RPOiBNYWtlIHRoaXMgbW9yZSBmbGV4aWJsZSBzbyBpdCB3b3JrcyBpbiBldmVyeW9uZSdzIGRldiBlbnZpcm9ubWVudFxuICAgICAgICBvZmZsaW5lID0gZG9jdW1lbnQuY3VycmVudFNjcmlwdC5zcmMgPT09ICdodHRwOi8vbG9jYWxob3N0OjgwODEvc3RhdGljL3dpZGdldC1uZXcvZGVidWcvYW50ZW5uYS5qcyc7XG4gICAgfVxuICAgIHJldHVybiBvZmZsaW5lO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzT2ZmbGluZSgpOyIsIlxudmFyICQ7IHJlcXVpcmUoJy4uL3NjcmlwdC1sb2FkZXInKS5vbiQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcblxudmFyIG9mZmxpbmUgPSByZXF1aXJlKCcuL29mZmxpbmUuanMnKTtcblxuZnVuY3Rpb24gYW50ZW5uYUhvbWUoKSB7XG4gICAgaWYgKG9mZmxpbmUpIHtcbiAgICAgICAgcmV0dXJuIHdpbmRvdy5sb2NhdGlvbi5wcm90b2NvbCArIFwiLy9sb2NhbC5hbnRlbm5hLmlzOjgwODFcIjtcbiAgICB9XG4gICAgcmV0dXJuIHdpbmRvdy5sb2NhdGlvbi5wcm90b2NvbCArIFwiLy93d3cuYW50ZW5uYS5pc1wiO1xufVxuXG4vLyBUT0RPIGNvcGllZCBmcm9tIGVuZ2FnZV9mdWxsLiBSZXZpZXcuXG5mdW5jdGlvbiBjb21wdXRlUGFnZVVybChncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIHBhZ2VfdXJsID0gJC50cmltKCB3aW5kb3cubG9jYXRpb24uaHJlZi5zcGxpdCgnIycpWzBdICkudG9Mb3dlckNhc2UoKTsgLy8gVE9ETyBzaG91bGQgcGFzcyB0aGlzIGluIGluc3RlYWQgb2YgcmVjb21wdXRpbmdcbiAgICByZXR1cm4gcmVtb3ZlU3ViZG9tYWluRnJvbVBhZ2VVcmwocGFnZV91cmwsIGdyb3VwU2V0dGluZ3MpO1xufVxuXG4vLyBUT0RPIGNvcGllZCBmcm9tIGVuZ2FnZV9mdWxsLiBSZXZpZXcuXG5mdW5jdGlvbiBjb21wdXRlVG9wTGV2ZWxDYW5vbmljYWxVcmwoZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBwYWdlX3VybCA9ICQudHJpbSggd2luZG93LmxvY2F0aW9uLmhyZWYuc3BsaXQoJyMnKVswXSApLnRvTG93ZXJDYXNlKCk7IC8vIFRPRE8gc2hvdWxkIHBhc3MgdGhpcyBpbiBpbnN0ZWFkIG9mIHJlY29tcHV0aW5nXG4gICAgdmFyIGNhbm9uaWNhbF91cmwgPSAoICQoJ2xpbmtbcmVsPVwiY2Fub25pY2FsXCJdJykubGVuZ3RoID4gMCApID9cbiAgICAgICAgICAgICAgICAkKCdsaW5rW3JlbD1cImNhbm9uaWNhbFwiXScpLmF0dHIoJ2hyZWYnKSA6IHBhZ2VfdXJsO1xuXG4gICAgLy8gYW50OnVybCBvdmVycmlkZXNcbiAgICBpZiAoICQoJ1twcm9wZXJ0eT1cImFudGVubmE6dXJsXCJdJykubGVuZ3RoID4gMCApIHtcbiAgICAgICAgY2Fub25pY2FsX3VybCA9ICQoJ1twcm9wZXJ0eT1cImFudGVubmE6dXJsXCJdJykuYXR0cignY29udGVudCcpO1xuICAgIH1cblxuICAgIGNhbm9uaWNhbF91cmwgPSAkLnRyaW0oIGNhbm9uaWNhbF91cmwudG9Mb3dlckNhc2UoKSApO1xuXG4gICAgaWYgKGNhbm9uaWNhbF91cmwgPT0gY29tcHV0ZVBhZ2VVcmwoZ3JvdXBTZXR0aW5ncykgKSB7IC8vIFRPRE8gc2hvdWxkIHBhc3MgdGhpcyBpbiBpbnN0ZWFkIG9mIHJlY29tcHV0aW5nXG4gICAgICAgIGNhbm9uaWNhbF91cmwgPSBcInNhbWVcIjtcbiAgICB9XG5cbiAgICAvLyBmYXN0Y28gZml4IChzaW5jZSB0aGV5IHNvbWV0aW1lcyByZXdyaXRlIHRoZWlyIGNhbm9uaWNhbCB0byBzaW1wbHkgYmUgdGhlaXIgVExELilcbiAgICAvLyBpbiB0aGUgY2FzZSB3aGVyZSBjYW5vbmljYWwgY2xhaW1zIFRMRCBidXQgd2UncmUgYWN0dWFsbHkgb24gYW4gYXJ0aWNsZS4uLiBzZXQgY2Fub25pY2FsIHRvIGJlIHRoZSBwYWdlX3VybFxuICAgIHZhciB0bGQgPSAkLnRyaW0od2luZG93LmxvY2F0aW9uLnByb3RvY29sKycvLycrd2luZG93LmxvY2F0aW9uLmhvc3RuYW1lKycvJykudG9Mb3dlckNhc2UoKTtcbiAgICBpZiAoIGNhbm9uaWNhbF91cmwgPT0gdGxkICkge1xuICAgICAgICBpZiAocGFnZV91cmwgIT0gdGxkKSB7XG4gICAgICAgICAgICBjYW5vbmljYWxfdXJsID0gcGFnZV91cmw7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcmVtb3ZlU3ViZG9tYWluRnJvbVBhZ2VVcmwoJC50cmltKGNhbm9uaWNhbF91cmwpLCBncm91cFNldHRpbmdzKTtcbn1cblxuZnVuY3Rpb24gZ2V0Q3JlYXRlUmVhY3Rpb25VcmwoKSB7XG4gICAgcmV0dXJuICcvYXBpL3RhZy9jcmVhdGUnO1xufVxuXG5mdW5jdGlvbiBjb21wdXRlUGFnZUVsZW1lbnRDYW5vbmljYWxVcmwoJHBhZ2VFbGVtZW50LCBncm91cFNldHRpbmdzKSB7XG4gICAgLy8gVE9ETyBSZXZpZXcgYWdhaW5zdCBlbmdhZ2VfZnVsbC4gVGhlcmUsIHRoZSBuZXN0ZWQgcGFnZXMgYW5kIHRvcC1sZXZlbCBwYWdlIGhhdmUgYSB0b3RhbGx5IGRpZmZlcmVudCBmbG93LiBEb2VzIHRoaXNcbiAgICAvLyB1bmlmaWNhdGlvbiB3b3JrPyBUaGUgaWRlYSBpcyB0aGF0IHRoZSBuZXN0ZWQgcGFnZXMgd291bGQgaGF2ZSBhbiBocmVmIHNlbGVjdG9yIHRoYXQgc3BlY2lmaWVzIHRoZSBVUkwgdG8gdXNlLCBzbyB3ZVxuICAgIC8vIGp1c3QgdXNlIGl0LiBCdXQgY29tcHV0ZSB0aGUgdXJsIGZvciB0aGUgdG9wLWxldmVsIGNhc2UgZXhwbGljaXRseS5cbiAgICBpZiAoJHBhZ2VFbGVtZW50LmZpbmQoZ3JvdXBTZXR0aW5ncy5wYWdlSHJlZlNlbGVjdG9yKCkpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgcmV0dXJuICdzYW1lJztcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gY29tcHV0ZVRvcExldmVsQ2Fub25pY2FsVXJsKGdyb3VwU2V0dGluZ3MpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gY29tcHV0ZVBhZ2VFbGVtZW50VXJsKCRwYWdlRWxlbWVudCwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciB1cmwgPSAkcGFnZUVsZW1lbnQuZmluZChncm91cFNldHRpbmdzLnBhZ2VIcmVmU2VsZWN0b3IoKSkuYXR0cignaHJlZicpO1xuICAgIGlmICghdXJsKSB7XG4gICAgICAgIHVybCA9ICQudHJpbSggd2luZG93LmxvY2F0aW9uLmhyZWYuc3BsaXQoJyMnKVswXSApLnRvTG93ZXJDYXNlKCk7IC8vIHRvcC1sZXZlbCBwYWdlIHVybFxuICAgIH1cbiAgICByZXR1cm4gcmVtb3ZlU3ViZG9tYWluRnJvbVBhZ2VVcmwodXJsLCBncm91cFNldHRpbmdzKTtcbn1cblxuLy8gVE9ETyBjb3BpZWQgZnJvbSBlbmdhZ2VfZnVsbC4gUmV2aWV3LlxuZnVuY3Rpb24gcmVtb3ZlU3ViZG9tYWluRnJvbVBhZ2VVcmwodXJsLCBncm91cFNldHRpbmdzKSB7XG4gICAgLy8gQU5ULmFjdGlvbnMucmVtb3ZlU3ViZG9tYWluRnJvbVBhZ2VVcmw6XG4gICAgLy8gaWYgXCJpZ25vcmVfc3ViZG9tYWluXCIgaXMgY2hlY2tlZCBpbiBzZXR0aW5ncywgQU5EIHRoZXkgc3VwcGx5IGEgVExELFxuICAgIC8vIHRoZW4gbW9kaWZ5IHRoZSBwYWdlIGFuZCBjYW5vbmljYWwgVVJMcyBoZXJlLlxuICAgIC8vIGhhdmUgdG8gaGF2ZSB0aGVtIHN1cHBseSBvbmUgYmVjYXVzZSB0aGVyZSBhcmUgdG9vIG1hbnkgdmFyaWF0aW9ucyB0byByZWxpYWJseSBzdHJpcCBzdWJkb21haW5zICAoLmNvbSwgLmlzLCAuY29tLmFyLCAuY28udWssIGV0YylcbiAgICBpZiAoZ3JvdXBTZXR0aW5ncy51cmwuaWdub3JlU3ViZG9tYWluKCkgPT0gdHJ1ZSAmJiBncm91cFNldHRpbmdzLnVybC5jYW5vbmljYWxEb21haW4oKSkge1xuICAgICAgICB2YXIgSE9TVERPTUFJTiA9IC9bLVxcd10rXFwuKD86Wy1cXHddK1xcLnhuLS1bLVxcd10rfFstXFx3XXsyLH18Wy1cXHddK1xcLlstXFx3XXsyfSkkL2k7XG4gICAgICAgIHZhciBzcmNBcnJheSA9IHVybC5zcGxpdCgnLycpO1xuXG4gICAgICAgIHZhciBwcm90b2NvbCA9IHNyY0FycmF5WzBdO1xuICAgICAgICBzcmNBcnJheS5zcGxpY2UoMCwzKTtcblxuICAgICAgICB2YXIgcmV0dXJuVXJsID0gcHJvdG9jb2wgKyAnLy8nICsgZ3JvdXBTZXR0aW5ncy51cmwuY2Fub25pY2FsRG9tYWluKCkgKyAnLycgKyBzcmNBcnJheS5qb2luKCcvJyk7XG5cbiAgICAgICAgcmV0dXJuIHJldHVyblVybDtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdXJsO1xuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY29tcHV0ZVBhZ2VVcmw6IGNvbXB1dGVQYWdlRWxlbWVudFVybCxcbiAgICBjb21wdXRlQ2Fub25pY2FsVXJsOiBjb21wdXRlUGFnZUVsZW1lbnRDYW5vbmljYWxVcmwsXG4gICAgYW50ZW5uYUhvbWU6IGFudGVubmFIb21lLFxuICAgIGNyZWF0ZVJlYWN0aW9uVXJsOiBnZXRDcmVhdGVSZWFjdGlvblVybFxufTsiLCJcbnZhciBVUkxzID0gcmVxdWlyZSgnLi91cmxzJyk7XG5cbi8vIFJlZ2lzdGVyIG91cnNlbHZlcyB0byBoZWFyIG1lc3NhZ2VzXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcIm1lc3NhZ2VcIiwgcmVjZWl2ZU1lc3NhZ2UsIGZhbHNlKTtcblxudmFyIGNhbGxiYWNrcyA9IHsgJ3hkbSBsb2FkZWQnOiB4ZG1Mb2FkZWQgfTtcbnZhciBjYWNoZSA9IHt9O1xuXG52YXIgaXNYRE1Mb2FkZWQgPSBmYWxzZTtcbi8vIFRoZSBpbml0aWFsIG1lc3NhZ2UgdGhhdCBYRE0gc2VuZHMgb3V0IHdoZW4gaXQgbG9hZHNcbmZ1bmN0aW9uIHhkbUxvYWRlZChkYXRhKSB7XG4gICAgaXNYRE1Mb2FkZWQgPSB0cnVlO1xufVxuXG5mdW5jdGlvbiBnZXRVc2VyKGNhbGxiYWNrKSB7XG4gICAgdmFyIG1lc3NhZ2UgPSAnZ2V0VXNlcic7XG4gICAgcG9zdE1lc3NhZ2UobWVzc2FnZSwgJ3JldHVybmluZ191c2VyJywgY2FsbGJhY2ssIHZhbGlkQ2FjaGVFbnRyeSk7XG5cbiAgICBmdW5jdGlvbiB2YWxpZENhY2hlRW50cnkocmVzcG9uc2UpIHtcbiAgICAgICAgdmFyIHVzZXJJbmZvID0gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgcmV0dXJuIHVzZXJJbmZvICYmIHVzZXJJbmZvLmFudF90b2tlbiAmJiB1c2VySW5mby51c2VyX2lkOyAvLyBUT0RPICYmIHVzZXJJbmZvLnVzZXJfdHlwZT9cbiAgICB9XG59XG5cbmZ1bmN0aW9uIHJlY2VpdmVNZXNzYWdlKGV2ZW50KSB7XG4gICAgdmFyIGV2ZW50T3JpZ2luID0gZXZlbnQub3JpZ2luO1xuICAgIGlmIChldmVudE9yaWdpbiA9PT0gVVJMcy5hbnRlbm5hSG9tZSgpKSB7XG4gICAgICAgIHZhciByZXNwb25zZSA9IEpTT04ucGFyc2UoZXZlbnQuZGF0YSk7XG4gICAgICAgIC8vIFRPRE86IFRoZSBldmVudC5zb3VyY2UgcHJvcGVydHkgZ2l2ZXMgdXMgdGhlIHNvdXJjZSB3aW5kb3cgb2YgdGhlIG1lc3NhZ2UgYW5kIGN1cnJlbnRseSB0aGUgWERNIGZyYW1lIGZpcmVzIG91dFxuICAgICAgICAvLyBldmVudHMgdGhhdCB3ZSByZWNlaXZlIGJlZm9yZSB3ZSBldmVyIHRyeSB0byBwb3N0IGFueXRoaW5nLiBTbyB3ZSAqY291bGQqIGhvbGQgb250byB0aGUgd2luZG93IGhlcmUgYW5kIHVzZSBpdFxuICAgICAgICAvLyBmb3IgcG9zdGluZyBtZXNzYWdlcyByYXRoZXIgdGhhbiBsb29raW5nIGZvciB0aGUgWERNIGZyYW1lIG91cnNlbHZlcy4gTmVlZCB0byBsb29rIGF0IHdoaWNoIGV2ZW50cyB0aGUgWERNIGZyYW1lXG4gICAgICAgIC8vIGZpcmVzIG91dCB0byBhbGwgd2luZG93cyBiZWZvcmUgYmVpbmcgYXNrZWQuIEN1cnJlbnRseSwgaXQncyBtb3JlIHRoYW4gXCJ4ZG0gbG9hZGVkXCIuIFdoeT9cbiAgICAgICAgLy92YXIgc291cmNlV2luZG93ID0gZXZlbnQuc291cmNlO1xuXG4gICAgICAgIHZhciBjYWxsYmFja0tleSA9IHJlc3BvbnNlLnN0YXR1czsgLy8gVE9ETzogY2hhbmdlIHRoZSBuYW1lIG9mIHRoaXMgcHJvcGVydHkgaW4geGRtLmh0bWxcbiAgICAgICAgY2FjaGVbY2FsbGJhY2tLZXldID0gcmVzcG9uc2U7XG4gICAgICAgIHZhciBjYWxsYmFjayA9IGNhbGxiYWNrc1tjYWxsYmFja0tleV07XG4gICAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICAgICAgY2FsbGJhY2socmVzcG9uc2UpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBwb3N0TWVzc2FnZShtZXNzYWdlLCBjYWxsYmFja0tleSwgY2FsbGJhY2ssIHZhbGlkQ2FjaGVFbnRyeSkge1xuXG4gICAgdmFyIHRhcmdldE9yaWdpbiA9IFVSTHMuYW50ZW5uYUhvbWUoKTtcbiAgICBjYWxsYmFja3NbY2FsbGJhY2tLZXldID0gY2FsbGJhY2s7XG5cbiAgICBpZiAoaXNYRE1Mb2FkZWQpIHtcbiAgICAgICAgdmFyIGNhY2hlZFJlc3BvbnNlID0gY2FjaGVbY2FsbGJhY2tLZXldO1xuICAgICAgICBpZiAoY2FjaGVkUmVzcG9uc2UgIT09IHVuZGVmaW5lZCAmJiB2YWxpZENhY2hlRW50cnkgJiYgdmFsaWRDYWNoZUVudHJ5KGNhY2hlW2NhbGxiYWNrS2V5XSkpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKGNhY2hlW2NhbGxiYWNrS2V5XSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgeGRtRnJhbWUgPSBnZXRYRE1GcmFtZSgpO1xuICAgICAgICAgICAgaWYgKHhkbUZyYW1lKSB7XG4gICAgICAgICAgICAgICAgeGRtRnJhbWUucG9zdE1lc3NhZ2UobWVzc2FnZSwgdGFyZ2V0T3JpZ2luKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gZ2V0WERNRnJhbWUoKSB7XG4gICAgLy8gVE9ETzogSXMgdGhpcyBhIHNlY3VyaXR5IHByb2JsZW0/IFdoYXQgcHJldmVudHMgc29tZW9uZSBmcm9tIHVzaW5nIHRoaXMgc2FtZSBuYW1lIGFuZCBpbnRlcmNlcHRpbmcgb3VyIG1lc3NhZ2VzP1xuICAgIHJldHVybiB3aW5kb3cuZnJhbWVzWydhbnQteGRtLWhpZGRlbiddO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBnZXRVc2VyOiBnZXRVc2VyXG59OyIsIlxudmFyIFVSTHMgPSByZXF1aXJlKCcuL3VybHMnKTtcblxuZnVuY3Rpb24gY3JlYXRlWERNZnJhbWUoZ3JvdXBJZCkge1xuICAgIC8vQU5ULnNlc3Npb24ucmVjZWl2ZU1lc3NhZ2Uoe30sIGZ1bmN0aW9uKCkge1xuICAgIC8vICAgIEFOVC51dGlsLnVzZXJMb2dpblN0YXRlKCk7XG4gICAgLy99KTtcblxuXG4gICAgdmFyIGlmcmFtZVVybCA9IFVSTHMuYW50ZW5uYUhvbWUoKSArIFwiL3N0YXRpYy93aWRnZXQtbmV3L3hkbS94ZG0uaHRtbFwiLFxuICAgIHBhcmVudFVybCA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmLFxuICAgIHBhcmVudEhvc3QgPSB3aW5kb3cubG9jYXRpb24ucHJvdG9jb2wgKyBcIi8vXCIgKyB3aW5kb3cubG9jYXRpb24uaG9zdCxcbiAgICAvLyBUT0RPOiBSZXN0b3JlIHRoZSBib29rbWFya2xldCBhdHRyaWJ1dGUgb24gdGhlIGlGcmFtZT9cbiAgICAvL2Jvb2ttYXJrbGV0ID0gKCBBTlQuZW5nYWdlU2NyaXB0UGFyYW1zLmJvb2ttYXJrbGV0ICkgPyBcImJvb2ttYXJrbGV0PXRydWVcIjpcIlwiLFxuICAgIGJvb2ttYXJrbGV0ID0gXCJcIixcbiAgICAvLyBUT0RPOiBSZXN0b3JlIHRoZSBncm91cE5hbWUgYXR0cmlidXRlLiAoV2hhdCBpcyBpdCBmb3I/KVxuICAgICR4ZG1JZnJhbWUgPSAkKCc8aWZyYW1lIGlkPVwiYW50LXhkbS1oaWRkZW5cIiBuYW1lPVwiYW50LXhkbS1oaWRkZW5cIiBzcmM9XCInICsgaWZyYW1lVXJsICsgJz9wYXJlbnRVcmw9JyArIHBhcmVudFVybCArICcmcGFyZW50SG9zdD0nICsgcGFyZW50SG9zdCArICcmZ3JvdXBfaWQ9Jytncm91cElkKydcIiB3aWR0aD1cIjFcIiBoZWlnaHQ9XCIxXCIgc3R5bGU9XCJwb3NpdGlvbjphYnNvbHV0ZTt0b3A6LTEwMDBweDtsZWZ0Oi0xMDAwcHg7XCIgLz4nKTtcbiAgICAvLyR4ZG1JZnJhbWUgPSAkKCc8aWZyYW1lIGlkPVwiYW50LXhkbS1oaWRkZW5cIiBuYW1lPVwiYW50LXhkbS1oaWRkZW5cIiBzcmM9XCInICsgaWZyYW1lVXJsICsgJz9wYXJlbnRVcmw9JyArIHBhcmVudFVybCArICcmcGFyZW50SG9zdD0nICsgcGFyZW50SG9zdCArICcmZ3JvdXBfaWQ9Jytncm91cElkKycmZ3JvdXBfbmFtZT0nK2VuY29kZVVSSUNvbXBvbmVudChncm91cE5hbWUpKycmJytib29rbWFya2xldCsnXCIgd2lkdGg9XCIxXCIgaGVpZ2h0PVwiMVwiIHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGU7dG9wOi0xMDAwcHg7bGVmdDotMTAwMHB4O1wiIC8+Jyk7XG4gICAgJChnZXRXaWRnZXRCdWNrZXQoKSkuYXBwZW5kKCAkeGRtSWZyYW1lICk7XG59XG5cbi8vIFRPRE8gcmVmYWN0b3IgdGhpcyB3aXRoIHRoZSBjb3B5IG9mIGl0IGluIHN1bW1hcnktd2lkZ2V0XG5mdW5jdGlvbiBnZXRXaWRnZXRCdWNrZXQoKSB7XG4gICAgdmFyIGJ1Y2tldCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhbnRlbm5hLXdpZGdldC1idWNrZXQnKTtcbiAgICBpZiAoIWJ1Y2tldCkge1xuICAgICAgICBidWNrZXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgYnVja2V0LnNldEF0dHJpYnV0ZSgnaWQnLCAnYW50ZW5uYS13aWRnZXQtYnVja2V0Jyk7XG4gICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoYnVja2V0KTtcbiAgICB9XG4gICAgcmV0dXJuIGJ1Y2tldDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlWERNZnJhbWU6IGNyZWF0ZVhETWZyYW1lXG59OyIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1pbmRpY2F0b3Itd2lkZ2V0XCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50LWFudGVubmEtbG9nb1wifX0sXCIgXCIse1widFwiOjQsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcImNvbnRhaW5lckRhdGEuY291bnRcIn1dfV0sXCJyXCI6XCJjb250YWluZXJEYXRhXCJ9XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hIGFudGVubmEtcmVhY3Rpb25zLXdpZGdldFwiLFwidGFiaW5kZXhcIjpcIjBcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtaGVhZGVyXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50LWFudGVubmEtbG9nb1wifX0sXCIgUmVhY3Rpb25zXCJdfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWJvZHlcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcmVhY3Rpb25zLXBhZ2VcIn0sXCJmXCI6W3tcInRcIjo0LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwidlwiOntcImNsaWNrXCI6XCJwbHVzb25lXCJ9LFwiYVwiOntcImNsYXNzXCI6W1wiYW50ZW5uYS1yZWFjdGlvbiBcIix7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wibGF5b3V0Q2xhc3NcIixcImluZGV4XCIsXCIuL2NvdW50XCJdLFwic1wiOlwiXzAoXzEsXzIpXCJ9fV0sXCJzdHlsZVwiOltcImJhY2tncm91bmQtY29sb3I6XCIse1widFwiOjIsXCJ4XCI6e1wiclwiOltcImJhY2tncm91bmRDb2xvclwiLFwiaW5kZXhcIl0sXCJzXCI6XCJfMChfMSlcIn19XX0sXCJmXCI6W1wiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcmVhY3Rpb24tYm94XCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXJlYWN0aW9uLXRleHRcIn0sXCJvXCI6XCJzaXpldG9maXRcIixcImZcIjpbe1widFwiOjIsXCJyXCI6XCIuL3RleHRcIn1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXJlYWN0aW9uLWNvdW50XCJ9LFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcIi4vY291bnRcIn1dfV19XX1dLFwiaVwiOlwiaW5kZXhcIixcInJcIjpcInJlYWN0aW9uc1wifV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY29uZmlybS1wYWdlXCJ9LFwiZlwiOlt7XCJ0XCI6NCxcImZcIjpbXCJMb29rcyBsaWtlIHlvdSBzdGlsbCBmZWVsIHRoZSBzYW1lIHdheS5cIl0sXCJuXCI6NTAsXCJyXCI6XCJyZXNwb25zZS5leGlzdGluZ1wifSx7XCJ0XCI6NCxcIm5cIjo1MSxcImZcIjpbXCJOZXcgcmVhY3Rpb24gcmVjZWl2ZWQuXCJdLFwiclwiOlwicmVzcG9uc2UuZXhpc3RpbmdcIn1dfV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtZm9vdGVyXCJ9LFwiZlwiOltcIldoYXQgZG8geW91IHRoaW5rP1wiXX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEgYW50LXN1bW1hcnktd2lkZ2V0XCIsXCJhbnQtaGFzaFwiOlt7XCJ0XCI6MixcInJcIjpcInBhZ2VIYXNoXCJ9XX0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiYVwiLFwiYVwiOntcImhyZWZcIjpcImh0dHA6Ly93d3cuYW50ZW5uYS5pc1wiLFwidGFyZ2V0XCI6XCJfYmxhbmtcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnQtYW50ZW5uYS1sb2dvXCJ9fV19LFwiIFwiLHtcInRcIjo0LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1zdW1tYXJ5LXRleHRcIn0sXCJmXCI6W3tcInRcIjo0LFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcInN1bW1hcnkudG90YWxSZWFjdGlvbnNcIn1dLFwiblwiOjUwLFwiclwiOlwic3VtbWFyeS50b3RhbFJlYWN0aW9uc1wifSxcIiBSZWFjdGlvbnNcIl19XSxcIm5cIjo1MCxcInhcIjp7XCJyXCI6W1wic3VtbWFyeS50b3RhbFJlYWN0aW9uc1wiXSxcInNcIjpcIl8wIT09dW5kZWZpbmVkXCJ9fV19XX0iXX0=
