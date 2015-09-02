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
var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var GroupSettings = require('./group-settings');

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
},{"./group-settings":"/Users/jburns/antenna/rb/static/widget-new/src/js/group-settings.js","./utils/jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/group-settings.js":[function(require,module,exports){
var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });

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

    function defaultReactions($element) {
        // Default reactions are available in three locations in three data formats:
        // 1. As a comma-separated attribute value on a particular element
        // 2. As an array of strings on the window.antenna_extend property
        // 3. As a json object with a body and id on the group settings
        var reactions = [];
        var reactionStrings;
        var elementReactions = $element ? $element.attr('ant-reactions') : undefined;
        if (elementReactions) {
            reactionStrings = elementReactions.split(';');
        } else {
            reactionStrings = window.antenna_extend['default_reactions'];
        }
        if (reactionStrings) {
            for (var i = 0; i < reactionStrings.length; i++) {
                reactions.push({
                    text: reactionStrings[i]
                })
            }
        } else {
            var values = json['default_reactions'];
            if (values !== undefined) {
                for (var j = 0; j < values.length; j++) {
                    var value = values[j];
                    reactions.push({
                        text: value.body,
                        id: value.id
                    });
                }
            }
        }
        return reactions;
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
        imageSelector: data('img_selector'),
        defaultReactions: defaultReactions,
        reactionBackgroundColors: backgroundColor(data('tag_box_bg_colors'))
    }
}

//noinspection JSUnresolvedVariable
module.exports = {
    create: createFromJSON
};
},{"./utils/jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/image-indicator-widget.js":[function(require,module,exports){
var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var ReactionsWidget = require('./reactions-widget');


function createIndicatorWidget(options) {
    // TODO: validate that options contains all required properties (applies to all widgets).
    var element = options.element;
    var containerData = options.containerData;
    var $containerElement = options.containerElement;
    var pageData = options.pageData;
    var groupSettings = options.groupSettings;
    var defaultReactions = options.defaultReactions;
    var coords = options.coords;
    var imageUrl = options.imageUrl;
    var imageDimensions = options.imageDimensions;
    var ractive = Ractive({
        el: element,
        append: true,
        magic: true,
        data: {
            containerData: containerData
        },
        template: require('../templates/image-indicator-widget.hbs.html')
    });

    var reactionWidgetOptions = {
        reactionsData: containerData.reactions,
        containerData: containerData,
        containerElement: $containerElement,
        contentData: {
            type: 'img',
            body: imageUrl,
            dimensions: imageDimensions
        },
        defaultReactions: defaultReactions,
        pageData: pageData,
        groupSettings: groupSettings
    };

    var hoverTimeout;
    var activeTimeout;

    var $rootElement = $(rootElement(ractive));
    // TODO: Finish the positioning piece. It's currently treating 'top' more like 'bottom
    $rootElement.css({
        position: 'absolute',
        top: coords.top ? (coords.top - $rootElement.outerHeight()) : undefined,
        bottom: coords.bottom,
        left: coords.left,
        right: coords.right
    });
    $rootElement.on('mouseenter.antenna', function(event) {
        if (event.buttons !== 0) {
            // Don't react if the user is dragging or selecting text.
            return;
        }
        if (containerData.reactions.length > 0) {
            openReactionsWindow(reactionWidgetOptions, ractive);
        } else {
            clearTimeout(hoverTimeout);
            hoverTimeout = setTimeout(function() {
                openReactionsWindow(reactionWidgetOptions, ractive);
            }, 200);
        }
    });
    $rootElement.on('mouseleave.antenna', function() {
        clearTimeout(hoverTimeout);
        clearTimeout(activeTimeout);
    });
    $containerElement.on('mouseenter.antenna', function() {
        clearTimeout(activeTimeout);
            activeTimeout = setTimeout(function() {
                $rootElement.addClass('active');
            }, 500);
    });
    $containerElement.on('mouseleave.antenna', function() {
        $rootElement.removeClass('active');
    });
}

function rootElement(ractive) {
    return ractive.find('.antenna-image-indicator-widget');
}

function openReactionsWindow(reactionOptions, ractive) {
    ReactionsWidget.open(reactionOptions, rootElement(ractive));
}

//noinspection JSUnresolvedVariable
module.exports = {
    create: createIndicatorWidget
};
},{"../templates/image-indicator-widget.hbs.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/image-indicator-widget.hbs.html","./reactions-widget":"/Users/jburns/antenna/rb/static/widget-new/src/js/reactions-widget.js","./utils/jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/indicator-widget.js":[function(require,module,exports){
var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var PopupWidget = require('./popup-widget');
var ReactionsWidget = require('./reactions-widget');
var Range = require('./utils/range');


function createIndicatorWidget(options) {
    var element = options.element;
    var containerData = options.containerData;
    var $containerElement = options.containerElement;
    var pageData = options.pageData;
    var groupSettings = options.groupSettings;
    var defaultReactions = options.defaultReactions;
    var coords = options.coords;
    var ractive = Ractive({
        el: element,
        append: true,
        magic: true,
        data: {
            containerData: containerData
        },
        template: require('../templates/indicator-widget.hbs.html')
    });

    var reactionWidgetOptions = {
        reactionsData: containerData.reactions,
        containerData: containerData,
        containerElement: $containerElement,
        contentData: { type: 'text' },
        defaultReactions: defaultReactions,
        pageData: pageData,
        groupSettings: groupSettings
    };

    var $rootElement = $(rootElement(ractive));
    if (coords) {
        $rootElement.css({
            position: 'absolute',
            top: coords.top - $rootElement.height(),
            bottom: coords.bottom,
            left: coords.left,
            right: coords.right,
            'z-index': 1000 // TODO: compute a real value?
        });
    }
    var hoverTimeout;
    $rootElement.on('mouseenter.antenna', function(event) {
        if (event.buttons !== 0) {
            // Don't react if the user is dragging or selecting text.
            return;
        }
        clearTimeout(hoverTimeout); // only one timeout at a time
        hoverTimeout = setTimeout(function() {
            if (containerData.reactions.length > 0) {
                openReactionsWindow(reactionWidgetOptions, ractive);
            } else {
                var $icon = $(rootElement(ractive)).find('.ant-antenna-logo');
                var offset = $icon.offset();
                var coordinates = {
                    top: offset.top + Math.floor($icon.height() / 2), // TODO this number is a little off because the div doesn't tightly wrap the inserted font character
                    left: offset.left + Math.floor($icon.width() / 2)
                };
                PopupWidget.show(coordinates, function() {
                    openReactionsWindow(reactionWidgetOptions, ractive);
                });
            }
        }, 200);
    });
    $rootElement.on('mouseleave.antenna', function() {
        clearTimeout(hoverTimeout);
    });
    $containerElement.on('mouseenter.antenna', function() {
        $rootElement.addClass('active');
    });
    $containerElement.on('mouseleave.antenna', function() {
        $rootElement.removeClass('active');
    });
}

function rootElement(ractive) {
    return ractive.find('.antenna-indicator-widget');
}

function openReactionsWindow(reactionOptions, ractive) {
    ReactionsWidget.open(reactionOptions, rootElement(ractive));
}

//noinspection JSUnresolvedVariable
module.exports = {
    create: createIndicatorWidget
};
},{"../templates/indicator-widget.hbs.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/indicator-widget.hbs.html","./popup-widget":"/Users/jburns/antenna/rb/static/widget-new/src/js/popup-widget.js","./reactions-widget":"/Users/jburns/antenna/rb/static/widget-new/src/js/reactions-widget.js","./utils/jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js","./utils/range":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/range.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/page-data-loader.js":[function(require,module,exports){
var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var PageUtils = require('./utils/page-utils');
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
            url: PageUtils.computeCanonicalUrl($pageElement, groupSettings)
        });
    });

    return pages;
}

function loadPageData(groupSettings) {
    var pagesParam = computePagesParam(groupSettings);
    $.getJSONP('/api/pagenew', { pages: pagesParam }, success, error);

    function success(json) {
        // TODO: if the page data indicates that the server doesn't know about the page yet, compute the page title and image
        //       and send them to the server. (use computePageTitle())
        PageData.updateAllPageData(json, groupSettings);
    }

    function error(message) {
        // TODO handle errors that happen when loading page data
    }
}

//noinspection JSUnresolvedVariable
module.exports = {
    load: loadPageData
};
},{"./page-data":"/Users/jburns/antenna/rb/static/widget-new/src/js/page-data.js","./utils/jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js","./utils/page-utils":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/page-utils.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/page-data.js":[function(require,module,exports){
var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });

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
            summaryReactions: {},
            summaryTotal: 0, // TODO consider folding this into summaryReactions
            containers: {}
        };
        pages[hash] = pageData;
    }
    return pageData;
}

function updateAllPageData(jsonPages, groupSettings) {
    var allPages = [];
    for (var i = 0; i < jsonPages.length; i++) {
        allPages.push(updatePageData(jsonPages[i], groupSettings));
    }
}

function updatePageData(json, groupSettings) {
    var pageHash = json.pageHash;
    var pageData = getPageData(pageHash);

    // TODO: Can we get away with just setting pageData = json without breaking Ractive's data binding?
    var summaryReactions = json.summaryReactions;
    pageData.summaryReactions = summaryReactions;
    setContainers(pageData, json.containers);

    // We add up the summary reaction total client-side
    var total = 0;
    for (var i = 0; i < summaryReactions.length; i++) {
        total = total + summaryReactions[i].count;
    }
    pageData.summaryTotal = total;

    // We add up the container reaction totals client-side
    var total = 0;
    var containers = pageData.containers;
    for (var hash in containers) {
        if (containers.hasOwnProperty(hash)) {
            var container = containers[hash];
            var total = 0;
            var containerReactions = container.reactions;
            if (containerReactions) {
                for (var i = 0; i < containerReactions.length; i++) {
                    total = total + containerReactions[i].count;
                }
            }
            container.reactionTotal = total;
        }
    }

    // TODO Consider supporting incremental update of data that we already have from the server. That would mean only
    // updating fields in the local object if they exist in the json data.
    pageData.groupId = groupSettings.groupId();
    pageData.pageId = json.id;
    pageData.pageHash = pageHash;

    return pageData;
}

function getContainerData(pageData, containerHash) {
    var containerData = pageData.containers[containerHash];
    if (!containerData) {
        containerData = {
            hash: containerHash,
            reactionTotal: 0,
            reactions: []
        };
        pageData.containers[containerHash] = containerData;
    }
    return containerData;
}

// Merge the given container data into the pageData.containers data. This is necessary because the skeleton of the pageData.containers map
// is set up and bound to the UI before all the data is fetched from the server and we don't want to break the data binding.
function setContainers(pageData, containers) {
    for (var hash in containers) {
        if (containers.hasOwnProperty(hash)) {
            var containerData = getContainerData(pageData, hash);
            var fetchedContainerData = containers[hash];
            containerData.id = fetchedContainerData.id;
            for (var i = 0; i < fetchedContainerData.reactions.length; i++) {
                containerData.reactions.push(fetchedContainerData.reactions[i]);
            }
        }
    }
}

//noinspection JSUnresolvedVariable
module.exports = {
    getPageData: getPageData,
    updateAllPageData: updateAllPageData,
    getContainerData: getContainerData
};
},{"./utils/jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/page-scanner.js":[function(require,module,exports){
var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var Hash = require('./utils/hash');
var PageUtils = require('./utils/page-utils');
var WidgetBucket = require('./utils/widget-bucket');

var IndicatorWidget = require('./indicator-widget');
var ImageIndicatorWidget = require('./image-indicator-widget');
var PageData = require('./page-data');
var SummaryWidget = require('./summary-widget');
var TextReactions = require('./text-reactions');


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
    var url = PageUtils.computePageUrl($page, groupSettings);
    var urlHash = Hash.hashUrl(url);
    var pageData = PageData.getPageData(urlHash);

    // First, scan for elements that would cause us to insert something into the DOM that takes up space.
    // We want to get any page resizing out of the way as early as possible.
    // TODO: Consider doing this with raw Javascript before jQuery loads, to further reduce the delay. We wouldn't
    // save a *ton* of time from this, though, so it's definitely a later optimization.
    scanForSummaries($page, pageData, groupSettings);
    scanForCallsToAction($page, pageData, groupSettings);

    var $activeSections = $page.find(groupSettings.activeSections());
    $activeSections.each(function() {
        var $section = $(this);
        // Then scan for everything else
        scanForText($section, pageData, groupSettings);
        scanForImages($section, pageData, groupSettings);
        scanForMedia($section, pageData, groupSettings);
    });
}

function scanForSummaries($element, pageData, groupSettings) {
    var $summaries = $element.find(groupSettings.summarySelector());
    $summaries.each(function() {
        var $summary = $(this);
        var container = $('<div class="ant-summary-container"></div>');
        var containerData = PageData.getContainerData(pageData, 'page'); // Magic hash for page reactions
        containerData.type = 'page'; // TODO: revisit whether it makes sense to set the type here
        var defaultReactions = groupSettings.defaultReactions($summary); // TODO: do we support customizing the default reactions at this level?
        SummaryWidget.create(container, containerData, pageData, defaultReactions, groupSettings);
        insertContent($summary, container, groupSettings.summaryMethod());
    });
}

function scanForCallsToAction($section, pageData, groupSettings) {
    // TODO
}

function scanForText($section, pageData, groupSettings) {
    var $textElements = $section.find(groupSettings.textSelector());
    // TODO: only select "leaf" elements
    $textElements.each(function() {
        var $textElement = $(this);
        // TODO position correctly
        // TODO hash and add hash data to indicator
        var hash = Hash.hashText($textElement);
        var $indicatorElement = $('<div class="ant-indicator-container" style="display:inline-block;"></div>'); // TODO
        var containerData = PageData.getContainerData(pageData, hash);
        containerData.type = 'text'; // TODO: revisit whether it makes sense to set the type here
        var defaultReactions = groupSettings.defaultReactions($textElement);
        var indicator = IndicatorWidget.create({
            element: $indicatorElement,
            containerData: containerData,
            containerElement: $textElement,
            defaultReactions: defaultReactions,
            pageData: pageData,
            groupSettings: groupSettings}
        );
        $textElement.append($indicatorElement); // TODO is this configurable ala insertContent(...)?

        TextReactions.createReactableText({
            containerData: containerData,
            containerElement: $textElement,
            defaultReactions: defaultReactions,
            pageData: pageData,
            groupSettings: groupSettings,
            excludeNode: $indicatorElement.get(0)
        });
    });
}

function scanForImages($section, pageData, groupSettings) {
    var $imageElements = $section.find(groupSettings.imageSelector()); // TODO also select for attribute override. i.e.: 'img,[ant-item-type="image"]'
    $imageElements.each(function() {
        var $imageElement = $(this);
        var imageUrl = getImageUrl($imageElement);
        var hash = Hash.hashImage(imageUrl);
        var containerData = PageData.getContainerData(pageData, hash);
        containerData.type = 'image'; // TODO: revisit whether it makes sense to set the type here
        var defaultReactions = groupSettings.defaultReactions($imageElement);
        var imageOffset = $imageElement.offset();
        var coords = {
            top: imageOffset.top + $imageElement.height(), // TODO pull from settings/element
            left: imageOffset.left
        };
        var dimensions = {
            height: $imageElement.height(), // TODO: review how we get the image dimensions
            width: $imageElement.width()
        };
        // TODO: don't create indicator on images that are too small
        ImageIndicatorWidget.create({
            element: WidgetBucket(),
            coords: coords,
            imageUrl: imageUrl,
            imageDimensions: dimensions,
            containerData: containerData,
            containerElement: $imageElement,
            defaultReactions: defaultReactions,
            pageData: pageData,
            groupSettings: groupSettings}
        );
    });
}

function getImageUrl($element) {
    var content = $element.attr('ant-element-content'); // TODO allow this override everywhere
    if (!content) {
        content = $element.attr('src'); // TODO clean up URL?
        if (content.indexOf('/') === 0){
            content = window.location.origin + content;
        }
        if (content.indexOf('http') !== 0){
            content = window.location.origin + window.location.pathname + content;
        }
    }
    return content;
}

function scanForMedia($section, pageData, groupSettings) {
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
},{"./image-indicator-widget":"/Users/jburns/antenna/rb/static/widget-new/src/js/image-indicator-widget.js","./indicator-widget":"/Users/jburns/antenna/rb/static/widget-new/src/js/indicator-widget.js","./page-data":"/Users/jburns/antenna/rb/static/widget-new/src/js/page-data.js","./summary-widget":"/Users/jburns/antenna/rb/static/widget-new/src/js/summary-widget.js","./text-reactions":"/Users/jburns/antenna/rb/static/widget-new/src/js/text-reactions.js","./utils/hash":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/hash.js","./utils/jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js","./utils/page-utils":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/page-utils.js","./utils/widget-bucket":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/widget-bucket.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/popup-widget.js":[function(require,module,exports){
var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var WidgetBucket = require('./utils/widget-bucket');
var TransitionUtil = require('./utils/transition-util');

var ractive;
var clickHandler;


function getRootElement() {
    // TODO revisit this, it's kind of goofy and it might have a timing problem
    if (!ractive) {
        var bucket = WidgetBucket();
        ractive = Ractive({
            el: bucket,
            append: true,
            template: require('../templates/popup-widget.hbs.html')
        });
        var $element = $(ractive.find('.antenna-popup'));
        $element.on('mousedown', false); // Prevent mousedown from propagating, so the browser doesn't clear the text selection.
        $element.on('click.antenna-popup', function(event) {
            event.stopPropagation();
            hidePopup($element);
            if (clickHandler) {
                clickHandler();
            }
        });
        return $element;
    }
    return $(ractive.find('.antenna-popup'));
}

function showPopup(coordinates, callback) {
    var $element = getRootElement();
    if (!$element.hasClass('show')) {
        clickHandler = callback;
        $element
            .show() // still has opacity 0 at this point
            .css({
                top: coordinates.top - $element.outerHeight() - 6, // TODO find a cleaner way to account for the popup 'tail'
                left: coordinates.left - Math.floor($element.outerWidth() / 2)
            });
        TransitionUtil.toggleClass($element, 'show', true, function() {
            // TODO: after the appearance transition is complete, add a handler for mouseenter which then registers
            //       a handler for mouseleave that hides the popup

            // TODO: also take down the popup if the user mouses over another widget (summary or indicator)
            $(document).on('click.antenna-popup', function () {
                hidePopup($element);
            });
        });
    }
}

function hidePopup($element) {
    TransitionUtil.toggleClass($element, 'show', false, function() {
        $element.hide(); // after we're at opacity 0, hide the element so it doesn't receive accidental clicks
    });
    $(document).off('click.antenna-popup');
}

//noinspection JSUnresolvedVariable
module.exports = {
    show: showPopup
};
},{"../templates/popup-widget.hbs.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/popup-widget.hbs.html","./utils/jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js","./utils/transition-util":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/transition-util.js","./utils/widget-bucket":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/widget-bucket.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/reactions-widget.js":[function(require,module,exports){
var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var AjaxClient = require('./utils/ajax-client');
var Moveable = require('./utils/moveable');
var Range = require('./utils/range');
var TransitionUtil = require('./utils/transition-util');
var URLs = require('./utils/urls');
var WidgetBucket = require('./utils/widget-bucket');

function openReactionsWidget(options, elementOrCoords) {
    var defaultReactions = options.defaultReactions;
    var reactionsData = options.reactionsData;
    var containerData = options.containerData;
    var containerElement = options.containerElement;
    // contentData contains details about the content being reacted to like text range or image height/width.
    // we potentially modify this data (e.g. in the default reaction case we select the text ourselves) so we
    // make a local copy of it to avoid unexpectedly changing data out from under one of the clients
    var contentData = JSON.parse(JSON.stringify(options.contentData));
    var pageData = options.pageData;
    var groupSettings = options.groupSettings;
    var colors = groupSettings.reactionBackgroundColors();
    sortReactionData(reactionsData);
    var reactionsLayoutData = computeLayoutData(reactionsData, colors);
    var defaultLayoutData = computeLayoutData(defaultReactions, colors);
    var ractive = Ractive({
        el: WidgetBucket(),
        append: true,
        magic: true,
        data: {
            reactions: reactionsData,
            reactionsLayoutClass: arrayAccessor(reactionsLayoutData.layoutClasses),
            reactionsBackgroundColor: arrayAccessor(reactionsLayoutData.backgroundColors),
            defaultReactions: defaultReactions,
            defaultLayoutClass: arrayAccessor(defaultLayoutData.layoutClasses),
            defaultBackgroundColor: arrayAccessor(defaultLayoutData.backgroundColors),
            response: {}
        },
        template: require('../templates/reactions-widget.hbs.html'),
        decorators: {
            sizetofit: sizeReactionTextToFit
        },
        antenna: {} // create our own property bucket on the instance
    });
    var $rootElement = $(rootElement(ractive));
    Moveable.makeMoveable($rootElement, $rootElement.find('.antenna-header'));
    if (containerElement) {
        ractive.on('highlight', highlightContent(containerData, pageData, ractive, containerElement));
        ractive.on('clearhighlights', Range.clearHighlights);
    }
    ractive.on('plusone', plusOne(containerData, pageData, ractive));
    ractive.on('newreaction', newDefaultReaction(containerData, pageData, contentData, ractive));
    ractive.on('showdefault', function() {
        showDefaultReactionsPage(containerElement, contentData, ractive, true);
    });
    openWindow(elementOrCoords, containerElement, contentData, reactionsData, ractive);
}

function arrayAccessor(array) {
    return function(index) {
        return array[index];
    }
}

function sortReactionData(reactions) {
    reactions.sort(function(reactionA, reactionB) {
       return reactionB.count - reactionA.count;
    });
}

function sizeReactionTextToFit(node) {
    var $element = $(node);
    var $rootElement = $element.closest('.antenna-reactions-widget');
    if ($rootElement.length > 0) {
        var originalDisplay = $rootElement.css('display');
        if (originalDisplay === 'none') { // If we're sizing the boxes before the widget is displayed, temporarily display it offscreen.
            $rootElement.css({display: 'block', left: '100%'});
        }
        var ratio = node.clientWidth / node.scrollWidth;
        if (ratio < 1.0) { // If the text doesn't fit, first try to wrap it to two lines. Then scale it down if still necessary.
            var text = node.innerHTML;
            var mid = Math.ceil(text.length / 2); // Look for the closest space to the middle, weighted slightly (Math.ceil) toward a space in the second half.
            var secondHalfIndex = text.indexOf(' ', mid);
            var firstHalfIndex = text.lastIndexOf(' ', mid);
            var splitIndex = Math.abs(secondHalfIndex - mid) < Math.abs(mid - firstHalfIndex) ? secondHalfIndex : firstHalfIndex;
            if (splitIndex > 1) {
                node.innerHTML = text.slice(0, splitIndex) + '<br>' + text.slice(splitIndex);
                ratio = node.clientWidth / node.scrollWidth;
            }
            if (ratio < 1.0) {
                $element.css('font-size', Math.max(10, Math.floor(parseInt($element.css('font-size')) * ratio) - 1));
            }
        }
        if (originalDisplay === 'none') {
            $rootElement.css({display: '', left: ''});
        }
    }
    return { teardown: function() {} };
}

function highlightContent(containerData, pageData, ractive, $containerElement) {
    return function(event) {
        var reactionData = event.context;
        if (reactionData.content) {
            var location = reactionData.content.location;
            if (location) {
                Range.highlight($containerElement.get(0), location);
            }
        }
    }
}

function newDefaultReaction(containerData, pageData, contentData, ractive) {
    return function(event) {
        var defaultReactionData = event.context;
        showPage('.antenna-progress-page', ractive, false, true);
        AjaxClient.postNewReaction(defaultReactionData, containerData, pageData, contentData, success, error);

        function success(response) {
            if (response.existing) {
                // TODO: We can either access this data through the ractive keypath or by passing the data object around. Pick one.
                ractive.set('response.existing', response.existing);
            } else {
                 // TODO: the server should give us back a reaction matching the new API format.
                 //       we're just faking it out for now; this code is temporary
                var reaction = {
                    text: response.interaction.interaction_node.body,
                    id: response.interaction.interaction_node.id,
                    count: 1, // TODO: could we get back a different count if someone else made the same "new" reaction before us?
                    // parentId: ??? TODO: could we get a parentId back if someone else made the same "new" reaction before us?
                    content: {
                        location: contentData.location,
                        kind: contentData.type,
                        body: contentData.body,
                        id: response.content_node.id
                    }
                };
                // TODO: check back on this as the way to propogate data changes into the model. Consider adding something
                //       to PageData to handle this instead.
                containerData.reactions.push(reaction);
                sortReactionData(containerData.reactions);
                containerData.reactionTotal = containerData.reactionTotal + 1;
                var summaryReaction = {
                    text: reaction.text,
                    id: reaction.id,
                    count: reaction.count
                };
                pageData.summaryReactions.push(summaryReaction);
                pageData.summaryTotal = pageData.summaryTotal + 1;
            }
            showConfirmPage(ractive, true);
        }

        function error(message) {
            // TODO handle any errors that occur posting a reaction
            console.log("error posting new reaction: " + message);
        }
    }
}

function plusOne(containerData, pageData, ractive) {
    return function(event) {
        var reactionData = event.context;
        showPage('.antenna-progress-page', ractive, false, true);
        AjaxClient.postPlusOne(reactionData, containerData, pageData, success, error);

        function success(response) {
            ractive.set('response.existing', response.existing); // TODO: We can either access this data through the ractive keypath or by passing the data object around. Pick one.
            if (!response.existing) {
                // TODO: we should get back a response with data in the "new format" and update the model from the response
                reactionData.count = reactionData.count + 1;
                containerData.reactionTotal = containerData.reactionTotal + 1;
                pageData.summaryTotal = pageData.summaryTotal + 1;
            }
            showConfirmPage(ractive, true);
        }

        function error(message) {
            // TODO handle any errors that occur posting a reaction
            console.log("error posting plus one: " + message);
        }
    };
}

function computeLayoutData(reactionsData, colors) {
    // TODO Verify that the reactionsData is coming back from the server sorted. If not, sort it after its fetched.

    var numReactions = reactionsData.length;
    if (numReactions == 0) {
        return {}; // TODO clean this up
    }
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

    var backgroundColors = [];
    var colorIndex = 0;
    var pairWithNext = 0;
    for (var i = 0; i < numReactions; i++) {
        backgroundColors[i] = colors[colorIndex % colors.length];
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
    return ractive.find('.antenna-reactions-widget');
}

var pageZ = 1000; // It's safe for this value to go across instances. We just need it to continuously increase (max value is over 2 billion).

function showPage(pageSelector, ractive, animate, overlay) {
    var $root = $(rootElement(ractive));
    var $page = $root.find(pageSelector);
    $page.css('z-index', pageZ);
    pageZ += 1;

    $page.toggleClass('antenna-page-animate', animate);

    if (overlay) {
        // In the overlay case, size the page to match whatever page is currently showing and then make it active (there will be two 'active' pages)
        var $current = $root.find('.antenna-page-active');
        $page.height($current.height());
        $page.addClass('antenna-page-active');
    } else if (animate) {
        TransitionUtil.toggleClass($page, 'antenna-page-active', true, function() {
            // After the new page slides into position, move the other pages back out of the viewable area
            $root.find('.antenna-page').not(pageSelector).removeClass('antenna-page-active');
        });
    } else {
        $page.addClass('antenna-page-active');
        $root.find('.antenna-page').not(pageSelector).removeClass('antenna-page-active');
    }
    sizeBodyToFit(ractive, $page, animate);
}

function sizeBodyToFit(ractive, $element, animate) {
    var $root = $(rootElement(ractive));
    var $body = $root.find('.antenna-body');
    var currentHeight = $body.css('height');
    $body.css({ height: '' }); // Clear any previously computed height so we get a fresh computation of the child heights
    var newHeight = Math.min(300, $element.get(0).scrollHeight);
    if (animate) {
        $body.css({ height: currentHeight });
        $body.animate({ height: newHeight }, 200);
    } else {
        $body.css({ height: newHeight });
    }
    // TODO: we might not need width resizing at all.
    var minWidth = $element.css('min-width');
    var width = parseInt(minWidth);
    if (width > 0) {
        if (animate) {
            $root.animate({ width: width }, 200);
        } else {
            $root.css({ width: width });
        }
    }
    //var width = (parseInt(minWidth) > 0) ? minWidth: '';
    //if (animate) {
    //    $root.animate({ width: width });
    //} else {
    //    $root.css({ width: width });
    //}
}

function showFooter(footerSelector, ractive) {
    var $root = $(rootElement(ractive));
    var $footer = $root.find(footerSelector);
    $footer.css('z-index', pageZ);
    pageZ += 1;
}

function showReactionsPage(ractive, animate) {
    showPage('.antenna-reactions-page', ractive, animate);
    showFooter('.antenna-reactions-footer', ractive);
}

function showDefaultReactionsPage(containerElement, contentData, ractive, animate) {
    if (!contentData.location && !contentData.body) {
        Range.grabNode(containerElement.get(0), function (text, location) {
            contentData.location = location;
            contentData.body = text;
        });
    }
    showPage('.antenna-default-page', ractive, animate);
    showFooter('.antenna-default-footer', ractive);
}

function showConfirmPage(ractive, animate) {
    showPage('.antenna-confirm-page', ractive, animate);
    showFooter('.antenna-confirm-footer', ractive);
}

function openWindow(elementOrCoords, containerElement, contentData, reactionsData, ractive) {
    $('.antenna-reactions-widget').trigger('focusout'); // Prompt any other open windows to close.
    var coords;
    if (elementOrCoords.top && elementOrCoords.left) {
        coords = elementOrCoords;
    } else {
        var $relativeElement = $(elementOrCoords);
        var offset = $relativeElement.offset();
        coords = {
            top: offset.top,
            left: offset.left
        };
    }
    // TODO: Look at whether we're opening off screen and adjust the coords if needed
    var $rootElement = $(rootElement(ractive));
    $rootElement.stop(true, true).addClass('open').css(coords);

    if (reactionsData.length > 0) {
        showReactionsPage(ractive, false);
    } else {
        // TODO allow to override and force showing of default
        showDefaultReactionsPage(containerElement, contentData, ractive, false);
    }

    setupWindowClose(ractive);
}

function setupWindowClose(ractive) {
    var $rootElement = $(rootElement(ractive));

    // TODO: If you mouse over the trigger slowly from the top left, the window opens without being under the cursor,
    //       so no mouseout event is received. When we open the window, we should probably just scoot it up slightly
    //       if needed to assure that it's under the cursor. Alternatively, we could adjust the mouseover area to match
    //       the region that the window opens.
    $rootElement
        .on('mouseout.antenna', delayedCloseWindow)
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
    $(document).on('click.antenna', function(event) {
        if ($(event.target).closest('.antenna-reactions-widget').length === 0) {
            closeWindow();
        }
    });

    var closeTimer;

    function delayedCloseWindow() {
        closeTimer = setTimeout(function() {
            closeTimer = null;
            closeWindow();
        }, 500);
    }

    function keepWindowOpen() {
        clearTimeout(closeTimer);
    }

    function closeWindow() {
        clearTimeout(closeTimer);

        $rootElement.stop(true, true).fadeOut('fast', function() {
            $rootElement.css('display', ''); // Clear the display:none that fadeOut puts on the element
            $rootElement.removeClass('open');
        });
        $rootElement.off('.antenna'); // Unbind all of the handlers in our namespace
        $(document).off('click.antenna');
        Range.clearHighlights();
        ractive.teardown();
    }
}

//noinspection JSUnresolvedVariable
module.exports = {
    open: openReactionsWidget
};
},{"../templates/reactions-widget.hbs.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/reactions-widget.hbs.html","./utils/ajax-client":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/ajax-client.js","./utils/jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js","./utils/moveable":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/moveable.js","./utils/range":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/range.js","./utils/transition-util":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/transition-util.js","./utils/urls":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/urls.js","./utils/widget-bucket":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/widget-bucket.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/script-loader.js":[function(require,module,exports){
var RangyProvider = require('./utils/rangy-provider');
var JQueryProvider = require('./utils/jquery-provider');
var isOffline = require('./utils/offline');
var URLs = require('./utils/urls');

var baseUrl = URLs.antennaHome();

var scripts = [
    {src: '//cdnjs.cloudflare.com/ajax/libs/jquery/2.1.4/jquery.min.js', callback: JQueryProvider.loaded},
    {src: '//cdnjs.cloudflare.com/ajax/libs/ractive/0.7.3/ractive.runtime.min.js'},
    {src: baseUrl + '/static/widget-new/lib/rangy-compiled.js', callback: RangyProvider.loaded, aboutToLoad: RangyProvider.aboutToLoad} // TODO minify and host this somewhere
];
if (isOffline) {
    // Use the offline versions of the libraries for development.
    scripts = [
        {src: baseUrl + '/static/js/cdn/jquery/2.1.4/jquery.js', callback: JQueryProvider.loaded},
        {src: baseUrl + '/static/js/cdn/ractive/0.7.3/ractive.runtime.js'},
        {src: baseUrl + '/static/widget-new/lib/rangy-compiled.js', callback: RangyProvider.loaded, aboutToLoad: RangyProvider.aboutToLoad}
    ];
}

function loadAllScripts(loadedCallback) {
    loadScripts(scripts, loadedCallback);
}

function loadScripts(scripts, loadedCallback) {
    var loadingCount = scripts.length;
    for (var i = 0; i < scripts.length; i++) {
        var script = scripts[i];
        if (script.aboutToLoad) { script.aboutToLoad(); }
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
                    if (callback) { callback(); }
                }
            };
        } else {
            scriptTag.onload = function() { // Other browsers
                if (callback) { callback(); }
            };
        }

        head.appendChild(scriptTag);
    }
}

//noinspection JSUnresolvedVariable
module.exports = {
    load: loadAllScripts
};
},{"./utils/jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js","./utils/offline":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/offline.js","./utils/rangy-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/rangy-provider.js","./utils/urls":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/urls.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/summary-widget.js":[function(require,module,exports){
var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var ReactionsWidget = require('./reactions-widget');

function createSummaryWidget(container, containerData, pageData, defaultReactions, groupSettings) {
    //// TODO replace element
    var ractive = Ractive({
        el: container,
        data: pageData,
        magic: true,
        template: require('../templates/summary-widget.hbs.html')
    });
    $(rootElement(ractive)).on('mouseenter', function(event) {
       openReactionsWindow(containerData, pageData, defaultReactions, groupSettings, ractive);
    });
}

function rootElement(ractive) {
    // TODO: gotta be a better way to get this
    return ractive.find('.ant-summary-widget');
}

function openReactionsWindow(containerData, pageData, defaultReactions, groupSettings, ractive) {
    var reactionsWidgetOptions = {
        reactionsData: pageData.summaryReactions,
        containerData: containerData,
        defaultReactions: defaultReactions,
        pageData: pageData,
        groupSettings: groupSettings,
        contentData: { type: 'page' }
    };
    ReactionsWidget.open(reactionsWidgetOptions, rootElement(ractive));
}

//noinspection JSUnresolvedVariable
module.exports = {
    create: createSummaryWidget
};
},{"../templates/summary-widget.hbs.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/summary-widget.hbs.html","./reactions-widget":"/Users/jburns/antenna/rb/static/widget-new/src/js/reactions-widget.js","./utils/jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/text-reactions.js":[function(require,module,exports){
var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var PopupWidget = require('./popup-widget');
var Range = require('./utils/range');
var ReactionsWidget = require('./reactions-widget');


function createReactableText(options) {
    // TODO: impose an upper limit on the length of text that can be reacted to? (applies to the indicator-widget too)
    var $containerElement = options.containerElement;
    var excludeNode = options.excludeNode;
    var reactionsWidgetOptions = {
        reactionsData: [], // Always open with the default reactions
        containerData: options.containerData,
        contentData: { type: 'text' },
        containerElement: $containerElement,
        defaultReactions: options.defaultReactions,
        pageData: options.pageData,
        groupSettings: options.groupSettings
    };

    $containerElement.on('mouseup', function(event) {
        var node = $containerElement.get(0);
        var point = Range.getSelectionEndPoint(node, event, excludeNode);
        if (point) {
            var coordinates = { top: point.y, left: point.x };
            PopupWidget.show(coordinates, grabSelectionAndOpen(node, coordinates, reactionsWidgetOptions, excludeNode));
        }
    });
}

function grabSelectionAndOpen(node, coordinates, reactionsWidgetOptions, excludeNode) {
    return function() {
        Range.grabSelection(node, function(text, location) {
            reactionsWidgetOptions.contentData.location = location;
            reactionsWidgetOptions.contentData.body = text;
            ReactionsWidget.open(reactionsWidgetOptions, coordinates);
        }, excludeNode);
    }
}

//noinspection JSUnresolvedVariable
module.exports = {
    createReactableText: createReactableText
};
},{"./popup-widget":"/Users/jburns/antenna/rb/static/widget-new/src/js/popup-widget.js","./reactions-widget":"/Users/jburns/antenna/rb/static/widget-new/src/js/reactions-widget.js","./utils/jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js","./utils/range":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/range.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/ajax-client.js":[function(require,module,exports){
// TODO: needs a better name once the scope is clear

var $; require('./jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var XDMClient = require('./xdm-client');
var URLs = require('./urls');


function postNewReaction(reactionData, containerData, pageData, contentData, success, error) {
    var contentBody = contentData.body;
    var contentType = contentData.type;
    var contentLocation = contentData.location;
    var contentDimensions = contentData.dimensions;
    XDMClient.getUser(function(response) {
        var userInfo = response.data;
        // TODO extract the shape of this data and possibly the whole API call
        // TODO figure out which parts don't get passed for a new reaction
        // TODO compute field values (e.g. container_kind and content info) for new reactions
        var data = {
            tag: {
                body: reactionData.text
            },
            is_default: 'true',
            hash: containerData.hash,
            user_id: userInfo.user_id,
            ant_token: userInfo.ant_token,
            page_id: pageData.pageId,
            group_id: pageData.groupId,
            container_kind: contentType, // One of 'page', 'text', 'media', 'img'
            content_node_data: {
                body: contentBody,
                kind: contentType,
                item_type: '' // TODO: looks unused but TagHandler blows up without it. Current client passes in "page" for page reactions.
            }
        };
        if (contentLocation) {
            data.content_node_data.location = contentLocation;
        }
        if (contentDimensions) {
            data.content_node_data.height = contentDimensions.height;
            data.content_node_data.width = contentDimensions.width;
        }
        if (reactionData.id) {
            data.tag.id = reactionData.id; // TODO the current client sends "-101" if there's no id. is this necessary?
        }
        $.getJSONP(URLs.createReactionUrl(), data, success, error);
        //var response = { // TODO: just capturing the api format...
        //        existing: json.existing,
        //        interaction: {
        //            id: json.interaction.id,
        //            interaction_node: {
        //                body: json.interaction.interaction_node.body,
        //                id: json.interaction.interaction_node.id
        //            }
        //        }
        //    };
    });
}

function postPlusOne(reactionData, containerData, pageData, success, error) {
    XDMClient.getUser(function(response) {
        var userInfo = response.data;
        // TODO extract the shape of this data and possibly the whole API call
        // TODO figure out which parts don't get passed for a new reaction
        // TODO compute field values (e.g. container_kind and content info) for new reactions
        if (!reactionData.content) {
            // This is a summary reaction. See if we have any container data that we can link to it.
            var containerReactions = containerData.reactions;
            for (var i = 0; i < containerReactions.length; i++) {
                var containerReaction = containerReactions[i];
                if (containerReaction.id === reactionData.id) {
                    reactionData.parentID = containerReaction.parentID;
                    reactionData.content = containerReaction.content;
                    break;
                }
            }
        }
        var data = {
            tag: {
                body: reactionData.text,
                id: reactionData.id
            },
            is_default: 'true', // TODO check if the reaction id/body matches a default
            hash: containerData.hash,
            user_id: userInfo.user_id,
            ant_token: userInfo.ant_token,
            page_id: pageData.pageId,
            group_id: pageData.groupId,
            container_kind: containerData.type, // 'page', 'text', 'media', 'img'
            content_node_data: {
                body: '', // TODO: do we need this for +1s?
                kind: contentNodeDataKind(containerData.type),
                item_type: '' // TODO: looks unused but TagHandler blows up without it
            }
        };
        if (reactionData.content) {
            data.content_node_data.id = reactionData.content.id;
            data.content_node_data.location = reactionData.content.location;
        }
        $.getJSONP(URLs.createReactionUrl(), data, success, error);
        //var response = { // TODO: just capturing the api format...
        //        existing: json.existing,
        //        interaction: {
        //            id: json.interaction.id,
        //            interaction_node: {
        //                body: json.interaction.interaction_node.body,
        //                id: json.interaction.interaction_node.id
        //            }
        //        }
        //    };
    });
}

function contentNodeDataKind(type) {
    // TODO: resolve whether to use the short or long form for content_node_data.kind. // 'pag', 'txt', 'med', 'img'
    if (type === 'image') {
        return 'img';
    }
    return type;
}

function isDefaultReaction(reaction, defaultReactions) {
    // TODO consider tagging the reaction data on read/load rather than on write
    for (var i = 0; i < defaultReactions.length; i++) {
        if (reaction.id && defaultReactions[i].id && reaction.id === defaultReactions[i].id) {
            return true;
        }
    }
    return false;
}

//noinspection JSUnresolvedVariable
module.exports = {
    postPlusOne: postPlusOne,
    postNewReaction: postNewReaction
};
},{"./jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js","./urls":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/urls.js","./xdm-client":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/xdm-client.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/hash.js":[function(require,module,exports){
var $; require('./jquery-provider').onLoad(function(jQuery) { $=jQuery; });
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

function hashImage(imageUrl) {
    var hashText = 'rdr-img-' + imageUrl;
    return MD5.hex_md5(hashText);
}

function hashMedia(element) {

}

//noinspection JSUnresolvedVariable
module.exports = {
    hashText: hashText,
    hashImage: hashImage,
    hashUrl: hashUrl
};
},{"./jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js","./md5":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/md5.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js":[function(require,module,exports){
var URLs = require('./urls');

var loadedjQuery;
var callbacks = [];

// Notifies the jQuery provider that we've loaded the jQuery library.
function loaded() {
    loadedjQuery = jQuery.noConflict();
    // Add our custom JSONP function
    loadedjQuery.getJSONP = function(url, data, success, error) {
        var options = {
            url: URLs.antennaHome() + url,
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
        loadedjQuery.ajax(options);
    };
    notifyCallbacks();
}

function notifyCallbacks() {
    for (var i = 0; i < callbacks.length; i++) {
        callbacks[i](loadedjQuery);
    }
    callbacks = [];
}

// Registers the given callback to be notified when our version of jQuery is loaded.
function onLoad(callback) {
    if (loadedjQuery) {
        callback(loadedjQuery);
    } else {
        callbacks.push(callback);
    }
}

//noinspection JSUnresolvedVariable
module.exports = {
    loaded: loaded,
    onLoad: onLoad
};
},{"./urls":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/urls.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/md5.js":[function(require,module,exports){

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
var $; require('./jquery-provider').onLoad(function(jQuery) { $=jQuery; });

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
},{"./jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/offline.js":[function(require,module,exports){

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
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/page-utils.js":[function(require,module,exports){
var $; require('./jquery-provider').onLoad(function(jQuery) { $=jQuery; });

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

//noinspection JSUnresolvedVariable
module.exports = {
    computePageUrl: computePageElementUrl,
    computeCanonicalUrl: computePageElementCanonicalUrl
};
},{"./jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/range.js":[function(require,module,exports){
var rangy; require('./rangy-provider').onLoad(function(loadedRangy) { rangy = loadedRangy; });

var highlightClass = 'antenna-highlight';
var highlightedRanges = [];

var classApplier;
function getClassApplier() {
    if (!classApplier) {
        classApplier = rangy.createClassApplier(highlightClass);
    }
    return classApplier;
}

// Returns an adjusted end point for the selection within the given node, as triggered by the given mouse up event.
// The returned point (x, y) takes into account the location of the mouse up event as well as the direction of the
// selection (forward/back).
function getSelectionEndPoint(node, event, excludeNode) {
    // TODO: Consider using the element created with the 'classifier' rather than the mouse location
    var selection = rangy.getSelection();
    if (isValidSelection(selection, node, excludeNode)) {
        return {
            x: event.pageX - ( selection.isBackwards() ? -5 : 5),
            y: event.pageY - 8 // TODO: exact coords
        }
    }
    return null;
}

// Attempts to get a range from the current selection. This expands the
// selected region to include word boundaries.
function grabSelection(node, callback, excludeNode) {
    var selection = rangy.getSelection();
    if (isValidSelection(selection, node, excludeNode)) {
        selection.expand('word', { trim: true });
        var location = rangy.serializeSelection(selection, true, node);
        var text = selection.toString();
        highlightSelection(selection); // Highlighting deselects the text, so do this last.
        callback(text, location);
    }
}

function isValidSelection(selection, node, excludeNode) {
    return !selection.isCollapsed &&  // Non-empty selection
        selection.rangeCount === 1 && // Single selection
        (!excludeNode || !selection.containsNode(excludeNode, true)) && // Selection doesn't contain anything we've said we don't want (e.g. the indicator)
        node.contains(selection.getRangeAt(0).commonAncestorContainer); // Selection is contained entirely within the node
}

function grabNode(node, callback) {
    var range = rangy.createRange(document);
    range.selectNodeContents(node);
    var $excluded = $(node).find('.ant-indicator-container'); // This class is copied in page-scanner
    if ($excluded.size() > 0) { // Remove the indicator from the end of the selected range.
        range.setEndBefore($excluded.get(0));
    }
    var selection = rangy.getSelection();
    selection.setSingleRange(range);
    var location = rangy.serializeSelection(selection, true, node);
    var text = selection.toString();
    if (text.trim().length > 0) {
        highlightSelection(selection); // Highlighting deselects the text, so do this last.
        callback(text, location);
    }
    selection.removeAllRanges(); // Don't actually leave the element selected.
    selection.refresh();
}

// Highlights the given location inside the given node.
function highlightLocation(node, location) {
    // TODO error handling in case the range is not valid?
    if (rangy.canDeserializeRange(location, node, document)) {
        var range = rangy.deserializeRange(location, node, document);
        highlightRange(range);
    }
}

function highlightSelection(selection) {
    highlightRange(selection.getRangeAt(0));
}

function highlightRange(range) {
    getClassApplier().applyToRange(range);
    highlightedRanges.push(range);
}

// Clears all highlights that have been created on the page.
function clearHighlights() {
    var classApplier = getClassApplier();
    for (var i = 0; i < highlightedRanges.length; i++) {
        var range = highlightedRanges[i];
        if (classApplier.isAppliedToRange(range)) {
            classApplier.undoToRange(range);
        }
    }
    highlightedRanges = [];
}

//noinspection JSUnresolvedVariable
module.exports = {
    getSelectionEndPoint: getSelectionEndPoint,
    grabSelection: grabSelection,
    grabNode: grabNode,
    clearHighlights: clearHighlights,
    highlight: highlightLocation
};
},{"./rangy-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/rangy-provider.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/rangy-provider.js":[function(require,module,exports){

var noConflict;
var loadedRangy;
var callbacks = [];

// Capture any global instance of rangy which already exists before we load our own.
function aboutToLoad() {
    noConflict = window.rangy;
}

// Restore the global instance of rangy (if any) and pass out our version to our callbacks
function loaded() {
    loadedRangy = rangy;
    loadedRangy.init();
    window.rangy = noConflict;
    notifyCallbacks();
}

function notifyCallbacks() {
    for (var i = 0; i < callbacks.length; i++) {
        callbacks[i](loadedRangy);
    }
    callbacks = [];
}

// Registers the given callback to be notified when our version of Rangy is loaded.
function onLoad(callback) {
    if (loadedRangy) {
        callback(loadedRangy);
    } else {
        callbacks.push(callback);
    }
}

module.exports = {
    aboutToLoad: aboutToLoad,
    loaded: loaded,
    onLoad: onLoad
};
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/transition-util.js":[function(require,module,exports){


function toggleTransitionClass($element, className, state, nextStep) {
    $element.on("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd",
        function(event) {
            // once the CSS transition is complete, call our next step
            // See: http://stackoverflow.com/questions/9255279/callback-when-css3-transition-finishes
            if (event.target == event.currentTarget) {
                $element.off("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd");
                if (nextStep) {
                    nextStep();
                }
            }
        }
    );
    $element.toggleClass(className, state);
}

module.exports = {
    toggleClass: toggleTransitionClass
};
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/urls.js":[function(require,module,exports){
var offline = require('./offline.js');

function antennaHome() {
    if (offline) {
        return window.location.protocol + "//local.antenna.is:8081";
    }
    return "https://www.antenna.is"; // TODO: www? how about antenna.is or api.antenna.is?
}

function getCreateReactionUrl() {
    return '/api/tag/create';
}

//noinspection JSUnresolvedVariable
module.exports = {
    antennaHome: antennaHome,
    createReactionUrl: getCreateReactionUrl
};
},{"./offline.js":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/offline.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/widget-bucket.js":[function(require,module,exports){

function getWidgetBucket() {
    var bucket = document.getElementById('antenna-widget-bucket');
    if (!bucket) {
        bucket = document.createElement('div');
        bucket.setAttribute('id', 'antenna-widget-bucket');
        document.body.appendChild(bucket);
    }
    return bucket;
}

//noinspection JSUnresolvedVariable
module.exports = getWidgetBucket;
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/xdm-client.js":[function(require,module,exports){

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
var $; require('./jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var URLs = require('./urls');
var WidgetBucket = require('./widget-bucket');

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
    $(WidgetBucket()).append( $xdmIframe );
}

module.exports = {
    createXDMframe: createXDMframe
};
},{"./jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js","./urls":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/urls.js","./widget-bucket":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/widget-bucket.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/templates/image-indicator-widget.hbs.html":[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"span","a":{"class":["antenna antenna-image-indicator-widget ",{"t":4,"f":["reactions"],"r":"containerData.reactionTotal"}]},"f":[{"t":7,"e":"span","a":{"class":"ant-antenna-logo"}}," ",{"t":4,"f":[{"t":7,"e":"span","a":{"class":"antenna-reaction-total"},"f":[{"t":2,"r":"containerData.reactionTotal"}]}],"n":50,"r":"containerData.reactionTotal"},{"t":4,"n":51,"f":[{"t":7,"e":"span","a":{"class":"antenna-reaction-prompt"},"f":["What do you think?"]}],"r":"containerData.reactionTotal"}]}]}
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/templates/indicator-widget.hbs.html":[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"span","a":{"class":["antenna antenna-indicator-widget ",{"t":4,"f":["reactions"],"r":"containerData.reactionTotal"}]},"f":[{"t":7,"e":"span","a":{"class":"ant-antenna-logo"}}," ",{"t":4,"f":[{"t":7,"e":"span","a":{"class":"antenna-reaction-total"},"f":[{"t":2,"r":"containerData.reactionTotal"}]}],"n":50,"r":"containerData.reactionTotal"}]}]}
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/templates/popup-widget.hbs.html":[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna-popup"},"f":[{"t":7,"e":"div","a":{"class":"antenna-popup-body"},"f":[{"t":7,"e":"span","a":{"class":"ant-antenna-logo"}}," ",{"t":7,"e":"span","a":{"class":"antenna-popup-text"},"f":["What do you think?"]}]}]}]}
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/templates/reactions-widget.hbs.html":[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna antenna-reactions-widget","tabindex":"0"},"f":[{"t":7,"e":"div","a":{"class":"antenna-header"},"f":[{"t":7,"e":"span","a":{"class":"ant-antenna-logo"}}," Reactions"]}," ",{"t":7,"e":"div","a":{"class":"antenna-body"},"f":[{"t":7,"e":"div","a":{"class":"antenna-reactions-page antenna-page"},"f":[{"t":4,"f":[{"t":7,"e":"div","v":{"click":"plusone","mouseenter":"highlight","mouseleave":"clearhighlights"},"a":{"class":["antenna-reaction ",{"t":2,"x":{"r":["reactionsLayoutClass","index","./count"],"s":"_0(_1,_2)"}}],"style":["background-color:",{"t":2,"x":{"r":["reactionsBackgroundColor","index"],"s":"_0(_1)"}}]},"f":[" ",{"t":7,"e":"div","a":{"class":"antenna-reaction-box"},"f":[{"t":7,"e":"div","a":{"class":"antenna-reaction-text"},"o":"sizetofit","f":[{"t":2,"r":"./text"}]}," ",{"t":7,"e":"div","a":{"class":"antenna-reaction-count"},"f":[{"t":2,"r":"./count"}]}]}]}],"i":"index","r":"reactions"}]}," ",{"t":7,"e":"div","a":{"class":"antenna-default-page antenna-page"},"f":[{"t":4,"f":[{"t":7,"e":"div","v":{"click":"newreaction"},"a":{"class":["antenna-reaction ",{"t":2,"x":{"r":["defaultLayoutClass","index"],"s":"_0(_1)"}}],"style":["background-color:",{"t":2,"x":{"r":["defaultBackgroundColor","index"],"s":"_0(_1)"}}]},"f":[{"t":7,"e":"div","a":{"class":"antenna-reaction-box"},"f":[{"t":7,"e":"div","a":{"class":"antenna-reaction-text"},"o":"sizetofit","f":[{"t":2,"r":"./text"}]}]}]}],"i":"index","r":"defaultReactions"}]}," ",{"t":7,"e":"div","a":{"class":"antenna-confirm-page antenna-page"},"f":[{"t":4,"f":["Looks like you still feel the same way."],"n":50,"r":"response.existing"},{"t":4,"n":51,"f":["New reaction received."],"r":"response.existing"}]}," ",{"t":7,"e":"div","a":{"class":"antenna-progress-page antenna-page"},"f":[]}]}," ",{"t":7,"e":"div","a":{"class":"antenna-footer-area"},"f":[{"t":7,"e":"div","a":{"class":"antenna-footer antenna-reactions-footer"},"f":[{"t":7,"e":"span","v":{"click":"showdefault"},"a":{"class":"antenna-think"},"f":["What do you think?"]}]}," ",{"t":7,"e":"div","a":{"class":"antenna-footer antenna-default-footer"},"f":[{"t":7,"e":"span","v":{"click":"addcustom"},"a":{"class":"antenna-custom"},"f":["+ Add your own"]}]}," ",{"t":7,"e":"div","a":{"class":"antenna-footer antenna-confirm-footer"},"f":[{"t":7,"e":"span","v":{"click":"share"},"a":{"class":"antenna-share"},"f":["Facebook!"]}]}]}]}]}
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/templates/summary-widget.hbs.html":[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna ant-summary-widget","ant-hash":[{"t":2,"r":"pageHash"}]},"f":[{"t":7,"e":"a","a":{"href":"http://www.antenna.is","target":"_blank"},"f":[{"t":7,"e":"span","a":{"class":"ant-antenna-logo"}}]}," ",{"t":4,"f":[{"t":4,"f":[{"t":2,"r":"summaryTotal"}],"n":50,"r":"summaryTotal"}," Reactions"],"n":50,"x":{"r":["summaryTotal"],"s":"_0!==undefined"}}]}]}
},{}]},{},["/Users/jburns/antenna/rb/static/widget-new/src/js/antenna.js","/Users/jburns/antenna/rb/static/widget-new/src/js/css-loader.js","/Users/jburns/antenna/rb/static/widget-new/src/js/group-settings-loader.js","/Users/jburns/antenna/rb/static/widget-new/src/js/group-settings.js","/Users/jburns/antenna/rb/static/widget-new/src/js/image-indicator-widget.js","/Users/jburns/antenna/rb/static/widget-new/src/js/indicator-widget.js","/Users/jburns/antenna/rb/static/widget-new/src/js/page-data-loader.js","/Users/jburns/antenna/rb/static/widget-new/src/js/page-data.js","/Users/jburns/antenna/rb/static/widget-new/src/js/page-scanner.js","/Users/jburns/antenna/rb/static/widget-new/src/js/popup-widget.js","/Users/jburns/antenna/rb/static/widget-new/src/js/reactions-widget.js","/Users/jburns/antenna/rb/static/widget-new/src/js/script-loader.js","/Users/jburns/antenna/rb/static/widget-new/src/js/summary-widget.js","/Users/jburns/antenna/rb/static/widget-new/src/js/text-reactions.js","/Users/jburns/antenna/rb/static/widget-new/src/templates/image-indicator-widget.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/indicator-widget.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/popup-widget.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/reactions-widget.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/summary-widget.hbs.html"])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi93aWRnZXQtbmV3L3NyYy9qcy9hbnRlbm5hLmpzIiwiLi4vd2lkZ2V0LW5ldy9zcmMvanMvY3NzLWxvYWRlci5qcyIsIi4uL3dpZGdldC1uZXcvc3JjL2pzL2dyb3VwLXNldHRpbmdzLWxvYWRlci5qcyIsIi4uL3dpZGdldC1uZXcvc3JjL2pzL2dyb3VwLXNldHRpbmdzLmpzIiwiLi4vd2lkZ2V0LW5ldy9zcmMvanMvaW1hZ2UtaW5kaWNhdG9yLXdpZGdldC5qcyIsIi4uL3dpZGdldC1uZXcvc3JjL2pzL2luZGljYXRvci13aWRnZXQuanMiLCIuLi93aWRnZXQtbmV3L3NyYy9qcy9wYWdlLWRhdGEtbG9hZGVyLmpzIiwiLi4vd2lkZ2V0LW5ldy9zcmMvanMvcGFnZS1kYXRhLmpzIiwiLi4vd2lkZ2V0LW5ldy9zcmMvanMvcGFnZS1zY2FubmVyLmpzIiwiLi4vd2lkZ2V0LW5ldy9zcmMvanMvcG9wdXAtd2lkZ2V0LmpzIiwiLi4vd2lkZ2V0LW5ldy9zcmMvanMvcmVhY3Rpb25zLXdpZGdldC5qcyIsIi4uL3dpZGdldC1uZXcvc3JjL2pzL3NjcmlwdC1sb2FkZXIuanMiLCIuLi93aWRnZXQtbmV3L3NyYy9qcy9zdW1tYXJ5LXdpZGdldC5qcyIsIi4uL3dpZGdldC1uZXcvc3JjL2pzL3RleHQtcmVhY3Rpb25zLmpzIiwiLi4vd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvYWpheC1jbGllbnQuanMiLCIuLi93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9oYXNoLmpzIiwiLi4vd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvanF1ZXJ5LXByb3ZpZGVyLmpzIiwiLi4vd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvbWQ1LmpzIiwiLi4vd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvbW92ZWFibGUuanMiLCIuLi93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9vZmZsaW5lLmpzIiwiLi4vd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvcGFnZS11dGlscy5qcyIsIi4uL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL3JhbmdlLmpzIiwiLi4vd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvcmFuZ3ktcHJvdmlkZXIuanMiLCIuLi93aWRnZXQtbmV3L3NyYy9qcy91dGlscy90cmFuc2l0aW9uLXV0aWwuanMiLCIuLi93aWRnZXQtbmV3L3NyYy9qcy91dGlscy91cmxzLmpzIiwiLi4vd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvd2lkZ2V0LWJ1Y2tldC5qcyIsIi4uL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL3hkbS1jbGllbnQuanMiLCIuLi93aWRnZXQtbmV3L3NyYy9qcy91dGlscy94ZG0tbG9hZGVyLmpzIiwiLi4vd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL2ltYWdlLWluZGljYXRvci13aWRnZXQuaGJzLmh0bWwiLCIuLi93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvaW5kaWNhdG9yLXdpZGdldC5oYnMuaHRtbCIsIi4uL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9wb3B1cC13aWRnZXQuaGJzLmh0bWwiLCIuLi93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvcmVhY3Rpb25zLXdpZGdldC5oYnMuaHRtbCIsIi4uL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9zdW1tYXJ5LXdpZGdldC5oYnMuaHRtbCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUEiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiXG52YXIgU2NyaXB0TG9hZGVyID0gcmVxdWlyZSgnLi9zY3JpcHQtbG9hZGVyJyk7XG52YXIgQ3NzTG9hZGVyID0gcmVxdWlyZSgnLi9jc3MtbG9hZGVyJyk7XG52YXIgR3JvdXBTZXR0aW5nc0xvYWRlciA9IHJlcXVpcmUoJy4vZ3JvdXAtc2V0dGluZ3MtbG9hZGVyJyk7XG52YXIgUGFnZURhdGFMb2FkZXIgPSByZXF1aXJlKCcuL3BhZ2UtZGF0YS1sb2FkZXInKTtcbnZhciBQYWdlU2Nhbm5lciA9IHJlcXVpcmUoJy4vcGFnZS1zY2FubmVyJyk7XG52YXIgWERNTG9hZGVyID0gcmVxdWlyZSgnLi91dGlscy94ZG0tbG9hZGVyJyk7XG5cblxuLy8gU3RlcCAxIC0ga2ljayBvZmYgdGhlIGFzeW5jaHJvbm91cyBsb2FkaW5nIG9mIHRoZSBKYXZhc2NyaXB0IGFuZCBDU1Mgd2UgbmVlZC5cblNjcmlwdExvYWRlci5sb2FkKGxvYWRHcm91cFNldHRpbmdzKTtcbkNzc0xvYWRlci5sb2FkKCk7XG5cbmZ1bmN0aW9uIGxvYWRHcm91cFNldHRpbmdzKCkge1xuICAgIC8vIFN0ZXAgMiAtIE9uY2Ugd2UgaGF2ZSB0aGUgc2V0dGluZ3MsIHdlIGNhbiBraWNrIG9mZiBhIGNvdXBsZSB0aGluZ3MgaW4gcGFyYWxsZWw6XG4gICAgLy9cbiAgICAvLyAtLSBjcmVhdGUgdGhlIGhpZGRlbiBpZnJhbWUgd2UgdXNlIGZvciBjcm9zcy1kb21haW4gY29va2llcyAocHJpbWFyaWx5IHVzZXIgbG9naW4pXG4gICAgLy8gLS0gc3RhcnQgZmV0Y2hpbmcgdGhlIHBhZ2UgZGF0YVxuICAgIC8vIC0tIHN0YXJ0IGhhc2hpbmcgdGhlIHBhZ2UgYW5kIGluc2VydGluZyB0aGUgYWZmb3JkYW5jZXMgKGluIHRoZSBlbXB0eSBzdGF0ZSlcbiAgICAvL1xuICAgIC8vIEFzIHRoZSBwYWdlIGlzIHNjYW5uZWQsIHRoZSB3aWRnZXRzIGFyZSBjcmVhdGVkIGFuZCBib3VuZCB0byB0aGUgcGFnZSBkYXRhIHRoYXQgY29tZXMgaW4uXG4gICAgR3JvdXBTZXR0aW5nc0xvYWRlci5sb2FkKGZ1bmN0aW9uKGdyb3VwU2V0dGluZ3MpIHtcbiAgICAgICAgaW5pdFhkbUZyYW1lKGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICBmZXRjaFBhZ2VEYXRhKGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICBzY2FuUGFnZShncm91cFNldHRpbmdzKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gaW5pdFhkbUZyYW1lKGdyb3VwU2V0dGluZ3MpIHtcbiAgICBYRE1Mb2FkZXIuY3JlYXRlWERNZnJhbWUoZ3JvdXBTZXR0aW5ncy5ncm91cElkKTtcbn1cblxuZnVuY3Rpb24gZmV0Y2hQYWdlRGF0YShncm91cFNldHRpbmdzKSB7XG4gICAgUGFnZURhdGFMb2FkZXIubG9hZChncm91cFNldHRpbmdzKTtcbn1cblxuZnVuY3Rpb24gc2NhblBhZ2UoZ3JvdXBTZXR0aW5ncykge1xuICAgIFBhZ2VTY2FubmVyLnNjYW4oZ3JvdXBTZXR0aW5ncyk7XG59IiwiXG52YXIgYmFzZVVybCA9ICdodHRwOi8vbG9jYWxob3N0OjgwODEnOyAvLyBUT0RPIGNvbXB1dGUgdGhpc1xuXG5mdW5jdGlvbiBsb2FkQ3NzKCkge1xuICAgIHZhciBoZWFkID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKVswXTtcbiAgICBpZiAoaGVhZCkge1xuICAgICAgICAvLyBUbyBtYWtlIHN1cmUgbm9uZSBvZiBvdXIgY29udGVudCByZW5kZXJzIG9uIHRoZSBwYWdlIGJlZm9yZSBvdXIgQ1NTIGlzIGxvYWRlZCwgd2UgYXBwZW5kIGEgc2ltcGxlIGlubGluZSBzdHlsZVxuICAgICAgICAvLyBlbGVtZW50IHRoYXQgdHVybnMgb2ZmIG91ciBlbGVtZW50cyAqYmVmb3JlKiBvdXIgQ1NTIGxpbmtzLiBUaGlzIGV4cGxvaXRzIHRoZSBjYXNjYWRlIHJ1bGVzIC0gb3VyIENTUyBmaWxlcyBhcHBlYXJcbiAgICAgICAgLy8gYWZ0ZXIgdGhlIGlubGluZSBzdHlsZSBpbiB0aGUgZG9jdW1lbnQsIHNvIHRoZXkgdGFrZSBwcmVjZWRlbmNlIChhbmQgbWFrZSBldmVyeXRoaW5nIGFwcGVhcikgb25jZSB0aGV5J3JlIGxvYWRlZC5cbiAgICAgICAgdmFyIHN0eWxlVGFnID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcbiAgICAgICAgc3R5bGVUYWcuaW5uZXJIVE1MID0gJy5hbnRlbm5he2Rpc3BsYXk6bm9uZTt9JztcbiAgICAgICAgaGVhZC5hcHBlbmRDaGlsZChzdHlsZVRhZyk7XG5cbiAgICAgICAgdmFyIGNzc0hyZWZzID0gW1xuICAgICAgICAgICAgLy8gVE9ETyBicmluZ2luZyBpbiBtdWx0aXBsZSBjc3MgZmlsZXMgYnJlYWtzIHRoZSB3YXkgd2Ugd2FpdCB1bnRpbCBvdXIgQ1NTIGlzIGxvYWRlZCBiZWZvcmUgc2hvd2luZyBvdXIgY29udGVudC5cbiAgICAgICAgICAgIC8vICAgICAgd2UgbmVlZCB0byBmaW5kIGEgd2F5IHRvIGJyaW5nIHRoYXQgYmFjay4gb25lIHNpbXBsZSB3YXkgLSBhbHNvIGNvbXBpbGUgdGhlIGFudGVubmEtZm9udC5jc3MgaW50byB0aGUgYW50ZW5uYS5jc3MgZmlsZS5cbiAgICAgICAgICAgIC8vICAgICAgb3BlbiBxdWVzdGlvbiAtIGhvdyBkb2VzIGl0IGFsbCBwbGF5IHdpdGggZm9udCBpY29ucyB0aGF0IGFyZSBkb3dubG9hZGVkIGFzIHlldCBhbm90aGVyIGZpbGU/XG4gICAgICAgICAgICBiYXNlVXJsICsgJy9zdGF0aWMvY3NzL2FudGVubmEtZm9udC9hbnRlbm5hLWZvbnQuY3NzJyxcbiAgICAgICAgICAgIGJhc2VVcmwgKyAnL3N0YXRpYy93aWRnZXQtbmV3L2RlYnVnL2FudGVubmEuY3NzJyAvLyBUT0RPIHRoaXMgbmVlZHMgYSBmaW5hbCBwYXRoLiBDRE4gZm9yIHByb2R1Y3Rpb24gYW5kIGxvY2FsIGZpbGUgZm9yIGRldmVsb3BtZW50P1xuICAgICAgICBdO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNzc0hyZWZzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBsb2FkRmlsZShjc3NIcmVmc1tpXSwgaGVhZCk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGxvYWRGaWxlKGhyZWYsIGhlYWQpIHtcbiAgICB2YXIgbGlua1RhZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpbmsnKTtcbiAgICBsaW5rVGFnLnNldEF0dHJpYnV0ZSgnaHJlZicsIGhyZWYpO1xuICAgIGxpbmtUYWcuc2V0QXR0cmlidXRlKCdyZWwnLCAnc3R5bGVzaGVldCcpO1xuICAgIGxpbmtUYWcuc2V0QXR0cmlidXRlKCd0eXBlJywgJ3RleHQvY3NzJyk7XG4gICAgaGVhZC5hcHBlbmRDaGlsZChsaW5rVGFnKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgbG9hZCA6IGxvYWRDc3Ncbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgR3JvdXBTZXR0aW5ncyA9IHJlcXVpcmUoJy4vZ3JvdXAtc2V0dGluZ3MnKTtcblxuLy8gVE9ETyBmb2xkIHRoaXMgbW9kdWxlIGludG8gZ3JvdXAtc2V0dGluZ3M/XG5cbmZ1bmN0aW9uIGxvYWRTZXR0aW5ncyhjYWxsYmFjaykge1xuICAgICQuZ2V0SlNPTlAoJy9hcGkvc2V0dGluZ3MnLCB7IGhvc3RfbmFtZTogd2luZG93LmFudGVubmFfaG9zdCB9LCBzdWNjZXNzLCBlcnJvcik7XG5cbiAgICBmdW5jdGlvbiBzdWNjZXNzKGpzb24pIHtcbiAgICAgICAgdmFyIGdyb3VwU2V0dGluZ3MgPSBHcm91cFNldHRpbmdzLmNyZWF0ZShqc29uKTtcbiAgICAgICAgY2FsbGJhY2soZ3JvdXBTZXR0aW5ncyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZXJyb3IobWVzc2FnZSkge1xuICAgICAgICAvLyBUT0RPIGhhbmRsZSBlcnJvcnMgdGhhdCBoYXBwZW4gd2hlbiBsb2FkaW5nIGNvbmZpZyBkYXRhXG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgbG9hZDogbG9hZFNldHRpbmdzXG59OyIsInZhciAkOyByZXF1aXJlKCcuL3V0aWxzL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xuXG4vLyBUT0RPOiB0cmltIHRyYWlsaW5nIGNvbW1hcyBmcm9tIGFueSBzZWxlY3RvciB2YWx1ZXNcblxuLy8gVE9ETzogUmV2aWV3LiBUaGVzZSBhcmUganVzdCBjb3BpZWQgZnJvbSBlbmdhZ2VfZnVsbC5cbnZhciBkZWZhdWx0cyA9IHtcbiAgICBwcmVtaXVtOiBmYWxzZSxcbiAgICBpbWdfc2VsZWN0b3I6IFwiaW1nXCIsXG4gICAgaW1nX2NvbnRhaW5lcl9zZWxlY3RvcnM6XCIjcHJpbWFyeS1waG90b1wiLFxuICAgIGFjdGl2ZV9zZWN0aW9uczogXCJib2R5XCIsXG4gICAgYW5ub193aGl0ZWxpc3Q6IFwiYm9keSBwXCIsXG4gICAgYWN0aXZlX3NlY3Rpb25zX3dpdGhfYW5ub193aGl0ZWxpc3Q6XCJcIixcbiAgICBtZWRpYV9zZWxlY3RvcjogXCJlbWJlZCwgdmlkZW8sIG9iamVjdCwgaWZyYW1lXCIsXG4gICAgY29tbWVudF9sZW5ndGg6IDUwMCxcbiAgICBub19hbnQ6IFwiXCIsXG4gICAgaW1nX2JsYWNrbGlzdDogXCJcIixcbiAgICBjdXN0b21fY3NzOiBcIlwiLFxuICAgIC8vdG9kbzogdGVtcCBpbmxpbmVfaW5kaWNhdG9yIGRlZmF1bHRzIHRvIG1ha2UgdGhlbSBzaG93IHVwIG9uIGFsbCBtZWRpYSAtIHJlbW92ZSB0aGlzIGxhdGVyLlxuICAgIGlubGluZV9zZWxlY3RvcjogJ2ltZywgZW1iZWQsIHZpZGVvLCBvYmplY3QsIGlmcmFtZScsXG4gICAgcGFyYWdyYXBoX2hlbHBlcjogdHJ1ZSxcbiAgICBtZWRpYV91cmxfaWdub3JlX3F1ZXJ5OiB0cnVlLFxuICAgIHN1bW1hcnlfd2lkZ2V0X3NlbGVjdG9yOiAnLmFudC1wYWdlLXN1bW1hcnknLCAvLyBUT0RPOiB0aGlzIHdhc24ndCBkZWZpbmVkIGFzIGEgZGVmYXVsdCBpbiBlbmdhZ2VfZnVsbCwgYnV0IHdhcyBpbiBjb2RlLiB3aHk/XG4gICAgc3VtbWFyeV93aWRnZXRfbWV0aG9kOiAnYWZ0ZXInLFxuICAgIGxhbmd1YWdlOiAnZW4nLFxuICAgIGFiX3Rlc3RfaW1wYWN0OiB0cnVlLFxuICAgIGFiX3Rlc3Rfc2FtcGxlX3BlcmNlbnRhZ2U6IDEwLFxuICAgIGltZ19pbmRpY2F0b3Jfc2hvd19vbmxvYWQ6IHRydWUsXG4gICAgaW1nX2luZGljYXRvcl9zaG93X3NpZGU6ICdsZWZ0JyxcbiAgICB0YWdfYm94X2JnX2NvbG9yczogJyMxODQxNGM7IzM3NjA3NjsyMTUsIDE3OSwgNjk7I2U2ODg1YzsjZTQ2MTU2JyxcbiAgICB0YWdfYm94X3RleHRfY29sb3JzOiAnI2ZmZjsjZmZmOyNmZmY7I2ZmZjsjZmZmJyxcbiAgICB0YWdfYm94X2ZvbnRfZmFtaWx5OiAnSGVsdmV0aWNhTmV1ZSxIZWx2ZXRpY2EsQXJpYWwsc2Fucy1zZXJpZicsXG4gICAgdGFnc19iZ19jc3M6ICcnLFxuICAgIGlnbm9yZV9zdWJkb21haW46IGZhbHNlLFxuICAgIC8vdGhlIHNjb3BlIGluIHdoaWNoIHRvIGZpbmQgcGFyZW50cyBvZiA8YnI+IHRhZ3MuXG4gICAgLy9UaG9zZSBwYXJlbnRzIHdpbGwgYmUgY29udmVydGVkIHRvIGEgPHJ0PiBibG9jaywgc28gdGhlcmUgd29uJ3QgYmUgbmVzdGVkIDxwPiBibG9ja3MuXG4gICAgLy90aGVuIGl0IHdpbGwgc3BsaXQgdGhlIHBhcmVudCdzIGh0bWwgb24gPGJyPiB0YWdzIGFuZCB3cmFwIHRoZSBzZWN0aW9ucyBpbiA8cD4gdGFncy5cblxuICAgIC8vZXhhbXBsZTpcbiAgICAvLyBicl9yZXBsYWNlX3Njb3BlX3NlbGVjdG9yOiBcIi5hbnRfYnJfcmVwbGFjZVwiIC8vZS5nLiBcIiNtYWluc2VjdGlvblwiIG9yIFwicFwiXG5cbiAgICBicl9yZXBsYWNlX3Njb3BlX3NlbGVjdG9yOiBudWxsIC8vZS5nLiBcIiNtYWluc2VjdGlvblwiIG9yIFwicFwiXG59O1xuXG5mdW5jdGlvbiBjcmVhdGVGcm9tSlNPTihqc29uKSB7XG5cbiAgICBmdW5jdGlvbiBkYXRhKGtleSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgdmFsdWUgPSB3aW5kb3cuYW50ZW5uYV9leHRlbmRba2V5XTtcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IGpzb25ba2V5XTtcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCB8fCB2YWx1ZSA9PT0gJycpIHsgLy8gVE9ETzogU2hvdWxkIHRoZSBzZXJ2ZXIgYmUgc2VuZGluZyBiYWNrICcnIGhlcmUgb3Igbm90aGluZyBhdCBhbGw/IChJdCBwcmVjbHVkZXMgdGhlIHNlcnZlciBmcm9tIHJlYWxseSBzYXlpbmcgJ25vdGhpbmcnKVxuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IGRlZmF1bHRzW2tleV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGJhY2tncm91bmRDb2xvcihhY2Nlc3Nvcikge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgY29sb3JzID0gW107XG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBhY2Nlc3NvcigpO1xuICAgICAgICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgY29sb3JzID0gdmFsdWUuc3BsaXQoJzsnKTtcbiAgICAgICAgICAgICAgICBjb2xvcnMgPSBtaWdyYXRlVmFsdWVzKGNvbG9ycyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gY29sb3JzO1xuXG4gICAgICAgICAgICAvLyBNaWdyYXRlIGFueSBjb2xvcnMgZnJvbSB0aGUgJzEsIDIsIDMnIGZvcm1hdCB0byAncmdiKDEsIDIsIDMpJy4gVGhpcyBjb2RlIGNhbiBiZSBkZWxldGVkIG9uY2Ugd2UndmUgdXBkYXRlZFxuICAgICAgICAgICAgLy8gYWxsIHNpdGVzIHRvIHNwZWNpZnlpbmcgdmFsaWQgQ1NTIGNvbG9yIHZhbHVlc1xuICAgICAgICAgICAgZnVuY3Rpb24gbWlncmF0ZVZhbHVlcyhjb2xvclZhbHVlcykge1xuICAgICAgICAgICAgICAgIHZhciBtaWdyYXRpb25NYXRjaGVyID0gL15cXHMqXFxkK1xccyosXFxzKlxcZCtcXHMqLFxccypcXGQrXFxzKiQvZ2ltO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY29sb3JWYWx1ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gY29sb3JWYWx1ZXNbaV07XG4gICAgICAgICAgICAgICAgICAgIGlmIChtaWdyYXRpb25NYXRjaGVyLnRlc3QodmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xvclZhbHVlc1tpXSA9ICdyZ2IoJyArIHZhbHVlICsgJyknO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBjb2xvclZhbHVlcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRlZmF1bHRSZWFjdGlvbnMoJGVsZW1lbnQpIHtcbiAgICAgICAgLy8gRGVmYXVsdCByZWFjdGlvbnMgYXJlIGF2YWlsYWJsZSBpbiB0aHJlZSBsb2NhdGlvbnMgaW4gdGhyZWUgZGF0YSBmb3JtYXRzOlxuICAgICAgICAvLyAxLiBBcyBhIGNvbW1hLXNlcGFyYXRlZCBhdHRyaWJ1dGUgdmFsdWUgb24gYSBwYXJ0aWN1bGFyIGVsZW1lbnRcbiAgICAgICAgLy8gMi4gQXMgYW4gYXJyYXkgb2Ygc3RyaW5ncyBvbiB0aGUgd2luZG93LmFudGVubmFfZXh0ZW5kIHByb3BlcnR5XG4gICAgICAgIC8vIDMuIEFzIGEganNvbiBvYmplY3Qgd2l0aCBhIGJvZHkgYW5kIGlkIG9uIHRoZSBncm91cCBzZXR0aW5nc1xuICAgICAgICB2YXIgcmVhY3Rpb25zID0gW107XG4gICAgICAgIHZhciByZWFjdGlvblN0cmluZ3M7XG4gICAgICAgIHZhciBlbGVtZW50UmVhY3Rpb25zID0gJGVsZW1lbnQgPyAkZWxlbWVudC5hdHRyKCdhbnQtcmVhY3Rpb25zJykgOiB1bmRlZmluZWQ7XG4gICAgICAgIGlmIChlbGVtZW50UmVhY3Rpb25zKSB7XG4gICAgICAgICAgICByZWFjdGlvblN0cmluZ3MgPSBlbGVtZW50UmVhY3Rpb25zLnNwbGl0KCc7Jyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZWFjdGlvblN0cmluZ3MgPSB3aW5kb3cuYW50ZW5uYV9leHRlbmRbJ2RlZmF1bHRfcmVhY3Rpb25zJ107XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJlYWN0aW9uU3RyaW5ncykge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZWFjdGlvblN0cmluZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICByZWFjdGlvbnMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIHRleHQ6IHJlYWN0aW9uU3RyaW5nc1tpXVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgdmFsdWVzID0ganNvblsnZGVmYXVsdF9yZWFjdGlvbnMnXTtcbiAgICAgICAgICAgIGlmICh2YWx1ZXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdmFsdWVzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9IHZhbHVlc1tqXTtcbiAgICAgICAgICAgICAgICAgICAgcmVhY3Rpb25zLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogdmFsdWUuYm9keSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkOiB2YWx1ZS5pZFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlYWN0aW9ucztcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBncm91cElkOiBkYXRhKCdpZCcpLFxuICAgICAgICBhY3RpdmVTZWN0aW9uczogZGF0YSgnYWN0aXZlX3NlY3Rpb25zJyksXG4gICAgICAgIHVybDoge1xuICAgICAgICAgICAgaWdub3JlU3ViZG9tYWluOiBkYXRhKCdpZ25vcmVfc3ViZG9tYWluJyksXG4gICAgICAgICAgICBjYW5vbmljYWxEb21haW46IGRhdGEoJ3BhZ2VfdGxkJykgLy8gVE9ETzogd2hhdCB0byBjYWxsIHRoaXMgZXhhY3RseS4gZ3JvdXBEb21haW4/IHNpdGVEb21haW4/IGNhbm9uaWNhbERvbWFpbj9cbiAgICAgICAgfSxcbiAgICAgICAgc3VtbWFyeVNlbGVjdG9yOiBkYXRhKCdzdW1tYXJ5X3dpZGdldF9zZWxlY3RvcicpLFxuICAgICAgICBzdW1tYXJ5TWV0aG9kOiBkYXRhKCdzdW1tYXJ5X3dpZGdldF9tZXRob2QnKSxcbiAgICAgICAgcGFnZVNlbGVjdG9yOiBkYXRhKCdwb3N0X3NlbGVjdG9yJyksXG4gICAgICAgIHBhZ2VIcmVmU2VsZWN0b3I6IGRhdGEoJ3Bvc3RfaHJlZl9zZWxlY3RvcicpLFxuICAgICAgICB0ZXh0U2VsZWN0b3I6IGRhdGEoJ2Fubm9fd2hpdGVsaXN0JyksXG4gICAgICAgIGltYWdlU2VsZWN0b3I6IGRhdGEoJ2ltZ19zZWxlY3RvcicpLFxuICAgICAgICBkZWZhdWx0UmVhY3Rpb25zOiBkZWZhdWx0UmVhY3Rpb25zLFxuICAgICAgICByZWFjdGlvbkJhY2tncm91bmRDb2xvcnM6IGJhY2tncm91bmRDb2xvcihkYXRhKCd0YWdfYm94X2JnX2NvbG9ycycpKVxuICAgIH1cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZTogY3JlYXRlRnJvbUpTT05cbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgUmVhY3Rpb25zV2lkZ2V0ID0gcmVxdWlyZSgnLi9yZWFjdGlvbnMtd2lkZ2V0Jyk7XG5cblxuZnVuY3Rpb24gY3JlYXRlSW5kaWNhdG9yV2lkZ2V0KG9wdGlvbnMpIHtcbiAgICAvLyBUT0RPOiB2YWxpZGF0ZSB0aGF0IG9wdGlvbnMgY29udGFpbnMgYWxsIHJlcXVpcmVkIHByb3BlcnRpZXMgKGFwcGxpZXMgdG8gYWxsIHdpZGdldHMpLlxuICAgIHZhciBlbGVtZW50ID0gb3B0aW9ucy5lbGVtZW50O1xuICAgIHZhciBjb250YWluZXJEYXRhID0gb3B0aW9ucy5jb250YWluZXJEYXRhO1xuICAgIHZhciAkY29udGFpbmVyRWxlbWVudCA9IG9wdGlvbnMuY29udGFpbmVyRWxlbWVudDtcbiAgICB2YXIgcGFnZURhdGEgPSBvcHRpb25zLnBhZ2VEYXRhO1xuICAgIHZhciBncm91cFNldHRpbmdzID0gb3B0aW9ucy5ncm91cFNldHRpbmdzO1xuICAgIHZhciBkZWZhdWx0UmVhY3Rpb25zID0gb3B0aW9ucy5kZWZhdWx0UmVhY3Rpb25zO1xuICAgIHZhciBjb29yZHMgPSBvcHRpb25zLmNvb3JkcztcbiAgICB2YXIgaW1hZ2VVcmwgPSBvcHRpb25zLmltYWdlVXJsO1xuICAgIHZhciBpbWFnZURpbWVuc2lvbnMgPSBvcHRpb25zLmltYWdlRGltZW5zaW9ucztcbiAgICB2YXIgcmFjdGl2ZSA9IFJhY3RpdmUoe1xuICAgICAgICBlbDogZWxlbWVudCxcbiAgICAgICAgYXBwZW5kOiB0cnVlLFxuICAgICAgICBtYWdpYzogdHJ1ZSxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgY29udGFpbmVyRGF0YTogY29udGFpbmVyRGF0YVxuICAgICAgICB9LFxuICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL2ltYWdlLWluZGljYXRvci13aWRnZXQuaGJzLmh0bWwnKVxuICAgIH0pO1xuXG4gICAgdmFyIHJlYWN0aW9uV2lkZ2V0T3B0aW9ucyA9IHtcbiAgICAgICAgcmVhY3Rpb25zRGF0YTogY29udGFpbmVyRGF0YS5yZWFjdGlvbnMsXG4gICAgICAgIGNvbnRhaW5lckRhdGE6IGNvbnRhaW5lckRhdGEsXG4gICAgICAgIGNvbnRhaW5lckVsZW1lbnQ6ICRjb250YWluZXJFbGVtZW50LFxuICAgICAgICBjb250ZW50RGF0YToge1xuICAgICAgICAgICAgdHlwZTogJ2ltZycsXG4gICAgICAgICAgICBib2R5OiBpbWFnZVVybCxcbiAgICAgICAgICAgIGRpbWVuc2lvbnM6IGltYWdlRGltZW5zaW9uc1xuICAgICAgICB9LFxuICAgICAgICBkZWZhdWx0UmVhY3Rpb25zOiBkZWZhdWx0UmVhY3Rpb25zLFxuICAgICAgICBwYWdlRGF0YTogcGFnZURhdGEsXG4gICAgICAgIGdyb3VwU2V0dGluZ3M6IGdyb3VwU2V0dGluZ3NcbiAgICB9O1xuXG4gICAgdmFyIGhvdmVyVGltZW91dDtcbiAgICB2YXIgYWN0aXZlVGltZW91dDtcblxuICAgIHZhciAkcm9vdEVsZW1lbnQgPSAkKHJvb3RFbGVtZW50KHJhY3RpdmUpKTtcbiAgICAvLyBUT0RPOiBGaW5pc2ggdGhlIHBvc2l0aW9uaW5nIHBpZWNlLiBJdCdzIGN1cnJlbnRseSB0cmVhdGluZyAndG9wJyBtb3JlIGxpa2UgJ2JvdHRvbVxuICAgICRyb290RWxlbWVudC5jc3Moe1xuICAgICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcbiAgICAgICAgdG9wOiBjb29yZHMudG9wID8gKGNvb3Jkcy50b3AgLSAkcm9vdEVsZW1lbnQub3V0ZXJIZWlnaHQoKSkgOiB1bmRlZmluZWQsXG4gICAgICAgIGJvdHRvbTogY29vcmRzLmJvdHRvbSxcbiAgICAgICAgbGVmdDogY29vcmRzLmxlZnQsXG4gICAgICAgIHJpZ2h0OiBjb29yZHMucmlnaHRcbiAgICB9KTtcbiAgICAkcm9vdEVsZW1lbnQub24oJ21vdXNlZW50ZXIuYW50ZW5uYScsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGlmIChldmVudC5idXR0b25zICE9PSAwKSB7XG4gICAgICAgICAgICAvLyBEb24ndCByZWFjdCBpZiB0aGUgdXNlciBpcyBkcmFnZ2luZyBvciBzZWxlY3RpbmcgdGV4dC5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY29udGFpbmVyRGF0YS5yZWFjdGlvbnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgb3BlblJlYWN0aW9uc1dpbmRvdyhyZWFjdGlvbldpZGdldE9wdGlvbnMsIHJhY3RpdmUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KGhvdmVyVGltZW91dCk7XG4gICAgICAgICAgICBob3ZlclRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIG9wZW5SZWFjdGlvbnNXaW5kb3cocmVhY3Rpb25XaWRnZXRPcHRpb25zLCByYWN0aXZlKTtcbiAgICAgICAgICAgIH0sIDIwMCk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICAkcm9vdEVsZW1lbnQub24oJ21vdXNlbGVhdmUuYW50ZW5uYScsIGZ1bmN0aW9uKCkge1xuICAgICAgICBjbGVhclRpbWVvdXQoaG92ZXJUaW1lb3V0KTtcbiAgICAgICAgY2xlYXJUaW1lb3V0KGFjdGl2ZVRpbWVvdXQpO1xuICAgIH0pO1xuICAgICRjb250YWluZXJFbGVtZW50Lm9uKCdtb3VzZWVudGVyLmFudGVubmEnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KGFjdGl2ZVRpbWVvdXQpO1xuICAgICAgICAgICAgYWN0aXZlVGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgJHJvb3RFbGVtZW50LmFkZENsYXNzKCdhY3RpdmUnKTtcbiAgICAgICAgICAgIH0sIDUwMCk7XG4gICAgfSk7XG4gICAgJGNvbnRhaW5lckVsZW1lbnQub24oJ21vdXNlbGVhdmUuYW50ZW5uYScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAkcm9vdEVsZW1lbnQucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiByb290RWxlbWVudChyYWN0aXZlKSB7XG4gICAgcmV0dXJuIHJhY3RpdmUuZmluZCgnLmFudGVubmEtaW1hZ2UtaW5kaWNhdG9yLXdpZGdldCcpO1xufVxuXG5mdW5jdGlvbiBvcGVuUmVhY3Rpb25zV2luZG93KHJlYWN0aW9uT3B0aW9ucywgcmFjdGl2ZSkge1xuICAgIFJlYWN0aW9uc1dpZGdldC5vcGVuKHJlYWN0aW9uT3B0aW9ucywgcm9vdEVsZW1lbnQocmFjdGl2ZSkpO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlOiBjcmVhdGVJbmRpY2F0b3JXaWRnZXRcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgUG9wdXBXaWRnZXQgPSByZXF1aXJlKCcuL3BvcHVwLXdpZGdldCcpO1xudmFyIFJlYWN0aW9uc1dpZGdldCA9IHJlcXVpcmUoJy4vcmVhY3Rpb25zLXdpZGdldCcpO1xudmFyIFJhbmdlID0gcmVxdWlyZSgnLi91dGlscy9yYW5nZScpO1xuXG5cbmZ1bmN0aW9uIGNyZWF0ZUluZGljYXRvcldpZGdldChvcHRpb25zKSB7XG4gICAgdmFyIGVsZW1lbnQgPSBvcHRpb25zLmVsZW1lbnQ7XG4gICAgdmFyIGNvbnRhaW5lckRhdGEgPSBvcHRpb25zLmNvbnRhaW5lckRhdGE7XG4gICAgdmFyICRjb250YWluZXJFbGVtZW50ID0gb3B0aW9ucy5jb250YWluZXJFbGVtZW50O1xuICAgIHZhciBwYWdlRGF0YSA9IG9wdGlvbnMucGFnZURhdGE7XG4gICAgdmFyIGdyb3VwU2V0dGluZ3MgPSBvcHRpb25zLmdyb3VwU2V0dGluZ3M7XG4gICAgdmFyIGRlZmF1bHRSZWFjdGlvbnMgPSBvcHRpb25zLmRlZmF1bHRSZWFjdGlvbnM7XG4gICAgdmFyIGNvb3JkcyA9IG9wdGlvbnMuY29vcmRzO1xuICAgIHZhciByYWN0aXZlID0gUmFjdGl2ZSh7XG4gICAgICAgIGVsOiBlbGVtZW50LFxuICAgICAgICBhcHBlbmQ6IHRydWUsXG4gICAgICAgIG1hZ2ljOiB0cnVlLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICBjb250YWluZXJEYXRhOiBjb250YWluZXJEYXRhXG4gICAgICAgIH0sXG4gICAgICAgIHRlbXBsYXRlOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvaW5kaWNhdG9yLXdpZGdldC5oYnMuaHRtbCcpXG4gICAgfSk7XG5cbiAgICB2YXIgcmVhY3Rpb25XaWRnZXRPcHRpb25zID0ge1xuICAgICAgICByZWFjdGlvbnNEYXRhOiBjb250YWluZXJEYXRhLnJlYWN0aW9ucyxcbiAgICAgICAgY29udGFpbmVyRGF0YTogY29udGFpbmVyRGF0YSxcbiAgICAgICAgY29udGFpbmVyRWxlbWVudDogJGNvbnRhaW5lckVsZW1lbnQsXG4gICAgICAgIGNvbnRlbnREYXRhOiB7IHR5cGU6ICd0ZXh0JyB9LFxuICAgICAgICBkZWZhdWx0UmVhY3Rpb25zOiBkZWZhdWx0UmVhY3Rpb25zLFxuICAgICAgICBwYWdlRGF0YTogcGFnZURhdGEsXG4gICAgICAgIGdyb3VwU2V0dGluZ3M6IGdyb3VwU2V0dGluZ3NcbiAgICB9O1xuXG4gICAgdmFyICRyb290RWxlbWVudCA9ICQocm9vdEVsZW1lbnQocmFjdGl2ZSkpO1xuICAgIGlmIChjb29yZHMpIHtcbiAgICAgICAgJHJvb3RFbGVtZW50LmNzcyh7XG4gICAgICAgICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcbiAgICAgICAgICAgIHRvcDogY29vcmRzLnRvcCAtICRyb290RWxlbWVudC5oZWlnaHQoKSxcbiAgICAgICAgICAgIGJvdHRvbTogY29vcmRzLmJvdHRvbSxcbiAgICAgICAgICAgIGxlZnQ6IGNvb3Jkcy5sZWZ0LFxuICAgICAgICAgICAgcmlnaHQ6IGNvb3Jkcy5yaWdodCxcbiAgICAgICAgICAgICd6LWluZGV4JzogMTAwMCAvLyBUT0RPOiBjb21wdXRlIGEgcmVhbCB2YWx1ZT9cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHZhciBob3ZlclRpbWVvdXQ7XG4gICAgJHJvb3RFbGVtZW50Lm9uKCdtb3VzZWVudGVyLmFudGVubmEnLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBpZiAoZXZlbnQuYnV0dG9ucyAhPT0gMCkge1xuICAgICAgICAgICAgLy8gRG9uJ3QgcmVhY3QgaWYgdGhlIHVzZXIgaXMgZHJhZ2dpbmcgb3Igc2VsZWN0aW5nIHRleHQuXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY2xlYXJUaW1lb3V0KGhvdmVyVGltZW91dCk7IC8vIG9ubHkgb25lIHRpbWVvdXQgYXQgYSB0aW1lXG4gICAgICAgIGhvdmVyVGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAoY29udGFpbmVyRGF0YS5yZWFjdGlvbnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIG9wZW5SZWFjdGlvbnNXaW5kb3cocmVhY3Rpb25XaWRnZXRPcHRpb25zLCByYWN0aXZlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFyICRpY29uID0gJChyb290RWxlbWVudChyYWN0aXZlKSkuZmluZCgnLmFudC1hbnRlbm5hLWxvZ28nKTtcbiAgICAgICAgICAgICAgICB2YXIgb2Zmc2V0ID0gJGljb24ub2Zmc2V0KCk7XG4gICAgICAgICAgICAgICAgdmFyIGNvb3JkaW5hdGVzID0ge1xuICAgICAgICAgICAgICAgICAgICB0b3A6IG9mZnNldC50b3AgKyBNYXRoLmZsb29yKCRpY29uLmhlaWdodCgpIC8gMiksIC8vIFRPRE8gdGhpcyBudW1iZXIgaXMgYSBsaXR0bGUgb2ZmIGJlY2F1c2UgdGhlIGRpdiBkb2Vzbid0IHRpZ2h0bHkgd3JhcCB0aGUgaW5zZXJ0ZWQgZm9udCBjaGFyYWN0ZXJcbiAgICAgICAgICAgICAgICAgICAgbGVmdDogb2Zmc2V0LmxlZnQgKyBNYXRoLmZsb29yKCRpY29uLndpZHRoKCkgLyAyKVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgUG9wdXBXaWRnZXQuc2hvdyhjb29yZGluYXRlcywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIG9wZW5SZWFjdGlvbnNXaW5kb3cocmVhY3Rpb25XaWRnZXRPcHRpb25zLCByYWN0aXZlKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgMjAwKTtcbiAgICB9KTtcbiAgICAkcm9vdEVsZW1lbnQub24oJ21vdXNlbGVhdmUuYW50ZW5uYScsIGZ1bmN0aW9uKCkge1xuICAgICAgICBjbGVhclRpbWVvdXQoaG92ZXJUaW1lb3V0KTtcbiAgICB9KTtcbiAgICAkY29udGFpbmVyRWxlbWVudC5vbignbW91c2VlbnRlci5hbnRlbm5hJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICRyb290RWxlbWVudC5hZGRDbGFzcygnYWN0aXZlJyk7XG4gICAgfSk7XG4gICAgJGNvbnRhaW5lckVsZW1lbnQub24oJ21vdXNlbGVhdmUuYW50ZW5uYScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAkcm9vdEVsZW1lbnQucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiByb290RWxlbWVudChyYWN0aXZlKSB7XG4gICAgcmV0dXJuIHJhY3RpdmUuZmluZCgnLmFudGVubmEtaW5kaWNhdG9yLXdpZGdldCcpO1xufVxuXG5mdW5jdGlvbiBvcGVuUmVhY3Rpb25zV2luZG93KHJlYWN0aW9uT3B0aW9ucywgcmFjdGl2ZSkge1xuICAgIFJlYWN0aW9uc1dpZGdldC5vcGVuKHJlYWN0aW9uT3B0aW9ucywgcm9vdEVsZW1lbnQocmFjdGl2ZSkpO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlOiBjcmVhdGVJbmRpY2F0b3JXaWRnZXRcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgUGFnZVV0aWxzID0gcmVxdWlyZSgnLi91dGlscy9wYWdlLXV0aWxzJyk7XG52YXIgUGFnZURhdGEgPSByZXF1aXJlKCcuL3BhZ2UtZGF0YScpO1xuXG5cbmZ1bmN0aW9uIGNvbXB1dGVQYWdlVGl0bGUoKSB7XG4gICAgLy8gVE9ETzogSG93IGFyZSBwYWdlIHRpdGxlcyBjb21wdXRlZCB3aXRoIG11bHRpcGxlIHBhZ2VzPyBUaGUgY29kZSBiZWxvdyBjb21wdXRlcyB0aGUgdGl0bGUgZm9yIGEgdG9wLWxldmVsIHBhZ2UuXG4gICAgdmFyIHRpdGxlID0gJCgnbWV0YVtwcm9wZXJ0eT1cIm9nOnRpdGxlXCJdJykuYXR0cignY29udGVudCcpO1xuICAgIGlmICghdGl0bGUpIHtcbiAgICAgICAgdGl0bGUgPSAkKCd0aXRsZScpLnRleHQoKSB8fCAnJztcbiAgICB9XG4gICAgcmV0dXJuICQudHJpbSh0aXRsZSk7XG59XG5cblxuLy8gQ29tcHV0ZSB0aGUgcGFnZXMgdGhhdCB3ZSBuZWVkIHRvIGZldGNoLiBUaGlzIGlzIGVpdGhlcjpcbi8vIDEuIEFueSBuZXN0ZWQgcGFnZXMgd2UgZmluZCB1c2luZyB0aGUgcGFnZSBzZWxlY3RvciBPUlxuLy8gMi4gVGhlIGN1cnJlbnQgd2luZG93IGxvY2F0aW9uXG5mdW5jdGlvbiBjb21wdXRlUGFnZXNQYXJhbShncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIHBhZ2VzID0gW107XG5cbiAgICB2YXIgZ3JvdXBJZCA9IGdyb3VwU2V0dGluZ3MuZ3JvdXBJZCgpO1xuICAgIHZhciAkcGFnZUVsZW1lbnRzID0gJChncm91cFNldHRpbmdzLnBhZ2VTZWxlY3RvcigpKTtcbiAgICAvLyBUT0RPOiBDb21wYXJlIHRoaXMgZXhlY3V0aW9uIGZsb3cgdG8gd2hhdCBoYXBwZW5zIGluIGVuZ2FnZV9mdWxsLmpzLiBIZXJlIHdlIHRyZWF0IHRoZSBib2R5IGVsZW1lbnQgYXMgYSBwYWdlIHNvXG4gICAgLy8gdGhlIGZsb3cgaXMgdGhlIHNhbWUgZm9yIGJvdGggY2FzZXMuIElzIHRoZXJlIGEgcmVhc29uIGVuZ2FnZV9mdWxsLmpzIGJyYW5jaGVzIGhlcmUgaW5zdGVhZCBhbmQgdHJlYXRzIHRoZXNlIHNvIGRpZmZlcmVudGx5P1xuICAgIGlmICgkcGFnZUVsZW1lbnRzLmxlbmd0aCA9PSAwKSB7XG4gICAgICAgICRwYWdlRWxlbWVudHMgPSAkKCdib2R5Jyk7XG4gICAgfVxuICAgICRwYWdlRWxlbWVudHMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRwYWdlRWxlbWVudCA9ICQodGhpcyk7XG4gICAgICAgIHBhZ2VzLnB1c2goe1xuICAgICAgICAgICAgZ3JvdXBfaWQ6IGdyb3VwSWQsXG4gICAgICAgICAgICB1cmw6IFBhZ2VVdGlscy5jb21wdXRlQ2Fub25pY2FsVXJsKCRwYWdlRWxlbWVudCwgZ3JvdXBTZXR0aW5ncylcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gcGFnZXM7XG59XG5cbmZ1bmN0aW9uIGxvYWRQYWdlRGF0YShncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIHBhZ2VzUGFyYW0gPSBjb21wdXRlUGFnZXNQYXJhbShncm91cFNldHRpbmdzKTtcbiAgICAkLmdldEpTT05QKCcvYXBpL3BhZ2VuZXcnLCB7IHBhZ2VzOiBwYWdlc1BhcmFtIH0sIHN1Y2Nlc3MsIGVycm9yKTtcblxuICAgIGZ1bmN0aW9uIHN1Y2Nlc3MoanNvbikge1xuICAgICAgICAvLyBUT0RPOiBpZiB0aGUgcGFnZSBkYXRhIGluZGljYXRlcyB0aGF0IHRoZSBzZXJ2ZXIgZG9lc24ndCBrbm93IGFib3V0IHRoZSBwYWdlIHlldCwgY29tcHV0ZSB0aGUgcGFnZSB0aXRsZSBhbmQgaW1hZ2VcbiAgICAgICAgLy8gICAgICAgYW5kIHNlbmQgdGhlbSB0byB0aGUgc2VydmVyLiAodXNlIGNvbXB1dGVQYWdlVGl0bGUoKSlcbiAgICAgICAgUGFnZURhdGEudXBkYXRlQWxsUGFnZURhdGEoanNvbiwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZXJyb3IobWVzc2FnZSkge1xuICAgICAgICAvLyBUT0RPIGhhbmRsZSBlcnJvcnMgdGhhdCBoYXBwZW4gd2hlbiBsb2FkaW5nIHBhZ2UgZGF0YVxuICAgIH1cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGxvYWQ6IGxvYWRQYWdlRGF0YVxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi91dGlscy9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcblxudmFyIHBhZ2VzID0ge307XG5cbmZ1bmN0aW9uIGdldFBhZ2VEYXRhKGhhc2gpIHtcbiAgICB2YXIgcGFnZURhdGEgPSBwYWdlc1toYXNoXTtcbiAgICBpZiAoIXBhZ2VEYXRhKSB7XG4gICAgICAgIC8vIFRPRE86IEdpdmUgdGhpcyBzZXJpb3VzIHRob3VnaHQuIEluIG9yZGVyIGZvciBtYWdpYyBtb2RlIHRvIHdvcmssIHRoZSBvYmplY3QgbmVlZHMgdG8gaGF2ZSB2YWx1ZXMgaW4gcGxhY2UgZm9yXG4gICAgICAgIC8vIHRoZSBvYnNlcnZlZCBwcm9wZXJ0aWVzIGF0IHRoZSBtb21lbnQgdGhlIHJhY3RpdmUgaXMgY3JlYXRlZC4gQnV0IHRoaXMgaXMgcHJldHR5IHVudXN1YWwgZm9yIEphdmFzY3JpcHQsIHRvIGhhdmVcbiAgICAgICAgLy8gdG8gZGVmaW5lIHRoZSB3aG9sZSBza2VsZXRvbiBmb3IgdGhlIG9iamVjdCBpbnN0ZWFkIG9mIGp1c3QgYWRkaW5nIHByb3BlcnRpZXMgd2hlbmV2ZXIgeW91IHdhbnQuXG4gICAgICAgIC8vIFRoZSBhbHRlcm5hdGl2ZSB3b3VsZCBiZSBmb3IgdXMgdG8ga2VlcCBvdXIgb3duIFwiZGF0YSBiaW5kaW5nXCIgYmV0d2VlbiB0aGUgcGFnZURhdGEgYW5kIHJhY3RpdmUgaW5zdGFuY2VzICgxIHRvIG1hbnkpXG4gICAgICAgIC8vIGFuZCB0ZWxsIHRoZSByYWN0aXZlcyB0byB1cGRhdGUgd2hlbmV2ZXIgdGhlIGRhdGEgY2hhbmdlcy5cbiAgICAgICAgcGFnZURhdGEgPSB7XG4gICAgICAgICAgICBwYWdlSGFzaDogaGFzaCxcbiAgICAgICAgICAgIHN1bW1hcnlSZWFjdGlvbnM6IHt9LFxuICAgICAgICAgICAgc3VtbWFyeVRvdGFsOiAwLCAvLyBUT0RPIGNvbnNpZGVyIGZvbGRpbmcgdGhpcyBpbnRvIHN1bW1hcnlSZWFjdGlvbnNcbiAgICAgICAgICAgIGNvbnRhaW5lcnM6IHt9XG4gICAgICAgIH07XG4gICAgICAgIHBhZ2VzW2hhc2hdID0gcGFnZURhdGE7XG4gICAgfVxuICAgIHJldHVybiBwYWdlRGF0YTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlQWxsUGFnZURhdGEoanNvblBhZ2VzLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGFsbFBhZ2VzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBqc29uUGFnZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgYWxsUGFnZXMucHVzaCh1cGRhdGVQYWdlRGF0YShqc29uUGFnZXNbaV0sIGdyb3VwU2V0dGluZ3MpKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZVBhZ2VEYXRhKGpzb24sIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgcGFnZUhhc2ggPSBqc29uLnBhZ2VIYXNoO1xuICAgIHZhciBwYWdlRGF0YSA9IGdldFBhZ2VEYXRhKHBhZ2VIYXNoKTtcblxuICAgIC8vIFRPRE86IENhbiB3ZSBnZXQgYXdheSB3aXRoIGp1c3Qgc2V0dGluZyBwYWdlRGF0YSA9IGpzb24gd2l0aG91dCBicmVha2luZyBSYWN0aXZlJ3MgZGF0YSBiaW5kaW5nP1xuICAgIHZhciBzdW1tYXJ5UmVhY3Rpb25zID0ganNvbi5zdW1tYXJ5UmVhY3Rpb25zO1xuICAgIHBhZ2VEYXRhLnN1bW1hcnlSZWFjdGlvbnMgPSBzdW1tYXJ5UmVhY3Rpb25zO1xuICAgIHNldENvbnRhaW5lcnMocGFnZURhdGEsIGpzb24uY29udGFpbmVycyk7XG5cbiAgICAvLyBXZSBhZGQgdXAgdGhlIHN1bW1hcnkgcmVhY3Rpb24gdG90YWwgY2xpZW50LXNpZGVcbiAgICB2YXIgdG90YWwgPSAwO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3VtbWFyeVJlYWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICB0b3RhbCA9IHRvdGFsICsgc3VtbWFyeVJlYWN0aW9uc1tpXS5jb3VudDtcbiAgICB9XG4gICAgcGFnZURhdGEuc3VtbWFyeVRvdGFsID0gdG90YWw7XG5cbiAgICAvLyBXZSBhZGQgdXAgdGhlIGNvbnRhaW5lciByZWFjdGlvbiB0b3RhbHMgY2xpZW50LXNpZGVcbiAgICB2YXIgdG90YWwgPSAwO1xuICAgIHZhciBjb250YWluZXJzID0gcGFnZURhdGEuY29udGFpbmVycztcbiAgICBmb3IgKHZhciBoYXNoIGluIGNvbnRhaW5lcnMpIHtcbiAgICAgICAgaWYgKGNvbnRhaW5lcnMuaGFzT3duUHJvcGVydHkoaGFzaCkpIHtcbiAgICAgICAgICAgIHZhciBjb250YWluZXIgPSBjb250YWluZXJzW2hhc2hdO1xuICAgICAgICAgICAgdmFyIHRvdGFsID0gMDtcbiAgICAgICAgICAgIHZhciBjb250YWluZXJSZWFjdGlvbnMgPSBjb250YWluZXIucmVhY3Rpb25zO1xuICAgICAgICAgICAgaWYgKGNvbnRhaW5lclJlYWN0aW9ucykge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY29udGFpbmVyUmVhY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHRvdGFsID0gdG90YWwgKyBjb250YWluZXJSZWFjdGlvbnNbaV0uY291bnQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29udGFpbmVyLnJlYWN0aW9uVG90YWwgPSB0b3RhbDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIFRPRE8gQ29uc2lkZXIgc3VwcG9ydGluZyBpbmNyZW1lbnRhbCB1cGRhdGUgb2YgZGF0YSB0aGF0IHdlIGFscmVhZHkgaGF2ZSBmcm9tIHRoZSBzZXJ2ZXIuIFRoYXQgd291bGQgbWVhbiBvbmx5XG4gICAgLy8gdXBkYXRpbmcgZmllbGRzIGluIHRoZSBsb2NhbCBvYmplY3QgaWYgdGhleSBleGlzdCBpbiB0aGUganNvbiBkYXRhLlxuICAgIHBhZ2VEYXRhLmdyb3VwSWQgPSBncm91cFNldHRpbmdzLmdyb3VwSWQoKTtcbiAgICBwYWdlRGF0YS5wYWdlSWQgPSBqc29uLmlkO1xuICAgIHBhZ2VEYXRhLnBhZ2VIYXNoID0gcGFnZUhhc2g7XG5cbiAgICByZXR1cm4gcGFnZURhdGE7XG59XG5cbmZ1bmN0aW9uIGdldENvbnRhaW5lckRhdGEocGFnZURhdGEsIGNvbnRhaW5lckhhc2gpIHtcbiAgICB2YXIgY29udGFpbmVyRGF0YSA9IHBhZ2VEYXRhLmNvbnRhaW5lcnNbY29udGFpbmVySGFzaF07XG4gICAgaWYgKCFjb250YWluZXJEYXRhKSB7XG4gICAgICAgIGNvbnRhaW5lckRhdGEgPSB7XG4gICAgICAgICAgICBoYXNoOiBjb250YWluZXJIYXNoLFxuICAgICAgICAgICAgcmVhY3Rpb25Ub3RhbDogMCxcbiAgICAgICAgICAgIHJlYWN0aW9uczogW11cbiAgICAgICAgfTtcbiAgICAgICAgcGFnZURhdGEuY29udGFpbmVyc1tjb250YWluZXJIYXNoXSA9IGNvbnRhaW5lckRhdGE7XG4gICAgfVxuICAgIHJldHVybiBjb250YWluZXJEYXRhO1xufVxuXG4vLyBNZXJnZSB0aGUgZ2l2ZW4gY29udGFpbmVyIGRhdGEgaW50byB0aGUgcGFnZURhdGEuY29udGFpbmVycyBkYXRhLiBUaGlzIGlzIG5lY2Vzc2FyeSBiZWNhdXNlIHRoZSBza2VsZXRvbiBvZiB0aGUgcGFnZURhdGEuY29udGFpbmVycyBtYXBcbi8vIGlzIHNldCB1cCBhbmQgYm91bmQgdG8gdGhlIFVJIGJlZm9yZSBhbGwgdGhlIGRhdGEgaXMgZmV0Y2hlZCBmcm9tIHRoZSBzZXJ2ZXIgYW5kIHdlIGRvbid0IHdhbnQgdG8gYnJlYWsgdGhlIGRhdGEgYmluZGluZy5cbmZ1bmN0aW9uIHNldENvbnRhaW5lcnMocGFnZURhdGEsIGNvbnRhaW5lcnMpIHtcbiAgICBmb3IgKHZhciBoYXNoIGluIGNvbnRhaW5lcnMpIHtcbiAgICAgICAgaWYgKGNvbnRhaW5lcnMuaGFzT3duUHJvcGVydHkoaGFzaCkpIHtcbiAgICAgICAgICAgIHZhciBjb250YWluZXJEYXRhID0gZ2V0Q29udGFpbmVyRGF0YShwYWdlRGF0YSwgaGFzaCk7XG4gICAgICAgICAgICB2YXIgZmV0Y2hlZENvbnRhaW5lckRhdGEgPSBjb250YWluZXJzW2hhc2hdO1xuICAgICAgICAgICAgY29udGFpbmVyRGF0YS5pZCA9IGZldGNoZWRDb250YWluZXJEYXRhLmlkO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBmZXRjaGVkQ29udGFpbmVyRGF0YS5yZWFjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjb250YWluZXJEYXRhLnJlYWN0aW9ucy5wdXNoKGZldGNoZWRDb250YWluZXJEYXRhLnJlYWN0aW9uc1tpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBnZXRQYWdlRGF0YTogZ2V0UGFnZURhdGEsXG4gICAgdXBkYXRlQWxsUGFnZURhdGE6IHVwZGF0ZUFsbFBhZ2VEYXRhLFxuICAgIGdldENvbnRhaW5lckRhdGE6IGdldENvbnRhaW5lckRhdGFcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgSGFzaCA9IHJlcXVpcmUoJy4vdXRpbHMvaGFzaCcpO1xudmFyIFBhZ2VVdGlscyA9IHJlcXVpcmUoJy4vdXRpbHMvcGFnZS11dGlscycpO1xudmFyIFdpZGdldEJ1Y2tldCA9IHJlcXVpcmUoJy4vdXRpbHMvd2lkZ2V0LWJ1Y2tldCcpO1xuXG52YXIgSW5kaWNhdG9yV2lkZ2V0ID0gcmVxdWlyZSgnLi9pbmRpY2F0b3Itd2lkZ2V0Jyk7XG52YXIgSW1hZ2VJbmRpY2F0b3JXaWRnZXQgPSByZXF1aXJlKCcuL2ltYWdlLWluZGljYXRvci13aWRnZXQnKTtcbnZhciBQYWdlRGF0YSA9IHJlcXVpcmUoJy4vcGFnZS1kYXRhJyk7XG52YXIgU3VtbWFyeVdpZGdldCA9IHJlcXVpcmUoJy4vc3VtbWFyeS13aWRnZXQnKTtcbnZhciBUZXh0UmVhY3Rpb25zID0gcmVxdWlyZSgnLi90ZXh0LXJlYWN0aW9ucycpO1xuXG5cbi8vIFNjYW4gZm9yIGFsbCBwYWdlcyBhdCB0aGUgY3VycmVudCBicm93c2VyIGxvY2F0aW9uLiBUaGlzIGNvdWxkIGp1c3QgYmUgdGhlIGN1cnJlbnQgcGFnZSBvciBpdCBjb3VsZCBiZSBhIGNvbGxlY3Rpb25cbi8vIG9mIHBhZ2VzIChha2EgJ3Bvc3RzJykuXG5mdW5jdGlvbiBzY2FuQWxsUGFnZXMoZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciAkcGFnZXMgPSAkKGdyb3VwU2V0dGluZ3MucGFnZVNlbGVjdG9yKCkpO1xuICAgIGlmICgkcGFnZXMubGVuZ3RoID09IDApIHtcbiAgICAgICAgLy8gSWYgd2UgZG9uJ3QgZGV0ZWN0IGFueSBwYWdlIG1hcmtlcnMsIHRyZWF0IHRoZSB3aG9sZSBkb2N1bWVudCBhcyB0aGUgc2luZ2xlIHBhZ2VcbiAgICAgICAgJHBhZ2VzID0gJCgnYm9keScpOyAvLyBUT0RPIElzIHRoaXMgdGhlIHJpZ2h0IGJlaGF2aW9yP1xuICAgIH1cbiAgICAkcGFnZXMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRwYWdlID0gJCh0aGlzKTtcbiAgICAgICAgc2NhblBhZ2UoJHBhZ2UsIGdyb3VwU2V0dGluZ3MpO1xuICAgIH0pO1xufVxuXG4vLyBTY2FuIHRoZSBwYWdlIHVzaW5nIHRoZSBnaXZlbiBzZXR0aW5nczpcbi8vIDEuIEZpbmQgYWxsIHRoZSBjb250YWluZXJzIHRoYXQgd2UgY2FyZSBhYm91dC5cbi8vIDIuIENvbXB1dGUgaGFzaGVzIGZvciBlYWNoIGNvbnRhaW5lci5cbi8vIDMuIEluc2VydCB3aWRnZXQgYWZmb3JkYW5jZXMgZm9yIGVhY2ggd2hpY2ggYXJlIGJvdW5kIHRvIHRoZSBkYXRhIG1vZGVsIGJ5IHRoZSBoYXNoZXMuXG5mdW5jdGlvbiBzY2FuUGFnZSgkcGFnZSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciB1cmwgPSBQYWdlVXRpbHMuY29tcHV0ZVBhZ2VVcmwoJHBhZ2UsIGdyb3VwU2V0dGluZ3MpO1xuICAgIHZhciB1cmxIYXNoID0gSGFzaC5oYXNoVXJsKHVybCk7XG4gICAgdmFyIHBhZ2VEYXRhID0gUGFnZURhdGEuZ2V0UGFnZURhdGEodXJsSGFzaCk7XG5cbiAgICAvLyBGaXJzdCwgc2NhbiBmb3IgZWxlbWVudHMgdGhhdCB3b3VsZCBjYXVzZSB1cyB0byBpbnNlcnQgc29tZXRoaW5nIGludG8gdGhlIERPTSB0aGF0IHRha2VzIHVwIHNwYWNlLlxuICAgIC8vIFdlIHdhbnQgdG8gZ2V0IGFueSBwYWdlIHJlc2l6aW5nIG91dCBvZiB0aGUgd2F5IGFzIGVhcmx5IGFzIHBvc3NpYmxlLlxuICAgIC8vIFRPRE86IENvbnNpZGVyIGRvaW5nIHRoaXMgd2l0aCByYXcgSmF2YXNjcmlwdCBiZWZvcmUgalF1ZXJ5IGxvYWRzLCB0byBmdXJ0aGVyIHJlZHVjZSB0aGUgZGVsYXkuIFdlIHdvdWxkbid0XG4gICAgLy8gc2F2ZSBhICp0b24qIG9mIHRpbWUgZnJvbSB0aGlzLCB0aG91Z2gsIHNvIGl0J3MgZGVmaW5pdGVseSBhIGxhdGVyIG9wdGltaXphdGlvbi5cbiAgICBzY2FuRm9yU3VtbWFyaWVzKCRwYWdlLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgc2NhbkZvckNhbGxzVG9BY3Rpb24oJHBhZ2UsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcblxuICAgIHZhciAkYWN0aXZlU2VjdGlvbnMgPSAkcGFnZS5maW5kKGdyb3VwU2V0dGluZ3MuYWN0aXZlU2VjdGlvbnMoKSk7XG4gICAgJGFjdGl2ZVNlY3Rpb25zLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkc2VjdGlvbiA9ICQodGhpcyk7XG4gICAgICAgIC8vIFRoZW4gc2NhbiBmb3IgZXZlcnl0aGluZyBlbHNlXG4gICAgICAgIHNjYW5Gb3JUZXh0KCRzZWN0aW9uLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIHNjYW5Gb3JJbWFnZXMoJHNlY3Rpb24sIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgc2NhbkZvck1lZGlhKCRzZWN0aW9uLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIHNjYW5Gb3JTdW1tYXJpZXMoJGVsZW1lbnQsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyICRzdW1tYXJpZXMgPSAkZWxlbWVudC5maW5kKGdyb3VwU2V0dGluZ3Muc3VtbWFyeVNlbGVjdG9yKCkpO1xuICAgICRzdW1tYXJpZXMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRzdW1tYXJ5ID0gJCh0aGlzKTtcbiAgICAgICAgdmFyIGNvbnRhaW5lciA9ICQoJzxkaXYgY2xhc3M9XCJhbnQtc3VtbWFyeS1jb250YWluZXJcIj48L2Rpdj4nKTtcbiAgICAgICAgdmFyIGNvbnRhaW5lckRhdGEgPSBQYWdlRGF0YS5nZXRDb250YWluZXJEYXRhKHBhZ2VEYXRhLCAncGFnZScpOyAvLyBNYWdpYyBoYXNoIGZvciBwYWdlIHJlYWN0aW9uc1xuICAgICAgICBjb250YWluZXJEYXRhLnR5cGUgPSAncGFnZSc7IC8vIFRPRE86IHJldmlzaXQgd2hldGhlciBpdCBtYWtlcyBzZW5zZSB0byBzZXQgdGhlIHR5cGUgaGVyZVxuICAgICAgICB2YXIgZGVmYXVsdFJlYWN0aW9ucyA9IGdyb3VwU2V0dGluZ3MuZGVmYXVsdFJlYWN0aW9ucygkc3VtbWFyeSk7IC8vIFRPRE86IGRvIHdlIHN1cHBvcnQgY3VzdG9taXppbmcgdGhlIGRlZmF1bHQgcmVhY3Rpb25zIGF0IHRoaXMgbGV2ZWw/XG4gICAgICAgIFN1bW1hcnlXaWRnZXQuY3JlYXRlKGNvbnRhaW5lciwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGRlZmF1bHRSZWFjdGlvbnMsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICBpbnNlcnRDb250ZW50KCRzdW1tYXJ5LCBjb250YWluZXIsIGdyb3VwU2V0dGluZ3Muc3VtbWFyeU1ldGhvZCgpKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gc2NhbkZvckNhbGxzVG9BY3Rpb24oJHNlY3Rpb24sIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgLy8gVE9ET1xufVxuXG5mdW5jdGlvbiBzY2FuRm9yVGV4dCgkc2VjdGlvbiwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgJHRleHRFbGVtZW50cyA9ICRzZWN0aW9uLmZpbmQoZ3JvdXBTZXR0aW5ncy50ZXh0U2VsZWN0b3IoKSk7XG4gICAgLy8gVE9ETzogb25seSBzZWxlY3QgXCJsZWFmXCIgZWxlbWVudHNcbiAgICAkdGV4dEVsZW1lbnRzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkdGV4dEVsZW1lbnQgPSAkKHRoaXMpO1xuICAgICAgICAvLyBUT0RPIHBvc2l0aW9uIGNvcnJlY3RseVxuICAgICAgICAvLyBUT0RPIGhhc2ggYW5kIGFkZCBoYXNoIGRhdGEgdG8gaW5kaWNhdG9yXG4gICAgICAgIHZhciBoYXNoID0gSGFzaC5oYXNoVGV4dCgkdGV4dEVsZW1lbnQpO1xuICAgICAgICB2YXIgJGluZGljYXRvckVsZW1lbnQgPSAkKCc8ZGl2IGNsYXNzPVwiYW50LWluZGljYXRvci1jb250YWluZXJcIiBzdHlsZT1cImRpc3BsYXk6aW5saW5lLWJsb2NrO1wiPjwvZGl2PicpOyAvLyBUT0RPXG4gICAgICAgIHZhciBjb250YWluZXJEYXRhID0gUGFnZURhdGEuZ2V0Q29udGFpbmVyRGF0YShwYWdlRGF0YSwgaGFzaCk7XG4gICAgICAgIGNvbnRhaW5lckRhdGEudHlwZSA9ICd0ZXh0JzsgLy8gVE9ETzogcmV2aXNpdCB3aGV0aGVyIGl0IG1ha2VzIHNlbnNlIHRvIHNldCB0aGUgdHlwZSBoZXJlXG4gICAgICAgIHZhciBkZWZhdWx0UmVhY3Rpb25zID0gZ3JvdXBTZXR0aW5ncy5kZWZhdWx0UmVhY3Rpb25zKCR0ZXh0RWxlbWVudCk7XG4gICAgICAgIHZhciBpbmRpY2F0b3IgPSBJbmRpY2F0b3JXaWRnZXQuY3JlYXRlKHtcbiAgICAgICAgICAgIGVsZW1lbnQ6ICRpbmRpY2F0b3JFbGVtZW50LFxuICAgICAgICAgICAgY29udGFpbmVyRGF0YTogY29udGFpbmVyRGF0YSxcbiAgICAgICAgICAgIGNvbnRhaW5lckVsZW1lbnQ6ICR0ZXh0RWxlbWVudCxcbiAgICAgICAgICAgIGRlZmF1bHRSZWFjdGlvbnM6IGRlZmF1bHRSZWFjdGlvbnMsXG4gICAgICAgICAgICBwYWdlRGF0YTogcGFnZURhdGEsXG4gICAgICAgICAgICBncm91cFNldHRpbmdzOiBncm91cFNldHRpbmdzfVxuICAgICAgICApO1xuICAgICAgICAkdGV4dEVsZW1lbnQuYXBwZW5kKCRpbmRpY2F0b3JFbGVtZW50KTsgLy8gVE9ETyBpcyB0aGlzIGNvbmZpZ3VyYWJsZSBhbGEgaW5zZXJ0Q29udGVudCguLi4pP1xuXG4gICAgICAgIFRleHRSZWFjdGlvbnMuY3JlYXRlUmVhY3RhYmxlVGV4dCh7XG4gICAgICAgICAgICBjb250YWluZXJEYXRhOiBjb250YWluZXJEYXRhLFxuICAgICAgICAgICAgY29udGFpbmVyRWxlbWVudDogJHRleHRFbGVtZW50LFxuICAgICAgICAgICAgZGVmYXVsdFJlYWN0aW9uczogZGVmYXVsdFJlYWN0aW9ucyxcbiAgICAgICAgICAgIHBhZ2VEYXRhOiBwYWdlRGF0YSxcbiAgICAgICAgICAgIGdyb3VwU2V0dGluZ3M6IGdyb3VwU2V0dGluZ3MsXG4gICAgICAgICAgICBleGNsdWRlTm9kZTogJGluZGljYXRvckVsZW1lbnQuZ2V0KDApXG4gICAgICAgIH0pO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBzY2FuRm9ySW1hZ2VzKCRzZWN0aW9uLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciAkaW1hZ2VFbGVtZW50cyA9ICRzZWN0aW9uLmZpbmQoZ3JvdXBTZXR0aW5ncy5pbWFnZVNlbGVjdG9yKCkpOyAvLyBUT0RPIGFsc28gc2VsZWN0IGZvciBhdHRyaWJ1dGUgb3ZlcnJpZGUuIGkuZS46ICdpbWcsW2FudC1pdGVtLXR5cGU9XCJpbWFnZVwiXSdcbiAgICAkaW1hZ2VFbGVtZW50cy5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgJGltYWdlRWxlbWVudCA9ICQodGhpcyk7XG4gICAgICAgIHZhciBpbWFnZVVybCA9IGdldEltYWdlVXJsKCRpbWFnZUVsZW1lbnQpO1xuICAgICAgICB2YXIgaGFzaCA9IEhhc2guaGFzaEltYWdlKGltYWdlVXJsKTtcbiAgICAgICAgdmFyIGNvbnRhaW5lckRhdGEgPSBQYWdlRGF0YS5nZXRDb250YWluZXJEYXRhKHBhZ2VEYXRhLCBoYXNoKTtcbiAgICAgICAgY29udGFpbmVyRGF0YS50eXBlID0gJ2ltYWdlJzsgLy8gVE9ETzogcmV2aXNpdCB3aGV0aGVyIGl0IG1ha2VzIHNlbnNlIHRvIHNldCB0aGUgdHlwZSBoZXJlXG4gICAgICAgIHZhciBkZWZhdWx0UmVhY3Rpb25zID0gZ3JvdXBTZXR0aW5ncy5kZWZhdWx0UmVhY3Rpb25zKCRpbWFnZUVsZW1lbnQpO1xuICAgICAgICB2YXIgaW1hZ2VPZmZzZXQgPSAkaW1hZ2VFbGVtZW50Lm9mZnNldCgpO1xuICAgICAgICB2YXIgY29vcmRzID0ge1xuICAgICAgICAgICAgdG9wOiBpbWFnZU9mZnNldC50b3AgKyAkaW1hZ2VFbGVtZW50LmhlaWdodCgpLCAvLyBUT0RPIHB1bGwgZnJvbSBzZXR0aW5ncy9lbGVtZW50XG4gICAgICAgICAgICBsZWZ0OiBpbWFnZU9mZnNldC5sZWZ0XG4gICAgICAgIH07XG4gICAgICAgIHZhciBkaW1lbnNpb25zID0ge1xuICAgICAgICAgICAgaGVpZ2h0OiAkaW1hZ2VFbGVtZW50LmhlaWdodCgpLCAvLyBUT0RPOiByZXZpZXcgaG93IHdlIGdldCB0aGUgaW1hZ2UgZGltZW5zaW9uc1xuICAgICAgICAgICAgd2lkdGg6ICRpbWFnZUVsZW1lbnQud2lkdGgoKVxuICAgICAgICB9O1xuICAgICAgICAvLyBUT0RPOiBkb24ndCBjcmVhdGUgaW5kaWNhdG9yIG9uIGltYWdlcyB0aGF0IGFyZSB0b28gc21hbGxcbiAgICAgICAgSW1hZ2VJbmRpY2F0b3JXaWRnZXQuY3JlYXRlKHtcbiAgICAgICAgICAgIGVsZW1lbnQ6IFdpZGdldEJ1Y2tldCgpLFxuICAgICAgICAgICAgY29vcmRzOiBjb29yZHMsXG4gICAgICAgICAgICBpbWFnZVVybDogaW1hZ2VVcmwsXG4gICAgICAgICAgICBpbWFnZURpbWVuc2lvbnM6IGRpbWVuc2lvbnMsXG4gICAgICAgICAgICBjb250YWluZXJEYXRhOiBjb250YWluZXJEYXRhLFxuICAgICAgICAgICAgY29udGFpbmVyRWxlbWVudDogJGltYWdlRWxlbWVudCxcbiAgICAgICAgICAgIGRlZmF1bHRSZWFjdGlvbnM6IGRlZmF1bHRSZWFjdGlvbnMsXG4gICAgICAgICAgICBwYWdlRGF0YTogcGFnZURhdGEsXG4gICAgICAgICAgICBncm91cFNldHRpbmdzOiBncm91cFNldHRpbmdzfVxuICAgICAgICApO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBnZXRJbWFnZVVybCgkZWxlbWVudCkge1xuICAgIHZhciBjb250ZW50ID0gJGVsZW1lbnQuYXR0cignYW50LWVsZW1lbnQtY29udGVudCcpOyAvLyBUT0RPIGFsbG93IHRoaXMgb3ZlcnJpZGUgZXZlcnl3aGVyZVxuICAgIGlmICghY29udGVudCkge1xuICAgICAgICBjb250ZW50ID0gJGVsZW1lbnQuYXR0cignc3JjJyk7IC8vIFRPRE8gY2xlYW4gdXAgVVJMP1xuICAgICAgICBpZiAoY29udGVudC5pbmRleE9mKCcvJykgPT09IDApe1xuICAgICAgICAgICAgY29udGVudCA9IHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4gKyBjb250ZW50O1xuICAgICAgICB9XG4gICAgICAgIGlmIChjb250ZW50LmluZGV4T2YoJ2h0dHAnKSAhPT0gMCl7XG4gICAgICAgICAgICBjb250ZW50ID0gd2luZG93LmxvY2F0aW9uLm9yaWdpbiArIHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZSArIGNvbnRlbnQ7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGNvbnRlbnQ7XG59XG5cbmZ1bmN0aW9uIHNjYW5Gb3JNZWRpYSgkc2VjdGlvbiwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICAvLyBUT0RPXG59XG5cbmZ1bmN0aW9uIGluc2VydENvbnRlbnQoJHBhcmVudCwgY29udGVudCwgbWV0aG9kKSB7XG4gICAgc3dpdGNoIChtZXRob2QpIHtcbiAgICAgICAgY2FzZSAnYXBwZW5kJzpcbiAgICAgICAgICAgICRwYXJlbnQuYXBwZW5kKGNvbnRlbnQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3ByZXBlbmQnOlxuICAgICAgICAgICAgJHBhcmVudC5wcmVwZW5kKGNvbnRlbnQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2JlZm9yZSc6XG4gICAgICAgICAgICAkcGFyZW50LmJlZm9yZShjb250ZW50KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdhZnRlcic6XG4gICAgICAgICAgICAkcGFyZW50LmFmdGVyKGNvbnRlbnQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICBzY2FuOiBzY2FuQWxsUGFnZXNcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgV2lkZ2V0QnVja2V0ID0gcmVxdWlyZSgnLi91dGlscy93aWRnZXQtYnVja2V0Jyk7XG52YXIgVHJhbnNpdGlvblV0aWwgPSByZXF1aXJlKCcuL3V0aWxzL3RyYW5zaXRpb24tdXRpbCcpO1xuXG52YXIgcmFjdGl2ZTtcbnZhciBjbGlja0hhbmRsZXI7XG5cblxuZnVuY3Rpb24gZ2V0Um9vdEVsZW1lbnQoKSB7XG4gICAgLy8gVE9ETyByZXZpc2l0IHRoaXMsIGl0J3Mga2luZCBvZiBnb29meSBhbmQgaXQgbWlnaHQgaGF2ZSBhIHRpbWluZyBwcm9ibGVtXG4gICAgaWYgKCFyYWN0aXZlKSB7XG4gICAgICAgIHZhciBidWNrZXQgPSBXaWRnZXRCdWNrZXQoKTtcbiAgICAgICAgcmFjdGl2ZSA9IFJhY3RpdmUoe1xuICAgICAgICAgICAgZWw6IGJ1Y2tldCxcbiAgICAgICAgICAgIGFwcGVuZDogdHJ1ZSxcbiAgICAgICAgICAgIHRlbXBsYXRlOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvcG9wdXAtd2lkZ2V0Lmhicy5odG1sJylcbiAgICAgICAgfSk7XG4gICAgICAgIHZhciAkZWxlbWVudCA9ICQocmFjdGl2ZS5maW5kKCcuYW50ZW5uYS1wb3B1cCcpKTtcbiAgICAgICAgJGVsZW1lbnQub24oJ21vdXNlZG93bicsIGZhbHNlKTsgLy8gUHJldmVudCBtb3VzZWRvd24gZnJvbSBwcm9wYWdhdGluZywgc28gdGhlIGJyb3dzZXIgZG9lc24ndCBjbGVhciB0aGUgdGV4dCBzZWxlY3Rpb24uXG4gICAgICAgICRlbGVtZW50Lm9uKCdjbGljay5hbnRlbm5hLXBvcHVwJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgaGlkZVBvcHVwKCRlbGVtZW50KTtcbiAgICAgICAgICAgIGlmIChjbGlja0hhbmRsZXIpIHtcbiAgICAgICAgICAgICAgICBjbGlja0hhbmRsZXIoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiAkZWxlbWVudDtcbiAgICB9XG4gICAgcmV0dXJuICQocmFjdGl2ZS5maW5kKCcuYW50ZW5uYS1wb3B1cCcpKTtcbn1cblxuZnVuY3Rpb24gc2hvd1BvcHVwKGNvb3JkaW5hdGVzLCBjYWxsYmFjaykge1xuICAgIHZhciAkZWxlbWVudCA9IGdldFJvb3RFbGVtZW50KCk7XG4gICAgaWYgKCEkZWxlbWVudC5oYXNDbGFzcygnc2hvdycpKSB7XG4gICAgICAgIGNsaWNrSGFuZGxlciA9IGNhbGxiYWNrO1xuICAgICAgICAkZWxlbWVudFxuICAgICAgICAgICAgLnNob3coKSAvLyBzdGlsbCBoYXMgb3BhY2l0eSAwIGF0IHRoaXMgcG9pbnRcbiAgICAgICAgICAgIC5jc3Moe1xuICAgICAgICAgICAgICAgIHRvcDogY29vcmRpbmF0ZXMudG9wIC0gJGVsZW1lbnQub3V0ZXJIZWlnaHQoKSAtIDYsIC8vIFRPRE8gZmluZCBhIGNsZWFuZXIgd2F5IHRvIGFjY291bnQgZm9yIHRoZSBwb3B1cCAndGFpbCdcbiAgICAgICAgICAgICAgICBsZWZ0OiBjb29yZGluYXRlcy5sZWZ0IC0gTWF0aC5mbG9vcigkZWxlbWVudC5vdXRlcldpZHRoKCkgLyAyKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIFRyYW5zaXRpb25VdGlsLnRvZ2dsZUNsYXNzKCRlbGVtZW50LCAnc2hvdycsIHRydWUsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy8gVE9ETzogYWZ0ZXIgdGhlIGFwcGVhcmFuY2UgdHJhbnNpdGlvbiBpcyBjb21wbGV0ZSwgYWRkIGEgaGFuZGxlciBmb3IgbW91c2VlbnRlciB3aGljaCB0aGVuIHJlZ2lzdGVyc1xuICAgICAgICAgICAgLy8gICAgICAgYSBoYW5kbGVyIGZvciBtb3VzZWxlYXZlIHRoYXQgaGlkZXMgdGhlIHBvcHVwXG5cbiAgICAgICAgICAgIC8vIFRPRE86IGFsc28gdGFrZSBkb3duIHRoZSBwb3B1cCBpZiB0aGUgdXNlciBtb3VzZXMgb3ZlciBhbm90aGVyIHdpZGdldCAoc3VtbWFyeSBvciBpbmRpY2F0b3IpXG4gICAgICAgICAgICAkKGRvY3VtZW50KS5vbignY2xpY2suYW50ZW5uYS1wb3B1cCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBoaWRlUG9wdXAoJGVsZW1lbnQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gaGlkZVBvcHVwKCRlbGVtZW50KSB7XG4gICAgVHJhbnNpdGlvblV0aWwudG9nZ2xlQ2xhc3MoJGVsZW1lbnQsICdzaG93JywgZmFsc2UsIGZ1bmN0aW9uKCkge1xuICAgICAgICAkZWxlbWVudC5oaWRlKCk7IC8vIGFmdGVyIHdlJ3JlIGF0IG9wYWNpdHkgMCwgaGlkZSB0aGUgZWxlbWVudCBzbyBpdCBkb2Vzbid0IHJlY2VpdmUgYWNjaWRlbnRhbCBjbGlja3NcbiAgICB9KTtcbiAgICAkKGRvY3VtZW50KS5vZmYoJ2NsaWNrLmFudGVubmEtcG9wdXAnKTtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHNob3c6IHNob3dQb3B1cFxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi91dGlscy9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciBBamF4Q2xpZW50ID0gcmVxdWlyZSgnLi91dGlscy9hamF4LWNsaWVudCcpO1xudmFyIE1vdmVhYmxlID0gcmVxdWlyZSgnLi91dGlscy9tb3ZlYWJsZScpO1xudmFyIFJhbmdlID0gcmVxdWlyZSgnLi91dGlscy9yYW5nZScpO1xudmFyIFRyYW5zaXRpb25VdGlsID0gcmVxdWlyZSgnLi91dGlscy90cmFuc2l0aW9uLXV0aWwnKTtcbnZhciBVUkxzID0gcmVxdWlyZSgnLi91dGlscy91cmxzJyk7XG52YXIgV2lkZ2V0QnVja2V0ID0gcmVxdWlyZSgnLi91dGlscy93aWRnZXQtYnVja2V0Jyk7XG5cbmZ1bmN0aW9uIG9wZW5SZWFjdGlvbnNXaWRnZXQob3B0aW9ucywgZWxlbWVudE9yQ29vcmRzKSB7XG4gICAgdmFyIGRlZmF1bHRSZWFjdGlvbnMgPSBvcHRpb25zLmRlZmF1bHRSZWFjdGlvbnM7XG4gICAgdmFyIHJlYWN0aW9uc0RhdGEgPSBvcHRpb25zLnJlYWN0aW9uc0RhdGE7XG4gICAgdmFyIGNvbnRhaW5lckRhdGEgPSBvcHRpb25zLmNvbnRhaW5lckRhdGE7XG4gICAgdmFyIGNvbnRhaW5lckVsZW1lbnQgPSBvcHRpb25zLmNvbnRhaW5lckVsZW1lbnQ7XG4gICAgLy8gY29udGVudERhdGEgY29udGFpbnMgZGV0YWlscyBhYm91dCB0aGUgY29udGVudCBiZWluZyByZWFjdGVkIHRvIGxpa2UgdGV4dCByYW5nZSBvciBpbWFnZSBoZWlnaHQvd2lkdGguXG4gICAgLy8gd2UgcG90ZW50aWFsbHkgbW9kaWZ5IHRoaXMgZGF0YSAoZS5nLiBpbiB0aGUgZGVmYXVsdCByZWFjdGlvbiBjYXNlIHdlIHNlbGVjdCB0aGUgdGV4dCBvdXJzZWx2ZXMpIHNvIHdlXG4gICAgLy8gbWFrZSBhIGxvY2FsIGNvcHkgb2YgaXQgdG8gYXZvaWQgdW5leHBlY3RlZGx5IGNoYW5naW5nIGRhdGEgb3V0IGZyb20gdW5kZXIgb25lIG9mIHRoZSBjbGllbnRzXG4gICAgdmFyIGNvbnRlbnREYXRhID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShvcHRpb25zLmNvbnRlbnREYXRhKSk7XG4gICAgdmFyIHBhZ2VEYXRhID0gb3B0aW9ucy5wYWdlRGF0YTtcbiAgICB2YXIgZ3JvdXBTZXR0aW5ncyA9IG9wdGlvbnMuZ3JvdXBTZXR0aW5ncztcbiAgICB2YXIgY29sb3JzID0gZ3JvdXBTZXR0aW5ncy5yZWFjdGlvbkJhY2tncm91bmRDb2xvcnMoKTtcbiAgICBzb3J0UmVhY3Rpb25EYXRhKHJlYWN0aW9uc0RhdGEpO1xuICAgIHZhciByZWFjdGlvbnNMYXlvdXREYXRhID0gY29tcHV0ZUxheW91dERhdGEocmVhY3Rpb25zRGF0YSwgY29sb3JzKTtcbiAgICB2YXIgZGVmYXVsdExheW91dERhdGEgPSBjb21wdXRlTGF5b3V0RGF0YShkZWZhdWx0UmVhY3Rpb25zLCBjb2xvcnMpO1xuICAgIHZhciByYWN0aXZlID0gUmFjdGl2ZSh7XG4gICAgICAgIGVsOiBXaWRnZXRCdWNrZXQoKSxcbiAgICAgICAgYXBwZW5kOiB0cnVlLFxuICAgICAgICBtYWdpYzogdHJ1ZSxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgcmVhY3Rpb25zOiByZWFjdGlvbnNEYXRhLFxuICAgICAgICAgICAgcmVhY3Rpb25zTGF5b3V0Q2xhc3M6IGFycmF5QWNjZXNzb3IocmVhY3Rpb25zTGF5b3V0RGF0YS5sYXlvdXRDbGFzc2VzKSxcbiAgICAgICAgICAgIHJlYWN0aW9uc0JhY2tncm91bmRDb2xvcjogYXJyYXlBY2Nlc3NvcihyZWFjdGlvbnNMYXlvdXREYXRhLmJhY2tncm91bmRDb2xvcnMpLFxuICAgICAgICAgICAgZGVmYXVsdFJlYWN0aW9uczogZGVmYXVsdFJlYWN0aW9ucyxcbiAgICAgICAgICAgIGRlZmF1bHRMYXlvdXRDbGFzczogYXJyYXlBY2Nlc3NvcihkZWZhdWx0TGF5b3V0RGF0YS5sYXlvdXRDbGFzc2VzKSxcbiAgICAgICAgICAgIGRlZmF1bHRCYWNrZ3JvdW5kQ29sb3I6IGFycmF5QWNjZXNzb3IoZGVmYXVsdExheW91dERhdGEuYmFja2dyb3VuZENvbG9ycyksXG4gICAgICAgICAgICByZXNwb25zZToge31cbiAgICAgICAgfSxcbiAgICAgICAgdGVtcGxhdGU6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9yZWFjdGlvbnMtd2lkZ2V0Lmhicy5odG1sJyksXG4gICAgICAgIGRlY29yYXRvcnM6IHtcbiAgICAgICAgICAgIHNpemV0b2ZpdDogc2l6ZVJlYWN0aW9uVGV4dFRvRml0XG4gICAgICAgIH0sXG4gICAgICAgIGFudGVubmE6IHt9IC8vIGNyZWF0ZSBvdXIgb3duIHByb3BlcnR5IGJ1Y2tldCBvbiB0aGUgaW5zdGFuY2VcbiAgICB9KTtcbiAgICB2YXIgJHJvb3RFbGVtZW50ID0gJChyb290RWxlbWVudChyYWN0aXZlKSk7XG4gICAgTW92ZWFibGUubWFrZU1vdmVhYmxlKCRyb290RWxlbWVudCwgJHJvb3RFbGVtZW50LmZpbmQoJy5hbnRlbm5hLWhlYWRlcicpKTtcbiAgICBpZiAoY29udGFpbmVyRWxlbWVudCkge1xuICAgICAgICByYWN0aXZlLm9uKCdoaWdobGlnaHQnLCBoaWdobGlnaHRDb250ZW50KGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCByYWN0aXZlLCBjb250YWluZXJFbGVtZW50KSk7XG4gICAgICAgIHJhY3RpdmUub24oJ2NsZWFyaGlnaGxpZ2h0cycsIFJhbmdlLmNsZWFySGlnaGxpZ2h0cyk7XG4gICAgfVxuICAgIHJhY3RpdmUub24oJ3BsdXNvbmUnLCBwbHVzT25lKGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCByYWN0aXZlKSk7XG4gICAgcmFjdGl2ZS5vbignbmV3cmVhY3Rpb24nLCBuZXdEZWZhdWx0UmVhY3Rpb24oY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGNvbnRlbnREYXRhLCByYWN0aXZlKSk7XG4gICAgcmFjdGl2ZS5vbignc2hvd2RlZmF1bHQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgc2hvd0RlZmF1bHRSZWFjdGlvbnNQYWdlKGNvbnRhaW5lckVsZW1lbnQsIGNvbnRlbnREYXRhLCByYWN0aXZlLCB0cnVlKTtcbiAgICB9KTtcbiAgICBvcGVuV2luZG93KGVsZW1lbnRPckNvb3JkcywgY29udGFpbmVyRWxlbWVudCwgY29udGVudERhdGEsIHJlYWN0aW9uc0RhdGEsIHJhY3RpdmUpO1xufVxuXG5mdW5jdGlvbiBhcnJheUFjY2Vzc29yKGFycmF5KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKGluZGV4KSB7XG4gICAgICAgIHJldHVybiBhcnJheVtpbmRleF07XG4gICAgfVxufVxuXG5mdW5jdGlvbiBzb3J0UmVhY3Rpb25EYXRhKHJlYWN0aW9ucykge1xuICAgIHJlYWN0aW9ucy5zb3J0KGZ1bmN0aW9uKHJlYWN0aW9uQSwgcmVhY3Rpb25CKSB7XG4gICAgICAgcmV0dXJuIHJlYWN0aW9uQi5jb3VudCAtIHJlYWN0aW9uQS5jb3VudDtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gc2l6ZVJlYWN0aW9uVGV4dFRvRml0KG5vZGUpIHtcbiAgICB2YXIgJGVsZW1lbnQgPSAkKG5vZGUpO1xuICAgIHZhciAkcm9vdEVsZW1lbnQgPSAkZWxlbWVudC5jbG9zZXN0KCcuYW50ZW5uYS1yZWFjdGlvbnMtd2lkZ2V0Jyk7XG4gICAgaWYgKCRyb290RWxlbWVudC5sZW5ndGggPiAwKSB7XG4gICAgICAgIHZhciBvcmlnaW5hbERpc3BsYXkgPSAkcm9vdEVsZW1lbnQuY3NzKCdkaXNwbGF5Jyk7XG4gICAgICAgIGlmIChvcmlnaW5hbERpc3BsYXkgPT09ICdub25lJykgeyAvLyBJZiB3ZSdyZSBzaXppbmcgdGhlIGJveGVzIGJlZm9yZSB0aGUgd2lkZ2V0IGlzIGRpc3BsYXllZCwgdGVtcG9yYXJpbHkgZGlzcGxheSBpdCBvZmZzY3JlZW4uXG4gICAgICAgICAgICAkcm9vdEVsZW1lbnQuY3NzKHtkaXNwbGF5OiAnYmxvY2snLCBsZWZ0OiAnMTAwJSd9KTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcmF0aW8gPSBub2RlLmNsaWVudFdpZHRoIC8gbm9kZS5zY3JvbGxXaWR0aDtcbiAgICAgICAgaWYgKHJhdGlvIDwgMS4wKSB7IC8vIElmIHRoZSB0ZXh0IGRvZXNuJ3QgZml0LCBmaXJzdCB0cnkgdG8gd3JhcCBpdCB0byB0d28gbGluZXMuIFRoZW4gc2NhbGUgaXQgZG93biBpZiBzdGlsbCBuZWNlc3NhcnkuXG4gICAgICAgICAgICB2YXIgdGV4dCA9IG5vZGUuaW5uZXJIVE1MO1xuICAgICAgICAgICAgdmFyIG1pZCA9IE1hdGguY2VpbCh0ZXh0Lmxlbmd0aCAvIDIpOyAvLyBMb29rIGZvciB0aGUgY2xvc2VzdCBzcGFjZSB0byB0aGUgbWlkZGxlLCB3ZWlnaHRlZCBzbGlnaHRseSAoTWF0aC5jZWlsKSB0b3dhcmQgYSBzcGFjZSBpbiB0aGUgc2Vjb25kIGhhbGYuXG4gICAgICAgICAgICB2YXIgc2Vjb25kSGFsZkluZGV4ID0gdGV4dC5pbmRleE9mKCcgJywgbWlkKTtcbiAgICAgICAgICAgIHZhciBmaXJzdEhhbGZJbmRleCA9IHRleHQubGFzdEluZGV4T2YoJyAnLCBtaWQpO1xuICAgICAgICAgICAgdmFyIHNwbGl0SW5kZXggPSBNYXRoLmFicyhzZWNvbmRIYWxmSW5kZXggLSBtaWQpIDwgTWF0aC5hYnMobWlkIC0gZmlyc3RIYWxmSW5kZXgpID8gc2Vjb25kSGFsZkluZGV4IDogZmlyc3RIYWxmSW5kZXg7XG4gICAgICAgICAgICBpZiAoc3BsaXRJbmRleCA+IDEpIHtcbiAgICAgICAgICAgICAgICBub2RlLmlubmVySFRNTCA9IHRleHQuc2xpY2UoMCwgc3BsaXRJbmRleCkgKyAnPGJyPicgKyB0ZXh0LnNsaWNlKHNwbGl0SW5kZXgpO1xuICAgICAgICAgICAgICAgIHJhdGlvID0gbm9kZS5jbGllbnRXaWR0aCAvIG5vZGUuc2Nyb2xsV2lkdGg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocmF0aW8gPCAxLjApIHtcbiAgICAgICAgICAgICAgICAkZWxlbWVudC5jc3MoJ2ZvbnQtc2l6ZScsIE1hdGgubWF4KDEwLCBNYXRoLmZsb29yKHBhcnNlSW50KCRlbGVtZW50LmNzcygnZm9udC1zaXplJykpICogcmF0aW8pIC0gMSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChvcmlnaW5hbERpc3BsYXkgPT09ICdub25lJykge1xuICAgICAgICAgICAgJHJvb3RFbGVtZW50LmNzcyh7ZGlzcGxheTogJycsIGxlZnQ6ICcnfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHsgdGVhcmRvd246IGZ1bmN0aW9uKCkge30gfTtcbn1cblxuZnVuY3Rpb24gaGlnaGxpZ2h0Q29udGVudChjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgcmFjdGl2ZSwgJGNvbnRhaW5lckVsZW1lbnQpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdmFyIHJlYWN0aW9uRGF0YSA9IGV2ZW50LmNvbnRleHQ7XG4gICAgICAgIGlmIChyZWFjdGlvbkRhdGEuY29udGVudCkge1xuICAgICAgICAgICAgdmFyIGxvY2F0aW9uID0gcmVhY3Rpb25EYXRhLmNvbnRlbnQubG9jYXRpb247XG4gICAgICAgICAgICBpZiAobG9jYXRpb24pIHtcbiAgICAgICAgICAgICAgICBSYW5nZS5oaWdobGlnaHQoJGNvbnRhaW5lckVsZW1lbnQuZ2V0KDApLCBsb2NhdGlvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIG5ld0RlZmF1bHRSZWFjdGlvbihjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgY29udGVudERhdGEsIHJhY3RpdmUpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdmFyIGRlZmF1bHRSZWFjdGlvbkRhdGEgPSBldmVudC5jb250ZXh0O1xuICAgICAgICBzaG93UGFnZSgnLmFudGVubmEtcHJvZ3Jlc3MtcGFnZScsIHJhY3RpdmUsIGZhbHNlLCB0cnVlKTtcbiAgICAgICAgQWpheENsaWVudC5wb3N0TmV3UmVhY3Rpb24oZGVmYXVsdFJlYWN0aW9uRGF0YSwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGNvbnRlbnREYXRhLCBzdWNjZXNzLCBlcnJvcik7XG5cbiAgICAgICAgZnVuY3Rpb24gc3VjY2VzcyhyZXNwb25zZSkge1xuICAgICAgICAgICAgaWYgKHJlc3BvbnNlLmV4aXN0aW5nKSB7XG4gICAgICAgICAgICAgICAgLy8gVE9ETzogV2UgY2FuIGVpdGhlciBhY2Nlc3MgdGhpcyBkYXRhIHRocm91Z2ggdGhlIHJhY3RpdmUga2V5cGF0aCBvciBieSBwYXNzaW5nIHRoZSBkYXRhIG9iamVjdCBhcm91bmQuIFBpY2sgb25lLlxuICAgICAgICAgICAgICAgIHJhY3RpdmUuc2V0KCdyZXNwb25zZS5leGlzdGluZycsIHJlc3BvbnNlLmV4aXN0aW5nKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgIC8vIFRPRE86IHRoZSBzZXJ2ZXIgc2hvdWxkIGdpdmUgdXMgYmFjayBhIHJlYWN0aW9uIG1hdGNoaW5nIHRoZSBuZXcgQVBJIGZvcm1hdC5cbiAgICAgICAgICAgICAgICAgLy8gICAgICAgd2UncmUganVzdCBmYWtpbmcgaXQgb3V0IGZvciBub3c7IHRoaXMgY29kZSBpcyB0ZW1wb3JhcnlcbiAgICAgICAgICAgICAgICB2YXIgcmVhY3Rpb24gPSB7XG4gICAgICAgICAgICAgICAgICAgIHRleHQ6IHJlc3BvbnNlLmludGVyYWN0aW9uLmludGVyYWN0aW9uX25vZGUuYm9keSxcbiAgICAgICAgICAgICAgICAgICAgaWQ6IHJlc3BvbnNlLmludGVyYWN0aW9uLmludGVyYWN0aW9uX25vZGUuaWQsXG4gICAgICAgICAgICAgICAgICAgIGNvdW50OiAxLCAvLyBUT0RPOiBjb3VsZCB3ZSBnZXQgYmFjayBhIGRpZmZlcmVudCBjb3VudCBpZiBzb21lb25lIGVsc2UgbWFkZSB0aGUgc2FtZSBcIm5ld1wiIHJlYWN0aW9uIGJlZm9yZSB1cz9cbiAgICAgICAgICAgICAgICAgICAgLy8gcGFyZW50SWQ6ID8/PyBUT0RPOiBjb3VsZCB3ZSBnZXQgYSBwYXJlbnRJZCBiYWNrIGlmIHNvbWVvbmUgZWxzZSBtYWRlIHRoZSBzYW1lIFwibmV3XCIgcmVhY3Rpb24gYmVmb3JlIHVzP1xuICAgICAgICAgICAgICAgICAgICBjb250ZW50OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2NhdGlvbjogY29udGVudERhdGEubG9jYXRpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICBraW5kOiBjb250ZW50RGF0YS50eXBlLFxuICAgICAgICAgICAgICAgICAgICAgICAgYm9keTogY29udGVudERhdGEuYm9keSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkOiByZXNwb25zZS5jb250ZW50X25vZGUuaWRcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgLy8gVE9ETzogY2hlY2sgYmFjayBvbiB0aGlzIGFzIHRoZSB3YXkgdG8gcHJvcG9nYXRlIGRhdGEgY2hhbmdlcyBpbnRvIHRoZSBtb2RlbC4gQ29uc2lkZXIgYWRkaW5nIHNvbWV0aGluZ1xuICAgICAgICAgICAgICAgIC8vICAgICAgIHRvIFBhZ2VEYXRhIHRvIGhhbmRsZSB0aGlzIGluc3RlYWQuXG4gICAgICAgICAgICAgICAgY29udGFpbmVyRGF0YS5yZWFjdGlvbnMucHVzaChyZWFjdGlvbik7XG4gICAgICAgICAgICAgICAgc29ydFJlYWN0aW9uRGF0YShjb250YWluZXJEYXRhLnJlYWN0aW9ucyk7XG4gICAgICAgICAgICAgICAgY29udGFpbmVyRGF0YS5yZWFjdGlvblRvdGFsID0gY29udGFpbmVyRGF0YS5yZWFjdGlvblRvdGFsICsgMTtcbiAgICAgICAgICAgICAgICB2YXIgc3VtbWFyeVJlYWN0aW9uID0ge1xuICAgICAgICAgICAgICAgICAgICB0ZXh0OiByZWFjdGlvbi50ZXh0LFxuICAgICAgICAgICAgICAgICAgICBpZDogcmVhY3Rpb24uaWQsXG4gICAgICAgICAgICAgICAgICAgIGNvdW50OiByZWFjdGlvbi5jb3VudFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgcGFnZURhdGEuc3VtbWFyeVJlYWN0aW9ucy5wdXNoKHN1bW1hcnlSZWFjdGlvbik7XG4gICAgICAgICAgICAgICAgcGFnZURhdGEuc3VtbWFyeVRvdGFsID0gcGFnZURhdGEuc3VtbWFyeVRvdGFsICsgMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNob3dDb25maXJtUGFnZShyYWN0aXZlLCB0cnVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGVycm9yKG1lc3NhZ2UpIHtcbiAgICAgICAgICAgIC8vIFRPRE8gaGFuZGxlIGFueSBlcnJvcnMgdGhhdCBvY2N1ciBwb3N0aW5nIGEgcmVhY3Rpb25cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiZXJyb3IgcG9zdGluZyBuZXcgcmVhY3Rpb246IFwiICsgbWVzc2FnZSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIHBsdXNPbmUoY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIHJhY3RpdmUpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdmFyIHJlYWN0aW9uRGF0YSA9IGV2ZW50LmNvbnRleHQ7XG4gICAgICAgIHNob3dQYWdlKCcuYW50ZW5uYS1wcm9ncmVzcy1wYWdlJywgcmFjdGl2ZSwgZmFsc2UsIHRydWUpO1xuICAgICAgICBBamF4Q2xpZW50LnBvc3RQbHVzT25lKHJlYWN0aW9uRGF0YSwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIHN1Y2Nlc3MsIGVycm9yKTtcblxuICAgICAgICBmdW5jdGlvbiBzdWNjZXNzKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICByYWN0aXZlLnNldCgncmVzcG9uc2UuZXhpc3RpbmcnLCByZXNwb25zZS5leGlzdGluZyk7IC8vIFRPRE86IFdlIGNhbiBlaXRoZXIgYWNjZXNzIHRoaXMgZGF0YSB0aHJvdWdoIHRoZSByYWN0aXZlIGtleXBhdGggb3IgYnkgcGFzc2luZyB0aGUgZGF0YSBvYmplY3QgYXJvdW5kLiBQaWNrIG9uZS5cbiAgICAgICAgICAgIGlmICghcmVzcG9uc2UuZXhpc3RpbmcpIHtcbiAgICAgICAgICAgICAgICAvLyBUT0RPOiB3ZSBzaG91bGQgZ2V0IGJhY2sgYSByZXNwb25zZSB3aXRoIGRhdGEgaW4gdGhlIFwibmV3IGZvcm1hdFwiIGFuZCB1cGRhdGUgdGhlIG1vZGVsIGZyb20gdGhlIHJlc3BvbnNlXG4gICAgICAgICAgICAgICAgcmVhY3Rpb25EYXRhLmNvdW50ID0gcmVhY3Rpb25EYXRhLmNvdW50ICsgMTtcbiAgICAgICAgICAgICAgICBjb250YWluZXJEYXRhLnJlYWN0aW9uVG90YWwgPSBjb250YWluZXJEYXRhLnJlYWN0aW9uVG90YWwgKyAxO1xuICAgICAgICAgICAgICAgIHBhZ2VEYXRhLnN1bW1hcnlUb3RhbCA9IHBhZ2VEYXRhLnN1bW1hcnlUb3RhbCArIDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzaG93Q29uZmlybVBhZ2UocmFjdGl2ZSwgdHJ1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBlcnJvcihtZXNzYWdlKSB7XG4gICAgICAgICAgICAvLyBUT0RPIGhhbmRsZSBhbnkgZXJyb3JzIHRoYXQgb2NjdXIgcG9zdGluZyBhIHJlYWN0aW9uXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcImVycm9yIHBvc3RpbmcgcGx1cyBvbmU6IFwiICsgbWVzc2FnZSk7XG4gICAgICAgIH1cbiAgICB9O1xufVxuXG5mdW5jdGlvbiBjb21wdXRlTGF5b3V0RGF0YShyZWFjdGlvbnNEYXRhLCBjb2xvcnMpIHtcbiAgICAvLyBUT0RPIFZlcmlmeSB0aGF0IHRoZSByZWFjdGlvbnNEYXRhIGlzIGNvbWluZyBiYWNrIGZyb20gdGhlIHNlcnZlciBzb3J0ZWQuIElmIG5vdCwgc29ydCBpdCBhZnRlciBpdHMgZmV0Y2hlZC5cblxuICAgIHZhciBudW1SZWFjdGlvbnMgPSByZWFjdGlvbnNEYXRhLmxlbmd0aDtcbiAgICBpZiAobnVtUmVhY3Rpb25zID09IDApIHtcbiAgICAgICAgcmV0dXJuIHt9OyAvLyBUT0RPIGNsZWFuIHRoaXMgdXBcbiAgICB9XG4gICAgLy8gVE9ETzogQ29waWVkIGNvZGUgZnJvbSBlbmdhZ2VfZnVsbC5jcmVhdGVUYWdCdWNrZXRzXG4gICAgdmFyIG1heCA9IHJlYWN0aW9uc0RhdGFbMF0uY291bnQ7XG4gICAgdmFyIG1lZGlhbiA9IHJlYWN0aW9uc0RhdGFbIE1hdGguZmxvb3IocmVhY3Rpb25zRGF0YS5sZW5ndGgvMikgXS5jb3VudDtcbiAgICB2YXIgbWluID0gcmVhY3Rpb25zRGF0YVsgcmVhY3Rpb25zRGF0YS5sZW5ndGgtMSBdLmNvdW50O1xuICAgIHZhciB0b3RhbCA9IDA7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBudW1SZWFjdGlvbnM7IGkrKykge1xuICAgICAgICB0b3RhbCArPSByZWFjdGlvbnNEYXRhW2ldLmNvdW50O1xuICAgIH1cbiAgICB2YXIgYXZlcmFnZSA9IE1hdGguZmxvb3IodG90YWwgLyBudW1SZWFjdGlvbnMpO1xuICAgIHZhciBtaWRWYWx1ZSA9ICggbWVkaWFuID4gYXZlcmFnZSApID8gbWVkaWFuIDogYXZlcmFnZTtcblxuICAgIHZhciBsYXlvdXRDbGFzc2VzID0gW107XG4gICAgdmFyIG51bUhhbGZzaWVzID0gMDtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG51bVJlYWN0aW9uczsgaSsrKSB7XG4gICAgICAgIGlmIChyZWFjdGlvbnNEYXRhW2ldLmNvdW50ID4gbWlkVmFsdWUpIHtcbiAgICAgICAgICAgIGxheW91dENsYXNzZXNbaV0gPSAnZnVsbCc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsYXlvdXRDbGFzc2VzW2ldID0gJ2hhbGYnO1xuICAgICAgICAgICAgbnVtSGFsZnNpZXMrKztcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAobnVtSGFsZnNpZXMgJSAyICE9PTApIHtcbiAgICAgICAgbGF5b3V0Q2xhc3Nlc1tudW1SZWFjdGlvbnMgLSAxXSA9ICdmdWxsJzsgLy8gSWYgdGhlcmUgYXJlIGFuIG9kZCBudW1iZXIsIHRoZSBsYXN0IG9uZSBnb2VzIGZ1bGwuXG4gICAgfVxuXG4gICAgdmFyIGJhY2tncm91bmRDb2xvcnMgPSBbXTtcbiAgICB2YXIgY29sb3JJbmRleCA9IDA7XG4gICAgdmFyIHBhaXJXaXRoTmV4dCA9IDA7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBudW1SZWFjdGlvbnM7IGkrKykge1xuICAgICAgICBiYWNrZ3JvdW5kQ29sb3JzW2ldID0gY29sb3JzW2NvbG9ySW5kZXggJSBjb2xvcnMubGVuZ3RoXTtcbiAgICAgICAgaWYgKGxheW91dENsYXNzZXNbaV0gPT09ICdmdWxsJykge1xuICAgICAgICAgICAgY29sb3JJbmRleCsrO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gVE9ETyBnb3R0YSBiZSBhYmxlIHRvIG1ha2UgdGhpcyBzaW1wbGVyXG4gICAgICAgICAgICBpZiAocGFpcldpdGhOZXh0ID4gMCkge1xuICAgICAgICAgICAgICAgIHBhaXJXaXRoTmV4dC0tO1xuICAgICAgICAgICAgICAgIGlmIChwYWlyV2l0aE5leHQgPT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBjb2xvckluZGV4Kys7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBwYWlyV2l0aE5leHQgPSAxOyAvLyBJZiB3ZSB3YW50IHRvIGFsbG93IE4gYm94ZXMgcGVyIHJvdywgdGhpcyBudW1iZXIgd291bGQgYmVjb21lIGNvbmRpdGlvbmFsLlxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgbGF5b3V0Q2xhc3NlczogbGF5b3V0Q2xhc3NlcyxcbiAgICAgICAgYmFja2dyb3VuZENvbG9yczogYmFja2dyb3VuZENvbG9yc1xuICAgIH07XG59XG5cbmZ1bmN0aW9uIHJvb3RFbGVtZW50KHJhY3RpdmUpIHtcbiAgICByZXR1cm4gcmFjdGl2ZS5maW5kKCcuYW50ZW5uYS1yZWFjdGlvbnMtd2lkZ2V0Jyk7XG59XG5cbnZhciBwYWdlWiA9IDEwMDA7IC8vIEl0J3Mgc2FmZSBmb3IgdGhpcyB2YWx1ZSB0byBnbyBhY3Jvc3MgaW5zdGFuY2VzLiBXZSBqdXN0IG5lZWQgaXQgdG8gY29udGludW91c2x5IGluY3JlYXNlIChtYXggdmFsdWUgaXMgb3ZlciAyIGJpbGxpb24pLlxuXG5mdW5jdGlvbiBzaG93UGFnZShwYWdlU2VsZWN0b3IsIHJhY3RpdmUsIGFuaW1hdGUsIG92ZXJsYXkpIHtcbiAgICB2YXIgJHJvb3QgPSAkKHJvb3RFbGVtZW50KHJhY3RpdmUpKTtcbiAgICB2YXIgJHBhZ2UgPSAkcm9vdC5maW5kKHBhZ2VTZWxlY3Rvcik7XG4gICAgJHBhZ2UuY3NzKCd6LWluZGV4JywgcGFnZVopO1xuICAgIHBhZ2VaICs9IDE7XG5cbiAgICAkcGFnZS50b2dnbGVDbGFzcygnYW50ZW5uYS1wYWdlLWFuaW1hdGUnLCBhbmltYXRlKTtcblxuICAgIGlmIChvdmVybGF5KSB7XG4gICAgICAgIC8vIEluIHRoZSBvdmVybGF5IGNhc2UsIHNpemUgdGhlIHBhZ2UgdG8gbWF0Y2ggd2hhdGV2ZXIgcGFnZSBpcyBjdXJyZW50bHkgc2hvd2luZyBhbmQgdGhlbiBtYWtlIGl0IGFjdGl2ZSAodGhlcmUgd2lsbCBiZSB0d28gJ2FjdGl2ZScgcGFnZXMpXG4gICAgICAgIHZhciAkY3VycmVudCA9ICRyb290LmZpbmQoJy5hbnRlbm5hLXBhZ2UtYWN0aXZlJyk7XG4gICAgICAgICRwYWdlLmhlaWdodCgkY3VycmVudC5oZWlnaHQoKSk7XG4gICAgICAgICRwYWdlLmFkZENsYXNzKCdhbnRlbm5hLXBhZ2UtYWN0aXZlJyk7XG4gICAgfSBlbHNlIGlmIChhbmltYXRlKSB7XG4gICAgICAgIFRyYW5zaXRpb25VdGlsLnRvZ2dsZUNsYXNzKCRwYWdlLCAnYW50ZW5uYS1wYWdlLWFjdGl2ZScsIHRydWUsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy8gQWZ0ZXIgdGhlIG5ldyBwYWdlIHNsaWRlcyBpbnRvIHBvc2l0aW9uLCBtb3ZlIHRoZSBvdGhlciBwYWdlcyBiYWNrIG91dCBvZiB0aGUgdmlld2FibGUgYXJlYVxuICAgICAgICAgICAgJHJvb3QuZmluZCgnLmFudGVubmEtcGFnZScpLm5vdChwYWdlU2VsZWN0b3IpLnJlbW92ZUNsYXNzKCdhbnRlbm5hLXBhZ2UtYWN0aXZlJyk7XG4gICAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICAgICRwYWdlLmFkZENsYXNzKCdhbnRlbm5hLXBhZ2UtYWN0aXZlJyk7XG4gICAgICAgICRyb290LmZpbmQoJy5hbnRlbm5hLXBhZ2UnKS5ub3QocGFnZVNlbGVjdG9yKS5yZW1vdmVDbGFzcygnYW50ZW5uYS1wYWdlLWFjdGl2ZScpO1xuICAgIH1cbiAgICBzaXplQm9keVRvRml0KHJhY3RpdmUsICRwYWdlLCBhbmltYXRlKTtcbn1cblxuZnVuY3Rpb24gc2l6ZUJvZHlUb0ZpdChyYWN0aXZlLCAkZWxlbWVudCwgYW5pbWF0ZSkge1xuICAgIHZhciAkcm9vdCA9ICQocm9vdEVsZW1lbnQocmFjdGl2ZSkpO1xuICAgIHZhciAkYm9keSA9ICRyb290LmZpbmQoJy5hbnRlbm5hLWJvZHknKTtcbiAgICB2YXIgY3VycmVudEhlaWdodCA9ICRib2R5LmNzcygnaGVpZ2h0Jyk7XG4gICAgJGJvZHkuY3NzKHsgaGVpZ2h0OiAnJyB9KTsgLy8gQ2xlYXIgYW55IHByZXZpb3VzbHkgY29tcHV0ZWQgaGVpZ2h0IHNvIHdlIGdldCBhIGZyZXNoIGNvbXB1dGF0aW9uIG9mIHRoZSBjaGlsZCBoZWlnaHRzXG4gICAgdmFyIG5ld0hlaWdodCA9IE1hdGgubWluKDMwMCwgJGVsZW1lbnQuZ2V0KDApLnNjcm9sbEhlaWdodCk7XG4gICAgaWYgKGFuaW1hdGUpIHtcbiAgICAgICAgJGJvZHkuY3NzKHsgaGVpZ2h0OiBjdXJyZW50SGVpZ2h0IH0pO1xuICAgICAgICAkYm9keS5hbmltYXRlKHsgaGVpZ2h0OiBuZXdIZWlnaHQgfSwgMjAwKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAkYm9keS5jc3MoeyBoZWlnaHQ6IG5ld0hlaWdodCB9KTtcbiAgICB9XG4gICAgLy8gVE9ETzogd2UgbWlnaHQgbm90IG5lZWQgd2lkdGggcmVzaXppbmcgYXQgYWxsLlxuICAgIHZhciBtaW5XaWR0aCA9ICRlbGVtZW50LmNzcygnbWluLXdpZHRoJyk7XG4gICAgdmFyIHdpZHRoID0gcGFyc2VJbnQobWluV2lkdGgpO1xuICAgIGlmICh3aWR0aCA+IDApIHtcbiAgICAgICAgaWYgKGFuaW1hdGUpIHtcbiAgICAgICAgICAgICRyb290LmFuaW1hdGUoeyB3aWR0aDogd2lkdGggfSwgMjAwKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICRyb290LmNzcyh7IHdpZHRoOiB3aWR0aCB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvL3ZhciB3aWR0aCA9IChwYXJzZUludChtaW5XaWR0aCkgPiAwKSA/IG1pbldpZHRoOiAnJztcbiAgICAvL2lmIChhbmltYXRlKSB7XG4gICAgLy8gICAgJHJvb3QuYW5pbWF0ZSh7IHdpZHRoOiB3aWR0aCB9KTtcbiAgICAvL30gZWxzZSB7XG4gICAgLy8gICAgJHJvb3QuY3NzKHsgd2lkdGg6IHdpZHRoIH0pO1xuICAgIC8vfVxufVxuXG5mdW5jdGlvbiBzaG93Rm9vdGVyKGZvb3RlclNlbGVjdG9yLCByYWN0aXZlKSB7XG4gICAgdmFyICRyb290ID0gJChyb290RWxlbWVudChyYWN0aXZlKSk7XG4gICAgdmFyICRmb290ZXIgPSAkcm9vdC5maW5kKGZvb3RlclNlbGVjdG9yKTtcbiAgICAkZm9vdGVyLmNzcygnei1pbmRleCcsIHBhZ2VaKTtcbiAgICBwYWdlWiArPSAxO1xufVxuXG5mdW5jdGlvbiBzaG93UmVhY3Rpb25zUGFnZShyYWN0aXZlLCBhbmltYXRlKSB7XG4gICAgc2hvd1BhZ2UoJy5hbnRlbm5hLXJlYWN0aW9ucy1wYWdlJywgcmFjdGl2ZSwgYW5pbWF0ZSk7XG4gICAgc2hvd0Zvb3RlcignLmFudGVubmEtcmVhY3Rpb25zLWZvb3RlcicsIHJhY3RpdmUpO1xufVxuXG5mdW5jdGlvbiBzaG93RGVmYXVsdFJlYWN0aW9uc1BhZ2UoY29udGFpbmVyRWxlbWVudCwgY29udGVudERhdGEsIHJhY3RpdmUsIGFuaW1hdGUpIHtcbiAgICBpZiAoIWNvbnRlbnREYXRhLmxvY2F0aW9uICYmICFjb250ZW50RGF0YS5ib2R5KSB7XG4gICAgICAgIFJhbmdlLmdyYWJOb2RlKGNvbnRhaW5lckVsZW1lbnQuZ2V0KDApLCBmdW5jdGlvbiAodGV4dCwgbG9jYXRpb24pIHtcbiAgICAgICAgICAgIGNvbnRlbnREYXRhLmxvY2F0aW9uID0gbG9jYXRpb247XG4gICAgICAgICAgICBjb250ZW50RGF0YS5ib2R5ID0gdGV4dDtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHNob3dQYWdlKCcuYW50ZW5uYS1kZWZhdWx0LXBhZ2UnLCByYWN0aXZlLCBhbmltYXRlKTtcbiAgICBzaG93Rm9vdGVyKCcuYW50ZW5uYS1kZWZhdWx0LWZvb3RlcicsIHJhY3RpdmUpO1xufVxuXG5mdW5jdGlvbiBzaG93Q29uZmlybVBhZ2UocmFjdGl2ZSwgYW5pbWF0ZSkge1xuICAgIHNob3dQYWdlKCcuYW50ZW5uYS1jb25maXJtLXBhZ2UnLCByYWN0aXZlLCBhbmltYXRlKTtcbiAgICBzaG93Rm9vdGVyKCcuYW50ZW5uYS1jb25maXJtLWZvb3RlcicsIHJhY3RpdmUpO1xufVxuXG5mdW5jdGlvbiBvcGVuV2luZG93KGVsZW1lbnRPckNvb3JkcywgY29udGFpbmVyRWxlbWVudCwgY29udGVudERhdGEsIHJlYWN0aW9uc0RhdGEsIHJhY3RpdmUpIHtcbiAgICAkKCcuYW50ZW5uYS1yZWFjdGlvbnMtd2lkZ2V0JykudHJpZ2dlcignZm9jdXNvdXQnKTsgLy8gUHJvbXB0IGFueSBvdGhlciBvcGVuIHdpbmRvd3MgdG8gY2xvc2UuXG4gICAgdmFyIGNvb3JkcztcbiAgICBpZiAoZWxlbWVudE9yQ29vcmRzLnRvcCAmJiBlbGVtZW50T3JDb29yZHMubGVmdCkge1xuICAgICAgICBjb29yZHMgPSBlbGVtZW50T3JDb29yZHM7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdmFyICRyZWxhdGl2ZUVsZW1lbnQgPSAkKGVsZW1lbnRPckNvb3Jkcyk7XG4gICAgICAgIHZhciBvZmZzZXQgPSAkcmVsYXRpdmVFbGVtZW50Lm9mZnNldCgpO1xuICAgICAgICBjb29yZHMgPSB7XG4gICAgICAgICAgICB0b3A6IG9mZnNldC50b3AsXG4gICAgICAgICAgICBsZWZ0OiBvZmZzZXQubGVmdFxuICAgICAgICB9O1xuICAgIH1cbiAgICAvLyBUT0RPOiBMb29rIGF0IHdoZXRoZXIgd2UncmUgb3BlbmluZyBvZmYgc2NyZWVuIGFuZCBhZGp1c3QgdGhlIGNvb3JkcyBpZiBuZWVkZWRcbiAgICB2YXIgJHJvb3RFbGVtZW50ID0gJChyb290RWxlbWVudChyYWN0aXZlKSk7XG4gICAgJHJvb3RFbGVtZW50LnN0b3AodHJ1ZSwgdHJ1ZSkuYWRkQ2xhc3MoJ29wZW4nKS5jc3MoY29vcmRzKTtcblxuICAgIGlmIChyZWFjdGlvbnNEYXRhLmxlbmd0aCA+IDApIHtcbiAgICAgICAgc2hvd1JlYWN0aW9uc1BhZ2UocmFjdGl2ZSwgZmFsc2UpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFRPRE8gYWxsb3cgdG8gb3ZlcnJpZGUgYW5kIGZvcmNlIHNob3dpbmcgb2YgZGVmYXVsdFxuICAgICAgICBzaG93RGVmYXVsdFJlYWN0aW9uc1BhZ2UoY29udGFpbmVyRWxlbWVudCwgY29udGVudERhdGEsIHJhY3RpdmUsIGZhbHNlKTtcbiAgICB9XG5cbiAgICBzZXR1cFdpbmRvd0Nsb3NlKHJhY3RpdmUpO1xufVxuXG5mdW5jdGlvbiBzZXR1cFdpbmRvd0Nsb3NlKHJhY3RpdmUpIHtcbiAgICB2YXIgJHJvb3RFbGVtZW50ID0gJChyb290RWxlbWVudChyYWN0aXZlKSk7XG5cbiAgICAvLyBUT0RPOiBJZiB5b3UgbW91c2Ugb3ZlciB0aGUgdHJpZ2dlciBzbG93bHkgZnJvbSB0aGUgdG9wIGxlZnQsIHRoZSB3aW5kb3cgb3BlbnMgd2l0aG91dCBiZWluZyB1bmRlciB0aGUgY3Vyc29yLFxuICAgIC8vICAgICAgIHNvIG5vIG1vdXNlb3V0IGV2ZW50IGlzIHJlY2VpdmVkLiBXaGVuIHdlIG9wZW4gdGhlIHdpbmRvdywgd2Ugc2hvdWxkIHByb2JhYmx5IGp1c3Qgc2Nvb3QgaXQgdXAgc2xpZ2h0bHlcbiAgICAvLyAgICAgICBpZiBuZWVkZWQgdG8gYXNzdXJlIHRoYXQgaXQncyB1bmRlciB0aGUgY3Vyc29yLiBBbHRlcm5hdGl2ZWx5LCB3ZSBjb3VsZCBhZGp1c3QgdGhlIG1vdXNlb3ZlciBhcmVhIHRvIG1hdGNoXG4gICAgLy8gICAgICAgdGhlIHJlZ2lvbiB0aGF0IHRoZSB3aW5kb3cgb3BlbnMuXG4gICAgJHJvb3RFbGVtZW50XG4gICAgICAgIC5vbignbW91c2VvdXQuYW50ZW5uYScsIGRlbGF5ZWRDbG9zZVdpbmRvdylcbiAgICAgICAgLm9uKCdtb3VzZW92ZXIuYW50ZW5uYScsIGtlZXBXaW5kb3dPcGVuKVxuICAgICAgICAub24oJ2ZvY3VzaW4uYW50ZW5uYScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy8gT25jZSB0aGUgd2luZG93IGhhcyBmb2N1cywgZG9uJ3QgY2xvc2UgaXQgb24gbW91c2VvdXQuXG4gICAgICAgICAgICBrZWVwV2luZG93T3BlbigpO1xuICAgICAgICAgICAgJHJvb3RFbGVtZW50Lm9mZignbW91c2VvdXQuYW50ZW5uYScpO1xuICAgICAgICAgICAgJHJvb3RFbGVtZW50Lm9mZignbW91c2VvdmVyLmFudGVubmEnKTtcbiAgICAgICAgfSlcbiAgICAgICAgLm9uKCdmb2N1c291dC5hbnRlbm5hJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBjbG9zZVdpbmRvdygpO1xuICAgICAgICB9KTtcbiAgICAkKGRvY3VtZW50KS5vbignY2xpY2suYW50ZW5uYScsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGlmICgkKGV2ZW50LnRhcmdldCkuY2xvc2VzdCgnLmFudGVubmEtcmVhY3Rpb25zLXdpZGdldCcpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgY2xvc2VXaW5kb3coKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgdmFyIGNsb3NlVGltZXI7XG5cbiAgICBmdW5jdGlvbiBkZWxheWVkQ2xvc2VXaW5kb3coKSB7XG4gICAgICAgIGNsb3NlVGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY2xvc2VUaW1lciA9IG51bGw7XG4gICAgICAgICAgICBjbG9zZVdpbmRvdygpO1xuICAgICAgICB9LCA1MDApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGtlZXBXaW5kb3dPcGVuKCkge1xuICAgICAgICBjbGVhclRpbWVvdXQoY2xvc2VUaW1lcik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY2xvc2VXaW5kb3coKSB7XG4gICAgICAgIGNsZWFyVGltZW91dChjbG9zZVRpbWVyKTtcblxuICAgICAgICAkcm9vdEVsZW1lbnQuc3RvcCh0cnVlLCB0cnVlKS5mYWRlT3V0KCdmYXN0JywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAkcm9vdEVsZW1lbnQuY3NzKCdkaXNwbGF5JywgJycpOyAvLyBDbGVhciB0aGUgZGlzcGxheTpub25lIHRoYXQgZmFkZU91dCBwdXRzIG9uIHRoZSBlbGVtZW50XG4gICAgICAgICAgICAkcm9vdEVsZW1lbnQucmVtb3ZlQ2xhc3MoJ29wZW4nKTtcbiAgICAgICAgfSk7XG4gICAgICAgICRyb290RWxlbWVudC5vZmYoJy5hbnRlbm5hJyk7IC8vIFVuYmluZCBhbGwgb2YgdGhlIGhhbmRsZXJzIGluIG91ciBuYW1lc3BhY2VcbiAgICAgICAgJChkb2N1bWVudCkub2ZmKCdjbGljay5hbnRlbm5hJyk7XG4gICAgICAgIFJhbmdlLmNsZWFySGlnaGxpZ2h0cygpO1xuICAgICAgICByYWN0aXZlLnRlYXJkb3duKCk7XG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgb3Blbjogb3BlblJlYWN0aW9uc1dpZGdldFxufTsiLCJ2YXIgUmFuZ3lQcm92aWRlciA9IHJlcXVpcmUoJy4vdXRpbHMvcmFuZ3ktcHJvdmlkZXInKTtcbnZhciBKUXVlcnlQcm92aWRlciA9IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJyk7XG52YXIgaXNPZmZsaW5lID0gcmVxdWlyZSgnLi91dGlscy9vZmZsaW5lJyk7XG52YXIgVVJMcyA9IHJlcXVpcmUoJy4vdXRpbHMvdXJscycpO1xuXG52YXIgYmFzZVVybCA9IFVSTHMuYW50ZW5uYUhvbWUoKTtcblxudmFyIHNjcmlwdHMgPSBbXG4gICAge3NyYzogJy8vY2RuanMuY2xvdWRmbGFyZS5jb20vYWpheC9saWJzL2pxdWVyeS8yLjEuNC9qcXVlcnkubWluLmpzJywgY2FsbGJhY2s6IEpRdWVyeVByb3ZpZGVyLmxvYWRlZH0sXG4gICAge3NyYzogJy8vY2RuanMuY2xvdWRmbGFyZS5jb20vYWpheC9saWJzL3JhY3RpdmUvMC43LjMvcmFjdGl2ZS5ydW50aW1lLm1pbi5qcyd9LFxuICAgIHtzcmM6IGJhc2VVcmwgKyAnL3N0YXRpYy93aWRnZXQtbmV3L2xpYi9yYW5neS1jb21waWxlZC5qcycsIGNhbGxiYWNrOiBSYW5neVByb3ZpZGVyLmxvYWRlZCwgYWJvdXRUb0xvYWQ6IFJhbmd5UHJvdmlkZXIuYWJvdXRUb0xvYWR9IC8vIFRPRE8gbWluaWZ5IGFuZCBob3N0IHRoaXMgc29tZXdoZXJlXG5dO1xuaWYgKGlzT2ZmbGluZSkge1xuICAgIC8vIFVzZSB0aGUgb2ZmbGluZSB2ZXJzaW9ucyBvZiB0aGUgbGlicmFyaWVzIGZvciBkZXZlbG9wbWVudC5cbiAgICBzY3JpcHRzID0gW1xuICAgICAgICB7c3JjOiBiYXNlVXJsICsgJy9zdGF0aWMvanMvY2RuL2pxdWVyeS8yLjEuNC9qcXVlcnkuanMnLCBjYWxsYmFjazogSlF1ZXJ5UHJvdmlkZXIubG9hZGVkfSxcbiAgICAgICAge3NyYzogYmFzZVVybCArICcvc3RhdGljL2pzL2Nkbi9yYWN0aXZlLzAuNy4zL3JhY3RpdmUucnVudGltZS5qcyd9LFxuICAgICAgICB7c3JjOiBiYXNlVXJsICsgJy9zdGF0aWMvd2lkZ2V0LW5ldy9saWIvcmFuZ3ktY29tcGlsZWQuanMnLCBjYWxsYmFjazogUmFuZ3lQcm92aWRlci5sb2FkZWQsIGFib3V0VG9Mb2FkOiBSYW5neVByb3ZpZGVyLmFib3V0VG9Mb2FkfVxuICAgIF07XG59XG5cbmZ1bmN0aW9uIGxvYWRBbGxTY3JpcHRzKGxvYWRlZENhbGxiYWNrKSB7XG4gICAgbG9hZFNjcmlwdHMoc2NyaXB0cywgbG9hZGVkQ2FsbGJhY2spO1xufVxuXG5mdW5jdGlvbiBsb2FkU2NyaXB0cyhzY3JpcHRzLCBsb2FkZWRDYWxsYmFjaykge1xuICAgIHZhciBsb2FkaW5nQ291bnQgPSBzY3JpcHRzLmxlbmd0aDtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNjcmlwdHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIHNjcmlwdCA9IHNjcmlwdHNbaV07XG4gICAgICAgIGlmIChzY3JpcHQuYWJvdXRUb0xvYWQpIHsgc2NyaXB0LmFib3V0VG9Mb2FkKCk7IH1cbiAgICAgICAgbG9hZFNjcmlwdChzY3JpcHQuc3JjLCBmdW5jdGlvbihzY3JpcHRDYWxsYmFjaykge1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmIChzY3JpcHRDYWxsYmFjaykgc2NyaXB0Q2FsbGJhY2soKTtcbiAgICAgICAgICAgICAgICBsb2FkaW5nQ291bnQgPSBsb2FkaW5nQ291bnQgLSAxO1xuICAgICAgICAgICAgICAgIGlmIChsb2FkaW5nQ291bnQgPT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAobG9hZGVkQ2FsbGJhY2spIGxvYWRlZENhbGxiYWNrKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSAoc2NyaXB0LmNhbGxiYWNrKSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBsb2FkU2NyaXB0KHNyYywgY2FsbGJhY2spIHtcbiAgICB2YXIgaGVhZCA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF07XG4gICAgaWYgKGhlYWQpIHtcbiAgICAgICAgdmFyIHNjcmlwdFRhZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuICAgICAgICBzY3JpcHRUYWcuc2V0QXR0cmlidXRlKCdzcmMnLCBzcmMpO1xuICAgICAgICBzY3JpcHRUYWcuc2V0QXR0cmlidXRlKCd0eXBlJywndGV4dC9qYXZhc2NyaXB0Jyk7XG5cbiAgICAgICAgaWYgKHNjcmlwdFRhZy5yZWFkeVN0YXRlKSB7IC8vIElFLCBpbmNsLiBJRTlcbiAgICAgICAgICAgIHNjcmlwdFRhZy5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBpZiAoc2NyaXB0VGFnLnJlYWR5U3RhdGUgPT0gXCJsb2FkZWRcIiB8fCBzY3JpcHRUYWcucmVhZHlTdGF0ZSA9PSBcImNvbXBsZXRlXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgc2NyaXB0VGFnLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjYWxsYmFjaykgeyBjYWxsYmFjaygpOyB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNjcmlwdFRhZy5vbmxvYWQgPSBmdW5jdGlvbigpIHsgLy8gT3RoZXIgYnJvd3NlcnNcbiAgICAgICAgICAgICAgICBpZiAoY2FsbGJhY2spIHsgY2FsbGJhY2soKTsgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIGhlYWQuYXBwZW5kQ2hpbGQoc2NyaXB0VGFnKTtcbiAgICB9XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBsb2FkOiBsb2FkQWxsU2NyaXB0c1xufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi91dGlscy9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciBSZWFjdGlvbnNXaWRnZXQgPSByZXF1aXJlKCcuL3JlYWN0aW9ucy13aWRnZXQnKTtcblxuZnVuY3Rpb24gY3JlYXRlU3VtbWFyeVdpZGdldChjb250YWluZXIsIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBkZWZhdWx0UmVhY3Rpb25zLCBncm91cFNldHRpbmdzKSB7XG4gICAgLy8vLyBUT0RPIHJlcGxhY2UgZWxlbWVudFxuICAgIHZhciByYWN0aXZlID0gUmFjdGl2ZSh7XG4gICAgICAgIGVsOiBjb250YWluZXIsXG4gICAgICAgIGRhdGE6IHBhZ2VEYXRhLFxuICAgICAgICBtYWdpYzogdHJ1ZSxcbiAgICAgICAgdGVtcGxhdGU6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9zdW1tYXJ5LXdpZGdldC5oYnMuaHRtbCcpXG4gICAgfSk7XG4gICAgJChyb290RWxlbWVudChyYWN0aXZlKSkub24oJ21vdXNlZW50ZXInLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgIG9wZW5SZWFjdGlvbnNXaW5kb3coY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGRlZmF1bHRSZWFjdGlvbnMsIGdyb3VwU2V0dGluZ3MsIHJhY3RpdmUpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiByb290RWxlbWVudChyYWN0aXZlKSB7XG4gICAgLy8gVE9ETzogZ290dGEgYmUgYSBiZXR0ZXIgd2F5IHRvIGdldCB0aGlzXG4gICAgcmV0dXJuIHJhY3RpdmUuZmluZCgnLmFudC1zdW1tYXJ5LXdpZGdldCcpO1xufVxuXG5mdW5jdGlvbiBvcGVuUmVhY3Rpb25zV2luZG93KGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBkZWZhdWx0UmVhY3Rpb25zLCBncm91cFNldHRpbmdzLCByYWN0aXZlKSB7XG4gICAgdmFyIHJlYWN0aW9uc1dpZGdldE9wdGlvbnMgPSB7XG4gICAgICAgIHJlYWN0aW9uc0RhdGE6IHBhZ2VEYXRhLnN1bW1hcnlSZWFjdGlvbnMsXG4gICAgICAgIGNvbnRhaW5lckRhdGE6IGNvbnRhaW5lckRhdGEsXG4gICAgICAgIGRlZmF1bHRSZWFjdGlvbnM6IGRlZmF1bHRSZWFjdGlvbnMsXG4gICAgICAgIHBhZ2VEYXRhOiBwYWdlRGF0YSxcbiAgICAgICAgZ3JvdXBTZXR0aW5nczogZ3JvdXBTZXR0aW5ncyxcbiAgICAgICAgY29udGVudERhdGE6IHsgdHlwZTogJ3BhZ2UnIH1cbiAgICB9O1xuICAgIFJlYWN0aW9uc1dpZGdldC5vcGVuKHJlYWN0aW9uc1dpZGdldE9wdGlvbnMsIHJvb3RFbGVtZW50KHJhY3RpdmUpKTtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZTogY3JlYXRlU3VtbWFyeVdpZGdldFxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi91dGlscy9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciBQb3B1cFdpZGdldCA9IHJlcXVpcmUoJy4vcG9wdXAtd2lkZ2V0Jyk7XG52YXIgUmFuZ2UgPSByZXF1aXJlKCcuL3V0aWxzL3JhbmdlJyk7XG52YXIgUmVhY3Rpb25zV2lkZ2V0ID0gcmVxdWlyZSgnLi9yZWFjdGlvbnMtd2lkZ2V0Jyk7XG5cblxuZnVuY3Rpb24gY3JlYXRlUmVhY3RhYmxlVGV4dChvcHRpb25zKSB7XG4gICAgLy8gVE9ETzogaW1wb3NlIGFuIHVwcGVyIGxpbWl0IG9uIHRoZSBsZW5ndGggb2YgdGV4dCB0aGF0IGNhbiBiZSByZWFjdGVkIHRvPyAoYXBwbGllcyB0byB0aGUgaW5kaWNhdG9yLXdpZGdldCB0b28pXG4gICAgdmFyICRjb250YWluZXJFbGVtZW50ID0gb3B0aW9ucy5jb250YWluZXJFbGVtZW50O1xuICAgIHZhciBleGNsdWRlTm9kZSA9IG9wdGlvbnMuZXhjbHVkZU5vZGU7XG4gICAgdmFyIHJlYWN0aW9uc1dpZGdldE9wdGlvbnMgPSB7XG4gICAgICAgIHJlYWN0aW9uc0RhdGE6IFtdLCAvLyBBbHdheXMgb3BlbiB3aXRoIHRoZSBkZWZhdWx0IHJlYWN0aW9uc1xuICAgICAgICBjb250YWluZXJEYXRhOiBvcHRpb25zLmNvbnRhaW5lckRhdGEsXG4gICAgICAgIGNvbnRlbnREYXRhOiB7IHR5cGU6ICd0ZXh0JyB9LFxuICAgICAgICBjb250YWluZXJFbGVtZW50OiAkY29udGFpbmVyRWxlbWVudCxcbiAgICAgICAgZGVmYXVsdFJlYWN0aW9uczogb3B0aW9ucy5kZWZhdWx0UmVhY3Rpb25zLFxuICAgICAgICBwYWdlRGF0YTogb3B0aW9ucy5wYWdlRGF0YSxcbiAgICAgICAgZ3JvdXBTZXR0aW5nczogb3B0aW9ucy5ncm91cFNldHRpbmdzXG4gICAgfTtcblxuICAgICRjb250YWluZXJFbGVtZW50Lm9uKCdtb3VzZXVwJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdmFyIG5vZGUgPSAkY29udGFpbmVyRWxlbWVudC5nZXQoMCk7XG4gICAgICAgIHZhciBwb2ludCA9IFJhbmdlLmdldFNlbGVjdGlvbkVuZFBvaW50KG5vZGUsIGV2ZW50LCBleGNsdWRlTm9kZSk7XG4gICAgICAgIGlmIChwb2ludCkge1xuICAgICAgICAgICAgdmFyIGNvb3JkaW5hdGVzID0geyB0b3A6IHBvaW50LnksIGxlZnQ6IHBvaW50LnggfTtcbiAgICAgICAgICAgIFBvcHVwV2lkZ2V0LnNob3coY29vcmRpbmF0ZXMsIGdyYWJTZWxlY3Rpb25BbmRPcGVuKG5vZGUsIGNvb3JkaW5hdGVzLCByZWFjdGlvbnNXaWRnZXRPcHRpb25zLCBleGNsdWRlTm9kZSkpO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGdyYWJTZWxlY3Rpb25BbmRPcGVuKG5vZGUsIGNvb3JkaW5hdGVzLCByZWFjdGlvbnNXaWRnZXRPcHRpb25zLCBleGNsdWRlTm9kZSkge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgUmFuZ2UuZ3JhYlNlbGVjdGlvbihub2RlLCBmdW5jdGlvbih0ZXh0LCBsb2NhdGlvbikge1xuICAgICAgICAgICAgcmVhY3Rpb25zV2lkZ2V0T3B0aW9ucy5jb250ZW50RGF0YS5sb2NhdGlvbiA9IGxvY2F0aW9uO1xuICAgICAgICAgICAgcmVhY3Rpb25zV2lkZ2V0T3B0aW9ucy5jb250ZW50RGF0YS5ib2R5ID0gdGV4dDtcbiAgICAgICAgICAgIFJlYWN0aW9uc1dpZGdldC5vcGVuKHJlYWN0aW9uc1dpZGdldE9wdGlvbnMsIGNvb3JkaW5hdGVzKTtcbiAgICAgICAgfSwgZXhjbHVkZU5vZGUpO1xuICAgIH1cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZVJlYWN0YWJsZVRleHQ6IGNyZWF0ZVJlYWN0YWJsZVRleHRcbn07IiwiLy8gVE9ETzogbmVlZHMgYSBiZXR0ZXIgbmFtZSBvbmNlIHRoZSBzY29wZSBpcyBjbGVhclxuXG52YXIgJDsgcmVxdWlyZSgnLi9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciBYRE1DbGllbnQgPSByZXF1aXJlKCcuL3hkbS1jbGllbnQnKTtcbnZhciBVUkxzID0gcmVxdWlyZSgnLi91cmxzJyk7XG5cblxuZnVuY3Rpb24gcG9zdE5ld1JlYWN0aW9uKHJlYWN0aW9uRGF0YSwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGNvbnRlbnREYXRhLCBzdWNjZXNzLCBlcnJvcikge1xuICAgIHZhciBjb250ZW50Qm9keSA9IGNvbnRlbnREYXRhLmJvZHk7XG4gICAgdmFyIGNvbnRlbnRUeXBlID0gY29udGVudERhdGEudHlwZTtcbiAgICB2YXIgY29udGVudExvY2F0aW9uID0gY29udGVudERhdGEubG9jYXRpb247XG4gICAgdmFyIGNvbnRlbnREaW1lbnNpb25zID0gY29udGVudERhdGEuZGltZW5zaW9ucztcbiAgICBYRE1DbGllbnQuZ2V0VXNlcihmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICB2YXIgdXNlckluZm8gPSByZXNwb25zZS5kYXRhO1xuICAgICAgICAvLyBUT0RPIGV4dHJhY3QgdGhlIHNoYXBlIG9mIHRoaXMgZGF0YSBhbmQgcG9zc2libHkgdGhlIHdob2xlIEFQSSBjYWxsXG4gICAgICAgIC8vIFRPRE8gZmlndXJlIG91dCB3aGljaCBwYXJ0cyBkb24ndCBnZXQgcGFzc2VkIGZvciBhIG5ldyByZWFjdGlvblxuICAgICAgICAvLyBUT0RPIGNvbXB1dGUgZmllbGQgdmFsdWVzIChlLmcuIGNvbnRhaW5lcl9raW5kIGFuZCBjb250ZW50IGluZm8pIGZvciBuZXcgcmVhY3Rpb25zXG4gICAgICAgIHZhciBkYXRhID0ge1xuICAgICAgICAgICAgdGFnOiB7XG4gICAgICAgICAgICAgICAgYm9keTogcmVhY3Rpb25EYXRhLnRleHRcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpc19kZWZhdWx0OiAndHJ1ZScsXG4gICAgICAgICAgICBoYXNoOiBjb250YWluZXJEYXRhLmhhc2gsXG4gICAgICAgICAgICB1c2VyX2lkOiB1c2VySW5mby51c2VyX2lkLFxuICAgICAgICAgICAgYW50X3Rva2VuOiB1c2VySW5mby5hbnRfdG9rZW4sXG4gICAgICAgICAgICBwYWdlX2lkOiBwYWdlRGF0YS5wYWdlSWQsXG4gICAgICAgICAgICBncm91cF9pZDogcGFnZURhdGEuZ3JvdXBJZCxcbiAgICAgICAgICAgIGNvbnRhaW5lcl9raW5kOiBjb250ZW50VHlwZSwgLy8gT25lIG9mICdwYWdlJywgJ3RleHQnLCAnbWVkaWEnLCAnaW1nJ1xuICAgICAgICAgICAgY29udGVudF9ub2RlX2RhdGE6IHtcbiAgICAgICAgICAgICAgICBib2R5OiBjb250ZW50Qm9keSxcbiAgICAgICAgICAgICAgICBraW5kOiBjb250ZW50VHlwZSxcbiAgICAgICAgICAgICAgICBpdGVtX3R5cGU6ICcnIC8vIFRPRE86IGxvb2tzIHVudXNlZCBidXQgVGFnSGFuZGxlciBibG93cyB1cCB3aXRob3V0IGl0LiBDdXJyZW50IGNsaWVudCBwYXNzZXMgaW4gXCJwYWdlXCIgZm9yIHBhZ2UgcmVhY3Rpb25zLlxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBpZiAoY29udGVudExvY2F0aW9uKSB7XG4gICAgICAgICAgICBkYXRhLmNvbnRlbnRfbm9kZV9kYXRhLmxvY2F0aW9uID0gY29udGVudExvY2F0aW9uO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjb250ZW50RGltZW5zaW9ucykge1xuICAgICAgICAgICAgZGF0YS5jb250ZW50X25vZGVfZGF0YS5oZWlnaHQgPSBjb250ZW50RGltZW5zaW9ucy5oZWlnaHQ7XG4gICAgICAgICAgICBkYXRhLmNvbnRlbnRfbm9kZV9kYXRhLndpZHRoID0gY29udGVudERpbWVuc2lvbnMud2lkdGg7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJlYWN0aW9uRGF0YS5pZCkge1xuICAgICAgICAgICAgZGF0YS50YWcuaWQgPSByZWFjdGlvbkRhdGEuaWQ7IC8vIFRPRE8gdGhlIGN1cnJlbnQgY2xpZW50IHNlbmRzIFwiLTEwMVwiIGlmIHRoZXJlJ3Mgbm8gaWQuIGlzIHRoaXMgbmVjZXNzYXJ5P1xuICAgICAgICB9XG4gICAgICAgICQuZ2V0SlNPTlAoVVJMcy5jcmVhdGVSZWFjdGlvblVybCgpLCBkYXRhLCBzdWNjZXNzLCBlcnJvcik7XG4gICAgICAgIC8vdmFyIHJlc3BvbnNlID0geyAvLyBUT0RPOiBqdXN0IGNhcHR1cmluZyB0aGUgYXBpIGZvcm1hdC4uLlxuICAgICAgICAvLyAgICAgICAgZXhpc3Rpbmc6IGpzb24uZXhpc3RpbmcsXG4gICAgICAgIC8vICAgICAgICBpbnRlcmFjdGlvbjoge1xuICAgICAgICAvLyAgICAgICAgICAgIGlkOiBqc29uLmludGVyYWN0aW9uLmlkLFxuICAgICAgICAvLyAgICAgICAgICAgIGludGVyYWN0aW9uX25vZGU6IHtcbiAgICAgICAgLy8gICAgICAgICAgICAgICAgYm9keToganNvbi5pbnRlcmFjdGlvbi5pbnRlcmFjdGlvbl9ub2RlLmJvZHksXG4gICAgICAgIC8vICAgICAgICAgICAgICAgIGlkOiBqc29uLmludGVyYWN0aW9uLmludGVyYWN0aW9uX25vZGUuaWRcbiAgICAgICAgLy8gICAgICAgICAgICB9XG4gICAgICAgIC8vICAgICAgICB9XG4gICAgICAgIC8vICAgIH07XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIHBvc3RQbHVzT25lKHJlYWN0aW9uRGF0YSwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIHN1Y2Nlc3MsIGVycm9yKSB7XG4gICAgWERNQ2xpZW50LmdldFVzZXIoZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgdmFyIHVzZXJJbmZvID0gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgLy8gVE9ETyBleHRyYWN0IHRoZSBzaGFwZSBvZiB0aGlzIGRhdGEgYW5kIHBvc3NpYmx5IHRoZSB3aG9sZSBBUEkgY2FsbFxuICAgICAgICAvLyBUT0RPIGZpZ3VyZSBvdXQgd2hpY2ggcGFydHMgZG9uJ3QgZ2V0IHBhc3NlZCBmb3IgYSBuZXcgcmVhY3Rpb25cbiAgICAgICAgLy8gVE9ETyBjb21wdXRlIGZpZWxkIHZhbHVlcyAoZS5nLiBjb250YWluZXJfa2luZCBhbmQgY29udGVudCBpbmZvKSBmb3IgbmV3IHJlYWN0aW9uc1xuICAgICAgICBpZiAoIXJlYWN0aW9uRGF0YS5jb250ZW50KSB7XG4gICAgICAgICAgICAvLyBUaGlzIGlzIGEgc3VtbWFyeSByZWFjdGlvbi4gU2VlIGlmIHdlIGhhdmUgYW55IGNvbnRhaW5lciBkYXRhIHRoYXQgd2UgY2FuIGxpbmsgdG8gaXQuXG4gICAgICAgICAgICB2YXIgY29udGFpbmVyUmVhY3Rpb25zID0gY29udGFpbmVyRGF0YS5yZWFjdGlvbnM7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvbnRhaW5lclJlYWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBjb250YWluZXJSZWFjdGlvbiA9IGNvbnRhaW5lclJlYWN0aW9uc1tpXTtcbiAgICAgICAgICAgICAgICBpZiAoY29udGFpbmVyUmVhY3Rpb24uaWQgPT09IHJlYWN0aW9uRGF0YS5pZCkge1xuICAgICAgICAgICAgICAgICAgICByZWFjdGlvbkRhdGEucGFyZW50SUQgPSBjb250YWluZXJSZWFjdGlvbi5wYXJlbnRJRDtcbiAgICAgICAgICAgICAgICAgICAgcmVhY3Rpb25EYXRhLmNvbnRlbnQgPSBjb250YWluZXJSZWFjdGlvbi5jb250ZW50O1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGRhdGEgPSB7XG4gICAgICAgICAgICB0YWc6IHtcbiAgICAgICAgICAgICAgICBib2R5OiByZWFjdGlvbkRhdGEudGV4dCxcbiAgICAgICAgICAgICAgICBpZDogcmVhY3Rpb25EYXRhLmlkXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaXNfZGVmYXVsdDogJ3RydWUnLCAvLyBUT0RPIGNoZWNrIGlmIHRoZSByZWFjdGlvbiBpZC9ib2R5IG1hdGNoZXMgYSBkZWZhdWx0XG4gICAgICAgICAgICBoYXNoOiBjb250YWluZXJEYXRhLmhhc2gsXG4gICAgICAgICAgICB1c2VyX2lkOiB1c2VySW5mby51c2VyX2lkLFxuICAgICAgICAgICAgYW50X3Rva2VuOiB1c2VySW5mby5hbnRfdG9rZW4sXG4gICAgICAgICAgICBwYWdlX2lkOiBwYWdlRGF0YS5wYWdlSWQsXG4gICAgICAgICAgICBncm91cF9pZDogcGFnZURhdGEuZ3JvdXBJZCxcbiAgICAgICAgICAgIGNvbnRhaW5lcl9raW5kOiBjb250YWluZXJEYXRhLnR5cGUsIC8vICdwYWdlJywgJ3RleHQnLCAnbWVkaWEnLCAnaW1nJ1xuICAgICAgICAgICAgY29udGVudF9ub2RlX2RhdGE6IHtcbiAgICAgICAgICAgICAgICBib2R5OiAnJywgLy8gVE9ETzogZG8gd2UgbmVlZCB0aGlzIGZvciArMXM/XG4gICAgICAgICAgICAgICAga2luZDogY29udGVudE5vZGVEYXRhS2luZChjb250YWluZXJEYXRhLnR5cGUpLFxuICAgICAgICAgICAgICAgIGl0ZW1fdHlwZTogJycgLy8gVE9ETzogbG9va3MgdW51c2VkIGJ1dCBUYWdIYW5kbGVyIGJsb3dzIHVwIHdpdGhvdXQgaXRcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgaWYgKHJlYWN0aW9uRGF0YS5jb250ZW50KSB7XG4gICAgICAgICAgICBkYXRhLmNvbnRlbnRfbm9kZV9kYXRhLmlkID0gcmVhY3Rpb25EYXRhLmNvbnRlbnQuaWQ7XG4gICAgICAgICAgICBkYXRhLmNvbnRlbnRfbm9kZV9kYXRhLmxvY2F0aW9uID0gcmVhY3Rpb25EYXRhLmNvbnRlbnQubG9jYXRpb247XG4gICAgICAgIH1cbiAgICAgICAgJC5nZXRKU09OUChVUkxzLmNyZWF0ZVJlYWN0aW9uVXJsKCksIGRhdGEsIHN1Y2Nlc3MsIGVycm9yKTtcbiAgICAgICAgLy92YXIgcmVzcG9uc2UgPSB7IC8vIFRPRE86IGp1c3QgY2FwdHVyaW5nIHRoZSBhcGkgZm9ybWF0Li4uXG4gICAgICAgIC8vICAgICAgICBleGlzdGluZzoganNvbi5leGlzdGluZyxcbiAgICAgICAgLy8gICAgICAgIGludGVyYWN0aW9uOiB7XG4gICAgICAgIC8vICAgICAgICAgICAgaWQ6IGpzb24uaW50ZXJhY3Rpb24uaWQsXG4gICAgICAgIC8vICAgICAgICAgICAgaW50ZXJhY3Rpb25fbm9kZToge1xuICAgICAgICAvLyAgICAgICAgICAgICAgICBib2R5OiBqc29uLmludGVyYWN0aW9uLmludGVyYWN0aW9uX25vZGUuYm9keSxcbiAgICAgICAgLy8gICAgICAgICAgICAgICAgaWQ6IGpzb24uaW50ZXJhY3Rpb24uaW50ZXJhY3Rpb25fbm9kZS5pZFxuICAgICAgICAvLyAgICAgICAgICAgIH1cbiAgICAgICAgLy8gICAgICAgIH1cbiAgICAgICAgLy8gICAgfTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gY29udGVudE5vZGVEYXRhS2luZCh0eXBlKSB7XG4gICAgLy8gVE9ETzogcmVzb2x2ZSB3aGV0aGVyIHRvIHVzZSB0aGUgc2hvcnQgb3IgbG9uZyBmb3JtIGZvciBjb250ZW50X25vZGVfZGF0YS5raW5kLiAvLyAncGFnJywgJ3R4dCcsICdtZWQnLCAnaW1nJ1xuICAgIGlmICh0eXBlID09PSAnaW1hZ2UnKSB7XG4gICAgICAgIHJldHVybiAnaW1nJztcbiAgICB9XG4gICAgcmV0dXJuIHR5cGU7XG59XG5cbmZ1bmN0aW9uIGlzRGVmYXVsdFJlYWN0aW9uKHJlYWN0aW9uLCBkZWZhdWx0UmVhY3Rpb25zKSB7XG4gICAgLy8gVE9ETyBjb25zaWRlciB0YWdnaW5nIHRoZSByZWFjdGlvbiBkYXRhIG9uIHJlYWQvbG9hZCByYXRoZXIgdGhhbiBvbiB3cml0ZVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGVmYXVsdFJlYWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAocmVhY3Rpb24uaWQgJiYgZGVmYXVsdFJlYWN0aW9uc1tpXS5pZCAmJiByZWFjdGlvbi5pZCA9PT0gZGVmYXVsdFJlYWN0aW9uc1tpXS5pZCkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgcG9zdFBsdXNPbmU6IHBvc3RQbHVzT25lLFxuICAgIHBvc3ROZXdSZWFjdGlvbjogcG9zdE5ld1JlYWN0aW9uXG59OyIsInZhciAkOyByZXF1aXJlKCcuL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIE1ENSA9IHJlcXVpcmUoJy4vbWQ1Jyk7XG5cbi8vIFRPRE86IFRoaXMgaXMganVzdCBjb3B5L3Bhc3RlZCBmcm9tIGVuZ2FnZV9mdWxsXG4vLyBUT0RPOiBUaGUgY29kZSBpcyBsb29raW5nIGZvciAuYW50X2luZGljYXRvciB0byBzZWUgaWYgaXQncyBhbHJlYWR5IGJlZW4gaGFzaGVkLiBSZXZpZXcuXG5mdW5jdGlvbiBnZXRDbGVhblRleHQoJGRvbU5vZGUpIHtcbiAgICAvLyBBTlQudXRpbC5nZXRDbGVhblRleHRcbiAgICAvLyBjb21tb24gZnVuY3Rpb24gZm9yIGNsZWFuaW5nIHRoZSB0ZXh0IG5vZGUgdGV4dC4gIHJpZ2h0IG5vdywgaXQncyByZW1vdmluZyBzcGFjZXMsIHRhYnMsIG5ld2xpbmVzLCBhbmQgdGhlbiBkb3VibGUgc3BhY2VzXG5cbiAgICB2YXIgJG5vZGUgPSAkZG9tTm9kZS5jbG9uZSgpO1xuXG4gICAgJG5vZGUuZmluZCgnLmFudCwgLmFudC1jdXN0b20tY3RhLWNvbnRhaW5lcicpLnJlbW92ZSgpO1xuXG4gICAgLy9tYWtlIHN1cmUgaXQgZG9lc250IGFscmVkeSBoYXZlIGluIGluZGljYXRvciAtIGl0IHNob3VsZG4ndC5cbiAgICB2YXIgJGluZGljYXRvciA9ICRub2RlLmZpbmQoJy5hbnRfaW5kaWNhdG9yJyk7XG4gICAgaWYoJGluZGljYXRvci5sZW5ndGgpe1xuICAgICAgICAvL3RvZG86IHNlbmQgdXMgYW4gZXJyb3IgcmVwb3J0IC0gdGhpcyBtYXkgc3RpbGwgYmUgaGFwcGVuaW5nIGZvciBzbGlkZXNob3dzLlxuICAgICAgICAvL1RoaXMgZml4IHdvcmtzIGZpbmUsIGJ1dCB3ZSBzaG91bGQgZml4IHRoZSBjb2RlIHRvIGhhbmRsZSBpdCBiZWZvcmUgaGVyZS5cbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIGdldCB0aGUgbm9kZSdzIHRleHQgYW5kIHNtYXNoIGNhc2VcbiAgICAvLyBUT0RPOiA8YnI+IHRhZ3MgYW5kIGJsb2NrLWxldmVsIHRhZ3MgY2FuIHNjcmV3IHVwIHdvcmRzLiAgZXg6XG4gICAgLy8gaGVsbG88YnI+aG93IGFyZSB5b3U/ICAgaGVyZSBiZWNvbWVzXG4gICAgLy8gaGVsbG9ob3cgYXJlIHlvdT8gICAgPC0tIG5vIHNwYWNlIHdoZXJlIHRoZSA8YnI+IHdhcy4gIGJhZC5cbiAgICB2YXIgbm9kZV90ZXh0ID0gJC50cmltKCAkbm9kZS5odG1sKCkucmVwbGFjZSgvPCAqYnIgKlxcLz8+L2dpLCAnICcpICk7XG4gICAgdmFyIGJvZHkgPSAkLnRyaW0oICQoIFwiPGRpdj5cIiArIG5vZGVfdGV4dCArIFwiPC9kaXY+XCIgKS50ZXh0KCkudG9Mb3dlckNhc2UoKSApO1xuXG4gICAgaWYoIGJvZHkgJiYgdHlwZW9mIGJvZHkgPT0gXCJzdHJpbmdcIiAmJiBib2R5ICE9PSBcIlwiICkge1xuICAgICAgICB2YXIgZmlyc3RwYXNzID0gYm9keS5yZXBsYWNlKC9bXFxuXFxyXFx0XSsvZ2ksJyAnKS5yZXBsYWNlKCkucmVwbGFjZSgvXFxzezIsfS9nLCcgJyk7XG4gICAgICAgIC8vIHNlZWluZyBpZiB0aGlzIGhlbHBzIHRoZSBwcm9wdWIgaXNzdWUgLSB0byB0cmltIGFnYWluLiAgV2hlbiBpIHJ1biB0aGlzIGxpbmUgYWJvdmUgaXQgbG9va3MgbGlrZSB0aGVyZSBpcyBzdGlsbCB3aGl0ZSBzcGFjZS5cbiAgICAgICAgcmV0dXJuICQudHJpbShmaXJzdHBhc3MpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gaGFzaFRleHQoZWxlbWVudCkge1xuICAgIC8vIFRPRE86IEhhbmRsZSB0aGUgY2FzZSB3aGVyZSBtdWx0aXBsZSBpbnN0YW5jZXMgb2YgdGhlIHNhbWUgdGV4dCBhcHBlYXIgb24gdGhlIHBhZ2UuIE5lZWQgdG8gYWRkIGFuIGluY3JlbWVudCB0b1xuICAgIC8vIHRoZSBoYXNoVGV4dC4gKFRoaXMgY2hlY2sgaGFzIHRvIGJlIHNjb3BlZCB0byBhIHBvc3QpXG4gICAgdmFyIHRleHQgPSBnZXRDbGVhblRleHQoZWxlbWVudCk7XG4gICAgdmFyIGhhc2hUZXh0ID0gXCJyZHItdGV4dC1cIit0ZXh0O1xuICAgIHJldHVybiBNRDUuaGV4X21kNShoYXNoVGV4dCk7XG59XG5cbmZ1bmN0aW9uIGhhc2hVcmwodXJsKSB7XG4gICAgcmV0dXJuIE1ENS5oZXhfbWQ1KHVybCk7XG59XG5cbmZ1bmN0aW9uIGhhc2hJbWFnZShpbWFnZVVybCkge1xuICAgIHZhciBoYXNoVGV4dCA9ICdyZHItaW1nLScgKyBpbWFnZVVybDtcbiAgICByZXR1cm4gTUQ1LmhleF9tZDUoaGFzaFRleHQpO1xufVxuXG5mdW5jdGlvbiBoYXNoTWVkaWEoZWxlbWVudCkge1xuXG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBoYXNoVGV4dDogaGFzaFRleHQsXG4gICAgaGFzaEltYWdlOiBoYXNoSW1hZ2UsXG4gICAgaGFzaFVybDogaGFzaFVybFxufTsiLCJ2YXIgVVJMcyA9IHJlcXVpcmUoJy4vdXJscycpO1xuXG52YXIgbG9hZGVkalF1ZXJ5O1xudmFyIGNhbGxiYWNrcyA9IFtdO1xuXG4vLyBOb3RpZmllcyB0aGUgalF1ZXJ5IHByb3ZpZGVyIHRoYXQgd2UndmUgbG9hZGVkIHRoZSBqUXVlcnkgbGlicmFyeS5cbmZ1bmN0aW9uIGxvYWRlZCgpIHtcbiAgICBsb2FkZWRqUXVlcnkgPSBqUXVlcnkubm9Db25mbGljdCgpO1xuICAgIC8vIEFkZCBvdXIgY3VzdG9tIEpTT05QIGZ1bmN0aW9uXG4gICAgbG9hZGVkalF1ZXJ5LmdldEpTT05QID0gZnVuY3Rpb24odXJsLCBkYXRhLCBzdWNjZXNzLCBlcnJvcikge1xuICAgICAgICB2YXIgb3B0aW9ucyA9IHtcbiAgICAgICAgICAgIHVybDogVVJMcy5hbnRlbm5hSG9tZSgpICsgdXJsLFxuICAgICAgICAgICAgdHlwZTogXCJnZXRcIixcbiAgICAgICAgICAgIGNvbnRlbnRUeXBlOiBcImFwcGxpY2F0aW9uL2pzb25cIixcbiAgICAgICAgICAgIGRhdGFUeXBlOiBcImpzb25wXCIsXG4gICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbihyZXNwb25zZSwgdGV4dFN0YXR1cywgWEhSKSB7XG4gICAgICAgICAgICAgICAgLy8gVE9ETzogUmV2aXNpdCB3aGV0aGVyIGl0J3MgcmVhbGx5IGNvb2wgdG8ga2V5IHRoaXMgb24gdGhlIHRleHRTdGF0dXMgb3IgaWYgd2Ugc2hvdWxkIGJlIGxvb2tpbmcgYXRcbiAgICAgICAgICAgICAgICAvLyAgICAgICB0aGUgc3RhdHVzIGNvZGUgaW4gdGhlIFhIUlxuICAgICAgICAgICAgICAgIC8vIE5vdGU6IFRoZSBzZXJ2ZXIgY29tZXMgYmFjayB3aXRoIDIwMCByZXNwb25zZXMgd2l0aCBhIG5lc3RlZCBzdGF0dXMgb2YgXCJmYWlsXCIuLi5cbiAgICAgICAgICAgICAgICBpZiAodGV4dFN0YXR1cyA9PT0gJ3N1Y2Nlc3MnICYmIHJlc3BvbnNlLnN0YXR1cyAhPT0gJ2ZhaWwnKSB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3MocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gRm9yIEpTT05QIHJlcXVlc3RzLCBqUXVlcnkgZG9lc24ndCBjYWxsIGl0J3MgZXJyb3IgY2FsbGJhY2suIEl0IGNhbGxzIHN1Y2Nlc3MgaW5zdGVhZC5cbiAgICAgICAgICAgICAgICAgICAgZXJyb3IocmVzcG9uc2UubWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBpZiAoZGF0YSkge1xuICAgICAgICAgICAgb3B0aW9ucy5kYXRhID0geyBqc29uOiBKU09OLnN0cmluZ2lmeShkYXRhKSB9O1xuICAgICAgICB9XG4gICAgICAgIGxvYWRlZGpRdWVyeS5hamF4KG9wdGlvbnMpO1xuICAgIH07XG4gICAgbm90aWZ5Q2FsbGJhY2tzKCk7XG59XG5cbmZ1bmN0aW9uIG5vdGlmeUNhbGxiYWNrcygpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNhbGxiYWNrcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjYWxsYmFja3NbaV0obG9hZGVkalF1ZXJ5KTtcbiAgICB9XG4gICAgY2FsbGJhY2tzID0gW107XG59XG5cbi8vIFJlZ2lzdGVycyB0aGUgZ2l2ZW4gY2FsbGJhY2sgdG8gYmUgbm90aWZpZWQgd2hlbiBvdXIgdmVyc2lvbiBvZiBqUXVlcnkgaXMgbG9hZGVkLlxuZnVuY3Rpb24gb25Mb2FkKGNhbGxiYWNrKSB7XG4gICAgaWYgKGxvYWRlZGpRdWVyeSkge1xuICAgICAgICBjYWxsYmFjayhsb2FkZWRqUXVlcnkpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGNhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKTtcbiAgICB9XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBsb2FkZWQ6IGxvYWRlZCxcbiAgICBvbkxvYWQ6IG9uTG9hZFxufTsiLCJcbi8vIFRPRE86IFRoaXMgY29kZSBpcyBqdXN0IGNvcGllZCBmcm9tIGVuZ2FnZV9mdWxsLmpzLiBSZXZpZXcgd2hldGhlciB3ZSB3YW50IHRvIGtlZXAgaXQgYXMtaXMuXG5cbnZhciBBTlQgPSB7XG4gICAgdXRpbDoge1xuICAgICAgICBtZDU6IHtcbiAgICAgICAgICAgIGhleGNhc2U6MCxcbiAgICAgICAgICAgIGI2NHBhZDpcIlwiLFxuICAgICAgICAgICAgY2hyc3o6OCxcbiAgICAgICAgICAgIGhleF9tZDU6IGZ1bmN0aW9uKHMpe3JldHVybiBBTlQudXRpbC5tZDUuYmlubDJoZXgoQU5ULnV0aWwubWQ1LmNvcmVfbWQ1KEFOVC51dGlsLm1kNS5zdHIyYmlubChzKSxzLmxlbmd0aCpBTlQudXRpbC5tZDUuY2hyc3opKTt9LFxuICAgICAgICAgICAgY29yZV9tZDU6IGZ1bmN0aW9uKHgsbGVuKXt4W2xlbj4+NV18PTB4ODA8PCgobGVuKSUzMik7eFsoKChsZW4rNjQpPj4+OSk8PDQpKzE0XT1sZW47dmFyIGE9MTczMjU4NDE5Mzt2YXIgYj0tMjcxNzMzODc5O3ZhciBjPS0xNzMyNTg0MTk0O3ZhciBkPTI3MTczMzg3ODtmb3IodmFyIGk9MDtpPHgubGVuZ3RoO2krPTE2KXt2YXIgb2xkYT1hO3ZhciBvbGRiPWI7dmFyIG9sZGM9Yzt2YXIgb2xkZD1kO2E9QU5ULnV0aWwubWQ1Lm1kNV9mZihhLGIsYyxkLHhbaSswXSw3LC02ODA4NzY5MzYpO2Q9QU5ULnV0aWwubWQ1Lm1kNV9mZihkLGEsYixjLHhbaSsxXSwxMiwtMzg5NTY0NTg2KTtjPUFOVC51dGlsLm1kNS5tZDVfZmYoYyxkLGEsYix4W2krMl0sMTcsNjA2MTA1ODE5KTtiPUFOVC51dGlsLm1kNS5tZDVfZmYoYixjLGQsYSx4W2krM10sMjIsLTEwNDQ1MjUzMzApO2E9QU5ULnV0aWwubWQ1Lm1kNV9mZihhLGIsYyxkLHhbaSs0XSw3LC0xNzY0MTg4OTcpO2Q9QU5ULnV0aWwubWQ1Lm1kNV9mZihkLGEsYixjLHhbaSs1XSwxMiwxMjAwMDgwNDI2KTtjPUFOVC51dGlsLm1kNS5tZDVfZmYoYyxkLGEsYix4W2krNl0sMTcsLTE0NzMyMzEzNDEpO2I9QU5ULnV0aWwubWQ1Lm1kNV9mZihiLGMsZCxhLHhbaSs3XSwyMiwtNDU3MDU5ODMpO2E9QU5ULnV0aWwubWQ1Lm1kNV9mZihhLGIsYyxkLHhbaSs4XSw3LDE3NzAwMzU0MTYpO2Q9QU5ULnV0aWwubWQ1Lm1kNV9mZihkLGEsYixjLHhbaSs5XSwxMiwtMTk1ODQxNDQxNyk7Yz1BTlQudXRpbC5tZDUubWQ1X2ZmKGMsZCxhLGIseFtpKzEwXSwxNywtNDIwNjMpO2I9QU5ULnV0aWwubWQ1Lm1kNV9mZihiLGMsZCxhLHhbaSsxMV0sMjIsLTE5OTA0MDQxNjIpO2E9QU5ULnV0aWwubWQ1Lm1kNV9mZihhLGIsYyxkLHhbaSsxMl0sNywxODA0NjAzNjgyKTtkPUFOVC51dGlsLm1kNS5tZDVfZmYoZCxhLGIsYyx4W2krMTNdLDEyLC00MDM0MTEwMSk7Yz1BTlQudXRpbC5tZDUubWQ1X2ZmKGMsZCxhLGIseFtpKzE0XSwxNywtMTUwMjAwMjI5MCk7Yj1BTlQudXRpbC5tZDUubWQ1X2ZmKGIsYyxkLGEseFtpKzE1XSwyMiwxMjM2NTM1MzI5KTthPUFOVC51dGlsLm1kNS5tZDVfZ2coYSxiLGMsZCx4W2krMV0sNSwtMTY1Nzk2NTEwKTtkPUFOVC51dGlsLm1kNS5tZDVfZ2coZCxhLGIsYyx4W2krNl0sOSwtMTA2OTUwMTYzMik7Yz1BTlQudXRpbC5tZDUubWQ1X2dnKGMsZCxhLGIseFtpKzExXSwxNCw2NDM3MTc3MTMpO2I9QU5ULnV0aWwubWQ1Lm1kNV9nZyhiLGMsZCxhLHhbaSswXSwyMCwtMzczODk3MzAyKTthPUFOVC51dGlsLm1kNS5tZDVfZ2coYSxiLGMsZCx4W2krNV0sNSwtNzAxNTU4NjkxKTtkPUFOVC51dGlsLm1kNS5tZDVfZ2coZCxhLGIsYyx4W2krMTBdLDksMzgwMTYwODMpO2M9QU5ULnV0aWwubWQ1Lm1kNV9nZyhjLGQsYSxiLHhbaSsxNV0sMTQsLTY2MDQ3ODMzNSk7Yj1BTlQudXRpbC5tZDUubWQ1X2dnKGIsYyxkLGEseFtpKzRdLDIwLC00MDU1Mzc4NDgpO2E9QU5ULnV0aWwubWQ1Lm1kNV9nZyhhLGIsYyxkLHhbaSs5XSw1LDU2ODQ0NjQzOCk7ZD1BTlQudXRpbC5tZDUubWQ1X2dnKGQsYSxiLGMseFtpKzE0XSw5LC0xMDE5ODAzNjkwKTtjPUFOVC51dGlsLm1kNS5tZDVfZ2coYyxkLGEsYix4W2krM10sMTQsLTE4NzM2Mzk2MSk7Yj1BTlQudXRpbC5tZDUubWQ1X2dnKGIsYyxkLGEseFtpKzhdLDIwLDExNjM1MzE1MDEpO2E9QU5ULnV0aWwubWQ1Lm1kNV9nZyhhLGIsYyxkLHhbaSsxM10sNSwtMTQ0NDY4MTQ2Nyk7ZD1BTlQudXRpbC5tZDUubWQ1X2dnKGQsYSxiLGMseFtpKzJdLDksLTUxNDAzNzg0KTtjPUFOVC51dGlsLm1kNS5tZDVfZ2coYyxkLGEsYix4W2krN10sMTQsMTczNTMyODQ3Myk7Yj1BTlQudXRpbC5tZDUubWQ1X2dnKGIsYyxkLGEseFtpKzEyXSwyMCwtMTkyNjYwNzczNCk7YT1BTlQudXRpbC5tZDUubWQ1X2hoKGEsYixjLGQseFtpKzVdLDQsLTM3ODU1OCk7ZD1BTlQudXRpbC5tZDUubWQ1X2hoKGQsYSxiLGMseFtpKzhdLDExLC0yMDIyNTc0NDYzKTtjPUFOVC51dGlsLm1kNS5tZDVfaGgoYyxkLGEsYix4W2krMTFdLDE2LDE4MzkwMzA1NjIpO2I9QU5ULnV0aWwubWQ1Lm1kNV9oaChiLGMsZCxhLHhbaSsxNF0sMjMsLTM1MzA5NTU2KTthPUFOVC51dGlsLm1kNS5tZDVfaGgoYSxiLGMsZCx4W2krMV0sNCwtMTUzMDk5MjA2MCk7ZD1BTlQudXRpbC5tZDUubWQ1X2hoKGQsYSxiLGMseFtpKzRdLDExLDEyNzI4OTMzNTMpO2M9QU5ULnV0aWwubWQ1Lm1kNV9oaChjLGQsYSxiLHhbaSs3XSwxNiwtMTU1NDk3NjMyKTtiPUFOVC51dGlsLm1kNS5tZDVfaGgoYixjLGQsYSx4W2krMTBdLDIzLC0xMDk0NzMwNjQwKTthPUFOVC51dGlsLm1kNS5tZDVfaGgoYSxiLGMsZCx4W2krMTNdLDQsNjgxMjc5MTc0KTtkPUFOVC51dGlsLm1kNS5tZDVfaGgoZCxhLGIsYyx4W2krMF0sMTEsLTM1ODUzNzIyMik7Yz1BTlQudXRpbC5tZDUubWQ1X2hoKGMsZCxhLGIseFtpKzNdLDE2LC03MjI1MjE5NzkpO2I9QU5ULnV0aWwubWQ1Lm1kNV9oaChiLGMsZCxhLHhbaSs2XSwyMyw3NjAyOTE4OSk7YT1BTlQudXRpbC5tZDUubWQ1X2hoKGEsYixjLGQseFtpKzldLDQsLTY0MDM2NDQ4Nyk7ZD1BTlQudXRpbC5tZDUubWQ1X2hoKGQsYSxiLGMseFtpKzEyXSwxMSwtNDIxODE1ODM1KTtjPUFOVC51dGlsLm1kNS5tZDVfaGgoYyxkLGEsYix4W2krMTVdLDE2LDUzMDc0MjUyMCk7Yj1BTlQudXRpbC5tZDUubWQ1X2hoKGIsYyxkLGEseFtpKzJdLDIzLC05OTUzMzg2NTEpO2E9QU5ULnV0aWwubWQ1Lm1kNV9paShhLGIsYyxkLHhbaSswXSw2LC0xOTg2MzA4NDQpO2Q9QU5ULnV0aWwubWQ1Lm1kNV9paShkLGEsYixjLHhbaSs3XSwxMCwxMTI2ODkxNDE1KTtjPUFOVC51dGlsLm1kNS5tZDVfaWkoYyxkLGEsYix4W2krMTRdLDE1LC0xNDE2MzU0OTA1KTtiPUFOVC51dGlsLm1kNS5tZDVfaWkoYixjLGQsYSx4W2krNV0sMjEsLTU3NDM0MDU1KTthPUFOVC51dGlsLm1kNS5tZDVfaWkoYSxiLGMsZCx4W2krMTJdLDYsMTcwMDQ4NTU3MSk7ZD1BTlQudXRpbC5tZDUubWQ1X2lpKGQsYSxiLGMseFtpKzNdLDEwLC0xODk0OTg2NjA2KTtjPUFOVC51dGlsLm1kNS5tZDVfaWkoYyxkLGEsYix4W2krMTBdLDE1LC0xMDUxNTIzKTtiPUFOVC51dGlsLm1kNS5tZDVfaWkoYixjLGQsYSx4W2krMV0sMjEsLTIwNTQ5MjI3OTkpO2E9QU5ULnV0aWwubWQ1Lm1kNV9paShhLGIsYyxkLHhbaSs4XSw2LDE4NzMzMTMzNTkpO2Q9QU5ULnV0aWwubWQ1Lm1kNV9paShkLGEsYixjLHhbaSsxNV0sMTAsLTMwNjExNzQ0KTtjPUFOVC51dGlsLm1kNS5tZDVfaWkoYyxkLGEsYix4W2krNl0sMTUsLTE1NjAxOTgzODApO2I9QU5ULnV0aWwubWQ1Lm1kNV9paShiLGMsZCxhLHhbaSsxM10sMjEsMTMwOTE1MTY0OSk7YT1BTlQudXRpbC5tZDUubWQ1X2lpKGEsYixjLGQseFtpKzRdLDYsLTE0NTUyMzA3MCk7ZD1BTlQudXRpbC5tZDUubWQ1X2lpKGQsYSxiLGMseFtpKzExXSwxMCwtMTEyMDIxMDM3OSk7Yz1BTlQudXRpbC5tZDUubWQ1X2lpKGMsZCxhLGIseFtpKzJdLDE1LDcxODc4NzI1OSk7Yj1BTlQudXRpbC5tZDUubWQ1X2lpKGIsYyxkLGEseFtpKzldLDIxLC0zNDM0ODU1NTEpO2E9QU5ULnV0aWwubWQ1LnNhZmVfYWRkKGEsb2xkYSk7Yj1BTlQudXRpbC5tZDUuc2FmZV9hZGQoYixvbGRiKTtjPUFOVC51dGlsLm1kNS5zYWZlX2FkZChjLG9sZGMpO2Q9QU5ULnV0aWwubWQ1LnNhZmVfYWRkKGQsb2xkZCk7fSByZXR1cm4gQXJyYXkoYSxiLGMsZCk7fSxcbiAgICAgICAgICAgIG1kNV9jbW46IGZ1bmN0aW9uKHEsYSxiLHgscyx0KXtyZXR1cm4gQU5ULnV0aWwubWQ1LnNhZmVfYWRkKEFOVC51dGlsLm1kNS5iaXRfcm9sKEFOVC51dGlsLm1kNS5zYWZlX2FkZChBTlQudXRpbC5tZDUuc2FmZV9hZGQoYSxxKSxBTlQudXRpbC5tZDUuc2FmZV9hZGQoeCx0KSkscyksYik7fSxcbiAgICAgICAgICAgIG1kNV9mZjogZnVuY3Rpb24oYSxiLGMsZCx4LHMsdCl7cmV0dXJuIEFOVC51dGlsLm1kNS5tZDVfY21uKChiJmMpfCgofmIpJmQpLGEsYix4LHMsdCk7fSxcbiAgICAgICAgICAgIG1kNV9nZzogZnVuY3Rpb24oYSxiLGMsZCx4LHMsdCl7cmV0dXJuIEFOVC51dGlsLm1kNS5tZDVfY21uKChiJmQpfChjJih+ZCkpLGEsYix4LHMsdCk7fSxcbiAgICAgICAgICAgIG1kNV9oaDogZnVuY3Rpb24oYSxiLGMsZCx4LHMsdCl7cmV0dXJuIEFOVC51dGlsLm1kNS5tZDVfY21uKGJeY15kLGEsYix4LHMsdCk7fSxcbiAgICAgICAgICAgIG1kNV9paTogZnVuY3Rpb24oYSxiLGMsZCx4LHMsdCl7cmV0dXJuIEFOVC51dGlsLm1kNS5tZDVfY21uKGNeKGJ8KH5kKSksYSxiLHgscyx0KTt9LFxuICAgICAgICAgICAgc2FmZV9hZGQ6IGZ1bmN0aW9uKHgseSl7dmFyIGxzdz0oeCYweEZGRkYpKyh5JjB4RkZGRik7dmFyIG1zdz0oeD4+MTYpKyh5Pj4xNikrKGxzdz4+MTYpO3JldHVybihtc3c8PDE2KXwobHN3JjB4RkZGRik7fSxcbiAgICAgICAgICAgIGJpdF9yb2w6IGZ1bmN0aW9uKG51bSxjbnQpe3JldHVybihudW08PGNudCl8KG51bT4+PigzMi1jbnQpKTt9LFxuICAgICAgICAgICAgLy90aGUgbGluZSBiZWxvdyBpcyBjYWxsZWQgb3V0IGJ5IGpzTGludCBiZWNhdXNlIGl0IHVzZXMgQXJyYXkoKSBpbnN0ZWFkIG9mIFtdLiAgV2UgY2FuIGlnbm9yZSwgb3IgSSdtIHN1cmUgd2UgY291bGQgY2hhbmdlIGl0IGlmIHdlIHdhbnRlZCB0by5cbiAgICAgICAgICAgIHN0cjJiaW5sOiBmdW5jdGlvbihzdHIpe3ZhciBiaW49QXJyYXkoKTt2YXIgbWFzaz0oMTw8QU5ULnV0aWwubWQ1LmNocnN6KS0xO2Zvcih2YXIgaT0wO2k8c3RyLmxlbmd0aCpBTlQudXRpbC5tZDUuY2hyc3o7aSs9QU5ULnV0aWwubWQ1LmNocnN6KXtiaW5baT4+NV18PShzdHIuY2hhckNvZGVBdChpL0FOVC51dGlsLm1kNS5jaHJzeikmbWFzayk8PChpJTMyKTt9cmV0dXJuIGJpbjt9LFxuICAgICAgICAgICAgYmlubDJoZXg6IGZ1bmN0aW9uKGJpbmFycmF5KXt2YXIgaGV4X3RhYj1BTlQudXRpbC5tZDUuaGV4Y2FzZT9cIjAxMjM0NTY3ODlBQkNERUZcIjpcIjAxMjM0NTY3ODlhYmNkZWZcIjt2YXIgc3RyPVwiXCI7Zm9yKHZhciBpPTA7aTxiaW5hcnJheS5sZW5ndGgqNDtpKyspe3N0cis9aGV4X3RhYi5jaGFyQXQoKGJpbmFycmF5W2k+PjJdPj4oKGklNCkqOCs0KSkmMHhGKStoZXhfdGFiLmNoYXJBdCgoYmluYXJyYXlbaT4+Ml0+PigoaSU0KSo4KSkmMHhGKTt9IHJldHVybiBzdHI7fVxuICAgICAgICB9XG4gICAgfVxufTtcblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGhleF9tZDU6IEFOVC51dGlsLm1kNS5oZXhfbWQ1XG59OyIsInZhciAkOyByZXF1aXJlKCcuL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xuXG5mdW5jdGlvbiBtYWtlTW92ZWFibGUoJGVsZW1lbnQsICRkcmFnSGFuZGxlKSB7XG4gICAgJGRyYWdIYW5kbGUub24oJ21vdXNlZG93bi5hbnRlbm5hJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdmFyIG9mZnNldFggPSBldmVudC5wYWdlWCAtICRkcmFnSGFuZGxlLm9mZnNldCgpLmxlZnQ7XG4gICAgICAgIHZhciBvZmZzZXRZID0gZXZlbnQucGFnZVkgLSAkZHJhZ0hhbmRsZS5vZmZzZXQoKS50b3A7XG4gICAgICAgICQoZG9jdW1lbnQpLm9uKCdtb3VzZXVwLmFudGVubmEnLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgJChkb2N1bWVudCkub2ZmKCdtb3VzZW1vdmUuYW50ZW5uYScpO1xuICAgICAgICB9KTtcbiAgICAgICAgJChkb2N1bWVudCkub24oJ21vdXNlbW92ZS5hbnRlbm5hJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgICRlbGVtZW50LmNzcyh7XG4gICAgICAgICAgICAgICAgdG9wOiBldmVudC5wYWdlWSAtIG9mZnNldFksXG4gICAgICAgICAgICAgICAgbGVmdDogZXZlbnQucGFnZVggLSBvZmZzZXRYXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIG1ha2VNb3ZlYWJsZTogbWFrZU1vdmVhYmxlXG59OyIsIlxudmFyIG9mZmxpbmU7XG5cbmZ1bmN0aW9uIGlzT2ZmbGluZSgpIHtcbiAgICBpZiAob2ZmbGluZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIC8vIFRPRE86IERvIHNvbWV0aGluZyBjcm9zcy1icm93c2VyIGhlcmUuIFRoaXMgd29uJ3Qgd29yayBpbiBJRS5cbiAgICAgICAgLy8gVE9ETzogTWFrZSB0aGlzIG1vcmUgZmxleGlibGUgc28gaXQgd29ya3MgaW4gZXZlcnlvbmUncyBkZXYgZW52aXJvbm1lbnRcbiAgICAgICAgb2ZmbGluZSA9IGRvY3VtZW50LmN1cnJlbnRTY3JpcHQuc3JjID09PSAnaHR0cDovL2xvY2FsaG9zdDo4MDgxL3N0YXRpYy93aWRnZXQtbmV3L2RlYnVnL2FudGVubmEuanMnO1xuICAgIH1cbiAgICByZXR1cm4gb2ZmbGluZTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpc09mZmxpbmUoKTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcblxuLy8gVE9ETyBjb3BpZWQgZnJvbSBlbmdhZ2VfZnVsbC4gUmV2aWV3LlxuZnVuY3Rpb24gY29tcHV0ZVBhZ2VVcmwoZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBwYWdlX3VybCA9ICQudHJpbSggd2luZG93LmxvY2F0aW9uLmhyZWYuc3BsaXQoJyMnKVswXSApLnRvTG93ZXJDYXNlKCk7IC8vIFRPRE8gc2hvdWxkIHBhc3MgdGhpcyBpbiBpbnN0ZWFkIG9mIHJlY29tcHV0aW5nXG4gICAgcmV0dXJuIHJlbW92ZVN1YmRvbWFpbkZyb21QYWdlVXJsKHBhZ2VfdXJsLCBncm91cFNldHRpbmdzKTtcbn1cblxuLy8gVE9ETyBjb3BpZWQgZnJvbSBlbmdhZ2VfZnVsbC4gUmV2aWV3LlxuZnVuY3Rpb24gY29tcHV0ZVRvcExldmVsQ2Fub25pY2FsVXJsKGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgcGFnZV91cmwgPSAkLnRyaW0oIHdpbmRvdy5sb2NhdGlvbi5ocmVmLnNwbGl0KCcjJylbMF0gKS50b0xvd2VyQ2FzZSgpOyAvLyBUT0RPIHNob3VsZCBwYXNzIHRoaXMgaW4gaW5zdGVhZCBvZiByZWNvbXB1dGluZ1xuICAgIHZhciBjYW5vbmljYWxfdXJsID0gKCAkKCdsaW5rW3JlbD1cImNhbm9uaWNhbFwiXScpLmxlbmd0aCA+IDAgKSA/XG4gICAgICAgICAgICAgICAgJCgnbGlua1tyZWw9XCJjYW5vbmljYWxcIl0nKS5hdHRyKCdocmVmJykgOiBwYWdlX3VybDtcblxuICAgIC8vIGFudDp1cmwgb3ZlcnJpZGVzXG4gICAgaWYgKCAkKCdbcHJvcGVydHk9XCJhbnRlbm5hOnVybFwiXScpLmxlbmd0aCA+IDAgKSB7XG4gICAgICAgIGNhbm9uaWNhbF91cmwgPSAkKCdbcHJvcGVydHk9XCJhbnRlbm5hOnVybFwiXScpLmF0dHIoJ2NvbnRlbnQnKTtcbiAgICB9XG5cbiAgICBjYW5vbmljYWxfdXJsID0gJC50cmltKCBjYW5vbmljYWxfdXJsLnRvTG93ZXJDYXNlKCkgKTtcblxuICAgIGlmIChjYW5vbmljYWxfdXJsID09IGNvbXB1dGVQYWdlVXJsKGdyb3VwU2V0dGluZ3MpICkgeyAvLyBUT0RPIHNob3VsZCBwYXNzIHRoaXMgaW4gaW5zdGVhZCBvZiByZWNvbXB1dGluZ1xuICAgICAgICBjYW5vbmljYWxfdXJsID0gXCJzYW1lXCI7XG4gICAgfVxuXG4gICAgLy8gZmFzdGNvIGZpeCAoc2luY2UgdGhleSBzb21ldGltZXMgcmV3cml0ZSB0aGVpciBjYW5vbmljYWwgdG8gc2ltcGx5IGJlIHRoZWlyIFRMRC4pXG4gICAgLy8gaW4gdGhlIGNhc2Ugd2hlcmUgY2Fub25pY2FsIGNsYWltcyBUTEQgYnV0IHdlJ3JlIGFjdHVhbGx5IG9uIGFuIGFydGljbGUuLi4gc2V0IGNhbm9uaWNhbCB0byBiZSB0aGUgcGFnZV91cmxcbiAgICB2YXIgdGxkID0gJC50cmltKHdpbmRvdy5sb2NhdGlvbi5wcm90b2NvbCsnLy8nK3dpbmRvdy5sb2NhdGlvbi5ob3N0bmFtZSsnLycpLnRvTG93ZXJDYXNlKCk7XG4gICAgaWYgKCBjYW5vbmljYWxfdXJsID09IHRsZCApIHtcbiAgICAgICAgaWYgKHBhZ2VfdXJsICE9IHRsZCkge1xuICAgICAgICAgICAgY2Fub25pY2FsX3VybCA9IHBhZ2VfdXJsO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlbW92ZVN1YmRvbWFpbkZyb21QYWdlVXJsKCQudHJpbShjYW5vbmljYWxfdXJsKSwgZ3JvdXBTZXR0aW5ncyk7XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVQYWdlRWxlbWVudENhbm9uaWNhbFVybCgkcGFnZUVsZW1lbnQsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICAvLyBUT0RPIFJldmlldyBhZ2FpbnN0IGVuZ2FnZV9mdWxsLiBUaGVyZSwgdGhlIG5lc3RlZCBwYWdlcyBhbmQgdG9wLWxldmVsIHBhZ2UgaGF2ZSBhIHRvdGFsbHkgZGlmZmVyZW50IGZsb3cuIERvZXMgdGhpc1xuICAgIC8vIHVuaWZpY2F0aW9uIHdvcms/IFRoZSBpZGVhIGlzIHRoYXQgdGhlIG5lc3RlZCBwYWdlcyB3b3VsZCBoYXZlIGFuIGhyZWYgc2VsZWN0b3IgdGhhdCBzcGVjaWZpZXMgdGhlIFVSTCB0byB1c2UsIHNvIHdlXG4gICAgLy8ganVzdCB1c2UgaXQuIEJ1dCBjb21wdXRlIHRoZSB1cmwgZm9yIHRoZSB0b3AtbGV2ZWwgY2FzZSBleHBsaWNpdGx5LlxuICAgIGlmICgkcGFnZUVsZW1lbnQuZmluZChncm91cFNldHRpbmdzLnBhZ2VIcmVmU2VsZWN0b3IoKSkubGVuZ3RoID4gMCkge1xuICAgICAgICByZXR1cm4gJ3NhbWUnO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBjb21wdXRlVG9wTGV2ZWxDYW5vbmljYWxVcmwoZ3JvdXBTZXR0aW5ncyk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBjb21wdXRlUGFnZUVsZW1lbnRVcmwoJHBhZ2VFbGVtZW50LCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIHVybCA9ICRwYWdlRWxlbWVudC5maW5kKGdyb3VwU2V0dGluZ3MucGFnZUhyZWZTZWxlY3RvcigpKS5hdHRyKCdocmVmJyk7XG4gICAgaWYgKCF1cmwpIHtcbiAgICAgICAgdXJsID0gJC50cmltKCB3aW5kb3cubG9jYXRpb24uaHJlZi5zcGxpdCgnIycpWzBdICkudG9Mb3dlckNhc2UoKTsgLy8gdG9wLWxldmVsIHBhZ2UgdXJsXG4gICAgfVxuICAgIHJldHVybiByZW1vdmVTdWJkb21haW5Gcm9tUGFnZVVybCh1cmwsIGdyb3VwU2V0dGluZ3MpO1xufVxuXG4vLyBUT0RPIGNvcGllZCBmcm9tIGVuZ2FnZV9mdWxsLiBSZXZpZXcuXG5mdW5jdGlvbiByZW1vdmVTdWJkb21haW5Gcm9tUGFnZVVybCh1cmwsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICAvLyBBTlQuYWN0aW9ucy5yZW1vdmVTdWJkb21haW5Gcm9tUGFnZVVybDpcbiAgICAvLyBpZiBcImlnbm9yZV9zdWJkb21haW5cIiBpcyBjaGVja2VkIGluIHNldHRpbmdzLCBBTkQgdGhleSBzdXBwbHkgYSBUTEQsXG4gICAgLy8gdGhlbiBtb2RpZnkgdGhlIHBhZ2UgYW5kIGNhbm9uaWNhbCBVUkxzIGhlcmUuXG4gICAgLy8gaGF2ZSB0byBoYXZlIHRoZW0gc3VwcGx5IG9uZSBiZWNhdXNlIHRoZXJlIGFyZSB0b28gbWFueSB2YXJpYXRpb25zIHRvIHJlbGlhYmx5IHN0cmlwIHN1YmRvbWFpbnMgICguY29tLCAuaXMsIC5jb20uYXIsIC5jby51aywgZXRjKVxuICAgIGlmIChncm91cFNldHRpbmdzLnVybC5pZ25vcmVTdWJkb21haW4oKSA9PSB0cnVlICYmIGdyb3VwU2V0dGluZ3MudXJsLmNhbm9uaWNhbERvbWFpbigpKSB7XG4gICAgICAgIHZhciBIT1NURE9NQUlOID0gL1stXFx3XStcXC4oPzpbLVxcd10rXFwueG4tLVstXFx3XSt8Wy1cXHddezIsfXxbLVxcd10rXFwuWy1cXHddezJ9KSQvaTtcbiAgICAgICAgdmFyIHNyY0FycmF5ID0gdXJsLnNwbGl0KCcvJyk7XG5cbiAgICAgICAgdmFyIHByb3RvY29sID0gc3JjQXJyYXlbMF07XG4gICAgICAgIHNyY0FycmF5LnNwbGljZSgwLDMpO1xuXG4gICAgICAgIHZhciByZXR1cm5VcmwgPSBwcm90b2NvbCArICcvLycgKyBncm91cFNldHRpbmdzLnVybC5jYW5vbmljYWxEb21haW4oKSArICcvJyArIHNyY0FycmF5LmpvaW4oJy8nKTtcblxuICAgICAgICByZXR1cm4gcmV0dXJuVXJsO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB1cmw7XG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY29tcHV0ZVBhZ2VVcmw6IGNvbXB1dGVQYWdlRWxlbWVudFVybCxcbiAgICBjb21wdXRlQ2Fub25pY2FsVXJsOiBjb21wdXRlUGFnZUVsZW1lbnRDYW5vbmljYWxVcmxcbn07IiwidmFyIHJhbmd5OyByZXF1aXJlKCcuL3Jhbmd5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGxvYWRlZFJhbmd5KSB7IHJhbmd5ID0gbG9hZGVkUmFuZ3k7IH0pO1xuXG52YXIgaGlnaGxpZ2h0Q2xhc3MgPSAnYW50ZW5uYS1oaWdobGlnaHQnO1xudmFyIGhpZ2hsaWdodGVkUmFuZ2VzID0gW107XG5cbnZhciBjbGFzc0FwcGxpZXI7XG5mdW5jdGlvbiBnZXRDbGFzc0FwcGxpZXIoKSB7XG4gICAgaWYgKCFjbGFzc0FwcGxpZXIpIHtcbiAgICAgICAgY2xhc3NBcHBsaWVyID0gcmFuZ3kuY3JlYXRlQ2xhc3NBcHBsaWVyKGhpZ2hsaWdodENsYXNzKTtcbiAgICB9XG4gICAgcmV0dXJuIGNsYXNzQXBwbGllcjtcbn1cblxuLy8gUmV0dXJucyBhbiBhZGp1c3RlZCBlbmQgcG9pbnQgZm9yIHRoZSBzZWxlY3Rpb24gd2l0aGluIHRoZSBnaXZlbiBub2RlLCBhcyB0cmlnZ2VyZWQgYnkgdGhlIGdpdmVuIG1vdXNlIHVwIGV2ZW50LlxuLy8gVGhlIHJldHVybmVkIHBvaW50ICh4LCB5KSB0YWtlcyBpbnRvIGFjY291bnQgdGhlIGxvY2F0aW9uIG9mIHRoZSBtb3VzZSB1cCBldmVudCBhcyB3ZWxsIGFzIHRoZSBkaXJlY3Rpb24gb2YgdGhlXG4vLyBzZWxlY3Rpb24gKGZvcndhcmQvYmFjaykuXG5mdW5jdGlvbiBnZXRTZWxlY3Rpb25FbmRQb2ludChub2RlLCBldmVudCwgZXhjbHVkZU5vZGUpIHtcbiAgICAvLyBUT0RPOiBDb25zaWRlciB1c2luZyB0aGUgZWxlbWVudCBjcmVhdGVkIHdpdGggdGhlICdjbGFzc2lmaWVyJyByYXRoZXIgdGhhbiB0aGUgbW91c2UgbG9jYXRpb25cbiAgICB2YXIgc2VsZWN0aW9uID0gcmFuZ3kuZ2V0U2VsZWN0aW9uKCk7XG4gICAgaWYgKGlzVmFsaWRTZWxlY3Rpb24oc2VsZWN0aW9uLCBub2RlLCBleGNsdWRlTm9kZSkpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHg6IGV2ZW50LnBhZ2VYIC0gKCBzZWxlY3Rpb24uaXNCYWNrd2FyZHMoKSA/IC01IDogNSksXG4gICAgICAgICAgICB5OiBldmVudC5wYWdlWSAtIDggLy8gVE9ETzogZXhhY3QgY29vcmRzXG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG59XG5cbi8vIEF0dGVtcHRzIHRvIGdldCBhIHJhbmdlIGZyb20gdGhlIGN1cnJlbnQgc2VsZWN0aW9uLiBUaGlzIGV4cGFuZHMgdGhlXG4vLyBzZWxlY3RlZCByZWdpb24gdG8gaW5jbHVkZSB3b3JkIGJvdW5kYXJpZXMuXG5mdW5jdGlvbiBncmFiU2VsZWN0aW9uKG5vZGUsIGNhbGxiYWNrLCBleGNsdWRlTm9kZSkge1xuICAgIHZhciBzZWxlY3Rpb24gPSByYW5neS5nZXRTZWxlY3Rpb24oKTtcbiAgICBpZiAoaXNWYWxpZFNlbGVjdGlvbihzZWxlY3Rpb24sIG5vZGUsIGV4Y2x1ZGVOb2RlKSkge1xuICAgICAgICBzZWxlY3Rpb24uZXhwYW5kKCd3b3JkJywgeyB0cmltOiB0cnVlIH0pO1xuICAgICAgICB2YXIgbG9jYXRpb24gPSByYW5neS5zZXJpYWxpemVTZWxlY3Rpb24oc2VsZWN0aW9uLCB0cnVlLCBub2RlKTtcbiAgICAgICAgdmFyIHRleHQgPSBzZWxlY3Rpb24udG9TdHJpbmcoKTtcbiAgICAgICAgaGlnaGxpZ2h0U2VsZWN0aW9uKHNlbGVjdGlvbik7IC8vIEhpZ2hsaWdodGluZyBkZXNlbGVjdHMgdGhlIHRleHQsIHNvIGRvIHRoaXMgbGFzdC5cbiAgICAgICAgY2FsbGJhY2sodGV4dCwgbG9jYXRpb24pO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gaXNWYWxpZFNlbGVjdGlvbihzZWxlY3Rpb24sIG5vZGUsIGV4Y2x1ZGVOb2RlKSB7XG4gICAgcmV0dXJuICFzZWxlY3Rpb24uaXNDb2xsYXBzZWQgJiYgIC8vIE5vbi1lbXB0eSBzZWxlY3Rpb25cbiAgICAgICAgc2VsZWN0aW9uLnJhbmdlQ291bnQgPT09IDEgJiYgLy8gU2luZ2xlIHNlbGVjdGlvblxuICAgICAgICAoIWV4Y2x1ZGVOb2RlIHx8ICFzZWxlY3Rpb24uY29udGFpbnNOb2RlKGV4Y2x1ZGVOb2RlLCB0cnVlKSkgJiYgLy8gU2VsZWN0aW9uIGRvZXNuJ3QgY29udGFpbiBhbnl0aGluZyB3ZSd2ZSBzYWlkIHdlIGRvbid0IHdhbnQgKGUuZy4gdGhlIGluZGljYXRvcilcbiAgICAgICAgbm9kZS5jb250YWlucyhzZWxlY3Rpb24uZ2V0UmFuZ2VBdCgwKS5jb21tb25BbmNlc3RvckNvbnRhaW5lcik7IC8vIFNlbGVjdGlvbiBpcyBjb250YWluZWQgZW50aXJlbHkgd2l0aGluIHRoZSBub2RlXG59XG5cbmZ1bmN0aW9uIGdyYWJOb2RlKG5vZGUsIGNhbGxiYWNrKSB7XG4gICAgdmFyIHJhbmdlID0gcmFuZ3kuY3JlYXRlUmFuZ2UoZG9jdW1lbnQpO1xuICAgIHJhbmdlLnNlbGVjdE5vZGVDb250ZW50cyhub2RlKTtcbiAgICB2YXIgJGV4Y2x1ZGVkID0gJChub2RlKS5maW5kKCcuYW50LWluZGljYXRvci1jb250YWluZXInKTsgLy8gVGhpcyBjbGFzcyBpcyBjb3BpZWQgaW4gcGFnZS1zY2FubmVyXG4gICAgaWYgKCRleGNsdWRlZC5zaXplKCkgPiAwKSB7IC8vIFJlbW92ZSB0aGUgaW5kaWNhdG9yIGZyb20gdGhlIGVuZCBvZiB0aGUgc2VsZWN0ZWQgcmFuZ2UuXG4gICAgICAgIHJhbmdlLnNldEVuZEJlZm9yZSgkZXhjbHVkZWQuZ2V0KDApKTtcbiAgICB9XG4gICAgdmFyIHNlbGVjdGlvbiA9IHJhbmd5LmdldFNlbGVjdGlvbigpO1xuICAgIHNlbGVjdGlvbi5zZXRTaW5nbGVSYW5nZShyYW5nZSk7XG4gICAgdmFyIGxvY2F0aW9uID0gcmFuZ3kuc2VyaWFsaXplU2VsZWN0aW9uKHNlbGVjdGlvbiwgdHJ1ZSwgbm9kZSk7XG4gICAgdmFyIHRleHQgPSBzZWxlY3Rpb24udG9TdHJpbmcoKTtcbiAgICBpZiAodGV4dC50cmltKCkubGVuZ3RoID4gMCkge1xuICAgICAgICBoaWdobGlnaHRTZWxlY3Rpb24oc2VsZWN0aW9uKTsgLy8gSGlnaGxpZ2h0aW5nIGRlc2VsZWN0cyB0aGUgdGV4dCwgc28gZG8gdGhpcyBsYXN0LlxuICAgICAgICBjYWxsYmFjayh0ZXh0LCBsb2NhdGlvbik7XG4gICAgfVxuICAgIHNlbGVjdGlvbi5yZW1vdmVBbGxSYW5nZXMoKTsgLy8gRG9uJ3QgYWN0dWFsbHkgbGVhdmUgdGhlIGVsZW1lbnQgc2VsZWN0ZWQuXG4gICAgc2VsZWN0aW9uLnJlZnJlc2goKTtcbn1cblxuLy8gSGlnaGxpZ2h0cyB0aGUgZ2l2ZW4gbG9jYXRpb24gaW5zaWRlIHRoZSBnaXZlbiBub2RlLlxuZnVuY3Rpb24gaGlnaGxpZ2h0TG9jYXRpb24obm9kZSwgbG9jYXRpb24pIHtcbiAgICAvLyBUT0RPIGVycm9yIGhhbmRsaW5nIGluIGNhc2UgdGhlIHJhbmdlIGlzIG5vdCB2YWxpZD9cbiAgICBpZiAocmFuZ3kuY2FuRGVzZXJpYWxpemVSYW5nZShsb2NhdGlvbiwgbm9kZSwgZG9jdW1lbnQpKSB7XG4gICAgICAgIHZhciByYW5nZSA9IHJhbmd5LmRlc2VyaWFsaXplUmFuZ2UobG9jYXRpb24sIG5vZGUsIGRvY3VtZW50KTtcbiAgICAgICAgaGlnaGxpZ2h0UmFuZ2UocmFuZ2UpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gaGlnaGxpZ2h0U2VsZWN0aW9uKHNlbGVjdGlvbikge1xuICAgIGhpZ2hsaWdodFJhbmdlKHNlbGVjdGlvbi5nZXRSYW5nZUF0KDApKTtcbn1cblxuZnVuY3Rpb24gaGlnaGxpZ2h0UmFuZ2UocmFuZ2UpIHtcbiAgICBnZXRDbGFzc0FwcGxpZXIoKS5hcHBseVRvUmFuZ2UocmFuZ2UpO1xuICAgIGhpZ2hsaWdodGVkUmFuZ2VzLnB1c2gocmFuZ2UpO1xufVxuXG4vLyBDbGVhcnMgYWxsIGhpZ2hsaWdodHMgdGhhdCBoYXZlIGJlZW4gY3JlYXRlZCBvbiB0aGUgcGFnZS5cbmZ1bmN0aW9uIGNsZWFySGlnaGxpZ2h0cygpIHtcbiAgICB2YXIgY2xhc3NBcHBsaWVyID0gZ2V0Q2xhc3NBcHBsaWVyKCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBoaWdobGlnaHRlZFJhbmdlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgcmFuZ2UgPSBoaWdobGlnaHRlZFJhbmdlc1tpXTtcbiAgICAgICAgaWYgKGNsYXNzQXBwbGllci5pc0FwcGxpZWRUb1JhbmdlKHJhbmdlKSkge1xuICAgICAgICAgICAgY2xhc3NBcHBsaWVyLnVuZG9Ub1JhbmdlKHJhbmdlKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBoaWdobGlnaHRlZFJhbmdlcyA9IFtdO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgZ2V0U2VsZWN0aW9uRW5kUG9pbnQ6IGdldFNlbGVjdGlvbkVuZFBvaW50LFxuICAgIGdyYWJTZWxlY3Rpb246IGdyYWJTZWxlY3Rpb24sXG4gICAgZ3JhYk5vZGU6IGdyYWJOb2RlLFxuICAgIGNsZWFySGlnaGxpZ2h0czogY2xlYXJIaWdobGlnaHRzLFxuICAgIGhpZ2hsaWdodDogaGlnaGxpZ2h0TG9jYXRpb25cbn07IiwiXG52YXIgbm9Db25mbGljdDtcbnZhciBsb2FkZWRSYW5neTtcbnZhciBjYWxsYmFja3MgPSBbXTtcblxuLy8gQ2FwdHVyZSBhbnkgZ2xvYmFsIGluc3RhbmNlIG9mIHJhbmd5IHdoaWNoIGFscmVhZHkgZXhpc3RzIGJlZm9yZSB3ZSBsb2FkIG91ciBvd24uXG5mdW5jdGlvbiBhYm91dFRvTG9hZCgpIHtcbiAgICBub0NvbmZsaWN0ID0gd2luZG93LnJhbmd5O1xufVxuXG4vLyBSZXN0b3JlIHRoZSBnbG9iYWwgaW5zdGFuY2Ugb2YgcmFuZ3kgKGlmIGFueSkgYW5kIHBhc3Mgb3V0IG91ciB2ZXJzaW9uIHRvIG91ciBjYWxsYmFja3NcbmZ1bmN0aW9uIGxvYWRlZCgpIHtcbiAgICBsb2FkZWRSYW5neSA9IHJhbmd5O1xuICAgIGxvYWRlZFJhbmd5LmluaXQoKTtcbiAgICB3aW5kb3cucmFuZ3kgPSBub0NvbmZsaWN0O1xuICAgIG5vdGlmeUNhbGxiYWNrcygpO1xufVxuXG5mdW5jdGlvbiBub3RpZnlDYWxsYmFja3MoKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjYWxsYmFja3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY2FsbGJhY2tzW2ldKGxvYWRlZFJhbmd5KTtcbiAgICB9XG4gICAgY2FsbGJhY2tzID0gW107XG59XG5cbi8vIFJlZ2lzdGVycyB0aGUgZ2l2ZW4gY2FsbGJhY2sgdG8gYmUgbm90aWZpZWQgd2hlbiBvdXIgdmVyc2lvbiBvZiBSYW5neSBpcyBsb2FkZWQuXG5mdW5jdGlvbiBvbkxvYWQoY2FsbGJhY2spIHtcbiAgICBpZiAobG9hZGVkUmFuZ3kpIHtcbiAgICAgICAgY2FsbGJhY2sobG9hZGVkUmFuZ3kpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGNhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKTtcbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGFib3V0VG9Mb2FkOiBhYm91dFRvTG9hZCxcbiAgICBsb2FkZWQ6IGxvYWRlZCxcbiAgICBvbkxvYWQ6IG9uTG9hZFxufTsiLCJcblxuZnVuY3Rpb24gdG9nZ2xlVHJhbnNpdGlvbkNsYXNzKCRlbGVtZW50LCBjbGFzc05hbWUsIHN0YXRlLCBuZXh0U3RlcCkge1xuICAgICRlbGVtZW50Lm9uKFwidHJhbnNpdGlvbmVuZCB3ZWJraXRUcmFuc2l0aW9uRW5kIG9UcmFuc2l0aW9uRW5kIE1TVHJhbnNpdGlvbkVuZFwiLFxuICAgICAgICBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgLy8gb25jZSB0aGUgQ1NTIHRyYW5zaXRpb24gaXMgY29tcGxldGUsIGNhbGwgb3VyIG5leHQgc3RlcFxuICAgICAgICAgICAgLy8gU2VlOiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzkyNTUyNzkvY2FsbGJhY2std2hlbi1jc3MzLXRyYW5zaXRpb24tZmluaXNoZXNcbiAgICAgICAgICAgIGlmIChldmVudC50YXJnZXQgPT0gZXZlbnQuY3VycmVudFRhcmdldCkge1xuICAgICAgICAgICAgICAgICRlbGVtZW50Lm9mZihcInRyYW5zaXRpb25lbmQgd2Via2l0VHJhbnNpdGlvbkVuZCBvVHJhbnNpdGlvbkVuZCBNU1RyYW5zaXRpb25FbmRcIik7XG4gICAgICAgICAgICAgICAgaWYgKG5leHRTdGVwKSB7XG4gICAgICAgICAgICAgICAgICAgIG5leHRTdGVwKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgKTtcbiAgICAkZWxlbWVudC50b2dnbGVDbGFzcyhjbGFzc05hbWUsIHN0YXRlKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgdG9nZ2xlQ2xhc3M6IHRvZ2dsZVRyYW5zaXRpb25DbGFzc1xufTsiLCJ2YXIgb2ZmbGluZSA9IHJlcXVpcmUoJy4vb2ZmbGluZS5qcycpO1xuXG5mdW5jdGlvbiBhbnRlbm5hSG9tZSgpIHtcbiAgICBpZiAob2ZmbGluZSkge1xuICAgICAgICByZXR1cm4gd2luZG93LmxvY2F0aW9uLnByb3RvY29sICsgXCIvL2xvY2FsLmFudGVubmEuaXM6ODA4MVwiO1xuICAgIH1cbiAgICByZXR1cm4gXCJodHRwczovL3d3dy5hbnRlbm5hLmlzXCI7IC8vIFRPRE86IHd3dz8gaG93IGFib3V0IGFudGVubmEuaXMgb3IgYXBpLmFudGVubmEuaXM/XG59XG5cbmZ1bmN0aW9uIGdldENyZWF0ZVJlYWN0aW9uVXJsKCkge1xuICAgIHJldHVybiAnL2FwaS90YWcvY3JlYXRlJztcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGFudGVubmFIb21lOiBhbnRlbm5hSG9tZSxcbiAgICBjcmVhdGVSZWFjdGlvblVybDogZ2V0Q3JlYXRlUmVhY3Rpb25Vcmxcbn07IiwiXG5mdW5jdGlvbiBnZXRXaWRnZXRCdWNrZXQoKSB7XG4gICAgdmFyIGJ1Y2tldCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhbnRlbm5hLXdpZGdldC1idWNrZXQnKTtcbiAgICBpZiAoIWJ1Y2tldCkge1xuICAgICAgICBidWNrZXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgYnVja2V0LnNldEF0dHJpYnV0ZSgnaWQnLCAnYW50ZW5uYS13aWRnZXQtYnVja2V0Jyk7XG4gICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoYnVja2V0KTtcbiAgICB9XG4gICAgcmV0dXJuIGJ1Y2tldDtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0gZ2V0V2lkZ2V0QnVja2V0OyIsIlxudmFyIFVSTHMgPSByZXF1aXJlKCcuL3VybHMnKTtcblxuLy8gUmVnaXN0ZXIgb3Vyc2VsdmVzIHRvIGhlYXIgbWVzc2FnZXNcbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwibWVzc2FnZVwiLCByZWNlaXZlTWVzc2FnZSwgZmFsc2UpO1xuXG52YXIgY2FsbGJhY2tzID0geyAneGRtIGxvYWRlZCc6IHhkbUxvYWRlZCB9O1xudmFyIGNhY2hlID0ge307XG5cbnZhciBpc1hETUxvYWRlZCA9IGZhbHNlO1xuLy8gVGhlIGluaXRpYWwgbWVzc2FnZSB0aGF0IFhETSBzZW5kcyBvdXQgd2hlbiBpdCBsb2Fkc1xuZnVuY3Rpb24geGRtTG9hZGVkKGRhdGEpIHtcbiAgICBpc1hETUxvYWRlZCA9IHRydWU7XG59XG5cbmZ1bmN0aW9uIGdldFVzZXIoY2FsbGJhY2spIHtcbiAgICB2YXIgbWVzc2FnZSA9ICdnZXRVc2VyJztcbiAgICBwb3N0TWVzc2FnZShtZXNzYWdlLCAncmV0dXJuaW5nX3VzZXInLCBjYWxsYmFjaywgdmFsaWRDYWNoZUVudHJ5KTtcblxuICAgIGZ1bmN0aW9uIHZhbGlkQ2FjaGVFbnRyeShyZXNwb25zZSkge1xuICAgICAgICB2YXIgdXNlckluZm8gPSByZXNwb25zZS5kYXRhO1xuICAgICAgICByZXR1cm4gdXNlckluZm8gJiYgdXNlckluZm8uYW50X3Rva2VuICYmIHVzZXJJbmZvLnVzZXJfaWQ7IC8vIFRPRE8gJiYgdXNlckluZm8udXNlcl90eXBlP1xuICAgIH1cbn1cblxuZnVuY3Rpb24gcmVjZWl2ZU1lc3NhZ2UoZXZlbnQpIHtcbiAgICB2YXIgZXZlbnRPcmlnaW4gPSBldmVudC5vcmlnaW47XG4gICAgaWYgKGV2ZW50T3JpZ2luID09PSBVUkxzLmFudGVubmFIb21lKCkpIHtcbiAgICAgICAgdmFyIHJlc3BvbnNlID0gSlNPTi5wYXJzZShldmVudC5kYXRhKTtcbiAgICAgICAgLy8gVE9ETzogVGhlIGV2ZW50LnNvdXJjZSBwcm9wZXJ0eSBnaXZlcyB1cyB0aGUgc291cmNlIHdpbmRvdyBvZiB0aGUgbWVzc2FnZSBhbmQgY3VycmVudGx5IHRoZSBYRE0gZnJhbWUgZmlyZXMgb3V0XG4gICAgICAgIC8vIGV2ZW50cyB0aGF0IHdlIHJlY2VpdmUgYmVmb3JlIHdlIGV2ZXIgdHJ5IHRvIHBvc3QgYW55dGhpbmcuIFNvIHdlICpjb3VsZCogaG9sZCBvbnRvIHRoZSB3aW5kb3cgaGVyZSBhbmQgdXNlIGl0XG4gICAgICAgIC8vIGZvciBwb3N0aW5nIG1lc3NhZ2VzIHJhdGhlciB0aGFuIGxvb2tpbmcgZm9yIHRoZSBYRE0gZnJhbWUgb3Vyc2VsdmVzLiBOZWVkIHRvIGxvb2sgYXQgd2hpY2ggZXZlbnRzIHRoZSBYRE0gZnJhbWVcbiAgICAgICAgLy8gZmlyZXMgb3V0IHRvIGFsbCB3aW5kb3dzIGJlZm9yZSBiZWluZyBhc2tlZC4gQ3VycmVudGx5LCBpdCdzIG1vcmUgdGhhbiBcInhkbSBsb2FkZWRcIi4gV2h5P1xuICAgICAgICAvL3ZhciBzb3VyY2VXaW5kb3cgPSBldmVudC5zb3VyY2U7XG5cbiAgICAgICAgdmFyIGNhbGxiYWNrS2V5ID0gcmVzcG9uc2Uuc3RhdHVzOyAvLyBUT0RPOiBjaGFuZ2UgdGhlIG5hbWUgb2YgdGhpcyBwcm9wZXJ0eSBpbiB4ZG0uaHRtbFxuICAgICAgICBjYWNoZVtjYWxsYmFja0tleV0gPSByZXNwb25zZTtcbiAgICAgICAgdmFyIGNhbGxiYWNrID0gY2FsbGJhY2tzW2NhbGxiYWNrS2V5XTtcbiAgICAgICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhyZXNwb25zZSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIHBvc3RNZXNzYWdlKG1lc3NhZ2UsIGNhbGxiYWNrS2V5LCBjYWxsYmFjaywgdmFsaWRDYWNoZUVudHJ5KSB7XG5cbiAgICB2YXIgdGFyZ2V0T3JpZ2luID0gVVJMcy5hbnRlbm5hSG9tZSgpO1xuICAgIGNhbGxiYWNrc1tjYWxsYmFja0tleV0gPSBjYWxsYmFjaztcblxuICAgIGlmIChpc1hETUxvYWRlZCkge1xuICAgICAgICB2YXIgY2FjaGVkUmVzcG9uc2UgPSBjYWNoZVtjYWxsYmFja0tleV07XG4gICAgICAgIGlmIChjYWNoZWRSZXNwb25zZSAhPT0gdW5kZWZpbmVkICYmIHZhbGlkQ2FjaGVFbnRyeSAmJiB2YWxpZENhY2hlRW50cnkoY2FjaGVbY2FsbGJhY2tLZXldKSkge1xuICAgICAgICAgICAgY2FsbGJhY2soY2FjaGVbY2FsbGJhY2tLZXldKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciB4ZG1GcmFtZSA9IGdldFhETUZyYW1lKCk7XG4gICAgICAgICAgICBpZiAoeGRtRnJhbWUpIHtcbiAgICAgICAgICAgICAgICB4ZG1GcmFtZS5wb3N0TWVzc2FnZShtZXNzYWdlLCB0YXJnZXRPcmlnaW4pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBnZXRYRE1GcmFtZSgpIHtcbiAgICAvLyBUT0RPOiBJcyB0aGlzIGEgc2VjdXJpdHkgcHJvYmxlbT8gV2hhdCBwcmV2ZW50cyBzb21lb25lIGZyb20gdXNpbmcgdGhpcyBzYW1lIG5hbWUgYW5kIGludGVyY2VwdGluZyBvdXIgbWVzc2FnZXM/XG4gICAgcmV0dXJuIHdpbmRvdy5mcmFtZXNbJ2FudC14ZG0taGlkZGVuJ107XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGdldFVzZXI6IGdldFVzZXJcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgVVJMcyA9IHJlcXVpcmUoJy4vdXJscycpO1xudmFyIFdpZGdldEJ1Y2tldCA9IHJlcXVpcmUoJy4vd2lkZ2V0LWJ1Y2tldCcpO1xuXG5mdW5jdGlvbiBjcmVhdGVYRE1mcmFtZShncm91cElkKSB7XG4gICAgLy9BTlQuc2Vzc2lvbi5yZWNlaXZlTWVzc2FnZSh7fSwgZnVuY3Rpb24oKSB7XG4gICAgLy8gICAgQU5ULnV0aWwudXNlckxvZ2luU3RhdGUoKTtcbiAgICAvL30pO1xuXG5cbiAgICB2YXIgaWZyYW1lVXJsID0gVVJMcy5hbnRlbm5hSG9tZSgpICsgXCIvc3RhdGljL3dpZGdldC1uZXcveGRtL3hkbS5odG1sXCIsXG4gICAgcGFyZW50VXJsID0gd2luZG93LmxvY2F0aW9uLmhyZWYsXG4gICAgcGFyZW50SG9zdCA9IHdpbmRvdy5sb2NhdGlvbi5wcm90b2NvbCArIFwiLy9cIiArIHdpbmRvdy5sb2NhdGlvbi5ob3N0LFxuICAgIC8vIFRPRE86IFJlc3RvcmUgdGhlIGJvb2ttYXJrbGV0IGF0dHJpYnV0ZSBvbiB0aGUgaUZyYW1lP1xuICAgIC8vYm9va21hcmtsZXQgPSAoIEFOVC5lbmdhZ2VTY3JpcHRQYXJhbXMuYm9va21hcmtsZXQgKSA/IFwiYm9va21hcmtsZXQ9dHJ1ZVwiOlwiXCIsXG4gICAgYm9va21hcmtsZXQgPSBcIlwiLFxuICAgIC8vIFRPRE86IFJlc3RvcmUgdGhlIGdyb3VwTmFtZSBhdHRyaWJ1dGUuIChXaGF0IGlzIGl0IGZvcj8pXG4gICAgJHhkbUlmcmFtZSA9ICQoJzxpZnJhbWUgaWQ9XCJhbnQteGRtLWhpZGRlblwiIG5hbWU9XCJhbnQteGRtLWhpZGRlblwiIHNyYz1cIicgKyBpZnJhbWVVcmwgKyAnP3BhcmVudFVybD0nICsgcGFyZW50VXJsICsgJyZwYXJlbnRIb3N0PScgKyBwYXJlbnRIb3N0ICsgJyZncm91cF9pZD0nK2dyb3VwSWQrJ1wiIHdpZHRoPVwiMVwiIGhlaWdodD1cIjFcIiBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlO3RvcDotMTAwMHB4O2xlZnQ6LTEwMDBweDtcIiAvPicpO1xuICAgIC8vJHhkbUlmcmFtZSA9ICQoJzxpZnJhbWUgaWQ9XCJhbnQteGRtLWhpZGRlblwiIG5hbWU9XCJhbnQteGRtLWhpZGRlblwiIHNyYz1cIicgKyBpZnJhbWVVcmwgKyAnP3BhcmVudFVybD0nICsgcGFyZW50VXJsICsgJyZwYXJlbnRIb3N0PScgKyBwYXJlbnRIb3N0ICsgJyZncm91cF9pZD0nK2dyb3VwSWQrJyZncm91cF9uYW1lPScrZW5jb2RlVVJJQ29tcG9uZW50KGdyb3VwTmFtZSkrJyYnK2Jvb2ttYXJrbGV0KydcIiB3aWR0aD1cIjFcIiBoZWlnaHQ9XCIxXCIgc3R5bGU9XCJwb3NpdGlvbjphYnNvbHV0ZTt0b3A6LTEwMDBweDtsZWZ0Oi0xMDAwcHg7XCIgLz4nKTtcbiAgICAkKFdpZGdldEJ1Y2tldCgpKS5hcHBlbmQoICR4ZG1JZnJhbWUgKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlWERNZnJhbWU6IGNyZWF0ZVhETWZyYW1lXG59OyIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOltcImFudGVubmEgYW50ZW5uYS1pbWFnZS1pbmRpY2F0b3Itd2lkZ2V0IFwiLHtcInRcIjo0LFwiZlwiOltcInJlYWN0aW9uc1wiXSxcInJcIjpcImNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbFwifV19LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50LWFudGVubmEtbG9nb1wifX0sXCIgXCIse1widFwiOjQsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXJlYWN0aW9uLXRvdGFsXCJ9LFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcImNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbFwifV19XSxcIm5cIjo1MCxcInJcIjpcImNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbFwifSx7XCJ0XCI6NCxcIm5cIjo1MSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcmVhY3Rpb24tcHJvbXB0XCJ9LFwiZlwiOltcIldoYXQgZG8geW91IHRoaW5rP1wiXX1dLFwiclwiOlwiY29udGFpbmVyRGF0YS5yZWFjdGlvblRvdGFsXCJ9XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOltcImFudGVubmEgYW50ZW5uYS1pbmRpY2F0b3Itd2lkZ2V0IFwiLHtcInRcIjo0LFwiZlwiOltcInJlYWN0aW9uc1wiXSxcInJcIjpcImNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbFwifV19LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50LWFudGVubmEtbG9nb1wifX0sXCIgXCIse1widFwiOjQsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXJlYWN0aW9uLXRvdGFsXCJ9LFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcImNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbFwifV19XSxcIm5cIjo1MCxcInJcIjpcImNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbFwifV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1wb3B1cFwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1wb3B1cC1ib2R5XCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50LWFudGVubmEtbG9nb1wifX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcG9wdXAtdGV4dFwifSxcImZcIjpbXCJXaGF0IGRvIHlvdSB0aGluaz9cIl19XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEgYW50ZW5uYS1yZWFjdGlvbnMtd2lkZ2V0XCIsXCJ0YWJpbmRleFwiOlwiMFwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1oZWFkZXJcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnQtYW50ZW5uYS1sb2dvXCJ9fSxcIiBSZWFjdGlvbnNcIl19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtYm9keVwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1yZWFjdGlvbnMtcGFnZSBhbnRlbm5hLXBhZ2VcIn0sXCJmXCI6W3tcInRcIjo0LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwidlwiOntcImNsaWNrXCI6XCJwbHVzb25lXCIsXCJtb3VzZWVudGVyXCI6XCJoaWdobGlnaHRcIixcIm1vdXNlbGVhdmVcIjpcImNsZWFyaGlnaGxpZ2h0c1wifSxcImFcIjp7XCJjbGFzc1wiOltcImFudGVubmEtcmVhY3Rpb24gXCIse1widFwiOjIsXCJ4XCI6e1wiclwiOltcInJlYWN0aW9uc0xheW91dENsYXNzXCIsXCJpbmRleFwiLFwiLi9jb3VudFwiXSxcInNcIjpcIl8wKF8xLF8yKVwifX1dLFwic3R5bGVcIjpbXCJiYWNrZ3JvdW5kLWNvbG9yOlwiLHtcInRcIjoyLFwieFwiOntcInJcIjpbXCJyZWFjdGlvbnNCYWNrZ3JvdW5kQ29sb3JcIixcImluZGV4XCJdLFwic1wiOlwiXzAoXzEpXCJ9fV19LFwiZlwiOltcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXJlYWN0aW9uLWJveFwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1yZWFjdGlvbi10ZXh0XCJ9LFwib1wiOlwic2l6ZXRvZml0XCIsXCJmXCI6W3tcInRcIjoyLFwiclwiOlwiLi90ZXh0XCJ9XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1yZWFjdGlvbi1jb3VudFwifSxcImZcIjpbe1widFwiOjIsXCJyXCI6XCIuL2NvdW50XCJ9XX1dfV19XSxcImlcIjpcImluZGV4XCIsXCJyXCI6XCJyZWFjdGlvbnNcIn1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWRlZmF1bHQtcGFnZSBhbnRlbm5hLXBhZ2VcIn0sXCJmXCI6W3tcInRcIjo0LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwidlwiOntcImNsaWNrXCI6XCJuZXdyZWFjdGlvblwifSxcImFcIjp7XCJjbGFzc1wiOltcImFudGVubmEtcmVhY3Rpb24gXCIse1widFwiOjIsXCJ4XCI6e1wiclwiOltcImRlZmF1bHRMYXlvdXRDbGFzc1wiLFwiaW5kZXhcIl0sXCJzXCI6XCJfMChfMSlcIn19XSxcInN0eWxlXCI6W1wiYmFja2dyb3VuZC1jb2xvcjpcIix7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZGVmYXVsdEJhY2tncm91bmRDb2xvclwiLFwiaW5kZXhcIl0sXCJzXCI6XCJfMChfMSlcIn19XX0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcmVhY3Rpb24tYm94XCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXJlYWN0aW9uLXRleHRcIn0sXCJvXCI6XCJzaXpldG9maXRcIixcImZcIjpbe1widFwiOjIsXCJyXCI6XCIuL3RleHRcIn1dfV19XX1dLFwiaVwiOlwiaW5kZXhcIixcInJcIjpcImRlZmF1bHRSZWFjdGlvbnNcIn1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWNvbmZpcm0tcGFnZSBhbnRlbm5hLXBhZ2VcIn0sXCJmXCI6W3tcInRcIjo0LFwiZlwiOltcIkxvb2tzIGxpa2UgeW91IHN0aWxsIGZlZWwgdGhlIHNhbWUgd2F5LlwiXSxcIm5cIjo1MCxcInJcIjpcInJlc3BvbnNlLmV4aXN0aW5nXCJ9LHtcInRcIjo0LFwiblwiOjUxLFwiZlwiOltcIk5ldyByZWFjdGlvbiByZWNlaXZlZC5cIl0sXCJyXCI6XCJyZXNwb25zZS5leGlzdGluZ1wifV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcHJvZ3Jlc3MtcGFnZSBhbnRlbm5hLXBhZ2VcIn0sXCJmXCI6W119XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1mb290ZXItYXJlYVwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1mb290ZXIgYW50ZW5uYS1yZWFjdGlvbnMtZm9vdGVyXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcInZcIjp7XCJjbGlja1wiOlwic2hvd2RlZmF1bHRcIn0sXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtdGhpbmtcIn0sXCJmXCI6W1wiV2hhdCBkbyB5b3UgdGhpbms/XCJdfV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtZm9vdGVyIGFudGVubmEtZGVmYXVsdC1mb290ZXJcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwidlwiOntcImNsaWNrXCI6XCJhZGRjdXN0b21cIn0sXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY3VzdG9tXCJ9LFwiZlwiOltcIisgQWRkIHlvdXIgb3duXCJdfV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtZm9vdGVyIGFudGVubmEtY29uZmlybS1mb290ZXJcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwidlwiOntcImNsaWNrXCI6XCJzaGFyZVwifSxcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1zaGFyZVwifSxcImZcIjpbXCJGYWNlYm9vayFcIl19XX1dfV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYSBhbnQtc3VtbWFyeS13aWRnZXRcIixcImFudC1oYXNoXCI6W3tcInRcIjoyLFwiclwiOlwicGFnZUhhc2hcIn1dfSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJhXCIsXCJhXCI6e1wiaHJlZlwiOlwiaHR0cDovL3d3dy5hbnRlbm5hLmlzXCIsXCJ0YXJnZXRcIjpcIl9ibGFua1wifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudC1hbnRlbm5hLWxvZ29cIn19XX0sXCIgXCIse1widFwiOjQsXCJmXCI6W3tcInRcIjo0LFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcInN1bW1hcnlUb3RhbFwifV0sXCJuXCI6NTAsXCJyXCI6XCJzdW1tYXJ5VG90YWxcIn0sXCIgUmVhY3Rpb25zXCJdLFwiblwiOjUwLFwieFwiOntcInJcIjpbXCJzdW1tYXJ5VG90YWxcIl0sXCJzXCI6XCJfMCE9PXVuZGVmaW5lZFwifX1dfV19Il19
