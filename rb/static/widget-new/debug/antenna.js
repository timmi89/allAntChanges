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
},{"./css-loader":"/Users/jburns/antenna/rb/static/widget-new/src/js/css-loader.js","./group-settings-loader":"/Users/jburns/antenna/rb/static/widget-new/src/js/group-settings-loader.js","./page-data-loader":"/Users/jburns/antenna/rb/static/widget-new/src/js/page-data-loader.js","./page-scanner":"/Users/jburns/antenna/rb/static/widget-new/src/js/page-scanner.js","./script-loader":"/Users/jburns/antenna/rb/static/widget-new/src/js/script-loader.js","./utils/xdm-loader":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/xdm-loader.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/comments-page.js":[function(require,module,exports){
var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });

var pageSelector = '.antenna-comments-page';

function createPage(reactionData, comments, element, closeWindow) {
    var ractive = Ractive({
        el: element,
        append: true,
        template: require('../templates/comments-page.hbs.html'),
        data: {
            reaction: reactionData,
            comments: comments
        }
    });
    ractive.on('closewindow', closeWindow);
    return {
        selector: pageSelector,
        teardown: function() { ractive.teardown(); }
    }
}

module.exports = {
    create: createPage
};
},{"../templates/comments-page.hbs.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/comments-page.hbs.html","./utils/jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/confirmation-page.js":[function(require,module,exports){
var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var AjaxClient = require('./utils/ajax-client');

var pageSelector = '.antenna-confirmation-page';

function createPage(reaction, containerData, pageData, element) {
    var ractive = Ractive({
        el: element,
        append: true,
        data: {
            text: reaction.text
        },
        template: require('../templates/confirmation-page.hbs.html')
    });
    $(ractive.find('.antenna-comment-area textarea')).focus();
    ractive.on('addcomment', addComment(reaction, containerData, pageData, ractive));
    return {
        selector: pageSelector,
        teardown: function() { ractive.teardown(); }
    };
}

function addComment(reaction, containerData, pageData, ractive) {
    return function() {
        // TODO: send the comment to the server and figure out how to link it to the reaction.
        //       in particular, how do we link to a reaction that might not even have an
        //       ID yet (we show this UI potentially before we're done posting the reaction to the server)
        var $textarea = $(ractive.find('textarea'));
        var comment = $textarea.val().trim(); // TODO: additional validation? input sanitizing?
        if (comment.length > 0) {
            AjaxClient.postComment(comment, reaction, containerData, pageData, function(){/*TODO*/}, error);
            // TODO: add a callback to the window to resize it? Or better to keep the size (height) stable?
            $(ractive.find('.antenna-comment-area')).hide();
            $(ractive.find('.antenna-comment-received')).fadeIn();
        }

        function error(message) {
            // TODO real error handling
            console.log('Error posting comment: ' + message);
        }
    }
}

module.exports = {
    create: createPage
};
},{"../templates/confirmation-page.hbs.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/confirmation-page.hbs.html","./utils/ajax-client":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/ajax-client.js","./utils/jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/css-loader.js":[function(require,module,exports){

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
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/js/defaults-page.js":[function(require,module,exports){
var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var AjaxClient = require('./utils/ajax-client');
var ReactionsWidgetLayoutUtils = require('./utils/reactions-widget-layout-utils');

var pageSelector = '.antenna-defaults-page';

function createPage(options) {
    var defaultReactions = options.defaultReactions;
    var containerData = options.containerData;
    var pageData = options.pageData;
    var contentData = options.contentData;
    var showConfirmation = options.showConfirmation;
    var element = options.element;
    var colors = options.colors;
    var defaultLayoutData = ReactionsWidgetLayoutUtils.computeLayoutData(defaultReactions, colors);
    var ractive = Ractive({
        el: element,
        append: true,
        template: require('../templates/defaults-page.hbs.html'),
        data: {
            defaultReactions: defaultReactions,
            defaultLayoutClass: arrayAccessor(defaultLayoutData.layoutClasses),
            defaultBackgroundColor: arrayAccessor(defaultLayoutData.backgroundColors)
        },
        decorators: {
            sizetofit: ReactionsWidgetLayoutUtils.sizeToFit
        }
    });

    ractive.on('newreaction', newDefaultReaction);
    ractive.on('customfocus', customReactionFocus);
    ractive.on('customblur', customReactionBlur);
    ractive.on('addcustom', submitCustomReaction);
    ractive.on('pagekeydown', keyboardInput);
    ractive.on('inputkeydown', customReactionInput);

    $(rootElement(ractive)).focus();

    return {
        selector: pageSelector,
        teardown: function() { ractive.teardown(); }
    };

    function customReactionInput(ractiveEvent) {
        var event = ractiveEvent.original;
        var key = (event.which !== undefined) ? event.which : event.keyCode;
        if (key == 13) { // Enter
            submitCustomReaction();
        } else if (key == 27) { // Escape
            $(event.target).val('');
            $(rootElement(ractive)).focus();
        }
        event.stopPropagation();
    }

    function newDefaultReaction(ractiveEvent) {
        var defaultReactionData = ractiveEvent.context;
        showConfirmation(defaultReactionData);
        AjaxClient.postNewReaction(defaultReactionData, containerData, pageData, contentData, function(){}/*TODO*/, error);

        function error(message) {
            // TODO handle any errors that occur posting a reaction
            console.log("error posting new reaction: " + message);
        }
    }

    function submitCustomReaction() {
        var body = $(ractive.find('.antenna-defaults-footer input')).val().trim();
        if (body !== '') {
            var reactionData = { text: body };
            showConfirmation(reactionData);
            AjaxClient.postNewReaction(reactionData, containerData, pageData, contentData, function(){}/*TODO*/, error);
        }

        function error(message) {
            // TODO handle any errors that occur posting a reaction
            console.log("error posting new reaction: " + message);
        }
    }

    function keyboardInput(ractiveEvent) {
        if ($(rootElement(ractive)).hasClass('antenna-page-active')) { // only handle input when this page is active
            $(rootElement(ractive)).find('.antenna-defaults-footer input').focus();
        }
    }
}

function rootElement(ractive) {
    return ractive.find(pageSelector);
}

function arrayAccessor(array) {
    return function(index) {
        return array[index];
    }
}

function customReactionFocus(ractiveEvent) {
    var $footer = $(ractiveEvent.original.target).closest('.antenna-defaults-footer');
    $footer.find('input').not('.active').val('').addClass('active');
    $footer.find('button').show();
}

function customReactionBlur(ractiveEvent) {
    var event = ractiveEvent.original;
    if ($(event.relatedTarget).closest('.antenna-defaults-footer button').size() == 0) { // Don't hide the input when we click on the button
        var $footer = $(event.target).closest('.antenna-defaults-footer');
        var input = $footer.find('input');
        if (input.val() === '') {
            $footer.find('button').hide();
            $footer.find('input').val('+ Add Your Own').removeClass('active');
        }
    }
}

module.exports = {
    create: createPage
};
},{"../templates/defaults-page.hbs.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/defaults-page.hbs.html","./utils/ajax-client":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/ajax-client.js","./utils/jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js","./utils/reactions-widget-layout-utils":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/reactions-widget-layout-utils.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/group-settings-loader.js":[function(require,module,exports){
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
    // TODO: Review how we handle image positioning. Currently, 'top' and 'bottom' pin the widget's top and bottom to those coordinates,
    //       as measured from the top (not the same as CSS positioning which measures bottom from the bottom of the relative parent)
    $rootElement.css({
        position: 'absolute',
        top: coords.top ? coords.top : (coords.bottom - $rootElement.outerHeight()),
        left: coords.left,
        right: coords.right
    });
    $rootElement.on('mouseenter.antenna', function(event) {
        if (event.buttons > 0 || (event.buttons == undefined && event.which > 0)) { // On Safari, event.buttons is undefined but event.which gives a good value. event.which is bad on FF
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
        if (event.buttons > 0 || (event.buttons == undefined && event.which > 0)) { // On Safari, event.buttons is undefined but event.which gives a good value. event.which is bad on FF
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
    return $rootElement;
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

function registerReaction(reaction, containerData, pageData) {
    var existingReactions = containerData.reactions;
    for (var i = 0; i < existingReactions.length; i++) {
        if (existingReactions[i].id === reaction.id) {
            // This reaction has already been added to this container. Don't add it again.
            return existingReactions[i];
        }
    }
    containerData.reactions.push(reaction);
    containerData.reactionTotal = containerData.reactionTotal + 1;
    var summaryReaction = {
        text: reaction.text,
        id: reaction.id,
        count: reaction.count
    };
    pageData.summaryReactions.push(summaryReaction);
    pageData.summaryTotal = pageData.summaryTotal + 1;
    return reaction;
}

//noinspection JSUnresolvedVariable
module.exports = {
    getPageData: getPageData,
    updateAllPageData: updateAllPageData,
    getContainerData: getContainerData,
    registerReaction: registerReaction
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
        var hash = Hash.hashText($textElement);
        var containerData = PageData.getContainerData(pageData, hash);
        containerData.type = 'text'; // TODO: revisit whether it makes sense to set the type here
        var defaultReactions = groupSettings.defaultReactions($textElement);
        var $indicatorElement = IndicatorWidget.create({
            element: $('<div>'), // render the template into a dummy node. The create function will return the node that is created from the template.
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
            bottom: imageOffset.top + $imageElement.height(), // TODO pull from settings/element
            left: imageOffset.left
        };
        var dimensions = {
            height: $imageElement.height(), // TODO: review how we get the image dimensions
            width: $imageElement.width()
        };
        if (dimensions.height >= 100 && dimensions.width >= 100) { // Don't create indicator on images that are too small
            ImageIndicatorWidget.create({
                    element: WidgetBucket(),
                    coords: coords,
                    imageUrl: imageUrl,
                    imageDimensions: dimensions,
                    containerData: containerData,
                    containerElement: $imageElement,
                    defaultReactions: defaultReactions,
                    pageData: pageData,
                    groupSettings: groupSettings
                }
            );
        }
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
},{"../templates/popup-widget.hbs.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/popup-widget.hbs.html","./utils/jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js","./utils/transition-util":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/transition-util.js","./utils/widget-bucket":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/widget-bucket.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/reactions-page.js":[function(require,module,exports){
var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var AjaxClient = require('./utils/ajax-client');
var Range = require('./utils/range');
var ReactionsWidgetLayoutUtils = require('./utils/reactions-widget-layout-utils');

var pageSelector = '.antenna-reactions-page';

function createPage(options) {
    var reactionsData = options.reactionsData;
    var containerData = options.containerData;
    var pageData = options.pageData;
    var contentData = options.contentData;
    var containerElement = options.containerElement; // optional
    //var showProgress = options.showProgress;
    var showConfirmation = options.showConfirmation;
    var showDefaults = options.showDefaults;
    var showComments = options.showComments;
    var element = options.element;
    var colors = options.colors;
    sortReactionData(reactionsData);
    var reactionsLayoutData = ReactionsWidgetLayoutUtils.computeLayoutData(reactionsData, colors);
    var ractive = Ractive({
        el: element,
        append: true,
        template: require('../templates/reactions-page.hbs.html'),
        data: {
            reactions: reactionsData,
            reactionsLayoutClass: arrayAccessor(reactionsLayoutData.layoutClasses),
            reactionsBackgroundColor: arrayAccessor(reactionsLayoutData.backgroundColors)
        },
        decorators: {
            sizetofit: sizeToFit
        }
    });

    if (containerElement) {
        ractive.on('highlight', highlightContent(containerData, pageData, containerElement));
        ractive.on('clearhighlights', Range.clearHighlights);
    }
    ractive.on('plusone', plusOne(containerData, pageData, showConfirmation));
    ractive.on('showdefault', showDefaults);
    ractive.on('showcomments', function(ractiveEvent) { showComments(ractiveEvent.context); return false; }); // TODO clean up
    return {
        selector: pageSelector,
        teardown: function() { ractive.teardown(); }
    };

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
}

function sizeToFit(node) {
    var $element = $(node).closest('.antenna-reaction-box');
    var $reactionCount = $element.find('.antenna-reaction-count');
    var $plusOne = $element.find('.antenna-plusone');
    var minWidth = Math.max($reactionCount.width(), $plusOne.width());
    $reactionCount.css({ 'min-width': minWidth });
    $plusOne.css({ 'min-width': minWidth });
    return ReactionsWidgetLayoutUtils.sizeToFit(node);
}

function rootElement(ractive) {
    return ractive.find(pageSelector);
}

function highlightContent(containerData, pageData, $containerElement) {
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

function plusOne(containerData, pageData, showConfirmation) {
    return function(event) {
        var reactionData = event.context;
        showConfirmation(reactionData);
        AjaxClient.postPlusOne(reactionData, containerData, pageData, function(){}/*TODO*/, error);

        function error(message) {
            // TODO handle any errors that occur posting a reaction
            console.log("error posting plus one: " + message);
        }
    };
}


module.exports = {
    create: createPage
};
},{"../templates/reactions-page.hbs.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/reactions-page.hbs.html","./utils/ajax-client":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/ajax-client.js","./utils/jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js","./utils/range":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/range.js","./utils/reactions-widget-layout-utils":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/reactions-widget-layout-utils.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/reactions-widget.js":[function(require,module,exports){
var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var AjaxClient = require('./utils/ajax-client');
var Moveable = require('./utils/moveable');
var Range = require('./utils/range');
var TransitionUtil = require('./utils/transition-util');
var URLs = require('./utils/urls');
var WidgetBucket = require('./utils/widget-bucket');

var CommentsPage = require('./comments-page');
var ConfirmationPage = require('./confirmation-page');
var DefaultsPage = require('./defaults-page');
var ReactionsPage = require('./reactions-page');

function openReactionsWidget(options, elementOrCoords) {
    var defaultReactions = options.defaultReactions;
    var reactionsData = options.reactionsData;
    var containerData = options.containerData;
    var containerElement = options.containerElement; // optional
    // contentData contains details about the content being reacted to like text range or image height/width.
    // we potentially modify this data (e.g. in the default reaction case we select the text ourselves) so we
    // make a local copy of it to avoid unexpectedly changing data out from under one of the clients
    var contentData = JSON.parse(JSON.stringify(options.contentData));
    var pageData = options.pageData;
    var groupSettings = options.groupSettings;
    var colors = groupSettings.reactionBackgroundColors();
    var ractive = Ractive({
        el: WidgetBucket(),
        append: true,
        data: {},
        template: require('../templates/reactions-widget.hbs.html')
    });
    var $rootElement = $(rootElement(ractive));
    Moveable.makeMoveable($rootElement, $rootElement.find('.antenna-header'));
    var pages = [];

    openWindow();

    function openWindow() {
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
        var horizontalOverflow = coords.left + $rootElement.width() - Math.max(document.documentElement.clientWidth, window.innerWidth || 0); // http://stackoverflow.com/questions/1248081/get-the-browser-viewport-dimensions-with-javascript/8876069#8876069
        if (horizontalOverflow > 0) {
            coords.left = coords.left - horizontalOverflow;
        }
        $rootElement.stop(true, true).addClass('open').css(coords);

        if (reactionsData.length > 0) {
            showReactionsPage(false);
        } else {
            // TODO allow to override and force showing of default
            showDefaultReactionsPage(false);
        }

        setupWindowClose(pages, ractive);
        preventExtraScroll($rootElement);
    }

    function showReactionsPage(animate) {
        var options = {
            reactionsData: reactionsData,
            pageData: pageData,
            containerData: containerData,
            containerElement: containerElement,
            colors: colors,
            contentData: contentData,
            showConfirmation: function(reaction) { showConfirmPage(reaction) },
            showDefaults: function() { showDefaultReactionsPage(true) },
            showComments: function(reaction) { showComments(reaction) },
            element: pageContainer(ractive)
        };
        var page = ReactionsPage.create(options);
        pages.push(page);
        showPage(page.selector, $rootElement, animate);
    }

    function showDefaultReactionsPage(animate) {
        if (containerElement && !contentData.location && !contentData.body) {
            Range.grabNode(containerElement.get(0), function (text, location) {
                contentData.location = location;
                contentData.body = text;
            });
        }
        var options = { // TODO: clean up the number of these "options" objects that we create.
            defaultReactions: defaultReactions,
            pageData: pageData,
            containerData: containerData,
            colors: colors,
            contentData: contentData,
            showConfirmation: function(reaction) { showConfirmPage(reaction) },
            element: pageContainer(ractive)
        };
        var page = DefaultsPage.create(options);
        pages.push(page);
        showPage(page.selector, $rootElement, animate);
    }

    function showConfirmPage(reaction) {
        // TODO: update header text "Thanks for your reaction!"
        var page = ConfirmationPage.create(reaction, containerData, pageData, pageContainer(ractive));
        pages.push(page);

        // TODO: revisit why we need to use the timeout trick for the confirm page, but not for the defaults page
        setTimeout(function() { // In order for the positioning animation to work, we need to let the browser render the appended DOM element
            showPage(page.selector, $rootElement, true);
        }, 1);
    }

    function showCommentsPage(reaction, comments) {
        var page = CommentsPage.create(reaction, comments, pageContainer(ractive), closeWindow);
        pages.push(page);

        // TODO: revisit
        setTimeout(function() { // In order for the positioning animation to work, we need to let the browser render the appended DOM element
            showPage(page.selector, $rootElement, true);
        }, 1);
    }

    function showProgressPage() {
        showPage('.antenna-progress-page', $rootElement, false, true);
    }

    function showComments(reaction) {
        showProgressPage(); // TODO: provide some way for the user to give up / cancel
        AjaxClient.getComments(reaction, function(comments) {
            showCommentsPage(reaction, comments);
        });
    }

    function closeWindow() {
        ractive.fire('closeWindow');
    }

}

function rootElement(ractive) {
    return ractive.find('.antenna-reactions-widget');
}

function pageContainer(ractive) {
    return ractive.find('.antenna-page-container');
}

var pageZ = 1000; // It's safe for this value to go across instances. We just need it to continuously increase (max value is over 2 billion).

function showPage(pageSelector, $rootElement, animate, overlay) {
    var $page = $rootElement.find(pageSelector);
    $page.css('z-index', pageZ);
    pageZ += 1;

    $page.toggleClass('antenna-page-animate', animate);

    if (overlay) {
        // In the overlay case, size the page to match whatever page is currently showing and then make it active (there will be two 'active' pages)
        var $current = $rootElement.find('.antenna-page-active');
        $page.height($current.height());
        $page.addClass('antenna-page-active');
    } else if (animate) {
        TransitionUtil.toggleClass($page, 'antenna-page-active', true, function() {
            // After the new page slides into position, move the other pages back out of the viewable area
            $rootElement.find('.antenna-page').not(pageSelector).removeClass('antenna-page-active');
        });
    } else {
        $page.addClass('antenna-page-active');
        $rootElement.find('.antenna-page').not(pageSelector).removeClass('antenna-page-active');
    }
    sizeBodyToFit($rootElement, $page, animate);
}

function sizeBodyToFit($rootElement, $page, animate) {
    var $pageContainer = $rootElement.find('.antenna-page-container');
    var $body = $page.find('.antenna-body');
    var currentHeight = $pageContainer.css('height');
    $pageContainer.css({ height: '' }); // Clear any previously computed height so we get a fresh computation of the child heights
    var newBodyHeight = Math.min(300, $body.get(0).scrollHeight);
    $body.css({ height: newBodyHeight }); // TODO: double-check that we can't just set a max-height of 300px on the body.
    var footerHeight = $page.find('.antenna-footer').outerHeight(); // returns 'null' if there's no footer. added to an integer, 'null' acts like 0
    var newPageHeight = newBodyHeight + footerHeight;
    if (animate) {
        $pageContainer.css({ height: currentHeight });
        $pageContainer.animate({ height: newPageHeight }, 200);
    } else {
        $pageContainer.css({ height: newPageHeight });
    }
    // TODO: we might not need width resizing at all.
    var minWidth = $page.css('min-width');
    var width = parseInt(minWidth);
    if (width > 0) {
        if (animate) {
            $rootElement.animate({ width: width }, 200);
        } else {
            $rootElement.css({ width: width });
        }
    }
}

function setupWindowClose(pages, ractive) {
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
        .on('focusout.antenna', function(event) {
            if ($([ event.relatedTarget, event.target ]).closest('.antenna-reactions-widget').size() == 0) { // Don't close the window if focus is going inside the window or we've clicked something in the window
                closeWindow();
            }
        });
    $(document).on('click.antenna', function(event) {
        if ($(event.target).closest('.antenna-reactions-widget').length === 0) {
            closeWindow();
        }
    });
    ractive.on('closeWindow', closeWindow);

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
        for (var i = 0; i < pages.length; i++) {
            pages[i].teardown();
        }
        ractive.teardown();
    }
}

// Prevent scrolling of the document after we scroll to the top/bottom of the reactions window
// Code copied from: http://stackoverflow.com/questions/5802467/prevent-scrolling-of-parent-element
// TODO: does this work on mobile?
function preventExtraScroll($rootElement) {
    $rootElement.on('DOMMouseScroll.antenna mousewheel.antenna', '.antenna-body', function(ev) {
        var $this = $(this),
            scrollTop = this.scrollTop,
            scrollHeight = this.scrollHeight,
            height = $this.height(),
            delta = (ev.type == 'DOMMouseScroll' ?
                ev.originalEvent.detail * -40 :
                ev.originalEvent.wheelDelta),
            up = delta > 0;

        if (scrollHeight <= height) {
            // This is an addition to the StackOverflow code, to make sure the page scrolls as usual if the window
            // content doesn't scroll.
            return;
        }

        var prevent = function() {
            ev.stopPropagation();
            ev.preventDefault();
            ev.returnValue = false;
            return false;
        };

        if (!up && -delta > scrollHeight - height - scrollTop) {
            // Scrolling down, but this will take us past the bottom.
            $this.scrollTop(scrollHeight);
            return prevent();
        } else if (up && delta > scrollTop) {
            // Scrolling up, but this will take us past the top.
            $this.scrollTop(0);
            return prevent();
        }
    });
}

//noinspection JSUnresolvedVariable
module.exports = {
    open: openReactionsWidget
};
},{"../templates/reactions-widget.hbs.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/reactions-widget.hbs.html","./comments-page":"/Users/jburns/antenna/rb/static/widget-new/src/js/comments-page.js","./confirmation-page":"/Users/jburns/antenna/rb/static/widget-new/src/js/confirmation-page.js","./defaults-page":"/Users/jburns/antenna/rb/static/widget-new/src/js/defaults-page.js","./reactions-page":"/Users/jburns/antenna/rb/static/widget-new/src/js/reactions-page.js","./utils/ajax-client":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/ajax-client.js","./utils/jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js","./utils/moveable":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/moveable.js","./utils/range":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/range.js","./utils/transition-util":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/transition-util.js","./utils/urls":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/urls.js","./utils/widget-bucket":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/widget-bucket.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/script-loader.js":[function(require,module,exports){
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
        contentData: { type: 'page', body: '' }
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
var isOffline = require('./offline');

var PageData = require('../page-data'); // TODO: backwards dependency


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
        $.getJSONP(URLs.createReactionUrl(), data, newReactionSuccess(containerData, pageData, success), error);
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
                body: '', // TODO: do we need this for +1s? looks like only the id field is used, if one is set
                kind: contentNodeDataKind(containerData.type),
                item_type: '' // TODO: looks unused but TagHandler blows up without it
            }
        };
        if (reactionData.content) {
            data.content_node_data.id = reactionData.content.id;
            data.content_node_data.location = reactionData.content.location;
        }
        if (reactionData.parentID) {
            data.tag.parent_id = reactionData.parentID;
        }
        $.getJSONP(URLs.createReactionUrl(), data, plusOneSuccess(reactionData, containerData, pageData, success), error);
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

function postComment(comment, reactionData, containerData, pageData, success, error) {
    // TODO: refactor the post functions to eliminate all the copied code
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
            comment: comment,
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
                body: '', // TODO: do we need this for +1s? looks like only the id field is used, if one is set
                kind: contentNodeDataKind(containerData.type),
                item_type: '' // TODO: looks unused but TagHandler blows up without it
            }
        };
        if (reactionData.content) {
            data.content_node_data.id = reactionData.content.id;
            data.content_node_data.location = reactionData.content.location;
        }
        if (reactionData.parentID) {
            data.tag.parent_id = reactionData.parentID;
        }
        $.getJSONP(URLs.createCommentUrl(), data, commentSuccess(reactionData, containerData, pageData, success), error);
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

function commentSuccess(reactionData, containerData, pageData, callback) {
    return function(response) {
        // TODO: in the case that someone reacts and then immediately comments, we have a race condition where the
        //       comment response could come back before the reaction. we need to:
        //       1. Make sure the server only creates a single reaction in this case (not a HUGE deal if it makes two)
        //       2. Resolve the two responses that both theoretically come back with the same reaction data at the same
        //          time. Make sure we don't end up with two copies of the same data in the model.
        var reactionCreated = !response.existing;
        if (reactionCreated) {
            var comments = reactionData.comments;
            if (!comments) {
                comments = reactionData.comments = { count: 0, commentsUrl: commentsUrl(reactionData, containerData) };
            }
            comments.count = comments.count + 1;
        } else {
            // TODO: do we ever get a response to a new reaction telling us that it's already existing? If so, could the count need to be updated?
        }
        callback(reactionCreated);
    }
}

function plusOneSuccess(reactionData, containerData, pageData, callback) {
    return function(response) {
        var reactionCreated = !response.existing;
        if (reactionCreated) {
            // TODO: we should get back a response with data in the "new format" and update the model from the response
            reactionData.count = reactionData.count + 1;
            containerData.reactionTotal = containerData.reactionTotal + 1;
            pageData.summaryTotal = pageData.summaryTotal + 1;
        }
        callback(reactionCreated);
    }
}

function newReactionSuccess(containerData, pageData, callback) {
    return function(response) {
        var reactionCreated = !response.existing;
        if (reactionCreated) {
            var reaction = reactionFromResponse(response);
            reaction = PageData.registerReaction(reaction, containerData, pageData);
        } else {
            // TODO: do we ever get a response to a new reaction telling us that it's already existing? If so, could the count need to be updated?
        }
        callback(reactionCreated);
    };
}

function reactionFromResponse(response) {
    // TODO: the server should give us back a reaction matching the new API format.
    //       we're just faking it out for now; this code is temporary
    var reaction = {
        text: response.interaction.interaction_node.body,
        id: response.interaction.interaction_node.id,
        count: 1, // TODO: could we get back a different count if someone else made the same "new" reaction before us?
        // parentId: ??? TODO: could we get a parentId back if someone else made the same "new" reaction before us?
    };
    if (response.content_node) {
        reaction.content = {
            id: response.content_node.id,
            kind: response.content_node.kind,
            body: response.content_node.body
        };
        if (response.content_node.location) {
            reaction.content.location = response.content_node.location;
        }
    }
    return reaction;
}

function getComments(reaction, callback) {
    XDMClient.getUser(function(response) {
        var userInfo = response.data;
        var data = {
            reaction_id: reaction.parentID,
            user_id: userInfo.user_id,
            ant_token: userInfo.ant_token
        };
        $.getJSONP(URLs.fetchCommentUrl(), data, function(response) {
            callback(commentsFromResponse(response));
        }, function(message) {
            // TODO: error handling
            console.log('An error occurred fetching comments: ' + message);
        });
    });
}

function commentsFromResponse(jsonComments) {
    var comments = [];
    for (var i = 0; i < jsonComments.length; i++) {
        var jsonComment = jsonComments[i];
        var comment = {
            text: jsonComment.text,
            id: jsonComment.id, // TODO: we probably only need this for +1'ing comments
            contentID: jsonComment.contentID, // TODO: Do we really need this?
            user: {
                name: jsonComment.first_name ? (jsonComment.first_name + ' ' + jsonComment.last_name) : 'Anonymous'
            }
        };
        if (jsonComment.social_user && jsonComment.social_user.img_url) {
            comment.user.imageURL = jsonComment.social_user.img_url;
        } else {
            comment.user.imageURL = isOffline ? '/static/widget/images/anonymousplode.png' : 'http://s3.amazonaws.com/readrboard/widget/images/anonymousplode.png';
        }
        comments.push(comment);
    }
    return comments;
}

function commentsUrl(reaction, containerData) {
    // TODO: need to send the URL back from the server. this path math is temporary
    return '/api/comments/' + containerData.id + '/' + reaction.id;
}

//noinspection JSUnresolvedVariable
module.exports = {
    postPlusOne: postPlusOne,
    postNewReaction: postNewReaction,
    postComment: postComment,
    getComments: getComments
};
},{"../page-data":"/Users/jburns/antenna/rb/static/widget-new/src/js/page-data.js","./jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js","./offline":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/offline.js","./urls":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/urls.js","./xdm-client":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/xdm-client.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/hash.js":[function(require,module,exports){
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
                if (textStatus === 'success' && response.status !== 'fail' && (!response.data || response.data.status !== 'fail')) {
                    success(response.data);
                } else {
                    // For JSONP requests, jQuery doesn't call it's error callback. It calls success instead.
                    error(response.message || response.data.message);
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
        if (selection.containsNode(excludeNode)) {
            var range = selection.getRangeAt(0);
            range.setEndBefore(excludeNode);
            selection.setSingleRange(range);
        }
        if (isValidSelection(selection, node, excludeNode)) {
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
    var range = rangy.createRange(document);
    range.selectNodeContents(node);
    var $excluded = $(node).find('.antenna-indicator-widget');
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
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/reactions-widget-layout-utils.js":[function(require,module,exports){
var $; require('./jquery-provider').onLoad(function(jQuery) { $=jQuery; });


function computeLayoutData(reactionsData, colors) {
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

function sizeReactionTextToFit(node) {
    var $element = $(node);
    var $reactionsWindow = $element.closest('.antenna-reactions-widget');
    var originalDisplay = $reactionsWindow.css('display');
    if (originalDisplay === 'none') { // If we're sizing the boxes before the widget is displayed, temporarily display it offscreen.
        $reactionsWindow.css({display: 'block', left: '100%'});
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
        $reactionsWindow.css({display: '', left: ''});
    }
    return { teardown: function() {} };
}

module.exports = {
    sizeToFit: sizeReactionTextToFit,
    computeLayoutData: computeLayoutData
};
},{"./jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/transition-util.js":[function(require,module,exports){


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

function getCreateCommentUrl() {
    return '/api/comment/create';
}

function getFetchCommentUrl() {
    return '/api/comment/replies';
}

//noinspection JSUnresolvedVariable
module.exports = {
    antennaHome: antennaHome,
    createReactionUrl: getCreateReactionUrl,
    createCommentUrl: getCreateCommentUrl,
    fetchCommentUrl: getFetchCommentUrl
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
},{"./jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js","./urls":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/urls.js","./widget-bucket":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/widget-bucket.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/templates/comments-page.hbs.html":[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna-page antenna-comments-page"},"f":[{"t":7,"e":"div","a":{"class":"antenna-body"},"f":[{"t":7,"e":"div","v":{"click":"closewindow"},"a":{"class":"antenna-comments-close"},"f":["Close X"]}," ",{"t":7,"e":"div","a":{"class":"antenna-comments-header"},"f":["(",{"t":2,"r":"comments.length"},") Comments:"]}," ",{"t":4,"f":[{"t":7,"e":"div","a":{"class":"antenna-comment-entry"},"f":[{"t":7,"e":"table","f":[{"t":7,"e":"tr","f":[{"t":7,"e":"td","a":{"class":"antenna-comment-cell"},"f":[{"t":7,"e":"img","a":{"src":[{"t":2,"r":"./user.imageURL"}]}}]}," ",{"t":7,"e":"td","a":{"class":"antenna-comment-author"},"f":[{"t":2,"r":"./user.name"}]}]}," ",{"t":7,"e":"tr","f":[{"t":7,"e":"td","f":[]}," ",{"t":7,"e":"td","a":{"class":"antenna-comment-text"},"f":[{"t":2,"r":"./text"}]}]}]}]}],"i":"index","r":"comments"}]}]}]}
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/templates/confirmation-page.hbs.html":[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna-page antenna-confirmation-page"},"f":[{"t":7,"e":"div","a":{"class":"antenna-body"},"f":[{"t":7,"e":"div","a":{"class":"antenna-comment-reaction"},"f":[{"t":2,"r":"text"}]}," ",{"t":7,"e":"div","a":{"class":"antenna-comment-area"},"f":[{"t":7,"e":"textarea","a":{"placeholder":"Add comments or #hashtags","maxlength":"500"}}," ",{"t":7,"e":"div","a":{"class":"antenna-comment-footer"},"f":[{"t":7,"e":"span","a":{"class":"antenna-comment-limit"},"f":[{"t":7,"e":"span","a":{"class":"antenna-comment-count"},"f":["500"]}," characters left"]}," ",{"t":7,"e":"button","v":{"click":"addcomment"},"f":["Comment"]}]}]}," ",{"t":7,"e":"div","a":{"class":"antenna-comment-received"},"f":["Thanks for your comment."]}]}," ",{"t":7,"e":"div","a":{"class":"antenna-footer antenna-confirm-footer"},"f":[{"t":7,"e":"span","v":{"click":"share"},"a":{"class":"antenna-share"},"f":["Share your reaction: ",{"t":7,"e":"span","a":{"class":"ant-social-facebook"}},{"t":7,"e":"span","a":{"class":"ant-social-twitter"}}]}]}]}]}
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/templates/defaults-page.hbs.html":[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","v":{"keydown":"pagekeydown"},"a":{"class":"antenna-page antenna-defaults-page","tabindex":"0"},"f":[{"t":7,"e":"div","a":{"class":"antenna-body"},"f":[{"t":4,"f":[{"t":7,"e":"div","v":{"click":"newreaction"},"a":{"class":["antenna-reaction ",{"t":2,"x":{"r":["defaultLayoutClass","index"],"s":"_0(_1)"}}],"style":["background-color:",{"t":2,"x":{"r":["defaultBackgroundColor","index"],"s":"_0(_1)"}}]},"f":[{"t":7,"e":"div","a":{"class":"antenna-reaction-box"},"f":[{"t":7,"e":"div","a":{"class":"antenna-reaction-text"},"o":"sizetofit","f":[{"t":2,"r":"./text"}]}]}]}],"i":"index","r":"defaultReactions"}]}," ",{"t":7,"e":"div","a":{"class":"antenna-footer antenna-defaults-footer"},"f":[{"t":7,"e":"input","v":{"focus":"customfocus","keydown":"inputkeydown","blur":"customblur"},"a":{"value":"+ Add Your Own","maxlength":"25"}}," ",{"t":7,"e":"button","v":{"click":"addcustom"},"f":["ok"]}]}]}]}
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/templates/image-indicator-widget.hbs.html":[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"span","a":{"class":["antenna antenna-image-indicator-widget ",{"t":4,"f":["reactions"],"r":"containerData.reactionTotal"}]},"f":[{"t":7,"e":"span","a":{"class":"ant-antenna-logo"}}," ",{"t":4,"f":[{"t":7,"e":"span","a":{"class":"antenna-reaction-total"},"f":[{"t":2,"r":"containerData.reactionTotal"}]}],"n":50,"r":"containerData.reactionTotal"},{"t":4,"n":51,"f":[{"t":7,"e":"span","a":{"class":"antenna-reaction-prompt"},"f":["What do you think?"]}],"r":"containerData.reactionTotal"}]}]}
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/templates/indicator-widget.hbs.html":[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"span","a":{"class":["antenna antenna-indicator-widget ",{"t":4,"f":["reactions"],"r":"containerData.reactionTotal"}]},"f":[{"t":7,"e":"span","a":{"class":"ant-antenna-logo"}}," ",{"t":4,"f":[{"t":7,"e":"span","a":{"class":"antenna-reaction-total"},"f":[{"t":2,"r":"containerData.reactionTotal"}]}],"n":50,"r":"containerData.reactionTotal"}]}]}
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/templates/popup-widget.hbs.html":[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna-popup"},"f":[{"t":7,"e":"div","a":{"class":"antenna-popup-body"},"f":[{"t":7,"e":"span","a":{"class":"ant-antenna-logo"}}," ",{"t":7,"e":"span","a":{"class":"antenna-popup-text"},"f":["What do you think?"]}]}]}]}
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/templates/reactions-page.hbs.html":[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna-page antenna-reactions-page"},"f":[{"t":7,"e":"div","a":{"class":"antenna-body"},"f":[{"t":4,"f":[{"t":7,"e":"div","v":{"click":"plusone","mouseenter":"highlight","mouseleave":"clearhighlights"},"a":{"class":["antenna-reaction ",{"t":2,"x":{"r":["reactionsLayoutClass","index","./count"],"s":"_0(_1,_2)"}}],"style":["background-color:",{"t":2,"x":{"r":["reactionsBackgroundColor","index"],"s":"_0(_1)"}}]},"f":[" ",{"t":7,"e":"div","a":{"class":"antenna-reaction-box"},"f":[{"t":7,"e":"div","a":{"class":"antenna-reaction-text"},"o":"sizetofit","f":[{"t":2,"r":"./text"}]}," ",{"t":7,"e":"div","a":{"class":"antenna-reaction-count"},"f":[{"t":2,"r":"./count"}]}," ",{"t":7,"e":"div","a":{"class":"antenna-plusone"},"f":["+1"]}," ",{"t":4,"f":[{"t":7,"e":"div","v":{"click":"showcomments"},"a":{"class":"antenna-reaction-comments hascomments"},"f":[{"t":7,"e":"span","a":{"class":"ant-comment"}}," ",{"t":2,"r":"./comments.count"}]}],"n":50,"x":{"r":["./comments.count"],"s":"_0>1"}},{"t":4,"n":51,"f":[{"t":7,"e":"div","a":{"class":"antenna-reaction-comments"},"f":[{"t":7,"e":"span","a":{"class":"ant-comment"}}]}],"x":{"r":["./comments.count"],"s":"_0>1"}}]}]}],"i":"index","r":"reactions"}]}," ",{"t":7,"e":"div","a":{"class":"antenna-footer antenna-reactions-footer"},"f":[{"t":7,"e":"span","v":{"click":"showdefault"},"a":{"class":"antenna-think"},"f":["What do you think?"]}]}]}]}
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/templates/reactions-widget.hbs.html":[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna antenna-reactions-widget","tabindex":"0"},"f":[{"t":7,"e":"div","a":{"class":"antenna-header"},"f":[{"t":7,"e":"span","a":{"class":"ant-antenna-logo"}}," Reactions"]}," ",{"t":7,"e":"div","a":{"class":"antenna-page-container"},"f":[" ",{"t":7,"e":"div","a":{"class":"antenna-progress-page antenna-page"},"f":[{"t":7,"e":"div","a":{"class":"antenna-body"}}]}]}]}]}
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/templates/summary-widget.hbs.html":[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna ant-summary-widget","ant-hash":[{"t":2,"r":"pageHash"}]},"f":[{"t":7,"e":"a","a":{"href":"http://www.antenna.is","target":"_blank"},"f":[{"t":7,"e":"span","a":{"class":"ant-antenna-logo"}}]}," ",{"t":4,"f":[{"t":4,"f":[{"t":2,"r":"summaryTotal"}],"n":50,"r":"summaryTotal"}," Reactions"],"n":50,"x":{"r":["summaryTotal"],"s":"_0!==undefined"}}]}]}
},{}]},{},["/Users/jburns/antenna/rb/static/widget-new/src/js/antenna.js","/Users/jburns/antenna/rb/static/widget-new/src/js/css-loader.js","/Users/jburns/antenna/rb/static/widget-new/src/js/group-settings-loader.js","/Users/jburns/antenna/rb/static/widget-new/src/js/group-settings.js","/Users/jburns/antenna/rb/static/widget-new/src/js/image-indicator-widget.js","/Users/jburns/antenna/rb/static/widget-new/src/js/indicator-widget.js","/Users/jburns/antenna/rb/static/widget-new/src/js/page-data-loader.js","/Users/jburns/antenna/rb/static/widget-new/src/js/page-data.js","/Users/jburns/antenna/rb/static/widget-new/src/js/page-scanner.js","/Users/jburns/antenna/rb/static/widget-new/src/js/popup-widget.js","/Users/jburns/antenna/rb/static/widget-new/src/js/reactions-widget.js","/Users/jburns/antenna/rb/static/widget-new/src/js/script-loader.js","/Users/jburns/antenna/rb/static/widget-new/src/js/summary-widget.js","/Users/jburns/antenna/rb/static/widget-new/src/js/text-reactions.js","/Users/jburns/antenna/rb/static/widget-new/src/templates/image-indicator-widget.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/indicator-widget.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/popup-widget.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/reactions-widget.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/summary-widget.hbs.html"])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi93aWRnZXQtbmV3L3NyYy9qcy9hbnRlbm5hLmpzIiwiLi4vd2lkZ2V0LW5ldy9zcmMvanMvY29tbWVudHMtcGFnZS5qcyIsIi4uL3dpZGdldC1uZXcvc3JjL2pzL2NvbmZpcm1hdGlvbi1wYWdlLmpzIiwiLi4vd2lkZ2V0LW5ldy9zcmMvanMvY3NzLWxvYWRlci5qcyIsIi4uL3dpZGdldC1uZXcvc3JjL2pzL2RlZmF1bHRzLXBhZ2UuanMiLCIuLi93aWRnZXQtbmV3L3NyYy9qcy9ncm91cC1zZXR0aW5ncy1sb2FkZXIuanMiLCIuLi93aWRnZXQtbmV3L3NyYy9qcy9ncm91cC1zZXR0aW5ncy5qcyIsIi4uL3dpZGdldC1uZXcvc3JjL2pzL2ltYWdlLWluZGljYXRvci13aWRnZXQuanMiLCIuLi93aWRnZXQtbmV3L3NyYy9qcy9pbmRpY2F0b3Itd2lkZ2V0LmpzIiwiLi4vd2lkZ2V0LW5ldy9zcmMvanMvcGFnZS1kYXRhLWxvYWRlci5qcyIsIi4uL3dpZGdldC1uZXcvc3JjL2pzL3BhZ2UtZGF0YS5qcyIsIi4uL3dpZGdldC1uZXcvc3JjL2pzL3BhZ2Utc2Nhbm5lci5qcyIsIi4uL3dpZGdldC1uZXcvc3JjL2pzL3BvcHVwLXdpZGdldC5qcyIsIi4uL3dpZGdldC1uZXcvc3JjL2pzL3JlYWN0aW9ucy1wYWdlLmpzIiwiLi4vd2lkZ2V0LW5ldy9zcmMvanMvcmVhY3Rpb25zLXdpZGdldC5qcyIsIi4uL3dpZGdldC1uZXcvc3JjL2pzL3NjcmlwdC1sb2FkZXIuanMiLCIuLi93aWRnZXQtbmV3L3NyYy9qcy9zdW1tYXJ5LXdpZGdldC5qcyIsIi4uL3dpZGdldC1uZXcvc3JjL2pzL3RleHQtcmVhY3Rpb25zLmpzIiwiLi4vd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvYWpheC1jbGllbnQuanMiLCIuLi93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9oYXNoLmpzIiwiLi4vd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvanF1ZXJ5LXByb3ZpZGVyLmpzIiwiLi4vd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvbWQ1LmpzIiwiLi4vd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvbW92ZWFibGUuanMiLCIuLi93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9vZmZsaW5lLmpzIiwiLi4vd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvcGFnZS11dGlscy5qcyIsIi4uL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL3JhbmdlLmpzIiwiLi4vd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvcmFuZ3ktcHJvdmlkZXIuanMiLCIuLi93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9yZWFjdGlvbnMtd2lkZ2V0LWxheW91dC11dGlscy5qcyIsIi4uL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL3RyYW5zaXRpb24tdXRpbC5qcyIsIi4uL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL3VybHMuanMiLCIuLi93aWRnZXQtbmV3L3NyYy9qcy91dGlscy93aWRnZXQtYnVja2V0LmpzIiwiLi4vd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMveGRtLWNsaWVudC5qcyIsIi4uL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL3hkbS1sb2FkZXIuanMiLCIuLi93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvY29tbWVudHMtcGFnZS5oYnMuaHRtbCIsIi4uL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9jb25maXJtYXRpb24tcGFnZS5oYnMuaHRtbCIsIi4uL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9kZWZhdWx0cy1wYWdlLmhicy5odG1sIiwiLi4vd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL2ltYWdlLWluZGljYXRvci13aWRnZXQuaGJzLmh0bWwiLCIuLi93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvaW5kaWNhdG9yLXdpZGdldC5oYnMuaHRtbCIsIi4uL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9wb3B1cC13aWRnZXQuaGJzLmh0bWwiLCIuLi93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvcmVhY3Rpb25zLXBhZ2UuaGJzLmh0bWwiLCIuLi93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvcmVhY3Rpb25zLXdpZGdldC5oYnMuaHRtbCIsIi4uL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9zdW1tYXJ5LXdpZGdldC5oYnMuaHRtbCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDalRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUEiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiXG52YXIgU2NyaXB0TG9hZGVyID0gcmVxdWlyZSgnLi9zY3JpcHQtbG9hZGVyJyk7XG52YXIgQ3NzTG9hZGVyID0gcmVxdWlyZSgnLi9jc3MtbG9hZGVyJyk7XG52YXIgR3JvdXBTZXR0aW5nc0xvYWRlciA9IHJlcXVpcmUoJy4vZ3JvdXAtc2V0dGluZ3MtbG9hZGVyJyk7XG52YXIgUGFnZURhdGFMb2FkZXIgPSByZXF1aXJlKCcuL3BhZ2UtZGF0YS1sb2FkZXInKTtcbnZhciBQYWdlU2Nhbm5lciA9IHJlcXVpcmUoJy4vcGFnZS1zY2FubmVyJyk7XG52YXIgWERNTG9hZGVyID0gcmVxdWlyZSgnLi91dGlscy94ZG0tbG9hZGVyJyk7XG5cblxuLy8gU3RlcCAxIC0ga2ljayBvZmYgdGhlIGFzeW5jaHJvbm91cyBsb2FkaW5nIG9mIHRoZSBKYXZhc2NyaXB0IGFuZCBDU1Mgd2UgbmVlZC5cblNjcmlwdExvYWRlci5sb2FkKGxvYWRHcm91cFNldHRpbmdzKTtcbkNzc0xvYWRlci5sb2FkKCk7XG5cbmZ1bmN0aW9uIGxvYWRHcm91cFNldHRpbmdzKCkge1xuICAgIC8vIFN0ZXAgMiAtIE9uY2Ugd2UgaGF2ZSB0aGUgc2V0dGluZ3MsIHdlIGNhbiBraWNrIG9mZiBhIGNvdXBsZSB0aGluZ3MgaW4gcGFyYWxsZWw6XG4gICAgLy9cbiAgICAvLyAtLSBjcmVhdGUgdGhlIGhpZGRlbiBpZnJhbWUgd2UgdXNlIGZvciBjcm9zcy1kb21haW4gY29va2llcyAocHJpbWFyaWx5IHVzZXIgbG9naW4pXG4gICAgLy8gLS0gc3RhcnQgZmV0Y2hpbmcgdGhlIHBhZ2UgZGF0YVxuICAgIC8vIC0tIHN0YXJ0IGhhc2hpbmcgdGhlIHBhZ2UgYW5kIGluc2VydGluZyB0aGUgYWZmb3JkYW5jZXMgKGluIHRoZSBlbXB0eSBzdGF0ZSlcbiAgICAvL1xuICAgIC8vIEFzIHRoZSBwYWdlIGlzIHNjYW5uZWQsIHRoZSB3aWRnZXRzIGFyZSBjcmVhdGVkIGFuZCBib3VuZCB0byB0aGUgcGFnZSBkYXRhIHRoYXQgY29tZXMgaW4uXG4gICAgR3JvdXBTZXR0aW5nc0xvYWRlci5sb2FkKGZ1bmN0aW9uKGdyb3VwU2V0dGluZ3MpIHtcbiAgICAgICAgaW5pdFhkbUZyYW1lKGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICBmZXRjaFBhZ2VEYXRhKGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICBzY2FuUGFnZShncm91cFNldHRpbmdzKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gaW5pdFhkbUZyYW1lKGdyb3VwU2V0dGluZ3MpIHtcbiAgICBYRE1Mb2FkZXIuY3JlYXRlWERNZnJhbWUoZ3JvdXBTZXR0aW5ncy5ncm91cElkKTtcbn1cblxuZnVuY3Rpb24gZmV0Y2hQYWdlRGF0YShncm91cFNldHRpbmdzKSB7XG4gICAgUGFnZURhdGFMb2FkZXIubG9hZChncm91cFNldHRpbmdzKTtcbn1cblxuZnVuY3Rpb24gc2NhblBhZ2UoZ3JvdXBTZXR0aW5ncykge1xuICAgIFBhZ2VTY2FubmVyLnNjYW4oZ3JvdXBTZXR0aW5ncyk7XG59IiwidmFyICQ7IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG5cbnZhciBwYWdlU2VsZWN0b3IgPSAnLmFudGVubmEtY29tbWVudHMtcGFnZSc7XG5cbmZ1bmN0aW9uIGNyZWF0ZVBhZ2UocmVhY3Rpb25EYXRhLCBjb21tZW50cywgZWxlbWVudCwgY2xvc2VXaW5kb3cpIHtcbiAgICB2YXIgcmFjdGl2ZSA9IFJhY3RpdmUoe1xuICAgICAgICBlbDogZWxlbWVudCxcbiAgICAgICAgYXBwZW5kOiB0cnVlLFxuICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL2NvbW1lbnRzLXBhZ2UuaGJzLmh0bWwnKSxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgcmVhY3Rpb246IHJlYWN0aW9uRGF0YSxcbiAgICAgICAgICAgIGNvbW1lbnRzOiBjb21tZW50c1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmFjdGl2ZS5vbignY2xvc2V3aW5kb3cnLCBjbG9zZVdpbmRvdyk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgc2VsZWN0b3I6IHBhZ2VTZWxlY3RvcixcbiAgICAgICAgdGVhcmRvd246IGZ1bmN0aW9uKCkgeyByYWN0aXZlLnRlYXJkb3duKCk7IH1cbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZTogY3JlYXRlUGFnZVxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi91dGlscy9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciBBamF4Q2xpZW50ID0gcmVxdWlyZSgnLi91dGlscy9hamF4LWNsaWVudCcpO1xuXG52YXIgcGFnZVNlbGVjdG9yID0gJy5hbnRlbm5hLWNvbmZpcm1hdGlvbi1wYWdlJztcblxuZnVuY3Rpb24gY3JlYXRlUGFnZShyZWFjdGlvbiwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGVsZW1lbnQpIHtcbiAgICB2YXIgcmFjdGl2ZSA9IFJhY3RpdmUoe1xuICAgICAgICBlbDogZWxlbWVudCxcbiAgICAgICAgYXBwZW5kOiB0cnVlLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICB0ZXh0OiByZWFjdGlvbi50ZXh0XG4gICAgICAgIH0sXG4gICAgICAgIHRlbXBsYXRlOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvY29uZmlybWF0aW9uLXBhZ2UuaGJzLmh0bWwnKVxuICAgIH0pO1xuICAgICQocmFjdGl2ZS5maW5kKCcuYW50ZW5uYS1jb21tZW50LWFyZWEgdGV4dGFyZWEnKSkuZm9jdXMoKTtcbiAgICByYWN0aXZlLm9uKCdhZGRjb21tZW50JywgYWRkQ29tbWVudChyZWFjdGlvbiwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIHJhY3RpdmUpKTtcbiAgICByZXR1cm4ge1xuICAgICAgICBzZWxlY3RvcjogcGFnZVNlbGVjdG9yLFxuICAgICAgICB0ZWFyZG93bjogZnVuY3Rpb24oKSB7IHJhY3RpdmUudGVhcmRvd24oKTsgfVxuICAgIH07XG59XG5cbmZ1bmN0aW9uIGFkZENvbW1lbnQocmVhY3Rpb24sIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCByYWN0aXZlKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBUT0RPOiBzZW5kIHRoZSBjb21tZW50IHRvIHRoZSBzZXJ2ZXIgYW5kIGZpZ3VyZSBvdXQgaG93IHRvIGxpbmsgaXQgdG8gdGhlIHJlYWN0aW9uLlxuICAgICAgICAvLyAgICAgICBpbiBwYXJ0aWN1bGFyLCBob3cgZG8gd2UgbGluayB0byBhIHJlYWN0aW9uIHRoYXQgbWlnaHQgbm90IGV2ZW4gaGF2ZSBhblxuICAgICAgICAvLyAgICAgICBJRCB5ZXQgKHdlIHNob3cgdGhpcyBVSSBwb3RlbnRpYWxseSBiZWZvcmUgd2UncmUgZG9uZSBwb3N0aW5nIHRoZSByZWFjdGlvbiB0byB0aGUgc2VydmVyKVxuICAgICAgICB2YXIgJHRleHRhcmVhID0gJChyYWN0aXZlLmZpbmQoJ3RleHRhcmVhJykpO1xuICAgICAgICB2YXIgY29tbWVudCA9ICR0ZXh0YXJlYS52YWwoKS50cmltKCk7IC8vIFRPRE86IGFkZGl0aW9uYWwgdmFsaWRhdGlvbj8gaW5wdXQgc2FuaXRpemluZz9cbiAgICAgICAgaWYgKGNvbW1lbnQubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgQWpheENsaWVudC5wb3N0Q29tbWVudChjb21tZW50LCByZWFjdGlvbiwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGZ1bmN0aW9uKCl7LypUT0RPKi99LCBlcnJvcik7XG4gICAgICAgICAgICAvLyBUT0RPOiBhZGQgYSBjYWxsYmFjayB0byB0aGUgd2luZG93IHRvIHJlc2l6ZSBpdD8gT3IgYmV0dGVyIHRvIGtlZXAgdGhlIHNpemUgKGhlaWdodCkgc3RhYmxlP1xuICAgICAgICAgICAgJChyYWN0aXZlLmZpbmQoJy5hbnRlbm5hLWNvbW1lbnQtYXJlYScpKS5oaWRlKCk7XG4gICAgICAgICAgICAkKHJhY3RpdmUuZmluZCgnLmFudGVubmEtY29tbWVudC1yZWNlaXZlZCcpKS5mYWRlSW4oKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGVycm9yKG1lc3NhZ2UpIHtcbiAgICAgICAgICAgIC8vIFRPRE8gcmVhbCBlcnJvciBoYW5kbGluZ1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ0Vycm9yIHBvc3RpbmcgY29tbWVudDogJyArIG1lc3NhZ2UpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGU6IGNyZWF0ZVBhZ2Vcbn07IiwiXG52YXIgYmFzZVVybCA9ICdodHRwOi8vbG9jYWxob3N0OjgwODEnOyAvLyBUT0RPIGNvbXB1dGUgdGhpc1xuXG5mdW5jdGlvbiBsb2FkQ3NzKCkge1xuICAgIHZhciBoZWFkID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKVswXTtcbiAgICBpZiAoaGVhZCkge1xuICAgICAgICAvLyBUbyBtYWtlIHN1cmUgbm9uZSBvZiBvdXIgY29udGVudCByZW5kZXJzIG9uIHRoZSBwYWdlIGJlZm9yZSBvdXIgQ1NTIGlzIGxvYWRlZCwgd2UgYXBwZW5kIGEgc2ltcGxlIGlubGluZSBzdHlsZVxuICAgICAgICAvLyBlbGVtZW50IHRoYXQgdHVybnMgb2ZmIG91ciBlbGVtZW50cyAqYmVmb3JlKiBvdXIgQ1NTIGxpbmtzLiBUaGlzIGV4cGxvaXRzIHRoZSBjYXNjYWRlIHJ1bGVzIC0gb3VyIENTUyBmaWxlcyBhcHBlYXJcbiAgICAgICAgLy8gYWZ0ZXIgdGhlIGlubGluZSBzdHlsZSBpbiB0aGUgZG9jdW1lbnQsIHNvIHRoZXkgdGFrZSBwcmVjZWRlbmNlIChhbmQgbWFrZSBldmVyeXRoaW5nIGFwcGVhcikgb25jZSB0aGV5J3JlIGxvYWRlZC5cbiAgICAgICAgdmFyIHN0eWxlVGFnID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcbiAgICAgICAgc3R5bGVUYWcuaW5uZXJIVE1MID0gJy5hbnRlbm5he2Rpc3BsYXk6bm9uZTt9JztcbiAgICAgICAgaGVhZC5hcHBlbmRDaGlsZChzdHlsZVRhZyk7XG5cbiAgICAgICAgdmFyIGNzc0hyZWZzID0gW1xuICAgICAgICAgICAgLy8gVE9ETyBicmluZ2luZyBpbiBtdWx0aXBsZSBjc3MgZmlsZXMgYnJlYWtzIHRoZSB3YXkgd2Ugd2FpdCB1bnRpbCBvdXIgQ1NTIGlzIGxvYWRlZCBiZWZvcmUgc2hvd2luZyBvdXIgY29udGVudC5cbiAgICAgICAgICAgIC8vICAgICAgd2UgbmVlZCB0byBmaW5kIGEgd2F5IHRvIGJyaW5nIHRoYXQgYmFjay4gb25lIHNpbXBsZSB3YXkgLSBhbHNvIGNvbXBpbGUgdGhlIGFudGVubmEtZm9udC5jc3MgaW50byB0aGUgYW50ZW5uYS5jc3MgZmlsZS5cbiAgICAgICAgICAgIC8vICAgICAgb3BlbiBxdWVzdGlvbiAtIGhvdyBkb2VzIGl0IGFsbCBwbGF5IHdpdGggZm9udCBpY29ucyB0aGF0IGFyZSBkb3dubG9hZGVkIGFzIHlldCBhbm90aGVyIGZpbGU/XG4gICAgICAgICAgICBiYXNlVXJsICsgJy9zdGF0aWMvY3NzL2FudGVubmEtZm9udC9hbnRlbm5hLWZvbnQuY3NzJyxcbiAgICAgICAgICAgIGJhc2VVcmwgKyAnL3N0YXRpYy93aWRnZXQtbmV3L2RlYnVnL2FudGVubmEuY3NzJyAvLyBUT0RPIHRoaXMgbmVlZHMgYSBmaW5hbCBwYXRoLiBDRE4gZm9yIHByb2R1Y3Rpb24gYW5kIGxvY2FsIGZpbGUgZm9yIGRldmVsb3BtZW50P1xuICAgICAgICBdO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNzc0hyZWZzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBsb2FkRmlsZShjc3NIcmVmc1tpXSwgaGVhZCk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGxvYWRGaWxlKGhyZWYsIGhlYWQpIHtcbiAgICB2YXIgbGlua1RhZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpbmsnKTtcbiAgICBsaW5rVGFnLnNldEF0dHJpYnV0ZSgnaHJlZicsIGhyZWYpO1xuICAgIGxpbmtUYWcuc2V0QXR0cmlidXRlKCdyZWwnLCAnc3R5bGVzaGVldCcpO1xuICAgIGxpbmtUYWcuc2V0QXR0cmlidXRlKCd0eXBlJywgJ3RleHQvY3NzJyk7XG4gICAgaGVhZC5hcHBlbmRDaGlsZChsaW5rVGFnKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgbG9hZCA6IGxvYWRDc3Ncbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgQWpheENsaWVudCA9IHJlcXVpcmUoJy4vdXRpbHMvYWpheC1jbGllbnQnKTtcbnZhciBSZWFjdGlvbnNXaWRnZXRMYXlvdXRVdGlscyA9IHJlcXVpcmUoJy4vdXRpbHMvcmVhY3Rpb25zLXdpZGdldC1sYXlvdXQtdXRpbHMnKTtcblxudmFyIHBhZ2VTZWxlY3RvciA9ICcuYW50ZW5uYS1kZWZhdWx0cy1wYWdlJztcblxuZnVuY3Rpb24gY3JlYXRlUGFnZShvcHRpb25zKSB7XG4gICAgdmFyIGRlZmF1bHRSZWFjdGlvbnMgPSBvcHRpb25zLmRlZmF1bHRSZWFjdGlvbnM7XG4gICAgdmFyIGNvbnRhaW5lckRhdGEgPSBvcHRpb25zLmNvbnRhaW5lckRhdGE7XG4gICAgdmFyIHBhZ2VEYXRhID0gb3B0aW9ucy5wYWdlRGF0YTtcbiAgICB2YXIgY29udGVudERhdGEgPSBvcHRpb25zLmNvbnRlbnREYXRhO1xuICAgIHZhciBzaG93Q29uZmlybWF0aW9uID0gb3B0aW9ucy5zaG93Q29uZmlybWF0aW9uO1xuICAgIHZhciBlbGVtZW50ID0gb3B0aW9ucy5lbGVtZW50O1xuICAgIHZhciBjb2xvcnMgPSBvcHRpb25zLmNvbG9ycztcbiAgICB2YXIgZGVmYXVsdExheW91dERhdGEgPSBSZWFjdGlvbnNXaWRnZXRMYXlvdXRVdGlscy5jb21wdXRlTGF5b3V0RGF0YShkZWZhdWx0UmVhY3Rpb25zLCBjb2xvcnMpO1xuICAgIHZhciByYWN0aXZlID0gUmFjdGl2ZSh7XG4gICAgICAgIGVsOiBlbGVtZW50LFxuICAgICAgICBhcHBlbmQ6IHRydWUsXG4gICAgICAgIHRlbXBsYXRlOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvZGVmYXVsdHMtcGFnZS5oYnMuaHRtbCcpLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICBkZWZhdWx0UmVhY3Rpb25zOiBkZWZhdWx0UmVhY3Rpb25zLFxuICAgICAgICAgICAgZGVmYXVsdExheW91dENsYXNzOiBhcnJheUFjY2Vzc29yKGRlZmF1bHRMYXlvdXREYXRhLmxheW91dENsYXNzZXMpLFxuICAgICAgICAgICAgZGVmYXVsdEJhY2tncm91bmRDb2xvcjogYXJyYXlBY2Nlc3NvcihkZWZhdWx0TGF5b3V0RGF0YS5iYWNrZ3JvdW5kQ29sb3JzKVxuICAgICAgICB9LFxuICAgICAgICBkZWNvcmF0b3JzOiB7XG4gICAgICAgICAgICBzaXpldG9maXQ6IFJlYWN0aW9uc1dpZGdldExheW91dFV0aWxzLnNpemVUb0ZpdFxuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICByYWN0aXZlLm9uKCduZXdyZWFjdGlvbicsIG5ld0RlZmF1bHRSZWFjdGlvbik7XG4gICAgcmFjdGl2ZS5vbignY3VzdG9tZm9jdXMnLCBjdXN0b21SZWFjdGlvbkZvY3VzKTtcbiAgICByYWN0aXZlLm9uKCdjdXN0b21ibHVyJywgY3VzdG9tUmVhY3Rpb25CbHVyKTtcbiAgICByYWN0aXZlLm9uKCdhZGRjdXN0b20nLCBzdWJtaXRDdXN0b21SZWFjdGlvbik7XG4gICAgcmFjdGl2ZS5vbigncGFnZWtleWRvd24nLCBrZXlib2FyZElucHV0KTtcbiAgICByYWN0aXZlLm9uKCdpbnB1dGtleWRvd24nLCBjdXN0b21SZWFjdGlvbklucHV0KTtcblxuICAgICQocm9vdEVsZW1lbnQocmFjdGl2ZSkpLmZvY3VzKCk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBzZWxlY3RvcjogcGFnZVNlbGVjdG9yLFxuICAgICAgICB0ZWFyZG93bjogZnVuY3Rpb24oKSB7IHJhY3RpdmUudGVhcmRvd24oKTsgfVxuICAgIH07XG5cbiAgICBmdW5jdGlvbiBjdXN0b21SZWFjdGlvbklucHV0KHJhY3RpdmVFdmVudCkge1xuICAgICAgICB2YXIgZXZlbnQgPSByYWN0aXZlRXZlbnQub3JpZ2luYWw7XG4gICAgICAgIHZhciBrZXkgPSAoZXZlbnQud2hpY2ggIT09IHVuZGVmaW5lZCkgPyBldmVudC53aGljaCA6IGV2ZW50LmtleUNvZGU7XG4gICAgICAgIGlmIChrZXkgPT0gMTMpIHsgLy8gRW50ZXJcbiAgICAgICAgICAgIHN1Ym1pdEN1c3RvbVJlYWN0aW9uKCk7XG4gICAgICAgIH0gZWxzZSBpZiAoa2V5ID09IDI3KSB7IC8vIEVzY2FwZVxuICAgICAgICAgICAgJChldmVudC50YXJnZXQpLnZhbCgnJyk7XG4gICAgICAgICAgICAkKHJvb3RFbGVtZW50KHJhY3RpdmUpKS5mb2N1cygpO1xuICAgICAgICB9XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG5ld0RlZmF1bHRSZWFjdGlvbihyYWN0aXZlRXZlbnQpIHtcbiAgICAgICAgdmFyIGRlZmF1bHRSZWFjdGlvbkRhdGEgPSByYWN0aXZlRXZlbnQuY29udGV4dDtcbiAgICAgICAgc2hvd0NvbmZpcm1hdGlvbihkZWZhdWx0UmVhY3Rpb25EYXRhKTtcbiAgICAgICAgQWpheENsaWVudC5wb3N0TmV3UmVhY3Rpb24oZGVmYXVsdFJlYWN0aW9uRGF0YSwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGNvbnRlbnREYXRhLCBmdW5jdGlvbigpe30vKlRPRE8qLywgZXJyb3IpO1xuXG4gICAgICAgIGZ1bmN0aW9uIGVycm9yKG1lc3NhZ2UpIHtcbiAgICAgICAgICAgIC8vIFRPRE8gaGFuZGxlIGFueSBlcnJvcnMgdGhhdCBvY2N1ciBwb3N0aW5nIGEgcmVhY3Rpb25cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiZXJyb3IgcG9zdGluZyBuZXcgcmVhY3Rpb246IFwiICsgbWVzc2FnZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzdWJtaXRDdXN0b21SZWFjdGlvbigpIHtcbiAgICAgICAgdmFyIGJvZHkgPSAkKHJhY3RpdmUuZmluZCgnLmFudGVubmEtZGVmYXVsdHMtZm9vdGVyIGlucHV0JykpLnZhbCgpLnRyaW0oKTtcbiAgICAgICAgaWYgKGJvZHkgIT09ICcnKSB7XG4gICAgICAgICAgICB2YXIgcmVhY3Rpb25EYXRhID0geyB0ZXh0OiBib2R5IH07XG4gICAgICAgICAgICBzaG93Q29uZmlybWF0aW9uKHJlYWN0aW9uRGF0YSk7XG4gICAgICAgICAgICBBamF4Q2xpZW50LnBvc3ROZXdSZWFjdGlvbihyZWFjdGlvbkRhdGEsIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBjb250ZW50RGF0YSwgZnVuY3Rpb24oKXt9LypUT0RPKi8sIGVycm9yKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGVycm9yKG1lc3NhZ2UpIHtcbiAgICAgICAgICAgIC8vIFRPRE8gaGFuZGxlIGFueSBlcnJvcnMgdGhhdCBvY2N1ciBwb3N0aW5nIGEgcmVhY3Rpb25cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiZXJyb3IgcG9zdGluZyBuZXcgcmVhY3Rpb246IFwiICsgbWVzc2FnZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBrZXlib2FyZElucHV0KHJhY3RpdmVFdmVudCkge1xuICAgICAgICBpZiAoJChyb290RWxlbWVudChyYWN0aXZlKSkuaGFzQ2xhc3MoJ2FudGVubmEtcGFnZS1hY3RpdmUnKSkgeyAvLyBvbmx5IGhhbmRsZSBpbnB1dCB3aGVuIHRoaXMgcGFnZSBpcyBhY3RpdmVcbiAgICAgICAgICAgICQocm9vdEVsZW1lbnQocmFjdGl2ZSkpLmZpbmQoJy5hbnRlbm5hLWRlZmF1bHRzLWZvb3RlciBpbnB1dCcpLmZvY3VzKCk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIHJvb3RFbGVtZW50KHJhY3RpdmUpIHtcbiAgICByZXR1cm4gcmFjdGl2ZS5maW5kKHBhZ2VTZWxlY3Rvcik7XG59XG5cbmZ1bmN0aW9uIGFycmF5QWNjZXNzb3IoYXJyYXkpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oaW5kZXgpIHtcbiAgICAgICAgcmV0dXJuIGFycmF5W2luZGV4XTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGN1c3RvbVJlYWN0aW9uRm9jdXMocmFjdGl2ZUV2ZW50KSB7XG4gICAgdmFyICRmb290ZXIgPSAkKHJhY3RpdmVFdmVudC5vcmlnaW5hbC50YXJnZXQpLmNsb3Nlc3QoJy5hbnRlbm5hLWRlZmF1bHRzLWZvb3RlcicpO1xuICAgICRmb290ZXIuZmluZCgnaW5wdXQnKS5ub3QoJy5hY3RpdmUnKS52YWwoJycpLmFkZENsYXNzKCdhY3RpdmUnKTtcbiAgICAkZm9vdGVyLmZpbmQoJ2J1dHRvbicpLnNob3coKTtcbn1cblxuZnVuY3Rpb24gY3VzdG9tUmVhY3Rpb25CbHVyKHJhY3RpdmVFdmVudCkge1xuICAgIHZhciBldmVudCA9IHJhY3RpdmVFdmVudC5vcmlnaW5hbDtcbiAgICBpZiAoJChldmVudC5yZWxhdGVkVGFyZ2V0KS5jbG9zZXN0KCcuYW50ZW5uYS1kZWZhdWx0cy1mb290ZXIgYnV0dG9uJykuc2l6ZSgpID09IDApIHsgLy8gRG9uJ3QgaGlkZSB0aGUgaW5wdXQgd2hlbiB3ZSBjbGljayBvbiB0aGUgYnV0dG9uXG4gICAgICAgIHZhciAkZm9vdGVyID0gJChldmVudC50YXJnZXQpLmNsb3Nlc3QoJy5hbnRlbm5hLWRlZmF1bHRzLWZvb3RlcicpO1xuICAgICAgICB2YXIgaW5wdXQgPSAkZm9vdGVyLmZpbmQoJ2lucHV0Jyk7XG4gICAgICAgIGlmIChpbnB1dC52YWwoKSA9PT0gJycpIHtcbiAgICAgICAgICAgICRmb290ZXIuZmluZCgnYnV0dG9uJykuaGlkZSgpO1xuICAgICAgICAgICAgJGZvb3Rlci5maW5kKCdpbnB1dCcpLnZhbCgnKyBBZGQgWW91ciBPd24nKS5yZW1vdmVDbGFzcygnYWN0aXZlJyk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZTogY3JlYXRlUGFnZVxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi91dGlscy9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciBHcm91cFNldHRpbmdzID0gcmVxdWlyZSgnLi9ncm91cC1zZXR0aW5ncycpO1xuXG4vLyBUT0RPIGZvbGQgdGhpcyBtb2R1bGUgaW50byBncm91cC1zZXR0aW5ncz9cblxuZnVuY3Rpb24gbG9hZFNldHRpbmdzKGNhbGxiYWNrKSB7XG4gICAgJC5nZXRKU09OUCgnL2FwaS9zZXR0aW5ncycsIHsgaG9zdF9uYW1lOiB3aW5kb3cuYW50ZW5uYV9ob3N0IH0sIHN1Y2Nlc3MsIGVycm9yKTtcblxuICAgIGZ1bmN0aW9uIHN1Y2Nlc3MoanNvbikge1xuICAgICAgICB2YXIgZ3JvdXBTZXR0aW5ncyA9IEdyb3VwU2V0dGluZ3MuY3JlYXRlKGpzb24pO1xuICAgICAgICBjYWxsYmFjayhncm91cFNldHRpbmdzKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBlcnJvcihtZXNzYWdlKSB7XG4gICAgICAgIC8vIFRPRE8gaGFuZGxlIGVycm9ycyB0aGF0IGhhcHBlbiB3aGVuIGxvYWRpbmcgY29uZmlnIGRhdGFcbiAgICB9XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBsb2FkOiBsb2FkU2V0dGluZ3Ncbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG5cbi8vIFRPRE86IHRyaW0gdHJhaWxpbmcgY29tbWFzIGZyb20gYW55IHNlbGVjdG9yIHZhbHVlc1xuXG4vLyBUT0RPOiBSZXZpZXcuIFRoZXNlIGFyZSBqdXN0IGNvcGllZCBmcm9tIGVuZ2FnZV9mdWxsLlxudmFyIGRlZmF1bHRzID0ge1xuICAgIHByZW1pdW06IGZhbHNlLFxuICAgIGltZ19zZWxlY3RvcjogXCJpbWdcIixcbiAgICBpbWdfY29udGFpbmVyX3NlbGVjdG9yczpcIiNwcmltYXJ5LXBob3RvXCIsXG4gICAgYWN0aXZlX3NlY3Rpb25zOiBcImJvZHlcIixcbiAgICBhbm5vX3doaXRlbGlzdDogXCJib2R5IHBcIixcbiAgICBhY3RpdmVfc2VjdGlvbnNfd2l0aF9hbm5vX3doaXRlbGlzdDpcIlwiLFxuICAgIG1lZGlhX3NlbGVjdG9yOiBcImVtYmVkLCB2aWRlbywgb2JqZWN0LCBpZnJhbWVcIixcbiAgICBjb21tZW50X2xlbmd0aDogNTAwLFxuICAgIG5vX2FudDogXCJcIixcbiAgICBpbWdfYmxhY2tsaXN0OiBcIlwiLFxuICAgIGN1c3RvbV9jc3M6IFwiXCIsXG4gICAgLy90b2RvOiB0ZW1wIGlubGluZV9pbmRpY2F0b3IgZGVmYXVsdHMgdG8gbWFrZSB0aGVtIHNob3cgdXAgb24gYWxsIG1lZGlhIC0gcmVtb3ZlIHRoaXMgbGF0ZXIuXG4gICAgaW5saW5lX3NlbGVjdG9yOiAnaW1nLCBlbWJlZCwgdmlkZW8sIG9iamVjdCwgaWZyYW1lJyxcbiAgICBwYXJhZ3JhcGhfaGVscGVyOiB0cnVlLFxuICAgIG1lZGlhX3VybF9pZ25vcmVfcXVlcnk6IHRydWUsXG4gICAgc3VtbWFyeV93aWRnZXRfc2VsZWN0b3I6ICcuYW50LXBhZ2Utc3VtbWFyeScsIC8vIFRPRE86IHRoaXMgd2Fzbid0IGRlZmluZWQgYXMgYSBkZWZhdWx0IGluIGVuZ2FnZV9mdWxsLCBidXQgd2FzIGluIGNvZGUuIHdoeT9cbiAgICBzdW1tYXJ5X3dpZGdldF9tZXRob2Q6ICdhZnRlcicsXG4gICAgbGFuZ3VhZ2U6ICdlbicsXG4gICAgYWJfdGVzdF9pbXBhY3Q6IHRydWUsXG4gICAgYWJfdGVzdF9zYW1wbGVfcGVyY2VudGFnZTogMTAsXG4gICAgaW1nX2luZGljYXRvcl9zaG93X29ubG9hZDogdHJ1ZSxcbiAgICBpbWdfaW5kaWNhdG9yX3Nob3dfc2lkZTogJ2xlZnQnLFxuICAgIHRhZ19ib3hfYmdfY29sb3JzOiAnIzE4NDE0YzsjMzc2MDc2OzIxNSwgMTc5LCA2OTsjZTY4ODVjOyNlNDYxNTYnLFxuICAgIHRhZ19ib3hfdGV4dF9jb2xvcnM6ICcjZmZmOyNmZmY7I2ZmZjsjZmZmOyNmZmYnLFxuICAgIHRhZ19ib3hfZm9udF9mYW1pbHk6ICdIZWx2ZXRpY2FOZXVlLEhlbHZldGljYSxBcmlhbCxzYW5zLXNlcmlmJyxcbiAgICB0YWdzX2JnX2NzczogJycsXG4gICAgaWdub3JlX3N1YmRvbWFpbjogZmFsc2UsXG4gICAgLy90aGUgc2NvcGUgaW4gd2hpY2ggdG8gZmluZCBwYXJlbnRzIG9mIDxicj4gdGFncy5cbiAgICAvL1Rob3NlIHBhcmVudHMgd2lsbCBiZSBjb252ZXJ0ZWQgdG8gYSA8cnQ+IGJsb2NrLCBzbyB0aGVyZSB3b24ndCBiZSBuZXN0ZWQgPHA+IGJsb2Nrcy5cbiAgICAvL3RoZW4gaXQgd2lsbCBzcGxpdCB0aGUgcGFyZW50J3MgaHRtbCBvbiA8YnI+IHRhZ3MgYW5kIHdyYXAgdGhlIHNlY3Rpb25zIGluIDxwPiB0YWdzLlxuXG4gICAgLy9leGFtcGxlOlxuICAgIC8vIGJyX3JlcGxhY2Vfc2NvcGVfc2VsZWN0b3I6IFwiLmFudF9icl9yZXBsYWNlXCIgLy9lLmcuIFwiI21haW5zZWN0aW9uXCIgb3IgXCJwXCJcblxuICAgIGJyX3JlcGxhY2Vfc2NvcGVfc2VsZWN0b3I6IG51bGwgLy9lLmcuIFwiI21haW5zZWN0aW9uXCIgb3IgXCJwXCJcbn07XG5cbmZ1bmN0aW9uIGNyZWF0ZUZyb21KU09OKGpzb24pIHtcblxuICAgIGZ1bmN0aW9uIGRhdGEoa2V5KSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IHdpbmRvdy5hbnRlbm5hX2V4dGVuZFtrZXldO1xuICAgICAgICAgICAgaWYgKHZhbHVlID09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHZhbHVlID0ganNvbltrZXldO1xuICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlID09PSAnJykgeyAvLyBUT0RPOiBTaG91bGQgdGhlIHNlcnZlciBiZSBzZW5kaW5nIGJhY2sgJycgaGVyZSBvciBub3RoaW5nIGF0IGFsbD8gKEl0IHByZWNsdWRlcyB0aGUgc2VydmVyIGZyb20gcmVhbGx5IHNheWluZyAnbm90aGluZycpXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gZGVmYXVsdHNba2V5XTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYmFja2dyb3VuZENvbG9yKGFjY2Vzc29yKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBjb2xvcnMgPSBbXTtcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IGFjY2Vzc29yKCk7XG4gICAgICAgICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICBjb2xvcnMgPSB2YWx1ZS5zcGxpdCgnOycpO1xuICAgICAgICAgICAgICAgIGNvbG9ycyA9IG1pZ3JhdGVWYWx1ZXMoY29sb3JzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBjb2xvcnM7XG5cbiAgICAgICAgICAgIC8vIE1pZ3JhdGUgYW55IGNvbG9ycyBmcm9tIHRoZSAnMSwgMiwgMycgZm9ybWF0IHRvICdyZ2IoMSwgMiwgMyknLiBUaGlzIGNvZGUgY2FuIGJlIGRlbGV0ZWQgb25jZSB3ZSd2ZSB1cGRhdGVkXG4gICAgICAgICAgICAvLyBhbGwgc2l0ZXMgdG8gc3BlY2lmeWluZyB2YWxpZCBDU1MgY29sb3IgdmFsdWVzXG4gICAgICAgICAgICBmdW5jdGlvbiBtaWdyYXRlVmFsdWVzKGNvbG9yVmFsdWVzKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1pZ3JhdGlvbk1hdGNoZXIgPSAvXlxccypcXGQrXFxzKixcXHMqXFxkK1xccyosXFxzKlxcZCtcXHMqJC9naW07XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb2xvclZhbHVlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgdmFsdWUgPSBjb2xvclZhbHVlc1tpXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG1pZ3JhdGlvbk1hdGNoZXIudGVzdCh2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yVmFsdWVzW2ldID0gJ3JnYignICsgdmFsdWUgKyAnKSc7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbG9yVmFsdWVzO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZGVmYXVsdFJlYWN0aW9ucygkZWxlbWVudCkge1xuICAgICAgICAvLyBEZWZhdWx0IHJlYWN0aW9ucyBhcmUgYXZhaWxhYmxlIGluIHRocmVlIGxvY2F0aW9ucyBpbiB0aHJlZSBkYXRhIGZvcm1hdHM6XG4gICAgICAgIC8vIDEuIEFzIGEgY29tbWEtc2VwYXJhdGVkIGF0dHJpYnV0ZSB2YWx1ZSBvbiBhIHBhcnRpY3VsYXIgZWxlbWVudFxuICAgICAgICAvLyAyLiBBcyBhbiBhcnJheSBvZiBzdHJpbmdzIG9uIHRoZSB3aW5kb3cuYW50ZW5uYV9leHRlbmQgcHJvcGVydHlcbiAgICAgICAgLy8gMy4gQXMgYSBqc29uIG9iamVjdCB3aXRoIGEgYm9keSBhbmQgaWQgb24gdGhlIGdyb3VwIHNldHRpbmdzXG4gICAgICAgIHZhciByZWFjdGlvbnMgPSBbXTtcbiAgICAgICAgdmFyIHJlYWN0aW9uU3RyaW5ncztcbiAgICAgICAgdmFyIGVsZW1lbnRSZWFjdGlvbnMgPSAkZWxlbWVudCA/ICRlbGVtZW50LmF0dHIoJ2FudC1yZWFjdGlvbnMnKSA6IHVuZGVmaW5lZDtcbiAgICAgICAgaWYgKGVsZW1lbnRSZWFjdGlvbnMpIHtcbiAgICAgICAgICAgIHJlYWN0aW9uU3RyaW5ncyA9IGVsZW1lbnRSZWFjdGlvbnMuc3BsaXQoJzsnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlYWN0aW9uU3RyaW5ncyA9IHdpbmRvdy5hbnRlbm5hX2V4dGVuZFsnZGVmYXVsdF9yZWFjdGlvbnMnXTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocmVhY3Rpb25TdHJpbmdzKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJlYWN0aW9uU3RyaW5ncy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHJlYWN0aW9ucy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgdGV4dDogcmVhY3Rpb25TdHJpbmdzW2ldXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciB2YWx1ZXMgPSBqc29uWydkZWZhdWx0X3JlYWN0aW9ucyddO1xuICAgICAgICAgICAgaWYgKHZhbHVlcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCB2YWx1ZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gdmFsdWVzW2pdO1xuICAgICAgICAgICAgICAgICAgICByZWFjdGlvbnMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiB2YWx1ZS5ib2R5LFxuICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IHZhbHVlLmlkXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVhY3Rpb25zO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIGdyb3VwSWQ6IGRhdGEoJ2lkJyksXG4gICAgICAgIGFjdGl2ZVNlY3Rpb25zOiBkYXRhKCdhY3RpdmVfc2VjdGlvbnMnKSxcbiAgICAgICAgdXJsOiB7XG4gICAgICAgICAgICBpZ25vcmVTdWJkb21haW46IGRhdGEoJ2lnbm9yZV9zdWJkb21haW4nKSxcbiAgICAgICAgICAgIGNhbm9uaWNhbERvbWFpbjogZGF0YSgncGFnZV90bGQnKSAvLyBUT0RPOiB3aGF0IHRvIGNhbGwgdGhpcyBleGFjdGx5LiBncm91cERvbWFpbj8gc2l0ZURvbWFpbj8gY2Fub25pY2FsRG9tYWluP1xuICAgICAgICB9LFxuICAgICAgICBzdW1tYXJ5U2VsZWN0b3I6IGRhdGEoJ3N1bW1hcnlfd2lkZ2V0X3NlbGVjdG9yJyksXG4gICAgICAgIHN1bW1hcnlNZXRob2Q6IGRhdGEoJ3N1bW1hcnlfd2lkZ2V0X21ldGhvZCcpLFxuICAgICAgICBwYWdlU2VsZWN0b3I6IGRhdGEoJ3Bvc3Rfc2VsZWN0b3InKSxcbiAgICAgICAgcGFnZUhyZWZTZWxlY3RvcjogZGF0YSgncG9zdF9ocmVmX3NlbGVjdG9yJyksXG4gICAgICAgIHRleHRTZWxlY3RvcjogZGF0YSgnYW5ub193aGl0ZWxpc3QnKSxcbiAgICAgICAgaW1hZ2VTZWxlY3RvcjogZGF0YSgnaW1nX3NlbGVjdG9yJyksXG4gICAgICAgIGRlZmF1bHRSZWFjdGlvbnM6IGRlZmF1bHRSZWFjdGlvbnMsXG4gICAgICAgIHJlYWN0aW9uQmFja2dyb3VuZENvbG9yczogYmFja2dyb3VuZENvbG9yKGRhdGEoJ3RhZ19ib3hfYmdfY29sb3JzJykpXG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlOiBjcmVhdGVGcm9tSlNPTlxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi91dGlscy9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciBSZWFjdGlvbnNXaWRnZXQgPSByZXF1aXJlKCcuL3JlYWN0aW9ucy13aWRnZXQnKTtcblxuXG5mdW5jdGlvbiBjcmVhdGVJbmRpY2F0b3JXaWRnZXQob3B0aW9ucykge1xuICAgIC8vIFRPRE86IHZhbGlkYXRlIHRoYXQgb3B0aW9ucyBjb250YWlucyBhbGwgcmVxdWlyZWQgcHJvcGVydGllcyAoYXBwbGllcyB0byBhbGwgd2lkZ2V0cykuXG4gICAgdmFyIGVsZW1lbnQgPSBvcHRpb25zLmVsZW1lbnQ7XG4gICAgdmFyIGNvbnRhaW5lckRhdGEgPSBvcHRpb25zLmNvbnRhaW5lckRhdGE7XG4gICAgdmFyICRjb250YWluZXJFbGVtZW50ID0gb3B0aW9ucy5jb250YWluZXJFbGVtZW50O1xuICAgIHZhciBwYWdlRGF0YSA9IG9wdGlvbnMucGFnZURhdGE7XG4gICAgdmFyIGdyb3VwU2V0dGluZ3MgPSBvcHRpb25zLmdyb3VwU2V0dGluZ3M7XG4gICAgdmFyIGRlZmF1bHRSZWFjdGlvbnMgPSBvcHRpb25zLmRlZmF1bHRSZWFjdGlvbnM7XG4gICAgdmFyIGNvb3JkcyA9IG9wdGlvbnMuY29vcmRzO1xuICAgIHZhciBpbWFnZVVybCA9IG9wdGlvbnMuaW1hZ2VVcmw7XG4gICAgdmFyIGltYWdlRGltZW5zaW9ucyA9IG9wdGlvbnMuaW1hZ2VEaW1lbnNpb25zO1xuICAgIHZhciByYWN0aXZlID0gUmFjdGl2ZSh7XG4gICAgICAgIGVsOiBlbGVtZW50LFxuICAgICAgICBhcHBlbmQ6IHRydWUsXG4gICAgICAgIG1hZ2ljOiB0cnVlLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICBjb250YWluZXJEYXRhOiBjb250YWluZXJEYXRhXG4gICAgICAgIH0sXG4gICAgICAgIHRlbXBsYXRlOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvaW1hZ2UtaW5kaWNhdG9yLXdpZGdldC5oYnMuaHRtbCcpXG4gICAgfSk7XG5cbiAgICB2YXIgcmVhY3Rpb25XaWRnZXRPcHRpb25zID0ge1xuICAgICAgICByZWFjdGlvbnNEYXRhOiBjb250YWluZXJEYXRhLnJlYWN0aW9ucyxcbiAgICAgICAgY29udGFpbmVyRGF0YTogY29udGFpbmVyRGF0YSxcbiAgICAgICAgY29udGFpbmVyRWxlbWVudDogJGNvbnRhaW5lckVsZW1lbnQsXG4gICAgICAgIGNvbnRlbnREYXRhOiB7XG4gICAgICAgICAgICB0eXBlOiAnaW1nJyxcbiAgICAgICAgICAgIGJvZHk6IGltYWdlVXJsLFxuICAgICAgICAgICAgZGltZW5zaW9uczogaW1hZ2VEaW1lbnNpb25zXG4gICAgICAgIH0sXG4gICAgICAgIGRlZmF1bHRSZWFjdGlvbnM6IGRlZmF1bHRSZWFjdGlvbnMsXG4gICAgICAgIHBhZ2VEYXRhOiBwYWdlRGF0YSxcbiAgICAgICAgZ3JvdXBTZXR0aW5nczogZ3JvdXBTZXR0aW5nc1xuICAgIH07XG5cbiAgICB2YXIgaG92ZXJUaW1lb3V0O1xuICAgIHZhciBhY3RpdmVUaW1lb3V0O1xuXG4gICAgdmFyICRyb290RWxlbWVudCA9ICQocm9vdEVsZW1lbnQocmFjdGl2ZSkpO1xuICAgIC8vIFRPRE86IFJldmlldyBob3cgd2UgaGFuZGxlIGltYWdlIHBvc2l0aW9uaW5nLiBDdXJyZW50bHksICd0b3AnIGFuZCAnYm90dG9tJyBwaW4gdGhlIHdpZGdldCdzIHRvcCBhbmQgYm90dG9tIHRvIHRob3NlIGNvb3JkaW5hdGVzLFxuICAgIC8vICAgICAgIGFzIG1lYXN1cmVkIGZyb20gdGhlIHRvcCAobm90IHRoZSBzYW1lIGFzIENTUyBwb3NpdGlvbmluZyB3aGljaCBtZWFzdXJlcyBib3R0b20gZnJvbSB0aGUgYm90dG9tIG9mIHRoZSByZWxhdGl2ZSBwYXJlbnQpXG4gICAgJHJvb3RFbGVtZW50LmNzcyh7XG4gICAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxuICAgICAgICB0b3A6IGNvb3Jkcy50b3AgPyBjb29yZHMudG9wIDogKGNvb3Jkcy5ib3R0b20gLSAkcm9vdEVsZW1lbnQub3V0ZXJIZWlnaHQoKSksXG4gICAgICAgIGxlZnQ6IGNvb3Jkcy5sZWZ0LFxuICAgICAgICByaWdodDogY29vcmRzLnJpZ2h0XG4gICAgfSk7XG4gICAgJHJvb3RFbGVtZW50Lm9uKCdtb3VzZWVudGVyLmFudGVubmEnLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBpZiAoZXZlbnQuYnV0dG9ucyA+IDAgfHwgKGV2ZW50LmJ1dHRvbnMgPT0gdW5kZWZpbmVkICYmIGV2ZW50LndoaWNoID4gMCkpIHsgLy8gT24gU2FmYXJpLCBldmVudC5idXR0b25zIGlzIHVuZGVmaW5lZCBidXQgZXZlbnQud2hpY2ggZ2l2ZXMgYSBnb29kIHZhbHVlLiBldmVudC53aGljaCBpcyBiYWQgb24gRkZcbiAgICAgICAgICAgIC8vIERvbid0IHJlYWN0IGlmIHRoZSB1c2VyIGlzIGRyYWdnaW5nIG9yIHNlbGVjdGluZyB0ZXh0LlxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjb250YWluZXJEYXRhLnJlYWN0aW9ucy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBvcGVuUmVhY3Rpb25zV2luZG93KHJlYWN0aW9uV2lkZ2V0T3B0aW9ucywgcmFjdGl2ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjbGVhclRpbWVvdXQoaG92ZXJUaW1lb3V0KTtcbiAgICAgICAgICAgIGhvdmVyVGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgb3BlblJlYWN0aW9uc1dpbmRvdyhyZWFjdGlvbldpZGdldE9wdGlvbnMsIHJhY3RpdmUpO1xuICAgICAgICAgICAgfSwgMjAwKTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgICRyb290RWxlbWVudC5vbignbW91c2VsZWF2ZS5hbnRlbm5hJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIGNsZWFyVGltZW91dChob3ZlclRpbWVvdXQpO1xuICAgICAgICBjbGVhclRpbWVvdXQoYWN0aXZlVGltZW91dCk7XG4gICAgfSk7XG4gICAgJGNvbnRhaW5lckVsZW1lbnQub24oJ21vdXNlZW50ZXIuYW50ZW5uYScsIGZ1bmN0aW9uKCkge1xuICAgICAgICBjbGVhclRpbWVvdXQoYWN0aXZlVGltZW91dCk7XG4gICAgICAgICAgICBhY3RpdmVUaW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAkcm9vdEVsZW1lbnQuYWRkQ2xhc3MoJ2FjdGl2ZScpO1xuICAgICAgICAgICAgfSwgNTAwKTtcbiAgICB9KTtcbiAgICAkY29udGFpbmVyRWxlbWVudC5vbignbW91c2VsZWF2ZS5hbnRlbm5hJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICRyb290RWxlbWVudC5yZW1vdmVDbGFzcygnYWN0aXZlJyk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIHJvb3RFbGVtZW50KHJhY3RpdmUpIHtcbiAgICByZXR1cm4gcmFjdGl2ZS5maW5kKCcuYW50ZW5uYS1pbWFnZS1pbmRpY2F0b3Itd2lkZ2V0Jyk7XG59XG5cbmZ1bmN0aW9uIG9wZW5SZWFjdGlvbnNXaW5kb3cocmVhY3Rpb25PcHRpb25zLCByYWN0aXZlKSB7XG4gICAgUmVhY3Rpb25zV2lkZ2V0Lm9wZW4ocmVhY3Rpb25PcHRpb25zLCByb290RWxlbWVudChyYWN0aXZlKSk7XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGU6IGNyZWF0ZUluZGljYXRvcldpZGdldFxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi91dGlscy9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciBQb3B1cFdpZGdldCA9IHJlcXVpcmUoJy4vcG9wdXAtd2lkZ2V0Jyk7XG52YXIgUmVhY3Rpb25zV2lkZ2V0ID0gcmVxdWlyZSgnLi9yZWFjdGlvbnMtd2lkZ2V0Jyk7XG52YXIgUmFuZ2UgPSByZXF1aXJlKCcuL3V0aWxzL3JhbmdlJyk7XG5cblxuZnVuY3Rpb24gY3JlYXRlSW5kaWNhdG9yV2lkZ2V0KG9wdGlvbnMpIHtcbiAgICB2YXIgZWxlbWVudCA9IG9wdGlvbnMuZWxlbWVudDtcbiAgICB2YXIgY29udGFpbmVyRGF0YSA9IG9wdGlvbnMuY29udGFpbmVyRGF0YTtcbiAgICB2YXIgJGNvbnRhaW5lckVsZW1lbnQgPSBvcHRpb25zLmNvbnRhaW5lckVsZW1lbnQ7XG4gICAgdmFyIHBhZ2VEYXRhID0gb3B0aW9ucy5wYWdlRGF0YTtcbiAgICB2YXIgZ3JvdXBTZXR0aW5ncyA9IG9wdGlvbnMuZ3JvdXBTZXR0aW5ncztcbiAgICB2YXIgZGVmYXVsdFJlYWN0aW9ucyA9IG9wdGlvbnMuZGVmYXVsdFJlYWN0aW9ucztcbiAgICB2YXIgY29vcmRzID0gb3B0aW9ucy5jb29yZHM7XG4gICAgdmFyIHJhY3RpdmUgPSBSYWN0aXZlKHtcbiAgICAgICAgZWw6IGVsZW1lbnQsXG4gICAgICAgIGFwcGVuZDogdHJ1ZSxcbiAgICAgICAgbWFnaWM6IHRydWUsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIGNvbnRhaW5lckRhdGE6IGNvbnRhaW5lckRhdGFcbiAgICAgICAgfSxcbiAgICAgICAgdGVtcGxhdGU6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9pbmRpY2F0b3Itd2lkZ2V0Lmhicy5odG1sJylcbiAgICB9KTtcblxuICAgIHZhciByZWFjdGlvbldpZGdldE9wdGlvbnMgPSB7XG4gICAgICAgIHJlYWN0aW9uc0RhdGE6IGNvbnRhaW5lckRhdGEucmVhY3Rpb25zLFxuICAgICAgICBjb250YWluZXJEYXRhOiBjb250YWluZXJEYXRhLFxuICAgICAgICBjb250YWluZXJFbGVtZW50OiAkY29udGFpbmVyRWxlbWVudCxcbiAgICAgICAgY29udGVudERhdGE6IHsgdHlwZTogJ3RleHQnIH0sXG4gICAgICAgIGRlZmF1bHRSZWFjdGlvbnM6IGRlZmF1bHRSZWFjdGlvbnMsXG4gICAgICAgIHBhZ2VEYXRhOiBwYWdlRGF0YSxcbiAgICAgICAgZ3JvdXBTZXR0aW5nczogZ3JvdXBTZXR0aW5nc1xuICAgIH07XG5cbiAgICB2YXIgJHJvb3RFbGVtZW50ID0gJChyb290RWxlbWVudChyYWN0aXZlKSk7XG4gICAgaWYgKGNvb3Jkcykge1xuICAgICAgICAkcm9vdEVsZW1lbnQuY3NzKHtcbiAgICAgICAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxuICAgICAgICAgICAgdG9wOiBjb29yZHMudG9wIC0gJHJvb3RFbGVtZW50LmhlaWdodCgpLFxuICAgICAgICAgICAgYm90dG9tOiBjb29yZHMuYm90dG9tLFxuICAgICAgICAgICAgbGVmdDogY29vcmRzLmxlZnQsXG4gICAgICAgICAgICByaWdodDogY29vcmRzLnJpZ2h0LFxuICAgICAgICAgICAgJ3otaW5kZXgnOiAxMDAwIC8vIFRPRE86IGNvbXB1dGUgYSByZWFsIHZhbHVlP1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgdmFyIGhvdmVyVGltZW91dDtcbiAgICAkcm9vdEVsZW1lbnQub24oJ21vdXNlZW50ZXIuYW50ZW5uYScsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGlmIChldmVudC5idXR0b25zID4gMCB8fCAoZXZlbnQuYnV0dG9ucyA9PSB1bmRlZmluZWQgJiYgZXZlbnQud2hpY2ggPiAwKSkgeyAvLyBPbiBTYWZhcmksIGV2ZW50LmJ1dHRvbnMgaXMgdW5kZWZpbmVkIGJ1dCBldmVudC53aGljaCBnaXZlcyBhIGdvb2QgdmFsdWUuIGV2ZW50LndoaWNoIGlzIGJhZCBvbiBGRlxuICAgICAgICAgICAgLy8gRG9uJ3QgcmVhY3QgaWYgdGhlIHVzZXIgaXMgZHJhZ2dpbmcgb3Igc2VsZWN0aW5nIHRleHQuXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY2xlYXJUaW1lb3V0KGhvdmVyVGltZW91dCk7IC8vIG9ubHkgb25lIHRpbWVvdXQgYXQgYSB0aW1lXG4gICAgICAgIGhvdmVyVGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAoY29udGFpbmVyRGF0YS5yZWFjdGlvbnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIG9wZW5SZWFjdGlvbnNXaW5kb3cocmVhY3Rpb25XaWRnZXRPcHRpb25zLCByYWN0aXZlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFyICRpY29uID0gJChyb290RWxlbWVudChyYWN0aXZlKSkuZmluZCgnLmFudC1hbnRlbm5hLWxvZ28nKTtcbiAgICAgICAgICAgICAgICB2YXIgb2Zmc2V0ID0gJGljb24ub2Zmc2V0KCk7XG4gICAgICAgICAgICAgICAgdmFyIGNvb3JkaW5hdGVzID0ge1xuICAgICAgICAgICAgICAgICAgICB0b3A6IG9mZnNldC50b3AgKyBNYXRoLmZsb29yKCRpY29uLmhlaWdodCgpIC8gMiksIC8vIFRPRE8gdGhpcyBudW1iZXIgaXMgYSBsaXR0bGUgb2ZmIGJlY2F1c2UgdGhlIGRpdiBkb2Vzbid0IHRpZ2h0bHkgd3JhcCB0aGUgaW5zZXJ0ZWQgZm9udCBjaGFyYWN0ZXJcbiAgICAgICAgICAgICAgICAgICAgbGVmdDogb2Zmc2V0LmxlZnQgKyBNYXRoLmZsb29yKCRpY29uLndpZHRoKCkgLyAyKVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgUG9wdXBXaWRnZXQuc2hvdyhjb29yZGluYXRlcywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIG9wZW5SZWFjdGlvbnNXaW5kb3cocmVhY3Rpb25XaWRnZXRPcHRpb25zLCByYWN0aXZlKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgMjAwKTtcbiAgICB9KTtcbiAgICAkcm9vdEVsZW1lbnQub24oJ21vdXNlbGVhdmUuYW50ZW5uYScsIGZ1bmN0aW9uKCkge1xuICAgICAgICBjbGVhclRpbWVvdXQoaG92ZXJUaW1lb3V0KTtcbiAgICB9KTtcbiAgICAkY29udGFpbmVyRWxlbWVudC5vbignbW91c2VlbnRlci5hbnRlbm5hJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICRyb290RWxlbWVudC5hZGRDbGFzcygnYWN0aXZlJyk7XG4gICAgfSk7XG4gICAgJGNvbnRhaW5lckVsZW1lbnQub24oJ21vdXNlbGVhdmUuYW50ZW5uYScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAkcm9vdEVsZW1lbnQucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpO1xuICAgIH0pO1xuICAgIHJldHVybiAkcm9vdEVsZW1lbnQ7XG59XG5cbmZ1bmN0aW9uIHJvb3RFbGVtZW50KHJhY3RpdmUpIHtcbiAgICByZXR1cm4gcmFjdGl2ZS5maW5kKCcuYW50ZW5uYS1pbmRpY2F0b3Itd2lkZ2V0Jyk7XG59XG5cbmZ1bmN0aW9uIG9wZW5SZWFjdGlvbnNXaW5kb3cocmVhY3Rpb25PcHRpb25zLCByYWN0aXZlKSB7XG4gICAgUmVhY3Rpb25zV2lkZ2V0Lm9wZW4ocmVhY3Rpb25PcHRpb25zLCByb290RWxlbWVudChyYWN0aXZlKSk7XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGU6IGNyZWF0ZUluZGljYXRvcldpZGdldFxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi91dGlscy9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciBQYWdlVXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzL3BhZ2UtdXRpbHMnKTtcbnZhciBQYWdlRGF0YSA9IHJlcXVpcmUoJy4vcGFnZS1kYXRhJyk7XG5cblxuZnVuY3Rpb24gY29tcHV0ZVBhZ2VUaXRsZSgpIHtcbiAgICAvLyBUT0RPOiBIb3cgYXJlIHBhZ2UgdGl0bGVzIGNvbXB1dGVkIHdpdGggbXVsdGlwbGUgcGFnZXM/IFRoZSBjb2RlIGJlbG93IGNvbXB1dGVzIHRoZSB0aXRsZSBmb3IgYSB0b3AtbGV2ZWwgcGFnZS5cbiAgICB2YXIgdGl0bGUgPSAkKCdtZXRhW3Byb3BlcnR5PVwib2c6dGl0bGVcIl0nKS5hdHRyKCdjb250ZW50Jyk7XG4gICAgaWYgKCF0aXRsZSkge1xuICAgICAgICB0aXRsZSA9ICQoJ3RpdGxlJykudGV4dCgpIHx8ICcnO1xuICAgIH1cbiAgICByZXR1cm4gJC50cmltKHRpdGxlKTtcbn1cblxuXG4vLyBDb21wdXRlIHRoZSBwYWdlcyB0aGF0IHdlIG5lZWQgdG8gZmV0Y2guIFRoaXMgaXMgZWl0aGVyOlxuLy8gMS4gQW55IG5lc3RlZCBwYWdlcyB3ZSBmaW5kIHVzaW5nIHRoZSBwYWdlIHNlbGVjdG9yIE9SXG4vLyAyLiBUaGUgY3VycmVudCB3aW5kb3cgbG9jYXRpb25cbmZ1bmN0aW9uIGNvbXB1dGVQYWdlc1BhcmFtKGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgcGFnZXMgPSBbXTtcblxuICAgIHZhciBncm91cElkID0gZ3JvdXBTZXR0aW5ncy5ncm91cElkKCk7XG4gICAgdmFyICRwYWdlRWxlbWVudHMgPSAkKGdyb3VwU2V0dGluZ3MucGFnZVNlbGVjdG9yKCkpO1xuICAgIC8vIFRPRE86IENvbXBhcmUgdGhpcyBleGVjdXRpb24gZmxvdyB0byB3aGF0IGhhcHBlbnMgaW4gZW5nYWdlX2Z1bGwuanMuIEhlcmUgd2UgdHJlYXQgdGhlIGJvZHkgZWxlbWVudCBhcyBhIHBhZ2Ugc29cbiAgICAvLyB0aGUgZmxvdyBpcyB0aGUgc2FtZSBmb3IgYm90aCBjYXNlcy4gSXMgdGhlcmUgYSByZWFzb24gZW5nYWdlX2Z1bGwuanMgYnJhbmNoZXMgaGVyZSBpbnN0ZWFkIGFuZCB0cmVhdHMgdGhlc2Ugc28gZGlmZmVyZW50bHk/XG4gICAgaWYgKCRwYWdlRWxlbWVudHMubGVuZ3RoID09IDApIHtcbiAgICAgICAgJHBhZ2VFbGVtZW50cyA9ICQoJ2JvZHknKTtcbiAgICB9XG4gICAgJHBhZ2VFbGVtZW50cy5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgJHBhZ2VFbGVtZW50ID0gJCh0aGlzKTtcbiAgICAgICAgcGFnZXMucHVzaCh7XG4gICAgICAgICAgICBncm91cF9pZDogZ3JvdXBJZCxcbiAgICAgICAgICAgIHVybDogUGFnZVV0aWxzLmNvbXB1dGVDYW5vbmljYWxVcmwoJHBhZ2VFbGVtZW50LCBncm91cFNldHRpbmdzKVxuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIHJldHVybiBwYWdlcztcbn1cblxuZnVuY3Rpb24gbG9hZFBhZ2VEYXRhKGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgcGFnZXNQYXJhbSA9IGNvbXB1dGVQYWdlc1BhcmFtKGdyb3VwU2V0dGluZ3MpO1xuICAgICQuZ2V0SlNPTlAoJy9hcGkvcGFnZW5ldycsIHsgcGFnZXM6IHBhZ2VzUGFyYW0gfSwgc3VjY2VzcywgZXJyb3IpO1xuXG4gICAgZnVuY3Rpb24gc3VjY2Vzcyhqc29uKSB7XG4gICAgICAgIC8vIFRPRE86IGlmIHRoZSBwYWdlIGRhdGEgaW5kaWNhdGVzIHRoYXQgdGhlIHNlcnZlciBkb2Vzbid0IGtub3cgYWJvdXQgdGhlIHBhZ2UgeWV0LCBjb21wdXRlIHRoZSBwYWdlIHRpdGxlIGFuZCBpbWFnZVxuICAgICAgICAvLyAgICAgICBhbmQgc2VuZCB0aGVtIHRvIHRoZSBzZXJ2ZXIuICh1c2UgY29tcHV0ZVBhZ2VUaXRsZSgpKVxuICAgICAgICBQYWdlRGF0YS51cGRhdGVBbGxQYWdlRGF0YShqc29uLCBncm91cFNldHRpbmdzKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBlcnJvcihtZXNzYWdlKSB7XG4gICAgICAgIC8vIFRPRE8gaGFuZGxlIGVycm9ycyB0aGF0IGhhcHBlbiB3aGVuIGxvYWRpbmcgcGFnZSBkYXRhXG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgbG9hZDogbG9hZFBhZ2VEYXRhXG59OyIsInZhciAkOyByZXF1aXJlKCcuL3V0aWxzL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xuXG52YXIgcGFnZXMgPSB7fTtcblxuZnVuY3Rpb24gZ2V0UGFnZURhdGEoaGFzaCkge1xuICAgIHZhciBwYWdlRGF0YSA9IHBhZ2VzW2hhc2hdO1xuICAgIGlmICghcGFnZURhdGEpIHtcbiAgICAgICAgLy8gVE9ETzogR2l2ZSB0aGlzIHNlcmlvdXMgdGhvdWdodC4gSW4gb3JkZXIgZm9yIG1hZ2ljIG1vZGUgdG8gd29yaywgdGhlIG9iamVjdCBuZWVkcyB0byBoYXZlIHZhbHVlcyBpbiBwbGFjZSBmb3JcbiAgICAgICAgLy8gdGhlIG9ic2VydmVkIHByb3BlcnRpZXMgYXQgdGhlIG1vbWVudCB0aGUgcmFjdGl2ZSBpcyBjcmVhdGVkLiBCdXQgdGhpcyBpcyBwcmV0dHkgdW51c3VhbCBmb3IgSmF2YXNjcmlwdCwgdG8gaGF2ZVxuICAgICAgICAvLyB0byBkZWZpbmUgdGhlIHdob2xlIHNrZWxldG9uIGZvciB0aGUgb2JqZWN0IGluc3RlYWQgb2YganVzdCBhZGRpbmcgcHJvcGVydGllcyB3aGVuZXZlciB5b3Ugd2FudC5cbiAgICAgICAgLy8gVGhlIGFsdGVybmF0aXZlIHdvdWxkIGJlIGZvciB1cyB0byBrZWVwIG91ciBvd24gXCJkYXRhIGJpbmRpbmdcIiBiZXR3ZWVuIHRoZSBwYWdlRGF0YSBhbmQgcmFjdGl2ZSBpbnN0YW5jZXMgKDEgdG8gbWFueSlcbiAgICAgICAgLy8gYW5kIHRlbGwgdGhlIHJhY3RpdmVzIHRvIHVwZGF0ZSB3aGVuZXZlciB0aGUgZGF0YSBjaGFuZ2VzLlxuICAgICAgICBwYWdlRGF0YSA9IHtcbiAgICAgICAgICAgIHBhZ2VIYXNoOiBoYXNoLFxuICAgICAgICAgICAgc3VtbWFyeVJlYWN0aW9uczoge30sXG4gICAgICAgICAgICBzdW1tYXJ5VG90YWw6IDAsIC8vIFRPRE8gY29uc2lkZXIgZm9sZGluZyB0aGlzIGludG8gc3VtbWFyeVJlYWN0aW9uc1xuICAgICAgICAgICAgY29udGFpbmVyczoge31cbiAgICAgICAgfTtcbiAgICAgICAgcGFnZXNbaGFzaF0gPSBwYWdlRGF0YTtcbiAgICB9XG4gICAgcmV0dXJuIHBhZ2VEYXRhO1xufVxuXG5mdW5jdGlvbiB1cGRhdGVBbGxQYWdlRGF0YShqc29uUGFnZXMsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgYWxsUGFnZXMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGpzb25QYWdlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBhbGxQYWdlcy5wdXNoKHVwZGF0ZVBhZ2VEYXRhKGpzb25QYWdlc1tpXSwgZ3JvdXBTZXR0aW5ncykpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gdXBkYXRlUGFnZURhdGEoanNvbiwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBwYWdlSGFzaCA9IGpzb24ucGFnZUhhc2g7XG4gICAgdmFyIHBhZ2VEYXRhID0gZ2V0UGFnZURhdGEocGFnZUhhc2gpO1xuXG4gICAgLy8gVE9ETzogQ2FuIHdlIGdldCBhd2F5IHdpdGgganVzdCBzZXR0aW5nIHBhZ2VEYXRhID0ganNvbiB3aXRob3V0IGJyZWFraW5nIFJhY3RpdmUncyBkYXRhIGJpbmRpbmc/XG4gICAgdmFyIHN1bW1hcnlSZWFjdGlvbnMgPSBqc29uLnN1bW1hcnlSZWFjdGlvbnM7XG4gICAgcGFnZURhdGEuc3VtbWFyeVJlYWN0aW9ucyA9IHN1bW1hcnlSZWFjdGlvbnM7XG4gICAgc2V0Q29udGFpbmVycyhwYWdlRGF0YSwganNvbi5jb250YWluZXJzKTtcblxuICAgIC8vIFdlIGFkZCB1cCB0aGUgc3VtbWFyeSByZWFjdGlvbiB0b3RhbCBjbGllbnQtc2lkZVxuICAgIHZhciB0b3RhbCA9IDA7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdW1tYXJ5UmVhY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHRvdGFsID0gdG90YWwgKyBzdW1tYXJ5UmVhY3Rpb25zW2ldLmNvdW50O1xuICAgIH1cbiAgICBwYWdlRGF0YS5zdW1tYXJ5VG90YWwgPSB0b3RhbDtcblxuICAgIC8vIFdlIGFkZCB1cCB0aGUgY29udGFpbmVyIHJlYWN0aW9uIHRvdGFscyBjbGllbnQtc2lkZVxuICAgIHZhciB0b3RhbCA9IDA7XG4gICAgdmFyIGNvbnRhaW5lcnMgPSBwYWdlRGF0YS5jb250YWluZXJzO1xuICAgIGZvciAodmFyIGhhc2ggaW4gY29udGFpbmVycykge1xuICAgICAgICBpZiAoY29udGFpbmVycy5oYXNPd25Qcm9wZXJ0eShoYXNoKSkge1xuICAgICAgICAgICAgdmFyIGNvbnRhaW5lciA9IGNvbnRhaW5lcnNbaGFzaF07XG4gICAgICAgICAgICB2YXIgdG90YWwgPSAwO1xuICAgICAgICAgICAgdmFyIGNvbnRhaW5lclJlYWN0aW9ucyA9IGNvbnRhaW5lci5yZWFjdGlvbnM7XG4gICAgICAgICAgICBpZiAoY29udGFpbmVyUmVhY3Rpb25zKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb250YWluZXJSZWFjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdG90YWwgPSB0b3RhbCArIGNvbnRhaW5lclJlYWN0aW9uc1tpXS5jb3VudDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb250YWluZXIucmVhY3Rpb25Ub3RhbCA9IHRvdGFsO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gVE9ETyBDb25zaWRlciBzdXBwb3J0aW5nIGluY3JlbWVudGFsIHVwZGF0ZSBvZiBkYXRhIHRoYXQgd2UgYWxyZWFkeSBoYXZlIGZyb20gdGhlIHNlcnZlci4gVGhhdCB3b3VsZCBtZWFuIG9ubHlcbiAgICAvLyB1cGRhdGluZyBmaWVsZHMgaW4gdGhlIGxvY2FsIG9iamVjdCBpZiB0aGV5IGV4aXN0IGluIHRoZSBqc29uIGRhdGEuXG4gICAgcGFnZURhdGEuZ3JvdXBJZCA9IGdyb3VwU2V0dGluZ3MuZ3JvdXBJZCgpO1xuICAgIHBhZ2VEYXRhLnBhZ2VJZCA9IGpzb24uaWQ7XG4gICAgcGFnZURhdGEucGFnZUhhc2ggPSBwYWdlSGFzaDtcblxuICAgIHJldHVybiBwYWdlRGF0YTtcbn1cblxuZnVuY3Rpb24gZ2V0Q29udGFpbmVyRGF0YShwYWdlRGF0YSwgY29udGFpbmVySGFzaCkge1xuICAgIHZhciBjb250YWluZXJEYXRhID0gcGFnZURhdGEuY29udGFpbmVyc1tjb250YWluZXJIYXNoXTtcbiAgICBpZiAoIWNvbnRhaW5lckRhdGEpIHtcbiAgICAgICAgY29udGFpbmVyRGF0YSA9IHtcbiAgICAgICAgICAgIGhhc2g6IGNvbnRhaW5lckhhc2gsXG4gICAgICAgICAgICByZWFjdGlvblRvdGFsOiAwLFxuICAgICAgICAgICAgcmVhY3Rpb25zOiBbXVxuICAgICAgICB9O1xuICAgICAgICBwYWdlRGF0YS5jb250YWluZXJzW2NvbnRhaW5lckhhc2hdID0gY29udGFpbmVyRGF0YTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbnRhaW5lckRhdGE7XG59XG5cbi8vIE1lcmdlIHRoZSBnaXZlbiBjb250YWluZXIgZGF0YSBpbnRvIHRoZSBwYWdlRGF0YS5jb250YWluZXJzIGRhdGEuIFRoaXMgaXMgbmVjZXNzYXJ5IGJlY2F1c2UgdGhlIHNrZWxldG9uIG9mIHRoZSBwYWdlRGF0YS5jb250YWluZXJzIG1hcFxuLy8gaXMgc2V0IHVwIGFuZCBib3VuZCB0byB0aGUgVUkgYmVmb3JlIGFsbCB0aGUgZGF0YSBpcyBmZXRjaGVkIGZyb20gdGhlIHNlcnZlciBhbmQgd2UgZG9uJ3Qgd2FudCB0byBicmVhayB0aGUgZGF0YSBiaW5kaW5nLlxuZnVuY3Rpb24gc2V0Q29udGFpbmVycyhwYWdlRGF0YSwgY29udGFpbmVycykge1xuICAgIGZvciAodmFyIGhhc2ggaW4gY29udGFpbmVycykge1xuICAgICAgICBpZiAoY29udGFpbmVycy5oYXNPd25Qcm9wZXJ0eShoYXNoKSkge1xuICAgICAgICAgICAgdmFyIGNvbnRhaW5lckRhdGEgPSBnZXRDb250YWluZXJEYXRhKHBhZ2VEYXRhLCBoYXNoKTtcbiAgICAgICAgICAgIHZhciBmZXRjaGVkQ29udGFpbmVyRGF0YSA9IGNvbnRhaW5lcnNbaGFzaF07XG4gICAgICAgICAgICBjb250YWluZXJEYXRhLmlkID0gZmV0Y2hlZENvbnRhaW5lckRhdGEuaWQ7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGZldGNoZWRDb250YWluZXJEYXRhLnJlYWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGNvbnRhaW5lckRhdGEucmVhY3Rpb25zLnB1c2goZmV0Y2hlZENvbnRhaW5lckRhdGEucmVhY3Rpb25zW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gcmVnaXN0ZXJSZWFjdGlvbihyZWFjdGlvbiwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEpIHtcbiAgICB2YXIgZXhpc3RpbmdSZWFjdGlvbnMgPSBjb250YWluZXJEYXRhLnJlYWN0aW9ucztcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGV4aXN0aW5nUmVhY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChleGlzdGluZ1JlYWN0aW9uc1tpXS5pZCA9PT0gcmVhY3Rpb24uaWQpIHtcbiAgICAgICAgICAgIC8vIFRoaXMgcmVhY3Rpb24gaGFzIGFscmVhZHkgYmVlbiBhZGRlZCB0byB0aGlzIGNvbnRhaW5lci4gRG9uJ3QgYWRkIGl0IGFnYWluLlxuICAgICAgICAgICAgcmV0dXJuIGV4aXN0aW5nUmVhY3Rpb25zW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIGNvbnRhaW5lckRhdGEucmVhY3Rpb25zLnB1c2gocmVhY3Rpb24pO1xuICAgIGNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbCA9IGNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbCArIDE7XG4gICAgdmFyIHN1bW1hcnlSZWFjdGlvbiA9IHtcbiAgICAgICAgdGV4dDogcmVhY3Rpb24udGV4dCxcbiAgICAgICAgaWQ6IHJlYWN0aW9uLmlkLFxuICAgICAgICBjb3VudDogcmVhY3Rpb24uY291bnRcbiAgICB9O1xuICAgIHBhZ2VEYXRhLnN1bW1hcnlSZWFjdGlvbnMucHVzaChzdW1tYXJ5UmVhY3Rpb24pO1xuICAgIHBhZ2VEYXRhLnN1bW1hcnlUb3RhbCA9IHBhZ2VEYXRhLnN1bW1hcnlUb3RhbCArIDE7XG4gICAgcmV0dXJuIHJlYWN0aW9uO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgZ2V0UGFnZURhdGE6IGdldFBhZ2VEYXRhLFxuICAgIHVwZGF0ZUFsbFBhZ2VEYXRhOiB1cGRhdGVBbGxQYWdlRGF0YSxcbiAgICBnZXRDb250YWluZXJEYXRhOiBnZXRDb250YWluZXJEYXRhLFxuICAgIHJlZ2lzdGVyUmVhY3Rpb246IHJlZ2lzdGVyUmVhY3Rpb25cbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgSGFzaCA9IHJlcXVpcmUoJy4vdXRpbHMvaGFzaCcpO1xudmFyIFBhZ2VVdGlscyA9IHJlcXVpcmUoJy4vdXRpbHMvcGFnZS11dGlscycpO1xudmFyIFdpZGdldEJ1Y2tldCA9IHJlcXVpcmUoJy4vdXRpbHMvd2lkZ2V0LWJ1Y2tldCcpO1xuXG52YXIgSW5kaWNhdG9yV2lkZ2V0ID0gcmVxdWlyZSgnLi9pbmRpY2F0b3Itd2lkZ2V0Jyk7XG52YXIgSW1hZ2VJbmRpY2F0b3JXaWRnZXQgPSByZXF1aXJlKCcuL2ltYWdlLWluZGljYXRvci13aWRnZXQnKTtcbnZhciBQYWdlRGF0YSA9IHJlcXVpcmUoJy4vcGFnZS1kYXRhJyk7XG52YXIgU3VtbWFyeVdpZGdldCA9IHJlcXVpcmUoJy4vc3VtbWFyeS13aWRnZXQnKTtcbnZhciBUZXh0UmVhY3Rpb25zID0gcmVxdWlyZSgnLi90ZXh0LXJlYWN0aW9ucycpO1xuXG5cbi8vIFNjYW4gZm9yIGFsbCBwYWdlcyBhdCB0aGUgY3VycmVudCBicm93c2VyIGxvY2F0aW9uLiBUaGlzIGNvdWxkIGp1c3QgYmUgdGhlIGN1cnJlbnQgcGFnZSBvciBpdCBjb3VsZCBiZSBhIGNvbGxlY3Rpb25cbi8vIG9mIHBhZ2VzIChha2EgJ3Bvc3RzJykuXG5mdW5jdGlvbiBzY2FuQWxsUGFnZXMoZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciAkcGFnZXMgPSAkKGdyb3VwU2V0dGluZ3MucGFnZVNlbGVjdG9yKCkpO1xuICAgIGlmICgkcGFnZXMubGVuZ3RoID09IDApIHtcbiAgICAgICAgLy8gSWYgd2UgZG9uJ3QgZGV0ZWN0IGFueSBwYWdlIG1hcmtlcnMsIHRyZWF0IHRoZSB3aG9sZSBkb2N1bWVudCBhcyB0aGUgc2luZ2xlIHBhZ2VcbiAgICAgICAgJHBhZ2VzID0gJCgnYm9keScpOyAvLyBUT0RPIElzIHRoaXMgdGhlIHJpZ2h0IGJlaGF2aW9yP1xuICAgIH1cbiAgICAkcGFnZXMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRwYWdlID0gJCh0aGlzKTtcbiAgICAgICAgc2NhblBhZ2UoJHBhZ2UsIGdyb3VwU2V0dGluZ3MpO1xuICAgIH0pO1xufVxuXG4vLyBTY2FuIHRoZSBwYWdlIHVzaW5nIHRoZSBnaXZlbiBzZXR0aW5nczpcbi8vIDEuIEZpbmQgYWxsIHRoZSBjb250YWluZXJzIHRoYXQgd2UgY2FyZSBhYm91dC5cbi8vIDIuIENvbXB1dGUgaGFzaGVzIGZvciBlYWNoIGNvbnRhaW5lci5cbi8vIDMuIEluc2VydCB3aWRnZXQgYWZmb3JkYW5jZXMgZm9yIGVhY2ggd2hpY2ggYXJlIGJvdW5kIHRvIHRoZSBkYXRhIG1vZGVsIGJ5IHRoZSBoYXNoZXMuXG5mdW5jdGlvbiBzY2FuUGFnZSgkcGFnZSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciB1cmwgPSBQYWdlVXRpbHMuY29tcHV0ZVBhZ2VVcmwoJHBhZ2UsIGdyb3VwU2V0dGluZ3MpO1xuICAgIHZhciB1cmxIYXNoID0gSGFzaC5oYXNoVXJsKHVybCk7XG4gICAgdmFyIHBhZ2VEYXRhID0gUGFnZURhdGEuZ2V0UGFnZURhdGEodXJsSGFzaCk7XG5cbiAgICAvLyBGaXJzdCwgc2NhbiBmb3IgZWxlbWVudHMgdGhhdCB3b3VsZCBjYXVzZSB1cyB0byBpbnNlcnQgc29tZXRoaW5nIGludG8gdGhlIERPTSB0aGF0IHRha2VzIHVwIHNwYWNlLlxuICAgIC8vIFdlIHdhbnQgdG8gZ2V0IGFueSBwYWdlIHJlc2l6aW5nIG91dCBvZiB0aGUgd2F5IGFzIGVhcmx5IGFzIHBvc3NpYmxlLlxuICAgIC8vIFRPRE86IENvbnNpZGVyIGRvaW5nIHRoaXMgd2l0aCByYXcgSmF2YXNjcmlwdCBiZWZvcmUgalF1ZXJ5IGxvYWRzLCB0byBmdXJ0aGVyIHJlZHVjZSB0aGUgZGVsYXkuIFdlIHdvdWxkbid0XG4gICAgLy8gc2F2ZSBhICp0b24qIG9mIHRpbWUgZnJvbSB0aGlzLCB0aG91Z2gsIHNvIGl0J3MgZGVmaW5pdGVseSBhIGxhdGVyIG9wdGltaXphdGlvbi5cbiAgICBzY2FuRm9yU3VtbWFyaWVzKCRwYWdlLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgc2NhbkZvckNhbGxzVG9BY3Rpb24oJHBhZ2UsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcblxuICAgIHZhciAkYWN0aXZlU2VjdGlvbnMgPSAkcGFnZS5maW5kKGdyb3VwU2V0dGluZ3MuYWN0aXZlU2VjdGlvbnMoKSk7XG4gICAgJGFjdGl2ZVNlY3Rpb25zLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkc2VjdGlvbiA9ICQodGhpcyk7XG4gICAgICAgIC8vIFRoZW4gc2NhbiBmb3IgZXZlcnl0aGluZyBlbHNlXG4gICAgICAgIHNjYW5Gb3JUZXh0KCRzZWN0aW9uLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIHNjYW5Gb3JJbWFnZXMoJHNlY3Rpb24sIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgc2NhbkZvck1lZGlhKCRzZWN0aW9uLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIHNjYW5Gb3JTdW1tYXJpZXMoJGVsZW1lbnQsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyICRzdW1tYXJpZXMgPSAkZWxlbWVudC5maW5kKGdyb3VwU2V0dGluZ3Muc3VtbWFyeVNlbGVjdG9yKCkpO1xuICAgICRzdW1tYXJpZXMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRzdW1tYXJ5ID0gJCh0aGlzKTtcbiAgICAgICAgdmFyIGNvbnRhaW5lciA9ICQoJzxkaXYgY2xhc3M9XCJhbnQtc3VtbWFyeS1jb250YWluZXJcIj48L2Rpdj4nKTtcbiAgICAgICAgdmFyIGNvbnRhaW5lckRhdGEgPSBQYWdlRGF0YS5nZXRDb250YWluZXJEYXRhKHBhZ2VEYXRhLCAncGFnZScpOyAvLyBNYWdpYyBoYXNoIGZvciBwYWdlIHJlYWN0aW9uc1xuICAgICAgICBjb250YWluZXJEYXRhLnR5cGUgPSAncGFnZSc7IC8vIFRPRE86IHJldmlzaXQgd2hldGhlciBpdCBtYWtlcyBzZW5zZSB0byBzZXQgdGhlIHR5cGUgaGVyZVxuICAgICAgICB2YXIgZGVmYXVsdFJlYWN0aW9ucyA9IGdyb3VwU2V0dGluZ3MuZGVmYXVsdFJlYWN0aW9ucygkc3VtbWFyeSk7IC8vIFRPRE86IGRvIHdlIHN1cHBvcnQgY3VzdG9taXppbmcgdGhlIGRlZmF1bHQgcmVhY3Rpb25zIGF0IHRoaXMgbGV2ZWw/XG4gICAgICAgIFN1bW1hcnlXaWRnZXQuY3JlYXRlKGNvbnRhaW5lciwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGRlZmF1bHRSZWFjdGlvbnMsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICBpbnNlcnRDb250ZW50KCRzdW1tYXJ5LCBjb250YWluZXIsIGdyb3VwU2V0dGluZ3Muc3VtbWFyeU1ldGhvZCgpKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gc2NhbkZvckNhbGxzVG9BY3Rpb24oJHNlY3Rpb24sIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgLy8gVE9ET1xufVxuXG5mdW5jdGlvbiBzY2FuRm9yVGV4dCgkc2VjdGlvbiwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgJHRleHRFbGVtZW50cyA9ICRzZWN0aW9uLmZpbmQoZ3JvdXBTZXR0aW5ncy50ZXh0U2VsZWN0b3IoKSk7XG4gICAgLy8gVE9ETzogb25seSBzZWxlY3QgXCJsZWFmXCIgZWxlbWVudHNcbiAgICAkdGV4dEVsZW1lbnRzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkdGV4dEVsZW1lbnQgPSAkKHRoaXMpO1xuICAgICAgICB2YXIgaGFzaCA9IEhhc2guaGFzaFRleHQoJHRleHRFbGVtZW50KTtcbiAgICAgICAgdmFyIGNvbnRhaW5lckRhdGEgPSBQYWdlRGF0YS5nZXRDb250YWluZXJEYXRhKHBhZ2VEYXRhLCBoYXNoKTtcbiAgICAgICAgY29udGFpbmVyRGF0YS50eXBlID0gJ3RleHQnOyAvLyBUT0RPOiByZXZpc2l0IHdoZXRoZXIgaXQgbWFrZXMgc2Vuc2UgdG8gc2V0IHRoZSB0eXBlIGhlcmVcbiAgICAgICAgdmFyIGRlZmF1bHRSZWFjdGlvbnMgPSBncm91cFNldHRpbmdzLmRlZmF1bHRSZWFjdGlvbnMoJHRleHRFbGVtZW50KTtcbiAgICAgICAgdmFyICRpbmRpY2F0b3JFbGVtZW50ID0gSW5kaWNhdG9yV2lkZ2V0LmNyZWF0ZSh7XG4gICAgICAgICAgICBlbGVtZW50OiAkKCc8ZGl2PicpLCAvLyByZW5kZXIgdGhlIHRlbXBsYXRlIGludG8gYSBkdW1teSBub2RlLiBUaGUgY3JlYXRlIGZ1bmN0aW9uIHdpbGwgcmV0dXJuIHRoZSBub2RlIHRoYXQgaXMgY3JlYXRlZCBmcm9tIHRoZSB0ZW1wbGF0ZS5cbiAgICAgICAgICAgIGNvbnRhaW5lckRhdGE6IGNvbnRhaW5lckRhdGEsXG4gICAgICAgICAgICBjb250YWluZXJFbGVtZW50OiAkdGV4dEVsZW1lbnQsXG4gICAgICAgICAgICBkZWZhdWx0UmVhY3Rpb25zOiBkZWZhdWx0UmVhY3Rpb25zLFxuICAgICAgICAgICAgcGFnZURhdGE6IHBhZ2VEYXRhLFxuICAgICAgICAgICAgZ3JvdXBTZXR0aW5nczogZ3JvdXBTZXR0aW5nc31cbiAgICAgICAgKTtcbiAgICAgICAgJHRleHRFbGVtZW50LmFwcGVuZCgkaW5kaWNhdG9yRWxlbWVudCk7IC8vIFRPRE8gaXMgdGhpcyBjb25maWd1cmFibGUgYWxhIGluc2VydENvbnRlbnQoLi4uKT9cblxuICAgICAgICBUZXh0UmVhY3Rpb25zLmNyZWF0ZVJlYWN0YWJsZVRleHQoe1xuICAgICAgICAgICAgY29udGFpbmVyRGF0YTogY29udGFpbmVyRGF0YSxcbiAgICAgICAgICAgIGNvbnRhaW5lckVsZW1lbnQ6ICR0ZXh0RWxlbWVudCxcbiAgICAgICAgICAgIGRlZmF1bHRSZWFjdGlvbnM6IGRlZmF1bHRSZWFjdGlvbnMsXG4gICAgICAgICAgICBwYWdlRGF0YTogcGFnZURhdGEsXG4gICAgICAgICAgICBncm91cFNldHRpbmdzOiBncm91cFNldHRpbmdzLFxuICAgICAgICAgICAgZXhjbHVkZU5vZGU6ICRpbmRpY2F0b3JFbGVtZW50LmdldCgwKVxuICAgICAgICB9KTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gc2NhbkZvckltYWdlcygkc2VjdGlvbiwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgJGltYWdlRWxlbWVudHMgPSAkc2VjdGlvbi5maW5kKGdyb3VwU2V0dGluZ3MuaW1hZ2VTZWxlY3RvcigpKTsgLy8gVE9ETyBhbHNvIHNlbGVjdCBmb3IgYXR0cmlidXRlIG92ZXJyaWRlLiBpLmUuOiAnaW1nLFthbnQtaXRlbS10eXBlPVwiaW1hZ2VcIl0nXG4gICAgJGltYWdlRWxlbWVudHMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRpbWFnZUVsZW1lbnQgPSAkKHRoaXMpO1xuICAgICAgICB2YXIgaW1hZ2VVcmwgPSBnZXRJbWFnZVVybCgkaW1hZ2VFbGVtZW50KTtcbiAgICAgICAgdmFyIGhhc2ggPSBIYXNoLmhhc2hJbWFnZShpbWFnZVVybCk7XG4gICAgICAgIHZhciBjb250YWluZXJEYXRhID0gUGFnZURhdGEuZ2V0Q29udGFpbmVyRGF0YShwYWdlRGF0YSwgaGFzaCk7XG4gICAgICAgIGNvbnRhaW5lckRhdGEudHlwZSA9ICdpbWFnZSc7IC8vIFRPRE86IHJldmlzaXQgd2hldGhlciBpdCBtYWtlcyBzZW5zZSB0byBzZXQgdGhlIHR5cGUgaGVyZVxuICAgICAgICB2YXIgZGVmYXVsdFJlYWN0aW9ucyA9IGdyb3VwU2V0dGluZ3MuZGVmYXVsdFJlYWN0aW9ucygkaW1hZ2VFbGVtZW50KTtcbiAgICAgICAgdmFyIGltYWdlT2Zmc2V0ID0gJGltYWdlRWxlbWVudC5vZmZzZXQoKTtcbiAgICAgICAgdmFyIGNvb3JkcyA9IHtcbiAgICAgICAgICAgIGJvdHRvbTogaW1hZ2VPZmZzZXQudG9wICsgJGltYWdlRWxlbWVudC5oZWlnaHQoKSwgLy8gVE9ETyBwdWxsIGZyb20gc2V0dGluZ3MvZWxlbWVudFxuICAgICAgICAgICAgbGVmdDogaW1hZ2VPZmZzZXQubGVmdFxuICAgICAgICB9O1xuICAgICAgICB2YXIgZGltZW5zaW9ucyA9IHtcbiAgICAgICAgICAgIGhlaWdodDogJGltYWdlRWxlbWVudC5oZWlnaHQoKSwgLy8gVE9ETzogcmV2aWV3IGhvdyB3ZSBnZXQgdGhlIGltYWdlIGRpbWVuc2lvbnNcbiAgICAgICAgICAgIHdpZHRoOiAkaW1hZ2VFbGVtZW50LndpZHRoKClcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKGRpbWVuc2lvbnMuaGVpZ2h0ID49IDEwMCAmJiBkaW1lbnNpb25zLndpZHRoID49IDEwMCkgeyAvLyBEb24ndCBjcmVhdGUgaW5kaWNhdG9yIG9uIGltYWdlcyB0aGF0IGFyZSB0b28gc21hbGxcbiAgICAgICAgICAgIEltYWdlSW5kaWNhdG9yV2lkZ2V0LmNyZWF0ZSh7XG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQ6IFdpZGdldEJ1Y2tldCgpLFxuICAgICAgICAgICAgICAgICAgICBjb29yZHM6IGNvb3JkcyxcbiAgICAgICAgICAgICAgICAgICAgaW1hZ2VVcmw6IGltYWdlVXJsLFxuICAgICAgICAgICAgICAgICAgICBpbWFnZURpbWVuc2lvbnM6IGRpbWVuc2lvbnMsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lckRhdGE6IGNvbnRhaW5lckRhdGEsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lckVsZW1lbnQ6ICRpbWFnZUVsZW1lbnQsXG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHRSZWFjdGlvbnM6IGRlZmF1bHRSZWFjdGlvbnMsXG4gICAgICAgICAgICAgICAgICAgIHBhZ2VEYXRhOiBwYWdlRGF0YSxcbiAgICAgICAgICAgICAgICAgICAgZ3JvdXBTZXR0aW5nczogZ3JvdXBTZXR0aW5nc1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gZ2V0SW1hZ2VVcmwoJGVsZW1lbnQpIHtcbiAgICB2YXIgY29udGVudCA9ICRlbGVtZW50LmF0dHIoJ2FudC1lbGVtZW50LWNvbnRlbnQnKTsgLy8gVE9ETyBhbGxvdyB0aGlzIG92ZXJyaWRlIGV2ZXJ5d2hlcmVcbiAgICBpZiAoIWNvbnRlbnQpIHtcbiAgICAgICAgY29udGVudCA9ICRlbGVtZW50LmF0dHIoJ3NyYycpOyAvLyBUT0RPIGNsZWFuIHVwIFVSTD9cbiAgICAgICAgaWYgKGNvbnRlbnQuaW5kZXhPZignLycpID09PSAwKXtcbiAgICAgICAgICAgIGNvbnRlbnQgPSB3aW5kb3cubG9jYXRpb24ub3JpZ2luICsgY29udGVudDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY29udGVudC5pbmRleE9mKCdodHRwJykgIT09IDApe1xuICAgICAgICAgICAgY29udGVudCA9IHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4gKyB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUgKyBjb250ZW50O1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBjb250ZW50O1xufVxuXG5mdW5jdGlvbiBzY2FuRm9yTWVkaWEoJHNlY3Rpb24sIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgLy8gVE9ET1xufVxuXG5mdW5jdGlvbiBpbnNlcnRDb250ZW50KCRwYXJlbnQsIGNvbnRlbnQsIG1ldGhvZCkge1xuICAgIHN3aXRjaCAobWV0aG9kKSB7XG4gICAgICAgIGNhc2UgJ2FwcGVuZCc6XG4gICAgICAgICAgICAkcGFyZW50LmFwcGVuZChjb250ZW50KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdwcmVwZW5kJzpcbiAgICAgICAgICAgICRwYXJlbnQucHJlcGVuZChjb250ZW50KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdiZWZvcmUnOlxuICAgICAgICAgICAgJHBhcmVudC5iZWZvcmUoY29udGVudCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnYWZ0ZXInOlxuICAgICAgICAgICAgJHBhcmVudC5hZnRlcihjb250ZW50KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgIH1cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgc2Nhbjogc2NhbkFsbFBhZ2VzXG59OyIsInZhciAkOyByZXF1aXJlKCcuL3V0aWxzL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIFdpZGdldEJ1Y2tldCA9IHJlcXVpcmUoJy4vdXRpbHMvd2lkZ2V0LWJ1Y2tldCcpO1xudmFyIFRyYW5zaXRpb25VdGlsID0gcmVxdWlyZSgnLi91dGlscy90cmFuc2l0aW9uLXV0aWwnKTtcblxudmFyIHJhY3RpdmU7XG52YXIgY2xpY2tIYW5kbGVyO1xuXG5cbmZ1bmN0aW9uIGdldFJvb3RFbGVtZW50KCkge1xuICAgIC8vIFRPRE8gcmV2aXNpdCB0aGlzLCBpdCdzIGtpbmQgb2YgZ29vZnkgYW5kIGl0IG1pZ2h0IGhhdmUgYSB0aW1pbmcgcHJvYmxlbVxuICAgIGlmICghcmFjdGl2ZSkge1xuICAgICAgICB2YXIgYnVja2V0ID0gV2lkZ2V0QnVja2V0KCk7XG4gICAgICAgIHJhY3RpdmUgPSBSYWN0aXZlKHtcbiAgICAgICAgICAgIGVsOiBidWNrZXQsXG4gICAgICAgICAgICBhcHBlbmQ6IHRydWUsXG4gICAgICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL3BvcHVwLXdpZGdldC5oYnMuaHRtbCcpXG4gICAgICAgIH0pO1xuICAgICAgICB2YXIgJGVsZW1lbnQgPSAkKHJhY3RpdmUuZmluZCgnLmFudGVubmEtcG9wdXAnKSk7XG4gICAgICAgICRlbGVtZW50Lm9uKCdtb3VzZWRvd24nLCBmYWxzZSk7IC8vIFByZXZlbnQgbW91c2Vkb3duIGZyb20gcHJvcGFnYXRpbmcsIHNvIHRoZSBicm93c2VyIGRvZXNuJ3QgY2xlYXIgdGhlIHRleHQgc2VsZWN0aW9uLlxuICAgICAgICAkZWxlbWVudC5vbignY2xpY2suYW50ZW5uYS1wb3B1cCcsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIGhpZGVQb3B1cCgkZWxlbWVudCk7XG4gICAgICAgICAgICBpZiAoY2xpY2tIYW5kbGVyKSB7XG4gICAgICAgICAgICAgICAgY2xpY2tIYW5kbGVyKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gJGVsZW1lbnQ7XG4gICAgfVxuICAgIHJldHVybiAkKHJhY3RpdmUuZmluZCgnLmFudGVubmEtcG9wdXAnKSk7XG59XG5cbmZ1bmN0aW9uIHNob3dQb3B1cChjb29yZGluYXRlcywgY2FsbGJhY2spIHtcbiAgICB2YXIgJGVsZW1lbnQgPSBnZXRSb290RWxlbWVudCgpO1xuICAgIGlmICghJGVsZW1lbnQuaGFzQ2xhc3MoJ3Nob3cnKSkge1xuICAgICAgICBjbGlja0hhbmRsZXIgPSBjYWxsYmFjaztcbiAgICAgICAgJGVsZW1lbnRcbiAgICAgICAgICAgIC5zaG93KCkgLy8gc3RpbGwgaGFzIG9wYWNpdHkgMCBhdCB0aGlzIHBvaW50XG4gICAgICAgICAgICAuY3NzKHtcbiAgICAgICAgICAgICAgICB0b3A6IGNvb3JkaW5hdGVzLnRvcCAtICRlbGVtZW50Lm91dGVySGVpZ2h0KCkgLSA2LCAvLyBUT0RPIGZpbmQgYSBjbGVhbmVyIHdheSB0byBhY2NvdW50IGZvciB0aGUgcG9wdXAgJ3RhaWwnXG4gICAgICAgICAgICAgICAgbGVmdDogY29vcmRpbmF0ZXMubGVmdCAtIE1hdGguZmxvb3IoJGVsZW1lbnQub3V0ZXJXaWR0aCgpIC8gMilcbiAgICAgICAgICAgIH0pO1xuICAgICAgICBUcmFuc2l0aW9uVXRpbC50b2dnbGVDbGFzcygkZWxlbWVudCwgJ3Nob3cnLCB0cnVlLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIFRPRE86IGFmdGVyIHRoZSBhcHBlYXJhbmNlIHRyYW5zaXRpb24gaXMgY29tcGxldGUsIGFkZCBhIGhhbmRsZXIgZm9yIG1vdXNlZW50ZXIgd2hpY2ggdGhlbiByZWdpc3RlcnNcbiAgICAgICAgICAgIC8vICAgICAgIGEgaGFuZGxlciBmb3IgbW91c2VsZWF2ZSB0aGF0IGhpZGVzIHRoZSBwb3B1cFxuXG4gICAgICAgICAgICAvLyBUT0RPOiBhbHNvIHRha2UgZG93biB0aGUgcG9wdXAgaWYgdGhlIHVzZXIgbW91c2VzIG92ZXIgYW5vdGhlciB3aWRnZXQgKHN1bW1hcnkgb3IgaW5kaWNhdG9yKVxuICAgICAgICAgICAgJChkb2N1bWVudCkub24oJ2NsaWNrLmFudGVubmEtcG9wdXAnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaGlkZVBvcHVwKCRlbGVtZW50KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGhpZGVQb3B1cCgkZWxlbWVudCkge1xuICAgIFRyYW5zaXRpb25VdGlsLnRvZ2dsZUNsYXNzKCRlbGVtZW50LCAnc2hvdycsIGZhbHNlLCBmdW5jdGlvbigpIHtcbiAgICAgICAgJGVsZW1lbnQuaGlkZSgpOyAvLyBhZnRlciB3ZSdyZSBhdCBvcGFjaXR5IDAsIGhpZGUgdGhlIGVsZW1lbnQgc28gaXQgZG9lc24ndCByZWNlaXZlIGFjY2lkZW50YWwgY2xpY2tzXG4gICAgfSk7XG4gICAgJChkb2N1bWVudCkub2ZmKCdjbGljay5hbnRlbm5hLXBvcHVwJyk7XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBzaG93OiBzaG93UG9wdXBcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgQWpheENsaWVudCA9IHJlcXVpcmUoJy4vdXRpbHMvYWpheC1jbGllbnQnKTtcbnZhciBSYW5nZSA9IHJlcXVpcmUoJy4vdXRpbHMvcmFuZ2UnKTtcbnZhciBSZWFjdGlvbnNXaWRnZXRMYXlvdXRVdGlscyA9IHJlcXVpcmUoJy4vdXRpbHMvcmVhY3Rpb25zLXdpZGdldC1sYXlvdXQtdXRpbHMnKTtcblxudmFyIHBhZ2VTZWxlY3RvciA9ICcuYW50ZW5uYS1yZWFjdGlvbnMtcGFnZSc7XG5cbmZ1bmN0aW9uIGNyZWF0ZVBhZ2Uob3B0aW9ucykge1xuICAgIHZhciByZWFjdGlvbnNEYXRhID0gb3B0aW9ucy5yZWFjdGlvbnNEYXRhO1xuICAgIHZhciBjb250YWluZXJEYXRhID0gb3B0aW9ucy5jb250YWluZXJEYXRhO1xuICAgIHZhciBwYWdlRGF0YSA9IG9wdGlvbnMucGFnZURhdGE7XG4gICAgdmFyIGNvbnRlbnREYXRhID0gb3B0aW9ucy5jb250ZW50RGF0YTtcbiAgICB2YXIgY29udGFpbmVyRWxlbWVudCA9IG9wdGlvbnMuY29udGFpbmVyRWxlbWVudDsgLy8gb3B0aW9uYWxcbiAgICAvL3ZhciBzaG93UHJvZ3Jlc3MgPSBvcHRpb25zLnNob3dQcm9ncmVzcztcbiAgICB2YXIgc2hvd0NvbmZpcm1hdGlvbiA9IG9wdGlvbnMuc2hvd0NvbmZpcm1hdGlvbjtcbiAgICB2YXIgc2hvd0RlZmF1bHRzID0gb3B0aW9ucy5zaG93RGVmYXVsdHM7XG4gICAgdmFyIHNob3dDb21tZW50cyA9IG9wdGlvbnMuc2hvd0NvbW1lbnRzO1xuICAgIHZhciBlbGVtZW50ID0gb3B0aW9ucy5lbGVtZW50O1xuICAgIHZhciBjb2xvcnMgPSBvcHRpb25zLmNvbG9ycztcbiAgICBzb3J0UmVhY3Rpb25EYXRhKHJlYWN0aW9uc0RhdGEpO1xuICAgIHZhciByZWFjdGlvbnNMYXlvdXREYXRhID0gUmVhY3Rpb25zV2lkZ2V0TGF5b3V0VXRpbHMuY29tcHV0ZUxheW91dERhdGEocmVhY3Rpb25zRGF0YSwgY29sb3JzKTtcbiAgICB2YXIgcmFjdGl2ZSA9IFJhY3RpdmUoe1xuICAgICAgICBlbDogZWxlbWVudCxcbiAgICAgICAgYXBwZW5kOiB0cnVlLFxuICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL3JlYWN0aW9ucy1wYWdlLmhicy5odG1sJyksXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIHJlYWN0aW9uczogcmVhY3Rpb25zRGF0YSxcbiAgICAgICAgICAgIHJlYWN0aW9uc0xheW91dENsYXNzOiBhcnJheUFjY2Vzc29yKHJlYWN0aW9uc0xheW91dERhdGEubGF5b3V0Q2xhc3NlcyksXG4gICAgICAgICAgICByZWFjdGlvbnNCYWNrZ3JvdW5kQ29sb3I6IGFycmF5QWNjZXNzb3IocmVhY3Rpb25zTGF5b3V0RGF0YS5iYWNrZ3JvdW5kQ29sb3JzKVxuICAgICAgICB9LFxuICAgICAgICBkZWNvcmF0b3JzOiB7XG4gICAgICAgICAgICBzaXpldG9maXQ6IHNpemVUb0ZpdFxuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICBpZiAoY29udGFpbmVyRWxlbWVudCkge1xuICAgICAgICByYWN0aXZlLm9uKCdoaWdobGlnaHQnLCBoaWdobGlnaHRDb250ZW50KGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBjb250YWluZXJFbGVtZW50KSk7XG4gICAgICAgIHJhY3RpdmUub24oJ2NsZWFyaGlnaGxpZ2h0cycsIFJhbmdlLmNsZWFySGlnaGxpZ2h0cyk7XG4gICAgfVxuICAgIHJhY3RpdmUub24oJ3BsdXNvbmUnLCBwbHVzT25lKGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBzaG93Q29uZmlybWF0aW9uKSk7XG4gICAgcmFjdGl2ZS5vbignc2hvd2RlZmF1bHQnLCBzaG93RGVmYXVsdHMpO1xuICAgIHJhY3RpdmUub24oJ3Nob3djb21tZW50cycsIGZ1bmN0aW9uKHJhY3RpdmVFdmVudCkgeyBzaG93Q29tbWVudHMocmFjdGl2ZUV2ZW50LmNvbnRleHQpOyByZXR1cm4gZmFsc2U7IH0pOyAvLyBUT0RPIGNsZWFuIHVwXG4gICAgcmV0dXJuIHtcbiAgICAgICAgc2VsZWN0b3I6IHBhZ2VTZWxlY3RvcixcbiAgICAgICAgdGVhcmRvd246IGZ1bmN0aW9uKCkgeyByYWN0aXZlLnRlYXJkb3duKCk7IH1cbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gYXJyYXlBY2Nlc3NvcihhcnJheSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oaW5kZXgpIHtcbiAgICAgICAgICAgIHJldHVybiBhcnJheVtpbmRleF07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzb3J0UmVhY3Rpb25EYXRhKHJlYWN0aW9ucykge1xuICAgICAgICByZWFjdGlvbnMuc29ydChmdW5jdGlvbihyZWFjdGlvbkEsIHJlYWN0aW9uQikge1xuICAgICAgICAgICByZXR1cm4gcmVhY3Rpb25CLmNvdW50IC0gcmVhY3Rpb25BLmNvdW50O1xuICAgICAgICB9KTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHNpemVUb0ZpdChub2RlKSB7XG4gICAgdmFyICRlbGVtZW50ID0gJChub2RlKS5jbG9zZXN0KCcuYW50ZW5uYS1yZWFjdGlvbi1ib3gnKTtcbiAgICB2YXIgJHJlYWN0aW9uQ291bnQgPSAkZWxlbWVudC5maW5kKCcuYW50ZW5uYS1yZWFjdGlvbi1jb3VudCcpO1xuICAgIHZhciAkcGx1c09uZSA9ICRlbGVtZW50LmZpbmQoJy5hbnRlbm5hLXBsdXNvbmUnKTtcbiAgICB2YXIgbWluV2lkdGggPSBNYXRoLm1heCgkcmVhY3Rpb25Db3VudC53aWR0aCgpLCAkcGx1c09uZS53aWR0aCgpKTtcbiAgICAkcmVhY3Rpb25Db3VudC5jc3MoeyAnbWluLXdpZHRoJzogbWluV2lkdGggfSk7XG4gICAgJHBsdXNPbmUuY3NzKHsgJ21pbi13aWR0aCc6IG1pbldpZHRoIH0pO1xuICAgIHJldHVybiBSZWFjdGlvbnNXaWRnZXRMYXlvdXRVdGlscy5zaXplVG9GaXQobm9kZSk7XG59XG5cbmZ1bmN0aW9uIHJvb3RFbGVtZW50KHJhY3RpdmUpIHtcbiAgICByZXR1cm4gcmFjdGl2ZS5maW5kKHBhZ2VTZWxlY3Rvcik7XG59XG5cbmZ1bmN0aW9uIGhpZ2hsaWdodENvbnRlbnQoY29udGFpbmVyRGF0YSwgcGFnZURhdGEsICRjb250YWluZXJFbGVtZW50KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHZhciByZWFjdGlvbkRhdGEgPSBldmVudC5jb250ZXh0O1xuICAgICAgICBpZiAocmVhY3Rpb25EYXRhLmNvbnRlbnQpIHtcbiAgICAgICAgICAgIHZhciBsb2NhdGlvbiA9IHJlYWN0aW9uRGF0YS5jb250ZW50LmxvY2F0aW9uO1xuICAgICAgICAgICAgaWYgKGxvY2F0aW9uKSB7XG4gICAgICAgICAgICAgICAgUmFuZ2UuaGlnaGxpZ2h0KCRjb250YWluZXJFbGVtZW50LmdldCgwKSwgbG9jYXRpb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBwbHVzT25lKGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBzaG93Q29uZmlybWF0aW9uKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHZhciByZWFjdGlvbkRhdGEgPSBldmVudC5jb250ZXh0O1xuICAgICAgICBzaG93Q29uZmlybWF0aW9uKHJlYWN0aW9uRGF0YSk7XG4gICAgICAgIEFqYXhDbGllbnQucG9zdFBsdXNPbmUocmVhY3Rpb25EYXRhLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgZnVuY3Rpb24oKXt9LypUT0RPKi8sIGVycm9yKTtcblxuICAgICAgICBmdW5jdGlvbiBlcnJvcihtZXNzYWdlKSB7XG4gICAgICAgICAgICAvLyBUT0RPIGhhbmRsZSBhbnkgZXJyb3JzIHRoYXQgb2NjdXIgcG9zdGluZyBhIHJlYWN0aW9uXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcImVycm9yIHBvc3RpbmcgcGx1cyBvbmU6IFwiICsgbWVzc2FnZSk7XG4gICAgICAgIH1cbiAgICB9O1xufVxuXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZTogY3JlYXRlUGFnZVxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi91dGlscy9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciBBamF4Q2xpZW50ID0gcmVxdWlyZSgnLi91dGlscy9hamF4LWNsaWVudCcpO1xudmFyIE1vdmVhYmxlID0gcmVxdWlyZSgnLi91dGlscy9tb3ZlYWJsZScpO1xudmFyIFJhbmdlID0gcmVxdWlyZSgnLi91dGlscy9yYW5nZScpO1xudmFyIFRyYW5zaXRpb25VdGlsID0gcmVxdWlyZSgnLi91dGlscy90cmFuc2l0aW9uLXV0aWwnKTtcbnZhciBVUkxzID0gcmVxdWlyZSgnLi91dGlscy91cmxzJyk7XG52YXIgV2lkZ2V0QnVja2V0ID0gcmVxdWlyZSgnLi91dGlscy93aWRnZXQtYnVja2V0Jyk7XG5cbnZhciBDb21tZW50c1BhZ2UgPSByZXF1aXJlKCcuL2NvbW1lbnRzLXBhZ2UnKTtcbnZhciBDb25maXJtYXRpb25QYWdlID0gcmVxdWlyZSgnLi9jb25maXJtYXRpb24tcGFnZScpO1xudmFyIERlZmF1bHRzUGFnZSA9IHJlcXVpcmUoJy4vZGVmYXVsdHMtcGFnZScpO1xudmFyIFJlYWN0aW9uc1BhZ2UgPSByZXF1aXJlKCcuL3JlYWN0aW9ucy1wYWdlJyk7XG5cbmZ1bmN0aW9uIG9wZW5SZWFjdGlvbnNXaWRnZXQob3B0aW9ucywgZWxlbWVudE9yQ29vcmRzKSB7XG4gICAgdmFyIGRlZmF1bHRSZWFjdGlvbnMgPSBvcHRpb25zLmRlZmF1bHRSZWFjdGlvbnM7XG4gICAgdmFyIHJlYWN0aW9uc0RhdGEgPSBvcHRpb25zLnJlYWN0aW9uc0RhdGE7XG4gICAgdmFyIGNvbnRhaW5lckRhdGEgPSBvcHRpb25zLmNvbnRhaW5lckRhdGE7XG4gICAgdmFyIGNvbnRhaW5lckVsZW1lbnQgPSBvcHRpb25zLmNvbnRhaW5lckVsZW1lbnQ7IC8vIG9wdGlvbmFsXG4gICAgLy8gY29udGVudERhdGEgY29udGFpbnMgZGV0YWlscyBhYm91dCB0aGUgY29udGVudCBiZWluZyByZWFjdGVkIHRvIGxpa2UgdGV4dCByYW5nZSBvciBpbWFnZSBoZWlnaHQvd2lkdGguXG4gICAgLy8gd2UgcG90ZW50aWFsbHkgbW9kaWZ5IHRoaXMgZGF0YSAoZS5nLiBpbiB0aGUgZGVmYXVsdCByZWFjdGlvbiBjYXNlIHdlIHNlbGVjdCB0aGUgdGV4dCBvdXJzZWx2ZXMpIHNvIHdlXG4gICAgLy8gbWFrZSBhIGxvY2FsIGNvcHkgb2YgaXQgdG8gYXZvaWQgdW5leHBlY3RlZGx5IGNoYW5naW5nIGRhdGEgb3V0IGZyb20gdW5kZXIgb25lIG9mIHRoZSBjbGllbnRzXG4gICAgdmFyIGNvbnRlbnREYXRhID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShvcHRpb25zLmNvbnRlbnREYXRhKSk7XG4gICAgdmFyIHBhZ2VEYXRhID0gb3B0aW9ucy5wYWdlRGF0YTtcbiAgICB2YXIgZ3JvdXBTZXR0aW5ncyA9IG9wdGlvbnMuZ3JvdXBTZXR0aW5ncztcbiAgICB2YXIgY29sb3JzID0gZ3JvdXBTZXR0aW5ncy5yZWFjdGlvbkJhY2tncm91bmRDb2xvcnMoKTtcbiAgICB2YXIgcmFjdGl2ZSA9IFJhY3RpdmUoe1xuICAgICAgICBlbDogV2lkZ2V0QnVja2V0KCksXG4gICAgICAgIGFwcGVuZDogdHJ1ZSxcbiAgICAgICAgZGF0YToge30sXG4gICAgICAgIHRlbXBsYXRlOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvcmVhY3Rpb25zLXdpZGdldC5oYnMuaHRtbCcpXG4gICAgfSk7XG4gICAgdmFyICRyb290RWxlbWVudCA9ICQocm9vdEVsZW1lbnQocmFjdGl2ZSkpO1xuICAgIE1vdmVhYmxlLm1ha2VNb3ZlYWJsZSgkcm9vdEVsZW1lbnQsICRyb290RWxlbWVudC5maW5kKCcuYW50ZW5uYS1oZWFkZXInKSk7XG4gICAgdmFyIHBhZ2VzID0gW107XG5cbiAgICBvcGVuV2luZG93KCk7XG5cbiAgICBmdW5jdGlvbiBvcGVuV2luZG93KCkge1xuICAgICAgICAkKCcuYW50ZW5uYS1yZWFjdGlvbnMtd2lkZ2V0JykudHJpZ2dlcignZm9jdXNvdXQnKTsgLy8gUHJvbXB0IGFueSBvdGhlciBvcGVuIHdpbmRvd3MgdG8gY2xvc2UuXG4gICAgICAgIHZhciBjb29yZHM7XG4gICAgICAgIGlmIChlbGVtZW50T3JDb29yZHMudG9wICYmIGVsZW1lbnRPckNvb3Jkcy5sZWZ0KSB7XG4gICAgICAgICAgICBjb29yZHMgPSBlbGVtZW50T3JDb29yZHM7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgJHJlbGF0aXZlRWxlbWVudCA9ICQoZWxlbWVudE9yQ29vcmRzKTtcbiAgICAgICAgICAgIHZhciBvZmZzZXQgPSAkcmVsYXRpdmVFbGVtZW50Lm9mZnNldCgpO1xuICAgICAgICAgICAgY29vcmRzID0ge1xuICAgICAgICAgICAgICAgIHRvcDogb2Zmc2V0LnRvcCxcbiAgICAgICAgICAgICAgICBsZWZ0OiBvZmZzZXQubGVmdFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgaG9yaXpvbnRhbE92ZXJmbG93ID0gY29vcmRzLmxlZnQgKyAkcm9vdEVsZW1lbnQud2lkdGgoKSAtIE1hdGgubWF4KGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRXaWR0aCwgd2luZG93LmlubmVyV2lkdGggfHwgMCk7IC8vIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTI0ODA4MS9nZXQtdGhlLWJyb3dzZXItdmlld3BvcnQtZGltZW5zaW9ucy13aXRoLWphdmFzY3JpcHQvODg3NjA2OSM4ODc2MDY5XG4gICAgICAgIGlmIChob3Jpem9udGFsT3ZlcmZsb3cgPiAwKSB7XG4gICAgICAgICAgICBjb29yZHMubGVmdCA9IGNvb3Jkcy5sZWZ0IC0gaG9yaXpvbnRhbE92ZXJmbG93O1xuICAgICAgICB9XG4gICAgICAgICRyb290RWxlbWVudC5zdG9wKHRydWUsIHRydWUpLmFkZENsYXNzKCdvcGVuJykuY3NzKGNvb3Jkcyk7XG5cbiAgICAgICAgaWYgKHJlYWN0aW9uc0RhdGEubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgc2hvd1JlYWN0aW9uc1BhZ2UoZmFsc2UpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gVE9ETyBhbGxvdyB0byBvdmVycmlkZSBhbmQgZm9yY2Ugc2hvd2luZyBvZiBkZWZhdWx0XG4gICAgICAgICAgICBzaG93RGVmYXVsdFJlYWN0aW9uc1BhZ2UoZmFsc2UpO1xuICAgICAgICB9XG5cbiAgICAgICAgc2V0dXBXaW5kb3dDbG9zZShwYWdlcywgcmFjdGl2ZSk7XG4gICAgICAgIHByZXZlbnRFeHRyYVNjcm9sbCgkcm9vdEVsZW1lbnQpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNob3dSZWFjdGlvbnNQYWdlKGFuaW1hdGUpIHtcbiAgICAgICAgdmFyIG9wdGlvbnMgPSB7XG4gICAgICAgICAgICByZWFjdGlvbnNEYXRhOiByZWFjdGlvbnNEYXRhLFxuICAgICAgICAgICAgcGFnZURhdGE6IHBhZ2VEYXRhLFxuICAgICAgICAgICAgY29udGFpbmVyRGF0YTogY29udGFpbmVyRGF0YSxcbiAgICAgICAgICAgIGNvbnRhaW5lckVsZW1lbnQ6IGNvbnRhaW5lckVsZW1lbnQsXG4gICAgICAgICAgICBjb2xvcnM6IGNvbG9ycyxcbiAgICAgICAgICAgIGNvbnRlbnREYXRhOiBjb250ZW50RGF0YSxcbiAgICAgICAgICAgIHNob3dDb25maXJtYXRpb246IGZ1bmN0aW9uKHJlYWN0aW9uKSB7IHNob3dDb25maXJtUGFnZShyZWFjdGlvbikgfSxcbiAgICAgICAgICAgIHNob3dEZWZhdWx0czogZnVuY3Rpb24oKSB7IHNob3dEZWZhdWx0UmVhY3Rpb25zUGFnZSh0cnVlKSB9LFxuICAgICAgICAgICAgc2hvd0NvbW1lbnRzOiBmdW5jdGlvbihyZWFjdGlvbikgeyBzaG93Q29tbWVudHMocmVhY3Rpb24pIH0sXG4gICAgICAgICAgICBlbGVtZW50OiBwYWdlQ29udGFpbmVyKHJhY3RpdmUpXG4gICAgICAgIH07XG4gICAgICAgIHZhciBwYWdlID0gUmVhY3Rpb25zUGFnZS5jcmVhdGUob3B0aW9ucyk7XG4gICAgICAgIHBhZ2VzLnB1c2gocGFnZSk7XG4gICAgICAgIHNob3dQYWdlKHBhZ2Uuc2VsZWN0b3IsICRyb290RWxlbWVudCwgYW5pbWF0ZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2hvd0RlZmF1bHRSZWFjdGlvbnNQYWdlKGFuaW1hdGUpIHtcbiAgICAgICAgaWYgKGNvbnRhaW5lckVsZW1lbnQgJiYgIWNvbnRlbnREYXRhLmxvY2F0aW9uICYmICFjb250ZW50RGF0YS5ib2R5KSB7XG4gICAgICAgICAgICBSYW5nZS5ncmFiTm9kZShjb250YWluZXJFbGVtZW50LmdldCgwKSwgZnVuY3Rpb24gKHRleHQsIGxvY2F0aW9uKSB7XG4gICAgICAgICAgICAgICAgY29udGVudERhdGEubG9jYXRpb24gPSBsb2NhdGlvbjtcbiAgICAgICAgICAgICAgICBjb250ZW50RGF0YS5ib2R5ID0gdGV4dDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHZhciBvcHRpb25zID0geyAvLyBUT0RPOiBjbGVhbiB1cCB0aGUgbnVtYmVyIG9mIHRoZXNlIFwib3B0aW9uc1wiIG9iamVjdHMgdGhhdCB3ZSBjcmVhdGUuXG4gICAgICAgICAgICBkZWZhdWx0UmVhY3Rpb25zOiBkZWZhdWx0UmVhY3Rpb25zLFxuICAgICAgICAgICAgcGFnZURhdGE6IHBhZ2VEYXRhLFxuICAgICAgICAgICAgY29udGFpbmVyRGF0YTogY29udGFpbmVyRGF0YSxcbiAgICAgICAgICAgIGNvbG9yczogY29sb3JzLFxuICAgICAgICAgICAgY29udGVudERhdGE6IGNvbnRlbnREYXRhLFxuICAgICAgICAgICAgc2hvd0NvbmZpcm1hdGlvbjogZnVuY3Rpb24ocmVhY3Rpb24pIHsgc2hvd0NvbmZpcm1QYWdlKHJlYWN0aW9uKSB9LFxuICAgICAgICAgICAgZWxlbWVudDogcGFnZUNvbnRhaW5lcihyYWN0aXZlKVxuICAgICAgICB9O1xuICAgICAgICB2YXIgcGFnZSA9IERlZmF1bHRzUGFnZS5jcmVhdGUob3B0aW9ucyk7XG4gICAgICAgIHBhZ2VzLnB1c2gocGFnZSk7XG4gICAgICAgIHNob3dQYWdlKHBhZ2Uuc2VsZWN0b3IsICRyb290RWxlbWVudCwgYW5pbWF0ZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2hvd0NvbmZpcm1QYWdlKHJlYWN0aW9uKSB7XG4gICAgICAgIC8vIFRPRE86IHVwZGF0ZSBoZWFkZXIgdGV4dCBcIlRoYW5rcyBmb3IgeW91ciByZWFjdGlvbiFcIlxuICAgICAgICB2YXIgcGFnZSA9IENvbmZpcm1hdGlvblBhZ2UuY3JlYXRlKHJlYWN0aW9uLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgcGFnZUNvbnRhaW5lcihyYWN0aXZlKSk7XG4gICAgICAgIHBhZ2VzLnB1c2gocGFnZSk7XG5cbiAgICAgICAgLy8gVE9ETzogcmV2aXNpdCB3aHkgd2UgbmVlZCB0byB1c2UgdGhlIHRpbWVvdXQgdHJpY2sgZm9yIHRoZSBjb25maXJtIHBhZ2UsIGJ1dCBub3QgZm9yIHRoZSBkZWZhdWx0cyBwYWdlXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IC8vIEluIG9yZGVyIGZvciB0aGUgcG9zaXRpb25pbmcgYW5pbWF0aW9uIHRvIHdvcmssIHdlIG5lZWQgdG8gbGV0IHRoZSBicm93c2VyIHJlbmRlciB0aGUgYXBwZW5kZWQgRE9NIGVsZW1lbnRcbiAgICAgICAgICAgIHNob3dQYWdlKHBhZ2Uuc2VsZWN0b3IsICRyb290RWxlbWVudCwgdHJ1ZSk7XG4gICAgICAgIH0sIDEpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNob3dDb21tZW50c1BhZ2UocmVhY3Rpb24sIGNvbW1lbnRzKSB7XG4gICAgICAgIHZhciBwYWdlID0gQ29tbWVudHNQYWdlLmNyZWF0ZShyZWFjdGlvbiwgY29tbWVudHMsIHBhZ2VDb250YWluZXIocmFjdGl2ZSksIGNsb3NlV2luZG93KTtcbiAgICAgICAgcGFnZXMucHVzaChwYWdlKTtcblxuICAgICAgICAvLyBUT0RPOiByZXZpc2l0XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IC8vIEluIG9yZGVyIGZvciB0aGUgcG9zaXRpb25pbmcgYW5pbWF0aW9uIHRvIHdvcmssIHdlIG5lZWQgdG8gbGV0IHRoZSBicm93c2VyIHJlbmRlciB0aGUgYXBwZW5kZWQgRE9NIGVsZW1lbnRcbiAgICAgICAgICAgIHNob3dQYWdlKHBhZ2Uuc2VsZWN0b3IsICRyb290RWxlbWVudCwgdHJ1ZSk7XG4gICAgICAgIH0sIDEpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNob3dQcm9ncmVzc1BhZ2UoKSB7XG4gICAgICAgIHNob3dQYWdlKCcuYW50ZW5uYS1wcm9ncmVzcy1wYWdlJywgJHJvb3RFbGVtZW50LCBmYWxzZSwgdHJ1ZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2hvd0NvbW1lbnRzKHJlYWN0aW9uKSB7XG4gICAgICAgIHNob3dQcm9ncmVzc1BhZ2UoKTsgLy8gVE9ETzogcHJvdmlkZSBzb21lIHdheSBmb3IgdGhlIHVzZXIgdG8gZ2l2ZSB1cCAvIGNhbmNlbFxuICAgICAgICBBamF4Q2xpZW50LmdldENvbW1lbnRzKHJlYWN0aW9uLCBmdW5jdGlvbihjb21tZW50cykge1xuICAgICAgICAgICAgc2hvd0NvbW1lbnRzUGFnZShyZWFjdGlvbiwgY29tbWVudHMpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjbG9zZVdpbmRvdygpIHtcbiAgICAgICAgcmFjdGl2ZS5maXJlKCdjbG9zZVdpbmRvdycpO1xuICAgIH1cblxufVxuXG5mdW5jdGlvbiByb290RWxlbWVudChyYWN0aXZlKSB7XG4gICAgcmV0dXJuIHJhY3RpdmUuZmluZCgnLmFudGVubmEtcmVhY3Rpb25zLXdpZGdldCcpO1xufVxuXG5mdW5jdGlvbiBwYWdlQ29udGFpbmVyKHJhY3RpdmUpIHtcbiAgICByZXR1cm4gcmFjdGl2ZS5maW5kKCcuYW50ZW5uYS1wYWdlLWNvbnRhaW5lcicpO1xufVxuXG52YXIgcGFnZVogPSAxMDAwOyAvLyBJdCdzIHNhZmUgZm9yIHRoaXMgdmFsdWUgdG8gZ28gYWNyb3NzIGluc3RhbmNlcy4gV2UganVzdCBuZWVkIGl0IHRvIGNvbnRpbnVvdXNseSBpbmNyZWFzZSAobWF4IHZhbHVlIGlzIG92ZXIgMiBiaWxsaW9uKS5cblxuZnVuY3Rpb24gc2hvd1BhZ2UocGFnZVNlbGVjdG9yLCAkcm9vdEVsZW1lbnQsIGFuaW1hdGUsIG92ZXJsYXkpIHtcbiAgICB2YXIgJHBhZ2UgPSAkcm9vdEVsZW1lbnQuZmluZChwYWdlU2VsZWN0b3IpO1xuICAgICRwYWdlLmNzcygnei1pbmRleCcsIHBhZ2VaKTtcbiAgICBwYWdlWiArPSAxO1xuXG4gICAgJHBhZ2UudG9nZ2xlQ2xhc3MoJ2FudGVubmEtcGFnZS1hbmltYXRlJywgYW5pbWF0ZSk7XG5cbiAgICBpZiAob3ZlcmxheSkge1xuICAgICAgICAvLyBJbiB0aGUgb3ZlcmxheSBjYXNlLCBzaXplIHRoZSBwYWdlIHRvIG1hdGNoIHdoYXRldmVyIHBhZ2UgaXMgY3VycmVudGx5IHNob3dpbmcgYW5kIHRoZW4gbWFrZSBpdCBhY3RpdmUgKHRoZXJlIHdpbGwgYmUgdHdvICdhY3RpdmUnIHBhZ2VzKVxuICAgICAgICB2YXIgJGN1cnJlbnQgPSAkcm9vdEVsZW1lbnQuZmluZCgnLmFudGVubmEtcGFnZS1hY3RpdmUnKTtcbiAgICAgICAgJHBhZ2UuaGVpZ2h0KCRjdXJyZW50LmhlaWdodCgpKTtcbiAgICAgICAgJHBhZ2UuYWRkQ2xhc3MoJ2FudGVubmEtcGFnZS1hY3RpdmUnKTtcbiAgICB9IGVsc2UgaWYgKGFuaW1hdGUpIHtcbiAgICAgICAgVHJhbnNpdGlvblV0aWwudG9nZ2xlQ2xhc3MoJHBhZ2UsICdhbnRlbm5hLXBhZ2UtYWN0aXZlJywgdHJ1ZSwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAvLyBBZnRlciB0aGUgbmV3IHBhZ2Ugc2xpZGVzIGludG8gcG9zaXRpb24sIG1vdmUgdGhlIG90aGVyIHBhZ2VzIGJhY2sgb3V0IG9mIHRoZSB2aWV3YWJsZSBhcmVhXG4gICAgICAgICAgICAkcm9vdEVsZW1lbnQuZmluZCgnLmFudGVubmEtcGFnZScpLm5vdChwYWdlU2VsZWN0b3IpLnJlbW92ZUNsYXNzKCdhbnRlbm5hLXBhZ2UtYWN0aXZlJyk7XG4gICAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICAgICRwYWdlLmFkZENsYXNzKCdhbnRlbm5hLXBhZ2UtYWN0aXZlJyk7XG4gICAgICAgICRyb290RWxlbWVudC5maW5kKCcuYW50ZW5uYS1wYWdlJykubm90KHBhZ2VTZWxlY3RvcikucmVtb3ZlQ2xhc3MoJ2FudGVubmEtcGFnZS1hY3RpdmUnKTtcbiAgICB9XG4gICAgc2l6ZUJvZHlUb0ZpdCgkcm9vdEVsZW1lbnQsICRwYWdlLCBhbmltYXRlKTtcbn1cblxuZnVuY3Rpb24gc2l6ZUJvZHlUb0ZpdCgkcm9vdEVsZW1lbnQsICRwYWdlLCBhbmltYXRlKSB7XG4gICAgdmFyICRwYWdlQ29udGFpbmVyID0gJHJvb3RFbGVtZW50LmZpbmQoJy5hbnRlbm5hLXBhZ2UtY29udGFpbmVyJyk7XG4gICAgdmFyICRib2R5ID0gJHBhZ2UuZmluZCgnLmFudGVubmEtYm9keScpO1xuICAgIHZhciBjdXJyZW50SGVpZ2h0ID0gJHBhZ2VDb250YWluZXIuY3NzKCdoZWlnaHQnKTtcbiAgICAkcGFnZUNvbnRhaW5lci5jc3MoeyBoZWlnaHQ6ICcnIH0pOyAvLyBDbGVhciBhbnkgcHJldmlvdXNseSBjb21wdXRlZCBoZWlnaHQgc28gd2UgZ2V0IGEgZnJlc2ggY29tcHV0YXRpb24gb2YgdGhlIGNoaWxkIGhlaWdodHNcbiAgICB2YXIgbmV3Qm9keUhlaWdodCA9IE1hdGgubWluKDMwMCwgJGJvZHkuZ2V0KDApLnNjcm9sbEhlaWdodCk7XG4gICAgJGJvZHkuY3NzKHsgaGVpZ2h0OiBuZXdCb2R5SGVpZ2h0IH0pOyAvLyBUT0RPOiBkb3VibGUtY2hlY2sgdGhhdCB3ZSBjYW4ndCBqdXN0IHNldCBhIG1heC1oZWlnaHQgb2YgMzAwcHggb24gdGhlIGJvZHkuXG4gICAgdmFyIGZvb3RlckhlaWdodCA9ICRwYWdlLmZpbmQoJy5hbnRlbm5hLWZvb3RlcicpLm91dGVySGVpZ2h0KCk7IC8vIHJldHVybnMgJ251bGwnIGlmIHRoZXJlJ3Mgbm8gZm9vdGVyLiBhZGRlZCB0byBhbiBpbnRlZ2VyLCAnbnVsbCcgYWN0cyBsaWtlIDBcbiAgICB2YXIgbmV3UGFnZUhlaWdodCA9IG5ld0JvZHlIZWlnaHQgKyBmb290ZXJIZWlnaHQ7XG4gICAgaWYgKGFuaW1hdGUpIHtcbiAgICAgICAgJHBhZ2VDb250YWluZXIuY3NzKHsgaGVpZ2h0OiBjdXJyZW50SGVpZ2h0IH0pO1xuICAgICAgICAkcGFnZUNvbnRhaW5lci5hbmltYXRlKHsgaGVpZ2h0OiBuZXdQYWdlSGVpZ2h0IH0sIDIwMCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgJHBhZ2VDb250YWluZXIuY3NzKHsgaGVpZ2h0OiBuZXdQYWdlSGVpZ2h0IH0pO1xuICAgIH1cbiAgICAvLyBUT0RPOiB3ZSBtaWdodCBub3QgbmVlZCB3aWR0aCByZXNpemluZyBhdCBhbGwuXG4gICAgdmFyIG1pbldpZHRoID0gJHBhZ2UuY3NzKCdtaW4td2lkdGgnKTtcbiAgICB2YXIgd2lkdGggPSBwYXJzZUludChtaW5XaWR0aCk7XG4gICAgaWYgKHdpZHRoID4gMCkge1xuICAgICAgICBpZiAoYW5pbWF0ZSkge1xuICAgICAgICAgICAgJHJvb3RFbGVtZW50LmFuaW1hdGUoeyB3aWR0aDogd2lkdGggfSwgMjAwKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICRyb290RWxlbWVudC5jc3MoeyB3aWR0aDogd2lkdGggfSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIHNldHVwV2luZG93Q2xvc2UocGFnZXMsIHJhY3RpdmUpIHtcbiAgICB2YXIgJHJvb3RFbGVtZW50ID0gJChyb290RWxlbWVudChyYWN0aXZlKSk7XG5cbiAgICAvLyBUT0RPOiBJZiB5b3UgbW91c2Ugb3ZlciB0aGUgdHJpZ2dlciBzbG93bHkgZnJvbSB0aGUgdG9wIGxlZnQsIHRoZSB3aW5kb3cgb3BlbnMgd2l0aG91dCBiZWluZyB1bmRlciB0aGUgY3Vyc29yLFxuICAgIC8vICAgICAgIHNvIG5vIG1vdXNlb3V0IGV2ZW50IGlzIHJlY2VpdmVkLiBXaGVuIHdlIG9wZW4gdGhlIHdpbmRvdywgd2Ugc2hvdWxkIHByb2JhYmx5IGp1c3Qgc2Nvb3QgaXQgdXAgc2xpZ2h0bHlcbiAgICAvLyAgICAgICBpZiBuZWVkZWQgdG8gYXNzdXJlIHRoYXQgaXQncyB1bmRlciB0aGUgY3Vyc29yLiBBbHRlcm5hdGl2ZWx5LCB3ZSBjb3VsZCBhZGp1c3QgdGhlIG1vdXNlb3ZlciBhcmVhIHRvIG1hdGNoXG4gICAgLy8gICAgICAgdGhlIHJlZ2lvbiB0aGF0IHRoZSB3aW5kb3cgb3BlbnMuXG4gICAgJHJvb3RFbGVtZW50XG4gICAgICAgIC5vbignbW91c2VvdXQuYW50ZW5uYScsIGRlbGF5ZWRDbG9zZVdpbmRvdylcbiAgICAgICAgLm9uKCdtb3VzZW92ZXIuYW50ZW5uYScsIGtlZXBXaW5kb3dPcGVuKVxuICAgICAgICAub24oJ2ZvY3VzaW4uYW50ZW5uYScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy8gT25jZSB0aGUgd2luZG93IGhhcyBmb2N1cywgZG9uJ3QgY2xvc2UgaXQgb24gbW91c2VvdXQuXG4gICAgICAgICAgICBrZWVwV2luZG93T3BlbigpO1xuICAgICAgICAgICAgJHJvb3RFbGVtZW50Lm9mZignbW91c2VvdXQuYW50ZW5uYScpO1xuICAgICAgICAgICAgJHJvb3RFbGVtZW50Lm9mZignbW91c2VvdmVyLmFudGVubmEnKTtcbiAgICAgICAgfSlcbiAgICAgICAgLm9uKCdmb2N1c291dC5hbnRlbm5hJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgIGlmICgkKFsgZXZlbnQucmVsYXRlZFRhcmdldCwgZXZlbnQudGFyZ2V0IF0pLmNsb3Nlc3QoJy5hbnRlbm5hLXJlYWN0aW9ucy13aWRnZXQnKS5zaXplKCkgPT0gMCkgeyAvLyBEb24ndCBjbG9zZSB0aGUgd2luZG93IGlmIGZvY3VzIGlzIGdvaW5nIGluc2lkZSB0aGUgd2luZG93IG9yIHdlJ3ZlIGNsaWNrZWQgc29tZXRoaW5nIGluIHRoZSB3aW5kb3dcbiAgICAgICAgICAgICAgICBjbG9zZVdpbmRvdygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAkKGRvY3VtZW50KS5vbignY2xpY2suYW50ZW5uYScsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGlmICgkKGV2ZW50LnRhcmdldCkuY2xvc2VzdCgnLmFudGVubmEtcmVhY3Rpb25zLXdpZGdldCcpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgY2xvc2VXaW5kb3coKTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJhY3RpdmUub24oJ2Nsb3NlV2luZG93JywgY2xvc2VXaW5kb3cpO1xuXG4gICAgdmFyIGNsb3NlVGltZXI7XG5cbiAgICBmdW5jdGlvbiBkZWxheWVkQ2xvc2VXaW5kb3coKSB7XG4gICAgICAgIGNsb3NlVGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY2xvc2VUaW1lciA9IG51bGw7XG4gICAgICAgICAgICBjbG9zZVdpbmRvdygpO1xuICAgICAgICB9LCA1MDApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGtlZXBXaW5kb3dPcGVuKCkge1xuICAgICAgICBjbGVhclRpbWVvdXQoY2xvc2VUaW1lcik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY2xvc2VXaW5kb3coKSB7XG4gICAgICAgIGNsZWFyVGltZW91dChjbG9zZVRpbWVyKTtcblxuICAgICAgICAkcm9vdEVsZW1lbnQuc3RvcCh0cnVlLCB0cnVlKS5mYWRlT3V0KCdmYXN0JywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAkcm9vdEVsZW1lbnQuY3NzKCdkaXNwbGF5JywgJycpOyAvLyBDbGVhciB0aGUgZGlzcGxheTpub25lIHRoYXQgZmFkZU91dCBwdXRzIG9uIHRoZSBlbGVtZW50XG4gICAgICAgICAgICAkcm9vdEVsZW1lbnQucmVtb3ZlQ2xhc3MoJ29wZW4nKTtcbiAgICAgICAgfSk7XG4gICAgICAgICRyb290RWxlbWVudC5vZmYoJy5hbnRlbm5hJyk7IC8vIFVuYmluZCBhbGwgb2YgdGhlIGhhbmRsZXJzIGluIG91ciBuYW1lc3BhY2VcbiAgICAgICAgJChkb2N1bWVudCkub2ZmKCdjbGljay5hbnRlbm5hJyk7XG4gICAgICAgIFJhbmdlLmNsZWFySGlnaGxpZ2h0cygpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBhZ2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBwYWdlc1tpXS50ZWFyZG93bigpO1xuICAgICAgICB9XG4gICAgICAgIHJhY3RpdmUudGVhcmRvd24oKTtcbiAgICB9XG59XG5cbi8vIFByZXZlbnQgc2Nyb2xsaW5nIG9mIHRoZSBkb2N1bWVudCBhZnRlciB3ZSBzY3JvbGwgdG8gdGhlIHRvcC9ib3R0b20gb2YgdGhlIHJlYWN0aW9ucyB3aW5kb3dcbi8vIENvZGUgY29waWVkIGZyb206IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvNTgwMjQ2Ny9wcmV2ZW50LXNjcm9sbGluZy1vZi1wYXJlbnQtZWxlbWVudFxuLy8gVE9ETzogZG9lcyB0aGlzIHdvcmsgb24gbW9iaWxlP1xuZnVuY3Rpb24gcHJldmVudEV4dHJhU2Nyb2xsKCRyb290RWxlbWVudCkge1xuICAgICRyb290RWxlbWVudC5vbignRE9NTW91c2VTY3JvbGwuYW50ZW5uYSBtb3VzZXdoZWVsLmFudGVubmEnLCAnLmFudGVubmEtYm9keScsIGZ1bmN0aW9uKGV2KSB7XG4gICAgICAgIHZhciAkdGhpcyA9ICQodGhpcyksXG4gICAgICAgICAgICBzY3JvbGxUb3AgPSB0aGlzLnNjcm9sbFRvcCxcbiAgICAgICAgICAgIHNjcm9sbEhlaWdodCA9IHRoaXMuc2Nyb2xsSGVpZ2h0LFxuICAgICAgICAgICAgaGVpZ2h0ID0gJHRoaXMuaGVpZ2h0KCksXG4gICAgICAgICAgICBkZWx0YSA9IChldi50eXBlID09ICdET01Nb3VzZVNjcm9sbCcgP1xuICAgICAgICAgICAgICAgIGV2Lm9yaWdpbmFsRXZlbnQuZGV0YWlsICogLTQwIDpcbiAgICAgICAgICAgICAgICBldi5vcmlnaW5hbEV2ZW50LndoZWVsRGVsdGEpLFxuICAgICAgICAgICAgdXAgPSBkZWx0YSA+IDA7XG5cbiAgICAgICAgaWYgKHNjcm9sbEhlaWdodCA8PSBoZWlnaHQpIHtcbiAgICAgICAgICAgIC8vIFRoaXMgaXMgYW4gYWRkaXRpb24gdG8gdGhlIFN0YWNrT3ZlcmZsb3cgY29kZSwgdG8gbWFrZSBzdXJlIHRoZSBwYWdlIHNjcm9sbHMgYXMgdXN1YWwgaWYgdGhlIHdpbmRvd1xuICAgICAgICAgICAgLy8gY29udGVudCBkb2Vzbid0IHNjcm9sbC5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBwcmV2ZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBldi5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBldi5yZXR1cm5WYWx1ZSA9IGZhbHNlO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9O1xuXG4gICAgICAgIGlmICghdXAgJiYgLWRlbHRhID4gc2Nyb2xsSGVpZ2h0IC0gaGVpZ2h0IC0gc2Nyb2xsVG9wKSB7XG4gICAgICAgICAgICAvLyBTY3JvbGxpbmcgZG93biwgYnV0IHRoaXMgd2lsbCB0YWtlIHVzIHBhc3QgdGhlIGJvdHRvbS5cbiAgICAgICAgICAgICR0aGlzLnNjcm9sbFRvcChzY3JvbGxIZWlnaHQpO1xuICAgICAgICAgICAgcmV0dXJuIHByZXZlbnQoKTtcbiAgICAgICAgfSBlbHNlIGlmICh1cCAmJiBkZWx0YSA+IHNjcm9sbFRvcCkge1xuICAgICAgICAgICAgLy8gU2Nyb2xsaW5nIHVwLCBidXQgdGhpcyB3aWxsIHRha2UgdXMgcGFzdCB0aGUgdG9wLlxuICAgICAgICAgICAgJHRoaXMuc2Nyb2xsVG9wKDApO1xuICAgICAgICAgICAgcmV0dXJuIHByZXZlbnQoKTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgb3Blbjogb3BlblJlYWN0aW9uc1dpZGdldFxufTsiLCJ2YXIgUmFuZ3lQcm92aWRlciA9IHJlcXVpcmUoJy4vdXRpbHMvcmFuZ3ktcHJvdmlkZXInKTtcbnZhciBKUXVlcnlQcm92aWRlciA9IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJyk7XG52YXIgaXNPZmZsaW5lID0gcmVxdWlyZSgnLi91dGlscy9vZmZsaW5lJyk7XG52YXIgVVJMcyA9IHJlcXVpcmUoJy4vdXRpbHMvdXJscycpO1xuXG52YXIgYmFzZVVybCA9IFVSTHMuYW50ZW5uYUhvbWUoKTtcblxudmFyIHNjcmlwdHMgPSBbXG4gICAge3NyYzogJy8vY2RuanMuY2xvdWRmbGFyZS5jb20vYWpheC9saWJzL2pxdWVyeS8yLjEuNC9qcXVlcnkubWluLmpzJywgY2FsbGJhY2s6IEpRdWVyeVByb3ZpZGVyLmxvYWRlZH0sXG4gICAge3NyYzogJy8vY2RuanMuY2xvdWRmbGFyZS5jb20vYWpheC9saWJzL3JhY3RpdmUvMC43LjMvcmFjdGl2ZS5ydW50aW1lLm1pbi5qcyd9LFxuICAgIHtzcmM6IGJhc2VVcmwgKyAnL3N0YXRpYy93aWRnZXQtbmV3L2xpYi9yYW5neS1jb21waWxlZC5qcycsIGNhbGxiYWNrOiBSYW5neVByb3ZpZGVyLmxvYWRlZCwgYWJvdXRUb0xvYWQ6IFJhbmd5UHJvdmlkZXIuYWJvdXRUb0xvYWR9IC8vIFRPRE8gbWluaWZ5IGFuZCBob3N0IHRoaXMgc29tZXdoZXJlXG5dO1xuaWYgKGlzT2ZmbGluZSkge1xuICAgIC8vIFVzZSB0aGUgb2ZmbGluZSB2ZXJzaW9ucyBvZiB0aGUgbGlicmFyaWVzIGZvciBkZXZlbG9wbWVudC5cbiAgICBzY3JpcHRzID0gW1xuICAgICAgICB7c3JjOiBiYXNlVXJsICsgJy9zdGF0aWMvanMvY2RuL2pxdWVyeS8yLjEuNC9qcXVlcnkuanMnLCBjYWxsYmFjazogSlF1ZXJ5UHJvdmlkZXIubG9hZGVkfSxcbiAgICAgICAge3NyYzogYmFzZVVybCArICcvc3RhdGljL2pzL2Nkbi9yYWN0aXZlLzAuNy4zL3JhY3RpdmUucnVudGltZS5qcyd9LFxuICAgICAgICB7c3JjOiBiYXNlVXJsICsgJy9zdGF0aWMvd2lkZ2V0LW5ldy9saWIvcmFuZ3ktY29tcGlsZWQuanMnLCBjYWxsYmFjazogUmFuZ3lQcm92aWRlci5sb2FkZWQsIGFib3V0VG9Mb2FkOiBSYW5neVByb3ZpZGVyLmFib3V0VG9Mb2FkfVxuICAgIF07XG59XG5cbmZ1bmN0aW9uIGxvYWRBbGxTY3JpcHRzKGxvYWRlZENhbGxiYWNrKSB7XG4gICAgbG9hZFNjcmlwdHMoc2NyaXB0cywgbG9hZGVkQ2FsbGJhY2spO1xufVxuXG5mdW5jdGlvbiBsb2FkU2NyaXB0cyhzY3JpcHRzLCBsb2FkZWRDYWxsYmFjaykge1xuICAgIHZhciBsb2FkaW5nQ291bnQgPSBzY3JpcHRzLmxlbmd0aDtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNjcmlwdHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIHNjcmlwdCA9IHNjcmlwdHNbaV07XG4gICAgICAgIGlmIChzY3JpcHQuYWJvdXRUb0xvYWQpIHsgc2NyaXB0LmFib3V0VG9Mb2FkKCk7IH1cbiAgICAgICAgbG9hZFNjcmlwdChzY3JpcHQuc3JjLCBmdW5jdGlvbihzY3JpcHRDYWxsYmFjaykge1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmIChzY3JpcHRDYWxsYmFjaykgc2NyaXB0Q2FsbGJhY2soKTtcbiAgICAgICAgICAgICAgICBsb2FkaW5nQ291bnQgPSBsb2FkaW5nQ291bnQgLSAxO1xuICAgICAgICAgICAgICAgIGlmIChsb2FkaW5nQ291bnQgPT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAobG9hZGVkQ2FsbGJhY2spIGxvYWRlZENhbGxiYWNrKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSAoc2NyaXB0LmNhbGxiYWNrKSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBsb2FkU2NyaXB0KHNyYywgY2FsbGJhY2spIHtcbiAgICB2YXIgaGVhZCA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF07XG4gICAgaWYgKGhlYWQpIHtcbiAgICAgICAgdmFyIHNjcmlwdFRhZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuICAgICAgICBzY3JpcHRUYWcuc2V0QXR0cmlidXRlKCdzcmMnLCBzcmMpO1xuICAgICAgICBzY3JpcHRUYWcuc2V0QXR0cmlidXRlKCd0eXBlJywndGV4dC9qYXZhc2NyaXB0Jyk7XG5cbiAgICAgICAgaWYgKHNjcmlwdFRhZy5yZWFkeVN0YXRlKSB7IC8vIElFLCBpbmNsLiBJRTlcbiAgICAgICAgICAgIHNjcmlwdFRhZy5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBpZiAoc2NyaXB0VGFnLnJlYWR5U3RhdGUgPT0gXCJsb2FkZWRcIiB8fCBzY3JpcHRUYWcucmVhZHlTdGF0ZSA9PSBcImNvbXBsZXRlXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgc2NyaXB0VGFnLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjYWxsYmFjaykgeyBjYWxsYmFjaygpOyB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNjcmlwdFRhZy5vbmxvYWQgPSBmdW5jdGlvbigpIHsgLy8gT3RoZXIgYnJvd3NlcnNcbiAgICAgICAgICAgICAgICBpZiAoY2FsbGJhY2spIHsgY2FsbGJhY2soKTsgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIGhlYWQuYXBwZW5kQ2hpbGQoc2NyaXB0VGFnKTtcbiAgICB9XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBsb2FkOiBsb2FkQWxsU2NyaXB0c1xufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi91dGlscy9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciBSZWFjdGlvbnNXaWRnZXQgPSByZXF1aXJlKCcuL3JlYWN0aW9ucy13aWRnZXQnKTtcblxuZnVuY3Rpb24gY3JlYXRlU3VtbWFyeVdpZGdldChjb250YWluZXIsIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBkZWZhdWx0UmVhY3Rpb25zLCBncm91cFNldHRpbmdzKSB7XG4gICAgLy8vLyBUT0RPIHJlcGxhY2UgZWxlbWVudFxuICAgIHZhciByYWN0aXZlID0gUmFjdGl2ZSh7XG4gICAgICAgIGVsOiBjb250YWluZXIsXG4gICAgICAgIGRhdGE6IHBhZ2VEYXRhLFxuICAgICAgICBtYWdpYzogdHJ1ZSxcbiAgICAgICAgdGVtcGxhdGU6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9zdW1tYXJ5LXdpZGdldC5oYnMuaHRtbCcpXG4gICAgfSk7XG4gICAgJChyb290RWxlbWVudChyYWN0aXZlKSkub24oJ21vdXNlZW50ZXInLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgIG9wZW5SZWFjdGlvbnNXaW5kb3coY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGRlZmF1bHRSZWFjdGlvbnMsIGdyb3VwU2V0dGluZ3MsIHJhY3RpdmUpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiByb290RWxlbWVudChyYWN0aXZlKSB7XG4gICAgLy8gVE9ETzogZ290dGEgYmUgYSBiZXR0ZXIgd2F5IHRvIGdldCB0aGlzXG4gICAgcmV0dXJuIHJhY3RpdmUuZmluZCgnLmFudC1zdW1tYXJ5LXdpZGdldCcpO1xufVxuXG5mdW5jdGlvbiBvcGVuUmVhY3Rpb25zV2luZG93KGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBkZWZhdWx0UmVhY3Rpb25zLCBncm91cFNldHRpbmdzLCByYWN0aXZlKSB7XG4gICAgdmFyIHJlYWN0aW9uc1dpZGdldE9wdGlvbnMgPSB7XG4gICAgICAgIHJlYWN0aW9uc0RhdGE6IHBhZ2VEYXRhLnN1bW1hcnlSZWFjdGlvbnMsXG4gICAgICAgIGNvbnRhaW5lckRhdGE6IGNvbnRhaW5lckRhdGEsXG4gICAgICAgIGRlZmF1bHRSZWFjdGlvbnM6IGRlZmF1bHRSZWFjdGlvbnMsXG4gICAgICAgIHBhZ2VEYXRhOiBwYWdlRGF0YSxcbiAgICAgICAgZ3JvdXBTZXR0aW5nczogZ3JvdXBTZXR0aW5ncyxcbiAgICAgICAgY29udGVudERhdGE6IHsgdHlwZTogJ3BhZ2UnLCBib2R5OiAnJyB9XG4gICAgfTtcbiAgICBSZWFjdGlvbnNXaWRnZXQub3BlbihyZWFjdGlvbnNXaWRnZXRPcHRpb25zLCByb290RWxlbWVudChyYWN0aXZlKSk7XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGU6IGNyZWF0ZVN1bW1hcnlXaWRnZXRcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgUG9wdXBXaWRnZXQgPSByZXF1aXJlKCcuL3BvcHVwLXdpZGdldCcpO1xudmFyIFJhbmdlID0gcmVxdWlyZSgnLi91dGlscy9yYW5nZScpO1xudmFyIFJlYWN0aW9uc1dpZGdldCA9IHJlcXVpcmUoJy4vcmVhY3Rpb25zLXdpZGdldCcpO1xuXG5cbmZ1bmN0aW9uIGNyZWF0ZVJlYWN0YWJsZVRleHQob3B0aW9ucykge1xuICAgIC8vIFRPRE86IGltcG9zZSBhbiB1cHBlciBsaW1pdCBvbiB0aGUgbGVuZ3RoIG9mIHRleHQgdGhhdCBjYW4gYmUgcmVhY3RlZCB0bz8gKGFwcGxpZXMgdG8gdGhlIGluZGljYXRvci13aWRnZXQgdG9vKVxuICAgIHZhciAkY29udGFpbmVyRWxlbWVudCA9IG9wdGlvbnMuY29udGFpbmVyRWxlbWVudDtcbiAgICB2YXIgZXhjbHVkZU5vZGUgPSBvcHRpb25zLmV4Y2x1ZGVOb2RlO1xuICAgIHZhciByZWFjdGlvbnNXaWRnZXRPcHRpb25zID0ge1xuICAgICAgICByZWFjdGlvbnNEYXRhOiBbXSwgLy8gQWx3YXlzIG9wZW4gd2l0aCB0aGUgZGVmYXVsdCByZWFjdGlvbnNcbiAgICAgICAgY29udGFpbmVyRGF0YTogb3B0aW9ucy5jb250YWluZXJEYXRhLFxuICAgICAgICBjb250ZW50RGF0YTogeyB0eXBlOiAndGV4dCcgfSxcbiAgICAgICAgY29udGFpbmVyRWxlbWVudDogJGNvbnRhaW5lckVsZW1lbnQsXG4gICAgICAgIGRlZmF1bHRSZWFjdGlvbnM6IG9wdGlvbnMuZGVmYXVsdFJlYWN0aW9ucyxcbiAgICAgICAgcGFnZURhdGE6IG9wdGlvbnMucGFnZURhdGEsXG4gICAgICAgIGdyb3VwU2V0dGluZ3M6IG9wdGlvbnMuZ3JvdXBTZXR0aW5nc1xuICAgIH07XG5cbiAgICAkY29udGFpbmVyRWxlbWVudC5vbignbW91c2V1cCcsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHZhciBub2RlID0gJGNvbnRhaW5lckVsZW1lbnQuZ2V0KDApO1xuICAgICAgICB2YXIgcG9pbnQgPSBSYW5nZS5nZXRTZWxlY3Rpb25FbmRQb2ludChub2RlLCBldmVudCwgZXhjbHVkZU5vZGUpO1xuICAgICAgICBpZiAocG9pbnQpIHtcbiAgICAgICAgICAgIHZhciBjb29yZGluYXRlcyA9IHsgdG9wOiBwb2ludC55LCBsZWZ0OiBwb2ludC54IH07XG4gICAgICAgICAgICBQb3B1cFdpZGdldC5zaG93KGNvb3JkaW5hdGVzLCBncmFiU2VsZWN0aW9uQW5kT3Blbihub2RlLCBjb29yZGluYXRlcywgcmVhY3Rpb25zV2lkZ2V0T3B0aW9ucywgZXhjbHVkZU5vZGUpKTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBncmFiU2VsZWN0aW9uQW5kT3Blbihub2RlLCBjb29yZGluYXRlcywgcmVhY3Rpb25zV2lkZ2V0T3B0aW9ucywgZXhjbHVkZU5vZGUpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgIFJhbmdlLmdyYWJTZWxlY3Rpb24obm9kZSwgZnVuY3Rpb24odGV4dCwgbG9jYXRpb24pIHtcbiAgICAgICAgICAgIHJlYWN0aW9uc1dpZGdldE9wdGlvbnMuY29udGVudERhdGEubG9jYXRpb24gPSBsb2NhdGlvbjtcbiAgICAgICAgICAgIHJlYWN0aW9uc1dpZGdldE9wdGlvbnMuY29udGVudERhdGEuYm9keSA9IHRleHQ7XG4gICAgICAgICAgICBSZWFjdGlvbnNXaWRnZXQub3BlbihyZWFjdGlvbnNXaWRnZXRPcHRpb25zLCBjb29yZGluYXRlcyk7XG4gICAgICAgIH0sIGV4Y2x1ZGVOb2RlKTtcbiAgICB9XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGVSZWFjdGFibGVUZXh0OiBjcmVhdGVSZWFjdGFibGVUZXh0XG59OyIsIi8vIFRPRE86IG5lZWRzIGEgYmV0dGVyIG5hbWUgb25jZSB0aGUgc2NvcGUgaXMgY2xlYXJcblxudmFyICQ7IHJlcXVpcmUoJy4vanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgWERNQ2xpZW50ID0gcmVxdWlyZSgnLi94ZG0tY2xpZW50Jyk7XG52YXIgVVJMcyA9IHJlcXVpcmUoJy4vdXJscycpO1xudmFyIGlzT2ZmbGluZSA9IHJlcXVpcmUoJy4vb2ZmbGluZScpO1xuXG52YXIgUGFnZURhdGEgPSByZXF1aXJlKCcuLi9wYWdlLWRhdGEnKTsgLy8gVE9ETzogYmFja3dhcmRzIGRlcGVuZGVuY3lcblxuXG5mdW5jdGlvbiBwb3N0TmV3UmVhY3Rpb24ocmVhY3Rpb25EYXRhLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgY29udGVudERhdGEsIHN1Y2Nlc3MsIGVycm9yKSB7XG4gICAgdmFyIGNvbnRlbnRCb2R5ID0gY29udGVudERhdGEuYm9keTtcbiAgICB2YXIgY29udGVudFR5cGUgPSBjb250ZW50RGF0YS50eXBlO1xuICAgIHZhciBjb250ZW50TG9jYXRpb24gPSBjb250ZW50RGF0YS5sb2NhdGlvbjtcbiAgICB2YXIgY29udGVudERpbWVuc2lvbnMgPSBjb250ZW50RGF0YS5kaW1lbnNpb25zO1xuICAgIFhETUNsaWVudC5nZXRVc2VyKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgIHZhciB1c2VySW5mbyA9IHJlc3BvbnNlLmRhdGE7XG4gICAgICAgIC8vIFRPRE8gZXh0cmFjdCB0aGUgc2hhcGUgb2YgdGhpcyBkYXRhIGFuZCBwb3NzaWJseSB0aGUgd2hvbGUgQVBJIGNhbGxcbiAgICAgICAgLy8gVE9ETyBmaWd1cmUgb3V0IHdoaWNoIHBhcnRzIGRvbid0IGdldCBwYXNzZWQgZm9yIGEgbmV3IHJlYWN0aW9uXG4gICAgICAgIC8vIFRPRE8gY29tcHV0ZSBmaWVsZCB2YWx1ZXMgKGUuZy4gY29udGFpbmVyX2tpbmQgYW5kIGNvbnRlbnQgaW5mbykgZm9yIG5ldyByZWFjdGlvbnNcbiAgICAgICAgdmFyIGRhdGEgPSB7XG4gICAgICAgICAgICB0YWc6IHtcbiAgICAgICAgICAgICAgICBib2R5OiByZWFjdGlvbkRhdGEudGV4dFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGlzX2RlZmF1bHQ6ICd0cnVlJyxcbiAgICAgICAgICAgIGhhc2g6IGNvbnRhaW5lckRhdGEuaGFzaCxcbiAgICAgICAgICAgIHVzZXJfaWQ6IHVzZXJJbmZvLnVzZXJfaWQsXG4gICAgICAgICAgICBhbnRfdG9rZW46IHVzZXJJbmZvLmFudF90b2tlbixcbiAgICAgICAgICAgIHBhZ2VfaWQ6IHBhZ2VEYXRhLnBhZ2VJZCxcbiAgICAgICAgICAgIGdyb3VwX2lkOiBwYWdlRGF0YS5ncm91cElkLFxuICAgICAgICAgICAgY29udGFpbmVyX2tpbmQ6IGNvbnRlbnRUeXBlLCAvLyBPbmUgb2YgJ3BhZ2UnLCAndGV4dCcsICdtZWRpYScsICdpbWcnXG4gICAgICAgICAgICBjb250ZW50X25vZGVfZGF0YToge1xuICAgICAgICAgICAgICAgIGJvZHk6IGNvbnRlbnRCb2R5LFxuICAgICAgICAgICAgICAgIGtpbmQ6IGNvbnRlbnRUeXBlLFxuICAgICAgICAgICAgICAgIGl0ZW1fdHlwZTogJycgLy8gVE9ETzogbG9va3MgdW51c2VkIGJ1dCBUYWdIYW5kbGVyIGJsb3dzIHVwIHdpdGhvdXQgaXQuIEN1cnJlbnQgY2xpZW50IHBhc3NlcyBpbiBcInBhZ2VcIiBmb3IgcGFnZSByZWFjdGlvbnMuXG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIGlmIChjb250ZW50TG9jYXRpb24pIHtcbiAgICAgICAgICAgIGRhdGEuY29udGVudF9ub2RlX2RhdGEubG9jYXRpb24gPSBjb250ZW50TG9jYXRpb247XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvbnRlbnREaW1lbnNpb25zKSB7XG4gICAgICAgICAgICBkYXRhLmNvbnRlbnRfbm9kZV9kYXRhLmhlaWdodCA9IGNvbnRlbnREaW1lbnNpb25zLmhlaWdodDtcbiAgICAgICAgICAgIGRhdGEuY29udGVudF9ub2RlX2RhdGEud2lkdGggPSBjb250ZW50RGltZW5zaW9ucy53aWR0aDtcbiAgICAgICAgfVxuICAgICAgICBpZiAocmVhY3Rpb25EYXRhLmlkKSB7XG4gICAgICAgICAgICBkYXRhLnRhZy5pZCA9IHJlYWN0aW9uRGF0YS5pZDsgLy8gVE9ETyB0aGUgY3VycmVudCBjbGllbnQgc2VuZHMgXCItMTAxXCIgaWYgdGhlcmUncyBubyBpZC4gaXMgdGhpcyBuZWNlc3Nhcnk/XG4gICAgICAgIH1cbiAgICAgICAgJC5nZXRKU09OUChVUkxzLmNyZWF0ZVJlYWN0aW9uVXJsKCksIGRhdGEsIG5ld1JlYWN0aW9uU3VjY2Vzcyhjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgc3VjY2VzcyksIGVycm9yKTtcbiAgICAgICAgLy92YXIgcmVzcG9uc2UgPSB7IC8vIFRPRE86IGp1c3QgY2FwdHVyaW5nIHRoZSBhcGkgZm9ybWF0Li4uXG4gICAgICAgIC8vICAgICAgICBleGlzdGluZzoganNvbi5leGlzdGluZyxcbiAgICAgICAgLy8gICAgICAgIGludGVyYWN0aW9uOiB7XG4gICAgICAgIC8vICAgICAgICAgICAgaWQ6IGpzb24uaW50ZXJhY3Rpb24uaWQsXG4gICAgICAgIC8vICAgICAgICAgICAgaW50ZXJhY3Rpb25fbm9kZToge1xuICAgICAgICAvLyAgICAgICAgICAgICAgICBib2R5OiBqc29uLmludGVyYWN0aW9uLmludGVyYWN0aW9uX25vZGUuYm9keSxcbiAgICAgICAgLy8gICAgICAgICAgICAgICAgaWQ6IGpzb24uaW50ZXJhY3Rpb24uaW50ZXJhY3Rpb25fbm9kZS5pZFxuICAgICAgICAvLyAgICAgICAgICAgIH1cbiAgICAgICAgLy8gICAgICAgIH1cbiAgICAgICAgLy8gICAgfTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gcG9zdFBsdXNPbmUocmVhY3Rpb25EYXRhLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgc3VjY2VzcywgZXJyb3IpIHtcbiAgICBYRE1DbGllbnQuZ2V0VXNlcihmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICB2YXIgdXNlckluZm8gPSByZXNwb25zZS5kYXRhO1xuICAgICAgICAvLyBUT0RPIGV4dHJhY3QgdGhlIHNoYXBlIG9mIHRoaXMgZGF0YSBhbmQgcG9zc2libHkgdGhlIHdob2xlIEFQSSBjYWxsXG4gICAgICAgIC8vIFRPRE8gZmlndXJlIG91dCB3aGljaCBwYXJ0cyBkb24ndCBnZXQgcGFzc2VkIGZvciBhIG5ldyByZWFjdGlvblxuICAgICAgICAvLyBUT0RPIGNvbXB1dGUgZmllbGQgdmFsdWVzIChlLmcuIGNvbnRhaW5lcl9raW5kIGFuZCBjb250ZW50IGluZm8pIGZvciBuZXcgcmVhY3Rpb25zXG4gICAgICAgIGlmICghcmVhY3Rpb25EYXRhLmNvbnRlbnQpIHtcbiAgICAgICAgICAgIC8vIFRoaXMgaXMgYSBzdW1tYXJ5IHJlYWN0aW9uLiBTZWUgaWYgd2UgaGF2ZSBhbnkgY29udGFpbmVyIGRhdGEgdGhhdCB3ZSBjYW4gbGluayB0byBpdC5cbiAgICAgICAgICAgIHZhciBjb250YWluZXJSZWFjdGlvbnMgPSBjb250YWluZXJEYXRhLnJlYWN0aW9ucztcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY29udGFpbmVyUmVhY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNvbnRhaW5lclJlYWN0aW9uID0gY29udGFpbmVyUmVhY3Rpb25zW2ldO1xuICAgICAgICAgICAgICAgIGlmIChjb250YWluZXJSZWFjdGlvbi5pZCA9PT0gcmVhY3Rpb25EYXRhLmlkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlYWN0aW9uRGF0YS5wYXJlbnRJRCA9IGNvbnRhaW5lclJlYWN0aW9uLnBhcmVudElEO1xuICAgICAgICAgICAgICAgICAgICByZWFjdGlvbkRhdGEuY29udGVudCA9IGNvbnRhaW5lclJlYWN0aW9uLmNvbnRlbnQ7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB2YXIgZGF0YSA9IHtcbiAgICAgICAgICAgIHRhZzoge1xuICAgICAgICAgICAgICAgIGJvZHk6IHJlYWN0aW9uRGF0YS50ZXh0LFxuICAgICAgICAgICAgICAgIGlkOiByZWFjdGlvbkRhdGEuaWRcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpc19kZWZhdWx0OiAndHJ1ZScsIC8vIFRPRE8gY2hlY2sgaWYgdGhlIHJlYWN0aW9uIGlkL2JvZHkgbWF0Y2hlcyBhIGRlZmF1bHRcbiAgICAgICAgICAgIGhhc2g6IGNvbnRhaW5lckRhdGEuaGFzaCxcbiAgICAgICAgICAgIHVzZXJfaWQ6IHVzZXJJbmZvLnVzZXJfaWQsXG4gICAgICAgICAgICBhbnRfdG9rZW46IHVzZXJJbmZvLmFudF90b2tlbixcbiAgICAgICAgICAgIHBhZ2VfaWQ6IHBhZ2VEYXRhLnBhZ2VJZCxcbiAgICAgICAgICAgIGdyb3VwX2lkOiBwYWdlRGF0YS5ncm91cElkLFxuICAgICAgICAgICAgY29udGFpbmVyX2tpbmQ6IGNvbnRhaW5lckRhdGEudHlwZSwgLy8gJ3BhZ2UnLCAndGV4dCcsICdtZWRpYScsICdpbWcnXG4gICAgICAgICAgICBjb250ZW50X25vZGVfZGF0YToge1xuICAgICAgICAgICAgICAgIGJvZHk6ICcnLCAvLyBUT0RPOiBkbyB3ZSBuZWVkIHRoaXMgZm9yICsxcz8gbG9va3MgbGlrZSBvbmx5IHRoZSBpZCBmaWVsZCBpcyB1c2VkLCBpZiBvbmUgaXMgc2V0XG4gICAgICAgICAgICAgICAga2luZDogY29udGVudE5vZGVEYXRhS2luZChjb250YWluZXJEYXRhLnR5cGUpLFxuICAgICAgICAgICAgICAgIGl0ZW1fdHlwZTogJycgLy8gVE9ETzogbG9va3MgdW51c2VkIGJ1dCBUYWdIYW5kbGVyIGJsb3dzIHVwIHdpdGhvdXQgaXRcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgaWYgKHJlYWN0aW9uRGF0YS5jb250ZW50KSB7XG4gICAgICAgICAgICBkYXRhLmNvbnRlbnRfbm9kZV9kYXRhLmlkID0gcmVhY3Rpb25EYXRhLmNvbnRlbnQuaWQ7XG4gICAgICAgICAgICBkYXRhLmNvbnRlbnRfbm9kZV9kYXRhLmxvY2F0aW9uID0gcmVhY3Rpb25EYXRhLmNvbnRlbnQubG9jYXRpb247XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJlYWN0aW9uRGF0YS5wYXJlbnRJRCkge1xuICAgICAgICAgICAgZGF0YS50YWcucGFyZW50X2lkID0gcmVhY3Rpb25EYXRhLnBhcmVudElEO1xuICAgICAgICB9XG4gICAgICAgICQuZ2V0SlNPTlAoVVJMcy5jcmVhdGVSZWFjdGlvblVybCgpLCBkYXRhLCBwbHVzT25lU3VjY2VzcyhyZWFjdGlvbkRhdGEsIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBzdWNjZXNzKSwgZXJyb3IpO1xuICAgICAgICAvL3ZhciByZXNwb25zZSA9IHsgLy8gVE9ETzoganVzdCBjYXB0dXJpbmcgdGhlIGFwaSBmb3JtYXQuLi5cbiAgICAgICAgLy8gICAgICAgIGV4aXN0aW5nOiBqc29uLmV4aXN0aW5nLFxuICAgICAgICAvLyAgICAgICAgaW50ZXJhY3Rpb246IHtcbiAgICAgICAgLy8gICAgICAgICAgICBpZDoganNvbi5pbnRlcmFjdGlvbi5pZCxcbiAgICAgICAgLy8gICAgICAgICAgICBpbnRlcmFjdGlvbl9ub2RlOiB7XG4gICAgICAgIC8vICAgICAgICAgICAgICAgIGJvZHk6IGpzb24uaW50ZXJhY3Rpb24uaW50ZXJhY3Rpb25fbm9kZS5ib2R5LFxuICAgICAgICAvLyAgICAgICAgICAgICAgICBpZDoganNvbi5pbnRlcmFjdGlvbi5pbnRlcmFjdGlvbl9ub2RlLmlkXG4gICAgICAgIC8vICAgICAgICAgICAgfVxuICAgICAgICAvLyAgICAgICAgfVxuICAgICAgICAvLyAgICB9O1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBwb3N0Q29tbWVudChjb21tZW50LCByZWFjdGlvbkRhdGEsIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBzdWNjZXNzLCBlcnJvcikge1xuICAgIC8vIFRPRE86IHJlZmFjdG9yIHRoZSBwb3N0IGZ1bmN0aW9ucyB0byBlbGltaW5hdGUgYWxsIHRoZSBjb3BpZWQgY29kZVxuICAgIFhETUNsaWVudC5nZXRVc2VyKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgIHZhciB1c2VySW5mbyA9IHJlc3BvbnNlLmRhdGE7XG4gICAgICAgIC8vIFRPRE8gZXh0cmFjdCB0aGUgc2hhcGUgb2YgdGhpcyBkYXRhIGFuZCBwb3NzaWJseSB0aGUgd2hvbGUgQVBJIGNhbGxcbiAgICAgICAgLy8gVE9ETyBmaWd1cmUgb3V0IHdoaWNoIHBhcnRzIGRvbid0IGdldCBwYXNzZWQgZm9yIGEgbmV3IHJlYWN0aW9uXG4gICAgICAgIC8vIFRPRE8gY29tcHV0ZSBmaWVsZCB2YWx1ZXMgKGUuZy4gY29udGFpbmVyX2tpbmQgYW5kIGNvbnRlbnQgaW5mbykgZm9yIG5ldyByZWFjdGlvbnNcbiAgICAgICAgaWYgKCFyZWFjdGlvbkRhdGEuY29udGVudCkge1xuICAgICAgICAgICAgLy8gVGhpcyBpcyBhIHN1bW1hcnkgcmVhY3Rpb24uIFNlZSBpZiB3ZSBoYXZlIGFueSBjb250YWluZXIgZGF0YSB0aGF0IHdlIGNhbiBsaW5rIHRvIGl0LlxuICAgICAgICAgICAgdmFyIGNvbnRhaW5lclJlYWN0aW9ucyA9IGNvbnRhaW5lckRhdGEucmVhY3Rpb25zO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb250YWluZXJSZWFjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgY29udGFpbmVyUmVhY3Rpb24gPSBjb250YWluZXJSZWFjdGlvbnNbaV07XG4gICAgICAgICAgICAgICAgaWYgKGNvbnRhaW5lclJlYWN0aW9uLmlkID09PSByZWFjdGlvbkRhdGEuaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVhY3Rpb25EYXRhLnBhcmVudElEID0gY29udGFpbmVyUmVhY3Rpb24ucGFyZW50SUQ7XG4gICAgICAgICAgICAgICAgICAgIHJlYWN0aW9uRGF0YS5jb250ZW50ID0gY29udGFpbmVyUmVhY3Rpb24uY29udGVudDtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHZhciBkYXRhID0ge1xuICAgICAgICAgICAgY29tbWVudDogY29tbWVudCxcbiAgICAgICAgICAgIHRhZzoge1xuICAgICAgICAgICAgICAgIGJvZHk6IHJlYWN0aW9uRGF0YS50ZXh0LFxuICAgICAgICAgICAgICAgIGlkOiByZWFjdGlvbkRhdGEuaWRcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpc19kZWZhdWx0OiAndHJ1ZScsIC8vIFRPRE8gY2hlY2sgaWYgdGhlIHJlYWN0aW9uIGlkL2JvZHkgbWF0Y2hlcyBhIGRlZmF1bHRcbiAgICAgICAgICAgIGhhc2g6IGNvbnRhaW5lckRhdGEuaGFzaCxcbiAgICAgICAgICAgIHVzZXJfaWQ6IHVzZXJJbmZvLnVzZXJfaWQsXG4gICAgICAgICAgICBhbnRfdG9rZW46IHVzZXJJbmZvLmFudF90b2tlbixcbiAgICAgICAgICAgIHBhZ2VfaWQ6IHBhZ2VEYXRhLnBhZ2VJZCxcbiAgICAgICAgICAgIGdyb3VwX2lkOiBwYWdlRGF0YS5ncm91cElkLFxuICAgICAgICAgICAgY29udGFpbmVyX2tpbmQ6IGNvbnRhaW5lckRhdGEudHlwZSwgLy8gJ3BhZ2UnLCAndGV4dCcsICdtZWRpYScsICdpbWcnXG4gICAgICAgICAgICBjb250ZW50X25vZGVfZGF0YToge1xuICAgICAgICAgICAgICAgIGJvZHk6ICcnLCAvLyBUT0RPOiBkbyB3ZSBuZWVkIHRoaXMgZm9yICsxcz8gbG9va3MgbGlrZSBvbmx5IHRoZSBpZCBmaWVsZCBpcyB1c2VkLCBpZiBvbmUgaXMgc2V0XG4gICAgICAgICAgICAgICAga2luZDogY29udGVudE5vZGVEYXRhS2luZChjb250YWluZXJEYXRhLnR5cGUpLFxuICAgICAgICAgICAgICAgIGl0ZW1fdHlwZTogJycgLy8gVE9ETzogbG9va3MgdW51c2VkIGJ1dCBUYWdIYW5kbGVyIGJsb3dzIHVwIHdpdGhvdXQgaXRcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgaWYgKHJlYWN0aW9uRGF0YS5jb250ZW50KSB7XG4gICAgICAgICAgICBkYXRhLmNvbnRlbnRfbm9kZV9kYXRhLmlkID0gcmVhY3Rpb25EYXRhLmNvbnRlbnQuaWQ7XG4gICAgICAgICAgICBkYXRhLmNvbnRlbnRfbm9kZV9kYXRhLmxvY2F0aW9uID0gcmVhY3Rpb25EYXRhLmNvbnRlbnQubG9jYXRpb247XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJlYWN0aW9uRGF0YS5wYXJlbnRJRCkge1xuICAgICAgICAgICAgZGF0YS50YWcucGFyZW50X2lkID0gcmVhY3Rpb25EYXRhLnBhcmVudElEO1xuICAgICAgICB9XG4gICAgICAgICQuZ2V0SlNPTlAoVVJMcy5jcmVhdGVDb21tZW50VXJsKCksIGRhdGEsIGNvbW1lbnRTdWNjZXNzKHJlYWN0aW9uRGF0YSwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIHN1Y2Nlc3MpLCBlcnJvcik7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGNvbnRlbnROb2RlRGF0YUtpbmQodHlwZSkge1xuICAgIC8vIFRPRE86IHJlc29sdmUgd2hldGhlciB0byB1c2UgdGhlIHNob3J0IG9yIGxvbmcgZm9ybSBmb3IgY29udGVudF9ub2RlX2RhdGEua2luZC4gLy8gJ3BhZycsICd0eHQnLCAnbWVkJywgJ2ltZydcbiAgICBpZiAodHlwZSA9PT0gJ2ltYWdlJykge1xuICAgICAgICByZXR1cm4gJ2ltZyc7XG4gICAgfVxuICAgIHJldHVybiB0eXBlO1xufVxuXG5mdW5jdGlvbiBpc0RlZmF1bHRSZWFjdGlvbihyZWFjdGlvbiwgZGVmYXVsdFJlYWN0aW9ucykge1xuICAgIC8vIFRPRE8gY29uc2lkZXIgdGFnZ2luZyB0aGUgcmVhY3Rpb24gZGF0YSBvbiByZWFkL2xvYWQgcmF0aGVyIHRoYW4gb24gd3JpdGVcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRlZmF1bHRSZWFjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKHJlYWN0aW9uLmlkICYmIGRlZmF1bHRSZWFjdGlvbnNbaV0uaWQgJiYgcmVhY3Rpb24uaWQgPT09IGRlZmF1bHRSZWFjdGlvbnNbaV0uaWQpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gY29tbWVudFN1Y2Nlc3MocmVhY3Rpb25EYXRhLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgY2FsbGJhY2spIHtcbiAgICByZXR1cm4gZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgLy8gVE9ETzogaW4gdGhlIGNhc2UgdGhhdCBzb21lb25lIHJlYWN0cyBhbmQgdGhlbiBpbW1lZGlhdGVseSBjb21tZW50cywgd2UgaGF2ZSBhIHJhY2UgY29uZGl0aW9uIHdoZXJlIHRoZVxuICAgICAgICAvLyAgICAgICBjb21tZW50IHJlc3BvbnNlIGNvdWxkIGNvbWUgYmFjayBiZWZvcmUgdGhlIHJlYWN0aW9uLiB3ZSBuZWVkIHRvOlxuICAgICAgICAvLyAgICAgICAxLiBNYWtlIHN1cmUgdGhlIHNlcnZlciBvbmx5IGNyZWF0ZXMgYSBzaW5nbGUgcmVhY3Rpb24gaW4gdGhpcyBjYXNlIChub3QgYSBIVUdFIGRlYWwgaWYgaXQgbWFrZXMgdHdvKVxuICAgICAgICAvLyAgICAgICAyLiBSZXNvbHZlIHRoZSB0d28gcmVzcG9uc2VzIHRoYXQgYm90aCB0aGVvcmV0aWNhbGx5IGNvbWUgYmFjayB3aXRoIHRoZSBzYW1lIHJlYWN0aW9uIGRhdGEgYXQgdGhlIHNhbWVcbiAgICAgICAgLy8gICAgICAgICAgdGltZS4gTWFrZSBzdXJlIHdlIGRvbid0IGVuZCB1cCB3aXRoIHR3byBjb3BpZXMgb2YgdGhlIHNhbWUgZGF0YSBpbiB0aGUgbW9kZWwuXG4gICAgICAgIHZhciByZWFjdGlvbkNyZWF0ZWQgPSAhcmVzcG9uc2UuZXhpc3Rpbmc7XG4gICAgICAgIGlmIChyZWFjdGlvbkNyZWF0ZWQpIHtcbiAgICAgICAgICAgIHZhciBjb21tZW50cyA9IHJlYWN0aW9uRGF0YS5jb21tZW50cztcbiAgICAgICAgICAgIGlmICghY29tbWVudHMpIHtcbiAgICAgICAgICAgICAgICBjb21tZW50cyA9IHJlYWN0aW9uRGF0YS5jb21tZW50cyA9IHsgY291bnQ6IDAsIGNvbW1lbnRzVXJsOiBjb21tZW50c1VybChyZWFjdGlvbkRhdGEsIGNvbnRhaW5lckRhdGEpIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb21tZW50cy5jb3VudCA9IGNvbW1lbnRzLmNvdW50ICsgMTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIFRPRE86IGRvIHdlIGV2ZXIgZ2V0IGEgcmVzcG9uc2UgdG8gYSBuZXcgcmVhY3Rpb24gdGVsbGluZyB1cyB0aGF0IGl0J3MgYWxyZWFkeSBleGlzdGluZz8gSWYgc28sIGNvdWxkIHRoZSBjb3VudCBuZWVkIHRvIGJlIHVwZGF0ZWQ/XG4gICAgICAgIH1cbiAgICAgICAgY2FsbGJhY2socmVhY3Rpb25DcmVhdGVkKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHBsdXNPbmVTdWNjZXNzKHJlYWN0aW9uRGF0YSwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGNhbGxiYWNrKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgIHZhciByZWFjdGlvbkNyZWF0ZWQgPSAhcmVzcG9uc2UuZXhpc3Rpbmc7XG4gICAgICAgIGlmIChyZWFjdGlvbkNyZWF0ZWQpIHtcbiAgICAgICAgICAgIC8vIFRPRE86IHdlIHNob3VsZCBnZXQgYmFjayBhIHJlc3BvbnNlIHdpdGggZGF0YSBpbiB0aGUgXCJuZXcgZm9ybWF0XCIgYW5kIHVwZGF0ZSB0aGUgbW9kZWwgZnJvbSB0aGUgcmVzcG9uc2VcbiAgICAgICAgICAgIHJlYWN0aW9uRGF0YS5jb3VudCA9IHJlYWN0aW9uRGF0YS5jb3VudCArIDE7XG4gICAgICAgICAgICBjb250YWluZXJEYXRhLnJlYWN0aW9uVG90YWwgPSBjb250YWluZXJEYXRhLnJlYWN0aW9uVG90YWwgKyAxO1xuICAgICAgICAgICAgcGFnZURhdGEuc3VtbWFyeVRvdGFsID0gcGFnZURhdGEuc3VtbWFyeVRvdGFsICsgMTtcbiAgICAgICAgfVxuICAgICAgICBjYWxsYmFjayhyZWFjdGlvbkNyZWF0ZWQpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gbmV3UmVhY3Rpb25TdWNjZXNzKGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBjYWxsYmFjaykge1xuICAgIHJldHVybiBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICB2YXIgcmVhY3Rpb25DcmVhdGVkID0gIXJlc3BvbnNlLmV4aXN0aW5nO1xuICAgICAgICBpZiAocmVhY3Rpb25DcmVhdGVkKSB7XG4gICAgICAgICAgICB2YXIgcmVhY3Rpb24gPSByZWFjdGlvbkZyb21SZXNwb25zZShyZXNwb25zZSk7XG4gICAgICAgICAgICByZWFjdGlvbiA9IFBhZ2VEYXRhLnJlZ2lzdGVyUmVhY3Rpb24ocmVhY3Rpb24sIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIFRPRE86IGRvIHdlIGV2ZXIgZ2V0IGEgcmVzcG9uc2UgdG8gYSBuZXcgcmVhY3Rpb24gdGVsbGluZyB1cyB0aGF0IGl0J3MgYWxyZWFkeSBleGlzdGluZz8gSWYgc28sIGNvdWxkIHRoZSBjb3VudCBuZWVkIHRvIGJlIHVwZGF0ZWQ/XG4gICAgICAgIH1cbiAgICAgICAgY2FsbGJhY2socmVhY3Rpb25DcmVhdGVkKTtcbiAgICB9O1xufVxuXG5mdW5jdGlvbiByZWFjdGlvbkZyb21SZXNwb25zZShyZXNwb25zZSkge1xuICAgIC8vIFRPRE86IHRoZSBzZXJ2ZXIgc2hvdWxkIGdpdmUgdXMgYmFjayBhIHJlYWN0aW9uIG1hdGNoaW5nIHRoZSBuZXcgQVBJIGZvcm1hdC5cbiAgICAvLyAgICAgICB3ZSdyZSBqdXN0IGZha2luZyBpdCBvdXQgZm9yIG5vdzsgdGhpcyBjb2RlIGlzIHRlbXBvcmFyeVxuICAgIHZhciByZWFjdGlvbiA9IHtcbiAgICAgICAgdGV4dDogcmVzcG9uc2UuaW50ZXJhY3Rpb24uaW50ZXJhY3Rpb25fbm9kZS5ib2R5LFxuICAgICAgICBpZDogcmVzcG9uc2UuaW50ZXJhY3Rpb24uaW50ZXJhY3Rpb25fbm9kZS5pZCxcbiAgICAgICAgY291bnQ6IDEsIC8vIFRPRE86IGNvdWxkIHdlIGdldCBiYWNrIGEgZGlmZmVyZW50IGNvdW50IGlmIHNvbWVvbmUgZWxzZSBtYWRlIHRoZSBzYW1lIFwibmV3XCIgcmVhY3Rpb24gYmVmb3JlIHVzP1xuICAgICAgICAvLyBwYXJlbnRJZDogPz8/IFRPRE86IGNvdWxkIHdlIGdldCBhIHBhcmVudElkIGJhY2sgaWYgc29tZW9uZSBlbHNlIG1hZGUgdGhlIHNhbWUgXCJuZXdcIiByZWFjdGlvbiBiZWZvcmUgdXM/XG4gICAgfTtcbiAgICBpZiAocmVzcG9uc2UuY29udGVudF9ub2RlKSB7XG4gICAgICAgIHJlYWN0aW9uLmNvbnRlbnQgPSB7XG4gICAgICAgICAgICBpZDogcmVzcG9uc2UuY29udGVudF9ub2RlLmlkLFxuICAgICAgICAgICAga2luZDogcmVzcG9uc2UuY29udGVudF9ub2RlLmtpbmQsXG4gICAgICAgICAgICBib2R5OiByZXNwb25zZS5jb250ZW50X25vZGUuYm9keVxuICAgICAgICB9O1xuICAgICAgICBpZiAocmVzcG9uc2UuY29udGVudF9ub2RlLmxvY2F0aW9uKSB7XG4gICAgICAgICAgICByZWFjdGlvbi5jb250ZW50LmxvY2F0aW9uID0gcmVzcG9uc2UuY29udGVudF9ub2RlLmxvY2F0aW9uO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZWFjdGlvbjtcbn1cblxuZnVuY3Rpb24gZ2V0Q29tbWVudHMocmVhY3Rpb24sIGNhbGxiYWNrKSB7XG4gICAgWERNQ2xpZW50LmdldFVzZXIoZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgdmFyIHVzZXJJbmZvID0gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgdmFyIGRhdGEgPSB7XG4gICAgICAgICAgICByZWFjdGlvbl9pZDogcmVhY3Rpb24ucGFyZW50SUQsXG4gICAgICAgICAgICB1c2VyX2lkOiB1c2VySW5mby51c2VyX2lkLFxuICAgICAgICAgICAgYW50X3Rva2VuOiB1c2VySW5mby5hbnRfdG9rZW5cbiAgICAgICAgfTtcbiAgICAgICAgJC5nZXRKU09OUChVUkxzLmZldGNoQ29tbWVudFVybCgpLCBkYXRhLCBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAgICAgY2FsbGJhY2soY29tbWVudHNGcm9tUmVzcG9uc2UocmVzcG9uc2UpKTtcbiAgICAgICAgfSwgZnVuY3Rpb24obWVzc2FnZSkge1xuICAgICAgICAgICAgLy8gVE9ETzogZXJyb3IgaGFuZGxpbmdcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdBbiBlcnJvciBvY2N1cnJlZCBmZXRjaGluZyBjb21tZW50czogJyArIG1lc3NhZ2UpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gY29tbWVudHNGcm9tUmVzcG9uc2UoanNvbkNvbW1lbnRzKSB7XG4gICAgdmFyIGNvbW1lbnRzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBqc29uQ29tbWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGpzb25Db21tZW50ID0ganNvbkNvbW1lbnRzW2ldO1xuICAgICAgICB2YXIgY29tbWVudCA9IHtcbiAgICAgICAgICAgIHRleHQ6IGpzb25Db21tZW50LnRleHQsXG4gICAgICAgICAgICBpZDoganNvbkNvbW1lbnQuaWQsIC8vIFRPRE86IHdlIHByb2JhYmx5IG9ubHkgbmVlZCB0aGlzIGZvciArMSdpbmcgY29tbWVudHNcbiAgICAgICAgICAgIGNvbnRlbnRJRDoganNvbkNvbW1lbnQuY29udGVudElELCAvLyBUT0RPOiBEbyB3ZSByZWFsbHkgbmVlZCB0aGlzP1xuICAgICAgICAgICAgdXNlcjoge1xuICAgICAgICAgICAgICAgIG5hbWU6IGpzb25Db21tZW50LmZpcnN0X25hbWUgPyAoanNvbkNvbW1lbnQuZmlyc3RfbmFtZSArICcgJyArIGpzb25Db21tZW50Lmxhc3RfbmFtZSkgOiAnQW5vbnltb3VzJ1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBpZiAoanNvbkNvbW1lbnQuc29jaWFsX3VzZXIgJiYganNvbkNvbW1lbnQuc29jaWFsX3VzZXIuaW1nX3VybCkge1xuICAgICAgICAgICAgY29tbWVudC51c2VyLmltYWdlVVJMID0ganNvbkNvbW1lbnQuc29jaWFsX3VzZXIuaW1nX3VybDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbW1lbnQudXNlci5pbWFnZVVSTCA9IGlzT2ZmbGluZSA/ICcvc3RhdGljL3dpZGdldC9pbWFnZXMvYW5vbnltb3VzcGxvZGUucG5nJyA6ICdodHRwOi8vczMuYW1hem9uYXdzLmNvbS9yZWFkcmJvYXJkL3dpZGdldC9pbWFnZXMvYW5vbnltb3VzcGxvZGUucG5nJztcbiAgICAgICAgfVxuICAgICAgICBjb21tZW50cy5wdXNoKGNvbW1lbnQpO1xuICAgIH1cbiAgICByZXR1cm4gY29tbWVudHM7XG59XG5cbmZ1bmN0aW9uIGNvbW1lbnRzVXJsKHJlYWN0aW9uLCBjb250YWluZXJEYXRhKSB7XG4gICAgLy8gVE9ETzogbmVlZCB0byBzZW5kIHRoZSBVUkwgYmFjayBmcm9tIHRoZSBzZXJ2ZXIuIHRoaXMgcGF0aCBtYXRoIGlzIHRlbXBvcmFyeVxuICAgIHJldHVybiAnL2FwaS9jb21tZW50cy8nICsgY29udGFpbmVyRGF0YS5pZCArICcvJyArIHJlYWN0aW9uLmlkO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgcG9zdFBsdXNPbmU6IHBvc3RQbHVzT25lLFxuICAgIHBvc3ROZXdSZWFjdGlvbjogcG9zdE5ld1JlYWN0aW9uLFxuICAgIHBvc3RDb21tZW50OiBwb3N0Q29tbWVudCxcbiAgICBnZXRDb21tZW50czogZ2V0Q29tbWVudHNcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgTUQ1ID0gcmVxdWlyZSgnLi9tZDUnKTtcblxuLy8gVE9ETzogVGhpcyBpcyBqdXN0IGNvcHkvcGFzdGVkIGZyb20gZW5nYWdlX2Z1bGxcbi8vIFRPRE86IFRoZSBjb2RlIGlzIGxvb2tpbmcgZm9yIC5hbnRfaW5kaWNhdG9yIHRvIHNlZSBpZiBpdCdzIGFscmVhZHkgYmVlbiBoYXNoZWQuIFJldmlldy5cbmZ1bmN0aW9uIGdldENsZWFuVGV4dCgkZG9tTm9kZSkge1xuICAgIC8vIEFOVC51dGlsLmdldENsZWFuVGV4dFxuICAgIC8vIGNvbW1vbiBmdW5jdGlvbiBmb3IgY2xlYW5pbmcgdGhlIHRleHQgbm9kZSB0ZXh0LiAgcmlnaHQgbm93LCBpdCdzIHJlbW92aW5nIHNwYWNlcywgdGFicywgbmV3bGluZXMsIGFuZCB0aGVuIGRvdWJsZSBzcGFjZXNcblxuICAgIHZhciAkbm9kZSA9ICRkb21Ob2RlLmNsb25lKCk7XG5cbiAgICAkbm9kZS5maW5kKCcuYW50LCAuYW50LWN1c3RvbS1jdGEtY29udGFpbmVyJykucmVtb3ZlKCk7XG5cbiAgICAvL21ha2Ugc3VyZSBpdCBkb2VzbnQgYWxyZWR5IGhhdmUgaW4gaW5kaWNhdG9yIC0gaXQgc2hvdWxkbid0LlxuICAgIHZhciAkaW5kaWNhdG9yID0gJG5vZGUuZmluZCgnLmFudF9pbmRpY2F0b3InKTtcbiAgICBpZigkaW5kaWNhdG9yLmxlbmd0aCl7XG4gICAgICAgIC8vdG9kbzogc2VuZCB1cyBhbiBlcnJvciByZXBvcnQgLSB0aGlzIG1heSBzdGlsbCBiZSBoYXBwZW5pbmcgZm9yIHNsaWRlc2hvd3MuXG4gICAgICAgIC8vVGhpcyBmaXggd29ya3MgZmluZSwgYnV0IHdlIHNob3VsZCBmaXggdGhlIGNvZGUgdG8gaGFuZGxlIGl0IGJlZm9yZSBoZXJlLlxuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gZ2V0IHRoZSBub2RlJ3MgdGV4dCBhbmQgc21hc2ggY2FzZVxuICAgIC8vIFRPRE86IDxicj4gdGFncyBhbmQgYmxvY2stbGV2ZWwgdGFncyBjYW4gc2NyZXcgdXAgd29yZHMuICBleDpcbiAgICAvLyBoZWxsbzxicj5ob3cgYXJlIHlvdT8gICBoZXJlIGJlY29tZXNcbiAgICAvLyBoZWxsb2hvdyBhcmUgeW91PyAgICA8LS0gbm8gc3BhY2Ugd2hlcmUgdGhlIDxicj4gd2FzLiAgYmFkLlxuICAgIHZhciBub2RlX3RleHQgPSAkLnRyaW0oICRub2RlLmh0bWwoKS5yZXBsYWNlKC88ICpiciAqXFwvPz4vZ2ksICcgJykgKTtcbiAgICB2YXIgYm9keSA9ICQudHJpbSggJCggXCI8ZGl2PlwiICsgbm9kZV90ZXh0ICsgXCI8L2Rpdj5cIiApLnRleHQoKS50b0xvd2VyQ2FzZSgpICk7XG5cbiAgICBpZiggYm9keSAmJiB0eXBlb2YgYm9keSA9PSBcInN0cmluZ1wiICYmIGJvZHkgIT09IFwiXCIgKSB7XG4gICAgICAgIHZhciBmaXJzdHBhc3MgPSBib2R5LnJlcGxhY2UoL1tcXG5cXHJcXHRdKy9naSwnICcpLnJlcGxhY2UoKS5yZXBsYWNlKC9cXHN7Mix9L2csJyAnKTtcbiAgICAgICAgLy8gc2VlaW5nIGlmIHRoaXMgaGVscHMgdGhlIHByb3B1YiBpc3N1ZSAtIHRvIHRyaW0gYWdhaW4uICBXaGVuIGkgcnVuIHRoaXMgbGluZSBhYm92ZSBpdCBsb29rcyBsaWtlIHRoZXJlIGlzIHN0aWxsIHdoaXRlIHNwYWNlLlxuICAgICAgICByZXR1cm4gJC50cmltKGZpcnN0cGFzcyk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBoYXNoVGV4dChlbGVtZW50KSB7XG4gICAgLy8gVE9ETzogSGFuZGxlIHRoZSBjYXNlIHdoZXJlIG11bHRpcGxlIGluc3RhbmNlcyBvZiB0aGUgc2FtZSB0ZXh0IGFwcGVhciBvbiB0aGUgcGFnZS4gTmVlZCB0byBhZGQgYW4gaW5jcmVtZW50IHRvXG4gICAgLy8gdGhlIGhhc2hUZXh0LiAoVGhpcyBjaGVjayBoYXMgdG8gYmUgc2NvcGVkIHRvIGEgcG9zdClcbiAgICB2YXIgdGV4dCA9IGdldENsZWFuVGV4dChlbGVtZW50KTtcbiAgICB2YXIgaGFzaFRleHQgPSBcInJkci10ZXh0LVwiK3RleHQ7XG4gICAgcmV0dXJuIE1ENS5oZXhfbWQ1KGhhc2hUZXh0KTtcbn1cblxuZnVuY3Rpb24gaGFzaFVybCh1cmwpIHtcbiAgICByZXR1cm4gTUQ1LmhleF9tZDUodXJsKTtcbn1cblxuZnVuY3Rpb24gaGFzaEltYWdlKGltYWdlVXJsKSB7XG4gICAgdmFyIGhhc2hUZXh0ID0gJ3Jkci1pbWctJyArIGltYWdlVXJsO1xuICAgIHJldHVybiBNRDUuaGV4X21kNShoYXNoVGV4dCk7XG59XG5cbmZ1bmN0aW9uIGhhc2hNZWRpYShlbGVtZW50KSB7XG5cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGhhc2hUZXh0OiBoYXNoVGV4dCxcbiAgICBoYXNoSW1hZ2U6IGhhc2hJbWFnZSxcbiAgICBoYXNoVXJsOiBoYXNoVXJsXG59OyIsInZhciBVUkxzID0gcmVxdWlyZSgnLi91cmxzJyk7XG5cbnZhciBsb2FkZWRqUXVlcnk7XG52YXIgY2FsbGJhY2tzID0gW107XG5cbi8vIE5vdGlmaWVzIHRoZSBqUXVlcnkgcHJvdmlkZXIgdGhhdCB3ZSd2ZSBsb2FkZWQgdGhlIGpRdWVyeSBsaWJyYXJ5LlxuZnVuY3Rpb24gbG9hZGVkKCkge1xuICAgIGxvYWRlZGpRdWVyeSA9IGpRdWVyeS5ub0NvbmZsaWN0KCk7XG4gICAgLy8gQWRkIG91ciBjdXN0b20gSlNPTlAgZnVuY3Rpb25cbiAgICBsb2FkZWRqUXVlcnkuZ2V0SlNPTlAgPSBmdW5jdGlvbih1cmwsIGRhdGEsIHN1Y2Nlc3MsIGVycm9yKSB7XG4gICAgICAgIHZhciBvcHRpb25zID0ge1xuICAgICAgICAgICAgdXJsOiBVUkxzLmFudGVubmFIb21lKCkgKyB1cmwsXG4gICAgICAgICAgICB0eXBlOiBcImdldFwiLFxuICAgICAgICAgICAgY29udGVudFR5cGU6IFwiYXBwbGljYXRpb24vanNvblwiLFxuICAgICAgICAgICAgZGF0YVR5cGU6IFwianNvbnBcIixcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uKHJlc3BvbnNlLCB0ZXh0U3RhdHVzLCBYSFIpIHtcbiAgICAgICAgICAgICAgICAvLyBUT0RPOiBSZXZpc2l0IHdoZXRoZXIgaXQncyByZWFsbHkgY29vbCB0byBrZXkgdGhpcyBvbiB0aGUgdGV4dFN0YXR1cyBvciBpZiB3ZSBzaG91bGQgYmUgbG9va2luZyBhdFxuICAgICAgICAgICAgICAgIC8vICAgICAgIHRoZSBzdGF0dXMgY29kZSBpbiB0aGUgWEhSXG4gICAgICAgICAgICAgICAgLy8gTm90ZTogVGhlIHNlcnZlciBjb21lcyBiYWNrIHdpdGggMjAwIHJlc3BvbnNlcyB3aXRoIGEgbmVzdGVkIHN0YXR1cyBvZiBcImZhaWxcIi4uLlxuICAgICAgICAgICAgICAgIGlmICh0ZXh0U3RhdHVzID09PSAnc3VjY2VzcycgJiYgcmVzcG9uc2Uuc3RhdHVzICE9PSAnZmFpbCcgJiYgKCFyZXNwb25zZS5kYXRhIHx8IHJlc3BvbnNlLmRhdGEuc3RhdHVzICE9PSAnZmFpbCcpKSB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3MocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gRm9yIEpTT05QIHJlcXVlc3RzLCBqUXVlcnkgZG9lc24ndCBjYWxsIGl0J3MgZXJyb3IgY2FsbGJhY2suIEl0IGNhbGxzIHN1Y2Nlc3MgaW5zdGVhZC5cbiAgICAgICAgICAgICAgICAgICAgZXJyb3IocmVzcG9uc2UubWVzc2FnZSB8fCByZXNwb25zZS5kYXRhLm1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgaWYgKGRhdGEpIHtcbiAgICAgICAgICAgIG9wdGlvbnMuZGF0YSA9IHsganNvbjogSlNPTi5zdHJpbmdpZnkoZGF0YSkgfTtcbiAgICAgICAgfVxuICAgICAgICBsb2FkZWRqUXVlcnkuYWpheChvcHRpb25zKTtcbiAgICB9O1xuICAgIG5vdGlmeUNhbGxiYWNrcygpO1xufVxuXG5mdW5jdGlvbiBub3RpZnlDYWxsYmFja3MoKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjYWxsYmFja3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY2FsbGJhY2tzW2ldKGxvYWRlZGpRdWVyeSk7XG4gICAgfVxuICAgIGNhbGxiYWNrcyA9IFtdO1xufVxuXG4vLyBSZWdpc3RlcnMgdGhlIGdpdmVuIGNhbGxiYWNrIHRvIGJlIG5vdGlmaWVkIHdoZW4gb3VyIHZlcnNpb24gb2YgalF1ZXJ5IGlzIGxvYWRlZC5cbmZ1bmN0aW9uIG9uTG9hZChjYWxsYmFjaykge1xuICAgIGlmIChsb2FkZWRqUXVlcnkpIHtcbiAgICAgICAgY2FsbGJhY2sobG9hZGVkalF1ZXJ5KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBjYWxsYmFja3MucHVzaChjYWxsYmFjayk7XG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgbG9hZGVkOiBsb2FkZWQsXG4gICAgb25Mb2FkOiBvbkxvYWRcbn07IiwiXG4vLyBUT0RPOiBUaGlzIGNvZGUgaXMganVzdCBjb3BpZWQgZnJvbSBlbmdhZ2VfZnVsbC5qcy4gUmV2aWV3IHdoZXRoZXIgd2Ugd2FudCB0byBrZWVwIGl0IGFzLWlzLlxuXG52YXIgQU5UID0ge1xuICAgIHV0aWw6IHtcbiAgICAgICAgbWQ1OiB7XG4gICAgICAgICAgICBoZXhjYXNlOjAsXG4gICAgICAgICAgICBiNjRwYWQ6XCJcIixcbiAgICAgICAgICAgIGNocnN6OjgsXG4gICAgICAgICAgICBoZXhfbWQ1OiBmdW5jdGlvbihzKXtyZXR1cm4gQU5ULnV0aWwubWQ1LmJpbmwyaGV4KEFOVC51dGlsLm1kNS5jb3JlX21kNShBTlQudXRpbC5tZDUuc3RyMmJpbmwocykscy5sZW5ndGgqQU5ULnV0aWwubWQ1LmNocnN6KSk7fSxcbiAgICAgICAgICAgIGNvcmVfbWQ1OiBmdW5jdGlvbih4LGxlbil7eFtsZW4+PjVdfD0weDgwPDwoKGxlbiklMzIpO3hbKCgobGVuKzY0KT4+PjkpPDw0KSsxNF09bGVuO3ZhciBhPTE3MzI1ODQxOTM7dmFyIGI9LTI3MTczMzg3OTt2YXIgYz0tMTczMjU4NDE5NDt2YXIgZD0yNzE3MzM4Nzg7Zm9yKHZhciBpPTA7aTx4Lmxlbmd0aDtpKz0xNil7dmFyIG9sZGE9YTt2YXIgb2xkYj1iO3ZhciBvbGRjPWM7dmFyIG9sZGQ9ZDthPUFOVC51dGlsLm1kNS5tZDVfZmYoYSxiLGMsZCx4W2krMF0sNywtNjgwODc2OTM2KTtkPUFOVC51dGlsLm1kNS5tZDVfZmYoZCxhLGIsYyx4W2krMV0sMTIsLTM4OTU2NDU4Nik7Yz1BTlQudXRpbC5tZDUubWQ1X2ZmKGMsZCxhLGIseFtpKzJdLDE3LDYwNjEwNTgxOSk7Yj1BTlQudXRpbC5tZDUubWQ1X2ZmKGIsYyxkLGEseFtpKzNdLDIyLC0xMDQ0NTI1MzMwKTthPUFOVC51dGlsLm1kNS5tZDVfZmYoYSxiLGMsZCx4W2krNF0sNywtMTc2NDE4ODk3KTtkPUFOVC51dGlsLm1kNS5tZDVfZmYoZCxhLGIsYyx4W2krNV0sMTIsMTIwMDA4MDQyNik7Yz1BTlQudXRpbC5tZDUubWQ1X2ZmKGMsZCxhLGIseFtpKzZdLDE3LC0xNDczMjMxMzQxKTtiPUFOVC51dGlsLm1kNS5tZDVfZmYoYixjLGQsYSx4W2krN10sMjIsLTQ1NzA1OTgzKTthPUFOVC51dGlsLm1kNS5tZDVfZmYoYSxiLGMsZCx4W2krOF0sNywxNzcwMDM1NDE2KTtkPUFOVC51dGlsLm1kNS5tZDVfZmYoZCxhLGIsYyx4W2krOV0sMTIsLTE5NTg0MTQ0MTcpO2M9QU5ULnV0aWwubWQ1Lm1kNV9mZihjLGQsYSxiLHhbaSsxMF0sMTcsLTQyMDYzKTtiPUFOVC51dGlsLm1kNS5tZDVfZmYoYixjLGQsYSx4W2krMTFdLDIyLC0xOTkwNDA0MTYyKTthPUFOVC51dGlsLm1kNS5tZDVfZmYoYSxiLGMsZCx4W2krMTJdLDcsMTgwNDYwMzY4Mik7ZD1BTlQudXRpbC5tZDUubWQ1X2ZmKGQsYSxiLGMseFtpKzEzXSwxMiwtNDAzNDExMDEpO2M9QU5ULnV0aWwubWQ1Lm1kNV9mZihjLGQsYSxiLHhbaSsxNF0sMTcsLTE1MDIwMDIyOTApO2I9QU5ULnV0aWwubWQ1Lm1kNV9mZihiLGMsZCxhLHhbaSsxNV0sMjIsMTIzNjUzNTMyOSk7YT1BTlQudXRpbC5tZDUubWQ1X2dnKGEsYixjLGQseFtpKzFdLDUsLTE2NTc5NjUxMCk7ZD1BTlQudXRpbC5tZDUubWQ1X2dnKGQsYSxiLGMseFtpKzZdLDksLTEwNjk1MDE2MzIpO2M9QU5ULnV0aWwubWQ1Lm1kNV9nZyhjLGQsYSxiLHhbaSsxMV0sMTQsNjQzNzE3NzEzKTtiPUFOVC51dGlsLm1kNS5tZDVfZ2coYixjLGQsYSx4W2krMF0sMjAsLTM3Mzg5NzMwMik7YT1BTlQudXRpbC5tZDUubWQ1X2dnKGEsYixjLGQseFtpKzVdLDUsLTcwMTU1ODY5MSk7ZD1BTlQudXRpbC5tZDUubWQ1X2dnKGQsYSxiLGMseFtpKzEwXSw5LDM4MDE2MDgzKTtjPUFOVC51dGlsLm1kNS5tZDVfZ2coYyxkLGEsYix4W2krMTVdLDE0LC02NjA0NzgzMzUpO2I9QU5ULnV0aWwubWQ1Lm1kNV9nZyhiLGMsZCxhLHhbaSs0XSwyMCwtNDA1NTM3ODQ4KTthPUFOVC51dGlsLm1kNS5tZDVfZ2coYSxiLGMsZCx4W2krOV0sNSw1Njg0NDY0MzgpO2Q9QU5ULnV0aWwubWQ1Lm1kNV9nZyhkLGEsYixjLHhbaSsxNF0sOSwtMTAxOTgwMzY5MCk7Yz1BTlQudXRpbC5tZDUubWQ1X2dnKGMsZCxhLGIseFtpKzNdLDE0LC0xODczNjM5NjEpO2I9QU5ULnV0aWwubWQ1Lm1kNV9nZyhiLGMsZCxhLHhbaSs4XSwyMCwxMTYzNTMxNTAxKTthPUFOVC51dGlsLm1kNS5tZDVfZ2coYSxiLGMsZCx4W2krMTNdLDUsLTE0NDQ2ODE0NjcpO2Q9QU5ULnV0aWwubWQ1Lm1kNV9nZyhkLGEsYixjLHhbaSsyXSw5LC01MTQwMzc4NCk7Yz1BTlQudXRpbC5tZDUubWQ1X2dnKGMsZCxhLGIseFtpKzddLDE0LDE3MzUzMjg0NzMpO2I9QU5ULnV0aWwubWQ1Lm1kNV9nZyhiLGMsZCxhLHhbaSsxMl0sMjAsLTE5MjY2MDc3MzQpO2E9QU5ULnV0aWwubWQ1Lm1kNV9oaChhLGIsYyxkLHhbaSs1XSw0LC0zNzg1NTgpO2Q9QU5ULnV0aWwubWQ1Lm1kNV9oaChkLGEsYixjLHhbaSs4XSwxMSwtMjAyMjU3NDQ2Myk7Yz1BTlQudXRpbC5tZDUubWQ1X2hoKGMsZCxhLGIseFtpKzExXSwxNiwxODM5MDMwNTYyKTtiPUFOVC51dGlsLm1kNS5tZDVfaGgoYixjLGQsYSx4W2krMTRdLDIzLC0zNTMwOTU1Nik7YT1BTlQudXRpbC5tZDUubWQ1X2hoKGEsYixjLGQseFtpKzFdLDQsLTE1MzA5OTIwNjApO2Q9QU5ULnV0aWwubWQ1Lm1kNV9oaChkLGEsYixjLHhbaSs0XSwxMSwxMjcyODkzMzUzKTtjPUFOVC51dGlsLm1kNS5tZDVfaGgoYyxkLGEsYix4W2krN10sMTYsLTE1NTQ5NzYzMik7Yj1BTlQudXRpbC5tZDUubWQ1X2hoKGIsYyxkLGEseFtpKzEwXSwyMywtMTA5NDczMDY0MCk7YT1BTlQudXRpbC5tZDUubWQ1X2hoKGEsYixjLGQseFtpKzEzXSw0LDY4MTI3OTE3NCk7ZD1BTlQudXRpbC5tZDUubWQ1X2hoKGQsYSxiLGMseFtpKzBdLDExLC0zNTg1MzcyMjIpO2M9QU5ULnV0aWwubWQ1Lm1kNV9oaChjLGQsYSxiLHhbaSszXSwxNiwtNzIyNTIxOTc5KTtiPUFOVC51dGlsLm1kNS5tZDVfaGgoYixjLGQsYSx4W2krNl0sMjMsNzYwMjkxODkpO2E9QU5ULnV0aWwubWQ1Lm1kNV9oaChhLGIsYyxkLHhbaSs5XSw0LC02NDAzNjQ0ODcpO2Q9QU5ULnV0aWwubWQ1Lm1kNV9oaChkLGEsYixjLHhbaSsxMl0sMTEsLTQyMTgxNTgzNSk7Yz1BTlQudXRpbC5tZDUubWQ1X2hoKGMsZCxhLGIseFtpKzE1XSwxNiw1MzA3NDI1MjApO2I9QU5ULnV0aWwubWQ1Lm1kNV9oaChiLGMsZCxhLHhbaSsyXSwyMywtOTk1MzM4NjUxKTthPUFOVC51dGlsLm1kNS5tZDVfaWkoYSxiLGMsZCx4W2krMF0sNiwtMTk4NjMwODQ0KTtkPUFOVC51dGlsLm1kNS5tZDVfaWkoZCxhLGIsYyx4W2krN10sMTAsMTEyNjg5MTQxNSk7Yz1BTlQudXRpbC5tZDUubWQ1X2lpKGMsZCxhLGIseFtpKzE0XSwxNSwtMTQxNjM1NDkwNSk7Yj1BTlQudXRpbC5tZDUubWQ1X2lpKGIsYyxkLGEseFtpKzVdLDIxLC01NzQzNDA1NSk7YT1BTlQudXRpbC5tZDUubWQ1X2lpKGEsYixjLGQseFtpKzEyXSw2LDE3MDA0ODU1NzEpO2Q9QU5ULnV0aWwubWQ1Lm1kNV9paShkLGEsYixjLHhbaSszXSwxMCwtMTg5NDk4NjYwNik7Yz1BTlQudXRpbC5tZDUubWQ1X2lpKGMsZCxhLGIseFtpKzEwXSwxNSwtMTA1MTUyMyk7Yj1BTlQudXRpbC5tZDUubWQ1X2lpKGIsYyxkLGEseFtpKzFdLDIxLC0yMDU0OTIyNzk5KTthPUFOVC51dGlsLm1kNS5tZDVfaWkoYSxiLGMsZCx4W2krOF0sNiwxODczMzEzMzU5KTtkPUFOVC51dGlsLm1kNS5tZDVfaWkoZCxhLGIsYyx4W2krMTVdLDEwLC0zMDYxMTc0NCk7Yz1BTlQudXRpbC5tZDUubWQ1X2lpKGMsZCxhLGIseFtpKzZdLDE1LC0xNTYwMTk4MzgwKTtiPUFOVC51dGlsLm1kNS5tZDVfaWkoYixjLGQsYSx4W2krMTNdLDIxLDEzMDkxNTE2NDkpO2E9QU5ULnV0aWwubWQ1Lm1kNV9paShhLGIsYyxkLHhbaSs0XSw2LC0xNDU1MjMwNzApO2Q9QU5ULnV0aWwubWQ1Lm1kNV9paShkLGEsYixjLHhbaSsxMV0sMTAsLTExMjAyMTAzNzkpO2M9QU5ULnV0aWwubWQ1Lm1kNV9paShjLGQsYSxiLHhbaSsyXSwxNSw3MTg3ODcyNTkpO2I9QU5ULnV0aWwubWQ1Lm1kNV9paShiLGMsZCxhLHhbaSs5XSwyMSwtMzQzNDg1NTUxKTthPUFOVC51dGlsLm1kNS5zYWZlX2FkZChhLG9sZGEpO2I9QU5ULnV0aWwubWQ1LnNhZmVfYWRkKGIsb2xkYik7Yz1BTlQudXRpbC5tZDUuc2FmZV9hZGQoYyxvbGRjKTtkPUFOVC51dGlsLm1kNS5zYWZlX2FkZChkLG9sZGQpO30gcmV0dXJuIEFycmF5KGEsYixjLGQpO30sXG4gICAgICAgICAgICBtZDVfY21uOiBmdW5jdGlvbihxLGEsYix4LHMsdCl7cmV0dXJuIEFOVC51dGlsLm1kNS5zYWZlX2FkZChBTlQudXRpbC5tZDUuYml0X3JvbChBTlQudXRpbC5tZDUuc2FmZV9hZGQoQU5ULnV0aWwubWQ1LnNhZmVfYWRkKGEscSksQU5ULnV0aWwubWQ1LnNhZmVfYWRkKHgsdCkpLHMpLGIpO30sXG4gICAgICAgICAgICBtZDVfZmY6IGZ1bmN0aW9uKGEsYixjLGQseCxzLHQpe3JldHVybiBBTlQudXRpbC5tZDUubWQ1X2NtbigoYiZjKXwoKH5iKSZkKSxhLGIseCxzLHQpO30sXG4gICAgICAgICAgICBtZDVfZ2c6IGZ1bmN0aW9uKGEsYixjLGQseCxzLHQpe3JldHVybiBBTlQudXRpbC5tZDUubWQ1X2NtbigoYiZkKXwoYyYofmQpKSxhLGIseCxzLHQpO30sXG4gICAgICAgICAgICBtZDVfaGg6IGZ1bmN0aW9uKGEsYixjLGQseCxzLHQpe3JldHVybiBBTlQudXRpbC5tZDUubWQ1X2NtbihiXmNeZCxhLGIseCxzLHQpO30sXG4gICAgICAgICAgICBtZDVfaWk6IGZ1bmN0aW9uKGEsYixjLGQseCxzLHQpe3JldHVybiBBTlQudXRpbC5tZDUubWQ1X2NtbihjXihifCh+ZCkpLGEsYix4LHMsdCk7fSxcbiAgICAgICAgICAgIHNhZmVfYWRkOiBmdW5jdGlvbih4LHkpe3ZhciBsc3c9KHgmMHhGRkZGKSsoeSYweEZGRkYpO3ZhciBtc3c9KHg+PjE2KSsoeT4+MTYpKyhsc3c+PjE2KTtyZXR1cm4obXN3PDwxNil8KGxzdyYweEZGRkYpO30sXG4gICAgICAgICAgICBiaXRfcm9sOiBmdW5jdGlvbihudW0sY250KXtyZXR1cm4obnVtPDxjbnQpfChudW0+Pj4oMzItY250KSk7fSxcbiAgICAgICAgICAgIC8vdGhlIGxpbmUgYmVsb3cgaXMgY2FsbGVkIG91dCBieSBqc0xpbnQgYmVjYXVzZSBpdCB1c2VzIEFycmF5KCkgaW5zdGVhZCBvZiBbXS4gIFdlIGNhbiBpZ25vcmUsIG9yIEknbSBzdXJlIHdlIGNvdWxkIGNoYW5nZSBpdCBpZiB3ZSB3YW50ZWQgdG8uXG4gICAgICAgICAgICBzdHIyYmlubDogZnVuY3Rpb24oc3RyKXt2YXIgYmluPUFycmF5KCk7dmFyIG1hc2s9KDE8PEFOVC51dGlsLm1kNS5jaHJzeiktMTtmb3IodmFyIGk9MDtpPHN0ci5sZW5ndGgqQU5ULnV0aWwubWQ1LmNocnN6O2krPUFOVC51dGlsLm1kNS5jaHJzeil7YmluW2k+PjVdfD0oc3RyLmNoYXJDb2RlQXQoaS9BTlQudXRpbC5tZDUuY2hyc3opJm1hc2spPDwoaSUzMik7fXJldHVybiBiaW47fSxcbiAgICAgICAgICAgIGJpbmwyaGV4OiBmdW5jdGlvbihiaW5hcnJheSl7dmFyIGhleF90YWI9QU5ULnV0aWwubWQ1LmhleGNhc2U/XCIwMTIzNDU2Nzg5QUJDREVGXCI6XCIwMTIzNDU2Nzg5YWJjZGVmXCI7dmFyIHN0cj1cIlwiO2Zvcih2YXIgaT0wO2k8YmluYXJyYXkubGVuZ3RoKjQ7aSsrKXtzdHIrPWhleF90YWIuY2hhckF0KChiaW5hcnJheVtpPj4yXT4+KChpJTQpKjgrNCkpJjB4RikraGV4X3RhYi5jaGFyQXQoKGJpbmFycmF5W2k+PjJdPj4oKGklNCkqOCkpJjB4Rik7fSByZXR1cm4gc3RyO31cbiAgICAgICAgfVxuICAgIH1cbn07XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBoZXhfbWQ1OiBBTlQudXRpbC5tZDUuaGV4X21kNVxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcblxuZnVuY3Rpb24gbWFrZU1vdmVhYmxlKCRlbGVtZW50LCAkZHJhZ0hhbmRsZSkge1xuICAgICRkcmFnSGFuZGxlLm9uKCdtb3VzZWRvd24uYW50ZW5uYScsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHZhciBvZmZzZXRYID0gZXZlbnQucGFnZVggLSAkZHJhZ0hhbmRsZS5vZmZzZXQoKS5sZWZ0O1xuICAgICAgICB2YXIgb2Zmc2V0WSA9IGV2ZW50LnBhZ2VZIC0gJGRyYWdIYW5kbGUub2Zmc2V0KCkudG9wO1xuICAgICAgICAkKGRvY3VtZW50KS5vbignbW91c2V1cC5hbnRlbm5hJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgICQoZG9jdW1lbnQpLm9mZignbW91c2Vtb3ZlLmFudGVubmEnKTtcbiAgICAgICAgfSk7XG4gICAgICAgICQoZG9jdW1lbnQpLm9uKCdtb3VzZW1vdmUuYW50ZW5uYScsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICAkZWxlbWVudC5jc3Moe1xuICAgICAgICAgICAgICAgIHRvcDogZXZlbnQucGFnZVkgLSBvZmZzZXRZLFxuICAgICAgICAgICAgICAgIGxlZnQ6IGV2ZW50LnBhZ2VYIC0gb2Zmc2V0WFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBtYWtlTW92ZWFibGU6IG1ha2VNb3ZlYWJsZVxufTsiLCJcbnZhciBvZmZsaW5lO1xuXG5mdW5jdGlvbiBpc09mZmxpbmUoKSB7XG4gICAgaWYgKG9mZmxpbmUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAvLyBUT0RPOiBEbyBzb21ldGhpbmcgY3Jvc3MtYnJvd3NlciBoZXJlLiBUaGlzIHdvbid0IHdvcmsgaW4gSUUuXG4gICAgICAgIC8vIFRPRE86IE1ha2UgdGhpcyBtb3JlIGZsZXhpYmxlIHNvIGl0IHdvcmtzIGluIGV2ZXJ5b25lJ3MgZGV2IGVudmlyb25tZW50XG4gICAgICAgIG9mZmxpbmUgPSBkb2N1bWVudC5jdXJyZW50U2NyaXB0LnNyYyA9PT0gJ2h0dHA6Ly9sb2NhbGhvc3Q6ODA4MS9zdGF0aWMvd2lkZ2V0LW5ldy9kZWJ1Zy9hbnRlbm5hLmpzJztcbiAgICB9XG4gICAgcmV0dXJuIG9mZmxpbmU7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNPZmZsaW5lKCk7IiwidmFyICQ7IHJlcXVpcmUoJy4vanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG5cbi8vIFRPRE8gY29waWVkIGZyb20gZW5nYWdlX2Z1bGwuIFJldmlldy5cbmZ1bmN0aW9uIGNvbXB1dGVQYWdlVXJsKGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgcGFnZV91cmwgPSAkLnRyaW0oIHdpbmRvdy5sb2NhdGlvbi5ocmVmLnNwbGl0KCcjJylbMF0gKS50b0xvd2VyQ2FzZSgpOyAvLyBUT0RPIHNob3VsZCBwYXNzIHRoaXMgaW4gaW5zdGVhZCBvZiByZWNvbXB1dGluZ1xuICAgIHJldHVybiByZW1vdmVTdWJkb21haW5Gcm9tUGFnZVVybChwYWdlX3VybCwgZ3JvdXBTZXR0aW5ncyk7XG59XG5cbi8vIFRPRE8gY29waWVkIGZyb20gZW5nYWdlX2Z1bGwuIFJldmlldy5cbmZ1bmN0aW9uIGNvbXB1dGVUb3BMZXZlbENhbm9uaWNhbFVybChncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIHBhZ2VfdXJsID0gJC50cmltKCB3aW5kb3cubG9jYXRpb24uaHJlZi5zcGxpdCgnIycpWzBdICkudG9Mb3dlckNhc2UoKTsgLy8gVE9ETyBzaG91bGQgcGFzcyB0aGlzIGluIGluc3RlYWQgb2YgcmVjb21wdXRpbmdcbiAgICB2YXIgY2Fub25pY2FsX3VybCA9ICggJCgnbGlua1tyZWw9XCJjYW5vbmljYWxcIl0nKS5sZW5ndGggPiAwICkgP1xuICAgICAgICAgICAgICAgICQoJ2xpbmtbcmVsPVwiY2Fub25pY2FsXCJdJykuYXR0cignaHJlZicpIDogcGFnZV91cmw7XG5cbiAgICAvLyBhbnQ6dXJsIG92ZXJyaWRlc1xuICAgIGlmICggJCgnW3Byb3BlcnR5PVwiYW50ZW5uYTp1cmxcIl0nKS5sZW5ndGggPiAwICkge1xuICAgICAgICBjYW5vbmljYWxfdXJsID0gJCgnW3Byb3BlcnR5PVwiYW50ZW5uYTp1cmxcIl0nKS5hdHRyKCdjb250ZW50Jyk7XG4gICAgfVxuXG4gICAgY2Fub25pY2FsX3VybCA9ICQudHJpbSggY2Fub25pY2FsX3VybC50b0xvd2VyQ2FzZSgpICk7XG5cbiAgICBpZiAoY2Fub25pY2FsX3VybCA9PSBjb21wdXRlUGFnZVVybChncm91cFNldHRpbmdzKSApIHsgLy8gVE9ETyBzaG91bGQgcGFzcyB0aGlzIGluIGluc3RlYWQgb2YgcmVjb21wdXRpbmdcbiAgICAgICAgY2Fub25pY2FsX3VybCA9IFwic2FtZVwiO1xuICAgIH1cblxuICAgIC8vIGZhc3RjbyBmaXggKHNpbmNlIHRoZXkgc29tZXRpbWVzIHJld3JpdGUgdGhlaXIgY2Fub25pY2FsIHRvIHNpbXBseSBiZSB0aGVpciBUTEQuKVxuICAgIC8vIGluIHRoZSBjYXNlIHdoZXJlIGNhbm9uaWNhbCBjbGFpbXMgVExEIGJ1dCB3ZSdyZSBhY3R1YWxseSBvbiBhbiBhcnRpY2xlLi4uIHNldCBjYW5vbmljYWwgdG8gYmUgdGhlIHBhZ2VfdXJsXG4gICAgdmFyIHRsZCA9ICQudHJpbSh3aW5kb3cubG9jYXRpb24ucHJvdG9jb2wrJy8vJyt3aW5kb3cubG9jYXRpb24uaG9zdG5hbWUrJy8nKS50b0xvd2VyQ2FzZSgpO1xuICAgIGlmICggY2Fub25pY2FsX3VybCA9PSB0bGQgKSB7XG4gICAgICAgIGlmIChwYWdlX3VybCAhPSB0bGQpIHtcbiAgICAgICAgICAgIGNhbm9uaWNhbF91cmwgPSBwYWdlX3VybDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiByZW1vdmVTdWJkb21haW5Gcm9tUGFnZVVybCgkLnRyaW0oY2Fub25pY2FsX3VybCksIGdyb3VwU2V0dGluZ3MpO1xufVxuXG5mdW5jdGlvbiBjb21wdXRlUGFnZUVsZW1lbnRDYW5vbmljYWxVcmwoJHBhZ2VFbGVtZW50LCBncm91cFNldHRpbmdzKSB7XG4gICAgLy8gVE9ETyBSZXZpZXcgYWdhaW5zdCBlbmdhZ2VfZnVsbC4gVGhlcmUsIHRoZSBuZXN0ZWQgcGFnZXMgYW5kIHRvcC1sZXZlbCBwYWdlIGhhdmUgYSB0b3RhbGx5IGRpZmZlcmVudCBmbG93LiBEb2VzIHRoaXNcbiAgICAvLyB1bmlmaWNhdGlvbiB3b3JrPyBUaGUgaWRlYSBpcyB0aGF0IHRoZSBuZXN0ZWQgcGFnZXMgd291bGQgaGF2ZSBhbiBocmVmIHNlbGVjdG9yIHRoYXQgc3BlY2lmaWVzIHRoZSBVUkwgdG8gdXNlLCBzbyB3ZVxuICAgIC8vIGp1c3QgdXNlIGl0LiBCdXQgY29tcHV0ZSB0aGUgdXJsIGZvciB0aGUgdG9wLWxldmVsIGNhc2UgZXhwbGljaXRseS5cbiAgICBpZiAoJHBhZ2VFbGVtZW50LmZpbmQoZ3JvdXBTZXR0aW5ncy5wYWdlSHJlZlNlbGVjdG9yKCkpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgcmV0dXJuICdzYW1lJztcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gY29tcHV0ZVRvcExldmVsQ2Fub25pY2FsVXJsKGdyb3VwU2V0dGluZ3MpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gY29tcHV0ZVBhZ2VFbGVtZW50VXJsKCRwYWdlRWxlbWVudCwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciB1cmwgPSAkcGFnZUVsZW1lbnQuZmluZChncm91cFNldHRpbmdzLnBhZ2VIcmVmU2VsZWN0b3IoKSkuYXR0cignaHJlZicpO1xuICAgIGlmICghdXJsKSB7XG4gICAgICAgIHVybCA9ICQudHJpbSggd2luZG93LmxvY2F0aW9uLmhyZWYuc3BsaXQoJyMnKVswXSApLnRvTG93ZXJDYXNlKCk7IC8vIHRvcC1sZXZlbCBwYWdlIHVybFxuICAgIH1cbiAgICByZXR1cm4gcmVtb3ZlU3ViZG9tYWluRnJvbVBhZ2VVcmwodXJsLCBncm91cFNldHRpbmdzKTtcbn1cblxuLy8gVE9ETyBjb3BpZWQgZnJvbSBlbmdhZ2VfZnVsbC4gUmV2aWV3LlxuZnVuY3Rpb24gcmVtb3ZlU3ViZG9tYWluRnJvbVBhZ2VVcmwodXJsLCBncm91cFNldHRpbmdzKSB7XG4gICAgLy8gQU5ULmFjdGlvbnMucmVtb3ZlU3ViZG9tYWluRnJvbVBhZ2VVcmw6XG4gICAgLy8gaWYgXCJpZ25vcmVfc3ViZG9tYWluXCIgaXMgY2hlY2tlZCBpbiBzZXR0aW5ncywgQU5EIHRoZXkgc3VwcGx5IGEgVExELFxuICAgIC8vIHRoZW4gbW9kaWZ5IHRoZSBwYWdlIGFuZCBjYW5vbmljYWwgVVJMcyBoZXJlLlxuICAgIC8vIGhhdmUgdG8gaGF2ZSB0aGVtIHN1cHBseSBvbmUgYmVjYXVzZSB0aGVyZSBhcmUgdG9vIG1hbnkgdmFyaWF0aW9ucyB0byByZWxpYWJseSBzdHJpcCBzdWJkb21haW5zICAoLmNvbSwgLmlzLCAuY29tLmFyLCAuY28udWssIGV0YylcbiAgICBpZiAoZ3JvdXBTZXR0aW5ncy51cmwuaWdub3JlU3ViZG9tYWluKCkgPT0gdHJ1ZSAmJiBncm91cFNldHRpbmdzLnVybC5jYW5vbmljYWxEb21haW4oKSkge1xuICAgICAgICB2YXIgSE9TVERPTUFJTiA9IC9bLVxcd10rXFwuKD86Wy1cXHddK1xcLnhuLS1bLVxcd10rfFstXFx3XXsyLH18Wy1cXHddK1xcLlstXFx3XXsyfSkkL2k7XG4gICAgICAgIHZhciBzcmNBcnJheSA9IHVybC5zcGxpdCgnLycpO1xuXG4gICAgICAgIHZhciBwcm90b2NvbCA9IHNyY0FycmF5WzBdO1xuICAgICAgICBzcmNBcnJheS5zcGxpY2UoMCwzKTtcblxuICAgICAgICB2YXIgcmV0dXJuVXJsID0gcHJvdG9jb2wgKyAnLy8nICsgZ3JvdXBTZXR0aW5ncy51cmwuY2Fub25pY2FsRG9tYWluKCkgKyAnLycgKyBzcmNBcnJheS5qb2luKCcvJyk7XG5cbiAgICAgICAgcmV0dXJuIHJldHVyblVybDtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdXJsO1xuICAgIH1cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNvbXB1dGVQYWdlVXJsOiBjb21wdXRlUGFnZUVsZW1lbnRVcmwsXG4gICAgY29tcHV0ZUNhbm9uaWNhbFVybDogY29tcHV0ZVBhZ2VFbGVtZW50Q2Fub25pY2FsVXJsXG59OyIsInZhciByYW5neTsgcmVxdWlyZSgnLi9yYW5neS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihsb2FkZWRSYW5neSkgeyByYW5neSA9IGxvYWRlZFJhbmd5OyB9KTtcblxudmFyIGhpZ2hsaWdodENsYXNzID0gJ2FudGVubmEtaGlnaGxpZ2h0JztcbnZhciBoaWdobGlnaHRlZFJhbmdlcyA9IFtdO1xuXG52YXIgY2xhc3NBcHBsaWVyO1xuZnVuY3Rpb24gZ2V0Q2xhc3NBcHBsaWVyKCkge1xuICAgIGlmICghY2xhc3NBcHBsaWVyKSB7XG4gICAgICAgIGNsYXNzQXBwbGllciA9IHJhbmd5LmNyZWF0ZUNsYXNzQXBwbGllcihoaWdobGlnaHRDbGFzcyk7XG4gICAgfVxuICAgIHJldHVybiBjbGFzc0FwcGxpZXI7XG59XG5cbi8vIFJldHVybnMgYW4gYWRqdXN0ZWQgZW5kIHBvaW50IGZvciB0aGUgc2VsZWN0aW9uIHdpdGhpbiB0aGUgZ2l2ZW4gbm9kZSwgYXMgdHJpZ2dlcmVkIGJ5IHRoZSBnaXZlbiBtb3VzZSB1cCBldmVudC5cbi8vIFRoZSByZXR1cm5lZCBwb2ludCAoeCwgeSkgdGFrZXMgaW50byBhY2NvdW50IHRoZSBsb2NhdGlvbiBvZiB0aGUgbW91c2UgdXAgZXZlbnQgYXMgd2VsbCBhcyB0aGUgZGlyZWN0aW9uIG9mIHRoZVxuLy8gc2VsZWN0aW9uIChmb3J3YXJkL2JhY2spLlxuZnVuY3Rpb24gZ2V0U2VsZWN0aW9uRW5kUG9pbnQobm9kZSwgZXZlbnQsIGV4Y2x1ZGVOb2RlKSB7XG4gICAgLy8gVE9ETzogQ29uc2lkZXIgdXNpbmcgdGhlIGVsZW1lbnQgY3JlYXRlZCB3aXRoIHRoZSAnY2xhc3NpZmllcicgcmF0aGVyIHRoYW4gdGhlIG1vdXNlIGxvY2F0aW9uXG4gICAgdmFyIHNlbGVjdGlvbiA9IHJhbmd5LmdldFNlbGVjdGlvbigpO1xuICAgIGlmIChpc1ZhbGlkU2VsZWN0aW9uKHNlbGVjdGlvbiwgbm9kZSwgZXhjbHVkZU5vZGUpKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB4OiBldmVudC5wYWdlWCAtICggc2VsZWN0aW9uLmlzQmFja3dhcmRzKCkgPyAtNSA6IDUpLFxuICAgICAgICAgICAgeTogZXZlbnQucGFnZVkgLSA4IC8vIFRPRE86IGV4YWN0IGNvb3Jkc1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xufVxuXG4vLyBBdHRlbXB0cyB0byBnZXQgYSByYW5nZSBmcm9tIHRoZSBjdXJyZW50IHNlbGVjdGlvbi4gVGhpcyBleHBhbmRzIHRoZVxuLy8gc2VsZWN0ZWQgcmVnaW9uIHRvIGluY2x1ZGUgd29yZCBib3VuZGFyaWVzLlxuZnVuY3Rpb24gZ3JhYlNlbGVjdGlvbihub2RlLCBjYWxsYmFjaywgZXhjbHVkZU5vZGUpIHtcbiAgICB2YXIgc2VsZWN0aW9uID0gcmFuZ3kuZ2V0U2VsZWN0aW9uKCk7XG4gICAgaWYgKGlzVmFsaWRTZWxlY3Rpb24oc2VsZWN0aW9uLCBub2RlLCBleGNsdWRlTm9kZSkpIHtcbiAgICAgICAgc2VsZWN0aW9uLmV4cGFuZCgnd29yZCcsIHsgdHJpbTogdHJ1ZSB9KTtcbiAgICAgICAgaWYgKHNlbGVjdGlvbi5jb250YWluc05vZGUoZXhjbHVkZU5vZGUpKSB7XG4gICAgICAgICAgICB2YXIgcmFuZ2UgPSBzZWxlY3Rpb24uZ2V0UmFuZ2VBdCgwKTtcbiAgICAgICAgICAgIHJhbmdlLnNldEVuZEJlZm9yZShleGNsdWRlTm9kZSk7XG4gICAgICAgICAgICBzZWxlY3Rpb24uc2V0U2luZ2xlUmFuZ2UocmFuZ2UpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpc1ZhbGlkU2VsZWN0aW9uKHNlbGVjdGlvbiwgbm9kZSwgZXhjbHVkZU5vZGUpKSB7XG4gICAgICAgICAgICB2YXIgbG9jYXRpb24gPSByYW5neS5zZXJpYWxpemVTZWxlY3Rpb24oc2VsZWN0aW9uLCB0cnVlLCBub2RlKTtcbiAgICAgICAgICAgIHZhciB0ZXh0ID0gc2VsZWN0aW9uLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICBoaWdobGlnaHRTZWxlY3Rpb24oc2VsZWN0aW9uKTsgLy8gSGlnaGxpZ2h0aW5nIGRlc2VsZWN0cyB0aGUgdGV4dCwgc28gZG8gdGhpcyBsYXN0LlxuICAgICAgICAgICAgY2FsbGJhY2sodGV4dCwgbG9jYXRpb24pO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBpc1ZhbGlkU2VsZWN0aW9uKHNlbGVjdGlvbiwgbm9kZSwgZXhjbHVkZU5vZGUpIHtcbiAgICByZXR1cm4gIXNlbGVjdGlvbi5pc0NvbGxhcHNlZCAmJiAgLy8gTm9uLWVtcHR5IHNlbGVjdGlvblxuICAgICAgICBzZWxlY3Rpb24ucmFuZ2VDb3VudCA9PT0gMSAmJiAvLyBTaW5nbGUgc2VsZWN0aW9uXG4gICAgICAgICghZXhjbHVkZU5vZGUgfHwgIXNlbGVjdGlvbi5jb250YWluc05vZGUoZXhjbHVkZU5vZGUsIHRydWUpKSAmJiAvLyBTZWxlY3Rpb24gZG9lc24ndCBjb250YWluIGFueXRoaW5nIHdlJ3ZlIHNhaWQgd2UgZG9uJ3Qgd2FudCAoZS5nLiB0aGUgaW5kaWNhdG9yKVxuICAgICAgICBub2RlLmNvbnRhaW5zKHNlbGVjdGlvbi5nZXRSYW5nZUF0KDApLmNvbW1vbkFuY2VzdG9yQ29udGFpbmVyKTsgLy8gU2VsZWN0aW9uIGlzIGNvbnRhaW5lZCBlbnRpcmVseSB3aXRoaW4gdGhlIG5vZGVcbn1cblxuZnVuY3Rpb24gZ3JhYk5vZGUobm9kZSwgY2FsbGJhY2spIHtcbiAgICB2YXIgcmFuZ2UgPSByYW5neS5jcmVhdGVSYW5nZShkb2N1bWVudCk7XG4gICAgcmFuZ2Uuc2VsZWN0Tm9kZUNvbnRlbnRzKG5vZGUpO1xuICAgIHZhciAkZXhjbHVkZWQgPSAkKG5vZGUpLmZpbmQoJy5hbnRlbm5hLWluZGljYXRvci13aWRnZXQnKTtcbiAgICBpZiAoJGV4Y2x1ZGVkLnNpemUoKSA+IDApIHsgLy8gUmVtb3ZlIHRoZSBpbmRpY2F0b3IgZnJvbSB0aGUgZW5kIG9mIHRoZSBzZWxlY3RlZCByYW5nZS5cbiAgICAgICAgcmFuZ2Uuc2V0RW5kQmVmb3JlKCRleGNsdWRlZC5nZXQoMCkpO1xuICAgIH1cbiAgICB2YXIgc2VsZWN0aW9uID0gcmFuZ3kuZ2V0U2VsZWN0aW9uKCk7XG4gICAgc2VsZWN0aW9uLnNldFNpbmdsZVJhbmdlKHJhbmdlKTtcbiAgICB2YXIgbG9jYXRpb24gPSByYW5neS5zZXJpYWxpemVTZWxlY3Rpb24oc2VsZWN0aW9uLCB0cnVlLCBub2RlKTtcbiAgICB2YXIgdGV4dCA9IHNlbGVjdGlvbi50b1N0cmluZygpO1xuICAgIGlmICh0ZXh0LnRyaW0oKS5sZW5ndGggPiAwKSB7XG4gICAgICAgIGhpZ2hsaWdodFNlbGVjdGlvbihzZWxlY3Rpb24pOyAvLyBIaWdobGlnaHRpbmcgZGVzZWxlY3RzIHRoZSB0ZXh0LCBzbyBkbyB0aGlzIGxhc3QuXG4gICAgICAgIGNhbGxiYWNrKHRleHQsIGxvY2F0aW9uKTtcbiAgICB9XG4gICAgc2VsZWN0aW9uLnJlbW92ZUFsbFJhbmdlcygpOyAvLyBEb24ndCBhY3R1YWxseSBsZWF2ZSB0aGUgZWxlbWVudCBzZWxlY3RlZC5cbiAgICBzZWxlY3Rpb24ucmVmcmVzaCgpO1xufVxuXG4vLyBIaWdobGlnaHRzIHRoZSBnaXZlbiBsb2NhdGlvbiBpbnNpZGUgdGhlIGdpdmVuIG5vZGUuXG5mdW5jdGlvbiBoaWdobGlnaHRMb2NhdGlvbihub2RlLCBsb2NhdGlvbikge1xuICAgIC8vIFRPRE8gZXJyb3IgaGFuZGxpbmcgaW4gY2FzZSB0aGUgcmFuZ2UgaXMgbm90IHZhbGlkP1xuICAgIGlmIChyYW5neS5jYW5EZXNlcmlhbGl6ZVJhbmdlKGxvY2F0aW9uLCBub2RlLCBkb2N1bWVudCkpIHtcbiAgICAgICAgdmFyIHJhbmdlID0gcmFuZ3kuZGVzZXJpYWxpemVSYW5nZShsb2NhdGlvbiwgbm9kZSwgZG9jdW1lbnQpO1xuICAgICAgICBoaWdobGlnaHRSYW5nZShyYW5nZSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBoaWdobGlnaHRTZWxlY3Rpb24oc2VsZWN0aW9uKSB7XG4gICAgaGlnaGxpZ2h0UmFuZ2Uoc2VsZWN0aW9uLmdldFJhbmdlQXQoMCkpO1xufVxuXG5mdW5jdGlvbiBoaWdobGlnaHRSYW5nZShyYW5nZSkge1xuICAgIGdldENsYXNzQXBwbGllcigpLmFwcGx5VG9SYW5nZShyYW5nZSk7XG4gICAgaGlnaGxpZ2h0ZWRSYW5nZXMucHVzaChyYW5nZSk7XG59XG5cbi8vIENsZWFycyBhbGwgaGlnaGxpZ2h0cyB0aGF0IGhhdmUgYmVlbiBjcmVhdGVkIG9uIHRoZSBwYWdlLlxuZnVuY3Rpb24gY2xlYXJIaWdobGlnaHRzKCkge1xuICAgIHZhciBjbGFzc0FwcGxpZXIgPSBnZXRDbGFzc0FwcGxpZXIoKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGhpZ2hsaWdodGVkUmFuZ2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciByYW5nZSA9IGhpZ2hsaWdodGVkUmFuZ2VzW2ldO1xuICAgICAgICBpZiAoY2xhc3NBcHBsaWVyLmlzQXBwbGllZFRvUmFuZ2UocmFuZ2UpKSB7XG4gICAgICAgICAgICBjbGFzc0FwcGxpZXIudW5kb1RvUmFuZ2UocmFuZ2UpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGhpZ2hsaWdodGVkUmFuZ2VzID0gW107XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBnZXRTZWxlY3Rpb25FbmRQb2ludDogZ2V0U2VsZWN0aW9uRW5kUG9pbnQsXG4gICAgZ3JhYlNlbGVjdGlvbjogZ3JhYlNlbGVjdGlvbixcbiAgICBncmFiTm9kZTogZ3JhYk5vZGUsXG4gICAgY2xlYXJIaWdobGlnaHRzOiBjbGVhckhpZ2hsaWdodHMsXG4gICAgaGlnaGxpZ2h0OiBoaWdobGlnaHRMb2NhdGlvblxufTsiLCJcbnZhciBub0NvbmZsaWN0O1xudmFyIGxvYWRlZFJhbmd5O1xudmFyIGNhbGxiYWNrcyA9IFtdO1xuXG4vLyBDYXB0dXJlIGFueSBnbG9iYWwgaW5zdGFuY2Ugb2YgcmFuZ3kgd2hpY2ggYWxyZWFkeSBleGlzdHMgYmVmb3JlIHdlIGxvYWQgb3VyIG93bi5cbmZ1bmN0aW9uIGFib3V0VG9Mb2FkKCkge1xuICAgIG5vQ29uZmxpY3QgPSB3aW5kb3cucmFuZ3k7XG59XG5cbi8vIFJlc3RvcmUgdGhlIGdsb2JhbCBpbnN0YW5jZSBvZiByYW5neSAoaWYgYW55KSBhbmQgcGFzcyBvdXQgb3VyIHZlcnNpb24gdG8gb3VyIGNhbGxiYWNrc1xuZnVuY3Rpb24gbG9hZGVkKCkge1xuICAgIGxvYWRlZFJhbmd5ID0gcmFuZ3k7XG4gICAgbG9hZGVkUmFuZ3kuaW5pdCgpO1xuICAgIHdpbmRvdy5yYW5neSA9IG5vQ29uZmxpY3Q7XG4gICAgbm90aWZ5Q2FsbGJhY2tzKCk7XG59XG5cbmZ1bmN0aW9uIG5vdGlmeUNhbGxiYWNrcygpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNhbGxiYWNrcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjYWxsYmFja3NbaV0obG9hZGVkUmFuZ3kpO1xuICAgIH1cbiAgICBjYWxsYmFja3MgPSBbXTtcbn1cblxuLy8gUmVnaXN0ZXJzIHRoZSBnaXZlbiBjYWxsYmFjayB0byBiZSBub3RpZmllZCB3aGVuIG91ciB2ZXJzaW9uIG9mIFJhbmd5IGlzIGxvYWRlZC5cbmZ1bmN0aW9uIG9uTG9hZChjYWxsYmFjaykge1xuICAgIGlmIChsb2FkZWRSYW5neSkge1xuICAgICAgICBjYWxsYmFjayhsb2FkZWRSYW5neSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgY2FsbGJhY2tzLnB1c2goY2FsbGJhY2spO1xuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgYWJvdXRUb0xvYWQ6IGFib3V0VG9Mb2FkLFxuICAgIGxvYWRlZDogbG9hZGVkLFxuICAgIG9uTG9hZDogb25Mb2FkXG59OyIsInZhciAkOyByZXF1aXJlKCcuL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xuXG5cbmZ1bmN0aW9uIGNvbXB1dGVMYXlvdXREYXRhKHJlYWN0aW9uc0RhdGEsIGNvbG9ycykge1xuICAgIHZhciBudW1SZWFjdGlvbnMgPSByZWFjdGlvbnNEYXRhLmxlbmd0aDtcbiAgICBpZiAobnVtUmVhY3Rpb25zID09IDApIHtcbiAgICAgICAgcmV0dXJuIHt9OyAvLyBUT0RPIGNsZWFuIHRoaXMgdXBcbiAgICB9XG4gICAgLy8gVE9ETzogQ29waWVkIGNvZGUgZnJvbSBlbmdhZ2VfZnVsbC5jcmVhdGVUYWdCdWNrZXRzXG4gICAgdmFyIG1heCA9IHJlYWN0aW9uc0RhdGFbMF0uY291bnQ7XG4gICAgdmFyIG1lZGlhbiA9IHJlYWN0aW9uc0RhdGFbIE1hdGguZmxvb3IocmVhY3Rpb25zRGF0YS5sZW5ndGgvMikgXS5jb3VudDtcbiAgICB2YXIgbWluID0gcmVhY3Rpb25zRGF0YVsgcmVhY3Rpb25zRGF0YS5sZW5ndGgtMSBdLmNvdW50O1xuICAgIHZhciB0b3RhbCA9IDA7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBudW1SZWFjdGlvbnM7IGkrKykge1xuICAgICAgICB0b3RhbCArPSByZWFjdGlvbnNEYXRhW2ldLmNvdW50O1xuICAgIH1cbiAgICB2YXIgYXZlcmFnZSA9IE1hdGguZmxvb3IodG90YWwgLyBudW1SZWFjdGlvbnMpO1xuICAgIHZhciBtaWRWYWx1ZSA9ICggbWVkaWFuID4gYXZlcmFnZSApID8gbWVkaWFuIDogYXZlcmFnZTtcblxuICAgIHZhciBsYXlvdXRDbGFzc2VzID0gW107XG4gICAgdmFyIG51bUhhbGZzaWVzID0gMDtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG51bVJlYWN0aW9uczsgaSsrKSB7XG4gICAgICAgIGlmIChyZWFjdGlvbnNEYXRhW2ldLmNvdW50ID4gbWlkVmFsdWUpIHtcbiAgICAgICAgICAgIGxheW91dENsYXNzZXNbaV0gPSAnZnVsbCc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsYXlvdXRDbGFzc2VzW2ldID0gJ2hhbGYnO1xuICAgICAgICAgICAgbnVtSGFsZnNpZXMrKztcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAobnVtSGFsZnNpZXMgJSAyICE9PTApIHtcbiAgICAgICAgbGF5b3V0Q2xhc3Nlc1tudW1SZWFjdGlvbnMgLSAxXSA9ICdmdWxsJzsgLy8gSWYgdGhlcmUgYXJlIGFuIG9kZCBudW1iZXIsIHRoZSBsYXN0IG9uZSBnb2VzIGZ1bGwuXG4gICAgfVxuXG4gICAgdmFyIGJhY2tncm91bmRDb2xvcnMgPSBbXTtcbiAgICB2YXIgY29sb3JJbmRleCA9IDA7XG4gICAgdmFyIHBhaXJXaXRoTmV4dCA9IDA7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBudW1SZWFjdGlvbnM7IGkrKykge1xuICAgICAgICBiYWNrZ3JvdW5kQ29sb3JzW2ldID0gY29sb3JzW2NvbG9ySW5kZXggJSBjb2xvcnMubGVuZ3RoXTtcbiAgICAgICAgaWYgKGxheW91dENsYXNzZXNbaV0gPT09ICdmdWxsJykge1xuICAgICAgICAgICAgY29sb3JJbmRleCsrO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gVE9ETyBnb3R0YSBiZSBhYmxlIHRvIG1ha2UgdGhpcyBzaW1wbGVyXG4gICAgICAgICAgICBpZiAocGFpcldpdGhOZXh0ID4gMCkge1xuICAgICAgICAgICAgICAgIHBhaXJXaXRoTmV4dC0tO1xuICAgICAgICAgICAgICAgIGlmIChwYWlyV2l0aE5leHQgPT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBjb2xvckluZGV4Kys7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBwYWlyV2l0aE5leHQgPSAxOyAvLyBJZiB3ZSB3YW50IHRvIGFsbG93IE4gYm94ZXMgcGVyIHJvdywgdGhpcyBudW1iZXIgd291bGQgYmVjb21lIGNvbmRpdGlvbmFsLlxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgbGF5b3V0Q2xhc3NlczogbGF5b3V0Q2xhc3NlcyxcbiAgICAgICAgYmFja2dyb3VuZENvbG9yczogYmFja2dyb3VuZENvbG9yc1xuICAgIH07XG59XG5cbmZ1bmN0aW9uIHNpemVSZWFjdGlvblRleHRUb0ZpdChub2RlKSB7XG4gICAgdmFyICRlbGVtZW50ID0gJChub2RlKTtcbiAgICB2YXIgJHJlYWN0aW9uc1dpbmRvdyA9ICRlbGVtZW50LmNsb3Nlc3QoJy5hbnRlbm5hLXJlYWN0aW9ucy13aWRnZXQnKTtcbiAgICB2YXIgb3JpZ2luYWxEaXNwbGF5ID0gJHJlYWN0aW9uc1dpbmRvdy5jc3MoJ2Rpc3BsYXknKTtcbiAgICBpZiAob3JpZ2luYWxEaXNwbGF5ID09PSAnbm9uZScpIHsgLy8gSWYgd2UncmUgc2l6aW5nIHRoZSBib3hlcyBiZWZvcmUgdGhlIHdpZGdldCBpcyBkaXNwbGF5ZWQsIHRlbXBvcmFyaWx5IGRpc3BsYXkgaXQgb2Zmc2NyZWVuLlxuICAgICAgICAkcmVhY3Rpb25zV2luZG93LmNzcyh7ZGlzcGxheTogJ2Jsb2NrJywgbGVmdDogJzEwMCUnfSk7XG4gICAgfVxuICAgIHZhciByYXRpbyA9IG5vZGUuY2xpZW50V2lkdGggLyBub2RlLnNjcm9sbFdpZHRoO1xuICAgIGlmIChyYXRpbyA8IDEuMCkgeyAvLyBJZiB0aGUgdGV4dCBkb2Vzbid0IGZpdCwgZmlyc3QgdHJ5IHRvIHdyYXAgaXQgdG8gdHdvIGxpbmVzLiBUaGVuIHNjYWxlIGl0IGRvd24gaWYgc3RpbGwgbmVjZXNzYXJ5LlxuICAgICAgICB2YXIgdGV4dCA9IG5vZGUuaW5uZXJIVE1MO1xuICAgICAgICB2YXIgbWlkID0gTWF0aC5jZWlsKHRleHQubGVuZ3RoIC8gMik7IC8vIExvb2sgZm9yIHRoZSBjbG9zZXN0IHNwYWNlIHRvIHRoZSBtaWRkbGUsIHdlaWdodGVkIHNsaWdodGx5IChNYXRoLmNlaWwpIHRvd2FyZCBhIHNwYWNlIGluIHRoZSBzZWNvbmQgaGFsZi5cbiAgICAgICAgdmFyIHNlY29uZEhhbGZJbmRleCA9IHRleHQuaW5kZXhPZignICcsIG1pZCk7XG4gICAgICAgIHZhciBmaXJzdEhhbGZJbmRleCA9IHRleHQubGFzdEluZGV4T2YoJyAnLCBtaWQpO1xuICAgICAgICB2YXIgc3BsaXRJbmRleCA9IE1hdGguYWJzKHNlY29uZEhhbGZJbmRleCAtIG1pZCkgPCBNYXRoLmFicyhtaWQgLSBmaXJzdEhhbGZJbmRleCkgPyBzZWNvbmRIYWxmSW5kZXggOiBmaXJzdEhhbGZJbmRleDtcbiAgICAgICAgaWYgKHNwbGl0SW5kZXggPiAxKSB7XG4gICAgICAgICAgICBub2RlLmlubmVySFRNTCA9IHRleHQuc2xpY2UoMCwgc3BsaXRJbmRleCkgKyAnPGJyPicgKyB0ZXh0LnNsaWNlKHNwbGl0SW5kZXgpO1xuICAgICAgICAgICAgcmF0aW8gPSBub2RlLmNsaWVudFdpZHRoIC8gbm9kZS5zY3JvbGxXaWR0aDtcbiAgICAgICAgfVxuICAgICAgICBpZiAocmF0aW8gPCAxLjApIHtcbiAgICAgICAgICAgICRlbGVtZW50LmNzcygnZm9udC1zaXplJywgTWF0aC5tYXgoMTAsIE1hdGguZmxvb3IocGFyc2VJbnQoJGVsZW1lbnQuY3NzKCdmb250LXNpemUnKSkgKiByYXRpbykgLSAxKSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKG9yaWdpbmFsRGlzcGxheSA9PT0gJ25vbmUnKSB7XG4gICAgICAgICRyZWFjdGlvbnNXaW5kb3cuY3NzKHtkaXNwbGF5OiAnJywgbGVmdDogJyd9KTtcbiAgICB9XG4gICAgcmV0dXJuIHsgdGVhcmRvd246IGZ1bmN0aW9uKCkge30gfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgc2l6ZVRvRml0OiBzaXplUmVhY3Rpb25UZXh0VG9GaXQsXG4gICAgY29tcHV0ZUxheW91dERhdGE6IGNvbXB1dGVMYXlvdXREYXRhXG59OyIsIlxuXG5mdW5jdGlvbiB0b2dnbGVUcmFuc2l0aW9uQ2xhc3MoJGVsZW1lbnQsIGNsYXNzTmFtZSwgc3RhdGUsIG5leHRTdGVwKSB7XG4gICAgJGVsZW1lbnQub24oXCJ0cmFuc2l0aW9uZW5kIHdlYmtpdFRyYW5zaXRpb25FbmQgb1RyYW5zaXRpb25FbmQgTVNUcmFuc2l0aW9uRW5kXCIsXG4gICAgICAgIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICAvLyBvbmNlIHRoZSBDU1MgdHJhbnNpdGlvbiBpcyBjb21wbGV0ZSwgY2FsbCBvdXIgbmV4dCBzdGVwXG4gICAgICAgICAgICAvLyBTZWU6IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvOTI1NTI3OS9jYWxsYmFjay13aGVuLWNzczMtdHJhbnNpdGlvbi1maW5pc2hlc1xuICAgICAgICAgICAgaWYgKGV2ZW50LnRhcmdldCA9PSBldmVudC5jdXJyZW50VGFyZ2V0KSB7XG4gICAgICAgICAgICAgICAgJGVsZW1lbnQub2ZmKFwidHJhbnNpdGlvbmVuZCB3ZWJraXRUcmFuc2l0aW9uRW5kIG9UcmFuc2l0aW9uRW5kIE1TVHJhbnNpdGlvbkVuZFwiKTtcbiAgICAgICAgICAgICAgICBpZiAobmV4dFN0ZXApIHtcbiAgICAgICAgICAgICAgICAgICAgbmV4dFN0ZXAoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICApO1xuICAgICRlbGVtZW50LnRvZ2dsZUNsYXNzKGNsYXNzTmFtZSwgc3RhdGUpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICB0b2dnbGVDbGFzczogdG9nZ2xlVHJhbnNpdGlvbkNsYXNzXG59OyIsInZhciBvZmZsaW5lID0gcmVxdWlyZSgnLi9vZmZsaW5lLmpzJyk7XG5cbmZ1bmN0aW9uIGFudGVubmFIb21lKCkge1xuICAgIGlmIChvZmZsaW5lKSB7XG4gICAgICAgIHJldHVybiB3aW5kb3cubG9jYXRpb24ucHJvdG9jb2wgKyBcIi8vbG9jYWwuYW50ZW5uYS5pczo4MDgxXCI7XG4gICAgfVxuICAgIHJldHVybiBcImh0dHBzOi8vd3d3LmFudGVubmEuaXNcIjsgLy8gVE9ETzogd3d3PyBob3cgYWJvdXQgYW50ZW5uYS5pcyBvciBhcGkuYW50ZW5uYS5pcz9cbn1cblxuZnVuY3Rpb24gZ2V0Q3JlYXRlUmVhY3Rpb25VcmwoKSB7XG4gICAgcmV0dXJuICcvYXBpL3RhZy9jcmVhdGUnO1xufVxuXG5mdW5jdGlvbiBnZXRDcmVhdGVDb21tZW50VXJsKCkge1xuICAgIHJldHVybiAnL2FwaS9jb21tZW50L2NyZWF0ZSc7XG59XG5cbmZ1bmN0aW9uIGdldEZldGNoQ29tbWVudFVybCgpIHtcbiAgICByZXR1cm4gJy9hcGkvY29tbWVudC9yZXBsaWVzJztcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGFudGVubmFIb21lOiBhbnRlbm5hSG9tZSxcbiAgICBjcmVhdGVSZWFjdGlvblVybDogZ2V0Q3JlYXRlUmVhY3Rpb25VcmwsXG4gICAgY3JlYXRlQ29tbWVudFVybDogZ2V0Q3JlYXRlQ29tbWVudFVybCxcbiAgICBmZXRjaENvbW1lbnRVcmw6IGdldEZldGNoQ29tbWVudFVybFxufTsiLCJcbmZ1bmN0aW9uIGdldFdpZGdldEJ1Y2tldCgpIHtcbiAgICB2YXIgYnVja2V0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2FudGVubmEtd2lkZ2V0LWJ1Y2tldCcpO1xuICAgIGlmICghYnVja2V0KSB7XG4gICAgICAgIGJ1Y2tldCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBidWNrZXQuc2V0QXR0cmlidXRlKCdpZCcsICdhbnRlbm5hLXdpZGdldC1idWNrZXQnKTtcbiAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChidWNrZXQpO1xuICAgIH1cbiAgICByZXR1cm4gYnVja2V0O1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSBnZXRXaWRnZXRCdWNrZXQ7IiwiXG52YXIgVVJMcyA9IHJlcXVpcmUoJy4vdXJscycpO1xuXG4vLyBSZWdpc3RlciBvdXJzZWx2ZXMgdG8gaGVhciBtZXNzYWdlc1xud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIHJlY2VpdmVNZXNzYWdlLCBmYWxzZSk7XG5cbnZhciBjYWxsYmFja3MgPSB7ICd4ZG0gbG9hZGVkJzogeGRtTG9hZGVkIH07XG52YXIgY2FjaGUgPSB7fTtcblxudmFyIGlzWERNTG9hZGVkID0gZmFsc2U7XG4vLyBUaGUgaW5pdGlhbCBtZXNzYWdlIHRoYXQgWERNIHNlbmRzIG91dCB3aGVuIGl0IGxvYWRzXG5mdW5jdGlvbiB4ZG1Mb2FkZWQoZGF0YSkge1xuICAgIGlzWERNTG9hZGVkID0gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gZ2V0VXNlcihjYWxsYmFjaykge1xuICAgIHZhciBtZXNzYWdlID0gJ2dldFVzZXInO1xuICAgIHBvc3RNZXNzYWdlKG1lc3NhZ2UsICdyZXR1cm5pbmdfdXNlcicsIGNhbGxiYWNrLCB2YWxpZENhY2hlRW50cnkpO1xuXG4gICAgZnVuY3Rpb24gdmFsaWRDYWNoZUVudHJ5KHJlc3BvbnNlKSB7XG4gICAgICAgIHZhciB1c2VySW5mbyA9IHJlc3BvbnNlLmRhdGE7XG4gICAgICAgIHJldHVybiB1c2VySW5mbyAmJiB1c2VySW5mby5hbnRfdG9rZW4gJiYgdXNlckluZm8udXNlcl9pZDsgLy8gVE9ETyAmJiB1c2VySW5mby51c2VyX3R5cGU/XG4gICAgfVxufVxuXG5mdW5jdGlvbiByZWNlaXZlTWVzc2FnZShldmVudCkge1xuICAgIHZhciBldmVudE9yaWdpbiA9IGV2ZW50Lm9yaWdpbjtcbiAgICBpZiAoZXZlbnRPcmlnaW4gPT09IFVSTHMuYW50ZW5uYUhvbWUoKSkge1xuICAgICAgICB2YXIgcmVzcG9uc2UgPSBKU09OLnBhcnNlKGV2ZW50LmRhdGEpO1xuICAgICAgICAvLyBUT0RPOiBUaGUgZXZlbnQuc291cmNlIHByb3BlcnR5IGdpdmVzIHVzIHRoZSBzb3VyY2Ugd2luZG93IG9mIHRoZSBtZXNzYWdlIGFuZCBjdXJyZW50bHkgdGhlIFhETSBmcmFtZSBmaXJlcyBvdXRcbiAgICAgICAgLy8gZXZlbnRzIHRoYXQgd2UgcmVjZWl2ZSBiZWZvcmUgd2UgZXZlciB0cnkgdG8gcG9zdCBhbnl0aGluZy4gU28gd2UgKmNvdWxkKiBob2xkIG9udG8gdGhlIHdpbmRvdyBoZXJlIGFuZCB1c2UgaXRcbiAgICAgICAgLy8gZm9yIHBvc3RpbmcgbWVzc2FnZXMgcmF0aGVyIHRoYW4gbG9va2luZyBmb3IgdGhlIFhETSBmcmFtZSBvdXJzZWx2ZXMuIE5lZWQgdG8gbG9vayBhdCB3aGljaCBldmVudHMgdGhlIFhETSBmcmFtZVxuICAgICAgICAvLyBmaXJlcyBvdXQgdG8gYWxsIHdpbmRvd3MgYmVmb3JlIGJlaW5nIGFza2VkLiBDdXJyZW50bHksIGl0J3MgbW9yZSB0aGFuIFwieGRtIGxvYWRlZFwiLiBXaHk/XG4gICAgICAgIC8vdmFyIHNvdXJjZVdpbmRvdyA9IGV2ZW50LnNvdXJjZTtcblxuICAgICAgICB2YXIgY2FsbGJhY2tLZXkgPSByZXNwb25zZS5zdGF0dXM7IC8vIFRPRE86IGNoYW5nZSB0aGUgbmFtZSBvZiB0aGlzIHByb3BlcnR5IGluIHhkbS5odG1sXG4gICAgICAgIGNhY2hlW2NhbGxiYWNrS2V5XSA9IHJlc3BvbnNlO1xuICAgICAgICB2YXIgY2FsbGJhY2sgPSBjYWxsYmFja3NbY2FsbGJhY2tLZXldO1xuICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKHJlc3BvbnNlKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gcG9zdE1lc3NhZ2UobWVzc2FnZSwgY2FsbGJhY2tLZXksIGNhbGxiYWNrLCB2YWxpZENhY2hlRW50cnkpIHtcblxuICAgIHZhciB0YXJnZXRPcmlnaW4gPSBVUkxzLmFudGVubmFIb21lKCk7XG4gICAgY2FsbGJhY2tzW2NhbGxiYWNrS2V5XSA9IGNhbGxiYWNrO1xuXG4gICAgaWYgKGlzWERNTG9hZGVkKSB7XG4gICAgICAgIHZhciBjYWNoZWRSZXNwb25zZSA9IGNhY2hlW2NhbGxiYWNrS2V5XTtcbiAgICAgICAgaWYgKGNhY2hlZFJlc3BvbnNlICE9PSB1bmRlZmluZWQgJiYgdmFsaWRDYWNoZUVudHJ5ICYmIHZhbGlkQ2FjaGVFbnRyeShjYWNoZVtjYWxsYmFja0tleV0pKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhjYWNoZVtjYWxsYmFja0tleV0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyIHhkbUZyYW1lID0gZ2V0WERNRnJhbWUoKTtcbiAgICAgICAgICAgIGlmICh4ZG1GcmFtZSkge1xuICAgICAgICAgICAgICAgIHhkbUZyYW1lLnBvc3RNZXNzYWdlKG1lc3NhZ2UsIHRhcmdldE9yaWdpbik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGdldFhETUZyYW1lKCkge1xuICAgIC8vIFRPRE86IElzIHRoaXMgYSBzZWN1cml0eSBwcm9ibGVtPyBXaGF0IHByZXZlbnRzIHNvbWVvbmUgZnJvbSB1c2luZyB0aGlzIHNhbWUgbmFtZSBhbmQgaW50ZXJjZXB0aW5nIG91ciBtZXNzYWdlcz9cbiAgICByZXR1cm4gd2luZG93LmZyYW1lc1snYW50LXhkbS1oaWRkZW4nXTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgZ2V0VXNlcjogZ2V0VXNlclxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciBVUkxzID0gcmVxdWlyZSgnLi91cmxzJyk7XG52YXIgV2lkZ2V0QnVja2V0ID0gcmVxdWlyZSgnLi93aWRnZXQtYnVja2V0Jyk7XG5cbmZ1bmN0aW9uIGNyZWF0ZVhETWZyYW1lKGdyb3VwSWQpIHtcbiAgICAvL0FOVC5zZXNzaW9uLnJlY2VpdmVNZXNzYWdlKHt9LCBmdW5jdGlvbigpIHtcbiAgICAvLyAgICBBTlQudXRpbC51c2VyTG9naW5TdGF0ZSgpO1xuICAgIC8vfSk7XG5cblxuICAgIHZhciBpZnJhbWVVcmwgPSBVUkxzLmFudGVubmFIb21lKCkgKyBcIi9zdGF0aWMvd2lkZ2V0LW5ldy94ZG0veGRtLmh0bWxcIixcbiAgICBwYXJlbnRVcmwgPSB3aW5kb3cubG9jYXRpb24uaHJlZixcbiAgICBwYXJlbnRIb3N0ID0gd2luZG93LmxvY2F0aW9uLnByb3RvY29sICsgXCIvL1wiICsgd2luZG93LmxvY2F0aW9uLmhvc3QsXG4gICAgLy8gVE9ETzogUmVzdG9yZSB0aGUgYm9va21hcmtsZXQgYXR0cmlidXRlIG9uIHRoZSBpRnJhbWU/XG4gICAgLy9ib29rbWFya2xldCA9ICggQU5ULmVuZ2FnZVNjcmlwdFBhcmFtcy5ib29rbWFya2xldCApID8gXCJib29rbWFya2xldD10cnVlXCI6XCJcIixcbiAgICBib29rbWFya2xldCA9IFwiXCIsXG4gICAgLy8gVE9ETzogUmVzdG9yZSB0aGUgZ3JvdXBOYW1lIGF0dHJpYnV0ZS4gKFdoYXQgaXMgaXQgZm9yPylcbiAgICAkeGRtSWZyYW1lID0gJCgnPGlmcmFtZSBpZD1cImFudC14ZG0taGlkZGVuXCIgbmFtZT1cImFudC14ZG0taGlkZGVuXCIgc3JjPVwiJyArIGlmcmFtZVVybCArICc/cGFyZW50VXJsPScgKyBwYXJlbnRVcmwgKyAnJnBhcmVudEhvc3Q9JyArIHBhcmVudEhvc3QgKyAnJmdyb3VwX2lkPScrZ3JvdXBJZCsnXCIgd2lkdGg9XCIxXCIgaGVpZ2h0PVwiMVwiIHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGU7dG9wOi0xMDAwcHg7bGVmdDotMTAwMHB4O1wiIC8+Jyk7XG4gICAgLy8keGRtSWZyYW1lID0gJCgnPGlmcmFtZSBpZD1cImFudC14ZG0taGlkZGVuXCIgbmFtZT1cImFudC14ZG0taGlkZGVuXCIgc3JjPVwiJyArIGlmcmFtZVVybCArICc/cGFyZW50VXJsPScgKyBwYXJlbnRVcmwgKyAnJnBhcmVudEhvc3Q9JyArIHBhcmVudEhvc3QgKyAnJmdyb3VwX2lkPScrZ3JvdXBJZCsnJmdyb3VwX25hbWU9JytlbmNvZGVVUklDb21wb25lbnQoZ3JvdXBOYW1lKSsnJicrYm9va21hcmtsZXQrJ1wiIHdpZHRoPVwiMVwiIGhlaWdodD1cIjFcIiBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlO3RvcDotMTAwMHB4O2xlZnQ6LTEwMDBweDtcIiAvPicpO1xuICAgICQoV2lkZ2V0QnVja2V0KCkpLmFwcGVuZCggJHhkbUlmcmFtZSApO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGVYRE1mcmFtZTogY3JlYXRlWERNZnJhbWVcbn07IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcGFnZSBhbnRlbm5hLWNvbW1lbnRzLXBhZ2VcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtYm9keVwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcInZcIjp7XCJjbGlja1wiOlwiY2xvc2V3aW5kb3dcIn0sXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY29tbWVudHMtY2xvc2VcIn0sXCJmXCI6W1wiQ2xvc2UgWFwiXX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb21tZW50cy1oZWFkZXJcIn0sXCJmXCI6W1wiKFwiLHtcInRcIjoyLFwiclwiOlwiY29tbWVudHMubGVuZ3RoXCJ9LFwiKSBDb21tZW50czpcIl19LFwiIFwiLHtcInRcIjo0LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWNvbW1lbnQtZW50cnlcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwidGFibGVcIixcImZcIjpbe1widFwiOjcsXCJlXCI6XCJ0clwiLFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInRkXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY29tbWVudC1jZWxsXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImltZ1wiLFwiYVwiOntcInNyY1wiOlt7XCJ0XCI6MixcInJcIjpcIi4vdXNlci5pbWFnZVVSTFwifV19fV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwidGRcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb21tZW50LWF1dGhvclwifSxcImZcIjpbe1widFwiOjIsXCJyXCI6XCIuL3VzZXIubmFtZVwifV19XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJ0clwiLFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInRkXCIsXCJmXCI6W119LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwidGRcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb21tZW50LXRleHRcIn0sXCJmXCI6W3tcInRcIjoyLFwiclwiOlwiLi90ZXh0XCJ9XX1dfV19XX1dLFwiaVwiOlwiaW5kZXhcIixcInJcIjpcImNvbW1lbnRzXCJ9XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcGFnZSBhbnRlbm5hLWNvbmZpcm1hdGlvbi1wYWdlXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWJvZHlcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY29tbWVudC1yZWFjdGlvblwifSxcImZcIjpbe1widFwiOjIsXCJyXCI6XCJ0ZXh0XCJ9XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb21tZW50LWFyZWFcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwidGV4dGFyZWFcIixcImFcIjp7XCJwbGFjZWhvbGRlclwiOlwiQWRkIGNvbW1lbnRzIG9yICNoYXNodGFnc1wiLFwibWF4bGVuZ3RoXCI6XCI1MDBcIn19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY29tbWVudC1mb290ZXJcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWNvbW1lbnQtbGltaXRcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWNvbW1lbnQtY291bnRcIn0sXCJmXCI6W1wiNTAwXCJdfSxcIiBjaGFyYWN0ZXJzIGxlZnRcIl19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiYnV0dG9uXCIsXCJ2XCI6e1wiY2xpY2tcIjpcImFkZGNvbW1lbnRcIn0sXCJmXCI6W1wiQ29tbWVudFwiXX1dfV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY29tbWVudC1yZWNlaXZlZFwifSxcImZcIjpbXCJUaGFua3MgZm9yIHlvdXIgY29tbWVudC5cIl19XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1mb290ZXIgYW50ZW5uYS1jb25maXJtLWZvb3RlclwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJ2XCI6e1wiY2xpY2tcIjpcInNoYXJlXCJ9LFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXNoYXJlXCJ9LFwiZlwiOltcIlNoYXJlIHlvdXIgcmVhY3Rpb246IFwiLHtcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnQtc29jaWFsLWZhY2Vib29rXCJ9fSx7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50LXNvY2lhbC10d2l0dGVyXCJ9fV19XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJ2XCI6e1wia2V5ZG93blwiOlwicGFnZWtleWRvd25cIn0sXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcGFnZSBhbnRlbm5hLWRlZmF1bHRzLXBhZ2VcIixcInRhYmluZGV4XCI6XCIwXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWJvZHlcIn0sXCJmXCI6W3tcInRcIjo0LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwidlwiOntcImNsaWNrXCI6XCJuZXdyZWFjdGlvblwifSxcImFcIjp7XCJjbGFzc1wiOltcImFudGVubmEtcmVhY3Rpb24gXCIse1widFwiOjIsXCJ4XCI6e1wiclwiOltcImRlZmF1bHRMYXlvdXRDbGFzc1wiLFwiaW5kZXhcIl0sXCJzXCI6XCJfMChfMSlcIn19XSxcInN0eWxlXCI6W1wiYmFja2dyb3VuZC1jb2xvcjpcIix7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZGVmYXVsdEJhY2tncm91bmRDb2xvclwiLFwiaW5kZXhcIl0sXCJzXCI6XCJfMChfMSlcIn19XX0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcmVhY3Rpb24tYm94XCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXJlYWN0aW9uLXRleHRcIn0sXCJvXCI6XCJzaXpldG9maXRcIixcImZcIjpbe1widFwiOjIsXCJyXCI6XCIuL3RleHRcIn1dfV19XX1dLFwiaVwiOlwiaW5kZXhcIixcInJcIjpcImRlZmF1bHRSZWFjdGlvbnNcIn1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWZvb3RlciBhbnRlbm5hLWRlZmF1bHRzLWZvb3RlclwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJpbnB1dFwiLFwidlwiOntcImZvY3VzXCI6XCJjdXN0b21mb2N1c1wiLFwia2V5ZG93blwiOlwiaW5wdXRrZXlkb3duXCIsXCJibHVyXCI6XCJjdXN0b21ibHVyXCJ9LFwiYVwiOntcInZhbHVlXCI6XCIrIEFkZCBZb3VyIE93blwiLFwibWF4bGVuZ3RoXCI6XCIyNVwifX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJidXR0b25cIixcInZcIjp7XCJjbGlja1wiOlwiYWRkY3VzdG9tXCJ9LFwiZlwiOltcIm9rXCJdfV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOltcImFudGVubmEgYW50ZW5uYS1pbWFnZS1pbmRpY2F0b3Itd2lkZ2V0IFwiLHtcInRcIjo0LFwiZlwiOltcInJlYWN0aW9uc1wiXSxcInJcIjpcImNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbFwifV19LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50LWFudGVubmEtbG9nb1wifX0sXCIgXCIse1widFwiOjQsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXJlYWN0aW9uLXRvdGFsXCJ9LFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcImNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbFwifV19XSxcIm5cIjo1MCxcInJcIjpcImNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbFwifSx7XCJ0XCI6NCxcIm5cIjo1MSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcmVhY3Rpb24tcHJvbXB0XCJ9LFwiZlwiOltcIldoYXQgZG8geW91IHRoaW5rP1wiXX1dLFwiclwiOlwiY29udGFpbmVyRGF0YS5yZWFjdGlvblRvdGFsXCJ9XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOltcImFudGVubmEgYW50ZW5uYS1pbmRpY2F0b3Itd2lkZ2V0IFwiLHtcInRcIjo0LFwiZlwiOltcInJlYWN0aW9uc1wiXSxcInJcIjpcImNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbFwifV19LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50LWFudGVubmEtbG9nb1wifX0sXCIgXCIse1widFwiOjQsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXJlYWN0aW9uLXRvdGFsXCJ9LFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcImNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbFwifV19XSxcIm5cIjo1MCxcInJcIjpcImNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbFwifV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1wb3B1cFwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1wb3B1cC1ib2R5XCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50LWFudGVubmEtbG9nb1wifX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcG9wdXAtdGV4dFwifSxcImZcIjpbXCJXaGF0IGRvIHlvdSB0aGluaz9cIl19XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcGFnZSBhbnRlbm5hLXJlYWN0aW9ucy1wYWdlXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWJvZHlcIn0sXCJmXCI6W3tcInRcIjo0LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwidlwiOntcImNsaWNrXCI6XCJwbHVzb25lXCIsXCJtb3VzZWVudGVyXCI6XCJoaWdobGlnaHRcIixcIm1vdXNlbGVhdmVcIjpcImNsZWFyaGlnaGxpZ2h0c1wifSxcImFcIjp7XCJjbGFzc1wiOltcImFudGVubmEtcmVhY3Rpb24gXCIse1widFwiOjIsXCJ4XCI6e1wiclwiOltcInJlYWN0aW9uc0xheW91dENsYXNzXCIsXCJpbmRleFwiLFwiLi9jb3VudFwiXSxcInNcIjpcIl8wKF8xLF8yKVwifX1dLFwic3R5bGVcIjpbXCJiYWNrZ3JvdW5kLWNvbG9yOlwiLHtcInRcIjoyLFwieFwiOntcInJcIjpbXCJyZWFjdGlvbnNCYWNrZ3JvdW5kQ29sb3JcIixcImluZGV4XCJdLFwic1wiOlwiXzAoXzEpXCJ9fV19LFwiZlwiOltcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXJlYWN0aW9uLWJveFwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1yZWFjdGlvbi10ZXh0XCJ9LFwib1wiOlwic2l6ZXRvZml0XCIsXCJmXCI6W3tcInRcIjoyLFwiclwiOlwiLi90ZXh0XCJ9XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1yZWFjdGlvbi1jb3VudFwifSxcImZcIjpbe1widFwiOjIsXCJyXCI6XCIuL2NvdW50XCJ9XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1wbHVzb25lXCJ9LFwiZlwiOltcIisxXCJdfSxcIiBcIix7XCJ0XCI6NCxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcInZcIjp7XCJjbGlja1wiOlwic2hvd2NvbW1lbnRzXCJ9LFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXJlYWN0aW9uLWNvbW1lbnRzIGhhc2NvbW1lbnRzXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50LWNvbW1lbnRcIn19LFwiIFwiLHtcInRcIjoyLFwiclwiOlwiLi9jb21tZW50cy5jb3VudFwifV19XSxcIm5cIjo1MCxcInhcIjp7XCJyXCI6W1wiLi9jb21tZW50cy5jb3VudFwiXSxcInNcIjpcIl8wPjFcIn19LHtcInRcIjo0LFwiblwiOjUxLFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXJlYWN0aW9uLWNvbW1lbnRzXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50LWNvbW1lbnRcIn19XX1dLFwieFwiOntcInJcIjpbXCIuL2NvbW1lbnRzLmNvdW50XCJdLFwic1wiOlwiXzA+MVwifX1dfV19XSxcImlcIjpcImluZGV4XCIsXCJyXCI6XCJyZWFjdGlvbnNcIn1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWZvb3RlciBhbnRlbm5hLXJlYWN0aW9ucy1mb290ZXJcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwidlwiOntcImNsaWNrXCI6XCJzaG93ZGVmYXVsdFwifSxcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS10aGlua1wifSxcImZcIjpbXCJXaGF0IGRvIHlvdSB0aGluaz9cIl19XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEgYW50ZW5uYS1yZWFjdGlvbnMtd2lkZ2V0XCIsXCJ0YWJpbmRleFwiOlwiMFwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1oZWFkZXJcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnQtYW50ZW5uYS1sb2dvXCJ9fSxcIiBSZWFjdGlvbnNcIl19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcGFnZS1jb250YWluZXJcIn0sXCJmXCI6W1wiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcHJvZ3Jlc3MtcGFnZSBhbnRlbm5hLXBhZ2VcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtYm9keVwifX1dfV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hIGFudC1zdW1tYXJ5LXdpZGdldFwiLFwiYW50LWhhc2hcIjpbe1widFwiOjIsXCJyXCI6XCJwYWdlSGFzaFwifV19LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImFcIixcImFcIjp7XCJocmVmXCI6XCJodHRwOi8vd3d3LmFudGVubmEuaXNcIixcInRhcmdldFwiOlwiX2JsYW5rXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50LWFudGVubmEtbG9nb1wifX1dfSxcIiBcIix7XCJ0XCI6NCxcImZcIjpbe1widFwiOjQsXCJmXCI6W3tcInRcIjoyLFwiclwiOlwic3VtbWFyeVRvdGFsXCJ9XSxcIm5cIjo1MCxcInJcIjpcInN1bW1hcnlUb3RhbFwifSxcIiBSZWFjdGlvbnNcIl0sXCJuXCI6NTAsXCJ4XCI6e1wiclwiOltcInN1bW1hcnlUb3RhbFwiXSxcInNcIjpcIl8wIT09dW5kZWZpbmVkXCJ9fV19XX0iXX0=
