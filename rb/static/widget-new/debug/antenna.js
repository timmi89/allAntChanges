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
        defaultReactions: defaultReactions,
        reactionBackgroundColors: backgroundColor(data('tag_box_bg_colors'))
    }
}

//noinspection JSUnresolvedVariable
module.exports = {
    create: createFromJSON
};
},{"./utils/jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/indicator-widget.js":[function(require,module,exports){
var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var PopupWidget = require('./popup-widget');
var ReactionsWidget = require('./reactions-widget');
var Range = require('./utils/range');


function createIndicatorWidget(options) {
    // TODO: Adjust visibility based on whether there are reactions on the content (honoring the flag about how many to show at once).
    // TODO: Show intermediate popup thingy when there are no reactions
    var element = options.element;
    var containerData = options.containerData;
    var $containerElement = options.containerElement;
    var pageData = options.pageData;
    var groupSettings = options.groupSettings;
    var defaultReactions = options.defaultReactions;
    var ractive = Ractive({
        el: element,
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
        defaultReactions: defaultReactions,
        pageData: pageData,
        groupSettings: groupSettings
    };

    var hoverTimeout;
    ractive.on('complete', function() {
        var $rootElement = $(rootElement(ractive));
        $rootElement.on('mouseenter.antenna', function(event) {
            if (event.buttons !== 0) {
                // Don't react if the user is dragging or selecting text.
                return;
            }
            if (containerData.reactions.length > 0) {
                openReactionsWindow(reactionWidgetOptions, ractive);
            } else {
                clearTimeout(hoverTimeout); // only one timeout at a time
                hoverTimeout = setTimeout(function() {
                    var $icon = $(rootElement(ractive)).find('.ant-antenna-logo');
                    var offset = $icon.offset();
                    var coordinates = {
                        top: offset.top + Math.floor($icon.height() / 2), // TODO this number is a little off because the div doesn't tightly wrap the inserted font character
                        left: offset.left + Math.floor($icon.width() / 2)
                    };
                    PopupWidget.show(coordinates, grabNodeAndOpenOnSelection($containerElement.get(0), reactionWidgetOptions, ractive));
                }, 200);
            }
        });
        $rootElement.on('mouseleave.antenna', function() {
            clearTimeout(hoverTimeout);
        });
        $containerElement.on('mouseenter.antenna', function() {
            $rootElement.addClass('active');
        });
        $containerElement.on('mouseleave.antenna', function() {
            $rootElement.removeClass('active');
        })
    });
}

function grabNodeAndOpenOnSelection(node, reactionWidgetOptions, ractive) {
    return function() {
        Range.grabNode(node, function(text, location) {
            reactionWidgetOptions.location = location;
            reactionWidgetOptions.body = text;
            openReactionsWindow(reactionWidgetOptions, ractive);
        });
    }
}

function rootElement(ractive) {
    return ractive.find('.antenna-indicator-widget');
}

// TODO refactor this duplicated code from summary-widget.js
function openReactionsWindow(reactionOptions, ractive) {
    if (!ractive.reactionsWidget) {
        ractive.reactionsWidget = ReactionsWidget.create(reactionOptions);
    }
    ractive.reactionsWidget.open(rootElement(ractive));
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

var IndicatorWidget = require('./indicator-widget');
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
        var containerData = PageData.getContainerData(pageData, 'page'); // Magic hash for page reactions
        containerData.type = 'page'; // TODO: revisit whether it makes sense to set the type here
        var defaultReactions = groupSettings.defaultReactions($summary); // TODO: do we support customizing the default reactions at this level?
        SummaryWidget.create(container, containerData, pageData, defaultReactions, groupSettings);
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
},{"./indicator-widget":"/Users/jburns/antenna/rb/static/widget-new/src/js/indicator-widget.js","./page-data":"/Users/jburns/antenna/rb/static/widget-new/src/js/page-data.js","./summary-widget":"/Users/jburns/antenna/rb/static/widget-new/src/js/summary-widget.js","./text-reactions":"/Users/jburns/antenna/rb/static/widget-new/src/js/text-reactions.js","./utils/hash":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/hash.js","./utils/jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js","./utils/page-utils":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/page-utils.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/popup-widget.js":[function(require,module,exports){
var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var WidgetBucket = require('./utils/widget-bucket');
var TransitionUtil = require('./utils/transition-util');

var ractive;
var clickHandler;


function getRootElement(callback) {
    // TODO revisit this, it's kind of goofy and it might have a timing problem
    if (!ractive) {
        var bucket = WidgetBucket();
        ractive = Ractive({
            el: bucket,
            append: true,
            template: require('../templates/popup-widget.hbs.html')
        });
        ractive.on('complete', function() {
            var $element = $(ractive.find('.antenna-popup'));
            $element.on('mousedown', false); // Prevent mousedown from propogating, so the browser doesn't clear the text selection.
            $element.on('click.antenna-popup', function(event) {
                event.stopPropagation();
                hidePopup($element);
                if (clickHandler) {
                    clickHandler();
                }
            });
            callback($element);
        })
    } else {
        callback($(ractive.find('.antenna-popup')));
    }
}

function showPopup(coordinates, callback) {
    getRootElement(function($element) {
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
    });
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

function createReactionsWidget(options) {
    var reactionsData = options.reactionsData;
    var containerData = options.containerData;
    var containerElement = options.containerElement;
    var contentLocation = options.location;
    var contentType = options.contentType || "text"; // TODO
    var contentBody = options.body;
    var defaultReactions = options.defaultReactions;
    var pageData = options.pageData;
    var groupSettings = options.groupSettings;
    var colors = groupSettings.reactionBackgroundColors();
    //sortReactionData(reactionsData);
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
            sizetofit: sizeToFit
        },
        antenna: {} // create our own property bucket on the instance
    });
    ractive.on('complete', function() {
        var $rootElement = $(rootElement(ractive));
        Moveable.makeMoveable($rootElement, $rootElement.find('.antenna-header'));
    });
    ractive.on('change', function() {
        reactionsLayoutData = computeLayoutData(reactionsData, colors);
    });
    if (containerElement) {
        ractive.on('highlight', highlightContent(containerData, pageData, ractive, containerElement));
        ractive.on('clearhighlights', Range.clearHighlights);
    }
    ractive.on('plusone', plusOne(containerData, pageData, ractive));
    ractive.on('newreaction', newDefaultReaction(containerData, pageData, contentBody, contentLocation, contentType, ractive));
    return {
        open: openWindow(reactionsData, ractive)
    };
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

function sizeToFit(node) {
    var $element = $(node);
    var $rootElement = $element.closest('.antenna-reactions-widget');
    if ($rootElement.length > 0) {
        $rootElement.css({display: 'block', left: '100%'});
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
        $rootElement.css({display: '', left: ''});
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

function newDefaultReaction(containerData, pageData, contentBody, contentLocation, contentType, ractive) {
    return function(event) {
        var defaultReactionData = event.context;
        showPage('.antenna-progress-page', ractive, false, true);
        AjaxClient.postNewReaction(defaultReactionData, containerData, pageData, contentLocation, contentBody, contentType, success, error);

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
                        location: contentLocation,
                        kind: contentType,
                        body: contentBody,
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
            showPage('.antenna-confirm-page', ractive, true);
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
            showPage('.antenna-confirm-page', ractive, true);
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
        $body.animate({ height: newHeight });
    } else {
        $body.css({ height: newHeight });
    }
    // TODO: we might not need width resizing at all.
    var minWidth = $element.css('min-width');
    var width = (parseInt(minWidth) > 0) ? minWidth: '';
    if (animate) {
        $root.animate({ width: width });
    } else {
        $root.css({ width: width });
    }
}

function openWindow(reactionsData, ractive) {
    return function(elementOrCoords) {
        $('.antenna-reactions-widget').trigger('focusout'); // Prompt any other open windows to close.
        var coords;
        if (elementOrCoords.top && elementOrCoords.left) {
            coords = elementOrCoords;
        } else {
            var $relativeElement = $(elementOrCoords);
            var offset = $relativeElement.offset();
            coords = {
                top: offset.top + 5,
                left: offset.left + 5
            };
        }
        // TODO: Look at whether we're opening off screen and adjust the coords if needed
        var $rootElement = $(rootElement(ractive));
        $rootElement.stop(true, true).addClass('open').css(coords);

        if (reactionsData.length > 0) {
            showPage('.antenna-reactions-page', ractive, false);
        } else {
            // TODO allow to override and force showing of default
            showPage('.antenna-default-page', ractive, false);
        }

        setupWindowClose(ractive);
    };
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
    }
}

//noinspection JSUnresolvedVariable
module.exports = {
    create: createReactionsWidget
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
    ractive.on('complete', function() {
        $(rootElement(ractive)).on('mouseenter', function(event) {
           openReactionsWindow(containerData, pageData, defaultReactions, groupSettings, ractive);
        });
    });
}

function rootElement(ractive) {
    // TODO: gotta be a better way to get this
    // TODO: our click handler is getting called twice, so it looks like this somehow gets the wrong element if there are two summary widgets together?
    return ractive.find('div');
}

function openReactionsWindow(containerData, pageData, defaultReactions, groupSettings, ractive) {
    if (!ractive.reactionsWidget) {
        ractive.reactionsWidget = ReactionsWidget.create({
            reactionsData: pageData.summaryReactions,
            containerData: containerData,
            defaultReactions: defaultReactions,
            pageData: pageData,
            groupSettings: groupSettings
        });
    }
    // TODO: Unclear if it's safe to immediately start making calls on the ractive instance after its instantiated or if
    //       we need to structure everything with callbacks/promises.
    ractive.reactionsWidget.open(rootElement(ractive));
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
            // TODO: open the reaction widget showing the default reactions
            reactionsWidgetOptions.location = location;
            reactionsWidgetOptions.body = text;
            var reactionsWidget = ReactionsWidget.create(reactionsWidgetOptions);
            // TODO: don't leak. need to either clean up the reactions widgets that we create or reuse.
            reactionsWidget.open(coordinates);
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

function postNewPageReaction() {
    // speculative...
}

function postNewTextReaction() {
    // speculative...
}

function postNewImageReaction() {
    // speculative...
}

function postNewReaction(reactionData, containerData, pageData, contentLocation, contentBody, contentType, success, error) {
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
                location: contentLocation,
                body: contentBody,
                kind: contentType,
                item_type: '' // TODO: looks unused but TagHandler blows up without it. Current client passes in "page" for page reactions.
            }
        };
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
                kind: containerData.type, // TODO: resolve whether to use the short or long form reactionData.content.kind, // 'pag', 'txt', 'med', 'img'
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
    if (rangy) {
        // TODO: Consider using the element created with the 'classifier' rather than the mouse location
        var selection = rangy.getSelection();
        if (isValidSelection(selection, node, excludeNode)) {
            return {
                x: event.pageX - ( selection.isBackwards() ? -5 : 5),
                y: event.pageY - 8 // TODO: exact coords
            }
        }
    }
    return null;
}

// Attempts to get a range from the current selection. This expands the
// selected region to include word boundaries.
function grabSelection(node, callback, excludeNode) {
    if (rangy) {
        // TODO: make sure the selection is within the given node
        var selection = rangy.getSelection();
        if (isValidSelection(selection, node, excludeNode)) {
            selection.expand('word', { trim: true });
            var location = rangy.serializeSelection(selection, true, node);
            var text = selection.toString();
            highlightSelection(selection); // Highlighting deselects the text, so do this last.
            callback(text, location);
        }
    }
}

function isValidSelection(selection, node, excludeNode) {
    return !selection.isCollapsed &&  // Non-empty selection
        selection.rangeCount === 1 && // Single selection
        (!excludeNode || !selection.containsNode(excludeNode, true)) && // Selection doesn't contain anything we've said we don't want (e.g. the indicator)
        node.contains(selection.getRangeAt(0).commonAncestorContainer); // Selection is contained entirely within the node
}

function grabNode(node, callback) {
    if (rangy) {
        var range = rangy.createRange(document);
        range.selectNodeContents(node);
        var selection = rangy.getSelection();
        selection.setSingleRange(range);
        var location = rangy.serializeSelection(selection, true, node);
        var text = selection.toString();
        highlightSelection(selection); // Highlighting deselects the text, so do this last.
        callback(text, location);
    }
}

// Highlights the given location inside the given node.
function highlightLocation(node, location) {
    // TODO error handling in case the range is not valid?
    if (rangy && rangy.canDeserializeRange(location, node, document)) {
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
    if (rangy) {
        var classApplier = getClassApplier();
        for (var i = 0; i < highlightedRanges.length; i++) {
            var range = highlightedRanges[i];
            if (classApplier.isAppliedToRange(range)) {
                classApplier.undoToRange(range);
            }
        }
        highlightedRanges = [];
    }
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
                $element.off(event);
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
    return window.location.protocol + "//www.antenna.is";
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
},{"./jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js","./urls":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/urls.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/templates/indicator-widget.hbs.html":[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"span","a":{"class":["antenna antenna-indicator-widget ",{"t":4,"f":["reactions"],"r":"containerData.reactionTotal"}]},"f":[{"t":7,"e":"span","a":{"class":"ant-antenna-logo"}}," ",{"t":4,"f":[{"t":4,"f":[{"t":7,"e":"span","a":{"class":"antenna-reaction-total"},"f":[{"t":2,"r":"containerData.reactionTotal"}]}],"n":50,"r":"containerData.reactionTotal"}],"n":50,"x":{"r":["containerData.reactionTotal"],"s":"_0!==undefined"}}]}]}
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/templates/popup-widget.hbs.html":[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna-popup"},"f":[{"t":7,"e":"div","a":{"class":"antenna-popup-body"},"f":[{"t":7,"e":"span","a":{"class":"ant-antenna-logo"}}," ",{"t":7,"e":"span","a":{"class":"antenna-popup-text"},"f":["What do you think?"]}]}]}]}
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/templates/reactions-widget.hbs.html":[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna antenna-reactions-widget","tabindex":"0"},"f":[{"t":7,"e":"div","a":{"class":"antenna-header"},"f":[{"t":7,"e":"span","a":{"class":"ant-antenna-logo"}}," Reactions"]}," ",{"t":7,"e":"div","a":{"class":"antenna-body"},"f":[{"t":7,"e":"div","a":{"class":"antenna-reactions-page antenna-page"},"f":[{"t":4,"f":[{"t":7,"e":"div","v":{"click":"plusone","mouseenter":"highlight","mouseleave":"clearhighlights"},"a":{"class":["antenna-reaction ",{"t":2,"x":{"r":["reactionsLayoutClass","index","./count"],"s":"_0(_1,_2)"}}],"style":["background-color:",{"t":2,"x":{"r":["reactionsBackgroundColor","index"],"s":"_0(_1)"}}]},"f":[" ",{"t":7,"e":"div","a":{"class":"antenna-reaction-box"},"f":[{"t":7,"e":"div","a":{"class":"antenna-reaction-text"},"o":"sizetofit","f":[{"t":2,"r":"./text"}]}," ",{"t":7,"e":"div","a":{"class":"antenna-reaction-count"},"f":[{"t":2,"r":"./count"}]}]}]}],"i":"index","r":"reactions"}]}," ",{"t":7,"e":"div","a":{"class":"antenna-default-page antenna-page"},"f":[{"t":4,"f":[{"t":7,"e":"div","v":{"click":"newreaction"},"a":{"class":["antenna-reaction ",{"t":2,"x":{"r":["defaultLayoutClass","index"],"s":"_0(_1)"}}],"style":["background-color:",{"t":2,"x":{"r":["defaultBackgroundColor","index"],"s":"_0(_1)"}}]},"f":[{"t":7,"e":"div","a":{"class":"antenna-reaction-box"},"f":[{"t":7,"e":"div","a":{"class":"antenna-reaction-text"},"o":"sizetofit","f":[{"t":2,"r":"./text"}]}]}]}],"i":"index","r":"defaultReactions"}]}," ",{"t":7,"e":"div","a":{"class":"antenna-confirm-page antenna-page"},"f":[{"t":4,"f":["Looks like you still feel the same way."],"n":50,"r":"response.existing"},{"t":4,"n":51,"f":["New reaction received."],"r":"response.existing"}]}," ",{"t":7,"e":"div","a":{"class":"antenna-progress-page antenna-page"},"f":[]}]}," ",{"t":7,"e":"div","a":{"class":"antenna-footer"},"f":["What do you think?"]}]}]}
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/templates/summary-widget.hbs.html":[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna ant-summary-widget","ant-hash":[{"t":2,"r":"pageHash"}]},"f":[{"t":7,"e":"a","a":{"href":"http://www.antenna.is","target":"_blank"},"f":[{"t":7,"e":"span","a":{"class":"ant-antenna-logo"}}]}," ",{"t":4,"f":[{"t":4,"f":[{"t":2,"r":"summaryTotal"}],"n":50,"r":"summaryTotal"}," Reactions"],"n":50,"x":{"r":["summaryTotal"],"s":"_0!==undefined"}}]}]}
},{}]},{},["/Users/jburns/antenna/rb/static/widget-new/src/js/antenna.js","/Users/jburns/antenna/rb/static/widget-new/src/js/css-loader.js","/Users/jburns/antenna/rb/static/widget-new/src/js/group-settings-loader.js","/Users/jburns/antenna/rb/static/widget-new/src/js/group-settings.js","/Users/jburns/antenna/rb/static/widget-new/src/js/indicator-widget.js","/Users/jburns/antenna/rb/static/widget-new/src/js/page-data-loader.js","/Users/jburns/antenna/rb/static/widget-new/src/js/page-data.js","/Users/jburns/antenna/rb/static/widget-new/src/js/page-scanner.js","/Users/jburns/antenna/rb/static/widget-new/src/js/popup-widget.js","/Users/jburns/antenna/rb/static/widget-new/src/js/reactions-widget.js","/Users/jburns/antenna/rb/static/widget-new/src/js/script-loader.js","/Users/jburns/antenna/rb/static/widget-new/src/js/summary-widget.js","/Users/jburns/antenna/rb/static/widget-new/src/js/text-reactions.js","/Users/jburns/antenna/rb/static/widget-new/src/templates/indicator-widget.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/popup-widget.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/reactions-widget.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/summary-widget.hbs.html"])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi93aWRnZXQtbmV3L3NyYy9qcy9hbnRlbm5hLmpzIiwiLi4vd2lkZ2V0LW5ldy9zcmMvanMvY3NzLWxvYWRlci5qcyIsIi4uL3dpZGdldC1uZXcvc3JjL2pzL2dyb3VwLXNldHRpbmdzLWxvYWRlci5qcyIsIi4uL3dpZGdldC1uZXcvc3JjL2pzL2dyb3VwLXNldHRpbmdzLmpzIiwiLi4vd2lkZ2V0LW5ldy9zcmMvanMvaW5kaWNhdG9yLXdpZGdldC5qcyIsIi4uL3dpZGdldC1uZXcvc3JjL2pzL3BhZ2UtZGF0YS1sb2FkZXIuanMiLCIuLi93aWRnZXQtbmV3L3NyYy9qcy9wYWdlLWRhdGEuanMiLCIuLi93aWRnZXQtbmV3L3NyYy9qcy9wYWdlLXNjYW5uZXIuanMiLCIuLi93aWRnZXQtbmV3L3NyYy9qcy9wb3B1cC13aWRnZXQuanMiLCIuLi93aWRnZXQtbmV3L3NyYy9qcy9yZWFjdGlvbnMtd2lkZ2V0LmpzIiwiLi4vd2lkZ2V0LW5ldy9zcmMvanMvc2NyaXB0LWxvYWRlci5qcyIsIi4uL3dpZGdldC1uZXcvc3JjL2pzL3N1bW1hcnktd2lkZ2V0LmpzIiwiLi4vd2lkZ2V0LW5ldy9zcmMvanMvdGV4dC1yZWFjdGlvbnMuanMiLCIuLi93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9hamF4LWNsaWVudC5qcyIsIi4uL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL2hhc2guanMiLCIuLi93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9qcXVlcnktcHJvdmlkZXIuanMiLCIuLi93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9tZDUuanMiLCIuLi93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9tb3ZlYWJsZS5qcyIsIi4uL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL29mZmxpbmUuanMiLCIuLi93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9wYWdlLXV0aWxzLmpzIiwiLi4vd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvcmFuZ2UuanMiLCIuLi93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9yYW5neS1wcm92aWRlci5qcyIsIi4uL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL3RyYW5zaXRpb24tdXRpbC5qcyIsIi4uL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL3VybHMuanMiLCIuLi93aWRnZXQtbmV3L3NyYy9qcy91dGlscy93aWRnZXQtYnVja2V0LmpzIiwiLi4vd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMveGRtLWNsaWVudC5qcyIsIi4uL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL3hkbS1sb2FkZXIuanMiLCIuLi93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvaW5kaWNhdG9yLXdpZGdldC5oYnMuaHRtbCIsIi4uL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9wb3B1cC13aWRnZXQuaGJzLmh0bWwiLCIuLi93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvcmVhY3Rpb25zLXdpZGdldC5oYnMuaHRtbCIsIi4uL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9zdW1tYXJ5LXdpZGdldC5oYnMuaHRtbCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9IQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBOztBQ0FBOztBQ0FBOztBQ0FBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIlxudmFyIFNjcmlwdExvYWRlciA9IHJlcXVpcmUoJy4vc2NyaXB0LWxvYWRlcicpO1xudmFyIENzc0xvYWRlciA9IHJlcXVpcmUoJy4vY3NzLWxvYWRlcicpO1xudmFyIEdyb3VwU2V0dGluZ3NMb2FkZXIgPSByZXF1aXJlKCcuL2dyb3VwLXNldHRpbmdzLWxvYWRlcicpO1xudmFyIFBhZ2VEYXRhTG9hZGVyID0gcmVxdWlyZSgnLi9wYWdlLWRhdGEtbG9hZGVyJyk7XG52YXIgUGFnZVNjYW5uZXIgPSByZXF1aXJlKCcuL3BhZ2Utc2Nhbm5lcicpO1xudmFyIFhETUxvYWRlciA9IHJlcXVpcmUoJy4vdXRpbHMveGRtLWxvYWRlcicpO1xuXG5cbi8vIFN0ZXAgMSAtIGtpY2sgb2ZmIHRoZSBhc3luY2hyb25vdXMgbG9hZGluZyBvZiB0aGUgSmF2YXNjcmlwdCBhbmQgQ1NTIHdlIG5lZWQuXG5TY3JpcHRMb2FkZXIubG9hZChsb2FkR3JvdXBTZXR0aW5ncyk7XG5Dc3NMb2FkZXIubG9hZCgpO1xuXG5mdW5jdGlvbiBsb2FkR3JvdXBTZXR0aW5ncygpIHtcbiAgICAvLyBTdGVwIDIgLSBPbmNlIHdlIGhhdmUgdGhlIHNldHRpbmdzLCB3ZSBjYW4ga2ljayBvZmYgYSBjb3VwbGUgdGhpbmdzIGluIHBhcmFsbGVsOlxuICAgIC8vXG4gICAgLy8gLS0gY3JlYXRlIHRoZSBoaWRkZW4gaWZyYW1lIHdlIHVzZSBmb3IgY3Jvc3MtZG9tYWluIGNvb2tpZXMgKHByaW1hcmlseSB1c2VyIGxvZ2luKVxuICAgIC8vIC0tIHN0YXJ0IGZldGNoaW5nIHRoZSBwYWdlIGRhdGFcbiAgICAvLyAtLSBzdGFydCBoYXNoaW5nIHRoZSBwYWdlIGFuZCBpbnNlcnRpbmcgdGhlIGFmZm9yZGFuY2VzIChpbiB0aGUgZW1wdHkgc3RhdGUpXG4gICAgLy9cbiAgICAvLyBBcyB0aGUgcGFnZSBpcyBzY2FubmVkLCB0aGUgd2lkZ2V0cyBhcmUgY3JlYXRlZCBhbmQgYm91bmQgdG8gdGhlIHBhZ2UgZGF0YSB0aGF0IGNvbWVzIGluLlxuICAgIEdyb3VwU2V0dGluZ3NMb2FkZXIubG9hZChmdW5jdGlvbihncm91cFNldHRpbmdzKSB7XG4gICAgICAgIGluaXRYZG1GcmFtZShncm91cFNldHRpbmdzKTtcbiAgICAgICAgZmV0Y2hQYWdlRGF0YShncm91cFNldHRpbmdzKTtcbiAgICAgICAgc2NhblBhZ2UoZ3JvdXBTZXR0aW5ncyk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGluaXRYZG1GcmFtZShncm91cFNldHRpbmdzKSB7XG4gICAgWERNTG9hZGVyLmNyZWF0ZVhETWZyYW1lKGdyb3VwU2V0dGluZ3MuZ3JvdXBJZCk7XG59XG5cbmZ1bmN0aW9uIGZldGNoUGFnZURhdGEoZ3JvdXBTZXR0aW5ncykge1xuICAgIFBhZ2VEYXRhTG9hZGVyLmxvYWQoZ3JvdXBTZXR0aW5ncyk7XG59XG5cbmZ1bmN0aW9uIHNjYW5QYWdlKGdyb3VwU2V0dGluZ3MpIHtcbiAgICBQYWdlU2Nhbm5lci5zY2FuKGdyb3VwU2V0dGluZ3MpO1xufSIsIlxudmFyIGJhc2VVcmwgPSAnaHR0cDovL2xvY2FsaG9zdDo4MDgxJzsgLy8gVE9ETyBjb21wdXRlIHRoaXNcblxuZnVuY3Rpb24gbG9hZENzcygpIHtcbiAgICB2YXIgaGVhZCA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF07XG4gICAgaWYgKGhlYWQpIHtcbiAgICAgICAgLy8gVG8gbWFrZSBzdXJlIG5vbmUgb2Ygb3VyIGNvbnRlbnQgcmVuZGVycyBvbiB0aGUgcGFnZSBiZWZvcmUgb3VyIENTUyBpcyBsb2FkZWQsIHdlIGFwcGVuZCBhIHNpbXBsZSBpbmxpbmUgc3R5bGVcbiAgICAgICAgLy8gZWxlbWVudCB0aGF0IHR1cm5zIG9mZiBvdXIgZWxlbWVudHMgKmJlZm9yZSogb3VyIENTUyBsaW5rcy4gVGhpcyBleHBsb2l0cyB0aGUgY2FzY2FkZSBydWxlcyAtIG91ciBDU1MgZmlsZXMgYXBwZWFyXG4gICAgICAgIC8vIGFmdGVyIHRoZSBpbmxpbmUgc3R5bGUgaW4gdGhlIGRvY3VtZW50LCBzbyB0aGV5IHRha2UgcHJlY2VkZW5jZSAoYW5kIG1ha2UgZXZlcnl0aGluZyBhcHBlYXIpIG9uY2UgdGhleSdyZSBsb2FkZWQuXG4gICAgICAgIHZhciBzdHlsZVRhZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XG4gICAgICAgIHN0eWxlVGFnLmlubmVySFRNTCA9ICcuYW50ZW5uYXtkaXNwbGF5Om5vbmU7fSc7XG4gICAgICAgIGhlYWQuYXBwZW5kQ2hpbGQoc3R5bGVUYWcpO1xuXG4gICAgICAgIHZhciBjc3NIcmVmcyA9IFtcbiAgICAgICAgICAgIC8vIFRPRE8gYnJpbmdpbmcgaW4gbXVsdGlwbGUgY3NzIGZpbGVzIGJyZWFrcyB0aGUgd2F5IHdlIHdhaXQgdW50aWwgb3VyIENTUyBpcyBsb2FkZWQgYmVmb3JlIHNob3dpbmcgb3VyIGNvbnRlbnQuXG4gICAgICAgICAgICAvLyAgICAgIHdlIG5lZWQgdG8gZmluZCBhIHdheSB0byBicmluZyB0aGF0IGJhY2suIG9uZSBzaW1wbGUgd2F5IC0gYWxzbyBjb21waWxlIHRoZSBhbnRlbm5hLWZvbnQuY3NzIGludG8gdGhlIGFudGVubmEuY3NzIGZpbGUuXG4gICAgICAgICAgICAvLyAgICAgIG9wZW4gcXVlc3Rpb24gLSBob3cgZG9lcyBpdCBhbGwgcGxheSB3aXRoIGZvbnQgaWNvbnMgdGhhdCBhcmUgZG93bmxvYWRlZCBhcyB5ZXQgYW5vdGhlciBmaWxlP1xuICAgICAgICAgICAgYmFzZVVybCArICcvc3RhdGljL2Nzcy9hbnRlbm5hLWZvbnQvYW50ZW5uYS1mb250LmNzcycsXG4gICAgICAgICAgICBiYXNlVXJsICsgJy9zdGF0aWMvd2lkZ2V0LW5ldy9kZWJ1Zy9hbnRlbm5hLmNzcycgLy8gVE9ETyB0aGlzIG5lZWRzIGEgZmluYWwgcGF0aC4gQ0ROIGZvciBwcm9kdWN0aW9uIGFuZCBsb2NhbCBmaWxlIGZvciBkZXZlbG9wbWVudD9cbiAgICAgICAgXTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjc3NIcmVmcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgbG9hZEZpbGUoY3NzSHJlZnNbaV0sIGhlYWQpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBsb2FkRmlsZShocmVmLCBoZWFkKSB7XG4gICAgdmFyIGxpbmtUYWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaW5rJyk7XG4gICAgbGlua1RhZy5zZXRBdHRyaWJ1dGUoJ2hyZWYnLCBocmVmKTtcbiAgICBsaW5rVGFnLnNldEF0dHJpYnV0ZSgncmVsJywgJ3N0eWxlc2hlZXQnKTtcbiAgICBsaW5rVGFnLnNldEF0dHJpYnV0ZSgndHlwZScsICd0ZXh0L2NzcycpO1xuICAgIGhlYWQuYXBwZW5kQ2hpbGQobGlua1RhZyk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGxvYWQgOiBsb2FkQ3NzXG59OyIsInZhciAkOyByZXF1aXJlKCcuL3V0aWxzL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIEdyb3VwU2V0dGluZ3MgPSByZXF1aXJlKCcuL2dyb3VwLXNldHRpbmdzJyk7XG5cbi8vIFRPRE8gZm9sZCB0aGlzIG1vZHVsZSBpbnRvIGdyb3VwLXNldHRpbmdzP1xuXG5mdW5jdGlvbiBsb2FkU2V0dGluZ3MoY2FsbGJhY2spIHtcbiAgICAkLmdldEpTT05QKCcvYXBpL3NldHRpbmdzJywgeyBob3N0X25hbWU6IHdpbmRvdy5hbnRlbm5hX2hvc3QgfSwgc3VjY2VzcywgZXJyb3IpO1xuXG4gICAgZnVuY3Rpb24gc3VjY2Vzcyhqc29uKSB7XG4gICAgICAgIHZhciBncm91cFNldHRpbmdzID0gR3JvdXBTZXR0aW5ncy5jcmVhdGUoanNvbik7XG4gICAgICAgIGNhbGxiYWNrKGdyb3VwU2V0dGluZ3MpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGVycm9yKG1lc3NhZ2UpIHtcbiAgICAgICAgLy8gVE9ETyBoYW5kbGUgZXJyb3JzIHRoYXQgaGFwcGVuIHdoZW4gbG9hZGluZyBjb25maWcgZGF0YVxuICAgIH1cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGxvYWQ6IGxvYWRTZXR0aW5nc1xufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi91dGlscy9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcblxuLy8gVE9ETzogdHJpbSB0cmFpbGluZyBjb21tYXMgZnJvbSBhbnkgc2VsZWN0b3IgdmFsdWVzXG5cbi8vIFRPRE86IFJldmlldy4gVGhlc2UgYXJlIGp1c3QgY29waWVkIGZyb20gZW5nYWdlX2Z1bGwuXG52YXIgZGVmYXVsdHMgPSB7XG4gICAgcHJlbWl1bTogZmFsc2UsXG4gICAgaW1nX3NlbGVjdG9yOiBcImltZ1wiLFxuICAgIGltZ19jb250YWluZXJfc2VsZWN0b3JzOlwiI3ByaW1hcnktcGhvdG9cIixcbiAgICBhY3RpdmVfc2VjdGlvbnM6IFwiYm9keVwiLFxuICAgIGFubm9fd2hpdGVsaXN0OiBcImJvZHkgcFwiLFxuICAgIGFjdGl2ZV9zZWN0aW9uc193aXRoX2Fubm9fd2hpdGVsaXN0OlwiXCIsXG4gICAgbWVkaWFfc2VsZWN0b3I6IFwiZW1iZWQsIHZpZGVvLCBvYmplY3QsIGlmcmFtZVwiLFxuICAgIGNvbW1lbnRfbGVuZ3RoOiA1MDAsXG4gICAgbm9fYW50OiBcIlwiLFxuICAgIGltZ19ibGFja2xpc3Q6IFwiXCIsXG4gICAgY3VzdG9tX2NzczogXCJcIixcbiAgICAvL3RvZG86IHRlbXAgaW5saW5lX2luZGljYXRvciBkZWZhdWx0cyB0byBtYWtlIHRoZW0gc2hvdyB1cCBvbiBhbGwgbWVkaWEgLSByZW1vdmUgdGhpcyBsYXRlci5cbiAgICBpbmxpbmVfc2VsZWN0b3I6ICdpbWcsIGVtYmVkLCB2aWRlbywgb2JqZWN0LCBpZnJhbWUnLFxuICAgIHBhcmFncmFwaF9oZWxwZXI6IHRydWUsXG4gICAgbWVkaWFfdXJsX2lnbm9yZV9xdWVyeTogdHJ1ZSxcbiAgICBzdW1tYXJ5X3dpZGdldF9zZWxlY3RvcjogJy5hbnQtcGFnZS1zdW1tYXJ5JywgLy8gVE9ETzogdGhpcyB3YXNuJ3QgZGVmaW5lZCBhcyBhIGRlZmF1bHQgaW4gZW5nYWdlX2Z1bGwsIGJ1dCB3YXMgaW4gY29kZS4gd2h5P1xuICAgIHN1bW1hcnlfd2lkZ2V0X21ldGhvZDogJ2FmdGVyJyxcbiAgICBsYW5ndWFnZTogJ2VuJyxcbiAgICBhYl90ZXN0X2ltcGFjdDogdHJ1ZSxcbiAgICBhYl90ZXN0X3NhbXBsZV9wZXJjZW50YWdlOiAxMCxcbiAgICBpbWdfaW5kaWNhdG9yX3Nob3dfb25sb2FkOiB0cnVlLFxuICAgIGltZ19pbmRpY2F0b3Jfc2hvd19zaWRlOiAnbGVmdCcsXG4gICAgdGFnX2JveF9iZ19jb2xvcnM6ICcjMTg0MTRjOyMzNzYwNzY7MjE1LCAxNzksIDY5OyNlNjg4NWM7I2U0NjE1NicsXG4gICAgdGFnX2JveF90ZXh0X2NvbG9yczogJyNmZmY7I2ZmZjsjZmZmOyNmZmY7I2ZmZicsXG4gICAgdGFnX2JveF9mb250X2ZhbWlseTogJ0hlbHZldGljYU5ldWUsSGVsdmV0aWNhLEFyaWFsLHNhbnMtc2VyaWYnLFxuICAgIHRhZ3NfYmdfY3NzOiAnJyxcbiAgICBpZ25vcmVfc3ViZG9tYWluOiBmYWxzZSxcbiAgICAvL3RoZSBzY29wZSBpbiB3aGljaCB0byBmaW5kIHBhcmVudHMgb2YgPGJyPiB0YWdzLlxuICAgIC8vVGhvc2UgcGFyZW50cyB3aWxsIGJlIGNvbnZlcnRlZCB0byBhIDxydD4gYmxvY2ssIHNvIHRoZXJlIHdvbid0IGJlIG5lc3RlZCA8cD4gYmxvY2tzLlxuICAgIC8vdGhlbiBpdCB3aWxsIHNwbGl0IHRoZSBwYXJlbnQncyBodG1sIG9uIDxicj4gdGFncyBhbmQgd3JhcCB0aGUgc2VjdGlvbnMgaW4gPHA+IHRhZ3MuXG5cbiAgICAvL2V4YW1wbGU6XG4gICAgLy8gYnJfcmVwbGFjZV9zY29wZV9zZWxlY3RvcjogXCIuYW50X2JyX3JlcGxhY2VcIiAvL2UuZy4gXCIjbWFpbnNlY3Rpb25cIiBvciBcInBcIlxuXG4gICAgYnJfcmVwbGFjZV9zY29wZV9zZWxlY3RvcjogbnVsbCAvL2UuZy4gXCIjbWFpbnNlY3Rpb25cIiBvciBcInBcIlxufTtcblxuZnVuY3Rpb24gY3JlYXRlRnJvbUpTT04oanNvbikge1xuXG4gICAgZnVuY3Rpb24gZGF0YShrZXkpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIHZhbHVlID0gd2luZG93LmFudGVubmFfZXh0ZW5kW2tleV07XG4gICAgICAgICAgICBpZiAodmFsdWUgPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSBqc29uW2tleV07XG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09ICcnKSB7IC8vIFRPRE86IFNob3VsZCB0aGUgc2VydmVyIGJlIHNlbmRpbmcgYmFjayAnJyBoZXJlIG9yIG5vdGhpbmcgYXQgYWxsPyAoSXQgcHJlY2x1ZGVzIHRoZSBzZXJ2ZXIgZnJvbSByZWFsbHkgc2F5aW5nICdub3RoaW5nJylcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBkZWZhdWx0c1trZXldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBiYWNrZ3JvdW5kQ29sb3IoYWNjZXNzb3IpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIGNvbG9ycyA9IFtdO1xuICAgICAgICAgICAgdmFyIHZhbHVlID0gYWNjZXNzb3IoKTtcbiAgICAgICAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgIGNvbG9ycyA9IHZhbHVlLnNwbGl0KCc7Jyk7XG4gICAgICAgICAgICAgICAgY29sb3JzID0gbWlncmF0ZVZhbHVlcyhjb2xvcnMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGNvbG9ycztcblxuICAgICAgICAgICAgLy8gTWlncmF0ZSBhbnkgY29sb3JzIGZyb20gdGhlICcxLCAyLCAzJyBmb3JtYXQgdG8gJ3JnYigxLCAyLCAzKScuIFRoaXMgY29kZSBjYW4gYmUgZGVsZXRlZCBvbmNlIHdlJ3ZlIHVwZGF0ZWRcbiAgICAgICAgICAgIC8vIGFsbCBzaXRlcyB0byBzcGVjaWZ5aW5nIHZhbGlkIENTUyBjb2xvciB2YWx1ZXNcbiAgICAgICAgICAgIGZ1bmN0aW9uIG1pZ3JhdGVWYWx1ZXMoY29sb3JWYWx1ZXMpIHtcbiAgICAgICAgICAgICAgICB2YXIgbWlncmF0aW9uTWF0Y2hlciA9IC9eXFxzKlxcZCtcXHMqLFxccypcXGQrXFxzKixcXHMqXFxkK1xccyokL2dpbTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvbG9yVmFsdWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9IGNvbG9yVmFsdWVzW2ldO1xuICAgICAgICAgICAgICAgICAgICBpZiAobWlncmF0aW9uTWF0Y2hlci50ZXN0KHZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3JWYWx1ZXNbaV0gPSAncmdiKCcgKyB2YWx1ZSArICcpJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gY29sb3JWYWx1ZXM7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkZWZhdWx0UmVhY3Rpb25zKCRlbGVtZW50KSB7XG4gICAgICAgIC8vIERlZmF1bHQgcmVhY3Rpb25zIGFyZSBhdmFpbGFibGUgaW4gdGhyZWUgbG9jYXRpb25zIGluIHRocmVlIGRhdGEgZm9ybWF0czpcbiAgICAgICAgLy8gMS4gQXMgYSBjb21tYS1zZXBhcmF0ZWQgYXR0cmlidXRlIHZhbHVlIG9uIGEgcGFydGljdWxhciBlbGVtZW50XG4gICAgICAgIC8vIDIuIEFzIGFuIGFycmF5IG9mIHN0cmluZ3Mgb24gdGhlIHdpbmRvdy5hbnRlbm5hX2V4dGVuZCBwcm9wZXJ0eVxuICAgICAgICAvLyAzLiBBcyBhIGpzb24gb2JqZWN0IHdpdGggYSBib2R5IGFuZCBpZCBvbiB0aGUgZ3JvdXAgc2V0dGluZ3NcbiAgICAgICAgdmFyIHJlYWN0aW9ucyA9IFtdO1xuICAgICAgICB2YXIgcmVhY3Rpb25TdHJpbmdzO1xuICAgICAgICB2YXIgZWxlbWVudFJlYWN0aW9ucyA9ICRlbGVtZW50ID8gJGVsZW1lbnQuYXR0cignYW50LXJlYWN0aW9ucycpIDogdW5kZWZpbmVkO1xuICAgICAgICBpZiAoZWxlbWVudFJlYWN0aW9ucykge1xuICAgICAgICAgICAgcmVhY3Rpb25TdHJpbmdzID0gZWxlbWVudFJlYWN0aW9ucy5zcGxpdCgnOycpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVhY3Rpb25TdHJpbmdzID0gd2luZG93LmFudGVubmFfZXh0ZW5kWydkZWZhdWx0X3JlYWN0aW9ucyddO1xuICAgICAgICB9XG4gICAgICAgIGlmIChyZWFjdGlvblN0cmluZ3MpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmVhY3Rpb25TdHJpbmdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgcmVhY3Rpb25zLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICB0ZXh0OiByZWFjdGlvblN0cmluZ3NbaV1cbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyIHZhbHVlcyA9IGpzb25bJ2RlZmF1bHRfcmVhY3Rpb25zJ107XG4gICAgICAgICAgICBpZiAodmFsdWVzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHZhbHVlcy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgdmFsdWUgPSB2YWx1ZXNbal07XG4gICAgICAgICAgICAgICAgICAgIHJlYWN0aW9ucy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6IHZhbHVlLmJvZHksXG4gICAgICAgICAgICAgICAgICAgICAgICBpZDogdmFsdWUuaWRcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZWFjdGlvbnM7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgZ3JvdXBJZDogZGF0YSgnaWQnKSxcbiAgICAgICAgYWN0aXZlU2VjdGlvbnM6IGRhdGEoJ2FjdGl2ZV9zZWN0aW9ucycpLFxuICAgICAgICB1cmw6IHtcbiAgICAgICAgICAgIGlnbm9yZVN1YmRvbWFpbjogZGF0YSgnaWdub3JlX3N1YmRvbWFpbicpLFxuICAgICAgICAgICAgY2Fub25pY2FsRG9tYWluOiBkYXRhKCdwYWdlX3RsZCcpIC8vIFRPRE86IHdoYXQgdG8gY2FsbCB0aGlzIGV4YWN0bHkuIGdyb3VwRG9tYWluPyBzaXRlRG9tYWluPyBjYW5vbmljYWxEb21haW4/XG4gICAgICAgIH0sXG4gICAgICAgIHN1bW1hcnlTZWxlY3RvcjogZGF0YSgnc3VtbWFyeV93aWRnZXRfc2VsZWN0b3InKSxcbiAgICAgICAgc3VtbWFyeU1ldGhvZDogZGF0YSgnc3VtbWFyeV93aWRnZXRfbWV0aG9kJyksXG4gICAgICAgIHBhZ2VTZWxlY3RvcjogZGF0YSgncG9zdF9zZWxlY3RvcicpLFxuICAgICAgICBwYWdlSHJlZlNlbGVjdG9yOiBkYXRhKCdwb3N0X2hyZWZfc2VsZWN0b3InKSxcbiAgICAgICAgdGV4dFNlbGVjdG9yOiBkYXRhKCdhbm5vX3doaXRlbGlzdCcpLFxuICAgICAgICBkZWZhdWx0UmVhY3Rpb25zOiBkZWZhdWx0UmVhY3Rpb25zLFxuICAgICAgICByZWFjdGlvbkJhY2tncm91bmRDb2xvcnM6IGJhY2tncm91bmRDb2xvcihkYXRhKCd0YWdfYm94X2JnX2NvbG9ycycpKVxuICAgIH1cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZTogY3JlYXRlRnJvbUpTT05cbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgUG9wdXBXaWRnZXQgPSByZXF1aXJlKCcuL3BvcHVwLXdpZGdldCcpO1xudmFyIFJlYWN0aW9uc1dpZGdldCA9IHJlcXVpcmUoJy4vcmVhY3Rpb25zLXdpZGdldCcpO1xudmFyIFJhbmdlID0gcmVxdWlyZSgnLi91dGlscy9yYW5nZScpO1xuXG5cbmZ1bmN0aW9uIGNyZWF0ZUluZGljYXRvcldpZGdldChvcHRpb25zKSB7XG4gICAgLy8gVE9ETzogQWRqdXN0IHZpc2liaWxpdHkgYmFzZWQgb24gd2hldGhlciB0aGVyZSBhcmUgcmVhY3Rpb25zIG9uIHRoZSBjb250ZW50IChob25vcmluZyB0aGUgZmxhZyBhYm91dCBob3cgbWFueSB0byBzaG93IGF0IG9uY2UpLlxuICAgIC8vIFRPRE86IFNob3cgaW50ZXJtZWRpYXRlIHBvcHVwIHRoaW5neSB3aGVuIHRoZXJlIGFyZSBubyByZWFjdGlvbnNcbiAgICB2YXIgZWxlbWVudCA9IG9wdGlvbnMuZWxlbWVudDtcbiAgICB2YXIgY29udGFpbmVyRGF0YSA9IG9wdGlvbnMuY29udGFpbmVyRGF0YTtcbiAgICB2YXIgJGNvbnRhaW5lckVsZW1lbnQgPSBvcHRpb25zLmNvbnRhaW5lckVsZW1lbnQ7XG4gICAgdmFyIHBhZ2VEYXRhID0gb3B0aW9ucy5wYWdlRGF0YTtcbiAgICB2YXIgZ3JvdXBTZXR0aW5ncyA9IG9wdGlvbnMuZ3JvdXBTZXR0aW5ncztcbiAgICB2YXIgZGVmYXVsdFJlYWN0aW9ucyA9IG9wdGlvbnMuZGVmYXVsdFJlYWN0aW9ucztcbiAgICB2YXIgcmFjdGl2ZSA9IFJhY3RpdmUoe1xuICAgICAgICBlbDogZWxlbWVudCxcbiAgICAgICAgbWFnaWM6IHRydWUsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIGNvbnRhaW5lckRhdGE6IGNvbnRhaW5lckRhdGFcbiAgICAgICAgfSxcbiAgICAgICAgdGVtcGxhdGU6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9pbmRpY2F0b3Itd2lkZ2V0Lmhicy5odG1sJylcbiAgICB9KTtcblxuICAgIHZhciByZWFjdGlvbldpZGdldE9wdGlvbnMgPSB7XG4gICAgICAgIHJlYWN0aW9uc0RhdGE6IGNvbnRhaW5lckRhdGEucmVhY3Rpb25zLFxuICAgICAgICBjb250YWluZXJEYXRhOiBjb250YWluZXJEYXRhLFxuICAgICAgICBjb250YWluZXJFbGVtZW50OiAkY29udGFpbmVyRWxlbWVudCxcbiAgICAgICAgZGVmYXVsdFJlYWN0aW9uczogZGVmYXVsdFJlYWN0aW9ucyxcbiAgICAgICAgcGFnZURhdGE6IHBhZ2VEYXRhLFxuICAgICAgICBncm91cFNldHRpbmdzOiBncm91cFNldHRpbmdzXG4gICAgfTtcblxuICAgIHZhciBob3ZlclRpbWVvdXQ7XG4gICAgcmFjdGl2ZS5vbignY29tcGxldGUnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRyb290RWxlbWVudCA9ICQocm9vdEVsZW1lbnQocmFjdGl2ZSkpO1xuICAgICAgICAkcm9vdEVsZW1lbnQub24oJ21vdXNlZW50ZXIuYW50ZW5uYScsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICBpZiAoZXZlbnQuYnV0dG9ucyAhPT0gMCkge1xuICAgICAgICAgICAgICAgIC8vIERvbid0IHJlYWN0IGlmIHRoZSB1c2VyIGlzIGRyYWdnaW5nIG9yIHNlbGVjdGluZyB0ZXh0LlxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChjb250YWluZXJEYXRhLnJlYWN0aW9ucy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgb3BlblJlYWN0aW9uc1dpbmRvdyhyZWFjdGlvbldpZGdldE9wdGlvbnMsIHJhY3RpdmUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQoaG92ZXJUaW1lb3V0KTsgLy8gb25seSBvbmUgdGltZW91dCBhdCBhIHRpbWVcbiAgICAgICAgICAgICAgICBob3ZlclRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgJGljb24gPSAkKHJvb3RFbGVtZW50KHJhY3RpdmUpKS5maW5kKCcuYW50LWFudGVubmEtbG9nbycpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgb2Zmc2V0ID0gJGljb24ub2Zmc2V0KCk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjb29yZGluYXRlcyA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvcDogb2Zmc2V0LnRvcCArIE1hdGguZmxvb3IoJGljb24uaGVpZ2h0KCkgLyAyKSwgLy8gVE9ETyB0aGlzIG51bWJlciBpcyBhIGxpdHRsZSBvZmYgYmVjYXVzZSB0aGUgZGl2IGRvZXNuJ3QgdGlnaHRseSB3cmFwIHRoZSBpbnNlcnRlZCBmb250IGNoYXJhY3RlclxuICAgICAgICAgICAgICAgICAgICAgICAgbGVmdDogb2Zmc2V0LmxlZnQgKyBNYXRoLmZsb29yKCRpY29uLndpZHRoKCkgLyAyKVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBQb3B1cFdpZGdldC5zaG93KGNvb3JkaW5hdGVzLCBncmFiTm9kZUFuZE9wZW5PblNlbGVjdGlvbigkY29udGFpbmVyRWxlbWVudC5nZXQoMCksIHJlYWN0aW9uV2lkZ2V0T3B0aW9ucywgcmFjdGl2ZSkpO1xuICAgICAgICAgICAgICAgIH0sIDIwMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICAkcm9vdEVsZW1lbnQub24oJ21vdXNlbGVhdmUuYW50ZW5uYScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KGhvdmVyVGltZW91dCk7XG4gICAgICAgIH0pO1xuICAgICAgICAkY29udGFpbmVyRWxlbWVudC5vbignbW91c2VlbnRlci5hbnRlbm5hJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAkcm9vdEVsZW1lbnQuYWRkQ2xhc3MoJ2FjdGl2ZScpO1xuICAgICAgICB9KTtcbiAgICAgICAgJGNvbnRhaW5lckVsZW1lbnQub24oJ21vdXNlbGVhdmUuYW50ZW5uYScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgJHJvb3RFbGVtZW50LnJlbW92ZUNsYXNzKCdhY3RpdmUnKTtcbiAgICAgICAgfSlcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gZ3JhYk5vZGVBbmRPcGVuT25TZWxlY3Rpb24obm9kZSwgcmVhY3Rpb25XaWRnZXRPcHRpb25zLCByYWN0aXZlKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICBSYW5nZS5ncmFiTm9kZShub2RlLCBmdW5jdGlvbih0ZXh0LCBsb2NhdGlvbikge1xuICAgICAgICAgICAgcmVhY3Rpb25XaWRnZXRPcHRpb25zLmxvY2F0aW9uID0gbG9jYXRpb247XG4gICAgICAgICAgICByZWFjdGlvbldpZGdldE9wdGlvbnMuYm9keSA9IHRleHQ7XG4gICAgICAgICAgICBvcGVuUmVhY3Rpb25zV2luZG93KHJlYWN0aW9uV2lkZ2V0T3B0aW9ucywgcmFjdGl2ZSk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gcm9vdEVsZW1lbnQocmFjdGl2ZSkge1xuICAgIHJldHVybiByYWN0aXZlLmZpbmQoJy5hbnRlbm5hLWluZGljYXRvci13aWRnZXQnKTtcbn1cblxuLy8gVE9ETyByZWZhY3RvciB0aGlzIGR1cGxpY2F0ZWQgY29kZSBmcm9tIHN1bW1hcnktd2lkZ2V0LmpzXG5mdW5jdGlvbiBvcGVuUmVhY3Rpb25zV2luZG93KHJlYWN0aW9uT3B0aW9ucywgcmFjdGl2ZSkge1xuICAgIGlmICghcmFjdGl2ZS5yZWFjdGlvbnNXaWRnZXQpIHtcbiAgICAgICAgcmFjdGl2ZS5yZWFjdGlvbnNXaWRnZXQgPSBSZWFjdGlvbnNXaWRnZXQuY3JlYXRlKHJlYWN0aW9uT3B0aW9ucyk7XG4gICAgfVxuICAgIHJhY3RpdmUucmVhY3Rpb25zV2lkZ2V0Lm9wZW4ocm9vdEVsZW1lbnQocmFjdGl2ZSkpO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlOiBjcmVhdGVJbmRpY2F0b3JXaWRnZXRcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgUGFnZVV0aWxzID0gcmVxdWlyZSgnLi91dGlscy9wYWdlLXV0aWxzJyk7XG52YXIgUGFnZURhdGEgPSByZXF1aXJlKCcuL3BhZ2UtZGF0YScpO1xuXG5cbmZ1bmN0aW9uIGNvbXB1dGVQYWdlVGl0bGUoKSB7XG4gICAgLy8gVE9ETzogSG93IGFyZSBwYWdlIHRpdGxlcyBjb21wdXRlZCB3aXRoIG11bHRpcGxlIHBhZ2VzPyBUaGUgY29kZSBiZWxvdyBjb21wdXRlcyB0aGUgdGl0bGUgZm9yIGEgdG9wLWxldmVsIHBhZ2UuXG4gICAgdmFyIHRpdGxlID0gJCgnbWV0YVtwcm9wZXJ0eT1cIm9nOnRpdGxlXCJdJykuYXR0cignY29udGVudCcpO1xuICAgIGlmICghdGl0bGUpIHtcbiAgICAgICAgdGl0bGUgPSAkKCd0aXRsZScpLnRleHQoKSB8fCAnJztcbiAgICB9XG4gICAgcmV0dXJuICQudHJpbSh0aXRsZSk7XG59XG5cblxuLy8gQ29tcHV0ZSB0aGUgcGFnZXMgdGhhdCB3ZSBuZWVkIHRvIGZldGNoLiBUaGlzIGlzIGVpdGhlcjpcbi8vIDEuIEFueSBuZXN0ZWQgcGFnZXMgd2UgZmluZCB1c2luZyB0aGUgcGFnZSBzZWxlY3RvciBPUlxuLy8gMi4gVGhlIGN1cnJlbnQgd2luZG93IGxvY2F0aW9uXG5mdW5jdGlvbiBjb21wdXRlUGFnZXNQYXJhbShncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIHBhZ2VzID0gW107XG5cbiAgICB2YXIgZ3JvdXBJZCA9IGdyb3VwU2V0dGluZ3MuZ3JvdXBJZCgpO1xuICAgIHZhciAkcGFnZUVsZW1lbnRzID0gJChncm91cFNldHRpbmdzLnBhZ2VTZWxlY3RvcigpKTtcbiAgICAvLyBUT0RPOiBDb21wYXJlIHRoaXMgZXhlY3V0aW9uIGZsb3cgdG8gd2hhdCBoYXBwZW5zIGluIGVuZ2FnZV9mdWxsLmpzLiBIZXJlIHdlIHRyZWF0IHRoZSBib2R5IGVsZW1lbnQgYXMgYSBwYWdlIHNvXG4gICAgLy8gdGhlIGZsb3cgaXMgdGhlIHNhbWUgZm9yIGJvdGggY2FzZXMuIElzIHRoZXJlIGEgcmVhc29uIGVuZ2FnZV9mdWxsLmpzIGJyYW5jaGVzIGhlcmUgaW5zdGVhZCBhbmQgdHJlYXRzIHRoZXNlIHNvIGRpZmZlcmVudGx5P1xuICAgIGlmICgkcGFnZUVsZW1lbnRzLmxlbmd0aCA9PSAwKSB7XG4gICAgICAgICRwYWdlRWxlbWVudHMgPSAkKCdib2R5Jyk7XG4gICAgfVxuICAgICRwYWdlRWxlbWVudHMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRwYWdlRWxlbWVudCA9ICQodGhpcyk7XG4gICAgICAgIHBhZ2VzLnB1c2goe1xuICAgICAgICAgICAgZ3JvdXBfaWQ6IGdyb3VwSWQsXG4gICAgICAgICAgICB1cmw6IFBhZ2VVdGlscy5jb21wdXRlQ2Fub25pY2FsVXJsKCRwYWdlRWxlbWVudCwgZ3JvdXBTZXR0aW5ncylcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gcGFnZXM7XG59XG5cbmZ1bmN0aW9uIGxvYWRQYWdlRGF0YShncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIHBhZ2VzUGFyYW0gPSBjb21wdXRlUGFnZXNQYXJhbShncm91cFNldHRpbmdzKTtcbiAgICAkLmdldEpTT05QKCcvYXBpL3BhZ2VuZXcnLCB7IHBhZ2VzOiBwYWdlc1BhcmFtIH0sIHN1Y2Nlc3MsIGVycm9yKTtcblxuICAgIGZ1bmN0aW9uIHN1Y2Nlc3MoanNvbikge1xuICAgICAgICAvLyBUT0RPOiBpZiB0aGUgcGFnZSBkYXRhIGluZGljYXRlcyB0aGF0IHRoZSBzZXJ2ZXIgZG9lc24ndCBrbm93IGFib3V0IHRoZSBwYWdlIHlldCwgY29tcHV0ZSB0aGUgcGFnZSB0aXRsZSBhbmQgaW1hZ2VcbiAgICAgICAgLy8gICAgICAgYW5kIHNlbmQgdGhlbSB0byB0aGUgc2VydmVyLiAodXNlIGNvbXB1dGVQYWdlVGl0bGUoKSlcbiAgICAgICAgUGFnZURhdGEudXBkYXRlQWxsUGFnZURhdGEoanNvbiwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZXJyb3IobWVzc2FnZSkge1xuICAgICAgICAvLyBUT0RPIGhhbmRsZSBlcnJvcnMgdGhhdCBoYXBwZW4gd2hlbiBsb2FkaW5nIHBhZ2UgZGF0YVxuICAgIH1cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGxvYWQ6IGxvYWRQYWdlRGF0YVxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi91dGlscy9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcblxudmFyIHBhZ2VzID0ge307XG5cbmZ1bmN0aW9uIGdldFBhZ2VEYXRhKGhhc2gpIHtcbiAgICB2YXIgcGFnZURhdGEgPSBwYWdlc1toYXNoXTtcbiAgICBpZiAoIXBhZ2VEYXRhKSB7XG4gICAgICAgIC8vIFRPRE86IEdpdmUgdGhpcyBzZXJpb3VzIHRob3VnaHQuIEluIG9yZGVyIGZvciBtYWdpYyBtb2RlIHRvIHdvcmssIHRoZSBvYmplY3QgbmVlZHMgdG8gaGF2ZSB2YWx1ZXMgaW4gcGxhY2UgZm9yXG4gICAgICAgIC8vIHRoZSBvYnNlcnZlZCBwcm9wZXJ0aWVzIGF0IHRoZSBtb21lbnQgdGhlIHJhY3RpdmUgaXMgY3JlYXRlZC4gQnV0IHRoaXMgaXMgcHJldHR5IHVudXN1YWwgZm9yIEphdmFzY3JpcHQsIHRvIGhhdmVcbiAgICAgICAgLy8gdG8gZGVmaW5lIHRoZSB3aG9sZSBza2VsZXRvbiBmb3IgdGhlIG9iamVjdCBpbnN0ZWFkIG9mIGp1c3QgYWRkaW5nIHByb3BlcnRpZXMgd2hlbmV2ZXIgeW91IHdhbnQuXG4gICAgICAgIC8vIFRoZSBhbHRlcm5hdGl2ZSB3b3VsZCBiZSBmb3IgdXMgdG8ga2VlcCBvdXIgb3duIFwiZGF0YSBiaW5kaW5nXCIgYmV0d2VlbiB0aGUgcGFnZURhdGEgYW5kIHJhY3RpdmUgaW5zdGFuY2VzICgxIHRvIG1hbnkpXG4gICAgICAgIC8vIGFuZCB0ZWxsIHRoZSByYWN0aXZlcyB0byB1cGRhdGUgd2hlbmV2ZXIgdGhlIGRhdGEgY2hhbmdlcy5cbiAgICAgICAgcGFnZURhdGEgPSB7XG4gICAgICAgICAgICBwYWdlSGFzaDogaGFzaCxcbiAgICAgICAgICAgIHN1bW1hcnlSZWFjdGlvbnM6IHt9LFxuICAgICAgICAgICAgc3VtbWFyeVRvdGFsOiAwLCAvLyBUT0RPIGNvbnNpZGVyIGZvbGRpbmcgdGhpcyBpbnRvIHN1bW1hcnlSZWFjdGlvbnNcbiAgICAgICAgICAgIGNvbnRhaW5lcnM6IHt9XG4gICAgICAgIH07XG4gICAgICAgIHBhZ2VzW2hhc2hdID0gcGFnZURhdGE7XG4gICAgfVxuICAgIHJldHVybiBwYWdlRGF0YTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlQWxsUGFnZURhdGEoanNvblBhZ2VzLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGFsbFBhZ2VzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBqc29uUGFnZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgYWxsUGFnZXMucHVzaCh1cGRhdGVQYWdlRGF0YShqc29uUGFnZXNbaV0sIGdyb3VwU2V0dGluZ3MpKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZVBhZ2VEYXRhKGpzb24sIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgcGFnZUhhc2ggPSBqc29uLnBhZ2VIYXNoO1xuICAgIHZhciBwYWdlRGF0YSA9IGdldFBhZ2VEYXRhKHBhZ2VIYXNoKTtcblxuICAgIC8vIFRPRE86IENhbiB3ZSBnZXQgYXdheSB3aXRoIGp1c3Qgc2V0dGluZyBwYWdlRGF0YSA9IGpzb24gd2l0aG91dCBicmVha2luZyBSYWN0aXZlJ3MgZGF0YSBiaW5kaW5nP1xuICAgIHZhciBzdW1tYXJ5UmVhY3Rpb25zID0ganNvbi5zdW1tYXJ5UmVhY3Rpb25zO1xuICAgIHBhZ2VEYXRhLnN1bW1hcnlSZWFjdGlvbnMgPSBzdW1tYXJ5UmVhY3Rpb25zO1xuICAgIHNldENvbnRhaW5lcnMocGFnZURhdGEsIGpzb24uY29udGFpbmVycyk7XG5cbiAgICAvLyBXZSBhZGQgdXAgdGhlIHN1bW1hcnkgcmVhY3Rpb24gdG90YWwgY2xpZW50LXNpZGVcbiAgICB2YXIgdG90YWwgPSAwO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3VtbWFyeVJlYWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICB0b3RhbCA9IHRvdGFsICsgc3VtbWFyeVJlYWN0aW9uc1tpXS5jb3VudDtcbiAgICB9XG4gICAgcGFnZURhdGEuc3VtbWFyeVRvdGFsID0gdG90YWw7XG5cbiAgICAvLyBXZSBhZGQgdXAgdGhlIGNvbnRhaW5lciByZWFjdGlvbiB0b3RhbHMgY2xpZW50LXNpZGVcbiAgICB2YXIgdG90YWwgPSAwO1xuICAgIHZhciBjb250YWluZXJzID0gcGFnZURhdGEuY29udGFpbmVycztcbiAgICBmb3IgKHZhciBoYXNoIGluIGNvbnRhaW5lcnMpIHtcbiAgICAgICAgaWYgKGNvbnRhaW5lcnMuaGFzT3duUHJvcGVydHkoaGFzaCkpIHtcbiAgICAgICAgICAgIHZhciBjb250YWluZXIgPSBjb250YWluZXJzW2hhc2hdO1xuICAgICAgICAgICAgdmFyIHRvdGFsID0gMDtcbiAgICAgICAgICAgIHZhciBjb250YWluZXJSZWFjdGlvbnMgPSBjb250YWluZXIucmVhY3Rpb25zO1xuICAgICAgICAgICAgaWYgKGNvbnRhaW5lclJlYWN0aW9ucykge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY29udGFpbmVyUmVhY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHRvdGFsID0gdG90YWwgKyBjb250YWluZXJSZWFjdGlvbnNbaV0uY291bnQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29udGFpbmVyLnJlYWN0aW9uVG90YWwgPSB0b3RhbDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIFRPRE8gQ29uc2lkZXIgc3VwcG9ydGluZyBpbmNyZW1lbnRhbCB1cGRhdGUgb2YgZGF0YSB0aGF0IHdlIGFscmVhZHkgaGF2ZSBmcm9tIHRoZSBzZXJ2ZXIuIFRoYXQgd291bGQgbWVhbiBvbmx5XG4gICAgLy8gdXBkYXRpbmcgZmllbGRzIGluIHRoZSBsb2NhbCBvYmplY3QgaWYgdGhleSBleGlzdCBpbiB0aGUganNvbiBkYXRhLlxuICAgIHBhZ2VEYXRhLmdyb3VwSWQgPSBncm91cFNldHRpbmdzLmdyb3VwSWQoKTtcbiAgICBwYWdlRGF0YS5wYWdlSWQgPSBqc29uLmlkO1xuICAgIHBhZ2VEYXRhLnBhZ2VIYXNoID0gcGFnZUhhc2g7XG5cbiAgICByZXR1cm4gcGFnZURhdGE7XG59XG5cbmZ1bmN0aW9uIGdldENvbnRhaW5lckRhdGEocGFnZURhdGEsIGNvbnRhaW5lckhhc2gpIHtcbiAgICB2YXIgY29udGFpbmVyRGF0YSA9IHBhZ2VEYXRhLmNvbnRhaW5lcnNbY29udGFpbmVySGFzaF07XG4gICAgaWYgKCFjb250YWluZXJEYXRhKSB7XG4gICAgICAgIGNvbnRhaW5lckRhdGEgPSB7XG4gICAgICAgICAgICBoYXNoOiBjb250YWluZXJIYXNoLFxuICAgICAgICAgICAgcmVhY3Rpb25Ub3RhbDogMCxcbiAgICAgICAgICAgIHJlYWN0aW9uczogW11cbiAgICAgICAgfTtcbiAgICAgICAgcGFnZURhdGEuY29udGFpbmVyc1tjb250YWluZXJIYXNoXSA9IGNvbnRhaW5lckRhdGE7XG4gICAgfVxuICAgIHJldHVybiBjb250YWluZXJEYXRhO1xufVxuXG4vLyBNZXJnZSB0aGUgZ2l2ZW4gY29udGFpbmVyIGRhdGEgaW50byB0aGUgcGFnZURhdGEuY29udGFpbmVycyBkYXRhLiBUaGlzIGlzIG5lY2Vzc2FyeSBiZWNhdXNlIHRoZSBza2VsZXRvbiBvZiB0aGUgcGFnZURhdGEuY29udGFpbmVycyBtYXBcbi8vIGlzIHNldCB1cCBhbmQgYm91bmQgdG8gdGhlIFVJIGJlZm9yZSBhbGwgdGhlIGRhdGEgaXMgZmV0Y2hlZCBmcm9tIHRoZSBzZXJ2ZXIgYW5kIHdlIGRvbid0IHdhbnQgdG8gYnJlYWsgdGhlIGRhdGEgYmluZGluZy5cbmZ1bmN0aW9uIHNldENvbnRhaW5lcnMocGFnZURhdGEsIGNvbnRhaW5lcnMpIHtcbiAgICBmb3IgKHZhciBoYXNoIGluIGNvbnRhaW5lcnMpIHtcbiAgICAgICAgaWYgKGNvbnRhaW5lcnMuaGFzT3duUHJvcGVydHkoaGFzaCkpIHtcbiAgICAgICAgICAgIHZhciBjb250YWluZXJEYXRhID0gZ2V0Q29udGFpbmVyRGF0YShwYWdlRGF0YSwgaGFzaCk7XG4gICAgICAgICAgICB2YXIgZmV0Y2hlZENvbnRhaW5lckRhdGEgPSBjb250YWluZXJzW2hhc2hdO1xuICAgICAgICAgICAgY29udGFpbmVyRGF0YS5pZCA9IGZldGNoZWRDb250YWluZXJEYXRhLmlkO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBmZXRjaGVkQ29udGFpbmVyRGF0YS5yZWFjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjb250YWluZXJEYXRhLnJlYWN0aW9ucy5wdXNoKGZldGNoZWRDb250YWluZXJEYXRhLnJlYWN0aW9uc1tpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBnZXRQYWdlRGF0YTogZ2V0UGFnZURhdGEsXG4gICAgdXBkYXRlQWxsUGFnZURhdGE6IHVwZGF0ZUFsbFBhZ2VEYXRhLFxuICAgIGdldENvbnRhaW5lckRhdGE6IGdldENvbnRhaW5lckRhdGFcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgSGFzaCA9IHJlcXVpcmUoJy4vdXRpbHMvaGFzaCcpO1xudmFyIFBhZ2VVdGlscyA9IHJlcXVpcmUoJy4vdXRpbHMvcGFnZS11dGlscycpO1xuXG52YXIgSW5kaWNhdG9yV2lkZ2V0ID0gcmVxdWlyZSgnLi9pbmRpY2F0b3Itd2lkZ2V0Jyk7XG52YXIgUGFnZURhdGEgPSByZXF1aXJlKCcuL3BhZ2UtZGF0YScpO1xudmFyIFN1bW1hcnlXaWRnZXQgPSByZXF1aXJlKCcuL3N1bW1hcnktd2lkZ2V0Jyk7XG52YXIgVGV4dFJlYWN0aW9ucyA9IHJlcXVpcmUoJy4vdGV4dC1yZWFjdGlvbnMnKTtcblxuXG4vLyBTY2FuIGZvciBhbGwgcGFnZXMgYXQgdGhlIGN1cnJlbnQgYnJvd3NlciBsb2NhdGlvbi4gVGhpcyBjb3VsZCBqdXN0IGJlIHRoZSBjdXJyZW50IHBhZ2Ugb3IgaXQgY291bGQgYmUgYSBjb2xsZWN0aW9uXG4vLyBvZiBwYWdlcyAoYWthICdwb3N0cycpLlxuZnVuY3Rpb24gc2NhbkFsbFBhZ2VzKGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgJHBhZ2VzID0gJChncm91cFNldHRpbmdzLnBhZ2VTZWxlY3RvcigpKTtcbiAgICBpZiAoJHBhZ2VzLmxlbmd0aCA9PSAwKSB7XG4gICAgICAgIC8vIElmIHdlIGRvbid0IGRldGVjdCBhbnkgcGFnZSBtYXJrZXJzLCB0cmVhdCB0aGUgd2hvbGUgZG9jdW1lbnQgYXMgdGhlIHNpbmdsZSBwYWdlXG4gICAgICAgICRwYWdlcyA9ICQoJ2JvZHknKTsgLy8gVE9ETyBJcyB0aGlzIHRoZSByaWdodCBiZWhhdmlvcj9cbiAgICB9XG4gICAgJHBhZ2VzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkcGFnZSA9ICQodGhpcyk7XG4gICAgICAgIHNjYW5QYWdlKCRwYWdlLCBncm91cFNldHRpbmdzKTtcbiAgICB9KTtcbn1cblxuLy8gU2NhbiB0aGUgcGFnZSB1c2luZyB0aGUgZ2l2ZW4gc2V0dGluZ3M6XG4vLyAxLiBGaW5kIGFsbCB0aGUgY29udGFpbmVycyB0aGF0IHdlIGNhcmUgYWJvdXQuXG4vLyAyLiBDb21wdXRlIGhhc2hlcyBmb3IgZWFjaCBjb250YWluZXIuXG4vLyAzLiBJbnNlcnQgd2lkZ2V0IGFmZm9yZGFuY2VzIGZvciBlYWNoIHdoaWNoIGFyZSBib3VuZCB0byB0aGUgZGF0YSBtb2RlbCBieSB0aGUgaGFzaGVzLlxuZnVuY3Rpb24gc2NhblBhZ2UoJHBhZ2UsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgdXJsID0gUGFnZVV0aWxzLmNvbXB1dGVQYWdlVXJsKCRwYWdlLCBncm91cFNldHRpbmdzKTtcbiAgICB2YXIgdXJsSGFzaCA9IEhhc2guaGFzaFVybCh1cmwpO1xuICAgIHZhciBwYWdlRGF0YSA9IFBhZ2VEYXRhLmdldFBhZ2VEYXRhKHVybEhhc2gpO1xuXG4gICAgLy8gRmlyc3QsIHNjYW4gZm9yIGVsZW1lbnRzIHRoYXQgd291bGQgY2F1c2UgdXMgdG8gaW5zZXJ0IHNvbWV0aGluZyBpbnRvIHRoZSBET00gdGhhdCB0YWtlcyB1cCBzcGFjZS5cbiAgICAvLyBXZSB3YW50IHRvIGdldCBhbnkgcGFnZSByZXNpemluZyBvdXQgb2YgdGhlIHdheSBhcyBlYXJseSBhcyBwb3NzaWJsZS5cbiAgICAvLyBUT0RPOiBDb25zaWRlciBkb2luZyB0aGlzIHdpdGggcmF3IEphdmFzY3JpcHQgYmVmb3JlIGpRdWVyeSBsb2FkcywgdG8gZnVydGhlciByZWR1Y2UgdGhlIGRlbGF5LiBXZSB3b3VsZG4ndFxuICAgIC8vIHNhdmUgYSAqdG9uKiBvZiB0aW1lIGZyb20gdGhpcywgdGhvdWdoLCBzbyBpdCdzIGRlZmluaXRlbHkgYSBsYXRlciBvcHRpbWl6YXRpb24uXG4gICAgc2NhbkZvclN1bW1hcmllcygkcGFnZSwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgIHNjYW5Gb3JDYWxsc1RvQWN0aW9uKCRwYWdlLCBncm91cFNldHRpbmdzKTtcblxuICAgIHZhciAkYWN0aXZlU2VjdGlvbnMgPSAkcGFnZS5maW5kKGdyb3VwU2V0dGluZ3MuYWN0aXZlU2VjdGlvbnMoKSk7XG4gICAgJGFjdGl2ZVNlY3Rpb25zLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkc2VjdGlvbiA9ICQodGhpcyk7XG4gICAgICAgIC8vIFRoZW4gc2NhbiBmb3IgZXZlcnl0aGluZyBlbHNlXG4gICAgICAgIHNjYW5Gb3JUZXh0KCRzZWN0aW9uLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIHNjYW5Gb3JJbWFnZXMoJHNlY3Rpb24sIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICBzY2FuRm9yTWVkaWEoJHNlY3Rpb24sIGdyb3VwU2V0dGluZ3MpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBzY2FuRm9yU3VtbWFyaWVzKCRlbGVtZW50LCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciAkc3VtbWFyaWVzID0gJGVsZW1lbnQuZmluZChncm91cFNldHRpbmdzLnN1bW1hcnlTZWxlY3RvcigpKTtcbiAgICAkc3VtbWFyaWVzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkc3VtbWFyeSA9ICQodGhpcyk7XG4gICAgICAgIHZhciBjb250YWluZXIgPSAkKCc8ZGl2IGNsYXNzPVwiYW50LXN1bW1hcnktY29udGFpbmVyXCI+PC9kaXY+Jyk7XG4gICAgICAgIHZhciBjb250YWluZXJEYXRhID0gUGFnZURhdGEuZ2V0Q29udGFpbmVyRGF0YShwYWdlRGF0YSwgJ3BhZ2UnKTsgLy8gTWFnaWMgaGFzaCBmb3IgcGFnZSByZWFjdGlvbnNcbiAgICAgICAgY29udGFpbmVyRGF0YS50eXBlID0gJ3BhZ2UnOyAvLyBUT0RPOiByZXZpc2l0IHdoZXRoZXIgaXQgbWFrZXMgc2Vuc2UgdG8gc2V0IHRoZSB0eXBlIGhlcmVcbiAgICAgICAgdmFyIGRlZmF1bHRSZWFjdGlvbnMgPSBncm91cFNldHRpbmdzLmRlZmF1bHRSZWFjdGlvbnMoJHN1bW1hcnkpOyAvLyBUT0RPOiBkbyB3ZSBzdXBwb3J0IGN1c3RvbWl6aW5nIHRoZSBkZWZhdWx0IHJlYWN0aW9ucyBhdCB0aGlzIGxldmVsP1xuICAgICAgICBTdW1tYXJ5V2lkZ2V0LmNyZWF0ZShjb250YWluZXIsIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBkZWZhdWx0UmVhY3Rpb25zLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgaW5zZXJ0Q29udGVudCgkc3VtbWFyeSwgY29udGFpbmVyLCBncm91cFNldHRpbmdzLnN1bW1hcnlNZXRob2QoKSk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIHNjYW5Gb3JDYWxsc1RvQWN0aW9uKCRzZWN0aW9uLCBncm91cFNldHRpbmdzKSB7XG4gICAgLy8gVE9ET1xufVxuXG5mdW5jdGlvbiBzY2FuRm9yVGV4dCgkc2VjdGlvbiwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgJHRleHRFbGVtZW50cyA9ICRzZWN0aW9uLmZpbmQoZ3JvdXBTZXR0aW5ncy50ZXh0U2VsZWN0b3IoKSk7XG4gICAgLy8gVE9ETzogb25seSBzZWxlY3QgXCJsZWFmXCIgZWxlbWVudHNcbiAgICAkdGV4dEVsZW1lbnRzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkdGV4dEVsZW1lbnQgPSAkKHRoaXMpO1xuICAgICAgICAvLyBUT0RPIHBvc2l0aW9uIGNvcnJlY3RseVxuICAgICAgICAvLyBUT0RPIGhhc2ggYW5kIGFkZCBoYXNoIGRhdGEgdG8gaW5kaWNhdG9yXG4gICAgICAgIHZhciBoYXNoID0gSGFzaC5oYXNoVGV4dCgkdGV4dEVsZW1lbnQpO1xuICAgICAgICB2YXIgJGluZGljYXRvckVsZW1lbnQgPSAkKCc8ZGl2IGNsYXNzPVwiYW50LWluZGljYXRvci1jb250YWluZXJcIiBzdHlsZT1cImRpc3BsYXk6aW5saW5lLWJsb2NrO1wiPjwvZGl2PicpOyAvLyBUT0RPXG4gICAgICAgIHZhciBjb250YWluZXJEYXRhID0gUGFnZURhdGEuZ2V0Q29udGFpbmVyRGF0YShwYWdlRGF0YSwgaGFzaCk7XG4gICAgICAgIGNvbnRhaW5lckRhdGEudHlwZSA9ICd0ZXh0JzsgLy8gVE9ETzogcmV2aXNpdCB3aGV0aGVyIGl0IG1ha2VzIHNlbnNlIHRvIHNldCB0aGUgdHlwZSBoZXJlXG4gICAgICAgIHZhciBkZWZhdWx0UmVhY3Rpb25zID0gZ3JvdXBTZXR0aW5ncy5kZWZhdWx0UmVhY3Rpb25zKCR0ZXh0RWxlbWVudCk7XG4gICAgICAgIHZhciBpbmRpY2F0b3IgPSBJbmRpY2F0b3JXaWRnZXQuY3JlYXRlKHtcbiAgICAgICAgICAgIGVsZW1lbnQ6ICRpbmRpY2F0b3JFbGVtZW50LFxuICAgICAgICAgICAgY29udGFpbmVyRGF0YTogY29udGFpbmVyRGF0YSxcbiAgICAgICAgICAgIGNvbnRhaW5lckVsZW1lbnQ6ICR0ZXh0RWxlbWVudCxcbiAgICAgICAgICAgIGRlZmF1bHRSZWFjdGlvbnM6IGRlZmF1bHRSZWFjdGlvbnMsXG4gICAgICAgICAgICBwYWdlRGF0YTogcGFnZURhdGEsXG4gICAgICAgICAgICBncm91cFNldHRpbmdzOiBncm91cFNldHRpbmdzfVxuICAgICAgICApO1xuICAgICAgICAkdGV4dEVsZW1lbnQuYXBwZW5kKCRpbmRpY2F0b3JFbGVtZW50KTsgLy8gVE9ETyBpcyB0aGlzIGNvbmZpZ3VyYWJsZSBhbGEgaW5zZXJ0Q29udGVudCguLi4pP1xuXG4gICAgICAgIFRleHRSZWFjdGlvbnMuY3JlYXRlUmVhY3RhYmxlVGV4dCh7XG4gICAgICAgICAgICBjb250YWluZXJEYXRhOiBjb250YWluZXJEYXRhLFxuICAgICAgICAgICAgY29udGFpbmVyRWxlbWVudDogJHRleHRFbGVtZW50LFxuICAgICAgICAgICAgZGVmYXVsdFJlYWN0aW9uczogZGVmYXVsdFJlYWN0aW9ucyxcbiAgICAgICAgICAgIHBhZ2VEYXRhOiBwYWdlRGF0YSxcbiAgICAgICAgICAgIGdyb3VwU2V0dGluZ3M6IGdyb3VwU2V0dGluZ3MsXG4gICAgICAgICAgICBleGNsdWRlTm9kZTogJGluZGljYXRvckVsZW1lbnQuZ2V0KDApXG4gICAgICAgIH0pO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBzY2FuRm9ySW1hZ2VzKCRzZWN0aW9uLCBncm91cFNldHRpbmdzKSB7XG4gICAgLy8gVE9ET1xufVxuXG5mdW5jdGlvbiBzY2FuRm9yTWVkaWEoJHNlY3Rpb24sIGdyb3VwU2V0dGluZ3MpIHtcbiAgICAvLyBUT0RPXG59XG5cbmZ1bmN0aW9uIGluc2VydENvbnRlbnQoJHBhcmVudCwgY29udGVudCwgbWV0aG9kKSB7XG4gICAgc3dpdGNoIChtZXRob2QpIHtcbiAgICAgICAgY2FzZSAnYXBwZW5kJzpcbiAgICAgICAgICAgICRwYXJlbnQuYXBwZW5kKGNvbnRlbnQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3ByZXBlbmQnOlxuICAgICAgICAgICAgJHBhcmVudC5wcmVwZW5kKGNvbnRlbnQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2JlZm9yZSc6XG4gICAgICAgICAgICAkcGFyZW50LmJlZm9yZShjb250ZW50KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdhZnRlcic6XG4gICAgICAgICAgICAkcGFyZW50LmFmdGVyKGNvbnRlbnQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICBzY2FuOiBzY2FuQWxsUGFnZXNcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgV2lkZ2V0QnVja2V0ID0gcmVxdWlyZSgnLi91dGlscy93aWRnZXQtYnVja2V0Jyk7XG52YXIgVHJhbnNpdGlvblV0aWwgPSByZXF1aXJlKCcuL3V0aWxzL3RyYW5zaXRpb24tdXRpbCcpO1xuXG52YXIgcmFjdGl2ZTtcbnZhciBjbGlja0hhbmRsZXI7XG5cblxuZnVuY3Rpb24gZ2V0Um9vdEVsZW1lbnQoY2FsbGJhY2spIHtcbiAgICAvLyBUT0RPIHJldmlzaXQgdGhpcywgaXQncyBraW5kIG9mIGdvb2Z5IGFuZCBpdCBtaWdodCBoYXZlIGEgdGltaW5nIHByb2JsZW1cbiAgICBpZiAoIXJhY3RpdmUpIHtcbiAgICAgICAgdmFyIGJ1Y2tldCA9IFdpZGdldEJ1Y2tldCgpO1xuICAgICAgICByYWN0aXZlID0gUmFjdGl2ZSh7XG4gICAgICAgICAgICBlbDogYnVja2V0LFxuICAgICAgICAgICAgYXBwZW5kOiB0cnVlLFxuICAgICAgICAgICAgdGVtcGxhdGU6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9wb3B1cC13aWRnZXQuaGJzLmh0bWwnKVxuICAgICAgICB9KTtcbiAgICAgICAgcmFjdGl2ZS5vbignY29tcGxldGUnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciAkZWxlbWVudCA9ICQocmFjdGl2ZS5maW5kKCcuYW50ZW5uYS1wb3B1cCcpKTtcbiAgICAgICAgICAgICRlbGVtZW50Lm9uKCdtb3VzZWRvd24nLCBmYWxzZSk7IC8vIFByZXZlbnQgbW91c2Vkb3duIGZyb20gcHJvcG9nYXRpbmcsIHNvIHRoZSBicm93c2VyIGRvZXNuJ3QgY2xlYXIgdGhlIHRleHQgc2VsZWN0aW9uLlxuICAgICAgICAgICAgJGVsZW1lbnQub24oJ2NsaWNrLmFudGVubmEtcG9wdXAnLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgIGhpZGVQb3B1cCgkZWxlbWVudCk7XG4gICAgICAgICAgICAgICAgaWYgKGNsaWNrSGFuZGxlcikge1xuICAgICAgICAgICAgICAgICAgICBjbGlja0hhbmRsZXIoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNhbGxiYWNrKCRlbGVtZW50KTtcbiAgICAgICAgfSlcbiAgICB9IGVsc2Uge1xuICAgICAgICBjYWxsYmFjaygkKHJhY3RpdmUuZmluZCgnLmFudGVubmEtcG9wdXAnKSkpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gc2hvd1BvcHVwKGNvb3JkaW5hdGVzLCBjYWxsYmFjaykge1xuICAgIGdldFJvb3RFbGVtZW50KGZ1bmN0aW9uKCRlbGVtZW50KSB7XG4gICAgICAgIGlmICghJGVsZW1lbnQuaGFzQ2xhc3MoJ3Nob3cnKSkge1xuICAgICAgICAgICAgY2xpY2tIYW5kbGVyID0gY2FsbGJhY2s7XG4gICAgICAgICAgICAkZWxlbWVudFxuICAgICAgICAgICAgICAgIC5zaG93KCkgLy8gc3RpbGwgaGFzIG9wYWNpdHkgMCBhdCB0aGlzIHBvaW50XG4gICAgICAgICAgICAgICAgLmNzcyh7XG4gICAgICAgICAgICAgICAgICAgIHRvcDogY29vcmRpbmF0ZXMudG9wIC0gJGVsZW1lbnQub3V0ZXJIZWlnaHQoKSAtIDYsIC8vIFRPRE8gZmluZCBhIGNsZWFuZXIgd2F5IHRvIGFjY291bnQgZm9yIHRoZSBwb3B1cCAndGFpbCdcbiAgICAgICAgICAgICAgICAgICAgbGVmdDogY29vcmRpbmF0ZXMubGVmdCAtIE1hdGguZmxvb3IoJGVsZW1lbnQub3V0ZXJXaWR0aCgpIC8gMilcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIFRyYW5zaXRpb25VdGlsLnRvZ2dsZUNsYXNzKCRlbGVtZW50LCAnc2hvdycsIHRydWUsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIC8vIFRPRE86IGFmdGVyIHRoZSBhcHBlYXJhbmNlIHRyYW5zaXRpb24gaXMgY29tcGxldGUsIGFkZCBhIGhhbmRsZXIgZm9yIG1vdXNlZW50ZXIgd2hpY2ggdGhlbiByZWdpc3RlcnNcbiAgICAgICAgICAgICAgICAvLyAgICAgICBhIGhhbmRsZXIgZm9yIG1vdXNlbGVhdmUgdGhhdCBoaWRlcyB0aGUgcG9wdXBcblxuICAgICAgICAgICAgICAgIC8vIFRPRE86IGFsc28gdGFrZSBkb3duIHRoZSBwb3B1cCBpZiB0aGUgdXNlciBtb3VzZXMgb3ZlciBhbm90aGVyIHdpZGdldCAoc3VtbWFyeSBvciBpbmRpY2F0b3IpXG4gICAgICAgICAgICAgICAgJChkb2N1bWVudCkub24oJ2NsaWNrLmFudGVubmEtcG9wdXAnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGhpZGVQb3B1cCgkZWxlbWVudCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBoaWRlUG9wdXAoJGVsZW1lbnQpIHtcbiAgICBUcmFuc2l0aW9uVXRpbC50b2dnbGVDbGFzcygkZWxlbWVudCwgJ3Nob3cnLCBmYWxzZSwgZnVuY3Rpb24oKSB7XG4gICAgICAgICRlbGVtZW50LmhpZGUoKTsgLy8gYWZ0ZXIgd2UncmUgYXQgb3BhY2l0eSAwLCBoaWRlIHRoZSBlbGVtZW50IHNvIGl0IGRvZXNuJ3QgcmVjZWl2ZSBhY2NpZGVudGFsIGNsaWNrc1xuICAgIH0pO1xuICAgICQoZG9jdW1lbnQpLm9mZignY2xpY2suYW50ZW5uYS1wb3B1cCcpO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgc2hvdzogc2hvd1BvcHVwXG59OyIsInZhciAkOyByZXF1aXJlKCcuL3V0aWxzL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIEFqYXhDbGllbnQgPSByZXF1aXJlKCcuL3V0aWxzL2FqYXgtY2xpZW50Jyk7XG52YXIgTW92ZWFibGUgPSByZXF1aXJlKCcuL3V0aWxzL21vdmVhYmxlJyk7XG52YXIgUmFuZ2UgPSByZXF1aXJlKCcuL3V0aWxzL3JhbmdlJyk7XG52YXIgVHJhbnNpdGlvblV0aWwgPSByZXF1aXJlKCcuL3V0aWxzL3RyYW5zaXRpb24tdXRpbCcpO1xudmFyIFVSTHMgPSByZXF1aXJlKCcuL3V0aWxzL3VybHMnKTtcbnZhciBXaWRnZXRCdWNrZXQgPSByZXF1aXJlKCcuL3V0aWxzL3dpZGdldC1idWNrZXQnKTtcblxuZnVuY3Rpb24gY3JlYXRlUmVhY3Rpb25zV2lkZ2V0KG9wdGlvbnMpIHtcbiAgICB2YXIgcmVhY3Rpb25zRGF0YSA9IG9wdGlvbnMucmVhY3Rpb25zRGF0YTtcbiAgICB2YXIgY29udGFpbmVyRGF0YSA9IG9wdGlvbnMuY29udGFpbmVyRGF0YTtcbiAgICB2YXIgY29udGFpbmVyRWxlbWVudCA9IG9wdGlvbnMuY29udGFpbmVyRWxlbWVudDtcbiAgICB2YXIgY29udGVudExvY2F0aW9uID0gb3B0aW9ucy5sb2NhdGlvbjtcbiAgICB2YXIgY29udGVudFR5cGUgPSBvcHRpb25zLmNvbnRlbnRUeXBlIHx8IFwidGV4dFwiOyAvLyBUT0RPXG4gICAgdmFyIGNvbnRlbnRCb2R5ID0gb3B0aW9ucy5ib2R5O1xuICAgIHZhciBkZWZhdWx0UmVhY3Rpb25zID0gb3B0aW9ucy5kZWZhdWx0UmVhY3Rpb25zO1xuICAgIHZhciBwYWdlRGF0YSA9IG9wdGlvbnMucGFnZURhdGE7XG4gICAgdmFyIGdyb3VwU2V0dGluZ3MgPSBvcHRpb25zLmdyb3VwU2V0dGluZ3M7XG4gICAgdmFyIGNvbG9ycyA9IGdyb3VwU2V0dGluZ3MucmVhY3Rpb25CYWNrZ3JvdW5kQ29sb3JzKCk7XG4gICAgLy9zb3J0UmVhY3Rpb25EYXRhKHJlYWN0aW9uc0RhdGEpO1xuICAgIHZhciByZWFjdGlvbnNMYXlvdXREYXRhID0gY29tcHV0ZUxheW91dERhdGEocmVhY3Rpb25zRGF0YSwgY29sb3JzKTtcbiAgICB2YXIgZGVmYXVsdExheW91dERhdGEgPSBjb21wdXRlTGF5b3V0RGF0YShkZWZhdWx0UmVhY3Rpb25zLCBjb2xvcnMpO1xuICAgIHZhciByYWN0aXZlID0gUmFjdGl2ZSh7XG4gICAgICAgIGVsOiBXaWRnZXRCdWNrZXQoKSxcbiAgICAgICAgYXBwZW5kOiB0cnVlLFxuICAgICAgICBtYWdpYzogdHJ1ZSxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgcmVhY3Rpb25zOiByZWFjdGlvbnNEYXRhLFxuICAgICAgICAgICAgcmVhY3Rpb25zTGF5b3V0Q2xhc3M6IGFycmF5QWNjZXNzb3IocmVhY3Rpb25zTGF5b3V0RGF0YS5sYXlvdXRDbGFzc2VzKSxcbiAgICAgICAgICAgIHJlYWN0aW9uc0JhY2tncm91bmRDb2xvcjogYXJyYXlBY2Nlc3NvcihyZWFjdGlvbnNMYXlvdXREYXRhLmJhY2tncm91bmRDb2xvcnMpLFxuICAgICAgICAgICAgZGVmYXVsdFJlYWN0aW9uczogZGVmYXVsdFJlYWN0aW9ucyxcbiAgICAgICAgICAgIGRlZmF1bHRMYXlvdXRDbGFzczogYXJyYXlBY2Nlc3NvcihkZWZhdWx0TGF5b3V0RGF0YS5sYXlvdXRDbGFzc2VzKSxcbiAgICAgICAgICAgIGRlZmF1bHRCYWNrZ3JvdW5kQ29sb3I6IGFycmF5QWNjZXNzb3IoZGVmYXVsdExheW91dERhdGEuYmFja2dyb3VuZENvbG9ycyksXG4gICAgICAgICAgICByZXNwb25zZToge31cbiAgICAgICAgfSxcbiAgICAgICAgdGVtcGxhdGU6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9yZWFjdGlvbnMtd2lkZ2V0Lmhicy5odG1sJyksXG4gICAgICAgIGRlY29yYXRvcnM6IHtcbiAgICAgICAgICAgIHNpemV0b2ZpdDogc2l6ZVRvRml0XG4gICAgICAgIH0sXG4gICAgICAgIGFudGVubmE6IHt9IC8vIGNyZWF0ZSBvdXIgb3duIHByb3BlcnR5IGJ1Y2tldCBvbiB0aGUgaW5zdGFuY2VcbiAgICB9KTtcbiAgICByYWN0aXZlLm9uKCdjb21wbGV0ZScsIGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgJHJvb3RFbGVtZW50ID0gJChyb290RWxlbWVudChyYWN0aXZlKSk7XG4gICAgICAgIE1vdmVhYmxlLm1ha2VNb3ZlYWJsZSgkcm9vdEVsZW1lbnQsICRyb290RWxlbWVudC5maW5kKCcuYW50ZW5uYS1oZWFkZXInKSk7XG4gICAgfSk7XG4gICAgcmFjdGl2ZS5vbignY2hhbmdlJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIHJlYWN0aW9uc0xheW91dERhdGEgPSBjb21wdXRlTGF5b3V0RGF0YShyZWFjdGlvbnNEYXRhLCBjb2xvcnMpO1xuICAgIH0pO1xuICAgIGlmIChjb250YWluZXJFbGVtZW50KSB7XG4gICAgICAgIHJhY3RpdmUub24oJ2hpZ2hsaWdodCcsIGhpZ2hsaWdodENvbnRlbnQoY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIHJhY3RpdmUsIGNvbnRhaW5lckVsZW1lbnQpKTtcbiAgICAgICAgcmFjdGl2ZS5vbignY2xlYXJoaWdobGlnaHRzJywgUmFuZ2UuY2xlYXJIaWdobGlnaHRzKTtcbiAgICB9XG4gICAgcmFjdGl2ZS5vbigncGx1c29uZScsIHBsdXNPbmUoY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIHJhY3RpdmUpKTtcbiAgICByYWN0aXZlLm9uKCduZXdyZWFjdGlvbicsIG5ld0RlZmF1bHRSZWFjdGlvbihjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgY29udGVudEJvZHksIGNvbnRlbnRMb2NhdGlvbiwgY29udGVudFR5cGUsIHJhY3RpdmUpKTtcbiAgICByZXR1cm4ge1xuICAgICAgICBvcGVuOiBvcGVuV2luZG93KHJlYWN0aW9uc0RhdGEsIHJhY3RpdmUpXG4gICAgfTtcbn1cblxuZnVuY3Rpb24gYXJyYXlBY2Nlc3NvcihhcnJheSkge1xuICAgIHJldHVybiBmdW5jdGlvbihpbmRleCkge1xuICAgICAgICByZXR1cm4gYXJyYXlbaW5kZXhdO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gc29ydFJlYWN0aW9uRGF0YShyZWFjdGlvbnMpIHtcbiAgICByZWFjdGlvbnMuc29ydChmdW5jdGlvbihyZWFjdGlvbkEsIHJlYWN0aW9uQikge1xuICAgICAgIHJldHVybiByZWFjdGlvbkIuY291bnQgLSByZWFjdGlvbkEuY291bnQ7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIHNpemVUb0ZpdChub2RlKSB7XG4gICAgdmFyICRlbGVtZW50ID0gJChub2RlKTtcbiAgICB2YXIgJHJvb3RFbGVtZW50ID0gJGVsZW1lbnQuY2xvc2VzdCgnLmFudGVubmEtcmVhY3Rpb25zLXdpZGdldCcpO1xuICAgIGlmICgkcm9vdEVsZW1lbnQubGVuZ3RoID4gMCkge1xuICAgICAgICAkcm9vdEVsZW1lbnQuY3NzKHtkaXNwbGF5OiAnYmxvY2snLCBsZWZ0OiAnMTAwJSd9KTtcbiAgICAgICAgdmFyIHJhdGlvID0gbm9kZS5jbGllbnRXaWR0aCAvIG5vZGUuc2Nyb2xsV2lkdGg7XG4gICAgICAgIGlmIChyYXRpbyA8IDEuMCkgeyAvLyBJZiB0aGUgdGV4dCBkb2Vzbid0IGZpdCwgZmlyc3QgdHJ5IHRvIHdyYXAgaXQgdG8gdHdvIGxpbmVzLiBUaGVuIHNjYWxlIGl0IGRvd24gaWYgc3RpbGwgbmVjZXNzYXJ5LlxuICAgICAgICAgICAgdmFyIHRleHQgPSBub2RlLmlubmVySFRNTDtcbiAgICAgICAgICAgIHZhciBtaWQgPSBNYXRoLmNlaWwodGV4dC5sZW5ndGggLyAyKTsgLy8gTG9vayBmb3IgdGhlIGNsb3Nlc3Qgc3BhY2UgdG8gdGhlIG1pZGRsZSwgd2VpZ2h0ZWQgc2xpZ2h0bHkgKE1hdGguY2VpbCkgdG93YXJkIGEgc3BhY2UgaW4gdGhlIHNlY29uZCBoYWxmLlxuICAgICAgICAgICAgdmFyIHNlY29uZEhhbGZJbmRleCA9IHRleHQuaW5kZXhPZignICcsIG1pZCk7XG4gICAgICAgICAgICB2YXIgZmlyc3RIYWxmSW5kZXggPSB0ZXh0Lmxhc3RJbmRleE9mKCcgJywgbWlkKTtcbiAgICAgICAgICAgIHZhciBzcGxpdEluZGV4ID0gTWF0aC5hYnMoc2Vjb25kSGFsZkluZGV4IC0gbWlkKSA8IE1hdGguYWJzKG1pZCAtIGZpcnN0SGFsZkluZGV4KSA/IHNlY29uZEhhbGZJbmRleCA6IGZpcnN0SGFsZkluZGV4O1xuICAgICAgICAgICAgaWYgKHNwbGl0SW5kZXggPiAxKSB7XG4gICAgICAgICAgICAgICAgbm9kZS5pbm5lckhUTUwgPSB0ZXh0LnNsaWNlKDAsIHNwbGl0SW5kZXgpICsgJzxicj4nICsgdGV4dC5zbGljZShzcGxpdEluZGV4KTtcbiAgICAgICAgICAgICAgICByYXRpbyA9IG5vZGUuY2xpZW50V2lkdGggLyBub2RlLnNjcm9sbFdpZHRoO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHJhdGlvIDwgMS4wKSB7XG4gICAgICAgICAgICAgICAgJGVsZW1lbnQuY3NzKCdmb250LXNpemUnLCBNYXRoLm1heCgxMCwgTWF0aC5mbG9vcihwYXJzZUludCgkZWxlbWVudC5jc3MoJ2ZvbnQtc2l6ZScpKSAqIHJhdGlvKSAtIDEpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAkcm9vdEVsZW1lbnQuY3NzKHtkaXNwbGF5OiAnJywgbGVmdDogJyd9KTtcbiAgICB9XG4gICAgcmV0dXJuIHsgdGVhcmRvd246IGZ1bmN0aW9uKCkge30gfTtcbn1cblxuZnVuY3Rpb24gaGlnaGxpZ2h0Q29udGVudChjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgcmFjdGl2ZSwgJGNvbnRhaW5lckVsZW1lbnQpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdmFyIHJlYWN0aW9uRGF0YSA9IGV2ZW50LmNvbnRleHQ7XG4gICAgICAgIGlmIChyZWFjdGlvbkRhdGEuY29udGVudCkge1xuICAgICAgICAgICAgdmFyIGxvY2F0aW9uID0gcmVhY3Rpb25EYXRhLmNvbnRlbnQubG9jYXRpb247XG4gICAgICAgICAgICBpZiAobG9jYXRpb24pIHtcbiAgICAgICAgICAgICAgICBSYW5nZS5oaWdobGlnaHQoJGNvbnRhaW5lckVsZW1lbnQuZ2V0KDApLCBsb2NhdGlvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIG5ld0RlZmF1bHRSZWFjdGlvbihjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgY29udGVudEJvZHksIGNvbnRlbnRMb2NhdGlvbiwgY29udGVudFR5cGUsIHJhY3RpdmUpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdmFyIGRlZmF1bHRSZWFjdGlvbkRhdGEgPSBldmVudC5jb250ZXh0O1xuICAgICAgICBzaG93UGFnZSgnLmFudGVubmEtcHJvZ3Jlc3MtcGFnZScsIHJhY3RpdmUsIGZhbHNlLCB0cnVlKTtcbiAgICAgICAgQWpheENsaWVudC5wb3N0TmV3UmVhY3Rpb24oZGVmYXVsdFJlYWN0aW9uRGF0YSwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGNvbnRlbnRMb2NhdGlvbiwgY29udGVudEJvZHksIGNvbnRlbnRUeXBlLCBzdWNjZXNzLCBlcnJvcik7XG5cbiAgICAgICAgZnVuY3Rpb24gc3VjY2VzcyhyZXNwb25zZSkge1xuICAgICAgICAgICAgaWYgKHJlc3BvbnNlLmV4aXN0aW5nKSB7XG4gICAgICAgICAgICAgICAgLy8gVE9ETzogV2UgY2FuIGVpdGhlciBhY2Nlc3MgdGhpcyBkYXRhIHRocm91Z2ggdGhlIHJhY3RpdmUga2V5cGF0aCBvciBieSBwYXNzaW5nIHRoZSBkYXRhIG9iamVjdCBhcm91bmQuIFBpY2sgb25lLlxuICAgICAgICAgICAgICAgIHJhY3RpdmUuc2V0KCdyZXNwb25zZS5leGlzdGluZycsIHJlc3BvbnNlLmV4aXN0aW5nKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgIC8vIFRPRE86IHRoZSBzZXJ2ZXIgc2hvdWxkIGdpdmUgdXMgYmFjayBhIHJlYWN0aW9uIG1hdGNoaW5nIHRoZSBuZXcgQVBJIGZvcm1hdC5cbiAgICAgICAgICAgICAgICAgLy8gICAgICAgd2UncmUganVzdCBmYWtpbmcgaXQgb3V0IGZvciBub3c7IHRoaXMgY29kZSBpcyB0ZW1wb3JhcnlcbiAgICAgICAgICAgICAgICB2YXIgcmVhY3Rpb24gPSB7XG4gICAgICAgICAgICAgICAgICAgIHRleHQ6IHJlc3BvbnNlLmludGVyYWN0aW9uLmludGVyYWN0aW9uX25vZGUuYm9keSxcbiAgICAgICAgICAgICAgICAgICAgaWQ6IHJlc3BvbnNlLmludGVyYWN0aW9uLmludGVyYWN0aW9uX25vZGUuaWQsXG4gICAgICAgICAgICAgICAgICAgIGNvdW50OiAxLCAvLyBUT0RPOiBjb3VsZCB3ZSBnZXQgYmFjayBhIGRpZmZlcmVudCBjb3VudCBpZiBzb21lb25lIGVsc2UgbWFkZSB0aGUgc2FtZSBcIm5ld1wiIHJlYWN0aW9uIGJlZm9yZSB1cz9cbiAgICAgICAgICAgICAgICAgICAgLy8gcGFyZW50SWQ6ID8/PyBUT0RPOiBjb3VsZCB3ZSBnZXQgYSBwYXJlbnRJZCBiYWNrIGlmIHNvbWVvbmUgZWxzZSBtYWRlIHRoZSBzYW1lIFwibmV3XCIgcmVhY3Rpb24gYmVmb3JlIHVzP1xuICAgICAgICAgICAgICAgICAgICBjb250ZW50OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2NhdGlvbjogY29udGVudExvY2F0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAga2luZDogY29udGVudFR5cGUsXG4gICAgICAgICAgICAgICAgICAgICAgICBib2R5OiBjb250ZW50Qm9keSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkOiByZXNwb25zZS5jb250ZW50X25vZGUuaWRcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgLy8gVE9ETzogY2hlY2sgYmFjayBvbiB0aGlzIGFzIHRoZSB3YXkgdG8gcHJvcG9nYXRlIGRhdGEgY2hhbmdlcyBpbnRvIHRoZSBtb2RlbC4gQ29uc2lkZXIgYWRkaW5nIHNvbWV0aGluZ1xuICAgICAgICAgICAgICAgIC8vICAgICAgIHRvIFBhZ2VEYXRhIHRvIGhhbmRsZSB0aGlzIGluc3RlYWQuXG4gICAgICAgICAgICAgICAgY29udGFpbmVyRGF0YS5yZWFjdGlvbnMucHVzaChyZWFjdGlvbik7XG4gICAgICAgICAgICAgICAgc29ydFJlYWN0aW9uRGF0YShjb250YWluZXJEYXRhLnJlYWN0aW9ucyk7XG4gICAgICAgICAgICAgICAgY29udGFpbmVyRGF0YS5yZWFjdGlvblRvdGFsID0gY29udGFpbmVyRGF0YS5yZWFjdGlvblRvdGFsICsgMTtcbiAgICAgICAgICAgICAgICB2YXIgc3VtbWFyeVJlYWN0aW9uID0ge1xuICAgICAgICAgICAgICAgICAgICB0ZXh0OiByZWFjdGlvbi50ZXh0LFxuICAgICAgICAgICAgICAgICAgICBpZDogcmVhY3Rpb24uaWQsXG4gICAgICAgICAgICAgICAgICAgIGNvdW50OiByZWFjdGlvbi5jb3VudFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgcGFnZURhdGEuc3VtbWFyeVJlYWN0aW9ucy5wdXNoKHN1bW1hcnlSZWFjdGlvbik7XG4gICAgICAgICAgICAgICAgcGFnZURhdGEuc3VtbWFyeVRvdGFsID0gcGFnZURhdGEuc3VtbWFyeVRvdGFsICsgMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNob3dQYWdlKCcuYW50ZW5uYS1jb25maXJtLXBhZ2UnLCByYWN0aXZlLCB0cnVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGVycm9yKG1lc3NhZ2UpIHtcbiAgICAgICAgICAgIC8vIFRPRE8gaGFuZGxlIGFueSBlcnJvcnMgdGhhdCBvY2N1ciBwb3N0aW5nIGEgcmVhY3Rpb25cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiZXJyb3IgcG9zdGluZyBuZXcgcmVhY3Rpb246IFwiICsgbWVzc2FnZSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIHBsdXNPbmUoY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIHJhY3RpdmUpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdmFyIHJlYWN0aW9uRGF0YSA9IGV2ZW50LmNvbnRleHQ7XG4gICAgICAgIHNob3dQYWdlKCcuYW50ZW5uYS1wcm9ncmVzcy1wYWdlJywgcmFjdGl2ZSwgZmFsc2UsIHRydWUpO1xuICAgICAgICBBamF4Q2xpZW50LnBvc3RQbHVzT25lKHJlYWN0aW9uRGF0YSwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIHN1Y2Nlc3MsIGVycm9yKTtcblxuICAgICAgICBmdW5jdGlvbiBzdWNjZXNzKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICByYWN0aXZlLnNldCgncmVzcG9uc2UuZXhpc3RpbmcnLCByZXNwb25zZS5leGlzdGluZyk7IC8vIFRPRE86IFdlIGNhbiBlaXRoZXIgYWNjZXNzIHRoaXMgZGF0YSB0aHJvdWdoIHRoZSByYWN0aXZlIGtleXBhdGggb3IgYnkgcGFzc2luZyB0aGUgZGF0YSBvYmplY3QgYXJvdW5kLiBQaWNrIG9uZS5cbiAgICAgICAgICAgIGlmICghcmVzcG9uc2UuZXhpc3RpbmcpIHtcbiAgICAgICAgICAgICAgICAvLyBUT0RPOiB3ZSBzaG91bGQgZ2V0IGJhY2sgYSByZXNwb25zZSB3aXRoIGRhdGEgaW4gdGhlIFwibmV3IGZvcm1hdFwiIGFuZCB1cGRhdGUgdGhlIG1vZGVsIGZyb20gdGhlIHJlc3BvbnNlXG4gICAgICAgICAgICAgICAgcmVhY3Rpb25EYXRhLmNvdW50ID0gcmVhY3Rpb25EYXRhLmNvdW50ICsgMTtcbiAgICAgICAgICAgICAgICBjb250YWluZXJEYXRhLnJlYWN0aW9uVG90YWwgPSBjb250YWluZXJEYXRhLnJlYWN0aW9uVG90YWwgKyAxO1xuICAgICAgICAgICAgICAgIHBhZ2VEYXRhLnN1bW1hcnlUb3RhbCA9IHBhZ2VEYXRhLnN1bW1hcnlUb3RhbCArIDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzaG93UGFnZSgnLmFudGVubmEtY29uZmlybS1wYWdlJywgcmFjdGl2ZSwgdHJ1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBlcnJvcihtZXNzYWdlKSB7XG4gICAgICAgICAgICAvLyBUT0RPIGhhbmRsZSBhbnkgZXJyb3JzIHRoYXQgb2NjdXIgcG9zdGluZyBhIHJlYWN0aW9uXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcImVycm9yIHBvc3RpbmcgcGx1cyBvbmU6IFwiICsgbWVzc2FnZSk7XG4gICAgICAgIH1cbiAgICB9O1xufVxuXG5mdW5jdGlvbiBjb21wdXRlTGF5b3V0RGF0YShyZWFjdGlvbnNEYXRhLCBjb2xvcnMpIHtcbiAgICAvLyBUT0RPIFZlcmlmeSB0aGF0IHRoZSByZWFjdGlvbnNEYXRhIGlzIGNvbWluZyBiYWNrIGZyb20gdGhlIHNlcnZlciBzb3J0ZWQuIElmIG5vdCwgc29ydCBpdCBhZnRlciBpdHMgZmV0Y2hlZC5cblxuICAgIHZhciBudW1SZWFjdGlvbnMgPSByZWFjdGlvbnNEYXRhLmxlbmd0aDtcbiAgICBpZiAobnVtUmVhY3Rpb25zID09IDApIHtcbiAgICAgICAgcmV0dXJuIHt9OyAvLyBUT0RPIGNsZWFuIHRoaXMgdXBcbiAgICB9XG4gICAgLy8gVE9ETzogQ29waWVkIGNvZGUgZnJvbSBlbmdhZ2VfZnVsbC5jcmVhdGVUYWdCdWNrZXRzXG4gICAgdmFyIG1heCA9IHJlYWN0aW9uc0RhdGFbMF0uY291bnQ7XG4gICAgdmFyIG1lZGlhbiA9IHJlYWN0aW9uc0RhdGFbIE1hdGguZmxvb3IocmVhY3Rpb25zRGF0YS5sZW5ndGgvMikgXS5jb3VudDtcbiAgICB2YXIgbWluID0gcmVhY3Rpb25zRGF0YVsgcmVhY3Rpb25zRGF0YS5sZW5ndGgtMSBdLmNvdW50O1xuICAgIHZhciB0b3RhbCA9IDA7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBudW1SZWFjdGlvbnM7IGkrKykge1xuICAgICAgICB0b3RhbCArPSByZWFjdGlvbnNEYXRhW2ldLmNvdW50O1xuICAgIH1cbiAgICB2YXIgYXZlcmFnZSA9IE1hdGguZmxvb3IodG90YWwgLyBudW1SZWFjdGlvbnMpO1xuICAgIHZhciBtaWRWYWx1ZSA9ICggbWVkaWFuID4gYXZlcmFnZSApID8gbWVkaWFuIDogYXZlcmFnZTtcblxuICAgIHZhciBsYXlvdXRDbGFzc2VzID0gW107XG4gICAgdmFyIG51bUhhbGZzaWVzID0gMDtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG51bVJlYWN0aW9uczsgaSsrKSB7XG4gICAgICAgIGlmIChyZWFjdGlvbnNEYXRhW2ldLmNvdW50ID4gbWlkVmFsdWUpIHtcbiAgICAgICAgICAgIGxheW91dENsYXNzZXNbaV0gPSAnZnVsbCc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsYXlvdXRDbGFzc2VzW2ldID0gJ2hhbGYnO1xuICAgICAgICAgICAgbnVtSGFsZnNpZXMrKztcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAobnVtSGFsZnNpZXMgJSAyICE9PTApIHtcbiAgICAgICAgbGF5b3V0Q2xhc3Nlc1tudW1SZWFjdGlvbnMgLSAxXSA9ICdmdWxsJzsgLy8gSWYgdGhlcmUgYXJlIGFuIG9kZCBudW1iZXIsIHRoZSBsYXN0IG9uZSBnb2VzIGZ1bGwuXG4gICAgfVxuXG4gICAgdmFyIGJhY2tncm91bmRDb2xvcnMgPSBbXTtcbiAgICB2YXIgY29sb3JJbmRleCA9IDA7XG4gICAgdmFyIHBhaXJXaXRoTmV4dCA9IDA7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBudW1SZWFjdGlvbnM7IGkrKykge1xuICAgICAgICBiYWNrZ3JvdW5kQ29sb3JzW2ldID0gY29sb3JzW2NvbG9ySW5kZXggJSBjb2xvcnMubGVuZ3RoXTtcbiAgICAgICAgaWYgKGxheW91dENsYXNzZXNbaV0gPT09ICdmdWxsJykge1xuICAgICAgICAgICAgY29sb3JJbmRleCsrO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gVE9ETyBnb3R0YSBiZSBhYmxlIHRvIG1ha2UgdGhpcyBzaW1wbGVyXG4gICAgICAgICAgICBpZiAocGFpcldpdGhOZXh0ID4gMCkge1xuICAgICAgICAgICAgICAgIHBhaXJXaXRoTmV4dC0tO1xuICAgICAgICAgICAgICAgIGlmIChwYWlyV2l0aE5leHQgPT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBjb2xvckluZGV4Kys7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBwYWlyV2l0aE5leHQgPSAxOyAvLyBJZiB3ZSB3YW50IHRvIGFsbG93IE4gYm94ZXMgcGVyIHJvdywgdGhpcyBudW1iZXIgd291bGQgYmVjb21lIGNvbmRpdGlvbmFsLlxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgbGF5b3V0Q2xhc3NlczogbGF5b3V0Q2xhc3NlcyxcbiAgICAgICAgYmFja2dyb3VuZENvbG9yczogYmFja2dyb3VuZENvbG9yc1xuICAgIH07XG59XG5cbmZ1bmN0aW9uIHJvb3RFbGVtZW50KHJhY3RpdmUpIHtcbiAgICByZXR1cm4gcmFjdGl2ZS5maW5kKCcuYW50ZW5uYS1yZWFjdGlvbnMtd2lkZ2V0Jyk7XG59XG5cbnZhciBwYWdlWiA9IDEwMDA7IC8vIEl0J3Mgc2FmZSBmb3IgdGhpcyB2YWx1ZSB0byBnbyBhY3Jvc3MgaW5zdGFuY2VzLiBXZSBqdXN0IG5lZWQgaXQgdG8gY29udGludW91c2x5IGluY3JlYXNlIChtYXggdmFsdWUgaXMgb3ZlciAyIGJpbGxpb24pLlxuXG5mdW5jdGlvbiBzaG93UGFnZShwYWdlU2VsZWN0b3IsIHJhY3RpdmUsIGFuaW1hdGUsIG92ZXJsYXkpIHtcbiAgICB2YXIgJHJvb3QgPSAkKHJvb3RFbGVtZW50KHJhY3RpdmUpKTtcbiAgICB2YXIgJHBhZ2UgPSAkcm9vdC5maW5kKHBhZ2VTZWxlY3Rvcik7XG4gICAgJHBhZ2UuY3NzKCd6LWluZGV4JywgcGFnZVopO1xuICAgIHBhZ2VaICs9IDE7XG5cbiAgICAkcGFnZS50b2dnbGVDbGFzcygnYW50ZW5uYS1wYWdlLWFuaW1hdGUnLCBhbmltYXRlKTtcblxuICAgIGlmIChvdmVybGF5KSB7XG4gICAgICAgIC8vIEluIHRoZSBvdmVybGF5IGNhc2UsIHNpemUgdGhlIHBhZ2UgdG8gbWF0Y2ggd2hhdGV2ZXIgcGFnZSBpcyBjdXJyZW50bHkgc2hvd2luZyBhbmQgdGhlbiBtYWtlIGl0IGFjdGl2ZSAodGhlcmUgd2lsbCBiZSB0d28gJ2FjdGl2ZScgcGFnZXMpXG4gICAgICAgIHZhciAkY3VycmVudCA9ICRyb290LmZpbmQoJy5hbnRlbm5hLXBhZ2UtYWN0aXZlJyk7XG4gICAgICAgICRwYWdlLmhlaWdodCgkY3VycmVudC5oZWlnaHQoKSk7XG4gICAgICAgICRwYWdlLmFkZENsYXNzKCdhbnRlbm5hLXBhZ2UtYWN0aXZlJyk7XG4gICAgfSBlbHNlIGlmIChhbmltYXRlKSB7XG4gICAgICAgIFRyYW5zaXRpb25VdGlsLnRvZ2dsZUNsYXNzKCRwYWdlLCAnYW50ZW5uYS1wYWdlLWFjdGl2ZScsIHRydWUsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy8gQWZ0ZXIgdGhlIG5ldyBwYWdlIHNsaWRlcyBpbnRvIHBvc2l0aW9uLCBtb3ZlIHRoZSBvdGhlciBwYWdlcyBiYWNrIG91dCBvZiB0aGUgdmlld2FibGUgYXJlYVxuICAgICAgICAgICAgJHJvb3QuZmluZCgnLmFudGVubmEtcGFnZScpLm5vdChwYWdlU2VsZWN0b3IpLnJlbW92ZUNsYXNzKCdhbnRlbm5hLXBhZ2UtYWN0aXZlJyk7XG4gICAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICAgICRwYWdlLmFkZENsYXNzKCdhbnRlbm5hLXBhZ2UtYWN0aXZlJyk7XG4gICAgICAgICRyb290LmZpbmQoJy5hbnRlbm5hLXBhZ2UnKS5ub3QocGFnZVNlbGVjdG9yKS5yZW1vdmVDbGFzcygnYW50ZW5uYS1wYWdlLWFjdGl2ZScpO1xuICAgIH1cbiAgICBzaXplQm9keVRvRml0KHJhY3RpdmUsICRwYWdlLCBhbmltYXRlKTtcbn1cblxuZnVuY3Rpb24gc2l6ZUJvZHlUb0ZpdChyYWN0aXZlLCAkZWxlbWVudCwgYW5pbWF0ZSkge1xuICAgIHZhciAkcm9vdCA9ICQocm9vdEVsZW1lbnQocmFjdGl2ZSkpO1xuICAgIHZhciAkYm9keSA9ICRyb290LmZpbmQoJy5hbnRlbm5hLWJvZHknKTtcbiAgICB2YXIgY3VycmVudEhlaWdodCA9ICRib2R5LmNzcygnaGVpZ2h0Jyk7XG4gICAgJGJvZHkuY3NzKHsgaGVpZ2h0OiAnJyB9KTsgLy8gQ2xlYXIgYW55IHByZXZpb3VzbHkgY29tcHV0ZWQgaGVpZ2h0IHNvIHdlIGdldCBhIGZyZXNoIGNvbXB1dGF0aW9uIG9mIHRoZSBjaGlsZCBoZWlnaHRzXG4gICAgdmFyIG5ld0hlaWdodCA9IE1hdGgubWluKDMwMCwgJGVsZW1lbnQuZ2V0KDApLnNjcm9sbEhlaWdodCk7XG4gICAgaWYgKGFuaW1hdGUpIHtcbiAgICAgICAgJGJvZHkuY3NzKHsgaGVpZ2h0OiBjdXJyZW50SGVpZ2h0IH0pO1xuICAgICAgICAkYm9keS5hbmltYXRlKHsgaGVpZ2h0OiBuZXdIZWlnaHQgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgJGJvZHkuY3NzKHsgaGVpZ2h0OiBuZXdIZWlnaHQgfSk7XG4gICAgfVxuICAgIC8vIFRPRE86IHdlIG1pZ2h0IG5vdCBuZWVkIHdpZHRoIHJlc2l6aW5nIGF0IGFsbC5cbiAgICB2YXIgbWluV2lkdGggPSAkZWxlbWVudC5jc3MoJ21pbi13aWR0aCcpO1xuICAgIHZhciB3aWR0aCA9IChwYXJzZUludChtaW5XaWR0aCkgPiAwKSA/IG1pbldpZHRoOiAnJztcbiAgICBpZiAoYW5pbWF0ZSkge1xuICAgICAgICAkcm9vdC5hbmltYXRlKHsgd2lkdGg6IHdpZHRoIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICAgICRyb290LmNzcyh7IHdpZHRoOiB3aWR0aCB9KTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIG9wZW5XaW5kb3cocmVhY3Rpb25zRGF0YSwgcmFjdGl2ZSkge1xuICAgIHJldHVybiBmdW5jdGlvbihlbGVtZW50T3JDb29yZHMpIHtcbiAgICAgICAgJCgnLmFudGVubmEtcmVhY3Rpb25zLXdpZGdldCcpLnRyaWdnZXIoJ2ZvY3Vzb3V0Jyk7IC8vIFByb21wdCBhbnkgb3RoZXIgb3BlbiB3aW5kb3dzIHRvIGNsb3NlLlxuICAgICAgICB2YXIgY29vcmRzO1xuICAgICAgICBpZiAoZWxlbWVudE9yQ29vcmRzLnRvcCAmJiBlbGVtZW50T3JDb29yZHMubGVmdCkge1xuICAgICAgICAgICAgY29vcmRzID0gZWxlbWVudE9yQ29vcmRzO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyICRyZWxhdGl2ZUVsZW1lbnQgPSAkKGVsZW1lbnRPckNvb3Jkcyk7XG4gICAgICAgICAgICB2YXIgb2Zmc2V0ID0gJHJlbGF0aXZlRWxlbWVudC5vZmZzZXQoKTtcbiAgICAgICAgICAgIGNvb3JkcyA9IHtcbiAgICAgICAgICAgICAgICB0b3A6IG9mZnNldC50b3AgKyA1LFxuICAgICAgICAgICAgICAgIGxlZnQ6IG9mZnNldC5sZWZ0ICsgNVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICAvLyBUT0RPOiBMb29rIGF0IHdoZXRoZXIgd2UncmUgb3BlbmluZyBvZmYgc2NyZWVuIGFuZCBhZGp1c3QgdGhlIGNvb3JkcyBpZiBuZWVkZWRcbiAgICAgICAgdmFyICRyb290RWxlbWVudCA9ICQocm9vdEVsZW1lbnQocmFjdGl2ZSkpO1xuICAgICAgICAkcm9vdEVsZW1lbnQuc3RvcCh0cnVlLCB0cnVlKS5hZGRDbGFzcygnb3BlbicpLmNzcyhjb29yZHMpO1xuXG4gICAgICAgIGlmIChyZWFjdGlvbnNEYXRhLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHNob3dQYWdlKCcuYW50ZW5uYS1yZWFjdGlvbnMtcGFnZScsIHJhY3RpdmUsIGZhbHNlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIFRPRE8gYWxsb3cgdG8gb3ZlcnJpZGUgYW5kIGZvcmNlIHNob3dpbmcgb2YgZGVmYXVsdFxuICAgICAgICAgICAgc2hvd1BhZ2UoJy5hbnRlbm5hLWRlZmF1bHQtcGFnZScsIHJhY3RpdmUsIGZhbHNlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHNldHVwV2luZG93Q2xvc2UocmFjdGl2ZSk7XG4gICAgfTtcbn1cblxuZnVuY3Rpb24gc2V0dXBXaW5kb3dDbG9zZShyYWN0aXZlKSB7XG4gICAgdmFyICRyb290RWxlbWVudCA9ICQocm9vdEVsZW1lbnQocmFjdGl2ZSkpO1xuXG4gICAgLy8gVE9ETzogSWYgeW91IG1vdXNlIG92ZXIgdGhlIHRyaWdnZXIgc2xvd2x5IGZyb20gdGhlIHRvcCBsZWZ0LCB0aGUgd2luZG93IG9wZW5zIHdpdGhvdXQgYmVpbmcgdW5kZXIgdGhlIGN1cnNvcixcbiAgICAvLyAgICAgICBzbyBubyBtb3VzZW91dCBldmVudCBpcyByZWNlaXZlZC4gV2hlbiB3ZSBvcGVuIHRoZSB3aW5kb3csIHdlIHNob3VsZCBwcm9iYWJseSBqdXN0IHNjb290IGl0IHVwIHNsaWdodGx5XG4gICAgLy8gICAgICAgaWYgbmVlZGVkIHRvIGFzc3VyZSB0aGF0IGl0J3MgdW5kZXIgdGhlIGN1cnNvci4gQWx0ZXJuYXRpdmVseSwgd2UgY291bGQgYWRqdXN0IHRoZSBtb3VzZW92ZXIgYXJlYSB0byBtYXRjaFxuICAgIC8vICAgICAgIHRoZSByZWdpb24gdGhhdCB0aGUgd2luZG93IG9wZW5zLlxuICAgICRyb290RWxlbWVudFxuICAgICAgICAub24oJ21vdXNlb3V0LmFudGVubmEnLCBkZWxheWVkQ2xvc2VXaW5kb3cpXG4gICAgICAgIC5vbignbW91c2VvdmVyLmFudGVubmEnLCBrZWVwV2luZG93T3BlbilcbiAgICAgICAgLm9uKCdmb2N1c2luLmFudGVubmEnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIE9uY2UgdGhlIHdpbmRvdyBoYXMgZm9jdXMsIGRvbid0IGNsb3NlIGl0IG9uIG1vdXNlb3V0LlxuICAgICAgICAgICAga2VlcFdpbmRvd09wZW4oKTtcbiAgICAgICAgICAgICRyb290RWxlbWVudC5vZmYoJ21vdXNlb3V0LmFudGVubmEnKTtcbiAgICAgICAgICAgICRyb290RWxlbWVudC5vZmYoJ21vdXNlb3Zlci5hbnRlbm5hJyk7XG4gICAgICAgIH0pXG4gICAgICAgIC5vbignZm9jdXNvdXQuYW50ZW5uYScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY2xvc2VXaW5kb3coKTtcbiAgICAgICAgfSk7XG4gICAgJChkb2N1bWVudCkub24oJ2NsaWNrLmFudGVubmEnLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBpZiAoJChldmVudC50YXJnZXQpLmNsb3Nlc3QoJy5hbnRlbm5hLXJlYWN0aW9ucy13aWRnZXQnKS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIGNsb3NlV2luZG93KCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIHZhciBjbG9zZVRpbWVyO1xuXG4gICAgZnVuY3Rpb24gZGVsYXllZENsb3NlV2luZG93KCkge1xuICAgICAgICBjbG9zZVRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNsb3NlVGltZXIgPSBudWxsO1xuICAgICAgICAgICAgY2xvc2VXaW5kb3coKTtcbiAgICAgICAgfSwgNTAwKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBrZWVwV2luZG93T3BlbigpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KGNsb3NlVGltZXIpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNsb3NlV2luZG93KCkge1xuICAgICAgICBjbGVhclRpbWVvdXQoY2xvc2VUaW1lcik7XG5cbiAgICAgICAgJHJvb3RFbGVtZW50LnN0b3AodHJ1ZSwgdHJ1ZSkuZmFkZU91dCgnZmFzdCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgJHJvb3RFbGVtZW50LmNzcygnZGlzcGxheScsICcnKTsgLy8gQ2xlYXIgdGhlIGRpc3BsYXk6bm9uZSB0aGF0IGZhZGVPdXQgcHV0cyBvbiB0aGUgZWxlbWVudFxuICAgICAgICAgICAgJHJvb3RFbGVtZW50LnJlbW92ZUNsYXNzKCdvcGVuJyk7XG4gICAgICAgIH0pO1xuICAgICAgICAkcm9vdEVsZW1lbnQub2ZmKCcuYW50ZW5uYScpOyAvLyBVbmJpbmQgYWxsIG9mIHRoZSBoYW5kbGVycyBpbiBvdXIgbmFtZXNwYWNlXG4gICAgICAgICQoZG9jdW1lbnQpLm9mZignY2xpY2suYW50ZW5uYScpO1xuICAgICAgICBSYW5nZS5jbGVhckhpZ2hsaWdodHMoKTtcbiAgICB9XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGU6IGNyZWF0ZVJlYWN0aW9uc1dpZGdldFxufTsiLCJ2YXIgUmFuZ3lQcm92aWRlciA9IHJlcXVpcmUoJy4vdXRpbHMvcmFuZ3ktcHJvdmlkZXInKTtcbnZhciBKUXVlcnlQcm92aWRlciA9IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJyk7XG52YXIgaXNPZmZsaW5lID0gcmVxdWlyZSgnLi91dGlscy9vZmZsaW5lJyk7XG52YXIgVVJMcyA9IHJlcXVpcmUoJy4vdXRpbHMvdXJscycpO1xuXG52YXIgYmFzZVVybCA9IFVSTHMuYW50ZW5uYUhvbWUoKTtcblxudmFyIHNjcmlwdHMgPSBbXG4gICAge3NyYzogJy8vY2RuanMuY2xvdWRmbGFyZS5jb20vYWpheC9saWJzL2pxdWVyeS8yLjEuNC9qcXVlcnkubWluLmpzJywgY2FsbGJhY2s6IEpRdWVyeVByb3ZpZGVyLmxvYWRlZH0sXG4gICAge3NyYzogJy8vY2RuanMuY2xvdWRmbGFyZS5jb20vYWpheC9saWJzL3JhY3RpdmUvMC43LjMvcmFjdGl2ZS5ydW50aW1lLm1pbi5qcyd9LFxuICAgIHtzcmM6IGJhc2VVcmwgKyAnL3N0YXRpYy93aWRnZXQtbmV3L2xpYi9yYW5neS1jb21waWxlZC5qcycsIGNhbGxiYWNrOiBSYW5neVByb3ZpZGVyLmxvYWRlZCwgYWJvdXRUb0xvYWQ6IFJhbmd5UHJvdmlkZXIuYWJvdXRUb0xvYWR9IC8vIFRPRE8gbWluaWZ5IGFuZCBob3N0IHRoaXMgc29tZXdoZXJlXG5dO1xuaWYgKGlzT2ZmbGluZSkge1xuICAgIC8vIFVzZSB0aGUgb2ZmbGluZSB2ZXJzaW9ucyBvZiB0aGUgbGlicmFyaWVzIGZvciBkZXZlbG9wbWVudC5cbiAgICBzY3JpcHRzID0gW1xuICAgICAgICB7c3JjOiBiYXNlVXJsICsgJy9zdGF0aWMvanMvY2RuL2pxdWVyeS8yLjEuNC9qcXVlcnkuanMnLCBjYWxsYmFjazogSlF1ZXJ5UHJvdmlkZXIubG9hZGVkfSxcbiAgICAgICAge3NyYzogYmFzZVVybCArICcvc3RhdGljL2pzL2Nkbi9yYWN0aXZlLzAuNy4zL3JhY3RpdmUucnVudGltZS5qcyd9LFxuICAgICAgICB7c3JjOiBiYXNlVXJsICsgJy9zdGF0aWMvd2lkZ2V0LW5ldy9saWIvcmFuZ3ktY29tcGlsZWQuanMnLCBjYWxsYmFjazogUmFuZ3lQcm92aWRlci5sb2FkZWQsIGFib3V0VG9Mb2FkOiBSYW5neVByb3ZpZGVyLmFib3V0VG9Mb2FkfVxuICAgIF07XG59XG5cbmZ1bmN0aW9uIGxvYWRBbGxTY3JpcHRzKGxvYWRlZENhbGxiYWNrKSB7XG4gICAgbG9hZFNjcmlwdHMoc2NyaXB0cywgbG9hZGVkQ2FsbGJhY2spO1xufVxuXG5mdW5jdGlvbiBsb2FkU2NyaXB0cyhzY3JpcHRzLCBsb2FkZWRDYWxsYmFjaykge1xuICAgIHZhciBsb2FkaW5nQ291bnQgPSBzY3JpcHRzLmxlbmd0aDtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNjcmlwdHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIHNjcmlwdCA9IHNjcmlwdHNbaV07XG4gICAgICAgIGlmIChzY3JpcHQuYWJvdXRUb0xvYWQpIHsgc2NyaXB0LmFib3V0VG9Mb2FkKCk7IH1cbiAgICAgICAgbG9hZFNjcmlwdChzY3JpcHQuc3JjLCBmdW5jdGlvbihzY3JpcHRDYWxsYmFjaykge1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmIChzY3JpcHRDYWxsYmFjaykgc2NyaXB0Q2FsbGJhY2soKTtcbiAgICAgICAgICAgICAgICBsb2FkaW5nQ291bnQgPSBsb2FkaW5nQ291bnQgLSAxO1xuICAgICAgICAgICAgICAgIGlmIChsb2FkaW5nQ291bnQgPT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAobG9hZGVkQ2FsbGJhY2spIGxvYWRlZENhbGxiYWNrKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSAoc2NyaXB0LmNhbGxiYWNrKSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBsb2FkU2NyaXB0KHNyYywgY2FsbGJhY2spIHtcbiAgICB2YXIgaGVhZCA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF07XG4gICAgaWYgKGhlYWQpIHtcbiAgICAgICAgdmFyIHNjcmlwdFRhZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuICAgICAgICBzY3JpcHRUYWcuc2V0QXR0cmlidXRlKCdzcmMnLCBzcmMpO1xuICAgICAgICBzY3JpcHRUYWcuc2V0QXR0cmlidXRlKCd0eXBlJywndGV4dC9qYXZhc2NyaXB0Jyk7XG5cbiAgICAgICAgaWYgKHNjcmlwdFRhZy5yZWFkeVN0YXRlKSB7IC8vIElFLCBpbmNsLiBJRTlcbiAgICAgICAgICAgIHNjcmlwdFRhZy5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBpZiAoc2NyaXB0VGFnLnJlYWR5U3RhdGUgPT0gXCJsb2FkZWRcIiB8fCBzY3JpcHRUYWcucmVhZHlTdGF0ZSA9PSBcImNvbXBsZXRlXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgc2NyaXB0VGFnLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjYWxsYmFjaykgeyBjYWxsYmFjaygpOyB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNjcmlwdFRhZy5vbmxvYWQgPSBmdW5jdGlvbigpIHsgLy8gT3RoZXIgYnJvd3NlcnNcbiAgICAgICAgICAgICAgICBpZiAoY2FsbGJhY2spIHsgY2FsbGJhY2soKTsgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIGhlYWQuYXBwZW5kQ2hpbGQoc2NyaXB0VGFnKTtcbiAgICB9XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBsb2FkOiBsb2FkQWxsU2NyaXB0c1xufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi91dGlscy9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciBSZWFjdGlvbnNXaWRnZXQgPSByZXF1aXJlKCcuL3JlYWN0aW9ucy13aWRnZXQnKTtcblxuZnVuY3Rpb24gY3JlYXRlU3VtbWFyeVdpZGdldChjb250YWluZXIsIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBkZWZhdWx0UmVhY3Rpb25zLCBncm91cFNldHRpbmdzKSB7XG4gICAgLy8vLyBUT0RPIHJlcGxhY2UgZWxlbWVudFxuICAgIHZhciByYWN0aXZlID0gUmFjdGl2ZSh7XG4gICAgICAgIGVsOiBjb250YWluZXIsXG4gICAgICAgIGRhdGE6IHBhZ2VEYXRhLFxuICAgICAgICBtYWdpYzogdHJ1ZSxcbiAgICAgICAgdGVtcGxhdGU6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9zdW1tYXJ5LXdpZGdldC5oYnMuaHRtbCcpXG4gICAgfSk7XG4gICAgcmFjdGl2ZS5vbignY29tcGxldGUnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgJChyb290RWxlbWVudChyYWN0aXZlKSkub24oJ21vdXNlZW50ZXInLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICBvcGVuUmVhY3Rpb25zV2luZG93KGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBkZWZhdWx0UmVhY3Rpb25zLCBncm91cFNldHRpbmdzLCByYWN0aXZlKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIHJvb3RFbGVtZW50KHJhY3RpdmUpIHtcbiAgICAvLyBUT0RPOiBnb3R0YSBiZSBhIGJldHRlciB3YXkgdG8gZ2V0IHRoaXNcbiAgICAvLyBUT0RPOiBvdXIgY2xpY2sgaGFuZGxlciBpcyBnZXR0aW5nIGNhbGxlZCB0d2ljZSwgc28gaXQgbG9va3MgbGlrZSB0aGlzIHNvbWVob3cgZ2V0cyB0aGUgd3JvbmcgZWxlbWVudCBpZiB0aGVyZSBhcmUgdHdvIHN1bW1hcnkgd2lkZ2V0cyB0b2dldGhlcj9cbiAgICByZXR1cm4gcmFjdGl2ZS5maW5kKCdkaXYnKTtcbn1cblxuZnVuY3Rpb24gb3BlblJlYWN0aW9uc1dpbmRvdyhjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgZGVmYXVsdFJlYWN0aW9ucywgZ3JvdXBTZXR0aW5ncywgcmFjdGl2ZSkge1xuICAgIGlmICghcmFjdGl2ZS5yZWFjdGlvbnNXaWRnZXQpIHtcbiAgICAgICAgcmFjdGl2ZS5yZWFjdGlvbnNXaWRnZXQgPSBSZWFjdGlvbnNXaWRnZXQuY3JlYXRlKHtcbiAgICAgICAgICAgIHJlYWN0aW9uc0RhdGE6IHBhZ2VEYXRhLnN1bW1hcnlSZWFjdGlvbnMsXG4gICAgICAgICAgICBjb250YWluZXJEYXRhOiBjb250YWluZXJEYXRhLFxuICAgICAgICAgICAgZGVmYXVsdFJlYWN0aW9uczogZGVmYXVsdFJlYWN0aW9ucyxcbiAgICAgICAgICAgIHBhZ2VEYXRhOiBwYWdlRGF0YSxcbiAgICAgICAgICAgIGdyb3VwU2V0dGluZ3M6IGdyb3VwU2V0dGluZ3NcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIC8vIFRPRE86IFVuY2xlYXIgaWYgaXQncyBzYWZlIHRvIGltbWVkaWF0ZWx5IHN0YXJ0IG1ha2luZyBjYWxscyBvbiB0aGUgcmFjdGl2ZSBpbnN0YW5jZSBhZnRlciBpdHMgaW5zdGFudGlhdGVkIG9yIGlmXG4gICAgLy8gICAgICAgd2UgbmVlZCB0byBzdHJ1Y3R1cmUgZXZlcnl0aGluZyB3aXRoIGNhbGxiYWNrcy9wcm9taXNlcy5cbiAgICByYWN0aXZlLnJlYWN0aW9uc1dpZGdldC5vcGVuKHJvb3RFbGVtZW50KHJhY3RpdmUpKTtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZTogY3JlYXRlU3VtbWFyeVdpZGdldFxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi91dGlscy9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciBQb3B1cFdpZGdldCA9IHJlcXVpcmUoJy4vcG9wdXAtd2lkZ2V0Jyk7XG52YXIgUmFuZ2UgPSByZXF1aXJlKCcuL3V0aWxzL3JhbmdlJyk7XG52YXIgUmVhY3Rpb25zV2lkZ2V0ID0gcmVxdWlyZSgnLi9yZWFjdGlvbnMtd2lkZ2V0Jyk7XG5cblxuZnVuY3Rpb24gY3JlYXRlUmVhY3RhYmxlVGV4dChvcHRpb25zKSB7XG4gICAgLy8gVE9ETzogaW1wb3NlIGFuIHVwcGVyIGxpbWl0IG9uIHRoZSBsZW5ndGggb2YgdGV4dCB0aGF0IGNhbiBiZSByZWFjdGVkIHRvPyAoYXBwbGllcyB0byB0aGUgaW5kaWNhdG9yLXdpZGdldCB0b28pXG4gICAgdmFyICRjb250YWluZXJFbGVtZW50ID0gb3B0aW9ucy5jb250YWluZXJFbGVtZW50O1xuICAgIHZhciBleGNsdWRlTm9kZSA9IG9wdGlvbnMuZXhjbHVkZU5vZGU7XG4gICAgdmFyIHJlYWN0aW9uc1dpZGdldE9wdGlvbnMgPSB7XG4gICAgICAgIHJlYWN0aW9uc0RhdGE6IFtdLCAvLyBBbHdheXMgb3BlbiB3aXRoIHRoZSBkZWZhdWx0IHJlYWN0aW9uc1xuICAgICAgICBjb250YWluZXJEYXRhOiBvcHRpb25zLmNvbnRhaW5lckRhdGEsXG4gICAgICAgIGNvbnRhaW5lckVsZW1lbnQ6ICRjb250YWluZXJFbGVtZW50LFxuICAgICAgICBkZWZhdWx0UmVhY3Rpb25zOiBvcHRpb25zLmRlZmF1bHRSZWFjdGlvbnMsXG4gICAgICAgIHBhZ2VEYXRhOiBvcHRpb25zLnBhZ2VEYXRhLFxuICAgICAgICBncm91cFNldHRpbmdzOiBvcHRpb25zLmdyb3VwU2V0dGluZ3NcbiAgICB9O1xuXG4gICAgJGNvbnRhaW5lckVsZW1lbnQub24oJ21vdXNldXAnLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICB2YXIgbm9kZSA9ICRjb250YWluZXJFbGVtZW50LmdldCgwKTtcbiAgICAgICAgdmFyIHBvaW50ID0gUmFuZ2UuZ2V0U2VsZWN0aW9uRW5kUG9pbnQobm9kZSwgZXZlbnQsIGV4Y2x1ZGVOb2RlKTtcbiAgICAgICAgaWYgKHBvaW50KSB7XG4gICAgICAgICAgICB2YXIgY29vcmRpbmF0ZXMgPSB7IHRvcDogcG9pbnQueSwgbGVmdDogcG9pbnQueCB9O1xuICAgICAgICAgICAgUG9wdXBXaWRnZXQuc2hvdyhjb29yZGluYXRlcywgZ3JhYlNlbGVjdGlvbkFuZE9wZW4obm9kZSwgY29vcmRpbmF0ZXMsIHJlYWN0aW9uc1dpZGdldE9wdGlvbnMsIGV4Y2x1ZGVOb2RlKSk7XG4gICAgICAgIH1cbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gZ3JhYlNlbGVjdGlvbkFuZE9wZW4obm9kZSwgY29vcmRpbmF0ZXMsIHJlYWN0aW9uc1dpZGdldE9wdGlvbnMsIGV4Y2x1ZGVOb2RlKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICBSYW5nZS5ncmFiU2VsZWN0aW9uKG5vZGUsIGZ1bmN0aW9uKHRleHQsIGxvY2F0aW9uKSB7XG4gICAgICAgICAgICAvLyBUT0RPOiBvcGVuIHRoZSByZWFjdGlvbiB3aWRnZXQgc2hvd2luZyB0aGUgZGVmYXVsdCByZWFjdGlvbnNcbiAgICAgICAgICAgIHJlYWN0aW9uc1dpZGdldE9wdGlvbnMubG9jYXRpb24gPSBsb2NhdGlvbjtcbiAgICAgICAgICAgIHJlYWN0aW9uc1dpZGdldE9wdGlvbnMuYm9keSA9IHRleHQ7XG4gICAgICAgICAgICB2YXIgcmVhY3Rpb25zV2lkZ2V0ID0gUmVhY3Rpb25zV2lkZ2V0LmNyZWF0ZShyZWFjdGlvbnNXaWRnZXRPcHRpb25zKTtcbiAgICAgICAgICAgIC8vIFRPRE86IGRvbid0IGxlYWsuIG5lZWQgdG8gZWl0aGVyIGNsZWFuIHVwIHRoZSByZWFjdGlvbnMgd2lkZ2V0cyB0aGF0IHdlIGNyZWF0ZSBvciByZXVzZS5cbiAgICAgICAgICAgIHJlYWN0aW9uc1dpZGdldC5vcGVuKGNvb3JkaW5hdGVzKTtcbiAgICAgICAgfSwgZXhjbHVkZU5vZGUpO1xuICAgIH1cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZVJlYWN0YWJsZVRleHQ6IGNyZWF0ZVJlYWN0YWJsZVRleHRcbn07IiwiLy8gVE9ETzogbmVlZHMgYSBiZXR0ZXIgbmFtZSBvbmNlIHRoZSBzY29wZSBpcyBjbGVhclxuXG52YXIgJDsgcmVxdWlyZSgnLi9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciBYRE1DbGllbnQgPSByZXF1aXJlKCcuL3hkbS1jbGllbnQnKTtcbnZhciBVUkxzID0gcmVxdWlyZSgnLi91cmxzJyk7XG5cbmZ1bmN0aW9uIHBvc3ROZXdQYWdlUmVhY3Rpb24oKSB7XG4gICAgLy8gc3BlY3VsYXRpdmUuLi5cbn1cblxuZnVuY3Rpb24gcG9zdE5ld1RleHRSZWFjdGlvbigpIHtcbiAgICAvLyBzcGVjdWxhdGl2ZS4uLlxufVxuXG5mdW5jdGlvbiBwb3N0TmV3SW1hZ2VSZWFjdGlvbigpIHtcbiAgICAvLyBzcGVjdWxhdGl2ZS4uLlxufVxuXG5mdW5jdGlvbiBwb3N0TmV3UmVhY3Rpb24ocmVhY3Rpb25EYXRhLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgY29udGVudExvY2F0aW9uLCBjb250ZW50Qm9keSwgY29udGVudFR5cGUsIHN1Y2Nlc3MsIGVycm9yKSB7XG4gICAgWERNQ2xpZW50LmdldFVzZXIoZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgdmFyIHVzZXJJbmZvID0gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgLy8gVE9ETyBleHRyYWN0IHRoZSBzaGFwZSBvZiB0aGlzIGRhdGEgYW5kIHBvc3NpYmx5IHRoZSB3aG9sZSBBUEkgY2FsbFxuICAgICAgICAvLyBUT0RPIGZpZ3VyZSBvdXQgd2hpY2ggcGFydHMgZG9uJ3QgZ2V0IHBhc3NlZCBmb3IgYSBuZXcgcmVhY3Rpb25cbiAgICAgICAgLy8gVE9ETyBjb21wdXRlIGZpZWxkIHZhbHVlcyAoZS5nLiBjb250YWluZXJfa2luZCBhbmQgY29udGVudCBpbmZvKSBmb3IgbmV3IHJlYWN0aW9uc1xuICAgICAgICB2YXIgZGF0YSA9IHtcbiAgICAgICAgICAgIHRhZzoge1xuICAgICAgICAgICAgICAgIGJvZHk6IHJlYWN0aW9uRGF0YS50ZXh0XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaXNfZGVmYXVsdDogJ3RydWUnLFxuICAgICAgICAgICAgaGFzaDogY29udGFpbmVyRGF0YS5oYXNoLFxuICAgICAgICAgICAgdXNlcl9pZDogdXNlckluZm8udXNlcl9pZCxcbiAgICAgICAgICAgIGFudF90b2tlbjogdXNlckluZm8uYW50X3Rva2VuLFxuICAgICAgICAgICAgcGFnZV9pZDogcGFnZURhdGEucGFnZUlkLFxuICAgICAgICAgICAgZ3JvdXBfaWQ6IHBhZ2VEYXRhLmdyb3VwSWQsXG4gICAgICAgICAgICBjb250YWluZXJfa2luZDogY29udGVudFR5cGUsIC8vIE9uZSBvZiAncGFnZScsICd0ZXh0JywgJ21lZGlhJywgJ2ltZydcbiAgICAgICAgICAgIGNvbnRlbnRfbm9kZV9kYXRhOiB7XG4gICAgICAgICAgICAgICAgbG9jYXRpb246IGNvbnRlbnRMb2NhdGlvbixcbiAgICAgICAgICAgICAgICBib2R5OiBjb250ZW50Qm9keSxcbiAgICAgICAgICAgICAgICBraW5kOiBjb250ZW50VHlwZSxcbiAgICAgICAgICAgICAgICBpdGVtX3R5cGU6ICcnIC8vIFRPRE86IGxvb2tzIHVudXNlZCBidXQgVGFnSGFuZGxlciBibG93cyB1cCB3aXRob3V0IGl0LiBDdXJyZW50IGNsaWVudCBwYXNzZXMgaW4gXCJwYWdlXCIgZm9yIHBhZ2UgcmVhY3Rpb25zLlxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBpZiAocmVhY3Rpb25EYXRhLmlkKSB7XG4gICAgICAgICAgICBkYXRhLnRhZy5pZCA9IHJlYWN0aW9uRGF0YS5pZDsgLy8gVE9ETyB0aGUgY3VycmVudCBjbGllbnQgc2VuZHMgXCItMTAxXCIgaWYgdGhlcmUncyBubyBpZC4gaXMgdGhpcyBuZWNlc3Nhcnk/XG4gICAgICAgIH1cbiAgICAgICAgJC5nZXRKU09OUChVUkxzLmNyZWF0ZVJlYWN0aW9uVXJsKCksIGRhdGEsIHN1Y2Nlc3MsIGVycm9yKTtcbiAgICAgICAgLy92YXIgcmVzcG9uc2UgPSB7IC8vIFRPRE86IGp1c3QgY2FwdHVyaW5nIHRoZSBhcGkgZm9ybWF0Li4uXG4gICAgICAgIC8vICAgICAgICBleGlzdGluZzoganNvbi5leGlzdGluZyxcbiAgICAgICAgLy8gICAgICAgIGludGVyYWN0aW9uOiB7XG4gICAgICAgIC8vICAgICAgICAgICAgaWQ6IGpzb24uaW50ZXJhY3Rpb24uaWQsXG4gICAgICAgIC8vICAgICAgICAgICAgaW50ZXJhY3Rpb25fbm9kZToge1xuICAgICAgICAvLyAgICAgICAgICAgICAgICBib2R5OiBqc29uLmludGVyYWN0aW9uLmludGVyYWN0aW9uX25vZGUuYm9keSxcbiAgICAgICAgLy8gICAgICAgICAgICAgICAgaWQ6IGpzb24uaW50ZXJhY3Rpb24uaW50ZXJhY3Rpb25fbm9kZS5pZFxuICAgICAgICAvLyAgICAgICAgICAgIH1cbiAgICAgICAgLy8gICAgICAgIH1cbiAgICAgICAgLy8gICAgfTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gcG9zdFBsdXNPbmUocmVhY3Rpb25EYXRhLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgc3VjY2VzcywgZXJyb3IpIHtcbiAgICBYRE1DbGllbnQuZ2V0VXNlcihmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICB2YXIgdXNlckluZm8gPSByZXNwb25zZS5kYXRhO1xuICAgICAgICAvLyBUT0RPIGV4dHJhY3QgdGhlIHNoYXBlIG9mIHRoaXMgZGF0YSBhbmQgcG9zc2libHkgdGhlIHdob2xlIEFQSSBjYWxsXG4gICAgICAgIC8vIFRPRE8gZmlndXJlIG91dCB3aGljaCBwYXJ0cyBkb24ndCBnZXQgcGFzc2VkIGZvciBhIG5ldyByZWFjdGlvblxuICAgICAgICAvLyBUT0RPIGNvbXB1dGUgZmllbGQgdmFsdWVzIChlLmcuIGNvbnRhaW5lcl9raW5kIGFuZCBjb250ZW50IGluZm8pIGZvciBuZXcgcmVhY3Rpb25zXG4gICAgICAgIGlmICghcmVhY3Rpb25EYXRhLmNvbnRlbnQpIHtcbiAgICAgICAgICAgIC8vIFRoaXMgaXMgYSBzdW1tYXJ5IHJlYWN0aW9uLiBTZWUgaWYgd2UgaGF2ZSBhbnkgY29udGFpbmVyIGRhdGEgdGhhdCB3ZSBjYW4gbGluayB0byBpdC5cbiAgICAgICAgICAgIHZhciBjb250YWluZXJSZWFjdGlvbnMgPSBjb250YWluZXJEYXRhLnJlYWN0aW9ucztcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY29udGFpbmVyUmVhY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNvbnRhaW5lclJlYWN0aW9uID0gY29udGFpbmVyUmVhY3Rpb25zW2ldO1xuICAgICAgICAgICAgICAgIGlmIChjb250YWluZXJSZWFjdGlvbi5pZCA9PT0gcmVhY3Rpb25EYXRhLmlkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlYWN0aW9uRGF0YS5wYXJlbnRJRCA9IGNvbnRhaW5lclJlYWN0aW9uLnBhcmVudElEO1xuICAgICAgICAgICAgICAgICAgICByZWFjdGlvbkRhdGEuY29udGVudCA9IGNvbnRhaW5lclJlYWN0aW9uLmNvbnRlbnQ7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB2YXIgZGF0YSA9IHtcbiAgICAgICAgICAgIHRhZzoge1xuICAgICAgICAgICAgICAgIGJvZHk6IHJlYWN0aW9uRGF0YS50ZXh0LFxuICAgICAgICAgICAgICAgIGlkOiByZWFjdGlvbkRhdGEuaWRcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpc19kZWZhdWx0OiAndHJ1ZScsIC8vIFRPRE8gY2hlY2sgaWYgdGhlIHJlYWN0aW9uIGlkL2JvZHkgbWF0Y2hlcyBhIGRlZmF1bHRcbiAgICAgICAgICAgIGhhc2g6IGNvbnRhaW5lckRhdGEuaGFzaCxcbiAgICAgICAgICAgIHVzZXJfaWQ6IHVzZXJJbmZvLnVzZXJfaWQsXG4gICAgICAgICAgICBhbnRfdG9rZW46IHVzZXJJbmZvLmFudF90b2tlbixcbiAgICAgICAgICAgIHBhZ2VfaWQ6IHBhZ2VEYXRhLnBhZ2VJZCxcbiAgICAgICAgICAgIGdyb3VwX2lkOiBwYWdlRGF0YS5ncm91cElkLFxuICAgICAgICAgICAgY29udGFpbmVyX2tpbmQ6IGNvbnRhaW5lckRhdGEudHlwZSwgLy8gJ3BhZ2UnLCAndGV4dCcsICdtZWRpYScsICdpbWcnXG4gICAgICAgICAgICBjb250ZW50X25vZGVfZGF0YToge1xuICAgICAgICAgICAgICAgIGJvZHk6ICcnLCAvLyBUT0RPOiBkbyB3ZSBuZWVkIHRoaXMgZm9yICsxcz9cbiAgICAgICAgICAgICAgICBraW5kOiBjb250YWluZXJEYXRhLnR5cGUsIC8vIFRPRE86IHJlc29sdmUgd2hldGhlciB0byB1c2UgdGhlIHNob3J0IG9yIGxvbmcgZm9ybSByZWFjdGlvbkRhdGEuY29udGVudC5raW5kLCAvLyAncGFnJywgJ3R4dCcsICdtZWQnLCAnaW1nJ1xuICAgICAgICAgICAgICAgIGl0ZW1fdHlwZTogJycgLy8gVE9ETzogbG9va3MgdW51c2VkIGJ1dCBUYWdIYW5kbGVyIGJsb3dzIHVwIHdpdGhvdXQgaXRcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgaWYgKHJlYWN0aW9uRGF0YS5jb250ZW50KSB7XG4gICAgICAgICAgICBkYXRhLmNvbnRlbnRfbm9kZV9kYXRhLmlkID0gcmVhY3Rpb25EYXRhLmNvbnRlbnQuaWQ7XG4gICAgICAgICAgICBkYXRhLmNvbnRlbnRfbm9kZV9kYXRhLmxvY2F0aW9uID0gcmVhY3Rpb25EYXRhLmNvbnRlbnQubG9jYXRpb247XG4gICAgICAgIH1cbiAgICAgICAgJC5nZXRKU09OUChVUkxzLmNyZWF0ZVJlYWN0aW9uVXJsKCksIGRhdGEsIHN1Y2Nlc3MsIGVycm9yKTtcbiAgICAgICAgLy92YXIgcmVzcG9uc2UgPSB7IC8vIFRPRE86IGp1c3QgY2FwdHVyaW5nIHRoZSBhcGkgZm9ybWF0Li4uXG4gICAgICAgIC8vICAgICAgICBleGlzdGluZzoganNvbi5leGlzdGluZyxcbiAgICAgICAgLy8gICAgICAgIGludGVyYWN0aW9uOiB7XG4gICAgICAgIC8vICAgICAgICAgICAgaWQ6IGpzb24uaW50ZXJhY3Rpb24uaWQsXG4gICAgICAgIC8vICAgICAgICAgICAgaW50ZXJhY3Rpb25fbm9kZToge1xuICAgICAgICAvLyAgICAgICAgICAgICAgICBib2R5OiBqc29uLmludGVyYWN0aW9uLmludGVyYWN0aW9uX25vZGUuYm9keSxcbiAgICAgICAgLy8gICAgICAgICAgICAgICAgaWQ6IGpzb24uaW50ZXJhY3Rpb24uaW50ZXJhY3Rpb25fbm9kZS5pZFxuICAgICAgICAvLyAgICAgICAgICAgIH1cbiAgICAgICAgLy8gICAgICAgIH1cbiAgICAgICAgLy8gICAgfTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gaXNEZWZhdWx0UmVhY3Rpb24ocmVhY3Rpb24sIGRlZmF1bHRSZWFjdGlvbnMpIHtcbiAgICAvLyBUT0RPIGNvbnNpZGVyIHRhZ2dpbmcgdGhlIHJlYWN0aW9uIGRhdGEgb24gcmVhZC9sb2FkIHJhdGhlciB0aGFuIG9uIHdyaXRlXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkZWZhdWx0UmVhY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChyZWFjdGlvbi5pZCAmJiBkZWZhdWx0UmVhY3Rpb25zW2ldLmlkICYmIHJlYWN0aW9uLmlkID09PSBkZWZhdWx0UmVhY3Rpb25zW2ldLmlkKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBwb3N0UGx1c09uZTogcG9zdFBsdXNPbmUsXG4gICAgcG9zdE5ld1JlYWN0aW9uOiBwb3N0TmV3UmVhY3Rpb25cbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgTUQ1ID0gcmVxdWlyZSgnLi9tZDUnKTtcblxuLy8gVE9ETzogVGhpcyBpcyBqdXN0IGNvcHkvcGFzdGVkIGZyb20gZW5nYWdlX2Z1bGxcbi8vIFRPRE86IFRoZSBjb2RlIGlzIGxvb2tpbmcgZm9yIC5hbnRfaW5kaWNhdG9yIHRvIHNlZSBpZiBpdCdzIGFscmVhZHkgYmVlbiBoYXNoZWQuIFJldmlldy5cbmZ1bmN0aW9uIGdldENsZWFuVGV4dCgkZG9tTm9kZSkge1xuICAgIC8vIEFOVC51dGlsLmdldENsZWFuVGV4dFxuICAgIC8vIGNvbW1vbiBmdW5jdGlvbiBmb3IgY2xlYW5pbmcgdGhlIHRleHQgbm9kZSB0ZXh0LiAgcmlnaHQgbm93LCBpdCdzIHJlbW92aW5nIHNwYWNlcywgdGFicywgbmV3bGluZXMsIGFuZCB0aGVuIGRvdWJsZSBzcGFjZXNcblxuICAgIHZhciAkbm9kZSA9ICRkb21Ob2RlLmNsb25lKCk7XG5cbiAgICAkbm9kZS5maW5kKCcuYW50LCAuYW50LWN1c3RvbS1jdGEtY29udGFpbmVyJykucmVtb3ZlKCk7XG5cbiAgICAvL21ha2Ugc3VyZSBpdCBkb2VzbnQgYWxyZWR5IGhhdmUgaW4gaW5kaWNhdG9yIC0gaXQgc2hvdWxkbid0LlxuICAgIHZhciAkaW5kaWNhdG9yID0gJG5vZGUuZmluZCgnLmFudF9pbmRpY2F0b3InKTtcbiAgICBpZigkaW5kaWNhdG9yLmxlbmd0aCl7XG4gICAgICAgIC8vdG9kbzogc2VuZCB1cyBhbiBlcnJvciByZXBvcnQgLSB0aGlzIG1heSBzdGlsbCBiZSBoYXBwZW5pbmcgZm9yIHNsaWRlc2hvd3MuXG4gICAgICAgIC8vVGhpcyBmaXggd29ya3MgZmluZSwgYnV0IHdlIHNob3VsZCBmaXggdGhlIGNvZGUgdG8gaGFuZGxlIGl0IGJlZm9yZSBoZXJlLlxuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gZ2V0IHRoZSBub2RlJ3MgdGV4dCBhbmQgc21hc2ggY2FzZVxuICAgIC8vIFRPRE86IDxicj4gdGFncyBhbmQgYmxvY2stbGV2ZWwgdGFncyBjYW4gc2NyZXcgdXAgd29yZHMuICBleDpcbiAgICAvLyBoZWxsbzxicj5ob3cgYXJlIHlvdT8gICBoZXJlIGJlY29tZXNcbiAgICAvLyBoZWxsb2hvdyBhcmUgeW91PyAgICA8LS0gbm8gc3BhY2Ugd2hlcmUgdGhlIDxicj4gd2FzLiAgYmFkLlxuICAgIHZhciBub2RlX3RleHQgPSAkLnRyaW0oICRub2RlLmh0bWwoKS5yZXBsYWNlKC88ICpiciAqXFwvPz4vZ2ksICcgJykgKTtcbiAgICB2YXIgYm9keSA9ICQudHJpbSggJCggXCI8ZGl2PlwiICsgbm9kZV90ZXh0ICsgXCI8L2Rpdj5cIiApLnRleHQoKS50b0xvd2VyQ2FzZSgpICk7XG5cbiAgICBpZiggYm9keSAmJiB0eXBlb2YgYm9keSA9PSBcInN0cmluZ1wiICYmIGJvZHkgIT09IFwiXCIgKSB7XG4gICAgICAgIHZhciBmaXJzdHBhc3MgPSBib2R5LnJlcGxhY2UoL1tcXG5cXHJcXHRdKy9naSwnICcpLnJlcGxhY2UoKS5yZXBsYWNlKC9cXHN7Mix9L2csJyAnKTtcbiAgICAgICAgLy8gc2VlaW5nIGlmIHRoaXMgaGVscHMgdGhlIHByb3B1YiBpc3N1ZSAtIHRvIHRyaW0gYWdhaW4uICBXaGVuIGkgcnVuIHRoaXMgbGluZSBhYm92ZSBpdCBsb29rcyBsaWtlIHRoZXJlIGlzIHN0aWxsIHdoaXRlIHNwYWNlLlxuICAgICAgICByZXR1cm4gJC50cmltKGZpcnN0cGFzcyk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBoYXNoVGV4dChlbGVtZW50KSB7XG4gICAgLy8gVE9ETzogSGFuZGxlIHRoZSBjYXNlIHdoZXJlIG11bHRpcGxlIGluc3RhbmNlcyBvZiB0aGUgc2FtZSB0ZXh0IGFwcGVhciBvbiB0aGUgcGFnZS4gTmVlZCB0byBhZGQgYW4gaW5jcmVtZW50IHRvXG4gICAgLy8gdGhlIGhhc2hUZXh0LiAoVGhpcyBjaGVjayBoYXMgdG8gYmUgc2NvcGVkIHRvIGEgcG9zdClcbiAgICB2YXIgdGV4dCA9IGdldENsZWFuVGV4dChlbGVtZW50KTtcbiAgICB2YXIgaGFzaFRleHQgPSBcInJkci10ZXh0LVwiK3RleHQ7XG4gICAgcmV0dXJuIE1ENS5oZXhfbWQ1KGhhc2hUZXh0KTtcbn1cblxuZnVuY3Rpb24gaGFzaFVybCh1cmwpIHtcbiAgICByZXR1cm4gTUQ1LmhleF9tZDUodXJsKTtcbn1cblxuZnVuY3Rpb24gaGFzaEltYWdlKGVsZW1lbnQpIHtcblxufVxuXG5mdW5jdGlvbiBoYXNoTWVkaWEoZWxlbWVudCkge1xuXG59XG5cbmZ1bmN0aW9uIGhhc2hFbGVtZW50KGVsZW1lbnQpIHtcbiAgICAvLyBUT0RPIG1ha2UgcmVhbFxuICAgIHJldHVybiAnYWJjJztcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGhhc2hUZXh0OiBoYXNoVGV4dCxcbiAgICBoYXNoVXJsOiBoYXNoVXJsXG59OyIsInZhciBVUkxzID0gcmVxdWlyZSgnLi91cmxzJyk7XG5cbnZhciBsb2FkZWRqUXVlcnk7XG52YXIgY2FsbGJhY2tzID0gW107XG5cbi8vIE5vdGlmaWVzIHRoZSBqUXVlcnkgcHJvdmlkZXIgdGhhdCB3ZSd2ZSBsb2FkZWQgdGhlIGpRdWVyeSBsaWJyYXJ5LlxuZnVuY3Rpb24gbG9hZGVkKCkge1xuICAgIGxvYWRlZGpRdWVyeSA9IGpRdWVyeS5ub0NvbmZsaWN0KCk7XG4gICAgLy8gQWRkIG91ciBjdXN0b20gSlNPTlAgZnVuY3Rpb25cbiAgICBsb2FkZWRqUXVlcnkuZ2V0SlNPTlAgPSBmdW5jdGlvbih1cmwsIGRhdGEsIHN1Y2Nlc3MsIGVycm9yKSB7XG4gICAgICAgIHZhciBvcHRpb25zID0ge1xuICAgICAgICAgICAgdXJsOiBVUkxzLmFudGVubmFIb21lKCkgKyB1cmwsXG4gICAgICAgICAgICB0eXBlOiBcImdldFwiLFxuICAgICAgICAgICAgY29udGVudFR5cGU6IFwiYXBwbGljYXRpb24vanNvblwiLFxuICAgICAgICAgICAgZGF0YVR5cGU6IFwianNvbnBcIixcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uKHJlc3BvbnNlLCB0ZXh0U3RhdHVzLCBYSFIpIHtcbiAgICAgICAgICAgICAgICAvLyBUT0RPOiBSZXZpc2l0IHdoZXRoZXIgaXQncyByZWFsbHkgY29vbCB0byBrZXkgdGhpcyBvbiB0aGUgdGV4dFN0YXR1cyBvciBpZiB3ZSBzaG91bGQgYmUgbG9va2luZyBhdFxuICAgICAgICAgICAgICAgIC8vICAgICAgIHRoZSBzdGF0dXMgY29kZSBpbiB0aGUgWEhSXG4gICAgICAgICAgICAgICAgLy8gTm90ZTogVGhlIHNlcnZlciBjb21lcyBiYWNrIHdpdGggMjAwIHJlc3BvbnNlcyB3aXRoIGEgbmVzdGVkIHN0YXR1cyBvZiBcImZhaWxcIi4uLlxuICAgICAgICAgICAgICAgIGlmICh0ZXh0U3RhdHVzID09PSAnc3VjY2VzcycgJiYgcmVzcG9uc2Uuc3RhdHVzICE9PSAnZmFpbCcpIHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzcyhyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBGb3IgSlNPTlAgcmVxdWVzdHMsIGpRdWVyeSBkb2Vzbid0IGNhbGwgaXQncyBlcnJvciBjYWxsYmFjay4gSXQgY2FsbHMgc3VjY2VzcyBpbnN0ZWFkLlxuICAgICAgICAgICAgICAgICAgICBlcnJvcihyZXNwb25zZS5tZXNzYWdlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIGlmIChkYXRhKSB7XG4gICAgICAgICAgICBvcHRpb25zLmRhdGEgPSB7IGpzb246IEpTT04uc3RyaW5naWZ5KGRhdGEpIH07XG4gICAgICAgIH1cbiAgICAgICAgbG9hZGVkalF1ZXJ5LmFqYXgob3B0aW9ucyk7XG4gICAgfTtcbiAgICBub3RpZnlDYWxsYmFja3MoKTtcbn1cblxuZnVuY3Rpb24gbm90aWZ5Q2FsbGJhY2tzKCkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2FsbGJhY2tzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNhbGxiYWNrc1tpXShsb2FkZWRqUXVlcnkpO1xuICAgIH1cbiAgICBjYWxsYmFja3MgPSBbXTtcbn1cblxuLy8gUmVnaXN0ZXJzIHRoZSBnaXZlbiBjYWxsYmFjayB0byBiZSBub3RpZmllZCB3aGVuIG91ciB2ZXJzaW9uIG9mIGpRdWVyeSBpcyBsb2FkZWQuXG5mdW5jdGlvbiBvbkxvYWQoY2FsbGJhY2spIHtcbiAgICBpZiAobG9hZGVkalF1ZXJ5KSB7XG4gICAgICAgIGNhbGxiYWNrKGxvYWRlZGpRdWVyeSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgY2FsbGJhY2tzLnB1c2goY2FsbGJhY2spO1xuICAgIH1cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGxvYWRlZDogbG9hZGVkLFxuICAgIG9uTG9hZDogb25Mb2FkXG59OyIsIlxuLy8gVE9ETzogVGhpcyBjb2RlIGlzIGp1c3QgY29waWVkIGZyb20gZW5nYWdlX2Z1bGwuanMuIFJldmlldyB3aGV0aGVyIHdlIHdhbnQgdG8ga2VlcCBpdCBhcy1pcy5cblxudmFyIEFOVCA9IHtcbiAgICB1dGlsOiB7XG4gICAgICAgIG1kNToge1xuICAgICAgICAgICAgaGV4Y2FzZTowLFxuICAgICAgICAgICAgYjY0cGFkOlwiXCIsXG4gICAgICAgICAgICBjaHJzejo4LFxuICAgICAgICAgICAgaGV4X21kNTogZnVuY3Rpb24ocyl7cmV0dXJuIEFOVC51dGlsLm1kNS5iaW5sMmhleChBTlQudXRpbC5tZDUuY29yZV9tZDUoQU5ULnV0aWwubWQ1LnN0cjJiaW5sKHMpLHMubGVuZ3RoKkFOVC51dGlsLm1kNS5jaHJzeikpO30sXG4gICAgICAgICAgICBjb3JlX21kNTogZnVuY3Rpb24oeCxsZW4pe3hbbGVuPj41XXw9MHg4MDw8KChsZW4pJTMyKTt4WygoKGxlbis2NCk+Pj45KTw8NCkrMTRdPWxlbjt2YXIgYT0xNzMyNTg0MTkzO3ZhciBiPS0yNzE3MzM4Nzk7dmFyIGM9LTE3MzI1ODQxOTQ7dmFyIGQ9MjcxNzMzODc4O2Zvcih2YXIgaT0wO2k8eC5sZW5ndGg7aSs9MTYpe3ZhciBvbGRhPWE7dmFyIG9sZGI9Yjt2YXIgb2xkYz1jO3ZhciBvbGRkPWQ7YT1BTlQudXRpbC5tZDUubWQ1X2ZmKGEsYixjLGQseFtpKzBdLDcsLTY4MDg3NjkzNik7ZD1BTlQudXRpbC5tZDUubWQ1X2ZmKGQsYSxiLGMseFtpKzFdLDEyLC0zODk1NjQ1ODYpO2M9QU5ULnV0aWwubWQ1Lm1kNV9mZihjLGQsYSxiLHhbaSsyXSwxNyw2MDYxMDU4MTkpO2I9QU5ULnV0aWwubWQ1Lm1kNV9mZihiLGMsZCxhLHhbaSszXSwyMiwtMTA0NDUyNTMzMCk7YT1BTlQudXRpbC5tZDUubWQ1X2ZmKGEsYixjLGQseFtpKzRdLDcsLTE3NjQxODg5Nyk7ZD1BTlQudXRpbC5tZDUubWQ1X2ZmKGQsYSxiLGMseFtpKzVdLDEyLDEyMDAwODA0MjYpO2M9QU5ULnV0aWwubWQ1Lm1kNV9mZihjLGQsYSxiLHhbaSs2XSwxNywtMTQ3MzIzMTM0MSk7Yj1BTlQudXRpbC5tZDUubWQ1X2ZmKGIsYyxkLGEseFtpKzddLDIyLC00NTcwNTk4Myk7YT1BTlQudXRpbC5tZDUubWQ1X2ZmKGEsYixjLGQseFtpKzhdLDcsMTc3MDAzNTQxNik7ZD1BTlQudXRpbC5tZDUubWQ1X2ZmKGQsYSxiLGMseFtpKzldLDEyLC0xOTU4NDE0NDE3KTtjPUFOVC51dGlsLm1kNS5tZDVfZmYoYyxkLGEsYix4W2krMTBdLDE3LC00MjA2Myk7Yj1BTlQudXRpbC5tZDUubWQ1X2ZmKGIsYyxkLGEseFtpKzExXSwyMiwtMTk5MDQwNDE2Mik7YT1BTlQudXRpbC5tZDUubWQ1X2ZmKGEsYixjLGQseFtpKzEyXSw3LDE4MDQ2MDM2ODIpO2Q9QU5ULnV0aWwubWQ1Lm1kNV9mZihkLGEsYixjLHhbaSsxM10sMTIsLTQwMzQxMTAxKTtjPUFOVC51dGlsLm1kNS5tZDVfZmYoYyxkLGEsYix4W2krMTRdLDE3LC0xNTAyMDAyMjkwKTtiPUFOVC51dGlsLm1kNS5tZDVfZmYoYixjLGQsYSx4W2krMTVdLDIyLDEyMzY1MzUzMjkpO2E9QU5ULnV0aWwubWQ1Lm1kNV9nZyhhLGIsYyxkLHhbaSsxXSw1LC0xNjU3OTY1MTApO2Q9QU5ULnV0aWwubWQ1Lm1kNV9nZyhkLGEsYixjLHhbaSs2XSw5LC0xMDY5NTAxNjMyKTtjPUFOVC51dGlsLm1kNS5tZDVfZ2coYyxkLGEsYix4W2krMTFdLDE0LDY0MzcxNzcxMyk7Yj1BTlQudXRpbC5tZDUubWQ1X2dnKGIsYyxkLGEseFtpKzBdLDIwLC0zNzM4OTczMDIpO2E9QU5ULnV0aWwubWQ1Lm1kNV9nZyhhLGIsYyxkLHhbaSs1XSw1LC03MDE1NTg2OTEpO2Q9QU5ULnV0aWwubWQ1Lm1kNV9nZyhkLGEsYixjLHhbaSsxMF0sOSwzODAxNjA4Myk7Yz1BTlQudXRpbC5tZDUubWQ1X2dnKGMsZCxhLGIseFtpKzE1XSwxNCwtNjYwNDc4MzM1KTtiPUFOVC51dGlsLm1kNS5tZDVfZ2coYixjLGQsYSx4W2krNF0sMjAsLTQwNTUzNzg0OCk7YT1BTlQudXRpbC5tZDUubWQ1X2dnKGEsYixjLGQseFtpKzldLDUsNTY4NDQ2NDM4KTtkPUFOVC51dGlsLm1kNS5tZDVfZ2coZCxhLGIsYyx4W2krMTRdLDksLTEwMTk4MDM2OTApO2M9QU5ULnV0aWwubWQ1Lm1kNV9nZyhjLGQsYSxiLHhbaSszXSwxNCwtMTg3MzYzOTYxKTtiPUFOVC51dGlsLm1kNS5tZDVfZ2coYixjLGQsYSx4W2krOF0sMjAsMTE2MzUzMTUwMSk7YT1BTlQudXRpbC5tZDUubWQ1X2dnKGEsYixjLGQseFtpKzEzXSw1LC0xNDQ0NjgxNDY3KTtkPUFOVC51dGlsLm1kNS5tZDVfZ2coZCxhLGIsYyx4W2krMl0sOSwtNTE0MDM3ODQpO2M9QU5ULnV0aWwubWQ1Lm1kNV9nZyhjLGQsYSxiLHhbaSs3XSwxNCwxNzM1MzI4NDczKTtiPUFOVC51dGlsLm1kNS5tZDVfZ2coYixjLGQsYSx4W2krMTJdLDIwLC0xOTI2NjA3NzM0KTthPUFOVC51dGlsLm1kNS5tZDVfaGgoYSxiLGMsZCx4W2krNV0sNCwtMzc4NTU4KTtkPUFOVC51dGlsLm1kNS5tZDVfaGgoZCxhLGIsYyx4W2krOF0sMTEsLTIwMjI1NzQ0NjMpO2M9QU5ULnV0aWwubWQ1Lm1kNV9oaChjLGQsYSxiLHhbaSsxMV0sMTYsMTgzOTAzMDU2Mik7Yj1BTlQudXRpbC5tZDUubWQ1X2hoKGIsYyxkLGEseFtpKzE0XSwyMywtMzUzMDk1NTYpO2E9QU5ULnV0aWwubWQ1Lm1kNV9oaChhLGIsYyxkLHhbaSsxXSw0LC0xNTMwOTkyMDYwKTtkPUFOVC51dGlsLm1kNS5tZDVfaGgoZCxhLGIsYyx4W2krNF0sMTEsMTI3Mjg5MzM1Myk7Yz1BTlQudXRpbC5tZDUubWQ1X2hoKGMsZCxhLGIseFtpKzddLDE2LC0xNTU0OTc2MzIpO2I9QU5ULnV0aWwubWQ1Lm1kNV9oaChiLGMsZCxhLHhbaSsxMF0sMjMsLTEwOTQ3MzA2NDApO2E9QU5ULnV0aWwubWQ1Lm1kNV9oaChhLGIsYyxkLHhbaSsxM10sNCw2ODEyNzkxNzQpO2Q9QU5ULnV0aWwubWQ1Lm1kNV9oaChkLGEsYixjLHhbaSswXSwxMSwtMzU4NTM3MjIyKTtjPUFOVC51dGlsLm1kNS5tZDVfaGgoYyxkLGEsYix4W2krM10sMTYsLTcyMjUyMTk3OSk7Yj1BTlQudXRpbC5tZDUubWQ1X2hoKGIsYyxkLGEseFtpKzZdLDIzLDc2MDI5MTg5KTthPUFOVC51dGlsLm1kNS5tZDVfaGgoYSxiLGMsZCx4W2krOV0sNCwtNjQwMzY0NDg3KTtkPUFOVC51dGlsLm1kNS5tZDVfaGgoZCxhLGIsYyx4W2krMTJdLDExLC00MjE4MTU4MzUpO2M9QU5ULnV0aWwubWQ1Lm1kNV9oaChjLGQsYSxiLHhbaSsxNV0sMTYsNTMwNzQyNTIwKTtiPUFOVC51dGlsLm1kNS5tZDVfaGgoYixjLGQsYSx4W2krMl0sMjMsLTk5NTMzODY1MSk7YT1BTlQudXRpbC5tZDUubWQ1X2lpKGEsYixjLGQseFtpKzBdLDYsLTE5ODYzMDg0NCk7ZD1BTlQudXRpbC5tZDUubWQ1X2lpKGQsYSxiLGMseFtpKzddLDEwLDExMjY4OTE0MTUpO2M9QU5ULnV0aWwubWQ1Lm1kNV9paShjLGQsYSxiLHhbaSsxNF0sMTUsLTE0MTYzNTQ5MDUpO2I9QU5ULnV0aWwubWQ1Lm1kNV9paShiLGMsZCxhLHhbaSs1XSwyMSwtNTc0MzQwNTUpO2E9QU5ULnV0aWwubWQ1Lm1kNV9paShhLGIsYyxkLHhbaSsxMl0sNiwxNzAwNDg1NTcxKTtkPUFOVC51dGlsLm1kNS5tZDVfaWkoZCxhLGIsYyx4W2krM10sMTAsLTE4OTQ5ODY2MDYpO2M9QU5ULnV0aWwubWQ1Lm1kNV9paShjLGQsYSxiLHhbaSsxMF0sMTUsLTEwNTE1MjMpO2I9QU5ULnV0aWwubWQ1Lm1kNV9paShiLGMsZCxhLHhbaSsxXSwyMSwtMjA1NDkyMjc5OSk7YT1BTlQudXRpbC5tZDUubWQ1X2lpKGEsYixjLGQseFtpKzhdLDYsMTg3MzMxMzM1OSk7ZD1BTlQudXRpbC5tZDUubWQ1X2lpKGQsYSxiLGMseFtpKzE1XSwxMCwtMzA2MTE3NDQpO2M9QU5ULnV0aWwubWQ1Lm1kNV9paShjLGQsYSxiLHhbaSs2XSwxNSwtMTU2MDE5ODM4MCk7Yj1BTlQudXRpbC5tZDUubWQ1X2lpKGIsYyxkLGEseFtpKzEzXSwyMSwxMzA5MTUxNjQ5KTthPUFOVC51dGlsLm1kNS5tZDVfaWkoYSxiLGMsZCx4W2krNF0sNiwtMTQ1NTIzMDcwKTtkPUFOVC51dGlsLm1kNS5tZDVfaWkoZCxhLGIsYyx4W2krMTFdLDEwLC0xMTIwMjEwMzc5KTtjPUFOVC51dGlsLm1kNS5tZDVfaWkoYyxkLGEsYix4W2krMl0sMTUsNzE4Nzg3MjU5KTtiPUFOVC51dGlsLm1kNS5tZDVfaWkoYixjLGQsYSx4W2krOV0sMjEsLTM0MzQ4NTU1MSk7YT1BTlQudXRpbC5tZDUuc2FmZV9hZGQoYSxvbGRhKTtiPUFOVC51dGlsLm1kNS5zYWZlX2FkZChiLG9sZGIpO2M9QU5ULnV0aWwubWQ1LnNhZmVfYWRkKGMsb2xkYyk7ZD1BTlQudXRpbC5tZDUuc2FmZV9hZGQoZCxvbGRkKTt9IHJldHVybiBBcnJheShhLGIsYyxkKTt9LFxuICAgICAgICAgICAgbWQ1X2NtbjogZnVuY3Rpb24ocSxhLGIseCxzLHQpe3JldHVybiBBTlQudXRpbC5tZDUuc2FmZV9hZGQoQU5ULnV0aWwubWQ1LmJpdF9yb2woQU5ULnV0aWwubWQ1LnNhZmVfYWRkKEFOVC51dGlsLm1kNS5zYWZlX2FkZChhLHEpLEFOVC51dGlsLm1kNS5zYWZlX2FkZCh4LHQpKSxzKSxiKTt9LFxuICAgICAgICAgICAgbWQ1X2ZmOiBmdW5jdGlvbihhLGIsYyxkLHgscyx0KXtyZXR1cm4gQU5ULnV0aWwubWQ1Lm1kNV9jbW4oKGImYyl8KCh+YikmZCksYSxiLHgscyx0KTt9LFxuICAgICAgICAgICAgbWQ1X2dnOiBmdW5jdGlvbihhLGIsYyxkLHgscyx0KXtyZXR1cm4gQU5ULnV0aWwubWQ1Lm1kNV9jbW4oKGImZCl8KGMmKH5kKSksYSxiLHgscyx0KTt9LFxuICAgICAgICAgICAgbWQ1X2hoOiBmdW5jdGlvbihhLGIsYyxkLHgscyx0KXtyZXR1cm4gQU5ULnV0aWwubWQ1Lm1kNV9jbW4oYl5jXmQsYSxiLHgscyx0KTt9LFxuICAgICAgICAgICAgbWQ1X2lpOiBmdW5jdGlvbihhLGIsYyxkLHgscyx0KXtyZXR1cm4gQU5ULnV0aWwubWQ1Lm1kNV9jbW4oY14oYnwofmQpKSxhLGIseCxzLHQpO30sXG4gICAgICAgICAgICBzYWZlX2FkZDogZnVuY3Rpb24oeCx5KXt2YXIgbHN3PSh4JjB4RkZGRikrKHkmMHhGRkZGKTt2YXIgbXN3PSh4Pj4xNikrKHk+PjE2KSsobHN3Pj4xNik7cmV0dXJuKG1zdzw8MTYpfChsc3cmMHhGRkZGKTt9LFxuICAgICAgICAgICAgYml0X3JvbDogZnVuY3Rpb24obnVtLGNudCl7cmV0dXJuKG51bTw8Y250KXwobnVtPj4+KDMyLWNudCkpO30sXG4gICAgICAgICAgICAvL3RoZSBsaW5lIGJlbG93IGlzIGNhbGxlZCBvdXQgYnkganNMaW50IGJlY2F1c2UgaXQgdXNlcyBBcnJheSgpIGluc3RlYWQgb2YgW10uICBXZSBjYW4gaWdub3JlLCBvciBJJ20gc3VyZSB3ZSBjb3VsZCBjaGFuZ2UgaXQgaWYgd2Ugd2FudGVkIHRvLlxuICAgICAgICAgICAgc3RyMmJpbmw6IGZ1bmN0aW9uKHN0cil7dmFyIGJpbj1BcnJheSgpO3ZhciBtYXNrPSgxPDxBTlQudXRpbC5tZDUuY2hyc3opLTE7Zm9yKHZhciBpPTA7aTxzdHIubGVuZ3RoKkFOVC51dGlsLm1kNS5jaHJzejtpKz1BTlQudXRpbC5tZDUuY2hyc3ope2JpbltpPj41XXw9KHN0ci5jaGFyQ29kZUF0KGkvQU5ULnV0aWwubWQ1LmNocnN6KSZtYXNrKTw8KGklMzIpO31yZXR1cm4gYmluO30sXG4gICAgICAgICAgICBiaW5sMmhleDogZnVuY3Rpb24oYmluYXJyYXkpe3ZhciBoZXhfdGFiPUFOVC51dGlsLm1kNS5oZXhjYXNlP1wiMDEyMzQ1Njc4OUFCQ0RFRlwiOlwiMDEyMzQ1Njc4OWFiY2RlZlwiO3ZhciBzdHI9XCJcIjtmb3IodmFyIGk9MDtpPGJpbmFycmF5Lmxlbmd0aCo0O2krKyl7c3RyKz1oZXhfdGFiLmNoYXJBdCgoYmluYXJyYXlbaT4+Ml0+PigoaSU0KSo4KzQpKSYweEYpK2hleF90YWIuY2hhckF0KChiaW5hcnJheVtpPj4yXT4+KChpJTQpKjgpKSYweEYpO30gcmV0dXJuIHN0cjt9XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgaGV4X21kNTogQU5ULnV0aWwubWQ1LmhleF9tZDVcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG5cbmZ1bmN0aW9uIG1ha2VNb3ZlYWJsZSgkZWxlbWVudCwgJGRyYWdIYW5kbGUpIHtcbiAgICAkZHJhZ0hhbmRsZS5vbignbW91c2Vkb3duLmFudGVubmEnLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICB2YXIgb2Zmc2V0WCA9IGV2ZW50LnBhZ2VYIC0gJGRyYWdIYW5kbGUub2Zmc2V0KCkubGVmdDtcbiAgICAgICAgdmFyIG9mZnNldFkgPSBldmVudC5wYWdlWSAtICRkcmFnSGFuZGxlLm9mZnNldCgpLnRvcDtcbiAgICAgICAgJChkb2N1bWVudCkub24oJ21vdXNldXAuYW50ZW5uYScsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICAkKGRvY3VtZW50KS5vZmYoJ21vdXNlbW92ZS5hbnRlbm5hJyk7XG4gICAgICAgIH0pO1xuICAgICAgICAkKGRvY3VtZW50KS5vbignbW91c2Vtb3ZlLmFudGVubmEnLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgJGVsZW1lbnQuY3NzKHtcbiAgICAgICAgICAgICAgICB0b3A6IGV2ZW50LnBhZ2VZIC0gb2Zmc2V0WSxcbiAgICAgICAgICAgICAgICBsZWZ0OiBldmVudC5wYWdlWCAtIG9mZnNldFhcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgbWFrZU1vdmVhYmxlOiBtYWtlTW92ZWFibGVcbn07IiwiXG52YXIgb2ZmbGluZTtcblxuZnVuY3Rpb24gaXNPZmZsaW5lKCkge1xuICAgIGlmIChvZmZsaW5lID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgLy8gVE9ETzogRG8gc29tZXRoaW5nIGNyb3NzLWJyb3dzZXIgaGVyZS4gVGhpcyB3b24ndCB3b3JrIGluIElFLlxuICAgICAgICAvLyBUT0RPOiBNYWtlIHRoaXMgbW9yZSBmbGV4aWJsZSBzbyBpdCB3b3JrcyBpbiBldmVyeW9uZSdzIGRldiBlbnZpcm9ubWVudFxuICAgICAgICBvZmZsaW5lID0gZG9jdW1lbnQuY3VycmVudFNjcmlwdC5zcmMgPT09ICdodHRwOi8vbG9jYWxob3N0OjgwODEvc3RhdGljL3dpZGdldC1uZXcvZGVidWcvYW50ZW5uYS5qcyc7XG4gICAgfVxuICAgIHJldHVybiBvZmZsaW5lO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzT2ZmbGluZSgpOyIsInZhciAkOyByZXF1aXJlKCcuL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xuXG4vLyBUT0RPIGNvcGllZCBmcm9tIGVuZ2FnZV9mdWxsLiBSZXZpZXcuXG5mdW5jdGlvbiBjb21wdXRlUGFnZVVybChncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIHBhZ2VfdXJsID0gJC50cmltKCB3aW5kb3cubG9jYXRpb24uaHJlZi5zcGxpdCgnIycpWzBdICkudG9Mb3dlckNhc2UoKTsgLy8gVE9ETyBzaG91bGQgcGFzcyB0aGlzIGluIGluc3RlYWQgb2YgcmVjb21wdXRpbmdcbiAgICByZXR1cm4gcmVtb3ZlU3ViZG9tYWluRnJvbVBhZ2VVcmwocGFnZV91cmwsIGdyb3VwU2V0dGluZ3MpO1xufVxuXG4vLyBUT0RPIGNvcGllZCBmcm9tIGVuZ2FnZV9mdWxsLiBSZXZpZXcuXG5mdW5jdGlvbiBjb21wdXRlVG9wTGV2ZWxDYW5vbmljYWxVcmwoZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBwYWdlX3VybCA9ICQudHJpbSggd2luZG93LmxvY2F0aW9uLmhyZWYuc3BsaXQoJyMnKVswXSApLnRvTG93ZXJDYXNlKCk7IC8vIFRPRE8gc2hvdWxkIHBhc3MgdGhpcyBpbiBpbnN0ZWFkIG9mIHJlY29tcHV0aW5nXG4gICAgdmFyIGNhbm9uaWNhbF91cmwgPSAoICQoJ2xpbmtbcmVsPVwiY2Fub25pY2FsXCJdJykubGVuZ3RoID4gMCApID9cbiAgICAgICAgICAgICAgICAkKCdsaW5rW3JlbD1cImNhbm9uaWNhbFwiXScpLmF0dHIoJ2hyZWYnKSA6IHBhZ2VfdXJsO1xuXG4gICAgLy8gYW50OnVybCBvdmVycmlkZXNcbiAgICBpZiAoICQoJ1twcm9wZXJ0eT1cImFudGVubmE6dXJsXCJdJykubGVuZ3RoID4gMCApIHtcbiAgICAgICAgY2Fub25pY2FsX3VybCA9ICQoJ1twcm9wZXJ0eT1cImFudGVubmE6dXJsXCJdJykuYXR0cignY29udGVudCcpO1xuICAgIH1cblxuICAgIGNhbm9uaWNhbF91cmwgPSAkLnRyaW0oIGNhbm9uaWNhbF91cmwudG9Mb3dlckNhc2UoKSApO1xuXG4gICAgaWYgKGNhbm9uaWNhbF91cmwgPT0gY29tcHV0ZVBhZ2VVcmwoZ3JvdXBTZXR0aW5ncykgKSB7IC8vIFRPRE8gc2hvdWxkIHBhc3MgdGhpcyBpbiBpbnN0ZWFkIG9mIHJlY29tcHV0aW5nXG4gICAgICAgIGNhbm9uaWNhbF91cmwgPSBcInNhbWVcIjtcbiAgICB9XG5cbiAgICAvLyBmYXN0Y28gZml4IChzaW5jZSB0aGV5IHNvbWV0aW1lcyByZXdyaXRlIHRoZWlyIGNhbm9uaWNhbCB0byBzaW1wbHkgYmUgdGhlaXIgVExELilcbiAgICAvLyBpbiB0aGUgY2FzZSB3aGVyZSBjYW5vbmljYWwgY2xhaW1zIFRMRCBidXQgd2UncmUgYWN0dWFsbHkgb24gYW4gYXJ0aWNsZS4uLiBzZXQgY2Fub25pY2FsIHRvIGJlIHRoZSBwYWdlX3VybFxuICAgIHZhciB0bGQgPSAkLnRyaW0od2luZG93LmxvY2F0aW9uLnByb3RvY29sKycvLycrd2luZG93LmxvY2F0aW9uLmhvc3RuYW1lKycvJykudG9Mb3dlckNhc2UoKTtcbiAgICBpZiAoIGNhbm9uaWNhbF91cmwgPT0gdGxkICkge1xuICAgICAgICBpZiAocGFnZV91cmwgIT0gdGxkKSB7XG4gICAgICAgICAgICBjYW5vbmljYWxfdXJsID0gcGFnZV91cmw7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcmVtb3ZlU3ViZG9tYWluRnJvbVBhZ2VVcmwoJC50cmltKGNhbm9uaWNhbF91cmwpLCBncm91cFNldHRpbmdzKTtcbn1cblxuZnVuY3Rpb24gY29tcHV0ZVBhZ2VFbGVtZW50Q2Fub25pY2FsVXJsKCRwYWdlRWxlbWVudCwgZ3JvdXBTZXR0aW5ncykge1xuICAgIC8vIFRPRE8gUmV2aWV3IGFnYWluc3QgZW5nYWdlX2Z1bGwuIFRoZXJlLCB0aGUgbmVzdGVkIHBhZ2VzIGFuZCB0b3AtbGV2ZWwgcGFnZSBoYXZlIGEgdG90YWxseSBkaWZmZXJlbnQgZmxvdy4gRG9lcyB0aGlzXG4gICAgLy8gdW5pZmljYXRpb24gd29yaz8gVGhlIGlkZWEgaXMgdGhhdCB0aGUgbmVzdGVkIHBhZ2VzIHdvdWxkIGhhdmUgYW4gaHJlZiBzZWxlY3RvciB0aGF0IHNwZWNpZmllcyB0aGUgVVJMIHRvIHVzZSwgc28gd2VcbiAgICAvLyBqdXN0IHVzZSBpdC4gQnV0IGNvbXB1dGUgdGhlIHVybCBmb3IgdGhlIHRvcC1sZXZlbCBjYXNlIGV4cGxpY2l0bHkuXG4gICAgaWYgKCRwYWdlRWxlbWVudC5maW5kKGdyb3VwU2V0dGluZ3MucGFnZUhyZWZTZWxlY3RvcigpKS5sZW5ndGggPiAwKSB7XG4gICAgICAgIHJldHVybiAnc2FtZSc7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGNvbXB1dGVUb3BMZXZlbENhbm9uaWNhbFVybChncm91cFNldHRpbmdzKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVQYWdlRWxlbWVudFVybCgkcGFnZUVsZW1lbnQsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgdXJsID0gJHBhZ2VFbGVtZW50LmZpbmQoZ3JvdXBTZXR0aW5ncy5wYWdlSHJlZlNlbGVjdG9yKCkpLmF0dHIoJ2hyZWYnKTtcbiAgICBpZiAoIXVybCkge1xuICAgICAgICB1cmwgPSAkLnRyaW0oIHdpbmRvdy5sb2NhdGlvbi5ocmVmLnNwbGl0KCcjJylbMF0gKS50b0xvd2VyQ2FzZSgpOyAvLyB0b3AtbGV2ZWwgcGFnZSB1cmxcbiAgICB9XG4gICAgcmV0dXJuIHJlbW92ZVN1YmRvbWFpbkZyb21QYWdlVXJsKHVybCwgZ3JvdXBTZXR0aW5ncyk7XG59XG5cbi8vIFRPRE8gY29waWVkIGZyb20gZW5nYWdlX2Z1bGwuIFJldmlldy5cbmZ1bmN0aW9uIHJlbW92ZVN1YmRvbWFpbkZyb21QYWdlVXJsKHVybCwgZ3JvdXBTZXR0aW5ncykge1xuICAgIC8vIEFOVC5hY3Rpb25zLnJlbW92ZVN1YmRvbWFpbkZyb21QYWdlVXJsOlxuICAgIC8vIGlmIFwiaWdub3JlX3N1YmRvbWFpblwiIGlzIGNoZWNrZWQgaW4gc2V0dGluZ3MsIEFORCB0aGV5IHN1cHBseSBhIFRMRCxcbiAgICAvLyB0aGVuIG1vZGlmeSB0aGUgcGFnZSBhbmQgY2Fub25pY2FsIFVSTHMgaGVyZS5cbiAgICAvLyBoYXZlIHRvIGhhdmUgdGhlbSBzdXBwbHkgb25lIGJlY2F1c2UgdGhlcmUgYXJlIHRvbyBtYW55IHZhcmlhdGlvbnMgdG8gcmVsaWFibHkgc3RyaXAgc3ViZG9tYWlucyAgKC5jb20sIC5pcywgLmNvbS5hciwgLmNvLnVrLCBldGMpXG4gICAgaWYgKGdyb3VwU2V0dGluZ3MudXJsLmlnbm9yZVN1YmRvbWFpbigpID09IHRydWUgJiYgZ3JvdXBTZXR0aW5ncy51cmwuY2Fub25pY2FsRG9tYWluKCkpIHtcbiAgICAgICAgdmFyIEhPU1RET01BSU4gPSAvWy1cXHddK1xcLig/OlstXFx3XStcXC54bi0tWy1cXHddK3xbLVxcd117Mix9fFstXFx3XStcXC5bLVxcd117Mn0pJC9pO1xuICAgICAgICB2YXIgc3JjQXJyYXkgPSB1cmwuc3BsaXQoJy8nKTtcblxuICAgICAgICB2YXIgcHJvdG9jb2wgPSBzcmNBcnJheVswXTtcbiAgICAgICAgc3JjQXJyYXkuc3BsaWNlKDAsMyk7XG5cbiAgICAgICAgdmFyIHJldHVyblVybCA9IHByb3RvY29sICsgJy8vJyArIGdyb3VwU2V0dGluZ3MudXJsLmNhbm9uaWNhbERvbWFpbigpICsgJy8nICsgc3JjQXJyYXkuam9pbignLycpO1xuXG4gICAgICAgIHJldHVybiByZXR1cm5Vcmw7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHVybDtcbiAgICB9XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjb21wdXRlUGFnZVVybDogY29tcHV0ZVBhZ2VFbGVtZW50VXJsLFxuICAgIGNvbXB1dGVDYW5vbmljYWxVcmw6IGNvbXB1dGVQYWdlRWxlbWVudENhbm9uaWNhbFVybFxufTsiLCJ2YXIgcmFuZ3k7IHJlcXVpcmUoJy4vcmFuZ3ktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24obG9hZGVkUmFuZ3kpIHsgcmFuZ3kgPSBsb2FkZWRSYW5neTsgfSk7XG5cbnZhciBoaWdobGlnaHRDbGFzcyA9ICdhbnRlbm5hLWhpZ2hsaWdodCc7XG52YXIgaGlnaGxpZ2h0ZWRSYW5nZXMgPSBbXTtcblxudmFyIGNsYXNzQXBwbGllcjtcbmZ1bmN0aW9uIGdldENsYXNzQXBwbGllcigpIHtcbiAgICBpZiAoIWNsYXNzQXBwbGllcikge1xuICAgICAgICBjbGFzc0FwcGxpZXIgPSByYW5neS5jcmVhdGVDbGFzc0FwcGxpZXIoaGlnaGxpZ2h0Q2xhc3MpO1xuICAgIH1cbiAgICByZXR1cm4gY2xhc3NBcHBsaWVyO1xufVxuXG4vLyBSZXR1cm5zIGFuIGFkanVzdGVkIGVuZCBwb2ludCBmb3IgdGhlIHNlbGVjdGlvbiB3aXRoaW4gdGhlIGdpdmVuIG5vZGUsIGFzIHRyaWdnZXJlZCBieSB0aGUgZ2l2ZW4gbW91c2UgdXAgZXZlbnQuXG4vLyBUaGUgcmV0dXJuZWQgcG9pbnQgKHgsIHkpIHRha2VzIGludG8gYWNjb3VudCB0aGUgbG9jYXRpb24gb2YgdGhlIG1vdXNlIHVwIGV2ZW50IGFzIHdlbGwgYXMgdGhlIGRpcmVjdGlvbiBvZiB0aGVcbi8vIHNlbGVjdGlvbiAoZm9yd2FyZC9iYWNrKS5cbmZ1bmN0aW9uIGdldFNlbGVjdGlvbkVuZFBvaW50KG5vZGUsIGV2ZW50LCBleGNsdWRlTm9kZSkge1xuICAgIGlmIChyYW5neSkge1xuICAgICAgICAvLyBUT0RPOiBDb25zaWRlciB1c2luZyB0aGUgZWxlbWVudCBjcmVhdGVkIHdpdGggdGhlICdjbGFzc2lmaWVyJyByYXRoZXIgdGhhbiB0aGUgbW91c2UgbG9jYXRpb25cbiAgICAgICAgdmFyIHNlbGVjdGlvbiA9IHJhbmd5LmdldFNlbGVjdGlvbigpO1xuICAgICAgICBpZiAoaXNWYWxpZFNlbGVjdGlvbihzZWxlY3Rpb24sIG5vZGUsIGV4Y2x1ZGVOb2RlKSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB4OiBldmVudC5wYWdlWCAtICggc2VsZWN0aW9uLmlzQmFja3dhcmRzKCkgPyAtNSA6IDUpLFxuICAgICAgICAgICAgICAgIHk6IGV2ZW50LnBhZ2VZIC0gOCAvLyBUT0RPOiBleGFjdCBjb29yZHNcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbn1cblxuLy8gQXR0ZW1wdHMgdG8gZ2V0IGEgcmFuZ2UgZnJvbSB0aGUgY3VycmVudCBzZWxlY3Rpb24uIFRoaXMgZXhwYW5kcyB0aGVcbi8vIHNlbGVjdGVkIHJlZ2lvbiB0byBpbmNsdWRlIHdvcmQgYm91bmRhcmllcy5cbmZ1bmN0aW9uIGdyYWJTZWxlY3Rpb24obm9kZSwgY2FsbGJhY2ssIGV4Y2x1ZGVOb2RlKSB7XG4gICAgaWYgKHJhbmd5KSB7XG4gICAgICAgIC8vIFRPRE86IG1ha2Ugc3VyZSB0aGUgc2VsZWN0aW9uIGlzIHdpdGhpbiB0aGUgZ2l2ZW4gbm9kZVxuICAgICAgICB2YXIgc2VsZWN0aW9uID0gcmFuZ3kuZ2V0U2VsZWN0aW9uKCk7XG4gICAgICAgIGlmIChpc1ZhbGlkU2VsZWN0aW9uKHNlbGVjdGlvbiwgbm9kZSwgZXhjbHVkZU5vZGUpKSB7XG4gICAgICAgICAgICBzZWxlY3Rpb24uZXhwYW5kKCd3b3JkJywgeyB0cmltOiB0cnVlIH0pO1xuICAgICAgICAgICAgdmFyIGxvY2F0aW9uID0gcmFuZ3kuc2VyaWFsaXplU2VsZWN0aW9uKHNlbGVjdGlvbiwgdHJ1ZSwgbm9kZSk7XG4gICAgICAgICAgICB2YXIgdGV4dCA9IHNlbGVjdGlvbi50b1N0cmluZygpO1xuICAgICAgICAgICAgaGlnaGxpZ2h0U2VsZWN0aW9uKHNlbGVjdGlvbik7IC8vIEhpZ2hsaWdodGluZyBkZXNlbGVjdHMgdGhlIHRleHQsIHNvIGRvIHRoaXMgbGFzdC5cbiAgICAgICAgICAgIGNhbGxiYWNrKHRleHQsIGxvY2F0aW9uKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gaXNWYWxpZFNlbGVjdGlvbihzZWxlY3Rpb24sIG5vZGUsIGV4Y2x1ZGVOb2RlKSB7XG4gICAgcmV0dXJuICFzZWxlY3Rpb24uaXNDb2xsYXBzZWQgJiYgIC8vIE5vbi1lbXB0eSBzZWxlY3Rpb25cbiAgICAgICAgc2VsZWN0aW9uLnJhbmdlQ291bnQgPT09IDEgJiYgLy8gU2luZ2xlIHNlbGVjdGlvblxuICAgICAgICAoIWV4Y2x1ZGVOb2RlIHx8ICFzZWxlY3Rpb24uY29udGFpbnNOb2RlKGV4Y2x1ZGVOb2RlLCB0cnVlKSkgJiYgLy8gU2VsZWN0aW9uIGRvZXNuJ3QgY29udGFpbiBhbnl0aGluZyB3ZSd2ZSBzYWlkIHdlIGRvbid0IHdhbnQgKGUuZy4gdGhlIGluZGljYXRvcilcbiAgICAgICAgbm9kZS5jb250YWlucyhzZWxlY3Rpb24uZ2V0UmFuZ2VBdCgwKS5jb21tb25BbmNlc3RvckNvbnRhaW5lcik7IC8vIFNlbGVjdGlvbiBpcyBjb250YWluZWQgZW50aXJlbHkgd2l0aGluIHRoZSBub2RlXG59XG5cbmZ1bmN0aW9uIGdyYWJOb2RlKG5vZGUsIGNhbGxiYWNrKSB7XG4gICAgaWYgKHJhbmd5KSB7XG4gICAgICAgIHZhciByYW5nZSA9IHJhbmd5LmNyZWF0ZVJhbmdlKGRvY3VtZW50KTtcbiAgICAgICAgcmFuZ2Uuc2VsZWN0Tm9kZUNvbnRlbnRzKG5vZGUpO1xuICAgICAgICB2YXIgc2VsZWN0aW9uID0gcmFuZ3kuZ2V0U2VsZWN0aW9uKCk7XG4gICAgICAgIHNlbGVjdGlvbi5zZXRTaW5nbGVSYW5nZShyYW5nZSk7XG4gICAgICAgIHZhciBsb2NhdGlvbiA9IHJhbmd5LnNlcmlhbGl6ZVNlbGVjdGlvbihzZWxlY3Rpb24sIHRydWUsIG5vZGUpO1xuICAgICAgICB2YXIgdGV4dCA9IHNlbGVjdGlvbi50b1N0cmluZygpO1xuICAgICAgICBoaWdobGlnaHRTZWxlY3Rpb24oc2VsZWN0aW9uKTsgLy8gSGlnaGxpZ2h0aW5nIGRlc2VsZWN0cyB0aGUgdGV4dCwgc28gZG8gdGhpcyBsYXN0LlxuICAgICAgICBjYWxsYmFjayh0ZXh0LCBsb2NhdGlvbik7XG4gICAgfVxufVxuXG4vLyBIaWdobGlnaHRzIHRoZSBnaXZlbiBsb2NhdGlvbiBpbnNpZGUgdGhlIGdpdmVuIG5vZGUuXG5mdW5jdGlvbiBoaWdobGlnaHRMb2NhdGlvbihub2RlLCBsb2NhdGlvbikge1xuICAgIC8vIFRPRE8gZXJyb3IgaGFuZGxpbmcgaW4gY2FzZSB0aGUgcmFuZ2UgaXMgbm90IHZhbGlkP1xuICAgIGlmIChyYW5neSAmJiByYW5neS5jYW5EZXNlcmlhbGl6ZVJhbmdlKGxvY2F0aW9uLCBub2RlLCBkb2N1bWVudCkpIHtcbiAgICAgICAgdmFyIHJhbmdlID0gcmFuZ3kuZGVzZXJpYWxpemVSYW5nZShsb2NhdGlvbiwgbm9kZSwgZG9jdW1lbnQpO1xuICAgICAgICBoaWdobGlnaHRSYW5nZShyYW5nZSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBoaWdobGlnaHRTZWxlY3Rpb24oc2VsZWN0aW9uKSB7XG4gICAgaGlnaGxpZ2h0UmFuZ2Uoc2VsZWN0aW9uLmdldFJhbmdlQXQoMCkpO1xufVxuXG5mdW5jdGlvbiBoaWdobGlnaHRSYW5nZShyYW5nZSkge1xuICAgIGdldENsYXNzQXBwbGllcigpLmFwcGx5VG9SYW5nZShyYW5nZSk7XG4gICAgaGlnaGxpZ2h0ZWRSYW5nZXMucHVzaChyYW5nZSk7XG59XG5cbi8vIENsZWFycyBhbGwgaGlnaGxpZ2h0cyB0aGF0IGhhdmUgYmVlbiBjcmVhdGVkIG9uIHRoZSBwYWdlLlxuZnVuY3Rpb24gY2xlYXJIaWdobGlnaHRzKCkge1xuICAgIGlmIChyYW5neSkge1xuICAgICAgICB2YXIgY2xhc3NBcHBsaWVyID0gZ2V0Q2xhc3NBcHBsaWVyKCk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaGlnaGxpZ2h0ZWRSYW5nZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciByYW5nZSA9IGhpZ2hsaWdodGVkUmFuZ2VzW2ldO1xuICAgICAgICAgICAgaWYgKGNsYXNzQXBwbGllci5pc0FwcGxpZWRUb1JhbmdlKHJhbmdlKSkge1xuICAgICAgICAgICAgICAgIGNsYXNzQXBwbGllci51bmRvVG9SYW5nZShyYW5nZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaGlnaGxpZ2h0ZWRSYW5nZXMgPSBbXTtcbiAgICB9XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBnZXRTZWxlY3Rpb25FbmRQb2ludDogZ2V0U2VsZWN0aW9uRW5kUG9pbnQsXG4gICAgZ3JhYlNlbGVjdGlvbjogZ3JhYlNlbGVjdGlvbixcbiAgICBncmFiTm9kZTogZ3JhYk5vZGUsXG4gICAgY2xlYXJIaWdobGlnaHRzOiBjbGVhckhpZ2hsaWdodHMsXG4gICAgaGlnaGxpZ2h0OiBoaWdobGlnaHRMb2NhdGlvblxufTsiLCJcbnZhciBub0NvbmZsaWN0O1xudmFyIGxvYWRlZFJhbmd5O1xudmFyIGNhbGxiYWNrcyA9IFtdO1xuXG4vLyBDYXB0dXJlIGFueSBnbG9iYWwgaW5zdGFuY2Ugb2YgcmFuZ3kgd2hpY2ggYWxyZWFkeSBleGlzdHMgYmVmb3JlIHdlIGxvYWQgb3VyIG93bi5cbmZ1bmN0aW9uIGFib3V0VG9Mb2FkKCkge1xuICAgIG5vQ29uZmxpY3QgPSB3aW5kb3cucmFuZ3k7XG59XG5cbi8vIFJlc3RvcmUgdGhlIGdsb2JhbCBpbnN0YW5jZSBvZiByYW5neSAoaWYgYW55KSBhbmQgcGFzcyBvdXQgb3VyIHZlcnNpb24gdG8gb3VyIGNhbGxiYWNrc1xuZnVuY3Rpb24gbG9hZGVkKCkge1xuICAgIGxvYWRlZFJhbmd5ID0gcmFuZ3k7XG4gICAgbG9hZGVkUmFuZ3kuaW5pdCgpO1xuICAgIHdpbmRvdy5yYW5neSA9IG5vQ29uZmxpY3Q7XG4gICAgbm90aWZ5Q2FsbGJhY2tzKCk7XG59XG5cbmZ1bmN0aW9uIG5vdGlmeUNhbGxiYWNrcygpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNhbGxiYWNrcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjYWxsYmFja3NbaV0obG9hZGVkUmFuZ3kpO1xuICAgIH1cbiAgICBjYWxsYmFja3MgPSBbXTtcbn1cblxuLy8gUmVnaXN0ZXJzIHRoZSBnaXZlbiBjYWxsYmFjayB0byBiZSBub3RpZmllZCB3aGVuIG91ciB2ZXJzaW9uIG9mIFJhbmd5IGlzIGxvYWRlZC5cbmZ1bmN0aW9uIG9uTG9hZChjYWxsYmFjaykge1xuICAgIGlmIChsb2FkZWRSYW5neSkge1xuICAgICAgICBjYWxsYmFjayhsb2FkZWRSYW5neSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgY2FsbGJhY2tzLnB1c2goY2FsbGJhY2spO1xuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgYWJvdXRUb0xvYWQ6IGFib3V0VG9Mb2FkLFxuICAgIGxvYWRlZDogbG9hZGVkLFxuICAgIG9uTG9hZDogb25Mb2FkXG59OyIsIlxuXG5mdW5jdGlvbiB0b2dnbGVUcmFuc2l0aW9uQ2xhc3MoJGVsZW1lbnQsIGNsYXNzTmFtZSwgc3RhdGUsIG5leHRTdGVwKSB7XG4gICAgJGVsZW1lbnQub24oXCJ0cmFuc2l0aW9uZW5kIHdlYmtpdFRyYW5zaXRpb25FbmQgb1RyYW5zaXRpb25FbmQgTVNUcmFuc2l0aW9uRW5kXCIsXG4gICAgICAgIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICAvLyBvbmNlIHRoZSBDU1MgdHJhbnNpdGlvbiBpcyBjb21wbGV0ZSwgY2FsbCBvdXIgbmV4dCBzdGVwXG4gICAgICAgICAgICAvLyBTZWU6IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvOTI1NTI3OS9jYWxsYmFjay13aGVuLWNzczMtdHJhbnNpdGlvbi1maW5pc2hlc1xuICAgICAgICAgICAgaWYgKGV2ZW50LnRhcmdldCA9PSBldmVudC5jdXJyZW50VGFyZ2V0KSB7XG4gICAgICAgICAgICAgICAgJGVsZW1lbnQub2ZmKGV2ZW50KTtcbiAgICAgICAgICAgICAgICBpZiAobmV4dFN0ZXApIHtcbiAgICAgICAgICAgICAgICAgICAgbmV4dFN0ZXAoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICApO1xuICAgICRlbGVtZW50LnRvZ2dsZUNsYXNzKGNsYXNzTmFtZSwgc3RhdGUpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICB0b2dnbGVDbGFzczogdG9nZ2xlVHJhbnNpdGlvbkNsYXNzXG59OyIsInZhciBvZmZsaW5lID0gcmVxdWlyZSgnLi9vZmZsaW5lLmpzJyk7XG5cbmZ1bmN0aW9uIGFudGVubmFIb21lKCkge1xuICAgIGlmIChvZmZsaW5lKSB7XG4gICAgICAgIHJldHVybiB3aW5kb3cubG9jYXRpb24ucHJvdG9jb2wgKyBcIi8vbG9jYWwuYW50ZW5uYS5pczo4MDgxXCI7XG4gICAgfVxuICAgIHJldHVybiB3aW5kb3cubG9jYXRpb24ucHJvdG9jb2wgKyBcIi8vd3d3LmFudGVubmEuaXNcIjtcbn1cblxuZnVuY3Rpb24gZ2V0Q3JlYXRlUmVhY3Rpb25VcmwoKSB7XG4gICAgcmV0dXJuICcvYXBpL3RhZy9jcmVhdGUnO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgYW50ZW5uYUhvbWU6IGFudGVubmFIb21lLFxuICAgIGNyZWF0ZVJlYWN0aW9uVXJsOiBnZXRDcmVhdGVSZWFjdGlvblVybFxufTsiLCJcbmZ1bmN0aW9uIGdldFdpZGdldEJ1Y2tldCgpIHtcbiAgICB2YXIgYnVja2V0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2FudGVubmEtd2lkZ2V0LWJ1Y2tldCcpO1xuICAgIGlmICghYnVja2V0KSB7XG4gICAgICAgIGJ1Y2tldCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBidWNrZXQuc2V0QXR0cmlidXRlKCdpZCcsICdhbnRlbm5hLXdpZGdldC1idWNrZXQnKTtcbiAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChidWNrZXQpO1xuICAgIH1cbiAgICByZXR1cm4gYnVja2V0O1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSBnZXRXaWRnZXRCdWNrZXQ7IiwiXG52YXIgVVJMcyA9IHJlcXVpcmUoJy4vdXJscycpO1xuXG4vLyBSZWdpc3RlciBvdXJzZWx2ZXMgdG8gaGVhciBtZXNzYWdlc1xud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIHJlY2VpdmVNZXNzYWdlLCBmYWxzZSk7XG5cbnZhciBjYWxsYmFja3MgPSB7ICd4ZG0gbG9hZGVkJzogeGRtTG9hZGVkIH07XG52YXIgY2FjaGUgPSB7fTtcblxudmFyIGlzWERNTG9hZGVkID0gZmFsc2U7XG4vLyBUaGUgaW5pdGlhbCBtZXNzYWdlIHRoYXQgWERNIHNlbmRzIG91dCB3aGVuIGl0IGxvYWRzXG5mdW5jdGlvbiB4ZG1Mb2FkZWQoZGF0YSkge1xuICAgIGlzWERNTG9hZGVkID0gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gZ2V0VXNlcihjYWxsYmFjaykge1xuICAgIHZhciBtZXNzYWdlID0gJ2dldFVzZXInO1xuICAgIHBvc3RNZXNzYWdlKG1lc3NhZ2UsICdyZXR1cm5pbmdfdXNlcicsIGNhbGxiYWNrLCB2YWxpZENhY2hlRW50cnkpO1xuXG4gICAgZnVuY3Rpb24gdmFsaWRDYWNoZUVudHJ5KHJlc3BvbnNlKSB7XG4gICAgICAgIHZhciB1c2VySW5mbyA9IHJlc3BvbnNlLmRhdGE7XG4gICAgICAgIHJldHVybiB1c2VySW5mbyAmJiB1c2VySW5mby5hbnRfdG9rZW4gJiYgdXNlckluZm8udXNlcl9pZDsgLy8gVE9ETyAmJiB1c2VySW5mby51c2VyX3R5cGU/XG4gICAgfVxufVxuXG5mdW5jdGlvbiByZWNlaXZlTWVzc2FnZShldmVudCkge1xuICAgIHZhciBldmVudE9yaWdpbiA9IGV2ZW50Lm9yaWdpbjtcbiAgICBpZiAoZXZlbnRPcmlnaW4gPT09IFVSTHMuYW50ZW5uYUhvbWUoKSkge1xuICAgICAgICB2YXIgcmVzcG9uc2UgPSBKU09OLnBhcnNlKGV2ZW50LmRhdGEpO1xuICAgICAgICAvLyBUT0RPOiBUaGUgZXZlbnQuc291cmNlIHByb3BlcnR5IGdpdmVzIHVzIHRoZSBzb3VyY2Ugd2luZG93IG9mIHRoZSBtZXNzYWdlIGFuZCBjdXJyZW50bHkgdGhlIFhETSBmcmFtZSBmaXJlcyBvdXRcbiAgICAgICAgLy8gZXZlbnRzIHRoYXQgd2UgcmVjZWl2ZSBiZWZvcmUgd2UgZXZlciB0cnkgdG8gcG9zdCBhbnl0aGluZy4gU28gd2UgKmNvdWxkKiBob2xkIG9udG8gdGhlIHdpbmRvdyBoZXJlIGFuZCB1c2UgaXRcbiAgICAgICAgLy8gZm9yIHBvc3RpbmcgbWVzc2FnZXMgcmF0aGVyIHRoYW4gbG9va2luZyBmb3IgdGhlIFhETSBmcmFtZSBvdXJzZWx2ZXMuIE5lZWQgdG8gbG9vayBhdCB3aGljaCBldmVudHMgdGhlIFhETSBmcmFtZVxuICAgICAgICAvLyBmaXJlcyBvdXQgdG8gYWxsIHdpbmRvd3MgYmVmb3JlIGJlaW5nIGFza2VkLiBDdXJyZW50bHksIGl0J3MgbW9yZSB0aGFuIFwieGRtIGxvYWRlZFwiLiBXaHk/XG4gICAgICAgIC8vdmFyIHNvdXJjZVdpbmRvdyA9IGV2ZW50LnNvdXJjZTtcblxuICAgICAgICB2YXIgY2FsbGJhY2tLZXkgPSByZXNwb25zZS5zdGF0dXM7IC8vIFRPRE86IGNoYW5nZSB0aGUgbmFtZSBvZiB0aGlzIHByb3BlcnR5IGluIHhkbS5odG1sXG4gICAgICAgIGNhY2hlW2NhbGxiYWNrS2V5XSA9IHJlc3BvbnNlO1xuICAgICAgICB2YXIgY2FsbGJhY2sgPSBjYWxsYmFja3NbY2FsbGJhY2tLZXldO1xuICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKHJlc3BvbnNlKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gcG9zdE1lc3NhZ2UobWVzc2FnZSwgY2FsbGJhY2tLZXksIGNhbGxiYWNrLCB2YWxpZENhY2hlRW50cnkpIHtcblxuICAgIHZhciB0YXJnZXRPcmlnaW4gPSBVUkxzLmFudGVubmFIb21lKCk7XG4gICAgY2FsbGJhY2tzW2NhbGxiYWNrS2V5XSA9IGNhbGxiYWNrO1xuXG4gICAgaWYgKGlzWERNTG9hZGVkKSB7XG4gICAgICAgIHZhciBjYWNoZWRSZXNwb25zZSA9IGNhY2hlW2NhbGxiYWNrS2V5XTtcbiAgICAgICAgaWYgKGNhY2hlZFJlc3BvbnNlICE9PSB1bmRlZmluZWQgJiYgdmFsaWRDYWNoZUVudHJ5ICYmIHZhbGlkQ2FjaGVFbnRyeShjYWNoZVtjYWxsYmFja0tleV0pKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhjYWNoZVtjYWxsYmFja0tleV0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyIHhkbUZyYW1lID0gZ2V0WERNRnJhbWUoKTtcbiAgICAgICAgICAgIGlmICh4ZG1GcmFtZSkge1xuICAgICAgICAgICAgICAgIHhkbUZyYW1lLnBvc3RNZXNzYWdlKG1lc3NhZ2UsIHRhcmdldE9yaWdpbik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGdldFhETUZyYW1lKCkge1xuICAgIC8vIFRPRE86IElzIHRoaXMgYSBzZWN1cml0eSBwcm9ibGVtPyBXaGF0IHByZXZlbnRzIHNvbWVvbmUgZnJvbSB1c2luZyB0aGlzIHNhbWUgbmFtZSBhbmQgaW50ZXJjZXB0aW5nIG91ciBtZXNzYWdlcz9cbiAgICByZXR1cm4gd2luZG93LmZyYW1lc1snYW50LXhkbS1oaWRkZW4nXTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgZ2V0VXNlcjogZ2V0VXNlclxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciBVUkxzID0gcmVxdWlyZSgnLi91cmxzJyk7XG5cbmZ1bmN0aW9uIGNyZWF0ZVhETWZyYW1lKGdyb3VwSWQpIHtcbiAgICAvL0FOVC5zZXNzaW9uLnJlY2VpdmVNZXNzYWdlKHt9LCBmdW5jdGlvbigpIHtcbiAgICAvLyAgICBBTlQudXRpbC51c2VyTG9naW5TdGF0ZSgpO1xuICAgIC8vfSk7XG5cblxuICAgIHZhciBpZnJhbWVVcmwgPSBVUkxzLmFudGVubmFIb21lKCkgKyBcIi9zdGF0aWMvd2lkZ2V0LW5ldy94ZG0veGRtLmh0bWxcIixcbiAgICBwYXJlbnRVcmwgPSB3aW5kb3cubG9jYXRpb24uaHJlZixcbiAgICBwYXJlbnRIb3N0ID0gd2luZG93LmxvY2F0aW9uLnByb3RvY29sICsgXCIvL1wiICsgd2luZG93LmxvY2F0aW9uLmhvc3QsXG4gICAgLy8gVE9ETzogUmVzdG9yZSB0aGUgYm9va21hcmtsZXQgYXR0cmlidXRlIG9uIHRoZSBpRnJhbWU/XG4gICAgLy9ib29rbWFya2xldCA9ICggQU5ULmVuZ2FnZVNjcmlwdFBhcmFtcy5ib29rbWFya2xldCApID8gXCJib29rbWFya2xldD10cnVlXCI6XCJcIixcbiAgICBib29rbWFya2xldCA9IFwiXCIsXG4gICAgLy8gVE9ETzogUmVzdG9yZSB0aGUgZ3JvdXBOYW1lIGF0dHJpYnV0ZS4gKFdoYXQgaXMgaXQgZm9yPylcbiAgICAkeGRtSWZyYW1lID0gJCgnPGlmcmFtZSBpZD1cImFudC14ZG0taGlkZGVuXCIgbmFtZT1cImFudC14ZG0taGlkZGVuXCIgc3JjPVwiJyArIGlmcmFtZVVybCArICc/cGFyZW50VXJsPScgKyBwYXJlbnRVcmwgKyAnJnBhcmVudEhvc3Q9JyArIHBhcmVudEhvc3QgKyAnJmdyb3VwX2lkPScrZ3JvdXBJZCsnXCIgd2lkdGg9XCIxXCIgaGVpZ2h0PVwiMVwiIHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGU7dG9wOi0xMDAwcHg7bGVmdDotMTAwMHB4O1wiIC8+Jyk7XG4gICAgLy8keGRtSWZyYW1lID0gJCgnPGlmcmFtZSBpZD1cImFudC14ZG0taGlkZGVuXCIgbmFtZT1cImFudC14ZG0taGlkZGVuXCIgc3JjPVwiJyArIGlmcmFtZVVybCArICc/cGFyZW50VXJsPScgKyBwYXJlbnRVcmwgKyAnJnBhcmVudEhvc3Q9JyArIHBhcmVudEhvc3QgKyAnJmdyb3VwX2lkPScrZ3JvdXBJZCsnJmdyb3VwX25hbWU9JytlbmNvZGVVUklDb21wb25lbnQoZ3JvdXBOYW1lKSsnJicrYm9va21hcmtsZXQrJ1wiIHdpZHRoPVwiMVwiIGhlaWdodD1cIjFcIiBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlO3RvcDotMTAwMHB4O2xlZnQ6LTEwMDBweDtcIiAvPicpO1xuICAgICQoZ2V0V2lkZ2V0QnVja2V0KCkpLmFwcGVuZCggJHhkbUlmcmFtZSApO1xufVxuXG4vLyBUT0RPIHJlZmFjdG9yIHRoaXMgd2l0aCB0aGUgY29weSBvZiBpdCBpbiBzdW1tYXJ5LXdpZGdldFxuZnVuY3Rpb24gZ2V0V2lkZ2V0QnVja2V0KCkge1xuICAgIHZhciBidWNrZXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYW50ZW5uYS13aWRnZXQtYnVja2V0Jyk7XG4gICAgaWYgKCFidWNrZXQpIHtcbiAgICAgICAgYnVja2V0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIGJ1Y2tldC5zZXRBdHRyaWJ1dGUoJ2lkJywgJ2FudGVubmEtd2lkZ2V0LWJ1Y2tldCcpO1xuICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGJ1Y2tldCk7XG4gICAgfVxuICAgIHJldHVybiBidWNrZXQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZVhETWZyYW1lOiBjcmVhdGVYRE1mcmFtZVxufTsiLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpbXCJhbnRlbm5hIGFudGVubmEtaW5kaWNhdG9yLXdpZGdldCBcIix7XCJ0XCI6NCxcImZcIjpbXCJyZWFjdGlvbnNcIl0sXCJyXCI6XCJjb250YWluZXJEYXRhLnJlYWN0aW9uVG90YWxcIn1dfSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudC1hbnRlbm5hLWxvZ29cIn19LFwiIFwiLHtcInRcIjo0LFwiZlwiOlt7XCJ0XCI6NCxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcmVhY3Rpb24tdG90YWxcIn0sXCJmXCI6W3tcInRcIjoyLFwiclwiOlwiY29udGFpbmVyRGF0YS5yZWFjdGlvblRvdGFsXCJ9XX1dLFwiblwiOjUwLFwiclwiOlwiY29udGFpbmVyRGF0YS5yZWFjdGlvblRvdGFsXCJ9XSxcIm5cIjo1MCxcInhcIjp7XCJyXCI6W1wiY29udGFpbmVyRGF0YS5yZWFjdGlvblRvdGFsXCJdLFwic1wiOlwiXzAhPT11bmRlZmluZWRcIn19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXBvcHVwXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXBvcHVwLWJvZHlcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnQtYW50ZW5uYS1sb2dvXCJ9fSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1wb3B1cC10ZXh0XCJ9LFwiZlwiOltcIldoYXQgZG8geW91IHRoaW5rP1wiXX1dfV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYSBhbnRlbm5hLXJlYWN0aW9ucy13aWRnZXRcIixcInRhYmluZGV4XCI6XCIwXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWhlYWRlclwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudC1hbnRlbm5hLWxvZ29cIn19LFwiIFJlYWN0aW9uc1wiXX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1ib2R5XCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXJlYWN0aW9ucy1wYWdlIGFudGVubmEtcGFnZVwifSxcImZcIjpbe1widFwiOjQsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJ2XCI6e1wiY2xpY2tcIjpcInBsdXNvbmVcIixcIm1vdXNlZW50ZXJcIjpcImhpZ2hsaWdodFwiLFwibW91c2VsZWF2ZVwiOlwiY2xlYXJoaWdobGlnaHRzXCJ9LFwiYVwiOntcImNsYXNzXCI6W1wiYW50ZW5uYS1yZWFjdGlvbiBcIix7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wicmVhY3Rpb25zTGF5b3V0Q2xhc3NcIixcImluZGV4XCIsXCIuL2NvdW50XCJdLFwic1wiOlwiXzAoXzEsXzIpXCJ9fV0sXCJzdHlsZVwiOltcImJhY2tncm91bmQtY29sb3I6XCIse1widFwiOjIsXCJ4XCI6e1wiclwiOltcInJlYWN0aW9uc0JhY2tncm91bmRDb2xvclwiLFwiaW5kZXhcIl0sXCJzXCI6XCJfMChfMSlcIn19XX0sXCJmXCI6W1wiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcmVhY3Rpb24tYm94XCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXJlYWN0aW9uLXRleHRcIn0sXCJvXCI6XCJzaXpldG9maXRcIixcImZcIjpbe1widFwiOjIsXCJyXCI6XCIuL3RleHRcIn1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXJlYWN0aW9uLWNvdW50XCJ9LFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcIi4vY291bnRcIn1dfV19XX1dLFwiaVwiOlwiaW5kZXhcIixcInJcIjpcInJlYWN0aW9uc1wifV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtZGVmYXVsdC1wYWdlIGFudGVubmEtcGFnZVwifSxcImZcIjpbe1widFwiOjQsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJ2XCI6e1wiY2xpY2tcIjpcIm5ld3JlYWN0aW9uXCJ9LFwiYVwiOntcImNsYXNzXCI6W1wiYW50ZW5uYS1yZWFjdGlvbiBcIix7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZGVmYXVsdExheW91dENsYXNzXCIsXCJpbmRleFwiXSxcInNcIjpcIl8wKF8xKVwifX1dLFwic3R5bGVcIjpbXCJiYWNrZ3JvdW5kLWNvbG9yOlwiLHtcInRcIjoyLFwieFwiOntcInJcIjpbXCJkZWZhdWx0QmFja2dyb3VuZENvbG9yXCIsXCJpbmRleFwiXSxcInNcIjpcIl8wKF8xKVwifX1dfSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1yZWFjdGlvbi1ib3hcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcmVhY3Rpb24tdGV4dFwifSxcIm9cIjpcInNpemV0b2ZpdFwiLFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcIi4vdGV4dFwifV19XX1dfV0sXCJpXCI6XCJpbmRleFwiLFwiclwiOlwiZGVmYXVsdFJlYWN0aW9uc1wifV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY29uZmlybS1wYWdlIGFudGVubmEtcGFnZVwifSxcImZcIjpbe1widFwiOjQsXCJmXCI6W1wiTG9va3MgbGlrZSB5b3Ugc3RpbGwgZmVlbCB0aGUgc2FtZSB3YXkuXCJdLFwiblwiOjUwLFwiclwiOlwicmVzcG9uc2UuZXhpc3RpbmdcIn0se1widFwiOjQsXCJuXCI6NTEsXCJmXCI6W1wiTmV3IHJlYWN0aW9uIHJlY2VpdmVkLlwiXSxcInJcIjpcInJlc3BvbnNlLmV4aXN0aW5nXCJ9XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1wcm9ncmVzcy1wYWdlIGFudGVubmEtcGFnZVwifSxcImZcIjpbXX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWZvb3RlclwifSxcImZcIjpbXCJXaGF0IGRvIHlvdSB0aGluaz9cIl19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hIGFudC1zdW1tYXJ5LXdpZGdldFwiLFwiYW50LWhhc2hcIjpbe1widFwiOjIsXCJyXCI6XCJwYWdlSGFzaFwifV19LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImFcIixcImFcIjp7XCJocmVmXCI6XCJodHRwOi8vd3d3LmFudGVubmEuaXNcIixcInRhcmdldFwiOlwiX2JsYW5rXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50LWFudGVubmEtbG9nb1wifX1dfSxcIiBcIix7XCJ0XCI6NCxcImZcIjpbe1widFwiOjQsXCJmXCI6W3tcInRcIjoyLFwiclwiOlwic3VtbWFyeVRvdGFsXCJ9XSxcIm5cIjo1MCxcInJcIjpcInN1bW1hcnlUb3RhbFwifSxcIiBSZWFjdGlvbnNcIl0sXCJuXCI6NTAsXCJ4XCI6e1wiclwiOltcInN1bW1hcnlUb3RhbFwiXSxcInNcIjpcIl8wIT09dW5kZWZpbmVkXCJ9fV19XX0iXX0=
