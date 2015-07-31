(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/Users/jburns/antenna/rb/static/widget-new/src/js/antenna.js":[function(require,module,exports){

var ScriptLoader = require('./script-loader');
var CssLoader = require('./css-loader');
var GroupSettingsLoader = require('./group-settings-loader');
var PageDataLoader = require('./page-data-loader');
var PageScanner = require('./page-scanner');
var PageData = require('./page-data');
var XDMLoader = require('./utils/xdm-loader');

var groupSettings;

function loadGroupSettings() {
    // Once we have the settings, we can kick off a couple things in parallel:
    //
    // -- start fetching the page data
    // -- start hashing the page and inserting the affordances (in the empty state)
    //
    //    Once these tasks complete, then we can update the affordances with the data and we're ready
    //    for action.
    GroupSettingsLoader.load(function(settings) {
        groupSettings = settings;
        initXdmFrame();
        fetchPageData();
        scanPage();
    });
}

function initXdmFrame() {
    XDMLoader.createXDMframe(groupSettings.groupId);
}

function fetchPageData() {
    PageDataLoader.load(groupSettings, dataLoaded);
}

function scanPage() {
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

    PageData.updateAll(jsonData, groupSettings);

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

function updateAllPageData(jsonPages, groupSettings) {
    for (var i = 0; i < jsonPages.length; i++) {
        updatePageData(jsonPages[i], groupSettings);
    }
}

function updatePageData(json, groupSettings) {
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
    pageData.groupId = groupSettings.groupId();
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
var Hash = require('./utils/hash');
var URLs = require('./utils/urls');
var SummaryWidget = require('./summary-widget');
var IndicatorWidget = require('./indicator-widget');
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
        var $summary = $(this);
        var container = $('<div class="ant-summary-container"></div>');
        var summaryWidget = SummaryWidget.create(container, PageData.get(urlHash), groupSettings);
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
        var container = $('<div class="ant-indicator-container" style="display:inline-block;"></div>'); // TODO
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

        var $parent = $element.parent();
        var ratio = $parent.outerWidth() / node.scrollWidth;
        if (ratio < 1.0) {
            // If the text doesn't fit, first try to wrap it to two lines. Then scale it down if still necessary.
            // TODO: Clean up this code.
            var text = node.innerHTML;
            var splitIndex = text.indexOf(' ', text.length / 2);
            if (splitIndex === -1) {
                splitIndex = text.lastIndexOf(' ', text.length / 2);
            }
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
    //$root.find('.antenna-reactions-page').css({ left: '-100%', right: 0 });
    //$root.find('.antenna-received-page').css({ left: 0, right: '' });
    $root.find('.antenna-received-page').animate({ left: 0 });
    $root.animate({ width: 300 }, { delay: 100 });
    setTimeout(function() {
        showReactions(ractive, true);
    }, 1000);
}

function showReactions(ractive, animate) {
    var $root = $(rootElement(ractive));
    // TODO: This is probably where a Ractive partial comes in. Need a nested template here for showing the result.
    //$root.find('.antenna-reactions-page').css({ left: '-100%', right: 0 });
    //$root.find('.antenna-received-page').css({ left: 0, right: '' });
    if (animate) {
        $root.find('.antenna-received-page').animate({ left: '100%' });
        $root.animate({ width: 200 });
    } else {
        $root.find('.antenna-received-page').css({ left: '100%' });
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

var ReactionsWidget = require('./reactions-widget');

var ractive;
var reactionsWidget;

function createSummaryWidget(container, pageData, groupSettings) {
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
               openReactionsWindow(pageData, groupSettings);
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

function openReactionsWindow(pageData, groupSettings) {
    if (!reactionsWidget) {
        // TODO: consider prepopulating this
        var bucket = getWidgetBucket();
        var container = document.createElement('div');
        bucket.appendChild(container);
        reactionsWidget = ReactionsWidget.create(container, pageData, groupSettings);
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
},{"../templates/summary-widget.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/summary-widget.html","./reactions-widget":"/Users/jburns/antenna/rb/static/widget-new/src/js/reactions-widget.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/hash.js":[function(require,module,exports){

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
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna antenna-reactions-widget","tabindex":"0"},"f":[{"t":7,"e":"div","a":{"class":"antenna-reactions-container"},"f":[{"t":7,"e":"div","a":{"class":"antenna-reactions-page"},"f":[{"t":7,"e":"div","a":{"class":"antenna-header"},"f":[{"t":7,"e":"span","a":{"class":"ant-antenna-logo"}}," Reactions"]}," ",{"t":7,"e":"div","a":{"class":"antenna-body"},"f":[{"t":4,"f":[{"t":7,"e":"div","v":{"click":"plusone"},"a":{"class":["antenna-reaction ",{"t":2,"x":{"r":["layoutClass","index","./count"],"s":"_0(_1,_2)"}}],"style":["background-color:",{"t":2,"x":{"r":["backgroundColor","index"],"s":"_0(_1)"}}]},"f":[" ",{"t":7,"e":"div","a":{"class":"antenna-reaction-box"},"f":[{"t":7,"e":"div","a":{"class":"antenna-reaction-text"},"o":"sizetofit","f":[{"t":2,"r":"./text"}]}," ",{"t":7,"e":"div","a":{"class":"antenna-reaction-count"},"f":[{"t":2,"r":"./count"}]}]}]}],"i":"index","r":"reactions"}]}," ",{"t":7,"e":"div","a":{"class":"antenna-footer"},"f":[]}]}," ",{"t":7,"e":"div","a":{"class":"antenna-received-page"},"f":[{"t":4,"f":["Looks like you still feel the same way."],"n":50,"r":"response.existing"},{"t":4,"n":51,"f":["New reaction received."],"r":"response.existing"}]}]}]}]}
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/templates/summary-widget.html":[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna ant-summary-widget","ant-hash":[{"t":2,"r":"pageHash"}]},"f":[{"t":7,"e":"a","a":{"href":"http://www.antenna.is","target":"_blank"},"f":[{"t":7,"e":"span","a":{"class":"ant-antenna-logo"}}]}," ",{"t":4,"f":[{"t":7,"e":"span","a":{"class":"antenna-summary-text"},"f":[{"t":4,"f":[{"t":2,"r":"summary.totalReactions"}],"n":50,"r":"summary.totalReactions"}," Reactions"]}],"n":50,"x":{"r":["summary.totalReactions"],"s":"_0!==undefined"}}]}]}
},{}]},{},["/Users/jburns/antenna/rb/static/widget-new/src/js/antenna.js","/Users/jburns/antenna/rb/static/widget-new/src/js/css-loader.js","/Users/jburns/antenna/rb/static/widget-new/src/js/group-settings-loader.js","/Users/jburns/antenna/rb/static/widget-new/src/js/group-settings.js","/Users/jburns/antenna/rb/static/widget-new/src/js/indicator-widget.js","/Users/jburns/antenna/rb/static/widget-new/src/js/page-data-loader.js","/Users/jburns/antenna/rb/static/widget-new/src/js/page-data.js","/Users/jburns/antenna/rb/static/widget-new/src/js/page-reactions-loader.js","/Users/jburns/antenna/rb/static/widget-new/src/js/page-scanner.js","/Users/jburns/antenna/rb/static/widget-new/src/js/reactions-widget.js","/Users/jburns/antenna/rb/static/widget-new/src/js/script-loader.js","/Users/jburns/antenna/rb/static/widget-new/src/js/summary-widget.js","/Users/jburns/antenna/rb/static/widget-new/src/templates/indicator-widget.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/reactions-widget.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/summary-widget.html"])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi93aWRnZXQtbmV3L3NyYy9qcy9hbnRlbm5hLmpzIiwiLi4vd2lkZ2V0LW5ldy9zcmMvanMvY3NzLWxvYWRlci5qcyIsIi4uL3dpZGdldC1uZXcvc3JjL2pzL2dyb3VwLXNldHRpbmdzLWxvYWRlci5qcyIsIi4uL3dpZGdldC1uZXcvc3JjL2pzL2dyb3VwLXNldHRpbmdzLmpzIiwiLi4vd2lkZ2V0LW5ldy9zcmMvanMvaW5kaWNhdG9yLXdpZGdldC5qcyIsIi4uL3dpZGdldC1uZXcvc3JjL2pzL3BhZ2UtZGF0YS1sb2FkZXIuanMiLCIuLi93aWRnZXQtbmV3L3NyYy9qcy9wYWdlLWRhdGEuanMiLCIuLi93aWRnZXQtbmV3L3NyYy9qcy9wYWdlLXJlYWN0aW9ucy1sb2FkZXIuanMiLCIuLi93aWRnZXQtbmV3L3NyYy9qcy9wYWdlLXNjYW5uZXIuanMiLCIuLi93aWRnZXQtbmV3L3NyYy9qcy9yZWFjdGlvbnMtd2lkZ2V0LmpzIiwiLi4vd2lkZ2V0LW5ldy9zcmMvanMvc2NyaXB0LWxvYWRlci5qcyIsIi4uL3dpZGdldC1uZXcvc3JjL2pzL3N1bW1hcnktd2lkZ2V0LmpzIiwiLi4vd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvaGFzaC5qcyIsIi4uL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL21kNS5qcyIsIi4uL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL21vdmVhYmxlLmpzIiwiLi4vd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvb2ZmbGluZS5qcyIsIi4uL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL3VybHMuanMiLCIuLi93aWRnZXQtbmV3L3NyYy9qcy91dGlscy94ZG0tY2xpZW50LmpzIiwiLi4vd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMveGRtLWxvYWRlci5qcyIsIi4uL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9pbmRpY2F0b3Itd2lkZ2V0Lmh0bWwiLCIuLi93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvcmVhY3Rpb25zLXdpZGdldC5odG1sIiwiLi4vd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL3N1bW1hcnktd2lkZ2V0Lmh0bWwiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBOztBQ0FBOztBQ0FBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIlxudmFyIFNjcmlwdExvYWRlciA9IHJlcXVpcmUoJy4vc2NyaXB0LWxvYWRlcicpO1xudmFyIENzc0xvYWRlciA9IHJlcXVpcmUoJy4vY3NzLWxvYWRlcicpO1xudmFyIEdyb3VwU2V0dGluZ3NMb2FkZXIgPSByZXF1aXJlKCcuL2dyb3VwLXNldHRpbmdzLWxvYWRlcicpO1xudmFyIFBhZ2VEYXRhTG9hZGVyID0gcmVxdWlyZSgnLi9wYWdlLWRhdGEtbG9hZGVyJyk7XG52YXIgUGFnZVNjYW5uZXIgPSByZXF1aXJlKCcuL3BhZ2Utc2Nhbm5lcicpO1xudmFyIFBhZ2VEYXRhID0gcmVxdWlyZSgnLi9wYWdlLWRhdGEnKTtcbnZhciBYRE1Mb2FkZXIgPSByZXF1aXJlKCcuL3V0aWxzL3hkbS1sb2FkZXInKTtcblxudmFyIGdyb3VwU2V0dGluZ3M7XG5cbmZ1bmN0aW9uIGxvYWRHcm91cFNldHRpbmdzKCkge1xuICAgIC8vIE9uY2Ugd2UgaGF2ZSB0aGUgc2V0dGluZ3MsIHdlIGNhbiBraWNrIG9mZiBhIGNvdXBsZSB0aGluZ3MgaW4gcGFyYWxsZWw6XG4gICAgLy9cbiAgICAvLyAtLSBzdGFydCBmZXRjaGluZyB0aGUgcGFnZSBkYXRhXG4gICAgLy8gLS0gc3RhcnQgaGFzaGluZyB0aGUgcGFnZSBhbmQgaW5zZXJ0aW5nIHRoZSBhZmZvcmRhbmNlcyAoaW4gdGhlIGVtcHR5IHN0YXRlKVxuICAgIC8vXG4gICAgLy8gICAgT25jZSB0aGVzZSB0YXNrcyBjb21wbGV0ZSwgdGhlbiB3ZSBjYW4gdXBkYXRlIHRoZSBhZmZvcmRhbmNlcyB3aXRoIHRoZSBkYXRhIGFuZCB3ZSdyZSByZWFkeVxuICAgIC8vICAgIGZvciBhY3Rpb24uXG4gICAgR3JvdXBTZXR0aW5nc0xvYWRlci5sb2FkKGZ1bmN0aW9uKHNldHRpbmdzKSB7XG4gICAgICAgIGdyb3VwU2V0dGluZ3MgPSBzZXR0aW5ncztcbiAgICAgICAgaW5pdFhkbUZyYW1lKCk7XG4gICAgICAgIGZldGNoUGFnZURhdGEoKTtcbiAgICAgICAgc2NhblBhZ2UoKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gaW5pdFhkbUZyYW1lKCkge1xuICAgIFhETUxvYWRlci5jcmVhdGVYRE1mcmFtZShncm91cFNldHRpbmdzLmdyb3VwSWQpO1xufVxuXG5mdW5jdGlvbiBmZXRjaFBhZ2VEYXRhKCkge1xuICAgIFBhZ2VEYXRhTG9hZGVyLmxvYWQoZ3JvdXBTZXR0aW5ncywgZGF0YUxvYWRlZCk7XG59XG5cbmZ1bmN0aW9uIHNjYW5QYWdlKCkge1xuICAgIFBhZ2VTY2FubmVyLnNjYW4oZ3JvdXBTZXR0aW5ncywgcGFnZVNjYW5uZWQpO1xufVxuXG52YXIganNvbkRhdGE7XG52YXIgaXNQYWdlU2Nhbm5lZCA9IGZhbHNlO1xuXG5mdW5jdGlvbiBkYXRhTG9hZGVkKGpzb24pIHtcbiAgICBqc29uRGF0YSA9IGpzb247XG4gICAgaWYgKGpzb25EYXRhICYmIGlzUGFnZVNjYW5uZWQpIHtcbiAgICAgICAgcGFnZVJlYWR5KCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBwYWdlU2Nhbm5lZCgpIHtcbiAgICBpc1BhZ2VTY2FubmVkID0gdHJ1ZTtcbiAgICBpZiAoanNvbkRhdGEgJiYgaXNQYWdlU2Nhbm5lZCkge1xuICAgICAgICBwYWdlUmVhZHkoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHBhZ2VSZWFkeSgpIHtcbiAgICAvLyBBdCB0aGlzIHBvaW50LCB0aGUgY29udGFpbmVyIGhhc2hlcyBoYXZlIGJlZW4gY29tcHV0ZWQsIHRoZSBhZmZvcmRhbmNlcyBpbnNlcnRlZCwgYW5kIHRoZSBwYWdlIGRhdGEgZmV0Y2hlZC5cbiAgICAvLyBOb3cgdXBkYXRlIHRoZSBzdW1tYXJ5IHdpZGdldHMgYW5kIGFmZm9yZGFuY2VzLlxuXG4gICAgUGFnZURhdGEudXBkYXRlQWxsKGpzb25EYXRhLCBncm91cFNldHRpbmdzKTtcblxuICAgIC8vIEJPT00uIFRoZSBtYWdpYyBvZiBSYWN0aXZlLiBOb3cgd2UganVzdCBjYWxsIFBhZ2VEYXRhLnVwZGF0ZSBpbnN0ZWFkIG9mIGFsbCB0aGlzLlxuICAgIC8vZm9yICh2YXIgaSA9IDA7IGkgPCBwYWdlRGF0YS5sZW5ndGg7IGkrKykge1xuICAgIC8vICAgIHZhciBwYWdlID0gcGFnZURhdGFbaV07XG4gICAgLy8gICAgdmFyIGhhc2ggPSBwYWdlLnBhZ2VIYXNoO1xuICAgIC8vICAgIC8vIFRPRE8gZXh0cmFjdCBhdHRyaWJ1dGUgY29uc3RhbnRzXG4gICAgLy8gICAgdmFyICRzdW1tYXJpZXMgPSAkKCdbYW50LWhhc2g9XFwnJyArIGhhc2ggKyAnXFwnXScpO1xuICAgIC8vICAgICRzdW1tYXJpZXMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAvLyAgICAgICAgdmFyICRzdW1tYXJ5ID0gJCh0aGlzKTtcbiAgICAvLyAgICAgICAgdmFyIHN1bW1hcnlSYWN0aXZlID0gU3VtbWFyeVdpZGdldC5jcmVhdGUoJHN1bW1hcnksIHBhZ2UpOyAvLyBUT0RPOiBtdWx0aXBsZSBpbnN0YW5jZXNcbiAgICAvLyAgICB9KVxuICAgIC8vfVxufVxuXG4vLyBUT0RPIHRoZSBjYXNjYWRlIGlzIHByZXR0eSBjbGVhciwgYnV0IGNhbiB3ZSBvcmNoZXN0cmF0ZSB0aGlzIGJldHRlcj9cblNjcmlwdExvYWRlci5sb2FkKGxvYWRHcm91cFNldHRpbmdzKTtcbkNzc0xvYWRlci5sb2FkKCk7IiwiXG52YXIgYmFzZVVybCA9ICdodHRwOi8vbG9jYWxob3N0OjgwODEnOyAvLyBUT0RPIGNvbXB1dGUgdGhpc1xuXG5mdW5jdGlvbiBsb2FkQ3NzKCkge1xuICAgIHZhciBoZWFkID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKVswXTtcbiAgICBpZiAoaGVhZCkge1xuICAgICAgICAvLyBUbyBtYWtlIHN1cmUgbm9uZSBvZiBvdXIgY29udGVudCByZW5kZXJzIG9uIHRoZSBwYWdlIGJlZm9yZSBvdXIgQ1NTIGlzIGxvYWRlZCwgd2UgYXBwZW5kIGEgc2ltcGxlIGlubGluZSBzdHlsZVxuICAgICAgICAvLyBlbGVtZW50IHRoYXQgdHVybnMgb2ZmIG91ciBlbGVtZW50cyAqYmVmb3JlKiBvdXIgQ1NTIGxpbmtzLiBUaGlzIGV4cGxvaXRzIHRoZSBjYXNjYWRlIHJ1bGVzIC0gb3VyIENTUyBmaWxlcyBhcHBlYXJcbiAgICAgICAgLy8gYWZ0ZXIgdGhlIGlubGluZSBzdHlsZSBpbiB0aGUgZG9jdW1lbnQsIHNvIHRoZXkgdGFrZSBwcmVjZWRlbmNlIChhbmQgbWFrZSBldmVyeXRoaW5nIGFwcGVhcikgb25jZSB0aGV5J3JlIGxvYWRlZC5cbiAgICAgICAgdmFyIHN0eWxlVGFnID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcbiAgICAgICAgc3R5bGVUYWcuaW5uZXJIVE1MID0gJy5hbnRlbm5he2Rpc3BsYXk6bm9uZTt9JztcbiAgICAgICAgaGVhZC5hcHBlbmRDaGlsZChzdHlsZVRhZyk7XG5cbiAgICAgICAgdmFyIGNzc0hyZWZzID0gW1xuICAgICAgICAgICAgLy8gVE9ETyBicmluZ2luZyBpbiBtdWx0aXBsZSBjc3MgZmlsZXMgYnJlYWtzIHRoZSB3YXkgd2Ugd2FpdCB1bnRpbCBvdXIgQ1NTIGlzIGxvYWRlZCBiZWZvcmUgc2hvd2luZyBvdXIgY29udGVudC5cbiAgICAgICAgICAgIC8vICAgICAgd2UgbmVlZCB0byBmaW5kIGEgd2F5IHRvIGJyaW5nIHRoYXQgYmFjay4gb25lIHNpbXBsZSB3YXkgLSBhbHNvIGNvbXBpbGUgdGhlIGFudGVubmEtZm9udC5jc3MgaW50byB0aGUgYW50ZW5uYS5jc3MgZmlsZS5cbiAgICAgICAgICAgIC8vICAgICAgb3BlbiBxdWVzdGlvbiAtIGhvdyBkb2VzIGl0IGFsbCBwbGF5IHdpdGggZm9udCBpY29ucyB0aGF0IGFyZSBkb3dubG9hZGVkIGFzIHlldCBhbm90aGVyIGZpbGU/XG4gICAgICAgICAgICBiYXNlVXJsICsgJy9zdGF0aWMvY3NzL2FudGVubmEtZm9udC9hbnRlbm5hLWZvbnQuY3NzJyxcbiAgICAgICAgICAgIGJhc2VVcmwgKyAnL3N0YXRpYy93aWRnZXQtbmV3L2RlYnVnL2FudGVubmEuY3NzJyAvLyBUT0RPIHRoaXMgbmVlZHMgYSBmaW5hbCBwYXRoLiBDRE4gZm9yIHByb2R1Y3Rpb24gYW5kIGxvY2FsIGZpbGUgZm9yIGRldmVsb3BtZW50P1xuICAgICAgICBdO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNzc0hyZWZzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBsb2FkRmlsZShjc3NIcmVmc1tpXSwgaGVhZCk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGxvYWRGaWxlKGhyZWYsIGhlYWQpIHtcbiAgICB2YXIgbGlua1RhZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpbmsnKTtcbiAgICBsaW5rVGFnLnNldEF0dHJpYnV0ZSgnaHJlZicsIGhyZWYpO1xuICAgIGxpbmtUYWcuc2V0QXR0cmlidXRlKCdyZWwnLCAnc3R5bGVzaGVldCcpO1xuICAgIGxpbmtUYWcuc2V0QXR0cmlidXRlKCd0eXBlJywgJ3RleHQvY3NzJyk7XG4gICAgaGVhZC5hcHBlbmRDaGlsZChsaW5rVGFnKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgbG9hZCA6IGxvYWRDc3Ncbn07IiwiXG52YXIgR3JvdXBTZXR0aW5ncyA9IHJlcXVpcmUoJy4vZ3JvdXAtc2V0dGluZ3MnKTtcbnZhciAkOyByZXF1aXJlKCcuL3NjcmlwdC1sb2FkZXInKS5vbiQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcblxuLy8gVE9ETyBmb2xkIHRoaXMgbW9kdWxlIGludG8gZ3JvdXAtc2V0dGluZ3M/XG5cbmZ1bmN0aW9uIGxvYWRTZXR0aW5ncyhjYWxsYmFjaykge1xuICAgICQuZ2V0SlNPTlAoJy9hcGkvc2V0dGluZ3MnLCB7IGhvc3RfbmFtZTogd2luZG93LmFudGVubmFfaG9zdCB9LCBzdWNjZXNzLCBlcnJvcik7XG5cbiAgICBmdW5jdGlvbiBzdWNjZXNzKGpzb24pIHtcbiAgICAgICAgdmFyIGdyb3VwU2V0dGluZ3MgPSBHcm91cFNldHRpbmdzLmNyZWF0ZShqc29uKTtcbiAgICAgICAgY2FsbGJhY2soZ3JvdXBTZXR0aW5ncyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZXJyb3IobWVzc2FnZSkge1xuICAgICAgICAvLyBUT0RPIGhhbmRsZSBlcnJvcnMgdGhhdCBoYXBwZW4gd2hlbiBsb2FkaW5nIGNvbmZpZyBkYXRhXG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgbG9hZDogbG9hZFNldHRpbmdzXG59OyIsIlxudmFyICQ7XG5yZXF1aXJlKCcuL3NjcmlwdC1sb2FkZXInKS5vbiQoZnVuY3Rpb24oalF1ZXJ5KSB7XG4gICAgJD1qUXVlcnk7XG59KTtcblxuLy8gVE9ETzogdHJpbSB0cmFpbGluZyBjb21tYXMgZnJvbSBhbnkgc2VsZWN0b3IgdmFsdWVzXG5cbi8vIFRPRE86IFJldmlldy4gVGhlc2UgYXJlIGp1c3QgY29waWVkIGZyb20gZW5nYWdlX2Z1bGwuXG52YXIgZGVmYXVsdHMgPSB7XG4gICAgcHJlbWl1bTogZmFsc2UsXG4gICAgaW1nX3NlbGVjdG9yOiBcImltZ1wiLFxuICAgIGltZ19jb250YWluZXJfc2VsZWN0b3JzOlwiI3ByaW1hcnktcGhvdG9cIixcbiAgICBhY3RpdmVfc2VjdGlvbnM6IFwiYm9keVwiLFxuICAgIGFubm9fd2hpdGVsaXN0OiBcImJvZHkgcFwiLFxuICAgIGFjdGl2ZV9zZWN0aW9uc193aXRoX2Fubm9fd2hpdGVsaXN0OlwiXCIsXG4gICAgbWVkaWFfc2VsZWN0b3I6IFwiZW1iZWQsIHZpZGVvLCBvYmplY3QsIGlmcmFtZVwiLFxuICAgIGNvbW1lbnRfbGVuZ3RoOiA1MDAsXG4gICAgbm9fYW50OiBcIlwiLFxuICAgIGltZ19ibGFja2xpc3Q6IFwiXCIsXG4gICAgY3VzdG9tX2NzczogXCJcIixcbiAgICAvL3RvZG86IHRlbXAgaW5saW5lX2luZGljYXRvciBkZWZhdWx0cyB0byBtYWtlIHRoZW0gc2hvdyB1cCBvbiBhbGwgbWVkaWEgLSByZW1vdmUgdGhpcyBsYXRlci5cbiAgICBpbmxpbmVfc2VsZWN0b3I6ICdpbWcsIGVtYmVkLCB2aWRlbywgb2JqZWN0LCBpZnJhbWUnLFxuICAgIHBhcmFncmFwaF9oZWxwZXI6IHRydWUsXG4gICAgbWVkaWFfdXJsX2lnbm9yZV9xdWVyeTogdHJ1ZSxcbiAgICBzdW1tYXJ5X3dpZGdldF9zZWxlY3RvcjogJy5hbnQtcGFnZS1zdW1tYXJ5JywgLy8gVE9ETzogdGhpcyB3YXNuJ3QgZGVmaW5lZCBhcyBhIGRlZmF1bHQgaW4gZW5nYWdlX2Z1bGwsIGJ1dCB3YXMgaW4gY29kZS4gd2h5P1xuICAgIHN1bW1hcnlfd2lkZ2V0X21ldGhvZDogJ2FmdGVyJyxcbiAgICBsYW5ndWFnZTogJ2VuJyxcbiAgICBhYl90ZXN0X2ltcGFjdDogdHJ1ZSxcbiAgICBhYl90ZXN0X3NhbXBsZV9wZXJjZW50YWdlOiAxMCxcbiAgICBpbWdfaW5kaWNhdG9yX3Nob3dfb25sb2FkOiB0cnVlLFxuICAgIGltZ19pbmRpY2F0b3Jfc2hvd19zaWRlOiAnbGVmdCcsXG4gICAgdGFnX2JveF9iZ19jb2xvcnM6ICcjMTg0MTRjOyMzNzYwNzY7MjE1LCAxNzksIDY5OyNlNjg4NWM7I2U0NjE1NicsXG4gICAgdGFnX2JveF90ZXh0X2NvbG9yczogJyNmZmY7I2ZmZjsjZmZmOyNmZmY7I2ZmZicsXG4gICAgdGFnX2JveF9mb250X2ZhbWlseTogJ0hlbHZldGljYU5ldWUsSGVsdmV0aWNhLEFyaWFsLHNhbnMtc2VyaWYnLFxuICAgIHRhZ3NfYmdfY3NzOiAnJyxcbiAgICBpZ25vcmVfc3ViZG9tYWluOiBmYWxzZSxcbiAgICAvL3RoZSBzY29wZSBpbiB3aGljaCB0byBmaW5kIHBhcmVudHMgb2YgPGJyPiB0YWdzLlxuICAgIC8vVGhvc2UgcGFyZW50cyB3aWxsIGJlIGNvbnZlcnRlZCB0byBhIDxydD4gYmxvY2ssIHNvIHRoZXJlIHdvbid0IGJlIG5lc3RlZCA8cD4gYmxvY2tzLlxuICAgIC8vdGhlbiBpdCB3aWxsIHNwbGl0IHRoZSBwYXJlbnQncyBodG1sIG9uIDxicj4gdGFncyBhbmQgd3JhcCB0aGUgc2VjdGlvbnMgaW4gPHA+IHRhZ3MuXG5cbiAgICAvL2V4YW1wbGU6XG4gICAgLy8gYnJfcmVwbGFjZV9zY29wZV9zZWxlY3RvcjogXCIuYW50X2JyX3JlcGxhY2VcIiAvL2UuZy4gXCIjbWFpbnNlY3Rpb25cIiBvciBcInBcIlxuXG4gICAgYnJfcmVwbGFjZV9zY29wZV9zZWxlY3RvcjogbnVsbCAvL2UuZy4gXCIjbWFpbnNlY3Rpb25cIiBvciBcInBcIlxufTtcblxuZnVuY3Rpb24gY3JlYXRlRnJvbUpTT04oanNvbikge1xuXG4gICAgZnVuY3Rpb24gZGF0YShrZXkpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIHZhbHVlID0gd2luZG93LmFudGVubmFfZXh0ZW5kW2tleV07XG4gICAgICAgICAgICBpZiAodmFsdWUgPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSBqc29uW2tleV07XG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09ICcnKSB7IC8vIFRPRE86IFNob3VsZCB0aGUgc2VydmVyIGJlIHNlbmRpbmcgYmFjayAnJyBoZXJlIG9yIG5vdGhpbmcgYXQgYWxsPyAoSXQgcHJlY2x1ZGVzIHRoZSBzZXJ2ZXIgZnJvbSByZWFsbHkgc2F5aW5nICdub3RoaW5nJylcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBkZWZhdWx0c1trZXldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBiYWNrZ3JvdW5kQ29sb3IoYWNjZXNzb3IpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIGNvbG9ycyA9IFtdO1xuICAgICAgICAgICAgdmFyIHZhbHVlID0gYWNjZXNzb3IoKTtcbiAgICAgICAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgIGNvbG9ycyA9IHZhbHVlLnNwbGl0KCc7Jyk7XG4gICAgICAgICAgICAgICAgY29sb3JzID0gbWlncmF0ZVZhbHVlcyhjb2xvcnMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGNvbG9ycztcblxuICAgICAgICAgICAgLy8gTWlncmF0ZSBhbnkgY29sb3JzIGZyb20gdGhlICcxLCAyLCAzJyBmb3JtYXQgdG8gJ3JnYigxLCAyLCAzKScuIFRoaXMgY29kZSBjYW4gYmUgZGVsZXRlZCBvbmNlIHdlJ3ZlIHVwZGF0ZWRcbiAgICAgICAgICAgIC8vIGFsbCBzaXRlcyB0byBzcGVjaWZ5aW5nIHZhbGlkIENTUyBjb2xvciB2YWx1ZXNcbiAgICAgICAgICAgIGZ1bmN0aW9uIG1pZ3JhdGVWYWx1ZXMoY29sb3JWYWx1ZXMpIHtcbiAgICAgICAgICAgICAgICB2YXIgbWlncmF0aW9uTWF0Y2hlciA9IC9eXFxzKlxcZCtcXHMqLFxccypcXGQrXFxzKixcXHMqXFxkK1xccyokL2dpbTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvbG9yVmFsdWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9IGNvbG9yVmFsdWVzW2ldO1xuICAgICAgICAgICAgICAgICAgICBpZiAobWlncmF0aW9uTWF0Y2hlci50ZXN0KHZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3JWYWx1ZXNbaV0gPSAncmdiKCcgKyB2YWx1ZSArICcpJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gY29sb3JWYWx1ZXM7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBncm91cElkOiBkYXRhKCdpZCcpLFxuICAgICAgICBhY3RpdmVTZWN0aW9uczogZGF0YSgnYWN0aXZlX3NlY3Rpb25zJyksXG4gICAgICAgIHVybDoge1xuICAgICAgICAgICAgaWdub3JlU3ViZG9tYWluOiBkYXRhKCdpZ25vcmVfc3ViZG9tYWluJyksXG4gICAgICAgICAgICBjYW5vbmljYWxEb21haW46IGRhdGEoJ3BhZ2VfdGxkJykgLy8gVE9ETzogd2hhdCB0byBjYWxsIHRoaXMgZXhhY3RseS4gZ3JvdXBEb21haW4/IHNpdGVEb21haW4/IGNhbm9uaWNhbERvbWFpbj9cbiAgICAgICAgfSxcbiAgICAgICAgc3VtbWFyeVNlbGVjdG9yOiBkYXRhKCdzdW1tYXJ5X3dpZGdldF9zZWxlY3RvcicpLFxuICAgICAgICBzdW1tYXJ5TWV0aG9kOiBkYXRhKCdzdW1tYXJ5X3dpZGdldF9tZXRob2QnKSxcbiAgICAgICAgcGFnZVNlbGVjdG9yOiBkYXRhKCdwb3N0X3NlbGVjdG9yJyksXG4gICAgICAgIHBhZ2VIcmVmU2VsZWN0b3I6IGRhdGEoJ3Bvc3RfaHJlZl9zZWxlY3RvcicpLFxuICAgICAgICB0ZXh0U2VsZWN0b3I6IGRhdGEoJ2Fubm9fd2hpdGVsaXN0JyksXG4gICAgICAgIHJlYWN0aW9uQmFja2dyb3VuZENvbG9yczogYmFja2dyb3VuZENvbG9yKGRhdGEoJ3RhZ19ib3hfYmdfY29sb3JzJykpXG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlOiBjcmVhdGVGcm9tSlNPTlxufTsiLCJcbnZhciAkOyByZXF1aXJlKCcuL3NjcmlwdC1sb2FkZXInKS5vbiQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcblxuXG5mdW5jdGlvbiBjcmVhdGVJbmRpY2F0b3JXaWRnZXQoY29udGFpbmVyLCBjb250YWluZXJEYXRhKSB7XG4gICAgLy8gVE9ETzogQmFzaWNhbGx5IGV2ZXJ5dGhpbmcuXG4gICAgLy8gQWN0dWFsbHkgZ2V0IGNvbnRhaW5lciBkYXRhLlxuICAgIC8vIEFkanVzdCB2aXNpYmlsaXR5IGJhc2VkIG9uIHdoZXRoZXIgdGhlcmUgYXJlIHJlYWN0aW9ucyBvbiB0aGUgY29udGVudCAoaG9ub3JpbmcgdGhlIGZsYWcgYWJvdXQgaG93IG1hbnkgdG8gc2hvdyBhdCBvbmNlKS5cbiAgICAvLyBTaG93IHRoZSByZWFjdGlvbiB3aWRnZXQgb24gaG92ZXIuXG4gICAgLy8gZXRjLlxuICAgIHZhciByYWN0aXZlID0gUmFjdGl2ZSh7XG4gICAgICAgIGVsOiBjb250YWluZXIsXG4gICAgICAgIG1hZ2ljOiB0cnVlLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICBjb250YWluZXJEYXRhOiBjb250YWluZXJEYXRhXG4gICAgICAgIH0sXG4gICAgICAgIHRlbXBsYXRlOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvaW5kaWNhdG9yLXdpZGdldC5odG1sJylcbiAgICB9KTtcbn1cblxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGU6IGNyZWF0ZUluZGljYXRvcldpZGdldFxufTsiLCJcbnZhciBVUkxzID0gcmVxdWlyZSgnLi91dGlscy91cmxzJyk7XG52YXIgJDsgcmVxdWlyZSgnLi9zY3JpcHQtbG9hZGVyJykub24kKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG5cblxuZnVuY3Rpb24gY29tcHV0ZVBhZ2VUaXRsZSgpIHtcbiAgICAvLyBUT0RPOiBIb3cgYXJlIHBhZ2UgdGl0bGVzIGNvbXB1dGVkIHdpdGggbXVsdGlwbGUgcGFnZXM/IFRoZSBjb2RlIGJlbG93IGNvbXB1dGVzIHRoZSB0aXRsZSBmb3IgYSB0b3AtbGV2ZWwgcGFnZS5cbiAgICB2YXIgdGl0bGUgPSAkKCdtZXRhW3Byb3BlcnR5PVwib2c6dGl0bGVcIl0nKS5hdHRyKCdjb250ZW50Jyk7XG4gICAgaWYgKCF0aXRsZSkge1xuICAgICAgICB0aXRsZSA9ICQoJ3RpdGxlJykudGV4dCgpIHx8ICcnO1xuICAgIH1cbiAgICByZXR1cm4gJC50cmltKHRpdGxlKTtcbn1cblxuXG4vLyBDb21wdXRlIHRoZSBwYWdlcyB0aGF0IHdlIG5lZWQgdG8gZmV0Y2guIFRoaXMgaXMgZWl0aGVyOlxuLy8gMS4gQW55IG5lc3RlZCBwYWdlcyB3ZSBmaW5kIHVzaW5nIHRoZSBwYWdlIHNlbGVjdG9yIE9SXG4vLyAyLiBUaGUgY3VycmVudCB3aW5kb3cgbG9jYXRpb25cbmZ1bmN0aW9uIGNvbXB1dGVQYWdlc1BhcmFtKGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgcGFnZXMgPSBbXTtcblxuICAgIHZhciBncm91cElkID0gZ3JvdXBTZXR0aW5ncy5ncm91cElkKCk7XG4gICAgdmFyICRwYWdlRWxlbWVudHMgPSAkKGdyb3VwU2V0dGluZ3MucGFnZVNlbGVjdG9yKCkpO1xuICAgIC8vIFRPRE86IENvbXBhcmUgdGhpcyBleGVjdXRpb24gZmxvdyB0byB3aGF0IGhhcHBlbnMgaW4gZW5nYWdlX2Z1bGwuanMuIEhlcmUgd2UgdHJlYXQgdGhlIGJvZHkgZWxlbWVudCBhcyBhIHBhZ2Ugc29cbiAgICAvLyB0aGUgZmxvdyBpcyB0aGUgc2FtZSBmb3IgYm90aCBjYXNlcy4gSXMgdGhlcmUgYSByZWFzb24gZW5nYWdlX2Z1bGwuanMgYnJhbmNoZXMgaGVyZSBpbnN0ZWFkIGFuZCB0cmVhdHMgdGhlc2Ugc28gZGlmZmVyZW50bHk/XG4gICAgaWYgKCRwYWdlRWxlbWVudHMubGVuZ3RoID09IDApIHtcbiAgICAgICAgJHBhZ2VFbGVtZW50cyA9ICQoJ2JvZHknKTtcbiAgICB9XG4gICAgJHBhZ2VFbGVtZW50cy5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgJHBhZ2VFbGVtZW50ID0gJCh0aGlzKTtcbiAgICAgICAgcGFnZXMucHVzaCh7XG4gICAgICAgICAgICBncm91cF9pZDogZ3JvdXBJZCxcbiAgICAgICAgICAgIHVybDogVVJMcy5jb21wdXRlUGFnZVVybCgkcGFnZUVsZW1lbnQsIGdyb3VwU2V0dGluZ3MpLFxuICAgICAgICAgICAgY2Fub25pY2FsX3VybDogVVJMcy5jb21wdXRlQ2Fub25pY2FsVXJsKCRwYWdlRWxlbWVudCwgZ3JvdXBTZXR0aW5ncyksXG4gICAgICAgICAgICBpbWFnZTogJycsIC8vIFRPRE9cbiAgICAgICAgICAgIHRpdGxlOiBjb21wdXRlUGFnZVRpdGxlKCkgLy8gVE9ETzogVGhpcyBjb2RlIG9ubHkgd29ya3MgZm9yIHRoZSB0b3AtbGV2ZWwgcGFnZS4gU2VlIGNvbXB1dGVQYWdlVGl0bGUoKVxuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIHJldHVybiBwYWdlcztcbn1cblxuZnVuY3Rpb24gbG9hZFBhZ2VEYXRhKGdyb3VwU2V0dGluZ3MsIGNhbGxiYWNrKSB7XG4gICAgdmFyIHBhZ2VzUGFyYW0gPSBjb21wdXRlUGFnZXNQYXJhbShncm91cFNldHRpbmdzKTtcbiAgICAkLmdldEpTT05QKCcvYXBpL3BhZ2UnLCB7IHBhZ2VzOiBwYWdlc1BhcmFtIH0sIHN1Y2Nlc3MsIGVycm9yKTtcblxuICAgIGZ1bmN0aW9uIHN1Y2Nlc3MoanNvbikge1xuICAgICAgICBjYWxsYmFjayhqc29uKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBlcnJvcihtZXNzYWdlKSB7XG4gICAgICAgIC8vIFRPRE8gaGFuZGxlIGVycm9ycyB0aGF0IGhhcHBlbiB3aGVuIGxvYWRpbmcgcGFnZSBkYXRhXG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgbG9hZDogbG9hZFBhZ2VEYXRhXG59OyIsIlxudmFyICQ7IHJlcXVpcmUoJy4vc2NyaXB0LWxvYWRlcicpLm9uJChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xuXG52YXIgcGFnZXMgPSB7fTtcblxuZnVuY3Rpb24gZ2V0UGFnZURhdGEoaGFzaCkge1xuICAgIHZhciBwYWdlRGF0YSA9IHBhZ2VzW2hhc2hdO1xuICAgIGlmICghcGFnZURhdGEpIHtcbiAgICAgICAgLy8gVE9ETzogR2l2ZSB0aGlzIHNlcmlvdXMgdGhvdWdodC4gSW4gb3JkZXIgZm9yIG1hZ2ljIG1vZGUgdG8gd29yaywgdGhlIG9iamVjdCBuZWVkcyB0byBoYXZlIHZhbHVlcyBpbiBwbGFjZSBmb3JcbiAgICAgICAgLy8gdGhlIG9ic2VydmVkIHByb3BlcnRpZXMgYXQgdGhlIG1vbWVudCB0aGUgcmFjdGl2ZSBpcyBjcmVhdGVkLiBCdXQgdGhpcyBpcyBwcmV0dHkgdW51c3VhbCBmb3IgSmF2YXNjcmlwdCwgdG8gaGF2ZVxuICAgICAgICAvLyB0byBkZWZpbmUgdGhlIHdob2xlIHNrZWxldG9uIGZvciB0aGUgb2JqZWN0IGluc3RlYWQgb2YganVzdCBhZGRpbmcgcHJvcGVydGllcyB3aGVuZXZlciB5b3Ugd2FudC5cbiAgICAgICAgLy8gVGhlIGFsdGVybmF0aXZlIHdvdWxkIGJlIGZvciB1cyB0byBrZWVwIG91ciBvd24gXCJkYXRhIGJpbmRpbmdcIiBiZXR3ZWVuIHRoZSBwYWdlRGF0YSBhbmQgcmFjdGl2ZSBpbnN0YW5jZXMgKDEgdG8gbWFueSlcbiAgICAgICAgLy8gYW5kIHRlbGwgdGhlIHJhY3RpdmVzIHRvIHVwZGF0ZSB3aGVuZXZlciB0aGUgZGF0YSBjaGFuZ2VzLlxuICAgICAgICBwYWdlRGF0YSA9IHtcbiAgICAgICAgICAgIHBhZ2VIYXNoOiBoYXNoLFxuICAgICAgICAgICAgc3VtbWFyeToge31cbiAgICAgICAgfTtcbiAgICAgICAgcGFnZXNbaGFzaF0gPSBwYWdlRGF0YTtcbiAgICB9XG4gICAgcmV0dXJuIHBhZ2VEYXRhO1xufVxuXG5mdW5jdGlvbiB1cGRhdGVBbGxQYWdlRGF0YShqc29uUGFnZXMsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGpzb25QYWdlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB1cGRhdGVQYWdlRGF0YShqc29uUGFnZXNbaV0sIGdyb3VwU2V0dGluZ3MpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gdXBkYXRlUGFnZURhdGEoanNvbiwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBwYWdlRGF0YSA9IGdldFBhZ2VEYXRhKGpzb24udXJsaGFzaCk7XG5cbiAgICB2YXIgbnVtUmVhY3Rpb25zID0gMDtcbiAgICB2YXIgbnVtQ29tbWVudHMgPSAwO1xuICAgIHZhciBudW1TaGFyZXMgPSAwO1xuXG4gICAgdmFyIHN1bW1hcnlFbnRyaWVzID0ganNvbi5zdW1tYXJ5O1xuICAgIGlmIChzdW1tYXJ5RW50cmllcykge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN1bW1hcnlFbnRyaWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgc3VtbWFyeUVudHJ5ID0gc3VtbWFyeUVudHJpZXNbaV07XG4gICAgICAgICAgICBpZiAoc3VtbWFyeUVudHJ5LmtpbmQgPT09ICd0YWcnKSB7XG4gICAgICAgICAgICAgICAgbnVtUmVhY3Rpb25zID0gc3VtbWFyeUVudHJ5LmNvdW50O1xuICAgICAgICAgICAgfSBlbHNlIGlmIChzdW1tYXJ5RW50cnkua2luZCA9PT0gJ2NvbScpIHtcbiAgICAgICAgICAgICAgICBudW1Db21tZW50cyA9IHN1bW1hcnlFbnRyeS5jb3VudDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc3VtbWFyeUVudHJ5LmtpbmQgPT09ICdzaHInKSB7XG4gICAgICAgICAgICAgICAgbnVtU2hhcmVzID0gc3VtbWFyeUVudHJ5LmNvdW50O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgdmFyIHRvcFJlYWN0aW9ucyA9IFtdO1xuICAgIHZhciByZWFjdGlvbnNEYXRhID0ganNvbi50b3B0YWdzO1xuICAgIGlmIChyZWFjdGlvbnNEYXRhKSB7XG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgcmVhY3Rpb25zRGF0YS5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgdmFyIHJlYWN0aW9uID0gcmVhY3Rpb25zRGF0YVtqXTtcbiAgICAgICAgICAgIHRvcFJlYWN0aW9uc1tqXSA9IHtcbiAgICAgICAgICAgICAgICBpZDogcmVhY3Rpb24uaWQsXG4gICAgICAgICAgICAgICAgY291bnQ6IHJlYWN0aW9uLnRhZ19jb3VudCxcbiAgICAgICAgICAgICAgICB0ZXh0OiByZWFjdGlvbi5ib2R5XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBUT0RPIENvbnNpZGVyIHN1cHBvcnRpbmcgaW5jcmVtZW50YWwgdXBkYXRlIG9mIGRhdGEgdGhhdCB3ZSBhbHJlYWR5IGhhdmUgZnJvbSB0aGUgc2VydmVyLiBUaGF0IHdvdWxkIG1lYW4gb25seVxuICAgIC8vIHVwZGF0aW5nIGZpZWxkcyBpbiB0aGUgbG9jYWwgb2JqZWN0IGlmIHRoZXkgZXhpc3QgaW4gdGhlIGpzb24gZGF0YS5cbiAgICBwYWdlRGF0YS5ncm91cElkID0gZ3JvdXBTZXR0aW5ncy5ncm91cElkKCk7XG4gICAgcGFnZURhdGEucGFnZUlkID0ganNvbi5pZDtcbiAgICBwYWdlRGF0YS5zdW1tYXJ5ID0ge1xuICAgICAgICB0b3RhbFJlYWN0aW9uczogbnVtUmVhY3Rpb25zLFxuICAgICAgICB0b3RhbENvbW1lbnRzOiBudW1Db21tZW50cyxcbiAgICAgICAgdG90YWxTaGFyZXM6IG51bVNoYXJlc1xuICAgIH07XG4gICAgcGFnZURhdGEudG9wUmVhY3Rpb25zID0gdG9wUmVhY3Rpb25zO1xuICAgIHBhZ2VEYXRhLmNvbnRhaW5lcnMgPSBqc29uLmNvbnRhaW5lcnM7IC8vIGFycmF5IG9mIG9iamVjdHMgd2l0aCAnaWQnIGFuZCAnaGFzaCcgcHJvcGVydGllcywgaW5jbHVkaW5nIHRoZSBtYWdpYyAncGFnZScgaGFzaCB2YWx1ZVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgZ2V0OiBnZXRQYWdlRGF0YSxcbiAgICB1cGRhdGVBbGw6IHVwZGF0ZUFsbFBhZ2VEYXRhXG59OyIsIlxuLy92YXIgJCA9IHJlcXVpcmUoJy4vanF1ZXJ5Jyk7XG52YXIgJDtcbnJlcXVpcmUoJy4vc2NyaXB0LWxvYWRlcicpLm9uJChmdW5jdGlvbihqUXVlcnkpIHtcbiAgICAkPWpRdWVyeTtcbn0pO1xuXG4vLyBUT0RPIHRoaXMgaXMganVzdCByYW5kb20gaW5jb21wbGV0ZSBzbmlwcGV0c1xuXG5mdW5jdGlvbiBjcmVhdGVQYWdlUGFyYW0oZ3JvdXBTZXR0aW5ncykge1xuICAgIHJldHVybiB7XG4gICAgICAgIGdyb3VwX2lkOiBncm91cFNldHRpbmdzLmlkLFxuICAgICAgICB1cmw6ICcnLFxuICAgICAgICBjYW5vbmljYWxfdXJsOiAnJyxcbiAgICAgICAgdGl0bGU6ICcnLFxuICAgICAgICBpbWFnZTogJydcbiAgICB9O1xufVxuXG5cblxuZnVuY3Rpb24gbG9hZFBhZ2Uoc2V0dGluZ3MpIHtcbiAgICBhbGVydChKU09OLnN0cmluZ2lmeShzZXR0aW5ncywgbnVsbCwgMikpO1xuICAgICQuZ2V0SlNPTlAoJy9hcGkvcGFnZScsIHtcbiAgICAgICAgICAgIHBhZ2VzOiBbe1xuICAgICAgICAgICAgICAgIGdyb3VwX2lkOiBzZXR0aW5ncy5pZCxcblxuICAgICAgICAgICAgfV1cbiAgICAgICAgfSwgZnVuY3Rpb24ocGFnZXMpIHtcbiAgICAgICAgICAgIGFsZXJ0KEpTT04uc3RyaW5naWZ5KHBhZ2VzLCBudWxsLCAyKSk7XG4gICAgICAgIH0pO1xuXG59XG5cbmZ1bmN0aW9uIGxvYWRQYWdlcygpIHtcblxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgbG9hZFBhZ2U6IGxvYWRQYWdlLFxuICAgIGxvYWRQYWdlczogbG9hZFBhZ2VzXG59OyIsIlxudmFyICQ7IHJlcXVpcmUoJy4vc2NyaXB0LWxvYWRlcicpLm9uJChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIEhhc2ggPSByZXF1aXJlKCcuL3V0aWxzL2hhc2gnKTtcbnZhciBVUkxzID0gcmVxdWlyZSgnLi91dGlscy91cmxzJyk7XG52YXIgU3VtbWFyeVdpZGdldCA9IHJlcXVpcmUoJy4vc3VtbWFyeS13aWRnZXQnKTtcbnZhciBJbmRpY2F0b3JXaWRnZXQgPSByZXF1aXJlKCcuL2luZGljYXRvci13aWRnZXQnKTtcbnZhciBQYWdlRGF0YSA9IHJlcXVpcmUoJy4vcGFnZS1kYXRhJyk7XG5cbnZhciBpbmRpY2F0b3JNYXAgPSB7fTtcblxuLy8gU2NhbiBmb3IgYWxsIHBhZ2VzIGF0IHRoZSBjdXJyZW50IGJyb3dzZXIgbG9jYXRpb24uIFRoaXMgY291bGQganVzdCBiZSB0aGUgY3VycmVudCBwYWdlIG9yIGl0IGNvdWxkIGJlIGEgY29sbGVjdGlvblxuLy8gb2YgcGFnZXMgKGFrYSAncG9zdHMnKS5cbmZ1bmN0aW9uIHNjYW5BbGxQYWdlcyhncm91cFNldHRpbmdzLCBjYWxsYmFjaykge1xuICAgIHZhciAkcGFnZXMgPSAkKGdyb3VwU2V0dGluZ3MucGFnZVNlbGVjdG9yKCkpO1xuICAgIGlmICgkcGFnZXMubGVuZ3RoID09IDApIHtcbiAgICAgICAgLy8gSWYgd2UgZG9uJ3QgZGV0ZWN0IGFueSBwYWdlIG1hcmtlcnMsIHRyZWF0IHRoZSB3aG9sZSBkb2N1bWVudCBhcyB0aGUgc2luZ2xlIHBhZ2VcbiAgICAgICAgJHBhZ2VzID0gJCgnYm9keScpOyAvLyBUT0RPIElzIHRoaXMgdGhlIHJpZ2h0IGJlaGF2aW9yP1xuICAgIH1cbiAgICAkcGFnZXMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRwYWdlID0gJCh0aGlzKTtcbiAgICAgICAgc2NhblBhZ2UoJHBhZ2UsIGdyb3VwU2V0dGluZ3MpO1xuICAgIH0pO1xuICAgIGNhbGxiYWNrKCk7XG59XG5cbi8vIFNjYW4gdGhlIHBhZ2UgdXNpbmcgdGhlIGdpdmVuIHNldHRpbmdzOlxuLy8gMS4gRmluZCBhbGwgdGhlIGNvbnRhaW5lcnMgdGhhdCB3ZSBjYXJlIGFib3V0LlxuLy8gMi4gSW5zZXJ0IHdpZGdldCBhZmZvcmRhbmNlcyBmb3IgZWFjaC5cbi8vIDMuIENvbXB1dGUgaGFzaGVzIGZvciBlYWNoIGNvbnRhaW5lci5cbmZ1bmN0aW9uIHNjYW5QYWdlKCRwYWdlLCBncm91cFNldHRpbmdzKSB7XG5cbiAgICAvLyBGaXJzdCwgc2NhbiBmb3IgZWxlbWVudHMgdGhhdCB3b3VsZCBjYXVzZSB1cyB0byBpbnNlcnQgc29tZXRoaW5nIGludG8gdGhlIERPTSB0aGF0IHRha2VzIHVwIHNwYWNlLlxuICAgIC8vIFdlIHdhbnQgdG8gZ2V0IGFueSBwYWdlIHJlc2l6aW5nIG91dCBvZiB0aGUgd2F5IGFzIGVhcmx5IGFzIHBvc3NpYmxlLlxuICAgIC8vIFRPRE86IENvbnNpZGVyIGRvaW5nIHRoaXMgd2l0aCByYXcgSmF2YXNjcmlwdCBiZWZvcmUgalF1ZXJ5IGxvYWRzLCB0byBmdXJ0aGVyIHJlZHVjZSB0aGUgZGVsYXkuIFdlIHdvdWxkbid0XG4gICAgLy8gc2F2ZSBhICp0b24qIG9mIHRpbWUgZnJvbSB0aGlzLCB0aG91Z2gsIHNvIGl0J3MgZGVmaW5pdGVseSBhIGxhdGVyIG9wdGltaXphdGlvbi5cbiAgICBzY2FuRm9yU3VtbWFyaWVzKCRwYWdlLCBncm91cFNldHRpbmdzKTtcbiAgICBzY2FuRm9yQ2FsbHNUb0FjdGlvbigkcGFnZSwgZ3JvdXBTZXR0aW5ncyk7XG5cbiAgICB2YXIgJGFjdGl2ZVNlY3Rpb25zID0gJHBhZ2UuZmluZChncm91cFNldHRpbmdzLmFjdGl2ZVNlY3Rpb25zKCkpO1xuICAgICRhY3RpdmVTZWN0aW9ucy5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgJHNlY3Rpb24gPSAkKHRoaXMpO1xuICAgICAgICAvLyBUaGVuIHNjYW4gZm9yIGV2ZXJ5dGhpbmcgZWxzZVxuICAgICAgICBzY2FuRm9yVGV4dCgkc2VjdGlvbiwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIHNjYW5Gb3JJbWFnZXMoJHNlY3Rpb24sIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICBzY2FuRm9yTWVkaWEoJHNlY3Rpb24sIGdyb3VwU2V0dGluZ3MpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBzY2FuRm9yU3VtbWFyaWVzKCRlbGVtZW50LCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIHVybCA9IFVSTHMuY29tcHV0ZVBhZ2VVcmwoJGVsZW1lbnQsIGdyb3VwU2V0dGluZ3MpO1xuICAgIHZhciB1cmxIYXNoID0gSGFzaC5oYXNoVXJsKHVybCk7XG5cbiAgICB2YXIgJHN1bW1hcmllcyA9ICRlbGVtZW50LmZpbmQoZ3JvdXBTZXR0aW5ncy5zdW1tYXJ5U2VsZWN0b3IoKSk7XG4gICAgJHN1bW1hcmllcy5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgJHN1bW1hcnkgPSAkKHRoaXMpO1xuICAgICAgICB2YXIgY29udGFpbmVyID0gJCgnPGRpdiBjbGFzcz1cImFudC1zdW1tYXJ5LWNvbnRhaW5lclwiPjwvZGl2PicpO1xuICAgICAgICB2YXIgc3VtbWFyeVdpZGdldCA9IFN1bW1hcnlXaWRnZXQuY3JlYXRlKGNvbnRhaW5lciwgUGFnZURhdGEuZ2V0KHVybEhhc2gpLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgaW5zZXJ0Q29udGVudCgkc3VtbWFyeSwgY29udGFpbmVyLCBncm91cFNldHRpbmdzLnN1bW1hcnlNZXRob2QoKSk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIHNjYW5Gb3JDYWxsc1RvQWN0aW9uKCRzZWN0aW9uLCBncm91cFNldHRpbmdzKSB7XG4gICAgLy8gVE9ET1xufVxuXG5mdW5jdGlvbiBzY2FuRm9yVGV4dCgkc2VjdGlvbiwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciAkdGV4dEVsZW1lbnRzID0gJHNlY3Rpb24uZmluZChncm91cFNldHRpbmdzLnRleHRTZWxlY3RvcigpKTtcbiAgICAvLyBUT0RPOiBvbmx5IHNlbGVjdCBcImxlYWZcIiBlbGVtZW50c1xuICAgICR0ZXh0RWxlbWVudHMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRlbGVtZW50ID0gJCh0aGlzKTtcbiAgICAgICAgLy8gVE9ETyBwb3NpdGlvbiBjb3JyZWN0bHlcbiAgICAgICAgLy8gVE9ETyBoYXNoIGFuZCBhZGQgaGFzaCBkYXRhIHRvIGluZGljYXRvclxuICAgICAgICB2YXIgaGFzaCA9IEhhc2guaGFzaFRleHQoJGVsZW1lbnQpO1xuICAgICAgICB2YXIgY29udGFpbmVyID0gJCgnPGRpdiBjbGFzcz1cImFudC1pbmRpY2F0b3ItY29udGFpbmVyXCIgc3R5bGU9XCJkaXNwbGF5OmlubGluZS1ibG9jaztcIj48L2Rpdj4nKTsgLy8gVE9ET1xuICAgICAgICB2YXIgY29udGFpbmVyRGF0YSA9IHt9OyAvLyBUT0RPIGdldCB0aGlzIGZyb20gYSBjZW50cmFsIGRhdGEgc3RvcmUgKHByb2JhYmx5IFBhZ2VEYXRhKVxuICAgICAgICB2YXIgaW5kaWNhdG9yID0gSW5kaWNhdG9yV2lkZ2V0LmNyZWF0ZShjb250YWluZXIsIGNvbnRhaW5lckRhdGEpO1xuICAgICAgICAkZWxlbWVudC5hcHBlbmQoY29udGFpbmVyKTsgLy8gVE9ETyBpcyB0aGlzIGNvbmZpZ3VyYWJsZSBhbGEgaW5zZXJ0Q29udGVudCguLi4pP1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBzY2FuRm9ySW1hZ2VzKCRzZWN0aW9uLCBncm91cFNldHRpbmdzKSB7XG4gICAgLy8gVE9ET1xufVxuXG5mdW5jdGlvbiBzY2FuRm9yTWVkaWEoJHNlY3Rpb24sIGdyb3VwU2V0dGluZ3MpIHtcbiAgICAvLyBUT0RPXG59XG5cbmZ1bmN0aW9uIGluc2VydENvbnRlbnQoJHBhcmVudCwgY29udGVudCwgbWV0aG9kKSB7XG4gICAgc3dpdGNoIChtZXRob2QpIHtcbiAgICAgICAgY2FzZSAnYXBwZW5kJzpcbiAgICAgICAgICAgICRwYXJlbnQuYXBwZW5kKGNvbnRlbnQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3ByZXBlbmQnOlxuICAgICAgICAgICAgJHBhcmVudC5wcmVwZW5kKGNvbnRlbnQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2JlZm9yZSc6XG4gICAgICAgICAgICAkcGFyZW50LmJlZm9yZShjb250ZW50KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdhZnRlcic6XG4gICAgICAgICAgICAkcGFyZW50LmFmdGVyKGNvbnRlbnQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICBzY2FuOiBzY2FuQWxsUGFnZXNcbn07IiwiXG52YXIgJDsgcmVxdWlyZSgnLi9zY3JpcHQtbG9hZGVyJykub24kKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgWERNQ2xpZW50ID0gcmVxdWlyZSgnLi91dGlscy94ZG0tY2xpZW50Jyk7XG52YXIgVVJMcyA9IHJlcXVpcmUoJy4vdXRpbHMvdXJscycpO1xudmFyIE1vdmVhYmxlID0gcmVxdWlyZSgnLi91dGlscy9tb3ZlYWJsZScpO1xuXG5mdW5jdGlvbiBjcmVhdGVSZWFjdGlvbnNXaWRnZXQoY29udGFpbmVyLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciByZWFjdGlvbnNEYXRhID0gcGFnZURhdGEudG9wUmVhY3Rpb25zO1xuICAgIHZhciBjb2xvcnMgPSBncm91cFNldHRpbmdzLnJlYWN0aW9uQmFja2dyb3VuZENvbG9ycygpO1xuICAgIHZhciBsYXlvdXREYXRhID0gY29tcHV0ZUxheW91dERhdGEocmVhY3Rpb25zRGF0YSwgY29sb3JzKTtcbiAgICB2YXIgcmFjdGl2ZSA9IFJhY3RpdmUoe1xuICAgICAgICBlbDogY29udGFpbmVyLFxuICAgICAgICBtYWdpYzogdHJ1ZSxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgcmVhY3Rpb25zOiByZWFjdGlvbnNEYXRhLFxuICAgICAgICAgICAgcmVzcG9uc2U6IHt9LFxuICAgICAgICAgICAgbGF5b3V0Q2xhc3M6IGZ1bmN0aW9uKGluZGV4KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGxheW91dERhdGEubGF5b3V0Q2xhc3Nlc1tpbmRleF07XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiBmdW5jdGlvbihpbmRleCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBsYXlvdXREYXRhLmJhY2tncm91bmRDb2xvcnNbaW5kZXhdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL3JlYWN0aW9ucy13aWRnZXQuaHRtbCcpLFxuICAgICAgICBkZWNvcmF0b3JzOiB7XG4gICAgICAgICAgICBzaXpldG9maXQ6IHNpemVUb0ZpdFxuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmFjdGl2ZS5vbignY29tcGxldGUnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRyb290RWxlbWVudCA9ICQocm9vdEVsZW1lbnQocmFjdGl2ZSkpO1xuICAgICAgICBNb3ZlYWJsZS5tYWtlTW92ZWFibGUoJHJvb3RFbGVtZW50LCAkcm9vdEVsZW1lbnQuZmluZCgnLmFudGVubmEtaGVhZGVyJykpO1xuICAgIH0pO1xuICAgIHJhY3RpdmUub24oJ2NoYW5nZScsIGZ1bmN0aW9uKCkge1xuICAgICAgICBsYXlvdXREYXRhID0gY29tcHV0ZUxheW91dERhdGEocmVhY3Rpb25zRGF0YSwgY29sb3JzKTtcbiAgICB9KTtcbiAgICByYWN0aXZlLm9uKCd1cGRhdGUnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ3VwZGF0ZSEnKTtcbiAgICB9KTtcbiAgICByYWN0aXZlLm9uKCdwbHVzb25lJywgcGx1c09uZShwYWdlRGF0YSwgcmFjdGl2ZSkpO1xuICAgIHJldHVybiB7XG4gICAgICAgIG9wZW46IG9wZW5XaW5kb3cocmFjdGl2ZSlcbiAgICB9O1xufVxuXG5mdW5jdGlvbiBzaXplVG9GaXQobm9kZSkge1xuICAgIHZhciAkZWxlbWVudCA9ICQobm9kZSk7XG4gICAgdmFyICRyb290RWxlbWVudCA9ICRlbGVtZW50LmNsb3Nlc3QoJy5hbnRlbm5hLXJlYWN0aW9ucy13aWRnZXQnKTtcbiAgICBpZiAoJHJvb3RFbGVtZW50Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgJHJvb3RFbGVtZW50LmNzcyh7ZGlzcGxheTogJ2Jsb2NrJywgbGVmdDogJzEwMCUnfSk7XG5cbiAgICAgICAgdmFyICRwYXJlbnQgPSAkZWxlbWVudC5wYXJlbnQoKTtcbiAgICAgICAgdmFyIHJhdGlvID0gJHBhcmVudC5vdXRlcldpZHRoKCkgLyBub2RlLnNjcm9sbFdpZHRoO1xuICAgICAgICBpZiAocmF0aW8gPCAxLjApIHtcbiAgICAgICAgICAgIC8vIElmIHRoZSB0ZXh0IGRvZXNuJ3QgZml0LCBmaXJzdCB0cnkgdG8gd3JhcCBpdCB0byB0d28gbGluZXMuIFRoZW4gc2NhbGUgaXQgZG93biBpZiBzdGlsbCBuZWNlc3NhcnkuXG4gICAgICAgICAgICAvLyBUT0RPOiBDbGVhbiB1cCB0aGlzIGNvZGUuXG4gICAgICAgICAgICB2YXIgdGV4dCA9IG5vZGUuaW5uZXJIVE1MO1xuICAgICAgICAgICAgdmFyIHNwbGl0SW5kZXggPSB0ZXh0LmluZGV4T2YoJyAnLCB0ZXh0Lmxlbmd0aCAvIDIpO1xuICAgICAgICAgICAgaWYgKHNwbGl0SW5kZXggPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgc3BsaXRJbmRleCA9IHRleHQubGFzdEluZGV4T2YoJyAnLCB0ZXh0Lmxlbmd0aCAvIDIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHNwbGl0SW5kZXggPiAxKSB7XG4gICAgICAgICAgICAgICAgbm9kZS5pbm5lckhUTUwgPSB0ZXh0LnNsaWNlKDAsIHNwbGl0SW5kZXgpICsgJzxicj4nICsgdGV4dC5zbGljZShzcGxpdEluZGV4KTtcbiAgICAgICAgICAgICAgICByYXRpbyA9ICRwYXJlbnQub3V0ZXJXaWR0aCgpIC8gbm9kZS5zY3JvbGxXaWR0aDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChyYXRpbyA8IDEuMCkge1xuICAgICAgICAgICAgICAgIHZhciBtaW5TaXplID0gMTA7XG4gICAgICAgICAgICAgICAgdmFyIG5ld1NpemUgPSBNYXRoLm1heChtaW5TaXplLCBNYXRoLmZsb29yKHBhcnNlSW50KCRlbGVtZW50LmNzcygnZm9udC1zaXplJykpICogcmF0aW8pIC0gMSk7XG4gICAgICAgICAgICAgICAgJGVsZW1lbnQuY3NzKCdmb250LXNpemUnLCBuZXdTaXplKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgICRyb290RWxlbWVudC5jc3Moe2Rpc3BsYXk6ICcnLCBsZWZ0OiAnJ30pO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICB0ZWFyZG93bjogZnVuY3Rpb24oKSB7fVxuICAgIH07XG59XG5cbmZ1bmN0aW9uIHBsdXNPbmUocGFnZURhdGEsIHJhY3RpdmUpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgLy8gT3B0aW1pc3RpY2FsbHkgdXBkYXRlIG91ciBsb2NhbCBkYXRhIHN0b3JlIGFuZCB0aGUgVUkuIFRoZW4gc2VuZCB0aGUgcmVxdWVzdCB0byB0aGUgc2VydmVyLlxuICAgICAgICB2YXIgcmVhY3Rpb25EYXRhID0gZXZlbnQuY29udGV4dDtcbiAgICAgICAgcmVhY3Rpb25EYXRhLmNvdW50ID0gcmVhY3Rpb25EYXRhLmNvdW50ICsgMTtcbiAgICAgICAgLy8gVE9ETzogY2hlY2sgYmFjayBvbiB0aGlzIGFzIHRoZSB3YXkgdG8gcHJvcG9nYXRlIGRhdGEgY2hhbmdlcyBiYWNrIHRvIHRoZSBzdW1tYXJ5XG4gICAgICAgIHBhZ2VEYXRhLnN1bW1hcnkudG90YWxSZWFjdGlvbnMgPSBwYWdlRGF0YS5zdW1tYXJ5LnRvdGFsUmVhY3Rpb25zICsgMTtcblxuICAgICAgICBYRE1DbGllbnQuZ2V0VXNlcihmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAgICAgdmFyIHVzZXJJbmZvID0gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgICAgIHBvc3RQbHVzT25lKHJlYWN0aW9uRGF0YSwgdXNlckluZm8sIHBhZ2VEYXRhLCByYWN0aXZlKTtcbiAgICAgICAgfSk7XG4gICAgfTtcbn1cblxuZnVuY3Rpb24gcG9zdFBsdXNPbmUocmVhY3Rpb25EYXRhLCB1c2VySW5mbywgcGFnZURhdGEsIHJhY3RpdmUpIHtcbiAgICAvLyBUT0RPIGV4dHJhY3QgdGhlIHNoYXBlIG9mIHRoaXMgZGF0YSBhbmQgcG9zc2libHkgdGhlIHdob2xlIEFQSSBjYWxsXG4gICAgLy8gVE9ETyB0aGlzIGlzIG9ubHkgaGFuZGxpbmcgdGhlIHN1bW1hcnkgY2FzZS4gbmVlZCB0byBnZW5lcmFsaXplIHRoZSB3aWRnZXQgdG8gaGFuZGxlIGNvbnRhaW5lcnMvY29udGVudFxuICAgIHZhciBkYXRhID0ge1xuICAgICAgICB0YWc6IHtcbiAgICAgICAgICAgIGJvZHk6IHJlYWN0aW9uRGF0YS50ZXh0LFxuICAgICAgICAgICAgaWQ6IHJlYWN0aW9uRGF0YS5pZCxcbiAgICAgICAgICAgIHRhZ19jb3VudDogcmVhY3Rpb25EYXRhLmNvdW50IC8vIFRPRE8gd2h5Pz9cbiAgICAgICAgfSxcbiAgICAgICAgaGFzaDogJ3BhZ2UnLFxuICAgICAgICBraW5kOiAncGFnZScsXG4gICAgICAgIHVzZXJfaWQ6IHVzZXJJbmZvLnVzZXJfaWQsXG4gICAgICAgIGFudF90b2tlbjogdXNlckluZm8uYW50X3Rva2VuLFxuICAgICAgICBwYWdlX2lkOiBwYWdlRGF0YS5wYWdlSWQsXG4gICAgICAgIGdyb3VwX2lkOiBwYWdlRGF0YS5ncm91cElkLFxuICAgICAgICBjb250YWluZXJfa2luZDogJ3RleHQnLCAvLyBUT0RPOiB3aHkgaXMgdGhpcyAndGV4dCcgZm9yIGEgcGFnZSByZWFjdGlvbj9cbiAgICAgICAgY29udGVudF9ub2RlOiAnJyxcbiAgICAgICAgY29udGVudF9ub2RlX2RhdGE6IHtcbiAgICAgICAgICAgIGJvZHk6ICcnLFxuICAgICAgICAgICAga2luZDogJ3BhZ2UnLFxuICAgICAgICAgICAgaXRlbV90eXBlOiAncGFnZSdcbiAgICAgICAgfVxuICAgIH07XG4gICAgdmFyIHN1Y2Nlc3MgPSBmdW5jdGlvbihqc29uKSB7XG4gICAgICAgIHZhciByZXNwb25zZSA9IHsgLy8gVE9ETzoganVzdCBjYXB0dXJpbmcgdGhlIGFwaSBmb3JtYXQuLi5cbiAgICAgICAgICAgIGV4aXN0aW5nOiBqc29uLmV4aXN0aW5nLFxuICAgICAgICAgICAgaW50ZXJhY3Rpb246IHtcbiAgICAgICAgICAgICAgICBpZDoganNvbi5pbnRlcmFjdGlvbi5pZCxcbiAgICAgICAgICAgICAgICBpbnRlcmFjdGlvbl9ub2RlOiB7XG4gICAgICAgICAgICAgICAgICAgIGJvZHk6IGpzb24uaW50ZXJhY3Rpb24uaW50ZXJhY3Rpb25fbm9kZS5ib2R5LFxuICAgICAgICAgICAgICAgICAgICBpZDoganNvbi5pbnRlcmFjdGlvbi5pbnRlcmFjdGlvbl9ub2RlLmlkXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICAvL2lmIChqc29uLmV4aXN0aW5nKSB7XG4gICAgICAgIC8vICAgIGhhbmRsZUR1cGxpY2F0ZVJlYWN0aW9uKHJlYWN0aW9uRGF0YSk7XG4gICAgICAgIC8vfSBlbHNlIHtcbiAgICAgICAgLy8gICAgaGFuZGxlTmV3UmVhY3Rpb24ocmVhY3Rpb25EYXRhKTtcbiAgICAgICAgLy99XG4gICAgICAgIC8vIFRPRE86IFdlIGNhbiBlaXRoZXIgYWNjZXNzIHRoaXMgZGF0YSB0aHJvdWdoIHRoZSByYWN0aXZlIGtleXBhdGggb3IgYnkgcGFzc2luZyB0aGUgZGF0YSBvYmplY3QgYXJvdW5kLiBQaWNrIG9uZS5cbiAgICAgICAgcmFjdGl2ZS5zZXQoJ3Jlc3BvbnNlLmV4aXN0aW5nJywgcmVzcG9uc2UuZXhpc3RpbmcpO1xuICAgICAgICBzaG93UmVhY3Rpb25SZXN1bHQocmFjdGl2ZSk7XG4gICAgICAgIGNvbnNvbGUubG9nKCdzdWNjZXNzIScpO1xuICAgIH07XG4gICAgdmFyIGVycm9yID0gZnVuY3Rpb24obWVzc2FnZSkge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiRXJyb3IgcG9zdGluZyByZWFjdGlvbjogXCIgKyBtZXNzYWdlKTtcbiAgICB9O1xuICAgICQuZ2V0SlNPTlAoVVJMcy5jcmVhdGVSZWFjdGlvblVybCgpLCBkYXRhLCBzdWNjZXNzLCBlcnJvcik7XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVMYXlvdXREYXRhKHJlYWN0aW9uc0RhdGEsIGNvbG9ycykge1xuICAgIC8vIFRPRE8gVmVyaWZ5IHRoYXQgdGhlIHJlYWN0aW9uc0RhdGEgaXMgY29taW5nIGJhY2sgZnJvbSB0aGUgc2VydmVyIHNvcnRlZC4gSWYgbm90LCBzb3J0IGl0IGFmdGVyIGl0cyBmZXRjaGVkLlxuXG4gICAgdmFyIG51bVJlYWN0aW9ucyA9IHJlYWN0aW9uc0RhdGEubGVuZ3RoO1xuICAgIC8vIFRPRE86IENvcGllZCBjb2RlIGZyb20gZW5nYWdlX2Z1bGwuY3JlYXRlVGFnQnVja2V0c1xuICAgIHZhciBtYXggPSByZWFjdGlvbnNEYXRhWzBdLmNvdW50O1xuICAgIHZhciBtZWRpYW4gPSByZWFjdGlvbnNEYXRhWyBNYXRoLmZsb29yKHJlYWN0aW9uc0RhdGEubGVuZ3RoLzIpIF0uY291bnQ7XG4gICAgdmFyIG1pbiA9IHJlYWN0aW9uc0RhdGFbIHJlYWN0aW9uc0RhdGEubGVuZ3RoLTEgXS5jb3VudDtcbiAgICB2YXIgdG90YWwgPSAwO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbnVtUmVhY3Rpb25zOyBpKyspIHtcbiAgICAgICAgdG90YWwgKz0gcmVhY3Rpb25zRGF0YVtpXS5jb3VudDtcbiAgICB9XG4gICAgdmFyIGF2ZXJhZ2UgPSBNYXRoLmZsb29yKHRvdGFsIC8gbnVtUmVhY3Rpb25zKTtcbiAgICB2YXIgbWlkVmFsdWUgPSAoIG1lZGlhbiA+IGF2ZXJhZ2UgKSA/IG1lZGlhbiA6IGF2ZXJhZ2U7XG5cbiAgICB2YXIgbGF5b3V0Q2xhc3NlcyA9IFtdO1xuICAgIHZhciBudW1IYWxmc2llcyA9IDA7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBudW1SZWFjdGlvbnM7IGkrKykge1xuICAgICAgICBpZiAocmVhY3Rpb25zRGF0YVtpXS5jb3VudCA+IG1pZFZhbHVlKSB7XG4gICAgICAgICAgICBsYXlvdXRDbGFzc2VzW2ldID0gJ2Z1bGwnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbGF5b3V0Q2xhc3Nlc1tpXSA9ICdoYWxmJztcbiAgICAgICAgICAgIG51bUhhbGZzaWVzKys7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKG51bUhhbGZzaWVzICUgMiAhPT0wKSB7XG4gICAgICAgIGxheW91dENsYXNzZXNbbnVtUmVhY3Rpb25zIC0gMV0gPSAnZnVsbCc7IC8vIElmIHRoZXJlIGFyZSBhbiBvZGQgbnVtYmVyLCB0aGUgbGFzdCBvbmUgZ29lcyBmdWxsLlxuICAgIH1cblxuICAgIHZhciBudW1Db2xvcnMgPSBjb2xvcnMubGVuZ3RoO1xuICAgIHZhciBiYWNrZ3JvdW5kQ29sb3JzID0gW107XG4gICAgdmFyIGNvbG9ySW5kZXggPSAwO1xuICAgIHZhciBwYWlyV2l0aE5leHQgPSAwO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbnVtUmVhY3Rpb25zOyBpKyspIHtcbiAgICAgICAgYmFja2dyb3VuZENvbG9yc1tpXSA9IGNvbG9yc1tjb2xvckluZGV4JW51bUNvbG9yc107XG4gICAgICAgIGlmIChsYXlvdXRDbGFzc2VzW2ldID09PSAnZnVsbCcpIHtcbiAgICAgICAgICAgIGNvbG9ySW5kZXgrKztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIFRPRE8gZ290dGEgYmUgYWJsZSB0byBtYWtlIHRoaXMgc2ltcGxlclxuICAgICAgICAgICAgaWYgKHBhaXJXaXRoTmV4dCA+IDApIHtcbiAgICAgICAgICAgICAgICBwYWlyV2l0aE5leHQtLTtcbiAgICAgICAgICAgICAgICBpZiAocGFpcldpdGhOZXh0ID09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgY29sb3JJbmRleCsrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcGFpcldpdGhOZXh0ID0gMTsgLy8gSWYgd2Ugd2FudCB0byBhbGxvdyBOIGJveGVzIHBlciByb3csIHRoaXMgbnVtYmVyIHdvdWxkIGJlY29tZSBjb25kaXRpb25hbC5cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIGxheW91dENsYXNzZXM6IGxheW91dENsYXNzZXMsXG4gICAgICAgIGJhY2tncm91bmRDb2xvcnM6IGJhY2tncm91bmRDb2xvcnNcbiAgICB9O1xufVxuXG5mdW5jdGlvbiByb290RWxlbWVudChyYWN0aXZlKSB7XG4gICAgLy8gVE9ETzogZ290dGEgYmUgYSBiZXR0ZXIgd2F5IHRvIGdldCB0aGlzXG4gICAgcmV0dXJuIHJhY3RpdmUuZmluZCgnZGl2Jyk7XG59XG5cbmZ1bmN0aW9uIHNob3dSZWFjdGlvblJlc3VsdChyYWN0aXZlKSB7XG4gICAgdmFyICRyb290ID0gJChyb290RWxlbWVudChyYWN0aXZlKSk7XG4gICAgLy8gVE9ETzogVGhpcyBpcyBwcm9iYWJseSB3aGVyZSBhIFJhY3RpdmUgcGFydGlhbCBjb21lcyBpbi4gTmVlZCBhIG5lc3RlZCB0ZW1wbGF0ZSBoZXJlIGZvciBzaG93aW5nIHRoZSByZXN1bHQuXG4gICAgLy8kcm9vdC5maW5kKCcuYW50ZW5uYS1yZWFjdGlvbnMtcGFnZScpLmNzcyh7IGxlZnQ6ICctMTAwJScsIHJpZ2h0OiAwIH0pO1xuICAgIC8vJHJvb3QuZmluZCgnLmFudGVubmEtcmVjZWl2ZWQtcGFnZScpLmNzcyh7IGxlZnQ6IDAsIHJpZ2h0OiAnJyB9KTtcbiAgICAkcm9vdC5maW5kKCcuYW50ZW5uYS1yZWNlaXZlZC1wYWdlJykuYW5pbWF0ZSh7IGxlZnQ6IDAgfSk7XG4gICAgJHJvb3QuYW5pbWF0ZSh7IHdpZHRoOiAzMDAgfSwgeyBkZWxheTogMTAwIH0pO1xuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIHNob3dSZWFjdGlvbnMocmFjdGl2ZSwgdHJ1ZSk7XG4gICAgfSwgMTAwMCk7XG59XG5cbmZ1bmN0aW9uIHNob3dSZWFjdGlvbnMocmFjdGl2ZSwgYW5pbWF0ZSkge1xuICAgIHZhciAkcm9vdCA9ICQocm9vdEVsZW1lbnQocmFjdGl2ZSkpO1xuICAgIC8vIFRPRE86IFRoaXMgaXMgcHJvYmFibHkgd2hlcmUgYSBSYWN0aXZlIHBhcnRpYWwgY29tZXMgaW4uIE5lZWQgYSBuZXN0ZWQgdGVtcGxhdGUgaGVyZSBmb3Igc2hvd2luZyB0aGUgcmVzdWx0LlxuICAgIC8vJHJvb3QuZmluZCgnLmFudGVubmEtcmVhY3Rpb25zLXBhZ2UnKS5jc3MoeyBsZWZ0OiAnLTEwMCUnLCByaWdodDogMCB9KTtcbiAgICAvLyRyb290LmZpbmQoJy5hbnRlbm5hLXJlY2VpdmVkLXBhZ2UnKS5jc3MoeyBsZWZ0OiAwLCByaWdodDogJycgfSk7XG4gICAgaWYgKGFuaW1hdGUpIHtcbiAgICAgICAgJHJvb3QuZmluZCgnLmFudGVubmEtcmVjZWl2ZWQtcGFnZScpLmFuaW1hdGUoeyBsZWZ0OiAnMTAwJScgfSk7XG4gICAgICAgICRyb290LmFuaW1hdGUoeyB3aWR0aDogMjAwIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICAgICRyb290LmZpbmQoJy5hbnRlbm5hLXJlY2VpdmVkLXBhZ2UnKS5jc3MoeyBsZWZ0OiAnMTAwJScgfSk7XG4gICAgICAgICRyb290LmNzcyh7IHdpZHRoOiAyMDAgfSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBvcGVuV2luZG93KHJhY3RpdmUpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24ocmVsYXRpdmVFbGVtZW50KSB7XG4gICAgICAgIHZhciAkcmVsYXRpdmVFbGVtZW50ID0gJChyZWxhdGl2ZUVsZW1lbnQpO1xuICAgICAgICB2YXIgb2Zmc2V0ID0gJHJlbGF0aXZlRWxlbWVudC5vZmZzZXQoKTtcbiAgICAgICAgdmFyIGNvb3JkcyA9IHtcbiAgICAgICAgICAgIHRvcDogb2Zmc2V0LnRvcCArIDUsLy8kcmVsYXRpdmVFbGVtZW50LmhlaWdodCgpLFxuICAgICAgICAgICAgbGVmdDogb2Zmc2V0LmxlZnQgKyA1XG4gICAgICAgIH07XG4gICAgICAgIHZhciAkcm9vdEVsZW1lbnQgPSAkKHJvb3RFbGVtZW50KHJhY3RpdmUpKTtcbiAgICAgICAgJHJvb3RFbGVtZW50LnN0b3AodHJ1ZSwgdHJ1ZSkuYWRkQ2xhc3MoJ29wZW4nKS5jc3MoY29vcmRzKTtcblxuICAgICAgICBzZXR1cFdpbmRvd0Nsb3NlKHJhY3RpdmUpO1xuICAgIH07XG59XG5cbmZ1bmN0aW9uIHNldHVwV2luZG93Q2xvc2UocmFjdGl2ZSkge1xuICAgIHZhciAkcm9vdEVsZW1lbnQgPSAkKHJvb3RFbGVtZW50KHJhY3RpdmUpKTtcblxuICAgICRyb290RWxlbWVudFxuICAgICAgICAub24oJ21vdXNlb3V0LmFudGVubmEnLCBkZWxheWVkQ2xvc2VXaW5kb3coKSlcbiAgICAgICAgLm9uKCdtb3VzZW92ZXIuYW50ZW5uYScsIGtlZXBXaW5kb3dPcGVuKVxuICAgICAgICAub24oJ2ZvY3VzaW4uYW50ZW5uYScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy8gT25jZSB0aGUgd2luZG93IGhhcyBmb2N1cywgZG9uJ3QgY2xvc2UgaXQgb24gbW91c2VvdXQuXG4gICAgICAgICAgICBrZWVwV2luZG93T3BlbigpO1xuICAgICAgICAgICAgJHJvb3RFbGVtZW50Lm9mZignbW91c2VvdXQuYW50ZW5uYScpO1xuICAgICAgICAgICAgJHJvb3RFbGVtZW50Lm9mZignbW91c2VvdmVyLmFudGVubmEnKTtcbiAgICAgICAgfSlcbiAgICAgICAgLm9uKCdmb2N1c291dC5hbnRlbm5hJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBjbG9zZVdpbmRvdygpO1xuICAgICAgICB9KTtcblxuICAgIHZhciBjbG9zZVRpbWVyO1xuXG4gICAgZnVuY3Rpb24gZGVsYXllZENsb3NlV2luZG93KCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBjbG9zZVRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBjbG9zZVRpbWVyID0gbnVsbDtcbiAgICAgICAgICAgICAgICBjbG9zZVdpbmRvdygpO1xuICAgICAgICAgICAgfSwgNTAwKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBrZWVwV2luZG93T3BlbigpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KGNsb3NlVGltZXIpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNsb3NlV2luZG93KCkge1xuICAgICAgICBjbGVhclRpbWVvdXQoY2xvc2VUaW1lcik7XG5cbiAgICAgICAgJHJvb3RFbGVtZW50LnN0b3AodHJ1ZSwgdHJ1ZSkuZmFkZU91dCgnZmFzdCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgJHJvb3RFbGVtZW50LmNzcygnZGlzcGxheScsICcnKTsgLy8gQ2xlYXIgdGhlIGRpc3BsYXk6bm9uZSB0aGF0IGZhZGVPdXQgcHV0cyBvbiB0aGUgZWxlbWVudFxuICAgICAgICAgICAgJHJvb3RFbGVtZW50LnJlbW92ZUNsYXNzKCdvcGVuJyk7XG5cbiAgICAgICAgICAgICRyb290RWxlbWVudC5vZmYoJy5hbnRlbm5hJyk7IC8vIFVuYmluZCBhbGwgb2YgdGhlIGhhbmRsZXJzIGluIG91ciBuYW1lc3BhY2VcbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGU6IGNyZWF0ZVJlYWN0aW9uc1dpZGdldFxufTsiLCJcbnZhciBpc09mZmxpbmUgPSByZXF1aXJlKCcuL3V0aWxzL29mZmxpbmUnKTtcblxudmFyIGJhc2VVcmwgPSAnaHR0cDovL2xvY2FsaG9zdDo4MDgxJzsgLy8gVE9ETyBjb21wdXRlIHRoaXNcblxudmFyICQ7XG52YXIgalF1ZXJ5Q2FsbGJhY2tzID0gW107XG5cbmZ1bmN0aW9uIG9uJChjYWxsYmFjaykge1xuICAgIGlmICgkKSB7XG4gICAgICAgIGNhbGxiYWNrKCQpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGpRdWVyeUNhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGpRdWVyeUxvYWRlZCgpIHtcbiAgICAvLyBVcGRhdGUgdGhlICQgdGhhdCB3ZSBkZWZpbmUgd2l0aGluIG91ciBvd24gY2xvc3VyZSB0byB0aGUgdmVyc2lvbiBvZiBqUXVlcnkgdGhhdCB3ZSB3YW50IGFuZCByZXNldCB0aGUgZ2xvYmFsICRcbiAgICAkID0galF1ZXJ5Lm5vQ29uZmxpY3QodHJ1ZSk7XG5cbiAgICAkLmdldEpTT05QID0gZnVuY3Rpb24odXJsLCBkYXRhLCBzdWNjZXNzLCBlcnJvcikge1xuICAgICAgICB2YXIgb3B0aW9ucyA9IHtcbiAgICAgICAgICAgIHVybDogYmFzZVVybCArIHVybCwgLy8gVE9ETyBiYXNlIHVybFxuICAgICAgICAgICAgdHlwZTogXCJnZXRcIixcbiAgICAgICAgICAgIGNvbnRlbnRUeXBlOiBcImFwcGxpY2F0aW9uL2pzb25cIixcbiAgICAgICAgICAgIGRhdGFUeXBlOiBcImpzb25wXCIsXG4gICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbihyZXNwb25zZSwgdGV4dFN0YXR1cywgWEhSKSB7XG4gICAgICAgICAgICAgICAgLy8gVE9ETzogUmV2aXNpdCB3aGV0aGVyIGl0J3MgcmVhbGx5IGNvb2wgdG8ga2V5IHRoaXMgb24gdGhlIHRleHRTdGF0dXMgb3IgaWYgd2Ugc2hvdWxkIGJlIGxvb2tpbmcgYXRcbiAgICAgICAgICAgICAgICAvLyAgICAgICB0aGUgc3RhdHVzIGNvZGUgaW4gdGhlIFhIUlxuICAgICAgICAgICAgICAgIC8vIE5vdGU6IFRoZSBzZXJ2ZXIgY29tZXMgYmFjayB3aXRoIDIwMCByZXNwb25zZXMgd2l0aCBhIG5lc3RlZCBzdGF0dXMgb2YgXCJmYWlsXCIuLi5cbiAgICAgICAgICAgICAgICBpZiAodGV4dFN0YXR1cyA9PT0gJ3N1Y2Nlc3MnICYmIHJlc3BvbnNlLnN0YXR1cyAhPT0gJ2ZhaWwnKSB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3MocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gRm9yIEpTT05QIHJlcXVlc3RzLCBqUXVlcnkgZG9lc24ndCBjYWxsIGl0J3MgZXJyb3IgY2FsbGJhY2suIEl0IGNhbGxzIHN1Y2Nlc3MgaW5zdGVhZC5cbiAgICAgICAgICAgICAgICAgICAgZXJyb3IocmVzcG9uc2UubWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBpZiAoZGF0YSkge1xuICAgICAgICAgICAgb3B0aW9ucy5kYXRhID0geyBqc29uOiBKU09OLnN0cmluZ2lmeShkYXRhKSB9O1xuICAgICAgICB9XG4gICAgICAgICQuYWpheChvcHRpb25zKTtcbiAgICB9O1xuXG4gICAgd2hpbGUgKGpRdWVyeUNhbGxiYWNrcy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGpRdWVyeUNhbGxiYWNrcy5wb3AoKSgkKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGxvYWRTY3JpcHRzKGxvYWRlZENhbGxiYWNrKSB7XG4gICAgdmFyIHNjcmlwdHMgPSBbXG4gICAgICAgIHtzcmM6ICcvL2NkbmpzLmNsb3VkZmxhcmUuY29tL2FqYXgvbGlicy9qcXVlcnkvMi4xLjQvanF1ZXJ5Lm1pbi5qcycsIGNhbGxiYWNrOiBqUXVlcnlMb2FkZWR9LFxuICAgICAgICB7c3JjOiAnLy9jZG5qcy5jbG91ZGZsYXJlLmNvbS9hamF4L2xpYnMvcmFjdGl2ZS8wLjcuMy9yYWN0aXZlLnJ1bnRpbWUubWluLmpzJ31cbiAgICBdO1xuICAgIGlmIChpc09mZmxpbmUpIHtcbiAgICAgICAgLy8gVXNlIHRoZSBvZmZsaW5lIHZlcnNpb25zIG9mIHRoZSBsaWJyYXJpZXMgZm9yIGRldmVsb3BtZW50LlxuICAgICAgICBzY3JpcHRzID0gW1xuICAgICAgICAgICAge3NyYzogYmFzZVVybCArICcvc3RhdGljL2pzL2Nkbi9qcXVlcnkvMi4xLjQvanF1ZXJ5LmpzJywgY2FsbGJhY2s6IGpRdWVyeUxvYWRlZH0sXG4gICAgICAgICAgICB7c3JjOiBiYXNlVXJsICsgJy9zdGF0aWMvanMvY2RuL3JhY3RpdmUvMC43LjMvcmFjdGl2ZS5ydW50aW1lLmpzJ31cbiAgICAgICAgXTtcbiAgICB9XG4gICAgdmFyIGxvYWRpbmdDb3VudCA9IHNjcmlwdHMubGVuZ3RoO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2NyaXB0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgc2NyaXB0ID0gc2NyaXB0c1tpXTtcbiAgICAgICAgbG9hZFNjcmlwdChzY3JpcHQuc3JjLCBmdW5jdGlvbihzY3JpcHRDYWxsYmFjaykge1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmIChzY3JpcHRDYWxsYmFjaykgc2NyaXB0Q2FsbGJhY2soKTtcbiAgICAgICAgICAgICAgICBsb2FkaW5nQ291bnQgPSBsb2FkaW5nQ291bnQgLSAxO1xuICAgICAgICAgICAgICAgIGlmIChsb2FkaW5nQ291bnQgPT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAobG9hZGVkQ2FsbGJhY2spIGxvYWRlZENhbGxiYWNrKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSAoc2NyaXB0LmNhbGxiYWNrKSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBsb2FkU2NyaXB0KHNyYywgY2FsbGJhY2spIHtcbiAgICB2YXIgaGVhZCA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF07XG4gICAgaWYgKGhlYWQpIHtcbiAgICAgICAgdmFyIHNjcmlwdFRhZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuICAgICAgICBzY3JpcHRUYWcuc2V0QXR0cmlidXRlKCdzcmMnLCBzcmMpO1xuICAgICAgICBzY3JpcHRUYWcuc2V0QXR0cmlidXRlKCd0eXBlJywndGV4dC9qYXZhc2NyaXB0Jyk7XG5cbiAgICAgICAgaWYgKHNjcmlwdFRhZy5yZWFkeVN0YXRlKSB7IC8vIElFLCBpbmNsLiBJRTlcbiAgICAgICAgICAgIHNjcmlwdFRhZy5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBpZiAoc2NyaXB0VGFnLnJlYWR5U3RhdGUgPT0gXCJsb2FkZWRcIiB8fCBzY3JpcHRUYWcucmVhZHlTdGF0ZSA9PSBcImNvbXBsZXRlXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgc2NyaXB0VGFnLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNjcmlwdFRhZy5vbmxvYWQgPSBmdW5jdGlvbigpIHsgLy8gT3RoZXIgYnJvd3NlcnNcbiAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIGhlYWQuYXBwZW5kQ2hpbGQoc2NyaXB0VGFnKTtcbiAgICB9XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBsb2FkOiBsb2FkU2NyaXB0cyxcbiAgICBvbiQ6IG9uJFxufTsiLCJcbnZhciBSZWFjdGlvbnNXaWRnZXQgPSByZXF1aXJlKCcuL3JlYWN0aW9ucy13aWRnZXQnKTtcblxudmFyIHJhY3RpdmU7XG52YXIgcmVhY3Rpb25zV2lkZ2V0O1xuXG5mdW5jdGlvbiBjcmVhdGVTdW1tYXJ5V2lkZ2V0KGNvbnRhaW5lciwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICAvLy8vIFRPRE8gcmVwbGFjZSBlbGVtZW50XG4gICAgcmFjdGl2ZSA9IFJhY3RpdmUoe1xuICAgICAgICBlbDogY29udGFpbmVyLFxuICAgICAgICBkYXRhOiBwYWdlRGF0YSxcbiAgICAgICAgbWFnaWM6IHRydWUsXG4gICAgICAgIHRlbXBsYXRlOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvc3VtbWFyeS13aWRnZXQuaHRtbCcpLFxuICAgICAgICBvbmNvbXBsZXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgICAgICQocm9vdEVsZW1lbnQoKSkub24oJ2NsaWNrJywgZnVuY3Rpb24oZXZlbnQpIHsgLy8gVE9ETzogZGVsZXRlLiB0aGlzIGlzIGp1c3QgdG95XG4gICAgICAgICAgICAgICB0aGF0LmFkZCgnc3VtbWFyeS50b3RhbFJlYWN0aW9ucycpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAkKHJvb3RFbGVtZW50KCkpLm9uKCdtb3VzZWVudGVyJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgICAgIG9wZW5SZWFjdGlvbnNXaW5kb3cocGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gcmFjdGl2ZTtcbn1cblxuZnVuY3Rpb24gcm9vdEVsZW1lbnQoKSB7XG4gICAgLy8gVE9ETzogZ290dGEgYmUgYSBiZXR0ZXIgd2F5IHRvIGdldCB0aGlzXG4gICAgLy8gVE9ETzogb3VyIGNsaWNrIGhhbmRsZXIgaXMgZ2V0dGluZyBjYWxsZWQgdHdpY2UsIHNvIGl0IGxvb2tzIGxpa2UgdGhpcyBzb21laG93IGdldHMgdGhlIHdyb25nIGVsZW1lbnQgaWYgdGhlcmUgYXJlIHR3byBzdW1tYXJ5IHdpZGdldHMgdG9nZXRoZXI/XG4gICAgcmV0dXJuIHJhY3RpdmUuZmluZCgnZGl2Jyk7XG59XG5cbmZ1bmN0aW9uIG9wZW5SZWFjdGlvbnNXaW5kb3cocGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICBpZiAoIXJlYWN0aW9uc1dpZGdldCkge1xuICAgICAgICAvLyBUT0RPOiBjb25zaWRlciBwcmVwb3B1bGF0aW5nIHRoaXNcbiAgICAgICAgdmFyIGJ1Y2tldCA9IGdldFdpZGdldEJ1Y2tldCgpO1xuICAgICAgICB2YXIgY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIGJ1Y2tldC5hcHBlbmRDaGlsZChjb250YWluZXIpO1xuICAgICAgICByZWFjdGlvbnNXaWRnZXQgPSBSZWFjdGlvbnNXaWRnZXQuY3JlYXRlKGNvbnRhaW5lciwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgIH1cbiAgICByZWFjdGlvbnNXaWRnZXQub3Blbihyb290RWxlbWVudCgpKTtcbn1cblxuZnVuY3Rpb24gZ2V0V2lkZ2V0QnVja2V0KCkge1xuICAgIHZhciBidWNrZXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYW50ZW5uYS13aWRnZXQtYnVja2V0Jyk7XG4gICAgaWYgKCFidWNrZXQpIHtcbiAgICAgICAgYnVja2V0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIGJ1Y2tldC5zZXRBdHRyaWJ1dGUoJ2lkJywgJ2FudGVubmEtd2lkZ2V0LWJ1Y2tldCcpO1xuICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGJ1Y2tldCk7XG4gICAgfVxuICAgIHJldHVybiBidWNrZXQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZTogY3JlYXRlU3VtbWFyeVdpZGdldFxufTsiLCJcbnZhciBNRDUgPSByZXF1aXJlKCcuL21kNScpO1xuXG4vLyBUT0RPOiBUaGlzIGlzIGp1c3QgY29weS9wYXN0ZWQgZnJvbSBlbmdhZ2VfZnVsbFxuLy8gVE9ETzogVGhlIGNvZGUgaXMgbG9va2luZyBmb3IgLmFudF9pbmRpY2F0b3IgdG8gc2VlIGlmIGl0J3MgYWxyZWFkeSBiZWVuIGhhc2hlZC4gUmV2aWV3LlxuZnVuY3Rpb24gZ2V0Q2xlYW5UZXh0KCRkb21Ob2RlKSB7XG4gICAgLy8gQU5ULnV0aWwuZ2V0Q2xlYW5UZXh0XG4gICAgLy8gY29tbW9uIGZ1bmN0aW9uIGZvciBjbGVhbmluZyB0aGUgdGV4dCBub2RlIHRleHQuICByaWdodCBub3csIGl0J3MgcmVtb3Zpbmcgc3BhY2VzLCB0YWJzLCBuZXdsaW5lcywgYW5kIHRoZW4gZG91YmxlIHNwYWNlc1xuXG4gICAgdmFyICRub2RlID0gJGRvbU5vZGUuY2xvbmUoKTtcblxuICAgICRub2RlLmZpbmQoJy5hbnQsIC5hbnQtY3VzdG9tLWN0YS1jb250YWluZXInKS5yZW1vdmUoKTtcblxuICAgIC8vbWFrZSBzdXJlIGl0IGRvZXNudCBhbHJlZHkgaGF2ZSBpbiBpbmRpY2F0b3IgLSBpdCBzaG91bGRuJ3QuXG4gICAgdmFyICRpbmRpY2F0b3IgPSAkbm9kZS5maW5kKCcuYW50X2luZGljYXRvcicpO1xuICAgIGlmKCRpbmRpY2F0b3IubGVuZ3RoKXtcbiAgICAgICAgLy90b2RvOiBzZW5kIHVzIGFuIGVycm9yIHJlcG9ydCAtIHRoaXMgbWF5IHN0aWxsIGJlIGhhcHBlbmluZyBmb3Igc2xpZGVzaG93cy5cbiAgICAgICAgLy9UaGlzIGZpeCB3b3JrcyBmaW5lLCBidXQgd2Ugc2hvdWxkIGZpeCB0aGUgY29kZSB0byBoYW5kbGUgaXQgYmVmb3JlIGhlcmUuXG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBnZXQgdGhlIG5vZGUncyB0ZXh0IGFuZCBzbWFzaCBjYXNlXG4gICAgLy8gVE9ETzogPGJyPiB0YWdzIGFuZCBibG9jay1sZXZlbCB0YWdzIGNhbiBzY3JldyB1cCB3b3Jkcy4gIGV4OlxuICAgIC8vIGhlbGxvPGJyPmhvdyBhcmUgeW91PyAgIGhlcmUgYmVjb21lc1xuICAgIC8vIGhlbGxvaG93IGFyZSB5b3U/ICAgIDwtLSBubyBzcGFjZSB3aGVyZSB0aGUgPGJyPiB3YXMuICBiYWQuXG4gICAgdmFyIG5vZGVfdGV4dCA9ICQudHJpbSggJG5vZGUuaHRtbCgpLnJlcGxhY2UoLzwgKmJyICpcXC8/Pi9naSwgJyAnKSApO1xuICAgIHZhciBib2R5ID0gJC50cmltKCAkKCBcIjxkaXY+XCIgKyBub2RlX3RleHQgKyBcIjwvZGl2PlwiICkudGV4dCgpLnRvTG93ZXJDYXNlKCkgKTtcblxuICAgIGlmKCBib2R5ICYmIHR5cGVvZiBib2R5ID09IFwic3RyaW5nXCIgJiYgYm9keSAhPT0gXCJcIiApIHtcbiAgICAgICAgdmFyIGZpcnN0cGFzcyA9IGJvZHkucmVwbGFjZSgvW1xcblxcclxcdF0rL2dpLCcgJykucmVwbGFjZSgpLnJlcGxhY2UoL1xcc3syLH0vZywnICcpO1xuICAgICAgICAvLyBzZWVpbmcgaWYgdGhpcyBoZWxwcyB0aGUgcHJvcHViIGlzc3VlIC0gdG8gdHJpbSBhZ2Fpbi4gIFdoZW4gaSBydW4gdGhpcyBsaW5lIGFib3ZlIGl0IGxvb2tzIGxpa2UgdGhlcmUgaXMgc3RpbGwgd2hpdGUgc3BhY2UuXG4gICAgICAgIHJldHVybiAkLnRyaW0oZmlyc3RwYXNzKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGhhc2hUZXh0KGVsZW1lbnQpIHtcbiAgICAvLyBUT0RPOiBIYW5kbGUgdGhlIGNhc2Ugd2hlcmUgbXVsdGlwbGUgaW5zdGFuY2VzIG9mIHRoZSBzYW1lIHRleHQgYXBwZWFyIG9uIHRoZSBwYWdlLiBOZWVkIHRvIGFkZCBhbiBpbmNyZW1lbnQgdG9cbiAgICAvLyB0aGUgaGFzaFRleHQuIChUaGlzIGNoZWNrIGhhcyB0byBiZSBzY29wZWQgdG8gYSBwb3N0KVxuICAgIHZhciB0ZXh0ID0gZ2V0Q2xlYW5UZXh0KGVsZW1lbnQpO1xuICAgIHZhciBoYXNoVGV4dCA9IFwicmRyLXRleHQtXCIrdGV4dDtcbiAgICByZXR1cm4gTUQ1LmhleF9tZDUoaGFzaFRleHQpO1xufVxuXG5mdW5jdGlvbiBoYXNoVXJsKHVybCkge1xuICAgIHJldHVybiBNRDUuaGV4X21kNSh1cmwpO1xufVxuXG5mdW5jdGlvbiBoYXNoSW1hZ2UoZWxlbWVudCkge1xuXG59XG5cbmZ1bmN0aW9uIGhhc2hNZWRpYShlbGVtZW50KSB7XG5cbn1cblxuZnVuY3Rpb24gaGFzaEVsZW1lbnQoZWxlbWVudCkge1xuICAgIC8vIFRPRE8gbWFrZSByZWFsXG4gICAgcmV0dXJuICdhYmMnO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgaGFzaFRleHQ6IGhhc2hUZXh0LFxuICAgIGhhc2hVcmw6IGhhc2hVcmxcbn07IiwiXG4vLyBUT0RPOiBUaGlzIGNvZGUgaXMganVzdCBjb3BpZWQgZnJvbSBlbmdhZ2VfZnVsbC5qcy4gUmV2aWV3IHdoZXRoZXIgd2Ugd2FudCB0byBrZWVwIGl0IGFzLWlzLlxuXG52YXIgQU5UID0ge1xuICAgIHV0aWw6IHtcbiAgICAgICAgbWQ1OiB7XG4gICAgICAgICAgICBoZXhjYXNlOjAsXG4gICAgICAgICAgICBiNjRwYWQ6XCJcIixcbiAgICAgICAgICAgIGNocnN6OjgsXG4gICAgICAgICAgICBoZXhfbWQ1OiBmdW5jdGlvbihzKXtyZXR1cm4gQU5ULnV0aWwubWQ1LmJpbmwyaGV4KEFOVC51dGlsLm1kNS5jb3JlX21kNShBTlQudXRpbC5tZDUuc3RyMmJpbmwocykscy5sZW5ndGgqQU5ULnV0aWwubWQ1LmNocnN6KSk7fSxcbiAgICAgICAgICAgIGNvcmVfbWQ1OiBmdW5jdGlvbih4LGxlbil7eFtsZW4+PjVdfD0weDgwPDwoKGxlbiklMzIpO3hbKCgobGVuKzY0KT4+PjkpPDw0KSsxNF09bGVuO3ZhciBhPTE3MzI1ODQxOTM7dmFyIGI9LTI3MTczMzg3OTt2YXIgYz0tMTczMjU4NDE5NDt2YXIgZD0yNzE3MzM4Nzg7Zm9yKHZhciBpPTA7aTx4Lmxlbmd0aDtpKz0xNil7dmFyIG9sZGE9YTt2YXIgb2xkYj1iO3ZhciBvbGRjPWM7dmFyIG9sZGQ9ZDthPUFOVC51dGlsLm1kNS5tZDVfZmYoYSxiLGMsZCx4W2krMF0sNywtNjgwODc2OTM2KTtkPUFOVC51dGlsLm1kNS5tZDVfZmYoZCxhLGIsYyx4W2krMV0sMTIsLTM4OTU2NDU4Nik7Yz1BTlQudXRpbC5tZDUubWQ1X2ZmKGMsZCxhLGIseFtpKzJdLDE3LDYwNjEwNTgxOSk7Yj1BTlQudXRpbC5tZDUubWQ1X2ZmKGIsYyxkLGEseFtpKzNdLDIyLC0xMDQ0NTI1MzMwKTthPUFOVC51dGlsLm1kNS5tZDVfZmYoYSxiLGMsZCx4W2krNF0sNywtMTc2NDE4ODk3KTtkPUFOVC51dGlsLm1kNS5tZDVfZmYoZCxhLGIsYyx4W2krNV0sMTIsMTIwMDA4MDQyNik7Yz1BTlQudXRpbC5tZDUubWQ1X2ZmKGMsZCxhLGIseFtpKzZdLDE3LC0xNDczMjMxMzQxKTtiPUFOVC51dGlsLm1kNS5tZDVfZmYoYixjLGQsYSx4W2krN10sMjIsLTQ1NzA1OTgzKTthPUFOVC51dGlsLm1kNS5tZDVfZmYoYSxiLGMsZCx4W2krOF0sNywxNzcwMDM1NDE2KTtkPUFOVC51dGlsLm1kNS5tZDVfZmYoZCxhLGIsYyx4W2krOV0sMTIsLTE5NTg0MTQ0MTcpO2M9QU5ULnV0aWwubWQ1Lm1kNV9mZihjLGQsYSxiLHhbaSsxMF0sMTcsLTQyMDYzKTtiPUFOVC51dGlsLm1kNS5tZDVfZmYoYixjLGQsYSx4W2krMTFdLDIyLC0xOTkwNDA0MTYyKTthPUFOVC51dGlsLm1kNS5tZDVfZmYoYSxiLGMsZCx4W2krMTJdLDcsMTgwNDYwMzY4Mik7ZD1BTlQudXRpbC5tZDUubWQ1X2ZmKGQsYSxiLGMseFtpKzEzXSwxMiwtNDAzNDExMDEpO2M9QU5ULnV0aWwubWQ1Lm1kNV9mZihjLGQsYSxiLHhbaSsxNF0sMTcsLTE1MDIwMDIyOTApO2I9QU5ULnV0aWwubWQ1Lm1kNV9mZihiLGMsZCxhLHhbaSsxNV0sMjIsMTIzNjUzNTMyOSk7YT1BTlQudXRpbC5tZDUubWQ1X2dnKGEsYixjLGQseFtpKzFdLDUsLTE2NTc5NjUxMCk7ZD1BTlQudXRpbC5tZDUubWQ1X2dnKGQsYSxiLGMseFtpKzZdLDksLTEwNjk1MDE2MzIpO2M9QU5ULnV0aWwubWQ1Lm1kNV9nZyhjLGQsYSxiLHhbaSsxMV0sMTQsNjQzNzE3NzEzKTtiPUFOVC51dGlsLm1kNS5tZDVfZ2coYixjLGQsYSx4W2krMF0sMjAsLTM3Mzg5NzMwMik7YT1BTlQudXRpbC5tZDUubWQ1X2dnKGEsYixjLGQseFtpKzVdLDUsLTcwMTU1ODY5MSk7ZD1BTlQudXRpbC5tZDUubWQ1X2dnKGQsYSxiLGMseFtpKzEwXSw5LDM4MDE2MDgzKTtjPUFOVC51dGlsLm1kNS5tZDVfZ2coYyxkLGEsYix4W2krMTVdLDE0LC02NjA0NzgzMzUpO2I9QU5ULnV0aWwubWQ1Lm1kNV9nZyhiLGMsZCxhLHhbaSs0XSwyMCwtNDA1NTM3ODQ4KTthPUFOVC51dGlsLm1kNS5tZDVfZ2coYSxiLGMsZCx4W2krOV0sNSw1Njg0NDY0MzgpO2Q9QU5ULnV0aWwubWQ1Lm1kNV9nZyhkLGEsYixjLHhbaSsxNF0sOSwtMTAxOTgwMzY5MCk7Yz1BTlQudXRpbC5tZDUubWQ1X2dnKGMsZCxhLGIseFtpKzNdLDE0LC0xODczNjM5NjEpO2I9QU5ULnV0aWwubWQ1Lm1kNV9nZyhiLGMsZCxhLHhbaSs4XSwyMCwxMTYzNTMxNTAxKTthPUFOVC51dGlsLm1kNS5tZDVfZ2coYSxiLGMsZCx4W2krMTNdLDUsLTE0NDQ2ODE0NjcpO2Q9QU5ULnV0aWwubWQ1Lm1kNV9nZyhkLGEsYixjLHhbaSsyXSw5LC01MTQwMzc4NCk7Yz1BTlQudXRpbC5tZDUubWQ1X2dnKGMsZCxhLGIseFtpKzddLDE0LDE3MzUzMjg0NzMpO2I9QU5ULnV0aWwubWQ1Lm1kNV9nZyhiLGMsZCxhLHhbaSsxMl0sMjAsLTE5MjY2MDc3MzQpO2E9QU5ULnV0aWwubWQ1Lm1kNV9oaChhLGIsYyxkLHhbaSs1XSw0LC0zNzg1NTgpO2Q9QU5ULnV0aWwubWQ1Lm1kNV9oaChkLGEsYixjLHhbaSs4XSwxMSwtMjAyMjU3NDQ2Myk7Yz1BTlQudXRpbC5tZDUubWQ1X2hoKGMsZCxhLGIseFtpKzExXSwxNiwxODM5MDMwNTYyKTtiPUFOVC51dGlsLm1kNS5tZDVfaGgoYixjLGQsYSx4W2krMTRdLDIzLC0zNTMwOTU1Nik7YT1BTlQudXRpbC5tZDUubWQ1X2hoKGEsYixjLGQseFtpKzFdLDQsLTE1MzA5OTIwNjApO2Q9QU5ULnV0aWwubWQ1Lm1kNV9oaChkLGEsYixjLHhbaSs0XSwxMSwxMjcyODkzMzUzKTtjPUFOVC51dGlsLm1kNS5tZDVfaGgoYyxkLGEsYix4W2krN10sMTYsLTE1NTQ5NzYzMik7Yj1BTlQudXRpbC5tZDUubWQ1X2hoKGIsYyxkLGEseFtpKzEwXSwyMywtMTA5NDczMDY0MCk7YT1BTlQudXRpbC5tZDUubWQ1X2hoKGEsYixjLGQseFtpKzEzXSw0LDY4MTI3OTE3NCk7ZD1BTlQudXRpbC5tZDUubWQ1X2hoKGQsYSxiLGMseFtpKzBdLDExLC0zNTg1MzcyMjIpO2M9QU5ULnV0aWwubWQ1Lm1kNV9oaChjLGQsYSxiLHhbaSszXSwxNiwtNzIyNTIxOTc5KTtiPUFOVC51dGlsLm1kNS5tZDVfaGgoYixjLGQsYSx4W2krNl0sMjMsNzYwMjkxODkpO2E9QU5ULnV0aWwubWQ1Lm1kNV9oaChhLGIsYyxkLHhbaSs5XSw0LC02NDAzNjQ0ODcpO2Q9QU5ULnV0aWwubWQ1Lm1kNV9oaChkLGEsYixjLHhbaSsxMl0sMTEsLTQyMTgxNTgzNSk7Yz1BTlQudXRpbC5tZDUubWQ1X2hoKGMsZCxhLGIseFtpKzE1XSwxNiw1MzA3NDI1MjApO2I9QU5ULnV0aWwubWQ1Lm1kNV9oaChiLGMsZCxhLHhbaSsyXSwyMywtOTk1MzM4NjUxKTthPUFOVC51dGlsLm1kNS5tZDVfaWkoYSxiLGMsZCx4W2krMF0sNiwtMTk4NjMwODQ0KTtkPUFOVC51dGlsLm1kNS5tZDVfaWkoZCxhLGIsYyx4W2krN10sMTAsMTEyNjg5MTQxNSk7Yz1BTlQudXRpbC5tZDUubWQ1X2lpKGMsZCxhLGIseFtpKzE0XSwxNSwtMTQxNjM1NDkwNSk7Yj1BTlQudXRpbC5tZDUubWQ1X2lpKGIsYyxkLGEseFtpKzVdLDIxLC01NzQzNDA1NSk7YT1BTlQudXRpbC5tZDUubWQ1X2lpKGEsYixjLGQseFtpKzEyXSw2LDE3MDA0ODU1NzEpO2Q9QU5ULnV0aWwubWQ1Lm1kNV9paShkLGEsYixjLHhbaSszXSwxMCwtMTg5NDk4NjYwNik7Yz1BTlQudXRpbC5tZDUubWQ1X2lpKGMsZCxhLGIseFtpKzEwXSwxNSwtMTA1MTUyMyk7Yj1BTlQudXRpbC5tZDUubWQ1X2lpKGIsYyxkLGEseFtpKzFdLDIxLC0yMDU0OTIyNzk5KTthPUFOVC51dGlsLm1kNS5tZDVfaWkoYSxiLGMsZCx4W2krOF0sNiwxODczMzEzMzU5KTtkPUFOVC51dGlsLm1kNS5tZDVfaWkoZCxhLGIsYyx4W2krMTVdLDEwLC0zMDYxMTc0NCk7Yz1BTlQudXRpbC5tZDUubWQ1X2lpKGMsZCxhLGIseFtpKzZdLDE1LC0xNTYwMTk4MzgwKTtiPUFOVC51dGlsLm1kNS5tZDVfaWkoYixjLGQsYSx4W2krMTNdLDIxLDEzMDkxNTE2NDkpO2E9QU5ULnV0aWwubWQ1Lm1kNV9paShhLGIsYyxkLHhbaSs0XSw2LC0xNDU1MjMwNzApO2Q9QU5ULnV0aWwubWQ1Lm1kNV9paShkLGEsYixjLHhbaSsxMV0sMTAsLTExMjAyMTAzNzkpO2M9QU5ULnV0aWwubWQ1Lm1kNV9paShjLGQsYSxiLHhbaSsyXSwxNSw3MTg3ODcyNTkpO2I9QU5ULnV0aWwubWQ1Lm1kNV9paShiLGMsZCxhLHhbaSs5XSwyMSwtMzQzNDg1NTUxKTthPUFOVC51dGlsLm1kNS5zYWZlX2FkZChhLG9sZGEpO2I9QU5ULnV0aWwubWQ1LnNhZmVfYWRkKGIsb2xkYik7Yz1BTlQudXRpbC5tZDUuc2FmZV9hZGQoYyxvbGRjKTtkPUFOVC51dGlsLm1kNS5zYWZlX2FkZChkLG9sZGQpO30gcmV0dXJuIEFycmF5KGEsYixjLGQpO30sXG4gICAgICAgICAgICBtZDVfY21uOiBmdW5jdGlvbihxLGEsYix4LHMsdCl7cmV0dXJuIEFOVC51dGlsLm1kNS5zYWZlX2FkZChBTlQudXRpbC5tZDUuYml0X3JvbChBTlQudXRpbC5tZDUuc2FmZV9hZGQoQU5ULnV0aWwubWQ1LnNhZmVfYWRkKGEscSksQU5ULnV0aWwubWQ1LnNhZmVfYWRkKHgsdCkpLHMpLGIpO30sXG4gICAgICAgICAgICBtZDVfZmY6IGZ1bmN0aW9uKGEsYixjLGQseCxzLHQpe3JldHVybiBBTlQudXRpbC5tZDUubWQ1X2NtbigoYiZjKXwoKH5iKSZkKSxhLGIseCxzLHQpO30sXG4gICAgICAgICAgICBtZDVfZ2c6IGZ1bmN0aW9uKGEsYixjLGQseCxzLHQpe3JldHVybiBBTlQudXRpbC5tZDUubWQ1X2NtbigoYiZkKXwoYyYofmQpKSxhLGIseCxzLHQpO30sXG4gICAgICAgICAgICBtZDVfaGg6IGZ1bmN0aW9uKGEsYixjLGQseCxzLHQpe3JldHVybiBBTlQudXRpbC5tZDUubWQ1X2NtbihiXmNeZCxhLGIseCxzLHQpO30sXG4gICAgICAgICAgICBtZDVfaWk6IGZ1bmN0aW9uKGEsYixjLGQseCxzLHQpe3JldHVybiBBTlQudXRpbC5tZDUubWQ1X2NtbihjXihifCh+ZCkpLGEsYix4LHMsdCk7fSxcbiAgICAgICAgICAgIHNhZmVfYWRkOiBmdW5jdGlvbih4LHkpe3ZhciBsc3c9KHgmMHhGRkZGKSsoeSYweEZGRkYpO3ZhciBtc3c9KHg+PjE2KSsoeT4+MTYpKyhsc3c+PjE2KTtyZXR1cm4obXN3PDwxNil8KGxzdyYweEZGRkYpO30sXG4gICAgICAgICAgICBiaXRfcm9sOiBmdW5jdGlvbihudW0sY250KXtyZXR1cm4obnVtPDxjbnQpfChudW0+Pj4oMzItY250KSk7fSxcbiAgICAgICAgICAgIC8vdGhlIGxpbmUgYmVsb3cgaXMgY2FsbGVkIG91dCBieSBqc0xpbnQgYmVjYXVzZSBpdCB1c2VzIEFycmF5KCkgaW5zdGVhZCBvZiBbXS4gIFdlIGNhbiBpZ25vcmUsIG9yIEknbSBzdXJlIHdlIGNvdWxkIGNoYW5nZSBpdCBpZiB3ZSB3YW50ZWQgdG8uXG4gICAgICAgICAgICBzdHIyYmlubDogZnVuY3Rpb24oc3RyKXt2YXIgYmluPUFycmF5KCk7dmFyIG1hc2s9KDE8PEFOVC51dGlsLm1kNS5jaHJzeiktMTtmb3IodmFyIGk9MDtpPHN0ci5sZW5ndGgqQU5ULnV0aWwubWQ1LmNocnN6O2krPUFOVC51dGlsLm1kNS5jaHJzeil7YmluW2k+PjVdfD0oc3RyLmNoYXJDb2RlQXQoaS9BTlQudXRpbC5tZDUuY2hyc3opJm1hc2spPDwoaSUzMik7fXJldHVybiBiaW47fSxcbiAgICAgICAgICAgIGJpbmwyaGV4OiBmdW5jdGlvbihiaW5hcnJheSl7dmFyIGhleF90YWI9QU5ULnV0aWwubWQ1LmhleGNhc2U/XCIwMTIzNDU2Nzg5QUJDREVGXCI6XCIwMTIzNDU2Nzg5YWJjZGVmXCI7dmFyIHN0cj1cIlwiO2Zvcih2YXIgaT0wO2k8YmluYXJyYXkubGVuZ3RoKjQ7aSsrKXtzdHIrPWhleF90YWIuY2hhckF0KChiaW5hcnJheVtpPj4yXT4+KChpJTQpKjgrNCkpJjB4RikraGV4X3RhYi5jaGFyQXQoKGJpbmFycmF5W2k+PjJdPj4oKGklNCkqOCkpJjB4Rik7fSByZXR1cm4gc3RyO31cbiAgICAgICAgfVxuICAgIH1cbn07XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBoZXhfbWQ1OiBBTlQudXRpbC5tZDUuaGV4X21kNVxufTsiLCJcbnZhciAkOyByZXF1aXJlKCcuLi9zY3JpcHQtbG9hZGVyJykub24kKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG5cbmZ1bmN0aW9uIG1ha2VNb3ZlYWJsZSgkZWxlbWVudCwgJGRyYWdIYW5kbGUpIHtcbiAgICAkZHJhZ0hhbmRsZS5vbignbW91c2Vkb3duLmFudGVubmEnLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICB2YXIgb2Zmc2V0WCA9IGV2ZW50LnBhZ2VYIC0gJGRyYWdIYW5kbGUub2Zmc2V0KCkubGVmdDtcbiAgICAgICAgdmFyIG9mZnNldFkgPSBldmVudC5wYWdlWSAtICRkcmFnSGFuZGxlLm9mZnNldCgpLnRvcDtcbiAgICAgICAgJChkb2N1bWVudCkub24oJ21vdXNldXAuYW50ZW5uYScsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICAkKGRvY3VtZW50KS5vZmYoJ21vdXNlbW92ZS5hbnRlbm5hJyk7XG4gICAgICAgIH0pO1xuICAgICAgICAkKGRvY3VtZW50KS5vbignbW91c2Vtb3ZlLmFudGVubmEnLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgJGVsZW1lbnQuY3NzKHtcbiAgICAgICAgICAgICAgICB0b3A6IGV2ZW50LnBhZ2VZIC0gb2Zmc2V0WSxcbiAgICAgICAgICAgICAgICBsZWZ0OiBldmVudC5wYWdlWCAtIG9mZnNldFhcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgbWFrZU1vdmVhYmxlOiBtYWtlTW92ZWFibGVcbn07IiwiXG52YXIgb2ZmbGluZTtcblxuZnVuY3Rpb24gaXNPZmZsaW5lKCkge1xuICAgIGlmIChvZmZsaW5lID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgLy8gVE9ETzogRG8gc29tZXRoaW5nIGNyb3NzLWJyb3dzZXIgaGVyZS4gVGhpcyB3b24ndCB3b3JrIGluIElFLlxuICAgICAgICAvLyBUT0RPOiBNYWtlIHRoaXMgbW9yZSBmbGV4aWJsZSBzbyBpdCB3b3JrcyBpbiBldmVyeW9uZSdzIGRldiBlbnZpcm9ubWVudFxuICAgICAgICBvZmZsaW5lID0gZG9jdW1lbnQuY3VycmVudFNjcmlwdC5zcmMgPT09ICdodHRwOi8vbG9jYWxob3N0OjgwODEvc3RhdGljL3dpZGdldC1uZXcvZGVidWcvYW50ZW5uYS5qcyc7XG4gICAgfVxuICAgIHJldHVybiBvZmZsaW5lO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzT2ZmbGluZSgpOyIsIlxudmFyICQ7IHJlcXVpcmUoJy4uL3NjcmlwdC1sb2FkZXInKS5vbiQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcblxudmFyIG9mZmxpbmUgPSByZXF1aXJlKCcuL29mZmxpbmUuanMnKTtcblxuZnVuY3Rpb24gYW50ZW5uYUhvbWUoKSB7XG4gICAgaWYgKG9mZmxpbmUpIHtcbiAgICAgICAgcmV0dXJuIHdpbmRvdy5sb2NhdGlvbi5wcm90b2NvbCArIFwiLy9sb2NhbC5hbnRlbm5hLmlzOjgwODFcIjtcbiAgICB9XG4gICAgcmV0dXJuIHdpbmRvdy5sb2NhdGlvbi5wcm90b2NvbCArIFwiLy93d3cuYW50ZW5uYS5pc1wiO1xufVxuXG4vLyBUT0RPIGNvcGllZCBmcm9tIGVuZ2FnZV9mdWxsLiBSZXZpZXcuXG5mdW5jdGlvbiBjb21wdXRlUGFnZVVybChncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIHBhZ2VfdXJsID0gJC50cmltKCB3aW5kb3cubG9jYXRpb24uaHJlZi5zcGxpdCgnIycpWzBdICkudG9Mb3dlckNhc2UoKTsgLy8gVE9ETyBzaG91bGQgcGFzcyB0aGlzIGluIGluc3RlYWQgb2YgcmVjb21wdXRpbmdcbiAgICByZXR1cm4gcmVtb3ZlU3ViZG9tYWluRnJvbVBhZ2VVcmwocGFnZV91cmwsIGdyb3VwU2V0dGluZ3MpO1xufVxuXG4vLyBUT0RPIGNvcGllZCBmcm9tIGVuZ2FnZV9mdWxsLiBSZXZpZXcuXG5mdW5jdGlvbiBjb21wdXRlVG9wTGV2ZWxDYW5vbmljYWxVcmwoZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBwYWdlX3VybCA9ICQudHJpbSggd2luZG93LmxvY2F0aW9uLmhyZWYuc3BsaXQoJyMnKVswXSApLnRvTG93ZXJDYXNlKCk7IC8vIFRPRE8gc2hvdWxkIHBhc3MgdGhpcyBpbiBpbnN0ZWFkIG9mIHJlY29tcHV0aW5nXG4gICAgdmFyIGNhbm9uaWNhbF91cmwgPSAoICQoJ2xpbmtbcmVsPVwiY2Fub25pY2FsXCJdJykubGVuZ3RoID4gMCApID9cbiAgICAgICAgICAgICAgICAkKCdsaW5rW3JlbD1cImNhbm9uaWNhbFwiXScpLmF0dHIoJ2hyZWYnKSA6IHBhZ2VfdXJsO1xuXG4gICAgLy8gYW50OnVybCBvdmVycmlkZXNcbiAgICBpZiAoICQoJ1twcm9wZXJ0eT1cImFudGVubmE6dXJsXCJdJykubGVuZ3RoID4gMCApIHtcbiAgICAgICAgY2Fub25pY2FsX3VybCA9ICQoJ1twcm9wZXJ0eT1cImFudGVubmE6dXJsXCJdJykuYXR0cignY29udGVudCcpO1xuICAgIH1cblxuICAgIGNhbm9uaWNhbF91cmwgPSAkLnRyaW0oIGNhbm9uaWNhbF91cmwudG9Mb3dlckNhc2UoKSApO1xuXG4gICAgaWYgKGNhbm9uaWNhbF91cmwgPT0gY29tcHV0ZVBhZ2VVcmwoZ3JvdXBTZXR0aW5ncykgKSB7IC8vIFRPRE8gc2hvdWxkIHBhc3MgdGhpcyBpbiBpbnN0ZWFkIG9mIHJlY29tcHV0aW5nXG4gICAgICAgIGNhbm9uaWNhbF91cmwgPSBcInNhbWVcIjtcbiAgICB9XG5cbiAgICAvLyBmYXN0Y28gZml4IChzaW5jZSB0aGV5IHNvbWV0aW1lcyByZXdyaXRlIHRoZWlyIGNhbm9uaWNhbCB0byBzaW1wbHkgYmUgdGhlaXIgVExELilcbiAgICAvLyBpbiB0aGUgY2FzZSB3aGVyZSBjYW5vbmljYWwgY2xhaW1zIFRMRCBidXQgd2UncmUgYWN0dWFsbHkgb24gYW4gYXJ0aWNsZS4uLiBzZXQgY2Fub25pY2FsIHRvIGJlIHRoZSBwYWdlX3VybFxuICAgIHZhciB0bGQgPSAkLnRyaW0od2luZG93LmxvY2F0aW9uLnByb3RvY29sKycvLycrd2luZG93LmxvY2F0aW9uLmhvc3RuYW1lKycvJykudG9Mb3dlckNhc2UoKTtcbiAgICBpZiAoIGNhbm9uaWNhbF91cmwgPT0gdGxkICkge1xuICAgICAgICBpZiAocGFnZV91cmwgIT0gdGxkKSB7XG4gICAgICAgICAgICBjYW5vbmljYWxfdXJsID0gcGFnZV91cmw7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcmVtb3ZlU3ViZG9tYWluRnJvbVBhZ2VVcmwoJC50cmltKGNhbm9uaWNhbF91cmwpLCBncm91cFNldHRpbmdzKTtcbn1cblxuZnVuY3Rpb24gZ2V0Q3JlYXRlUmVhY3Rpb25VcmwoKSB7XG4gICAgcmV0dXJuICcvYXBpL3RhZy9jcmVhdGUnO1xufVxuXG5mdW5jdGlvbiBjb21wdXRlUGFnZUVsZW1lbnRDYW5vbmljYWxVcmwoJHBhZ2VFbGVtZW50LCBncm91cFNldHRpbmdzKSB7XG4gICAgLy8gVE9ETyBSZXZpZXcgYWdhaW5zdCBlbmdhZ2VfZnVsbC4gVGhlcmUsIHRoZSBuZXN0ZWQgcGFnZXMgYW5kIHRvcC1sZXZlbCBwYWdlIGhhdmUgYSB0b3RhbGx5IGRpZmZlcmVudCBmbG93LiBEb2VzIHRoaXNcbiAgICAvLyB1bmlmaWNhdGlvbiB3b3JrPyBUaGUgaWRlYSBpcyB0aGF0IHRoZSBuZXN0ZWQgcGFnZXMgd291bGQgaGF2ZSBhbiBocmVmIHNlbGVjdG9yIHRoYXQgc3BlY2lmaWVzIHRoZSBVUkwgdG8gdXNlLCBzbyB3ZVxuICAgIC8vIGp1c3QgdXNlIGl0LiBCdXQgY29tcHV0ZSB0aGUgdXJsIGZvciB0aGUgdG9wLWxldmVsIGNhc2UgZXhwbGljaXRseS5cbiAgICBpZiAoJHBhZ2VFbGVtZW50LmZpbmQoZ3JvdXBTZXR0aW5ncy5wYWdlSHJlZlNlbGVjdG9yKCkpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgcmV0dXJuICdzYW1lJztcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gY29tcHV0ZVRvcExldmVsQ2Fub25pY2FsVXJsKGdyb3VwU2V0dGluZ3MpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gY29tcHV0ZVBhZ2VFbGVtZW50VXJsKCRwYWdlRWxlbWVudCwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciB1cmwgPSAkcGFnZUVsZW1lbnQuZmluZChncm91cFNldHRpbmdzLnBhZ2VIcmVmU2VsZWN0b3IoKSkuYXR0cignaHJlZicpO1xuICAgIGlmICghdXJsKSB7XG4gICAgICAgIHVybCA9ICQudHJpbSggd2luZG93LmxvY2F0aW9uLmhyZWYuc3BsaXQoJyMnKVswXSApLnRvTG93ZXJDYXNlKCk7IC8vIHRvcC1sZXZlbCBwYWdlIHVybFxuICAgIH1cbiAgICByZXR1cm4gcmVtb3ZlU3ViZG9tYWluRnJvbVBhZ2VVcmwodXJsLCBncm91cFNldHRpbmdzKTtcbn1cblxuLy8gVE9ETyBjb3BpZWQgZnJvbSBlbmdhZ2VfZnVsbC4gUmV2aWV3LlxuZnVuY3Rpb24gcmVtb3ZlU3ViZG9tYWluRnJvbVBhZ2VVcmwodXJsLCBncm91cFNldHRpbmdzKSB7XG4gICAgLy8gQU5ULmFjdGlvbnMucmVtb3ZlU3ViZG9tYWluRnJvbVBhZ2VVcmw6XG4gICAgLy8gaWYgXCJpZ25vcmVfc3ViZG9tYWluXCIgaXMgY2hlY2tlZCBpbiBzZXR0aW5ncywgQU5EIHRoZXkgc3VwcGx5IGEgVExELFxuICAgIC8vIHRoZW4gbW9kaWZ5IHRoZSBwYWdlIGFuZCBjYW5vbmljYWwgVVJMcyBoZXJlLlxuICAgIC8vIGhhdmUgdG8gaGF2ZSB0aGVtIHN1cHBseSBvbmUgYmVjYXVzZSB0aGVyZSBhcmUgdG9vIG1hbnkgdmFyaWF0aW9ucyB0byByZWxpYWJseSBzdHJpcCBzdWJkb21haW5zICAoLmNvbSwgLmlzLCAuY29tLmFyLCAuY28udWssIGV0YylcbiAgICBpZiAoZ3JvdXBTZXR0aW5ncy51cmwuaWdub3JlU3ViZG9tYWluKCkgPT0gdHJ1ZSAmJiBncm91cFNldHRpbmdzLnVybC5jYW5vbmljYWxEb21haW4oKSkge1xuICAgICAgICB2YXIgSE9TVERPTUFJTiA9IC9bLVxcd10rXFwuKD86Wy1cXHddK1xcLnhuLS1bLVxcd10rfFstXFx3XXsyLH18Wy1cXHddK1xcLlstXFx3XXsyfSkkL2k7XG4gICAgICAgIHZhciBzcmNBcnJheSA9IHVybC5zcGxpdCgnLycpO1xuXG4gICAgICAgIHZhciBwcm90b2NvbCA9IHNyY0FycmF5WzBdO1xuICAgICAgICBzcmNBcnJheS5zcGxpY2UoMCwzKTtcblxuICAgICAgICB2YXIgcmV0dXJuVXJsID0gcHJvdG9jb2wgKyAnLy8nICsgZ3JvdXBTZXR0aW5ncy51cmwuY2Fub25pY2FsRG9tYWluKCkgKyAnLycgKyBzcmNBcnJheS5qb2luKCcvJyk7XG5cbiAgICAgICAgcmV0dXJuIHJldHVyblVybDtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdXJsO1xuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY29tcHV0ZVBhZ2VVcmw6IGNvbXB1dGVQYWdlRWxlbWVudFVybCxcbiAgICBjb21wdXRlQ2Fub25pY2FsVXJsOiBjb21wdXRlUGFnZUVsZW1lbnRDYW5vbmljYWxVcmwsXG4gICAgYW50ZW5uYUhvbWU6IGFudGVubmFIb21lLFxuICAgIGNyZWF0ZVJlYWN0aW9uVXJsOiBnZXRDcmVhdGVSZWFjdGlvblVybFxufTsiLCJcbnZhciBVUkxzID0gcmVxdWlyZSgnLi91cmxzJyk7XG5cbi8vIFJlZ2lzdGVyIG91cnNlbHZlcyB0byBoZWFyIG1lc3NhZ2VzXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcIm1lc3NhZ2VcIiwgcmVjZWl2ZU1lc3NhZ2UsIGZhbHNlKTtcblxudmFyIGNhbGxiYWNrcyA9IHsgJ3hkbSBsb2FkZWQnOiB4ZG1Mb2FkZWQgfTtcbnZhciBjYWNoZSA9IHt9O1xuXG52YXIgaXNYRE1Mb2FkZWQgPSBmYWxzZTtcbi8vIFRoZSBpbml0aWFsIG1lc3NhZ2UgdGhhdCBYRE0gc2VuZHMgb3V0IHdoZW4gaXQgbG9hZHNcbmZ1bmN0aW9uIHhkbUxvYWRlZChkYXRhKSB7XG4gICAgaXNYRE1Mb2FkZWQgPSB0cnVlO1xufVxuXG5mdW5jdGlvbiBnZXRVc2VyKGNhbGxiYWNrKSB7XG4gICAgdmFyIG1lc3NhZ2UgPSAnZ2V0VXNlcic7XG4gICAgcG9zdE1lc3NhZ2UobWVzc2FnZSwgJ3JldHVybmluZ191c2VyJywgY2FsbGJhY2ssIHZhbGlkQ2FjaGVFbnRyeSk7XG5cbiAgICBmdW5jdGlvbiB2YWxpZENhY2hlRW50cnkocmVzcG9uc2UpIHtcbiAgICAgICAgdmFyIHVzZXJJbmZvID0gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgcmV0dXJuIHVzZXJJbmZvICYmIHVzZXJJbmZvLmFudF90b2tlbiAmJiB1c2VySW5mby51c2VyX2lkOyAvLyBUT0RPICYmIHVzZXJJbmZvLnVzZXJfdHlwZT9cbiAgICB9XG59XG5cbmZ1bmN0aW9uIHJlY2VpdmVNZXNzYWdlKGV2ZW50KSB7XG4gICAgdmFyIGV2ZW50T3JpZ2luID0gZXZlbnQub3JpZ2luO1xuICAgIGlmIChldmVudE9yaWdpbiA9PT0gVVJMcy5hbnRlbm5hSG9tZSgpKSB7XG4gICAgICAgIHZhciByZXNwb25zZSA9IEpTT04ucGFyc2UoZXZlbnQuZGF0YSk7XG4gICAgICAgIC8vIFRPRE86IFRoZSBldmVudC5zb3VyY2UgcHJvcGVydHkgZ2l2ZXMgdXMgdGhlIHNvdXJjZSB3aW5kb3cgb2YgdGhlIG1lc3NhZ2UgYW5kIGN1cnJlbnRseSB0aGUgWERNIGZyYW1lIGZpcmVzIG91dFxuICAgICAgICAvLyBldmVudHMgdGhhdCB3ZSByZWNlaXZlIGJlZm9yZSB3ZSBldmVyIHRyeSB0byBwb3N0IGFueXRoaW5nLiBTbyB3ZSAqY291bGQqIGhvbGQgb250byB0aGUgd2luZG93IGhlcmUgYW5kIHVzZSBpdFxuICAgICAgICAvLyBmb3IgcG9zdGluZyBtZXNzYWdlcyByYXRoZXIgdGhhbiBsb29raW5nIGZvciB0aGUgWERNIGZyYW1lIG91cnNlbHZlcy4gTmVlZCB0byBsb29rIGF0IHdoaWNoIGV2ZW50cyB0aGUgWERNIGZyYW1lXG4gICAgICAgIC8vIGZpcmVzIG91dCB0byBhbGwgd2luZG93cyBiZWZvcmUgYmVpbmcgYXNrZWQuIEN1cnJlbnRseSwgaXQncyBtb3JlIHRoYW4gXCJ4ZG0gbG9hZGVkXCIuIFdoeT9cbiAgICAgICAgLy92YXIgc291cmNlV2luZG93ID0gZXZlbnQuc291cmNlO1xuXG4gICAgICAgIHZhciBjYWxsYmFja0tleSA9IHJlc3BvbnNlLnN0YXR1czsgLy8gVE9ETzogY2hhbmdlIHRoZSBuYW1lIG9mIHRoaXMgcHJvcGVydHkgaW4geGRtLmh0bWxcbiAgICAgICAgY2FjaGVbY2FsbGJhY2tLZXldID0gcmVzcG9uc2U7XG4gICAgICAgIHZhciBjYWxsYmFjayA9IGNhbGxiYWNrc1tjYWxsYmFja0tleV07XG4gICAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICAgICAgY2FsbGJhY2socmVzcG9uc2UpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBwb3N0TWVzc2FnZShtZXNzYWdlLCBjYWxsYmFja0tleSwgY2FsbGJhY2ssIHZhbGlkQ2FjaGVFbnRyeSkge1xuXG4gICAgdmFyIHRhcmdldE9yaWdpbiA9IFVSTHMuYW50ZW5uYUhvbWUoKTtcbiAgICBjYWxsYmFja3NbY2FsbGJhY2tLZXldID0gY2FsbGJhY2s7XG5cbiAgICBpZiAoaXNYRE1Mb2FkZWQpIHtcbiAgICAgICAgdmFyIGNhY2hlZFJlc3BvbnNlID0gY2FjaGVbY2FsbGJhY2tLZXldO1xuICAgICAgICBpZiAoY2FjaGVkUmVzcG9uc2UgIT09IHVuZGVmaW5lZCAmJiB2YWxpZENhY2hlRW50cnkgJiYgdmFsaWRDYWNoZUVudHJ5KGNhY2hlW2NhbGxiYWNrS2V5XSkpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKGNhY2hlW2NhbGxiYWNrS2V5XSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgeGRtRnJhbWUgPSBnZXRYRE1GcmFtZSgpO1xuICAgICAgICAgICAgaWYgKHhkbUZyYW1lKSB7XG4gICAgICAgICAgICAgICAgeGRtRnJhbWUucG9zdE1lc3NhZ2UobWVzc2FnZSwgdGFyZ2V0T3JpZ2luKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gZ2V0WERNRnJhbWUoKSB7XG4gICAgLy8gVE9ETzogSXMgdGhpcyBhIHNlY3VyaXR5IHByb2JsZW0/IFdoYXQgcHJldmVudHMgc29tZW9uZSBmcm9tIHVzaW5nIHRoaXMgc2FtZSBuYW1lIGFuZCBpbnRlcmNlcHRpbmcgb3VyIG1lc3NhZ2VzP1xuICAgIHJldHVybiB3aW5kb3cuZnJhbWVzWydhbnQteGRtLWhpZGRlbiddO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBnZXRVc2VyOiBnZXRVc2VyXG59OyIsIlxudmFyIFVSTHMgPSByZXF1aXJlKCcuL3VybHMnKTtcblxuZnVuY3Rpb24gY3JlYXRlWERNZnJhbWUoZ3JvdXBJZCkge1xuICAgIC8vQU5ULnNlc3Npb24ucmVjZWl2ZU1lc3NhZ2Uoe30sIGZ1bmN0aW9uKCkge1xuICAgIC8vICAgIEFOVC51dGlsLnVzZXJMb2dpblN0YXRlKCk7XG4gICAgLy99KTtcblxuXG4gICAgdmFyIGlmcmFtZVVybCA9IFVSTHMuYW50ZW5uYUhvbWUoKSArIFwiL3N0YXRpYy93aWRnZXQtbmV3L3hkbS94ZG0uaHRtbFwiLFxuICAgIHBhcmVudFVybCA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmLFxuICAgIHBhcmVudEhvc3QgPSB3aW5kb3cubG9jYXRpb24ucHJvdG9jb2wgKyBcIi8vXCIgKyB3aW5kb3cubG9jYXRpb24uaG9zdCxcbiAgICAvLyBUT0RPOiBSZXN0b3JlIHRoZSBib29rbWFya2xldCBhdHRyaWJ1dGUgb24gdGhlIGlGcmFtZT9cbiAgICAvL2Jvb2ttYXJrbGV0ID0gKCBBTlQuZW5nYWdlU2NyaXB0UGFyYW1zLmJvb2ttYXJrbGV0ICkgPyBcImJvb2ttYXJrbGV0PXRydWVcIjpcIlwiLFxuICAgIGJvb2ttYXJrbGV0ID0gXCJcIixcbiAgICAvLyBUT0RPOiBSZXN0b3JlIHRoZSBncm91cE5hbWUgYXR0cmlidXRlLiAoV2hhdCBpcyBpdCBmb3I/KVxuICAgICR4ZG1JZnJhbWUgPSAkKCc8aWZyYW1lIGlkPVwiYW50LXhkbS1oaWRkZW5cIiBuYW1lPVwiYW50LXhkbS1oaWRkZW5cIiBzcmM9XCInICsgaWZyYW1lVXJsICsgJz9wYXJlbnRVcmw9JyArIHBhcmVudFVybCArICcmcGFyZW50SG9zdD0nICsgcGFyZW50SG9zdCArICcmZ3JvdXBfaWQ9Jytncm91cElkKydcIiB3aWR0aD1cIjFcIiBoZWlnaHQ9XCIxXCIgc3R5bGU9XCJwb3NpdGlvbjphYnNvbHV0ZTt0b3A6LTEwMDBweDtsZWZ0Oi0xMDAwcHg7XCIgLz4nKTtcbiAgICAvLyR4ZG1JZnJhbWUgPSAkKCc8aWZyYW1lIGlkPVwiYW50LXhkbS1oaWRkZW5cIiBuYW1lPVwiYW50LXhkbS1oaWRkZW5cIiBzcmM9XCInICsgaWZyYW1lVXJsICsgJz9wYXJlbnRVcmw9JyArIHBhcmVudFVybCArICcmcGFyZW50SG9zdD0nICsgcGFyZW50SG9zdCArICcmZ3JvdXBfaWQ9Jytncm91cElkKycmZ3JvdXBfbmFtZT0nK2VuY29kZVVSSUNvbXBvbmVudChncm91cE5hbWUpKycmJytib29rbWFya2xldCsnXCIgd2lkdGg9XCIxXCIgaGVpZ2h0PVwiMVwiIHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGU7dG9wOi0xMDAwcHg7bGVmdDotMTAwMHB4O1wiIC8+Jyk7XG4gICAgJChnZXRXaWRnZXRCdWNrZXQoKSkuYXBwZW5kKCAkeGRtSWZyYW1lICk7XG59XG5cbi8vIFRPRE8gcmVmYWN0b3IgdGhpcyB3aXRoIHRoZSBjb3B5IG9mIGl0IGluIHN1bW1hcnktd2lkZ2V0XG5mdW5jdGlvbiBnZXRXaWRnZXRCdWNrZXQoKSB7XG4gICAgdmFyIGJ1Y2tldCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhbnRlbm5hLXdpZGdldC1idWNrZXQnKTtcbiAgICBpZiAoIWJ1Y2tldCkge1xuICAgICAgICBidWNrZXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgYnVja2V0LnNldEF0dHJpYnV0ZSgnaWQnLCAnYW50ZW5uYS13aWRnZXQtYnVja2V0Jyk7XG4gICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoYnVja2V0KTtcbiAgICB9XG4gICAgcmV0dXJuIGJ1Y2tldDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlWERNZnJhbWU6IGNyZWF0ZVhETWZyYW1lXG59OyIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1pbmRpY2F0b3Itd2lkZ2V0XCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50LWFudGVubmEtbG9nb1wifX0sXCIgXCIse1widFwiOjQsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcImNvbnRhaW5lckRhdGEuY291bnRcIn1dfV0sXCJyXCI6XCJjb250YWluZXJEYXRhXCJ9XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hIGFudGVubmEtcmVhY3Rpb25zLXdpZGdldFwiLFwidGFiaW5kZXhcIjpcIjBcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcmVhY3Rpb25zLWNvbnRhaW5lclwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1yZWFjdGlvbnMtcGFnZVwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1oZWFkZXJcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnQtYW50ZW5uYS1sb2dvXCJ9fSxcIiBSZWFjdGlvbnNcIl19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtYm9keVwifSxcImZcIjpbe1widFwiOjQsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJ2XCI6e1wiY2xpY2tcIjpcInBsdXNvbmVcIn0sXCJhXCI6e1wiY2xhc3NcIjpbXCJhbnRlbm5hLXJlYWN0aW9uIFwiLHtcInRcIjoyLFwieFwiOntcInJcIjpbXCJsYXlvdXRDbGFzc1wiLFwiaW5kZXhcIixcIi4vY291bnRcIl0sXCJzXCI6XCJfMChfMSxfMilcIn19XSxcInN0eWxlXCI6W1wiYmFja2dyb3VuZC1jb2xvcjpcIix7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiYmFja2dyb3VuZENvbG9yXCIsXCJpbmRleFwiXSxcInNcIjpcIl8wKF8xKVwifX1dfSxcImZcIjpbXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1yZWFjdGlvbi1ib3hcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcmVhY3Rpb24tdGV4dFwifSxcIm9cIjpcInNpemV0b2ZpdFwiLFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcIi4vdGV4dFwifV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcmVhY3Rpb24tY291bnRcIn0sXCJmXCI6W3tcInRcIjoyLFwiclwiOlwiLi9jb3VudFwifV19XX1dfV0sXCJpXCI6XCJpbmRleFwiLFwiclwiOlwicmVhY3Rpb25zXCJ9XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1mb290ZXJcIn0sXCJmXCI6W119XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1yZWNlaXZlZC1wYWdlXCJ9LFwiZlwiOlt7XCJ0XCI6NCxcImZcIjpbXCJMb29rcyBsaWtlIHlvdSBzdGlsbCBmZWVsIHRoZSBzYW1lIHdheS5cIl0sXCJuXCI6NTAsXCJyXCI6XCJyZXNwb25zZS5leGlzdGluZ1wifSx7XCJ0XCI6NCxcIm5cIjo1MSxcImZcIjpbXCJOZXcgcmVhY3Rpb24gcmVjZWl2ZWQuXCJdLFwiclwiOlwicmVzcG9uc2UuZXhpc3RpbmdcIn1dfV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hIGFudC1zdW1tYXJ5LXdpZGdldFwiLFwiYW50LWhhc2hcIjpbe1widFwiOjIsXCJyXCI6XCJwYWdlSGFzaFwifV19LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImFcIixcImFcIjp7XCJocmVmXCI6XCJodHRwOi8vd3d3LmFudGVubmEuaXNcIixcInRhcmdldFwiOlwiX2JsYW5rXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50LWFudGVubmEtbG9nb1wifX1dfSxcIiBcIix7XCJ0XCI6NCxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtc3VtbWFyeS10ZXh0XCJ9LFwiZlwiOlt7XCJ0XCI6NCxcImZcIjpbe1widFwiOjIsXCJyXCI6XCJzdW1tYXJ5LnRvdGFsUmVhY3Rpb25zXCJ9XSxcIm5cIjo1MCxcInJcIjpcInN1bW1hcnkudG90YWxSZWFjdGlvbnNcIn0sXCIgUmVhY3Rpb25zXCJdfV0sXCJuXCI6NTAsXCJ4XCI6e1wiclwiOltcInN1bW1hcnkudG90YWxSZWFjdGlvbnNcIl0sXCJzXCI6XCJfMCE9PXVuZGVmaW5lZFwifX1dfV19Il19
