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
var Ractive; require('./utils/ractive-provider').onLoad(function(loadedRactive) { Ractive=loadedRactive; });
var SVGs = require('./svgs');

function createCallToAction(antItemId) {
    var ractive = Ractive({
        el: $('div'),
        data: { antItemId: antItemId },
        template: require('../templates/auto-call-to-action.hbs.html'),
        partials: {
            logo: SVGs.logo
        }
    });
    return $(ractive.find('.antenna-auto-cta'));
}

//noinspection JSUnresolvedVariable
module.exports = {
    create: createCallToAction
};
},{"../templates/auto-call-to-action.hbs.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/auto-call-to-action.hbs.html","./svgs":"/Users/jburns/antenna/rb/static/widget-new/src/js/svgs.js","./utils/jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js","./utils/ractive-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/ractive-provider.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/call-to-action-counter.js":[function(require,module,exports){
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
},{"../templates/call-to-action-counter.hbs.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/call-to-action-counter.hbs.html","./utils/ractive-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/ractive-provider.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/call-to-action-indicator.js":[function(require,module,exports){
var CallToActionCounter = require('./call-to-action-counter');
var CallToActionLabel = require('./call-to-action-label');
var ReactionsWidget = require('./reactions-widget');


function createIndicatorWidget(options) {
    var containerData = options.containerData;
    var $containerElement = options.containerElement;
    var contentData = options.contentData;
    var $ctaElement = options.ctaElement;
    var $ctaLabels = options.ctaLabels; // optional
    var $ctaCounters = options.ctaCounters; // optional
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
        for (var j = 0; j < $ctaCounters.length; j++) {
            CallToActionCounter.create($ctaCounters[j], containerData);
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
},{"./call-to-action-counter":"/Users/jburns/antenna/rb/static/widget-new/src/js/call-to-action-counter.js","./call-to-action-label":"/Users/jburns/antenna/rb/static/widget-new/src/js/call-to-action-label.js","./reactions-widget":"/Users/jburns/antenna/rb/static/widget-new/src/js/reactions-widget.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/call-to-action-label.js":[function(require,module,exports){
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
var XDMClient = require('./utils/xdm-client');

var isTouchBrowser = (navigator.msMaxTouchPoints || "ontouchstart" in window) && ((window.matchMedia("only screen and (max-width: 768px)")).matches);

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
    event[attributes.isTouchBrowser] = isTouchBrowser;
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
},{"./utils/ajax-client":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/ajax-client.js","./utils/xdm-client":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/xdm-client.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/group-settings-loader.js":[function(require,module,exports){
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
            summaryReactions: {},
            summaryTotal: 0,
            summaryLoaded: false,
            containers: {},
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
    sortReactionData(reactionsData);
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
var Ractive; require('./utils/ractive-provider').onLoad(function(loadedRactive) { Ractive = loadedRactive;});
var TouchSupport = require('./utils/touch-support');

var ReactionsWidget = require('./reactions-widget');
var SVGs = require('./svgs');

function createSummaryWidget(containerData, pageData, defaultReactions, groupSettings) {
    var ractive = Ractive({
        el: $('<div>'), // the real root node is in the template. it's extracted after the template is rendered into this dummy element
        data: {
            pageData: pageData
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

//noinspection JSUnresolvedVariable
module.exports = {
    create: createSummaryWidget
};
},{"../templates/summary-widget.hbs.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/summary-widget.hbs.html","./reactions-widget":"/Users/jburns/antenna/rb/static/widget-new/src/js/reactions-widget.js","./svgs":"/Users/jburns/antenna/rb/static/widget-new/src/js/svgs.js","./utils/jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js","./utils/ractive-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/ractive-provider.js","./utils/touch-support":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/touch-support.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/svgs.js":[function(require,module,exports){
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
},{"./url-constants":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/url-constants.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/callback-support.js":[function(require,module,exports){

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
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna antenna-auto-cta"},"f":[{"t":7,"e":"div","a":{"class":"antenna-auto-cta-inner","ant-cta-for":[{"t":2,"r":"antItemId"}]},"f":[{"t":8,"r":"logo"}," ",{"t":7,"e":"span","a":{"class":"antenna-auto-cta-label","ant-reactions-label-for":[{"t":2,"r":"antItemId"}]}}]}]}]}
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/templates/call-to-action-counter.hbs.html":[function(require,module,exports){
module.exports={"v":3,"t":[{"t":4,"f":[{"t":2,"r":"containerData.reactionTotal"}],"n":50,"x":{"r":["containerData.reactionTotal","containerData.loaded"],"s":"_0!==undefined&&_1"}}]}
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
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":["antenna antenna-summary-widget ",{"t":4,"f":["notloaded"],"n":51,"r":"pageData.summaryLoaded"}]},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-summary-inner"},"f":[{"t":8,"r":"logo"},{"t":7,"e":"span","a":{"class":"antenna-summary-title"},"f":[" ",{"t":4,"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"summary-widget_reactions\")"}}],"n":50,"x":{"r":["pageData.summaryTotal"],"s":"_0===0"}},{"t":4,"n":51,"f":[{"t":4,"n":50,"x":{"r":["pageData.summaryTotal"],"s":"_0===1"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"summary-widget_reactions_one\")"}}]},{"t":4,"n":50,"x":{"r":["pageData.summaryTotal"],"s":"!(_0===1)"},"f":[" ",{"t":2,"x":{"r":["getMessage","pageData.summaryTotal"],"s":"_0(\"summary-widget_reactions_many\",[_1])"}}]}],"x":{"r":["pageData.summaryTotal"],"s":"_0===0"}}]}]}]}]}
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
},{}]},{},["/Users/jburns/antenna/rb/static/widget-new/src/js/antenna-app.js","/Users/jburns/antenna/rb/static/widget-new/src/js/auto-call-to-action.js","/Users/jburns/antenna/rb/static/widget-new/src/js/call-to-action-counter.js","/Users/jburns/antenna/rb/static/widget-new/src/js/call-to-action-indicator.js","/Users/jburns/antenna/rb/static/widget-new/src/js/call-to-action-label.js","/Users/jburns/antenna/rb/static/widget-new/src/js/comment-area-partial.js","/Users/jburns/antenna/rb/static/widget-new/src/js/comments-page.js","/Users/jburns/antenna/rb/static/widget-new/src/js/confirmation-page.js","/Users/jburns/antenna/rb/static/widget-new/src/js/css-loader.js","/Users/jburns/antenna/rb/static/widget-new/src/js/defaults-page.js","/Users/jburns/antenna/rb/static/widget-new/src/js/events.js","/Users/jburns/antenna/rb/static/widget-new/src/js/group-settings-loader.js","/Users/jburns/antenna/rb/static/widget-new/src/js/group-settings.js","/Users/jburns/antenna/rb/static/widget-new/src/js/hashed-elements.js","/Users/jburns/antenna/rb/static/widget-new/src/js/locations-page.js","/Users/jburns/antenna/rb/static/widget-new/src/js/media-indicator-widget.js","/Users/jburns/antenna/rb/static/widget-new/src/js/page-data-loader.js","/Users/jburns/antenna/rb/static/widget-new/src/js/page-data.js","/Users/jburns/antenna/rb/static/widget-new/src/js/page-scanner.js","/Users/jburns/antenna/rb/static/widget-new/src/js/popup-widget.js","/Users/jburns/antenna/rb/static/widget-new/src/js/reactions-page.js","/Users/jburns/antenna/rb/static/widget-new/src/js/reactions-widget.js","/Users/jburns/antenna/rb/static/widget-new/src/js/script-loader.js","/Users/jburns/antenna/rb/static/widget-new/src/js/summary-widget.js","/Users/jburns/antenna/rb/static/widget-new/src/js/svgs.js","/Users/jburns/antenna/rb/static/widget-new/src/js/text-indicator-widget.js","/Users/jburns/antenna/rb/static/widget-new/src/js/text-reactions.js","/Users/jburns/antenna/rb/static/widget-new/src/js/xdm-analytics.js","/Users/jburns/antenna/rb/static/widget-new/src/templates/auto-call-to-action.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/call-to-action-counter.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/call-to-action-label.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/comment-area-partial.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/comments-page.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/confirmation-page.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/defaults-page.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/locations-page.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/media-indicator-widget.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/popup-widget.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/reactions-page.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/reactions-widget.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/summary-widget.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/svg-comments.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/svg-facebook.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/svg-left.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/svg-location.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/svg-logo-selectable.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/svg-logo.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/svg-twitter.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/svgs.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/text-indicator-widget.hbs.html"])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvYW50ZW5uYS1hcHAuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvYXV0by1jYWxsLXRvLWFjdGlvbi5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9jYWxsLXRvLWFjdGlvbi1jb3VudGVyLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL2NhbGwtdG8tYWN0aW9uLWluZGljYXRvci5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9jYWxsLXRvLWFjdGlvbi1sYWJlbC5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9jb21tZW50LWFyZWEtcGFydGlhbC5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9jb21tZW50cy1wYWdlLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL2NvbmZpcm1hdGlvbi1wYWdlLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL2Nzcy1sb2FkZXIuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvZGVmYXVsdHMtcGFnZS5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9ldmVudHMuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvZ3JvdXAtc2V0dGluZ3MtbG9hZGVyLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL2dyb3VwLXNldHRpbmdzLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL2hhc2hlZC1lbGVtZW50cy5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9sb2NhdGlvbnMtcGFnZS5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9tZWRpYS1pbmRpY2F0b3Itd2lkZ2V0LmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3BhZ2UtZGF0YS1sb2FkZXIuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvcGFnZS1kYXRhLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3BhZ2Utc2Nhbm5lci5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9wb3B1cC13aWRnZXQuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvcmVhY3Rpb25zLXBhZ2UuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvcmVhY3Rpb25zLXdpZGdldC5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9zY3JpcHQtbG9hZGVyLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3N1bW1hcnktd2lkZ2V0LmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3N2Z3MuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdGV4dC1pbmRpY2F0b3Itd2lkZ2V0LmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3RleHQtcmVhY3Rpb25zLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL2FqYXgtY2xpZW50LmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL2FwcC1tb2RlLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL2NhbGxiYWNrLXN1cHBvcnQuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvaGFzaC5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9qcXVlcnktcHJvdmlkZXIuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvbWQ1LmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL21lc3NhZ2VzLWVuLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL21lc3NhZ2VzLWVzLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL21lc3NhZ2VzLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL21vdmVhYmxlLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL211dGF0aW9uLW9ic2VydmVyLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL3BhZ2UtdXRpbHMuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvcmFjdGl2ZS1ldmVudHMtdGFwLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL3JhY3RpdmUtcHJvdmlkZXIuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvcmFuZ2UuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvcmFuZ3ktcHJvdmlkZXIuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvcmVhY3Rpb25zLXdpZGdldC1sYXlvdXQtdXRpbHMuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvdGhyb3R0bGVkLWV2ZW50cy5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy90b3VjaC1zdXBwb3J0LmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL3RyYW5zaXRpb24tdXRpbC5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy91cmwtY29uc3RhbnRzLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL3VybHMuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvdXNlci5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy93aWRnZXQtYnVja2V0LmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL3hkbS1jbGllbnQuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMveGRtLWxvYWRlci5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy94ZG0tYW5hbHl0aWNzLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9hdXRvLWNhbGwtdG8tYWN0aW9uLmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9jYWxsLXRvLWFjdGlvbi1jb3VudGVyLmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9jYWxsLXRvLWFjdGlvbi1sYWJlbC5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvY29tbWVudC1hcmVhLXBhcnRpYWwuaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL2NvbW1lbnRzLXBhZ2UuaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL2NvbmZpcm1hdGlvbi1wYWdlLmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9kZWZhdWx0cy1wYWdlLmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9sb2NhdGlvbnMtcGFnZS5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvbWVkaWEtaW5kaWNhdG9yLXdpZGdldC5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvcG9wdXAtd2lkZ2V0Lmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9yZWFjdGlvbnMtcGFnZS5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvcmVhY3Rpb25zLXdpZGdldC5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvc3VtbWFyeS13aWRnZXQuaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL3N2Zy1jb21tZW50cy5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvc3ZnLWZhY2Vib29rLmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9zdmctbGVmdC5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvc3ZnLWxvY2F0aW9uLmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9zdmctbG9nby1zZWxlY3RhYmxlLmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9zdmctbG9nby5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvc3ZnLXR3aXR0ZXIuaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL3N2Z3MuaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL3RleHQtaW5kaWNhdG9yLXdpZGdldC5oYnMuaHRtbCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdlFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaE9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2UkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDamRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9IQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwYUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdFRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbE5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9HQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9HQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBOztBQ0FBOztBQ0FBOztBQ0FBOztBQ0FBOztBQ0FBOztBQ0FBOztBQ0FBOztBQ0FBOztBQ0FBOztBQ0FBOztBQ0FBOztBQ0FBOztBQ0FBOztBQ0FBOztBQ0FBOztBQ0FBOztBQ0FBOztBQ0FBOztBQ0FBOztBQ0FBOztBQ0FBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIlxudmFyIFNjcmlwdExvYWRlciA9IHJlcXVpcmUoJy4vc2NyaXB0LWxvYWRlcicpO1xudmFyIENzc0xvYWRlciA9IHJlcXVpcmUoJy4vY3NzLWxvYWRlcicpO1xudmFyIEdyb3VwU2V0dGluZ3NMb2FkZXIgPSByZXF1aXJlKCcuL2dyb3VwLXNldHRpbmdzLWxvYWRlcicpO1xudmFyIFBhZ2VEYXRhTG9hZGVyID0gcmVxdWlyZSgnLi9wYWdlLWRhdGEtbG9hZGVyJyk7XG52YXIgUGFnZVNjYW5uZXIgPSByZXF1aXJlKCcuL3BhZ2Utc2Nhbm5lcicpO1xudmFyIFhETUFuYWx5dGljcyA9IHJlcXVpcmUoJy4veGRtLWFuYWx5dGljcycpO1xudmFyIFhETUxvYWRlciA9IHJlcXVpcmUoJy4vdXRpbHMveGRtLWxvYWRlcicpO1xuXG5cbi8vIFN0ZXAgMSAtIGtpY2sgb2ZmIHRoZSBhc3luY2hyb25vdXMgbG9hZGluZyBvZiB0aGUgSmF2YXNjcmlwdCBhbmQgQ1NTIHdlIG5lZWQuXG5Dc3NMb2FkZXIubG9hZCgpOyAvLyBJbmplY3QgdGhlIENTUyBmaXJzdCBiZWNhdXNlIHdlIG1heSBzb29uIGFwcGVuZCBtb3JlIGFzeW5jaHJvbm91c2x5LCBpbiB0aGUgZ3JvdXBTZXR0aW5ncyBjYWxsYmFjaywgYW5kIHdlIHdhbnQgdGhhdCBDU1MgdG8gYmUgbG93ZXIgaW4gdGhlIGRvY3VtZW50LlxuU2NyaXB0TG9hZGVyLmxvYWQoc2NyaXB0TG9hZGVkKTtcblxuZnVuY3Rpb24gc2NyaXB0TG9hZGVkKCkge1xuICAgIC8vIFN0ZXAgMiAtIE9uY2Ugd2UgaGF2ZSBvdXIgcmVxdWlyZWQgc2NyaXB0cywgZmV0Y2ggdGhlIGdyb3VwIHNldHRpbmdzIGZyb20gdGhlIHNlcnZlclxuICAgIEdyb3VwU2V0dGluZ3NMb2FkZXIubG9hZChmdW5jdGlvbihncm91cFNldHRpbmdzKSB7XG4gICAgICAgIC8vIFN0ZXAgMyAtIE9uY2Ugd2UgaGF2ZSB0aGUgc2V0dGluZ3MsIHdlIGNhbiBraWNrIG9mZiBhIGNvdXBsZSB0aGluZ3MgaW4gcGFyYWxsZWw6XG4gICAgICAgIC8vXG4gICAgICAgIC8vIC0tIGluamVjdCBhbnkgY3VzdG9tIENTUyBmcm9tIHRoZSBncm91cCBzZXR0aW5nc1xuICAgICAgICAvLyAtLSBjcmVhdGUgdGhlIGhpZGRlbiBpZnJhbWUgd2UgdXNlIGZvciBjcm9zcy1kb21haW4gY29va2llcyAocHJpbWFyaWx5IHVzZXIgbG9naW4pXG4gICAgICAgIC8vIC0tIHN0YXJ0IGZldGNoaW5nIHRoZSBwYWdlIGRhdGFcbiAgICAgICAgLy8gLS0gc3RhcnQgaGFzaGluZyB0aGUgcGFnZSBhbmQgaW5zZXJ0aW5nIHRoZSBhZmZvcmRhbmNlcyAoaW4gdGhlIGVtcHR5IHN0YXRlKVxuICAgICAgICAvL1xuICAgICAgICAvLyBBcyB0aGUgcGFnZSBpcyBzY2FubmVkLCB0aGUgd2lkZ2V0cyBhcmUgY3JlYXRlZCBhbmQgYm91bmQgdG8gdGhlIHBhZ2UgZGF0YSB0aGF0IGNvbWVzIGluLlxuICAgICAgICBpbml0Q3VzdG9tQ1NTKGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICBpbml0WGRtRnJhbWUoZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIGZldGNoUGFnZURhdGEoZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIHNjYW5QYWdlKGdyb3VwU2V0dGluZ3MpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBpbml0Q3VzdG9tQ1NTKGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgY3VzdG9tQ1NTID0gZ3JvdXBTZXR0aW5ncy5jdXN0b21DU1MoKTtcbiAgICBpZiAoY3VzdG9tQ1NTKSB7XG4gICAgICAgIENzc0xvYWRlci5pbmplY3QoY3VzdG9tQ1NTKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGluaXRYZG1GcmFtZShncm91cFNldHRpbmdzKSB7XG4gICAgWERNQW5hbHl0aWNzLnN0YXJ0KCk7IC8vIFRoZSBYRE0gaWZyYW1lIGhhcyBhIG51bWJlciBvZiBtZXNzYWdlcyBpdCBmaXJlcyBvbiBsb2FkIHJlbGF0ZWQgdG8gYW5hbHl0aWNzLiBTdGFydCBsaXN0ZW5pbmcuXG4gICAgWERNTG9hZGVyLmNyZWF0ZVhETWZyYW1lKGdyb3VwU2V0dGluZ3MuZ3JvdXBJZCk7XG59XG5cbmZ1bmN0aW9uIGZldGNoUGFnZURhdGEoZ3JvdXBTZXR0aW5ncykge1xuICAgIFBhZ2VEYXRhTG9hZGVyLmxvYWQoZ3JvdXBTZXR0aW5ncyk7XG59XG5cbmZ1bmN0aW9uIHNjYW5QYWdlKGdyb3VwU2V0dGluZ3MpIHtcbiAgICBQYWdlU2Nhbm5lci5zY2FuKGdyb3VwU2V0dGluZ3MpO1xufSIsInZhciAkOyByZXF1aXJlKCcuL3V0aWxzL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIFJhY3RpdmU7IHJlcXVpcmUoJy4vdXRpbHMvcmFjdGl2ZS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihsb2FkZWRSYWN0aXZlKSB7IFJhY3RpdmU9bG9hZGVkUmFjdGl2ZTsgfSk7XG52YXIgU1ZHcyA9IHJlcXVpcmUoJy4vc3ZncycpO1xuXG5mdW5jdGlvbiBjcmVhdGVDYWxsVG9BY3Rpb24oYW50SXRlbUlkKSB7XG4gICAgdmFyIHJhY3RpdmUgPSBSYWN0aXZlKHtcbiAgICAgICAgZWw6ICQoJ2RpdicpLFxuICAgICAgICBkYXRhOiB7IGFudEl0ZW1JZDogYW50SXRlbUlkIH0sXG4gICAgICAgIHRlbXBsYXRlOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvYXV0by1jYWxsLXRvLWFjdGlvbi5oYnMuaHRtbCcpLFxuICAgICAgICBwYXJ0aWFsczoge1xuICAgICAgICAgICAgbG9nbzogU1ZHcy5sb2dvXG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gJChyYWN0aXZlLmZpbmQoJy5hbnRlbm5hLWF1dG8tY3RhJykpO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlOiBjcmVhdGVDYWxsVG9BY3Rpb25cbn07IiwidmFyIFJhY3RpdmU7IHJlcXVpcmUoJy4vdXRpbHMvcmFjdGl2ZS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihsb2FkZWRSYWN0aXZlKSB7IFJhY3RpdmUgPSBsb2FkZWRSYWN0aXZlO30pO1xuXG5mdW5jdGlvbiBjcmVhdGVDb3VudCgkY291bnRFbGVtZW50LCBjb250YWluZXJEYXRhKSB7XG4gICAgUmFjdGl2ZSh7XG4gICAgICAgIGVsOiAkY291bnRFbGVtZW50LFxuICAgICAgICBtYWdpYzogdHJ1ZSxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgY29udGFpbmVyRGF0YTogY29udGFpbmVyRGF0YVxuICAgICAgICB9LFxuICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL2NhbGwtdG8tYWN0aW9uLWNvdW50ZXIuaGJzLmh0bWwnKVxuICAgIH0pO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlOiBjcmVhdGVDb3VudFxufTsiLCJ2YXIgQ2FsbFRvQWN0aW9uQ291bnRlciA9IHJlcXVpcmUoJy4vY2FsbC10by1hY3Rpb24tY291bnRlcicpO1xudmFyIENhbGxUb0FjdGlvbkxhYmVsID0gcmVxdWlyZSgnLi9jYWxsLXRvLWFjdGlvbi1sYWJlbCcpO1xudmFyIFJlYWN0aW9uc1dpZGdldCA9IHJlcXVpcmUoJy4vcmVhY3Rpb25zLXdpZGdldCcpO1xuXG5cbmZ1bmN0aW9uIGNyZWF0ZUluZGljYXRvcldpZGdldChvcHRpb25zKSB7XG4gICAgdmFyIGNvbnRhaW5lckRhdGEgPSBvcHRpb25zLmNvbnRhaW5lckRhdGE7XG4gICAgdmFyICRjb250YWluZXJFbGVtZW50ID0gb3B0aW9ucy5jb250YWluZXJFbGVtZW50O1xuICAgIHZhciBjb250ZW50RGF0YSA9IG9wdGlvbnMuY29udGVudERhdGE7XG4gICAgdmFyICRjdGFFbGVtZW50ID0gb3B0aW9ucy5jdGFFbGVtZW50O1xuICAgIHZhciAkY3RhTGFiZWxzID0gb3B0aW9ucy5jdGFMYWJlbHM7IC8vIG9wdGlvbmFsXG4gICAgdmFyICRjdGFDb3VudGVycyA9IG9wdGlvbnMuY3RhQ291bnRlcnM7IC8vIG9wdGlvbmFsXG4gICAgdmFyIHBhZ2VEYXRhID0gb3B0aW9ucy5wYWdlRGF0YTtcbiAgICB2YXIgZ3JvdXBTZXR0aW5ncyA9IG9wdGlvbnMuZ3JvdXBTZXR0aW5ncztcbiAgICB2YXIgZGVmYXVsdFJlYWN0aW9ucyA9IG9wdGlvbnMuZGVmYXVsdFJlYWN0aW9ucztcblxuICAgIHZhciByZWFjdGlvbldpZGdldE9wdGlvbnMgPSB7XG4gICAgICAgIHJlYWN0aW9uc0RhdGE6IGNvbnRhaW5lckRhdGEucmVhY3Rpb25zLFxuICAgICAgICBjb250YWluZXJEYXRhOiBjb250YWluZXJEYXRhLFxuICAgICAgICBjb250YWluZXJFbGVtZW50OiAkY29udGFpbmVyRWxlbWVudCxcbiAgICAgICAgY29udGVudERhdGE6IGNvbnRlbnREYXRhLFxuICAgICAgICBkZWZhdWx0UmVhY3Rpb25zOiBkZWZhdWx0UmVhY3Rpb25zLFxuICAgICAgICBzdGFydFBhZ2U6IGNvbXB1dGVTdGFydFBhZ2UoJGN0YUVsZW1lbnQpLFxuICAgICAgICBwYWdlRGF0YTogcGFnZURhdGEsXG4gICAgICAgIGdyb3VwU2V0dGluZ3M6IGdyb3VwU2V0dGluZ3NcbiAgICB9O1xuXG4gICAgJGN0YUVsZW1lbnQub24oJ21vdXNlZW50ZXIuYW50ZW5uYScsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGlmIChldmVudC5idXR0b25zID4gMCB8fCAoZXZlbnQuYnV0dG9ucyA9PSB1bmRlZmluZWQgJiYgZXZlbnQud2hpY2ggPiAwKSkgeyAvLyBPbiBTYWZhcmksIGV2ZW50LmJ1dHRvbnMgaXMgdW5kZWZpbmVkIGJ1dCBldmVudC53aGljaCBnaXZlcyBhIGdvb2QgdmFsdWUuIGV2ZW50LndoaWNoIGlzIGJhZCBvbiBGRlxuICAgICAgICAgICAgLy8gRG9uJ3QgcmVhY3QgaWYgdGhlIHVzZXIgaXMgZHJhZ2dpbmcgb3Igc2VsZWN0aW5nIHRleHQuXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgb3BlblJlYWN0aW9uc1dpbmRvdyhyZWFjdGlvbldpZGdldE9wdGlvbnMsICRjdGFFbGVtZW50KTtcbiAgICB9KTtcblxuICAgIGlmICgkY3RhTGFiZWxzKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgJGN0YUxhYmVscy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgQ2FsbFRvQWN0aW9uTGFiZWwuY3JlYXRlKCRjdGFMYWJlbHNbaV0sIGNvbnRhaW5lckRhdGEpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCRjdGFDb3VudGVycykge1xuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8ICRjdGFDb3VudGVycy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgQ2FsbFRvQWN0aW9uQ291bnRlci5jcmVhdGUoJGN0YUNvdW50ZXJzW2pdLCBjb250YWluZXJEYXRhKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gY29tcHV0ZVN0YXJ0UGFnZSgkZWxlbWVudCkge1xuICAgIHZhciB2YWwgPSAoJGVsZW1lbnQuYXR0cignYW50LW1vZGUnKSB8fCAnJykudHJpbSgpO1xuICAgIGlmICh2YWwgPT09ICd3cml0ZScpIHtcbiAgICAgICAgcmV0dXJuIFJlYWN0aW9uc1dpZGdldC5QQUdFX0RFRkFVTFRTO1xuICAgIH0gZWxzZSBpZiAodmFsID09PSAncmVhZCcpIHtcbiAgICAgICAgcmV0dXJuIFJlYWN0aW9uc1dpZGdldC5QQUdFX1JFQUNUSU9OUztcbiAgICB9XG4gICAgcmV0dXJuIFJlYWN0aW9uc1dpZGdldC5QQUdFX0FVVE87XG59XG5cbmZ1bmN0aW9uIG9wZW5SZWFjdGlvbnNXaW5kb3cocmVhY3Rpb25PcHRpb25zLCAkY3RhRWxlbWVudCkge1xuICAgIFJlYWN0aW9uc1dpZGdldC5vcGVuKHJlYWN0aW9uT3B0aW9ucywgJGN0YUVsZW1lbnQpO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlOiBjcmVhdGVJbmRpY2F0b3JXaWRnZXRcbn07IiwidmFyIFJhY3RpdmU7IHJlcXVpcmUoJy4vdXRpbHMvcmFjdGl2ZS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihsb2FkZWRSYWN0aXZlKSB7IFJhY3RpdmUgPSBsb2FkZWRSYWN0aXZlO30pO1xuXG5mdW5jdGlvbiBjcmVhdGVMYWJlbCgkbGFiZWxFbGVtZW50LCBjb250YWluZXJEYXRhKSB7XG4gICAgUmFjdGl2ZSh7XG4gICAgICAgIGVsOiAkbGFiZWxFbGVtZW50LCAvLyBUT0RPOiByZXZpZXcgdGhlIHN0cnVjdHVyZSBvZiB0aGUgRE9NIGhlcmUuIERvIHdlIHdhbnQgdG8gcmVuZGVyIGFuIGVsZW1lbnQgaW50byAkY3RhTGFiZWwgb3IganVzdCB0ZXh0P1xuICAgICAgICBtYWdpYzogdHJ1ZSxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgY29udGFpbmVyRGF0YTogY29udGFpbmVyRGF0YVxuICAgICAgICB9LFxuICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL2NhbGwtdG8tYWN0aW9uLWxhYmVsLmhicy5odG1sJylcbiAgICB9KTtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZTogY3JlYXRlTGFiZWxcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgQWpheENsaWVudCA9IHJlcXVpcmUoJy4vdXRpbHMvYWpheC1jbGllbnQnKTtcbnZhciBVc2VyID0gcmVxdWlyZSgnLi91dGlscy91c2VyJyk7XG5cbnZhciBFdmVudHMgPSByZXF1aXJlKCcuL2V2ZW50cycpO1xuXG5mdW5jdGlvbiBzZXR1cENvbW1lbnRBcmVhKHJlYWN0aW9uUHJvdmlkZXIsIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzLCBjYWxsYmFjaywgcmFjdGl2ZSkge1xuICAgIHJhY3RpdmUub24oJ2lucHV0Y2hhbmdlZCcsIHVwZGF0ZUlucHV0Q291bnRlcik7XG4gICAgcmFjdGl2ZS5vbignYWRkY29tbWVudCcsIGFkZENvbW1lbnQpO1xuICAgIHVwZGF0ZUlucHV0Q291bnRlcigpO1xuXG4gICAgZnVuY3Rpb24gYWRkQ29tbWVudCgpIHtcbiAgICAgICAgdmFyIGNvbW1lbnQgPSAkKHJhY3RpdmUuZmluZCgnLmFudGVubmEtY29tbWVudC1pbnB1dCcpKS52YWwoKS50cmltKCk7IC8vIFRPRE86IGFkZGl0aW9uYWwgdmFsaWRhdGlvbj8gaW5wdXQgc2FuaXRpemluZz9cbiAgICAgICAgaWYgKGNvbW1lbnQubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgJChyYWN0aXZlLmZpbmQoJy5hbnRlbm5hLWNvbW1lbnQtd2lkZ2V0cycpKS5oaWRlKCk7XG4gICAgICAgICAgICAkKHJhY3RpdmUuZmluZCgnLmFudGVubmEtY29tbWVudC13YWl0aW5nJykpLmZhZGVJbignc2xvdycpO1xuICAgICAgICAgICAgcmVhY3Rpb25Qcm92aWRlci5nZXQoZnVuY3Rpb24gKHJlYWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgQWpheENsaWVudC5wb3N0Q29tbWVudChjb21tZW50LCByZWFjdGlvbiwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgRXZlbnRzLnBvc3RDb21tZW50Q3JlYXRlZChwYWdlRGF0YSwgY29udGFpbmVyRGF0YSwgcmVhY3Rpb24sIGNvbW1lbnQsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgICAgIH0sIGVycm9yKTtcbiAgICAgICAgICAgICAgICAkKHJhY3RpdmUuZmluZCgnLmFudGVubmEtY29tbWVudC13YWl0aW5nJykpLnN0b3AoKS5oaWRlKCk7XG4gICAgICAgICAgICAgICAgJChyYWN0aXZlLmZpbmQoJy5hbnRlbm5hLWNvbW1lbnQtcmVjZWl2ZWQnKSkuZmFkZUluKCk7XG4gICAgICAgICAgICAgICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGNvbW1lbnQsIFVzZXIub3B0aW1pc3RpY1VzZXIoKSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gZXJyb3IobWVzc2FnZSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBUT0RPIHJlYWwgZXJyb3IgaGFuZGxpbmdcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0Vycm9yIHBvc3RpbmcgY29tbWVudDogJyArIG1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdXBkYXRlSW5wdXRDb3VudGVyKCkge1xuICAgICAgICB2YXIgJHRleHRhcmVhID0gJChyYWN0aXZlLmZpbmQoJy5hbnRlbm5hLWNvbW1lbnQtaW5wdXQnKSk7XG4gICAgICAgIHZhciBtYXggPSBwYXJzZUludCgkdGV4dGFyZWEuYXR0cignbWF4bGVuZ3RoJykpO1xuICAgICAgICB2YXIgbGVuZ3RoID0gJHRleHRhcmVhLnZhbCgpLmxlbmd0aDtcbiAgICAgICAgJChyYWN0aXZlLmZpbmQoJy5hbnRlbm5hLWNvbW1lbnQtY291bnQnKSkuaHRtbChNYXRoLm1heCgwLCBtYXggLSBsZW5ndGgpKTtcbiAgICB9XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBzZXR1cDogc2V0dXBDb21tZW50QXJlYVxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi91dGlscy9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciBSYWN0aXZlOyByZXF1aXJlKCcuL3V0aWxzL3JhY3RpdmUtcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24obG9hZGVkUmFjdGl2ZSkgeyBSYWN0aXZlID0gbG9hZGVkUmFjdGl2ZTt9KTtcbnZhciBDb21tZW50QXJlYVBhcnRpYWwgPSByZXF1aXJlKCcuL2NvbW1lbnQtYXJlYS1wYXJ0aWFsJyk7XG52YXIgU1ZHcyA9IHJlcXVpcmUoJy4vc3ZncycpO1xuXG52YXIgcGFnZVNlbGVjdG9yID0gJy5hbnRlbm5hLWNvbW1lbnRzLXBhZ2UnO1xuXG5mdW5jdGlvbiBjcmVhdGVQYWdlKG9wdGlvbnMpIHtcbiAgICB2YXIgcmVhY3Rpb24gPSBvcHRpb25zLnJlYWN0aW9uO1xuICAgIHZhciBjb21tZW50cyA9IG9wdGlvbnMuY29tbWVudHM7XG4gICAgdmFyIGVsZW1lbnQgPSBvcHRpb25zLmVsZW1lbnQ7XG4gICAgdmFyIGNvbnRhaW5lckRhdGEgPSBvcHRpb25zLmNvbnRhaW5lckRhdGE7XG4gICAgdmFyIHBhZ2VEYXRhID0gb3B0aW9ucy5wYWdlRGF0YTtcbiAgICB2YXIgZ3JvdXBTZXR0aW5ncyA9IG9wdGlvbnMuZ3JvdXBTZXR0aW5ncztcbiAgICB2YXIgZ29CYWNrID0gb3B0aW9ucy5nb0JhY2s7XG4gICAgdmFyIHJhY3RpdmUgPSBSYWN0aXZlKHtcbiAgICAgICAgZWw6IGVsZW1lbnQsXG4gICAgICAgIGFwcGVuZDogdHJ1ZSxcbiAgICAgICAgbWFnaWM6IHRydWUsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIHJlYWN0aW9uOiByZWFjdGlvbixcbiAgICAgICAgICAgIGNvbW1lbnRzOiBjb21tZW50c1xuICAgICAgICB9LFxuICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL2NvbW1lbnRzLXBhZ2UuaGJzLmh0bWwnKSxcbiAgICAgICAgcGFydGlhbHM6IHtcbiAgICAgICAgICAgIGNvbW1lbnRBcmVhOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvY29tbWVudC1hcmVhLXBhcnRpYWwuaGJzLmh0bWwnKSxcbiAgICAgICAgICAgIGxlZnQ6IFNWR3MubGVmdFxuICAgICAgICB9XG4gICAgfSk7XG4gICAgdmFyIHJlYWN0aW9uUHJvdmlkZXIgPSB7IC8vIHRoaXMgcmVhY3Rpb24gcHJvdmlkZXIgaXMgYSBuby1icmFpbmVyIGJlY2F1c2Ugd2UgYWxyZWFkeSBoYXZlIGEgdmFsaWQgcmVhY3Rpb24gKG9uZSB3aXRoIGFuIElEKVxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhyZWFjdGlvbik7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIENvbW1lbnRBcmVhUGFydGlhbC5zZXR1cChyZWFjdGlvblByb3ZpZGVyLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncywgY29tbWVudEFkZGVkLCByYWN0aXZlLCBncm91cFNldHRpbmdzKTtcbiAgICByYWN0aXZlLm9uKCdiYWNrJywgZ29CYWNrKTtcbiAgICByZXR1cm4ge1xuICAgICAgICBzZWxlY3RvcjogcGFnZVNlbGVjdG9yLFxuICAgICAgICB0ZWFyZG93bjogZnVuY3Rpb24oKSB7IHJhY3RpdmUudGVhcmRvd24oKTsgfVxuICAgIH07XG5cbiAgICBmdW5jdGlvbiBjb21tZW50QWRkZWQoY29tbWVudCwgdXNlcikge1xuICAgICAgICBjb21tZW50cy51bnNoaWZ0KHsgdGV4dDogY29tbWVudCwgdXNlcjogdXNlciwgbmV3OiB0cnVlIH0pO1xuICAgICAgICAkKHJhY3RpdmUuZmluZCgnLmFudGVubmEtYm9keScpKS5hbmltYXRlKHtzY3JvbGxUb3A6IDB9KTtcbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZTogY3JlYXRlUGFnZVxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi91dGlscy9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciBSYWN0aXZlOyByZXF1aXJlKCcuL3V0aWxzL3JhY3RpdmUtcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24obG9hZGVkUmFjdGl2ZSkgeyBSYWN0aXZlID0gbG9hZGVkUmFjdGl2ZTt9KTtcbnZhciBDb21tZW50QXJlYVBhcnRpYWwgPSByZXF1aXJlKCcuL2NvbW1lbnQtYXJlYS1wYXJ0aWFsJyk7XG52YXIgU1ZHcyA9IHJlcXVpcmUoJy4vc3ZncycpO1xuXG52YXIgcGFnZVNlbGVjdG9yID0gJy5hbnRlbm5hLWNvbmZpcm1hdGlvbi1wYWdlJztcblxuZnVuY3Rpb24gY3JlYXRlUGFnZShyZWFjdGlvblRleHQsIHJlYWN0aW9uUHJvdmlkZXIsIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzLCBlbGVtZW50KSB7XG4gICAgdmFyIHJhY3RpdmUgPSBSYWN0aXZlKHtcbiAgICAgICAgZWw6IGVsZW1lbnQsXG4gICAgICAgIGFwcGVuZDogdHJ1ZSxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgdGV4dDogcmVhY3Rpb25UZXh0XG4gICAgICAgIH0sXG4gICAgICAgIHRlbXBsYXRlOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvY29uZmlybWF0aW9uLXBhZ2UuaGJzLmh0bWwnKSxcbiAgICAgICAgcGFydGlhbHM6IHtcbiAgICAgICAgICAgIGNvbW1lbnRBcmVhOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvY29tbWVudC1hcmVhLXBhcnRpYWwuaGJzLmh0bWwnKSxcbiAgICAgICAgICAgIGZhY2Vib29rSWNvbjogU1ZHcy5mYWNlYm9vayxcbiAgICAgICAgICAgIHR3aXR0ZXJJY29uOiBTVkdzLnR3aXR0ZXJcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIENvbW1lbnRBcmVhUGFydGlhbC5zZXR1cChyZWFjdGlvblByb3ZpZGVyLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncywgbnVsbCwgcmFjdGl2ZSk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgc2VsZWN0b3I6IHBhZ2VTZWxlY3RvcixcbiAgICAgICAgdGVhcmRvd246IGZ1bmN0aW9uKCkgeyByYWN0aXZlLnRlYXJkb3duKCk7IH1cbiAgICB9O1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlOiBjcmVhdGVQYWdlXG59OyIsInZhciBBcHBNb2RlID0gcmVxdWlyZSgnLi91dGlscy9hcHAtbW9kZScpO1xudmFyIFVSTENvbnN0YW50cyA9IHJlcXVpcmUoJy4vdXRpbHMvdXJsLWNvbnN0YW50cycpO1xuXG52YXIgYmFzZVVybDtcbmlmIChBcHBNb2RlLnRlc3QpIHtcbiAgICBiYXNlVXJsID0gVVJMQ29uc3RhbnRzLlRFU1Q7XG59IGVsc2UgaWYgKEFwcE1vZGUub2ZmbGluZSkge1xuICAgIGJhc2VVcmwgPSBVUkxDb25zdGFudHMuREVWRUxPUE1FTlQ7XG59IGVsc2Uge1xuICAgIGJhc2VVcmwgPSBVUkxDb25zdGFudHMuUFJPRFVDVElPTjtcbn1cblxuZnVuY3Rpb24gbG9hZENzcygpIHtcbiAgICAvLyBUbyBtYWtlIHN1cmUgbm9uZSBvZiBvdXIgY29udGVudCByZW5kZXJzIG9uIHRoZSBwYWdlIGJlZm9yZSBvdXIgQ1NTIGlzIGxvYWRlZCwgd2UgYXBwZW5kIGEgc2ltcGxlIGlubGluZSBzdHlsZVxuICAgIC8vIGVsZW1lbnQgdGhhdCB0dXJucyBvZmYgb3VyIGVsZW1lbnRzICpiZWZvcmUqIG91ciBDU1MgbGlua3MuIFRoaXMgZXhwbG9pdHMgdGhlIGNhc2NhZGUgcnVsZXMgLSBvdXIgQ1NTIGZpbGVzIGFwcGVhclxuICAgIC8vIGFmdGVyIHRoZSBpbmxpbmUgc3R5bGUgaW4gdGhlIGRvY3VtZW50LCBzbyB0aGV5IHRha2UgcHJlY2VkZW5jZSAoYW5kIG1ha2UgZXZlcnl0aGluZyBhcHBlYXIpIG9uY2UgdGhleSdyZSBsb2FkZWQuXG4gICAgaW5qZWN0Q3NzKCcuYW50ZW5uYXtkaXNwbGF5Om5vbmU7fScpO1xuICAgIHZhciBjc3NIcmVmID0gYmFzZVVybCArICcvc3RhdGljL3dpZGdldC1uZXcvZGVidWcvYW50ZW5uYS5jc3MnOyAvLyBUT0RPIHRoaXMgbmVlZHMgYSBmaW5hbCBwYXRoLiBDRE4gZm9yIHByb2R1Y3Rpb24gYW5kIGxvY2FsIGZpbGUgZm9yIGRldmVsb3BtZW50P1xuICAgIGxvYWRGaWxlKGNzc0hyZWYpO1xufVxuXG5mdW5jdGlvbiBsb2FkRmlsZShocmVmKSB7XG4gICAgdmFyIGxpbmtUYWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaW5rJyk7XG4gICAgbGlua1RhZy5zZXRBdHRyaWJ1dGUoJ2hyZWYnLCBocmVmKTtcbiAgICBsaW5rVGFnLnNldEF0dHJpYnV0ZSgncmVsJywgJ3N0eWxlc2hlZXQnKTtcbiAgICBsaW5rVGFnLnNldEF0dHJpYnV0ZSgndHlwZScsICd0ZXh0L2NzcycpO1xuICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQobGlua1RhZyk7XG59XG5cbmZ1bmN0aW9uIGluamVjdENzcyhjc3NTdHJpbmcpIHtcbiAgICB2YXIgc3R5bGVUYWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xuICAgIHN0eWxlVGFnLnNldEF0dHJpYnV0ZSgndHlwZScsICd0ZXh0L2NzcycpO1xuICAgIHN0eWxlVGFnLmlubmVySFRNTCA9IGNzc1N0cmluZztcbiAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHN0eWxlVGFnKTtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGxvYWQgOiBsb2FkQ3NzLFxuICAgIGluamVjdDogaW5qZWN0Q3NzXG59OyIsInZhciAkOyByZXF1aXJlKCcuL3V0aWxzL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIEFqYXhDbGllbnQgPSByZXF1aXJlKCcuL3V0aWxzL2FqYXgtY2xpZW50Jyk7XG52YXIgUmFjdGl2ZTsgcmVxdWlyZSgnLi91dGlscy9yYWN0aXZlLXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGxvYWRlZFJhY3RpdmUpIHsgUmFjdGl2ZSA9IGxvYWRlZFJhY3RpdmU7fSk7XG52YXIgUmVhY3Rpb25zV2lkZ2V0TGF5b3V0VXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzL3JlYWN0aW9ucy13aWRnZXQtbGF5b3V0LXV0aWxzJyk7XG5cbnZhciBFdmVudHMgPSByZXF1aXJlKCcuL2V2ZW50cycpO1xudmFyIFBhZ2VEYXRhID0gcmVxdWlyZSgnLi9wYWdlLWRhdGEnKTtcblxudmFyIHBhZ2VTZWxlY3RvciA9ICcuYW50ZW5uYS1kZWZhdWx0cy1wYWdlJztcblxuZnVuY3Rpb24gY3JlYXRlUGFnZShvcHRpb25zKSB7XG4gICAgdmFyIGRlZmF1bHRSZWFjdGlvbnMgPSBvcHRpb25zLmRlZmF1bHRSZWFjdGlvbnM7XG4gICAgdmFyIGNvbnRhaW5lckRhdGEgPSBvcHRpb25zLmNvbnRhaW5lckRhdGE7XG4gICAgdmFyIHBhZ2VEYXRhID0gb3B0aW9ucy5wYWdlRGF0YTtcbiAgICB2YXIgZ3JvdXBTZXR0aW5ncyA9IG9wdGlvbnMuZ3JvdXBTZXR0aW5ncztcbiAgICB2YXIgY29udGVudERhdGEgPSBvcHRpb25zLmNvbnRlbnREYXRhO1xuICAgIHZhciBzaG93Q29uZmlybWF0aW9uID0gb3B0aW9ucy5zaG93Q29uZmlybWF0aW9uO1xuICAgIHZhciBlbGVtZW50ID0gb3B0aW9ucy5lbGVtZW50O1xuICAgIHZhciBkZWZhdWx0TGF5b3V0RGF0YSA9IFJlYWN0aW9uc1dpZGdldExheW91dFV0aWxzLmNvbXB1dGVMYXlvdXREYXRhKGRlZmF1bHRSZWFjdGlvbnMpO1xuICAgIHZhciAkcmVhY3Rpb25zV2luZG93ID0gJChvcHRpb25zLnJlYWN0aW9uc1dpbmRvdyk7XG4gICAgdmFyIHJhY3RpdmUgPSBSYWN0aXZlKHtcbiAgICAgICAgZWw6IGVsZW1lbnQsXG4gICAgICAgIGFwcGVuZDogdHJ1ZSxcbiAgICAgICAgdGVtcGxhdGU6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9kZWZhdWx0cy1wYWdlLmhicy5odG1sJyksXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIGRlZmF1bHRSZWFjdGlvbnM6IGRlZmF1bHRSZWFjdGlvbnMsXG4gICAgICAgICAgICBkZWZhdWx0TGF5b3V0Q2xhc3M6IGFycmF5QWNjZXNzb3IoZGVmYXVsdExheW91dERhdGEubGF5b3V0Q2xhc3NlcylcbiAgICAgICAgfSxcbiAgICAgICAgZGVjb3JhdG9yczoge1xuICAgICAgICAgICAgc2l6ZXRvZml0OiBSZWFjdGlvbnNXaWRnZXRMYXlvdXRVdGlscy5zaXplVG9GaXQoJHJlYWN0aW9uc1dpbmRvdylcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmFjdGl2ZS5vbignbmV3cmVhY3Rpb24nLCBuZXdEZWZhdWx0UmVhY3Rpb24pO1xuICAgIHJhY3RpdmUub24oJ2N1c3RvbWZvY3VzJywgY3VzdG9tUmVhY3Rpb25Gb2N1cyk7XG4gICAgcmFjdGl2ZS5vbignY3VzdG9tYmx1cicsIGN1c3RvbVJlYWN0aW9uQmx1cik7XG4gICAgcmFjdGl2ZS5vbignYWRkY3VzdG9tJywgc3VibWl0Q3VzdG9tUmVhY3Rpb24pO1xuICAgIHJhY3RpdmUub24oJ3BhZ2VrZXlkb3duJywga2V5Ym9hcmRJbnB1dCk7XG4gICAgcmFjdGl2ZS5vbignaW5wdXRrZXlkb3duJywgY3VzdG9tUmVhY3Rpb25JbnB1dCk7XG5cbiAgICAkKHJvb3RFbGVtZW50KHJhY3RpdmUpKS5mb2N1cygpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgc2VsZWN0b3I6IHBhZ2VTZWxlY3RvcixcbiAgICAgICAgdGVhcmRvd246IGZ1bmN0aW9uKCkgeyByYWN0aXZlLnRlYXJkb3duKCk7IH1cbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gY3VzdG9tUmVhY3Rpb25JbnB1dChyYWN0aXZlRXZlbnQpIHtcbiAgICAgICAgdmFyIGV2ZW50ID0gcmFjdGl2ZUV2ZW50Lm9yaWdpbmFsO1xuICAgICAgICB2YXIga2V5ID0gKGV2ZW50LndoaWNoICE9PSB1bmRlZmluZWQpID8gZXZlbnQud2hpY2ggOiBldmVudC5rZXlDb2RlO1xuICAgICAgICBpZiAoa2V5ID09IDEzKSB7IC8vIEVudGVyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyAvLyBsZXQgdGhlIHByb2Nlc3Npbmcgb2YgdGhlIGtleWJvYXJkIGV2ZW50IGZpbmlzaCBiZWZvcmUgd2Ugc2hvdyB0aGUgcGFnZSAob3RoZXJ3aXNlLCB0aGUgY29uZmlybWF0aW9uIHBhZ2UgYWxzbyByZWNlaXZlcyB0aGUga2V5c3Ryb2tlKVxuICAgICAgICAgICAgICAgIHN1Ym1pdEN1c3RvbVJlYWN0aW9uKCk7XG4gICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgfSBlbHNlIGlmIChrZXkgPT0gMjcpIHsgLy8gRXNjYXBlXG4gICAgICAgICAgICAkKGV2ZW50LnRhcmdldCkudmFsKCcnKTtcbiAgICAgICAgICAgICQocm9vdEVsZW1lbnQocmFjdGl2ZSkpLmZvY3VzKCk7XG4gICAgICAgIH1cbiAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbmV3RGVmYXVsdFJlYWN0aW9uKHJhY3RpdmVFdmVudCkge1xuICAgICAgICB2YXIgZGVmYXVsdFJlYWN0aW9uRGF0YSA9IHJhY3RpdmVFdmVudC5jb250ZXh0O1xuICAgICAgICBwb3N0TmV3UmVhY3Rpb24oZGVmYXVsdFJlYWN0aW9uRGF0YSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc3VibWl0Q3VzdG9tUmVhY3Rpb24oKSB7XG4gICAgICAgIHZhciBib2R5ID0gJChyYWN0aXZlLmZpbmQoJy5hbnRlbm5hLWRlZmF1bHRzLWZvb3RlciBpbnB1dCcpKS52YWwoKS50cmltKCk7XG4gICAgICAgIGlmIChib2R5ICE9PSAnJykge1xuICAgICAgICAgICAgdmFyIHJlYWN0aW9uRGF0YSA9IHsgdGV4dDogYm9keSB9O1xuICAgICAgICAgICAgcG9zdE5ld1JlYWN0aW9uKHJlYWN0aW9uRGF0YSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwb3N0TmV3UmVhY3Rpb24ocmVhY3Rpb25EYXRhKSB7XG4gICAgICAgIHZhciByZWFjdGlvblByb3ZpZGVyID0gY3JlYXRlUmVhY3Rpb25Qcm92aWRlcigpO1xuICAgICAgICBzaG93Q29uZmlybWF0aW9uKHJlYWN0aW9uRGF0YSwgcmVhY3Rpb25Qcm92aWRlcik7XG4gICAgICAgIEFqYXhDbGllbnQucG9zdE5ld1JlYWN0aW9uKHJlYWN0aW9uRGF0YSwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGNvbnRlbnREYXRhLCBzdWNjZXNzLCBlcnJvcik7XG5cbiAgICAgICAgZnVuY3Rpb24gc3VjY2VzcyhyZWFjdGlvbikge1xuICAgICAgICAgICAgcmVhY3Rpb24gPSBQYWdlRGF0YS5yZWdpc3RlclJlYWN0aW9uKHJlYWN0aW9uLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSk7XG4gICAgICAgICAgICByZWFjdGlvblByb3ZpZGVyLnJlYWN0aW9uTG9hZGVkKHJlYWN0aW9uKTtcbiAgICAgICAgICAgIEV2ZW50cy5wb3N0UmVhY3Rpb25DcmVhdGVkKHBhZ2VEYXRhLCBjb250YWluZXJEYXRhLCByZWFjdGlvbiwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBlcnJvcihtZXNzYWdlKSB7XG4gICAgICAgICAgICAvLyBUT0RPIGhhbmRsZSBhbnkgZXJyb3JzIHRoYXQgb2NjdXIgcG9zdGluZyBhIHJlYWN0aW9uXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcImVycm9yIHBvc3RpbmcgbmV3IHJlYWN0aW9uOiBcIiArIG1lc3NhZ2UpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24ga2V5Ym9hcmRJbnB1dChyYWN0aXZlRXZlbnQpIHtcbiAgICAgICAgaWYgKCQocm9vdEVsZW1lbnQocmFjdGl2ZSkpLmhhc0NsYXNzKCdhbnRlbm5hLXBhZ2UtYWN0aXZlJykpIHsgLy8gb25seSBoYW5kbGUgaW5wdXQgd2hlbiB0aGlzIHBhZ2UgaXMgYWN0aXZlXG4gICAgICAgICAgICAkKHJvb3RFbGVtZW50KHJhY3RpdmUpKS5maW5kKCcuYW50ZW5uYS1kZWZhdWx0cy1mb290ZXIgaW5wdXQnKS5mb2N1cygpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiByb290RWxlbWVudChyYWN0aXZlKSB7XG4gICAgcmV0dXJuIHJhY3RpdmUuZmluZChwYWdlU2VsZWN0b3IpO1xufVxuXG5mdW5jdGlvbiBhcnJheUFjY2Vzc29yKGFycmF5KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKGluZGV4KSB7XG4gICAgICAgIHJldHVybiBhcnJheVtpbmRleF07XG4gICAgfVxufVxuXG5mdW5jdGlvbiBjdXN0b21SZWFjdGlvbkZvY3VzKHJhY3RpdmVFdmVudCkge1xuICAgIHZhciAkZm9vdGVyID0gJChyYWN0aXZlRXZlbnQub3JpZ2luYWwudGFyZ2V0KS5jbG9zZXN0KCcuYW50ZW5uYS1kZWZhdWx0cy1mb290ZXInKTtcbiAgICAkZm9vdGVyLmZpbmQoJ2lucHV0Jykubm90KCcuYWN0aXZlJykudmFsKCcnKS5hZGRDbGFzcygnYWN0aXZlJyk7XG4gICAgJGZvb3Rlci5maW5kKCdidXR0b24nKS5zaG93KCk7XG59XG5cbmZ1bmN0aW9uIGN1c3RvbVJlYWN0aW9uQmx1cihyYWN0aXZlRXZlbnQpIHtcbiAgICB2YXIgZXZlbnQgPSByYWN0aXZlRXZlbnQub3JpZ2luYWw7XG4gICAgaWYgKCQoZXZlbnQucmVsYXRlZFRhcmdldCkuY2xvc2VzdCgnLmFudGVubmEtZGVmYXVsdHMtZm9vdGVyIGJ1dHRvbicpLnNpemUoKSA9PSAwKSB7IC8vIERvbid0IGhpZGUgdGhlIGlucHV0IHdoZW4gd2UgY2xpY2sgb24gdGhlIGJ1dHRvblxuICAgICAgICB2YXIgJGZvb3RlciA9ICQoZXZlbnQudGFyZ2V0KS5jbG9zZXN0KCcuYW50ZW5uYS1kZWZhdWx0cy1mb290ZXInKTtcbiAgICAgICAgdmFyIGlucHV0ID0gJGZvb3Rlci5maW5kKCdpbnB1dCcpO1xuICAgICAgICBpZiAoaW5wdXQudmFsKCkgPT09ICcnKSB7XG4gICAgICAgICAgICAkZm9vdGVyLmZpbmQoJ2J1dHRvbicpLmhpZGUoKTtcbiAgICAgICAgICAgIHZhciAkaW5wdXQgPSAkZm9vdGVyLmZpbmQoJ2lucHV0Jyk7XG4gICAgICAgICAgICAvLyBSZXNldCB0aGUgaW5wdXQgdmFsdWUgdG8gdGhlIGRlZmF1bHQgaW4gdGhlIGh0bWwvdGVtcGxhdGVcbiAgICAgICAgICAgICRpbnB1dC52YWwoJGlucHV0LmF0dHIoJ3ZhbHVlJykpLnJlbW92ZUNsYXNzKCdhY3RpdmUnKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gY3JlYXRlUmVhY3Rpb25Qcm92aWRlcigpIHtcblxuICAgIHZhciBsb2FkZWRSZWFjdGlvbjtcbiAgICB2YXIgY2FsbGJhY2tzID0gW107XG5cbiAgICBmdW5jdGlvbiBvblJlYWN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgIGNhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKTtcbiAgICAgICAgbm90aWZ5SWZSZWFkeSgpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJlYWN0aW9uTG9hZGVkKHJlYWN0aW9uKSB7XG4gICAgICAgIGxvYWRlZFJlYWN0aW9uID0gcmVhY3Rpb247XG4gICAgICAgIG5vdGlmeUlmUmVhZHkoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBub3RpZnlJZlJlYWR5KCkge1xuICAgICAgICBpZiAobG9hZGVkUmVhY3Rpb24pIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2FsbGJhY2tzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2tzW2ldKGxvYWRlZFJlYWN0aW9uKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhbGxiYWNrcyA9IFtdO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgZ2V0OiBvblJlYWN0aW9uLCAvLyBUT0RPIHRlcm1pbm9sb2d5XG4gICAgICAgIHJlYWN0aW9uTG9hZGVkOiByZWFjdGlvbkxvYWRlZFxuICAgIH1cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZTogY3JlYXRlUGFnZVxufTsiLCJ2YXIgQWpheENsaWVudCA9IHJlcXVpcmUoJy4vdXRpbHMvYWpheC1jbGllbnQnKTtcbnZhciBYRE1DbGllbnQgPSByZXF1aXJlKCcuL3V0aWxzL3hkbS1jbGllbnQnKTtcblxudmFyIGlzVG91Y2hCcm93c2VyID0gKG5hdmlnYXRvci5tc01heFRvdWNoUG9pbnRzIHx8IFwib250b3VjaHN0YXJ0XCIgaW4gd2luZG93KSAmJiAoKHdpbmRvdy5tYXRjaE1lZGlhKFwib25seSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KVwiKSkubWF0Y2hlcyk7XG5cbmZ1bmN0aW9uIHBvc3RHcm91cFNldHRpbmdzTG9hZGVkKGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgZXZlbnQgPSBjcmVhdGVFdmVudChldmVudFR5cGVzLnNjcmlwdExvYWQsICcnLCBncm91cFNldHRpbmdzKTtcbiAgICBldmVudFthdHRyaWJ1dGVzLnBhZ2VJZF0gPSAnbmEnO1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMuYXJ0aWNsZUhlaWdodF0gPSAnbmEnO1xuICAgIHBvc3RFdmVudChldmVudCk7XG59XG5cbmZ1bmN0aW9uIHBvc3RQYWdlRGF0YUxvYWRlZChwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBldmVudCA9IGNyZWF0ZUV2ZW50KGV2ZW50VHlwZXMucGFnZURhdGFMb2FkZWQsICcnLCBncm91cFNldHRpbmdzKTtcbiAgICBhcHBlbmRQYWdlRGF0YVBhcmFtcyhldmVudCwgcGFnZURhdGEpO1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMuY29udGVudEF0dHJpYnV0ZXNdID0gcGFnZURhdGEubWV0cmljcy5pc011bHRpUGFnZSA/IGV2ZW50VmFsdWVzLm11bHRpcGxlUGFnZXMgOiBldmVudFZhbHVlcy5zaW5nbGVQYWdlO1xuICAgIHBvc3RFdmVudChldmVudCk7XG59XG5cbmZ1bmN0aW9uIHBvc3RSZWFjdGlvbldpZGdldE9wZW5lZChpc1Nob3dSZWFjdGlvbnMsIHBhZ2VEYXRhLCBjb250YWluZXJEYXRhLCBjb250ZW50RGF0YSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBldmVudFZhbHVlID0gaXNTaG93UmVhY3Rpb25zID8gZXZlbnRWYWx1ZXMuc2hvd1JlYWN0aW9ucyA6IGV2ZW50VmFsdWVzLnNob3dEZWZhdWx0cztcbiAgICB2YXIgZXZlbnQgPSBjcmVhdGVFdmVudChldmVudFR5cGVzLnJlYWN0aW9uV2lkZ2V0T3BlbmVkLCBldmVudFZhbHVlLCBncm91cFNldHRpbmdzKTtcbiAgICBhcHBlbmRQYWdlRGF0YVBhcmFtcyhldmVudCwgcGFnZURhdGEpO1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMuY29udGFpbmVySGFzaF0gPSBjb250YWluZXJEYXRhLmhhc2g7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5jb250YWluZXJLaW5kXSA9IGNvbnRlbnREYXRhLnR5cGU7XG4gICAgcG9zdEV2ZW50KGV2ZW50KTtcbn1cblxuZnVuY3Rpb24gcG9zdFN1bW1hcnlPcGVuZWQoaXNTaG93UmVhY3Rpb25zLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBldmVudFZhbHVlID0gaXNTaG93UmVhY3Rpb25zID8gZXZlbnRWYWx1ZXMudmlld1JlYWN0aW9ucyA6IGV2ZW50VmFsdWVzLnZpZXdEZWZhdWx0cztcbiAgICB2YXIgZXZlbnQgPSBjcmVhdGVFdmVudChldmVudFR5cGVzLnN1bW1hcnlXaWRnZXQsIGV2ZW50VmFsdWUsIGdyb3VwU2V0dGluZ3MpO1xuICAgIGFwcGVuZFBhZ2VEYXRhUGFyYW1zKGV2ZW50LCBwYWdlRGF0YSk7XG4gICAgcG9zdEV2ZW50KGV2ZW50KTtcbn1cblxuZnVuY3Rpb24gcG9zdFJlYWN0aW9uQ3JlYXRlZChwYWdlRGF0YSwgY29udGFpbmVyRGF0YSwgcmVhY3Rpb25EYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGV2ZW50ID0gY3JlYXRlRXZlbnQoZXZlbnRUeXBlcy5yZWFjdGlvbkNyZWF0ZWQsIHJlYWN0aW9uRGF0YS50ZXh0LCBncm91cFNldHRpbmdzKTtcbiAgICBhcHBlbmRQYWdlRGF0YVBhcmFtcyhldmVudCwgcGFnZURhdGEpO1xuICAgIGFwcGVuZENvbnRhaW5lckRhdGFQYXJhbXMoZXZlbnQsIGNvbnRhaW5lckRhdGEpO1xuICAgIGFwcGVuZFJlYWN0aW9uRGF0YVBhcmFtcyhldmVudCwgcmVhY3Rpb25EYXRhKTtcbiAgICBwb3N0RXZlbnQoZXZlbnQpO1xufVxuXG4vLyBUT0RPOiBIb29rIHRoaXMgdXAgb25jZSByZWFjdGlvbiBzaGFyaW5nIGlzIGluIHBsYWNlLlxuLy8gVE9ETzogQ29uZmlybSB3aXRoIFBvcnRlciB0aGF0IHRoZSBvdGhlciBwbGFjZSB0aGUgJ3NoJyBldmVudCBpcyBmaXJlZCwgX21ha2VTaGFyZUljb25zLCBpcyBkZWFkIGNvZGVcbmZ1bmN0aW9uIHBvc3RSZWFjdGlvblNoYXJlZChwYWdlRGF0YSwgY29udGFpbmVyRGF0YSwgcmVhY3Rpb25EYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGV2ZW50VmFsdWUgPSAnJzsgLy8gVE9ETzogJ2ZhY2Vib29rJywgJ3R3aXR0ZXInLCBldGNcbiAgICB2YXIgZXZlbnQgPSBjcmVhdGVFdmVudChldmVudFR5cGVzLnJlYWN0aW9uU2hhcmVkLCBldmVudFZhbHVlLCBncm91cFNldHRpbmdzKTtcbiAgICBhcHBlbmRQYWdlRGF0YVBhcmFtcyhldmVudCwgcGFnZURhdGEpO1xuICAgIGFwcGVuZENvbnRhaW5lckRhdGFQYXJhbXMoZXZlbnQsIGNvbnRhaW5lckRhdGEpO1xuICAgIGFwcGVuZFJlYWN0aW9uRGF0YVBhcmFtcyhldmVudCwgcmVhY3Rpb25EYXRhKTtcbiAgICBwb3N0RXZlbnQoZXZlbnQpO1xufVxuXG5mdW5jdGlvbiBwb3N0TG9jYXRpb25zVmlld2VkKHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGV2ZW50ID0gY3JlYXRlRXZlbnQoZXZlbnRUeXBlcy5zdW1tYXJ5V2lkZ2V0LCBldmVudFZhbHVlcy5sb2NhdGlvbnNWaWV3ZWQsIGdyb3VwU2V0dGluZ3MpO1xuICAgIGFwcGVuZFBhZ2VEYXRhUGFyYW1zKGV2ZW50LCBwYWdlRGF0YSk7XG4gICAgcG9zdEV2ZW50KGV2ZW50KTtcbn1cblxuZnVuY3Rpb24gcG9zdENvbnRlbnRWaWV3ZWQocGFnZURhdGEsIGNvbnRhaW5lckRhdGEsIGxvY2F0aW9uRGF0YSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBldmVudCA9IGNyZWF0ZUV2ZW50KGV2ZW50VHlwZXMuc3VtbWFyeVdpZGdldCwgZXZlbnRWYWx1ZXMuY29udGVudFZpZXdlZCwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgYXBwZW5kUGFnZURhdGFQYXJhbXMoZXZlbnQsIHBhZ2VEYXRhKTtcbiAgICBhcHBlbmRDb250YWluZXJEYXRhUGFyYW1zKGV2ZW50LCBjb250YWluZXJEYXRhKTtcbiAgICBldmVudFthdHRyaWJ1dGVzLmNvbnRlbnRJZF0gPSBsb2NhdGlvbkRhdGEuY29udGVudElkO1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMuY29udGVudExvY2F0aW9uXSA9IGxvY2F0aW9uRGF0YS5sb2NhdGlvbjtcbiAgICBwb3N0RXZlbnQoZXZlbnQpO1xufVxuXG5mdW5jdGlvbiBwb3N0Q29tbWVudHNWaWV3ZWQocGFnZURhdGEsIGNvbnRhaW5lckRhdGEsIHJlYWN0aW9uRGF0YSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBldmVudCA9IGNyZWF0ZUV2ZW50KGV2ZW50VHlwZXMuY29tbWVudHNWaWV3ZWQsICcnLCBncm91cFNldHRpbmdzKTtcbiAgICBhcHBlbmRQYWdlRGF0YVBhcmFtcyhldmVudCwgcGFnZURhdGEpO1xuICAgIGFwcGVuZENvbnRhaW5lckRhdGFQYXJhbXMoZXZlbnQsIGNvbnRhaW5lckRhdGEpO1xuICAgIGFwcGVuZFJlYWN0aW9uRGF0YVBhcmFtcyhldmVudCwgcmVhY3Rpb25EYXRhKTtcbiAgICBwb3N0RXZlbnQoZXZlbnQpO1xufVxuXG5mdW5jdGlvbiBwb3N0Q29tbWVudENyZWF0ZWQocGFnZURhdGEsIGNvbnRhaW5lckRhdGEsIHJlYWN0aW9uRGF0YSwgY29tbWVudCwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBldmVudCA9IGNyZWF0ZUV2ZW50KGV2ZW50VHlwZXMuY29tbWVudENyZWF0ZWQsIGNvbW1lbnQsIGdyb3VwU2V0dGluZ3MpO1xuICAgIGFwcGVuZFBhZ2VEYXRhUGFyYW1zKGV2ZW50LCBwYWdlRGF0YSk7XG4gICAgYXBwZW5kQ29udGFpbmVyRGF0YVBhcmFtcyhldmVudCwgY29udGFpbmVyRGF0YSk7XG4gICAgYXBwZW5kUmVhY3Rpb25EYXRhUGFyYW1zKGV2ZW50LCByZWFjdGlvbkRhdGEpO1xuICAgIHBvc3RFdmVudChldmVudCk7XG59XG5cbmZ1bmN0aW9uIHBvc3RSZWNpcmNDbGlja2VkKHBhZ2VEYXRhLCByZWFjdGlvbklkLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGV2ZW50ID0gY3JlYXRlRXZlbnQoZXZlbnRUeXBlcy5yZWNpcmNDbGlja2VkLCByZWFjdGlvbklkLCBncm91cFNldHRpbmdzKTtcbiAgICBhcHBlbmRQYWdlRGF0YVBhcmFtcyhldmVudCwgcGFnZURhdGEpO1xuICAgIHBvc3RFdmVudChldmVudCk7XG59XG5cbmZ1bmN0aW9uIGFwcGVuZFBhZ2VEYXRhUGFyYW1zKGV2ZW50LCBwYWdlRGF0YSkge1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMucGFnZUlkXSA9IHBhZ2VEYXRhLnBhZ2VJZDtcbiAgICBldmVudFthdHRyaWJ1dGVzLnBhZ2VUaXRsZV0gPSBwYWdlRGF0YS50aXRsZTtcbiAgICBldmVudFthdHRyaWJ1dGVzLmNhbm9uaWNhbFVybF0gPSBwYWdlRGF0YS5jYW5vbmljYWxVcmw7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5wYWdlVXJsXSA9IHBhZ2VEYXRhLnJlcXVlc3RlZFVybDtcbiAgICBldmVudFthdHRyaWJ1dGVzLmFydGljbGVIZWlnaHRdID0gMCB8fCBwYWdlRGF0YS5tZXRyaWNzLmhlaWdodDtcbiAgICBldmVudFthdHRyaWJ1dGVzLnBhZ2VUb3BpY3NdID0gcGFnZURhdGEudG9waWNzO1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMuYXV0aG9yXSA9IHBhZ2VEYXRhLmF1dGhvcjtcbiAgICBldmVudFthdHRyaWJ1dGVzLnNpdGVTZWN0aW9uXSA9IHBhZ2VEYXRhLnNlY3Rpb247XG59XG5cbmZ1bmN0aW9uIGFwcGVuZENvbnRhaW5lckRhdGFQYXJhbXMoZXZlbnQsIGNvbnRhaW5lckRhdGEpIHtcbiAgICBldmVudFthdHRyaWJ1dGVzLmNvbnRhaW5lckhhc2hdID0gY29udGFpbmVyRGF0YS5oYXNoO1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMuY29udGFpbmVyS2luZF0gPSBjb250YWluZXJEYXRhLnR5cGU7XG59XG5cbmZ1bmN0aW9uIGFwcGVuZFJlYWN0aW9uRGF0YVBhcmFtcyhldmVudCwgcmVhY3Rpb25EYXRhKSB7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5yZWFjdGlvbkJvZHldID0gcmVhY3Rpb25EYXRhLnRleHQ7XG4gICAgaWYgKHJlYWN0aW9uRGF0YS5jb250ZW50KSB7XG4gICAgICAgIGV2ZW50W2F0dHJpYnV0ZXMuY29udGVudExvY2F0aW9uXSA9IHJlYWN0aW9uRGF0YS5jb250ZW50LmxvY2F0aW9uO1xuICAgICAgICBldmVudFthdHRyaWJ1dGVzLmNvbnRlbnRJZF0gPSByZWFjdGlvbkRhdGEuY29udGVudC5pZDtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUV2ZW50KGV2ZW50VHlwZSwgZXZlbnRWYWx1ZSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciByZWZlcnJlckRvbWFpbiA9IGRvY3VtZW50LnJlZmVycmVyLnNwbGl0KCcvJykuc3BsaWNlKDIpLmpvaW4oJy8nKTsgLy8gVE9ETzogZW5nYWdlX2Z1bGwgY29kZS4gUmV2aWV3XG5cbiAgICB2YXIgZXZlbnQgPSB7fTtcbiAgICBldmVudFthdHRyaWJ1dGVzLmV2ZW50VHlwZV0gPSBldmVudFR5cGU7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5ldmVudFZhbHVlXSA9IGV2ZW50VmFsdWU7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5ncm91cElkXSA9IGdyb3VwU2V0dGluZ3MuZ3JvdXBJZCgpO1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMuc2hvcnRUZXJtU2Vzc2lvbl0gPSBnZXRTaG9ydFRlcm1TZXNzaW9uSWQoKTtcbiAgICBldmVudFthdHRyaWJ1dGVzLmxvbmdUZXJtU2Vzc2lvbl0gPSBnZXRMb25nVGVybVNlc3Npb25JZCgpO1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMucmVmZXJyZXJVcmxdID0gcmVmZXJyZXJEb21haW47XG4gICAgZXZlbnRbYXR0cmlidXRlcy5pc1RvdWNoQnJvd3Nlcl0gPSBpc1RvdWNoQnJvd3NlcjtcbiAgICBldmVudFthdHRyaWJ1dGVzLnNjcmVlbldpZHRoXSA9IHNjcmVlbi53aWR0aDtcbiAgICBldmVudFthdHRyaWJ1dGVzLnNjcmVlbkhlaWdodF0gPSBzY3JlZW4uaGVpZ2h0O1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMucGl4ZWxEZW5zaXR5XSA9IHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvIHx8IE1hdGgucm91bmQod2luZG93LnNjcmVlbi5hdmFpbFdpZHRoIC8gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudFdpZHRoKTsgLy8gVE9ETzogcmV2aWV3IHRoaXMgZW5nYWdlX2Z1bGwgY29kZSwgd2hpY2ggZG9lc24ndCBzZWVtIGNvcnJlY3RcbiAgICBldmVudFthdHRyaWJ1dGVzLnVzZXJBZ2VudF0gPSBuYXZpZ2F0b3IudXNlckFnZW50O1xuICAgIHJldHVybiBldmVudDtcbn1cblxuZnVuY3Rpb24gcG9zdEV2ZW50KGV2ZW50KSB7XG4gICAgWERNQ2xpZW50LmdldFVzZXIoZnVuY3Rpb24odXNlckluZm8pIHtcbiAgICAgICAgZXZlbnRbYXR0cmlidXRlcy51c2VySWRdID0gdXNlckluZm8udXNlcl9pZDtcbiAgICAgICAgZmlsbEluTWlzc2luZ1Byb3BlcnRpZXMoZXZlbnQpO1xuICAgICAgICAvLyBTZW5kIHRoZSBldmVudCB0byBCaWdRdWVyeVxuICAgICAgICBBamF4Q2xpZW50LnBvc3RFdmVudChldmVudCk7XG4gICAgfSk7XG59XG5cbi8vIEZpbGwgaW4gYW55IG9wdGlvbmFsIHByb3BlcnRpZXMgd2l0aCBudWxsIHZhbHVlcy5cbmZ1bmN0aW9uIGZpbGxJbk1pc3NpbmdQcm9wZXJ0aWVzKGV2ZW50KSB7XG4gICAgZm9yICh2YXIgYXR0ciBpbiBhdHRyaWJ1dGVzKSB7XG4gICAgICAgIGlmIChldmVudFthdHRyaWJ1dGVzW2F0dHJdXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBldmVudFthdHRyaWJ1dGVzW2F0dHJdXSA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGdldExvbmdUZXJtU2Vzc2lvbklkKCkge1xuICAgIHZhciBndWlkID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ2FudF9sdHMnKTtcbiAgICBpZiAoIWd1aWQpIHtcbiAgICAgICAgZ3VpZCA9IGNyZWF0ZUd1aWQoKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdhbnRfbHRzJywgZ3VpZCk7XG4gICAgICAgIH0gY2F0Y2goZXJyb3IpIHtcbiAgICAgICAgICAgIC8vIFNvbWUgYnJvd3NlcnMgKG1vYmlsZSBTYWZhcmkpIHRocm93IGFuIGV4Y2VwdGlvbiB3aGVuIGluIHByaXZhdGUgYnJvd3NpbmcgbW9kZS5cbiAgICAgICAgICAgIC8vIE5vdGhpbmcgd2UgY2FuIGRvIGFib3V0IGl0LiBKdXN0IGZhbGwgdGhyb3VnaCBhbmQgcmV0dXJuIHRoZSB2YWx1ZSB3ZSBnZW5lcmF0ZWQuXG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGd1aWQ7XG59XG5cbmZ1bmN0aW9uIGdldFNob3J0VGVybVNlc3Npb25JZCgpIHtcbiAgICB2YXIgc2Vzc2lvbjtcbiAgICB2YXIganNvbiA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdhbnRfc3RzJyk7XG4gICAgaWYgKGpzb24pIHtcbiAgICAgICAgc2Vzc2lvbiA9IEpTT04ucGFyc2UoanNvbik7XG4gICAgICAgIGlmIChEYXRlLm5vdygpID4gc2Vzc2lvbi5leHBpcmVzKSB7XG4gICAgICAgICAgICBzZXNzaW9uID0gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAoIXNlc3Npb24pIHtcbiAgICAgICAgdmFyIG1pbnV0ZXMgPSAxNTtcbiAgICAgICAgc2Vzc2lvbiA9IHtcbiAgICAgICAgICAgIGd1aWQ6IGNyZWF0ZUd1aWQoKSxcbiAgICAgICAgICAgIGV4cGlyZXM6IERhdGUubm93KCkgKyBtaW51dGVzICogNjAwMDBcbiAgICAgICAgfTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2FudF9zdHMnLCBKU09OLnN0cmluZ2lmeShzZXNzaW9uKSk7XG4gICAgfSBjYXRjaChlcnJvcikge1xuICAgICAgICAvLyBTb21lIGJyb3dzZXJzIChtb2JpbGUgU2FmYXJpKSB0aHJvdyBhbiBleGNlcHRpb24gd2hlbiBpbiBwcml2YXRlIGJyb3dzaW5nIG1vZGUuXG4gICAgICAgIC8vIE5vdGhpbmcgd2UgY2FuIGRvIGFib3V0IGl0LiBKdXN0IGZhbGwgdGhyb3VnaCBhbmQgcmV0dXJuIHRoZSB2YWx1ZSB3ZSBnZW5lcmF0ZWQuXG4gICAgfVxuICAgIHJldHVybiBzZXNzaW9uLmd1aWQ7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUd1aWQoKSB7XG4gICAgLy8gQ29kZSBjb3BpZWQgZnJvbSBlbmdhZ2VfZnVsbCAob3JpZ2luYWxseSwgaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xMDUwMzQvY3JlYXRlLWd1aWQtdXVpZC1pbi1qYXZhc2NyaXB0KVxuICAgIHJldHVybiAneHh4eHh4eHgteHh4eC00eHh4LXl4eHgteHh4eHh4eHh4eHh4Jy5yZXBsYWNlKC9beHldL2csIGZ1bmN0aW9uIChjKSB7XG4gICAgICAgIHZhciByID0gTWF0aC5yYW5kb20oKSAqIDE2IHwgMCwgdiA9IGMgPT0gJ3gnID8gciA6IChyICYgMHgzIHwgMHg4KTtcbiAgICAgICAgcmV0dXJuIHYudG9TdHJpbmcoMTYpO1xuICAgIH0pO1xufVxuXG52YXIgYXR0cmlidXRlcyA9IHtcbiAgICBldmVudFR5cGU6ICdldCcsXG4gICAgZXZlbnRWYWx1ZTogJ2V2JyxcbiAgICBncm91cElkOiAnZ2lkJyxcbiAgICB1c2VySWQ6ICd1aWQnLFxuICAgIHBhZ2VJZDogJ3BpZCcsXG4gICAgbG9uZ1Rlcm1TZXNzaW9uOiAnbHRzJyxcbiAgICBzaG9ydFRlcm1TZXNzaW9uOiAnc3RzJyxcbiAgICByZWZlcnJlclVybDogJ3JlZicsXG4gICAgY29udGVudElkOiAnY2lkJyxcbiAgICBhcnRpY2xlSGVpZ2h0OiAnYWgnLFxuICAgIGNvbnRhaW5lckhhc2g6ICdjaCcsXG4gICAgY29udGFpbmVyS2luZDogJ2NrJyxcbiAgICByZWFjdGlvbkJvZHk6ICdyJyxcbiAgICBwYWdlVGl0bGU6ICdwdCcsXG4gICAgY2Fub25pY2FsVXJsOiAnY3UnLFxuICAgIHBhZ2VVcmw6ICdwdScsXG4gICAgY29udGVudEF0dHJpYnV0ZXM6ICdjYScsXG4gICAgY29udGVudExvY2F0aW9uOiAnY2wnLFxuICAgIHBhZ2VUb3BpY3M6ICdwdG9wJyxcbiAgICBhdXRob3I6ICdhJyxcbiAgICBzaXRlU2VjdGlvbjogJ3NlYycsXG4gICAgaXNUb3VjaEJyb3dzZXI6ICdpdCcsXG4gICAgc2NyZWVuV2lkdGg6ICdzdycsXG4gICAgc2NyZWVuSGVpZ2h0OiAnc2gnLFxuICAgIHBpeGVsRGVuc2l0eTogJ3BkJyxcbiAgICB1c2VyQWdlbnQ6ICd1YSdcbn07XG5cbnZhciBldmVudFR5cGVzID0ge1xuICAgIHNjcmlwdExvYWQ6ICdzbCcsXG4gICAgcmVhY3Rpb25TaGFyZWQ6ICdzaCcsXG4gICAgc3VtbWFyeVdpZGdldDogJ3NiJyxcbiAgICByZWFjdGlvbldpZGdldE9wZW5lZDogJ3JzJyxcbiAgICBwYWdlRGF0YUxvYWRlZDogJ3dsJyxcbiAgICBjb21tZW50Q3JlYXRlZDogJ2MnLFxuICAgIHJlYWN0aW9uQ3JlYXRlZDogJ3JlJyxcbiAgICBjb21tZW50c1ZpZXdlZDogJ3Zjb20nLFxuICAgIHJlY2lyY0NsaWNrZWQ6ICdyYydcbn07XG5cbnZhciBldmVudFZhbHVlcyA9IHtcbiAgICBjb250ZW50Vmlld2VkOiAndmMnLCAvLyB2aWV3X2NvbnRlbnRcbiAgICBsb2NhdGlvbnNWaWV3ZWQ6ICd2cicsIC8vIHZpZXdfcmVhY3Rpb25zXG4gICAgc2hvd0RlZmF1bHRzOiAnd3InLFxuICAgIHNob3dSZWFjdGlvbnM6ICdyZCcsXG4gICAgc2luZ2xlUGFnZTogJ3NpJyxcbiAgICBtdWx0aXBsZVBhZ2VzOiAnbXUnLFxuICAgIHZpZXdSZWFjdGlvbnM6ICd2dycsXG4gICAgdmlld0RlZmF1bHRzOiAnYWQnXG59O1xuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgcG9zdEdyb3VwU2V0dGluZ3NMb2FkZWQ6IHBvc3RHcm91cFNldHRpbmdzTG9hZGVkLFxuICAgIHBvc3RQYWdlRGF0YUxvYWRlZDogcG9zdFBhZ2VEYXRhTG9hZGVkLFxuICAgIHBvc3RTdW1tYXJ5T3BlbmVkOiBwb3N0U3VtbWFyeU9wZW5lZCxcbiAgICBwb3N0Q29tbWVudHNWaWV3ZWQ6IHBvc3RDb21tZW50c1ZpZXdlZCxcbiAgICBwb3N0Q29tbWVudENyZWF0ZWQ6IHBvc3RDb21tZW50Q3JlYXRlZCxcbiAgICBwb3N0UmVhY3Rpb25XaWRnZXRPcGVuZWQ6IHBvc3RSZWFjdGlvbldpZGdldE9wZW5lZCxcbiAgICBwb3N0UmVhY3Rpb25DcmVhdGVkOiBwb3N0UmVhY3Rpb25DcmVhdGVkLFxuICAgIHBvc3RSZWFjdGlvblNoYXJlZDogcG9zdFJlYWN0aW9uU2hhcmVkLFxuICAgIHBvc3RMb2NhdGlvbnNWaWV3ZWQ6IHBvc3RMb2NhdGlvbnNWaWV3ZWQsXG4gICAgcG9zdENvbnRlbnRWaWV3ZWQ6IHBvc3RDb250ZW50Vmlld2VkLFxuICAgIHBvc3RSZWNpcmNDbGlja2VkOiBwb3N0UmVjaXJjQ2xpY2tlZFxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi91dGlscy9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciBBamF4Q2xpZW50ID0gcmVxdWlyZSgnLi91dGlscy9hamF4LWNsaWVudCcpO1xudmFyIFVSTHMgPSByZXF1aXJlKCcuL3V0aWxzL3VybHMnKTtcbnZhciBHcm91cFNldHRpbmdzID0gcmVxdWlyZSgnLi9ncm91cC1zZXR0aW5ncycpO1xuXG4vLyBUT0RPIGZvbGQgdGhpcyBtb2R1bGUgaW50byBncm91cC1zZXR0aW5ncz9cblxuZnVuY3Rpb24gbG9hZFNldHRpbmdzKGNhbGxiYWNrKSB7XG4gICAgQWpheENsaWVudC5nZXRKU09OUChVUkxzLmdyb3VwU2V0dGluZ3NVcmwoKSwgeyBob3N0X25hbWU6IHdpbmRvdy5hbnRlbm5hX2hvc3QgfSwgc3VjY2VzcywgZXJyb3IpO1xuXG4gICAgZnVuY3Rpb24gc3VjY2Vzcyhqc29uKSB7XG4gICAgICAgIHZhciBncm91cFNldHRpbmdzID0gR3JvdXBTZXR0aW5ncy5jcmVhdGUoanNvbik7XG4gICAgICAgIGNhbGxiYWNrKGdyb3VwU2V0dGluZ3MpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGVycm9yKG1lc3NhZ2UpIHtcbiAgICAgICAgLy8gVE9ETyBoYW5kbGUgZXJyb3JzIHRoYXQgaGFwcGVuIHdoZW4gbG9hZGluZyBjb25maWcgZGF0YVxuICAgICAgICBjb25zb2xlLmxvZygnQW4gZXJyb3Igb2NjdXJyZWQgbG9hZGluZyBncm91cCBzZXR0aW5nczogJyArIG1lc3NhZ2UpO1xuICAgIH1cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGxvYWQ6IGxvYWRTZXR0aW5nc1xufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi91dGlscy9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcblxudmFyIEV2ZW50cyA9IHJlcXVpcmUoJy4vZXZlbnRzJyk7XG5cbnZhciBncm91cFNldHRpbmdzO1xuXG4vLyBUT0RPOiBVcGRhdGUgYWxsIGNsaWVudHMgdGhhdCBhcmUgcGFzc2luZyBhcm91bmQgYSBncm91cFNldHRpbmdzIG9iamVjdCB0byBpbnN0ZWFkIGFjY2VzcyB0aGUgJ2dsb2JhbCcgc2V0dGluZ3MgaW5zdGFuY2VcbmZ1bmN0aW9uIGdldEdyb3VwU2V0dGluZ3MoKSB7XG4gICAgcmV0dXJuIGdyb3VwU2V0dGluZ3M7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZUZyb21KU09OKGpzb24pIHtcbiAgICBncm91cFNldHRpbmdzID0gY3JlYXRlRnJvbUpTT04oanNvbik7XG4gICAgRXZlbnRzLnBvc3RHcm91cFNldHRpbmdzTG9hZGVkKGdyb3VwU2V0dGluZ3MpO1xuICAgIHJldHVybiBncm91cFNldHRpbmdzO1xufVxuXG5cbi8vIFRPRE86IHRyaW0gdHJhaWxpbmcgY29tbWFzIGZyb20gYW55IHNlbGVjdG9yIHZhbHVlc1xuXG4vLyBUT0RPOiBSZXZpZXcuIFRoZXNlIGFyZSBqdXN0IGNvcGllZCBmcm9tIGVuZ2FnZV9mdWxsLlxudmFyIGRlZmF1bHRzID0ge1xuICAgIHByZW1pdW06IGZhbHNlLFxuICAgIGltZ19zZWxlY3RvcjogXCJpbWdcIiwgLy8gVE9ETzogdGhpcyBpcyBzb21lIGJvZ3VzIG9ic29sZXRlIHByb3BlcnR5LiB3ZSBzaG91bGRuJ3QgdXNlIGl0LlxuICAgIGltZ19jb250YWluZXJfc2VsZWN0b3JzOlwiI3ByaW1hcnktcGhvdG9cIixcbiAgICBhY3RpdmVfc2VjdGlvbnM6IFwiYm9keVwiLFxuICAgIC8vYW5ub193aGl0ZWxpc3Q6IFwiYm9keSBwXCIsXG4gICAgYW5ub193aGl0ZWxpc3Q6IFwicFwiLCAvLyBUT0RPOiBUaGUgY3VycmVudCBkZWZhdWx0IGlzIFwiYm9keSBwXCIsIHdoaWNoIG1ha2VzIG5vIHNlbnNlIHdoZW4gd2UncmUgc2VhcmNoaW5nIG9ubHkgd2l0aGluIHRoZSBhY3RpdmUgc2VjdGlvbnNcbiAgICBhY3RpdmVfc2VjdGlvbnNfd2l0aF9hbm5vX3doaXRlbGlzdDpcIlwiLFxuICAgIG1lZGlhX3NlbGVjdG9yOiBcImVtYmVkLCB2aWRlbywgb2JqZWN0LCBpZnJhbWVcIixcbiAgICBjb21tZW50X2xlbmd0aDogNTAwLFxuICAgIG5vX2FudDogXCJcIixcbiAgICBpbWdfYmxhY2tsaXN0OiBcIlwiLFxuICAgIGN1c3RvbV9jc3M6IFwiXCIsXG4gICAgLy90b2RvOiB0ZW1wIGlubGluZV9pbmRpY2F0b3IgZGVmYXVsdHMgdG8gbWFrZSB0aGVtIHNob3cgdXAgb24gYWxsIG1lZGlhIC0gcmVtb3ZlIHRoaXMgbGF0ZXIuXG4gICAgaW5saW5lX3NlbGVjdG9yOiAnaW1nLCBlbWJlZCwgdmlkZW8sIG9iamVjdCwgaWZyYW1lJyxcbiAgICBwYXJhZ3JhcGhfaGVscGVyOiB0cnVlLFxuICAgIG1lZGlhX3VybF9pZ25vcmVfcXVlcnk6IHRydWUsXG4gICAgc3VtbWFyeV93aWRnZXRfc2VsZWN0b3I6ICcuYW50LXBhZ2Utc3VtbWFyeScsIC8vIFRPRE86IHRoaXMgd2Fzbid0IGRlZmluZWQgYXMgYSBkZWZhdWx0IGluIGVuZ2FnZV9mdWxsLCBidXQgd2FzIGluIGNvZGUuIHdoeT9cbiAgICBzdW1tYXJ5X3dpZGdldF9tZXRob2Q6ICdhZnRlcicsXG4gICAgbGFuZ3VhZ2U6ICdlbicsXG4gICAgYWJfdGVzdF9pbXBhY3Q6IHRydWUsXG4gICAgYWJfdGVzdF9zYW1wbGVfcGVyY2VudGFnZTogMTAsXG4gICAgaW1nX2luZGljYXRvcl9zaG93X29ubG9hZDogdHJ1ZSxcbiAgICBpbWdfaW5kaWNhdG9yX3Nob3dfc2lkZTogJ2xlZnQnLFxuICAgIHRhZ19ib3hfYmdfY29sb3JzOiAnJyxcbiAgICB0YWdfYm94X3RleHRfY29sb3JzOiAnJyxcbiAgICB0YWdfYm94X2ZvbnRfZmFtaWx5OiAnSGVsdmV0aWNhTmV1ZSxIZWx2ZXRpY2EsQXJpYWwsc2Fucy1zZXJpZicsXG4gICAgdGFnc19iZ19jc3M6ICcnLFxuICAgIGlnbm9yZV9zdWJkb21haW46IGZhbHNlLFxuICAgIGltYWdlX3NlbGVjdG9yOiAnbWV0YVtwcm9wZXJ0eT1cIm9nOmltYWdlXCJdJywgLy8gVE9ETzogcmV2aWV3IHdoYXQgdGhpcyBzaG91bGQgYmUgKG5vdCBmcm9tIGVuZ2FnZV9mdWxsKVxuICAgIGltYWdlX2F0dHJpYnV0ZTogJ2NvbnRlbnQnLCAvLyBUT0RPOiByZXZpZXcgd2hhdCB0aGlzIHNob3VsZCBiZSAobm90IGZyb20gZW5nYWdlX2Z1bGwpXG4gICAgLy90aGUgc2NvcGUgaW4gd2hpY2ggdG8gZmluZCBwYXJlbnRzIG9mIDxicj4gdGFncy5cbiAgICAvL1Rob3NlIHBhcmVudHMgd2lsbCBiZSBjb252ZXJ0ZWQgdG8gYSA8cnQ+IGJsb2NrLCBzbyB0aGVyZSB3b24ndCBiZSBuZXN0ZWQgPHA+IGJsb2Nrcy5cbiAgICAvL3RoZW4gaXQgd2lsbCBzcGxpdCB0aGUgcGFyZW50J3MgaHRtbCBvbiA8YnI+IHRhZ3MgYW5kIHdyYXAgdGhlIHNlY3Rpb25zIGluIDxwPiB0YWdzLlxuXG4gICAgLy9leGFtcGxlOlxuICAgIC8vIGJyX3JlcGxhY2Vfc2NvcGVfc2VsZWN0b3I6IFwiLmFudF9icl9yZXBsYWNlXCIgLy9lLmcuIFwiI21haW5zZWN0aW9uXCIgb3IgXCJwXCJcblxuICAgIGJyX3JlcGxhY2Vfc2NvcGVfc2VsZWN0b3I6IG51bGwgLy9lLmcuIFwiI21haW5zZWN0aW9uXCIgb3IgXCJwXCJcbn07XG5cbmZ1bmN0aW9uIGNyZWF0ZUZyb21KU09OKGpzb24pIHtcblxuICAgIGZ1bmN0aW9uIGRhdGEoa2V5LCBpZkFic2VudCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgdmFsdWUgPSB3aW5kb3cuYW50ZW5uYV9leHRlbmRba2V5XTtcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IGpzb25ba2V5XTtcbiAgICAgICAgICAgICAgICAvLyBUT0RPOiBvdXIgc2VydmVyIGFwcGFyZW50bHkgc2VuZHMgYmFjayBudWxsIGFzIGEgdmFsdWUgZm9yIHNvbWUgYXR0cmlidXRlcy5cbiAgICAgICAgICAgICAgICAvLyBUT0RPOiBjb25zaWRlciBjaGVja2luZyBmb3IgbnVsbCB3aGVyZXZlciB3ZSdyZSBjaGVja2luZyBmb3IgdW5kZWZpbmVkXG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09ICcnIHx8IHZhbHVlID09PSBudWxsKSB7IC8vIFRPRE86IFNob3VsZCB0aGUgc2VydmVyIGJlIHNlbmRpbmcgYmFjayAnJyBoZXJlIG9yIG5vdGhpbmcgYXQgYWxsPyAoSXQgcHJlY2x1ZGVzIHRoZSBzZXJ2ZXIgZnJvbSByZWFsbHkgc2F5aW5nICdub3RoaW5nJylcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBkZWZhdWx0c1trZXldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaWZBYnNlbnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYmFja2dyb3VuZENvbG9yKGFjY2Vzc29yKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBjb2xvcnMgPSBbXTtcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IGFjY2Vzc29yKCk7XG4gICAgICAgICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICBjb2xvcnMgPSB2YWx1ZS5zcGxpdCgnOycpO1xuICAgICAgICAgICAgICAgIGNvbG9ycyA9IG1pZ3JhdGVWYWx1ZXMoY29sb3JzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBjb2xvcnM7XG5cbiAgICAgICAgICAgIC8vIE1pZ3JhdGUgYW55IGNvbG9ycyBmcm9tIHRoZSAnMSwgMiwgMycgZm9ybWF0IHRvICdyZ2IoMSwgMiwgMyknLiBUaGlzIGNvZGUgY2FuIGJlIGRlbGV0ZWQgb25jZSB3ZSd2ZSB1cGRhdGVkXG4gICAgICAgICAgICAvLyBhbGwgc2l0ZXMgdG8gc3BlY2lmeWluZyB2YWxpZCBDU1MgY29sb3IgdmFsdWVzXG4gICAgICAgICAgICBmdW5jdGlvbiBtaWdyYXRlVmFsdWVzKGNvbG9yVmFsdWVzKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1pZ3JhdGlvbk1hdGNoZXIgPSAvXlxccypcXGQrXFxzKixcXHMqXFxkK1xccyosXFxzKlxcZCtcXHMqJC9naW07XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb2xvclZhbHVlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgdmFsdWUgPSBjb2xvclZhbHVlc1tpXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG1pZ3JhdGlvbk1hdGNoZXIudGVzdCh2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yVmFsdWVzW2ldID0gJ3JnYignICsgdmFsdWUgKyAnKSc7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbG9yVmFsdWVzO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZGVmYXVsdFJlYWN0aW9ucygkZWxlbWVudCkge1xuICAgICAgICAvLyBEZWZhdWx0IHJlYWN0aW9ucyBhcmUgYXZhaWxhYmxlIGluIHRocmVlIGxvY2F0aW9ucyBpbiB0aHJlZSBkYXRhIGZvcm1hdHM6XG4gICAgICAgIC8vIDEuIEFzIGEgY29tbWEtc2VwYXJhdGVkIGF0dHJpYnV0ZSB2YWx1ZSBvbiBhIHBhcnRpY3VsYXIgZWxlbWVudFxuICAgICAgICAvLyAyLiBBcyBhbiBhcnJheSBvZiBzdHJpbmdzIG9uIHRoZSB3aW5kb3cuYW50ZW5uYV9leHRlbmQgcHJvcGVydHlcbiAgICAgICAgLy8gMy4gQXMgYSBqc29uIG9iamVjdCB3aXRoIGEgYm9keSBhbmQgaWQgb24gdGhlIGdyb3VwIHNldHRpbmdzXG4gICAgICAgIHZhciByZWFjdGlvbnMgPSBbXTtcbiAgICAgICAgdmFyIHJlYWN0aW9uU3RyaW5ncztcbiAgICAgICAgdmFyIGVsZW1lbnRSZWFjdGlvbnMgPSAkZWxlbWVudCA/ICRlbGVtZW50LmF0dHIoJ2FudC1yZWFjdGlvbnMnKSA6IHVuZGVmaW5lZDtcbiAgICAgICAgaWYgKGVsZW1lbnRSZWFjdGlvbnMpIHtcbiAgICAgICAgICAgIHJlYWN0aW9uU3RyaW5ncyA9IGVsZW1lbnRSZWFjdGlvbnMuc3BsaXQoJzsnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlYWN0aW9uU3RyaW5ncyA9IHdpbmRvdy5hbnRlbm5hX2V4dGVuZFsnZGVmYXVsdF9yZWFjdGlvbnMnXTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocmVhY3Rpb25TdHJpbmdzKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJlYWN0aW9uU3RyaW5ncy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHJlYWN0aW9ucy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgdGV4dDogcmVhY3Rpb25TdHJpbmdzW2ldLFxuICAgICAgICAgICAgICAgICAgICBpc0RlZmF1bHQ6IHRydWVcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyIHZhbHVlcyA9IGpzb25bJ2RlZmF1bHRfcmVhY3Rpb25zJ107XG4gICAgICAgICAgICBpZiAodmFsdWVzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHZhbHVlcy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgdmFsdWUgPSB2YWx1ZXNbal07XG4gICAgICAgICAgICAgICAgICAgIHJlYWN0aW9ucy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6IHZhbHVlLmJvZHksXG4gICAgICAgICAgICAgICAgICAgICAgICBpZDogdmFsdWUuaWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBpc0RlZmF1bHQ6IHRydWVcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZWFjdGlvbnM7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY29tcHV0ZUN1c3RvbUNTUygpIHtcbiAgICAgICAgLy8gRmlyc3QgcmVhZCBhbnkgcmF3IGN1c3RvbSBDU1MuXG4gICAgICAgIHZhciBjdXN0b21DU1MgPSBkYXRhKCdjdXN0b21fY3NzJykoKTtcbiAgICAgICAgLy8gVGhlbiBhcHBlbmQgcnVsZXMgZm9yIGFueSBzcGVjaWZpYyBDU1Mgb3ZlcnJpZGVzLlxuICAgICAgICBjdXN0b21DU1MgKz0gY3JlYXRlQ3VzdG9tQ1NTUnVsZShkYXRhKCd0YWdzX2JnX2NzcycsICcnKSwgJy5hbnRlbm5hLXJlYWN0aW9ucy1wYWdlIC5hbnRlbm5hLWJvZHksIC5hbnRlbm5hLWRlZmF1bHRzLXBhZ2UgLmFudGVubmEtYm9keScpO1xuICAgICAgICBjdXN0b21DU1MgKz0gY3JlYXRlQ3VzdG9tQ1NTUnVsZShkYXRhKCd0YWdfYm94X2JnX2NvbG9ycycsICcnKSwgJy5hbnRlbm5hLXJlYWN0aW9uLWJveCcpO1xuICAgICAgICBjdXN0b21DU1MgKz0gY3JlYXRlQ3VzdG9tQ1NTUnVsZShkYXRhKCd0YWdfYm94X2JnX2NvbG9yc19ob3ZlcicsICcnKSwgJy5hbnRlbm5hLXJlYWN0aW9uOmhvdmVyID4gLmFudGVubmEtcmVhY3Rpb24tYm94Jyk7XG4gICAgICAgIGN1c3RvbUNTUyArPSBjcmVhdGVDdXN0b21DU1NSdWxlKG1pZ3JhdGVUZXh0Q29sb3JTZXR0aW5ncyhkYXRhKCd0YWdfYm94X3RleHRfY29sb3JzJywgJycpKSwgJy5hbnRlbm5hLXJlYWN0aW9uLWJveCwgLmFudGVubmEtcmVhY3Rpb24tY29tbWVudHMgLmFudGVubmEtY29tbWVudHMtcGF0aCwgLmFudGVubmEtcmVhY3Rpb24tbG9jYXRpb24gLmFudGVubmEtbG9jYXRpb24tcGF0aCcpO1xuICAgICAgICBjdXN0b21DU1MgKz0gY3JlYXRlQ3VzdG9tQ1NTUnVsZShtaWdyYXRlRm9udEZhbWlseVNldHRpbmcoZGF0YSgndGFnX2JveF9mb250X2ZhbWlseScsICcnKSksICcuYW50ZW5uYS1yZWFjdGlvbi1ib3gnKTtcbiAgICAgICAgcmV0dXJuIGN1c3RvbUNTUztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjcmVhdGVDdXN0b21DU1NSdWxlKGRlY2xhcmF0aW9uc0FjY2Vzc29yLCBzZWxlY3Rvcikge1xuICAgICAgICB2YXIgZGVjbGFyYXRpb25zID0gZGVjbGFyYXRpb25zQWNjZXNzb3IoKS50cmltKCk7XG4gICAgICAgIGlmIChkZWNsYXJhdGlvbnMpIHtcbiAgICAgICAgICAgIHJldHVybiAnXFxuJyArIHNlbGVjdG9yICsgJyB7XFxuICAgICcgKyBkZWNsYXJhdGlvbnMgKyAnXFxufSc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICcnO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1pZ3JhdGVGb250RmFtaWx5U2V0dGluZyhmb250RmFtaWx5QWNjZXNzb3IpIHtcbiAgICAgICAgLy8gVE9ETzogVGhpcyBpcyB0ZW1wb3JhcnkgY29kZSB0aGF0IG1pZ3JhdGVzIHRoZSBjdXJyZW50IHRhZ19ib3hfZm9udF9mYW1pbHkgc2V0dGluZyBmcm9tIGEgcmF3IHZhbHVlIHRvIGFcbiAgICAgICAgLy8gICAgICAgQ1NTIGRlY2xhcmF0aW9uLiBXZSBzaG91bGQgbWlncmF0ZSBhbGwgZGVwbG95ZWQgc2l0ZXMgdG8gdXNlIGEgQ1NTIGRlY2xhcmF0aW9uIGFuZCB0aGVuIHJlbW92ZSB0aGlzLlxuICAgICAgICB2YXIgZm9udEZhbWlseSA9IGZvbnRGYW1pbHlBY2Nlc3NvcigpLnRyaW0oKTtcbiAgICAgICAgaWYgKGZvbnRGYW1pbHkgJiYgZm9udEZhbWlseS5pbmRleE9mKCdmb250LWZhbWlseScpID09PSAtMSkge1xuICAgICAgICAgICAgZm9udEZhbWlseSA9ICdmb250LWZhbWlseTogJyArIGZvbnRGYW1pbHk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIGZvbnRGYW1pbHk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtaWdyYXRlVGV4dENvbG9yU2V0dGluZ3ModGV4dENvbG9yQWNjZXNzb3IpIHtcbiAgICAgICAgLy8gVE9ETzogVGhpcyBpcyB0ZW1wb3JhcnkgY29kZSB0aGF0IG1pZ3JhdGVzIHRoZSBjdXJyZW50IHRhZ19ib3hfdGV4dF9jb2xvcnMgcHJvcGVydHksIHdoaWNoIGlzIGEgZGVjbGFyYXRpb25cbiAgICAgICAgLy8gICAgICAgdGhhdCBvbmx5IHNldHMgdGhlIGNvbG9yIHByb3BlcnR5LCB0byBzZXQgYm90aCB0aGUgY29sb3IgYW5kIGZpbGwgcHJvcGVydGllcy5cbiAgICAgICAgdmFyIHRleHRDb2xvciA9IHRleHRDb2xvckFjY2Vzc29yKCkudHJpbSgpO1xuICAgICAgICBpZiAodGV4dENvbG9yICYmIHRleHRDb2xvci5pbmRleE9mKCdjb2xvcjonKSA9PT0gMCAmJiB0ZXh0Q29sb3IuaW5kZXhPZignZmlsbDonKSA9PT0gLTEpIHtcbiAgICAgICAgICAgIHRleHRDb2xvciArPSB0ZXh0Q29sb3JbdGV4dENvbG9yLmxlbmd0aCAtIDFdID09ICc7JyA/ICcnIDogJzsnOyAvLyBhcHBlbmQgYSBzZW1pY29sb24gaWYgbmVlZGVkXG4gICAgICAgICAgICB0ZXh0Q29sb3IgKz0gdGV4dENvbG9yLnJlcGxhY2UoJ2NvbG9yOicsICdcXG4gICAgZmlsbDonKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gdGV4dENvbG9yO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgbGVnYWN5QmVoYXZpb3I6IGRhdGEoJ2xlZ2FjeV9iZWhhdmlvcicsIGZhbHNlKSwgLy8gVE9ETzogbWFrZSB0aGlzIHJlYWwgaW4gdGhlIHNlbnNlIHRoYXQgaXQgY29tZXMgYmFjayBmcm9tIHRoZSBzZXJ2ZXIgYW5kIHByb2JhYmx5IG1vdmUgdGhlIGZsYWcgdG8gdGhlIHBhZ2UgZGF0YS4gVW5saWtlbHkgdGhhdCB3ZSBuZWVkIHRvIG1haW50YWluIGxlZ2FjeSBiZWhhdmlvciBmb3IgbmV3IHBhZ2VzP1xuICAgICAgICBncm91cElkOiBkYXRhKCdpZCcpLFxuICAgICAgICBhY3RpdmVTZWN0aW9uczogZGF0YSgnYWN0aXZlX3NlY3Rpb25zJyksXG4gICAgICAgIHVybDoge1xuICAgICAgICAgICAgaWdub3JlU3ViZG9tYWluOiBkYXRhKCdpZ25vcmVfc3ViZG9tYWluJyksXG4gICAgICAgICAgICBjYW5vbmljYWxEb21haW46IGRhdGEoJ3BhZ2VfdGxkJykgLy8gVE9ETzogd2hhdCB0byBjYWxsIHRoaXMgZXhhY3RseS4gZ3JvdXBEb21haW4/IHNpdGVEb21haW4/IGNhbm9uaWNhbERvbWFpbj9cbiAgICAgICAgfSxcbiAgICAgICAgc3VtbWFyeVNlbGVjdG9yOiBkYXRhKCdzdW1tYXJ5X3dpZGdldF9zZWxlY3RvcicpLFxuICAgICAgICBzdW1tYXJ5TWV0aG9kOiBkYXRhKCdzdW1tYXJ5X3dpZGdldF9tZXRob2QnKSxcbiAgICAgICAgcGFnZVNlbGVjdG9yOiBkYXRhKCdwb3N0X3NlbGVjdG9yJyksXG4gICAgICAgIHBhZ2VMaW5rU2VsZWN0b3I6IGRhdGEoJ3Bvc3RfaHJlZl9zZWxlY3RvcicpLFxuICAgICAgICBwYWdlSW1hZ2VTZWxlY3RvcjogZGF0YSgnaW1hZ2Vfc2VsZWN0b3InKSxcbiAgICAgICAgcGFnZUltYWdlQXR0cmlidXRlOiBkYXRhKCdpbWFnZV9hdHRyaWJ1dGUnKSxcbiAgICAgICAgcGFnZUF1dGhvclNlbGVjdG9yOiBkYXRhKCdhdXRob3Jfc2VsZWN0b3InKSxcbiAgICAgICAgcGFnZUF1dGhvckF0dHJpYnV0ZTogZGF0YSgnYXV0aG9yX2F0dHJpYnV0ZScpLFxuICAgICAgICBwYWdlVG9waWNzU2VsZWN0b3I6IGRhdGEoJ3RvcGljc19zZWxlY3RvcicpLFxuICAgICAgICBwYWdlVG9waWNzQXR0cmlidXRlOiBkYXRhKCd0b3BpY3NfYXR0cmlidXRlJyksXG4gICAgICAgIHBhZ2VTaXRlU2VjdGlvblNlbGVjdG9yOiBkYXRhKCdzZWN0aW9uX3NlbGVjdG9yJyksXG4gICAgICAgIHBhZ2VTaXRlU2VjdGlvbkF0dHJpYnV0ZTogZGF0YSgnc2VjdGlvbl9hdHRyaWJ1dGUnKSxcbiAgICAgICAgY29udGVudFNlbGVjdG9yOiBkYXRhKCdhbm5vX3doaXRlbGlzdCcpLFxuICAgICAgICB0ZXh0SW5kaWNhdG9yTGltaXQ6IGRhdGEoJ2luaXRpYWxfcGluX2xpbWl0JyksXG4gICAgICAgIGVuYWJsZVRleHRIZWxwZXI6IGRhdGEoJ3BhcmFncmFwaF9oZWxwZXInKSxcbiAgICAgICAgbWVkaWFJbmRpY2F0b3JDb3JuZXI6IGRhdGEoJ2ltZ19pbmRpY2F0b3Jfc2hvd19zaWRlJyksXG4gICAgICAgIGdlbmVyYXRlZEN0YVNlbGVjdG9yOiBkYXRhKCdzZXBhcmF0ZV9jdGEnKSxcbiAgICAgICAgZGVmYXVsdFJlYWN0aW9uczogZGVmYXVsdFJlYWN0aW9ucyxcbiAgICAgICAgY3VzdG9tQ1NTOiBjb21wdXRlQ3VzdG9tQ1NTLFxuICAgICAgICBleGNsdXNpb25TZWxlY3RvcjogZGF0YSgnbm9fYW50JyksIC8vIFRPRE86IG5vX3JlYWRyP1xuICAgICAgICBsYW5ndWFnZTogZGF0YSgnbGFuZ3VhZ2UnKVxuICAgIH1cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZTogdXBkYXRlRnJvbUpTT04sXG4gICAgZ2V0OiBnZXRHcm91cFNldHRpbmdzXG59OyIsIi8vIFRoaXMgbW9kdWxlIHN0b3JlcyBvdXIgbWFwcGluZyBmcm9tIGhhc2ggdmFsdWVzIHRvIHRoZWlyIGNvcnJlc3BvbmRpbmcgZWxlbWVudHMgaW4gdGhlIERPTS4gVGhlIGRhdGEgaXMgb3JnYW5pemVkXG4vLyBieSBwYWdlIGZvciB0aGUgYmxvZyByb2xsIGNhc2UsIHdoZXJlIG11bHRpcGxlIHBhZ2VzIG9mIGRhdGEgY2FuIGJlIGxvYWRlZCBhdCBvbmNlLlxudmFyIHBhZ2VzID0ge307XG5cbmZ1bmN0aW9uIGdldEVsZW1lbnQoY29udGFpbmVySGFzaCwgcGFnZUhhc2gpIHtcbiAgICB2YXIgY29udGFpbmVycyA9IHBhZ2VzW3BhZ2VIYXNoXTtcbiAgICBpZiAoY29udGFpbmVycykge1xuICAgICAgICByZXR1cm4gY29udGFpbmVyc1tjb250YWluZXJIYXNoXTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHNldEVsZW1lbnQoY29udGFpbmVySGFzaCwgcGFnZUhhc2gsIGVsZW1lbnQpIHtcbiAgICB2YXIgY29udGFpbmVycyA9IHBhZ2VzW3BhZ2VIYXNoXTtcbiAgICBpZiAoIWNvbnRhaW5lcnMpIHtcbiAgICAgICAgY29udGFpbmVycyA9IHBhZ2VzW3BhZ2VIYXNoXSA9IHt9O1xuICAgIH1cbiAgICBjb250YWluZXJzW2NvbnRhaW5lckhhc2hdID0gZWxlbWVudDtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGdldDogZ2V0RWxlbWVudCxcbiAgICBzZXQ6IHNldEVsZW1lbnRcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgUmFjdGl2ZTsgcmVxdWlyZSgnLi91dGlscy9yYWN0aXZlLXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGxvYWRlZFJhY3RpdmUpIHsgUmFjdGl2ZSA9IGxvYWRlZFJhY3RpdmU7fSk7XG52YXIgUmFuZ2UgPSByZXF1aXJlKCcuL3V0aWxzL3JhbmdlJyk7XG5cbnZhciBFdmVudHMgPSByZXF1aXJlKCcuL2V2ZW50cycpO1xudmFyIEhhc2hlZEVsZW1lbnRzID0gcmVxdWlyZSgnLi9oYXNoZWQtZWxlbWVudHMnKTtcbnZhciBQYWdlRGF0YSA9IHJlcXVpcmUoJy4vcGFnZS1kYXRhJyk7XG52YXIgU1ZHcyA9IHJlcXVpcmUoJy4vc3ZncycpO1xuXG52YXIgcGFnZVNlbGVjdG9yID0gJy5hbnRlbm5hLWxvY2F0aW9ucy1wYWdlJztcblxuZnVuY3Rpb24gY3JlYXRlUGFnZShvcHRpb25zKSB7XG4gICAgdmFyIGVsZW1lbnQgPSBvcHRpb25zLmVsZW1lbnQ7XG4gICAgdmFyIHJlYWN0aW9uTG9jYXRpb25EYXRhID0gb3B0aW9ucy5yZWFjdGlvbkxvY2F0aW9uRGF0YTtcbiAgICB2YXIgcGFnZURhdGEgPSBvcHRpb25zLnBhZ2VEYXRhO1xuICAgIHZhciBncm91cFNldHRpbmdzID0gb3B0aW9ucy5ncm91cFNldHRpbmdzO1xuICAgIHZhciBjbG9zZVdpbmRvdyA9IG9wdGlvbnMuY2xvc2VXaW5kb3c7XG4gICAgdmFyIGdvQmFjayA9IG9wdGlvbnMuZ29CYWNrO1xuICAgIHZhciByYWN0aXZlID0gUmFjdGl2ZSh7XG4gICAgICAgIGVsOiBlbGVtZW50LFxuICAgICAgICBhcHBlbmQ6IHRydWUsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIGxvY2F0aW9uRGF0YTogcmVhY3Rpb25Mb2NhdGlvbkRhdGEsXG4gICAgICAgICAgICBwYWdlUmVhY3Rpb25Db3VudDogcGFnZVJlYWN0aW9uQ291bnQocmVhY3Rpb25Mb2NhdGlvbkRhdGEpLFxuICAgICAgICAgICAgY2FuTG9jYXRlOiBmdW5jdGlvbihjb250YWluZXJIYXNoKSB7XG4gICAgICAgICAgICAgICAgLy8gVE9ETzogaXMgdGhlcmUgYSBiZXR0ZXIgd2F5IHRvIGhhbmRsZSByZWFjdGlvbnMgdG8gaGFzaGVzIHRoYXQgYXJlIG5vIGxvbmdlciBvbiB0aGUgcGFnZT9cbiAgICAgICAgICAgICAgICAvLyAgICAgICBzaG91bGQgd2UgcHJvdmlkZSBzb21lIGtpbmQgb2YgaW5kaWNhdGlvbiB3aGVuIHdlIGZhaWwgdG8gbG9jYXRlIGEgaGFzaCBvciBqdXN0IGxlYXZlIGl0IGFzIGlzP1xuICAgICAgICAgICAgICAgIC8vIFRPRE86IERvZXMgaXQgbWFrZSBzZW5zZSB0byBldmVuIHNob3cgZW50cmllcyB0aGF0IHdlIGNhbid0IGxvY2F0ZT8gUHJvYmFibHkgbm90LlxuICAgICAgICAgICAgICAgIHJldHVybiBIYXNoZWRFbGVtZW50cy5nZXQoY29udGFpbmVySGFzaCwgcGFnZURhdGEucGFnZUhhc2gpICE9PSB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHRlbXBsYXRlOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvbG9jYXRpb25zLXBhZ2UuaGJzLmh0bWwnKSxcbiAgICAgICAgcGFydGlhbHM6IHtcbiAgICAgICAgICAgIGxlZnQ6IFNWR3MubGVmdFxuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmFjdGl2ZS5vbignYmFjaycsIGdvQmFjayk7XG4gICAgcmFjdGl2ZS5vbigncmV2ZWFsJywgcmV2ZWFsQ29udGVudCk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgc2VsZWN0b3I6IHBhZ2VTZWxlY3RvcixcbiAgICAgICAgdGVhcmRvd246IGZ1bmN0aW9uKCkgeyByYWN0aXZlLnRlYXJkb3duKCk7IH1cbiAgICB9O1xuXG5cbiAgICBmdW5jdGlvbiByZXZlYWxDb250ZW50KGV2ZW50KSB7XG4gICAgICAgIHZhciBsb2NhdGlvbkRhdGEgPSBldmVudC5jb250ZXh0O1xuICAgICAgICB2YXIgZWxlbWVudCA9IEhhc2hlZEVsZW1lbnRzLmdldChsb2NhdGlvbkRhdGEuY29udGFpbmVySGFzaCwgcGFnZURhdGEucGFnZUhhc2gpO1xuICAgICAgICBpZiAoZWxlbWVudCkge1xuICAgICAgICAgICAgY2xvc2VXaW5kb3coKTtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IC8vIExldCB0aGUgcHJvY2Vzc2luZyBvZiB0aGlzIGNsaWNrIGV2ZW50IGZpbmlzaCBiZWZvcmUgd2UgYWRkIGFub3RoZXIgY2xpY2sgaGFuZGxlciBzbyB0aGUgbmV3IGhhbmRsZXIgaXNuJ3QgaW1tZWRpYXRlbHkgdHJpZ2dlcmVkXG4gICAgICAgICAgICAgICAgdmFyIHRhcmdldFNjcm9sbFRvcCA9ICQoZWxlbWVudCkub2Zmc2V0KCkudG9wIC0gMjA7IC8vIFRPRE86IHJldmlldyB0aGUgZXhhY3QgbG9jYXRpb25cbiAgICAgICAgICAgICAgICAkKCdib2R5JykuYW5pbWF0ZSh7c2Nyb2xsVG9wOiB0YXJnZXRTY3JvbGxUb3B9KTtcbiAgICAgICAgICAgICAgICBpZiAobG9jYXRpb25EYXRhLmtpbmQgPT09ICd0eHQnKSB7IC8vIFRPRE86IHNvbWV0aGluZyBiZXR0ZXIgdGhhbiBhIHN0cmluZyBjb21wYXJlLiBmaXggdGhpcyBhbG9uZyB3aXRoIHRoZSBzYW1lIGlzc3VlIGluIHBhZ2UtZGF0YVxuICAgICAgICAgICAgICAgICAgICBSYW5nZS5oaWdobGlnaHQoZWxlbWVudC5nZXQoMCksIGxvY2F0aW9uRGF0YS5sb2NhdGlvbik7XG4gICAgICAgICAgICAgICAgICAgICQoZG9jdW1lbnQpLm9uKCdjbGljay5hbnRlbm5hJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBSYW5nZS5jbGVhckhpZ2hsaWdodHMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICQoZG9jdW1lbnQpLm9mZignY2xpY2suYW50ZW5uYScpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIGNvbnRhaW5lckRhdGEgPSBQYWdlRGF0YS5nZXRDb250YWluZXJEYXRhKHBhZ2VEYXRhLCBsb2NhdGlvbkRhdGEuY29udGFpbmVySGFzaCk7XG4gICAgICAgICAgICAgICAgRXZlbnRzLnBvc3RDb250ZW50Vmlld2VkKHBhZ2VEYXRhLCBjb250YWluZXJEYXRhLGxvY2F0aW9uRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gcGFnZVJlYWN0aW9uQ291bnQocmVhY3Rpb25Mb2NhdGlvbkRhdGEpIHtcbiAgICBmb3IgKHZhciBjb250ZW50SUQgaW4gcmVhY3Rpb25Mb2NhdGlvbkRhdGEpIHtcbiAgICAgICAgaWYgKHJlYWN0aW9uTG9jYXRpb25EYXRhLmhhc093blByb3BlcnR5KGNvbnRlbnRJRCkpIHtcbiAgICAgICAgICAgIHZhciBjb250ZW50TG9jYXRpb25EYXRhID0gcmVhY3Rpb25Mb2NhdGlvbkRhdGFbY29udGVudElEXTtcbiAgICAgICAgICAgIGlmIChjb250ZW50TG9jYXRpb25EYXRhLmtpbmQgPT09ICdwYWcnKSB7IC8vIFRPRE86IHNvbWV0aGluZyBiZXR0ZXIgdGhhbiBhIHN0cmluZyBjb21wYXJlLiBmaXggdGhpcyBhbG9uZyB3aXRoIHRoZSBzYW1lIGlzc3VlIGluIHBhZ2UtZGF0YVxuICAgICAgICAgICAgICAgIHJldHVybiBjb250ZW50TG9jYXRpb25EYXRhLmNvdW50O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlOiBjcmVhdGVQYWdlXG59OyIsInZhciAkOyByZXF1aXJlKCcuL3V0aWxzL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIFJhY3RpdmU7IHJlcXVpcmUoJy4vdXRpbHMvcmFjdGl2ZS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihsb2FkZWRSYWN0aXZlKSB7IFJhY3RpdmUgPSBsb2FkZWRSYWN0aXZlO30pO1xudmFyIFJlYWN0aW9uc1dpZGdldCA9IHJlcXVpcmUoJy4vcmVhY3Rpb25zLXdpZGdldCcpO1xudmFyIFNWR3MgPSByZXF1aXJlKCcuL3N2Z3MnKTtcblxudmFyIEFwcE1vZGUgPSByZXF1aXJlKCcuL3V0aWxzL2FwcC1tb2RlJyk7XG52YXIgTXV0YXRpb25PYnNlcnZlciA9IHJlcXVpcmUoJy4vdXRpbHMvbXV0YXRpb24tb2JzZXJ2ZXInKTtcbnZhciBUaHJvdHRsZWRFdmVudHMgPSByZXF1aXJlKCcuL3V0aWxzL3Rocm90dGxlZC1ldmVudHMnKTtcbnZhciBUb3VjaFN1cHBvcnQgPSByZXF1aXJlKCcuL3V0aWxzL3RvdWNoLXN1cHBvcnQnKTtcblxuZnVuY3Rpb24gY3JlYXRlSW5kaWNhdG9yV2lkZ2V0KG9wdGlvbnMpIHtcbiAgICAvLyBUT0RPOiB2YWxpZGF0ZSB0aGF0IG9wdGlvbnMgY29udGFpbnMgYWxsIHJlcXVpcmVkIHByb3BlcnRpZXMgKGFwcGxpZXMgdG8gYWxsIHdpZGdldHMpLlxuICAgIHZhciBlbGVtZW50ID0gb3B0aW9ucy5lbGVtZW50O1xuICAgIHZhciBjb250YWluZXJEYXRhID0gb3B0aW9ucy5jb250YWluZXJEYXRhO1xuICAgIHZhciAkY29udGFpbmVyRWxlbWVudCA9IG9wdGlvbnMuY29udGFpbmVyRWxlbWVudDtcbiAgICB2YXIgcGFnZURhdGEgPSBvcHRpb25zLnBhZ2VEYXRhO1xuICAgIHZhciBncm91cFNldHRpbmdzID0gb3B0aW9ucy5ncm91cFNldHRpbmdzO1xuICAgIHZhciBkZWZhdWx0UmVhY3Rpb25zID0gb3B0aW9ucy5kZWZhdWx0UmVhY3Rpb25zO1xuICAgIHZhciBjb250ZW50RGF0YSA9IG9wdGlvbnMuY29udGVudERhdGE7XG4gICAgdmFyIHJhY3RpdmUgPSBSYWN0aXZlKHtcbiAgICAgICAgZWw6IGVsZW1lbnQsXG4gICAgICAgIGFwcGVuZDogdHJ1ZSxcbiAgICAgICAgbWFnaWM6IHRydWUsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIGNvbnRhaW5lckRhdGE6IGNvbnRhaW5lckRhdGEsXG4gICAgICAgICAgICBleHRyYUF0dHJpYnV0ZXM6IEFwcE1vZGUuZGVidWcgPyAnYW50LWhhc2g9XCInICsgY29udGFpbmVyRGF0YS5oYXNoICsgJ1wiJyA6ICcnIC8vIFRPRE86IHRoaXMgYWJvdXQgbWFraW5nIHRoaXMgYSBkZWNvcmF0b3IgaGFuZGxlZCBieSBhIFwiRGVidWdcIiBtb2R1bGVcbiAgICAgICAgfSxcbiAgICAgICAgdGVtcGxhdGU6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9tZWRpYS1pbmRpY2F0b3Itd2lkZ2V0Lmhicy5odG1sJyksXG4gICAgICAgIHBhcnRpYWxzOiB7XG4gICAgICAgICAgICBsb2dvOiBTVkdzLmxvZ29cbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgdmFyIHJlYWN0aW9uV2lkZ2V0T3B0aW9ucyA9IHtcbiAgICAgICAgcmVhY3Rpb25zRGF0YTogY29udGFpbmVyRGF0YS5yZWFjdGlvbnMsXG4gICAgICAgIGNvbnRhaW5lckRhdGE6IGNvbnRhaW5lckRhdGEsXG4gICAgICAgIGNvbnRhaW5lckVsZW1lbnQ6ICRjb250YWluZXJFbGVtZW50LFxuICAgICAgICBjb250ZW50RGF0YTogY29udGVudERhdGEsXG4gICAgICAgIGRlZmF1bHRSZWFjdGlvbnM6IGRlZmF1bHRSZWFjdGlvbnMsXG4gICAgICAgIHBhZ2VEYXRhOiBwYWdlRGF0YSxcbiAgICAgICAgZ3JvdXBTZXR0aW5nczogZ3JvdXBTZXR0aW5nc1xuICAgIH07XG5cbiAgICB2YXIgaG92ZXJUaW1lb3V0O1xuICAgIHZhciBhY3RpdmVUaW1lb3V0O1xuXG4gICAgdmFyICRyb290RWxlbWVudCA9ICQocm9vdEVsZW1lbnQocmFjdGl2ZSkpO1xuICAgIFRvdWNoU3VwcG9ydC5zZXR1cFRhcCgkcm9vdEVsZW1lbnQuZ2V0KDApLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBvcGVuUmVhY3Rpb25zV2luZG93KHJlYWN0aW9uV2lkZ2V0T3B0aW9ucywgcmFjdGl2ZSlcbiAgICB9KTtcbiAgICAkcm9vdEVsZW1lbnQub24oJ21vdXNlZW50ZXIuYW50ZW5uYScsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGlmIChldmVudC5idXR0b25zID4gMCB8fCAoZXZlbnQuYnV0dG9ucyA9PSB1bmRlZmluZWQgJiYgZXZlbnQud2hpY2ggPiAwKSkgeyAvLyBPbiBTYWZhcmksIGV2ZW50LmJ1dHRvbnMgaXMgdW5kZWZpbmVkIGJ1dCBldmVudC53aGljaCBnaXZlcyBhIGdvb2QgdmFsdWUuIGV2ZW50LndoaWNoIGlzIGJhZCBvbiBGRlxuICAgICAgICAgICAgLy8gRG9uJ3QgcmVhY3QgaWYgdGhlIHVzZXIgaXMgZHJhZ2dpbmcgb3Igc2VsZWN0aW5nIHRleHQuXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvbnRhaW5lckRhdGEucmVhY3Rpb25zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIG9wZW5SZWFjdGlvbnNXaW5kb3cocmVhY3Rpb25XaWRnZXRPcHRpb25zLCByYWN0aXZlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNsZWFyVGltZW91dChob3ZlclRpbWVvdXQpO1xuICAgICAgICAgICAgaG92ZXJUaW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBvcGVuUmVhY3Rpb25zV2luZG93KHJlYWN0aW9uV2lkZ2V0T3B0aW9ucywgcmFjdGl2ZSk7XG4gICAgICAgICAgICB9LCA1MCk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICAkcm9vdEVsZW1lbnQub24oJ21vdXNlbGVhdmUuYW50ZW5uYScsIGZ1bmN0aW9uKCkge1xuICAgICAgICBjbGVhclRpbWVvdXQoaG92ZXJUaW1lb3V0KTtcbiAgICAgICAgY2xlYXJUaW1lb3V0KGFjdGl2ZVRpbWVvdXQpO1xuICAgIH0pO1xuICAgICRjb250YWluZXJFbGVtZW50Lm9uKCdtb3VzZWVudGVyLmFudGVubmEnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KGFjdGl2ZVRpbWVvdXQpO1xuICAgICAgICBhY3RpdmVUaW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICRyb290RWxlbWVudC5hZGRDbGFzcygnYWN0aXZlJyk7XG4gICAgICAgIH0sIDUwMCk7XG4gICAgfSk7XG4gICAgJGNvbnRhaW5lckVsZW1lbnQub24oJ21vdXNlbGVhdmUuYW50ZW5uYScsIGZ1bmN0aW9uKCkge1xuICAgICAgICBjbGVhclRpbWVvdXQoYWN0aXZlVGltZW91dCk7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAkcm9vdEVsZW1lbnQucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpO1xuICAgICAgICB9LCAxMDApOyAvLyBXZSBnZXQgYSBtb3VzZWxlYXZlIGV2ZW50IHdoZW4gdGhlIHVzZXIgaG92ZXJzIHRoZSBpbmRpY2F0b3IuIFBhdXNlIGxvbmcgZW5vdWdoIHRoYXQgdGhlIHJlYWN0aW9uIHdpbmRvdyBjYW4gb3BlbiBpZiB0aGV5IGhvdmVyLlxuICAgIH0pO1xuICAgIHNldHVwUG9zaXRpb25pbmcoJGNvbnRhaW5lckVsZW1lbnQsIGdyb3VwU2V0dGluZ3MsIHJhY3RpdmUpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgdGVhcmRvd246IGZ1bmN0aW9uKCkgeyByYWN0aXZlLnRlYXJkb3duKCk7IH1cbiAgICB9O1xufVxuXG5mdW5jdGlvbiBzZXR1cFBvc2l0aW9uaW5nKCRjb250YWluZXJFbGVtZW50LCBncm91cFNldHRpbmdzLCByYWN0aXZlKSB7XG4gICAgdmFyICR3cmFwcGVyRWxlbWVudCA9ICQod3JhcHBlckVsZW1lbnQocmFjdGl2ZSkpO1xuICAgIHZhciAkcm9vdEVsZW1lbnQgPSAkKHJvb3RFbGVtZW50KHJhY3RpdmUpKTtcbiAgICBwb3NpdGlvbkluZGljYXRvcigpO1xuXG4gICAgVGhyb3R0bGVkRXZlbnRzLm9uKCdyZXNpemUnLCBwb3NpdGlvbklmTmVlZGVkKTtcbiAgICByYWN0aXZlLm9uKCd0ZWFyZG93bicsIGZ1bmN0aW9uKCkge1xuICAgICAgICBUaHJvdHRsZWRFdmVudHMub2ZmKCdyZXNpemUnLCBwb3NpdGlvbklmTmVlZGVkKTtcbiAgICB9KTtcbiAgICBUaHJvdHRsZWRFdmVudHMub24oJ3Njcm9sbCcsIHBvc2l0aW9uSWZOZWVkZWQpO1xuICAgIHJhY3RpdmUub24oJ3RlYXJkb3duJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIFRocm90dGxlZEV2ZW50cy5vZmYoJ3Njcm9sbCcsIHBvc2l0aW9uSWZOZWVkZWQpO1xuICAgIH0pO1xuXG4gICAgLy8gVE9ETzogY29uc2lkZXIgYWxzbyBsaXN0ZW5pbmcgdG8gc3JjIGF0dHJpYnV0ZSBjaGFuZ2VzLCB3aGljaCBtaWdodCBhZmZlY3QgdGhlIGhlaWdodCBvZiBlbGVtZW50cyBvbiB0aGUgcGFnZVxuICAgIE11dGF0aW9uT2JzZXJ2ZXIuYWRkQWRkaXRpb25MaXN0ZW5lcihlbGVtZW50c0FkZGVkT3JSZW1vdmVkKTtcbiAgICBNdXRhdGlvbk9ic2VydmVyLmFkZFJlbW92YWxMaXN0ZW5lcihlbGVtZW50c0FkZGVkT3JSZW1vdmVkKTtcblxuICAgIGZ1bmN0aW9uIGVsZW1lbnRzQWRkZWRPclJlbW92ZWQoJGVsZW1lbnRzKSB7XG4gICAgICAgIC8vIFJlcG9zaXRpb24gdGhlIGluZGljYXRvciBpZiBlbGVtZW50cyB3aGljaCBtaWdodCBhZGp1c3QgdGhlIGNvbnRhaW5lcidzIHBvc2l0aW9uIGFyZSBhZGRlZC9yZW1vdmVkLlxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8ICRlbGVtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyICRlbGVtZW50ID0gJGVsZW1lbnRzW2ldO1xuICAgICAgICAgICAgaWYgKCRlbGVtZW50LmhlaWdodCgpID4gMCkge1xuICAgICAgICAgICAgICAgIHBvc2l0aW9uSWZOZWVkZWQoKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgbGFzdENvbnRhaW5lck9mZnNldCA9ICRjb250YWluZXJFbGVtZW50Lm9mZnNldCgpO1xuICAgIHZhciBsYXN0Q29udGFpbmVySGVpZ2h0ID0gJGNvbnRhaW5lckVsZW1lbnQuaGVpZ2h0KCk7XG5cbiAgICBmdW5jdGlvbiBwb3NpdGlvbklmTmVlZGVkKCkge1xuICAgICAgICB2YXIgY29udGFpbmVyT2Zmc2V0ID0gJGNvbnRhaW5lckVsZW1lbnQub2Zmc2V0KCk7XG4gICAgICAgIHZhciBjb250YWluZXJIZWlnaHQgPSAkY29udGFpbmVyRWxlbWVudC5oZWlnaHQoKTtcbiAgICAgICAgaWYgKGNvbnRhaW5lck9mZnNldC50b3AgPT09IGxhc3RDb250YWluZXJPZmZzZXQudG9wICYmXG4gICAgICAgICAgICBjb250YWluZXJPZmZzZXQubGVmdCA9PT0gbGFzdENvbnRhaW5lck9mZnNldC5sZWZ0ICYmXG4gICAgICAgICAgICBjb250YWluZXJIZWlnaHQgPT09IGxhc3RDb250YWluZXJIZWlnaHQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBsYXN0Q29udGFpbmVyT2Zmc2V0ID0gY29udGFpbmVyT2Zmc2V0O1xuICAgICAgICBsYXN0Q29udGFpbmVySGVpZ2h0ID0gY29udGFpbmVySGVpZ2h0O1xuICAgICAgICBwb3NpdGlvbkluZGljYXRvcigpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBvc2l0aW9uSW5kaWNhdG9yKCkge1xuICAgICAgICAvLyBQb3NpdGlvbiB0aGUgd3JhcHBlciBlbGVtZW50ICh3aGljaCBoYXMgYSBoYXJkY29kZWQgd2lkdGgpIGluIHRoZSBhcHByb3ByaWF0ZSBjb3JuZXIuIFRoZW4gZmxpcCB0aGUgbGVmdC9yaWdodFxuICAgICAgICAvLyBwb3NpdGlvbmluZyBvZiB0aGUgbmVzdGVkIHdpZGdldCBlbGVtZW50IHRvIGFkanVzdCB0aGUgd2F5IGl0IHdpbGwgZXhwYW5kIHdoZW4gdGhlIG1lZGlhIGlzIGhvdmVyZWQuXG4gICAgICAgIHZhciBjb3JuZXIgPSBncm91cFNldHRpbmdzLm1lZGlhSW5kaWNhdG9yQ29ybmVyKCk7XG4gICAgICAgIHZhciBlbGVtZW50T2Zmc2V0ID0gJGNvbnRhaW5lckVsZW1lbnQub2Zmc2V0KCk7XG4gICAgICAgIHZhciBjb29yZHMgPSB7fTtcbiAgICAgICAgaWYgKGNvcm5lci5pbmRleE9mKCd0b3AnKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIGNvb3Jkcy50b3AgPSBlbGVtZW50T2Zmc2V0LnRvcDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvb3Jkcy50b3AgPSBlbGVtZW50T2Zmc2V0LnRvcCArICRjb250YWluZXJFbGVtZW50LmhlaWdodCgpIC0gJHJvb3RFbGVtZW50Lm91dGVySGVpZ2h0KCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvcm5lci5pbmRleE9mKCdyaWdodCcpICE9PSAtMSkge1xuICAgICAgICAgICAgY29vcmRzLmxlZnQgPSBlbGVtZW50T2Zmc2V0LmxlZnQgKyAkY29udGFpbmVyRWxlbWVudC53aWR0aCgpIC0gJHdyYXBwZXJFbGVtZW50Lm91dGVyV2lkdGgoKTtcbiAgICAgICAgICAgICRyb290RWxlbWVudC5jc3Moe3JpZ2h0OjAsbGVmdDonJ30pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29vcmRzLmxlZnQgPSBlbGVtZW50T2Zmc2V0LmxlZnQ7XG4gICAgICAgICAgICAkcm9vdEVsZW1lbnQuY3NzKHtyaWdodDonJyxsZWZ0OjB9KTtcbiAgICAgICAgfVxuICAgICAgICAkd3JhcHBlckVsZW1lbnQuY3NzKGNvb3Jkcyk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiB3cmFwcGVyRWxlbWVudChyYWN0aXZlKSB7XG4gICAgcmV0dXJuIHJhY3RpdmUuZmluZCgnLmFudGVubmEtbWVkaWEtaW5kaWNhdG9yLXdyYXBwZXInKTtcbn1cblxuZnVuY3Rpb24gcm9vdEVsZW1lbnQocmFjdGl2ZSkge1xuICAgIHJldHVybiByYWN0aXZlLmZpbmQoJy5hbnRlbm5hLW1lZGlhLWluZGljYXRvci13aWRnZXQnKTtcbn1cblxuZnVuY3Rpb24gb3BlblJlYWN0aW9uc1dpbmRvdyhyZWFjdGlvbk9wdGlvbnMsIHJhY3RpdmUpIHtcbiAgICBSZWFjdGlvbnNXaWRnZXQub3BlbihyZWFjdGlvbk9wdGlvbnMsIHJvb3RFbGVtZW50KHJhY3RpdmUpKTtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZTogY3JlYXRlSW5kaWNhdG9yV2lkZ2V0XG59OyIsInZhciAkOyByZXF1aXJlKCcuL3V0aWxzL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIEFqYXhDbGllbnQgPSByZXF1aXJlKCcuL3V0aWxzL2FqYXgtY2xpZW50Jyk7XG52YXIgUGFnZVV0aWxzID0gcmVxdWlyZSgnLi91dGlscy9wYWdlLXV0aWxzJyk7XG52YXIgVGhyb3R0bGVkRXZlbnRzID0gcmVxdWlyZSgnLi91dGlscy90aHJvdHRsZWQtZXZlbnRzJyk7XG52YXIgVVJMcyA9IHJlcXVpcmUoJy4vdXRpbHMvdXJscycpO1xudmFyIFBhZ2VEYXRhID0gcmVxdWlyZSgnLi9wYWdlLWRhdGEnKTtcblxuLy8gQ29tcHV0ZSB0aGUgcGFnZXMgdGhhdCB3ZSBuZWVkIHRvIGZldGNoLiBUaGlzIGlzIGVpdGhlcjpcbi8vIDEuIEFueSBuZXN0ZWQgcGFnZXMgd2UgZmluZCB1c2luZyB0aGUgcGFnZSBzZWxlY3RvciBPUlxuLy8gMi4gVGhlIGN1cnJlbnQgd2luZG93IGxvY2F0aW9uXG5mdW5jdGlvbiBjb21wdXRlUGFnZXNQYXJhbSgkcGFnZUVsZW1lbnRBcnJheSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBncm91cElkID0gZ3JvdXBTZXR0aW5ncy5ncm91cElkKCk7XG4gICAgdmFyIHBhZ2VzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCAkcGFnZUVsZW1lbnRBcnJheS5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgJHBhZ2VFbGVtZW50ID0gJHBhZ2VFbGVtZW50QXJyYXlbaV07XG4gICAgICAgIHBhZ2VzLnB1c2goe1xuICAgICAgICAgICAgZ3JvdXBfaWQ6IGdyb3VwSWQsXG4gICAgICAgICAgICB1cmw6IFBhZ2VVdGlscy5jb21wdXRlUGFnZVVybCgkcGFnZUVsZW1lbnQsIGdyb3VwU2V0dGluZ3MpLFxuICAgICAgICAgICAgdGl0bGU6IFBhZ2VVdGlscy5jb21wdXRlUGFnZVRpdGxlKCRwYWdlRWxlbWVudCwgZ3JvdXBTZXR0aW5ncylcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGlmIChwYWdlcy5sZW5ndGggPT0gMSkge1xuICAgICAgICBwYWdlc1swXS5pbWFnZSA9IFBhZ2VVdGlscy5jb21wdXRlVG9wTGV2ZWxQYWdlSW1hZ2UoZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIHBhZ2VzWzBdLmF1dGhvciA9IFBhZ2VVdGlscy5jb21wdXRlUGFnZUF1dGhvcihncm91cFNldHRpbmdzKTtcbiAgICAgICAgcGFnZXNbMF0udG9waWNzID0gUGFnZVV0aWxzLmNvbXB1dGVQYWdlVG9waWNzKGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICBwYWdlc1swXS5zZWN0aW9uID0gUGFnZVV0aWxzLmNvbXB1dGVQYWdlU2l0ZVNlY3Rpb24oZ3JvdXBTZXR0aW5ncyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHsgcGFnZXM6IHBhZ2VzIH07XG59XG5cbmZ1bmN0aW9uIGxvYWRQYWdlRGF0YShwYWdlRGF0YVBhcmFtLCBncm91cFNldHRpbmdzKSB7XG4gICAgQWpheENsaWVudC5nZXRKU09OUChVUkxzLnBhZ2VEYXRhVXJsKCksIHBhZ2VEYXRhUGFyYW0sIHN1Y2Nlc3MsIGVycm9yKTtcblxuICAgIGZ1bmN0aW9uIHN1Y2Nlc3MoanNvbikge1xuICAgICAgICAvL3NldFRpbWVvdXQoZnVuY3Rpb24oKSB7IFBhZ2VEYXRhLnVwZGF0ZUFsbFBhZ2VEYXRhKGpzb24sIGdyb3VwU2V0dGluZ3MpOyB9LCAzMDAwKTtcbiAgICAgICAgUGFnZURhdGEudXBkYXRlQWxsUGFnZURhdGEoanNvbiwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZXJyb3IobWVzc2FnZSkge1xuICAgICAgICAvLyBUT0RPIGhhbmRsZSBlcnJvcnMgdGhhdCBoYXBwZW4gd2hlbiBsb2FkaW5nIHBhZ2UgZGF0YVxuICAgICAgICBjb25zb2xlLmxvZygnQW4gZXJyb3Igb2NjdXJyZWQgbG9hZGluZyBwYWdlIGRhdGE6ICcgKyBtZXNzYWdlKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHN0YXJ0TG9hZGluZ1BhZ2VEYXRhKGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgJHBhZ2VFbGVtZW50cyA9ICQoZ3JvdXBTZXR0aW5ncy5wYWdlU2VsZWN0b3IoKSk7XG4gICAgaWYgKCRwYWdlRWxlbWVudHMubGVuZ3RoID09IDApIHtcbiAgICAgICAgJHBhZ2VFbGVtZW50cyA9ICQoJ2JvZHknKTtcbiAgICB9XG4gICAgcXVldWVQYWdlRGF0YUxvYWQoJHBhZ2VFbGVtZW50cywgZ3JvdXBTZXR0aW5ncyk7XG59XG5cbmZ1bmN0aW9uIHF1ZXVlUGFnZURhdGFMb2FkKCRwYWdlRWxlbWVudHMsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgcGFnZXNUb0xvYWQgPSBbXTtcbiAgICAkcGFnZUVsZW1lbnRzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkcGFnZUVsZW1lbnQgPSAkKHRoaXMpO1xuICAgICAgICBpZiAoaXNJblZpZXcoJHBhZ2VFbGVtZW50KSkge1xuICAgICAgICAgICAgcGFnZXNUb0xvYWQucHVzaCgkcGFnZUVsZW1lbnQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbG9hZFdoZW5WaXNpYmxlKCRwYWdlRWxlbWVudCwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIHZhciBwYWdlRGF0YVBhcmFtID0gY29tcHV0ZVBhZ2VzUGFyYW0ocGFnZXNUb0xvYWQsIGdyb3VwU2V0dGluZ3MpO1xuICAgIC8vIFRPRE86IGRlbGV0ZSB0aGUgY29tbWVudGVkIGxpbmUgYmVsb3csIHdoaWNoIGlzIGZvciB0ZXN0aW5nIHB1cnBvc2VzXG4gICAgLy9wYWdlRGF0YVBhcmFtID0ge3BhZ2VzOiBbe1wiZ3JvdXBfaWRcIjoxMTg0LCBcInVybFwiOlwiaHR0cDovL3d3dy5kdWtlY2hyb25pY2xlLmNvbS9hcnRpY2xlcy8yMDE0LzAyLzE0L3BvcnRyYWl0LXBvcm4tc3RhclwiLFwiY2Fub25pY2FsX3VybFwiOlwic2FtZVwiLFwidGl0bGVcIjpcIlBvcnRyYWl0IG9mIGEgcG9ybiBzdGFyXCIsXCJpbWFnZVwiOlwiXCJ9XX07XG4gICAgbG9hZFBhZ2VEYXRhKHBhZ2VEYXRhUGFyYW0sIGdyb3VwU2V0dGluZ3MpO1xufVxuXG5mdW5jdGlvbiBpc0luVmlldygkZWxlbWVudCkge1xuICAgIHZhciB0cmlnZ2VyRGlzdGFuY2UgPSAzMDA7XG4gICAgcmV0dXJuICRlbGVtZW50Lm9mZnNldCgpLnRvcCA8ICAkKGRvY3VtZW50KS5zY3JvbGxUb3AoKSArICQod2luZG93KS5oZWlnaHQoKSArIHRyaWdnZXJEaXN0YW5jZTtcbn1cblxuZnVuY3Rpb24gbG9hZFdoZW5WaXNpYmxlKCRwYWdlRWxlbWVudCwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBjaGVja1Zpc2liaWxpdHkgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKGlzSW5WaWV3KCRwYWdlRWxlbWVudCkpIHtcbiAgICAgICAgICAgIHZhciBwYWdlRGF0YVBhcmFtID0gY29tcHV0ZVBhZ2VzUGFyYW0oWyRwYWdlRWxlbWVudF0sIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgbG9hZFBhZ2VEYXRhKHBhZ2VEYXRhUGFyYW0sIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgVGhyb3R0bGVkRXZlbnRzLm9mZignc2Nyb2xsJywgY2hlY2tWaXNpYmlsaXR5KTtcbiAgICAgICAgICAgIFRocm90dGxlZEV2ZW50cy5vZmYoJ3Jlc2l6ZScsIGNoZWNrVmlzaWJpbGl0eSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFRocm90dGxlZEV2ZW50cy5vbignc2Nyb2xsJywgY2hlY2tWaXNpYmlsaXR5KTtcbiAgICBUaHJvdHRsZWRFdmVudHMub24oJ3Jlc2l6ZScsIGNoZWNrVmlzaWJpbGl0eSk7XG59XG5cbmZ1bmN0aW9uIHBhZ2VzQWRkZWQoJHBhZ2VFbGVtZW50cywgZ3JvdXBTZXR0aW5ncykge1xuICAgIHF1ZXVlUGFnZURhdGFMb2FkKCRwYWdlRWxlbWVudHMsIGdyb3VwU2V0dGluZ3MpO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgbG9hZDogc3RhcnRMb2FkaW5nUGFnZURhdGEsXG4gICAgcGFnZXNBZGRlZDogcGFnZXNBZGRlZFxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi91dGlscy9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcblxudmFyIEV2ZW50cyA9IHJlcXVpcmUoJy4vZXZlbnRzJyk7XG5cbi8vIENvbGxlY3Rpb24gb2YgYWxsIHBhZ2UgZGF0YSwga2V5ZWQgYnkgcGFnZSBoYXNoXG52YXIgcGFnZXMgPSB7fTtcbi8vIE1hcHBpbmcgb2YgcGFnZSBVUkxzIHRvIHBhZ2UgaGFzaGVzLCB3aGljaCBhcmUgY29tcHV0ZWQgb24gdGhlIHNlcnZlci5cbnZhciB1cmxIYXNoZXMgPSB7fTtcblxuZnVuY3Rpb24gZ2V0UGFnZURhdGEoaGFzaCkge1xuICAgIHZhciBwYWdlRGF0YSA9IHBhZ2VzW2hhc2hdO1xuICAgIGlmICghcGFnZURhdGEpIHtcbiAgICAgICAgLy8gVE9ETzogR2l2ZSB0aGlzIHNlcmlvdXMgdGhvdWdodC4gSW4gb3JkZXIgZm9yIG1hZ2ljIG1vZGUgdG8gd29yaywgdGhlIG9iamVjdCBuZWVkcyB0byBoYXZlIHZhbHVlcyBpbiBwbGFjZSBmb3JcbiAgICAgICAgLy8gdGhlIG9ic2VydmVkIHByb3BlcnRpZXMgYXQgdGhlIG1vbWVudCB0aGUgcmFjdGl2ZSBpcyBjcmVhdGVkLiBCdXQgdGhpcyBpcyBwcmV0dHkgdW51c3VhbCBmb3IgSmF2YXNjcmlwdCwgdG8gaGF2ZVxuICAgICAgICAvLyB0byBkZWZpbmUgdGhlIHdob2xlIHNrZWxldG9uIGZvciB0aGUgb2JqZWN0IGluc3RlYWQgb2YganVzdCBhZGRpbmcgcHJvcGVydGllcyB3aGVuZXZlciB5b3Ugd2FudC5cbiAgICAgICAgLy8gVGhlIGFsdGVybmF0aXZlIHdvdWxkIGJlIGZvciB1cyB0byBrZWVwIG91ciBvd24gXCJkYXRhIGJpbmRpbmdcIiBiZXR3ZWVuIHRoZSBwYWdlRGF0YSBhbmQgcmFjdGl2ZSBpbnN0YW5jZXMgKDEgdG8gbWFueSlcbiAgICAgICAgLy8gYW5kIHRlbGwgdGhlIHJhY3RpdmVzIHRvIHVwZGF0ZSB3aGVuZXZlciB0aGUgZGF0YSBjaGFuZ2VzLlxuICAgICAgICBwYWdlRGF0YSA9IHtcbiAgICAgICAgICAgIHBhZ2VIYXNoOiBoYXNoLFxuICAgICAgICAgICAgc3VtbWFyeVJlYWN0aW9uczoge30sXG4gICAgICAgICAgICBzdW1tYXJ5VG90YWw6IDAsXG4gICAgICAgICAgICBzdW1tYXJ5TG9hZGVkOiBmYWxzZSxcbiAgICAgICAgICAgIGNvbnRhaW5lcnM6IHt9LFxuICAgICAgICAgICAgbWV0cmljczoge30gLy8gVGhpcyBpcyBhIGNhdGNoLWFsbCBmaWVsZCB3aGVyZSB3ZSBjYW4gYXR0YWNoIGNsaWVudC1zaWRlIG1ldHJpY3MgZm9yIGFuYWx5dGljc1xuICAgICAgICB9O1xuICAgICAgICBwYWdlc1toYXNoXSA9IHBhZ2VEYXRhO1xuICAgIH1cbiAgICByZXR1cm4gcGFnZURhdGE7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZUFsbFBhZ2VEYXRhKGpzb25QYWdlcywgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBhbGxQYWdlcyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwganNvblBhZ2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBwYWdlRGF0YSA9IHVwZGF0ZVBhZ2VEYXRhKGpzb25QYWdlc1tpXSwgZ3JvdXBTZXR0aW5ncylcbiAgICAgICAgYWxsUGFnZXMucHVzaChwYWdlRGF0YSk7XG4gICAgICAgIEV2ZW50cy5wb3N0UGFnZURhdGFMb2FkZWQocGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gdXBkYXRlUGFnZURhdGEoanNvbiwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBwYWdlRGF0YSA9IGdldFBhZ2VEYXRhRm9ySnNvblJlc3BvbnNlKGpzb24pO1xuICAgIHBhZ2VEYXRhLnBhZ2VJZCA9IGpzb24uaWQ7XG4gICAgcGFnZURhdGEucGFnZUhhc2ggPSBqc29uLnBhZ2VIYXNoO1xuICAgIHBhZ2VEYXRhLmdyb3VwSWQgPSBncm91cFNldHRpbmdzLmdyb3VwSWQoKTtcbiAgICBwYWdlRGF0YS5jYW5vbmljYWxVcmwgPSBqc29uLmNhbm9uaWNhbFVSTDtcbiAgICBwYWdlRGF0YS5yZXF1ZXN0ZWRVcmwgPSBqc29uLnJlcXVlc3RlZFVSTDtcbiAgICBwYWdlRGF0YS5hdXRob3IgPSBqc29uLmF1dGhvcjtcbiAgICBwYWdlRGF0YS5zZWN0aW9uID0ganNvbi5zZWN0aW9uO1xuICAgIHBhZ2VEYXRhLnRvcGljcyA9IGpzb24udG9waWNzO1xuICAgIHBhZ2VEYXRhLnRpdGxlID0ganNvbi50aXRsZTtcbiAgICBwYWdlRGF0YS5pbWFnZSA9IGpzb24uaW1hZ2U7XG5cbiAgICB2YXIgc3VtbWFyeVJlYWN0aW9ucyA9IGpzb24uc3VtbWFyeVJlYWN0aW9ucztcbiAgICBwYWdlRGF0YS5zdW1tYXJ5UmVhY3Rpb25zID0gc3VtbWFyeVJlYWN0aW9ucztcbiAgICBzZXRDb250YWluZXJzKHBhZ2VEYXRhLCBqc29uLmNvbnRhaW5lcnMpO1xuXG4gICAgLy8gV2UgYWRkIHVwIHRoZSBzdW1tYXJ5IHJlYWN0aW9uIHRvdGFsIGNsaWVudC1zaWRlXG4gICAgdmFyIHRvdGFsID0gMDtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN1bW1hcnlSZWFjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdG90YWwgPSB0b3RhbCArIHN1bW1hcnlSZWFjdGlvbnNbaV0uY291bnQ7XG4gICAgfVxuICAgIHBhZ2VEYXRhLnN1bW1hcnlUb3RhbCA9IHRvdGFsO1xuICAgIHBhZ2VEYXRhLnN1bW1hcnlMb2FkZWQgPSB0cnVlO1xuXG4gICAgLy8gV2UgYWRkIHVwIHRoZSBjb250YWluZXIgcmVhY3Rpb24gdG90YWxzIGNsaWVudC1zaWRlXG4gICAgdmFyIHRvdGFsID0gMDtcbiAgICB2YXIgY29udGFpbmVyQ291bnRzID0gW107XG4gICAgdmFyIGNvbnRhaW5lcnMgPSBwYWdlRGF0YS5jb250YWluZXJzO1xuICAgIGZvciAodmFyIGhhc2ggaW4gY29udGFpbmVycykge1xuICAgICAgICBpZiAoY29udGFpbmVycy5oYXNPd25Qcm9wZXJ0eShoYXNoKSkge1xuICAgICAgICAgICAgdmFyIGNvbnRhaW5lciA9IGNvbnRhaW5lcnNbaGFzaF07XG4gICAgICAgICAgICB2YXIgdG90YWwgPSAwO1xuICAgICAgICAgICAgdmFyIGNvbnRhaW5lclJlYWN0aW9ucyA9IGNvbnRhaW5lci5yZWFjdGlvbnM7XG4gICAgICAgICAgICBpZiAoY29udGFpbmVyUmVhY3Rpb25zKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb250YWluZXJSZWFjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdG90YWwgPSB0b3RhbCArIGNvbnRhaW5lclJlYWN0aW9uc1tpXS5jb3VudDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb250YWluZXIucmVhY3Rpb25Ub3RhbCA9IHRvdGFsO1xuICAgICAgICAgICAgY29udGFpbmVyQ291bnRzLnB1c2goeyBjb3VudDogdG90YWwsIGNvbnRhaW5lcjogY29udGFpbmVyIH0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIHZhciBpbmRpY2F0b3JMaW1pdCA9IGdyb3VwU2V0dGluZ3MudGV4dEluZGljYXRvckxpbWl0KCk7XG4gICAgaWYgKGluZGljYXRvckxpbWl0KSB7XG4gICAgICAgIC8vIElmIGFuIGluZGljYXRvciBsaW1pdCBpcyBzZXQsIHNvcnQgdGhlIGNvbnRhaW5lcnMgYW5kIG1hcmsgb25seSB0aGUgdG9wIE4gdG8gYmUgdmlzaWJsZS5cbiAgICAgICAgY29udGFpbmVyQ291bnRzLnNvcnQoZnVuY3Rpb24oYSwgYikgeyByZXR1cm4gYi5jb3VudCAtIGEuY291bnQ7IH0pOyAvLyBzb3J0IGxhcmdlc3QgY291bnQgZmlyc3RcbiAgICAgICAgZm9yICh2YXIgaSA9IGluZGljYXRvckxpbWl0OyBpIDwgY29udGFpbmVyQ291bnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb250YWluZXJDb3VudHNbaV0uY29udGFpbmVyLnN1cHByZXNzID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBwYWdlRGF0YTtcbn1cblxuZnVuY3Rpb24gZ2V0Q29udGFpbmVyRGF0YShwYWdlRGF0YSwgY29udGFpbmVySGFzaCkge1xuICAgIHZhciBjb250YWluZXJEYXRhID0gcGFnZURhdGEuY29udGFpbmVyc1tjb250YWluZXJIYXNoXTtcbiAgICBpZiAoIWNvbnRhaW5lckRhdGEpIHtcbiAgICAgICAgY29udGFpbmVyRGF0YSA9IHtcbiAgICAgICAgICAgIGhhc2g6IGNvbnRhaW5lckhhc2gsXG4gICAgICAgICAgICByZWFjdGlvblRvdGFsOiAwLFxuICAgICAgICAgICAgcmVhY3Rpb25zOiBbXSxcbiAgICAgICAgICAgIGxvYWRlZDogcGFnZURhdGEuc3VtbWFyeUxvYWRlZCxcbiAgICAgICAgICAgIHN1cHByZXNzOiBmYWxzZVxuICAgICAgICB9O1xuICAgICAgICBwYWdlRGF0YS5jb250YWluZXJzW2NvbnRhaW5lckhhc2hdID0gY29udGFpbmVyRGF0YTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbnRhaW5lckRhdGE7XG59XG5cbi8vIE1lcmdlIHRoZSBnaXZlbiBjb250YWluZXIgZGF0YSBpbnRvIHRoZSBwYWdlRGF0YS5jb250YWluZXJzIGRhdGEuIFRoaXMgaXMgbmVjZXNzYXJ5IGJlY2F1c2UgdGhlIHNrZWxldG9uIG9mIHRoZSBwYWdlRGF0YS5jb250YWluZXJzIG1hcFxuLy8gaXMgc2V0IHVwIGFuZCBib3VuZCB0byB0aGUgVUkgYmVmb3JlIGFsbCB0aGUgZGF0YSBpcyBmZXRjaGVkIGZyb20gdGhlIHNlcnZlciBhbmQgd2UgZG9uJ3Qgd2FudCB0byBicmVhayB0aGUgZGF0YSBiaW5kaW5nLlxuZnVuY3Rpb24gc2V0Q29udGFpbmVycyhwYWdlRGF0YSwganNvbkNvbnRhaW5lcnMpIHtcbiAgICBmb3IgKHZhciBoYXNoIGluIGpzb25Db250YWluZXJzKSB7XG4gICAgICAgIGlmIChqc29uQ29udGFpbmVycy5oYXNPd25Qcm9wZXJ0eShoYXNoKSkge1xuICAgICAgICAgICAgdmFyIGNvbnRhaW5lckRhdGEgPSBnZXRDb250YWluZXJEYXRhKHBhZ2VEYXRhLCBoYXNoKTtcbiAgICAgICAgICAgIHZhciBmZXRjaGVkQ29udGFpbmVyRGF0YSA9IGpzb25Db250YWluZXJzW2hhc2hdO1xuICAgICAgICAgICAgY29udGFpbmVyRGF0YS5pZCA9IGZldGNoZWRDb250YWluZXJEYXRhLmlkO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBmZXRjaGVkQ29udGFpbmVyRGF0YS5yZWFjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjb250YWluZXJEYXRhLnJlYWN0aW9ucy5wdXNoKGZldGNoZWRDb250YWluZXJEYXRhLnJlYWN0aW9uc1tpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgdmFyIGFsbENvbnRhaW5lcnMgPSBwYWdlRGF0YS5jb250YWluZXJzO1xuICAgIGZvciAodmFyIGhhc2ggaW4gYWxsQ29udGFpbmVycykge1xuICAgICAgICBpZiAoYWxsQ29udGFpbmVycy5oYXNPd25Qcm9wZXJ0eShoYXNoKSkge1xuICAgICAgICAgICAgdmFyIGNvbnRhaW5lciA9IGFsbENvbnRhaW5lcnNbaGFzaF07XG4gICAgICAgICAgICBjb250YWluZXIubG9hZGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gY2xlYXJJbmRpY2F0b3JMaW1pdChwYWdlRGF0YSkge1xuICAgIHZhciBjb250YWluZXJzID0gcGFnZURhdGEuY29udGFpbmVycztcbiAgICBmb3IgKHZhciBoYXNoIGluIGNvbnRhaW5lcnMpIHtcbiAgICAgICAgaWYgKGNvbnRhaW5lcnMuaGFzT3duUHJvcGVydHkoaGFzaCkpIHtcbiAgICAgICAgICAgIHZhciBjb250YWluZXIgPSBjb250YWluZXJzW2hhc2hdO1xuICAgICAgICAgICAgY29udGFpbmVyLnN1cHByZXNzID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8vIFJldHVybnMgdGhlIGxvY2F0aW9ucyB3aGVyZSB0aGUgZ2l2ZW4gcmVhY3Rpb24gb2NjdXJzIG9uIHRoZSBwYWdlLiBUaGUgcmV0dXJuIGZvcm1hdCBpczpcbi8vIHtcbi8vICAgPGNvbnRlbnRfaWQ+IDoge1xuLy8gICAgIGNvdW50OiA8bnVtYmVyPixcbi8vICAgICBpZDogPGNvbnRlbnRfaWQ+LFxuLy8gICAgIGNvbnRhaW5lcklEOiA8Y29udGFpbmVyX2lkPlxuLy8gICAgIGtpbmQ6IDxjb250ZW50IGtpbmQ+LFxuLy8gICAgIGxvY2F0aW9uOiA8bG9jYXRpb24+LFxuLy8gICAgIFtib2R5OiA8Ym9keT5dIGZpbGxlZCBpbiBsYXRlciB2aWEgdXBkYXRlTG9jYXRpb25EYXRhXG4vLyAgIH1cbi8vIH1cbmZ1bmN0aW9uIGdldFJlYWN0aW9uTG9jYXRpb25EYXRhKHJlYWN0aW9uLCBwYWdlRGF0YSkge1xuICAgIGlmICghcGFnZURhdGEubG9jYXRpb25EYXRhKSB7IC8vIFBvcHVsYXRlIHRoaXMgdHJlZSBsYXppbHksIHNpbmNlIGl0J3Mgbm90IGZyZXF1ZW50bHkgdXNlZC5cbiAgICAgICAgcGFnZURhdGEubG9jYXRpb25EYXRhID0gY29tcHV0ZUxvY2F0aW9uRGF0YShwYWdlRGF0YSk7XG4gICAgfVxuICAgIHJldHVybiBwYWdlRGF0YS5sb2NhdGlvbkRhdGFbcmVhY3Rpb24uaWRdO1xufVxuXG4vLyBSZXR1cm5zIGEgdmlldyBvbiB0aGUgZ2l2ZW4gdHJlZSBzdHJ1Y3R1cmUgdGhhdCdzIG9wdGltaXplZCBmb3IgcmVuZGVyaW5nIHRoZSBsb2NhdGlvbiBvZiByZWFjdGlvbnMgKGFzIGZyb20gdGhlXG4vLyBzdW1tYXJ5IHdpZGdldCkuIEZvciBlYWNoIHJlYWN0aW9uLCB3ZSBjYW4gcXVpY2tseSBnZXQgdG8gdGhlIHBpZWNlcyBvZiBjb250ZW50IHRoYXQgaGF2ZSB0aGF0IHJlYWN0aW9uIGFzIHdlbGwgYXNcbi8vIHRoZSBjb3VudCBvZiB0aG9zZSByZWFjdGlvbnMgZm9yIGVhY2ggcGllY2Ugb2YgY29udGVudC5cbi8vXG4vLyBUaGUgc3RydWN0dXJlIGxvb2tzIGxpa2UgdGhpczpcbi8vIHtcbi8vICAgPHJlYWN0aW9uX2lkPiA6IHsgICAodGhpcyBpcyB0aGUgaW50ZXJhY3Rpb25fbm9kZV9pZClcbi8vICAgICA8Y29udGVudF9pZD4gOiB7XG4vLyAgICAgICBjb3VudCA6IDxudW1iZXI+LFxuLy8gICAgICAgY29udGFpbmVySUQ6IDxjb250YWluZXJfaWQ+LFxuLy8gICAgICAga2luZDogPGNvbnRlbnQga2luZD4sXG4vLyAgICAgICBsb2NhdGlvbjogPGxvY2F0aW9uPlxuLy8gICAgICAgW2JvZHk6IDxib2R5Pl0gZmlsbGVkIGluIGxhdGVyIHZpYSB1cGRhdGVMb2NhdGlvbkRhdGFcbi8vICAgICB9XG4vLyAgIH1cbi8vIH1cbmZ1bmN0aW9uIGNvbXB1dGVMb2NhdGlvbkRhdGEocGFnZURhdGEpIHtcbiAgICB2YXIgbG9jYXRpb25EYXRhID0ge307XG4gICAgdmFyIGNvbnRhaW5lcnMgPSBwYWdlRGF0YS5jb250YWluZXJzO1xuICAgIGZvciAodmFyIGhhc2ggaW4gY29udGFpbmVycykge1xuICAgICAgICBpZiAoY29udGFpbmVycy5oYXNPd25Qcm9wZXJ0eShoYXNoKSkge1xuICAgICAgICAgICAgdmFyIGNvbnRhaW5lckRhdGEgPSBjb250YWluZXJzW2hhc2hdO1xuICAgICAgICAgICAgdmFyIHJlYWN0aW9ucyA9IGNvbnRhaW5lckRhdGEucmVhY3Rpb25zO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZWFjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgcmVhY3Rpb24gPSByZWFjdGlvbnNbaV07XG4gICAgICAgICAgICAgICAgdmFyIHJlYWN0aW9uSWQgPSByZWFjdGlvbi5pZDtcbiAgICAgICAgICAgICAgICB2YXIgY29udGVudCA9IHJlYWN0aW9uLmNvbnRlbnQ7XG4gICAgICAgICAgICAgICAgdmFyIGNvbnRlbnRJZCA9IGNvbnRlbnQuaWQ7XG4gICAgICAgICAgICAgICAgdmFyIHJlYWN0aW9uTG9jYXRpb25EYXRhID0gbG9jYXRpb25EYXRhW3JlYWN0aW9uSWRdO1xuICAgICAgICAgICAgICAgIGlmICghcmVhY3Rpb25Mb2NhdGlvbkRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVhY3Rpb25Mb2NhdGlvbkRhdGEgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgbG9jYXRpb25EYXRhW3JlYWN0aW9uSWRdID0gcmVhY3Rpb25Mb2NhdGlvbkRhdGE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBjb250ZW50TG9jYXRpb25EYXRhID0gcmVhY3Rpb25Mb2NhdGlvbkRhdGFbY29udGVudElkXTsgLy8gVE9ETzogSXQncyBub3QgcmVhbGx5IHBvc3NpYmxlIHRvIGdldCBhIGhpdCBoZXJlLCBpcyBpdD8gV2Ugc2hvdWxkIG5ldmVyIHNlZSB0d28gaW5zdGFuY2VzIG9mIHRoZSBzYW1lIHJlYWN0aW9uIGZvciB0aGUgc2FtZSBjb250ZW50PyAoVGhlcmUnZCB3b3VsZCBqdXN0IGJlIG9uZSBpbnN0YW5jZSB3aXRoIGEgY291bnQgPiAxLilcbiAgICAgICAgICAgICAgICBpZiAoIWNvbnRlbnRMb2NhdGlvbkRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGVudExvY2F0aW9uRGF0YSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50OiAwLFxuICAgICAgICAgICAgICAgICAgICAgICAga2luZDogY29udGVudC5raW5kLCAvLyBUT0RPOiBXZSBzaG91bGQgbm9ybWFsaXplIHRoaXMgdmFsdWUgdG8gYSBzZXQgb2YgY29uc3RhbnRzLiBmaXggdGhpcyBpbiBsb2NhdGlvbnMtcGFnZSB3aGVyZSB0aGUgdmFsdWUgaXMgcmVhZCBhcyB3ZWxsLlxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogYWxzbyBjb25zaWRlciB0cmFuc2xhdGluZyB0aGlzIGZyb20gdGhlIHJhdyBcImtpbmRcIiB0byBcInR5cGVcIi4gKGUuZy4gXCJwYWdcIiA9PiBcInBhZ2VcIilcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uOiBjb250ZW50LmxvY2F0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGFpbmVySGFzaDogY29udGFpbmVyRGF0YS5oYXNoLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudElkOiBjb250ZW50SWRcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgcmVhY3Rpb25Mb2NhdGlvbkRhdGFbY29udGVudElkXSA9IGNvbnRlbnRMb2NhdGlvbkRhdGE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnRlbnRMb2NhdGlvbkRhdGEuY291bnQgKz0gcmVhY3Rpb24uY291bnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGxvY2F0aW9uRGF0YTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlUmVhY3Rpb25Mb2NhdGlvbkRhdGEocmVhY3Rpb25Mb2NhdGlvbkRhdGEsIGNvbnRlbnRCb2RpZXMpIHtcbiAgICBmb3IgKHZhciBjb250ZW50SWQgaW4gY29udGVudEJvZGllcykge1xuICAgICAgICBpZiAoY29udGVudEJvZGllcy5oYXNPd25Qcm9wZXJ0eShjb250ZW50SWQpKSB7XG4gICAgICAgICAgICB2YXIgY29udGVudExvY2F0aW9uRGF0YSA9IHJlYWN0aW9uTG9jYXRpb25EYXRhW2NvbnRlbnRJZF07XG4gICAgICAgICAgICBpZiAoY29udGVudExvY2F0aW9uRGF0YSkge1xuICAgICAgICAgICAgICAgIGNvbnRlbnRMb2NhdGlvbkRhdGEuYm9keSA9IGNvbnRlbnRCb2RpZXNbY29udGVudElkXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gcmVnaXN0ZXJSZWFjdGlvbihyZWFjdGlvbiwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEpIHtcbiAgICB2YXIgZXhpc3RpbmdSZWFjdGlvbnMgPSBjb250YWluZXJEYXRhLnJlYWN0aW9ucztcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGV4aXN0aW5nUmVhY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChleGlzdGluZ1JlYWN0aW9uc1tpXS5pZCA9PT0gcmVhY3Rpb24uaWQpIHtcbiAgICAgICAgICAgIC8vIFRoaXMgcmVhY3Rpb24gaGFzIGFscmVhZHkgYmVlbiBhZGRlZCB0byB0aGlzIGNvbnRhaW5lci4gRG9uJ3QgYWRkIGl0IGFnYWluLlxuICAgICAgICAgICAgcmV0dXJuIGV4aXN0aW5nUmVhY3Rpb25zW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIGNvbnRhaW5lckRhdGEucmVhY3Rpb25zLnB1c2gocmVhY3Rpb24pO1xuICAgIGNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbCA9IGNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbCArIDE7XG4gICAgdmFyIHN1bW1hcnlSZWFjdGlvbiA9IHtcbiAgICAgICAgdGV4dDogcmVhY3Rpb24udGV4dCxcbiAgICAgICAgaWQ6IHJlYWN0aW9uLmlkLFxuICAgICAgICBjb3VudDogcmVhY3Rpb24uY291bnRcbiAgICB9O1xuICAgIHBhZ2VEYXRhLnN1bW1hcnlSZWFjdGlvbnMucHVzaChzdW1tYXJ5UmVhY3Rpb24pO1xuICAgIHBhZ2VEYXRhLnN1bW1hcnlUb3RhbCA9IHBhZ2VEYXRhLnN1bW1hcnlUb3RhbCArIDE7XG4gICAgcmV0dXJuIHJlYWN0aW9uO1xufVxuXG4vLyBHZXRzIHBhZ2UgZGF0YSBiYXNlZCBvbiBhIFVSTC4gVGhpcyBhbGxvd3Mgb3VyIGNsaWVudCB0byBzdGFydCBwcm9jZXNzaW5nIGEgcGFnZSAoYW5kIGJpbmRpbmcgZGF0YSBvYmplY3RzXG4vLyB0byB0aGUgVUkpICpiZWZvcmUqIHdlIGdldCBkYXRhIGJhY2sgZnJvbSB0aGUgc2VydmVyLlxuZnVuY3Rpb24gZ2V0UGFnZURhdGFCeVVSTCh1cmwpIHtcbiAgICB2YXIgc2VydmVySGFzaCA9IHVybEhhc2hlc1t1cmxdO1xuICAgIGlmIChzZXJ2ZXJIYXNoKSB7XG4gICAgICAgIC8vIElmIHRoZSBzZXJ2ZXIgYWxyZWFkeSBnaXZlbiB1cyB0aGUgaGFzaCBmb3IgdGhlIHBhZ2UsIHVzZSBpdC5cbiAgICAgICAgcmV0dXJuIGdldFBhZ2VEYXRhKHNlcnZlckhhc2gpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIE90aGVyd2lzZSwgdGVtcG9yYXJpbHkgdXNlIHRoZSB1cmwgYXMgdGhlIGhhc2guIFRoaXMgd2lsbCBnZXQgdXBkYXRlZCB3aGVuZXZlciB3ZSBnZXQgZGF0YSBiYWNrIGZyb20gdGhlIHNlcnZlci5cbiAgICAgICAgcmV0dXJuIGdldFBhZ2VEYXRhKHVybCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBnZXRQYWdlRGF0YUZvckpzb25SZXNwb25zZShqc29uKSB7XG4gICAgdmFyIHBhZ2VIYXNoID0ganNvbi5wYWdlSGFzaDtcbiAgICB2YXIgcmVxdWVzdGVkVVJMID0ganNvbi5yZXF1ZXN0ZWRVUkw7XG4gICAgdXJsSGFzaGVzW3JlcXVlc3RlZFVSTF0gPSBwYWdlSGFzaDtcbiAgICB2YXIgdXJsQmFzZWREYXRhID0gcGFnZXNbcmVxdWVzdGVkVVJMXTtcbiAgICBpZiAodXJsQmFzZWREYXRhKSB7XG4gICAgICAgIC8vIHVybEJhc2VkRGF0YSB3ZSd2ZSBhbHJlYWR5IGNyZWF0ZWQvYm91bmQgYSBwYWdlRGF0YSBvYmplY3QgdW5kZXIgdGhlIHJlcXVlc3RlZFVybCwgbW92ZSB0aGF0IGRhdGEgb3ZlclxuICAgICAgICAvLyB0byB0aGUgaGFzaCBrZXlcbiAgICAgICAgcGFnZXNbcGFnZUhhc2hdID0gdXJsQmFzZWREYXRhO1xuICAgICAgICBkZWxldGUgcGFnZXNbcmVxdWVzdGVkVVJMXTtcbiAgICB9XG4gICAgcmV0dXJuIGdldFBhZ2VEYXRhKHBhZ2VIYXNoKTtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGdldFBhZ2VEYXRhQnlVUkw6IGdldFBhZ2VEYXRhQnlVUkwsXG4gICAgZ2V0UGFnZURhdGE6IGdldFBhZ2VEYXRhLFxuICAgIHVwZGF0ZUFsbFBhZ2VEYXRhOiB1cGRhdGVBbGxQYWdlRGF0YSxcbiAgICBnZXRDb250YWluZXJEYXRhOiBnZXRDb250YWluZXJEYXRhLFxuICAgIGdldFJlYWN0aW9uTG9jYXRpb25EYXRhOiBnZXRSZWFjdGlvbkxvY2F0aW9uRGF0YSxcbiAgICB1cGRhdGVSZWFjdGlvbkxvY2F0aW9uRGF0YTogdXBkYXRlUmVhY3Rpb25Mb2NhdGlvbkRhdGEsXG4gICAgcmVnaXN0ZXJSZWFjdGlvbjogcmVnaXN0ZXJSZWFjdGlvbixcbiAgICBjbGVhckluZGljYXRvckxpbWl0OiBjbGVhckluZGljYXRvckxpbWl0XG59OyIsInZhciAkOyByZXF1aXJlKCcuL3V0aWxzL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIEFwcE1vZGUgPSByZXF1aXJlKCcuL3V0aWxzL2FwcC1tb2RlJyk7XG52YXIgSGFzaCA9IHJlcXVpcmUoJy4vdXRpbHMvaGFzaCcpO1xudmFyIE11dGF0aW9uT2JzZXJ2ZXIgPSByZXF1aXJlKCcuL3V0aWxzL211dGF0aW9uLW9ic2VydmVyJyk7XG52YXIgUGFnZVV0aWxzID0gcmVxdWlyZSgnLi91dGlscy9wYWdlLXV0aWxzJyk7XG52YXIgVVJMcyA9IHJlcXVpcmUoJy4vdXRpbHMvdXJscycpO1xudmFyIFdpZGdldEJ1Y2tldCA9IHJlcXVpcmUoJy4vdXRpbHMvd2lkZ2V0LWJ1Y2tldCcpO1xuXG52YXIgQXV0b0NhbGxUb0FjdGlvbiA9IHJlcXVpcmUoJy4vYXV0by1jYWxsLXRvLWFjdGlvbicpO1xudmFyIENhbGxUb0FjdGlvbkluZGljYXRvciA9IHJlcXVpcmUoJy4vY2FsbC10by1hY3Rpb24taW5kaWNhdG9yJyk7XG52YXIgSGFzaGVkRWxlbWVudHMgPSByZXF1aXJlKCcuL2hhc2hlZC1lbGVtZW50cycpO1xudmFyIE1lZGlhSW5kaWNhdG9yV2lkZ2V0ID0gcmVxdWlyZSgnLi9tZWRpYS1pbmRpY2F0b3Itd2lkZ2V0Jyk7XG52YXIgUGFnZURhdGEgPSByZXF1aXJlKCcuL3BhZ2UtZGF0YScpO1xudmFyIFBhZ2VEYXRhTG9hZGVyID0gcmVxdWlyZSgnLi9wYWdlLWRhdGEtbG9hZGVyJyk7XG52YXIgU3VtbWFyeVdpZGdldCA9IHJlcXVpcmUoJy4vc3VtbWFyeS13aWRnZXQnKTtcbnZhciBUZXh0SW5kaWNhdG9yV2lkZ2V0ID0gcmVxdWlyZSgnLi90ZXh0LWluZGljYXRvci13aWRnZXQnKTtcbnZhciBUZXh0UmVhY3Rpb25zID0gcmVxdWlyZSgnLi90ZXh0LXJlYWN0aW9ucycpO1xuXG52YXIgVFlQRV9URVhUID0gXCJ0ZXh0XCI7XG52YXIgVFlQRV9JTUFHRSA9IFwiaW1hZ2VcIjtcbnZhciBUWVBFX01FRElBID0gXCJtZWRpYVwiO1xuXG52YXIgQVRUUl9IQVNIID0gXCJhbnQtaGFzaFwiO1xuXG5cbi8vIFNjYW4gZm9yIGFsbCBwYWdlcyBhdCB0aGUgY3VycmVudCBicm93c2VyIGxvY2F0aW9uLiBUaGlzIGNvdWxkIGp1c3QgYmUgdGhlIGN1cnJlbnQgcGFnZSBvciBpdCBjb3VsZCBiZSBhIGNvbGxlY3Rpb25cbi8vIG9mIHBhZ2VzIChha2EgJ3Bvc3RzJykuXG5mdW5jdGlvbiBzY2FuQWxsUGFnZXMoZ3JvdXBTZXR0aW5ncykge1xuICAgICQoZ3JvdXBTZXR0aW5ncy5leGNsdXNpb25TZWxlY3RvcigpKS5hZGRDbGFzcygnbm8tYW50Jyk7IC8vIEFkZCB0aGUgbm8tYW50IGNsYXNzIHRvIGV2ZXJ5dGhpbmcgdGhhdCBpcyBmbGFnZ2VkIGZvciBleGNsdXNpb25cbiAgICB2YXIgJHBhZ2VzID0gJChncm91cFNldHRpbmdzLnBhZ2VTZWxlY3RvcigpKTsgLy8gVE9ETzogbm8tYW50P1xuICAgIGlmICgkcGFnZXMubGVuZ3RoID09IDApIHtcbiAgICAgICAgLy8gSWYgd2UgZG9uJ3QgZGV0ZWN0IGFueSBwYWdlIG1hcmtlcnMsIHRyZWF0IHRoZSB3aG9sZSBkb2N1bWVudCBhcyB0aGUgc2luZ2xlIHBhZ2VcbiAgICAgICAgJHBhZ2VzID0gJCgnYm9keScpOyAvLyBUT0RPOiBJcyB0aGlzIHRoZSByaWdodCBiZWhhdmlvcj8gKEtlZXAgaW4gc3luYyB3aXRoIHRoZSBzYW1lIGFzc3VtcHRpb24gdGhhdCdzIGJ1aWx0IGludG8gcGFnZS1kYXRhLWxvYWRlci4pXG4gICAgfVxuICAgICRwYWdlcy5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgJHBhZ2UgPSAkKHRoaXMpO1xuICAgICAgICBzY2FuUGFnZSgkcGFnZSwgZ3JvdXBTZXR0aW5ncywgJHBhZ2VzLmxlbmd0aCA+IDEpO1xuICAgIH0pO1xuICAgIE11dGF0aW9uT2JzZXJ2ZXIuYWRkQWRkaXRpb25MaXN0ZW5lcihlbGVtZW50c0FkZGVkKGdyb3VwU2V0dGluZ3MpKTtcbn1cblxuLy8gU2NhbiB0aGUgcGFnZSB1c2luZyB0aGUgZ2l2ZW4gc2V0dGluZ3M6XG4vLyAxLiBGaW5kIGFsbCB0aGUgY29udGFpbmVycyB0aGF0IHdlIGNhcmUgYWJvdXQuXG4vLyAyLiBDb21wdXRlIGhhc2hlcyBmb3IgZWFjaCBjb250YWluZXIuXG4vLyAzLiBJbnNlcnQgd2lkZ2V0IGFmZm9yZGFuY2VzIGZvciBlYWNoIHdoaWNoIGFyZSBib3VuZCB0byB0aGUgZGF0YSBtb2RlbCBieSB0aGUgaGFzaGVzLlxuZnVuY3Rpb24gc2NhblBhZ2UoJHBhZ2UsIGdyb3VwU2V0dGluZ3MsIGlzTXVsdGlQYWdlKSB7XG4gICAgdmFyIHVybCA9IFBhZ2VVdGlscy5jb21wdXRlUGFnZVVybCgkcGFnZSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgdmFyIHBhZ2VEYXRhID0gUGFnZURhdGEuZ2V0UGFnZURhdGFCeVVSTCh1cmwpO1xuICAgIHZhciAkYWN0aXZlU2VjdGlvbnMgPSBmaW5kKCRwYWdlLCBncm91cFNldHRpbmdzLmFjdGl2ZVNlY3Rpb25zKCksIHRydWUpO1xuXG4gICAgLy8gRmlyc3QsIHNjYW4gZm9yIGVsZW1lbnRzIHRoYXQgd291bGQgY2F1c2UgdXMgdG8gaW5zZXJ0IHNvbWV0aGluZyBpbnRvIHRoZSBET00gdGhhdCB0YWtlcyB1cCBzcGFjZS5cbiAgICAvLyBXZSB3YW50IHRvIGdldCBhbnkgcGFnZSByZXNpemluZyBvdXQgb2YgdGhlIHdheSBhcyBlYXJseSBhcyBwb3NzaWJsZS5cbiAgICAvLyBUT0RPOiBDb25zaWRlciBkb2luZyB0aGlzIHdpdGggcmF3IEphdmFzY3JpcHQgYmVmb3JlIGpRdWVyeSBsb2FkcywgdG8gZnVydGhlciByZWR1Y2UgdGhlIGRlbGF5LiBXZSB3b3VsZG4ndFxuICAgIC8vIHNhdmUgYSAqdG9uKiBvZiB0aW1lIGZyb20gdGhpcywgdGhvdWdoLCBzbyBpdCdzIGRlZmluaXRlbHkgYSBsYXRlciBvcHRpbWl6YXRpb24uXG4gICAgc2NhbkZvclN1bW1hcmllcygkcGFnZSwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpOyAvLyBUT0RPOiBzaG91bGQgdGhlIHN1bW1hcnkgc2VhcmNoIGJlIGNvbmZpbmVkIHRvIHRoZSBhY3RpdmUgc2VjdGlvbnM/XG4gICAgJGFjdGl2ZVNlY3Rpb25zLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkc2VjdGlvbiA9ICQodGhpcyk7XG4gICAgICAgIGNyZWF0ZUF1dG9DYWxsc1RvQWN0aW9uKCRzZWN0aW9uLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgfSk7XG4gICAgLy8gU2NhbiBmb3IgQ1RBcyBhY3Jvc3MgdGhlIGVudGlyZSBwYWdlICh0aGV5IGNhbiBiZSBvdXRzaWRlIGFuIGFjdGl2ZSBzZWN0aW9uKS4gQ1RBcyBoYXZlIHRvIGdvIGJlZm9yZSBzY2FucyBmb3JcbiAgICAvLyBjb250ZW50IGJlY2F1c2UgY29udGVudCBpbnZvbHZlZCBpbiBDVEFzIHdpbGwgYmUgdGFnZ2VkIG5vLWFudC5cbiAgICBzY2FuRm9yQ2FsbHNUb0FjdGlvbigkcGFnZSwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgIC8vIFRoZW4gc2NhbiBmb3IgZXZlcnl0aGluZyBlbHNlXG4gICAgJGFjdGl2ZVNlY3Rpb25zLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkc2VjdGlvbiA9ICQodGhpcyk7XG4gICAgICAgIHNjYW5BY3RpdmVFbGVtZW50KCRzZWN0aW9uLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgfSk7XG5cbiAgICBwYWdlRGF0YS5tZXRyaWNzLmhlaWdodCA9IGNvbXB1dGVQYWdlSGVpZ2h0KCRhY3RpdmVTZWN0aW9ucyk7XG4gICAgcGFnZURhdGEubWV0cmljcy5pc011bHRpUGFnZSA9IGlzTXVsdGlQYWdlO1xufVxuXG5mdW5jdGlvbiBjb21wdXRlUGFnZUhlaWdodCgkYWN0aXZlU2VjdGlvbnMpIHtcbiAgICB2YXIgY29udGVudFRvcDtcbiAgICB2YXIgY29udGVudEJvdHRvbTtcbiAgICAkYWN0aXZlU2VjdGlvbnMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRzZWN0aW9uID0gJCh0aGlzKTtcbiAgICAgICAgdmFyIG9mZnNldCA9ICRzZWN0aW9uLm9mZnNldCgpO1xuICAgICAgICBjb250ZW50VG9wID0gY29udGVudFRvcCA9PT0gdW5kZWZpbmVkID8gb2Zmc2V0LnRvcCA6IE1hdGgubWluKGNvbnRlbnRUb3AsIG9mZnNldC50b3ApO1xuICAgICAgICB2YXIgYm90dG9tID0gb2Zmc2V0LnRvcCArICRzZWN0aW9uLm91dGVySGVpZ2h0KCk7XG4gICAgICAgIGNvbnRlbnRCb3R0b20gPSBjb250ZW50Qm90dG9tID09PSB1bmRlZmluZWQgPyBib3R0b20gOiBNYXRoLm1heChjb250ZW50Qm90dG9tLCBib3R0b20pO1xuICAgIH0pO1xuICAgIHJldHVybiBjb250ZW50Qm90dG9tIC0gY29udGVudFRvcDtcbn1cblxuLy8gU2NhbnMgdGhlIGdpdmVuIGVsZW1lbnQsIHdoaWNoIGFwcGVhcnMgaW5zaWRlIGFuIGFjdGl2ZSBzZWN0aW9uLiBUaGUgZWxlbWVudCBjYW4gYmUgdGhlIGVudGlyZSBhY3RpdmUgc2VjdGlvbixcbi8vIHNvbWUgY29udGFpbmVyIHdpdGhpbiB0aGUgYWN0aXZlIHNlY3Rpb24sIG9yIGEgbGVhZiBub2RlIGluIHRoZSBhY3RpdmUgc2VjdGlvbi5cbmZ1bmN0aW9uIHNjYW5BY3RpdmVFbGVtZW50KCRlbGVtZW50LCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHNjYW5Gb3JDb250ZW50KCRlbGVtZW50LCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG59XG5cbmZ1bmN0aW9uIHNjYW5Gb3JTdW1tYXJpZXMoJGVsZW1lbnQsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyICRzdW1tYXJpZXMgPSBmaW5kKCRlbGVtZW50LCBncm91cFNldHRpbmdzLnN1bW1hcnlTZWxlY3RvcigpLCB0cnVlKTtcbiAgICAkc3VtbWFyaWVzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkc3VtbWFyeSA9ICQodGhpcyk7XG4gICAgICAgIHZhciBjb250YWluZXJEYXRhID0gUGFnZURhdGEuZ2V0Q29udGFpbmVyRGF0YShwYWdlRGF0YSwgJ3BhZ2UnKTsgLy8gTWFnaWMgaGFzaCBmb3IgcGFnZSByZWFjdGlvbnNcbiAgICAgICAgY29udGFpbmVyRGF0YS50eXBlID0gJ3BhZ2UnOyAvLyBUT0RPOiByZXZpc2l0IHdoZXRoZXIgaXQgbWFrZXMgc2Vuc2UgdG8gc2V0IHRoZSB0eXBlIGhlcmVcbiAgICAgICAgdmFyIGRlZmF1bHRSZWFjdGlvbnMgPSBncm91cFNldHRpbmdzLmRlZmF1bHRSZWFjdGlvbnMoJHN1bW1hcnkpOyAvLyBUT0RPOiBkbyB3ZSBzdXBwb3J0IGN1c3RvbWl6aW5nIHRoZSBkZWZhdWx0IHJlYWN0aW9ucyBhdCB0aGlzIGxldmVsP1xuICAgICAgICB2YXIgJHN1bW1hcnlFbGVtZW50ID0gU3VtbWFyeVdpZGdldC5jcmVhdGUoY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGRlZmF1bHRSZWFjdGlvbnMsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICBpbnNlcnRDb250ZW50KCRzdW1tYXJ5LCAkc3VtbWFyeUVsZW1lbnQsIGdyb3VwU2V0dGluZ3Muc3VtbWFyeU1ldGhvZCgpKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gc2NhbkZvckNhbGxzVG9BY3Rpb24oJGVsZW1lbnQsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGN0YVRhcmdldHMgPSB7fTsgLy8gVGhlIGVsZW1lbnRzIHRoYXQgdGhlIGNhbGwgdG8gYWN0aW9ucyBhY3Qgb24gKGUuZy4gdGhlIGltYWdlIG9yIHZpZGVvKVxuICAgIGZpbmQoJGVsZW1lbnQsICdbYW50LWl0ZW1dJywgdHJ1ZSkuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRjdGFUYXJnZXQgPSAkKHRoaXMpO1xuICAgICAgICAkY3RhVGFyZ2V0LmFkZENsYXNzKCduby1hbnQnKTsgLy8gZG9uJ3Qgc2hvdyB0aGUgbm9ybWFsIHJlYWN0aW9uIGFmZm9yZGFuY2Ugb24gYSBjdGEgdGFyZ2V0XG4gICAgICAgIHZhciBhbnRJdGVtSWQgPSAkY3RhVGFyZ2V0LmF0dHIoJ2FudC1pdGVtJykudHJpbSgpO1xuICAgICAgICBjdGFUYXJnZXRzW2FudEl0ZW1JZF0gPSAkY3RhVGFyZ2V0O1xuICAgIH0pO1xuXG4gICAgdmFyIGN0YUxhYmVscyA9IHt9OyAvLyBPcHRpb25hbCBlbGVtZW50cyB0aGF0IHJlcG9ydCB0aGUgbnVtYmVyIG9mIHJlYWN0aW9ucyB0byB0aGUgY3RhIChlLmcuIFwiMSByZWFjdGlvblwiKVxuICAgIGZpbmQoJGVsZW1lbnQsICdbYW50LXJlYWN0aW9ucy1sYWJlbC1mb3JdJywgdHJ1ZSkuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRjdGFMYWJlbCA9ICQodGhpcyk7XG4gICAgICAgICRjdGFMYWJlbC5hZGRDbGFzcygnbm8tYW50Jyk7IC8vIGRvbid0IHNob3cgdGhlIG5vcm1hbCByZWFjdGlvbiBhZmZvcmRhbmNlIG9uIGEgY3RhIGxhYmVsXG4gICAgICAgIHZhciBhbnRJdGVtSWQgPSAkY3RhTGFiZWwuYXR0cignYW50LXJlYWN0aW9ucy1sYWJlbC1mb3InKS50cmltKCk7XG4gICAgICAgIGN0YUxhYmVsc1thbnRJdGVtSWRdID0gY3RhTGFiZWxzW2FudEl0ZW1JZF0gfHwgW107XG4gICAgICAgIGN0YUxhYmVsc1thbnRJdGVtSWRdLnB1c2goJGN0YUxhYmVsKTtcbiAgICB9KTtcblxuICAgIHZhciBjdGFDb3VudGVycyA9IHt9OyAvLyBPcHRpb25hbCBlbGVtZW50cyB0aGF0IHJlcG9ydCBvbmx5IHRoZSBjb3VudCBvZiByZWFjdGlvbiB0byBhIGN0YSAoZS5nLiBcIjFcIilcbiAgICBmaW5kKCRlbGVtZW50LCAnW2FudC1jb3VudGVyLWZvcl0nLCB0cnVlKS5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgJGN0YUNvdW50ZXIgPSAkKHRoaXMpO1xuICAgICAgICAkY3RhQ291bnRlci5hZGRDbGFzcygnbm8tYW50Jyk7IC8vIGRvbid0IHNob3cgdGhlIG5vcm1hbCByZWFjdGlvbiBhZmZvcmRhbmNlIG9uIGEgY3RhIGNvdW50ZXJcbiAgICAgICAgdmFyIGFudEl0ZW1JZCA9ICRjdGFDb3VudGVyLmF0dHIoJ2FudC1jb3VudGVyLWZvcicpLnRyaW0oKTtcbiAgICAgICAgY3RhQ291bnRlcnNbYW50SXRlbUlkXSA9IGN0YUNvdW50ZXJzW2FudEl0ZW1JZF0gfHwgW107XG4gICAgICAgIGN0YUNvdW50ZXJzW2FudEl0ZW1JZF0ucHVzaCgkY3RhQ291bnRlcik7XG4gICAgfSk7XG5cbiAgICB2YXIgJGN0YUVsZW1lbnRzID0gZmluZCgkZWxlbWVudCwgJ1thbnQtY3RhLWZvcl0nKTsgLy8gVGhlIGNhbGwgdG8gYWN0aW9uIGVsZW1lbnRzIHdoaWNoIHByb21wdCB0aGUgdXNlciB0byByZWFjdFxuICAgICRjdGFFbGVtZW50cy5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgJGN0YUVsZW1lbnQgPSAkKHRoaXMpO1xuICAgICAgICB2YXIgYW50SXRlbUlkID0gJGN0YUVsZW1lbnQuYXR0cignYW50LWN0YS1mb3InKTtcbiAgICAgICAgdmFyICR0YXJnZXRFbGVtZW50ID0gY3RhVGFyZ2V0c1thbnRJdGVtSWRdO1xuICAgICAgICBpZiAoJHRhcmdldEVsZW1lbnQpIHtcbiAgICAgICAgICAgIHZhciBoYXNoID0gY29tcHV0ZUhhc2goJHRhcmdldEVsZW1lbnQsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgIHZhciBjb250ZW50RGF0YSA9IGNvbXB1dGVDb250ZW50RGF0YSgkdGFyZ2V0RWxlbWVudCwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICBpZiAoaGFzaCAmJiBjb250ZW50RGF0YSkge1xuICAgICAgICAgICAgICAgIHZhciBjb250YWluZXJEYXRhID0gUGFnZURhdGEuZ2V0Q29udGFpbmVyRGF0YShwYWdlRGF0YSwgaGFzaCk7XG4gICAgICAgICAgICAgICAgY29udGFpbmVyRGF0YS50eXBlID0gY29tcHV0ZUVsZW1lbnRUeXBlKCR0YXJnZXRFbGVtZW50KTsgLy8gVE9ETzogcmV2aXNpdCB3aGV0aGVyIGl0IG1ha2VzIHNlbnNlIHRvIHNldCB0aGUgdHlwZSBoZXJlXG4gICAgICAgICAgICAgICAgQ2FsbFRvQWN0aW9uSW5kaWNhdG9yLmNyZWF0ZSh7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lckRhdGE6IGNvbnRhaW5lckRhdGEsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lckVsZW1lbnQ6ICR0YXJnZXRFbGVtZW50LFxuICAgICAgICAgICAgICAgICAgICBjb250ZW50RGF0YTogY29udGVudERhdGEsXG4gICAgICAgICAgICAgICAgICAgIGN0YUVsZW1lbnQ6ICRjdGFFbGVtZW50LFxuICAgICAgICAgICAgICAgICAgICBjdGFMYWJlbHM6IGN0YUxhYmVsc1thbnRJdGVtSWRdLFxuICAgICAgICAgICAgICAgICAgICBjdGFDb3VudGVyczogY3RhQ291bnRlcnNbYW50SXRlbUlkXSxcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdFJlYWN0aW9uczogZ3JvdXBTZXR0aW5ncy5kZWZhdWx0UmVhY3Rpb25zKCR0YXJnZXRFbGVtZW50KSxcbiAgICAgICAgICAgICAgICAgICAgcGFnZURhdGE6IHBhZ2VEYXRhLFxuICAgICAgICAgICAgICAgICAgICBncm91cFNldHRpbmdzOiBncm91cFNldHRpbmdzXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KVxufVxuXG5mdW5jdGlvbiBjcmVhdGVBdXRvQ2FsbHNUb0FjdGlvbigkc2VjdGlvbiwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgJGN0YVRhcmdldHMgPSBmaW5kKCRzZWN0aW9uLCBncm91cFNldHRpbmdzLmdlbmVyYXRlZEN0YVNlbGVjdG9yKCkpO1xuICAgICRjdGFUYXJnZXRzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkY3RhVGFyZ2V0ID0gJCh0aGlzKTtcbiAgICAgICAgdmFyIGFudEl0ZW1JZCA9IGdlbmVyYXRlQW50SXRlbUF0dHJpYnV0ZSgpO1xuICAgICAgICAkY3RhVGFyZ2V0LmF0dHIoJ2FudC1pdGVtJywgYW50SXRlbUlkKTtcbiAgICAgICAgdmFyICRjdGEgPSBBdXRvQ2FsbFRvQWN0aW9uLmNyZWF0ZShhbnRJdGVtSWQpO1xuICAgICAgICAkY3RhVGFyZ2V0LmFmdGVyKCRjdGEpOyAvLyBUT0RPOiBtYWtlIHRoZSBpbnNlcnQgYmVoYXZpb3IgY29uZmlndXJhYmxlIGxpa2UgdGhlIHN1bW1hcnlcbiAgICB9KTtcbn1cblxudmFyIGdlbmVyYXRlQW50SXRlbUF0dHJpYnV0ZSA9IGZ1bmN0aW9uKGluZGV4KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gJ2FudGVubmFfYXV0b19jdGFfJyArIGluZGV4Kys7XG4gICAgfVxufSgwKTtcblxuZnVuY3Rpb24gc2NhbkZvckNvbnRlbnQoJGVsZW1lbnQsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyICRjb250ZW50RWxlbWVudHMgPSBmaW5kKCRlbGVtZW50LCBncm91cFNldHRpbmdzLmNvbnRlbnRTZWxlY3RvcigpLCB0cnVlKTtcbiAgICAkY29udGVudEVsZW1lbnRzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkY29udGVudEVsZW1lbnQgPSAkKHRoaXMpO1xuICAgICAgICB2YXIgdHlwZSA9IGNvbXB1dGVFbGVtZW50VHlwZSgkY29udGVudEVsZW1lbnQpO1xuICAgICAgICBzd2l0Y2godHlwZSkge1xuICAgICAgICAgICAgY2FzZSBUWVBFX0lNQUdFOlxuICAgICAgICAgICAgY2FzZSBUWVBFX01FRElBOlxuICAgICAgICAgICAgICAgIHNjYW5NZWRpYSgkY29udGVudEVsZW1lbnQsIHR5cGUsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgVFlQRV9URVhUOlxuICAgICAgICAgICAgICAgIHNjYW5UZXh0KCRjb250ZW50RWxlbWVudCwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIHNjYW5UZXh0KCR0ZXh0RWxlbWVudCwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICBpZiAoc2hvdWxkSGFzaFRleHQoJHRleHRFbGVtZW50LCBncm91cFNldHRpbmdzKSkge1xuICAgICAgICB2YXIgaGFzaCA9IGNvbXB1dGVIYXNoKCR0ZXh0RWxlbWVudCwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICBpZiAoaGFzaCkge1xuICAgICAgICAgICAgdmFyIGNvbnRhaW5lckRhdGEgPSBQYWdlRGF0YS5nZXRDb250YWluZXJEYXRhKHBhZ2VEYXRhLCBoYXNoKTtcbiAgICAgICAgICAgIGNvbnRhaW5lckRhdGEudHlwZSA9ICd0ZXh0JzsgLy8gVE9ETzogcmV2aXNpdCB3aGV0aGVyIGl0IG1ha2VzIHNlbnNlIHRvIHNldCB0aGUgdHlwZSBoZXJlXG4gICAgICAgICAgICB2YXIgZGVmYXVsdFJlYWN0aW9ucyA9IGdyb3VwU2V0dGluZ3MuZGVmYXVsdFJlYWN0aW9ucygkdGV4dEVsZW1lbnQpO1xuICAgICAgICAgICAgdmFyICRpbmRpY2F0b3JFbGVtZW50ID0gVGV4dEluZGljYXRvcldpZGdldC5jcmVhdGUoe1xuICAgICAgICAgICAgICAgICAgICBjb250YWluZXJEYXRhOiBjb250YWluZXJEYXRhLFxuICAgICAgICAgICAgICAgICAgICBjb250YWluZXJFbGVtZW50OiAkdGV4dEVsZW1lbnQsXG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHRSZWFjdGlvbnM6IGRlZmF1bHRSZWFjdGlvbnMsXG4gICAgICAgICAgICAgICAgICAgIHBhZ2VEYXRhOiBwYWdlRGF0YSxcbiAgICAgICAgICAgICAgICAgICAgZ3JvdXBTZXR0aW5nczogZ3JvdXBTZXR0aW5nc1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICB2YXIgbGFzdE5vZGUgPSBsYXN0Q29udGVudE5vZGUoJHRleHRFbGVtZW50LmdldCgwKSk7XG4gICAgICAgICAgICBpZiAobGFzdE5vZGUubm9kZVR5cGUgIT09IDMpIHtcbiAgICAgICAgICAgICAgICAkKGxhc3ROb2RlKS5iZWZvcmUoJGluZGljYXRvckVsZW1lbnQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAkdGV4dEVsZW1lbnQuYXBwZW5kKCRpbmRpY2F0b3JFbGVtZW50KTsgLy8gVE9ETyBpcyB0aGlzIGNvbmZpZ3VyYWJsZSBhbGEgaW5zZXJ0Q29udGVudCguLi4pP1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBUZXh0UmVhY3Rpb25zLmNyZWF0ZVJlYWN0YWJsZVRleHQoe1xuICAgICAgICAgICAgICAgIGNvbnRhaW5lckRhdGE6IGNvbnRhaW5lckRhdGEsXG4gICAgICAgICAgICAgICAgY29udGFpbmVyRWxlbWVudDogJHRleHRFbGVtZW50LFxuICAgICAgICAgICAgICAgIGRlZmF1bHRSZWFjdGlvbnM6IGRlZmF1bHRSZWFjdGlvbnMsXG4gICAgICAgICAgICAgICAgcGFnZURhdGE6IHBhZ2VEYXRhLFxuICAgICAgICAgICAgICAgIGdyb3VwU2V0dGluZ3M6IGdyb3VwU2V0dGluZ3MsXG4gICAgICAgICAgICAgICAgZXhjbHVkZU5vZGU6ICRpbmRpY2F0b3JFbGVtZW50LmdldCgwKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8vIFdlIHVzZSB0aGlzIHRvIGhhbmRsZSB0aGUgc2ltcGxlIGNhc2Ugb2YgdGV4dCBjb250ZW50IHRoYXQgZW5kcyB3aXRoIHNvbWUgbWVkaWEgYXMgaW5cbi8vIDxwPk15IHRleHQuIDxpbWcgc3JjPVwid2hhdGV2ZXJcIj48L3A+LlxuLy8gVGhpcyBpcyBhIHNpbXBsaXN0aWMgYWxnb3JpdGhtLCBub3QgYSBnZW5lcmFsIHNvbHV0aW9uOlxuLy8gV2Ugd2FsayB0aGUgRE9NIGluc2lkZSB0aGUgZ2l2ZW4gbm9kZSBhbmQga2VlcCB0cmFjayBvZiB0aGUgbGFzdCBcImNvbnRlbnRcIiBub2RlIHRoYXQgd2UgZW5jb3VudGVyLCB3aGljaCBjb3VsZCBiZSBlaXRoZXJcbi8vIHRleHQgb3Igc29tZSBtZWRpYS4gIElmIHRoZSBsYXN0IGNvbnRlbnQgbm9kZSBpcyBub3QgdGV4dCwgd2Ugd2FudCB0byBpbnNlcnQgdGhlIHRleHQgaW5kaWNhdG9yIGJlZm9yZSB0aGUgbWVkaWEuXG5mdW5jdGlvbiBsYXN0Q29udGVudE5vZGUobm9kZSkge1xuICAgIHZhciBsYXN0Tm9kZTtcbiAgICB2YXIgY2hpbGROb2RlcyA9IG5vZGUuY2hpbGROb2RlcztcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkTm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGNoaWxkID0gY2hpbGROb2Rlc1tpXTtcbiAgICAgICAgaWYgKGNoaWxkLm5vZGVUeXBlID09PSAzKSB7XG4gICAgICAgICAgICBsYXN0Tm9kZSA9IGNoaWxkO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyIHRhZ05hbWUgPSBjaGlsZC50YWdOYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICBzd2l0Y2ggKHRhZ05hbWUpIHtcbiAgICAgICAgICAgICAgICBjYXNlICdpbWcnOlxuICAgICAgICAgICAgICAgIGNhc2UgJ2lmcmFtZSc6XG4gICAgICAgICAgICAgICAgY2FzZSAndmlkZW8nOlxuICAgICAgICAgICAgICAgIGNhc2UgJ2lmcmFtZSc6XG4gICAgICAgICAgICAgICAgICAgIGxhc3ROb2RlID0gY2hpbGQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgbGFzdE5vZGUgPSBsYXN0Q29udGVudE5vZGUoY2hpbGQpIHx8IGxhc3ROb2RlO1xuICAgIH1cbiAgICByZXR1cm4gbGFzdE5vZGU7XG59XG5cbmZ1bmN0aW9uIHNob3VsZEhhc2hUZXh0KCR0ZXh0RWxlbWVudCwgZ3JvdXBTZXR0aW5ncykge1xuICAgIGlmICgoaXNDdGEoJHRleHRFbGVtZW50LCBncm91cFNldHRpbmdzKSkpIHtcbiAgICAgICAgLy8gRG9uJ3QgaGFzaCB0aGUgdGV4dCBpZiBpdCBpcyB0aGUgdGFyZ2V0IG9mIGEgQ1RBLlxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIC8vIERvbid0IGNyZWF0ZSBhbiBpbmRpY2F0b3IgZm9yIHRleHQgZWxlbWVudHMgdGhhdCBjb250YWluIG90aGVyIHRleHQgbm9kZXMuXG4gICAgdmFyICRuZXN0ZWRFbGVtZW50cyA9IGZpbmQoJHRleHRFbGVtZW50LCBncm91cFNldHRpbmdzLmNvbnRlbnRTZWxlY3RvcigpKTtcbiAgICAkbmVzdGVkRWxlbWVudHMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKChjb21wdXRlRWxlbWVudFR5cGUoJCh0aGlzKSkgPT09IFRZUEVfVEVYVCkpIHtcbiAgICAgICAgICAgIC8vIERvbid0IGhhc2ggYSB0ZXh0IGVsZW1lbnQgaWYgaXQgY29udGFpbnMgYW55IG90aGVyIG1hdGNoZWQgdGV4dCBlbGVtZW50c1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIGlzQ3RhKCRlbGVtZW50LCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGNvbXBvc2l0ZVNlbGVjdG9yID0gZ3JvdXBTZXR0aW5ncy5nZW5lcmF0ZWRDdGFTZWxlY3RvcigpICsgJyxbYW50LWl0ZW1dJztcbiAgICByZXR1cm4gJGVsZW1lbnQuaXMoY29tcG9zaXRlU2VsZWN0b3IpO1xufVxuXG4vLyBUaGUgXCJpbWFnZVwiIGFuZCBcIm1lZGlhXCIgcGF0aHMgY29udmVyZ2UgaGVyZSwgYmVjYXVzZSB3ZSB1c2UgdGhlIHNhbWUgaW5kaWNhdG9yIG1vZHVsZSBmb3IgdGhlbSBib3RoLlxuZnVuY3Rpb24gc2Nhbk1lZGlhKCRtZWRpYUVsZW1lbnQsIHR5cGUsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGluZGljYXRvcjtcbiAgICB2YXIgaGFzaCA9IGNvbXB1dGVIYXNoKCRtZWRpYUVsZW1lbnQsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICBpZiAoaGFzaCkge1xuICAgICAgICB2YXIgY29udGFpbmVyRGF0YSA9IFBhZ2VEYXRhLmdldENvbnRhaW5lckRhdGEocGFnZURhdGEsIGhhc2gpO1xuICAgICAgICBjb250YWluZXJEYXRhLnR5cGUgPSB0eXBlID09PSBUWVBFX0lNQUdFID8gJ2ltYWdlJyA6ICdtZWRpYSc7XG4gICAgICAgIHZhciBkZWZhdWx0UmVhY3Rpb25zID0gZ3JvdXBTZXR0aW5ncy5kZWZhdWx0UmVhY3Rpb25zKCRtZWRpYUVsZW1lbnQpO1xuICAgICAgICB2YXIgY29udGVudERhdGEgPSBjb21wdXRlQ29udGVudERhdGEoJG1lZGlhRWxlbWVudCwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIGlmIChjb250ZW50RGF0YSAmJiBjb250ZW50RGF0YS5kaW1lbnNpb25zKSB7XG4gICAgICAgICAgICBpZiAoY29udGVudERhdGEuZGltZW5zaW9ucy5oZWlnaHQgPj0gMTAwICYmIGNvbnRlbnREYXRhLmRpbWVuc2lvbnMud2lkdGggPj0gMTAwKSB7IC8vIERvbid0IGNyZWF0ZSBpbmRpY2F0b3Igb24gZWxlbWVudHMgdGhhdCBhcmUgdG9vIHNtYWxsXG4gICAgICAgICAgICAgICAgaW5kaWNhdG9yID0gTWVkaWFJbmRpY2F0b3JXaWRnZXQuY3JlYXRlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQ6IFdpZGdldEJ1Y2tldC5nZXQoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lckRhdGE6IGNvbnRhaW5lckRhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50RGF0YTogY29udGVudERhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250YWluZXJFbGVtZW50OiAkbWVkaWFFbGVtZW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdFJlYWN0aW9uczogZGVmYXVsdFJlYWN0aW9ucyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhZ2VEYXRhOiBwYWdlRGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGdyb3VwU2V0dGluZ3M6IGdyb3VwU2V0dGluZ3NcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgLy8gTGlzdGVuIGZvciBjaGFuZ2VzIHRvIHRoZSBpbWFnZSBhdHRyaWJ1dGVzIHdoaWNoIGNvdWxkIGluZGljYXRlIGNvbnRlbnQgY2hhbmdlcy5cbiAgICBNdXRhdGlvbk9ic2VydmVyLmFkZE9uZVRpbWVBdHRyaWJ1dGVMaXN0ZW5lcigkbWVkaWFFbGVtZW50LmdldCgwKSwgWydzcmMnLCdhbnQtaXRlbS1jb250ZW50JywnZGF0YSddLCBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKGluZGljYXRvcikge1xuICAgICAgICAgICAgLy8gVE9ETzogdXBkYXRlIEhhc2hlZEVsZW1lbnRzIHRvIHJlbW92ZSB0aGUgcHJldmlvdXMgaGFzaC0+ZWxlbWVudCBtYXBwaW5nLiBDb25zaWRlciB0aGVyZSBjb3VsZCBiZSBtdWx0aXBsZVxuICAgICAgICAgICAgLy8gICAgICAgaW5zdGFuY2VzIG9mIHRoZSBzYW1lIGVsZW1lbnQgb24gYSBwYWdlLi4uIHNvIHdlIG1pZ2h0IG5lZWQgdG8gdXNlIGEgY291bnRlci5cbiAgICAgICAgICAgIGluZGljYXRvci50ZWFyZG93bigpO1xuICAgICAgICB9XG4gICAgICAgIHNjYW5NZWRpYSgkbWVkaWFFbGVtZW50LCB0eXBlLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGZpbmQoJGVsZW1lbnQsIHNlbGVjdG9yLCBhZGRCYWNrKSB7XG4gICAgdmFyIHJlc3VsdCA9ICRlbGVtZW50LmZpbmQoc2VsZWN0b3IpO1xuICAgIGlmIChhZGRCYWNrICYmIHNlbGVjdG9yKSB7IC8vIHdpdGggYW4gdW5kZWZpbmVkIHNlbGVjdG9yLCBhZGRCYWNrIHdpbGwgbWF0Y2ggYW5kIGFsd2F5cyByZXR1cm4gdGhlIGlucHV0IGVsZW1lbnQgKHVubGlrZSBmaW5kKCkgd2hpY2ggcmV0dXJucyBhbiBlbXB0eSBtYXRjaClcbiAgICAgICAgcmVzdWx0ID0gcmVzdWx0LmFkZEJhY2soc2VsZWN0b3IpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0LmZpbHRlcihmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuICQodGhpcykuY2xvc2VzdCgnLm5vLWFudCcpLmxlbmd0aCA9PSAwO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBpbnNlcnRDb250ZW50KCRwYXJlbnQsIGNvbnRlbnQsIG1ldGhvZCkge1xuICAgIHN3aXRjaCAobWV0aG9kKSB7XG4gICAgICAgIGNhc2UgJ2FwcGVuZCc6XG4gICAgICAgICAgICAkcGFyZW50LmFwcGVuZChjb250ZW50KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdwcmVwZW5kJzpcbiAgICAgICAgICAgICRwYXJlbnQucHJlcGVuZChjb250ZW50KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdiZWZvcmUnOlxuICAgICAgICAgICAgJHBhcmVudC5iZWZvcmUoY29udGVudCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnYWZ0ZXInOlxuICAgICAgICAgICAgJHBhcmVudC5hZnRlcihjb250ZW50KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gY29tcHV0ZUhhc2goJGVsZW1lbnQsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgLy8gVE9ETzogbWFrZSBzdXJlIHdlIGdlbmVyYXRlIHVuaXF1ZSBoYXNoZXMgdXNpbmcgYW4gb3JkZXJlZCBpbmRleCBpbiBjYXNlIG9mIGNvbGxpc2lvbnNcbiAgICB2YXIgaGFzaDtcbiAgICBzd2l0Y2ggKGNvbXB1dGVFbGVtZW50VHlwZSgkZWxlbWVudCkpIHtcbiAgICAgICAgY2FzZSBUWVBFX0lNQUdFOlxuICAgICAgICAgICAgdmFyIGltYWdlVXJsID0gVVJMcy5jb21wdXRlSW1hZ2VVcmwoJGVsZW1lbnQsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgaGFzaCA9IEhhc2guaGFzaEltYWdlKGltYWdlVXJsKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFRZUEVfTUVESUE6XG4gICAgICAgICAgICB2YXIgbWVkaWFVcmwgPSBVUkxzLmNvbXB1dGVNZWRpYVVybCgkZWxlbWVudCwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICBoYXNoID0gSGFzaC5oYXNoTWVkaWEobWVkaWFVcmwpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgVFlQRV9URVhUOlxuICAgICAgICAgICAgaGFzaCA9IEhhc2guaGFzaFRleHQoJGVsZW1lbnQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGlmIChoYXNoKSB7XG4gICAgICAgIEhhc2hlZEVsZW1lbnRzLnNldChoYXNoLCBwYWdlRGF0YS5wYWdlSGFzaCwgJGVsZW1lbnQpOyAvLyBSZWNvcmQgdGhlIHJlbGF0aW9uc2hpcCBiZXR3ZWVuIHRoZSBoYXNoIGFuZCBkb20gZWxlbWVudC5cbiAgICAgICAgaWYgKEFwcE1vZGUuZGVidWcpIHtcbiAgICAgICAgICAgICRlbGVtZW50LmF0dHIoQVRUUl9IQVNILCBoYXNoKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gaGFzaDtcbn1cblxuZnVuY3Rpb24gY29tcHV0ZUNvbnRlbnREYXRhKCRlbGVtZW50LCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGNvbnRlbnREYXRhO1xuICAgIHN3aXRjaCAoY29tcHV0ZUVsZW1lbnRUeXBlKCRlbGVtZW50KSkge1xuICAgICAgICBjYXNlIFRZUEVfSU1BR0U6XG4gICAgICAgICAgICB2YXIgaW1hZ2VVcmwgPSBVUkxzLmNvbXB1dGVJbWFnZVVybCgkZWxlbWVudCwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICB2YXIgaW1hZ2VEaW1lbnNpb25zID0ge1xuICAgICAgICAgICAgICAgIGhlaWdodDogJGVsZW1lbnQuaGVpZ2h0KCksIC8vIFRPRE86IHJldmlldyBob3cgd2UgZ2V0IHRoZSBpbWFnZSBkaW1lbnNpb25zXG4gICAgICAgICAgICAgICAgd2lkdGg6ICRlbGVtZW50LndpZHRoKClcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBjb250ZW50RGF0YSA9IHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnaW1nJyxcbiAgICAgICAgICAgICAgICBib2R5OiBpbWFnZVVybCxcbiAgICAgICAgICAgICAgICBkaW1lbnNpb25zOiBpbWFnZURpbWVuc2lvbnNcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBUWVBFX01FRElBOlxuICAgICAgICAgICAgdmFyIG1lZGlhVXJsID0gVVJMcy5jb21wdXRlTWVkaWFVcmwoJGVsZW1lbnQsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgdmFyIG1lZGlhRGltZW5zaW9ucyA9IHtcbiAgICAgICAgICAgICAgICBoZWlnaHQ6ICRlbGVtZW50LmhlaWdodCgpLCAvLyBUT0RPOiByZXZpZXcgaG93IHdlIGdldCB0aGUgbWVkaWEgZGltZW5zaW9uc1xuICAgICAgICAgICAgICAgIHdpZHRoOiAkZWxlbWVudC53aWR0aCgpXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgY29udGVudERhdGEgPSB7XG4gICAgICAgICAgICAgICAgdHlwZTogJ21lZGlhJyxcbiAgICAgICAgICAgICAgICBib2R5OiBtZWRpYVVybCxcbiAgICAgICAgICAgICAgICBkaW1lbnNpb25zOiBtZWRpYURpbWVuc2lvbnNcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBUWVBFX1RFWFQ6XG4gICAgICAgICAgICBjb250ZW50RGF0YSA9IHsgdHlwZTogJ3RleHQnIH07XG4gICAgICAgICAgICBicmVhaztcbiAgICB9XG4gICAgcmV0dXJuIGNvbnRlbnREYXRhO1xufVxuXG5mdW5jdGlvbiBjb21wdXRlRWxlbWVudFR5cGUoJGVsZW1lbnQpIHtcbiAgICB2YXIgaXRlbVR5cGUgPSAkZWxlbWVudC5hdHRyKCdhbnQtaXRlbS10eXBlJyk7XG4gICAgaWYgKGl0ZW1UeXBlICYmIGl0ZW1UeXBlLnRyaW0oKS5sZW5ndGggPiAwKSB7XG4gICAgICAgIHJldHVybiBpdGVtVHlwZS50cmltKCk7XG4gICAgfVxuICAgIHZhciB0YWdOYW1lID0gJGVsZW1lbnQucHJvcCgndGFnTmFtZScpLnRvTG93ZXJDYXNlKCk7XG4gICAgc3dpdGNoICh0YWdOYW1lKSB7XG4gICAgICAgIGNhc2UgJ2ltZyc6XG4gICAgICAgICAgICByZXR1cm4gVFlQRV9JTUFHRTtcbiAgICAgICAgY2FzZSAndmlkZW8nOlxuICAgICAgICBjYXNlICdpZnJhbWUnOlxuICAgICAgICBjYXNlICdlbWJlZCc6XG4gICAgICAgICAgICByZXR1cm4gVFlQRV9NRURJQTtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHJldHVybiBUWVBFX1RFWFQ7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBlbGVtZW50c0FkZGVkKGdyb3VwU2V0dGluZ3MpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCRlbGVtZW50cykge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8ICRlbGVtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyICRlbGVtZW50ID0gJGVsZW1lbnRzW2ldO1xuICAgICAgICAgICAgJGVsZW1lbnQuZmluZChncm91cFNldHRpbmdzLmV4Y2x1c2lvblNlbGVjdG9yKCkpLmFkZEJhY2soZ3JvdXBTZXR0aW5ncy5leGNsdXNpb25TZWxlY3RvcigpKS5hZGRDbGFzcygnbm8tYW50Jyk7IC8vIEFkZCB0aGUgbm8tYW50IGNsYXNzIHRvIGV2ZXJ5dGhpbmcgdGhhdCBpcyBmbGFnZ2VkIGZvciBleGNsdXNpb25cbiAgICAgICAgICAgIGlmICgkZWxlbWVudC5jbG9zZXN0KCcubm8tYW50JykubGVuZ3RoID09PSAwKSB7IC8vIElnbm9yZSBhbnl0aGluZyB0YWdnZWQgbm8tYW50XG4gICAgICAgICAgICAgICAgLy8gRmlyc3QsIHNlZSBpZiBhbnkgZW50aXJlIHBhZ2VzIHdlcmUgYWRkZWRcbiAgICAgICAgICAgICAgICB2YXIgJHBhZ2VzID0gZmluZCgkZWxlbWVudCwgZ3JvdXBTZXR0aW5ncy5wYWdlU2VsZWN0b3IoKSwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgaWYgKCRwYWdlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIFBhZ2VEYXRhTG9hZGVyLnBhZ2VzQWRkZWQoJHBhZ2VzLCBncm91cFNldHRpbmdzKTsgLy8gVE9ETzogY29uc2lkZXIgaWYgdGhlcmUncyBhIGJldHRlciB3YXkgdG8gYXJjaGl0ZWN0IHRoaXNcbiAgICAgICAgICAgICAgICAgICAgJHBhZ2VzLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2NhblBhZ2UoJCh0aGlzKSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIElmIG5vdCBhbiBlbnRpcmUgcGFnZS9wYWdlcywgc2VlIGlmIGNvbnRlbnQgd2FzIGFkZGVkIHRvIGFuIGV4aXN0aW5nIHBhZ2VcbiAgICAgICAgICAgICAgICAgICAgdmFyICRwYWdlID0gJGVsZW1lbnQuY2xvc2VzdChncm91cFNldHRpbmdzLnBhZ2VTZWxlY3RvcigpKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCRwYWdlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHBhZ2UgPSAkKCdib2R5Jyk7IC8vIFRPRE86IGlzIHRoaXMgcmlnaHQ/IGtlZXAgaW4gc3luYyB3aXRoIHNjYW5BbGxQYWdlc1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHZhciB1cmwgPSBQYWdlVXRpbHMuY29tcHV0ZVBhZ2VVcmwoJHBhZ2UsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgcGFnZURhdGEgPSBQYWdlRGF0YS5nZXRQYWdlRGF0YUJ5VVJMKHVybCk7XG4gICAgICAgICAgICAgICAgICAgIC8vIEZpcnN0LCBjaGVjayBmb3IgYW55IG5ldyBzdW1tYXJ5IHdpZGdldHMuLi5cbiAgICAgICAgICAgICAgICAgICAgc2NhbkZvclN1bW1hcmllcygkZWxlbWVudCwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgICAgICAgICAvLyBOZXh0LCBzZWUgaWYgYW55IGVudGlyZSBhY3RpdmUgc2VjdGlvbnMgd2VyZSBhZGRlZFxuICAgICAgICAgICAgICAgICAgICB2YXIgJGFjdGl2ZVNlY3Rpb25zID0gZmluZCgkZWxlbWVudCwgZ3JvdXBTZXR0aW5ncy5hY3RpdmVTZWN0aW9ucygpKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCRhY3RpdmVTZWN0aW9ucy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkYWN0aXZlU2VjdGlvbnMuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3JlYXRlQXV0b0NhbGxzVG9BY3Rpb24oJCh0aGlzKSwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkYWN0aXZlU2VjdGlvbnMuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyICRzZWN0aW9uID0gJCh0aGlzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY2FuQWN0aXZlRWxlbWVudCgkc2VjdGlvbiwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBGaW5hbGx5LCBzY2FuIGluc2lkZSB0aGUgZWxlbWVudCBmb3IgY29udGVudFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyICRhY3RpdmVTZWN0aW9uID0gJGVsZW1lbnQuY2xvc2VzdChncm91cFNldHRpbmdzLmFjdGl2ZVNlY3Rpb25zKCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCRhY3RpdmVTZWN0aW9uLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjcmVhdGVBdXRvQ2FsbHNUb0FjdGlvbigkZWxlbWVudCwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjYW5BY3RpdmVFbGVtZW50KCRlbGVtZW50LCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIHRoZSBlbGVtZW50IGlzIGFkZGVkIG91dHNpZGUgYW4gYWN0aXZlIHNlY3Rpb24sIGp1c3QgY2hlY2sgaXQgZm9yIENUQXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY2FuRm9yQ2FsbHNUb0FjdGlvbigkZWxlbWVudCwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICBzY2FuOiBzY2FuQWxsUGFnZXNcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgUmFjdGl2ZTsgcmVxdWlyZSgnLi91dGlscy9yYWN0aXZlLXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGxvYWRlZFJhY3RpdmUpIHsgUmFjdGl2ZSA9IGxvYWRlZFJhY3RpdmU7fSk7XG52YXIgV2lkZ2V0QnVja2V0ID0gcmVxdWlyZSgnLi91dGlscy93aWRnZXQtYnVja2V0Jyk7XG52YXIgVHJhbnNpdGlvblV0aWwgPSByZXF1aXJlKCcuL3V0aWxzL3RyYW5zaXRpb24tdXRpbCcpO1xuXG52YXIgU1ZHcyA9IHJlcXVpcmUoJy4vc3ZncycpO1xuXG52YXIgcmFjdGl2ZTtcbnZhciBjbGlja0hhbmRsZXI7XG5cblxuZnVuY3Rpb24gZ2V0Um9vdEVsZW1lbnQoKSB7XG4gICAgLy8gVE9ETyByZXZpc2l0IHRoaXMsIGl0J3Mga2luZCBvZiBnb29meSBhbmQgaXQgbWlnaHQgaGF2ZSBhIHRpbWluZyBwcm9ibGVtXG4gICAgaWYgKCFyYWN0aXZlKSB7XG4gICAgICAgIHZhciBidWNrZXQgPSBXaWRnZXRCdWNrZXQuZ2V0KCk7XG4gICAgICAgIHJhY3RpdmUgPSBSYWN0aXZlKHtcbiAgICAgICAgICAgIGVsOiBidWNrZXQsXG4gICAgICAgICAgICBhcHBlbmQ6IHRydWUsXG4gICAgICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL3BvcHVwLXdpZGdldC5oYnMuaHRtbCcpLFxuICAgICAgICAgICAgcGFydGlhbHM6IHtcbiAgICAgICAgICAgICAgICBsb2dvOiBTVkdzLmxvZ29cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHZhciAkZWxlbWVudCA9ICQocmFjdGl2ZS5maW5kKCcuYW50ZW5uYS1wb3B1cCcpKTtcbiAgICAgICAgJGVsZW1lbnQub24oJ21vdXNlZG93bicsIGZhbHNlKTsgLy8gUHJldmVudCBtb3VzZWRvd24gZnJvbSBwcm9wYWdhdGluZywgc28gdGhlIGJyb3dzZXIgZG9lc24ndCBjbGVhciB0aGUgdGV4dCBzZWxlY3Rpb24uXG4gICAgICAgICRlbGVtZW50Lm9uKCdjbGljay5hbnRlbm5hLXBvcHVwJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgaGlkZVBvcHVwKCRlbGVtZW50KTtcbiAgICAgICAgICAgIGlmIChjbGlja0hhbmRsZXIpIHtcbiAgICAgICAgICAgICAgICBjbGlja0hhbmRsZXIoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIC8vIFRoZSA6aG92ZXIgcHNldWRvIGNsYXNzIGNhbiBiZWNvbWUgc3R1Y2sgb24gdGhlIGFudGVubmEtcG9wdXAgZWxlbWVudCB3aGVuIHdlIGJyaW5nIHVwIHRoZSByZWFjdGlvbiB3aW5kb3dcbiAgICAgICAgLy8gaW4gcmVzcG9uc2UgdG8gdGhlIGNsaWNrLiBTbyBoZXJlIHdlIGFkZC9yZW1vdmUgb3VyIG93biBob3ZlciBjbGFzcyBpbnN0ZWFkLlxuICAgICAgICAvLyBTZWU6IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTAzMjEyNzUvaG92ZXItc3RhdGUtaXMtc3RpY2t5LWFmdGVyLWVsZW1lbnQtaXMtbW92ZWQtb3V0LWZyb20tdW5kZXItdGhlLW1vdXNlLWluLWFsbC1iclxuICAgICAgICAkZWxlbWVudC5vbignbW91c2VlbnRlcicsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAkZWxlbWVudC5hZGRDbGFzcygnaG92ZXInKTtcbiAgICAgICAgfSk7XG4gICAgICAgICRlbGVtZW50Lm9uKCdtb3VzZWxlYXZlJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAkZWxlbWVudC5yZW1vdmVDbGFzcygnaG92ZXInKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiAkZWxlbWVudDtcbiAgICB9XG4gICAgcmV0dXJuICQocmFjdGl2ZS5maW5kKCcuYW50ZW5uYS1wb3B1cCcpKTtcbn1cblxuZnVuY3Rpb24gc2hvd1BvcHVwKGNvb3JkaW5hdGVzLCBjYWxsYmFjaykge1xuICAgIHZhciAkZWxlbWVudCA9IGdldFJvb3RFbGVtZW50KCk7XG4gICAgaWYgKCEkZWxlbWVudC5oYXNDbGFzcygnc2hvdycpKSB7XG4gICAgICAgIGNsaWNrSGFuZGxlciA9IGNhbGxiYWNrO1xuICAgICAgICAkZWxlbWVudFxuICAgICAgICAgICAgLnNob3coKSAvLyBzdGlsbCBoYXMgb3BhY2l0eSAwIGF0IHRoaXMgcG9pbnRcbiAgICAgICAgICAgIC5jc3Moe1xuICAgICAgICAgICAgICAgIHRvcDogY29vcmRpbmF0ZXMudG9wIC0gJGVsZW1lbnQub3V0ZXJIZWlnaHQoKSAtIDYsIC8vIFRPRE8gZmluZCBhIGNsZWFuZXIgd2F5IHRvIGFjY291bnQgZm9yIHRoZSBwb3B1cCAndGFpbCdcbiAgICAgICAgICAgICAgICBsZWZ0OiBjb29yZGluYXRlcy5sZWZ0IC0gTWF0aC5mbG9vcigkZWxlbWVudC5vdXRlcldpZHRoKCkgLyAyKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIFRyYW5zaXRpb25VdGlsLnRvZ2dsZUNsYXNzKCRlbGVtZW50LCAnc2hvdycsIHRydWUsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy8gVE9ETzogYWZ0ZXIgdGhlIGFwcGVhcmFuY2UgdHJhbnNpdGlvbiBpcyBjb21wbGV0ZSwgYWRkIGEgaGFuZGxlciBmb3IgbW91c2VlbnRlciB3aGljaCB0aGVuIHJlZ2lzdGVyc1xuICAgICAgICAgICAgLy8gICAgICAgYSBoYW5kbGVyIGZvciBtb3VzZWxlYXZlIHRoYXQgaGlkZXMgdGhlIHBvcHVwXG5cbiAgICAgICAgICAgIC8vIFRPRE86IGFsc28gdGFrZSBkb3duIHRoZSBwb3B1cCBpZiB0aGUgdXNlciBtb3VzZXMgb3ZlciBhbm90aGVyIHdpZGdldCAoc3VtbWFyeSBvciBpbmRpY2F0b3IpXG4gICAgICAgICAgICAkKGRvY3VtZW50KS5vbignY2xpY2suYW50ZW5uYS1wb3B1cCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBoaWRlUG9wdXAoJGVsZW1lbnQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gaGlkZVBvcHVwKCRlbGVtZW50KSB7XG4gICAgVHJhbnNpdGlvblV0aWwudG9nZ2xlQ2xhc3MoJGVsZW1lbnQsICdzaG93JywgZmFsc2UsIGZ1bmN0aW9uKCkge1xuICAgICAgICAkZWxlbWVudC5oaWRlKCk7IC8vIGFmdGVyIHdlJ3JlIGF0IG9wYWNpdHkgMCwgaGlkZSB0aGUgZWxlbWVudCBzbyBpdCBkb2Vzbid0IHJlY2VpdmUgYWNjaWRlbnRhbCBjbGlja3NcbiAgICB9KTtcbiAgICAkKGRvY3VtZW50KS5vZmYoJ2NsaWNrLmFudGVubmEtcG9wdXAnKTtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHNob3c6IHNob3dQb3B1cFxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi91dGlscy9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciBBamF4Q2xpZW50ID0gcmVxdWlyZSgnLi91dGlscy9hamF4LWNsaWVudCcpO1xudmFyIFJhY3RpdmU7IHJlcXVpcmUoJy4vdXRpbHMvcmFjdGl2ZS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihsb2FkZWRSYWN0aXZlKSB7IFJhY3RpdmUgPSBsb2FkZWRSYWN0aXZlO30pO1xudmFyIFJhbmdlID0gcmVxdWlyZSgnLi91dGlscy9yYW5nZScpO1xudmFyIFJlYWN0aW9uc1dpZGdldExheW91dFV0aWxzID0gcmVxdWlyZSgnLi91dGlscy9yZWFjdGlvbnMtd2lkZ2V0LWxheW91dC11dGlscycpO1xuXG52YXIgRXZlbnRzID0gcmVxdWlyZSgnLi9ldmVudHMnKTtcbnZhciBTVkdzID0gcmVxdWlyZSgnLi9zdmdzJyk7XG5cbnZhciBwYWdlU2VsZWN0b3IgPSAnLmFudGVubmEtcmVhY3Rpb25zLXBhZ2UnO1xuXG5mdW5jdGlvbiBjcmVhdGVQYWdlKG9wdGlvbnMpIHtcbiAgICB2YXIgaXNTdW1tYXJ5ID0gb3B0aW9ucy5pc1N1bW1hcnk7XG4gICAgdmFyIHJlYWN0aW9uc0RhdGEgPSBvcHRpb25zLnJlYWN0aW9uc0RhdGE7XG4gICAgdmFyIGNvbnRhaW5lckRhdGEgPSBvcHRpb25zLmNvbnRhaW5lckRhdGE7XG4gICAgdmFyIHBhZ2VEYXRhID0gb3B0aW9ucy5wYWdlRGF0YTtcbiAgICB2YXIgZ3JvdXBTZXR0aW5ncyA9IG9wdGlvbnMuZ3JvdXBTZXR0aW5ncztcbiAgICB2YXIgY29udGVudERhdGEgPSBvcHRpb25zLmNvbnRlbnREYXRhO1xuICAgIHZhciBjb250YWluZXJFbGVtZW50ID0gb3B0aW9ucy5jb250YWluZXJFbGVtZW50OyAvLyBvcHRpb25hbFxuICAgIHZhciBzaG93Q29uZmlybWF0aW9uID0gb3B0aW9ucy5zaG93Q29uZmlybWF0aW9uO1xuICAgIHZhciBzaG93RGVmYXVsdHMgPSBvcHRpb25zLnNob3dEZWZhdWx0cztcbiAgICB2YXIgc2hvd0NvbW1lbnRzID0gb3B0aW9ucy5zaG93Q29tbWVudHM7XG4gICAgdmFyIHNob3dMb2NhdGlvbnMgPSBvcHRpb25zLnNob3dMb2NhdGlvbnM7XG4gICAgdmFyIGVsZW1lbnQgPSBvcHRpb25zLmVsZW1lbnQ7XG4gICAgc29ydFJlYWN0aW9uRGF0YShyZWFjdGlvbnNEYXRhKTtcbiAgICB2YXIgcmVhY3Rpb25zTGF5b3V0RGF0YSA9IFJlYWN0aW9uc1dpZGdldExheW91dFV0aWxzLmNvbXB1dGVMYXlvdXREYXRhKHJlYWN0aW9uc0RhdGEpO1xuICAgIHZhciAkcmVhY3Rpb25zV2luZG93ID0gJChvcHRpb25zLnJlYWN0aW9uc1dpbmRvdyk7XG4gICAgdmFyIHJhY3RpdmUgPSBSYWN0aXZlKHtcbiAgICAgICAgZWw6IGVsZW1lbnQsXG4gICAgICAgIGFwcGVuZDogdHJ1ZSxcbiAgICAgICAgdGVtcGxhdGU6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9yZWFjdGlvbnMtcGFnZS5oYnMuaHRtbCcpLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICByZWFjdGlvbnM6IHJlYWN0aW9uc0RhdGEsXG4gICAgICAgICAgICByZWFjdGlvbnNMYXlvdXRDbGFzczogYXJyYXlBY2Nlc3NvcihyZWFjdGlvbnNMYXlvdXREYXRhLmxheW91dENsYXNzZXMpLFxuICAgICAgICAgICAgaXNTdW1tYXJ5OiBpc1N1bW1hcnlcbiAgICAgICAgfSxcbiAgICAgICAgZGVjb3JhdG9yczoge1xuICAgICAgICAgICAgc2l6ZXRvZml0OiBzaXplVG9GaXQoJHJlYWN0aW9uc1dpbmRvdylcbiAgICAgICAgfSxcbiAgICAgICAgcGFydGlhbHM6IHtcbiAgICAgICAgICAgIGxvY2F0aW9uSWNvbjogU1ZHcy5sb2NhdGlvbixcbiAgICAgICAgICAgIGNvbW1lbnRzSWNvbjogU1ZHcy5jb21tZW50c1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICBpZiAoY29udGFpbmVyRWxlbWVudCkge1xuICAgICAgICByYWN0aXZlLm9uKCdoaWdobGlnaHQnLCBoaWdobGlnaHRDb250ZW50KGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBjb250YWluZXJFbGVtZW50KSk7XG4gICAgICAgIHJhY3RpdmUub24oJ2NsZWFyaGlnaGxpZ2h0cycsIFJhbmdlLmNsZWFySGlnaGxpZ2h0cyk7XG4gICAgfVxuICAgIHJhY3RpdmUub24oJ3BsdXNvbmUnLCBwbHVzT25lKGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBzaG93Q29uZmlybWF0aW9uLCBncm91cFNldHRpbmdzKSk7XG4gICAgcmFjdGl2ZS5vbignc2hvd2RlZmF1bHQnLCBzaG93RGVmYXVsdHMpO1xuICAgIHJhY3RpdmUub24oJ3Nob3djb21tZW50cycsIGZ1bmN0aW9uKHJhY3RpdmVFdmVudCkgeyBzaG93Q29tbWVudHMocmFjdGl2ZUV2ZW50LmNvbnRleHQpOyByZXR1cm4gZmFsc2U7IH0pOyAvLyBUT0RPIGNsZWFuIHVwXG4gICAgcmFjdGl2ZS5vbignc2hvd2xvY2F0aW9ucycsIGZ1bmN0aW9uKHJhY3RpdmVFdmVudCkgeyBzaG93TG9jYXRpb25zKHJhY3RpdmVFdmVudC5jb250ZXh0KTsgcmV0dXJuIGZhbHNlOyB9KTsgLy8gVE9ETyBjbGVhbiB1cFxuICAgIHJldHVybiB7XG4gICAgICAgIHNlbGVjdG9yOiBwYWdlU2VsZWN0b3IsXG4gICAgICAgIHRlYXJkb3duOiBmdW5jdGlvbigpIHsgcmFjdGl2ZS50ZWFyZG93bigpOyB9XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIGFycmF5QWNjZXNzb3IoYXJyYXkpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGluZGV4KSB7XG4gICAgICAgICAgICByZXR1cm4gYXJyYXlbaW5kZXhdO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc29ydFJlYWN0aW9uRGF0YShyZWFjdGlvbnMpIHtcbiAgICAgICAgcmVhY3Rpb25zLnNvcnQoZnVuY3Rpb24ocmVhY3Rpb25BLCByZWFjdGlvbkIpIHtcbiAgICAgICAgICAgIGlmIChyZWFjdGlvbkEuY291bnQgPT09IHJlYWN0aW9uQi5jb3VudCkge1xuICAgICAgICAgICAgICAgIC8vIHdoZW4gdGhlIGNvdW50IGlzIHRoZSBzYW1lLCBzb3J0IGJ5IGNyZWF0aW9uIHRpbWUgKG91ciBJRHMgaW5jcmVhc2UgY2hyb25vbG9naWNhbGx5KVxuICAgICAgICAgICAgICAgIHJldHVybiByZWFjdGlvbkEuaWQgLSByZWFjdGlvbkIuaWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVhY3Rpb25CLmNvdW50IC0gcmVhY3Rpb25BLmNvdW50O1xuICAgICAgICB9KTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHNpemVUb0ZpdCgkcmVhY3Rpb25zV2luZG93KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgdmFyICRlbGVtZW50ID0gJChub2RlKS5jbG9zZXN0KCcuYW50ZW5uYS1yZWFjdGlvbi1ib3gnKTtcbiAgICAgICAgLy8gV2hpbGUgd2UncmUgc2l6aW5nIHRoZSB0ZXh0IHRvIGZpeCBpbiB0aGUgcmVhY3Rpb24gYm94LCB3ZSBhbHNvIGZpeCB1cCB0aGUgd2lkdGggb2YgdGhlIHJlYWN0aW9uIGNvdW50IGFuZFxuICAgICAgICAvLyBwbHVzIG9uZSBidXR0b25zIHNvIHRoYXQgdGhleSdyZSB0aGUgc2FtZS4gVGhlc2UgdHdvIHZpc3VhbGx5IHN3YXAgd2l0aCBlYWNoIG90aGVyIG9uIGhvdmVyOyBtYWtpbmcgdGhlbVxuICAgICAgICAvLyB0aGUgc2FtZSB3aWR0aCBtYWtlcyBzdXJlIHdlIGRvbid0IGdldCBqdW1waW5lc3Mgb24gaG92ZXIuXG4gICAgICAgIC8vIFRPRE86IFdlIHNob3VsZCByZXZpc2l0IHRoZSBsYXlvdXQgb2YgdGhlIGFjdGlvbnMgdG8gbWFrZSB0aGVtIGVhc2llciB0YXAgb24gbW9iaWxlLiBBdCB0aGF0IHRpbWUsIHdlIHNob3VsZFxuICAgICAgICAvLyBlbmQgdXAgd2l0aCBzdGFibGUgdG91Y2ggdGFyZ2V0IGJveGVzIGFueXdheS5cbiAgICAgICAgdmFyICRyZWFjdGlvbkNvdW50ID0gJGVsZW1lbnQuZmluZCgnLmFudGVubmEtcmVhY3Rpb24tY291bnQnKTtcbiAgICAgICAgdmFyICRwbHVzT25lID0gJGVsZW1lbnQuZmluZCgnLmFudGVubmEtcGx1c29uZScpO1xuICAgICAgICB2YXIgbWluV2lkdGggPSBNYXRoLm1heCgkcmVhY3Rpb25Db3VudC53aWR0aCgpLCAkcGx1c09uZS53aWR0aCgpKTtcbiAgICAgICAgJHJlYWN0aW9uQ291bnQuY3NzKHsnbWluLXdpZHRoJzogbWluV2lkdGh9KTtcbiAgICAgICAgJHBsdXNPbmUuY3NzKHsnbWluLXdpZHRoJzogbWluV2lkdGh9KTtcbiAgICAgICAgcmV0dXJuIFJlYWN0aW9uc1dpZGdldExheW91dFV0aWxzLnNpemVUb0ZpdCgkcmVhY3Rpb25zV2luZG93KShub2RlKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGhpZ2hsaWdodENvbnRlbnQoY29udGFpbmVyRGF0YSwgcGFnZURhdGEsICRjb250YWluZXJFbGVtZW50KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHZhciByZWFjdGlvbkRhdGEgPSBldmVudC5jb250ZXh0O1xuICAgICAgICBpZiAocmVhY3Rpb25EYXRhLmNvbnRlbnQpIHtcbiAgICAgICAgICAgIHZhciBsb2NhdGlvbiA9IHJlYWN0aW9uRGF0YS5jb250ZW50LmxvY2F0aW9uO1xuICAgICAgICAgICAgaWYgKGxvY2F0aW9uKSB7XG4gICAgICAgICAgICAgICAgUmFuZ2UuaGlnaGxpZ2h0KCRjb250YWluZXJFbGVtZW50LmdldCgwKSwgbG9jYXRpb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBwbHVzT25lKGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBzaG93Q29uZmlybWF0aW9uLCBncm91cFNldHRpbmdzKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHZhciByZWFjdGlvbkRhdGEgPSBldmVudC5jb250ZXh0O1xuICAgICAgICB2YXIgcmVhY3Rpb25Qcm92aWRlciA9IHsgLy8gdGhpcyByZWFjdGlvbiBwcm92aWRlciBpcyBhIG5vLWJyYWluZXIgYmVjYXVzZSB3ZSBhbHJlYWR5IGhhdmUgYSB2YWxpZCByZWFjdGlvbiAob25lIHdpdGggYW4gSUQpXG4gICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2socmVhY3Rpb25EYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgc2hvd0NvbmZpcm1hdGlvbihyZWFjdGlvbkRhdGEsIHJlYWN0aW9uUHJvdmlkZXIpO1xuICAgICAgICBBamF4Q2xpZW50LnBvc3RQbHVzT25lKHJlYWN0aW9uRGF0YSwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGZ1bmN0aW9uKHJlYWN0aW9uRGF0YSl7XG4gICAgICAgICAgICBFdmVudHMucG9zdFJlYWN0aW9uQ3JlYXRlZChwYWdlRGF0YSwgY29udGFpbmVyRGF0YSwgcmVhY3Rpb25EYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgfSwgZXJyb3IpO1xuXG4gICAgICAgIGZ1bmN0aW9uIGVycm9yKG1lc3NhZ2UpIHtcbiAgICAgICAgICAgIC8vIFRPRE8gaGFuZGxlIGFueSBlcnJvcnMgdGhhdCBvY2N1ciBwb3N0aW5nIGEgcmVhY3Rpb25cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiZXJyb3IgcG9zdGluZyBwbHVzIG9uZTogXCIgKyBtZXNzYWdlKTtcbiAgICAgICAgfVxuICAgIH07XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGU6IGNyZWF0ZVBhZ2Vcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgQWpheENsaWVudCA9IHJlcXVpcmUoJy4vdXRpbHMvYWpheC1jbGllbnQnKTtcbnZhciBNZXNzYWdlcyA9IHJlcXVpcmUoJy4vdXRpbHMvbWVzc2FnZXMnKTtcbnZhciBNb3ZlYWJsZSA9IHJlcXVpcmUoJy4vdXRpbHMvbW92ZWFibGUnKTtcbnZhciBSYWN0aXZlOyByZXF1aXJlKCcuL3V0aWxzL3JhY3RpdmUtcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24obG9hZGVkUmFjdGl2ZSkgeyBSYWN0aXZlID0gbG9hZGVkUmFjdGl2ZTt9KTtcbnZhciBSYW5nZSA9IHJlcXVpcmUoJy4vdXRpbHMvcmFuZ2UnKTtcbnZhciBUb3VjaFN1cHBvcnQgPSByZXF1aXJlKCcuL3V0aWxzL3RvdWNoLXN1cHBvcnQnKTtcbnZhciBUcmFuc2l0aW9uVXRpbCA9IHJlcXVpcmUoJy4vdXRpbHMvdHJhbnNpdGlvbi11dGlsJyk7XG52YXIgVVJMcyA9IHJlcXVpcmUoJy4vdXRpbHMvdXJscycpO1xudmFyIFdpZGdldEJ1Y2tldCA9IHJlcXVpcmUoJy4vdXRpbHMvd2lkZ2V0LWJ1Y2tldCcpO1xuXG52YXIgQ29tbWVudHNQYWdlID0gcmVxdWlyZSgnLi9jb21tZW50cy1wYWdlJyk7XG52YXIgQ29uZmlybWF0aW9uUGFnZSA9IHJlcXVpcmUoJy4vY29uZmlybWF0aW9uLXBhZ2UnKTtcbnZhciBEZWZhdWx0c1BhZ2UgPSByZXF1aXJlKCcuL2RlZmF1bHRzLXBhZ2UnKTtcbnZhciBFdmVudHMgPSByZXF1aXJlKCcuL2V2ZW50cycpO1xudmFyIExvY2F0aW9uc1BhZ2UgPSByZXF1aXJlKCcuL2xvY2F0aW9ucy1wYWdlJyk7XG52YXIgUGFnZURhdGEgPSByZXF1aXJlKCcuL3BhZ2UtZGF0YScpO1xudmFyIFJlYWN0aW9uc1BhZ2UgPSByZXF1aXJlKCcuL3JlYWN0aW9ucy1wYWdlJyk7XG52YXIgU1ZHcyA9IHJlcXVpcmUoJy4vc3ZncycpO1xuXG52YXIgUEFHRV9SRUFDVElPTlMgPSAncmVhY3Rpb25zJztcbnZhciBQQUdFX0RFRkFVTFRTID0gJ2RlZmF1bHRzJztcbnZhciBQQUdFX0FVVE8gPSAnYXV0byc7XG5cbnZhciBTRUxFQ1RPUl9SRUFDVElPTlNfV0lER0VUID0gJy5hbnRlbm5hLXJlYWN0aW9ucy13aWRnZXQnO1xuXG52YXIgb3Blbkluc3RhbmNlcyA9IFtdO1xuXG5mdW5jdGlvbiBvcGVuUmVhY3Rpb25zV2lkZ2V0KG9wdGlvbnMsIGVsZW1lbnRPckNvb3Jkcykge1xuICAgIGNsb3NlQWxsV2luZG93cygpO1xuICAgIHZhciBkZWZhdWx0UmVhY3Rpb25zID0gb3B0aW9ucy5kZWZhdWx0UmVhY3Rpb25zO1xuICAgIHZhciByZWFjdGlvbnNEYXRhID0gb3B0aW9ucy5yZWFjdGlvbnNEYXRhO1xuICAgIHZhciBjb250YWluZXJEYXRhID0gb3B0aW9ucy5jb250YWluZXJEYXRhO1xuICAgIHZhciBjb250YWluZXJFbGVtZW50ID0gb3B0aW9ucy5jb250YWluZXJFbGVtZW50OyAvLyBvcHRpb25hbFxuICAgIHZhciBzdGFydFBhZ2UgPSBvcHRpb25zLnN0YXJ0UGFnZSB8fCBQQUdFX0FVVE87IC8vIG9wdGlvbmFsXG4gICAgdmFyIGlzU3VtbWFyeSA9IG9wdGlvbnMuaXNTdW1tYXJ5ID09PSB1bmRlZmluZWQgPyBmYWxzZSA6IG9wdGlvbnMuaXNTdW1tYXJ5OyAvLyBvcHRpb25hbFxuICAgIC8vIGNvbnRlbnREYXRhIGNvbnRhaW5zIGRldGFpbHMgYWJvdXQgdGhlIGNvbnRlbnQgYmVpbmcgcmVhY3RlZCB0byBsaWtlIHRleHQgcmFuZ2Ugb3IgaW1hZ2UgaGVpZ2h0L3dpZHRoLlxuICAgIC8vIHdlIHBvdGVudGlhbGx5IG1vZGlmeSB0aGlzIGRhdGEgKGUuZy4gaW4gdGhlIGRlZmF1bHQgcmVhY3Rpb24gY2FzZSB3ZSBzZWxlY3QgdGhlIHRleHQgb3Vyc2VsdmVzKSBzbyB3ZVxuICAgIC8vIG1ha2UgYSBsb2NhbCBjb3B5IG9mIGl0IHRvIGF2b2lkIHVuZXhwZWN0ZWRseSBjaGFuZ2luZyBkYXRhIG91dCBmcm9tIHVuZGVyIG9uZSBvZiB0aGUgY2xpZW50c1xuICAgIHZhciBjb250ZW50RGF0YSA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkob3B0aW9ucy5jb250ZW50RGF0YSkpO1xuICAgIHZhciBwYWdlRGF0YSA9IG9wdGlvbnMucGFnZURhdGE7XG4gICAgdmFyIGdyb3VwU2V0dGluZ3MgPSBvcHRpb25zLmdyb3VwU2V0dGluZ3M7XG4gICAgdmFyIHJhY3RpdmUgPSBSYWN0aXZlKHtcbiAgICAgICAgZWw6IFdpZGdldEJ1Y2tldC5nZXQoKSxcbiAgICAgICAgYXBwZW5kOiB0cnVlLFxuICAgICAgICBkYXRhOiB7fSxcbiAgICAgICAgdGVtcGxhdGU6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9yZWFjdGlvbnMtd2lkZ2V0Lmhicy5odG1sJyksXG4gICAgICAgIHBhcnRpYWxzOiB7XG4gICAgICAgICAgICBsb2dvOiBTVkdzLmxvZ29cbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmFjdGl2ZS5vbignY2xvc2UnLCBjbG9zZUFsbFdpbmRvd3MpO1xuICAgIG9wZW5JbnN0YW5jZXMucHVzaChyYWN0aXZlKTtcbiAgICB2YXIgJHJvb3RFbGVtZW50ID0gJChyb290RWxlbWVudChyYWN0aXZlKSk7XG4gICAgTW92ZWFibGUubWFrZU1vdmVhYmxlKCRyb290RWxlbWVudCwgJHJvb3RFbGVtZW50LmZpbmQoJy5hbnRlbm5hLWhlYWRlcicpKTtcbiAgICB2YXIgcGFnZXMgPSBbXTtcblxuICAgIG9wZW5XaW5kb3coKTtcblxuICAgIGZ1bmN0aW9uIG9wZW5XaW5kb3coKSB7XG4gICAgICAgIFBhZ2VEYXRhLmNsZWFySW5kaWNhdG9yTGltaXQocGFnZURhdGEpO1xuICAgICAgICB2YXIgY29vcmRzO1xuICAgICAgICBpZiAoZWxlbWVudE9yQ29vcmRzLnRvcCAmJiBlbGVtZW50T3JDb29yZHMubGVmdCkge1xuICAgICAgICAgICAgY29vcmRzID0gZWxlbWVudE9yQ29vcmRzO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyICRyZWxhdGl2ZUVsZW1lbnQgPSAkKGVsZW1lbnRPckNvb3Jkcyk7XG4gICAgICAgICAgICB2YXIgb2Zmc2V0ID0gJHJlbGF0aXZlRWxlbWVudC5vZmZzZXQoKTtcbiAgICAgICAgICAgIGNvb3JkcyA9IHtcbiAgICAgICAgICAgICAgICB0b3A6IG9mZnNldC50b3AsXG4gICAgICAgICAgICAgICAgbGVmdDogb2Zmc2V0LmxlZnRcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGhvcml6b250YWxPdmVyZmxvdyA9IGNvb3Jkcy5sZWZ0ICsgJHJvb3RFbGVtZW50LndpZHRoKCkgLSBNYXRoLm1heChkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50V2lkdGgsIHdpbmRvdy5pbm5lcldpZHRoIHx8IDApOyAvLyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzEyNDgwODEvZ2V0LXRoZS1icm93c2VyLXZpZXdwb3J0LWRpbWVuc2lvbnMtd2l0aC1qYXZhc2NyaXB0Lzg4NzYwNjkjODg3NjA2OVxuICAgICAgICBpZiAoaG9yaXpvbnRhbE92ZXJmbG93ID4gMCkge1xuICAgICAgICAgICAgY29vcmRzLmxlZnQgPSBjb29yZHMubGVmdCAtIGhvcml6b250YWxPdmVyZmxvdztcbiAgICAgICAgfVxuICAgICAgICAkcm9vdEVsZW1lbnQuc3RvcCh0cnVlLCB0cnVlKS5hZGRDbGFzcygnb3BlbicpLmNzcyhjb29yZHMpO1xuXG4gICAgICAgIHZhciBpc1Nob3dSZWFjdGlvbnMgPSBzdGFydFBhZ2UgPT09IFBBR0VfUkVBQ1RJT05TIHx8IChzdGFydFBhZ2UgPT09IFBBR0VfQVVUTyAmJiByZWFjdGlvbnNEYXRhLmxlbmd0aCA+IDApO1xuICAgICAgICBpZiAoaXNTaG93UmVhY3Rpb25zKSB7XG4gICAgICAgICAgICBzaG93UmVhY3Rpb25zKGZhbHNlKTtcbiAgICAgICAgfSBlbHNlIHsgLy8gc3RhcnRQYWdlID09PSBwYWdlRGVmYXVsdHMgfHwgdGhlcmUgYXJlIG5vIHJlYWN0aW9uc1xuICAgICAgICAgICAgc2hvd0RlZmF1bHRSZWFjdGlvbnNQYWdlKGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaXNTdW1tYXJ5KSB7XG4gICAgICAgICAgICBFdmVudHMucG9zdFN1bW1hcnlPcGVuZWQoaXNTaG93UmVhY3Rpb25zLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBFdmVudHMucG9zdFJlYWN0aW9uV2lkZ2V0T3BlbmVkKGlzU2hvd1JlYWN0aW9ucywgcGFnZURhdGEsIGNvbnRhaW5lckRhdGEsIGNvbnRlbnREYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHNldHVwV2luZG93Q2xvc2UocGFnZXMsIHJhY3RpdmUpO1xuICAgICAgICBwcmV2ZW50RXh0cmFTY3JvbGwoJHJvb3RFbGVtZW50KTtcbiAgICAgICAgb3Blbkluc3RhbmNlcy5wdXNoKHJhY3RpdmUpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNob3dSZWFjdGlvbnMoYW5pbWF0ZSwgcmV2ZXJzZSkge1xuICAgICAgICB2YXIgb3B0aW9ucyA9IHtcbiAgICAgICAgICAgIGlzU3VtbWFyeTogaXNTdW1tYXJ5LFxuICAgICAgICAgICAgcmVhY3Rpb25zRGF0YTogcmVhY3Rpb25zRGF0YSxcbiAgICAgICAgICAgIHBhZ2VEYXRhOiBwYWdlRGF0YSxcbiAgICAgICAgICAgIGdyb3VwU2V0dGluZ3M6IGdyb3VwU2V0dGluZ3MsXG4gICAgICAgICAgICBjb250YWluZXJEYXRhOiBjb250YWluZXJEYXRhLFxuICAgICAgICAgICAgY29udGFpbmVyRWxlbWVudDogY29udGFpbmVyRWxlbWVudCxcbiAgICAgICAgICAgIGNvbnRlbnREYXRhOiBjb250ZW50RGF0YSxcbiAgICAgICAgICAgIHNob3dDb25maXJtYXRpb246IHNob3dDb25maXJtYXRpb24sXG4gICAgICAgICAgICBzaG93RGVmYXVsdHM6IGZ1bmN0aW9uKCkgeyBzaG93RGVmYXVsdFJlYWN0aW9uc1BhZ2UodHJ1ZSkgfSxcbiAgICAgICAgICAgIHNob3dDb21tZW50czogc2hvd0NvbW1lbnRzLFxuICAgICAgICAgICAgc2hvd0xvY2F0aW9uczogc2hvd0xvY2F0aW9ucyxcbiAgICAgICAgICAgIGVsZW1lbnQ6IHBhZ2VDb250YWluZXIocmFjdGl2ZSksXG4gICAgICAgICAgICByZWFjdGlvbnNXaW5kb3c6ICRyb290RWxlbWVudFxuICAgICAgICB9O1xuICAgICAgICB2YXIgcGFnZSA9IFJlYWN0aW9uc1BhZ2UuY3JlYXRlKG9wdGlvbnMpO1xuICAgICAgICBwYWdlcy5wdXNoKHBhZ2UpO1xuICAgICAgICBpZiAocmV2ZXJzZSkge1xuICAgICAgICAgICAgZ29CYWNrVG9QYWdlKHBhZ2VzLCBwYWdlLnNlbGVjdG9yLCAkcm9vdEVsZW1lbnQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2hvd1BhZ2UocGFnZS5zZWxlY3RvciwgJHJvb3RFbGVtZW50LCBhbmltYXRlLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBiYWNrVG9SZWFjdGlvbnMoKSB7XG4gICAgICAgIHNldFdpbmRvd1RpdGxlKE1lc3NhZ2VzLmdldE1lc3NhZ2UoJ3JlYWN0aW9ucy13aWRnZXRfdGl0bGUnKSk7XG4gICAgICAgIHNob3dSZWFjdGlvbnModHJ1ZSwgdHJ1ZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2hvd0RlZmF1bHRSZWFjdGlvbnNQYWdlKGFuaW1hdGUpIHtcbiAgICAgICAgaWYgKGNvbnRhaW5lckVsZW1lbnQgJiYgIWNvbnRlbnREYXRhLmxvY2F0aW9uICYmICFjb250ZW50RGF0YS5ib2R5KSB7XG4gICAgICAgICAgICBSYW5nZS5ncmFiTm9kZShjb250YWluZXJFbGVtZW50LmdldCgwKSwgZnVuY3Rpb24gKHRleHQsIGxvY2F0aW9uKSB7XG4gICAgICAgICAgICAgICAgY29udGVudERhdGEubG9jYXRpb24gPSBsb2NhdGlvbjtcbiAgICAgICAgICAgICAgICBjb250ZW50RGF0YS5ib2R5ID0gdGV4dDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHZhciBvcHRpb25zID0geyAvLyBUT0RPOiBjbGVhbiB1cCB0aGUgbnVtYmVyIG9mIHRoZXNlIFwib3B0aW9uc1wiIG9iamVjdHMgdGhhdCB3ZSBjcmVhdGUuXG4gICAgICAgICAgICBkZWZhdWx0UmVhY3Rpb25zOiBkZWZhdWx0UmVhY3Rpb25zLFxuICAgICAgICAgICAgcGFnZURhdGE6IHBhZ2VEYXRhLFxuICAgICAgICAgICAgZ3JvdXBTZXR0aW5nczogZ3JvdXBTZXR0aW5ncyxcbiAgICAgICAgICAgIGNvbnRhaW5lckRhdGE6IGNvbnRhaW5lckRhdGEsXG4gICAgICAgICAgICBjb250ZW50RGF0YTogY29udGVudERhdGEsXG4gICAgICAgICAgICBzaG93Q29uZmlybWF0aW9uOiBzaG93Q29uZmlybWF0aW9uLFxuICAgICAgICAgICAgZWxlbWVudDogcGFnZUNvbnRhaW5lcihyYWN0aXZlKSxcbiAgICAgICAgICAgIHJlYWN0aW9uc1dpbmRvdzogJHJvb3RFbGVtZW50XG4gICAgICAgIH07XG4gICAgICAgIHZhciBwYWdlID0gRGVmYXVsdHNQYWdlLmNyZWF0ZShvcHRpb25zKTtcbiAgICAgICAgcGFnZXMucHVzaChwYWdlKTtcbiAgICAgICAgc2hvd1BhZ2UocGFnZS5zZWxlY3RvciwgJHJvb3RFbGVtZW50LCBhbmltYXRlKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzaG93Q29uZmlybWF0aW9uKHJlYWN0aW9uRGF0YSwgcmVhY3Rpb25Qcm92aWRlcikge1xuICAgICAgICBzZXRXaW5kb3dUaXRsZShNZXNzYWdlcy5nZXRNZXNzYWdlKCdyZWFjdGlvbnMtd2lkZ2V0X3RpdGxlX3RoYW5rcycpKTtcbiAgICAgICAgdmFyIHBhZ2UgPSBDb25maXJtYXRpb25QYWdlLmNyZWF0ZShyZWFjdGlvbkRhdGEudGV4dCwgcmVhY3Rpb25Qcm92aWRlciwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MsIHBhZ2VDb250YWluZXIocmFjdGl2ZSkpO1xuICAgICAgICBwYWdlcy5wdXNoKHBhZ2UpO1xuXG4gICAgICAgIC8vIFRPRE86IHJldmlzaXQgd2h5IHdlIG5lZWQgdG8gdXNlIHRoZSB0aW1lb3V0IHRyaWNrIGZvciB0aGUgY29uZmlybSBwYWdlLCBidXQgbm90IGZvciB0aGUgZGVmYXVsdHMgcGFnZVxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyAvLyBJbiBvcmRlciBmb3IgdGhlIHBvc2l0aW9uaW5nIGFuaW1hdGlvbiB0byB3b3JrLCB3ZSBuZWVkIHRvIGxldCB0aGUgYnJvd3NlciByZW5kZXIgdGhlIGFwcGVuZGVkIERPTSBlbGVtZW50XG4gICAgICAgICAgICBzaG93UGFnZShwYWdlLnNlbGVjdG9yLCAkcm9vdEVsZW1lbnQsIHRydWUpO1xuICAgICAgICB9LCAxKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzaG93UHJvZ3Jlc3NQYWdlKCkge1xuICAgICAgICBzaG93UGFnZSgnLmFudGVubmEtcHJvZ3Jlc3MtcGFnZScsICRyb290RWxlbWVudCwgZmFsc2UsIHRydWUpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNob3dDb21tZW50cyhyZWFjdGlvbikge1xuICAgICAgICBzaG93UHJvZ3Jlc3NQYWdlKCk7IC8vIFRPRE86IHByb3ZpZGUgc29tZSB3YXkgZm9yIHRoZSB1c2VyIHRvIGdpdmUgdXAgLyBjYW5jZWwuIEFsc28sIGhhbmRsZSBlcnJvcnMgZmV0Y2hpbmcgY29tbWVudHMuXG4gICAgICAgIEFqYXhDbGllbnQuZ2V0Q29tbWVudHMocmVhY3Rpb24sIGZ1bmN0aW9uKGNvbW1lbnRzKSB7XG4gICAgICAgICAgICB2YXIgb3B0aW9ucyA9IHtcbiAgICAgICAgICAgICAgICByZWFjdGlvbjogcmVhY3Rpb24sXG4gICAgICAgICAgICAgICAgY29tbWVudHM6IGNvbW1lbnRzLFxuICAgICAgICAgICAgICAgIGVsZW1lbnQ6IHBhZ2VDb250YWluZXIocmFjdGl2ZSksXG4gICAgICAgICAgICAgICAgZ29CYWNrOiBiYWNrVG9SZWFjdGlvbnMsXG4gICAgICAgICAgICAgICAgY29udGFpbmVyRGF0YTogY29udGFpbmVyRGF0YSxcbiAgICAgICAgICAgICAgICBwYWdlRGF0YTogcGFnZURhdGEsXG4gICAgICAgICAgICAgICAgZ3JvdXBTZXR0aW5nczogZ3JvdXBTZXR0aW5nc1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHZhciBwYWdlID0gQ29tbWVudHNQYWdlLmNyZWF0ZShvcHRpb25zKTtcbiAgICAgICAgICAgIHBhZ2VzLnB1c2gocGFnZSk7XG5cbiAgICAgICAgICAgIC8vIFRPRE86IHJldmlzaXRcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IC8vIEluIG9yZGVyIGZvciB0aGUgcG9zaXRpb25pbmcgYW5pbWF0aW9uIHRvIHdvcmssIHdlIG5lZWQgdG8gbGV0IHRoZSBicm93c2VyIHJlbmRlciB0aGUgYXBwZW5kZWQgRE9NIGVsZW1lbnRcbiAgICAgICAgICAgICAgICBzaG93UGFnZShwYWdlLnNlbGVjdG9yLCAkcm9vdEVsZW1lbnQsIHRydWUpO1xuICAgICAgICAgICAgfSwgMSk7XG5cbiAgICAgICAgICAgIEV2ZW50cy5wb3N0Q29tbWVudHNWaWV3ZWQocGFnZURhdGEsIGNvbnRhaW5lckRhdGEsIHJlYWN0aW9uLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2hvd0xvY2F0aW9ucyhyZWFjdGlvbikge1xuICAgICAgICBzaG93UHJvZ3Jlc3NQYWdlKCk7IC8vIFRPRE86IHByb3ZpZGUgc29tZSB3YXkgZm9yIHRoZSB1c2VyIHRvIGdpdmUgdXAgLyBjYW5jZWwuIEFsc28sIGhhbmRsZSBlcnJvcnMgZmV0Y2hpbmcgY29tbWVudHMuXG4gICAgICAgIHZhciByZWFjdGlvbkxvY2F0aW9uRGF0YSA9IFBhZ2VEYXRhLmdldFJlYWN0aW9uTG9jYXRpb25EYXRhKHJlYWN0aW9uLCBwYWdlRGF0YSk7XG4gICAgICAgIEFqYXhDbGllbnQuZmV0Y2hMb2NhdGlvbkRldGFpbHMocmVhY3Rpb25Mb2NhdGlvbkRhdGEsIHBhZ2VEYXRhLCBmdW5jdGlvbihsb2NhdGlvbkRldGFpbHMpIHtcbiAgICAgICAgICAgIFBhZ2VEYXRhLnVwZGF0ZVJlYWN0aW9uTG9jYXRpb25EYXRhKHJlYWN0aW9uTG9jYXRpb25EYXRhLCBsb2NhdGlvbkRldGFpbHMpO1xuICAgICAgICAgICAgdmFyIG9wdGlvbnMgPSB7IC8vIFRPRE86IGNsZWFuIHVwIHRoZSBudW1iZXIgb2YgdGhlc2UgXCJvcHRpb25zXCIgb2JqZWN0cyB0aGF0IHdlIGNyZWF0ZS5cbiAgICAgICAgICAgICAgICBlbGVtZW50OiBwYWdlQ29udGFpbmVyKHJhY3RpdmUpLFxuICAgICAgICAgICAgICAgIHJlYWN0aW9uTG9jYXRpb25EYXRhOiByZWFjdGlvbkxvY2F0aW9uRGF0YSxcbiAgICAgICAgICAgICAgICBwYWdlRGF0YTogcGFnZURhdGEsXG4gICAgICAgICAgICAgICAgZ3JvdXBTZXR0aW5nczogZ3JvdXBTZXR0aW5ncyxcbiAgICAgICAgICAgICAgICBjbG9zZVdpbmRvdzogY2xvc2VBbGxXaW5kb3dzLFxuICAgICAgICAgICAgICAgIGdvQmFjazogYmFja1RvUmVhY3Rpb25zXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdmFyIHBhZ2UgPSBMb2NhdGlvbnNQYWdlLmNyZWF0ZShvcHRpb25zKTtcbiAgICAgICAgICAgIHBhZ2VzLnB1c2gocGFnZSk7XG4gICAgICAgICAgICBzZXRXaW5kb3dUaXRsZShyZWFjdGlvbi50ZXh0KTtcbiAgICAgICAgICAgIC8vIFRPRE86IHJldmlzaXRcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IC8vIEluIG9yZGVyIGZvciB0aGUgcG9zaXRpb25pbmcgYW5pbWF0aW9uIHRvIHdvcmssIHdlIG5lZWQgdG8gbGV0IHRoZSBicm93c2VyIHJlbmRlciB0aGUgYXBwZW5kZWQgRE9NIGVsZW1lbnRcbiAgICAgICAgICAgICAgICBzaG93UGFnZShwYWdlLnNlbGVjdG9yLCAkcm9vdEVsZW1lbnQsIHRydWUpO1xuICAgICAgICAgICAgfSwgMSk7XG4gICAgICAgICAgICBFdmVudHMucG9zdExvY2F0aW9uc1ZpZXdlZChwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNldFdpbmRvd1RpdGxlKHRpdGxlKSB7XG4gICAgICAgICQocmFjdGl2ZS5maW5kKCcuYW50ZW5uYS1yZWFjdGlvbnMtdGl0bGUnKSkuaHRtbCh0aXRsZSk7XG4gICAgfVxuXG59XG5cbmZ1bmN0aW9uIHJvb3RFbGVtZW50KHJhY3RpdmUpIHtcbiAgICByZXR1cm4gcmFjdGl2ZS5maW5kKFNFTEVDVE9SX1JFQUNUSU9OU19XSURHRVQpO1xufVxuXG5mdW5jdGlvbiBwYWdlQ29udGFpbmVyKHJhY3RpdmUpIHtcbiAgICByZXR1cm4gcmFjdGl2ZS5maW5kKCcuYW50ZW5uYS1wYWdlLWNvbnRhaW5lcicpO1xufVxuXG52YXIgcGFnZVogPSAxMDAwOyAvLyBJdCdzIHNhZmUgZm9yIHRoaXMgdmFsdWUgdG8gZ28gYWNyb3NzIGluc3RhbmNlcy4gV2UganVzdCBuZWVkIGl0IHRvIGNvbnRpbnVvdXNseSBpbmNyZWFzZSAobWF4IHZhbHVlIGlzIG92ZXIgMiBiaWxsaW9uKS5cblxuZnVuY3Rpb24gc2hvd1BhZ2UocGFnZVNlbGVjdG9yLCAkcm9vdEVsZW1lbnQsIGFuaW1hdGUsIG92ZXJsYXkpIHtcbiAgICB2YXIgJHBhZ2UgPSAkcm9vdEVsZW1lbnQuZmluZChwYWdlU2VsZWN0b3IpO1xuICAgICRwYWdlLmNzcygnei1pbmRleCcsIHBhZ2VaKTtcbiAgICBwYWdlWiArPSAxO1xuXG4gICAgJHBhZ2UudG9nZ2xlQ2xhc3MoJ2FudGVubmEtcGFnZS1hbmltYXRlJywgYW5pbWF0ZSk7XG5cbiAgICBpZiAob3ZlcmxheSkge1xuICAgICAgICAvLyBJbiB0aGUgb3ZlcmxheSBjYXNlLCBzaXplIHRoZSBwYWdlIHRvIG1hdGNoIHdoYXRldmVyIHBhZ2UgaXMgY3VycmVudGx5IHNob3dpbmcgYW5kIHRoZW4gbWFrZSBpdCBhY3RpdmUgKHRoZXJlIHdpbGwgYmUgdHdvICdhY3RpdmUnIHBhZ2VzKVxuICAgICAgICB2YXIgJGN1cnJlbnQgPSAkcm9vdEVsZW1lbnQuZmluZCgnLmFudGVubmEtcGFnZS1hY3RpdmUnKTtcbiAgICAgICAgJHBhZ2UuaGVpZ2h0KCRjdXJyZW50LmhlaWdodCgpKTtcbiAgICAgICAgJHBhZ2UuYWRkQ2xhc3MoJ2FudGVubmEtcGFnZS1hY3RpdmUnKTtcbiAgICB9IGVsc2UgaWYgKGFuaW1hdGUpIHtcbiAgICAgICAgVHJhbnNpdGlvblV0aWwudG9nZ2xlQ2xhc3MoJHBhZ2UsICdhbnRlbm5hLXBhZ2UtYWN0aXZlJywgdHJ1ZSwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAvLyBBZnRlciB0aGUgbmV3IHBhZ2Ugc2xpZGVzIGludG8gcG9zaXRpb24sIG1vdmUgdGhlIG90aGVyIHBhZ2VzIGJhY2sgb3V0IG9mIHRoZSB2aWV3YWJsZSBhcmVhXG4gICAgICAgICAgICAkcm9vdEVsZW1lbnQuZmluZCgnLmFudGVubmEtcGFnZScpLm5vdChwYWdlU2VsZWN0b3IpLnJlbW92ZUNsYXNzKCdhbnRlbm5hLXBhZ2UtYWN0aXZlJyk7XG4gICAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICAgICRwYWdlLmFkZENsYXNzKCdhbnRlbm5hLXBhZ2UtYWN0aXZlJyk7XG4gICAgICAgICRyb290RWxlbWVudC5maW5kKCcuYW50ZW5uYS1wYWdlJykubm90KHBhZ2VTZWxlY3RvcikucmVtb3ZlQ2xhc3MoJ2FudGVubmEtcGFnZS1hY3RpdmUnKTtcbiAgICB9XG4gICAgc2l6ZUJvZHlUb0ZpdCgkcm9vdEVsZW1lbnQsICRwYWdlLCBhbmltYXRlKTtcbn1cblxuZnVuY3Rpb24gZ29CYWNrVG9QYWdlKHBhZ2VzLCBwYWdlU2VsZWN0b3IsICRyb290RWxlbWVudCkge1xuICAgIHZhciAkdGFyZ2V0UGFnZSA9ICRyb290RWxlbWVudC5maW5kKHBhZ2VTZWxlY3Rvcik7XG4gICAgdmFyICRjdXJyZW50UGFnZSA9ICRyb290RWxlbWVudC5maW5kKCcuYW50ZW5uYS1wYWdlLWFjdGl2ZScpO1xuICAgIC8vIE1vdmUgdGhlIHRhcmdldCBwYWdlIGludG8gcGxhY2UsIHVuZGVyIHRoZSBjdXJyZW50IHBhZ2VcbiAgICAkdGFyZ2V0UGFnZS5jc3MoJ3otaW5kZXgnLCBwYXJzZUludCgkY3VycmVudFBhZ2UuY3NzKCd6LWluZGV4JykpIC0gMSk7XG4gICAgJHRhcmdldFBhZ2UudG9nZ2xlQ2xhc3MoJ2FudGVubmEtcGFnZS1hbmltYXRlJywgZmFsc2UpO1xuICAgICR0YXJnZXRQYWdlLnRvZ2dsZUNsYXNzKCdhbnRlbm5hLXBhZ2UtYWN0aXZlJywgdHJ1ZSk7XG5cbiAgICAvLyBUaGVuIGFuaW1hdGUgdGhlIGN1cnJlbnQgcGFnZSBtb3ZpbmcgYXdheSB0byByZXZlYWwgdGhlIHRhcmdldC5cbiAgICAkY3VycmVudFBhZ2UudG9nZ2xlQ2xhc3MoJ2FudGVubmEtcGFnZS1hbmltYXRlJywgdHJ1ZSk7XG4gICAgVHJhbnNpdGlvblV0aWwudG9nZ2xlQ2xhc3MoJGN1cnJlbnRQYWdlLCAnYW50ZW5uYS1wYWdlLWFjdGl2ZScsIGZhbHNlLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8vIEFmdGVyIHRoZSBjdXJyZW50IHBhZ2Ugc2xpZGVzIGludG8gcG9zaXRpb24sIG1vdmUgYWxsIG90aGVyIHBhZ2VzIGJhY2sgb3V0IG9mIHRoZSB2aWV3YWJsZSBhcmVhXG4gICAgICAgICRyb290RWxlbWVudC5maW5kKCcuYW50ZW5uYS1wYWdlJykubm90KHBhZ2VTZWxlY3RvcikucmVtb3ZlQ2xhc3MoJ2FudGVubmEtcGFnZS1hY3RpdmUnKTtcbiAgICAgICAgJHRhcmdldFBhZ2UuY3NzKCd6LWluZGV4JywgcGFnZVorKyk7IC8vIFdoZW4gdGhlIGFuaW1hdGlvbiBpcyBkb25lLCBtYWtlIHN1cmUgdGhlIGN1cnJlbnQgcGFnZSBoYXMgdGhlIGhpZ2hlc3Qgei1pbmRleCAoanVzdCBmb3IgY29uc2lzdGVuY3kpXG4gICAgICAgIC8vIFRlYXJkb3duIGFsbCBvdGhlciBwYWdlcy4gVGhleSdsbCBiZSByZS1jcmVhdGVkIGlmIG5lY2Vzc2FyeS5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYWdlcy5sZW5ndGggLSAxOyBpKyspIHtcbiAgICAgICAgICAgIHBhZ2VzW2ldLnRlYXJkb3duKCk7XG4gICAgICAgIH1cbiAgICAgICAgcGFnZXMuc3BsaWNlKDAsIHBhZ2VzLmxlbmd0aCAtIDEpO1xuICAgIH0pO1xuICAgIHNpemVCb2R5VG9GaXQoJHJvb3RFbGVtZW50LCAkdGFyZ2V0UGFnZSwgdHJ1ZSk7XG59XG5cbmZ1bmN0aW9uIHNpemVCb2R5VG9GaXQoJHJvb3RFbGVtZW50LCAkcGFnZSwgYW5pbWF0ZSkge1xuICAgIHZhciAkcGFnZUNvbnRhaW5lciA9ICRyb290RWxlbWVudC5maW5kKCcuYW50ZW5uYS1wYWdlLWNvbnRhaW5lcicpO1xuICAgIHZhciAkYm9keSA9ICRwYWdlLmZpbmQoJy5hbnRlbm5hLWJvZHknKTtcbiAgICB2YXIgY3VycmVudEhlaWdodCA9ICRwYWdlQ29udGFpbmVyLmNzcygnaGVpZ2h0Jyk7XG4gICAgJHBhZ2VDb250YWluZXIuY3NzKHsgaGVpZ2h0OiAnJyB9KTsgLy8gQ2xlYXIgYW55IHByZXZpb3VzbHkgY29tcHV0ZWQgaGVpZ2h0IHNvIHdlIGdldCBhIGZyZXNoIGNvbXB1dGF0aW9uIG9mIHRoZSBjaGlsZCBoZWlnaHRzXG4gICAgdmFyIG5ld0JvZHlIZWlnaHQgPSBNYXRoLm1pbigzMDAsICRib2R5LmdldCgwKS5zY3JvbGxIZWlnaHQpO1xuICAgICRib2R5LmNzcyh7IGhlaWdodDogbmV3Qm9keUhlaWdodCB9KTsgLy8gVE9ETzogZG91YmxlLWNoZWNrIHRoYXQgd2UgY2FuJ3QganVzdCBzZXQgYSBtYXgtaGVpZ2h0IG9mIDMwMHB4IG9uIHRoZSBib2R5LlxuICAgIHZhciBmb290ZXJIZWlnaHQgPSAkcGFnZS5maW5kKCcuYW50ZW5uYS1mb290ZXInKS5vdXRlckhlaWdodCgpOyAvLyByZXR1cm5zICdudWxsJyBpZiB0aGVyZSdzIG5vIGZvb3Rlci4gYWRkZWQgdG8gYW4gaW50ZWdlciwgJ251bGwnIGFjdHMgbGlrZSAwXG4gICAgdmFyIG5ld1BhZ2VIZWlnaHQgPSBuZXdCb2R5SGVpZ2h0ICsgZm9vdGVySGVpZ2h0O1xuICAgIGlmIChhbmltYXRlKSB7XG4gICAgICAgICRwYWdlQ29udGFpbmVyLmNzcyh7IGhlaWdodDogY3VycmVudEhlaWdodCB9KTtcbiAgICAgICAgJHBhZ2VDb250YWluZXIuYW5pbWF0ZSh7IGhlaWdodDogbmV3UGFnZUhlaWdodCB9LCAyMDApO1xuICAgIH0gZWxzZSB7XG4gICAgICAgICRwYWdlQ29udGFpbmVyLmNzcyh7IGhlaWdodDogbmV3UGFnZUhlaWdodCB9KTtcbiAgICB9XG4gICAgLy8gVE9ETzogd2UgbWlnaHQgbm90IG5lZWQgd2lkdGggcmVzaXppbmcgYXQgYWxsLlxuICAgIHZhciBtaW5XaWR0aCA9ICRwYWdlLmNzcygnbWluLXdpZHRoJyk7XG4gICAgdmFyIHdpZHRoID0gcGFyc2VJbnQobWluV2lkdGgpO1xuICAgIGlmICh3aWR0aCA+IDApIHtcbiAgICAgICAgaWYgKGFuaW1hdGUpIHtcbiAgICAgICAgICAgICRyb290RWxlbWVudC5hbmltYXRlKHsgd2lkdGg6IHdpZHRoIH0sIDIwMCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkcm9vdEVsZW1lbnQuY3NzKHsgd2lkdGg6IHdpZHRoIH0pO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBzZXR1cFdpbmRvd0Nsb3NlKHBhZ2VzLCByYWN0aXZlKSB7XG4gICAgdmFyICRyb290RWxlbWVudCA9ICQocm9vdEVsZW1lbnQocmFjdGl2ZSkpO1xuXG4gICAgLy8gVE9ETzogSWYgeW91IG1vdXNlIG92ZXIgdGhlIHRyaWdnZXIgc2xvd2x5IGZyb20gdGhlIHRvcCBsZWZ0LCB0aGUgd2luZG93IG9wZW5zIHdpdGhvdXQgYmVpbmcgdW5kZXIgdGhlIGN1cnNvcixcbiAgICAvLyAgICAgICBzbyBubyBtb3VzZW91dCBldmVudCBpcyByZWNlaXZlZC4gV2hlbiB3ZSBvcGVuIHRoZSB3aW5kb3csIHdlIHNob3VsZCBwcm9iYWJseSBqdXN0IHNjb290IGl0IHVwIHNsaWdodGx5XG4gICAgLy8gICAgICAgaWYgbmVlZGVkIHRvIGFzc3VyZSB0aGF0IGl0J3MgdW5kZXIgdGhlIGN1cnNvci4gQWx0ZXJuYXRpdmVseSwgd2UgY291bGQgYWRqdXN0IHRoZSBtb3VzZW92ZXIgYXJlYSB0byBtYXRjaFxuICAgIC8vICAgICAgIHRoZSByZWdpb24gdGhhdCB0aGUgd2luZG93IG9wZW5zLlxuICAgICRyb290RWxlbWVudFxuICAgICAgICAub24oJ21vdXNlb3V0LmFudGVubmEnLCBkZWxheWVkQ2xvc2VXaW5kb3cpXG4gICAgICAgIC5vbignbW91c2VvdmVyLmFudGVubmEnLCBrZWVwV2luZG93T3BlbilcbiAgICAgICAgLm9uKCdmb2N1c2luLmFudGVubmEnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIE9uY2UgdGhlIHdpbmRvdyBoYXMgZm9jdXMsIGRvbid0IGNsb3NlIGl0IG9uIG1vdXNlb3V0LlxuICAgICAgICAgICAga2VlcFdpbmRvd09wZW4oKTtcbiAgICAgICAgICAgICRyb290RWxlbWVudC5vZmYoJ21vdXNlb3V0LmFudGVubmEnKTtcbiAgICAgICAgICAgICRyb290RWxlbWVudC5vZmYoJ21vdXNlb3Zlci5hbnRlbm5hJyk7XG4gICAgICAgIH0pO1xuICAgICQoZG9jdW1lbnQpLm9uKCdjbGljay5hbnRlbm5hJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgaWYgKCQoZXZlbnQudGFyZ2V0KS5jbG9zZXN0KFNFTEVDVE9SX1JFQUNUSU9OU19XSURHRVQpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgY2xvc2VBbGxXaW5kb3dzKCk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICB2YXIgdGFwTGlzdGVuZXIgPSBUb3VjaFN1cHBvcnQuc2V0dXBUYXAoZG9jdW1lbnQsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGlmICgkKGV2ZW50LnRhcmdldCkuY2xvc2VzdChTRUxFQ1RPUl9SRUFDVElPTlNfV0lER0VUKS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBjbG9zZUFsbFdpbmRvd3MoKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgdmFyIGNsb3NlVGltZXI7XG5cbiAgICBmdW5jdGlvbiBkZWxheWVkQ2xvc2VXaW5kb3coKSB7XG4gICAgICAgIGNsb3NlVGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY2xvc2VUaW1lciA9IG51bGw7XG4gICAgICAgICAgICBjbG9zZUFsbFdpbmRvd3MoKTtcbiAgICAgICAgfSwgNTAwKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBrZWVwV2luZG93T3BlbigpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KGNsb3NlVGltZXIpO1xuICAgIH1cblxuICAgIHJhY3RpdmUub24oJ2ludGVybmFsQ2xvc2VXaW5kb3cnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gQ2xvc2VzIG9uZSBwYXJ0aWN1bGFyIHJlYWN0aW9uIHdpbmRvdy4gVGhpcyBmdW5jdGlvbiBzaG91bGQgb25seSBiZSBjYWxsZWQgZnJvbSBjbG9zZUFsbFdpbmRvd3MsIHdoaWNoIGFsc29cbiAgICAgICAgLy8gY2xlYW5zIHVwIHRoZSBoYW5kbGVzIHdlIG1haW50YWluIHRvIGFsbCB3aW5kb3dzLlxuICAgICAgICBjbGVhclRpbWVvdXQoY2xvc2VUaW1lcik7XG5cbiAgICAgICAgJHJvb3RFbGVtZW50LnN0b3AodHJ1ZSwgdHJ1ZSkuZmFkZU91dCgnZmFzdCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgJHJvb3RFbGVtZW50LmNzcygnZGlzcGxheScsICcnKTsgLy8gQ2xlYXIgdGhlIGRpc3BsYXk6bm9uZSB0aGF0IGZhZGVPdXQgcHV0cyBvbiB0aGUgZWxlbWVudFxuICAgICAgICAgICAgJHJvb3RFbGVtZW50LnJlbW92ZUNsYXNzKCdvcGVuJyk7XG4gICAgICAgIH0pO1xuICAgICAgICAkcm9vdEVsZW1lbnQub2ZmKCcuYW50ZW5uYScpOyAvLyBVbmJpbmQgYWxsIG9mIHRoZSBoYW5kbGVycyBpbiBvdXIgbmFtZXNwYWNlXG4gICAgICAgICQoZG9jdW1lbnQpLm9mZignY2xpY2suYW50ZW5uYScpO1xuICAgICAgICB0YXBMaXN0ZW5lci50ZWFyZG93bigpO1xuICAgICAgICBSYW5nZS5jbGVhckhpZ2hsaWdodHMoKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYWdlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgcGFnZXNbaV0udGVhcmRvd24oKTtcbiAgICAgICAgfVxuICAgICAgICByYWN0aXZlLnRlYXJkb3duKCk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGNsb3NlQWxsV2luZG93cygpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG9wZW5JbnN0YW5jZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgb3Blbkluc3RhbmNlc1tpXS5maXJlKCdpbnRlcm5hbENsb3NlV2luZG93Jyk7XG4gICAgfVxuICAgIG9wZW5JbnN0YW5jZXMgPSBbXTtcbn1cblxuZnVuY3Rpb24gaXNPcGVuV2luZG93KCkge1xuICAgIHJldHVybiBvcGVuSW5zdGFuY2VzLmxlbmd0aCA+IDA7XG59XG5cbi8vIFByZXZlbnQgc2Nyb2xsaW5nIG9mIHRoZSBkb2N1bWVudCBhZnRlciB3ZSBzY3JvbGwgdG8gdGhlIHRvcC9ib3R0b20gb2YgdGhlIHJlYWN0aW9ucyB3aW5kb3dcbi8vIENvZGUgY29waWVkIGZyb206IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvNTgwMjQ2Ny9wcmV2ZW50LXNjcm9sbGluZy1vZi1wYXJlbnQtZWxlbWVudFxuLy8gVE9ETzogZG9lcyB0aGlzIHdvcmsgb24gbW9iaWxlP1xuZnVuY3Rpb24gcHJldmVudEV4dHJhU2Nyb2xsKCRyb290RWxlbWVudCkge1xuICAgICRyb290RWxlbWVudC5vbignRE9NTW91c2VTY3JvbGwuYW50ZW5uYSBtb3VzZXdoZWVsLmFudGVubmEnLCAnLmFudGVubmEtYm9keScsIGZ1bmN0aW9uKGV2KSB7XG4gICAgICAgIHZhciAkdGhpcyA9ICQodGhpcyksXG4gICAgICAgICAgICBzY3JvbGxUb3AgPSB0aGlzLnNjcm9sbFRvcCxcbiAgICAgICAgICAgIHNjcm9sbEhlaWdodCA9IHRoaXMuc2Nyb2xsSGVpZ2h0LFxuICAgICAgICAgICAgaGVpZ2h0ID0gJHRoaXMuaGVpZ2h0KCksXG4gICAgICAgICAgICBkZWx0YSA9IChldi50eXBlID09ICdET01Nb3VzZVNjcm9sbCcgP1xuICAgICAgICAgICAgICAgIGV2Lm9yaWdpbmFsRXZlbnQuZGV0YWlsICogLTQwIDpcbiAgICAgICAgICAgICAgICBldi5vcmlnaW5hbEV2ZW50LndoZWVsRGVsdGEpLFxuICAgICAgICAgICAgdXAgPSBkZWx0YSA+IDA7XG5cbiAgICAgICAgaWYgKHNjcm9sbEhlaWdodCA8PSBoZWlnaHQpIHtcbiAgICAgICAgICAgIC8vIFRoaXMgaXMgYW4gYWRkaXRpb24gdG8gdGhlIFN0YWNrT3ZlcmZsb3cgY29kZSwgdG8gbWFrZSBzdXJlIHRoZSBwYWdlIHNjcm9sbHMgYXMgdXN1YWwgaWYgdGhlIHdpbmRvd1xuICAgICAgICAgICAgLy8gY29udGVudCBkb2Vzbid0IHNjcm9sbC5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBwcmV2ZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBldi5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBldi5yZXR1cm5WYWx1ZSA9IGZhbHNlO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9O1xuXG4gICAgICAgIGlmICghdXAgJiYgLWRlbHRhID4gc2Nyb2xsSGVpZ2h0IC0gaGVpZ2h0IC0gc2Nyb2xsVG9wKSB7XG4gICAgICAgICAgICAvLyBTY3JvbGxpbmcgZG93biwgYnV0IHRoaXMgd2lsbCB0YWtlIHVzIHBhc3QgdGhlIGJvdHRvbS5cbiAgICAgICAgICAgICR0aGlzLnNjcm9sbFRvcChzY3JvbGxIZWlnaHQpO1xuICAgICAgICAgICAgcmV0dXJuIHByZXZlbnQoKTtcbiAgICAgICAgfSBlbHNlIGlmICh1cCAmJiBkZWx0YSA+IHNjcm9sbFRvcCkge1xuICAgICAgICAgICAgLy8gU2Nyb2xsaW5nIHVwLCBidXQgdGhpcyB3aWxsIHRha2UgdXMgcGFzdCB0aGUgdG9wLlxuICAgICAgICAgICAgJHRoaXMuc2Nyb2xsVG9wKDApO1xuICAgICAgICAgICAgcmV0dXJuIHByZXZlbnQoKTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgb3Blbjogb3BlblJlYWN0aW9uc1dpZGdldCxcbiAgICBpc09wZW46IGlzT3BlbldpbmRvdyxcbiAgICBQQUdFX1JFQUNUSU9OUzogUEFHRV9SRUFDVElPTlMsXG4gICAgUEFHRV9ERUZBVUxUUzogUEFHRV9ERUZBVUxUUyxcbiAgICBQQUdFX0FVVE86IFBBR0VfQVVUTyxcbiAgICBzZWxlY3RvcjogU0VMRUNUT1JfUkVBQ1RJT05TX1dJREdFVFxufTsiLCJ2YXIgUmFjdGl2ZVByb3ZpZGVyID0gcmVxdWlyZSgnLi91dGlscy9yYWN0aXZlLXByb3ZpZGVyJyk7XG52YXIgUmFuZ3lQcm92aWRlciA9IHJlcXVpcmUoJy4vdXRpbHMvcmFuZ3ktcHJvdmlkZXInKTtcbnZhciBKUXVlcnlQcm92aWRlciA9IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJyk7XG52YXIgQXBwTW9kZSA9IHJlcXVpcmUoJy4vdXRpbHMvYXBwLW1vZGUnKTtcbnZhciBVUkxDb25zdGFudHMgPSByZXF1aXJlKCcuL3V0aWxzL3VybC1jb25zdGFudHMnKTtcblxudmFyIGJhc2VVcmw7XG5pZiAoQXBwTW9kZS50ZXN0KSB7XG4gICAgYmFzZVVybCA9IFVSTENvbnN0YW50cy5URVNUO1xufSBlbHNlIGlmIChBcHBNb2RlLm9mZmxpbmUpIHtcbiAgICBiYXNlVXJsID0gVVJMQ29uc3RhbnRzLkRFVkVMT1BNRU5UO1xufSBlbHNlIHtcbiAgICBiYXNlVXJsID0gVVJMQ29uc3RhbnRzLlBST0RVQ1RJT047XG59XG5cbnZhciBzY3JpcHRzID0gW1xuICAgIHtzcmM6ICcvL2NkbmpzLmNsb3VkZmxhcmUuY29tL2FqYXgvbGlicy9qcXVlcnkvMi4xLjQvanF1ZXJ5Lm1pbi5qcycsIGNhbGxiYWNrOiBKUXVlcnlQcm92aWRlci5sb2FkZWR9LFxuICAgIHtzcmM6IGJhc2VVcmwgKyAnL3N0YXRpYy9qcy9jZG4vcmFjdGl2ZS8wLjcuMy9yYWN0aXZlLnJ1bnRpbWUuanMnLCBjYWxsYmFjazogUmFjdGl2ZVByb3ZpZGVyLmxvYWRlZCwgYWJvdXRUb0xvYWQ6IFJhY3RpdmVQcm92aWRlci5hYm91dFRvTG9hZH0sXG4gICAge3NyYzogYmFzZVVybCArICcvc3RhdGljL3dpZGdldC1uZXcvbGliL3Jhbmd5LWNvbXBpbGVkLmpzJywgY2FsbGJhY2s6IFJhbmd5UHJvdmlkZXIubG9hZGVkLCBhYm91dFRvTG9hZDogUmFuZ3lQcm92aWRlci5hYm91dFRvTG9hZH0gLy8gVE9ETyBtaW5pZnkgYW5kIGhvc3QgdGhpcyBzb21ld2hlcmVcbl07XG5pZiAoQXBwTW9kZS5vZmZsaW5lKSB7XG4gICAgLy8gVXNlIHRoZSBvZmZsaW5lIHZlcnNpb25zIG9mIHRoZSBsaWJyYXJpZXMgZm9yIGRldmVsb3BtZW50LlxuICAgIHNjcmlwdHMgPSBbXG4gICAgICAgIHtzcmM6IGJhc2VVcmwgKyAnL3N0YXRpYy9qcy9jZG4vanF1ZXJ5LzIuMS40L2pxdWVyeS5qcycsIGNhbGxiYWNrOiBKUXVlcnlQcm92aWRlci5sb2FkZWR9LFxuICAgICAgICB7c3JjOiBiYXNlVXJsICsgJy9zdGF0aWMvanMvY2RuL3JhY3RpdmUvMC43LjMvcmFjdGl2ZS5ydW50aW1lLmpzJywgY2FsbGJhY2s6IFJhY3RpdmVQcm92aWRlci5sb2FkZWQsIGFib3V0VG9Mb2FkOiBSYWN0aXZlUHJvdmlkZXIuYWJvdXRUb0xvYWR9LFxuICAgICAgICB7c3JjOiBiYXNlVXJsICsgJy9zdGF0aWMvd2lkZ2V0LW5ldy9saWIvcmFuZ3ktY29tcGlsZWQuanMnLCBjYWxsYmFjazogUmFuZ3lQcm92aWRlci5sb2FkZWQsIGFib3V0VG9Mb2FkOiBSYW5neVByb3ZpZGVyLmFib3V0VG9Mb2FkfVxuICAgIF07XG59XG5cbmZ1bmN0aW9uIGxvYWRBbGxTY3JpcHRzKGxvYWRlZENhbGxiYWNrKSB7XG4gICAgbG9hZFNjcmlwdHMoc2NyaXB0cywgbG9hZGVkQ2FsbGJhY2spO1xufVxuXG5mdW5jdGlvbiBsb2FkU2NyaXB0cyhzY3JpcHRzLCBsb2FkZWRDYWxsYmFjaykge1xuICAgIHZhciBsb2FkaW5nQ291bnQgPSBzY3JpcHRzLmxlbmd0aDtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNjcmlwdHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIHNjcmlwdCA9IHNjcmlwdHNbaV07XG4gICAgICAgIGlmIChzY3JpcHQuYWJvdXRUb0xvYWQpIHsgc2NyaXB0LmFib3V0VG9Mb2FkKCk7IH1cbiAgICAgICAgbG9hZFNjcmlwdChzY3JpcHQuc3JjLCBmdW5jdGlvbihzY3JpcHRDYWxsYmFjaykge1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmIChzY3JpcHRDYWxsYmFjaykgc2NyaXB0Q2FsbGJhY2soKTtcbiAgICAgICAgICAgICAgICBsb2FkaW5nQ291bnQgPSBsb2FkaW5nQ291bnQgLSAxO1xuICAgICAgICAgICAgICAgIGlmIChsb2FkaW5nQ291bnQgPT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAobG9hZGVkQ2FsbGJhY2spIGxvYWRlZENhbGxiYWNrKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSAoc2NyaXB0LmNhbGxiYWNrKSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBsb2FkU2NyaXB0KHNyYywgY2FsbGJhY2spIHtcbiAgICB2YXIgaGVhZCA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF07XG4gICAgaWYgKGhlYWQpIHtcbiAgICAgICAgdmFyIHNjcmlwdFRhZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuICAgICAgICBzY3JpcHRUYWcuc2V0QXR0cmlidXRlKCdzcmMnLCBzcmMpO1xuICAgICAgICBzY3JpcHRUYWcuc2V0QXR0cmlidXRlKCd0eXBlJywndGV4dC9qYXZhc2NyaXB0Jyk7XG5cbiAgICAgICAgaWYgKHNjcmlwdFRhZy5yZWFkeVN0YXRlKSB7IC8vIElFLCBpbmNsLiBJRTlcbiAgICAgICAgICAgIHNjcmlwdFRhZy5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBpZiAoc2NyaXB0VGFnLnJlYWR5U3RhdGUgPT0gXCJsb2FkZWRcIiB8fCBzY3JpcHRUYWcucmVhZHlTdGF0ZSA9PSBcImNvbXBsZXRlXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgc2NyaXB0VGFnLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjYWxsYmFjaykgeyBjYWxsYmFjaygpOyB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNjcmlwdFRhZy5vbmxvYWQgPSBmdW5jdGlvbigpIHsgLy8gT3RoZXIgYnJvd3NlcnNcbiAgICAgICAgICAgICAgICBpZiAoY2FsbGJhY2spIHsgY2FsbGJhY2soKTsgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIGhlYWQuYXBwZW5kQ2hpbGQoc2NyaXB0VGFnKTtcbiAgICB9XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBsb2FkOiBsb2FkQWxsU2NyaXB0c1xufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi91dGlscy9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciBSYWN0aXZlOyByZXF1aXJlKCcuL3V0aWxzL3JhY3RpdmUtcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24obG9hZGVkUmFjdGl2ZSkgeyBSYWN0aXZlID0gbG9hZGVkUmFjdGl2ZTt9KTtcbnZhciBUb3VjaFN1cHBvcnQgPSByZXF1aXJlKCcuL3V0aWxzL3RvdWNoLXN1cHBvcnQnKTtcblxudmFyIFJlYWN0aW9uc1dpZGdldCA9IHJlcXVpcmUoJy4vcmVhY3Rpb25zLXdpZGdldCcpO1xudmFyIFNWR3MgPSByZXF1aXJlKCcuL3N2Z3MnKTtcblxuZnVuY3Rpb24gY3JlYXRlU3VtbWFyeVdpZGdldChjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgZGVmYXVsdFJlYWN0aW9ucywgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciByYWN0aXZlID0gUmFjdGl2ZSh7XG4gICAgICAgIGVsOiAkKCc8ZGl2PicpLCAvLyB0aGUgcmVhbCByb290IG5vZGUgaXMgaW4gdGhlIHRlbXBsYXRlLiBpdCdzIGV4dHJhY3RlZCBhZnRlciB0aGUgdGVtcGxhdGUgaXMgcmVuZGVyZWQgaW50byB0aGlzIGR1bW15IGVsZW1lbnRcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgcGFnZURhdGE6IHBhZ2VEYXRhXG4gICAgICAgIH0sXG4gICAgICAgIG1hZ2ljOiB0cnVlLFxuICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL3N1bW1hcnktd2lkZ2V0Lmhicy5odG1sJyksXG4gICAgICAgIHBhcnRpYWxzOiB7XG4gICAgICAgICAgICBsb2dvOiBTVkdzLmxvZ29cbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHZhciAkcm9vdEVsZW1lbnQgPSAkKHJvb3RFbGVtZW50KHJhY3RpdmUpKTtcbiAgICAkcm9vdEVsZW1lbnQub24oJ21vdXNlZW50ZXInLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgIG9wZW5SZWFjdGlvbnNXaW5kb3coY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGRlZmF1bHRSZWFjdGlvbnMsIGdyb3VwU2V0dGluZ3MsIHJhY3RpdmUpO1xuICAgIH0pO1xuICAgIFRvdWNoU3VwcG9ydC5zZXR1cFRhcCgkcm9vdEVsZW1lbnQuZ2V0KDApLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBpZiAoIVJlYWN0aW9uc1dpZGdldC5pc09wZW4oKSkge1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIG9wZW5SZWFjdGlvbnNXaW5kb3coY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGRlZmF1bHRSZWFjdGlvbnMsIGdyb3VwU2V0dGluZ3MsIHJhY3RpdmUpO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuICRyb290RWxlbWVudDtcbn1cblxuZnVuY3Rpb24gcm9vdEVsZW1lbnQocmFjdGl2ZSkge1xuICAgIHJldHVybiByYWN0aXZlLmZpbmQoJy5hbnRlbm5hLXN1bW1hcnktd2lkZ2V0Jyk7XG59XG5cbmZ1bmN0aW9uIG9wZW5SZWFjdGlvbnNXaW5kb3coY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGRlZmF1bHRSZWFjdGlvbnMsIGdyb3VwU2V0dGluZ3MsIHJhY3RpdmUpIHtcbiAgICB2YXIgcmVhY3Rpb25zV2lkZ2V0T3B0aW9ucyA9IHtcbiAgICAgICAgaXNTdW1tYXJ5OiB0cnVlLFxuICAgICAgICByZWFjdGlvbnNEYXRhOiBwYWdlRGF0YS5zdW1tYXJ5UmVhY3Rpb25zLFxuICAgICAgICBjb250YWluZXJEYXRhOiBjb250YWluZXJEYXRhLFxuICAgICAgICBkZWZhdWx0UmVhY3Rpb25zOiBkZWZhdWx0UmVhY3Rpb25zLFxuICAgICAgICBwYWdlRGF0YTogcGFnZURhdGEsXG4gICAgICAgIGdyb3VwU2V0dGluZ3M6IGdyb3VwU2V0dGluZ3MsXG4gICAgICAgIGNvbnRlbnREYXRhOiB7IHR5cGU6ICdwYWdlJywgYm9keTogJycgfVxuICAgIH07XG4gICAgUmVhY3Rpb25zV2lkZ2V0Lm9wZW4ocmVhY3Rpb25zV2lkZ2V0T3B0aW9ucywgcm9vdEVsZW1lbnQocmFjdGl2ZSkpO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlOiBjcmVhdGVTdW1tYXJ5V2lkZ2V0XG59OyIsInZhciBSYWN0aXZlOyByZXF1aXJlKCcuL3V0aWxzL3JhY3RpdmUtcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24obG9hZGVkUmFjdGl2ZSkgeyBSYWN0aXZlID0gbG9hZGVkUmFjdGl2ZTt9KTtcblxuLy8gQWJvdXQgaG93IHdlIGhhbmRsZSBpY29uczogV2UgaW5zZXJ0IGEgc2luZ2xlIFNWRyBlbGVtZW50IGF0IHRoZSB0b3Agb2YgdGhlIGJvZHkgZWxlbWVudCB3aGljaCBkZWZpbmVzIGFsbCBvZiB0aGVcbi8vIGljb25zIHdlIG5lZWQuIFRoZW4gYWxsIGljb25zIHVzZWQgYnkgdGhlIGFwcGxpY2F0aW9ucyBhcmUgcmVuZGVyZWQgd2l0aCB2ZXJ5IGxpZ2h0d2VpZ2h0IFNWRyBlbGVtZW50cyB0aGF0IHNpbXBseVxuLy8gcG9pbnQgdG8gdGhlIGFwcHJvcHJpYXRlIGljb24gYnkgcmVmZXJlbmNlLlxuXG4vLyBUT0RPOiBsb29rIGludG8gdXNpbmcgYSBzaW5nbGUgdGVtcGxhdGUgZm9yIHRoZSBcInVzZVwiIFNWR3MuIENhbiB3ZSBpbnN0YW50aWF0ZSBhIHBhcnRpYWwgd2l0aCBhIGR5bmFtaWMgY29udGV4dD9cbnZhciB0ZW1wbGF0ZXMgPSB7XG4gICAgbG9nbzogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL3N2Zy1sb2dvLmhicy5odG1sJyksXG4gICAgLy8gVGhlIFwic2VsZWN0YWJsZVwiIGxvZ28gZGVmaW5lcyBhbiBpbmxpbmUgJ3BhdGgnIHJhdGhlciB0aGFuIGEgJ3VzZScgcmVmZXJlbmNlLCBhcyBhIHdvcmthcm91bmQgZm9yIGEgRmlyZWZveCB0ZXh0IHNlbGVjdGlvbiBidWcuXG4gICAgbG9nb1NlbGVjdGFibGU6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9zdmctbG9nby1zZWxlY3RhYmxlLmhicy5odG1sJyksXG4gICAgY29tbWVudHM6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9zdmctY29tbWVudHMuaGJzLmh0bWwnKSxcbiAgICBsb2NhdGlvbjogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL3N2Zy1sb2NhdGlvbi5oYnMuaHRtbCcpLFxuICAgIGZhY2Vib29rOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvc3ZnLWZhY2Vib29rLmhicy5odG1sJyksXG4gICAgdHdpdHRlcjogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL3N2Zy10d2l0dGVyLmhicy5odG1sJyksXG4gICAgbGVmdDogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL3N2Zy1sZWZ0Lmhicy5odG1sJylcbn07XG5cbnZhciBpc1NldHVwID0gZmFsc2U7XG5cbmZ1bmN0aW9uIGVuc3VyZVNldHVwKCkge1xuICAgIGlmICghaXNTZXR1cCkge1xuICAgICAgICB2YXIgZHVtbXkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgUmFjdGl2ZSh7XG4gICAgICAgICAgICBlbDogZHVtbXksXG4gICAgICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL3N2Z3MuaGJzLmh0bWwnKVxuICAgICAgICB9KTtcbiAgICAgICAgLy8gU2FmYXJpIG9uIGlPUyByZXF1aXJlcyB0aGUgU1ZHIHRoYXQgZGVmaW5lcyB0aGUgaWNvbnMgYXBwZWFyIGJlZm9yZSB0aGUgU1ZHcyB0aGF0IHJlZmVyZW5jZSBpdC5cbiAgICAgICAgZG9jdW1lbnQuYm9keS5pbnNlcnRCZWZvcmUoZHVtbXkuY2hpbGRyZW5bMF0sIGRvY3VtZW50LmJvZHkuZmlyc3RDaGlsZCk7XG4gICAgICAgIGlzU2V0dXAgPSB0cnVlO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZ2V0U1ZHKHRlbXBsYXRlKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICBlbnN1cmVTZXR1cCgpO1xuICAgICAgICByZXR1cm4gdGVtcGxhdGU7XG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgbG9nbzogZ2V0U1ZHKHRlbXBsYXRlcy5sb2dvKSxcbiAgICBsb2dvU2VsZWN0YWJsZTogZ2V0U1ZHKHRlbXBsYXRlcy5sb2dvU2VsZWN0YWJsZSksXG4gICAgY29tbWVudHM6IGdldFNWRyh0ZW1wbGF0ZXMuY29tbWVudHMpLFxuICAgIGxvY2F0aW9uOiBnZXRTVkcodGVtcGxhdGVzLmxvY2F0aW9uKSxcbiAgICBmYWNlYm9vazogZ2V0U1ZHKHRlbXBsYXRlcy5mYWNlYm9vayksXG4gICAgdHdpdHRlcjogZ2V0U1ZHKHRlbXBsYXRlcy50d2l0dGVyKSxcbiAgICBsZWZ0OiBnZXRTVkcodGVtcGxhdGVzLmxlZnQpXG59OyIsInZhciAkOyByZXF1aXJlKCcuL3V0aWxzL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIFJhY3RpdmU7IHJlcXVpcmUoJy4vdXRpbHMvcmFjdGl2ZS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihsb2FkZWRSYWN0aXZlKSB7IFJhY3RpdmUgPSBsb2FkZWRSYWN0aXZlO30pO1xudmFyIFJhbmdlID0gcmVxdWlyZSgnLi91dGlscy9yYW5nZScpO1xudmFyIFRvdWNoU3VwcG9ydCA9IHJlcXVpcmUoJy4vdXRpbHMvdG91Y2gtc3VwcG9ydCcpO1xuXG52YXIgUG9wdXBXaWRnZXQgPSByZXF1aXJlKCcuL3BvcHVwLXdpZGdldCcpO1xudmFyIFJlYWN0aW9uc1dpZGdldCA9IHJlcXVpcmUoJy4vcmVhY3Rpb25zLXdpZGdldCcpO1xudmFyIFNWR3MgPSByZXF1aXJlKCcuL3N2Z3MnKTtcblxuXG5mdW5jdGlvbiBjcmVhdGVJbmRpY2F0b3JXaWRnZXQob3B0aW9ucykge1xuICAgIHZhciBjb250YWluZXJEYXRhID0gb3B0aW9ucy5jb250YWluZXJEYXRhO1xuICAgIHZhciAkY29udGFpbmVyRWxlbWVudCA9IG9wdGlvbnMuY29udGFpbmVyRWxlbWVudDtcbiAgICB2YXIgcGFnZURhdGEgPSBvcHRpb25zLnBhZ2VEYXRhO1xuICAgIHZhciBncm91cFNldHRpbmdzID0gb3B0aW9ucy5ncm91cFNldHRpbmdzO1xuICAgIHZhciBkZWZhdWx0UmVhY3Rpb25zID0gb3B0aW9ucy5kZWZhdWx0UmVhY3Rpb25zO1xuICAgIHZhciBjb29yZHMgPSBvcHRpb25zLmNvb3JkcztcbiAgICB2YXIgcmFjdGl2ZSA9IFJhY3RpdmUoe1xuICAgICAgICBlbDogJCgnPGRpdj4nKSwgLy8gdGhlIHJlYWwgcm9vdCBub2RlIGlzIGluIHRoZSB0ZW1wbGF0ZS4gaXQncyBleHRyYWN0ZWQgYWZ0ZXIgdGhlIHRlbXBsYXRlIGlzIHJlbmRlcmVkIGludG8gdGhpcyBkdW1teSBlbGVtZW50XG4gICAgICAgIGFwcGVuZDogdHJ1ZSxcbiAgICAgICAgbWFnaWM6IHRydWUsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIGNvbnRhaW5lckRhdGE6IGNvbnRhaW5lckRhdGEsXG4gICAgICAgICAgICBleHRyYUNsYXNzZXM6IGdyb3VwU2V0dGluZ3MuZW5hYmxlVGV4dEhlbHBlcigpID8gXCJcIiA6IFwiYW50ZW5uYS1ub2hpbnRcIlxuICAgICAgICB9LFxuICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL3RleHQtaW5kaWNhdG9yLXdpZGdldC5oYnMuaHRtbCcpLFxuICAgICAgICBwYXJ0aWFsczoge1xuICAgICAgICAgICAgbG9nbzogU1ZHcy5sb2dvU2VsZWN0YWJsZVxuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICB2YXIgcmVhY3Rpb25XaWRnZXRPcHRpb25zID0ge1xuICAgICAgICByZWFjdGlvbnNEYXRhOiBjb250YWluZXJEYXRhLnJlYWN0aW9ucyxcbiAgICAgICAgY29udGFpbmVyRGF0YTogY29udGFpbmVyRGF0YSxcbiAgICAgICAgY29udGFpbmVyRWxlbWVudDogJGNvbnRhaW5lckVsZW1lbnQsXG4gICAgICAgIGNvbnRlbnREYXRhOiB7IHR5cGU6ICd0ZXh0JyB9LFxuICAgICAgICBkZWZhdWx0UmVhY3Rpb25zOiBkZWZhdWx0UmVhY3Rpb25zLFxuICAgICAgICBwYWdlRGF0YTogcGFnZURhdGEsXG4gICAgICAgIGdyb3VwU2V0dGluZ3M6IGdyb3VwU2V0dGluZ3NcbiAgICB9O1xuXG4gICAgdmFyICRyb290RWxlbWVudCA9ICQocm9vdEVsZW1lbnQocmFjdGl2ZSkpO1xuICAgIGlmIChjb29yZHMpIHtcbiAgICAgICAgJHJvb3RFbGVtZW50LmNzcyh7XG4gICAgICAgICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcbiAgICAgICAgICAgIHRvcDogY29vcmRzLnRvcCAtICRyb290RWxlbWVudC5oZWlnaHQoKSxcbiAgICAgICAgICAgIGJvdHRvbTogY29vcmRzLmJvdHRvbSxcbiAgICAgICAgICAgIGxlZnQ6IGNvb3Jkcy5sZWZ0LFxuICAgICAgICAgICAgcmlnaHQ6IGNvb3Jkcy5yaWdodCxcbiAgICAgICAgICAgICd6LWluZGV4JzogMTAwMCAvLyBUT0RPOiBjb21wdXRlIGEgcmVhbCB2YWx1ZT9cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHZhciBob3ZlclRpbWVvdXQ7XG4gICAgVG91Y2hTdXBwb3J0LnNldHVwVGFwKCRyb290RWxlbWVudC5nZXQoMCksIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIG9wZW5SZWFjdGlvbnNXaW5kb3cocmVhY3Rpb25XaWRnZXRPcHRpb25zLCByYWN0aXZlKVxuICAgIH0pO1xuICAgICRyb290RWxlbWVudC5vbignbW91c2VlbnRlci5hbnRlbm5hJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgaWYgKGV2ZW50LmJ1dHRvbnMgPiAwIHx8IChldmVudC5idXR0b25zID09IHVuZGVmaW5lZCAmJiBldmVudC53aGljaCA+IDApKSB7IC8vIE9uIFNhZmFyaSwgZXZlbnQuYnV0dG9ucyBpcyB1bmRlZmluZWQgYnV0IGV2ZW50LndoaWNoIGdpdmVzIGEgZ29vZCB2YWx1ZS4gZXZlbnQud2hpY2ggaXMgYmFkIG9uIEZGXG4gICAgICAgICAgICAvLyBEb24ndCByZWFjdCBpZiB0aGUgdXNlciBpcyBkcmFnZ2luZyBvciBzZWxlY3RpbmcgdGV4dC5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjbGVhclRpbWVvdXQoaG92ZXJUaW1lb3V0KTsgLy8gb25seSBvbmUgdGltZW91dCBhdCBhIHRpbWVcbiAgICAgICAgaG92ZXJUaW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmIChjb250YWluZXJEYXRhLnJlYWN0aW9ucy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgb3BlblJlYWN0aW9uc1dpbmRvdyhyZWFjdGlvbldpZGdldE9wdGlvbnMsIHJhY3RpdmUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YXIgJGljb24gPSAkKHJvb3RFbGVtZW50KHJhY3RpdmUpKS5maW5kKCcuYW50ZW5uYS1sb2dvJyk7XG4gICAgICAgICAgICAgICAgdmFyIG9mZnNldCA9ICRpY29uLm9mZnNldCgpO1xuICAgICAgICAgICAgICAgIHZhciBjb29yZGluYXRlcyA9IHtcbiAgICAgICAgICAgICAgICAgICAgdG9wOiBvZmZzZXQudG9wICsgTWF0aC5mbG9vcigkaWNvbi5oZWlnaHQoKSAvIDIpLCAvLyBUT0RPIHRoaXMgbnVtYmVyIGlzIGEgbGl0dGxlIG9mZiBiZWNhdXNlIHRoZSBkaXYgZG9lc24ndCB0aWdodGx5IHdyYXAgdGhlIGluc2VydGVkIGZvbnQgY2hhcmFjdGVyXG4gICAgICAgICAgICAgICAgICAgIGxlZnQ6IG9mZnNldC5sZWZ0ICsgTWF0aC5mbG9vcigkaWNvbi53aWR0aCgpIC8gMilcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIFBvcHVwV2lkZ2V0LnNob3coY29vcmRpbmF0ZXMsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBvcGVuUmVhY3Rpb25zV2luZG93KHJlYWN0aW9uV2lkZ2V0T3B0aW9ucywgcmFjdGl2ZSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIDIwMCk7XG4gICAgfSk7XG4gICAgJHJvb3RFbGVtZW50Lm9uKCdtb3VzZWxlYXZlLmFudGVubmEnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KGhvdmVyVGltZW91dCk7XG4gICAgfSk7XG4gICAgJGNvbnRhaW5lckVsZW1lbnQub24oJ21vdXNlZW50ZXIuYW50ZW5uYScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAkcm9vdEVsZW1lbnQuYWRkQ2xhc3MoJ2FjdGl2ZScpO1xuICAgIH0pO1xuICAgICRjb250YWluZXJFbGVtZW50Lm9uKCdtb3VzZWxlYXZlLmFudGVubmEnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgJHJvb3RFbGVtZW50LnJlbW92ZUNsYXNzKCdhY3RpdmUnKTtcbiAgICB9KTtcbiAgICByZXR1cm4gJHJvb3RFbGVtZW50O1xufVxuXG5mdW5jdGlvbiByb290RWxlbWVudChyYWN0aXZlKSB7XG4gICAgcmV0dXJuIHJhY3RpdmUuZmluZCgnLmFudGVubmEtdGV4dC1pbmRpY2F0b3Itd2lkZ2V0Jyk7XG59XG5cbmZ1bmN0aW9uIG9wZW5SZWFjdGlvbnNXaW5kb3cocmVhY3Rpb25PcHRpb25zLCByYWN0aXZlKSB7XG4gICAgUmVhY3Rpb25zV2lkZ2V0Lm9wZW4ocmVhY3Rpb25PcHRpb25zLCByb290RWxlbWVudChyYWN0aXZlKSk7XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGU6IGNyZWF0ZUluZGljYXRvcldpZGdldFxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi91dGlscy9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciBQb3B1cFdpZGdldCA9IHJlcXVpcmUoJy4vcG9wdXAtd2lkZ2V0Jyk7XG52YXIgUmFuZ2UgPSByZXF1aXJlKCcuL3V0aWxzL3JhbmdlJyk7XG52YXIgUmVhY3Rpb25zV2lkZ2V0ID0gcmVxdWlyZSgnLi9yZWFjdGlvbnMtd2lkZ2V0Jyk7XG52YXIgVG91Y2hTdXBwb3J0ID0gcmVxdWlyZSgnLi91dGlscy90b3VjaC1zdXBwb3J0Jyk7XG5cblxuZnVuY3Rpb24gY3JlYXRlUmVhY3RhYmxlVGV4dChvcHRpb25zKSB7XG4gICAgLy8gVE9ETzogaW1wb3NlIGFuIHVwcGVyIGxpbWl0IG9uIHRoZSBsZW5ndGggb2YgdGV4dCB0aGF0IGNhbiBiZSByZWFjdGVkIHRvPyAoYXBwbGllcyB0byB0aGUgaW5kaWNhdG9yLXdpZGdldCB0b28pXG4gICAgdmFyICRjb250YWluZXJFbGVtZW50ID0gb3B0aW9ucy5jb250YWluZXJFbGVtZW50O1xuICAgIHZhciBjb250YWluZXJEYXRhID0gb3B0aW9ucy5jb250YWluZXJEYXRhO1xuICAgIHZhciBleGNsdWRlTm9kZSA9IG9wdGlvbnMuZXhjbHVkZU5vZGU7XG4gICAgdmFyIHJlYWN0aW9uc1dpZGdldE9wdGlvbnMgPSB7XG4gICAgICAgIHJlYWN0aW9uc0RhdGE6IFtdLCAvLyBBbHdheXMgb3BlbiB3aXRoIHRoZSBkZWZhdWx0IHJlYWN0aW9uc1xuICAgICAgICBjb250YWluZXJEYXRhOiBjb250YWluZXJEYXRhLFxuICAgICAgICBjb250ZW50RGF0YTogeyB0eXBlOiAndGV4dCcgfSxcbiAgICAgICAgY29udGFpbmVyRWxlbWVudDogJGNvbnRhaW5lckVsZW1lbnQsXG4gICAgICAgIGRlZmF1bHRSZWFjdGlvbnM6IG9wdGlvbnMuZGVmYXVsdFJlYWN0aW9ucyxcbiAgICAgICAgcGFnZURhdGE6IG9wdGlvbnMucGFnZURhdGEsXG4gICAgICAgIGdyb3VwU2V0dGluZ3M6IG9wdGlvbnMuZ3JvdXBTZXR0aW5nc1xuICAgIH07XG5cbiAgICBzZXR1cFRvdWNoRXZlbnRzKCRjb250YWluZXJFbGVtZW50LmdldCgwKSwgcmVhY3Rpb25zV2lkZ2V0T3B0aW9ucyk7XG4gICAgJGNvbnRhaW5lckVsZW1lbnQub24oJ21vdXNldXAnLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBpZiAoY29udGFpbmVyRGF0YS5sb2FkZWQpIHtcbiAgICAgICAgICAgIHZhciBub2RlID0gJGNvbnRhaW5lckVsZW1lbnQuZ2V0KDApO1xuICAgICAgICAgICAgdmFyIHBvaW50ID0gUmFuZ2UuZ2V0U2VsZWN0aW9uRW5kUG9pbnQobm9kZSwgZXZlbnQsIGV4Y2x1ZGVOb2RlKTtcbiAgICAgICAgICAgIGlmIChwb2ludCkge1xuICAgICAgICAgICAgICAgIHZhciBjb29yZGluYXRlcyA9IHt0b3A6IHBvaW50LnksIGxlZnQ6IHBvaW50Lnh9O1xuICAgICAgICAgICAgICAgIFBvcHVwV2lkZ2V0LnNob3coY29vcmRpbmF0ZXMsIGdyYWJTZWxlY3Rpb25BbmRPcGVuKG5vZGUsIGNvb3JkaW5hdGVzLCByZWFjdGlvbnNXaWRnZXRPcHRpb25zLCBleGNsdWRlTm9kZSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGdyYWJTZWxlY3Rpb25BbmRPcGVuKG5vZGUsIGNvb3JkaW5hdGVzLCByZWFjdGlvbnNXaWRnZXRPcHRpb25zLCBleGNsdWRlTm9kZSkge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgUmFuZ2UuZ3JhYlNlbGVjdGlvbihub2RlLCBmdW5jdGlvbih0ZXh0LCBsb2NhdGlvbikge1xuICAgICAgICAgICAgcmVhY3Rpb25zV2lkZ2V0T3B0aW9ucy5jb250ZW50RGF0YS5sb2NhdGlvbiA9IGxvY2F0aW9uO1xuICAgICAgICAgICAgcmVhY3Rpb25zV2lkZ2V0T3B0aW9ucy5jb250ZW50RGF0YS5ib2R5ID0gdGV4dDtcbiAgICAgICAgICAgIFJlYWN0aW9uc1dpZGdldC5vcGVuKHJlYWN0aW9uc1dpZGdldE9wdGlvbnMsIGNvb3JkaW5hdGVzKTtcbiAgICAgICAgfSwgZXhjbHVkZU5vZGUpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZ3JhYk5vZGVBbmRPcGVuKG5vZGUsIHJlYWN0aW9uc1dpZGdldE9wdGlvbnMsIGNvb3Jkcykge1xuICAgIFJhbmdlLmdyYWJOb2RlKG5vZGUsIGZ1bmN0aW9uKHRleHQsIGxvY2F0aW9uKSB7XG4gICAgICAgIHJlYWN0aW9uc1dpZGdldE9wdGlvbnMuY29udGVudERhdGEubG9jYXRpb24gPSBsb2NhdGlvbjtcbiAgICAgICAgcmVhY3Rpb25zV2lkZ2V0T3B0aW9ucy5jb250ZW50RGF0YS5ib2R5ID0gdGV4dDtcbiAgICAgICAgUmVhY3Rpb25zV2lkZ2V0Lm9wZW4ocmVhY3Rpb25zV2lkZ2V0T3B0aW9ucywgY29vcmRzKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gc2V0dXBUb3VjaEV2ZW50cyhlbGVtZW50LCByZWFjdGlvbnNXaWRnZXRPcHRpb25zKSB7XG4gICAgVG91Y2hTdXBwb3J0LnNldHVwVGFwKGVsZW1lbnQsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGlmICghUmVhY3Rpb25zV2lkZ2V0LmlzT3BlbigpICYmICQoZXZlbnQudGFyZ2V0KS5jbG9zZXN0KCdhJykubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgdmFyIHRvdWNoID0gZXZlbnQuY2hhbmdlZFRvdWNoZXNbMF07XG4gICAgICAgICAgICB2YXIgY29vcmRzID0geyB0b3A6IHRvdWNoLnBhZ2VZLCBsZWZ0OiB0b3VjaC5wYWdlWCB9O1xuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHsgLy8gTGV0IHRoaXMgZXZlbnQgZmluaXNoIHByb2Nlc3NpbmcgYmVmb3JlIG9wZW5pbmcgdGhlIHJlYWN0aW9ucyB3aW5kb3cgc28gdGhlIHdpbmRvdyBkb2Vzbid0IGFsc28gcHJvY2VzcyB0aGUgZXZlbnQuXG4gICAgICAgICAgICAgICAgZ3JhYk5vZGVBbmRPcGVuKGVsZW1lbnQsIHJlYWN0aW9uc1dpZGdldE9wdGlvbnMsIGNvb3Jkcyk7XG4gICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlUmVhY3RhYmxlVGV4dDogY3JlYXRlUmVhY3RhYmxlVGV4dFxufTsiLCIvLyBUT0RPOiBuZWVkcyBhIGJldHRlciBuYW1lIG9uY2UgdGhlIHNjb3BlIGlzIGNsZWFyXG5cbnZhciAkOyByZXF1aXJlKCcuL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIEFwcE1vZGUgPSByZXF1aXJlKCcuL2FwcC1tb2RlJyk7XG52YXIgWERNQ2xpZW50ID0gcmVxdWlyZSgnLi94ZG0tY2xpZW50Jyk7XG52YXIgVVJMcyA9IHJlcXVpcmUoJy4vdXJscycpO1xudmFyIFVSTENvbnN0YW50cyA9IHJlcXVpcmUoJy4vdXJsLWNvbnN0YW50cycpO1xudmFyIFVzZXIgPSByZXF1aXJlKCcuL3VzZXInKTtcblxuXG5mdW5jdGlvbiBwb3N0TmV3UmVhY3Rpb24ocmVhY3Rpb25EYXRhLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgY29udGVudERhdGEsIHN1Y2Nlc3MsIGVycm9yKSB7XG4gICAgdmFyIGNvbnRlbnRCb2R5ID0gY29udGVudERhdGEuYm9keTtcbiAgICB2YXIgY29udGVudFR5cGUgPSBjb250ZW50RGF0YS50eXBlO1xuICAgIHZhciBjb250ZW50TG9jYXRpb24gPSBjb250ZW50RGF0YS5sb2NhdGlvbjtcbiAgICB2YXIgY29udGVudERpbWVuc2lvbnMgPSBjb250ZW50RGF0YS5kaW1lbnNpb25zO1xuICAgIFhETUNsaWVudC5nZXRVc2VyKGZ1bmN0aW9uKHVzZXJJbmZvKSB7XG4gICAgICAgIC8vIFRPRE8gZXh0cmFjdCB0aGUgc2hhcGUgb2YgdGhpcyBkYXRhIGFuZCBwb3NzaWJseSB0aGUgd2hvbGUgQVBJIGNhbGxcbiAgICAgICAgdmFyIGRhdGEgPSB7XG4gICAgICAgICAgICB0YWc6IHtcbiAgICAgICAgICAgICAgICBib2R5OiByZWFjdGlvbkRhdGEudGV4dFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGlzX2RlZmF1bHQ6IHJlYWN0aW9uRGF0YS5pc0RlZmF1bHQgIT09IHVuZGVmaW5lZCAmJiByZWFjdGlvbkRhdGEuaXNEZWZhdWx0LCAvLyBmYWxzZSB1bmxlc3Mgc3BlY2lmaWVkXG4gICAgICAgICAgICBoYXNoOiBjb250YWluZXJEYXRhLmhhc2gsXG4gICAgICAgICAgICB1c2VyX2lkOiB1c2VySW5mby51c2VyX2lkLFxuICAgICAgICAgICAgYW50X3Rva2VuOiB1c2VySW5mby5hbnRfdG9rZW4sXG4gICAgICAgICAgICBwYWdlX2lkOiBwYWdlRGF0YS5wYWdlSWQsXG4gICAgICAgICAgICBncm91cF9pZDogcGFnZURhdGEuZ3JvdXBJZCxcbiAgICAgICAgICAgIGNvbnRhaW5lcl9raW5kOiBjb250ZW50VHlwZSwgLy8gT25lIG9mICdwYWdlJywgJ3RleHQnLCAnbWVkaWEnLCAnaW1nJ1xuICAgICAgICAgICAgY29udGVudF9ub2RlX2RhdGE6IHtcbiAgICAgICAgICAgICAgICBib2R5OiBjb250ZW50Qm9keSxcbiAgICAgICAgICAgICAgICBraW5kOiBjb250ZW50VHlwZSxcbiAgICAgICAgICAgICAgICBpdGVtX3R5cGU6ICcnIC8vIFRPRE86IGxvb2tzIHVudXNlZCBidXQgVGFnSGFuZGxlciBibG93cyB1cCB3aXRob3V0IGl0LiBDdXJyZW50IGNsaWVudCBwYXNzZXMgaW4gXCJwYWdlXCIgZm9yIHBhZ2UgcmVhY3Rpb25zLlxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBpZiAoY29udGVudExvY2F0aW9uKSB7XG4gICAgICAgICAgICBkYXRhLmNvbnRlbnRfbm9kZV9kYXRhLmxvY2F0aW9uID0gY29udGVudExvY2F0aW9uO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjb250ZW50RGltZW5zaW9ucykge1xuICAgICAgICAgICAgZGF0YS5jb250ZW50X25vZGVfZGF0YS5oZWlnaHQgPSBjb250ZW50RGltZW5zaW9ucy5oZWlnaHQ7XG4gICAgICAgICAgICBkYXRhLmNvbnRlbnRfbm9kZV9kYXRhLndpZHRoID0gY29udGVudERpbWVuc2lvbnMud2lkdGg7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJlYWN0aW9uRGF0YS5pZCkge1xuICAgICAgICAgICAgZGF0YS50YWcuaWQgPSByZWFjdGlvbkRhdGEuaWQ7IC8vIFRPRE8gdGhlIGN1cnJlbnQgY2xpZW50IHNlbmRzIFwiLTEwMVwiIGlmIHRoZXJlJ3Mgbm8gaWQuIGlzIHRoaXMgbmVjZXNzYXJ5P1xuICAgICAgICB9XG4gICAgICAgIGdldEpTT05QKFVSTHMuY3JlYXRlUmVhY3Rpb25VcmwoKSwgZGF0YSwgbmV3UmVhY3Rpb25TdWNjZXNzKGNvbnRlbnRMb2NhdGlvbiwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIHN1Y2Nlc3MpLCBlcnJvcik7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIHBvc3RQbHVzT25lKHJlYWN0aW9uRGF0YSwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIHN1Y2Nlc3MsIGVycm9yKSB7XG4gICAgWERNQ2xpZW50LmdldFVzZXIoZnVuY3Rpb24odXNlckluZm8pIHtcbiAgICAgICAgLy8gVE9ETyBleHRyYWN0IHRoZSBzaGFwZSBvZiB0aGlzIGRhdGEgYW5kIHBvc3NpYmx5IHRoZSB3aG9sZSBBUEkgY2FsbFxuICAgICAgICBpZiAoIXJlYWN0aW9uRGF0YS5jb250ZW50KSB7XG4gICAgICAgICAgICAvLyBUaGlzIGlzIGEgc3VtbWFyeSByZWFjdGlvbi4gU2VlIGlmIHdlIGhhdmUgYW55IGNvbnRhaW5lciBkYXRhIHRoYXQgd2UgY2FuIGxpbmsgdG8gaXQuXG4gICAgICAgICAgICB2YXIgY29udGFpbmVyUmVhY3Rpb25zID0gY29udGFpbmVyRGF0YS5yZWFjdGlvbnM7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvbnRhaW5lclJlYWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBjb250YWluZXJSZWFjdGlvbiA9IGNvbnRhaW5lclJlYWN0aW9uc1tpXTtcbiAgICAgICAgICAgICAgICBpZiAoY29udGFpbmVyUmVhY3Rpb24uaWQgPT09IHJlYWN0aW9uRGF0YS5pZCkge1xuICAgICAgICAgICAgICAgICAgICByZWFjdGlvbkRhdGEucGFyZW50SUQgPSBjb250YWluZXJSZWFjdGlvbi5wYXJlbnRJRDtcbiAgICAgICAgICAgICAgICAgICAgcmVhY3Rpb25EYXRhLmNvbnRlbnQgPSBjb250YWluZXJSZWFjdGlvbi5jb250ZW50O1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGRhdGEgPSB7XG4gICAgICAgICAgICB0YWc6IHtcbiAgICAgICAgICAgICAgICBib2R5OiByZWFjdGlvbkRhdGEudGV4dCxcbiAgICAgICAgICAgICAgICBpZDogcmVhY3Rpb25EYXRhLmlkXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaGFzaDogY29udGFpbmVyRGF0YS5oYXNoLFxuICAgICAgICAgICAgdXNlcl9pZDogdXNlckluZm8udXNlcl9pZCxcbiAgICAgICAgICAgIGFudF90b2tlbjogdXNlckluZm8uYW50X3Rva2VuLFxuICAgICAgICAgICAgcGFnZV9pZDogcGFnZURhdGEucGFnZUlkLFxuICAgICAgICAgICAgZ3JvdXBfaWQ6IHBhZ2VEYXRhLmdyb3VwSWQsXG4gICAgICAgICAgICBjb250YWluZXJfa2luZDogY29udGFpbmVyRGF0YS50eXBlLCAvLyAncGFnZScsICd0ZXh0JywgJ21lZGlhJywgJ2ltZydcbiAgICAgICAgICAgIGNvbnRlbnRfbm9kZV9kYXRhOiB7XG4gICAgICAgICAgICAgICAgYm9keTogJycsIC8vIFRPRE86IGRvIHdlIG5lZWQgdGhpcyBmb3IgKzFzPyBsb29rcyBsaWtlIG9ubHkgdGhlIGlkIGZpZWxkIGlzIHVzZWQsIGlmIG9uZSBpcyBzZXRcbiAgICAgICAgICAgICAgICBraW5kOiBjb250ZW50Tm9kZURhdGFLaW5kKGNvbnRhaW5lckRhdGEudHlwZSksXG4gICAgICAgICAgICAgICAgaXRlbV90eXBlOiAnJyAvLyBUT0RPOiBsb29rcyB1bnVzZWQgYnV0IFRhZ0hhbmRsZXIgYmxvd3MgdXAgd2l0aG91dCBpdFxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBpZiAocmVhY3Rpb25EYXRhLmNvbnRlbnQpIHtcbiAgICAgICAgICAgIGRhdGEuY29udGVudF9ub2RlX2RhdGEuaWQgPSByZWFjdGlvbkRhdGEuY29udGVudC5pZDtcbiAgICAgICAgICAgIGRhdGEuY29udGVudF9ub2RlX2RhdGEubG9jYXRpb24gPSByZWFjdGlvbkRhdGEuY29udGVudC5sb2NhdGlvbjtcbiAgICAgICAgfVxuICAgICAgICAvLyBUT0RPOiBzaG91bGQgd2UgYmFpbCBpZiB0aGVyZSdzIG5vIHBhcmVudCBJRD8gSXQncyBub3QgcmVhbGx5IGEgKzEgd2l0aG91dCBvbmUuXG4gICAgICAgIGlmIChyZWFjdGlvbkRhdGEucGFyZW50SUQpIHtcbiAgICAgICAgICAgIGRhdGEudGFnLnBhcmVudF9pZCA9IHJlYWN0aW9uRGF0YS5wYXJlbnRJRDtcbiAgICAgICAgfVxuICAgICAgICBnZXRKU09OUChVUkxzLmNyZWF0ZVJlYWN0aW9uVXJsKCksIGRhdGEsIHBsdXNPbmVTdWNjZXNzKHJlYWN0aW9uRGF0YSwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIHN1Y2Nlc3MpLCBlcnJvcik7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIHBvc3RDb21tZW50KGNvbW1lbnQsIHJlYWN0aW9uRGF0YSwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIHN1Y2Nlc3MsIGVycm9yKSB7XG4gICAgLy8gVE9ETzogcmVmYWN0b3IgdGhlIHBvc3QgZnVuY3Rpb25zIHRvIGVsaW1pbmF0ZSBhbGwgdGhlIGNvcGllZCBjb2RlXG4gICAgWERNQ2xpZW50LmdldFVzZXIoZnVuY3Rpb24odXNlckluZm8pIHtcbiAgICAgICAgLy8gVE9ETyBleHRyYWN0IHRoZSBzaGFwZSBvZiB0aGlzIGRhdGEgYW5kIHBvc3NpYmx5IHRoZSB3aG9sZSBBUEkgY2FsbFxuICAgICAgICBpZiAoIXJlYWN0aW9uRGF0YS5jb250ZW50KSB7XG4gICAgICAgICAgICAvLyBUaGlzIGlzIGEgc3VtbWFyeSByZWFjdGlvbi4gU2VlIGlmIHdlIGhhdmUgYW55IGNvbnRhaW5lciBkYXRhIHRoYXQgd2UgY2FuIGxpbmsgdG8gaXQuXG4gICAgICAgICAgICB2YXIgY29udGFpbmVyUmVhY3Rpb25zID0gY29udGFpbmVyRGF0YS5yZWFjdGlvbnM7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvbnRhaW5lclJlYWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBjb250YWluZXJSZWFjdGlvbiA9IGNvbnRhaW5lclJlYWN0aW9uc1tpXTtcbiAgICAgICAgICAgICAgICBpZiAoY29udGFpbmVyUmVhY3Rpb24uaWQgPT09IHJlYWN0aW9uRGF0YS5pZCkge1xuICAgICAgICAgICAgICAgICAgICByZWFjdGlvbkRhdGEucGFyZW50SUQgPSBjb250YWluZXJSZWFjdGlvbi5wYXJlbnRJRDtcbiAgICAgICAgICAgICAgICAgICAgcmVhY3Rpb25EYXRhLmNvbnRlbnQgPSBjb250YWluZXJSZWFjdGlvbi5jb250ZW50O1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGRhdGEgPSB7XG4gICAgICAgICAgICBjb21tZW50OiBjb21tZW50LFxuICAgICAgICAgICAgdGFnOiB7XG4gICAgICAgICAgICAgICAgcGFyZW50X2lkOiByZWFjdGlvbkRhdGEucGFyZW50SURcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB1c2VyX2lkOiB1c2VySW5mby51c2VyX2lkLFxuICAgICAgICAgICAgYW50X3Rva2VuOiB1c2VySW5mby5hbnRfdG9rZW4sXG4gICAgICAgICAgICBwYWdlX2lkOiBwYWdlRGF0YS5wYWdlSWQsXG4gICAgICAgICAgICBncm91cF9pZDogcGFnZURhdGEuZ3JvdXBJZFxuICAgICAgICB9O1xuICAgICAgICBnZXRKU09OUChVUkxzLmNyZWF0ZUNvbW1lbnRVcmwoKSwgZGF0YSwgY29tbWVudFN1Y2Nlc3MocmVhY3Rpb25EYXRhLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgc3VjY2VzcyksIGVycm9yKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gY29udGVudE5vZGVEYXRhS2luZCh0eXBlKSB7XG4gICAgaWYgKHR5cGUgPT09ICdpbWFnZScpIHtcbiAgICAgICAgcmV0dXJuICdpbWcnO1xuICAgIH1cbiAgICByZXR1cm4gdHlwZTtcbn1cblxuZnVuY3Rpb24gY29tbWVudFN1Y2Nlc3MocmVhY3Rpb25EYXRhLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgY2FsbGJhY2spIHtcbiAgICByZXR1cm4gZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgLy8gVE9ETzogaW4gdGhlIGNhc2UgdGhhdCBzb21lb25lIHJlYWN0cyBhbmQgdGhlbiBpbW1lZGlhdGVseSBjb21tZW50cywgd2UgaGF2ZSBhIHJhY2UgY29uZGl0aW9uIHdoZXJlIHRoZVxuICAgICAgICAvLyAgICAgICBjb21tZW50IHJlc3BvbnNlIGNvdWxkIGNvbWUgYmFjayBiZWZvcmUgdGhlIHJlYWN0aW9uLiB3ZSBuZWVkIHRvOlxuICAgICAgICAvLyAgICAgICAxLiBNYWtlIHN1cmUgdGhlIHNlcnZlciBvbmx5IGNyZWF0ZXMgYSBzaW5nbGUgcmVhY3Rpb24gaW4gdGhpcyBjYXNlIChub3QgYSBIVUdFIGRlYWwgaWYgaXQgbWFrZXMgdHdvKVxuICAgICAgICAvLyAgICAgICAyLiBSZXNvbHZlIHRoZSB0d28gcmVzcG9uc2VzIHRoYXQgYm90aCB0aGVvcmV0aWNhbGx5IGNvbWUgYmFjayB3aXRoIHRoZSBzYW1lIHJlYWN0aW9uIGRhdGEgYXQgdGhlIHNhbWVcbiAgICAgICAgLy8gICAgICAgICAgdGltZS4gTWFrZSBzdXJlIHdlIGRvbid0IGVuZCB1cCB3aXRoIHR3byBjb3BpZXMgb2YgdGhlIHNhbWUgZGF0YSBpbiB0aGUgbW9kZWwuXG4gICAgICAgIHZhciByZWFjdGlvbkNyZWF0ZWQgPSAhcmVzcG9uc2UuZXhpc3Rpbmc7XG4gICAgICAgIGlmIChyZWFjdGlvbkNyZWF0ZWQpIHtcbiAgICAgICAgICAgIGlmICghcmVhY3Rpb25EYXRhLmNvbW1lbnRDb3VudCkge1xuICAgICAgICAgICAgICAgIHJlYWN0aW9uRGF0YS5jb21tZW50Q291bnQgPSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVhY3Rpb25EYXRhLmNvbW1lbnRDb3VudCArPSAxO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gVE9ETzogZG8gd2UgZXZlciBnZXQgYSByZXNwb25zZSB0byBhIG5ldyByZWFjdGlvbiB0ZWxsaW5nIHVzIHRoYXQgaXQncyBhbHJlYWR5IGV4aXN0aW5nPyBJZiBzbywgY291bGQgdGhlIGNvdW50IG5lZWQgdG8gYmUgdXBkYXRlZD9cbiAgICAgICAgfVxuICAgICAgICBjYWxsYmFjayhyZWFjdGlvbkNyZWF0ZWQpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gcGx1c09uZVN1Y2Nlc3MocmVhY3Rpb25EYXRhLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgY2FsbGJhY2spIHtcbiAgICByZXR1cm4gZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgLy8gVE9ETzogRG8gd2UgY2FyZSBhYm91dCByZXNwb25zZS5leGlzdGluZyBhbnltb3JlICh3ZSB1c2VkIHRvIHNob3cgZGlmZmVyZW50IGZlZWRiYWNrIGluIHRoZSBVSSwgYnV0IG5vIGxvbmdlci4uLilcbiAgICAgICAgdmFyIHJlYWN0aW9uQ3JlYXRlZCA9ICFyZXNwb25zZS5leGlzdGluZztcbiAgICAgICAgaWYgKHJlYWN0aW9uQ3JlYXRlZCkge1xuICAgICAgICAgICAgLy8gVE9ETzogd2Ugc2hvdWxkIGdldCBiYWNrIGEgcmVzcG9uc2Ugd2l0aCBkYXRhIGluIHRoZSBcIm5ldyBmb3JtYXRcIiBhbmQgdXBkYXRlIHRoZSBtb2RlbCBmcm9tIHRoZSByZXNwb25zZVxuICAgICAgICAgICAgcmVhY3Rpb25EYXRhLmNvdW50ID0gcmVhY3Rpb25EYXRhLmNvdW50ICsgMTtcbiAgICAgICAgICAgIGNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbCA9IGNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbCArIDE7XG4gICAgICAgICAgICBwYWdlRGF0YS5zdW1tYXJ5VG90YWwgPSBwYWdlRGF0YS5zdW1tYXJ5VG90YWwgKyAxO1xuICAgICAgICB9XG4gICAgICAgIGNhbGxiYWNrKHJlYWN0aW9uRGF0YSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBuZXdSZWFjdGlvblN1Y2Nlc3MoY29udGVudExvY2F0aW9uLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgY2FsbGJhY2spIHtcbiAgICByZXR1cm4gZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgLy8gVE9ETzogQ2FuIHJlc3BvbnNlLmV4aXN0aW5nIGV2ZXIgY29tZSBiYWNrIHRydWUgZm9yIGEgJ25ldycgcmVhY3Rpb24/IFNob3VsZCB3ZSBiZWhhdmUgYW55IGRpZmZlcmVudGx5IGlmIGl0IGRvZXM/XG4gICAgICAgIHZhciByZWFjdGlvbiA9IHJlYWN0aW9uRnJvbVJlc3BvbnNlKHJlc3BvbnNlLCBjb250ZW50TG9jYXRpb24pO1xuICAgICAgICBjYWxsYmFjayhyZWFjdGlvbik7XG4gICAgfTtcbn1cblxuZnVuY3Rpb24gcmVhY3Rpb25Gcm9tUmVzcG9uc2UocmVzcG9uc2UsIGNvbnRlbnRMb2NhdGlvbikge1xuICAgIC8vIFRPRE86IHRoZSBzZXJ2ZXIgc2hvdWxkIGdpdmUgdXMgYmFjayBhIHJlYWN0aW9uIG1hdGNoaW5nIHRoZSBuZXcgQVBJIGZvcm1hdC5cbiAgICAvLyAgICAgICB3ZSdyZSBqdXN0IGZha2luZyBpdCBvdXQgZm9yIG5vdzsgdGhpcyBjb2RlIGlzIHRlbXBvcmFyeVxuICAgIHZhciByZWFjdGlvbiA9IHtcbiAgICAgICAgdGV4dDogcmVzcG9uc2UuaW50ZXJhY3Rpb24uaW50ZXJhY3Rpb25fbm9kZS5ib2R5LFxuICAgICAgICBpZDogcmVzcG9uc2UuaW50ZXJhY3Rpb24uaW50ZXJhY3Rpb25fbm9kZS5pZCxcbiAgICAgICAgY291bnQ6IDEsXG4gICAgICAgIHBhcmVudElEOiByZXNwb25zZS5pbnRlcmFjdGlvbi5pZFxuICAgIH07XG4gICAgaWYgKHJlc3BvbnNlLmNvbnRlbnRfbm9kZSkge1xuICAgICAgICByZWFjdGlvbi5jb250ZW50ID0ge1xuICAgICAgICAgICAgaWQ6IHJlc3BvbnNlLmNvbnRlbnRfbm9kZS5pZCxcbiAgICAgICAgICAgIGtpbmQ6IHJlc3BvbnNlLmNvbnRlbnRfbm9kZS5raW5kLFxuICAgICAgICAgICAgYm9keTogcmVzcG9uc2UuY29udGVudF9ub2RlLmJvZHlcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKHJlc3BvbnNlLmNvbnRlbnRfbm9kZS5sb2NhdGlvbikge1xuICAgICAgICAgICAgcmVhY3Rpb24uY29udGVudC5sb2NhdGlvbiA9IHJlc3BvbnNlLmNvbnRlbnRfbm9kZS5sb2NhdGlvbjtcbiAgICAgICAgfSBlbHNlIGlmIChjb250ZW50TG9jYXRpb24pIHtcbiAgICAgICAgICAgIC8vIFRPRE86IGVuc3VyZSB0aGF0IHRoZSBBUEkgYWx3YXlzIHJldHVybnMgYSBsb2NhdGlvbiBhbmQgcmVtb3ZlIHRoZSBcImNvbnRlbnRMb2NhdGlvblwiIHRoYXQncyBiZWluZyBwYXNzZWQgYXJvdW5kLlxuICAgICAgICAgICAgLy8gRm9yIG5vdywganVzdCBwYXRjaCB0aGUgcmVzcG9uc2Ugd2l0aCB0aGUgZGF0YSB3ZSBrbm93IHdlIHNlbnQgb3Zlci5cbiAgICAgICAgICAgIHJlYWN0aW9uLmNvbnRlbnQubG9jYXRpb24gPSBjb250ZW50TG9jYXRpb247XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlYWN0aW9uO1xufVxuXG5mdW5jdGlvbiBnZXRDb21tZW50cyhyZWFjdGlvbiwgY2FsbGJhY2spIHtcbiAgICBYRE1DbGllbnQuZ2V0VXNlcihmdW5jdGlvbih1c2VySW5mbykge1xuICAgICAgICB2YXIgZGF0YSA9IHtcbiAgICAgICAgICAgIHJlYWN0aW9uX2lkOiByZWFjdGlvbi5wYXJlbnRJRCxcbiAgICAgICAgICAgIHVzZXJfaWQ6IHVzZXJJbmZvLnVzZXJfaWQsXG4gICAgICAgICAgICBhbnRfdG9rZW46IHVzZXJJbmZvLmFudF90b2tlblxuICAgICAgICB9O1xuICAgICAgICBnZXRKU09OUChVUkxzLmZldGNoQ29tbWVudFVybCgpLCBkYXRhLCBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAgICAgY2FsbGJhY2soY29tbWVudHNGcm9tUmVzcG9uc2UocmVzcG9uc2UpKTtcbiAgICAgICAgfSwgZnVuY3Rpb24obWVzc2FnZSkge1xuICAgICAgICAgICAgLy8gVE9ETzogZXJyb3IgaGFuZGxpbmdcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdBbiBlcnJvciBvY2N1cnJlZCBmZXRjaGluZyBjb21tZW50czogJyArIG1lc3NhZ2UpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gZmV0Y2hMb2NhdGlvbkRldGFpbHMocmVhY3Rpb25Mb2NhdGlvbkRhdGEsIHBhZ2VEYXRhLCBjYWxsYmFjaykge1xuICAgIHZhciBjb250ZW50SURzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMocmVhY3Rpb25Mb2NhdGlvbkRhdGEpO1xuICAgIFhETUNsaWVudC5nZXRVc2VyKGZ1bmN0aW9uKHVzZXJJbmZvKSB7XG4gICAgICAgIHZhciBkYXRhID0ge1xuICAgICAgICAgICAgdXNlcl9pZDogdXNlckluZm8udXNlcl9pZCxcbiAgICAgICAgICAgIGFudF90b2tlbjogdXNlckluZm8uYW50X3Rva2VuLFxuICAgICAgICAgICAgY29udGVudF9pZHM6IGNvbnRlbnRJRHNcbiAgICAgICAgfTtcbiAgICAgICAgZ2V0SlNPTlAoVVJMcy5mZXRjaENvbnRlbnRCb2RpZXNVcmwoKSwgZGF0YSwgZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKHJlc3BvbnNlKTtcbiAgICAgICAgfSwgZnVuY3Rpb24obWVzc2FnZSkge1xuICAgICAgICAgICAgLy8gVE9ETzogZXJyb3IgaGFuZGxpbmdcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdBbiBlcnJvciBvY2N1cnJlZCBmZXRjaGluZyBjb250ZW50IGJvZGllczogJyArIG1lc3NhZ2UpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gY29tbWVudHNGcm9tUmVzcG9uc2UoanNvbkNvbW1lbnRzKSB7XG4gICAgdmFyIGNvbW1lbnRzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBqc29uQ29tbWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGpzb25Db21tZW50ID0ganNvbkNvbW1lbnRzW2ldO1xuICAgICAgICB2YXIgY29tbWVudCA9IHtcbiAgICAgICAgICAgIHRleHQ6IGpzb25Db21tZW50LnRleHQsXG4gICAgICAgICAgICBpZDoganNvbkNvbW1lbnQuaWQsIC8vIFRPRE86IHdlIHByb2JhYmx5IG9ubHkgbmVlZCB0aGlzIGZvciArMSdpbmcgY29tbWVudHNcbiAgICAgICAgICAgIGNvbnRlbnRJRDoganNvbkNvbW1lbnQuY29udGVudElELCAvLyBUT0RPOiBEbyB3ZSByZWFsbHkgbmVlZCB0aGlzP1xuICAgICAgICAgICAgdXNlcjogVXNlci5mcm9tQ29tbWVudEpTT04oanNvbkNvbW1lbnQudXNlciwganNvbkNvbW1lbnQuc29jaWFsX3VzZXIpXG4gICAgICAgIH07XG4gICAgICAgIGNvbW1lbnRzLnB1c2goY29tbWVudCk7XG4gICAgfVxuICAgIHJldHVybiBjb21tZW50cztcbn1cblxuZnVuY3Rpb24gZ2V0SlNPTlAodXJsLCBkYXRhLCBzdWNjZXNzLCBlcnJvcikge1xuICAgIHZhciBiYXNlVXJsO1xuICAgIGlmIChBcHBNb2RlLnRlc3QpIHtcbiAgICAgICAgYmFzZVVybCA9IFVSTENvbnN0YW50cy5URVNUO1xuICAgIH0gZWxzZSBpZiAoQXBwTW9kZS5vZmZsaW5lKSB7XG4gICAgICAgIGJhc2VVcmwgPSBVUkxDb25zdGFudHMuREVWRUxPUE1FTlQ7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgYmFzZVVybCA9IFVSTENvbnN0YW50cy5QUk9EVUNUSU9OO1xuICAgIH1cbiAgICBkb0dldEpTT05QKGJhc2VVcmwsIHVybCwgZGF0YSwgc3VjY2VzcywgZXJyb3IpO1xufVxuXG5mdW5jdGlvbiBwb3N0RXZlbnQoZXZlbnQpIHtcbiAgICB2YXIgYmFzZVVybDtcbiAgICBpZiAoQXBwTW9kZS5vZmZsaW5lKSB7XG4gICAgICAgIGJhc2VVcmwgPSBVUkxDb25zdGFudHMuREVWRUxPUE1FTlRfRVZFTlRTO1xuICAgICAgICBjb25zb2xlLmxvZygnUG9zdGluZyBldmVudDogJyArIEpTT04uc3RyaW5naWZ5KGV2ZW50KSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgYmFzZVVybCA9IFVSTENvbnN0YW50cy5QUk9EVUNUSU9OX0VWRU5UUztcbiAgICB9XG4gICAgZG9HZXRKU09OUChiYXNlVXJsLCBVUkxzLmV2ZW50VXJsKCksIGV2ZW50LCBmdW5jdGlvbigpIHsgLypzdWNjZXNzKi8gfSwgZnVuY3Rpb24oZXJyb3IpIHtcbiAgICAgICAgLy8gVE9ETzogZXJyb3IgaGFuZGxpbmdcbiAgICAgICAgY29uc29sZS5sb2coJ0FuIGVycm9yIG9jY3VycmVkIHBvc3RpbmcgZXZlbnQ6ICcsIGVycm9yKTtcbiAgICB9KTtcbn1cblxuLy8gSXNzdWVzIGEgSlNPTlAgcmVxdWVzdCB0byBhIGdpdmVuIHNlcnZlci4gVG8gc2VuZCBhIHJlcXVlc3QgdG8gdGhlIGFwcGxpY2F0aW9uIHNlcnZlciwgdXNlIGdldEpTT05QIGluc3RlYWQuXG5mdW5jdGlvbiBkb0dldEpTT05QKGJhc2VVcmwsIHVybCwgZGF0YSwgc3VjY2VzcywgZXJyb3IpIHtcbiAgICB2YXIgb3B0aW9ucyA9IHtcbiAgICAgICAgdXJsOiBiYXNlVXJsICsgdXJsLFxuICAgICAgICB0eXBlOiBcImdldFwiLFxuICAgICAgICBjb250ZW50VHlwZTogXCJhcHBsaWNhdGlvbi9qc29uXCIsXG4gICAgICAgIGRhdGFUeXBlOiBcImpzb25wXCIsXG4gICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uKHJlc3BvbnNlLCB0ZXh0U3RhdHVzLCBYSFIpIHtcbiAgICAgICAgICAgIC8vIFRPRE86IFJldmlzaXQgd2hldGhlciBpdCdzIHJlYWxseSBjb29sIHRvIGtleSB0aGlzIG9uIHRoZSB0ZXh0U3RhdHVzIG9yIGlmIHdlIHNob3VsZCBiZSBsb29raW5nIGF0XG4gICAgICAgICAgICAvLyAgICAgICB0aGUgc3RhdHVzIGNvZGUgaW4gdGhlIFhIUlxuICAgICAgICAgICAgLy8gTm90ZTogVGhlIHNlcnZlciBjb21lcyBiYWNrIHdpdGggMjAwIHJlc3BvbnNlcyB3aXRoIGEgbmVzdGVkIHN0YXR1cyBvZiBcImZhaWxcIi4uLlxuICAgICAgICAgICAgaWYgKHRleHRTdGF0dXMgPT09ICdzdWNjZXNzJyAmJiByZXNwb25zZS5zdGF0dXMgIT09ICdmYWlsJyAmJiAoIXJlc3BvbnNlLmRhdGEgfHwgcmVzcG9uc2UuZGF0YS5zdGF0dXMgIT09ICdmYWlsJykpIHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBGb3IgSlNPTlAgcmVxdWVzdHMsIGpRdWVyeSBkb2Vzbid0IGNhbGwgaXQncyBlcnJvciBjYWxsYmFjay4gSXQgY2FsbHMgc3VjY2VzcyBpbnN0ZWFkLlxuICAgICAgICAgICAgICAgIGVycm9yKHJlc3BvbnNlLm1lc3NhZ2UgfHwgcmVzcG9uc2UuZGF0YS5tZXNzYWdlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgZXJyb3I6IGZ1bmN0aW9uKHhociwgdGV4dFN0YXR1cywgbWVzc2FnZSkge1xuICAgICAgICAgICAgLy8gT2theSwgYXBwYXJlbnRseSBqUXVlcnkgKmRvZXMqIGNhbGwgaXRzIGVycm9yIGNhbGxiYWNrIGZvciBKU09OUCByZXF1ZXN0cyBzb21ldGltZXMuLi5cbiAgICAgICAgICAgIC8vIFNwZWNpZmljYWxseSwgd2hlbiB0aGUgcmVzcG9uc2Ugc3RhdHVzIGlzIE9LIGJ1dCBhbiBlcnJvciBvY2N1cnMgY2xpZW50LXNpZGUgcHJvY2Vzc2luZyB0aGUgcmVzcG9uc2UuXG4gICAgICAgICAgICBlcnJvciAobWVzc2FnZSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIGlmIChkYXRhKSB7XG4gICAgICAgIG9wdGlvbnMuZGF0YSA9IHsganNvbjogSlNPTi5zdHJpbmdpZnkoZGF0YSkgfTtcbiAgICB9XG4gICAgJC5hamF4KG9wdGlvbnMpO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgZ2V0SlNPTlA6IGdldEpTT05QLFxuICAgIHBvc3RQbHVzT25lOiBwb3N0UGx1c09uZSxcbiAgICBwb3N0TmV3UmVhY3Rpb246IHBvc3ROZXdSZWFjdGlvbixcbiAgICBwb3N0Q29tbWVudDogcG9zdENvbW1lbnQsXG4gICAgZ2V0Q29tbWVudHM6IGdldENvbW1lbnRzLFxuICAgIGZldGNoTG9jYXRpb25EZXRhaWxzOiBmZXRjaExvY2F0aW9uRGV0YWlscyxcbiAgICBwb3N0RXZlbnQ6IHBvc3RFdmVudFxufTsiLCJ2YXIgVVJMQ29uc3RhbnRzID0gcmVxdWlyZSgnLi91cmwtY29uc3RhbnRzJyk7XG5cbmZ1bmN0aW9uIGNvbXB1dGVDdXJyZW50U2NyaXB0U3JjKCkge1xuICAgIGlmIChkb2N1bWVudC5jdXJyZW50U2NyaXB0KSB7XG4gICAgICAgIHJldHVybiBkb2N1bWVudC5jdXJyZW50U2NyaXB0LnNyYztcbiAgICB9XG4gICAgLy8gSUUgZmFsbGJhY2suLi5cbiAgICB2YXIgc2NyaXB0cyA9IGRvY3VtZW50LmJvZHkuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ3NjcmlwdCcpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2NyaXB0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgc2NyaXB0ID0gc2NyaXB0c1tpXTtcbiAgICAgICAgaWYgKHNjcmlwdC5oYXNBdHRyaWJ1dGUoJ3NyYycpKSB7XG4gICAgICAgICAgICB2YXIgc2NyaXB0U3JjID0gc2NyaXB0LmdldEF0dHJpYnV0ZSgnc3JjJyk7XG4gICAgICAgICAgICAvLyBUT0RPOiB1c2UgYSByZWdleHAgaGVyZVxuICAgICAgICAgICAgaWYgKHNjcmlwdFNyYy5pbmRleE9mKCcvYW50ZW5uYS5qcycpICE9PSAtMSB8fCBzY3JpcHRTcmMuaW5kZXhPZignL2VuZ2FnZS5qcycpICE9IC0xIHx8IHNjcmlwdFNyYy5pbmRleE9mKCcvZW5nYWdlX2Z1bGwuanMnKSAhPSAtMSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBzY3JpcHRTcmM7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbnZhciBjdXJyZW50U2NyaXB0U3JjID0gY29tcHV0ZUN1cnJlbnRTY3JpcHRTcmMoKSB8fCAnJztcblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIG9mZmxpbmU6IGN1cnJlbnRTY3JpcHRTcmMuaW5kZXhPZihVUkxDb25zdGFudHMuREVWRUxPUE1FTlQpICE9PSAtMSB8fCBjdXJyZW50U2NyaXB0U3JjLmluZGV4T2YoVVJMQ29uc3RhbnRzLlRFU1QpICE9PSAtMSxcbiAgICB0ZXN0OiBjdXJyZW50U2NyaXB0U3JjLmluZGV4T2YoVVJMQ29uc3RhbnRzLlRFU1QpICE9PSAtMSxcbiAgICBkZWJ1ZzogY3VycmVudFNjcmlwdFNyYy5pbmRleE9mKCc/ZGVidWcnKSAhPT0gLTFcbn07IiwiXG52YXIgYW50dWlkID0gMDsgLy8gXCJnbG9iYWxseVwiIHVuaXF1ZSBJRCB0aGF0IHdlIHVzZSB0byB0YWcgY2FsbGJhY2sgZnVuY3Rpb25zIGZvciBsYXRlciByZXRyaWV2YWwuIChUaGlzIGlzIGhvdyBcIm9mZlwiIHdvcmtzLilcblxuZnVuY3Rpb24gY3JlYXRlQ2FsbGJhY2tzKCkge1xuXG4gICAgdmFyIGNhbGxiYWNrcyA9IHt9O1xuXG4gICAgZnVuY3Rpb24gYWRkQ2FsbGJhY2soY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKGNhbGxiYWNrLmFudHVpZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBjYWxsYmFjay5hbnR1aWQgPSBhbnR1aWQrKztcbiAgICAgICAgfVxuICAgICAgICBjYWxsYmFja3NbY2FsbGJhY2suYW50dWlkXSA9IGNhbGxiYWNrO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJlbW92ZUNhbGxiYWNrKGNhbGxiYWNrKSB7XG4gICAgICAgIGlmIChjYWxsYmFjay5hbnR1aWQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgZGVsZXRlIGNhbGxiYWNrc1tjYWxsYmFjay5hbnR1aWRdO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0Q2FsbGJhY2tzKCkge1xuICAgICAgICB2YXIgYWxsQ2FsbGJhY2tzID0gW107XG4gICAgICAgIGZvciAodmFyIGtleSBpbiBjYWxsYmFja3MpIHtcbiAgICAgICAgICAgIGlmIChjYWxsYmFja3MuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgICAgIGFsbENhbGxiYWNrcy5wdXNoKGNhbGxiYWNrc1trZXldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYWxsQ2FsbGJhY2tzO1xuICAgIH1cblxuICAgIC8vIENvbnZlbmllbmNlIGZ1bmN0aW9uIHRoYXQgaW52b2tlcyBhbGwgY2FsbGJhY2tzIHdpdGggbm8gcGFyYW1ldGVycy4gQW55IGNhbGxiYWNrcyB0aGF0IG5lZWQgcGFyYW1zIGNhbiBiZSBjYWxsZWRcbiAgICAvLyBieSBjbGllbnRzIHVzaW5nIGdldENhbGxiYWNrcygpXG4gICAgZnVuY3Rpb24gaW52b2tlQWxsKCkge1xuICAgICAgICBmb3IgKHZhciBrZXkgaW4gY2FsbGJhY2tzKSB7XG4gICAgICAgICAgICBpZiAoY2FsbGJhY2tzLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFja3Nba2V5XSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNFbXB0eSgpIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKGNhbGxiYWNrcykubGVuZ3RoID09PSAwO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIGFkZDogYWRkQ2FsbGJhY2ssXG4gICAgICAgIHJlbW92ZTogcmVtb3ZlQ2FsbGJhY2ssXG4gICAgICAgIGdldDogZ2V0Q2FsbGJhY2tzLFxuICAgICAgICBpc0VtcHR5OiBpc0VtcHR5LFxuICAgICAgICBpbnZva2VBbGw6IGludm9rZUFsbFxuICAgIH1cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZTogY3JlYXRlQ2FsbGJhY2tzXG59OyIsInZhciAkOyByZXF1aXJlKCcuL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIE1ENSA9IHJlcXVpcmUoJy4vbWQ1Jyk7XG5cbi8vIFRPRE86IFRoaXMgaXMganVzdCBjb3B5L3Bhc3RlZCBmcm9tIGVuZ2FnZV9mdWxsXG4vLyBUT0RPOiBUaGUgY29kZSBpcyBsb29raW5nIGZvciAuYW50X2luZGljYXRvciB0byBzZWUgaWYgaXQncyBhbHJlYWR5IGJlZW4gaGFzaGVkLiBSZXZpZXcuXG4vLyBUT0RPOiBDYW4gd2UgaW1wbGVtZW50IGEgc2ltcGxlciB2ZXJzaW9uIG9mIHRoaXMgZm9yIG5vbi1sZWdhY3kgY29kZSB1c2luZyAkZWxlbWVudC50ZXh0KCk/XG5mdW5jdGlvbiBnZXRDbGVhblRleHQoJGRvbU5vZGUpIHtcbiAgICAvLyBBTlQudXRpbC5nZXRDbGVhblRleHRcbiAgICAvLyBjb21tb24gZnVuY3Rpb24gZm9yIGNsZWFuaW5nIHRoZSB0ZXh0IG5vZGUgdGV4dC4gIHJpZ2h0IG5vdywgaXQncyByZW1vdmluZyBzcGFjZXMsIHRhYnMsIG5ld2xpbmVzLCBhbmQgdGhlbiBkb3VibGUgc3BhY2VzXG5cbiAgICB2YXIgJG5vZGUgPSAkZG9tTm9kZS5jbG9uZSgpO1xuXG4gICAgJG5vZGUuZmluZCgnLmFudCwgLmFudC1jdXN0b20tY3RhLWNvbnRhaW5lcicpLnJlbW92ZSgpO1xuXG4gICAgLy9tYWtlIHN1cmUgaXQgZG9lc250IGFscmVkeSBoYXZlIGluIGluZGljYXRvciAtIGl0IHNob3VsZG4ndC5cbiAgICB2YXIgJGluZGljYXRvciA9ICRub2RlLmZpbmQoJy5hbnRfaW5kaWNhdG9yJyk7XG4gICAgaWYoJGluZGljYXRvci5sZW5ndGgpe1xuICAgICAgICAvL3RvZG86IHNlbmQgdXMgYW4gZXJyb3IgcmVwb3J0IC0gdGhpcyBtYXkgc3RpbGwgYmUgaGFwcGVuaW5nIGZvciBzbGlkZXNob3dzLlxuICAgICAgICAvL1RoaXMgZml4IHdvcmtzIGZpbmUsIGJ1dCB3ZSBzaG91bGQgZml4IHRoZSBjb2RlIHRvIGhhbmRsZSBpdCBiZWZvcmUgaGVyZS5cbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIGdldCB0aGUgbm9kZSdzIHRleHQgYW5kIHNtYXNoIGNhc2VcbiAgICAvLyBUT0RPOiA8YnI+IHRhZ3MgYW5kIGJsb2NrLWxldmVsIHRhZ3MgY2FuIHNjcmV3IHVwIHdvcmRzLiAgZXg6XG4gICAgLy8gaGVsbG88YnI+aG93IGFyZSB5b3U/ICAgaGVyZSBiZWNvbWVzXG4gICAgLy8gaGVsbG9ob3cgYXJlIHlvdT8gICAgPC0tIG5vIHNwYWNlIHdoZXJlIHRoZSA8YnI+IHdhcy4gIGJhZC5cbiAgICB2YXIgbm9kZV90ZXh0ID0gJC50cmltKCAkbm9kZS5odG1sKCkucmVwbGFjZSgvPCAqYnIgKlxcLz8+L2dpLCAnICcpICk7XG4gICAgdmFyIGJvZHkgPSAkLnRyaW0oICQoIFwiPGRpdj5cIiArIG5vZGVfdGV4dCArIFwiPC9kaXY+XCIgKS50ZXh0KCkudG9Mb3dlckNhc2UoKSApO1xuXG4gICAgaWYoIGJvZHkgJiYgdHlwZW9mIGJvZHkgPT0gXCJzdHJpbmdcIiAmJiBib2R5ICE9PSBcIlwiICkge1xuICAgICAgICB2YXIgZmlyc3RwYXNzID0gYm9keS5yZXBsYWNlKC9bXFxuXFxyXFx0XSsvZ2ksJyAnKS5yZXBsYWNlKCkucmVwbGFjZSgvXFxzezIsfS9nLCcgJyk7XG4gICAgICAgIC8vIHNlZWluZyBpZiB0aGlzIGhlbHBzIHRoZSBwcm9wdWIgaXNzdWUgLSB0byB0cmltIGFnYWluLiAgV2hlbiBpIHJ1biB0aGlzIGxpbmUgYWJvdmUgaXQgbG9va3MgbGlrZSB0aGVyZSBpcyBzdGlsbCB3aGl0ZSBzcGFjZS5cbiAgICAgICAgcmV0dXJuICQudHJpbShmaXJzdHBhc3MpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gaGFzaFRleHQoZWxlbWVudCkge1xuICAgIC8vIFRPRE86IEhhbmRsZSB0aGUgY2FzZSB3aGVyZSBtdWx0aXBsZSBpbnN0YW5jZXMgb2YgdGhlIHNhbWUgdGV4dCBhcHBlYXIgb24gdGhlIHBhZ2UuIE5lZWQgdG8gYWRkIGFuIGluY3JlbWVudCB0b1xuICAgIC8vIHRoZSBoYXNoVGV4dC4gKFRoaXMgY2hlY2sgaGFzIHRvIGJlIHNjb3BlZCB0byBhIHBvc3QpXG4gICAgdmFyIHRleHQgPSBnZXRDbGVhblRleHQoZWxlbWVudCk7XG4gICAgaWYgKHRleHQpIHtcbiAgICAgICAgdmFyIGhhc2hUZXh0ID0gXCJyZHItdGV4dC1cIiArIHRleHQ7XG4gICAgICAgIHJldHVybiBNRDUuaGV4X21kNShoYXNoVGV4dCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBoYXNoVXJsKHVybCkge1xuICAgIHJldHVybiBNRDUuaGV4X21kNSh1cmwpO1xufVxuXG5mdW5jdGlvbiBoYXNoSW1hZ2UoaW1hZ2VVcmwpIHtcbiAgICBpZiAoaW1hZ2VVcmwgJiYgaW1hZ2VVcmwubGVuZ3RoID4gMCkge1xuICAgICAgICB2YXIgaGFzaFRleHQgPSAncmRyLWltZy0nICsgaW1hZ2VVcmw7XG4gICAgICAgIHJldHVybiBNRDUuaGV4X21kNShoYXNoVGV4dCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBoYXNoTWVkaWEobWVkaWFVcmwpIHtcbiAgICBpZiAobWVkaWFVcmwgJiYgbWVkaWFVcmwubGVuZ3RoID4gMCkge1xuICAgICAgICB2YXIgaGFzaFRleHQgPSAncmRyLW1lZGlhLScgKyBtZWRpYVVybDtcbiAgICAgICAgcmV0dXJuIE1ENS5oZXhfbWQ1KGhhc2hUZXh0KTtcbiAgICB9XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBoYXNoVGV4dDogaGFzaFRleHQsXG4gICAgaGFzaEltYWdlOiBoYXNoSW1hZ2UsXG4gICAgaGFzaE1lZGlhOiBoYXNoTWVkaWEsXG4gICAgaGFzaFVybDogaGFzaFVybFxufTsiLCJcbnZhciBsb2FkZWRqUXVlcnk7XG52YXIgY2FsbGJhY2tzID0gW107XG5cbi8vIE5vdGlmaWVzIHRoZSBqUXVlcnkgcHJvdmlkZXIgdGhhdCB3ZSd2ZSBsb2FkZWQgdGhlIGpRdWVyeSBsaWJyYXJ5LlxuZnVuY3Rpb24gbG9hZGVkKCkge1xuICAgIGxvYWRlZGpRdWVyeSA9IGpRdWVyeS5ub0NvbmZsaWN0KCk7XG4gICAgbm90aWZ5Q2FsbGJhY2tzKCk7XG59XG5cbmZ1bmN0aW9uIG5vdGlmeUNhbGxiYWNrcygpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNhbGxiYWNrcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjYWxsYmFja3NbaV0obG9hZGVkalF1ZXJ5KTtcbiAgICB9XG4gICAgY2FsbGJhY2tzID0gW107XG59XG5cbi8vIFJlZ2lzdGVycyB0aGUgZ2l2ZW4gY2FsbGJhY2sgdG8gYmUgbm90aWZpZWQgd2hlbiBvdXIgdmVyc2lvbiBvZiBqUXVlcnkgaXMgbG9hZGVkLlxuZnVuY3Rpb24gb25Mb2FkKGNhbGxiYWNrKSB7XG4gICAgaWYgKGxvYWRlZGpRdWVyeSkge1xuICAgICAgICBjYWxsYmFjayhsb2FkZWRqUXVlcnkpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGNhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKTtcbiAgICB9XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBsb2FkZWQ6IGxvYWRlZCxcbiAgICBvbkxvYWQ6IG9uTG9hZFxufTsiLCJcbi8vIFRPRE86IFRoaXMgY29kZSBpcyBqdXN0IGNvcGllZCBmcm9tIGVuZ2FnZV9mdWxsLmpzLiBSZXZpZXcgd2hldGhlciB3ZSB3YW50IHRvIGtlZXAgaXQgYXMtaXMuXG5cbnZhciBBTlQgPSB7XG4gICAgdXRpbDoge1xuICAgICAgICBtZDU6IHtcbiAgICAgICAgICAgIGhleGNhc2U6MCxcbiAgICAgICAgICAgIGI2NHBhZDpcIlwiLFxuICAgICAgICAgICAgY2hyc3o6OCxcbiAgICAgICAgICAgIGhleF9tZDU6IGZ1bmN0aW9uKHMpe3JldHVybiBBTlQudXRpbC5tZDUuYmlubDJoZXgoQU5ULnV0aWwubWQ1LmNvcmVfbWQ1KEFOVC51dGlsLm1kNS5zdHIyYmlubChzKSxzLmxlbmd0aCpBTlQudXRpbC5tZDUuY2hyc3opKTt9LFxuICAgICAgICAgICAgY29yZV9tZDU6IGZ1bmN0aW9uKHgsbGVuKXt4W2xlbj4+NV18PTB4ODA8PCgobGVuKSUzMik7eFsoKChsZW4rNjQpPj4+OSk8PDQpKzE0XT1sZW47dmFyIGE9MTczMjU4NDE5Mzt2YXIgYj0tMjcxNzMzODc5O3ZhciBjPS0xNzMyNTg0MTk0O3ZhciBkPTI3MTczMzg3ODtmb3IodmFyIGk9MDtpPHgubGVuZ3RoO2krPTE2KXt2YXIgb2xkYT1hO3ZhciBvbGRiPWI7dmFyIG9sZGM9Yzt2YXIgb2xkZD1kO2E9QU5ULnV0aWwubWQ1Lm1kNV9mZihhLGIsYyxkLHhbaSswXSw3LC02ODA4NzY5MzYpO2Q9QU5ULnV0aWwubWQ1Lm1kNV9mZihkLGEsYixjLHhbaSsxXSwxMiwtMzg5NTY0NTg2KTtjPUFOVC51dGlsLm1kNS5tZDVfZmYoYyxkLGEsYix4W2krMl0sMTcsNjA2MTA1ODE5KTtiPUFOVC51dGlsLm1kNS5tZDVfZmYoYixjLGQsYSx4W2krM10sMjIsLTEwNDQ1MjUzMzApO2E9QU5ULnV0aWwubWQ1Lm1kNV9mZihhLGIsYyxkLHhbaSs0XSw3LC0xNzY0MTg4OTcpO2Q9QU5ULnV0aWwubWQ1Lm1kNV9mZihkLGEsYixjLHhbaSs1XSwxMiwxMjAwMDgwNDI2KTtjPUFOVC51dGlsLm1kNS5tZDVfZmYoYyxkLGEsYix4W2krNl0sMTcsLTE0NzMyMzEzNDEpO2I9QU5ULnV0aWwubWQ1Lm1kNV9mZihiLGMsZCxhLHhbaSs3XSwyMiwtNDU3MDU5ODMpO2E9QU5ULnV0aWwubWQ1Lm1kNV9mZihhLGIsYyxkLHhbaSs4XSw3LDE3NzAwMzU0MTYpO2Q9QU5ULnV0aWwubWQ1Lm1kNV9mZihkLGEsYixjLHhbaSs5XSwxMiwtMTk1ODQxNDQxNyk7Yz1BTlQudXRpbC5tZDUubWQ1X2ZmKGMsZCxhLGIseFtpKzEwXSwxNywtNDIwNjMpO2I9QU5ULnV0aWwubWQ1Lm1kNV9mZihiLGMsZCxhLHhbaSsxMV0sMjIsLTE5OTA0MDQxNjIpO2E9QU5ULnV0aWwubWQ1Lm1kNV9mZihhLGIsYyxkLHhbaSsxMl0sNywxODA0NjAzNjgyKTtkPUFOVC51dGlsLm1kNS5tZDVfZmYoZCxhLGIsYyx4W2krMTNdLDEyLC00MDM0MTEwMSk7Yz1BTlQudXRpbC5tZDUubWQ1X2ZmKGMsZCxhLGIseFtpKzE0XSwxNywtMTUwMjAwMjI5MCk7Yj1BTlQudXRpbC5tZDUubWQ1X2ZmKGIsYyxkLGEseFtpKzE1XSwyMiwxMjM2NTM1MzI5KTthPUFOVC51dGlsLm1kNS5tZDVfZ2coYSxiLGMsZCx4W2krMV0sNSwtMTY1Nzk2NTEwKTtkPUFOVC51dGlsLm1kNS5tZDVfZ2coZCxhLGIsYyx4W2krNl0sOSwtMTA2OTUwMTYzMik7Yz1BTlQudXRpbC5tZDUubWQ1X2dnKGMsZCxhLGIseFtpKzExXSwxNCw2NDM3MTc3MTMpO2I9QU5ULnV0aWwubWQ1Lm1kNV9nZyhiLGMsZCxhLHhbaSswXSwyMCwtMzczODk3MzAyKTthPUFOVC51dGlsLm1kNS5tZDVfZ2coYSxiLGMsZCx4W2krNV0sNSwtNzAxNTU4NjkxKTtkPUFOVC51dGlsLm1kNS5tZDVfZ2coZCxhLGIsYyx4W2krMTBdLDksMzgwMTYwODMpO2M9QU5ULnV0aWwubWQ1Lm1kNV9nZyhjLGQsYSxiLHhbaSsxNV0sMTQsLTY2MDQ3ODMzNSk7Yj1BTlQudXRpbC5tZDUubWQ1X2dnKGIsYyxkLGEseFtpKzRdLDIwLC00MDU1Mzc4NDgpO2E9QU5ULnV0aWwubWQ1Lm1kNV9nZyhhLGIsYyxkLHhbaSs5XSw1LDU2ODQ0NjQzOCk7ZD1BTlQudXRpbC5tZDUubWQ1X2dnKGQsYSxiLGMseFtpKzE0XSw5LC0xMDE5ODAzNjkwKTtjPUFOVC51dGlsLm1kNS5tZDVfZ2coYyxkLGEsYix4W2krM10sMTQsLTE4NzM2Mzk2MSk7Yj1BTlQudXRpbC5tZDUubWQ1X2dnKGIsYyxkLGEseFtpKzhdLDIwLDExNjM1MzE1MDEpO2E9QU5ULnV0aWwubWQ1Lm1kNV9nZyhhLGIsYyxkLHhbaSsxM10sNSwtMTQ0NDY4MTQ2Nyk7ZD1BTlQudXRpbC5tZDUubWQ1X2dnKGQsYSxiLGMseFtpKzJdLDksLTUxNDAzNzg0KTtjPUFOVC51dGlsLm1kNS5tZDVfZ2coYyxkLGEsYix4W2krN10sMTQsMTczNTMyODQ3Myk7Yj1BTlQudXRpbC5tZDUubWQ1X2dnKGIsYyxkLGEseFtpKzEyXSwyMCwtMTkyNjYwNzczNCk7YT1BTlQudXRpbC5tZDUubWQ1X2hoKGEsYixjLGQseFtpKzVdLDQsLTM3ODU1OCk7ZD1BTlQudXRpbC5tZDUubWQ1X2hoKGQsYSxiLGMseFtpKzhdLDExLC0yMDIyNTc0NDYzKTtjPUFOVC51dGlsLm1kNS5tZDVfaGgoYyxkLGEsYix4W2krMTFdLDE2LDE4MzkwMzA1NjIpO2I9QU5ULnV0aWwubWQ1Lm1kNV9oaChiLGMsZCxhLHhbaSsxNF0sMjMsLTM1MzA5NTU2KTthPUFOVC51dGlsLm1kNS5tZDVfaGgoYSxiLGMsZCx4W2krMV0sNCwtMTUzMDk5MjA2MCk7ZD1BTlQudXRpbC5tZDUubWQ1X2hoKGQsYSxiLGMseFtpKzRdLDExLDEyNzI4OTMzNTMpO2M9QU5ULnV0aWwubWQ1Lm1kNV9oaChjLGQsYSxiLHhbaSs3XSwxNiwtMTU1NDk3NjMyKTtiPUFOVC51dGlsLm1kNS5tZDVfaGgoYixjLGQsYSx4W2krMTBdLDIzLC0xMDk0NzMwNjQwKTthPUFOVC51dGlsLm1kNS5tZDVfaGgoYSxiLGMsZCx4W2krMTNdLDQsNjgxMjc5MTc0KTtkPUFOVC51dGlsLm1kNS5tZDVfaGgoZCxhLGIsYyx4W2krMF0sMTEsLTM1ODUzNzIyMik7Yz1BTlQudXRpbC5tZDUubWQ1X2hoKGMsZCxhLGIseFtpKzNdLDE2LC03MjI1MjE5NzkpO2I9QU5ULnV0aWwubWQ1Lm1kNV9oaChiLGMsZCxhLHhbaSs2XSwyMyw3NjAyOTE4OSk7YT1BTlQudXRpbC5tZDUubWQ1X2hoKGEsYixjLGQseFtpKzldLDQsLTY0MDM2NDQ4Nyk7ZD1BTlQudXRpbC5tZDUubWQ1X2hoKGQsYSxiLGMseFtpKzEyXSwxMSwtNDIxODE1ODM1KTtjPUFOVC51dGlsLm1kNS5tZDVfaGgoYyxkLGEsYix4W2krMTVdLDE2LDUzMDc0MjUyMCk7Yj1BTlQudXRpbC5tZDUubWQ1X2hoKGIsYyxkLGEseFtpKzJdLDIzLC05OTUzMzg2NTEpO2E9QU5ULnV0aWwubWQ1Lm1kNV9paShhLGIsYyxkLHhbaSswXSw2LC0xOTg2MzA4NDQpO2Q9QU5ULnV0aWwubWQ1Lm1kNV9paShkLGEsYixjLHhbaSs3XSwxMCwxMTI2ODkxNDE1KTtjPUFOVC51dGlsLm1kNS5tZDVfaWkoYyxkLGEsYix4W2krMTRdLDE1LC0xNDE2MzU0OTA1KTtiPUFOVC51dGlsLm1kNS5tZDVfaWkoYixjLGQsYSx4W2krNV0sMjEsLTU3NDM0MDU1KTthPUFOVC51dGlsLm1kNS5tZDVfaWkoYSxiLGMsZCx4W2krMTJdLDYsMTcwMDQ4NTU3MSk7ZD1BTlQudXRpbC5tZDUubWQ1X2lpKGQsYSxiLGMseFtpKzNdLDEwLC0xODk0OTg2NjA2KTtjPUFOVC51dGlsLm1kNS5tZDVfaWkoYyxkLGEsYix4W2krMTBdLDE1LC0xMDUxNTIzKTtiPUFOVC51dGlsLm1kNS5tZDVfaWkoYixjLGQsYSx4W2krMV0sMjEsLTIwNTQ5MjI3OTkpO2E9QU5ULnV0aWwubWQ1Lm1kNV9paShhLGIsYyxkLHhbaSs4XSw2LDE4NzMzMTMzNTkpO2Q9QU5ULnV0aWwubWQ1Lm1kNV9paShkLGEsYixjLHhbaSsxNV0sMTAsLTMwNjExNzQ0KTtjPUFOVC51dGlsLm1kNS5tZDVfaWkoYyxkLGEsYix4W2krNl0sMTUsLTE1NjAxOTgzODApO2I9QU5ULnV0aWwubWQ1Lm1kNV9paShiLGMsZCxhLHhbaSsxM10sMjEsMTMwOTE1MTY0OSk7YT1BTlQudXRpbC5tZDUubWQ1X2lpKGEsYixjLGQseFtpKzRdLDYsLTE0NTUyMzA3MCk7ZD1BTlQudXRpbC5tZDUubWQ1X2lpKGQsYSxiLGMseFtpKzExXSwxMCwtMTEyMDIxMDM3OSk7Yz1BTlQudXRpbC5tZDUubWQ1X2lpKGMsZCxhLGIseFtpKzJdLDE1LDcxODc4NzI1OSk7Yj1BTlQudXRpbC5tZDUubWQ1X2lpKGIsYyxkLGEseFtpKzldLDIxLC0zNDM0ODU1NTEpO2E9QU5ULnV0aWwubWQ1LnNhZmVfYWRkKGEsb2xkYSk7Yj1BTlQudXRpbC5tZDUuc2FmZV9hZGQoYixvbGRiKTtjPUFOVC51dGlsLm1kNS5zYWZlX2FkZChjLG9sZGMpO2Q9QU5ULnV0aWwubWQ1LnNhZmVfYWRkKGQsb2xkZCk7fSByZXR1cm4gQXJyYXkoYSxiLGMsZCk7fSxcbiAgICAgICAgICAgIG1kNV9jbW46IGZ1bmN0aW9uKHEsYSxiLHgscyx0KXtyZXR1cm4gQU5ULnV0aWwubWQ1LnNhZmVfYWRkKEFOVC51dGlsLm1kNS5iaXRfcm9sKEFOVC51dGlsLm1kNS5zYWZlX2FkZChBTlQudXRpbC5tZDUuc2FmZV9hZGQoYSxxKSxBTlQudXRpbC5tZDUuc2FmZV9hZGQoeCx0KSkscyksYik7fSxcbiAgICAgICAgICAgIG1kNV9mZjogZnVuY3Rpb24oYSxiLGMsZCx4LHMsdCl7cmV0dXJuIEFOVC51dGlsLm1kNS5tZDVfY21uKChiJmMpfCgofmIpJmQpLGEsYix4LHMsdCk7fSxcbiAgICAgICAgICAgIG1kNV9nZzogZnVuY3Rpb24oYSxiLGMsZCx4LHMsdCl7cmV0dXJuIEFOVC51dGlsLm1kNS5tZDVfY21uKChiJmQpfChjJih+ZCkpLGEsYix4LHMsdCk7fSxcbiAgICAgICAgICAgIG1kNV9oaDogZnVuY3Rpb24oYSxiLGMsZCx4LHMsdCl7cmV0dXJuIEFOVC51dGlsLm1kNS5tZDVfY21uKGJeY15kLGEsYix4LHMsdCk7fSxcbiAgICAgICAgICAgIG1kNV9paTogZnVuY3Rpb24oYSxiLGMsZCx4LHMsdCl7cmV0dXJuIEFOVC51dGlsLm1kNS5tZDVfY21uKGNeKGJ8KH5kKSksYSxiLHgscyx0KTt9LFxuICAgICAgICAgICAgc2FmZV9hZGQ6IGZ1bmN0aW9uKHgseSl7dmFyIGxzdz0oeCYweEZGRkYpKyh5JjB4RkZGRik7dmFyIG1zdz0oeD4+MTYpKyh5Pj4xNikrKGxzdz4+MTYpO3JldHVybihtc3c8PDE2KXwobHN3JjB4RkZGRik7fSxcbiAgICAgICAgICAgIGJpdF9yb2w6IGZ1bmN0aW9uKG51bSxjbnQpe3JldHVybihudW08PGNudCl8KG51bT4+PigzMi1jbnQpKTt9LFxuICAgICAgICAgICAgLy90aGUgbGluZSBiZWxvdyBpcyBjYWxsZWQgb3V0IGJ5IGpzTGludCBiZWNhdXNlIGl0IHVzZXMgQXJyYXkoKSBpbnN0ZWFkIG9mIFtdLiAgV2UgY2FuIGlnbm9yZSwgb3IgSSdtIHN1cmUgd2UgY291bGQgY2hhbmdlIGl0IGlmIHdlIHdhbnRlZCB0by5cbiAgICAgICAgICAgIHN0cjJiaW5sOiBmdW5jdGlvbihzdHIpe3ZhciBiaW49QXJyYXkoKTt2YXIgbWFzaz0oMTw8QU5ULnV0aWwubWQ1LmNocnN6KS0xO2Zvcih2YXIgaT0wO2k8c3RyLmxlbmd0aCpBTlQudXRpbC5tZDUuY2hyc3o7aSs9QU5ULnV0aWwubWQ1LmNocnN6KXtiaW5baT4+NV18PShzdHIuY2hhckNvZGVBdChpL0FOVC51dGlsLm1kNS5jaHJzeikmbWFzayk8PChpJTMyKTt9cmV0dXJuIGJpbjt9LFxuICAgICAgICAgICAgYmlubDJoZXg6IGZ1bmN0aW9uKGJpbmFycmF5KXt2YXIgaGV4X3RhYj1BTlQudXRpbC5tZDUuaGV4Y2FzZT9cIjAxMjM0NTY3ODlBQkNERUZcIjpcIjAxMjM0NTY3ODlhYmNkZWZcIjt2YXIgc3RyPVwiXCI7Zm9yKHZhciBpPTA7aTxiaW5hcnJheS5sZW5ndGgqNDtpKyspe3N0cis9aGV4X3RhYi5jaGFyQXQoKGJpbmFycmF5W2k+PjJdPj4oKGklNCkqOCs0KSkmMHhGKStoZXhfdGFiLmNoYXJBdCgoYmluYXJyYXlbaT4+Ml0+PigoaSU0KSo4KSkmMHhGKTt9IHJldHVybiBzdHI7fVxuICAgICAgICB9XG4gICAgfVxufTtcblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGhleF9tZDU6IEFOVC51dGlsLm1kNS5oZXhfbWQ1XG59OyIsIi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAnc3VtbWFyeS13aWRnZXRfcmVhY3Rpb25zJzogJ1JlYWN0aW9ucycsXG4gICAgJ3N1bW1hcnktd2lkZ2V0X3JlYWN0aW9uc19vbmUnOiAnMSBSZWFjdGlvbicsXG4gICAgJ3N1bW1hcnktd2lkZ2V0X3JlYWN0aW9uc19tYW55JzogJ3swfSBSZWFjdGlvbnMnLFxuXG4gICAgJ3JlYWN0aW9ucy13aWRnZXRfdGl0bGUnOiAnUmVhY3Rpb25zJyxcbiAgICAncmVhY3Rpb25zLXdpZGdldF90aXRsZV90aGFua3MnOiAnVGhhbmtzIGZvciB5b3VyIHJlYWN0aW9uIScsXG5cbiAgICAncmVhY3Rpb25zLXBhZ2Vfbm9fcmVhY3Rpb25zJzogJ05vIHJlYWN0aW9ucyB5ZXQhJyxcbiAgICAncmVhY3Rpb25zLXBhZ2VfdGhpbmsnOiAnV2hhdCBkbyB5b3UgdGhpbms/JyxcblxuICAgICdtZWRpYS1pbmRpY2F0b3JfdGhpbmsnOiAnV2hhdCBkbyB5b3UgdGhpbms/JyxcblxuICAgICdwb3B1cC13aWRnZXRfdGhpbmsnOiAnV2hhdCBkbyB5b3UgdGhpbms/JyxcblxuICAgICdkZWZhdWx0cy1wYWdlX2FkZCc6ICcrIEFkZCBZb3VyIE93bicsXG4gICAgJ2RlZmF1bHRzLXBhZ2Vfb2snOiAnb2snLFxuXG4gICAgJ2NvbmZpcm1hdGlvbi1wYWdlX3NoYXJlJzogJ1NoYXJlIHlvdXIgcmVhY3Rpb246JyxcblxuICAgICdjb21tZW50cy1wYWdlX2JhY2snOiAnQmFjaycsXG4gICAgJ2NvbW1lbnRzLXBhZ2VfaGVhZGVyJzogJyh7MH0pIENvbW1lbnRzOicsXG5cbiAgICAnY29tbWVudC1hcmVhX2FkZCc6ICdDb21tZW50JyxcbiAgICAnY29tbWVudC1hcmVhX3BsYWNlaG9sZGVyJzogJ0FkZCBjb21tZW50cyBvciAjaGFzaHRhZ3MnLFxuICAgICdjb21tZW50LWFyZWFfdGhhbmtzJzogJ1RoYW5rcyBmb3IgeW91ciBjb21tZW50LicsXG4gICAgJ2NvbW1lbnQtYXJlYV9jb3VudCc6ICc8c3BhbiBjbGFzcz1cImFudGVubmEtY29tbWVudC1jb3VudFwiPjwvc3Bhbj4gY2hhcmFjdGVycyBsZWZ0JyxcblxuICAgICdsb2NhdGlvbnMtcGFnZV9wYWdlbGV2ZWwnOiAnVG8gdGhpcyB3aG9sZSBwYWdlJyxcbiAgICAnbG9jYXRpb25zLXBhZ2VfY291bnRfb25lJzogJzxzcGFuIGNsYXNzPVwiYW50ZW5uYS1sb2NhdGlvbi1jb3VudFwiPjE8L3NwYW4+PGJyPnJlYWN0aW9uJyxcbiAgICAnbG9jYXRpb25zLXBhZ2VfY291bnRfbWFueSc6ICc8c3BhbiBjbGFzcz1cImFudGVubmEtbG9jYXRpb24tY291bnRcIj57MH08L3NwYW4+PGJyPnJlYWN0aW9ucycsXG4gICAgJ2xvY2F0aW9ucy1wYWdlX2JhY2snOiAnQmFjaycsXG5cbiAgICAnY2FsbC10by1hY3Rpb24tbGFiZWxfcmVzcG9uc2VzJzogJ1Jlc3BvbnNlcycsXG4gICAgJ2NhbGwtdG8tYWN0aW9uLWxhYmVsX3Jlc3BvbnNlc19vbmUnOiAnMSBSZXNwb25zZScsXG4gICAgJ2NhbGwtdG8tYWN0aW9uLWxhYmVsX3Jlc3BvbnNlc19tYW55JzogJ3swfSBSZXNwb25zZXMnXG59OyIsIi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAnc3VtbWFyeS13aWRnZXRfcmVhY3Rpb25zJzogXCJSZWFjY2lvbmVzXCIsXG4gICAgJ3N1bW1hcnktd2lkZ2V0X3JlYWN0aW9uc19vbmUnOiBcIjEgUmVhY2Npw7NuXCIsXG4gICAgJ3N1bW1hcnktd2lkZ2V0X3JlYWN0aW9uc19tYW55JzogXCJ7MH0gUmVhY2Npb25lc1wiLFxuXG4gICAgJ3JlYWN0aW9ucy13aWRnZXRfdGl0bGUnOiBcIlJlYWNjaW9uZXNcIixcbiAgICAncmVhY3Rpb25zLXdpZGdldF90aXRsZV90aGFua3MnOiAnR3JhY2lhcyBwb3IgdHUgcmVhY2Npw7NuIScsXG5cbiAgICAncmVhY3Rpb25zLXBhZ2Vfbm9fcmVhY3Rpb25zJzogJ05vIHJlYWNjaW9uZXMhJywgLy8gVE9ETzogbmVlZCBhIHRyYW5zbGF0aW9uIG9mIFwiTm8gcmVhY3Rpb25zIHlldCFcIlxuICAgICdyZWFjdGlvbnMtcGFnZV90aGluayc6ICfCv1F1w6kgcGllbnNhcz8nLFxuXG4gICAgJ21lZGlhLWluZGljYXRvcl90aGluayc6ICfCv1F1w6kgcGllbnNhcz8nLFxuXG4gICAgJ3BvcHVwLXdpZGdldF90aGluayc6ICfCv1F1w6kgcGllbnNhcz8nLFxuXG4gICAgJ2RlZmF1bHRzLXBhZ2VfYWRkJzogJysgQcOxYWRlIGxvIHR1eW8nLFxuICAgICdkZWZhdWx0cy1wYWdlX29rJzogJ29rJywgLy8gVE9ETzogaXMgdGhpcyByaWdodD8gJ2FjY2VwdGFyJz9cblxuICAgICdjb25maXJtYXRpb24tcGFnZV9zaGFyZSc6ICdDb21wYXJ0ZSB0dSByZWFjY2nDs246JyxcblxuICAgICdjb21tZW50cy1wYWdlX2JhY2snOiAnQ2VycmFyJywgLy8gVE9ETzogbmVlZCBhIHRyYW5zbGF0aW9uIGZvciBcIkJhY2tcIlxuICAgICdjb21tZW50cy1wYWdlX2hlYWRlcic6ICcoezB9KSBDb21lbnRhczonLFxuXG4gICAgJ2NvbW1lbnQtYXJlYV9hZGQnOiAnQ29tZW50YScsXG4gICAgJ2NvbW1lbnQtYXJlYV9wbGFjZWhvbGRlcic6ICdBw7FhZGUgY29tZW50YXJpb3MgbyAjaGFzaHRhZ3MnLFxuICAgICdjb21tZW50LWFyZWFfdGhhbmtzJzogJ0dyYWNpYXMgcG9yIHR1IHJlYWNjacOzbi4nLFxuICAgICdjb21tZW50LWFyZWFfY291bnQnOiAnUXVlZGFuIDxzcGFuIGNsYXNzPVwiYW50ZW5uYS1jb21tZW50LWNvdW50XCI+PC9zcGFuPiBjYXJhY3RlcmVzJyxcblxuICAgICdsb2NhdGlvbnMtcGFnZV9wYWdlbGV2ZWwnOiAnQSBlc3RhIHDDoWdpbmEnLCAvLyBUT0RPOiBuZWVkIGEgdHJhbnNsYXRpb24gb2YgXCJUbyB0aGlzIHdob2xlIHBhZ2VcIlxuICAgICdsb2NhdGlvbnMtcGFnZV9jb3VudF9vbmUnOiAnPHNwYW4gY2xhc3M9XCJhbnRlbm5hLWxvY2F0aW9uLWNvdW50XCI+MTwvc3Bhbj48YnI+cmVhY2Npw7NuJyxcbiAgICAnbG9jYXRpb25zLXBhZ2VfY291bnRfbWFueSc6ICc8c3BhbiBjbGFzcz1cImFudGVubmEtbG9jYXRpb24tY291bnRcIj57MH08L3NwYW4+PGJyPnJlYWNjaW9uZXMnLFxuICAgICdsb2NhdGlvbnMtcGFnZV9iYWNrJzogJ0NlcnJhcicsIC8vIFRPRE86IG5lZWQgYSB0cmFuc2xhdGlvbiBmb3IgXCJCYWNrXCJcblxuICAgICdjYWxsLXRvLWFjdGlvbi1sYWJlbF9yZXNwb25zZXMnOiAnUmVzcHVlc3RhcycsIC8vIFRPRE86IG5lZWQgYSB0cmFuc2xhdGlvbiBvZiBcIlJlc3BvbnNlc1wiXG4gICAgJ2NhbGwtdG8tYWN0aW9uLWxhYmVsX3Jlc3BvbnNlc19vbmUnOiAnMSBSZXNwdWVzdGEnLCAvLyBUT0RPXG4gICAgJ2NhbGwtdG8tYWN0aW9uLWxhYmVsX3Jlc3BvbnNlc19tYW55JzogJ3swfSBSZXNwdWVzdGFzJyAvLyBUT0RPXG59OyIsInZhciBHcm91cFNldHRpbmdzID0gcmVxdWlyZSgnLi4vZ3JvdXAtc2V0dGluZ3MnKTtcblxudmFyIEVuZ2xpc2hNZXNzYWdlcyA9IHJlcXVpcmUoJy4vbWVzc2FnZXMtZW4nKTtcbnZhciBTcGFuaXNoTWVzc2FnZXMgPSByZXF1aXJlKCcuL21lc3NhZ2VzLWVzJyk7XG52YWxpZGF0ZVRyYW5zbGF0aW9ucygpO1xuXG5mdW5jdGlvbiB2YWxpZGF0ZVRyYW5zbGF0aW9ucygpIHtcbiAgICBmb3IgKHZhciBlbmdsaXNoS2V5IGluIEVuZ2xpc2hNZXNzYWdlcykge1xuICAgICAgICBpZiAoRW5nbGlzaE1lc3NhZ2VzLmhhc093blByb3BlcnR5KGVuZ2xpc2hLZXkpKSB7XG4gICAgICAgICAgICBpZiAoIVNwYW5pc2hNZXNzYWdlcy5oYXNPd25Qcm9wZXJ0eShlbmdsaXNoS2V5KSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ0FudGVubmEgd2FybmluZzogU3BhbmlzaCB0cmFuc2xhdGlvbiBtaXNzaW5nIGZvciBrZXkgJyArIGVuZ2xpc2hLZXkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBnZXRNZXNzYWdlKGtleSwgdmFsdWVzKSB7XG4gICAgdmFyIHN0cmluZyA9IGdldExvY2FsaXplZFN0cmluZyhrZXksIEdyb3VwU2V0dGluZ3MuZ2V0KCkubGFuZ3VhZ2UoKSk7XG4gICAgaWYgKHZhbHVlcykge1xuICAgICAgICByZXR1cm4gZm9ybWF0KHN0cmluZywgdmFsdWVzKTtcbiAgICB9XG4gICAgcmV0dXJuIHN0cmluZztcbn1cblxuZnVuY3Rpb24gZ2V0TG9jYWxpemVkU3RyaW5nKGtleSwgbGFuZykge1xuICAgIHZhciBzdHJpbmc7XG4gICAgc3dpdGNoKGxhbmcpIHtcbiAgICAgICAgY2FzZSAnZW4nOlxuICAgICAgICAgICAgc3RyaW5nID0gRW5nbGlzaE1lc3NhZ2VzW2tleV07XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnZXMnOlxuICAgICAgICAgICAgc3RyaW5nID0gU3BhbmlzaE1lc3NhZ2VzW2tleV07XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIC8vIFRPRE86IHJldmlld1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ0ludmFsaWQgbGFuZ3VhZ2Ugc3BlY2lmaWVkIGluIEFudGVubmEgZ3JvdXAgc2V0dGluZ3MuJyk7XG4gICAgICAgICAgICBicmVhaztcbiAgICB9XG4gICAgaWYgKCFzdHJpbmcpIHsgLy8gRGVmYXVsdCB0byBFbmdsaXNoXG4gICAgICAgIHN0cmluZyA9IEVuZ2xpc2hNZXNzYWdlc1trZXldO1xuICAgIH1cbiAgICAvLyBUT0RPOiBoYW5kbGUgbWlzc2luZyBrZXlcbiAgICByZXR1cm4gc3RyaW5nO1xufVxuXG5mdW5jdGlvbiBmb3JtYXQoc3RyaW5nLCB2YWx1ZXMpIHtcbiAgICAvLyBQb3B1bGFyLCBzaW1wbGUgYWxnb3JpdGhtIGZyb20gaHR0cDovL2phdmFzY3JpcHQuY3JvY2tmb3JkLmNvbS9yZW1lZGlhbC5odG1sXG4gICAgcmV0dXJuIHN0cmluZy5yZXBsYWNlKFxuICAgICAgICAvXFx7KFtee31dKilcXH0vZyxcbiAgICAgICAgZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgICAgIHZhciByID0gdmFsdWVzW2JdO1xuICAgICAgICAgICAgcmV0dXJuIHR5cGVvZiByID09PSAnc3RyaW5nJyB8fCB0eXBlb2YgciA9PT0gJ251bWJlcicgPyByIDogYTtcbiAgICAgICAgfVxuICAgICk7XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBnZXRNZXNzYWdlOiBnZXRNZXNzYWdlXG59OyIsInZhciAkOyByZXF1aXJlKCcuL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xuXG5mdW5jdGlvbiBtYWtlTW92ZWFibGUoJGVsZW1lbnQsICRkcmFnSGFuZGxlKSB7XG4gICAgJGRyYWdIYW5kbGUub24oJ21vdXNlZG93bi5hbnRlbm5hJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdmFyIG9mZnNldFggPSBldmVudC5wYWdlWCAtICRkcmFnSGFuZGxlLm9mZnNldCgpLmxlZnQ7XG4gICAgICAgIHZhciBvZmZzZXRZID0gZXZlbnQucGFnZVkgLSAkZHJhZ0hhbmRsZS5vZmZzZXQoKS50b3A7XG4gICAgICAgICQoZG9jdW1lbnQpLm9uKCdtb3VzZXVwLmFudGVubmEnLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgJChkb2N1bWVudCkub2ZmKCdtb3VzZW1vdmUuYW50ZW5uYScpO1xuICAgICAgICB9KTtcbiAgICAgICAgJChkb2N1bWVudCkub24oJ21vdXNlbW92ZS5hbnRlbm5hJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgICRlbGVtZW50LmNzcyh7XG4gICAgICAgICAgICAgICAgdG9wOiBldmVudC5wYWdlWSAtIG9mZnNldFksXG4gICAgICAgICAgICAgICAgbGVmdDogZXZlbnQucGFnZVggLSBvZmZzZXRYXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIG1ha2VNb3ZlYWJsZTogbWFrZU1vdmVhYmxlXG59OyIsInZhciAkOyByZXF1aXJlKCcuL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIFdpZGdldEJ1Y2tldCA9IHJlcXVpcmUoJy4vd2lkZ2V0LWJ1Y2tldCcpO1xuXG4vLyBUT0RPOiBkZXRlY3Qgd2hldGhlciB0aGUgYnJvd3NlciBzdXBwb3J0cyBNdXRhdGlvbk9ic2VydmVyIGFuZCBmYWxsYmFjayB0byBNdXRhdGlvbnMgRXZlbnRzXG5cbmZ1bmN0aW9uIGFkZEFkZGl0aW9uTGlzdGVuZXIoY2FsbGJhY2spIHtcbiAgICB2YXIgb2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcihmdW5jdGlvbihtdXRhdGlvblJlY29yZHMpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtdXRhdGlvblJlY29yZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBhZGRlZEVsZW1lbnRzID0gZmlsdGVyZWRFbGVtZW50cyhtdXRhdGlvblJlY29yZHNbaV0uYWRkZWROb2Rlcyk7XG4gICAgICAgICAgICBpZiAoYWRkZWRFbGVtZW50cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soYWRkZWRFbGVtZW50cyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICB2YXIgYm9keSA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdib2R5JylbMF07XG4gICAgb2JzZXJ2ZXIub2JzZXJ2ZShib2R5LCB7XG4gICAgICAgIGNoaWxkTGlzdDogdHJ1ZSxcbiAgICAgICAgYXR0cmlidXRlczogZmFsc2UsXG4gICAgICAgIGNoYXJhY3RlckRhdGE6IGZhbHNlLFxuICAgICAgICBzdWJ0cmVlOiB0cnVlLFxuICAgICAgICBhdHRyaWJ1dGVPbGRWYWx1ZTogZmFsc2UsXG4gICAgICAgIGNoYXJhY3RlckRhdGFPbGRWYWx1ZTogZmFsc2VcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gYWRkUmVtb3ZhbExpc3RlbmVyKGNhbGxiYWNrKSB7XG4gICAgdmFyIG9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoZnVuY3Rpb24obXV0YXRpb25SZWNvcmRzKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbXV0YXRpb25SZWNvcmRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgcmVtb3ZlZEVsZW1lbnRzID0gZmlsdGVyZWRFbGVtZW50cyhtdXRhdGlvblJlY29yZHNbaV0ucmVtb3ZlZE5vZGVzKTtcbiAgICAgICAgICAgIGlmIChyZW1vdmVkRWxlbWVudHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKHJlbW92ZWRFbGVtZW50cyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICB2YXIgYm9keSA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdib2R5JylbMF07XG4gICAgb2JzZXJ2ZXIub2JzZXJ2ZShib2R5LCB7XG4gICAgICAgIGNoaWxkTGlzdDogdHJ1ZSxcbiAgICAgICAgYXR0cmlidXRlczogZmFsc2UsXG4gICAgICAgIGNoYXJhY3RlckRhdGE6IGZhbHNlLFxuICAgICAgICBzdWJ0cmVlOiB0cnVlLFxuICAgICAgICBhdHRyaWJ1dGVPbGRWYWx1ZTogZmFsc2UsXG4gICAgICAgIGNoYXJhY3RlckRhdGFPbGRWYWx1ZTogZmFsc2VcbiAgICB9KTtcbn1cblxuLy8gRmlsdGVyIHRoZSBzZXQgb2Ygbm9kZXMgdG8gZWxpbWluYXRlIGFueXRoaW5nIGluc2lkZSBvdXIgb3duIERPTSBlbGVtZW50cyAob3RoZXJ3aXNlLCB3ZSBnZW5lcmF0ZSBhIHRvbiBvZiBjaGF0dGVyKVxuZnVuY3Rpb24gZmlsdGVyZWRFbGVtZW50cyhub2RlTGlzdCkge1xuICAgIHZhciBmaWx0ZXJlZCA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbm9kZUxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIG5vZGUgPSBub2RlTGlzdFtpXTtcbiAgICAgICAgaWYgKG5vZGUubm9kZVR5cGUgIT09IDMpIHsgLy8gRG9uJ3QgcHJvY2VzcyB0ZXh0IG5vZGVzXG4gICAgICAgICAgICB2YXIgJGVsZW1lbnQgPSAkKG5vZGUpO1xuICAgICAgICAgICAgaWYgKCRlbGVtZW50LmNsb3Nlc3QoJy5hbnRlbm5hLCAnICsgV2lkZ2V0QnVja2V0LnNlbGVjdG9yKCkpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGZpbHRlcmVkLnB1c2goJGVsZW1lbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmaWx0ZXJlZDtcbn1cblxuZnVuY3Rpb24gYWRkT25lVGltZUF0dHJpYnV0ZUxpc3RlbmVyKG5vZGUsIGF0dHJpYnV0ZXMsIGNhbGxiYWNrKSB7XG4gICAgdmFyIG9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoZnVuY3Rpb24obXV0YXRpb25SZWNvcmRzKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbXV0YXRpb25SZWNvcmRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgdGFyZ2V0ID0gbXV0YXRpb25SZWNvcmRzW2ldLnRhcmdldDtcbiAgICAgICAgICAgIGNhbGxiYWNrKHRhcmdldCk7XG4gICAgICAgICAgICBvYnNlcnZlci5kaXNjb25uZWN0KCk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICBvYnNlcnZlci5vYnNlcnZlKG5vZGUsIHtcbiAgICAgICAgY2hpbGRMaXN0OiBmYWxzZSxcbiAgICAgICAgYXR0cmlidXRlczogdHJ1ZSxcbiAgICAgICAgY2hhcmFjdGVyRGF0YTogZmFsc2UsXG4gICAgICAgIHN1YnRyZWU6IGZhbHNlLFxuICAgICAgICBhdHRyaWJ1dGVPbGRWYWx1ZTogZmFsc2UsXG4gICAgICAgIGNoYXJhY3RlckRhdGFPbGRWYWx1ZTogZmFsc2UsXG4gICAgICAgIGF0dHJpYnV0ZUZpbHRlcjogYXR0cmlidXRlc1xuICAgIH0pO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgYWRkQWRkaXRpb25MaXN0ZW5lcjogYWRkQWRkaXRpb25MaXN0ZW5lcixcbiAgICBhZGRSZW1vdmFsTGlzdGVuZXI6IGFkZFJlbW92YWxMaXN0ZW5lcixcbiAgICBhZGRPbmVUaW1lQXR0cmlidXRlTGlzdGVuZXI6IGFkZE9uZVRpbWVBdHRyaWJ1dGVMaXN0ZW5lclxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcblxuZnVuY3Rpb24gY29tcHV0ZVRvcExldmVsUGFnZVRpdGxlKCkge1xuICAgIC8vIFRPRE86IFRoaXMgc2hvdWxkIGJlIGEgY29uZmlndXJhYmxlIGdyb3VwIHNldHRpbmcgbGlrZSB0aGUgb3RoZXIgcGFnZSBwcm9wZXJ0aWVzLlxuICAgIHJldHVybiBnZXRBdHRyaWJ1dGVWYWx1ZSgnbWV0YVtwcm9wZXJ0eT1cIm9nOnRpdGxlXCJdJywgJ2NvbnRlbnQnKSB8fCAkKCd0aXRsZScpLnRleHQoKS50cmltKCk7XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVQYWdlVGl0bGUoJHBhZ2UsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgcGFnZVRpdGxlID0gJHBhZ2UuZmluZChncm91cFNldHRpbmdzLnBhZ2VMaW5rU2VsZWN0b3IoKSkudGV4dCgpLnRyaW0oKTtcbiAgICBpZiAocGFnZVRpdGxlID09PSAnJykge1xuICAgICAgICBwYWdlVGl0bGUgPSBjb21wdXRlVG9wTGV2ZWxQYWdlVGl0bGUoKTtcbiAgICB9XG4gICAgcmV0dXJuIHBhZ2VUaXRsZTtcbn1cblxuZnVuY3Rpb24gY29tcHV0ZVRvcExldmVsUGFnZUltYWdlKGdyb3VwU2V0dGluZ3MpIHtcbiAgICByZXR1cm4gZ2V0QXR0cmlidXRlVmFsdWUoZ3JvdXBTZXR0aW5ncy5wYWdlSW1hZ2VTZWxlY3RvcigpLCBncm91cFNldHRpbmdzLnBhZ2VJbWFnZUF0dHJpYnV0ZSgpKTtcbn1cblxuZnVuY3Rpb24gY29tcHV0ZVBhZ2VBdXRob3IoZ3JvdXBTZXR0aW5ncykge1xuICAgIHJldHVybiBnZXRBdHRyaWJ1dGVWYWx1ZShncm91cFNldHRpbmdzLnBhZ2VBdXRob3JTZWxlY3RvcigpLCBncm91cFNldHRpbmdzLnBhZ2VBdXRob3JBdHRyaWJ1dGUoKSk7XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVQYWdlVG9waWNzKGdyb3VwU2V0dGluZ3MpIHtcbiAgICByZXR1cm4gZ2V0QXR0cmlidXRlVmFsdWUoZ3JvdXBTZXR0aW5ncy5wYWdlVG9waWNzU2VsZWN0b3IoKSwgZ3JvdXBTZXR0aW5ncy5wYWdlVG9waWNzQXR0cmlidXRlKCkpO1xufVxuXG5mdW5jdGlvbiBjb21wdXRlUGFnZVNpdGVTZWN0aW9uKGdyb3VwU2V0dGluZ3MpIHtcbiAgICByZXR1cm4gZ2V0QXR0cmlidXRlVmFsdWUoZ3JvdXBTZXR0aW5ncy5wYWdlU2l0ZVNlY3Rpb25TZWxlY3RvcigpLCBncm91cFNldHRpbmdzLnBhZ2VTaXRlU2VjdGlvbkF0dHJpYnV0ZSgpKTtcbn1cblxuZnVuY3Rpb24gZ2V0QXR0cmlidXRlVmFsdWUoZWxlbWVudFNlbGVjdG9yLCBhdHRyaWJ1dGVTZWxlY3Rvcikge1xuICAgIHZhciB2YWx1ZSA9ICcnO1xuICAgIGlmIChlbGVtZW50U2VsZWN0b3IgJiYgYXR0cmlidXRlU2VsZWN0b3IpIHtcbiAgICAgICAgdmFsdWUgPSAkKGVsZW1lbnRTZWxlY3RvcikuYXR0cihhdHRyaWJ1dGVTZWxlY3RvcikgfHwgJyc7XG4gICAgfVxuICAgIHJldHVybiB2YWx1ZS50cmltKCk7XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVUb3BMZXZlbENhbm9uaWNhbFVybChncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGNhbm9uaWNhbFVybCA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmLnNwbGl0KCcjJylbMF0udG9Mb3dlckNhc2UoKTtcbiAgICB2YXIgJGNhbm9uaWNhbExpbmsgPSAkKCdsaW5rW3JlbD1cImNhbm9uaWNhbFwiXScpO1xuICAgIGlmICgkY2Fub25pY2FsTGluay5sZW5ndGggPiAwKSB7XG4gICAgICAgIHZhciBvdmVycmlkZVVybCA9ICRjYW5vbmljYWxMaW5rLmF0dHIoJ2hyZWYnKS50cmltKCkudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgdmFyIGRvbWFpbiA9ICh3aW5kb3cubG9jYXRpb24ucHJvdG9jb2wrJy8vJyt3aW5kb3cubG9jYXRpb24uaG9zdG5hbWUrJy8nKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICBpZiAob3ZlcnJpZGVVcmwgIT09IGRvbWFpbikgeyAvLyBmYXN0Y28gZml4IChzaW5jZSB0aGV5IHNvbWV0aW1lcyByZXdyaXRlIHRoZWlyIGNhbm9uaWNhbCB0byBzaW1wbHkgYmUgdGhlaXIgZG9tYWluLilcbiAgICAgICAgICAgIGNhbm9uaWNhbFVybCA9IG92ZXJyaWRlVXJsO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZW1vdmVTdWJkb21haW5Gcm9tUGFnZVVybChjYW5vbmljYWxVcmwsIGdyb3VwU2V0dGluZ3MpO1xufVxuXG5mdW5jdGlvbiBjb21wdXRlUGFnZUVsZW1lbnRVcmwoJHBhZ2VFbGVtZW50LCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIHVybCA9ICRwYWdlRWxlbWVudC5maW5kKGdyb3VwU2V0dGluZ3MucGFnZUxpbmtTZWxlY3RvcigpKS5hdHRyKCdocmVmJyk7XG4gICAgaWYgKHVybCkge1xuICAgICAgICByZXR1cm4gcmVtb3ZlU3ViZG9tYWluRnJvbVBhZ2VVcmwodXJsLCBncm91cFNldHRpbmdzKTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbXB1dGVUb3BMZXZlbENhbm9uaWNhbFVybChncm91cFNldHRpbmdzKTtcbn1cblxuLy8gVE9ETyBjb3BpZWQgZnJvbSBlbmdhZ2VfZnVsbC4gUmV2aWV3LlxuZnVuY3Rpb24gcmVtb3ZlU3ViZG9tYWluRnJvbVBhZ2VVcmwodXJsLCBncm91cFNldHRpbmdzKSB7XG4gICAgLy8gQU5ULmFjdGlvbnMucmVtb3ZlU3ViZG9tYWluRnJvbVBhZ2VVcmw6XG4gICAgLy8gaWYgXCJpZ25vcmVfc3ViZG9tYWluXCIgaXMgY2hlY2tlZCBpbiBzZXR0aW5ncywgQU5EIHRoZXkgc3VwcGx5IGEgVExELFxuICAgIC8vIHRoZW4gbW9kaWZ5IHRoZSBwYWdlIGFuZCBjYW5vbmljYWwgVVJMcyBoZXJlLlxuICAgIC8vIGhhdmUgdG8gaGF2ZSB0aGVtIHN1cHBseSBvbmUgYmVjYXVzZSB0aGVyZSBhcmUgdG9vIG1hbnkgdmFyaWF0aW9ucyB0byByZWxpYWJseSBzdHJpcCBzdWJkb21haW5zICAoLmNvbSwgLmlzLCAuY29tLmFyLCAuY28udWssIGV0YylcbiAgICBpZiAoZ3JvdXBTZXR0aW5ncy51cmwuaWdub3JlU3ViZG9tYWluKCkgPT0gdHJ1ZSAmJiBncm91cFNldHRpbmdzLnVybC5jYW5vbmljYWxEb21haW4oKSkge1xuICAgICAgICB2YXIgSE9TVERPTUFJTiA9IC9bLVxcd10rXFwuKD86Wy1cXHddK1xcLnhuLS1bLVxcd10rfFstXFx3XXsyLH18Wy1cXHddK1xcLlstXFx3XXsyfSkkL2k7XG4gICAgICAgIHZhciBzcmNBcnJheSA9IHVybC5zcGxpdCgnLycpO1xuXG4gICAgICAgIHZhciBwcm90b2NvbCA9IHNyY0FycmF5WzBdO1xuICAgICAgICBzcmNBcnJheS5zcGxpY2UoMCwzKTtcblxuICAgICAgICB2YXIgcmV0dXJuVXJsID0gcHJvdG9jb2wgKyAnLy8nICsgZ3JvdXBTZXR0aW5ncy51cmwuY2Fub25pY2FsRG9tYWluKCkgKyAnLycgKyBzcmNBcnJheS5qb2luKCcvJyk7XG5cbiAgICAgICAgcmV0dXJuIHJldHVyblVybDtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdXJsO1xuICAgIH1cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNvbXB1dGVQYWdlVXJsOiBjb21wdXRlUGFnZUVsZW1lbnRVcmwsXG4gICAgY29tcHV0ZVBhZ2VUaXRsZTogY29tcHV0ZVBhZ2VUaXRsZSxcbiAgICBjb21wdXRlVG9wTGV2ZWxQYWdlSW1hZ2U6IGNvbXB1dGVUb3BMZXZlbFBhZ2VJbWFnZSxcbiAgICBjb21wdXRlUGFnZUF1dGhvcjogY29tcHV0ZVBhZ2VBdXRob3IsXG4gICAgY29tcHV0ZVBhZ2VUb3BpY3M6IGNvbXB1dGVQYWdlVG9waWNzLFxuICAgIGNvbXB1dGVQYWdlU2l0ZVNlY3Rpb246IGNvbXB1dGVQYWdlU2l0ZVNlY3Rpb25cbn07IiwiLy8gVGFwL2Zhc3RjbGljayBldmVudCBwbHVnaW4gZm9yIFJhY3RpdmUuanMgLSBlbGltaW5hdGVzIHRoZSAzMDBtcyBkZWxheSBvbiB0b3VjaC1lbmFibGVkIGRldmljZXMsIGFuZCBub3JtYWxpc2VzXG4vLyBhY3Jvc3MgbW91c2UsIHRvdWNoIGFuZCBwb2ludGVyIGV2ZW50cy5cbi8vIEF1dGhvcjogUmljaCBIYXJyaXNcbi8vIExpY2Vuc2U6IE1JVFxuLy8gU291cmNlOiBodHRwczovL2dpdGh1Yi5jb20vcmFjdGl2ZWpzL3JhY3RpdmUtZXZlbnRzLXRhcFxuKGZ1bmN0aW9uIChnbG9iYWwsIGZhY3RvcnkpIHtcblx0bW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7XG59KHRoaXMsIGZ1bmN0aW9uICgpIHsgJ3VzZSBzdHJpY3QnO1xuXG5cdHZhciBESVNUQU5DRV9USFJFU0hPTEQgPSA1OyAvLyBtYXhpbXVtIHBpeGVscyBwb2ludGVyIGNhbiBtb3ZlIGJlZm9yZSBjYW5jZWxcblx0dmFyIFRJTUVfVEhSRVNIT0xEID0gNDAwOyAvLyBtYXhpbXVtIG1pbGxpc2Vjb25kcyBiZXR3ZWVuIGRvd24gYW5kIHVwIGJlZm9yZSBjYW5jZWxcblxuXHRmdW5jdGlvbiB0YXAobm9kZSwgY2FsbGJhY2spIHtcblx0XHRyZXR1cm4gbmV3IFRhcEhhbmRsZXIobm9kZSwgY2FsbGJhY2spO1xuXHR9XG5cblx0ZnVuY3Rpb24gVGFwSGFuZGxlcihub2RlLCBjYWxsYmFjaykge1xuXHRcdHRoaXMubm9kZSA9IG5vZGU7XG5cdFx0dGhpcy5jYWxsYmFjayA9IGNhbGxiYWNrO1xuXG5cdFx0dGhpcy5wcmV2ZW50TW91c2Vkb3duRXZlbnRzID0gZmFsc2U7XG5cblx0XHR0aGlzLmJpbmQobm9kZSk7XG5cdH1cblxuXHRUYXBIYW5kbGVyLnByb3RvdHlwZSA9IHtcblx0XHRiaW5kOiBmdW5jdGlvbiBiaW5kKG5vZGUpIHtcblx0XHRcdC8vIGxpc3RlbiBmb3IgbW91c2UvcG9pbnRlciBldmVudHMuLi5cblx0XHRcdGlmICh3aW5kb3cubmF2aWdhdG9yLnBvaW50ZXJFbmFibGVkKSB7XG5cdFx0XHRcdG5vZGUuYWRkRXZlbnRMaXN0ZW5lcigncG9pbnRlcmRvd24nLCBoYW5kbGVNb3VzZWRvd24sIGZhbHNlKTtcblx0XHRcdH0gZWxzZSBpZiAod2luZG93Lm5hdmlnYXRvci5tc1BvaW50ZXJFbmFibGVkKSB7XG5cdFx0XHRcdG5vZGUuYWRkRXZlbnRMaXN0ZW5lcignTVNQb2ludGVyRG93bicsIGhhbmRsZU1vdXNlZG93biwgZmFsc2UpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0bm9kZS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBoYW5kbGVNb3VzZWRvd24sIGZhbHNlKTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gLi4uYW5kIHRvdWNoIGV2ZW50c1xuXHRcdFx0bm9kZS5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgaGFuZGxlVG91Y2hzdGFydCwgZmFsc2UpO1xuXG5cdFx0XHQvLyBuYXRpdmUgYnV0dG9ucywgYW5kIDxpbnB1dCB0eXBlPSdidXR0b24nPiBlbGVtZW50cywgc2hvdWxkIGZpcmUgYSB0YXAgZXZlbnRcblx0XHRcdC8vIHdoZW4gdGhlIHNwYWNlIGtleSBpcyBwcmVzc2VkXG5cdFx0XHRpZiAobm9kZS50YWdOYW1lID09PSAnQlVUVE9OJyB8fCBub2RlLnR5cGUgPT09ICdidXR0b24nKSB7XG5cdFx0XHRcdG5vZGUuYWRkRXZlbnRMaXN0ZW5lcignZm9jdXMnLCBoYW5kbGVGb2N1cywgZmFsc2UpO1xuXHRcdFx0fVxuXG5cdFx0XHRub2RlLl9fdGFwX2hhbmRsZXJfXyA9IHRoaXM7XG5cdFx0fSxcblx0XHRmaXJlOiBmdW5jdGlvbiBmaXJlKGV2ZW50LCB4LCB5KSB7XG5cdFx0XHR0aGlzLmNhbGxiYWNrKHtcblx0XHRcdFx0bm9kZTogdGhpcy5ub2RlLFxuXHRcdFx0XHRvcmlnaW5hbDogZXZlbnQsXG5cdFx0XHRcdHg6IHgsXG5cdFx0XHRcdHk6IHlcblx0XHRcdH0pO1xuXHRcdH0sXG5cdFx0bW91c2Vkb3duOiBmdW5jdGlvbiBtb3VzZWRvd24oZXZlbnQpIHtcblx0XHRcdHZhciBfdGhpcyA9IHRoaXM7XG5cblx0XHRcdGlmICh0aGlzLnByZXZlbnRNb3VzZWRvd25FdmVudHMpIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZXZlbnQud2hpY2ggIT09IHVuZGVmaW5lZCAmJiBldmVudC53aGljaCAhPT0gMSkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdHZhciB4ID0gZXZlbnQuY2xpZW50WDtcblx0XHRcdHZhciB5ID0gZXZlbnQuY2xpZW50WTtcblxuXHRcdFx0Ly8gVGhpcyB3aWxsIGJlIG51bGwgZm9yIG1vdXNlIGV2ZW50cy5cblx0XHRcdHZhciBwb2ludGVySWQgPSBldmVudC5wb2ludGVySWQ7XG5cblx0XHRcdHZhciBoYW5kbGVNb3VzZXVwID0gZnVuY3Rpb24gaGFuZGxlTW91c2V1cChldmVudCkge1xuXHRcdFx0XHRpZiAoZXZlbnQucG9pbnRlcklkICE9IHBvaW50ZXJJZCkge1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdF90aGlzLmZpcmUoZXZlbnQsIHgsIHkpO1xuXHRcdFx0XHRjYW5jZWwoKTtcblx0XHRcdH07XG5cblx0XHRcdHZhciBoYW5kbGVNb3VzZW1vdmUgPSBmdW5jdGlvbiBoYW5kbGVNb3VzZW1vdmUoZXZlbnQpIHtcblx0XHRcdFx0aWYgKGV2ZW50LnBvaW50ZXJJZCAhPSBwb2ludGVySWQpIHtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoTWF0aC5hYnMoZXZlbnQuY2xpZW50WCAtIHgpID49IERJU1RBTkNFX1RIUkVTSE9MRCB8fCBNYXRoLmFicyhldmVudC5jbGllbnRZIC0geSkgPj0gRElTVEFOQ0VfVEhSRVNIT0xEKSB7XG5cdFx0XHRcdFx0Y2FuY2VsKCk7XG5cdFx0XHRcdH1cblx0XHRcdH07XG5cblx0XHRcdHZhciBjYW5jZWwgPSBmdW5jdGlvbiBjYW5jZWwoKSB7XG5cdFx0XHRcdF90aGlzLm5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcignTVNQb2ludGVyVXAnLCBoYW5kbGVNb3VzZXVwLCBmYWxzZSk7XG5cdFx0XHRcdGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ01TUG9pbnRlck1vdmUnLCBoYW5kbGVNb3VzZW1vdmUsIGZhbHNlKTtcblx0XHRcdFx0ZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignTVNQb2ludGVyQ2FuY2VsJywgY2FuY2VsLCBmYWxzZSk7XG5cdFx0XHRcdF90aGlzLm5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcigncG9pbnRlcnVwJywgaGFuZGxlTW91c2V1cCwgZmFsc2UpO1xuXHRcdFx0XHRkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdwb2ludGVybW92ZScsIGhhbmRsZU1vdXNlbW92ZSwgZmFsc2UpO1xuXHRcdFx0XHRkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdwb2ludGVyY2FuY2VsJywgY2FuY2VsLCBmYWxzZSk7XG5cdFx0XHRcdF90aGlzLm5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVNb3VzZXVwLCBmYWxzZSk7XG5cdFx0XHRcdGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIGhhbmRsZU1vdXNlbW92ZSwgZmFsc2UpO1xuXHRcdFx0fTtcblxuXHRcdFx0aWYgKHdpbmRvdy5uYXZpZ2F0b3IucG9pbnRlckVuYWJsZWQpIHtcblx0XHRcdFx0dGhpcy5ub2RlLmFkZEV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJ1cCcsIGhhbmRsZU1vdXNldXAsIGZhbHNlKTtcblx0XHRcdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigncG9pbnRlcm1vdmUnLCBoYW5kbGVNb3VzZW1vdmUsIGZhbHNlKTtcblx0XHRcdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigncG9pbnRlcmNhbmNlbCcsIGNhbmNlbCwgZmFsc2UpO1xuXHRcdFx0fSBlbHNlIGlmICh3aW5kb3cubmF2aWdhdG9yLm1zUG9pbnRlckVuYWJsZWQpIHtcblx0XHRcdFx0dGhpcy5ub2RlLmFkZEV2ZW50TGlzdGVuZXIoJ01TUG9pbnRlclVwJywgaGFuZGxlTW91c2V1cCwgZmFsc2UpO1xuXHRcdFx0XHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdNU1BvaW50ZXJNb3ZlJywgaGFuZGxlTW91c2Vtb3ZlLCBmYWxzZSk7XG5cdFx0XHRcdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ01TUG9pbnRlckNhbmNlbCcsIGNhbmNlbCwgZmFsc2UpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhpcy5ub2RlLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlTW91c2V1cCwgZmFsc2UpO1xuXHRcdFx0XHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBoYW5kbGVNb3VzZW1vdmUsIGZhbHNlKTtcblx0XHRcdH1cblxuXHRcdFx0c2V0VGltZW91dChjYW5jZWwsIFRJTUVfVEhSRVNIT0xEKTtcblx0XHR9LFxuXHRcdHRvdWNoZG93bjogZnVuY3Rpb24gdG91Y2hkb3duKCkge1xuXHRcdFx0dmFyIF90aGlzMiA9IHRoaXM7XG5cblx0XHRcdHZhciB0b3VjaCA9IGV2ZW50LnRvdWNoZXNbMF07XG5cblx0XHRcdHZhciB4ID0gdG91Y2guY2xpZW50WDtcblx0XHRcdHZhciB5ID0gdG91Y2guY2xpZW50WTtcblxuXHRcdFx0dmFyIGZpbmdlciA9IHRvdWNoLmlkZW50aWZpZXI7XG5cblx0XHRcdHZhciBoYW5kbGVUb3VjaHVwID0gZnVuY3Rpb24gaGFuZGxlVG91Y2h1cChldmVudCkge1xuXHRcdFx0XHR2YXIgdG91Y2ggPSBldmVudC5jaGFuZ2VkVG91Y2hlc1swXTtcblxuXHRcdFx0XHRpZiAodG91Y2guaWRlbnRpZmllciAhPT0gZmluZ2VyKSB7XG5cdFx0XHRcdFx0Y2FuY2VsKCk7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTsgLy8gcHJldmVudCBjb21wYXRpYmlsaXR5IG1vdXNlIGV2ZW50XG5cblx0XHRcdFx0Ly8gZm9yIHRoZSBiZW5lZml0IG9mIG1vYmlsZSBGaXJlZm94IGFuZCBvbGQgQW5kcm9pZCBicm93c2Vycywgd2UgbmVlZCB0aGlzIGFic3VyZCBoYWNrLlxuXHRcdFx0XHRfdGhpczIucHJldmVudE1vdXNlZG93bkV2ZW50cyA9IHRydWU7XG5cdFx0XHRcdGNsZWFyVGltZW91dChfdGhpczIucHJldmVudE1vdXNlZG93blRpbWVvdXQpO1xuXG5cdFx0XHRcdF90aGlzMi5wcmV2ZW50TW91c2Vkb3duVGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdF90aGlzMi5wcmV2ZW50TW91c2Vkb3duRXZlbnRzID0gZmFsc2U7XG5cdFx0XHRcdH0sIDQwMCk7XG5cblx0XHRcdFx0X3RoaXMyLmZpcmUoZXZlbnQsIHgsIHkpO1xuXHRcdFx0XHRjYW5jZWwoKTtcblx0XHRcdH07XG5cblx0XHRcdHZhciBoYW5kbGVUb3VjaG1vdmUgPSBmdW5jdGlvbiBoYW5kbGVUb3VjaG1vdmUoZXZlbnQpIHtcblx0XHRcdFx0aWYgKGV2ZW50LnRvdWNoZXMubGVuZ3RoICE9PSAxIHx8IGV2ZW50LnRvdWNoZXNbMF0uaWRlbnRpZmllciAhPT0gZmluZ2VyKSB7XG5cdFx0XHRcdFx0Y2FuY2VsKCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR2YXIgdG91Y2ggPSBldmVudC50b3VjaGVzWzBdO1xuXHRcdFx0XHRpZiAoTWF0aC5hYnModG91Y2guY2xpZW50WCAtIHgpID49IERJU1RBTkNFX1RIUkVTSE9MRCB8fCBNYXRoLmFicyh0b3VjaC5jbGllbnRZIC0geSkgPj0gRElTVEFOQ0VfVEhSRVNIT0xEKSB7XG5cdFx0XHRcdFx0Y2FuY2VsKCk7XG5cdFx0XHRcdH1cblx0XHRcdH07XG5cblx0XHRcdHZhciBjYW5jZWwgPSBmdW5jdGlvbiBjYW5jZWwoKSB7XG5cdFx0XHRcdF90aGlzMi5ub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgaGFuZGxlVG91Y2h1cCwgZmFsc2UpO1xuXHRcdFx0XHR3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgaGFuZGxlVG91Y2htb3ZlLCBmYWxzZSk7XG5cdFx0XHRcdHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaGNhbmNlbCcsIGNhbmNlbCwgZmFsc2UpO1xuXHRcdFx0fTtcblxuXHRcdFx0dGhpcy5ub2RlLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgaGFuZGxlVG91Y2h1cCwgZmFsc2UpO1xuXHRcdFx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIGhhbmRsZVRvdWNobW92ZSwgZmFsc2UpO1xuXHRcdFx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoY2FuY2VsJywgY2FuY2VsLCBmYWxzZSk7XG5cblx0XHRcdHNldFRpbWVvdXQoY2FuY2VsLCBUSU1FX1RIUkVTSE9MRCk7XG5cdFx0fSxcblx0XHR0ZWFyZG93bjogZnVuY3Rpb24gdGVhcmRvd24oKSB7XG5cdFx0XHR2YXIgbm9kZSA9IHRoaXMubm9kZTtcblxuXHRcdFx0bm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKCdwb2ludGVyZG93bicsIGhhbmRsZU1vdXNlZG93biwgZmFsc2UpO1xuXHRcdFx0bm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKCdNU1BvaW50ZXJEb3duJywgaGFuZGxlTW91c2Vkb3duLCBmYWxzZSk7XG5cdFx0XHRub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIGhhbmRsZU1vdXNlZG93biwgZmFsc2UpO1xuXHRcdFx0bm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgaGFuZGxlVG91Y2hzdGFydCwgZmFsc2UpO1xuXHRcdFx0bm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKCdmb2N1cycsIGhhbmRsZUZvY3VzLCBmYWxzZSk7XG5cdFx0fVxuXHR9O1xuXG5cdGZ1bmN0aW9uIGhhbmRsZU1vdXNlZG93bihldmVudCkge1xuXHRcdHRoaXMuX190YXBfaGFuZGxlcl9fLm1vdXNlZG93bihldmVudCk7XG5cdH1cblxuXHRmdW5jdGlvbiBoYW5kbGVUb3VjaHN0YXJ0KGV2ZW50KSB7XG5cdFx0dGhpcy5fX3RhcF9oYW5kbGVyX18udG91Y2hkb3duKGV2ZW50KTtcblx0fVxuXG5cdGZ1bmN0aW9uIGhhbmRsZUZvY3VzKCkge1xuXHRcdHRoaXMuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGhhbmRsZUtleWRvd24sIGZhbHNlKTtcblx0XHR0aGlzLmFkZEV2ZW50TGlzdGVuZXIoJ2JsdXInLCBoYW5kbGVCbHVyLCBmYWxzZSk7XG5cdH1cblxuXHRmdW5jdGlvbiBoYW5kbGVCbHVyKCkge1xuXHRcdHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGhhbmRsZUtleWRvd24sIGZhbHNlKTtcblx0XHR0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2JsdXInLCBoYW5kbGVCbHVyLCBmYWxzZSk7XG5cdH1cblxuXHRmdW5jdGlvbiBoYW5kbGVLZXlkb3duKGV2ZW50KSB7XG5cdFx0aWYgKGV2ZW50LndoaWNoID09PSAzMikge1xuXHRcdFx0Ly8gc3BhY2Uga2V5XG5cdFx0XHR0aGlzLl9fdGFwX2hhbmRsZXJfXy5maXJlKCk7XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIHRhcDtcblxufSkpOyIsInZhciAkOyByZXF1aXJlKCcuL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIFJhY3RpdmVFdmVudHNUYXAgPSByZXF1aXJlKCcuL3JhY3RpdmUtZXZlbnRzLXRhcCcpO1xuXG52YXIgTWVzc2FnZXMgPSByZXF1aXJlKCcuL21lc3NhZ2VzJyk7XG5cbnZhciBub0NvbmZsaWN0O1xudmFyIGxvYWRlZFJhY3RpdmU7XG52YXIgY2FsbGJhY2tzID0gW107XG5cbi8vIENhcHR1cmUgYW55IGdsb2JhbCBpbnN0YW5jZSBvZiBSYWN0aXZlIHdoaWNoIGFscmVhZHkgZXhpc3RzIGJlZm9yZSB3ZSBsb2FkIG91ciBvd24uXG5mdW5jdGlvbiBhYm91dFRvTG9hZCgpIHtcbiAgICBub0NvbmZsaWN0ID0gd2luZG93LlJhY3RpdmU7XG59XG5cbi8vIFJlc3RvcmUgdGhlIGdsb2JhbCBpbnN0YW5jZSBvZiBSYWN0aXZlIChpZiBhbnkpIGFuZCBwYXNzIG91dCBvdXIgdmVyc2lvbiB0byBvdXIgY2FsbGJhY2tzXG5mdW5jdGlvbiBsb2FkZWQoKSB7XG4gICAgbG9hZGVkUmFjdGl2ZSA9IFJhY3RpdmU7XG4gICAgd2luZG93LlJhY3RpdmUgPSBub0NvbmZsaWN0O1xuICAgIGxvYWRlZFJhY3RpdmUuZGVjb3JhdG9ycy5jc3NyZXNldCA9IGNzc1Jlc2V0RGVjb3JhdG9yOyAvLyBNYWtlIG91ciBjc3MgcmVzZXQgZGVjb3JhdG9yIGF2YWlsYWJsZSB0byBhbGwgaW5zdGFuY2VzXG4gICAgbG9hZGVkUmFjdGl2ZS5ldmVudHMudGFwID0gUmFjdGl2ZUV2ZW50c1RhcDsgLy8gTWFrZSB0aGUgJ29uLXRhcCcgZXZlbnQgcGx1Z2luIGF2YWlsYWJsZSB0byBhbGwgaW5zdGFuY2VzXG4gICAgbG9hZGVkUmFjdGl2ZS5kZWZhdWx0cy5kYXRhLmdldE1lc3NhZ2UgPSBNZXNzYWdlcy5nZXRNZXNzYWdlOyAvLyBNYWtlIGdldE1lc3NhZ2UgYXZhaWxhYmxlIHRvIGFsbCBpbnN0YW5jZXNcbiAgICBsb2FkZWRSYWN0aXZlLmRlZmF1bHRzLnR3b3dheSA9IGZhbHNlOyAvLyBDaGFuZ2UgdGhlIGRlZmF1bHQgdG8gZGlzYWJsZSB0d28td2F5IGRhdGEgYmluZGluZ3MuXG4gICAgbm90aWZ5Q2FsbGJhY2tzKCk7XG59XG5cbmZ1bmN0aW9uIGNzc1Jlc2V0RGVjb3JhdG9yKG5vZGUpIHtcbiAgICB0YWdDaGlsZHJlbihub2RlLCAnYW50ZW5uYS1yZXNldCcpO1xuICAgIHJldHVybiB7IHRlYXJkb3duOiBmdW5jdGlvbigpIHt9IH07XG59XG5cbmZ1bmN0aW9uIHRhZ0NoaWxkcmVuKGVsZW1lbnQsIGNsYXp6KSB7XG4gICAgaWYgKGVsZW1lbnQuY2hpbGRyZW4pIHsgLy8gU2FmYXJpIHJldHVybnMgdW5kZWZpbmVkIHdoZW4gYXNraW5nIGZvciBjaGlsZHJlbiBvbiBhbiBTVkcgZWxlbWVudFxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGVsZW1lbnQuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHRhZ0NoaWxkcmVuKGVsZW1lbnQuY2hpbGRyZW5baV0sIGNsYXp6KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAkKGVsZW1lbnQpLmFkZENsYXNzKGNsYXp6KTtcbn1cblxuZnVuY3Rpb24gbm90aWZ5Q2FsbGJhY2tzKCkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2FsbGJhY2tzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNhbGxiYWNrc1tpXShsb2FkZWRSYWN0aXZlKTtcbiAgICB9XG4gICAgY2FsbGJhY2tzID0gW107XG59XG5cbi8vIFJlZ2lzdGVycyB0aGUgZ2l2ZW4gY2FsbGJhY2sgdG8gYmUgbm90aWZpZWQgd2hlbiBvdXIgdmVyc2lvbiBvZiBSYWN0aXZlIGlzIGxvYWRlZC5cbmZ1bmN0aW9uIG9uTG9hZChjYWxsYmFjaykge1xuICAgIGlmIChsb2FkZWRSYWN0aXZlKSB7XG4gICAgICAgIGNhbGxiYWNrKGxvYWRlZFJhY3RpdmUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGNhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKTtcbiAgICB9XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBhYm91dFRvTG9hZDogYWJvdXRUb0xvYWQsXG4gICAgbG9hZGVkOiBsb2FkZWQsXG4gICAgb25Mb2FkOiBvbkxvYWRcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgcmFuZ3k7IHJlcXVpcmUoJy4vcmFuZ3ktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24obG9hZGVkUmFuZ3kpIHsgcmFuZ3kgPSBsb2FkZWRSYW5neTsgfSk7XG5cbnZhciBoaWdobGlnaHRDbGFzcyA9ICdhbnRlbm5hLWhpZ2hsaWdodCc7XG52YXIgaGlnaGxpZ2h0ZWRSYW5nZXMgPSBbXTtcblxudmFyIGNsYXNzQXBwbGllcjtcbmZ1bmN0aW9uIGdldENsYXNzQXBwbGllcigpIHtcbiAgICBpZiAoIWNsYXNzQXBwbGllcikge1xuICAgICAgICBjbGFzc0FwcGxpZXIgPSByYW5neS5jcmVhdGVDbGFzc0FwcGxpZXIoaGlnaGxpZ2h0Q2xhc3MpO1xuICAgIH1cbiAgICByZXR1cm4gY2xhc3NBcHBsaWVyO1xufVxuXG4vLyBSZXR1cm5zIGFuIGFkanVzdGVkIGVuZCBwb2ludCBmb3IgdGhlIHNlbGVjdGlvbiB3aXRoaW4gdGhlIGdpdmVuIG5vZGUsIGFzIHRyaWdnZXJlZCBieSB0aGUgZ2l2ZW4gbW91c2UgdXAgZXZlbnQuXG4vLyBUaGUgcmV0dXJuZWQgcG9pbnQgKHgsIHkpIHRha2VzIGludG8gYWNjb3VudCB0aGUgbG9jYXRpb24gb2YgdGhlIG1vdXNlIHVwIGV2ZW50IGFzIHdlbGwgYXMgdGhlIGRpcmVjdGlvbiBvZiB0aGVcbi8vIHNlbGVjdGlvbiAoZm9yd2FyZC9iYWNrKS5cbmZ1bmN0aW9uIGdldFNlbGVjdGlvbkVuZFBvaW50KG5vZGUsIGV2ZW50LCBleGNsdWRlTm9kZSkge1xuICAgIC8vIFRPRE86IENvbnNpZGVyIHVzaW5nIHRoZSBlbGVtZW50IGNyZWF0ZWQgd2l0aCB0aGUgJ2NsYXNzaWZpZXInIHJhdGhlciB0aGFuIHRoZSBtb3VzZSBsb2NhdGlvblxuICAgIHZhciBzZWxlY3Rpb24gPSByYW5neS5nZXRTZWxlY3Rpb24oKTtcbiAgICBpZiAoaXNWYWxpZFNlbGVjdGlvbihzZWxlY3Rpb24sIG5vZGUsIGV4Y2x1ZGVOb2RlKSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgeDogZXZlbnQucGFnZVggLSAoIHNlbGVjdGlvbi5pc0JhY2t3YXJkcygpID8gLTUgOiA1KSxcbiAgICAgICAgICAgIHk6IGV2ZW50LnBhZ2VZIC0gOCAvLyBUT0RPOiBleGFjdCBjb29yZHNcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbn1cblxuLy8gQXR0ZW1wdHMgdG8gZ2V0IGEgcmFuZ2UgZnJvbSB0aGUgY3VycmVudCBzZWxlY3Rpb24uIFRoaXMgZXhwYW5kcyB0aGVcbi8vIHNlbGVjdGVkIHJlZ2lvbiB0byBpbmNsdWRlIHdvcmQgYm91bmRhcmllcy5cbmZ1bmN0aW9uIGdyYWJTZWxlY3Rpb24obm9kZSwgY2FsbGJhY2ssIGV4Y2x1ZGVOb2RlKSB7XG4gICAgdmFyIHNlbGVjdGlvbiA9IHJhbmd5LmdldFNlbGVjdGlvbigpO1xuICAgIGlmIChpc1ZhbGlkU2VsZWN0aW9uKHNlbGVjdGlvbiwgbm9kZSwgZXhjbHVkZU5vZGUpKSB7XG4gICAgICAgIHNlbGVjdGlvbi5leHBhbmQoJ3dvcmQnLCB7IHRyaW06IHRydWUgfSk7XG4gICAgICAgIGlmIChzZWxlY3Rpb24uY29udGFpbnNOb2RlKGV4Y2x1ZGVOb2RlKSkge1xuICAgICAgICAgICAgdmFyIHJhbmdlID0gc2VsZWN0aW9uLmdldFJhbmdlQXQoMCk7XG4gICAgICAgICAgICByYW5nZS5zZXRFbmRCZWZvcmUoZXhjbHVkZU5vZGUpO1xuICAgICAgICAgICAgc2VsZWN0aW9uLnNldFNpbmdsZVJhbmdlKHJhbmdlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaXNWYWxpZFNlbGVjdGlvbihzZWxlY3Rpb24sIG5vZGUsIGV4Y2x1ZGVOb2RlKSkge1xuICAgICAgICAgICAgdmFyIGxvY2F0aW9uID0gcmFuZ3kuc2VyaWFsaXplU2VsZWN0aW9uKHNlbGVjdGlvbiwgdHJ1ZSwgbm9kZSk7XG4gICAgICAgICAgICB2YXIgdGV4dCA9IHNlbGVjdGlvbi50b1N0cmluZygpO1xuICAgICAgICAgICAgaGlnaGxpZ2h0U2VsZWN0aW9uKHNlbGVjdGlvbik7IC8vIEhpZ2hsaWdodGluZyBkZXNlbGVjdHMgdGhlIHRleHQsIHNvIGRvIHRoaXMgbGFzdC5cbiAgICAgICAgICAgIGNhbGxiYWNrKHRleHQsIGxvY2F0aW9uKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gaXNWYWxpZFNlbGVjdGlvbihzZWxlY3Rpb24sIG5vZGUsIGV4Y2x1ZGVOb2RlKSB7XG4gICAgcmV0dXJuICFzZWxlY3Rpb24uaXNDb2xsYXBzZWQgJiYgIC8vIE5vbi1lbXB0eSBzZWxlY3Rpb25cbiAgICAgICAgc2VsZWN0aW9uLnJhbmdlQ291bnQgPT09IDEgJiYgLy8gU2luZ2xlIHNlbGVjdGlvblxuICAgICAgICAoIWV4Y2x1ZGVOb2RlIHx8ICFzZWxlY3Rpb24uY29udGFpbnNOb2RlKGV4Y2x1ZGVOb2RlLCB0cnVlKSkgJiYgLy8gU2VsZWN0aW9uIGRvZXNuJ3QgY29udGFpbiBhbnl0aGluZyB3ZSd2ZSBzYWlkIHdlIGRvbid0IHdhbnQgKGUuZy4gdGhlIGluZGljYXRvcilcbiAgICAgICAgbm9kZS5jb250YWlucyhzZWxlY3Rpb24uZ2V0UmFuZ2VBdCgwKS5jb21tb25BbmNlc3RvckNvbnRhaW5lcik7IC8vIFNlbGVjdGlvbiBpcyBjb250YWluZWQgZW50aXJlbHkgd2l0aGluIHRoZSBub2RlXG59XG5cbmZ1bmN0aW9uIGdyYWJOb2RlKG5vZGUsIGNhbGxiYWNrKSB7XG4gICAgdmFyIHJhbmdlID0gcmFuZ3kuY3JlYXRlUmFuZ2UoZG9jdW1lbnQpO1xuICAgIHJhbmdlLnNlbGVjdE5vZGVDb250ZW50cyhub2RlKTtcbiAgICB2YXIgJGV4Y2x1ZGVkID0gJChub2RlKS5maW5kKCcuYW50ZW5uYS10ZXh0LWluZGljYXRvci13aWRnZXQnKTtcbiAgICBpZiAoJGV4Y2x1ZGVkLnNpemUoKSA+IDApIHsgLy8gUmVtb3ZlIHRoZSBpbmRpY2F0b3IgZnJvbSB0aGUgZW5kIG9mIHRoZSBzZWxlY3RlZCByYW5nZS5cbiAgICAgICAgcmFuZ2Uuc2V0RW5kQmVmb3JlKCRleGNsdWRlZC5nZXQoMCkpO1xuICAgIH1cbiAgICB2YXIgc2VsZWN0aW9uID0gcmFuZ3kuZ2V0U2VsZWN0aW9uKCk7XG4gICAgc2VsZWN0aW9uLnNldFNpbmdsZVJhbmdlKHJhbmdlKTtcbiAgICB2YXIgbG9jYXRpb24gPSByYW5neS5zZXJpYWxpemVTZWxlY3Rpb24oc2VsZWN0aW9uLCB0cnVlLCBub2RlKTtcbiAgICB2YXIgdGV4dCA9IHNlbGVjdGlvbi50b1N0cmluZygpO1xuICAgIGlmICh0ZXh0LnRyaW0oKS5sZW5ndGggPiAwKSB7XG4gICAgICAgIGhpZ2hsaWdodFNlbGVjdGlvbihzZWxlY3Rpb24pOyAvLyBIaWdobGlnaHRpbmcgZGVzZWxlY3RzIHRoZSB0ZXh0LCBzbyBkbyB0aGlzIGxhc3QuXG4gICAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICAgICAgY2FsbGJhY2sodGV4dCwgbG9jYXRpb24pO1xuICAgICAgICB9XG4gICAgfVxuICAgIHNlbGVjdGlvbi5yZW1vdmVBbGxSYW5nZXMoKTsgLy8gRG9uJ3QgYWN0dWFsbHkgbGVhdmUgdGhlIGVsZW1lbnQgc2VsZWN0ZWQuXG4gICAgc2VsZWN0aW9uLnJlZnJlc2goKTtcbn1cblxuLy8gSGlnaGxpZ2h0cyB0aGUgZ2l2ZW4gbG9jYXRpb24gaW5zaWRlIHRoZSBnaXZlbiBub2RlLlxuZnVuY3Rpb24gaGlnaGxpZ2h0TG9jYXRpb24obm9kZSwgbG9jYXRpb24pIHtcbiAgICAvLyBUT0RPIGVycm9yIGhhbmRsaW5nIGluIGNhc2UgdGhlIHJhbmdlIGlzIG5vdCB2YWxpZD9cbiAgICBpZiAocmFuZ3kuY2FuRGVzZXJpYWxpemVSYW5nZShsb2NhdGlvbiwgbm9kZSwgZG9jdW1lbnQpKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB2YXIgcmFuZ2UgPSByYW5neS5kZXNlcmlhbGl6ZVJhbmdlKGxvY2F0aW9uLCBub2RlLCBkb2N1bWVudCk7XG4gICAgICAgICAgICBoaWdobGlnaHRSYW5nZShyYW5nZSk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAvLyBUT0RPOiBDb25zaWRlciBsb2dnaW5nIHNvbWUga2luZCBvZiBldmVudCBzZXJ2ZXItc2lkZT9cbiAgICAgICAgICAgIC8vIFRPRE86IENvbnNpZGVyIGhpZ2hsaWdodGluZyB0aGUgd2hvbGUgbm9kZT8gT3IgaXMgaXQgYmV0dGVyIHRvIGp1c3QgaGlnaGxpZ2h0IG5vdGhpbmc/XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGhpZ2hsaWdodFNlbGVjdGlvbihzZWxlY3Rpb24pIHtcbiAgICBoaWdobGlnaHRSYW5nZShzZWxlY3Rpb24uZ2V0UmFuZ2VBdCgwKSk7XG59XG5cbmZ1bmN0aW9uIGhpZ2hsaWdodFJhbmdlKHJhbmdlKSB7XG4gICAgZ2V0Q2xhc3NBcHBsaWVyKCkuYXBwbHlUb1JhbmdlKHJhbmdlKTtcbiAgICBoaWdobGlnaHRlZFJhbmdlcy5wdXNoKHJhbmdlKTtcbn1cblxuLy8gQ2xlYXJzIGFsbCBoaWdobGlnaHRzIHRoYXQgaGF2ZSBiZWVuIGNyZWF0ZWQgb24gdGhlIHBhZ2UuXG5mdW5jdGlvbiBjbGVhckhpZ2hsaWdodHMoKSB7XG4gICAgdmFyIGNsYXNzQXBwbGllciA9IGdldENsYXNzQXBwbGllcigpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaGlnaGxpZ2h0ZWRSYW5nZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIHJhbmdlID0gaGlnaGxpZ2h0ZWRSYW5nZXNbaV07XG4gICAgICAgIGlmIChjbGFzc0FwcGxpZXIuaXNBcHBsaWVkVG9SYW5nZShyYW5nZSkpIHtcbiAgICAgICAgICAgIGNsYXNzQXBwbGllci51bmRvVG9SYW5nZShyYW5nZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaGlnaGxpZ2h0ZWRSYW5nZXMgPSBbXTtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGdldFNlbGVjdGlvbkVuZFBvaW50OiBnZXRTZWxlY3Rpb25FbmRQb2ludCxcbiAgICBncmFiU2VsZWN0aW9uOiBncmFiU2VsZWN0aW9uLFxuICAgIGdyYWJOb2RlOiBncmFiTm9kZSxcbiAgICBjbGVhckhpZ2hsaWdodHM6IGNsZWFySGlnaGxpZ2h0cyxcbiAgICBoaWdobGlnaHQ6IGhpZ2hsaWdodExvY2F0aW9uXG59OyIsIlxudmFyIG5vQ29uZmxpY3Q7XG52YXIgbG9hZGVkUmFuZ3k7XG52YXIgY2FsbGJhY2tzID0gW107XG5cbi8vIENhcHR1cmUgYW55IGdsb2JhbCBpbnN0YW5jZSBvZiByYW5neSB3aGljaCBhbHJlYWR5IGV4aXN0cyBiZWZvcmUgd2UgbG9hZCBvdXIgb3duLlxuZnVuY3Rpb24gYWJvdXRUb0xvYWQoKSB7XG4gICAgbm9Db25mbGljdCA9IHdpbmRvdy5yYW5neTtcbn1cblxuLy8gUmVzdG9yZSB0aGUgZ2xvYmFsIGluc3RhbmNlIG9mIHJhbmd5IChpZiBhbnkpIGFuZCBwYXNzIG91dCBvdXIgdmVyc2lvbiB0byBvdXIgY2FsbGJhY2tzXG5mdW5jdGlvbiBsb2FkZWQoKSB7XG4gICAgbG9hZGVkUmFuZ3kgPSByYW5neTtcbiAgICBsb2FkZWRSYW5neS5pbml0KCk7XG4gICAgd2luZG93LnJhbmd5ID0gbm9Db25mbGljdDtcbiAgICBub3RpZnlDYWxsYmFja3MoKTtcbn1cblxuZnVuY3Rpb24gbm90aWZ5Q2FsbGJhY2tzKCkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2FsbGJhY2tzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNhbGxiYWNrc1tpXShsb2FkZWRSYW5neSk7XG4gICAgfVxuICAgIGNhbGxiYWNrcyA9IFtdO1xufVxuXG4vLyBSZWdpc3RlcnMgdGhlIGdpdmVuIGNhbGxiYWNrIHRvIGJlIG5vdGlmaWVkIHdoZW4gb3VyIHZlcnNpb24gb2YgUmFuZ3kgaXMgbG9hZGVkLlxuZnVuY3Rpb24gb25Mb2FkKGNhbGxiYWNrKSB7XG4gICAgaWYgKGxvYWRlZFJhbmd5KSB7XG4gICAgICAgIGNhbGxiYWNrKGxvYWRlZFJhbmd5KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBjYWxsYmFja3MucHVzaChjYWxsYmFjayk7XG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgYWJvdXRUb0xvYWQ6IGFib3V0VG9Mb2FkLFxuICAgIGxvYWRlZDogbG9hZGVkLFxuICAgIG9uTG9hZDogb25Mb2FkXG59OyIsInZhciAkOyByZXF1aXJlKCcuL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xuXG52YXIgQ0xBU1NfRlVMTCA9ICdhbnRlbm5hLWZ1bGwnO1xudmFyIENMQVNTX0hBTEYgPSAnYW50ZW5uYS1oYWxmJztcblxuZnVuY3Rpb24gY29tcHV0ZUxheW91dERhdGEocmVhY3Rpb25zRGF0YSkge1xuICAgIHZhciBudW1SZWFjdGlvbnMgPSByZWFjdGlvbnNEYXRhLmxlbmd0aDtcbiAgICBpZiAobnVtUmVhY3Rpb25zID09IDApIHtcbiAgICAgICAgcmV0dXJuIHt9OyAvLyBUT0RPIGNsZWFuIHRoaXMgdXBcbiAgICB9XG4gICAgLy8gVE9ETzogQ29waWVkIGNvZGUgZnJvbSBlbmdhZ2VfZnVsbC5jcmVhdGVUYWdCdWNrZXRzXG4gICAgdmFyIG1heCA9IHJlYWN0aW9uc0RhdGFbMF0uY291bnQ7XG4gICAgdmFyIG1lZGlhbiA9IHJlYWN0aW9uc0RhdGFbIE1hdGguZmxvb3IocmVhY3Rpb25zRGF0YS5sZW5ndGgvMikgXS5jb3VudDtcbiAgICB2YXIgbWluID0gcmVhY3Rpb25zRGF0YVsgcmVhY3Rpb25zRGF0YS5sZW5ndGgtMSBdLmNvdW50O1xuICAgIHZhciB0b3RhbCA9IDA7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBudW1SZWFjdGlvbnM7IGkrKykge1xuICAgICAgICB0b3RhbCArPSByZWFjdGlvbnNEYXRhW2ldLmNvdW50O1xuICAgIH1cbiAgICB2YXIgYXZlcmFnZSA9IE1hdGguZmxvb3IodG90YWwgLyBudW1SZWFjdGlvbnMpO1xuICAgIHZhciBtaWRWYWx1ZSA9ICggbWVkaWFuID4gYXZlcmFnZSApID8gbWVkaWFuIDogYXZlcmFnZTtcblxuICAgIHZhciBsYXlvdXRDbGFzc2VzID0gW107XG4gICAgdmFyIG51bUhhbGZzaWVzID0gMDtcbiAgICB2YXIgbnVtRnVsbCA9IDA7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBudW1SZWFjdGlvbnM7IGkrKykge1xuICAgICAgICBpZiAocmVhY3Rpb25zRGF0YVtpXS5jb3VudCA+IG1pZFZhbHVlKSB7XG4gICAgICAgICAgICBsYXlvdXRDbGFzc2VzW2ldID0gQ0xBU1NfRlVMTDtcbiAgICAgICAgICAgIG51bUZ1bGwrKztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGxheW91dENsYXNzZXNbaV0gPSBDTEFTU19IQUxGO1xuICAgICAgICAgICAgbnVtSGFsZnNpZXMrKztcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAobnVtSGFsZnNpZXMgJSAyICE9PTApIHtcbiAgICAgICAgbGF5b3V0Q2xhc3Nlc1tudW1SZWFjdGlvbnMgLSAxXSA9IENMQVNTX0ZVTEw7IC8vIElmIHRoZXJlIGFyZSBhbiBvZGQgbnVtYmVyLCB0aGUgbGFzdCBvbmUgZ29lcyBmdWxsLlxuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIGxheW91dENsYXNzZXM6IGxheW91dENsYXNzZXNcbiAgICB9O1xufVxuXG5mdW5jdGlvbiBzaXplUmVhY3Rpb25UZXh0VG9GaXQoJHJlYWN0aW9uc1dpbmRvdykge1xuICAgIHJldHVybiBmdW5jdGlvbiBzaXplUmVhY3Rpb25UZXh0VG9GaXQobm9kZSkge1xuICAgICAgICB2YXIgJGVsZW1lbnQgPSAkKG5vZGUpO1xuICAgICAgICB2YXIgb3JpZ2luYWxEaXNwbGF5ID0gJHJlYWN0aW9uc1dpbmRvdy5jc3MoJ2Rpc3BsYXknKTtcbiAgICAgICAgaWYgKG9yaWdpbmFsRGlzcGxheSA9PT0gJ25vbmUnKSB7IC8vIElmIHdlJ3JlIHNpemluZyB0aGUgYm94ZXMgYmVmb3JlIHRoZSB3aWRnZXQgaXMgZGlzcGxheWVkLCB0ZW1wb3JhcmlseSBkaXNwbGF5IGl0IG9mZnNjcmVlbi5cbiAgICAgICAgICAgICRyZWFjdGlvbnNXaW5kb3cuY3NzKHtkaXNwbGF5OiAnYmxvY2snLCBsZWZ0OiAnMTAwJSd9KTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgaG9yaXpvbnRhbFJhdGlvID0gbm9kZS5jbGllbnRXaWR0aCAvIG5vZGUuc2Nyb2xsV2lkdGg7XG4gICAgICAgIGlmIChob3Jpem9udGFsUmF0aW8gPCAxLjApIHsgLy8gSWYgdGhlIHRleHQgZG9lc24ndCBmaXQsIGZpcnN0IHRyeSB0byB3cmFwIGl0IHRvIHR3byBsaW5lcy4gVGhlbiBzY2FsZSBpdCBkb3duIGlmIHN0aWxsIG5lY2Vzc2FyeS5cbiAgICAgICAgICAgIHZhciB0ZXh0ID0gbm9kZS5pbm5lckhUTUw7XG4gICAgICAgICAgICB2YXIgbWlkID0gTWF0aC5jZWlsKHRleHQubGVuZ3RoIC8gMik7IC8vIExvb2sgZm9yIHRoZSBjbG9zZXN0IHNwYWNlIHRvIHRoZSBtaWRkbGUsIHdlaWdodGVkIHNsaWdodGx5IChNYXRoLmNlaWwpIHRvd2FyZCBhIHNwYWNlIGluIHRoZSBzZWNvbmQgaGFsZi5cbiAgICAgICAgICAgIHZhciBzZWNvbmRIYWxmSW5kZXggPSB0ZXh0LmluZGV4T2YoJyAnLCBtaWQpO1xuICAgICAgICAgICAgdmFyIGZpcnN0SGFsZkluZGV4ID0gdGV4dC5sYXN0SW5kZXhPZignICcsIG1pZCk7XG4gICAgICAgICAgICB2YXIgc3BsaXRJbmRleCA9IE1hdGguYWJzKHNlY29uZEhhbGZJbmRleCAtIG1pZCkgPCBNYXRoLmFicyhtaWQgLSBmaXJzdEhhbGZJbmRleCkgPyBzZWNvbmRIYWxmSW5kZXggOiBmaXJzdEhhbGZJbmRleDtcbiAgICAgICAgICAgIHZhciB2ZXJ0aWNhbFJhdGlvO1xuICAgICAgICAgICAgaWYgKHNwbGl0SW5kZXggPiAxKSB7XG4gICAgICAgICAgICAgICAgLy8gU3BsaXQgdGhlIHRleHQgYW5kIHRoZW4gc2VlIGhvdyBpdCBmaXRzLlxuICAgICAgICAgICAgICAgIG5vZGUuaW5uZXJIVE1MID0gdGV4dC5zbGljZSgwLCBzcGxpdEluZGV4KSArICc8YnI+JyArIHRleHQuc2xpY2Uoc3BsaXRJbmRleCk7XG4gICAgICAgICAgICAgICAgdmFyIHdyYXBwZWRIb3Jpem9udGFsUmF0aW8gPSBub2RlLmNsaWVudFdpZHRoIC8gbm9kZS5zY3JvbGxXaWR0aDtcbiAgICAgICAgICAgICAgICB2YXIgcGFyZW50QXZhaWxhYmxlSGVpZ2h0ID0gY29tcHV0ZUF2YWlsYWJsZUNsaWVudEFyZWEobm9kZS5wYXJlbnROb2RlKTtcbiAgICAgICAgICAgICAgICB2ZXJ0aWNhbFJhdGlvID0gbm9kZS5zY3JvbGxIZWlnaHQgLyBwYXJlbnRBdmFpbGFibGVIZWlnaHQ7XG5cbiAgICAgICAgICAgICAgICB2YXIgdmVydGljYWxSYXRpb01heCA9IDAuNDtcbiAgICAgICAgICAgICAgICBpZiAodmVydGljYWxSYXRpbyAmJiB2ZXJ0aWNhbFJhdGlvID4gdmVydGljYWxSYXRpb01heCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgc2NhbGVGYWN0b3IgPSB2ZXJ0aWNhbFJhdGlvTWF4IC8gdmVydGljYWxSYXRpbztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHdyYXBwZWRIb3Jpem9udGFsUmF0aW8gPCAxLjApIHtcbiAgICAgICAgICAgICAgICAgICAgc2NhbGVGYWN0b3IgPSBNYXRoLm1pbihzY2FsZUZhY3Rvciwgd3JhcHBlZEhvcml6b250YWxSYXRpbyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChzY2FsZUZhY3RvciA8PSBob3Jpem9udGFsUmF0aW8pIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gSWYgd2UgZW5kZWQgdXAgaGF2aW5nIHRvIG1ha2UgdGhlIHRleHQgc21hbGxcbiAgICAgICAgICAgICAgICAgICAgbm9kZS5pbm5lckhUTUwgPSB0ZXh0O1xuICAgICAgICAgICAgICAgICAgICBzY2FsZUZhY3RvciA9IGhvcml6b250YWxSYXRpbztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgJGVsZW1lbnQuY3NzKCdmb250LXNpemUnLCBNYXRoLm1heCgxMCwgTWF0aC5mbG9vcihwYXJzZUludCgkZWxlbWVudC5jc3MoJ2ZvbnQtc2l6ZScpKSAqIHNjYWxlRmFjdG9yKSAtIDEpKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgJGVsZW1lbnQuY3NzKCdmb250LXNpemUnLCBNYXRoLm1heCgxMCwgTWF0aC5mbG9vcihwYXJzZUludCgkZWxlbWVudC5jc3MoJ2ZvbnQtc2l6ZScpKSAqIGhvcml6b250YWxSYXRpbykgLSAxKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9yaWdpbmFsRGlzcGxheSA9PT0gJ25vbmUnKSB7XG4gICAgICAgICAgICAkcmVhY3Rpb25zV2luZG93LmNzcyh7ZGlzcGxheTogJycsIGxlZnQ6ICcnfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHRlYXJkb3duOiBmdW5jdGlvbigpIHt9XG4gICAgICAgIH07XG4gICAgfTtcbn1cblxuZnVuY3Rpb24gY29tcHV0ZUF2YWlsYWJsZUNsaWVudEFyZWEobm9kZSkge1xuICAgIHZhciBub2RlU3R5bGUgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShub2RlKTtcbiAgICByZXR1cm4gcGFyc2VJbnQobm9kZVN0eWxlLmhlaWdodCkgLSBwYXJzZUludChub2RlU3R5bGUucGFkZGluZ1RvcCkgLSBwYXJzZUludChub2RlU3R5bGUucGFkZGluZ0JvdHRvbSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHNpemVUb0ZpdDogc2l6ZVJlYWN0aW9uVGV4dFRvRml0LFxuICAgIGNvbXB1dGVMYXlvdXREYXRhOiBjb21wdXRlTGF5b3V0RGF0YVxufTsiLCJ2YXIgQ2FsbGJhY2tTdXBwb3J0ID0gcmVxdWlyZSgnLi9jYWxsYmFjay1zdXBwb3J0Jyk7XG5cbi8vIFRoaXMgbW9kdWxlIGFsbG93cyB1cyB0byByZWdpc3RlciBjYWxsYmFja3MgdGhhdCBhcmUgdGhyb3R0bGVkIGluIHRoZWlyIGZyZXF1ZW5jeS4gVGhpcyBpcyB1c2VmdWwgZm9yIGV2ZW50cyBsaWtlXG4vLyByZXNpemUgYW5kIHNjcm9sbCwgd2hpY2ggY2FuIGJlIGZpcmVkIGF0IGFuIGV4dHJlbWVseSBoaWdoIHJhdGUuXG5cbnZhciB0aHJvdHRsZWRMaXN0ZW5lcnMgPSB7fTtcblxuZnVuY3Rpb24gb24odHlwZSwgY2FsbGJhY2spIHtcbiAgICB0aHJvdHRsZWRMaXN0ZW5lcnNbdHlwZV0gPSB0aHJvdHRsZWRMaXN0ZW5lcnNbdHlwZV0gfHwgY3JlYXRlVGhyb3R0bGVkTGlzdGVuZXIodHlwZSk7XG4gICAgdGhyb3R0bGVkTGlzdGVuZXJzW3R5cGVdLmFkZENhbGxiYWNrKGNhbGxiYWNrKTtcbn1cblxuZnVuY3Rpb24gb2ZmKHR5cGUsIGNhbGxiYWNrKSB7XG4gICAgdmFyIGV2ZW50TGlzdGVuZXIgPSB0aHJvdHRsZWRMaXN0ZW5lcnNbdHlwZV07XG4gICAgaWYgKGV2ZW50TGlzdGVuZXIpIHtcbiAgICAgICAgZXZlbnRMaXN0ZW5lci5yZW1vdmVDYWxsYmFjayhjYWxsYmFjayk7XG4gICAgICAgIGlmIChldmVudExpc3RlbmVyLmlzRW1wdHkoKSkge1xuICAgICAgICAgICAgZXZlbnRMaXN0ZW5lci50ZWFyZG93bigpO1xuICAgICAgICAgICAgZGVsZXRlIHRocm90dGxlZExpc3RlbmVyc1t0eXBlXTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLy8gQ3JlYXRlcyBhIGxpc3RlbmVyIG9uIHRoZSBwYXJ0aWN1bGFyIGV2ZW50IHR5cGUuIENhbGxiYWNrcyBhZGRlZCB0byB0aGlzIGxpc3RlbmVyIHdpbGwgYmUgdGhyb3R0bGVkLlxuZnVuY3Rpb24gY3JlYXRlVGhyb3R0bGVkTGlzdGVuZXIodHlwZSkge1xuICAgIHZhciBjYWxsYmFja3MgPSBDYWxsYmFja1N1cHBvcnQuY3JlYXRlKCk7XG4gICAgdmFyIGV2ZW50VGltZW91dDtcbiAgICBzZXR1cCgpO1xuICAgIHJldHVybiB7XG4gICAgICAgIGFkZENhbGxiYWNrOiBjYWxsYmFja3MuYWRkLFxuICAgICAgICByZW1vdmVDYWxsYmFjazogY2FsbGJhY2tzLnJlbW92ZSxcbiAgICAgICAgaXNFbXB0eTogY2FsbGJhY2tzLmlzRW1wdHksXG4gICAgICAgIHRlYXJkb3duOiB0ZWFyZG93blxuICAgIH07XG5cbiAgICBmdW5jdGlvbiBoYW5kbGVFdmVudCgpIHtcbiAgICAgICBpZiAoIWV2ZW50VGltZW91dCkge1xuICAgICAgICAgICBldmVudFRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgY2FsbGJhY2tzLmludm9rZUFsbCgpO1xuICAgICAgICAgICAgICAgZXZlbnRUaW1lb3V0ID0gbnVsbDtcbiAgICAgICAgICAgfSwgNjYpOyAvLyAxNSBGUFNcbiAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2V0dXAoKSB7XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKHR5cGUsIGhhbmRsZUV2ZW50KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB0ZWFyZG93bigpIHtcbiAgICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIodHlwZSwgaGFuZGxlRXZlbnQpO1xuICAgIH1cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIG9uOiBvbixcbiAgICBvZmY6IG9mZlxufTsiLCJcbi8vIFNldHMgdXAgdGhlIGdpdmVuIGVsZW1lbnQgdG8gYmUgY2FsbGVkIHdpdGggYSBUb3VjaEV2ZW50IHRoYXQgd2UgcmVjb2duaXplIGFzIGEgdGFwLlxuZnVuY3Rpb24gc2V0dXBUb3VjaFRhcEV2ZW50cyhlbGVtZW50LCBjYWxsYmFjaykge1xuICAgIHZhciB0aW1lb3V0ID0gNDAwOyAvLyBUaGlzIGlzIHRoZSB0aW1lIGJldHdlZW4gdG91Y2hzdGFydCBhbmQgdG91Y2hlbmQgdGhhdCB3ZSB1c2UgdG8gZGlzdGluZ3Vpc2ggYSB0YXAgZnJvbSBhIGxvbmcgcHJlc3MuXG4gICAgdmFyIHZhbGlkVGFwID0gZmFsc2U7XG4gICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdG91Y2hTdGFydCk7XG4gICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCB0b3VjaE1vdmUpO1xuICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hjYW5jZWwnLCB0b3VjaENhbmNlbCk7XG4gICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIHRvdWNoRW5kKTtcbiAgICByZXR1cm4ge1xuICAgICAgICB0ZWFyZG93bjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0b3VjaFN0YXJ0KTtcbiAgICAgICAgICAgIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgdG91Y2hNb3ZlKTtcbiAgICAgICAgICAgIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hjYW5jZWwnLCB0b3VjaENhbmNlbCk7XG4gICAgICAgICAgICBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgdG91Y2hFbmQpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIHRvdWNoU3RhcnQoZXZlbnQpIHtcbiAgICAgICAgdmFsaWRUYXAgPSB0cnVlO1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFsaWRUYXAgPSBmYWxzZTtcbiAgICAgICAgfSwgdGltZW91dCk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHRvdWNoRW5kKGV2ZW50KSB7XG4gICAgICAgIGlmICh2YWxpZFRhcCAmJiBldmVudC5jaGFuZ2VkVG91Y2hlcy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKGV2ZW50KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiB0b3VjaE1vdmUoZXZlbnQpIHtcbiAgICAgICAgdmFsaWRUYXAgPSBmYWxzZTtcbiAgICB9XG4gICAgZnVuY3Rpb24gdG91Y2hDYW5jZWwoZXZlbnQpIHtcbiAgICAgICAgdmFsaWRUYXAgPSBmYWxzZTtcbiAgICB9XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBzZXR1cFRhcDogc2V0dXBUb3VjaFRhcEV2ZW50c1xufTsiLCJcblxuZnVuY3Rpb24gdG9nZ2xlVHJhbnNpdGlvbkNsYXNzKCRlbGVtZW50LCBjbGFzc05hbWUsIHN0YXRlLCBuZXh0U3RlcCkge1xuICAgICRlbGVtZW50Lm9uKFwidHJhbnNpdGlvbmVuZCB3ZWJraXRUcmFuc2l0aW9uRW5kIG9UcmFuc2l0aW9uRW5kIE1TVHJhbnNpdGlvbkVuZFwiLFxuICAgICAgICBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgLy8gb25jZSB0aGUgQ1NTIHRyYW5zaXRpb24gaXMgY29tcGxldGUsIGNhbGwgb3VyIG5leHQgc3RlcFxuICAgICAgICAgICAgLy8gU2VlOiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzkyNTUyNzkvY2FsbGJhY2std2hlbi1jc3MzLXRyYW5zaXRpb24tZmluaXNoZXNcbiAgICAgICAgICAgIGlmIChldmVudC50YXJnZXQgPT0gZXZlbnQuY3VycmVudFRhcmdldCkge1xuICAgICAgICAgICAgICAgICRlbGVtZW50Lm9mZihcInRyYW5zaXRpb25lbmQgd2Via2l0VHJhbnNpdGlvbkVuZCBvVHJhbnNpdGlvbkVuZCBNU1RyYW5zaXRpb25FbmRcIik7XG4gICAgICAgICAgICAgICAgaWYgKG5leHRTdGVwKSB7XG4gICAgICAgICAgICAgICAgICAgIG5leHRTdGVwKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgKTtcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBUaGlzIHdvcmthcm91bmQgZ2V0cyB1cyBjb25zaXN0ZW50IHRyYW5zaXRpb25lbmQgZXZlbnRzLCB3aGljaCBjYW4gb3RoZXJ3aXNlIGJlIGZsYWt5IGlmIHdlJ3JlIHNldHRpbmcgb3RoZXJcbiAgICAgICAgLy8gY2xhc3NlcyBhdCB0aGUgc2FtZSB0aW1lIGFzIHRyYW5zaXRpb24gY2xhc3Nlcy5cbiAgICAgICAgJGVsZW1lbnQudG9nZ2xlQ2xhc3MoY2xhc3NOYW1lLCBzdGF0ZSk7XG4gICAgfSwgMjApO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICB0b2dnbGVDbGFzczogdG9nZ2xlVHJhbnNpdGlvbkNsYXNzXG59OyIsInZhciBQUk9EX1NFUlZFUl9VUkwgPSBcImh0dHBzOi8vd3d3LmFudGVubmEuaXNcIjsgLy8gVE9ETzogd3d3PyBob3cgYWJvdXQgYW50ZW5uYS5pcyBvciBhcGkuYW50ZW5uYS5pcz9cbnZhciBERVZfU0VSVkVSX1VSTCA9IHdpbmRvdy5sb2NhdGlvbi5wcm90b2NvbCArIFwiLy9sb2NhbC1zdGF0aWMuYW50ZW5uYS5pczo4MDgxXCI7XG52YXIgVEVTVF9TRVJWRVJfVVJMID0gd2luZG93LmxvY2F0aW9uLnByb3RvY29sICsgJy8vbG9jYWxob3N0OjMwMDAnO1xuXG52YXIgUFJPRF9FVkVOVF9TRVJWRVJfVVJMID0gd2luZG93LmxvY2F0aW9uLnByb3RvY29sICsgJy8vZXZlbnRzLnJlYWRyYm9hcmQuY29tJztcbnZhciBERVZfRVZFTlRfU0VSVkVSX1VSTCA9IHdpbmRvdy5sb2NhdGlvbi5wcm90b2NvbCArICcvL25vZGVicS5kb2NrZXI6MzAwMCc7XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBQUk9EVUNUSU9OOiBQUk9EX1NFUlZFUl9VUkwsXG4gICAgREVWRUxPUE1FTlQ6IERFVl9TRVJWRVJfVVJMLFxuICAgIFRFU1Q6IFRFU1RfU0VSVkVSX1VSTCxcbiAgICBQUk9EVUNUSU9OX0VWRU5UUzogUFJPRF9FVkVOVF9TRVJWRVJfVVJMLFxuICAgIERFVkVMT1BNRU5UX0VWRU5UUzogREVWX0VWRU5UX1NFUlZFUl9VUkxcbn07IiwiXG5mdW5jdGlvbiBnZXRHcm91cFNldHRpbmdzVXJsKCkge1xuICAgIHJldHVybiAnL2FwaS9zZXR0aW5ncy8nO1xufVxuXG5mdW5jdGlvbiBnZXRQYWdlRGF0YVVybCgpIHtcbiAgICByZXR1cm4gJy9hcGkvcGFnZW5ld2VyLyc7XG59XG5cbmZ1bmN0aW9uIGdldENyZWF0ZVJlYWN0aW9uVXJsKCkge1xuICAgIHJldHVybiAnL2FwaS90YWcvY3JlYXRlLyc7XG59XG5cbmZ1bmN0aW9uIGdldENyZWF0ZUNvbW1lbnRVcmwoKSB7XG4gICAgcmV0dXJuICcvYXBpL2NvbW1lbnQvY3JlYXRlLyc7XG59XG5cbmZ1bmN0aW9uIGdldEZldGNoQ29tbWVudFVybCgpIHtcbiAgICByZXR1cm4gJy9hcGkvY29tbWVudC9yZXBsaWVzLyc7XG59XG5cbmZ1bmN0aW9uIGdldEZldGNoQ29udGVudEJvZGllc1VybCgpIHtcbiAgICByZXR1cm4gJy9hcGkvY29udGVudC9ib2RpZXMvJztcbn1cblxuZnVuY3Rpb24gZ2V0RXZlbnRVcmwoKSB7XG4gICAgcmV0dXJuICcvaW5zZXJ0JzsgLy8gTm90ZSB0aGF0IHRoaXMgVVJMIGlzIGZvciB0aGUgZXZlbnQgc2VydmVyLCBub3QgdGhlIGFwcCBzZXJ2ZXIuXG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVJbWFnZVVybCgkZWxlbWVudCwgZ3JvdXBTZXR0aW5ncykge1xuICAgIGlmIChncm91cFNldHRpbmdzLmxlZ2FjeUJlaGF2aW9yKCkpIHtcbiAgICAgICAgcmV0dXJuIGxlZ2FjeUNvbXB1dGVJbWFnZVVybCgkZWxlbWVudCk7XG4gICAgfVxuICAgIHZhciBjb250ZW50ID0gJGVsZW1lbnQuYXR0cignYW50LWl0ZW0tY29udGVudCcpIHx8ICRlbGVtZW50LmF0dHIoJ3NyYycpO1xuICAgIGlmIChjb250ZW50ICYmIGNvbnRlbnQuaW5kZXhPZignLy8nKSAhPT0gMCAmJiBjb250ZW50LmluZGV4T2YoJ2h0dHAnKSAhPT0gMCkgeyAvLyBwcm90b2NvbC1yZWxhdGl2ZSBvciBhYnNvbHV0ZSB1cmwsIGUuZy4gLy9kb21haW4uY29tL2Zvby9iYXIucG5nIG9yIGh0dHA6Ly9kb21haW4uY29tL2Zvby9iYXIvcG5nXG4gICAgICAgIGlmIChjb250ZW50LmluZGV4T2YoJy8nKSA9PT0gMCkgeyAvLyBkb21haW4tcmVsYXRpdmUgdXJsLCBlLmcuIC9mb28vYmFyLnBuZyA9PiBkb21haW4uY29tL2Zvby9iYXIucG5nXG4gICAgICAgICAgICBjb250ZW50ID0gd2luZG93LmxvY2F0aW9uLm9yaWdpbiArIGNvbnRlbnQ7XG4gICAgICAgIH0gZWxzZSB7IC8vIHBhdGgtcmVsYXRpdmUgdXJsLCBlLmcuIGJhci5wbmcgPT4gZG9tYWluLmNvbS9iYXovYmFyLnBuZ1xuICAgICAgICAgICAgdmFyIHBhdGggPSB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWU7XG4gICAgICAgICAgICB2YXIgaW5kZXggPSBwYXRoLmxhc3RJbmRleE9mKCcvJykgKyAxO1xuICAgICAgICAgICAgaWYgKHBhdGgubGVuZ3RoID4gaW5kZXgpIHtcbiAgICAgICAgICAgICAgICBwYXRoID0gcGF0aC5zdWJzdHJpbmcoMCwgaW5kZXgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29udGVudCA9IHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4gKyBwYXRoICsgY29udGVudDtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gY29udGVudDtcbn1cblxuLy8gTGVnYWN5IGltcGxlbWVudGF0aW9uIHdoaWNoIG1haW50YWlucyB0aGUgb2xkIGJlaGF2aW9yIG9mIGVuZ2FnZV9mdWxsXG4vLyBUaGlzIGNvZGUgaXMgd3JvbmcgZm9yIFVSTHMgdGhhdCBzdGFydCB3aXRoIFwiLy9cIi4gSXQgYWxzbyBnaXZlcyBwcmVjZWRlbmNlIHRvIHRoZSBzcmMgYXR0IGluc3RlYWQgb2YgYW50LWl0ZW0tY29udGVudFxuZnVuY3Rpb24gbGVnYWN5Q29tcHV0ZUltYWdlVXJsKCRlbGVtZW50KSB7XG4gICAgdmFyIGNvbnRlbnQgPSAkZWxlbWVudC5hdHRyKCdzcmMnKSB8fCAkZWxlbWVudC5hdHRyKCdhbnQtaXRlbS1jb250ZW50Jyk7XG4gICAgaWYgKGNvbnRlbnQpIHtcbiAgICAgICAgaWYgKGNvbnRlbnQuaW5kZXhPZignLycpID09PSAwKSB7XG4gICAgICAgICAgICBjb250ZW50ID0gd2luZG93LmxvY2F0aW9uLm9yaWdpbiArIGNvbnRlbnQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvbnRlbnQuaW5kZXhPZignaHR0cCcpICE9PSAwKSB7XG4gICAgICAgICAgICBjb250ZW50ID0gd2luZG93LmxvY2F0aW9uLm9yaWdpbiArIHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZSArIGNvbnRlbnQ7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGNvbnRlbnQ7XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVNZWRpYVVybCgkZWxlbWVudCwgZ3JvdXBTZXR0aW5ncykge1xuICAgIGlmIChncm91cFNldHRpbmdzLmxlZ2FjeUJlaGF2aW9yKCkpIHtcbiAgICAgICAgcmV0dXJuIGxlZ2FjeUNvbXB1dGVNZWRpYVVybCgkZWxlbWVudCk7XG4gICAgfVxuICAgIHZhciBjb250ZW50ID0gJGVsZW1lbnQuYXR0cignYW50LWl0ZW0tY29udGVudCcpIHx8ICRlbGVtZW50LmF0dHIoJ3NyYycpIHx8ICRlbGVtZW50LmF0dHIoJ2RhdGEnKTtcbiAgICBpZiAoY29udGVudCAmJiBjb250ZW50LmluZGV4T2YoJy8vJykgIT09IDAgJiYgY29udGVudC5pbmRleE9mKCdodHRwJykgIT09IDApIHsgLy8gcHJvdG9jb2wtcmVsYXRpdmUgb3IgYWJzb2x1dGUgdXJsLCBlLmcuIC8vZG9tYWluLmNvbS9mb28vYmFyLnBuZyBvciBodHRwOi8vZG9tYWluLmNvbS9mb28vYmFyL3BuZ1xuICAgICAgICBpZiAoY29udGVudC5pbmRleE9mKCcvJykgPT09IDApIHsgLy8gZG9tYWluLXJlbGF0aXZlIHVybCwgZS5nLiAvZm9vL2Jhci5wbmcgPT4gZG9tYWluLmNvbS9mb28vYmFyLnBuZ1xuICAgICAgICAgICAgY29udGVudCA9IHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4gKyBjb250ZW50O1xuICAgICAgICB9IGVsc2UgeyAvLyBwYXRoLXJlbGF0aXZlIHVybCwgZS5nLiBiYXIucG5nID0+IGRvbWFpbi5jb20vYmF6L2Jhci5wbmdcbiAgICAgICAgICAgIHZhciBwYXRoID0gd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lO1xuICAgICAgICAgICAgdmFyIGluZGV4ID0gcGF0aC5sYXN0SW5kZXhPZignLycpICsgMTtcbiAgICAgICAgICAgIGlmIChwYXRoLmxlbmd0aCA+IGluZGV4KSB7XG4gICAgICAgICAgICAgICAgcGF0aCA9IHBhdGguc3Vic3RyaW5nKDAsIGluZGV4KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnRlbnQgPSB3aW5kb3cubG9jYXRpb24ub3JpZ2luICsgcGF0aCArIGNvbnRlbnQ7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGNvbnRlbnQ7XG59XG5cbi8vIExlZ2FjeSBpbXBsZW1lbnRhdGlvbiB3aGljaCBtYWludGFpbnMgdGhlIG9sZCBiZWhhdmlvciBvZiBlbmdhZ2VfZnVsbFxuLy8gVGhpcyBjb2RlIGlzIHdyb25nIGZvciBVUkxzIHRoYXQgc3RhcnQgd2l0aCBcIi8vXCIuIEl0IGFsc28gZ2l2ZXMgcHJlY2VkZW5jZSB0byB0aGUgc3JjIGF0dCBpbnN0ZWFkIG9mIGFudC1pdGVtLWNvbnRlbnRcbmZ1bmN0aW9uIGxlZ2FjeUNvbXB1dGVNZWRpYVVybCgkZWxlbWVudCkge1xuICAgIHZhciBjb250ZW50ID0gJGVsZW1lbnQuYXR0cignYW50LWl0ZW0tY29udGVudCcpIHx8ICRlbGVtZW50LmF0dHIoJ3NyYycpIHx8ICRlbGVtZW50LmF0dHIoJ2RhdGEnKSB8fCAnJztcbiAgICBpZiAoY29udGVudCkge1xuICAgICAgICBpZiAoY29udGVudC5pbmRleE9mKCcvJykgPT09IDApIHtcbiAgICAgICAgICAgIGNvbnRlbnQgPSB3aW5kb3cubG9jYXRpb24ub3JpZ2luICsgY29udGVudDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY29udGVudC5pbmRleE9mKCdodHRwJykgIT09IDApIHtcbiAgICAgICAgICAgIGNvbnRlbnQgPSB3aW5kb3cubG9jYXRpb24ub3JpZ2luICsgd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lICsgY29udGVudDtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gY29udGVudDtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGdyb3VwU2V0dGluZ3NVcmw6IGdldEdyb3VwU2V0dGluZ3NVcmwsXG4gICAgcGFnZURhdGFVcmw6IGdldFBhZ2VEYXRhVXJsLFxuICAgIGNyZWF0ZVJlYWN0aW9uVXJsOiBnZXRDcmVhdGVSZWFjdGlvblVybCxcbiAgICBjcmVhdGVDb21tZW50VXJsOiBnZXRDcmVhdGVDb21tZW50VXJsLFxuICAgIGZldGNoQ29tbWVudFVybDogZ2V0RmV0Y2hDb21tZW50VXJsLFxuICAgIGZldGNoQ29udGVudEJvZGllc1VybDogZ2V0RmV0Y2hDb250ZW50Qm9kaWVzVXJsLFxuICAgIGNvbXB1dGVJbWFnZVVybDogY29tcHV0ZUltYWdlVXJsLFxuICAgIGNvbXB1dGVNZWRpYVVybDogY29tcHV0ZU1lZGlhVXJsLFxuICAgIGV2ZW50VXJsOiBnZXRFdmVudFVybFxufTtcbiIsInZhciBBcHBNb2RlID0gcmVxdWlyZSgnLi9hcHAtbW9kZScpO1xuXG4vLyBUT0RPOiBGaWd1cmUgb3V0IGhvdyBtYW55IGRpZmZlcmVudCBmb3JtYXRzIG9mIHVzZXIgZGF0YSB3ZSBoYXZlIGFuZCBlaXRoZXIgdW5pZnkgdGhlbSBvciBwcm92aWRlIGNsZWFyXG4vLyAgICAgICBBUEkgaGVyZSB0byB0cmFuc2xhdGUgZWFjaCB2YXJpYXRpb24gaW50byBzb21ldGhpbmcgc3RhbmRhcmQgZm9yIHRoZSBjbGllbnQuXG4vLyBUT0RPOiBIYXZlIFhETUNsaWVudCBwYXNzIHRocm91Z2ggdGhpcyBtb2R1bGUgYXMgd2VsbC5cbmZ1bmN0aW9uIHVzZXJGcm9tQ29tbWVudEpTT04oanNvblVzZXIsIHNvY2lhbFVzZXIpIHsgLy8gVGhpcyBmb3JtYXQgd29ya3MgZm9yIHRoZSB1c2VyIHJldHVybmVkIGZyb20gL2FwaS9jb21tZW50cy9yZXBsaWVzXG4gICAgdmFyIHVzZXIgPSB7fTtcbiAgICBpZiAoanNvblVzZXIudXNlcl9pZCkge1xuICAgICAgICB1c2VyLmlkID0ganNvblVzZXIudXNlcl9pZDtcbiAgICB9XG4gICAgaWYgKHNvY2lhbFVzZXIpIHtcbiAgICAgICAgdXNlci5pbWFnZVVSTCA9IHNvY2lhbFVzZXIuaW1nX3VybDtcbiAgICAgICAgdXNlci5uYW1lID0gc29jaWFsVXNlci5mdWxsX25hbWU7XG4gICAgfVxuICAgIGlmICghdXNlci5uYW1lKSB7XG4gICAgICAgIHVzZXIubmFtZSA9IGpzb25Vc2VyLmZpcnN0X25hbWUgPyAoanNvblVzZXIuZmlyc3RfbmFtZSArICcgJyArIGpzb25Vc2VyLmxhc3RfbmFtZSkgOiAnQW5vbnltb3VzJztcbiAgICB9XG4gICAgaWYgKCF1c2VyLmltYWdlVVJMKSB7XG4gICAgICAgIHVzZXIuaW1hZ2VVUkwgPSBhbm9ueW1vdXNJbWFnZVVSTCgpXG4gICAgfVxuICAgIHJldHVybiB1c2VyO1xufVxuXG5cbi8vIFRPRE86IFJldmlzaXQgdGhlIHVzZXIgdGhhdCB3ZSBwYXNzIGJhY2sgZm9yIG5ldyBjb21tZW50cy4gT3B0aW9ucyBhcmU6XG4vLyAgICAgICAxLiBVc2UgdGhlIGxvZ2dlZCBpbiB1c2VyLCBhc3N1bWluZyB3ZSBhbHJlYWR5IGhhdmUgb25lIGluIGhhbmQgdmlhIFhETS5cbi8vICAgICAgIDIuIFVzZSBhIGdlbmVyaWMgXCJ5b3VcIiByZXByZXNlbnRhdGlvbiBsaWtlIHdlJ3JlIGRvaW5nIG5vdy5cbi8vICAgICAgIDMuIERvbid0IHNob3cgYW55IGluZGljYXRpb24gb2YgdGhlIHVzZXIuIEp1c3Qgc2hvdyB0aGUgY29tbWVudC5cbi8vICAgICAgIEZvciBub3csIHRoaXMgaXMganVzdCBnaXZpbmcgdXMgc29tZSBub3Rpb24gb2YgdXNlciB3aXRob3V0IGEgcm91bmQgdHJpcC5cbmZ1bmN0aW9uIG9wdGltaXN0aWNVc2VyKCkge1xuICAgIHZhciB1c2VyID0ge1xuICAgICAgICBuYW1lOiAnWW91JyxcbiAgICAgICAgaW1hZ2VVUkw6IGFub255bW91c0ltYWdlVVJMKClcbiAgICB9O1xuICAgIHJldHVybiB1c2VyO1xufVxuXG5mdW5jdGlvbiBhbm9ueW1vdXNJbWFnZVVSTCgpIHtcbiAgICByZXR1cm4gQXBwTW9kZS5vZmZsaW5lID8gJy9zdGF0aWMvd2lkZ2V0L2ltYWdlcy9hbm9ueW1vdXNwbG9kZS5wbmcnIDogJ2h0dHA6Ly9zMy5hbWF6b25hd3MuY29tL3JlYWRyYm9hcmQvd2lkZ2V0L2ltYWdlcy9hbm9ueW1vdXNwbG9kZS5wbmcnO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBmcm9tQ29tbWVudEpTT046IHVzZXJGcm9tQ29tbWVudEpTT04sXG4gICAgb3B0aW1pc3RpY1VzZXI6IG9wdGltaXN0aWNVc2VyXG59OyIsInZhciBpZCA9ICdhbnRlbm5hLXdpZGdldC1idWNrZXQnO1xuXG5mdW5jdGlvbiBnZXRXaWRnZXRCdWNrZXQoKSB7XG4gICAgdmFyIGJ1Y2tldCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKTtcbiAgICBpZiAoIWJ1Y2tldCkge1xuICAgICAgICBidWNrZXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgYnVja2V0LnNldEF0dHJpYnV0ZSgnaWQnLCBpZCk7XG4gICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoYnVja2V0KTtcbiAgICB9XG4gICAgcmV0dXJuIGJ1Y2tldDtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGdldDogZ2V0V2lkZ2V0QnVja2V0LFxuICAgIHNlbGVjdG9yOiBmdW5jdGlvbigpIHsgcmV0dXJuICcjJyArIGlkOyB9XG59OyIsIlxudmFyIFVSTHMgPSByZXF1aXJlKCcuL3VybHMnKTtcbnZhciBYZG1Mb2FkZXIgPSByZXF1aXJlKCcuL3hkbS1sb2FkZXInKTtcblxudmFyIEV2ZW50cyA9IHJlcXVpcmUoJy4uL2V2ZW50cycpOyAvLyBUT0RPOiByZXNvbHZlIHRoaXMgYmFja3dhcmQgZGVwZW5kZW5jeVxuXG4vLyBSZWdpc3RlciBvdXJzZWx2ZXMgdG8gaGVhciBtZXNzYWdlc1xud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIHJlY2VpdmVNZXNzYWdlLCBmYWxzZSk7XG5cbnZhciBjYWxsYmFja3MgPSB7XG4gICAgJ3hkbSBsb2FkZWQnOiB4ZG1Mb2FkZWRcbn07XG52YXIgY2FjaGUgPSB7fTtcblxudmFyIGlzWERNTG9hZGVkID0gZmFsc2U7XG4vLyBUaGUgaW5pdGlhbCBtZXNzYWdlIHRoYXQgWERNIHNlbmRzIG91dCB3aGVuIGl0IGxvYWRzXG5mdW5jdGlvbiB4ZG1Mb2FkZWQoZGF0YSkge1xuICAgIGlzWERNTG9hZGVkID0gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gc2V0TWVzc2FnZUhhbmRsZXIobWVzc2FnZUtleSwgY2FsbGJhY2spIHtcbiAgICBjYWxsYmFja3NbbWVzc2FnZUtleV0gPSBjYWxsYmFjaztcbn1cblxuZnVuY3Rpb24gZ2V0VXNlcihjYWxsYmFjaykge1xuICAgIHZhciBtZXNzYWdlID0gJ2dldFVzZXInO1xuICAgIHBvc3RNZXNzYWdlKG1lc3NhZ2UsICdyZXR1cm5pbmdfdXNlcicsIHN1Y2Nlc3MsIHZhbGlkQ2FjaGVFbnRyeSk7XG5cbiAgICBmdW5jdGlvbiBzdWNjZXNzKHJlc3BvbnNlKSB7XG4gICAgICAgIHZhciB1c2VySW5mbyA9IHJlc3BvbnNlLmRldGFpbDtcbiAgICAgICAgY2FsbGJhY2sodXNlckluZm8pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHZhbGlkQ2FjaGVFbnRyeShyZXNwb25zZSkge1xuICAgICAgICB2YXIgdXNlckluZm8gPSByZXNwb25zZS5kZXRhaWw7XG4gICAgICAgIHJldHVybiB1c2VySW5mbyAmJiB1c2VySW5mby5hbnRfdG9rZW4gJiYgdXNlckluZm8udXNlcl9pZDsgLy8gVE9ETyAmJiB1c2VySW5mby51c2VyX3R5cGUgJiYgc29jaWFsX3VzZXIsIGV0Yy4/XG4gICAgfVxufVxuXG5mdW5jdGlvbiByZWNlaXZlTWVzc2FnZShldmVudCkge1xuICAgIHZhciBldmVudE9yaWdpbiA9IGV2ZW50Lm9yaWdpbjtcbiAgICBpZiAoZXZlbnRPcmlnaW4gPT09IFhkbUxvYWRlci5PUklHSU4pIHtcbiAgICAgICAgdmFyIHJlc3BvbnNlID0gZXZlbnQuZGF0YTtcbiAgICAgICAgLy8gVE9ETzogVGhlIGV2ZW50LnNvdXJjZSBwcm9wZXJ0eSBnaXZlcyB1cyB0aGUgc291cmNlIHdpbmRvdyBvZiB0aGUgbWVzc2FnZSBhbmQgY3VycmVudGx5IHRoZSBYRE0gZnJhbWUgZmlyZXMgb3V0XG4gICAgICAgIC8vIGV2ZW50cyB0aGF0IHdlIHJlY2VpdmUgYmVmb3JlIHdlIGV2ZXIgdHJ5IHRvIHBvc3QgYW55dGhpbmcuIFNvIHdlICpjb3VsZCogaG9sZCBvbnRvIHRoZSB3aW5kb3cgaGVyZSBhbmQgdXNlIGl0XG4gICAgICAgIC8vIGZvciBwb3N0aW5nIG1lc3NhZ2VzIHJhdGhlciB0aGFuIGxvb2tpbmcgZm9yIHRoZSBYRE0gZnJhbWUgb3Vyc2VsdmVzLiBOZWVkIHRvIGxvb2sgYXQgd2hpY2ggZXZlbnRzIHRoZSBYRE0gZnJhbWVcbiAgICAgICAgLy8gZmlyZXMgb3V0IHRvIGFsbCB3aW5kb3dzIGJlZm9yZSBiZWluZyBhc2tlZC4gQ3VycmVudGx5LCBpdCdzIG1vcmUgdGhhbiBcInhkbSBsb2FkZWRcIi4gV2h5P1xuICAgICAgICAvL3ZhciBzb3VyY2VXaW5kb3cgPSBldmVudC5zb3VyY2U7XG5cbiAgICAgICAgdmFyIGNhbGxiYWNrS2V5ID0gcmVzcG9uc2Uua2V5O1xuICAgICAgICBjYWNoZVtjYWxsYmFja0tleV0gPSByZXNwb25zZTtcbiAgICAgICAgdmFyIGNhbGxiYWNrID0gY2FsbGJhY2tzW2NhbGxiYWNrS2V5XTtcbiAgICAgICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhyZXNwb25zZSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIHBvc3RNZXNzYWdlKG1lc3NhZ2UsIGNhbGxiYWNrS2V5LCBjYWxsYmFjaywgdmFsaWRDYWNoZUVudHJ5KSB7XG4gICAgaWYgKGlzWERNTG9hZGVkKSB7XG4gICAgICAgIHZhciB0YXJnZXRPcmlnaW4gPSBYZG1Mb2FkZXIuT1JJR0lOO1xuICAgICAgICBjYWxsYmFja3NbY2FsbGJhY2tLZXldID0gY2FsbGJhY2s7XG4gICAgICAgIHZhciBjYWNoZWRSZXNwb25zZSA9IGNhY2hlW2NhbGxiYWNrS2V5XTtcbiAgICAgICAgaWYgKGNhY2hlZFJlc3BvbnNlICE9PSB1bmRlZmluZWQgJiYgdmFsaWRDYWNoZUVudHJ5ICYmIHZhbGlkQ2FjaGVFbnRyeShjYWNoZVtjYWxsYmFja0tleV0pKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhjYWNoZVtjYWxsYmFja0tleV0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyIHhkbUZyYW1lID0gZ2V0WERNRnJhbWUoKTtcbiAgICAgICAgICAgIGlmICh4ZG1GcmFtZSkge1xuICAgICAgICAgICAgICAgIHhkbUZyYW1lLnBvc3RNZXNzYWdlKG1lc3NhZ2UsIHRhcmdldE9yaWdpbik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZU1lc3NhZ2UobWVzc2FnZSwgY2FsbGJhY2tLZXksIGNhbGxiYWNrLCB2YWxpZENhY2hlRW50cnkpO1xuICAgIH1cbn1cblxudmFyIG1lc3NhZ2VRdWV1ZSA9IFtdO1xudmFyIG1lc3NhZ2VRdWV1ZVRpbWVyO1xuXG5mdW5jdGlvbiBxdWV1ZU1lc3NhZ2UobWVzc2FnZSwgY2FsbGJhY2tLZXksIGNhbGxiYWNrLCB2YWxpZENhY2hlRW50cnkpIHtcbiAgICAvLyBUT0RPOiBSZXZpZXcgdGhpcyBpZGVhLiBUaGUgbWFpbiBtZXNzYWdlIHdlIHJlYWxseSBuZWVkIHRvIHF1ZXVlIHVwIGlzIHRoZSBnZXRVc2VyIHJlcXVlc3QgYXMgcGFydCBvZiB0aGUgXCJncm91cCBzZXR0aW5ncyBsb2FkZWRcIlxuICAgIC8vIGV2ZW50IHdoaWNoIGZpcmVzIHZlcnkgZWFybHkgKHBvc3NpYmx5IFwicGFnZSBkYXRhIGxvYWRlZFwiIHRvbykuIEJ1dCB3aGF0IGFib3V0IHRoZSByZXN0IG9mIHRoZSB3aWRnZXQ/IFNob3VsZCB3ZSBldmVuIHNob3dcbiAgICAvLyB0aGUgcmVhY3Rpb24gd2luZG93IGlmIHRoZSBYRE0gZnJhbWUgaXNuJ3QgcmVhZHk/IE9yIHNob3VsZCB0aGUgd2lkZ2V0IHdhaXQgdG8gYmVjb21lIHZpc2libGUgdW50aWwgWERNIGlzIHJlYWR5IGxpa2UgdGhlXG4gICAgLy8gd2F5IGl0IHdhaXRzIGZvciBwYWdlIGRhdGEgdG8gbG9hZD9cbiAgICBtZXNzYWdlUXVldWUucHVzaCh7bWVzc2FnZTogbWVzc2FnZSwgY2FsbGJhY2tLZXk6IGNhbGxiYWNrS2V5LCBjYWxsYmFjazogY2FsbGJhY2ssIHZhbGlkQ2FjaGVFbnRyeTogdmFsaWRDYWNoZUVudHJ5fSk7XG4gICAgaWYgKCFtZXNzYWdlUXVldWVUaW1lcikge1xuICAgICAgICAvLyBTdGFydCB0aGUgd2FpdC4uLlxuICAgICAgICB2YXIgc3RvcFRpbWUgPSBEYXRlLm5vdygpICsgMTAwMDA7IC8vIEdpdmUgdXAgYWZ0ZXIgMTAgc2Vjb25kc1xuICAgICAgICBtZXNzYWdlUXVldWVUaW1lciA9IHNldEludGVydmFsKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKGlzWERNTG9hZGVkIHx8IERhdGUubm93KCkgPiBzdG9wVGltZSkge1xuICAgICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwobWVzc2FnZVF1ZXVlVGltZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGlzWERNTG9hZGVkKSB7XG4gICAgICAgICAgICAgICAgLy8gVE9ETzogQ29uc2lkZXIgdGhlIHRpbWluZyBpc3N1ZSB3aGVyZSBtZXNzYWdlcyBjb3VsZCBzbmVhayBpbiBhbmQgYmUgcHJvY2Vzc2VkIHdoaWxlIHRoaXMgbG9vcCBpcyBzbGVlcGluZy5cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG1lc3NhZ2VRdWV1ZS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZGVxdWV1ZWQgPSBtZXNzYWdlUXVldWVbaV07XG4gICAgICAgICAgICAgICAgICAgIHBvc3RNZXNzYWdlKGRlcXVldWVkLm1lc3NhZ2UsIGRlcXVldWVkLmNhbGxiYWNrS2V5LCBkZXF1ZXVlZC5jYWxsYmFjaywgZGVxdWV1ZWQudmFsaWRDYWNoZUVudHJ5KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIDUwKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGdldFhETUZyYW1lKCkge1xuICAgIC8vIFRPRE86IElzIHRoaXMgYSBzZWN1cml0eSBwcm9ibGVtPyBXaGF0IHByZXZlbnRzIHNvbWVvbmUgZnJvbSB1c2luZyB0aGlzIHNhbWUgbmFtZSBhbmQgaW50ZXJjZXB0aW5nIG91ciBtZXNzYWdlcz9cbiAgICByZXR1cm4gd2luZG93LmZyYW1lc1snYW50LXhkbS1oaWRkZW4nXTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgZ2V0VXNlcjogZ2V0VXNlcixcbiAgICBzZXRNZXNzYWdlSGFuZGxlcjogc2V0TWVzc2FnZUhhbmRsZXJcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgQXBwTW9kZSA9IHJlcXVpcmUoJy4vYXBwLW1vZGUnKTtcbnZhciBVUkxDb25zdGFudHMgPSByZXF1aXJlKCcuL3VybC1jb25zdGFudHMnKTtcbnZhciBXaWRnZXRCdWNrZXQgPSByZXF1aXJlKCcuL3dpZGdldC1idWNrZXQnKTtcblxudmFyIFhETV9PUklHSU4gPSBBcHBNb2RlLm9mZmxpbmUgPyBVUkxDb25zdGFudHMuREVWRUxPUE1FTlQgOiBVUkxDb25zdGFudHMuUFJPRFVDVElPTjtcblxuZnVuY3Rpb24gY3JlYXRlWERNZnJhbWUoZ3JvdXBJZCkge1xuICAgIC8vQU5ULnNlc3Npb24ucmVjZWl2ZU1lc3NhZ2Uoe30sIGZ1bmN0aW9uKCkge1xuICAgIC8vICAgIEFOVC51dGlsLnVzZXJMb2dpblN0YXRlKCk7XG4gICAgLy99KTtcblxuICAgIHZhciBpZnJhbWVVcmwgPSBYRE1fT1JJR0lOICsgXCIvc3RhdGljL3dpZGdldC1uZXcveGRtL3hkbS5odG1sXCIsXG4gICAgcGFyZW50VXJsID0gd2luZG93LmxvY2F0aW9uLmhyZWYsXG4gICAgcGFyZW50SG9zdCA9IHdpbmRvdy5sb2NhdGlvbi5wcm90b2NvbCArIFwiLy9cIiArIHdpbmRvdy5sb2NhdGlvbi5ob3N0LFxuICAgIC8vIFRPRE86IFJlc3RvcmUgdGhlIGJvb2ttYXJrbGV0IGF0dHJpYnV0ZSBvbiB0aGUgaUZyYW1lP1xuICAgIC8vYm9va21hcmtsZXQgPSAoIEFOVC5lbmdhZ2VTY3JpcHRQYXJhbXMuYm9va21hcmtsZXQgKSA/IFwiYm9va21hcmtsZXQ9dHJ1ZVwiOlwiXCIsXG4gICAgYm9va21hcmtsZXQgPSBcIlwiLFxuICAgIC8vIFRPRE86IFJlc3RvcmUgdGhlIGdyb3VwTmFtZSBhdHRyaWJ1dGUuIChXaGF0IGlzIGl0IGZvcj8pXG4gICAgJHhkbUlmcmFtZSA9ICQoJzxpZnJhbWUgaWQ9XCJhbnQteGRtLWhpZGRlblwiIG5hbWU9XCJhbnQteGRtLWhpZGRlblwiIHNyYz1cIicgKyBpZnJhbWVVcmwgKyAnP3BhcmVudFVybD0nICsgcGFyZW50VXJsICsgJyZwYXJlbnRIb3N0PScgKyBwYXJlbnRIb3N0ICsgJyZncm91cF9pZD0nK2dyb3VwSWQrJ1wiIHdpZHRoPVwiMVwiIGhlaWdodD1cIjFcIiBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlO3RvcDotMTAwMHB4O2xlZnQ6LTEwMDBweDtcIiAvPicpO1xuICAgIC8vJHhkbUlmcmFtZSA9ICQoJzxpZnJhbWUgaWQ9XCJhbnQteGRtLWhpZGRlblwiIG5hbWU9XCJhbnQteGRtLWhpZGRlblwiIHNyYz1cIicgKyBpZnJhbWVVcmwgKyAnP3BhcmVudFVybD0nICsgcGFyZW50VXJsICsgJyZwYXJlbnRIb3N0PScgKyBwYXJlbnRIb3N0ICsgJyZncm91cF9pZD0nK2dyb3VwSWQrJyZncm91cF9uYW1lPScrZW5jb2RlVVJJQ29tcG9uZW50KGdyb3VwTmFtZSkrJyYnK2Jvb2ttYXJrbGV0KydcIiB3aWR0aD1cIjFcIiBoZWlnaHQ9XCIxXCIgc3R5bGU9XCJwb3NpdGlvbjphYnNvbHV0ZTt0b3A6LTEwMDBweDtsZWZ0Oi0xMDAwcHg7XCIgLz4nKTtcbiAgICAkKFdpZGdldEJ1Y2tldC5nZXQoKSkuYXBwZW5kKCAkeGRtSWZyYW1lICk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZVhETWZyYW1lOiBjcmVhdGVYRE1mcmFtZSxcbiAgICBPUklHSU46IFhETV9PUklHSU5cbn07IiwidmFyIFhETUNsaWVudCA9IHJlcXVpcmUoJy4vdXRpbHMveGRtLWNsaWVudCcpO1xudmFyIEV2ZW50cyA9IHJlcXVpcmUoJy4vZXZlbnRzJyk7XG52YXIgR3JvdXBTZXR0aW5ncyA9IHJlcXVpcmUoJy4vZ3JvdXAtc2V0dGluZ3MnKTtcbnZhciBQYWdlRGF0YSA9IHJlcXVpcmUoJy4vcGFnZS1kYXRhJyk7XG5cbmZ1bmN0aW9uIHN0YXJ0TGlzdGVuaW5nKCkge1xuICAgIFhETUNsaWVudC5zZXRNZXNzYWdlSGFuZGxlcigncmVjaXJjQ2xpY2snLCByZWNpcmNDbGlja2VkKTtcbn1cblxuZnVuY3Rpb24gcmVjaXJjQ2xpY2tlZChyZXNwb25zZSkge1xuICAgIHZhciByZWFjdGlvbklkID0gcmVzcG9uc2UuZGV0YWlsLnJlZmVycmluZ19pbnRfaWQ7XG4gICAgZ2V0UGFnZURhdGEocmVzcG9uc2UuZGV0YWlsLnBhZ2VfaGFzaCwgZnVuY3Rpb24ocGFnZURhdGEpIHtcbiAgICAgICAgRXZlbnRzLnBvc3RSZWNpcmNDbGlja2VkKHBhZ2VEYXRhLCByZWFjdGlvbklkLCBHcm91cFNldHRpbmdzLmdldCgpKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gZ2V0UGFnZURhdGEocGFnZUhhc2gsIGNhbGxiYWNrKSB7XG4gICAgaWYgKHBhZ2VIYXNoKSB7XG4gICAgICAgIC8vIFRoaXMgbW9kdWxlIGxvYWRzIHZlcnkgZWFybHkgaW4gdGhlIGFwcCBsaWZlY3ljbGUgYW5kIG1heSByZWNlaXZlIGV2ZW50cyBmcm9tIHRoZSBYRE0gZnJhbWUgYmVmb3JlIHBhZ2VcbiAgICAgICAgLy8gZGF0YSBoYXMgYmVlbiBsb2FkZWQuIEhvbGQgb250byBhbnkgc3VjaCBldmVudHMgdW50aWwgdGhlIHBhZ2UgZGF0YSBsb2FkcyBvciB3ZSB0aW1lb3V0LlxuICAgICAgICB2YXIgbWF4V2FpdFRpbWUgPSBEYXRlLm5vdygpICsgMTAwMDA7IC8vIEdpdmUgdXAgYWZ0ZXIgMTAgc2Vjb25kc1xuICAgICAgICB2YXIgaW50ZXJ2YWwgPSBzZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgcGFnZURhdGEgPSBQYWdlRGF0YS5nZXRQYWdlRGF0YShwYWdlSGFzaCk7XG4gICAgICAgICAgICBpZiAocGFnZURhdGEpIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhwYWdlRGF0YSk7XG4gICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChpbnRlcnZhbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoRGF0ZS5ub3coKSA+IG1heFdhaXRUaW1lKSB7XG4gICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChpbnRlcnZhbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIDUwKTtcbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHN0YXJ0OiBzdGFydExpc3RlbmluZ1xufTsiLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYSBhbnRlbm5hLWF1dG8tY3RhXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWF1dG8tY3RhLWlubmVyXCIsXCJhbnQtY3RhLWZvclwiOlt7XCJ0XCI6MixcInJcIjpcImFudEl0ZW1JZFwifV19LFwiZlwiOlt7XCJ0XCI6OCxcInJcIjpcImxvZ29cIn0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtYXV0by1jdGEtbGFiZWxcIixcImFudC1yZWFjdGlvbnMtbGFiZWwtZm9yXCI6W3tcInRcIjoyLFwiclwiOlwiYW50SXRlbUlkXCJ9XX19XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo0LFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcImNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbFwifV0sXCJuXCI6NTAsXCJ4XCI6e1wiclwiOltcImNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbFwiLFwiY29udGFpbmVyRGF0YS5sb2FkZWRcIl0sXCJzXCI6XCJfMCE9PXVuZGVmaW5lZCYmXzFcIn19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjQsXCJmXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcImNhbGwtdG8tYWN0aW9uLWxhYmVsX3Jlc3BvbnNlc1xcXCIpXCJ9fV0sXCJuXCI6NTAsXCJ4XCI6e1wiclwiOltcImNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbFwiLFwiY29udGFpbmVyRGF0YS5sb2FkZWRcIl0sXCJzXCI6XCJfMD09PXVuZGVmaW5lZHx8IV8xXCJ9fSx7XCJ0XCI6NCxcIm5cIjo1MSxcImZcIjpbe1widFwiOjQsXCJuXCI6NTAsXCJ4XCI6e1wiclwiOltcImNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbFwiXSxcInNcIjpcIl8wPT09MVwifSxcImZcIjpbe1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwiY2FsbC10by1hY3Rpb24tbGFiZWxfcmVzcG9uc2VzX29uZVxcXCIpXCJ9fV19LHtcInRcIjo0LFwiblwiOjUwLFwieFwiOntcInJcIjpbXCJjb250YWluZXJEYXRhLnJlYWN0aW9uVG90YWxcIl0sXCJzXCI6XCIhKF8wPT09MSlcIn0sXCJmXCI6W1wiIFwiLHtcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCIsXCJjb250YWluZXJEYXRhLnJlYWN0aW9uVG90YWxcIl0sXCJzXCI6XCJfMChcXFwiY2FsbC10by1hY3Rpb24tbGFiZWxfcmVzcG9uc2VzX21hbnlcXFwiLFtfMV0pXCJ9fV19XSxcInhcIjp7XCJyXCI6W1wiY29udGFpbmVyRGF0YS5yZWFjdGlvblRvdGFsXCIsXCJjb250YWluZXJEYXRhLmxvYWRlZFwiXSxcInNcIjpcIl8wPT09dW5kZWZpbmVkfHwhXzFcIn19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb21tZW50LWFyZWFcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY29tbWVudC13aWRnZXRzXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInRleHRhcmVhXCIsXCJ2XCI6e1wiaW5wdXRcIjpcImlucHV0Y2hhbmdlZFwifSxcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb21tZW50LWlucHV0XCIsXCJwbGFjZWhvbGRlclwiOlt7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJjb21tZW50LWFyZWFfcGxhY2Vob2xkZXJcXFwiKVwifX1dLFwibWF4bGVuZ3RoXCI6XCI1MDBcIn19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY29tbWVudC1mb290ZXJcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWNvbW1lbnQtbGltaXRcIn0sXCJmXCI6W3tcInRcIjozLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcImNvbW1lbnQtYXJlYV9jb3VudFxcXCIpXCJ9fV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiYnV0dG9uXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY29tbWVudC1zdWJtaXRcIn0sXCJ2XCI6e1widGFwXCI6XCJhZGRjb21tZW50XCJ9LFwiZlwiOlt7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJjb21tZW50LWFyZWFfYWRkXFxcIilcIn19XX1dfV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY29tbWVudC13YWl0aW5nXCJ9LFwiZlwiOltcIi4uLlwiXX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb21tZW50LXJlY2VpdmVkXCJ9LFwiZlwiOlt7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJjb21tZW50LWFyZWFfdGhhbmtzXFxcIilcIn19XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcGFnZSBhbnRlbm5hLWNvbW1lbnRzLXBhZ2VcIn0sXCJvXCI6XCJjc3NyZXNldFwiLFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWJvZHlcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJ2XCI6e1widGFwXCI6XCJiYWNrXCJ9LFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWNvbW1lbnRzLWJhY2tcIn0sXCJmXCI6W3tcInRcIjo4LFwiclwiOlwibGVmdFwifSx7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJjb21tZW50cy1wYWdlX2JhY2tcXFwiKVwifX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWNvbW1lbnRzLWhlYWRlclwifSxcImZcIjpbe1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIixcImNvbW1lbnRzLmxlbmd0aFwiXSxcInNcIjpcIl8wKFxcXCJjb21tZW50cy1wYWdlX2hlYWRlclxcXCIsW18xXSlcIn19XX0sXCIgXCIse1widFwiOjQsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpbXCJhbnRlbm5hLWNvbW1lbnQtZW50cnkgXCIse1widFwiOjQsXCJmXCI6W1wiYW50ZW5uYS1jb21tZW50LW5ld1wiXSxcIm5cIjo1MCxcInJcIjpcIi4vbmV3XCJ9XX0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwidGFibGVcIixcImZcIjpbe1widFwiOjcsXCJlXCI6XCJ0clwiLFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInRkXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY29tbWVudC1jZWxsXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImltZ1wiLFwiYVwiOntcInNyY1wiOlt7XCJ0XCI6MixcInJcIjpcIi4vdXNlci5pbWFnZVVSTFwifV19fV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwidGRcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb21tZW50LWF1dGhvclwifSxcImZcIjpbe1widFwiOjIsXCJyXCI6XCIuL3VzZXIubmFtZVwifV19XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJ0clwiLFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInRkXCIsXCJmXCI6W119LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwidGRcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb21tZW50LXRleHRcIn0sXCJmXCI6W3tcInRcIjoyLFwiclwiOlwiLi90ZXh0XCJ9XX1dfV19XX1dLFwiaVwiOlwiaW5kZXhcIixcInJcIjpcImNvbW1lbnRzXCJ9LFwiIFwiLHtcInRcIjo4LFwiclwiOlwiY29tbWVudEFyZWFcIn1dfV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1wYWdlIGFudGVubmEtY29uZmlybWF0aW9uLXBhZ2VcIn0sXCJvXCI6XCJjc3NyZXNldFwiLFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWJvZHlcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY29tbWVudC1yZWFjdGlvblwifSxcImZcIjpbe1widFwiOjIsXCJyXCI6XCJ0ZXh0XCJ9XX0sXCIgXCIse1widFwiOjgsXCJyXCI6XCJjb21tZW50QXJlYVwifV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtZm9vdGVyIGFudGVubmEtY29uZmlybS1mb290ZXJcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwidlwiOntcInRhcFwiOlwic2hhcmVcIn0sXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtc2hhcmVcIn0sXCJmXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcImNvbmZpcm1hdGlvbi1wYWdlX3NoYXJlXFxcIilcIn19LFwiIFwiLHtcInRcIjo4LFwiclwiOlwiZmFjZWJvb2tJY29uXCJ9LHtcInRcIjo4LFwiclwiOlwidHdpdHRlckljb25cIn1dfV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwidlwiOntcImtleWRvd25cIjpcInBhZ2VrZXlkb3duXCJ9LFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXBhZ2UgYW50ZW5uYS1kZWZhdWx0cy1wYWdlXCIsXCJ0YWJpbmRleFwiOlwiMFwifSxcIm9cIjpcImNzc3Jlc2V0XCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtYm9keVwifSxcImZcIjpbe1widFwiOjQsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJ2XCI6e1widGFwXCI6XCJuZXdyZWFjdGlvblwifSxcImFcIjp7XCJjbGFzc1wiOltcImFudGVubmEtcmVhY3Rpb24gXCIse1widFwiOjIsXCJ4XCI6e1wiclwiOltcImRlZmF1bHRMYXlvdXRDbGFzc1wiLFwiaW5kZXhcIl0sXCJzXCI6XCJfMChfMSlcIn19XX0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcmVhY3Rpb24tYm94XCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXJlYWN0aW9uLXRleHRcIn0sXCJvXCI6XCJzaXpldG9maXRcIixcImZcIjpbe1widFwiOjIsXCJyXCI6XCIuL3RleHRcIn1dfV19XX1dLFwiaVwiOlwiaW5kZXhcIixcInJcIjpcImRlZmF1bHRSZWFjdGlvbnNcIn1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWZvb3RlciBhbnRlbm5hLWRlZmF1bHRzLWZvb3RlclwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jdXN0b20tYXJlYVwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJpbnB1dFwiLFwidlwiOntcImZvY3VzXCI6XCJjdXN0b21mb2N1c1wiLFwia2V5ZG93blwiOlwiaW5wdXRrZXlkb3duXCIsXCJibHVyXCI6XCJjdXN0b21ibHVyXCJ9LFwiYVwiOntcInZhbHVlXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcImRlZmF1bHRzLXBhZ2VfYWRkXFxcIilcIn19XSxcIm1heGxlbmd0aFwiOlwiMjVcIn19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiYnV0dG9uXCIsXCJ2XCI6e1widGFwXCI6XCJhZGRjdXN0b21cIn0sXCJmXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcImRlZmF1bHRzLXBhZ2Vfb2tcXFwiKVwifX1dfV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtdGV4dC1sb2dvXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImFcIixcImFcIjp7XCJocmVmXCI6XCIvL3d3dy5hbnRlbm5hLmlzXCJ9LFwiZlwiOltcIkFudGVubmFcIl19XX1dfV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1wYWdlIGFudGVubmEtbG9jYXRpb25zLXBhZ2VcIn0sXCJvXCI6XCJjc3NyZXNldFwiLFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWJvZHlcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJ2XCI6e1widGFwXCI6XCJiYWNrXCJ9LFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxvY2F0aW9ucy1iYWNrXCJ9LFwiZlwiOlt7XCJ0XCI6OCxcInJcIjpcImxlZnRcIn0se1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwibG9jYXRpb25zLXBhZ2VfYmFja1xcXCIpXCJ9fV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwidGFibGVcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1sb2NhdGlvbnMtdGFibGVcIn0sXCJmXCI6W3tcInRcIjo0LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInRyXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtbG9jYXRpb25zLWNvbnRlbnQtcm93XCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInRkXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtbG9jYXRpb25zLWNvdW50LWNlbGxcIn0sXCJmXCI6W3tcInRcIjo0LFwiZlwiOlt7XCJ0XCI6MyxcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJsb2NhdGlvbnMtcGFnZV9jb3VudF9vbmVcXFwiKVwifX1dLFwiblwiOjUwLFwieFwiOntcInJcIjpbXCJwYWdlUmVhY3Rpb25Db3VudFwiXSxcInNcIjpcIl8wPT09MVwifX0se1widFwiOjQsXCJuXCI6NTEsXCJmXCI6W3tcInRcIjozLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCIsXCJwYWdlUmVhY3Rpb25Db3VudFwiXSxcInNcIjpcIl8wKFxcXCJsb2NhdGlvbnMtcGFnZV9jb3VudF9tYW55XFxcIixbXzFdKVwifX1dLFwieFwiOntcInJcIjpbXCJwYWdlUmVhY3Rpb25Db3VudFwiXSxcInNcIjpcIl8wPT09MVwifX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcInRkXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtbG9jYXRpb25zLXBhZ2UtYm9keVwifSxcImZcIjpbe1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwibG9jYXRpb25zLXBhZ2VfcGFnZWxldmVsXFxcIilcIn19XX1dfV0sXCJuXCI6NTAsXCJyXCI6XCJwYWdlUmVhY3Rpb25Db3VudFwifSxcIiBcIix7XCJ0XCI6NCxcImZcIjpbe1widFwiOjQsXCJmXCI6W1wiIFwiLHtcInRcIjo3LFwiZVwiOlwidHJcIixcInZcIjp7XCJ0YXBcIjpcInJldmVhbFwifSxcImFcIjp7XCJjbGFzc1wiOltcImFudGVubmEtbG9jYXRpb25zLWNvbnRlbnQtcm93IFwiLHtcInRcIjo0LFwiZlwiOltcImFudGVubmEtbG9jYXRlXCJdLFwiblwiOjUwLFwieFwiOntcInJcIjpbXCJjYW5Mb2NhdGVcIixcIi4vY29udGFpbmVySGFzaFwiXSxcInNcIjpcIl8wKF8xKVwifX1dfSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJ0ZFwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxvY2F0aW9ucy1jb3VudC1jZWxsXCJ9LFwiZlwiOlt7XCJ0XCI6NCxcImZcIjpbe1widFwiOjMsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwibG9jYXRpb25zLXBhZ2VfY291bnRfb25lXFxcIilcIn19XSxcIm5cIjo1MCxcInhcIjp7XCJyXCI6W1wiLi9jb3VudFwiXSxcInNcIjpcIl8wPT09MVwifX0se1widFwiOjQsXCJuXCI6NTEsXCJmXCI6W3tcInRcIjozLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCIsXCIuL2NvdW50XCJdLFwic1wiOlwiXzAoXFxcImxvY2F0aW9ucy1wYWdlX2NvdW50X21hbnlcXFwiLFtfMV0pXCJ9fV0sXCJ4XCI6e1wiclwiOltcIi4vY291bnRcIl0sXCJzXCI6XCJfMD09PTFcIn19XX0sXCIgXCIse1widFwiOjQsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwidGRcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1sb2NhdGlvbnMtdGV4dC1ib2R5XCJ9LFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcIi4vYm9keVwifV19XSxcIm5cIjo1MCxcInhcIjp7XCJyXCI6W1wiLi9raW5kXCJdLFwic1wiOlwiXzA9PT1cXFwidHh0XFxcIlwifX0se1widFwiOjQsXCJuXCI6NTEsXCJmXCI6W3tcInRcIjo0LFwiblwiOjUwLFwieFwiOntcInJcIjpbXCIuL2tpbmRcIl0sXCJzXCI6XCJfMD09PVxcXCJpbWdcXFwiXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInRkXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtbG9jYXRpb25zLWltYWdlLWJvZHlcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiaW1nXCIsXCJhXCI6e1wic3JjXCI6W3tcInRcIjoyLFwiclwiOlwiLi9ib2R5XCJ9XX19XX1dfSx7XCJ0XCI6NCxcIm5cIjo1MCxcInhcIjp7XCJyXCI6W1wiLi9raW5kXCJdLFwic1wiOlwiKCEoXzA9PT1cXFwiaW1nXFxcIikpJiYoXzA9PT1cXFwibWVkXFxcIilcIn0sXCJmXCI6W1wiIFwiLHtcInRcIjo3LFwiZVwiOlwidGRcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1sb2NhdGlvbnMtbWVkaWEtYm9keVwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJpbWdcIixcImFcIjp7XCJzcmNcIjpcIi9zdGF0aWMvd2lkZ2V0L2ltYWdlcy92aWRlb19pY29uLnBuZ1wifX0sXCIgVmlkZW9cIl19XX0se1widFwiOjQsXCJuXCI6NTAsXCJ4XCI6e1wiclwiOltcIi4va2luZFwiXSxcInNcIjpcIighKF8wPT09XFxcImltZ1xcXCIpKSYmKCEoXzA9PT1cXFwibWVkXFxcIikpXCJ9LFwiZlwiOltcIiBcIl19XSxcInhcIjp7XCJyXCI6W1wiLi9raW5kXCJdLFwic1wiOlwiXzA9PT1cXFwidHh0XFxcIlwifX1dfV0sXCJuXCI6NTAsXCJ4XCI6e1wiclwiOltcIi4va2luZFwiXSxcInNcIjpcIl8wIT09XFxcInBhZ1xcXCJcIn19XSxcImlcIjpcImlkXCIsXCJyXCI6XCJsb2NhdGlvbkRhdGFcIn1dfV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcIm9cIjpcImNzc3Jlc2V0XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEgYW50ZW5uYS1tZWRpYS1pbmRpY2F0b3Itd3JhcHBlclwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpbXCJhbnRlbm5hIGFudGVubmEtbWVkaWEtaW5kaWNhdG9yLXdpZGdldCBcIix7XCJ0XCI6NCxcImZcIjpbXCJub3Rsb2FkZWRcIl0sXCJuXCI6NTEsXCJyXCI6XCJjb250YWluZXJEYXRhLmxvYWRlZFwifSxcIiBcIix7XCJ0XCI6NCxcImZcIjpbXCJoYXNyZWFjdGlvbnNcIl0sXCJuXCI6NTAsXCJ4XCI6e1wiclwiOltcImNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbFwiXSxcInNcIjpcIl8wPjBcIn19XX0sXCJtXCI6W3tcInRcIjoyLFwiclwiOlwiZXh0cmFBdHRyaWJ1dGVzXCJ9XSxcImZcIjpbe1widFwiOjgsXCJyXCI6XCJsb2dvXCJ9LFwiIFwiLHtcInRcIjo0LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1yZWFjdGlvbi10b3RhbFwifSxcImZcIjpbe1widFwiOjIsXCJyXCI6XCJjb250YWluZXJEYXRhLnJlYWN0aW9uVG90YWxcIn1dfV0sXCJuXCI6NTAsXCJyXCI6XCJjb250YWluZXJEYXRhLnJlYWN0aW9uVG90YWxcIn0se1widFwiOjQsXCJuXCI6NTEsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXJlYWN0aW9uLXByb21wdFwifSxcImZcIjpbe1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwibWVkaWEtaW5kaWNhdG9yX3RoaW5rXFxcIilcIn19XX1dLFwiclwiOlwiY29udGFpbmVyRGF0YS5yZWFjdGlvblRvdGFsXCJ9XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcG9wdXBcIn0sXCJvXCI6XCJjc3NyZXNldFwiLFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXBvcHVwLWJvZHlcIn0sXCJmXCI6W3tcInRcIjo4LFwiclwiOlwibG9nb1wifSx7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1wb3B1cC10ZXh0XCJ9LFwiZlwiOlt7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJwb3B1cC13aWRnZXRfdGhpbmtcXFwiKVwifX1dfV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXBhZ2UgYW50ZW5uYS1yZWFjdGlvbnMtcGFnZVwifSxcIm9cIjpcImNzc3Jlc2V0XCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtYm9keVwifSxcImZcIjpbe1widFwiOjQsXCJmXCI6W3tcInRcIjo0LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwidlwiOntcInRhcFwiOlwicGx1c29uZVwiLFwibW91c2VlbnRlclwiOlwiaGlnaGxpZ2h0XCIsXCJtb3VzZWxlYXZlXCI6XCJjbGVhcmhpZ2hsaWdodHNcIn0sXCJhXCI6e1wiY2xhc3NcIjpbXCJhbnRlbm5hLXJlYWN0aW9uIFwiLHtcInRcIjoyLFwieFwiOntcInJcIjpbXCJyZWFjdGlvbnNMYXlvdXRDbGFzc1wiLFwiaW5kZXhcIixcIi4vY291bnRcIl0sXCJzXCI6XCJfMChfMSxfMilcIn19XX0sXCJmXCI6W1wiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcmVhY3Rpb24tYm94XCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXJlYWN0aW9uLXRleHRcIn0sXCJvXCI6XCJzaXpldG9maXRcIixcImZcIjpbe1widFwiOjIsXCJyXCI6XCIuL3RleHRcIn1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXJlYWN0aW9uLWNvdW50XCJ9LFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcIi4vY291bnRcIn1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXBsdXNvbmVcIn0sXCJmXCI6W1wiKzFcIl19LFwiIFwiLHtcInRcIjo0LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwidlwiOntcInRhcFwiOlwic2hvd2xvY2F0aW9uc1wifSxcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1yZWFjdGlvbi1sb2NhdGlvblwifSxcImZcIjpbe1widFwiOjgsXCJyXCI6XCJsb2NhdGlvbkljb25cIn1dfV0sXCJuXCI6NTAsXCJyXCI6XCJpc1N1bW1hcnlcIn0se1widFwiOjQsXCJuXCI6NTEsXCJmXCI6W3tcInRcIjo0LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwidlwiOntcInRhcFwiOlwic2hvd2NvbW1lbnRzXCJ9LFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXJlYWN0aW9uLWNvbW1lbnRzIGhhc2NvbW1lbnRzXCJ9LFwiZlwiOlt7XCJ0XCI6OCxcInJcIjpcImNvbW1lbnRzSWNvblwifSxcIiBcIix7XCJ0XCI6MixcInJcIjpcIi4vY29tbWVudENvdW50XCJ9XX1dLFwiblwiOjUwLFwiclwiOlwiLi9jb21tZW50Q291bnRcIn0se1widFwiOjQsXCJuXCI6NTEsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcmVhY3Rpb24tY29tbWVudHNcIn0sXCJmXCI6W3tcInRcIjo4LFwiclwiOlwiY29tbWVudHNJY29uXCJ9XX1dLFwiclwiOlwiLi9jb21tZW50Q291bnRcIn1dLFwiclwiOlwiaXNTdW1tYXJ5XCJ9XX1dfV0sXCJpXCI6XCJpbmRleFwiLFwiclwiOlwicmVhY3Rpb25zXCJ9XSxcIm5cIjo1MCxcInJcIjpcInJlYWN0aW9uc1wifV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtZm9vdGVyIGFudGVubmEtcmVhY3Rpb25zLWZvb3RlclwifSxcImZcIjpbe1widFwiOjQsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJ2XCI6e1widGFwXCI6XCJzaG93ZGVmYXVsdFwifSxcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS10aGlua1wifSxcImZcIjpbe1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwicmVhY3Rpb25zLXBhZ2VfdGhpbmtcXFwiKVwifX1dfV0sXCJuXCI6NTAsXCJyXCI6XCJyZWFjdGlvbnNcIn0se1widFwiOjQsXCJuXCI6NTEsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtbm8tcmVhY3Rpb25zXCJ9LFwiZlwiOlt7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJyZWFjdGlvbnMtcGFnZV9ub19yZWFjdGlvbnNcXFwiKVwifX1dfV0sXCJyXCI6XCJyZWFjdGlvbnNcIn0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS10ZXh0LWxvZ29cIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiYVwiLFwiYVwiOntcImhyZWZcIjpcIi8vd3d3LmFudGVubmEuaXNcIn0sXCJmXCI6W1wiQW50ZW5uYVwiXX1dfV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hIGFudGVubmEtcmVhY3Rpb25zLXdpZGdldFwiLFwidGFiaW5kZXhcIjpcIjBcIn0sXCJvXCI6XCJjc3NyZXNldFwiLFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWhlYWRlclwifSxcImZcIjpbe1widFwiOjgsXCJyXCI6XCJsb2dvXCJ9LHtcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXJlYWN0aW9ucy10aXRsZVwifSxcImZcIjpbe1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwicmVhY3Rpb25zLXdpZGdldF90aXRsZVxcXCIpXCJ9fV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwic3BhblwiLFwidlwiOntcInRhcFwiOlwiY2xvc2VcIn0sXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcmVhY3Rpb25zLWNsb3NlXCJ9LFwiZlwiOltcIlhcIl19XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1wYWdlLWNvbnRhaW5lclwifSxcImZcIjpbXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1wcm9ncmVzcy1wYWdlIGFudGVubmEtcGFnZVwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1ib2R5XCJ9fV19XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpbXCJhbnRlbm5hIGFudGVubmEtc3VtbWFyeS13aWRnZXQgXCIse1widFwiOjQsXCJmXCI6W1wibm90bG9hZGVkXCJdLFwiblwiOjUxLFwiclwiOlwicGFnZURhdGEuc3VtbWFyeUxvYWRlZFwifV19LFwib1wiOlwiY3NzcmVzZXRcIixcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1zdW1tYXJ5LWlubmVyXCJ9LFwiZlwiOlt7XCJ0XCI6OCxcInJcIjpcImxvZ29cIn0se1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtc3VtbWFyeS10aXRsZVwifSxcImZcIjpbXCIgXCIse1widFwiOjQsXCJmXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcInN1bW1hcnktd2lkZ2V0X3JlYWN0aW9uc1xcXCIpXCJ9fV0sXCJuXCI6NTAsXCJ4XCI6e1wiclwiOltcInBhZ2VEYXRhLnN1bW1hcnlUb3RhbFwiXSxcInNcIjpcIl8wPT09MFwifX0se1widFwiOjQsXCJuXCI6NTEsXCJmXCI6W3tcInRcIjo0LFwiblwiOjUwLFwieFwiOntcInJcIjpbXCJwYWdlRGF0YS5zdW1tYXJ5VG90YWxcIl0sXCJzXCI6XCJfMD09PTFcIn0sXCJmXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcInN1bW1hcnktd2lkZ2V0X3JlYWN0aW9uc19vbmVcXFwiKVwifX1dfSx7XCJ0XCI6NCxcIm5cIjo1MCxcInhcIjp7XCJyXCI6W1wicGFnZURhdGEuc3VtbWFyeVRvdGFsXCJdLFwic1wiOlwiIShfMD09PTEpXCJ9LFwiZlwiOltcIiBcIix7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiLFwicGFnZURhdGEuc3VtbWFyeVRvdGFsXCJdLFwic1wiOlwiXzAoXFxcInN1bW1hcnktd2lkZ2V0X3JlYWN0aW9uc19tYW55XFxcIixbXzFdKVwifX1dfV0sXCJ4XCI6e1wiclwiOltcInBhZ2VEYXRhLnN1bW1hcnlUb3RhbFwiXSxcInNcIjpcIl8wPT09MFwifX1dfV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb21tZW50c1wifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJzdmdcIixcImZcIjpbe1widFwiOjcsXCJlXCI6XCJ1c2VcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb21tZW50cy1wYXRoXCIsXCJ4bGluazpocmVmXCI6XCIjYW50ZW5uYS1zdmctY29tbWVudFwifX1dfV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtZmFjZWJvb2tcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3ZnXCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwidXNlXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtZmFjZWJvb2stcGF0aFwiLFwieGxpbms6aHJlZlwiOlwiI2FudGVubmEtc3ZnLWZhY2Vib29rXCJ9fV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1sZWZ0XCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInN2Z1wiLFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInVzZVwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxlZnQtcGF0aFwiLFwieGxpbms6aHJlZlwiOlwiI2FudGVubmEtc3ZnLWxlZnRcIn19XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxvY2F0aW9uXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInN2Z1wiLFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInVzZVwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxvY2F0aW9uLXBhdGhcIixcInhsaW5rOmhyZWZcIjpcIiNhbnRlbm5hLXN2Zy1zZWFyY2hcIn19XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxvZ29cIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3ZnXCIsXCJhXCI6e1widmlld0JveFwiOlwiMCAwIDUxMiA1MTJcIn0sXCJmXCI6W1wiIFwiLHtcInRcIjo3LFwiZVwiOlwicGF0aFwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxvZ28tcGF0aFwiLFwiZFwiOlwibTI4MyA1MTBjMTI1LTE3IDIyOS0xMjQgMjI5LTI1MyAwLTE0MS0xMTUtMjU2LTI1Ni0yNTYtMTQxIDAtMjU2IDExNS0yNTYgMjU2IDAgMTMwIDEwOCAyMzcgMjMzIDI1NGwwLTE0OWMtNDgtMTQtODQtNTAtODQtMTAyIDAtNjUgNDMtMTEzIDEwOC0xMTMgNjUgMCAxMDcgNDggMTA3IDExMyAwIDUyLTMzIDg4LTgxIDEwMnpcIn19XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxvZ29cIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3ZnXCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwidXNlXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtbG9nby1wYXRoXCIsXCJ4bGluazpocmVmXCI6XCIjYW50ZW5uYS1zdmctbG9nb1wifX1dfV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtdHdpdHRlclwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJzdmdcIixcImZcIjpbe1widFwiOjcsXCJlXCI6XCJ1c2VcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS10d2l0dGVyLXBhdGhcIixcInhsaW5rOmhyZWZcIjpcIiNhbnRlbm5hLXN2Zy10d2l0dGVyXCJ9fV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcInN2Z1wiLFwiYVwiOntcInhtbG5zXCI6XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLFwic3R5bGVcIjpcImRpc3BsYXk6IG5vbmU7XCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInN5bWJvbFwiLFwiYVwiOntcImlkXCI6XCJhbnRlbm5hLXN2Zy10d2l0dGVyXCIsXCJ2aWV3Qm94XCI6XCIwIDAgNTEyIDUxMlwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJwYXRoXCIsXCJhXCI6e1wiZFwiOlwibTQ1MyAxMzRjLTE0IDYtMzAgMTEtNDYgMTJjMTYtMTAgMjktMjUgMzUtNDRjLTE1IDktMzMgMTYtNTEgMTljLTE1LTE1LTM2LTI1LTU5LTI1Yy00NSAwLTgxIDM2LTgxIDgxYzAgNiAxIDEyIDIgMThjLTY3LTMtMTI3LTM1LTE2Ny04NGMtNyAxMi0xMSAyNS0xMSA0MGMwIDI4IDE1IDUzIDM2IDY4Yy0xMy0xLTI1LTQtMzYtMTFjMCAxIDAgMSAwIDJjMCAzOSAyOCA3MSA2NSA3OWMtNyAyLTE0IDMtMjIgM2MtNSAwLTEwLTEtMTUtMmMxMCAzMiA0MCA1NiA3NiA1NmMtMjggMjItNjMgMzUtMTAxIDM1Yy02IDAtMTMgMC0xOS0xYzM2IDIzIDc4IDM2IDEyNCAzNmMxNDkgMCAyMzAtMTIzIDIzMC0yMzBjMC0zIDAtNyAwLTEwYzE2LTEyIDI5LTI2IDQwLTQyelwifX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcInN5bWJvbFwiLFwiYVwiOntcImlkXCI6XCJhbnRlbm5hLXN2Zy1mYWNlYm9va1wiLFwidmlld0JveFwiOlwiMCAwIDUxMiA1MTJcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwicGF0aFwiLFwiYVwiOntcImRcIjpcIm00MjAgNzJsLTMyOCAwYy0xMSAwLTIwIDktMjAgMjBsMCAzMjhjMCAxMSA5IDIwIDIwIDIwbDE3NyAwbDAtMTQybC00OCAwbDAtNTZsNDggMGwwLTQxYzAtNDggMjktNzQgNzEtNzRjMjAgMCAzOCAyIDQzIDNsMCA0OWwtMjkgMGMtMjMgMC0yOCAxMS0yOCAyN2wwIDM2bDU1IDBsLTcgNTZsLTQ4IDBsMCAxNDJsOTQgMGMxMSAwIDIwLTkgMjAtMjBsMC0zMjhjMC0xMS05LTIwLTIwLTIwelwifX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcInN5bWJvbFwiLFwiYVwiOntcImlkXCI6XCJhbnRlbm5hLXN2Zy1jb21tZW50XCIsXCJ2aWV3Qm94XCI6XCIwIDAgNTEyIDUxMlwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJwYXRoXCIsXCJhXCI6e1wiZFwiOlwibTUxMiAyNTZjMCAzMy0xMSA2NC0zNCA5MmMtMjMgMjgtNTQgNTAtOTMgNjZjLTQwIDE3LTgzIDI1LTEyOSAyNWMtMTMgMC0yNy0xLTQxLTJjLTM4IDMzLTgyIDU2LTEzMiA2OWMtOSAyLTIwIDQtMzIgNmMtNCAwLTcgMC05LTNjLTMtMi00LTQtNS04bDAgMGMtMS0xLTEtMiAwLTRjMC0xIDAtMiAwLTJjMC0xIDEtMiAyLTNsMS0zYzAgMCAxLTEgMi0yYzItMiAyLTMgMy0zYzEtMSA0LTUgOC0xMGM1LTUgOC04IDEwLTEwYzItMyA1LTYgOS0xMmM0LTUgNy0xMCA5LTE0YzMtNSA1LTEwIDgtMTdjMy03IDUtMTQgOC0yMmMtMzAtMTctNTQtMzgtNzEtNjNjLTE3LTI1LTI2LTUxLTI2LTgwYzAtMjUgNy00OCAyMC03MWMxNC0yMyAzMi00MiA1NS01OGMyMy0xNyA1MC0zMCA4Mi0zOWMzMS0xMCA2NC0xNSA5OS0xNWM0NiAwIDg5IDggMTI5IDI1YzM5IDE2IDcwIDM4IDkzIDY2YzIzIDI4IDM0IDU5IDM0IDkyelwifX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcInN5bWJvbFwiLFwiYVwiOntcImlkXCI6XCJhbnRlbm5hLXN2Zy1zZWFyY2hcIixcInZpZXdCb3hcIjpcIjAgMCA1MTIgNTEyXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInBhdGhcIixcImFcIjp7XCJkXCI6XCJtMzQ3IDIzOGMwLTM2LTEyLTY2LTM3LTkxYy0yNS0yNS01NS0zNy05MS0zN2MtMzUgMC02NSAxMi05MCAzN2MtMjUgMjUtMzggNTUtMzggOTFjMCAzNSAxMyA2NSAzOCA5MGMyNSAyNSA1NSAzOCA5MCAzOGMzNiAwIDY2LTEzIDkxLTM4YzI1LTI1IDM3LTU1IDM3LTkweiBtMTQ3IDIzN2MwIDEwLTQgMTktMTEgMjZjLTcgNy0xNiAxMS0yNiAxMWMtMTAgMC0xOS00LTI2LTExbC05OC05OGMtMzQgMjQtNzIgMzYtMTE0IDM2Yy0yNyAwLTUzLTUtNzgtMTZjLTI1LTExLTQ2LTI1LTY0LTQzYy0xOC0xOC0zMi0zOS00My02NGMtMTAtMjUtMTYtNTEtMTYtNzhjMC0yOCA2LTU0IDE2LTc4YzExLTI1IDI1LTQ3IDQzLTY1YzE4LTE4IDM5LTMyIDY0LTQzYzI1LTEwIDUxLTE1IDc4LTE1YzI4IDAgNTQgNSA3OSAxNWMyNCAxMSA0NiAyNSA2NCA0M2MxOCAxOCAzMiA0MCA0MyA2NWMxMCAyNCAxNiA1MCAxNiA3OGMwIDQyLTEyIDgwLTM2IDExNGw5OCA5OGM3IDcgMTEgMTUgMTEgMjV6XCJ9fV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwic3ltYm9sXCIsXCJhXCI6e1wiaWRcIjpcImFudGVubmEtc3ZnLWxlZnRcIixcInZpZXdCb3hcIjpcIjAgMCA1MTIgNTEyXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInBhdGhcIixcImFcIjp7XCJkXCI6XCJtMzY4IDE2MGwtNjQtNjQtMTYwIDE2MCAxNjAgMTYwIDY0LTY0LTk2LTk2elwifX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcInN5bWJvbFwiLFwiYVwiOntcImlkXCI6XCJhbnRlbm5hLXN2Zy1sb2dvXCIsXCJ2aWV3Qm94XCI6XCIwIDAgNTEyIDUxMlwifSxcImZcIjpbXCIgXCIse1widFwiOjcsXCJlXCI6XCJwYXRoXCIsXCJhXCI6e1wiZFwiOlwibTI4MyA1MTBjMTI1LTE3IDIyOS0xMjQgMjI5LTI1MyAwLTE0MS0xMTUtMjU2LTI1Ni0yNTYtMTQxIDAtMjU2IDExNS0yNTYgMjU2IDAgMTMwIDEwOCAyMzcgMjMzIDI1NGwwLTE0OWMtNDgtMTQtODQtNTAtODQtMTAyIDAtNjUgNDMtMTEzIDEwOC0xMTMgNjUgMCAxMDcgNDggMTA3IDExMyAwIDUyLTMzIDg4LTgxIDEwMnpcIn19XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwib1wiOlwiY3NzcmVzZXRcIixcImFcIjp7XCJjbGFzc1wiOltcImFudGVubmEgYW50ZW5uYS10ZXh0LWluZGljYXRvci13aWRnZXQgXCIse1widFwiOjQsXCJmXCI6W1wibm90bG9hZGVkXCJdLFwiblwiOjUxLFwiclwiOlwiY29udGFpbmVyRGF0YS5sb2FkZWRcIn0sXCIgXCIse1widFwiOjQsXCJmXCI6W1wiaGFzcmVhY3Rpb25zXCJdLFwiblwiOjUwLFwieFwiOntcInJcIjpbXCJjb250YWluZXJEYXRhLnJlYWN0aW9uVG90YWxcIl0sXCJzXCI6XCJfMD4wXCJ9fSxcIiBcIix7XCJ0XCI6NCxcImZcIjpbXCJhbnRlbm5hLXN1cHByZXNzXCJdLFwiblwiOjUwLFwiclwiOlwiY29udGFpbmVyRGF0YS5zdXBwcmVzc1wifSxcIiBcIix7XCJ0XCI6MixcInJcIjpcImV4dHJhQ2xhc3Nlc1wifV19LFwiZlwiOlt7XCJ0XCI6OCxcInJcIjpcImxvZ29cIn0sXCIgXCIse1widFwiOjQsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXJlYWN0aW9uLXRvdGFsXCJ9LFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcImNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbFwifV19XSxcIm5cIjo1MCxcInJcIjpcImNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbFwifV19XX0iXX0=
