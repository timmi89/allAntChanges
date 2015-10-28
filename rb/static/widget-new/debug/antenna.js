(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/Users/jburns/antenna/rb/static/widget-new/src/js/antenna-app.js":[function(require,module,exports){

var ScriptLoader = require('./script-loader');
var CssLoader = require('./css-loader');
var GroupSettingsLoader = require('./group-settings-loader');
var PageDataLoader = require('./page-data-loader');
var PageScanner = require('./page-scanner');
var XDMLoader = require('./utils/xdm-loader');


// Step 1 - kick off the asynchronous loading of the Javascript and CSS we need.
ScriptLoader.load(scriptLoaded);
CssLoader.load();

function scriptLoaded() {
    // Step 2 - Once we have our required scripts, fetch the group settings from the server
    GroupSettingsLoader.load(function(groupSettings) {
        // Step 3 - Once we have the settings, we can kick off a couple things in parallel:
        //
        // -- create the hidden iframe we use for cross-domain cookies (primarily user login)
        // -- start fetching the page data
        // -- start hashing the page and inserting the affordances (in the empty state)
        //
        // As the page is scanned, the widgets are created and bound to the page data that comes in.
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
},{"./css-loader":"/Users/jburns/antenna/rb/static/widget-new/src/js/css-loader.js","./group-settings-loader":"/Users/jburns/antenna/rb/static/widget-new/src/js/group-settings-loader.js","./page-data-loader":"/Users/jburns/antenna/rb/static/widget-new/src/js/page-data-loader.js","./page-scanner":"/Users/jburns/antenna/rb/static/widget-new/src/js/page-scanner.js","./script-loader":"/Users/jburns/antenna/rb/static/widget-new/src/js/script-loader.js","./utils/xdm-loader":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/xdm-loader.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/auto-call-to-action.js":[function(require,module,exports){
var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var Ractive; require('./utils/ractive-provider').onLoad(function(loadedRactive) { Ractive=loadedRactive; });

function createCallToAction(antItemId) {
    var ractive = Ractive({
        el: $('div'),
        data: { antItemId: antItemId },
        template: require('../templates/auto-call-to-action.hbs.html'),
        partials: {
            logo: require('../templates/logo-svg.hbs.html')
        }
    });
    return $(ractive.find('.antenna-auto-cta'));
}

//noinspection JSUnresolvedVariable
module.exports = {
    create: createCallToAction
};
},{"../templates/auto-call-to-action.hbs.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/auto-call-to-action.hbs.html","../templates/logo-svg.hbs.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/logo-svg.hbs.html","./utils/jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js","./utils/ractive-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/ractive-provider.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/call-to-action-indicator.js":[function(require,module,exports){
var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var Ractive; require('./utils/ractive-provider').onLoad(function(loadedRactive) { Ractive=loadedRactive; });
var ReactionsWidget = require('./reactions-widget');


function createIndicatorWidget(options) {
    var containerData = options.containerData;
    var $containerElement = options.containerElement;
    var contentData = options.contentData;
    var $ctaElement = options.ctaElement;
    var $ctaLabel = options.ctaLabel; // optional
    var pageData = options.pageData;
    var groupSettings = options.groupSettings;
    var defaultReactions = options.defaultReactions;

    var reactionWidgetOptions = {
        reactionsData: containerData.reactions,
        containerData: containerData,
        containerElement: $containerElement,
        contentData: contentData,
        defaultReactions: defaultReactions,
        startPage: computeStartPage($ctaElement),
        pageData: pageData,
        groupSettings: groupSettings
    };

    $ctaElement.on('mouseenter.antenna', function(event) {
        if (event.buttons > 0 || (event.buttons == undefined && event.which > 0)) { // On Safari, event.buttons is undefined but event.which gives a good value. event.which is bad on FF
            // Don't react if the user is dragging or selecting text.
            return;
        }
        openReactionsWindow(reactionWidgetOptions, $ctaElement);
    });

    if ($ctaLabel) {
        // TODO: Refactor this out into a separate JS file? Otherwise, it
        Ractive({
            el: $ctaLabel, // TODO: review the structure of the DOM here. Do we want to render an element into $ctaLabel or just text?
            magic: true,
            data: {
                containerData: containerData,
                computeLabel: function(reactionCount) {
                    // TODO: what do we want to do for 0? Show nothing, keep the current "Reactions" label, or something else?
                    if (!reactionCount) {
                        return "Responses";
                    }
                    if (reactionCount == 1) {
                        return "1 Responses";
                    }
                    return reactionCount + " Responses";
                }
            },
            template: require('../templates/call-to-action-label.hbs.html')
        });
    }
}

function computeStartPage($element) {
    var val = ($element.attr('ant-mode') || '').trim();
    if (val === 'write') {
        return ReactionsWidget.PAGE_DEFAULTS;
    } else if (val === 'read') {
        return ReactionsWidget.PAGE_REACTIONS;
    }
    return ReactionsWidget.PAGE_AUTO;
}

function openReactionsWindow(reactionOptions, $ctaElement) {
    ReactionsWidget.open(reactionOptions, $ctaElement);
}

//noinspection JSUnresolvedVariable
module.exports = {
    create: createIndicatorWidget
};
},{"../templates/call-to-action-label.hbs.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/call-to-action-label.hbs.html","./reactions-widget":"/Users/jburns/antenna/rb/static/widget-new/src/js/reactions-widget.js","./utils/jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js","./utils/ractive-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/ractive-provider.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/comment-area-partial.js":[function(require,module,exports){
var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var AjaxClient = require('./utils/ajax-client');
var User = require('./utils/user');

function setupCommentArea(reactionProvider, containerData, pageData, callback, ractive) {
    $(ractive.find('.antenna-comment-input')).focus(); // TODO: decide whether we really want to start with focus in the textarea
    ractive.on('inputchanged', updateInputCounter(ractive));
    ractive.on('addcomment', addComment(reactionProvider, containerData, pageData, callback, ractive));
}

function addComment(reactionProvider, containerData, pageData, callback, ractive) {
    return function() {
        var comment = $(ractive.find('.antenna-comment-input')).val().trim(); // TODO: additional validation? input sanitizing?
        if (comment.length > 0) {
            $(ractive.find('.antenna-comment-widgets')).hide();
            $(ractive.find('.antenna-comment-waiting')).fadeIn('slow');
            reactionProvider.get(function (reaction) {
                AjaxClient.postComment(comment, reaction, containerData, pageData, function () {/*TODO*/
                }, error);
                $(ractive.find('.antenna-comment-waiting')).stop().hide();
                $(ractive.find('.antenna-comment-received')).fadeIn();
                if (callback) {
                    callback(comment, User.optimisticUser());
                }

                function error(message) {
                    // TODO real error handling
                    console.log('Error posting comment: ' + message);
                }
            });
        }
    }
}

function updateInputCounter(ractive) {
    return function(ractiveEvent) {
        var $textarea = $(ractiveEvent.original.target);
        var max = parseInt($textarea.attr('maxlength'));
        var length = $textarea.val().length;
        $(ractive.find('.antenna-comment-count')).html(Math.max(0, max - length));
    };
}

//noinspection JSUnresolvedVariable
module.exports = {
    setup: setupCommentArea
};
},{"./utils/ajax-client":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/ajax-client.js","./utils/jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js","./utils/user":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/user.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/comments-page.js":[function(require,module,exports){
var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var Ractive; require('./utils/ractive-provider').onLoad(function(loadedRactive) { Ractive = loadedRactive;});
var CommentAreaPartial = require('./comment-area-partial');

var pageSelector = '.antenna-comments-page';

function createPage(options) {
    var reaction = options.reaction;
    var comments = options.comments;
    var element = options.element;
    var containerData = options.containerData;
    var pageData = options.pageData;
    var closeWindow = options.closeWindow;
    var ractive = Ractive({
        el: element,
        append: true,
        magic: true,
        data: {
            reaction: reaction,
            comments: comments
        },
        template: require('../templates/comments-page.hbs.html'),
        partials: {
            commentArea: require('../templates/comment-area-partial.hbs.html')
        }
    });
    var reactionProvider = { // this reaction provider is a no-brainer because we already have a valid reaction (one with an ID)
        get: function(callback) {
            callback(reaction);
        }
    };
    CommentAreaPartial.setup(reactionProvider, containerData, pageData, commentAdded, ractive);
    ractive.on('closewindow', closeWindow);
    return {
        selector: pageSelector,
        teardown: function() { ractive.teardown(); }
    };

    function commentAdded(comment, user) {
        comments.unshift({ text: comment, user: user, new: true });
        $(ractive.find('.antenna-body')).animate({scrollTop: 0});
    }
}

module.exports = {
    create: createPage
};
},{"../templates/comment-area-partial.hbs.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/comment-area-partial.hbs.html","../templates/comments-page.hbs.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/comments-page.hbs.html","./comment-area-partial":"/Users/jburns/antenna/rb/static/widget-new/src/js/comment-area-partial.js","./utils/jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js","./utils/ractive-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/ractive-provider.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/confirmation-page.js":[function(require,module,exports){
var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var Ractive; require('./utils/ractive-provider').onLoad(function(loadedRactive) { Ractive = loadedRactive;});
var CommentAreaPartial = require('./comment-area-partial');
var SVGs = require('./svgs');

var pageSelector = '.antenna-confirmation-page';

function createPage(reactionText, reactionProvider, containerData, pageData, element) {
    var ractive = Ractive({
        el: element,
        append: true,
        data: {
            text: reactionText
        },
        template: require('../templates/confirmation-page.hbs.html'),
        partials: {
            commentArea: require('../templates/comment-area-partial.hbs.html'),
            facebookIcon: SVGs.facebook(),
            twitterIcon: SVGs.twitter()
        }
    });
    CommentAreaPartial.setup(reactionProvider, containerData, pageData, null, ractive);
    return {
        selector: pageSelector,
        teardown: function() { ractive.teardown(); }
    };
}

//noinspection JSUnresolvedVariable
module.exports = {
    create: createPage
};
},{"../templates/comment-area-partial.hbs.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/comment-area-partial.hbs.html","../templates/confirmation-page.hbs.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/confirmation-page.hbs.html","./comment-area-partial":"/Users/jburns/antenna/rb/static/widget-new/src/js/comment-area-partial.js","./svgs":"/Users/jburns/antenna/rb/static/widget-new/src/js/svgs.js","./utils/jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js","./utils/ractive-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/ractive-provider.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/css-loader.js":[function(require,module,exports){
var URLs = require('./utils/urls');
var baseUrl = URLs.antennaHome();

function loadCss() {
    var head = document.getElementsByTagName('head')[0];
    if (head) {
        // To make sure none of our content renders on the page before our CSS is loaded, we append a simple inline style
        // element that turns off our elements *before* our CSS links. This exploits the cascade rules - our CSS files appear
        // after the inline style in the document, so they take precedence (and make everything appear) once they're loaded.
        var styleTag = document.createElement('style');
        styleTag.innerHTML = '.antenna{display:none;}';
        head.appendChild(styleTag);

        var cssHref = baseUrl + '/static/widget-new/debug/antenna.css'; // TODO this needs a final path. CDN for production and local file for development?
        loadFile(cssHref, head);
    }
}

function loadFile(href, head) {
    var linkTag = document.createElement('link');
    linkTag.setAttribute('href', href);
    linkTag.setAttribute('rel', 'stylesheet');
    linkTag.setAttribute('type', 'text/css');
    head.appendChild(linkTag);
}

//noinspection JSUnresolvedVariable
module.exports = {
    load : loadCss
};
},{"./utils/urls":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/urls.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/defaults-page.js":[function(require,module,exports){
var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var AjaxClient = require('./utils/ajax-client');
var Ractive; require('./utils/ractive-provider').onLoad(function(loadedRactive) { Ractive = loadedRactive;});
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
            setTimeout(function() { // let the processing of the keyboard event finish before we show the page (otherwise, the confirmation page also receives the keystroke)
                submitCustomReaction();
            }, 0);
        } else if (key == 27) { // Escape
            $(event.target).val('');
            $(rootElement(ractive)).focus();
        }
        event.stopPropagation();
    }

    function newDefaultReaction(ractiveEvent) {
        var defaultReactionData = ractiveEvent.context;
        var reactionProvider = createReactionProvider();
        showConfirmation(defaultReactionData, reactionProvider);
        AjaxClient.postNewReaction(defaultReactionData, containerData, pageData, contentData, reactionProvider.reactionLoaded, error);

        function error(message) {
            // TODO handle any errors that occur posting a reaction
            console.log("error posting new reaction: " + message);
        }
    }

    function submitCustomReaction() {
        var body = $(ractive.find('.antenna-defaults-footer input')).val().trim();
        if (body !== '') {
            var reactionData = { text: body };
            var reactionProvider = createReactionProvider();
            showConfirmation(reactionData, reactionProvider);
            AjaxClient.postNewReaction(reactionData, containerData, pageData, contentData, reactionProvider.reactionLoaded, error);
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

function createReactionProvider() {

    var loadedReaction;
    var callbacks = [];

    function onReaction(callback) {
        callbacks.push(callback);
        notifyIfReady();
    }

    function reactionLoaded(reaction) {
        loadedReaction = reaction;
        notifyIfReady();
    }

    function notifyIfReady() {
        if (loadedReaction) {
            for (var i = 0; i < callbacks.length; i++) {
                callbacks[i](loadedReaction);
            }
            callbacks = [];
        }
    }

    return {
        get: onReaction, // TODO terminology
        reactionLoaded: reactionLoaded
    }
}

module.exports = {
    create: createPage
};
},{"../templates/defaults-page.hbs.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/defaults-page.hbs.html","./utils/ajax-client":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/ajax-client.js","./utils/jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js","./utils/ractive-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/ractive-provider.js","./utils/reactions-widget-layout-utils":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/reactions-widget-layout-utils.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/group-settings-loader.js":[function(require,module,exports){
var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var URLs = require('./utils/urls');
var GroupSettings = require('./group-settings');

// TODO fold this module into group-settings?

function loadSettings(callback) {
    $.getJSONP(URLs.groupSettingsUrl(), { host_name: window.antenna_host }, success, error);

    function success(json) {
        var groupSettings = GroupSettings.create(json);
        callback(groupSettings);
    }

    function error(message) {
        // TODO handle errors that happen when loading config data
        console.log('An error occurred loading group settings: ' + message);
    }
}

//noinspection JSUnresolvedVariable
module.exports = {
    load: loadSettings
};
},{"./group-settings":"/Users/jburns/antenna/rb/static/widget-new/src/js/group-settings.js","./utils/jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js","./utils/urls":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/urls.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/group-settings.js":[function(require,module,exports){
var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });

// TODO: trim trailing commas from any selector values

// TODO: Review. These are just copied from engage_full.
var defaults = {
    premium: false,
    img_selector: "img", // TODO: this is some bogus obsolete property. we shouldn't use it.
    img_container_selectors:"#primary-photo",
    active_sections: "body",
    //anno_whitelist: "body p",
    anno_whitelist: "p", // TODO: The current default is "body p", which makes no sense when we're searching only within the active sections
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
    image_selector: 'meta[property="og:image"]', // TODO: review what this should be (not from engage_full)
    image_attribute: 'content', // TODO: review what this should be (not from engage_full)
    //the scope in which to find parents of <br> tags.
    //Those parents will be converted to a <rt> block, so there won't be nested <p> blocks.
    //then it will split the parent's html on <br> tags and wrap the sections in <p> tags.

    //example:
    // br_replace_scope_selector: ".ant_br_replace" //e.g. "#mainsection" or "p"

    br_replace_scope_selector: null //e.g. "#mainsection" or "p"
};

function createFromJSON(json) {

    function data(key, ifAbsent) {
        return function() {
            var value = window.antenna_extend[key];
            if (value == undefined) {
                value = json[key];
                // TODO: our server apparently sends back null as a value for some attributes.
                // TODO: consider checking for null wherever we're checking for undefined
                if (value === undefined || value === '' || value === null) { // TODO: Should the server be sending back '' here or nothing at all? (It precludes the server from really saying 'nothing')
                    value = defaults[key];
                }
            }
            if (value == undefined) {
                return ifAbsent;
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
                    text: reactionStrings[i],
                    isDefault: true
                })
            }
        } else {
            var values = json['default_reactions'];
            if (values !== undefined) {
                for (var j = 0; j < values.length; j++) {
                    var value = values[j];
                    reactions.push({
                        text: value.body,
                        id: value.id,
                        isDefault: true
                    });
                }
            }
        }
        return reactions;
    }

    return {
        legacyBehavior: data('legacy_behavior', false), // TODO: make this real in the sense that it comes back from the server and probably move the flag to the page data. Unlikely that we need to maintain legacy behavior for new pages?
        groupId: data('id'),
        activeSections: data('active_sections'),
        url: {
            ignoreSubdomain: data('ignore_subdomain'),
            canonicalDomain: data('page_tld') // TODO: what to call this exactly. groupDomain? siteDomain? canonicalDomain?
        },
        summarySelector: data('summary_widget_selector'),
        summaryMethod: data('summary_widget_method'),
        pageSelector: data('post_selector'),
        pageLinkSelector: data('post_href_selector'),
        pageImageSelector: data('image_selector'),
        pageImageAttribute: data('image_attribute'),
        contentSelector: data('anno_whitelist'),
        textIndicatorLimit: data('initial_pin_limit'),
        enableTextHelper: data('paragraph_helper'),
        mediaIndicatorCorner: data('img_indicator_show_side'),
        generatedCtaSelector: data('separate_cta'),
        defaultReactions: defaultReactions,
        reactionBackgroundColors: backgroundColor(data('tag_box_bg_colors')),
        exclusionSelector: data('no_ant')
    }
}

//noinspection JSUnresolvedVariable
module.exports = {
    create: createFromJSON
};
},{"./utils/jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/hashed-elements.js":[function(require,module,exports){
// This module stores our mapping from hash values to their corresponding elements in the DOM. The data is organized
// by page for the blog roll case, where multiple pages of data can be loaded at once.
var pages = {};

function getElement(containerHash, pageHash) {
    var containers = pages[pageHash];
    if (containers) {
        return containers[containerHash];
    }
}

function setElement(containerHash, pageHash, element) {
    var containers = pages[pageHash];
    if (!containers) {
        containers = pages[pageHash] = {};
    }
    containers[containerHash] = element;
}

//noinspection JSUnresolvedVariable
module.exports = {
    get: getElement,
    set: setElement
};
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/js/locations-page.js":[function(require,module,exports){
var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var Ractive; require('./utils/ractive-provider').onLoad(function(loadedRactive) { Ractive = loadedRactive;});
var Range = require('./utils/range');

var HashedElements = require('./hashed-elements');

var pageSelector = '.antenna-locations-page';

function createPage(options) {
    var element = options.element;
    var reactionLocationData = options.reactionLocationData;
    var pageData = options.pageData;
    var closeWindow = options.closeWindow;
    var ractive = Ractive({
        el: element,
        append: true,
        data: {
            locationData: reactionLocationData,
            pageReactionCount: pageReactionCount(reactionLocationData),
            contentCountLabel: computeContentCountLabel,
            canLocate: function(containerHash) {
                // TODO: is there a better way to handle reactions to hashes that are no longer on the page?
                //       should we provide some kind of indication when we fail to locate a hash or just leave it as is?
                return HashedElements.get(containerHash, pageData.pageHash) !== undefined;
            }
        },
        template: require('../templates/locations-page.hbs.html')
    });
    ractive.on('closewindow', closeWindow);
    ractive.on('reveal', revealContent);
    return {
        selector: pageSelector,
        teardown: function() { ractive.teardown(); }
    };


    function revealContent(event) {
        var locationData = event.context;
        var element = HashedElements.get(locationData.containerHash, pageData.pageHash);
        if (element) {
            closeWindow();
            setTimeout(function() { // Let the processing of this click event finish before we add another click handler so the new handler isn't immediately triggered
                var targetScrollTop = $(element).offset().top - 20; // TODO: review the exact location
                $('body').animate({scrollTop: targetScrollTop});
                if (locationData.kind === 'txt') { // TODO: something better than a string compare. fix this along with the same issue in page-data
                    Range.highlight(element.get(0), locationData.location);
                    $(document).on('click.antenna', function() {
                        Range.clearHighlights();
                        $(document).off('click.antenna');
                    });
                }
            }, 0);
        }
    }
}

function pageReactionCount(reactionLocationData) {
    for (var contentID in reactionLocationData) {
        if (reactionLocationData.hasOwnProperty(contentID)) {
            var contentLocationData = reactionLocationData[contentID];
            if (contentLocationData.kind === 'pag') { // TODO: something better than a string compare. fix this along with the same issue in page-data
                return contentLocationData.count;
            }
        }
    }
}

function computeContentCountLabel(count) {
    if (count === 1) {
        return '<div class="antenna-content-count number">1</div><div class="antenna-content-count">reaction</div>';
    } else {
        return '<div class="antenna-content-count number">' + count + '</div><div class="antenna-content-count">reactions</div>';
    }
}

//noinspection JSUnresolvedVariable
module.exports = {
    create: createPage
};
},{"../templates/locations-page.hbs.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/locations-page.hbs.html","./hashed-elements":"/Users/jburns/antenna/rb/static/widget-new/src/js/hashed-elements.js","./utils/jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js","./utils/ractive-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/ractive-provider.js","./utils/range":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/range.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/media-indicator-widget.js":[function(require,module,exports){
var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var Ractive; require('./utils/ractive-provider').onLoad(function(loadedRactive) { Ractive = loadedRactive;});
var ReactionsWidget = require('./reactions-widget');

var AppMode = require('./utils/app-mode');
var MutationObserver = require('./utils/mutation-observer');
var ThrottledEvents = require('./utils/throttled-events');

function createIndicatorWidget(options) {
    // TODO: validate that options contains all required properties (applies to all widgets).
    var element = options.element;
    var containerData = options.containerData;
    var $containerElement = options.containerElement;
    var pageData = options.pageData;
    var groupSettings = options.groupSettings;
    var defaultReactions = options.defaultReactions;
    var contentData = options.contentData;
    var ractive = Ractive({
        el: element,
        append: true,
        magic: true,
        data: {
            containerData: containerData,
            extraAttributes: AppMode.debug ? 'ant-hash="' + containerData.hash + '"' : '' // TODO: this about making this a decorator handled by a "Debug" module
        },
        template: require('../templates/media-indicator-widget.hbs.html'),
        partials: {
            logo: require('../templates/logo-svg.hbs.html')
        }
    });

    var reactionWidgetOptions = {
        reactionsData: containerData.reactions,
        containerData: containerData,
        containerElement: $containerElement,
        contentData: contentData,
        defaultReactions: defaultReactions,
        pageData: pageData,
        groupSettings: groupSettings
    };

    var hoverTimeout;
    var activeTimeout;

    var $rootElement = $(rootElement(ractive));
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
            }, 50);
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
        clearTimeout(activeTimeout);
        setTimeout(function() {
            $rootElement.removeClass('active');
        }, 100); // We get a mouseleave event when the user hovers the indicator. Pause long enough that the reaction window can open if they hover.
    });
    setupPositioning($containerElement, groupSettings, ractive);

    return {
        teardown: function() { ractive.teardown(); }
    };
}

function setupPositioning($containerElement, groupSettings, ractive) {
    var $wrapperElement = $(wrapperElement(ractive));
    var $rootElement = $(rootElement(ractive));
    positionIndicator();

    var reposition = function() {
        positionIndicator();
    };
    ThrottledEvents.on('resize', reposition);
    ractive.on('teardown', function() {
        ThrottledEvents.off('resize', reposition);
    });

    // TODO: consider also listening to src attribute changes, which might affect the height of elements on the page
    // TODO: consider holding onto the element's last known offset and simply using that (checking if it changed) to
    //       determine if the indicator needs to be repositioned.
    MutationObserver.addAdditionListener(elementsAddedOrRemoved);
    MutationObserver.addRemovalListener(elementsAddedOrRemoved);

    function elementsAddedOrRemoved($elements) {
        // Reposition the indicator if elements which might adjust the container's position are added/removed.
        for (var i = 0; i < $elements.length; i++) {
            var $element = $elements[i];
            if ($element.height() > 0 && $element.offset().top <= $containerElement.offset().top) {
                reposition();
                return;
            }
        }
    }

    function positionIndicator() {
        // Position the wrapper element (which has a hardcoded width) in the appropriate corner. Then flip the left/right
        // positioning of the nested widget element to adjust the way it will expand when the media is hovered.
        var corner = groupSettings.mediaIndicatorCorner();
        var elementOffset = $containerElement.offset();
        var coords = {};
        if (corner.indexOf('top') !== -1) {
            coords.top = elementOffset.top;
        } else {
            coords.top = elementOffset.top + $containerElement.height() - $rootElement.outerHeight();
        }
        if (corner.indexOf('right') !== -1) {
            coords.left = elementOffset.left + $containerElement.width() - $wrapperElement.outerWidth();
            $rootElement.css({right:0,left:''});
        } else {
            coords.left = elementOffset.left;
            $rootElement.css({right:'',left:0});
        }
        $wrapperElement.css(coords);
    }
}

function wrapperElement(ractive) {
    return ractive.find('.antenna-media-indicator-wrapper');
}

function rootElement(ractive) {
    return ractive.find('.antenna-media-indicator-widget');
}

function openReactionsWindow(reactionOptions, ractive) {
    ReactionsWidget.open(reactionOptions, rootElement(ractive));
}

//noinspection JSUnresolvedVariable
module.exports = {
    create: createIndicatorWidget
};
},{"../templates/logo-svg.hbs.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/logo-svg.hbs.html","../templates/media-indicator-widget.hbs.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/media-indicator-widget.hbs.html","./reactions-widget":"/Users/jburns/antenna/rb/static/widget-new/src/js/reactions-widget.js","./utils/app-mode":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/app-mode.js","./utils/jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js","./utils/mutation-observer":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/mutation-observer.js","./utils/ractive-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/ractive-provider.js","./utils/throttled-events":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/throttled-events.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/page-data-loader.js":[function(require,module,exports){
var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var PageUtils = require('./utils/page-utils');
var ThrottledEvents = require('./utils/throttled-events');
var URLs = require('./utils/urls');
var PageData = require('./page-data');


// Compute the pages that we need to fetch. This is either:
// 1. Any nested pages we find using the page selector OR
// 2. The current window location
function computePagesParam($pageElementArray, groupSettings) {
    var groupId = groupSettings.groupId();
    var pages = [];
    for (var i = 0; i < $pageElementArray.length; i++) {
        var $pageElement = $pageElementArray[i];
        pages.push({
            group_id: groupId,
            url: PageUtils.computePageUrl($pageElement, groupSettings),
            title: PageUtils.computePageTitle($pageElement, groupSettings)
        });
    }
    if (pages.length == 1) {
        pages[0].image = PageUtils.computeTopLevelPageImage(groupSettings);
    }

    return { pages: pages };
}

function loadPageData(pageDataParam, groupSettings) {
    $.getJSONP(URLs.pageDataUrl(), pageDataParam, success, error);

    function success(json) {
        //setTimeout(function() { PageData.updateAllPageData(json, groupSettings); }, 3000);
        PageData.updateAllPageData(json, groupSettings);
    }

    function error(message) {
        // TODO handle errors that happen when loading page data
        console.log('An error occurred loading page data: ' + message);
    }
}

function startLoadingPageData(groupSettings) {
    var $pageElements = $(groupSettings.pageSelector());
    if ($pageElements.length == 0) {
        $pageElements = $('body');
    }
    queuePageDataLoad($pageElements, groupSettings);
}

function queuePageDataLoad($pageElements, groupSettings) {
    var pagesToLoad = [];
    $pageElements.each(function() {
        var $pageElement = $(this);
        if (isInView($pageElement)) {
            pagesToLoad.push($pageElement);
        } else {
            loadWhenVisible($pageElement, groupSettings);
        }
    });

    var pageDataParam = computePagesParam(pagesToLoad, groupSettings);
    // TODO: delete the commented line below, which is for testing purposes
    //pageDataParam = {pages: [{"group_id":1184, "url":"http://www.dukechronicle.com/articles/2014/02/14/portrait-porn-star","canonical_url":"same","title":"Portrait of a porn star","image":""}]};
    loadPageData(pageDataParam, groupSettings);
}

function isInView($element) {
    var triggerDistance = 300;
    return $element.offset().top <  $(document).scrollTop() + $(window).height() + triggerDistance;
}

function loadWhenVisible($pageElement, groupSettings) {
    var checkVisibility = function() {
        if (isInView($pageElement)) {
            var pageDataParam = computePagesParam([$pageElement], groupSettings);
            loadPageData(pageDataParam, groupSettings);
            ThrottledEvents.off('scroll', checkVisibility);
            ThrottledEvents.off('resize', checkVisibility);
        }
    };
    ThrottledEvents.on('scroll', checkVisibility);
    ThrottledEvents.on('resize', checkVisibility);
}

function pagesAdded($pageElements, groupSettings) {
    queuePageDataLoad($pageElements, groupSettings);
}

//noinspection JSUnresolvedVariable
module.exports = {
    load: startLoadingPageData,
    pagesAdded: pagesAdded
};
},{"./page-data":"/Users/jburns/antenna/rb/static/widget-new/src/js/page-data.js","./utils/jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js","./utils/page-utils":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/page-utils.js","./utils/throttled-events":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/throttled-events.js","./utils/urls":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/urls.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/page-data.js":[function(require,module,exports){
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
            summaryTotal: 0,
            summaryLoaded: false,
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
    pageData.summaryLoaded = true;

    // We add up the container reaction totals client-side
    var total = 0;
    var containerCounts = [];
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
            containerCounts.push({ count: total, container: container });
        }
    }
    var indicatorLimit = groupSettings.textIndicatorLimit();
    if (indicatorLimit) {
        // If an indicator limit is set, sort the containers and mark only the top N to be visible.
        containerCounts.sort(function(a, b) { return b.count - a.count; }); // sort largest count first
        for (var i = indicatorLimit; i < containerCounts.length; i++) {
            containerCounts[i].container.suppress = true;
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
            reactions: [],
            loaded: pageData.summaryLoaded, // TODO: should this just be a live function that delegates to summaryLoaded?
            suppress: false
        };
        pageData.containers[containerHash] = containerData;
    }
    return containerData;
}

// Merge the given container data into the pageData.containers data. This is necessary because the skeleton of the pageData.containers map
// is set up and bound to the UI before all the data is fetched from the server and we don't want to break the data binding.
function setContainers(pageData, jsonContainers) {
    for (var hash in jsonContainers) {
        if (jsonContainers.hasOwnProperty(hash)) {
            var containerData = getContainerData(pageData, hash);
            var fetchedContainerData = jsonContainers[hash];
            containerData.id = fetchedContainerData.id;
            for (var i = 0; i < fetchedContainerData.reactions.length; i++) {
                containerData.reactions.push(fetchedContainerData.reactions[i]);
            }
        }
    }
    var allContainers = pageData.containers;
    for (var hash in allContainers) {
        if (allContainers.hasOwnProperty(hash)) {
            var container = allContainers[hash];
            container.loaded = true;
        }
    }
}

function clearIndicatorLimit(pageData) {
    var containers = pageData.containers;
    for (var hash in containers) {
        if (containers.hasOwnProperty(hash)) {
            var container = containers[hash];
            container.suppress = false;
        }
    }
}

// Returns the locations where the given reaction occurs on the page. The return format is:
// {
//   <content_id> : {
//     count: <number>,
//     id: <content_id>,
//     containerID: <container_id>
//     kind: <content kind>,
//     location: <location>,
//     [body: <body>] filled in later via updateLocationData
//   }
// }
function getReactionLocationData(reaction, pageData) {
    if (!pageData.locationData) { // Populate this tree lazily, since it's not frequently used.
        pageData.locationData = computeLocationData(pageData);
    }
    return pageData.locationData[reaction.id];
}

// Returns a view on the given tree structure that's optimized for rendering the location of reactions (as from the
// summary widget). For each reaction, we can quickly get to the pieces of content that have that reaction as well as
// the count of those reactions for each piece of content.
//
// The structure looks like this:
// {
//   <reaction_id> : {   (this is the interaction_node_id)
//     <content_id> : {
//       count : <number>,
//       containerID: <container_id>,
//       kind: <content kind>,
//       location: <location>
//       [body: <body>] filled in later via updateLocationData
//     }
//   }
// }
function computeLocationData(pageData) {
    var locationData = {};
    var containers = pageData.containers;
    for (var hash in containers) {
        if (containers.hasOwnProperty(hash)) {
            var containerData = containers[hash];
            var reactions = containerData.reactions;
            for (var i = 0; i < reactions.length; i++) {
                var reaction = reactions[i];
                var reaction_id = reaction.id;
                var content = reaction.content;
                var content_id = content.id;
                var reactionLocationData = locationData[reaction_id];
                if (!reactionLocationData) {
                    reactionLocationData = {};
                    locationData[reaction_id] = reactionLocationData;
                }
                var contentLocationData = reactionLocationData[content_id]; // TODO: It's not really possible to get a hit here, is it? We should never see two instances of the same reaction for the same content? (There'd would just be one instance with a count > 1.)
                if (!contentLocationData) {
                    contentLocationData = {
                        count: 0,
                        kind: content.kind, // TODO: We should normalize this value to a set of constants. fix this in locations-page where the value is read as well
                        location: content.location,
                        containerHash: containerData.hash
                    };
                    reactionLocationData[content_id] = contentLocationData;
                }
                contentLocationData.count += reaction.count;
            }
        }
    }
    return locationData;
}

function updateReactionLocationData(reactionLocationData, contentBodies) {
    for (var contentID in contentBodies) {
        if (contentBodies.hasOwnProperty(contentID)) {
            var contentLocationData = reactionLocationData[contentID];
            if (contentLocationData) {
                contentLocationData.body = contentBodies[contentID];
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
    getReactionLocationData: getReactionLocationData,
    updateReactionLocationData: updateReactionLocationData,
    registerReaction: registerReaction,
    clearIndicatorLimit: clearIndicatorLimit
};
},{"./utils/jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/page-scanner.js":[function(require,module,exports){
var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var AppMode = require('./utils/app-mode');
var Hash = require('./utils/hash');
var MutationObserver = require('./utils/mutation-observer');
var PageUtils = require('./utils/page-utils');
var URLs = require('./utils/urls');
var WidgetBucket = require('./utils/widget-bucket');

var AutoCallToAction = require('./auto-call-to-action');
var CallToActionIndicator = require('./call-to-action-indicator');
var HashedElements = require('./hashed-elements');
var MediaIndicatorWidget = require('./media-indicator-widget');
var PageData = require('./page-data');
var PageDataLoader = require('./page-data-loader');
var SummaryWidget = require('./summary-widget');
var TextIndicatorWidget = require('./text-indicator-widget');
var TextReactions = require('./text-reactions');

var TYPE_TEXT = "text";
var TYPE_IMAGE = "image";
var TYPE_MEDIA = "media";

var ATTR_HASH = "ant-hash";


// Scan for all pages at the current browser location. This could just be the current page or it could be a collection
// of pages (aka 'posts').
function scanAllPages(groupSettings) {
    $(groupSettings.exclusionSelector()).addClass('no-ant'); // Add the no-ant class to everything that is flagged for exclusion
    var $pages = $(groupSettings.pageSelector()); // TODO: no-ant?
    if ($pages.length == 0) {
        // If we don't detect any page markers, treat the whole document as the single page
        $pages = $('body'); // TODO: Is this the right behavior? (Keep in sync with the same assumption that's built into page-data-loader.)
    }
    $pages.each(function() {
        var $page = $(this);
        scanPage($page, groupSettings);
    });
    MutationObserver.addAdditionListener(elementsAdded(groupSettings));
}

// Scan the page using the given settings:
// 1. Find all the containers that we care about.
// 2. Compute hashes for each container.
// 3. Insert widget affordances for each which are bound to the data model by the hashes.
function scanPage($page, groupSettings) {
    var url = PageUtils.computePageUrl($page, groupSettings);
    var urlHash = Hash.hashUrl(url);
    if (AppMode.debug) {
        $page.attr('ant-hash', urlHash);
    }
    var pageData = PageData.getPageData(urlHash);
    var $activeSections = find($page, groupSettings.activeSections(), true);

    // First, scan for elements that would cause us to insert something into the DOM that takes up space.
    // We want to get any page resizing out of the way as early as possible.
    // TODO: Consider doing this with raw Javascript before jQuery loads, to further reduce the delay. We wouldn't
    // save a *ton* of time from this, though, so it's definitely a later optimization.
    scanForSummaries($page, pageData, groupSettings); // TODO: should the summary search be confined to the active sections?
    $activeSections.each(function() {
        var $section = $(this);
        createAutoCallsToAction($section, pageData, groupSettings);
    });
    // Scan for CTAs across the entire page (they can be outside an active section). CTAs have to go before scans for
    // content because content involved in CTAs will be tagged no-ant.
    scanForCallsToAction($page, pageData, groupSettings);
    // Then scan for everything else
    $activeSections.each(function() {
        var $section = $(this);
        scanActiveElement($section, pageData, groupSettings);
    });
}

// Scans the given element, which appears inside an active section. The element can be the entire active section,
// some container within the active section, or a leaf node in the active section.
function scanActiveElement($element, pageData, groupSettings) {
    scanForContent($element, pageData, groupSettings);
}

function scanForSummaries($element, pageData, groupSettings) {
    var $summaries = find($element, groupSettings.summarySelector(), true);
    $summaries.each(function() {
        var $summary = $(this);
        var containerData = PageData.getContainerData(pageData, 'page'); // Magic hash for page reactions
        containerData.type = 'page'; // TODO: revisit whether it makes sense to set the type here
        var defaultReactions = groupSettings.defaultReactions($summary); // TODO: do we support customizing the default reactions at this level?
        var $summaryElement = SummaryWidget.create(containerData, pageData, defaultReactions, groupSettings);
        insertContent($summary, $summaryElement, groupSettings.summaryMethod());
    });
}

function scanForCallsToAction($element, pageData, groupSettings) {
    var ctaTargets = {}; // The elements that the call to actions act on (e.g. the image or video)
    find($element, '[ant-item]', true).each(function() {
        var $ctaTarget = $(this);
        $ctaTarget.addClass('no-ant'); // don't show the normal reaction affordance on a cta target
        var antItemId = $ctaTarget.attr('ant-item').trim();
        ctaTargets[antItemId] = $ctaTarget;
    });

    var ctaLabels = {}; // The optional elements that report the number of reactions to the cta
    find($element, '[ant-reactions-label-for]', true).each(function() {
        var $ctaLabel = $(this);
        $ctaLabel.addClass('no-ant'); // don't show the normal reaction affordance on a cta label
        var antItemId = $ctaLabel.attr('ant-reactions-label-for').trim();
        ctaLabels[antItemId] = $ctaLabel;
    });

    var $ctaElements = find($element, '[ant-cta-for]'); // The call to action elements which prompt the user to react
    $ctaElements.each(function() {
        var $ctaElement = $(this);
        var antItemId = $ctaElement.attr('ant-cta-for');
        var $targetElement = ctaTargets[antItemId];
        if ($targetElement) {
            var hash = computeHash($targetElement, pageData, groupSettings);
            var contentData = computeContentData($targetElement, groupSettings);
            if (hash && contentData) {
                var containerData = PageData.getContainerData(pageData, hash);
                containerData.type = computeElementType($targetElement); // TODO: revisit whether it makes sense to set the type here
                CallToActionIndicator.create({
                    containerData: containerData,
                    containerElement: $targetElement,
                    contentData: contentData,
                    ctaElement: $ctaElement,
                    ctaLabel: ctaLabels[antItemId],
                    defaultReactions: groupSettings.defaultReactions($targetElement),
                    pageData: pageData,
                    groupSettings: groupSettings
                });
            }
        }
    })
}

function createAutoCallsToAction($section, pageData, groupSettings) {
    var $ctaTargets = find($section, groupSettings.generatedCtaSelector());
    $ctaTargets.each(function() {
        var $ctaTarget = $(this);
        var antItemId = generateAntItemAttribute();
        $ctaTarget.attr('ant-item', antItemId);
        var $cta = AutoCallToAction.create(antItemId);
        $ctaTarget.after($cta); // TODO: make the insert behavior configurable like the summary
    });
}

var generateAntItemAttribute = function(index) {
    return function() {
        return 'antenna_auto_cta_' + index++;
    }
}(0);

function scanForContent($element, pageData, groupSettings) {
    var $contentElements = find($element, groupSettings.contentSelector(), true);
    $contentElements.each(function() {
        var $contentElement = $(this);
        var type = computeElementType($contentElement);
        switch(type) {
            case TYPE_IMAGE:
            case TYPE_MEDIA:
                scanMedia($contentElement, type, pageData, groupSettings);
                break;
            case TYPE_TEXT:
                scanText($contentElement, pageData, groupSettings);
                break;
        }
    });
}

function scanText($textElement, pageData, groupSettings) {
    if (shouldHashText($textElement, groupSettings)) {
        var hash = computeHash($textElement, pageData, groupSettings);
        if (hash) {
            var containerData = PageData.getContainerData(pageData, hash);
            containerData.type = 'text'; // TODO: revisit whether it makes sense to set the type here
            var defaultReactions = groupSettings.defaultReactions($textElement);
            var $indicatorElement = TextIndicatorWidget.create({
                    containerData: containerData,
                    containerElement: $textElement,
                    defaultReactions: defaultReactions,
                    pageData: pageData,
                    groupSettings: groupSettings
                }
            );
            var lastNode = lastContentNode($textElement.get(0));
            if (lastNode.nodeType !== 3) {
                $(lastNode).before($indicatorElement);
            } else {
                $textElement.append($indicatorElement); // TODO is this configurable ala insertContent(...)?
            }

            TextReactions.createReactableText({
                containerData: containerData,
                containerElement: $textElement,
                defaultReactions: defaultReactions,
                pageData: pageData,
                groupSettings: groupSettings,
                excludeNode: $indicatorElement.get(0)
            });
        }
    }
}

// We use this to handle the simple case of text content that ends with some media as in
// <p>My text. <img src="whatever"></p>.
// This is a simplistic algorithm, not a general solution:
// We walk the DOM inside the given node and keep track of the last "content" node that we encounter, which could be either
// text or some media.  If the last content node is not text, we want to insert the text indicator before the media.
function lastContentNode(node) {
    var lastNode;
    var childNodes = node.childNodes;
    for (var i = 0; i < childNodes.length; i++) {
        var child = childNodes[i];
        if (child.nodeType === 3) {
            lastNode = child;
        } else {
            var tagName = child.tagName.toLowerCase();
            switch (tagName) {
                case 'img':
                case 'iframe':
                case 'video':
                case 'iframe':
                    lastNode = child;
            }
        }
        lastNode = lastContentNode(child) || lastNode;
    }
    return lastNode;
}

function shouldHashText($textElement, groupSettings) {
    if ((isCta($textElement, groupSettings))) {
        // Don't hash the text if it is the target of a CTA.
        return false;
    }
    // Don't create an indicator for text elements that contain other text nodes.
    var $nestedElements = find($textElement, groupSettings.contentSelector());
    $nestedElements.each(function() {
        if ((computeElementType($(this)) === TYPE_TEXT)) {
            // Don't hash a text element if it contains any other matched text elements
            return false;
        }
    });
    return true;
}

function isCta($element, groupSettings) {
    var compositeSelector = groupSettings.generatedCtaSelector() + ',[ant-item]';
    return $element.is(compositeSelector);
}

// The "image" and "media" paths converge here, because we use the same indicator module for them both.
function scanMedia($mediaElement, type, pageData, groupSettings) {
    var indicator;
    var hash = computeHash($mediaElement, pageData, groupSettings);
    if (hash) {
        var containerData = PageData.getContainerData(pageData, hash);
        containerData.type = type === TYPE_IMAGE ? 'image' : 'media';
        var defaultReactions = groupSettings.defaultReactions($mediaElement);
        var contentData = computeContentData($mediaElement, groupSettings);
        if (contentData && contentData.dimensions) {
            if (contentData.dimensions.height >= 100 && contentData.dimensions.width >= 100) { // Don't create indicator on elements that are too small
                indicator = MediaIndicatorWidget.create({
                        element: WidgetBucket.get(),
                        containerData: containerData,
                        contentData: contentData,
                        containerElement: $mediaElement,
                        defaultReactions: defaultReactions,
                        pageData: pageData,
                        groupSettings: groupSettings
                    }
                );
            }
        }
    }
    // Listen for changes to the image attributes which could indicate content changes.
    MutationObserver.addOneTimeAttributeListener($mediaElement.get(0), ['src','ant-item-content','data'], function() {
        if (indicator) {
            // TODO: update HashedElements to remove the previous hash->element mapping. Consider there could be multiple
            //       instances of the same element on a page... so we might need to use a counter.
            indicator.teardown();
        }
        scanMedia($mediaElement, type, pageData, groupSettings);
    });
}

function find($element, selector, addBack) {
    var result = $element.find(selector);
    if (addBack && selector) { // with an undefined selector, addBack will match and always return the input element (unlike find() which returns an empty match)
        result = result.addBack(selector);
    }
    return result.filter(function() {
        return $(this).closest('.no-ant').length == 0;
    });
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

function computeHash($element, pageData, groupSettings) {
    // TODO: make sure we generate unique hashes using an ordered index in case of collisions
    var hash;
    switch (computeElementType($element)) {
        case TYPE_IMAGE:
            var imageUrl = URLs.computeImageUrl($element, groupSettings);
            hash = Hash.hashImage(imageUrl);
            break;
        case TYPE_MEDIA:
            var mediaUrl = URLs.computeMediaUrl($element, groupSettings);
            hash = Hash.hashMedia(mediaUrl);
            break;
        case TYPE_TEXT:
            hash = Hash.hashText($element);
            break;
    }
    if (hash) {
        HashedElements.set(hash, pageData.pageHash, $element); // Record the relationship between the hash and dom element.
        if (AppMode.debug) {
            $element.attr(ATTR_HASH, hash);
        }
    }
    return hash;
}

function computeContentData($element, groupSettings) {
    var contentData;
    switch (computeElementType($element)) {
        case TYPE_IMAGE:
            var imageUrl = URLs.computeImageUrl($element, groupSettings);
            var imageDimensions = {
                height: $element.height(), // TODO: review how we get the image dimensions
                width: $element.width()
            };
            contentData = {
                type: 'img',
                body: imageUrl,
                dimensions: imageDimensions
            };
            break;
        case TYPE_MEDIA:
            var mediaUrl = URLs.computeMediaUrl($element, groupSettings);
            var mediaDimensions = {
                height: $element.height(), // TODO: review how we get the media dimensions
                width: $element.width()
            };
            contentData = {
                type: 'med',
                body: mediaUrl,
                dimensions: mediaDimensions
            };
            break;
        case TYPE_TEXT:
            contentData = { type: 'text' };
            break;
    }
    return contentData;
}

function computeElementType($element) {
    var itemType = $element.attr('ant-item-type');
    if (itemType && itemType.trim().length > 0) {
        return itemType.trim();
    }
    var tagName = $element.prop('tagName').toLowerCase();
    switch (tagName) {
        case 'img':
            return TYPE_IMAGE;
        case 'video':
        case 'iframe':
        case 'embed':
            return TYPE_MEDIA;
        default:
            return TYPE_TEXT;
    }
}

function elementsAdded(groupSettings) {
    return function ($elements) {
        for (var i = 0; i < $elements.length; i++) {
            var $element = $elements[i];
            $element.find(groupSettings.exclusionSelector()).addBack(groupSettings.exclusionSelector()).addClass('no-ant'); // Add the no-ant class to everything that is flagged for exclusion
            if ($element.closest('.no-ant').length === 0) { // Ignore anything tagged no-ant
                // First, see if any entire pages were added
                var $pages = find($element, groupSettings.pageSelector(), true);
                if ($pages.length > 0) {
                    PageDataLoader.pagesAdded($pages, groupSettings); // TODO: consider if there's a better way to architect this
                    $pages.each(function () {
                        scanPage($(this), groupSettings);
                    });
                } else {
                    // If not an entire page/pages, see if content was added to an existing page
                    var $page = $element.closest(groupSettings.pageSelector());
                    if ($page.length === 0) {
                        $page = $('body'); // TODO: is this right? keep in sync with scanAllPages
                    }
                    var url = PageUtils.computePageUrl($page, groupSettings);
                    var urlHash = Hash.hashUrl(url);
                    var pageData = PageData.getPageData(urlHash);
                    // First, check for any new summary widgets...
                    scanForSummaries($element, pageData, groupSettings);
                    // Next, see if any entire active sections were added
                    var $activeSections = find($element, groupSettings.activeSections());
                    if ($activeSections.length > 0) {
                        $activeSections.each(function () {
                            createAutoCallsToAction($(this), pageData, groupSettings);
                        });
                        $activeSections.each(function () {
                            var $section = $(this);
                            scanActiveElement($section, pageData, groupSettings);
                        });
                    } else {
                        // Finally, scan inside the element for content
                        var $activeSection = $element.closest(groupSettings.activeSections());
                        if ($activeSection.length > 0) {
                            createAutoCallsToAction($element, pageData, groupSettings);
                            scanActiveElement($element, pageData, groupSettings);
                        } else {
                            // If the element is added outside an active section, just check it for CTAs
                            scanForCallsToAction($element, pageData, groupSettings);
                        }
                    }
                }
            }
        }
    }
}

//noinspection JSUnresolvedVariable
module.exports = {
   scan: scanAllPages
};
},{"./auto-call-to-action":"/Users/jburns/antenna/rb/static/widget-new/src/js/auto-call-to-action.js","./call-to-action-indicator":"/Users/jburns/antenna/rb/static/widget-new/src/js/call-to-action-indicator.js","./hashed-elements":"/Users/jburns/antenna/rb/static/widget-new/src/js/hashed-elements.js","./media-indicator-widget":"/Users/jburns/antenna/rb/static/widget-new/src/js/media-indicator-widget.js","./page-data":"/Users/jburns/antenna/rb/static/widget-new/src/js/page-data.js","./page-data-loader":"/Users/jburns/antenna/rb/static/widget-new/src/js/page-data-loader.js","./summary-widget":"/Users/jburns/antenna/rb/static/widget-new/src/js/summary-widget.js","./text-indicator-widget":"/Users/jburns/antenna/rb/static/widget-new/src/js/text-indicator-widget.js","./text-reactions":"/Users/jburns/antenna/rb/static/widget-new/src/js/text-reactions.js","./utils/app-mode":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/app-mode.js","./utils/hash":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/hash.js","./utils/jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js","./utils/mutation-observer":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/mutation-observer.js","./utils/page-utils":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/page-utils.js","./utils/urls":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/urls.js","./utils/widget-bucket":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/widget-bucket.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/popup-widget.js":[function(require,module,exports){
var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var Ractive; require('./utils/ractive-provider').onLoad(function(loadedRactive) { Ractive = loadedRactive;});
var WidgetBucket = require('./utils/widget-bucket');
var TransitionUtil = require('./utils/transition-util');

var ractive;
var clickHandler;


function getRootElement() {
    // TODO revisit this, it's kind of goofy and it might have a timing problem
    if (!ractive) {
        var bucket = WidgetBucket.get();
        ractive = Ractive({
            el: bucket,
            append: true,
            template: require('../templates/popup-widget.hbs.html'),
            partials: {
                logo: require('../templates/logo-svg.hbs.html')
            }
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
},{"../templates/logo-svg.hbs.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/logo-svg.hbs.html","../templates/popup-widget.hbs.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/popup-widget.hbs.html","./utils/jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js","./utils/ractive-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/ractive-provider.js","./utils/transition-util":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/transition-util.js","./utils/widget-bucket":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/widget-bucket.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/reactions-page.js":[function(require,module,exports){
var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var AjaxClient = require('./utils/ajax-client');
var Ractive; require('./utils/ractive-provider').onLoad(function(loadedRactive) { Ractive = loadedRactive;});
var Range = require('./utils/range');
var ReactionsWidgetLayoutUtils = require('./utils/reactions-widget-layout-utils');
var SVGs = require('./svgs');

var pageSelector = '.antenna-reactions-page';

function createPage(options) {
    var isSummary = options.isSummary;
    var reactionsData = options.reactionsData;
    var containerData = options.containerData;
    var pageData = options.pageData;
    var contentData = options.contentData;
    var containerElement = options.containerElement; // optional
    //var showProgress = options.showProgress;
    var showConfirmation = options.showConfirmation;
    var showDefaults = options.showDefaults;
    var showComments = options.showComments;
    var showLocations = options.showLocations;
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
            reactionsBackgroundColor: arrayAccessor(reactionsLayoutData.backgroundColors),
            isSummary: isSummary
        },
        decorators: {
            sizetofit: sizeToFit
        },
        partials: {
            locationIcon: SVGs.location(),
            commentsIcon: SVGs.comments()
        }
    });

    if (containerElement) {
        ractive.on('highlight', highlightContent(containerData, pageData, containerElement));
        ractive.on('clearhighlights', Range.clearHighlights);
    }
    ractive.on('plusone', plusOne(containerData, pageData, showConfirmation));
    ractive.on('showdefault', showDefaults);
    ractive.on('showcomments', function(ractiveEvent) { showComments(ractiveEvent.context); return false; }); // TODO clean up
    ractive.on('showlocations', function(ractiveEvent) { showLocations(ractiveEvent.context); return false; }); // TODO clean up
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
            if (reactionA.count === reactionB.count) {
                // when the count is the same, sort by creation time (our IDs increase chronologically)
                return reactionA.id - reactionB.id;
            }
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
        var reactionProvider = { // this reaction provider is a no-brainer because we already have a valid reaction (one with an ID)
            get: function(callback) {
                callback(reactionData);
            }
        };
        showConfirmation(reactionData, reactionProvider);
        AjaxClient.postPlusOne(reactionData, containerData, pageData, function(){}/*TODO*/, error);

        function error(message) {
            // TODO handle any errors that occur posting a reaction
            console.log("error posting plus one: " + message);
        }
    };
}

//noinspection JSUnresolvedVariable
module.exports = {
    create: createPage
};
},{"../templates/reactions-page.hbs.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/reactions-page.hbs.html","./svgs":"/Users/jburns/antenna/rb/static/widget-new/src/js/svgs.js","./utils/ajax-client":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/ajax-client.js","./utils/jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js","./utils/ractive-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/ractive-provider.js","./utils/range":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/range.js","./utils/reactions-widget-layout-utils":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/reactions-widget-layout-utils.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/reactions-widget.js":[function(require,module,exports){
var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var AjaxClient = require('./utils/ajax-client');
var Moveable = require('./utils/moveable');
var Ractive; require('./utils/ractive-provider').onLoad(function(loadedRactive) { Ractive = loadedRactive;});
var Range = require('./utils/range');
var TouchSupport = require('./utils/touch-support');
var TransitionUtil = require('./utils/transition-util');
var URLs = require('./utils/urls');
var WidgetBucket = require('./utils/widget-bucket');

var CommentsPage = require('./comments-page');
var ConfirmationPage = require('./confirmation-page');
var DefaultsPage = require('./defaults-page');
var LocationsPage = require('./locations-page');
var PageData = require('./page-data');
var ReactionsPage = require('./reactions-page');

var pageReactions = 'reactions';
var pageDefaults = 'defaults';
var pageAuto = 'auto';

var openInstances = [];

function openReactionsWidget(options, elementOrCoords) {
    closeAllWindows();
    var defaultReactions = options.defaultReactions;
    var reactionsData = options.reactionsData;
    var containerData = options.containerData;
    var containerElement = options.containerElement; // optional
    var startPage = options.startPage || pageAuto; // optional
    var isSummary = options.isSummary === undefined ? false : options.isSummary; // optional
    // contentData contains details about the content being reacted to like text range or image height/width.
    // we potentially modify this data (e.g. in the default reaction case we select the text ourselves) so we
    // make a local copy of it to avoid unexpectedly changing data out from under one of the clients
    var contentData = JSON.parse(JSON.stringify(options.contentData));
    var pageData = options.pageData;
    var groupSettings = options.groupSettings;
    var colors = groupSettings.reactionBackgroundColors();
    var ractive = Ractive({
        el: WidgetBucket.get(),
        append: true,
        data: {},
        template: require('../templates/reactions-widget.hbs.html'),
        partials: {
            logo: require('../templates/logo-svg.hbs.html')
        }
    });
    openInstances.push(ractive);
    var $rootElement = $(rootElement(ractive));
    Moveable.makeMoveable($rootElement, $rootElement.find('.antenna-header'));
    var pages = [];

    openWindow();

    function openWindow() {
        PageData.clearIndicatorLimit(pageData);
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

        if (startPage === pageReactions || (startPage === pageAuto && reactionsData.length > 0)) {
            showReactionsPage(false);
        } else { // startPage === pageDefaults || there are no reactions
            showDefaultReactionsPage(false);
        }

        setupWindowClose(pages, ractive);
        preventExtraScroll($rootElement);
        openInstances.push(ractive);
    }

    function showReactionsPage(animate) {
        var options = {
            isSummary: isSummary,
            reactionsData: reactionsData,
            pageData: pageData,
            containerData: containerData,
            containerElement: containerElement,
            colors: colors,
            contentData: contentData,
            showConfirmation: showConfirmation,
            showDefaults: function() { showDefaultReactionsPage(true) },
            showComments: showComments,
            showLocations: showLocations,
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
            showConfirmation: showConfirmation,
            element: pageContainer(ractive)
        };
        var page = DefaultsPage.create(options);
        pages.push(page);
        showPage(page.selector, $rootElement, animate);
    }

    function showConfirmation(reactionData, reactionProvider) {
        setWindowTitle('Thanks for your reaction!');
        var page = ConfirmationPage.create(reactionData.text, reactionProvider, containerData, pageData, pageContainer(ractive));
        pages.push(page);

        // TODO: revisit why we need to use the timeout trick for the confirm page, but not for the defaults page
        setTimeout(function() { // In order for the positioning animation to work, we need to let the browser render the appended DOM element
            showPage(page.selector, $rootElement, true);
        }, 1);
    }

    function showProgressPage() {
        showPage('.antenna-progress-page', $rootElement, false, true);
    }

    function showComments(reaction) {
        showProgressPage(); // TODO: provide some way for the user to give up / cancel. Also, handle errors fetching comments.
        AjaxClient.getComments(reaction, function(comments) {
            var options = {
                reaction: reaction,
                comments: comments,
                element: pageContainer(ractive),
                closeWindow: closeWindow,
                containerData: containerData,
                pageData: pageData
            };
            var page = CommentsPage.create(options);
            pages.push(page);

            // TODO: revisit
            setTimeout(function() { // In order for the positioning animation to work, we need to let the browser render the appended DOM element
                showPage(page.selector, $rootElement, true);
            }, 1);
        });
    }

    function showLocations(reaction) {
        showProgressPage(); // TODO: provide some way for the user to give up / cancel. Also, handle errors fetching comments.
        AjaxClient.getReactionLocationData(reaction, pageData, function(reactionLocationData) {
            var options = { // TODO: clean up the number of these "options" objects that we create.
                element: pageContainer(ractive),
                reactionLocationData: reactionLocationData,
                pageData: pageData,
                closeWindow: closeWindow
            };
            var page = LocationsPage.create(options);
            pages.push(page);
            setWindowTitle(reaction.text);
            // TODO: revisit
            setTimeout(function() { // In order for the positioning animation to work, we need to let the browser render the appended DOM element
                showPage(page.selector, $rootElement, true);
            }, 1);
        });
    }

    function closeWindow() {
        ractive.fire('closeWindow');
    }

    function setWindowTitle(title) {
        $(ractive.find('.antenna-reactions-title')).html(title);
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
        });
    $(document).on('click.antenna', function(event) {
        if ($(event.target).closest('.antenna-reactions-widget').length === 0) {
            closeAllWindows();
        }
    });
    var tapListener = TouchSupport.setupTap(document, function(event) {
        if ($(event.target).closest('.antenna-reactions-widget').length === 0) {
            event.preventDefault();
            closeAllWindows();
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
        tapListener.teardown();
        Range.clearHighlights();
        for (var i = 0; i < pages.length; i++) {
            pages[i].teardown();
        }
        ractive.teardown();
    }
}

function closeAllWindows() {
    for (var i = 0; i < openInstances.length; i++) {
        openInstances[i].fire('closeWindow');
    }
    openInstances = [];
}

function isOpenWindow() {
    return openInstances.length > 0;
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
    open: openReactionsWidget,
    isOpen: isOpenWindow,
    PAGE_REACTIONS: pageReactions,
    PAGE_DEFAULTS: pageDefaults,
    PAGE_AUTO: pageAuto
};
},{"../templates/logo-svg.hbs.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/logo-svg.hbs.html","../templates/reactions-widget.hbs.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/reactions-widget.hbs.html","./comments-page":"/Users/jburns/antenna/rb/static/widget-new/src/js/comments-page.js","./confirmation-page":"/Users/jburns/antenna/rb/static/widget-new/src/js/confirmation-page.js","./defaults-page":"/Users/jburns/antenna/rb/static/widget-new/src/js/defaults-page.js","./locations-page":"/Users/jburns/antenna/rb/static/widget-new/src/js/locations-page.js","./page-data":"/Users/jburns/antenna/rb/static/widget-new/src/js/page-data.js","./reactions-page":"/Users/jburns/antenna/rb/static/widget-new/src/js/reactions-page.js","./utils/ajax-client":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/ajax-client.js","./utils/jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js","./utils/moveable":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/moveable.js","./utils/ractive-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/ractive-provider.js","./utils/range":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/range.js","./utils/touch-support":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/touch-support.js","./utils/transition-util":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/transition-util.js","./utils/urls":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/urls.js","./utils/widget-bucket":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/widget-bucket.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/script-loader.js":[function(require,module,exports){
var RactiveProvider = require('./utils/ractive-provider');
var RangyProvider = require('./utils/rangy-provider');
var JQueryProvider = require('./utils/jquery-provider');
var AppMode = require('./utils/app-mode');
var URLs = require('./utils/urls');

var baseUrl = URLs.antennaHome();

var scripts = [
    {src: '//cdnjs.cloudflare.com/ajax/libs/jquery/2.1.4/jquery.min.js', callback: JQueryProvider.loaded},
    {src: '//cdnjs.cloudflare.com/ajax/libs/ractive/0.7.3/ractive.runtime.min.js', callback: RactiveProvider.loaded, aboutToLoad: RactiveProvider.aboutToLoad},
    {src: baseUrl + '/static/widget-new/lib/rangy-compiled.js', callback: RangyProvider.loaded, aboutToLoad: RangyProvider.aboutToLoad} // TODO minify and host this somewhere
];
if (AppMode.offline) {
    // Use the offline versions of the libraries for development.
    scripts = [
        {src: baseUrl + '/static/js/cdn/jquery/2.1.4/jquery.js', callback: JQueryProvider.loaded},
        {src: baseUrl + '/static/js/cdn/ractive/0.7.3/ractive.runtime.js', callback: RactiveProvider.loaded, aboutToLoad: RactiveProvider.aboutToLoad},
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
},{"./utils/app-mode":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/app-mode.js","./utils/jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js","./utils/ractive-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/ractive-provider.js","./utils/rangy-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/rangy-provider.js","./utils/urls":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/urls.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/summary-widget.js":[function(require,module,exports){
var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var Ractive; require('./utils/ractive-provider').onLoad(function(loadedRactive) { Ractive = loadedRactive;});
var ReactionsWidget = require('./reactions-widget');

function createSummaryWidget(containerData, pageData, defaultReactions, groupSettings) {
    var ractive = Ractive({
        el: $('<div>'), // the real root node is in the template. it's extracted after the template is rendered into this dummy element
        data: pageData,
        magic: true,
        template: require('../templates/summary-widget.hbs.html'),
        partials: {
            logo: require('../templates/logo-svg.hbs.html')
        }
    });
    var $rootElement = $(rootElement(ractive));
    $rootElement.on('mouseenter', function(event) {
       openReactionsWindow(containerData, pageData, defaultReactions, groupSettings, ractive);
    });
    return $rootElement;
}

function rootElement(ractive) {
    // TODO: gotta be a better way to get this
    return ractive.find('.ant-summary-widget');
}

function openReactionsWindow(containerData, pageData, defaultReactions, groupSettings, ractive) {
    var reactionsWidgetOptions = {
        isSummary: true,
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
},{"../templates/logo-svg.hbs.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/logo-svg.hbs.html","../templates/summary-widget.hbs.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/summary-widget.hbs.html","./reactions-widget":"/Users/jburns/antenna/rb/static/widget-new/src/js/reactions-widget.js","./utils/jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js","./utils/ractive-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/ractive-provider.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/svgs.js":[function(require,module,exports){
var Ractive; require('./utils/ractive-provider').onLoad(function(loadedRactive) { Ractive = loadedRactive;});

// About how we handle icons: We insert a single SVG element at the top of the body element which defines all of the
// icons we need. Then all icons used by the applications are rendered with very lightweight SVG elements that simply
// point to the appropriate icon by reference.

// TODO: look into using a single template for the "use" SVGs. Can we instantiate a partial with a dynamic context?
var templates = {
    logo: require('../templates/logo-svg.hbs.html'),
    comments: require('../templates/svg-comments.hbs.html'),
    location: require('../templates/svg-location.hbs.html'),
    facebook: require('../templates/svg-facebook.hbs.html'),
    twitter: require('../templates/svg-twitter.hbs.html')
};

var isSetup = false;

function ensureSetup() {
    if (!isSetup) {
        var dummy = document.createElement('div');
        Ractive({
            el: dummy,
            template: require('../templates/svgs.hbs.html')
        });
        // Safari on iOS requires the SVG that defines the icons appear before the SVGs that reference it.
        document.body.insertBefore(dummy.children[0], document.body.firstChild);
        isSetup = true;
    }
}

function getSVG(template) {
    return function() {
        ensureSetup();
        return template;
    }
}

//noinspection JSUnresolvedVariable
module.exports = {
    logo: getSVG(templates.logo),
    comments: getSVG(templates.comments),
    location: getSVG(templates.location),
    facebook: getSVG(templates.facebook),
    twitter: getSVG(templates.twitter)
};
},{"../templates/logo-svg.hbs.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/logo-svg.hbs.html","../templates/svg-comments.hbs.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/svg-comments.hbs.html","../templates/svg-facebook.hbs.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/svg-facebook.hbs.html","../templates/svg-location.hbs.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/svg-location.hbs.html","../templates/svg-twitter.hbs.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/svg-twitter.hbs.html","../templates/svgs.hbs.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/svgs.hbs.html","./utils/ractive-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/ractive-provider.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/text-indicator-widget.js":[function(require,module,exports){
var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var Ractive; require('./utils/ractive-provider').onLoad(function(loadedRactive) { Ractive = loadedRactive;});
var Range = require('./utils/range');

var PopupWidget = require('./popup-widget');
var ReactionsWidget = require('./reactions-widget');
var SVGs = require('./svgs');


function createIndicatorWidget(options) {
    var containerData = options.containerData;
    var $containerElement = options.containerElement;
    var pageData = options.pageData;
    var groupSettings = options.groupSettings;
    var defaultReactions = options.defaultReactions;
    var coords = options.coords;
    var ractive = Ractive({
        el: $('<div>'), // the real root node is in the template. it's extracted after the template is rendered into this dummy element
        append: true,
        magic: true,
        data: {
            containerData: containerData,
            extraClasses: groupSettings.enableTextHelper() ? "" : "antenna-nohint"
        },
        template: require('../templates/text-indicator-widget.hbs.html'),
        partials: {
            logo: SVGs.logo()
        }
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
        // TODO: Don't react if the data isn't loaded yet (i.e. we don't know whether to show the popup or reaction widget)
        clearTimeout(hoverTimeout); // only one timeout at a time
        hoverTimeout = setTimeout(function() {
            if (containerData.reactions.length > 0) {
                openReactionsWindow(reactionWidgetOptions, ractive);
            } else {
                var $icon = $(rootElement(ractive)).find('.antenna-logo');
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
    return ractive.find('.antenna-text-indicator-widget');
}

function openReactionsWindow(reactionOptions, ractive) {
    ReactionsWidget.open(reactionOptions, rootElement(ractive));
}

//noinspection JSUnresolvedVariable
module.exports = {
    create: createIndicatorWidget
};
},{"../templates/text-indicator-widget.hbs.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/text-indicator-widget.hbs.html","./popup-widget":"/Users/jburns/antenna/rb/static/widget-new/src/js/popup-widget.js","./reactions-widget":"/Users/jburns/antenna/rb/static/widget-new/src/js/reactions-widget.js","./svgs":"/Users/jburns/antenna/rb/static/widget-new/src/js/svgs.js","./utils/jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js","./utils/ractive-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/ractive-provider.js","./utils/range":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/range.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/text-reactions.js":[function(require,module,exports){
var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var PopupWidget = require('./popup-widget');
var Range = require('./utils/range');
var ReactionsWidget = require('./reactions-widget');
var TouchSupport = require('./utils/touch-support');


function createReactableText(options) {
    // TODO: impose an upper limit on the length of text that can be reacted to? (applies to the indicator-widget too)
    var $containerElement = options.containerElement;
    var containerData = options.containerData;
    var excludeNode = options.excludeNode;
    var reactionsWidgetOptions = {
        reactionsData: [], // Always open with the default reactions
        containerData: containerData,
        contentData: { type: 'text' },
        containerElement: $containerElement,
        defaultReactions: options.defaultReactions,
        pageData: options.pageData,
        groupSettings: options.groupSettings
    };

    setupTouchEvents($containerElement.get(0), reactionsWidgetOptions);
    $containerElement.on('mouseup', function(event) {
        if (containerData.loaded) {
            var node = $containerElement.get(0);
            var point = Range.getSelectionEndPoint(node, event, excludeNode);
            if (point) {
                var coordinates = {top: point.y, left: point.x};
                PopupWidget.show(coordinates, grabSelectionAndOpen(node, coordinates, reactionsWidgetOptions, excludeNode));
            }
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

function grabNodeAndOpen(node, reactionsWidgetOptions, coords) {
    Range.grabNode(node, function(text, location) {
        reactionsWidgetOptions.contentData.location = location;
        reactionsWidgetOptions.contentData.body = text;
        ReactionsWidget.open(reactionsWidgetOptions, coords);
    });
}

function setupTouchEvents(element, reactionsWidgetOptions) {
    TouchSupport.setupTap(element, function(event) {
        if (!ReactionsWidget.isOpen()) {
            event.preventDefault();
            var touch = event.changedTouches[0];
            var coords = { top: touch.pageY, left: touch.pageX };
            setTimeout(function() { // Let this event finish processing before opening the reactions window so the window doesn't also process the event.
                grabNodeAndOpen(element, reactionsWidgetOptions, coords);
                element.removeEventListener('touchend', touchEnd);
                element.addEventListener('touchend', touchEnd);
            }, 0);
        }
    });
}

//noinspection JSUnresolvedVariable
module.exports = {
    createReactableText: createReactableText
};
},{"./popup-widget":"/Users/jburns/antenna/rb/static/widget-new/src/js/popup-widget.js","./reactions-widget":"/Users/jburns/antenna/rb/static/widget-new/src/js/reactions-widget.js","./utils/jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js","./utils/range":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/range.js","./utils/touch-support":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/touch-support.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/ajax-client.js":[function(require,module,exports){
// TODO: needs a better name once the scope is clear

var $; require('./jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var XDMClient = require('./xdm-client');
var URLs = require('./urls');
var User = require('./user');

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
            is_default: reactionData.isDefault !== undefined && reactionData.isDefault, // false unless specified
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
        $.getJSONP(URLs.createReactionUrl(), data, newReactionSuccess(contentLocation, containerData, pageData, success), error);
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
        // TODO: should we bail if there's no parent ID? It's not really a +1 without one.
        if (reactionData.parentID) {
            data.tag.parent_id = reactionData.parentID;
        }
        $.getJSONP(URLs.createReactionUrl(), data, plusOneSuccess(reactionData, containerData, pageData, success), error);
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
        if (!reactionData.parentID) {
            // TODO: Ensure that we always have a parent ID. Comments should always be made on a reaction.
            console.log('Error attempting to post comment. No parent reaction specified.');
            return;
        }
        var data = {
            comment: comment,
            tag: {
                parent_id: reactionData.parentID
            },
            user_id: userInfo.user_id,
            ant_token: userInfo.ant_token,
            page_id: pageData.pageId,
            group_id: pageData.groupId
        };
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

function commentSuccess(reactionData, containerData, pageData, callback) {
    return function(response) {
        // TODO: in the case that someone reacts and then immediately comments, we have a race condition where the
        //       comment response could come back before the reaction. we need to:
        //       1. Make sure the server only creates a single reaction in this case (not a HUGE deal if it makes two)
        //       2. Resolve the two responses that both theoretically come back with the same reaction data at the same
        //          time. Make sure we don't end up with two copies of the same data in the model.
        var reactionCreated = !response.existing;
        if (reactionCreated) {
            if (!reactionData.commentCount) {
                reactionData.commentCount = 0;
            }
            reactionData.commentCount += 1;
        } else {
            // TODO: do we ever get a response to a new reaction telling us that it's already existing? If so, could the count need to be updated?
        }
        callback(reactionCreated);
    }
}

function plusOneSuccess(reactionData, containerData, pageData, callback) {
    return function(response) {
        // TODO: Do we care about response.existing anymore (we used to show different feedback in the UI, but no longer...)
        var reactionCreated = !response.existing;
        if (reactionCreated) {
            // TODO: we should get back a response with data in the "new format" and update the model from the response
            reactionData.count = reactionData.count + 1;
            containerData.reactionTotal = containerData.reactionTotal + 1;
            pageData.summaryTotal = pageData.summaryTotal + 1;
        }
        // TODO: What should we pass in the callback? Maybe just pass back the reaction? Or build one from the response?
        callback(reactionCreated);
    }
}

function newReactionSuccess(contentLocation, containerData, pageData, callback) {
    return function(response) {
        // TODO: Can response.existing ever come back true for a 'new' reaction? Should we behave any differently if it does?
        var reaction = reactionFromResponse(response, contentLocation);
        reaction = PageData.registerReaction(reaction, containerData, pageData);
        callback(reaction);
    };
}

function reactionFromResponse(response, contentLocation) {
    // TODO: the server should give us back a reaction matching the new API format.
    //       we're just faking it out for now; this code is temporary
    var reaction = {
        text: response.interaction.interaction_node.body,
        id: response.interaction.interaction_node.id,
        count: 1 // TODO: could we get back a different count if someone else made the same "new" reaction before us?
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
        } else if (contentLocation) {
            // TODO: ensure that the API always returns a location and remove the "contentLocation" that's being passed around.
            // For now, just patch the response with the data we know we sent over.
            reaction.content.location = contentLocation;
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

function getReactionLocationData(reaction, pageData, callback) {
    var reactionLocationData = PageData.getReactionLocationData(reaction, pageData);
    var contentIDs = Object.getOwnPropertyNames(reactionLocationData);
    XDMClient.getUser(function(response) {
        var userInfo = response.data;
        var data = {
            user_id: userInfo.user_id,
            ant_token: userInfo.ant_token,
            content_ids: contentIDs
        };
        $.getJSONP(URLs.fetchContentBodiesUrl(), data, function(response) {
            PageData.updateReactionLocationData(reactionLocationData, response);
            callback(reactionLocationData);
        }, function(message) {
            // TODO: error handling
            console.log('An error occurred fetching content bodies: ' + message);
        })
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
            user: User.fromCommentJSON(jsonComment.user, jsonComment.social_user)
        };
        comments.push(comment);
    }
    return comments;
}

//noinspection JSUnresolvedVariable
module.exports = {
    postPlusOne: postPlusOne,
    postNewReaction: postNewReaction,
    postComment: postComment,
    getComments: getComments,
    getReactionLocationData: getReactionLocationData
};
},{"../page-data":"/Users/jburns/antenna/rb/static/widget-new/src/js/page-data.js","./jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js","./urls":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/urls.js","./user":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/user.js","./xdm-client":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/xdm-client.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/app-mode.js":[function(require,module,exports){

function computeCurrentScriptSrc() {
    if (document.currentScript) {
        return document.currentScript.src;
    }
    // IE fallback...
    var scripts = document.body.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
        var script = scripts[i];
        if (script.hasAttribute('src')) {
            var scriptSrc = script.getAttribute('src');
            // TODO: use a regexp here
            if (scriptSrc.indexOf('/antenna.js') !== -1 || scriptSrc.indexOf('/engage.js') != -1 || scriptSrc.indexOf('/engage_full.js') != -1) {
                return scriptSrc;
            }
        }
    }
}

var currentScriptSrc = computeCurrentScriptSrc() || '';

//noinspection JSUnresolvedVariable
module.exports = {
    // TODO: Make this more flexible so it works in everyone's dev environment
    offline: offline = currentScriptSrc.indexOf('localhost') !== -1,
    test: currentScriptSrc.indexOf('localhost:3000') !== -1,
    debug: currentScriptSrc.indexOf('?debug') !== -1
};
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/callback-support.js":[function(require,module,exports){

var antuid = 0; // "globally" unique ID that we use to tag callback functions for later retrieval. (This is how "off" works.)

function createCallbacks() {

    var callbacks = {};

    function addCallback(callback) {
        if (callback.antuid === undefined) {
            callback.antuid = antuid++;
        }
        callbacks[callback.antuid] = callback;
    }

    function removeCallback(callback) {
        if (callback.antuid !== undefined) {
            delete callbacks[callback.antuid];
        }
    }

    function getCallbacks() {
        var allCallbacks = [];
        for (var key in callbacks) {
            if (callbacks.hasOwnProperty(key)) {
                allCallbacks.push(callbacks[key]);
            }
        }
        return allCallbacks;
    }

    // Convenience function that invokes all callbacks with no parameters. Any callbacks that need params can be called
    // by clients using getCallbacks()
    function invokeAll() {
        for (var key in callbacks) {
            if (callbacks.hasOwnProperty(key)) {
                callbacks[key]();
            }
        }
    }

    function isEmpty() {
        return Object.getOwnPropertyNames(callbacks).length === 0;
    }

    return {
        add: addCallback,
        remove: removeCallback,
        get: getCallbacks,
        isEmpty: isEmpty,
        invokeAll: invokeAll
    }
}

//noinspection JSUnresolvedVariable
module.exports = {
    create: createCallbacks
};
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/hash.js":[function(require,module,exports){
var $; require('./jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var MD5 = require('./md5');

// TODO: This is just copy/pasted from engage_full
// TODO: The code is looking for .ant_indicator to see if it's already been hashed. Review.
// TODO: Can we implement a simpler version of this for non-legacy code using $element.text()?
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
    if (text) {
        var hashText = "rdr-text-" + text;
        return MD5.hex_md5(hashText);
    }
}

function hashUrl(url) {
    return MD5.hex_md5(url);
}

function hashImage(imageUrl) {
    if (imageUrl && imageUrl.length > 0) {
        var hashText = 'rdr-img-' + imageUrl;
        return MD5.hex_md5(hashText);
    }
}

function hashMedia(mediaUrl) {
    if (mediaUrl && mediaUrl.length > 0) {
        var hashText = 'rdr-media-' + mediaUrl;
        return MD5.hex_md5(hashText);
    }
}

//noinspection JSUnresolvedVariable
module.exports = {
    hashText: hashText,
    hashImage: hashImage,
    hashMedia: hashMedia,
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
            },
            error: function(xhr, textStatus, message) {
                // Okay, apparently jQuery *does* call its error callback for JSONP requests sometimes...
                // Specifically, when the response status is OK but an error occurs client-side processing the response.
                error (message);
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
},{"./jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/mutation-observer.js":[function(require,module,exports){
var $; require('./jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var WidgetBucket = require('./widget-bucket');

// TODO: detect whether the browser supports MutationObserver and fallback to Mutations Events

function addAdditionListener(callback) {
    var observer = new MutationObserver(function(mutationRecords) {
        for (var i = 0; i < mutationRecords.length; i++) {
            var addedElements = filteredElements(mutationRecords[i].addedNodes);
            if (addedElements.length > 0) {
                callback(addedElements);
            }
        }
    });
    var body = document.getElementsByTagName('body')[0];
    observer.observe(body, {
        childList: true,
        attributes: false,
        characterData: false,
        subtree: true,
        attributeOldValue: false,
        characterDataOldValue: false
    });
}

function addRemovalListener(callback) {
    var observer = new MutationObserver(function(mutationRecords) {
        for (var i = 0; i < mutationRecords.length; i++) {
            var removedElements = filteredElements(mutationRecords[i].removedNodes);
            if (removedElements.length > 0) {
                callback(removedElements);
            }
        }
    });
    var body = document.getElementsByTagName('body')[0];
    observer.observe(body, {
        childList: true,
        attributes: false,
        characterData: false,
        subtree: true,
        attributeOldValue: false,
        characterDataOldValue: false
    });
}

// Filter the set of nodes to eliminate anything inside our own DOM elements (otherwise, we generate a ton of chatter)
function filteredElements(nodeList) {
    var filtered = [];
    for (var i = 0; i < nodeList.length; i++) {
        var node = nodeList[i];
        if (node.nodeType !== 3) { // Don't process text nodes
            var $element = $(node);
            if ($element.closest('.antenna, ' + WidgetBucket.selector()).length === 0) {
                filtered.push($element);
            }
        }
    }
    return filtered;
}

function addOneTimeAttributeListener(node, attributes, callback) {
    var observer = new MutationObserver(function(mutationRecords) {
        for (var i = 0; i < mutationRecords.length; i++) {
            var target = mutationRecords[i].target;
            callback(target);
            observer.disconnect();
        }
    });
    observer.observe(node, {
        childList: false,
        attributes: true,
        characterData: false,
        subtree: false,
        attributeOldValue: false,
        characterDataOldValue: false,
        attributeFilter: attributes
    });
}

//noinspection JSUnresolvedVariable
module.exports = {
    addAdditionListener: addAdditionListener,
    addRemovalListener: addRemovalListener,
    addOneTimeAttributeListener: addOneTimeAttributeListener
};
},{"./jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js","./widget-bucket":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/widget-bucket.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/page-utils.js":[function(require,module,exports){
var $; require('./jquery-provider').onLoad(function(jQuery) { $=jQuery; });

function computeTopLevelPageTitle() {
    // TODO: Why is this hard-coded, when the equivalent for the image is configurable? (Unify them.)
    var title = $('meta[property="og:title"]').attr('content') || $('title').text() || '';
    return title.trim();
}

function computePageTitle($page, groupSettings) {
    var pageTitle = $page.find(groupSettings.pageLinkSelector()).text().trim();
    if (pageTitle === '') {
        pageTitle = computeTopLevelPageTitle();
    }
    return pageTitle;
}

function computeTopLevelPageImage(groupSettings) {
    // TODO: This is currently just reproducing what engage_full does. But do we really need to look inside the 'html'
    //       element like this? Can we just use a selector like the one for the page title (meta[property="og:image"])?
    //       Can/should we look inside the head element instead of the whole html document?
    //       Unify the strategies used by this function and computeTopLevelPageTitle()
    var image = $('html').find(groupSettings.pageImageSelector()).attr(groupSettings.pageImageAttribute()) || '';
    return image.trim();
}

function computeTopLevelCanonicalUrl(groupSettings) {
    var canonicalUrl = window.location.href.split('#')[0].toLowerCase();
    var $canonicalLink = $('link[rel="canonical"]');
    if ($canonicalLink.length > 0) {
        var overrideUrl = $canonicalLink.attr('href').trim().toLowerCase();
        var domain = (window.location.protocol+'//'+window.location.hostname+'/').toLowerCase();
        if (overrideUrl !== domain) { // fastco fix (since they sometimes rewrite their canonical to simply be their domain.)
            canonicalUrl = overrideUrl;
        }
    }
    return removeSubdomainFromPageUrl(canonicalUrl, groupSettings);
}

function computePageElementUrl($pageElement, groupSettings) {
    var url = $pageElement.find(groupSettings.pageLinkSelector()).attr('href');
    if (url) {
        return removeSubdomainFromPageUrl(url, groupSettings);
    }
    return computeTopLevelCanonicalUrl(groupSettings);
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
    computePageTitle: computePageTitle,
    computeTopLevelPageImage: computeTopLevelPageImage
};
},{"./jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/ractive-provider.js":[function(require,module,exports){
var $; require('./jquery-provider').onLoad(function(jQuery) { $=jQuery; });

var noConflict;
var loadedRactive;
var callbacks = [];

// Capture any global instance of Ractive which already exists before we load our own.
function aboutToLoad() {
    noConflict = window.Ractive;
}

// Restore the global instance of Ractive (if any) and pass out our version to our callbacks
function loaded() {
    loadedRactive = Ractive;
    window.Ractive = noConflict;
    loadedRactive.decorators.cssreset = cssResetDecorator; // Make our css reset decorator available to all instances
    notifyCallbacks();
}

function cssResetDecorator(node) {
    tagChildren(node, 'antenna-reset');
    return { teardown: function() {} };
}

function tagChildren(element, clazz) {
    if (element.children) { // Safari returns undefined when asking for children on an SVG element
        for (var i = 0; i < element.children.length; i++) {
            tagChildren(element.children[i], clazz);
        }
    }
    $(element).addClass(clazz);
}

function notifyCallbacks() {
    for (var i = 0; i < callbacks.length; i++) {
        callbacks[i](loadedRactive);
    }
    callbacks = [];
}

// Registers the given callback to be notified when our version of Ractive is loaded.
function onLoad(callback) {
    if (loadedRactive) {
        callback(loadedRactive);
    } else {
        callbacks.push(callback);
    }
}

//noinspection JSUnresolvedVariable
module.exports = {
    aboutToLoad: aboutToLoad,
    loaded: loaded,
    onLoad: onLoad
};
},{"./jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/range.js":[function(require,module,exports){
var $; require('./jquery-provider').onLoad(function(jQuery) { $=jQuery; });
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
    var $excluded = $(node).find('.antenna-text-indicator-widget');
    if ($excluded.size() > 0) { // Remove the indicator from the end of the selected range.
        range.setEndBefore($excluded.get(0));
    }
    var selection = rangy.getSelection();
    selection.setSingleRange(range);
    var location = rangy.serializeSelection(selection, true, node);
    var text = selection.toString();
    if (text.trim().length > 0) {
        highlightSelection(selection); // Highlighting deselects the text, so do this last.
        if (callback) {
            callback(text, location);
        }
    }
    selection.removeAllRanges(); // Don't actually leave the element selected.
    selection.refresh();
}

// Highlights the given location inside the given node.
function highlightLocation(node, location) {
    // TODO error handling in case the range is not valid?
    if (rangy.canDeserializeRange(location, node, document)) {
        try {
            var range = rangy.deserializeRange(location, node, document);
            highlightRange(range);
        } catch (error) {
            // TODO: Consider logging some kind of event server-side?
            // TODO: Consider highlighting the whole node? Or is it better to just highlight nothing?
        }
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
},{"./jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js","./rangy-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/rangy-provider.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/rangy-provider.js":[function(require,module,exports){

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

//noinspection JSUnresolvedVariable
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
},{"./jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/throttled-events.js":[function(require,module,exports){
var CallbackSupport = require('./callback-support');

// This module allows us to register callbacks that are throttled in their frequency. This is useful for events like
// resize and scroll, which can be fired at an extremely high rate.

var throttledListeners = {};

function on(type, callback) {
    throttledListeners[type] = throttledListeners[type] || createThrottledListener(type);
    throttledListeners[type].addCallback(callback);
}

function off(type, callback) {
    var eventListener = throttledListeners[type];
    if (eventListener) {
        eventListener.removeCallback(callback);
        if (eventListener.isEmpty()) {
            eventListener.teardown();
            delete throttledListeners[type];
        }
    }
}

// Creates a listener on the particular event type. Callbacks added to this listener will be throttled.
function createThrottledListener(type) {
    var callbacks = CallbackSupport.create();
    var eventTimeout;
    setup();
    return {
        addCallback: callbacks.add,
        removeCallback: callbacks.remove,
        isEmpty: callbacks.isEmpty,
        teardown: teardown
    };

    function handleEvent() {
       if (!eventTimeout) {
           eventTimeout = setTimeout(function() {
               callbacks.invokeAll();
               eventTimeout = null;
           }, 66); // 15 FPS
       }
    }

    function setup() {
        window.addEventListener(type, handleEvent);
    }

    function teardown() {
        window.removeEventListener(type, handleEvent);
    }
}

//noinspection JSUnresolvedVariable
module.exports = {
    on: on,
    off: off
};
},{"./callback-support":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/callback-support.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/touch-support.js":[function(require,module,exports){

// Sets up the given element to be called with a TouchEvent that we recognize as a tap.
function setupTouchTapEvents(element, callback) {
    // TODO: find a real value for this
    var timeout = 200; // This is the time between touchstart and touchend that we use to distinguish a tap from a long press.
    var validTap = false;
    element.addEventListener('touchstart', touchStart);
    element.addEventListener('touchmove', touchMove);
    element.addEventListener('touchcancel', touchCancel);
    element.addEventListener('touchend', touchEnd);
    return {
        teardown: function() {
            element.removeEventListener('touchstart', touchStart);
            element.removeEventListener('touchmove', touchMove);
            element.removeEventListener('touchcancel', touchCancel);
            element.removeEventListener('touchend', touchEnd);
        }
    };

    function touchStart(event) {
        validTap = true;
        setTimeout(function() {
            validTap = false;
        }, timeout);
    }
    function touchEnd(event) {
        if (validTap && event.changedTouches.length === 1) {
            callback(event);
        }
    }
    function touchMove(event) {
        validTap = false;
    }
    function touchCancel(event) {
        validTap = false;
    }
}

//noinspection JSUnresolvedVariable
module.exports = {
    setupTap: setupTouchTapEvents
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
var AppMode = require('./app-mode');

function antennaHome() {
    if (AppMode.test) {
        return window.location.protocol + '//localhost:3000';
    } else if (AppMode.offline) {
        return window.location.protocol + "//localhost:8081";
    }
    return "https://www.antenna.is"; // TODO: www? how about antenna.is or api.antenna.is?
}

// TODO: our server is redirecting any URLs without a trailing slash. is this necessary?

function getGroupSettingsUrl() {
    return '/api/settings/';
}

function getPageDataUrl() {
    return '/api/pagenewer/';
}

function getCreateReactionUrl() {
    return '/api/tag/create/';
}

function getCreateCommentUrl() {
    return '/api/comment/create/';
}

function getFetchCommentUrl() {
    return '/api/comment/replies/';
}

function getFetchContentBodiesUrl() {
    return '/api/content/bodies/';
}

function computeImageUrl($element, groupSettings) {
    if (groupSettings.legacyBehavior()) {
        return legacyComputeImageUrl($element);
    }
    var content = $element.attr('ant-item-content') || $element.attr('src');
    if (content && content.indexOf('//') !== 0 && content.indexOf('http') !== 0) { // protocol-relative or absolute url, e.g. //domain.com/foo/bar.png or http://domain.com/foo/bar/png
        if (content.indexOf('/') === 0) { // domain-relative url, e.g. /foo/bar.png => domain.com/foo/bar.png
            content = window.location.origin + content;
        } else { // path-relative url, e.g. bar.png => domain.com/baz/bar.png
            var path = window.location.pathname;
            var index = path.lastIndexOf('/') + 1;
            if (path.length > index) {
                path = path.substring(0, index);
            }
            content = window.location.origin + path + content;
        }
    }
    return content;
}

// Legacy implementation which maintains the old behavior of engage_full
// This code is wrong for URLs that start with "//". It also gives precedence to the src att instead of ant-item-content
function legacyComputeImageUrl($element) {
    var content = $element.attr('src') || $element.attr('ant-item-content');
    if (content) {
        if (content.indexOf('/') === 0) {
            content = window.location.origin + content;
        }
        if (content.indexOf('http') !== 0) {
            content = window.location.origin + window.location.pathname + content;
        }
    }
    return content;
}

function computeMediaUrl($element, groupSettings) {
    if (groupSettings.legacyBehavior()) {
        return legacyComputeMediaUrl($element);
    }
    var content = $element.attr('ant-item-content') || $element.attr('src') || $element.attr('data');
    if (content && content.indexOf('//') !== 0 && content.indexOf('http') !== 0) { // protocol-relative or absolute url, e.g. //domain.com/foo/bar.png or http://domain.com/foo/bar/png
        if (content.indexOf('/') === 0) { // domain-relative url, e.g. /foo/bar.png => domain.com/foo/bar.png
            content = window.location.origin + content;
        } else { // path-relative url, e.g. bar.png => domain.com/baz/bar.png
            var path = window.location.pathname;
            var index = path.lastIndexOf('/') + 1;
            if (path.length > index) {
                path = path.substring(0, index);
            }
            content = window.location.origin + path + content;
        }
    }
    return content;
}

// Legacy implementation which maintains the old behavior of engage_full
// This code is wrong for URLs that start with "//". It also gives precedence to the src att instead of ant-item-content
function legacyComputeMediaUrl($element) {
    var content = $element.attr('ant-item-content') || $element.attr('src') || $element.attr('data') || '';
    if (content) {
        if (content.indexOf('/') === 0) {
            content = window.location.origin + content;
        }
        if (content.indexOf('http') !== 0) {
            content = window.location.origin + window.location.pathname + content;
        }
    }
    return content;
}

//noinspection JSUnresolvedVariable
module.exports = {
    antennaHome: antennaHome,
    groupSettingsUrl: getGroupSettingsUrl,
    pageDataUrl: getPageDataUrl,
    createReactionUrl: getCreateReactionUrl,
    createCommentUrl: getCreateCommentUrl,
    fetchCommentUrl: getFetchCommentUrl,
    fetchContentBodiesUrl: getFetchContentBodiesUrl,
    computeImageUrl: computeImageUrl,
    computeMediaUrl: computeMediaUrl
};
},{"./app-mode":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/app-mode.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/user.js":[function(require,module,exports){
var AppMode = require('./app-mode');

// TODO: Figure out how many different formats of user data we have and either unify them or provide clear
//       API here to translate each variation into something standard for the client.
// TODO: Have XDMClient pass through this module as well.
function userFromCommentJSON(jsonUser, socialUser) { // This format works for the user returned from /api/comments/replies
    var user = {};
    if (jsonUser.user_id) {
        user.id = jsonUser.user_id;
    }
    if (socialUser) {
        user.imageURL = socialUser.img_url;
        user.name = socialUser.full_name;
    }
    if (!user.name) {
        user.name = jsonUser.first_name ? (jsonUser.first_name + ' ' + jsonUser.last_name) : 'Anonymous';
    }
    if (!user.imageURL) {
        user.imageURL = anonymousImageURL()
    }
    return user;
}


// TODO: Revisit the user that we pass back for new comments. Options are:
//       1. Use the logged in user, assuming we already have one in hand via XDM.
//       2. Use a generic "you" representation like we're doing now.
//       3. Don't show any indication of the user. Just show the comment.
//       For now, this is just giving us some notion of user without a round trip.
function optimisticUser() {
    var user = {
        name: 'You',
        imageURL: anonymousImageURL()
    };
    return user;
}

function anonymousImageURL() {
    return AppMode.offline ? '/static/widget/images/anonymousplode.png' : 'http://s3.amazonaws.com/readrboard/widget/images/anonymousplode.png';
}

module.exports = {
    fromCommentJSON: userFromCommentJSON,
    optimisticUser: optimisticUser
};
},{"./app-mode":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/app-mode.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/widget-bucket.js":[function(require,module,exports){
var id = 'antenna-widget-bucket';

function getWidgetBucket() {
    var bucket = document.getElementById(id);
    if (!bucket) {
        bucket = document.createElement('div');
        bucket.setAttribute('id', id);
        document.body.appendChild(bucket);
    }
    return bucket;
}

//noinspection JSUnresolvedVariable
module.exports = {
    get: getWidgetBucket,
    selector: function() { return '#' + id; }
};
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
        return userInfo && userInfo.ant_token && userInfo.user_id; // TODO && userInfo.user_type && social_user, etc.?
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
    $(WidgetBucket.get()).append( $xdmIframe );
}

module.exports = {
    createXDMframe: createXDMframe
};
},{"./jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js","./urls":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/urls.js","./widget-bucket":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/widget-bucket.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/templates/auto-call-to-action.hbs.html":[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna antenna-auto-cta"},"f":[{"t":7,"e":"div","a":{"class":"antenna-auto-cta-inner","ant-cta-for":[{"t":2,"r":"antItemId"}]},"f":[{"t":8,"r":"logo"}," ",{"t":7,"e":"span","a":{"class":"antenna-auto-cta-label","ant-reactions-label-for":[{"t":2,"r":"antItemId"}]}}]}]}]}
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/templates/call-to-action-label.hbs.html":[function(require,module,exports){
module.exports={"v":3,"t":[{"t":2,"x":{"r":["computeLabel","containerData.reactionTotal"],"s":"_0(_1)"}}]}
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/templates/comment-area-partial.hbs.html":[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna-comment-area"},"f":[{"t":7,"e":"div","a":{"class":"antenna-comment-widgets"},"f":[{"t":7,"e":"textarea","v":{"input":"inputchanged"},"a":{"class":"antenna-comment-input","placeholder":"Add comments or #hashtags","maxlength":"500"}}," ",{"t":7,"e":"div","a":{"class":"antenna-comment-footer"},"f":[{"t":7,"e":"span","a":{"class":"antenna-comment-limit"},"f":[{"t":7,"e":"span","a":{"class":"antenna-comment-count"},"f":["500"]}," characters left"]}," ",{"t":7,"e":"button","a":{"class":"antenna-comment-submit"},"v":{"click":"addcomment"},"f":["Comment"]}]}]}," ",{"t":7,"e":"div","a":{"class":"antenna-comment-waiting"},"f":["..."]}," ",{"t":7,"e":"div","a":{"class":"antenna-comment-received"},"f":["Thanks for your comment."]}]}]}
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/templates/comments-page.hbs.html":[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna-page antenna-comments-page"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-body"},"f":[{"t":7,"e":"div","v":{"click":"closewindow"},"a":{"class":"antenna-comments-close"},"f":["Close X"]}," ",{"t":7,"e":"div","a":{"class":"antenna-comments-header"},"f":["(",{"t":2,"r":"comments.length"},") Comments:"]}," ",{"t":4,"f":[{"t":7,"e":"div","a":{"class":["antenna-comment-entry ",{"t":4,"f":["antenna-comment-new"],"n":50,"r":"./new"}]},"f":[{"t":7,"e":"table","f":[{"t":7,"e":"tr","f":[{"t":7,"e":"td","a":{"class":"antenna-comment-cell"},"f":[{"t":7,"e":"img","a":{"src":[{"t":2,"r":"./user.imageURL"}]}}]}," ",{"t":7,"e":"td","a":{"class":"antenna-comment-author"},"f":[{"t":2,"r":"./user.name"}]}]}," ",{"t":7,"e":"tr","f":[{"t":7,"e":"td","f":[]}," ",{"t":7,"e":"td","a":{"class":"antenna-comment-text"},"f":[{"t":2,"r":"./text"}]}]}]}]}],"i":"index","r":"comments"}," ",{"t":8,"r":"commentArea"}]}]}]}
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/templates/confirmation-page.hbs.html":[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna-page antenna-confirmation-page"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-body"},"f":[{"t":7,"e":"div","a":{"class":"antenna-comment-reaction"},"f":[{"t":2,"r":"text"}]}," ",{"t":8,"r":"commentArea"}]}," ",{"t":7,"e":"div","a":{"class":"antenna-footer antenna-confirm-footer"},"f":[{"t":7,"e":"span","v":{"click":"share"},"a":{"class":"antenna-share"},"f":["Share your reaction: ",{"t":8,"r":"facebookIcon"},{"t":8,"r":"twitterIcon"}]}]}]}]}
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/templates/defaults-page.hbs.html":[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","v":{"keydown":"pagekeydown"},"a":{"class":"antenna-page antenna-defaults-page","tabindex":"0"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-body"},"f":[{"t":4,"f":[{"t":7,"e":"div","v":{"click":"newreaction"},"a":{"class":["antenna-reaction ",{"t":2,"x":{"r":["defaultLayoutClass","index"],"s":"_0(_1)"}}],"style":["background-color:",{"t":2,"x":{"r":["defaultBackgroundColor","index"],"s":"_0(_1)"}}]},"f":[{"t":7,"e":"div","a":{"class":"antenna-reaction-box"},"f":[{"t":7,"e":"div","a":{"class":"antenna-reaction-text"},"o":"sizetofit","f":[{"t":2,"r":"./text"}]}]}]}],"i":"index","r":"defaultReactions"}]}," ",{"t":7,"e":"div","a":{"class":"antenna-footer antenna-defaults-footer"},"f":[{"t":7,"e":"input","v":{"focus":"customfocus","keydown":"inputkeydown","blur":"customblur"},"a":{"value":"+ Add Your Own","maxlength":"25"}}," ",{"t":7,"e":"button","v":{"click":"addcustom"},"f":["ok"]}]}]}]}
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/templates/locations-page.hbs.html":[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna-page antenna-locations-page"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-body"},"f":[{"t":7,"e":"div","v":{"click":"closewindow"},"a":{"class":"antenna-locations-close"},"f":["Close X"]}," ",{"t":7,"e":"table","a":{"class":"antenna-locations-table"},"f":[{"t":4,"f":[{"t":7,"e":"tr","a":{"class":"antenna-locations-content-row"},"f":[{"t":7,"e":"td","a":{"class":"antenna-locations-count-cell"},"f":[{"t":3,"x":{"r":["contentCountLabel","pageReactionCount"],"s":"_0(_1)"}}]}," ",{"t":7,"e":"td","a":{"class":"antenna-locations-page-body"},"f":["To this whole page."]}]}],"n":50,"r":"pageReactionCount"}," ",{"t":4,"f":[{"t":4,"f":[" ",{"t":7,"e":"tr","v":{"click":"reveal"},"a":{"class":["antenna-locations-content-row ",{"t":4,"f":["antenna-locate"],"n":50,"x":{"r":["canLocate","./containerHash"],"s":"_0(_1)"}}]},"f":[{"t":7,"e":"td","a":{"class":"antenna-locations-count-cell"},"f":[{"t":3,"x":{"r":["contentCountLabel","./count"],"s":"_0(_1)"}}]}," ",{"t":4,"f":[{"t":7,"e":"td","a":{"class":"antenna-locations-text-body"},"f":[{"t":2,"r":"./body"}]}],"n":50,"x":{"r":["./kind"],"s":"_0===\"txt\""}},{"t":4,"n":51,"f":[{"t":4,"n":50,"x":{"r":["./kind"],"s":"_0===\"img\""},"f":[{"t":7,"e":"td","a":{"class":"antenna-locations-image-body"},"f":[{"t":7,"e":"img","a":{"src":[{"t":2,"r":"./body"}]}}]}]},{"t":4,"n":50,"x":{"r":["./kind"],"s":"!(_0===\"img\")"},"f":[" ",{"t":7,"e":"td","a":{"class":"antenna-locations-body-cell"},"f":["TODO: ",{"t":2,"r":"./kind"}]}]}],"x":{"r":["./kind"],"s":"_0===\"txt\""}}]}],"n":50,"x":{"r":["./kind"],"s":"_0!==\"pag\""}}],"i":"id","r":"locationData"}]}]}]}]}
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/templates/logo-svg.hbs.html":[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"span","a":{"class":"antenna-logo"},"f":[{"t":7,"e":"svg","f":[{"t":7,"e":"use","a":{"class":"antenna-logo-path","xlink:href":"#antenna-svg-logo"}}]}]}]}
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/templates/media-indicator-widget.hbs.html":[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"span","a":{"class":"antenna antenna-media-indicator-wrapper"},"f":[{"t":7,"e":"span","o":"cssreset","a":{"class":["antenna antenna-media-indicator-widget ",{"t":4,"f":["notloaded"],"n":51,"r":"containerData.loaded"}," ",{"t":4,"f":["hasreactions"],"n":50,"x":{"r":["containerData.reactionTotal"],"s":"_0>0"}}]},"m":[{"t":2,"r":"extraAttributes"}],"f":[{"t":8,"r":"logo"}," ",{"t":4,"f":[{"t":7,"e":"span","a":{"class":"antenna-reaction-total"},"f":[{"t":2,"r":"containerData.reactionTotal"}]}],"n":50,"r":"containerData.reactionTotal"},{"t":4,"n":51,"f":[{"t":7,"e":"span","a":{"class":"antenna-reaction-prompt"},"f":["What do you think?"]}],"r":"containerData.reactionTotal"}]}]}]}
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/templates/popup-widget.hbs.html":[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna-popup"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-popup-body"},"f":[{"t":8,"r":"logo"}," ",{"t":7,"e":"span","a":{"class":"antenna-popup-text"},"f":["What do you think?"]}]}]}]}
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/templates/reactions-page.hbs.html":[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna-page antenna-reactions-page"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-body"},"f":[{"t":4,"f":[{"t":4,"f":[{"t":7,"e":"div","v":{"click":"plusone","mouseenter":"highlight","mouseleave":"clearhighlights"},"a":{"class":["antenna-reaction ",{"t":2,"x":{"r":["reactionsLayoutClass","index","./count"],"s":"_0(_1,_2)"}}],"style":["background-color:",{"t":2,"x":{"r":["reactionsBackgroundColor","index"],"s":"_0(_1)"}}]},"f":[" ",{"t":7,"e":"div","a":{"class":"antenna-reaction-box"},"f":[{"t":7,"e":"div","a":{"class":"antenna-reaction-text"},"o":"sizetofit","f":[{"t":2,"r":"./text"}]}," ",{"t":7,"e":"div","a":{"class":"antenna-reaction-count"},"f":[{"t":2,"r":"./count"}]}," ",{"t":7,"e":"div","a":{"class":"antenna-plusone"},"f":["+1"]}," ",{"t":4,"f":[{"t":7,"e":"div","v":{"click":"showlocations"},"a":{"class":"antenna-reaction-location"},"f":[{"t":8,"r":"locationIcon"}]}],"n":50,"r":"isSummary"},{"t":4,"n":51,"f":[{"t":4,"f":[{"t":7,"e":"div","v":{"click":"showcomments"},"a":{"class":"antenna-reaction-comments hascomments"},"f":[{"t":8,"r":"commentsIcon"}," ",{"t":2,"r":"./commentCount"}]}],"n":50,"r":"./commentCount"},{"t":4,"n":51,"f":[{"t":7,"e":"div","a":{"class":"antenna-reaction-comments"},"f":[{"t":8,"r":"commentsIcon"}]}],"r":"./commentCount"}],"r":"isSummary"}]}]}],"i":"index","r":"reactions"}],"n":50,"r":"reactions"}]}," ",{"t":7,"e":"div","a":{"class":"antenna-footer antenna-reactions-footer"},"f":[{"t":4,"f":[{"t":7,"e":"span","v":{"click":"showdefault"},"a":{"class":"antenna-think"},"f":["What do you think?"]}],"n":50,"r":"reactions"},{"t":4,"n":51,"f":[{"t":7,"e":"span","a":{"class":"antenna-no-reactions"},"f":["No reactions yet!"]}],"r":"reactions"}]}]}]}
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/templates/reactions-widget.hbs.html":[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna antenna-reactions-widget","tabindex":"0"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-header"},"f":[{"t":8,"r":"logo"}," ",{"t":7,"e":"span","a":{"class":"antenna-reactions-title"},"f":["Reactions"]}]}," ",{"t":7,"e":"div","a":{"class":"antenna-page-container"},"f":[" ",{"t":7,"e":"div","a":{"class":"antenna-progress-page antenna-page"},"f":[{"t":7,"e":"div","a":{"class":"antenna-body"}}]}]}]}]}
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/templates/summary-widget.hbs.html":[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":["antenna ant-summary-widget ",{"t":4,"f":["notloaded"],"n":51,"r":"summaryLoaded"}]},"o":"cssreset","f":[{"t":7,"e":"a","a":{"href":"http://www.antenna.is","target":"_blank"},"f":[{"t":8,"r":"logo"}]}," ",{"t":4,"f":[{"t":2,"r":"summaryTotal"}],"n":50,"x":{"r":["summaryTotal"],"s":"_0>0"}}," Reactions"]}]}
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/templates/svg-comments.hbs.html":[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"span","a":{"class":"antenna-comments"},"f":[{"t":7,"e":"svg","f":[{"t":7,"e":"use","a":{"class":"antenna-comments-path","xlink:href":"#antenna-svg-comment"}}]}]}]}
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/templates/svg-facebook.hbs.html":[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"span","a":{"class":"antenna-facebook"},"f":[{"t":7,"e":"svg","f":[{"t":7,"e":"use","a":{"class":"antenna-facebook-path","xlink:href":"#antenna-svg-facebook"}}]}]}]}
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/templates/svg-location.hbs.html":[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"span","a":{"class":"antenna-location"},"f":[{"t":7,"e":"svg","f":[{"t":7,"e":"use","a":{"class":"antenna-location-path","xlink:href":"#antenna-svg-search"}}]}]}]}
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/templates/svg-twitter.hbs.html":[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"span","a":{"class":"antenna-twitter"},"f":[{"t":7,"e":"svg","f":[{"t":7,"e":"use","a":{"class":"antenna-twitter-path","xlink:href":"#antenna-svg-twitter"}}]}]}]}
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/templates/svgs.hbs.html":[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"svg","a":{"xmlns":"http://www.w3.org/2000/svg","style":"display: none;"},"f":[{"t":7,"e":"symbol","a":{"id":"antenna-svg-twitter","viewBox":"0 0 512 512"},"f":[{"t":7,"e":"path","a":{"d":"m453 134c-14 6-30 11-46 12c16-10 29-25 35-44c-15 9-33 16-51 19c-15-15-36-25-59-25c-45 0-81 36-81 81c0 6 1 12 2 18c-67-3-127-35-167-84c-7 12-11 25-11 40c0 28 15 53 36 68c-13-1-25-4-36-11c0 1 0 1 0 2c0 39 28 71 65 79c-7 2-14 3-22 3c-5 0-10-1-15-2c10 32 40 56 76 56c-28 22-63 35-101 35c-6 0-13 0-19-1c36 23 78 36 124 36c149 0 230-123 230-230c0-3 0-7 0-10c16-12 29-26 40-42z"}}]}," ",{"t":7,"e":"symbol","a":{"id":"antenna-svg-facebook","viewBox":"0 0 512 512"},"f":[{"t":7,"e":"path","a":{"d":"m420 72l-328 0c-11 0-20 9-20 20l0 328c0 11 9 20 20 20l177 0l0-142l-48 0l0-56l48 0l0-41c0-48 29-74 71-74c20 0 38 2 43 3l0 49l-29 0c-23 0-28 11-28 27l0 36l55 0l-7 56l-48 0l0 142l94 0c11 0 20-9 20-20l0-328c0-11-9-20-20-20z"}}]}," ",{"t":7,"e":"symbol","a":{"id":"antenna-svg-comment","viewBox":"0 0 512 512"},"f":[{"t":7,"e":"path","a":{"d":"m512 256c0 33-11 64-34 92c-23 28-54 50-93 66c-40 17-83 25-129 25c-13 0-27-1-41-2c-38 33-82 56-132 69c-9 2-20 4-32 6c-4 0-7 0-9-3c-3-2-4-4-5-8l0 0c-1-1-1-2 0-4c0-1 0-2 0-2c0-1 1-2 2-3l1-3c0 0 1-1 2-2c2-2 2-3 3-3c1-1 4-5 8-10c5-5 8-8 10-10c2-3 5-6 9-12c4-5 7-10 9-14c3-5 5-10 8-17c3-7 5-14 8-22c-30-17-54-38-71-63c-17-25-26-51-26-80c0-25 7-48 20-71c14-23 32-42 55-58c23-17 50-30 82-39c31-10 64-15 99-15c46 0 89 8 129 25c39 16 70 38 93 66c23 28 34 59 34 92z"}}]}," ",{"t":7,"e":"symbol","a":{"id":"antenna-svg-search","viewBox":"0 0 512 512"},"f":[{"t":7,"e":"path","a":{"d":"m347 238c0-36-12-66-37-91c-25-25-55-37-91-37c-35 0-65 12-90 37c-25 25-38 55-38 91c0 35 13 65 38 90c25 25 55 38 90 38c36 0 66-13 91-38c25-25 37-55 37-90z m147 237c0 10-4 19-11 26c-7 7-16 11-26 11c-10 0-19-4-26-11l-98-98c-34 24-72 36-114 36c-27 0-53-5-78-16c-25-11-46-25-64-43c-18-18-32-39-43-64c-10-25-16-51-16-78c0-28 6-54 16-78c11-25 25-47 43-65c18-18 39-32 64-43c25-10 51-15 78-15c28 0 54 5 79 15c24 11 46 25 64 43c18 18 32 40 43 65c10 24 16 50 16 78c0 42-12 80-36 114l98 98c7 7 11 15 11 25z"}}]}," ",{"t":7,"e":"symbol","a":{"id":"antenna-svg-logo","viewBox":"0 0 512 512"},"f":[{"t":7,"e":"path","a":{"d":"m283 510c125-17 229-124 229-253 0-141-115-256-256-256-141 0-256 115-256 256 0 130 108 237 233 254l0-149c-48-14-84-50-84-102 0-65 43-113 108-113 65 0 107 48 107 113 0 52-33 88-81 102z"}}]}]}]}
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/templates/text-indicator-widget.hbs.html":[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"span","o":"cssreset","a":{"class":["antenna antenna-text-indicator-widget ",{"t":4,"f":["notloaded"],"n":51,"r":"containerData.loaded"}," ",{"t":4,"f":["hasreactions"],"n":50,"x":{"r":["containerData.reactionTotal"],"s":"_0>0"}}," ",{"t":4,"f":["antenna-suppress"],"n":50,"r":"containerData.suppress"}," ",{"t":2,"r":"extraClasses"}]},"f":[{"t":8,"r":"logo"}," ",{"t":4,"f":[{"t":7,"e":"span","a":{"class":"antenna-reaction-total"},"f":[{"t":2,"r":"containerData.reactionTotal"}]}],"n":50,"r":"containerData.reactionTotal"}]}]}
},{}]},{},["/Users/jburns/antenna/rb/static/widget-new/src/js/antenna-app.js","/Users/jburns/antenna/rb/static/widget-new/src/js/auto-call-to-action.js","/Users/jburns/antenna/rb/static/widget-new/src/js/call-to-action-indicator.js","/Users/jburns/antenna/rb/static/widget-new/src/js/comment-area-partial.js","/Users/jburns/antenna/rb/static/widget-new/src/js/comments-page.js","/Users/jburns/antenna/rb/static/widget-new/src/js/confirmation-page.js","/Users/jburns/antenna/rb/static/widget-new/src/js/css-loader.js","/Users/jburns/antenna/rb/static/widget-new/src/js/defaults-page.js","/Users/jburns/antenna/rb/static/widget-new/src/js/group-settings-loader.js","/Users/jburns/antenna/rb/static/widget-new/src/js/group-settings.js","/Users/jburns/antenna/rb/static/widget-new/src/js/hashed-elements.js","/Users/jburns/antenna/rb/static/widget-new/src/js/locations-page.js","/Users/jburns/antenna/rb/static/widget-new/src/js/media-indicator-widget.js","/Users/jburns/antenna/rb/static/widget-new/src/js/page-data-loader.js","/Users/jburns/antenna/rb/static/widget-new/src/js/page-data.js","/Users/jburns/antenna/rb/static/widget-new/src/js/page-scanner.js","/Users/jburns/antenna/rb/static/widget-new/src/js/popup-widget.js","/Users/jburns/antenna/rb/static/widget-new/src/js/reactions-page.js","/Users/jburns/antenna/rb/static/widget-new/src/js/reactions-widget.js","/Users/jburns/antenna/rb/static/widget-new/src/js/script-loader.js","/Users/jburns/antenna/rb/static/widget-new/src/js/summary-widget.js","/Users/jburns/antenna/rb/static/widget-new/src/js/svgs.js","/Users/jburns/antenna/rb/static/widget-new/src/js/text-indicator-widget.js","/Users/jburns/antenna/rb/static/widget-new/src/js/text-reactions.js","/Users/jburns/antenna/rb/static/widget-new/src/templates/auto-call-to-action.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/call-to-action-label.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/comment-area-partial.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/comments-page.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/confirmation-page.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/defaults-page.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/locations-page.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/logo-svg.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/media-indicator-widget.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/popup-widget.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/reactions-page.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/reactions-widget.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/summary-widget.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/svg-comments.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/svg-facebook.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/svg-location.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/svg-twitter.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/svgs.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/text-indicator-widget.hbs.html"])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvYW50ZW5uYS1hcHAuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvYXV0by1jYWxsLXRvLWFjdGlvbi5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9jYWxsLXRvLWFjdGlvbi1pbmRpY2F0b3IuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvY29tbWVudC1hcmVhLXBhcnRpYWwuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvY29tbWVudHMtcGFnZS5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9jb25maXJtYXRpb24tcGFnZS5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9jc3MtbG9hZGVyLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL2RlZmF1bHRzLXBhZ2UuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvZ3JvdXAtc2V0dGluZ3MtbG9hZGVyLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL2dyb3VwLXNldHRpbmdzLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL2hhc2hlZC1lbGVtZW50cy5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9sb2NhdGlvbnMtcGFnZS5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9tZWRpYS1pbmRpY2F0b3Itd2lkZ2V0LmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3BhZ2UtZGF0YS1sb2FkZXIuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvcGFnZS1kYXRhLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3BhZ2Utc2Nhbm5lci5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9wb3B1cC13aWRnZXQuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvcmVhY3Rpb25zLXBhZ2UuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvcmVhY3Rpb25zLXdpZGdldC5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9zY3JpcHQtbG9hZGVyLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3N1bW1hcnktd2lkZ2V0LmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3N2Z3MuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdGV4dC1pbmRpY2F0b3Itd2lkZ2V0LmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3RleHQtcmVhY3Rpb25zLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL2FqYXgtY2xpZW50LmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL2FwcC1tb2RlLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL2NhbGxiYWNrLXN1cHBvcnQuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvaGFzaC5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9qcXVlcnktcHJvdmlkZXIuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvbWQ1LmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL21vdmVhYmxlLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL211dGF0aW9uLW9ic2VydmVyLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL3BhZ2UtdXRpbHMuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvcmFjdGl2ZS1wcm92aWRlci5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9yYW5nZS5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9yYW5neS1wcm92aWRlci5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9yZWFjdGlvbnMtd2lkZ2V0LWxheW91dC11dGlscy5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy90aHJvdHRsZWQtZXZlbnRzLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL3RvdWNoLXN1cHBvcnQuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvdHJhbnNpdGlvbi11dGlsLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL3VybHMuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvdXNlci5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy93aWRnZXQtYnVja2V0LmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL3hkbS1jbGllbnQuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMveGRtLWxvYWRlci5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvYXV0by1jYWxsLXRvLWFjdGlvbi5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvY2FsbC10by1hY3Rpb24tbGFiZWwuaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL2NvbW1lbnQtYXJlYS1wYXJ0aWFsLmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9jb21tZW50cy1wYWdlLmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9jb25maXJtYXRpb24tcGFnZS5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvZGVmYXVsdHMtcGFnZS5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvbG9jYXRpb25zLXBhZ2UuaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL2xvZ28tc3ZnLmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9tZWRpYS1pbmRpY2F0b3Itd2lkZ2V0Lmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9wb3B1cC13aWRnZXQuaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL3JlYWN0aW9ucy1wYWdlLmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9yZWFjdGlvbnMtd2lkZ2V0Lmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9zdW1tYXJ5LXdpZGdldC5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvc3ZnLWNvbW1lbnRzLmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9zdmctZmFjZWJvb2suaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL3N2Zy1sb2NhdGlvbi5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvc3ZnLXR3aXR0ZXIuaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL3N2Z3MuaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL3RleHQtaW5kaWNhdG9yLXdpZGdldC5oYnMuaHRtbCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNySkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvT0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaFhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBOztBQ0FBOztBQ0FBOztBQ0FBOztBQ0FBOztBQ0FBOztBQ0FBOztBQ0FBOztBQ0FBOztBQ0FBOztBQ0FBOztBQ0FBOztBQ0FBOztBQ0FBOztBQ0FBOztBQ0FBOztBQ0FBOztBQ0FBOztBQ0FBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIlxudmFyIFNjcmlwdExvYWRlciA9IHJlcXVpcmUoJy4vc2NyaXB0LWxvYWRlcicpO1xudmFyIENzc0xvYWRlciA9IHJlcXVpcmUoJy4vY3NzLWxvYWRlcicpO1xudmFyIEdyb3VwU2V0dGluZ3NMb2FkZXIgPSByZXF1aXJlKCcuL2dyb3VwLXNldHRpbmdzLWxvYWRlcicpO1xudmFyIFBhZ2VEYXRhTG9hZGVyID0gcmVxdWlyZSgnLi9wYWdlLWRhdGEtbG9hZGVyJyk7XG52YXIgUGFnZVNjYW5uZXIgPSByZXF1aXJlKCcuL3BhZ2Utc2Nhbm5lcicpO1xudmFyIFhETUxvYWRlciA9IHJlcXVpcmUoJy4vdXRpbHMveGRtLWxvYWRlcicpO1xuXG5cbi8vIFN0ZXAgMSAtIGtpY2sgb2ZmIHRoZSBhc3luY2hyb25vdXMgbG9hZGluZyBvZiB0aGUgSmF2YXNjcmlwdCBhbmQgQ1NTIHdlIG5lZWQuXG5TY3JpcHRMb2FkZXIubG9hZChzY3JpcHRMb2FkZWQpO1xuQ3NzTG9hZGVyLmxvYWQoKTtcblxuZnVuY3Rpb24gc2NyaXB0TG9hZGVkKCkge1xuICAgIC8vIFN0ZXAgMiAtIE9uY2Ugd2UgaGF2ZSBvdXIgcmVxdWlyZWQgc2NyaXB0cywgZmV0Y2ggdGhlIGdyb3VwIHNldHRpbmdzIGZyb20gdGhlIHNlcnZlclxuICAgIEdyb3VwU2V0dGluZ3NMb2FkZXIubG9hZChmdW5jdGlvbihncm91cFNldHRpbmdzKSB7XG4gICAgICAgIC8vIFN0ZXAgMyAtIE9uY2Ugd2UgaGF2ZSB0aGUgc2V0dGluZ3MsIHdlIGNhbiBraWNrIG9mZiBhIGNvdXBsZSB0aGluZ3MgaW4gcGFyYWxsZWw6XG4gICAgICAgIC8vXG4gICAgICAgIC8vIC0tIGNyZWF0ZSB0aGUgaGlkZGVuIGlmcmFtZSB3ZSB1c2UgZm9yIGNyb3NzLWRvbWFpbiBjb29raWVzIChwcmltYXJpbHkgdXNlciBsb2dpbilcbiAgICAgICAgLy8gLS0gc3RhcnQgZmV0Y2hpbmcgdGhlIHBhZ2UgZGF0YVxuICAgICAgICAvLyAtLSBzdGFydCBoYXNoaW5nIHRoZSBwYWdlIGFuZCBpbnNlcnRpbmcgdGhlIGFmZm9yZGFuY2VzIChpbiB0aGUgZW1wdHkgc3RhdGUpXG4gICAgICAgIC8vXG4gICAgICAgIC8vIEFzIHRoZSBwYWdlIGlzIHNjYW5uZWQsIHRoZSB3aWRnZXRzIGFyZSBjcmVhdGVkIGFuZCBib3VuZCB0byB0aGUgcGFnZSBkYXRhIHRoYXQgY29tZXMgaW4uXG4gICAgICAgIGluaXRYZG1GcmFtZShncm91cFNldHRpbmdzKTtcbiAgICAgICAgZmV0Y2hQYWdlRGF0YShncm91cFNldHRpbmdzKTtcbiAgICAgICAgc2NhblBhZ2UoZ3JvdXBTZXR0aW5ncyk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGluaXRYZG1GcmFtZShncm91cFNldHRpbmdzKSB7XG4gICAgWERNTG9hZGVyLmNyZWF0ZVhETWZyYW1lKGdyb3VwU2V0dGluZ3MuZ3JvdXBJZCk7XG59XG5cbmZ1bmN0aW9uIGZldGNoUGFnZURhdGEoZ3JvdXBTZXR0aW5ncykge1xuICAgIFBhZ2VEYXRhTG9hZGVyLmxvYWQoZ3JvdXBTZXR0aW5ncyk7XG59XG5cbmZ1bmN0aW9uIHNjYW5QYWdlKGdyb3VwU2V0dGluZ3MpIHtcbiAgICBQYWdlU2Nhbm5lci5zY2FuKGdyb3VwU2V0dGluZ3MpO1xufSIsInZhciAkOyByZXF1aXJlKCcuL3V0aWxzL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIFJhY3RpdmU7IHJlcXVpcmUoJy4vdXRpbHMvcmFjdGl2ZS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihsb2FkZWRSYWN0aXZlKSB7IFJhY3RpdmU9bG9hZGVkUmFjdGl2ZTsgfSk7XG5cbmZ1bmN0aW9uIGNyZWF0ZUNhbGxUb0FjdGlvbihhbnRJdGVtSWQpIHtcbiAgICB2YXIgcmFjdGl2ZSA9IFJhY3RpdmUoe1xuICAgICAgICBlbDogJCgnZGl2JyksXG4gICAgICAgIGRhdGE6IHsgYW50SXRlbUlkOiBhbnRJdGVtSWQgfSxcbiAgICAgICAgdGVtcGxhdGU6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9hdXRvLWNhbGwtdG8tYWN0aW9uLmhicy5odG1sJyksXG4gICAgICAgIHBhcnRpYWxzOiB7XG4gICAgICAgICAgICBsb2dvOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvbG9nby1zdmcuaGJzLmh0bWwnKVxuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuICQocmFjdGl2ZS5maW5kKCcuYW50ZW5uYS1hdXRvLWN0YScpKTtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZTogY3JlYXRlQ2FsbFRvQWN0aW9uXG59OyIsInZhciAkOyByZXF1aXJlKCcuL3V0aWxzL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIFJhY3RpdmU7IHJlcXVpcmUoJy4vdXRpbHMvcmFjdGl2ZS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihsb2FkZWRSYWN0aXZlKSB7IFJhY3RpdmU9bG9hZGVkUmFjdGl2ZTsgfSk7XG52YXIgUmVhY3Rpb25zV2lkZ2V0ID0gcmVxdWlyZSgnLi9yZWFjdGlvbnMtd2lkZ2V0Jyk7XG5cblxuZnVuY3Rpb24gY3JlYXRlSW5kaWNhdG9yV2lkZ2V0KG9wdGlvbnMpIHtcbiAgICB2YXIgY29udGFpbmVyRGF0YSA9IG9wdGlvbnMuY29udGFpbmVyRGF0YTtcbiAgICB2YXIgJGNvbnRhaW5lckVsZW1lbnQgPSBvcHRpb25zLmNvbnRhaW5lckVsZW1lbnQ7XG4gICAgdmFyIGNvbnRlbnREYXRhID0gb3B0aW9ucy5jb250ZW50RGF0YTtcbiAgICB2YXIgJGN0YUVsZW1lbnQgPSBvcHRpb25zLmN0YUVsZW1lbnQ7XG4gICAgdmFyICRjdGFMYWJlbCA9IG9wdGlvbnMuY3RhTGFiZWw7IC8vIG9wdGlvbmFsXG4gICAgdmFyIHBhZ2VEYXRhID0gb3B0aW9ucy5wYWdlRGF0YTtcbiAgICB2YXIgZ3JvdXBTZXR0aW5ncyA9IG9wdGlvbnMuZ3JvdXBTZXR0aW5ncztcbiAgICB2YXIgZGVmYXVsdFJlYWN0aW9ucyA9IG9wdGlvbnMuZGVmYXVsdFJlYWN0aW9ucztcblxuICAgIHZhciByZWFjdGlvbldpZGdldE9wdGlvbnMgPSB7XG4gICAgICAgIHJlYWN0aW9uc0RhdGE6IGNvbnRhaW5lckRhdGEucmVhY3Rpb25zLFxuICAgICAgICBjb250YWluZXJEYXRhOiBjb250YWluZXJEYXRhLFxuICAgICAgICBjb250YWluZXJFbGVtZW50OiAkY29udGFpbmVyRWxlbWVudCxcbiAgICAgICAgY29udGVudERhdGE6IGNvbnRlbnREYXRhLFxuICAgICAgICBkZWZhdWx0UmVhY3Rpb25zOiBkZWZhdWx0UmVhY3Rpb25zLFxuICAgICAgICBzdGFydFBhZ2U6IGNvbXB1dGVTdGFydFBhZ2UoJGN0YUVsZW1lbnQpLFxuICAgICAgICBwYWdlRGF0YTogcGFnZURhdGEsXG4gICAgICAgIGdyb3VwU2V0dGluZ3M6IGdyb3VwU2V0dGluZ3NcbiAgICB9O1xuXG4gICAgJGN0YUVsZW1lbnQub24oJ21vdXNlZW50ZXIuYW50ZW5uYScsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGlmIChldmVudC5idXR0b25zID4gMCB8fCAoZXZlbnQuYnV0dG9ucyA9PSB1bmRlZmluZWQgJiYgZXZlbnQud2hpY2ggPiAwKSkgeyAvLyBPbiBTYWZhcmksIGV2ZW50LmJ1dHRvbnMgaXMgdW5kZWZpbmVkIGJ1dCBldmVudC53aGljaCBnaXZlcyBhIGdvb2QgdmFsdWUuIGV2ZW50LndoaWNoIGlzIGJhZCBvbiBGRlxuICAgICAgICAgICAgLy8gRG9uJ3QgcmVhY3QgaWYgdGhlIHVzZXIgaXMgZHJhZ2dpbmcgb3Igc2VsZWN0aW5nIHRleHQuXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgb3BlblJlYWN0aW9uc1dpbmRvdyhyZWFjdGlvbldpZGdldE9wdGlvbnMsICRjdGFFbGVtZW50KTtcbiAgICB9KTtcblxuICAgIGlmICgkY3RhTGFiZWwpIHtcbiAgICAgICAgLy8gVE9ETzogUmVmYWN0b3IgdGhpcyBvdXQgaW50byBhIHNlcGFyYXRlIEpTIGZpbGU/IE90aGVyd2lzZSwgaXRcbiAgICAgICAgUmFjdGl2ZSh7XG4gICAgICAgICAgICBlbDogJGN0YUxhYmVsLCAvLyBUT0RPOiByZXZpZXcgdGhlIHN0cnVjdHVyZSBvZiB0aGUgRE9NIGhlcmUuIERvIHdlIHdhbnQgdG8gcmVuZGVyIGFuIGVsZW1lbnQgaW50byAkY3RhTGFiZWwgb3IganVzdCB0ZXh0P1xuICAgICAgICAgICAgbWFnaWM6IHRydWUsXG4gICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgY29udGFpbmVyRGF0YTogY29udGFpbmVyRGF0YSxcbiAgICAgICAgICAgICAgICBjb21wdXRlTGFiZWw6IGZ1bmN0aW9uKHJlYWN0aW9uQ291bnQpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogd2hhdCBkbyB3ZSB3YW50IHRvIGRvIGZvciAwPyBTaG93IG5vdGhpbmcsIGtlZXAgdGhlIGN1cnJlbnQgXCJSZWFjdGlvbnNcIiBsYWJlbCwgb3Igc29tZXRoaW5nIGVsc2U/XG4gICAgICAgICAgICAgICAgICAgIGlmICghcmVhY3Rpb25Db3VudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwiUmVzcG9uc2VzXCI7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlYWN0aW9uQ291bnQgPT0gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwiMSBSZXNwb25zZXNcIjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVhY3Rpb25Db3VudCArIFwiIFJlc3BvbnNlc1wiO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL2NhbGwtdG8tYWN0aW9uLWxhYmVsLmhicy5odG1sJylcbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBjb21wdXRlU3RhcnRQYWdlKCRlbGVtZW50KSB7XG4gICAgdmFyIHZhbCA9ICgkZWxlbWVudC5hdHRyKCdhbnQtbW9kZScpIHx8ICcnKS50cmltKCk7XG4gICAgaWYgKHZhbCA9PT0gJ3dyaXRlJykge1xuICAgICAgICByZXR1cm4gUmVhY3Rpb25zV2lkZ2V0LlBBR0VfREVGQVVMVFM7XG4gICAgfSBlbHNlIGlmICh2YWwgPT09ICdyZWFkJykge1xuICAgICAgICByZXR1cm4gUmVhY3Rpb25zV2lkZ2V0LlBBR0VfUkVBQ1RJT05TO1xuICAgIH1cbiAgICByZXR1cm4gUmVhY3Rpb25zV2lkZ2V0LlBBR0VfQVVUTztcbn1cblxuZnVuY3Rpb24gb3BlblJlYWN0aW9uc1dpbmRvdyhyZWFjdGlvbk9wdGlvbnMsICRjdGFFbGVtZW50KSB7XG4gICAgUmVhY3Rpb25zV2lkZ2V0Lm9wZW4ocmVhY3Rpb25PcHRpb25zLCAkY3RhRWxlbWVudCk7XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGU6IGNyZWF0ZUluZGljYXRvcldpZGdldFxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi91dGlscy9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciBBamF4Q2xpZW50ID0gcmVxdWlyZSgnLi91dGlscy9hamF4LWNsaWVudCcpO1xudmFyIFVzZXIgPSByZXF1aXJlKCcuL3V0aWxzL3VzZXInKTtcblxuZnVuY3Rpb24gc2V0dXBDb21tZW50QXJlYShyZWFjdGlvblByb3ZpZGVyLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgY2FsbGJhY2ssIHJhY3RpdmUpIHtcbiAgICAkKHJhY3RpdmUuZmluZCgnLmFudGVubmEtY29tbWVudC1pbnB1dCcpKS5mb2N1cygpOyAvLyBUT0RPOiBkZWNpZGUgd2hldGhlciB3ZSByZWFsbHkgd2FudCB0byBzdGFydCB3aXRoIGZvY3VzIGluIHRoZSB0ZXh0YXJlYVxuICAgIHJhY3RpdmUub24oJ2lucHV0Y2hhbmdlZCcsIHVwZGF0ZUlucHV0Q291bnRlcihyYWN0aXZlKSk7XG4gICAgcmFjdGl2ZS5vbignYWRkY29tbWVudCcsIGFkZENvbW1lbnQocmVhY3Rpb25Qcm92aWRlciwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGNhbGxiYWNrLCByYWN0aXZlKSk7XG59XG5cbmZ1bmN0aW9uIGFkZENvbW1lbnQocmVhY3Rpb25Qcm92aWRlciwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGNhbGxiYWNrLCByYWN0aXZlKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgY29tbWVudCA9ICQocmFjdGl2ZS5maW5kKCcuYW50ZW5uYS1jb21tZW50LWlucHV0JykpLnZhbCgpLnRyaW0oKTsgLy8gVE9ETzogYWRkaXRpb25hbCB2YWxpZGF0aW9uPyBpbnB1dCBzYW5pdGl6aW5nP1xuICAgICAgICBpZiAoY29tbWVudC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAkKHJhY3RpdmUuZmluZCgnLmFudGVubmEtY29tbWVudC13aWRnZXRzJykpLmhpZGUoKTtcbiAgICAgICAgICAgICQocmFjdGl2ZS5maW5kKCcuYW50ZW5uYS1jb21tZW50LXdhaXRpbmcnKSkuZmFkZUluKCdzbG93Jyk7XG4gICAgICAgICAgICByZWFjdGlvblByb3ZpZGVyLmdldChmdW5jdGlvbiAocmVhY3Rpb24pIHtcbiAgICAgICAgICAgICAgICBBamF4Q2xpZW50LnBvc3RDb21tZW50KGNvbW1lbnQsIHJlYWN0aW9uLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgZnVuY3Rpb24gKCkgey8qVE9ETyovXG4gICAgICAgICAgICAgICAgfSwgZXJyb3IpO1xuICAgICAgICAgICAgICAgICQocmFjdGl2ZS5maW5kKCcuYW50ZW5uYS1jb21tZW50LXdhaXRpbmcnKSkuc3RvcCgpLmhpZGUoKTtcbiAgICAgICAgICAgICAgICAkKHJhY3RpdmUuZmluZCgnLmFudGVubmEtY29tbWVudC1yZWNlaXZlZCcpKS5mYWRlSW4oKTtcbiAgICAgICAgICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soY29tbWVudCwgVXNlci5vcHRpbWlzdGljVXNlcigpKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBlcnJvcihtZXNzYWdlKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFRPRE8gcmVhbCBlcnJvciBoYW5kbGluZ1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnRXJyb3IgcG9zdGluZyBjb21tZW50OiAnICsgbWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZUlucHV0Q291bnRlcihyYWN0aXZlKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHJhY3RpdmVFdmVudCkge1xuICAgICAgICB2YXIgJHRleHRhcmVhID0gJChyYWN0aXZlRXZlbnQub3JpZ2luYWwudGFyZ2V0KTtcbiAgICAgICAgdmFyIG1heCA9IHBhcnNlSW50KCR0ZXh0YXJlYS5hdHRyKCdtYXhsZW5ndGgnKSk7XG4gICAgICAgIHZhciBsZW5ndGggPSAkdGV4dGFyZWEudmFsKCkubGVuZ3RoO1xuICAgICAgICAkKHJhY3RpdmUuZmluZCgnLmFudGVubmEtY29tbWVudC1jb3VudCcpKS5odG1sKE1hdGgubWF4KDAsIG1heCAtIGxlbmd0aCkpO1xuICAgIH07XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBzZXR1cDogc2V0dXBDb21tZW50QXJlYVxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi91dGlscy9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciBSYWN0aXZlOyByZXF1aXJlKCcuL3V0aWxzL3JhY3RpdmUtcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24obG9hZGVkUmFjdGl2ZSkgeyBSYWN0aXZlID0gbG9hZGVkUmFjdGl2ZTt9KTtcbnZhciBDb21tZW50QXJlYVBhcnRpYWwgPSByZXF1aXJlKCcuL2NvbW1lbnQtYXJlYS1wYXJ0aWFsJyk7XG5cbnZhciBwYWdlU2VsZWN0b3IgPSAnLmFudGVubmEtY29tbWVudHMtcGFnZSc7XG5cbmZ1bmN0aW9uIGNyZWF0ZVBhZ2Uob3B0aW9ucykge1xuICAgIHZhciByZWFjdGlvbiA9IG9wdGlvbnMucmVhY3Rpb247XG4gICAgdmFyIGNvbW1lbnRzID0gb3B0aW9ucy5jb21tZW50cztcbiAgICB2YXIgZWxlbWVudCA9IG9wdGlvbnMuZWxlbWVudDtcbiAgICB2YXIgY29udGFpbmVyRGF0YSA9IG9wdGlvbnMuY29udGFpbmVyRGF0YTtcbiAgICB2YXIgcGFnZURhdGEgPSBvcHRpb25zLnBhZ2VEYXRhO1xuICAgIHZhciBjbG9zZVdpbmRvdyA9IG9wdGlvbnMuY2xvc2VXaW5kb3c7XG4gICAgdmFyIHJhY3RpdmUgPSBSYWN0aXZlKHtcbiAgICAgICAgZWw6IGVsZW1lbnQsXG4gICAgICAgIGFwcGVuZDogdHJ1ZSxcbiAgICAgICAgbWFnaWM6IHRydWUsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIHJlYWN0aW9uOiByZWFjdGlvbixcbiAgICAgICAgICAgIGNvbW1lbnRzOiBjb21tZW50c1xuICAgICAgICB9LFxuICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL2NvbW1lbnRzLXBhZ2UuaGJzLmh0bWwnKSxcbiAgICAgICAgcGFydGlhbHM6IHtcbiAgICAgICAgICAgIGNvbW1lbnRBcmVhOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvY29tbWVudC1hcmVhLXBhcnRpYWwuaGJzLmh0bWwnKVxuICAgICAgICB9XG4gICAgfSk7XG4gICAgdmFyIHJlYWN0aW9uUHJvdmlkZXIgPSB7IC8vIHRoaXMgcmVhY3Rpb24gcHJvdmlkZXIgaXMgYSBuby1icmFpbmVyIGJlY2F1c2Ugd2UgYWxyZWFkeSBoYXZlIGEgdmFsaWQgcmVhY3Rpb24gKG9uZSB3aXRoIGFuIElEKVxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhyZWFjdGlvbik7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIENvbW1lbnRBcmVhUGFydGlhbC5zZXR1cChyZWFjdGlvblByb3ZpZGVyLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgY29tbWVudEFkZGVkLCByYWN0aXZlKTtcbiAgICByYWN0aXZlLm9uKCdjbG9zZXdpbmRvdycsIGNsb3NlV2luZG93KTtcbiAgICByZXR1cm4ge1xuICAgICAgICBzZWxlY3RvcjogcGFnZVNlbGVjdG9yLFxuICAgICAgICB0ZWFyZG93bjogZnVuY3Rpb24oKSB7IHJhY3RpdmUudGVhcmRvd24oKTsgfVxuICAgIH07XG5cbiAgICBmdW5jdGlvbiBjb21tZW50QWRkZWQoY29tbWVudCwgdXNlcikge1xuICAgICAgICBjb21tZW50cy51bnNoaWZ0KHsgdGV4dDogY29tbWVudCwgdXNlcjogdXNlciwgbmV3OiB0cnVlIH0pO1xuICAgICAgICAkKHJhY3RpdmUuZmluZCgnLmFudGVubmEtYm9keScpKS5hbmltYXRlKHtzY3JvbGxUb3A6IDB9KTtcbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZTogY3JlYXRlUGFnZVxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi91dGlscy9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciBSYWN0aXZlOyByZXF1aXJlKCcuL3V0aWxzL3JhY3RpdmUtcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24obG9hZGVkUmFjdGl2ZSkgeyBSYWN0aXZlID0gbG9hZGVkUmFjdGl2ZTt9KTtcbnZhciBDb21tZW50QXJlYVBhcnRpYWwgPSByZXF1aXJlKCcuL2NvbW1lbnQtYXJlYS1wYXJ0aWFsJyk7XG52YXIgU1ZHcyA9IHJlcXVpcmUoJy4vc3ZncycpO1xuXG52YXIgcGFnZVNlbGVjdG9yID0gJy5hbnRlbm5hLWNvbmZpcm1hdGlvbi1wYWdlJztcblxuZnVuY3Rpb24gY3JlYXRlUGFnZShyZWFjdGlvblRleHQsIHJlYWN0aW9uUHJvdmlkZXIsIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBlbGVtZW50KSB7XG4gICAgdmFyIHJhY3RpdmUgPSBSYWN0aXZlKHtcbiAgICAgICAgZWw6IGVsZW1lbnQsXG4gICAgICAgIGFwcGVuZDogdHJ1ZSxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgdGV4dDogcmVhY3Rpb25UZXh0XG4gICAgICAgIH0sXG4gICAgICAgIHRlbXBsYXRlOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvY29uZmlybWF0aW9uLXBhZ2UuaGJzLmh0bWwnKSxcbiAgICAgICAgcGFydGlhbHM6IHtcbiAgICAgICAgICAgIGNvbW1lbnRBcmVhOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvY29tbWVudC1hcmVhLXBhcnRpYWwuaGJzLmh0bWwnKSxcbiAgICAgICAgICAgIGZhY2Vib29rSWNvbjogU1ZHcy5mYWNlYm9vaygpLFxuICAgICAgICAgICAgdHdpdHRlckljb246IFNWR3MudHdpdHRlcigpXG4gICAgICAgIH1cbiAgICB9KTtcbiAgICBDb21tZW50QXJlYVBhcnRpYWwuc2V0dXAocmVhY3Rpb25Qcm92aWRlciwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIG51bGwsIHJhY3RpdmUpO1xuICAgIHJldHVybiB7XG4gICAgICAgIHNlbGVjdG9yOiBwYWdlU2VsZWN0b3IsXG4gICAgICAgIHRlYXJkb3duOiBmdW5jdGlvbigpIHsgcmFjdGl2ZS50ZWFyZG93bigpOyB9XG4gICAgfTtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZTogY3JlYXRlUGFnZVxufTsiLCJ2YXIgVVJMcyA9IHJlcXVpcmUoJy4vdXRpbHMvdXJscycpO1xudmFyIGJhc2VVcmwgPSBVUkxzLmFudGVubmFIb21lKCk7XG5cbmZ1bmN0aW9uIGxvYWRDc3MoKSB7XG4gICAgdmFyIGhlYWQgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaGVhZCcpWzBdO1xuICAgIGlmIChoZWFkKSB7XG4gICAgICAgIC8vIFRvIG1ha2Ugc3VyZSBub25lIG9mIG91ciBjb250ZW50IHJlbmRlcnMgb24gdGhlIHBhZ2UgYmVmb3JlIG91ciBDU1MgaXMgbG9hZGVkLCB3ZSBhcHBlbmQgYSBzaW1wbGUgaW5saW5lIHN0eWxlXG4gICAgICAgIC8vIGVsZW1lbnQgdGhhdCB0dXJucyBvZmYgb3VyIGVsZW1lbnRzICpiZWZvcmUqIG91ciBDU1MgbGlua3MuIFRoaXMgZXhwbG9pdHMgdGhlIGNhc2NhZGUgcnVsZXMgLSBvdXIgQ1NTIGZpbGVzIGFwcGVhclxuICAgICAgICAvLyBhZnRlciB0aGUgaW5saW5lIHN0eWxlIGluIHRoZSBkb2N1bWVudCwgc28gdGhleSB0YWtlIHByZWNlZGVuY2UgKGFuZCBtYWtlIGV2ZXJ5dGhpbmcgYXBwZWFyKSBvbmNlIHRoZXkncmUgbG9hZGVkLlxuICAgICAgICB2YXIgc3R5bGVUYWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xuICAgICAgICBzdHlsZVRhZy5pbm5lckhUTUwgPSAnLmFudGVubmF7ZGlzcGxheTpub25lO30nO1xuICAgICAgICBoZWFkLmFwcGVuZENoaWxkKHN0eWxlVGFnKTtcblxuICAgICAgICB2YXIgY3NzSHJlZiA9IGJhc2VVcmwgKyAnL3N0YXRpYy93aWRnZXQtbmV3L2RlYnVnL2FudGVubmEuY3NzJzsgLy8gVE9ETyB0aGlzIG5lZWRzIGEgZmluYWwgcGF0aC4gQ0ROIGZvciBwcm9kdWN0aW9uIGFuZCBsb2NhbCBmaWxlIGZvciBkZXZlbG9wbWVudD9cbiAgICAgICAgbG9hZEZpbGUoY3NzSHJlZiwgaGVhZCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBsb2FkRmlsZShocmVmLCBoZWFkKSB7XG4gICAgdmFyIGxpbmtUYWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaW5rJyk7XG4gICAgbGlua1RhZy5zZXRBdHRyaWJ1dGUoJ2hyZWYnLCBocmVmKTtcbiAgICBsaW5rVGFnLnNldEF0dHJpYnV0ZSgncmVsJywgJ3N0eWxlc2hlZXQnKTtcbiAgICBsaW5rVGFnLnNldEF0dHJpYnV0ZSgndHlwZScsICd0ZXh0L2NzcycpO1xuICAgIGhlYWQuYXBwZW5kQ2hpbGQobGlua1RhZyk7XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBsb2FkIDogbG9hZENzc1xufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi91dGlscy9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciBBamF4Q2xpZW50ID0gcmVxdWlyZSgnLi91dGlscy9hamF4LWNsaWVudCcpO1xudmFyIFJhY3RpdmU7IHJlcXVpcmUoJy4vdXRpbHMvcmFjdGl2ZS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihsb2FkZWRSYWN0aXZlKSB7IFJhY3RpdmUgPSBsb2FkZWRSYWN0aXZlO30pO1xudmFyIFJlYWN0aW9uc1dpZGdldExheW91dFV0aWxzID0gcmVxdWlyZSgnLi91dGlscy9yZWFjdGlvbnMtd2lkZ2V0LWxheW91dC11dGlscycpO1xuXG52YXIgcGFnZVNlbGVjdG9yID0gJy5hbnRlbm5hLWRlZmF1bHRzLXBhZ2UnO1xuXG5mdW5jdGlvbiBjcmVhdGVQYWdlKG9wdGlvbnMpIHtcbiAgICB2YXIgZGVmYXVsdFJlYWN0aW9ucyA9IG9wdGlvbnMuZGVmYXVsdFJlYWN0aW9ucztcbiAgICB2YXIgY29udGFpbmVyRGF0YSA9IG9wdGlvbnMuY29udGFpbmVyRGF0YTtcbiAgICB2YXIgcGFnZURhdGEgPSBvcHRpb25zLnBhZ2VEYXRhO1xuICAgIHZhciBjb250ZW50RGF0YSA9IG9wdGlvbnMuY29udGVudERhdGE7XG4gICAgdmFyIHNob3dDb25maXJtYXRpb24gPSBvcHRpb25zLnNob3dDb25maXJtYXRpb247XG4gICAgdmFyIGVsZW1lbnQgPSBvcHRpb25zLmVsZW1lbnQ7XG4gICAgdmFyIGNvbG9ycyA9IG9wdGlvbnMuY29sb3JzO1xuICAgIHZhciBkZWZhdWx0TGF5b3V0RGF0YSA9IFJlYWN0aW9uc1dpZGdldExheW91dFV0aWxzLmNvbXB1dGVMYXlvdXREYXRhKGRlZmF1bHRSZWFjdGlvbnMsIGNvbG9ycyk7XG4gICAgdmFyIHJhY3RpdmUgPSBSYWN0aXZlKHtcbiAgICAgICAgZWw6IGVsZW1lbnQsXG4gICAgICAgIGFwcGVuZDogdHJ1ZSxcbiAgICAgICAgdGVtcGxhdGU6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9kZWZhdWx0cy1wYWdlLmhicy5odG1sJyksXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIGRlZmF1bHRSZWFjdGlvbnM6IGRlZmF1bHRSZWFjdGlvbnMsXG4gICAgICAgICAgICBkZWZhdWx0TGF5b3V0Q2xhc3M6IGFycmF5QWNjZXNzb3IoZGVmYXVsdExheW91dERhdGEubGF5b3V0Q2xhc3NlcyksXG4gICAgICAgICAgICBkZWZhdWx0QmFja2dyb3VuZENvbG9yOiBhcnJheUFjY2Vzc29yKGRlZmF1bHRMYXlvdXREYXRhLmJhY2tncm91bmRDb2xvcnMpXG4gICAgICAgIH0sXG4gICAgICAgIGRlY29yYXRvcnM6IHtcbiAgICAgICAgICAgIHNpemV0b2ZpdDogUmVhY3Rpb25zV2lkZ2V0TGF5b3V0VXRpbHMuc2l6ZVRvRml0XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIHJhY3RpdmUub24oJ25ld3JlYWN0aW9uJywgbmV3RGVmYXVsdFJlYWN0aW9uKTtcbiAgICByYWN0aXZlLm9uKCdjdXN0b21mb2N1cycsIGN1c3RvbVJlYWN0aW9uRm9jdXMpO1xuICAgIHJhY3RpdmUub24oJ2N1c3RvbWJsdXInLCBjdXN0b21SZWFjdGlvbkJsdXIpO1xuICAgIHJhY3RpdmUub24oJ2FkZGN1c3RvbScsIHN1Ym1pdEN1c3RvbVJlYWN0aW9uKTtcbiAgICByYWN0aXZlLm9uKCdwYWdla2V5ZG93bicsIGtleWJvYXJkSW5wdXQpO1xuICAgIHJhY3RpdmUub24oJ2lucHV0a2V5ZG93bicsIGN1c3RvbVJlYWN0aW9uSW5wdXQpO1xuXG4gICAgJChyb290RWxlbWVudChyYWN0aXZlKSkuZm9jdXMoKTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIHNlbGVjdG9yOiBwYWdlU2VsZWN0b3IsXG4gICAgICAgIHRlYXJkb3duOiBmdW5jdGlvbigpIHsgcmFjdGl2ZS50ZWFyZG93bigpOyB9XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIGN1c3RvbVJlYWN0aW9uSW5wdXQocmFjdGl2ZUV2ZW50KSB7XG4gICAgICAgIHZhciBldmVudCA9IHJhY3RpdmVFdmVudC5vcmlnaW5hbDtcbiAgICAgICAgdmFyIGtleSA9IChldmVudC53aGljaCAhPT0gdW5kZWZpbmVkKSA/IGV2ZW50LndoaWNoIDogZXZlbnQua2V5Q29kZTtcbiAgICAgICAgaWYgKGtleSA9PSAxMykgeyAvLyBFbnRlclxuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHsgLy8gbGV0IHRoZSBwcm9jZXNzaW5nIG9mIHRoZSBrZXlib2FyZCBldmVudCBmaW5pc2ggYmVmb3JlIHdlIHNob3cgdGhlIHBhZ2UgKG90aGVyd2lzZSwgdGhlIGNvbmZpcm1hdGlvbiBwYWdlIGFsc28gcmVjZWl2ZXMgdGhlIGtleXN0cm9rZSlcbiAgICAgICAgICAgICAgICBzdWJtaXRDdXN0b21SZWFjdGlvbigpO1xuICAgICAgICAgICAgfSwgMCk7XG4gICAgICAgIH0gZWxzZSBpZiAoa2V5ID09IDI3KSB7IC8vIEVzY2FwZVxuICAgICAgICAgICAgJChldmVudC50YXJnZXQpLnZhbCgnJyk7XG4gICAgICAgICAgICAkKHJvb3RFbGVtZW50KHJhY3RpdmUpKS5mb2N1cygpO1xuICAgICAgICB9XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG5ld0RlZmF1bHRSZWFjdGlvbihyYWN0aXZlRXZlbnQpIHtcbiAgICAgICAgdmFyIGRlZmF1bHRSZWFjdGlvbkRhdGEgPSByYWN0aXZlRXZlbnQuY29udGV4dDtcbiAgICAgICAgdmFyIHJlYWN0aW9uUHJvdmlkZXIgPSBjcmVhdGVSZWFjdGlvblByb3ZpZGVyKCk7XG4gICAgICAgIHNob3dDb25maXJtYXRpb24oZGVmYXVsdFJlYWN0aW9uRGF0YSwgcmVhY3Rpb25Qcm92aWRlcik7XG4gICAgICAgIEFqYXhDbGllbnQucG9zdE5ld1JlYWN0aW9uKGRlZmF1bHRSZWFjdGlvbkRhdGEsIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBjb250ZW50RGF0YSwgcmVhY3Rpb25Qcm92aWRlci5yZWFjdGlvbkxvYWRlZCwgZXJyb3IpO1xuXG4gICAgICAgIGZ1bmN0aW9uIGVycm9yKG1lc3NhZ2UpIHtcbiAgICAgICAgICAgIC8vIFRPRE8gaGFuZGxlIGFueSBlcnJvcnMgdGhhdCBvY2N1ciBwb3N0aW5nIGEgcmVhY3Rpb25cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiZXJyb3IgcG9zdGluZyBuZXcgcmVhY3Rpb246IFwiICsgbWVzc2FnZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzdWJtaXRDdXN0b21SZWFjdGlvbigpIHtcbiAgICAgICAgdmFyIGJvZHkgPSAkKHJhY3RpdmUuZmluZCgnLmFudGVubmEtZGVmYXVsdHMtZm9vdGVyIGlucHV0JykpLnZhbCgpLnRyaW0oKTtcbiAgICAgICAgaWYgKGJvZHkgIT09ICcnKSB7XG4gICAgICAgICAgICB2YXIgcmVhY3Rpb25EYXRhID0geyB0ZXh0OiBib2R5IH07XG4gICAgICAgICAgICB2YXIgcmVhY3Rpb25Qcm92aWRlciA9IGNyZWF0ZVJlYWN0aW9uUHJvdmlkZXIoKTtcbiAgICAgICAgICAgIHNob3dDb25maXJtYXRpb24ocmVhY3Rpb25EYXRhLCByZWFjdGlvblByb3ZpZGVyKTtcbiAgICAgICAgICAgIEFqYXhDbGllbnQucG9zdE5ld1JlYWN0aW9uKHJlYWN0aW9uRGF0YSwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGNvbnRlbnREYXRhLCByZWFjdGlvblByb3ZpZGVyLnJlYWN0aW9uTG9hZGVkLCBlcnJvcik7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBlcnJvcihtZXNzYWdlKSB7XG4gICAgICAgICAgICAvLyBUT0RPIGhhbmRsZSBhbnkgZXJyb3JzIHRoYXQgb2NjdXIgcG9zdGluZyBhIHJlYWN0aW9uXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcImVycm9yIHBvc3RpbmcgbmV3IHJlYWN0aW9uOiBcIiArIG1lc3NhZ2UpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24ga2V5Ym9hcmRJbnB1dChyYWN0aXZlRXZlbnQpIHtcbiAgICAgICAgaWYgKCQocm9vdEVsZW1lbnQocmFjdGl2ZSkpLmhhc0NsYXNzKCdhbnRlbm5hLXBhZ2UtYWN0aXZlJykpIHsgLy8gb25seSBoYW5kbGUgaW5wdXQgd2hlbiB0aGlzIHBhZ2UgaXMgYWN0aXZlXG4gICAgICAgICAgICAkKHJvb3RFbGVtZW50KHJhY3RpdmUpKS5maW5kKCcuYW50ZW5uYS1kZWZhdWx0cy1mb290ZXIgaW5wdXQnKS5mb2N1cygpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiByb290RWxlbWVudChyYWN0aXZlKSB7XG4gICAgcmV0dXJuIHJhY3RpdmUuZmluZChwYWdlU2VsZWN0b3IpO1xufVxuXG5mdW5jdGlvbiBhcnJheUFjY2Vzc29yKGFycmF5KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKGluZGV4KSB7XG4gICAgICAgIHJldHVybiBhcnJheVtpbmRleF07XG4gICAgfVxufVxuXG5mdW5jdGlvbiBjdXN0b21SZWFjdGlvbkZvY3VzKHJhY3RpdmVFdmVudCkge1xuICAgIHZhciAkZm9vdGVyID0gJChyYWN0aXZlRXZlbnQub3JpZ2luYWwudGFyZ2V0KS5jbG9zZXN0KCcuYW50ZW5uYS1kZWZhdWx0cy1mb290ZXInKTtcbiAgICAkZm9vdGVyLmZpbmQoJ2lucHV0Jykubm90KCcuYWN0aXZlJykudmFsKCcnKS5hZGRDbGFzcygnYWN0aXZlJyk7XG4gICAgJGZvb3Rlci5maW5kKCdidXR0b24nKS5zaG93KCk7XG59XG5cbmZ1bmN0aW9uIGN1c3RvbVJlYWN0aW9uQmx1cihyYWN0aXZlRXZlbnQpIHtcbiAgICB2YXIgZXZlbnQgPSByYWN0aXZlRXZlbnQub3JpZ2luYWw7XG4gICAgaWYgKCQoZXZlbnQucmVsYXRlZFRhcmdldCkuY2xvc2VzdCgnLmFudGVubmEtZGVmYXVsdHMtZm9vdGVyIGJ1dHRvbicpLnNpemUoKSA9PSAwKSB7IC8vIERvbid0IGhpZGUgdGhlIGlucHV0IHdoZW4gd2UgY2xpY2sgb24gdGhlIGJ1dHRvblxuICAgICAgICB2YXIgJGZvb3RlciA9ICQoZXZlbnQudGFyZ2V0KS5jbG9zZXN0KCcuYW50ZW5uYS1kZWZhdWx0cy1mb290ZXInKTtcbiAgICAgICAgdmFyIGlucHV0ID0gJGZvb3Rlci5maW5kKCdpbnB1dCcpO1xuICAgICAgICBpZiAoaW5wdXQudmFsKCkgPT09ICcnKSB7XG4gICAgICAgICAgICAkZm9vdGVyLmZpbmQoJ2J1dHRvbicpLmhpZGUoKTtcbiAgICAgICAgICAgICRmb290ZXIuZmluZCgnaW5wdXQnKS52YWwoJysgQWRkIFlvdXIgT3duJykucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBjcmVhdGVSZWFjdGlvblByb3ZpZGVyKCkge1xuXG4gICAgdmFyIGxvYWRlZFJlYWN0aW9uO1xuICAgIHZhciBjYWxsYmFja3MgPSBbXTtcblxuICAgIGZ1bmN0aW9uIG9uUmVhY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgY2FsbGJhY2tzLnB1c2goY2FsbGJhY2spO1xuICAgICAgICBub3RpZnlJZlJlYWR5KCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcmVhY3Rpb25Mb2FkZWQocmVhY3Rpb24pIHtcbiAgICAgICAgbG9hZGVkUmVhY3Rpb24gPSByZWFjdGlvbjtcbiAgICAgICAgbm90aWZ5SWZSZWFkeSgpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG5vdGlmeUlmUmVhZHkoKSB7XG4gICAgICAgIGlmIChsb2FkZWRSZWFjdGlvbikge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjYWxsYmFja3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFja3NbaV0obG9hZGVkUmVhY3Rpb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FsbGJhY2tzID0gW107XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBnZXQ6IG9uUmVhY3Rpb24sIC8vIFRPRE8gdGVybWlub2xvZ3lcbiAgICAgICAgcmVhY3Rpb25Mb2FkZWQ6IHJlYWN0aW9uTG9hZGVkXG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGU6IGNyZWF0ZVBhZ2Vcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgVVJMcyA9IHJlcXVpcmUoJy4vdXRpbHMvdXJscycpO1xudmFyIEdyb3VwU2V0dGluZ3MgPSByZXF1aXJlKCcuL2dyb3VwLXNldHRpbmdzJyk7XG5cbi8vIFRPRE8gZm9sZCB0aGlzIG1vZHVsZSBpbnRvIGdyb3VwLXNldHRpbmdzP1xuXG5mdW5jdGlvbiBsb2FkU2V0dGluZ3MoY2FsbGJhY2spIHtcbiAgICAkLmdldEpTT05QKFVSTHMuZ3JvdXBTZXR0aW5nc1VybCgpLCB7IGhvc3RfbmFtZTogd2luZG93LmFudGVubmFfaG9zdCB9LCBzdWNjZXNzLCBlcnJvcik7XG5cbiAgICBmdW5jdGlvbiBzdWNjZXNzKGpzb24pIHtcbiAgICAgICAgdmFyIGdyb3VwU2V0dGluZ3MgPSBHcm91cFNldHRpbmdzLmNyZWF0ZShqc29uKTtcbiAgICAgICAgY2FsbGJhY2soZ3JvdXBTZXR0aW5ncyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZXJyb3IobWVzc2FnZSkge1xuICAgICAgICAvLyBUT0RPIGhhbmRsZSBlcnJvcnMgdGhhdCBoYXBwZW4gd2hlbiBsb2FkaW5nIGNvbmZpZyBkYXRhXG4gICAgICAgIGNvbnNvbGUubG9nKCdBbiBlcnJvciBvY2N1cnJlZCBsb2FkaW5nIGdyb3VwIHNldHRpbmdzOiAnICsgbWVzc2FnZSk7XG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgbG9hZDogbG9hZFNldHRpbmdzXG59OyIsInZhciAkOyByZXF1aXJlKCcuL3V0aWxzL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xuXG4vLyBUT0RPOiB0cmltIHRyYWlsaW5nIGNvbW1hcyBmcm9tIGFueSBzZWxlY3RvciB2YWx1ZXNcblxuLy8gVE9ETzogUmV2aWV3LiBUaGVzZSBhcmUganVzdCBjb3BpZWQgZnJvbSBlbmdhZ2VfZnVsbC5cbnZhciBkZWZhdWx0cyA9IHtcbiAgICBwcmVtaXVtOiBmYWxzZSxcbiAgICBpbWdfc2VsZWN0b3I6IFwiaW1nXCIsIC8vIFRPRE86IHRoaXMgaXMgc29tZSBib2d1cyBvYnNvbGV0ZSBwcm9wZXJ0eS4gd2Ugc2hvdWxkbid0IHVzZSBpdC5cbiAgICBpbWdfY29udGFpbmVyX3NlbGVjdG9yczpcIiNwcmltYXJ5LXBob3RvXCIsXG4gICAgYWN0aXZlX3NlY3Rpb25zOiBcImJvZHlcIixcbiAgICAvL2Fubm9fd2hpdGVsaXN0OiBcImJvZHkgcFwiLFxuICAgIGFubm9fd2hpdGVsaXN0OiBcInBcIiwgLy8gVE9ETzogVGhlIGN1cnJlbnQgZGVmYXVsdCBpcyBcImJvZHkgcFwiLCB3aGljaCBtYWtlcyBubyBzZW5zZSB3aGVuIHdlJ3JlIHNlYXJjaGluZyBvbmx5IHdpdGhpbiB0aGUgYWN0aXZlIHNlY3Rpb25zXG4gICAgYWN0aXZlX3NlY3Rpb25zX3dpdGhfYW5ub193aGl0ZWxpc3Q6XCJcIixcbiAgICBtZWRpYV9zZWxlY3RvcjogXCJlbWJlZCwgdmlkZW8sIG9iamVjdCwgaWZyYW1lXCIsXG4gICAgY29tbWVudF9sZW5ndGg6IDUwMCxcbiAgICBub19hbnQ6IFwiXCIsXG4gICAgaW1nX2JsYWNrbGlzdDogXCJcIixcbiAgICBjdXN0b21fY3NzOiBcIlwiLFxuICAgIC8vdG9kbzogdGVtcCBpbmxpbmVfaW5kaWNhdG9yIGRlZmF1bHRzIHRvIG1ha2UgdGhlbSBzaG93IHVwIG9uIGFsbCBtZWRpYSAtIHJlbW92ZSB0aGlzIGxhdGVyLlxuICAgIGlubGluZV9zZWxlY3RvcjogJ2ltZywgZW1iZWQsIHZpZGVvLCBvYmplY3QsIGlmcmFtZScsXG4gICAgcGFyYWdyYXBoX2hlbHBlcjogdHJ1ZSxcbiAgICBtZWRpYV91cmxfaWdub3JlX3F1ZXJ5OiB0cnVlLFxuICAgIHN1bW1hcnlfd2lkZ2V0X3NlbGVjdG9yOiAnLmFudC1wYWdlLXN1bW1hcnknLCAvLyBUT0RPOiB0aGlzIHdhc24ndCBkZWZpbmVkIGFzIGEgZGVmYXVsdCBpbiBlbmdhZ2VfZnVsbCwgYnV0IHdhcyBpbiBjb2RlLiB3aHk/XG4gICAgc3VtbWFyeV93aWRnZXRfbWV0aG9kOiAnYWZ0ZXInLFxuICAgIGxhbmd1YWdlOiAnZW4nLFxuICAgIGFiX3Rlc3RfaW1wYWN0OiB0cnVlLFxuICAgIGFiX3Rlc3Rfc2FtcGxlX3BlcmNlbnRhZ2U6IDEwLFxuICAgIGltZ19pbmRpY2F0b3Jfc2hvd19vbmxvYWQ6IHRydWUsXG4gICAgaW1nX2luZGljYXRvcl9zaG93X3NpZGU6ICdsZWZ0JyxcbiAgICB0YWdfYm94X2JnX2NvbG9yczogJyMxODQxNGM7IzM3NjA3NjsyMTUsIDE3OSwgNjk7I2U2ODg1YzsjZTQ2MTU2JyxcbiAgICB0YWdfYm94X3RleHRfY29sb3JzOiAnI2ZmZjsjZmZmOyNmZmY7I2ZmZjsjZmZmJyxcbiAgICB0YWdfYm94X2ZvbnRfZmFtaWx5OiAnSGVsdmV0aWNhTmV1ZSxIZWx2ZXRpY2EsQXJpYWwsc2Fucy1zZXJpZicsXG4gICAgdGFnc19iZ19jc3M6ICcnLFxuICAgIGlnbm9yZV9zdWJkb21haW46IGZhbHNlLFxuICAgIGltYWdlX3NlbGVjdG9yOiAnbWV0YVtwcm9wZXJ0eT1cIm9nOmltYWdlXCJdJywgLy8gVE9ETzogcmV2aWV3IHdoYXQgdGhpcyBzaG91bGQgYmUgKG5vdCBmcm9tIGVuZ2FnZV9mdWxsKVxuICAgIGltYWdlX2F0dHJpYnV0ZTogJ2NvbnRlbnQnLCAvLyBUT0RPOiByZXZpZXcgd2hhdCB0aGlzIHNob3VsZCBiZSAobm90IGZyb20gZW5nYWdlX2Z1bGwpXG4gICAgLy90aGUgc2NvcGUgaW4gd2hpY2ggdG8gZmluZCBwYXJlbnRzIG9mIDxicj4gdGFncy5cbiAgICAvL1Rob3NlIHBhcmVudHMgd2lsbCBiZSBjb252ZXJ0ZWQgdG8gYSA8cnQ+IGJsb2NrLCBzbyB0aGVyZSB3b24ndCBiZSBuZXN0ZWQgPHA+IGJsb2Nrcy5cbiAgICAvL3RoZW4gaXQgd2lsbCBzcGxpdCB0aGUgcGFyZW50J3MgaHRtbCBvbiA8YnI+IHRhZ3MgYW5kIHdyYXAgdGhlIHNlY3Rpb25zIGluIDxwPiB0YWdzLlxuXG4gICAgLy9leGFtcGxlOlxuICAgIC8vIGJyX3JlcGxhY2Vfc2NvcGVfc2VsZWN0b3I6IFwiLmFudF9icl9yZXBsYWNlXCIgLy9lLmcuIFwiI21haW5zZWN0aW9uXCIgb3IgXCJwXCJcblxuICAgIGJyX3JlcGxhY2Vfc2NvcGVfc2VsZWN0b3I6IG51bGwgLy9lLmcuIFwiI21haW5zZWN0aW9uXCIgb3IgXCJwXCJcbn07XG5cbmZ1bmN0aW9uIGNyZWF0ZUZyb21KU09OKGpzb24pIHtcblxuICAgIGZ1bmN0aW9uIGRhdGEoa2V5LCBpZkFic2VudCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgdmFsdWUgPSB3aW5kb3cuYW50ZW5uYV9leHRlbmRba2V5XTtcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IGpzb25ba2V5XTtcbiAgICAgICAgICAgICAgICAvLyBUT0RPOiBvdXIgc2VydmVyIGFwcGFyZW50bHkgc2VuZHMgYmFjayBudWxsIGFzIGEgdmFsdWUgZm9yIHNvbWUgYXR0cmlidXRlcy5cbiAgICAgICAgICAgICAgICAvLyBUT0RPOiBjb25zaWRlciBjaGVja2luZyBmb3IgbnVsbCB3aGVyZXZlciB3ZSdyZSBjaGVja2luZyBmb3IgdW5kZWZpbmVkXG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09ICcnIHx8IHZhbHVlID09PSBudWxsKSB7IC8vIFRPRE86IFNob3VsZCB0aGUgc2VydmVyIGJlIHNlbmRpbmcgYmFjayAnJyBoZXJlIG9yIG5vdGhpbmcgYXQgYWxsPyAoSXQgcHJlY2x1ZGVzIHRoZSBzZXJ2ZXIgZnJvbSByZWFsbHkgc2F5aW5nICdub3RoaW5nJylcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBkZWZhdWx0c1trZXldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaWZBYnNlbnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYmFja2dyb3VuZENvbG9yKGFjY2Vzc29yKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBjb2xvcnMgPSBbXTtcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IGFjY2Vzc29yKCk7XG4gICAgICAgICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICBjb2xvcnMgPSB2YWx1ZS5zcGxpdCgnOycpO1xuICAgICAgICAgICAgICAgIGNvbG9ycyA9IG1pZ3JhdGVWYWx1ZXMoY29sb3JzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBjb2xvcnM7XG5cbiAgICAgICAgICAgIC8vIE1pZ3JhdGUgYW55IGNvbG9ycyBmcm9tIHRoZSAnMSwgMiwgMycgZm9ybWF0IHRvICdyZ2IoMSwgMiwgMyknLiBUaGlzIGNvZGUgY2FuIGJlIGRlbGV0ZWQgb25jZSB3ZSd2ZSB1cGRhdGVkXG4gICAgICAgICAgICAvLyBhbGwgc2l0ZXMgdG8gc3BlY2lmeWluZyB2YWxpZCBDU1MgY29sb3IgdmFsdWVzXG4gICAgICAgICAgICBmdW5jdGlvbiBtaWdyYXRlVmFsdWVzKGNvbG9yVmFsdWVzKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1pZ3JhdGlvbk1hdGNoZXIgPSAvXlxccypcXGQrXFxzKixcXHMqXFxkK1xccyosXFxzKlxcZCtcXHMqJC9naW07XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb2xvclZhbHVlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgdmFsdWUgPSBjb2xvclZhbHVlc1tpXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG1pZ3JhdGlvbk1hdGNoZXIudGVzdCh2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yVmFsdWVzW2ldID0gJ3JnYignICsgdmFsdWUgKyAnKSc7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbG9yVmFsdWVzO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZGVmYXVsdFJlYWN0aW9ucygkZWxlbWVudCkge1xuICAgICAgICAvLyBEZWZhdWx0IHJlYWN0aW9ucyBhcmUgYXZhaWxhYmxlIGluIHRocmVlIGxvY2F0aW9ucyBpbiB0aHJlZSBkYXRhIGZvcm1hdHM6XG4gICAgICAgIC8vIDEuIEFzIGEgY29tbWEtc2VwYXJhdGVkIGF0dHJpYnV0ZSB2YWx1ZSBvbiBhIHBhcnRpY3VsYXIgZWxlbWVudFxuICAgICAgICAvLyAyLiBBcyBhbiBhcnJheSBvZiBzdHJpbmdzIG9uIHRoZSB3aW5kb3cuYW50ZW5uYV9leHRlbmQgcHJvcGVydHlcbiAgICAgICAgLy8gMy4gQXMgYSBqc29uIG9iamVjdCB3aXRoIGEgYm9keSBhbmQgaWQgb24gdGhlIGdyb3VwIHNldHRpbmdzXG4gICAgICAgIHZhciByZWFjdGlvbnMgPSBbXTtcbiAgICAgICAgdmFyIHJlYWN0aW9uU3RyaW5ncztcbiAgICAgICAgdmFyIGVsZW1lbnRSZWFjdGlvbnMgPSAkZWxlbWVudCA/ICRlbGVtZW50LmF0dHIoJ2FudC1yZWFjdGlvbnMnKSA6IHVuZGVmaW5lZDtcbiAgICAgICAgaWYgKGVsZW1lbnRSZWFjdGlvbnMpIHtcbiAgICAgICAgICAgIHJlYWN0aW9uU3RyaW5ncyA9IGVsZW1lbnRSZWFjdGlvbnMuc3BsaXQoJzsnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlYWN0aW9uU3RyaW5ncyA9IHdpbmRvdy5hbnRlbm5hX2V4dGVuZFsnZGVmYXVsdF9yZWFjdGlvbnMnXTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocmVhY3Rpb25TdHJpbmdzKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJlYWN0aW9uU3RyaW5ncy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHJlYWN0aW9ucy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgdGV4dDogcmVhY3Rpb25TdHJpbmdzW2ldLFxuICAgICAgICAgICAgICAgICAgICBpc0RlZmF1bHQ6IHRydWVcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyIHZhbHVlcyA9IGpzb25bJ2RlZmF1bHRfcmVhY3Rpb25zJ107XG4gICAgICAgICAgICBpZiAodmFsdWVzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHZhbHVlcy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgdmFsdWUgPSB2YWx1ZXNbal07XG4gICAgICAgICAgICAgICAgICAgIHJlYWN0aW9ucy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6IHZhbHVlLmJvZHksXG4gICAgICAgICAgICAgICAgICAgICAgICBpZDogdmFsdWUuaWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBpc0RlZmF1bHQ6IHRydWVcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZWFjdGlvbnM7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgbGVnYWN5QmVoYXZpb3I6IGRhdGEoJ2xlZ2FjeV9iZWhhdmlvcicsIGZhbHNlKSwgLy8gVE9ETzogbWFrZSB0aGlzIHJlYWwgaW4gdGhlIHNlbnNlIHRoYXQgaXQgY29tZXMgYmFjayBmcm9tIHRoZSBzZXJ2ZXIgYW5kIHByb2JhYmx5IG1vdmUgdGhlIGZsYWcgdG8gdGhlIHBhZ2UgZGF0YS4gVW5saWtlbHkgdGhhdCB3ZSBuZWVkIHRvIG1haW50YWluIGxlZ2FjeSBiZWhhdmlvciBmb3IgbmV3IHBhZ2VzP1xuICAgICAgICBncm91cElkOiBkYXRhKCdpZCcpLFxuICAgICAgICBhY3RpdmVTZWN0aW9uczogZGF0YSgnYWN0aXZlX3NlY3Rpb25zJyksXG4gICAgICAgIHVybDoge1xuICAgICAgICAgICAgaWdub3JlU3ViZG9tYWluOiBkYXRhKCdpZ25vcmVfc3ViZG9tYWluJyksXG4gICAgICAgICAgICBjYW5vbmljYWxEb21haW46IGRhdGEoJ3BhZ2VfdGxkJykgLy8gVE9ETzogd2hhdCB0byBjYWxsIHRoaXMgZXhhY3RseS4gZ3JvdXBEb21haW4/IHNpdGVEb21haW4/IGNhbm9uaWNhbERvbWFpbj9cbiAgICAgICAgfSxcbiAgICAgICAgc3VtbWFyeVNlbGVjdG9yOiBkYXRhKCdzdW1tYXJ5X3dpZGdldF9zZWxlY3RvcicpLFxuICAgICAgICBzdW1tYXJ5TWV0aG9kOiBkYXRhKCdzdW1tYXJ5X3dpZGdldF9tZXRob2QnKSxcbiAgICAgICAgcGFnZVNlbGVjdG9yOiBkYXRhKCdwb3N0X3NlbGVjdG9yJyksXG4gICAgICAgIHBhZ2VMaW5rU2VsZWN0b3I6IGRhdGEoJ3Bvc3RfaHJlZl9zZWxlY3RvcicpLFxuICAgICAgICBwYWdlSW1hZ2VTZWxlY3RvcjogZGF0YSgnaW1hZ2Vfc2VsZWN0b3InKSxcbiAgICAgICAgcGFnZUltYWdlQXR0cmlidXRlOiBkYXRhKCdpbWFnZV9hdHRyaWJ1dGUnKSxcbiAgICAgICAgY29udGVudFNlbGVjdG9yOiBkYXRhKCdhbm5vX3doaXRlbGlzdCcpLFxuICAgICAgICB0ZXh0SW5kaWNhdG9yTGltaXQ6IGRhdGEoJ2luaXRpYWxfcGluX2xpbWl0JyksXG4gICAgICAgIGVuYWJsZVRleHRIZWxwZXI6IGRhdGEoJ3BhcmFncmFwaF9oZWxwZXInKSxcbiAgICAgICAgbWVkaWFJbmRpY2F0b3JDb3JuZXI6IGRhdGEoJ2ltZ19pbmRpY2F0b3Jfc2hvd19zaWRlJyksXG4gICAgICAgIGdlbmVyYXRlZEN0YVNlbGVjdG9yOiBkYXRhKCdzZXBhcmF0ZV9jdGEnKSxcbiAgICAgICAgZGVmYXVsdFJlYWN0aW9uczogZGVmYXVsdFJlYWN0aW9ucyxcbiAgICAgICAgcmVhY3Rpb25CYWNrZ3JvdW5kQ29sb3JzOiBiYWNrZ3JvdW5kQ29sb3IoZGF0YSgndGFnX2JveF9iZ19jb2xvcnMnKSksXG4gICAgICAgIGV4Y2x1c2lvblNlbGVjdG9yOiBkYXRhKCdub19hbnQnKVxuICAgIH1cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZTogY3JlYXRlRnJvbUpTT05cbn07IiwiLy8gVGhpcyBtb2R1bGUgc3RvcmVzIG91ciBtYXBwaW5nIGZyb20gaGFzaCB2YWx1ZXMgdG8gdGhlaXIgY29ycmVzcG9uZGluZyBlbGVtZW50cyBpbiB0aGUgRE9NLiBUaGUgZGF0YSBpcyBvcmdhbml6ZWRcbi8vIGJ5IHBhZ2UgZm9yIHRoZSBibG9nIHJvbGwgY2FzZSwgd2hlcmUgbXVsdGlwbGUgcGFnZXMgb2YgZGF0YSBjYW4gYmUgbG9hZGVkIGF0IG9uY2UuXG52YXIgcGFnZXMgPSB7fTtcblxuZnVuY3Rpb24gZ2V0RWxlbWVudChjb250YWluZXJIYXNoLCBwYWdlSGFzaCkge1xuICAgIHZhciBjb250YWluZXJzID0gcGFnZXNbcGFnZUhhc2hdO1xuICAgIGlmIChjb250YWluZXJzKSB7XG4gICAgICAgIHJldHVybiBjb250YWluZXJzW2NvbnRhaW5lckhhc2hdO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gc2V0RWxlbWVudChjb250YWluZXJIYXNoLCBwYWdlSGFzaCwgZWxlbWVudCkge1xuICAgIHZhciBjb250YWluZXJzID0gcGFnZXNbcGFnZUhhc2hdO1xuICAgIGlmICghY29udGFpbmVycykge1xuICAgICAgICBjb250YWluZXJzID0gcGFnZXNbcGFnZUhhc2hdID0ge307XG4gICAgfVxuICAgIGNvbnRhaW5lcnNbY29udGFpbmVySGFzaF0gPSBlbGVtZW50O1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgZ2V0OiBnZXRFbGVtZW50LFxuICAgIHNldDogc2V0RWxlbWVudFxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi91dGlscy9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciBSYWN0aXZlOyByZXF1aXJlKCcuL3V0aWxzL3JhY3RpdmUtcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24obG9hZGVkUmFjdGl2ZSkgeyBSYWN0aXZlID0gbG9hZGVkUmFjdGl2ZTt9KTtcbnZhciBSYW5nZSA9IHJlcXVpcmUoJy4vdXRpbHMvcmFuZ2UnKTtcblxudmFyIEhhc2hlZEVsZW1lbnRzID0gcmVxdWlyZSgnLi9oYXNoZWQtZWxlbWVudHMnKTtcblxudmFyIHBhZ2VTZWxlY3RvciA9ICcuYW50ZW5uYS1sb2NhdGlvbnMtcGFnZSc7XG5cbmZ1bmN0aW9uIGNyZWF0ZVBhZ2Uob3B0aW9ucykge1xuICAgIHZhciBlbGVtZW50ID0gb3B0aW9ucy5lbGVtZW50O1xuICAgIHZhciByZWFjdGlvbkxvY2F0aW9uRGF0YSA9IG9wdGlvbnMucmVhY3Rpb25Mb2NhdGlvbkRhdGE7XG4gICAgdmFyIHBhZ2VEYXRhID0gb3B0aW9ucy5wYWdlRGF0YTtcbiAgICB2YXIgY2xvc2VXaW5kb3cgPSBvcHRpb25zLmNsb3NlV2luZG93O1xuICAgIHZhciByYWN0aXZlID0gUmFjdGl2ZSh7XG4gICAgICAgIGVsOiBlbGVtZW50LFxuICAgICAgICBhcHBlbmQ6IHRydWUsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIGxvY2F0aW9uRGF0YTogcmVhY3Rpb25Mb2NhdGlvbkRhdGEsXG4gICAgICAgICAgICBwYWdlUmVhY3Rpb25Db3VudDogcGFnZVJlYWN0aW9uQ291bnQocmVhY3Rpb25Mb2NhdGlvbkRhdGEpLFxuICAgICAgICAgICAgY29udGVudENvdW50TGFiZWw6IGNvbXB1dGVDb250ZW50Q291bnRMYWJlbCxcbiAgICAgICAgICAgIGNhbkxvY2F0ZTogZnVuY3Rpb24oY29udGFpbmVySGFzaCkge1xuICAgICAgICAgICAgICAgIC8vIFRPRE86IGlzIHRoZXJlIGEgYmV0dGVyIHdheSB0byBoYW5kbGUgcmVhY3Rpb25zIHRvIGhhc2hlcyB0aGF0IGFyZSBubyBsb25nZXIgb24gdGhlIHBhZ2U/XG4gICAgICAgICAgICAgICAgLy8gICAgICAgc2hvdWxkIHdlIHByb3ZpZGUgc29tZSBraW5kIG9mIGluZGljYXRpb24gd2hlbiB3ZSBmYWlsIHRvIGxvY2F0ZSBhIGhhc2ggb3IganVzdCBsZWF2ZSBpdCBhcyBpcz9cbiAgICAgICAgICAgICAgICByZXR1cm4gSGFzaGVkRWxlbWVudHMuZ2V0KGNvbnRhaW5lckhhc2gsIHBhZ2VEYXRhLnBhZ2VIYXNoKSAhPT0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL2xvY2F0aW9ucy1wYWdlLmhicy5odG1sJylcbiAgICB9KTtcbiAgICByYWN0aXZlLm9uKCdjbG9zZXdpbmRvdycsIGNsb3NlV2luZG93KTtcbiAgICByYWN0aXZlLm9uKCdyZXZlYWwnLCByZXZlYWxDb250ZW50KTtcbiAgICByZXR1cm4ge1xuICAgICAgICBzZWxlY3RvcjogcGFnZVNlbGVjdG9yLFxuICAgICAgICB0ZWFyZG93bjogZnVuY3Rpb24oKSB7IHJhY3RpdmUudGVhcmRvd24oKTsgfVxuICAgIH07XG5cblxuICAgIGZ1bmN0aW9uIHJldmVhbENvbnRlbnQoZXZlbnQpIHtcbiAgICAgICAgdmFyIGxvY2F0aW9uRGF0YSA9IGV2ZW50LmNvbnRleHQ7XG4gICAgICAgIHZhciBlbGVtZW50ID0gSGFzaGVkRWxlbWVudHMuZ2V0KGxvY2F0aW9uRGF0YS5jb250YWluZXJIYXNoLCBwYWdlRGF0YS5wYWdlSGFzaCk7XG4gICAgICAgIGlmIChlbGVtZW50KSB7XG4gICAgICAgICAgICBjbG9zZVdpbmRvdygpO1xuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHsgLy8gTGV0IHRoZSBwcm9jZXNzaW5nIG9mIHRoaXMgY2xpY2sgZXZlbnQgZmluaXNoIGJlZm9yZSB3ZSBhZGQgYW5vdGhlciBjbGljayBoYW5kbGVyIHNvIHRoZSBuZXcgaGFuZGxlciBpc24ndCBpbW1lZGlhdGVseSB0cmlnZ2VyZWRcbiAgICAgICAgICAgICAgICB2YXIgdGFyZ2V0U2Nyb2xsVG9wID0gJChlbGVtZW50KS5vZmZzZXQoKS50b3AgLSAyMDsgLy8gVE9ETzogcmV2aWV3IHRoZSBleGFjdCBsb2NhdGlvblxuICAgICAgICAgICAgICAgICQoJ2JvZHknKS5hbmltYXRlKHtzY3JvbGxUb3A6IHRhcmdldFNjcm9sbFRvcH0pO1xuICAgICAgICAgICAgICAgIGlmIChsb2NhdGlvbkRhdGEua2luZCA9PT0gJ3R4dCcpIHsgLy8gVE9ETzogc29tZXRoaW5nIGJldHRlciB0aGFuIGEgc3RyaW5nIGNvbXBhcmUuIGZpeCB0aGlzIGFsb25nIHdpdGggdGhlIHNhbWUgaXNzdWUgaW4gcGFnZS1kYXRhXG4gICAgICAgICAgICAgICAgICAgIFJhbmdlLmhpZ2hsaWdodChlbGVtZW50LmdldCgwKSwgbG9jYXRpb25EYXRhLmxvY2F0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgJChkb2N1bWVudCkub24oJ2NsaWNrLmFudGVubmEnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFJhbmdlLmNsZWFySGlnaGxpZ2h0cygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJChkb2N1bWVudCkub2ZmKCdjbGljay5hbnRlbm5hJyk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIDApO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBwYWdlUmVhY3Rpb25Db3VudChyZWFjdGlvbkxvY2F0aW9uRGF0YSkge1xuICAgIGZvciAodmFyIGNvbnRlbnRJRCBpbiByZWFjdGlvbkxvY2F0aW9uRGF0YSkge1xuICAgICAgICBpZiAocmVhY3Rpb25Mb2NhdGlvbkRhdGEuaGFzT3duUHJvcGVydHkoY29udGVudElEKSkge1xuICAgICAgICAgICAgdmFyIGNvbnRlbnRMb2NhdGlvbkRhdGEgPSByZWFjdGlvbkxvY2F0aW9uRGF0YVtjb250ZW50SURdO1xuICAgICAgICAgICAgaWYgKGNvbnRlbnRMb2NhdGlvbkRhdGEua2luZCA9PT0gJ3BhZycpIHsgLy8gVE9ETzogc29tZXRoaW5nIGJldHRlciB0aGFuIGEgc3RyaW5nIGNvbXBhcmUuIGZpeCB0aGlzIGFsb25nIHdpdGggdGhlIHNhbWUgaXNzdWUgaW4gcGFnZS1kYXRhXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRlbnRMb2NhdGlvbkRhdGEuY291bnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVDb250ZW50Q291bnRMYWJlbChjb3VudCkge1xuICAgIGlmIChjb3VudCA9PT0gMSkge1xuICAgICAgICByZXR1cm4gJzxkaXYgY2xhc3M9XCJhbnRlbm5hLWNvbnRlbnQtY291bnQgbnVtYmVyXCI+MTwvZGl2PjxkaXYgY2xhc3M9XCJhbnRlbm5hLWNvbnRlbnQtY291bnRcIj5yZWFjdGlvbjwvZGl2Pic7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuICc8ZGl2IGNsYXNzPVwiYW50ZW5uYS1jb250ZW50LWNvdW50IG51bWJlclwiPicgKyBjb3VudCArICc8L2Rpdj48ZGl2IGNsYXNzPVwiYW50ZW5uYS1jb250ZW50LWNvdW50XCI+cmVhY3Rpb25zPC9kaXY+JztcbiAgICB9XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGU6IGNyZWF0ZVBhZ2Vcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgUmFjdGl2ZTsgcmVxdWlyZSgnLi91dGlscy9yYWN0aXZlLXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGxvYWRlZFJhY3RpdmUpIHsgUmFjdGl2ZSA9IGxvYWRlZFJhY3RpdmU7fSk7XG52YXIgUmVhY3Rpb25zV2lkZ2V0ID0gcmVxdWlyZSgnLi9yZWFjdGlvbnMtd2lkZ2V0Jyk7XG5cbnZhciBBcHBNb2RlID0gcmVxdWlyZSgnLi91dGlscy9hcHAtbW9kZScpO1xudmFyIE11dGF0aW9uT2JzZXJ2ZXIgPSByZXF1aXJlKCcuL3V0aWxzL211dGF0aW9uLW9ic2VydmVyJyk7XG52YXIgVGhyb3R0bGVkRXZlbnRzID0gcmVxdWlyZSgnLi91dGlscy90aHJvdHRsZWQtZXZlbnRzJyk7XG5cbmZ1bmN0aW9uIGNyZWF0ZUluZGljYXRvcldpZGdldChvcHRpb25zKSB7XG4gICAgLy8gVE9ETzogdmFsaWRhdGUgdGhhdCBvcHRpb25zIGNvbnRhaW5zIGFsbCByZXF1aXJlZCBwcm9wZXJ0aWVzIChhcHBsaWVzIHRvIGFsbCB3aWRnZXRzKS5cbiAgICB2YXIgZWxlbWVudCA9IG9wdGlvbnMuZWxlbWVudDtcbiAgICB2YXIgY29udGFpbmVyRGF0YSA9IG9wdGlvbnMuY29udGFpbmVyRGF0YTtcbiAgICB2YXIgJGNvbnRhaW5lckVsZW1lbnQgPSBvcHRpb25zLmNvbnRhaW5lckVsZW1lbnQ7XG4gICAgdmFyIHBhZ2VEYXRhID0gb3B0aW9ucy5wYWdlRGF0YTtcbiAgICB2YXIgZ3JvdXBTZXR0aW5ncyA9IG9wdGlvbnMuZ3JvdXBTZXR0aW5ncztcbiAgICB2YXIgZGVmYXVsdFJlYWN0aW9ucyA9IG9wdGlvbnMuZGVmYXVsdFJlYWN0aW9ucztcbiAgICB2YXIgY29udGVudERhdGEgPSBvcHRpb25zLmNvbnRlbnREYXRhO1xuICAgIHZhciByYWN0aXZlID0gUmFjdGl2ZSh7XG4gICAgICAgIGVsOiBlbGVtZW50LFxuICAgICAgICBhcHBlbmQ6IHRydWUsXG4gICAgICAgIG1hZ2ljOiB0cnVlLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICBjb250YWluZXJEYXRhOiBjb250YWluZXJEYXRhLFxuICAgICAgICAgICAgZXh0cmFBdHRyaWJ1dGVzOiBBcHBNb2RlLmRlYnVnID8gJ2FudC1oYXNoPVwiJyArIGNvbnRhaW5lckRhdGEuaGFzaCArICdcIicgOiAnJyAvLyBUT0RPOiB0aGlzIGFib3V0IG1ha2luZyB0aGlzIGEgZGVjb3JhdG9yIGhhbmRsZWQgYnkgYSBcIkRlYnVnXCIgbW9kdWxlXG4gICAgICAgIH0sXG4gICAgICAgIHRlbXBsYXRlOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvbWVkaWEtaW5kaWNhdG9yLXdpZGdldC5oYnMuaHRtbCcpLFxuICAgICAgICBwYXJ0aWFsczoge1xuICAgICAgICAgICAgbG9nbzogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL2xvZ28tc3ZnLmhicy5odG1sJylcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgdmFyIHJlYWN0aW9uV2lkZ2V0T3B0aW9ucyA9IHtcbiAgICAgICAgcmVhY3Rpb25zRGF0YTogY29udGFpbmVyRGF0YS5yZWFjdGlvbnMsXG4gICAgICAgIGNvbnRhaW5lckRhdGE6IGNvbnRhaW5lckRhdGEsXG4gICAgICAgIGNvbnRhaW5lckVsZW1lbnQ6ICRjb250YWluZXJFbGVtZW50LFxuICAgICAgICBjb250ZW50RGF0YTogY29udGVudERhdGEsXG4gICAgICAgIGRlZmF1bHRSZWFjdGlvbnM6IGRlZmF1bHRSZWFjdGlvbnMsXG4gICAgICAgIHBhZ2VEYXRhOiBwYWdlRGF0YSxcbiAgICAgICAgZ3JvdXBTZXR0aW5nczogZ3JvdXBTZXR0aW5nc1xuICAgIH07XG5cbiAgICB2YXIgaG92ZXJUaW1lb3V0O1xuICAgIHZhciBhY3RpdmVUaW1lb3V0O1xuXG4gICAgdmFyICRyb290RWxlbWVudCA9ICQocm9vdEVsZW1lbnQocmFjdGl2ZSkpO1xuICAgICRyb290RWxlbWVudC5vbignbW91c2VlbnRlci5hbnRlbm5hJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgaWYgKGV2ZW50LmJ1dHRvbnMgPiAwIHx8IChldmVudC5idXR0b25zID09IHVuZGVmaW5lZCAmJiBldmVudC53aGljaCA+IDApKSB7IC8vIE9uIFNhZmFyaSwgZXZlbnQuYnV0dG9ucyBpcyB1bmRlZmluZWQgYnV0IGV2ZW50LndoaWNoIGdpdmVzIGEgZ29vZCB2YWx1ZS4gZXZlbnQud2hpY2ggaXMgYmFkIG9uIEZGXG4gICAgICAgICAgICAvLyBEb24ndCByZWFjdCBpZiB0aGUgdXNlciBpcyBkcmFnZ2luZyBvciBzZWxlY3RpbmcgdGV4dC5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY29udGFpbmVyRGF0YS5yZWFjdGlvbnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgb3BlblJlYWN0aW9uc1dpbmRvdyhyZWFjdGlvbldpZGdldE9wdGlvbnMsIHJhY3RpdmUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KGhvdmVyVGltZW91dCk7XG4gICAgICAgICAgICBob3ZlclRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIG9wZW5SZWFjdGlvbnNXaW5kb3cocmVhY3Rpb25XaWRnZXRPcHRpb25zLCByYWN0aXZlKTtcbiAgICAgICAgICAgIH0sIDUwKTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgICRyb290RWxlbWVudC5vbignbW91c2VsZWF2ZS5hbnRlbm5hJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIGNsZWFyVGltZW91dChob3ZlclRpbWVvdXQpO1xuICAgICAgICBjbGVhclRpbWVvdXQoYWN0aXZlVGltZW91dCk7XG4gICAgfSk7XG4gICAgJGNvbnRhaW5lckVsZW1lbnQub24oJ21vdXNlZW50ZXIuYW50ZW5uYScsIGZ1bmN0aW9uKCkge1xuICAgICAgICBjbGVhclRpbWVvdXQoYWN0aXZlVGltZW91dCk7XG4gICAgICAgIGFjdGl2ZVRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgJHJvb3RFbGVtZW50LmFkZENsYXNzKCdhY3RpdmUnKTtcbiAgICAgICAgfSwgNTAwKTtcbiAgICB9KTtcbiAgICAkY29udGFpbmVyRWxlbWVudC5vbignbW91c2VsZWF2ZS5hbnRlbm5hJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIGNsZWFyVGltZW91dChhY3RpdmVUaW1lb3V0KTtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICRyb290RWxlbWVudC5yZW1vdmVDbGFzcygnYWN0aXZlJyk7XG4gICAgICAgIH0sIDEwMCk7IC8vIFdlIGdldCBhIG1vdXNlbGVhdmUgZXZlbnQgd2hlbiB0aGUgdXNlciBob3ZlcnMgdGhlIGluZGljYXRvci4gUGF1c2UgbG9uZyBlbm91Z2ggdGhhdCB0aGUgcmVhY3Rpb24gd2luZG93IGNhbiBvcGVuIGlmIHRoZXkgaG92ZXIuXG4gICAgfSk7XG4gICAgc2V0dXBQb3NpdGlvbmluZygkY29udGFpbmVyRWxlbWVudCwgZ3JvdXBTZXR0aW5ncywgcmFjdGl2ZSk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICB0ZWFyZG93bjogZnVuY3Rpb24oKSB7IHJhY3RpdmUudGVhcmRvd24oKTsgfVxuICAgIH07XG59XG5cbmZ1bmN0aW9uIHNldHVwUG9zaXRpb25pbmcoJGNvbnRhaW5lckVsZW1lbnQsIGdyb3VwU2V0dGluZ3MsIHJhY3RpdmUpIHtcbiAgICB2YXIgJHdyYXBwZXJFbGVtZW50ID0gJCh3cmFwcGVyRWxlbWVudChyYWN0aXZlKSk7XG4gICAgdmFyICRyb290RWxlbWVudCA9ICQocm9vdEVsZW1lbnQocmFjdGl2ZSkpO1xuICAgIHBvc2l0aW9uSW5kaWNhdG9yKCk7XG5cbiAgICB2YXIgcmVwb3NpdGlvbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBwb3NpdGlvbkluZGljYXRvcigpO1xuICAgIH07XG4gICAgVGhyb3R0bGVkRXZlbnRzLm9uKCdyZXNpemUnLCByZXBvc2l0aW9uKTtcbiAgICByYWN0aXZlLm9uKCd0ZWFyZG93bicsIGZ1bmN0aW9uKCkge1xuICAgICAgICBUaHJvdHRsZWRFdmVudHMub2ZmKCdyZXNpemUnLCByZXBvc2l0aW9uKTtcbiAgICB9KTtcblxuICAgIC8vIFRPRE86IGNvbnNpZGVyIGFsc28gbGlzdGVuaW5nIHRvIHNyYyBhdHRyaWJ1dGUgY2hhbmdlcywgd2hpY2ggbWlnaHQgYWZmZWN0IHRoZSBoZWlnaHQgb2YgZWxlbWVudHMgb24gdGhlIHBhZ2VcbiAgICAvLyBUT0RPOiBjb25zaWRlciBob2xkaW5nIG9udG8gdGhlIGVsZW1lbnQncyBsYXN0IGtub3duIG9mZnNldCBhbmQgc2ltcGx5IHVzaW5nIHRoYXQgKGNoZWNraW5nIGlmIGl0IGNoYW5nZWQpIHRvXG4gICAgLy8gICAgICAgZGV0ZXJtaW5lIGlmIHRoZSBpbmRpY2F0b3IgbmVlZHMgdG8gYmUgcmVwb3NpdGlvbmVkLlxuICAgIE11dGF0aW9uT2JzZXJ2ZXIuYWRkQWRkaXRpb25MaXN0ZW5lcihlbGVtZW50c0FkZGVkT3JSZW1vdmVkKTtcbiAgICBNdXRhdGlvbk9ic2VydmVyLmFkZFJlbW92YWxMaXN0ZW5lcihlbGVtZW50c0FkZGVkT3JSZW1vdmVkKTtcblxuICAgIGZ1bmN0aW9uIGVsZW1lbnRzQWRkZWRPclJlbW92ZWQoJGVsZW1lbnRzKSB7XG4gICAgICAgIC8vIFJlcG9zaXRpb24gdGhlIGluZGljYXRvciBpZiBlbGVtZW50cyB3aGljaCBtaWdodCBhZGp1c3QgdGhlIGNvbnRhaW5lcidzIHBvc2l0aW9uIGFyZSBhZGRlZC9yZW1vdmVkLlxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8ICRlbGVtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyICRlbGVtZW50ID0gJGVsZW1lbnRzW2ldO1xuICAgICAgICAgICAgaWYgKCRlbGVtZW50LmhlaWdodCgpID4gMCAmJiAkZWxlbWVudC5vZmZzZXQoKS50b3AgPD0gJGNvbnRhaW5lckVsZW1lbnQub2Zmc2V0KCkudG9wKSB7XG4gICAgICAgICAgICAgICAgcmVwb3NpdGlvbigpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBvc2l0aW9uSW5kaWNhdG9yKCkge1xuICAgICAgICAvLyBQb3NpdGlvbiB0aGUgd3JhcHBlciBlbGVtZW50ICh3aGljaCBoYXMgYSBoYXJkY29kZWQgd2lkdGgpIGluIHRoZSBhcHByb3ByaWF0ZSBjb3JuZXIuIFRoZW4gZmxpcCB0aGUgbGVmdC9yaWdodFxuICAgICAgICAvLyBwb3NpdGlvbmluZyBvZiB0aGUgbmVzdGVkIHdpZGdldCBlbGVtZW50IHRvIGFkanVzdCB0aGUgd2F5IGl0IHdpbGwgZXhwYW5kIHdoZW4gdGhlIG1lZGlhIGlzIGhvdmVyZWQuXG4gICAgICAgIHZhciBjb3JuZXIgPSBncm91cFNldHRpbmdzLm1lZGlhSW5kaWNhdG9yQ29ybmVyKCk7XG4gICAgICAgIHZhciBlbGVtZW50T2Zmc2V0ID0gJGNvbnRhaW5lckVsZW1lbnQub2Zmc2V0KCk7XG4gICAgICAgIHZhciBjb29yZHMgPSB7fTtcbiAgICAgICAgaWYgKGNvcm5lci5pbmRleE9mKCd0b3AnKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIGNvb3Jkcy50b3AgPSBlbGVtZW50T2Zmc2V0LnRvcDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvb3Jkcy50b3AgPSBlbGVtZW50T2Zmc2V0LnRvcCArICRjb250YWluZXJFbGVtZW50LmhlaWdodCgpIC0gJHJvb3RFbGVtZW50Lm91dGVySGVpZ2h0KCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvcm5lci5pbmRleE9mKCdyaWdodCcpICE9PSAtMSkge1xuICAgICAgICAgICAgY29vcmRzLmxlZnQgPSBlbGVtZW50T2Zmc2V0LmxlZnQgKyAkY29udGFpbmVyRWxlbWVudC53aWR0aCgpIC0gJHdyYXBwZXJFbGVtZW50Lm91dGVyV2lkdGgoKTtcbiAgICAgICAgICAgICRyb290RWxlbWVudC5jc3Moe3JpZ2h0OjAsbGVmdDonJ30pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29vcmRzLmxlZnQgPSBlbGVtZW50T2Zmc2V0LmxlZnQ7XG4gICAgICAgICAgICAkcm9vdEVsZW1lbnQuY3NzKHtyaWdodDonJyxsZWZ0OjB9KTtcbiAgICAgICAgfVxuICAgICAgICAkd3JhcHBlckVsZW1lbnQuY3NzKGNvb3Jkcyk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiB3cmFwcGVyRWxlbWVudChyYWN0aXZlKSB7XG4gICAgcmV0dXJuIHJhY3RpdmUuZmluZCgnLmFudGVubmEtbWVkaWEtaW5kaWNhdG9yLXdyYXBwZXInKTtcbn1cblxuZnVuY3Rpb24gcm9vdEVsZW1lbnQocmFjdGl2ZSkge1xuICAgIHJldHVybiByYWN0aXZlLmZpbmQoJy5hbnRlbm5hLW1lZGlhLWluZGljYXRvci13aWRnZXQnKTtcbn1cblxuZnVuY3Rpb24gb3BlblJlYWN0aW9uc1dpbmRvdyhyZWFjdGlvbk9wdGlvbnMsIHJhY3RpdmUpIHtcbiAgICBSZWFjdGlvbnNXaWRnZXQub3BlbihyZWFjdGlvbk9wdGlvbnMsIHJvb3RFbGVtZW50KHJhY3RpdmUpKTtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZTogY3JlYXRlSW5kaWNhdG9yV2lkZ2V0XG59OyIsInZhciAkOyByZXF1aXJlKCcuL3V0aWxzL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIFBhZ2VVdGlscyA9IHJlcXVpcmUoJy4vdXRpbHMvcGFnZS11dGlscycpO1xudmFyIFRocm90dGxlZEV2ZW50cyA9IHJlcXVpcmUoJy4vdXRpbHMvdGhyb3R0bGVkLWV2ZW50cycpO1xudmFyIFVSTHMgPSByZXF1aXJlKCcuL3V0aWxzL3VybHMnKTtcbnZhciBQYWdlRGF0YSA9IHJlcXVpcmUoJy4vcGFnZS1kYXRhJyk7XG5cblxuLy8gQ29tcHV0ZSB0aGUgcGFnZXMgdGhhdCB3ZSBuZWVkIHRvIGZldGNoLiBUaGlzIGlzIGVpdGhlcjpcbi8vIDEuIEFueSBuZXN0ZWQgcGFnZXMgd2UgZmluZCB1c2luZyB0aGUgcGFnZSBzZWxlY3RvciBPUlxuLy8gMi4gVGhlIGN1cnJlbnQgd2luZG93IGxvY2F0aW9uXG5mdW5jdGlvbiBjb21wdXRlUGFnZXNQYXJhbSgkcGFnZUVsZW1lbnRBcnJheSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBncm91cElkID0gZ3JvdXBTZXR0aW5ncy5ncm91cElkKCk7XG4gICAgdmFyIHBhZ2VzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCAkcGFnZUVsZW1lbnRBcnJheS5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgJHBhZ2VFbGVtZW50ID0gJHBhZ2VFbGVtZW50QXJyYXlbaV07XG4gICAgICAgIHBhZ2VzLnB1c2goe1xuICAgICAgICAgICAgZ3JvdXBfaWQ6IGdyb3VwSWQsXG4gICAgICAgICAgICB1cmw6IFBhZ2VVdGlscy5jb21wdXRlUGFnZVVybCgkcGFnZUVsZW1lbnQsIGdyb3VwU2V0dGluZ3MpLFxuICAgICAgICAgICAgdGl0bGU6IFBhZ2VVdGlscy5jb21wdXRlUGFnZVRpdGxlKCRwYWdlRWxlbWVudCwgZ3JvdXBTZXR0aW5ncylcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGlmIChwYWdlcy5sZW5ndGggPT0gMSkge1xuICAgICAgICBwYWdlc1swXS5pbWFnZSA9IFBhZ2VVdGlscy5jb21wdXRlVG9wTGV2ZWxQYWdlSW1hZ2UoZ3JvdXBTZXR0aW5ncyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHsgcGFnZXM6IHBhZ2VzIH07XG59XG5cbmZ1bmN0aW9uIGxvYWRQYWdlRGF0YShwYWdlRGF0YVBhcmFtLCBncm91cFNldHRpbmdzKSB7XG4gICAgJC5nZXRKU09OUChVUkxzLnBhZ2VEYXRhVXJsKCksIHBhZ2VEYXRhUGFyYW0sIHN1Y2Nlc3MsIGVycm9yKTtcblxuICAgIGZ1bmN0aW9uIHN1Y2Nlc3MoanNvbikge1xuICAgICAgICAvL3NldFRpbWVvdXQoZnVuY3Rpb24oKSB7IFBhZ2VEYXRhLnVwZGF0ZUFsbFBhZ2VEYXRhKGpzb24sIGdyb3VwU2V0dGluZ3MpOyB9LCAzMDAwKTtcbiAgICAgICAgUGFnZURhdGEudXBkYXRlQWxsUGFnZURhdGEoanNvbiwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZXJyb3IobWVzc2FnZSkge1xuICAgICAgICAvLyBUT0RPIGhhbmRsZSBlcnJvcnMgdGhhdCBoYXBwZW4gd2hlbiBsb2FkaW5nIHBhZ2UgZGF0YVxuICAgICAgICBjb25zb2xlLmxvZygnQW4gZXJyb3Igb2NjdXJyZWQgbG9hZGluZyBwYWdlIGRhdGE6ICcgKyBtZXNzYWdlKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHN0YXJ0TG9hZGluZ1BhZ2VEYXRhKGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgJHBhZ2VFbGVtZW50cyA9ICQoZ3JvdXBTZXR0aW5ncy5wYWdlU2VsZWN0b3IoKSk7XG4gICAgaWYgKCRwYWdlRWxlbWVudHMubGVuZ3RoID09IDApIHtcbiAgICAgICAgJHBhZ2VFbGVtZW50cyA9ICQoJ2JvZHknKTtcbiAgICB9XG4gICAgcXVldWVQYWdlRGF0YUxvYWQoJHBhZ2VFbGVtZW50cywgZ3JvdXBTZXR0aW5ncyk7XG59XG5cbmZ1bmN0aW9uIHF1ZXVlUGFnZURhdGFMb2FkKCRwYWdlRWxlbWVudHMsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgcGFnZXNUb0xvYWQgPSBbXTtcbiAgICAkcGFnZUVsZW1lbnRzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkcGFnZUVsZW1lbnQgPSAkKHRoaXMpO1xuICAgICAgICBpZiAoaXNJblZpZXcoJHBhZ2VFbGVtZW50KSkge1xuICAgICAgICAgICAgcGFnZXNUb0xvYWQucHVzaCgkcGFnZUVsZW1lbnQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbG9hZFdoZW5WaXNpYmxlKCRwYWdlRWxlbWVudCwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIHZhciBwYWdlRGF0YVBhcmFtID0gY29tcHV0ZVBhZ2VzUGFyYW0ocGFnZXNUb0xvYWQsIGdyb3VwU2V0dGluZ3MpO1xuICAgIC8vIFRPRE86IGRlbGV0ZSB0aGUgY29tbWVudGVkIGxpbmUgYmVsb3csIHdoaWNoIGlzIGZvciB0ZXN0aW5nIHB1cnBvc2VzXG4gICAgLy9wYWdlRGF0YVBhcmFtID0ge3BhZ2VzOiBbe1wiZ3JvdXBfaWRcIjoxMTg0LCBcInVybFwiOlwiaHR0cDovL3d3dy5kdWtlY2hyb25pY2xlLmNvbS9hcnRpY2xlcy8yMDE0LzAyLzE0L3BvcnRyYWl0LXBvcm4tc3RhclwiLFwiY2Fub25pY2FsX3VybFwiOlwic2FtZVwiLFwidGl0bGVcIjpcIlBvcnRyYWl0IG9mIGEgcG9ybiBzdGFyXCIsXCJpbWFnZVwiOlwiXCJ9XX07XG4gICAgbG9hZFBhZ2VEYXRhKHBhZ2VEYXRhUGFyYW0sIGdyb3VwU2V0dGluZ3MpO1xufVxuXG5mdW5jdGlvbiBpc0luVmlldygkZWxlbWVudCkge1xuICAgIHZhciB0cmlnZ2VyRGlzdGFuY2UgPSAzMDA7XG4gICAgcmV0dXJuICRlbGVtZW50Lm9mZnNldCgpLnRvcCA8ICAkKGRvY3VtZW50KS5zY3JvbGxUb3AoKSArICQod2luZG93KS5oZWlnaHQoKSArIHRyaWdnZXJEaXN0YW5jZTtcbn1cblxuZnVuY3Rpb24gbG9hZFdoZW5WaXNpYmxlKCRwYWdlRWxlbWVudCwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBjaGVja1Zpc2liaWxpdHkgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKGlzSW5WaWV3KCRwYWdlRWxlbWVudCkpIHtcbiAgICAgICAgICAgIHZhciBwYWdlRGF0YVBhcmFtID0gY29tcHV0ZVBhZ2VzUGFyYW0oWyRwYWdlRWxlbWVudF0sIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgbG9hZFBhZ2VEYXRhKHBhZ2VEYXRhUGFyYW0sIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgVGhyb3R0bGVkRXZlbnRzLm9mZignc2Nyb2xsJywgY2hlY2tWaXNpYmlsaXR5KTtcbiAgICAgICAgICAgIFRocm90dGxlZEV2ZW50cy5vZmYoJ3Jlc2l6ZScsIGNoZWNrVmlzaWJpbGl0eSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFRocm90dGxlZEV2ZW50cy5vbignc2Nyb2xsJywgY2hlY2tWaXNpYmlsaXR5KTtcbiAgICBUaHJvdHRsZWRFdmVudHMub24oJ3Jlc2l6ZScsIGNoZWNrVmlzaWJpbGl0eSk7XG59XG5cbmZ1bmN0aW9uIHBhZ2VzQWRkZWQoJHBhZ2VFbGVtZW50cywgZ3JvdXBTZXR0aW5ncykge1xuICAgIHF1ZXVlUGFnZURhdGFMb2FkKCRwYWdlRWxlbWVudHMsIGdyb3VwU2V0dGluZ3MpO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgbG9hZDogc3RhcnRMb2FkaW5nUGFnZURhdGEsXG4gICAgcGFnZXNBZGRlZDogcGFnZXNBZGRlZFxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi91dGlscy9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcblxudmFyIHBhZ2VzID0ge307XG5cbmZ1bmN0aW9uIGdldFBhZ2VEYXRhKGhhc2gpIHtcbiAgICB2YXIgcGFnZURhdGEgPSBwYWdlc1toYXNoXTtcbiAgICBpZiAoIXBhZ2VEYXRhKSB7XG4gICAgICAgIC8vIFRPRE86IEdpdmUgdGhpcyBzZXJpb3VzIHRob3VnaHQuIEluIG9yZGVyIGZvciBtYWdpYyBtb2RlIHRvIHdvcmssIHRoZSBvYmplY3QgbmVlZHMgdG8gaGF2ZSB2YWx1ZXMgaW4gcGxhY2UgZm9yXG4gICAgICAgIC8vIHRoZSBvYnNlcnZlZCBwcm9wZXJ0aWVzIGF0IHRoZSBtb21lbnQgdGhlIHJhY3RpdmUgaXMgY3JlYXRlZC4gQnV0IHRoaXMgaXMgcHJldHR5IHVudXN1YWwgZm9yIEphdmFzY3JpcHQsIHRvIGhhdmVcbiAgICAgICAgLy8gdG8gZGVmaW5lIHRoZSB3aG9sZSBza2VsZXRvbiBmb3IgdGhlIG9iamVjdCBpbnN0ZWFkIG9mIGp1c3QgYWRkaW5nIHByb3BlcnRpZXMgd2hlbmV2ZXIgeW91IHdhbnQuXG4gICAgICAgIC8vIFRoZSBhbHRlcm5hdGl2ZSB3b3VsZCBiZSBmb3IgdXMgdG8ga2VlcCBvdXIgb3duIFwiZGF0YSBiaW5kaW5nXCIgYmV0d2VlbiB0aGUgcGFnZURhdGEgYW5kIHJhY3RpdmUgaW5zdGFuY2VzICgxIHRvIG1hbnkpXG4gICAgICAgIC8vIGFuZCB0ZWxsIHRoZSByYWN0aXZlcyB0byB1cGRhdGUgd2hlbmV2ZXIgdGhlIGRhdGEgY2hhbmdlcy5cbiAgICAgICAgcGFnZURhdGEgPSB7XG4gICAgICAgICAgICBwYWdlSGFzaDogaGFzaCxcbiAgICAgICAgICAgIHN1bW1hcnlSZWFjdGlvbnM6IHt9LFxuICAgICAgICAgICAgc3VtbWFyeVRvdGFsOiAwLFxuICAgICAgICAgICAgc3VtbWFyeUxvYWRlZDogZmFsc2UsXG4gICAgICAgICAgICBjb250YWluZXJzOiB7fVxuICAgICAgICB9O1xuICAgICAgICBwYWdlc1toYXNoXSA9IHBhZ2VEYXRhO1xuICAgIH1cbiAgICByZXR1cm4gcGFnZURhdGE7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZUFsbFBhZ2VEYXRhKGpzb25QYWdlcywgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBhbGxQYWdlcyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwganNvblBhZ2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGFsbFBhZ2VzLnB1c2godXBkYXRlUGFnZURhdGEoanNvblBhZ2VzW2ldLCBncm91cFNldHRpbmdzKSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiB1cGRhdGVQYWdlRGF0YShqc29uLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIHBhZ2VIYXNoID0ganNvbi5wYWdlSGFzaDtcbiAgICB2YXIgcGFnZURhdGEgPSBnZXRQYWdlRGF0YShwYWdlSGFzaCk7XG5cbiAgICAvLyBUT0RPOiBDYW4gd2UgZ2V0IGF3YXkgd2l0aCBqdXN0IHNldHRpbmcgcGFnZURhdGEgPSBqc29uIHdpdGhvdXQgYnJlYWtpbmcgUmFjdGl2ZSdzIGRhdGEgYmluZGluZz9cbiAgICB2YXIgc3VtbWFyeVJlYWN0aW9ucyA9IGpzb24uc3VtbWFyeVJlYWN0aW9ucztcbiAgICBwYWdlRGF0YS5zdW1tYXJ5UmVhY3Rpb25zID0gc3VtbWFyeVJlYWN0aW9ucztcbiAgICBzZXRDb250YWluZXJzKHBhZ2VEYXRhLCBqc29uLmNvbnRhaW5lcnMpO1xuXG4gICAgLy8gV2UgYWRkIHVwIHRoZSBzdW1tYXJ5IHJlYWN0aW9uIHRvdGFsIGNsaWVudC1zaWRlXG4gICAgdmFyIHRvdGFsID0gMDtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN1bW1hcnlSZWFjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdG90YWwgPSB0b3RhbCArIHN1bW1hcnlSZWFjdGlvbnNbaV0uY291bnQ7XG4gICAgfVxuICAgIHBhZ2VEYXRhLnN1bW1hcnlUb3RhbCA9IHRvdGFsO1xuICAgIHBhZ2VEYXRhLnN1bW1hcnlMb2FkZWQgPSB0cnVlO1xuXG4gICAgLy8gV2UgYWRkIHVwIHRoZSBjb250YWluZXIgcmVhY3Rpb24gdG90YWxzIGNsaWVudC1zaWRlXG4gICAgdmFyIHRvdGFsID0gMDtcbiAgICB2YXIgY29udGFpbmVyQ291bnRzID0gW107XG4gICAgdmFyIGNvbnRhaW5lcnMgPSBwYWdlRGF0YS5jb250YWluZXJzO1xuICAgIGZvciAodmFyIGhhc2ggaW4gY29udGFpbmVycykge1xuICAgICAgICBpZiAoY29udGFpbmVycy5oYXNPd25Qcm9wZXJ0eShoYXNoKSkge1xuICAgICAgICAgICAgdmFyIGNvbnRhaW5lciA9IGNvbnRhaW5lcnNbaGFzaF07XG4gICAgICAgICAgICB2YXIgdG90YWwgPSAwO1xuICAgICAgICAgICAgdmFyIGNvbnRhaW5lclJlYWN0aW9ucyA9IGNvbnRhaW5lci5yZWFjdGlvbnM7XG4gICAgICAgICAgICBpZiAoY29udGFpbmVyUmVhY3Rpb25zKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb250YWluZXJSZWFjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdG90YWwgPSB0b3RhbCArIGNvbnRhaW5lclJlYWN0aW9uc1tpXS5jb3VudDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb250YWluZXIucmVhY3Rpb25Ub3RhbCA9IHRvdGFsO1xuICAgICAgICAgICAgY29udGFpbmVyQ291bnRzLnB1c2goeyBjb3VudDogdG90YWwsIGNvbnRhaW5lcjogY29udGFpbmVyIH0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIHZhciBpbmRpY2F0b3JMaW1pdCA9IGdyb3VwU2V0dGluZ3MudGV4dEluZGljYXRvckxpbWl0KCk7XG4gICAgaWYgKGluZGljYXRvckxpbWl0KSB7XG4gICAgICAgIC8vIElmIGFuIGluZGljYXRvciBsaW1pdCBpcyBzZXQsIHNvcnQgdGhlIGNvbnRhaW5lcnMgYW5kIG1hcmsgb25seSB0aGUgdG9wIE4gdG8gYmUgdmlzaWJsZS5cbiAgICAgICAgY29udGFpbmVyQ291bnRzLnNvcnQoZnVuY3Rpb24oYSwgYikgeyByZXR1cm4gYi5jb3VudCAtIGEuY291bnQ7IH0pOyAvLyBzb3J0IGxhcmdlc3QgY291bnQgZmlyc3RcbiAgICAgICAgZm9yICh2YXIgaSA9IGluZGljYXRvckxpbWl0OyBpIDwgY29udGFpbmVyQ291bnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb250YWluZXJDb3VudHNbaV0uY29udGFpbmVyLnN1cHByZXNzID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIFRPRE8gQ29uc2lkZXIgc3VwcG9ydGluZyBpbmNyZW1lbnRhbCB1cGRhdGUgb2YgZGF0YSB0aGF0IHdlIGFscmVhZHkgaGF2ZSBmcm9tIHRoZSBzZXJ2ZXIuIFRoYXQgd291bGQgbWVhbiBvbmx5XG4gICAgLy8gdXBkYXRpbmcgZmllbGRzIGluIHRoZSBsb2NhbCBvYmplY3QgaWYgdGhleSBleGlzdCBpbiB0aGUganNvbiBkYXRhLlxuICAgIHBhZ2VEYXRhLmdyb3VwSWQgPSBncm91cFNldHRpbmdzLmdyb3VwSWQoKTtcbiAgICBwYWdlRGF0YS5wYWdlSWQgPSBqc29uLmlkO1xuICAgIHBhZ2VEYXRhLnBhZ2VIYXNoID0gcGFnZUhhc2g7XG5cbiAgICByZXR1cm4gcGFnZURhdGE7XG59XG5cbmZ1bmN0aW9uIGdldENvbnRhaW5lckRhdGEocGFnZURhdGEsIGNvbnRhaW5lckhhc2gpIHtcbiAgICB2YXIgY29udGFpbmVyRGF0YSA9IHBhZ2VEYXRhLmNvbnRhaW5lcnNbY29udGFpbmVySGFzaF07XG4gICAgaWYgKCFjb250YWluZXJEYXRhKSB7XG4gICAgICAgIGNvbnRhaW5lckRhdGEgPSB7XG4gICAgICAgICAgICBoYXNoOiBjb250YWluZXJIYXNoLFxuICAgICAgICAgICAgcmVhY3Rpb25Ub3RhbDogMCxcbiAgICAgICAgICAgIHJlYWN0aW9uczogW10sXG4gICAgICAgICAgICBsb2FkZWQ6IHBhZ2VEYXRhLnN1bW1hcnlMb2FkZWQsIC8vIFRPRE86IHNob3VsZCB0aGlzIGp1c3QgYmUgYSBsaXZlIGZ1bmN0aW9uIHRoYXQgZGVsZWdhdGVzIHRvIHN1bW1hcnlMb2FkZWQ/XG4gICAgICAgICAgICBzdXBwcmVzczogZmFsc2VcbiAgICAgICAgfTtcbiAgICAgICAgcGFnZURhdGEuY29udGFpbmVyc1tjb250YWluZXJIYXNoXSA9IGNvbnRhaW5lckRhdGE7XG4gICAgfVxuICAgIHJldHVybiBjb250YWluZXJEYXRhO1xufVxuXG4vLyBNZXJnZSB0aGUgZ2l2ZW4gY29udGFpbmVyIGRhdGEgaW50byB0aGUgcGFnZURhdGEuY29udGFpbmVycyBkYXRhLiBUaGlzIGlzIG5lY2Vzc2FyeSBiZWNhdXNlIHRoZSBza2VsZXRvbiBvZiB0aGUgcGFnZURhdGEuY29udGFpbmVycyBtYXBcbi8vIGlzIHNldCB1cCBhbmQgYm91bmQgdG8gdGhlIFVJIGJlZm9yZSBhbGwgdGhlIGRhdGEgaXMgZmV0Y2hlZCBmcm9tIHRoZSBzZXJ2ZXIgYW5kIHdlIGRvbid0IHdhbnQgdG8gYnJlYWsgdGhlIGRhdGEgYmluZGluZy5cbmZ1bmN0aW9uIHNldENvbnRhaW5lcnMocGFnZURhdGEsIGpzb25Db250YWluZXJzKSB7XG4gICAgZm9yICh2YXIgaGFzaCBpbiBqc29uQ29udGFpbmVycykge1xuICAgICAgICBpZiAoanNvbkNvbnRhaW5lcnMuaGFzT3duUHJvcGVydHkoaGFzaCkpIHtcbiAgICAgICAgICAgIHZhciBjb250YWluZXJEYXRhID0gZ2V0Q29udGFpbmVyRGF0YShwYWdlRGF0YSwgaGFzaCk7XG4gICAgICAgICAgICB2YXIgZmV0Y2hlZENvbnRhaW5lckRhdGEgPSBqc29uQ29udGFpbmVyc1toYXNoXTtcbiAgICAgICAgICAgIGNvbnRhaW5lckRhdGEuaWQgPSBmZXRjaGVkQ29udGFpbmVyRGF0YS5pZDtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZmV0Y2hlZENvbnRhaW5lckRhdGEucmVhY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY29udGFpbmVyRGF0YS5yZWFjdGlvbnMucHVzaChmZXRjaGVkQ29udGFpbmVyRGF0YS5yZWFjdGlvbnNbaV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHZhciBhbGxDb250YWluZXJzID0gcGFnZURhdGEuY29udGFpbmVycztcbiAgICBmb3IgKHZhciBoYXNoIGluIGFsbENvbnRhaW5lcnMpIHtcbiAgICAgICAgaWYgKGFsbENvbnRhaW5lcnMuaGFzT3duUHJvcGVydHkoaGFzaCkpIHtcbiAgICAgICAgICAgIHZhciBjb250YWluZXIgPSBhbGxDb250YWluZXJzW2hhc2hdO1xuICAgICAgICAgICAgY29udGFpbmVyLmxvYWRlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGNsZWFySW5kaWNhdG9yTGltaXQocGFnZURhdGEpIHtcbiAgICB2YXIgY29udGFpbmVycyA9IHBhZ2VEYXRhLmNvbnRhaW5lcnM7XG4gICAgZm9yICh2YXIgaGFzaCBpbiBjb250YWluZXJzKSB7XG4gICAgICAgIGlmIChjb250YWluZXJzLmhhc093blByb3BlcnR5KGhhc2gpKSB7XG4gICAgICAgICAgICB2YXIgY29udGFpbmVyID0gY29udGFpbmVyc1toYXNoXTtcbiAgICAgICAgICAgIGNvbnRhaW5lci5zdXBwcmVzcyA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxufVxuXG4vLyBSZXR1cm5zIHRoZSBsb2NhdGlvbnMgd2hlcmUgdGhlIGdpdmVuIHJlYWN0aW9uIG9jY3VycyBvbiB0aGUgcGFnZS4gVGhlIHJldHVybiBmb3JtYXQgaXM6XG4vLyB7XG4vLyAgIDxjb250ZW50X2lkPiA6IHtcbi8vICAgICBjb3VudDogPG51bWJlcj4sXG4vLyAgICAgaWQ6IDxjb250ZW50X2lkPixcbi8vICAgICBjb250YWluZXJJRDogPGNvbnRhaW5lcl9pZD5cbi8vICAgICBraW5kOiA8Y29udGVudCBraW5kPixcbi8vICAgICBsb2NhdGlvbjogPGxvY2F0aW9uPixcbi8vICAgICBbYm9keTogPGJvZHk+XSBmaWxsZWQgaW4gbGF0ZXIgdmlhIHVwZGF0ZUxvY2F0aW9uRGF0YVxuLy8gICB9XG4vLyB9XG5mdW5jdGlvbiBnZXRSZWFjdGlvbkxvY2F0aW9uRGF0YShyZWFjdGlvbiwgcGFnZURhdGEpIHtcbiAgICBpZiAoIXBhZ2VEYXRhLmxvY2F0aW9uRGF0YSkgeyAvLyBQb3B1bGF0ZSB0aGlzIHRyZWUgbGF6aWx5LCBzaW5jZSBpdCdzIG5vdCBmcmVxdWVudGx5IHVzZWQuXG4gICAgICAgIHBhZ2VEYXRhLmxvY2F0aW9uRGF0YSA9IGNvbXB1dGVMb2NhdGlvbkRhdGEocGFnZURhdGEpO1xuICAgIH1cbiAgICByZXR1cm4gcGFnZURhdGEubG9jYXRpb25EYXRhW3JlYWN0aW9uLmlkXTtcbn1cblxuLy8gUmV0dXJucyBhIHZpZXcgb24gdGhlIGdpdmVuIHRyZWUgc3RydWN0dXJlIHRoYXQncyBvcHRpbWl6ZWQgZm9yIHJlbmRlcmluZyB0aGUgbG9jYXRpb24gb2YgcmVhY3Rpb25zIChhcyBmcm9tIHRoZVxuLy8gc3VtbWFyeSB3aWRnZXQpLiBGb3IgZWFjaCByZWFjdGlvbiwgd2UgY2FuIHF1aWNrbHkgZ2V0IHRvIHRoZSBwaWVjZXMgb2YgY29udGVudCB0aGF0IGhhdmUgdGhhdCByZWFjdGlvbiBhcyB3ZWxsIGFzXG4vLyB0aGUgY291bnQgb2YgdGhvc2UgcmVhY3Rpb25zIGZvciBlYWNoIHBpZWNlIG9mIGNvbnRlbnQuXG4vL1xuLy8gVGhlIHN0cnVjdHVyZSBsb29rcyBsaWtlIHRoaXM6XG4vLyB7XG4vLyAgIDxyZWFjdGlvbl9pZD4gOiB7ICAgKHRoaXMgaXMgdGhlIGludGVyYWN0aW9uX25vZGVfaWQpXG4vLyAgICAgPGNvbnRlbnRfaWQ+IDoge1xuLy8gICAgICAgY291bnQgOiA8bnVtYmVyPixcbi8vICAgICAgIGNvbnRhaW5lcklEOiA8Y29udGFpbmVyX2lkPixcbi8vICAgICAgIGtpbmQ6IDxjb250ZW50IGtpbmQ+LFxuLy8gICAgICAgbG9jYXRpb246IDxsb2NhdGlvbj5cbi8vICAgICAgIFtib2R5OiA8Ym9keT5dIGZpbGxlZCBpbiBsYXRlciB2aWEgdXBkYXRlTG9jYXRpb25EYXRhXG4vLyAgICAgfVxuLy8gICB9XG4vLyB9XG5mdW5jdGlvbiBjb21wdXRlTG9jYXRpb25EYXRhKHBhZ2VEYXRhKSB7XG4gICAgdmFyIGxvY2F0aW9uRGF0YSA9IHt9O1xuICAgIHZhciBjb250YWluZXJzID0gcGFnZURhdGEuY29udGFpbmVycztcbiAgICBmb3IgKHZhciBoYXNoIGluIGNvbnRhaW5lcnMpIHtcbiAgICAgICAgaWYgKGNvbnRhaW5lcnMuaGFzT3duUHJvcGVydHkoaGFzaCkpIHtcbiAgICAgICAgICAgIHZhciBjb250YWluZXJEYXRhID0gY29udGFpbmVyc1toYXNoXTtcbiAgICAgICAgICAgIHZhciByZWFjdGlvbnMgPSBjb250YWluZXJEYXRhLnJlYWN0aW9ucztcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmVhY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJlYWN0aW9uID0gcmVhY3Rpb25zW2ldO1xuICAgICAgICAgICAgICAgIHZhciByZWFjdGlvbl9pZCA9IHJlYWN0aW9uLmlkO1xuICAgICAgICAgICAgICAgIHZhciBjb250ZW50ID0gcmVhY3Rpb24uY29udGVudDtcbiAgICAgICAgICAgICAgICB2YXIgY29udGVudF9pZCA9IGNvbnRlbnQuaWQ7XG4gICAgICAgICAgICAgICAgdmFyIHJlYWN0aW9uTG9jYXRpb25EYXRhID0gbG9jYXRpb25EYXRhW3JlYWN0aW9uX2lkXTtcbiAgICAgICAgICAgICAgICBpZiAoIXJlYWN0aW9uTG9jYXRpb25EYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlYWN0aW9uTG9jYXRpb25EYXRhID0ge307XG4gICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uRGF0YVtyZWFjdGlvbl9pZF0gPSByZWFjdGlvbkxvY2F0aW9uRGF0YTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIGNvbnRlbnRMb2NhdGlvbkRhdGEgPSByZWFjdGlvbkxvY2F0aW9uRGF0YVtjb250ZW50X2lkXTsgLy8gVE9ETzogSXQncyBub3QgcmVhbGx5IHBvc3NpYmxlIHRvIGdldCBhIGhpdCBoZXJlLCBpcyBpdD8gV2Ugc2hvdWxkIG5ldmVyIHNlZSB0d28gaW5zdGFuY2VzIG9mIHRoZSBzYW1lIHJlYWN0aW9uIGZvciB0aGUgc2FtZSBjb250ZW50PyAoVGhlcmUnZCB3b3VsZCBqdXN0IGJlIG9uZSBpbnN0YW5jZSB3aXRoIGEgY291bnQgPiAxLilcbiAgICAgICAgICAgICAgICBpZiAoIWNvbnRlbnRMb2NhdGlvbkRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGVudExvY2F0aW9uRGF0YSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50OiAwLFxuICAgICAgICAgICAgICAgICAgICAgICAga2luZDogY29udGVudC5raW5kLCAvLyBUT0RPOiBXZSBzaG91bGQgbm9ybWFsaXplIHRoaXMgdmFsdWUgdG8gYSBzZXQgb2YgY29uc3RhbnRzLiBmaXggdGhpcyBpbiBsb2NhdGlvbnMtcGFnZSB3aGVyZSB0aGUgdmFsdWUgaXMgcmVhZCBhcyB3ZWxsXG4gICAgICAgICAgICAgICAgICAgICAgICBsb2NhdGlvbjogY29udGVudC5sb2NhdGlvbixcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lckhhc2g6IGNvbnRhaW5lckRhdGEuaGFzaFxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICByZWFjdGlvbkxvY2F0aW9uRGF0YVtjb250ZW50X2lkXSA9IGNvbnRlbnRMb2NhdGlvbkRhdGE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnRlbnRMb2NhdGlvbkRhdGEuY291bnQgKz0gcmVhY3Rpb24uY291bnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGxvY2F0aW9uRGF0YTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlUmVhY3Rpb25Mb2NhdGlvbkRhdGEocmVhY3Rpb25Mb2NhdGlvbkRhdGEsIGNvbnRlbnRCb2RpZXMpIHtcbiAgICBmb3IgKHZhciBjb250ZW50SUQgaW4gY29udGVudEJvZGllcykge1xuICAgICAgICBpZiAoY29udGVudEJvZGllcy5oYXNPd25Qcm9wZXJ0eShjb250ZW50SUQpKSB7XG4gICAgICAgICAgICB2YXIgY29udGVudExvY2F0aW9uRGF0YSA9IHJlYWN0aW9uTG9jYXRpb25EYXRhW2NvbnRlbnRJRF07XG4gICAgICAgICAgICBpZiAoY29udGVudExvY2F0aW9uRGF0YSkge1xuICAgICAgICAgICAgICAgIGNvbnRlbnRMb2NhdGlvbkRhdGEuYm9keSA9IGNvbnRlbnRCb2RpZXNbY29udGVudElEXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gcmVnaXN0ZXJSZWFjdGlvbihyZWFjdGlvbiwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEpIHtcbiAgICB2YXIgZXhpc3RpbmdSZWFjdGlvbnMgPSBjb250YWluZXJEYXRhLnJlYWN0aW9ucztcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGV4aXN0aW5nUmVhY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChleGlzdGluZ1JlYWN0aW9uc1tpXS5pZCA9PT0gcmVhY3Rpb24uaWQpIHtcbiAgICAgICAgICAgIC8vIFRoaXMgcmVhY3Rpb24gaGFzIGFscmVhZHkgYmVlbiBhZGRlZCB0byB0aGlzIGNvbnRhaW5lci4gRG9uJ3QgYWRkIGl0IGFnYWluLlxuICAgICAgICAgICAgcmV0dXJuIGV4aXN0aW5nUmVhY3Rpb25zW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIGNvbnRhaW5lckRhdGEucmVhY3Rpb25zLnB1c2gocmVhY3Rpb24pO1xuICAgIGNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbCA9IGNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbCArIDE7XG4gICAgdmFyIHN1bW1hcnlSZWFjdGlvbiA9IHtcbiAgICAgICAgdGV4dDogcmVhY3Rpb24udGV4dCxcbiAgICAgICAgaWQ6IHJlYWN0aW9uLmlkLFxuICAgICAgICBjb3VudDogcmVhY3Rpb24uY291bnRcbiAgICB9O1xuICAgIHBhZ2VEYXRhLnN1bW1hcnlSZWFjdGlvbnMucHVzaChzdW1tYXJ5UmVhY3Rpb24pO1xuICAgIHBhZ2VEYXRhLnN1bW1hcnlUb3RhbCA9IHBhZ2VEYXRhLnN1bW1hcnlUb3RhbCArIDE7XG4gICAgcmV0dXJuIHJlYWN0aW9uO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgZ2V0UGFnZURhdGE6IGdldFBhZ2VEYXRhLFxuICAgIHVwZGF0ZUFsbFBhZ2VEYXRhOiB1cGRhdGVBbGxQYWdlRGF0YSxcbiAgICBnZXRDb250YWluZXJEYXRhOiBnZXRDb250YWluZXJEYXRhLFxuICAgIGdldFJlYWN0aW9uTG9jYXRpb25EYXRhOiBnZXRSZWFjdGlvbkxvY2F0aW9uRGF0YSxcbiAgICB1cGRhdGVSZWFjdGlvbkxvY2F0aW9uRGF0YTogdXBkYXRlUmVhY3Rpb25Mb2NhdGlvbkRhdGEsXG4gICAgcmVnaXN0ZXJSZWFjdGlvbjogcmVnaXN0ZXJSZWFjdGlvbixcbiAgICBjbGVhckluZGljYXRvckxpbWl0OiBjbGVhckluZGljYXRvckxpbWl0XG59OyIsInZhciAkOyByZXF1aXJlKCcuL3V0aWxzL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIEFwcE1vZGUgPSByZXF1aXJlKCcuL3V0aWxzL2FwcC1tb2RlJyk7XG52YXIgSGFzaCA9IHJlcXVpcmUoJy4vdXRpbHMvaGFzaCcpO1xudmFyIE11dGF0aW9uT2JzZXJ2ZXIgPSByZXF1aXJlKCcuL3V0aWxzL211dGF0aW9uLW9ic2VydmVyJyk7XG52YXIgUGFnZVV0aWxzID0gcmVxdWlyZSgnLi91dGlscy9wYWdlLXV0aWxzJyk7XG52YXIgVVJMcyA9IHJlcXVpcmUoJy4vdXRpbHMvdXJscycpO1xudmFyIFdpZGdldEJ1Y2tldCA9IHJlcXVpcmUoJy4vdXRpbHMvd2lkZ2V0LWJ1Y2tldCcpO1xuXG52YXIgQXV0b0NhbGxUb0FjdGlvbiA9IHJlcXVpcmUoJy4vYXV0by1jYWxsLXRvLWFjdGlvbicpO1xudmFyIENhbGxUb0FjdGlvbkluZGljYXRvciA9IHJlcXVpcmUoJy4vY2FsbC10by1hY3Rpb24taW5kaWNhdG9yJyk7XG52YXIgSGFzaGVkRWxlbWVudHMgPSByZXF1aXJlKCcuL2hhc2hlZC1lbGVtZW50cycpO1xudmFyIE1lZGlhSW5kaWNhdG9yV2lkZ2V0ID0gcmVxdWlyZSgnLi9tZWRpYS1pbmRpY2F0b3Itd2lkZ2V0Jyk7XG52YXIgUGFnZURhdGEgPSByZXF1aXJlKCcuL3BhZ2UtZGF0YScpO1xudmFyIFBhZ2VEYXRhTG9hZGVyID0gcmVxdWlyZSgnLi9wYWdlLWRhdGEtbG9hZGVyJyk7XG52YXIgU3VtbWFyeVdpZGdldCA9IHJlcXVpcmUoJy4vc3VtbWFyeS13aWRnZXQnKTtcbnZhciBUZXh0SW5kaWNhdG9yV2lkZ2V0ID0gcmVxdWlyZSgnLi90ZXh0LWluZGljYXRvci13aWRnZXQnKTtcbnZhciBUZXh0UmVhY3Rpb25zID0gcmVxdWlyZSgnLi90ZXh0LXJlYWN0aW9ucycpO1xuXG52YXIgVFlQRV9URVhUID0gXCJ0ZXh0XCI7XG52YXIgVFlQRV9JTUFHRSA9IFwiaW1hZ2VcIjtcbnZhciBUWVBFX01FRElBID0gXCJtZWRpYVwiO1xuXG52YXIgQVRUUl9IQVNIID0gXCJhbnQtaGFzaFwiO1xuXG5cbi8vIFNjYW4gZm9yIGFsbCBwYWdlcyBhdCB0aGUgY3VycmVudCBicm93c2VyIGxvY2F0aW9uLiBUaGlzIGNvdWxkIGp1c3QgYmUgdGhlIGN1cnJlbnQgcGFnZSBvciBpdCBjb3VsZCBiZSBhIGNvbGxlY3Rpb25cbi8vIG9mIHBhZ2VzIChha2EgJ3Bvc3RzJykuXG5mdW5jdGlvbiBzY2FuQWxsUGFnZXMoZ3JvdXBTZXR0aW5ncykge1xuICAgICQoZ3JvdXBTZXR0aW5ncy5leGNsdXNpb25TZWxlY3RvcigpKS5hZGRDbGFzcygnbm8tYW50Jyk7IC8vIEFkZCB0aGUgbm8tYW50IGNsYXNzIHRvIGV2ZXJ5dGhpbmcgdGhhdCBpcyBmbGFnZ2VkIGZvciBleGNsdXNpb25cbiAgICB2YXIgJHBhZ2VzID0gJChncm91cFNldHRpbmdzLnBhZ2VTZWxlY3RvcigpKTsgLy8gVE9ETzogbm8tYW50P1xuICAgIGlmICgkcGFnZXMubGVuZ3RoID09IDApIHtcbiAgICAgICAgLy8gSWYgd2UgZG9uJ3QgZGV0ZWN0IGFueSBwYWdlIG1hcmtlcnMsIHRyZWF0IHRoZSB3aG9sZSBkb2N1bWVudCBhcyB0aGUgc2luZ2xlIHBhZ2VcbiAgICAgICAgJHBhZ2VzID0gJCgnYm9keScpOyAvLyBUT0RPOiBJcyB0aGlzIHRoZSByaWdodCBiZWhhdmlvcj8gKEtlZXAgaW4gc3luYyB3aXRoIHRoZSBzYW1lIGFzc3VtcHRpb24gdGhhdCdzIGJ1aWx0IGludG8gcGFnZS1kYXRhLWxvYWRlci4pXG4gICAgfVxuICAgICRwYWdlcy5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgJHBhZ2UgPSAkKHRoaXMpO1xuICAgICAgICBzY2FuUGFnZSgkcGFnZSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgfSk7XG4gICAgTXV0YXRpb25PYnNlcnZlci5hZGRBZGRpdGlvbkxpc3RlbmVyKGVsZW1lbnRzQWRkZWQoZ3JvdXBTZXR0aW5ncykpO1xufVxuXG4vLyBTY2FuIHRoZSBwYWdlIHVzaW5nIHRoZSBnaXZlbiBzZXR0aW5nczpcbi8vIDEuIEZpbmQgYWxsIHRoZSBjb250YWluZXJzIHRoYXQgd2UgY2FyZSBhYm91dC5cbi8vIDIuIENvbXB1dGUgaGFzaGVzIGZvciBlYWNoIGNvbnRhaW5lci5cbi8vIDMuIEluc2VydCB3aWRnZXQgYWZmb3JkYW5jZXMgZm9yIGVhY2ggd2hpY2ggYXJlIGJvdW5kIHRvIHRoZSBkYXRhIG1vZGVsIGJ5IHRoZSBoYXNoZXMuXG5mdW5jdGlvbiBzY2FuUGFnZSgkcGFnZSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciB1cmwgPSBQYWdlVXRpbHMuY29tcHV0ZVBhZ2VVcmwoJHBhZ2UsIGdyb3VwU2V0dGluZ3MpO1xuICAgIHZhciB1cmxIYXNoID0gSGFzaC5oYXNoVXJsKHVybCk7XG4gICAgaWYgKEFwcE1vZGUuZGVidWcpIHtcbiAgICAgICAgJHBhZ2UuYXR0cignYW50LWhhc2gnLCB1cmxIYXNoKTtcbiAgICB9XG4gICAgdmFyIHBhZ2VEYXRhID0gUGFnZURhdGEuZ2V0UGFnZURhdGEodXJsSGFzaCk7XG4gICAgdmFyICRhY3RpdmVTZWN0aW9ucyA9IGZpbmQoJHBhZ2UsIGdyb3VwU2V0dGluZ3MuYWN0aXZlU2VjdGlvbnMoKSwgdHJ1ZSk7XG5cbiAgICAvLyBGaXJzdCwgc2NhbiBmb3IgZWxlbWVudHMgdGhhdCB3b3VsZCBjYXVzZSB1cyB0byBpbnNlcnQgc29tZXRoaW5nIGludG8gdGhlIERPTSB0aGF0IHRha2VzIHVwIHNwYWNlLlxuICAgIC8vIFdlIHdhbnQgdG8gZ2V0IGFueSBwYWdlIHJlc2l6aW5nIG91dCBvZiB0aGUgd2F5IGFzIGVhcmx5IGFzIHBvc3NpYmxlLlxuICAgIC8vIFRPRE86IENvbnNpZGVyIGRvaW5nIHRoaXMgd2l0aCByYXcgSmF2YXNjcmlwdCBiZWZvcmUgalF1ZXJ5IGxvYWRzLCB0byBmdXJ0aGVyIHJlZHVjZSB0aGUgZGVsYXkuIFdlIHdvdWxkbid0XG4gICAgLy8gc2F2ZSBhICp0b24qIG9mIHRpbWUgZnJvbSB0aGlzLCB0aG91Z2gsIHNvIGl0J3MgZGVmaW5pdGVseSBhIGxhdGVyIG9wdGltaXphdGlvbi5cbiAgICBzY2FuRm9yU3VtbWFyaWVzKCRwYWdlLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7IC8vIFRPRE86IHNob3VsZCB0aGUgc3VtbWFyeSBzZWFyY2ggYmUgY29uZmluZWQgdG8gdGhlIGFjdGl2ZSBzZWN0aW9ucz9cbiAgICAkYWN0aXZlU2VjdGlvbnMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRzZWN0aW9uID0gJCh0aGlzKTtcbiAgICAgICAgY3JlYXRlQXV0b0NhbGxzVG9BY3Rpb24oJHNlY3Rpb24sIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICB9KTtcbiAgICAvLyBTY2FuIGZvciBDVEFzIGFjcm9zcyB0aGUgZW50aXJlIHBhZ2UgKHRoZXkgY2FuIGJlIG91dHNpZGUgYW4gYWN0aXZlIHNlY3Rpb24pLiBDVEFzIGhhdmUgdG8gZ28gYmVmb3JlIHNjYW5zIGZvclxuICAgIC8vIGNvbnRlbnQgYmVjYXVzZSBjb250ZW50IGludm9sdmVkIGluIENUQXMgd2lsbCBiZSB0YWdnZWQgbm8tYW50LlxuICAgIHNjYW5Gb3JDYWxsc1RvQWN0aW9uKCRwYWdlLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgLy8gVGhlbiBzY2FuIGZvciBldmVyeXRoaW5nIGVsc2VcbiAgICAkYWN0aXZlU2VjdGlvbnMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRzZWN0aW9uID0gJCh0aGlzKTtcbiAgICAgICAgc2NhbkFjdGl2ZUVsZW1lbnQoJHNlY3Rpb24sIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICB9KTtcbn1cblxuLy8gU2NhbnMgdGhlIGdpdmVuIGVsZW1lbnQsIHdoaWNoIGFwcGVhcnMgaW5zaWRlIGFuIGFjdGl2ZSBzZWN0aW9uLiBUaGUgZWxlbWVudCBjYW4gYmUgdGhlIGVudGlyZSBhY3RpdmUgc2VjdGlvbixcbi8vIHNvbWUgY29udGFpbmVyIHdpdGhpbiB0aGUgYWN0aXZlIHNlY3Rpb24sIG9yIGEgbGVhZiBub2RlIGluIHRoZSBhY3RpdmUgc2VjdGlvbi5cbmZ1bmN0aW9uIHNjYW5BY3RpdmVFbGVtZW50KCRlbGVtZW50LCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHNjYW5Gb3JDb250ZW50KCRlbGVtZW50LCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG59XG5cbmZ1bmN0aW9uIHNjYW5Gb3JTdW1tYXJpZXMoJGVsZW1lbnQsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyICRzdW1tYXJpZXMgPSBmaW5kKCRlbGVtZW50LCBncm91cFNldHRpbmdzLnN1bW1hcnlTZWxlY3RvcigpLCB0cnVlKTtcbiAgICAkc3VtbWFyaWVzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkc3VtbWFyeSA9ICQodGhpcyk7XG4gICAgICAgIHZhciBjb250YWluZXJEYXRhID0gUGFnZURhdGEuZ2V0Q29udGFpbmVyRGF0YShwYWdlRGF0YSwgJ3BhZ2UnKTsgLy8gTWFnaWMgaGFzaCBmb3IgcGFnZSByZWFjdGlvbnNcbiAgICAgICAgY29udGFpbmVyRGF0YS50eXBlID0gJ3BhZ2UnOyAvLyBUT0RPOiByZXZpc2l0IHdoZXRoZXIgaXQgbWFrZXMgc2Vuc2UgdG8gc2V0IHRoZSB0eXBlIGhlcmVcbiAgICAgICAgdmFyIGRlZmF1bHRSZWFjdGlvbnMgPSBncm91cFNldHRpbmdzLmRlZmF1bHRSZWFjdGlvbnMoJHN1bW1hcnkpOyAvLyBUT0RPOiBkbyB3ZSBzdXBwb3J0IGN1c3RvbWl6aW5nIHRoZSBkZWZhdWx0IHJlYWN0aW9ucyBhdCB0aGlzIGxldmVsP1xuICAgICAgICB2YXIgJHN1bW1hcnlFbGVtZW50ID0gU3VtbWFyeVdpZGdldC5jcmVhdGUoY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGRlZmF1bHRSZWFjdGlvbnMsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICBpbnNlcnRDb250ZW50KCRzdW1tYXJ5LCAkc3VtbWFyeUVsZW1lbnQsIGdyb3VwU2V0dGluZ3Muc3VtbWFyeU1ldGhvZCgpKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gc2NhbkZvckNhbGxzVG9BY3Rpb24oJGVsZW1lbnQsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGN0YVRhcmdldHMgPSB7fTsgLy8gVGhlIGVsZW1lbnRzIHRoYXQgdGhlIGNhbGwgdG8gYWN0aW9ucyBhY3Qgb24gKGUuZy4gdGhlIGltYWdlIG9yIHZpZGVvKVxuICAgIGZpbmQoJGVsZW1lbnQsICdbYW50LWl0ZW1dJywgdHJ1ZSkuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRjdGFUYXJnZXQgPSAkKHRoaXMpO1xuICAgICAgICAkY3RhVGFyZ2V0LmFkZENsYXNzKCduby1hbnQnKTsgLy8gZG9uJ3Qgc2hvdyB0aGUgbm9ybWFsIHJlYWN0aW9uIGFmZm9yZGFuY2Ugb24gYSBjdGEgdGFyZ2V0XG4gICAgICAgIHZhciBhbnRJdGVtSWQgPSAkY3RhVGFyZ2V0LmF0dHIoJ2FudC1pdGVtJykudHJpbSgpO1xuICAgICAgICBjdGFUYXJnZXRzW2FudEl0ZW1JZF0gPSAkY3RhVGFyZ2V0O1xuICAgIH0pO1xuXG4gICAgdmFyIGN0YUxhYmVscyA9IHt9OyAvLyBUaGUgb3B0aW9uYWwgZWxlbWVudHMgdGhhdCByZXBvcnQgdGhlIG51bWJlciBvZiByZWFjdGlvbnMgdG8gdGhlIGN0YVxuICAgIGZpbmQoJGVsZW1lbnQsICdbYW50LXJlYWN0aW9ucy1sYWJlbC1mb3JdJywgdHJ1ZSkuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRjdGFMYWJlbCA9ICQodGhpcyk7XG4gICAgICAgICRjdGFMYWJlbC5hZGRDbGFzcygnbm8tYW50Jyk7IC8vIGRvbid0IHNob3cgdGhlIG5vcm1hbCByZWFjdGlvbiBhZmZvcmRhbmNlIG9uIGEgY3RhIGxhYmVsXG4gICAgICAgIHZhciBhbnRJdGVtSWQgPSAkY3RhTGFiZWwuYXR0cignYW50LXJlYWN0aW9ucy1sYWJlbC1mb3InKS50cmltKCk7XG4gICAgICAgIGN0YUxhYmVsc1thbnRJdGVtSWRdID0gJGN0YUxhYmVsO1xuICAgIH0pO1xuXG4gICAgdmFyICRjdGFFbGVtZW50cyA9IGZpbmQoJGVsZW1lbnQsICdbYW50LWN0YS1mb3JdJyk7IC8vIFRoZSBjYWxsIHRvIGFjdGlvbiBlbGVtZW50cyB3aGljaCBwcm9tcHQgdGhlIHVzZXIgdG8gcmVhY3RcbiAgICAkY3RhRWxlbWVudHMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRjdGFFbGVtZW50ID0gJCh0aGlzKTtcbiAgICAgICAgdmFyIGFudEl0ZW1JZCA9ICRjdGFFbGVtZW50LmF0dHIoJ2FudC1jdGEtZm9yJyk7XG4gICAgICAgIHZhciAkdGFyZ2V0RWxlbWVudCA9IGN0YVRhcmdldHNbYW50SXRlbUlkXTtcbiAgICAgICAgaWYgKCR0YXJnZXRFbGVtZW50KSB7XG4gICAgICAgICAgICB2YXIgaGFzaCA9IGNvbXB1dGVIYXNoKCR0YXJnZXRFbGVtZW50LCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICB2YXIgY29udGVudERhdGEgPSBjb21wdXRlQ29udGVudERhdGEoJHRhcmdldEVsZW1lbnQsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgaWYgKGhhc2ggJiYgY29udGVudERhdGEpIHtcbiAgICAgICAgICAgICAgICB2YXIgY29udGFpbmVyRGF0YSA9IFBhZ2VEYXRhLmdldENvbnRhaW5lckRhdGEocGFnZURhdGEsIGhhc2gpO1xuICAgICAgICAgICAgICAgIGNvbnRhaW5lckRhdGEudHlwZSA9IGNvbXB1dGVFbGVtZW50VHlwZSgkdGFyZ2V0RWxlbWVudCk7IC8vIFRPRE86IHJldmlzaXQgd2hldGhlciBpdCBtYWtlcyBzZW5zZSB0byBzZXQgdGhlIHR5cGUgaGVyZVxuICAgICAgICAgICAgICAgIENhbGxUb0FjdGlvbkluZGljYXRvci5jcmVhdGUoe1xuICAgICAgICAgICAgICAgICAgICBjb250YWluZXJEYXRhOiBjb250YWluZXJEYXRhLFxuICAgICAgICAgICAgICAgICAgICBjb250YWluZXJFbGVtZW50OiAkdGFyZ2V0RWxlbWVudCxcbiAgICAgICAgICAgICAgICAgICAgY29udGVudERhdGE6IGNvbnRlbnREYXRhLFxuICAgICAgICAgICAgICAgICAgICBjdGFFbGVtZW50OiAkY3RhRWxlbWVudCxcbiAgICAgICAgICAgICAgICAgICAgY3RhTGFiZWw6IGN0YUxhYmVsc1thbnRJdGVtSWRdLFxuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0UmVhY3Rpb25zOiBncm91cFNldHRpbmdzLmRlZmF1bHRSZWFjdGlvbnMoJHRhcmdldEVsZW1lbnQpLFxuICAgICAgICAgICAgICAgICAgICBwYWdlRGF0YTogcGFnZURhdGEsXG4gICAgICAgICAgICAgICAgICAgIGdyb3VwU2V0dGluZ3M6IGdyb3VwU2V0dGluZ3NcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pXG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUF1dG9DYWxsc1RvQWN0aW9uKCRzZWN0aW9uLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciAkY3RhVGFyZ2V0cyA9IGZpbmQoJHNlY3Rpb24sIGdyb3VwU2V0dGluZ3MuZ2VuZXJhdGVkQ3RhU2VsZWN0b3IoKSk7XG4gICAgJGN0YVRhcmdldHMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRjdGFUYXJnZXQgPSAkKHRoaXMpO1xuICAgICAgICB2YXIgYW50SXRlbUlkID0gZ2VuZXJhdGVBbnRJdGVtQXR0cmlidXRlKCk7XG4gICAgICAgICRjdGFUYXJnZXQuYXR0cignYW50LWl0ZW0nLCBhbnRJdGVtSWQpO1xuICAgICAgICB2YXIgJGN0YSA9IEF1dG9DYWxsVG9BY3Rpb24uY3JlYXRlKGFudEl0ZW1JZCk7XG4gICAgICAgICRjdGFUYXJnZXQuYWZ0ZXIoJGN0YSk7IC8vIFRPRE86IG1ha2UgdGhlIGluc2VydCBiZWhhdmlvciBjb25maWd1cmFibGUgbGlrZSB0aGUgc3VtbWFyeVxuICAgIH0pO1xufVxuXG52YXIgZ2VuZXJhdGVBbnRJdGVtQXR0cmlidXRlID0gZnVuY3Rpb24oaW5kZXgpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiAnYW50ZW5uYV9hdXRvX2N0YV8nICsgaW5kZXgrKztcbiAgICB9XG59KDApO1xuXG5mdW5jdGlvbiBzY2FuRm9yQ29udGVudCgkZWxlbWVudCwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgJGNvbnRlbnRFbGVtZW50cyA9IGZpbmQoJGVsZW1lbnQsIGdyb3VwU2V0dGluZ3MuY29udGVudFNlbGVjdG9yKCksIHRydWUpO1xuICAgICRjb250ZW50RWxlbWVudHMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRjb250ZW50RWxlbWVudCA9ICQodGhpcyk7XG4gICAgICAgIHZhciB0eXBlID0gY29tcHV0ZUVsZW1lbnRUeXBlKCRjb250ZW50RWxlbWVudCk7XG4gICAgICAgIHN3aXRjaCh0eXBlKSB7XG4gICAgICAgICAgICBjYXNlIFRZUEVfSU1BR0U6XG4gICAgICAgICAgICBjYXNlIFRZUEVfTUVESUE6XG4gICAgICAgICAgICAgICAgc2Nhbk1lZGlhKCRjb250ZW50RWxlbWVudCwgdHlwZSwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBUWVBFX1RFWFQ6XG4gICAgICAgICAgICAgICAgc2NhblRleHQoJGNvbnRlbnRFbGVtZW50LCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gc2NhblRleHQoJHRleHRFbGVtZW50LCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIGlmIChzaG91bGRIYXNoVGV4dCgkdGV4dEVsZW1lbnQsIGdyb3VwU2V0dGluZ3MpKSB7XG4gICAgICAgIHZhciBoYXNoID0gY29tcHV0ZUhhc2goJHRleHRFbGVtZW50LCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIGlmIChoYXNoKSB7XG4gICAgICAgICAgICB2YXIgY29udGFpbmVyRGF0YSA9IFBhZ2VEYXRhLmdldENvbnRhaW5lckRhdGEocGFnZURhdGEsIGhhc2gpO1xuICAgICAgICAgICAgY29udGFpbmVyRGF0YS50eXBlID0gJ3RleHQnOyAvLyBUT0RPOiByZXZpc2l0IHdoZXRoZXIgaXQgbWFrZXMgc2Vuc2UgdG8gc2V0IHRoZSB0eXBlIGhlcmVcbiAgICAgICAgICAgIHZhciBkZWZhdWx0UmVhY3Rpb25zID0gZ3JvdXBTZXR0aW5ncy5kZWZhdWx0UmVhY3Rpb25zKCR0ZXh0RWxlbWVudCk7XG4gICAgICAgICAgICB2YXIgJGluZGljYXRvckVsZW1lbnQgPSBUZXh0SW5kaWNhdG9yV2lkZ2V0LmNyZWF0ZSh7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lckRhdGE6IGNvbnRhaW5lckRhdGEsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lckVsZW1lbnQ6ICR0ZXh0RWxlbWVudCxcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdFJlYWN0aW9uczogZGVmYXVsdFJlYWN0aW9ucyxcbiAgICAgICAgICAgICAgICAgICAgcGFnZURhdGE6IHBhZ2VEYXRhLFxuICAgICAgICAgICAgICAgICAgICBncm91cFNldHRpbmdzOiBncm91cFNldHRpbmdzXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHZhciBsYXN0Tm9kZSA9IGxhc3RDb250ZW50Tm9kZSgkdGV4dEVsZW1lbnQuZ2V0KDApKTtcbiAgICAgICAgICAgIGlmIChsYXN0Tm9kZS5ub2RlVHlwZSAhPT0gMykge1xuICAgICAgICAgICAgICAgICQobGFzdE5vZGUpLmJlZm9yZSgkaW5kaWNhdG9yRWxlbWVudCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICR0ZXh0RWxlbWVudC5hcHBlbmQoJGluZGljYXRvckVsZW1lbnQpOyAvLyBUT0RPIGlzIHRoaXMgY29uZmlndXJhYmxlIGFsYSBpbnNlcnRDb250ZW50KC4uLik/XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIFRleHRSZWFjdGlvbnMuY3JlYXRlUmVhY3RhYmxlVGV4dCh7XG4gICAgICAgICAgICAgICAgY29udGFpbmVyRGF0YTogY29udGFpbmVyRGF0YSxcbiAgICAgICAgICAgICAgICBjb250YWluZXJFbGVtZW50OiAkdGV4dEVsZW1lbnQsXG4gICAgICAgICAgICAgICAgZGVmYXVsdFJlYWN0aW9uczogZGVmYXVsdFJlYWN0aW9ucyxcbiAgICAgICAgICAgICAgICBwYWdlRGF0YTogcGFnZURhdGEsXG4gICAgICAgICAgICAgICAgZ3JvdXBTZXR0aW5nczogZ3JvdXBTZXR0aW5ncyxcbiAgICAgICAgICAgICAgICBleGNsdWRlTm9kZTogJGluZGljYXRvckVsZW1lbnQuZ2V0KDApXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLy8gV2UgdXNlIHRoaXMgdG8gaGFuZGxlIHRoZSBzaW1wbGUgY2FzZSBvZiB0ZXh0IGNvbnRlbnQgdGhhdCBlbmRzIHdpdGggc29tZSBtZWRpYSBhcyBpblxuLy8gPHA+TXkgdGV4dC4gPGltZyBzcmM9XCJ3aGF0ZXZlclwiPjwvcD4uXG4vLyBUaGlzIGlzIGEgc2ltcGxpc3RpYyBhbGdvcml0aG0sIG5vdCBhIGdlbmVyYWwgc29sdXRpb246XG4vLyBXZSB3YWxrIHRoZSBET00gaW5zaWRlIHRoZSBnaXZlbiBub2RlIGFuZCBrZWVwIHRyYWNrIG9mIHRoZSBsYXN0IFwiY29udGVudFwiIG5vZGUgdGhhdCB3ZSBlbmNvdW50ZXIsIHdoaWNoIGNvdWxkIGJlIGVpdGhlclxuLy8gdGV4dCBvciBzb21lIG1lZGlhLiAgSWYgdGhlIGxhc3QgY29udGVudCBub2RlIGlzIG5vdCB0ZXh0LCB3ZSB3YW50IHRvIGluc2VydCB0aGUgdGV4dCBpbmRpY2F0b3IgYmVmb3JlIHRoZSBtZWRpYS5cbmZ1bmN0aW9uIGxhc3RDb250ZW50Tm9kZShub2RlKSB7XG4gICAgdmFyIGxhc3ROb2RlO1xuICAgIHZhciBjaGlsZE5vZGVzID0gbm9kZS5jaGlsZE5vZGVzO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGROb2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgY2hpbGQgPSBjaGlsZE5vZGVzW2ldO1xuICAgICAgICBpZiAoY2hpbGQubm9kZVR5cGUgPT09IDMpIHtcbiAgICAgICAgICAgIGxhc3ROb2RlID0gY2hpbGQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgdGFnTmFtZSA9IGNoaWxkLnRhZ05hbWUudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgIHN3aXRjaCAodGFnTmFtZSkge1xuICAgICAgICAgICAgICAgIGNhc2UgJ2ltZyc6XG4gICAgICAgICAgICAgICAgY2FzZSAnaWZyYW1lJzpcbiAgICAgICAgICAgICAgICBjYXNlICd2aWRlbyc6XG4gICAgICAgICAgICAgICAgY2FzZSAnaWZyYW1lJzpcbiAgICAgICAgICAgICAgICAgICAgbGFzdE5vZGUgPSBjaGlsZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBsYXN0Tm9kZSA9IGxhc3RDb250ZW50Tm9kZShjaGlsZCkgfHwgbGFzdE5vZGU7XG4gICAgfVxuICAgIHJldHVybiBsYXN0Tm9kZTtcbn1cblxuZnVuY3Rpb24gc2hvdWxkSGFzaFRleHQoJHRleHRFbGVtZW50LCBncm91cFNldHRpbmdzKSB7XG4gICAgaWYgKChpc0N0YSgkdGV4dEVsZW1lbnQsIGdyb3VwU2V0dGluZ3MpKSkge1xuICAgICAgICAvLyBEb24ndCBoYXNoIHRoZSB0ZXh0IGlmIGl0IGlzIHRoZSB0YXJnZXQgb2YgYSBDVEEuXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgLy8gRG9uJ3QgY3JlYXRlIGFuIGluZGljYXRvciBmb3IgdGV4dCBlbGVtZW50cyB0aGF0IGNvbnRhaW4gb3RoZXIgdGV4dCBub2Rlcy5cbiAgICB2YXIgJG5lc3RlZEVsZW1lbnRzID0gZmluZCgkdGV4dEVsZW1lbnQsIGdyb3VwU2V0dGluZ3MuY29udGVudFNlbGVjdG9yKCkpO1xuICAgICRuZXN0ZWRFbGVtZW50cy5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoKGNvbXB1dGVFbGVtZW50VHlwZSgkKHRoaXMpKSA9PT0gVFlQRV9URVhUKSkge1xuICAgICAgICAgICAgLy8gRG9uJ3QgaGFzaCBhIHRleHQgZWxlbWVudCBpZiBpdCBjb250YWlucyBhbnkgb3RoZXIgbWF0Y2hlZCB0ZXh0IGVsZW1lbnRzXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gaXNDdGEoJGVsZW1lbnQsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgY29tcG9zaXRlU2VsZWN0b3IgPSBncm91cFNldHRpbmdzLmdlbmVyYXRlZEN0YVNlbGVjdG9yKCkgKyAnLFthbnQtaXRlbV0nO1xuICAgIHJldHVybiAkZWxlbWVudC5pcyhjb21wb3NpdGVTZWxlY3Rvcik7XG59XG5cbi8vIFRoZSBcImltYWdlXCIgYW5kIFwibWVkaWFcIiBwYXRocyBjb252ZXJnZSBoZXJlLCBiZWNhdXNlIHdlIHVzZSB0aGUgc2FtZSBpbmRpY2F0b3IgbW9kdWxlIGZvciB0aGVtIGJvdGguXG5mdW5jdGlvbiBzY2FuTWVkaWEoJG1lZGlhRWxlbWVudCwgdHlwZSwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgaW5kaWNhdG9yO1xuICAgIHZhciBoYXNoID0gY29tcHV0ZUhhc2goJG1lZGlhRWxlbWVudCwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgIGlmIChoYXNoKSB7XG4gICAgICAgIHZhciBjb250YWluZXJEYXRhID0gUGFnZURhdGEuZ2V0Q29udGFpbmVyRGF0YShwYWdlRGF0YSwgaGFzaCk7XG4gICAgICAgIGNvbnRhaW5lckRhdGEudHlwZSA9IHR5cGUgPT09IFRZUEVfSU1BR0UgPyAnaW1hZ2UnIDogJ21lZGlhJztcbiAgICAgICAgdmFyIGRlZmF1bHRSZWFjdGlvbnMgPSBncm91cFNldHRpbmdzLmRlZmF1bHRSZWFjdGlvbnMoJG1lZGlhRWxlbWVudCk7XG4gICAgICAgIHZhciBjb250ZW50RGF0YSA9IGNvbXB1dGVDb250ZW50RGF0YSgkbWVkaWFFbGVtZW50LCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgaWYgKGNvbnRlbnREYXRhICYmIGNvbnRlbnREYXRhLmRpbWVuc2lvbnMpIHtcbiAgICAgICAgICAgIGlmIChjb250ZW50RGF0YS5kaW1lbnNpb25zLmhlaWdodCA+PSAxMDAgJiYgY29udGVudERhdGEuZGltZW5zaW9ucy53aWR0aCA+PSAxMDApIHsgLy8gRG9uJ3QgY3JlYXRlIGluZGljYXRvciBvbiBlbGVtZW50cyB0aGF0IGFyZSB0b28gc21hbGxcbiAgICAgICAgICAgICAgICBpbmRpY2F0b3IgPSBNZWRpYUluZGljYXRvcldpZGdldC5jcmVhdGUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudDogV2lkZ2V0QnVja2V0LmdldCgpLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyRGF0YTogY29udGFpbmVyRGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnREYXRhOiBjb250ZW50RGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lckVsZW1lbnQ6ICRtZWRpYUVsZW1lbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0UmVhY3Rpb25zOiBkZWZhdWx0UmVhY3Rpb25zLFxuICAgICAgICAgICAgICAgICAgICAgICAgcGFnZURhdGE6IHBhZ2VEYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgZ3JvdXBTZXR0aW5nczogZ3JvdXBTZXR0aW5nc1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICAvLyBMaXN0ZW4gZm9yIGNoYW5nZXMgdG8gdGhlIGltYWdlIGF0dHJpYnV0ZXMgd2hpY2ggY291bGQgaW5kaWNhdGUgY29udGVudCBjaGFuZ2VzLlxuICAgIE11dGF0aW9uT2JzZXJ2ZXIuYWRkT25lVGltZUF0dHJpYnV0ZUxpc3RlbmVyKCRtZWRpYUVsZW1lbnQuZ2V0KDApLCBbJ3NyYycsJ2FudC1pdGVtLWNvbnRlbnQnLCdkYXRhJ10sIGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoaW5kaWNhdG9yKSB7XG4gICAgICAgICAgICAvLyBUT0RPOiB1cGRhdGUgSGFzaGVkRWxlbWVudHMgdG8gcmVtb3ZlIHRoZSBwcmV2aW91cyBoYXNoLT5lbGVtZW50IG1hcHBpbmcuIENvbnNpZGVyIHRoZXJlIGNvdWxkIGJlIG11bHRpcGxlXG4gICAgICAgICAgICAvLyAgICAgICBpbnN0YW5jZXMgb2YgdGhlIHNhbWUgZWxlbWVudCBvbiBhIHBhZ2UuLi4gc28gd2UgbWlnaHQgbmVlZCB0byB1c2UgYSBjb3VudGVyLlxuICAgICAgICAgICAgaW5kaWNhdG9yLnRlYXJkb3duKCk7XG4gICAgICAgIH1cbiAgICAgICAgc2Nhbk1lZGlhKCRtZWRpYUVsZW1lbnQsIHR5cGUsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gZmluZCgkZWxlbWVudCwgc2VsZWN0b3IsIGFkZEJhY2spIHtcbiAgICB2YXIgcmVzdWx0ID0gJGVsZW1lbnQuZmluZChzZWxlY3Rvcik7XG4gICAgaWYgKGFkZEJhY2sgJiYgc2VsZWN0b3IpIHsgLy8gd2l0aCBhbiB1bmRlZmluZWQgc2VsZWN0b3IsIGFkZEJhY2sgd2lsbCBtYXRjaCBhbmQgYWx3YXlzIHJldHVybiB0aGUgaW5wdXQgZWxlbWVudCAodW5saWtlIGZpbmQoKSB3aGljaCByZXR1cm5zIGFuIGVtcHR5IG1hdGNoKVxuICAgICAgICByZXN1bHQgPSByZXN1bHQuYWRkQmFjayhzZWxlY3Rvcik7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQuZmlsdGVyKGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gJCh0aGlzKS5jbG9zZXN0KCcubm8tYW50JykubGVuZ3RoID09IDA7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGluc2VydENvbnRlbnQoJHBhcmVudCwgY29udGVudCwgbWV0aG9kKSB7XG4gICAgc3dpdGNoIChtZXRob2QpIHtcbiAgICAgICAgY2FzZSAnYXBwZW5kJzpcbiAgICAgICAgICAgICRwYXJlbnQuYXBwZW5kKGNvbnRlbnQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3ByZXBlbmQnOlxuICAgICAgICAgICAgJHBhcmVudC5wcmVwZW5kKGNvbnRlbnQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2JlZm9yZSc6XG4gICAgICAgICAgICAkcGFyZW50LmJlZm9yZShjb250ZW50KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdhZnRlcic6XG4gICAgICAgICAgICAkcGFyZW50LmFmdGVyKGNvbnRlbnQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBjb21wdXRlSGFzaCgkZWxlbWVudCwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICAvLyBUT0RPOiBtYWtlIHN1cmUgd2UgZ2VuZXJhdGUgdW5pcXVlIGhhc2hlcyB1c2luZyBhbiBvcmRlcmVkIGluZGV4IGluIGNhc2Ugb2YgY29sbGlzaW9uc1xuICAgIHZhciBoYXNoO1xuICAgIHN3aXRjaCAoY29tcHV0ZUVsZW1lbnRUeXBlKCRlbGVtZW50KSkge1xuICAgICAgICBjYXNlIFRZUEVfSU1BR0U6XG4gICAgICAgICAgICB2YXIgaW1hZ2VVcmwgPSBVUkxzLmNvbXB1dGVJbWFnZVVybCgkZWxlbWVudCwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICBoYXNoID0gSGFzaC5oYXNoSW1hZ2UoaW1hZ2VVcmwpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgVFlQRV9NRURJQTpcbiAgICAgICAgICAgIHZhciBtZWRpYVVybCA9IFVSTHMuY29tcHV0ZU1lZGlhVXJsKCRlbGVtZW50LCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgIGhhc2ggPSBIYXNoLmhhc2hNZWRpYShtZWRpYVVybCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBUWVBFX1RFWFQ6XG4gICAgICAgICAgICBoYXNoID0gSGFzaC5oYXNoVGV4dCgkZWxlbWVudCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICB9XG4gICAgaWYgKGhhc2gpIHtcbiAgICAgICAgSGFzaGVkRWxlbWVudHMuc2V0KGhhc2gsIHBhZ2VEYXRhLnBhZ2VIYXNoLCAkZWxlbWVudCk7IC8vIFJlY29yZCB0aGUgcmVsYXRpb25zaGlwIGJldHdlZW4gdGhlIGhhc2ggYW5kIGRvbSBlbGVtZW50LlxuICAgICAgICBpZiAoQXBwTW9kZS5kZWJ1Zykge1xuICAgICAgICAgICAgJGVsZW1lbnQuYXR0cihBVFRSX0hBU0gsIGhhc2gpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBoYXNoO1xufVxuXG5mdW5jdGlvbiBjb21wdXRlQ29udGVudERhdGEoJGVsZW1lbnQsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgY29udGVudERhdGE7XG4gICAgc3dpdGNoIChjb21wdXRlRWxlbWVudFR5cGUoJGVsZW1lbnQpKSB7XG4gICAgICAgIGNhc2UgVFlQRV9JTUFHRTpcbiAgICAgICAgICAgIHZhciBpbWFnZVVybCA9IFVSTHMuY29tcHV0ZUltYWdlVXJsKCRlbGVtZW50LCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgIHZhciBpbWFnZURpbWVuc2lvbnMgPSB7XG4gICAgICAgICAgICAgICAgaGVpZ2h0OiAkZWxlbWVudC5oZWlnaHQoKSwgLy8gVE9ETzogcmV2aWV3IGhvdyB3ZSBnZXQgdGhlIGltYWdlIGRpbWVuc2lvbnNcbiAgICAgICAgICAgICAgICB3aWR0aDogJGVsZW1lbnQud2lkdGgoKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGNvbnRlbnREYXRhID0ge1xuICAgICAgICAgICAgICAgIHR5cGU6ICdpbWcnLFxuICAgICAgICAgICAgICAgIGJvZHk6IGltYWdlVXJsLFxuICAgICAgICAgICAgICAgIGRpbWVuc2lvbnM6IGltYWdlRGltZW5zaW9uc1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFRZUEVfTUVESUE6XG4gICAgICAgICAgICB2YXIgbWVkaWFVcmwgPSBVUkxzLmNvbXB1dGVNZWRpYVVybCgkZWxlbWVudCwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICB2YXIgbWVkaWFEaW1lbnNpb25zID0ge1xuICAgICAgICAgICAgICAgIGhlaWdodDogJGVsZW1lbnQuaGVpZ2h0KCksIC8vIFRPRE86IHJldmlldyBob3cgd2UgZ2V0IHRoZSBtZWRpYSBkaW1lbnNpb25zXG4gICAgICAgICAgICAgICAgd2lkdGg6ICRlbGVtZW50LndpZHRoKClcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBjb250ZW50RGF0YSA9IHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnbWVkJyxcbiAgICAgICAgICAgICAgICBib2R5OiBtZWRpYVVybCxcbiAgICAgICAgICAgICAgICBkaW1lbnNpb25zOiBtZWRpYURpbWVuc2lvbnNcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBUWVBFX1RFWFQ6XG4gICAgICAgICAgICBjb250ZW50RGF0YSA9IHsgdHlwZTogJ3RleHQnIH07XG4gICAgICAgICAgICBicmVhaztcbiAgICB9XG4gICAgcmV0dXJuIGNvbnRlbnREYXRhO1xufVxuXG5mdW5jdGlvbiBjb21wdXRlRWxlbWVudFR5cGUoJGVsZW1lbnQpIHtcbiAgICB2YXIgaXRlbVR5cGUgPSAkZWxlbWVudC5hdHRyKCdhbnQtaXRlbS10eXBlJyk7XG4gICAgaWYgKGl0ZW1UeXBlICYmIGl0ZW1UeXBlLnRyaW0oKS5sZW5ndGggPiAwKSB7XG4gICAgICAgIHJldHVybiBpdGVtVHlwZS50cmltKCk7XG4gICAgfVxuICAgIHZhciB0YWdOYW1lID0gJGVsZW1lbnQucHJvcCgndGFnTmFtZScpLnRvTG93ZXJDYXNlKCk7XG4gICAgc3dpdGNoICh0YWdOYW1lKSB7XG4gICAgICAgIGNhc2UgJ2ltZyc6XG4gICAgICAgICAgICByZXR1cm4gVFlQRV9JTUFHRTtcbiAgICAgICAgY2FzZSAndmlkZW8nOlxuICAgICAgICBjYXNlICdpZnJhbWUnOlxuICAgICAgICBjYXNlICdlbWJlZCc6XG4gICAgICAgICAgICByZXR1cm4gVFlQRV9NRURJQTtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHJldHVybiBUWVBFX1RFWFQ7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBlbGVtZW50c0FkZGVkKGdyb3VwU2V0dGluZ3MpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCRlbGVtZW50cykge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8ICRlbGVtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyICRlbGVtZW50ID0gJGVsZW1lbnRzW2ldO1xuICAgICAgICAgICAgJGVsZW1lbnQuZmluZChncm91cFNldHRpbmdzLmV4Y2x1c2lvblNlbGVjdG9yKCkpLmFkZEJhY2soZ3JvdXBTZXR0aW5ncy5leGNsdXNpb25TZWxlY3RvcigpKS5hZGRDbGFzcygnbm8tYW50Jyk7IC8vIEFkZCB0aGUgbm8tYW50IGNsYXNzIHRvIGV2ZXJ5dGhpbmcgdGhhdCBpcyBmbGFnZ2VkIGZvciBleGNsdXNpb25cbiAgICAgICAgICAgIGlmICgkZWxlbWVudC5jbG9zZXN0KCcubm8tYW50JykubGVuZ3RoID09PSAwKSB7IC8vIElnbm9yZSBhbnl0aGluZyB0YWdnZWQgbm8tYW50XG4gICAgICAgICAgICAgICAgLy8gRmlyc3QsIHNlZSBpZiBhbnkgZW50aXJlIHBhZ2VzIHdlcmUgYWRkZWRcbiAgICAgICAgICAgICAgICB2YXIgJHBhZ2VzID0gZmluZCgkZWxlbWVudCwgZ3JvdXBTZXR0aW5ncy5wYWdlU2VsZWN0b3IoKSwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgaWYgKCRwYWdlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIFBhZ2VEYXRhTG9hZGVyLnBhZ2VzQWRkZWQoJHBhZ2VzLCBncm91cFNldHRpbmdzKTsgLy8gVE9ETzogY29uc2lkZXIgaWYgdGhlcmUncyBhIGJldHRlciB3YXkgdG8gYXJjaGl0ZWN0IHRoaXNcbiAgICAgICAgICAgICAgICAgICAgJHBhZ2VzLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2NhblBhZ2UoJCh0aGlzKSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIElmIG5vdCBhbiBlbnRpcmUgcGFnZS9wYWdlcywgc2VlIGlmIGNvbnRlbnQgd2FzIGFkZGVkIHRvIGFuIGV4aXN0aW5nIHBhZ2VcbiAgICAgICAgICAgICAgICAgICAgdmFyICRwYWdlID0gJGVsZW1lbnQuY2xvc2VzdChncm91cFNldHRpbmdzLnBhZ2VTZWxlY3RvcigpKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCRwYWdlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHBhZ2UgPSAkKCdib2R5Jyk7IC8vIFRPRE86IGlzIHRoaXMgcmlnaHQ/IGtlZXAgaW4gc3luYyB3aXRoIHNjYW5BbGxQYWdlc1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHZhciB1cmwgPSBQYWdlVXRpbHMuY29tcHV0ZVBhZ2VVcmwoJHBhZ2UsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgdXJsSGFzaCA9IEhhc2guaGFzaFVybCh1cmwpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgcGFnZURhdGEgPSBQYWdlRGF0YS5nZXRQYWdlRGF0YSh1cmxIYXNoKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gRmlyc3QsIGNoZWNrIGZvciBhbnkgbmV3IHN1bW1hcnkgd2lkZ2V0cy4uLlxuICAgICAgICAgICAgICAgICAgICBzY2FuRm9yU3VtbWFyaWVzKCRlbGVtZW50LCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICAgICAgICAgIC8vIE5leHQsIHNlZSBpZiBhbnkgZW50aXJlIGFjdGl2ZSBzZWN0aW9ucyB3ZXJlIGFkZGVkXG4gICAgICAgICAgICAgICAgICAgIHZhciAkYWN0aXZlU2VjdGlvbnMgPSBmaW5kKCRlbGVtZW50LCBncm91cFNldHRpbmdzLmFjdGl2ZVNlY3Rpb25zKCkpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoJGFjdGl2ZVNlY3Rpb25zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRhY3RpdmVTZWN0aW9ucy5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjcmVhdGVBdXRvQ2FsbHNUb0FjdGlvbigkKHRoaXMpLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRhY3RpdmVTZWN0aW9ucy5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgJHNlY3Rpb24gPSAkKHRoaXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjYW5BY3RpdmVFbGVtZW50KCRzZWN0aW9uLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZpbmFsbHksIHNjYW4gaW5zaWRlIHRoZSBlbGVtZW50IGZvciBjb250ZW50XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgJGFjdGl2ZVNlY3Rpb24gPSAkZWxlbWVudC5jbG9zZXN0KGdyb3VwU2V0dGluZ3MuYWN0aXZlU2VjdGlvbnMoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoJGFjdGl2ZVNlY3Rpb24ubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNyZWF0ZUF1dG9DYWxsc1RvQWN0aW9uKCRlbGVtZW50LCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NhbkFjdGl2ZUVsZW1lbnQoJGVsZW1lbnQsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGhlIGVsZW1lbnQgaXMgYWRkZWQgb3V0c2lkZSBhbiBhY3RpdmUgc2VjdGlvbiwganVzdCBjaGVjayBpdCBmb3IgQ1RBc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjYW5Gb3JDYWxsc1RvQWN0aW9uKCRlbGVtZW50LCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgIHNjYW46IHNjYW5BbGxQYWdlc1xufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi91dGlscy9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciBSYWN0aXZlOyByZXF1aXJlKCcuL3V0aWxzL3JhY3RpdmUtcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24obG9hZGVkUmFjdGl2ZSkgeyBSYWN0aXZlID0gbG9hZGVkUmFjdGl2ZTt9KTtcbnZhciBXaWRnZXRCdWNrZXQgPSByZXF1aXJlKCcuL3V0aWxzL3dpZGdldC1idWNrZXQnKTtcbnZhciBUcmFuc2l0aW9uVXRpbCA9IHJlcXVpcmUoJy4vdXRpbHMvdHJhbnNpdGlvbi11dGlsJyk7XG5cbnZhciByYWN0aXZlO1xudmFyIGNsaWNrSGFuZGxlcjtcblxuXG5mdW5jdGlvbiBnZXRSb290RWxlbWVudCgpIHtcbiAgICAvLyBUT0RPIHJldmlzaXQgdGhpcywgaXQncyBraW5kIG9mIGdvb2Z5IGFuZCBpdCBtaWdodCBoYXZlIGEgdGltaW5nIHByb2JsZW1cbiAgICBpZiAoIXJhY3RpdmUpIHtcbiAgICAgICAgdmFyIGJ1Y2tldCA9IFdpZGdldEJ1Y2tldC5nZXQoKTtcbiAgICAgICAgcmFjdGl2ZSA9IFJhY3RpdmUoe1xuICAgICAgICAgICAgZWw6IGJ1Y2tldCxcbiAgICAgICAgICAgIGFwcGVuZDogdHJ1ZSxcbiAgICAgICAgICAgIHRlbXBsYXRlOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvcG9wdXAtd2lkZ2V0Lmhicy5odG1sJyksXG4gICAgICAgICAgICBwYXJ0aWFsczoge1xuICAgICAgICAgICAgICAgIGxvZ286IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9sb2dvLXN2Zy5oYnMuaHRtbCcpXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB2YXIgJGVsZW1lbnQgPSAkKHJhY3RpdmUuZmluZCgnLmFudGVubmEtcG9wdXAnKSk7XG4gICAgICAgICRlbGVtZW50Lm9uKCdtb3VzZWRvd24nLCBmYWxzZSk7IC8vIFByZXZlbnQgbW91c2Vkb3duIGZyb20gcHJvcGFnYXRpbmcsIHNvIHRoZSBicm93c2VyIGRvZXNuJ3QgY2xlYXIgdGhlIHRleHQgc2VsZWN0aW9uLlxuICAgICAgICAkZWxlbWVudC5vbignY2xpY2suYW50ZW5uYS1wb3B1cCcsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIGhpZGVQb3B1cCgkZWxlbWVudCk7XG4gICAgICAgICAgICBpZiAoY2xpY2tIYW5kbGVyKSB7XG4gICAgICAgICAgICAgICAgY2xpY2tIYW5kbGVyKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gJGVsZW1lbnQ7XG4gICAgfVxuICAgIHJldHVybiAkKHJhY3RpdmUuZmluZCgnLmFudGVubmEtcG9wdXAnKSk7XG59XG5cbmZ1bmN0aW9uIHNob3dQb3B1cChjb29yZGluYXRlcywgY2FsbGJhY2spIHtcbiAgICB2YXIgJGVsZW1lbnQgPSBnZXRSb290RWxlbWVudCgpO1xuICAgIGlmICghJGVsZW1lbnQuaGFzQ2xhc3MoJ3Nob3cnKSkge1xuICAgICAgICBjbGlja0hhbmRsZXIgPSBjYWxsYmFjaztcbiAgICAgICAgJGVsZW1lbnRcbiAgICAgICAgICAgIC5zaG93KCkgLy8gc3RpbGwgaGFzIG9wYWNpdHkgMCBhdCB0aGlzIHBvaW50XG4gICAgICAgICAgICAuY3NzKHtcbiAgICAgICAgICAgICAgICB0b3A6IGNvb3JkaW5hdGVzLnRvcCAtICRlbGVtZW50Lm91dGVySGVpZ2h0KCkgLSA2LCAvLyBUT0RPIGZpbmQgYSBjbGVhbmVyIHdheSB0byBhY2NvdW50IGZvciB0aGUgcG9wdXAgJ3RhaWwnXG4gICAgICAgICAgICAgICAgbGVmdDogY29vcmRpbmF0ZXMubGVmdCAtIE1hdGguZmxvb3IoJGVsZW1lbnQub3V0ZXJXaWR0aCgpIC8gMilcbiAgICAgICAgICAgIH0pO1xuICAgICAgICBUcmFuc2l0aW9uVXRpbC50b2dnbGVDbGFzcygkZWxlbWVudCwgJ3Nob3cnLCB0cnVlLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIFRPRE86IGFmdGVyIHRoZSBhcHBlYXJhbmNlIHRyYW5zaXRpb24gaXMgY29tcGxldGUsIGFkZCBhIGhhbmRsZXIgZm9yIG1vdXNlZW50ZXIgd2hpY2ggdGhlbiByZWdpc3RlcnNcbiAgICAgICAgICAgIC8vICAgICAgIGEgaGFuZGxlciBmb3IgbW91c2VsZWF2ZSB0aGF0IGhpZGVzIHRoZSBwb3B1cFxuXG4gICAgICAgICAgICAvLyBUT0RPOiBhbHNvIHRha2UgZG93biB0aGUgcG9wdXAgaWYgdGhlIHVzZXIgbW91c2VzIG92ZXIgYW5vdGhlciB3aWRnZXQgKHN1bW1hcnkgb3IgaW5kaWNhdG9yKVxuICAgICAgICAgICAgJChkb2N1bWVudCkub24oJ2NsaWNrLmFudGVubmEtcG9wdXAnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaGlkZVBvcHVwKCRlbGVtZW50KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGhpZGVQb3B1cCgkZWxlbWVudCkge1xuICAgIFRyYW5zaXRpb25VdGlsLnRvZ2dsZUNsYXNzKCRlbGVtZW50LCAnc2hvdycsIGZhbHNlLCBmdW5jdGlvbigpIHtcbiAgICAgICAgJGVsZW1lbnQuaGlkZSgpOyAvLyBhZnRlciB3ZSdyZSBhdCBvcGFjaXR5IDAsIGhpZGUgdGhlIGVsZW1lbnQgc28gaXQgZG9lc24ndCByZWNlaXZlIGFjY2lkZW50YWwgY2xpY2tzXG4gICAgfSk7XG4gICAgJChkb2N1bWVudCkub2ZmKCdjbGljay5hbnRlbm5hLXBvcHVwJyk7XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBzaG93OiBzaG93UG9wdXBcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgQWpheENsaWVudCA9IHJlcXVpcmUoJy4vdXRpbHMvYWpheC1jbGllbnQnKTtcbnZhciBSYWN0aXZlOyByZXF1aXJlKCcuL3V0aWxzL3JhY3RpdmUtcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24obG9hZGVkUmFjdGl2ZSkgeyBSYWN0aXZlID0gbG9hZGVkUmFjdGl2ZTt9KTtcbnZhciBSYW5nZSA9IHJlcXVpcmUoJy4vdXRpbHMvcmFuZ2UnKTtcbnZhciBSZWFjdGlvbnNXaWRnZXRMYXlvdXRVdGlscyA9IHJlcXVpcmUoJy4vdXRpbHMvcmVhY3Rpb25zLXdpZGdldC1sYXlvdXQtdXRpbHMnKTtcbnZhciBTVkdzID0gcmVxdWlyZSgnLi9zdmdzJyk7XG5cbnZhciBwYWdlU2VsZWN0b3IgPSAnLmFudGVubmEtcmVhY3Rpb25zLXBhZ2UnO1xuXG5mdW5jdGlvbiBjcmVhdGVQYWdlKG9wdGlvbnMpIHtcbiAgICB2YXIgaXNTdW1tYXJ5ID0gb3B0aW9ucy5pc1N1bW1hcnk7XG4gICAgdmFyIHJlYWN0aW9uc0RhdGEgPSBvcHRpb25zLnJlYWN0aW9uc0RhdGE7XG4gICAgdmFyIGNvbnRhaW5lckRhdGEgPSBvcHRpb25zLmNvbnRhaW5lckRhdGE7XG4gICAgdmFyIHBhZ2VEYXRhID0gb3B0aW9ucy5wYWdlRGF0YTtcbiAgICB2YXIgY29udGVudERhdGEgPSBvcHRpb25zLmNvbnRlbnREYXRhO1xuICAgIHZhciBjb250YWluZXJFbGVtZW50ID0gb3B0aW9ucy5jb250YWluZXJFbGVtZW50OyAvLyBvcHRpb25hbFxuICAgIC8vdmFyIHNob3dQcm9ncmVzcyA9IG9wdGlvbnMuc2hvd1Byb2dyZXNzO1xuICAgIHZhciBzaG93Q29uZmlybWF0aW9uID0gb3B0aW9ucy5zaG93Q29uZmlybWF0aW9uO1xuICAgIHZhciBzaG93RGVmYXVsdHMgPSBvcHRpb25zLnNob3dEZWZhdWx0cztcbiAgICB2YXIgc2hvd0NvbW1lbnRzID0gb3B0aW9ucy5zaG93Q29tbWVudHM7XG4gICAgdmFyIHNob3dMb2NhdGlvbnMgPSBvcHRpb25zLnNob3dMb2NhdGlvbnM7XG4gICAgdmFyIGVsZW1lbnQgPSBvcHRpb25zLmVsZW1lbnQ7XG4gICAgdmFyIGNvbG9ycyA9IG9wdGlvbnMuY29sb3JzO1xuICAgIHNvcnRSZWFjdGlvbkRhdGEocmVhY3Rpb25zRGF0YSk7XG4gICAgdmFyIHJlYWN0aW9uc0xheW91dERhdGEgPSBSZWFjdGlvbnNXaWRnZXRMYXlvdXRVdGlscy5jb21wdXRlTGF5b3V0RGF0YShyZWFjdGlvbnNEYXRhLCBjb2xvcnMpO1xuICAgIHZhciByYWN0aXZlID0gUmFjdGl2ZSh7XG4gICAgICAgIGVsOiBlbGVtZW50LFxuICAgICAgICBhcHBlbmQ6IHRydWUsXG4gICAgICAgIHRlbXBsYXRlOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvcmVhY3Rpb25zLXBhZ2UuaGJzLmh0bWwnKSxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgcmVhY3Rpb25zOiByZWFjdGlvbnNEYXRhLFxuICAgICAgICAgICAgcmVhY3Rpb25zTGF5b3V0Q2xhc3M6IGFycmF5QWNjZXNzb3IocmVhY3Rpb25zTGF5b3V0RGF0YS5sYXlvdXRDbGFzc2VzKSxcbiAgICAgICAgICAgIHJlYWN0aW9uc0JhY2tncm91bmRDb2xvcjogYXJyYXlBY2Nlc3NvcihyZWFjdGlvbnNMYXlvdXREYXRhLmJhY2tncm91bmRDb2xvcnMpLFxuICAgICAgICAgICAgaXNTdW1tYXJ5OiBpc1N1bW1hcnlcbiAgICAgICAgfSxcbiAgICAgICAgZGVjb3JhdG9yczoge1xuICAgICAgICAgICAgc2l6ZXRvZml0OiBzaXplVG9GaXRcbiAgICAgICAgfSxcbiAgICAgICAgcGFydGlhbHM6IHtcbiAgICAgICAgICAgIGxvY2F0aW9uSWNvbjogU1ZHcy5sb2NhdGlvbigpLFxuICAgICAgICAgICAgY29tbWVudHNJY29uOiBTVkdzLmNvbW1lbnRzKClcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgaWYgKGNvbnRhaW5lckVsZW1lbnQpIHtcbiAgICAgICAgcmFjdGl2ZS5vbignaGlnaGxpZ2h0JywgaGlnaGxpZ2h0Q29udGVudChjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgY29udGFpbmVyRWxlbWVudCkpO1xuICAgICAgICByYWN0aXZlLm9uKCdjbGVhcmhpZ2hsaWdodHMnLCBSYW5nZS5jbGVhckhpZ2hsaWdodHMpO1xuICAgIH1cbiAgICByYWN0aXZlLm9uKCdwbHVzb25lJywgcGx1c09uZShjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgc2hvd0NvbmZpcm1hdGlvbikpO1xuICAgIHJhY3RpdmUub24oJ3Nob3dkZWZhdWx0Jywgc2hvd0RlZmF1bHRzKTtcbiAgICByYWN0aXZlLm9uKCdzaG93Y29tbWVudHMnLCBmdW5jdGlvbihyYWN0aXZlRXZlbnQpIHsgc2hvd0NvbW1lbnRzKHJhY3RpdmVFdmVudC5jb250ZXh0KTsgcmV0dXJuIGZhbHNlOyB9KTsgLy8gVE9ETyBjbGVhbiB1cFxuICAgIHJhY3RpdmUub24oJ3Nob3dsb2NhdGlvbnMnLCBmdW5jdGlvbihyYWN0aXZlRXZlbnQpIHsgc2hvd0xvY2F0aW9ucyhyYWN0aXZlRXZlbnQuY29udGV4dCk7IHJldHVybiBmYWxzZTsgfSk7IC8vIFRPRE8gY2xlYW4gdXBcbiAgICByZXR1cm4ge1xuICAgICAgICBzZWxlY3RvcjogcGFnZVNlbGVjdG9yLFxuICAgICAgICB0ZWFyZG93bjogZnVuY3Rpb24oKSB7IHJhY3RpdmUudGVhcmRvd24oKTsgfVxuICAgIH07XG5cbiAgICBmdW5jdGlvbiBhcnJheUFjY2Vzc29yKGFycmF5KSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbihpbmRleCkge1xuICAgICAgICAgICAgcmV0dXJuIGFycmF5W2luZGV4XTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNvcnRSZWFjdGlvbkRhdGEocmVhY3Rpb25zKSB7XG4gICAgICAgIHJlYWN0aW9ucy5zb3J0KGZ1bmN0aW9uKHJlYWN0aW9uQSwgcmVhY3Rpb25CKSB7XG4gICAgICAgICAgICBpZiAocmVhY3Rpb25BLmNvdW50ID09PSByZWFjdGlvbkIuY291bnQpIHtcbiAgICAgICAgICAgICAgICAvLyB3aGVuIHRoZSBjb3VudCBpcyB0aGUgc2FtZSwgc29ydCBieSBjcmVhdGlvbiB0aW1lIChvdXIgSURzIGluY3JlYXNlIGNocm9ub2xvZ2ljYWxseSlcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVhY3Rpb25BLmlkIC0gcmVhY3Rpb25CLmlkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlYWN0aW9uQi5jb3VudCAtIHJlYWN0aW9uQS5jb3VudDtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBzaXplVG9GaXQobm9kZSkge1xuICAgIHZhciAkZWxlbWVudCA9ICQobm9kZSkuY2xvc2VzdCgnLmFudGVubmEtcmVhY3Rpb24tYm94Jyk7XG4gICAgdmFyICRyZWFjdGlvbkNvdW50ID0gJGVsZW1lbnQuZmluZCgnLmFudGVubmEtcmVhY3Rpb24tY291bnQnKTtcbiAgICB2YXIgJHBsdXNPbmUgPSAkZWxlbWVudC5maW5kKCcuYW50ZW5uYS1wbHVzb25lJyk7XG4gICAgdmFyIG1pbldpZHRoID0gTWF0aC5tYXgoJHJlYWN0aW9uQ291bnQud2lkdGgoKSwgJHBsdXNPbmUud2lkdGgoKSk7XG4gICAgJHJlYWN0aW9uQ291bnQuY3NzKHsgJ21pbi13aWR0aCc6IG1pbldpZHRoIH0pO1xuICAgICRwbHVzT25lLmNzcyh7ICdtaW4td2lkdGgnOiBtaW5XaWR0aCB9KTtcbiAgICByZXR1cm4gUmVhY3Rpb25zV2lkZ2V0TGF5b3V0VXRpbHMuc2l6ZVRvRml0KG5vZGUpO1xufVxuXG5mdW5jdGlvbiByb290RWxlbWVudChyYWN0aXZlKSB7XG4gICAgcmV0dXJuIHJhY3RpdmUuZmluZChwYWdlU2VsZWN0b3IpO1xufVxuXG5mdW5jdGlvbiBoaWdobGlnaHRDb250ZW50KGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCAkY29udGFpbmVyRWxlbWVudCkge1xuICAgIHJldHVybiBmdW5jdGlvbihldmVudCkge1xuICAgICAgICB2YXIgcmVhY3Rpb25EYXRhID0gZXZlbnQuY29udGV4dDtcbiAgICAgICAgaWYgKHJlYWN0aW9uRGF0YS5jb250ZW50KSB7XG4gICAgICAgICAgICB2YXIgbG9jYXRpb24gPSByZWFjdGlvbkRhdGEuY29udGVudC5sb2NhdGlvbjtcbiAgICAgICAgICAgIGlmIChsb2NhdGlvbikge1xuICAgICAgICAgICAgICAgIFJhbmdlLmhpZ2hsaWdodCgkY29udGFpbmVyRWxlbWVudC5nZXQoMCksIGxvY2F0aW9uKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gcGx1c09uZShjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgc2hvd0NvbmZpcm1hdGlvbikge1xuICAgIHJldHVybiBmdW5jdGlvbihldmVudCkge1xuICAgICAgICB2YXIgcmVhY3Rpb25EYXRhID0gZXZlbnQuY29udGV4dDtcbiAgICAgICAgdmFyIHJlYWN0aW9uUHJvdmlkZXIgPSB7IC8vIHRoaXMgcmVhY3Rpb24gcHJvdmlkZXIgaXMgYSBuby1icmFpbmVyIGJlY2F1c2Ugd2UgYWxyZWFkeSBoYXZlIGEgdmFsaWQgcmVhY3Rpb24gKG9uZSB3aXRoIGFuIElEKVxuICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKHJlYWN0aW9uRGF0YSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHNob3dDb25maXJtYXRpb24ocmVhY3Rpb25EYXRhLCByZWFjdGlvblByb3ZpZGVyKTtcbiAgICAgICAgQWpheENsaWVudC5wb3N0UGx1c09uZShyZWFjdGlvbkRhdGEsIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBmdW5jdGlvbigpe30vKlRPRE8qLywgZXJyb3IpO1xuXG4gICAgICAgIGZ1bmN0aW9uIGVycm9yKG1lc3NhZ2UpIHtcbiAgICAgICAgICAgIC8vIFRPRE8gaGFuZGxlIGFueSBlcnJvcnMgdGhhdCBvY2N1ciBwb3N0aW5nIGEgcmVhY3Rpb25cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiZXJyb3IgcG9zdGluZyBwbHVzIG9uZTogXCIgKyBtZXNzYWdlKTtcbiAgICAgICAgfVxuICAgIH07XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGU6IGNyZWF0ZVBhZ2Vcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgQWpheENsaWVudCA9IHJlcXVpcmUoJy4vdXRpbHMvYWpheC1jbGllbnQnKTtcbnZhciBNb3ZlYWJsZSA9IHJlcXVpcmUoJy4vdXRpbHMvbW92ZWFibGUnKTtcbnZhciBSYWN0aXZlOyByZXF1aXJlKCcuL3V0aWxzL3JhY3RpdmUtcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24obG9hZGVkUmFjdGl2ZSkgeyBSYWN0aXZlID0gbG9hZGVkUmFjdGl2ZTt9KTtcbnZhciBSYW5nZSA9IHJlcXVpcmUoJy4vdXRpbHMvcmFuZ2UnKTtcbnZhciBUb3VjaFN1cHBvcnQgPSByZXF1aXJlKCcuL3V0aWxzL3RvdWNoLXN1cHBvcnQnKTtcbnZhciBUcmFuc2l0aW9uVXRpbCA9IHJlcXVpcmUoJy4vdXRpbHMvdHJhbnNpdGlvbi11dGlsJyk7XG52YXIgVVJMcyA9IHJlcXVpcmUoJy4vdXRpbHMvdXJscycpO1xudmFyIFdpZGdldEJ1Y2tldCA9IHJlcXVpcmUoJy4vdXRpbHMvd2lkZ2V0LWJ1Y2tldCcpO1xuXG52YXIgQ29tbWVudHNQYWdlID0gcmVxdWlyZSgnLi9jb21tZW50cy1wYWdlJyk7XG52YXIgQ29uZmlybWF0aW9uUGFnZSA9IHJlcXVpcmUoJy4vY29uZmlybWF0aW9uLXBhZ2UnKTtcbnZhciBEZWZhdWx0c1BhZ2UgPSByZXF1aXJlKCcuL2RlZmF1bHRzLXBhZ2UnKTtcbnZhciBMb2NhdGlvbnNQYWdlID0gcmVxdWlyZSgnLi9sb2NhdGlvbnMtcGFnZScpO1xudmFyIFBhZ2VEYXRhID0gcmVxdWlyZSgnLi9wYWdlLWRhdGEnKTtcbnZhciBSZWFjdGlvbnNQYWdlID0gcmVxdWlyZSgnLi9yZWFjdGlvbnMtcGFnZScpO1xuXG52YXIgcGFnZVJlYWN0aW9ucyA9ICdyZWFjdGlvbnMnO1xudmFyIHBhZ2VEZWZhdWx0cyA9ICdkZWZhdWx0cyc7XG52YXIgcGFnZUF1dG8gPSAnYXV0byc7XG5cbnZhciBvcGVuSW5zdGFuY2VzID0gW107XG5cbmZ1bmN0aW9uIG9wZW5SZWFjdGlvbnNXaWRnZXQob3B0aW9ucywgZWxlbWVudE9yQ29vcmRzKSB7XG4gICAgY2xvc2VBbGxXaW5kb3dzKCk7XG4gICAgdmFyIGRlZmF1bHRSZWFjdGlvbnMgPSBvcHRpb25zLmRlZmF1bHRSZWFjdGlvbnM7XG4gICAgdmFyIHJlYWN0aW9uc0RhdGEgPSBvcHRpb25zLnJlYWN0aW9uc0RhdGE7XG4gICAgdmFyIGNvbnRhaW5lckRhdGEgPSBvcHRpb25zLmNvbnRhaW5lckRhdGE7XG4gICAgdmFyIGNvbnRhaW5lckVsZW1lbnQgPSBvcHRpb25zLmNvbnRhaW5lckVsZW1lbnQ7IC8vIG9wdGlvbmFsXG4gICAgdmFyIHN0YXJ0UGFnZSA9IG9wdGlvbnMuc3RhcnRQYWdlIHx8IHBhZ2VBdXRvOyAvLyBvcHRpb25hbFxuICAgIHZhciBpc1N1bW1hcnkgPSBvcHRpb25zLmlzU3VtbWFyeSA9PT0gdW5kZWZpbmVkID8gZmFsc2UgOiBvcHRpb25zLmlzU3VtbWFyeTsgLy8gb3B0aW9uYWxcbiAgICAvLyBjb250ZW50RGF0YSBjb250YWlucyBkZXRhaWxzIGFib3V0IHRoZSBjb250ZW50IGJlaW5nIHJlYWN0ZWQgdG8gbGlrZSB0ZXh0IHJhbmdlIG9yIGltYWdlIGhlaWdodC93aWR0aC5cbiAgICAvLyB3ZSBwb3RlbnRpYWxseSBtb2RpZnkgdGhpcyBkYXRhIChlLmcuIGluIHRoZSBkZWZhdWx0IHJlYWN0aW9uIGNhc2Ugd2Ugc2VsZWN0IHRoZSB0ZXh0IG91cnNlbHZlcykgc28gd2VcbiAgICAvLyBtYWtlIGEgbG9jYWwgY29weSBvZiBpdCB0byBhdm9pZCB1bmV4cGVjdGVkbHkgY2hhbmdpbmcgZGF0YSBvdXQgZnJvbSB1bmRlciBvbmUgb2YgdGhlIGNsaWVudHNcbiAgICB2YXIgY29udGVudERhdGEgPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KG9wdGlvbnMuY29udGVudERhdGEpKTtcbiAgICB2YXIgcGFnZURhdGEgPSBvcHRpb25zLnBhZ2VEYXRhO1xuICAgIHZhciBncm91cFNldHRpbmdzID0gb3B0aW9ucy5ncm91cFNldHRpbmdzO1xuICAgIHZhciBjb2xvcnMgPSBncm91cFNldHRpbmdzLnJlYWN0aW9uQmFja2dyb3VuZENvbG9ycygpO1xuICAgIHZhciByYWN0aXZlID0gUmFjdGl2ZSh7XG4gICAgICAgIGVsOiBXaWRnZXRCdWNrZXQuZ2V0KCksXG4gICAgICAgIGFwcGVuZDogdHJ1ZSxcbiAgICAgICAgZGF0YToge30sXG4gICAgICAgIHRlbXBsYXRlOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvcmVhY3Rpb25zLXdpZGdldC5oYnMuaHRtbCcpLFxuICAgICAgICBwYXJ0aWFsczoge1xuICAgICAgICAgICAgbG9nbzogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL2xvZ28tc3ZnLmhicy5odG1sJylcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIG9wZW5JbnN0YW5jZXMucHVzaChyYWN0aXZlKTtcbiAgICB2YXIgJHJvb3RFbGVtZW50ID0gJChyb290RWxlbWVudChyYWN0aXZlKSk7XG4gICAgTW92ZWFibGUubWFrZU1vdmVhYmxlKCRyb290RWxlbWVudCwgJHJvb3RFbGVtZW50LmZpbmQoJy5hbnRlbm5hLWhlYWRlcicpKTtcbiAgICB2YXIgcGFnZXMgPSBbXTtcblxuICAgIG9wZW5XaW5kb3coKTtcblxuICAgIGZ1bmN0aW9uIG9wZW5XaW5kb3coKSB7XG4gICAgICAgIFBhZ2VEYXRhLmNsZWFySW5kaWNhdG9yTGltaXQocGFnZURhdGEpO1xuICAgICAgICB2YXIgY29vcmRzO1xuICAgICAgICBpZiAoZWxlbWVudE9yQ29vcmRzLnRvcCAmJiBlbGVtZW50T3JDb29yZHMubGVmdCkge1xuICAgICAgICAgICAgY29vcmRzID0gZWxlbWVudE9yQ29vcmRzO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyICRyZWxhdGl2ZUVsZW1lbnQgPSAkKGVsZW1lbnRPckNvb3Jkcyk7XG4gICAgICAgICAgICB2YXIgb2Zmc2V0ID0gJHJlbGF0aXZlRWxlbWVudC5vZmZzZXQoKTtcbiAgICAgICAgICAgIGNvb3JkcyA9IHtcbiAgICAgICAgICAgICAgICB0b3A6IG9mZnNldC50b3AsXG4gICAgICAgICAgICAgICAgbGVmdDogb2Zmc2V0LmxlZnRcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGhvcml6b250YWxPdmVyZmxvdyA9IGNvb3Jkcy5sZWZ0ICsgJHJvb3RFbGVtZW50LndpZHRoKCkgLSBNYXRoLm1heChkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50V2lkdGgsIHdpbmRvdy5pbm5lcldpZHRoIHx8IDApOyAvLyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzEyNDgwODEvZ2V0LXRoZS1icm93c2VyLXZpZXdwb3J0LWRpbWVuc2lvbnMtd2l0aC1qYXZhc2NyaXB0Lzg4NzYwNjkjODg3NjA2OVxuICAgICAgICBpZiAoaG9yaXpvbnRhbE92ZXJmbG93ID4gMCkge1xuICAgICAgICAgICAgY29vcmRzLmxlZnQgPSBjb29yZHMubGVmdCAtIGhvcml6b250YWxPdmVyZmxvdztcbiAgICAgICAgfVxuICAgICAgICAkcm9vdEVsZW1lbnQuc3RvcCh0cnVlLCB0cnVlKS5hZGRDbGFzcygnb3BlbicpLmNzcyhjb29yZHMpO1xuXG4gICAgICAgIGlmIChzdGFydFBhZ2UgPT09IHBhZ2VSZWFjdGlvbnMgfHwgKHN0YXJ0UGFnZSA9PT0gcGFnZUF1dG8gJiYgcmVhY3Rpb25zRGF0YS5sZW5ndGggPiAwKSkge1xuICAgICAgICAgICAgc2hvd1JlYWN0aW9uc1BhZ2UoZmFsc2UpO1xuICAgICAgICB9IGVsc2UgeyAvLyBzdGFydFBhZ2UgPT09IHBhZ2VEZWZhdWx0cyB8fCB0aGVyZSBhcmUgbm8gcmVhY3Rpb25zXG4gICAgICAgICAgICBzaG93RGVmYXVsdFJlYWN0aW9uc1BhZ2UoZmFsc2UpO1xuICAgICAgICB9XG5cbiAgICAgICAgc2V0dXBXaW5kb3dDbG9zZShwYWdlcywgcmFjdGl2ZSk7XG4gICAgICAgIHByZXZlbnRFeHRyYVNjcm9sbCgkcm9vdEVsZW1lbnQpO1xuICAgICAgICBvcGVuSW5zdGFuY2VzLnB1c2gocmFjdGl2ZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2hvd1JlYWN0aW9uc1BhZ2UoYW5pbWF0ZSkge1xuICAgICAgICB2YXIgb3B0aW9ucyA9IHtcbiAgICAgICAgICAgIGlzU3VtbWFyeTogaXNTdW1tYXJ5LFxuICAgICAgICAgICAgcmVhY3Rpb25zRGF0YTogcmVhY3Rpb25zRGF0YSxcbiAgICAgICAgICAgIHBhZ2VEYXRhOiBwYWdlRGF0YSxcbiAgICAgICAgICAgIGNvbnRhaW5lckRhdGE6IGNvbnRhaW5lckRhdGEsXG4gICAgICAgICAgICBjb250YWluZXJFbGVtZW50OiBjb250YWluZXJFbGVtZW50LFxuICAgICAgICAgICAgY29sb3JzOiBjb2xvcnMsXG4gICAgICAgICAgICBjb250ZW50RGF0YTogY29udGVudERhdGEsXG4gICAgICAgICAgICBzaG93Q29uZmlybWF0aW9uOiBzaG93Q29uZmlybWF0aW9uLFxuICAgICAgICAgICAgc2hvd0RlZmF1bHRzOiBmdW5jdGlvbigpIHsgc2hvd0RlZmF1bHRSZWFjdGlvbnNQYWdlKHRydWUpIH0sXG4gICAgICAgICAgICBzaG93Q29tbWVudHM6IHNob3dDb21tZW50cyxcbiAgICAgICAgICAgIHNob3dMb2NhdGlvbnM6IHNob3dMb2NhdGlvbnMsXG4gICAgICAgICAgICBlbGVtZW50OiBwYWdlQ29udGFpbmVyKHJhY3RpdmUpXG4gICAgICAgIH07XG4gICAgICAgIHZhciBwYWdlID0gUmVhY3Rpb25zUGFnZS5jcmVhdGUob3B0aW9ucyk7XG4gICAgICAgIHBhZ2VzLnB1c2gocGFnZSk7XG4gICAgICAgIHNob3dQYWdlKHBhZ2Uuc2VsZWN0b3IsICRyb290RWxlbWVudCwgYW5pbWF0ZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2hvd0RlZmF1bHRSZWFjdGlvbnNQYWdlKGFuaW1hdGUpIHtcbiAgICAgICAgaWYgKGNvbnRhaW5lckVsZW1lbnQgJiYgIWNvbnRlbnREYXRhLmxvY2F0aW9uICYmICFjb250ZW50RGF0YS5ib2R5KSB7XG4gICAgICAgICAgICBSYW5nZS5ncmFiTm9kZShjb250YWluZXJFbGVtZW50LmdldCgwKSwgZnVuY3Rpb24gKHRleHQsIGxvY2F0aW9uKSB7XG4gICAgICAgICAgICAgICAgY29udGVudERhdGEubG9jYXRpb24gPSBsb2NhdGlvbjtcbiAgICAgICAgICAgICAgICBjb250ZW50RGF0YS5ib2R5ID0gdGV4dDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHZhciBvcHRpb25zID0geyAvLyBUT0RPOiBjbGVhbiB1cCB0aGUgbnVtYmVyIG9mIHRoZXNlIFwib3B0aW9uc1wiIG9iamVjdHMgdGhhdCB3ZSBjcmVhdGUuXG4gICAgICAgICAgICBkZWZhdWx0UmVhY3Rpb25zOiBkZWZhdWx0UmVhY3Rpb25zLFxuICAgICAgICAgICAgcGFnZURhdGE6IHBhZ2VEYXRhLFxuICAgICAgICAgICAgY29udGFpbmVyRGF0YTogY29udGFpbmVyRGF0YSxcbiAgICAgICAgICAgIGNvbG9yczogY29sb3JzLFxuICAgICAgICAgICAgY29udGVudERhdGE6IGNvbnRlbnREYXRhLFxuICAgICAgICAgICAgc2hvd0NvbmZpcm1hdGlvbjogc2hvd0NvbmZpcm1hdGlvbixcbiAgICAgICAgICAgIGVsZW1lbnQ6IHBhZ2VDb250YWluZXIocmFjdGl2ZSlcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIHBhZ2UgPSBEZWZhdWx0c1BhZ2UuY3JlYXRlKG9wdGlvbnMpO1xuICAgICAgICBwYWdlcy5wdXNoKHBhZ2UpO1xuICAgICAgICBzaG93UGFnZShwYWdlLnNlbGVjdG9yLCAkcm9vdEVsZW1lbnQsIGFuaW1hdGUpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNob3dDb25maXJtYXRpb24ocmVhY3Rpb25EYXRhLCByZWFjdGlvblByb3ZpZGVyKSB7XG4gICAgICAgIHNldFdpbmRvd1RpdGxlKCdUaGFua3MgZm9yIHlvdXIgcmVhY3Rpb24hJyk7XG4gICAgICAgIHZhciBwYWdlID0gQ29uZmlybWF0aW9uUGFnZS5jcmVhdGUocmVhY3Rpb25EYXRhLnRleHQsIHJlYWN0aW9uUHJvdmlkZXIsIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBwYWdlQ29udGFpbmVyKHJhY3RpdmUpKTtcbiAgICAgICAgcGFnZXMucHVzaChwYWdlKTtcblxuICAgICAgICAvLyBUT0RPOiByZXZpc2l0IHdoeSB3ZSBuZWVkIHRvIHVzZSB0aGUgdGltZW91dCB0cmljayBmb3IgdGhlIGNvbmZpcm0gcGFnZSwgYnV0IG5vdCBmb3IgdGhlIGRlZmF1bHRzIHBhZ2VcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHsgLy8gSW4gb3JkZXIgZm9yIHRoZSBwb3NpdGlvbmluZyBhbmltYXRpb24gdG8gd29yaywgd2UgbmVlZCB0byBsZXQgdGhlIGJyb3dzZXIgcmVuZGVyIHRoZSBhcHBlbmRlZCBET00gZWxlbWVudFxuICAgICAgICAgICAgc2hvd1BhZ2UocGFnZS5zZWxlY3RvciwgJHJvb3RFbGVtZW50LCB0cnVlKTtcbiAgICAgICAgfSwgMSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2hvd1Byb2dyZXNzUGFnZSgpIHtcbiAgICAgICAgc2hvd1BhZ2UoJy5hbnRlbm5hLXByb2dyZXNzLXBhZ2UnLCAkcm9vdEVsZW1lbnQsIGZhbHNlLCB0cnVlKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzaG93Q29tbWVudHMocmVhY3Rpb24pIHtcbiAgICAgICAgc2hvd1Byb2dyZXNzUGFnZSgpOyAvLyBUT0RPOiBwcm92aWRlIHNvbWUgd2F5IGZvciB0aGUgdXNlciB0byBnaXZlIHVwIC8gY2FuY2VsLiBBbHNvLCBoYW5kbGUgZXJyb3JzIGZldGNoaW5nIGNvbW1lbnRzLlxuICAgICAgICBBamF4Q2xpZW50LmdldENvbW1lbnRzKHJlYWN0aW9uLCBmdW5jdGlvbihjb21tZW50cykge1xuICAgICAgICAgICAgdmFyIG9wdGlvbnMgPSB7XG4gICAgICAgICAgICAgICAgcmVhY3Rpb246IHJlYWN0aW9uLFxuICAgICAgICAgICAgICAgIGNvbW1lbnRzOiBjb21tZW50cyxcbiAgICAgICAgICAgICAgICBlbGVtZW50OiBwYWdlQ29udGFpbmVyKHJhY3RpdmUpLFxuICAgICAgICAgICAgICAgIGNsb3NlV2luZG93OiBjbG9zZVdpbmRvdyxcbiAgICAgICAgICAgICAgICBjb250YWluZXJEYXRhOiBjb250YWluZXJEYXRhLFxuICAgICAgICAgICAgICAgIHBhZ2VEYXRhOiBwYWdlRGF0YVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHZhciBwYWdlID0gQ29tbWVudHNQYWdlLmNyZWF0ZShvcHRpb25zKTtcbiAgICAgICAgICAgIHBhZ2VzLnB1c2gocGFnZSk7XG5cbiAgICAgICAgICAgIC8vIFRPRE86IHJldmlzaXRcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IC8vIEluIG9yZGVyIGZvciB0aGUgcG9zaXRpb25pbmcgYW5pbWF0aW9uIHRvIHdvcmssIHdlIG5lZWQgdG8gbGV0IHRoZSBicm93c2VyIHJlbmRlciB0aGUgYXBwZW5kZWQgRE9NIGVsZW1lbnRcbiAgICAgICAgICAgICAgICBzaG93UGFnZShwYWdlLnNlbGVjdG9yLCAkcm9vdEVsZW1lbnQsIHRydWUpO1xuICAgICAgICAgICAgfSwgMSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNob3dMb2NhdGlvbnMocmVhY3Rpb24pIHtcbiAgICAgICAgc2hvd1Byb2dyZXNzUGFnZSgpOyAvLyBUT0RPOiBwcm92aWRlIHNvbWUgd2F5IGZvciB0aGUgdXNlciB0byBnaXZlIHVwIC8gY2FuY2VsLiBBbHNvLCBoYW5kbGUgZXJyb3JzIGZldGNoaW5nIGNvbW1lbnRzLlxuICAgICAgICBBamF4Q2xpZW50LmdldFJlYWN0aW9uTG9jYXRpb25EYXRhKHJlYWN0aW9uLCBwYWdlRGF0YSwgZnVuY3Rpb24ocmVhY3Rpb25Mb2NhdGlvbkRhdGEpIHtcbiAgICAgICAgICAgIHZhciBvcHRpb25zID0geyAvLyBUT0RPOiBjbGVhbiB1cCB0aGUgbnVtYmVyIG9mIHRoZXNlIFwib3B0aW9uc1wiIG9iamVjdHMgdGhhdCB3ZSBjcmVhdGUuXG4gICAgICAgICAgICAgICAgZWxlbWVudDogcGFnZUNvbnRhaW5lcihyYWN0aXZlKSxcbiAgICAgICAgICAgICAgICByZWFjdGlvbkxvY2F0aW9uRGF0YTogcmVhY3Rpb25Mb2NhdGlvbkRhdGEsXG4gICAgICAgICAgICAgICAgcGFnZURhdGE6IHBhZ2VEYXRhLFxuICAgICAgICAgICAgICAgIGNsb3NlV2luZG93OiBjbG9zZVdpbmRvd1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHZhciBwYWdlID0gTG9jYXRpb25zUGFnZS5jcmVhdGUob3B0aW9ucyk7XG4gICAgICAgICAgICBwYWdlcy5wdXNoKHBhZ2UpO1xuICAgICAgICAgICAgc2V0V2luZG93VGl0bGUocmVhY3Rpb24udGV4dCk7XG4gICAgICAgICAgICAvLyBUT0RPOiByZXZpc2l0XG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyAvLyBJbiBvcmRlciBmb3IgdGhlIHBvc2l0aW9uaW5nIGFuaW1hdGlvbiB0byB3b3JrLCB3ZSBuZWVkIHRvIGxldCB0aGUgYnJvd3NlciByZW5kZXIgdGhlIGFwcGVuZGVkIERPTSBlbGVtZW50XG4gICAgICAgICAgICAgICAgc2hvd1BhZ2UocGFnZS5zZWxlY3RvciwgJHJvb3RFbGVtZW50LCB0cnVlKTtcbiAgICAgICAgICAgIH0sIDEpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjbG9zZVdpbmRvdygpIHtcbiAgICAgICAgcmFjdGl2ZS5maXJlKCdjbG9zZVdpbmRvdycpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNldFdpbmRvd1RpdGxlKHRpdGxlKSB7XG4gICAgICAgICQocmFjdGl2ZS5maW5kKCcuYW50ZW5uYS1yZWFjdGlvbnMtdGl0bGUnKSkuaHRtbCh0aXRsZSk7XG4gICAgfVxuXG59XG5cbmZ1bmN0aW9uIHJvb3RFbGVtZW50KHJhY3RpdmUpIHtcbiAgICByZXR1cm4gcmFjdGl2ZS5maW5kKCcuYW50ZW5uYS1yZWFjdGlvbnMtd2lkZ2V0Jyk7XG59XG5cbmZ1bmN0aW9uIHBhZ2VDb250YWluZXIocmFjdGl2ZSkge1xuICAgIHJldHVybiByYWN0aXZlLmZpbmQoJy5hbnRlbm5hLXBhZ2UtY29udGFpbmVyJyk7XG59XG5cbnZhciBwYWdlWiA9IDEwMDA7IC8vIEl0J3Mgc2FmZSBmb3IgdGhpcyB2YWx1ZSB0byBnbyBhY3Jvc3MgaW5zdGFuY2VzLiBXZSBqdXN0IG5lZWQgaXQgdG8gY29udGludW91c2x5IGluY3JlYXNlIChtYXggdmFsdWUgaXMgb3ZlciAyIGJpbGxpb24pLlxuXG5mdW5jdGlvbiBzaG93UGFnZShwYWdlU2VsZWN0b3IsICRyb290RWxlbWVudCwgYW5pbWF0ZSwgb3ZlcmxheSkge1xuICAgIHZhciAkcGFnZSA9ICRyb290RWxlbWVudC5maW5kKHBhZ2VTZWxlY3Rvcik7XG4gICAgJHBhZ2UuY3NzKCd6LWluZGV4JywgcGFnZVopO1xuICAgIHBhZ2VaICs9IDE7XG5cbiAgICAkcGFnZS50b2dnbGVDbGFzcygnYW50ZW5uYS1wYWdlLWFuaW1hdGUnLCBhbmltYXRlKTtcblxuICAgIGlmIChvdmVybGF5KSB7XG4gICAgICAgIC8vIEluIHRoZSBvdmVybGF5IGNhc2UsIHNpemUgdGhlIHBhZ2UgdG8gbWF0Y2ggd2hhdGV2ZXIgcGFnZSBpcyBjdXJyZW50bHkgc2hvd2luZyBhbmQgdGhlbiBtYWtlIGl0IGFjdGl2ZSAodGhlcmUgd2lsbCBiZSB0d28gJ2FjdGl2ZScgcGFnZXMpXG4gICAgICAgIHZhciAkY3VycmVudCA9ICRyb290RWxlbWVudC5maW5kKCcuYW50ZW5uYS1wYWdlLWFjdGl2ZScpO1xuICAgICAgICAkcGFnZS5oZWlnaHQoJGN1cnJlbnQuaGVpZ2h0KCkpO1xuICAgICAgICAkcGFnZS5hZGRDbGFzcygnYW50ZW5uYS1wYWdlLWFjdGl2ZScpO1xuICAgIH0gZWxzZSBpZiAoYW5pbWF0ZSkge1xuICAgICAgICBUcmFuc2l0aW9uVXRpbC50b2dnbGVDbGFzcygkcGFnZSwgJ2FudGVubmEtcGFnZS1hY3RpdmUnLCB0cnVlLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIEFmdGVyIHRoZSBuZXcgcGFnZSBzbGlkZXMgaW50byBwb3NpdGlvbiwgbW92ZSB0aGUgb3RoZXIgcGFnZXMgYmFjayBvdXQgb2YgdGhlIHZpZXdhYmxlIGFyZWFcbiAgICAgICAgICAgICRyb290RWxlbWVudC5maW5kKCcuYW50ZW5uYS1wYWdlJykubm90KHBhZ2VTZWxlY3RvcikucmVtb3ZlQ2xhc3MoJ2FudGVubmEtcGFnZS1hY3RpdmUnKTtcbiAgICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgJHBhZ2UuYWRkQ2xhc3MoJ2FudGVubmEtcGFnZS1hY3RpdmUnKTtcbiAgICAgICAgJHJvb3RFbGVtZW50LmZpbmQoJy5hbnRlbm5hLXBhZ2UnKS5ub3QocGFnZVNlbGVjdG9yKS5yZW1vdmVDbGFzcygnYW50ZW5uYS1wYWdlLWFjdGl2ZScpO1xuICAgIH1cbiAgICBzaXplQm9keVRvRml0KCRyb290RWxlbWVudCwgJHBhZ2UsIGFuaW1hdGUpO1xufVxuXG5mdW5jdGlvbiBzaXplQm9keVRvRml0KCRyb290RWxlbWVudCwgJHBhZ2UsIGFuaW1hdGUpIHtcbiAgICB2YXIgJHBhZ2VDb250YWluZXIgPSAkcm9vdEVsZW1lbnQuZmluZCgnLmFudGVubmEtcGFnZS1jb250YWluZXInKTtcbiAgICB2YXIgJGJvZHkgPSAkcGFnZS5maW5kKCcuYW50ZW5uYS1ib2R5Jyk7XG4gICAgdmFyIGN1cnJlbnRIZWlnaHQgPSAkcGFnZUNvbnRhaW5lci5jc3MoJ2hlaWdodCcpO1xuICAgICRwYWdlQ29udGFpbmVyLmNzcyh7IGhlaWdodDogJycgfSk7IC8vIENsZWFyIGFueSBwcmV2aW91c2x5IGNvbXB1dGVkIGhlaWdodCBzbyB3ZSBnZXQgYSBmcmVzaCBjb21wdXRhdGlvbiBvZiB0aGUgY2hpbGQgaGVpZ2h0c1xuICAgIHZhciBuZXdCb2R5SGVpZ2h0ID0gTWF0aC5taW4oMzAwLCAkYm9keS5nZXQoMCkuc2Nyb2xsSGVpZ2h0KTtcbiAgICAkYm9keS5jc3MoeyBoZWlnaHQ6IG5ld0JvZHlIZWlnaHQgfSk7IC8vIFRPRE86IGRvdWJsZS1jaGVjayB0aGF0IHdlIGNhbid0IGp1c3Qgc2V0IGEgbWF4LWhlaWdodCBvZiAzMDBweCBvbiB0aGUgYm9keS5cbiAgICB2YXIgZm9vdGVySGVpZ2h0ID0gJHBhZ2UuZmluZCgnLmFudGVubmEtZm9vdGVyJykub3V0ZXJIZWlnaHQoKTsgLy8gcmV0dXJucyAnbnVsbCcgaWYgdGhlcmUncyBubyBmb290ZXIuIGFkZGVkIHRvIGFuIGludGVnZXIsICdudWxsJyBhY3RzIGxpa2UgMFxuICAgIHZhciBuZXdQYWdlSGVpZ2h0ID0gbmV3Qm9keUhlaWdodCArIGZvb3RlckhlaWdodDtcbiAgICBpZiAoYW5pbWF0ZSkge1xuICAgICAgICAkcGFnZUNvbnRhaW5lci5jc3MoeyBoZWlnaHQ6IGN1cnJlbnRIZWlnaHQgfSk7XG4gICAgICAgICRwYWdlQ29udGFpbmVyLmFuaW1hdGUoeyBoZWlnaHQ6IG5ld1BhZ2VIZWlnaHQgfSwgMjAwKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAkcGFnZUNvbnRhaW5lci5jc3MoeyBoZWlnaHQ6IG5ld1BhZ2VIZWlnaHQgfSk7XG4gICAgfVxuICAgIC8vIFRPRE86IHdlIG1pZ2h0IG5vdCBuZWVkIHdpZHRoIHJlc2l6aW5nIGF0IGFsbC5cbiAgICB2YXIgbWluV2lkdGggPSAkcGFnZS5jc3MoJ21pbi13aWR0aCcpO1xuICAgIHZhciB3aWR0aCA9IHBhcnNlSW50KG1pbldpZHRoKTtcbiAgICBpZiAod2lkdGggPiAwKSB7XG4gICAgICAgIGlmIChhbmltYXRlKSB7XG4gICAgICAgICAgICAkcm9vdEVsZW1lbnQuYW5pbWF0ZSh7IHdpZHRoOiB3aWR0aCB9LCAyMDApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJHJvb3RFbGVtZW50LmNzcyh7IHdpZHRoOiB3aWR0aCB9KTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gc2V0dXBXaW5kb3dDbG9zZShwYWdlcywgcmFjdGl2ZSkge1xuICAgIHZhciAkcm9vdEVsZW1lbnQgPSAkKHJvb3RFbGVtZW50KHJhY3RpdmUpKTtcblxuICAgIC8vIFRPRE86IElmIHlvdSBtb3VzZSBvdmVyIHRoZSB0cmlnZ2VyIHNsb3dseSBmcm9tIHRoZSB0b3AgbGVmdCwgdGhlIHdpbmRvdyBvcGVucyB3aXRob3V0IGJlaW5nIHVuZGVyIHRoZSBjdXJzb3IsXG4gICAgLy8gICAgICAgc28gbm8gbW91c2VvdXQgZXZlbnQgaXMgcmVjZWl2ZWQuIFdoZW4gd2Ugb3BlbiB0aGUgd2luZG93LCB3ZSBzaG91bGQgcHJvYmFibHkganVzdCBzY29vdCBpdCB1cCBzbGlnaHRseVxuICAgIC8vICAgICAgIGlmIG5lZWRlZCB0byBhc3N1cmUgdGhhdCBpdCdzIHVuZGVyIHRoZSBjdXJzb3IuIEFsdGVybmF0aXZlbHksIHdlIGNvdWxkIGFkanVzdCB0aGUgbW91c2VvdmVyIGFyZWEgdG8gbWF0Y2hcbiAgICAvLyAgICAgICB0aGUgcmVnaW9uIHRoYXQgdGhlIHdpbmRvdyBvcGVucy5cbiAgICAkcm9vdEVsZW1lbnRcbiAgICAgICAgLm9uKCdtb3VzZW91dC5hbnRlbm5hJywgZGVsYXllZENsb3NlV2luZG93KVxuICAgICAgICAub24oJ21vdXNlb3Zlci5hbnRlbm5hJywga2VlcFdpbmRvd09wZW4pXG4gICAgICAgIC5vbignZm9jdXNpbi5hbnRlbm5hJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAvLyBPbmNlIHRoZSB3aW5kb3cgaGFzIGZvY3VzLCBkb24ndCBjbG9zZSBpdCBvbiBtb3VzZW91dC5cbiAgICAgICAgICAgIGtlZXBXaW5kb3dPcGVuKCk7XG4gICAgICAgICAgICAkcm9vdEVsZW1lbnQub2ZmKCdtb3VzZW91dC5hbnRlbm5hJyk7XG4gICAgICAgICAgICAkcm9vdEVsZW1lbnQub2ZmKCdtb3VzZW92ZXIuYW50ZW5uYScpO1xuICAgICAgICB9KTtcbiAgICAkKGRvY3VtZW50KS5vbignY2xpY2suYW50ZW5uYScsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGlmICgkKGV2ZW50LnRhcmdldCkuY2xvc2VzdCgnLmFudGVubmEtcmVhY3Rpb25zLXdpZGdldCcpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgY2xvc2VBbGxXaW5kb3dzKCk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICB2YXIgdGFwTGlzdGVuZXIgPSBUb3VjaFN1cHBvcnQuc2V0dXBUYXAoZG9jdW1lbnQsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGlmICgkKGV2ZW50LnRhcmdldCkuY2xvc2VzdCgnLmFudGVubmEtcmVhY3Rpb25zLXdpZGdldCcpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIGNsb3NlQWxsV2luZG93cygpO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmFjdGl2ZS5vbignY2xvc2VXaW5kb3cnLCBjbG9zZVdpbmRvdyk7XG5cbiAgICB2YXIgY2xvc2VUaW1lcjtcblxuICAgIGZ1bmN0aW9uIGRlbGF5ZWRDbG9zZVdpbmRvdygpIHtcbiAgICAgICAgY2xvc2VUaW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBjbG9zZVRpbWVyID0gbnVsbDtcbiAgICAgICAgICAgIGNsb3NlV2luZG93KCk7XG4gICAgICAgIH0sIDUwMCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24ga2VlcFdpbmRvd09wZW4oKSB7XG4gICAgICAgIGNsZWFyVGltZW91dChjbG9zZVRpbWVyKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjbG9zZVdpbmRvdygpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KGNsb3NlVGltZXIpO1xuXG4gICAgICAgICRyb290RWxlbWVudC5zdG9wKHRydWUsIHRydWUpLmZhZGVPdXQoJ2Zhc3QnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICRyb290RWxlbWVudC5jc3MoJ2Rpc3BsYXknLCAnJyk7IC8vIENsZWFyIHRoZSBkaXNwbGF5Om5vbmUgdGhhdCBmYWRlT3V0IHB1dHMgb24gdGhlIGVsZW1lbnRcbiAgICAgICAgICAgICRyb290RWxlbWVudC5yZW1vdmVDbGFzcygnb3BlbicpO1xuICAgICAgICB9KTtcbiAgICAgICAgJHJvb3RFbGVtZW50Lm9mZignLmFudGVubmEnKTsgLy8gVW5iaW5kIGFsbCBvZiB0aGUgaGFuZGxlcnMgaW4gb3VyIG5hbWVzcGFjZVxuICAgICAgICAkKGRvY3VtZW50KS5vZmYoJ2NsaWNrLmFudGVubmEnKTtcbiAgICAgICAgdGFwTGlzdGVuZXIudGVhcmRvd24oKTtcbiAgICAgICAgUmFuZ2UuY2xlYXJIaWdobGlnaHRzKCk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGFnZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHBhZ2VzW2ldLnRlYXJkb3duKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmFjdGl2ZS50ZWFyZG93bigpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gY2xvc2VBbGxXaW5kb3dzKCkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb3Blbkluc3RhbmNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBvcGVuSW5zdGFuY2VzW2ldLmZpcmUoJ2Nsb3NlV2luZG93Jyk7XG4gICAgfVxuICAgIG9wZW5JbnN0YW5jZXMgPSBbXTtcbn1cblxuZnVuY3Rpb24gaXNPcGVuV2luZG93KCkge1xuICAgIHJldHVybiBvcGVuSW5zdGFuY2VzLmxlbmd0aCA+IDA7XG59XG5cbi8vIFByZXZlbnQgc2Nyb2xsaW5nIG9mIHRoZSBkb2N1bWVudCBhZnRlciB3ZSBzY3JvbGwgdG8gdGhlIHRvcC9ib3R0b20gb2YgdGhlIHJlYWN0aW9ucyB3aW5kb3dcbi8vIENvZGUgY29waWVkIGZyb206IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvNTgwMjQ2Ny9wcmV2ZW50LXNjcm9sbGluZy1vZi1wYXJlbnQtZWxlbWVudFxuLy8gVE9ETzogZG9lcyB0aGlzIHdvcmsgb24gbW9iaWxlP1xuZnVuY3Rpb24gcHJldmVudEV4dHJhU2Nyb2xsKCRyb290RWxlbWVudCkge1xuICAgICRyb290RWxlbWVudC5vbignRE9NTW91c2VTY3JvbGwuYW50ZW5uYSBtb3VzZXdoZWVsLmFudGVubmEnLCAnLmFudGVubmEtYm9keScsIGZ1bmN0aW9uKGV2KSB7XG4gICAgICAgIHZhciAkdGhpcyA9ICQodGhpcyksXG4gICAgICAgICAgICBzY3JvbGxUb3AgPSB0aGlzLnNjcm9sbFRvcCxcbiAgICAgICAgICAgIHNjcm9sbEhlaWdodCA9IHRoaXMuc2Nyb2xsSGVpZ2h0LFxuICAgICAgICAgICAgaGVpZ2h0ID0gJHRoaXMuaGVpZ2h0KCksXG4gICAgICAgICAgICBkZWx0YSA9IChldi50eXBlID09ICdET01Nb3VzZVNjcm9sbCcgP1xuICAgICAgICAgICAgICAgIGV2Lm9yaWdpbmFsRXZlbnQuZGV0YWlsICogLTQwIDpcbiAgICAgICAgICAgICAgICBldi5vcmlnaW5hbEV2ZW50LndoZWVsRGVsdGEpLFxuICAgICAgICAgICAgdXAgPSBkZWx0YSA+IDA7XG5cbiAgICAgICAgaWYgKHNjcm9sbEhlaWdodCA8PSBoZWlnaHQpIHtcbiAgICAgICAgICAgIC8vIFRoaXMgaXMgYW4gYWRkaXRpb24gdG8gdGhlIFN0YWNrT3ZlcmZsb3cgY29kZSwgdG8gbWFrZSBzdXJlIHRoZSBwYWdlIHNjcm9sbHMgYXMgdXN1YWwgaWYgdGhlIHdpbmRvd1xuICAgICAgICAgICAgLy8gY29udGVudCBkb2Vzbid0IHNjcm9sbC5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBwcmV2ZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBldi5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBldi5yZXR1cm5WYWx1ZSA9IGZhbHNlO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9O1xuXG4gICAgICAgIGlmICghdXAgJiYgLWRlbHRhID4gc2Nyb2xsSGVpZ2h0IC0gaGVpZ2h0IC0gc2Nyb2xsVG9wKSB7XG4gICAgICAgICAgICAvLyBTY3JvbGxpbmcgZG93biwgYnV0IHRoaXMgd2lsbCB0YWtlIHVzIHBhc3QgdGhlIGJvdHRvbS5cbiAgICAgICAgICAgICR0aGlzLnNjcm9sbFRvcChzY3JvbGxIZWlnaHQpO1xuICAgICAgICAgICAgcmV0dXJuIHByZXZlbnQoKTtcbiAgICAgICAgfSBlbHNlIGlmICh1cCAmJiBkZWx0YSA+IHNjcm9sbFRvcCkge1xuICAgICAgICAgICAgLy8gU2Nyb2xsaW5nIHVwLCBidXQgdGhpcyB3aWxsIHRha2UgdXMgcGFzdCB0aGUgdG9wLlxuICAgICAgICAgICAgJHRoaXMuc2Nyb2xsVG9wKDApO1xuICAgICAgICAgICAgcmV0dXJuIHByZXZlbnQoKTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgb3Blbjogb3BlblJlYWN0aW9uc1dpZGdldCxcbiAgICBpc09wZW46IGlzT3BlbldpbmRvdyxcbiAgICBQQUdFX1JFQUNUSU9OUzogcGFnZVJlYWN0aW9ucyxcbiAgICBQQUdFX0RFRkFVTFRTOiBwYWdlRGVmYXVsdHMsXG4gICAgUEFHRV9BVVRPOiBwYWdlQXV0b1xufTsiLCJ2YXIgUmFjdGl2ZVByb3ZpZGVyID0gcmVxdWlyZSgnLi91dGlscy9yYWN0aXZlLXByb3ZpZGVyJyk7XG52YXIgUmFuZ3lQcm92aWRlciA9IHJlcXVpcmUoJy4vdXRpbHMvcmFuZ3ktcHJvdmlkZXInKTtcbnZhciBKUXVlcnlQcm92aWRlciA9IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJyk7XG52YXIgQXBwTW9kZSA9IHJlcXVpcmUoJy4vdXRpbHMvYXBwLW1vZGUnKTtcbnZhciBVUkxzID0gcmVxdWlyZSgnLi91dGlscy91cmxzJyk7XG5cbnZhciBiYXNlVXJsID0gVVJMcy5hbnRlbm5hSG9tZSgpO1xuXG52YXIgc2NyaXB0cyA9IFtcbiAgICB7c3JjOiAnLy9jZG5qcy5jbG91ZGZsYXJlLmNvbS9hamF4L2xpYnMvanF1ZXJ5LzIuMS40L2pxdWVyeS5taW4uanMnLCBjYWxsYmFjazogSlF1ZXJ5UHJvdmlkZXIubG9hZGVkfSxcbiAgICB7c3JjOiAnLy9jZG5qcy5jbG91ZGZsYXJlLmNvbS9hamF4L2xpYnMvcmFjdGl2ZS8wLjcuMy9yYWN0aXZlLnJ1bnRpbWUubWluLmpzJywgY2FsbGJhY2s6IFJhY3RpdmVQcm92aWRlci5sb2FkZWQsIGFib3V0VG9Mb2FkOiBSYWN0aXZlUHJvdmlkZXIuYWJvdXRUb0xvYWR9LFxuICAgIHtzcmM6IGJhc2VVcmwgKyAnL3N0YXRpYy93aWRnZXQtbmV3L2xpYi9yYW5neS1jb21waWxlZC5qcycsIGNhbGxiYWNrOiBSYW5neVByb3ZpZGVyLmxvYWRlZCwgYWJvdXRUb0xvYWQ6IFJhbmd5UHJvdmlkZXIuYWJvdXRUb0xvYWR9IC8vIFRPRE8gbWluaWZ5IGFuZCBob3N0IHRoaXMgc29tZXdoZXJlXG5dO1xuaWYgKEFwcE1vZGUub2ZmbGluZSkge1xuICAgIC8vIFVzZSB0aGUgb2ZmbGluZSB2ZXJzaW9ucyBvZiB0aGUgbGlicmFyaWVzIGZvciBkZXZlbG9wbWVudC5cbiAgICBzY3JpcHRzID0gW1xuICAgICAgICB7c3JjOiBiYXNlVXJsICsgJy9zdGF0aWMvanMvY2RuL2pxdWVyeS8yLjEuNC9qcXVlcnkuanMnLCBjYWxsYmFjazogSlF1ZXJ5UHJvdmlkZXIubG9hZGVkfSxcbiAgICAgICAge3NyYzogYmFzZVVybCArICcvc3RhdGljL2pzL2Nkbi9yYWN0aXZlLzAuNy4zL3JhY3RpdmUucnVudGltZS5qcycsIGNhbGxiYWNrOiBSYWN0aXZlUHJvdmlkZXIubG9hZGVkLCBhYm91dFRvTG9hZDogUmFjdGl2ZVByb3ZpZGVyLmFib3V0VG9Mb2FkfSxcbiAgICAgICAge3NyYzogYmFzZVVybCArICcvc3RhdGljL3dpZGdldC1uZXcvbGliL3Jhbmd5LWNvbXBpbGVkLmpzJywgY2FsbGJhY2s6IFJhbmd5UHJvdmlkZXIubG9hZGVkLCBhYm91dFRvTG9hZDogUmFuZ3lQcm92aWRlci5hYm91dFRvTG9hZH1cbiAgICBdO1xufVxuXG5mdW5jdGlvbiBsb2FkQWxsU2NyaXB0cyhsb2FkZWRDYWxsYmFjaykge1xuICAgIGxvYWRTY3JpcHRzKHNjcmlwdHMsIGxvYWRlZENhbGxiYWNrKTtcbn1cblxuZnVuY3Rpb24gbG9hZFNjcmlwdHMoc2NyaXB0cywgbG9hZGVkQ2FsbGJhY2spIHtcbiAgICB2YXIgbG9hZGluZ0NvdW50ID0gc2NyaXB0cy5sZW5ndGg7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzY3JpcHRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBzY3JpcHQgPSBzY3JpcHRzW2ldO1xuICAgICAgICBpZiAoc2NyaXB0LmFib3V0VG9Mb2FkKSB7IHNjcmlwdC5hYm91dFRvTG9hZCgpOyB9XG4gICAgICAgIGxvYWRTY3JpcHQoc2NyaXB0LnNyYywgZnVuY3Rpb24oc2NyaXB0Q2FsbGJhY2spIHtcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBpZiAoc2NyaXB0Q2FsbGJhY2spIHNjcmlwdENhbGxiYWNrKCk7XG4gICAgICAgICAgICAgICAgbG9hZGluZ0NvdW50ID0gbG9hZGluZ0NvdW50IC0gMTtcbiAgICAgICAgICAgICAgICBpZiAobG9hZGluZ0NvdW50ID09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxvYWRlZENhbGxiYWNrKSBsb2FkZWRDYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gKHNjcmlwdC5jYWxsYmFjaykpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gbG9hZFNjcmlwdChzcmMsIGNhbGxiYWNrKSB7XG4gICAgdmFyIGhlYWQgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaGVhZCcpWzBdO1xuICAgIGlmIChoZWFkKSB7XG4gICAgICAgIHZhciBzY3JpcHRUYWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKTtcbiAgICAgICAgc2NyaXB0VGFnLnNldEF0dHJpYnV0ZSgnc3JjJywgc3JjKTtcbiAgICAgICAgc2NyaXB0VGFnLnNldEF0dHJpYnV0ZSgndHlwZScsJ3RleHQvamF2YXNjcmlwdCcpO1xuXG4gICAgICAgIGlmIChzY3JpcHRUYWcucmVhZHlTdGF0ZSkgeyAvLyBJRSwgaW5jbC4gSUU5XG4gICAgICAgICAgICBzY3JpcHRUYWcub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNjcmlwdFRhZy5yZWFkeVN0YXRlID09IFwibG9hZGVkXCIgfHwgc2NyaXB0VGFnLnJlYWR5U3RhdGUgPT0gXCJjb21wbGV0ZVwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHNjcmlwdFRhZy5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICBpZiAoY2FsbGJhY2spIHsgY2FsbGJhY2soKTsgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzY3JpcHRUYWcub25sb2FkID0gZnVuY3Rpb24oKSB7IC8vIE90aGVyIGJyb3dzZXJzXG4gICAgICAgICAgICAgICAgaWYgKGNhbGxiYWNrKSB7IGNhbGxiYWNrKCk7IH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICBoZWFkLmFwcGVuZENoaWxkKHNjcmlwdFRhZyk7XG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgbG9hZDogbG9hZEFsbFNjcmlwdHNcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgUmFjdGl2ZTsgcmVxdWlyZSgnLi91dGlscy9yYWN0aXZlLXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGxvYWRlZFJhY3RpdmUpIHsgUmFjdGl2ZSA9IGxvYWRlZFJhY3RpdmU7fSk7XG52YXIgUmVhY3Rpb25zV2lkZ2V0ID0gcmVxdWlyZSgnLi9yZWFjdGlvbnMtd2lkZ2V0Jyk7XG5cbmZ1bmN0aW9uIGNyZWF0ZVN1bW1hcnlXaWRnZXQoY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGRlZmF1bHRSZWFjdGlvbnMsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgcmFjdGl2ZSA9IFJhY3RpdmUoe1xuICAgICAgICBlbDogJCgnPGRpdj4nKSwgLy8gdGhlIHJlYWwgcm9vdCBub2RlIGlzIGluIHRoZSB0ZW1wbGF0ZS4gaXQncyBleHRyYWN0ZWQgYWZ0ZXIgdGhlIHRlbXBsYXRlIGlzIHJlbmRlcmVkIGludG8gdGhpcyBkdW1teSBlbGVtZW50XG4gICAgICAgIGRhdGE6IHBhZ2VEYXRhLFxuICAgICAgICBtYWdpYzogdHJ1ZSxcbiAgICAgICAgdGVtcGxhdGU6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9zdW1tYXJ5LXdpZGdldC5oYnMuaHRtbCcpLFxuICAgICAgICBwYXJ0aWFsczoge1xuICAgICAgICAgICAgbG9nbzogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL2xvZ28tc3ZnLmhicy5odG1sJylcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHZhciAkcm9vdEVsZW1lbnQgPSAkKHJvb3RFbGVtZW50KHJhY3RpdmUpKTtcbiAgICAkcm9vdEVsZW1lbnQub24oJ21vdXNlZW50ZXInLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgIG9wZW5SZWFjdGlvbnNXaW5kb3coY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGRlZmF1bHRSZWFjdGlvbnMsIGdyb3VwU2V0dGluZ3MsIHJhY3RpdmUpO1xuICAgIH0pO1xuICAgIHJldHVybiAkcm9vdEVsZW1lbnQ7XG59XG5cbmZ1bmN0aW9uIHJvb3RFbGVtZW50KHJhY3RpdmUpIHtcbiAgICAvLyBUT0RPOiBnb3R0YSBiZSBhIGJldHRlciB3YXkgdG8gZ2V0IHRoaXNcbiAgICByZXR1cm4gcmFjdGl2ZS5maW5kKCcuYW50LXN1bW1hcnktd2lkZ2V0Jyk7XG59XG5cbmZ1bmN0aW9uIG9wZW5SZWFjdGlvbnNXaW5kb3coY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGRlZmF1bHRSZWFjdGlvbnMsIGdyb3VwU2V0dGluZ3MsIHJhY3RpdmUpIHtcbiAgICB2YXIgcmVhY3Rpb25zV2lkZ2V0T3B0aW9ucyA9IHtcbiAgICAgICAgaXNTdW1tYXJ5OiB0cnVlLFxuICAgICAgICByZWFjdGlvbnNEYXRhOiBwYWdlRGF0YS5zdW1tYXJ5UmVhY3Rpb25zLFxuICAgICAgICBjb250YWluZXJEYXRhOiBjb250YWluZXJEYXRhLFxuICAgICAgICBkZWZhdWx0UmVhY3Rpb25zOiBkZWZhdWx0UmVhY3Rpb25zLFxuICAgICAgICBwYWdlRGF0YTogcGFnZURhdGEsXG4gICAgICAgIGdyb3VwU2V0dGluZ3M6IGdyb3VwU2V0dGluZ3MsXG4gICAgICAgIGNvbnRlbnREYXRhOiB7IHR5cGU6ICdwYWdlJywgYm9keTogJycgfVxuICAgIH07XG4gICAgUmVhY3Rpb25zV2lkZ2V0Lm9wZW4ocmVhY3Rpb25zV2lkZ2V0T3B0aW9ucywgcm9vdEVsZW1lbnQocmFjdGl2ZSkpO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlOiBjcmVhdGVTdW1tYXJ5V2lkZ2V0XG59OyIsInZhciBSYWN0aXZlOyByZXF1aXJlKCcuL3V0aWxzL3JhY3RpdmUtcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24obG9hZGVkUmFjdGl2ZSkgeyBSYWN0aXZlID0gbG9hZGVkUmFjdGl2ZTt9KTtcblxuLy8gQWJvdXQgaG93IHdlIGhhbmRsZSBpY29uczogV2UgaW5zZXJ0IGEgc2luZ2xlIFNWRyBlbGVtZW50IGF0IHRoZSB0b3Agb2YgdGhlIGJvZHkgZWxlbWVudCB3aGljaCBkZWZpbmVzIGFsbCBvZiB0aGVcbi8vIGljb25zIHdlIG5lZWQuIFRoZW4gYWxsIGljb25zIHVzZWQgYnkgdGhlIGFwcGxpY2F0aW9ucyBhcmUgcmVuZGVyZWQgd2l0aCB2ZXJ5IGxpZ2h0d2VpZ2h0IFNWRyBlbGVtZW50cyB0aGF0IHNpbXBseVxuLy8gcG9pbnQgdG8gdGhlIGFwcHJvcHJpYXRlIGljb24gYnkgcmVmZXJlbmNlLlxuXG4vLyBUT0RPOiBsb29rIGludG8gdXNpbmcgYSBzaW5nbGUgdGVtcGxhdGUgZm9yIHRoZSBcInVzZVwiIFNWR3MuIENhbiB3ZSBpbnN0YW50aWF0ZSBhIHBhcnRpYWwgd2l0aCBhIGR5bmFtaWMgY29udGV4dD9cbnZhciB0ZW1wbGF0ZXMgPSB7XG4gICAgbG9nbzogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL2xvZ28tc3ZnLmhicy5odG1sJyksXG4gICAgY29tbWVudHM6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9zdmctY29tbWVudHMuaGJzLmh0bWwnKSxcbiAgICBsb2NhdGlvbjogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL3N2Zy1sb2NhdGlvbi5oYnMuaHRtbCcpLFxuICAgIGZhY2Vib29rOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvc3ZnLWZhY2Vib29rLmhicy5odG1sJyksXG4gICAgdHdpdHRlcjogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL3N2Zy10d2l0dGVyLmhicy5odG1sJylcbn07XG5cbnZhciBpc1NldHVwID0gZmFsc2U7XG5cbmZ1bmN0aW9uIGVuc3VyZVNldHVwKCkge1xuICAgIGlmICghaXNTZXR1cCkge1xuICAgICAgICB2YXIgZHVtbXkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgUmFjdGl2ZSh7XG4gICAgICAgICAgICBlbDogZHVtbXksXG4gICAgICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL3N2Z3MuaGJzLmh0bWwnKVxuICAgICAgICB9KTtcbiAgICAgICAgLy8gU2FmYXJpIG9uIGlPUyByZXF1aXJlcyB0aGUgU1ZHIHRoYXQgZGVmaW5lcyB0aGUgaWNvbnMgYXBwZWFyIGJlZm9yZSB0aGUgU1ZHcyB0aGF0IHJlZmVyZW5jZSBpdC5cbiAgICAgICAgZG9jdW1lbnQuYm9keS5pbnNlcnRCZWZvcmUoZHVtbXkuY2hpbGRyZW5bMF0sIGRvY3VtZW50LmJvZHkuZmlyc3RDaGlsZCk7XG4gICAgICAgIGlzU2V0dXAgPSB0cnVlO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZ2V0U1ZHKHRlbXBsYXRlKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICBlbnN1cmVTZXR1cCgpO1xuICAgICAgICByZXR1cm4gdGVtcGxhdGU7XG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgbG9nbzogZ2V0U1ZHKHRlbXBsYXRlcy5sb2dvKSxcbiAgICBjb21tZW50czogZ2V0U1ZHKHRlbXBsYXRlcy5jb21tZW50cyksXG4gICAgbG9jYXRpb246IGdldFNWRyh0ZW1wbGF0ZXMubG9jYXRpb24pLFxuICAgIGZhY2Vib29rOiBnZXRTVkcodGVtcGxhdGVzLmZhY2Vib29rKSxcbiAgICB0d2l0dGVyOiBnZXRTVkcodGVtcGxhdGVzLnR3aXR0ZXIpXG59OyIsInZhciAkOyByZXF1aXJlKCcuL3V0aWxzL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIFJhY3RpdmU7IHJlcXVpcmUoJy4vdXRpbHMvcmFjdGl2ZS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihsb2FkZWRSYWN0aXZlKSB7IFJhY3RpdmUgPSBsb2FkZWRSYWN0aXZlO30pO1xudmFyIFJhbmdlID0gcmVxdWlyZSgnLi91dGlscy9yYW5nZScpO1xuXG52YXIgUG9wdXBXaWRnZXQgPSByZXF1aXJlKCcuL3BvcHVwLXdpZGdldCcpO1xudmFyIFJlYWN0aW9uc1dpZGdldCA9IHJlcXVpcmUoJy4vcmVhY3Rpb25zLXdpZGdldCcpO1xudmFyIFNWR3MgPSByZXF1aXJlKCcuL3N2Z3MnKTtcblxuXG5mdW5jdGlvbiBjcmVhdGVJbmRpY2F0b3JXaWRnZXQob3B0aW9ucykge1xuICAgIHZhciBjb250YWluZXJEYXRhID0gb3B0aW9ucy5jb250YWluZXJEYXRhO1xuICAgIHZhciAkY29udGFpbmVyRWxlbWVudCA9IG9wdGlvbnMuY29udGFpbmVyRWxlbWVudDtcbiAgICB2YXIgcGFnZURhdGEgPSBvcHRpb25zLnBhZ2VEYXRhO1xuICAgIHZhciBncm91cFNldHRpbmdzID0gb3B0aW9ucy5ncm91cFNldHRpbmdzO1xuICAgIHZhciBkZWZhdWx0UmVhY3Rpb25zID0gb3B0aW9ucy5kZWZhdWx0UmVhY3Rpb25zO1xuICAgIHZhciBjb29yZHMgPSBvcHRpb25zLmNvb3JkcztcbiAgICB2YXIgcmFjdGl2ZSA9IFJhY3RpdmUoe1xuICAgICAgICBlbDogJCgnPGRpdj4nKSwgLy8gdGhlIHJlYWwgcm9vdCBub2RlIGlzIGluIHRoZSB0ZW1wbGF0ZS4gaXQncyBleHRyYWN0ZWQgYWZ0ZXIgdGhlIHRlbXBsYXRlIGlzIHJlbmRlcmVkIGludG8gdGhpcyBkdW1teSBlbGVtZW50XG4gICAgICAgIGFwcGVuZDogdHJ1ZSxcbiAgICAgICAgbWFnaWM6IHRydWUsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIGNvbnRhaW5lckRhdGE6IGNvbnRhaW5lckRhdGEsXG4gICAgICAgICAgICBleHRyYUNsYXNzZXM6IGdyb3VwU2V0dGluZ3MuZW5hYmxlVGV4dEhlbHBlcigpID8gXCJcIiA6IFwiYW50ZW5uYS1ub2hpbnRcIlxuICAgICAgICB9LFxuICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL3RleHQtaW5kaWNhdG9yLXdpZGdldC5oYnMuaHRtbCcpLFxuICAgICAgICBwYXJ0aWFsczoge1xuICAgICAgICAgICAgbG9nbzogU1ZHcy5sb2dvKClcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgdmFyIHJlYWN0aW9uV2lkZ2V0T3B0aW9ucyA9IHtcbiAgICAgICAgcmVhY3Rpb25zRGF0YTogY29udGFpbmVyRGF0YS5yZWFjdGlvbnMsXG4gICAgICAgIGNvbnRhaW5lckRhdGE6IGNvbnRhaW5lckRhdGEsXG4gICAgICAgIGNvbnRhaW5lckVsZW1lbnQ6ICRjb250YWluZXJFbGVtZW50LFxuICAgICAgICBjb250ZW50RGF0YTogeyB0eXBlOiAndGV4dCcgfSxcbiAgICAgICAgZGVmYXVsdFJlYWN0aW9uczogZGVmYXVsdFJlYWN0aW9ucyxcbiAgICAgICAgcGFnZURhdGE6IHBhZ2VEYXRhLFxuICAgICAgICBncm91cFNldHRpbmdzOiBncm91cFNldHRpbmdzXG4gICAgfTtcblxuICAgIHZhciAkcm9vdEVsZW1lbnQgPSAkKHJvb3RFbGVtZW50KHJhY3RpdmUpKTtcbiAgICBpZiAoY29vcmRzKSB7XG4gICAgICAgICRyb290RWxlbWVudC5jc3Moe1xuICAgICAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXG4gICAgICAgICAgICB0b3A6IGNvb3Jkcy50b3AgLSAkcm9vdEVsZW1lbnQuaGVpZ2h0KCksXG4gICAgICAgICAgICBib3R0b206IGNvb3Jkcy5ib3R0b20sXG4gICAgICAgICAgICBsZWZ0OiBjb29yZHMubGVmdCxcbiAgICAgICAgICAgIHJpZ2h0OiBjb29yZHMucmlnaHQsXG4gICAgICAgICAgICAnei1pbmRleCc6IDEwMDAgLy8gVE9ETzogY29tcHV0ZSBhIHJlYWwgdmFsdWU/XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICB2YXIgaG92ZXJUaW1lb3V0O1xuICAgICRyb290RWxlbWVudC5vbignbW91c2VlbnRlci5hbnRlbm5hJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgaWYgKGV2ZW50LmJ1dHRvbnMgPiAwIHx8IChldmVudC5idXR0b25zID09IHVuZGVmaW5lZCAmJiBldmVudC53aGljaCA+IDApKSB7IC8vIE9uIFNhZmFyaSwgZXZlbnQuYnV0dG9ucyBpcyB1bmRlZmluZWQgYnV0IGV2ZW50LndoaWNoIGdpdmVzIGEgZ29vZCB2YWx1ZS4gZXZlbnQud2hpY2ggaXMgYmFkIG9uIEZGXG4gICAgICAgICAgICAvLyBEb24ndCByZWFjdCBpZiB0aGUgdXNlciBpcyBkcmFnZ2luZyBvciBzZWxlY3RpbmcgdGV4dC5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICAvLyBUT0RPOiBEb24ndCByZWFjdCBpZiB0aGUgZGF0YSBpc24ndCBsb2FkZWQgeWV0IChpLmUuIHdlIGRvbid0IGtub3cgd2hldGhlciB0byBzaG93IHRoZSBwb3B1cCBvciByZWFjdGlvbiB3aWRnZXQpXG4gICAgICAgIGNsZWFyVGltZW91dChob3ZlclRpbWVvdXQpOyAvLyBvbmx5IG9uZSB0aW1lb3V0IGF0IGEgdGltZVxuICAgICAgICBob3ZlclRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKGNvbnRhaW5lckRhdGEucmVhY3Rpb25zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBvcGVuUmVhY3Rpb25zV2luZG93KHJlYWN0aW9uV2lkZ2V0T3B0aW9ucywgcmFjdGl2ZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhciAkaWNvbiA9ICQocm9vdEVsZW1lbnQocmFjdGl2ZSkpLmZpbmQoJy5hbnRlbm5hLWxvZ28nKTtcbiAgICAgICAgICAgICAgICB2YXIgb2Zmc2V0ID0gJGljb24ub2Zmc2V0KCk7XG4gICAgICAgICAgICAgICAgdmFyIGNvb3JkaW5hdGVzID0ge1xuICAgICAgICAgICAgICAgICAgICB0b3A6IG9mZnNldC50b3AgKyBNYXRoLmZsb29yKCRpY29uLmhlaWdodCgpIC8gMiksIC8vIFRPRE8gdGhpcyBudW1iZXIgaXMgYSBsaXR0bGUgb2ZmIGJlY2F1c2UgdGhlIGRpdiBkb2Vzbid0IHRpZ2h0bHkgd3JhcCB0aGUgaW5zZXJ0ZWQgZm9udCBjaGFyYWN0ZXJcbiAgICAgICAgICAgICAgICAgICAgbGVmdDogb2Zmc2V0LmxlZnQgKyBNYXRoLmZsb29yKCRpY29uLndpZHRoKCkgLyAyKVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgUG9wdXBXaWRnZXQuc2hvdyhjb29yZGluYXRlcywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIG9wZW5SZWFjdGlvbnNXaW5kb3cocmVhY3Rpb25XaWRnZXRPcHRpb25zLCByYWN0aXZlKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgMjAwKTtcbiAgICB9KTtcbiAgICAkcm9vdEVsZW1lbnQub24oJ21vdXNlbGVhdmUuYW50ZW5uYScsIGZ1bmN0aW9uKCkge1xuICAgICAgICBjbGVhclRpbWVvdXQoaG92ZXJUaW1lb3V0KTtcbiAgICB9KTtcbiAgICAkY29udGFpbmVyRWxlbWVudC5vbignbW91c2VlbnRlci5hbnRlbm5hJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICRyb290RWxlbWVudC5hZGRDbGFzcygnYWN0aXZlJyk7XG4gICAgfSk7XG4gICAgJGNvbnRhaW5lckVsZW1lbnQub24oJ21vdXNlbGVhdmUuYW50ZW5uYScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAkcm9vdEVsZW1lbnQucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpO1xuICAgIH0pO1xuICAgIHJldHVybiAkcm9vdEVsZW1lbnQ7XG59XG5cbmZ1bmN0aW9uIHJvb3RFbGVtZW50KHJhY3RpdmUpIHtcbiAgICByZXR1cm4gcmFjdGl2ZS5maW5kKCcuYW50ZW5uYS10ZXh0LWluZGljYXRvci13aWRnZXQnKTtcbn1cblxuZnVuY3Rpb24gb3BlblJlYWN0aW9uc1dpbmRvdyhyZWFjdGlvbk9wdGlvbnMsIHJhY3RpdmUpIHtcbiAgICBSZWFjdGlvbnNXaWRnZXQub3BlbihyZWFjdGlvbk9wdGlvbnMsIHJvb3RFbGVtZW50KHJhY3RpdmUpKTtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZTogY3JlYXRlSW5kaWNhdG9yV2lkZ2V0XG59OyIsInZhciAkOyByZXF1aXJlKCcuL3V0aWxzL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIFBvcHVwV2lkZ2V0ID0gcmVxdWlyZSgnLi9wb3B1cC13aWRnZXQnKTtcbnZhciBSYW5nZSA9IHJlcXVpcmUoJy4vdXRpbHMvcmFuZ2UnKTtcbnZhciBSZWFjdGlvbnNXaWRnZXQgPSByZXF1aXJlKCcuL3JlYWN0aW9ucy13aWRnZXQnKTtcbnZhciBUb3VjaFN1cHBvcnQgPSByZXF1aXJlKCcuL3V0aWxzL3RvdWNoLXN1cHBvcnQnKTtcblxuXG5mdW5jdGlvbiBjcmVhdGVSZWFjdGFibGVUZXh0KG9wdGlvbnMpIHtcbiAgICAvLyBUT0RPOiBpbXBvc2UgYW4gdXBwZXIgbGltaXQgb24gdGhlIGxlbmd0aCBvZiB0ZXh0IHRoYXQgY2FuIGJlIHJlYWN0ZWQgdG8/IChhcHBsaWVzIHRvIHRoZSBpbmRpY2F0b3Itd2lkZ2V0IHRvbylcbiAgICB2YXIgJGNvbnRhaW5lckVsZW1lbnQgPSBvcHRpb25zLmNvbnRhaW5lckVsZW1lbnQ7XG4gICAgdmFyIGNvbnRhaW5lckRhdGEgPSBvcHRpb25zLmNvbnRhaW5lckRhdGE7XG4gICAgdmFyIGV4Y2x1ZGVOb2RlID0gb3B0aW9ucy5leGNsdWRlTm9kZTtcbiAgICB2YXIgcmVhY3Rpb25zV2lkZ2V0T3B0aW9ucyA9IHtcbiAgICAgICAgcmVhY3Rpb25zRGF0YTogW10sIC8vIEFsd2F5cyBvcGVuIHdpdGggdGhlIGRlZmF1bHQgcmVhY3Rpb25zXG4gICAgICAgIGNvbnRhaW5lckRhdGE6IGNvbnRhaW5lckRhdGEsXG4gICAgICAgIGNvbnRlbnREYXRhOiB7IHR5cGU6ICd0ZXh0JyB9LFxuICAgICAgICBjb250YWluZXJFbGVtZW50OiAkY29udGFpbmVyRWxlbWVudCxcbiAgICAgICAgZGVmYXVsdFJlYWN0aW9uczogb3B0aW9ucy5kZWZhdWx0UmVhY3Rpb25zLFxuICAgICAgICBwYWdlRGF0YTogb3B0aW9ucy5wYWdlRGF0YSxcbiAgICAgICAgZ3JvdXBTZXR0aW5nczogb3B0aW9ucy5ncm91cFNldHRpbmdzXG4gICAgfTtcblxuICAgIHNldHVwVG91Y2hFdmVudHMoJGNvbnRhaW5lckVsZW1lbnQuZ2V0KDApLCByZWFjdGlvbnNXaWRnZXRPcHRpb25zKTtcbiAgICAkY29udGFpbmVyRWxlbWVudC5vbignbW91c2V1cCcsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGlmIChjb250YWluZXJEYXRhLmxvYWRlZCkge1xuICAgICAgICAgICAgdmFyIG5vZGUgPSAkY29udGFpbmVyRWxlbWVudC5nZXQoMCk7XG4gICAgICAgICAgICB2YXIgcG9pbnQgPSBSYW5nZS5nZXRTZWxlY3Rpb25FbmRQb2ludChub2RlLCBldmVudCwgZXhjbHVkZU5vZGUpO1xuICAgICAgICAgICAgaWYgKHBvaW50KSB7XG4gICAgICAgICAgICAgICAgdmFyIGNvb3JkaW5hdGVzID0ge3RvcDogcG9pbnQueSwgbGVmdDogcG9pbnQueH07XG4gICAgICAgICAgICAgICAgUG9wdXBXaWRnZXQuc2hvdyhjb29yZGluYXRlcywgZ3JhYlNlbGVjdGlvbkFuZE9wZW4obm9kZSwgY29vcmRpbmF0ZXMsIHJlYWN0aW9uc1dpZGdldE9wdGlvbnMsIGV4Y2x1ZGVOb2RlKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gZ3JhYlNlbGVjdGlvbkFuZE9wZW4obm9kZSwgY29vcmRpbmF0ZXMsIHJlYWN0aW9uc1dpZGdldE9wdGlvbnMsIGV4Y2x1ZGVOb2RlKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICBSYW5nZS5ncmFiU2VsZWN0aW9uKG5vZGUsIGZ1bmN0aW9uKHRleHQsIGxvY2F0aW9uKSB7XG4gICAgICAgICAgICByZWFjdGlvbnNXaWRnZXRPcHRpb25zLmNvbnRlbnREYXRhLmxvY2F0aW9uID0gbG9jYXRpb247XG4gICAgICAgICAgICByZWFjdGlvbnNXaWRnZXRPcHRpb25zLmNvbnRlbnREYXRhLmJvZHkgPSB0ZXh0O1xuICAgICAgICAgICAgUmVhY3Rpb25zV2lkZ2V0Lm9wZW4ocmVhY3Rpb25zV2lkZ2V0T3B0aW9ucywgY29vcmRpbmF0ZXMpO1xuICAgICAgICB9LCBleGNsdWRlTm9kZSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBncmFiTm9kZUFuZE9wZW4obm9kZSwgcmVhY3Rpb25zV2lkZ2V0T3B0aW9ucywgY29vcmRzKSB7XG4gICAgUmFuZ2UuZ3JhYk5vZGUobm9kZSwgZnVuY3Rpb24odGV4dCwgbG9jYXRpb24pIHtcbiAgICAgICAgcmVhY3Rpb25zV2lkZ2V0T3B0aW9ucy5jb250ZW50RGF0YS5sb2NhdGlvbiA9IGxvY2F0aW9uO1xuICAgICAgICByZWFjdGlvbnNXaWRnZXRPcHRpb25zLmNvbnRlbnREYXRhLmJvZHkgPSB0ZXh0O1xuICAgICAgICBSZWFjdGlvbnNXaWRnZXQub3BlbihyZWFjdGlvbnNXaWRnZXRPcHRpb25zLCBjb29yZHMpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBzZXR1cFRvdWNoRXZlbnRzKGVsZW1lbnQsIHJlYWN0aW9uc1dpZGdldE9wdGlvbnMpIHtcbiAgICBUb3VjaFN1cHBvcnQuc2V0dXBUYXAoZWxlbWVudCwgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgaWYgKCFSZWFjdGlvbnNXaWRnZXQuaXNPcGVuKCkpIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB2YXIgdG91Y2ggPSBldmVudC5jaGFuZ2VkVG91Y2hlc1swXTtcbiAgICAgICAgICAgIHZhciBjb29yZHMgPSB7IHRvcDogdG91Y2gucGFnZVksIGxlZnQ6IHRvdWNoLnBhZ2VYIH07XG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyAvLyBMZXQgdGhpcyBldmVudCBmaW5pc2ggcHJvY2Vzc2luZyBiZWZvcmUgb3BlbmluZyB0aGUgcmVhY3Rpb25zIHdpbmRvdyBzbyB0aGUgd2luZG93IGRvZXNuJ3QgYWxzbyBwcm9jZXNzIHRoZSBldmVudC5cbiAgICAgICAgICAgICAgICBncmFiTm9kZUFuZE9wZW4oZWxlbWVudCwgcmVhY3Rpb25zV2lkZ2V0T3B0aW9ucywgY29vcmRzKTtcbiAgICAgICAgICAgICAgICBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgdG91Y2hFbmQpO1xuICAgICAgICAgICAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCB0b3VjaEVuZCk7XG4gICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlUmVhY3RhYmxlVGV4dDogY3JlYXRlUmVhY3RhYmxlVGV4dFxufTsiLCIvLyBUT0RPOiBuZWVkcyBhIGJldHRlciBuYW1lIG9uY2UgdGhlIHNjb3BlIGlzIGNsZWFyXG5cbnZhciAkOyByZXF1aXJlKCcuL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIFhETUNsaWVudCA9IHJlcXVpcmUoJy4veGRtLWNsaWVudCcpO1xudmFyIFVSTHMgPSByZXF1aXJlKCcuL3VybHMnKTtcbnZhciBVc2VyID0gcmVxdWlyZSgnLi91c2VyJyk7XG5cbnZhciBQYWdlRGF0YSA9IHJlcXVpcmUoJy4uL3BhZ2UtZGF0YScpOyAvLyBUT0RPOiBiYWNrd2FyZHMgZGVwZW5kZW5jeVxuXG5cbmZ1bmN0aW9uIHBvc3ROZXdSZWFjdGlvbihyZWFjdGlvbkRhdGEsIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBjb250ZW50RGF0YSwgc3VjY2VzcywgZXJyb3IpIHtcbiAgICB2YXIgY29udGVudEJvZHkgPSBjb250ZW50RGF0YS5ib2R5O1xuICAgIHZhciBjb250ZW50VHlwZSA9IGNvbnRlbnREYXRhLnR5cGU7XG4gICAgdmFyIGNvbnRlbnRMb2NhdGlvbiA9IGNvbnRlbnREYXRhLmxvY2F0aW9uO1xuICAgIHZhciBjb250ZW50RGltZW5zaW9ucyA9IGNvbnRlbnREYXRhLmRpbWVuc2lvbnM7XG4gICAgWERNQ2xpZW50LmdldFVzZXIoZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgdmFyIHVzZXJJbmZvID0gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgLy8gVE9ETyBleHRyYWN0IHRoZSBzaGFwZSBvZiB0aGlzIGRhdGEgYW5kIHBvc3NpYmx5IHRoZSB3aG9sZSBBUEkgY2FsbFxuICAgICAgICAvLyBUT0RPIGZpZ3VyZSBvdXQgd2hpY2ggcGFydHMgZG9uJ3QgZ2V0IHBhc3NlZCBmb3IgYSBuZXcgcmVhY3Rpb25cbiAgICAgICAgLy8gVE9ETyBjb21wdXRlIGZpZWxkIHZhbHVlcyAoZS5nLiBjb250YWluZXJfa2luZCBhbmQgY29udGVudCBpbmZvKSBmb3IgbmV3IHJlYWN0aW9uc1xuICAgICAgICB2YXIgZGF0YSA9IHtcbiAgICAgICAgICAgIHRhZzoge1xuICAgICAgICAgICAgICAgIGJvZHk6IHJlYWN0aW9uRGF0YS50ZXh0XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaXNfZGVmYXVsdDogcmVhY3Rpb25EYXRhLmlzRGVmYXVsdCAhPT0gdW5kZWZpbmVkICYmIHJlYWN0aW9uRGF0YS5pc0RlZmF1bHQsIC8vIGZhbHNlIHVubGVzcyBzcGVjaWZpZWRcbiAgICAgICAgICAgIGhhc2g6IGNvbnRhaW5lckRhdGEuaGFzaCxcbiAgICAgICAgICAgIHVzZXJfaWQ6IHVzZXJJbmZvLnVzZXJfaWQsXG4gICAgICAgICAgICBhbnRfdG9rZW46IHVzZXJJbmZvLmFudF90b2tlbixcbiAgICAgICAgICAgIHBhZ2VfaWQ6IHBhZ2VEYXRhLnBhZ2VJZCxcbiAgICAgICAgICAgIGdyb3VwX2lkOiBwYWdlRGF0YS5ncm91cElkLFxuICAgICAgICAgICAgY29udGFpbmVyX2tpbmQ6IGNvbnRlbnRUeXBlLCAvLyBPbmUgb2YgJ3BhZ2UnLCAndGV4dCcsICdtZWRpYScsICdpbWcnXG4gICAgICAgICAgICBjb250ZW50X25vZGVfZGF0YToge1xuICAgICAgICAgICAgICAgIGJvZHk6IGNvbnRlbnRCb2R5LFxuICAgICAgICAgICAgICAgIGtpbmQ6IGNvbnRlbnRUeXBlLFxuICAgICAgICAgICAgICAgIGl0ZW1fdHlwZTogJycgLy8gVE9ETzogbG9va3MgdW51c2VkIGJ1dCBUYWdIYW5kbGVyIGJsb3dzIHVwIHdpdGhvdXQgaXQuIEN1cnJlbnQgY2xpZW50IHBhc3NlcyBpbiBcInBhZ2VcIiBmb3IgcGFnZSByZWFjdGlvbnMuXG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIGlmIChjb250ZW50TG9jYXRpb24pIHtcbiAgICAgICAgICAgIGRhdGEuY29udGVudF9ub2RlX2RhdGEubG9jYXRpb24gPSBjb250ZW50TG9jYXRpb247XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvbnRlbnREaW1lbnNpb25zKSB7XG4gICAgICAgICAgICBkYXRhLmNvbnRlbnRfbm9kZV9kYXRhLmhlaWdodCA9IGNvbnRlbnREaW1lbnNpb25zLmhlaWdodDtcbiAgICAgICAgICAgIGRhdGEuY29udGVudF9ub2RlX2RhdGEud2lkdGggPSBjb250ZW50RGltZW5zaW9ucy53aWR0aDtcbiAgICAgICAgfVxuICAgICAgICBpZiAocmVhY3Rpb25EYXRhLmlkKSB7XG4gICAgICAgICAgICBkYXRhLnRhZy5pZCA9IHJlYWN0aW9uRGF0YS5pZDsgLy8gVE9ETyB0aGUgY3VycmVudCBjbGllbnQgc2VuZHMgXCItMTAxXCIgaWYgdGhlcmUncyBubyBpZC4gaXMgdGhpcyBuZWNlc3Nhcnk/XG4gICAgICAgIH1cbiAgICAgICAgJC5nZXRKU09OUChVUkxzLmNyZWF0ZVJlYWN0aW9uVXJsKCksIGRhdGEsIG5ld1JlYWN0aW9uU3VjY2Vzcyhjb250ZW50TG9jYXRpb24sIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBzdWNjZXNzKSwgZXJyb3IpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBwb3N0UGx1c09uZShyZWFjdGlvbkRhdGEsIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBzdWNjZXNzLCBlcnJvcikge1xuICAgIFhETUNsaWVudC5nZXRVc2VyKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgIHZhciB1c2VySW5mbyA9IHJlc3BvbnNlLmRhdGE7XG4gICAgICAgIC8vIFRPRE8gZXh0cmFjdCB0aGUgc2hhcGUgb2YgdGhpcyBkYXRhIGFuZCBwb3NzaWJseSB0aGUgd2hvbGUgQVBJIGNhbGxcbiAgICAgICAgLy8gVE9ETyBmaWd1cmUgb3V0IHdoaWNoIHBhcnRzIGRvbid0IGdldCBwYXNzZWQgZm9yIGEgbmV3IHJlYWN0aW9uXG4gICAgICAgIC8vIFRPRE8gY29tcHV0ZSBmaWVsZCB2YWx1ZXMgKGUuZy4gY29udGFpbmVyX2tpbmQgYW5kIGNvbnRlbnQgaW5mbykgZm9yIG5ldyByZWFjdGlvbnNcbiAgICAgICAgaWYgKCFyZWFjdGlvbkRhdGEuY29udGVudCkge1xuICAgICAgICAgICAgLy8gVGhpcyBpcyBhIHN1bW1hcnkgcmVhY3Rpb24uIFNlZSBpZiB3ZSBoYXZlIGFueSBjb250YWluZXIgZGF0YSB0aGF0IHdlIGNhbiBsaW5rIHRvIGl0LlxuICAgICAgICAgICAgdmFyIGNvbnRhaW5lclJlYWN0aW9ucyA9IGNvbnRhaW5lckRhdGEucmVhY3Rpb25zO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb250YWluZXJSZWFjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgY29udGFpbmVyUmVhY3Rpb24gPSBjb250YWluZXJSZWFjdGlvbnNbaV07XG4gICAgICAgICAgICAgICAgaWYgKGNvbnRhaW5lclJlYWN0aW9uLmlkID09PSByZWFjdGlvbkRhdGEuaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVhY3Rpb25EYXRhLnBhcmVudElEID0gY29udGFpbmVyUmVhY3Rpb24ucGFyZW50SUQ7XG4gICAgICAgICAgICAgICAgICAgIHJlYWN0aW9uRGF0YS5jb250ZW50ID0gY29udGFpbmVyUmVhY3Rpb24uY29udGVudDtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHZhciBkYXRhID0ge1xuICAgICAgICAgICAgdGFnOiB7XG4gICAgICAgICAgICAgICAgYm9keTogcmVhY3Rpb25EYXRhLnRleHQsXG4gICAgICAgICAgICAgICAgaWQ6IHJlYWN0aW9uRGF0YS5pZFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGhhc2g6IGNvbnRhaW5lckRhdGEuaGFzaCxcbiAgICAgICAgICAgIHVzZXJfaWQ6IHVzZXJJbmZvLnVzZXJfaWQsXG4gICAgICAgICAgICBhbnRfdG9rZW46IHVzZXJJbmZvLmFudF90b2tlbixcbiAgICAgICAgICAgIHBhZ2VfaWQ6IHBhZ2VEYXRhLnBhZ2VJZCxcbiAgICAgICAgICAgIGdyb3VwX2lkOiBwYWdlRGF0YS5ncm91cElkLFxuICAgICAgICAgICAgY29udGFpbmVyX2tpbmQ6IGNvbnRhaW5lckRhdGEudHlwZSwgLy8gJ3BhZ2UnLCAndGV4dCcsICdtZWRpYScsICdpbWcnXG4gICAgICAgICAgICBjb250ZW50X25vZGVfZGF0YToge1xuICAgICAgICAgICAgICAgIGJvZHk6ICcnLCAvLyBUT0RPOiBkbyB3ZSBuZWVkIHRoaXMgZm9yICsxcz8gbG9va3MgbGlrZSBvbmx5IHRoZSBpZCBmaWVsZCBpcyB1c2VkLCBpZiBvbmUgaXMgc2V0XG4gICAgICAgICAgICAgICAga2luZDogY29udGVudE5vZGVEYXRhS2luZChjb250YWluZXJEYXRhLnR5cGUpLFxuICAgICAgICAgICAgICAgIGl0ZW1fdHlwZTogJycgLy8gVE9ETzogbG9va3MgdW51c2VkIGJ1dCBUYWdIYW5kbGVyIGJsb3dzIHVwIHdpdGhvdXQgaXRcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgaWYgKHJlYWN0aW9uRGF0YS5jb250ZW50KSB7XG4gICAgICAgICAgICBkYXRhLmNvbnRlbnRfbm9kZV9kYXRhLmlkID0gcmVhY3Rpb25EYXRhLmNvbnRlbnQuaWQ7XG4gICAgICAgICAgICBkYXRhLmNvbnRlbnRfbm9kZV9kYXRhLmxvY2F0aW9uID0gcmVhY3Rpb25EYXRhLmNvbnRlbnQubG9jYXRpb247XG4gICAgICAgIH1cbiAgICAgICAgLy8gVE9ETzogc2hvdWxkIHdlIGJhaWwgaWYgdGhlcmUncyBubyBwYXJlbnQgSUQ/IEl0J3Mgbm90IHJlYWxseSBhICsxIHdpdGhvdXQgb25lLlxuICAgICAgICBpZiAocmVhY3Rpb25EYXRhLnBhcmVudElEKSB7XG4gICAgICAgICAgICBkYXRhLnRhZy5wYXJlbnRfaWQgPSByZWFjdGlvbkRhdGEucGFyZW50SUQ7XG4gICAgICAgIH1cbiAgICAgICAgJC5nZXRKU09OUChVUkxzLmNyZWF0ZVJlYWN0aW9uVXJsKCksIGRhdGEsIHBsdXNPbmVTdWNjZXNzKHJlYWN0aW9uRGF0YSwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIHN1Y2Nlc3MpLCBlcnJvcik7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIHBvc3RDb21tZW50KGNvbW1lbnQsIHJlYWN0aW9uRGF0YSwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIHN1Y2Nlc3MsIGVycm9yKSB7XG4gICAgLy8gVE9ETzogcmVmYWN0b3IgdGhlIHBvc3QgZnVuY3Rpb25zIHRvIGVsaW1pbmF0ZSBhbGwgdGhlIGNvcGllZCBjb2RlXG4gICAgWERNQ2xpZW50LmdldFVzZXIoZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgdmFyIHVzZXJJbmZvID0gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgLy8gVE9ETyBleHRyYWN0IHRoZSBzaGFwZSBvZiB0aGlzIGRhdGEgYW5kIHBvc3NpYmx5IHRoZSB3aG9sZSBBUEkgY2FsbFxuICAgICAgICAvLyBUT0RPIGZpZ3VyZSBvdXQgd2hpY2ggcGFydHMgZG9uJ3QgZ2V0IHBhc3NlZCBmb3IgYSBuZXcgcmVhY3Rpb25cbiAgICAgICAgLy8gVE9ETyBjb21wdXRlIGZpZWxkIHZhbHVlcyAoZS5nLiBjb250YWluZXJfa2luZCBhbmQgY29udGVudCBpbmZvKSBmb3IgbmV3IHJlYWN0aW9uc1xuICAgICAgICBpZiAoIXJlYWN0aW9uRGF0YS5jb250ZW50KSB7XG4gICAgICAgICAgICAvLyBUaGlzIGlzIGEgc3VtbWFyeSByZWFjdGlvbi4gU2VlIGlmIHdlIGhhdmUgYW55IGNvbnRhaW5lciBkYXRhIHRoYXQgd2UgY2FuIGxpbmsgdG8gaXQuXG4gICAgICAgICAgICB2YXIgY29udGFpbmVyUmVhY3Rpb25zID0gY29udGFpbmVyRGF0YS5yZWFjdGlvbnM7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvbnRhaW5lclJlYWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBjb250YWluZXJSZWFjdGlvbiA9IGNvbnRhaW5lclJlYWN0aW9uc1tpXTtcbiAgICAgICAgICAgICAgICBpZiAoY29udGFpbmVyUmVhY3Rpb24uaWQgPT09IHJlYWN0aW9uRGF0YS5pZCkge1xuICAgICAgICAgICAgICAgICAgICByZWFjdGlvbkRhdGEucGFyZW50SUQgPSBjb250YWluZXJSZWFjdGlvbi5wYXJlbnRJRDtcbiAgICAgICAgICAgICAgICAgICAgcmVhY3Rpb25EYXRhLmNvbnRlbnQgPSBjb250YWluZXJSZWFjdGlvbi5jb250ZW50O1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFyZWFjdGlvbkRhdGEucGFyZW50SUQpIHtcbiAgICAgICAgICAgIC8vIFRPRE86IEVuc3VyZSB0aGF0IHdlIGFsd2F5cyBoYXZlIGEgcGFyZW50IElELiBDb21tZW50cyBzaG91bGQgYWx3YXlzIGJlIG1hZGUgb24gYSByZWFjdGlvbi5cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdFcnJvciBhdHRlbXB0aW5nIHRvIHBvc3QgY29tbWVudC4gTm8gcGFyZW50IHJlYWN0aW9uIHNwZWNpZmllZC4nKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgZGF0YSA9IHtcbiAgICAgICAgICAgIGNvbW1lbnQ6IGNvbW1lbnQsXG4gICAgICAgICAgICB0YWc6IHtcbiAgICAgICAgICAgICAgICBwYXJlbnRfaWQ6IHJlYWN0aW9uRGF0YS5wYXJlbnRJRFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHVzZXJfaWQ6IHVzZXJJbmZvLnVzZXJfaWQsXG4gICAgICAgICAgICBhbnRfdG9rZW46IHVzZXJJbmZvLmFudF90b2tlbixcbiAgICAgICAgICAgIHBhZ2VfaWQ6IHBhZ2VEYXRhLnBhZ2VJZCxcbiAgICAgICAgICAgIGdyb3VwX2lkOiBwYWdlRGF0YS5ncm91cElkXG4gICAgICAgIH07XG4gICAgICAgICQuZ2V0SlNPTlAoVVJMcy5jcmVhdGVDb21tZW50VXJsKCksIGRhdGEsIGNvbW1lbnRTdWNjZXNzKHJlYWN0aW9uRGF0YSwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIHN1Y2Nlc3MpLCBlcnJvcik7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGNvbnRlbnROb2RlRGF0YUtpbmQodHlwZSkge1xuICAgIC8vIFRPRE86IHJlc29sdmUgd2hldGhlciB0byB1c2UgdGhlIHNob3J0IG9yIGxvbmcgZm9ybSBmb3IgY29udGVudF9ub2RlX2RhdGEua2luZC4gLy8gJ3BhZycsICd0eHQnLCAnbWVkJywgJ2ltZydcbiAgICBpZiAodHlwZSA9PT0gJ2ltYWdlJykge1xuICAgICAgICByZXR1cm4gJ2ltZyc7XG4gICAgfVxuICAgIHJldHVybiB0eXBlO1xufVxuXG5mdW5jdGlvbiBjb21tZW50U3VjY2VzcyhyZWFjdGlvbkRhdGEsIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBjYWxsYmFjaykge1xuICAgIHJldHVybiBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAvLyBUT0RPOiBpbiB0aGUgY2FzZSB0aGF0IHNvbWVvbmUgcmVhY3RzIGFuZCB0aGVuIGltbWVkaWF0ZWx5IGNvbW1lbnRzLCB3ZSBoYXZlIGEgcmFjZSBjb25kaXRpb24gd2hlcmUgdGhlXG4gICAgICAgIC8vICAgICAgIGNvbW1lbnQgcmVzcG9uc2UgY291bGQgY29tZSBiYWNrIGJlZm9yZSB0aGUgcmVhY3Rpb24uIHdlIG5lZWQgdG86XG4gICAgICAgIC8vICAgICAgIDEuIE1ha2Ugc3VyZSB0aGUgc2VydmVyIG9ubHkgY3JlYXRlcyBhIHNpbmdsZSByZWFjdGlvbiBpbiB0aGlzIGNhc2UgKG5vdCBhIEhVR0UgZGVhbCBpZiBpdCBtYWtlcyB0d28pXG4gICAgICAgIC8vICAgICAgIDIuIFJlc29sdmUgdGhlIHR3byByZXNwb25zZXMgdGhhdCBib3RoIHRoZW9yZXRpY2FsbHkgY29tZSBiYWNrIHdpdGggdGhlIHNhbWUgcmVhY3Rpb24gZGF0YSBhdCB0aGUgc2FtZVxuICAgICAgICAvLyAgICAgICAgICB0aW1lLiBNYWtlIHN1cmUgd2UgZG9uJ3QgZW5kIHVwIHdpdGggdHdvIGNvcGllcyBvZiB0aGUgc2FtZSBkYXRhIGluIHRoZSBtb2RlbC5cbiAgICAgICAgdmFyIHJlYWN0aW9uQ3JlYXRlZCA9ICFyZXNwb25zZS5leGlzdGluZztcbiAgICAgICAgaWYgKHJlYWN0aW9uQ3JlYXRlZCkge1xuICAgICAgICAgICAgaWYgKCFyZWFjdGlvbkRhdGEuY29tbWVudENvdW50KSB7XG4gICAgICAgICAgICAgICAgcmVhY3Rpb25EYXRhLmNvbW1lbnRDb3VudCA9IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZWFjdGlvbkRhdGEuY29tbWVudENvdW50ICs9IDE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBUT0RPOiBkbyB3ZSBldmVyIGdldCBhIHJlc3BvbnNlIHRvIGEgbmV3IHJlYWN0aW9uIHRlbGxpbmcgdXMgdGhhdCBpdCdzIGFscmVhZHkgZXhpc3Rpbmc/IElmIHNvLCBjb3VsZCB0aGUgY291bnQgbmVlZCB0byBiZSB1cGRhdGVkP1xuICAgICAgICB9XG4gICAgICAgIGNhbGxiYWNrKHJlYWN0aW9uQ3JlYXRlZCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBwbHVzT25lU3VjY2VzcyhyZWFjdGlvbkRhdGEsIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBjYWxsYmFjaykge1xuICAgIHJldHVybiBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAvLyBUT0RPOiBEbyB3ZSBjYXJlIGFib3V0IHJlc3BvbnNlLmV4aXN0aW5nIGFueW1vcmUgKHdlIHVzZWQgdG8gc2hvdyBkaWZmZXJlbnQgZmVlZGJhY2sgaW4gdGhlIFVJLCBidXQgbm8gbG9uZ2VyLi4uKVxuICAgICAgICB2YXIgcmVhY3Rpb25DcmVhdGVkID0gIXJlc3BvbnNlLmV4aXN0aW5nO1xuICAgICAgICBpZiAocmVhY3Rpb25DcmVhdGVkKSB7XG4gICAgICAgICAgICAvLyBUT0RPOiB3ZSBzaG91bGQgZ2V0IGJhY2sgYSByZXNwb25zZSB3aXRoIGRhdGEgaW4gdGhlIFwibmV3IGZvcm1hdFwiIGFuZCB1cGRhdGUgdGhlIG1vZGVsIGZyb20gdGhlIHJlc3BvbnNlXG4gICAgICAgICAgICByZWFjdGlvbkRhdGEuY291bnQgPSByZWFjdGlvbkRhdGEuY291bnQgKyAxO1xuICAgICAgICAgICAgY29udGFpbmVyRGF0YS5yZWFjdGlvblRvdGFsID0gY29udGFpbmVyRGF0YS5yZWFjdGlvblRvdGFsICsgMTtcbiAgICAgICAgICAgIHBhZ2VEYXRhLnN1bW1hcnlUb3RhbCA9IHBhZ2VEYXRhLnN1bW1hcnlUb3RhbCArIDE7XG4gICAgICAgIH1cbiAgICAgICAgLy8gVE9ETzogV2hhdCBzaG91bGQgd2UgcGFzcyBpbiB0aGUgY2FsbGJhY2s/IE1heWJlIGp1c3QgcGFzcyBiYWNrIHRoZSByZWFjdGlvbj8gT3IgYnVpbGQgb25lIGZyb20gdGhlIHJlc3BvbnNlP1xuICAgICAgICBjYWxsYmFjayhyZWFjdGlvbkNyZWF0ZWQpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gbmV3UmVhY3Rpb25TdWNjZXNzKGNvbnRlbnRMb2NhdGlvbiwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGNhbGxiYWNrKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgIC8vIFRPRE86IENhbiByZXNwb25zZS5leGlzdGluZyBldmVyIGNvbWUgYmFjayB0cnVlIGZvciBhICduZXcnIHJlYWN0aW9uPyBTaG91bGQgd2UgYmVoYXZlIGFueSBkaWZmZXJlbnRseSBpZiBpdCBkb2VzP1xuICAgICAgICB2YXIgcmVhY3Rpb24gPSByZWFjdGlvbkZyb21SZXNwb25zZShyZXNwb25zZSwgY29udGVudExvY2F0aW9uKTtcbiAgICAgICAgcmVhY3Rpb24gPSBQYWdlRGF0YS5yZWdpc3RlclJlYWN0aW9uKHJlYWN0aW9uLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSk7XG4gICAgICAgIGNhbGxiYWNrKHJlYWN0aW9uKTtcbiAgICB9O1xufVxuXG5mdW5jdGlvbiByZWFjdGlvbkZyb21SZXNwb25zZShyZXNwb25zZSwgY29udGVudExvY2F0aW9uKSB7XG4gICAgLy8gVE9ETzogdGhlIHNlcnZlciBzaG91bGQgZ2l2ZSB1cyBiYWNrIGEgcmVhY3Rpb24gbWF0Y2hpbmcgdGhlIG5ldyBBUEkgZm9ybWF0LlxuICAgIC8vICAgICAgIHdlJ3JlIGp1c3QgZmFraW5nIGl0IG91dCBmb3Igbm93OyB0aGlzIGNvZGUgaXMgdGVtcG9yYXJ5XG4gICAgdmFyIHJlYWN0aW9uID0ge1xuICAgICAgICB0ZXh0OiByZXNwb25zZS5pbnRlcmFjdGlvbi5pbnRlcmFjdGlvbl9ub2RlLmJvZHksXG4gICAgICAgIGlkOiByZXNwb25zZS5pbnRlcmFjdGlvbi5pbnRlcmFjdGlvbl9ub2RlLmlkLFxuICAgICAgICBjb3VudDogMSAvLyBUT0RPOiBjb3VsZCB3ZSBnZXQgYmFjayBhIGRpZmZlcmVudCBjb3VudCBpZiBzb21lb25lIGVsc2UgbWFkZSB0aGUgc2FtZSBcIm5ld1wiIHJlYWN0aW9uIGJlZm9yZSB1cz9cbiAgICAgICAgLy8gcGFyZW50SWQ6ID8/PyBUT0RPOiBjb3VsZCB3ZSBnZXQgYSBwYXJlbnRJZCBiYWNrIGlmIHNvbWVvbmUgZWxzZSBtYWRlIHRoZSBzYW1lIFwibmV3XCIgcmVhY3Rpb24gYmVmb3JlIHVzP1xuICAgIH07XG4gICAgaWYgKHJlc3BvbnNlLmNvbnRlbnRfbm9kZSkge1xuICAgICAgICByZWFjdGlvbi5jb250ZW50ID0ge1xuICAgICAgICAgICAgaWQ6IHJlc3BvbnNlLmNvbnRlbnRfbm9kZS5pZCxcbiAgICAgICAgICAgIGtpbmQ6IHJlc3BvbnNlLmNvbnRlbnRfbm9kZS5raW5kLFxuICAgICAgICAgICAgYm9keTogcmVzcG9uc2UuY29udGVudF9ub2RlLmJvZHlcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKHJlc3BvbnNlLmNvbnRlbnRfbm9kZS5sb2NhdGlvbikge1xuICAgICAgICAgICAgcmVhY3Rpb24uY29udGVudC5sb2NhdGlvbiA9IHJlc3BvbnNlLmNvbnRlbnRfbm9kZS5sb2NhdGlvbjtcbiAgICAgICAgfSBlbHNlIGlmIChjb250ZW50TG9jYXRpb24pIHtcbiAgICAgICAgICAgIC8vIFRPRE86IGVuc3VyZSB0aGF0IHRoZSBBUEkgYWx3YXlzIHJldHVybnMgYSBsb2NhdGlvbiBhbmQgcmVtb3ZlIHRoZSBcImNvbnRlbnRMb2NhdGlvblwiIHRoYXQncyBiZWluZyBwYXNzZWQgYXJvdW5kLlxuICAgICAgICAgICAgLy8gRm9yIG5vdywganVzdCBwYXRjaCB0aGUgcmVzcG9uc2Ugd2l0aCB0aGUgZGF0YSB3ZSBrbm93IHdlIHNlbnQgb3Zlci5cbiAgICAgICAgICAgIHJlYWN0aW9uLmNvbnRlbnQubG9jYXRpb24gPSBjb250ZW50TG9jYXRpb247XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlYWN0aW9uO1xufVxuXG5mdW5jdGlvbiBnZXRDb21tZW50cyhyZWFjdGlvbiwgY2FsbGJhY2spIHtcbiAgICBYRE1DbGllbnQuZ2V0VXNlcihmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICB2YXIgdXNlckluZm8gPSByZXNwb25zZS5kYXRhO1xuICAgICAgICB2YXIgZGF0YSA9IHtcbiAgICAgICAgICAgIHJlYWN0aW9uX2lkOiByZWFjdGlvbi5wYXJlbnRJRCxcbiAgICAgICAgICAgIHVzZXJfaWQ6IHVzZXJJbmZvLnVzZXJfaWQsXG4gICAgICAgICAgICBhbnRfdG9rZW46IHVzZXJJbmZvLmFudF90b2tlblxuICAgICAgICB9O1xuICAgICAgICAkLmdldEpTT05QKFVSTHMuZmV0Y2hDb21tZW50VXJsKCksIGRhdGEsIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhjb21tZW50c0Zyb21SZXNwb25zZShyZXNwb25zZSkpO1xuICAgICAgICB9LCBmdW5jdGlvbihtZXNzYWdlKSB7XG4gICAgICAgICAgICAvLyBUT0RPOiBlcnJvciBoYW5kbGluZ1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ0FuIGVycm9yIG9jY3VycmVkIGZldGNoaW5nIGNvbW1lbnRzOiAnICsgbWVzc2FnZSk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBnZXRSZWFjdGlvbkxvY2F0aW9uRGF0YShyZWFjdGlvbiwgcGFnZURhdGEsIGNhbGxiYWNrKSB7XG4gICAgdmFyIHJlYWN0aW9uTG9jYXRpb25EYXRhID0gUGFnZURhdGEuZ2V0UmVhY3Rpb25Mb2NhdGlvbkRhdGEocmVhY3Rpb24sIHBhZ2VEYXRhKTtcbiAgICB2YXIgY29udGVudElEcyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHJlYWN0aW9uTG9jYXRpb25EYXRhKTtcbiAgICBYRE1DbGllbnQuZ2V0VXNlcihmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICB2YXIgdXNlckluZm8gPSByZXNwb25zZS5kYXRhO1xuICAgICAgICB2YXIgZGF0YSA9IHtcbiAgICAgICAgICAgIHVzZXJfaWQ6IHVzZXJJbmZvLnVzZXJfaWQsXG4gICAgICAgICAgICBhbnRfdG9rZW46IHVzZXJJbmZvLmFudF90b2tlbixcbiAgICAgICAgICAgIGNvbnRlbnRfaWRzOiBjb250ZW50SURzXG4gICAgICAgIH07XG4gICAgICAgICQuZ2V0SlNPTlAoVVJMcy5mZXRjaENvbnRlbnRCb2RpZXNVcmwoKSwgZGF0YSwgZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIFBhZ2VEYXRhLnVwZGF0ZVJlYWN0aW9uTG9jYXRpb25EYXRhKHJlYWN0aW9uTG9jYXRpb25EYXRhLCByZXNwb25zZSk7XG4gICAgICAgICAgICBjYWxsYmFjayhyZWFjdGlvbkxvY2F0aW9uRGF0YSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgICAgICAgICAgIC8vIFRPRE86IGVycm9yIGhhbmRsaW5nXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnQW4gZXJyb3Igb2NjdXJyZWQgZmV0Y2hpbmcgY29udGVudCBib2RpZXM6ICcgKyBtZXNzYWdlKTtcbiAgICAgICAgfSlcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gY29tbWVudHNGcm9tUmVzcG9uc2UoanNvbkNvbW1lbnRzKSB7XG4gICAgdmFyIGNvbW1lbnRzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBqc29uQ29tbWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGpzb25Db21tZW50ID0ganNvbkNvbW1lbnRzW2ldO1xuICAgICAgICB2YXIgY29tbWVudCA9IHtcbiAgICAgICAgICAgIHRleHQ6IGpzb25Db21tZW50LnRleHQsXG4gICAgICAgICAgICBpZDoganNvbkNvbW1lbnQuaWQsIC8vIFRPRE86IHdlIHByb2JhYmx5IG9ubHkgbmVlZCB0aGlzIGZvciArMSdpbmcgY29tbWVudHNcbiAgICAgICAgICAgIGNvbnRlbnRJRDoganNvbkNvbW1lbnQuY29udGVudElELCAvLyBUT0RPOiBEbyB3ZSByZWFsbHkgbmVlZCB0aGlzP1xuICAgICAgICAgICAgdXNlcjogVXNlci5mcm9tQ29tbWVudEpTT04oanNvbkNvbW1lbnQudXNlciwganNvbkNvbW1lbnQuc29jaWFsX3VzZXIpXG4gICAgICAgIH07XG4gICAgICAgIGNvbW1lbnRzLnB1c2goY29tbWVudCk7XG4gICAgfVxuICAgIHJldHVybiBjb21tZW50cztcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHBvc3RQbHVzT25lOiBwb3N0UGx1c09uZSxcbiAgICBwb3N0TmV3UmVhY3Rpb246IHBvc3ROZXdSZWFjdGlvbixcbiAgICBwb3N0Q29tbWVudDogcG9zdENvbW1lbnQsXG4gICAgZ2V0Q29tbWVudHM6IGdldENvbW1lbnRzLFxuICAgIGdldFJlYWN0aW9uTG9jYXRpb25EYXRhOiBnZXRSZWFjdGlvbkxvY2F0aW9uRGF0YVxufTsiLCJcbmZ1bmN0aW9uIGNvbXB1dGVDdXJyZW50U2NyaXB0U3JjKCkge1xuICAgIGlmIChkb2N1bWVudC5jdXJyZW50U2NyaXB0KSB7XG4gICAgICAgIHJldHVybiBkb2N1bWVudC5jdXJyZW50U2NyaXB0LnNyYztcbiAgICB9XG4gICAgLy8gSUUgZmFsbGJhY2suLi5cbiAgICB2YXIgc2NyaXB0cyA9IGRvY3VtZW50LmJvZHkuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ3NjcmlwdCcpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2NyaXB0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgc2NyaXB0ID0gc2NyaXB0c1tpXTtcbiAgICAgICAgaWYgKHNjcmlwdC5oYXNBdHRyaWJ1dGUoJ3NyYycpKSB7XG4gICAgICAgICAgICB2YXIgc2NyaXB0U3JjID0gc2NyaXB0LmdldEF0dHJpYnV0ZSgnc3JjJyk7XG4gICAgICAgICAgICAvLyBUT0RPOiB1c2UgYSByZWdleHAgaGVyZVxuICAgICAgICAgICAgaWYgKHNjcmlwdFNyYy5pbmRleE9mKCcvYW50ZW5uYS5qcycpICE9PSAtMSB8fCBzY3JpcHRTcmMuaW5kZXhPZignL2VuZ2FnZS5qcycpICE9IC0xIHx8IHNjcmlwdFNyYy5pbmRleE9mKCcvZW5nYWdlX2Z1bGwuanMnKSAhPSAtMSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBzY3JpcHRTcmM7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbnZhciBjdXJyZW50U2NyaXB0U3JjID0gY29tcHV0ZUN1cnJlbnRTY3JpcHRTcmMoKSB8fCAnJztcblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIC8vIFRPRE86IE1ha2UgdGhpcyBtb3JlIGZsZXhpYmxlIHNvIGl0IHdvcmtzIGluIGV2ZXJ5b25lJ3MgZGV2IGVudmlyb25tZW50XG4gICAgb2ZmbGluZTogb2ZmbGluZSA9IGN1cnJlbnRTY3JpcHRTcmMuaW5kZXhPZignbG9jYWxob3N0JykgIT09IC0xLFxuICAgIHRlc3Q6IGN1cnJlbnRTY3JpcHRTcmMuaW5kZXhPZignbG9jYWxob3N0OjMwMDAnKSAhPT0gLTEsXG4gICAgZGVidWc6IGN1cnJlbnRTY3JpcHRTcmMuaW5kZXhPZignP2RlYnVnJykgIT09IC0xXG59OyIsIlxudmFyIGFudHVpZCA9IDA7IC8vIFwiZ2xvYmFsbHlcIiB1bmlxdWUgSUQgdGhhdCB3ZSB1c2UgdG8gdGFnIGNhbGxiYWNrIGZ1bmN0aW9ucyBmb3IgbGF0ZXIgcmV0cmlldmFsLiAoVGhpcyBpcyBob3cgXCJvZmZcIiB3b3Jrcy4pXG5cbmZ1bmN0aW9uIGNyZWF0ZUNhbGxiYWNrcygpIHtcblxuICAgIHZhciBjYWxsYmFja3MgPSB7fTtcblxuICAgIGZ1bmN0aW9uIGFkZENhbGxiYWNrKGNhbGxiYWNrKSB7XG4gICAgICAgIGlmIChjYWxsYmFjay5hbnR1aWQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY2FsbGJhY2suYW50dWlkID0gYW50dWlkKys7XG4gICAgICAgIH1cbiAgICAgICAgY2FsbGJhY2tzW2NhbGxiYWNrLmFudHVpZF0gPSBjYWxsYmFjaztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByZW1vdmVDYWxsYmFjayhjYWxsYmFjaykge1xuICAgICAgICBpZiAoY2FsbGJhY2suYW50dWlkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGRlbGV0ZSBjYWxsYmFja3NbY2FsbGJhY2suYW50dWlkXTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldENhbGxiYWNrcygpIHtcbiAgICAgICAgdmFyIGFsbENhbGxiYWNrcyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBrZXkgaW4gY2FsbGJhY2tzKSB7XG4gICAgICAgICAgICBpZiAoY2FsbGJhY2tzLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgICBhbGxDYWxsYmFja3MucHVzaChjYWxsYmFja3Nba2V5XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGFsbENhbGxiYWNrcztcbiAgICB9XG5cbiAgICAvLyBDb252ZW5pZW5jZSBmdW5jdGlvbiB0aGF0IGludm9rZXMgYWxsIGNhbGxiYWNrcyB3aXRoIG5vIHBhcmFtZXRlcnMuIEFueSBjYWxsYmFja3MgdGhhdCBuZWVkIHBhcmFtcyBjYW4gYmUgY2FsbGVkXG4gICAgLy8gYnkgY2xpZW50cyB1c2luZyBnZXRDYWxsYmFja3MoKVxuICAgIGZ1bmN0aW9uIGludm9rZUFsbCgpIHtcbiAgICAgICAgZm9yICh2YXIga2V5IGluIGNhbGxiYWNrcykge1xuICAgICAgICAgICAgaWYgKGNhbGxiYWNrcy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2tzW2tleV0oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGlzRW1wdHkoKSB7XG4gICAgICAgIHJldHVybiBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhjYWxsYmFja3MpLmxlbmd0aCA9PT0gMDtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBhZGQ6IGFkZENhbGxiYWNrLFxuICAgICAgICByZW1vdmU6IHJlbW92ZUNhbGxiYWNrLFxuICAgICAgICBnZXQ6IGdldENhbGxiYWNrcyxcbiAgICAgICAgaXNFbXB0eTogaXNFbXB0eSxcbiAgICAgICAgaW52b2tlQWxsOiBpbnZva2VBbGxcbiAgICB9XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGU6IGNyZWF0ZUNhbGxiYWNrc1xufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciBNRDUgPSByZXF1aXJlKCcuL21kNScpO1xuXG4vLyBUT0RPOiBUaGlzIGlzIGp1c3QgY29weS9wYXN0ZWQgZnJvbSBlbmdhZ2VfZnVsbFxuLy8gVE9ETzogVGhlIGNvZGUgaXMgbG9va2luZyBmb3IgLmFudF9pbmRpY2F0b3IgdG8gc2VlIGlmIGl0J3MgYWxyZWFkeSBiZWVuIGhhc2hlZC4gUmV2aWV3LlxuLy8gVE9ETzogQ2FuIHdlIGltcGxlbWVudCBhIHNpbXBsZXIgdmVyc2lvbiBvZiB0aGlzIGZvciBub24tbGVnYWN5IGNvZGUgdXNpbmcgJGVsZW1lbnQudGV4dCgpP1xuZnVuY3Rpb24gZ2V0Q2xlYW5UZXh0KCRkb21Ob2RlKSB7XG4gICAgLy8gQU5ULnV0aWwuZ2V0Q2xlYW5UZXh0XG4gICAgLy8gY29tbW9uIGZ1bmN0aW9uIGZvciBjbGVhbmluZyB0aGUgdGV4dCBub2RlIHRleHQuICByaWdodCBub3csIGl0J3MgcmVtb3Zpbmcgc3BhY2VzLCB0YWJzLCBuZXdsaW5lcywgYW5kIHRoZW4gZG91YmxlIHNwYWNlc1xuXG4gICAgdmFyICRub2RlID0gJGRvbU5vZGUuY2xvbmUoKTtcblxuICAgICRub2RlLmZpbmQoJy5hbnQsIC5hbnQtY3VzdG9tLWN0YS1jb250YWluZXInKS5yZW1vdmUoKTtcblxuICAgIC8vbWFrZSBzdXJlIGl0IGRvZXNudCBhbHJlZHkgaGF2ZSBpbiBpbmRpY2F0b3IgLSBpdCBzaG91bGRuJ3QuXG4gICAgdmFyICRpbmRpY2F0b3IgPSAkbm9kZS5maW5kKCcuYW50X2luZGljYXRvcicpO1xuICAgIGlmKCRpbmRpY2F0b3IubGVuZ3RoKXtcbiAgICAgICAgLy90b2RvOiBzZW5kIHVzIGFuIGVycm9yIHJlcG9ydCAtIHRoaXMgbWF5IHN0aWxsIGJlIGhhcHBlbmluZyBmb3Igc2xpZGVzaG93cy5cbiAgICAgICAgLy9UaGlzIGZpeCB3b3JrcyBmaW5lLCBidXQgd2Ugc2hvdWxkIGZpeCB0aGUgY29kZSB0byBoYW5kbGUgaXQgYmVmb3JlIGhlcmUuXG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBnZXQgdGhlIG5vZGUncyB0ZXh0IGFuZCBzbWFzaCBjYXNlXG4gICAgLy8gVE9ETzogPGJyPiB0YWdzIGFuZCBibG9jay1sZXZlbCB0YWdzIGNhbiBzY3JldyB1cCB3b3Jkcy4gIGV4OlxuICAgIC8vIGhlbGxvPGJyPmhvdyBhcmUgeW91PyAgIGhlcmUgYmVjb21lc1xuICAgIC8vIGhlbGxvaG93IGFyZSB5b3U/ICAgIDwtLSBubyBzcGFjZSB3aGVyZSB0aGUgPGJyPiB3YXMuICBiYWQuXG4gICAgdmFyIG5vZGVfdGV4dCA9ICQudHJpbSggJG5vZGUuaHRtbCgpLnJlcGxhY2UoLzwgKmJyICpcXC8/Pi9naSwgJyAnKSApO1xuICAgIHZhciBib2R5ID0gJC50cmltKCAkKCBcIjxkaXY+XCIgKyBub2RlX3RleHQgKyBcIjwvZGl2PlwiICkudGV4dCgpLnRvTG93ZXJDYXNlKCkgKTtcblxuICAgIGlmKCBib2R5ICYmIHR5cGVvZiBib2R5ID09IFwic3RyaW5nXCIgJiYgYm9keSAhPT0gXCJcIiApIHtcbiAgICAgICAgdmFyIGZpcnN0cGFzcyA9IGJvZHkucmVwbGFjZSgvW1xcblxcclxcdF0rL2dpLCcgJykucmVwbGFjZSgpLnJlcGxhY2UoL1xcc3syLH0vZywnICcpO1xuICAgICAgICAvLyBzZWVpbmcgaWYgdGhpcyBoZWxwcyB0aGUgcHJvcHViIGlzc3VlIC0gdG8gdHJpbSBhZ2Fpbi4gIFdoZW4gaSBydW4gdGhpcyBsaW5lIGFib3ZlIGl0IGxvb2tzIGxpa2UgdGhlcmUgaXMgc3RpbGwgd2hpdGUgc3BhY2UuXG4gICAgICAgIHJldHVybiAkLnRyaW0oZmlyc3RwYXNzKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGhhc2hUZXh0KGVsZW1lbnQpIHtcbiAgICAvLyBUT0RPOiBIYW5kbGUgdGhlIGNhc2Ugd2hlcmUgbXVsdGlwbGUgaW5zdGFuY2VzIG9mIHRoZSBzYW1lIHRleHQgYXBwZWFyIG9uIHRoZSBwYWdlLiBOZWVkIHRvIGFkZCBhbiBpbmNyZW1lbnQgdG9cbiAgICAvLyB0aGUgaGFzaFRleHQuIChUaGlzIGNoZWNrIGhhcyB0byBiZSBzY29wZWQgdG8gYSBwb3N0KVxuICAgIHZhciB0ZXh0ID0gZ2V0Q2xlYW5UZXh0KGVsZW1lbnQpO1xuICAgIGlmICh0ZXh0KSB7XG4gICAgICAgIHZhciBoYXNoVGV4dCA9IFwicmRyLXRleHQtXCIgKyB0ZXh0O1xuICAgICAgICByZXR1cm4gTUQ1LmhleF9tZDUoaGFzaFRleHQpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gaGFzaFVybCh1cmwpIHtcbiAgICByZXR1cm4gTUQ1LmhleF9tZDUodXJsKTtcbn1cblxuZnVuY3Rpb24gaGFzaEltYWdlKGltYWdlVXJsKSB7XG4gICAgaWYgKGltYWdlVXJsICYmIGltYWdlVXJsLmxlbmd0aCA+IDApIHtcbiAgICAgICAgdmFyIGhhc2hUZXh0ID0gJ3Jkci1pbWctJyArIGltYWdlVXJsO1xuICAgICAgICByZXR1cm4gTUQ1LmhleF9tZDUoaGFzaFRleHQpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gaGFzaE1lZGlhKG1lZGlhVXJsKSB7XG4gICAgaWYgKG1lZGlhVXJsICYmIG1lZGlhVXJsLmxlbmd0aCA+IDApIHtcbiAgICAgICAgdmFyIGhhc2hUZXh0ID0gJ3Jkci1tZWRpYS0nICsgbWVkaWFVcmw7XG4gICAgICAgIHJldHVybiBNRDUuaGV4X21kNShoYXNoVGV4dCk7XG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgaGFzaFRleHQ6IGhhc2hUZXh0LFxuICAgIGhhc2hJbWFnZTogaGFzaEltYWdlLFxuICAgIGhhc2hNZWRpYTogaGFzaE1lZGlhLFxuICAgIGhhc2hVcmw6IGhhc2hVcmxcbn07IiwidmFyIFVSTHMgPSByZXF1aXJlKCcuL3VybHMnKTtcblxudmFyIGxvYWRlZGpRdWVyeTtcbnZhciBjYWxsYmFja3MgPSBbXTtcblxuLy8gTm90aWZpZXMgdGhlIGpRdWVyeSBwcm92aWRlciB0aGF0IHdlJ3ZlIGxvYWRlZCB0aGUgalF1ZXJ5IGxpYnJhcnkuXG5mdW5jdGlvbiBsb2FkZWQoKSB7XG4gICAgbG9hZGVkalF1ZXJ5ID0galF1ZXJ5Lm5vQ29uZmxpY3QoKTtcbiAgICAvLyBBZGQgb3VyIGN1c3RvbSBKU09OUCBmdW5jdGlvblxuICAgIGxvYWRlZGpRdWVyeS5nZXRKU09OUCA9IGZ1bmN0aW9uKHVybCwgZGF0YSwgc3VjY2VzcywgZXJyb3IpIHtcbiAgICAgICAgdmFyIG9wdGlvbnMgPSB7XG4gICAgICAgICAgICB1cmw6IFVSTHMuYW50ZW5uYUhvbWUoKSArIHVybCxcbiAgICAgICAgICAgIHR5cGU6IFwiZ2V0XCIsXG4gICAgICAgICAgICBjb250ZW50VHlwZTogXCJhcHBsaWNhdGlvbi9qc29uXCIsXG4gICAgICAgICAgICBkYXRhVHlwZTogXCJqc29ucFwiLFxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24ocmVzcG9uc2UsIHRleHRTdGF0dXMsIFhIUikge1xuICAgICAgICAgICAgICAgIC8vIFRPRE86IFJldmlzaXQgd2hldGhlciBpdCdzIHJlYWxseSBjb29sIHRvIGtleSB0aGlzIG9uIHRoZSB0ZXh0U3RhdHVzIG9yIGlmIHdlIHNob3VsZCBiZSBsb29raW5nIGF0XG4gICAgICAgICAgICAgICAgLy8gICAgICAgdGhlIHN0YXR1cyBjb2RlIGluIHRoZSBYSFJcbiAgICAgICAgICAgICAgICAvLyBOb3RlOiBUaGUgc2VydmVyIGNvbWVzIGJhY2sgd2l0aCAyMDAgcmVzcG9uc2VzIHdpdGggYSBuZXN0ZWQgc3RhdHVzIG9mIFwiZmFpbFwiLi4uXG4gICAgICAgICAgICAgICAgaWYgKHRleHRTdGF0dXMgPT09ICdzdWNjZXNzJyAmJiByZXNwb25zZS5zdGF0dXMgIT09ICdmYWlsJyAmJiAoIXJlc3BvbnNlLmRhdGEgfHwgcmVzcG9uc2UuZGF0YS5zdGF0dXMgIT09ICdmYWlsJykpIHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzcyhyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBGb3IgSlNPTlAgcmVxdWVzdHMsIGpRdWVyeSBkb2Vzbid0IGNhbGwgaXQncyBlcnJvciBjYWxsYmFjay4gSXQgY2FsbHMgc3VjY2VzcyBpbnN0ZWFkLlxuICAgICAgICAgICAgICAgICAgICBlcnJvcihyZXNwb25zZS5tZXNzYWdlIHx8IHJlc3BvbnNlLmRhdGEubWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbih4aHIsIHRleHRTdGF0dXMsIG1lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgICAvLyBPa2F5LCBhcHBhcmVudGx5IGpRdWVyeSAqZG9lcyogY2FsbCBpdHMgZXJyb3IgY2FsbGJhY2sgZm9yIEpTT05QIHJlcXVlc3RzIHNvbWV0aW1lcy4uLlxuICAgICAgICAgICAgICAgIC8vIFNwZWNpZmljYWxseSwgd2hlbiB0aGUgcmVzcG9uc2Ugc3RhdHVzIGlzIE9LIGJ1dCBhbiBlcnJvciBvY2N1cnMgY2xpZW50LXNpZGUgcHJvY2Vzc2luZyB0aGUgcmVzcG9uc2UuXG4gICAgICAgICAgICAgICAgZXJyb3IgKG1lc3NhZ2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBpZiAoZGF0YSkge1xuICAgICAgICAgICAgb3B0aW9ucy5kYXRhID0geyBqc29uOiBKU09OLnN0cmluZ2lmeShkYXRhKSB9O1xuICAgICAgICB9XG4gICAgICAgIGxvYWRlZGpRdWVyeS5hamF4KG9wdGlvbnMpO1xuICAgIH07XG4gICAgbm90aWZ5Q2FsbGJhY2tzKCk7XG59XG5cbmZ1bmN0aW9uIG5vdGlmeUNhbGxiYWNrcygpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNhbGxiYWNrcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjYWxsYmFja3NbaV0obG9hZGVkalF1ZXJ5KTtcbiAgICB9XG4gICAgY2FsbGJhY2tzID0gW107XG59XG5cbi8vIFJlZ2lzdGVycyB0aGUgZ2l2ZW4gY2FsbGJhY2sgdG8gYmUgbm90aWZpZWQgd2hlbiBvdXIgdmVyc2lvbiBvZiBqUXVlcnkgaXMgbG9hZGVkLlxuZnVuY3Rpb24gb25Mb2FkKGNhbGxiYWNrKSB7XG4gICAgaWYgKGxvYWRlZGpRdWVyeSkge1xuICAgICAgICBjYWxsYmFjayhsb2FkZWRqUXVlcnkpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGNhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKTtcbiAgICB9XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBsb2FkZWQ6IGxvYWRlZCxcbiAgICBvbkxvYWQ6IG9uTG9hZFxufTsiLCJcbi8vIFRPRE86IFRoaXMgY29kZSBpcyBqdXN0IGNvcGllZCBmcm9tIGVuZ2FnZV9mdWxsLmpzLiBSZXZpZXcgd2hldGhlciB3ZSB3YW50IHRvIGtlZXAgaXQgYXMtaXMuXG5cbnZhciBBTlQgPSB7XG4gICAgdXRpbDoge1xuICAgICAgICBtZDU6IHtcbiAgICAgICAgICAgIGhleGNhc2U6MCxcbiAgICAgICAgICAgIGI2NHBhZDpcIlwiLFxuICAgICAgICAgICAgY2hyc3o6OCxcbiAgICAgICAgICAgIGhleF9tZDU6IGZ1bmN0aW9uKHMpe3JldHVybiBBTlQudXRpbC5tZDUuYmlubDJoZXgoQU5ULnV0aWwubWQ1LmNvcmVfbWQ1KEFOVC51dGlsLm1kNS5zdHIyYmlubChzKSxzLmxlbmd0aCpBTlQudXRpbC5tZDUuY2hyc3opKTt9LFxuICAgICAgICAgICAgY29yZV9tZDU6IGZ1bmN0aW9uKHgsbGVuKXt4W2xlbj4+NV18PTB4ODA8PCgobGVuKSUzMik7eFsoKChsZW4rNjQpPj4+OSk8PDQpKzE0XT1sZW47dmFyIGE9MTczMjU4NDE5Mzt2YXIgYj0tMjcxNzMzODc5O3ZhciBjPS0xNzMyNTg0MTk0O3ZhciBkPTI3MTczMzg3ODtmb3IodmFyIGk9MDtpPHgubGVuZ3RoO2krPTE2KXt2YXIgb2xkYT1hO3ZhciBvbGRiPWI7dmFyIG9sZGM9Yzt2YXIgb2xkZD1kO2E9QU5ULnV0aWwubWQ1Lm1kNV9mZihhLGIsYyxkLHhbaSswXSw3LC02ODA4NzY5MzYpO2Q9QU5ULnV0aWwubWQ1Lm1kNV9mZihkLGEsYixjLHhbaSsxXSwxMiwtMzg5NTY0NTg2KTtjPUFOVC51dGlsLm1kNS5tZDVfZmYoYyxkLGEsYix4W2krMl0sMTcsNjA2MTA1ODE5KTtiPUFOVC51dGlsLm1kNS5tZDVfZmYoYixjLGQsYSx4W2krM10sMjIsLTEwNDQ1MjUzMzApO2E9QU5ULnV0aWwubWQ1Lm1kNV9mZihhLGIsYyxkLHhbaSs0XSw3LC0xNzY0MTg4OTcpO2Q9QU5ULnV0aWwubWQ1Lm1kNV9mZihkLGEsYixjLHhbaSs1XSwxMiwxMjAwMDgwNDI2KTtjPUFOVC51dGlsLm1kNS5tZDVfZmYoYyxkLGEsYix4W2krNl0sMTcsLTE0NzMyMzEzNDEpO2I9QU5ULnV0aWwubWQ1Lm1kNV9mZihiLGMsZCxhLHhbaSs3XSwyMiwtNDU3MDU5ODMpO2E9QU5ULnV0aWwubWQ1Lm1kNV9mZihhLGIsYyxkLHhbaSs4XSw3LDE3NzAwMzU0MTYpO2Q9QU5ULnV0aWwubWQ1Lm1kNV9mZihkLGEsYixjLHhbaSs5XSwxMiwtMTk1ODQxNDQxNyk7Yz1BTlQudXRpbC5tZDUubWQ1X2ZmKGMsZCxhLGIseFtpKzEwXSwxNywtNDIwNjMpO2I9QU5ULnV0aWwubWQ1Lm1kNV9mZihiLGMsZCxhLHhbaSsxMV0sMjIsLTE5OTA0MDQxNjIpO2E9QU5ULnV0aWwubWQ1Lm1kNV9mZihhLGIsYyxkLHhbaSsxMl0sNywxODA0NjAzNjgyKTtkPUFOVC51dGlsLm1kNS5tZDVfZmYoZCxhLGIsYyx4W2krMTNdLDEyLC00MDM0MTEwMSk7Yz1BTlQudXRpbC5tZDUubWQ1X2ZmKGMsZCxhLGIseFtpKzE0XSwxNywtMTUwMjAwMjI5MCk7Yj1BTlQudXRpbC5tZDUubWQ1X2ZmKGIsYyxkLGEseFtpKzE1XSwyMiwxMjM2NTM1MzI5KTthPUFOVC51dGlsLm1kNS5tZDVfZ2coYSxiLGMsZCx4W2krMV0sNSwtMTY1Nzk2NTEwKTtkPUFOVC51dGlsLm1kNS5tZDVfZ2coZCxhLGIsYyx4W2krNl0sOSwtMTA2OTUwMTYzMik7Yz1BTlQudXRpbC5tZDUubWQ1X2dnKGMsZCxhLGIseFtpKzExXSwxNCw2NDM3MTc3MTMpO2I9QU5ULnV0aWwubWQ1Lm1kNV9nZyhiLGMsZCxhLHhbaSswXSwyMCwtMzczODk3MzAyKTthPUFOVC51dGlsLm1kNS5tZDVfZ2coYSxiLGMsZCx4W2krNV0sNSwtNzAxNTU4NjkxKTtkPUFOVC51dGlsLm1kNS5tZDVfZ2coZCxhLGIsYyx4W2krMTBdLDksMzgwMTYwODMpO2M9QU5ULnV0aWwubWQ1Lm1kNV9nZyhjLGQsYSxiLHhbaSsxNV0sMTQsLTY2MDQ3ODMzNSk7Yj1BTlQudXRpbC5tZDUubWQ1X2dnKGIsYyxkLGEseFtpKzRdLDIwLC00MDU1Mzc4NDgpO2E9QU5ULnV0aWwubWQ1Lm1kNV9nZyhhLGIsYyxkLHhbaSs5XSw1LDU2ODQ0NjQzOCk7ZD1BTlQudXRpbC5tZDUubWQ1X2dnKGQsYSxiLGMseFtpKzE0XSw5LC0xMDE5ODAzNjkwKTtjPUFOVC51dGlsLm1kNS5tZDVfZ2coYyxkLGEsYix4W2krM10sMTQsLTE4NzM2Mzk2MSk7Yj1BTlQudXRpbC5tZDUubWQ1X2dnKGIsYyxkLGEseFtpKzhdLDIwLDExNjM1MzE1MDEpO2E9QU5ULnV0aWwubWQ1Lm1kNV9nZyhhLGIsYyxkLHhbaSsxM10sNSwtMTQ0NDY4MTQ2Nyk7ZD1BTlQudXRpbC5tZDUubWQ1X2dnKGQsYSxiLGMseFtpKzJdLDksLTUxNDAzNzg0KTtjPUFOVC51dGlsLm1kNS5tZDVfZ2coYyxkLGEsYix4W2krN10sMTQsMTczNTMyODQ3Myk7Yj1BTlQudXRpbC5tZDUubWQ1X2dnKGIsYyxkLGEseFtpKzEyXSwyMCwtMTkyNjYwNzczNCk7YT1BTlQudXRpbC5tZDUubWQ1X2hoKGEsYixjLGQseFtpKzVdLDQsLTM3ODU1OCk7ZD1BTlQudXRpbC5tZDUubWQ1X2hoKGQsYSxiLGMseFtpKzhdLDExLC0yMDIyNTc0NDYzKTtjPUFOVC51dGlsLm1kNS5tZDVfaGgoYyxkLGEsYix4W2krMTFdLDE2LDE4MzkwMzA1NjIpO2I9QU5ULnV0aWwubWQ1Lm1kNV9oaChiLGMsZCxhLHhbaSsxNF0sMjMsLTM1MzA5NTU2KTthPUFOVC51dGlsLm1kNS5tZDVfaGgoYSxiLGMsZCx4W2krMV0sNCwtMTUzMDk5MjA2MCk7ZD1BTlQudXRpbC5tZDUubWQ1X2hoKGQsYSxiLGMseFtpKzRdLDExLDEyNzI4OTMzNTMpO2M9QU5ULnV0aWwubWQ1Lm1kNV9oaChjLGQsYSxiLHhbaSs3XSwxNiwtMTU1NDk3NjMyKTtiPUFOVC51dGlsLm1kNS5tZDVfaGgoYixjLGQsYSx4W2krMTBdLDIzLC0xMDk0NzMwNjQwKTthPUFOVC51dGlsLm1kNS5tZDVfaGgoYSxiLGMsZCx4W2krMTNdLDQsNjgxMjc5MTc0KTtkPUFOVC51dGlsLm1kNS5tZDVfaGgoZCxhLGIsYyx4W2krMF0sMTEsLTM1ODUzNzIyMik7Yz1BTlQudXRpbC5tZDUubWQ1X2hoKGMsZCxhLGIseFtpKzNdLDE2LC03MjI1MjE5NzkpO2I9QU5ULnV0aWwubWQ1Lm1kNV9oaChiLGMsZCxhLHhbaSs2XSwyMyw3NjAyOTE4OSk7YT1BTlQudXRpbC5tZDUubWQ1X2hoKGEsYixjLGQseFtpKzldLDQsLTY0MDM2NDQ4Nyk7ZD1BTlQudXRpbC5tZDUubWQ1X2hoKGQsYSxiLGMseFtpKzEyXSwxMSwtNDIxODE1ODM1KTtjPUFOVC51dGlsLm1kNS5tZDVfaGgoYyxkLGEsYix4W2krMTVdLDE2LDUzMDc0MjUyMCk7Yj1BTlQudXRpbC5tZDUubWQ1X2hoKGIsYyxkLGEseFtpKzJdLDIzLC05OTUzMzg2NTEpO2E9QU5ULnV0aWwubWQ1Lm1kNV9paShhLGIsYyxkLHhbaSswXSw2LC0xOTg2MzA4NDQpO2Q9QU5ULnV0aWwubWQ1Lm1kNV9paShkLGEsYixjLHhbaSs3XSwxMCwxMTI2ODkxNDE1KTtjPUFOVC51dGlsLm1kNS5tZDVfaWkoYyxkLGEsYix4W2krMTRdLDE1LC0xNDE2MzU0OTA1KTtiPUFOVC51dGlsLm1kNS5tZDVfaWkoYixjLGQsYSx4W2krNV0sMjEsLTU3NDM0MDU1KTthPUFOVC51dGlsLm1kNS5tZDVfaWkoYSxiLGMsZCx4W2krMTJdLDYsMTcwMDQ4NTU3MSk7ZD1BTlQudXRpbC5tZDUubWQ1X2lpKGQsYSxiLGMseFtpKzNdLDEwLC0xODk0OTg2NjA2KTtjPUFOVC51dGlsLm1kNS5tZDVfaWkoYyxkLGEsYix4W2krMTBdLDE1LC0xMDUxNTIzKTtiPUFOVC51dGlsLm1kNS5tZDVfaWkoYixjLGQsYSx4W2krMV0sMjEsLTIwNTQ5MjI3OTkpO2E9QU5ULnV0aWwubWQ1Lm1kNV9paShhLGIsYyxkLHhbaSs4XSw2LDE4NzMzMTMzNTkpO2Q9QU5ULnV0aWwubWQ1Lm1kNV9paShkLGEsYixjLHhbaSsxNV0sMTAsLTMwNjExNzQ0KTtjPUFOVC51dGlsLm1kNS5tZDVfaWkoYyxkLGEsYix4W2krNl0sMTUsLTE1NjAxOTgzODApO2I9QU5ULnV0aWwubWQ1Lm1kNV9paShiLGMsZCxhLHhbaSsxM10sMjEsMTMwOTE1MTY0OSk7YT1BTlQudXRpbC5tZDUubWQ1X2lpKGEsYixjLGQseFtpKzRdLDYsLTE0NTUyMzA3MCk7ZD1BTlQudXRpbC5tZDUubWQ1X2lpKGQsYSxiLGMseFtpKzExXSwxMCwtMTEyMDIxMDM3OSk7Yz1BTlQudXRpbC5tZDUubWQ1X2lpKGMsZCxhLGIseFtpKzJdLDE1LDcxODc4NzI1OSk7Yj1BTlQudXRpbC5tZDUubWQ1X2lpKGIsYyxkLGEseFtpKzldLDIxLC0zNDM0ODU1NTEpO2E9QU5ULnV0aWwubWQ1LnNhZmVfYWRkKGEsb2xkYSk7Yj1BTlQudXRpbC5tZDUuc2FmZV9hZGQoYixvbGRiKTtjPUFOVC51dGlsLm1kNS5zYWZlX2FkZChjLG9sZGMpO2Q9QU5ULnV0aWwubWQ1LnNhZmVfYWRkKGQsb2xkZCk7fSByZXR1cm4gQXJyYXkoYSxiLGMsZCk7fSxcbiAgICAgICAgICAgIG1kNV9jbW46IGZ1bmN0aW9uKHEsYSxiLHgscyx0KXtyZXR1cm4gQU5ULnV0aWwubWQ1LnNhZmVfYWRkKEFOVC51dGlsLm1kNS5iaXRfcm9sKEFOVC51dGlsLm1kNS5zYWZlX2FkZChBTlQudXRpbC5tZDUuc2FmZV9hZGQoYSxxKSxBTlQudXRpbC5tZDUuc2FmZV9hZGQoeCx0KSkscyksYik7fSxcbiAgICAgICAgICAgIG1kNV9mZjogZnVuY3Rpb24oYSxiLGMsZCx4LHMsdCl7cmV0dXJuIEFOVC51dGlsLm1kNS5tZDVfY21uKChiJmMpfCgofmIpJmQpLGEsYix4LHMsdCk7fSxcbiAgICAgICAgICAgIG1kNV9nZzogZnVuY3Rpb24oYSxiLGMsZCx4LHMsdCl7cmV0dXJuIEFOVC51dGlsLm1kNS5tZDVfY21uKChiJmQpfChjJih+ZCkpLGEsYix4LHMsdCk7fSxcbiAgICAgICAgICAgIG1kNV9oaDogZnVuY3Rpb24oYSxiLGMsZCx4LHMsdCl7cmV0dXJuIEFOVC51dGlsLm1kNS5tZDVfY21uKGJeY15kLGEsYix4LHMsdCk7fSxcbiAgICAgICAgICAgIG1kNV9paTogZnVuY3Rpb24oYSxiLGMsZCx4LHMsdCl7cmV0dXJuIEFOVC51dGlsLm1kNS5tZDVfY21uKGNeKGJ8KH5kKSksYSxiLHgscyx0KTt9LFxuICAgICAgICAgICAgc2FmZV9hZGQ6IGZ1bmN0aW9uKHgseSl7dmFyIGxzdz0oeCYweEZGRkYpKyh5JjB4RkZGRik7dmFyIG1zdz0oeD4+MTYpKyh5Pj4xNikrKGxzdz4+MTYpO3JldHVybihtc3c8PDE2KXwobHN3JjB4RkZGRik7fSxcbiAgICAgICAgICAgIGJpdF9yb2w6IGZ1bmN0aW9uKG51bSxjbnQpe3JldHVybihudW08PGNudCl8KG51bT4+PigzMi1jbnQpKTt9LFxuICAgICAgICAgICAgLy90aGUgbGluZSBiZWxvdyBpcyBjYWxsZWQgb3V0IGJ5IGpzTGludCBiZWNhdXNlIGl0IHVzZXMgQXJyYXkoKSBpbnN0ZWFkIG9mIFtdLiAgV2UgY2FuIGlnbm9yZSwgb3IgSSdtIHN1cmUgd2UgY291bGQgY2hhbmdlIGl0IGlmIHdlIHdhbnRlZCB0by5cbiAgICAgICAgICAgIHN0cjJiaW5sOiBmdW5jdGlvbihzdHIpe3ZhciBiaW49QXJyYXkoKTt2YXIgbWFzaz0oMTw8QU5ULnV0aWwubWQ1LmNocnN6KS0xO2Zvcih2YXIgaT0wO2k8c3RyLmxlbmd0aCpBTlQudXRpbC5tZDUuY2hyc3o7aSs9QU5ULnV0aWwubWQ1LmNocnN6KXtiaW5baT4+NV18PShzdHIuY2hhckNvZGVBdChpL0FOVC51dGlsLm1kNS5jaHJzeikmbWFzayk8PChpJTMyKTt9cmV0dXJuIGJpbjt9LFxuICAgICAgICAgICAgYmlubDJoZXg6IGZ1bmN0aW9uKGJpbmFycmF5KXt2YXIgaGV4X3RhYj1BTlQudXRpbC5tZDUuaGV4Y2FzZT9cIjAxMjM0NTY3ODlBQkNERUZcIjpcIjAxMjM0NTY3ODlhYmNkZWZcIjt2YXIgc3RyPVwiXCI7Zm9yKHZhciBpPTA7aTxiaW5hcnJheS5sZW5ndGgqNDtpKyspe3N0cis9aGV4X3RhYi5jaGFyQXQoKGJpbmFycmF5W2k+PjJdPj4oKGklNCkqOCs0KSkmMHhGKStoZXhfdGFiLmNoYXJBdCgoYmluYXJyYXlbaT4+Ml0+PigoaSU0KSo4KSkmMHhGKTt9IHJldHVybiBzdHI7fVxuICAgICAgICB9XG4gICAgfVxufTtcblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGhleF9tZDU6IEFOVC51dGlsLm1kNS5oZXhfbWQ1XG59OyIsInZhciAkOyByZXF1aXJlKCcuL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xuXG5mdW5jdGlvbiBtYWtlTW92ZWFibGUoJGVsZW1lbnQsICRkcmFnSGFuZGxlKSB7XG4gICAgJGRyYWdIYW5kbGUub24oJ21vdXNlZG93bi5hbnRlbm5hJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdmFyIG9mZnNldFggPSBldmVudC5wYWdlWCAtICRkcmFnSGFuZGxlLm9mZnNldCgpLmxlZnQ7XG4gICAgICAgIHZhciBvZmZzZXRZID0gZXZlbnQucGFnZVkgLSAkZHJhZ0hhbmRsZS5vZmZzZXQoKS50b3A7XG4gICAgICAgICQoZG9jdW1lbnQpLm9uKCdtb3VzZXVwLmFudGVubmEnLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgJChkb2N1bWVudCkub2ZmKCdtb3VzZW1vdmUuYW50ZW5uYScpO1xuICAgICAgICB9KTtcbiAgICAgICAgJChkb2N1bWVudCkub24oJ21vdXNlbW92ZS5hbnRlbm5hJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgICRlbGVtZW50LmNzcyh7XG4gICAgICAgICAgICAgICAgdG9wOiBldmVudC5wYWdlWSAtIG9mZnNldFksXG4gICAgICAgICAgICAgICAgbGVmdDogZXZlbnQucGFnZVggLSBvZmZzZXRYXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIG1ha2VNb3ZlYWJsZTogbWFrZU1vdmVhYmxlXG59OyIsInZhciAkOyByZXF1aXJlKCcuL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIFdpZGdldEJ1Y2tldCA9IHJlcXVpcmUoJy4vd2lkZ2V0LWJ1Y2tldCcpO1xuXG4vLyBUT0RPOiBkZXRlY3Qgd2hldGhlciB0aGUgYnJvd3NlciBzdXBwb3J0cyBNdXRhdGlvbk9ic2VydmVyIGFuZCBmYWxsYmFjayB0byBNdXRhdGlvbnMgRXZlbnRzXG5cbmZ1bmN0aW9uIGFkZEFkZGl0aW9uTGlzdGVuZXIoY2FsbGJhY2spIHtcbiAgICB2YXIgb2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcihmdW5jdGlvbihtdXRhdGlvblJlY29yZHMpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtdXRhdGlvblJlY29yZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBhZGRlZEVsZW1lbnRzID0gZmlsdGVyZWRFbGVtZW50cyhtdXRhdGlvblJlY29yZHNbaV0uYWRkZWROb2Rlcyk7XG4gICAgICAgICAgICBpZiAoYWRkZWRFbGVtZW50cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soYWRkZWRFbGVtZW50cyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICB2YXIgYm9keSA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdib2R5JylbMF07XG4gICAgb2JzZXJ2ZXIub2JzZXJ2ZShib2R5LCB7XG4gICAgICAgIGNoaWxkTGlzdDogdHJ1ZSxcbiAgICAgICAgYXR0cmlidXRlczogZmFsc2UsXG4gICAgICAgIGNoYXJhY3RlckRhdGE6IGZhbHNlLFxuICAgICAgICBzdWJ0cmVlOiB0cnVlLFxuICAgICAgICBhdHRyaWJ1dGVPbGRWYWx1ZTogZmFsc2UsXG4gICAgICAgIGNoYXJhY3RlckRhdGFPbGRWYWx1ZTogZmFsc2VcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gYWRkUmVtb3ZhbExpc3RlbmVyKGNhbGxiYWNrKSB7XG4gICAgdmFyIG9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoZnVuY3Rpb24obXV0YXRpb25SZWNvcmRzKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbXV0YXRpb25SZWNvcmRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgcmVtb3ZlZEVsZW1lbnRzID0gZmlsdGVyZWRFbGVtZW50cyhtdXRhdGlvblJlY29yZHNbaV0ucmVtb3ZlZE5vZGVzKTtcbiAgICAgICAgICAgIGlmIChyZW1vdmVkRWxlbWVudHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKHJlbW92ZWRFbGVtZW50cyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICB2YXIgYm9keSA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdib2R5JylbMF07XG4gICAgb2JzZXJ2ZXIub2JzZXJ2ZShib2R5LCB7XG4gICAgICAgIGNoaWxkTGlzdDogdHJ1ZSxcbiAgICAgICAgYXR0cmlidXRlczogZmFsc2UsXG4gICAgICAgIGNoYXJhY3RlckRhdGE6IGZhbHNlLFxuICAgICAgICBzdWJ0cmVlOiB0cnVlLFxuICAgICAgICBhdHRyaWJ1dGVPbGRWYWx1ZTogZmFsc2UsXG4gICAgICAgIGNoYXJhY3RlckRhdGFPbGRWYWx1ZTogZmFsc2VcbiAgICB9KTtcbn1cblxuLy8gRmlsdGVyIHRoZSBzZXQgb2Ygbm9kZXMgdG8gZWxpbWluYXRlIGFueXRoaW5nIGluc2lkZSBvdXIgb3duIERPTSBlbGVtZW50cyAob3RoZXJ3aXNlLCB3ZSBnZW5lcmF0ZSBhIHRvbiBvZiBjaGF0dGVyKVxuZnVuY3Rpb24gZmlsdGVyZWRFbGVtZW50cyhub2RlTGlzdCkge1xuICAgIHZhciBmaWx0ZXJlZCA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbm9kZUxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIG5vZGUgPSBub2RlTGlzdFtpXTtcbiAgICAgICAgaWYgKG5vZGUubm9kZVR5cGUgIT09IDMpIHsgLy8gRG9uJ3QgcHJvY2VzcyB0ZXh0IG5vZGVzXG4gICAgICAgICAgICB2YXIgJGVsZW1lbnQgPSAkKG5vZGUpO1xuICAgICAgICAgICAgaWYgKCRlbGVtZW50LmNsb3Nlc3QoJy5hbnRlbm5hLCAnICsgV2lkZ2V0QnVja2V0LnNlbGVjdG9yKCkpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGZpbHRlcmVkLnB1c2goJGVsZW1lbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmaWx0ZXJlZDtcbn1cblxuZnVuY3Rpb24gYWRkT25lVGltZUF0dHJpYnV0ZUxpc3RlbmVyKG5vZGUsIGF0dHJpYnV0ZXMsIGNhbGxiYWNrKSB7XG4gICAgdmFyIG9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoZnVuY3Rpb24obXV0YXRpb25SZWNvcmRzKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbXV0YXRpb25SZWNvcmRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgdGFyZ2V0ID0gbXV0YXRpb25SZWNvcmRzW2ldLnRhcmdldDtcbiAgICAgICAgICAgIGNhbGxiYWNrKHRhcmdldCk7XG4gICAgICAgICAgICBvYnNlcnZlci5kaXNjb25uZWN0KCk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICBvYnNlcnZlci5vYnNlcnZlKG5vZGUsIHtcbiAgICAgICAgY2hpbGRMaXN0OiBmYWxzZSxcbiAgICAgICAgYXR0cmlidXRlczogdHJ1ZSxcbiAgICAgICAgY2hhcmFjdGVyRGF0YTogZmFsc2UsXG4gICAgICAgIHN1YnRyZWU6IGZhbHNlLFxuICAgICAgICBhdHRyaWJ1dGVPbGRWYWx1ZTogZmFsc2UsXG4gICAgICAgIGNoYXJhY3RlckRhdGFPbGRWYWx1ZTogZmFsc2UsXG4gICAgICAgIGF0dHJpYnV0ZUZpbHRlcjogYXR0cmlidXRlc1xuICAgIH0pO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgYWRkQWRkaXRpb25MaXN0ZW5lcjogYWRkQWRkaXRpb25MaXN0ZW5lcixcbiAgICBhZGRSZW1vdmFsTGlzdGVuZXI6IGFkZFJlbW92YWxMaXN0ZW5lcixcbiAgICBhZGRPbmVUaW1lQXR0cmlidXRlTGlzdGVuZXI6IGFkZE9uZVRpbWVBdHRyaWJ1dGVMaXN0ZW5lclxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcblxuZnVuY3Rpb24gY29tcHV0ZVRvcExldmVsUGFnZVRpdGxlKCkge1xuICAgIC8vIFRPRE86IFdoeSBpcyB0aGlzIGhhcmQtY29kZWQsIHdoZW4gdGhlIGVxdWl2YWxlbnQgZm9yIHRoZSBpbWFnZSBpcyBjb25maWd1cmFibGU/IChVbmlmeSB0aGVtLilcbiAgICB2YXIgdGl0bGUgPSAkKCdtZXRhW3Byb3BlcnR5PVwib2c6dGl0bGVcIl0nKS5hdHRyKCdjb250ZW50JykgfHwgJCgndGl0bGUnKS50ZXh0KCkgfHwgJyc7XG4gICAgcmV0dXJuIHRpdGxlLnRyaW0oKTtcbn1cblxuZnVuY3Rpb24gY29tcHV0ZVBhZ2VUaXRsZSgkcGFnZSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBwYWdlVGl0bGUgPSAkcGFnZS5maW5kKGdyb3VwU2V0dGluZ3MucGFnZUxpbmtTZWxlY3RvcigpKS50ZXh0KCkudHJpbSgpO1xuICAgIGlmIChwYWdlVGl0bGUgPT09ICcnKSB7XG4gICAgICAgIHBhZ2VUaXRsZSA9IGNvbXB1dGVUb3BMZXZlbFBhZ2VUaXRsZSgpO1xuICAgIH1cbiAgICByZXR1cm4gcGFnZVRpdGxlO1xufVxuXG5mdW5jdGlvbiBjb21wdXRlVG9wTGV2ZWxQYWdlSW1hZ2UoZ3JvdXBTZXR0aW5ncykge1xuICAgIC8vIFRPRE86IFRoaXMgaXMgY3VycmVudGx5IGp1c3QgcmVwcm9kdWNpbmcgd2hhdCBlbmdhZ2VfZnVsbCBkb2VzLiBCdXQgZG8gd2UgcmVhbGx5IG5lZWQgdG8gbG9vayBpbnNpZGUgdGhlICdodG1sJ1xuICAgIC8vICAgICAgIGVsZW1lbnQgbGlrZSB0aGlzPyBDYW4gd2UganVzdCB1c2UgYSBzZWxlY3RvciBsaWtlIHRoZSBvbmUgZm9yIHRoZSBwYWdlIHRpdGxlIChtZXRhW3Byb3BlcnR5PVwib2c6aW1hZ2VcIl0pP1xuICAgIC8vICAgICAgIENhbi9zaG91bGQgd2UgbG9vayBpbnNpZGUgdGhlIGhlYWQgZWxlbWVudCBpbnN0ZWFkIG9mIHRoZSB3aG9sZSBodG1sIGRvY3VtZW50P1xuICAgIC8vICAgICAgIFVuaWZ5IHRoZSBzdHJhdGVnaWVzIHVzZWQgYnkgdGhpcyBmdW5jdGlvbiBhbmQgY29tcHV0ZVRvcExldmVsUGFnZVRpdGxlKClcbiAgICB2YXIgaW1hZ2UgPSAkKCdodG1sJykuZmluZChncm91cFNldHRpbmdzLnBhZ2VJbWFnZVNlbGVjdG9yKCkpLmF0dHIoZ3JvdXBTZXR0aW5ncy5wYWdlSW1hZ2VBdHRyaWJ1dGUoKSkgfHwgJyc7XG4gICAgcmV0dXJuIGltYWdlLnRyaW0oKTtcbn1cblxuZnVuY3Rpb24gY29tcHV0ZVRvcExldmVsQ2Fub25pY2FsVXJsKGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgY2Fub25pY2FsVXJsID0gd2luZG93LmxvY2F0aW9uLmhyZWYuc3BsaXQoJyMnKVswXS50b0xvd2VyQ2FzZSgpO1xuICAgIHZhciAkY2Fub25pY2FsTGluayA9ICQoJ2xpbmtbcmVsPVwiY2Fub25pY2FsXCJdJyk7XG4gICAgaWYgKCRjYW5vbmljYWxMaW5rLmxlbmd0aCA+IDApIHtcbiAgICAgICAgdmFyIG92ZXJyaWRlVXJsID0gJGNhbm9uaWNhbExpbmsuYXR0cignaHJlZicpLnRyaW0oKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICB2YXIgZG9tYWluID0gKHdpbmRvdy5sb2NhdGlvbi5wcm90b2NvbCsnLy8nK3dpbmRvdy5sb2NhdGlvbi5ob3N0bmFtZSsnLycpLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIGlmIChvdmVycmlkZVVybCAhPT0gZG9tYWluKSB7IC8vIGZhc3RjbyBmaXggKHNpbmNlIHRoZXkgc29tZXRpbWVzIHJld3JpdGUgdGhlaXIgY2Fub25pY2FsIHRvIHNpbXBseSBiZSB0aGVpciBkb21haW4uKVxuICAgICAgICAgICAgY2Fub25pY2FsVXJsID0gb3ZlcnJpZGVVcmw7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlbW92ZVN1YmRvbWFpbkZyb21QYWdlVXJsKGNhbm9uaWNhbFVybCwgZ3JvdXBTZXR0aW5ncyk7XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVQYWdlRWxlbWVudFVybCgkcGFnZUVsZW1lbnQsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgdXJsID0gJHBhZ2VFbGVtZW50LmZpbmQoZ3JvdXBTZXR0aW5ncy5wYWdlTGlua1NlbGVjdG9yKCkpLmF0dHIoJ2hyZWYnKTtcbiAgICBpZiAodXJsKSB7XG4gICAgICAgIHJldHVybiByZW1vdmVTdWJkb21haW5Gcm9tUGFnZVVybCh1cmwsIGdyb3VwU2V0dGluZ3MpO1xuICAgIH1cbiAgICByZXR1cm4gY29tcHV0ZVRvcExldmVsQ2Fub25pY2FsVXJsKGdyb3VwU2V0dGluZ3MpO1xufVxuXG4vLyBUT0RPIGNvcGllZCBmcm9tIGVuZ2FnZV9mdWxsLiBSZXZpZXcuXG5mdW5jdGlvbiByZW1vdmVTdWJkb21haW5Gcm9tUGFnZVVybCh1cmwsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICAvLyBBTlQuYWN0aW9ucy5yZW1vdmVTdWJkb21haW5Gcm9tUGFnZVVybDpcbiAgICAvLyBpZiBcImlnbm9yZV9zdWJkb21haW5cIiBpcyBjaGVja2VkIGluIHNldHRpbmdzLCBBTkQgdGhleSBzdXBwbHkgYSBUTEQsXG4gICAgLy8gdGhlbiBtb2RpZnkgdGhlIHBhZ2UgYW5kIGNhbm9uaWNhbCBVUkxzIGhlcmUuXG4gICAgLy8gaGF2ZSB0byBoYXZlIHRoZW0gc3VwcGx5IG9uZSBiZWNhdXNlIHRoZXJlIGFyZSB0b28gbWFueSB2YXJpYXRpb25zIHRvIHJlbGlhYmx5IHN0cmlwIHN1YmRvbWFpbnMgICguY29tLCAuaXMsIC5jb20uYXIsIC5jby51aywgZXRjKVxuICAgIGlmIChncm91cFNldHRpbmdzLnVybC5pZ25vcmVTdWJkb21haW4oKSA9PSB0cnVlICYmIGdyb3VwU2V0dGluZ3MudXJsLmNhbm9uaWNhbERvbWFpbigpKSB7XG4gICAgICAgIHZhciBIT1NURE9NQUlOID0gL1stXFx3XStcXC4oPzpbLVxcd10rXFwueG4tLVstXFx3XSt8Wy1cXHddezIsfXxbLVxcd10rXFwuWy1cXHddezJ9KSQvaTtcbiAgICAgICAgdmFyIHNyY0FycmF5ID0gdXJsLnNwbGl0KCcvJyk7XG5cbiAgICAgICAgdmFyIHByb3RvY29sID0gc3JjQXJyYXlbMF07XG4gICAgICAgIHNyY0FycmF5LnNwbGljZSgwLDMpO1xuXG4gICAgICAgIHZhciByZXR1cm5VcmwgPSBwcm90b2NvbCArICcvLycgKyBncm91cFNldHRpbmdzLnVybC5jYW5vbmljYWxEb21haW4oKSArICcvJyArIHNyY0FycmF5LmpvaW4oJy8nKTtcblxuICAgICAgICByZXR1cm4gcmV0dXJuVXJsO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB1cmw7XG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY29tcHV0ZVBhZ2VVcmw6IGNvbXB1dGVQYWdlRWxlbWVudFVybCxcbiAgICBjb21wdXRlUGFnZVRpdGxlOiBjb21wdXRlUGFnZVRpdGxlLFxuICAgIGNvbXB1dGVUb3BMZXZlbFBhZ2VJbWFnZTogY29tcHV0ZVRvcExldmVsUGFnZUltYWdlXG59OyIsInZhciAkOyByZXF1aXJlKCcuL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xuXG52YXIgbm9Db25mbGljdDtcbnZhciBsb2FkZWRSYWN0aXZlO1xudmFyIGNhbGxiYWNrcyA9IFtdO1xuXG4vLyBDYXB0dXJlIGFueSBnbG9iYWwgaW5zdGFuY2Ugb2YgUmFjdGl2ZSB3aGljaCBhbHJlYWR5IGV4aXN0cyBiZWZvcmUgd2UgbG9hZCBvdXIgb3duLlxuZnVuY3Rpb24gYWJvdXRUb0xvYWQoKSB7XG4gICAgbm9Db25mbGljdCA9IHdpbmRvdy5SYWN0aXZlO1xufVxuXG4vLyBSZXN0b3JlIHRoZSBnbG9iYWwgaW5zdGFuY2Ugb2YgUmFjdGl2ZSAoaWYgYW55KSBhbmQgcGFzcyBvdXQgb3VyIHZlcnNpb24gdG8gb3VyIGNhbGxiYWNrc1xuZnVuY3Rpb24gbG9hZGVkKCkge1xuICAgIGxvYWRlZFJhY3RpdmUgPSBSYWN0aXZlO1xuICAgIHdpbmRvdy5SYWN0aXZlID0gbm9Db25mbGljdDtcbiAgICBsb2FkZWRSYWN0aXZlLmRlY29yYXRvcnMuY3NzcmVzZXQgPSBjc3NSZXNldERlY29yYXRvcjsgLy8gTWFrZSBvdXIgY3NzIHJlc2V0IGRlY29yYXRvciBhdmFpbGFibGUgdG8gYWxsIGluc3RhbmNlc1xuICAgIG5vdGlmeUNhbGxiYWNrcygpO1xufVxuXG5mdW5jdGlvbiBjc3NSZXNldERlY29yYXRvcihub2RlKSB7XG4gICAgdGFnQ2hpbGRyZW4obm9kZSwgJ2FudGVubmEtcmVzZXQnKTtcbiAgICByZXR1cm4geyB0ZWFyZG93bjogZnVuY3Rpb24oKSB7fSB9O1xufVxuXG5mdW5jdGlvbiB0YWdDaGlsZHJlbihlbGVtZW50LCBjbGF6eikge1xuICAgIGlmIChlbGVtZW50LmNoaWxkcmVuKSB7IC8vIFNhZmFyaSByZXR1cm5zIHVuZGVmaW5lZCB3aGVuIGFza2luZyBmb3IgY2hpbGRyZW4gb24gYW4gU1ZHIGVsZW1lbnRcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBlbGVtZW50LmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB0YWdDaGlsZHJlbihlbGVtZW50LmNoaWxkcmVuW2ldLCBjbGF6eik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgJChlbGVtZW50KS5hZGRDbGFzcyhjbGF6eik7XG59XG5cbmZ1bmN0aW9uIG5vdGlmeUNhbGxiYWNrcygpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNhbGxiYWNrcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjYWxsYmFja3NbaV0obG9hZGVkUmFjdGl2ZSk7XG4gICAgfVxuICAgIGNhbGxiYWNrcyA9IFtdO1xufVxuXG4vLyBSZWdpc3RlcnMgdGhlIGdpdmVuIGNhbGxiYWNrIHRvIGJlIG5vdGlmaWVkIHdoZW4gb3VyIHZlcnNpb24gb2YgUmFjdGl2ZSBpcyBsb2FkZWQuXG5mdW5jdGlvbiBvbkxvYWQoY2FsbGJhY2spIHtcbiAgICBpZiAobG9hZGVkUmFjdGl2ZSkge1xuICAgICAgICBjYWxsYmFjayhsb2FkZWRSYWN0aXZlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBjYWxsYmFja3MucHVzaChjYWxsYmFjayk7XG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgYWJvdXRUb0xvYWQ6IGFib3V0VG9Mb2FkLFxuICAgIGxvYWRlZDogbG9hZGVkLFxuICAgIG9uTG9hZDogb25Mb2FkXG59OyIsInZhciAkOyByZXF1aXJlKCcuL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIHJhbmd5OyByZXF1aXJlKCcuL3Jhbmd5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGxvYWRlZFJhbmd5KSB7IHJhbmd5ID0gbG9hZGVkUmFuZ3k7IH0pO1xuXG52YXIgaGlnaGxpZ2h0Q2xhc3MgPSAnYW50ZW5uYS1oaWdobGlnaHQnO1xudmFyIGhpZ2hsaWdodGVkUmFuZ2VzID0gW107XG5cbnZhciBjbGFzc0FwcGxpZXI7XG5mdW5jdGlvbiBnZXRDbGFzc0FwcGxpZXIoKSB7XG4gICAgaWYgKCFjbGFzc0FwcGxpZXIpIHtcbiAgICAgICAgY2xhc3NBcHBsaWVyID0gcmFuZ3kuY3JlYXRlQ2xhc3NBcHBsaWVyKGhpZ2hsaWdodENsYXNzKTtcbiAgICB9XG4gICAgcmV0dXJuIGNsYXNzQXBwbGllcjtcbn1cblxuLy8gUmV0dXJucyBhbiBhZGp1c3RlZCBlbmQgcG9pbnQgZm9yIHRoZSBzZWxlY3Rpb24gd2l0aGluIHRoZSBnaXZlbiBub2RlLCBhcyB0cmlnZ2VyZWQgYnkgdGhlIGdpdmVuIG1vdXNlIHVwIGV2ZW50LlxuLy8gVGhlIHJldHVybmVkIHBvaW50ICh4LCB5KSB0YWtlcyBpbnRvIGFjY291bnQgdGhlIGxvY2F0aW9uIG9mIHRoZSBtb3VzZSB1cCBldmVudCBhcyB3ZWxsIGFzIHRoZSBkaXJlY3Rpb24gb2YgdGhlXG4vLyBzZWxlY3Rpb24gKGZvcndhcmQvYmFjaykuXG5mdW5jdGlvbiBnZXRTZWxlY3Rpb25FbmRQb2ludChub2RlLCBldmVudCwgZXhjbHVkZU5vZGUpIHtcbiAgICAvLyBUT0RPOiBDb25zaWRlciB1c2luZyB0aGUgZWxlbWVudCBjcmVhdGVkIHdpdGggdGhlICdjbGFzc2lmaWVyJyByYXRoZXIgdGhhbiB0aGUgbW91c2UgbG9jYXRpb25cbiAgICB2YXIgc2VsZWN0aW9uID0gcmFuZ3kuZ2V0U2VsZWN0aW9uKCk7XG4gICAgaWYgKGlzVmFsaWRTZWxlY3Rpb24oc2VsZWN0aW9uLCBub2RlLCBleGNsdWRlTm9kZSkpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHg6IGV2ZW50LnBhZ2VYIC0gKCBzZWxlY3Rpb24uaXNCYWNrd2FyZHMoKSA/IC01IDogNSksXG4gICAgICAgICAgICB5OiBldmVudC5wYWdlWSAtIDggLy8gVE9ETzogZXhhY3QgY29vcmRzXG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG59XG5cbi8vIEF0dGVtcHRzIHRvIGdldCBhIHJhbmdlIGZyb20gdGhlIGN1cnJlbnQgc2VsZWN0aW9uLiBUaGlzIGV4cGFuZHMgdGhlXG4vLyBzZWxlY3RlZCByZWdpb24gdG8gaW5jbHVkZSB3b3JkIGJvdW5kYXJpZXMuXG5mdW5jdGlvbiBncmFiU2VsZWN0aW9uKG5vZGUsIGNhbGxiYWNrLCBleGNsdWRlTm9kZSkge1xuICAgIHZhciBzZWxlY3Rpb24gPSByYW5neS5nZXRTZWxlY3Rpb24oKTtcbiAgICBpZiAoaXNWYWxpZFNlbGVjdGlvbihzZWxlY3Rpb24sIG5vZGUsIGV4Y2x1ZGVOb2RlKSkge1xuICAgICAgICBzZWxlY3Rpb24uZXhwYW5kKCd3b3JkJywgeyB0cmltOiB0cnVlIH0pO1xuICAgICAgICBpZiAoc2VsZWN0aW9uLmNvbnRhaW5zTm9kZShleGNsdWRlTm9kZSkpIHtcbiAgICAgICAgICAgIHZhciByYW5nZSA9IHNlbGVjdGlvbi5nZXRSYW5nZUF0KDApO1xuICAgICAgICAgICAgcmFuZ2Uuc2V0RW5kQmVmb3JlKGV4Y2x1ZGVOb2RlKTtcbiAgICAgICAgICAgIHNlbGVjdGlvbi5zZXRTaW5nbGVSYW5nZShyYW5nZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlzVmFsaWRTZWxlY3Rpb24oc2VsZWN0aW9uLCBub2RlLCBleGNsdWRlTm9kZSkpIHtcbiAgICAgICAgICAgIHZhciBsb2NhdGlvbiA9IHJhbmd5LnNlcmlhbGl6ZVNlbGVjdGlvbihzZWxlY3Rpb24sIHRydWUsIG5vZGUpO1xuICAgICAgICAgICAgdmFyIHRleHQgPSBzZWxlY3Rpb24udG9TdHJpbmcoKTtcbiAgICAgICAgICAgIGhpZ2hsaWdodFNlbGVjdGlvbihzZWxlY3Rpb24pOyAvLyBIaWdobGlnaHRpbmcgZGVzZWxlY3RzIHRoZSB0ZXh0LCBzbyBkbyB0aGlzIGxhc3QuXG4gICAgICAgICAgICBjYWxsYmFjayh0ZXh0LCBsb2NhdGlvbik7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGlzVmFsaWRTZWxlY3Rpb24oc2VsZWN0aW9uLCBub2RlLCBleGNsdWRlTm9kZSkge1xuICAgIHJldHVybiAhc2VsZWN0aW9uLmlzQ29sbGFwc2VkICYmICAvLyBOb24tZW1wdHkgc2VsZWN0aW9uXG4gICAgICAgIHNlbGVjdGlvbi5yYW5nZUNvdW50ID09PSAxICYmIC8vIFNpbmdsZSBzZWxlY3Rpb25cbiAgICAgICAgKCFleGNsdWRlTm9kZSB8fCAhc2VsZWN0aW9uLmNvbnRhaW5zTm9kZShleGNsdWRlTm9kZSwgdHJ1ZSkpICYmIC8vIFNlbGVjdGlvbiBkb2Vzbid0IGNvbnRhaW4gYW55dGhpbmcgd2UndmUgc2FpZCB3ZSBkb24ndCB3YW50IChlLmcuIHRoZSBpbmRpY2F0b3IpXG4gICAgICAgIG5vZGUuY29udGFpbnMoc2VsZWN0aW9uLmdldFJhbmdlQXQoMCkuY29tbW9uQW5jZXN0b3JDb250YWluZXIpOyAvLyBTZWxlY3Rpb24gaXMgY29udGFpbmVkIGVudGlyZWx5IHdpdGhpbiB0aGUgbm9kZVxufVxuXG5mdW5jdGlvbiBncmFiTm9kZShub2RlLCBjYWxsYmFjaykge1xuICAgIHZhciByYW5nZSA9IHJhbmd5LmNyZWF0ZVJhbmdlKGRvY3VtZW50KTtcbiAgICByYW5nZS5zZWxlY3ROb2RlQ29udGVudHMobm9kZSk7XG4gICAgdmFyICRleGNsdWRlZCA9ICQobm9kZSkuZmluZCgnLmFudGVubmEtdGV4dC1pbmRpY2F0b3Itd2lkZ2V0Jyk7XG4gICAgaWYgKCRleGNsdWRlZC5zaXplKCkgPiAwKSB7IC8vIFJlbW92ZSB0aGUgaW5kaWNhdG9yIGZyb20gdGhlIGVuZCBvZiB0aGUgc2VsZWN0ZWQgcmFuZ2UuXG4gICAgICAgIHJhbmdlLnNldEVuZEJlZm9yZSgkZXhjbHVkZWQuZ2V0KDApKTtcbiAgICB9XG4gICAgdmFyIHNlbGVjdGlvbiA9IHJhbmd5LmdldFNlbGVjdGlvbigpO1xuICAgIHNlbGVjdGlvbi5zZXRTaW5nbGVSYW5nZShyYW5nZSk7XG4gICAgdmFyIGxvY2F0aW9uID0gcmFuZ3kuc2VyaWFsaXplU2VsZWN0aW9uKHNlbGVjdGlvbiwgdHJ1ZSwgbm9kZSk7XG4gICAgdmFyIHRleHQgPSBzZWxlY3Rpb24udG9TdHJpbmcoKTtcbiAgICBpZiAodGV4dC50cmltKCkubGVuZ3RoID4gMCkge1xuICAgICAgICBoaWdobGlnaHRTZWxlY3Rpb24oc2VsZWN0aW9uKTsgLy8gSGlnaGxpZ2h0aW5nIGRlc2VsZWN0cyB0aGUgdGV4dCwgc28gZG8gdGhpcyBsYXN0LlxuICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKHRleHQsIGxvY2F0aW9uKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBzZWxlY3Rpb24ucmVtb3ZlQWxsUmFuZ2VzKCk7IC8vIERvbid0IGFjdHVhbGx5IGxlYXZlIHRoZSBlbGVtZW50IHNlbGVjdGVkLlxuICAgIHNlbGVjdGlvbi5yZWZyZXNoKCk7XG59XG5cbi8vIEhpZ2hsaWdodHMgdGhlIGdpdmVuIGxvY2F0aW9uIGluc2lkZSB0aGUgZ2l2ZW4gbm9kZS5cbmZ1bmN0aW9uIGhpZ2hsaWdodExvY2F0aW9uKG5vZGUsIGxvY2F0aW9uKSB7XG4gICAgLy8gVE9ETyBlcnJvciBoYW5kbGluZyBpbiBjYXNlIHRoZSByYW5nZSBpcyBub3QgdmFsaWQ/XG4gICAgaWYgKHJhbmd5LmNhbkRlc2VyaWFsaXplUmFuZ2UobG9jYXRpb24sIG5vZGUsIGRvY3VtZW50KSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdmFyIHJhbmdlID0gcmFuZ3kuZGVzZXJpYWxpemVSYW5nZShsb2NhdGlvbiwgbm9kZSwgZG9jdW1lbnQpO1xuICAgICAgICAgICAgaGlnaGxpZ2h0UmFuZ2UocmFuZ2UpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgLy8gVE9ETzogQ29uc2lkZXIgbG9nZ2luZyBzb21lIGtpbmQgb2YgZXZlbnQgc2VydmVyLXNpZGU/XG4gICAgICAgICAgICAvLyBUT0RPOiBDb25zaWRlciBoaWdobGlnaHRpbmcgdGhlIHdob2xlIG5vZGU/IE9yIGlzIGl0IGJldHRlciB0byBqdXN0IGhpZ2hsaWdodCBub3RoaW5nP1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBoaWdobGlnaHRTZWxlY3Rpb24oc2VsZWN0aW9uKSB7XG4gICAgaGlnaGxpZ2h0UmFuZ2Uoc2VsZWN0aW9uLmdldFJhbmdlQXQoMCkpO1xufVxuXG5mdW5jdGlvbiBoaWdobGlnaHRSYW5nZShyYW5nZSkge1xuICAgIGdldENsYXNzQXBwbGllcigpLmFwcGx5VG9SYW5nZShyYW5nZSk7XG4gICAgaGlnaGxpZ2h0ZWRSYW5nZXMucHVzaChyYW5nZSk7XG59XG5cbi8vIENsZWFycyBhbGwgaGlnaGxpZ2h0cyB0aGF0IGhhdmUgYmVlbiBjcmVhdGVkIG9uIHRoZSBwYWdlLlxuZnVuY3Rpb24gY2xlYXJIaWdobGlnaHRzKCkge1xuICAgIHZhciBjbGFzc0FwcGxpZXIgPSBnZXRDbGFzc0FwcGxpZXIoKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGhpZ2hsaWdodGVkUmFuZ2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciByYW5nZSA9IGhpZ2hsaWdodGVkUmFuZ2VzW2ldO1xuICAgICAgICBpZiAoY2xhc3NBcHBsaWVyLmlzQXBwbGllZFRvUmFuZ2UocmFuZ2UpKSB7XG4gICAgICAgICAgICBjbGFzc0FwcGxpZXIudW5kb1RvUmFuZ2UocmFuZ2UpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGhpZ2hsaWdodGVkUmFuZ2VzID0gW107XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBnZXRTZWxlY3Rpb25FbmRQb2ludDogZ2V0U2VsZWN0aW9uRW5kUG9pbnQsXG4gICAgZ3JhYlNlbGVjdGlvbjogZ3JhYlNlbGVjdGlvbixcbiAgICBncmFiTm9kZTogZ3JhYk5vZGUsXG4gICAgY2xlYXJIaWdobGlnaHRzOiBjbGVhckhpZ2hsaWdodHMsXG4gICAgaGlnaGxpZ2h0OiBoaWdobGlnaHRMb2NhdGlvblxufTsiLCJcbnZhciBub0NvbmZsaWN0O1xudmFyIGxvYWRlZFJhbmd5O1xudmFyIGNhbGxiYWNrcyA9IFtdO1xuXG4vLyBDYXB0dXJlIGFueSBnbG9iYWwgaW5zdGFuY2Ugb2YgcmFuZ3kgd2hpY2ggYWxyZWFkeSBleGlzdHMgYmVmb3JlIHdlIGxvYWQgb3VyIG93bi5cbmZ1bmN0aW9uIGFib3V0VG9Mb2FkKCkge1xuICAgIG5vQ29uZmxpY3QgPSB3aW5kb3cucmFuZ3k7XG59XG5cbi8vIFJlc3RvcmUgdGhlIGdsb2JhbCBpbnN0YW5jZSBvZiByYW5neSAoaWYgYW55KSBhbmQgcGFzcyBvdXQgb3VyIHZlcnNpb24gdG8gb3VyIGNhbGxiYWNrc1xuZnVuY3Rpb24gbG9hZGVkKCkge1xuICAgIGxvYWRlZFJhbmd5ID0gcmFuZ3k7XG4gICAgbG9hZGVkUmFuZ3kuaW5pdCgpO1xuICAgIHdpbmRvdy5yYW5neSA9IG5vQ29uZmxpY3Q7XG4gICAgbm90aWZ5Q2FsbGJhY2tzKCk7XG59XG5cbmZ1bmN0aW9uIG5vdGlmeUNhbGxiYWNrcygpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNhbGxiYWNrcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjYWxsYmFja3NbaV0obG9hZGVkUmFuZ3kpO1xuICAgIH1cbiAgICBjYWxsYmFja3MgPSBbXTtcbn1cblxuLy8gUmVnaXN0ZXJzIHRoZSBnaXZlbiBjYWxsYmFjayB0byBiZSBub3RpZmllZCB3aGVuIG91ciB2ZXJzaW9uIG9mIFJhbmd5IGlzIGxvYWRlZC5cbmZ1bmN0aW9uIG9uTG9hZChjYWxsYmFjaykge1xuICAgIGlmIChsb2FkZWRSYW5neSkge1xuICAgICAgICBjYWxsYmFjayhsb2FkZWRSYW5neSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgY2FsbGJhY2tzLnB1c2goY2FsbGJhY2spO1xuICAgIH1cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGFib3V0VG9Mb2FkOiBhYm91dFRvTG9hZCxcbiAgICBsb2FkZWQ6IGxvYWRlZCxcbiAgICBvbkxvYWQ6IG9uTG9hZFxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcblxuXG5mdW5jdGlvbiBjb21wdXRlTGF5b3V0RGF0YShyZWFjdGlvbnNEYXRhLCBjb2xvcnMpIHtcbiAgICB2YXIgbnVtUmVhY3Rpb25zID0gcmVhY3Rpb25zRGF0YS5sZW5ndGg7XG4gICAgaWYgKG51bVJlYWN0aW9ucyA9PSAwKSB7XG4gICAgICAgIHJldHVybiB7fTsgLy8gVE9ETyBjbGVhbiB0aGlzIHVwXG4gICAgfVxuICAgIC8vIFRPRE86IENvcGllZCBjb2RlIGZyb20gZW5nYWdlX2Z1bGwuY3JlYXRlVGFnQnVja2V0c1xuICAgIHZhciBtYXggPSByZWFjdGlvbnNEYXRhWzBdLmNvdW50O1xuICAgIHZhciBtZWRpYW4gPSByZWFjdGlvbnNEYXRhWyBNYXRoLmZsb29yKHJlYWN0aW9uc0RhdGEubGVuZ3RoLzIpIF0uY291bnQ7XG4gICAgdmFyIG1pbiA9IHJlYWN0aW9uc0RhdGFbIHJlYWN0aW9uc0RhdGEubGVuZ3RoLTEgXS5jb3VudDtcbiAgICB2YXIgdG90YWwgPSAwO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbnVtUmVhY3Rpb25zOyBpKyspIHtcbiAgICAgICAgdG90YWwgKz0gcmVhY3Rpb25zRGF0YVtpXS5jb3VudDtcbiAgICB9XG4gICAgdmFyIGF2ZXJhZ2UgPSBNYXRoLmZsb29yKHRvdGFsIC8gbnVtUmVhY3Rpb25zKTtcbiAgICB2YXIgbWlkVmFsdWUgPSAoIG1lZGlhbiA+IGF2ZXJhZ2UgKSA/IG1lZGlhbiA6IGF2ZXJhZ2U7XG5cbiAgICB2YXIgbGF5b3V0Q2xhc3NlcyA9IFtdO1xuICAgIHZhciBudW1IYWxmc2llcyA9IDA7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBudW1SZWFjdGlvbnM7IGkrKykge1xuICAgICAgICBpZiAocmVhY3Rpb25zRGF0YVtpXS5jb3VudCA+IG1pZFZhbHVlKSB7XG4gICAgICAgICAgICBsYXlvdXRDbGFzc2VzW2ldID0gJ2Z1bGwnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbGF5b3V0Q2xhc3Nlc1tpXSA9ICdoYWxmJztcbiAgICAgICAgICAgIG51bUhhbGZzaWVzKys7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKG51bUhhbGZzaWVzICUgMiAhPT0wKSB7XG4gICAgICAgIGxheW91dENsYXNzZXNbbnVtUmVhY3Rpb25zIC0gMV0gPSAnZnVsbCc7IC8vIElmIHRoZXJlIGFyZSBhbiBvZGQgbnVtYmVyLCB0aGUgbGFzdCBvbmUgZ29lcyBmdWxsLlxuICAgIH1cblxuICAgIHZhciBiYWNrZ3JvdW5kQ29sb3JzID0gW107XG4gICAgdmFyIGNvbG9ySW5kZXggPSAwO1xuICAgIHZhciBwYWlyV2l0aE5leHQgPSAwO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbnVtUmVhY3Rpb25zOyBpKyspIHtcbiAgICAgICAgYmFja2dyb3VuZENvbG9yc1tpXSA9IGNvbG9yc1tjb2xvckluZGV4ICUgY29sb3JzLmxlbmd0aF07XG4gICAgICAgIGlmIChsYXlvdXRDbGFzc2VzW2ldID09PSAnZnVsbCcpIHtcbiAgICAgICAgICAgIGNvbG9ySW5kZXgrKztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIFRPRE8gZ290dGEgYmUgYWJsZSB0byBtYWtlIHRoaXMgc2ltcGxlclxuICAgICAgICAgICAgaWYgKHBhaXJXaXRoTmV4dCA+IDApIHtcbiAgICAgICAgICAgICAgICBwYWlyV2l0aE5leHQtLTtcbiAgICAgICAgICAgICAgICBpZiAocGFpcldpdGhOZXh0ID09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgY29sb3JJbmRleCsrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcGFpcldpdGhOZXh0ID0gMTsgLy8gSWYgd2Ugd2FudCB0byBhbGxvdyBOIGJveGVzIHBlciByb3csIHRoaXMgbnVtYmVyIHdvdWxkIGJlY29tZSBjb25kaXRpb25hbC5cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIGxheW91dENsYXNzZXM6IGxheW91dENsYXNzZXMsXG4gICAgICAgIGJhY2tncm91bmRDb2xvcnM6IGJhY2tncm91bmRDb2xvcnNcbiAgICB9O1xufVxuXG5mdW5jdGlvbiBzaXplUmVhY3Rpb25UZXh0VG9GaXQobm9kZSkge1xuICAgIHZhciAkZWxlbWVudCA9ICQobm9kZSk7XG4gICAgdmFyICRyZWFjdGlvbnNXaW5kb3cgPSAkZWxlbWVudC5jbG9zZXN0KCcuYW50ZW5uYS1yZWFjdGlvbnMtd2lkZ2V0Jyk7XG4gICAgdmFyIG9yaWdpbmFsRGlzcGxheSA9ICRyZWFjdGlvbnNXaW5kb3cuY3NzKCdkaXNwbGF5Jyk7XG4gICAgaWYgKG9yaWdpbmFsRGlzcGxheSA9PT0gJ25vbmUnKSB7IC8vIElmIHdlJ3JlIHNpemluZyB0aGUgYm94ZXMgYmVmb3JlIHRoZSB3aWRnZXQgaXMgZGlzcGxheWVkLCB0ZW1wb3JhcmlseSBkaXNwbGF5IGl0IG9mZnNjcmVlbi5cbiAgICAgICAgJHJlYWN0aW9uc1dpbmRvdy5jc3Moe2Rpc3BsYXk6ICdibG9jaycsIGxlZnQ6ICcxMDAlJ30pO1xuICAgIH1cbiAgICB2YXIgcmF0aW8gPSBub2RlLmNsaWVudFdpZHRoIC8gbm9kZS5zY3JvbGxXaWR0aDtcbiAgICBpZiAocmF0aW8gPCAxLjApIHsgLy8gSWYgdGhlIHRleHQgZG9lc24ndCBmaXQsIGZpcnN0IHRyeSB0byB3cmFwIGl0IHRvIHR3byBsaW5lcy4gVGhlbiBzY2FsZSBpdCBkb3duIGlmIHN0aWxsIG5lY2Vzc2FyeS5cbiAgICAgICAgdmFyIHRleHQgPSBub2RlLmlubmVySFRNTDtcbiAgICAgICAgdmFyIG1pZCA9IE1hdGguY2VpbCh0ZXh0Lmxlbmd0aCAvIDIpOyAvLyBMb29rIGZvciB0aGUgY2xvc2VzdCBzcGFjZSB0byB0aGUgbWlkZGxlLCB3ZWlnaHRlZCBzbGlnaHRseSAoTWF0aC5jZWlsKSB0b3dhcmQgYSBzcGFjZSBpbiB0aGUgc2Vjb25kIGhhbGYuXG4gICAgICAgIHZhciBzZWNvbmRIYWxmSW5kZXggPSB0ZXh0LmluZGV4T2YoJyAnLCBtaWQpO1xuICAgICAgICB2YXIgZmlyc3RIYWxmSW5kZXggPSB0ZXh0Lmxhc3RJbmRleE9mKCcgJywgbWlkKTtcbiAgICAgICAgdmFyIHNwbGl0SW5kZXggPSBNYXRoLmFicyhzZWNvbmRIYWxmSW5kZXggLSBtaWQpIDwgTWF0aC5hYnMobWlkIC0gZmlyc3RIYWxmSW5kZXgpID8gc2Vjb25kSGFsZkluZGV4IDogZmlyc3RIYWxmSW5kZXg7XG4gICAgICAgIGlmIChzcGxpdEluZGV4ID4gMSkge1xuICAgICAgICAgICAgbm9kZS5pbm5lckhUTUwgPSB0ZXh0LnNsaWNlKDAsIHNwbGl0SW5kZXgpICsgJzxicj4nICsgdGV4dC5zbGljZShzcGxpdEluZGV4KTtcbiAgICAgICAgICAgIHJhdGlvID0gbm9kZS5jbGllbnRXaWR0aCAvIG5vZGUuc2Nyb2xsV2lkdGg7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJhdGlvIDwgMS4wKSB7XG4gICAgICAgICAgICAkZWxlbWVudC5jc3MoJ2ZvbnQtc2l6ZScsIE1hdGgubWF4KDEwLCBNYXRoLmZsb29yKHBhcnNlSW50KCRlbGVtZW50LmNzcygnZm9udC1zaXplJykpICogcmF0aW8pIC0gMSkpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChvcmlnaW5hbERpc3BsYXkgPT09ICdub25lJykge1xuICAgICAgICAkcmVhY3Rpb25zV2luZG93LmNzcyh7ZGlzcGxheTogJycsIGxlZnQ6ICcnfSk7XG4gICAgfVxuICAgIHJldHVybiB7IHRlYXJkb3duOiBmdW5jdGlvbigpIHt9IH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHNpemVUb0ZpdDogc2l6ZVJlYWN0aW9uVGV4dFRvRml0LFxuICAgIGNvbXB1dGVMYXlvdXREYXRhOiBjb21wdXRlTGF5b3V0RGF0YVxufTsiLCJ2YXIgQ2FsbGJhY2tTdXBwb3J0ID0gcmVxdWlyZSgnLi9jYWxsYmFjay1zdXBwb3J0Jyk7XG5cbi8vIFRoaXMgbW9kdWxlIGFsbG93cyB1cyB0byByZWdpc3RlciBjYWxsYmFja3MgdGhhdCBhcmUgdGhyb3R0bGVkIGluIHRoZWlyIGZyZXF1ZW5jeS4gVGhpcyBpcyB1c2VmdWwgZm9yIGV2ZW50cyBsaWtlXG4vLyByZXNpemUgYW5kIHNjcm9sbCwgd2hpY2ggY2FuIGJlIGZpcmVkIGF0IGFuIGV4dHJlbWVseSBoaWdoIHJhdGUuXG5cbnZhciB0aHJvdHRsZWRMaXN0ZW5lcnMgPSB7fTtcblxuZnVuY3Rpb24gb24odHlwZSwgY2FsbGJhY2spIHtcbiAgICB0aHJvdHRsZWRMaXN0ZW5lcnNbdHlwZV0gPSB0aHJvdHRsZWRMaXN0ZW5lcnNbdHlwZV0gfHwgY3JlYXRlVGhyb3R0bGVkTGlzdGVuZXIodHlwZSk7XG4gICAgdGhyb3R0bGVkTGlzdGVuZXJzW3R5cGVdLmFkZENhbGxiYWNrKGNhbGxiYWNrKTtcbn1cblxuZnVuY3Rpb24gb2ZmKHR5cGUsIGNhbGxiYWNrKSB7XG4gICAgdmFyIGV2ZW50TGlzdGVuZXIgPSB0aHJvdHRsZWRMaXN0ZW5lcnNbdHlwZV07XG4gICAgaWYgKGV2ZW50TGlzdGVuZXIpIHtcbiAgICAgICAgZXZlbnRMaXN0ZW5lci5yZW1vdmVDYWxsYmFjayhjYWxsYmFjayk7XG4gICAgICAgIGlmIChldmVudExpc3RlbmVyLmlzRW1wdHkoKSkge1xuICAgICAgICAgICAgZXZlbnRMaXN0ZW5lci50ZWFyZG93bigpO1xuICAgICAgICAgICAgZGVsZXRlIHRocm90dGxlZExpc3RlbmVyc1t0eXBlXTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLy8gQ3JlYXRlcyBhIGxpc3RlbmVyIG9uIHRoZSBwYXJ0aWN1bGFyIGV2ZW50IHR5cGUuIENhbGxiYWNrcyBhZGRlZCB0byB0aGlzIGxpc3RlbmVyIHdpbGwgYmUgdGhyb3R0bGVkLlxuZnVuY3Rpb24gY3JlYXRlVGhyb3R0bGVkTGlzdGVuZXIodHlwZSkge1xuICAgIHZhciBjYWxsYmFja3MgPSBDYWxsYmFja1N1cHBvcnQuY3JlYXRlKCk7XG4gICAgdmFyIGV2ZW50VGltZW91dDtcbiAgICBzZXR1cCgpO1xuICAgIHJldHVybiB7XG4gICAgICAgIGFkZENhbGxiYWNrOiBjYWxsYmFja3MuYWRkLFxuICAgICAgICByZW1vdmVDYWxsYmFjazogY2FsbGJhY2tzLnJlbW92ZSxcbiAgICAgICAgaXNFbXB0eTogY2FsbGJhY2tzLmlzRW1wdHksXG4gICAgICAgIHRlYXJkb3duOiB0ZWFyZG93blxuICAgIH07XG5cbiAgICBmdW5jdGlvbiBoYW5kbGVFdmVudCgpIHtcbiAgICAgICBpZiAoIWV2ZW50VGltZW91dCkge1xuICAgICAgICAgICBldmVudFRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgY2FsbGJhY2tzLmludm9rZUFsbCgpO1xuICAgICAgICAgICAgICAgZXZlbnRUaW1lb3V0ID0gbnVsbDtcbiAgICAgICAgICAgfSwgNjYpOyAvLyAxNSBGUFNcbiAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2V0dXAoKSB7XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKHR5cGUsIGhhbmRsZUV2ZW50KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB0ZWFyZG93bigpIHtcbiAgICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIodHlwZSwgaGFuZGxlRXZlbnQpO1xuICAgIH1cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIG9uOiBvbixcbiAgICBvZmY6IG9mZlxufTsiLCJcbi8vIFNldHMgdXAgdGhlIGdpdmVuIGVsZW1lbnQgdG8gYmUgY2FsbGVkIHdpdGggYSBUb3VjaEV2ZW50IHRoYXQgd2UgcmVjb2duaXplIGFzIGEgdGFwLlxuZnVuY3Rpb24gc2V0dXBUb3VjaFRhcEV2ZW50cyhlbGVtZW50LCBjYWxsYmFjaykge1xuICAgIC8vIFRPRE86IGZpbmQgYSByZWFsIHZhbHVlIGZvciB0aGlzXG4gICAgdmFyIHRpbWVvdXQgPSAyMDA7IC8vIFRoaXMgaXMgdGhlIHRpbWUgYmV0d2VlbiB0b3VjaHN0YXJ0IGFuZCB0b3VjaGVuZCB0aGF0IHdlIHVzZSB0byBkaXN0aW5ndWlzaCBhIHRhcCBmcm9tIGEgbG9uZyBwcmVzcy5cbiAgICB2YXIgdmFsaWRUYXAgPSBmYWxzZTtcbiAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0b3VjaFN0YXJ0KTtcbiAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIHRvdWNoTW92ZSk7XG4gICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGNhbmNlbCcsIHRvdWNoQ2FuY2VsKTtcbiAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgdG91Y2hFbmQpO1xuICAgIHJldHVybiB7XG4gICAgICAgIHRlYXJkb3duOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRvdWNoU3RhcnQpO1xuICAgICAgICAgICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCB0b3VjaE1vdmUpO1xuICAgICAgICAgICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaGNhbmNlbCcsIHRvdWNoQ2FuY2VsKTtcbiAgICAgICAgICAgIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCB0b3VjaEVuZCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gdG91Y2hTdGFydChldmVudCkge1xuICAgICAgICB2YWxpZFRhcCA9IHRydWU7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YWxpZFRhcCA9IGZhbHNlO1xuICAgICAgICB9LCB0aW1lb3V0KTtcbiAgICB9XG4gICAgZnVuY3Rpb24gdG91Y2hFbmQoZXZlbnQpIHtcbiAgICAgICAgaWYgKHZhbGlkVGFwICYmIGV2ZW50LmNoYW5nZWRUb3VjaGVzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgY2FsbGJhY2soZXZlbnQpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIHRvdWNoTW92ZShldmVudCkge1xuICAgICAgICB2YWxpZFRhcCA9IGZhbHNlO1xuICAgIH1cbiAgICBmdW5jdGlvbiB0b3VjaENhbmNlbChldmVudCkge1xuICAgICAgICB2YWxpZFRhcCA9IGZhbHNlO1xuICAgIH1cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHNldHVwVGFwOiBzZXR1cFRvdWNoVGFwRXZlbnRzXG59OyIsIlxuXG5mdW5jdGlvbiB0b2dnbGVUcmFuc2l0aW9uQ2xhc3MoJGVsZW1lbnQsIGNsYXNzTmFtZSwgc3RhdGUsIG5leHRTdGVwKSB7XG4gICAgJGVsZW1lbnQub24oXCJ0cmFuc2l0aW9uZW5kIHdlYmtpdFRyYW5zaXRpb25FbmQgb1RyYW5zaXRpb25FbmQgTVNUcmFuc2l0aW9uRW5kXCIsXG4gICAgICAgIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICAvLyBvbmNlIHRoZSBDU1MgdHJhbnNpdGlvbiBpcyBjb21wbGV0ZSwgY2FsbCBvdXIgbmV4dCBzdGVwXG4gICAgICAgICAgICAvLyBTZWU6IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvOTI1NTI3OS9jYWxsYmFjay13aGVuLWNzczMtdHJhbnNpdGlvbi1maW5pc2hlc1xuICAgICAgICAgICAgaWYgKGV2ZW50LnRhcmdldCA9PSBldmVudC5jdXJyZW50VGFyZ2V0KSB7XG4gICAgICAgICAgICAgICAgJGVsZW1lbnQub2ZmKFwidHJhbnNpdGlvbmVuZCB3ZWJraXRUcmFuc2l0aW9uRW5kIG9UcmFuc2l0aW9uRW5kIE1TVHJhbnNpdGlvbkVuZFwiKTtcbiAgICAgICAgICAgICAgICBpZiAobmV4dFN0ZXApIHtcbiAgICAgICAgICAgICAgICAgICAgbmV4dFN0ZXAoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICApO1xuICAgICRlbGVtZW50LnRvZ2dsZUNsYXNzKGNsYXNzTmFtZSwgc3RhdGUpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICB0b2dnbGVDbGFzczogdG9nZ2xlVHJhbnNpdGlvbkNsYXNzXG59OyIsInZhciBBcHBNb2RlID0gcmVxdWlyZSgnLi9hcHAtbW9kZScpO1xuXG5mdW5jdGlvbiBhbnRlbm5hSG9tZSgpIHtcbiAgICBpZiAoQXBwTW9kZS50ZXN0KSB7XG4gICAgICAgIHJldHVybiB3aW5kb3cubG9jYXRpb24ucHJvdG9jb2wgKyAnLy9sb2NhbGhvc3Q6MzAwMCc7XG4gICAgfSBlbHNlIGlmIChBcHBNb2RlLm9mZmxpbmUpIHtcbiAgICAgICAgcmV0dXJuIHdpbmRvdy5sb2NhdGlvbi5wcm90b2NvbCArIFwiLy9sb2NhbGhvc3Q6ODA4MVwiO1xuICAgIH1cbiAgICByZXR1cm4gXCJodHRwczovL3d3dy5hbnRlbm5hLmlzXCI7IC8vIFRPRE86IHd3dz8gaG93IGFib3V0IGFudGVubmEuaXMgb3IgYXBpLmFudGVubmEuaXM/XG59XG5cbi8vIFRPRE86IG91ciBzZXJ2ZXIgaXMgcmVkaXJlY3RpbmcgYW55IFVSTHMgd2l0aG91dCBhIHRyYWlsaW5nIHNsYXNoLiBpcyB0aGlzIG5lY2Vzc2FyeT9cblxuZnVuY3Rpb24gZ2V0R3JvdXBTZXR0aW5nc1VybCgpIHtcbiAgICByZXR1cm4gJy9hcGkvc2V0dGluZ3MvJztcbn1cblxuZnVuY3Rpb24gZ2V0UGFnZURhdGFVcmwoKSB7XG4gICAgcmV0dXJuICcvYXBpL3BhZ2VuZXdlci8nO1xufVxuXG5mdW5jdGlvbiBnZXRDcmVhdGVSZWFjdGlvblVybCgpIHtcbiAgICByZXR1cm4gJy9hcGkvdGFnL2NyZWF0ZS8nO1xufVxuXG5mdW5jdGlvbiBnZXRDcmVhdGVDb21tZW50VXJsKCkge1xuICAgIHJldHVybiAnL2FwaS9jb21tZW50L2NyZWF0ZS8nO1xufVxuXG5mdW5jdGlvbiBnZXRGZXRjaENvbW1lbnRVcmwoKSB7XG4gICAgcmV0dXJuICcvYXBpL2NvbW1lbnQvcmVwbGllcy8nO1xufVxuXG5mdW5jdGlvbiBnZXRGZXRjaENvbnRlbnRCb2RpZXNVcmwoKSB7XG4gICAgcmV0dXJuICcvYXBpL2NvbnRlbnQvYm9kaWVzLyc7XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVJbWFnZVVybCgkZWxlbWVudCwgZ3JvdXBTZXR0aW5ncykge1xuICAgIGlmIChncm91cFNldHRpbmdzLmxlZ2FjeUJlaGF2aW9yKCkpIHtcbiAgICAgICAgcmV0dXJuIGxlZ2FjeUNvbXB1dGVJbWFnZVVybCgkZWxlbWVudCk7XG4gICAgfVxuICAgIHZhciBjb250ZW50ID0gJGVsZW1lbnQuYXR0cignYW50LWl0ZW0tY29udGVudCcpIHx8ICRlbGVtZW50LmF0dHIoJ3NyYycpO1xuICAgIGlmIChjb250ZW50ICYmIGNvbnRlbnQuaW5kZXhPZignLy8nKSAhPT0gMCAmJiBjb250ZW50LmluZGV4T2YoJ2h0dHAnKSAhPT0gMCkgeyAvLyBwcm90b2NvbC1yZWxhdGl2ZSBvciBhYnNvbHV0ZSB1cmwsIGUuZy4gLy9kb21haW4uY29tL2Zvby9iYXIucG5nIG9yIGh0dHA6Ly9kb21haW4uY29tL2Zvby9iYXIvcG5nXG4gICAgICAgIGlmIChjb250ZW50LmluZGV4T2YoJy8nKSA9PT0gMCkgeyAvLyBkb21haW4tcmVsYXRpdmUgdXJsLCBlLmcuIC9mb28vYmFyLnBuZyA9PiBkb21haW4uY29tL2Zvby9iYXIucG5nXG4gICAgICAgICAgICBjb250ZW50ID0gd2luZG93LmxvY2F0aW9uLm9yaWdpbiArIGNvbnRlbnQ7XG4gICAgICAgIH0gZWxzZSB7IC8vIHBhdGgtcmVsYXRpdmUgdXJsLCBlLmcuIGJhci5wbmcgPT4gZG9tYWluLmNvbS9iYXovYmFyLnBuZ1xuICAgICAgICAgICAgdmFyIHBhdGggPSB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWU7XG4gICAgICAgICAgICB2YXIgaW5kZXggPSBwYXRoLmxhc3RJbmRleE9mKCcvJykgKyAxO1xuICAgICAgICAgICAgaWYgKHBhdGgubGVuZ3RoID4gaW5kZXgpIHtcbiAgICAgICAgICAgICAgICBwYXRoID0gcGF0aC5zdWJzdHJpbmcoMCwgaW5kZXgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29udGVudCA9IHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4gKyBwYXRoICsgY29udGVudDtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gY29udGVudDtcbn1cblxuLy8gTGVnYWN5IGltcGxlbWVudGF0aW9uIHdoaWNoIG1haW50YWlucyB0aGUgb2xkIGJlaGF2aW9yIG9mIGVuZ2FnZV9mdWxsXG4vLyBUaGlzIGNvZGUgaXMgd3JvbmcgZm9yIFVSTHMgdGhhdCBzdGFydCB3aXRoIFwiLy9cIi4gSXQgYWxzbyBnaXZlcyBwcmVjZWRlbmNlIHRvIHRoZSBzcmMgYXR0IGluc3RlYWQgb2YgYW50LWl0ZW0tY29udGVudFxuZnVuY3Rpb24gbGVnYWN5Q29tcHV0ZUltYWdlVXJsKCRlbGVtZW50KSB7XG4gICAgdmFyIGNvbnRlbnQgPSAkZWxlbWVudC5hdHRyKCdzcmMnKSB8fCAkZWxlbWVudC5hdHRyKCdhbnQtaXRlbS1jb250ZW50Jyk7XG4gICAgaWYgKGNvbnRlbnQpIHtcbiAgICAgICAgaWYgKGNvbnRlbnQuaW5kZXhPZignLycpID09PSAwKSB7XG4gICAgICAgICAgICBjb250ZW50ID0gd2luZG93LmxvY2F0aW9uLm9yaWdpbiArIGNvbnRlbnQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvbnRlbnQuaW5kZXhPZignaHR0cCcpICE9PSAwKSB7XG4gICAgICAgICAgICBjb250ZW50ID0gd2luZG93LmxvY2F0aW9uLm9yaWdpbiArIHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZSArIGNvbnRlbnQ7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGNvbnRlbnQ7XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVNZWRpYVVybCgkZWxlbWVudCwgZ3JvdXBTZXR0aW5ncykge1xuICAgIGlmIChncm91cFNldHRpbmdzLmxlZ2FjeUJlaGF2aW9yKCkpIHtcbiAgICAgICAgcmV0dXJuIGxlZ2FjeUNvbXB1dGVNZWRpYVVybCgkZWxlbWVudCk7XG4gICAgfVxuICAgIHZhciBjb250ZW50ID0gJGVsZW1lbnQuYXR0cignYW50LWl0ZW0tY29udGVudCcpIHx8ICRlbGVtZW50LmF0dHIoJ3NyYycpIHx8ICRlbGVtZW50LmF0dHIoJ2RhdGEnKTtcbiAgICBpZiAoY29udGVudCAmJiBjb250ZW50LmluZGV4T2YoJy8vJykgIT09IDAgJiYgY29udGVudC5pbmRleE9mKCdodHRwJykgIT09IDApIHsgLy8gcHJvdG9jb2wtcmVsYXRpdmUgb3IgYWJzb2x1dGUgdXJsLCBlLmcuIC8vZG9tYWluLmNvbS9mb28vYmFyLnBuZyBvciBodHRwOi8vZG9tYWluLmNvbS9mb28vYmFyL3BuZ1xuICAgICAgICBpZiAoY29udGVudC5pbmRleE9mKCcvJykgPT09IDApIHsgLy8gZG9tYWluLXJlbGF0aXZlIHVybCwgZS5nLiAvZm9vL2Jhci5wbmcgPT4gZG9tYWluLmNvbS9mb28vYmFyLnBuZ1xuICAgICAgICAgICAgY29udGVudCA9IHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4gKyBjb250ZW50O1xuICAgICAgICB9IGVsc2UgeyAvLyBwYXRoLXJlbGF0aXZlIHVybCwgZS5nLiBiYXIucG5nID0+IGRvbWFpbi5jb20vYmF6L2Jhci5wbmdcbiAgICAgICAgICAgIHZhciBwYXRoID0gd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lO1xuICAgICAgICAgICAgdmFyIGluZGV4ID0gcGF0aC5sYXN0SW5kZXhPZignLycpICsgMTtcbiAgICAgICAgICAgIGlmIChwYXRoLmxlbmd0aCA+IGluZGV4KSB7XG4gICAgICAgICAgICAgICAgcGF0aCA9IHBhdGguc3Vic3RyaW5nKDAsIGluZGV4KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnRlbnQgPSB3aW5kb3cubG9jYXRpb24ub3JpZ2luICsgcGF0aCArIGNvbnRlbnQ7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGNvbnRlbnQ7XG59XG5cbi8vIExlZ2FjeSBpbXBsZW1lbnRhdGlvbiB3aGljaCBtYWludGFpbnMgdGhlIG9sZCBiZWhhdmlvciBvZiBlbmdhZ2VfZnVsbFxuLy8gVGhpcyBjb2RlIGlzIHdyb25nIGZvciBVUkxzIHRoYXQgc3RhcnQgd2l0aCBcIi8vXCIuIEl0IGFsc28gZ2l2ZXMgcHJlY2VkZW5jZSB0byB0aGUgc3JjIGF0dCBpbnN0ZWFkIG9mIGFudC1pdGVtLWNvbnRlbnRcbmZ1bmN0aW9uIGxlZ2FjeUNvbXB1dGVNZWRpYVVybCgkZWxlbWVudCkge1xuICAgIHZhciBjb250ZW50ID0gJGVsZW1lbnQuYXR0cignYW50LWl0ZW0tY29udGVudCcpIHx8ICRlbGVtZW50LmF0dHIoJ3NyYycpIHx8ICRlbGVtZW50LmF0dHIoJ2RhdGEnKSB8fCAnJztcbiAgICBpZiAoY29udGVudCkge1xuICAgICAgICBpZiAoY29udGVudC5pbmRleE9mKCcvJykgPT09IDApIHtcbiAgICAgICAgICAgIGNvbnRlbnQgPSB3aW5kb3cubG9jYXRpb24ub3JpZ2luICsgY29udGVudDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY29udGVudC5pbmRleE9mKCdodHRwJykgIT09IDApIHtcbiAgICAgICAgICAgIGNvbnRlbnQgPSB3aW5kb3cubG9jYXRpb24ub3JpZ2luICsgd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lICsgY29udGVudDtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gY29udGVudDtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGFudGVubmFIb21lOiBhbnRlbm5hSG9tZSxcbiAgICBncm91cFNldHRpbmdzVXJsOiBnZXRHcm91cFNldHRpbmdzVXJsLFxuICAgIHBhZ2VEYXRhVXJsOiBnZXRQYWdlRGF0YVVybCxcbiAgICBjcmVhdGVSZWFjdGlvblVybDogZ2V0Q3JlYXRlUmVhY3Rpb25VcmwsXG4gICAgY3JlYXRlQ29tbWVudFVybDogZ2V0Q3JlYXRlQ29tbWVudFVybCxcbiAgICBmZXRjaENvbW1lbnRVcmw6IGdldEZldGNoQ29tbWVudFVybCxcbiAgICBmZXRjaENvbnRlbnRCb2RpZXNVcmw6IGdldEZldGNoQ29udGVudEJvZGllc1VybCxcbiAgICBjb21wdXRlSW1hZ2VVcmw6IGNvbXB1dGVJbWFnZVVybCxcbiAgICBjb21wdXRlTWVkaWFVcmw6IGNvbXB1dGVNZWRpYVVybFxufTsiLCJ2YXIgQXBwTW9kZSA9IHJlcXVpcmUoJy4vYXBwLW1vZGUnKTtcblxuLy8gVE9ETzogRmlndXJlIG91dCBob3cgbWFueSBkaWZmZXJlbnQgZm9ybWF0cyBvZiB1c2VyIGRhdGEgd2UgaGF2ZSBhbmQgZWl0aGVyIHVuaWZ5IHRoZW0gb3IgcHJvdmlkZSBjbGVhclxuLy8gICAgICAgQVBJIGhlcmUgdG8gdHJhbnNsYXRlIGVhY2ggdmFyaWF0aW9uIGludG8gc29tZXRoaW5nIHN0YW5kYXJkIGZvciB0aGUgY2xpZW50LlxuLy8gVE9ETzogSGF2ZSBYRE1DbGllbnQgcGFzcyB0aHJvdWdoIHRoaXMgbW9kdWxlIGFzIHdlbGwuXG5mdW5jdGlvbiB1c2VyRnJvbUNvbW1lbnRKU09OKGpzb25Vc2VyLCBzb2NpYWxVc2VyKSB7IC8vIFRoaXMgZm9ybWF0IHdvcmtzIGZvciB0aGUgdXNlciByZXR1cm5lZCBmcm9tIC9hcGkvY29tbWVudHMvcmVwbGllc1xuICAgIHZhciB1c2VyID0ge307XG4gICAgaWYgKGpzb25Vc2VyLnVzZXJfaWQpIHtcbiAgICAgICAgdXNlci5pZCA9IGpzb25Vc2VyLnVzZXJfaWQ7XG4gICAgfVxuICAgIGlmIChzb2NpYWxVc2VyKSB7XG4gICAgICAgIHVzZXIuaW1hZ2VVUkwgPSBzb2NpYWxVc2VyLmltZ191cmw7XG4gICAgICAgIHVzZXIubmFtZSA9IHNvY2lhbFVzZXIuZnVsbF9uYW1lO1xuICAgIH1cbiAgICBpZiAoIXVzZXIubmFtZSkge1xuICAgICAgICB1c2VyLm5hbWUgPSBqc29uVXNlci5maXJzdF9uYW1lID8gKGpzb25Vc2VyLmZpcnN0X25hbWUgKyAnICcgKyBqc29uVXNlci5sYXN0X25hbWUpIDogJ0Fub255bW91cyc7XG4gICAgfVxuICAgIGlmICghdXNlci5pbWFnZVVSTCkge1xuICAgICAgICB1c2VyLmltYWdlVVJMID0gYW5vbnltb3VzSW1hZ2VVUkwoKVxuICAgIH1cbiAgICByZXR1cm4gdXNlcjtcbn1cblxuXG4vLyBUT0RPOiBSZXZpc2l0IHRoZSB1c2VyIHRoYXQgd2UgcGFzcyBiYWNrIGZvciBuZXcgY29tbWVudHMuIE9wdGlvbnMgYXJlOlxuLy8gICAgICAgMS4gVXNlIHRoZSBsb2dnZWQgaW4gdXNlciwgYXNzdW1pbmcgd2UgYWxyZWFkeSBoYXZlIG9uZSBpbiBoYW5kIHZpYSBYRE0uXG4vLyAgICAgICAyLiBVc2UgYSBnZW5lcmljIFwieW91XCIgcmVwcmVzZW50YXRpb24gbGlrZSB3ZSdyZSBkb2luZyBub3cuXG4vLyAgICAgICAzLiBEb24ndCBzaG93IGFueSBpbmRpY2F0aW9uIG9mIHRoZSB1c2VyLiBKdXN0IHNob3cgdGhlIGNvbW1lbnQuXG4vLyAgICAgICBGb3Igbm93LCB0aGlzIGlzIGp1c3QgZ2l2aW5nIHVzIHNvbWUgbm90aW9uIG9mIHVzZXIgd2l0aG91dCBhIHJvdW5kIHRyaXAuXG5mdW5jdGlvbiBvcHRpbWlzdGljVXNlcigpIHtcbiAgICB2YXIgdXNlciA9IHtcbiAgICAgICAgbmFtZTogJ1lvdScsXG4gICAgICAgIGltYWdlVVJMOiBhbm9ueW1vdXNJbWFnZVVSTCgpXG4gICAgfTtcbiAgICByZXR1cm4gdXNlcjtcbn1cblxuZnVuY3Rpb24gYW5vbnltb3VzSW1hZ2VVUkwoKSB7XG4gICAgcmV0dXJuIEFwcE1vZGUub2ZmbGluZSA/ICcvc3RhdGljL3dpZGdldC9pbWFnZXMvYW5vbnltb3VzcGxvZGUucG5nJyA6ICdodHRwOi8vczMuYW1hem9uYXdzLmNvbS9yZWFkcmJvYXJkL3dpZGdldC9pbWFnZXMvYW5vbnltb3VzcGxvZGUucG5nJztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgZnJvbUNvbW1lbnRKU09OOiB1c2VyRnJvbUNvbW1lbnRKU09OLFxuICAgIG9wdGltaXN0aWNVc2VyOiBvcHRpbWlzdGljVXNlclxufTsiLCJ2YXIgaWQgPSAnYW50ZW5uYS13aWRnZXQtYnVja2V0JztcblxuZnVuY3Rpb24gZ2V0V2lkZ2V0QnVja2V0KCkge1xuICAgIHZhciBidWNrZXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7XG4gICAgaWYgKCFidWNrZXQpIHtcbiAgICAgICAgYnVja2V0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIGJ1Y2tldC5zZXRBdHRyaWJ1dGUoJ2lkJywgaWQpO1xuICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGJ1Y2tldCk7XG4gICAgfVxuICAgIHJldHVybiBidWNrZXQ7XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBnZXQ6IGdldFdpZGdldEJ1Y2tldCxcbiAgICBzZWxlY3RvcjogZnVuY3Rpb24oKSB7IHJldHVybiAnIycgKyBpZDsgfVxufTsiLCJcbnZhciBVUkxzID0gcmVxdWlyZSgnLi91cmxzJyk7XG5cbi8vIFJlZ2lzdGVyIG91cnNlbHZlcyB0byBoZWFyIG1lc3NhZ2VzXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcIm1lc3NhZ2VcIiwgcmVjZWl2ZU1lc3NhZ2UsIGZhbHNlKTtcblxudmFyIGNhbGxiYWNrcyA9IHsgJ3hkbSBsb2FkZWQnOiB4ZG1Mb2FkZWQgfTtcbnZhciBjYWNoZSA9IHt9O1xuXG52YXIgaXNYRE1Mb2FkZWQgPSBmYWxzZTtcbi8vIFRoZSBpbml0aWFsIG1lc3NhZ2UgdGhhdCBYRE0gc2VuZHMgb3V0IHdoZW4gaXQgbG9hZHNcbmZ1bmN0aW9uIHhkbUxvYWRlZChkYXRhKSB7XG4gICAgaXNYRE1Mb2FkZWQgPSB0cnVlO1xufVxuXG5mdW5jdGlvbiBnZXRVc2VyKGNhbGxiYWNrKSB7XG4gICAgdmFyIG1lc3NhZ2UgPSAnZ2V0VXNlcic7XG4gICAgcG9zdE1lc3NhZ2UobWVzc2FnZSwgJ3JldHVybmluZ191c2VyJywgY2FsbGJhY2ssIHZhbGlkQ2FjaGVFbnRyeSk7XG5cbiAgICBmdW5jdGlvbiB2YWxpZENhY2hlRW50cnkocmVzcG9uc2UpIHtcbiAgICAgICAgdmFyIHVzZXJJbmZvID0gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgcmV0dXJuIHVzZXJJbmZvICYmIHVzZXJJbmZvLmFudF90b2tlbiAmJiB1c2VySW5mby51c2VyX2lkOyAvLyBUT0RPICYmIHVzZXJJbmZvLnVzZXJfdHlwZSAmJiBzb2NpYWxfdXNlciwgZXRjLj9cbiAgICB9XG59XG5cbmZ1bmN0aW9uIHJlY2VpdmVNZXNzYWdlKGV2ZW50KSB7XG4gICAgdmFyIGV2ZW50T3JpZ2luID0gZXZlbnQub3JpZ2luO1xuICAgIGlmIChldmVudE9yaWdpbiA9PT0gVVJMcy5hbnRlbm5hSG9tZSgpKSB7XG4gICAgICAgIHZhciByZXNwb25zZSA9IEpTT04ucGFyc2UoZXZlbnQuZGF0YSk7XG4gICAgICAgIC8vIFRPRE86IFRoZSBldmVudC5zb3VyY2UgcHJvcGVydHkgZ2l2ZXMgdXMgdGhlIHNvdXJjZSB3aW5kb3cgb2YgdGhlIG1lc3NhZ2UgYW5kIGN1cnJlbnRseSB0aGUgWERNIGZyYW1lIGZpcmVzIG91dFxuICAgICAgICAvLyBldmVudHMgdGhhdCB3ZSByZWNlaXZlIGJlZm9yZSB3ZSBldmVyIHRyeSB0byBwb3N0IGFueXRoaW5nLiBTbyB3ZSAqY291bGQqIGhvbGQgb250byB0aGUgd2luZG93IGhlcmUgYW5kIHVzZSBpdFxuICAgICAgICAvLyBmb3IgcG9zdGluZyBtZXNzYWdlcyByYXRoZXIgdGhhbiBsb29raW5nIGZvciB0aGUgWERNIGZyYW1lIG91cnNlbHZlcy4gTmVlZCB0byBsb29rIGF0IHdoaWNoIGV2ZW50cyB0aGUgWERNIGZyYW1lXG4gICAgICAgIC8vIGZpcmVzIG91dCB0byBhbGwgd2luZG93cyBiZWZvcmUgYmVpbmcgYXNrZWQuIEN1cnJlbnRseSwgaXQncyBtb3JlIHRoYW4gXCJ4ZG0gbG9hZGVkXCIuIFdoeT9cbiAgICAgICAgLy92YXIgc291cmNlV2luZG93ID0gZXZlbnQuc291cmNlO1xuXG4gICAgICAgIHZhciBjYWxsYmFja0tleSA9IHJlc3BvbnNlLnN0YXR1czsgLy8gVE9ETzogY2hhbmdlIHRoZSBuYW1lIG9mIHRoaXMgcHJvcGVydHkgaW4geGRtLmh0bWxcbiAgICAgICAgY2FjaGVbY2FsbGJhY2tLZXldID0gcmVzcG9uc2U7XG4gICAgICAgIHZhciBjYWxsYmFjayA9IGNhbGxiYWNrc1tjYWxsYmFja0tleV07XG4gICAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICAgICAgY2FsbGJhY2socmVzcG9uc2UpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBwb3N0TWVzc2FnZShtZXNzYWdlLCBjYWxsYmFja0tleSwgY2FsbGJhY2ssIHZhbGlkQ2FjaGVFbnRyeSkge1xuXG4gICAgdmFyIHRhcmdldE9yaWdpbiA9IFVSTHMuYW50ZW5uYUhvbWUoKTtcbiAgICBjYWxsYmFja3NbY2FsbGJhY2tLZXldID0gY2FsbGJhY2s7XG5cbiAgICBpZiAoaXNYRE1Mb2FkZWQpIHtcbiAgICAgICAgdmFyIGNhY2hlZFJlc3BvbnNlID0gY2FjaGVbY2FsbGJhY2tLZXldO1xuICAgICAgICBpZiAoY2FjaGVkUmVzcG9uc2UgIT09IHVuZGVmaW5lZCAmJiB2YWxpZENhY2hlRW50cnkgJiYgdmFsaWRDYWNoZUVudHJ5KGNhY2hlW2NhbGxiYWNrS2V5XSkpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKGNhY2hlW2NhbGxiYWNrS2V5XSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgeGRtRnJhbWUgPSBnZXRYRE1GcmFtZSgpO1xuICAgICAgICAgICAgaWYgKHhkbUZyYW1lKSB7XG4gICAgICAgICAgICAgICAgeGRtRnJhbWUucG9zdE1lc3NhZ2UobWVzc2FnZSwgdGFyZ2V0T3JpZ2luKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gZ2V0WERNRnJhbWUoKSB7XG4gICAgLy8gVE9ETzogSXMgdGhpcyBhIHNlY3VyaXR5IHByb2JsZW0/IFdoYXQgcHJldmVudHMgc29tZW9uZSBmcm9tIHVzaW5nIHRoaXMgc2FtZSBuYW1lIGFuZCBpbnRlcmNlcHRpbmcgb3VyIG1lc3NhZ2VzP1xuICAgIHJldHVybiB3aW5kb3cuZnJhbWVzWydhbnQteGRtLWhpZGRlbiddO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBnZXRVc2VyOiBnZXRVc2VyXG59OyIsInZhciAkOyByZXF1aXJlKCcuL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIFVSTHMgPSByZXF1aXJlKCcuL3VybHMnKTtcbnZhciBXaWRnZXRCdWNrZXQgPSByZXF1aXJlKCcuL3dpZGdldC1idWNrZXQnKTtcblxuZnVuY3Rpb24gY3JlYXRlWERNZnJhbWUoZ3JvdXBJZCkge1xuICAgIC8vQU5ULnNlc3Npb24ucmVjZWl2ZU1lc3NhZ2Uoe30sIGZ1bmN0aW9uKCkge1xuICAgIC8vICAgIEFOVC51dGlsLnVzZXJMb2dpblN0YXRlKCk7XG4gICAgLy99KTtcblxuXG4gICAgdmFyIGlmcmFtZVVybCA9IFVSTHMuYW50ZW5uYUhvbWUoKSArIFwiL3N0YXRpYy93aWRnZXQtbmV3L3hkbS94ZG0uaHRtbFwiLFxuICAgIHBhcmVudFVybCA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmLFxuICAgIHBhcmVudEhvc3QgPSB3aW5kb3cubG9jYXRpb24ucHJvdG9jb2wgKyBcIi8vXCIgKyB3aW5kb3cubG9jYXRpb24uaG9zdCxcbiAgICAvLyBUT0RPOiBSZXN0b3JlIHRoZSBib29rbWFya2xldCBhdHRyaWJ1dGUgb24gdGhlIGlGcmFtZT9cbiAgICAvL2Jvb2ttYXJrbGV0ID0gKCBBTlQuZW5nYWdlU2NyaXB0UGFyYW1zLmJvb2ttYXJrbGV0ICkgPyBcImJvb2ttYXJrbGV0PXRydWVcIjpcIlwiLFxuICAgIGJvb2ttYXJrbGV0ID0gXCJcIixcbiAgICAvLyBUT0RPOiBSZXN0b3JlIHRoZSBncm91cE5hbWUgYXR0cmlidXRlLiAoV2hhdCBpcyBpdCBmb3I/KVxuICAgICR4ZG1JZnJhbWUgPSAkKCc8aWZyYW1lIGlkPVwiYW50LXhkbS1oaWRkZW5cIiBuYW1lPVwiYW50LXhkbS1oaWRkZW5cIiBzcmM9XCInICsgaWZyYW1lVXJsICsgJz9wYXJlbnRVcmw9JyArIHBhcmVudFVybCArICcmcGFyZW50SG9zdD0nICsgcGFyZW50SG9zdCArICcmZ3JvdXBfaWQ9Jytncm91cElkKydcIiB3aWR0aD1cIjFcIiBoZWlnaHQ9XCIxXCIgc3R5bGU9XCJwb3NpdGlvbjphYnNvbHV0ZTt0b3A6LTEwMDBweDtsZWZ0Oi0xMDAwcHg7XCIgLz4nKTtcbiAgICAvLyR4ZG1JZnJhbWUgPSAkKCc8aWZyYW1lIGlkPVwiYW50LXhkbS1oaWRkZW5cIiBuYW1lPVwiYW50LXhkbS1oaWRkZW5cIiBzcmM9XCInICsgaWZyYW1lVXJsICsgJz9wYXJlbnRVcmw9JyArIHBhcmVudFVybCArICcmcGFyZW50SG9zdD0nICsgcGFyZW50SG9zdCArICcmZ3JvdXBfaWQ9Jytncm91cElkKycmZ3JvdXBfbmFtZT0nK2VuY29kZVVSSUNvbXBvbmVudChncm91cE5hbWUpKycmJytib29rbWFya2xldCsnXCIgd2lkdGg9XCIxXCIgaGVpZ2h0PVwiMVwiIHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGU7dG9wOi0xMDAwcHg7bGVmdDotMTAwMHB4O1wiIC8+Jyk7XG4gICAgJChXaWRnZXRCdWNrZXQuZ2V0KCkpLmFwcGVuZCggJHhkbUlmcmFtZSApO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGVYRE1mcmFtZTogY3JlYXRlWERNZnJhbWVcbn07IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEgYW50ZW5uYS1hdXRvLWN0YVwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1hdXRvLWN0YS1pbm5lclwiLFwiYW50LWN0YS1mb3JcIjpbe1widFwiOjIsXCJyXCI6XCJhbnRJdGVtSWRcIn1dfSxcImZcIjpbe1widFwiOjgsXCJyXCI6XCJsb2dvXCJ9LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWF1dG8tY3RhLWxhYmVsXCIsXCJhbnQtcmVhY3Rpb25zLWxhYmVsLWZvclwiOlt7XCJ0XCI6MixcInJcIjpcImFudEl0ZW1JZFwifV19fV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiY29tcHV0ZUxhYmVsXCIsXCJjb250YWluZXJEYXRhLnJlYWN0aW9uVG90YWxcIl0sXCJzXCI6XCJfMChfMSlcIn19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb21tZW50LWFyZWFcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY29tbWVudC13aWRnZXRzXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInRleHRhcmVhXCIsXCJ2XCI6e1wiaW5wdXRcIjpcImlucHV0Y2hhbmdlZFwifSxcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb21tZW50LWlucHV0XCIsXCJwbGFjZWhvbGRlclwiOlwiQWRkIGNvbW1lbnRzIG9yICNoYXNodGFnc1wiLFwibWF4bGVuZ3RoXCI6XCI1MDBcIn19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY29tbWVudC1mb290ZXJcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWNvbW1lbnQtbGltaXRcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWNvbW1lbnQtY291bnRcIn0sXCJmXCI6W1wiNTAwXCJdfSxcIiBjaGFyYWN0ZXJzIGxlZnRcIl19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiYnV0dG9uXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY29tbWVudC1zdWJtaXRcIn0sXCJ2XCI6e1wiY2xpY2tcIjpcImFkZGNvbW1lbnRcIn0sXCJmXCI6W1wiQ29tbWVudFwiXX1dfV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY29tbWVudC13YWl0aW5nXCJ9LFwiZlwiOltcIi4uLlwiXX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb21tZW50LXJlY2VpdmVkXCJ9LFwiZlwiOltcIlRoYW5rcyBmb3IgeW91ciBjb21tZW50LlwiXX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcGFnZSBhbnRlbm5hLWNvbW1lbnRzLXBhZ2VcIn0sXCJvXCI6XCJjc3NyZXNldFwiLFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWJvZHlcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJ2XCI6e1wiY2xpY2tcIjpcImNsb3Nld2luZG93XCJ9LFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWNvbW1lbnRzLWNsb3NlXCJ9LFwiZlwiOltcIkNsb3NlIFhcIl19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY29tbWVudHMtaGVhZGVyXCJ9LFwiZlwiOltcIihcIix7XCJ0XCI6MixcInJcIjpcImNvbW1lbnRzLmxlbmd0aFwifSxcIikgQ29tbWVudHM6XCJdfSxcIiBcIix7XCJ0XCI6NCxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOltcImFudGVubmEtY29tbWVudC1lbnRyeSBcIix7XCJ0XCI6NCxcImZcIjpbXCJhbnRlbm5hLWNvbW1lbnQtbmV3XCJdLFwiblwiOjUwLFwiclwiOlwiLi9uZXdcIn1dfSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJ0YWJsZVwiLFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInRyXCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwidGRcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb21tZW50LWNlbGxcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiaW1nXCIsXCJhXCI6e1wic3JjXCI6W3tcInRcIjoyLFwiclwiOlwiLi91c2VyLmltYWdlVVJMXCJ9XX19XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJ0ZFwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWNvbW1lbnQtYXV0aG9yXCJ9LFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcIi4vdXNlci5uYW1lXCJ9XX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcInRyXCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwidGRcIixcImZcIjpbXX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJ0ZFwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWNvbW1lbnQtdGV4dFwifSxcImZcIjpbe1widFwiOjIsXCJyXCI6XCIuL3RleHRcIn1dfV19XX1dfV0sXCJpXCI6XCJpbmRleFwiLFwiclwiOlwiY29tbWVudHNcIn0sXCIgXCIse1widFwiOjgsXCJyXCI6XCJjb21tZW50QXJlYVwifV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXBhZ2UgYW50ZW5uYS1jb25maXJtYXRpb24tcGFnZVwifSxcIm9cIjpcImNzc3Jlc2V0XCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtYm9keVwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb21tZW50LXJlYWN0aW9uXCJ9LFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcInRleHRcIn1dfSxcIiBcIix7XCJ0XCI6OCxcInJcIjpcImNvbW1lbnRBcmVhXCJ9XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1mb290ZXIgYW50ZW5uYS1jb25maXJtLWZvb3RlclwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJ2XCI6e1wiY2xpY2tcIjpcInNoYXJlXCJ9LFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXNoYXJlXCJ9LFwiZlwiOltcIlNoYXJlIHlvdXIgcmVhY3Rpb246IFwiLHtcInRcIjo4LFwiclwiOlwiZmFjZWJvb2tJY29uXCJ9LHtcInRcIjo4LFwiclwiOlwidHdpdHRlckljb25cIn1dfV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwidlwiOntcImtleWRvd25cIjpcInBhZ2VrZXlkb3duXCJ9LFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXBhZ2UgYW50ZW5uYS1kZWZhdWx0cy1wYWdlXCIsXCJ0YWJpbmRleFwiOlwiMFwifSxcIm9cIjpcImNzc3Jlc2V0XCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtYm9keVwifSxcImZcIjpbe1widFwiOjQsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJ2XCI6e1wiY2xpY2tcIjpcIm5ld3JlYWN0aW9uXCJ9LFwiYVwiOntcImNsYXNzXCI6W1wiYW50ZW5uYS1yZWFjdGlvbiBcIix7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZGVmYXVsdExheW91dENsYXNzXCIsXCJpbmRleFwiXSxcInNcIjpcIl8wKF8xKVwifX1dLFwic3R5bGVcIjpbXCJiYWNrZ3JvdW5kLWNvbG9yOlwiLHtcInRcIjoyLFwieFwiOntcInJcIjpbXCJkZWZhdWx0QmFja2dyb3VuZENvbG9yXCIsXCJpbmRleFwiXSxcInNcIjpcIl8wKF8xKVwifX1dfSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1yZWFjdGlvbi1ib3hcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcmVhY3Rpb24tdGV4dFwifSxcIm9cIjpcInNpemV0b2ZpdFwiLFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcIi4vdGV4dFwifV19XX1dfV0sXCJpXCI6XCJpbmRleFwiLFwiclwiOlwiZGVmYXVsdFJlYWN0aW9uc1wifV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtZm9vdGVyIGFudGVubmEtZGVmYXVsdHMtZm9vdGVyXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImlucHV0XCIsXCJ2XCI6e1wiZm9jdXNcIjpcImN1c3RvbWZvY3VzXCIsXCJrZXlkb3duXCI6XCJpbnB1dGtleWRvd25cIixcImJsdXJcIjpcImN1c3RvbWJsdXJcIn0sXCJhXCI6e1widmFsdWVcIjpcIisgQWRkIFlvdXIgT3duXCIsXCJtYXhsZW5ndGhcIjpcIjI1XCJ9fSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImJ1dHRvblwiLFwidlwiOntcImNsaWNrXCI6XCJhZGRjdXN0b21cIn0sXCJmXCI6W1wib2tcIl19XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcGFnZSBhbnRlbm5hLWxvY2F0aW9ucy1wYWdlXCJ9LFwib1wiOlwiY3NzcmVzZXRcIixcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1ib2R5XCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwidlwiOntcImNsaWNrXCI6XCJjbG9zZXdpbmRvd1wifSxcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1sb2NhdGlvbnMtY2xvc2VcIn0sXCJmXCI6W1wiQ2xvc2UgWFwiXX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJ0YWJsZVwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxvY2F0aW9ucy10YWJsZVwifSxcImZcIjpbe1widFwiOjQsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwidHJcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1sb2NhdGlvbnMtY29udGVudC1yb3dcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwidGRcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1sb2NhdGlvbnMtY291bnQtY2VsbFwifSxcImZcIjpbe1widFwiOjMsXCJ4XCI6e1wiclwiOltcImNvbnRlbnRDb3VudExhYmVsXCIsXCJwYWdlUmVhY3Rpb25Db3VudFwiXSxcInNcIjpcIl8wKF8xKVwifX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcInRkXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtbG9jYXRpb25zLXBhZ2UtYm9keVwifSxcImZcIjpbXCJUbyB0aGlzIHdob2xlIHBhZ2UuXCJdfV19XSxcIm5cIjo1MCxcInJcIjpcInBhZ2VSZWFjdGlvbkNvdW50XCJ9LFwiIFwiLHtcInRcIjo0LFwiZlwiOlt7XCJ0XCI6NCxcImZcIjpbXCIgXCIse1widFwiOjcsXCJlXCI6XCJ0clwiLFwidlwiOntcImNsaWNrXCI6XCJyZXZlYWxcIn0sXCJhXCI6e1wiY2xhc3NcIjpbXCJhbnRlbm5hLWxvY2F0aW9ucy1jb250ZW50LXJvdyBcIix7XCJ0XCI6NCxcImZcIjpbXCJhbnRlbm5hLWxvY2F0ZVwiXSxcIm5cIjo1MCxcInhcIjp7XCJyXCI6W1wiY2FuTG9jYXRlXCIsXCIuL2NvbnRhaW5lckhhc2hcIl0sXCJzXCI6XCJfMChfMSlcIn19XX0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwidGRcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1sb2NhdGlvbnMtY291bnQtY2VsbFwifSxcImZcIjpbe1widFwiOjMsXCJ4XCI6e1wiclwiOltcImNvbnRlbnRDb3VudExhYmVsXCIsXCIuL2NvdW50XCJdLFwic1wiOlwiXzAoXzEpXCJ9fV19LFwiIFwiLHtcInRcIjo0LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInRkXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtbG9jYXRpb25zLXRleHQtYm9keVwifSxcImZcIjpbe1widFwiOjIsXCJyXCI6XCIuL2JvZHlcIn1dfV0sXCJuXCI6NTAsXCJ4XCI6e1wiclwiOltcIi4va2luZFwiXSxcInNcIjpcIl8wPT09XFxcInR4dFxcXCJcIn19LHtcInRcIjo0LFwiblwiOjUxLFwiZlwiOlt7XCJ0XCI6NCxcIm5cIjo1MCxcInhcIjp7XCJyXCI6W1wiLi9raW5kXCJdLFwic1wiOlwiXzA9PT1cXFwiaW1nXFxcIlwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJ0ZFwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxvY2F0aW9ucy1pbWFnZS1ib2R5XCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImltZ1wiLFwiYVwiOntcInNyY1wiOlt7XCJ0XCI6MixcInJcIjpcIi4vYm9keVwifV19fV19XX0se1widFwiOjQsXCJuXCI6NTAsXCJ4XCI6e1wiclwiOltcIi4va2luZFwiXSxcInNcIjpcIiEoXzA9PT1cXFwiaW1nXFxcIilcIn0sXCJmXCI6W1wiIFwiLHtcInRcIjo3LFwiZVwiOlwidGRcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1sb2NhdGlvbnMtYm9keS1jZWxsXCJ9LFwiZlwiOltcIlRPRE86IFwiLHtcInRcIjoyLFwiclwiOlwiLi9raW5kXCJ9XX1dfV0sXCJ4XCI6e1wiclwiOltcIi4va2luZFwiXSxcInNcIjpcIl8wPT09XFxcInR4dFxcXCJcIn19XX1dLFwiblwiOjUwLFwieFwiOntcInJcIjpbXCIuL2tpbmRcIl0sXCJzXCI6XCJfMCE9PVxcXCJwYWdcXFwiXCJ9fV0sXCJpXCI6XCJpZFwiLFwiclwiOlwibG9jYXRpb25EYXRhXCJ9XX1dfV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtbG9nb1wifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJzdmdcIixcImZcIjpbe1widFwiOjcsXCJlXCI6XCJ1c2VcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1sb2dvLXBhdGhcIixcInhsaW5rOmhyZWZcIjpcIiNhbnRlbm5hLXN2Zy1sb2dvXCJ9fV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYSBhbnRlbm5hLW1lZGlhLWluZGljYXRvci13cmFwcGVyXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcIm9cIjpcImNzc3Jlc2V0XCIsXCJhXCI6e1wiY2xhc3NcIjpbXCJhbnRlbm5hIGFudGVubmEtbWVkaWEtaW5kaWNhdG9yLXdpZGdldCBcIix7XCJ0XCI6NCxcImZcIjpbXCJub3Rsb2FkZWRcIl0sXCJuXCI6NTEsXCJyXCI6XCJjb250YWluZXJEYXRhLmxvYWRlZFwifSxcIiBcIix7XCJ0XCI6NCxcImZcIjpbXCJoYXNyZWFjdGlvbnNcIl0sXCJuXCI6NTAsXCJ4XCI6e1wiclwiOltcImNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbFwiXSxcInNcIjpcIl8wPjBcIn19XX0sXCJtXCI6W3tcInRcIjoyLFwiclwiOlwiZXh0cmFBdHRyaWJ1dGVzXCJ9XSxcImZcIjpbe1widFwiOjgsXCJyXCI6XCJsb2dvXCJ9LFwiIFwiLHtcInRcIjo0LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1yZWFjdGlvbi10b3RhbFwifSxcImZcIjpbe1widFwiOjIsXCJyXCI6XCJjb250YWluZXJEYXRhLnJlYWN0aW9uVG90YWxcIn1dfV0sXCJuXCI6NTAsXCJyXCI6XCJjb250YWluZXJEYXRhLnJlYWN0aW9uVG90YWxcIn0se1widFwiOjQsXCJuXCI6NTEsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXJlYWN0aW9uLXByb21wdFwifSxcImZcIjpbXCJXaGF0IGRvIHlvdSB0aGluaz9cIl19XSxcInJcIjpcImNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbFwifV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXBvcHVwXCJ9LFwib1wiOlwiY3NzcmVzZXRcIixcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1wb3B1cC1ib2R5XCJ9LFwiZlwiOlt7XCJ0XCI6OCxcInJcIjpcImxvZ29cIn0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcG9wdXAtdGV4dFwifSxcImZcIjpbXCJXaGF0IGRvIHlvdSB0aGluaz9cIl19XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcGFnZSBhbnRlbm5hLXJlYWN0aW9ucy1wYWdlXCJ9LFwib1wiOlwiY3NzcmVzZXRcIixcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1ib2R5XCJ9LFwiZlwiOlt7XCJ0XCI6NCxcImZcIjpbe1widFwiOjQsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJ2XCI6e1wiY2xpY2tcIjpcInBsdXNvbmVcIixcIm1vdXNlZW50ZXJcIjpcImhpZ2hsaWdodFwiLFwibW91c2VsZWF2ZVwiOlwiY2xlYXJoaWdobGlnaHRzXCJ9LFwiYVwiOntcImNsYXNzXCI6W1wiYW50ZW5uYS1yZWFjdGlvbiBcIix7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wicmVhY3Rpb25zTGF5b3V0Q2xhc3NcIixcImluZGV4XCIsXCIuL2NvdW50XCJdLFwic1wiOlwiXzAoXzEsXzIpXCJ9fV0sXCJzdHlsZVwiOltcImJhY2tncm91bmQtY29sb3I6XCIse1widFwiOjIsXCJ4XCI6e1wiclwiOltcInJlYWN0aW9uc0JhY2tncm91bmRDb2xvclwiLFwiaW5kZXhcIl0sXCJzXCI6XCJfMChfMSlcIn19XX0sXCJmXCI6W1wiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcmVhY3Rpb24tYm94XCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXJlYWN0aW9uLXRleHRcIn0sXCJvXCI6XCJzaXpldG9maXRcIixcImZcIjpbe1widFwiOjIsXCJyXCI6XCIuL3RleHRcIn1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXJlYWN0aW9uLWNvdW50XCJ9LFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcIi4vY291bnRcIn1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXBsdXNvbmVcIn0sXCJmXCI6W1wiKzFcIl19LFwiIFwiLHtcInRcIjo0LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwidlwiOntcImNsaWNrXCI6XCJzaG93bG9jYXRpb25zXCJ9LFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXJlYWN0aW9uLWxvY2F0aW9uXCJ9LFwiZlwiOlt7XCJ0XCI6OCxcInJcIjpcImxvY2F0aW9uSWNvblwifV19XSxcIm5cIjo1MCxcInJcIjpcImlzU3VtbWFyeVwifSx7XCJ0XCI6NCxcIm5cIjo1MSxcImZcIjpbe1widFwiOjQsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJ2XCI6e1wiY2xpY2tcIjpcInNob3djb21tZW50c1wifSxcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1yZWFjdGlvbi1jb21tZW50cyBoYXNjb21tZW50c1wifSxcImZcIjpbe1widFwiOjgsXCJyXCI6XCJjb21tZW50c0ljb25cIn0sXCIgXCIse1widFwiOjIsXCJyXCI6XCIuL2NvbW1lbnRDb3VudFwifV19XSxcIm5cIjo1MCxcInJcIjpcIi4vY29tbWVudENvdW50XCJ9LHtcInRcIjo0LFwiblwiOjUxLFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXJlYWN0aW9uLWNvbW1lbnRzXCJ9LFwiZlwiOlt7XCJ0XCI6OCxcInJcIjpcImNvbW1lbnRzSWNvblwifV19XSxcInJcIjpcIi4vY29tbWVudENvdW50XCJ9XSxcInJcIjpcImlzU3VtbWFyeVwifV19XX1dLFwiaVwiOlwiaW5kZXhcIixcInJcIjpcInJlYWN0aW9uc1wifV0sXCJuXCI6NTAsXCJyXCI6XCJyZWFjdGlvbnNcIn1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWZvb3RlciBhbnRlbm5hLXJlYWN0aW9ucy1mb290ZXJcIn0sXCJmXCI6W3tcInRcIjo0LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcInZcIjp7XCJjbGlja1wiOlwic2hvd2RlZmF1bHRcIn0sXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtdGhpbmtcIn0sXCJmXCI6W1wiV2hhdCBkbyB5b3UgdGhpbms/XCJdfV0sXCJuXCI6NTAsXCJyXCI6XCJyZWFjdGlvbnNcIn0se1widFwiOjQsXCJuXCI6NTEsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLW5vLXJlYWN0aW9uc1wifSxcImZcIjpbXCJObyByZWFjdGlvbnMgeWV0IVwiXX1dLFwiclwiOlwicmVhY3Rpb25zXCJ9XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEgYW50ZW5uYS1yZWFjdGlvbnMtd2lkZ2V0XCIsXCJ0YWJpbmRleFwiOlwiMFwifSxcIm9cIjpcImNzc3Jlc2V0XCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtaGVhZGVyXCJ9LFwiZlwiOlt7XCJ0XCI6OCxcInJcIjpcImxvZ29cIn0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcmVhY3Rpb25zLXRpdGxlXCJ9LFwiZlwiOltcIlJlYWN0aW9uc1wiXX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXBhZ2UtY29udGFpbmVyXCJ9LFwiZlwiOltcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXByb2dyZXNzLXBhZ2UgYW50ZW5uYS1wYWdlXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWJvZHlcIn19XX1dfV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOltcImFudGVubmEgYW50LXN1bW1hcnktd2lkZ2V0IFwiLHtcInRcIjo0LFwiZlwiOltcIm5vdGxvYWRlZFwiXSxcIm5cIjo1MSxcInJcIjpcInN1bW1hcnlMb2FkZWRcIn1dfSxcIm9cIjpcImNzc3Jlc2V0XCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiYVwiLFwiYVwiOntcImhyZWZcIjpcImh0dHA6Ly93d3cuYW50ZW5uYS5pc1wiLFwidGFyZ2V0XCI6XCJfYmxhbmtcIn0sXCJmXCI6W3tcInRcIjo4LFwiclwiOlwibG9nb1wifV19LFwiIFwiLHtcInRcIjo0LFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcInN1bW1hcnlUb3RhbFwifV0sXCJuXCI6NTAsXCJ4XCI6e1wiclwiOltcInN1bW1hcnlUb3RhbFwiXSxcInNcIjpcIl8wPjBcIn19LFwiIFJlYWN0aW9uc1wiXX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb21tZW50c1wifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJzdmdcIixcImZcIjpbe1widFwiOjcsXCJlXCI6XCJ1c2VcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb21tZW50cy1wYXRoXCIsXCJ4bGluazpocmVmXCI6XCIjYW50ZW5uYS1zdmctY29tbWVudFwifX1dfV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtZmFjZWJvb2tcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3ZnXCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwidXNlXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtZmFjZWJvb2stcGF0aFwiLFwieGxpbms6aHJlZlwiOlwiI2FudGVubmEtc3ZnLWZhY2Vib29rXCJ9fV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1sb2NhdGlvblwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJzdmdcIixcImZcIjpbe1widFwiOjcsXCJlXCI6XCJ1c2VcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1sb2NhdGlvbi1wYXRoXCIsXCJ4bGluazpocmVmXCI6XCIjYW50ZW5uYS1zdmctc2VhcmNoXCJ9fV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS10d2l0dGVyXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInN2Z1wiLFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInVzZVwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXR3aXR0ZXItcGF0aFwiLFwieGxpbms6aHJlZlwiOlwiI2FudGVubmEtc3ZnLXR3aXR0ZXJcIn19XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwic3ZnXCIsXCJhXCI6e1wieG1sbnNcIjpcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIsXCJzdHlsZVwiOlwiZGlzcGxheTogbm9uZTtcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3ltYm9sXCIsXCJhXCI6e1wiaWRcIjpcImFudGVubmEtc3ZnLXR3aXR0ZXJcIixcInZpZXdCb3hcIjpcIjAgMCA1MTIgNTEyXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInBhdGhcIixcImFcIjp7XCJkXCI6XCJtNDUzIDEzNGMtMTQgNi0zMCAxMS00NiAxMmMxNi0xMCAyOS0yNSAzNS00NGMtMTUgOS0zMyAxNi01MSAxOWMtMTUtMTUtMzYtMjUtNTktMjVjLTQ1IDAtODEgMzYtODEgODFjMCA2IDEgMTIgMiAxOGMtNjctMy0xMjctMzUtMTY3LTg0Yy03IDEyLTExIDI1LTExIDQwYzAgMjggMTUgNTMgMzYgNjhjLTEzLTEtMjUtNC0zNi0xMWMwIDEgMCAxIDAgMmMwIDM5IDI4IDcxIDY1IDc5Yy03IDItMTQgMy0yMiAzYy01IDAtMTAtMS0xNS0yYzEwIDMyIDQwIDU2IDc2IDU2Yy0yOCAyMi02MyAzNS0xMDEgMzVjLTYgMC0xMyAwLTE5LTFjMzYgMjMgNzggMzYgMTI0IDM2YzE0OSAwIDIzMC0xMjMgMjMwLTIzMGMwLTMgMC03IDAtMTBjMTYtMTIgMjktMjYgNDAtNDJ6XCJ9fV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwic3ltYm9sXCIsXCJhXCI6e1wiaWRcIjpcImFudGVubmEtc3ZnLWZhY2Vib29rXCIsXCJ2aWV3Qm94XCI6XCIwIDAgNTEyIDUxMlwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJwYXRoXCIsXCJhXCI6e1wiZFwiOlwibTQyMCA3MmwtMzI4IDBjLTExIDAtMjAgOS0yMCAyMGwwIDMyOGMwIDExIDkgMjAgMjAgMjBsMTc3IDBsMC0xNDJsLTQ4IDBsMC01Nmw0OCAwbDAtNDFjMC00OCAyOS03NCA3MS03NGMyMCAwIDM4IDIgNDMgM2wwIDQ5bC0yOSAwYy0yMyAwLTI4IDExLTI4IDI3bDAgMzZsNTUgMGwtNyA1NmwtNDggMGwwIDE0Mmw5NCAwYzExIDAgMjAtOSAyMC0yMGwwLTMyOGMwLTExLTktMjAtMjAtMjB6XCJ9fV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwic3ltYm9sXCIsXCJhXCI6e1wiaWRcIjpcImFudGVubmEtc3ZnLWNvbW1lbnRcIixcInZpZXdCb3hcIjpcIjAgMCA1MTIgNTEyXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInBhdGhcIixcImFcIjp7XCJkXCI6XCJtNTEyIDI1NmMwIDMzLTExIDY0LTM0IDkyYy0yMyAyOC01NCA1MC05MyA2NmMtNDAgMTctODMgMjUtMTI5IDI1Yy0xMyAwLTI3LTEtNDEtMmMtMzggMzMtODIgNTYtMTMyIDY5Yy05IDItMjAgNC0zMiA2Yy00IDAtNyAwLTktM2MtMy0yLTQtNC01LThsMCAwYy0xLTEtMS0yIDAtNGMwLTEgMC0yIDAtMmMwLTEgMS0yIDItM2wxLTNjMCAwIDEtMSAyLTJjMi0yIDItMyAzLTNjMS0xIDQtNSA4LTEwYzUtNSA4LTggMTAtMTBjMi0zIDUtNiA5LTEyYzQtNSA3LTEwIDktMTRjMy01IDUtMTAgOC0xN2MzLTcgNS0xNCA4LTIyYy0zMC0xNy01NC0zOC03MS02M2MtMTctMjUtMjYtNTEtMjYtODBjMC0yNSA3LTQ4IDIwLTcxYzE0LTIzIDMyLTQyIDU1LTU4YzIzLTE3IDUwLTMwIDgyLTM5YzMxLTEwIDY0LTE1IDk5LTE1YzQ2IDAgODkgOCAxMjkgMjVjMzkgMTYgNzAgMzggOTMgNjZjMjMgMjggMzQgNTkgMzQgOTJ6XCJ9fV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwic3ltYm9sXCIsXCJhXCI6e1wiaWRcIjpcImFudGVubmEtc3ZnLXNlYXJjaFwiLFwidmlld0JveFwiOlwiMCAwIDUxMiA1MTJcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwicGF0aFwiLFwiYVwiOntcImRcIjpcIm0zNDcgMjM4YzAtMzYtMTItNjYtMzctOTFjLTI1LTI1LTU1LTM3LTkxLTM3Yy0zNSAwLTY1IDEyLTkwIDM3Yy0yNSAyNS0zOCA1NS0zOCA5MWMwIDM1IDEzIDY1IDM4IDkwYzI1IDI1IDU1IDM4IDkwIDM4YzM2IDAgNjYtMTMgOTEtMzhjMjUtMjUgMzctNTUgMzctOTB6IG0xNDcgMjM3YzAgMTAtNCAxOS0xMSAyNmMtNyA3LTE2IDExLTI2IDExYy0xMCAwLTE5LTQtMjYtMTFsLTk4LTk4Yy0zNCAyNC03MiAzNi0xMTQgMzZjLTI3IDAtNTMtNS03OC0xNmMtMjUtMTEtNDYtMjUtNjQtNDNjLTE4LTE4LTMyLTM5LTQzLTY0Yy0xMC0yNS0xNi01MS0xNi03OGMwLTI4IDYtNTQgMTYtNzhjMTEtMjUgMjUtNDcgNDMtNjVjMTgtMTggMzktMzIgNjQtNDNjMjUtMTAgNTEtMTUgNzgtMTVjMjggMCA1NCA1IDc5IDE1YzI0IDExIDQ2IDI1IDY0IDQzYzE4IDE4IDMyIDQwIDQzIDY1YzEwIDI0IDE2IDUwIDE2IDc4YzAgNDItMTIgODAtMzYgMTE0bDk4IDk4YzcgNyAxMSAxNSAxMSAyNXpcIn19XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJzeW1ib2xcIixcImFcIjp7XCJpZFwiOlwiYW50ZW5uYS1zdmctbG9nb1wiLFwidmlld0JveFwiOlwiMCAwIDUxMiA1MTJcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwicGF0aFwiLFwiYVwiOntcImRcIjpcIm0yODMgNTEwYzEyNS0xNyAyMjktMTI0IDIyOS0yNTMgMC0xNDEtMTE1LTI1Ni0yNTYtMjU2LTE0MSAwLTI1NiAxMTUtMjU2IDI1NiAwIDEzMCAxMDggMjM3IDIzMyAyNTRsMC0xNDljLTQ4LTE0LTg0LTUwLTg0LTEwMiAwLTY1IDQzLTExMyAxMDgtMTEzIDY1IDAgMTA3IDQ4IDEwNyAxMTMgMCA1Mi0zMyA4OC04MSAxMDJ6XCJ9fV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcIm9cIjpcImNzc3Jlc2V0XCIsXCJhXCI6e1wiY2xhc3NcIjpbXCJhbnRlbm5hIGFudGVubmEtdGV4dC1pbmRpY2F0b3Itd2lkZ2V0IFwiLHtcInRcIjo0LFwiZlwiOltcIm5vdGxvYWRlZFwiXSxcIm5cIjo1MSxcInJcIjpcImNvbnRhaW5lckRhdGEubG9hZGVkXCJ9LFwiIFwiLHtcInRcIjo0LFwiZlwiOltcImhhc3JlYWN0aW9uc1wiXSxcIm5cIjo1MCxcInhcIjp7XCJyXCI6W1wiY29udGFpbmVyRGF0YS5yZWFjdGlvblRvdGFsXCJdLFwic1wiOlwiXzA+MFwifX0sXCIgXCIse1widFwiOjQsXCJmXCI6W1wiYW50ZW5uYS1zdXBwcmVzc1wiXSxcIm5cIjo1MCxcInJcIjpcImNvbnRhaW5lckRhdGEuc3VwcHJlc3NcIn0sXCIgXCIse1widFwiOjIsXCJyXCI6XCJleHRyYUNsYXNzZXNcIn1dfSxcImZcIjpbe1widFwiOjgsXCJyXCI6XCJsb2dvXCJ9LFwiIFwiLHtcInRcIjo0LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1yZWFjdGlvbi10b3RhbFwifSxcImZcIjpbe1widFwiOjIsXCJyXCI6XCJjb250YWluZXJEYXRhLnJlYWN0aW9uVG90YWxcIn1dfV0sXCJuXCI6NTAsXCJyXCI6XCJjb250YWluZXJEYXRhLnJlYWN0aW9uVG90YWxcIn1dfV19Il19
