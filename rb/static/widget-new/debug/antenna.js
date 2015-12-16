(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/Users/jburns/antenna/rb/static/widget-new/src/js/antenna-app.js":[function(require,module,exports){

var ScriptLoader = require('./script-loader');
var CssLoader = require('./css-loader');
var GroupSettingsLoader = require('./group-settings-loader');
var PageDataLoader = require('./page-data-loader');
var PageScanner = require('./page-scanner');
var XDMAnalytics = require('./xdm-analytics');
var XDMLoader = require('./utils/xdm-loader');


// Step 1 - kick off the asynchronous loading of the Javascript and CSS we need.
CssLoader.load(); // Inject the CSS first because we may soon append more asynchronously, in the groupSettings callback, and we want that CSS to be lower in the document.
ScriptLoader.load(scriptLoaded);

function scriptLoaded() {
    // Step 2 - Once we have our required scripts, fetch the group settings from the server
    GroupSettingsLoader.load(function(groupSettings) {
        // Step 3 - Once we have the settings, we can kick off a couple things in parallel:
        //
        // -- inject any custom CSS from the group settings
        // -- create the hidden iframe we use for cross-domain cookies (primarily user login)
        // -- start fetching the page data
        // -- start hashing the page and inserting the affordances (in the empty state)
        //
        // As the page is scanned, the widgets are created and bound to the page data that comes in.
        initCustomCSS(groupSettings);
        initXdmFrame(groupSettings);
        fetchPageData(groupSettings);
        scanPage(groupSettings);
    });
}

function initCustomCSS(groupSettings) {
    var customCSS = groupSettings.customCSS();
    if (customCSS) {
        CssLoader.inject(customCSS);
    }
}

function initXdmFrame(groupSettings) {
    XDMAnalytics.start(); // The XDM iframe has a number of messages it fires on load related to analytics. Start listening.
    XDMLoader.createXDMframe(groupSettings.groupId);
}

function fetchPageData(groupSettings) {
    PageDataLoader.load(groupSettings);
}

function scanPage(groupSettings) {
    PageScanner.scan(groupSettings);
}
},{"./css-loader":"/Users/jburns/antenna/rb/static/widget-new/src/js/css-loader.js","./group-settings-loader":"/Users/jburns/antenna/rb/static/widget-new/src/js/group-settings-loader.js","./page-data-loader":"/Users/jburns/antenna/rb/static/widget-new/src/js/page-data-loader.js","./page-scanner":"/Users/jburns/antenna/rb/static/widget-new/src/js/page-scanner.js","./script-loader":"/Users/jburns/antenna/rb/static/widget-new/src/js/script-loader.js","./utils/xdm-loader":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/xdm-loader.js","./xdm-analytics":"/Users/jburns/antenna/rb/static/widget-new/src/js/xdm-analytics.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/auto-call-to-action.js":[function(require,module,exports){
var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var BrowserMetrics = require('./utils/browser-metrics');
var Ractive; require('./utils/ractive-provider').onLoad(function(loadedRactive) { Ractive=loadedRactive; });
var SVGs = require('./svgs');

function createCallToAction(antItemId, pageData, groupSettings) {
    var ractive = Ractive({
        el: $('div'),
        data: {
            antItemId: antItemId,
            expandReactions: shouldExpandReactions(groupSettings)
        },
        template: require('../templates/auto-call-to-action.hbs.html'),
        partials: {
            logo: SVGs.logo
        }
    });
    return $(ractive.find('.antenna-auto-cta'));
}

function shouldExpandReactions(groupSettings) {
    var setting = groupSettings.generatedCtaExpanded(); // Values are 'none', 'both', 'desktop', and 'mobile'
    return setting === 'both' ||
        (setting === 'desktop' && !BrowserMetrics.isMobile()) ||
        (setting === 'mobile' && BrowserMetrics.isMobile());
}

//noinspection JSUnresolvedVariable
module.exports = {
    create: createCallToAction
};
},{"../templates/auto-call-to-action.hbs.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/auto-call-to-action.hbs.html","./svgs":"/Users/jburns/antenna/rb/static/widget-new/src/js/svgs.js","./utils/browser-metrics":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/browser-metrics.js","./utils/jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js","./utils/ractive-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/ractive-provider.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/call-to-action-counter.js":[function(require,module,exports){
var Ractive; require('./utils/ractive-provider').onLoad(function(loadedRactive) { Ractive = loadedRactive;});

function createCount($countElement, containerData) {
    Ractive({
        el: $countElement,
        magic: true,
        data: {
            containerData: containerData
        },
        template: require('../templates/call-to-action-counter.hbs.html')
    });
}

//noinspection JSUnresolvedVariable
module.exports = {
    create: createCount
};
},{"../templates/call-to-action-counter.hbs.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/call-to-action-counter.hbs.html","./utils/ractive-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/ractive-provider.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/call-to-action-expanded-reactions.js":[function(require,module,exports){
var Ractive; require('./utils/ractive-provider').onLoad(function(loadedRactive) { Ractive = loadedRactive;});

function createExpandedReactions($expandedReactionsElement, $ctaElement, containerData, groupSettings) {
    Ractive({
        el: $expandedReactionsElement,
        magic: true,
        data: {
            containerData: containerData,
            computeExpandedReactions: computeExpandedReactions(groupSettings.defaultReactions($ctaElement))
        },
        template: require('../templates/call-to-action-expanded-reactions.hbs.html')
    });
}

function computeExpandedReactions(defaultReactions) {
    return function(reactionsData) {
        var max = 2;
        var expandedReactions = [];
        for (var i = 0; i < reactionsData.length && expandedReactions.length < max; i++) {
            var reactionData = reactionsData[i];
            if (isDefaultReaction(reactionData, defaultReactions)) {
                expandedReactions.push(reactionData);
            }
        }
        return expandedReactions;
    };
}

function isDefaultReaction(reactionData, defaultReactions) {
    for (var i = 0; i < defaultReactions.length; i++) {
        if (defaultReactions[i].text === reactionData.text) {
            return true;
        }
    }
    return false;
}

//noinspection JSUnresolvedVariable
module.exports = {
    create: createExpandedReactions
};
},{"../templates/call-to-action-expanded-reactions.hbs.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/call-to-action-expanded-reactions.hbs.html","./utils/ractive-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/ractive-provider.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/call-to-action-indicator.js":[function(require,module,exports){
var CallToActionCounter = require('./call-to-action-counter');
var CallToActionExpandedReactions = require('./call-to-action-expanded-reactions');
var CallToActionLabel = require('./call-to-action-label');
var ReactionsWidget = require('./reactions-widget');


function createIndicatorWidget(options) {
    var containerData = options.containerData;
    var $containerElement = options.containerElement;
    var contentData = options.contentData;
    var $ctaElement = options.ctaElement;
    var $ctaLabels = options.ctaLabels; // optional
    var $ctaCounters = options.ctaCounters; // optional
    var $ctaExpandedReactions = options.ctaExpandedReactions; // optional
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

    if ($ctaLabels) {
        for (var i = 0; i < $ctaLabels.length; i++) {
            CallToActionLabel.create($ctaLabels[i], containerData);
        }
    }

    if ($ctaCounters) {
        for (var i = 0; i < $ctaCounters.length; i++) {
            CallToActionCounter.create($ctaCounters[i], containerData);
        }
    }

    if ($ctaExpandedReactions) {
        for (var i = 0; i < $ctaExpandedReactions.length; i++) {
            CallToActionExpandedReactions.create($ctaExpandedReactions[i], $ctaElement, containerData, groupSettings);
        }
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
},{"./call-to-action-counter":"/Users/jburns/antenna/rb/static/widget-new/src/js/call-to-action-counter.js","./call-to-action-expanded-reactions":"/Users/jburns/antenna/rb/static/widget-new/src/js/call-to-action-expanded-reactions.js","./call-to-action-label":"/Users/jburns/antenna/rb/static/widget-new/src/js/call-to-action-label.js","./reactions-widget":"/Users/jburns/antenna/rb/static/widget-new/src/js/reactions-widget.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/call-to-action-label.js":[function(require,module,exports){
var Ractive; require('./utils/ractive-provider').onLoad(function(loadedRactive) { Ractive = loadedRactive;});

function createLabel($labelElement, containerData) {
    Ractive({
        el: $labelElement, // TODO: review the structure of the DOM here. Do we want to render an element into $ctaLabel or just text?
        magic: true,
        data: {
            containerData: containerData
        },
        template: require('../templates/call-to-action-label.hbs.html')
    });
}

//noinspection JSUnresolvedVariable
module.exports = {
    create: createLabel
};
},{"../templates/call-to-action-label.hbs.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/call-to-action-label.hbs.html","./utils/ractive-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/ractive-provider.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/comment-area-partial.js":[function(require,module,exports){
var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var AjaxClient = require('./utils/ajax-client');
var User = require('./utils/user');

var Events = require('./events');

function setupCommentArea(reactionProvider, containerData, pageData, groupSettings, callback, ractive) {
    ractive.on('inputchanged', updateInputCounter);
    ractive.on('addcomment', addComment);
    updateInputCounter();

    function addComment() {
        var comment = $(ractive.find('.antenna-comment-input')).val().trim(); // TODO: additional validation? input sanitizing?
        if (comment.length > 0) {
            $(ractive.find('.antenna-comment-widgets')).hide();
            $(ractive.find('.antenna-comment-waiting')).fadeIn('slow');
            reactionProvider.get(function (reaction) {
                AjaxClient.postComment(comment, reaction, containerData, pageData, function () {
                    Events.postCommentCreated(pageData, containerData, reaction, comment, groupSettings);
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

    function updateInputCounter() {
        var $textarea = $(ractive.find('.antenna-comment-input'));
        var max = parseInt($textarea.attr('maxlength'));
        var length = $textarea.val().length;
        $(ractive.find('.antenna-comment-count')).html(Math.max(0, max - length));
    }
}

//noinspection JSUnresolvedVariable
module.exports = {
    setup: setupCommentArea
};
},{"./events":"/Users/jburns/antenna/rb/static/widget-new/src/js/events.js","./utils/ajax-client":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/ajax-client.js","./utils/jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js","./utils/user":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/user.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/comments-page.js":[function(require,module,exports){
var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var Ractive; require('./utils/ractive-provider').onLoad(function(loadedRactive) { Ractive = loadedRactive;});
var CommentAreaPartial = require('./comment-area-partial');
var SVGs = require('./svgs');

var pageSelector = '.antenna-comments-page';

function createPage(options) {
    var reaction = options.reaction;
    var comments = options.comments;
    var element = options.element;
    var containerData = options.containerData;
    var pageData = options.pageData;
    var groupSettings = options.groupSettings;
    var goBack = options.goBack;
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
            commentArea: require('../templates/comment-area-partial.hbs.html'),
            left: SVGs.left
        }
    });
    var reactionProvider = { // this reaction provider is a no-brainer because we already have a valid reaction (one with an ID)
        get: function(callback) {
            callback(reaction);
        }
    };
    CommentAreaPartial.setup(reactionProvider, containerData, pageData, groupSettings, commentAdded, ractive, groupSettings);
    ractive.on('back', goBack);
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
},{"../templates/comment-area-partial.hbs.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/comment-area-partial.hbs.html","../templates/comments-page.hbs.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/comments-page.hbs.html","./comment-area-partial":"/Users/jburns/antenna/rb/static/widget-new/src/js/comment-area-partial.js","./svgs":"/Users/jburns/antenna/rb/static/widget-new/src/js/svgs.js","./utils/jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js","./utils/ractive-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/ractive-provider.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/confirmation-page.js":[function(require,module,exports){
var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var Ractive; require('./utils/ractive-provider').onLoad(function(loadedRactive) { Ractive = loadedRactive;});
var CommentAreaPartial = require('./comment-area-partial');
var SVGs = require('./svgs');

var pageSelector = '.antenna-confirmation-page';

function createPage(reactionText, reactionProvider, containerData, pageData, groupSettings, element) {
    var ractive = Ractive({
        el: element,
        append: true,
        data: {
            text: reactionText
        },
        template: require('../templates/confirmation-page.hbs.html'),
        partials: {
            commentArea: require('../templates/comment-area-partial.hbs.html'),
            facebookIcon: SVGs.facebook,
            twitterIcon: SVGs.twitter
        }
    });
    CommentAreaPartial.setup(reactionProvider, containerData, pageData, groupSettings, null, ractive);
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
var AppMode = require('./utils/app-mode');
var URLConstants = require('./utils/url-constants');

var baseUrl;
if (AppMode.test) {
    baseUrl = URLConstants.TEST;
} else if (AppMode.offline) {
    baseUrl = URLConstants.DEVELOPMENT;
} else {
    baseUrl = URLConstants.PRODUCTION;
}

function loadCss() {
    // To make sure none of our content renders on the page before our CSS is loaded, we append a simple inline style
    // element that turns off our elements *before* our CSS links. This exploits the cascade rules - our CSS files appear
    // after the inline style in the document, so they take precedence (and make everything appear) once they're loaded.
    injectCss('.antenna{display:none;}');
    var cssHref = baseUrl + '/static/widget-new/debug/antenna.css'; // TODO this needs a final path. CDN for production and local file for development?
    loadFile(cssHref);
}

function loadFile(href) {
    var linkTag = document.createElement('link');
    linkTag.setAttribute('href', href);
    linkTag.setAttribute('rel', 'stylesheet');
    linkTag.setAttribute('type', 'text/css');
    document.head.appendChild(linkTag);
}

function injectCss(cssString) {
    var styleTag = document.createElement('style');
    styleTag.setAttribute('type', 'text/css');
    styleTag.innerHTML = cssString;
    document.head.appendChild(styleTag);
}

//noinspection JSUnresolvedVariable
module.exports = {
    load : loadCss,
    inject: injectCss
};
},{"./utils/app-mode":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/app-mode.js","./utils/url-constants":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/url-constants.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/defaults-page.js":[function(require,module,exports){
var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var AjaxClient = require('./utils/ajax-client');
var Ractive; require('./utils/ractive-provider').onLoad(function(loadedRactive) { Ractive = loadedRactive;});
var ReactionsWidgetLayoutUtils = require('./utils/reactions-widget-layout-utils');

var Events = require('./events');
var PageData = require('./page-data');

var pageSelector = '.antenna-defaults-page';

function createPage(options) {
    var defaultReactions = options.defaultReactions;
    var containerData = options.containerData;
    var pageData = options.pageData;
    var groupSettings = options.groupSettings;
    var contentData = options.contentData;
    var showConfirmation = options.showConfirmation;
    var element = options.element;
    var defaultLayoutData = ReactionsWidgetLayoutUtils.computeLayoutData(defaultReactions);
    var $reactionsWindow = $(options.reactionsWindow);
    var ractive = Ractive({
        el: element,
        append: true,
        template: require('../templates/defaults-page.hbs.html'),
        data: {
            defaultReactions: defaultReactions,
            defaultLayoutClass: arrayAccessor(defaultLayoutData.layoutClasses)
        },
        decorators: {
            sizetofit: ReactionsWidgetLayoutUtils.sizeToFit($reactionsWindow)
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
        postNewReaction(defaultReactionData);
    }

    function submitCustomReaction() {
        var body = $(ractive.find('.antenna-defaults-footer input')).val().trim();
        if (body !== '') {
            var reactionData = { text: body };
            postNewReaction(reactionData);
        }
    }

    function postNewReaction(reactionData) {
        var reactionProvider = createReactionProvider();
        showConfirmation(reactionData, reactionProvider);
        AjaxClient.postNewReaction(reactionData, containerData, pageData, contentData, success, error);

        function success(reaction) {
            reaction = PageData.registerReaction(reaction, containerData, pageData);
            reactionProvider.reactionLoaded(reaction);
            Events.postReactionCreated(pageData, containerData, reaction, groupSettings);
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
            var $input = $footer.find('input');
            // Reset the input value to the default in the html/template
            $input.val($input.attr('value')).removeClass('active');
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

//noinspection JSUnresolvedVariable
module.exports = {
    create: createPage
};
},{"../templates/defaults-page.hbs.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/defaults-page.hbs.html","./events":"/Users/jburns/antenna/rb/static/widget-new/src/js/events.js","./page-data":"/Users/jburns/antenna/rb/static/widget-new/src/js/page-data.js","./utils/ajax-client":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/ajax-client.js","./utils/jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js","./utils/ractive-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/ractive-provider.js","./utils/reactions-widget-layout-utils":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/reactions-widget-layout-utils.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/events.js":[function(require,module,exports){
var AjaxClient = require('./utils/ajax-client');
var BrowserMetrics = require('./utils/browser-metrics');
var XDMClient = require('./utils/xdm-client');

function postGroupSettingsLoaded(groupSettings) {
    var event = createEvent(eventTypes.scriptLoad, '', groupSettings);
    event[attributes.pageId] = 'na';
    event[attributes.articleHeight] = 'na';
    postEvent(event);
}

function postPageDataLoaded(pageData, groupSettings) {
    var event = createEvent(eventTypes.pageDataLoaded, '', groupSettings);
    appendPageDataParams(event, pageData);
    event[attributes.contentAttributes] = pageData.metrics.isMultiPage ? eventValues.multiplePages : eventValues.singlePage;
    postEvent(event);
}

function postReactionWidgetOpened(isShowReactions, pageData, containerData, contentData, groupSettings) {
    var eventValue = isShowReactions ? eventValues.showReactions : eventValues.showDefaults;
    var event = createEvent(eventTypes.reactionWidgetOpened, eventValue, groupSettings);
    appendPageDataParams(event, pageData);
    event[attributes.containerHash] = containerData.hash;
    event[attributes.containerKind] = contentData.type;
    postEvent(event);
}

function postSummaryOpened(isShowReactions, pageData, groupSettings) {
    var eventValue = isShowReactions ? eventValues.viewReactions : eventValues.viewDefaults;
    var event = createEvent(eventTypes.summaryWidget, eventValue, groupSettings);
    appendPageDataParams(event, pageData);
    postEvent(event);
}

function postReactionCreated(pageData, containerData, reactionData, groupSettings) {
    var event = createEvent(eventTypes.reactionCreated, reactionData.text, groupSettings);
    appendPageDataParams(event, pageData);
    appendContainerDataParams(event, containerData);
    appendReactionDataParams(event, reactionData);
    postEvent(event);
}

// TODO: Hook this up once reaction sharing is in place.
// TODO: Confirm with Porter that the other place the 'sh' event is fired, _makeShareIcons, is dead code
function postReactionShared(pageData, containerData, reactionData, groupSettings) {
    var eventValue = ''; // TODO: 'facebook', 'twitter', etc
    var event = createEvent(eventTypes.reactionShared, eventValue, groupSettings);
    appendPageDataParams(event, pageData);
    appendContainerDataParams(event, containerData);
    appendReactionDataParams(event, reactionData);
    postEvent(event);
}

function postLocationsViewed(pageData, groupSettings) {
    var event = createEvent(eventTypes.summaryWidget, eventValues.locationsViewed, groupSettings);
    appendPageDataParams(event, pageData);
    postEvent(event);
}

function postContentViewed(pageData, containerData, locationData, groupSettings) {
    var event = createEvent(eventTypes.summaryWidget, eventValues.contentViewed, groupSettings);
    appendPageDataParams(event, pageData);
    appendContainerDataParams(event, containerData);
    event[attributes.contentId] = locationData.contentId;
    event[attributes.contentLocation] = locationData.location;
    postEvent(event);
}

function postCommentsViewed(pageData, containerData, reactionData, groupSettings) {
    var event = createEvent(eventTypes.commentsViewed, '', groupSettings);
    appendPageDataParams(event, pageData);
    appendContainerDataParams(event, containerData);
    appendReactionDataParams(event, reactionData);
    postEvent(event);
}

function postCommentCreated(pageData, containerData, reactionData, comment, groupSettings) {
    var event = createEvent(eventTypes.commentCreated, comment, groupSettings);
    appendPageDataParams(event, pageData);
    appendContainerDataParams(event, containerData);
    appendReactionDataParams(event, reactionData);
    postEvent(event);
}

function postRecircClicked(pageData, reactionId, groupSettings) {
    var event = createEvent(eventTypes.recircClicked, reactionId, groupSettings);
    appendPageDataParams(event, pageData);
    postEvent(event);
}

function appendPageDataParams(event, pageData) {
    event[attributes.pageId] = pageData.pageId;
    event[attributes.pageTitle] = pageData.title;
    event[attributes.canonicalUrl] = pageData.canonicalUrl;
    event[attributes.pageUrl] = pageData.requestedUrl;
    event[attributes.articleHeight] = 0 || pageData.metrics.height;
    event[attributes.pageTopics] = pageData.topics;
    event[attributes.author] = pageData.author;
    event[attributes.siteSection] = pageData.section;
}

function appendContainerDataParams(event, containerData) {
    event[attributes.containerHash] = containerData.hash;
    event[attributes.containerKind] = containerData.type;
}

function appendReactionDataParams(event, reactionData) {
    event[attributes.reactionBody] = reactionData.text;
    if (reactionData.content) {
        event[attributes.contentLocation] = reactionData.content.location;
        event[attributes.contentId] = reactionData.content.id;
    }
}

function createEvent(eventType, eventValue, groupSettings) {
    var referrerDomain = document.referrer.split('/').splice(2).join('/'); // TODO: engage_full code. Review

    var event = {};
    event[attributes.eventType] = eventType;
    event[attributes.eventValue] = eventValue;
    event[attributes.groupId] = groupSettings.groupId();
    event[attributes.shortTermSession] = getShortTermSessionId();
    event[attributes.longTermSession] = getLongTermSessionId();
    event[attributes.referrerUrl] = referrerDomain;
    event[attributes.isTouchBrowser] = BrowserMetrics.supportsTouch();
    event[attributes.screenWidth] = screen.width;
    event[attributes.screenHeight] = screen.height;
    event[attributes.pixelDensity] = window.devicePixelRatio || Math.round(window.screen.availWidth / document.documentElement.clientWidth); // TODO: review this engage_full code, which doesn't seem correct
    event[attributes.userAgent] = navigator.userAgent;
    return event;
}

function postEvent(event) {
    XDMClient.getUser(function(userInfo) {
        event[attributes.userId] = userInfo.user_id;
        fillInMissingProperties(event);
        // Send the event to BigQuery
        AjaxClient.postEvent(event);
    });
}

// Fill in any optional properties with null values.
function fillInMissingProperties(event) {
    for (var attr in attributes) {
        if (event[attributes[attr]] === undefined) {
            event[attributes[attr]] = null;
        }
    }
}

function getLongTermSessionId() {
    var guid = localStorage.getItem('ant_lts');
    if (!guid) {
        guid = createGuid();
        try {
            localStorage.setItem('ant_lts', guid);
        } catch(error) {
            // Some browsers (mobile Safari) throw an exception when in private browsing mode.
            // Nothing we can do about it. Just fall through and return the value we generated.
        }
    }
    return guid;
}

function getShortTermSessionId() {
    var session;
    var json = localStorage.getItem('ant_sts');
    if (json) {
        session = JSON.parse(json);
        if (Date.now() > session.expires) {
            session = null;
        }
    }
    if (!session) {
        var minutes = 15;
        session = {
            guid: createGuid(),
            expires: Date.now() + minutes * 60000
        };
    }
    try {
        localStorage.setItem('ant_sts', JSON.stringify(session));
    } catch(error) {
        // Some browsers (mobile Safari) throw an exception when in private browsing mode.
        // Nothing we can do about it. Just fall through and return the value we generated.
    }
    return session.guid;
}

function createGuid() {
    // Code copied from engage_full (originally, http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript)
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

var attributes = {
    eventType: 'et',
    eventValue: 'ev',
    groupId: 'gid',
    userId: 'uid',
    pageId: 'pid',
    longTermSession: 'lts',
    shortTermSession: 'sts',
    referrerUrl: 'ref',
    contentId: 'cid',
    articleHeight: 'ah',
    containerHash: 'ch',
    containerKind: 'ck',
    reactionBody: 'r',
    pageTitle: 'pt',
    canonicalUrl: 'cu',
    pageUrl: 'pu',
    contentAttributes: 'ca',
    contentLocation: 'cl',
    pageTopics: 'ptop',
    author: 'a',
    siteSection: 'sec',
    isTouchBrowser: 'it',
    screenWidth: 'sw',
    screenHeight: 'sh',
    pixelDensity: 'pd',
    userAgent: 'ua'
};

var eventTypes = {
    scriptLoad: 'sl',
    reactionShared: 'sh',
    summaryWidget: 'sb',
    reactionWidgetOpened: 'rs',
    pageDataLoaded: 'wl',
    commentCreated: 'c',
    reactionCreated: 're',
    commentsViewed: 'vcom',
    recircClicked: 'rc'
};

var eventValues = {
    contentViewed: 'vc', // view_content
    locationsViewed: 'vr', // view_reactions
    showDefaults: 'wr',
    showReactions: 'rd',
    singlePage: 'si',
    multiplePages: 'mu',
    viewReactions: 'vw',
    viewDefaults: 'ad'
};

//noinspection JSUnresolvedVariable
module.exports = {
    postGroupSettingsLoaded: postGroupSettingsLoaded,
    postPageDataLoaded: postPageDataLoaded,
    postSummaryOpened: postSummaryOpened,
    postCommentsViewed: postCommentsViewed,
    postCommentCreated: postCommentCreated,
    postReactionWidgetOpened: postReactionWidgetOpened,
    postReactionCreated: postReactionCreated,
    postReactionShared: postReactionShared,
    postLocationsViewed: postLocationsViewed,
    postContentViewed: postContentViewed,
    postRecircClicked: postRecircClicked
};
},{"./utils/ajax-client":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/ajax-client.js","./utils/browser-metrics":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/browser-metrics.js","./utils/xdm-client":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/xdm-client.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/group-settings-loader.js":[function(require,module,exports){
var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var AjaxClient = require('./utils/ajax-client');
var URLs = require('./utils/urls');
var GroupSettings = require('./group-settings');

// TODO fold this module into group-settings?

function loadSettings(callback) {
    AjaxClient.getJSONP(URLs.groupSettingsUrl(), { host_name: window.antenna_host }, success, error);

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
},{"./group-settings":"/Users/jburns/antenna/rb/static/widget-new/src/js/group-settings.js","./utils/ajax-client":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/ajax-client.js","./utils/jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js","./utils/urls":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/urls.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/group-settings.js":[function(require,module,exports){
var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });

var Events = require('./events');

var groupSettings;

// TODO: Update all clients that are passing around a groupSettings object to instead access the 'global' settings instance
function getGroupSettings() {
    return groupSettings;
}

function updateFromJSON(json) {
    groupSettings = createFromJSON(json);
    Events.postGroupSettingsLoaded(groupSettings);
    return groupSettings;
}


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
    tag_box_bg_colors: '',
    tag_box_text_colors: '',
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

    function computeCustomCSS() {
        // First read any raw custom CSS.
        var customCSS = data('custom_css')();
        // Then append rules for any specific CSS overrides.
        customCSS += createCustomCSSRule(data('tags_bg_css', ''), '.antenna-reactions-page .antenna-body, .antenna-defaults-page .antenna-body');
        customCSS += createCustomCSSRule(data('tag_box_bg_colors', ''), '.antenna-reaction-box');
        customCSS += createCustomCSSRule(data('tag_box_bg_colors_hover', ''), '.antenna-reaction:hover > .antenna-reaction-box');
        customCSS += createCustomCSSRule(migrateTextColorSettings(data('tag_box_text_colors', '')), '.antenna-reaction-box, .antenna-reaction-comments .antenna-comments-path, .antenna-reaction-location .antenna-location-path');
        customCSS += createCustomCSSRule(migrateFontFamilySetting(data('tag_box_font_family', '')), '.antenna-reaction-box');
        return customCSS;
    }

    function createCustomCSSRule(declarationsAccessor, selector) {
        var declarations = declarationsAccessor().trim();
        if (declarations) {
            return '\n' + selector + ' {\n    ' + declarations + '\n}';
        }
        return '';
    }

    function migrateFontFamilySetting(fontFamilyAccessor) {
        // TODO: This is temporary code that migrates the current tag_box_font_family setting from a raw value to a
        //       CSS declaration. We should migrate all deployed sites to use a CSS declaration and then remove this.
        var fontFamily = fontFamilyAccessor().trim();
        if (fontFamily && fontFamily.indexOf('font-family') === -1) {
            fontFamily = 'font-family: ' + fontFamily;
        }
        return function() {
            return fontFamily;
        }
    }

    function migrateTextColorSettings(textColorAccessor) {
        // TODO: This is temporary code that migrates the current tag_box_text_colors property, which is a declaration
        //       that only sets the color property, to set both the color and fill properties.
        var textColor = textColorAccessor().trim();
        if (textColor && textColor.indexOf('color:') === 0 && textColor.indexOf('fill:') === -1) {
            textColor += textColor[textColor.length - 1] == ';' ? '' : ';'; // append a semicolon if needed
            textColor += textColor.replace('color:', '\n    fill:');
        }
        return function() {
            return textColor;
        }
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
        isExpandedMobileSummary: data('summary_widget_expanded_mobile'),
        pageSelector: data('post_selector'),
        pageLinkSelector: data('post_href_selector'),
        pageImageSelector: data('image_selector'),
        pageImageAttribute: data('image_attribute'),
        pageAuthorSelector: data('author_selector'),
        pageAuthorAttribute: data('author_attribute'),
        pageTopicsSelector: data('topics_selector'),
        pageTopicsAttribute: data('topics_attribute'),
        pageSiteSectionSelector: data('section_selector'),
        pageSiteSectionAttribute: data('section_attribute'),
        contentSelector: data('anno_whitelist'),
        textIndicatorLimit: data('initial_pin_limit'),
        enableTextHelper: data('paragraph_helper'),
        mediaIndicatorCorner: data('img_indicator_show_side'),
        generatedCtaSelector: data('separate_cta'),
        generatedCtaExpanded: data('separate_cta_expanded'),
        defaultReactions: defaultReactions,
        customCSS: computeCustomCSS,
        exclusionSelector: data('no_ant'), // TODO: no_readr?
        language: data('language')
    }
}

//noinspection JSUnresolvedVariable
module.exports = {
    create: updateFromJSON,
    get: getGroupSettings
};
},{"./events":"/Users/jburns/antenna/rb/static/widget-new/src/js/events.js","./utils/jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/hashed-elements.js":[function(require,module,exports){
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

var Events = require('./events');
var HashedElements = require('./hashed-elements');
var PageData = require('./page-data');
var SVGs = require('./svgs');

var pageSelector = '.antenna-locations-page';

function createPage(options) {
    var element = options.element;
    var reactionLocationData = options.reactionLocationData;
    var pageData = options.pageData;
    var groupSettings = options.groupSettings;
    var closeWindow = options.closeWindow;
    var goBack = options.goBack;
    var ractive = Ractive({
        el: element,
        append: true,
        data: {
            locationData: reactionLocationData,
            pageReactionCount: pageReactionCount(reactionLocationData),
            canLocate: function(containerHash) {
                // TODO: is there a better way to handle reactions to hashes that are no longer on the page?
                //       should we provide some kind of indication when we fail to locate a hash or just leave it as is?
                // TODO: Does it make sense to even show entries that we can't locate? Probably not.
                return HashedElements.get(containerHash, pageData.pageHash) !== undefined;
            }
        },
        template: require('../templates/locations-page.hbs.html'),
        partials: {
            left: SVGs.left
        }
    });
    ractive.on('back', goBack);
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
                var containerData = PageData.getContainerData(pageData, locationData.containerHash);
                Events.postContentViewed(pageData, containerData,locationData, groupSettings);
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

//noinspection JSUnresolvedVariable
module.exports = {
    create: createPage
};
},{"../templates/locations-page.hbs.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/locations-page.hbs.html","./events":"/Users/jburns/antenna/rb/static/widget-new/src/js/events.js","./hashed-elements":"/Users/jburns/antenna/rb/static/widget-new/src/js/hashed-elements.js","./page-data":"/Users/jburns/antenna/rb/static/widget-new/src/js/page-data.js","./svgs":"/Users/jburns/antenna/rb/static/widget-new/src/js/svgs.js","./utils/jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js","./utils/ractive-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/ractive-provider.js","./utils/range":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/range.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/media-indicator-widget.js":[function(require,module,exports){
var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var Ractive; require('./utils/ractive-provider').onLoad(function(loadedRactive) { Ractive = loadedRactive;});
var ReactionsWidget = require('./reactions-widget');
var SVGs = require('./svgs');

var AppMode = require('./utils/app-mode');
var MutationObserver = require('./utils/mutation-observer');
var ThrottledEvents = require('./utils/throttled-events');
var TouchSupport = require('./utils/touch-support');

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
            logo: SVGs.logo
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
    TouchSupport.setupTap($rootElement.get(0), function(event) {
        event.preventDefault();
        openReactionsWindow(reactionWidgetOptions, ractive)
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

    ThrottledEvents.on('resize', positionIfNeeded);
    ractive.on('teardown', function() {
        ThrottledEvents.off('resize', positionIfNeeded);
    });
    ThrottledEvents.on('scroll', positionIfNeeded);
    ractive.on('teardown', function() {
        ThrottledEvents.off('scroll', positionIfNeeded);
    });

    // TODO: consider also listening to src attribute changes, which might affect the height of elements on the page
    MutationObserver.addAdditionListener(elementsAddedOrRemoved);
    MutationObserver.addRemovalListener(elementsAddedOrRemoved);

    function elementsAddedOrRemoved($elements) {
        // Reposition the indicator if elements which might adjust the container's position are added/removed.
        for (var i = 0; i < $elements.length; i++) {
            var $element = $elements[i];
            if ($element.height() > 0) {
                positionIfNeeded();
                return;
            }
        }
    }

    var lastContainerOffset = $containerElement.offset();
    var lastContainerHeight = $containerElement.height();

    function positionIfNeeded() {
        var containerOffset = $containerElement.offset();
        var containerHeight = $containerElement.height();
        if (containerOffset.top === lastContainerOffset.top &&
            containerOffset.left === lastContainerOffset.left &&
            containerHeight === lastContainerHeight) {
            return;
        }
        lastContainerOffset = containerOffset;
        lastContainerHeight = containerHeight;
        positionIndicator();
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
},{"../templates/media-indicator-widget.hbs.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/media-indicator-widget.hbs.html","./reactions-widget":"/Users/jburns/antenna/rb/static/widget-new/src/js/reactions-widget.js","./svgs":"/Users/jburns/antenna/rb/static/widget-new/src/js/svgs.js","./utils/app-mode":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/app-mode.js","./utils/jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js","./utils/mutation-observer":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/mutation-observer.js","./utils/ractive-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/ractive-provider.js","./utils/throttled-events":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/throttled-events.js","./utils/touch-support":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/touch-support.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/page-data-loader.js":[function(require,module,exports){
var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var AjaxClient = require('./utils/ajax-client');
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
        pages[0].author = PageUtils.computePageAuthor(groupSettings);
        pages[0].topics = PageUtils.computePageTopics(groupSettings);
        pages[0].section = PageUtils.computePageSiteSection(groupSettings);
    }

    return { pages: pages };
}

function loadPageData(pageDataParam, groupSettings) {
    AjaxClient.getJSONP(URLs.pageDataUrl(), pageDataParam, success, error);

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
},{"./page-data":"/Users/jburns/antenna/rb/static/widget-new/src/js/page-data.js","./utils/ajax-client":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/ajax-client.js","./utils/jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js","./utils/page-utils":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/page-utils.js","./utils/throttled-events":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/throttled-events.js","./utils/urls":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/urls.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/page-data.js":[function(require,module,exports){
var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });

var Events = require('./events');

// Collection of all page data, keyed by page hash
var pages = {};
// Mapping of page URLs to page hashes, which are computed on the server.
var urlHashes = {};

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
            summaryReactions: [],
            summaryTotal: 0,
            summaryLoaded: false,
            containers: [],
            metrics: {} // This is a catch-all field where we can attach client-side metrics for analytics
        };
        pages[hash] = pageData;
    }
    return pageData;
}

function updateAllPageData(jsonPages, groupSettings) {
    var allPages = [];
    for (var i = 0; i < jsonPages.length; i++) {
        var pageData = updatePageData(jsonPages[i], groupSettings)
        allPages.push(pageData);
        Events.postPageDataLoaded(pageData, groupSettings);
    }
}

function updatePageData(json, groupSettings) {
    var pageData = getPageDataForJsonResponse(json);
    pageData.pageId = json.id;
    pageData.pageHash = json.pageHash;
    pageData.groupId = groupSettings.groupId();
    pageData.canonicalUrl = json.canonicalURL;
    pageData.requestedUrl = json.requestedURL;
    pageData.author = json.author;
    pageData.section = json.section;
    pageData.topics = json.topics;
    pageData.title = json.title;
    pageData.image = json.image;

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

    return pageData;
}

function getContainerData(pageData, containerHash) {
    var containerData = pageData.containers[containerHash];
    if (!containerData) {
        containerData = {
            hash: containerHash,
            reactionTotal: 0,
            reactions: [],
            loaded: pageData.summaryLoaded,
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
                var reactionId = reaction.id;
                var content = reaction.content;
                var contentId = content.id;
                var reactionLocationData = locationData[reactionId];
                if (!reactionLocationData) {
                    reactionLocationData = {};
                    locationData[reactionId] = reactionLocationData;
                }
                var contentLocationData = reactionLocationData[contentId]; // TODO: It's not really possible to get a hit here, is it? We should never see two instances of the same reaction for the same content? (There'd would just be one instance with a count > 1.)
                if (!contentLocationData) {
                    contentLocationData = {
                        count: 0,
                        kind: content.kind, // TODO: We should normalize this value to a set of constants. fix this in locations-page where the value is read as well.
                        // TODO: also consider translating this from the raw "kind" to "type". (e.g. "pag" => "page")
                        location: content.location,
                        containerHash: containerData.hash,
                        contentId: contentId
                    };
                    reactionLocationData[contentId] = contentLocationData;
                }
                contentLocationData.count += reaction.count;
            }
        }
    }
    return locationData;
}

function updateReactionLocationData(reactionLocationData, contentBodies) {
    for (var contentId in contentBodies) {
        if (contentBodies.hasOwnProperty(contentId)) {
            var contentLocationData = reactionLocationData[contentId];
            if (contentLocationData) {
                contentLocationData.body = contentBodies[contentId];
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

// Gets page data based on a URL. This allows our client to start processing a page (and binding data objects
// to the UI) *before* we get data back from the server.
function getPageDataByURL(url) {
    var serverHash = urlHashes[url];
    if (serverHash) {
        // If the server already given us the hash for the page, use it.
        return getPageData(serverHash);
    } else {
        // Otherwise, temporarily use the url as the hash. This will get updated whenever we get data back from the server.
        return getPageData(url);
    }
}

function getPageDataForJsonResponse(json) {
    var pageHash = json.pageHash;
    var requestedURL = json.requestedURL;
    urlHashes[requestedURL] = pageHash;
    var urlBasedData = pages[requestedURL];
    if (urlBasedData) {
        // urlBasedData we've already created/bound a pageData object under the requestedUrl, move that data over
        // to the hash key
        pages[pageHash] = urlBasedData;
        delete pages[requestedURL];
    }
    return getPageData(pageHash);
}

//noinspection JSUnresolvedVariable
module.exports = {
    getPageDataByURL: getPageDataByURL,
    getPageData: getPageData,
    updateAllPageData: updateAllPageData,
    getContainerData: getContainerData,
    getReactionLocationData: getReactionLocationData,
    updateReactionLocationData: updateReactionLocationData,
    registerReaction: registerReaction,
    clearIndicatorLimit: clearIndicatorLimit
};
},{"./events":"/Users/jburns/antenna/rb/static/widget-new/src/js/events.js","./utils/jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/page-scanner.js":[function(require,module,exports){
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
        scanPage($page, groupSettings, $pages.length > 1);
    });
    MutationObserver.addAdditionListener(elementsAdded(groupSettings));
}

// Scan the page using the given settings:
// 1. Find all the containers that we care about.
// 2. Compute hashes for each container.
// 3. Insert widget affordances for each which are bound to the data model by the hashes.
function scanPage($page, groupSettings, isMultiPage) {
    var url = PageUtils.computePageUrl($page, groupSettings);
    var pageData = PageData.getPageDataByURL(url);
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

    pageData.metrics.height = computePageHeight($activeSections);
    pageData.metrics.isMultiPage = isMultiPage;
}

function computePageHeight($activeSections) {
    var contentTop;
    var contentBottom;
    $activeSections.each(function() {
        var $section = $(this);
        var offset = $section.offset();
        contentTop = contentTop === undefined ? offset.top : Math.min(contentTop, offset.top);
        var bottom = offset.top + $section.outerHeight();
        contentBottom = contentBottom === undefined ? bottom : Math.max(contentBottom, bottom);
    });
    return contentBottom - contentTop;
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

    var ctaLabels = {}; // Optional elements that report the number of reactions to the cta (e.g. "1 reaction")
    find($element, '[ant-reactions-label-for]', true).each(function() {
        var $ctaLabel = $(this);
        $ctaLabel.addClass('no-ant'); // don't show the normal reaction affordance on a cta label
        var antItemId = $ctaLabel.attr('ant-reactions-label-for').trim();
        ctaLabels[antItemId] = ctaLabels[antItemId] || [];
        ctaLabels[antItemId].push($ctaLabel);
    });

    var ctaCounters = {}; // Optional elements that report only the count of reaction to a cta (e.g. "1")
    find($element, '[ant-counter-for]', true).each(function() {
        var $ctaCounter = $(this);
        $ctaCounter.addClass('no-ant'); // don't show the normal reaction affordance on a cta counter
        var antItemId = $ctaCounter.attr('ant-counter-for').trim();
        ctaCounters[antItemId] = ctaCounters[antItemId] || [];
        ctaCounters[antItemId].push($ctaCounter);
    });

    var ctaExpandedReactions = {}; // Optional elements that show expanded reactions for the cta (e.g. "Interesting (15) No thanks (10)")
    find($element, '[ant-expanded-reactions-for]', true).each(function() {
        var $ctaExpandedReactionArea = $(this);
        $ctaExpandedReactionArea.addClass('no-ant'); // don't show the normal reaction affordance on a cta counter
        var antItemId = $ctaExpandedReactionArea.attr('ant-expanded-reactions-for').trim();
        ctaExpandedReactions[antItemId] = ctaExpandedReactions[antItemId] || [];
        ctaExpandedReactions[antItemId].push($ctaExpandedReactionArea);
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
                    ctaLabels: ctaLabels[antItemId],
                    ctaCounters: ctaCounters[antItemId],
                    ctaExpandedReactions: ctaExpandedReactions[antItemId],
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
        var $cta = AutoCallToAction.create(antItemId, pageData, groupSettings);
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
                type: 'media',
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
                    var pageData = PageData.getPageDataByURL(url);
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

var SVGs = require('./svgs');

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
                logo: SVGs.logo
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
        // The :hover pseudo class can become stuck on the antenna-popup element when we bring up the reaction window
        // in response to the click. So here we add/remove our own hover class instead.
        // See: http://stackoverflow.com/questions/10321275/hover-state-is-sticky-after-element-is-moved-out-from-under-the-mouse-in-all-br
        $element.on('mouseenter', function() {
           $element.addClass('hover');
        });
        $element.on('mouseleave', function() {
            $element.removeClass('hover');
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
},{"../templates/popup-widget.hbs.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/popup-widget.hbs.html","./svgs":"/Users/jburns/antenna/rb/static/widget-new/src/js/svgs.js","./utils/jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js","./utils/ractive-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/ractive-provider.js","./utils/transition-util":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/transition-util.js","./utils/widget-bucket":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/widget-bucket.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/reactions-page.js":[function(require,module,exports){
var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var AjaxClient = require('./utils/ajax-client');
var Ractive; require('./utils/ractive-provider').onLoad(function(loadedRactive) { Ractive = loadedRactive;});
var Range = require('./utils/range');
var ReactionsWidgetLayoutUtils = require('./utils/reactions-widget-layout-utils');

var Events = require('./events');
var SVGs = require('./svgs');

var pageSelector = '.antenna-reactions-page';

function createPage(options) {
    var isSummary = options.isSummary;
    var reactionsData = options.reactionsData;
    var containerData = options.containerData;
    var pageData = options.pageData;
    var groupSettings = options.groupSettings;
    var contentData = options.contentData;
    var containerElement = options.containerElement; // optional
    var showConfirmation = options.showConfirmation;
    var showDefaults = options.showDefaults;
    var showComments = options.showComments;
    var showLocations = options.showLocations;
    var element = options.element;
    var reactionsLayoutData = ReactionsWidgetLayoutUtils.computeLayoutData(reactionsData);
    var $reactionsWindow = $(options.reactionsWindow);
    var ractive = Ractive({
        el: element,
        append: true,
        template: require('../templates/reactions-page.hbs.html'),
        data: {
            reactions: reactionsData,
            reactionsLayoutClass: arrayAccessor(reactionsLayoutData.layoutClasses),
            isSummary: isSummary
        },
        decorators: {
            sizetofit: sizeToFit($reactionsWindow)
        },
        partials: {
            locationIcon: SVGs.location,
            commentsIcon: SVGs.comments
        }
    });

    if (containerElement) {
        ractive.on('highlight', highlightContent(containerData, pageData, containerElement));
        ractive.on('clearhighlights', Range.clearHighlights);
    }
    ractive.on('plusone', plusOne(containerData, pageData, showConfirmation, groupSettings));
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
}

function sizeToFit($reactionsWindow) {
    return function(node) {
        var $element = $(node).closest('.antenna-reaction-box');
        // While we're sizing the text to fix in the reaction box, we also fix up the width of the reaction count and
        // plus one buttons so that they're the same. These two visually swap with each other on hover; making them
        // the same width makes sure we don't get jumpiness on hover.
        // TODO: We should revisit the layout of the actions to make them easier tap on mobile. At that time, we should
        // end up with stable touch target boxes anyway.
        var $reactionCount = $element.find('.antenna-reaction-count');
        var $plusOne = $element.find('.antenna-plusone');
        var minWidth = Math.max($reactionCount.width(), $plusOne.width());
        $reactionCount.css({'min-width': minWidth});
        $plusOne.css({'min-width': minWidth});
        return ReactionsWidgetLayoutUtils.sizeToFit($reactionsWindow)(node);
    }
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

function plusOne(containerData, pageData, showConfirmation, groupSettings) {
    return function(event) {
        var reactionData = event.context;
        var reactionProvider = { // this reaction provider is a no-brainer because we already have a valid reaction (one with an ID)
            get: function(callback) {
                callback(reactionData);
            }
        };
        showConfirmation(reactionData, reactionProvider);
        AjaxClient.postPlusOne(reactionData, containerData, pageData, function(reactionData){
            Events.postReactionCreated(pageData, containerData, reactionData, groupSettings);
        }, error);

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
},{"../templates/reactions-page.hbs.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/reactions-page.hbs.html","./events":"/Users/jburns/antenna/rb/static/widget-new/src/js/events.js","./svgs":"/Users/jburns/antenna/rb/static/widget-new/src/js/svgs.js","./utils/ajax-client":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/ajax-client.js","./utils/jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js","./utils/ractive-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/ractive-provider.js","./utils/range":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/range.js","./utils/reactions-widget-layout-utils":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/reactions-widget-layout-utils.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/reactions-widget.js":[function(require,module,exports){
var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var AjaxClient = require('./utils/ajax-client');
var Messages = require('./utils/messages');
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
var Events = require('./events');
var LocationsPage = require('./locations-page');
var PageData = require('./page-data');
var ReactionsPage = require('./reactions-page');
var SVGs = require('./svgs');

var PAGE_REACTIONS = 'reactions';
var PAGE_DEFAULTS = 'defaults';
var PAGE_AUTO = 'auto';

var SELECTOR_REACTIONS_WIDGET = '.antenna-reactions-widget';

var openInstances = [];

function openReactionsWidget(options, elementOrCoords) {
    closeAllWindows();
    var defaultReactions = options.defaultReactions;
    var reactionsData = options.reactionsData;
    var containerData = options.containerData;
    var containerElement = options.containerElement; // optional
    var startPage = options.startPage || PAGE_AUTO; // optional
    var isSummary = options.isSummary === undefined ? false : options.isSummary; // optional
    // contentData contains details about the content being reacted to like text range or image height/width.
    // we potentially modify this data (e.g. in the default reaction case we select the text ourselves) so we
    // make a local copy of it to avoid unexpectedly changing data out from under one of the clients
    var contentData = JSON.parse(JSON.stringify(options.contentData));
    var pageData = options.pageData;
    var groupSettings = options.groupSettings;
    var ractive = Ractive({
        el: WidgetBucket.get(),
        append: true,
        data: {},
        template: require('../templates/reactions-widget.hbs.html'),
        partials: {
            logo: SVGs.logo
        }
    });

    ractive.on('close', closeAllWindows);
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

        var isShowReactions = startPage === PAGE_REACTIONS || (startPage === PAGE_AUTO && reactionsData.length > 0);
        if (isShowReactions) {
            showReactions(false);
        } else { // startPage === pageDefaults || there are no reactions
            showDefaultReactionsPage(false);
        }
        if (isSummary) {
            Events.postSummaryOpened(isShowReactions, pageData, groupSettings);
        } else {
            Events.postReactionWidgetOpened(isShowReactions, pageData, containerData, contentData, groupSettings);
        }

        setupWindowClose(pages, ractive);
        preventExtraScroll($rootElement);
        openInstances.push(ractive);
    }

    function showReactions(animate, reverse) {
        var options = {
            isSummary: isSummary,
            reactionsData: reactionsData,
            pageData: pageData,
            groupSettings: groupSettings,
            containerData: containerData,
            containerElement: containerElement,
            contentData: contentData,
            showConfirmation: showConfirmation,
            showDefaults: function() { showDefaultReactionsPage(true) },
            showComments: showComments,
            showLocations: showLocations,
            element: pageContainer(ractive),
            reactionsWindow: $rootElement
        };
        var page = ReactionsPage.create(options);
        pages.push(page);
        if (reverse) {
            goBackToPage(pages, page.selector, $rootElement);
        } else {
            showPage(page.selector, $rootElement, animate, false);
        }
    }

    function backToReactions() {
        setWindowTitle(Messages.getMessage('reactions-widget_title'));
        showReactions(true, true);
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
            groupSettings: groupSettings,
            containerData: containerData,
            contentData: contentData,
            showConfirmation: showConfirmation,
            element: pageContainer(ractive),
            reactionsWindow: $rootElement
        };
        var page = DefaultsPage.create(options);
        pages.push(page);
        showPage(page.selector, $rootElement, animate);
    }

    function showConfirmation(reactionData, reactionProvider) {
        setWindowTitle(Messages.getMessage('reactions-widget_title_thanks'));
        var page = ConfirmationPage.create(reactionData.text, reactionProvider, containerData, pageData, groupSettings, pageContainer(ractive));
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
                goBack: backToReactions,
                containerData: containerData,
                pageData: pageData,
                groupSettings: groupSettings
            };
            var page = CommentsPage.create(options);
            pages.push(page);

            // TODO: revisit
            setTimeout(function() { // In order for the positioning animation to work, we need to let the browser render the appended DOM element
                showPage(page.selector, $rootElement, true);
            }, 1);

            Events.postCommentsViewed(pageData, containerData, reaction, groupSettings);
        });
    }

    function showLocations(reaction) {
        showProgressPage(); // TODO: provide some way for the user to give up / cancel. Also, handle errors fetching comments.
        var reactionLocationData = PageData.getReactionLocationData(reaction, pageData);
        AjaxClient.fetchLocationDetails(reactionLocationData, pageData, function(locationDetails) {
            PageData.updateReactionLocationData(reactionLocationData, locationDetails);
            var options = { // TODO: clean up the number of these "options" objects that we create.
                element: pageContainer(ractive),
                reactionLocationData: reactionLocationData,
                pageData: pageData,
                groupSettings: groupSettings,
                closeWindow: closeAllWindows,
                goBack: backToReactions
            };
            var page = LocationsPage.create(options);
            pages.push(page);
            setWindowTitle(reaction.text);
            // TODO: revisit
            setTimeout(function() { // In order for the positioning animation to work, we need to let the browser render the appended DOM element
                showPage(page.selector, $rootElement, true);
            }, 1);
            Events.postLocationsViewed(pageData, groupSettings);
        });
    }

    function setWindowTitle(title) {
        $(ractive.find('.antenna-reactions-title')).html(title);
    }

}

function rootElement(ractive) {
    return ractive.find(SELECTOR_REACTIONS_WIDGET);
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

function goBackToPage(pages, pageSelector, $rootElement) {
    var $targetPage = $rootElement.find(pageSelector);
    var $currentPage = $rootElement.find('.antenna-page-active');
    // Move the target page into place, under the current page
    $targetPage.css('z-index', parseInt($currentPage.css('z-index')) - 1);
    $targetPage.toggleClass('antenna-page-animate', false);
    $targetPage.toggleClass('antenna-page-active', true);

    // Then animate the current page moving away to reveal the target.
    $currentPage.toggleClass('antenna-page-animate', true);
    TransitionUtil.toggleClass($currentPage, 'antenna-page-active', false, function () {
        // After the current page slides into position, move all other pages back out of the viewable area
        $rootElement.find('.antenna-page').not(pageSelector).removeClass('antenna-page-active');
        $targetPage.css('z-index', pageZ++); // When the animation is done, make sure the current page has the highest z-index (just for consistency)
        // Teardown all other pages. They'll be re-created if necessary.
        for (var i = 0; i < pages.length - 1; i++) {
            pages[i].teardown();
        }
        pages.splice(0, pages.length - 1);
    });
    sizeBodyToFit($rootElement, $targetPage, true);
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
        if ($(event.target).closest(SELECTOR_REACTIONS_WIDGET).length === 0) {
            closeAllWindows();
        }
    });
    var tapListener = TouchSupport.setupTap(document, function(event) {
        if ($(event.target).closest(SELECTOR_REACTIONS_WIDGET).length === 0) {
            event.preventDefault();
            closeAllWindows();
        }
    });

    var closeTimer;

    function delayedCloseWindow() {
        closeTimer = setTimeout(function() {
            closeTimer = null;
            closeAllWindows();
        }, 500);
    }

    function keepWindowOpen() {
        clearTimeout(closeTimer);
    }

    ractive.on('internalCloseWindow', function() {
        // Closes one particular reaction window. This function should only be called from closeAllWindows, which also
        // cleans up the handles we maintain to all windows.
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
    });
}

function closeAllWindows() {
    for (var i = 0; i < openInstances.length; i++) {
        openInstances[i].fire('internalCloseWindow');
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
    PAGE_REACTIONS: PAGE_REACTIONS,
    PAGE_DEFAULTS: PAGE_DEFAULTS,
    PAGE_AUTO: PAGE_AUTO,
    selector: SELECTOR_REACTIONS_WIDGET
};
},{"../templates/reactions-widget.hbs.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/reactions-widget.hbs.html","./comments-page":"/Users/jburns/antenna/rb/static/widget-new/src/js/comments-page.js","./confirmation-page":"/Users/jburns/antenna/rb/static/widget-new/src/js/confirmation-page.js","./defaults-page":"/Users/jburns/antenna/rb/static/widget-new/src/js/defaults-page.js","./events":"/Users/jburns/antenna/rb/static/widget-new/src/js/events.js","./locations-page":"/Users/jburns/antenna/rb/static/widget-new/src/js/locations-page.js","./page-data":"/Users/jburns/antenna/rb/static/widget-new/src/js/page-data.js","./reactions-page":"/Users/jburns/antenna/rb/static/widget-new/src/js/reactions-page.js","./svgs":"/Users/jburns/antenna/rb/static/widget-new/src/js/svgs.js","./utils/ajax-client":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/ajax-client.js","./utils/jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js","./utils/messages":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/messages.js","./utils/moveable":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/moveable.js","./utils/ractive-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/ractive-provider.js","./utils/range":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/range.js","./utils/touch-support":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/touch-support.js","./utils/transition-util":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/transition-util.js","./utils/urls":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/urls.js","./utils/widget-bucket":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/widget-bucket.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/script-loader.js":[function(require,module,exports){
var RactiveProvider = require('./utils/ractive-provider');
var RangyProvider = require('./utils/rangy-provider');
var JQueryProvider = require('./utils/jquery-provider');
var AppMode = require('./utils/app-mode');
var URLConstants = require('./utils/url-constants');

var baseUrl;
if (AppMode.test) {
    baseUrl = URLConstants.TEST;
} else if (AppMode.offline) {
    baseUrl = URLConstants.DEVELOPMENT;
} else {
    baseUrl = URLConstants.PRODUCTION;
}

var scripts = [
    {src: '//cdnjs.cloudflare.com/ajax/libs/jquery/2.1.4/jquery.min.js', callback: JQueryProvider.loaded},
    {src: baseUrl + '/static/js/cdn/ractive/0.7.3/ractive.runtime.js', callback: RactiveProvider.loaded, aboutToLoad: RactiveProvider.aboutToLoad},
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
},{"./utils/app-mode":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/app-mode.js","./utils/jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js","./utils/ractive-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/ractive-provider.js","./utils/rangy-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/rangy-provider.js","./utils/url-constants":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/url-constants.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/summary-widget.js":[function(require,module,exports){
var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var BrowserMetrics = require('./utils/browser-metrics');
var Ractive; require('./utils/ractive-provider').onLoad(function(loadedRactive) { Ractive = loadedRactive;});
var TouchSupport = require('./utils/touch-support');

var ReactionsWidget = require('./reactions-widget');
var SVGs = require('./svgs');

function createSummaryWidget(containerData, pageData, defaultReactions, groupSettings) {
    var ractive = Ractive({
        el: $('<div>'), // the real root node is in the template. it's extracted after the template is rendered into this dummy element
        data: {
            pageData: pageData,
            computeExpandedReactions: computeExpandedReactions(groupSettings)
        },
        magic: true,
        template: require('../templates/summary-widget.hbs.html'),
        partials: {
            logo: SVGs.logo
        }
    });
    var $rootElement = $(rootElement(ractive));
    $rootElement.on('mouseenter', function(event) {
       openReactionsWindow(containerData, pageData, defaultReactions, groupSettings, ractive);
    });
    TouchSupport.setupTap($rootElement.get(0), function(event) {
        if (!ReactionsWidget.isOpen()) {
            event.preventDefault();
            openReactionsWindow(containerData, pageData, defaultReactions, groupSettings, ractive);
        }
    });
    return $rootElement;
}

function rootElement(ractive) {
    return ractive.find('.antenna-summary-widget');
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

function shouldUseExpandedSummary(groupSettings) {
    return groupSettings.isExpandedMobileSummary() && BrowserMetrics.isMobile();
}

function computeExpandedReactions(groupSettings) {
    return function(reactionsData) {
        if (shouldUseExpandedSummary(groupSettings)) {
            var defaultReactions = groupSettings.defaultReactions();
            var max = 2;
            var expandedReactions = [];
            for (var i = 0; i < reactionsData.length && expandedReactions.length < max; i++) {
                var reactionData = reactionsData[i];
                if (isDefaultReaction(reactionData, defaultReactions)) {
                    expandedReactions.push(reactionData);
                }
            }
            return expandedReactions;
        }
    };
}

function isDefaultReaction(reactionData, defaultReactions) {
    for (var i = 0; i < defaultReactions.length; i++) {
        if (defaultReactions[i].text === reactionData.text) {
            return true;
        }
    }
    return false;
}

//noinspection JSUnresolvedVariable
module.exports = {
    create: createSummaryWidget
};
},{"../templates/summary-widget.hbs.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/summary-widget.hbs.html","./reactions-widget":"/Users/jburns/antenna/rb/static/widget-new/src/js/reactions-widget.js","./svgs":"/Users/jburns/antenna/rb/static/widget-new/src/js/svgs.js","./utils/browser-metrics":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/browser-metrics.js","./utils/jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js","./utils/ractive-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/ractive-provider.js","./utils/touch-support":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/touch-support.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/svgs.js":[function(require,module,exports){
var Ractive; require('./utils/ractive-provider').onLoad(function(loadedRactive) { Ractive = loadedRactive;});

// About how we handle icons: We insert a single SVG element at the top of the body element which defines all of the
// icons we need. Then all icons used by the applications are rendered with very lightweight SVG elements that simply
// point to the appropriate icon by reference.

// TODO: look into using a single template for the "use" SVGs. Can we instantiate a partial with a dynamic context?
var templates = {
    logo: require('../templates/svg-logo.hbs.html'),
    // The "selectable" logo defines an inline 'path' rather than a 'use' reference, as a workaround for a Firefox text selection bug.
    logoSelectable: require('../templates/svg-logo-selectable.hbs.html'),
    comments: require('../templates/svg-comments.hbs.html'),
    location: require('../templates/svg-location.hbs.html'),
    facebook: require('../templates/svg-facebook.hbs.html'),
    twitter: require('../templates/svg-twitter.hbs.html'),
    left: require('../templates/svg-left.hbs.html')
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
    logoSelectable: getSVG(templates.logoSelectable),
    comments: getSVG(templates.comments),
    location: getSVG(templates.location),
    facebook: getSVG(templates.facebook),
    twitter: getSVG(templates.twitter),
    left: getSVG(templates.left)
};
},{"../templates/svg-comments.hbs.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/svg-comments.hbs.html","../templates/svg-facebook.hbs.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/svg-facebook.hbs.html","../templates/svg-left.hbs.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/svg-left.hbs.html","../templates/svg-location.hbs.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/svg-location.hbs.html","../templates/svg-logo-selectable.hbs.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/svg-logo-selectable.hbs.html","../templates/svg-logo.hbs.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/svg-logo.hbs.html","../templates/svg-twitter.hbs.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/svg-twitter.hbs.html","../templates/svgs.hbs.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/svgs.hbs.html","./utils/ractive-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/ractive-provider.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/text-indicator-widget.js":[function(require,module,exports){
var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var Ractive; require('./utils/ractive-provider').onLoad(function(loadedRactive) { Ractive = loadedRactive;});
var Range = require('./utils/range');
var TouchSupport = require('./utils/touch-support');

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
            logo: SVGs.logoSelectable
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
    TouchSupport.setupTap($rootElement.get(0), function(event) {
        event.preventDefault();
        openReactionsWindow(reactionWidgetOptions, ractive)
    });
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
},{"../templates/text-indicator-widget.hbs.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/text-indicator-widget.hbs.html","./popup-widget":"/Users/jburns/antenna/rb/static/widget-new/src/js/popup-widget.js","./reactions-widget":"/Users/jburns/antenna/rb/static/widget-new/src/js/reactions-widget.js","./svgs":"/Users/jburns/antenna/rb/static/widget-new/src/js/svgs.js","./utils/jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js","./utils/ractive-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/ractive-provider.js","./utils/range":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/range.js","./utils/touch-support":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/touch-support.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/text-reactions.js":[function(require,module,exports){
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
        if (!ReactionsWidget.isOpen() && $(event.target).closest('a').length === 0) {
            event.preventDefault();
            var touch = event.changedTouches[0];
            var coords = { top: touch.pageY, left: touch.pageX };
            setTimeout(function() { // Let this event finish processing before opening the reactions window so the window doesn't also process the event.
                grabNodeAndOpen(element, reactionsWidgetOptions, coords);
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
var AppMode = require('./app-mode');
var XDMClient = require('./xdm-client');
var URLs = require('./urls');
var URLConstants = require('./url-constants');
var User = require('./user');


function postNewReaction(reactionData, containerData, pageData, contentData, success, error) {
    var contentBody = contentData.body;
    var contentType = contentData.type;
    var contentLocation = contentData.location;
    var contentDimensions = contentData.dimensions;
    XDMClient.getUser(function(userInfo) {
        // TODO extract the shape of this data and possibly the whole API call
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
        getJSONP(URLs.createReactionUrl(), data, newReactionSuccess(contentLocation, containerData, pageData, success), error);
    });
}

function postPlusOne(reactionData, containerData, pageData, success, error) {
    XDMClient.getUser(function(userInfo) {
        // TODO extract the shape of this data and possibly the whole API call
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
        getJSONP(URLs.createReactionUrl(), data, plusOneSuccess(reactionData, containerData, pageData, success), error);
    });
}

function postComment(comment, reactionData, containerData, pageData, success, error) {
    // TODO: refactor the post functions to eliminate all the copied code
    XDMClient.getUser(function(userInfo) {
        // TODO extract the shape of this data and possibly the whole API call
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
                parent_id: reactionData.parentID
            },
            user_id: userInfo.user_id,
            ant_token: userInfo.ant_token,
            page_id: pageData.pageId,
            group_id: pageData.groupId
        };
        getJSONP(URLs.createCommentUrl(), data, commentSuccess(reactionData, containerData, pageData, success), error);
    });
}

function contentNodeDataKind(type) {
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
        callback(reactionData);
    }
}

function newReactionSuccess(contentLocation, containerData, pageData, callback) {
    return function(response) {
        // TODO: Can response.existing ever come back true for a 'new' reaction? Should we behave any differently if it does?
        var reaction = reactionFromResponse(response, contentLocation);
        callback(reaction);
    };
}

function reactionFromResponse(response, contentLocation) {
    // TODO: the server should give us back a reaction matching the new API format.
    //       we're just faking it out for now; this code is temporary
    var reaction = {
        text: response.interaction.interaction_node.body,
        id: response.interaction.interaction_node.id,
        count: 1,
        parentID: response.interaction.id
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
    XDMClient.getUser(function(userInfo) {
        var data = {
            reaction_id: reaction.parentID,
            user_id: userInfo.user_id,
            ant_token: userInfo.ant_token
        };
        getJSONP(URLs.fetchCommentUrl(), data, function(response) {
            callback(commentsFromResponse(response));
        }, function(message) {
            // TODO: error handling
            console.log('An error occurred fetching comments: ' + message);
        });
    });
}

function fetchLocationDetails(reactionLocationData, pageData, callback) {
    var contentIDs = Object.getOwnPropertyNames(reactionLocationData);
    XDMClient.getUser(function(userInfo) {
        var data = {
            user_id: userInfo.user_id,
            ant_token: userInfo.ant_token,
            content_ids: contentIDs
        };
        getJSONP(URLs.fetchContentBodiesUrl(), data, function(response) {
            callback(response);
        }, function(message) {
            // TODO: error handling
            console.log('An error occurred fetching content bodies: ' + message);
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
            user: User.fromCommentJSON(jsonComment.user, jsonComment.social_user)
        };
        comments.push(comment);
    }
    return comments;
}

function getJSONP(url, data, success, error) {
    var baseUrl;
    if (AppMode.test) {
        baseUrl = URLConstants.TEST;
    } else if (AppMode.offline) {
        baseUrl = URLConstants.DEVELOPMENT;
    } else {
        baseUrl = URLConstants.PRODUCTION;
    }
    doGetJSONP(baseUrl, url, data, success, error);
}

function postEvent(event) {
    var baseUrl;
    if (AppMode.offline) {
        baseUrl = URLConstants.DEVELOPMENT_EVENTS;
        console.log('Posting event: ' + JSON.stringify(event));
    } else {
        baseUrl = URLConstants.PRODUCTION_EVENTS;
    }
    doGetJSONP(baseUrl, URLs.eventUrl(), event, function() { /*success*/ }, function(error) {
        // TODO: error handling
        console.log('An error occurred posting event: ', error);
    });
}

// Issues a JSONP request to a given server. To send a request to the application server, use getJSONP instead.
function doGetJSONP(baseUrl, url, data, success, error) {
    var options = {
        url: baseUrl + url,
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
    $.ajax(options);
}

//noinspection JSUnresolvedVariable
module.exports = {
    getJSONP: getJSONP,
    postPlusOne: postPlusOne,
    postNewReaction: postNewReaction,
    postComment: postComment,
    getComments: getComments,
    fetchLocationDetails: fetchLocationDetails,
    postEvent: postEvent
};
},{"./app-mode":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/app-mode.js","./jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js","./url-constants":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/url-constants.js","./urls":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/urls.js","./user":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/user.js","./xdm-client":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/xdm-client.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/app-mode.js":[function(require,module,exports){
var URLConstants = require('./url-constants');

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
    offline: currentScriptSrc.indexOf(URLConstants.DEVELOPMENT) !== -1 || currentScriptSrc.indexOf(URLConstants.TEST) !== -1,
    test: currentScriptSrc.indexOf(URLConstants.TEST) !== -1,
    debug: currentScriptSrc.indexOf('?debug') !== -1
};
},{"./url-constants":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/url-constants.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/browser-metrics.js":[function(require,module,exports){

var isTouchBrowser;
var isMobileDevice;

function supportsTouch() {
    if (isTouchBrowser === undefined) {
        isTouchBrowser = (navigator.msMaxTouchPoints || "ontouchstart" in window) && ((window.matchMedia("only screen and (max-width: 768px)")).matches);
    }
    return isTouchBrowser;
}

function isMobile() {
    if (isMobileDevice === undefined) {
        isMobileDevice = supportsTouch() && ((window.matchMedia("only screen and (max-width: 480px)")).matches);
    }
    return isMobileDevice;
}


module.exports = {
    supportsTouch: supportsTouch,
    isMobile: isMobile
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

var loadedjQuery;
var callbacks = [];

// Notifies the jQuery provider that we've loaded the jQuery library.
function loaded() {
    loadedjQuery = jQuery.noConflict();
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
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/md5.js":[function(require,module,exports){

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
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/messages-en.js":[function(require,module,exports){
//noinspection JSUnresolvedVariable
module.exports = {
    'summary-widget_reactions': 'Reactions',
    'summary-widget_reactions_one': '1 Reaction',
    'summary-widget_reactions_many': '{0} Reactions',

    'reactions-widget_title': 'Reactions',
    'reactions-widget_title_thanks': 'Thanks for your reaction!',

    'reactions-page_no_reactions': 'No reactions yet!',
    'reactions-page_think': 'What do you think?',

    'media-indicator_think': 'What do you think?',

    'popup-widget_think': 'What do you think?',

    'defaults-page_add': '+ Add Your Own',
    'defaults-page_ok': 'ok',

    'confirmation-page_share': 'Share your reaction:',

    'comments-page_back': 'Back',
    'comments-page_header': '({0}) Comments:',

    'comment-area_add': 'Comment',
    'comment-area_placeholder': 'Add comments or #hashtags',
    'comment-area_thanks': 'Thanks for your comment.',
    'comment-area_count': '<span class="antenna-comment-count"></span> characters left',

    'locations-page_pagelevel': 'To this whole page',
    'locations-page_count_one': '<span class="antenna-location-count">1</span><br>reaction',
    'locations-page_count_many': '<span class="antenna-location-count">{0}</span><br>reactions',
    'locations-page_back': 'Back',

    'call-to-action-label_responses': 'Responses',
    'call-to-action-label_responses_one': '1 Response',
    'call-to-action-label_responses_many': '{0} Responses'
};
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/messages-es.js":[function(require,module,exports){
//noinspection JSUnresolvedVariable
module.exports = {
    'summary-widget_reactions': "Reacciones",
    'summary-widget_reactions_one': "1 Reacción",
    'summary-widget_reactions_many': "{0} Reacciones",

    'reactions-widget_title': "Reacciones",
    'reactions-widget_title_thanks': 'Gracias por tu reacción!',

    'reactions-page_no_reactions': 'No reacciones!', // TODO: need a translation of "No reactions yet!"
    'reactions-page_think': '¿Qué piensas?',

    'media-indicator_think': '¿Qué piensas?',

    'popup-widget_think': '¿Qué piensas?',

    'defaults-page_add': '+ Añade lo tuyo',
    'defaults-page_ok': 'ok', // TODO: is this right? 'acceptar'?

    'confirmation-page_share': 'Comparte tu reacción:',

    'comments-page_back': 'Cerrar', // TODO: need a translation for "Back"
    'comments-page_header': '({0}) Comentas:',

    'comment-area_add': 'Comenta',
    'comment-area_placeholder': 'Añade comentarios o #hashtags',
    'comment-area_thanks': 'Gracias por tu reacción.',
    'comment-area_count': 'Quedan <span class="antenna-comment-count"></span> caracteres',

    'locations-page_pagelevel': 'A esta página', // TODO: need a translation of "To this whole page"
    'locations-page_count_one': '<span class="antenna-location-count">1</span><br>reacción',
    'locations-page_count_many': '<span class="antenna-location-count">{0}</span><br>reacciones',
    'locations-page_back': 'Cerrar', // TODO: need a translation for "Back"

    'call-to-action-label_responses': 'Respuestas', // TODO: need a translation of "Responses"
    'call-to-action-label_responses_one': '1 Respuesta', // TODO
    'call-to-action-label_responses_many': '{0} Respuestas' // TODO
};
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/messages.js":[function(require,module,exports){
var GroupSettings = require('../group-settings');

var EnglishMessages = require('./messages-en');
var SpanishMessages = require('./messages-es');
validateTranslations();

function validateTranslations() {
    for (var englishKey in EnglishMessages) {
        if (EnglishMessages.hasOwnProperty(englishKey)) {
            if (!SpanishMessages.hasOwnProperty(englishKey)) {
                console.debug('Antenna warning: Spanish translation missing for key ' + englishKey);
            }
        }
    }
}

function getMessage(key, values) {
    var string = getLocalizedString(key, GroupSettings.get().language());
    if (values) {
        return format(string, values);
    }
    return string;
}

function getLocalizedString(key, lang) {
    var string;
    switch(lang) {
        case 'en':
            string = EnglishMessages[key];
            break;
        case 'es':
            string = SpanishMessages[key];
            break;
        default:
            // TODO: review
            console.log('Invalid language specified in Antenna group settings.');
            break;
    }
    if (!string) { // Default to English
        string = EnglishMessages[key];
    }
    // TODO: handle missing key
    return string;
}

function format(string, values) {
    // Popular, simple algorithm from http://javascript.crockford.com/remedial.html
    return string.replace(
        /\{([^{}]*)\}/g,
        function (a, b) {
            var r = values[b];
            return typeof r === 'string' || typeof r === 'number' ? r : a;
        }
    );
}

//noinspection JSUnresolvedVariable
module.exports = {
    getMessage: getMessage
};
},{"../group-settings":"/Users/jburns/antenna/rb/static/widget-new/src/js/group-settings.js","./messages-en":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/messages-en.js","./messages-es":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/messages-es.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/moveable.js":[function(require,module,exports){
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
    // TODO: This should be a configurable group setting like the other page properties.
    return getAttributeValue('meta[property="og:title"]', 'content') || $('title').text().trim();
}

function computePageTitle($page, groupSettings) {
    var pageTitle = $page.find(groupSettings.pageLinkSelector()).text().trim();
    if (pageTitle === '') {
        pageTitle = computeTopLevelPageTitle();
    }
    return pageTitle;
}

function computeTopLevelPageImage(groupSettings) {
    return getAttributeValue(groupSettings.pageImageSelector(), groupSettings.pageImageAttribute());
}

function computePageAuthor(groupSettings) {
    return getAttributeValue(groupSettings.pageAuthorSelector(), groupSettings.pageAuthorAttribute());
}

function computePageTopics(groupSettings) {
    return getAttributeValue(groupSettings.pageTopicsSelector(), groupSettings.pageTopicsAttribute());
}

function computePageSiteSection(groupSettings) {
    return getAttributeValue(groupSettings.pageSiteSectionSelector(), groupSettings.pageSiteSectionAttribute());
}

function getAttributeValue(elementSelector, attributeSelector) {
    var value = '';
    if (elementSelector && attributeSelector) {
        value = $(elementSelector).attr(attributeSelector) || '';
    }
    return value.trim();
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
    computeTopLevelPageImage: computeTopLevelPageImage,
    computePageAuthor: computePageAuthor,
    computePageTopics: computePageTopics,
    computePageSiteSection: computePageSiteSection
};
},{"./jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/ractive-events-tap.js":[function(require,module,exports){
// Tap/fastclick event plugin for Ractive.js - eliminates the 300ms delay on touch-enabled devices, and normalises
// across mouse, touch and pointer events.
// Author: Rich Harris
// License: MIT
// Source: https://github.com/ractivejs/ractive-events-tap
(function (global, factory) {
	module.exports = factory();
}(this, function () { 'use strict';

	var DISTANCE_THRESHOLD = 5; // maximum pixels pointer can move before cancel
	var TIME_THRESHOLD = 400; // maximum milliseconds between down and up before cancel

	function tap(node, callback) {
		return new TapHandler(node, callback);
	}

	function TapHandler(node, callback) {
		this.node = node;
		this.callback = callback;

		this.preventMousedownEvents = false;

		this.bind(node);
	}

	TapHandler.prototype = {
		bind: function bind(node) {
			// listen for mouse/pointer events...
			if (window.navigator.pointerEnabled) {
				node.addEventListener('pointerdown', handleMousedown, false);
			} else if (window.navigator.msPointerEnabled) {
				node.addEventListener('MSPointerDown', handleMousedown, false);
			} else {
				node.addEventListener('mousedown', handleMousedown, false);
			}

			// ...and touch events
			node.addEventListener('touchstart', handleTouchstart, false);

			// native buttons, and <input type='button'> elements, should fire a tap event
			// when the space key is pressed
			if (node.tagName === 'BUTTON' || node.type === 'button') {
				node.addEventListener('focus', handleFocus, false);
			}

			node.__tap_handler__ = this;
		},
		fire: function fire(event, x, y) {
			this.callback({
				node: this.node,
				original: event,
				x: x,
				y: y
			});
		},
		mousedown: function mousedown(event) {
			var _this = this;

			if (this.preventMousedownEvents) {
				return;
			}

			if (event.which !== undefined && event.which !== 1) {
				return;
			}

			var x = event.clientX;
			var y = event.clientY;

			// This will be null for mouse events.
			var pointerId = event.pointerId;

			var handleMouseup = function handleMouseup(event) {
				if (event.pointerId != pointerId) {
					return;
				}

				_this.fire(event, x, y);
				cancel();
			};

			var handleMousemove = function handleMousemove(event) {
				if (event.pointerId != pointerId) {
					return;
				}

				if (Math.abs(event.clientX - x) >= DISTANCE_THRESHOLD || Math.abs(event.clientY - y) >= DISTANCE_THRESHOLD) {
					cancel();
				}
			};

			var cancel = function cancel() {
				_this.node.removeEventListener('MSPointerUp', handleMouseup, false);
				document.removeEventListener('MSPointerMove', handleMousemove, false);
				document.removeEventListener('MSPointerCancel', cancel, false);
				_this.node.removeEventListener('pointerup', handleMouseup, false);
				document.removeEventListener('pointermove', handleMousemove, false);
				document.removeEventListener('pointercancel', cancel, false);
				_this.node.removeEventListener('click', handleMouseup, false);
				document.removeEventListener('mousemove', handleMousemove, false);
			};

			if (window.navigator.pointerEnabled) {
				this.node.addEventListener('pointerup', handleMouseup, false);
				document.addEventListener('pointermove', handleMousemove, false);
				document.addEventListener('pointercancel', cancel, false);
			} else if (window.navigator.msPointerEnabled) {
				this.node.addEventListener('MSPointerUp', handleMouseup, false);
				document.addEventListener('MSPointerMove', handleMousemove, false);
				document.addEventListener('MSPointerCancel', cancel, false);
			} else {
				this.node.addEventListener('click', handleMouseup, false);
				document.addEventListener('mousemove', handleMousemove, false);
			}

			setTimeout(cancel, TIME_THRESHOLD);
		},
		touchdown: function touchdown() {
			var _this2 = this;

			var touch = event.touches[0];

			var x = touch.clientX;
			var y = touch.clientY;

			var finger = touch.identifier;

			var handleTouchup = function handleTouchup(event) {
				var touch = event.changedTouches[0];

				if (touch.identifier !== finger) {
					cancel();
					return;
				}

				event.preventDefault(); // prevent compatibility mouse event

				// for the benefit of mobile Firefox and old Android browsers, we need this absurd hack.
				_this2.preventMousedownEvents = true;
				clearTimeout(_this2.preventMousedownTimeout);

				_this2.preventMousedownTimeout = setTimeout(function () {
					_this2.preventMousedownEvents = false;
				}, 400);

				_this2.fire(event, x, y);
				cancel();
			};

			var handleTouchmove = function handleTouchmove(event) {
				if (event.touches.length !== 1 || event.touches[0].identifier !== finger) {
					cancel();
				}

				var touch = event.touches[0];
				if (Math.abs(touch.clientX - x) >= DISTANCE_THRESHOLD || Math.abs(touch.clientY - y) >= DISTANCE_THRESHOLD) {
					cancel();
				}
			};

			var cancel = function cancel() {
				_this2.node.removeEventListener('touchend', handleTouchup, false);
				window.removeEventListener('touchmove', handleTouchmove, false);
				window.removeEventListener('touchcancel', cancel, false);
			};

			this.node.addEventListener('touchend', handleTouchup, false);
			window.addEventListener('touchmove', handleTouchmove, false);
			window.addEventListener('touchcancel', cancel, false);

			setTimeout(cancel, TIME_THRESHOLD);
		},
		teardown: function teardown() {
			var node = this.node;

			node.removeEventListener('pointerdown', handleMousedown, false);
			node.removeEventListener('MSPointerDown', handleMousedown, false);
			node.removeEventListener('mousedown', handleMousedown, false);
			node.removeEventListener('touchstart', handleTouchstart, false);
			node.removeEventListener('focus', handleFocus, false);
		}
	};

	function handleMousedown(event) {
		this.__tap_handler__.mousedown(event);
	}

	function handleTouchstart(event) {
		this.__tap_handler__.touchdown(event);
	}

	function handleFocus() {
		this.addEventListener('keydown', handleKeydown, false);
		this.addEventListener('blur', handleBlur, false);
	}

	function handleBlur() {
		this.removeEventListener('keydown', handleKeydown, false);
		this.removeEventListener('blur', handleBlur, false);
	}

	function handleKeydown(event) {
		if (event.which === 32) {
			// space key
			this.__tap_handler__.fire();
		}
	}

	return tap;

}));
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/ractive-provider.js":[function(require,module,exports){
var $; require('./jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var RactiveEventsTap = require('./ractive-events-tap');

var Messages = require('./messages');

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
    loadedRactive.events.tap = RactiveEventsTap; // Make the 'on-tap' event plugin available to all instances
    loadedRactive.defaults.data.getMessage = Messages.getMessage; // Make getMessage available to all instances
    loadedRactive.defaults.twoway = false; // Change the default to disable two-way data bindings.
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
},{"./jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js","./messages":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/messages.js","./ractive-events-tap":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/ractive-events-tap.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/range.js":[function(require,module,exports){
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

var CLASS_FULL = 'antenna-full';
var CLASS_HALF = 'antenna-half';

function computeLayoutData(reactionsData) {
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
    var numFull = 0;
    for (var i = 0; i < numReactions; i++) {
        if (reactionsData[i].count > midValue) {
            layoutClasses[i] = CLASS_FULL;
            numFull++;
        } else {
            layoutClasses[i] = CLASS_HALF;
            numHalfsies++;
        }
    }
    if (numHalfsies % 2 !==0) {
        layoutClasses[numReactions - 1] = CLASS_FULL; // If there are an odd number, the last one goes full.
    }

    return {
        layoutClasses: layoutClasses
    };
}

function sizeReactionTextToFit($reactionsWindow) {
    return function sizeReactionTextToFit(node) {
        var $element = $(node);
        var originalDisplay = $reactionsWindow.css('display');
        if (originalDisplay === 'none') { // If we're sizing the boxes before the widget is displayed, temporarily display it offscreen.
            $reactionsWindow.css({display: 'block', left: '100%'});
        }
        var horizontalRatio = node.clientWidth / node.scrollWidth;
        if (horizontalRatio < 1.0) { // If the text doesn't fit, first try to wrap it to two lines. Then scale it down if still necessary.
            var text = node.innerHTML;
            var mid = Math.ceil(text.length / 2); // Look for the closest space to the middle, weighted slightly (Math.ceil) toward a space in the second half.
            var secondHalfIndex = text.indexOf(' ', mid);
            var firstHalfIndex = text.lastIndexOf(' ', mid);
            var splitIndex = Math.abs(secondHalfIndex - mid) < Math.abs(mid - firstHalfIndex) ? secondHalfIndex : firstHalfIndex;
            var verticalRatio;
            if (splitIndex > 1) {
                // Split the text and then see how it fits.
                node.innerHTML = text.slice(0, splitIndex) + '<br>' + text.slice(splitIndex);
                var wrappedHorizontalRatio = node.clientWidth / node.scrollWidth;
                var parentAvailableHeight = computeAvailableClientArea(node.parentNode);
                verticalRatio = node.scrollHeight / parentAvailableHeight;

                var verticalRatioMax = 0.4;
                if (verticalRatio && verticalRatio > verticalRatioMax) {
                    var scaleFactor = verticalRatioMax / verticalRatio;
                }
                if (wrappedHorizontalRatio < 1.0) {
                    scaleFactor = Math.min(scaleFactor, wrappedHorizontalRatio);
                }
                if (scaleFactor <= horizontalRatio) {
                    // If we ended up having to make the text small
                    node.innerHTML = text;
                    scaleFactor = horizontalRatio;
                }
                $element.css('font-size', Math.max(10, Math.floor(parseInt($element.css('font-size')) * scaleFactor) - 1));
            } else {
                $element.css('font-size', Math.max(10, Math.floor(parseInt($element.css('font-size')) * horizontalRatio) - 1));
            }
        }
        if (originalDisplay === 'none') {
            $reactionsWindow.css({display: '', left: ''});
        }
        return {
            teardown: function() {}
        };
    };
}

function computeAvailableClientArea(node) {
    var nodeStyle = window.getComputedStyle(node);
    return parseInt(nodeStyle.height) - parseInt(nodeStyle.paddingTop) - parseInt(nodeStyle.paddingBottom);
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
    var timeout = 400; // This is the time between touchstart and touchend that we use to distinguish a tap from a long press.
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
    setTimeout(function() {
        // This workaround gets us consistent transitionend events, which can otherwise be flaky if we're setting other
        // classes at the same time as transition classes.
        $element.toggleClass(className, state);
    }, 20);
}

module.exports = {
    toggleClass: toggleTransitionClass
};
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/url-constants.js":[function(require,module,exports){
var PROD_SERVER_URL = "https://www.antenna.is"; // TODO: www? how about antenna.is or api.antenna.is?
var DEV_SERVER_URL = window.location.protocol + "//local-static.antenna.is:8081";
var TEST_SERVER_URL = window.location.protocol + '//localhost:3000';

var PROD_EVENT_SERVER_URL = window.location.protocol + '//events.readrboard.com';
var DEV_EVENT_SERVER_URL = window.location.protocol + '//nodebq.docker:3000';

//noinspection JSUnresolvedVariable
module.exports = {
    PRODUCTION: PROD_SERVER_URL,
    DEVELOPMENT: DEV_SERVER_URL,
    TEST: TEST_SERVER_URL,
    PRODUCTION_EVENTS: PROD_EVENT_SERVER_URL,
    DEVELOPMENT_EVENTS: DEV_EVENT_SERVER_URL
};
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/urls.js":[function(require,module,exports){

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

function getEventUrl() {
    return '/insert'; // Note that this URL is for the event server, not the app server.
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
    groupSettingsUrl: getGroupSettingsUrl,
    pageDataUrl: getPageDataUrl,
    createReactionUrl: getCreateReactionUrl,
    createCommentUrl: getCreateCommentUrl,
    fetchCommentUrl: getFetchCommentUrl,
    fetchContentBodiesUrl: getFetchContentBodiesUrl,
    computeImageUrl: computeImageUrl,
    computeMediaUrl: computeMediaUrl,
    eventUrl: getEventUrl
};

},{}],"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/user.js":[function(require,module,exports){
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
var XdmLoader = require('./xdm-loader');

var Events = require('../events'); // TODO: resolve this backward dependency

// Register ourselves to hear messages
window.addEventListener("message", receiveMessage, false);

var callbacks = {
    'xdm loaded': xdmLoaded
};
var cache = {};

var isXDMLoaded = false;
// The initial message that XDM sends out when it loads
function xdmLoaded(data) {
    isXDMLoaded = true;
}

function setMessageHandler(messageKey, callback) {
    callbacks[messageKey] = callback;
}

function getUser(callback) {
    var message = 'getUser';
    postMessage(message, 'returning_user', success, validCacheEntry);

    function success(response) {
        var userInfo = response.detail;
        callback(userInfo);
    }

    function validCacheEntry(response) {
        var userInfo = response.detail;
        return userInfo && userInfo.ant_token && userInfo.user_id; // TODO && userInfo.user_type && social_user, etc.?
    }
}

function receiveMessage(event) {
    var eventOrigin = event.origin;
    if (eventOrigin === XdmLoader.ORIGIN) {
        var response = event.data;
        // TODO: The event.source property gives us the source window of the message and currently the XDM frame fires out
        // events that we receive before we ever try to post anything. So we *could* hold onto the window here and use it
        // for posting messages rather than looking for the XDM frame ourselves. Need to look at which events the XDM frame
        // fires out to all windows before being asked. Currently, it's more than "xdm loaded". Why?
        //var sourceWindow = event.source;

        var callbackKey = response.key;
        cache[callbackKey] = response;
        var callback = callbacks[callbackKey];
        if (callback) {
            callback(response);
        }
    }
}

function postMessage(message, callbackKey, callback, validCacheEntry) {
    if (isXDMLoaded) {
        var targetOrigin = XdmLoader.ORIGIN;
        callbacks[callbackKey] = callback;
        var cachedResponse = cache[callbackKey];
        if (cachedResponse !== undefined && validCacheEntry && validCacheEntry(cache[callbackKey])) {
            callback(cache[callbackKey]);
        } else {
            var xdmFrame = getXDMFrame();
            if (xdmFrame) {
                xdmFrame.postMessage(message, targetOrigin);
            }
        }
    } else {
        queueMessage(message, callbackKey, callback, validCacheEntry);
    }
}

var messageQueue = [];
var messageQueueTimer;

function queueMessage(message, callbackKey, callback, validCacheEntry) {
    // TODO: Review this idea. The main message we really need to queue up is the getUser request as part of the "group settings loaded"
    // event which fires very early (possibly "page data loaded" too). But what about the rest of the widget? Should we even show
    // the reaction window if the XDM frame isn't ready? Or should the widget wait to become visible until XDM is ready like the
    // way it waits for page data to load?
    messageQueue.push({message: message, callbackKey: callbackKey, callback: callback, validCacheEntry: validCacheEntry});
    if (!messageQueueTimer) {
        // Start the wait...
        var stopTime = Date.now() + 10000; // Give up after 10 seconds
        messageQueueTimer = setInterval(function() {
            if (isXDMLoaded || Date.now() > stopTime) {
                clearInterval(messageQueueTimer);
            }
            if (isXDMLoaded) {
                // TODO: Consider the timing issue where messages could sneak in and be processed while this loop is sleeping.
                for (var i = 0; i < messageQueue.length; i++) {
                    var dequeued = messageQueue[i];
                    postMessage(dequeued.message, dequeued.callbackKey, dequeued.callback, dequeued.validCacheEntry);
                }
            }
        }, 50);
    }
}

function getXDMFrame() {
    // TODO: Is this a security problem? What prevents someone from using this same name and intercepting our messages?
    return window.frames['ant-xdm-hidden'];
}

module.exports = {
    getUser: getUser,
    setMessageHandler: setMessageHandler
};
},{"../events":"/Users/jburns/antenna/rb/static/widget-new/src/js/events.js","./urls":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/urls.js","./xdm-loader":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/xdm-loader.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/xdm-loader.js":[function(require,module,exports){
var $; require('./jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var AppMode = require('./app-mode');
var URLConstants = require('./url-constants');
var WidgetBucket = require('./widget-bucket');

var XDM_ORIGIN = AppMode.offline ? URLConstants.DEVELOPMENT : URLConstants.PRODUCTION;

function createXDMframe(groupId) {
    //ANT.session.receiveMessage({}, function() {
    //    ANT.util.userLoginState();
    //});

    var iframeUrl = XDM_ORIGIN + "/static/widget-new/xdm/xdm.html",
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
    createXDMframe: createXDMframe,
    ORIGIN: XDM_ORIGIN
};
},{"./app-mode":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/app-mode.js","./jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js","./url-constants":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/url-constants.js","./widget-bucket":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/widget-bucket.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/xdm-analytics.js":[function(require,module,exports){
var XDMClient = require('./utils/xdm-client');
var Events = require('./events');
var GroupSettings = require('./group-settings');
var PageData = require('./page-data');

function startListening() {
    XDMClient.setMessageHandler('recircClick', recircClicked);
}

function recircClicked(response) {
    var reactionId = response.detail.referring_int_id;
    getPageData(response.detail.page_hash, function(pageData) {
        Events.postRecircClicked(pageData, reactionId, GroupSettings.get());
    });
}

function getPageData(pageHash, callback) {
    if (pageHash) {
        // This module loads very early in the app lifecycle and may receive events from the XDM frame before page
        // data has been loaded. Hold onto any such events until the page data loads or we timeout.
        var maxWaitTime = Date.now() + 10000; // Give up after 10 seconds
        var interval = setInterval(function () {
            var pageData = PageData.getPageData(pageHash);
            if (pageData) {
                callback(pageData);
                clearInterval(interval);
            }
            if (Date.now() > maxWaitTime) {
                clearInterval(interval);
            }
        }, 50);
    }
}

module.exports = {
    start: startListening
};
},{"./events":"/Users/jburns/antenna/rb/static/widget-new/src/js/events.js","./group-settings":"/Users/jburns/antenna/rb/static/widget-new/src/js/group-settings.js","./page-data":"/Users/jburns/antenna/rb/static/widget-new/src/js/page-data.js","./utils/xdm-client":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/xdm-client.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/templates/auto-call-to-action.hbs.html":[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna antenna-auto-cta"},"f":[{"t":7,"e":"div","a":{"class":"antenna-auto-cta-inner","ant-cta-for":[{"t":2,"r":"antItemId"}]},"f":[{"t":8,"r":"logo"},{"t":7,"e":"span","a":{"class":"antenna-auto-cta-label","ant-reactions-label-for":[{"t":2,"r":"antItemId"}]}},{"t":4,"f":[{"t":7,"e":"span","a":{"ant-expanded-reactions-for":[{"t":2,"r":"antItemId"}]}}],"n":50,"r":"expandReactions"}]}]}]}
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/templates/call-to-action-counter.hbs.html":[function(require,module,exports){
module.exports={"v":3,"t":[{"t":4,"f":[{"t":2,"r":"containerData.reactionTotal"}],"n":50,"x":{"r":["containerData.reactionTotal","containerData.loaded"],"s":"_0!==undefined&&_1"}}]}
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/templates/call-to-action-expanded-reactions.hbs.html":[function(require,module,exports){
module.exports={"v":3,"t":[{"t":4,"f":[{"t":7,"e":"span","a":{"class":["antenna-cta-expanded-reaction ",{"t":4,"f":["antenna-cta-expanded-first"],"n":50,"x":{"r":["@index"],"s":"_0===0"}}]},"f":[{"t":7,"e":"span","a":{"class":"antenna-cta-expanded-text"},"f":[{"t":2,"r":"./text"}]},{"t":7,"e":"span","a":{"class":"antenna-cta-expanded-count"},"f":[{"t":2,"r":"./count"}]}]}],"x":{"r":["computeExpandedReactions","containerData.reactions"],"s":"_0(_1)"}}]}
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/templates/call-to-action-label.hbs.html":[function(require,module,exports){
module.exports={"v":3,"t":[{"t":4,"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"call-to-action-label_responses\")"}}],"n":50,"x":{"r":["containerData.reactionTotal","containerData.loaded"],"s":"_0===undefined||!_1"}},{"t":4,"n":51,"f":[{"t":4,"n":50,"x":{"r":["containerData.reactionTotal"],"s":"_0===1"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"call-to-action-label_responses_one\")"}}]},{"t":4,"n":50,"x":{"r":["containerData.reactionTotal"],"s":"!(_0===1)"},"f":[" ",{"t":2,"x":{"r":["getMessage","containerData.reactionTotal"],"s":"_0(\"call-to-action-label_responses_many\",[_1])"}}]}],"x":{"r":["containerData.reactionTotal","containerData.loaded"],"s":"_0===undefined||!_1"}}]}
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/templates/comment-area-partial.hbs.html":[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna-comment-area"},"f":[{"t":7,"e":"div","a":{"class":"antenna-comment-widgets"},"f":[{"t":7,"e":"textarea","v":{"input":"inputchanged"},"a":{"class":"antenna-comment-input","placeholder":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"comment-area_placeholder\")"}}],"maxlength":"500"}}," ",{"t":7,"e":"div","a":{"class":"antenna-comment-footer"},"f":[{"t":7,"e":"span","a":{"class":"antenna-comment-limit"},"f":[{"t":3,"x":{"r":["getMessage"],"s":"_0(\"comment-area_count\")"}}]}," ",{"t":7,"e":"button","a":{"class":"antenna-comment-submit"},"v":{"tap":"addcomment"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"comment-area_add\")"}}]}]}]}," ",{"t":7,"e":"div","a":{"class":"antenna-comment-waiting"},"f":["..."]}," ",{"t":7,"e":"div","a":{"class":"antenna-comment-received"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"comment-area_thanks\")"}}]}]}]}
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/templates/comments-page.hbs.html":[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna-page antenna-comments-page"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-body"},"f":[{"t":7,"e":"div","v":{"tap":"back"},"a":{"class":"antenna-comments-back"},"f":[{"t":8,"r":"left"},{"t":2,"x":{"r":["getMessage"],"s":"_0(\"comments-page_back\")"}}]}," ",{"t":7,"e":"div","a":{"class":"antenna-comments-header"},"f":[{"t":2,"x":{"r":["getMessage","comments.length"],"s":"_0(\"comments-page_header\",[_1])"}}]}," ",{"t":4,"f":[{"t":7,"e":"div","a":{"class":["antenna-comment-entry ",{"t":4,"f":["antenna-comment-new"],"n":50,"r":"./new"}]},"f":[{"t":7,"e":"table","f":[{"t":7,"e":"tr","f":[{"t":7,"e":"td","a":{"class":"antenna-comment-cell"},"f":[{"t":7,"e":"img","a":{"src":[{"t":2,"r":"./user.imageURL"}]}}]}," ",{"t":7,"e":"td","a":{"class":"antenna-comment-author"},"f":[{"t":2,"r":"./user.name"}]}]}," ",{"t":7,"e":"tr","f":[{"t":7,"e":"td","f":[]}," ",{"t":7,"e":"td","a":{"class":"antenna-comment-text"},"f":[{"t":2,"r":"./text"}]}]}]}]}],"i":"index","r":"comments"}," ",{"t":8,"r":"commentArea"}]}]}]}
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/templates/confirmation-page.hbs.html":[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna-page antenna-confirmation-page"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-body"},"f":[{"t":7,"e":"div","a":{"class":"antenna-comment-reaction"},"f":[{"t":2,"r":"text"}]}," ",{"t":8,"r":"commentArea"}]}," ",{"t":7,"e":"div","a":{"class":"antenna-footer antenna-confirm-footer"},"f":[{"t":7,"e":"span","v":{"tap":"share"},"a":{"class":"antenna-share"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"confirmation-page_share\")"}}," ",{"t":8,"r":"facebookIcon"},{"t":8,"r":"twitterIcon"}]}]}]}]}
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/templates/defaults-page.hbs.html":[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","v":{"keydown":"pagekeydown"},"a":{"class":"antenna-page antenna-defaults-page","tabindex":"0"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-body"},"f":[{"t":4,"f":[{"t":7,"e":"div","v":{"tap":"newreaction"},"a":{"class":["antenna-reaction ",{"t":2,"x":{"r":["defaultLayoutClass","index"],"s":"_0(_1)"}}]},"f":[{"t":7,"e":"div","a":{"class":"antenna-reaction-box"},"f":[{"t":7,"e":"div","a":{"class":"antenna-reaction-text"},"o":"sizetofit","f":[{"t":2,"r":"./text"}]}]}]}],"i":"index","r":"defaultReactions"}]}," ",{"t":7,"e":"div","a":{"class":"antenna-footer antenna-defaults-footer"},"f":[{"t":7,"e":"div","a":{"class":"antenna-custom-area"},"f":[{"t":7,"e":"input","v":{"focus":"customfocus","keydown":"inputkeydown","blur":"customblur"},"a":{"value":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"defaults-page_add\")"}}],"maxlength":"25"}}," ",{"t":7,"e":"button","v":{"tap":"addcustom"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"defaults-page_ok\")"}}]}]}," ",{"t":7,"e":"div","a":{"class":"antenna-text-logo"},"f":[{"t":7,"e":"a","a":{"href":"//www.antenna.is"},"f":["Antenna"]}]}]}]}]}
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/templates/locations-page.hbs.html":[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna-page antenna-locations-page"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-body"},"f":[{"t":7,"e":"div","v":{"tap":"back"},"a":{"class":"antenna-locations-back"},"f":[{"t":8,"r":"left"},{"t":2,"x":{"r":["getMessage"],"s":"_0(\"locations-page_back\")"}}]}," ",{"t":7,"e":"table","a":{"class":"antenna-locations-table"},"f":[{"t":4,"f":[{"t":7,"e":"tr","a":{"class":"antenna-locations-content-row"},"f":[{"t":7,"e":"td","a":{"class":"antenna-locations-count-cell"},"f":[{"t":4,"f":[{"t":3,"x":{"r":["getMessage"],"s":"_0(\"locations-page_count_one\")"}}],"n":50,"x":{"r":["pageReactionCount"],"s":"_0===1"}},{"t":4,"n":51,"f":[{"t":3,"x":{"r":["getMessage","pageReactionCount"],"s":"_0(\"locations-page_count_many\",[_1])"}}],"x":{"r":["pageReactionCount"],"s":"_0===1"}}]}," ",{"t":7,"e":"td","a":{"class":"antenna-locations-page-body"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"locations-page_pagelevel\")"}}]}]}],"n":50,"r":"pageReactionCount"}," ",{"t":4,"f":[{"t":4,"f":[" ",{"t":7,"e":"tr","v":{"tap":"reveal"},"a":{"class":["antenna-locations-content-row ",{"t":4,"f":["antenna-locate"],"n":50,"x":{"r":["canLocate","./containerHash"],"s":"_0(_1)"}}]},"f":[{"t":7,"e":"td","a":{"class":"antenna-locations-count-cell"},"f":[{"t":4,"f":[{"t":3,"x":{"r":["getMessage"],"s":"_0(\"locations-page_count_one\")"}}],"n":50,"x":{"r":["./count"],"s":"_0===1"}},{"t":4,"n":51,"f":[{"t":3,"x":{"r":["getMessage","./count"],"s":"_0(\"locations-page_count_many\",[_1])"}}],"x":{"r":["./count"],"s":"_0===1"}}]}," ",{"t":4,"f":[{"t":7,"e":"td","a":{"class":"antenna-locations-text-body"},"f":[{"t":2,"r":"./body"}]}],"n":50,"x":{"r":["./kind"],"s":"_0===\"txt\""}},{"t":4,"n":51,"f":[{"t":4,"n":50,"x":{"r":["./kind"],"s":"_0===\"img\""},"f":[{"t":7,"e":"td","a":{"class":"antenna-locations-image-body"},"f":[{"t":7,"e":"img","a":{"src":[{"t":2,"r":"./body"}]}}]}]},{"t":4,"n":50,"x":{"r":["./kind"],"s":"(!(_0===\"img\"))&&(_0===\"med\")"},"f":[" ",{"t":7,"e":"td","a":{"class":"antenna-locations-media-body"},"f":[{"t":7,"e":"img","a":{"src":"/static/widget/images/video_icon.png"}}," Video"]}]},{"t":4,"n":50,"x":{"r":["./kind"],"s":"(!(_0===\"img\"))&&(!(_0===\"med\"))"},"f":[" "]}],"x":{"r":["./kind"],"s":"_0===\"txt\""}}]}],"n":50,"x":{"r":["./kind"],"s":"_0!==\"pag\""}}],"i":"id","r":"locationData"}]}]}]}]}
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/templates/media-indicator-widget.hbs.html":[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"span","o":"cssreset","a":{"class":"antenna antenna-media-indicator-wrapper"},"f":[{"t":7,"e":"span","a":{"class":["antenna antenna-media-indicator-widget ",{"t":4,"f":["notloaded"],"n":51,"r":"containerData.loaded"}," ",{"t":4,"f":["hasreactions"],"n":50,"x":{"r":["containerData.reactionTotal"],"s":"_0>0"}}]},"m":[{"t":2,"r":"extraAttributes"}],"f":[{"t":8,"r":"logo"}," ",{"t":4,"f":[{"t":7,"e":"span","a":{"class":"antenna-reaction-total"},"f":[{"t":2,"r":"containerData.reactionTotal"}]}],"n":50,"r":"containerData.reactionTotal"},{"t":4,"n":51,"f":[{"t":7,"e":"span","a":{"class":"antenna-reaction-prompt"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"media-indicator_think\")"}}]}],"r":"containerData.reactionTotal"}]}]}]}
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/templates/popup-widget.hbs.html":[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna-popup"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-popup-body"},"f":[{"t":8,"r":"logo"},{"t":7,"e":"span","a":{"class":"antenna-popup-text"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"popup-widget_think\")"}}]}]}]}]}
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/templates/reactions-page.hbs.html":[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna-page antenna-reactions-page"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-body"},"f":[{"t":4,"f":[{"t":4,"f":[{"t":7,"e":"div","v":{"tap":"plusone","mouseenter":"highlight","mouseleave":"clearhighlights"},"a":{"class":["antenna-reaction ",{"t":2,"x":{"r":["reactionsLayoutClass","index","./count"],"s":"_0(_1,_2)"}}]},"f":[" ",{"t":7,"e":"div","a":{"class":"antenna-reaction-box"},"f":[{"t":7,"e":"div","a":{"class":"antenna-reaction-text"},"o":"sizetofit","f":[{"t":2,"r":"./text"}]}," ",{"t":7,"e":"div","a":{"class":"antenna-reaction-count"},"f":[{"t":2,"r":"./count"}]}," ",{"t":7,"e":"div","a":{"class":"antenna-plusone"},"f":["+1"]}," ",{"t":4,"f":[{"t":7,"e":"div","v":{"tap":"showlocations"},"a":{"class":"antenna-reaction-location"},"f":[{"t":8,"r":"locationIcon"}]}],"n":50,"r":"isSummary"},{"t":4,"n":51,"f":[{"t":4,"f":[{"t":7,"e":"div","v":{"tap":"showcomments"},"a":{"class":"antenna-reaction-comments hascomments"},"f":[{"t":8,"r":"commentsIcon"}," ",{"t":2,"r":"./commentCount"}]}],"n":50,"r":"./commentCount"},{"t":4,"n":51,"f":[{"t":7,"e":"div","a":{"class":"antenna-reaction-comments"},"f":[{"t":8,"r":"commentsIcon"}]}],"r":"./commentCount"}],"r":"isSummary"}]}]}],"i":"index","r":"reactions"}],"n":50,"r":"reactions"}]}," ",{"t":7,"e":"div","a":{"class":"antenna-footer antenna-reactions-footer"},"f":[{"t":4,"f":[{"t":7,"e":"div","v":{"tap":"showdefault"},"a":{"class":"antenna-think"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"reactions-page_think\")"}}]}],"n":50,"r":"reactions"},{"t":4,"n":51,"f":[{"t":7,"e":"div","a":{"class":"antenna-no-reactions"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"reactions-page_no_reactions\")"}}]}],"r":"reactions"}," ",{"t":7,"e":"div","a":{"class":"antenna-text-logo"},"f":[{"t":7,"e":"a","a":{"href":"//www.antenna.is"},"f":["Antenna"]}]}]}]}]}
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/templates/reactions-widget.hbs.html":[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna antenna-reactions-widget","tabindex":"0"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-header"},"f":[{"t":8,"r":"logo"},{"t":7,"e":"span","a":{"class":"antenna-reactions-title"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"reactions-widget_title\")"}}]}," ",{"t":7,"e":"span","v":{"tap":"close"},"a":{"class":"antenna-reactions-close"},"f":["X"]}]}," ",{"t":7,"e":"div","a":{"class":"antenna-page-container"},"f":[" ",{"t":7,"e":"div","a":{"class":"antenna-progress-page antenna-page"},"f":[{"t":7,"e":"div","a":{"class":"antenna-body"}}]}]}]}]}
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/templates/summary-widget.hbs.html":[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":["antenna antenna-summary-widget ",{"t":4,"f":["notloaded"],"n":51,"r":"pageData.summaryLoaded"}]},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-summary-inner"},"f":[{"t":8,"r":"logo"},{"t":7,"e":"span","a":{"class":"antenna-summary-title"},"f":[" ",{"t":4,"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"summary-widget_reactions\")"}}],"n":50,"x":{"r":["pageData.summaryTotal"],"s":"_0===0"}},{"t":4,"n":51,"f":[{"t":4,"n":50,"x":{"r":["pageData.summaryTotal"],"s":"_0===1"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"summary-widget_reactions_one\")"}}]},{"t":4,"n":50,"x":{"r":["pageData.summaryTotal"],"s":"!(_0===1)"},"f":[" ",{"t":2,"x":{"r":["getMessage","pageData.summaryTotal"],"s":"_0(\"summary-widget_reactions_many\",[_1])"}}]}],"x":{"r":["pageData.summaryTotal"],"s":"_0===0"}}]},{"t":4,"f":[" ",{"t":7,"e":"span","a":{"class":["antenna-expanded-reaction ",{"t":4,"f":["antenna-expanded-first"],"n":50,"x":{"r":["@index"],"s":"_0===0"}}]},"f":[{"t":7,"e":"span","a":{"class":"antenna-expanded-text"},"f":[{"t":2,"r":"./text"}]},{"t":7,"e":"span","a":{"class":"antenna-expanded-count"},"f":[{"t":2,"r":"./count"}]}]}],"x":{"r":["computeExpandedReactions","pageData.summaryReactions"],"s":"_0(_1)"}}]}]}]}
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/templates/svg-comments.hbs.html":[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"span","a":{"class":"antenna-comments"},"f":[{"t":7,"e":"svg","f":[{"t":7,"e":"use","a":{"class":"antenna-comments-path","xlink:href":"#antenna-svg-comment"}}]}]}]}
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/templates/svg-facebook.hbs.html":[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"span","a":{"class":"antenna-facebook"},"f":[{"t":7,"e":"svg","f":[{"t":7,"e":"use","a":{"class":"antenna-facebook-path","xlink:href":"#antenna-svg-facebook"}}]}]}]}
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/templates/svg-left.hbs.html":[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"span","a":{"class":"antenna-left"},"f":[{"t":7,"e":"svg","f":[{"t":7,"e":"use","a":{"class":"antenna-left-path","xlink:href":"#antenna-svg-left"}}]}]}]}
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/templates/svg-location.hbs.html":[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"span","a":{"class":"antenna-location"},"f":[{"t":7,"e":"svg","f":[{"t":7,"e":"use","a":{"class":"antenna-location-path","xlink:href":"#antenna-svg-search"}}]}]}]}
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/templates/svg-logo-selectable.hbs.html":[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"span","a":{"class":"antenna-logo"},"f":[{"t":7,"e":"svg","a":{"viewBox":"0 0 512 512"},"f":[" ",{"t":7,"e":"path","a":{"class":"antenna-logo-path","d":"m283 510c125-17 229-124 229-253 0-141-115-256-256-256-141 0-256 115-256 256 0 130 108 237 233 254l0-149c-48-14-84-50-84-102 0-65 43-113 108-113 65 0 107 48 107 113 0 52-33 88-81 102z"}}]}]}]}
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/templates/svg-logo.hbs.html":[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"span","a":{"class":"antenna-logo"},"f":[{"t":7,"e":"svg","f":[{"t":7,"e":"use","a":{"class":"antenna-logo-path","xlink:href":"#antenna-svg-logo"}}]}]}]}
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/templates/svg-twitter.hbs.html":[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"span","a":{"class":"antenna-twitter"},"f":[{"t":7,"e":"svg","f":[{"t":7,"e":"use","a":{"class":"antenna-twitter-path","xlink:href":"#antenna-svg-twitter"}}]}]}]}
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/templates/svgs.hbs.html":[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"svg","a":{"xmlns":"http://www.w3.org/2000/svg","style":"display: none;"},"f":[{"t":7,"e":"symbol","a":{"id":"antenna-svg-twitter","viewBox":"0 0 512 512"},"f":[{"t":7,"e":"path","a":{"d":"m453 134c-14 6-30 11-46 12c16-10 29-25 35-44c-15 9-33 16-51 19c-15-15-36-25-59-25c-45 0-81 36-81 81c0 6 1 12 2 18c-67-3-127-35-167-84c-7 12-11 25-11 40c0 28 15 53 36 68c-13-1-25-4-36-11c0 1 0 1 0 2c0 39 28 71 65 79c-7 2-14 3-22 3c-5 0-10-1-15-2c10 32 40 56 76 56c-28 22-63 35-101 35c-6 0-13 0-19-1c36 23 78 36 124 36c149 0 230-123 230-230c0-3 0-7 0-10c16-12 29-26 40-42z"}}]}," ",{"t":7,"e":"symbol","a":{"id":"antenna-svg-facebook","viewBox":"0 0 512 512"},"f":[{"t":7,"e":"path","a":{"d":"m420 72l-328 0c-11 0-20 9-20 20l0 328c0 11 9 20 20 20l177 0l0-142l-48 0l0-56l48 0l0-41c0-48 29-74 71-74c20 0 38 2 43 3l0 49l-29 0c-23 0-28 11-28 27l0 36l55 0l-7 56l-48 0l0 142l94 0c11 0 20-9 20-20l0-328c0-11-9-20-20-20z"}}]}," ",{"t":7,"e":"symbol","a":{"id":"antenna-svg-comment","viewBox":"0 0 512 512"},"f":[{"t":7,"e":"path","a":{"d":"m512 256c0 33-11 64-34 92c-23 28-54 50-93 66c-40 17-83 25-129 25c-13 0-27-1-41-2c-38 33-82 56-132 69c-9 2-20 4-32 6c-4 0-7 0-9-3c-3-2-4-4-5-8l0 0c-1-1-1-2 0-4c0-1 0-2 0-2c0-1 1-2 2-3l1-3c0 0 1-1 2-2c2-2 2-3 3-3c1-1 4-5 8-10c5-5 8-8 10-10c2-3 5-6 9-12c4-5 7-10 9-14c3-5 5-10 8-17c3-7 5-14 8-22c-30-17-54-38-71-63c-17-25-26-51-26-80c0-25 7-48 20-71c14-23 32-42 55-58c23-17 50-30 82-39c31-10 64-15 99-15c46 0 89 8 129 25c39 16 70 38 93 66c23 28 34 59 34 92z"}}]}," ",{"t":7,"e":"symbol","a":{"id":"antenna-svg-search","viewBox":"0 0 512 512"},"f":[{"t":7,"e":"path","a":{"d":"m347 238c0-36-12-66-37-91c-25-25-55-37-91-37c-35 0-65 12-90 37c-25 25-38 55-38 91c0 35 13 65 38 90c25 25 55 38 90 38c36 0 66-13 91-38c25-25 37-55 37-90z m147 237c0 10-4 19-11 26c-7 7-16 11-26 11c-10 0-19-4-26-11l-98-98c-34 24-72 36-114 36c-27 0-53-5-78-16c-25-11-46-25-64-43c-18-18-32-39-43-64c-10-25-16-51-16-78c0-28 6-54 16-78c11-25 25-47 43-65c18-18 39-32 64-43c25-10 51-15 78-15c28 0 54 5 79 15c24 11 46 25 64 43c18 18 32 40 43 65c10 24 16 50 16 78c0 42-12 80-36 114l98 98c7 7 11 15 11 25z"}}]}," ",{"t":7,"e":"symbol","a":{"id":"antenna-svg-left","viewBox":"0 0 512 512"},"f":[{"t":7,"e":"path","a":{"d":"m368 160l-64-64-160 160 160 160 64-64-96-96z"}}]}," ",{"t":7,"e":"symbol","a":{"id":"antenna-svg-logo","viewBox":"0 0 512 512"},"f":[" ",{"t":7,"e":"path","a":{"d":"m283 510c125-17 229-124 229-253 0-141-115-256-256-256-141 0-256 115-256 256 0 130 108 237 233 254l0-149c-48-14-84-50-84-102 0-65 43-113 108-113 65 0 107 48 107 113 0 52-33 88-81 102z"}}]}]}]}
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/templates/text-indicator-widget.hbs.html":[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"span","o":"cssreset","a":{"class":["antenna antenna-text-indicator-widget ",{"t":4,"f":["notloaded"],"n":51,"r":"containerData.loaded"}," ",{"t":4,"f":["hasreactions"],"n":50,"x":{"r":["containerData.reactionTotal"],"s":"_0>0"}}," ",{"t":4,"f":["antenna-suppress"],"n":50,"r":"containerData.suppress"}," ",{"t":2,"r":"extraClasses"}]},"f":[{"t":8,"r":"logo"}," ",{"t":4,"f":[{"t":7,"e":"span","a":{"class":"antenna-reaction-total"},"f":[{"t":2,"r":"containerData.reactionTotal"}]}],"n":50,"r":"containerData.reactionTotal"}]}]}
},{}]},{},["/Users/jburns/antenna/rb/static/widget-new/src/js/antenna-app.js","/Users/jburns/antenna/rb/static/widget-new/src/js/auto-call-to-action.js","/Users/jburns/antenna/rb/static/widget-new/src/js/call-to-action-counter.js","/Users/jburns/antenna/rb/static/widget-new/src/js/call-to-action-expanded-reactions.js","/Users/jburns/antenna/rb/static/widget-new/src/js/call-to-action-indicator.js","/Users/jburns/antenna/rb/static/widget-new/src/js/call-to-action-label.js","/Users/jburns/antenna/rb/static/widget-new/src/js/comment-area-partial.js","/Users/jburns/antenna/rb/static/widget-new/src/js/comments-page.js","/Users/jburns/antenna/rb/static/widget-new/src/js/confirmation-page.js","/Users/jburns/antenna/rb/static/widget-new/src/js/css-loader.js","/Users/jburns/antenna/rb/static/widget-new/src/js/defaults-page.js","/Users/jburns/antenna/rb/static/widget-new/src/js/events.js","/Users/jburns/antenna/rb/static/widget-new/src/js/group-settings-loader.js","/Users/jburns/antenna/rb/static/widget-new/src/js/group-settings.js","/Users/jburns/antenna/rb/static/widget-new/src/js/hashed-elements.js","/Users/jburns/antenna/rb/static/widget-new/src/js/locations-page.js","/Users/jburns/antenna/rb/static/widget-new/src/js/media-indicator-widget.js","/Users/jburns/antenna/rb/static/widget-new/src/js/page-data-loader.js","/Users/jburns/antenna/rb/static/widget-new/src/js/page-data.js","/Users/jburns/antenna/rb/static/widget-new/src/js/page-scanner.js","/Users/jburns/antenna/rb/static/widget-new/src/js/popup-widget.js","/Users/jburns/antenna/rb/static/widget-new/src/js/reactions-page.js","/Users/jburns/antenna/rb/static/widget-new/src/js/reactions-widget.js","/Users/jburns/antenna/rb/static/widget-new/src/js/script-loader.js","/Users/jburns/antenna/rb/static/widget-new/src/js/summary-widget.js","/Users/jburns/antenna/rb/static/widget-new/src/js/svgs.js","/Users/jburns/antenna/rb/static/widget-new/src/js/text-indicator-widget.js","/Users/jburns/antenna/rb/static/widget-new/src/js/text-reactions.js","/Users/jburns/antenna/rb/static/widget-new/src/js/xdm-analytics.js","/Users/jburns/antenna/rb/static/widget-new/src/templates/auto-call-to-action.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/call-to-action-counter.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/call-to-action-expanded-reactions.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/call-to-action-label.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/comment-area-partial.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/comments-page.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/confirmation-page.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/defaults-page.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/locations-page.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/media-indicator-widget.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/popup-widget.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/reactions-page.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/reactions-widget.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/summary-widget.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/svg-comments.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/svg-facebook.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/svg-left.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/svg-location.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/svg-logo-selectable.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/svg-logo.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/svg-twitter.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/svgs.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/text-indicator-widget.hbs.html"])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvYW50ZW5uYS1hcHAuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvYXV0by1jYWxsLXRvLWFjdGlvbi5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9jYWxsLXRvLWFjdGlvbi1jb3VudGVyLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL2NhbGwtdG8tYWN0aW9uLWV4cGFuZGVkLXJlYWN0aW9ucy5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9jYWxsLXRvLWFjdGlvbi1pbmRpY2F0b3IuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvY2FsbC10by1hY3Rpb24tbGFiZWwuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvY29tbWVudC1hcmVhLXBhcnRpYWwuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvY29tbWVudHMtcGFnZS5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9jb25maXJtYXRpb24tcGFnZS5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9jc3MtbG9hZGVyLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL2RlZmF1bHRzLXBhZ2UuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvZXZlbnRzLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL2dyb3VwLXNldHRpbmdzLWxvYWRlci5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9ncm91cC1zZXR0aW5ncy5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9oYXNoZWQtZWxlbWVudHMuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvbG9jYXRpb25zLXBhZ2UuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvbWVkaWEtaW5kaWNhdG9yLXdpZGdldC5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9wYWdlLWRhdGEtbG9hZGVyLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3BhZ2UtZGF0YS5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9wYWdlLXNjYW5uZXIuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvcG9wdXAtd2lkZ2V0LmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3JlYWN0aW9ucy1wYWdlLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3JlYWN0aW9ucy13aWRnZXQuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvc2NyaXB0LWxvYWRlci5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9zdW1tYXJ5LXdpZGdldC5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9zdmdzLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3RleHQtaW5kaWNhdG9yLXdpZGdldC5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy90ZXh0LXJlYWN0aW9ucy5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9hamF4LWNsaWVudC5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9hcHAtbW9kZS5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9icm93c2VyLW1ldHJpY3MuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvY2FsbGJhY2stc3VwcG9ydC5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9oYXNoLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL2pxdWVyeS1wcm92aWRlci5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9tZDUuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvbWVzc2FnZXMtZW4uanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvbWVzc2FnZXMtZXMuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvbWVzc2FnZXMuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvbW92ZWFibGUuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvbXV0YXRpb24tb2JzZXJ2ZXIuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvcGFnZS11dGlscy5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9yYWN0aXZlLWV2ZW50cy10YXAuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvcmFjdGl2ZS1wcm92aWRlci5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9yYW5nZS5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9yYW5neS1wcm92aWRlci5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9yZWFjdGlvbnMtd2lkZ2V0LWxheW91dC11dGlscy5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy90aHJvdHRsZWQtZXZlbnRzLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL3RvdWNoLXN1cHBvcnQuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvdHJhbnNpdGlvbi11dGlsLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL3VybC1jb25zdGFudHMuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvdXJscy5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy91c2VyLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL3dpZGdldC1idWNrZXQuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMveGRtLWNsaWVudC5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy94ZG0tbG9hZGVyLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3hkbS1hbmFseXRpY3MuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL2F1dG8tY2FsbC10by1hY3Rpb24uaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL2NhbGwtdG8tYWN0aW9uLWNvdW50ZXIuaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL2NhbGwtdG8tYWN0aW9uLWV4cGFuZGVkLXJlYWN0aW9ucy5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvY2FsbC10by1hY3Rpb24tbGFiZWwuaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL2NvbW1lbnQtYXJlYS1wYXJ0aWFsLmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9jb21tZW50cy1wYWdlLmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9jb25maXJtYXRpb24tcGFnZS5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvZGVmYXVsdHMtcGFnZS5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvbG9jYXRpb25zLXBhZ2UuaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL21lZGlhLWluZGljYXRvci13aWRnZXQuaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL3BvcHVwLXdpZGdldC5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvcmVhY3Rpb25zLXBhZ2UuaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL3JlYWN0aW9ucy13aWRnZXQuaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL3N1bW1hcnktd2lkZ2V0Lmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9zdmctY29tbWVudHMuaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL3N2Zy1mYWNlYm9vay5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvc3ZnLWxlZnQuaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL3N2Zy1sb2NhdGlvbi5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvc3ZnLWxvZ28tc2VsZWN0YWJsZS5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvc3ZnLWxvZ28uaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL3N2Zy10d2l0dGVyLmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9zdmdzLmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy90ZXh0LWluZGljYXRvci13aWRnZXQuaGJzLmh0bWwiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RRQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsT0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwYUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BDQTs7QUNBQTs7QUNBQTs7QUNBQTs7QUNBQTs7QUNBQTs7QUNBQTs7QUNBQTs7QUNBQTs7QUNBQTs7QUNBQTs7QUNBQTs7QUNBQTs7QUNBQTs7QUNBQTs7QUNBQTs7QUNBQTs7QUNBQTs7QUNBQTs7QUNBQTs7QUNBQTs7QUNBQTs7QUNBQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJcbnZhciBTY3JpcHRMb2FkZXIgPSByZXF1aXJlKCcuL3NjcmlwdC1sb2FkZXInKTtcbnZhciBDc3NMb2FkZXIgPSByZXF1aXJlKCcuL2Nzcy1sb2FkZXInKTtcbnZhciBHcm91cFNldHRpbmdzTG9hZGVyID0gcmVxdWlyZSgnLi9ncm91cC1zZXR0aW5ncy1sb2FkZXInKTtcbnZhciBQYWdlRGF0YUxvYWRlciA9IHJlcXVpcmUoJy4vcGFnZS1kYXRhLWxvYWRlcicpO1xudmFyIFBhZ2VTY2FubmVyID0gcmVxdWlyZSgnLi9wYWdlLXNjYW5uZXInKTtcbnZhciBYRE1BbmFseXRpY3MgPSByZXF1aXJlKCcuL3hkbS1hbmFseXRpY3MnKTtcbnZhciBYRE1Mb2FkZXIgPSByZXF1aXJlKCcuL3V0aWxzL3hkbS1sb2FkZXInKTtcblxuXG4vLyBTdGVwIDEgLSBraWNrIG9mZiB0aGUgYXN5bmNocm9ub3VzIGxvYWRpbmcgb2YgdGhlIEphdmFzY3JpcHQgYW5kIENTUyB3ZSBuZWVkLlxuQ3NzTG9hZGVyLmxvYWQoKTsgLy8gSW5qZWN0IHRoZSBDU1MgZmlyc3QgYmVjYXVzZSB3ZSBtYXkgc29vbiBhcHBlbmQgbW9yZSBhc3luY2hyb25vdXNseSwgaW4gdGhlIGdyb3VwU2V0dGluZ3MgY2FsbGJhY2ssIGFuZCB3ZSB3YW50IHRoYXQgQ1NTIHRvIGJlIGxvd2VyIGluIHRoZSBkb2N1bWVudC5cblNjcmlwdExvYWRlci5sb2FkKHNjcmlwdExvYWRlZCk7XG5cbmZ1bmN0aW9uIHNjcmlwdExvYWRlZCgpIHtcbiAgICAvLyBTdGVwIDIgLSBPbmNlIHdlIGhhdmUgb3VyIHJlcXVpcmVkIHNjcmlwdHMsIGZldGNoIHRoZSBncm91cCBzZXR0aW5ncyBmcm9tIHRoZSBzZXJ2ZXJcbiAgICBHcm91cFNldHRpbmdzTG9hZGVyLmxvYWQoZnVuY3Rpb24oZ3JvdXBTZXR0aW5ncykge1xuICAgICAgICAvLyBTdGVwIDMgLSBPbmNlIHdlIGhhdmUgdGhlIHNldHRpbmdzLCB3ZSBjYW4ga2ljayBvZmYgYSBjb3VwbGUgdGhpbmdzIGluIHBhcmFsbGVsOlxuICAgICAgICAvL1xuICAgICAgICAvLyAtLSBpbmplY3QgYW55IGN1c3RvbSBDU1MgZnJvbSB0aGUgZ3JvdXAgc2V0dGluZ3NcbiAgICAgICAgLy8gLS0gY3JlYXRlIHRoZSBoaWRkZW4gaWZyYW1lIHdlIHVzZSBmb3IgY3Jvc3MtZG9tYWluIGNvb2tpZXMgKHByaW1hcmlseSB1c2VyIGxvZ2luKVxuICAgICAgICAvLyAtLSBzdGFydCBmZXRjaGluZyB0aGUgcGFnZSBkYXRhXG4gICAgICAgIC8vIC0tIHN0YXJ0IGhhc2hpbmcgdGhlIHBhZ2UgYW5kIGluc2VydGluZyB0aGUgYWZmb3JkYW5jZXMgKGluIHRoZSBlbXB0eSBzdGF0ZSlcbiAgICAgICAgLy9cbiAgICAgICAgLy8gQXMgdGhlIHBhZ2UgaXMgc2Nhbm5lZCwgdGhlIHdpZGdldHMgYXJlIGNyZWF0ZWQgYW5kIGJvdW5kIHRvIHRoZSBwYWdlIGRhdGEgdGhhdCBjb21lcyBpbi5cbiAgICAgICAgaW5pdEN1c3RvbUNTUyhncm91cFNldHRpbmdzKTtcbiAgICAgICAgaW5pdFhkbUZyYW1lKGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICBmZXRjaFBhZ2VEYXRhKGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICBzY2FuUGFnZShncm91cFNldHRpbmdzKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gaW5pdEN1c3RvbUNTUyhncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGN1c3RvbUNTUyA9IGdyb3VwU2V0dGluZ3MuY3VzdG9tQ1NTKCk7XG4gICAgaWYgKGN1c3RvbUNTUykge1xuICAgICAgICBDc3NMb2FkZXIuaW5qZWN0KGN1c3RvbUNTUyk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBpbml0WGRtRnJhbWUoZ3JvdXBTZXR0aW5ncykge1xuICAgIFhETUFuYWx5dGljcy5zdGFydCgpOyAvLyBUaGUgWERNIGlmcmFtZSBoYXMgYSBudW1iZXIgb2YgbWVzc2FnZXMgaXQgZmlyZXMgb24gbG9hZCByZWxhdGVkIHRvIGFuYWx5dGljcy4gU3RhcnQgbGlzdGVuaW5nLlxuICAgIFhETUxvYWRlci5jcmVhdGVYRE1mcmFtZShncm91cFNldHRpbmdzLmdyb3VwSWQpO1xufVxuXG5mdW5jdGlvbiBmZXRjaFBhZ2VEYXRhKGdyb3VwU2V0dGluZ3MpIHtcbiAgICBQYWdlRGF0YUxvYWRlci5sb2FkKGdyb3VwU2V0dGluZ3MpO1xufVxuXG5mdW5jdGlvbiBzY2FuUGFnZShncm91cFNldHRpbmdzKSB7XG4gICAgUGFnZVNjYW5uZXIuc2Nhbihncm91cFNldHRpbmdzKTtcbn0iLCJ2YXIgJDsgcmVxdWlyZSgnLi91dGlscy9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciBCcm93c2VyTWV0cmljcyA9IHJlcXVpcmUoJy4vdXRpbHMvYnJvd3Nlci1tZXRyaWNzJyk7XG52YXIgUmFjdGl2ZTsgcmVxdWlyZSgnLi91dGlscy9yYWN0aXZlLXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGxvYWRlZFJhY3RpdmUpIHsgUmFjdGl2ZT1sb2FkZWRSYWN0aXZlOyB9KTtcbnZhciBTVkdzID0gcmVxdWlyZSgnLi9zdmdzJyk7XG5cbmZ1bmN0aW9uIGNyZWF0ZUNhbGxUb0FjdGlvbihhbnRJdGVtSWQsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIHJhY3RpdmUgPSBSYWN0aXZlKHtcbiAgICAgICAgZWw6ICQoJ2RpdicpLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICBhbnRJdGVtSWQ6IGFudEl0ZW1JZCxcbiAgICAgICAgICAgIGV4cGFuZFJlYWN0aW9uczogc2hvdWxkRXhwYW5kUmVhY3Rpb25zKGdyb3VwU2V0dGluZ3MpXG4gICAgICAgIH0sXG4gICAgICAgIHRlbXBsYXRlOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvYXV0by1jYWxsLXRvLWFjdGlvbi5oYnMuaHRtbCcpLFxuICAgICAgICBwYXJ0aWFsczoge1xuICAgICAgICAgICAgbG9nbzogU1ZHcy5sb2dvXG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gJChyYWN0aXZlLmZpbmQoJy5hbnRlbm5hLWF1dG8tY3RhJykpO1xufVxuXG5mdW5jdGlvbiBzaG91bGRFeHBhbmRSZWFjdGlvbnMoZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBzZXR0aW5nID0gZ3JvdXBTZXR0aW5ncy5nZW5lcmF0ZWRDdGFFeHBhbmRlZCgpOyAvLyBWYWx1ZXMgYXJlICdub25lJywgJ2JvdGgnLCAnZGVza3RvcCcsIGFuZCAnbW9iaWxlJ1xuICAgIHJldHVybiBzZXR0aW5nID09PSAnYm90aCcgfHxcbiAgICAgICAgKHNldHRpbmcgPT09ICdkZXNrdG9wJyAmJiAhQnJvd3Nlck1ldHJpY3MuaXNNb2JpbGUoKSkgfHxcbiAgICAgICAgKHNldHRpbmcgPT09ICdtb2JpbGUnICYmIEJyb3dzZXJNZXRyaWNzLmlzTW9iaWxlKCkpO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlOiBjcmVhdGVDYWxsVG9BY3Rpb25cbn07IiwidmFyIFJhY3RpdmU7IHJlcXVpcmUoJy4vdXRpbHMvcmFjdGl2ZS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihsb2FkZWRSYWN0aXZlKSB7IFJhY3RpdmUgPSBsb2FkZWRSYWN0aXZlO30pO1xuXG5mdW5jdGlvbiBjcmVhdGVDb3VudCgkY291bnRFbGVtZW50LCBjb250YWluZXJEYXRhKSB7XG4gICAgUmFjdGl2ZSh7XG4gICAgICAgIGVsOiAkY291bnRFbGVtZW50LFxuICAgICAgICBtYWdpYzogdHJ1ZSxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgY29udGFpbmVyRGF0YTogY29udGFpbmVyRGF0YVxuICAgICAgICB9LFxuICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL2NhbGwtdG8tYWN0aW9uLWNvdW50ZXIuaGJzLmh0bWwnKVxuICAgIH0pO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlOiBjcmVhdGVDb3VudFxufTsiLCJ2YXIgUmFjdGl2ZTsgcmVxdWlyZSgnLi91dGlscy9yYWN0aXZlLXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGxvYWRlZFJhY3RpdmUpIHsgUmFjdGl2ZSA9IGxvYWRlZFJhY3RpdmU7fSk7XG5cbmZ1bmN0aW9uIGNyZWF0ZUV4cGFuZGVkUmVhY3Rpb25zKCRleHBhbmRlZFJlYWN0aW9uc0VsZW1lbnQsICRjdGFFbGVtZW50LCBjb250YWluZXJEYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgUmFjdGl2ZSh7XG4gICAgICAgIGVsOiAkZXhwYW5kZWRSZWFjdGlvbnNFbGVtZW50LFxuICAgICAgICBtYWdpYzogdHJ1ZSxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgY29udGFpbmVyRGF0YTogY29udGFpbmVyRGF0YSxcbiAgICAgICAgICAgIGNvbXB1dGVFeHBhbmRlZFJlYWN0aW9uczogY29tcHV0ZUV4cGFuZGVkUmVhY3Rpb25zKGdyb3VwU2V0dGluZ3MuZGVmYXVsdFJlYWN0aW9ucygkY3RhRWxlbWVudCkpXG4gICAgICAgIH0sXG4gICAgICAgIHRlbXBsYXRlOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvY2FsbC10by1hY3Rpb24tZXhwYW5kZWQtcmVhY3Rpb25zLmhicy5odG1sJylcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gY29tcHV0ZUV4cGFuZGVkUmVhY3Rpb25zKGRlZmF1bHRSZWFjdGlvbnMpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24ocmVhY3Rpb25zRGF0YSkge1xuICAgICAgICB2YXIgbWF4ID0gMjtcbiAgICAgICAgdmFyIGV4cGFuZGVkUmVhY3Rpb25zID0gW107XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmVhY3Rpb25zRGF0YS5sZW5ndGggJiYgZXhwYW5kZWRSZWFjdGlvbnMubGVuZ3RoIDwgbWF4OyBpKyspIHtcbiAgICAgICAgICAgIHZhciByZWFjdGlvbkRhdGEgPSByZWFjdGlvbnNEYXRhW2ldO1xuICAgICAgICAgICAgaWYgKGlzRGVmYXVsdFJlYWN0aW9uKHJlYWN0aW9uRGF0YSwgZGVmYXVsdFJlYWN0aW9ucykpIHtcbiAgICAgICAgICAgICAgICBleHBhbmRlZFJlYWN0aW9ucy5wdXNoKHJlYWN0aW9uRGF0YSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGV4cGFuZGVkUmVhY3Rpb25zO1xuICAgIH07XG59XG5cbmZ1bmN0aW9uIGlzRGVmYXVsdFJlYWN0aW9uKHJlYWN0aW9uRGF0YSwgZGVmYXVsdFJlYWN0aW9ucykge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGVmYXVsdFJlYWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoZGVmYXVsdFJlYWN0aW9uc1tpXS50ZXh0ID09PSByZWFjdGlvbkRhdGEudGV4dCkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlOiBjcmVhdGVFeHBhbmRlZFJlYWN0aW9uc1xufTsiLCJ2YXIgQ2FsbFRvQWN0aW9uQ291bnRlciA9IHJlcXVpcmUoJy4vY2FsbC10by1hY3Rpb24tY291bnRlcicpO1xudmFyIENhbGxUb0FjdGlvbkV4cGFuZGVkUmVhY3Rpb25zID0gcmVxdWlyZSgnLi9jYWxsLXRvLWFjdGlvbi1leHBhbmRlZC1yZWFjdGlvbnMnKTtcbnZhciBDYWxsVG9BY3Rpb25MYWJlbCA9IHJlcXVpcmUoJy4vY2FsbC10by1hY3Rpb24tbGFiZWwnKTtcbnZhciBSZWFjdGlvbnNXaWRnZXQgPSByZXF1aXJlKCcuL3JlYWN0aW9ucy13aWRnZXQnKTtcblxuXG5mdW5jdGlvbiBjcmVhdGVJbmRpY2F0b3JXaWRnZXQob3B0aW9ucykge1xuICAgIHZhciBjb250YWluZXJEYXRhID0gb3B0aW9ucy5jb250YWluZXJEYXRhO1xuICAgIHZhciAkY29udGFpbmVyRWxlbWVudCA9IG9wdGlvbnMuY29udGFpbmVyRWxlbWVudDtcbiAgICB2YXIgY29udGVudERhdGEgPSBvcHRpb25zLmNvbnRlbnREYXRhO1xuICAgIHZhciAkY3RhRWxlbWVudCA9IG9wdGlvbnMuY3RhRWxlbWVudDtcbiAgICB2YXIgJGN0YUxhYmVscyA9IG9wdGlvbnMuY3RhTGFiZWxzOyAvLyBvcHRpb25hbFxuICAgIHZhciAkY3RhQ291bnRlcnMgPSBvcHRpb25zLmN0YUNvdW50ZXJzOyAvLyBvcHRpb25hbFxuICAgIHZhciAkY3RhRXhwYW5kZWRSZWFjdGlvbnMgPSBvcHRpb25zLmN0YUV4cGFuZGVkUmVhY3Rpb25zOyAvLyBvcHRpb25hbFxuICAgIHZhciBwYWdlRGF0YSA9IG9wdGlvbnMucGFnZURhdGE7XG4gICAgdmFyIGdyb3VwU2V0dGluZ3MgPSBvcHRpb25zLmdyb3VwU2V0dGluZ3M7XG4gICAgdmFyIGRlZmF1bHRSZWFjdGlvbnMgPSBvcHRpb25zLmRlZmF1bHRSZWFjdGlvbnM7XG5cbiAgICB2YXIgcmVhY3Rpb25XaWRnZXRPcHRpb25zID0ge1xuICAgICAgICByZWFjdGlvbnNEYXRhOiBjb250YWluZXJEYXRhLnJlYWN0aW9ucyxcbiAgICAgICAgY29udGFpbmVyRGF0YTogY29udGFpbmVyRGF0YSxcbiAgICAgICAgY29udGFpbmVyRWxlbWVudDogJGNvbnRhaW5lckVsZW1lbnQsXG4gICAgICAgIGNvbnRlbnREYXRhOiBjb250ZW50RGF0YSxcbiAgICAgICAgZGVmYXVsdFJlYWN0aW9uczogZGVmYXVsdFJlYWN0aW9ucyxcbiAgICAgICAgc3RhcnRQYWdlOiBjb21wdXRlU3RhcnRQYWdlKCRjdGFFbGVtZW50KSxcbiAgICAgICAgcGFnZURhdGE6IHBhZ2VEYXRhLFxuICAgICAgICBncm91cFNldHRpbmdzOiBncm91cFNldHRpbmdzXG4gICAgfTtcblxuICAgICRjdGFFbGVtZW50Lm9uKCdtb3VzZWVudGVyLmFudGVubmEnLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBpZiAoZXZlbnQuYnV0dG9ucyA+IDAgfHwgKGV2ZW50LmJ1dHRvbnMgPT0gdW5kZWZpbmVkICYmIGV2ZW50LndoaWNoID4gMCkpIHsgLy8gT24gU2FmYXJpLCBldmVudC5idXR0b25zIGlzIHVuZGVmaW5lZCBidXQgZXZlbnQud2hpY2ggZ2l2ZXMgYSBnb29kIHZhbHVlLiBldmVudC53aGljaCBpcyBiYWQgb24gRkZcbiAgICAgICAgICAgIC8vIERvbid0IHJlYWN0IGlmIHRoZSB1c2VyIGlzIGRyYWdnaW5nIG9yIHNlbGVjdGluZyB0ZXh0LlxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIG9wZW5SZWFjdGlvbnNXaW5kb3cocmVhY3Rpb25XaWRnZXRPcHRpb25zLCAkY3RhRWxlbWVudCk7XG4gICAgfSk7XG5cbiAgICBpZiAoJGN0YUxhYmVscykge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8ICRjdGFMYWJlbHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIENhbGxUb0FjdGlvbkxhYmVsLmNyZWF0ZSgkY3RhTGFiZWxzW2ldLCBjb250YWluZXJEYXRhKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmICgkY3RhQ291bnRlcnMpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAkY3RhQ291bnRlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIENhbGxUb0FjdGlvbkNvdW50ZXIuY3JlYXRlKCRjdGFDb3VudGVyc1tpXSwgY29udGFpbmVyRGF0YSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoJGN0YUV4cGFuZGVkUmVhY3Rpb25zKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgJGN0YUV4cGFuZGVkUmVhY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBDYWxsVG9BY3Rpb25FeHBhbmRlZFJlYWN0aW9ucy5jcmVhdGUoJGN0YUV4cGFuZGVkUmVhY3Rpb25zW2ldLCAkY3RhRWxlbWVudCwgY29udGFpbmVyRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVTdGFydFBhZ2UoJGVsZW1lbnQpIHtcbiAgICB2YXIgdmFsID0gKCRlbGVtZW50LmF0dHIoJ2FudC1tb2RlJykgfHwgJycpLnRyaW0oKTtcbiAgICBpZiAodmFsID09PSAnd3JpdGUnKSB7XG4gICAgICAgIHJldHVybiBSZWFjdGlvbnNXaWRnZXQuUEFHRV9ERUZBVUxUUztcbiAgICB9IGVsc2UgaWYgKHZhbCA9PT0gJ3JlYWQnKSB7XG4gICAgICAgIHJldHVybiBSZWFjdGlvbnNXaWRnZXQuUEFHRV9SRUFDVElPTlM7XG4gICAgfVxuICAgIHJldHVybiBSZWFjdGlvbnNXaWRnZXQuUEFHRV9BVVRPO1xufVxuXG5mdW5jdGlvbiBvcGVuUmVhY3Rpb25zV2luZG93KHJlYWN0aW9uT3B0aW9ucywgJGN0YUVsZW1lbnQpIHtcbiAgICBSZWFjdGlvbnNXaWRnZXQub3BlbihyZWFjdGlvbk9wdGlvbnMsICRjdGFFbGVtZW50KTtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZTogY3JlYXRlSW5kaWNhdG9yV2lkZ2V0XG59OyIsInZhciBSYWN0aXZlOyByZXF1aXJlKCcuL3V0aWxzL3JhY3RpdmUtcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24obG9hZGVkUmFjdGl2ZSkgeyBSYWN0aXZlID0gbG9hZGVkUmFjdGl2ZTt9KTtcblxuZnVuY3Rpb24gY3JlYXRlTGFiZWwoJGxhYmVsRWxlbWVudCwgY29udGFpbmVyRGF0YSkge1xuICAgIFJhY3RpdmUoe1xuICAgICAgICBlbDogJGxhYmVsRWxlbWVudCwgLy8gVE9ETzogcmV2aWV3IHRoZSBzdHJ1Y3R1cmUgb2YgdGhlIERPTSBoZXJlLiBEbyB3ZSB3YW50IHRvIHJlbmRlciBhbiBlbGVtZW50IGludG8gJGN0YUxhYmVsIG9yIGp1c3QgdGV4dD9cbiAgICAgICAgbWFnaWM6IHRydWUsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIGNvbnRhaW5lckRhdGE6IGNvbnRhaW5lckRhdGFcbiAgICAgICAgfSxcbiAgICAgICAgdGVtcGxhdGU6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9jYWxsLXRvLWFjdGlvbi1sYWJlbC5oYnMuaHRtbCcpXG4gICAgfSk7XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGU6IGNyZWF0ZUxhYmVsXG59OyIsInZhciAkOyByZXF1aXJlKCcuL3V0aWxzL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIEFqYXhDbGllbnQgPSByZXF1aXJlKCcuL3V0aWxzL2FqYXgtY2xpZW50Jyk7XG52YXIgVXNlciA9IHJlcXVpcmUoJy4vdXRpbHMvdXNlcicpO1xuXG52YXIgRXZlbnRzID0gcmVxdWlyZSgnLi9ldmVudHMnKTtcblxuZnVuY3Rpb24gc2V0dXBDb21tZW50QXJlYShyZWFjdGlvblByb3ZpZGVyLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncywgY2FsbGJhY2ssIHJhY3RpdmUpIHtcbiAgICByYWN0aXZlLm9uKCdpbnB1dGNoYW5nZWQnLCB1cGRhdGVJbnB1dENvdW50ZXIpO1xuICAgIHJhY3RpdmUub24oJ2FkZGNvbW1lbnQnLCBhZGRDb21tZW50KTtcbiAgICB1cGRhdGVJbnB1dENvdW50ZXIoKTtcblxuICAgIGZ1bmN0aW9uIGFkZENvbW1lbnQoKSB7XG4gICAgICAgIHZhciBjb21tZW50ID0gJChyYWN0aXZlLmZpbmQoJy5hbnRlbm5hLWNvbW1lbnQtaW5wdXQnKSkudmFsKCkudHJpbSgpOyAvLyBUT0RPOiBhZGRpdGlvbmFsIHZhbGlkYXRpb24/IGlucHV0IHNhbml0aXppbmc/XG4gICAgICAgIGlmIChjb21tZW50Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICQocmFjdGl2ZS5maW5kKCcuYW50ZW5uYS1jb21tZW50LXdpZGdldHMnKSkuaGlkZSgpO1xuICAgICAgICAgICAgJChyYWN0aXZlLmZpbmQoJy5hbnRlbm5hLWNvbW1lbnQtd2FpdGluZycpKS5mYWRlSW4oJ3Nsb3cnKTtcbiAgICAgICAgICAgIHJlYWN0aW9uUHJvdmlkZXIuZ2V0KGZ1bmN0aW9uIChyZWFjdGlvbikge1xuICAgICAgICAgICAgICAgIEFqYXhDbGllbnQucG9zdENvbW1lbnQoY29tbWVudCwgcmVhY3Rpb24sIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIEV2ZW50cy5wb3N0Q29tbWVudENyZWF0ZWQocGFnZURhdGEsIGNvbnRhaW5lckRhdGEsIHJlYWN0aW9uLCBjb21tZW50LCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgICAgICB9LCBlcnJvcik7XG4gICAgICAgICAgICAgICAgJChyYWN0aXZlLmZpbmQoJy5hbnRlbm5hLWNvbW1lbnQtd2FpdGluZycpKS5zdG9wKCkuaGlkZSgpO1xuICAgICAgICAgICAgICAgICQocmFjdGl2ZS5maW5kKCcuYW50ZW5uYS1jb21tZW50LXJlY2VpdmVkJykpLmZhZGVJbigpO1xuICAgICAgICAgICAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhjb21tZW50LCBVc2VyLm9wdGltaXN0aWNVc2VyKCkpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGVycm9yKG1lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gVE9ETyByZWFsIGVycm9yIGhhbmRsaW5nXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdFcnJvciBwb3N0aW5nIGNvbW1lbnQ6ICcgKyBtZXNzYWdlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHVwZGF0ZUlucHV0Q291bnRlcigpIHtcbiAgICAgICAgdmFyICR0ZXh0YXJlYSA9ICQocmFjdGl2ZS5maW5kKCcuYW50ZW5uYS1jb21tZW50LWlucHV0JykpO1xuICAgICAgICB2YXIgbWF4ID0gcGFyc2VJbnQoJHRleHRhcmVhLmF0dHIoJ21heGxlbmd0aCcpKTtcbiAgICAgICAgdmFyIGxlbmd0aCA9ICR0ZXh0YXJlYS52YWwoKS5sZW5ndGg7XG4gICAgICAgICQocmFjdGl2ZS5maW5kKCcuYW50ZW5uYS1jb21tZW50LWNvdW50JykpLmh0bWwoTWF0aC5tYXgoMCwgbWF4IC0gbGVuZ3RoKSk7XG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgc2V0dXA6IHNldHVwQ29tbWVudEFyZWFcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgUmFjdGl2ZTsgcmVxdWlyZSgnLi91dGlscy9yYWN0aXZlLXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGxvYWRlZFJhY3RpdmUpIHsgUmFjdGl2ZSA9IGxvYWRlZFJhY3RpdmU7fSk7XG52YXIgQ29tbWVudEFyZWFQYXJ0aWFsID0gcmVxdWlyZSgnLi9jb21tZW50LWFyZWEtcGFydGlhbCcpO1xudmFyIFNWR3MgPSByZXF1aXJlKCcuL3N2Z3MnKTtcblxudmFyIHBhZ2VTZWxlY3RvciA9ICcuYW50ZW5uYS1jb21tZW50cy1wYWdlJztcblxuZnVuY3Rpb24gY3JlYXRlUGFnZShvcHRpb25zKSB7XG4gICAgdmFyIHJlYWN0aW9uID0gb3B0aW9ucy5yZWFjdGlvbjtcbiAgICB2YXIgY29tbWVudHMgPSBvcHRpb25zLmNvbW1lbnRzO1xuICAgIHZhciBlbGVtZW50ID0gb3B0aW9ucy5lbGVtZW50O1xuICAgIHZhciBjb250YWluZXJEYXRhID0gb3B0aW9ucy5jb250YWluZXJEYXRhO1xuICAgIHZhciBwYWdlRGF0YSA9IG9wdGlvbnMucGFnZURhdGE7XG4gICAgdmFyIGdyb3VwU2V0dGluZ3MgPSBvcHRpb25zLmdyb3VwU2V0dGluZ3M7XG4gICAgdmFyIGdvQmFjayA9IG9wdGlvbnMuZ29CYWNrO1xuICAgIHZhciByYWN0aXZlID0gUmFjdGl2ZSh7XG4gICAgICAgIGVsOiBlbGVtZW50LFxuICAgICAgICBhcHBlbmQ6IHRydWUsXG4gICAgICAgIG1hZ2ljOiB0cnVlLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICByZWFjdGlvbjogcmVhY3Rpb24sXG4gICAgICAgICAgICBjb21tZW50czogY29tbWVudHNcbiAgICAgICAgfSxcbiAgICAgICAgdGVtcGxhdGU6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9jb21tZW50cy1wYWdlLmhicy5odG1sJyksXG4gICAgICAgIHBhcnRpYWxzOiB7XG4gICAgICAgICAgICBjb21tZW50QXJlYTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL2NvbW1lbnQtYXJlYS1wYXJ0aWFsLmhicy5odG1sJyksXG4gICAgICAgICAgICBsZWZ0OiBTVkdzLmxlZnRcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHZhciByZWFjdGlvblByb3ZpZGVyID0geyAvLyB0aGlzIHJlYWN0aW9uIHByb3ZpZGVyIGlzIGEgbm8tYnJhaW5lciBiZWNhdXNlIHdlIGFscmVhZHkgaGF2ZSBhIHZhbGlkIHJlYWN0aW9uIChvbmUgd2l0aCBhbiBJRClcbiAgICAgICAgZ2V0OiBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICAgICAgY2FsbGJhY2socmVhY3Rpb24pO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBDb21tZW50QXJlYVBhcnRpYWwuc2V0dXAocmVhY3Rpb25Qcm92aWRlciwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MsIGNvbW1lbnRBZGRlZCwgcmFjdGl2ZSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgcmFjdGl2ZS5vbignYmFjaycsIGdvQmFjayk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgc2VsZWN0b3I6IHBhZ2VTZWxlY3RvcixcbiAgICAgICAgdGVhcmRvd246IGZ1bmN0aW9uKCkgeyByYWN0aXZlLnRlYXJkb3duKCk7IH1cbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gY29tbWVudEFkZGVkKGNvbW1lbnQsIHVzZXIpIHtcbiAgICAgICAgY29tbWVudHMudW5zaGlmdCh7IHRleHQ6IGNvbW1lbnQsIHVzZXI6IHVzZXIsIG5ldzogdHJ1ZSB9KTtcbiAgICAgICAgJChyYWN0aXZlLmZpbmQoJy5hbnRlbm5hLWJvZHknKSkuYW5pbWF0ZSh7c2Nyb2xsVG9wOiAwfSk7XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGU6IGNyZWF0ZVBhZ2Vcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgUmFjdGl2ZTsgcmVxdWlyZSgnLi91dGlscy9yYWN0aXZlLXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGxvYWRlZFJhY3RpdmUpIHsgUmFjdGl2ZSA9IGxvYWRlZFJhY3RpdmU7fSk7XG52YXIgQ29tbWVudEFyZWFQYXJ0aWFsID0gcmVxdWlyZSgnLi9jb21tZW50LWFyZWEtcGFydGlhbCcpO1xudmFyIFNWR3MgPSByZXF1aXJlKCcuL3N2Z3MnKTtcblxudmFyIHBhZ2VTZWxlY3RvciA9ICcuYW50ZW5uYS1jb25maXJtYXRpb24tcGFnZSc7XG5cbmZ1bmN0aW9uIGNyZWF0ZVBhZ2UocmVhY3Rpb25UZXh0LCByZWFjdGlvblByb3ZpZGVyLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncywgZWxlbWVudCkge1xuICAgIHZhciByYWN0aXZlID0gUmFjdGl2ZSh7XG4gICAgICAgIGVsOiBlbGVtZW50LFxuICAgICAgICBhcHBlbmQ6IHRydWUsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIHRleHQ6IHJlYWN0aW9uVGV4dFxuICAgICAgICB9LFxuICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL2NvbmZpcm1hdGlvbi1wYWdlLmhicy5odG1sJyksXG4gICAgICAgIHBhcnRpYWxzOiB7XG4gICAgICAgICAgICBjb21tZW50QXJlYTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL2NvbW1lbnQtYXJlYS1wYXJ0aWFsLmhicy5odG1sJyksXG4gICAgICAgICAgICBmYWNlYm9va0ljb246IFNWR3MuZmFjZWJvb2ssXG4gICAgICAgICAgICB0d2l0dGVySWNvbjogU1ZHcy50d2l0dGVyXG4gICAgICAgIH1cbiAgICB9KTtcbiAgICBDb21tZW50QXJlYVBhcnRpYWwuc2V0dXAocmVhY3Rpb25Qcm92aWRlciwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MsIG51bGwsIHJhY3RpdmUpO1xuICAgIHJldHVybiB7XG4gICAgICAgIHNlbGVjdG9yOiBwYWdlU2VsZWN0b3IsXG4gICAgICAgIHRlYXJkb3duOiBmdW5jdGlvbigpIHsgcmFjdGl2ZS50ZWFyZG93bigpOyB9XG4gICAgfTtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZTogY3JlYXRlUGFnZVxufTsiLCJ2YXIgQXBwTW9kZSA9IHJlcXVpcmUoJy4vdXRpbHMvYXBwLW1vZGUnKTtcbnZhciBVUkxDb25zdGFudHMgPSByZXF1aXJlKCcuL3V0aWxzL3VybC1jb25zdGFudHMnKTtcblxudmFyIGJhc2VVcmw7XG5pZiAoQXBwTW9kZS50ZXN0KSB7XG4gICAgYmFzZVVybCA9IFVSTENvbnN0YW50cy5URVNUO1xufSBlbHNlIGlmIChBcHBNb2RlLm9mZmxpbmUpIHtcbiAgICBiYXNlVXJsID0gVVJMQ29uc3RhbnRzLkRFVkVMT1BNRU5UO1xufSBlbHNlIHtcbiAgICBiYXNlVXJsID0gVVJMQ29uc3RhbnRzLlBST0RVQ1RJT047XG59XG5cbmZ1bmN0aW9uIGxvYWRDc3MoKSB7XG4gICAgLy8gVG8gbWFrZSBzdXJlIG5vbmUgb2Ygb3VyIGNvbnRlbnQgcmVuZGVycyBvbiB0aGUgcGFnZSBiZWZvcmUgb3VyIENTUyBpcyBsb2FkZWQsIHdlIGFwcGVuZCBhIHNpbXBsZSBpbmxpbmUgc3R5bGVcbiAgICAvLyBlbGVtZW50IHRoYXQgdHVybnMgb2ZmIG91ciBlbGVtZW50cyAqYmVmb3JlKiBvdXIgQ1NTIGxpbmtzLiBUaGlzIGV4cGxvaXRzIHRoZSBjYXNjYWRlIHJ1bGVzIC0gb3VyIENTUyBmaWxlcyBhcHBlYXJcbiAgICAvLyBhZnRlciB0aGUgaW5saW5lIHN0eWxlIGluIHRoZSBkb2N1bWVudCwgc28gdGhleSB0YWtlIHByZWNlZGVuY2UgKGFuZCBtYWtlIGV2ZXJ5dGhpbmcgYXBwZWFyKSBvbmNlIHRoZXkncmUgbG9hZGVkLlxuICAgIGluamVjdENzcygnLmFudGVubmF7ZGlzcGxheTpub25lO30nKTtcbiAgICB2YXIgY3NzSHJlZiA9IGJhc2VVcmwgKyAnL3N0YXRpYy93aWRnZXQtbmV3L2RlYnVnL2FudGVubmEuY3NzJzsgLy8gVE9ETyB0aGlzIG5lZWRzIGEgZmluYWwgcGF0aC4gQ0ROIGZvciBwcm9kdWN0aW9uIGFuZCBsb2NhbCBmaWxlIGZvciBkZXZlbG9wbWVudD9cbiAgICBsb2FkRmlsZShjc3NIcmVmKTtcbn1cblxuZnVuY3Rpb24gbG9hZEZpbGUoaHJlZikge1xuICAgIHZhciBsaW5rVGFnID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGluaycpO1xuICAgIGxpbmtUYWcuc2V0QXR0cmlidXRlKCdocmVmJywgaHJlZik7XG4gICAgbGlua1RhZy5zZXRBdHRyaWJ1dGUoJ3JlbCcsICdzdHlsZXNoZWV0Jyk7XG4gICAgbGlua1RhZy5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCAndGV4dC9jc3MnKTtcbiAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKGxpbmtUYWcpO1xufVxuXG5mdW5jdGlvbiBpbmplY3RDc3MoY3NzU3RyaW5nKSB7XG4gICAgdmFyIHN0eWxlVGFnID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcbiAgICBzdHlsZVRhZy5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCAndGV4dC9jc3MnKTtcbiAgICBzdHlsZVRhZy5pbm5lckhUTUwgPSBjc3NTdHJpbmc7XG4gICAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzdHlsZVRhZyk7XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBsb2FkIDogbG9hZENzcyxcbiAgICBpbmplY3Q6IGluamVjdENzc1xufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi91dGlscy9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciBBamF4Q2xpZW50ID0gcmVxdWlyZSgnLi91dGlscy9hamF4LWNsaWVudCcpO1xudmFyIFJhY3RpdmU7IHJlcXVpcmUoJy4vdXRpbHMvcmFjdGl2ZS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihsb2FkZWRSYWN0aXZlKSB7IFJhY3RpdmUgPSBsb2FkZWRSYWN0aXZlO30pO1xudmFyIFJlYWN0aW9uc1dpZGdldExheW91dFV0aWxzID0gcmVxdWlyZSgnLi91dGlscy9yZWFjdGlvbnMtd2lkZ2V0LWxheW91dC11dGlscycpO1xuXG52YXIgRXZlbnRzID0gcmVxdWlyZSgnLi9ldmVudHMnKTtcbnZhciBQYWdlRGF0YSA9IHJlcXVpcmUoJy4vcGFnZS1kYXRhJyk7XG5cbnZhciBwYWdlU2VsZWN0b3IgPSAnLmFudGVubmEtZGVmYXVsdHMtcGFnZSc7XG5cbmZ1bmN0aW9uIGNyZWF0ZVBhZ2Uob3B0aW9ucykge1xuICAgIHZhciBkZWZhdWx0UmVhY3Rpb25zID0gb3B0aW9ucy5kZWZhdWx0UmVhY3Rpb25zO1xuICAgIHZhciBjb250YWluZXJEYXRhID0gb3B0aW9ucy5jb250YWluZXJEYXRhO1xuICAgIHZhciBwYWdlRGF0YSA9IG9wdGlvbnMucGFnZURhdGE7XG4gICAgdmFyIGdyb3VwU2V0dGluZ3MgPSBvcHRpb25zLmdyb3VwU2V0dGluZ3M7XG4gICAgdmFyIGNvbnRlbnREYXRhID0gb3B0aW9ucy5jb250ZW50RGF0YTtcbiAgICB2YXIgc2hvd0NvbmZpcm1hdGlvbiA9IG9wdGlvbnMuc2hvd0NvbmZpcm1hdGlvbjtcbiAgICB2YXIgZWxlbWVudCA9IG9wdGlvbnMuZWxlbWVudDtcbiAgICB2YXIgZGVmYXVsdExheW91dERhdGEgPSBSZWFjdGlvbnNXaWRnZXRMYXlvdXRVdGlscy5jb21wdXRlTGF5b3V0RGF0YShkZWZhdWx0UmVhY3Rpb25zKTtcbiAgICB2YXIgJHJlYWN0aW9uc1dpbmRvdyA9ICQob3B0aW9ucy5yZWFjdGlvbnNXaW5kb3cpO1xuICAgIHZhciByYWN0aXZlID0gUmFjdGl2ZSh7XG4gICAgICAgIGVsOiBlbGVtZW50LFxuICAgICAgICBhcHBlbmQ6IHRydWUsXG4gICAgICAgIHRlbXBsYXRlOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvZGVmYXVsdHMtcGFnZS5oYnMuaHRtbCcpLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICBkZWZhdWx0UmVhY3Rpb25zOiBkZWZhdWx0UmVhY3Rpb25zLFxuICAgICAgICAgICAgZGVmYXVsdExheW91dENsYXNzOiBhcnJheUFjY2Vzc29yKGRlZmF1bHRMYXlvdXREYXRhLmxheW91dENsYXNzZXMpXG4gICAgICAgIH0sXG4gICAgICAgIGRlY29yYXRvcnM6IHtcbiAgICAgICAgICAgIHNpemV0b2ZpdDogUmVhY3Rpb25zV2lkZ2V0TGF5b3V0VXRpbHMuc2l6ZVRvRml0KCRyZWFjdGlvbnNXaW5kb3cpXG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIHJhY3RpdmUub24oJ25ld3JlYWN0aW9uJywgbmV3RGVmYXVsdFJlYWN0aW9uKTtcbiAgICByYWN0aXZlLm9uKCdjdXN0b21mb2N1cycsIGN1c3RvbVJlYWN0aW9uRm9jdXMpO1xuICAgIHJhY3RpdmUub24oJ2N1c3RvbWJsdXInLCBjdXN0b21SZWFjdGlvbkJsdXIpO1xuICAgIHJhY3RpdmUub24oJ2FkZGN1c3RvbScsIHN1Ym1pdEN1c3RvbVJlYWN0aW9uKTtcbiAgICByYWN0aXZlLm9uKCdwYWdla2V5ZG93bicsIGtleWJvYXJkSW5wdXQpO1xuICAgIHJhY3RpdmUub24oJ2lucHV0a2V5ZG93bicsIGN1c3RvbVJlYWN0aW9uSW5wdXQpO1xuXG4gICAgJChyb290RWxlbWVudChyYWN0aXZlKSkuZm9jdXMoKTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIHNlbGVjdG9yOiBwYWdlU2VsZWN0b3IsXG4gICAgICAgIHRlYXJkb3duOiBmdW5jdGlvbigpIHsgcmFjdGl2ZS50ZWFyZG93bigpOyB9XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIGN1c3RvbVJlYWN0aW9uSW5wdXQocmFjdGl2ZUV2ZW50KSB7XG4gICAgICAgIHZhciBldmVudCA9IHJhY3RpdmVFdmVudC5vcmlnaW5hbDtcbiAgICAgICAgdmFyIGtleSA9IChldmVudC53aGljaCAhPT0gdW5kZWZpbmVkKSA/IGV2ZW50LndoaWNoIDogZXZlbnQua2V5Q29kZTtcbiAgICAgICAgaWYgKGtleSA9PSAxMykgeyAvLyBFbnRlclxuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHsgLy8gbGV0IHRoZSBwcm9jZXNzaW5nIG9mIHRoZSBrZXlib2FyZCBldmVudCBmaW5pc2ggYmVmb3JlIHdlIHNob3cgdGhlIHBhZ2UgKG90aGVyd2lzZSwgdGhlIGNvbmZpcm1hdGlvbiBwYWdlIGFsc28gcmVjZWl2ZXMgdGhlIGtleXN0cm9rZSlcbiAgICAgICAgICAgICAgICBzdWJtaXRDdXN0b21SZWFjdGlvbigpO1xuICAgICAgICAgICAgfSwgMCk7XG4gICAgICAgIH0gZWxzZSBpZiAoa2V5ID09IDI3KSB7IC8vIEVzY2FwZVxuICAgICAgICAgICAgJChldmVudC50YXJnZXQpLnZhbCgnJyk7XG4gICAgICAgICAgICAkKHJvb3RFbGVtZW50KHJhY3RpdmUpKS5mb2N1cygpO1xuICAgICAgICB9XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG5ld0RlZmF1bHRSZWFjdGlvbihyYWN0aXZlRXZlbnQpIHtcbiAgICAgICAgdmFyIGRlZmF1bHRSZWFjdGlvbkRhdGEgPSByYWN0aXZlRXZlbnQuY29udGV4dDtcbiAgICAgICAgcG9zdE5ld1JlYWN0aW9uKGRlZmF1bHRSZWFjdGlvbkRhdGEpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHN1Ym1pdEN1c3RvbVJlYWN0aW9uKCkge1xuICAgICAgICB2YXIgYm9keSA9ICQocmFjdGl2ZS5maW5kKCcuYW50ZW5uYS1kZWZhdWx0cy1mb290ZXIgaW5wdXQnKSkudmFsKCkudHJpbSgpO1xuICAgICAgICBpZiAoYm9keSAhPT0gJycpIHtcbiAgICAgICAgICAgIHZhciByZWFjdGlvbkRhdGEgPSB7IHRleHQ6IGJvZHkgfTtcbiAgICAgICAgICAgIHBvc3ROZXdSZWFjdGlvbihyZWFjdGlvbkRhdGEpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcG9zdE5ld1JlYWN0aW9uKHJlYWN0aW9uRGF0YSkge1xuICAgICAgICB2YXIgcmVhY3Rpb25Qcm92aWRlciA9IGNyZWF0ZVJlYWN0aW9uUHJvdmlkZXIoKTtcbiAgICAgICAgc2hvd0NvbmZpcm1hdGlvbihyZWFjdGlvbkRhdGEsIHJlYWN0aW9uUHJvdmlkZXIpO1xuICAgICAgICBBamF4Q2xpZW50LnBvc3ROZXdSZWFjdGlvbihyZWFjdGlvbkRhdGEsIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBjb250ZW50RGF0YSwgc3VjY2VzcywgZXJyb3IpO1xuXG4gICAgICAgIGZ1bmN0aW9uIHN1Y2Nlc3MocmVhY3Rpb24pIHtcbiAgICAgICAgICAgIHJlYWN0aW9uID0gUGFnZURhdGEucmVnaXN0ZXJSZWFjdGlvbihyZWFjdGlvbiwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEpO1xuICAgICAgICAgICAgcmVhY3Rpb25Qcm92aWRlci5yZWFjdGlvbkxvYWRlZChyZWFjdGlvbik7XG4gICAgICAgICAgICBFdmVudHMucG9zdFJlYWN0aW9uQ3JlYXRlZChwYWdlRGF0YSwgY29udGFpbmVyRGF0YSwgcmVhY3Rpb24sIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZXJyb3IobWVzc2FnZSkge1xuICAgICAgICAgICAgLy8gVE9ETyBoYW5kbGUgYW55IGVycm9ycyB0aGF0IG9jY3VyIHBvc3RpbmcgYSByZWFjdGlvblxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJlcnJvciBwb3N0aW5nIG5ldyByZWFjdGlvbjogXCIgKyBtZXNzYWdlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGtleWJvYXJkSW5wdXQocmFjdGl2ZUV2ZW50KSB7XG4gICAgICAgIGlmICgkKHJvb3RFbGVtZW50KHJhY3RpdmUpKS5oYXNDbGFzcygnYW50ZW5uYS1wYWdlLWFjdGl2ZScpKSB7IC8vIG9ubHkgaGFuZGxlIGlucHV0IHdoZW4gdGhpcyBwYWdlIGlzIGFjdGl2ZVxuICAgICAgICAgICAgJChyb290RWxlbWVudChyYWN0aXZlKSkuZmluZCgnLmFudGVubmEtZGVmYXVsdHMtZm9vdGVyIGlucHV0JykuZm9jdXMoKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gcm9vdEVsZW1lbnQocmFjdGl2ZSkge1xuICAgIHJldHVybiByYWN0aXZlLmZpbmQocGFnZVNlbGVjdG9yKTtcbn1cblxuZnVuY3Rpb24gYXJyYXlBY2Nlc3NvcihhcnJheSkge1xuICAgIHJldHVybiBmdW5jdGlvbihpbmRleCkge1xuICAgICAgICByZXR1cm4gYXJyYXlbaW5kZXhdO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gY3VzdG9tUmVhY3Rpb25Gb2N1cyhyYWN0aXZlRXZlbnQpIHtcbiAgICB2YXIgJGZvb3RlciA9ICQocmFjdGl2ZUV2ZW50Lm9yaWdpbmFsLnRhcmdldCkuY2xvc2VzdCgnLmFudGVubmEtZGVmYXVsdHMtZm9vdGVyJyk7XG4gICAgJGZvb3Rlci5maW5kKCdpbnB1dCcpLm5vdCgnLmFjdGl2ZScpLnZhbCgnJykuYWRkQ2xhc3MoJ2FjdGl2ZScpO1xuICAgICRmb290ZXIuZmluZCgnYnV0dG9uJykuc2hvdygpO1xufVxuXG5mdW5jdGlvbiBjdXN0b21SZWFjdGlvbkJsdXIocmFjdGl2ZUV2ZW50KSB7XG4gICAgdmFyIGV2ZW50ID0gcmFjdGl2ZUV2ZW50Lm9yaWdpbmFsO1xuICAgIGlmICgkKGV2ZW50LnJlbGF0ZWRUYXJnZXQpLmNsb3Nlc3QoJy5hbnRlbm5hLWRlZmF1bHRzLWZvb3RlciBidXR0b24nKS5zaXplKCkgPT0gMCkgeyAvLyBEb24ndCBoaWRlIHRoZSBpbnB1dCB3aGVuIHdlIGNsaWNrIG9uIHRoZSBidXR0b25cbiAgICAgICAgdmFyICRmb290ZXIgPSAkKGV2ZW50LnRhcmdldCkuY2xvc2VzdCgnLmFudGVubmEtZGVmYXVsdHMtZm9vdGVyJyk7XG4gICAgICAgIHZhciBpbnB1dCA9ICRmb290ZXIuZmluZCgnaW5wdXQnKTtcbiAgICAgICAgaWYgKGlucHV0LnZhbCgpID09PSAnJykge1xuICAgICAgICAgICAgJGZvb3Rlci5maW5kKCdidXR0b24nKS5oaWRlKCk7XG4gICAgICAgICAgICB2YXIgJGlucHV0ID0gJGZvb3Rlci5maW5kKCdpbnB1dCcpO1xuICAgICAgICAgICAgLy8gUmVzZXQgdGhlIGlucHV0IHZhbHVlIHRvIHRoZSBkZWZhdWx0IGluIHRoZSBodG1sL3RlbXBsYXRlXG4gICAgICAgICAgICAkaW5wdXQudmFsKCRpbnB1dC5hdHRyKCd2YWx1ZScpKS5yZW1vdmVDbGFzcygnYWN0aXZlJyk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVJlYWN0aW9uUHJvdmlkZXIoKSB7XG5cbiAgICB2YXIgbG9hZGVkUmVhY3Rpb247XG4gICAgdmFyIGNhbGxiYWNrcyA9IFtdO1xuXG4gICAgZnVuY3Rpb24gb25SZWFjdGlvbihjYWxsYmFjaykge1xuICAgICAgICBjYWxsYmFja3MucHVzaChjYWxsYmFjayk7XG4gICAgICAgIG5vdGlmeUlmUmVhZHkoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByZWFjdGlvbkxvYWRlZChyZWFjdGlvbikge1xuICAgICAgICBsb2FkZWRSZWFjdGlvbiA9IHJlYWN0aW9uO1xuICAgICAgICBub3RpZnlJZlJlYWR5KCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbm90aWZ5SWZSZWFkeSgpIHtcbiAgICAgICAgaWYgKGxvYWRlZFJlYWN0aW9uKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNhbGxiYWNrcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrc1tpXShsb2FkZWRSZWFjdGlvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYWxsYmFja3MgPSBbXTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIGdldDogb25SZWFjdGlvbiwgLy8gVE9ETyB0ZXJtaW5vbG9neVxuICAgICAgICByZWFjdGlvbkxvYWRlZDogcmVhY3Rpb25Mb2FkZWRcbiAgICB9XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGU6IGNyZWF0ZVBhZ2Vcbn07IiwidmFyIEFqYXhDbGllbnQgPSByZXF1aXJlKCcuL3V0aWxzL2FqYXgtY2xpZW50Jyk7XG52YXIgQnJvd3Nlck1ldHJpY3MgPSByZXF1aXJlKCcuL3V0aWxzL2Jyb3dzZXItbWV0cmljcycpO1xudmFyIFhETUNsaWVudCA9IHJlcXVpcmUoJy4vdXRpbHMveGRtLWNsaWVudCcpO1xuXG5mdW5jdGlvbiBwb3N0R3JvdXBTZXR0aW5nc0xvYWRlZChncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGV2ZW50ID0gY3JlYXRlRXZlbnQoZXZlbnRUeXBlcy5zY3JpcHRMb2FkLCAnJywgZ3JvdXBTZXR0aW5ncyk7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5wYWdlSWRdID0gJ25hJztcbiAgICBldmVudFthdHRyaWJ1dGVzLmFydGljbGVIZWlnaHRdID0gJ25hJztcbiAgICBwb3N0RXZlbnQoZXZlbnQpO1xufVxuXG5mdW5jdGlvbiBwb3N0UGFnZURhdGFMb2FkZWQocGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgZXZlbnQgPSBjcmVhdGVFdmVudChldmVudFR5cGVzLnBhZ2VEYXRhTG9hZGVkLCAnJywgZ3JvdXBTZXR0aW5ncyk7XG4gICAgYXBwZW5kUGFnZURhdGFQYXJhbXMoZXZlbnQsIHBhZ2VEYXRhKTtcbiAgICBldmVudFthdHRyaWJ1dGVzLmNvbnRlbnRBdHRyaWJ1dGVzXSA9IHBhZ2VEYXRhLm1ldHJpY3MuaXNNdWx0aVBhZ2UgPyBldmVudFZhbHVlcy5tdWx0aXBsZVBhZ2VzIDogZXZlbnRWYWx1ZXMuc2luZ2xlUGFnZTtcbiAgICBwb3N0RXZlbnQoZXZlbnQpO1xufVxuXG5mdW5jdGlvbiBwb3N0UmVhY3Rpb25XaWRnZXRPcGVuZWQoaXNTaG93UmVhY3Rpb25zLCBwYWdlRGF0YSwgY29udGFpbmVyRGF0YSwgY29udGVudERhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgZXZlbnRWYWx1ZSA9IGlzU2hvd1JlYWN0aW9ucyA/IGV2ZW50VmFsdWVzLnNob3dSZWFjdGlvbnMgOiBldmVudFZhbHVlcy5zaG93RGVmYXVsdHM7XG4gICAgdmFyIGV2ZW50ID0gY3JlYXRlRXZlbnQoZXZlbnRUeXBlcy5yZWFjdGlvbldpZGdldE9wZW5lZCwgZXZlbnRWYWx1ZSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgYXBwZW5kUGFnZURhdGFQYXJhbXMoZXZlbnQsIHBhZ2VEYXRhKTtcbiAgICBldmVudFthdHRyaWJ1dGVzLmNvbnRhaW5lckhhc2hdID0gY29udGFpbmVyRGF0YS5oYXNoO1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMuY29udGFpbmVyS2luZF0gPSBjb250ZW50RGF0YS50eXBlO1xuICAgIHBvc3RFdmVudChldmVudCk7XG59XG5cbmZ1bmN0aW9uIHBvc3RTdW1tYXJ5T3BlbmVkKGlzU2hvd1JlYWN0aW9ucywgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgZXZlbnRWYWx1ZSA9IGlzU2hvd1JlYWN0aW9ucyA/IGV2ZW50VmFsdWVzLnZpZXdSZWFjdGlvbnMgOiBldmVudFZhbHVlcy52aWV3RGVmYXVsdHM7XG4gICAgdmFyIGV2ZW50ID0gY3JlYXRlRXZlbnQoZXZlbnRUeXBlcy5zdW1tYXJ5V2lkZ2V0LCBldmVudFZhbHVlLCBncm91cFNldHRpbmdzKTtcbiAgICBhcHBlbmRQYWdlRGF0YVBhcmFtcyhldmVudCwgcGFnZURhdGEpO1xuICAgIHBvc3RFdmVudChldmVudCk7XG59XG5cbmZ1bmN0aW9uIHBvc3RSZWFjdGlvbkNyZWF0ZWQocGFnZURhdGEsIGNvbnRhaW5lckRhdGEsIHJlYWN0aW9uRGF0YSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBldmVudCA9IGNyZWF0ZUV2ZW50KGV2ZW50VHlwZXMucmVhY3Rpb25DcmVhdGVkLCByZWFjdGlvbkRhdGEudGV4dCwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgYXBwZW5kUGFnZURhdGFQYXJhbXMoZXZlbnQsIHBhZ2VEYXRhKTtcbiAgICBhcHBlbmRDb250YWluZXJEYXRhUGFyYW1zKGV2ZW50LCBjb250YWluZXJEYXRhKTtcbiAgICBhcHBlbmRSZWFjdGlvbkRhdGFQYXJhbXMoZXZlbnQsIHJlYWN0aW9uRGF0YSk7XG4gICAgcG9zdEV2ZW50KGV2ZW50KTtcbn1cblxuLy8gVE9ETzogSG9vayB0aGlzIHVwIG9uY2UgcmVhY3Rpb24gc2hhcmluZyBpcyBpbiBwbGFjZS5cbi8vIFRPRE86IENvbmZpcm0gd2l0aCBQb3J0ZXIgdGhhdCB0aGUgb3RoZXIgcGxhY2UgdGhlICdzaCcgZXZlbnQgaXMgZmlyZWQsIF9tYWtlU2hhcmVJY29ucywgaXMgZGVhZCBjb2RlXG5mdW5jdGlvbiBwb3N0UmVhY3Rpb25TaGFyZWQocGFnZURhdGEsIGNvbnRhaW5lckRhdGEsIHJlYWN0aW9uRGF0YSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBldmVudFZhbHVlID0gJyc7IC8vIFRPRE86ICdmYWNlYm9vaycsICd0d2l0dGVyJywgZXRjXG4gICAgdmFyIGV2ZW50ID0gY3JlYXRlRXZlbnQoZXZlbnRUeXBlcy5yZWFjdGlvblNoYXJlZCwgZXZlbnRWYWx1ZSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgYXBwZW5kUGFnZURhdGFQYXJhbXMoZXZlbnQsIHBhZ2VEYXRhKTtcbiAgICBhcHBlbmRDb250YWluZXJEYXRhUGFyYW1zKGV2ZW50LCBjb250YWluZXJEYXRhKTtcbiAgICBhcHBlbmRSZWFjdGlvbkRhdGFQYXJhbXMoZXZlbnQsIHJlYWN0aW9uRGF0YSk7XG4gICAgcG9zdEV2ZW50KGV2ZW50KTtcbn1cblxuZnVuY3Rpb24gcG9zdExvY2F0aW9uc1ZpZXdlZChwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBldmVudCA9IGNyZWF0ZUV2ZW50KGV2ZW50VHlwZXMuc3VtbWFyeVdpZGdldCwgZXZlbnRWYWx1ZXMubG9jYXRpb25zVmlld2VkLCBncm91cFNldHRpbmdzKTtcbiAgICBhcHBlbmRQYWdlRGF0YVBhcmFtcyhldmVudCwgcGFnZURhdGEpO1xuICAgIHBvc3RFdmVudChldmVudCk7XG59XG5cbmZ1bmN0aW9uIHBvc3RDb250ZW50Vmlld2VkKHBhZ2VEYXRhLCBjb250YWluZXJEYXRhLCBsb2NhdGlvbkRhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgZXZlbnQgPSBjcmVhdGVFdmVudChldmVudFR5cGVzLnN1bW1hcnlXaWRnZXQsIGV2ZW50VmFsdWVzLmNvbnRlbnRWaWV3ZWQsIGdyb3VwU2V0dGluZ3MpO1xuICAgIGFwcGVuZFBhZ2VEYXRhUGFyYW1zKGV2ZW50LCBwYWdlRGF0YSk7XG4gICAgYXBwZW5kQ29udGFpbmVyRGF0YVBhcmFtcyhldmVudCwgY29udGFpbmVyRGF0YSk7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5jb250ZW50SWRdID0gbG9jYXRpb25EYXRhLmNvbnRlbnRJZDtcbiAgICBldmVudFthdHRyaWJ1dGVzLmNvbnRlbnRMb2NhdGlvbl0gPSBsb2NhdGlvbkRhdGEubG9jYXRpb247XG4gICAgcG9zdEV2ZW50KGV2ZW50KTtcbn1cblxuZnVuY3Rpb24gcG9zdENvbW1lbnRzVmlld2VkKHBhZ2VEYXRhLCBjb250YWluZXJEYXRhLCByZWFjdGlvbkRhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgZXZlbnQgPSBjcmVhdGVFdmVudChldmVudFR5cGVzLmNvbW1lbnRzVmlld2VkLCAnJywgZ3JvdXBTZXR0aW5ncyk7XG4gICAgYXBwZW5kUGFnZURhdGFQYXJhbXMoZXZlbnQsIHBhZ2VEYXRhKTtcbiAgICBhcHBlbmRDb250YWluZXJEYXRhUGFyYW1zKGV2ZW50LCBjb250YWluZXJEYXRhKTtcbiAgICBhcHBlbmRSZWFjdGlvbkRhdGFQYXJhbXMoZXZlbnQsIHJlYWN0aW9uRGF0YSk7XG4gICAgcG9zdEV2ZW50KGV2ZW50KTtcbn1cblxuZnVuY3Rpb24gcG9zdENvbW1lbnRDcmVhdGVkKHBhZ2VEYXRhLCBjb250YWluZXJEYXRhLCByZWFjdGlvbkRhdGEsIGNvbW1lbnQsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgZXZlbnQgPSBjcmVhdGVFdmVudChldmVudFR5cGVzLmNvbW1lbnRDcmVhdGVkLCBjb21tZW50LCBncm91cFNldHRpbmdzKTtcbiAgICBhcHBlbmRQYWdlRGF0YVBhcmFtcyhldmVudCwgcGFnZURhdGEpO1xuICAgIGFwcGVuZENvbnRhaW5lckRhdGFQYXJhbXMoZXZlbnQsIGNvbnRhaW5lckRhdGEpO1xuICAgIGFwcGVuZFJlYWN0aW9uRGF0YVBhcmFtcyhldmVudCwgcmVhY3Rpb25EYXRhKTtcbiAgICBwb3N0RXZlbnQoZXZlbnQpO1xufVxuXG5mdW5jdGlvbiBwb3N0UmVjaXJjQ2xpY2tlZChwYWdlRGF0YSwgcmVhY3Rpb25JZCwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBldmVudCA9IGNyZWF0ZUV2ZW50KGV2ZW50VHlwZXMucmVjaXJjQ2xpY2tlZCwgcmVhY3Rpb25JZCwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgYXBwZW5kUGFnZURhdGFQYXJhbXMoZXZlbnQsIHBhZ2VEYXRhKTtcbiAgICBwb3N0RXZlbnQoZXZlbnQpO1xufVxuXG5mdW5jdGlvbiBhcHBlbmRQYWdlRGF0YVBhcmFtcyhldmVudCwgcGFnZURhdGEpIHtcbiAgICBldmVudFthdHRyaWJ1dGVzLnBhZ2VJZF0gPSBwYWdlRGF0YS5wYWdlSWQ7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5wYWdlVGl0bGVdID0gcGFnZURhdGEudGl0bGU7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5jYW5vbmljYWxVcmxdID0gcGFnZURhdGEuY2Fub25pY2FsVXJsO1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMucGFnZVVybF0gPSBwYWdlRGF0YS5yZXF1ZXN0ZWRVcmw7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5hcnRpY2xlSGVpZ2h0XSA9IDAgfHwgcGFnZURhdGEubWV0cmljcy5oZWlnaHQ7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5wYWdlVG9waWNzXSA9IHBhZ2VEYXRhLnRvcGljcztcbiAgICBldmVudFthdHRyaWJ1dGVzLmF1dGhvcl0gPSBwYWdlRGF0YS5hdXRob3I7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5zaXRlU2VjdGlvbl0gPSBwYWdlRGF0YS5zZWN0aW9uO1xufVxuXG5mdW5jdGlvbiBhcHBlbmRDb250YWluZXJEYXRhUGFyYW1zKGV2ZW50LCBjb250YWluZXJEYXRhKSB7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5jb250YWluZXJIYXNoXSA9IGNvbnRhaW5lckRhdGEuaGFzaDtcbiAgICBldmVudFthdHRyaWJ1dGVzLmNvbnRhaW5lcktpbmRdID0gY29udGFpbmVyRGF0YS50eXBlO1xufVxuXG5mdW5jdGlvbiBhcHBlbmRSZWFjdGlvbkRhdGFQYXJhbXMoZXZlbnQsIHJlYWN0aW9uRGF0YSkge1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMucmVhY3Rpb25Cb2R5XSA9IHJlYWN0aW9uRGF0YS50ZXh0O1xuICAgIGlmIChyZWFjdGlvbkRhdGEuY29udGVudCkge1xuICAgICAgICBldmVudFthdHRyaWJ1dGVzLmNvbnRlbnRMb2NhdGlvbl0gPSByZWFjdGlvbkRhdGEuY29udGVudC5sb2NhdGlvbjtcbiAgICAgICAgZXZlbnRbYXR0cmlidXRlcy5jb250ZW50SWRdID0gcmVhY3Rpb25EYXRhLmNvbnRlbnQuaWQ7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBjcmVhdGVFdmVudChldmVudFR5cGUsIGV2ZW50VmFsdWUsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgcmVmZXJyZXJEb21haW4gPSBkb2N1bWVudC5yZWZlcnJlci5zcGxpdCgnLycpLnNwbGljZSgyKS5qb2luKCcvJyk7IC8vIFRPRE86IGVuZ2FnZV9mdWxsIGNvZGUuIFJldmlld1xuXG4gICAgdmFyIGV2ZW50ID0ge307XG4gICAgZXZlbnRbYXR0cmlidXRlcy5ldmVudFR5cGVdID0gZXZlbnRUeXBlO1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMuZXZlbnRWYWx1ZV0gPSBldmVudFZhbHVlO1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMuZ3JvdXBJZF0gPSBncm91cFNldHRpbmdzLmdyb3VwSWQoKTtcbiAgICBldmVudFthdHRyaWJ1dGVzLnNob3J0VGVybVNlc3Npb25dID0gZ2V0U2hvcnRUZXJtU2Vzc2lvbklkKCk7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5sb25nVGVybVNlc3Npb25dID0gZ2V0TG9uZ1Rlcm1TZXNzaW9uSWQoKTtcbiAgICBldmVudFthdHRyaWJ1dGVzLnJlZmVycmVyVXJsXSA9IHJlZmVycmVyRG9tYWluO1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMuaXNUb3VjaEJyb3dzZXJdID0gQnJvd3Nlck1ldHJpY3Muc3VwcG9ydHNUb3VjaCgpO1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMuc2NyZWVuV2lkdGhdID0gc2NyZWVuLndpZHRoO1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMuc2NyZWVuSGVpZ2h0XSA9IHNjcmVlbi5oZWlnaHQ7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5waXhlbERlbnNpdHldID0gd2luZG93LmRldmljZVBpeGVsUmF0aW8gfHwgTWF0aC5yb3VuZCh3aW5kb3cuc2NyZWVuLmF2YWlsV2lkdGggLyBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50V2lkdGgpOyAvLyBUT0RPOiByZXZpZXcgdGhpcyBlbmdhZ2VfZnVsbCBjb2RlLCB3aGljaCBkb2Vzbid0IHNlZW0gY29ycmVjdFxuICAgIGV2ZW50W2F0dHJpYnV0ZXMudXNlckFnZW50XSA9IG5hdmlnYXRvci51c2VyQWdlbnQ7XG4gICAgcmV0dXJuIGV2ZW50O1xufVxuXG5mdW5jdGlvbiBwb3N0RXZlbnQoZXZlbnQpIHtcbiAgICBYRE1DbGllbnQuZ2V0VXNlcihmdW5jdGlvbih1c2VySW5mbykge1xuICAgICAgICBldmVudFthdHRyaWJ1dGVzLnVzZXJJZF0gPSB1c2VySW5mby51c2VyX2lkO1xuICAgICAgICBmaWxsSW5NaXNzaW5nUHJvcGVydGllcyhldmVudCk7XG4gICAgICAgIC8vIFNlbmQgdGhlIGV2ZW50IHRvIEJpZ1F1ZXJ5XG4gICAgICAgIEFqYXhDbGllbnQucG9zdEV2ZW50KGV2ZW50KTtcbiAgICB9KTtcbn1cblxuLy8gRmlsbCBpbiBhbnkgb3B0aW9uYWwgcHJvcGVydGllcyB3aXRoIG51bGwgdmFsdWVzLlxuZnVuY3Rpb24gZmlsbEluTWlzc2luZ1Byb3BlcnRpZXMoZXZlbnQpIHtcbiAgICBmb3IgKHZhciBhdHRyIGluIGF0dHJpYnV0ZXMpIHtcbiAgICAgICAgaWYgKGV2ZW50W2F0dHJpYnV0ZXNbYXR0cl1dID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGV2ZW50W2F0dHJpYnV0ZXNbYXR0cl1dID0gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gZ2V0TG9uZ1Rlcm1TZXNzaW9uSWQoKSB7XG4gICAgdmFyIGd1aWQgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnYW50X2x0cycpO1xuICAgIGlmICghZ3VpZCkge1xuICAgICAgICBndWlkID0gY3JlYXRlR3VpZCgpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2FudF9sdHMnLCBndWlkKTtcbiAgICAgICAgfSBjYXRjaChlcnJvcikge1xuICAgICAgICAgICAgLy8gU29tZSBicm93c2VycyAobW9iaWxlIFNhZmFyaSkgdGhyb3cgYW4gZXhjZXB0aW9uIHdoZW4gaW4gcHJpdmF0ZSBicm93c2luZyBtb2RlLlxuICAgICAgICAgICAgLy8gTm90aGluZyB3ZSBjYW4gZG8gYWJvdXQgaXQuIEp1c3QgZmFsbCB0aHJvdWdoIGFuZCByZXR1cm4gdGhlIHZhbHVlIHdlIGdlbmVyYXRlZC5cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZ3VpZDtcbn1cblxuZnVuY3Rpb24gZ2V0U2hvcnRUZXJtU2Vzc2lvbklkKCkge1xuICAgIHZhciBzZXNzaW9uO1xuICAgIHZhciBqc29uID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ2FudF9zdHMnKTtcbiAgICBpZiAoanNvbikge1xuICAgICAgICBzZXNzaW9uID0gSlNPTi5wYXJzZShqc29uKTtcbiAgICAgICAgaWYgKERhdGUubm93KCkgPiBzZXNzaW9uLmV4cGlyZXMpIHtcbiAgICAgICAgICAgIHNlc3Npb24gPSBudWxsO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmICghc2Vzc2lvbikge1xuICAgICAgICB2YXIgbWludXRlcyA9IDE1O1xuICAgICAgICBzZXNzaW9uID0ge1xuICAgICAgICAgICAgZ3VpZDogY3JlYXRlR3VpZCgpLFxuICAgICAgICAgICAgZXhwaXJlczogRGF0ZS5ub3coKSArIG1pbnV0ZXMgKiA2MDAwMFxuICAgICAgICB9O1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnYW50X3N0cycsIEpTT04uc3RyaW5naWZ5KHNlc3Npb24pKTtcbiAgICB9IGNhdGNoKGVycm9yKSB7XG4gICAgICAgIC8vIFNvbWUgYnJvd3NlcnMgKG1vYmlsZSBTYWZhcmkpIHRocm93IGFuIGV4Y2VwdGlvbiB3aGVuIGluIHByaXZhdGUgYnJvd3NpbmcgbW9kZS5cbiAgICAgICAgLy8gTm90aGluZyB3ZSBjYW4gZG8gYWJvdXQgaXQuIEp1c3QgZmFsbCB0aHJvdWdoIGFuZCByZXR1cm4gdGhlIHZhbHVlIHdlIGdlbmVyYXRlZC5cbiAgICB9XG4gICAgcmV0dXJuIHNlc3Npb24uZ3VpZDtcbn1cblxuZnVuY3Rpb24gY3JlYXRlR3VpZCgpIHtcbiAgICAvLyBDb2RlIGNvcGllZCBmcm9tIGVuZ2FnZV9mdWxsIChvcmlnaW5hbGx5LCBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzEwNTAzNC9jcmVhdGUtZ3VpZC11dWlkLWluLWphdmFzY3JpcHQpXG4gICAgcmV0dXJuICd4eHh4eHh4eC14eHh4LTR4eHgteXh4eC14eHh4eHh4eHh4eHgnLnJlcGxhY2UoL1t4eV0vZywgZnVuY3Rpb24gKGMpIHtcbiAgICAgICAgdmFyIHIgPSBNYXRoLnJhbmRvbSgpICogMTYgfCAwLCB2ID0gYyA9PSAneCcgPyByIDogKHIgJiAweDMgfCAweDgpO1xuICAgICAgICByZXR1cm4gdi50b1N0cmluZygxNik7XG4gICAgfSk7XG59XG5cbnZhciBhdHRyaWJ1dGVzID0ge1xuICAgIGV2ZW50VHlwZTogJ2V0JyxcbiAgICBldmVudFZhbHVlOiAnZXYnLFxuICAgIGdyb3VwSWQ6ICdnaWQnLFxuICAgIHVzZXJJZDogJ3VpZCcsXG4gICAgcGFnZUlkOiAncGlkJyxcbiAgICBsb25nVGVybVNlc3Npb246ICdsdHMnLFxuICAgIHNob3J0VGVybVNlc3Npb246ICdzdHMnLFxuICAgIHJlZmVycmVyVXJsOiAncmVmJyxcbiAgICBjb250ZW50SWQ6ICdjaWQnLFxuICAgIGFydGljbGVIZWlnaHQ6ICdhaCcsXG4gICAgY29udGFpbmVySGFzaDogJ2NoJyxcbiAgICBjb250YWluZXJLaW5kOiAnY2snLFxuICAgIHJlYWN0aW9uQm9keTogJ3InLFxuICAgIHBhZ2VUaXRsZTogJ3B0JyxcbiAgICBjYW5vbmljYWxVcmw6ICdjdScsXG4gICAgcGFnZVVybDogJ3B1JyxcbiAgICBjb250ZW50QXR0cmlidXRlczogJ2NhJyxcbiAgICBjb250ZW50TG9jYXRpb246ICdjbCcsXG4gICAgcGFnZVRvcGljczogJ3B0b3AnLFxuICAgIGF1dGhvcjogJ2EnLFxuICAgIHNpdGVTZWN0aW9uOiAnc2VjJyxcbiAgICBpc1RvdWNoQnJvd3NlcjogJ2l0JyxcbiAgICBzY3JlZW5XaWR0aDogJ3N3JyxcbiAgICBzY3JlZW5IZWlnaHQ6ICdzaCcsXG4gICAgcGl4ZWxEZW5zaXR5OiAncGQnLFxuICAgIHVzZXJBZ2VudDogJ3VhJ1xufTtcblxudmFyIGV2ZW50VHlwZXMgPSB7XG4gICAgc2NyaXB0TG9hZDogJ3NsJyxcbiAgICByZWFjdGlvblNoYXJlZDogJ3NoJyxcbiAgICBzdW1tYXJ5V2lkZ2V0OiAnc2InLFxuICAgIHJlYWN0aW9uV2lkZ2V0T3BlbmVkOiAncnMnLFxuICAgIHBhZ2VEYXRhTG9hZGVkOiAnd2wnLFxuICAgIGNvbW1lbnRDcmVhdGVkOiAnYycsXG4gICAgcmVhY3Rpb25DcmVhdGVkOiAncmUnLFxuICAgIGNvbW1lbnRzVmlld2VkOiAndmNvbScsXG4gICAgcmVjaXJjQ2xpY2tlZDogJ3JjJ1xufTtcblxudmFyIGV2ZW50VmFsdWVzID0ge1xuICAgIGNvbnRlbnRWaWV3ZWQ6ICd2YycsIC8vIHZpZXdfY29udGVudFxuICAgIGxvY2F0aW9uc1ZpZXdlZDogJ3ZyJywgLy8gdmlld19yZWFjdGlvbnNcbiAgICBzaG93RGVmYXVsdHM6ICd3cicsXG4gICAgc2hvd1JlYWN0aW9uczogJ3JkJyxcbiAgICBzaW5nbGVQYWdlOiAnc2knLFxuICAgIG11bHRpcGxlUGFnZXM6ICdtdScsXG4gICAgdmlld1JlYWN0aW9uczogJ3Z3JyxcbiAgICB2aWV3RGVmYXVsdHM6ICdhZCdcbn07XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBwb3N0R3JvdXBTZXR0aW5nc0xvYWRlZDogcG9zdEdyb3VwU2V0dGluZ3NMb2FkZWQsXG4gICAgcG9zdFBhZ2VEYXRhTG9hZGVkOiBwb3N0UGFnZURhdGFMb2FkZWQsXG4gICAgcG9zdFN1bW1hcnlPcGVuZWQ6IHBvc3RTdW1tYXJ5T3BlbmVkLFxuICAgIHBvc3RDb21tZW50c1ZpZXdlZDogcG9zdENvbW1lbnRzVmlld2VkLFxuICAgIHBvc3RDb21tZW50Q3JlYXRlZDogcG9zdENvbW1lbnRDcmVhdGVkLFxuICAgIHBvc3RSZWFjdGlvbldpZGdldE9wZW5lZDogcG9zdFJlYWN0aW9uV2lkZ2V0T3BlbmVkLFxuICAgIHBvc3RSZWFjdGlvbkNyZWF0ZWQ6IHBvc3RSZWFjdGlvbkNyZWF0ZWQsXG4gICAgcG9zdFJlYWN0aW9uU2hhcmVkOiBwb3N0UmVhY3Rpb25TaGFyZWQsXG4gICAgcG9zdExvY2F0aW9uc1ZpZXdlZDogcG9zdExvY2F0aW9uc1ZpZXdlZCxcbiAgICBwb3N0Q29udGVudFZpZXdlZDogcG9zdENvbnRlbnRWaWV3ZWQsXG4gICAgcG9zdFJlY2lyY0NsaWNrZWQ6IHBvc3RSZWNpcmNDbGlja2VkXG59OyIsInZhciAkOyByZXF1aXJlKCcuL3V0aWxzL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIEFqYXhDbGllbnQgPSByZXF1aXJlKCcuL3V0aWxzL2FqYXgtY2xpZW50Jyk7XG52YXIgVVJMcyA9IHJlcXVpcmUoJy4vdXRpbHMvdXJscycpO1xudmFyIEdyb3VwU2V0dGluZ3MgPSByZXF1aXJlKCcuL2dyb3VwLXNldHRpbmdzJyk7XG5cbi8vIFRPRE8gZm9sZCB0aGlzIG1vZHVsZSBpbnRvIGdyb3VwLXNldHRpbmdzP1xuXG5mdW5jdGlvbiBsb2FkU2V0dGluZ3MoY2FsbGJhY2spIHtcbiAgICBBamF4Q2xpZW50LmdldEpTT05QKFVSTHMuZ3JvdXBTZXR0aW5nc1VybCgpLCB7IGhvc3RfbmFtZTogd2luZG93LmFudGVubmFfaG9zdCB9LCBzdWNjZXNzLCBlcnJvcik7XG5cbiAgICBmdW5jdGlvbiBzdWNjZXNzKGpzb24pIHtcbiAgICAgICAgdmFyIGdyb3VwU2V0dGluZ3MgPSBHcm91cFNldHRpbmdzLmNyZWF0ZShqc29uKTtcbiAgICAgICAgY2FsbGJhY2soZ3JvdXBTZXR0aW5ncyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZXJyb3IobWVzc2FnZSkge1xuICAgICAgICAvLyBUT0RPIGhhbmRsZSBlcnJvcnMgdGhhdCBoYXBwZW4gd2hlbiBsb2FkaW5nIGNvbmZpZyBkYXRhXG4gICAgICAgIGNvbnNvbGUubG9nKCdBbiBlcnJvciBvY2N1cnJlZCBsb2FkaW5nIGdyb3VwIHNldHRpbmdzOiAnICsgbWVzc2FnZSk7XG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgbG9hZDogbG9hZFNldHRpbmdzXG59OyIsInZhciAkOyByZXF1aXJlKCcuL3V0aWxzL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xuXG52YXIgRXZlbnRzID0gcmVxdWlyZSgnLi9ldmVudHMnKTtcblxudmFyIGdyb3VwU2V0dGluZ3M7XG5cbi8vIFRPRE86IFVwZGF0ZSBhbGwgY2xpZW50cyB0aGF0IGFyZSBwYXNzaW5nIGFyb3VuZCBhIGdyb3VwU2V0dGluZ3Mgb2JqZWN0IHRvIGluc3RlYWQgYWNjZXNzIHRoZSAnZ2xvYmFsJyBzZXR0aW5ncyBpbnN0YW5jZVxuZnVuY3Rpb24gZ2V0R3JvdXBTZXR0aW5ncygpIHtcbiAgICByZXR1cm4gZ3JvdXBTZXR0aW5ncztcbn1cblxuZnVuY3Rpb24gdXBkYXRlRnJvbUpTT04oanNvbikge1xuICAgIGdyb3VwU2V0dGluZ3MgPSBjcmVhdGVGcm9tSlNPTihqc29uKTtcbiAgICBFdmVudHMucG9zdEdyb3VwU2V0dGluZ3NMb2FkZWQoZ3JvdXBTZXR0aW5ncyk7XG4gICAgcmV0dXJuIGdyb3VwU2V0dGluZ3M7XG59XG5cblxuLy8gVE9ETzogdHJpbSB0cmFpbGluZyBjb21tYXMgZnJvbSBhbnkgc2VsZWN0b3IgdmFsdWVzXG5cbi8vIFRPRE86IFJldmlldy4gVGhlc2UgYXJlIGp1c3QgY29waWVkIGZyb20gZW5nYWdlX2Z1bGwuXG52YXIgZGVmYXVsdHMgPSB7XG4gICAgcHJlbWl1bTogZmFsc2UsXG4gICAgaW1nX3NlbGVjdG9yOiBcImltZ1wiLCAvLyBUT0RPOiB0aGlzIGlzIHNvbWUgYm9ndXMgb2Jzb2xldGUgcHJvcGVydHkuIHdlIHNob3VsZG4ndCB1c2UgaXQuXG4gICAgaW1nX2NvbnRhaW5lcl9zZWxlY3RvcnM6XCIjcHJpbWFyeS1waG90b1wiLFxuICAgIGFjdGl2ZV9zZWN0aW9uczogXCJib2R5XCIsXG4gICAgLy9hbm5vX3doaXRlbGlzdDogXCJib2R5IHBcIixcbiAgICBhbm5vX3doaXRlbGlzdDogXCJwXCIsIC8vIFRPRE86IFRoZSBjdXJyZW50IGRlZmF1bHQgaXMgXCJib2R5IHBcIiwgd2hpY2ggbWFrZXMgbm8gc2Vuc2Ugd2hlbiB3ZSdyZSBzZWFyY2hpbmcgb25seSB3aXRoaW4gdGhlIGFjdGl2ZSBzZWN0aW9uc1xuICAgIGFjdGl2ZV9zZWN0aW9uc193aXRoX2Fubm9fd2hpdGVsaXN0OlwiXCIsXG4gICAgbWVkaWFfc2VsZWN0b3I6IFwiZW1iZWQsIHZpZGVvLCBvYmplY3QsIGlmcmFtZVwiLFxuICAgIGNvbW1lbnRfbGVuZ3RoOiA1MDAsXG4gICAgbm9fYW50OiBcIlwiLFxuICAgIGltZ19ibGFja2xpc3Q6IFwiXCIsXG4gICAgY3VzdG9tX2NzczogXCJcIixcbiAgICAvL3RvZG86IHRlbXAgaW5saW5lX2luZGljYXRvciBkZWZhdWx0cyB0byBtYWtlIHRoZW0gc2hvdyB1cCBvbiBhbGwgbWVkaWEgLSByZW1vdmUgdGhpcyBsYXRlci5cbiAgICBpbmxpbmVfc2VsZWN0b3I6ICdpbWcsIGVtYmVkLCB2aWRlbywgb2JqZWN0LCBpZnJhbWUnLFxuICAgIHBhcmFncmFwaF9oZWxwZXI6IHRydWUsXG4gICAgbWVkaWFfdXJsX2lnbm9yZV9xdWVyeTogdHJ1ZSxcbiAgICBzdW1tYXJ5X3dpZGdldF9zZWxlY3RvcjogJy5hbnQtcGFnZS1zdW1tYXJ5JywgLy8gVE9ETzogdGhpcyB3YXNuJ3QgZGVmaW5lZCBhcyBhIGRlZmF1bHQgaW4gZW5nYWdlX2Z1bGwsIGJ1dCB3YXMgaW4gY29kZS4gd2h5P1xuICAgIHN1bW1hcnlfd2lkZ2V0X21ldGhvZDogJ2FmdGVyJyxcbiAgICBsYW5ndWFnZTogJ2VuJyxcbiAgICBhYl90ZXN0X2ltcGFjdDogdHJ1ZSxcbiAgICBhYl90ZXN0X3NhbXBsZV9wZXJjZW50YWdlOiAxMCxcbiAgICBpbWdfaW5kaWNhdG9yX3Nob3dfb25sb2FkOiB0cnVlLFxuICAgIGltZ19pbmRpY2F0b3Jfc2hvd19zaWRlOiAnbGVmdCcsXG4gICAgdGFnX2JveF9iZ19jb2xvcnM6ICcnLFxuICAgIHRhZ19ib3hfdGV4dF9jb2xvcnM6ICcnLFxuICAgIHRhZ19ib3hfZm9udF9mYW1pbHk6ICdIZWx2ZXRpY2FOZXVlLEhlbHZldGljYSxBcmlhbCxzYW5zLXNlcmlmJyxcbiAgICB0YWdzX2JnX2NzczogJycsXG4gICAgaWdub3JlX3N1YmRvbWFpbjogZmFsc2UsXG4gICAgaW1hZ2Vfc2VsZWN0b3I6ICdtZXRhW3Byb3BlcnR5PVwib2c6aW1hZ2VcIl0nLCAvLyBUT0RPOiByZXZpZXcgd2hhdCB0aGlzIHNob3VsZCBiZSAobm90IGZyb20gZW5nYWdlX2Z1bGwpXG4gICAgaW1hZ2VfYXR0cmlidXRlOiAnY29udGVudCcsIC8vIFRPRE86IHJldmlldyB3aGF0IHRoaXMgc2hvdWxkIGJlIChub3QgZnJvbSBlbmdhZ2VfZnVsbClcbiAgICAvL3RoZSBzY29wZSBpbiB3aGljaCB0byBmaW5kIHBhcmVudHMgb2YgPGJyPiB0YWdzLlxuICAgIC8vVGhvc2UgcGFyZW50cyB3aWxsIGJlIGNvbnZlcnRlZCB0byBhIDxydD4gYmxvY2ssIHNvIHRoZXJlIHdvbid0IGJlIG5lc3RlZCA8cD4gYmxvY2tzLlxuICAgIC8vdGhlbiBpdCB3aWxsIHNwbGl0IHRoZSBwYXJlbnQncyBodG1sIG9uIDxicj4gdGFncyBhbmQgd3JhcCB0aGUgc2VjdGlvbnMgaW4gPHA+IHRhZ3MuXG5cbiAgICAvL2V4YW1wbGU6XG4gICAgLy8gYnJfcmVwbGFjZV9zY29wZV9zZWxlY3RvcjogXCIuYW50X2JyX3JlcGxhY2VcIiAvL2UuZy4gXCIjbWFpbnNlY3Rpb25cIiBvciBcInBcIlxuXG4gICAgYnJfcmVwbGFjZV9zY29wZV9zZWxlY3RvcjogbnVsbCAvL2UuZy4gXCIjbWFpbnNlY3Rpb25cIiBvciBcInBcIlxufTtcblxuZnVuY3Rpb24gY3JlYXRlRnJvbUpTT04oanNvbikge1xuXG4gICAgZnVuY3Rpb24gZGF0YShrZXksIGlmQWJzZW50KSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IHdpbmRvdy5hbnRlbm5hX2V4dGVuZFtrZXldO1xuICAgICAgICAgICAgaWYgKHZhbHVlID09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHZhbHVlID0ganNvbltrZXldO1xuICAgICAgICAgICAgICAgIC8vIFRPRE86IG91ciBzZXJ2ZXIgYXBwYXJlbnRseSBzZW5kcyBiYWNrIG51bGwgYXMgYSB2YWx1ZSBmb3Igc29tZSBhdHRyaWJ1dGVzLlxuICAgICAgICAgICAgICAgIC8vIFRPRE86IGNvbnNpZGVyIGNoZWNraW5nIGZvciBudWxsIHdoZXJldmVyIHdlJ3JlIGNoZWNraW5nIGZvciB1bmRlZmluZWRcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCB8fCB2YWx1ZSA9PT0gJycgfHwgdmFsdWUgPT09IG51bGwpIHsgLy8gVE9ETzogU2hvdWxkIHRoZSBzZXJ2ZXIgYmUgc2VuZGluZyBiYWNrICcnIGhlcmUgb3Igbm90aGluZyBhdCBhbGw/IChJdCBwcmVjbHVkZXMgdGhlIHNlcnZlciBmcm9tIHJlYWxseSBzYXlpbmcgJ25vdGhpbmcnKVxuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IGRlZmF1bHRzW2tleV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHZhbHVlID09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBpZkFic2VudDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBiYWNrZ3JvdW5kQ29sb3IoYWNjZXNzb3IpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIGNvbG9ycyA9IFtdO1xuICAgICAgICAgICAgdmFyIHZhbHVlID0gYWNjZXNzb3IoKTtcbiAgICAgICAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgIGNvbG9ycyA9IHZhbHVlLnNwbGl0KCc7Jyk7XG4gICAgICAgICAgICAgICAgY29sb3JzID0gbWlncmF0ZVZhbHVlcyhjb2xvcnMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGNvbG9ycztcblxuICAgICAgICAgICAgLy8gTWlncmF0ZSBhbnkgY29sb3JzIGZyb20gdGhlICcxLCAyLCAzJyBmb3JtYXQgdG8gJ3JnYigxLCAyLCAzKScuIFRoaXMgY29kZSBjYW4gYmUgZGVsZXRlZCBvbmNlIHdlJ3ZlIHVwZGF0ZWRcbiAgICAgICAgICAgIC8vIGFsbCBzaXRlcyB0byBzcGVjaWZ5aW5nIHZhbGlkIENTUyBjb2xvciB2YWx1ZXNcbiAgICAgICAgICAgIGZ1bmN0aW9uIG1pZ3JhdGVWYWx1ZXMoY29sb3JWYWx1ZXMpIHtcbiAgICAgICAgICAgICAgICB2YXIgbWlncmF0aW9uTWF0Y2hlciA9IC9eXFxzKlxcZCtcXHMqLFxccypcXGQrXFxzKixcXHMqXFxkK1xccyokL2dpbTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvbG9yVmFsdWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9IGNvbG9yVmFsdWVzW2ldO1xuICAgICAgICAgICAgICAgICAgICBpZiAobWlncmF0aW9uTWF0Y2hlci50ZXN0KHZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3JWYWx1ZXNbaV0gPSAncmdiKCcgKyB2YWx1ZSArICcpJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gY29sb3JWYWx1ZXM7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkZWZhdWx0UmVhY3Rpb25zKCRlbGVtZW50KSB7XG4gICAgICAgIC8vIERlZmF1bHQgcmVhY3Rpb25zIGFyZSBhdmFpbGFibGUgaW4gdGhyZWUgbG9jYXRpb25zIGluIHRocmVlIGRhdGEgZm9ybWF0czpcbiAgICAgICAgLy8gMS4gQXMgYSBjb21tYS1zZXBhcmF0ZWQgYXR0cmlidXRlIHZhbHVlIG9uIGEgcGFydGljdWxhciBlbGVtZW50XG4gICAgICAgIC8vIDIuIEFzIGFuIGFycmF5IG9mIHN0cmluZ3Mgb24gdGhlIHdpbmRvdy5hbnRlbm5hX2V4dGVuZCBwcm9wZXJ0eVxuICAgICAgICAvLyAzLiBBcyBhIGpzb24gb2JqZWN0IHdpdGggYSBib2R5IGFuZCBpZCBvbiB0aGUgZ3JvdXAgc2V0dGluZ3NcbiAgICAgICAgdmFyIHJlYWN0aW9ucyA9IFtdO1xuICAgICAgICB2YXIgcmVhY3Rpb25TdHJpbmdzO1xuICAgICAgICB2YXIgZWxlbWVudFJlYWN0aW9ucyA9ICRlbGVtZW50ID8gJGVsZW1lbnQuYXR0cignYW50LXJlYWN0aW9ucycpIDogdW5kZWZpbmVkO1xuICAgICAgICBpZiAoZWxlbWVudFJlYWN0aW9ucykge1xuICAgICAgICAgICAgcmVhY3Rpb25TdHJpbmdzID0gZWxlbWVudFJlYWN0aW9ucy5zcGxpdCgnOycpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVhY3Rpb25TdHJpbmdzID0gd2luZG93LmFudGVubmFfZXh0ZW5kWydkZWZhdWx0X3JlYWN0aW9ucyddO1xuICAgICAgICB9XG4gICAgICAgIGlmIChyZWFjdGlvblN0cmluZ3MpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmVhY3Rpb25TdHJpbmdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgcmVhY3Rpb25zLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICB0ZXh0OiByZWFjdGlvblN0cmluZ3NbaV0sXG4gICAgICAgICAgICAgICAgICAgIGlzRGVmYXVsdDogdHJ1ZVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgdmFsdWVzID0ganNvblsnZGVmYXVsdF9yZWFjdGlvbnMnXTtcbiAgICAgICAgICAgIGlmICh2YWx1ZXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdmFsdWVzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9IHZhbHVlc1tqXTtcbiAgICAgICAgICAgICAgICAgICAgcmVhY3Rpb25zLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogdmFsdWUuYm9keSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkOiB2YWx1ZS5pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGlzRGVmYXVsdDogdHJ1ZVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlYWN0aW9ucztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjb21wdXRlQ3VzdG9tQ1NTKCkge1xuICAgICAgICAvLyBGaXJzdCByZWFkIGFueSByYXcgY3VzdG9tIENTUy5cbiAgICAgICAgdmFyIGN1c3RvbUNTUyA9IGRhdGEoJ2N1c3RvbV9jc3MnKSgpO1xuICAgICAgICAvLyBUaGVuIGFwcGVuZCBydWxlcyBmb3IgYW55IHNwZWNpZmljIENTUyBvdmVycmlkZXMuXG4gICAgICAgIGN1c3RvbUNTUyArPSBjcmVhdGVDdXN0b21DU1NSdWxlKGRhdGEoJ3RhZ3NfYmdfY3NzJywgJycpLCAnLmFudGVubmEtcmVhY3Rpb25zLXBhZ2UgLmFudGVubmEtYm9keSwgLmFudGVubmEtZGVmYXVsdHMtcGFnZSAuYW50ZW5uYS1ib2R5Jyk7XG4gICAgICAgIGN1c3RvbUNTUyArPSBjcmVhdGVDdXN0b21DU1NSdWxlKGRhdGEoJ3RhZ19ib3hfYmdfY29sb3JzJywgJycpLCAnLmFudGVubmEtcmVhY3Rpb24tYm94Jyk7XG4gICAgICAgIGN1c3RvbUNTUyArPSBjcmVhdGVDdXN0b21DU1NSdWxlKGRhdGEoJ3RhZ19ib3hfYmdfY29sb3JzX2hvdmVyJywgJycpLCAnLmFudGVubmEtcmVhY3Rpb246aG92ZXIgPiAuYW50ZW5uYS1yZWFjdGlvbi1ib3gnKTtcbiAgICAgICAgY3VzdG9tQ1NTICs9IGNyZWF0ZUN1c3RvbUNTU1J1bGUobWlncmF0ZVRleHRDb2xvclNldHRpbmdzKGRhdGEoJ3RhZ19ib3hfdGV4dF9jb2xvcnMnLCAnJykpLCAnLmFudGVubmEtcmVhY3Rpb24tYm94LCAuYW50ZW5uYS1yZWFjdGlvbi1jb21tZW50cyAuYW50ZW5uYS1jb21tZW50cy1wYXRoLCAuYW50ZW5uYS1yZWFjdGlvbi1sb2NhdGlvbiAuYW50ZW5uYS1sb2NhdGlvbi1wYXRoJyk7XG4gICAgICAgIGN1c3RvbUNTUyArPSBjcmVhdGVDdXN0b21DU1NSdWxlKG1pZ3JhdGVGb250RmFtaWx5U2V0dGluZyhkYXRhKCd0YWdfYm94X2ZvbnRfZmFtaWx5JywgJycpKSwgJy5hbnRlbm5hLXJlYWN0aW9uLWJveCcpO1xuICAgICAgICByZXR1cm4gY3VzdG9tQ1NTO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNyZWF0ZUN1c3RvbUNTU1J1bGUoZGVjbGFyYXRpb25zQWNjZXNzb3IsIHNlbGVjdG9yKSB7XG4gICAgICAgIHZhciBkZWNsYXJhdGlvbnMgPSBkZWNsYXJhdGlvbnNBY2Nlc3NvcigpLnRyaW0oKTtcbiAgICAgICAgaWYgKGRlY2xhcmF0aW9ucykge1xuICAgICAgICAgICAgcmV0dXJuICdcXG4nICsgc2VsZWN0b3IgKyAnIHtcXG4gICAgJyArIGRlY2xhcmF0aW9ucyArICdcXG59JztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gJyc7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWlncmF0ZUZvbnRGYW1pbHlTZXR0aW5nKGZvbnRGYW1pbHlBY2Nlc3Nvcikge1xuICAgICAgICAvLyBUT0RPOiBUaGlzIGlzIHRlbXBvcmFyeSBjb2RlIHRoYXQgbWlncmF0ZXMgdGhlIGN1cnJlbnQgdGFnX2JveF9mb250X2ZhbWlseSBzZXR0aW5nIGZyb20gYSByYXcgdmFsdWUgdG8gYVxuICAgICAgICAvLyAgICAgICBDU1MgZGVjbGFyYXRpb24uIFdlIHNob3VsZCBtaWdyYXRlIGFsbCBkZXBsb3llZCBzaXRlcyB0byB1c2UgYSBDU1MgZGVjbGFyYXRpb24gYW5kIHRoZW4gcmVtb3ZlIHRoaXMuXG4gICAgICAgIHZhciBmb250RmFtaWx5ID0gZm9udEZhbWlseUFjY2Vzc29yKCkudHJpbSgpO1xuICAgICAgICBpZiAoZm9udEZhbWlseSAmJiBmb250RmFtaWx5LmluZGV4T2YoJ2ZvbnQtZmFtaWx5JykgPT09IC0xKSB7XG4gICAgICAgICAgICBmb250RmFtaWx5ID0gJ2ZvbnQtZmFtaWx5OiAnICsgZm9udEZhbWlseTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gZm9udEZhbWlseTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1pZ3JhdGVUZXh0Q29sb3JTZXR0aW5ncyh0ZXh0Q29sb3JBY2Nlc3Nvcikge1xuICAgICAgICAvLyBUT0RPOiBUaGlzIGlzIHRlbXBvcmFyeSBjb2RlIHRoYXQgbWlncmF0ZXMgdGhlIGN1cnJlbnQgdGFnX2JveF90ZXh0X2NvbG9ycyBwcm9wZXJ0eSwgd2hpY2ggaXMgYSBkZWNsYXJhdGlvblxuICAgICAgICAvLyAgICAgICB0aGF0IG9ubHkgc2V0cyB0aGUgY29sb3IgcHJvcGVydHksIHRvIHNldCBib3RoIHRoZSBjb2xvciBhbmQgZmlsbCBwcm9wZXJ0aWVzLlxuICAgICAgICB2YXIgdGV4dENvbG9yID0gdGV4dENvbG9yQWNjZXNzb3IoKS50cmltKCk7XG4gICAgICAgIGlmICh0ZXh0Q29sb3IgJiYgdGV4dENvbG9yLmluZGV4T2YoJ2NvbG9yOicpID09PSAwICYmIHRleHRDb2xvci5pbmRleE9mKCdmaWxsOicpID09PSAtMSkge1xuICAgICAgICAgICAgdGV4dENvbG9yICs9IHRleHRDb2xvclt0ZXh0Q29sb3IubGVuZ3RoIC0gMV0gPT0gJzsnID8gJycgOiAnOyc7IC8vIGFwcGVuZCBhIHNlbWljb2xvbiBpZiBuZWVkZWRcbiAgICAgICAgICAgIHRleHRDb2xvciArPSB0ZXh0Q29sb3IucmVwbGFjZSgnY29sb3I6JywgJ1xcbiAgICBmaWxsOicpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiB0ZXh0Q29sb3I7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBsZWdhY3lCZWhhdmlvcjogZGF0YSgnbGVnYWN5X2JlaGF2aW9yJywgZmFsc2UpLCAvLyBUT0RPOiBtYWtlIHRoaXMgcmVhbCBpbiB0aGUgc2Vuc2UgdGhhdCBpdCBjb21lcyBiYWNrIGZyb20gdGhlIHNlcnZlciBhbmQgcHJvYmFibHkgbW92ZSB0aGUgZmxhZyB0byB0aGUgcGFnZSBkYXRhLiBVbmxpa2VseSB0aGF0IHdlIG5lZWQgdG8gbWFpbnRhaW4gbGVnYWN5IGJlaGF2aW9yIGZvciBuZXcgcGFnZXM/XG4gICAgICAgIGdyb3VwSWQ6IGRhdGEoJ2lkJyksXG4gICAgICAgIGFjdGl2ZVNlY3Rpb25zOiBkYXRhKCdhY3RpdmVfc2VjdGlvbnMnKSxcbiAgICAgICAgdXJsOiB7XG4gICAgICAgICAgICBpZ25vcmVTdWJkb21haW46IGRhdGEoJ2lnbm9yZV9zdWJkb21haW4nKSxcbiAgICAgICAgICAgIGNhbm9uaWNhbERvbWFpbjogZGF0YSgncGFnZV90bGQnKSAvLyBUT0RPOiB3aGF0IHRvIGNhbGwgdGhpcyBleGFjdGx5LiBncm91cERvbWFpbj8gc2l0ZURvbWFpbj8gY2Fub25pY2FsRG9tYWluP1xuICAgICAgICB9LFxuICAgICAgICBzdW1tYXJ5U2VsZWN0b3I6IGRhdGEoJ3N1bW1hcnlfd2lkZ2V0X3NlbGVjdG9yJyksXG4gICAgICAgIHN1bW1hcnlNZXRob2Q6IGRhdGEoJ3N1bW1hcnlfd2lkZ2V0X21ldGhvZCcpLFxuICAgICAgICBpc0V4cGFuZGVkTW9iaWxlU3VtbWFyeTogZGF0YSgnc3VtbWFyeV93aWRnZXRfZXhwYW5kZWRfbW9iaWxlJyksXG4gICAgICAgIHBhZ2VTZWxlY3RvcjogZGF0YSgncG9zdF9zZWxlY3RvcicpLFxuICAgICAgICBwYWdlTGlua1NlbGVjdG9yOiBkYXRhKCdwb3N0X2hyZWZfc2VsZWN0b3InKSxcbiAgICAgICAgcGFnZUltYWdlU2VsZWN0b3I6IGRhdGEoJ2ltYWdlX3NlbGVjdG9yJyksXG4gICAgICAgIHBhZ2VJbWFnZUF0dHJpYnV0ZTogZGF0YSgnaW1hZ2VfYXR0cmlidXRlJyksXG4gICAgICAgIHBhZ2VBdXRob3JTZWxlY3RvcjogZGF0YSgnYXV0aG9yX3NlbGVjdG9yJyksXG4gICAgICAgIHBhZ2VBdXRob3JBdHRyaWJ1dGU6IGRhdGEoJ2F1dGhvcl9hdHRyaWJ1dGUnKSxcbiAgICAgICAgcGFnZVRvcGljc1NlbGVjdG9yOiBkYXRhKCd0b3BpY3Nfc2VsZWN0b3InKSxcbiAgICAgICAgcGFnZVRvcGljc0F0dHJpYnV0ZTogZGF0YSgndG9waWNzX2F0dHJpYnV0ZScpLFxuICAgICAgICBwYWdlU2l0ZVNlY3Rpb25TZWxlY3RvcjogZGF0YSgnc2VjdGlvbl9zZWxlY3RvcicpLFxuICAgICAgICBwYWdlU2l0ZVNlY3Rpb25BdHRyaWJ1dGU6IGRhdGEoJ3NlY3Rpb25fYXR0cmlidXRlJyksXG4gICAgICAgIGNvbnRlbnRTZWxlY3RvcjogZGF0YSgnYW5ub193aGl0ZWxpc3QnKSxcbiAgICAgICAgdGV4dEluZGljYXRvckxpbWl0OiBkYXRhKCdpbml0aWFsX3Bpbl9saW1pdCcpLFxuICAgICAgICBlbmFibGVUZXh0SGVscGVyOiBkYXRhKCdwYXJhZ3JhcGhfaGVscGVyJyksXG4gICAgICAgIG1lZGlhSW5kaWNhdG9yQ29ybmVyOiBkYXRhKCdpbWdfaW5kaWNhdG9yX3Nob3dfc2lkZScpLFxuICAgICAgICBnZW5lcmF0ZWRDdGFTZWxlY3RvcjogZGF0YSgnc2VwYXJhdGVfY3RhJyksXG4gICAgICAgIGdlbmVyYXRlZEN0YUV4cGFuZGVkOiBkYXRhKCdzZXBhcmF0ZV9jdGFfZXhwYW5kZWQnKSxcbiAgICAgICAgZGVmYXVsdFJlYWN0aW9uczogZGVmYXVsdFJlYWN0aW9ucyxcbiAgICAgICAgY3VzdG9tQ1NTOiBjb21wdXRlQ3VzdG9tQ1NTLFxuICAgICAgICBleGNsdXNpb25TZWxlY3RvcjogZGF0YSgnbm9fYW50JyksIC8vIFRPRE86IG5vX3JlYWRyP1xuICAgICAgICBsYW5ndWFnZTogZGF0YSgnbGFuZ3VhZ2UnKVxuICAgIH1cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZTogdXBkYXRlRnJvbUpTT04sXG4gICAgZ2V0OiBnZXRHcm91cFNldHRpbmdzXG59OyIsIi8vIFRoaXMgbW9kdWxlIHN0b3JlcyBvdXIgbWFwcGluZyBmcm9tIGhhc2ggdmFsdWVzIHRvIHRoZWlyIGNvcnJlc3BvbmRpbmcgZWxlbWVudHMgaW4gdGhlIERPTS4gVGhlIGRhdGEgaXMgb3JnYW5pemVkXG4vLyBieSBwYWdlIGZvciB0aGUgYmxvZyByb2xsIGNhc2UsIHdoZXJlIG11bHRpcGxlIHBhZ2VzIG9mIGRhdGEgY2FuIGJlIGxvYWRlZCBhdCBvbmNlLlxudmFyIHBhZ2VzID0ge307XG5cbmZ1bmN0aW9uIGdldEVsZW1lbnQoY29udGFpbmVySGFzaCwgcGFnZUhhc2gpIHtcbiAgICB2YXIgY29udGFpbmVycyA9IHBhZ2VzW3BhZ2VIYXNoXTtcbiAgICBpZiAoY29udGFpbmVycykge1xuICAgICAgICByZXR1cm4gY29udGFpbmVyc1tjb250YWluZXJIYXNoXTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHNldEVsZW1lbnQoY29udGFpbmVySGFzaCwgcGFnZUhhc2gsIGVsZW1lbnQpIHtcbiAgICB2YXIgY29udGFpbmVycyA9IHBhZ2VzW3BhZ2VIYXNoXTtcbiAgICBpZiAoIWNvbnRhaW5lcnMpIHtcbiAgICAgICAgY29udGFpbmVycyA9IHBhZ2VzW3BhZ2VIYXNoXSA9IHt9O1xuICAgIH1cbiAgICBjb250YWluZXJzW2NvbnRhaW5lckhhc2hdID0gZWxlbWVudDtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGdldDogZ2V0RWxlbWVudCxcbiAgICBzZXQ6IHNldEVsZW1lbnRcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgUmFjdGl2ZTsgcmVxdWlyZSgnLi91dGlscy9yYWN0aXZlLXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGxvYWRlZFJhY3RpdmUpIHsgUmFjdGl2ZSA9IGxvYWRlZFJhY3RpdmU7fSk7XG52YXIgUmFuZ2UgPSByZXF1aXJlKCcuL3V0aWxzL3JhbmdlJyk7XG5cbnZhciBFdmVudHMgPSByZXF1aXJlKCcuL2V2ZW50cycpO1xudmFyIEhhc2hlZEVsZW1lbnRzID0gcmVxdWlyZSgnLi9oYXNoZWQtZWxlbWVudHMnKTtcbnZhciBQYWdlRGF0YSA9IHJlcXVpcmUoJy4vcGFnZS1kYXRhJyk7XG52YXIgU1ZHcyA9IHJlcXVpcmUoJy4vc3ZncycpO1xuXG52YXIgcGFnZVNlbGVjdG9yID0gJy5hbnRlbm5hLWxvY2F0aW9ucy1wYWdlJztcblxuZnVuY3Rpb24gY3JlYXRlUGFnZShvcHRpb25zKSB7XG4gICAgdmFyIGVsZW1lbnQgPSBvcHRpb25zLmVsZW1lbnQ7XG4gICAgdmFyIHJlYWN0aW9uTG9jYXRpb25EYXRhID0gb3B0aW9ucy5yZWFjdGlvbkxvY2F0aW9uRGF0YTtcbiAgICB2YXIgcGFnZURhdGEgPSBvcHRpb25zLnBhZ2VEYXRhO1xuICAgIHZhciBncm91cFNldHRpbmdzID0gb3B0aW9ucy5ncm91cFNldHRpbmdzO1xuICAgIHZhciBjbG9zZVdpbmRvdyA9IG9wdGlvbnMuY2xvc2VXaW5kb3c7XG4gICAgdmFyIGdvQmFjayA9IG9wdGlvbnMuZ29CYWNrO1xuICAgIHZhciByYWN0aXZlID0gUmFjdGl2ZSh7XG4gICAgICAgIGVsOiBlbGVtZW50LFxuICAgICAgICBhcHBlbmQ6IHRydWUsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIGxvY2F0aW9uRGF0YTogcmVhY3Rpb25Mb2NhdGlvbkRhdGEsXG4gICAgICAgICAgICBwYWdlUmVhY3Rpb25Db3VudDogcGFnZVJlYWN0aW9uQ291bnQocmVhY3Rpb25Mb2NhdGlvbkRhdGEpLFxuICAgICAgICAgICAgY2FuTG9jYXRlOiBmdW5jdGlvbihjb250YWluZXJIYXNoKSB7XG4gICAgICAgICAgICAgICAgLy8gVE9ETzogaXMgdGhlcmUgYSBiZXR0ZXIgd2F5IHRvIGhhbmRsZSByZWFjdGlvbnMgdG8gaGFzaGVzIHRoYXQgYXJlIG5vIGxvbmdlciBvbiB0aGUgcGFnZT9cbiAgICAgICAgICAgICAgICAvLyAgICAgICBzaG91bGQgd2UgcHJvdmlkZSBzb21lIGtpbmQgb2YgaW5kaWNhdGlvbiB3aGVuIHdlIGZhaWwgdG8gbG9jYXRlIGEgaGFzaCBvciBqdXN0IGxlYXZlIGl0IGFzIGlzP1xuICAgICAgICAgICAgICAgIC8vIFRPRE86IERvZXMgaXQgbWFrZSBzZW5zZSB0byBldmVuIHNob3cgZW50cmllcyB0aGF0IHdlIGNhbid0IGxvY2F0ZT8gUHJvYmFibHkgbm90LlxuICAgICAgICAgICAgICAgIHJldHVybiBIYXNoZWRFbGVtZW50cy5nZXQoY29udGFpbmVySGFzaCwgcGFnZURhdGEucGFnZUhhc2gpICE9PSB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHRlbXBsYXRlOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvbG9jYXRpb25zLXBhZ2UuaGJzLmh0bWwnKSxcbiAgICAgICAgcGFydGlhbHM6IHtcbiAgICAgICAgICAgIGxlZnQ6IFNWR3MubGVmdFxuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmFjdGl2ZS5vbignYmFjaycsIGdvQmFjayk7XG4gICAgcmFjdGl2ZS5vbigncmV2ZWFsJywgcmV2ZWFsQ29udGVudCk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgc2VsZWN0b3I6IHBhZ2VTZWxlY3RvcixcbiAgICAgICAgdGVhcmRvd246IGZ1bmN0aW9uKCkgeyByYWN0aXZlLnRlYXJkb3duKCk7IH1cbiAgICB9O1xuXG5cbiAgICBmdW5jdGlvbiByZXZlYWxDb250ZW50KGV2ZW50KSB7XG4gICAgICAgIHZhciBsb2NhdGlvbkRhdGEgPSBldmVudC5jb250ZXh0O1xuICAgICAgICB2YXIgZWxlbWVudCA9IEhhc2hlZEVsZW1lbnRzLmdldChsb2NhdGlvbkRhdGEuY29udGFpbmVySGFzaCwgcGFnZURhdGEucGFnZUhhc2gpO1xuICAgICAgICBpZiAoZWxlbWVudCkge1xuICAgICAgICAgICAgY2xvc2VXaW5kb3coKTtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IC8vIExldCB0aGUgcHJvY2Vzc2luZyBvZiB0aGlzIGNsaWNrIGV2ZW50IGZpbmlzaCBiZWZvcmUgd2UgYWRkIGFub3RoZXIgY2xpY2sgaGFuZGxlciBzbyB0aGUgbmV3IGhhbmRsZXIgaXNuJ3QgaW1tZWRpYXRlbHkgdHJpZ2dlcmVkXG4gICAgICAgICAgICAgICAgdmFyIHRhcmdldFNjcm9sbFRvcCA9ICQoZWxlbWVudCkub2Zmc2V0KCkudG9wIC0gMjA7IC8vIFRPRE86IHJldmlldyB0aGUgZXhhY3QgbG9jYXRpb25cbiAgICAgICAgICAgICAgICAkKCdib2R5JykuYW5pbWF0ZSh7c2Nyb2xsVG9wOiB0YXJnZXRTY3JvbGxUb3B9KTtcbiAgICAgICAgICAgICAgICBpZiAobG9jYXRpb25EYXRhLmtpbmQgPT09ICd0eHQnKSB7IC8vIFRPRE86IHNvbWV0aGluZyBiZXR0ZXIgdGhhbiBhIHN0cmluZyBjb21wYXJlLiBmaXggdGhpcyBhbG9uZyB3aXRoIHRoZSBzYW1lIGlzc3VlIGluIHBhZ2UtZGF0YVxuICAgICAgICAgICAgICAgICAgICBSYW5nZS5oaWdobGlnaHQoZWxlbWVudC5nZXQoMCksIGxvY2F0aW9uRGF0YS5sb2NhdGlvbik7XG4gICAgICAgICAgICAgICAgICAgICQoZG9jdW1lbnQpLm9uKCdjbGljay5hbnRlbm5hJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBSYW5nZS5jbGVhckhpZ2hsaWdodHMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICQoZG9jdW1lbnQpLm9mZignY2xpY2suYW50ZW5uYScpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIGNvbnRhaW5lckRhdGEgPSBQYWdlRGF0YS5nZXRDb250YWluZXJEYXRhKHBhZ2VEYXRhLCBsb2NhdGlvbkRhdGEuY29udGFpbmVySGFzaCk7XG4gICAgICAgICAgICAgICAgRXZlbnRzLnBvc3RDb250ZW50Vmlld2VkKHBhZ2VEYXRhLCBjb250YWluZXJEYXRhLGxvY2F0aW9uRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gcGFnZVJlYWN0aW9uQ291bnQocmVhY3Rpb25Mb2NhdGlvbkRhdGEpIHtcbiAgICBmb3IgKHZhciBjb250ZW50SUQgaW4gcmVhY3Rpb25Mb2NhdGlvbkRhdGEpIHtcbiAgICAgICAgaWYgKHJlYWN0aW9uTG9jYXRpb25EYXRhLmhhc093blByb3BlcnR5KGNvbnRlbnRJRCkpIHtcbiAgICAgICAgICAgIHZhciBjb250ZW50TG9jYXRpb25EYXRhID0gcmVhY3Rpb25Mb2NhdGlvbkRhdGFbY29udGVudElEXTtcbiAgICAgICAgICAgIGlmIChjb250ZW50TG9jYXRpb25EYXRhLmtpbmQgPT09ICdwYWcnKSB7IC8vIFRPRE86IHNvbWV0aGluZyBiZXR0ZXIgdGhhbiBhIHN0cmluZyBjb21wYXJlLiBmaXggdGhpcyBhbG9uZyB3aXRoIHRoZSBzYW1lIGlzc3VlIGluIHBhZ2UtZGF0YVxuICAgICAgICAgICAgICAgIHJldHVybiBjb250ZW50TG9jYXRpb25EYXRhLmNvdW50O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlOiBjcmVhdGVQYWdlXG59OyIsInZhciAkOyByZXF1aXJlKCcuL3V0aWxzL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIFJhY3RpdmU7IHJlcXVpcmUoJy4vdXRpbHMvcmFjdGl2ZS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihsb2FkZWRSYWN0aXZlKSB7IFJhY3RpdmUgPSBsb2FkZWRSYWN0aXZlO30pO1xudmFyIFJlYWN0aW9uc1dpZGdldCA9IHJlcXVpcmUoJy4vcmVhY3Rpb25zLXdpZGdldCcpO1xudmFyIFNWR3MgPSByZXF1aXJlKCcuL3N2Z3MnKTtcblxudmFyIEFwcE1vZGUgPSByZXF1aXJlKCcuL3V0aWxzL2FwcC1tb2RlJyk7XG52YXIgTXV0YXRpb25PYnNlcnZlciA9IHJlcXVpcmUoJy4vdXRpbHMvbXV0YXRpb24tb2JzZXJ2ZXInKTtcbnZhciBUaHJvdHRsZWRFdmVudHMgPSByZXF1aXJlKCcuL3V0aWxzL3Rocm90dGxlZC1ldmVudHMnKTtcbnZhciBUb3VjaFN1cHBvcnQgPSByZXF1aXJlKCcuL3V0aWxzL3RvdWNoLXN1cHBvcnQnKTtcblxuZnVuY3Rpb24gY3JlYXRlSW5kaWNhdG9yV2lkZ2V0KG9wdGlvbnMpIHtcbiAgICAvLyBUT0RPOiB2YWxpZGF0ZSB0aGF0IG9wdGlvbnMgY29udGFpbnMgYWxsIHJlcXVpcmVkIHByb3BlcnRpZXMgKGFwcGxpZXMgdG8gYWxsIHdpZGdldHMpLlxuICAgIHZhciBlbGVtZW50ID0gb3B0aW9ucy5lbGVtZW50O1xuICAgIHZhciBjb250YWluZXJEYXRhID0gb3B0aW9ucy5jb250YWluZXJEYXRhO1xuICAgIHZhciAkY29udGFpbmVyRWxlbWVudCA9IG9wdGlvbnMuY29udGFpbmVyRWxlbWVudDtcbiAgICB2YXIgcGFnZURhdGEgPSBvcHRpb25zLnBhZ2VEYXRhO1xuICAgIHZhciBncm91cFNldHRpbmdzID0gb3B0aW9ucy5ncm91cFNldHRpbmdzO1xuICAgIHZhciBkZWZhdWx0UmVhY3Rpb25zID0gb3B0aW9ucy5kZWZhdWx0UmVhY3Rpb25zO1xuICAgIHZhciBjb250ZW50RGF0YSA9IG9wdGlvbnMuY29udGVudERhdGE7XG4gICAgdmFyIHJhY3RpdmUgPSBSYWN0aXZlKHtcbiAgICAgICAgZWw6IGVsZW1lbnQsXG4gICAgICAgIGFwcGVuZDogdHJ1ZSxcbiAgICAgICAgbWFnaWM6IHRydWUsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIGNvbnRhaW5lckRhdGE6IGNvbnRhaW5lckRhdGEsXG4gICAgICAgICAgICBleHRyYUF0dHJpYnV0ZXM6IEFwcE1vZGUuZGVidWcgPyAnYW50LWhhc2g9XCInICsgY29udGFpbmVyRGF0YS5oYXNoICsgJ1wiJyA6ICcnIC8vIFRPRE86IHRoaXMgYWJvdXQgbWFraW5nIHRoaXMgYSBkZWNvcmF0b3IgaGFuZGxlZCBieSBhIFwiRGVidWdcIiBtb2R1bGVcbiAgICAgICAgfSxcbiAgICAgICAgdGVtcGxhdGU6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9tZWRpYS1pbmRpY2F0b3Itd2lkZ2V0Lmhicy5odG1sJyksXG4gICAgICAgIHBhcnRpYWxzOiB7XG4gICAgICAgICAgICBsb2dvOiBTVkdzLmxvZ29cbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgdmFyIHJlYWN0aW9uV2lkZ2V0T3B0aW9ucyA9IHtcbiAgICAgICAgcmVhY3Rpb25zRGF0YTogY29udGFpbmVyRGF0YS5yZWFjdGlvbnMsXG4gICAgICAgIGNvbnRhaW5lckRhdGE6IGNvbnRhaW5lckRhdGEsXG4gICAgICAgIGNvbnRhaW5lckVsZW1lbnQ6ICRjb250YWluZXJFbGVtZW50LFxuICAgICAgICBjb250ZW50RGF0YTogY29udGVudERhdGEsXG4gICAgICAgIGRlZmF1bHRSZWFjdGlvbnM6IGRlZmF1bHRSZWFjdGlvbnMsXG4gICAgICAgIHBhZ2VEYXRhOiBwYWdlRGF0YSxcbiAgICAgICAgZ3JvdXBTZXR0aW5nczogZ3JvdXBTZXR0aW5nc1xuICAgIH07XG5cbiAgICB2YXIgaG92ZXJUaW1lb3V0O1xuICAgIHZhciBhY3RpdmVUaW1lb3V0O1xuXG4gICAgdmFyICRyb290RWxlbWVudCA9ICQocm9vdEVsZW1lbnQocmFjdGl2ZSkpO1xuICAgIFRvdWNoU3VwcG9ydC5zZXR1cFRhcCgkcm9vdEVsZW1lbnQuZ2V0KDApLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBvcGVuUmVhY3Rpb25zV2luZG93KHJlYWN0aW9uV2lkZ2V0T3B0aW9ucywgcmFjdGl2ZSlcbiAgICB9KTtcbiAgICAkcm9vdEVsZW1lbnQub24oJ21vdXNlZW50ZXIuYW50ZW5uYScsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGlmIChldmVudC5idXR0b25zID4gMCB8fCAoZXZlbnQuYnV0dG9ucyA9PSB1bmRlZmluZWQgJiYgZXZlbnQud2hpY2ggPiAwKSkgeyAvLyBPbiBTYWZhcmksIGV2ZW50LmJ1dHRvbnMgaXMgdW5kZWZpbmVkIGJ1dCBldmVudC53aGljaCBnaXZlcyBhIGdvb2QgdmFsdWUuIGV2ZW50LndoaWNoIGlzIGJhZCBvbiBGRlxuICAgICAgICAgICAgLy8gRG9uJ3QgcmVhY3QgaWYgdGhlIHVzZXIgaXMgZHJhZ2dpbmcgb3Igc2VsZWN0aW5nIHRleHQuXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvbnRhaW5lckRhdGEucmVhY3Rpb25zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIG9wZW5SZWFjdGlvbnNXaW5kb3cocmVhY3Rpb25XaWRnZXRPcHRpb25zLCByYWN0aXZlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNsZWFyVGltZW91dChob3ZlclRpbWVvdXQpO1xuICAgICAgICAgICAgaG92ZXJUaW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBvcGVuUmVhY3Rpb25zV2luZG93KHJlYWN0aW9uV2lkZ2V0T3B0aW9ucywgcmFjdGl2ZSk7XG4gICAgICAgICAgICB9LCA1MCk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICAkcm9vdEVsZW1lbnQub24oJ21vdXNlbGVhdmUuYW50ZW5uYScsIGZ1bmN0aW9uKCkge1xuICAgICAgICBjbGVhclRpbWVvdXQoaG92ZXJUaW1lb3V0KTtcbiAgICAgICAgY2xlYXJUaW1lb3V0KGFjdGl2ZVRpbWVvdXQpO1xuICAgIH0pO1xuICAgICRjb250YWluZXJFbGVtZW50Lm9uKCdtb3VzZWVudGVyLmFudGVubmEnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KGFjdGl2ZVRpbWVvdXQpO1xuICAgICAgICBhY3RpdmVUaW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICRyb290RWxlbWVudC5hZGRDbGFzcygnYWN0aXZlJyk7XG4gICAgICAgIH0sIDUwMCk7XG4gICAgfSk7XG4gICAgJGNvbnRhaW5lckVsZW1lbnQub24oJ21vdXNlbGVhdmUuYW50ZW5uYScsIGZ1bmN0aW9uKCkge1xuICAgICAgICBjbGVhclRpbWVvdXQoYWN0aXZlVGltZW91dCk7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAkcm9vdEVsZW1lbnQucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpO1xuICAgICAgICB9LCAxMDApOyAvLyBXZSBnZXQgYSBtb3VzZWxlYXZlIGV2ZW50IHdoZW4gdGhlIHVzZXIgaG92ZXJzIHRoZSBpbmRpY2F0b3IuIFBhdXNlIGxvbmcgZW5vdWdoIHRoYXQgdGhlIHJlYWN0aW9uIHdpbmRvdyBjYW4gb3BlbiBpZiB0aGV5IGhvdmVyLlxuICAgIH0pO1xuICAgIHNldHVwUG9zaXRpb25pbmcoJGNvbnRhaW5lckVsZW1lbnQsIGdyb3VwU2V0dGluZ3MsIHJhY3RpdmUpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgdGVhcmRvd246IGZ1bmN0aW9uKCkgeyByYWN0aXZlLnRlYXJkb3duKCk7IH1cbiAgICB9O1xufVxuXG5mdW5jdGlvbiBzZXR1cFBvc2l0aW9uaW5nKCRjb250YWluZXJFbGVtZW50LCBncm91cFNldHRpbmdzLCByYWN0aXZlKSB7XG4gICAgdmFyICR3cmFwcGVyRWxlbWVudCA9ICQod3JhcHBlckVsZW1lbnQocmFjdGl2ZSkpO1xuICAgIHZhciAkcm9vdEVsZW1lbnQgPSAkKHJvb3RFbGVtZW50KHJhY3RpdmUpKTtcbiAgICBwb3NpdGlvbkluZGljYXRvcigpO1xuXG4gICAgVGhyb3R0bGVkRXZlbnRzLm9uKCdyZXNpemUnLCBwb3NpdGlvbklmTmVlZGVkKTtcbiAgICByYWN0aXZlLm9uKCd0ZWFyZG93bicsIGZ1bmN0aW9uKCkge1xuICAgICAgICBUaHJvdHRsZWRFdmVudHMub2ZmKCdyZXNpemUnLCBwb3NpdGlvbklmTmVlZGVkKTtcbiAgICB9KTtcbiAgICBUaHJvdHRsZWRFdmVudHMub24oJ3Njcm9sbCcsIHBvc2l0aW9uSWZOZWVkZWQpO1xuICAgIHJhY3RpdmUub24oJ3RlYXJkb3duJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIFRocm90dGxlZEV2ZW50cy5vZmYoJ3Njcm9sbCcsIHBvc2l0aW9uSWZOZWVkZWQpO1xuICAgIH0pO1xuXG4gICAgLy8gVE9ETzogY29uc2lkZXIgYWxzbyBsaXN0ZW5pbmcgdG8gc3JjIGF0dHJpYnV0ZSBjaGFuZ2VzLCB3aGljaCBtaWdodCBhZmZlY3QgdGhlIGhlaWdodCBvZiBlbGVtZW50cyBvbiB0aGUgcGFnZVxuICAgIE11dGF0aW9uT2JzZXJ2ZXIuYWRkQWRkaXRpb25MaXN0ZW5lcihlbGVtZW50c0FkZGVkT3JSZW1vdmVkKTtcbiAgICBNdXRhdGlvbk9ic2VydmVyLmFkZFJlbW92YWxMaXN0ZW5lcihlbGVtZW50c0FkZGVkT3JSZW1vdmVkKTtcblxuICAgIGZ1bmN0aW9uIGVsZW1lbnRzQWRkZWRPclJlbW92ZWQoJGVsZW1lbnRzKSB7XG4gICAgICAgIC8vIFJlcG9zaXRpb24gdGhlIGluZGljYXRvciBpZiBlbGVtZW50cyB3aGljaCBtaWdodCBhZGp1c3QgdGhlIGNvbnRhaW5lcidzIHBvc2l0aW9uIGFyZSBhZGRlZC9yZW1vdmVkLlxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8ICRlbGVtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyICRlbGVtZW50ID0gJGVsZW1lbnRzW2ldO1xuICAgICAgICAgICAgaWYgKCRlbGVtZW50LmhlaWdodCgpID4gMCkge1xuICAgICAgICAgICAgICAgIHBvc2l0aW9uSWZOZWVkZWQoKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgbGFzdENvbnRhaW5lck9mZnNldCA9ICRjb250YWluZXJFbGVtZW50Lm9mZnNldCgpO1xuICAgIHZhciBsYXN0Q29udGFpbmVySGVpZ2h0ID0gJGNvbnRhaW5lckVsZW1lbnQuaGVpZ2h0KCk7XG5cbiAgICBmdW5jdGlvbiBwb3NpdGlvbklmTmVlZGVkKCkge1xuICAgICAgICB2YXIgY29udGFpbmVyT2Zmc2V0ID0gJGNvbnRhaW5lckVsZW1lbnQub2Zmc2V0KCk7XG4gICAgICAgIHZhciBjb250YWluZXJIZWlnaHQgPSAkY29udGFpbmVyRWxlbWVudC5oZWlnaHQoKTtcbiAgICAgICAgaWYgKGNvbnRhaW5lck9mZnNldC50b3AgPT09IGxhc3RDb250YWluZXJPZmZzZXQudG9wICYmXG4gICAgICAgICAgICBjb250YWluZXJPZmZzZXQubGVmdCA9PT0gbGFzdENvbnRhaW5lck9mZnNldC5sZWZ0ICYmXG4gICAgICAgICAgICBjb250YWluZXJIZWlnaHQgPT09IGxhc3RDb250YWluZXJIZWlnaHQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBsYXN0Q29udGFpbmVyT2Zmc2V0ID0gY29udGFpbmVyT2Zmc2V0O1xuICAgICAgICBsYXN0Q29udGFpbmVySGVpZ2h0ID0gY29udGFpbmVySGVpZ2h0O1xuICAgICAgICBwb3NpdGlvbkluZGljYXRvcigpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBvc2l0aW9uSW5kaWNhdG9yKCkge1xuICAgICAgICAvLyBQb3NpdGlvbiB0aGUgd3JhcHBlciBlbGVtZW50ICh3aGljaCBoYXMgYSBoYXJkY29kZWQgd2lkdGgpIGluIHRoZSBhcHByb3ByaWF0ZSBjb3JuZXIuIFRoZW4gZmxpcCB0aGUgbGVmdC9yaWdodFxuICAgICAgICAvLyBwb3NpdGlvbmluZyBvZiB0aGUgbmVzdGVkIHdpZGdldCBlbGVtZW50IHRvIGFkanVzdCB0aGUgd2F5IGl0IHdpbGwgZXhwYW5kIHdoZW4gdGhlIG1lZGlhIGlzIGhvdmVyZWQuXG4gICAgICAgIHZhciBjb3JuZXIgPSBncm91cFNldHRpbmdzLm1lZGlhSW5kaWNhdG9yQ29ybmVyKCk7XG4gICAgICAgIHZhciBlbGVtZW50T2Zmc2V0ID0gJGNvbnRhaW5lckVsZW1lbnQub2Zmc2V0KCk7XG4gICAgICAgIHZhciBjb29yZHMgPSB7fTtcbiAgICAgICAgaWYgKGNvcm5lci5pbmRleE9mKCd0b3AnKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIGNvb3Jkcy50b3AgPSBlbGVtZW50T2Zmc2V0LnRvcDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvb3Jkcy50b3AgPSBlbGVtZW50T2Zmc2V0LnRvcCArICRjb250YWluZXJFbGVtZW50LmhlaWdodCgpIC0gJHJvb3RFbGVtZW50Lm91dGVySGVpZ2h0KCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvcm5lci5pbmRleE9mKCdyaWdodCcpICE9PSAtMSkge1xuICAgICAgICAgICAgY29vcmRzLmxlZnQgPSBlbGVtZW50T2Zmc2V0LmxlZnQgKyAkY29udGFpbmVyRWxlbWVudC53aWR0aCgpIC0gJHdyYXBwZXJFbGVtZW50Lm91dGVyV2lkdGgoKTtcbiAgICAgICAgICAgICRyb290RWxlbWVudC5jc3Moe3JpZ2h0OjAsbGVmdDonJ30pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29vcmRzLmxlZnQgPSBlbGVtZW50T2Zmc2V0LmxlZnQ7XG4gICAgICAgICAgICAkcm9vdEVsZW1lbnQuY3NzKHtyaWdodDonJyxsZWZ0OjB9KTtcbiAgICAgICAgfVxuICAgICAgICAkd3JhcHBlckVsZW1lbnQuY3NzKGNvb3Jkcyk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiB3cmFwcGVyRWxlbWVudChyYWN0aXZlKSB7XG4gICAgcmV0dXJuIHJhY3RpdmUuZmluZCgnLmFudGVubmEtbWVkaWEtaW5kaWNhdG9yLXdyYXBwZXInKTtcbn1cblxuZnVuY3Rpb24gcm9vdEVsZW1lbnQocmFjdGl2ZSkge1xuICAgIHJldHVybiByYWN0aXZlLmZpbmQoJy5hbnRlbm5hLW1lZGlhLWluZGljYXRvci13aWRnZXQnKTtcbn1cblxuZnVuY3Rpb24gb3BlblJlYWN0aW9uc1dpbmRvdyhyZWFjdGlvbk9wdGlvbnMsIHJhY3RpdmUpIHtcbiAgICBSZWFjdGlvbnNXaWRnZXQub3BlbihyZWFjdGlvbk9wdGlvbnMsIHJvb3RFbGVtZW50KHJhY3RpdmUpKTtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZTogY3JlYXRlSW5kaWNhdG9yV2lkZ2V0XG59OyIsInZhciAkOyByZXF1aXJlKCcuL3V0aWxzL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIEFqYXhDbGllbnQgPSByZXF1aXJlKCcuL3V0aWxzL2FqYXgtY2xpZW50Jyk7XG52YXIgUGFnZVV0aWxzID0gcmVxdWlyZSgnLi91dGlscy9wYWdlLXV0aWxzJyk7XG52YXIgVGhyb3R0bGVkRXZlbnRzID0gcmVxdWlyZSgnLi91dGlscy90aHJvdHRsZWQtZXZlbnRzJyk7XG52YXIgVVJMcyA9IHJlcXVpcmUoJy4vdXRpbHMvdXJscycpO1xudmFyIFBhZ2VEYXRhID0gcmVxdWlyZSgnLi9wYWdlLWRhdGEnKTtcblxuLy8gQ29tcHV0ZSB0aGUgcGFnZXMgdGhhdCB3ZSBuZWVkIHRvIGZldGNoLiBUaGlzIGlzIGVpdGhlcjpcbi8vIDEuIEFueSBuZXN0ZWQgcGFnZXMgd2UgZmluZCB1c2luZyB0aGUgcGFnZSBzZWxlY3RvciBPUlxuLy8gMi4gVGhlIGN1cnJlbnQgd2luZG93IGxvY2F0aW9uXG5mdW5jdGlvbiBjb21wdXRlUGFnZXNQYXJhbSgkcGFnZUVsZW1lbnRBcnJheSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBncm91cElkID0gZ3JvdXBTZXR0aW5ncy5ncm91cElkKCk7XG4gICAgdmFyIHBhZ2VzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCAkcGFnZUVsZW1lbnRBcnJheS5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgJHBhZ2VFbGVtZW50ID0gJHBhZ2VFbGVtZW50QXJyYXlbaV07XG4gICAgICAgIHBhZ2VzLnB1c2goe1xuICAgICAgICAgICAgZ3JvdXBfaWQ6IGdyb3VwSWQsXG4gICAgICAgICAgICB1cmw6IFBhZ2VVdGlscy5jb21wdXRlUGFnZVVybCgkcGFnZUVsZW1lbnQsIGdyb3VwU2V0dGluZ3MpLFxuICAgICAgICAgICAgdGl0bGU6IFBhZ2VVdGlscy5jb21wdXRlUGFnZVRpdGxlKCRwYWdlRWxlbWVudCwgZ3JvdXBTZXR0aW5ncylcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGlmIChwYWdlcy5sZW5ndGggPT0gMSkge1xuICAgICAgICBwYWdlc1swXS5pbWFnZSA9IFBhZ2VVdGlscy5jb21wdXRlVG9wTGV2ZWxQYWdlSW1hZ2UoZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIHBhZ2VzWzBdLmF1dGhvciA9IFBhZ2VVdGlscy5jb21wdXRlUGFnZUF1dGhvcihncm91cFNldHRpbmdzKTtcbiAgICAgICAgcGFnZXNbMF0udG9waWNzID0gUGFnZVV0aWxzLmNvbXB1dGVQYWdlVG9waWNzKGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICBwYWdlc1swXS5zZWN0aW9uID0gUGFnZVV0aWxzLmNvbXB1dGVQYWdlU2l0ZVNlY3Rpb24oZ3JvdXBTZXR0aW5ncyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHsgcGFnZXM6IHBhZ2VzIH07XG59XG5cbmZ1bmN0aW9uIGxvYWRQYWdlRGF0YShwYWdlRGF0YVBhcmFtLCBncm91cFNldHRpbmdzKSB7XG4gICAgQWpheENsaWVudC5nZXRKU09OUChVUkxzLnBhZ2VEYXRhVXJsKCksIHBhZ2VEYXRhUGFyYW0sIHN1Y2Nlc3MsIGVycm9yKTtcblxuICAgIGZ1bmN0aW9uIHN1Y2Nlc3MoanNvbikge1xuICAgICAgICAvL3NldFRpbWVvdXQoZnVuY3Rpb24oKSB7IFBhZ2VEYXRhLnVwZGF0ZUFsbFBhZ2VEYXRhKGpzb24sIGdyb3VwU2V0dGluZ3MpOyB9LCAzMDAwKTtcbiAgICAgICAgUGFnZURhdGEudXBkYXRlQWxsUGFnZURhdGEoanNvbiwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZXJyb3IobWVzc2FnZSkge1xuICAgICAgICAvLyBUT0RPIGhhbmRsZSBlcnJvcnMgdGhhdCBoYXBwZW4gd2hlbiBsb2FkaW5nIHBhZ2UgZGF0YVxuICAgICAgICBjb25zb2xlLmxvZygnQW4gZXJyb3Igb2NjdXJyZWQgbG9hZGluZyBwYWdlIGRhdGE6ICcgKyBtZXNzYWdlKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHN0YXJ0TG9hZGluZ1BhZ2VEYXRhKGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgJHBhZ2VFbGVtZW50cyA9ICQoZ3JvdXBTZXR0aW5ncy5wYWdlU2VsZWN0b3IoKSk7XG4gICAgaWYgKCRwYWdlRWxlbWVudHMubGVuZ3RoID09IDApIHtcbiAgICAgICAgJHBhZ2VFbGVtZW50cyA9ICQoJ2JvZHknKTtcbiAgICB9XG4gICAgcXVldWVQYWdlRGF0YUxvYWQoJHBhZ2VFbGVtZW50cywgZ3JvdXBTZXR0aW5ncyk7XG59XG5cbmZ1bmN0aW9uIHF1ZXVlUGFnZURhdGFMb2FkKCRwYWdlRWxlbWVudHMsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgcGFnZXNUb0xvYWQgPSBbXTtcbiAgICAkcGFnZUVsZW1lbnRzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkcGFnZUVsZW1lbnQgPSAkKHRoaXMpO1xuICAgICAgICBpZiAoaXNJblZpZXcoJHBhZ2VFbGVtZW50KSkge1xuICAgICAgICAgICAgcGFnZXNUb0xvYWQucHVzaCgkcGFnZUVsZW1lbnQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbG9hZFdoZW5WaXNpYmxlKCRwYWdlRWxlbWVudCwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIHZhciBwYWdlRGF0YVBhcmFtID0gY29tcHV0ZVBhZ2VzUGFyYW0ocGFnZXNUb0xvYWQsIGdyb3VwU2V0dGluZ3MpO1xuICAgIC8vIFRPRE86IGRlbGV0ZSB0aGUgY29tbWVudGVkIGxpbmUgYmVsb3csIHdoaWNoIGlzIGZvciB0ZXN0aW5nIHB1cnBvc2VzXG4gICAgLy9wYWdlRGF0YVBhcmFtID0ge3BhZ2VzOiBbe1wiZ3JvdXBfaWRcIjoxMTg0LCBcInVybFwiOlwiaHR0cDovL3d3dy5kdWtlY2hyb25pY2xlLmNvbS9hcnRpY2xlcy8yMDE0LzAyLzE0L3BvcnRyYWl0LXBvcm4tc3RhclwiLFwiY2Fub25pY2FsX3VybFwiOlwic2FtZVwiLFwidGl0bGVcIjpcIlBvcnRyYWl0IG9mIGEgcG9ybiBzdGFyXCIsXCJpbWFnZVwiOlwiXCJ9XX07XG4gICAgbG9hZFBhZ2VEYXRhKHBhZ2VEYXRhUGFyYW0sIGdyb3VwU2V0dGluZ3MpO1xufVxuXG5mdW5jdGlvbiBpc0luVmlldygkZWxlbWVudCkge1xuICAgIHZhciB0cmlnZ2VyRGlzdGFuY2UgPSAzMDA7XG4gICAgcmV0dXJuICRlbGVtZW50Lm9mZnNldCgpLnRvcCA8ICAkKGRvY3VtZW50KS5zY3JvbGxUb3AoKSArICQod2luZG93KS5oZWlnaHQoKSArIHRyaWdnZXJEaXN0YW5jZTtcbn1cblxuZnVuY3Rpb24gbG9hZFdoZW5WaXNpYmxlKCRwYWdlRWxlbWVudCwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBjaGVja1Zpc2liaWxpdHkgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKGlzSW5WaWV3KCRwYWdlRWxlbWVudCkpIHtcbiAgICAgICAgICAgIHZhciBwYWdlRGF0YVBhcmFtID0gY29tcHV0ZVBhZ2VzUGFyYW0oWyRwYWdlRWxlbWVudF0sIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgbG9hZFBhZ2VEYXRhKHBhZ2VEYXRhUGFyYW0sIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgVGhyb3R0bGVkRXZlbnRzLm9mZignc2Nyb2xsJywgY2hlY2tWaXNpYmlsaXR5KTtcbiAgICAgICAgICAgIFRocm90dGxlZEV2ZW50cy5vZmYoJ3Jlc2l6ZScsIGNoZWNrVmlzaWJpbGl0eSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFRocm90dGxlZEV2ZW50cy5vbignc2Nyb2xsJywgY2hlY2tWaXNpYmlsaXR5KTtcbiAgICBUaHJvdHRsZWRFdmVudHMub24oJ3Jlc2l6ZScsIGNoZWNrVmlzaWJpbGl0eSk7XG59XG5cbmZ1bmN0aW9uIHBhZ2VzQWRkZWQoJHBhZ2VFbGVtZW50cywgZ3JvdXBTZXR0aW5ncykge1xuICAgIHF1ZXVlUGFnZURhdGFMb2FkKCRwYWdlRWxlbWVudHMsIGdyb3VwU2V0dGluZ3MpO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgbG9hZDogc3RhcnRMb2FkaW5nUGFnZURhdGEsXG4gICAgcGFnZXNBZGRlZDogcGFnZXNBZGRlZFxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi91dGlscy9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcblxudmFyIEV2ZW50cyA9IHJlcXVpcmUoJy4vZXZlbnRzJyk7XG5cbi8vIENvbGxlY3Rpb24gb2YgYWxsIHBhZ2UgZGF0YSwga2V5ZWQgYnkgcGFnZSBoYXNoXG52YXIgcGFnZXMgPSB7fTtcbi8vIE1hcHBpbmcgb2YgcGFnZSBVUkxzIHRvIHBhZ2UgaGFzaGVzLCB3aGljaCBhcmUgY29tcHV0ZWQgb24gdGhlIHNlcnZlci5cbnZhciB1cmxIYXNoZXMgPSB7fTtcblxuZnVuY3Rpb24gZ2V0UGFnZURhdGEoaGFzaCkge1xuICAgIHZhciBwYWdlRGF0YSA9IHBhZ2VzW2hhc2hdO1xuICAgIGlmICghcGFnZURhdGEpIHtcbiAgICAgICAgLy8gVE9ETzogR2l2ZSB0aGlzIHNlcmlvdXMgdGhvdWdodC4gSW4gb3JkZXIgZm9yIG1hZ2ljIG1vZGUgdG8gd29yaywgdGhlIG9iamVjdCBuZWVkcyB0byBoYXZlIHZhbHVlcyBpbiBwbGFjZSBmb3JcbiAgICAgICAgLy8gdGhlIG9ic2VydmVkIHByb3BlcnRpZXMgYXQgdGhlIG1vbWVudCB0aGUgcmFjdGl2ZSBpcyBjcmVhdGVkLiBCdXQgdGhpcyBpcyBwcmV0dHkgdW51c3VhbCBmb3IgSmF2YXNjcmlwdCwgdG8gaGF2ZVxuICAgICAgICAvLyB0byBkZWZpbmUgdGhlIHdob2xlIHNrZWxldG9uIGZvciB0aGUgb2JqZWN0IGluc3RlYWQgb2YganVzdCBhZGRpbmcgcHJvcGVydGllcyB3aGVuZXZlciB5b3Ugd2FudC5cbiAgICAgICAgLy8gVGhlIGFsdGVybmF0aXZlIHdvdWxkIGJlIGZvciB1cyB0byBrZWVwIG91ciBvd24gXCJkYXRhIGJpbmRpbmdcIiBiZXR3ZWVuIHRoZSBwYWdlRGF0YSBhbmQgcmFjdGl2ZSBpbnN0YW5jZXMgKDEgdG8gbWFueSlcbiAgICAgICAgLy8gYW5kIHRlbGwgdGhlIHJhY3RpdmVzIHRvIHVwZGF0ZSB3aGVuZXZlciB0aGUgZGF0YSBjaGFuZ2VzLlxuICAgICAgICBwYWdlRGF0YSA9IHtcbiAgICAgICAgICAgIHBhZ2VIYXNoOiBoYXNoLFxuICAgICAgICAgICAgc3VtbWFyeVJlYWN0aW9uczogW10sXG4gICAgICAgICAgICBzdW1tYXJ5VG90YWw6IDAsXG4gICAgICAgICAgICBzdW1tYXJ5TG9hZGVkOiBmYWxzZSxcbiAgICAgICAgICAgIGNvbnRhaW5lcnM6IFtdLFxuICAgICAgICAgICAgbWV0cmljczoge30gLy8gVGhpcyBpcyBhIGNhdGNoLWFsbCBmaWVsZCB3aGVyZSB3ZSBjYW4gYXR0YWNoIGNsaWVudC1zaWRlIG1ldHJpY3MgZm9yIGFuYWx5dGljc1xuICAgICAgICB9O1xuICAgICAgICBwYWdlc1toYXNoXSA9IHBhZ2VEYXRhO1xuICAgIH1cbiAgICByZXR1cm4gcGFnZURhdGE7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZUFsbFBhZ2VEYXRhKGpzb25QYWdlcywgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBhbGxQYWdlcyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwganNvblBhZ2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBwYWdlRGF0YSA9IHVwZGF0ZVBhZ2VEYXRhKGpzb25QYWdlc1tpXSwgZ3JvdXBTZXR0aW5ncylcbiAgICAgICAgYWxsUGFnZXMucHVzaChwYWdlRGF0YSk7XG4gICAgICAgIEV2ZW50cy5wb3N0UGFnZURhdGFMb2FkZWQocGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gdXBkYXRlUGFnZURhdGEoanNvbiwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBwYWdlRGF0YSA9IGdldFBhZ2VEYXRhRm9ySnNvblJlc3BvbnNlKGpzb24pO1xuICAgIHBhZ2VEYXRhLnBhZ2VJZCA9IGpzb24uaWQ7XG4gICAgcGFnZURhdGEucGFnZUhhc2ggPSBqc29uLnBhZ2VIYXNoO1xuICAgIHBhZ2VEYXRhLmdyb3VwSWQgPSBncm91cFNldHRpbmdzLmdyb3VwSWQoKTtcbiAgICBwYWdlRGF0YS5jYW5vbmljYWxVcmwgPSBqc29uLmNhbm9uaWNhbFVSTDtcbiAgICBwYWdlRGF0YS5yZXF1ZXN0ZWRVcmwgPSBqc29uLnJlcXVlc3RlZFVSTDtcbiAgICBwYWdlRGF0YS5hdXRob3IgPSBqc29uLmF1dGhvcjtcbiAgICBwYWdlRGF0YS5zZWN0aW9uID0ganNvbi5zZWN0aW9uO1xuICAgIHBhZ2VEYXRhLnRvcGljcyA9IGpzb24udG9waWNzO1xuICAgIHBhZ2VEYXRhLnRpdGxlID0ganNvbi50aXRsZTtcbiAgICBwYWdlRGF0YS5pbWFnZSA9IGpzb24uaW1hZ2U7XG5cbiAgICB2YXIgc3VtbWFyeVJlYWN0aW9ucyA9IGpzb24uc3VtbWFyeVJlYWN0aW9ucztcbiAgICBwYWdlRGF0YS5zdW1tYXJ5UmVhY3Rpb25zID0gc3VtbWFyeVJlYWN0aW9ucztcbiAgICBzZXRDb250YWluZXJzKHBhZ2VEYXRhLCBqc29uLmNvbnRhaW5lcnMpO1xuXG4gICAgLy8gV2UgYWRkIHVwIHRoZSBzdW1tYXJ5IHJlYWN0aW9uIHRvdGFsIGNsaWVudC1zaWRlXG4gICAgdmFyIHRvdGFsID0gMDtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN1bW1hcnlSZWFjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdG90YWwgPSB0b3RhbCArIHN1bW1hcnlSZWFjdGlvbnNbaV0uY291bnQ7XG4gICAgfVxuICAgIHBhZ2VEYXRhLnN1bW1hcnlUb3RhbCA9IHRvdGFsO1xuICAgIHBhZ2VEYXRhLnN1bW1hcnlMb2FkZWQgPSB0cnVlO1xuXG4gICAgLy8gV2UgYWRkIHVwIHRoZSBjb250YWluZXIgcmVhY3Rpb24gdG90YWxzIGNsaWVudC1zaWRlXG4gICAgdmFyIHRvdGFsID0gMDtcbiAgICB2YXIgY29udGFpbmVyQ291bnRzID0gW107XG4gICAgdmFyIGNvbnRhaW5lcnMgPSBwYWdlRGF0YS5jb250YWluZXJzO1xuICAgIGZvciAodmFyIGhhc2ggaW4gY29udGFpbmVycykge1xuICAgICAgICBpZiAoY29udGFpbmVycy5oYXNPd25Qcm9wZXJ0eShoYXNoKSkge1xuICAgICAgICAgICAgdmFyIGNvbnRhaW5lciA9IGNvbnRhaW5lcnNbaGFzaF07XG4gICAgICAgICAgICB2YXIgdG90YWwgPSAwO1xuICAgICAgICAgICAgdmFyIGNvbnRhaW5lclJlYWN0aW9ucyA9IGNvbnRhaW5lci5yZWFjdGlvbnM7XG4gICAgICAgICAgICBpZiAoY29udGFpbmVyUmVhY3Rpb25zKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb250YWluZXJSZWFjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdG90YWwgPSB0b3RhbCArIGNvbnRhaW5lclJlYWN0aW9uc1tpXS5jb3VudDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb250YWluZXIucmVhY3Rpb25Ub3RhbCA9IHRvdGFsO1xuICAgICAgICAgICAgY29udGFpbmVyQ291bnRzLnB1c2goeyBjb3VudDogdG90YWwsIGNvbnRhaW5lcjogY29udGFpbmVyIH0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIHZhciBpbmRpY2F0b3JMaW1pdCA9IGdyb3VwU2V0dGluZ3MudGV4dEluZGljYXRvckxpbWl0KCk7XG4gICAgaWYgKGluZGljYXRvckxpbWl0KSB7XG4gICAgICAgIC8vIElmIGFuIGluZGljYXRvciBsaW1pdCBpcyBzZXQsIHNvcnQgdGhlIGNvbnRhaW5lcnMgYW5kIG1hcmsgb25seSB0aGUgdG9wIE4gdG8gYmUgdmlzaWJsZS5cbiAgICAgICAgY29udGFpbmVyQ291bnRzLnNvcnQoZnVuY3Rpb24oYSwgYikgeyByZXR1cm4gYi5jb3VudCAtIGEuY291bnQ7IH0pOyAvLyBzb3J0IGxhcmdlc3QgY291bnQgZmlyc3RcbiAgICAgICAgZm9yICh2YXIgaSA9IGluZGljYXRvckxpbWl0OyBpIDwgY29udGFpbmVyQ291bnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb250YWluZXJDb3VudHNbaV0uY29udGFpbmVyLnN1cHByZXNzID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBwYWdlRGF0YTtcbn1cblxuZnVuY3Rpb24gZ2V0Q29udGFpbmVyRGF0YShwYWdlRGF0YSwgY29udGFpbmVySGFzaCkge1xuICAgIHZhciBjb250YWluZXJEYXRhID0gcGFnZURhdGEuY29udGFpbmVyc1tjb250YWluZXJIYXNoXTtcbiAgICBpZiAoIWNvbnRhaW5lckRhdGEpIHtcbiAgICAgICAgY29udGFpbmVyRGF0YSA9IHtcbiAgICAgICAgICAgIGhhc2g6IGNvbnRhaW5lckhhc2gsXG4gICAgICAgICAgICByZWFjdGlvblRvdGFsOiAwLFxuICAgICAgICAgICAgcmVhY3Rpb25zOiBbXSxcbiAgICAgICAgICAgIGxvYWRlZDogcGFnZURhdGEuc3VtbWFyeUxvYWRlZCxcbiAgICAgICAgICAgIHN1cHByZXNzOiBmYWxzZVxuICAgICAgICB9O1xuICAgICAgICBwYWdlRGF0YS5jb250YWluZXJzW2NvbnRhaW5lckhhc2hdID0gY29udGFpbmVyRGF0YTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbnRhaW5lckRhdGE7XG59XG5cbi8vIE1lcmdlIHRoZSBnaXZlbiBjb250YWluZXIgZGF0YSBpbnRvIHRoZSBwYWdlRGF0YS5jb250YWluZXJzIGRhdGEuIFRoaXMgaXMgbmVjZXNzYXJ5IGJlY2F1c2UgdGhlIHNrZWxldG9uIG9mIHRoZSBwYWdlRGF0YS5jb250YWluZXJzIG1hcFxuLy8gaXMgc2V0IHVwIGFuZCBib3VuZCB0byB0aGUgVUkgYmVmb3JlIGFsbCB0aGUgZGF0YSBpcyBmZXRjaGVkIGZyb20gdGhlIHNlcnZlciBhbmQgd2UgZG9uJ3Qgd2FudCB0byBicmVhayB0aGUgZGF0YSBiaW5kaW5nLlxuZnVuY3Rpb24gc2V0Q29udGFpbmVycyhwYWdlRGF0YSwganNvbkNvbnRhaW5lcnMpIHtcbiAgICBmb3IgKHZhciBoYXNoIGluIGpzb25Db250YWluZXJzKSB7XG4gICAgICAgIGlmIChqc29uQ29udGFpbmVycy5oYXNPd25Qcm9wZXJ0eShoYXNoKSkge1xuICAgICAgICAgICAgdmFyIGNvbnRhaW5lckRhdGEgPSBnZXRDb250YWluZXJEYXRhKHBhZ2VEYXRhLCBoYXNoKTtcbiAgICAgICAgICAgIHZhciBmZXRjaGVkQ29udGFpbmVyRGF0YSA9IGpzb25Db250YWluZXJzW2hhc2hdO1xuICAgICAgICAgICAgY29udGFpbmVyRGF0YS5pZCA9IGZldGNoZWRDb250YWluZXJEYXRhLmlkO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBmZXRjaGVkQ29udGFpbmVyRGF0YS5yZWFjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjb250YWluZXJEYXRhLnJlYWN0aW9ucy5wdXNoKGZldGNoZWRDb250YWluZXJEYXRhLnJlYWN0aW9uc1tpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgdmFyIGFsbENvbnRhaW5lcnMgPSBwYWdlRGF0YS5jb250YWluZXJzO1xuICAgIGZvciAodmFyIGhhc2ggaW4gYWxsQ29udGFpbmVycykge1xuICAgICAgICBpZiAoYWxsQ29udGFpbmVycy5oYXNPd25Qcm9wZXJ0eShoYXNoKSkge1xuICAgICAgICAgICAgdmFyIGNvbnRhaW5lciA9IGFsbENvbnRhaW5lcnNbaGFzaF07XG4gICAgICAgICAgICBjb250YWluZXIubG9hZGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gY2xlYXJJbmRpY2F0b3JMaW1pdChwYWdlRGF0YSkge1xuICAgIHZhciBjb250YWluZXJzID0gcGFnZURhdGEuY29udGFpbmVycztcbiAgICBmb3IgKHZhciBoYXNoIGluIGNvbnRhaW5lcnMpIHtcbiAgICAgICAgaWYgKGNvbnRhaW5lcnMuaGFzT3duUHJvcGVydHkoaGFzaCkpIHtcbiAgICAgICAgICAgIHZhciBjb250YWluZXIgPSBjb250YWluZXJzW2hhc2hdO1xuICAgICAgICAgICAgY29udGFpbmVyLnN1cHByZXNzID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8vIFJldHVybnMgdGhlIGxvY2F0aW9ucyB3aGVyZSB0aGUgZ2l2ZW4gcmVhY3Rpb24gb2NjdXJzIG9uIHRoZSBwYWdlLiBUaGUgcmV0dXJuIGZvcm1hdCBpczpcbi8vIHtcbi8vICAgPGNvbnRlbnRfaWQ+IDoge1xuLy8gICAgIGNvdW50OiA8bnVtYmVyPixcbi8vICAgICBpZDogPGNvbnRlbnRfaWQ+LFxuLy8gICAgIGNvbnRhaW5lcklEOiA8Y29udGFpbmVyX2lkPlxuLy8gICAgIGtpbmQ6IDxjb250ZW50IGtpbmQ+LFxuLy8gICAgIGxvY2F0aW9uOiA8bG9jYXRpb24+LFxuLy8gICAgIFtib2R5OiA8Ym9keT5dIGZpbGxlZCBpbiBsYXRlciB2aWEgdXBkYXRlTG9jYXRpb25EYXRhXG4vLyAgIH1cbi8vIH1cbmZ1bmN0aW9uIGdldFJlYWN0aW9uTG9jYXRpb25EYXRhKHJlYWN0aW9uLCBwYWdlRGF0YSkge1xuICAgIGlmICghcGFnZURhdGEubG9jYXRpb25EYXRhKSB7IC8vIFBvcHVsYXRlIHRoaXMgdHJlZSBsYXppbHksIHNpbmNlIGl0J3Mgbm90IGZyZXF1ZW50bHkgdXNlZC5cbiAgICAgICAgcGFnZURhdGEubG9jYXRpb25EYXRhID0gY29tcHV0ZUxvY2F0aW9uRGF0YShwYWdlRGF0YSk7XG4gICAgfVxuICAgIHJldHVybiBwYWdlRGF0YS5sb2NhdGlvbkRhdGFbcmVhY3Rpb24uaWRdO1xufVxuXG4vLyBSZXR1cm5zIGEgdmlldyBvbiB0aGUgZ2l2ZW4gdHJlZSBzdHJ1Y3R1cmUgdGhhdCdzIG9wdGltaXplZCBmb3IgcmVuZGVyaW5nIHRoZSBsb2NhdGlvbiBvZiByZWFjdGlvbnMgKGFzIGZyb20gdGhlXG4vLyBzdW1tYXJ5IHdpZGdldCkuIEZvciBlYWNoIHJlYWN0aW9uLCB3ZSBjYW4gcXVpY2tseSBnZXQgdG8gdGhlIHBpZWNlcyBvZiBjb250ZW50IHRoYXQgaGF2ZSB0aGF0IHJlYWN0aW9uIGFzIHdlbGwgYXNcbi8vIHRoZSBjb3VudCBvZiB0aG9zZSByZWFjdGlvbnMgZm9yIGVhY2ggcGllY2Ugb2YgY29udGVudC5cbi8vXG4vLyBUaGUgc3RydWN0dXJlIGxvb2tzIGxpa2UgdGhpczpcbi8vIHtcbi8vICAgPHJlYWN0aW9uX2lkPiA6IHsgICAodGhpcyBpcyB0aGUgaW50ZXJhY3Rpb25fbm9kZV9pZClcbi8vICAgICA8Y29udGVudF9pZD4gOiB7XG4vLyAgICAgICBjb3VudCA6IDxudW1iZXI+LFxuLy8gICAgICAgY29udGFpbmVySUQ6IDxjb250YWluZXJfaWQ+LFxuLy8gICAgICAga2luZDogPGNvbnRlbnQga2luZD4sXG4vLyAgICAgICBsb2NhdGlvbjogPGxvY2F0aW9uPlxuLy8gICAgICAgW2JvZHk6IDxib2R5Pl0gZmlsbGVkIGluIGxhdGVyIHZpYSB1cGRhdGVMb2NhdGlvbkRhdGFcbi8vICAgICB9XG4vLyAgIH1cbi8vIH1cbmZ1bmN0aW9uIGNvbXB1dGVMb2NhdGlvbkRhdGEocGFnZURhdGEpIHtcbiAgICB2YXIgbG9jYXRpb25EYXRhID0ge307XG4gICAgdmFyIGNvbnRhaW5lcnMgPSBwYWdlRGF0YS5jb250YWluZXJzO1xuICAgIGZvciAodmFyIGhhc2ggaW4gY29udGFpbmVycykge1xuICAgICAgICBpZiAoY29udGFpbmVycy5oYXNPd25Qcm9wZXJ0eShoYXNoKSkge1xuICAgICAgICAgICAgdmFyIGNvbnRhaW5lckRhdGEgPSBjb250YWluZXJzW2hhc2hdO1xuICAgICAgICAgICAgdmFyIHJlYWN0aW9ucyA9IGNvbnRhaW5lckRhdGEucmVhY3Rpb25zO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZWFjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgcmVhY3Rpb24gPSByZWFjdGlvbnNbaV07XG4gICAgICAgICAgICAgICAgdmFyIHJlYWN0aW9uSWQgPSByZWFjdGlvbi5pZDtcbiAgICAgICAgICAgICAgICB2YXIgY29udGVudCA9IHJlYWN0aW9uLmNvbnRlbnQ7XG4gICAgICAgICAgICAgICAgdmFyIGNvbnRlbnRJZCA9IGNvbnRlbnQuaWQ7XG4gICAgICAgICAgICAgICAgdmFyIHJlYWN0aW9uTG9jYXRpb25EYXRhID0gbG9jYXRpb25EYXRhW3JlYWN0aW9uSWRdO1xuICAgICAgICAgICAgICAgIGlmICghcmVhY3Rpb25Mb2NhdGlvbkRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVhY3Rpb25Mb2NhdGlvbkRhdGEgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgbG9jYXRpb25EYXRhW3JlYWN0aW9uSWRdID0gcmVhY3Rpb25Mb2NhdGlvbkRhdGE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBjb250ZW50TG9jYXRpb25EYXRhID0gcmVhY3Rpb25Mb2NhdGlvbkRhdGFbY29udGVudElkXTsgLy8gVE9ETzogSXQncyBub3QgcmVhbGx5IHBvc3NpYmxlIHRvIGdldCBhIGhpdCBoZXJlLCBpcyBpdD8gV2Ugc2hvdWxkIG5ldmVyIHNlZSB0d28gaW5zdGFuY2VzIG9mIHRoZSBzYW1lIHJlYWN0aW9uIGZvciB0aGUgc2FtZSBjb250ZW50PyAoVGhlcmUnZCB3b3VsZCBqdXN0IGJlIG9uZSBpbnN0YW5jZSB3aXRoIGEgY291bnQgPiAxLilcbiAgICAgICAgICAgICAgICBpZiAoIWNvbnRlbnRMb2NhdGlvbkRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGVudExvY2F0aW9uRGF0YSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50OiAwLFxuICAgICAgICAgICAgICAgICAgICAgICAga2luZDogY29udGVudC5raW5kLCAvLyBUT0RPOiBXZSBzaG91bGQgbm9ybWFsaXplIHRoaXMgdmFsdWUgdG8gYSBzZXQgb2YgY29uc3RhbnRzLiBmaXggdGhpcyBpbiBsb2NhdGlvbnMtcGFnZSB3aGVyZSB0aGUgdmFsdWUgaXMgcmVhZCBhcyB3ZWxsLlxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogYWxzbyBjb25zaWRlciB0cmFuc2xhdGluZyB0aGlzIGZyb20gdGhlIHJhdyBcImtpbmRcIiB0byBcInR5cGVcIi4gKGUuZy4gXCJwYWdcIiA9PiBcInBhZ2VcIilcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uOiBjb250ZW50LmxvY2F0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGFpbmVySGFzaDogY29udGFpbmVyRGF0YS5oYXNoLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudElkOiBjb250ZW50SWRcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgcmVhY3Rpb25Mb2NhdGlvbkRhdGFbY29udGVudElkXSA9IGNvbnRlbnRMb2NhdGlvbkRhdGE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnRlbnRMb2NhdGlvbkRhdGEuY291bnQgKz0gcmVhY3Rpb24uY291bnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGxvY2F0aW9uRGF0YTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlUmVhY3Rpb25Mb2NhdGlvbkRhdGEocmVhY3Rpb25Mb2NhdGlvbkRhdGEsIGNvbnRlbnRCb2RpZXMpIHtcbiAgICBmb3IgKHZhciBjb250ZW50SWQgaW4gY29udGVudEJvZGllcykge1xuICAgICAgICBpZiAoY29udGVudEJvZGllcy5oYXNPd25Qcm9wZXJ0eShjb250ZW50SWQpKSB7XG4gICAgICAgICAgICB2YXIgY29udGVudExvY2F0aW9uRGF0YSA9IHJlYWN0aW9uTG9jYXRpb25EYXRhW2NvbnRlbnRJZF07XG4gICAgICAgICAgICBpZiAoY29udGVudExvY2F0aW9uRGF0YSkge1xuICAgICAgICAgICAgICAgIGNvbnRlbnRMb2NhdGlvbkRhdGEuYm9keSA9IGNvbnRlbnRCb2RpZXNbY29udGVudElkXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gcmVnaXN0ZXJSZWFjdGlvbihyZWFjdGlvbiwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEpIHtcbiAgICB2YXIgZXhpc3RpbmdSZWFjdGlvbnMgPSBjb250YWluZXJEYXRhLnJlYWN0aW9ucztcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGV4aXN0aW5nUmVhY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChleGlzdGluZ1JlYWN0aW9uc1tpXS5pZCA9PT0gcmVhY3Rpb24uaWQpIHtcbiAgICAgICAgICAgIC8vIFRoaXMgcmVhY3Rpb24gaGFzIGFscmVhZHkgYmVlbiBhZGRlZCB0byB0aGlzIGNvbnRhaW5lci4gRG9uJ3QgYWRkIGl0IGFnYWluLlxuICAgICAgICAgICAgcmV0dXJuIGV4aXN0aW5nUmVhY3Rpb25zW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIGNvbnRhaW5lckRhdGEucmVhY3Rpb25zLnB1c2gocmVhY3Rpb24pO1xuICAgIGNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbCA9IGNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbCArIDE7XG4gICAgdmFyIHN1bW1hcnlSZWFjdGlvbiA9IHtcbiAgICAgICAgdGV4dDogcmVhY3Rpb24udGV4dCxcbiAgICAgICAgaWQ6IHJlYWN0aW9uLmlkLFxuICAgICAgICBjb3VudDogcmVhY3Rpb24uY291bnRcbiAgICB9O1xuICAgIHBhZ2VEYXRhLnN1bW1hcnlSZWFjdGlvbnMucHVzaChzdW1tYXJ5UmVhY3Rpb24pO1xuICAgIHBhZ2VEYXRhLnN1bW1hcnlUb3RhbCA9IHBhZ2VEYXRhLnN1bW1hcnlUb3RhbCArIDE7XG4gICAgcmV0dXJuIHJlYWN0aW9uO1xufVxuXG4vLyBHZXRzIHBhZ2UgZGF0YSBiYXNlZCBvbiBhIFVSTC4gVGhpcyBhbGxvd3Mgb3VyIGNsaWVudCB0byBzdGFydCBwcm9jZXNzaW5nIGEgcGFnZSAoYW5kIGJpbmRpbmcgZGF0YSBvYmplY3RzXG4vLyB0byB0aGUgVUkpICpiZWZvcmUqIHdlIGdldCBkYXRhIGJhY2sgZnJvbSB0aGUgc2VydmVyLlxuZnVuY3Rpb24gZ2V0UGFnZURhdGFCeVVSTCh1cmwpIHtcbiAgICB2YXIgc2VydmVySGFzaCA9IHVybEhhc2hlc1t1cmxdO1xuICAgIGlmIChzZXJ2ZXJIYXNoKSB7XG4gICAgICAgIC8vIElmIHRoZSBzZXJ2ZXIgYWxyZWFkeSBnaXZlbiB1cyB0aGUgaGFzaCBmb3IgdGhlIHBhZ2UsIHVzZSBpdC5cbiAgICAgICAgcmV0dXJuIGdldFBhZ2VEYXRhKHNlcnZlckhhc2gpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIE90aGVyd2lzZSwgdGVtcG9yYXJpbHkgdXNlIHRoZSB1cmwgYXMgdGhlIGhhc2guIFRoaXMgd2lsbCBnZXQgdXBkYXRlZCB3aGVuZXZlciB3ZSBnZXQgZGF0YSBiYWNrIGZyb20gdGhlIHNlcnZlci5cbiAgICAgICAgcmV0dXJuIGdldFBhZ2VEYXRhKHVybCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBnZXRQYWdlRGF0YUZvckpzb25SZXNwb25zZShqc29uKSB7XG4gICAgdmFyIHBhZ2VIYXNoID0ganNvbi5wYWdlSGFzaDtcbiAgICB2YXIgcmVxdWVzdGVkVVJMID0ganNvbi5yZXF1ZXN0ZWRVUkw7XG4gICAgdXJsSGFzaGVzW3JlcXVlc3RlZFVSTF0gPSBwYWdlSGFzaDtcbiAgICB2YXIgdXJsQmFzZWREYXRhID0gcGFnZXNbcmVxdWVzdGVkVVJMXTtcbiAgICBpZiAodXJsQmFzZWREYXRhKSB7XG4gICAgICAgIC8vIHVybEJhc2VkRGF0YSB3ZSd2ZSBhbHJlYWR5IGNyZWF0ZWQvYm91bmQgYSBwYWdlRGF0YSBvYmplY3QgdW5kZXIgdGhlIHJlcXVlc3RlZFVybCwgbW92ZSB0aGF0IGRhdGEgb3ZlclxuICAgICAgICAvLyB0byB0aGUgaGFzaCBrZXlcbiAgICAgICAgcGFnZXNbcGFnZUhhc2hdID0gdXJsQmFzZWREYXRhO1xuICAgICAgICBkZWxldGUgcGFnZXNbcmVxdWVzdGVkVVJMXTtcbiAgICB9XG4gICAgcmV0dXJuIGdldFBhZ2VEYXRhKHBhZ2VIYXNoKTtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGdldFBhZ2VEYXRhQnlVUkw6IGdldFBhZ2VEYXRhQnlVUkwsXG4gICAgZ2V0UGFnZURhdGE6IGdldFBhZ2VEYXRhLFxuICAgIHVwZGF0ZUFsbFBhZ2VEYXRhOiB1cGRhdGVBbGxQYWdlRGF0YSxcbiAgICBnZXRDb250YWluZXJEYXRhOiBnZXRDb250YWluZXJEYXRhLFxuICAgIGdldFJlYWN0aW9uTG9jYXRpb25EYXRhOiBnZXRSZWFjdGlvbkxvY2F0aW9uRGF0YSxcbiAgICB1cGRhdGVSZWFjdGlvbkxvY2F0aW9uRGF0YTogdXBkYXRlUmVhY3Rpb25Mb2NhdGlvbkRhdGEsXG4gICAgcmVnaXN0ZXJSZWFjdGlvbjogcmVnaXN0ZXJSZWFjdGlvbixcbiAgICBjbGVhckluZGljYXRvckxpbWl0OiBjbGVhckluZGljYXRvckxpbWl0XG59OyIsInZhciAkOyByZXF1aXJlKCcuL3V0aWxzL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIEFwcE1vZGUgPSByZXF1aXJlKCcuL3V0aWxzL2FwcC1tb2RlJyk7XG52YXIgSGFzaCA9IHJlcXVpcmUoJy4vdXRpbHMvaGFzaCcpO1xudmFyIE11dGF0aW9uT2JzZXJ2ZXIgPSByZXF1aXJlKCcuL3V0aWxzL211dGF0aW9uLW9ic2VydmVyJyk7XG52YXIgUGFnZVV0aWxzID0gcmVxdWlyZSgnLi91dGlscy9wYWdlLXV0aWxzJyk7XG52YXIgVVJMcyA9IHJlcXVpcmUoJy4vdXRpbHMvdXJscycpO1xudmFyIFdpZGdldEJ1Y2tldCA9IHJlcXVpcmUoJy4vdXRpbHMvd2lkZ2V0LWJ1Y2tldCcpO1xuXG52YXIgQXV0b0NhbGxUb0FjdGlvbiA9IHJlcXVpcmUoJy4vYXV0by1jYWxsLXRvLWFjdGlvbicpO1xudmFyIENhbGxUb0FjdGlvbkluZGljYXRvciA9IHJlcXVpcmUoJy4vY2FsbC10by1hY3Rpb24taW5kaWNhdG9yJyk7XG52YXIgSGFzaGVkRWxlbWVudHMgPSByZXF1aXJlKCcuL2hhc2hlZC1lbGVtZW50cycpO1xudmFyIE1lZGlhSW5kaWNhdG9yV2lkZ2V0ID0gcmVxdWlyZSgnLi9tZWRpYS1pbmRpY2F0b3Itd2lkZ2V0Jyk7XG52YXIgUGFnZURhdGEgPSByZXF1aXJlKCcuL3BhZ2UtZGF0YScpO1xudmFyIFBhZ2VEYXRhTG9hZGVyID0gcmVxdWlyZSgnLi9wYWdlLWRhdGEtbG9hZGVyJyk7XG52YXIgU3VtbWFyeVdpZGdldCA9IHJlcXVpcmUoJy4vc3VtbWFyeS13aWRnZXQnKTtcbnZhciBUZXh0SW5kaWNhdG9yV2lkZ2V0ID0gcmVxdWlyZSgnLi90ZXh0LWluZGljYXRvci13aWRnZXQnKTtcbnZhciBUZXh0UmVhY3Rpb25zID0gcmVxdWlyZSgnLi90ZXh0LXJlYWN0aW9ucycpO1xuXG52YXIgVFlQRV9URVhUID0gXCJ0ZXh0XCI7XG52YXIgVFlQRV9JTUFHRSA9IFwiaW1hZ2VcIjtcbnZhciBUWVBFX01FRElBID0gXCJtZWRpYVwiO1xuXG52YXIgQVRUUl9IQVNIID0gXCJhbnQtaGFzaFwiO1xuXG5cbi8vIFNjYW4gZm9yIGFsbCBwYWdlcyBhdCB0aGUgY3VycmVudCBicm93c2VyIGxvY2F0aW9uLiBUaGlzIGNvdWxkIGp1c3QgYmUgdGhlIGN1cnJlbnQgcGFnZSBvciBpdCBjb3VsZCBiZSBhIGNvbGxlY3Rpb25cbi8vIG9mIHBhZ2VzIChha2EgJ3Bvc3RzJykuXG5mdW5jdGlvbiBzY2FuQWxsUGFnZXMoZ3JvdXBTZXR0aW5ncykge1xuICAgICQoZ3JvdXBTZXR0aW5ncy5leGNsdXNpb25TZWxlY3RvcigpKS5hZGRDbGFzcygnbm8tYW50Jyk7IC8vIEFkZCB0aGUgbm8tYW50IGNsYXNzIHRvIGV2ZXJ5dGhpbmcgdGhhdCBpcyBmbGFnZ2VkIGZvciBleGNsdXNpb25cbiAgICB2YXIgJHBhZ2VzID0gJChncm91cFNldHRpbmdzLnBhZ2VTZWxlY3RvcigpKTsgLy8gVE9ETzogbm8tYW50P1xuICAgIGlmICgkcGFnZXMubGVuZ3RoID09IDApIHtcbiAgICAgICAgLy8gSWYgd2UgZG9uJ3QgZGV0ZWN0IGFueSBwYWdlIG1hcmtlcnMsIHRyZWF0IHRoZSB3aG9sZSBkb2N1bWVudCBhcyB0aGUgc2luZ2xlIHBhZ2VcbiAgICAgICAgJHBhZ2VzID0gJCgnYm9keScpOyAvLyBUT0RPOiBJcyB0aGlzIHRoZSByaWdodCBiZWhhdmlvcj8gKEtlZXAgaW4gc3luYyB3aXRoIHRoZSBzYW1lIGFzc3VtcHRpb24gdGhhdCdzIGJ1aWx0IGludG8gcGFnZS1kYXRhLWxvYWRlci4pXG4gICAgfVxuICAgICRwYWdlcy5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgJHBhZ2UgPSAkKHRoaXMpO1xuICAgICAgICBzY2FuUGFnZSgkcGFnZSwgZ3JvdXBTZXR0aW5ncywgJHBhZ2VzLmxlbmd0aCA+IDEpO1xuICAgIH0pO1xuICAgIE11dGF0aW9uT2JzZXJ2ZXIuYWRkQWRkaXRpb25MaXN0ZW5lcihlbGVtZW50c0FkZGVkKGdyb3VwU2V0dGluZ3MpKTtcbn1cblxuLy8gU2NhbiB0aGUgcGFnZSB1c2luZyB0aGUgZ2l2ZW4gc2V0dGluZ3M6XG4vLyAxLiBGaW5kIGFsbCB0aGUgY29udGFpbmVycyB0aGF0IHdlIGNhcmUgYWJvdXQuXG4vLyAyLiBDb21wdXRlIGhhc2hlcyBmb3IgZWFjaCBjb250YWluZXIuXG4vLyAzLiBJbnNlcnQgd2lkZ2V0IGFmZm9yZGFuY2VzIGZvciBlYWNoIHdoaWNoIGFyZSBib3VuZCB0byB0aGUgZGF0YSBtb2RlbCBieSB0aGUgaGFzaGVzLlxuZnVuY3Rpb24gc2NhblBhZ2UoJHBhZ2UsIGdyb3VwU2V0dGluZ3MsIGlzTXVsdGlQYWdlKSB7XG4gICAgdmFyIHVybCA9IFBhZ2VVdGlscy5jb21wdXRlUGFnZVVybCgkcGFnZSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgdmFyIHBhZ2VEYXRhID0gUGFnZURhdGEuZ2V0UGFnZURhdGFCeVVSTCh1cmwpO1xuICAgIHZhciAkYWN0aXZlU2VjdGlvbnMgPSBmaW5kKCRwYWdlLCBncm91cFNldHRpbmdzLmFjdGl2ZVNlY3Rpb25zKCksIHRydWUpO1xuXG4gICAgLy8gRmlyc3QsIHNjYW4gZm9yIGVsZW1lbnRzIHRoYXQgd291bGQgY2F1c2UgdXMgdG8gaW5zZXJ0IHNvbWV0aGluZyBpbnRvIHRoZSBET00gdGhhdCB0YWtlcyB1cCBzcGFjZS5cbiAgICAvLyBXZSB3YW50IHRvIGdldCBhbnkgcGFnZSByZXNpemluZyBvdXQgb2YgdGhlIHdheSBhcyBlYXJseSBhcyBwb3NzaWJsZS5cbiAgICAvLyBUT0RPOiBDb25zaWRlciBkb2luZyB0aGlzIHdpdGggcmF3IEphdmFzY3JpcHQgYmVmb3JlIGpRdWVyeSBsb2FkcywgdG8gZnVydGhlciByZWR1Y2UgdGhlIGRlbGF5LiBXZSB3b3VsZG4ndFxuICAgIC8vIHNhdmUgYSAqdG9uKiBvZiB0aW1lIGZyb20gdGhpcywgdGhvdWdoLCBzbyBpdCdzIGRlZmluaXRlbHkgYSBsYXRlciBvcHRpbWl6YXRpb24uXG4gICAgc2NhbkZvclN1bW1hcmllcygkcGFnZSwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpOyAvLyBUT0RPOiBzaG91bGQgdGhlIHN1bW1hcnkgc2VhcmNoIGJlIGNvbmZpbmVkIHRvIHRoZSBhY3RpdmUgc2VjdGlvbnM/XG4gICAgJGFjdGl2ZVNlY3Rpb25zLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkc2VjdGlvbiA9ICQodGhpcyk7XG4gICAgICAgIGNyZWF0ZUF1dG9DYWxsc1RvQWN0aW9uKCRzZWN0aW9uLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgfSk7XG4gICAgLy8gU2NhbiBmb3IgQ1RBcyBhY3Jvc3MgdGhlIGVudGlyZSBwYWdlICh0aGV5IGNhbiBiZSBvdXRzaWRlIGFuIGFjdGl2ZSBzZWN0aW9uKS4gQ1RBcyBoYXZlIHRvIGdvIGJlZm9yZSBzY2FucyBmb3JcbiAgICAvLyBjb250ZW50IGJlY2F1c2UgY29udGVudCBpbnZvbHZlZCBpbiBDVEFzIHdpbGwgYmUgdGFnZ2VkIG5vLWFudC5cbiAgICBzY2FuRm9yQ2FsbHNUb0FjdGlvbigkcGFnZSwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgIC8vIFRoZW4gc2NhbiBmb3IgZXZlcnl0aGluZyBlbHNlXG4gICAgJGFjdGl2ZVNlY3Rpb25zLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkc2VjdGlvbiA9ICQodGhpcyk7XG4gICAgICAgIHNjYW5BY3RpdmVFbGVtZW50KCRzZWN0aW9uLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgfSk7XG5cbiAgICBwYWdlRGF0YS5tZXRyaWNzLmhlaWdodCA9IGNvbXB1dGVQYWdlSGVpZ2h0KCRhY3RpdmVTZWN0aW9ucyk7XG4gICAgcGFnZURhdGEubWV0cmljcy5pc011bHRpUGFnZSA9IGlzTXVsdGlQYWdlO1xufVxuXG5mdW5jdGlvbiBjb21wdXRlUGFnZUhlaWdodCgkYWN0aXZlU2VjdGlvbnMpIHtcbiAgICB2YXIgY29udGVudFRvcDtcbiAgICB2YXIgY29udGVudEJvdHRvbTtcbiAgICAkYWN0aXZlU2VjdGlvbnMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRzZWN0aW9uID0gJCh0aGlzKTtcbiAgICAgICAgdmFyIG9mZnNldCA9ICRzZWN0aW9uLm9mZnNldCgpO1xuICAgICAgICBjb250ZW50VG9wID0gY29udGVudFRvcCA9PT0gdW5kZWZpbmVkID8gb2Zmc2V0LnRvcCA6IE1hdGgubWluKGNvbnRlbnRUb3AsIG9mZnNldC50b3ApO1xuICAgICAgICB2YXIgYm90dG9tID0gb2Zmc2V0LnRvcCArICRzZWN0aW9uLm91dGVySGVpZ2h0KCk7XG4gICAgICAgIGNvbnRlbnRCb3R0b20gPSBjb250ZW50Qm90dG9tID09PSB1bmRlZmluZWQgPyBib3R0b20gOiBNYXRoLm1heChjb250ZW50Qm90dG9tLCBib3R0b20pO1xuICAgIH0pO1xuICAgIHJldHVybiBjb250ZW50Qm90dG9tIC0gY29udGVudFRvcDtcbn1cblxuLy8gU2NhbnMgdGhlIGdpdmVuIGVsZW1lbnQsIHdoaWNoIGFwcGVhcnMgaW5zaWRlIGFuIGFjdGl2ZSBzZWN0aW9uLiBUaGUgZWxlbWVudCBjYW4gYmUgdGhlIGVudGlyZSBhY3RpdmUgc2VjdGlvbixcbi8vIHNvbWUgY29udGFpbmVyIHdpdGhpbiB0aGUgYWN0aXZlIHNlY3Rpb24sIG9yIGEgbGVhZiBub2RlIGluIHRoZSBhY3RpdmUgc2VjdGlvbi5cbmZ1bmN0aW9uIHNjYW5BY3RpdmVFbGVtZW50KCRlbGVtZW50LCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHNjYW5Gb3JDb250ZW50KCRlbGVtZW50LCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG59XG5cbmZ1bmN0aW9uIHNjYW5Gb3JTdW1tYXJpZXMoJGVsZW1lbnQsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyICRzdW1tYXJpZXMgPSBmaW5kKCRlbGVtZW50LCBncm91cFNldHRpbmdzLnN1bW1hcnlTZWxlY3RvcigpLCB0cnVlKTtcbiAgICAkc3VtbWFyaWVzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkc3VtbWFyeSA9ICQodGhpcyk7XG4gICAgICAgIHZhciBjb250YWluZXJEYXRhID0gUGFnZURhdGEuZ2V0Q29udGFpbmVyRGF0YShwYWdlRGF0YSwgJ3BhZ2UnKTsgLy8gTWFnaWMgaGFzaCBmb3IgcGFnZSByZWFjdGlvbnNcbiAgICAgICAgY29udGFpbmVyRGF0YS50eXBlID0gJ3BhZ2UnOyAvLyBUT0RPOiByZXZpc2l0IHdoZXRoZXIgaXQgbWFrZXMgc2Vuc2UgdG8gc2V0IHRoZSB0eXBlIGhlcmVcbiAgICAgICAgdmFyIGRlZmF1bHRSZWFjdGlvbnMgPSBncm91cFNldHRpbmdzLmRlZmF1bHRSZWFjdGlvbnMoJHN1bW1hcnkpOyAvLyBUT0RPOiBkbyB3ZSBzdXBwb3J0IGN1c3RvbWl6aW5nIHRoZSBkZWZhdWx0IHJlYWN0aW9ucyBhdCB0aGlzIGxldmVsP1xuICAgICAgICB2YXIgJHN1bW1hcnlFbGVtZW50ID0gU3VtbWFyeVdpZGdldC5jcmVhdGUoY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGRlZmF1bHRSZWFjdGlvbnMsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICBpbnNlcnRDb250ZW50KCRzdW1tYXJ5LCAkc3VtbWFyeUVsZW1lbnQsIGdyb3VwU2V0dGluZ3Muc3VtbWFyeU1ldGhvZCgpKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gc2NhbkZvckNhbGxzVG9BY3Rpb24oJGVsZW1lbnQsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGN0YVRhcmdldHMgPSB7fTsgLy8gVGhlIGVsZW1lbnRzIHRoYXQgdGhlIGNhbGwgdG8gYWN0aW9ucyBhY3Qgb24gKGUuZy4gdGhlIGltYWdlIG9yIHZpZGVvKVxuICAgIGZpbmQoJGVsZW1lbnQsICdbYW50LWl0ZW1dJywgdHJ1ZSkuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRjdGFUYXJnZXQgPSAkKHRoaXMpO1xuICAgICAgICAkY3RhVGFyZ2V0LmFkZENsYXNzKCduby1hbnQnKTsgLy8gZG9uJ3Qgc2hvdyB0aGUgbm9ybWFsIHJlYWN0aW9uIGFmZm9yZGFuY2Ugb24gYSBjdGEgdGFyZ2V0XG4gICAgICAgIHZhciBhbnRJdGVtSWQgPSAkY3RhVGFyZ2V0LmF0dHIoJ2FudC1pdGVtJykudHJpbSgpO1xuICAgICAgICBjdGFUYXJnZXRzW2FudEl0ZW1JZF0gPSAkY3RhVGFyZ2V0O1xuICAgIH0pO1xuXG4gICAgdmFyIGN0YUxhYmVscyA9IHt9OyAvLyBPcHRpb25hbCBlbGVtZW50cyB0aGF0IHJlcG9ydCB0aGUgbnVtYmVyIG9mIHJlYWN0aW9ucyB0byB0aGUgY3RhIChlLmcuIFwiMSByZWFjdGlvblwiKVxuICAgIGZpbmQoJGVsZW1lbnQsICdbYW50LXJlYWN0aW9ucy1sYWJlbC1mb3JdJywgdHJ1ZSkuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRjdGFMYWJlbCA9ICQodGhpcyk7XG4gICAgICAgICRjdGFMYWJlbC5hZGRDbGFzcygnbm8tYW50Jyk7IC8vIGRvbid0IHNob3cgdGhlIG5vcm1hbCByZWFjdGlvbiBhZmZvcmRhbmNlIG9uIGEgY3RhIGxhYmVsXG4gICAgICAgIHZhciBhbnRJdGVtSWQgPSAkY3RhTGFiZWwuYXR0cignYW50LXJlYWN0aW9ucy1sYWJlbC1mb3InKS50cmltKCk7XG4gICAgICAgIGN0YUxhYmVsc1thbnRJdGVtSWRdID0gY3RhTGFiZWxzW2FudEl0ZW1JZF0gfHwgW107XG4gICAgICAgIGN0YUxhYmVsc1thbnRJdGVtSWRdLnB1c2goJGN0YUxhYmVsKTtcbiAgICB9KTtcblxuICAgIHZhciBjdGFDb3VudGVycyA9IHt9OyAvLyBPcHRpb25hbCBlbGVtZW50cyB0aGF0IHJlcG9ydCBvbmx5IHRoZSBjb3VudCBvZiByZWFjdGlvbiB0byBhIGN0YSAoZS5nLiBcIjFcIilcbiAgICBmaW5kKCRlbGVtZW50LCAnW2FudC1jb3VudGVyLWZvcl0nLCB0cnVlKS5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgJGN0YUNvdW50ZXIgPSAkKHRoaXMpO1xuICAgICAgICAkY3RhQ291bnRlci5hZGRDbGFzcygnbm8tYW50Jyk7IC8vIGRvbid0IHNob3cgdGhlIG5vcm1hbCByZWFjdGlvbiBhZmZvcmRhbmNlIG9uIGEgY3RhIGNvdW50ZXJcbiAgICAgICAgdmFyIGFudEl0ZW1JZCA9ICRjdGFDb3VudGVyLmF0dHIoJ2FudC1jb3VudGVyLWZvcicpLnRyaW0oKTtcbiAgICAgICAgY3RhQ291bnRlcnNbYW50SXRlbUlkXSA9IGN0YUNvdW50ZXJzW2FudEl0ZW1JZF0gfHwgW107XG4gICAgICAgIGN0YUNvdW50ZXJzW2FudEl0ZW1JZF0ucHVzaCgkY3RhQ291bnRlcik7XG4gICAgfSk7XG5cbiAgICB2YXIgY3RhRXhwYW5kZWRSZWFjdGlvbnMgPSB7fTsgLy8gT3B0aW9uYWwgZWxlbWVudHMgdGhhdCBzaG93IGV4cGFuZGVkIHJlYWN0aW9ucyBmb3IgdGhlIGN0YSAoZS5nLiBcIkludGVyZXN0aW5nICgxNSkgTm8gdGhhbmtzICgxMClcIilcbiAgICBmaW5kKCRlbGVtZW50LCAnW2FudC1leHBhbmRlZC1yZWFjdGlvbnMtZm9yXScsIHRydWUpLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkY3RhRXhwYW5kZWRSZWFjdGlvbkFyZWEgPSAkKHRoaXMpO1xuICAgICAgICAkY3RhRXhwYW5kZWRSZWFjdGlvbkFyZWEuYWRkQ2xhc3MoJ25vLWFudCcpOyAvLyBkb24ndCBzaG93IHRoZSBub3JtYWwgcmVhY3Rpb24gYWZmb3JkYW5jZSBvbiBhIGN0YSBjb3VudGVyXG4gICAgICAgIHZhciBhbnRJdGVtSWQgPSAkY3RhRXhwYW5kZWRSZWFjdGlvbkFyZWEuYXR0cignYW50LWV4cGFuZGVkLXJlYWN0aW9ucy1mb3InKS50cmltKCk7XG4gICAgICAgIGN0YUV4cGFuZGVkUmVhY3Rpb25zW2FudEl0ZW1JZF0gPSBjdGFFeHBhbmRlZFJlYWN0aW9uc1thbnRJdGVtSWRdIHx8IFtdO1xuICAgICAgICBjdGFFeHBhbmRlZFJlYWN0aW9uc1thbnRJdGVtSWRdLnB1c2goJGN0YUV4cGFuZGVkUmVhY3Rpb25BcmVhKTtcbiAgICB9KTtcblxuICAgIHZhciAkY3RhRWxlbWVudHMgPSBmaW5kKCRlbGVtZW50LCAnW2FudC1jdGEtZm9yXScpOyAvLyBUaGUgY2FsbCB0byBhY3Rpb24gZWxlbWVudHMgd2hpY2ggcHJvbXB0IHRoZSB1c2VyIHRvIHJlYWN0XG4gICAgJGN0YUVsZW1lbnRzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkY3RhRWxlbWVudCA9ICQodGhpcyk7XG4gICAgICAgIHZhciBhbnRJdGVtSWQgPSAkY3RhRWxlbWVudC5hdHRyKCdhbnQtY3RhLWZvcicpO1xuICAgICAgICB2YXIgJHRhcmdldEVsZW1lbnQgPSBjdGFUYXJnZXRzW2FudEl0ZW1JZF07XG4gICAgICAgIGlmICgkdGFyZ2V0RWxlbWVudCkge1xuICAgICAgICAgICAgdmFyIGhhc2ggPSBjb21wdXRlSGFzaCgkdGFyZ2V0RWxlbWVudCwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgdmFyIGNvbnRlbnREYXRhID0gY29tcHV0ZUNvbnRlbnREYXRhKCR0YXJnZXRFbGVtZW50LCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgIGlmIChoYXNoICYmIGNvbnRlbnREYXRhKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNvbnRhaW5lckRhdGEgPSBQYWdlRGF0YS5nZXRDb250YWluZXJEYXRhKHBhZ2VEYXRhLCBoYXNoKTtcbiAgICAgICAgICAgICAgICBjb250YWluZXJEYXRhLnR5cGUgPSBjb21wdXRlRWxlbWVudFR5cGUoJHRhcmdldEVsZW1lbnQpOyAvLyBUT0RPOiByZXZpc2l0IHdoZXRoZXIgaXQgbWFrZXMgc2Vuc2UgdG8gc2V0IHRoZSB0eXBlIGhlcmVcbiAgICAgICAgICAgICAgICBDYWxsVG9BY3Rpb25JbmRpY2F0b3IuY3JlYXRlKHtcbiAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyRGF0YTogY29udGFpbmVyRGF0YSxcbiAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyRWxlbWVudDogJHRhcmdldEVsZW1lbnQsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnREYXRhOiBjb250ZW50RGF0YSxcbiAgICAgICAgICAgICAgICAgICAgY3RhRWxlbWVudDogJGN0YUVsZW1lbnQsXG4gICAgICAgICAgICAgICAgICAgIGN0YUxhYmVsczogY3RhTGFiZWxzW2FudEl0ZW1JZF0sXG4gICAgICAgICAgICAgICAgICAgIGN0YUNvdW50ZXJzOiBjdGFDb3VudGVyc1thbnRJdGVtSWRdLFxuICAgICAgICAgICAgICAgICAgICBjdGFFeHBhbmRlZFJlYWN0aW9uczogY3RhRXhwYW5kZWRSZWFjdGlvbnNbYW50SXRlbUlkXSxcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdFJlYWN0aW9uczogZ3JvdXBTZXR0aW5ncy5kZWZhdWx0UmVhY3Rpb25zKCR0YXJnZXRFbGVtZW50KSxcbiAgICAgICAgICAgICAgICAgICAgcGFnZURhdGE6IHBhZ2VEYXRhLFxuICAgICAgICAgICAgICAgICAgICBncm91cFNldHRpbmdzOiBncm91cFNldHRpbmdzXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KVxufVxuXG5mdW5jdGlvbiBjcmVhdGVBdXRvQ2FsbHNUb0FjdGlvbigkc2VjdGlvbiwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgJGN0YVRhcmdldHMgPSBmaW5kKCRzZWN0aW9uLCBncm91cFNldHRpbmdzLmdlbmVyYXRlZEN0YVNlbGVjdG9yKCkpO1xuICAgICRjdGFUYXJnZXRzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkY3RhVGFyZ2V0ID0gJCh0aGlzKTtcbiAgICAgICAgdmFyIGFudEl0ZW1JZCA9IGdlbmVyYXRlQW50SXRlbUF0dHJpYnV0ZSgpO1xuICAgICAgICAkY3RhVGFyZ2V0LmF0dHIoJ2FudC1pdGVtJywgYW50SXRlbUlkKTtcbiAgICAgICAgdmFyICRjdGEgPSBBdXRvQ2FsbFRvQWN0aW9uLmNyZWF0ZShhbnRJdGVtSWQsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgJGN0YVRhcmdldC5hZnRlcigkY3RhKTsgLy8gVE9ETzogbWFrZSB0aGUgaW5zZXJ0IGJlaGF2aW9yIGNvbmZpZ3VyYWJsZSBsaWtlIHRoZSBzdW1tYXJ5XG4gICAgfSk7XG59XG5cbnZhciBnZW5lcmF0ZUFudEl0ZW1BdHRyaWJ1dGUgPSBmdW5jdGlvbihpbmRleCkge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuICdhbnRlbm5hX2F1dG9fY3RhXycgKyBpbmRleCsrO1xuICAgIH1cbn0oMCk7XG5cbmZ1bmN0aW9uIHNjYW5Gb3JDb250ZW50KCRlbGVtZW50LCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciAkY29udGVudEVsZW1lbnRzID0gZmluZCgkZWxlbWVudCwgZ3JvdXBTZXR0aW5ncy5jb250ZW50U2VsZWN0b3IoKSwgdHJ1ZSk7XG4gICAgJGNvbnRlbnRFbGVtZW50cy5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgJGNvbnRlbnRFbGVtZW50ID0gJCh0aGlzKTtcbiAgICAgICAgdmFyIHR5cGUgPSBjb21wdXRlRWxlbWVudFR5cGUoJGNvbnRlbnRFbGVtZW50KTtcbiAgICAgICAgc3dpdGNoKHR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgVFlQRV9JTUFHRTpcbiAgICAgICAgICAgIGNhc2UgVFlQRV9NRURJQTpcbiAgICAgICAgICAgICAgICBzY2FuTWVkaWEoJGNvbnRlbnRFbGVtZW50LCB0eXBlLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFRZUEVfVEVYVDpcbiAgICAgICAgICAgICAgICBzY2FuVGV4dCgkY29udGVudEVsZW1lbnQsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBzY2FuVGV4dCgkdGV4dEVsZW1lbnQsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgaWYgKHNob3VsZEhhc2hUZXh0KCR0ZXh0RWxlbWVudCwgZ3JvdXBTZXR0aW5ncykpIHtcbiAgICAgICAgdmFyIGhhc2ggPSBjb21wdXRlSGFzaCgkdGV4dEVsZW1lbnQsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgaWYgKGhhc2gpIHtcbiAgICAgICAgICAgIHZhciBjb250YWluZXJEYXRhID0gUGFnZURhdGEuZ2V0Q29udGFpbmVyRGF0YShwYWdlRGF0YSwgaGFzaCk7XG4gICAgICAgICAgICBjb250YWluZXJEYXRhLnR5cGUgPSAndGV4dCc7IC8vIFRPRE86IHJldmlzaXQgd2hldGhlciBpdCBtYWtlcyBzZW5zZSB0byBzZXQgdGhlIHR5cGUgaGVyZVxuICAgICAgICAgICAgdmFyIGRlZmF1bHRSZWFjdGlvbnMgPSBncm91cFNldHRpbmdzLmRlZmF1bHRSZWFjdGlvbnMoJHRleHRFbGVtZW50KTtcbiAgICAgICAgICAgIHZhciAkaW5kaWNhdG9yRWxlbWVudCA9IFRleHRJbmRpY2F0b3JXaWRnZXQuY3JlYXRlKHtcbiAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyRGF0YTogY29udGFpbmVyRGF0YSxcbiAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyRWxlbWVudDogJHRleHRFbGVtZW50LFxuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0UmVhY3Rpb25zOiBkZWZhdWx0UmVhY3Rpb25zLFxuICAgICAgICAgICAgICAgICAgICBwYWdlRGF0YTogcGFnZURhdGEsXG4gICAgICAgICAgICAgICAgICAgIGdyb3VwU2V0dGluZ3M6IGdyb3VwU2V0dGluZ3NcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgdmFyIGxhc3ROb2RlID0gbGFzdENvbnRlbnROb2RlKCR0ZXh0RWxlbWVudC5nZXQoMCkpO1xuICAgICAgICAgICAgaWYgKGxhc3ROb2RlLm5vZGVUeXBlICE9PSAzKSB7XG4gICAgICAgICAgICAgICAgJChsYXN0Tm9kZSkuYmVmb3JlKCRpbmRpY2F0b3JFbGVtZW50KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgJHRleHRFbGVtZW50LmFwcGVuZCgkaW5kaWNhdG9yRWxlbWVudCk7IC8vIFRPRE8gaXMgdGhpcyBjb25maWd1cmFibGUgYWxhIGluc2VydENvbnRlbnQoLi4uKT9cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgVGV4dFJlYWN0aW9ucy5jcmVhdGVSZWFjdGFibGVUZXh0KHtcbiAgICAgICAgICAgICAgICBjb250YWluZXJEYXRhOiBjb250YWluZXJEYXRhLFxuICAgICAgICAgICAgICAgIGNvbnRhaW5lckVsZW1lbnQ6ICR0ZXh0RWxlbWVudCxcbiAgICAgICAgICAgICAgICBkZWZhdWx0UmVhY3Rpb25zOiBkZWZhdWx0UmVhY3Rpb25zLFxuICAgICAgICAgICAgICAgIHBhZ2VEYXRhOiBwYWdlRGF0YSxcbiAgICAgICAgICAgICAgICBncm91cFNldHRpbmdzOiBncm91cFNldHRpbmdzLFxuICAgICAgICAgICAgICAgIGV4Y2x1ZGVOb2RlOiAkaW5kaWNhdG9yRWxlbWVudC5nZXQoMClcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxufVxuXG4vLyBXZSB1c2UgdGhpcyB0byBoYW5kbGUgdGhlIHNpbXBsZSBjYXNlIG9mIHRleHQgY29udGVudCB0aGF0IGVuZHMgd2l0aCBzb21lIG1lZGlhIGFzIGluXG4vLyA8cD5NeSB0ZXh0LiA8aW1nIHNyYz1cIndoYXRldmVyXCI+PC9wPi5cbi8vIFRoaXMgaXMgYSBzaW1wbGlzdGljIGFsZ29yaXRobSwgbm90IGEgZ2VuZXJhbCBzb2x1dGlvbjpcbi8vIFdlIHdhbGsgdGhlIERPTSBpbnNpZGUgdGhlIGdpdmVuIG5vZGUgYW5kIGtlZXAgdHJhY2sgb2YgdGhlIGxhc3QgXCJjb250ZW50XCIgbm9kZSB0aGF0IHdlIGVuY291bnRlciwgd2hpY2ggY291bGQgYmUgZWl0aGVyXG4vLyB0ZXh0IG9yIHNvbWUgbWVkaWEuICBJZiB0aGUgbGFzdCBjb250ZW50IG5vZGUgaXMgbm90IHRleHQsIHdlIHdhbnQgdG8gaW5zZXJ0IHRoZSB0ZXh0IGluZGljYXRvciBiZWZvcmUgdGhlIG1lZGlhLlxuZnVuY3Rpb24gbGFzdENvbnRlbnROb2RlKG5vZGUpIHtcbiAgICB2YXIgbGFzdE5vZGU7XG4gICAgdmFyIGNoaWxkTm9kZXMgPSBub2RlLmNoaWxkTm9kZXM7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGlsZE5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBjaGlsZCA9IGNoaWxkTm9kZXNbaV07XG4gICAgICAgIGlmIChjaGlsZC5ub2RlVHlwZSA9PT0gMykge1xuICAgICAgICAgICAgbGFzdE5vZGUgPSBjaGlsZDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciB0YWdOYW1lID0gY2hpbGQudGFnTmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgc3dpdGNoICh0YWdOYW1lKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAnaW1nJzpcbiAgICAgICAgICAgICAgICBjYXNlICdpZnJhbWUnOlxuICAgICAgICAgICAgICAgIGNhc2UgJ3ZpZGVvJzpcbiAgICAgICAgICAgICAgICBjYXNlICdpZnJhbWUnOlxuICAgICAgICAgICAgICAgICAgICBsYXN0Tm9kZSA9IGNoaWxkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGxhc3ROb2RlID0gbGFzdENvbnRlbnROb2RlKGNoaWxkKSB8fCBsYXN0Tm9kZTtcbiAgICB9XG4gICAgcmV0dXJuIGxhc3ROb2RlO1xufVxuXG5mdW5jdGlvbiBzaG91bGRIYXNoVGV4dCgkdGV4dEVsZW1lbnQsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICBpZiAoKGlzQ3RhKCR0ZXh0RWxlbWVudCwgZ3JvdXBTZXR0aW5ncykpKSB7XG4gICAgICAgIC8vIERvbid0IGhhc2ggdGhlIHRleHQgaWYgaXQgaXMgdGhlIHRhcmdldCBvZiBhIENUQS5cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAvLyBEb24ndCBjcmVhdGUgYW4gaW5kaWNhdG9yIGZvciB0ZXh0IGVsZW1lbnRzIHRoYXQgY29udGFpbiBvdGhlciB0ZXh0IG5vZGVzLlxuICAgIHZhciAkbmVzdGVkRWxlbWVudHMgPSBmaW5kKCR0ZXh0RWxlbWVudCwgZ3JvdXBTZXR0aW5ncy5jb250ZW50U2VsZWN0b3IoKSk7XG4gICAgJG5lc3RlZEVsZW1lbnRzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICgoY29tcHV0ZUVsZW1lbnRUeXBlKCQodGhpcykpID09PSBUWVBFX1RFWFQpKSB7XG4gICAgICAgICAgICAvLyBEb24ndCBoYXNoIGEgdGV4dCBlbGVtZW50IGlmIGl0IGNvbnRhaW5zIGFueSBvdGhlciBtYXRjaGVkIHRleHQgZWxlbWVudHNcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiBpc0N0YSgkZWxlbWVudCwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBjb21wb3NpdGVTZWxlY3RvciA9IGdyb3VwU2V0dGluZ3MuZ2VuZXJhdGVkQ3RhU2VsZWN0b3IoKSArICcsW2FudC1pdGVtXSc7XG4gICAgcmV0dXJuICRlbGVtZW50LmlzKGNvbXBvc2l0ZVNlbGVjdG9yKTtcbn1cblxuLy8gVGhlIFwiaW1hZ2VcIiBhbmQgXCJtZWRpYVwiIHBhdGhzIGNvbnZlcmdlIGhlcmUsIGJlY2F1c2Ugd2UgdXNlIHRoZSBzYW1lIGluZGljYXRvciBtb2R1bGUgZm9yIHRoZW0gYm90aC5cbmZ1bmN0aW9uIHNjYW5NZWRpYSgkbWVkaWFFbGVtZW50LCB0eXBlLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBpbmRpY2F0b3I7XG4gICAgdmFyIGhhc2ggPSBjb21wdXRlSGFzaCgkbWVkaWFFbGVtZW50LCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgaWYgKGhhc2gpIHtcbiAgICAgICAgdmFyIGNvbnRhaW5lckRhdGEgPSBQYWdlRGF0YS5nZXRDb250YWluZXJEYXRhKHBhZ2VEYXRhLCBoYXNoKTtcbiAgICAgICAgY29udGFpbmVyRGF0YS50eXBlID0gdHlwZSA9PT0gVFlQRV9JTUFHRSA/ICdpbWFnZScgOiAnbWVkaWEnO1xuICAgICAgICB2YXIgZGVmYXVsdFJlYWN0aW9ucyA9IGdyb3VwU2V0dGluZ3MuZGVmYXVsdFJlYWN0aW9ucygkbWVkaWFFbGVtZW50KTtcbiAgICAgICAgdmFyIGNvbnRlbnREYXRhID0gY29tcHV0ZUNvbnRlbnREYXRhKCRtZWRpYUVsZW1lbnQsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICBpZiAoY29udGVudERhdGEgJiYgY29udGVudERhdGEuZGltZW5zaW9ucykge1xuICAgICAgICAgICAgaWYgKGNvbnRlbnREYXRhLmRpbWVuc2lvbnMuaGVpZ2h0ID49IDEwMCAmJiBjb250ZW50RGF0YS5kaW1lbnNpb25zLndpZHRoID49IDEwMCkgeyAvLyBEb24ndCBjcmVhdGUgaW5kaWNhdG9yIG9uIGVsZW1lbnRzIHRoYXQgYXJlIHRvbyBzbWFsbFxuICAgICAgICAgICAgICAgIGluZGljYXRvciA9IE1lZGlhSW5kaWNhdG9yV2lkZ2V0LmNyZWF0ZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50OiBXaWRnZXRCdWNrZXQuZ2V0KCksXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250YWluZXJEYXRhOiBjb250YWluZXJEYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudERhdGE6IGNvbnRlbnREYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyRWxlbWVudDogJG1lZGlhRWxlbWVudCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHRSZWFjdGlvbnM6IGRlZmF1bHRSZWFjdGlvbnMsXG4gICAgICAgICAgICAgICAgICAgICAgICBwYWdlRGF0YTogcGFnZURhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICBncm91cFNldHRpbmdzOiBncm91cFNldHRpbmdzXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIC8vIExpc3RlbiBmb3IgY2hhbmdlcyB0byB0aGUgaW1hZ2UgYXR0cmlidXRlcyB3aGljaCBjb3VsZCBpbmRpY2F0ZSBjb250ZW50IGNoYW5nZXMuXG4gICAgTXV0YXRpb25PYnNlcnZlci5hZGRPbmVUaW1lQXR0cmlidXRlTGlzdGVuZXIoJG1lZGlhRWxlbWVudC5nZXQoMCksIFsnc3JjJywnYW50LWl0ZW0tY29udGVudCcsJ2RhdGEnXSwgZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmIChpbmRpY2F0b3IpIHtcbiAgICAgICAgICAgIC8vIFRPRE86IHVwZGF0ZSBIYXNoZWRFbGVtZW50cyB0byByZW1vdmUgdGhlIHByZXZpb3VzIGhhc2gtPmVsZW1lbnQgbWFwcGluZy4gQ29uc2lkZXIgdGhlcmUgY291bGQgYmUgbXVsdGlwbGVcbiAgICAgICAgICAgIC8vICAgICAgIGluc3RhbmNlcyBvZiB0aGUgc2FtZSBlbGVtZW50IG9uIGEgcGFnZS4uLiBzbyB3ZSBtaWdodCBuZWVkIHRvIHVzZSBhIGNvdW50ZXIuXG4gICAgICAgICAgICBpbmRpY2F0b3IudGVhcmRvd24oKTtcbiAgICAgICAgfVxuICAgICAgICBzY2FuTWVkaWEoJG1lZGlhRWxlbWVudCwgdHlwZSwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBmaW5kKCRlbGVtZW50LCBzZWxlY3RvciwgYWRkQmFjaykge1xuICAgIHZhciByZXN1bHQgPSAkZWxlbWVudC5maW5kKHNlbGVjdG9yKTtcbiAgICBpZiAoYWRkQmFjayAmJiBzZWxlY3RvcikgeyAvLyB3aXRoIGFuIHVuZGVmaW5lZCBzZWxlY3RvciwgYWRkQmFjayB3aWxsIG1hdGNoIGFuZCBhbHdheXMgcmV0dXJuIHRoZSBpbnB1dCBlbGVtZW50ICh1bmxpa2UgZmluZCgpIHdoaWNoIHJldHVybnMgYW4gZW1wdHkgbWF0Y2gpXG4gICAgICAgIHJlc3VsdCA9IHJlc3VsdC5hZGRCYWNrKHNlbGVjdG9yKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdC5maWx0ZXIoZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiAkKHRoaXMpLmNsb3Nlc3QoJy5uby1hbnQnKS5sZW5ndGggPT0gMDtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gaW5zZXJ0Q29udGVudCgkcGFyZW50LCBjb250ZW50LCBtZXRob2QpIHtcbiAgICBzd2l0Y2ggKG1ldGhvZCkge1xuICAgICAgICBjYXNlICdhcHBlbmQnOlxuICAgICAgICAgICAgJHBhcmVudC5hcHBlbmQoY29udGVudCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAncHJlcGVuZCc6XG4gICAgICAgICAgICAkcGFyZW50LnByZXBlbmQoY29udGVudCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnYmVmb3JlJzpcbiAgICAgICAgICAgICRwYXJlbnQuYmVmb3JlKGNvbnRlbnQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2FmdGVyJzpcbiAgICAgICAgICAgICRwYXJlbnQuYWZ0ZXIoY29udGVudCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVIYXNoKCRlbGVtZW50LCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIC8vIFRPRE86IG1ha2Ugc3VyZSB3ZSBnZW5lcmF0ZSB1bmlxdWUgaGFzaGVzIHVzaW5nIGFuIG9yZGVyZWQgaW5kZXggaW4gY2FzZSBvZiBjb2xsaXNpb25zXG4gICAgdmFyIGhhc2g7XG4gICAgc3dpdGNoIChjb21wdXRlRWxlbWVudFR5cGUoJGVsZW1lbnQpKSB7XG4gICAgICAgIGNhc2UgVFlQRV9JTUFHRTpcbiAgICAgICAgICAgIHZhciBpbWFnZVVybCA9IFVSTHMuY29tcHV0ZUltYWdlVXJsKCRlbGVtZW50LCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgIGhhc2ggPSBIYXNoLmhhc2hJbWFnZShpbWFnZVVybCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBUWVBFX01FRElBOlxuICAgICAgICAgICAgdmFyIG1lZGlhVXJsID0gVVJMcy5jb21wdXRlTWVkaWFVcmwoJGVsZW1lbnQsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgaGFzaCA9IEhhc2guaGFzaE1lZGlhKG1lZGlhVXJsKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFRZUEVfVEVYVDpcbiAgICAgICAgICAgIGhhc2ggPSBIYXNoLmhhc2hUZXh0KCRlbGVtZW50KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBpZiAoaGFzaCkge1xuICAgICAgICBIYXNoZWRFbGVtZW50cy5zZXQoaGFzaCwgcGFnZURhdGEucGFnZUhhc2gsICRlbGVtZW50KTsgLy8gUmVjb3JkIHRoZSByZWxhdGlvbnNoaXAgYmV0d2VlbiB0aGUgaGFzaCBhbmQgZG9tIGVsZW1lbnQuXG4gICAgICAgIGlmIChBcHBNb2RlLmRlYnVnKSB7XG4gICAgICAgICAgICAkZWxlbWVudC5hdHRyKEFUVFJfSEFTSCwgaGFzaCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGhhc2g7XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVDb250ZW50RGF0YSgkZWxlbWVudCwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBjb250ZW50RGF0YTtcbiAgICBzd2l0Y2ggKGNvbXB1dGVFbGVtZW50VHlwZSgkZWxlbWVudCkpIHtcbiAgICAgICAgY2FzZSBUWVBFX0lNQUdFOlxuICAgICAgICAgICAgdmFyIGltYWdlVXJsID0gVVJMcy5jb21wdXRlSW1hZ2VVcmwoJGVsZW1lbnQsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgdmFyIGltYWdlRGltZW5zaW9ucyA9IHtcbiAgICAgICAgICAgICAgICBoZWlnaHQ6ICRlbGVtZW50LmhlaWdodCgpLCAvLyBUT0RPOiByZXZpZXcgaG93IHdlIGdldCB0aGUgaW1hZ2UgZGltZW5zaW9uc1xuICAgICAgICAgICAgICAgIHdpZHRoOiAkZWxlbWVudC53aWR0aCgpXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgY29udGVudERhdGEgPSB7XG4gICAgICAgICAgICAgICAgdHlwZTogJ2ltZycsXG4gICAgICAgICAgICAgICAgYm9keTogaW1hZ2VVcmwsXG4gICAgICAgICAgICAgICAgZGltZW5zaW9uczogaW1hZ2VEaW1lbnNpb25zXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgVFlQRV9NRURJQTpcbiAgICAgICAgICAgIHZhciBtZWRpYVVybCA9IFVSTHMuY29tcHV0ZU1lZGlhVXJsKCRlbGVtZW50LCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgIHZhciBtZWRpYURpbWVuc2lvbnMgPSB7XG4gICAgICAgICAgICAgICAgaGVpZ2h0OiAkZWxlbWVudC5oZWlnaHQoKSwgLy8gVE9ETzogcmV2aWV3IGhvdyB3ZSBnZXQgdGhlIG1lZGlhIGRpbWVuc2lvbnNcbiAgICAgICAgICAgICAgICB3aWR0aDogJGVsZW1lbnQud2lkdGgoKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGNvbnRlbnREYXRhID0ge1xuICAgICAgICAgICAgICAgIHR5cGU6ICdtZWRpYScsXG4gICAgICAgICAgICAgICAgYm9keTogbWVkaWFVcmwsXG4gICAgICAgICAgICAgICAgZGltZW5zaW9uczogbWVkaWFEaW1lbnNpb25zXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgVFlQRV9URVhUOlxuICAgICAgICAgICAgY29udGVudERhdGEgPSB7IHR5cGU6ICd0ZXh0JyB9O1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIHJldHVybiBjb250ZW50RGF0YTtcbn1cblxuZnVuY3Rpb24gY29tcHV0ZUVsZW1lbnRUeXBlKCRlbGVtZW50KSB7XG4gICAgdmFyIGl0ZW1UeXBlID0gJGVsZW1lbnQuYXR0cignYW50LWl0ZW0tdHlwZScpO1xuICAgIGlmIChpdGVtVHlwZSAmJiBpdGVtVHlwZS50cmltKCkubGVuZ3RoID4gMCkge1xuICAgICAgICByZXR1cm4gaXRlbVR5cGUudHJpbSgpO1xuICAgIH1cbiAgICB2YXIgdGFnTmFtZSA9ICRlbGVtZW50LnByb3AoJ3RhZ05hbWUnKS50b0xvd2VyQ2FzZSgpO1xuICAgIHN3aXRjaCAodGFnTmFtZSkge1xuICAgICAgICBjYXNlICdpbWcnOlxuICAgICAgICAgICAgcmV0dXJuIFRZUEVfSU1BR0U7XG4gICAgICAgIGNhc2UgJ3ZpZGVvJzpcbiAgICAgICAgY2FzZSAnaWZyYW1lJzpcbiAgICAgICAgY2FzZSAnZW1iZWQnOlxuICAgICAgICAgICAgcmV0dXJuIFRZUEVfTUVESUE7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICByZXR1cm4gVFlQRV9URVhUO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZWxlbWVudHNBZGRlZChncm91cFNldHRpbmdzKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgkZWxlbWVudHMpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAkZWxlbWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciAkZWxlbWVudCA9ICRlbGVtZW50c1tpXTtcbiAgICAgICAgICAgICRlbGVtZW50LmZpbmQoZ3JvdXBTZXR0aW5ncy5leGNsdXNpb25TZWxlY3RvcigpKS5hZGRCYWNrKGdyb3VwU2V0dGluZ3MuZXhjbHVzaW9uU2VsZWN0b3IoKSkuYWRkQ2xhc3MoJ25vLWFudCcpOyAvLyBBZGQgdGhlIG5vLWFudCBjbGFzcyB0byBldmVyeXRoaW5nIHRoYXQgaXMgZmxhZ2dlZCBmb3IgZXhjbHVzaW9uXG4gICAgICAgICAgICBpZiAoJGVsZW1lbnQuY2xvc2VzdCgnLm5vLWFudCcpLmxlbmd0aCA9PT0gMCkgeyAvLyBJZ25vcmUgYW55dGhpbmcgdGFnZ2VkIG5vLWFudFxuICAgICAgICAgICAgICAgIC8vIEZpcnN0LCBzZWUgaWYgYW55IGVudGlyZSBwYWdlcyB3ZXJlIGFkZGVkXG4gICAgICAgICAgICAgICAgdmFyICRwYWdlcyA9IGZpbmQoJGVsZW1lbnQsIGdyb3VwU2V0dGluZ3MucGFnZVNlbGVjdG9yKCksIHRydWUpO1xuICAgICAgICAgICAgICAgIGlmICgkcGFnZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICBQYWdlRGF0YUxvYWRlci5wYWdlc0FkZGVkKCRwYWdlcywgZ3JvdXBTZXR0aW5ncyk7IC8vIFRPRE86IGNvbnNpZGVyIGlmIHRoZXJlJ3MgYSBiZXR0ZXIgd2F5IHRvIGFyY2hpdGVjdCB0aGlzXG4gICAgICAgICAgICAgICAgICAgICRwYWdlcy5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjYW5QYWdlKCQodGhpcyksIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBJZiBub3QgYW4gZW50aXJlIHBhZ2UvcGFnZXMsIHNlZSBpZiBjb250ZW50IHdhcyBhZGRlZCB0byBhbiBleGlzdGluZyBwYWdlXG4gICAgICAgICAgICAgICAgICAgIHZhciAkcGFnZSA9ICRlbGVtZW50LmNsb3Nlc3QoZ3JvdXBTZXR0aW5ncy5wYWdlU2VsZWN0b3IoKSk7XG4gICAgICAgICAgICAgICAgICAgIGlmICgkcGFnZS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRwYWdlID0gJCgnYm9keScpOyAvLyBUT0RPOiBpcyB0aGlzIHJpZ2h0PyBrZWVwIGluIHN5bmMgd2l0aCBzY2FuQWxsUGFnZXNcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB2YXIgdXJsID0gUGFnZVV0aWxzLmNvbXB1dGVQYWdlVXJsKCRwYWdlLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBhZ2VEYXRhID0gUGFnZURhdGEuZ2V0UGFnZURhdGFCeVVSTCh1cmwpO1xuICAgICAgICAgICAgICAgICAgICAvLyBGaXJzdCwgY2hlY2sgZm9yIGFueSBuZXcgc3VtbWFyeSB3aWRnZXRzLi4uXG4gICAgICAgICAgICAgICAgICAgIHNjYW5Gb3JTdW1tYXJpZXMoJGVsZW1lbnQsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gTmV4dCwgc2VlIGlmIGFueSBlbnRpcmUgYWN0aXZlIHNlY3Rpb25zIHdlcmUgYWRkZWRcbiAgICAgICAgICAgICAgICAgICAgdmFyICRhY3RpdmVTZWN0aW9ucyA9IGZpbmQoJGVsZW1lbnQsIGdyb3VwU2V0dGluZ3MuYWN0aXZlU2VjdGlvbnMoKSk7XG4gICAgICAgICAgICAgICAgICAgIGlmICgkYWN0aXZlU2VjdGlvbnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJGFjdGl2ZVNlY3Rpb25zLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNyZWF0ZUF1dG9DYWxsc1RvQWN0aW9uKCQodGhpcyksIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgJGFjdGl2ZVNlY3Rpb25zLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciAkc2VjdGlvbiA9ICQodGhpcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NhbkFjdGl2ZUVsZW1lbnQoJHNlY3Rpb24sIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRmluYWxseSwgc2NhbiBpbnNpZGUgdGhlIGVsZW1lbnQgZm9yIGNvbnRlbnRcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciAkYWN0aXZlU2VjdGlvbiA9ICRlbGVtZW50LmNsb3Nlc3QoZ3JvdXBTZXR0aW5ncy5hY3RpdmVTZWN0aW9ucygpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgkYWN0aXZlU2VjdGlvbi5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3JlYXRlQXV0b0NhbGxzVG9BY3Rpb24oJGVsZW1lbnQsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY2FuQWN0aXZlRWxlbWVudCgkZWxlbWVudCwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiB0aGUgZWxlbWVudCBpcyBhZGRlZCBvdXRzaWRlIGFuIGFjdGl2ZSBzZWN0aW9uLCBqdXN0IGNoZWNrIGl0IGZvciBDVEFzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NhbkZvckNhbGxzVG9BY3Rpb24oJGVsZW1lbnQsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgc2Nhbjogc2NhbkFsbFBhZ2VzXG59OyIsInZhciAkOyByZXF1aXJlKCcuL3V0aWxzL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIFJhY3RpdmU7IHJlcXVpcmUoJy4vdXRpbHMvcmFjdGl2ZS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihsb2FkZWRSYWN0aXZlKSB7IFJhY3RpdmUgPSBsb2FkZWRSYWN0aXZlO30pO1xudmFyIFdpZGdldEJ1Y2tldCA9IHJlcXVpcmUoJy4vdXRpbHMvd2lkZ2V0LWJ1Y2tldCcpO1xudmFyIFRyYW5zaXRpb25VdGlsID0gcmVxdWlyZSgnLi91dGlscy90cmFuc2l0aW9uLXV0aWwnKTtcblxudmFyIFNWR3MgPSByZXF1aXJlKCcuL3N2Z3MnKTtcblxudmFyIHJhY3RpdmU7XG52YXIgY2xpY2tIYW5kbGVyO1xuXG5cbmZ1bmN0aW9uIGdldFJvb3RFbGVtZW50KCkge1xuICAgIC8vIFRPRE8gcmV2aXNpdCB0aGlzLCBpdCdzIGtpbmQgb2YgZ29vZnkgYW5kIGl0IG1pZ2h0IGhhdmUgYSB0aW1pbmcgcHJvYmxlbVxuICAgIGlmICghcmFjdGl2ZSkge1xuICAgICAgICB2YXIgYnVja2V0ID0gV2lkZ2V0QnVja2V0LmdldCgpO1xuICAgICAgICByYWN0aXZlID0gUmFjdGl2ZSh7XG4gICAgICAgICAgICBlbDogYnVja2V0LFxuICAgICAgICAgICAgYXBwZW5kOiB0cnVlLFxuICAgICAgICAgICAgdGVtcGxhdGU6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9wb3B1cC13aWRnZXQuaGJzLmh0bWwnKSxcbiAgICAgICAgICAgIHBhcnRpYWxzOiB7XG4gICAgICAgICAgICAgICAgbG9nbzogU1ZHcy5sb2dvXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB2YXIgJGVsZW1lbnQgPSAkKHJhY3RpdmUuZmluZCgnLmFudGVubmEtcG9wdXAnKSk7XG4gICAgICAgICRlbGVtZW50Lm9uKCdtb3VzZWRvd24nLCBmYWxzZSk7IC8vIFByZXZlbnQgbW91c2Vkb3duIGZyb20gcHJvcGFnYXRpbmcsIHNvIHRoZSBicm93c2VyIGRvZXNuJ3QgY2xlYXIgdGhlIHRleHQgc2VsZWN0aW9uLlxuICAgICAgICAkZWxlbWVudC5vbignY2xpY2suYW50ZW5uYS1wb3B1cCcsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIGhpZGVQb3B1cCgkZWxlbWVudCk7XG4gICAgICAgICAgICBpZiAoY2xpY2tIYW5kbGVyKSB7XG4gICAgICAgICAgICAgICAgY2xpY2tIYW5kbGVyKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICAvLyBUaGUgOmhvdmVyIHBzZXVkbyBjbGFzcyBjYW4gYmVjb21lIHN0dWNrIG9uIHRoZSBhbnRlbm5hLXBvcHVwIGVsZW1lbnQgd2hlbiB3ZSBicmluZyB1cCB0aGUgcmVhY3Rpb24gd2luZG93XG4gICAgICAgIC8vIGluIHJlc3BvbnNlIHRvIHRoZSBjbGljay4gU28gaGVyZSB3ZSBhZGQvcmVtb3ZlIG91ciBvd24gaG92ZXIgY2xhc3MgaW5zdGVhZC5cbiAgICAgICAgLy8gU2VlOiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzEwMzIxMjc1L2hvdmVyLXN0YXRlLWlzLXN0aWNreS1hZnRlci1lbGVtZW50LWlzLW1vdmVkLW91dC1mcm9tLXVuZGVyLXRoZS1tb3VzZS1pbi1hbGwtYnJcbiAgICAgICAgJGVsZW1lbnQub24oJ21vdXNlZW50ZXInLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgJGVsZW1lbnQuYWRkQ2xhc3MoJ2hvdmVyJyk7XG4gICAgICAgIH0pO1xuICAgICAgICAkZWxlbWVudC5vbignbW91c2VsZWF2ZScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgJGVsZW1lbnQucmVtb3ZlQ2xhc3MoJ2hvdmVyJyk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gJGVsZW1lbnQ7XG4gICAgfVxuICAgIHJldHVybiAkKHJhY3RpdmUuZmluZCgnLmFudGVubmEtcG9wdXAnKSk7XG59XG5cbmZ1bmN0aW9uIHNob3dQb3B1cChjb29yZGluYXRlcywgY2FsbGJhY2spIHtcbiAgICB2YXIgJGVsZW1lbnQgPSBnZXRSb290RWxlbWVudCgpO1xuICAgIGlmICghJGVsZW1lbnQuaGFzQ2xhc3MoJ3Nob3cnKSkge1xuICAgICAgICBjbGlja0hhbmRsZXIgPSBjYWxsYmFjaztcbiAgICAgICAgJGVsZW1lbnRcbiAgICAgICAgICAgIC5zaG93KCkgLy8gc3RpbGwgaGFzIG9wYWNpdHkgMCBhdCB0aGlzIHBvaW50XG4gICAgICAgICAgICAuY3NzKHtcbiAgICAgICAgICAgICAgICB0b3A6IGNvb3JkaW5hdGVzLnRvcCAtICRlbGVtZW50Lm91dGVySGVpZ2h0KCkgLSA2LCAvLyBUT0RPIGZpbmQgYSBjbGVhbmVyIHdheSB0byBhY2NvdW50IGZvciB0aGUgcG9wdXAgJ3RhaWwnXG4gICAgICAgICAgICAgICAgbGVmdDogY29vcmRpbmF0ZXMubGVmdCAtIE1hdGguZmxvb3IoJGVsZW1lbnQub3V0ZXJXaWR0aCgpIC8gMilcbiAgICAgICAgICAgIH0pO1xuICAgICAgICBUcmFuc2l0aW9uVXRpbC50b2dnbGVDbGFzcygkZWxlbWVudCwgJ3Nob3cnLCB0cnVlLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIFRPRE86IGFmdGVyIHRoZSBhcHBlYXJhbmNlIHRyYW5zaXRpb24gaXMgY29tcGxldGUsIGFkZCBhIGhhbmRsZXIgZm9yIG1vdXNlZW50ZXIgd2hpY2ggdGhlbiByZWdpc3RlcnNcbiAgICAgICAgICAgIC8vICAgICAgIGEgaGFuZGxlciBmb3IgbW91c2VsZWF2ZSB0aGF0IGhpZGVzIHRoZSBwb3B1cFxuXG4gICAgICAgICAgICAvLyBUT0RPOiBhbHNvIHRha2UgZG93biB0aGUgcG9wdXAgaWYgdGhlIHVzZXIgbW91c2VzIG92ZXIgYW5vdGhlciB3aWRnZXQgKHN1bW1hcnkgb3IgaW5kaWNhdG9yKVxuICAgICAgICAgICAgJChkb2N1bWVudCkub24oJ2NsaWNrLmFudGVubmEtcG9wdXAnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaGlkZVBvcHVwKCRlbGVtZW50KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGhpZGVQb3B1cCgkZWxlbWVudCkge1xuICAgIFRyYW5zaXRpb25VdGlsLnRvZ2dsZUNsYXNzKCRlbGVtZW50LCAnc2hvdycsIGZhbHNlLCBmdW5jdGlvbigpIHtcbiAgICAgICAgJGVsZW1lbnQuaGlkZSgpOyAvLyBhZnRlciB3ZSdyZSBhdCBvcGFjaXR5IDAsIGhpZGUgdGhlIGVsZW1lbnQgc28gaXQgZG9lc24ndCByZWNlaXZlIGFjY2lkZW50YWwgY2xpY2tzXG4gICAgfSk7XG4gICAgJChkb2N1bWVudCkub2ZmKCdjbGljay5hbnRlbm5hLXBvcHVwJyk7XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBzaG93OiBzaG93UG9wdXBcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgQWpheENsaWVudCA9IHJlcXVpcmUoJy4vdXRpbHMvYWpheC1jbGllbnQnKTtcbnZhciBSYWN0aXZlOyByZXF1aXJlKCcuL3V0aWxzL3JhY3RpdmUtcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24obG9hZGVkUmFjdGl2ZSkgeyBSYWN0aXZlID0gbG9hZGVkUmFjdGl2ZTt9KTtcbnZhciBSYW5nZSA9IHJlcXVpcmUoJy4vdXRpbHMvcmFuZ2UnKTtcbnZhciBSZWFjdGlvbnNXaWRnZXRMYXlvdXRVdGlscyA9IHJlcXVpcmUoJy4vdXRpbHMvcmVhY3Rpb25zLXdpZGdldC1sYXlvdXQtdXRpbHMnKTtcblxudmFyIEV2ZW50cyA9IHJlcXVpcmUoJy4vZXZlbnRzJyk7XG52YXIgU1ZHcyA9IHJlcXVpcmUoJy4vc3ZncycpO1xuXG52YXIgcGFnZVNlbGVjdG9yID0gJy5hbnRlbm5hLXJlYWN0aW9ucy1wYWdlJztcblxuZnVuY3Rpb24gY3JlYXRlUGFnZShvcHRpb25zKSB7XG4gICAgdmFyIGlzU3VtbWFyeSA9IG9wdGlvbnMuaXNTdW1tYXJ5O1xuICAgIHZhciByZWFjdGlvbnNEYXRhID0gb3B0aW9ucy5yZWFjdGlvbnNEYXRhO1xuICAgIHZhciBjb250YWluZXJEYXRhID0gb3B0aW9ucy5jb250YWluZXJEYXRhO1xuICAgIHZhciBwYWdlRGF0YSA9IG9wdGlvbnMucGFnZURhdGE7XG4gICAgdmFyIGdyb3VwU2V0dGluZ3MgPSBvcHRpb25zLmdyb3VwU2V0dGluZ3M7XG4gICAgdmFyIGNvbnRlbnREYXRhID0gb3B0aW9ucy5jb250ZW50RGF0YTtcbiAgICB2YXIgY29udGFpbmVyRWxlbWVudCA9IG9wdGlvbnMuY29udGFpbmVyRWxlbWVudDsgLy8gb3B0aW9uYWxcbiAgICB2YXIgc2hvd0NvbmZpcm1hdGlvbiA9IG9wdGlvbnMuc2hvd0NvbmZpcm1hdGlvbjtcbiAgICB2YXIgc2hvd0RlZmF1bHRzID0gb3B0aW9ucy5zaG93RGVmYXVsdHM7XG4gICAgdmFyIHNob3dDb21tZW50cyA9IG9wdGlvbnMuc2hvd0NvbW1lbnRzO1xuICAgIHZhciBzaG93TG9jYXRpb25zID0gb3B0aW9ucy5zaG93TG9jYXRpb25zO1xuICAgIHZhciBlbGVtZW50ID0gb3B0aW9ucy5lbGVtZW50O1xuICAgIHZhciByZWFjdGlvbnNMYXlvdXREYXRhID0gUmVhY3Rpb25zV2lkZ2V0TGF5b3V0VXRpbHMuY29tcHV0ZUxheW91dERhdGEocmVhY3Rpb25zRGF0YSk7XG4gICAgdmFyICRyZWFjdGlvbnNXaW5kb3cgPSAkKG9wdGlvbnMucmVhY3Rpb25zV2luZG93KTtcbiAgICB2YXIgcmFjdGl2ZSA9IFJhY3RpdmUoe1xuICAgICAgICBlbDogZWxlbWVudCxcbiAgICAgICAgYXBwZW5kOiB0cnVlLFxuICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL3JlYWN0aW9ucy1wYWdlLmhicy5odG1sJyksXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIHJlYWN0aW9uczogcmVhY3Rpb25zRGF0YSxcbiAgICAgICAgICAgIHJlYWN0aW9uc0xheW91dENsYXNzOiBhcnJheUFjY2Vzc29yKHJlYWN0aW9uc0xheW91dERhdGEubGF5b3V0Q2xhc3NlcyksXG4gICAgICAgICAgICBpc1N1bW1hcnk6IGlzU3VtbWFyeVxuICAgICAgICB9LFxuICAgICAgICBkZWNvcmF0b3JzOiB7XG4gICAgICAgICAgICBzaXpldG9maXQ6IHNpemVUb0ZpdCgkcmVhY3Rpb25zV2luZG93KVxuICAgICAgICB9LFxuICAgICAgICBwYXJ0aWFsczoge1xuICAgICAgICAgICAgbG9jYXRpb25JY29uOiBTVkdzLmxvY2F0aW9uLFxuICAgICAgICAgICAgY29tbWVudHNJY29uOiBTVkdzLmNvbW1lbnRzXG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIGlmIChjb250YWluZXJFbGVtZW50KSB7XG4gICAgICAgIHJhY3RpdmUub24oJ2hpZ2hsaWdodCcsIGhpZ2hsaWdodENvbnRlbnQoY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGNvbnRhaW5lckVsZW1lbnQpKTtcbiAgICAgICAgcmFjdGl2ZS5vbignY2xlYXJoaWdobGlnaHRzJywgUmFuZ2UuY2xlYXJIaWdobGlnaHRzKTtcbiAgICB9XG4gICAgcmFjdGl2ZS5vbigncGx1c29uZScsIHBsdXNPbmUoY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIHNob3dDb25maXJtYXRpb24sIGdyb3VwU2V0dGluZ3MpKTtcbiAgICByYWN0aXZlLm9uKCdzaG93ZGVmYXVsdCcsIHNob3dEZWZhdWx0cyk7XG4gICAgcmFjdGl2ZS5vbignc2hvd2NvbW1lbnRzJywgZnVuY3Rpb24ocmFjdGl2ZUV2ZW50KSB7IHNob3dDb21tZW50cyhyYWN0aXZlRXZlbnQuY29udGV4dCk7IHJldHVybiBmYWxzZTsgfSk7IC8vIFRPRE8gY2xlYW4gdXBcbiAgICByYWN0aXZlLm9uKCdzaG93bG9jYXRpb25zJywgZnVuY3Rpb24ocmFjdGl2ZUV2ZW50KSB7IHNob3dMb2NhdGlvbnMocmFjdGl2ZUV2ZW50LmNvbnRleHQpOyByZXR1cm4gZmFsc2U7IH0pOyAvLyBUT0RPIGNsZWFuIHVwXG4gICAgcmV0dXJuIHtcbiAgICAgICAgc2VsZWN0b3I6IHBhZ2VTZWxlY3RvcixcbiAgICAgICAgdGVhcmRvd246IGZ1bmN0aW9uKCkgeyByYWN0aXZlLnRlYXJkb3duKCk7IH1cbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gYXJyYXlBY2Nlc3NvcihhcnJheSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oaW5kZXgpIHtcbiAgICAgICAgICAgIHJldHVybiBhcnJheVtpbmRleF07XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIHNpemVUb0ZpdCgkcmVhY3Rpb25zV2luZG93KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgdmFyICRlbGVtZW50ID0gJChub2RlKS5jbG9zZXN0KCcuYW50ZW5uYS1yZWFjdGlvbi1ib3gnKTtcbiAgICAgICAgLy8gV2hpbGUgd2UncmUgc2l6aW5nIHRoZSB0ZXh0IHRvIGZpeCBpbiB0aGUgcmVhY3Rpb24gYm94LCB3ZSBhbHNvIGZpeCB1cCB0aGUgd2lkdGggb2YgdGhlIHJlYWN0aW9uIGNvdW50IGFuZFxuICAgICAgICAvLyBwbHVzIG9uZSBidXR0b25zIHNvIHRoYXQgdGhleSdyZSB0aGUgc2FtZS4gVGhlc2UgdHdvIHZpc3VhbGx5IHN3YXAgd2l0aCBlYWNoIG90aGVyIG9uIGhvdmVyOyBtYWtpbmcgdGhlbVxuICAgICAgICAvLyB0aGUgc2FtZSB3aWR0aCBtYWtlcyBzdXJlIHdlIGRvbid0IGdldCBqdW1waW5lc3Mgb24gaG92ZXIuXG4gICAgICAgIC8vIFRPRE86IFdlIHNob3VsZCByZXZpc2l0IHRoZSBsYXlvdXQgb2YgdGhlIGFjdGlvbnMgdG8gbWFrZSB0aGVtIGVhc2llciB0YXAgb24gbW9iaWxlLiBBdCB0aGF0IHRpbWUsIHdlIHNob3VsZFxuICAgICAgICAvLyBlbmQgdXAgd2l0aCBzdGFibGUgdG91Y2ggdGFyZ2V0IGJveGVzIGFueXdheS5cbiAgICAgICAgdmFyICRyZWFjdGlvbkNvdW50ID0gJGVsZW1lbnQuZmluZCgnLmFudGVubmEtcmVhY3Rpb24tY291bnQnKTtcbiAgICAgICAgdmFyICRwbHVzT25lID0gJGVsZW1lbnQuZmluZCgnLmFudGVubmEtcGx1c29uZScpO1xuICAgICAgICB2YXIgbWluV2lkdGggPSBNYXRoLm1heCgkcmVhY3Rpb25Db3VudC53aWR0aCgpLCAkcGx1c09uZS53aWR0aCgpKTtcbiAgICAgICAgJHJlYWN0aW9uQ291bnQuY3NzKHsnbWluLXdpZHRoJzogbWluV2lkdGh9KTtcbiAgICAgICAgJHBsdXNPbmUuY3NzKHsnbWluLXdpZHRoJzogbWluV2lkdGh9KTtcbiAgICAgICAgcmV0dXJuIFJlYWN0aW9uc1dpZGdldExheW91dFV0aWxzLnNpemVUb0ZpdCgkcmVhY3Rpb25zV2luZG93KShub2RlKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGhpZ2hsaWdodENvbnRlbnQoY29udGFpbmVyRGF0YSwgcGFnZURhdGEsICRjb250YWluZXJFbGVtZW50KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHZhciByZWFjdGlvbkRhdGEgPSBldmVudC5jb250ZXh0O1xuICAgICAgICBpZiAocmVhY3Rpb25EYXRhLmNvbnRlbnQpIHtcbiAgICAgICAgICAgIHZhciBsb2NhdGlvbiA9IHJlYWN0aW9uRGF0YS5jb250ZW50LmxvY2F0aW9uO1xuICAgICAgICAgICAgaWYgKGxvY2F0aW9uKSB7XG4gICAgICAgICAgICAgICAgUmFuZ2UuaGlnaGxpZ2h0KCRjb250YWluZXJFbGVtZW50LmdldCgwKSwgbG9jYXRpb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBwbHVzT25lKGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBzaG93Q29uZmlybWF0aW9uLCBncm91cFNldHRpbmdzKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHZhciByZWFjdGlvbkRhdGEgPSBldmVudC5jb250ZXh0O1xuICAgICAgICB2YXIgcmVhY3Rpb25Qcm92aWRlciA9IHsgLy8gdGhpcyByZWFjdGlvbiBwcm92aWRlciBpcyBhIG5vLWJyYWluZXIgYmVjYXVzZSB3ZSBhbHJlYWR5IGhhdmUgYSB2YWxpZCByZWFjdGlvbiAob25lIHdpdGggYW4gSUQpXG4gICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2socmVhY3Rpb25EYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgc2hvd0NvbmZpcm1hdGlvbihyZWFjdGlvbkRhdGEsIHJlYWN0aW9uUHJvdmlkZXIpO1xuICAgICAgICBBamF4Q2xpZW50LnBvc3RQbHVzT25lKHJlYWN0aW9uRGF0YSwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGZ1bmN0aW9uKHJlYWN0aW9uRGF0YSl7XG4gICAgICAgICAgICBFdmVudHMucG9zdFJlYWN0aW9uQ3JlYXRlZChwYWdlRGF0YSwgY29udGFpbmVyRGF0YSwgcmVhY3Rpb25EYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgfSwgZXJyb3IpO1xuXG4gICAgICAgIGZ1bmN0aW9uIGVycm9yKG1lc3NhZ2UpIHtcbiAgICAgICAgICAgIC8vIFRPRE8gaGFuZGxlIGFueSBlcnJvcnMgdGhhdCBvY2N1ciBwb3N0aW5nIGEgcmVhY3Rpb25cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiZXJyb3IgcG9zdGluZyBwbHVzIG9uZTogXCIgKyBtZXNzYWdlKTtcbiAgICAgICAgfVxuICAgIH07XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGU6IGNyZWF0ZVBhZ2Vcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgQWpheENsaWVudCA9IHJlcXVpcmUoJy4vdXRpbHMvYWpheC1jbGllbnQnKTtcbnZhciBNZXNzYWdlcyA9IHJlcXVpcmUoJy4vdXRpbHMvbWVzc2FnZXMnKTtcbnZhciBNb3ZlYWJsZSA9IHJlcXVpcmUoJy4vdXRpbHMvbW92ZWFibGUnKTtcbnZhciBSYWN0aXZlOyByZXF1aXJlKCcuL3V0aWxzL3JhY3RpdmUtcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24obG9hZGVkUmFjdGl2ZSkgeyBSYWN0aXZlID0gbG9hZGVkUmFjdGl2ZTt9KTtcbnZhciBSYW5nZSA9IHJlcXVpcmUoJy4vdXRpbHMvcmFuZ2UnKTtcbnZhciBUb3VjaFN1cHBvcnQgPSByZXF1aXJlKCcuL3V0aWxzL3RvdWNoLXN1cHBvcnQnKTtcbnZhciBUcmFuc2l0aW9uVXRpbCA9IHJlcXVpcmUoJy4vdXRpbHMvdHJhbnNpdGlvbi11dGlsJyk7XG52YXIgVVJMcyA9IHJlcXVpcmUoJy4vdXRpbHMvdXJscycpO1xudmFyIFdpZGdldEJ1Y2tldCA9IHJlcXVpcmUoJy4vdXRpbHMvd2lkZ2V0LWJ1Y2tldCcpO1xuXG52YXIgQ29tbWVudHNQYWdlID0gcmVxdWlyZSgnLi9jb21tZW50cy1wYWdlJyk7XG52YXIgQ29uZmlybWF0aW9uUGFnZSA9IHJlcXVpcmUoJy4vY29uZmlybWF0aW9uLXBhZ2UnKTtcbnZhciBEZWZhdWx0c1BhZ2UgPSByZXF1aXJlKCcuL2RlZmF1bHRzLXBhZ2UnKTtcbnZhciBFdmVudHMgPSByZXF1aXJlKCcuL2V2ZW50cycpO1xudmFyIExvY2F0aW9uc1BhZ2UgPSByZXF1aXJlKCcuL2xvY2F0aW9ucy1wYWdlJyk7XG52YXIgUGFnZURhdGEgPSByZXF1aXJlKCcuL3BhZ2UtZGF0YScpO1xudmFyIFJlYWN0aW9uc1BhZ2UgPSByZXF1aXJlKCcuL3JlYWN0aW9ucy1wYWdlJyk7XG52YXIgU1ZHcyA9IHJlcXVpcmUoJy4vc3ZncycpO1xuXG52YXIgUEFHRV9SRUFDVElPTlMgPSAncmVhY3Rpb25zJztcbnZhciBQQUdFX0RFRkFVTFRTID0gJ2RlZmF1bHRzJztcbnZhciBQQUdFX0FVVE8gPSAnYXV0byc7XG5cbnZhciBTRUxFQ1RPUl9SRUFDVElPTlNfV0lER0VUID0gJy5hbnRlbm5hLXJlYWN0aW9ucy13aWRnZXQnO1xuXG52YXIgb3Blbkluc3RhbmNlcyA9IFtdO1xuXG5mdW5jdGlvbiBvcGVuUmVhY3Rpb25zV2lkZ2V0KG9wdGlvbnMsIGVsZW1lbnRPckNvb3Jkcykge1xuICAgIGNsb3NlQWxsV2luZG93cygpO1xuICAgIHZhciBkZWZhdWx0UmVhY3Rpb25zID0gb3B0aW9ucy5kZWZhdWx0UmVhY3Rpb25zO1xuICAgIHZhciByZWFjdGlvbnNEYXRhID0gb3B0aW9ucy5yZWFjdGlvbnNEYXRhO1xuICAgIHZhciBjb250YWluZXJEYXRhID0gb3B0aW9ucy5jb250YWluZXJEYXRhO1xuICAgIHZhciBjb250YWluZXJFbGVtZW50ID0gb3B0aW9ucy5jb250YWluZXJFbGVtZW50OyAvLyBvcHRpb25hbFxuICAgIHZhciBzdGFydFBhZ2UgPSBvcHRpb25zLnN0YXJ0UGFnZSB8fCBQQUdFX0FVVE87IC8vIG9wdGlvbmFsXG4gICAgdmFyIGlzU3VtbWFyeSA9IG9wdGlvbnMuaXNTdW1tYXJ5ID09PSB1bmRlZmluZWQgPyBmYWxzZSA6IG9wdGlvbnMuaXNTdW1tYXJ5OyAvLyBvcHRpb25hbFxuICAgIC8vIGNvbnRlbnREYXRhIGNvbnRhaW5zIGRldGFpbHMgYWJvdXQgdGhlIGNvbnRlbnQgYmVpbmcgcmVhY3RlZCB0byBsaWtlIHRleHQgcmFuZ2Ugb3IgaW1hZ2UgaGVpZ2h0L3dpZHRoLlxuICAgIC8vIHdlIHBvdGVudGlhbGx5IG1vZGlmeSB0aGlzIGRhdGEgKGUuZy4gaW4gdGhlIGRlZmF1bHQgcmVhY3Rpb24gY2FzZSB3ZSBzZWxlY3QgdGhlIHRleHQgb3Vyc2VsdmVzKSBzbyB3ZVxuICAgIC8vIG1ha2UgYSBsb2NhbCBjb3B5IG9mIGl0IHRvIGF2b2lkIHVuZXhwZWN0ZWRseSBjaGFuZ2luZyBkYXRhIG91dCBmcm9tIHVuZGVyIG9uZSBvZiB0aGUgY2xpZW50c1xuICAgIHZhciBjb250ZW50RGF0YSA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkob3B0aW9ucy5jb250ZW50RGF0YSkpO1xuICAgIHZhciBwYWdlRGF0YSA9IG9wdGlvbnMucGFnZURhdGE7XG4gICAgdmFyIGdyb3VwU2V0dGluZ3MgPSBvcHRpb25zLmdyb3VwU2V0dGluZ3M7XG4gICAgdmFyIHJhY3RpdmUgPSBSYWN0aXZlKHtcbiAgICAgICAgZWw6IFdpZGdldEJ1Y2tldC5nZXQoKSxcbiAgICAgICAgYXBwZW5kOiB0cnVlLFxuICAgICAgICBkYXRhOiB7fSxcbiAgICAgICAgdGVtcGxhdGU6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9yZWFjdGlvbnMtd2lkZ2V0Lmhicy5odG1sJyksXG4gICAgICAgIHBhcnRpYWxzOiB7XG4gICAgICAgICAgICBsb2dvOiBTVkdzLmxvZ29cbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmFjdGl2ZS5vbignY2xvc2UnLCBjbG9zZUFsbFdpbmRvd3MpO1xuICAgIG9wZW5JbnN0YW5jZXMucHVzaChyYWN0aXZlKTtcbiAgICB2YXIgJHJvb3RFbGVtZW50ID0gJChyb290RWxlbWVudChyYWN0aXZlKSk7XG4gICAgTW92ZWFibGUubWFrZU1vdmVhYmxlKCRyb290RWxlbWVudCwgJHJvb3RFbGVtZW50LmZpbmQoJy5hbnRlbm5hLWhlYWRlcicpKTtcbiAgICB2YXIgcGFnZXMgPSBbXTtcblxuICAgIG9wZW5XaW5kb3coKTtcblxuICAgIGZ1bmN0aW9uIG9wZW5XaW5kb3coKSB7XG4gICAgICAgIFBhZ2VEYXRhLmNsZWFySW5kaWNhdG9yTGltaXQocGFnZURhdGEpO1xuICAgICAgICB2YXIgY29vcmRzO1xuICAgICAgICBpZiAoZWxlbWVudE9yQ29vcmRzLnRvcCAmJiBlbGVtZW50T3JDb29yZHMubGVmdCkge1xuICAgICAgICAgICAgY29vcmRzID0gZWxlbWVudE9yQ29vcmRzO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyICRyZWxhdGl2ZUVsZW1lbnQgPSAkKGVsZW1lbnRPckNvb3Jkcyk7XG4gICAgICAgICAgICB2YXIgb2Zmc2V0ID0gJHJlbGF0aXZlRWxlbWVudC5vZmZzZXQoKTtcbiAgICAgICAgICAgIGNvb3JkcyA9IHtcbiAgICAgICAgICAgICAgICB0b3A6IG9mZnNldC50b3AsXG4gICAgICAgICAgICAgICAgbGVmdDogb2Zmc2V0LmxlZnRcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGhvcml6b250YWxPdmVyZmxvdyA9IGNvb3Jkcy5sZWZ0ICsgJHJvb3RFbGVtZW50LndpZHRoKCkgLSBNYXRoLm1heChkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50V2lkdGgsIHdpbmRvdy5pbm5lcldpZHRoIHx8IDApOyAvLyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzEyNDgwODEvZ2V0LXRoZS1icm93c2VyLXZpZXdwb3J0LWRpbWVuc2lvbnMtd2l0aC1qYXZhc2NyaXB0Lzg4NzYwNjkjODg3NjA2OVxuICAgICAgICBpZiAoaG9yaXpvbnRhbE92ZXJmbG93ID4gMCkge1xuICAgICAgICAgICAgY29vcmRzLmxlZnQgPSBjb29yZHMubGVmdCAtIGhvcml6b250YWxPdmVyZmxvdztcbiAgICAgICAgfVxuICAgICAgICAkcm9vdEVsZW1lbnQuc3RvcCh0cnVlLCB0cnVlKS5hZGRDbGFzcygnb3BlbicpLmNzcyhjb29yZHMpO1xuXG4gICAgICAgIHZhciBpc1Nob3dSZWFjdGlvbnMgPSBzdGFydFBhZ2UgPT09IFBBR0VfUkVBQ1RJT05TIHx8IChzdGFydFBhZ2UgPT09IFBBR0VfQVVUTyAmJiByZWFjdGlvbnNEYXRhLmxlbmd0aCA+IDApO1xuICAgICAgICBpZiAoaXNTaG93UmVhY3Rpb25zKSB7XG4gICAgICAgICAgICBzaG93UmVhY3Rpb25zKGZhbHNlKTtcbiAgICAgICAgfSBlbHNlIHsgLy8gc3RhcnRQYWdlID09PSBwYWdlRGVmYXVsdHMgfHwgdGhlcmUgYXJlIG5vIHJlYWN0aW9uc1xuICAgICAgICAgICAgc2hvd0RlZmF1bHRSZWFjdGlvbnNQYWdlKGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaXNTdW1tYXJ5KSB7XG4gICAgICAgICAgICBFdmVudHMucG9zdFN1bW1hcnlPcGVuZWQoaXNTaG93UmVhY3Rpb25zLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBFdmVudHMucG9zdFJlYWN0aW9uV2lkZ2V0T3BlbmVkKGlzU2hvd1JlYWN0aW9ucywgcGFnZURhdGEsIGNvbnRhaW5lckRhdGEsIGNvbnRlbnREYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHNldHVwV2luZG93Q2xvc2UocGFnZXMsIHJhY3RpdmUpO1xuICAgICAgICBwcmV2ZW50RXh0cmFTY3JvbGwoJHJvb3RFbGVtZW50KTtcbiAgICAgICAgb3Blbkluc3RhbmNlcy5wdXNoKHJhY3RpdmUpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNob3dSZWFjdGlvbnMoYW5pbWF0ZSwgcmV2ZXJzZSkge1xuICAgICAgICB2YXIgb3B0aW9ucyA9IHtcbiAgICAgICAgICAgIGlzU3VtbWFyeTogaXNTdW1tYXJ5LFxuICAgICAgICAgICAgcmVhY3Rpb25zRGF0YTogcmVhY3Rpb25zRGF0YSxcbiAgICAgICAgICAgIHBhZ2VEYXRhOiBwYWdlRGF0YSxcbiAgICAgICAgICAgIGdyb3VwU2V0dGluZ3M6IGdyb3VwU2V0dGluZ3MsXG4gICAgICAgICAgICBjb250YWluZXJEYXRhOiBjb250YWluZXJEYXRhLFxuICAgICAgICAgICAgY29udGFpbmVyRWxlbWVudDogY29udGFpbmVyRWxlbWVudCxcbiAgICAgICAgICAgIGNvbnRlbnREYXRhOiBjb250ZW50RGF0YSxcbiAgICAgICAgICAgIHNob3dDb25maXJtYXRpb246IHNob3dDb25maXJtYXRpb24sXG4gICAgICAgICAgICBzaG93RGVmYXVsdHM6IGZ1bmN0aW9uKCkgeyBzaG93RGVmYXVsdFJlYWN0aW9uc1BhZ2UodHJ1ZSkgfSxcbiAgICAgICAgICAgIHNob3dDb21tZW50czogc2hvd0NvbW1lbnRzLFxuICAgICAgICAgICAgc2hvd0xvY2F0aW9uczogc2hvd0xvY2F0aW9ucyxcbiAgICAgICAgICAgIGVsZW1lbnQ6IHBhZ2VDb250YWluZXIocmFjdGl2ZSksXG4gICAgICAgICAgICByZWFjdGlvbnNXaW5kb3c6ICRyb290RWxlbWVudFxuICAgICAgICB9O1xuICAgICAgICB2YXIgcGFnZSA9IFJlYWN0aW9uc1BhZ2UuY3JlYXRlKG9wdGlvbnMpO1xuICAgICAgICBwYWdlcy5wdXNoKHBhZ2UpO1xuICAgICAgICBpZiAocmV2ZXJzZSkge1xuICAgICAgICAgICAgZ29CYWNrVG9QYWdlKHBhZ2VzLCBwYWdlLnNlbGVjdG9yLCAkcm9vdEVsZW1lbnQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2hvd1BhZ2UocGFnZS5zZWxlY3RvciwgJHJvb3RFbGVtZW50LCBhbmltYXRlLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBiYWNrVG9SZWFjdGlvbnMoKSB7XG4gICAgICAgIHNldFdpbmRvd1RpdGxlKE1lc3NhZ2VzLmdldE1lc3NhZ2UoJ3JlYWN0aW9ucy13aWRnZXRfdGl0bGUnKSk7XG4gICAgICAgIHNob3dSZWFjdGlvbnModHJ1ZSwgdHJ1ZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2hvd0RlZmF1bHRSZWFjdGlvbnNQYWdlKGFuaW1hdGUpIHtcbiAgICAgICAgaWYgKGNvbnRhaW5lckVsZW1lbnQgJiYgIWNvbnRlbnREYXRhLmxvY2F0aW9uICYmICFjb250ZW50RGF0YS5ib2R5KSB7XG4gICAgICAgICAgICBSYW5nZS5ncmFiTm9kZShjb250YWluZXJFbGVtZW50LmdldCgwKSwgZnVuY3Rpb24gKHRleHQsIGxvY2F0aW9uKSB7XG4gICAgICAgICAgICAgICAgY29udGVudERhdGEubG9jYXRpb24gPSBsb2NhdGlvbjtcbiAgICAgICAgICAgICAgICBjb250ZW50RGF0YS5ib2R5ID0gdGV4dDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHZhciBvcHRpb25zID0geyAvLyBUT0RPOiBjbGVhbiB1cCB0aGUgbnVtYmVyIG9mIHRoZXNlIFwib3B0aW9uc1wiIG9iamVjdHMgdGhhdCB3ZSBjcmVhdGUuXG4gICAgICAgICAgICBkZWZhdWx0UmVhY3Rpb25zOiBkZWZhdWx0UmVhY3Rpb25zLFxuICAgICAgICAgICAgcGFnZURhdGE6IHBhZ2VEYXRhLFxuICAgICAgICAgICAgZ3JvdXBTZXR0aW5nczogZ3JvdXBTZXR0aW5ncyxcbiAgICAgICAgICAgIGNvbnRhaW5lckRhdGE6IGNvbnRhaW5lckRhdGEsXG4gICAgICAgICAgICBjb250ZW50RGF0YTogY29udGVudERhdGEsXG4gICAgICAgICAgICBzaG93Q29uZmlybWF0aW9uOiBzaG93Q29uZmlybWF0aW9uLFxuICAgICAgICAgICAgZWxlbWVudDogcGFnZUNvbnRhaW5lcihyYWN0aXZlKSxcbiAgICAgICAgICAgIHJlYWN0aW9uc1dpbmRvdzogJHJvb3RFbGVtZW50XG4gICAgICAgIH07XG4gICAgICAgIHZhciBwYWdlID0gRGVmYXVsdHNQYWdlLmNyZWF0ZShvcHRpb25zKTtcbiAgICAgICAgcGFnZXMucHVzaChwYWdlKTtcbiAgICAgICAgc2hvd1BhZ2UocGFnZS5zZWxlY3RvciwgJHJvb3RFbGVtZW50LCBhbmltYXRlKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzaG93Q29uZmlybWF0aW9uKHJlYWN0aW9uRGF0YSwgcmVhY3Rpb25Qcm92aWRlcikge1xuICAgICAgICBzZXRXaW5kb3dUaXRsZShNZXNzYWdlcy5nZXRNZXNzYWdlKCdyZWFjdGlvbnMtd2lkZ2V0X3RpdGxlX3RoYW5rcycpKTtcbiAgICAgICAgdmFyIHBhZ2UgPSBDb25maXJtYXRpb25QYWdlLmNyZWF0ZShyZWFjdGlvbkRhdGEudGV4dCwgcmVhY3Rpb25Qcm92aWRlciwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MsIHBhZ2VDb250YWluZXIocmFjdGl2ZSkpO1xuICAgICAgICBwYWdlcy5wdXNoKHBhZ2UpO1xuXG4gICAgICAgIC8vIFRPRE86IHJldmlzaXQgd2h5IHdlIG5lZWQgdG8gdXNlIHRoZSB0aW1lb3V0IHRyaWNrIGZvciB0aGUgY29uZmlybSBwYWdlLCBidXQgbm90IGZvciB0aGUgZGVmYXVsdHMgcGFnZVxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyAvLyBJbiBvcmRlciBmb3IgdGhlIHBvc2l0aW9uaW5nIGFuaW1hdGlvbiB0byB3b3JrLCB3ZSBuZWVkIHRvIGxldCB0aGUgYnJvd3NlciByZW5kZXIgdGhlIGFwcGVuZGVkIERPTSBlbGVtZW50XG4gICAgICAgICAgICBzaG93UGFnZShwYWdlLnNlbGVjdG9yLCAkcm9vdEVsZW1lbnQsIHRydWUpO1xuICAgICAgICB9LCAxKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzaG93UHJvZ3Jlc3NQYWdlKCkge1xuICAgICAgICBzaG93UGFnZSgnLmFudGVubmEtcHJvZ3Jlc3MtcGFnZScsICRyb290RWxlbWVudCwgZmFsc2UsIHRydWUpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNob3dDb21tZW50cyhyZWFjdGlvbikge1xuICAgICAgICBzaG93UHJvZ3Jlc3NQYWdlKCk7IC8vIFRPRE86IHByb3ZpZGUgc29tZSB3YXkgZm9yIHRoZSB1c2VyIHRvIGdpdmUgdXAgLyBjYW5jZWwuIEFsc28sIGhhbmRsZSBlcnJvcnMgZmV0Y2hpbmcgY29tbWVudHMuXG4gICAgICAgIEFqYXhDbGllbnQuZ2V0Q29tbWVudHMocmVhY3Rpb24sIGZ1bmN0aW9uKGNvbW1lbnRzKSB7XG4gICAgICAgICAgICB2YXIgb3B0aW9ucyA9IHtcbiAgICAgICAgICAgICAgICByZWFjdGlvbjogcmVhY3Rpb24sXG4gICAgICAgICAgICAgICAgY29tbWVudHM6IGNvbW1lbnRzLFxuICAgICAgICAgICAgICAgIGVsZW1lbnQ6IHBhZ2VDb250YWluZXIocmFjdGl2ZSksXG4gICAgICAgICAgICAgICAgZ29CYWNrOiBiYWNrVG9SZWFjdGlvbnMsXG4gICAgICAgICAgICAgICAgY29udGFpbmVyRGF0YTogY29udGFpbmVyRGF0YSxcbiAgICAgICAgICAgICAgICBwYWdlRGF0YTogcGFnZURhdGEsXG4gICAgICAgICAgICAgICAgZ3JvdXBTZXR0aW5nczogZ3JvdXBTZXR0aW5nc1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHZhciBwYWdlID0gQ29tbWVudHNQYWdlLmNyZWF0ZShvcHRpb25zKTtcbiAgICAgICAgICAgIHBhZ2VzLnB1c2gocGFnZSk7XG5cbiAgICAgICAgICAgIC8vIFRPRE86IHJldmlzaXRcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IC8vIEluIG9yZGVyIGZvciB0aGUgcG9zaXRpb25pbmcgYW5pbWF0aW9uIHRvIHdvcmssIHdlIG5lZWQgdG8gbGV0IHRoZSBicm93c2VyIHJlbmRlciB0aGUgYXBwZW5kZWQgRE9NIGVsZW1lbnRcbiAgICAgICAgICAgICAgICBzaG93UGFnZShwYWdlLnNlbGVjdG9yLCAkcm9vdEVsZW1lbnQsIHRydWUpO1xuICAgICAgICAgICAgfSwgMSk7XG5cbiAgICAgICAgICAgIEV2ZW50cy5wb3N0Q29tbWVudHNWaWV3ZWQocGFnZURhdGEsIGNvbnRhaW5lckRhdGEsIHJlYWN0aW9uLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2hvd0xvY2F0aW9ucyhyZWFjdGlvbikge1xuICAgICAgICBzaG93UHJvZ3Jlc3NQYWdlKCk7IC8vIFRPRE86IHByb3ZpZGUgc29tZSB3YXkgZm9yIHRoZSB1c2VyIHRvIGdpdmUgdXAgLyBjYW5jZWwuIEFsc28sIGhhbmRsZSBlcnJvcnMgZmV0Y2hpbmcgY29tbWVudHMuXG4gICAgICAgIHZhciByZWFjdGlvbkxvY2F0aW9uRGF0YSA9IFBhZ2VEYXRhLmdldFJlYWN0aW9uTG9jYXRpb25EYXRhKHJlYWN0aW9uLCBwYWdlRGF0YSk7XG4gICAgICAgIEFqYXhDbGllbnQuZmV0Y2hMb2NhdGlvbkRldGFpbHMocmVhY3Rpb25Mb2NhdGlvbkRhdGEsIHBhZ2VEYXRhLCBmdW5jdGlvbihsb2NhdGlvbkRldGFpbHMpIHtcbiAgICAgICAgICAgIFBhZ2VEYXRhLnVwZGF0ZVJlYWN0aW9uTG9jYXRpb25EYXRhKHJlYWN0aW9uTG9jYXRpb25EYXRhLCBsb2NhdGlvbkRldGFpbHMpO1xuICAgICAgICAgICAgdmFyIG9wdGlvbnMgPSB7IC8vIFRPRE86IGNsZWFuIHVwIHRoZSBudW1iZXIgb2YgdGhlc2UgXCJvcHRpb25zXCIgb2JqZWN0cyB0aGF0IHdlIGNyZWF0ZS5cbiAgICAgICAgICAgICAgICBlbGVtZW50OiBwYWdlQ29udGFpbmVyKHJhY3RpdmUpLFxuICAgICAgICAgICAgICAgIHJlYWN0aW9uTG9jYXRpb25EYXRhOiByZWFjdGlvbkxvY2F0aW9uRGF0YSxcbiAgICAgICAgICAgICAgICBwYWdlRGF0YTogcGFnZURhdGEsXG4gICAgICAgICAgICAgICAgZ3JvdXBTZXR0aW5nczogZ3JvdXBTZXR0aW5ncyxcbiAgICAgICAgICAgICAgICBjbG9zZVdpbmRvdzogY2xvc2VBbGxXaW5kb3dzLFxuICAgICAgICAgICAgICAgIGdvQmFjazogYmFja1RvUmVhY3Rpb25zXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdmFyIHBhZ2UgPSBMb2NhdGlvbnNQYWdlLmNyZWF0ZShvcHRpb25zKTtcbiAgICAgICAgICAgIHBhZ2VzLnB1c2gocGFnZSk7XG4gICAgICAgICAgICBzZXRXaW5kb3dUaXRsZShyZWFjdGlvbi50ZXh0KTtcbiAgICAgICAgICAgIC8vIFRPRE86IHJldmlzaXRcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IC8vIEluIG9yZGVyIGZvciB0aGUgcG9zaXRpb25pbmcgYW5pbWF0aW9uIHRvIHdvcmssIHdlIG5lZWQgdG8gbGV0IHRoZSBicm93c2VyIHJlbmRlciB0aGUgYXBwZW5kZWQgRE9NIGVsZW1lbnRcbiAgICAgICAgICAgICAgICBzaG93UGFnZShwYWdlLnNlbGVjdG9yLCAkcm9vdEVsZW1lbnQsIHRydWUpO1xuICAgICAgICAgICAgfSwgMSk7XG4gICAgICAgICAgICBFdmVudHMucG9zdExvY2F0aW9uc1ZpZXdlZChwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNldFdpbmRvd1RpdGxlKHRpdGxlKSB7XG4gICAgICAgICQocmFjdGl2ZS5maW5kKCcuYW50ZW5uYS1yZWFjdGlvbnMtdGl0bGUnKSkuaHRtbCh0aXRsZSk7XG4gICAgfVxuXG59XG5cbmZ1bmN0aW9uIHJvb3RFbGVtZW50KHJhY3RpdmUpIHtcbiAgICByZXR1cm4gcmFjdGl2ZS5maW5kKFNFTEVDVE9SX1JFQUNUSU9OU19XSURHRVQpO1xufVxuXG5mdW5jdGlvbiBwYWdlQ29udGFpbmVyKHJhY3RpdmUpIHtcbiAgICByZXR1cm4gcmFjdGl2ZS5maW5kKCcuYW50ZW5uYS1wYWdlLWNvbnRhaW5lcicpO1xufVxuXG52YXIgcGFnZVogPSAxMDAwOyAvLyBJdCdzIHNhZmUgZm9yIHRoaXMgdmFsdWUgdG8gZ28gYWNyb3NzIGluc3RhbmNlcy4gV2UganVzdCBuZWVkIGl0IHRvIGNvbnRpbnVvdXNseSBpbmNyZWFzZSAobWF4IHZhbHVlIGlzIG92ZXIgMiBiaWxsaW9uKS5cblxuZnVuY3Rpb24gc2hvd1BhZ2UocGFnZVNlbGVjdG9yLCAkcm9vdEVsZW1lbnQsIGFuaW1hdGUsIG92ZXJsYXkpIHtcbiAgICB2YXIgJHBhZ2UgPSAkcm9vdEVsZW1lbnQuZmluZChwYWdlU2VsZWN0b3IpO1xuICAgICRwYWdlLmNzcygnei1pbmRleCcsIHBhZ2VaKTtcbiAgICBwYWdlWiArPSAxO1xuXG4gICAgJHBhZ2UudG9nZ2xlQ2xhc3MoJ2FudGVubmEtcGFnZS1hbmltYXRlJywgYW5pbWF0ZSk7XG5cbiAgICBpZiAob3ZlcmxheSkge1xuICAgICAgICAvLyBJbiB0aGUgb3ZlcmxheSBjYXNlLCBzaXplIHRoZSBwYWdlIHRvIG1hdGNoIHdoYXRldmVyIHBhZ2UgaXMgY3VycmVudGx5IHNob3dpbmcgYW5kIHRoZW4gbWFrZSBpdCBhY3RpdmUgKHRoZXJlIHdpbGwgYmUgdHdvICdhY3RpdmUnIHBhZ2VzKVxuICAgICAgICB2YXIgJGN1cnJlbnQgPSAkcm9vdEVsZW1lbnQuZmluZCgnLmFudGVubmEtcGFnZS1hY3RpdmUnKTtcbiAgICAgICAgJHBhZ2UuaGVpZ2h0KCRjdXJyZW50LmhlaWdodCgpKTtcbiAgICAgICAgJHBhZ2UuYWRkQ2xhc3MoJ2FudGVubmEtcGFnZS1hY3RpdmUnKTtcbiAgICB9IGVsc2UgaWYgKGFuaW1hdGUpIHtcbiAgICAgICAgVHJhbnNpdGlvblV0aWwudG9nZ2xlQ2xhc3MoJHBhZ2UsICdhbnRlbm5hLXBhZ2UtYWN0aXZlJywgdHJ1ZSwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAvLyBBZnRlciB0aGUgbmV3IHBhZ2Ugc2xpZGVzIGludG8gcG9zaXRpb24sIG1vdmUgdGhlIG90aGVyIHBhZ2VzIGJhY2sgb3V0IG9mIHRoZSB2aWV3YWJsZSBhcmVhXG4gICAgICAgICAgICAkcm9vdEVsZW1lbnQuZmluZCgnLmFudGVubmEtcGFnZScpLm5vdChwYWdlU2VsZWN0b3IpLnJlbW92ZUNsYXNzKCdhbnRlbm5hLXBhZ2UtYWN0aXZlJyk7XG4gICAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICAgICRwYWdlLmFkZENsYXNzKCdhbnRlbm5hLXBhZ2UtYWN0aXZlJyk7XG4gICAgICAgICRyb290RWxlbWVudC5maW5kKCcuYW50ZW5uYS1wYWdlJykubm90KHBhZ2VTZWxlY3RvcikucmVtb3ZlQ2xhc3MoJ2FudGVubmEtcGFnZS1hY3RpdmUnKTtcbiAgICB9XG4gICAgc2l6ZUJvZHlUb0ZpdCgkcm9vdEVsZW1lbnQsICRwYWdlLCBhbmltYXRlKTtcbn1cblxuZnVuY3Rpb24gZ29CYWNrVG9QYWdlKHBhZ2VzLCBwYWdlU2VsZWN0b3IsICRyb290RWxlbWVudCkge1xuICAgIHZhciAkdGFyZ2V0UGFnZSA9ICRyb290RWxlbWVudC5maW5kKHBhZ2VTZWxlY3Rvcik7XG4gICAgdmFyICRjdXJyZW50UGFnZSA9ICRyb290RWxlbWVudC5maW5kKCcuYW50ZW5uYS1wYWdlLWFjdGl2ZScpO1xuICAgIC8vIE1vdmUgdGhlIHRhcmdldCBwYWdlIGludG8gcGxhY2UsIHVuZGVyIHRoZSBjdXJyZW50IHBhZ2VcbiAgICAkdGFyZ2V0UGFnZS5jc3MoJ3otaW5kZXgnLCBwYXJzZUludCgkY3VycmVudFBhZ2UuY3NzKCd6LWluZGV4JykpIC0gMSk7XG4gICAgJHRhcmdldFBhZ2UudG9nZ2xlQ2xhc3MoJ2FudGVubmEtcGFnZS1hbmltYXRlJywgZmFsc2UpO1xuICAgICR0YXJnZXRQYWdlLnRvZ2dsZUNsYXNzKCdhbnRlbm5hLXBhZ2UtYWN0aXZlJywgdHJ1ZSk7XG5cbiAgICAvLyBUaGVuIGFuaW1hdGUgdGhlIGN1cnJlbnQgcGFnZSBtb3ZpbmcgYXdheSB0byByZXZlYWwgdGhlIHRhcmdldC5cbiAgICAkY3VycmVudFBhZ2UudG9nZ2xlQ2xhc3MoJ2FudGVubmEtcGFnZS1hbmltYXRlJywgdHJ1ZSk7XG4gICAgVHJhbnNpdGlvblV0aWwudG9nZ2xlQ2xhc3MoJGN1cnJlbnRQYWdlLCAnYW50ZW5uYS1wYWdlLWFjdGl2ZScsIGZhbHNlLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8vIEFmdGVyIHRoZSBjdXJyZW50IHBhZ2Ugc2xpZGVzIGludG8gcG9zaXRpb24sIG1vdmUgYWxsIG90aGVyIHBhZ2VzIGJhY2sgb3V0IG9mIHRoZSB2aWV3YWJsZSBhcmVhXG4gICAgICAgICRyb290RWxlbWVudC5maW5kKCcuYW50ZW5uYS1wYWdlJykubm90KHBhZ2VTZWxlY3RvcikucmVtb3ZlQ2xhc3MoJ2FudGVubmEtcGFnZS1hY3RpdmUnKTtcbiAgICAgICAgJHRhcmdldFBhZ2UuY3NzKCd6LWluZGV4JywgcGFnZVorKyk7IC8vIFdoZW4gdGhlIGFuaW1hdGlvbiBpcyBkb25lLCBtYWtlIHN1cmUgdGhlIGN1cnJlbnQgcGFnZSBoYXMgdGhlIGhpZ2hlc3Qgei1pbmRleCAoanVzdCBmb3IgY29uc2lzdGVuY3kpXG4gICAgICAgIC8vIFRlYXJkb3duIGFsbCBvdGhlciBwYWdlcy4gVGhleSdsbCBiZSByZS1jcmVhdGVkIGlmIG5lY2Vzc2FyeS5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYWdlcy5sZW5ndGggLSAxOyBpKyspIHtcbiAgICAgICAgICAgIHBhZ2VzW2ldLnRlYXJkb3duKCk7XG4gICAgICAgIH1cbiAgICAgICAgcGFnZXMuc3BsaWNlKDAsIHBhZ2VzLmxlbmd0aCAtIDEpO1xuICAgIH0pO1xuICAgIHNpemVCb2R5VG9GaXQoJHJvb3RFbGVtZW50LCAkdGFyZ2V0UGFnZSwgdHJ1ZSk7XG59XG5cbmZ1bmN0aW9uIHNpemVCb2R5VG9GaXQoJHJvb3RFbGVtZW50LCAkcGFnZSwgYW5pbWF0ZSkge1xuICAgIHZhciAkcGFnZUNvbnRhaW5lciA9ICRyb290RWxlbWVudC5maW5kKCcuYW50ZW5uYS1wYWdlLWNvbnRhaW5lcicpO1xuICAgIHZhciAkYm9keSA9ICRwYWdlLmZpbmQoJy5hbnRlbm5hLWJvZHknKTtcbiAgICB2YXIgY3VycmVudEhlaWdodCA9ICRwYWdlQ29udGFpbmVyLmNzcygnaGVpZ2h0Jyk7XG4gICAgJHBhZ2VDb250YWluZXIuY3NzKHsgaGVpZ2h0OiAnJyB9KTsgLy8gQ2xlYXIgYW55IHByZXZpb3VzbHkgY29tcHV0ZWQgaGVpZ2h0IHNvIHdlIGdldCBhIGZyZXNoIGNvbXB1dGF0aW9uIG9mIHRoZSBjaGlsZCBoZWlnaHRzXG4gICAgdmFyIG5ld0JvZHlIZWlnaHQgPSBNYXRoLm1pbigzMDAsICRib2R5LmdldCgwKS5zY3JvbGxIZWlnaHQpO1xuICAgICRib2R5LmNzcyh7IGhlaWdodDogbmV3Qm9keUhlaWdodCB9KTsgLy8gVE9ETzogZG91YmxlLWNoZWNrIHRoYXQgd2UgY2FuJ3QganVzdCBzZXQgYSBtYXgtaGVpZ2h0IG9mIDMwMHB4IG9uIHRoZSBib2R5LlxuICAgIHZhciBmb290ZXJIZWlnaHQgPSAkcGFnZS5maW5kKCcuYW50ZW5uYS1mb290ZXInKS5vdXRlckhlaWdodCgpOyAvLyByZXR1cm5zICdudWxsJyBpZiB0aGVyZSdzIG5vIGZvb3Rlci4gYWRkZWQgdG8gYW4gaW50ZWdlciwgJ251bGwnIGFjdHMgbGlrZSAwXG4gICAgdmFyIG5ld1BhZ2VIZWlnaHQgPSBuZXdCb2R5SGVpZ2h0ICsgZm9vdGVySGVpZ2h0O1xuICAgIGlmIChhbmltYXRlKSB7XG4gICAgICAgICRwYWdlQ29udGFpbmVyLmNzcyh7IGhlaWdodDogY3VycmVudEhlaWdodCB9KTtcbiAgICAgICAgJHBhZ2VDb250YWluZXIuYW5pbWF0ZSh7IGhlaWdodDogbmV3UGFnZUhlaWdodCB9LCAyMDApO1xuICAgIH0gZWxzZSB7XG4gICAgICAgICRwYWdlQ29udGFpbmVyLmNzcyh7IGhlaWdodDogbmV3UGFnZUhlaWdodCB9KTtcbiAgICB9XG4gICAgLy8gVE9ETzogd2UgbWlnaHQgbm90IG5lZWQgd2lkdGggcmVzaXppbmcgYXQgYWxsLlxuICAgIHZhciBtaW5XaWR0aCA9ICRwYWdlLmNzcygnbWluLXdpZHRoJyk7XG4gICAgdmFyIHdpZHRoID0gcGFyc2VJbnQobWluV2lkdGgpO1xuICAgIGlmICh3aWR0aCA+IDApIHtcbiAgICAgICAgaWYgKGFuaW1hdGUpIHtcbiAgICAgICAgICAgICRyb290RWxlbWVudC5hbmltYXRlKHsgd2lkdGg6IHdpZHRoIH0sIDIwMCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkcm9vdEVsZW1lbnQuY3NzKHsgd2lkdGg6IHdpZHRoIH0pO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBzZXR1cFdpbmRvd0Nsb3NlKHBhZ2VzLCByYWN0aXZlKSB7XG4gICAgdmFyICRyb290RWxlbWVudCA9ICQocm9vdEVsZW1lbnQocmFjdGl2ZSkpO1xuXG4gICAgLy8gVE9ETzogSWYgeW91IG1vdXNlIG92ZXIgdGhlIHRyaWdnZXIgc2xvd2x5IGZyb20gdGhlIHRvcCBsZWZ0LCB0aGUgd2luZG93IG9wZW5zIHdpdGhvdXQgYmVpbmcgdW5kZXIgdGhlIGN1cnNvcixcbiAgICAvLyAgICAgICBzbyBubyBtb3VzZW91dCBldmVudCBpcyByZWNlaXZlZC4gV2hlbiB3ZSBvcGVuIHRoZSB3aW5kb3csIHdlIHNob3VsZCBwcm9iYWJseSBqdXN0IHNjb290IGl0IHVwIHNsaWdodGx5XG4gICAgLy8gICAgICAgaWYgbmVlZGVkIHRvIGFzc3VyZSB0aGF0IGl0J3MgdW5kZXIgdGhlIGN1cnNvci4gQWx0ZXJuYXRpdmVseSwgd2UgY291bGQgYWRqdXN0IHRoZSBtb3VzZW92ZXIgYXJlYSB0byBtYXRjaFxuICAgIC8vICAgICAgIHRoZSByZWdpb24gdGhhdCB0aGUgd2luZG93IG9wZW5zLlxuICAgICRyb290RWxlbWVudFxuICAgICAgICAub24oJ21vdXNlb3V0LmFudGVubmEnLCBkZWxheWVkQ2xvc2VXaW5kb3cpXG4gICAgICAgIC5vbignbW91c2VvdmVyLmFudGVubmEnLCBrZWVwV2luZG93T3BlbilcbiAgICAgICAgLm9uKCdmb2N1c2luLmFudGVubmEnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIE9uY2UgdGhlIHdpbmRvdyBoYXMgZm9jdXMsIGRvbid0IGNsb3NlIGl0IG9uIG1vdXNlb3V0LlxuICAgICAgICAgICAga2VlcFdpbmRvd09wZW4oKTtcbiAgICAgICAgICAgICRyb290RWxlbWVudC5vZmYoJ21vdXNlb3V0LmFudGVubmEnKTtcbiAgICAgICAgICAgICRyb290RWxlbWVudC5vZmYoJ21vdXNlb3Zlci5hbnRlbm5hJyk7XG4gICAgICAgIH0pO1xuICAgICQoZG9jdW1lbnQpLm9uKCdjbGljay5hbnRlbm5hJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgaWYgKCQoZXZlbnQudGFyZ2V0KS5jbG9zZXN0KFNFTEVDVE9SX1JFQUNUSU9OU19XSURHRVQpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgY2xvc2VBbGxXaW5kb3dzKCk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICB2YXIgdGFwTGlzdGVuZXIgPSBUb3VjaFN1cHBvcnQuc2V0dXBUYXAoZG9jdW1lbnQsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGlmICgkKGV2ZW50LnRhcmdldCkuY2xvc2VzdChTRUxFQ1RPUl9SRUFDVElPTlNfV0lER0VUKS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBjbG9zZUFsbFdpbmRvd3MoKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgdmFyIGNsb3NlVGltZXI7XG5cbiAgICBmdW5jdGlvbiBkZWxheWVkQ2xvc2VXaW5kb3coKSB7XG4gICAgICAgIGNsb3NlVGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY2xvc2VUaW1lciA9IG51bGw7XG4gICAgICAgICAgICBjbG9zZUFsbFdpbmRvd3MoKTtcbiAgICAgICAgfSwgNTAwKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBrZWVwV2luZG93T3BlbigpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KGNsb3NlVGltZXIpO1xuICAgIH1cblxuICAgIHJhY3RpdmUub24oJ2ludGVybmFsQ2xvc2VXaW5kb3cnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gQ2xvc2VzIG9uZSBwYXJ0aWN1bGFyIHJlYWN0aW9uIHdpbmRvdy4gVGhpcyBmdW5jdGlvbiBzaG91bGQgb25seSBiZSBjYWxsZWQgZnJvbSBjbG9zZUFsbFdpbmRvd3MsIHdoaWNoIGFsc29cbiAgICAgICAgLy8gY2xlYW5zIHVwIHRoZSBoYW5kbGVzIHdlIG1haW50YWluIHRvIGFsbCB3aW5kb3dzLlxuICAgICAgICBjbGVhclRpbWVvdXQoY2xvc2VUaW1lcik7XG5cbiAgICAgICAgJHJvb3RFbGVtZW50LnN0b3AodHJ1ZSwgdHJ1ZSkuZmFkZU91dCgnZmFzdCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgJHJvb3RFbGVtZW50LmNzcygnZGlzcGxheScsICcnKTsgLy8gQ2xlYXIgdGhlIGRpc3BsYXk6bm9uZSB0aGF0IGZhZGVPdXQgcHV0cyBvbiB0aGUgZWxlbWVudFxuICAgICAgICAgICAgJHJvb3RFbGVtZW50LnJlbW92ZUNsYXNzKCdvcGVuJyk7XG4gICAgICAgIH0pO1xuICAgICAgICAkcm9vdEVsZW1lbnQub2ZmKCcuYW50ZW5uYScpOyAvLyBVbmJpbmQgYWxsIG9mIHRoZSBoYW5kbGVycyBpbiBvdXIgbmFtZXNwYWNlXG4gICAgICAgICQoZG9jdW1lbnQpLm9mZignY2xpY2suYW50ZW5uYScpO1xuICAgICAgICB0YXBMaXN0ZW5lci50ZWFyZG93bigpO1xuICAgICAgICBSYW5nZS5jbGVhckhpZ2hsaWdodHMoKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYWdlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgcGFnZXNbaV0udGVhcmRvd24oKTtcbiAgICAgICAgfVxuICAgICAgICByYWN0aXZlLnRlYXJkb3duKCk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGNsb3NlQWxsV2luZG93cygpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG9wZW5JbnN0YW5jZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgb3Blbkluc3RhbmNlc1tpXS5maXJlKCdpbnRlcm5hbENsb3NlV2luZG93Jyk7XG4gICAgfVxuICAgIG9wZW5JbnN0YW5jZXMgPSBbXTtcbn1cblxuZnVuY3Rpb24gaXNPcGVuV2luZG93KCkge1xuICAgIHJldHVybiBvcGVuSW5zdGFuY2VzLmxlbmd0aCA+IDA7XG59XG5cbi8vIFByZXZlbnQgc2Nyb2xsaW5nIG9mIHRoZSBkb2N1bWVudCBhZnRlciB3ZSBzY3JvbGwgdG8gdGhlIHRvcC9ib3R0b20gb2YgdGhlIHJlYWN0aW9ucyB3aW5kb3dcbi8vIENvZGUgY29waWVkIGZyb206IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvNTgwMjQ2Ny9wcmV2ZW50LXNjcm9sbGluZy1vZi1wYXJlbnQtZWxlbWVudFxuLy8gVE9ETzogZG9lcyB0aGlzIHdvcmsgb24gbW9iaWxlP1xuZnVuY3Rpb24gcHJldmVudEV4dHJhU2Nyb2xsKCRyb290RWxlbWVudCkge1xuICAgICRyb290RWxlbWVudC5vbignRE9NTW91c2VTY3JvbGwuYW50ZW5uYSBtb3VzZXdoZWVsLmFudGVubmEnLCAnLmFudGVubmEtYm9keScsIGZ1bmN0aW9uKGV2KSB7XG4gICAgICAgIHZhciAkdGhpcyA9ICQodGhpcyksXG4gICAgICAgICAgICBzY3JvbGxUb3AgPSB0aGlzLnNjcm9sbFRvcCxcbiAgICAgICAgICAgIHNjcm9sbEhlaWdodCA9IHRoaXMuc2Nyb2xsSGVpZ2h0LFxuICAgICAgICAgICAgaGVpZ2h0ID0gJHRoaXMuaGVpZ2h0KCksXG4gICAgICAgICAgICBkZWx0YSA9IChldi50eXBlID09ICdET01Nb3VzZVNjcm9sbCcgP1xuICAgICAgICAgICAgICAgIGV2Lm9yaWdpbmFsRXZlbnQuZGV0YWlsICogLTQwIDpcbiAgICAgICAgICAgICAgICBldi5vcmlnaW5hbEV2ZW50LndoZWVsRGVsdGEpLFxuICAgICAgICAgICAgdXAgPSBkZWx0YSA+IDA7XG5cbiAgICAgICAgaWYgKHNjcm9sbEhlaWdodCA8PSBoZWlnaHQpIHtcbiAgICAgICAgICAgIC8vIFRoaXMgaXMgYW4gYWRkaXRpb24gdG8gdGhlIFN0YWNrT3ZlcmZsb3cgY29kZSwgdG8gbWFrZSBzdXJlIHRoZSBwYWdlIHNjcm9sbHMgYXMgdXN1YWwgaWYgdGhlIHdpbmRvd1xuICAgICAgICAgICAgLy8gY29udGVudCBkb2Vzbid0IHNjcm9sbC5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBwcmV2ZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBldi5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBldi5yZXR1cm5WYWx1ZSA9IGZhbHNlO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9O1xuXG4gICAgICAgIGlmICghdXAgJiYgLWRlbHRhID4gc2Nyb2xsSGVpZ2h0IC0gaGVpZ2h0IC0gc2Nyb2xsVG9wKSB7XG4gICAgICAgICAgICAvLyBTY3JvbGxpbmcgZG93biwgYnV0IHRoaXMgd2lsbCB0YWtlIHVzIHBhc3QgdGhlIGJvdHRvbS5cbiAgICAgICAgICAgICR0aGlzLnNjcm9sbFRvcChzY3JvbGxIZWlnaHQpO1xuICAgICAgICAgICAgcmV0dXJuIHByZXZlbnQoKTtcbiAgICAgICAgfSBlbHNlIGlmICh1cCAmJiBkZWx0YSA+IHNjcm9sbFRvcCkge1xuICAgICAgICAgICAgLy8gU2Nyb2xsaW5nIHVwLCBidXQgdGhpcyB3aWxsIHRha2UgdXMgcGFzdCB0aGUgdG9wLlxuICAgICAgICAgICAgJHRoaXMuc2Nyb2xsVG9wKDApO1xuICAgICAgICAgICAgcmV0dXJuIHByZXZlbnQoKTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgb3Blbjogb3BlblJlYWN0aW9uc1dpZGdldCxcbiAgICBpc09wZW46IGlzT3BlbldpbmRvdyxcbiAgICBQQUdFX1JFQUNUSU9OUzogUEFHRV9SRUFDVElPTlMsXG4gICAgUEFHRV9ERUZBVUxUUzogUEFHRV9ERUZBVUxUUyxcbiAgICBQQUdFX0FVVE86IFBBR0VfQVVUTyxcbiAgICBzZWxlY3RvcjogU0VMRUNUT1JfUkVBQ1RJT05TX1dJREdFVFxufTsiLCJ2YXIgUmFjdGl2ZVByb3ZpZGVyID0gcmVxdWlyZSgnLi91dGlscy9yYWN0aXZlLXByb3ZpZGVyJyk7XG52YXIgUmFuZ3lQcm92aWRlciA9IHJlcXVpcmUoJy4vdXRpbHMvcmFuZ3ktcHJvdmlkZXInKTtcbnZhciBKUXVlcnlQcm92aWRlciA9IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJyk7XG52YXIgQXBwTW9kZSA9IHJlcXVpcmUoJy4vdXRpbHMvYXBwLW1vZGUnKTtcbnZhciBVUkxDb25zdGFudHMgPSByZXF1aXJlKCcuL3V0aWxzL3VybC1jb25zdGFudHMnKTtcblxudmFyIGJhc2VVcmw7XG5pZiAoQXBwTW9kZS50ZXN0KSB7XG4gICAgYmFzZVVybCA9IFVSTENvbnN0YW50cy5URVNUO1xufSBlbHNlIGlmIChBcHBNb2RlLm9mZmxpbmUpIHtcbiAgICBiYXNlVXJsID0gVVJMQ29uc3RhbnRzLkRFVkVMT1BNRU5UO1xufSBlbHNlIHtcbiAgICBiYXNlVXJsID0gVVJMQ29uc3RhbnRzLlBST0RVQ1RJT047XG59XG5cbnZhciBzY3JpcHRzID0gW1xuICAgIHtzcmM6ICcvL2NkbmpzLmNsb3VkZmxhcmUuY29tL2FqYXgvbGlicy9qcXVlcnkvMi4xLjQvanF1ZXJ5Lm1pbi5qcycsIGNhbGxiYWNrOiBKUXVlcnlQcm92aWRlci5sb2FkZWR9LFxuICAgIHtzcmM6IGJhc2VVcmwgKyAnL3N0YXRpYy9qcy9jZG4vcmFjdGl2ZS8wLjcuMy9yYWN0aXZlLnJ1bnRpbWUuanMnLCBjYWxsYmFjazogUmFjdGl2ZVByb3ZpZGVyLmxvYWRlZCwgYWJvdXRUb0xvYWQ6IFJhY3RpdmVQcm92aWRlci5hYm91dFRvTG9hZH0sXG4gICAge3NyYzogYmFzZVVybCArICcvc3RhdGljL3dpZGdldC1uZXcvbGliL3Jhbmd5LWNvbXBpbGVkLmpzJywgY2FsbGJhY2s6IFJhbmd5UHJvdmlkZXIubG9hZGVkLCBhYm91dFRvTG9hZDogUmFuZ3lQcm92aWRlci5hYm91dFRvTG9hZH0gLy8gVE9ETyBtaW5pZnkgYW5kIGhvc3QgdGhpcyBzb21ld2hlcmVcbl07XG5pZiAoQXBwTW9kZS5vZmZsaW5lKSB7XG4gICAgLy8gVXNlIHRoZSBvZmZsaW5lIHZlcnNpb25zIG9mIHRoZSBsaWJyYXJpZXMgZm9yIGRldmVsb3BtZW50LlxuICAgIHNjcmlwdHMgPSBbXG4gICAgICAgIHtzcmM6IGJhc2VVcmwgKyAnL3N0YXRpYy9qcy9jZG4vanF1ZXJ5LzIuMS40L2pxdWVyeS5qcycsIGNhbGxiYWNrOiBKUXVlcnlQcm92aWRlci5sb2FkZWR9LFxuICAgICAgICB7c3JjOiBiYXNlVXJsICsgJy9zdGF0aWMvanMvY2RuL3JhY3RpdmUvMC43LjMvcmFjdGl2ZS5ydW50aW1lLmpzJywgY2FsbGJhY2s6IFJhY3RpdmVQcm92aWRlci5sb2FkZWQsIGFib3V0VG9Mb2FkOiBSYWN0aXZlUHJvdmlkZXIuYWJvdXRUb0xvYWR9LFxuICAgICAgICB7c3JjOiBiYXNlVXJsICsgJy9zdGF0aWMvd2lkZ2V0LW5ldy9saWIvcmFuZ3ktY29tcGlsZWQuanMnLCBjYWxsYmFjazogUmFuZ3lQcm92aWRlci5sb2FkZWQsIGFib3V0VG9Mb2FkOiBSYW5neVByb3ZpZGVyLmFib3V0VG9Mb2FkfVxuICAgIF07XG59XG5cbmZ1bmN0aW9uIGxvYWRBbGxTY3JpcHRzKGxvYWRlZENhbGxiYWNrKSB7XG4gICAgbG9hZFNjcmlwdHMoc2NyaXB0cywgbG9hZGVkQ2FsbGJhY2spO1xufVxuXG5mdW5jdGlvbiBsb2FkU2NyaXB0cyhzY3JpcHRzLCBsb2FkZWRDYWxsYmFjaykge1xuICAgIHZhciBsb2FkaW5nQ291bnQgPSBzY3JpcHRzLmxlbmd0aDtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNjcmlwdHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIHNjcmlwdCA9IHNjcmlwdHNbaV07XG4gICAgICAgIGlmIChzY3JpcHQuYWJvdXRUb0xvYWQpIHsgc2NyaXB0LmFib3V0VG9Mb2FkKCk7IH1cbiAgICAgICAgbG9hZFNjcmlwdChzY3JpcHQuc3JjLCBmdW5jdGlvbihzY3JpcHRDYWxsYmFjaykge1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmIChzY3JpcHRDYWxsYmFjaykgc2NyaXB0Q2FsbGJhY2soKTtcbiAgICAgICAgICAgICAgICBsb2FkaW5nQ291bnQgPSBsb2FkaW5nQ291bnQgLSAxO1xuICAgICAgICAgICAgICAgIGlmIChsb2FkaW5nQ291bnQgPT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAobG9hZGVkQ2FsbGJhY2spIGxvYWRlZENhbGxiYWNrKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSAoc2NyaXB0LmNhbGxiYWNrKSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBsb2FkU2NyaXB0KHNyYywgY2FsbGJhY2spIHtcbiAgICB2YXIgaGVhZCA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF07XG4gICAgaWYgKGhlYWQpIHtcbiAgICAgICAgdmFyIHNjcmlwdFRhZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuICAgICAgICBzY3JpcHRUYWcuc2V0QXR0cmlidXRlKCdzcmMnLCBzcmMpO1xuICAgICAgICBzY3JpcHRUYWcuc2V0QXR0cmlidXRlKCd0eXBlJywndGV4dC9qYXZhc2NyaXB0Jyk7XG5cbiAgICAgICAgaWYgKHNjcmlwdFRhZy5yZWFkeVN0YXRlKSB7IC8vIElFLCBpbmNsLiBJRTlcbiAgICAgICAgICAgIHNjcmlwdFRhZy5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBpZiAoc2NyaXB0VGFnLnJlYWR5U3RhdGUgPT0gXCJsb2FkZWRcIiB8fCBzY3JpcHRUYWcucmVhZHlTdGF0ZSA9PSBcImNvbXBsZXRlXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgc2NyaXB0VGFnLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjYWxsYmFjaykgeyBjYWxsYmFjaygpOyB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNjcmlwdFRhZy5vbmxvYWQgPSBmdW5jdGlvbigpIHsgLy8gT3RoZXIgYnJvd3NlcnNcbiAgICAgICAgICAgICAgICBpZiAoY2FsbGJhY2spIHsgY2FsbGJhY2soKTsgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIGhlYWQuYXBwZW5kQ2hpbGQoc2NyaXB0VGFnKTtcbiAgICB9XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBsb2FkOiBsb2FkQWxsU2NyaXB0c1xufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi91dGlscy9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciBCcm93c2VyTWV0cmljcyA9IHJlcXVpcmUoJy4vdXRpbHMvYnJvd3Nlci1tZXRyaWNzJyk7XG52YXIgUmFjdGl2ZTsgcmVxdWlyZSgnLi91dGlscy9yYWN0aXZlLXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGxvYWRlZFJhY3RpdmUpIHsgUmFjdGl2ZSA9IGxvYWRlZFJhY3RpdmU7fSk7XG52YXIgVG91Y2hTdXBwb3J0ID0gcmVxdWlyZSgnLi91dGlscy90b3VjaC1zdXBwb3J0Jyk7XG5cbnZhciBSZWFjdGlvbnNXaWRnZXQgPSByZXF1aXJlKCcuL3JlYWN0aW9ucy13aWRnZXQnKTtcbnZhciBTVkdzID0gcmVxdWlyZSgnLi9zdmdzJyk7XG5cbmZ1bmN0aW9uIGNyZWF0ZVN1bW1hcnlXaWRnZXQoY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGRlZmF1bHRSZWFjdGlvbnMsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgcmFjdGl2ZSA9IFJhY3RpdmUoe1xuICAgICAgICBlbDogJCgnPGRpdj4nKSwgLy8gdGhlIHJlYWwgcm9vdCBub2RlIGlzIGluIHRoZSB0ZW1wbGF0ZS4gaXQncyBleHRyYWN0ZWQgYWZ0ZXIgdGhlIHRlbXBsYXRlIGlzIHJlbmRlcmVkIGludG8gdGhpcyBkdW1teSBlbGVtZW50XG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIHBhZ2VEYXRhOiBwYWdlRGF0YSxcbiAgICAgICAgICAgIGNvbXB1dGVFeHBhbmRlZFJlYWN0aW9uczogY29tcHV0ZUV4cGFuZGVkUmVhY3Rpb25zKGdyb3VwU2V0dGluZ3MpXG4gICAgICAgIH0sXG4gICAgICAgIG1hZ2ljOiB0cnVlLFxuICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL3N1bW1hcnktd2lkZ2V0Lmhicy5odG1sJyksXG4gICAgICAgIHBhcnRpYWxzOiB7XG4gICAgICAgICAgICBsb2dvOiBTVkdzLmxvZ29cbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHZhciAkcm9vdEVsZW1lbnQgPSAkKHJvb3RFbGVtZW50KHJhY3RpdmUpKTtcbiAgICAkcm9vdEVsZW1lbnQub24oJ21vdXNlZW50ZXInLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgIG9wZW5SZWFjdGlvbnNXaW5kb3coY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGRlZmF1bHRSZWFjdGlvbnMsIGdyb3VwU2V0dGluZ3MsIHJhY3RpdmUpO1xuICAgIH0pO1xuICAgIFRvdWNoU3VwcG9ydC5zZXR1cFRhcCgkcm9vdEVsZW1lbnQuZ2V0KDApLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBpZiAoIVJlYWN0aW9uc1dpZGdldC5pc09wZW4oKSkge1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIG9wZW5SZWFjdGlvbnNXaW5kb3coY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGRlZmF1bHRSZWFjdGlvbnMsIGdyb3VwU2V0dGluZ3MsIHJhY3RpdmUpO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuICRyb290RWxlbWVudDtcbn1cblxuZnVuY3Rpb24gcm9vdEVsZW1lbnQocmFjdGl2ZSkge1xuICAgIHJldHVybiByYWN0aXZlLmZpbmQoJy5hbnRlbm5hLXN1bW1hcnktd2lkZ2V0Jyk7XG59XG5cbmZ1bmN0aW9uIG9wZW5SZWFjdGlvbnNXaW5kb3coY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGRlZmF1bHRSZWFjdGlvbnMsIGdyb3VwU2V0dGluZ3MsIHJhY3RpdmUpIHtcbiAgICB2YXIgcmVhY3Rpb25zV2lkZ2V0T3B0aW9ucyA9IHtcbiAgICAgICAgaXNTdW1tYXJ5OiB0cnVlLFxuICAgICAgICByZWFjdGlvbnNEYXRhOiBwYWdlRGF0YS5zdW1tYXJ5UmVhY3Rpb25zLFxuICAgICAgICBjb250YWluZXJEYXRhOiBjb250YWluZXJEYXRhLFxuICAgICAgICBkZWZhdWx0UmVhY3Rpb25zOiBkZWZhdWx0UmVhY3Rpb25zLFxuICAgICAgICBwYWdlRGF0YTogcGFnZURhdGEsXG4gICAgICAgIGdyb3VwU2V0dGluZ3M6IGdyb3VwU2V0dGluZ3MsXG4gICAgICAgIGNvbnRlbnREYXRhOiB7IHR5cGU6ICdwYWdlJywgYm9keTogJycgfVxuICAgIH07XG4gICAgUmVhY3Rpb25zV2lkZ2V0Lm9wZW4ocmVhY3Rpb25zV2lkZ2V0T3B0aW9ucywgcm9vdEVsZW1lbnQocmFjdGl2ZSkpO1xufVxuXG5mdW5jdGlvbiBzaG91bGRVc2VFeHBhbmRlZFN1bW1hcnkoZ3JvdXBTZXR0aW5ncykge1xuICAgIHJldHVybiBncm91cFNldHRpbmdzLmlzRXhwYW5kZWRNb2JpbGVTdW1tYXJ5KCkgJiYgQnJvd3Nlck1ldHJpY3MuaXNNb2JpbGUoKTtcbn1cblxuZnVuY3Rpb24gY29tcHV0ZUV4cGFuZGVkUmVhY3Rpb25zKGdyb3VwU2V0dGluZ3MpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24ocmVhY3Rpb25zRGF0YSkge1xuICAgICAgICBpZiAoc2hvdWxkVXNlRXhwYW5kZWRTdW1tYXJ5KGdyb3VwU2V0dGluZ3MpKSB7XG4gICAgICAgICAgICB2YXIgZGVmYXVsdFJlYWN0aW9ucyA9IGdyb3VwU2V0dGluZ3MuZGVmYXVsdFJlYWN0aW9ucygpO1xuICAgICAgICAgICAgdmFyIG1heCA9IDI7XG4gICAgICAgICAgICB2YXIgZXhwYW5kZWRSZWFjdGlvbnMgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmVhY3Rpb25zRGF0YS5sZW5ndGggJiYgZXhwYW5kZWRSZWFjdGlvbnMubGVuZ3RoIDwgbWF4OyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgcmVhY3Rpb25EYXRhID0gcmVhY3Rpb25zRGF0YVtpXTtcbiAgICAgICAgICAgICAgICBpZiAoaXNEZWZhdWx0UmVhY3Rpb24ocmVhY3Rpb25EYXRhLCBkZWZhdWx0UmVhY3Rpb25zKSkge1xuICAgICAgICAgICAgICAgICAgICBleHBhbmRlZFJlYWN0aW9ucy5wdXNoKHJlYWN0aW9uRGF0YSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGV4cGFuZGVkUmVhY3Rpb25zO1xuICAgICAgICB9XG4gICAgfTtcbn1cblxuZnVuY3Rpb24gaXNEZWZhdWx0UmVhY3Rpb24ocmVhY3Rpb25EYXRhLCBkZWZhdWx0UmVhY3Rpb25zKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkZWZhdWx0UmVhY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChkZWZhdWx0UmVhY3Rpb25zW2ldLnRleHQgPT09IHJlYWN0aW9uRGF0YS50ZXh0KSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGU6IGNyZWF0ZVN1bW1hcnlXaWRnZXRcbn07IiwidmFyIFJhY3RpdmU7IHJlcXVpcmUoJy4vdXRpbHMvcmFjdGl2ZS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihsb2FkZWRSYWN0aXZlKSB7IFJhY3RpdmUgPSBsb2FkZWRSYWN0aXZlO30pO1xuXG4vLyBBYm91dCBob3cgd2UgaGFuZGxlIGljb25zOiBXZSBpbnNlcnQgYSBzaW5nbGUgU1ZHIGVsZW1lbnQgYXQgdGhlIHRvcCBvZiB0aGUgYm9keSBlbGVtZW50IHdoaWNoIGRlZmluZXMgYWxsIG9mIHRoZVxuLy8gaWNvbnMgd2UgbmVlZC4gVGhlbiBhbGwgaWNvbnMgdXNlZCBieSB0aGUgYXBwbGljYXRpb25zIGFyZSByZW5kZXJlZCB3aXRoIHZlcnkgbGlnaHR3ZWlnaHQgU1ZHIGVsZW1lbnRzIHRoYXQgc2ltcGx5XG4vLyBwb2ludCB0byB0aGUgYXBwcm9wcmlhdGUgaWNvbiBieSByZWZlcmVuY2UuXG5cbi8vIFRPRE86IGxvb2sgaW50byB1c2luZyBhIHNpbmdsZSB0ZW1wbGF0ZSBmb3IgdGhlIFwidXNlXCIgU1ZHcy4gQ2FuIHdlIGluc3RhbnRpYXRlIGEgcGFydGlhbCB3aXRoIGEgZHluYW1pYyBjb250ZXh0P1xudmFyIHRlbXBsYXRlcyA9IHtcbiAgICBsb2dvOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvc3ZnLWxvZ28uaGJzLmh0bWwnKSxcbiAgICAvLyBUaGUgXCJzZWxlY3RhYmxlXCIgbG9nbyBkZWZpbmVzIGFuIGlubGluZSAncGF0aCcgcmF0aGVyIHRoYW4gYSAndXNlJyByZWZlcmVuY2UsIGFzIGEgd29ya2Fyb3VuZCBmb3IgYSBGaXJlZm94IHRleHQgc2VsZWN0aW9uIGJ1Zy5cbiAgICBsb2dvU2VsZWN0YWJsZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL3N2Zy1sb2dvLXNlbGVjdGFibGUuaGJzLmh0bWwnKSxcbiAgICBjb21tZW50czogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL3N2Zy1jb21tZW50cy5oYnMuaHRtbCcpLFxuICAgIGxvY2F0aW9uOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvc3ZnLWxvY2F0aW9uLmhicy5odG1sJyksXG4gICAgZmFjZWJvb2s6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9zdmctZmFjZWJvb2suaGJzLmh0bWwnKSxcbiAgICB0d2l0dGVyOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvc3ZnLXR3aXR0ZXIuaGJzLmh0bWwnKSxcbiAgICBsZWZ0OiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvc3ZnLWxlZnQuaGJzLmh0bWwnKVxufTtcblxudmFyIGlzU2V0dXAgPSBmYWxzZTtcblxuZnVuY3Rpb24gZW5zdXJlU2V0dXAoKSB7XG4gICAgaWYgKCFpc1NldHVwKSB7XG4gICAgICAgIHZhciBkdW1teSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBSYWN0aXZlKHtcbiAgICAgICAgICAgIGVsOiBkdW1teSxcbiAgICAgICAgICAgIHRlbXBsYXRlOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvc3Zncy5oYnMuaHRtbCcpXG4gICAgICAgIH0pO1xuICAgICAgICAvLyBTYWZhcmkgb24gaU9TIHJlcXVpcmVzIHRoZSBTVkcgdGhhdCBkZWZpbmVzIHRoZSBpY29ucyBhcHBlYXIgYmVmb3JlIHRoZSBTVkdzIHRoYXQgcmVmZXJlbmNlIGl0LlxuICAgICAgICBkb2N1bWVudC5ib2R5Lmluc2VydEJlZm9yZShkdW1teS5jaGlsZHJlblswXSwgZG9jdW1lbnQuYm9keS5maXJzdENoaWxkKTtcbiAgICAgICAgaXNTZXR1cCA9IHRydWU7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBnZXRTVkcodGVtcGxhdGUpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgIGVuc3VyZVNldHVwKCk7XG4gICAgICAgIHJldHVybiB0ZW1wbGF0ZTtcbiAgICB9XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBsb2dvOiBnZXRTVkcodGVtcGxhdGVzLmxvZ28pLFxuICAgIGxvZ29TZWxlY3RhYmxlOiBnZXRTVkcodGVtcGxhdGVzLmxvZ29TZWxlY3RhYmxlKSxcbiAgICBjb21tZW50czogZ2V0U1ZHKHRlbXBsYXRlcy5jb21tZW50cyksXG4gICAgbG9jYXRpb246IGdldFNWRyh0ZW1wbGF0ZXMubG9jYXRpb24pLFxuICAgIGZhY2Vib29rOiBnZXRTVkcodGVtcGxhdGVzLmZhY2Vib29rKSxcbiAgICB0d2l0dGVyOiBnZXRTVkcodGVtcGxhdGVzLnR3aXR0ZXIpLFxuICAgIGxlZnQ6IGdldFNWRyh0ZW1wbGF0ZXMubGVmdClcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgUmFjdGl2ZTsgcmVxdWlyZSgnLi91dGlscy9yYWN0aXZlLXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGxvYWRlZFJhY3RpdmUpIHsgUmFjdGl2ZSA9IGxvYWRlZFJhY3RpdmU7fSk7XG52YXIgUmFuZ2UgPSByZXF1aXJlKCcuL3V0aWxzL3JhbmdlJyk7XG52YXIgVG91Y2hTdXBwb3J0ID0gcmVxdWlyZSgnLi91dGlscy90b3VjaC1zdXBwb3J0Jyk7XG5cbnZhciBQb3B1cFdpZGdldCA9IHJlcXVpcmUoJy4vcG9wdXAtd2lkZ2V0Jyk7XG52YXIgUmVhY3Rpb25zV2lkZ2V0ID0gcmVxdWlyZSgnLi9yZWFjdGlvbnMtd2lkZ2V0Jyk7XG52YXIgU1ZHcyA9IHJlcXVpcmUoJy4vc3ZncycpO1xuXG5cbmZ1bmN0aW9uIGNyZWF0ZUluZGljYXRvcldpZGdldChvcHRpb25zKSB7XG4gICAgdmFyIGNvbnRhaW5lckRhdGEgPSBvcHRpb25zLmNvbnRhaW5lckRhdGE7XG4gICAgdmFyICRjb250YWluZXJFbGVtZW50ID0gb3B0aW9ucy5jb250YWluZXJFbGVtZW50O1xuICAgIHZhciBwYWdlRGF0YSA9IG9wdGlvbnMucGFnZURhdGE7XG4gICAgdmFyIGdyb3VwU2V0dGluZ3MgPSBvcHRpb25zLmdyb3VwU2V0dGluZ3M7XG4gICAgdmFyIGRlZmF1bHRSZWFjdGlvbnMgPSBvcHRpb25zLmRlZmF1bHRSZWFjdGlvbnM7XG4gICAgdmFyIGNvb3JkcyA9IG9wdGlvbnMuY29vcmRzO1xuICAgIHZhciByYWN0aXZlID0gUmFjdGl2ZSh7XG4gICAgICAgIGVsOiAkKCc8ZGl2PicpLCAvLyB0aGUgcmVhbCByb290IG5vZGUgaXMgaW4gdGhlIHRlbXBsYXRlLiBpdCdzIGV4dHJhY3RlZCBhZnRlciB0aGUgdGVtcGxhdGUgaXMgcmVuZGVyZWQgaW50byB0aGlzIGR1bW15IGVsZW1lbnRcbiAgICAgICAgYXBwZW5kOiB0cnVlLFxuICAgICAgICBtYWdpYzogdHJ1ZSxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgY29udGFpbmVyRGF0YTogY29udGFpbmVyRGF0YSxcbiAgICAgICAgICAgIGV4dHJhQ2xhc3NlczogZ3JvdXBTZXR0aW5ncy5lbmFibGVUZXh0SGVscGVyKCkgPyBcIlwiIDogXCJhbnRlbm5hLW5vaGludFwiXG4gICAgICAgIH0sXG4gICAgICAgIHRlbXBsYXRlOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvdGV4dC1pbmRpY2F0b3Itd2lkZ2V0Lmhicy5odG1sJyksXG4gICAgICAgIHBhcnRpYWxzOiB7XG4gICAgICAgICAgICBsb2dvOiBTVkdzLmxvZ29TZWxlY3RhYmxlXG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIHZhciByZWFjdGlvbldpZGdldE9wdGlvbnMgPSB7XG4gICAgICAgIHJlYWN0aW9uc0RhdGE6IGNvbnRhaW5lckRhdGEucmVhY3Rpb25zLFxuICAgICAgICBjb250YWluZXJEYXRhOiBjb250YWluZXJEYXRhLFxuICAgICAgICBjb250YWluZXJFbGVtZW50OiAkY29udGFpbmVyRWxlbWVudCxcbiAgICAgICAgY29udGVudERhdGE6IHsgdHlwZTogJ3RleHQnIH0sXG4gICAgICAgIGRlZmF1bHRSZWFjdGlvbnM6IGRlZmF1bHRSZWFjdGlvbnMsXG4gICAgICAgIHBhZ2VEYXRhOiBwYWdlRGF0YSxcbiAgICAgICAgZ3JvdXBTZXR0aW5nczogZ3JvdXBTZXR0aW5nc1xuICAgIH07XG5cbiAgICB2YXIgJHJvb3RFbGVtZW50ID0gJChyb290RWxlbWVudChyYWN0aXZlKSk7XG4gICAgaWYgKGNvb3Jkcykge1xuICAgICAgICAkcm9vdEVsZW1lbnQuY3NzKHtcbiAgICAgICAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxuICAgICAgICAgICAgdG9wOiBjb29yZHMudG9wIC0gJHJvb3RFbGVtZW50LmhlaWdodCgpLFxuICAgICAgICAgICAgYm90dG9tOiBjb29yZHMuYm90dG9tLFxuICAgICAgICAgICAgbGVmdDogY29vcmRzLmxlZnQsXG4gICAgICAgICAgICByaWdodDogY29vcmRzLnJpZ2h0LFxuICAgICAgICAgICAgJ3otaW5kZXgnOiAxMDAwIC8vIFRPRE86IGNvbXB1dGUgYSByZWFsIHZhbHVlP1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgdmFyIGhvdmVyVGltZW91dDtcbiAgICBUb3VjaFN1cHBvcnQuc2V0dXBUYXAoJHJvb3RFbGVtZW50LmdldCgwKSwgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgb3BlblJlYWN0aW9uc1dpbmRvdyhyZWFjdGlvbldpZGdldE9wdGlvbnMsIHJhY3RpdmUpXG4gICAgfSk7XG4gICAgJHJvb3RFbGVtZW50Lm9uKCdtb3VzZWVudGVyLmFudGVubmEnLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBpZiAoZXZlbnQuYnV0dG9ucyA+IDAgfHwgKGV2ZW50LmJ1dHRvbnMgPT0gdW5kZWZpbmVkICYmIGV2ZW50LndoaWNoID4gMCkpIHsgLy8gT24gU2FmYXJpLCBldmVudC5idXR0b25zIGlzIHVuZGVmaW5lZCBidXQgZXZlbnQud2hpY2ggZ2l2ZXMgYSBnb29kIHZhbHVlLiBldmVudC53aGljaCBpcyBiYWQgb24gRkZcbiAgICAgICAgICAgIC8vIERvbid0IHJlYWN0IGlmIHRoZSB1c2VyIGlzIGRyYWdnaW5nIG9yIHNlbGVjdGluZyB0ZXh0LlxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNsZWFyVGltZW91dChob3ZlclRpbWVvdXQpOyAvLyBvbmx5IG9uZSB0aW1lb3V0IGF0IGEgdGltZVxuICAgICAgICBob3ZlclRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKGNvbnRhaW5lckRhdGEucmVhY3Rpb25zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBvcGVuUmVhY3Rpb25zV2luZG93KHJlYWN0aW9uV2lkZ2V0T3B0aW9ucywgcmFjdGl2ZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhciAkaWNvbiA9ICQocm9vdEVsZW1lbnQocmFjdGl2ZSkpLmZpbmQoJy5hbnRlbm5hLWxvZ28nKTtcbiAgICAgICAgICAgICAgICB2YXIgb2Zmc2V0ID0gJGljb24ub2Zmc2V0KCk7XG4gICAgICAgICAgICAgICAgdmFyIGNvb3JkaW5hdGVzID0ge1xuICAgICAgICAgICAgICAgICAgICB0b3A6IG9mZnNldC50b3AgKyBNYXRoLmZsb29yKCRpY29uLmhlaWdodCgpIC8gMiksIC8vIFRPRE8gdGhpcyBudW1iZXIgaXMgYSBsaXR0bGUgb2ZmIGJlY2F1c2UgdGhlIGRpdiBkb2Vzbid0IHRpZ2h0bHkgd3JhcCB0aGUgaW5zZXJ0ZWQgZm9udCBjaGFyYWN0ZXJcbiAgICAgICAgICAgICAgICAgICAgbGVmdDogb2Zmc2V0LmxlZnQgKyBNYXRoLmZsb29yKCRpY29uLndpZHRoKCkgLyAyKVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgUG9wdXBXaWRnZXQuc2hvdyhjb29yZGluYXRlcywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIG9wZW5SZWFjdGlvbnNXaW5kb3cocmVhY3Rpb25XaWRnZXRPcHRpb25zLCByYWN0aXZlKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgMjAwKTtcbiAgICB9KTtcbiAgICAkcm9vdEVsZW1lbnQub24oJ21vdXNlbGVhdmUuYW50ZW5uYScsIGZ1bmN0aW9uKCkge1xuICAgICAgICBjbGVhclRpbWVvdXQoaG92ZXJUaW1lb3V0KTtcbiAgICB9KTtcbiAgICAkY29udGFpbmVyRWxlbWVudC5vbignbW91c2VlbnRlci5hbnRlbm5hJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICRyb290RWxlbWVudC5hZGRDbGFzcygnYWN0aXZlJyk7XG4gICAgfSk7XG4gICAgJGNvbnRhaW5lckVsZW1lbnQub24oJ21vdXNlbGVhdmUuYW50ZW5uYScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAkcm9vdEVsZW1lbnQucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpO1xuICAgIH0pO1xuICAgIHJldHVybiAkcm9vdEVsZW1lbnQ7XG59XG5cbmZ1bmN0aW9uIHJvb3RFbGVtZW50KHJhY3RpdmUpIHtcbiAgICByZXR1cm4gcmFjdGl2ZS5maW5kKCcuYW50ZW5uYS10ZXh0LWluZGljYXRvci13aWRnZXQnKTtcbn1cblxuZnVuY3Rpb24gb3BlblJlYWN0aW9uc1dpbmRvdyhyZWFjdGlvbk9wdGlvbnMsIHJhY3RpdmUpIHtcbiAgICBSZWFjdGlvbnNXaWRnZXQub3BlbihyZWFjdGlvbk9wdGlvbnMsIHJvb3RFbGVtZW50KHJhY3RpdmUpKTtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZTogY3JlYXRlSW5kaWNhdG9yV2lkZ2V0XG59OyIsInZhciAkOyByZXF1aXJlKCcuL3V0aWxzL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIFBvcHVwV2lkZ2V0ID0gcmVxdWlyZSgnLi9wb3B1cC13aWRnZXQnKTtcbnZhciBSYW5nZSA9IHJlcXVpcmUoJy4vdXRpbHMvcmFuZ2UnKTtcbnZhciBSZWFjdGlvbnNXaWRnZXQgPSByZXF1aXJlKCcuL3JlYWN0aW9ucy13aWRnZXQnKTtcbnZhciBUb3VjaFN1cHBvcnQgPSByZXF1aXJlKCcuL3V0aWxzL3RvdWNoLXN1cHBvcnQnKTtcblxuXG5mdW5jdGlvbiBjcmVhdGVSZWFjdGFibGVUZXh0KG9wdGlvbnMpIHtcbiAgICAvLyBUT0RPOiBpbXBvc2UgYW4gdXBwZXIgbGltaXQgb24gdGhlIGxlbmd0aCBvZiB0ZXh0IHRoYXQgY2FuIGJlIHJlYWN0ZWQgdG8/IChhcHBsaWVzIHRvIHRoZSBpbmRpY2F0b3Itd2lkZ2V0IHRvbylcbiAgICB2YXIgJGNvbnRhaW5lckVsZW1lbnQgPSBvcHRpb25zLmNvbnRhaW5lckVsZW1lbnQ7XG4gICAgdmFyIGNvbnRhaW5lckRhdGEgPSBvcHRpb25zLmNvbnRhaW5lckRhdGE7XG4gICAgdmFyIGV4Y2x1ZGVOb2RlID0gb3B0aW9ucy5leGNsdWRlTm9kZTtcbiAgICB2YXIgcmVhY3Rpb25zV2lkZ2V0T3B0aW9ucyA9IHtcbiAgICAgICAgcmVhY3Rpb25zRGF0YTogW10sIC8vIEFsd2F5cyBvcGVuIHdpdGggdGhlIGRlZmF1bHQgcmVhY3Rpb25zXG4gICAgICAgIGNvbnRhaW5lckRhdGE6IGNvbnRhaW5lckRhdGEsXG4gICAgICAgIGNvbnRlbnREYXRhOiB7IHR5cGU6ICd0ZXh0JyB9LFxuICAgICAgICBjb250YWluZXJFbGVtZW50OiAkY29udGFpbmVyRWxlbWVudCxcbiAgICAgICAgZGVmYXVsdFJlYWN0aW9uczogb3B0aW9ucy5kZWZhdWx0UmVhY3Rpb25zLFxuICAgICAgICBwYWdlRGF0YTogb3B0aW9ucy5wYWdlRGF0YSxcbiAgICAgICAgZ3JvdXBTZXR0aW5nczogb3B0aW9ucy5ncm91cFNldHRpbmdzXG4gICAgfTtcblxuICAgIHNldHVwVG91Y2hFdmVudHMoJGNvbnRhaW5lckVsZW1lbnQuZ2V0KDApLCByZWFjdGlvbnNXaWRnZXRPcHRpb25zKTtcbiAgICAkY29udGFpbmVyRWxlbWVudC5vbignbW91c2V1cCcsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGlmIChjb250YWluZXJEYXRhLmxvYWRlZCkge1xuICAgICAgICAgICAgdmFyIG5vZGUgPSAkY29udGFpbmVyRWxlbWVudC5nZXQoMCk7XG4gICAgICAgICAgICB2YXIgcG9pbnQgPSBSYW5nZS5nZXRTZWxlY3Rpb25FbmRQb2ludChub2RlLCBldmVudCwgZXhjbHVkZU5vZGUpO1xuICAgICAgICAgICAgaWYgKHBvaW50KSB7XG4gICAgICAgICAgICAgICAgdmFyIGNvb3JkaW5hdGVzID0ge3RvcDogcG9pbnQueSwgbGVmdDogcG9pbnQueH07XG4gICAgICAgICAgICAgICAgUG9wdXBXaWRnZXQuc2hvdyhjb29yZGluYXRlcywgZ3JhYlNlbGVjdGlvbkFuZE9wZW4obm9kZSwgY29vcmRpbmF0ZXMsIHJlYWN0aW9uc1dpZGdldE9wdGlvbnMsIGV4Y2x1ZGVOb2RlKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gZ3JhYlNlbGVjdGlvbkFuZE9wZW4obm9kZSwgY29vcmRpbmF0ZXMsIHJlYWN0aW9uc1dpZGdldE9wdGlvbnMsIGV4Y2x1ZGVOb2RlKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICBSYW5nZS5ncmFiU2VsZWN0aW9uKG5vZGUsIGZ1bmN0aW9uKHRleHQsIGxvY2F0aW9uKSB7XG4gICAgICAgICAgICByZWFjdGlvbnNXaWRnZXRPcHRpb25zLmNvbnRlbnREYXRhLmxvY2F0aW9uID0gbG9jYXRpb247XG4gICAgICAgICAgICByZWFjdGlvbnNXaWRnZXRPcHRpb25zLmNvbnRlbnREYXRhLmJvZHkgPSB0ZXh0O1xuICAgICAgICAgICAgUmVhY3Rpb25zV2lkZ2V0Lm9wZW4ocmVhY3Rpb25zV2lkZ2V0T3B0aW9ucywgY29vcmRpbmF0ZXMpO1xuICAgICAgICB9LCBleGNsdWRlTm9kZSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBncmFiTm9kZUFuZE9wZW4obm9kZSwgcmVhY3Rpb25zV2lkZ2V0T3B0aW9ucywgY29vcmRzKSB7XG4gICAgUmFuZ2UuZ3JhYk5vZGUobm9kZSwgZnVuY3Rpb24odGV4dCwgbG9jYXRpb24pIHtcbiAgICAgICAgcmVhY3Rpb25zV2lkZ2V0T3B0aW9ucy5jb250ZW50RGF0YS5sb2NhdGlvbiA9IGxvY2F0aW9uO1xuICAgICAgICByZWFjdGlvbnNXaWRnZXRPcHRpb25zLmNvbnRlbnREYXRhLmJvZHkgPSB0ZXh0O1xuICAgICAgICBSZWFjdGlvbnNXaWRnZXQub3BlbihyZWFjdGlvbnNXaWRnZXRPcHRpb25zLCBjb29yZHMpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBzZXR1cFRvdWNoRXZlbnRzKGVsZW1lbnQsIHJlYWN0aW9uc1dpZGdldE9wdGlvbnMpIHtcbiAgICBUb3VjaFN1cHBvcnQuc2V0dXBUYXAoZWxlbWVudCwgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgaWYgKCFSZWFjdGlvbnNXaWRnZXQuaXNPcGVuKCkgJiYgJChldmVudC50YXJnZXQpLmNsb3Nlc3QoJ2EnKS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB2YXIgdG91Y2ggPSBldmVudC5jaGFuZ2VkVG91Y2hlc1swXTtcbiAgICAgICAgICAgIHZhciBjb29yZHMgPSB7IHRvcDogdG91Y2gucGFnZVksIGxlZnQ6IHRvdWNoLnBhZ2VYIH07XG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyAvLyBMZXQgdGhpcyBldmVudCBmaW5pc2ggcHJvY2Vzc2luZyBiZWZvcmUgb3BlbmluZyB0aGUgcmVhY3Rpb25zIHdpbmRvdyBzbyB0aGUgd2luZG93IGRvZXNuJ3QgYWxzbyBwcm9jZXNzIHRoZSBldmVudC5cbiAgICAgICAgICAgICAgICBncmFiTm9kZUFuZE9wZW4oZWxlbWVudCwgcmVhY3Rpb25zV2lkZ2V0T3B0aW9ucywgY29vcmRzKTtcbiAgICAgICAgICAgIH0sIDApO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGVSZWFjdGFibGVUZXh0OiBjcmVhdGVSZWFjdGFibGVUZXh0XG59OyIsIi8vIFRPRE86IG5lZWRzIGEgYmV0dGVyIG5hbWUgb25jZSB0aGUgc2NvcGUgaXMgY2xlYXJcblxudmFyICQ7IHJlcXVpcmUoJy4vanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgQXBwTW9kZSA9IHJlcXVpcmUoJy4vYXBwLW1vZGUnKTtcbnZhciBYRE1DbGllbnQgPSByZXF1aXJlKCcuL3hkbS1jbGllbnQnKTtcbnZhciBVUkxzID0gcmVxdWlyZSgnLi91cmxzJyk7XG52YXIgVVJMQ29uc3RhbnRzID0gcmVxdWlyZSgnLi91cmwtY29uc3RhbnRzJyk7XG52YXIgVXNlciA9IHJlcXVpcmUoJy4vdXNlcicpO1xuXG5cbmZ1bmN0aW9uIHBvc3ROZXdSZWFjdGlvbihyZWFjdGlvbkRhdGEsIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBjb250ZW50RGF0YSwgc3VjY2VzcywgZXJyb3IpIHtcbiAgICB2YXIgY29udGVudEJvZHkgPSBjb250ZW50RGF0YS5ib2R5O1xuICAgIHZhciBjb250ZW50VHlwZSA9IGNvbnRlbnREYXRhLnR5cGU7XG4gICAgdmFyIGNvbnRlbnRMb2NhdGlvbiA9IGNvbnRlbnREYXRhLmxvY2F0aW9uO1xuICAgIHZhciBjb250ZW50RGltZW5zaW9ucyA9IGNvbnRlbnREYXRhLmRpbWVuc2lvbnM7XG4gICAgWERNQ2xpZW50LmdldFVzZXIoZnVuY3Rpb24odXNlckluZm8pIHtcbiAgICAgICAgLy8gVE9ETyBleHRyYWN0IHRoZSBzaGFwZSBvZiB0aGlzIGRhdGEgYW5kIHBvc3NpYmx5IHRoZSB3aG9sZSBBUEkgY2FsbFxuICAgICAgICB2YXIgZGF0YSA9IHtcbiAgICAgICAgICAgIHRhZzoge1xuICAgICAgICAgICAgICAgIGJvZHk6IHJlYWN0aW9uRGF0YS50ZXh0XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaXNfZGVmYXVsdDogcmVhY3Rpb25EYXRhLmlzRGVmYXVsdCAhPT0gdW5kZWZpbmVkICYmIHJlYWN0aW9uRGF0YS5pc0RlZmF1bHQsIC8vIGZhbHNlIHVubGVzcyBzcGVjaWZpZWRcbiAgICAgICAgICAgIGhhc2g6IGNvbnRhaW5lckRhdGEuaGFzaCxcbiAgICAgICAgICAgIHVzZXJfaWQ6IHVzZXJJbmZvLnVzZXJfaWQsXG4gICAgICAgICAgICBhbnRfdG9rZW46IHVzZXJJbmZvLmFudF90b2tlbixcbiAgICAgICAgICAgIHBhZ2VfaWQ6IHBhZ2VEYXRhLnBhZ2VJZCxcbiAgICAgICAgICAgIGdyb3VwX2lkOiBwYWdlRGF0YS5ncm91cElkLFxuICAgICAgICAgICAgY29udGFpbmVyX2tpbmQ6IGNvbnRlbnRUeXBlLCAvLyBPbmUgb2YgJ3BhZ2UnLCAndGV4dCcsICdtZWRpYScsICdpbWcnXG4gICAgICAgICAgICBjb250ZW50X25vZGVfZGF0YToge1xuICAgICAgICAgICAgICAgIGJvZHk6IGNvbnRlbnRCb2R5LFxuICAgICAgICAgICAgICAgIGtpbmQ6IGNvbnRlbnRUeXBlLFxuICAgICAgICAgICAgICAgIGl0ZW1fdHlwZTogJycgLy8gVE9ETzogbG9va3MgdW51c2VkIGJ1dCBUYWdIYW5kbGVyIGJsb3dzIHVwIHdpdGhvdXQgaXQuIEN1cnJlbnQgY2xpZW50IHBhc3NlcyBpbiBcInBhZ2VcIiBmb3IgcGFnZSByZWFjdGlvbnMuXG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIGlmIChjb250ZW50TG9jYXRpb24pIHtcbiAgICAgICAgICAgIGRhdGEuY29udGVudF9ub2RlX2RhdGEubG9jYXRpb24gPSBjb250ZW50TG9jYXRpb247XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvbnRlbnREaW1lbnNpb25zKSB7XG4gICAgICAgICAgICBkYXRhLmNvbnRlbnRfbm9kZV9kYXRhLmhlaWdodCA9IGNvbnRlbnREaW1lbnNpb25zLmhlaWdodDtcbiAgICAgICAgICAgIGRhdGEuY29udGVudF9ub2RlX2RhdGEud2lkdGggPSBjb250ZW50RGltZW5zaW9ucy53aWR0aDtcbiAgICAgICAgfVxuICAgICAgICBpZiAocmVhY3Rpb25EYXRhLmlkKSB7XG4gICAgICAgICAgICBkYXRhLnRhZy5pZCA9IHJlYWN0aW9uRGF0YS5pZDsgLy8gVE9ETyB0aGUgY3VycmVudCBjbGllbnQgc2VuZHMgXCItMTAxXCIgaWYgdGhlcmUncyBubyBpZC4gaXMgdGhpcyBuZWNlc3Nhcnk/XG4gICAgICAgIH1cbiAgICAgICAgZ2V0SlNPTlAoVVJMcy5jcmVhdGVSZWFjdGlvblVybCgpLCBkYXRhLCBuZXdSZWFjdGlvblN1Y2Nlc3MoY29udGVudExvY2F0aW9uLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgc3VjY2VzcyksIGVycm9yKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gcG9zdFBsdXNPbmUocmVhY3Rpb25EYXRhLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgc3VjY2VzcywgZXJyb3IpIHtcbiAgICBYRE1DbGllbnQuZ2V0VXNlcihmdW5jdGlvbih1c2VySW5mbykge1xuICAgICAgICAvLyBUT0RPIGV4dHJhY3QgdGhlIHNoYXBlIG9mIHRoaXMgZGF0YSBhbmQgcG9zc2libHkgdGhlIHdob2xlIEFQSSBjYWxsXG4gICAgICAgIGlmICghcmVhY3Rpb25EYXRhLmNvbnRlbnQpIHtcbiAgICAgICAgICAgIC8vIFRoaXMgaXMgYSBzdW1tYXJ5IHJlYWN0aW9uLiBTZWUgaWYgd2UgaGF2ZSBhbnkgY29udGFpbmVyIGRhdGEgdGhhdCB3ZSBjYW4gbGluayB0byBpdC5cbiAgICAgICAgICAgIHZhciBjb250YWluZXJSZWFjdGlvbnMgPSBjb250YWluZXJEYXRhLnJlYWN0aW9ucztcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY29udGFpbmVyUmVhY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNvbnRhaW5lclJlYWN0aW9uID0gY29udGFpbmVyUmVhY3Rpb25zW2ldO1xuICAgICAgICAgICAgICAgIGlmIChjb250YWluZXJSZWFjdGlvbi5pZCA9PT0gcmVhY3Rpb25EYXRhLmlkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlYWN0aW9uRGF0YS5wYXJlbnRJRCA9IGNvbnRhaW5lclJlYWN0aW9uLnBhcmVudElEO1xuICAgICAgICAgICAgICAgICAgICByZWFjdGlvbkRhdGEuY29udGVudCA9IGNvbnRhaW5lclJlYWN0aW9uLmNvbnRlbnQ7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB2YXIgZGF0YSA9IHtcbiAgICAgICAgICAgIHRhZzoge1xuICAgICAgICAgICAgICAgIGJvZHk6IHJlYWN0aW9uRGF0YS50ZXh0LFxuICAgICAgICAgICAgICAgIGlkOiByZWFjdGlvbkRhdGEuaWRcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBoYXNoOiBjb250YWluZXJEYXRhLmhhc2gsXG4gICAgICAgICAgICB1c2VyX2lkOiB1c2VySW5mby51c2VyX2lkLFxuICAgICAgICAgICAgYW50X3Rva2VuOiB1c2VySW5mby5hbnRfdG9rZW4sXG4gICAgICAgICAgICBwYWdlX2lkOiBwYWdlRGF0YS5wYWdlSWQsXG4gICAgICAgICAgICBncm91cF9pZDogcGFnZURhdGEuZ3JvdXBJZCxcbiAgICAgICAgICAgIGNvbnRhaW5lcl9raW5kOiBjb250YWluZXJEYXRhLnR5cGUsIC8vICdwYWdlJywgJ3RleHQnLCAnbWVkaWEnLCAnaW1nJ1xuICAgICAgICAgICAgY29udGVudF9ub2RlX2RhdGE6IHtcbiAgICAgICAgICAgICAgICBib2R5OiAnJywgLy8gVE9ETzogZG8gd2UgbmVlZCB0aGlzIGZvciArMXM/IGxvb2tzIGxpa2Ugb25seSB0aGUgaWQgZmllbGQgaXMgdXNlZCwgaWYgb25lIGlzIHNldFxuICAgICAgICAgICAgICAgIGtpbmQ6IGNvbnRlbnROb2RlRGF0YUtpbmQoY29udGFpbmVyRGF0YS50eXBlKSxcbiAgICAgICAgICAgICAgICBpdGVtX3R5cGU6ICcnIC8vIFRPRE86IGxvb2tzIHVudXNlZCBidXQgVGFnSGFuZGxlciBibG93cyB1cCB3aXRob3V0IGl0XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIGlmIChyZWFjdGlvbkRhdGEuY29udGVudCkge1xuICAgICAgICAgICAgZGF0YS5jb250ZW50X25vZGVfZGF0YS5pZCA9IHJlYWN0aW9uRGF0YS5jb250ZW50LmlkO1xuICAgICAgICAgICAgZGF0YS5jb250ZW50X25vZGVfZGF0YS5sb2NhdGlvbiA9IHJlYWN0aW9uRGF0YS5jb250ZW50LmxvY2F0aW9uO1xuICAgICAgICB9XG4gICAgICAgIC8vIFRPRE86IHNob3VsZCB3ZSBiYWlsIGlmIHRoZXJlJ3Mgbm8gcGFyZW50IElEPyBJdCdzIG5vdCByZWFsbHkgYSArMSB3aXRob3V0IG9uZS5cbiAgICAgICAgaWYgKHJlYWN0aW9uRGF0YS5wYXJlbnRJRCkge1xuICAgICAgICAgICAgZGF0YS50YWcucGFyZW50X2lkID0gcmVhY3Rpb25EYXRhLnBhcmVudElEO1xuICAgICAgICB9XG4gICAgICAgIGdldEpTT05QKFVSTHMuY3JlYXRlUmVhY3Rpb25VcmwoKSwgZGF0YSwgcGx1c09uZVN1Y2Nlc3MocmVhY3Rpb25EYXRhLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgc3VjY2VzcyksIGVycm9yKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gcG9zdENvbW1lbnQoY29tbWVudCwgcmVhY3Rpb25EYXRhLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgc3VjY2VzcywgZXJyb3IpIHtcbiAgICAvLyBUT0RPOiByZWZhY3RvciB0aGUgcG9zdCBmdW5jdGlvbnMgdG8gZWxpbWluYXRlIGFsbCB0aGUgY29waWVkIGNvZGVcbiAgICBYRE1DbGllbnQuZ2V0VXNlcihmdW5jdGlvbih1c2VySW5mbykge1xuICAgICAgICAvLyBUT0RPIGV4dHJhY3QgdGhlIHNoYXBlIG9mIHRoaXMgZGF0YSBhbmQgcG9zc2libHkgdGhlIHdob2xlIEFQSSBjYWxsXG4gICAgICAgIGlmICghcmVhY3Rpb25EYXRhLmNvbnRlbnQpIHtcbiAgICAgICAgICAgIC8vIFRoaXMgaXMgYSBzdW1tYXJ5IHJlYWN0aW9uLiBTZWUgaWYgd2UgaGF2ZSBhbnkgY29udGFpbmVyIGRhdGEgdGhhdCB3ZSBjYW4gbGluayB0byBpdC5cbiAgICAgICAgICAgIHZhciBjb250YWluZXJSZWFjdGlvbnMgPSBjb250YWluZXJEYXRhLnJlYWN0aW9ucztcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY29udGFpbmVyUmVhY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNvbnRhaW5lclJlYWN0aW9uID0gY29udGFpbmVyUmVhY3Rpb25zW2ldO1xuICAgICAgICAgICAgICAgIGlmIChjb250YWluZXJSZWFjdGlvbi5pZCA9PT0gcmVhY3Rpb25EYXRhLmlkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlYWN0aW9uRGF0YS5wYXJlbnRJRCA9IGNvbnRhaW5lclJlYWN0aW9uLnBhcmVudElEO1xuICAgICAgICAgICAgICAgICAgICByZWFjdGlvbkRhdGEuY29udGVudCA9IGNvbnRhaW5lclJlYWN0aW9uLmNvbnRlbnQ7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB2YXIgZGF0YSA9IHtcbiAgICAgICAgICAgIGNvbW1lbnQ6IGNvbW1lbnQsXG4gICAgICAgICAgICB0YWc6IHtcbiAgICAgICAgICAgICAgICBwYXJlbnRfaWQ6IHJlYWN0aW9uRGF0YS5wYXJlbnRJRFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHVzZXJfaWQ6IHVzZXJJbmZvLnVzZXJfaWQsXG4gICAgICAgICAgICBhbnRfdG9rZW46IHVzZXJJbmZvLmFudF90b2tlbixcbiAgICAgICAgICAgIHBhZ2VfaWQ6IHBhZ2VEYXRhLnBhZ2VJZCxcbiAgICAgICAgICAgIGdyb3VwX2lkOiBwYWdlRGF0YS5ncm91cElkXG4gICAgICAgIH07XG4gICAgICAgIGdldEpTT05QKFVSTHMuY3JlYXRlQ29tbWVudFVybCgpLCBkYXRhLCBjb21tZW50U3VjY2VzcyhyZWFjdGlvbkRhdGEsIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBzdWNjZXNzKSwgZXJyb3IpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBjb250ZW50Tm9kZURhdGFLaW5kKHR5cGUpIHtcbiAgICBpZiAodHlwZSA9PT0gJ2ltYWdlJykge1xuICAgICAgICByZXR1cm4gJ2ltZyc7XG4gICAgfVxuICAgIHJldHVybiB0eXBlO1xufVxuXG5mdW5jdGlvbiBjb21tZW50U3VjY2VzcyhyZWFjdGlvbkRhdGEsIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBjYWxsYmFjaykge1xuICAgIHJldHVybiBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAvLyBUT0RPOiBpbiB0aGUgY2FzZSB0aGF0IHNvbWVvbmUgcmVhY3RzIGFuZCB0aGVuIGltbWVkaWF0ZWx5IGNvbW1lbnRzLCB3ZSBoYXZlIGEgcmFjZSBjb25kaXRpb24gd2hlcmUgdGhlXG4gICAgICAgIC8vICAgICAgIGNvbW1lbnQgcmVzcG9uc2UgY291bGQgY29tZSBiYWNrIGJlZm9yZSB0aGUgcmVhY3Rpb24uIHdlIG5lZWQgdG86XG4gICAgICAgIC8vICAgICAgIDEuIE1ha2Ugc3VyZSB0aGUgc2VydmVyIG9ubHkgY3JlYXRlcyBhIHNpbmdsZSByZWFjdGlvbiBpbiB0aGlzIGNhc2UgKG5vdCBhIEhVR0UgZGVhbCBpZiBpdCBtYWtlcyB0d28pXG4gICAgICAgIC8vICAgICAgIDIuIFJlc29sdmUgdGhlIHR3byByZXNwb25zZXMgdGhhdCBib3RoIHRoZW9yZXRpY2FsbHkgY29tZSBiYWNrIHdpdGggdGhlIHNhbWUgcmVhY3Rpb24gZGF0YSBhdCB0aGUgc2FtZVxuICAgICAgICAvLyAgICAgICAgICB0aW1lLiBNYWtlIHN1cmUgd2UgZG9uJ3QgZW5kIHVwIHdpdGggdHdvIGNvcGllcyBvZiB0aGUgc2FtZSBkYXRhIGluIHRoZSBtb2RlbC5cbiAgICAgICAgdmFyIHJlYWN0aW9uQ3JlYXRlZCA9ICFyZXNwb25zZS5leGlzdGluZztcbiAgICAgICAgaWYgKHJlYWN0aW9uQ3JlYXRlZCkge1xuICAgICAgICAgICAgaWYgKCFyZWFjdGlvbkRhdGEuY29tbWVudENvdW50KSB7XG4gICAgICAgICAgICAgICAgcmVhY3Rpb25EYXRhLmNvbW1lbnRDb3VudCA9IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZWFjdGlvbkRhdGEuY29tbWVudENvdW50ICs9IDE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBUT0RPOiBkbyB3ZSBldmVyIGdldCBhIHJlc3BvbnNlIHRvIGEgbmV3IHJlYWN0aW9uIHRlbGxpbmcgdXMgdGhhdCBpdCdzIGFscmVhZHkgZXhpc3Rpbmc/IElmIHNvLCBjb3VsZCB0aGUgY291bnQgbmVlZCB0byBiZSB1cGRhdGVkP1xuICAgICAgICB9XG4gICAgICAgIGNhbGxiYWNrKHJlYWN0aW9uQ3JlYXRlZCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBwbHVzT25lU3VjY2VzcyhyZWFjdGlvbkRhdGEsIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBjYWxsYmFjaykge1xuICAgIHJldHVybiBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAvLyBUT0RPOiBEbyB3ZSBjYXJlIGFib3V0IHJlc3BvbnNlLmV4aXN0aW5nIGFueW1vcmUgKHdlIHVzZWQgdG8gc2hvdyBkaWZmZXJlbnQgZmVlZGJhY2sgaW4gdGhlIFVJLCBidXQgbm8gbG9uZ2VyLi4uKVxuICAgICAgICB2YXIgcmVhY3Rpb25DcmVhdGVkID0gIXJlc3BvbnNlLmV4aXN0aW5nO1xuICAgICAgICBpZiAocmVhY3Rpb25DcmVhdGVkKSB7XG4gICAgICAgICAgICAvLyBUT0RPOiB3ZSBzaG91bGQgZ2V0IGJhY2sgYSByZXNwb25zZSB3aXRoIGRhdGEgaW4gdGhlIFwibmV3IGZvcm1hdFwiIGFuZCB1cGRhdGUgdGhlIG1vZGVsIGZyb20gdGhlIHJlc3BvbnNlXG4gICAgICAgICAgICByZWFjdGlvbkRhdGEuY291bnQgPSByZWFjdGlvbkRhdGEuY291bnQgKyAxO1xuICAgICAgICAgICAgY29udGFpbmVyRGF0YS5yZWFjdGlvblRvdGFsID0gY29udGFpbmVyRGF0YS5yZWFjdGlvblRvdGFsICsgMTtcbiAgICAgICAgICAgIHBhZ2VEYXRhLnN1bW1hcnlUb3RhbCA9IHBhZ2VEYXRhLnN1bW1hcnlUb3RhbCArIDE7XG4gICAgICAgIH1cbiAgICAgICAgY2FsbGJhY2socmVhY3Rpb25EYXRhKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIG5ld1JlYWN0aW9uU3VjY2Vzcyhjb250ZW50TG9jYXRpb24sIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBjYWxsYmFjaykge1xuICAgIHJldHVybiBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAvLyBUT0RPOiBDYW4gcmVzcG9uc2UuZXhpc3RpbmcgZXZlciBjb21lIGJhY2sgdHJ1ZSBmb3IgYSAnbmV3JyByZWFjdGlvbj8gU2hvdWxkIHdlIGJlaGF2ZSBhbnkgZGlmZmVyZW50bHkgaWYgaXQgZG9lcz9cbiAgICAgICAgdmFyIHJlYWN0aW9uID0gcmVhY3Rpb25Gcm9tUmVzcG9uc2UocmVzcG9uc2UsIGNvbnRlbnRMb2NhdGlvbik7XG4gICAgICAgIGNhbGxiYWNrKHJlYWN0aW9uKTtcbiAgICB9O1xufVxuXG5mdW5jdGlvbiByZWFjdGlvbkZyb21SZXNwb25zZShyZXNwb25zZSwgY29udGVudExvY2F0aW9uKSB7XG4gICAgLy8gVE9ETzogdGhlIHNlcnZlciBzaG91bGQgZ2l2ZSB1cyBiYWNrIGEgcmVhY3Rpb24gbWF0Y2hpbmcgdGhlIG5ldyBBUEkgZm9ybWF0LlxuICAgIC8vICAgICAgIHdlJ3JlIGp1c3QgZmFraW5nIGl0IG91dCBmb3Igbm93OyB0aGlzIGNvZGUgaXMgdGVtcG9yYXJ5XG4gICAgdmFyIHJlYWN0aW9uID0ge1xuICAgICAgICB0ZXh0OiByZXNwb25zZS5pbnRlcmFjdGlvbi5pbnRlcmFjdGlvbl9ub2RlLmJvZHksXG4gICAgICAgIGlkOiByZXNwb25zZS5pbnRlcmFjdGlvbi5pbnRlcmFjdGlvbl9ub2RlLmlkLFxuICAgICAgICBjb3VudDogMSxcbiAgICAgICAgcGFyZW50SUQ6IHJlc3BvbnNlLmludGVyYWN0aW9uLmlkXG4gICAgfTtcbiAgICBpZiAocmVzcG9uc2UuY29udGVudF9ub2RlKSB7XG4gICAgICAgIHJlYWN0aW9uLmNvbnRlbnQgPSB7XG4gICAgICAgICAgICBpZDogcmVzcG9uc2UuY29udGVudF9ub2RlLmlkLFxuICAgICAgICAgICAga2luZDogcmVzcG9uc2UuY29udGVudF9ub2RlLmtpbmQsXG4gICAgICAgICAgICBib2R5OiByZXNwb25zZS5jb250ZW50X25vZGUuYm9keVxuICAgICAgICB9O1xuICAgICAgICBpZiAocmVzcG9uc2UuY29udGVudF9ub2RlLmxvY2F0aW9uKSB7XG4gICAgICAgICAgICByZWFjdGlvbi5jb250ZW50LmxvY2F0aW9uID0gcmVzcG9uc2UuY29udGVudF9ub2RlLmxvY2F0aW9uO1xuICAgICAgICB9IGVsc2UgaWYgKGNvbnRlbnRMb2NhdGlvbikge1xuICAgICAgICAgICAgLy8gVE9ETzogZW5zdXJlIHRoYXQgdGhlIEFQSSBhbHdheXMgcmV0dXJucyBhIGxvY2F0aW9uIGFuZCByZW1vdmUgdGhlIFwiY29udGVudExvY2F0aW9uXCIgdGhhdCdzIGJlaW5nIHBhc3NlZCBhcm91bmQuXG4gICAgICAgICAgICAvLyBGb3Igbm93LCBqdXN0IHBhdGNoIHRoZSByZXNwb25zZSB3aXRoIHRoZSBkYXRhIHdlIGtub3cgd2Ugc2VudCBvdmVyLlxuICAgICAgICAgICAgcmVhY3Rpb24uY29udGVudC5sb2NhdGlvbiA9IGNvbnRlbnRMb2NhdGlvbjtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVhY3Rpb247XG59XG5cbmZ1bmN0aW9uIGdldENvbW1lbnRzKHJlYWN0aW9uLCBjYWxsYmFjaykge1xuICAgIFhETUNsaWVudC5nZXRVc2VyKGZ1bmN0aW9uKHVzZXJJbmZvKSB7XG4gICAgICAgIHZhciBkYXRhID0ge1xuICAgICAgICAgICAgcmVhY3Rpb25faWQ6IHJlYWN0aW9uLnBhcmVudElELFxuICAgICAgICAgICAgdXNlcl9pZDogdXNlckluZm8udXNlcl9pZCxcbiAgICAgICAgICAgIGFudF90b2tlbjogdXNlckluZm8uYW50X3Rva2VuXG4gICAgICAgIH07XG4gICAgICAgIGdldEpTT05QKFVSTHMuZmV0Y2hDb21tZW50VXJsKCksIGRhdGEsIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhjb21tZW50c0Zyb21SZXNwb25zZShyZXNwb25zZSkpO1xuICAgICAgICB9LCBmdW5jdGlvbihtZXNzYWdlKSB7XG4gICAgICAgICAgICAvLyBUT0RPOiBlcnJvciBoYW5kbGluZ1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ0FuIGVycm9yIG9jY3VycmVkIGZldGNoaW5nIGNvbW1lbnRzOiAnICsgbWVzc2FnZSk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBmZXRjaExvY2F0aW9uRGV0YWlscyhyZWFjdGlvbkxvY2F0aW9uRGF0YSwgcGFnZURhdGEsIGNhbGxiYWNrKSB7XG4gICAgdmFyIGNvbnRlbnRJRHMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhyZWFjdGlvbkxvY2F0aW9uRGF0YSk7XG4gICAgWERNQ2xpZW50LmdldFVzZXIoZnVuY3Rpb24odXNlckluZm8pIHtcbiAgICAgICAgdmFyIGRhdGEgPSB7XG4gICAgICAgICAgICB1c2VyX2lkOiB1c2VySW5mby51c2VyX2lkLFxuICAgICAgICAgICAgYW50X3Rva2VuOiB1c2VySW5mby5hbnRfdG9rZW4sXG4gICAgICAgICAgICBjb250ZW50X2lkczogY29udGVudElEc1xuICAgICAgICB9O1xuICAgICAgICBnZXRKU09OUChVUkxzLmZldGNoQ29udGVudEJvZGllc1VybCgpLCBkYXRhLCBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAgICAgY2FsbGJhY2socmVzcG9uc2UpO1xuICAgICAgICB9LCBmdW5jdGlvbihtZXNzYWdlKSB7XG4gICAgICAgICAgICAvLyBUT0RPOiBlcnJvciBoYW5kbGluZ1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ0FuIGVycm9yIG9jY3VycmVkIGZldGNoaW5nIGNvbnRlbnQgYm9kaWVzOiAnICsgbWVzc2FnZSk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBjb21tZW50c0Zyb21SZXNwb25zZShqc29uQ29tbWVudHMpIHtcbiAgICB2YXIgY29tbWVudHMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGpzb25Db21tZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIganNvbkNvbW1lbnQgPSBqc29uQ29tbWVudHNbaV07XG4gICAgICAgIHZhciBjb21tZW50ID0ge1xuICAgICAgICAgICAgdGV4dDoganNvbkNvbW1lbnQudGV4dCxcbiAgICAgICAgICAgIGlkOiBqc29uQ29tbWVudC5pZCwgLy8gVE9ETzogd2UgcHJvYmFibHkgb25seSBuZWVkIHRoaXMgZm9yICsxJ2luZyBjb21tZW50c1xuICAgICAgICAgICAgY29udGVudElEOiBqc29uQ29tbWVudC5jb250ZW50SUQsIC8vIFRPRE86IERvIHdlIHJlYWxseSBuZWVkIHRoaXM/XG4gICAgICAgICAgICB1c2VyOiBVc2VyLmZyb21Db21tZW50SlNPTihqc29uQ29tbWVudC51c2VyLCBqc29uQ29tbWVudC5zb2NpYWxfdXNlcilcbiAgICAgICAgfTtcbiAgICAgICAgY29tbWVudHMucHVzaChjb21tZW50KTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbW1lbnRzO1xufVxuXG5mdW5jdGlvbiBnZXRKU09OUCh1cmwsIGRhdGEsIHN1Y2Nlc3MsIGVycm9yKSB7XG4gICAgdmFyIGJhc2VVcmw7XG4gICAgaWYgKEFwcE1vZGUudGVzdCkge1xuICAgICAgICBiYXNlVXJsID0gVVJMQ29uc3RhbnRzLlRFU1Q7XG4gICAgfSBlbHNlIGlmIChBcHBNb2RlLm9mZmxpbmUpIHtcbiAgICAgICAgYmFzZVVybCA9IFVSTENvbnN0YW50cy5ERVZFTE9QTUVOVDtcbiAgICB9IGVsc2Uge1xuICAgICAgICBiYXNlVXJsID0gVVJMQ29uc3RhbnRzLlBST0RVQ1RJT047XG4gICAgfVxuICAgIGRvR2V0SlNPTlAoYmFzZVVybCwgdXJsLCBkYXRhLCBzdWNjZXNzLCBlcnJvcik7XG59XG5cbmZ1bmN0aW9uIHBvc3RFdmVudChldmVudCkge1xuICAgIHZhciBiYXNlVXJsO1xuICAgIGlmIChBcHBNb2RlLm9mZmxpbmUpIHtcbiAgICAgICAgYmFzZVVybCA9IFVSTENvbnN0YW50cy5ERVZFTE9QTUVOVF9FVkVOVFM7XG4gICAgICAgIGNvbnNvbGUubG9nKCdQb3N0aW5nIGV2ZW50OiAnICsgSlNPTi5zdHJpbmdpZnkoZXZlbnQpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBiYXNlVXJsID0gVVJMQ29uc3RhbnRzLlBST0RVQ1RJT05fRVZFTlRTO1xuICAgIH1cbiAgICBkb0dldEpTT05QKGJhc2VVcmwsIFVSTHMuZXZlbnRVcmwoKSwgZXZlbnQsIGZ1bmN0aW9uKCkgeyAvKnN1Y2Nlc3MqLyB9LCBmdW5jdGlvbihlcnJvcikge1xuICAgICAgICAvLyBUT0RPOiBlcnJvciBoYW5kbGluZ1xuICAgICAgICBjb25zb2xlLmxvZygnQW4gZXJyb3Igb2NjdXJyZWQgcG9zdGluZyBldmVudDogJywgZXJyb3IpO1xuICAgIH0pO1xufVxuXG4vLyBJc3N1ZXMgYSBKU09OUCByZXF1ZXN0IHRvIGEgZ2l2ZW4gc2VydmVyLiBUbyBzZW5kIGEgcmVxdWVzdCB0byB0aGUgYXBwbGljYXRpb24gc2VydmVyLCB1c2UgZ2V0SlNPTlAgaW5zdGVhZC5cbmZ1bmN0aW9uIGRvR2V0SlNPTlAoYmFzZVVybCwgdXJsLCBkYXRhLCBzdWNjZXNzLCBlcnJvcikge1xuICAgIHZhciBvcHRpb25zID0ge1xuICAgICAgICB1cmw6IGJhc2VVcmwgKyB1cmwsXG4gICAgICAgIHR5cGU6IFwiZ2V0XCIsXG4gICAgICAgIGNvbnRlbnRUeXBlOiBcImFwcGxpY2F0aW9uL2pzb25cIixcbiAgICAgICAgZGF0YVR5cGU6IFwianNvbnBcIixcbiAgICAgICAgc3VjY2VzczogZnVuY3Rpb24ocmVzcG9uc2UsIHRleHRTdGF0dXMsIFhIUikge1xuICAgICAgICAgICAgLy8gVE9ETzogUmV2aXNpdCB3aGV0aGVyIGl0J3MgcmVhbGx5IGNvb2wgdG8ga2V5IHRoaXMgb24gdGhlIHRleHRTdGF0dXMgb3IgaWYgd2Ugc2hvdWxkIGJlIGxvb2tpbmcgYXRcbiAgICAgICAgICAgIC8vICAgICAgIHRoZSBzdGF0dXMgY29kZSBpbiB0aGUgWEhSXG4gICAgICAgICAgICAvLyBOb3RlOiBUaGUgc2VydmVyIGNvbWVzIGJhY2sgd2l0aCAyMDAgcmVzcG9uc2VzIHdpdGggYSBuZXN0ZWQgc3RhdHVzIG9mIFwiZmFpbFwiLi4uXG4gICAgICAgICAgICBpZiAodGV4dFN0YXR1cyA9PT0gJ3N1Y2Nlc3MnICYmIHJlc3BvbnNlLnN0YXR1cyAhPT0gJ2ZhaWwnICYmICghcmVzcG9uc2UuZGF0YSB8fCByZXNwb25zZS5kYXRhLnN0YXR1cyAhPT0gJ2ZhaWwnKSkge1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3MocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIEZvciBKU09OUCByZXF1ZXN0cywgalF1ZXJ5IGRvZXNuJ3QgY2FsbCBpdCdzIGVycm9yIGNhbGxiYWNrLiBJdCBjYWxscyBzdWNjZXNzIGluc3RlYWQuXG4gICAgICAgICAgICAgICAgZXJyb3IocmVzcG9uc2UubWVzc2FnZSB8fCByZXNwb25zZS5kYXRhLm1lc3NhZ2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBlcnJvcjogZnVuY3Rpb24oeGhyLCB0ZXh0U3RhdHVzLCBtZXNzYWdlKSB7XG4gICAgICAgICAgICAvLyBPa2F5LCBhcHBhcmVudGx5IGpRdWVyeSAqZG9lcyogY2FsbCBpdHMgZXJyb3IgY2FsbGJhY2sgZm9yIEpTT05QIHJlcXVlc3RzIHNvbWV0aW1lcy4uLlxuICAgICAgICAgICAgLy8gU3BlY2lmaWNhbGx5LCB3aGVuIHRoZSByZXNwb25zZSBzdGF0dXMgaXMgT0sgYnV0IGFuIGVycm9yIG9jY3VycyBjbGllbnQtc2lkZSBwcm9jZXNzaW5nIHRoZSByZXNwb25zZS5cbiAgICAgICAgICAgIGVycm9yIChtZXNzYWdlKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgaWYgKGRhdGEpIHtcbiAgICAgICAgb3B0aW9ucy5kYXRhID0geyBqc29uOiBKU09OLnN0cmluZ2lmeShkYXRhKSB9O1xuICAgIH1cbiAgICAkLmFqYXgob3B0aW9ucyk7XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBnZXRKU09OUDogZ2V0SlNPTlAsXG4gICAgcG9zdFBsdXNPbmU6IHBvc3RQbHVzT25lLFxuICAgIHBvc3ROZXdSZWFjdGlvbjogcG9zdE5ld1JlYWN0aW9uLFxuICAgIHBvc3RDb21tZW50OiBwb3N0Q29tbWVudCxcbiAgICBnZXRDb21tZW50czogZ2V0Q29tbWVudHMsXG4gICAgZmV0Y2hMb2NhdGlvbkRldGFpbHM6IGZldGNoTG9jYXRpb25EZXRhaWxzLFxuICAgIHBvc3RFdmVudDogcG9zdEV2ZW50XG59OyIsInZhciBVUkxDb25zdGFudHMgPSByZXF1aXJlKCcuL3VybC1jb25zdGFudHMnKTtcblxuZnVuY3Rpb24gY29tcHV0ZUN1cnJlbnRTY3JpcHRTcmMoKSB7XG4gICAgaWYgKGRvY3VtZW50LmN1cnJlbnRTY3JpcHQpIHtcbiAgICAgICAgcmV0dXJuIGRvY3VtZW50LmN1cnJlbnRTY3JpcHQuc3JjO1xuICAgIH1cbiAgICAvLyBJRSBmYWxsYmFjay4uLlxuICAgIHZhciBzY3JpcHRzID0gZG9jdW1lbnQuYm9keS5nZXRFbGVtZW50c0J5VGFnTmFtZSgnc2NyaXB0Jyk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzY3JpcHRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBzY3JpcHQgPSBzY3JpcHRzW2ldO1xuICAgICAgICBpZiAoc2NyaXB0Lmhhc0F0dHJpYnV0ZSgnc3JjJykpIHtcbiAgICAgICAgICAgIHZhciBzY3JpcHRTcmMgPSBzY3JpcHQuZ2V0QXR0cmlidXRlKCdzcmMnKTtcbiAgICAgICAgICAgIC8vIFRPRE86IHVzZSBhIHJlZ2V4cCBoZXJlXG4gICAgICAgICAgICBpZiAoc2NyaXB0U3JjLmluZGV4T2YoJy9hbnRlbm5hLmpzJykgIT09IC0xIHx8IHNjcmlwdFNyYy5pbmRleE9mKCcvZW5nYWdlLmpzJykgIT0gLTEgfHwgc2NyaXB0U3JjLmluZGV4T2YoJy9lbmdhZ2VfZnVsbC5qcycpICE9IC0xKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNjcmlwdFNyYztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxudmFyIGN1cnJlbnRTY3JpcHRTcmMgPSBjb21wdXRlQ3VycmVudFNjcmlwdFNyYygpIHx8ICcnO1xuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgb2ZmbGluZTogY3VycmVudFNjcmlwdFNyYy5pbmRleE9mKFVSTENvbnN0YW50cy5ERVZFTE9QTUVOVCkgIT09IC0xIHx8IGN1cnJlbnRTY3JpcHRTcmMuaW5kZXhPZihVUkxDb25zdGFudHMuVEVTVCkgIT09IC0xLFxuICAgIHRlc3Q6IGN1cnJlbnRTY3JpcHRTcmMuaW5kZXhPZihVUkxDb25zdGFudHMuVEVTVCkgIT09IC0xLFxuICAgIGRlYnVnOiBjdXJyZW50U2NyaXB0U3JjLmluZGV4T2YoJz9kZWJ1ZycpICE9PSAtMVxufTsiLCJcbnZhciBpc1RvdWNoQnJvd3NlcjtcbnZhciBpc01vYmlsZURldmljZTtcblxuZnVuY3Rpb24gc3VwcG9ydHNUb3VjaCgpIHtcbiAgICBpZiAoaXNUb3VjaEJyb3dzZXIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBpc1RvdWNoQnJvd3NlciA9IChuYXZpZ2F0b3IubXNNYXhUb3VjaFBvaW50cyB8fCBcIm9udG91Y2hzdGFydFwiIGluIHdpbmRvdykgJiYgKCh3aW5kb3cubWF0Y2hNZWRpYShcIm9ubHkgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjhweClcIikpLm1hdGNoZXMpO1xuICAgIH1cbiAgICByZXR1cm4gaXNUb3VjaEJyb3dzZXI7XG59XG5cbmZ1bmN0aW9uIGlzTW9iaWxlKCkge1xuICAgIGlmIChpc01vYmlsZURldmljZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGlzTW9iaWxlRGV2aWNlID0gc3VwcG9ydHNUb3VjaCgpICYmICgod2luZG93Lm1hdGNoTWVkaWEoXCJvbmx5IHNjcmVlbiBhbmQgKG1heC13aWR0aDogNDgwcHgpXCIpKS5tYXRjaGVzKTtcbiAgICB9XG4gICAgcmV0dXJuIGlzTW9iaWxlRGV2aWNlO1xufVxuXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHN1cHBvcnRzVG91Y2g6IHN1cHBvcnRzVG91Y2gsXG4gICAgaXNNb2JpbGU6IGlzTW9iaWxlXG59OyIsIlxudmFyIGFudHVpZCA9IDA7IC8vIFwiZ2xvYmFsbHlcIiB1bmlxdWUgSUQgdGhhdCB3ZSB1c2UgdG8gdGFnIGNhbGxiYWNrIGZ1bmN0aW9ucyBmb3IgbGF0ZXIgcmV0cmlldmFsLiAoVGhpcyBpcyBob3cgXCJvZmZcIiB3b3Jrcy4pXG5cbmZ1bmN0aW9uIGNyZWF0ZUNhbGxiYWNrcygpIHtcblxuICAgIHZhciBjYWxsYmFja3MgPSB7fTtcblxuICAgIGZ1bmN0aW9uIGFkZENhbGxiYWNrKGNhbGxiYWNrKSB7XG4gICAgICAgIGlmIChjYWxsYmFjay5hbnR1aWQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY2FsbGJhY2suYW50dWlkID0gYW50dWlkKys7XG4gICAgICAgIH1cbiAgICAgICAgY2FsbGJhY2tzW2NhbGxiYWNrLmFudHVpZF0gPSBjYWxsYmFjaztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByZW1vdmVDYWxsYmFjayhjYWxsYmFjaykge1xuICAgICAgICBpZiAoY2FsbGJhY2suYW50dWlkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGRlbGV0ZSBjYWxsYmFja3NbY2FsbGJhY2suYW50dWlkXTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldENhbGxiYWNrcygpIHtcbiAgICAgICAgdmFyIGFsbENhbGxiYWNrcyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBrZXkgaW4gY2FsbGJhY2tzKSB7XG4gICAgICAgICAgICBpZiAoY2FsbGJhY2tzLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgICBhbGxDYWxsYmFja3MucHVzaChjYWxsYmFja3Nba2V5XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGFsbENhbGxiYWNrcztcbiAgICB9XG5cbiAgICAvLyBDb252ZW5pZW5jZSBmdW5jdGlvbiB0aGF0IGludm9rZXMgYWxsIGNhbGxiYWNrcyB3aXRoIG5vIHBhcmFtZXRlcnMuIEFueSBjYWxsYmFja3MgdGhhdCBuZWVkIHBhcmFtcyBjYW4gYmUgY2FsbGVkXG4gICAgLy8gYnkgY2xpZW50cyB1c2luZyBnZXRDYWxsYmFja3MoKVxuICAgIGZ1bmN0aW9uIGludm9rZUFsbCgpIHtcbiAgICAgICAgZm9yICh2YXIga2V5IGluIGNhbGxiYWNrcykge1xuICAgICAgICAgICAgaWYgKGNhbGxiYWNrcy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2tzW2tleV0oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGlzRW1wdHkoKSB7XG4gICAgICAgIHJldHVybiBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhjYWxsYmFja3MpLmxlbmd0aCA9PT0gMDtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBhZGQ6IGFkZENhbGxiYWNrLFxuICAgICAgICByZW1vdmU6IHJlbW92ZUNhbGxiYWNrLFxuICAgICAgICBnZXQ6IGdldENhbGxiYWNrcyxcbiAgICAgICAgaXNFbXB0eTogaXNFbXB0eSxcbiAgICAgICAgaW52b2tlQWxsOiBpbnZva2VBbGxcbiAgICB9XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGU6IGNyZWF0ZUNhbGxiYWNrc1xufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciBNRDUgPSByZXF1aXJlKCcuL21kNScpO1xuXG4vLyBUT0RPOiBUaGlzIGlzIGp1c3QgY29weS9wYXN0ZWQgZnJvbSBlbmdhZ2VfZnVsbFxuLy8gVE9ETzogVGhlIGNvZGUgaXMgbG9va2luZyBmb3IgLmFudF9pbmRpY2F0b3IgdG8gc2VlIGlmIGl0J3MgYWxyZWFkeSBiZWVuIGhhc2hlZC4gUmV2aWV3LlxuLy8gVE9ETzogQ2FuIHdlIGltcGxlbWVudCBhIHNpbXBsZXIgdmVyc2lvbiBvZiB0aGlzIGZvciBub24tbGVnYWN5IGNvZGUgdXNpbmcgJGVsZW1lbnQudGV4dCgpP1xuZnVuY3Rpb24gZ2V0Q2xlYW5UZXh0KCRkb21Ob2RlKSB7XG4gICAgLy8gQU5ULnV0aWwuZ2V0Q2xlYW5UZXh0XG4gICAgLy8gY29tbW9uIGZ1bmN0aW9uIGZvciBjbGVhbmluZyB0aGUgdGV4dCBub2RlIHRleHQuICByaWdodCBub3csIGl0J3MgcmVtb3Zpbmcgc3BhY2VzLCB0YWJzLCBuZXdsaW5lcywgYW5kIHRoZW4gZG91YmxlIHNwYWNlc1xuXG4gICAgdmFyICRub2RlID0gJGRvbU5vZGUuY2xvbmUoKTtcblxuICAgICRub2RlLmZpbmQoJy5hbnQsIC5hbnQtY3VzdG9tLWN0YS1jb250YWluZXInKS5yZW1vdmUoKTtcblxuICAgIC8vbWFrZSBzdXJlIGl0IGRvZXNudCBhbHJlZHkgaGF2ZSBpbiBpbmRpY2F0b3IgLSBpdCBzaG91bGRuJ3QuXG4gICAgdmFyICRpbmRpY2F0b3IgPSAkbm9kZS5maW5kKCcuYW50X2luZGljYXRvcicpO1xuICAgIGlmKCRpbmRpY2F0b3IubGVuZ3RoKXtcbiAgICAgICAgLy90b2RvOiBzZW5kIHVzIGFuIGVycm9yIHJlcG9ydCAtIHRoaXMgbWF5IHN0aWxsIGJlIGhhcHBlbmluZyBmb3Igc2xpZGVzaG93cy5cbiAgICAgICAgLy9UaGlzIGZpeCB3b3JrcyBmaW5lLCBidXQgd2Ugc2hvdWxkIGZpeCB0aGUgY29kZSB0byBoYW5kbGUgaXQgYmVmb3JlIGhlcmUuXG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBnZXQgdGhlIG5vZGUncyB0ZXh0IGFuZCBzbWFzaCBjYXNlXG4gICAgLy8gVE9ETzogPGJyPiB0YWdzIGFuZCBibG9jay1sZXZlbCB0YWdzIGNhbiBzY3JldyB1cCB3b3Jkcy4gIGV4OlxuICAgIC8vIGhlbGxvPGJyPmhvdyBhcmUgeW91PyAgIGhlcmUgYmVjb21lc1xuICAgIC8vIGhlbGxvaG93IGFyZSB5b3U/ICAgIDwtLSBubyBzcGFjZSB3aGVyZSB0aGUgPGJyPiB3YXMuICBiYWQuXG4gICAgdmFyIG5vZGVfdGV4dCA9ICQudHJpbSggJG5vZGUuaHRtbCgpLnJlcGxhY2UoLzwgKmJyICpcXC8/Pi9naSwgJyAnKSApO1xuICAgIHZhciBib2R5ID0gJC50cmltKCAkKCBcIjxkaXY+XCIgKyBub2RlX3RleHQgKyBcIjwvZGl2PlwiICkudGV4dCgpLnRvTG93ZXJDYXNlKCkgKTtcblxuICAgIGlmKCBib2R5ICYmIHR5cGVvZiBib2R5ID09IFwic3RyaW5nXCIgJiYgYm9keSAhPT0gXCJcIiApIHtcbiAgICAgICAgdmFyIGZpcnN0cGFzcyA9IGJvZHkucmVwbGFjZSgvW1xcblxcclxcdF0rL2dpLCcgJykucmVwbGFjZSgpLnJlcGxhY2UoL1xcc3syLH0vZywnICcpO1xuICAgICAgICAvLyBzZWVpbmcgaWYgdGhpcyBoZWxwcyB0aGUgcHJvcHViIGlzc3VlIC0gdG8gdHJpbSBhZ2Fpbi4gIFdoZW4gaSBydW4gdGhpcyBsaW5lIGFib3ZlIGl0IGxvb2tzIGxpa2UgdGhlcmUgaXMgc3RpbGwgd2hpdGUgc3BhY2UuXG4gICAgICAgIHJldHVybiAkLnRyaW0oZmlyc3RwYXNzKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGhhc2hUZXh0KGVsZW1lbnQpIHtcbiAgICAvLyBUT0RPOiBIYW5kbGUgdGhlIGNhc2Ugd2hlcmUgbXVsdGlwbGUgaW5zdGFuY2VzIG9mIHRoZSBzYW1lIHRleHQgYXBwZWFyIG9uIHRoZSBwYWdlLiBOZWVkIHRvIGFkZCBhbiBpbmNyZW1lbnQgdG9cbiAgICAvLyB0aGUgaGFzaFRleHQuIChUaGlzIGNoZWNrIGhhcyB0byBiZSBzY29wZWQgdG8gYSBwb3N0KVxuICAgIHZhciB0ZXh0ID0gZ2V0Q2xlYW5UZXh0KGVsZW1lbnQpO1xuICAgIGlmICh0ZXh0KSB7XG4gICAgICAgIHZhciBoYXNoVGV4dCA9IFwicmRyLXRleHQtXCIgKyB0ZXh0O1xuICAgICAgICByZXR1cm4gTUQ1LmhleF9tZDUoaGFzaFRleHQpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gaGFzaFVybCh1cmwpIHtcbiAgICByZXR1cm4gTUQ1LmhleF9tZDUodXJsKTtcbn1cblxuZnVuY3Rpb24gaGFzaEltYWdlKGltYWdlVXJsKSB7XG4gICAgaWYgKGltYWdlVXJsICYmIGltYWdlVXJsLmxlbmd0aCA+IDApIHtcbiAgICAgICAgdmFyIGhhc2hUZXh0ID0gJ3Jkci1pbWctJyArIGltYWdlVXJsO1xuICAgICAgICByZXR1cm4gTUQ1LmhleF9tZDUoaGFzaFRleHQpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gaGFzaE1lZGlhKG1lZGlhVXJsKSB7XG4gICAgaWYgKG1lZGlhVXJsICYmIG1lZGlhVXJsLmxlbmd0aCA+IDApIHtcbiAgICAgICAgdmFyIGhhc2hUZXh0ID0gJ3Jkci1tZWRpYS0nICsgbWVkaWFVcmw7XG4gICAgICAgIHJldHVybiBNRDUuaGV4X21kNShoYXNoVGV4dCk7XG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgaGFzaFRleHQ6IGhhc2hUZXh0LFxuICAgIGhhc2hJbWFnZTogaGFzaEltYWdlLFxuICAgIGhhc2hNZWRpYTogaGFzaE1lZGlhLFxuICAgIGhhc2hVcmw6IGhhc2hVcmxcbn07IiwiXG52YXIgbG9hZGVkalF1ZXJ5O1xudmFyIGNhbGxiYWNrcyA9IFtdO1xuXG4vLyBOb3RpZmllcyB0aGUgalF1ZXJ5IHByb3ZpZGVyIHRoYXQgd2UndmUgbG9hZGVkIHRoZSBqUXVlcnkgbGlicmFyeS5cbmZ1bmN0aW9uIGxvYWRlZCgpIHtcbiAgICBsb2FkZWRqUXVlcnkgPSBqUXVlcnkubm9Db25mbGljdCgpO1xuICAgIG5vdGlmeUNhbGxiYWNrcygpO1xufVxuXG5mdW5jdGlvbiBub3RpZnlDYWxsYmFja3MoKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjYWxsYmFja3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY2FsbGJhY2tzW2ldKGxvYWRlZGpRdWVyeSk7XG4gICAgfVxuICAgIGNhbGxiYWNrcyA9IFtdO1xufVxuXG4vLyBSZWdpc3RlcnMgdGhlIGdpdmVuIGNhbGxiYWNrIHRvIGJlIG5vdGlmaWVkIHdoZW4gb3VyIHZlcnNpb24gb2YgalF1ZXJ5IGlzIGxvYWRlZC5cbmZ1bmN0aW9uIG9uTG9hZChjYWxsYmFjaykge1xuICAgIGlmIChsb2FkZWRqUXVlcnkpIHtcbiAgICAgICAgY2FsbGJhY2sobG9hZGVkalF1ZXJ5KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBjYWxsYmFja3MucHVzaChjYWxsYmFjayk7XG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgbG9hZGVkOiBsb2FkZWQsXG4gICAgb25Mb2FkOiBvbkxvYWRcbn07IiwiXG4vLyBUT0RPOiBUaGlzIGNvZGUgaXMganVzdCBjb3BpZWQgZnJvbSBlbmdhZ2VfZnVsbC5qcy4gUmV2aWV3IHdoZXRoZXIgd2Ugd2FudCB0byBrZWVwIGl0IGFzLWlzLlxuXG52YXIgQU5UID0ge1xuICAgIHV0aWw6IHtcbiAgICAgICAgbWQ1OiB7XG4gICAgICAgICAgICBoZXhjYXNlOjAsXG4gICAgICAgICAgICBiNjRwYWQ6XCJcIixcbiAgICAgICAgICAgIGNocnN6OjgsXG4gICAgICAgICAgICBoZXhfbWQ1OiBmdW5jdGlvbihzKXtyZXR1cm4gQU5ULnV0aWwubWQ1LmJpbmwyaGV4KEFOVC51dGlsLm1kNS5jb3JlX21kNShBTlQudXRpbC5tZDUuc3RyMmJpbmwocykscy5sZW5ndGgqQU5ULnV0aWwubWQ1LmNocnN6KSk7fSxcbiAgICAgICAgICAgIGNvcmVfbWQ1OiBmdW5jdGlvbih4LGxlbil7eFtsZW4+PjVdfD0weDgwPDwoKGxlbiklMzIpO3hbKCgobGVuKzY0KT4+PjkpPDw0KSsxNF09bGVuO3ZhciBhPTE3MzI1ODQxOTM7dmFyIGI9LTI3MTczMzg3OTt2YXIgYz0tMTczMjU4NDE5NDt2YXIgZD0yNzE3MzM4Nzg7Zm9yKHZhciBpPTA7aTx4Lmxlbmd0aDtpKz0xNil7dmFyIG9sZGE9YTt2YXIgb2xkYj1iO3ZhciBvbGRjPWM7dmFyIG9sZGQ9ZDthPUFOVC51dGlsLm1kNS5tZDVfZmYoYSxiLGMsZCx4W2krMF0sNywtNjgwODc2OTM2KTtkPUFOVC51dGlsLm1kNS5tZDVfZmYoZCxhLGIsYyx4W2krMV0sMTIsLTM4OTU2NDU4Nik7Yz1BTlQudXRpbC5tZDUubWQ1X2ZmKGMsZCxhLGIseFtpKzJdLDE3LDYwNjEwNTgxOSk7Yj1BTlQudXRpbC5tZDUubWQ1X2ZmKGIsYyxkLGEseFtpKzNdLDIyLC0xMDQ0NTI1MzMwKTthPUFOVC51dGlsLm1kNS5tZDVfZmYoYSxiLGMsZCx4W2krNF0sNywtMTc2NDE4ODk3KTtkPUFOVC51dGlsLm1kNS5tZDVfZmYoZCxhLGIsYyx4W2krNV0sMTIsMTIwMDA4MDQyNik7Yz1BTlQudXRpbC5tZDUubWQ1X2ZmKGMsZCxhLGIseFtpKzZdLDE3LC0xNDczMjMxMzQxKTtiPUFOVC51dGlsLm1kNS5tZDVfZmYoYixjLGQsYSx4W2krN10sMjIsLTQ1NzA1OTgzKTthPUFOVC51dGlsLm1kNS5tZDVfZmYoYSxiLGMsZCx4W2krOF0sNywxNzcwMDM1NDE2KTtkPUFOVC51dGlsLm1kNS5tZDVfZmYoZCxhLGIsYyx4W2krOV0sMTIsLTE5NTg0MTQ0MTcpO2M9QU5ULnV0aWwubWQ1Lm1kNV9mZihjLGQsYSxiLHhbaSsxMF0sMTcsLTQyMDYzKTtiPUFOVC51dGlsLm1kNS5tZDVfZmYoYixjLGQsYSx4W2krMTFdLDIyLC0xOTkwNDA0MTYyKTthPUFOVC51dGlsLm1kNS5tZDVfZmYoYSxiLGMsZCx4W2krMTJdLDcsMTgwNDYwMzY4Mik7ZD1BTlQudXRpbC5tZDUubWQ1X2ZmKGQsYSxiLGMseFtpKzEzXSwxMiwtNDAzNDExMDEpO2M9QU5ULnV0aWwubWQ1Lm1kNV9mZihjLGQsYSxiLHhbaSsxNF0sMTcsLTE1MDIwMDIyOTApO2I9QU5ULnV0aWwubWQ1Lm1kNV9mZihiLGMsZCxhLHhbaSsxNV0sMjIsMTIzNjUzNTMyOSk7YT1BTlQudXRpbC5tZDUubWQ1X2dnKGEsYixjLGQseFtpKzFdLDUsLTE2NTc5NjUxMCk7ZD1BTlQudXRpbC5tZDUubWQ1X2dnKGQsYSxiLGMseFtpKzZdLDksLTEwNjk1MDE2MzIpO2M9QU5ULnV0aWwubWQ1Lm1kNV9nZyhjLGQsYSxiLHhbaSsxMV0sMTQsNjQzNzE3NzEzKTtiPUFOVC51dGlsLm1kNS5tZDVfZ2coYixjLGQsYSx4W2krMF0sMjAsLTM3Mzg5NzMwMik7YT1BTlQudXRpbC5tZDUubWQ1X2dnKGEsYixjLGQseFtpKzVdLDUsLTcwMTU1ODY5MSk7ZD1BTlQudXRpbC5tZDUubWQ1X2dnKGQsYSxiLGMseFtpKzEwXSw5LDM4MDE2MDgzKTtjPUFOVC51dGlsLm1kNS5tZDVfZ2coYyxkLGEsYix4W2krMTVdLDE0LC02NjA0NzgzMzUpO2I9QU5ULnV0aWwubWQ1Lm1kNV9nZyhiLGMsZCxhLHhbaSs0XSwyMCwtNDA1NTM3ODQ4KTthPUFOVC51dGlsLm1kNS5tZDVfZ2coYSxiLGMsZCx4W2krOV0sNSw1Njg0NDY0MzgpO2Q9QU5ULnV0aWwubWQ1Lm1kNV9nZyhkLGEsYixjLHhbaSsxNF0sOSwtMTAxOTgwMzY5MCk7Yz1BTlQudXRpbC5tZDUubWQ1X2dnKGMsZCxhLGIseFtpKzNdLDE0LC0xODczNjM5NjEpO2I9QU5ULnV0aWwubWQ1Lm1kNV9nZyhiLGMsZCxhLHhbaSs4XSwyMCwxMTYzNTMxNTAxKTthPUFOVC51dGlsLm1kNS5tZDVfZ2coYSxiLGMsZCx4W2krMTNdLDUsLTE0NDQ2ODE0NjcpO2Q9QU5ULnV0aWwubWQ1Lm1kNV9nZyhkLGEsYixjLHhbaSsyXSw5LC01MTQwMzc4NCk7Yz1BTlQudXRpbC5tZDUubWQ1X2dnKGMsZCxhLGIseFtpKzddLDE0LDE3MzUzMjg0NzMpO2I9QU5ULnV0aWwubWQ1Lm1kNV9nZyhiLGMsZCxhLHhbaSsxMl0sMjAsLTE5MjY2MDc3MzQpO2E9QU5ULnV0aWwubWQ1Lm1kNV9oaChhLGIsYyxkLHhbaSs1XSw0LC0zNzg1NTgpO2Q9QU5ULnV0aWwubWQ1Lm1kNV9oaChkLGEsYixjLHhbaSs4XSwxMSwtMjAyMjU3NDQ2Myk7Yz1BTlQudXRpbC5tZDUubWQ1X2hoKGMsZCxhLGIseFtpKzExXSwxNiwxODM5MDMwNTYyKTtiPUFOVC51dGlsLm1kNS5tZDVfaGgoYixjLGQsYSx4W2krMTRdLDIzLC0zNTMwOTU1Nik7YT1BTlQudXRpbC5tZDUubWQ1X2hoKGEsYixjLGQseFtpKzFdLDQsLTE1MzA5OTIwNjApO2Q9QU5ULnV0aWwubWQ1Lm1kNV9oaChkLGEsYixjLHhbaSs0XSwxMSwxMjcyODkzMzUzKTtjPUFOVC51dGlsLm1kNS5tZDVfaGgoYyxkLGEsYix4W2krN10sMTYsLTE1NTQ5NzYzMik7Yj1BTlQudXRpbC5tZDUubWQ1X2hoKGIsYyxkLGEseFtpKzEwXSwyMywtMTA5NDczMDY0MCk7YT1BTlQudXRpbC5tZDUubWQ1X2hoKGEsYixjLGQseFtpKzEzXSw0LDY4MTI3OTE3NCk7ZD1BTlQudXRpbC5tZDUubWQ1X2hoKGQsYSxiLGMseFtpKzBdLDExLC0zNTg1MzcyMjIpO2M9QU5ULnV0aWwubWQ1Lm1kNV9oaChjLGQsYSxiLHhbaSszXSwxNiwtNzIyNTIxOTc5KTtiPUFOVC51dGlsLm1kNS5tZDVfaGgoYixjLGQsYSx4W2krNl0sMjMsNzYwMjkxODkpO2E9QU5ULnV0aWwubWQ1Lm1kNV9oaChhLGIsYyxkLHhbaSs5XSw0LC02NDAzNjQ0ODcpO2Q9QU5ULnV0aWwubWQ1Lm1kNV9oaChkLGEsYixjLHhbaSsxMl0sMTEsLTQyMTgxNTgzNSk7Yz1BTlQudXRpbC5tZDUubWQ1X2hoKGMsZCxhLGIseFtpKzE1XSwxNiw1MzA3NDI1MjApO2I9QU5ULnV0aWwubWQ1Lm1kNV9oaChiLGMsZCxhLHhbaSsyXSwyMywtOTk1MzM4NjUxKTthPUFOVC51dGlsLm1kNS5tZDVfaWkoYSxiLGMsZCx4W2krMF0sNiwtMTk4NjMwODQ0KTtkPUFOVC51dGlsLm1kNS5tZDVfaWkoZCxhLGIsYyx4W2krN10sMTAsMTEyNjg5MTQxNSk7Yz1BTlQudXRpbC5tZDUubWQ1X2lpKGMsZCxhLGIseFtpKzE0XSwxNSwtMTQxNjM1NDkwNSk7Yj1BTlQudXRpbC5tZDUubWQ1X2lpKGIsYyxkLGEseFtpKzVdLDIxLC01NzQzNDA1NSk7YT1BTlQudXRpbC5tZDUubWQ1X2lpKGEsYixjLGQseFtpKzEyXSw2LDE3MDA0ODU1NzEpO2Q9QU5ULnV0aWwubWQ1Lm1kNV9paShkLGEsYixjLHhbaSszXSwxMCwtMTg5NDk4NjYwNik7Yz1BTlQudXRpbC5tZDUubWQ1X2lpKGMsZCxhLGIseFtpKzEwXSwxNSwtMTA1MTUyMyk7Yj1BTlQudXRpbC5tZDUubWQ1X2lpKGIsYyxkLGEseFtpKzFdLDIxLC0yMDU0OTIyNzk5KTthPUFOVC51dGlsLm1kNS5tZDVfaWkoYSxiLGMsZCx4W2krOF0sNiwxODczMzEzMzU5KTtkPUFOVC51dGlsLm1kNS5tZDVfaWkoZCxhLGIsYyx4W2krMTVdLDEwLC0zMDYxMTc0NCk7Yz1BTlQudXRpbC5tZDUubWQ1X2lpKGMsZCxhLGIseFtpKzZdLDE1LC0xNTYwMTk4MzgwKTtiPUFOVC51dGlsLm1kNS5tZDVfaWkoYixjLGQsYSx4W2krMTNdLDIxLDEzMDkxNTE2NDkpO2E9QU5ULnV0aWwubWQ1Lm1kNV9paShhLGIsYyxkLHhbaSs0XSw2LC0xNDU1MjMwNzApO2Q9QU5ULnV0aWwubWQ1Lm1kNV9paShkLGEsYixjLHhbaSsxMV0sMTAsLTExMjAyMTAzNzkpO2M9QU5ULnV0aWwubWQ1Lm1kNV9paShjLGQsYSxiLHhbaSsyXSwxNSw3MTg3ODcyNTkpO2I9QU5ULnV0aWwubWQ1Lm1kNV9paShiLGMsZCxhLHhbaSs5XSwyMSwtMzQzNDg1NTUxKTthPUFOVC51dGlsLm1kNS5zYWZlX2FkZChhLG9sZGEpO2I9QU5ULnV0aWwubWQ1LnNhZmVfYWRkKGIsb2xkYik7Yz1BTlQudXRpbC5tZDUuc2FmZV9hZGQoYyxvbGRjKTtkPUFOVC51dGlsLm1kNS5zYWZlX2FkZChkLG9sZGQpO30gcmV0dXJuIEFycmF5KGEsYixjLGQpO30sXG4gICAgICAgICAgICBtZDVfY21uOiBmdW5jdGlvbihxLGEsYix4LHMsdCl7cmV0dXJuIEFOVC51dGlsLm1kNS5zYWZlX2FkZChBTlQudXRpbC5tZDUuYml0X3JvbChBTlQudXRpbC5tZDUuc2FmZV9hZGQoQU5ULnV0aWwubWQ1LnNhZmVfYWRkKGEscSksQU5ULnV0aWwubWQ1LnNhZmVfYWRkKHgsdCkpLHMpLGIpO30sXG4gICAgICAgICAgICBtZDVfZmY6IGZ1bmN0aW9uKGEsYixjLGQseCxzLHQpe3JldHVybiBBTlQudXRpbC5tZDUubWQ1X2NtbigoYiZjKXwoKH5iKSZkKSxhLGIseCxzLHQpO30sXG4gICAgICAgICAgICBtZDVfZ2c6IGZ1bmN0aW9uKGEsYixjLGQseCxzLHQpe3JldHVybiBBTlQudXRpbC5tZDUubWQ1X2NtbigoYiZkKXwoYyYofmQpKSxhLGIseCxzLHQpO30sXG4gICAgICAgICAgICBtZDVfaGg6IGZ1bmN0aW9uKGEsYixjLGQseCxzLHQpe3JldHVybiBBTlQudXRpbC5tZDUubWQ1X2NtbihiXmNeZCxhLGIseCxzLHQpO30sXG4gICAgICAgICAgICBtZDVfaWk6IGZ1bmN0aW9uKGEsYixjLGQseCxzLHQpe3JldHVybiBBTlQudXRpbC5tZDUubWQ1X2NtbihjXihifCh+ZCkpLGEsYix4LHMsdCk7fSxcbiAgICAgICAgICAgIHNhZmVfYWRkOiBmdW5jdGlvbih4LHkpe3ZhciBsc3c9KHgmMHhGRkZGKSsoeSYweEZGRkYpO3ZhciBtc3c9KHg+PjE2KSsoeT4+MTYpKyhsc3c+PjE2KTtyZXR1cm4obXN3PDwxNil8KGxzdyYweEZGRkYpO30sXG4gICAgICAgICAgICBiaXRfcm9sOiBmdW5jdGlvbihudW0sY250KXtyZXR1cm4obnVtPDxjbnQpfChudW0+Pj4oMzItY250KSk7fSxcbiAgICAgICAgICAgIC8vdGhlIGxpbmUgYmVsb3cgaXMgY2FsbGVkIG91dCBieSBqc0xpbnQgYmVjYXVzZSBpdCB1c2VzIEFycmF5KCkgaW5zdGVhZCBvZiBbXS4gIFdlIGNhbiBpZ25vcmUsIG9yIEknbSBzdXJlIHdlIGNvdWxkIGNoYW5nZSBpdCBpZiB3ZSB3YW50ZWQgdG8uXG4gICAgICAgICAgICBzdHIyYmlubDogZnVuY3Rpb24oc3RyKXt2YXIgYmluPUFycmF5KCk7dmFyIG1hc2s9KDE8PEFOVC51dGlsLm1kNS5jaHJzeiktMTtmb3IodmFyIGk9MDtpPHN0ci5sZW5ndGgqQU5ULnV0aWwubWQ1LmNocnN6O2krPUFOVC51dGlsLm1kNS5jaHJzeil7YmluW2k+PjVdfD0oc3RyLmNoYXJDb2RlQXQoaS9BTlQudXRpbC5tZDUuY2hyc3opJm1hc2spPDwoaSUzMik7fXJldHVybiBiaW47fSxcbiAgICAgICAgICAgIGJpbmwyaGV4OiBmdW5jdGlvbihiaW5hcnJheSl7dmFyIGhleF90YWI9QU5ULnV0aWwubWQ1LmhleGNhc2U/XCIwMTIzNDU2Nzg5QUJDREVGXCI6XCIwMTIzNDU2Nzg5YWJjZGVmXCI7dmFyIHN0cj1cIlwiO2Zvcih2YXIgaT0wO2k8YmluYXJyYXkubGVuZ3RoKjQ7aSsrKXtzdHIrPWhleF90YWIuY2hhckF0KChiaW5hcnJheVtpPj4yXT4+KChpJTQpKjgrNCkpJjB4RikraGV4X3RhYi5jaGFyQXQoKGJpbmFycmF5W2k+PjJdPj4oKGklNCkqOCkpJjB4Rik7fSByZXR1cm4gc3RyO31cbiAgICAgICAgfVxuICAgIH1cbn07XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBoZXhfbWQ1OiBBTlQudXRpbC5tZDUuaGV4X21kNVxufTsiLCIvL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgJ3N1bW1hcnktd2lkZ2V0X3JlYWN0aW9ucyc6ICdSZWFjdGlvbnMnLFxuICAgICdzdW1tYXJ5LXdpZGdldF9yZWFjdGlvbnNfb25lJzogJzEgUmVhY3Rpb24nLFxuICAgICdzdW1tYXJ5LXdpZGdldF9yZWFjdGlvbnNfbWFueSc6ICd7MH0gUmVhY3Rpb25zJyxcblxuICAgICdyZWFjdGlvbnMtd2lkZ2V0X3RpdGxlJzogJ1JlYWN0aW9ucycsXG4gICAgJ3JlYWN0aW9ucy13aWRnZXRfdGl0bGVfdGhhbmtzJzogJ1RoYW5rcyBmb3IgeW91ciByZWFjdGlvbiEnLFxuXG4gICAgJ3JlYWN0aW9ucy1wYWdlX25vX3JlYWN0aW9ucyc6ICdObyByZWFjdGlvbnMgeWV0IScsXG4gICAgJ3JlYWN0aW9ucy1wYWdlX3RoaW5rJzogJ1doYXQgZG8geW91IHRoaW5rPycsXG5cbiAgICAnbWVkaWEtaW5kaWNhdG9yX3RoaW5rJzogJ1doYXQgZG8geW91IHRoaW5rPycsXG5cbiAgICAncG9wdXAtd2lkZ2V0X3RoaW5rJzogJ1doYXQgZG8geW91IHRoaW5rPycsXG5cbiAgICAnZGVmYXVsdHMtcGFnZV9hZGQnOiAnKyBBZGQgWW91ciBPd24nLFxuICAgICdkZWZhdWx0cy1wYWdlX29rJzogJ29rJyxcblxuICAgICdjb25maXJtYXRpb24tcGFnZV9zaGFyZSc6ICdTaGFyZSB5b3VyIHJlYWN0aW9uOicsXG5cbiAgICAnY29tbWVudHMtcGFnZV9iYWNrJzogJ0JhY2snLFxuICAgICdjb21tZW50cy1wYWdlX2hlYWRlcic6ICcoezB9KSBDb21tZW50czonLFxuXG4gICAgJ2NvbW1lbnQtYXJlYV9hZGQnOiAnQ29tbWVudCcsXG4gICAgJ2NvbW1lbnQtYXJlYV9wbGFjZWhvbGRlcic6ICdBZGQgY29tbWVudHMgb3IgI2hhc2h0YWdzJyxcbiAgICAnY29tbWVudC1hcmVhX3RoYW5rcyc6ICdUaGFua3MgZm9yIHlvdXIgY29tbWVudC4nLFxuICAgICdjb21tZW50LWFyZWFfY291bnQnOiAnPHNwYW4gY2xhc3M9XCJhbnRlbm5hLWNvbW1lbnQtY291bnRcIj48L3NwYW4+IGNoYXJhY3RlcnMgbGVmdCcsXG5cbiAgICAnbG9jYXRpb25zLXBhZ2VfcGFnZWxldmVsJzogJ1RvIHRoaXMgd2hvbGUgcGFnZScsXG4gICAgJ2xvY2F0aW9ucy1wYWdlX2NvdW50X29uZSc6ICc8c3BhbiBjbGFzcz1cImFudGVubmEtbG9jYXRpb24tY291bnRcIj4xPC9zcGFuPjxicj5yZWFjdGlvbicsXG4gICAgJ2xvY2F0aW9ucy1wYWdlX2NvdW50X21hbnknOiAnPHNwYW4gY2xhc3M9XCJhbnRlbm5hLWxvY2F0aW9uLWNvdW50XCI+ezB9PC9zcGFuPjxicj5yZWFjdGlvbnMnLFxuICAgICdsb2NhdGlvbnMtcGFnZV9iYWNrJzogJ0JhY2snLFxuXG4gICAgJ2NhbGwtdG8tYWN0aW9uLWxhYmVsX3Jlc3BvbnNlcyc6ICdSZXNwb25zZXMnLFxuICAgICdjYWxsLXRvLWFjdGlvbi1sYWJlbF9yZXNwb25zZXNfb25lJzogJzEgUmVzcG9uc2UnLFxuICAgICdjYWxsLXRvLWFjdGlvbi1sYWJlbF9yZXNwb25zZXNfbWFueSc6ICd7MH0gUmVzcG9uc2VzJ1xufTsiLCIvL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgJ3N1bW1hcnktd2lkZ2V0X3JlYWN0aW9ucyc6IFwiUmVhY2Npb25lc1wiLFxuICAgICdzdW1tYXJ5LXdpZGdldF9yZWFjdGlvbnNfb25lJzogXCIxIFJlYWNjacOzblwiLFxuICAgICdzdW1tYXJ5LXdpZGdldF9yZWFjdGlvbnNfbWFueSc6IFwiezB9IFJlYWNjaW9uZXNcIixcblxuICAgICdyZWFjdGlvbnMtd2lkZ2V0X3RpdGxlJzogXCJSZWFjY2lvbmVzXCIsXG4gICAgJ3JlYWN0aW9ucy13aWRnZXRfdGl0bGVfdGhhbmtzJzogJ0dyYWNpYXMgcG9yIHR1IHJlYWNjacOzbiEnLFxuXG4gICAgJ3JlYWN0aW9ucy1wYWdlX25vX3JlYWN0aW9ucyc6ICdObyByZWFjY2lvbmVzIScsIC8vIFRPRE86IG5lZWQgYSB0cmFuc2xhdGlvbiBvZiBcIk5vIHJlYWN0aW9ucyB5ZXQhXCJcbiAgICAncmVhY3Rpb25zLXBhZ2VfdGhpbmsnOiAnwr9RdcOpIHBpZW5zYXM/JyxcblxuICAgICdtZWRpYS1pbmRpY2F0b3JfdGhpbmsnOiAnwr9RdcOpIHBpZW5zYXM/JyxcblxuICAgICdwb3B1cC13aWRnZXRfdGhpbmsnOiAnwr9RdcOpIHBpZW5zYXM/JyxcblxuICAgICdkZWZhdWx0cy1wYWdlX2FkZCc6ICcrIEHDsWFkZSBsbyB0dXlvJyxcbiAgICAnZGVmYXVsdHMtcGFnZV9vayc6ICdvaycsIC8vIFRPRE86IGlzIHRoaXMgcmlnaHQ/ICdhY2NlcHRhcic/XG5cbiAgICAnY29uZmlybWF0aW9uLXBhZ2Vfc2hhcmUnOiAnQ29tcGFydGUgdHUgcmVhY2Npw7NuOicsXG5cbiAgICAnY29tbWVudHMtcGFnZV9iYWNrJzogJ0NlcnJhcicsIC8vIFRPRE86IG5lZWQgYSB0cmFuc2xhdGlvbiBmb3IgXCJCYWNrXCJcbiAgICAnY29tbWVudHMtcGFnZV9oZWFkZXInOiAnKHswfSkgQ29tZW50YXM6JyxcblxuICAgICdjb21tZW50LWFyZWFfYWRkJzogJ0NvbWVudGEnLFxuICAgICdjb21tZW50LWFyZWFfcGxhY2Vob2xkZXInOiAnQcOxYWRlIGNvbWVudGFyaW9zIG8gI2hhc2h0YWdzJyxcbiAgICAnY29tbWVudC1hcmVhX3RoYW5rcyc6ICdHcmFjaWFzIHBvciB0dSByZWFjY2nDs24uJyxcbiAgICAnY29tbWVudC1hcmVhX2NvdW50JzogJ1F1ZWRhbiA8c3BhbiBjbGFzcz1cImFudGVubmEtY29tbWVudC1jb3VudFwiPjwvc3Bhbj4gY2FyYWN0ZXJlcycsXG5cbiAgICAnbG9jYXRpb25zLXBhZ2VfcGFnZWxldmVsJzogJ0EgZXN0YSBww6FnaW5hJywgLy8gVE9ETzogbmVlZCBhIHRyYW5zbGF0aW9uIG9mIFwiVG8gdGhpcyB3aG9sZSBwYWdlXCJcbiAgICAnbG9jYXRpb25zLXBhZ2VfY291bnRfb25lJzogJzxzcGFuIGNsYXNzPVwiYW50ZW5uYS1sb2NhdGlvbi1jb3VudFwiPjE8L3NwYW4+PGJyPnJlYWNjacOzbicsXG4gICAgJ2xvY2F0aW9ucy1wYWdlX2NvdW50X21hbnknOiAnPHNwYW4gY2xhc3M9XCJhbnRlbm5hLWxvY2F0aW9uLWNvdW50XCI+ezB9PC9zcGFuPjxicj5yZWFjY2lvbmVzJyxcbiAgICAnbG9jYXRpb25zLXBhZ2VfYmFjayc6ICdDZXJyYXInLCAvLyBUT0RPOiBuZWVkIGEgdHJhbnNsYXRpb24gZm9yIFwiQmFja1wiXG5cbiAgICAnY2FsbC10by1hY3Rpb24tbGFiZWxfcmVzcG9uc2VzJzogJ1Jlc3B1ZXN0YXMnLCAvLyBUT0RPOiBuZWVkIGEgdHJhbnNsYXRpb24gb2YgXCJSZXNwb25zZXNcIlxuICAgICdjYWxsLXRvLWFjdGlvbi1sYWJlbF9yZXNwb25zZXNfb25lJzogJzEgUmVzcHVlc3RhJywgLy8gVE9ET1xuICAgICdjYWxsLXRvLWFjdGlvbi1sYWJlbF9yZXNwb25zZXNfbWFueSc6ICd7MH0gUmVzcHVlc3RhcycgLy8gVE9ET1xufTsiLCJ2YXIgR3JvdXBTZXR0aW5ncyA9IHJlcXVpcmUoJy4uL2dyb3VwLXNldHRpbmdzJyk7XG5cbnZhciBFbmdsaXNoTWVzc2FnZXMgPSByZXF1aXJlKCcuL21lc3NhZ2VzLWVuJyk7XG52YXIgU3BhbmlzaE1lc3NhZ2VzID0gcmVxdWlyZSgnLi9tZXNzYWdlcy1lcycpO1xudmFsaWRhdGVUcmFuc2xhdGlvbnMoKTtcblxuZnVuY3Rpb24gdmFsaWRhdGVUcmFuc2xhdGlvbnMoKSB7XG4gICAgZm9yICh2YXIgZW5nbGlzaEtleSBpbiBFbmdsaXNoTWVzc2FnZXMpIHtcbiAgICAgICAgaWYgKEVuZ2xpc2hNZXNzYWdlcy5oYXNPd25Qcm9wZXJ0eShlbmdsaXNoS2V5KSkge1xuICAgICAgICAgICAgaWYgKCFTcGFuaXNoTWVzc2FnZXMuaGFzT3duUHJvcGVydHkoZW5nbGlzaEtleSkpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdBbnRlbm5hIHdhcm5pbmc6IFNwYW5pc2ggdHJhbnNsYXRpb24gbWlzc2luZyBmb3Iga2V5ICcgKyBlbmdsaXNoS2V5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gZ2V0TWVzc2FnZShrZXksIHZhbHVlcykge1xuICAgIHZhciBzdHJpbmcgPSBnZXRMb2NhbGl6ZWRTdHJpbmcoa2V5LCBHcm91cFNldHRpbmdzLmdldCgpLmxhbmd1YWdlKCkpO1xuICAgIGlmICh2YWx1ZXMpIHtcbiAgICAgICAgcmV0dXJuIGZvcm1hdChzdHJpbmcsIHZhbHVlcyk7XG4gICAgfVxuICAgIHJldHVybiBzdHJpbmc7XG59XG5cbmZ1bmN0aW9uIGdldExvY2FsaXplZFN0cmluZyhrZXksIGxhbmcpIHtcbiAgICB2YXIgc3RyaW5nO1xuICAgIHN3aXRjaChsYW5nKSB7XG4gICAgICAgIGNhc2UgJ2VuJzpcbiAgICAgICAgICAgIHN0cmluZyA9IEVuZ2xpc2hNZXNzYWdlc1trZXldO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2VzJzpcbiAgICAgICAgICAgIHN0cmluZyA9IFNwYW5pc2hNZXNzYWdlc1trZXldO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAvLyBUT0RPOiByZXZpZXdcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdJbnZhbGlkIGxhbmd1YWdlIHNwZWNpZmllZCBpbiBBbnRlbm5hIGdyb3VwIHNldHRpbmdzLicpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGlmICghc3RyaW5nKSB7IC8vIERlZmF1bHQgdG8gRW5nbGlzaFxuICAgICAgICBzdHJpbmcgPSBFbmdsaXNoTWVzc2FnZXNba2V5XTtcbiAgICB9XG4gICAgLy8gVE9ETzogaGFuZGxlIG1pc3Npbmcga2V5XG4gICAgcmV0dXJuIHN0cmluZztcbn1cblxuZnVuY3Rpb24gZm9ybWF0KHN0cmluZywgdmFsdWVzKSB7XG4gICAgLy8gUG9wdWxhciwgc2ltcGxlIGFsZ29yaXRobSBmcm9tIGh0dHA6Ly9qYXZhc2NyaXB0LmNyb2NrZm9yZC5jb20vcmVtZWRpYWwuaHRtbFxuICAgIHJldHVybiBzdHJpbmcucmVwbGFjZShcbiAgICAgICAgL1xceyhbXnt9XSopXFx9L2csXG4gICAgICAgIGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgICAgICB2YXIgciA9IHZhbHVlc1tiXTtcbiAgICAgICAgICAgIHJldHVybiB0eXBlb2YgciA9PT0gJ3N0cmluZycgfHwgdHlwZW9mIHIgPT09ICdudW1iZXInID8gciA6IGE7XG4gICAgICAgIH1cbiAgICApO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgZ2V0TWVzc2FnZTogZ2V0TWVzc2FnZVxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcblxuZnVuY3Rpb24gbWFrZU1vdmVhYmxlKCRlbGVtZW50LCAkZHJhZ0hhbmRsZSkge1xuICAgICRkcmFnSGFuZGxlLm9uKCdtb3VzZWRvd24uYW50ZW5uYScsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHZhciBvZmZzZXRYID0gZXZlbnQucGFnZVggLSAkZHJhZ0hhbmRsZS5vZmZzZXQoKS5sZWZ0O1xuICAgICAgICB2YXIgb2Zmc2V0WSA9IGV2ZW50LnBhZ2VZIC0gJGRyYWdIYW5kbGUub2Zmc2V0KCkudG9wO1xuICAgICAgICAkKGRvY3VtZW50KS5vbignbW91c2V1cC5hbnRlbm5hJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgICQoZG9jdW1lbnQpLm9mZignbW91c2Vtb3ZlLmFudGVubmEnKTtcbiAgICAgICAgfSk7XG4gICAgICAgICQoZG9jdW1lbnQpLm9uKCdtb3VzZW1vdmUuYW50ZW5uYScsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICAkZWxlbWVudC5jc3Moe1xuICAgICAgICAgICAgICAgIHRvcDogZXZlbnQucGFnZVkgLSBvZmZzZXRZLFxuICAgICAgICAgICAgICAgIGxlZnQ6IGV2ZW50LnBhZ2VYIC0gb2Zmc2V0WFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBtYWtlTW92ZWFibGU6IG1ha2VNb3ZlYWJsZVxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciBXaWRnZXRCdWNrZXQgPSByZXF1aXJlKCcuL3dpZGdldC1idWNrZXQnKTtcblxuLy8gVE9ETzogZGV0ZWN0IHdoZXRoZXIgdGhlIGJyb3dzZXIgc3VwcG9ydHMgTXV0YXRpb25PYnNlcnZlciBhbmQgZmFsbGJhY2sgdG8gTXV0YXRpb25zIEV2ZW50c1xuXG5mdW5jdGlvbiBhZGRBZGRpdGlvbkxpc3RlbmVyKGNhbGxiYWNrKSB7XG4gICAgdmFyIG9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoZnVuY3Rpb24obXV0YXRpb25SZWNvcmRzKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbXV0YXRpb25SZWNvcmRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgYWRkZWRFbGVtZW50cyA9IGZpbHRlcmVkRWxlbWVudHMobXV0YXRpb25SZWNvcmRzW2ldLmFkZGVkTm9kZXMpO1xuICAgICAgICAgICAgaWYgKGFkZGVkRWxlbWVudHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKGFkZGVkRWxlbWVudHMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG4gICAgdmFyIGJvZHkgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnYm9keScpWzBdO1xuICAgIG9ic2VydmVyLm9ic2VydmUoYm9keSwge1xuICAgICAgICBjaGlsZExpc3Q6IHRydWUsXG4gICAgICAgIGF0dHJpYnV0ZXM6IGZhbHNlLFxuICAgICAgICBjaGFyYWN0ZXJEYXRhOiBmYWxzZSxcbiAgICAgICAgc3VidHJlZTogdHJ1ZSxcbiAgICAgICAgYXR0cmlidXRlT2xkVmFsdWU6IGZhbHNlLFxuICAgICAgICBjaGFyYWN0ZXJEYXRhT2xkVmFsdWU6IGZhbHNlXG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGFkZFJlbW92YWxMaXN0ZW5lcihjYWxsYmFjaykge1xuICAgIHZhciBvYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKGZ1bmN0aW9uKG11dGF0aW9uUmVjb3Jkcykge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG11dGF0aW9uUmVjb3Jkcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIHJlbW92ZWRFbGVtZW50cyA9IGZpbHRlcmVkRWxlbWVudHMobXV0YXRpb25SZWNvcmRzW2ldLnJlbW92ZWROb2Rlcyk7XG4gICAgICAgICAgICBpZiAocmVtb3ZlZEVsZW1lbnRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhyZW1vdmVkRWxlbWVudHMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG4gICAgdmFyIGJvZHkgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnYm9keScpWzBdO1xuICAgIG9ic2VydmVyLm9ic2VydmUoYm9keSwge1xuICAgICAgICBjaGlsZExpc3Q6IHRydWUsXG4gICAgICAgIGF0dHJpYnV0ZXM6IGZhbHNlLFxuICAgICAgICBjaGFyYWN0ZXJEYXRhOiBmYWxzZSxcbiAgICAgICAgc3VidHJlZTogdHJ1ZSxcbiAgICAgICAgYXR0cmlidXRlT2xkVmFsdWU6IGZhbHNlLFxuICAgICAgICBjaGFyYWN0ZXJEYXRhT2xkVmFsdWU6IGZhbHNlXG4gICAgfSk7XG59XG5cbi8vIEZpbHRlciB0aGUgc2V0IG9mIG5vZGVzIHRvIGVsaW1pbmF0ZSBhbnl0aGluZyBpbnNpZGUgb3VyIG93biBET00gZWxlbWVudHMgKG90aGVyd2lzZSwgd2UgZ2VuZXJhdGUgYSB0b24gb2YgY2hhdHRlcilcbmZ1bmN0aW9uIGZpbHRlcmVkRWxlbWVudHMobm9kZUxpc3QpIHtcbiAgICB2YXIgZmlsdGVyZWQgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG5vZGVMaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBub2RlID0gbm9kZUxpc3RbaV07XG4gICAgICAgIGlmIChub2RlLm5vZGVUeXBlICE9PSAzKSB7IC8vIERvbid0IHByb2Nlc3MgdGV4dCBub2Rlc1xuICAgICAgICAgICAgdmFyICRlbGVtZW50ID0gJChub2RlKTtcbiAgICAgICAgICAgIGlmICgkZWxlbWVudC5jbG9zZXN0KCcuYW50ZW5uYSwgJyArIFdpZGdldEJ1Y2tldC5zZWxlY3RvcigpKS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICBmaWx0ZXJlZC5wdXNoKCRlbGVtZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmlsdGVyZWQ7XG59XG5cbmZ1bmN0aW9uIGFkZE9uZVRpbWVBdHRyaWJ1dGVMaXN0ZW5lcihub2RlLCBhdHRyaWJ1dGVzLCBjYWxsYmFjaykge1xuICAgIHZhciBvYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKGZ1bmN0aW9uKG11dGF0aW9uUmVjb3Jkcykge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG11dGF0aW9uUmVjb3Jkcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIHRhcmdldCA9IG11dGF0aW9uUmVjb3Jkc1tpXS50YXJnZXQ7XG4gICAgICAgICAgICBjYWxsYmFjayh0YXJnZXQpO1xuICAgICAgICAgICAgb2JzZXJ2ZXIuZGlzY29ubmVjdCgpO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgb2JzZXJ2ZXIub2JzZXJ2ZShub2RlLCB7XG4gICAgICAgIGNoaWxkTGlzdDogZmFsc2UsXG4gICAgICAgIGF0dHJpYnV0ZXM6IHRydWUsXG4gICAgICAgIGNoYXJhY3RlckRhdGE6IGZhbHNlLFxuICAgICAgICBzdWJ0cmVlOiBmYWxzZSxcbiAgICAgICAgYXR0cmlidXRlT2xkVmFsdWU6IGZhbHNlLFxuICAgICAgICBjaGFyYWN0ZXJEYXRhT2xkVmFsdWU6IGZhbHNlLFxuICAgICAgICBhdHRyaWJ1dGVGaWx0ZXI6IGF0dHJpYnV0ZXNcbiAgICB9KTtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGFkZEFkZGl0aW9uTGlzdGVuZXI6IGFkZEFkZGl0aW9uTGlzdGVuZXIsXG4gICAgYWRkUmVtb3ZhbExpc3RlbmVyOiBhZGRSZW1vdmFsTGlzdGVuZXIsXG4gICAgYWRkT25lVGltZUF0dHJpYnV0ZUxpc3RlbmVyOiBhZGRPbmVUaW1lQXR0cmlidXRlTGlzdGVuZXJcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG5cbmZ1bmN0aW9uIGNvbXB1dGVUb3BMZXZlbFBhZ2VUaXRsZSgpIHtcbiAgICAvLyBUT0RPOiBUaGlzIHNob3VsZCBiZSBhIGNvbmZpZ3VyYWJsZSBncm91cCBzZXR0aW5nIGxpa2UgdGhlIG90aGVyIHBhZ2UgcHJvcGVydGllcy5cbiAgICByZXR1cm4gZ2V0QXR0cmlidXRlVmFsdWUoJ21ldGFbcHJvcGVydHk9XCJvZzp0aXRsZVwiXScsICdjb250ZW50JykgfHwgJCgndGl0bGUnKS50ZXh0KCkudHJpbSgpO1xufVxuXG5mdW5jdGlvbiBjb21wdXRlUGFnZVRpdGxlKCRwYWdlLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIHBhZ2VUaXRsZSA9ICRwYWdlLmZpbmQoZ3JvdXBTZXR0aW5ncy5wYWdlTGlua1NlbGVjdG9yKCkpLnRleHQoKS50cmltKCk7XG4gICAgaWYgKHBhZ2VUaXRsZSA9PT0gJycpIHtcbiAgICAgICAgcGFnZVRpdGxlID0gY29tcHV0ZVRvcExldmVsUGFnZVRpdGxlKCk7XG4gICAgfVxuICAgIHJldHVybiBwYWdlVGl0bGU7XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVUb3BMZXZlbFBhZ2VJbWFnZShncm91cFNldHRpbmdzKSB7XG4gICAgcmV0dXJuIGdldEF0dHJpYnV0ZVZhbHVlKGdyb3VwU2V0dGluZ3MucGFnZUltYWdlU2VsZWN0b3IoKSwgZ3JvdXBTZXR0aW5ncy5wYWdlSW1hZ2VBdHRyaWJ1dGUoKSk7XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVQYWdlQXV0aG9yKGdyb3VwU2V0dGluZ3MpIHtcbiAgICByZXR1cm4gZ2V0QXR0cmlidXRlVmFsdWUoZ3JvdXBTZXR0aW5ncy5wYWdlQXV0aG9yU2VsZWN0b3IoKSwgZ3JvdXBTZXR0aW5ncy5wYWdlQXV0aG9yQXR0cmlidXRlKCkpO1xufVxuXG5mdW5jdGlvbiBjb21wdXRlUGFnZVRvcGljcyhncm91cFNldHRpbmdzKSB7XG4gICAgcmV0dXJuIGdldEF0dHJpYnV0ZVZhbHVlKGdyb3VwU2V0dGluZ3MucGFnZVRvcGljc1NlbGVjdG9yKCksIGdyb3VwU2V0dGluZ3MucGFnZVRvcGljc0F0dHJpYnV0ZSgpKTtcbn1cblxuZnVuY3Rpb24gY29tcHV0ZVBhZ2VTaXRlU2VjdGlvbihncm91cFNldHRpbmdzKSB7XG4gICAgcmV0dXJuIGdldEF0dHJpYnV0ZVZhbHVlKGdyb3VwU2V0dGluZ3MucGFnZVNpdGVTZWN0aW9uU2VsZWN0b3IoKSwgZ3JvdXBTZXR0aW5ncy5wYWdlU2l0ZVNlY3Rpb25BdHRyaWJ1dGUoKSk7XG59XG5cbmZ1bmN0aW9uIGdldEF0dHJpYnV0ZVZhbHVlKGVsZW1lbnRTZWxlY3RvciwgYXR0cmlidXRlU2VsZWN0b3IpIHtcbiAgICB2YXIgdmFsdWUgPSAnJztcbiAgICBpZiAoZWxlbWVudFNlbGVjdG9yICYmIGF0dHJpYnV0ZVNlbGVjdG9yKSB7XG4gICAgICAgIHZhbHVlID0gJChlbGVtZW50U2VsZWN0b3IpLmF0dHIoYXR0cmlidXRlU2VsZWN0b3IpIHx8ICcnO1xuICAgIH1cbiAgICByZXR1cm4gdmFsdWUudHJpbSgpO1xufVxuXG5mdW5jdGlvbiBjb21wdXRlVG9wTGV2ZWxDYW5vbmljYWxVcmwoZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBjYW5vbmljYWxVcmwgPSB3aW5kb3cubG9jYXRpb24uaHJlZi5zcGxpdCgnIycpWzBdLnRvTG93ZXJDYXNlKCk7XG4gICAgdmFyICRjYW5vbmljYWxMaW5rID0gJCgnbGlua1tyZWw9XCJjYW5vbmljYWxcIl0nKTtcbiAgICBpZiAoJGNhbm9uaWNhbExpbmsubGVuZ3RoID4gMCkge1xuICAgICAgICB2YXIgb3ZlcnJpZGVVcmwgPSAkY2Fub25pY2FsTGluay5hdHRyKCdocmVmJykudHJpbSgpLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIHZhciBkb21haW4gPSAod2luZG93LmxvY2F0aW9uLnByb3RvY29sKycvLycrd2luZG93LmxvY2F0aW9uLmhvc3RuYW1lKycvJykudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgaWYgKG92ZXJyaWRlVXJsICE9PSBkb21haW4pIHsgLy8gZmFzdGNvIGZpeCAoc2luY2UgdGhleSBzb21ldGltZXMgcmV3cml0ZSB0aGVpciBjYW5vbmljYWwgdG8gc2ltcGx5IGJlIHRoZWlyIGRvbWFpbi4pXG4gICAgICAgICAgICBjYW5vbmljYWxVcmwgPSBvdmVycmlkZVVybDtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVtb3ZlU3ViZG9tYWluRnJvbVBhZ2VVcmwoY2Fub25pY2FsVXJsLCBncm91cFNldHRpbmdzKTtcbn1cblxuZnVuY3Rpb24gY29tcHV0ZVBhZ2VFbGVtZW50VXJsKCRwYWdlRWxlbWVudCwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciB1cmwgPSAkcGFnZUVsZW1lbnQuZmluZChncm91cFNldHRpbmdzLnBhZ2VMaW5rU2VsZWN0b3IoKSkuYXR0cignaHJlZicpO1xuICAgIGlmICh1cmwpIHtcbiAgICAgICAgcmV0dXJuIHJlbW92ZVN1YmRvbWFpbkZyb21QYWdlVXJsKHVybCwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgfVxuICAgIHJldHVybiBjb21wdXRlVG9wTGV2ZWxDYW5vbmljYWxVcmwoZ3JvdXBTZXR0aW5ncyk7XG59XG5cbi8vIFRPRE8gY29waWVkIGZyb20gZW5nYWdlX2Z1bGwuIFJldmlldy5cbmZ1bmN0aW9uIHJlbW92ZVN1YmRvbWFpbkZyb21QYWdlVXJsKHVybCwgZ3JvdXBTZXR0aW5ncykge1xuICAgIC8vIEFOVC5hY3Rpb25zLnJlbW92ZVN1YmRvbWFpbkZyb21QYWdlVXJsOlxuICAgIC8vIGlmIFwiaWdub3JlX3N1YmRvbWFpblwiIGlzIGNoZWNrZWQgaW4gc2V0dGluZ3MsIEFORCB0aGV5IHN1cHBseSBhIFRMRCxcbiAgICAvLyB0aGVuIG1vZGlmeSB0aGUgcGFnZSBhbmQgY2Fub25pY2FsIFVSTHMgaGVyZS5cbiAgICAvLyBoYXZlIHRvIGhhdmUgdGhlbSBzdXBwbHkgb25lIGJlY2F1c2UgdGhlcmUgYXJlIHRvbyBtYW55IHZhcmlhdGlvbnMgdG8gcmVsaWFibHkgc3RyaXAgc3ViZG9tYWlucyAgKC5jb20sIC5pcywgLmNvbS5hciwgLmNvLnVrLCBldGMpXG4gICAgaWYgKGdyb3VwU2V0dGluZ3MudXJsLmlnbm9yZVN1YmRvbWFpbigpID09IHRydWUgJiYgZ3JvdXBTZXR0aW5ncy51cmwuY2Fub25pY2FsRG9tYWluKCkpIHtcbiAgICAgICAgdmFyIEhPU1RET01BSU4gPSAvWy1cXHddK1xcLig/OlstXFx3XStcXC54bi0tWy1cXHddK3xbLVxcd117Mix9fFstXFx3XStcXC5bLVxcd117Mn0pJC9pO1xuICAgICAgICB2YXIgc3JjQXJyYXkgPSB1cmwuc3BsaXQoJy8nKTtcblxuICAgICAgICB2YXIgcHJvdG9jb2wgPSBzcmNBcnJheVswXTtcbiAgICAgICAgc3JjQXJyYXkuc3BsaWNlKDAsMyk7XG5cbiAgICAgICAgdmFyIHJldHVyblVybCA9IHByb3RvY29sICsgJy8vJyArIGdyb3VwU2V0dGluZ3MudXJsLmNhbm9uaWNhbERvbWFpbigpICsgJy8nICsgc3JjQXJyYXkuam9pbignLycpO1xuXG4gICAgICAgIHJldHVybiByZXR1cm5Vcmw7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHVybDtcbiAgICB9XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjb21wdXRlUGFnZVVybDogY29tcHV0ZVBhZ2VFbGVtZW50VXJsLFxuICAgIGNvbXB1dGVQYWdlVGl0bGU6IGNvbXB1dGVQYWdlVGl0bGUsXG4gICAgY29tcHV0ZVRvcExldmVsUGFnZUltYWdlOiBjb21wdXRlVG9wTGV2ZWxQYWdlSW1hZ2UsXG4gICAgY29tcHV0ZVBhZ2VBdXRob3I6IGNvbXB1dGVQYWdlQXV0aG9yLFxuICAgIGNvbXB1dGVQYWdlVG9waWNzOiBjb21wdXRlUGFnZVRvcGljcyxcbiAgICBjb21wdXRlUGFnZVNpdGVTZWN0aW9uOiBjb21wdXRlUGFnZVNpdGVTZWN0aW9uXG59OyIsIi8vIFRhcC9mYXN0Y2xpY2sgZXZlbnQgcGx1Z2luIGZvciBSYWN0aXZlLmpzIC0gZWxpbWluYXRlcyB0aGUgMzAwbXMgZGVsYXkgb24gdG91Y2gtZW5hYmxlZCBkZXZpY2VzLCBhbmQgbm9ybWFsaXNlc1xuLy8gYWNyb3NzIG1vdXNlLCB0b3VjaCBhbmQgcG9pbnRlciBldmVudHMuXG4vLyBBdXRob3I6IFJpY2ggSGFycmlzXG4vLyBMaWNlbnNlOiBNSVRcbi8vIFNvdXJjZTogaHR0cHM6Ly9naXRodWIuY29tL3JhY3RpdmVqcy9yYWN0aXZlLWV2ZW50cy10YXBcbihmdW5jdGlvbiAoZ2xvYmFsLCBmYWN0b3J5KSB7XG5cdG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpO1xufSh0aGlzLCBmdW5jdGlvbiAoKSB7ICd1c2Ugc3RyaWN0JztcblxuXHR2YXIgRElTVEFOQ0VfVEhSRVNIT0xEID0gNTsgLy8gbWF4aW11bSBwaXhlbHMgcG9pbnRlciBjYW4gbW92ZSBiZWZvcmUgY2FuY2VsXG5cdHZhciBUSU1FX1RIUkVTSE9MRCA9IDQwMDsgLy8gbWF4aW11bSBtaWxsaXNlY29uZHMgYmV0d2VlbiBkb3duIGFuZCB1cCBiZWZvcmUgY2FuY2VsXG5cblx0ZnVuY3Rpb24gdGFwKG5vZGUsIGNhbGxiYWNrKSB7XG5cdFx0cmV0dXJuIG5ldyBUYXBIYW5kbGVyKG5vZGUsIGNhbGxiYWNrKTtcblx0fVxuXG5cdGZ1bmN0aW9uIFRhcEhhbmRsZXIobm9kZSwgY2FsbGJhY2spIHtcblx0XHR0aGlzLm5vZGUgPSBub2RlO1xuXHRcdHRoaXMuY2FsbGJhY2sgPSBjYWxsYmFjaztcblxuXHRcdHRoaXMucHJldmVudE1vdXNlZG93bkV2ZW50cyA9IGZhbHNlO1xuXG5cdFx0dGhpcy5iaW5kKG5vZGUpO1xuXHR9XG5cblx0VGFwSGFuZGxlci5wcm90b3R5cGUgPSB7XG5cdFx0YmluZDogZnVuY3Rpb24gYmluZChub2RlKSB7XG5cdFx0XHQvLyBsaXN0ZW4gZm9yIG1vdXNlL3BvaW50ZXIgZXZlbnRzLi4uXG5cdFx0XHRpZiAod2luZG93Lm5hdmlnYXRvci5wb2ludGVyRW5hYmxlZCkge1xuXHRcdFx0XHRub2RlLmFkZEV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJkb3duJywgaGFuZGxlTW91c2Vkb3duLCBmYWxzZSk7XG5cdFx0XHR9IGVsc2UgaWYgKHdpbmRvdy5uYXZpZ2F0b3IubXNQb2ludGVyRW5hYmxlZCkge1xuXHRcdFx0XHRub2RlLmFkZEV2ZW50TGlzdGVuZXIoJ01TUG9pbnRlckRvd24nLCBoYW5kbGVNb3VzZWRvd24sIGZhbHNlKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdG5vZGUuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgaGFuZGxlTW91c2Vkb3duLCBmYWxzZSk7XG5cdFx0XHR9XG5cblx0XHRcdC8vIC4uLmFuZCB0b3VjaCBldmVudHNcblx0XHRcdG5vZGUuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIGhhbmRsZVRvdWNoc3RhcnQsIGZhbHNlKTtcblxuXHRcdFx0Ly8gbmF0aXZlIGJ1dHRvbnMsIGFuZCA8aW5wdXQgdHlwZT0nYnV0dG9uJz4gZWxlbWVudHMsIHNob3VsZCBmaXJlIGEgdGFwIGV2ZW50XG5cdFx0XHQvLyB3aGVuIHRoZSBzcGFjZSBrZXkgaXMgcHJlc3NlZFxuXHRcdFx0aWYgKG5vZGUudGFnTmFtZSA9PT0gJ0JVVFRPTicgfHwgbm9kZS50eXBlID09PSAnYnV0dG9uJykge1xuXHRcdFx0XHRub2RlLmFkZEV2ZW50TGlzdGVuZXIoJ2ZvY3VzJywgaGFuZGxlRm9jdXMsIGZhbHNlKTtcblx0XHRcdH1cblxuXHRcdFx0bm9kZS5fX3RhcF9oYW5kbGVyX18gPSB0aGlzO1xuXHRcdH0sXG5cdFx0ZmlyZTogZnVuY3Rpb24gZmlyZShldmVudCwgeCwgeSkge1xuXHRcdFx0dGhpcy5jYWxsYmFjayh7XG5cdFx0XHRcdG5vZGU6IHRoaXMubm9kZSxcblx0XHRcdFx0b3JpZ2luYWw6IGV2ZW50LFxuXHRcdFx0XHR4OiB4LFxuXHRcdFx0XHR5OiB5XG5cdFx0XHR9KTtcblx0XHR9LFxuXHRcdG1vdXNlZG93bjogZnVuY3Rpb24gbW91c2Vkb3duKGV2ZW50KSB7XG5cdFx0XHR2YXIgX3RoaXMgPSB0aGlzO1xuXG5cdFx0XHRpZiAodGhpcy5wcmV2ZW50TW91c2Vkb3duRXZlbnRzKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGV2ZW50LndoaWNoICE9PSB1bmRlZmluZWQgJiYgZXZlbnQud2hpY2ggIT09IDEpIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHR2YXIgeCA9IGV2ZW50LmNsaWVudFg7XG5cdFx0XHR2YXIgeSA9IGV2ZW50LmNsaWVudFk7XG5cblx0XHRcdC8vIFRoaXMgd2lsbCBiZSBudWxsIGZvciBtb3VzZSBldmVudHMuXG5cdFx0XHR2YXIgcG9pbnRlcklkID0gZXZlbnQucG9pbnRlcklkO1xuXG5cdFx0XHR2YXIgaGFuZGxlTW91c2V1cCA9IGZ1bmN0aW9uIGhhbmRsZU1vdXNldXAoZXZlbnQpIHtcblx0XHRcdFx0aWYgKGV2ZW50LnBvaW50ZXJJZCAhPSBwb2ludGVySWQpIHtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRfdGhpcy5maXJlKGV2ZW50LCB4LCB5KTtcblx0XHRcdFx0Y2FuY2VsKCk7XG5cdFx0XHR9O1xuXG5cdFx0XHR2YXIgaGFuZGxlTW91c2Vtb3ZlID0gZnVuY3Rpb24gaGFuZGxlTW91c2Vtb3ZlKGV2ZW50KSB7XG5cdFx0XHRcdGlmIChldmVudC5wb2ludGVySWQgIT0gcG9pbnRlcklkKSB7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKE1hdGguYWJzKGV2ZW50LmNsaWVudFggLSB4KSA+PSBESVNUQU5DRV9USFJFU0hPTEQgfHwgTWF0aC5hYnMoZXZlbnQuY2xpZW50WSAtIHkpID49IERJU1RBTkNFX1RIUkVTSE9MRCkge1xuXHRcdFx0XHRcdGNhbmNlbCgpO1xuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXG5cdFx0XHR2YXIgY2FuY2VsID0gZnVuY3Rpb24gY2FuY2VsKCkge1xuXHRcdFx0XHRfdGhpcy5ub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ01TUG9pbnRlclVwJywgaGFuZGxlTW91c2V1cCwgZmFsc2UpO1xuXHRcdFx0XHRkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdNU1BvaW50ZXJNb3ZlJywgaGFuZGxlTW91c2Vtb3ZlLCBmYWxzZSk7XG5cdFx0XHRcdGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ01TUG9pbnRlckNhbmNlbCcsIGNhbmNlbCwgZmFsc2UpO1xuXHRcdFx0XHRfdGhpcy5ub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJ1cCcsIGhhbmRsZU1vdXNldXAsIGZhbHNlKTtcblx0XHRcdFx0ZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigncG9pbnRlcm1vdmUnLCBoYW5kbGVNb3VzZW1vdmUsIGZhbHNlKTtcblx0XHRcdFx0ZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigncG9pbnRlcmNhbmNlbCcsIGNhbmNlbCwgZmFsc2UpO1xuXHRcdFx0XHRfdGhpcy5ub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlTW91c2V1cCwgZmFsc2UpO1xuXHRcdFx0XHRkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBoYW5kbGVNb3VzZW1vdmUsIGZhbHNlKTtcblx0XHRcdH07XG5cblx0XHRcdGlmICh3aW5kb3cubmF2aWdhdG9yLnBvaW50ZXJFbmFibGVkKSB7XG5cdFx0XHRcdHRoaXMubm9kZS5hZGRFdmVudExpc3RlbmVyKCdwb2ludGVydXAnLCBoYW5kbGVNb3VzZXVwLCBmYWxzZSk7XG5cdFx0XHRcdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJtb3ZlJywgaGFuZGxlTW91c2Vtb3ZlLCBmYWxzZSk7XG5cdFx0XHRcdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJjYW5jZWwnLCBjYW5jZWwsIGZhbHNlKTtcblx0XHRcdH0gZWxzZSBpZiAod2luZG93Lm5hdmlnYXRvci5tc1BvaW50ZXJFbmFibGVkKSB7XG5cdFx0XHRcdHRoaXMubm9kZS5hZGRFdmVudExpc3RlbmVyKCdNU1BvaW50ZXJVcCcsIGhhbmRsZU1vdXNldXAsIGZhbHNlKTtcblx0XHRcdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignTVNQb2ludGVyTW92ZScsIGhhbmRsZU1vdXNlbW92ZSwgZmFsc2UpO1xuXHRcdFx0XHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdNU1BvaW50ZXJDYW5jZWwnLCBjYW5jZWwsIGZhbHNlKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRoaXMubm9kZS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZU1vdXNldXAsIGZhbHNlKTtcblx0XHRcdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgaGFuZGxlTW91c2Vtb3ZlLCBmYWxzZSk7XG5cdFx0XHR9XG5cblx0XHRcdHNldFRpbWVvdXQoY2FuY2VsLCBUSU1FX1RIUkVTSE9MRCk7XG5cdFx0fSxcblx0XHR0b3VjaGRvd246IGZ1bmN0aW9uIHRvdWNoZG93bigpIHtcblx0XHRcdHZhciBfdGhpczIgPSB0aGlzO1xuXG5cdFx0XHR2YXIgdG91Y2ggPSBldmVudC50b3VjaGVzWzBdO1xuXG5cdFx0XHR2YXIgeCA9IHRvdWNoLmNsaWVudFg7XG5cdFx0XHR2YXIgeSA9IHRvdWNoLmNsaWVudFk7XG5cblx0XHRcdHZhciBmaW5nZXIgPSB0b3VjaC5pZGVudGlmaWVyO1xuXG5cdFx0XHR2YXIgaGFuZGxlVG91Y2h1cCA9IGZ1bmN0aW9uIGhhbmRsZVRvdWNodXAoZXZlbnQpIHtcblx0XHRcdFx0dmFyIHRvdWNoID0gZXZlbnQuY2hhbmdlZFRvdWNoZXNbMF07XG5cblx0XHRcdFx0aWYgKHRvdWNoLmlkZW50aWZpZXIgIT09IGZpbmdlcikge1xuXHRcdFx0XHRcdGNhbmNlbCgpO1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7IC8vIHByZXZlbnQgY29tcGF0aWJpbGl0eSBtb3VzZSBldmVudFxuXG5cdFx0XHRcdC8vIGZvciB0aGUgYmVuZWZpdCBvZiBtb2JpbGUgRmlyZWZveCBhbmQgb2xkIEFuZHJvaWQgYnJvd3NlcnMsIHdlIG5lZWQgdGhpcyBhYnN1cmQgaGFjay5cblx0XHRcdFx0X3RoaXMyLnByZXZlbnRNb3VzZWRvd25FdmVudHMgPSB0cnVlO1xuXHRcdFx0XHRjbGVhclRpbWVvdXQoX3RoaXMyLnByZXZlbnRNb3VzZWRvd25UaW1lb3V0KTtcblxuXHRcdFx0XHRfdGhpczIucHJldmVudE1vdXNlZG93blRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHRfdGhpczIucHJldmVudE1vdXNlZG93bkV2ZW50cyA9IGZhbHNlO1xuXHRcdFx0XHR9LCA0MDApO1xuXG5cdFx0XHRcdF90aGlzMi5maXJlKGV2ZW50LCB4LCB5KTtcblx0XHRcdFx0Y2FuY2VsKCk7XG5cdFx0XHR9O1xuXG5cdFx0XHR2YXIgaGFuZGxlVG91Y2htb3ZlID0gZnVuY3Rpb24gaGFuZGxlVG91Y2htb3ZlKGV2ZW50KSB7XG5cdFx0XHRcdGlmIChldmVudC50b3VjaGVzLmxlbmd0aCAhPT0gMSB8fCBldmVudC50b3VjaGVzWzBdLmlkZW50aWZpZXIgIT09IGZpbmdlcikge1xuXHRcdFx0XHRcdGNhbmNlbCgpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dmFyIHRvdWNoID0gZXZlbnQudG91Y2hlc1swXTtcblx0XHRcdFx0aWYgKE1hdGguYWJzKHRvdWNoLmNsaWVudFggLSB4KSA+PSBESVNUQU5DRV9USFJFU0hPTEQgfHwgTWF0aC5hYnModG91Y2guY2xpZW50WSAtIHkpID49IERJU1RBTkNFX1RIUkVTSE9MRCkge1xuXHRcdFx0XHRcdGNhbmNlbCgpO1xuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXG5cdFx0XHR2YXIgY2FuY2VsID0gZnVuY3Rpb24gY2FuY2VsKCkge1xuXHRcdFx0XHRfdGhpczIubm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIGhhbmRsZVRvdWNodXAsIGZhbHNlKTtcblx0XHRcdFx0d2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIGhhbmRsZVRvdWNobW92ZSwgZmFsc2UpO1xuXHRcdFx0XHR3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hjYW5jZWwnLCBjYW5jZWwsIGZhbHNlKTtcblx0XHRcdH07XG5cblx0XHRcdHRoaXMubm9kZS5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIGhhbmRsZVRvdWNodXAsIGZhbHNlKTtcblx0XHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCBoYW5kbGVUb3VjaG1vdmUsIGZhbHNlKTtcblx0XHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGNhbmNlbCcsIGNhbmNlbCwgZmFsc2UpO1xuXG5cdFx0XHRzZXRUaW1lb3V0KGNhbmNlbCwgVElNRV9USFJFU0hPTEQpO1xuXHRcdH0sXG5cdFx0dGVhcmRvd246IGZ1bmN0aW9uIHRlYXJkb3duKCkge1xuXHRcdFx0dmFyIG5vZGUgPSB0aGlzLm5vZGU7XG5cblx0XHRcdG5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcigncG9pbnRlcmRvd24nLCBoYW5kbGVNb3VzZWRvd24sIGZhbHNlKTtcblx0XHRcdG5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcignTVNQb2ludGVyRG93bicsIGhhbmRsZU1vdXNlZG93biwgZmFsc2UpO1xuXHRcdFx0bm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBoYW5kbGVNb3VzZWRvd24sIGZhbHNlKTtcblx0XHRcdG5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIGhhbmRsZVRvdWNoc3RhcnQsIGZhbHNlKTtcblx0XHRcdG5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcignZm9jdXMnLCBoYW5kbGVGb2N1cywgZmFsc2UpO1xuXHRcdH1cblx0fTtcblxuXHRmdW5jdGlvbiBoYW5kbGVNb3VzZWRvd24oZXZlbnQpIHtcblx0XHR0aGlzLl9fdGFwX2hhbmRsZXJfXy5tb3VzZWRvd24oZXZlbnQpO1xuXHR9XG5cblx0ZnVuY3Rpb24gaGFuZGxlVG91Y2hzdGFydChldmVudCkge1xuXHRcdHRoaXMuX190YXBfaGFuZGxlcl9fLnRvdWNoZG93bihldmVudCk7XG5cdH1cblxuXHRmdW5jdGlvbiBoYW5kbGVGb2N1cygpIHtcblx0XHR0aGlzLmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBoYW5kbGVLZXlkb3duLCBmYWxzZSk7XG5cdFx0dGhpcy5hZGRFdmVudExpc3RlbmVyKCdibHVyJywgaGFuZGxlQmx1ciwgZmFsc2UpO1xuXHR9XG5cblx0ZnVuY3Rpb24gaGFuZGxlQmx1cigpIHtcblx0XHR0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBoYW5kbGVLZXlkb3duLCBmYWxzZSk7XG5cdFx0dGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKCdibHVyJywgaGFuZGxlQmx1ciwgZmFsc2UpO1xuXHR9XG5cblx0ZnVuY3Rpb24gaGFuZGxlS2V5ZG93bihldmVudCkge1xuXHRcdGlmIChldmVudC53aGljaCA9PT0gMzIpIHtcblx0XHRcdC8vIHNwYWNlIGtleVxuXHRcdFx0dGhpcy5fX3RhcF9oYW5kbGVyX18uZmlyZSgpO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiB0YXA7XG5cbn0pKTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciBSYWN0aXZlRXZlbnRzVGFwID0gcmVxdWlyZSgnLi9yYWN0aXZlLWV2ZW50cy10YXAnKTtcblxudmFyIE1lc3NhZ2VzID0gcmVxdWlyZSgnLi9tZXNzYWdlcycpO1xuXG52YXIgbm9Db25mbGljdDtcbnZhciBsb2FkZWRSYWN0aXZlO1xudmFyIGNhbGxiYWNrcyA9IFtdO1xuXG4vLyBDYXB0dXJlIGFueSBnbG9iYWwgaW5zdGFuY2Ugb2YgUmFjdGl2ZSB3aGljaCBhbHJlYWR5IGV4aXN0cyBiZWZvcmUgd2UgbG9hZCBvdXIgb3duLlxuZnVuY3Rpb24gYWJvdXRUb0xvYWQoKSB7XG4gICAgbm9Db25mbGljdCA9IHdpbmRvdy5SYWN0aXZlO1xufVxuXG4vLyBSZXN0b3JlIHRoZSBnbG9iYWwgaW5zdGFuY2Ugb2YgUmFjdGl2ZSAoaWYgYW55KSBhbmQgcGFzcyBvdXQgb3VyIHZlcnNpb24gdG8gb3VyIGNhbGxiYWNrc1xuZnVuY3Rpb24gbG9hZGVkKCkge1xuICAgIGxvYWRlZFJhY3RpdmUgPSBSYWN0aXZlO1xuICAgIHdpbmRvdy5SYWN0aXZlID0gbm9Db25mbGljdDtcbiAgICBsb2FkZWRSYWN0aXZlLmRlY29yYXRvcnMuY3NzcmVzZXQgPSBjc3NSZXNldERlY29yYXRvcjsgLy8gTWFrZSBvdXIgY3NzIHJlc2V0IGRlY29yYXRvciBhdmFpbGFibGUgdG8gYWxsIGluc3RhbmNlc1xuICAgIGxvYWRlZFJhY3RpdmUuZXZlbnRzLnRhcCA9IFJhY3RpdmVFdmVudHNUYXA7IC8vIE1ha2UgdGhlICdvbi10YXAnIGV2ZW50IHBsdWdpbiBhdmFpbGFibGUgdG8gYWxsIGluc3RhbmNlc1xuICAgIGxvYWRlZFJhY3RpdmUuZGVmYXVsdHMuZGF0YS5nZXRNZXNzYWdlID0gTWVzc2FnZXMuZ2V0TWVzc2FnZTsgLy8gTWFrZSBnZXRNZXNzYWdlIGF2YWlsYWJsZSB0byBhbGwgaW5zdGFuY2VzXG4gICAgbG9hZGVkUmFjdGl2ZS5kZWZhdWx0cy50d293YXkgPSBmYWxzZTsgLy8gQ2hhbmdlIHRoZSBkZWZhdWx0IHRvIGRpc2FibGUgdHdvLXdheSBkYXRhIGJpbmRpbmdzLlxuICAgIG5vdGlmeUNhbGxiYWNrcygpO1xufVxuXG5mdW5jdGlvbiBjc3NSZXNldERlY29yYXRvcihub2RlKSB7XG4gICAgdGFnQ2hpbGRyZW4obm9kZSwgJ2FudGVubmEtcmVzZXQnKTtcbiAgICByZXR1cm4geyB0ZWFyZG93bjogZnVuY3Rpb24oKSB7fSB9O1xufVxuXG5mdW5jdGlvbiB0YWdDaGlsZHJlbihlbGVtZW50LCBjbGF6eikge1xuICAgIGlmIChlbGVtZW50LmNoaWxkcmVuKSB7IC8vIFNhZmFyaSByZXR1cm5zIHVuZGVmaW5lZCB3aGVuIGFza2luZyBmb3IgY2hpbGRyZW4gb24gYW4gU1ZHIGVsZW1lbnRcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBlbGVtZW50LmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB0YWdDaGlsZHJlbihlbGVtZW50LmNoaWxkcmVuW2ldLCBjbGF6eik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgJChlbGVtZW50KS5hZGRDbGFzcyhjbGF6eik7XG59XG5cbmZ1bmN0aW9uIG5vdGlmeUNhbGxiYWNrcygpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNhbGxiYWNrcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjYWxsYmFja3NbaV0obG9hZGVkUmFjdGl2ZSk7XG4gICAgfVxuICAgIGNhbGxiYWNrcyA9IFtdO1xufVxuXG4vLyBSZWdpc3RlcnMgdGhlIGdpdmVuIGNhbGxiYWNrIHRvIGJlIG5vdGlmaWVkIHdoZW4gb3VyIHZlcnNpb24gb2YgUmFjdGl2ZSBpcyBsb2FkZWQuXG5mdW5jdGlvbiBvbkxvYWQoY2FsbGJhY2spIHtcbiAgICBpZiAobG9hZGVkUmFjdGl2ZSkge1xuICAgICAgICBjYWxsYmFjayhsb2FkZWRSYWN0aXZlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBjYWxsYmFja3MucHVzaChjYWxsYmFjayk7XG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgYWJvdXRUb0xvYWQ6IGFib3V0VG9Mb2FkLFxuICAgIGxvYWRlZDogbG9hZGVkLFxuICAgIG9uTG9hZDogb25Mb2FkXG59OyIsInZhciAkOyByZXF1aXJlKCcuL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIHJhbmd5OyByZXF1aXJlKCcuL3Jhbmd5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGxvYWRlZFJhbmd5KSB7IHJhbmd5ID0gbG9hZGVkUmFuZ3k7IH0pO1xuXG52YXIgaGlnaGxpZ2h0Q2xhc3MgPSAnYW50ZW5uYS1oaWdobGlnaHQnO1xudmFyIGhpZ2hsaWdodGVkUmFuZ2VzID0gW107XG5cbnZhciBjbGFzc0FwcGxpZXI7XG5mdW5jdGlvbiBnZXRDbGFzc0FwcGxpZXIoKSB7XG4gICAgaWYgKCFjbGFzc0FwcGxpZXIpIHtcbiAgICAgICAgY2xhc3NBcHBsaWVyID0gcmFuZ3kuY3JlYXRlQ2xhc3NBcHBsaWVyKGhpZ2hsaWdodENsYXNzKTtcbiAgICB9XG4gICAgcmV0dXJuIGNsYXNzQXBwbGllcjtcbn1cblxuLy8gUmV0dXJucyBhbiBhZGp1c3RlZCBlbmQgcG9pbnQgZm9yIHRoZSBzZWxlY3Rpb24gd2l0aGluIHRoZSBnaXZlbiBub2RlLCBhcyB0cmlnZ2VyZWQgYnkgdGhlIGdpdmVuIG1vdXNlIHVwIGV2ZW50LlxuLy8gVGhlIHJldHVybmVkIHBvaW50ICh4LCB5KSB0YWtlcyBpbnRvIGFjY291bnQgdGhlIGxvY2F0aW9uIG9mIHRoZSBtb3VzZSB1cCBldmVudCBhcyB3ZWxsIGFzIHRoZSBkaXJlY3Rpb24gb2YgdGhlXG4vLyBzZWxlY3Rpb24gKGZvcndhcmQvYmFjaykuXG5mdW5jdGlvbiBnZXRTZWxlY3Rpb25FbmRQb2ludChub2RlLCBldmVudCwgZXhjbHVkZU5vZGUpIHtcbiAgICAvLyBUT0RPOiBDb25zaWRlciB1c2luZyB0aGUgZWxlbWVudCBjcmVhdGVkIHdpdGggdGhlICdjbGFzc2lmaWVyJyByYXRoZXIgdGhhbiB0aGUgbW91c2UgbG9jYXRpb25cbiAgICB2YXIgc2VsZWN0aW9uID0gcmFuZ3kuZ2V0U2VsZWN0aW9uKCk7XG4gICAgaWYgKGlzVmFsaWRTZWxlY3Rpb24oc2VsZWN0aW9uLCBub2RlLCBleGNsdWRlTm9kZSkpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHg6IGV2ZW50LnBhZ2VYIC0gKCBzZWxlY3Rpb24uaXNCYWNrd2FyZHMoKSA/IC01IDogNSksXG4gICAgICAgICAgICB5OiBldmVudC5wYWdlWSAtIDggLy8gVE9ETzogZXhhY3QgY29vcmRzXG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG59XG5cbi8vIEF0dGVtcHRzIHRvIGdldCBhIHJhbmdlIGZyb20gdGhlIGN1cnJlbnQgc2VsZWN0aW9uLiBUaGlzIGV4cGFuZHMgdGhlXG4vLyBzZWxlY3RlZCByZWdpb24gdG8gaW5jbHVkZSB3b3JkIGJvdW5kYXJpZXMuXG5mdW5jdGlvbiBncmFiU2VsZWN0aW9uKG5vZGUsIGNhbGxiYWNrLCBleGNsdWRlTm9kZSkge1xuICAgIHZhciBzZWxlY3Rpb24gPSByYW5neS5nZXRTZWxlY3Rpb24oKTtcbiAgICBpZiAoaXNWYWxpZFNlbGVjdGlvbihzZWxlY3Rpb24sIG5vZGUsIGV4Y2x1ZGVOb2RlKSkge1xuICAgICAgICBzZWxlY3Rpb24uZXhwYW5kKCd3b3JkJywgeyB0cmltOiB0cnVlIH0pO1xuICAgICAgICBpZiAoc2VsZWN0aW9uLmNvbnRhaW5zTm9kZShleGNsdWRlTm9kZSkpIHtcbiAgICAgICAgICAgIHZhciByYW5nZSA9IHNlbGVjdGlvbi5nZXRSYW5nZUF0KDApO1xuICAgICAgICAgICAgcmFuZ2Uuc2V0RW5kQmVmb3JlKGV4Y2x1ZGVOb2RlKTtcbiAgICAgICAgICAgIHNlbGVjdGlvbi5zZXRTaW5nbGVSYW5nZShyYW5nZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlzVmFsaWRTZWxlY3Rpb24oc2VsZWN0aW9uLCBub2RlLCBleGNsdWRlTm9kZSkpIHtcbiAgICAgICAgICAgIHZhciBsb2NhdGlvbiA9IHJhbmd5LnNlcmlhbGl6ZVNlbGVjdGlvbihzZWxlY3Rpb24sIHRydWUsIG5vZGUpO1xuICAgICAgICAgICAgdmFyIHRleHQgPSBzZWxlY3Rpb24udG9TdHJpbmcoKTtcbiAgICAgICAgICAgIGhpZ2hsaWdodFNlbGVjdGlvbihzZWxlY3Rpb24pOyAvLyBIaWdobGlnaHRpbmcgZGVzZWxlY3RzIHRoZSB0ZXh0LCBzbyBkbyB0aGlzIGxhc3QuXG4gICAgICAgICAgICBjYWxsYmFjayh0ZXh0LCBsb2NhdGlvbik7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGlzVmFsaWRTZWxlY3Rpb24oc2VsZWN0aW9uLCBub2RlLCBleGNsdWRlTm9kZSkge1xuICAgIHJldHVybiAhc2VsZWN0aW9uLmlzQ29sbGFwc2VkICYmICAvLyBOb24tZW1wdHkgc2VsZWN0aW9uXG4gICAgICAgIHNlbGVjdGlvbi5yYW5nZUNvdW50ID09PSAxICYmIC8vIFNpbmdsZSBzZWxlY3Rpb25cbiAgICAgICAgKCFleGNsdWRlTm9kZSB8fCAhc2VsZWN0aW9uLmNvbnRhaW5zTm9kZShleGNsdWRlTm9kZSwgdHJ1ZSkpICYmIC8vIFNlbGVjdGlvbiBkb2Vzbid0IGNvbnRhaW4gYW55dGhpbmcgd2UndmUgc2FpZCB3ZSBkb24ndCB3YW50IChlLmcuIHRoZSBpbmRpY2F0b3IpXG4gICAgICAgIG5vZGUuY29udGFpbnMoc2VsZWN0aW9uLmdldFJhbmdlQXQoMCkuY29tbW9uQW5jZXN0b3JDb250YWluZXIpOyAvLyBTZWxlY3Rpb24gaXMgY29udGFpbmVkIGVudGlyZWx5IHdpdGhpbiB0aGUgbm9kZVxufVxuXG5mdW5jdGlvbiBncmFiTm9kZShub2RlLCBjYWxsYmFjaykge1xuICAgIHZhciByYW5nZSA9IHJhbmd5LmNyZWF0ZVJhbmdlKGRvY3VtZW50KTtcbiAgICByYW5nZS5zZWxlY3ROb2RlQ29udGVudHMobm9kZSk7XG4gICAgdmFyICRleGNsdWRlZCA9ICQobm9kZSkuZmluZCgnLmFudGVubmEtdGV4dC1pbmRpY2F0b3Itd2lkZ2V0Jyk7XG4gICAgaWYgKCRleGNsdWRlZC5zaXplKCkgPiAwKSB7IC8vIFJlbW92ZSB0aGUgaW5kaWNhdG9yIGZyb20gdGhlIGVuZCBvZiB0aGUgc2VsZWN0ZWQgcmFuZ2UuXG4gICAgICAgIHJhbmdlLnNldEVuZEJlZm9yZSgkZXhjbHVkZWQuZ2V0KDApKTtcbiAgICB9XG4gICAgdmFyIHNlbGVjdGlvbiA9IHJhbmd5LmdldFNlbGVjdGlvbigpO1xuICAgIHNlbGVjdGlvbi5zZXRTaW5nbGVSYW5nZShyYW5nZSk7XG4gICAgdmFyIGxvY2F0aW9uID0gcmFuZ3kuc2VyaWFsaXplU2VsZWN0aW9uKHNlbGVjdGlvbiwgdHJ1ZSwgbm9kZSk7XG4gICAgdmFyIHRleHQgPSBzZWxlY3Rpb24udG9TdHJpbmcoKTtcbiAgICBpZiAodGV4dC50cmltKCkubGVuZ3RoID4gMCkge1xuICAgICAgICBoaWdobGlnaHRTZWxlY3Rpb24oc2VsZWN0aW9uKTsgLy8gSGlnaGxpZ2h0aW5nIGRlc2VsZWN0cyB0aGUgdGV4dCwgc28gZG8gdGhpcyBsYXN0LlxuICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKHRleHQsIGxvY2F0aW9uKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBzZWxlY3Rpb24ucmVtb3ZlQWxsUmFuZ2VzKCk7IC8vIERvbid0IGFjdHVhbGx5IGxlYXZlIHRoZSBlbGVtZW50IHNlbGVjdGVkLlxuICAgIHNlbGVjdGlvbi5yZWZyZXNoKCk7XG59XG5cbi8vIEhpZ2hsaWdodHMgdGhlIGdpdmVuIGxvY2F0aW9uIGluc2lkZSB0aGUgZ2l2ZW4gbm9kZS5cbmZ1bmN0aW9uIGhpZ2hsaWdodExvY2F0aW9uKG5vZGUsIGxvY2F0aW9uKSB7XG4gICAgLy8gVE9ETyBlcnJvciBoYW5kbGluZyBpbiBjYXNlIHRoZSByYW5nZSBpcyBub3QgdmFsaWQ/XG4gICAgaWYgKHJhbmd5LmNhbkRlc2VyaWFsaXplUmFuZ2UobG9jYXRpb24sIG5vZGUsIGRvY3VtZW50KSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdmFyIHJhbmdlID0gcmFuZ3kuZGVzZXJpYWxpemVSYW5nZShsb2NhdGlvbiwgbm9kZSwgZG9jdW1lbnQpO1xuICAgICAgICAgICAgaGlnaGxpZ2h0UmFuZ2UocmFuZ2UpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgLy8gVE9ETzogQ29uc2lkZXIgbG9nZ2luZyBzb21lIGtpbmQgb2YgZXZlbnQgc2VydmVyLXNpZGU/XG4gICAgICAgICAgICAvLyBUT0RPOiBDb25zaWRlciBoaWdobGlnaHRpbmcgdGhlIHdob2xlIG5vZGU/IE9yIGlzIGl0IGJldHRlciB0byBqdXN0IGhpZ2hsaWdodCBub3RoaW5nP1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBoaWdobGlnaHRTZWxlY3Rpb24oc2VsZWN0aW9uKSB7XG4gICAgaGlnaGxpZ2h0UmFuZ2Uoc2VsZWN0aW9uLmdldFJhbmdlQXQoMCkpO1xufVxuXG5mdW5jdGlvbiBoaWdobGlnaHRSYW5nZShyYW5nZSkge1xuICAgIGdldENsYXNzQXBwbGllcigpLmFwcGx5VG9SYW5nZShyYW5nZSk7XG4gICAgaGlnaGxpZ2h0ZWRSYW5nZXMucHVzaChyYW5nZSk7XG59XG5cbi8vIENsZWFycyBhbGwgaGlnaGxpZ2h0cyB0aGF0IGhhdmUgYmVlbiBjcmVhdGVkIG9uIHRoZSBwYWdlLlxuZnVuY3Rpb24gY2xlYXJIaWdobGlnaHRzKCkge1xuICAgIHZhciBjbGFzc0FwcGxpZXIgPSBnZXRDbGFzc0FwcGxpZXIoKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGhpZ2hsaWdodGVkUmFuZ2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciByYW5nZSA9IGhpZ2hsaWdodGVkUmFuZ2VzW2ldO1xuICAgICAgICBpZiAoY2xhc3NBcHBsaWVyLmlzQXBwbGllZFRvUmFuZ2UocmFuZ2UpKSB7XG4gICAgICAgICAgICBjbGFzc0FwcGxpZXIudW5kb1RvUmFuZ2UocmFuZ2UpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGhpZ2hsaWdodGVkUmFuZ2VzID0gW107XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBnZXRTZWxlY3Rpb25FbmRQb2ludDogZ2V0U2VsZWN0aW9uRW5kUG9pbnQsXG4gICAgZ3JhYlNlbGVjdGlvbjogZ3JhYlNlbGVjdGlvbixcbiAgICBncmFiTm9kZTogZ3JhYk5vZGUsXG4gICAgY2xlYXJIaWdobGlnaHRzOiBjbGVhckhpZ2hsaWdodHMsXG4gICAgaGlnaGxpZ2h0OiBoaWdobGlnaHRMb2NhdGlvblxufTsiLCJcbnZhciBub0NvbmZsaWN0O1xudmFyIGxvYWRlZFJhbmd5O1xudmFyIGNhbGxiYWNrcyA9IFtdO1xuXG4vLyBDYXB0dXJlIGFueSBnbG9iYWwgaW5zdGFuY2Ugb2YgcmFuZ3kgd2hpY2ggYWxyZWFkeSBleGlzdHMgYmVmb3JlIHdlIGxvYWQgb3VyIG93bi5cbmZ1bmN0aW9uIGFib3V0VG9Mb2FkKCkge1xuICAgIG5vQ29uZmxpY3QgPSB3aW5kb3cucmFuZ3k7XG59XG5cbi8vIFJlc3RvcmUgdGhlIGdsb2JhbCBpbnN0YW5jZSBvZiByYW5neSAoaWYgYW55KSBhbmQgcGFzcyBvdXQgb3VyIHZlcnNpb24gdG8gb3VyIGNhbGxiYWNrc1xuZnVuY3Rpb24gbG9hZGVkKCkge1xuICAgIGxvYWRlZFJhbmd5ID0gcmFuZ3k7XG4gICAgbG9hZGVkUmFuZ3kuaW5pdCgpO1xuICAgIHdpbmRvdy5yYW5neSA9IG5vQ29uZmxpY3Q7XG4gICAgbm90aWZ5Q2FsbGJhY2tzKCk7XG59XG5cbmZ1bmN0aW9uIG5vdGlmeUNhbGxiYWNrcygpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNhbGxiYWNrcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjYWxsYmFja3NbaV0obG9hZGVkUmFuZ3kpO1xuICAgIH1cbiAgICBjYWxsYmFja3MgPSBbXTtcbn1cblxuLy8gUmVnaXN0ZXJzIHRoZSBnaXZlbiBjYWxsYmFjayB0byBiZSBub3RpZmllZCB3aGVuIG91ciB2ZXJzaW9uIG9mIFJhbmd5IGlzIGxvYWRlZC5cbmZ1bmN0aW9uIG9uTG9hZChjYWxsYmFjaykge1xuICAgIGlmIChsb2FkZWRSYW5neSkge1xuICAgICAgICBjYWxsYmFjayhsb2FkZWRSYW5neSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgY2FsbGJhY2tzLnB1c2goY2FsbGJhY2spO1xuICAgIH1cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGFib3V0VG9Mb2FkOiBhYm91dFRvTG9hZCxcbiAgICBsb2FkZWQ6IGxvYWRlZCxcbiAgICBvbkxvYWQ6IG9uTG9hZFxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcblxudmFyIENMQVNTX0ZVTEwgPSAnYW50ZW5uYS1mdWxsJztcbnZhciBDTEFTU19IQUxGID0gJ2FudGVubmEtaGFsZic7XG5cbmZ1bmN0aW9uIGNvbXB1dGVMYXlvdXREYXRhKHJlYWN0aW9uc0RhdGEpIHtcbiAgICB2YXIgbnVtUmVhY3Rpb25zID0gcmVhY3Rpb25zRGF0YS5sZW5ndGg7XG4gICAgaWYgKG51bVJlYWN0aW9ucyA9PSAwKSB7XG4gICAgICAgIHJldHVybiB7fTsgLy8gVE9ETyBjbGVhbiB0aGlzIHVwXG4gICAgfVxuICAgIC8vIFRPRE86IENvcGllZCBjb2RlIGZyb20gZW5nYWdlX2Z1bGwuY3JlYXRlVGFnQnVja2V0c1xuICAgIHZhciBtYXggPSByZWFjdGlvbnNEYXRhWzBdLmNvdW50O1xuICAgIHZhciBtZWRpYW4gPSByZWFjdGlvbnNEYXRhWyBNYXRoLmZsb29yKHJlYWN0aW9uc0RhdGEubGVuZ3RoLzIpIF0uY291bnQ7XG4gICAgdmFyIG1pbiA9IHJlYWN0aW9uc0RhdGFbIHJlYWN0aW9uc0RhdGEubGVuZ3RoLTEgXS5jb3VudDtcbiAgICB2YXIgdG90YWwgPSAwO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbnVtUmVhY3Rpb25zOyBpKyspIHtcbiAgICAgICAgdG90YWwgKz0gcmVhY3Rpb25zRGF0YVtpXS5jb3VudDtcbiAgICB9XG4gICAgdmFyIGF2ZXJhZ2UgPSBNYXRoLmZsb29yKHRvdGFsIC8gbnVtUmVhY3Rpb25zKTtcbiAgICB2YXIgbWlkVmFsdWUgPSAoIG1lZGlhbiA+IGF2ZXJhZ2UgKSA/IG1lZGlhbiA6IGF2ZXJhZ2U7XG5cbiAgICB2YXIgbGF5b3V0Q2xhc3NlcyA9IFtdO1xuICAgIHZhciBudW1IYWxmc2llcyA9IDA7XG4gICAgdmFyIG51bUZ1bGwgPSAwO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbnVtUmVhY3Rpb25zOyBpKyspIHtcbiAgICAgICAgaWYgKHJlYWN0aW9uc0RhdGFbaV0uY291bnQgPiBtaWRWYWx1ZSkge1xuICAgICAgICAgICAgbGF5b3V0Q2xhc3Nlc1tpXSA9IENMQVNTX0ZVTEw7XG4gICAgICAgICAgICBudW1GdWxsKys7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsYXlvdXRDbGFzc2VzW2ldID0gQ0xBU1NfSEFMRjtcbiAgICAgICAgICAgIG51bUhhbGZzaWVzKys7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKG51bUhhbGZzaWVzICUgMiAhPT0wKSB7XG4gICAgICAgIGxheW91dENsYXNzZXNbbnVtUmVhY3Rpb25zIC0gMV0gPSBDTEFTU19GVUxMOyAvLyBJZiB0aGVyZSBhcmUgYW4gb2RkIG51bWJlciwgdGhlIGxhc3Qgb25lIGdvZXMgZnVsbC5cbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBsYXlvdXRDbGFzc2VzOiBsYXlvdXRDbGFzc2VzXG4gICAgfTtcbn1cblxuZnVuY3Rpb24gc2l6ZVJlYWN0aW9uVGV4dFRvRml0KCRyZWFjdGlvbnNXaW5kb3cpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gc2l6ZVJlYWN0aW9uVGV4dFRvRml0KG5vZGUpIHtcbiAgICAgICAgdmFyICRlbGVtZW50ID0gJChub2RlKTtcbiAgICAgICAgdmFyIG9yaWdpbmFsRGlzcGxheSA9ICRyZWFjdGlvbnNXaW5kb3cuY3NzKCdkaXNwbGF5Jyk7XG4gICAgICAgIGlmIChvcmlnaW5hbERpc3BsYXkgPT09ICdub25lJykgeyAvLyBJZiB3ZSdyZSBzaXppbmcgdGhlIGJveGVzIGJlZm9yZSB0aGUgd2lkZ2V0IGlzIGRpc3BsYXllZCwgdGVtcG9yYXJpbHkgZGlzcGxheSBpdCBvZmZzY3JlZW4uXG4gICAgICAgICAgICAkcmVhY3Rpb25zV2luZG93LmNzcyh7ZGlzcGxheTogJ2Jsb2NrJywgbGVmdDogJzEwMCUnfSk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGhvcml6b250YWxSYXRpbyA9IG5vZGUuY2xpZW50V2lkdGggLyBub2RlLnNjcm9sbFdpZHRoO1xuICAgICAgICBpZiAoaG9yaXpvbnRhbFJhdGlvIDwgMS4wKSB7IC8vIElmIHRoZSB0ZXh0IGRvZXNuJ3QgZml0LCBmaXJzdCB0cnkgdG8gd3JhcCBpdCB0byB0d28gbGluZXMuIFRoZW4gc2NhbGUgaXQgZG93biBpZiBzdGlsbCBuZWNlc3NhcnkuXG4gICAgICAgICAgICB2YXIgdGV4dCA9IG5vZGUuaW5uZXJIVE1MO1xuICAgICAgICAgICAgdmFyIG1pZCA9IE1hdGguY2VpbCh0ZXh0Lmxlbmd0aCAvIDIpOyAvLyBMb29rIGZvciB0aGUgY2xvc2VzdCBzcGFjZSB0byB0aGUgbWlkZGxlLCB3ZWlnaHRlZCBzbGlnaHRseSAoTWF0aC5jZWlsKSB0b3dhcmQgYSBzcGFjZSBpbiB0aGUgc2Vjb25kIGhhbGYuXG4gICAgICAgICAgICB2YXIgc2Vjb25kSGFsZkluZGV4ID0gdGV4dC5pbmRleE9mKCcgJywgbWlkKTtcbiAgICAgICAgICAgIHZhciBmaXJzdEhhbGZJbmRleCA9IHRleHQubGFzdEluZGV4T2YoJyAnLCBtaWQpO1xuICAgICAgICAgICAgdmFyIHNwbGl0SW5kZXggPSBNYXRoLmFicyhzZWNvbmRIYWxmSW5kZXggLSBtaWQpIDwgTWF0aC5hYnMobWlkIC0gZmlyc3RIYWxmSW5kZXgpID8gc2Vjb25kSGFsZkluZGV4IDogZmlyc3RIYWxmSW5kZXg7XG4gICAgICAgICAgICB2YXIgdmVydGljYWxSYXRpbztcbiAgICAgICAgICAgIGlmIChzcGxpdEluZGV4ID4gMSkge1xuICAgICAgICAgICAgICAgIC8vIFNwbGl0IHRoZSB0ZXh0IGFuZCB0aGVuIHNlZSBob3cgaXQgZml0cy5cbiAgICAgICAgICAgICAgICBub2RlLmlubmVySFRNTCA9IHRleHQuc2xpY2UoMCwgc3BsaXRJbmRleCkgKyAnPGJyPicgKyB0ZXh0LnNsaWNlKHNwbGl0SW5kZXgpO1xuICAgICAgICAgICAgICAgIHZhciB3cmFwcGVkSG9yaXpvbnRhbFJhdGlvID0gbm9kZS5jbGllbnRXaWR0aCAvIG5vZGUuc2Nyb2xsV2lkdGg7XG4gICAgICAgICAgICAgICAgdmFyIHBhcmVudEF2YWlsYWJsZUhlaWdodCA9IGNvbXB1dGVBdmFpbGFibGVDbGllbnRBcmVhKG5vZGUucGFyZW50Tm9kZSk7XG4gICAgICAgICAgICAgICAgdmVydGljYWxSYXRpbyA9IG5vZGUuc2Nyb2xsSGVpZ2h0IC8gcGFyZW50QXZhaWxhYmxlSGVpZ2h0O1xuXG4gICAgICAgICAgICAgICAgdmFyIHZlcnRpY2FsUmF0aW9NYXggPSAwLjQ7XG4gICAgICAgICAgICAgICAgaWYgKHZlcnRpY2FsUmF0aW8gJiYgdmVydGljYWxSYXRpbyA+IHZlcnRpY2FsUmF0aW9NYXgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNjYWxlRmFjdG9yID0gdmVydGljYWxSYXRpb01heCAvIHZlcnRpY2FsUmF0aW87XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh3cmFwcGVkSG9yaXpvbnRhbFJhdGlvIDwgMS4wKSB7XG4gICAgICAgICAgICAgICAgICAgIHNjYWxlRmFjdG9yID0gTWF0aC5taW4oc2NhbGVGYWN0b3IsIHdyYXBwZWRIb3Jpem9udGFsUmF0aW8pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoc2NhbGVGYWN0b3IgPD0gaG9yaXpvbnRhbFJhdGlvKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIElmIHdlIGVuZGVkIHVwIGhhdmluZyB0byBtYWtlIHRoZSB0ZXh0IHNtYWxsXG4gICAgICAgICAgICAgICAgICAgIG5vZGUuaW5uZXJIVE1MID0gdGV4dDtcbiAgICAgICAgICAgICAgICAgICAgc2NhbGVGYWN0b3IgPSBob3Jpem9udGFsUmF0aW87XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICRlbGVtZW50LmNzcygnZm9udC1zaXplJywgTWF0aC5tYXgoMTAsIE1hdGguZmxvb3IocGFyc2VJbnQoJGVsZW1lbnQuY3NzKCdmb250LXNpemUnKSkgKiBzY2FsZUZhY3RvcikgLSAxKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICRlbGVtZW50LmNzcygnZm9udC1zaXplJywgTWF0aC5tYXgoMTAsIE1hdGguZmxvb3IocGFyc2VJbnQoJGVsZW1lbnQuY3NzKCdmb250LXNpemUnKSkgKiBob3Jpem9udGFsUmF0aW8pIC0gMSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChvcmlnaW5hbERpc3BsYXkgPT09ICdub25lJykge1xuICAgICAgICAgICAgJHJlYWN0aW9uc1dpbmRvdy5jc3Moe2Rpc3BsYXk6ICcnLCBsZWZ0OiAnJ30pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0ZWFyZG93bjogZnVuY3Rpb24oKSB7fVxuICAgICAgICB9O1xuICAgIH07XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVBdmFpbGFibGVDbGllbnRBcmVhKG5vZGUpIHtcbiAgICB2YXIgbm9kZVN0eWxlID0gd2luZG93LmdldENvbXB1dGVkU3R5bGUobm9kZSk7XG4gICAgcmV0dXJuIHBhcnNlSW50KG5vZGVTdHlsZS5oZWlnaHQpIC0gcGFyc2VJbnQobm9kZVN0eWxlLnBhZGRpbmdUb3ApIC0gcGFyc2VJbnQobm9kZVN0eWxlLnBhZGRpbmdCb3R0b20pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBzaXplVG9GaXQ6IHNpemVSZWFjdGlvblRleHRUb0ZpdCxcbiAgICBjb21wdXRlTGF5b3V0RGF0YTogY29tcHV0ZUxheW91dERhdGFcbn07IiwidmFyIENhbGxiYWNrU3VwcG9ydCA9IHJlcXVpcmUoJy4vY2FsbGJhY2stc3VwcG9ydCcpO1xuXG4vLyBUaGlzIG1vZHVsZSBhbGxvd3MgdXMgdG8gcmVnaXN0ZXIgY2FsbGJhY2tzIHRoYXQgYXJlIHRocm90dGxlZCBpbiB0aGVpciBmcmVxdWVuY3kuIFRoaXMgaXMgdXNlZnVsIGZvciBldmVudHMgbGlrZVxuLy8gcmVzaXplIGFuZCBzY3JvbGwsIHdoaWNoIGNhbiBiZSBmaXJlZCBhdCBhbiBleHRyZW1lbHkgaGlnaCByYXRlLlxuXG52YXIgdGhyb3R0bGVkTGlzdGVuZXJzID0ge307XG5cbmZ1bmN0aW9uIG9uKHR5cGUsIGNhbGxiYWNrKSB7XG4gICAgdGhyb3R0bGVkTGlzdGVuZXJzW3R5cGVdID0gdGhyb3R0bGVkTGlzdGVuZXJzW3R5cGVdIHx8IGNyZWF0ZVRocm90dGxlZExpc3RlbmVyKHR5cGUpO1xuICAgIHRocm90dGxlZExpc3RlbmVyc1t0eXBlXS5hZGRDYWxsYmFjayhjYWxsYmFjayk7XG59XG5cbmZ1bmN0aW9uIG9mZih0eXBlLCBjYWxsYmFjaykge1xuICAgIHZhciBldmVudExpc3RlbmVyID0gdGhyb3R0bGVkTGlzdGVuZXJzW3R5cGVdO1xuICAgIGlmIChldmVudExpc3RlbmVyKSB7XG4gICAgICAgIGV2ZW50TGlzdGVuZXIucmVtb3ZlQ2FsbGJhY2soY2FsbGJhY2spO1xuICAgICAgICBpZiAoZXZlbnRMaXN0ZW5lci5pc0VtcHR5KCkpIHtcbiAgICAgICAgICAgIGV2ZW50TGlzdGVuZXIudGVhcmRvd24oKTtcbiAgICAgICAgICAgIGRlbGV0ZSB0aHJvdHRsZWRMaXN0ZW5lcnNbdHlwZV07XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8vIENyZWF0ZXMgYSBsaXN0ZW5lciBvbiB0aGUgcGFydGljdWxhciBldmVudCB0eXBlLiBDYWxsYmFja3MgYWRkZWQgdG8gdGhpcyBsaXN0ZW5lciB3aWxsIGJlIHRocm90dGxlZC5cbmZ1bmN0aW9uIGNyZWF0ZVRocm90dGxlZExpc3RlbmVyKHR5cGUpIHtcbiAgICB2YXIgY2FsbGJhY2tzID0gQ2FsbGJhY2tTdXBwb3J0LmNyZWF0ZSgpO1xuICAgIHZhciBldmVudFRpbWVvdXQ7XG4gICAgc2V0dXAoKTtcbiAgICByZXR1cm4ge1xuICAgICAgICBhZGRDYWxsYmFjazogY2FsbGJhY2tzLmFkZCxcbiAgICAgICAgcmVtb3ZlQ2FsbGJhY2s6IGNhbGxiYWNrcy5yZW1vdmUsXG4gICAgICAgIGlzRW1wdHk6IGNhbGxiYWNrcy5pc0VtcHR5LFxuICAgICAgICB0ZWFyZG93bjogdGVhcmRvd25cbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gaGFuZGxlRXZlbnQoKSB7XG4gICAgICAgaWYgKCFldmVudFRpbWVvdXQpIHtcbiAgICAgICAgICAgZXZlbnRUaW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgIGNhbGxiYWNrcy5pbnZva2VBbGwoKTtcbiAgICAgICAgICAgICAgIGV2ZW50VGltZW91dCA9IG51bGw7XG4gICAgICAgICAgIH0sIDY2KTsgLy8gMTUgRlBTXG4gICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNldHVwKCkge1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcih0eXBlLCBoYW5kbGVFdmVudCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdGVhcmRvd24oKSB7XG4gICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKHR5cGUsIGhhbmRsZUV2ZW50KTtcbiAgICB9XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBvbjogb24sXG4gICAgb2ZmOiBvZmZcbn07IiwiXG4vLyBTZXRzIHVwIHRoZSBnaXZlbiBlbGVtZW50IHRvIGJlIGNhbGxlZCB3aXRoIGEgVG91Y2hFdmVudCB0aGF0IHdlIHJlY29nbml6ZSBhcyBhIHRhcC5cbmZ1bmN0aW9uIHNldHVwVG91Y2hUYXBFdmVudHMoZWxlbWVudCwgY2FsbGJhY2spIHtcbiAgICB2YXIgdGltZW91dCA9IDQwMDsgLy8gVGhpcyBpcyB0aGUgdGltZSBiZXR3ZWVuIHRvdWNoc3RhcnQgYW5kIHRvdWNoZW5kIHRoYXQgd2UgdXNlIHRvIGRpc3Rpbmd1aXNoIGEgdGFwIGZyb20gYSBsb25nIHByZXNzLlxuICAgIHZhciB2YWxpZFRhcCA9IGZhbHNlO1xuICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRvdWNoU3RhcnQpO1xuICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgdG91Y2hNb3ZlKTtcbiAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoY2FuY2VsJywgdG91Y2hDYW5jZWwpO1xuICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCB0b3VjaEVuZCk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdGVhcmRvd246IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdG91Y2hTdGFydCk7XG4gICAgICAgICAgICBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIHRvdWNoTW92ZSk7XG4gICAgICAgICAgICBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoY2FuY2VsJywgdG91Y2hDYW5jZWwpO1xuICAgICAgICAgICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIHRvdWNoRW5kKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBmdW5jdGlvbiB0b3VjaFN0YXJ0KGV2ZW50KSB7XG4gICAgICAgIHZhbGlkVGFwID0gdHJ1ZTtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhbGlkVGFwID0gZmFsc2U7XG4gICAgICAgIH0sIHRpbWVvdXQpO1xuICAgIH1cbiAgICBmdW5jdGlvbiB0b3VjaEVuZChldmVudCkge1xuICAgICAgICBpZiAodmFsaWRUYXAgJiYgZXZlbnQuY2hhbmdlZFRvdWNoZXMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhldmVudCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gdG91Y2hNb3ZlKGV2ZW50KSB7XG4gICAgICAgIHZhbGlkVGFwID0gZmFsc2U7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHRvdWNoQ2FuY2VsKGV2ZW50KSB7XG4gICAgICAgIHZhbGlkVGFwID0gZmFsc2U7XG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgc2V0dXBUYXA6IHNldHVwVG91Y2hUYXBFdmVudHNcbn07IiwiXG5cbmZ1bmN0aW9uIHRvZ2dsZVRyYW5zaXRpb25DbGFzcygkZWxlbWVudCwgY2xhc3NOYW1lLCBzdGF0ZSwgbmV4dFN0ZXApIHtcbiAgICAkZWxlbWVudC5vbihcInRyYW5zaXRpb25lbmQgd2Via2l0VHJhbnNpdGlvbkVuZCBvVHJhbnNpdGlvbkVuZCBNU1RyYW5zaXRpb25FbmRcIixcbiAgICAgICAgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgIC8vIG9uY2UgdGhlIENTUyB0cmFuc2l0aW9uIGlzIGNvbXBsZXRlLCBjYWxsIG91ciBuZXh0IHN0ZXBcbiAgICAgICAgICAgIC8vIFNlZTogaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy85MjU1Mjc5L2NhbGxiYWNrLXdoZW4tY3NzMy10cmFuc2l0aW9uLWZpbmlzaGVzXG4gICAgICAgICAgICBpZiAoZXZlbnQudGFyZ2V0ID09IGV2ZW50LmN1cnJlbnRUYXJnZXQpIHtcbiAgICAgICAgICAgICAgICAkZWxlbWVudC5vZmYoXCJ0cmFuc2l0aW9uZW5kIHdlYmtpdFRyYW5zaXRpb25FbmQgb1RyYW5zaXRpb25FbmQgTVNUcmFuc2l0aW9uRW5kXCIpO1xuICAgICAgICAgICAgICAgIGlmIChuZXh0U3RlcCkge1xuICAgICAgICAgICAgICAgICAgICBuZXh0U3RlcCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICk7XG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gVGhpcyB3b3JrYXJvdW5kIGdldHMgdXMgY29uc2lzdGVudCB0cmFuc2l0aW9uZW5kIGV2ZW50cywgd2hpY2ggY2FuIG90aGVyd2lzZSBiZSBmbGFreSBpZiB3ZSdyZSBzZXR0aW5nIG90aGVyXG4gICAgICAgIC8vIGNsYXNzZXMgYXQgdGhlIHNhbWUgdGltZSBhcyB0cmFuc2l0aW9uIGNsYXNzZXMuXG4gICAgICAgICRlbGVtZW50LnRvZ2dsZUNsYXNzKGNsYXNzTmFtZSwgc3RhdGUpO1xuICAgIH0sIDIwKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgdG9nZ2xlQ2xhc3M6IHRvZ2dsZVRyYW5zaXRpb25DbGFzc1xufTsiLCJ2YXIgUFJPRF9TRVJWRVJfVVJMID0gXCJodHRwczovL3d3dy5hbnRlbm5hLmlzXCI7IC8vIFRPRE86IHd3dz8gaG93IGFib3V0IGFudGVubmEuaXMgb3IgYXBpLmFudGVubmEuaXM/XG52YXIgREVWX1NFUlZFUl9VUkwgPSB3aW5kb3cubG9jYXRpb24ucHJvdG9jb2wgKyBcIi8vbG9jYWwtc3RhdGljLmFudGVubmEuaXM6ODA4MVwiO1xudmFyIFRFU1RfU0VSVkVSX1VSTCA9IHdpbmRvdy5sb2NhdGlvbi5wcm90b2NvbCArICcvL2xvY2FsaG9zdDozMDAwJztcblxudmFyIFBST0RfRVZFTlRfU0VSVkVSX1VSTCA9IHdpbmRvdy5sb2NhdGlvbi5wcm90b2NvbCArICcvL2V2ZW50cy5yZWFkcmJvYXJkLmNvbSc7XG52YXIgREVWX0VWRU5UX1NFUlZFUl9VUkwgPSB3aW5kb3cubG9jYXRpb24ucHJvdG9jb2wgKyAnLy9ub2RlYnEuZG9ja2VyOjMwMDAnO1xuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgUFJPRFVDVElPTjogUFJPRF9TRVJWRVJfVVJMLFxuICAgIERFVkVMT1BNRU5UOiBERVZfU0VSVkVSX1VSTCxcbiAgICBURVNUOiBURVNUX1NFUlZFUl9VUkwsXG4gICAgUFJPRFVDVElPTl9FVkVOVFM6IFBST0RfRVZFTlRfU0VSVkVSX1VSTCxcbiAgICBERVZFTE9QTUVOVF9FVkVOVFM6IERFVl9FVkVOVF9TRVJWRVJfVVJMXG59OyIsIlxuZnVuY3Rpb24gZ2V0R3JvdXBTZXR0aW5nc1VybCgpIHtcbiAgICByZXR1cm4gJy9hcGkvc2V0dGluZ3MvJztcbn1cblxuZnVuY3Rpb24gZ2V0UGFnZURhdGFVcmwoKSB7XG4gICAgcmV0dXJuICcvYXBpL3BhZ2VuZXdlci8nO1xufVxuXG5mdW5jdGlvbiBnZXRDcmVhdGVSZWFjdGlvblVybCgpIHtcbiAgICByZXR1cm4gJy9hcGkvdGFnL2NyZWF0ZS8nO1xufVxuXG5mdW5jdGlvbiBnZXRDcmVhdGVDb21tZW50VXJsKCkge1xuICAgIHJldHVybiAnL2FwaS9jb21tZW50L2NyZWF0ZS8nO1xufVxuXG5mdW5jdGlvbiBnZXRGZXRjaENvbW1lbnRVcmwoKSB7XG4gICAgcmV0dXJuICcvYXBpL2NvbW1lbnQvcmVwbGllcy8nO1xufVxuXG5mdW5jdGlvbiBnZXRGZXRjaENvbnRlbnRCb2RpZXNVcmwoKSB7XG4gICAgcmV0dXJuICcvYXBpL2NvbnRlbnQvYm9kaWVzLyc7XG59XG5cbmZ1bmN0aW9uIGdldEV2ZW50VXJsKCkge1xuICAgIHJldHVybiAnL2luc2VydCc7IC8vIE5vdGUgdGhhdCB0aGlzIFVSTCBpcyBmb3IgdGhlIGV2ZW50IHNlcnZlciwgbm90IHRoZSBhcHAgc2VydmVyLlxufVxuXG5mdW5jdGlvbiBjb21wdXRlSW1hZ2VVcmwoJGVsZW1lbnQsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICBpZiAoZ3JvdXBTZXR0aW5ncy5sZWdhY3lCZWhhdmlvcigpKSB7XG4gICAgICAgIHJldHVybiBsZWdhY3lDb21wdXRlSW1hZ2VVcmwoJGVsZW1lbnQpO1xuICAgIH1cbiAgICB2YXIgY29udGVudCA9ICRlbGVtZW50LmF0dHIoJ2FudC1pdGVtLWNvbnRlbnQnKSB8fCAkZWxlbWVudC5hdHRyKCdzcmMnKTtcbiAgICBpZiAoY29udGVudCAmJiBjb250ZW50LmluZGV4T2YoJy8vJykgIT09IDAgJiYgY29udGVudC5pbmRleE9mKCdodHRwJykgIT09IDApIHsgLy8gcHJvdG9jb2wtcmVsYXRpdmUgb3IgYWJzb2x1dGUgdXJsLCBlLmcuIC8vZG9tYWluLmNvbS9mb28vYmFyLnBuZyBvciBodHRwOi8vZG9tYWluLmNvbS9mb28vYmFyL3BuZ1xuICAgICAgICBpZiAoY29udGVudC5pbmRleE9mKCcvJykgPT09IDApIHsgLy8gZG9tYWluLXJlbGF0aXZlIHVybCwgZS5nLiAvZm9vL2Jhci5wbmcgPT4gZG9tYWluLmNvbS9mb28vYmFyLnBuZ1xuICAgICAgICAgICAgY29udGVudCA9IHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4gKyBjb250ZW50O1xuICAgICAgICB9IGVsc2UgeyAvLyBwYXRoLXJlbGF0aXZlIHVybCwgZS5nLiBiYXIucG5nID0+IGRvbWFpbi5jb20vYmF6L2Jhci5wbmdcbiAgICAgICAgICAgIHZhciBwYXRoID0gd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lO1xuICAgICAgICAgICAgdmFyIGluZGV4ID0gcGF0aC5sYXN0SW5kZXhPZignLycpICsgMTtcbiAgICAgICAgICAgIGlmIChwYXRoLmxlbmd0aCA+IGluZGV4KSB7XG4gICAgICAgICAgICAgICAgcGF0aCA9IHBhdGguc3Vic3RyaW5nKDAsIGluZGV4KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnRlbnQgPSB3aW5kb3cubG9jYXRpb24ub3JpZ2luICsgcGF0aCArIGNvbnRlbnQ7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGNvbnRlbnQ7XG59XG5cbi8vIExlZ2FjeSBpbXBsZW1lbnRhdGlvbiB3aGljaCBtYWludGFpbnMgdGhlIG9sZCBiZWhhdmlvciBvZiBlbmdhZ2VfZnVsbFxuLy8gVGhpcyBjb2RlIGlzIHdyb25nIGZvciBVUkxzIHRoYXQgc3RhcnQgd2l0aCBcIi8vXCIuIEl0IGFsc28gZ2l2ZXMgcHJlY2VkZW5jZSB0byB0aGUgc3JjIGF0dCBpbnN0ZWFkIG9mIGFudC1pdGVtLWNvbnRlbnRcbmZ1bmN0aW9uIGxlZ2FjeUNvbXB1dGVJbWFnZVVybCgkZWxlbWVudCkge1xuICAgIHZhciBjb250ZW50ID0gJGVsZW1lbnQuYXR0cignc3JjJykgfHwgJGVsZW1lbnQuYXR0cignYW50LWl0ZW0tY29udGVudCcpO1xuICAgIGlmIChjb250ZW50KSB7XG4gICAgICAgIGlmIChjb250ZW50LmluZGV4T2YoJy8nKSA9PT0gMCkge1xuICAgICAgICAgICAgY29udGVudCA9IHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4gKyBjb250ZW50O1xuICAgICAgICB9XG4gICAgICAgIGlmIChjb250ZW50LmluZGV4T2YoJ2h0dHAnKSAhPT0gMCkge1xuICAgICAgICAgICAgY29udGVudCA9IHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4gKyB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUgKyBjb250ZW50O1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBjb250ZW50O1xufVxuXG5mdW5jdGlvbiBjb21wdXRlTWVkaWFVcmwoJGVsZW1lbnQsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICBpZiAoZ3JvdXBTZXR0aW5ncy5sZWdhY3lCZWhhdmlvcigpKSB7XG4gICAgICAgIHJldHVybiBsZWdhY3lDb21wdXRlTWVkaWFVcmwoJGVsZW1lbnQpO1xuICAgIH1cbiAgICB2YXIgY29udGVudCA9ICRlbGVtZW50LmF0dHIoJ2FudC1pdGVtLWNvbnRlbnQnKSB8fCAkZWxlbWVudC5hdHRyKCdzcmMnKSB8fCAkZWxlbWVudC5hdHRyKCdkYXRhJyk7XG4gICAgaWYgKGNvbnRlbnQgJiYgY29udGVudC5pbmRleE9mKCcvLycpICE9PSAwICYmIGNvbnRlbnQuaW5kZXhPZignaHR0cCcpICE9PSAwKSB7IC8vIHByb3RvY29sLXJlbGF0aXZlIG9yIGFic29sdXRlIHVybCwgZS5nLiAvL2RvbWFpbi5jb20vZm9vL2Jhci5wbmcgb3IgaHR0cDovL2RvbWFpbi5jb20vZm9vL2Jhci9wbmdcbiAgICAgICAgaWYgKGNvbnRlbnQuaW5kZXhPZignLycpID09PSAwKSB7IC8vIGRvbWFpbi1yZWxhdGl2ZSB1cmwsIGUuZy4gL2Zvby9iYXIucG5nID0+IGRvbWFpbi5jb20vZm9vL2Jhci5wbmdcbiAgICAgICAgICAgIGNvbnRlbnQgPSB3aW5kb3cubG9jYXRpb24ub3JpZ2luICsgY29udGVudDtcbiAgICAgICAgfSBlbHNlIHsgLy8gcGF0aC1yZWxhdGl2ZSB1cmwsIGUuZy4gYmFyLnBuZyA9PiBkb21haW4uY29tL2Jhei9iYXIucG5nXG4gICAgICAgICAgICB2YXIgcGF0aCA9IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZTtcbiAgICAgICAgICAgIHZhciBpbmRleCA9IHBhdGgubGFzdEluZGV4T2YoJy8nKSArIDE7XG4gICAgICAgICAgICBpZiAocGF0aC5sZW5ndGggPiBpbmRleCkge1xuICAgICAgICAgICAgICAgIHBhdGggPSBwYXRoLnN1YnN0cmluZygwLCBpbmRleCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb250ZW50ID0gd2luZG93LmxvY2F0aW9uLm9yaWdpbiArIHBhdGggKyBjb250ZW50O1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBjb250ZW50O1xufVxuXG4vLyBMZWdhY3kgaW1wbGVtZW50YXRpb24gd2hpY2ggbWFpbnRhaW5zIHRoZSBvbGQgYmVoYXZpb3Igb2YgZW5nYWdlX2Z1bGxcbi8vIFRoaXMgY29kZSBpcyB3cm9uZyBmb3IgVVJMcyB0aGF0IHN0YXJ0IHdpdGggXCIvL1wiLiBJdCBhbHNvIGdpdmVzIHByZWNlZGVuY2UgdG8gdGhlIHNyYyBhdHQgaW5zdGVhZCBvZiBhbnQtaXRlbS1jb250ZW50XG5mdW5jdGlvbiBsZWdhY3lDb21wdXRlTWVkaWFVcmwoJGVsZW1lbnQpIHtcbiAgICB2YXIgY29udGVudCA9ICRlbGVtZW50LmF0dHIoJ2FudC1pdGVtLWNvbnRlbnQnKSB8fCAkZWxlbWVudC5hdHRyKCdzcmMnKSB8fCAkZWxlbWVudC5hdHRyKCdkYXRhJykgfHwgJyc7XG4gICAgaWYgKGNvbnRlbnQpIHtcbiAgICAgICAgaWYgKGNvbnRlbnQuaW5kZXhPZignLycpID09PSAwKSB7XG4gICAgICAgICAgICBjb250ZW50ID0gd2luZG93LmxvY2F0aW9uLm9yaWdpbiArIGNvbnRlbnQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvbnRlbnQuaW5kZXhPZignaHR0cCcpICE9PSAwKSB7XG4gICAgICAgICAgICBjb250ZW50ID0gd2luZG93LmxvY2F0aW9uLm9yaWdpbiArIHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZSArIGNvbnRlbnQ7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGNvbnRlbnQ7XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBncm91cFNldHRpbmdzVXJsOiBnZXRHcm91cFNldHRpbmdzVXJsLFxuICAgIHBhZ2VEYXRhVXJsOiBnZXRQYWdlRGF0YVVybCxcbiAgICBjcmVhdGVSZWFjdGlvblVybDogZ2V0Q3JlYXRlUmVhY3Rpb25VcmwsXG4gICAgY3JlYXRlQ29tbWVudFVybDogZ2V0Q3JlYXRlQ29tbWVudFVybCxcbiAgICBmZXRjaENvbW1lbnRVcmw6IGdldEZldGNoQ29tbWVudFVybCxcbiAgICBmZXRjaENvbnRlbnRCb2RpZXNVcmw6IGdldEZldGNoQ29udGVudEJvZGllc1VybCxcbiAgICBjb21wdXRlSW1hZ2VVcmw6IGNvbXB1dGVJbWFnZVVybCxcbiAgICBjb21wdXRlTWVkaWFVcmw6IGNvbXB1dGVNZWRpYVVybCxcbiAgICBldmVudFVybDogZ2V0RXZlbnRVcmxcbn07XG4iLCJ2YXIgQXBwTW9kZSA9IHJlcXVpcmUoJy4vYXBwLW1vZGUnKTtcblxuLy8gVE9ETzogRmlndXJlIG91dCBob3cgbWFueSBkaWZmZXJlbnQgZm9ybWF0cyBvZiB1c2VyIGRhdGEgd2UgaGF2ZSBhbmQgZWl0aGVyIHVuaWZ5IHRoZW0gb3IgcHJvdmlkZSBjbGVhclxuLy8gICAgICAgQVBJIGhlcmUgdG8gdHJhbnNsYXRlIGVhY2ggdmFyaWF0aW9uIGludG8gc29tZXRoaW5nIHN0YW5kYXJkIGZvciB0aGUgY2xpZW50LlxuLy8gVE9ETzogSGF2ZSBYRE1DbGllbnQgcGFzcyB0aHJvdWdoIHRoaXMgbW9kdWxlIGFzIHdlbGwuXG5mdW5jdGlvbiB1c2VyRnJvbUNvbW1lbnRKU09OKGpzb25Vc2VyLCBzb2NpYWxVc2VyKSB7IC8vIFRoaXMgZm9ybWF0IHdvcmtzIGZvciB0aGUgdXNlciByZXR1cm5lZCBmcm9tIC9hcGkvY29tbWVudHMvcmVwbGllc1xuICAgIHZhciB1c2VyID0ge307XG4gICAgaWYgKGpzb25Vc2VyLnVzZXJfaWQpIHtcbiAgICAgICAgdXNlci5pZCA9IGpzb25Vc2VyLnVzZXJfaWQ7XG4gICAgfVxuICAgIGlmIChzb2NpYWxVc2VyKSB7XG4gICAgICAgIHVzZXIuaW1hZ2VVUkwgPSBzb2NpYWxVc2VyLmltZ191cmw7XG4gICAgICAgIHVzZXIubmFtZSA9IHNvY2lhbFVzZXIuZnVsbF9uYW1lO1xuICAgIH1cbiAgICBpZiAoIXVzZXIubmFtZSkge1xuICAgICAgICB1c2VyLm5hbWUgPSBqc29uVXNlci5maXJzdF9uYW1lID8gKGpzb25Vc2VyLmZpcnN0X25hbWUgKyAnICcgKyBqc29uVXNlci5sYXN0X25hbWUpIDogJ0Fub255bW91cyc7XG4gICAgfVxuICAgIGlmICghdXNlci5pbWFnZVVSTCkge1xuICAgICAgICB1c2VyLmltYWdlVVJMID0gYW5vbnltb3VzSW1hZ2VVUkwoKVxuICAgIH1cbiAgICByZXR1cm4gdXNlcjtcbn1cblxuXG4vLyBUT0RPOiBSZXZpc2l0IHRoZSB1c2VyIHRoYXQgd2UgcGFzcyBiYWNrIGZvciBuZXcgY29tbWVudHMuIE9wdGlvbnMgYXJlOlxuLy8gICAgICAgMS4gVXNlIHRoZSBsb2dnZWQgaW4gdXNlciwgYXNzdW1pbmcgd2UgYWxyZWFkeSBoYXZlIG9uZSBpbiBoYW5kIHZpYSBYRE0uXG4vLyAgICAgICAyLiBVc2UgYSBnZW5lcmljIFwieW91XCIgcmVwcmVzZW50YXRpb24gbGlrZSB3ZSdyZSBkb2luZyBub3cuXG4vLyAgICAgICAzLiBEb24ndCBzaG93IGFueSBpbmRpY2F0aW9uIG9mIHRoZSB1c2VyLiBKdXN0IHNob3cgdGhlIGNvbW1lbnQuXG4vLyAgICAgICBGb3Igbm93LCB0aGlzIGlzIGp1c3QgZ2l2aW5nIHVzIHNvbWUgbm90aW9uIG9mIHVzZXIgd2l0aG91dCBhIHJvdW5kIHRyaXAuXG5mdW5jdGlvbiBvcHRpbWlzdGljVXNlcigpIHtcbiAgICB2YXIgdXNlciA9IHtcbiAgICAgICAgbmFtZTogJ1lvdScsXG4gICAgICAgIGltYWdlVVJMOiBhbm9ueW1vdXNJbWFnZVVSTCgpXG4gICAgfTtcbiAgICByZXR1cm4gdXNlcjtcbn1cblxuZnVuY3Rpb24gYW5vbnltb3VzSW1hZ2VVUkwoKSB7XG4gICAgcmV0dXJuIEFwcE1vZGUub2ZmbGluZSA/ICcvc3RhdGljL3dpZGdldC9pbWFnZXMvYW5vbnltb3VzcGxvZGUucG5nJyA6ICdodHRwOi8vczMuYW1hem9uYXdzLmNvbS9yZWFkcmJvYXJkL3dpZGdldC9pbWFnZXMvYW5vbnltb3VzcGxvZGUucG5nJztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgZnJvbUNvbW1lbnRKU09OOiB1c2VyRnJvbUNvbW1lbnRKU09OLFxuICAgIG9wdGltaXN0aWNVc2VyOiBvcHRpbWlzdGljVXNlclxufTsiLCJ2YXIgaWQgPSAnYW50ZW5uYS13aWRnZXQtYnVja2V0JztcblxuZnVuY3Rpb24gZ2V0V2lkZ2V0QnVja2V0KCkge1xuICAgIHZhciBidWNrZXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7XG4gICAgaWYgKCFidWNrZXQpIHtcbiAgICAgICAgYnVja2V0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIGJ1Y2tldC5zZXRBdHRyaWJ1dGUoJ2lkJywgaWQpO1xuICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGJ1Y2tldCk7XG4gICAgfVxuICAgIHJldHVybiBidWNrZXQ7XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBnZXQ6IGdldFdpZGdldEJ1Y2tldCxcbiAgICBzZWxlY3RvcjogZnVuY3Rpb24oKSB7IHJldHVybiAnIycgKyBpZDsgfVxufTsiLCJcbnZhciBVUkxzID0gcmVxdWlyZSgnLi91cmxzJyk7XG52YXIgWGRtTG9hZGVyID0gcmVxdWlyZSgnLi94ZG0tbG9hZGVyJyk7XG5cbnZhciBFdmVudHMgPSByZXF1aXJlKCcuLi9ldmVudHMnKTsgLy8gVE9ETzogcmVzb2x2ZSB0aGlzIGJhY2t3YXJkIGRlcGVuZGVuY3lcblxuLy8gUmVnaXN0ZXIgb3Vyc2VsdmVzIHRvIGhlYXIgbWVzc2FnZXNcbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwibWVzc2FnZVwiLCByZWNlaXZlTWVzc2FnZSwgZmFsc2UpO1xuXG52YXIgY2FsbGJhY2tzID0ge1xuICAgICd4ZG0gbG9hZGVkJzogeGRtTG9hZGVkXG59O1xudmFyIGNhY2hlID0ge307XG5cbnZhciBpc1hETUxvYWRlZCA9IGZhbHNlO1xuLy8gVGhlIGluaXRpYWwgbWVzc2FnZSB0aGF0IFhETSBzZW5kcyBvdXQgd2hlbiBpdCBsb2Fkc1xuZnVuY3Rpb24geGRtTG9hZGVkKGRhdGEpIHtcbiAgICBpc1hETUxvYWRlZCA9IHRydWU7XG59XG5cbmZ1bmN0aW9uIHNldE1lc3NhZ2VIYW5kbGVyKG1lc3NhZ2VLZXksIGNhbGxiYWNrKSB7XG4gICAgY2FsbGJhY2tzW21lc3NhZ2VLZXldID0gY2FsbGJhY2s7XG59XG5cbmZ1bmN0aW9uIGdldFVzZXIoY2FsbGJhY2spIHtcbiAgICB2YXIgbWVzc2FnZSA9ICdnZXRVc2VyJztcbiAgICBwb3N0TWVzc2FnZShtZXNzYWdlLCAncmV0dXJuaW5nX3VzZXInLCBzdWNjZXNzLCB2YWxpZENhY2hlRW50cnkpO1xuXG4gICAgZnVuY3Rpb24gc3VjY2VzcyhyZXNwb25zZSkge1xuICAgICAgICB2YXIgdXNlckluZm8gPSByZXNwb25zZS5kZXRhaWw7XG4gICAgICAgIGNhbGxiYWNrKHVzZXJJbmZvKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB2YWxpZENhY2hlRW50cnkocmVzcG9uc2UpIHtcbiAgICAgICAgdmFyIHVzZXJJbmZvID0gcmVzcG9uc2UuZGV0YWlsO1xuICAgICAgICByZXR1cm4gdXNlckluZm8gJiYgdXNlckluZm8uYW50X3Rva2VuICYmIHVzZXJJbmZvLnVzZXJfaWQ7IC8vIFRPRE8gJiYgdXNlckluZm8udXNlcl90eXBlICYmIHNvY2lhbF91c2VyLCBldGMuP1xuICAgIH1cbn1cblxuZnVuY3Rpb24gcmVjZWl2ZU1lc3NhZ2UoZXZlbnQpIHtcbiAgICB2YXIgZXZlbnRPcmlnaW4gPSBldmVudC5vcmlnaW47XG4gICAgaWYgKGV2ZW50T3JpZ2luID09PSBYZG1Mb2FkZXIuT1JJR0lOKSB7XG4gICAgICAgIHZhciByZXNwb25zZSA9IGV2ZW50LmRhdGE7XG4gICAgICAgIC8vIFRPRE86IFRoZSBldmVudC5zb3VyY2UgcHJvcGVydHkgZ2l2ZXMgdXMgdGhlIHNvdXJjZSB3aW5kb3cgb2YgdGhlIG1lc3NhZ2UgYW5kIGN1cnJlbnRseSB0aGUgWERNIGZyYW1lIGZpcmVzIG91dFxuICAgICAgICAvLyBldmVudHMgdGhhdCB3ZSByZWNlaXZlIGJlZm9yZSB3ZSBldmVyIHRyeSB0byBwb3N0IGFueXRoaW5nLiBTbyB3ZSAqY291bGQqIGhvbGQgb250byB0aGUgd2luZG93IGhlcmUgYW5kIHVzZSBpdFxuICAgICAgICAvLyBmb3IgcG9zdGluZyBtZXNzYWdlcyByYXRoZXIgdGhhbiBsb29raW5nIGZvciB0aGUgWERNIGZyYW1lIG91cnNlbHZlcy4gTmVlZCB0byBsb29rIGF0IHdoaWNoIGV2ZW50cyB0aGUgWERNIGZyYW1lXG4gICAgICAgIC8vIGZpcmVzIG91dCB0byBhbGwgd2luZG93cyBiZWZvcmUgYmVpbmcgYXNrZWQuIEN1cnJlbnRseSwgaXQncyBtb3JlIHRoYW4gXCJ4ZG0gbG9hZGVkXCIuIFdoeT9cbiAgICAgICAgLy92YXIgc291cmNlV2luZG93ID0gZXZlbnQuc291cmNlO1xuXG4gICAgICAgIHZhciBjYWxsYmFja0tleSA9IHJlc3BvbnNlLmtleTtcbiAgICAgICAgY2FjaGVbY2FsbGJhY2tLZXldID0gcmVzcG9uc2U7XG4gICAgICAgIHZhciBjYWxsYmFjayA9IGNhbGxiYWNrc1tjYWxsYmFja0tleV07XG4gICAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICAgICAgY2FsbGJhY2socmVzcG9uc2UpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBwb3N0TWVzc2FnZShtZXNzYWdlLCBjYWxsYmFja0tleSwgY2FsbGJhY2ssIHZhbGlkQ2FjaGVFbnRyeSkge1xuICAgIGlmIChpc1hETUxvYWRlZCkge1xuICAgICAgICB2YXIgdGFyZ2V0T3JpZ2luID0gWGRtTG9hZGVyLk9SSUdJTjtcbiAgICAgICAgY2FsbGJhY2tzW2NhbGxiYWNrS2V5XSA9IGNhbGxiYWNrO1xuICAgICAgICB2YXIgY2FjaGVkUmVzcG9uc2UgPSBjYWNoZVtjYWxsYmFja0tleV07XG4gICAgICAgIGlmIChjYWNoZWRSZXNwb25zZSAhPT0gdW5kZWZpbmVkICYmIHZhbGlkQ2FjaGVFbnRyeSAmJiB2YWxpZENhY2hlRW50cnkoY2FjaGVbY2FsbGJhY2tLZXldKSkge1xuICAgICAgICAgICAgY2FsbGJhY2soY2FjaGVbY2FsbGJhY2tLZXldKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciB4ZG1GcmFtZSA9IGdldFhETUZyYW1lKCk7XG4gICAgICAgICAgICBpZiAoeGRtRnJhbWUpIHtcbiAgICAgICAgICAgICAgICB4ZG1GcmFtZS5wb3N0TWVzc2FnZShtZXNzYWdlLCB0YXJnZXRPcmlnaW4pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcXVldWVNZXNzYWdlKG1lc3NhZ2UsIGNhbGxiYWNrS2V5LCBjYWxsYmFjaywgdmFsaWRDYWNoZUVudHJ5KTtcbiAgICB9XG59XG5cbnZhciBtZXNzYWdlUXVldWUgPSBbXTtcbnZhciBtZXNzYWdlUXVldWVUaW1lcjtcblxuZnVuY3Rpb24gcXVldWVNZXNzYWdlKG1lc3NhZ2UsIGNhbGxiYWNrS2V5LCBjYWxsYmFjaywgdmFsaWRDYWNoZUVudHJ5KSB7XG4gICAgLy8gVE9ETzogUmV2aWV3IHRoaXMgaWRlYS4gVGhlIG1haW4gbWVzc2FnZSB3ZSByZWFsbHkgbmVlZCB0byBxdWV1ZSB1cCBpcyB0aGUgZ2V0VXNlciByZXF1ZXN0IGFzIHBhcnQgb2YgdGhlIFwiZ3JvdXAgc2V0dGluZ3MgbG9hZGVkXCJcbiAgICAvLyBldmVudCB3aGljaCBmaXJlcyB2ZXJ5IGVhcmx5IChwb3NzaWJseSBcInBhZ2UgZGF0YSBsb2FkZWRcIiB0b28pLiBCdXQgd2hhdCBhYm91dCB0aGUgcmVzdCBvZiB0aGUgd2lkZ2V0PyBTaG91bGQgd2UgZXZlbiBzaG93XG4gICAgLy8gdGhlIHJlYWN0aW9uIHdpbmRvdyBpZiB0aGUgWERNIGZyYW1lIGlzbid0IHJlYWR5PyBPciBzaG91bGQgdGhlIHdpZGdldCB3YWl0IHRvIGJlY29tZSB2aXNpYmxlIHVudGlsIFhETSBpcyByZWFkeSBsaWtlIHRoZVxuICAgIC8vIHdheSBpdCB3YWl0cyBmb3IgcGFnZSBkYXRhIHRvIGxvYWQ/XG4gICAgbWVzc2FnZVF1ZXVlLnB1c2goe21lc3NhZ2U6IG1lc3NhZ2UsIGNhbGxiYWNrS2V5OiBjYWxsYmFja0tleSwgY2FsbGJhY2s6IGNhbGxiYWNrLCB2YWxpZENhY2hlRW50cnk6IHZhbGlkQ2FjaGVFbnRyeX0pO1xuICAgIGlmICghbWVzc2FnZVF1ZXVlVGltZXIpIHtcbiAgICAgICAgLy8gU3RhcnQgdGhlIHdhaXQuLi5cbiAgICAgICAgdmFyIHN0b3BUaW1lID0gRGF0ZS5ub3coKSArIDEwMDAwOyAvLyBHaXZlIHVwIGFmdGVyIDEwIHNlY29uZHNcbiAgICAgICAgbWVzc2FnZVF1ZXVlVGltZXIgPSBzZXRJbnRlcnZhbChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmIChpc1hETUxvYWRlZCB8fCBEYXRlLm5vdygpID4gc3RvcFRpbWUpIHtcbiAgICAgICAgICAgICAgICBjbGVhckludGVydmFsKG1lc3NhZ2VRdWV1ZVRpbWVyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpc1hETUxvYWRlZCkge1xuICAgICAgICAgICAgICAgIC8vIFRPRE86IENvbnNpZGVyIHRoZSB0aW1pbmcgaXNzdWUgd2hlcmUgbWVzc2FnZXMgY291bGQgc25lYWsgaW4gYW5kIGJlIHByb2Nlc3NlZCB3aGlsZSB0aGlzIGxvb3AgaXMgc2xlZXBpbmcuXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtZXNzYWdlUXVldWUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRlcXVldWVkID0gbWVzc2FnZVF1ZXVlW2ldO1xuICAgICAgICAgICAgICAgICAgICBwb3N0TWVzc2FnZShkZXF1ZXVlZC5tZXNzYWdlLCBkZXF1ZXVlZC5jYWxsYmFja0tleSwgZGVxdWV1ZWQuY2FsbGJhY2ssIGRlcXVldWVkLnZhbGlkQ2FjaGVFbnRyeSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LCA1MCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBnZXRYRE1GcmFtZSgpIHtcbiAgICAvLyBUT0RPOiBJcyB0aGlzIGEgc2VjdXJpdHkgcHJvYmxlbT8gV2hhdCBwcmV2ZW50cyBzb21lb25lIGZyb20gdXNpbmcgdGhpcyBzYW1lIG5hbWUgYW5kIGludGVyY2VwdGluZyBvdXIgbWVzc2FnZXM/XG4gICAgcmV0dXJuIHdpbmRvdy5mcmFtZXNbJ2FudC14ZG0taGlkZGVuJ107XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGdldFVzZXI6IGdldFVzZXIsXG4gICAgc2V0TWVzc2FnZUhhbmRsZXI6IHNldE1lc3NhZ2VIYW5kbGVyXG59OyIsInZhciAkOyByZXF1aXJlKCcuL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIEFwcE1vZGUgPSByZXF1aXJlKCcuL2FwcC1tb2RlJyk7XG52YXIgVVJMQ29uc3RhbnRzID0gcmVxdWlyZSgnLi91cmwtY29uc3RhbnRzJyk7XG52YXIgV2lkZ2V0QnVja2V0ID0gcmVxdWlyZSgnLi93aWRnZXQtYnVja2V0Jyk7XG5cbnZhciBYRE1fT1JJR0lOID0gQXBwTW9kZS5vZmZsaW5lID8gVVJMQ29uc3RhbnRzLkRFVkVMT1BNRU5UIDogVVJMQ29uc3RhbnRzLlBST0RVQ1RJT047XG5cbmZ1bmN0aW9uIGNyZWF0ZVhETWZyYW1lKGdyb3VwSWQpIHtcbiAgICAvL0FOVC5zZXNzaW9uLnJlY2VpdmVNZXNzYWdlKHt9LCBmdW5jdGlvbigpIHtcbiAgICAvLyAgICBBTlQudXRpbC51c2VyTG9naW5TdGF0ZSgpO1xuICAgIC8vfSk7XG5cbiAgICB2YXIgaWZyYW1lVXJsID0gWERNX09SSUdJTiArIFwiL3N0YXRpYy93aWRnZXQtbmV3L3hkbS94ZG0uaHRtbFwiLFxuICAgIHBhcmVudFVybCA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmLFxuICAgIHBhcmVudEhvc3QgPSB3aW5kb3cubG9jYXRpb24ucHJvdG9jb2wgKyBcIi8vXCIgKyB3aW5kb3cubG9jYXRpb24uaG9zdCxcbiAgICAvLyBUT0RPOiBSZXN0b3JlIHRoZSBib29rbWFya2xldCBhdHRyaWJ1dGUgb24gdGhlIGlGcmFtZT9cbiAgICAvL2Jvb2ttYXJrbGV0ID0gKCBBTlQuZW5nYWdlU2NyaXB0UGFyYW1zLmJvb2ttYXJrbGV0ICkgPyBcImJvb2ttYXJrbGV0PXRydWVcIjpcIlwiLFxuICAgIGJvb2ttYXJrbGV0ID0gXCJcIixcbiAgICAvLyBUT0RPOiBSZXN0b3JlIHRoZSBncm91cE5hbWUgYXR0cmlidXRlLiAoV2hhdCBpcyBpdCBmb3I/KVxuICAgICR4ZG1JZnJhbWUgPSAkKCc8aWZyYW1lIGlkPVwiYW50LXhkbS1oaWRkZW5cIiBuYW1lPVwiYW50LXhkbS1oaWRkZW5cIiBzcmM9XCInICsgaWZyYW1lVXJsICsgJz9wYXJlbnRVcmw9JyArIHBhcmVudFVybCArICcmcGFyZW50SG9zdD0nICsgcGFyZW50SG9zdCArICcmZ3JvdXBfaWQ9Jytncm91cElkKydcIiB3aWR0aD1cIjFcIiBoZWlnaHQ9XCIxXCIgc3R5bGU9XCJwb3NpdGlvbjphYnNvbHV0ZTt0b3A6LTEwMDBweDtsZWZ0Oi0xMDAwcHg7XCIgLz4nKTtcbiAgICAvLyR4ZG1JZnJhbWUgPSAkKCc8aWZyYW1lIGlkPVwiYW50LXhkbS1oaWRkZW5cIiBuYW1lPVwiYW50LXhkbS1oaWRkZW5cIiBzcmM9XCInICsgaWZyYW1lVXJsICsgJz9wYXJlbnRVcmw9JyArIHBhcmVudFVybCArICcmcGFyZW50SG9zdD0nICsgcGFyZW50SG9zdCArICcmZ3JvdXBfaWQ9Jytncm91cElkKycmZ3JvdXBfbmFtZT0nK2VuY29kZVVSSUNvbXBvbmVudChncm91cE5hbWUpKycmJytib29rbWFya2xldCsnXCIgd2lkdGg9XCIxXCIgaGVpZ2h0PVwiMVwiIHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGU7dG9wOi0xMDAwcHg7bGVmdDotMTAwMHB4O1wiIC8+Jyk7XG4gICAgJChXaWRnZXRCdWNrZXQuZ2V0KCkpLmFwcGVuZCggJHhkbUlmcmFtZSApO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGVYRE1mcmFtZTogY3JlYXRlWERNZnJhbWUsXG4gICAgT1JJR0lOOiBYRE1fT1JJR0lOXG59OyIsInZhciBYRE1DbGllbnQgPSByZXF1aXJlKCcuL3V0aWxzL3hkbS1jbGllbnQnKTtcbnZhciBFdmVudHMgPSByZXF1aXJlKCcuL2V2ZW50cycpO1xudmFyIEdyb3VwU2V0dGluZ3MgPSByZXF1aXJlKCcuL2dyb3VwLXNldHRpbmdzJyk7XG52YXIgUGFnZURhdGEgPSByZXF1aXJlKCcuL3BhZ2UtZGF0YScpO1xuXG5mdW5jdGlvbiBzdGFydExpc3RlbmluZygpIHtcbiAgICBYRE1DbGllbnQuc2V0TWVzc2FnZUhhbmRsZXIoJ3JlY2lyY0NsaWNrJywgcmVjaXJjQ2xpY2tlZCk7XG59XG5cbmZ1bmN0aW9uIHJlY2lyY0NsaWNrZWQocmVzcG9uc2UpIHtcbiAgICB2YXIgcmVhY3Rpb25JZCA9IHJlc3BvbnNlLmRldGFpbC5yZWZlcnJpbmdfaW50X2lkO1xuICAgIGdldFBhZ2VEYXRhKHJlc3BvbnNlLmRldGFpbC5wYWdlX2hhc2gsIGZ1bmN0aW9uKHBhZ2VEYXRhKSB7XG4gICAgICAgIEV2ZW50cy5wb3N0UmVjaXJjQ2xpY2tlZChwYWdlRGF0YSwgcmVhY3Rpb25JZCwgR3JvdXBTZXR0aW5ncy5nZXQoKSk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGdldFBhZ2VEYXRhKHBhZ2VIYXNoLCBjYWxsYmFjaykge1xuICAgIGlmIChwYWdlSGFzaCkge1xuICAgICAgICAvLyBUaGlzIG1vZHVsZSBsb2FkcyB2ZXJ5IGVhcmx5IGluIHRoZSBhcHAgbGlmZWN5Y2xlIGFuZCBtYXkgcmVjZWl2ZSBldmVudHMgZnJvbSB0aGUgWERNIGZyYW1lIGJlZm9yZSBwYWdlXG4gICAgICAgIC8vIGRhdGEgaGFzIGJlZW4gbG9hZGVkLiBIb2xkIG9udG8gYW55IHN1Y2ggZXZlbnRzIHVudGlsIHRoZSBwYWdlIGRhdGEgbG9hZHMgb3Igd2UgdGltZW91dC5cbiAgICAgICAgdmFyIG1heFdhaXRUaW1lID0gRGF0ZS5ub3coKSArIDEwMDAwOyAvLyBHaXZlIHVwIGFmdGVyIDEwIHNlY29uZHNcbiAgICAgICAgdmFyIGludGVydmFsID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHBhZ2VEYXRhID0gUGFnZURhdGEuZ2V0UGFnZURhdGEocGFnZUhhc2gpO1xuICAgICAgICAgICAgaWYgKHBhZ2VEYXRhKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2socGFnZURhdGEpO1xuICAgICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoaW50ZXJ2YWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKERhdGUubm93KCkgPiBtYXhXYWl0VGltZSkge1xuICAgICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoaW50ZXJ2YWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCA1MCk7XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBzdGFydDogc3RhcnRMaXN0ZW5pbmdcbn07IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEgYW50ZW5uYS1hdXRvLWN0YVwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1hdXRvLWN0YS1pbm5lclwiLFwiYW50LWN0YS1mb3JcIjpbe1widFwiOjIsXCJyXCI6XCJhbnRJdGVtSWRcIn1dfSxcImZcIjpbe1widFwiOjgsXCJyXCI6XCJsb2dvXCJ9LHtcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWF1dG8tY3RhLWxhYmVsXCIsXCJhbnQtcmVhY3Rpb25zLWxhYmVsLWZvclwiOlt7XCJ0XCI6MixcInJcIjpcImFudEl0ZW1JZFwifV19fSx7XCJ0XCI6NCxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiYW50LWV4cGFuZGVkLXJlYWN0aW9ucy1mb3JcIjpbe1widFwiOjIsXCJyXCI6XCJhbnRJdGVtSWRcIn1dfX1dLFwiblwiOjUwLFwiclwiOlwiZXhwYW5kUmVhY3Rpb25zXCJ9XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo0LFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcImNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbFwifV0sXCJuXCI6NTAsXCJ4XCI6e1wiclwiOltcImNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbFwiLFwiY29udGFpbmVyRGF0YS5sb2FkZWRcIl0sXCJzXCI6XCJfMCE9PXVuZGVmaW5lZCYmXzFcIn19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjQsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6W1wiYW50ZW5uYS1jdGEtZXhwYW5kZWQtcmVhY3Rpb24gXCIse1widFwiOjQsXCJmXCI6W1wiYW50ZW5uYS1jdGEtZXhwYW5kZWQtZmlyc3RcIl0sXCJuXCI6NTAsXCJ4XCI6e1wiclwiOltcIkBpbmRleFwiXSxcInNcIjpcIl8wPT09MFwifX1dfSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY3RhLWV4cGFuZGVkLXRleHRcIn0sXCJmXCI6W3tcInRcIjoyLFwiclwiOlwiLi90ZXh0XCJ9XX0se1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY3RhLWV4cGFuZGVkLWNvdW50XCJ9LFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcIi4vY291bnRcIn1dfV19XSxcInhcIjp7XCJyXCI6W1wiY29tcHV0ZUV4cGFuZGVkUmVhY3Rpb25zXCIsXCJjb250YWluZXJEYXRhLnJlYWN0aW9uc1wiXSxcInNcIjpcIl8wKF8xKVwifX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NCxcImZcIjpbe1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwiY2FsbC10by1hY3Rpb24tbGFiZWxfcmVzcG9uc2VzXFxcIilcIn19XSxcIm5cIjo1MCxcInhcIjp7XCJyXCI6W1wiY29udGFpbmVyRGF0YS5yZWFjdGlvblRvdGFsXCIsXCJjb250YWluZXJEYXRhLmxvYWRlZFwiXSxcInNcIjpcIl8wPT09dW5kZWZpbmVkfHwhXzFcIn19LHtcInRcIjo0LFwiblwiOjUxLFwiZlwiOlt7XCJ0XCI6NCxcIm5cIjo1MCxcInhcIjp7XCJyXCI6W1wiY29udGFpbmVyRGF0YS5yZWFjdGlvblRvdGFsXCJdLFwic1wiOlwiXzA9PT0xXCJ9LFwiZlwiOlt7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJjYWxsLXRvLWFjdGlvbi1sYWJlbF9yZXNwb25zZXNfb25lXFxcIilcIn19XX0se1widFwiOjQsXCJuXCI6NTAsXCJ4XCI6e1wiclwiOltcImNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbFwiXSxcInNcIjpcIiEoXzA9PT0xKVwifSxcImZcIjpbXCIgXCIse1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIixcImNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbFwiXSxcInNcIjpcIl8wKFxcXCJjYWxsLXRvLWFjdGlvbi1sYWJlbF9yZXNwb25zZXNfbWFueVxcXCIsW18xXSlcIn19XX1dLFwieFwiOntcInJcIjpbXCJjb250YWluZXJEYXRhLnJlYWN0aW9uVG90YWxcIixcImNvbnRhaW5lckRhdGEubG9hZGVkXCJdLFwic1wiOlwiXzA9PT11bmRlZmluZWR8fCFfMVwifX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWNvbW1lbnQtYXJlYVwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb21tZW50LXdpZGdldHNcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwidGV4dGFyZWFcIixcInZcIjp7XCJpbnB1dFwiOlwiaW5wdXRjaGFuZ2VkXCJ9LFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWNvbW1lbnQtaW5wdXRcIixcInBsYWNlaG9sZGVyXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcImNvbW1lbnQtYXJlYV9wbGFjZWhvbGRlclxcXCIpXCJ9fV0sXCJtYXhsZW5ndGhcIjpcIjUwMFwifX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb21tZW50LWZvb3RlclwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY29tbWVudC1saW1pdFwifSxcImZcIjpbe1widFwiOjMsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwiY29tbWVudC1hcmVhX2NvdW50XFxcIilcIn19XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJidXR0b25cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb21tZW50LXN1Ym1pdFwifSxcInZcIjp7XCJ0YXBcIjpcImFkZGNvbW1lbnRcIn0sXCJmXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcImNvbW1lbnQtYXJlYV9hZGRcXFwiKVwifX1dfV19XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb21tZW50LXdhaXRpbmdcIn0sXCJmXCI6W1wiLi4uXCJdfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWNvbW1lbnQtcmVjZWl2ZWRcIn0sXCJmXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcImNvbW1lbnQtYXJlYV90aGFua3NcXFwiKVwifX1dfV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1wYWdlIGFudGVubmEtY29tbWVudHMtcGFnZVwifSxcIm9cIjpcImNzc3Jlc2V0XCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtYm9keVwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcInZcIjp7XCJ0YXBcIjpcImJhY2tcIn0sXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY29tbWVudHMtYmFja1wifSxcImZcIjpbe1widFwiOjgsXCJyXCI6XCJsZWZ0XCJ9LHtcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcImNvbW1lbnRzLXBhZ2VfYmFja1xcXCIpXCJ9fV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY29tbWVudHMtaGVhZGVyXCJ9LFwiZlwiOlt7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiLFwiY29tbWVudHMubGVuZ3RoXCJdLFwic1wiOlwiXzAoXFxcImNvbW1lbnRzLXBhZ2VfaGVhZGVyXFxcIixbXzFdKVwifX1dfSxcIiBcIix7XCJ0XCI6NCxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOltcImFudGVubmEtY29tbWVudC1lbnRyeSBcIix7XCJ0XCI6NCxcImZcIjpbXCJhbnRlbm5hLWNvbW1lbnQtbmV3XCJdLFwiblwiOjUwLFwiclwiOlwiLi9uZXdcIn1dfSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJ0YWJsZVwiLFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInRyXCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwidGRcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb21tZW50LWNlbGxcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiaW1nXCIsXCJhXCI6e1wic3JjXCI6W3tcInRcIjoyLFwiclwiOlwiLi91c2VyLmltYWdlVVJMXCJ9XX19XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJ0ZFwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWNvbW1lbnQtYXV0aG9yXCJ9LFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcIi4vdXNlci5uYW1lXCJ9XX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcInRyXCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwidGRcIixcImZcIjpbXX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJ0ZFwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWNvbW1lbnQtdGV4dFwifSxcImZcIjpbe1widFwiOjIsXCJyXCI6XCIuL3RleHRcIn1dfV19XX1dfV0sXCJpXCI6XCJpbmRleFwiLFwiclwiOlwiY29tbWVudHNcIn0sXCIgXCIse1widFwiOjgsXCJyXCI6XCJjb21tZW50QXJlYVwifV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXBhZ2UgYW50ZW5uYS1jb25maXJtYXRpb24tcGFnZVwifSxcIm9cIjpcImNzc3Jlc2V0XCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtYm9keVwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb21tZW50LXJlYWN0aW9uXCJ9LFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcInRleHRcIn1dfSxcIiBcIix7XCJ0XCI6OCxcInJcIjpcImNvbW1lbnRBcmVhXCJ9XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1mb290ZXIgYW50ZW5uYS1jb25maXJtLWZvb3RlclwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJ2XCI6e1widGFwXCI6XCJzaGFyZVwifSxcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1zaGFyZVwifSxcImZcIjpbe1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwiY29uZmlybWF0aW9uLXBhZ2Vfc2hhcmVcXFwiKVwifX0sXCIgXCIse1widFwiOjgsXCJyXCI6XCJmYWNlYm9va0ljb25cIn0se1widFwiOjgsXCJyXCI6XCJ0d2l0dGVySWNvblwifV19XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJ2XCI6e1wia2V5ZG93blwiOlwicGFnZWtleWRvd25cIn0sXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcGFnZSBhbnRlbm5hLWRlZmF1bHRzLXBhZ2VcIixcInRhYmluZGV4XCI6XCIwXCJ9LFwib1wiOlwiY3NzcmVzZXRcIixcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1ib2R5XCJ9LFwiZlwiOlt7XCJ0XCI6NCxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcInZcIjp7XCJ0YXBcIjpcIm5ld3JlYWN0aW9uXCJ9LFwiYVwiOntcImNsYXNzXCI6W1wiYW50ZW5uYS1yZWFjdGlvbiBcIix7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZGVmYXVsdExheW91dENsYXNzXCIsXCJpbmRleFwiXSxcInNcIjpcIl8wKF8xKVwifX1dfSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1yZWFjdGlvbi1ib3hcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcmVhY3Rpb24tdGV4dFwifSxcIm9cIjpcInNpemV0b2ZpdFwiLFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcIi4vdGV4dFwifV19XX1dfV0sXCJpXCI6XCJpbmRleFwiLFwiclwiOlwiZGVmYXVsdFJlYWN0aW9uc1wifV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtZm9vdGVyIGFudGVubmEtZGVmYXVsdHMtZm9vdGVyXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWN1c3RvbS1hcmVhXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImlucHV0XCIsXCJ2XCI6e1wiZm9jdXNcIjpcImN1c3RvbWZvY3VzXCIsXCJrZXlkb3duXCI6XCJpbnB1dGtleWRvd25cIixcImJsdXJcIjpcImN1c3RvbWJsdXJcIn0sXCJhXCI6e1widmFsdWVcIjpbe1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwiZGVmYXVsdHMtcGFnZV9hZGRcXFwiKVwifX1dLFwibWF4bGVuZ3RoXCI6XCIyNVwifX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJidXR0b25cIixcInZcIjp7XCJ0YXBcIjpcImFkZGN1c3RvbVwifSxcImZcIjpbe1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwiZGVmYXVsdHMtcGFnZV9va1xcXCIpXCJ9fV19XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS10ZXh0LWxvZ29cIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiYVwiLFwiYVwiOntcImhyZWZcIjpcIi8vd3d3LmFudGVubmEuaXNcIn0sXCJmXCI6W1wiQW50ZW5uYVwiXX1dfV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXBhZ2UgYW50ZW5uYS1sb2NhdGlvbnMtcGFnZVwifSxcIm9cIjpcImNzc3Jlc2V0XCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtYm9keVwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcInZcIjp7XCJ0YXBcIjpcImJhY2tcIn0sXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtbG9jYXRpb25zLWJhY2tcIn0sXCJmXCI6W3tcInRcIjo4LFwiclwiOlwibGVmdFwifSx7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJsb2NhdGlvbnMtcGFnZV9iYWNrXFxcIilcIn19XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJ0YWJsZVwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxvY2F0aW9ucy10YWJsZVwifSxcImZcIjpbe1widFwiOjQsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwidHJcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1sb2NhdGlvbnMtY29udGVudC1yb3dcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwidGRcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1sb2NhdGlvbnMtY291bnQtY2VsbFwifSxcImZcIjpbe1widFwiOjQsXCJmXCI6W3tcInRcIjozLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcImxvY2F0aW9ucy1wYWdlX2NvdW50X29uZVxcXCIpXCJ9fV0sXCJuXCI6NTAsXCJ4XCI6e1wiclwiOltcInBhZ2VSZWFjdGlvbkNvdW50XCJdLFwic1wiOlwiXzA9PT0xXCJ9fSx7XCJ0XCI6NCxcIm5cIjo1MSxcImZcIjpbe1widFwiOjMsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIixcInBhZ2VSZWFjdGlvbkNvdW50XCJdLFwic1wiOlwiXzAoXFxcImxvY2F0aW9ucy1wYWdlX2NvdW50X21hbnlcXFwiLFtfMV0pXCJ9fV0sXCJ4XCI6e1wiclwiOltcInBhZ2VSZWFjdGlvbkNvdW50XCJdLFwic1wiOlwiXzA9PT0xXCJ9fV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwidGRcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1sb2NhdGlvbnMtcGFnZS1ib2R5XCJ9LFwiZlwiOlt7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJsb2NhdGlvbnMtcGFnZV9wYWdlbGV2ZWxcXFwiKVwifX1dfV19XSxcIm5cIjo1MCxcInJcIjpcInBhZ2VSZWFjdGlvbkNvdW50XCJ9LFwiIFwiLHtcInRcIjo0LFwiZlwiOlt7XCJ0XCI6NCxcImZcIjpbXCIgXCIse1widFwiOjcsXCJlXCI6XCJ0clwiLFwidlwiOntcInRhcFwiOlwicmV2ZWFsXCJ9LFwiYVwiOntcImNsYXNzXCI6W1wiYW50ZW5uYS1sb2NhdGlvbnMtY29udGVudC1yb3cgXCIse1widFwiOjQsXCJmXCI6W1wiYW50ZW5uYS1sb2NhdGVcIl0sXCJuXCI6NTAsXCJ4XCI6e1wiclwiOltcImNhbkxvY2F0ZVwiLFwiLi9jb250YWluZXJIYXNoXCJdLFwic1wiOlwiXzAoXzEpXCJ9fV19LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInRkXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtbG9jYXRpb25zLWNvdW50LWNlbGxcIn0sXCJmXCI6W3tcInRcIjo0LFwiZlwiOlt7XCJ0XCI6MyxcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJsb2NhdGlvbnMtcGFnZV9jb3VudF9vbmVcXFwiKVwifX1dLFwiblwiOjUwLFwieFwiOntcInJcIjpbXCIuL2NvdW50XCJdLFwic1wiOlwiXzA9PT0xXCJ9fSx7XCJ0XCI6NCxcIm5cIjo1MSxcImZcIjpbe1widFwiOjMsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIixcIi4vY291bnRcIl0sXCJzXCI6XCJfMChcXFwibG9jYXRpb25zLXBhZ2VfY291bnRfbWFueVxcXCIsW18xXSlcIn19XSxcInhcIjp7XCJyXCI6W1wiLi9jb3VudFwiXSxcInNcIjpcIl8wPT09MVwifX1dfSxcIiBcIix7XCJ0XCI6NCxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJ0ZFwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxvY2F0aW9ucy10ZXh0LWJvZHlcIn0sXCJmXCI6W3tcInRcIjoyLFwiclwiOlwiLi9ib2R5XCJ9XX1dLFwiblwiOjUwLFwieFwiOntcInJcIjpbXCIuL2tpbmRcIl0sXCJzXCI6XCJfMD09PVxcXCJ0eHRcXFwiXCJ9fSx7XCJ0XCI6NCxcIm5cIjo1MSxcImZcIjpbe1widFwiOjQsXCJuXCI6NTAsXCJ4XCI6e1wiclwiOltcIi4va2luZFwiXSxcInNcIjpcIl8wPT09XFxcImltZ1xcXCJcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwidGRcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1sb2NhdGlvbnMtaW1hZ2UtYm9keVwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJpbWdcIixcImFcIjp7XCJzcmNcIjpbe1widFwiOjIsXCJyXCI6XCIuL2JvZHlcIn1dfX1dfV19LHtcInRcIjo0LFwiblwiOjUwLFwieFwiOntcInJcIjpbXCIuL2tpbmRcIl0sXCJzXCI6XCIoIShfMD09PVxcXCJpbWdcXFwiKSkmJihfMD09PVxcXCJtZWRcXFwiKVwifSxcImZcIjpbXCIgXCIse1widFwiOjcsXCJlXCI6XCJ0ZFwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxvY2F0aW9ucy1tZWRpYS1ib2R5XCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImltZ1wiLFwiYVwiOntcInNyY1wiOlwiL3N0YXRpYy93aWRnZXQvaW1hZ2VzL3ZpZGVvX2ljb24ucG5nXCJ9fSxcIiBWaWRlb1wiXX1dfSx7XCJ0XCI6NCxcIm5cIjo1MCxcInhcIjp7XCJyXCI6W1wiLi9raW5kXCJdLFwic1wiOlwiKCEoXzA9PT1cXFwiaW1nXFxcIikpJiYoIShfMD09PVxcXCJtZWRcXFwiKSlcIn0sXCJmXCI6W1wiIFwiXX1dLFwieFwiOntcInJcIjpbXCIuL2tpbmRcIl0sXCJzXCI6XCJfMD09PVxcXCJ0eHRcXFwiXCJ9fV19XSxcIm5cIjo1MCxcInhcIjp7XCJyXCI6W1wiLi9raW5kXCJdLFwic1wiOlwiXzAhPT1cXFwicGFnXFxcIlwifX1dLFwiaVwiOlwiaWRcIixcInJcIjpcImxvY2F0aW9uRGF0YVwifV19XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwib1wiOlwiY3NzcmVzZXRcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYSBhbnRlbm5hLW1lZGlhLWluZGljYXRvci13cmFwcGVyXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOltcImFudGVubmEgYW50ZW5uYS1tZWRpYS1pbmRpY2F0b3Itd2lkZ2V0IFwiLHtcInRcIjo0LFwiZlwiOltcIm5vdGxvYWRlZFwiXSxcIm5cIjo1MSxcInJcIjpcImNvbnRhaW5lckRhdGEubG9hZGVkXCJ9LFwiIFwiLHtcInRcIjo0LFwiZlwiOltcImhhc3JlYWN0aW9uc1wiXSxcIm5cIjo1MCxcInhcIjp7XCJyXCI6W1wiY29udGFpbmVyRGF0YS5yZWFjdGlvblRvdGFsXCJdLFwic1wiOlwiXzA+MFwifX1dfSxcIm1cIjpbe1widFwiOjIsXCJyXCI6XCJleHRyYUF0dHJpYnV0ZXNcIn1dLFwiZlwiOlt7XCJ0XCI6OCxcInJcIjpcImxvZ29cIn0sXCIgXCIse1widFwiOjQsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXJlYWN0aW9uLXRvdGFsXCJ9LFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcImNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbFwifV19XSxcIm5cIjo1MCxcInJcIjpcImNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbFwifSx7XCJ0XCI6NCxcIm5cIjo1MSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcmVhY3Rpb24tcHJvbXB0XCJ9LFwiZlwiOlt7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJtZWRpYS1pbmRpY2F0b3JfdGhpbmtcXFwiKVwifX1dfV0sXCJyXCI6XCJjb250YWluZXJEYXRhLnJlYWN0aW9uVG90YWxcIn1dfV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1wb3B1cFwifSxcIm9cIjpcImNzc3Jlc2V0XCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcG9wdXAtYm9keVwifSxcImZcIjpbe1widFwiOjgsXCJyXCI6XCJsb2dvXCJ9LHtcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXBvcHVwLXRleHRcIn0sXCJmXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcInBvcHVwLXdpZGdldF90aGlua1xcXCIpXCJ9fV19XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcGFnZSBhbnRlbm5hLXJlYWN0aW9ucy1wYWdlXCJ9LFwib1wiOlwiY3NzcmVzZXRcIixcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1ib2R5XCJ9LFwiZlwiOlt7XCJ0XCI6NCxcImZcIjpbe1widFwiOjQsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJ2XCI6e1widGFwXCI6XCJwbHVzb25lXCIsXCJtb3VzZWVudGVyXCI6XCJoaWdobGlnaHRcIixcIm1vdXNlbGVhdmVcIjpcImNsZWFyaGlnaGxpZ2h0c1wifSxcImFcIjp7XCJjbGFzc1wiOltcImFudGVubmEtcmVhY3Rpb24gXCIse1widFwiOjIsXCJ4XCI6e1wiclwiOltcInJlYWN0aW9uc0xheW91dENsYXNzXCIsXCJpbmRleFwiLFwiLi9jb3VudFwiXSxcInNcIjpcIl8wKF8xLF8yKVwifX1dfSxcImZcIjpbXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1yZWFjdGlvbi1ib3hcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcmVhY3Rpb24tdGV4dFwifSxcIm9cIjpcInNpemV0b2ZpdFwiLFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcIi4vdGV4dFwifV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcmVhY3Rpb24tY291bnRcIn0sXCJmXCI6W3tcInRcIjoyLFwiclwiOlwiLi9jb3VudFwifV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcGx1c29uZVwifSxcImZcIjpbXCIrMVwiXX0sXCIgXCIse1widFwiOjQsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJ2XCI6e1widGFwXCI6XCJzaG93bG9jYXRpb25zXCJ9LFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXJlYWN0aW9uLWxvY2F0aW9uXCJ9LFwiZlwiOlt7XCJ0XCI6OCxcInJcIjpcImxvY2F0aW9uSWNvblwifV19XSxcIm5cIjo1MCxcInJcIjpcImlzU3VtbWFyeVwifSx7XCJ0XCI6NCxcIm5cIjo1MSxcImZcIjpbe1widFwiOjQsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJ2XCI6e1widGFwXCI6XCJzaG93Y29tbWVudHNcIn0sXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcmVhY3Rpb24tY29tbWVudHMgaGFzY29tbWVudHNcIn0sXCJmXCI6W3tcInRcIjo4LFwiclwiOlwiY29tbWVudHNJY29uXCJ9LFwiIFwiLHtcInRcIjoyLFwiclwiOlwiLi9jb21tZW50Q291bnRcIn1dfV0sXCJuXCI6NTAsXCJyXCI6XCIuL2NvbW1lbnRDb3VudFwifSx7XCJ0XCI6NCxcIm5cIjo1MSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1yZWFjdGlvbi1jb21tZW50c1wifSxcImZcIjpbe1widFwiOjgsXCJyXCI6XCJjb21tZW50c0ljb25cIn1dfV0sXCJyXCI6XCIuL2NvbW1lbnRDb3VudFwifV0sXCJyXCI6XCJpc1N1bW1hcnlcIn1dfV19XSxcImlcIjpcImluZGV4XCIsXCJyXCI6XCJyZWFjdGlvbnNcIn1dLFwiblwiOjUwLFwiclwiOlwicmVhY3Rpb25zXCJ9XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1mb290ZXIgYW50ZW5uYS1yZWFjdGlvbnMtZm9vdGVyXCJ9LFwiZlwiOlt7XCJ0XCI6NCxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcInZcIjp7XCJ0YXBcIjpcInNob3dkZWZhdWx0XCJ9LFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXRoaW5rXCJ9LFwiZlwiOlt7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJyZWFjdGlvbnMtcGFnZV90aGlua1xcXCIpXCJ9fV19XSxcIm5cIjo1MCxcInJcIjpcInJlYWN0aW9uc1wifSx7XCJ0XCI6NCxcIm5cIjo1MSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1uby1yZWFjdGlvbnNcIn0sXCJmXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcInJlYWN0aW9ucy1wYWdlX25vX3JlYWN0aW9uc1xcXCIpXCJ9fV19XSxcInJcIjpcInJlYWN0aW9uc1wifSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXRleHQtbG9nb1wifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJhXCIsXCJhXCI6e1wiaHJlZlwiOlwiLy93d3cuYW50ZW5uYS5pc1wifSxcImZcIjpbXCJBbnRlbm5hXCJdfV19XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEgYW50ZW5uYS1yZWFjdGlvbnMtd2lkZ2V0XCIsXCJ0YWJpbmRleFwiOlwiMFwifSxcIm9cIjpcImNzc3Jlc2V0XCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtaGVhZGVyXCJ9LFwiZlwiOlt7XCJ0XCI6OCxcInJcIjpcImxvZ29cIn0se1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcmVhY3Rpb25zLXRpdGxlXCJ9LFwiZlwiOlt7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJyZWFjdGlvbnMtd2lkZ2V0X3RpdGxlXFxcIilcIn19XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJ2XCI6e1widGFwXCI6XCJjbG9zZVwifSxcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1yZWFjdGlvbnMtY2xvc2VcIn0sXCJmXCI6W1wiWFwiXX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXBhZ2UtY29udGFpbmVyXCJ9LFwiZlwiOltcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXByb2dyZXNzLXBhZ2UgYW50ZW5uYS1wYWdlXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWJvZHlcIn19XX1dfV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOltcImFudGVubmEgYW50ZW5uYS1zdW1tYXJ5LXdpZGdldCBcIix7XCJ0XCI6NCxcImZcIjpbXCJub3Rsb2FkZWRcIl0sXCJuXCI6NTEsXCJyXCI6XCJwYWdlRGF0YS5zdW1tYXJ5TG9hZGVkXCJ9XX0sXCJvXCI6XCJjc3NyZXNldFwiLFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXN1bW1hcnktaW5uZXJcIn0sXCJmXCI6W3tcInRcIjo4LFwiclwiOlwibG9nb1wifSx7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1zdW1tYXJ5LXRpdGxlXCJ9LFwiZlwiOltcIiBcIix7XCJ0XCI6NCxcImZcIjpbe1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwic3VtbWFyeS13aWRnZXRfcmVhY3Rpb25zXFxcIilcIn19XSxcIm5cIjo1MCxcInhcIjp7XCJyXCI6W1wicGFnZURhdGEuc3VtbWFyeVRvdGFsXCJdLFwic1wiOlwiXzA9PT0wXCJ9fSx7XCJ0XCI6NCxcIm5cIjo1MSxcImZcIjpbe1widFwiOjQsXCJuXCI6NTAsXCJ4XCI6e1wiclwiOltcInBhZ2VEYXRhLnN1bW1hcnlUb3RhbFwiXSxcInNcIjpcIl8wPT09MVwifSxcImZcIjpbe1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwic3VtbWFyeS13aWRnZXRfcmVhY3Rpb25zX29uZVxcXCIpXCJ9fV19LHtcInRcIjo0LFwiblwiOjUwLFwieFwiOntcInJcIjpbXCJwYWdlRGF0YS5zdW1tYXJ5VG90YWxcIl0sXCJzXCI6XCIhKF8wPT09MSlcIn0sXCJmXCI6W1wiIFwiLHtcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCIsXCJwYWdlRGF0YS5zdW1tYXJ5VG90YWxcIl0sXCJzXCI6XCJfMChcXFwic3VtbWFyeS13aWRnZXRfcmVhY3Rpb25zX21hbnlcXFwiLFtfMV0pXCJ9fV19XSxcInhcIjp7XCJyXCI6W1wicGFnZURhdGEuc3VtbWFyeVRvdGFsXCJdLFwic1wiOlwiXzA9PT0wXCJ9fV19LHtcInRcIjo0LFwiZlwiOltcIiBcIix7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOltcImFudGVubmEtZXhwYW5kZWQtcmVhY3Rpb24gXCIse1widFwiOjQsXCJmXCI6W1wiYW50ZW5uYS1leHBhbmRlZC1maXJzdFwiXSxcIm5cIjo1MCxcInhcIjp7XCJyXCI6W1wiQGluZGV4XCJdLFwic1wiOlwiXzA9PT0wXCJ9fV19LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1leHBhbmRlZC10ZXh0XCJ9LFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcIi4vdGV4dFwifV19LHtcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWV4cGFuZGVkLWNvdW50XCJ9LFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcIi4vY291bnRcIn1dfV19XSxcInhcIjp7XCJyXCI6W1wiY29tcHV0ZUV4cGFuZGVkUmVhY3Rpb25zXCIsXCJwYWdlRGF0YS5zdW1tYXJ5UmVhY3Rpb25zXCJdLFwic1wiOlwiXzAoXzEpXCJ9fV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb21tZW50c1wifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJzdmdcIixcImZcIjpbe1widFwiOjcsXCJlXCI6XCJ1c2VcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb21tZW50cy1wYXRoXCIsXCJ4bGluazpocmVmXCI6XCIjYW50ZW5uYS1zdmctY29tbWVudFwifX1dfV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtZmFjZWJvb2tcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3ZnXCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwidXNlXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtZmFjZWJvb2stcGF0aFwiLFwieGxpbms6aHJlZlwiOlwiI2FudGVubmEtc3ZnLWZhY2Vib29rXCJ9fV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1sZWZ0XCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInN2Z1wiLFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInVzZVwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxlZnQtcGF0aFwiLFwieGxpbms6aHJlZlwiOlwiI2FudGVubmEtc3ZnLWxlZnRcIn19XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxvY2F0aW9uXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInN2Z1wiLFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInVzZVwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxvY2F0aW9uLXBhdGhcIixcInhsaW5rOmhyZWZcIjpcIiNhbnRlbm5hLXN2Zy1zZWFyY2hcIn19XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxvZ29cIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3ZnXCIsXCJhXCI6e1widmlld0JveFwiOlwiMCAwIDUxMiA1MTJcIn0sXCJmXCI6W1wiIFwiLHtcInRcIjo3LFwiZVwiOlwicGF0aFwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxvZ28tcGF0aFwiLFwiZFwiOlwibTI4MyA1MTBjMTI1LTE3IDIyOS0xMjQgMjI5LTI1MyAwLTE0MS0xMTUtMjU2LTI1Ni0yNTYtMTQxIDAtMjU2IDExNS0yNTYgMjU2IDAgMTMwIDEwOCAyMzcgMjMzIDI1NGwwLTE0OWMtNDgtMTQtODQtNTAtODQtMTAyIDAtNjUgNDMtMTEzIDEwOC0xMTMgNjUgMCAxMDcgNDggMTA3IDExMyAwIDUyLTMzIDg4LTgxIDEwMnpcIn19XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxvZ29cIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3ZnXCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwidXNlXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtbG9nby1wYXRoXCIsXCJ4bGluazpocmVmXCI6XCIjYW50ZW5uYS1zdmctbG9nb1wifX1dfV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtdHdpdHRlclwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJzdmdcIixcImZcIjpbe1widFwiOjcsXCJlXCI6XCJ1c2VcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS10d2l0dGVyLXBhdGhcIixcInhsaW5rOmhyZWZcIjpcIiNhbnRlbm5hLXN2Zy10d2l0dGVyXCJ9fV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcInN2Z1wiLFwiYVwiOntcInhtbG5zXCI6XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLFwic3R5bGVcIjpcImRpc3BsYXk6IG5vbmU7XCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInN5bWJvbFwiLFwiYVwiOntcImlkXCI6XCJhbnRlbm5hLXN2Zy10d2l0dGVyXCIsXCJ2aWV3Qm94XCI6XCIwIDAgNTEyIDUxMlwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJwYXRoXCIsXCJhXCI6e1wiZFwiOlwibTQ1MyAxMzRjLTE0IDYtMzAgMTEtNDYgMTJjMTYtMTAgMjktMjUgMzUtNDRjLTE1IDktMzMgMTYtNTEgMTljLTE1LTE1LTM2LTI1LTU5LTI1Yy00NSAwLTgxIDM2LTgxIDgxYzAgNiAxIDEyIDIgMThjLTY3LTMtMTI3LTM1LTE2Ny04NGMtNyAxMi0xMSAyNS0xMSA0MGMwIDI4IDE1IDUzIDM2IDY4Yy0xMy0xLTI1LTQtMzYtMTFjMCAxIDAgMSAwIDJjMCAzOSAyOCA3MSA2NSA3OWMtNyAyLTE0IDMtMjIgM2MtNSAwLTEwLTEtMTUtMmMxMCAzMiA0MCA1NiA3NiA1NmMtMjggMjItNjMgMzUtMTAxIDM1Yy02IDAtMTMgMC0xOS0xYzM2IDIzIDc4IDM2IDEyNCAzNmMxNDkgMCAyMzAtMTIzIDIzMC0yMzBjMC0zIDAtNyAwLTEwYzE2LTEyIDI5LTI2IDQwLTQyelwifX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcInN5bWJvbFwiLFwiYVwiOntcImlkXCI6XCJhbnRlbm5hLXN2Zy1mYWNlYm9va1wiLFwidmlld0JveFwiOlwiMCAwIDUxMiA1MTJcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwicGF0aFwiLFwiYVwiOntcImRcIjpcIm00MjAgNzJsLTMyOCAwYy0xMSAwLTIwIDktMjAgMjBsMCAzMjhjMCAxMSA5IDIwIDIwIDIwbDE3NyAwbDAtMTQybC00OCAwbDAtNTZsNDggMGwwLTQxYzAtNDggMjktNzQgNzEtNzRjMjAgMCAzOCAyIDQzIDNsMCA0OWwtMjkgMGMtMjMgMC0yOCAxMS0yOCAyN2wwIDM2bDU1IDBsLTcgNTZsLTQ4IDBsMCAxNDJsOTQgMGMxMSAwIDIwLTkgMjAtMjBsMC0zMjhjMC0xMS05LTIwLTIwLTIwelwifX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcInN5bWJvbFwiLFwiYVwiOntcImlkXCI6XCJhbnRlbm5hLXN2Zy1jb21tZW50XCIsXCJ2aWV3Qm94XCI6XCIwIDAgNTEyIDUxMlwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJwYXRoXCIsXCJhXCI6e1wiZFwiOlwibTUxMiAyNTZjMCAzMy0xMSA2NC0zNCA5MmMtMjMgMjgtNTQgNTAtOTMgNjZjLTQwIDE3LTgzIDI1LTEyOSAyNWMtMTMgMC0yNy0xLTQxLTJjLTM4IDMzLTgyIDU2LTEzMiA2OWMtOSAyLTIwIDQtMzIgNmMtNCAwLTcgMC05LTNjLTMtMi00LTQtNS04bDAgMGMtMS0xLTEtMiAwLTRjMC0xIDAtMiAwLTJjMC0xIDEtMiAyLTNsMS0zYzAgMCAxLTEgMi0yYzItMiAyLTMgMy0zYzEtMSA0LTUgOC0xMGM1LTUgOC04IDEwLTEwYzItMyA1LTYgOS0xMmM0LTUgNy0xMCA5LTE0YzMtNSA1LTEwIDgtMTdjMy03IDUtMTQgOC0yMmMtMzAtMTctNTQtMzgtNzEtNjNjLTE3LTI1LTI2LTUxLTI2LTgwYzAtMjUgNy00OCAyMC03MWMxNC0yMyAzMi00MiA1NS01OGMyMy0xNyA1MC0zMCA4Mi0zOWMzMS0xMCA2NC0xNSA5OS0xNWM0NiAwIDg5IDggMTI5IDI1YzM5IDE2IDcwIDM4IDkzIDY2YzIzIDI4IDM0IDU5IDM0IDkyelwifX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcInN5bWJvbFwiLFwiYVwiOntcImlkXCI6XCJhbnRlbm5hLXN2Zy1zZWFyY2hcIixcInZpZXdCb3hcIjpcIjAgMCA1MTIgNTEyXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInBhdGhcIixcImFcIjp7XCJkXCI6XCJtMzQ3IDIzOGMwLTM2LTEyLTY2LTM3LTkxYy0yNS0yNS01NS0zNy05MS0zN2MtMzUgMC02NSAxMi05MCAzN2MtMjUgMjUtMzggNTUtMzggOTFjMCAzNSAxMyA2NSAzOCA5MGMyNSAyNSA1NSAzOCA5MCAzOGMzNiAwIDY2LTEzIDkxLTM4YzI1LTI1IDM3LTU1IDM3LTkweiBtMTQ3IDIzN2MwIDEwLTQgMTktMTEgMjZjLTcgNy0xNiAxMS0yNiAxMWMtMTAgMC0xOS00LTI2LTExbC05OC05OGMtMzQgMjQtNzIgMzYtMTE0IDM2Yy0yNyAwLTUzLTUtNzgtMTZjLTI1LTExLTQ2LTI1LTY0LTQzYy0xOC0xOC0zMi0zOS00My02NGMtMTAtMjUtMTYtNTEtMTYtNzhjMC0yOCA2LTU0IDE2LTc4YzExLTI1IDI1LTQ3IDQzLTY1YzE4LTE4IDM5LTMyIDY0LTQzYzI1LTEwIDUxLTE1IDc4LTE1YzI4IDAgNTQgNSA3OSAxNWMyNCAxMSA0NiAyNSA2NCA0M2MxOCAxOCAzMiA0MCA0MyA2NWMxMCAyNCAxNiA1MCAxNiA3OGMwIDQyLTEyIDgwLTM2IDExNGw5OCA5OGM3IDcgMTEgMTUgMTEgMjV6XCJ9fV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwic3ltYm9sXCIsXCJhXCI6e1wiaWRcIjpcImFudGVubmEtc3ZnLWxlZnRcIixcInZpZXdCb3hcIjpcIjAgMCA1MTIgNTEyXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInBhdGhcIixcImFcIjp7XCJkXCI6XCJtMzY4IDE2MGwtNjQtNjQtMTYwIDE2MCAxNjAgMTYwIDY0LTY0LTk2LTk2elwifX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcInN5bWJvbFwiLFwiYVwiOntcImlkXCI6XCJhbnRlbm5hLXN2Zy1sb2dvXCIsXCJ2aWV3Qm94XCI6XCIwIDAgNTEyIDUxMlwifSxcImZcIjpbXCIgXCIse1widFwiOjcsXCJlXCI6XCJwYXRoXCIsXCJhXCI6e1wiZFwiOlwibTI4MyA1MTBjMTI1LTE3IDIyOS0xMjQgMjI5LTI1MyAwLTE0MS0xMTUtMjU2LTI1Ni0yNTYtMTQxIDAtMjU2IDExNS0yNTYgMjU2IDAgMTMwIDEwOCAyMzcgMjMzIDI1NGwwLTE0OWMtNDgtMTQtODQtNTAtODQtMTAyIDAtNjUgNDMtMTEzIDEwOC0xMTMgNjUgMCAxMDcgNDggMTA3IDExMyAwIDUyLTMzIDg4LTgxIDEwMnpcIn19XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwib1wiOlwiY3NzcmVzZXRcIixcImFcIjp7XCJjbGFzc1wiOltcImFudGVubmEgYW50ZW5uYS10ZXh0LWluZGljYXRvci13aWRnZXQgXCIse1widFwiOjQsXCJmXCI6W1wibm90bG9hZGVkXCJdLFwiblwiOjUxLFwiclwiOlwiY29udGFpbmVyRGF0YS5sb2FkZWRcIn0sXCIgXCIse1widFwiOjQsXCJmXCI6W1wiaGFzcmVhY3Rpb25zXCJdLFwiblwiOjUwLFwieFwiOntcInJcIjpbXCJjb250YWluZXJEYXRhLnJlYWN0aW9uVG90YWxcIl0sXCJzXCI6XCJfMD4wXCJ9fSxcIiBcIix7XCJ0XCI6NCxcImZcIjpbXCJhbnRlbm5hLXN1cHByZXNzXCJdLFwiblwiOjUwLFwiclwiOlwiY29udGFpbmVyRGF0YS5zdXBwcmVzc1wifSxcIiBcIix7XCJ0XCI6MixcInJcIjpcImV4dHJhQ2xhc3Nlc1wifV19LFwiZlwiOlt7XCJ0XCI6OCxcInJcIjpcImxvZ29cIn0sXCIgXCIse1widFwiOjQsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXJlYWN0aW9uLXRvdGFsXCJ9LFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcImNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbFwifV19XSxcIm5cIjo1MCxcInJcIjpcImNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbFwifV19XX0iXX0=
