(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
if (window.ANTENNAIS || window.antenna || window.AntennaApp) {
    // Protect against multiple instances of this script being added to the page (or this script and engage.js)
    return;
}
if (!window.MutationObserver) {
    // Bail out on legacy browsers.
    return;
}

var ScriptLoader = require('./script-loader');
var CssLoader = require('./css-loader');
var GroupSettingsLoader = require('./group-settings-loader');
var TapHelper = require('./tap-helper');
var PageDataLoader = require('./page-data-loader');
var PageScanner = require('./page-scanner');
var Reinitializer = require('./reinitializer');
var XDMAnalytics = require('./xdm-analytics');
var BrowserMetrics = require('./utils/browser-metrics');
var XDMLoader = require('./utils/xdm-loader');

window.AntennaApp = { // TODO flesh out our desired API
    reinitialize: Reinitializer.reinitializeAll
    // teardown?
    // trace?
    // debug?
    // pagedata?
    // groupsettings?
    // need to make sure others (e.g. malicious scripts) can't write data
};

// Step 1 - kick off the asynchronous loading of the Javascript and CSS we need.
CssLoader.load(); // Inject the CSS first because we may soon append more asynchronously, in the groupSettings callback, and we want that CSS to be lower in the document.
ScriptLoader.load(scriptLoaded);

function scriptLoaded() {
    // Step 2 - Once we have our required scripts, fetch the group settings from the server
    GroupSettingsLoader.load(function(groupSettings) {
        if (groupSettings.isHideOnMobile() && BrowserMetrics.isMobile()) {
            return;
        }
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
        setupMobileHelper(groupSettings);
        setupReinitializer(groupSettings);
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
    XDMLoader.createXDMframe(groupSettings.groupId());
}

function fetchPageData(groupSettings) {
    PageDataLoader.load(groupSettings);
}

function scanPage(groupSettings) {
    PageScanner.scan(groupSettings);
}

function setupMobileHelper(groupSettings) {
    TapHelper.setupHelper(groupSettings);
}

function setupReinitializer(groupSettings) {
    Reinitializer.setupReinitialization(groupSettings);
}
},{"./css-loader":11,"./group-settings-loader":15,"./page-data-loader":21,"./page-scanner":23,"./reinitializer":28,"./script-loader":29,"./tap-helper":32,"./utils/browser-metrics":37,"./utils/xdm-loader":61,"./xdm-analytics":62}],2:[function(require,module,exports){
var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var BrowserMetrics = require('./utils/browser-metrics');
var Ractive; require('./utils/ractive-provider').onLoad(function(loadedRactive) { Ractive=loadedRactive; });
var SVGs = require('./svgs');

function createCallToAction(antItemId, pageData, groupSettings) {
    var ractive = Ractive({
        el: $('<div>'),
        data: {
            antItemId: antItemId,
            expandReactions: shouldExpandReactions(groupSettings)
        },
        template: require('../templates/auto-call-to-action.hbs.html'),
        partials: {
            logo: SVGs.logo
        }
    });
    return {
        element: $(ractive.find('.antenna-auto-cta')),
        teardown: function() { ractive.teardown(); }
    };
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
},{"../templates/auto-call-to-action.hbs.html":63,"./svgs":31,"./utils/browser-metrics":37,"./utils/jquery-provider":40,"./utils/ractive-provider":49}],3:[function(require,module,exports){
var Ractive; require('./utils/ractive-provider').onLoad(function(loadedRactive) { Ractive = loadedRactive;});
var SVGs = require('./svgs');

var pageSelector = '.antenna-blocked-page';

function createPage(options) {
    var goBack = options.goBack;
    var element = options.element;
    var ractive = Ractive({
        el: element,
        append: true,
        data: {},
        template: require('../templates/blocked-reaction-page.hbs.html'),
        partials: {
            left: SVGs.left
        }
    });
    ractive.on('back', goBack);
    return {
        selector: pageSelector,
        teardown: function() { ractive.teardown(); }
    };
}

module.exports = {
    createPage: createPage
};
},{"../templates/blocked-reaction-page.hbs.html":64,"./svgs":31,"./utils/ractive-provider":49}],4:[function(require,module,exports){
var Ractive; require('./utils/ractive-provider').onLoad(function(loadedRactive) { Ractive = loadedRactive;});

function createCount($countElement, containerData) {
    var ractive = Ractive({
        el: $countElement,
        magic: true,
        data: {
            containerData: containerData
        },
        template: require('../templates/call-to-action-counter.hbs.html')
    });
    return {
        teardown: function() { ractive.teardown(); }
    };
}

//noinspection JSUnresolvedVariable
module.exports = {
    create: createCount
};
},{"../templates/call-to-action-counter.hbs.html":65,"./utils/ractive-provider":49}],5:[function(require,module,exports){
var Ractive; require('./utils/ractive-provider').onLoad(function(loadedRactive) { Ractive = loadedRactive;});

function createExpandedReactions($expandedReactionsElement, $ctaElement, containerData, groupSettings) {
    var ractive = Ractive({
        el: $expandedReactionsElement,
        magic: true,
        data: {
            containerData: containerData,
            computeExpandedReactions: computeExpandedReactions(groupSettings.defaultReactions($ctaElement))
        },
        template: require('../templates/call-to-action-expanded-reactions.hbs.html')
    });
    return {
        teardown: function() { ractive.teardown(); }
    };
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
},{"../templates/call-to-action-expanded-reactions.hbs.html":66,"./utils/ractive-provider":49}],6:[function(require,module,exports){
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

    var createdWidgets = [];

    if ($ctaLabels) {
        for (var i = 0; i < $ctaLabels.length; i++) {
            createdWidgets.push(CallToActionLabel.create($ctaLabels[i], containerData));
        }
    }

    if ($ctaCounters) {
        for (var i = 0; i < $ctaCounters.length; i++) {
            createdWidgets.push(CallToActionCounter.create($ctaCounters[i], containerData));
        }
    }

    if ($ctaExpandedReactions) {
        for (var i = 0; i < $ctaExpandedReactions.length; i++) {
            createdWidgets.push(CallToActionExpandedReactions.create($ctaExpandedReactions[i], $ctaElement, containerData, groupSettings));
        }
    }

    return {
        teardown: function() {
            $ctaElement.off('.antenna');
            for (var i = 0; i < createdWidgets.length; i++) {
                createdWidgets[i].teardown();
            }
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
},{"./call-to-action-counter":4,"./call-to-action-expanded-reactions":5,"./call-to-action-label":7,"./reactions-widget":27}],7:[function(require,module,exports){
var Ractive; require('./utils/ractive-provider').onLoad(function(loadedRactive) { Ractive = loadedRactive;});

function createLabel($labelElement, containerData) {
    var ractive = Ractive({
        el: $labelElement, // TODO: review the structure of the DOM here. Do we want to render an element into $ctaLabel or just text?
        magic: true,
        data: {
            containerData: containerData
        },
        template: require('../templates/call-to-action-label.hbs.html')
    });
    return {
        teardown: function() { ractive.teardown(); }
    }
}

//noinspection JSUnresolvedVariable
module.exports = {
    create: createLabel
};
},{"../templates/call-to-action-label.hbs.html":67,"./utils/ractive-provider":49}],8:[function(require,module,exports){
var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var AjaxClient = require('./utils/ajax-client');
var User = require('./utils/user');

var Events = require('./events');

function setupCommentArea(reactionProvider, containerData, pageData, groupSettings, callback, ractive) {
    if (groupSettings.requiresApproval()) {
        // Currently, sites that require approval don't support comment input.
        $(ractive.find('.antenna-comment-widgets')).hide();
        return;
    }
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
                    callback(comment, User.optimisticCommentUser());
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
},{"./events":13,"./utils/ajax-client":35,"./utils/jquery-provider":40,"./utils/user":58}],9:[function(require,module,exports){
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
},{"../templates/comment-area-partial.hbs.html":68,"../templates/comments-page.hbs.html":69,"./comment-area-partial":8,"./svgs":31,"./utils/jquery-provider":40,"./utils/ractive-provider":49}],10:[function(require,module,exports){
var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var Ractive; require('./utils/ractive-provider').onLoad(function(loadedRactive) { Ractive = loadedRactive;});
var AjaxClient = require('./utils/ajax-client');
var URLs = require('./utils/urls');
var CommentAreaPartial = require('./comment-area-partial');
var Events = require('./events');
var SVGs = require('./svgs');

var pageSelector = '.antenna-confirmation-page';

function createPage(reactionText, reactionProvider, containerData, pageData, groupSettings, element) {
    var popupWindow;
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
    ractive.on('share-facebook', shareToFacebook);
    ractive.on('share-twitter', shareToTwitter);
    CommentAreaPartial.setup(reactionProvider, containerData, pageData, groupSettings, null, ractive);
    return {
        selector: pageSelector,
        teardown: function() {
            closeShareWindow();
            ractive.teardown();
        }
    };


    function shareToFacebook(ractiveEvent) {
        ractiveEvent.original.preventDefault();
        shareReaction(function(reactionData, shortUrl) {
            Events.postReactionShared('facebook', pageData, containerData, reactionData, groupSettings);
            var shareText = computeShareText(reactionData, 300);
            var imageParam = '';
            if (containerData.type === 'image') {
                imageParam = '&p[images][0]=' + encodeURI(reactionData.content.body);
            }
            return 'http://www.facebook.com/sharer.php?s=100' +
                '&p[url]=' + shortUrl +
                '&p[title]=' + encodeURI(shareText) +
                '&p[summary]=' + encodeURI(shareText) +
                imageParam;
        });
    }

    function shareToTwitter(ractiveEvent) {
        ractiveEvent.original.preventDefault();
        shareReaction(function(reactionData, shortUrl) {
            Events.postReactionShared('twitter', pageData, containerData, reactionData, groupSettings);
            var shareText = computeShareText(reactionData, 110); // Make sure we stay under the 140 char limit (twitter appends additional text like the url)
            var twitterVia = groupSettings.twitterAccount() ? '&via=' + groupSettings.twitterAccount() : '';
            return 'http://twitter.com/intent/tweet?url=' + shortUrl + twitterVia + '&text=' + encodeURI(shareText);
        });
    }

    function shareReaction(computeWindowLocation) {
        closeShareWindow();
        reactionProvider.get(function(reactionData) {
            var window = openShareWindow();
            if (window) {
                AjaxClient.postShareReaction(reactionData, containerData, pageData, function (response) {
                    var url = computeWindowLocation(reactionData, response.short_url);
                    redirectShareWindow(url);
                }, function (message) {
                    console.log("Failed to share reaction: " + message);
                    closeShareWindow();
                    // TODO: engage_full:9818
                    //if ( response.message.indexOf( "Temporary user interaction limit reached" ) != -1 ) {
                    //    ANT.session.showLoginPanel( args );
                    //} else {
                    //    // if it failed, see if we can fix it, and if so, try this function one more time
                    //    ANT.session.handleGetUserFail( args, function() {
                    //        ANT.actions.share_getLink( args );
                    //    });
                    //}
                });
            }
        });
    }

    function closeShareWindow() {
        if (popupWindow && !popupWindow.closed) {
            popupWindow.close();
        }
    }

    function openShareWindow() {
        popupWindow = window.open(URLs.appServerUrl() + URLs.shareWindowUrl(), 'antenna_share_window','menubar=1,resizable=1,width=626,height=436');
        return popupWindow;
    }

    function redirectShareWindow(url) {
        if (popupWindow && !popupWindow.closed) {
            popupWindow.location = url;
        }
    }

    function computeShareText(reactionData, maxTextLength) {
        var shareText = reactionData.text + " » " + '';
        var groupName = groupSettings.groupName();
        switch (containerData.type) {
            case 'image':
                shareText += '[a picture on ' + groupName + '] Check it out: ';
                break;
            case 'media':
                shareText += '[a video on ' + groupName + '] Check it out: ';
                break;
            case 'page':
                shareText += '[an article on ' + groupName + '] Check it out: ';
                break;
            case 'text':
                var maxBodyLength = maxTextLength - shareText.length - 2; // the extra 2 accounts for the quotes we add
                var textBody = reactionData.content.body;
                textBody = textBody.length > maxBodyLength ? textBody.substring(0, maxBodyLength-3) + '...' : textBody;
                shareText += '"' + textBody + '"';
                break;
        }
        return shareText;
    }

}

//noinspection JSUnresolvedVariable
module.exports = {
    create: createPage
};
},{"../templates/comment-area-partial.hbs.html":68,"../templates/confirmation-page.hbs.html":70,"./comment-area-partial":8,"./events":13,"./svgs":31,"./utils/ajax-client":35,"./utils/jquery-provider":40,"./utils/ractive-provider":49,"./utils/urls":57}],11:[function(require,module,exports){
var AppMode = require('./utils/app-mode');
var URLs = require('./utils/urls');

function loadCss() {
    // To make sure none of our content renders on the page before our CSS is loaded, we append a simple inline style
    // element that turns off our elements *before* our CSS links. This exploits the cascade rules - our CSS files appear
    // after the inline style in the document, so they take precedence (and make everything appear) once they're loaded.
    injectCss('.antenna{display:none;}');
    var cssHref = URLs.amazonS3Url() + '/widget-new/antenna.css';
    if (AppMode.offline) {
        cssHref = URLs.appServerUrl() + '/static/widget-new/antenna.css';
    }
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
},{"./utils/app-mode":36,"./utils/urls":57}],12:[function(require,module,exports){
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
    var showPendingApproval = options.showPendingApproval;
    var showProgress = options.showProgress;
    var handleReactionError = options.handleReactionError;
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
    ractive.on('newcustom', newCustomReaction);
    ractive.on('customfocus', customReactionFocus);
    ractive.on('customblur', customReactionBlur);
    ractive.on('pagekeydown', keyboardInput);
    ractive.on('inputkeydown', customReactionInput);

    return {
        selector: pageSelector,
        teardown: function() { ractive.teardown(); }
    };

    function customReactionInput(ractiveEvent) {
        var event = ractiveEvent.original;
        var key = (event.which !== undefined) ? event.which : event.keyCode;
        if (key == 13) { // Enter
            setTimeout(function() { // let the processing of the keyboard event finish before we show the page (otherwise, the confirmation page also receives the keystroke)
                newCustomReaction();
            }, 0);
        } else if (key == 27) { // Escape
            event.target.value = '';
            rootElement(ractive).focus();
        }
        event.stopPropagation();
    }

    function newDefaultReaction(ractiveEvent) {
        var reactionData = ractiveEvent.context;
        var reactionProvider = createReactionProvider();
        showConfirmation(reactionData, reactionProvider); // Optimistically show confirmation for default reactions because they should always be accepted.
        AjaxClient.postNewReaction(reactionData, containerData, pageData, contentData, success, error);

        function success(reaction) {
            reaction = PageData.registerReaction(reaction, containerData, pageData);
            reactionProvider.reactionLoaded(reaction);
            Events.postReactionCreated(pageData, containerData, reaction, groupSettings);
        }

        function error(message) {
            var retry = function() {
                AjaxClient.postNewReaction(reactionData, containerData, pageData, contentData, success, error);
            };
            handleReactionError(message, retry, pageSelector);
        }
    }

    function newCustomReaction() {
        var input = ractive.find('.antenna-defaults-footer input');
        var body = input.value.trim();
        if (body !== '') {
            showProgress(); // Show progress for custom reactions because the server might reject them for a number of reasons
            var reactionData = { text: body };
            var reactionProvider = createReactionProvider();
            input.blur();
            AjaxClient.postNewReaction(reactionData, containerData, pageData, contentData, success, error);
        }

        function success(reaction) {
            if (reaction.approved) {
                showConfirmation(reactionData, reactionProvider);
                reaction = PageData.registerReaction(reaction, containerData, pageData);
                reactionProvider.reactionLoaded(reaction);
            } else {
                // If the reaction isn't approved, don't add it to our data model. Just show feedback and fire an event.
                showPendingApproval(reaction);
            }
            Events.postReactionCreated(pageData, containerData, reaction, groupSettings);
        }

        function error(message) {
            var retry = function() {
                AjaxClient.postNewReaction(reactionData, containerData, pageData, contentData, success, error);
            };
            handleReactionError(message, retry, pageSelector);
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
},{"../templates/defaults-page.hbs.html":71,"./events":13,"./page-data":22,"./utils/ajax-client":35,"./utils/jquery-provider":40,"./utils/ractive-provider":49,"./utils/reactions-widget-layout-utils":52}],13:[function(require,module,exports){
var AjaxClient = require('./utils/ajax-client');
var BrowserMetrics = require('./utils/browser-metrics');
var User = require('./utils/user');

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

function postReactionShared(target, pageData, containerData, reactionData, groupSettings) {
    var eventValue = target; // 'facebook', 'twitter', etc
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
    User.cachedUser(function(userInfo) { // We don't want to create users just for events (e.g. every script load), but add user info if we have it already.
        if (userInfo) {
            event[attributes.userId] = userInfo.user_id;
        }
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
},{"./utils/ajax-client":35,"./utils/browser-metrics":37,"./utils/user":58}],14:[function(require,module,exports){
var Ractive; require('./utils/ractive-provider').onLoad(function(loadedRactive) { Ractive = loadedRactive;});
var SVGs = require('./svgs');

var pageSelector = '.antenna-error-page';

function createPage(options) {
    var element = options.element;
    var goBack = options.goBack;
    var ractive = Ractive({
        el: element,
        append: true,
        data: {},
        template: require('../templates/generic-error-page.hbs.html'),
        partials: {
            left: SVGs.left
        }
    });
    ractive.on('back', goBack);
    return {
        selector: pageSelector,
        teardown: function() { ractive.teardown(); }
    };
}

module.exports = {
    createPage: createPage
};
},{"../templates/generic-error-page.hbs.html":72,"./svgs":31,"./utils/ractive-provider":49}],15:[function(require,module,exports){
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
},{"./group-settings":16,"./utils/ajax-client":35,"./utils/jquery-provider":40,"./utils/urls":57}],16:[function(require,module,exports){
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
    image_attribute: 'content', // TODO: review what this should be (not from engage_full),
    querystring_content: false,
    initial_pin_limit: 3,
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
            var value;
            if (window.antenna_extend) {
                value = window.antenna_extend[key];
            }
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

    function exclusionSelector(key, deprecatedKey) {
        return function() {
            var selectors = [];
            var noAnt = data('no_ant')();
            if (noAnt) {
                selectors.push(noAnt);
            }
            var noReadr = data('no_readr')();
            if (noReadr) {
                selectors.push(noReadr);
            }
            return selectors.join(',');
        }
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
        } else if (window.antenna_extend) {
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
        customCSS += createCustomCSSRule(migrateReactionsBackgroundColorSettings(data('tags_bg_css', '')), '.antenna-reactions-page .antenna-body, .antenna-defaults-page .antenna-body');
        customCSS += createCustomCSSRule(data('tag_box_bg_colors', ''), '.antenna-reaction-box');
        customCSS += createCustomCSSRule(data('tag_box_bg_colors_hover', ''), '.antenna-reaction:hover > .antenna-reaction-box');
        customCSS += createCustomCSSRule(migrateTextColorSettings(data('tag_box_text_colors', '')), '.antenna-reaction-box, .antenna-reaction-comments .antenna-comments-path, .antenna-reaction-location .antenna-location-path');
        customCSS += createCustomCSSRule(migrateFontFamilySetting(data('tag_box_font_family', '')), '.antenna-reaction-box .antenna-reset');
        return customCSS;
    }

    function createCustomCSSRule(declarationsAccessor, selector) {
        var declarations = declarationsAccessor().trim();
        if (declarations) {
            return '\n' + selector + ' {\n    ' + declarations + '\n}';
        }
        return '';
    }

    function migrateReactionsBackgroundColorSettings(backgroundColorAccessor) {
        // TODO: This is temporary code that migrates the current tags_bg_css setting from a raw value to a
        //       CSS declaration. We should migrate all deployed sites to use a CSS declaration and then remove this.
        var backgroundColor = backgroundColorAccessor().trim();
        if (backgroundColor && backgroundColor.indexOf('background') === -1) {
            backgroundColor = 'background-image: ' + backgroundColor;
        }
        return function() {
            return backgroundColor;
        }
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
        groupName: data('name'),
        activeSections: data('active_sections'),
        url: {
            ignoreSubdomain: data('ignore_subdomain'),
            includeQueryString: data('querystring_content'),
            ignoreMediaUrlQuery: data('media_url_ignore_query'),
            canonicalDomain: data('page_tld') // TODO: what to call this exactly. groupDomain? siteDomain? canonicalDomain?
        },
        summarySelector: data('summary_widget_selector'),
        summaryMethod: data('summary_widget_method'),
        isHideOnMobile: data('hideOnMobile'),
        isExpandedMobileSummary: data('summary_widget_expanded_mobile'),
        isHideTapHelper: data('hideDoubleTapMessage'),
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
        requiresApproval: data('requires_approval'),
        defaultReactions: defaultReactions,
        customCSS: computeCustomCSS,
        exclusionSelector: exclusionSelector(),
        language: data('language'),
        twitterAccount: data('twitter')
    }
}

//noinspection JSUnresolvedVariable
module.exports = {
    create: updateFromJSON,
    get: getGroupSettings
};
},{"./events":13,"./utils/jquery-provider":40}],17:[function(require,module,exports){
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

// When we first scan a page, the "hash" is just the URL while we wait to hear back from the server, then it's updated
// to whatever value the server computed. So here we allow our mapping to be updated when that change happens.
function updatePageHash(oldPageHash, newPageHash) {
    pages[newPageHash] = pages[oldPageHash];
    delete pages[oldPageHash];
}

function teardown() {
    pages = {};
}

//noinspection JSUnresolvedVariable
module.exports = {
    getElement: getElement,
    setElement: setElement,
    updatePageHash: updatePageHash,
    teardown: teardown
};
},{}],18:[function(require,module,exports){
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
                return HashedElements.getElement(containerHash, pageData.pageHash) !== undefined;
            }
        },
        template: require('../templates/locations-page.hbs.html'),
        partials: {
            left: SVGs.left,
            film: SVGs.film
        }
    });
    ractive.on('back', goBack);
    ractive.on('reveal', revealContent);
    return {
        selector: pageSelector,
        teardown: function() { ractive.teardown(); }
    };


    function revealContent(ractiveEvent) {
        var locationData = ractiveEvent.context;
        var element = HashedElements.getElement(locationData.containerHash, pageData.pageHash);
        if (element) {
            var event = ractiveEvent.original;
            event.preventDefault();
            event.stopPropagation();
            closeWindow();
            var targetScrollTop = $(element).offset().top - 130;
            $('html,body').animate({scrollTop: targetScrollTop}, 1000);
            if (locationData.kind === 'txt') { // TODO: something better than a string compare. fix this along with the same issue in page-data
                Range.highlight(element.get(0), locationData.location);
                $(document).on('click.antenna', function() {
                    Range.clearHighlights();
                    $(document).off('click.antenna');
                });
            }
            var containerData = PageData.getContainerData(pageData, locationData.containerHash);
            Events.postContentViewed(pageData, containerData,locationData, groupSettings);
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
},{"../templates/locations-page.hbs.html":73,"./events":13,"./hashed-elements":17,"./page-data":22,"./svgs":31,"./utils/jquery-provider":40,"./utils/ractive-provider":49,"./utils/range":50}],19:[function(require,module,exports){
var Ractive; require('./utils/ractive-provider').onLoad(function(loadedRactive) { Ractive = loadedRactive;});
var URLs = require('./utils/urls');
var XDMClient = require('./utils/xdm-client');
var SVGs = require('./svgs');

var pageSelector = '.antenna-login-page';

function createPage(options) {
    var groupSettings = options.groupSettings;
    var goBack = options.goBack;
    var retry = options.retry;
    var element = options.element;
    var ractive = Ractive({
        el: element,
        append: true,
        data: {
            loginPageUrl: computeLoginPageUrl(groupSettings)
        },
        template: require('../templates/login-page.hbs.html'),
        partials: {
            left: SVGs.left
        }
    });
    addResponseHandlers();
    ractive.on('back', function() {
        clearResponseHandlers();
        goBack();
    });
    return {
        selector: pageSelector,
        teardown: function() {
            clearResponseHandlers();
            ractive.teardown();
        }
    };

    function addResponseHandlers() {
        XDMClient.addResponseHandler("close login panel", doRetry);
        XDMClient.addResponseHandler("getUserLoginState", doRetry);
    }

    function clearResponseHandlers() {
        XDMClient.removeResponseHandler("close login panel", doRetry);
        XDMClient.removeResponseHandler("getUserLoginState", doRetry);
    }

    function doRetry() {
        clearResponseHandlers();
        retry();
    }
}

function computeLoginPageUrl(groupSettings) {
    return URLs.appServerUrl() + URLs.loginPageUrl() +
        '?parentUrl=' + window.location.href +
        '&parentHost=' + window.location.protocol + "//" + window.location.host +
        '&group_id=' + groupSettings.groupId() +
        '&group_name=' + groupSettings.groupName();
}

//noinspection JSUnresolvedVariable
module.exports = {
    createPage: createPage
};
},{"../templates/login-page.hbs.html":74,"./svgs":31,"./utils/ractive-provider":49,"./utils/urls":57,"./utils/xdm-client":60}],20:[function(require,module,exports){
var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var Ractive; require('./utils/ractive-provider').onLoad(function(loadedRactive) { Ractive = loadedRactive;});
var ReactionsWidget = require('./reactions-widget');
var SVGs = require('./svgs');

var AppMode = require('./utils/app-mode');
var MutationObserver = require('./utils/mutation-observer');
var ThrottledEvents = require('./utils/throttled-events');
var TouchSupport = require('./utils/touch-support');

var CLASS_ACTIVE = 'antenna-active';

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
        event.stopPropagation();
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
            $rootElement.addClass(CLASS_ACTIVE);
        }, 500);
    });
    $containerElement.on('mouseleave.antenna', function() {
        clearTimeout(activeTimeout);
        setTimeout(function() {
            $rootElement.removeClass(CLASS_ACTIVE);
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
},{"../templates/media-indicator-widget.hbs.html":75,"./reactions-widget":27,"./svgs":31,"./utils/app-mode":36,"./utils/jquery-provider":40,"./utils/mutation-observer":46,"./utils/ractive-provider":49,"./utils/throttled-events":53,"./utils/touch-support":54}],21:[function(require,module,exports){
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
},{"./page-data":22,"./utils/ajax-client":35,"./utils/jquery-provider":40,"./utils/page-utils":47,"./utils/throttled-events":53,"./utils/urls":57}],22:[function(require,module,exports){
var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });

var Events = require('./events');
var HashedElements = require('./hashed-elements');

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
    for (var hash in json.containers) {
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
        // If we've already created/bound a pageData object under the requestedUrl, update the pageHash and move that
        // data over to the hash key
        urlBasedData.pageHash = json.pageHash;
        pages[pageHash] = urlBasedData;
        delete pages[requestedURL];
        // Update the mapping of hashes to page elements so it also knows about the change to the page hash
        HashedElements.updatePageHash(requestedURL, pageHash);
    }
    return getPageData(pageHash);
}

function teardown() {
    pages = {};
    urlHashes = {};
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
    clearIndicatorLimit: clearIndicatorLimit,
    teardown: teardown,
};
},{"./events":13,"./hashed-elements":17,"./utils/jquery-provider":40}],23:[function(require,module,exports){
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

var createdWidgets = [];


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
    setupMutationObserver(groupSettings);
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
    scanForSummaries($page, pageData, groupSettings); // Summary widget may be on the page, but outside the active section
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
    var $summaries = find($element, groupSettings.summarySelector(), true, true); // summary widgets can be inside no-ant sections
    $summaries.each(function() {
        var $summary = $(this);
        var containerData = PageData.getContainerData(pageData, 'page'); // Magic hash for page reactions
        containerData.type = 'page'; // TODO: revisit whether it makes sense to set the type here
        var defaultReactions = groupSettings.defaultReactions($summary); // TODO: do we support customizing the default reactions at this level?
        var summaryWidget = SummaryWidget.create(containerData, pageData, defaultReactions, groupSettings);
        var $summaryElement = summaryWidget.element;
        insertContent($summary, $summaryElement, groupSettings.summaryMethod());
        createdWidgets.push(summaryWidget);
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
                var callToAction = CallToActionIndicator.create({
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
                createdWidgets.push(callToAction);
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
        var autoCta = AutoCallToAction.create(antItemId, pageData, groupSettings);
        $ctaTarget.after(autoCta.element); // TODO: make the insert behavior configurable like the summary
        createdWidgets.push(autoCta);
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
            var textIndicator = TextIndicatorWidget.create({
                    containerData: containerData,
                    containerElement: $textElement,
                    defaultReactions: defaultReactions,
                    pageData: pageData,
                    groupSettings: groupSettings
                }
            );
            var $indicatorElement = textIndicator.element;
            var lastNode = lastContentNode($textElement.get(0));
            if (lastNode.nodeType !== 3) {
                $(lastNode).before($indicatorElement);
            } else {
                $textElement.append($indicatorElement); // TODO is this configurable ala insertContent(...)?
            }
            createdWidgets.push(textIndicator);

            var textReactions = TextReactions.createReactableText({
                containerData: containerData,
                containerElement: $textElement,
                defaultReactions: defaultReactions,
                pageData: pageData,
                groupSettings: groupSettings,
                excludeNode: $indicatorElement.get(0)
            });
            createdWidgets.push(textReactions);
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
        } else if (child.nodeType === 1) {
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
    for (var i = 0; i < $nestedElements.length; i++) {
        if ((computeElementType($($nestedElements[i])) === TYPE_TEXT)) {
            // Don't hash a text element if it contains any other matched text elements
            return false;
        }
    }
    return true;
}

function isCta($element, groupSettings) {
    var compositeSelector = groupSettings.generatedCtaSelector() + ',[ant-item]';
    return $element.is(compositeSelector);
}

// The "image" and "media" paths converge here, because we use the same indicator module for them both.
function scanMedia($mediaElement, type, pageData, groupSettings) {
    var indicator;
    var contentData = computeContentData($mediaElement, groupSettings);
    if (contentData && contentData.dimensions) {
        if (contentData.dimensions.height >= 100 && contentData.dimensions.width >= 100) { // Don't create indicator on elements that are too small
            var hash = computeHash($mediaElement, pageData, groupSettings);
            if (hash) {
                var containerData = PageData.getContainerData(pageData, hash);
                containerData.type = type === TYPE_IMAGE ? 'image' : 'media';
                var defaultReactions = groupSettings.defaultReactions($mediaElement);
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
                createdWidgets.push(indicator);
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

function find($element, selector, addBack, ignoreNoAnt) {
    var result = $element.find(selector);
    if (addBack && selector) { // with an undefined selector, addBack will match and always return the input element (unlike find() which returns an empty match)
        result = result.addBack(selector);
    }
    if (ignoreNoAnt) { // Some pieces of content (e.g. the summary widget) can actually go inside sections tagged no-ant
        return result;
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
    var hash;
    switch (computeElementType($element)) {
        case TYPE_IMAGE:
            var imageUrl = URLs.computeImageUrl($element, groupSettings);
            hash = Hash.hashImage(imageUrl, groupSettings);
            break;
        case TYPE_MEDIA:
            var mediaUrl = URLs.computeMediaUrl($element, groupSettings);
            hash = Hash.hashMedia(mediaUrl, groupSettings);
            break;
        case TYPE_TEXT:
            hash = Hash.hashText($element);
            var increment = 1;
            while (hash && HashedElements.getElement(hash, pageData.pageHash)) {
                hash = Hash.hashText($element, increment++);
            }
            break;
    }
    if (hash) {
        HashedElements.setElement(hash, pageData.pageHash, $element); // Record the relationship between the hash and dom element.
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
                height: parseInt($element.attr('height')) || $element.height() || 0,
                width: parseInt($element.attr('width')) || $element.width() || 0
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
                height: parseInt($element.attr('height')) || $element.height() || 0,
                width: parseInt($element.attr('width')) || $element.width() || 0
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

function setupMutationObserver(groupSettings) {
    MutationObserver.addAdditionListener(elementsAdded);

    function elementsAdded($elements) {
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

function teardown() {
    for (var i = 0; i < createdWidgets.length; i++) {
        createdWidgets[i].teardown();
    }
    createdWidgets = [];
}

//noinspection JSUnresolvedVariable
module.exports = {
    scan: scanAllPages,
    teardown: teardown
};
},{"./auto-call-to-action":2,"./call-to-action-indicator":6,"./hashed-elements":17,"./media-indicator-widget":20,"./page-data":22,"./page-data-loader":21,"./summary-widget":30,"./text-indicator-widget":33,"./text-reactions":34,"./utils/app-mode":36,"./utils/hash":39,"./utils/jquery-provider":40,"./utils/mutation-observer":46,"./utils/page-utils":47,"./utils/urls":57,"./utils/widget-bucket":59}],24:[function(require,module,exports){
var Ractive; require('./utils/ractive-provider').onLoad(function(loadedRactive) { Ractive = loadedRactive;});
var SVGs = require('./svgs');

var pageSelector = '.antenna-pending-page';

function createPage(reactionText, element) {
    var ractive = Ractive({
        el: element,
        append: true,
        data: {
            text: reactionText
        },
        template: require('../templates/pending-reaction-page.hbs.html'),
        partials: {
            left: SVGs.left
        }
    });
    return {
        selector: pageSelector,
        teardown: function() { ractive.teardown(); }
    };
}

module.exports = {
    createPage: createPage
};
},{"../templates/pending-reaction-page.hbs.html":76,"./svgs":31,"./utils/ractive-provider":49}],25:[function(require,module,exports){
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
            event.preventDefault();
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

function teardown() {
    if (ractive) {
        ractive.teardown();
        ractive = undefined;
        clickHandler = undefined;
    }
}

//noinspection JSUnresolvedVariable
module.exports = {
    show: showPopup,
    teardown: teardown
};
},{"../templates/popup-widget.hbs.html":77,"./svgs":31,"./utils/jquery-provider":40,"./utils/ractive-provider":49,"./utils/transition-util":55,"./utils/widget-bucket":59}],26:[function(require,module,exports){
var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var Ractive; require('./utils/ractive-provider').onLoad(function(loadedRactive) { Ractive = loadedRactive;});

var AjaxClient = require('./utils/ajax-client');
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
    var containerElement = options.containerElement; // optional
    var showConfirmation = options.showConfirmation;
    var showDefaults = options.showDefaults;
    var showComments = options.showComments;
    var showLocations = options.showLocations;
    var handleReactionError = options.handleReactionError;
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
            isSummary: isSummary,
            hideCommentInput: groupSettings.requiresApproval() // Currently, sites that require approval don't support comment input.
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
    ractive.on('plusone', plusOne);
    ractive.on('showdefault', showDefaults);
    ractive.on('showcomments', function(ractiveEvent) { showComments(ractiveEvent.context, pageSelector); return false; }); // TODO clean up
    ractive.on('showlocations', function(ractiveEvent) { showLocations(ractiveEvent.context, pageSelector); return false; }); // TODO clean up
    return {
        selector: pageSelector,
        teardown: function() { ractive.teardown(); }
    };

    function arrayAccessor(array) {
        return function(index) {
            return array[index];
        }
    }

    function plusOne(ractiveEvent) {
        var reactionData = ractiveEvent.context;
        var reactionProvider = { // this reaction provider is a no-brainer because we already have a valid reaction (one with an ID)
            get: function(callback) {
                callback(reactionData);
            }
        };
        showConfirmation(reactionData, reactionProvider);
        AjaxClient.postPlusOne(reactionData, containerData, pageData, success, error);

        function success(reactionData) {
            Events.postReactionCreated(pageData, containerData, reactionData, groupSettings);
        }

        function error(message) {
            var retry = function() {
                AjaxClient.postPlusOne(reactionData, containerData, pageData, success, error);
            };
            handleReactionError(message, retry, pageSelector);
        }
    }
}

function sizeToFit($reactionsWindow) {
    return function(node) {
        var $element = $(node).closest('.antenna-reaction-box');
        // While we're sizing the text to fix in the reaction box, we also fix up the width of the reaction count and
        // plus one buttons so that they're the same. These two visually swap with each other on hover; making them
        // the same width makes sure we don't get jumpiness on hover.
        var $reactionCount = $element.find('.antenna-reaction-count');
        var $plusOne = $element.find('.antenna-plusone');
        var minWidth = Math.max($reactionCount.width(), $plusOne.width());
        minWidth++; // Add an extra pixel for rounding because elements that measure, for example, 17.1875px can come back with 17 as the width()
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

//noinspection JSUnresolvedVariable
module.exports = {
    create: createPage
};
},{"../templates/reactions-page.hbs.html":78,"./events":13,"./svgs":31,"./utils/ajax-client":35,"./utils/jquery-provider":40,"./utils/ractive-provider":49,"./utils/range":50,"./utils/reactions-widget-layout-utils":52}],27:[function(require,module,exports){
var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var AjaxClient = require('./utils/ajax-client');
var BrowserMetrics = require('./utils/browser-metrics');
var Messages = require('./utils/messages');
var Moveable = require('./utils/moveable');
var Ractive; require('./utils/ractive-provider').onLoad(function(loadedRactive) { Ractive = loadedRactive;});
var Range = require('./utils/range');
var TouchSupport = require('./utils/touch-support');
var TransitionUtil = require('./utils/transition-util');
var User = require('./utils/user');
var WidgetBucket = require('./utils/widget-bucket');

var BlockedReactionPage = require('./blocked-reaction-page');
var CommentsPage = require('./comments-page');
var ConfirmationPage = require('./confirmation-page');
var DefaultsPage = require('./defaults-page');
var Events = require('./events');
var GenericErrorPage = require('./generic-error-page');
var LocationsPage = require('./locations-page');
var LoginPage = require('./login-page');
var PageData = require('./page-data');
var PendingReactionPage = require('./pending-reaction-page');
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
        data: {
            supportsTouch: BrowserMetrics.supportsTouch()
        },
        template: require('../templates/reactions-widget.hbs.html'),
        partials: {
            logo: SVGs.logo
        }
    });

    ractive.on('close', closeAllWindows);
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
        $rootElement.stop(true, true).addClass('antenna-reactions-open').css(coords);

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

    function showReactions(animate) {
        var options = {
            isSummary: isSummary,
            reactionsData: reactionsData,
            pageData: pageData,
            groupSettings: groupSettings,
            containerData: containerData,
            containerElement: containerElement,
            showConfirmation: showConfirmation,
            showDefaults: function() { showDefaultReactionsPage(true) },
            showComments: showComments,
            showLocations: showLocations,
            handleReactionError: handleReactionError,
            element: pageContainer(ractive),
            reactionsWindow: $rootElement
        };
        var page = ReactionsPage.create(options);
        pages.push(page);
        showPage(page.selector, $rootElement, animate, false);
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
            showPendingApproval: showPendingApproval,
            showProgress: showProgressPage,
            handleReactionError: handleReactionError,
            element: pageContainer(ractive),
            reactionsWindow: $rootElement
        };
        setWindowTitle(Messages.getMessage('reactions_widget__title_think'));
        var page = DefaultsPage.create(options);
        pages.push(page);
        showPage(page.selector, $rootElement, animate);
    }

    function showConfirmation(reactionData, reactionProvider) {
        setWindowTitle(Messages.getMessage('reactions_widget__title_thanks'));
        var page = ConfirmationPage.create(reactionData.text, reactionProvider, containerData, pageData, groupSettings, pageContainer(ractive));
        pages.push(page);
        // TODO: revisit why we need to use the timeout trick for the confirm page, but not for the defaults page
        setTimeout(function() { // In order for the positioning animation to work, we need to let the browser render the appended DOM element
            showPage(page.selector, $rootElement, true);
        }, 1);
    }

    function showPendingApproval(reaction) {
        setWindowTitle(Messages.getMessage('reactions_widget__title_thanks'));
        var page = PendingReactionPage.createPage(reaction.text, pageContainer(ractive));
        pages.push(page);
        // TODO: revisit why we need to use the timeout trick for the confirm page, but not for the defaults page
        setTimeout(function() { // In order for the positioning animation to work, we need to let the browser render the appended DOM element
            showPage(page.selector, $rootElement, true);
        }, 1);
    }

    function showProgressPage() {
        showPage('.antenna-progress-page', $rootElement, false, true);
    }

    function showComments(reaction, backPageSelector) {
        showProgressPage(); // TODO: provide some way for the user to give up / cancel. Also, handle errors fetching comments.
        var success = function(comments) {
            var options = {
                reaction: reaction,
                comments: comments,
                element: pageContainer(ractive),
                goBack: function() {
                    setWindowTitle(Messages.getMessage('reactions_widget__title'));
                    goBackToPage(pages, backPageSelector, $rootElement);
                },
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
        };
        var error = function(message) {
            console.log('An error occurred fetching comments: ' + message);
            showGenericErrorPage(backPageSelector);
        };
        AjaxClient.getComments(reaction, success, error);
    }

    function showLocations(reaction, backPageSelector) {
        showProgressPage(); // TODO: provide some way for the user to give up / cancel. Also, handle errors fetching comments.
        var reactionLocationData = PageData.getReactionLocationData(reaction, pageData);
        var success = function(locationDetails) {
            PageData.updateReactionLocationData(reactionLocationData, locationDetails);
            var options = { // TODO: clean up the number of these "options" objects that we create.
                element: pageContainer(ractive),
                reactionLocationData: reactionLocationData,
                pageData: pageData,
                groupSettings: groupSettings,
                closeWindow: closeAllWindows,
                goBack: function() {
                    setWindowTitle(Messages.getMessage('reactions_widget__title'));
                    goBackToPage(pages, backPageSelector, $rootElement);
                }
            };
            var page = LocationsPage.create(options);
            pages.push(page);
            setWindowTitle(reaction.text);
            // TODO: revisit
            setTimeout(function() { // In order for the positioning animation to work, we need to let the browser render the appended DOM element
                showPage(page.selector, $rootElement, true);
            }, 1);
            Events.postLocationsViewed(pageData, groupSettings);
        };
        var error = function(message) {
            console.log('An error occurred fetching content bodies: ' + message);
            showGenericErrorPage(backPageSelector);
        };
        AjaxClient.fetchLocationDetails(reactionLocationData, pageData, success, error);
    }

    // Shows the login page, with a prompt to go Back to the page specified by the given page selector.
    function showLoginPage(backPageSelector, retryCallback) {
        setWindowTitle(Messages.getMessage('reactions_widget__title_signin'));
        var options = {
            element: pageContainer(ractive),
            groupSettings: groupSettings,
            goBack: function() {
                setWindowTitle(Messages.getMessage('reactions_widget__title'));
                goBackToPage(pages, backPageSelector, $rootElement);
            },
            retry: retryCallback
        };
        var page = LoginPage.createPage(options);
        pages.push(page);

        // TODO: revisit why we need to use the timeout trick for the confirm page, but not for the defaults page
        setTimeout(function() { // In order for the positioning animation to work, we need to let the browser render the appended DOM element
            showPage(page.selector, $rootElement, true);
        }, 1);
    }

    function showBlockedReactionPage(backPageSelector) {
        setWindowTitle(Messages.getMessage('reactions_widget__title_blocked'));
        var options = {
            element: pageContainer(ractive),
            groupSettings: groupSettings,
            goBack: function() {
                setWindowTitle(Messages.getMessage('reactions_widget__title'));
                goBackToPage(pages, backPageSelector, $rootElement);
            }
        };
        var page = BlockedReactionPage.createPage(options);
        pages.push(page);

        // TODO: revisit why we need to use the timeout trick for the confirm page, but not for the defaults page
        setTimeout(function() { // In order for the positioning animation to work, we need to let the browser render the appended DOM element
            showPage(page.selector, $rootElement, true);
        }, 1);
    }

    function showGenericErrorPage(backPageSelector) {
        setWindowTitle(Messages.getMessage('reactions_widget__title_error'));
        var options = {
            element: pageContainer(ractive),
            goBack: function() {
                setWindowTitle(Messages.getMessage('reactions_widget__title'));
                goBackToPage(pages, backPageSelector, $rootElement);
            }
        };
        var page = GenericErrorPage.createPage(options);
        pages.push(page);

        // TODO: revisit why we need to use the timeout trick for the confirm page, but not for the defaults page
        setTimeout(function() { // In order for the positioning animation to work, we need to let the browser render the appended DOM element
            showPage(page.selector, $rootElement, true);
        }, 1);
    }

    function handleReactionError(message, retryCallback, backPageSelector) {
        if (message.indexOf('sign in required for organic reactions') !== -1) {
            showLoginPage(backPageSelector, retryCallback);
        } else if (message.indexOf('Group has blocked this tag.') !== -1) {
            showBlockedReactionPage(backPageSelector);
        } else if (isTokenError(message)) {
            User.reAuthorizeUser(function(hasNewToken) {
                if (hasNewToken) {
                    retryCallback();
                } else {
                    showLoginPage(backPageSelector, retryCallback);
                }
            });
        } else {
            console.log("error posting reaction: " + message);
            showGenericErrorPage(backPageSelector);
        }

        function isTokenError(message) {
            switch(message) {
                case "Token was invalid":
                case "Facebook token expired":
                case "FB graph error - token invalid":
                case "Social Auth does not exist for user":
                case "Data to create token is missing":
                    return true;
            }
            return false;
        }
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

    var $current = $rootElement.find('.antenna-page-active').not(pageSelector);
    if (overlay) {
        // In the overlay case, size the page to match whatever page is currently showing and then make it active (there will be two 'active' pages)
        $page.height($current.height());
        $page.addClass('antenna-page-active');
    } else if (animate) {
        TransitionUtil.toggleClass($page, 'antenna-page-active', true, function() {
            // After the new page slides into position, move the other pages back out of the viewable area
            $current.removeClass('antenna-page-active');
            $page.focus();
        });
        sizeBodyToFit($rootElement, $page, animate);
    } else {
        $page.addClass('antenna-page-active');
        $current.removeClass('antenna-page-active');
        $page.focus();
        sizeBodyToFit($rootElement, $page, animate);
    }
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
        var remainingPages = [];
        for (var i = 0; i < pages.length; i++) {
            var page = pages[i];
            if (page.selector === pageSelector) {
                remainingPages.push(page);
            } else {
                page.teardown();
            }
        }
        pages = remainingPages;
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
            event.stopPropagation();
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
            $rootElement.removeClass('antenna-reactions-open');

            for (var i = 0; i < pages.length; i++) {
                pages[i].teardown();
            }
            ractive.teardown();
        });
        Range.clearHighlights();
        $rootElement.off('.antenna'); // Unbind all of the handlers in our namespace
        $(document).off('click.antenna');
        tapListener.teardown();
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
    selector: SELECTOR_REACTIONS_WIDGET,
    teardown: closeAllWindows
};
},{"../templates/reactions-widget.hbs.html":79,"./blocked-reaction-page":3,"./comments-page":9,"./confirmation-page":10,"./defaults-page":12,"./events":13,"./generic-error-page":14,"./locations-page":18,"./login-page":19,"./page-data":22,"./pending-reaction-page":24,"./reactions-page":26,"./svgs":31,"./utils/ajax-client":35,"./utils/browser-metrics":37,"./utils/jquery-provider":40,"./utils/messages":44,"./utils/moveable":45,"./utils/ractive-provider":49,"./utils/range":50,"./utils/touch-support":54,"./utils/transition-util":55,"./utils/user":58,"./utils/widget-bucket":59}],28:[function(require,module,exports){
var GroupSettings = require('./group-settings');
var HashedElements = require('./hashed-elements');
var PageData = require('./page-data');
var PageDataLoader = require('./page-data-loader');
var PageScanner = require('./page-scanner');
var PopupWidget = require('./popup-widget');
var ReactionsWidget = require('./reactions-widget');

var MutationObserver = require('./utils/mutation-observer');

function reinitializeAll() {
    var groupSettings = GroupSettings.get();
    if (groupSettings) {
        reinitialize(groupSettings);
    } else {
        console.log('Antenna cannot be reinitialized. Group settings are not loaded.');
    }
}

function reinitialize(groupSettings) {
    ReactionsWidget.teardown();
    PopupWidget.teardown();
    PageScanner.teardown();
    PageData.teardown();
    HashedElements.teardown();
    MutationObserver.teardown();

    PageDataLoader.load(groupSettings);
    PageScanner.scan(groupSettings);

    setupReinitialization(groupSettings); // need to setup again after tearing down the mutation observer.
}

function setupReinitialization(groupSettings) {
    var browserUrl = computeBrowserUrl(groupSettings);
    MutationObserver.addAdditionListener(function($elements) {
        var newBrowserUrl = computeBrowserUrl(groupSettings);
        if (browserUrl != newBrowserUrl) {
            browserUrl = newBrowserUrl;
            reinitialize(groupSettings);
        }
    });


    function computeBrowserUrl(groupSettings) {
        // We manually construct the URL so that we can leave out the search and hash portions.
        var port = (window.location.port ? ':' + window.location.port : '');
        var query = groupSettings.url.includeQueryString() && window.location.search ? window.location.search : '';
        return (window.location.protocol + '//' + window.location.hostname + port + window.location.pathname).toLowerCase() + query;
    }
}

module.exports = {
    setupReinitialization: setupReinitialization,
    reinitializeAll: reinitializeAll
};
},{"./group-settings":16,"./hashed-elements":17,"./page-data":22,"./page-data-loader":21,"./page-scanner":23,"./popup-widget":25,"./reactions-widget":27,"./utils/mutation-observer":46}],29:[function(require,module,exports){
var RactiveProvider = require('./utils/ractive-provider');
var RangyProvider = require('./utils/rangy-provider');
var JQueryProvider = require('./utils/jquery-provider');
var AppMode = require('./utils/app-mode');
var URLs = require('./utils/urls');

var scripts = [
    {src: '//cdnjs.cloudflare.com/ajax/libs/jquery/2.1.4/jquery.min.js', callback: JQueryProvider.loaded},
    // TODO minify our compiled Ractive and host it on a CDN
    {src: URLs.amazonS3Url() + '/widget-new/lib/ractive.runtime-0.7.3.min.js', callback: RactiveProvider.loaded, aboutToLoad: RactiveProvider.aboutToLoad},
    // TODO minify our compiled Randy and host it on a CDN
    {src: URLs.amazonS3Url() + '/widget-new/lib/rangy.compiled-1.3.0.min.js', callback: RangyProvider.loaded, aboutToLoad: RangyProvider.aboutToLoad}
];
if (AppMode.offline) {
    // Use the offline versions of the libraries for development.
    scripts = [
        {src: URLs.appServerUrl() + '/static/js/cdn/jquery/2.1.4/jquery.js', callback: JQueryProvider.loaded},
        {src: URLs.appServerUrl() + '/static/widget-new/lib/ractive.runtime-0.7.3.js', callback: RactiveProvider.loaded, aboutToLoad: RactiveProvider.aboutToLoad},
        {src: URLs.appServerUrl() + '/static/widget-new/lib/rangy.compiled-1.3.0.js', callback: RangyProvider.loaded, aboutToLoad: RangyProvider.aboutToLoad}
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
},{"./utils/app-mode":36,"./utils/jquery-provider":40,"./utils/ractive-provider":49,"./utils/rangy-provider":51,"./utils/urls":57}],30:[function(require,module,exports){
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
            event.stopPropagation();
            openReactionsWindow(containerData, pageData, defaultReactions, groupSettings, ractive);
        }
    });
    return {
        element: $rootElement,
        teardown: function() { ractive.teardown(); }
    };
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
},{"../templates/summary-widget.hbs.html":80,"./reactions-widget":27,"./svgs":31,"./utils/browser-metrics":37,"./utils/jquery-provider":40,"./utils/ractive-provider":49,"./utils/touch-support":54}],31:[function(require,module,exports){
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
    left: require('../templates/svg-left.hbs.html'),
    film: require('../templates/svg-film.hbs.html')
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
    left: getSVG(templates.left),
    film: getSVG(templates.film)
};
},{"../templates/svg-comments.hbs.html":81,"../templates/svg-facebook.hbs.html":82,"../templates/svg-film.hbs.html":83,"../templates/svg-left.hbs.html":84,"../templates/svg-location.hbs.html":85,"../templates/svg-logo-selectable.hbs.html":86,"../templates/svg-logo.hbs.html":87,"../templates/svg-twitter.hbs.html":88,"../templates/svgs.hbs.html":89,"./utils/ractive-provider":49}],32:[function(require,module,exports){
var Ractive; require('./utils/ractive-provider').onLoad(function(loadedRactive) { Ractive = loadedRactive;});
var BrowserMetrics = require('./utils/browser-metrics');
var SVGs = require('./svgs');
var WidgetBucket = require('./utils/widget-bucket');

function setupHelper(groupSettings) {
    if (!isDismissed() && !groupSettings.isHideTapHelper() && BrowserMetrics.supportsTouch()) {
        var ractive = Ractive({
            el: WidgetBucket.get(),
            append: true,
            data: {},
            template: require('../templates/tap-helper.hbs.html'),
            partials: {
                logo: SVGs.logo
            }
        });
        ractive.on('dismiss', dismiss);
    }

    function dismiss() {
        ractive.teardown();
        setDismissed(true);
    }
}

function setDismissed(dismissed) {
    localStorage.setItem('hideDoubleTapMessage', dismissed);
}

function isDismissed() {
    return localStorage.getItem('hideDoubleTapMessage');
}

module.exports = {
    setupHelper: setupHelper
};
},{"../templates/tap-helper.hbs.html":90,"./svgs":31,"./utils/browser-metrics":37,"./utils/ractive-provider":49,"./utils/widget-bucket":59}],33:[function(require,module,exports){
var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var Ractive; require('./utils/ractive-provider').onLoad(function(loadedRactive) { Ractive = loadedRactive;});
var Range = require('./utils/range');
var TouchSupport = require('./utils/touch-support');

var PopupWidget = require('./popup-widget');
var ReactionsWidget = require('./reactions-widget');
var SVGs = require('./svgs');

var CLASS_ACTIVE = 'antenna-active';

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
    var tapSupport = TouchSupport.setupTap($rootElement.get(0), function(event) {
        event.preventDefault();
        event.stopPropagation();
        openReactionsWindow(reactionWidgetOptions, ractive);
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
        $rootElement.addClass(CLASS_ACTIVE);
    });
    $containerElement.on('mouseleave.antenna', function() {
        $rootElement.removeClass(CLASS_ACTIVE);
    });
    return {
        element: $rootElement,
        teardown: function() {
            $containerElement.off('.antenna');
            ractive.teardown();
            tapSupport.teardown();
        }
    };
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
},{"../templates/text-indicator-widget.hbs.html":91,"./popup-widget":25,"./reactions-widget":27,"./svgs":31,"./utils/jquery-provider":40,"./utils/ractive-provider":49,"./utils/range":50,"./utils/touch-support":54}],34:[function(require,module,exports){
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

    var tapEvents = setupTapEvents($containerElement.get(0), reactionsWidgetOptions);
    $containerElement.on('mouseup.antenna', function(event) {
        if (containerData.loaded) {
            var node = $containerElement.get(0);
            var point = Range.getSelectionEndPoint(node, event, excludeNode);
            if (point) {
                var coordinates = {top: point.y, left: point.x};
                PopupWidget.show(coordinates, grabSelectionAndOpen(node, coordinates, reactionsWidgetOptions, excludeNode));
            }
        }
    });
    return {
        teardown: function() {
            tapEvents.teardown();
            $containerElement.off('.antenna');
        }
    }
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

function setupTapEvents(element, reactionsWidgetOptions) {
    return TouchSupport.setupTap(element, function(event) {
        if (!ReactionsWidget.isOpen() && $(event.target).closest('a').length === 0) {
            event.preventDefault();
            event.stopPropagation();
            var touch = event.changedTouches[0];
            var coords = { top: touch.pageY, left: touch.pageX };
            grabNodeAndOpen(element, reactionsWidgetOptions, coords);
        }
    });
}

//noinspection JSUnresolvedVariable
module.exports = {
    createReactableText: createReactableText
};
},{"./popup-widget":25,"./reactions-widget":27,"./utils/jquery-provider":40,"./utils/range":50,"./utils/touch-support":54}],35:[function(require,module,exports){
// TODO: needs a better name once the scope is clear

var $; require('./jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var AppMode = require('./app-mode');
var URLs = require('./urls');
var User = require('./user');


function postNewReaction(reactionData, containerData, pageData, contentData, success, error) {
    var contentBody = contentData.body;
    var contentType = contentData.type;
    var contentLocation = contentData.location;
    var contentDimensions = contentData.dimensions;
    User.fetchUser(function(userInfo) {
        // TODO extract the shape of this data and possibly the whole API call
        var data = {
            tag: {
                body: reactionData.text,
                is_default: reactionData.isDefault !== undefined && reactionData.isDefault // false unless specified
            },
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
    User.fetchUser(function(userInfo) {
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
    User.fetchUser(function(userInfo) {
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

// TODO: We need to review the API so that it returns/accepts a uniform set of values.
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
            containerData.reactions.sort(function(a, b) {
                return b.count - a.count;
            });
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
        parentID: response.interaction.id,
        approved: response.approved === undefined || response.approved
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

function getComments(reaction, successCallback, errorCallback) {
    User.fetchUser(function(userInfo) {
        var data = {
            reaction_id: reaction.parentID,
            user_id: userInfo.user_id,
            ant_token: userInfo.ant_token
        };
        getJSONP(URLs.fetchCommentUrl(), data, function(response) {
            successCallback(commentsFromResponse(response));
        }, errorCallback);
    });
}

function fetchLocationDetails(reactionLocationData, pageData, successCallback, errorCallback) {
    var contentIDs = Object.getOwnPropertyNames(reactionLocationData);
    User.fetchUser(function(userInfo) {
        var data = {
            user_id: userInfo.user_id,
            ant_token: userInfo.ant_token,
            content_ids: contentIDs
        };
        getJSONP(URLs.fetchContentBodiesUrl(), data, successCallback, errorCallback);
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

function postShareReaction(reactionData, containerData, pageData, success, failure) {
    User.fetchUser(function(userInfo) {
        var contentData = reactionData.content;
        var data = {
            tag: { // TODO: why does the ShareHandler create a reaction if it doesn't exist? How can you share a reaction that hasn't happened?
                id: reactionData.id,
                body: reactionData.text
            },
            hash: containerData.hash,
            container_kind: containerData.type,
            content_node_data: { // TODO: why does the ShareHandler create a content if it doesn't exist? How can you share a reaction that hasn't happened?
                id: contentData.id,
                body: contentData.text,
                location: contentData.location,
                kind: contentNodeDataKind(containerData.type)
            },
            user_id: userInfo.user_id,
            ant_token: userInfo.ant_token,
            group_id: pageData.groupId,
            page_id: pageData.pageId,
            referring_int_id: reactionData.parentID
        };
        getJSONP(URLs.shareReactionUrl(), data, success, failure);
    });
}

function getJSONP(url, data, success, error) {
    var baseUrl = URLs.appServerUrl();
    doGetJSONP(baseUrl, url, data, success, error);
}

function postEvent(event) {
    var baseUrl = URLs.eventsServerUrl();
    if (AppMode.debug) {
        console.log('ANTENNA Posting event: ' + JSON.stringify(event));
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
    postShareReaction: postShareReaction,
    fetchLocationDetails: fetchLocationDetails,
    postEvent: postEvent
};
},{"./app-mode":36,"./jquery-provider":40,"./urls":57,"./user":58}],36:[function(require,module,exports){
var URLConstants = require('./url-constants');

function computeCurrentScriptSrc() {
    if (document.currentScript) {
        return document.currentScript.src;
    }
    // IE fallback...
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
        var script = scripts[i];
        if (script.hasAttribute('src')) {
            var scriptSrc = script.getAttribute('src');
            var antennaScripts = [ 'antenna.js', 'antenna.min.js', 'engage.js', 'engage_full.js' ];
            for (var j = 0; j < antennaScripts.length; j++) {
                if (scriptSrc.indexOf(antennaScripts[j]) !== -1) {
                    return scriptSrc;
                }
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
},{"./url-constants":56}],37:[function(require,module,exports){

var isTouchBrowser;
var isMobileDevice;

function supportsTouch() {
    if (isTouchBrowser === undefined) {
        //isTouchBrowser = (navigator.msMaxTouchPoints || "ontouchstart" in window) && ((window.matchMedia("only screen and (max-width: 768px)")).matches);
        isTouchBrowser = "ontouchstart" in window;
    }
    return isTouchBrowser;
}

function isMobile() {
    if (isMobileDevice === undefined) {
        isMobileDevice = supportsTouch() &&
            ((window.matchMedia("only screen and (max-width: 480px) and (orientation: portrait)")).matches ||
            (window.matchMedia("only screen and (max-width: 640px) and (orientation: landscape)")).matches);
    }
    return isMobileDevice;
}

module.exports = {
    supportsTouch: supportsTouch,
    isMobile: isMobile
};
},{}],38:[function(require,module,exports){

// Re-usable support for managing a collection of callback functions.

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
        var callbacks = getCallbacks();
        for (var i = 0; i < callbacks.length; i++) {
            callbacks[i]();
        }
    }

    function isEmpty() {
        return Object.getOwnPropertyNames(callbacks).length === 0;
    }

    function teardown() {
        callbacks = {};
    }

    return {
        add: addCallback,
        remove: removeCallback,
        get: getCallbacks,
        isEmpty: isEmpty,
        invokeAll: invokeAll,
        teardown: teardown
    }
}

//noinspection JSUnresolvedVariable
module.exports = {
    create: createCallbacks
};
},{}],39:[function(require,module,exports){
var $; require('./jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var MD5 = require('./md5');

function getCleanText($element) {
    var $clone = $element.clone();
    // Remove any elements that we don't want included in the text calculation
    $clone.find('iframe, img, script, video, .antenna, .no-ant').remove().end();
    // Then manually convert any <br> tags into spaces (otherwise, words will get appended by the text() call)
    var html = $clone.html().replace(/<\Sbr\S\/?>/gi, ' ');
    // Put the HTML back into a div and call text(), which does most of the heavy lifting
    var text = $('<div>' + html + '</div>').text().toLowerCase().trim();
    text = text.replace(/[\n\r\t]/gi, ' '); // Replace any newlines/tabs with spaces
    return text;
}

function hashText(element, suffix) {
    var text = getCleanText(element);
    if (text) {
        var hashText = "rdr-text-" + text;
        if (suffix !== undefined) { // Append the optional suffix
            hashText += '-' + suffix;
        }
        return MD5.hex_md5(hashText);
    }
}

function hashUrl(url) {
    return MD5.hex_md5(url);
}

function hashImage(imageUrl, groupSettings) {
    if (imageUrl && imageUrl.length > 0) {
        imageUrl = fiddleWithImageAndMediaUrls(imageUrl, groupSettings);
        var hashText = 'rdr-img-' + imageUrl;
        return MD5.hex_md5(hashText);
    }
}

function hashMedia(mediaUrl, groupSettings) {
    if (mediaUrl && mediaUrl.length > 0) {
        mediaUrl = fiddleWithImageAndMediaUrls(mediaUrl, groupSettings);
        var hashText = 'rdr-media-' + mediaUrl;
        return MD5.hex_md5(hashText);
    }
}

// TODO: review. copied from engage_full
function fiddleWithImageAndMediaUrls(url, groupSettings) {
    // fiddle with the url to account for rotating subdomains (i.e., differing CDN names for image hosts)
    // regex from http://stackoverflow.com/questions/6449340/how-to-get-top-level-domain-base-domain-from-the-url-in-javascript
    // modified to support 2 character suffixes, like .fm or .io
    var HOSTDOMAIN = /[-\w]+\.(?:[-\w]+\.xn--[-\w]+|[-\w]{2,}|[-\w]+\.[-\w]{2})$/i;
    var srcArray = url.split('/');
    srcArray.splice(0,2);

    var domainWithPort = srcArray.shift();
    if (!domainWithPort) { //this could be undefined if the url not valid or is something like javascript:void
        return url;
    }
    var domain = domainWithPort.split(':')[0]; // get domain, strip port

    var filename = srcArray.join('/');

    // test examples:
    // var match = HOSTDOMAIN.exec('http://media1.ab.cd.on-the-telly.bbc.co.uk/'); // fails: trailing slash
    // var match = HOSTDOMAIN.exec('http://media1.ab.cd.on-the-telly.bbc.co.uk'); // success
    // var match = HOSTDOMAIN.exec('media1.ab.cd.on-the-telly.bbc.co.uk'); // success
    var match = HOSTDOMAIN.exec(domain);
    if (match == null) {
        return url;
    } else {
        url = match[0] + '/' + filename;
    }
    if (groupSettings.url.ignoreMediaUrlQuery() && url.indexOf('?')) {
        url = url.split('?')[0];
    }
    return url;
}

//noinspection JSUnresolvedVariable
module.exports = {
    hashText: hashText,
    hashImage: hashImage,
    hashMedia: hashMedia,
    hashUrl: hashUrl
};
},{"./jquery-provider":40,"./md5":41}],40:[function(require,module,exports){

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
},{}],41:[function(require,module,exports){
/*
 * A JavaScript implementation of the RSA Data Security, Inc. MD5 Message
 * Digest Algorithm, as defined in RFC 1321.
 * Version 2.1 Copyright (C) Paul Johnston 1999 - 2002.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for more info.
 */

var hexcase = 0;
var b64pad  = "";
var chrsz = 8;

function hex_md5(s) {
    return binl2hex(core_md5(str2binl(s), s.length * chrsz));
}

function core_md5(x, len) {
    x[len >> 5] |= 0x80 << ((len) % 32);
    x[(((len + 64) >>> 9) << 4) + 14] = len;
    var a = 1732584193;
    var b = -271733879;
    var c = -1732584194;
    var d = 271733878;
    for (var i = 0; i < x.length; i += 16) {
        var olda = a;
        var oldb = b;
        var oldc = c;
        var oldd = d;

        a = md5_ff(a, b, c, d, x[i + 0], 7, -680876936);
        d = md5_ff(d, a, b, c, x[i + 1], 12, -389564586);
        c = md5_ff(c, d, a, b, x[i + 2], 17, 606105819);
        b = md5_ff(b, c, d, a, x[i + 3], 22, -1044525330);
        a = md5_ff(a, b, c, d, x[i + 4], 7, -176418897);
        d = md5_ff(d, a, b, c, x[i + 5], 12, 1200080426);
        c = md5_ff(c, d, a, b, x[i + 6], 17, -1473231341);
        b = md5_ff(b, c, d, a, x[i + 7], 22, -45705983);
        a = md5_ff(a, b, c, d, x[i + 8], 7, 1770035416);
        d = md5_ff(d, a, b, c, x[i + 9], 12, -1958414417);
        c = md5_ff(c, d, a, b, x[i + 10], 17, -42063);
        b = md5_ff(b, c, d, a, x[i + 11], 22, -1990404162);
        a = md5_ff(a, b, c, d, x[i + 12], 7, 1804603682);
        d = md5_ff(d, a, b, c, x[i + 13], 12, -40341101);
        c = md5_ff(c, d, a, b, x[i + 14], 17, -1502002290);
        b = md5_ff(b, c, d, a, x[i + 15], 22, 1236535329);

        a = md5_gg(a, b, c, d, x[i + 1], 5, -165796510);
        d = md5_gg(d, a, b, c, x[i + 6], 9, -1069501632);
        c = md5_gg(c, d, a, b, x[i + 11], 14, 643717713);
        b = md5_gg(b, c, d, a, x[i + 0], 20, -373897302);
        a = md5_gg(a, b, c, d, x[i + 5], 5, -701558691);
        d = md5_gg(d, a, b, c, x[i + 10], 9, 38016083);
        c = md5_gg(c, d, a, b, x[i + 15], 14, -660478335);
        b = md5_gg(b, c, d, a, x[i + 4], 20, -405537848);
        a = md5_gg(a, b, c, d, x[i + 9], 5, 568446438);
        d = md5_gg(d, a, b, c, x[i + 14], 9, -1019803690);
        c = md5_gg(c, d, a, b, x[i + 3], 14, -187363961);
        b = md5_gg(b, c, d, a, x[i + 8], 20, 1163531501);
        a = md5_gg(a, b, c, d, x[i + 13], 5, -1444681467);
        d = md5_gg(d, a, b, c, x[i + 2], 9, -51403784);
        c = md5_gg(c, d, a, b, x[i + 7], 14, 1735328473);
        b = md5_gg(b, c, d, a, x[i + 12], 20, -1926607734);

        a = md5_hh(a, b, c, d, x[i + 5], 4, -378558);
        d = md5_hh(d, a, b, c, x[i + 8], 11, -2022574463);
        c = md5_hh(c, d, a, b, x[i + 11], 16, 1839030562);
        b = md5_hh(b, c, d, a, x[i + 14], 23, -35309556);
        a = md5_hh(a, b, c, d, x[i + 1], 4, -1530992060);
        d = md5_hh(d, a, b, c, x[i + 4], 11, 1272893353);
        c = md5_hh(c, d, a, b, x[i + 7], 16, -155497632);
        b = md5_hh(b, c, d, a, x[i + 10], 23, -1094730640);
        a = md5_hh(a, b, c, d, x[i + 13], 4, 681279174);
        d = md5_hh(d, a, b, c, x[i + 0], 11, -358537222);
        c = md5_hh(c, d, a, b, x[i + 3], 16, -722521979);
        b = md5_hh(b, c, d, a, x[i + 6], 23, 76029189);
        a = md5_hh(a, b, c, d, x[i + 9], 4, -640364487);
        d = md5_hh(d, a, b, c, x[i + 12], 11, -421815835);
        c = md5_hh(c, d, a, b, x[i + 15], 16, 530742520);
        b = md5_hh(b, c, d, a, x[i + 2], 23, -995338651);

        a = md5_ii(a, b, c, d, x[i + 0], 6, -198630844);
        d = md5_ii(d, a, b, c, x[i + 7], 10, 1126891415);
        c = md5_ii(c, d, a, b, x[i + 14], 15, -1416354905);
        b = md5_ii(b, c, d, a, x[i + 5], 21, -57434055);
        a = md5_ii(a, b, c, d, x[i + 12], 6, 1700485571);
        d = md5_ii(d, a, b, c, x[i + 3], 10, -1894986606);
        c = md5_ii(c, d, a, b, x[i + 10], 15, -1051523);
        b = md5_ii(b, c, d, a, x[i + 1], 21, -2054922799);
        a = md5_ii(a, b, c, d, x[i + 8], 6, 1873313359);
        d = md5_ii(d, a, b, c, x[i + 15], 10, -30611744);
        c = md5_ii(c, d, a, b, x[i + 6], 15, -1560198380);
        b = md5_ii(b, c, d, a, x[i + 13], 21, 1309151649);
        a = md5_ii(a, b, c, d, x[i + 4], 6, -145523070);
        d = md5_ii(d, a, b, c, x[i + 11], 10, -1120210379);
        c = md5_ii(c, d, a, b, x[i + 2], 15, 718787259);
        b = md5_ii(b, c, d, a, x[i + 9], 21, -343485551);

        a = safe_add(a, olda);
        b = safe_add(b, oldb);
        c = safe_add(c, oldc);
        d = safe_add(d, oldd);
    }
    return [a, b, c, d];
}

function md5_cmn(q, a, b, x, s, t) {
    return safe_add(bit_rol(safe_add(safe_add(a, q), safe_add(x, t)), s), b);
}

function md5_ff(a, b, c, d, x, s, t) {
    return md5_cmn((b & c) | ((~b) & d), a, b, x, s, t);
}

function md5_gg(a, b, c, d, x, s, t) {
    return md5_cmn((b & d) | (c & (~d)), a, b, x, s, t);
}

function md5_hh(a, b, c, d, x, s, t) {
    return md5_cmn(b ^ c ^ d, a, b, x, s, t);
}

function md5_ii(a, b, c, d, x, s, t) {
    return md5_cmn(c ^ (b | (~d)), a, b, x, s, t);
}

function safe_add(x, y) {
    var lsw = (x & 0xFFFF) + (y & 0xFFFF);
    var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xFFFF);
}

function bit_rol(num, cnt) {
    return (num << cnt) | (num >>> (32 - cnt));
}

function str2binl(str) {
    var bin = [];
    var mask = (1 << chrsz) - 1;
    for (var i = 0; i < str.length * chrsz; i += chrsz) {
        bin[i >> 5] |= (str.charCodeAt(i / chrsz) & mask) << (i % 32);
    }
    return bin;
}

function binl2hex(binarray) {
    var hex_tab = hexcase ? "0123456789ABCDEF" : "0123456789abcdef";
    var str = "";
    for (var i = 0; i < binarray.length * 4; i++) {
        str += hex_tab.charAt((binarray[i >> 2] >> ((i % 4) * 8 + 4)) & 0xF) + hex_tab.charAt((binarray[i >> 2] >> ((i % 4) * 8)) & 0xF);
    }
    return str;
}

//noinspection JSUnresolvedVariable
module.exports = {
    hex_md5: hex_md5
};
},{}],42:[function(require,module,exports){
//noinspection JSUnresolvedVariable
module.exports = {
    'summary_widget__reactions': 'Reactions',
    'summary_widget__reactions_one': '1 Reaction',
    'summary_widget__reactions_many': '{0} Reactions',

    'reactions_widget__title': 'Reactions',
    'reactions_widget__title_think': 'What do you think?',
    'reactions_widget__title_thanks': 'Thanks for your reaction!',
    'reactions_widget__title_signin': 'Sign in Required',
    'reactions_widget__title_blocked': 'Blocked Reaction',
    'reactions_widget__title_error': 'Error',
    'reactions_widget__back': 'Back',

    'reactions_page__no_reactions': 'No reactions yet!',
    'reactions_page__think': 'What do you think?',

    'media_indicator__think': 'What do you think?',

    'popup_widget__think': 'What do you think?',

    'defaults_page__add': '+ Add Your Own',
    'defaults_page__ok': 'ok',

    'confirmation_page__share': 'Share your reaction:',

    'comments_page__header': '({0}) Comments:',

    'comment_area__add': 'Comment',
    'comment_area__placeholder': 'Add comments or #hashtags',
    'comment_area__thanks': 'Thanks for your comment.',
    'comment_area__count': '<span class="antenna-comment-count"></span> characters left',

    'locations_page__pagelevel': 'To this whole page',
    'locations_page__count_one': '<span class="antenna-location-count">1</span><br>reaction',
    'locations_page__count_many': '<span class="antenna-location-count">{0}</span><br>reactions',
    'locations_page__video': 'Video',

    'call_to_action_label__responses': 'Reactions',
    'call_to_action_label__responses_one': '1 Reaction',
    'call_to_action_label__responses_many': '{0} Reactions',

    'blocked_page__message1': 'This site has blocked some or all of the text in that reaction.',
    'blocked_page__message2': 'Please try something that will be more appropriate for this community.',

    'pending_page__message_appear': 'Your reaction will appear once it is reviewed. All new reactions must meet our community guidelines.',

    'error_page__message': 'Oops! We really value your feedback, but something went wrong.',

    'tap_helper__prompt': 'Tap any paragraph to respond!',
    'tap_helper__close': 'Close'
};
},{}],43:[function(require,module,exports){
//noinspection JSUnresolvedVariable
module.exports = {
    'summary_widget__reactions': 'Reacciones',
    'summary_widget__reactions_one': '1 Reacción',
    'summary_widget__reactions_many': '{0} Reacciones',

    'reactions_widget__title': 'Reacciones',
    'reactions_widget__title_think': '¿Qué piensas?',
    'reactions_widget__title_thanks': '¡Gracias por tu reacción!',
    'reactions_widget__title_signin': 'Sign in Required', // TODO: need a translation
    'reactions_widget__title_blocked': 'Blocked Reaction', // TODO: need a translation
    'reactions_widget__title_error': 'Error', // TODO: need a translation
    'reactions_widget__back': 'Volver',

    'reactions_page__no_reactions': '¡No reacciones!', // TODO: need a translation of "No reactions yet!"
    'reactions_page__think': '¿Qué piensas?',

    'media_indicator__think': '¿Qué piensas?',

    'popup_widget__think': '¿Qué piensas?',

    'defaults_page__add': '+ Añade lo tuyo',
    'defaults_page__ok': 'ok',

    'confirmation_page__share': 'Comparte tu reacción:',

    'comments_page__header': '({0}) Comentas:',

    'comment_area__add': 'Comenta',
    'comment_area__placeholder': 'Añade comentarios o #hashtags',
    'comment_area__thanks': 'Gracias por tu reacción.',
    'comment_area__count': 'Quedan <span class="antenna-comment-count"></span> caracteres',

    'locations_page__pagelevel': 'A esta página', // TODO: need a translation of "To this whole page"
    'locations_page__count_one': '<span class="antenna-location-count">1</span><br>reacción',
    'locations_page__count_many': '<span class="antenna-location-count">{0}</span><br>reacciones',
    'locations_page__video': 'Video',

    'call_to_action_label__responses': 'Reacciones',
    'call_to_action_label__responses_one': '1 Reacción',
    'call_to_action_label__responses_many': '{0} Reacciones',

    'blocked_page__message1': 'This site has blocked some or all of the text in that reaction.', // TODO: translation
    'blocked_page__message2': 'Please try something that will be more appropriate for this community.', // TODO: translation

    'pending_page__message_appear': 'Your reaction will appear once it is reviewed. All new reactions must meet our community guidelines.', // TODO: translation

    'error_page__message': 'Oops! We really value your feedback, but something went wrong.', // TODO: translation

    'tap_helper__prompt': '¡Toca un párrafo para opinar!',
    'tap_helper__close': 'Volver'
};
},{}],44:[function(require,module,exports){
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
},{"../group-settings":16,"./messages-en":42,"./messages-es":43}],45:[function(require,module,exports){
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
},{"./jquery-provider":40}],46:[function(require,module,exports){
var $; require('./jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var CallbackSupport = require('./callback-support');
var Range = require('./range');
var WidgetBucket = require('./widget-bucket');

// TODO: detect whether the browser supports MutationObserver and fallback to Mutations Events

var additionListener;
var removalListener;

var attributeObservers = [];

function addAdditionListener(callback) {
    if (!additionListener) {
        additionListener = createAdditionListener();
    }
    additionListener.addCallback(callback);
}

function createAdditionListener() {
    var callbackSupport = CallbackSupport.create();
    var observer = new MutationObserver(function(mutationRecords) {
        for (var i = 0; i < mutationRecords.length; i++) {
            var addedElements = filteredElements(mutationRecords[i].addedNodes);
            if (addedElements.length > 0) {
                var callbacks = callbackSupport.get();
                for (var j = 0; j < callbacks.length; j++) {
                    callbacks[j](addedElements);
                }
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
    return {
        teardown: function() {
            callbackSupport.teardown();
            observer.disconnect();
        },
        addCallback: function(callback) {
            callbackSupport.add(callback);
        },
        removeCallback: function(callback) {
            callbackSupport.remove(callback);
        }
    };
}

function addRemovalListener(callback) {
    if (!removalListener) {
        removalListener = createRemovalListener();
    }
    removalListener.addCallback(callback);
}

function createRemovalListener() {
    var callbackSupport = CallbackSupport.create();
    var observer = new MutationObserver(function(mutationRecords) {
        for (var i = 0; i < mutationRecords.length; i++) {
            var removedElements = filteredElements(mutationRecords[i].removedNodes);
            if (removedElements.length > 0) {
                var callbacks = callbackSupport.get();
                for (var j = 0; j < callbacks.length; j++) {
                    callbacks[j](removedElements);
                }
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
    return {
        teardown: function() {
            callbackSupport.teardown();
            observer.disconnect();
        },
        addCallback: function(callback) {
            callbackSupport.add(callback);
        },
        removeCallback: function(callback) {
            callbackSupport.remove(callback);
        }
    };
}

// Filter the set of nodes to eliminate anything inside our own DOM elements (otherwise, we generate a ton of chatter)
function filteredElements(nodeList) {
    var filtered = [];
    for (var i = 0; i < nodeList.length; i++) {
        var node = nodeList[i];
        if (node.nodeType === 1) { // Only element nodes. (https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType)
            var $element = $(node);
            if ($element.closest(Range.HIGHLIGHT_SELECTOR + ', .antenna, ' + WidgetBucket.selector()).length === 0) {
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
    attributeObservers.push(observer);
}

function teardown() {
    if (additionListener) {
        additionListener.teardown();
        additionListener = undefined;
    }

    if (removalListener) {
        removalListener.teardown();
        removalListener = undefined;
    }

    for (var i = 0; i < attributeObservers.length; i++) {
        attributeObservers[i].disconnect();
    }
    attributeObservers = [];
}

//noinspection JSUnresolvedVariable
module.exports = {
    addAdditionListener: addAdditionListener,
    addRemovalListener: addRemovalListener,
    addOneTimeAttributeListener: addOneTimeAttributeListener,
    teardown: teardown
};
},{"./callback-support":38,"./jquery-provider":40,"./range":50,"./widget-bucket":59}],47:[function(require,module,exports){
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
        url = removeSubdomainFromPageUrl(url, groupSettings);
        var origin = window.location.origin || window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port: '');
        if (url.indexOf(origin) !== 0 && // Not an absolute URL
                !url.substr(0,2) !== '//' && // Not protocol relative
                !groupSettings.url.ignoreSubdomain()) { // And we weren't not ignoring the subdomain
            if (url.substr(0,1) == '/') {
                url = origin + url;
            } else {
                url = origin + window.location.pathname + url;
            }
        }
        return url;
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
},{"./jquery-provider":40}],48:[function(require,module,exports){
// Antenna changes from original source marked with ORIGINAL
// See the issue we needed to work around here: https://github.com/ractivejs/ractive-events-tap/issues/8

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
			// ORIGINAL if (window.navigator.pointerEnabled) {
			if (window.navigator.pointerEnabled && !('ontouchstart' in window)) {
				node.addEventListener('pointerdown', handleMousedown, false);
			// ORIGINAL } else if (window.navigator.msPointerEnabled) {
			} else if (window.navigator.msPointerEnabled && !('ontouchstart' in window)) {
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
},{}],49:[function(require,module,exports){
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
    loadedRactive.DEBUG = false;
    notifyCallbacks();
}

function cssResetDecorator(node) {
    tagNodeAndChildren(node, 'antenna-reset');
    return { teardown: function() {} };
}

function tagNodeAndChildren(node, clazz) {
    node.className = node.className ? node.className + ' ' + clazz : clazz;
    if (node.children) { // Safari returns undefined when asking for children on an SVG element
        for (var i = 0; i < node.children.length; i++) {
            tagNodeAndChildren(node.children[i], clazz);
        }
    }
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
},{"./messages":44,"./ractive-events-tap":48}],50:[function(require,module,exports){
var $; require('./jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var rangy; require('./rangy-provider').onLoad(function(loadedRangy) { rangy = loadedRangy; });

var highlightClass = 'antenna-highlight';
var highlightedRanges = [];

var classApplier;
function getClassApplier() {
    if (!classApplier) {
        classApplier = rangy.createClassApplier(highlightClass, { elementTagName: 'ins' });
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
        expandAndTrimRange(selection);
        if (selection.containsNode(excludeNode)) {
            var range = selection.getRangeAt(0);
            range.setEndBefore(excludeNode);
            selection.setSingleRange(range);
        }
        if (isValidSelection(selection, node, excludeNode)) {
            var location;
            if (selectionEncompassesNode(selection, node)) {
                location = ':0,:1'; // The user has manually selected the entire node. Normalize the location.
            } else {
                location = rangy.serializeSelection(selection, true, node);
            }
            var text = selection.toString();
            highlightSelection(selection); // Highlighting deselects the text, so do this last.
            callback(text, location);
        }
    }

    function expandAndTrimRange(rangeOrSelection) {
        rangeOrSelection.expand('word', { trim: true, wordOptions: { wordRegex: /\S+\S*/gi } });
    }

    function selectionEncompassesNode(selection, node) {
        var range = getNodeRange(node);
        expandAndTrimRange(range);
        return range.toString() === selection.toString();
    }
}

function isValidSelection(selection, node, excludeNode) {
    return !selection.isCollapsed &&  // Non-empty selection
        selection.rangeCount === 1 && // Single selection
        (!excludeNode || !selection.containsNode(excludeNode, true)) && // Selection doesn't contain anything we've said we don't want (e.g. the indicator)
        nodeContainsSelection(node, selection); // Selection is contained entirely within the node
}

function nodeContainsSelection(node, selection) {
    var commonAncestor = selection.getRangeAt(0).commonAncestorContainer; // commonAncestor could be a text node or some parent element
    return node.contains(commonAncestor) ||
            // The following check is for IE, which doesn't implement "contains" properly for text nodes.
        (commonAncestor.nodeType === 3 && node.contains(commonAncestor.parentNode));
}

function getNodeRange(node) {
    var range = rangy.createRange(document);
    range.selectNodeContents(node);
    var $excluded = $(node).find('.antenna-text-indicator-widget');
    if ($excluded.size() > 0) { // Remove the indicator from the end of the selected range.
        range.setEndBefore($excluded.get(0));
    }
    return range;
}

function grabNode(node, callback) {
    var range = getNodeRange(node);
    var selection = rangy.getSelection();
    selection.setSingleRange(range);
    // We should just be able to serialize the selection, but this gives us inconsistent values in Safari.
    // The value *should* always be :0,:1 when we select an entire node, so we just hardcode it.
    //var location = rangy.serializeSelection(selection, true, node);
    var location = ':0,:1';
    var text = selection.toString().trim();
    if (text.length > 0) {
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
    clearHighlights();
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
    highlight: highlightLocation,
    HIGHLIGHT_SELECTOR: '.' + highlightClass
};
},{"./jquery-provider":40,"./rangy-provider":51}],51:[function(require,module,exports){

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
},{}],52:[function(require,module,exports){
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
},{"./jquery-provider":40}],53:[function(require,module,exports){
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
},{"./callback-support":38}],54:[function(require,module,exports){

// TODO: Consider adding support for the MS proprietary "Pointer Events" API.

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
},{}],55:[function(require,module,exports){


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
},{}],56:[function(require,module,exports){
var PROD_SERVER_URL = "https://www.antenna.is"; // TODO: www? how about antenna.is or api.antenna.is?
var DEV_SERVER_URL = "http://local-static.antenna.is:8081";
var TEST_SERVER_URL = 'http://localhost:3001';
var AMAZON_S3_URL = '//s3.amazonaws.com/readrboard';

var PROD_EVENT_SERVER_URL = 'http://events.antenna.is';
var DEV_EVENT_SERVER_URL = 'http://nodebq.docker:3000';

//noinspection JSUnresolvedVariable
module.exports = {
    PRODUCTION: PROD_SERVER_URL,
    DEVELOPMENT: DEV_SERVER_URL,
    TEST: TEST_SERVER_URL,
    AMAZON_S3: AMAZON_S3_URL,
    PRODUCTION_EVENTS: PROD_EVENT_SERVER_URL,
    DEVELOPMENT_EVENTS: DEV_EVENT_SERVER_URL
};
},{}],57:[function(require,module,exports){
var AppMode = require('./app-mode');
var URLConstants = require('./url-constants');

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

function getShareReactionUrl() {
    return '/api/share/;'
}

function getShareWindowUrl() {
    return '/static/share.html';
}

function getEventUrl() {
    return '/insert'; // Note that this URL is for the event server, not the app server.
}

function getLoginPageUrl() {
    return '/static/widget-new/fb_login.html';
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

function amazonS3Url() {
    return URLConstants.AMAZON_S3;
}

// TODO: refactor usage of app server url + relative routes
function appServerUrl() {
    if (AppMode.test) {
        return URLConstants.TEST;
    } else if (AppMode.offline) {
        return URLConstants.DEVELOPMENT;
    }
    return URLConstants.PRODUCTION;
}

// TODO: refactor usage of events server url + relative routes
function eventsServerUrl() {
    if (AppMode.offline) {
        return URLConstants.DEVELOPMENT_EVENTS;
    }
    return URLConstants.PRODUCTION_EVENTS;
}

//noinspection JSUnresolvedVariable
module.exports = {
    appServerUrl: appServerUrl,
    eventsServerUrl: eventsServerUrl,
    amazonS3Url: amazonS3Url,
    groupSettingsUrl: getGroupSettingsUrl,
    pageDataUrl: getPageDataUrl,
    createReactionUrl: getCreateReactionUrl,
    createCommentUrl: getCreateCommentUrl,
    fetchCommentUrl: getFetchCommentUrl,
    fetchContentBodiesUrl: getFetchContentBodiesUrl,
    shareReactionUrl: getShareReactionUrl,
    shareWindowUrl: getShareWindowUrl,
    loginPageUrl: getLoginPageUrl,
    computeImageUrl: computeImageUrl,
    computeMediaUrl: computeMediaUrl,
    eventUrl: getEventUrl
};

},{"./app-mode":36,"./url-constants":56}],58:[function(require,module,exports){
var AppMode = require('./app-mode');
var XDMClient = require('./xdm-client');

var cachedUserInfo;

// Fetch the logged in user. Will trigger a network request to create a temporary user if needed.
function fetchUser(callback) {
    XDMClient.fetchUser(function (userInfo) {
        cachedUserInfo = userInfo;
        callback(userInfo);
    });
}

// Returns the logged-in user, if we already have one. Will not trigger a network request.
function cachedUser(callback) {
    callback(cachedUserInfo);
}

// Attempts to create a new authorization token for the logged-in user.
function reAuthorizeUser(callback) {
    var oldToken = cachedUserInfo ? cachedUserInfo.ant_token : undefined;
    XDMClient.reAuthorizeUser(function (userInfo) {
        cachedUserInfo = userInfo;
        var hasNewToken = userInfo && userInfo.ant_token && userInfo.ant_token !== oldToken;
        callback(hasNewToken);
    });
}

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
//       1. Use the logged in user, assuming the cached user has social_user info
//       2. Use a generic "you" representation like we're doing now.
//       3. Don't show any indication of the user. Just show the comment.
//       For now, this is just giving us some notion of user without a round trip.
function optimisticCommentUser() {
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
    optimisticCommentUser: optimisticCommentUser,
    fetchUser: fetchUser,
    cachedUser: cachedUser,
    reAuthorizeUser: reAuthorizeUser
};
},{"./app-mode":36,"./xdm-client":60}],59:[function(require,module,exports){
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
},{}],60:[function(require,module,exports){
var CallbackSupport = require('./callback-support');
var XdmLoader = require('./xdm-loader');

// Register ourselves to hear messages
window.addEventListener("message", receiveMessage, false);

var responseHandlers = {};

addResponseHandler('xdm loaded', xdmLoaded);

function addResponseHandler(messageKey, callback) {
    var handlers = getResponseHandlers(messageKey);
    handlers.add(callback);
}

function removeResponseHandler(messageKey, callback) {
    var handlers = getResponseHandlers(messageKey);
    handlers.remove(callback);
}

var isXDMLoaded = false;
// The initial message that XDM sends out when it loads
function xdmLoaded(data) {
    isXDMLoaded = true;
}

function setMessageHandler(messageKey, callback) {
    if (callback) {
        callback.persistent = true; // Set the flag which tells us that this isn't a typical one-time callback.
    }
    addResponseHandler(messageKey, callback);
}

function fetchUser(callback) {
    postMessage('getUser', 'sendUser', success);

    function success(response) {
        var userInfo = response.detail;
        callback(userInfo);
    }
}

function reAuthorizeUser(callback) {
    postMessage('reauthUser', 'sendUser', success);

    function success(response) {
        var userInfo = response.detail;
        callback(userInfo);
    }
}

function getResponseHandlers(messageKey) {
    var handlers = responseHandlers[messageKey];
    if (!handlers) {
        handlers = CallbackSupport.create();
        responseHandlers[messageKey] = handlers;
    }
    return handlers;
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

        var messageKey = response.key;
        var handlers = getResponseHandlers(messageKey);
        var callbacks = handlers.get();
        for (var i = 0; i < callbacks.length; i++) {
            var callback = callbacks[i];
            callback(response);
            if (!callback.persistent) {
                removeResponseHandler(messageKey, callback);
            }
        }
    }
}

function postMessage(sendKey, responseKey, callback) {
    if (isXDMLoaded) {
        var xdmFrame = getXDMFrame();
        if (xdmFrame) {
            addResponseHandler(responseKey, callback);
            xdmFrame.postMessage(sendKey, XdmLoader.ORIGIN);
        }
    } else {
        queueMessage(sendKey, responseKey, callback);
    }
}

var messageQueue = [];
var messageQueueTimer;

function queueMessage(sendKey, responseKey, callback) {
    // TODO: Review this idea. The main message we really need to queue up is the getUser request as part of the "group settings loaded"
    // event which fires very early (possibly "page data loaded" too). But what about the rest of the widget? Should we even show
    // the reaction window if the XDM frame isn't ready? Or should the widget wait to become visible until XDM is ready like the
    // way it waits for page data to load?
    messageQueue.push({sendKey: sendKey, responseKey: responseKey, callback: callback});
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
                    postMessage(dequeued.sendKey, dequeued.responseKey, dequeued.callback);
                }
                messageQueue = [];
            }
        }, 50);
    }
}

function getXDMFrame() {
    // TODO: Is this a security problem? What prevents someone from using this same name and intercepting our messages?
    return window.frames['ant-xdm-hidden'];
}

module.exports = {
    fetchUser: fetchUser,
    reAuthorizeUser: reAuthorizeUser,
    setMessageHandler: setMessageHandler,
    addResponseHandler: addResponseHandler,
    removeResponseHandler: removeResponseHandler
};
},{"./callback-support":38,"./xdm-loader":61}],61:[function(require,module,exports){
var $; require('./jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var AppMode = require('./app-mode');
var URLConstants = require('./url-constants');
var WidgetBucket = require('./widget-bucket');

var XDM_ORIGIN = AppMode.offline ? URLConstants.DEVELOPMENT : URLConstants.PRODUCTION;

function createXDMframe(groupId) {
    //ANT.session.receiveMessage({}, function() {
    //    ANT.util.userLoginState();
    //});

    var iframeUrl = XDM_ORIGIN + "/static/widget-new/xdm.html",
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
},{"./app-mode":36,"./jquery-provider":40,"./url-constants":56,"./widget-bucket":59}],62:[function(require,module,exports){
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
},{"./events":13,"./group-settings":16,"./page-data":22,"./utils/xdm-client":60}],63:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna antenna-auto-cta"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-auto-cta-inner","ant-cta-for":[{"t":2,"r":"antItemId"}]},"f":[{"t":8,"r":"logo"},{"t":7,"e":"span","a":{"class":"antenna-auto-cta-label","ant-reactions-label-for":[{"t":2,"r":"antItemId"}]}},{"t":4,"f":[{"t":7,"e":"span","a":{"ant-expanded-reactions-for":[{"t":2,"r":"antItemId"}]}}],"n":50,"r":"expandReactions"}]}]}]}
},{}],64:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna-page antenna-blocked-page"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-body"},"f":[{"t":7,"e":"div","v":{"tap":"back"},"a":{"class":"antenna-blocked-back"},"f":[{"t":8,"r":"left"},{"t":2,"x":{"r":["getMessage"],"s":"_0(\"reactions_widget__back\")"}}]}," ",{"t":7,"e":"div","a":{"class":"antenna-blocked-body"},"f":[{"t":7,"e":"div","a":{"class":"antenna-blocked-message"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"blocked_page__message1\")"}}]}," ",{"t":7,"e":"div","a":{"class":"antenna-blocked-message"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"blocked_page__message2\")"}}]}]}]}]}]}
},{}],65:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":4,"f":[{"t":2,"r":"containerData.reactionTotal"}],"n":50,"x":{"r":["containerData.reactionTotal","containerData.loaded"],"s":"_0!==undefined&&_1"}}]}
},{}],66:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":4,"f":[{"t":7,"e":"span","a":{"class":["antenna-cta-expanded-reaction ",{"t":4,"f":["antenna-cta-expanded-first"],"n":50,"x":{"r":["@index"],"s":"_0===0"}}]},"f":[{"t":7,"e":"span","a":{"class":"antenna-cta-expanded-text"},"f":[{"t":2,"r":"./text"}]},{"t":7,"e":"span","a":{"class":"antenna-cta-expanded-count"},"f":[{"t":2,"r":"./count"}]}]}],"x":{"r":["computeExpandedReactions","containerData.reactions"],"s":"_0(_1)"}}]}
},{}],67:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":4,"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"call_to_action_label__responses\")"}}],"n":50,"x":{"r":["containerData.reactionTotal","containerData.loaded"],"s":"_0===undefined||!_1"}},{"t":4,"n":51,"f":[{"t":4,"n":50,"x":{"r":["containerData.reactionTotal"],"s":"_0===1"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"call_to_action_label__responses_one\")"}}]},{"t":4,"n":50,"x":{"r":["containerData.reactionTotal"],"s":"!(_0===1)"},"f":[" ",{"t":2,"x":{"r":["getMessage","containerData.reactionTotal"],"s":"_0(\"call_to_action_label__responses_many\",[_1])"}}]}],"x":{"r":["containerData.reactionTotal","containerData.loaded"],"s":"_0===undefined||!_1"}}]}
},{}],68:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna-comment-area"},"f":[{"t":7,"e":"div","a":{"class":"antenna-comment-widgets"},"f":[{"t":7,"e":"textarea","v":{"input":"inputchanged"},"a":{"class":"antenna-comment-input","placeholder":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"comment_area__placeholder\")"}}],"maxlength":"500"}}," ",{"t":7,"e":"div","a":{"class":"antenna-comment-footer"},"f":[{"t":7,"e":"span","a":{"class":"antenna-comment-limit"},"f":[{"t":3,"x":{"r":["getMessage"],"s":"_0(\"comment_area__count\")"}}]}," ",{"t":7,"e":"button","a":{"id":"antenna-comment-spacer"}}," ",{"t":7,"e":"button","a":{"class":"antenna-comment-submit"},"v":{"tap":"addcomment"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"comment_area__add\")"}}]}]}]}," ",{"t":7,"e":"div","a":{"class":"antenna-comment-waiting"},"f":["..."]}," ",{"t":7,"e":"div","a":{"class":"antenna-comment-received"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"comment_area__thanks\")"}}]}]}]}
},{}],69:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna-page antenna-comments-page"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-body"},"f":[{"t":7,"e":"div","v":{"tap":"back"},"a":{"class":"antenna-comments-back"},"f":[{"t":8,"r":"left"},{"t":2,"x":{"r":["getMessage"],"s":"_0(\"reactions_widget__back\")"}}]}," ",{"t":7,"e":"div","a":{"class":"antenna-comments-header"},"f":[{"t":2,"x":{"r":["getMessage","comments.length"],"s":"_0(\"comments_page__header\",[_1])"}}]}," ",{"t":4,"f":[{"t":7,"e":"div","a":{"class":["antenna-comment-entry ",{"t":4,"f":["antenna-comment-new"],"n":50,"r":"./new"}]},"f":[{"t":7,"e":"table","f":[{"t":7,"e":"tr","f":[{"t":7,"e":"td","a":{"class":"antenna-comment-cell"},"f":[{"t":7,"e":"img","a":{"src":[{"t":2,"r":"./user.imageURL"}]}}]}," ",{"t":7,"e":"td","a":{"class":"antenna-comment-author"},"f":[{"t":2,"r":"./user.name"}]}]}," ",{"t":7,"e":"tr","f":[{"t":7,"e":"td","f":[]}," ",{"t":7,"e":"td","a":{"class":"antenna-comment-text"},"f":[{"t":2,"r":"./text"}]}]}]}]}],"i":"index","r":"comments"}," ",{"t":8,"r":"commentArea"}]}]}]}
},{}],70:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna-page antenna-confirmation-page"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-body"},"f":[{"t":7,"e":"div","a":{"class":"antenna-comment-reaction"},"f":[{"t":2,"r":"text"}]}," ",{"t":8,"r":"commentArea"}]}," ",{"t":7,"e":"div","a":{"class":"antenna-footer antenna-confirm-footer"},"f":[{"t":7,"e":"span","a":{"class":"antenna-share"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"confirmation_page__share\")"}}," ",{"t":7,"e":"a","v":{"tap":"share-facebook"},"a":{"href":"//facebook.com"},"f":[{"t":8,"r":"facebookIcon"}]}," ",{"t":7,"e":"a","v":{"tap":"share-twitter"},"a":{"href":"//twitter.com"},"f":[{"t":8,"r":"twitterIcon"}]}]}]}]}]}
},{}],71:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","v":{"keydown":"pagekeydown"},"a":{"class":"antenna-page antenna-defaults-page","tabindex":"0"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-body"},"f":[{"t":4,"f":[{"t":7,"e":"div","v":{"tap":"newreaction"},"a":{"class":["antenna-reaction ",{"t":2,"x":{"r":["defaultLayoutClass","index"],"s":"_0(_1)"}}]},"f":[{"t":7,"e":"div","a":{"class":"antenna-reaction-box"},"f":[{"t":7,"e":"div","a":{"class":"antenna-reaction-text"},"o":"sizetofit","f":[{"t":2,"r":"./text"}]}]}]}],"i":"index","r":"defaultReactions"}]}," ",{"t":7,"e":"div","a":{"class":"antenna-footer antenna-defaults-footer"},"f":[{"t":7,"e":"div","a":{"class":"antenna-custom-area"},"f":[{"t":7,"e":"input","v":{"focus":"customfocus","keydown":"inputkeydown","blur":"customblur"},"a":{"value":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"defaults_page__add\")"}}],"maxlength":"25"}}," ",{"t":7,"e":"button","v":{"tap":"newcustom"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"defaults_page__ok\")"}}]}]}," ",{"t":7,"e":"div","a":{"class":"antenna-text-logo"},"f":[{"t":7,"e":"a","a":{"href":"//www.antenna.is"},"f":["Antenna"]}]}]}]}]}
},{}],72:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna-page antenna-error-page"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-body"},"f":[{"t":7,"e":"div","v":{"tap":"back"},"a":{"class":"antenna-error-back"},"f":[{"t":8,"r":"left"},{"t":2,"x":{"r":["getMessage"],"s":"_0(\"reactions_widget__back\")"}}]}," ",{"t":7,"e":"div","a":{"class":"antenna-error-body"},"f":[{"t":7,"e":"div","a":{"class":"antenna-error-message"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"error_page__message\")"}}]}]}]}]}]}
},{}],73:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna-page antenna-locations-page"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-body"},"f":[{"t":7,"e":"div","v":{"tap":"back"},"a":{"class":"antenna-locations-back"},"f":[{"t":8,"r":"left"},{"t":2,"x":{"r":["getMessage"],"s":"_0(\"reactions_widget__back\")"}}]}," ",{"t":7,"e":"table","a":{"class":"antenna-locations-table"},"f":[{"t":4,"f":[{"t":7,"e":"tr","a":{"class":"antenna-locations-content-row"},"f":[{"t":7,"e":"td","a":{"class":"antenna-locations-count-cell"},"f":[{"t":4,"f":[{"t":3,"x":{"r":["getMessage"],"s":"_0(\"locations_page__count_one\")"}}],"n":50,"x":{"r":["pageReactionCount"],"s":"_0===1"}},{"t":4,"n":51,"f":[{"t":3,"x":{"r":["getMessage","pageReactionCount"],"s":"_0(\"locations_page__count_many\",[_1])"}}],"x":{"r":["pageReactionCount"],"s":"_0===1"}}]}," ",{"t":7,"e":"td","a":{"class":"antenna-locations-page-body"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"locations_page__pagelevel\")"}}]}]}],"n":50,"r":"pageReactionCount"}," ",{"t":4,"f":[{"t":4,"f":[" ",{"t":7,"e":"tr","v":{"tap":"reveal"},"a":{"class":["antenna-locations-content-row ",{"t":4,"f":["antenna-locate"],"n":50,"x":{"r":["canLocate","./containerHash"],"s":"_0(_1)"}}]},"f":[{"t":7,"e":"td","a":{"class":"antenna-locations-count-cell"},"f":[{"t":4,"f":[{"t":3,"x":{"r":["getMessage"],"s":"_0(\"locations_page__count_one\")"}}],"n":50,"x":{"r":["./count"],"s":"_0===1"}},{"t":4,"n":51,"f":[{"t":3,"x":{"r":["getMessage","./count"],"s":"_0(\"locations_page__count_many\",[_1])"}}],"x":{"r":["./count"],"s":"_0===1"}}]}," ",{"t":4,"f":[{"t":7,"e":"td","a":{"class":"antenna-locations-text-body"},"f":[{"t":2,"r":"./body"}]}],"n":50,"x":{"r":["./kind"],"s":"_0===\"txt\""}},{"t":4,"n":51,"f":[{"t":4,"n":50,"x":{"r":["./kind"],"s":"_0===\"img\""},"f":[{"t":7,"e":"td","a":{"class":"antenna-locations-image-body"},"f":[{"t":7,"e":"img","a":{"src":[{"t":2,"r":"./body"}]}}]}]},{"t":4,"n":50,"x":{"r":["./kind"],"s":"(!(_0===\"img\"))&&(_0===\"med\")"},"f":[" ",{"t":7,"e":"td","a":{"class":"antenna-locations-media-body"},"f":[{"t":8,"r":"film"},{"t":7,"e":"span","a":{"class":"antenna-locations-video"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"locations_page__video\")"}}]}]}]},{"t":4,"n":50,"x":{"r":["./kind"],"s":"(!(_0===\"img\"))&&(!(_0===\"med\"))"},"f":[" ",{"t":7,"e":"td","f":[" "]}]}],"x":{"r":["./kind"],"s":"_0===\"txt\""}}]}],"n":50,"x":{"r":["./kind"],"s":"_0!==\"pag\""}}],"i":"id","r":"locationData"}]}]}]}]}
},{}],74:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna-page antenna-login-page"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-body"},"f":[{"t":7,"e":"div","v":{"tap":"back"},"a":{"class":"antenna-login-back"},"f":[{"t":8,"r":"left"},{"t":2,"x":{"r":["getMessage"],"s":"_0(\"reactions_widget__back\")"}}]}," ",{"t":7,"e":"div","a":{"class":"antenna-login-container"},"f":[{"t":7,"e":"iframe","a":{"class":"antenna-login-iframe","src":[{"t":2,"r":"loginPageUrl"}],"seamless":0}}]}]}]}]}
},{}],75:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"span","o":"cssreset","a":{"class":"antenna antenna-media-indicator-wrapper"},"f":[{"t":7,"e":"span","a":{"class":["antenna antenna-media-indicator-widget ",{"t":4,"f":["antenna-notloaded"],"n":51,"r":"containerData.loaded"}]},"m":[{"t":2,"r":"extraAttributes"}],"f":[{"t":8,"r":"logo"}," ",{"t":4,"f":[{"t":7,"e":"span","a":{"class":"antenna-reaction-total"},"f":[{"t":2,"r":"containerData.reactionTotal"}]}],"n":50,"r":"containerData.reactionTotal"},{"t":4,"n":51,"f":[{"t":7,"e":"span","a":{"class":"antenna-reaction-prompt"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"media_indicator__think\")"}}]}],"r":"containerData.reactionTotal"}]}]}]}
},{}],76:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna-page antenna-pending-page"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-body"},"f":[{"t":7,"e":"div","a":{"class":"antenna-pending-reaction"},"f":[{"t":2,"r":"text"}]}," ",{"t":7,"e":"div","a":{"class":"antenna-pending-message"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"pending_page__message_appear\")"}}]}]}]}]}
},{}],77:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna-popup"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-popup-body"},"f":[{"t":8,"r":"logo"},{"t":7,"e":"span","a":{"class":"antenna-popup-text"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"popup_widget__think\")"}}]}]}]}]}
},{}],78:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna-page antenna-reactions-page"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-body"},"f":[{"t":4,"f":[{"t":4,"f":[{"t":7,"e":"div","v":{"tap":"plusone","mouseenter":"highlight","mouseleave":"clearhighlights"},"a":{"class":["antenna-reaction ",{"t":2,"x":{"r":["reactionsLayoutClass","index","./count"],"s":"_0(_1,_2)"}}]},"f":[" ",{"t":7,"e":"div","a":{"class":"antenna-reaction-box"},"f":[{"t":7,"e":"div","a":{"class":"antenna-reaction-text"},"o":"sizetofit","f":[{"t":2,"r":"./text"}]}," ",{"t":7,"e":"div","a":{"class":"antenna-reaction-count"},"f":[{"t":2,"r":"./count"}]}," ",{"t":7,"e":"div","a":{"class":"antenna-plusone"},"f":["+1"]}," ",{"t":4,"f":[{"t":7,"e":"div","v":{"tap":"showlocations"},"a":{"class":"antenna-reaction-location"},"f":[{"t":8,"r":"locationIcon"}]}],"n":50,"r":"isSummary"},{"t":4,"n":51,"f":[{"t":4,"f":[{"t":7,"e":"div","v":{"tap":"showcomments"},"a":{"class":"antenna-reaction-comments hascomments"},"f":[{"t":8,"r":"commentsIcon"}," ",{"t":2,"r":"./commentCount"}]}],"n":50,"r":"./commentCount"},{"t":4,"n":51,"f":[{"t":4,"f":[{"t":7,"e":"div","a":{"class":"antenna-reaction-comments"},"f":[{"t":8,"r":"commentsIcon"}]}],"n":50,"x":{"r":["hideCommentInput"],"s":"!_0"}}],"r":"./commentCount"}],"r":"isSummary"}]}]}],"i":"index","r":"reactions"}],"n":50,"r":"reactions"}]}," ",{"t":7,"e":"div","a":{"class":"antenna-footer antenna-reactions-footer"},"f":[{"t":4,"f":[{"t":7,"e":"div","v":{"tap":"showdefault"},"a":{"class":"antenna-think"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"reactions_page__think\")"}}]}],"n":50,"r":"reactions"},{"t":4,"n":51,"f":[{"t":7,"e":"div","a":{"class":"antenna-no-reactions"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"reactions_page__no_reactions\")"}}]}],"r":"reactions"}," ",{"t":7,"e":"div","a":{"class":"antenna-text-logo"},"f":[{"t":7,"e":"a","a":{"href":"//www.antenna.is","target":"_blank"},"f":["Antenna"]}]}]}]}]}
},{}],79:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":["antenna antenna-reactions-widget ",{"t":4,"f":["antenna-touch"],"n":50,"r":"supportsTouch"}],"tabindex":"0"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-header"},"f":[{"t":8,"r":"logo"},{"t":7,"e":"span","a":{"class":"antenna-reactions-title"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"reactions_widget__title\")"}}]}," ",{"t":7,"e":"span","v":{"tap":"close"},"a":{"class":"antenna-reactions-close"},"f":["X"]}]}," ",{"t":7,"e":"div","a":{"class":"antenna-page-container"},"f":[" ",{"t":7,"e":"div","a":{"class":"antenna-progress-page antenna-page"},"f":[{"t":7,"e":"div","a":{"class":"antenna-body"},"f":[]}," ",{"t":7,"e":"div","a":{"class":"antenna-progress-spinner"},"f":[{"t":8,"r":"logo"}]}]}]}]}]}
},{}],80:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":["antenna antenna-summary-widget ",{"t":4,"f":["antenna-notloaded"],"n":51,"r":"pageData.summaryLoaded"}]},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-summary-inner"},"f":[{"t":8,"r":"logo"},{"t":7,"e":"span","a":{"class":"antenna-summary-title"},"f":[" ",{"t":4,"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"summary_widget__reactions\")"}}],"n":50,"x":{"r":["pageData.summaryTotal"],"s":"_0===0"}},{"t":4,"n":51,"f":[{"t":4,"n":50,"x":{"r":["pageData.summaryTotal"],"s":"_0===1"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"summary_widget__reactions_one\")"}}]},{"t":4,"n":50,"x":{"r":["pageData.summaryTotal"],"s":"!(_0===1)"},"f":[" ",{"t":2,"x":{"r":["getMessage","pageData.summaryTotal"],"s":"_0(\"summary_widget__reactions_many\",[_1])"}}]}],"x":{"r":["pageData.summaryTotal"],"s":"_0===0"}}]},{"t":4,"f":[" ",{"t":7,"e":"span","a":{"class":["antenna-expanded-reaction ",{"t":4,"f":["antenna-expanded-first"],"n":50,"x":{"r":["@index"],"s":"_0===0"}}]},"f":[{"t":7,"e":"span","a":{"class":"antenna-expanded-text"},"f":[{"t":2,"r":"./text"}]},{"t":7,"e":"span","a":{"class":"antenna-expanded-count"},"f":[{"t":2,"r":"./count"}]}]}],"x":{"r":["computeExpandedReactions","pageData.summaryReactions"],"s":"_0(_1)"}}]}]}]}
},{}],81:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"span","a":{"class":"antenna-comments"},"f":[{"t":7,"e":"svg","f":[{"t":7,"e":"use","a":{"class":"antenna-comments-path","xlink:href":"#antenna-svg-comment"}}]}]}]}
},{}],82:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"span","a":{"class":"antenna-facebook"},"f":[{"t":7,"e":"svg","f":[{"t":7,"e":"use","a":{"class":"antenna-facebook-path","xlink:href":"#antenna-svg-facebook"}}]}]}]}
},{}],83:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"span","a":{"class":"antenna-film"},"f":[{"t":7,"e":"svg","f":[{"t":7,"e":"use","a":{"class":"antenna-film-path","xlink:href":"#antenna-svg-film"}}]}]}]}
},{}],84:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"span","a":{"class":"antenna-left"},"f":[{"t":7,"e":"svg","f":[{"t":7,"e":"use","a":{"class":"antenna-left-path","xlink:href":"#antenna-svg-left"}}]}]}]}
},{}],85:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"span","a":{"class":"antenna-location"},"f":[{"t":7,"e":"svg","f":[{"t":7,"e":"use","a":{"class":"antenna-location-path","xlink:href":"#antenna-svg-search"}}]}]}]}
},{}],86:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"span","a":{"class":"antenna-logo"},"f":[{"t":7,"e":"svg","a":{"viewBox":"0 0 512 512"},"f":[" ",{"t":7,"e":"path","a":{"class":"antenna-logo-path","d":"m283 510c125-17 229-124 229-253 0-141-115-256-256-256-141 0-256 115-256 256 0 130 108 237 233 254l0-149c-48-14-84-50-84-102 0-65 43-113 108-113 65 0 107 48 107 113 0 52-33 88-81 102z"}}]}]}]}
},{}],87:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"span","a":{"class":"antenna-logo"},"f":[{"t":7,"e":"svg","f":[{"t":7,"e":"use","a":{"class":"antenna-logo-path","xlink:href":"#antenna-svg-logo"}}]}]}]}
},{}],88:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"span","a":{"class":"antenna-twitter"},"f":[{"t":7,"e":"svg","f":[{"t":7,"e":"use","a":{"class":"antenna-twitter-path","xlink:href":"#antenna-svg-twitter"}}]}]}]}
},{}],89:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"svg","a":{"xmlns":"http://www.w3.org/2000/svg","style":"display: none;"},"f":[{"t":7,"e":"symbol","a":{"id":"antenna-svg-twitter","viewBox":"0 0 512 512"},"f":[{"t":7,"e":"path","a":{"d":"m453 134c-14 6-30 11-46 12c16-10 29-25 35-44c-15 9-33 16-51 19c-15-15-36-25-59-25c-45 0-81 36-81 81c0 6 1 12 2 18c-67-3-127-35-167-84c-7 12-11 25-11 40c0 28 15 53 36 68c-13-1-25-4-36-11c0 1 0 1 0 2c0 39 28 71 65 79c-7 2-14 3-22 3c-5 0-10-1-15-2c10 32 40 56 76 56c-28 22-63 35-101 35c-6 0-13 0-19-1c36 23 78 36 124 36c149 0 230-123 230-230c0-3 0-7 0-10c16-12 29-26 40-42z"}}]}," ",{"t":7,"e":"symbol","a":{"id":"antenna-svg-facebook","viewBox":"0 0 512 512"},"f":[{"t":7,"e":"path","a":{"d":"m420 72l-328 0c-11 0-20 9-20 20l0 328c0 11 9 20 20 20l177 0l0-142l-48 0l0-56l48 0l0-41c0-48 29-74 71-74c20 0 38 2 43 3l0 49l-29 0c-23 0-28 11-28 27l0 36l55 0l-7 56l-48 0l0 142l94 0c11 0 20-9 20-20l0-328c0-11-9-20-20-20z"}}]}," ",{"t":7,"e":"symbol","a":{"id":"antenna-svg-comment","viewBox":"0 0 512 512"},"f":[{"t":7,"e":"path","a":{"d":"m512 256c0 33-11 64-34 92c-23 28-54 50-93 66c-40 17-83 25-129 25c-13 0-27-1-41-2c-38 33-82 56-132 69c-9 2-20 4-32 6c-4 0-7 0-9-3c-3-2-4-4-5-8l0 0c-1-1-1-2 0-4c0-1 0-2 0-2c0-1 1-2 2-3l1-3c0 0 1-1 2-2c2-2 2-3 3-3c1-1 4-5 8-10c5-5 8-8 10-10c2-3 5-6 9-12c4-5 7-10 9-14c3-5 5-10 8-17c3-7 5-14 8-22c-30-17-54-38-71-63c-17-25-26-51-26-80c0-25 7-48 20-71c14-23 32-42 55-58c23-17 50-30 82-39c31-10 64-15 99-15c46 0 89 8 129 25c39 16 70 38 93 66c23 28 34 59 34 92z"}}]}," ",{"t":7,"e":"symbol","a":{"id":"antenna-svg-search","viewBox":"0 0 512 512"},"f":[{"t":7,"e":"path","a":{"d":"m347 238c0-36-12-66-37-91c-25-25-55-37-91-37c-35 0-65 12-90 37c-25 25-38 55-38 91c0 35 13 65 38 90c25 25 55 38 90 38c36 0 66-13 91-38c25-25 37-55 37-90z m147 237c0 10-4 19-11 26c-7 7-16 11-26 11c-10 0-19-4-26-11l-98-98c-34 24-72 36-114 36c-27 0-53-5-78-16c-25-11-46-25-64-43c-18-18-32-39-43-64c-10-25-16-51-16-78c0-28 6-54 16-78c11-25 25-47 43-65c18-18 39-32 64-43c25-10 51-15 78-15c28 0 54 5 79 15c24 11 46 25 64 43c18 18 32 40 43 65c10 24 16 50 16 78c0 42-12 80-36 114l98 98c7 7 11 15 11 25z"}}]}," ",{"t":7,"e":"symbol","a":{"id":"antenna-svg-left","viewBox":"0 0 512 512"},"f":[{"t":7,"e":"path","a":{"d":"m368 160l-64-64-160 160 160 160 64-64-96-96z"}}]}," ",{"t":7,"e":"symbol","a":{"id":"antenna-svg-logo","viewBox":"0 0 512 512"},"f":[" ",{"t":7,"e":"path","a":{"d":"m283 510c125-17 229-124 229-253 0-141-115-256-256-256-141 0-256 115-256 256 0 130 108 237 233 254l0-149c-48-14-84-50-84-102 0-65 43-113 108-113 65 0 107 48 107 113 0 52-33 88-81 102z"}}]}," ",{"t":7,"e":"symbol","a":{"id":"antenna-svg-film","viewBox":"0 0 512 512"},"f":[{"t":7,"e":"path","a":{"d":"m91 457l0-36c0-5-1-10-5-13-4-4-8-6-13-6l-36 0c-5 0-10 2-13 6-4 3-6 8-6 13l0 36c0 5 2 9 6 13 3 4 8 5 13 5l36 0c5 0 9-1 13-5 4-4 5-8 5-13z m0-110l0-36c0-5-1-9-5-13-4-4-8-5-13-5l-36 0c-5 0-10 1-13 5-4 4-6 8-6 13l0 36c0 5 2 10 6 13 3 4 8 6 13 6l36 0c5 0 9-2 13-6 4-3 5-8 5-13z m0-109l0-37c0-5-1-9-5-13-4-3-8-5-13-5l-36 0c-5 0-10 2-13 5-4 4-6 8-6 13l0 37c0 5 2 9 6 13 3 3 8 5 13 5l36 0c5 0 9-2 13-5 4-4 5-8 5-13z m293 219l0-146c0-5-2-9-5-13-4-4-8-5-13-5l-220 0c-5 0-9 1-13 5-3 4-5 8-5 13l0 146c0 5 2 9 5 13 4 4 8 5 13 5l220 0c5 0 9-1 13-5 3-4 5-8 5-13z m-293-329l0-37c0-5-1-9-5-12-4-4-8-6-13-6l-36 0c-5 0-10 2-13 6-4 3-6 7-6 12l0 37c0 5 2 9 6 13 3 3 8 5 13 5l36 0c5 0 9-2 13-5 4-4 5-8 5-13z m403 329l0-36c0-5-2-10-6-13-3-4-8-6-13-6l-36 0c-5 0-9 2-13 6-4 3-5 8-5 13l0 36c0 5 1 9 5 13 4 4 8 5 13 5l36 0c5 0 10-1 13-5 4-4 6-8 6-13z m-110-219l0-147c0-5-2-9-5-12-4-4-8-6-13-6l-220 0c-5 0-9 2-13 6-3 3-5 7-5 12l0 147c0 5 2 9 5 13 4 3 8 5 13 5l220 0c5 0 9-2 13-5 3-4 5-8 5-13z m110 109l0-36c0-5-2-9-6-13-3-4-8-5-13-5l-36 0c-5 0-9 1-13 5-4 4-5 8-5 13l0 36c0 5 1 10 5 13 4 4 8 6 13 6l36 0c5 0 10-2 13-6 4-3 6-8 6-13z m0-109l0-37c0-5-2-9-6-13-3-3-8-5-13-5l-36 0c-5 0-9 2-13 5-4 4-5 8-5 13l0 37c0 5 1 9 5 13 4 3 8 5 13 5l36 0c5 0 10-2 13-5 4-4 6-8 6-13z m0-110l0-37c0-5-2-9-6-12-3-4-8-6-13-6l-36 0c-5 0-9 2-13 6-4 3-5 7-5 12l0 37c0 5 1 9 5 13 4 3 8 5 13 5l36 0c5 0 10-2 13-5 4-4 6-8 6-13z m36-46l0 384c0 13-4 24-13 33-9 9-20 13-32 13l-458 0c-12 0-23-4-32-13-9-9-13-20-13-33l0-384c0-12 4-23 13-32 9-9 20-13 32-13l458 0c12 0 23 4 32 13 9 9 13 20 13 32z"}}]}]}]}
},{}],90:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna antenna-tap-helper"},"o":"cssreset","v":{"tap":"dismiss"},"f":[{"t":7,"e":"div","a":{"class":"antenna-tap-helper-inner"},"f":[{"t":7,"e":"div","f":[{"t":8,"r":"logo"},{"t":7,"e":"span","a":{"class":"antenna-tap-helper-prompt"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"tap_helper__prompt\")"}}]}]}," ",{"t":7,"e":"div","a":{"class":"antenna-tap-helper-close"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"tap_helper__close\")"}}]}]}]}]}
},{}],91:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"span","o":"cssreset","a":{"class":["antenna antenna-text-indicator-widget ",{"t":4,"f":["antenna-notloaded"],"n":51,"r":"containerData.loaded"}," ",{"t":4,"f":["antenna-hasreactions"],"n":50,"x":{"r":["containerData.reactionTotal"],"s":"_0>0"}}," ",{"t":4,"f":["antenna-suppress"],"n":50,"r":"containerData.suppress"}," ",{"t":2,"r":"extraClasses"}]},"f":[{"t":8,"r":"logo"}," ",{"t":4,"f":[{"t":7,"e":"span","a":{"class":"antenna-reaction-total"},"f":[{"t":2,"r":"containerData.reactionTotal"}]}],"n":50,"r":"containerData.reactionTotal"}]}]}
},{}]},{},[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvYW50ZW5uYS1hcHAuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvYXV0by1jYWxsLXRvLWFjdGlvbi5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9ibG9ja2VkLXJlYWN0aW9uLXBhZ2UuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvY2FsbC10by1hY3Rpb24tY291bnRlci5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9jYWxsLXRvLWFjdGlvbi1leHBhbmRlZC1yZWFjdGlvbnMuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvY2FsbC10by1hY3Rpb24taW5kaWNhdG9yLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL2NhbGwtdG8tYWN0aW9uLWxhYmVsLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL2NvbW1lbnQtYXJlYS1wYXJ0aWFsLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL2NvbW1lbnRzLXBhZ2UuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvY29uZmlybWF0aW9uLXBhZ2UuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvY3NzLWxvYWRlci5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9kZWZhdWx0cy1wYWdlLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL2V2ZW50cy5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9nZW5lcmljLWVycm9yLXBhZ2UuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvZ3JvdXAtc2V0dGluZ3MtbG9hZGVyLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL2dyb3VwLXNldHRpbmdzLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL2hhc2hlZC1lbGVtZW50cy5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9sb2NhdGlvbnMtcGFnZS5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9sb2dpbi1wYWdlLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL21lZGlhLWluZGljYXRvci13aWRnZXQuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvcGFnZS1kYXRhLWxvYWRlci5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9wYWdlLWRhdGEuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvcGFnZS1zY2FubmVyLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3BlbmRpbmctcmVhY3Rpb24tcGFnZS5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9wb3B1cC13aWRnZXQuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvcmVhY3Rpb25zLXBhZ2UuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvcmVhY3Rpb25zLXdpZGdldC5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9yZWluaXRpYWxpemVyLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3NjcmlwdC1sb2FkZXIuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvc3VtbWFyeS13aWRnZXQuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvc3Zncy5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy90YXAtaGVscGVyLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3RleHQtaW5kaWNhdG9yLXdpZGdldC5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy90ZXh0LXJlYWN0aW9ucy5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9hamF4LWNsaWVudC5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9hcHAtbW9kZS5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9icm93c2VyLW1ldHJpY3MuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvY2FsbGJhY2stc3VwcG9ydC5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9oYXNoLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL2pxdWVyeS1wcm92aWRlci5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9tZDUuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvbWVzc2FnZXMtZW4uanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvbWVzc2FnZXMtZXMuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvbWVzc2FnZXMuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvbW92ZWFibGUuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvbXV0YXRpb24tb2JzZXJ2ZXIuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvcGFnZS11dGlscy5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9yYWN0aXZlLWV2ZW50cy10YXAuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvcmFjdGl2ZS1wcm92aWRlci5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9yYW5nZS5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9yYW5neS1wcm92aWRlci5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9yZWFjdGlvbnMtd2lkZ2V0LWxheW91dC11dGlscy5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy90aHJvdHRsZWQtZXZlbnRzLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL3RvdWNoLXN1cHBvcnQuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvdHJhbnNpdGlvbi11dGlsLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL3VybC1jb25zdGFudHMuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvdXJscy5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy91c2VyLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL3dpZGdldC1idWNrZXQuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMveGRtLWNsaWVudC5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy94ZG0tbG9hZGVyLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3hkbS1hbmFseXRpY3MuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL2F1dG8tY2FsbC10by1hY3Rpb24uaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL2Jsb2NrZWQtcmVhY3Rpb24tcGFnZS5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvY2FsbC10by1hY3Rpb24tY291bnRlci5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvY2FsbC10by1hY3Rpb24tZXhwYW5kZWQtcmVhY3Rpb25zLmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9jYWxsLXRvLWFjdGlvbi1sYWJlbC5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvY29tbWVudC1hcmVhLXBhcnRpYWwuaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL2NvbW1lbnRzLXBhZ2UuaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL2NvbmZpcm1hdGlvbi1wYWdlLmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9kZWZhdWx0cy1wYWdlLmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9nZW5lcmljLWVycm9yLXBhZ2UuaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL2xvY2F0aW9ucy1wYWdlLmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9sb2dpbi1wYWdlLmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9tZWRpYS1pbmRpY2F0b3Itd2lkZ2V0Lmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9wZW5kaW5nLXJlYWN0aW9uLXBhZ2UuaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL3BvcHVwLXdpZGdldC5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvcmVhY3Rpb25zLXBhZ2UuaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL3JlYWN0aW9ucy13aWRnZXQuaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL3N1bW1hcnktd2lkZ2V0Lmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9zdmctY29tbWVudHMuaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL3N2Zy1mYWNlYm9vay5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvc3ZnLWZpbG0uaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL3N2Zy1sZWZ0Lmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9zdmctbG9jYXRpb24uaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL3N2Zy1sb2dvLXNlbGVjdGFibGUuaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL3N2Zy1sb2dvLmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9zdmctdHdpdHRlci5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvc3Zncy5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvdGFwLWhlbHBlci5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvdGV4dC1pbmRpY2F0b3Itd2lkZ2V0Lmhicy5odG1sIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25GQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RRQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pRQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDalNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbmlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xVQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BDQTs7QUNBQTs7QUNBQTs7QUNBQTs7QUNBQTs7QUNBQTs7QUNBQTs7QUNBQTs7QUNBQTs7QUNBQTs7QUNBQTs7QUNBQTs7QUNBQTs7QUNBQTs7QUNBQTs7QUNBQTs7QUNBQTs7QUNBQTs7QUNBQTs7QUNBQTs7QUNBQTs7QUNBQTs7QUNBQTs7QUNBQTs7QUNBQTs7QUNBQTs7QUNBQTs7QUNBQTs7QUNBQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJpZiAod2luZG93LkFOVEVOTkFJUyB8fCB3aW5kb3cuYW50ZW5uYSB8fCB3aW5kb3cuQW50ZW5uYUFwcCkge1xuICAgIC8vIFByb3RlY3QgYWdhaW5zdCBtdWx0aXBsZSBpbnN0YW5jZXMgb2YgdGhpcyBzY3JpcHQgYmVpbmcgYWRkZWQgdG8gdGhlIHBhZ2UgKG9yIHRoaXMgc2NyaXB0IGFuZCBlbmdhZ2UuanMpXG4gICAgcmV0dXJuO1xufVxuaWYgKCF3aW5kb3cuTXV0YXRpb25PYnNlcnZlcikge1xuICAgIC8vIEJhaWwgb3V0IG9uIGxlZ2FjeSBicm93c2Vycy5cbiAgICByZXR1cm47XG59XG5cbnZhciBTY3JpcHRMb2FkZXIgPSByZXF1aXJlKCcuL3NjcmlwdC1sb2FkZXInKTtcbnZhciBDc3NMb2FkZXIgPSByZXF1aXJlKCcuL2Nzcy1sb2FkZXInKTtcbnZhciBHcm91cFNldHRpbmdzTG9hZGVyID0gcmVxdWlyZSgnLi9ncm91cC1zZXR0aW5ncy1sb2FkZXInKTtcbnZhciBUYXBIZWxwZXIgPSByZXF1aXJlKCcuL3RhcC1oZWxwZXInKTtcbnZhciBQYWdlRGF0YUxvYWRlciA9IHJlcXVpcmUoJy4vcGFnZS1kYXRhLWxvYWRlcicpO1xudmFyIFBhZ2VTY2FubmVyID0gcmVxdWlyZSgnLi9wYWdlLXNjYW5uZXInKTtcbnZhciBSZWluaXRpYWxpemVyID0gcmVxdWlyZSgnLi9yZWluaXRpYWxpemVyJyk7XG52YXIgWERNQW5hbHl0aWNzID0gcmVxdWlyZSgnLi94ZG0tYW5hbHl0aWNzJyk7XG52YXIgQnJvd3Nlck1ldHJpY3MgPSByZXF1aXJlKCcuL3V0aWxzL2Jyb3dzZXItbWV0cmljcycpO1xudmFyIFhETUxvYWRlciA9IHJlcXVpcmUoJy4vdXRpbHMveGRtLWxvYWRlcicpO1xuXG53aW5kb3cuQW50ZW5uYUFwcCA9IHsgLy8gVE9ETyBmbGVzaCBvdXQgb3VyIGRlc2lyZWQgQVBJXG4gICAgcmVpbml0aWFsaXplOiBSZWluaXRpYWxpemVyLnJlaW5pdGlhbGl6ZUFsbFxuICAgIC8vIHRlYXJkb3duP1xuICAgIC8vIHRyYWNlP1xuICAgIC8vIGRlYnVnP1xuICAgIC8vIHBhZ2VkYXRhP1xuICAgIC8vIGdyb3Vwc2V0dGluZ3M/XG4gICAgLy8gbmVlZCB0byBtYWtlIHN1cmUgb3RoZXJzIChlLmcuIG1hbGljaW91cyBzY3JpcHRzKSBjYW4ndCB3cml0ZSBkYXRhXG59O1xuXG4vLyBTdGVwIDEgLSBraWNrIG9mZiB0aGUgYXN5bmNocm9ub3VzIGxvYWRpbmcgb2YgdGhlIEphdmFzY3JpcHQgYW5kIENTUyB3ZSBuZWVkLlxuQ3NzTG9hZGVyLmxvYWQoKTsgLy8gSW5qZWN0IHRoZSBDU1MgZmlyc3QgYmVjYXVzZSB3ZSBtYXkgc29vbiBhcHBlbmQgbW9yZSBhc3luY2hyb25vdXNseSwgaW4gdGhlIGdyb3VwU2V0dGluZ3MgY2FsbGJhY2ssIGFuZCB3ZSB3YW50IHRoYXQgQ1NTIHRvIGJlIGxvd2VyIGluIHRoZSBkb2N1bWVudC5cblNjcmlwdExvYWRlci5sb2FkKHNjcmlwdExvYWRlZCk7XG5cbmZ1bmN0aW9uIHNjcmlwdExvYWRlZCgpIHtcbiAgICAvLyBTdGVwIDIgLSBPbmNlIHdlIGhhdmUgb3VyIHJlcXVpcmVkIHNjcmlwdHMsIGZldGNoIHRoZSBncm91cCBzZXR0aW5ncyBmcm9tIHRoZSBzZXJ2ZXJcbiAgICBHcm91cFNldHRpbmdzTG9hZGVyLmxvYWQoZnVuY3Rpb24oZ3JvdXBTZXR0aW5ncykge1xuICAgICAgICBpZiAoZ3JvdXBTZXR0aW5ncy5pc0hpZGVPbk1vYmlsZSgpICYmIEJyb3dzZXJNZXRyaWNzLmlzTW9iaWxlKCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICAvLyBTdGVwIDMgLSBPbmNlIHdlIGhhdmUgdGhlIHNldHRpbmdzLCB3ZSBjYW4ga2ljayBvZmYgYSBjb3VwbGUgdGhpbmdzIGluIHBhcmFsbGVsOlxuICAgICAgICAvL1xuICAgICAgICAvLyAtLSBpbmplY3QgYW55IGN1c3RvbSBDU1MgZnJvbSB0aGUgZ3JvdXAgc2V0dGluZ3NcbiAgICAgICAgLy8gLS0gY3JlYXRlIHRoZSBoaWRkZW4gaWZyYW1lIHdlIHVzZSBmb3IgY3Jvc3MtZG9tYWluIGNvb2tpZXMgKHByaW1hcmlseSB1c2VyIGxvZ2luKVxuICAgICAgICAvLyAtLSBzdGFydCBmZXRjaGluZyB0aGUgcGFnZSBkYXRhXG4gICAgICAgIC8vIC0tIHN0YXJ0IGhhc2hpbmcgdGhlIHBhZ2UgYW5kIGluc2VydGluZyB0aGUgYWZmb3JkYW5jZXMgKGluIHRoZSBlbXB0eSBzdGF0ZSlcbiAgICAgICAgLy9cbiAgICAgICAgLy8gQXMgdGhlIHBhZ2UgaXMgc2Nhbm5lZCwgdGhlIHdpZGdldHMgYXJlIGNyZWF0ZWQgYW5kIGJvdW5kIHRvIHRoZSBwYWdlIGRhdGEgdGhhdCBjb21lcyBpbi5cbiAgICAgICAgaW5pdEN1c3RvbUNTUyhncm91cFNldHRpbmdzKTtcbiAgICAgICAgaW5pdFhkbUZyYW1lKGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICBmZXRjaFBhZ2VEYXRhKGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICBzY2FuUGFnZShncm91cFNldHRpbmdzKTtcbiAgICAgICAgc2V0dXBNb2JpbGVIZWxwZXIoZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIHNldHVwUmVpbml0aWFsaXplcihncm91cFNldHRpbmdzKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gaW5pdEN1c3RvbUNTUyhncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGN1c3RvbUNTUyA9IGdyb3VwU2V0dGluZ3MuY3VzdG9tQ1NTKCk7XG4gICAgaWYgKGN1c3RvbUNTUykge1xuICAgICAgICBDc3NMb2FkZXIuaW5qZWN0KGN1c3RvbUNTUyk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBpbml0WGRtRnJhbWUoZ3JvdXBTZXR0aW5ncykge1xuICAgIFhETUFuYWx5dGljcy5zdGFydCgpOyAvLyBUaGUgWERNIGlmcmFtZSBoYXMgYSBudW1iZXIgb2YgbWVzc2FnZXMgaXQgZmlyZXMgb24gbG9hZCByZWxhdGVkIHRvIGFuYWx5dGljcy4gU3RhcnQgbGlzdGVuaW5nLlxuICAgIFhETUxvYWRlci5jcmVhdGVYRE1mcmFtZShncm91cFNldHRpbmdzLmdyb3VwSWQoKSk7XG59XG5cbmZ1bmN0aW9uIGZldGNoUGFnZURhdGEoZ3JvdXBTZXR0aW5ncykge1xuICAgIFBhZ2VEYXRhTG9hZGVyLmxvYWQoZ3JvdXBTZXR0aW5ncyk7XG59XG5cbmZ1bmN0aW9uIHNjYW5QYWdlKGdyb3VwU2V0dGluZ3MpIHtcbiAgICBQYWdlU2Nhbm5lci5zY2FuKGdyb3VwU2V0dGluZ3MpO1xufVxuXG5mdW5jdGlvbiBzZXR1cE1vYmlsZUhlbHBlcihncm91cFNldHRpbmdzKSB7XG4gICAgVGFwSGVscGVyLnNldHVwSGVscGVyKGdyb3VwU2V0dGluZ3MpO1xufVxuXG5mdW5jdGlvbiBzZXR1cFJlaW5pdGlhbGl6ZXIoZ3JvdXBTZXR0aW5ncykge1xuICAgIFJlaW5pdGlhbGl6ZXIuc2V0dXBSZWluaXRpYWxpemF0aW9uKGdyb3VwU2V0dGluZ3MpO1xufSIsInZhciAkOyByZXF1aXJlKCcuL3V0aWxzL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIEJyb3dzZXJNZXRyaWNzID0gcmVxdWlyZSgnLi91dGlscy9icm93c2VyLW1ldHJpY3MnKTtcbnZhciBSYWN0aXZlOyByZXF1aXJlKCcuL3V0aWxzL3JhY3RpdmUtcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24obG9hZGVkUmFjdGl2ZSkgeyBSYWN0aXZlPWxvYWRlZFJhY3RpdmU7IH0pO1xudmFyIFNWR3MgPSByZXF1aXJlKCcuL3N2Z3MnKTtcblxuZnVuY3Rpb24gY3JlYXRlQ2FsbFRvQWN0aW9uKGFudEl0ZW1JZCwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgcmFjdGl2ZSA9IFJhY3RpdmUoe1xuICAgICAgICBlbDogJCgnPGRpdj4nKSxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgYW50SXRlbUlkOiBhbnRJdGVtSWQsXG4gICAgICAgICAgICBleHBhbmRSZWFjdGlvbnM6IHNob3VsZEV4cGFuZFJlYWN0aW9ucyhncm91cFNldHRpbmdzKVxuICAgICAgICB9LFxuICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL2F1dG8tY2FsbC10by1hY3Rpb24uaGJzLmh0bWwnKSxcbiAgICAgICAgcGFydGlhbHM6IHtcbiAgICAgICAgICAgIGxvZ286IFNWR3MubG9nb1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZWxlbWVudDogJChyYWN0aXZlLmZpbmQoJy5hbnRlbm5hLWF1dG8tY3RhJykpLFxuICAgICAgICB0ZWFyZG93bjogZnVuY3Rpb24oKSB7IHJhY3RpdmUudGVhcmRvd24oKTsgfVxuICAgIH07XG59XG5cbmZ1bmN0aW9uIHNob3VsZEV4cGFuZFJlYWN0aW9ucyhncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIHNldHRpbmcgPSBncm91cFNldHRpbmdzLmdlbmVyYXRlZEN0YUV4cGFuZGVkKCk7IC8vIFZhbHVlcyBhcmUgJ25vbmUnLCAnYm90aCcsICdkZXNrdG9wJywgYW5kICdtb2JpbGUnXG4gICAgcmV0dXJuIHNldHRpbmcgPT09ICdib3RoJyB8fFxuICAgICAgICAoc2V0dGluZyA9PT0gJ2Rlc2t0b3AnICYmICFCcm93c2VyTWV0cmljcy5pc01vYmlsZSgpKSB8fFxuICAgICAgICAoc2V0dGluZyA9PT0gJ21vYmlsZScgJiYgQnJvd3Nlck1ldHJpY3MuaXNNb2JpbGUoKSk7XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGU6IGNyZWF0ZUNhbGxUb0FjdGlvblxufTsiLCJ2YXIgUmFjdGl2ZTsgcmVxdWlyZSgnLi91dGlscy9yYWN0aXZlLXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGxvYWRlZFJhY3RpdmUpIHsgUmFjdGl2ZSA9IGxvYWRlZFJhY3RpdmU7fSk7XG52YXIgU1ZHcyA9IHJlcXVpcmUoJy4vc3ZncycpO1xuXG52YXIgcGFnZVNlbGVjdG9yID0gJy5hbnRlbm5hLWJsb2NrZWQtcGFnZSc7XG5cbmZ1bmN0aW9uIGNyZWF0ZVBhZ2Uob3B0aW9ucykge1xuICAgIHZhciBnb0JhY2sgPSBvcHRpb25zLmdvQmFjaztcbiAgICB2YXIgZWxlbWVudCA9IG9wdGlvbnMuZWxlbWVudDtcbiAgICB2YXIgcmFjdGl2ZSA9IFJhY3RpdmUoe1xuICAgICAgICBlbDogZWxlbWVudCxcbiAgICAgICAgYXBwZW5kOiB0cnVlLFxuICAgICAgICBkYXRhOiB7fSxcbiAgICAgICAgdGVtcGxhdGU6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9ibG9ja2VkLXJlYWN0aW9uLXBhZ2UuaGJzLmh0bWwnKSxcbiAgICAgICAgcGFydGlhbHM6IHtcbiAgICAgICAgICAgIGxlZnQ6IFNWR3MubGVmdFxuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmFjdGl2ZS5vbignYmFjaycsIGdvQmFjayk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgc2VsZWN0b3I6IHBhZ2VTZWxlY3RvcixcbiAgICAgICAgdGVhcmRvd246IGZ1bmN0aW9uKCkgeyByYWN0aXZlLnRlYXJkb3duKCk7IH1cbiAgICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGVQYWdlOiBjcmVhdGVQYWdlXG59OyIsInZhciBSYWN0aXZlOyByZXF1aXJlKCcuL3V0aWxzL3JhY3RpdmUtcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24obG9hZGVkUmFjdGl2ZSkgeyBSYWN0aXZlID0gbG9hZGVkUmFjdGl2ZTt9KTtcblxuZnVuY3Rpb24gY3JlYXRlQ291bnQoJGNvdW50RWxlbWVudCwgY29udGFpbmVyRGF0YSkge1xuICAgIHZhciByYWN0aXZlID0gUmFjdGl2ZSh7XG4gICAgICAgIGVsOiAkY291bnRFbGVtZW50LFxuICAgICAgICBtYWdpYzogdHJ1ZSxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgY29udGFpbmVyRGF0YTogY29udGFpbmVyRGF0YVxuICAgICAgICB9LFxuICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL2NhbGwtdG8tYWN0aW9uLWNvdW50ZXIuaGJzLmh0bWwnKVxuICAgIH0pO1xuICAgIHJldHVybiB7XG4gICAgICAgIHRlYXJkb3duOiBmdW5jdGlvbigpIHsgcmFjdGl2ZS50ZWFyZG93bigpOyB9XG4gICAgfTtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZTogY3JlYXRlQ291bnRcbn07IiwidmFyIFJhY3RpdmU7IHJlcXVpcmUoJy4vdXRpbHMvcmFjdGl2ZS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihsb2FkZWRSYWN0aXZlKSB7IFJhY3RpdmUgPSBsb2FkZWRSYWN0aXZlO30pO1xuXG5mdW5jdGlvbiBjcmVhdGVFeHBhbmRlZFJlYWN0aW9ucygkZXhwYW5kZWRSZWFjdGlvbnNFbGVtZW50LCAkY3RhRWxlbWVudCwgY29udGFpbmVyRGF0YSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciByYWN0aXZlID0gUmFjdGl2ZSh7XG4gICAgICAgIGVsOiAkZXhwYW5kZWRSZWFjdGlvbnNFbGVtZW50LFxuICAgICAgICBtYWdpYzogdHJ1ZSxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgY29udGFpbmVyRGF0YTogY29udGFpbmVyRGF0YSxcbiAgICAgICAgICAgIGNvbXB1dGVFeHBhbmRlZFJlYWN0aW9uczogY29tcHV0ZUV4cGFuZGVkUmVhY3Rpb25zKGdyb3VwU2V0dGluZ3MuZGVmYXVsdFJlYWN0aW9ucygkY3RhRWxlbWVudCkpXG4gICAgICAgIH0sXG4gICAgICAgIHRlbXBsYXRlOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvY2FsbC10by1hY3Rpb24tZXhwYW5kZWQtcmVhY3Rpb25zLmhicy5odG1sJylcbiAgICB9KTtcbiAgICByZXR1cm4ge1xuICAgICAgICB0ZWFyZG93bjogZnVuY3Rpb24oKSB7IHJhY3RpdmUudGVhcmRvd24oKTsgfVxuICAgIH07XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVFeHBhbmRlZFJlYWN0aW9ucyhkZWZhdWx0UmVhY3Rpb25zKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHJlYWN0aW9uc0RhdGEpIHtcbiAgICAgICAgdmFyIG1heCA9IDI7XG4gICAgICAgIHZhciBleHBhbmRlZFJlYWN0aW9ucyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJlYWN0aW9uc0RhdGEubGVuZ3RoICYmIGV4cGFuZGVkUmVhY3Rpb25zLmxlbmd0aCA8IG1heDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgcmVhY3Rpb25EYXRhID0gcmVhY3Rpb25zRGF0YVtpXTtcbiAgICAgICAgICAgIGlmIChpc0RlZmF1bHRSZWFjdGlvbihyZWFjdGlvbkRhdGEsIGRlZmF1bHRSZWFjdGlvbnMpKSB7XG4gICAgICAgICAgICAgICAgZXhwYW5kZWRSZWFjdGlvbnMucHVzaChyZWFjdGlvbkRhdGEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBleHBhbmRlZFJlYWN0aW9ucztcbiAgICB9O1xufVxuXG5mdW5jdGlvbiBpc0RlZmF1bHRSZWFjdGlvbihyZWFjdGlvbkRhdGEsIGRlZmF1bHRSZWFjdGlvbnMpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRlZmF1bHRSZWFjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGRlZmF1bHRSZWFjdGlvbnNbaV0udGV4dCA9PT0gcmVhY3Rpb25EYXRhLnRleHQpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZTogY3JlYXRlRXhwYW5kZWRSZWFjdGlvbnNcbn07IiwidmFyIENhbGxUb0FjdGlvbkNvdW50ZXIgPSByZXF1aXJlKCcuL2NhbGwtdG8tYWN0aW9uLWNvdW50ZXInKTtcbnZhciBDYWxsVG9BY3Rpb25FeHBhbmRlZFJlYWN0aW9ucyA9IHJlcXVpcmUoJy4vY2FsbC10by1hY3Rpb24tZXhwYW5kZWQtcmVhY3Rpb25zJyk7XG52YXIgQ2FsbFRvQWN0aW9uTGFiZWwgPSByZXF1aXJlKCcuL2NhbGwtdG8tYWN0aW9uLWxhYmVsJyk7XG52YXIgUmVhY3Rpb25zV2lkZ2V0ID0gcmVxdWlyZSgnLi9yZWFjdGlvbnMtd2lkZ2V0Jyk7XG5cblxuZnVuY3Rpb24gY3JlYXRlSW5kaWNhdG9yV2lkZ2V0KG9wdGlvbnMpIHtcbiAgICB2YXIgY29udGFpbmVyRGF0YSA9IG9wdGlvbnMuY29udGFpbmVyRGF0YTtcbiAgICB2YXIgJGNvbnRhaW5lckVsZW1lbnQgPSBvcHRpb25zLmNvbnRhaW5lckVsZW1lbnQ7XG4gICAgdmFyIGNvbnRlbnREYXRhID0gb3B0aW9ucy5jb250ZW50RGF0YTtcbiAgICB2YXIgJGN0YUVsZW1lbnQgPSBvcHRpb25zLmN0YUVsZW1lbnQ7XG4gICAgdmFyICRjdGFMYWJlbHMgPSBvcHRpb25zLmN0YUxhYmVsczsgLy8gb3B0aW9uYWxcbiAgICB2YXIgJGN0YUNvdW50ZXJzID0gb3B0aW9ucy5jdGFDb3VudGVyczsgLy8gb3B0aW9uYWxcbiAgICB2YXIgJGN0YUV4cGFuZGVkUmVhY3Rpb25zID0gb3B0aW9ucy5jdGFFeHBhbmRlZFJlYWN0aW9uczsgLy8gb3B0aW9uYWxcbiAgICB2YXIgcGFnZURhdGEgPSBvcHRpb25zLnBhZ2VEYXRhO1xuICAgIHZhciBncm91cFNldHRpbmdzID0gb3B0aW9ucy5ncm91cFNldHRpbmdzO1xuICAgIHZhciBkZWZhdWx0UmVhY3Rpb25zID0gb3B0aW9ucy5kZWZhdWx0UmVhY3Rpb25zO1xuXG4gICAgdmFyIHJlYWN0aW9uV2lkZ2V0T3B0aW9ucyA9IHtcbiAgICAgICAgcmVhY3Rpb25zRGF0YTogY29udGFpbmVyRGF0YS5yZWFjdGlvbnMsXG4gICAgICAgIGNvbnRhaW5lckRhdGE6IGNvbnRhaW5lckRhdGEsXG4gICAgICAgIGNvbnRhaW5lckVsZW1lbnQ6ICRjb250YWluZXJFbGVtZW50LFxuICAgICAgICBjb250ZW50RGF0YTogY29udGVudERhdGEsXG4gICAgICAgIGRlZmF1bHRSZWFjdGlvbnM6IGRlZmF1bHRSZWFjdGlvbnMsXG4gICAgICAgIHN0YXJ0UGFnZTogY29tcHV0ZVN0YXJ0UGFnZSgkY3RhRWxlbWVudCksXG4gICAgICAgIHBhZ2VEYXRhOiBwYWdlRGF0YSxcbiAgICAgICAgZ3JvdXBTZXR0aW5nczogZ3JvdXBTZXR0aW5nc1xuICAgIH07XG5cbiAgICAkY3RhRWxlbWVudC5vbignbW91c2VlbnRlci5hbnRlbm5hJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgaWYgKGV2ZW50LmJ1dHRvbnMgPiAwIHx8IChldmVudC5idXR0b25zID09IHVuZGVmaW5lZCAmJiBldmVudC53aGljaCA+IDApKSB7IC8vIE9uIFNhZmFyaSwgZXZlbnQuYnV0dG9ucyBpcyB1bmRlZmluZWQgYnV0IGV2ZW50LndoaWNoIGdpdmVzIGEgZ29vZCB2YWx1ZS4gZXZlbnQud2hpY2ggaXMgYmFkIG9uIEZGXG4gICAgICAgICAgICAvLyBEb24ndCByZWFjdCBpZiB0aGUgdXNlciBpcyBkcmFnZ2luZyBvciBzZWxlY3RpbmcgdGV4dC5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBvcGVuUmVhY3Rpb25zV2luZG93KHJlYWN0aW9uV2lkZ2V0T3B0aW9ucywgJGN0YUVsZW1lbnQpO1xuICAgIH0pO1xuXG4gICAgdmFyIGNyZWF0ZWRXaWRnZXRzID0gW107XG5cbiAgICBpZiAoJGN0YUxhYmVscykge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8ICRjdGFMYWJlbHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNyZWF0ZWRXaWRnZXRzLnB1c2goQ2FsbFRvQWN0aW9uTGFiZWwuY3JlYXRlKCRjdGFMYWJlbHNbaV0sIGNvbnRhaW5lckRhdGEpKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmICgkY3RhQ291bnRlcnMpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAkY3RhQ291bnRlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNyZWF0ZWRXaWRnZXRzLnB1c2goQ2FsbFRvQWN0aW9uQ291bnRlci5jcmVhdGUoJGN0YUNvdW50ZXJzW2ldLCBjb250YWluZXJEYXRhKSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoJGN0YUV4cGFuZGVkUmVhY3Rpb25zKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgJGN0YUV4cGFuZGVkUmVhY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjcmVhdGVkV2lkZ2V0cy5wdXNoKENhbGxUb0FjdGlvbkV4cGFuZGVkUmVhY3Rpb25zLmNyZWF0ZSgkY3RhRXhwYW5kZWRSZWFjdGlvbnNbaV0sICRjdGFFbGVtZW50LCBjb250YWluZXJEYXRhLCBncm91cFNldHRpbmdzKSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICB0ZWFyZG93bjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAkY3RhRWxlbWVudC5vZmYoJy5hbnRlbm5hJyk7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNyZWF0ZWRXaWRnZXRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY3JlYXRlZFdpZGdldHNbaV0udGVhcmRvd24oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gY29tcHV0ZVN0YXJ0UGFnZSgkZWxlbWVudCkge1xuICAgIHZhciB2YWwgPSAoJGVsZW1lbnQuYXR0cignYW50LW1vZGUnKSB8fCAnJykudHJpbSgpO1xuICAgIGlmICh2YWwgPT09ICd3cml0ZScpIHtcbiAgICAgICAgcmV0dXJuIFJlYWN0aW9uc1dpZGdldC5QQUdFX0RFRkFVTFRTO1xuICAgIH0gZWxzZSBpZiAodmFsID09PSAncmVhZCcpIHtcbiAgICAgICAgcmV0dXJuIFJlYWN0aW9uc1dpZGdldC5QQUdFX1JFQUNUSU9OUztcbiAgICB9XG4gICAgcmV0dXJuIFJlYWN0aW9uc1dpZGdldC5QQUdFX0FVVE87XG59XG5cbmZ1bmN0aW9uIG9wZW5SZWFjdGlvbnNXaW5kb3cocmVhY3Rpb25PcHRpb25zLCAkY3RhRWxlbWVudCkge1xuICAgIFJlYWN0aW9uc1dpZGdldC5vcGVuKHJlYWN0aW9uT3B0aW9ucywgJGN0YUVsZW1lbnQpO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlOiBjcmVhdGVJbmRpY2F0b3JXaWRnZXRcbn07IiwidmFyIFJhY3RpdmU7IHJlcXVpcmUoJy4vdXRpbHMvcmFjdGl2ZS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihsb2FkZWRSYWN0aXZlKSB7IFJhY3RpdmUgPSBsb2FkZWRSYWN0aXZlO30pO1xuXG5mdW5jdGlvbiBjcmVhdGVMYWJlbCgkbGFiZWxFbGVtZW50LCBjb250YWluZXJEYXRhKSB7XG4gICAgdmFyIHJhY3RpdmUgPSBSYWN0aXZlKHtcbiAgICAgICAgZWw6ICRsYWJlbEVsZW1lbnQsIC8vIFRPRE86IHJldmlldyB0aGUgc3RydWN0dXJlIG9mIHRoZSBET00gaGVyZS4gRG8gd2Ugd2FudCB0byByZW5kZXIgYW4gZWxlbWVudCBpbnRvICRjdGFMYWJlbCBvciBqdXN0IHRleHQ/XG4gICAgICAgIG1hZ2ljOiB0cnVlLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICBjb250YWluZXJEYXRhOiBjb250YWluZXJEYXRhXG4gICAgICAgIH0sXG4gICAgICAgIHRlbXBsYXRlOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvY2FsbC10by1hY3Rpb24tbGFiZWwuaGJzLmh0bWwnKVxuICAgIH0pO1xuICAgIHJldHVybiB7XG4gICAgICAgIHRlYXJkb3duOiBmdW5jdGlvbigpIHsgcmFjdGl2ZS50ZWFyZG93bigpOyB9XG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlOiBjcmVhdGVMYWJlbFxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi91dGlscy9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciBBamF4Q2xpZW50ID0gcmVxdWlyZSgnLi91dGlscy9hamF4LWNsaWVudCcpO1xudmFyIFVzZXIgPSByZXF1aXJlKCcuL3V0aWxzL3VzZXInKTtcblxudmFyIEV2ZW50cyA9IHJlcXVpcmUoJy4vZXZlbnRzJyk7XG5cbmZ1bmN0aW9uIHNldHVwQ29tbWVudEFyZWEocmVhY3Rpb25Qcm92aWRlciwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MsIGNhbGxiYWNrLCByYWN0aXZlKSB7XG4gICAgaWYgKGdyb3VwU2V0dGluZ3MucmVxdWlyZXNBcHByb3ZhbCgpKSB7XG4gICAgICAgIC8vIEN1cnJlbnRseSwgc2l0ZXMgdGhhdCByZXF1aXJlIGFwcHJvdmFsIGRvbid0IHN1cHBvcnQgY29tbWVudCBpbnB1dC5cbiAgICAgICAgJChyYWN0aXZlLmZpbmQoJy5hbnRlbm5hLWNvbW1lbnQtd2lkZ2V0cycpKS5oaWRlKCk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgcmFjdGl2ZS5vbignaW5wdXRjaGFuZ2VkJywgdXBkYXRlSW5wdXRDb3VudGVyKTtcbiAgICByYWN0aXZlLm9uKCdhZGRjb21tZW50JywgYWRkQ29tbWVudCk7XG4gICAgdXBkYXRlSW5wdXRDb3VudGVyKCk7XG5cbiAgICBmdW5jdGlvbiBhZGRDb21tZW50KCkge1xuICAgICAgICB2YXIgY29tbWVudCA9ICQocmFjdGl2ZS5maW5kKCcuYW50ZW5uYS1jb21tZW50LWlucHV0JykpLnZhbCgpLnRyaW0oKTsgLy8gVE9ETzogYWRkaXRpb25hbCB2YWxpZGF0aW9uPyBpbnB1dCBzYW5pdGl6aW5nP1xuICAgICAgICBpZiAoY29tbWVudC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAkKHJhY3RpdmUuZmluZCgnLmFudGVubmEtY29tbWVudC13aWRnZXRzJykpLmhpZGUoKTtcbiAgICAgICAgICAgICQocmFjdGl2ZS5maW5kKCcuYW50ZW5uYS1jb21tZW50LXdhaXRpbmcnKSkuZmFkZUluKCdzbG93Jyk7XG4gICAgICAgICAgICByZWFjdGlvblByb3ZpZGVyLmdldChmdW5jdGlvbiAocmVhY3Rpb24pIHtcbiAgICAgICAgICAgICAgICBBamF4Q2xpZW50LnBvc3RDb21tZW50KGNvbW1lbnQsIHJlYWN0aW9uLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBFdmVudHMucG9zdENvbW1lbnRDcmVhdGVkKHBhZ2VEYXRhLCBjb250YWluZXJEYXRhLCByZWFjdGlvbiwgY29tbWVudCwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICAgICAgfSwgZXJyb3IpO1xuICAgICAgICAgICAgICAgICQocmFjdGl2ZS5maW5kKCcuYW50ZW5uYS1jb21tZW50LXdhaXRpbmcnKSkuc3RvcCgpLmhpZGUoKTtcbiAgICAgICAgICAgICAgICAkKHJhY3RpdmUuZmluZCgnLmFudGVubmEtY29tbWVudC1yZWNlaXZlZCcpKS5mYWRlSW4oKTtcbiAgICAgICAgICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soY29tbWVudCwgVXNlci5vcHRpbWlzdGljQ29tbWVudFVzZXIoKSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gZXJyb3IobWVzc2FnZSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBUT0RPIHJlYWwgZXJyb3IgaGFuZGxpbmdcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0Vycm9yIHBvc3RpbmcgY29tbWVudDogJyArIG1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdXBkYXRlSW5wdXRDb3VudGVyKCkge1xuICAgICAgICB2YXIgJHRleHRhcmVhID0gJChyYWN0aXZlLmZpbmQoJy5hbnRlbm5hLWNvbW1lbnQtaW5wdXQnKSk7XG4gICAgICAgIHZhciBtYXggPSBwYXJzZUludCgkdGV4dGFyZWEuYXR0cignbWF4bGVuZ3RoJykpO1xuICAgICAgICB2YXIgbGVuZ3RoID0gJHRleHRhcmVhLnZhbCgpLmxlbmd0aDtcbiAgICAgICAgJChyYWN0aXZlLmZpbmQoJy5hbnRlbm5hLWNvbW1lbnQtY291bnQnKSkuaHRtbChNYXRoLm1heCgwLCBtYXggLSBsZW5ndGgpKTtcbiAgICB9XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBzZXR1cDogc2V0dXBDb21tZW50QXJlYVxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi91dGlscy9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciBSYWN0aXZlOyByZXF1aXJlKCcuL3V0aWxzL3JhY3RpdmUtcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24obG9hZGVkUmFjdGl2ZSkgeyBSYWN0aXZlID0gbG9hZGVkUmFjdGl2ZTt9KTtcbnZhciBDb21tZW50QXJlYVBhcnRpYWwgPSByZXF1aXJlKCcuL2NvbW1lbnQtYXJlYS1wYXJ0aWFsJyk7XG52YXIgU1ZHcyA9IHJlcXVpcmUoJy4vc3ZncycpO1xuXG52YXIgcGFnZVNlbGVjdG9yID0gJy5hbnRlbm5hLWNvbW1lbnRzLXBhZ2UnO1xuXG5mdW5jdGlvbiBjcmVhdGVQYWdlKG9wdGlvbnMpIHtcbiAgICB2YXIgcmVhY3Rpb24gPSBvcHRpb25zLnJlYWN0aW9uO1xuICAgIHZhciBjb21tZW50cyA9IG9wdGlvbnMuY29tbWVudHM7XG4gICAgdmFyIGVsZW1lbnQgPSBvcHRpb25zLmVsZW1lbnQ7XG4gICAgdmFyIGNvbnRhaW5lckRhdGEgPSBvcHRpb25zLmNvbnRhaW5lckRhdGE7XG4gICAgdmFyIHBhZ2VEYXRhID0gb3B0aW9ucy5wYWdlRGF0YTtcbiAgICB2YXIgZ3JvdXBTZXR0aW5ncyA9IG9wdGlvbnMuZ3JvdXBTZXR0aW5ncztcbiAgICB2YXIgZ29CYWNrID0gb3B0aW9ucy5nb0JhY2s7XG4gICAgdmFyIHJhY3RpdmUgPSBSYWN0aXZlKHtcbiAgICAgICAgZWw6IGVsZW1lbnQsXG4gICAgICAgIGFwcGVuZDogdHJ1ZSxcbiAgICAgICAgbWFnaWM6IHRydWUsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIHJlYWN0aW9uOiByZWFjdGlvbixcbiAgICAgICAgICAgIGNvbW1lbnRzOiBjb21tZW50c1xuICAgICAgICB9LFxuICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL2NvbW1lbnRzLXBhZ2UuaGJzLmh0bWwnKSxcbiAgICAgICAgcGFydGlhbHM6IHtcbiAgICAgICAgICAgIGNvbW1lbnRBcmVhOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvY29tbWVudC1hcmVhLXBhcnRpYWwuaGJzLmh0bWwnKSxcbiAgICAgICAgICAgIGxlZnQ6IFNWR3MubGVmdFxuICAgICAgICB9XG4gICAgfSk7XG4gICAgdmFyIHJlYWN0aW9uUHJvdmlkZXIgPSB7IC8vIHRoaXMgcmVhY3Rpb24gcHJvdmlkZXIgaXMgYSBuby1icmFpbmVyIGJlY2F1c2Ugd2UgYWxyZWFkeSBoYXZlIGEgdmFsaWQgcmVhY3Rpb24gKG9uZSB3aXRoIGFuIElEKVxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhyZWFjdGlvbik7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIENvbW1lbnRBcmVhUGFydGlhbC5zZXR1cChyZWFjdGlvblByb3ZpZGVyLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncywgY29tbWVudEFkZGVkLCByYWN0aXZlLCBncm91cFNldHRpbmdzKTtcbiAgICByYWN0aXZlLm9uKCdiYWNrJywgZ29CYWNrKTtcbiAgICByZXR1cm4ge1xuICAgICAgICBzZWxlY3RvcjogcGFnZVNlbGVjdG9yLFxuICAgICAgICB0ZWFyZG93bjogZnVuY3Rpb24oKSB7IHJhY3RpdmUudGVhcmRvd24oKTsgfVxuICAgIH07XG5cbiAgICBmdW5jdGlvbiBjb21tZW50QWRkZWQoY29tbWVudCwgdXNlcikge1xuICAgICAgICBjb21tZW50cy51bnNoaWZ0KHsgdGV4dDogY29tbWVudCwgdXNlcjogdXNlciwgbmV3OiB0cnVlIH0pO1xuICAgICAgICAkKHJhY3RpdmUuZmluZCgnLmFudGVubmEtYm9keScpKS5hbmltYXRlKHtzY3JvbGxUb3A6IDB9KTtcbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZTogY3JlYXRlUGFnZVxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi91dGlscy9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciBSYWN0aXZlOyByZXF1aXJlKCcuL3V0aWxzL3JhY3RpdmUtcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24obG9hZGVkUmFjdGl2ZSkgeyBSYWN0aXZlID0gbG9hZGVkUmFjdGl2ZTt9KTtcbnZhciBBamF4Q2xpZW50ID0gcmVxdWlyZSgnLi91dGlscy9hamF4LWNsaWVudCcpO1xudmFyIFVSTHMgPSByZXF1aXJlKCcuL3V0aWxzL3VybHMnKTtcbnZhciBDb21tZW50QXJlYVBhcnRpYWwgPSByZXF1aXJlKCcuL2NvbW1lbnQtYXJlYS1wYXJ0aWFsJyk7XG52YXIgRXZlbnRzID0gcmVxdWlyZSgnLi9ldmVudHMnKTtcbnZhciBTVkdzID0gcmVxdWlyZSgnLi9zdmdzJyk7XG5cbnZhciBwYWdlU2VsZWN0b3IgPSAnLmFudGVubmEtY29uZmlybWF0aW9uLXBhZ2UnO1xuXG5mdW5jdGlvbiBjcmVhdGVQYWdlKHJlYWN0aW9uVGV4dCwgcmVhY3Rpb25Qcm92aWRlciwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MsIGVsZW1lbnQpIHtcbiAgICB2YXIgcG9wdXBXaW5kb3c7XG4gICAgdmFyIHJhY3RpdmUgPSBSYWN0aXZlKHtcbiAgICAgICAgZWw6IGVsZW1lbnQsXG4gICAgICAgIGFwcGVuZDogdHJ1ZSxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgdGV4dDogcmVhY3Rpb25UZXh0XG4gICAgICAgIH0sXG4gICAgICAgIHRlbXBsYXRlOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvY29uZmlybWF0aW9uLXBhZ2UuaGJzLmh0bWwnKSxcbiAgICAgICAgcGFydGlhbHM6IHtcbiAgICAgICAgICAgIGNvbW1lbnRBcmVhOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvY29tbWVudC1hcmVhLXBhcnRpYWwuaGJzLmh0bWwnKSxcbiAgICAgICAgICAgIGZhY2Vib29rSWNvbjogU1ZHcy5mYWNlYm9vayxcbiAgICAgICAgICAgIHR3aXR0ZXJJY29uOiBTVkdzLnR3aXR0ZXJcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJhY3RpdmUub24oJ3NoYXJlLWZhY2Vib29rJywgc2hhcmVUb0ZhY2Vib29rKTtcbiAgICByYWN0aXZlLm9uKCdzaGFyZS10d2l0dGVyJywgc2hhcmVUb1R3aXR0ZXIpO1xuICAgIENvbW1lbnRBcmVhUGFydGlhbC5zZXR1cChyZWFjdGlvblByb3ZpZGVyLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncywgbnVsbCwgcmFjdGl2ZSk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgc2VsZWN0b3I6IHBhZ2VTZWxlY3RvcixcbiAgICAgICAgdGVhcmRvd246IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY2xvc2VTaGFyZVdpbmRvdygpO1xuICAgICAgICAgICAgcmFjdGl2ZS50ZWFyZG93bigpO1xuICAgICAgICB9XG4gICAgfTtcblxuXG4gICAgZnVuY3Rpb24gc2hhcmVUb0ZhY2Vib29rKHJhY3RpdmVFdmVudCkge1xuICAgICAgICByYWN0aXZlRXZlbnQub3JpZ2luYWwucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgc2hhcmVSZWFjdGlvbihmdW5jdGlvbihyZWFjdGlvbkRhdGEsIHNob3J0VXJsKSB7XG4gICAgICAgICAgICBFdmVudHMucG9zdFJlYWN0aW9uU2hhcmVkKCdmYWNlYm9vaycsIHBhZ2VEYXRhLCBjb250YWluZXJEYXRhLCByZWFjdGlvbkRhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgdmFyIHNoYXJlVGV4dCA9IGNvbXB1dGVTaGFyZVRleHQocmVhY3Rpb25EYXRhLCAzMDApO1xuICAgICAgICAgICAgdmFyIGltYWdlUGFyYW0gPSAnJztcbiAgICAgICAgICAgIGlmIChjb250YWluZXJEYXRhLnR5cGUgPT09ICdpbWFnZScpIHtcbiAgICAgICAgICAgICAgICBpbWFnZVBhcmFtID0gJyZwW2ltYWdlc11bMF09JyArIGVuY29kZVVSSShyZWFjdGlvbkRhdGEuY29udGVudC5ib2R5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiAnaHR0cDovL3d3dy5mYWNlYm9vay5jb20vc2hhcmVyLnBocD9zPTEwMCcgK1xuICAgICAgICAgICAgICAgICcmcFt1cmxdPScgKyBzaG9ydFVybCArXG4gICAgICAgICAgICAgICAgJyZwW3RpdGxlXT0nICsgZW5jb2RlVVJJKHNoYXJlVGV4dCkgK1xuICAgICAgICAgICAgICAgICcmcFtzdW1tYXJ5XT0nICsgZW5jb2RlVVJJKHNoYXJlVGV4dCkgK1xuICAgICAgICAgICAgICAgIGltYWdlUGFyYW07XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNoYXJlVG9Ud2l0dGVyKHJhY3RpdmVFdmVudCkge1xuICAgICAgICByYWN0aXZlRXZlbnQub3JpZ2luYWwucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgc2hhcmVSZWFjdGlvbihmdW5jdGlvbihyZWFjdGlvbkRhdGEsIHNob3J0VXJsKSB7XG4gICAgICAgICAgICBFdmVudHMucG9zdFJlYWN0aW9uU2hhcmVkKCd0d2l0dGVyJywgcGFnZURhdGEsIGNvbnRhaW5lckRhdGEsIHJlYWN0aW9uRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICB2YXIgc2hhcmVUZXh0ID0gY29tcHV0ZVNoYXJlVGV4dChyZWFjdGlvbkRhdGEsIDExMCk7IC8vIE1ha2Ugc3VyZSB3ZSBzdGF5IHVuZGVyIHRoZSAxNDAgY2hhciBsaW1pdCAodHdpdHRlciBhcHBlbmRzIGFkZGl0aW9uYWwgdGV4dCBsaWtlIHRoZSB1cmwpXG4gICAgICAgICAgICB2YXIgdHdpdHRlclZpYSA9IGdyb3VwU2V0dGluZ3MudHdpdHRlckFjY291bnQoKSA/ICcmdmlhPScgKyBncm91cFNldHRpbmdzLnR3aXR0ZXJBY2NvdW50KCkgOiAnJztcbiAgICAgICAgICAgIHJldHVybiAnaHR0cDovL3R3aXR0ZXIuY29tL2ludGVudC90d2VldD91cmw9JyArIHNob3J0VXJsICsgdHdpdHRlclZpYSArICcmdGV4dD0nICsgZW5jb2RlVVJJKHNoYXJlVGV4dCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNoYXJlUmVhY3Rpb24oY29tcHV0ZVdpbmRvd0xvY2F0aW9uKSB7XG4gICAgICAgIGNsb3NlU2hhcmVXaW5kb3coKTtcbiAgICAgICAgcmVhY3Rpb25Qcm92aWRlci5nZXQoZnVuY3Rpb24ocmVhY3Rpb25EYXRhKSB7XG4gICAgICAgICAgICB2YXIgd2luZG93ID0gb3BlblNoYXJlV2luZG93KCk7XG4gICAgICAgICAgICBpZiAod2luZG93KSB7XG4gICAgICAgICAgICAgICAgQWpheENsaWVudC5wb3N0U2hhcmVSZWFjdGlvbihyZWFjdGlvbkRhdGEsIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHVybCA9IGNvbXB1dGVXaW5kb3dMb2NhdGlvbihyZWFjdGlvbkRhdGEsIHJlc3BvbnNlLnNob3J0X3VybCk7XG4gICAgICAgICAgICAgICAgICAgIHJlZGlyZWN0U2hhcmVXaW5kb3codXJsKTtcbiAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAobWVzc2FnZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkZhaWxlZCB0byBzaGFyZSByZWFjdGlvbjogXCIgKyBtZXNzYWdlKTtcbiAgICAgICAgICAgICAgICAgICAgY2xvc2VTaGFyZVdpbmRvdygpO1xuICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiBlbmdhZ2VfZnVsbDo5ODE4XG4gICAgICAgICAgICAgICAgICAgIC8vaWYgKCByZXNwb25zZS5tZXNzYWdlLmluZGV4T2YoIFwiVGVtcG9yYXJ5IHVzZXIgaW50ZXJhY3Rpb24gbGltaXQgcmVhY2hlZFwiICkgIT0gLTEgKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vICAgIEFOVC5zZXNzaW9uLnNob3dMb2dpblBhbmVsKCBhcmdzICk7XG4gICAgICAgICAgICAgICAgICAgIC8vfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgLy8gaWYgaXQgZmFpbGVkLCBzZWUgaWYgd2UgY2FuIGZpeCBpdCwgYW5kIGlmIHNvLCB0cnkgdGhpcyBmdW5jdGlvbiBvbmUgbW9yZSB0aW1lXG4gICAgICAgICAgICAgICAgICAgIC8vICAgIEFOVC5zZXNzaW9uLmhhbmRsZUdldFVzZXJGYWlsKCBhcmdzLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgICAgIEFOVC5hY3Rpb25zLnNoYXJlX2dldExpbmsoIGFyZ3MgKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIC8vfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjbG9zZVNoYXJlV2luZG93KCkge1xuICAgICAgICBpZiAocG9wdXBXaW5kb3cgJiYgIXBvcHVwV2luZG93LmNsb3NlZCkge1xuICAgICAgICAgICAgcG9wdXBXaW5kb3cuY2xvc2UoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIG9wZW5TaGFyZVdpbmRvdygpIHtcbiAgICAgICAgcG9wdXBXaW5kb3cgPSB3aW5kb3cub3BlbihVUkxzLmFwcFNlcnZlclVybCgpICsgVVJMcy5zaGFyZVdpbmRvd1VybCgpLCAnYW50ZW5uYV9zaGFyZV93aW5kb3cnLCdtZW51YmFyPTEscmVzaXphYmxlPTEsd2lkdGg9NjI2LGhlaWdodD00MzYnKTtcbiAgICAgICAgcmV0dXJuIHBvcHVwV2luZG93O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJlZGlyZWN0U2hhcmVXaW5kb3codXJsKSB7XG4gICAgICAgIGlmIChwb3B1cFdpbmRvdyAmJiAhcG9wdXBXaW5kb3cuY2xvc2VkKSB7XG4gICAgICAgICAgICBwb3B1cFdpbmRvdy5sb2NhdGlvbiA9IHVybDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNvbXB1dGVTaGFyZVRleHQocmVhY3Rpb25EYXRhLCBtYXhUZXh0TGVuZ3RoKSB7XG4gICAgICAgIHZhciBzaGFyZVRleHQgPSByZWFjdGlvbkRhdGEudGV4dCArIFwiIMK7IFwiICsgJyc7XG4gICAgICAgIHZhciBncm91cE5hbWUgPSBncm91cFNldHRpbmdzLmdyb3VwTmFtZSgpO1xuICAgICAgICBzd2l0Y2ggKGNvbnRhaW5lckRhdGEudHlwZSkge1xuICAgICAgICAgICAgY2FzZSAnaW1hZ2UnOlxuICAgICAgICAgICAgICAgIHNoYXJlVGV4dCArPSAnW2EgcGljdHVyZSBvbiAnICsgZ3JvdXBOYW1lICsgJ10gQ2hlY2sgaXQgb3V0OiAnO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnbWVkaWEnOlxuICAgICAgICAgICAgICAgIHNoYXJlVGV4dCArPSAnW2EgdmlkZW8gb24gJyArIGdyb3VwTmFtZSArICddIENoZWNrIGl0IG91dDogJztcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ3BhZ2UnOlxuICAgICAgICAgICAgICAgIHNoYXJlVGV4dCArPSAnW2FuIGFydGljbGUgb24gJyArIGdyb3VwTmFtZSArICddIENoZWNrIGl0IG91dDogJztcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ3RleHQnOlxuICAgICAgICAgICAgICAgIHZhciBtYXhCb2R5TGVuZ3RoID0gbWF4VGV4dExlbmd0aCAtIHNoYXJlVGV4dC5sZW5ndGggLSAyOyAvLyB0aGUgZXh0cmEgMiBhY2NvdW50cyBmb3IgdGhlIHF1b3RlcyB3ZSBhZGRcbiAgICAgICAgICAgICAgICB2YXIgdGV4dEJvZHkgPSByZWFjdGlvbkRhdGEuY29udGVudC5ib2R5O1xuICAgICAgICAgICAgICAgIHRleHRCb2R5ID0gdGV4dEJvZHkubGVuZ3RoID4gbWF4Qm9keUxlbmd0aCA/IHRleHRCb2R5LnN1YnN0cmluZygwLCBtYXhCb2R5TGVuZ3RoLTMpICsgJy4uLicgOiB0ZXh0Qm9keTtcbiAgICAgICAgICAgICAgICBzaGFyZVRleHQgKz0gJ1wiJyArIHRleHRCb2R5ICsgJ1wiJztcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc2hhcmVUZXh0O1xuICAgIH1cblxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlOiBjcmVhdGVQYWdlXG59OyIsInZhciBBcHBNb2RlID0gcmVxdWlyZSgnLi91dGlscy9hcHAtbW9kZScpO1xudmFyIFVSTHMgPSByZXF1aXJlKCcuL3V0aWxzL3VybHMnKTtcblxuZnVuY3Rpb24gbG9hZENzcygpIHtcbiAgICAvLyBUbyBtYWtlIHN1cmUgbm9uZSBvZiBvdXIgY29udGVudCByZW5kZXJzIG9uIHRoZSBwYWdlIGJlZm9yZSBvdXIgQ1NTIGlzIGxvYWRlZCwgd2UgYXBwZW5kIGEgc2ltcGxlIGlubGluZSBzdHlsZVxuICAgIC8vIGVsZW1lbnQgdGhhdCB0dXJucyBvZmYgb3VyIGVsZW1lbnRzICpiZWZvcmUqIG91ciBDU1MgbGlua3MuIFRoaXMgZXhwbG9pdHMgdGhlIGNhc2NhZGUgcnVsZXMgLSBvdXIgQ1NTIGZpbGVzIGFwcGVhclxuICAgIC8vIGFmdGVyIHRoZSBpbmxpbmUgc3R5bGUgaW4gdGhlIGRvY3VtZW50LCBzbyB0aGV5IHRha2UgcHJlY2VkZW5jZSAoYW5kIG1ha2UgZXZlcnl0aGluZyBhcHBlYXIpIG9uY2UgdGhleSdyZSBsb2FkZWQuXG4gICAgaW5qZWN0Q3NzKCcuYW50ZW5uYXtkaXNwbGF5Om5vbmU7fScpO1xuICAgIHZhciBjc3NIcmVmID0gVVJMcy5hbWF6b25TM1VybCgpICsgJy93aWRnZXQtbmV3L2FudGVubmEuY3NzJztcbiAgICBpZiAoQXBwTW9kZS5vZmZsaW5lKSB7XG4gICAgICAgIGNzc0hyZWYgPSBVUkxzLmFwcFNlcnZlclVybCgpICsgJy9zdGF0aWMvd2lkZ2V0LW5ldy9hbnRlbm5hLmNzcyc7XG4gICAgfVxuICAgIGxvYWRGaWxlKGNzc0hyZWYpO1xufVxuXG5mdW5jdGlvbiBsb2FkRmlsZShocmVmKSB7XG4gICAgdmFyIGxpbmtUYWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaW5rJyk7XG4gICAgbGlua1RhZy5zZXRBdHRyaWJ1dGUoJ2hyZWYnLCBocmVmKTtcbiAgICBsaW5rVGFnLnNldEF0dHJpYnV0ZSgncmVsJywgJ3N0eWxlc2hlZXQnKTtcbiAgICBsaW5rVGFnLnNldEF0dHJpYnV0ZSgndHlwZScsICd0ZXh0L2NzcycpO1xuICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQobGlua1RhZyk7XG59XG5cbmZ1bmN0aW9uIGluamVjdENzcyhjc3NTdHJpbmcpIHtcbiAgICB2YXIgc3R5bGVUYWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xuICAgIHN0eWxlVGFnLnNldEF0dHJpYnV0ZSgndHlwZScsICd0ZXh0L2NzcycpO1xuICAgIHN0eWxlVGFnLmlubmVySFRNTCA9IGNzc1N0cmluZztcbiAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHN0eWxlVGFnKTtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGxvYWQgOiBsb2FkQ3NzLFxuICAgIGluamVjdDogaW5qZWN0Q3NzXG59OyIsInZhciAkOyByZXF1aXJlKCcuL3V0aWxzL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIEFqYXhDbGllbnQgPSByZXF1aXJlKCcuL3V0aWxzL2FqYXgtY2xpZW50Jyk7XG52YXIgUmFjdGl2ZTsgcmVxdWlyZSgnLi91dGlscy9yYWN0aXZlLXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGxvYWRlZFJhY3RpdmUpIHsgUmFjdGl2ZSA9IGxvYWRlZFJhY3RpdmU7fSk7XG52YXIgUmVhY3Rpb25zV2lkZ2V0TGF5b3V0VXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzL3JlYWN0aW9ucy13aWRnZXQtbGF5b3V0LXV0aWxzJyk7XG5cbnZhciBFdmVudHMgPSByZXF1aXJlKCcuL2V2ZW50cycpO1xudmFyIFBhZ2VEYXRhID0gcmVxdWlyZSgnLi9wYWdlLWRhdGEnKTtcblxudmFyIHBhZ2VTZWxlY3RvciA9ICcuYW50ZW5uYS1kZWZhdWx0cy1wYWdlJztcblxuZnVuY3Rpb24gY3JlYXRlUGFnZShvcHRpb25zKSB7XG4gICAgdmFyIGRlZmF1bHRSZWFjdGlvbnMgPSBvcHRpb25zLmRlZmF1bHRSZWFjdGlvbnM7XG4gICAgdmFyIGNvbnRhaW5lckRhdGEgPSBvcHRpb25zLmNvbnRhaW5lckRhdGE7XG4gICAgdmFyIHBhZ2VEYXRhID0gb3B0aW9ucy5wYWdlRGF0YTtcbiAgICB2YXIgZ3JvdXBTZXR0aW5ncyA9IG9wdGlvbnMuZ3JvdXBTZXR0aW5ncztcbiAgICB2YXIgY29udGVudERhdGEgPSBvcHRpb25zLmNvbnRlbnREYXRhO1xuICAgIHZhciBzaG93Q29uZmlybWF0aW9uID0gb3B0aW9ucy5zaG93Q29uZmlybWF0aW9uO1xuICAgIHZhciBzaG93UGVuZGluZ0FwcHJvdmFsID0gb3B0aW9ucy5zaG93UGVuZGluZ0FwcHJvdmFsO1xuICAgIHZhciBzaG93UHJvZ3Jlc3MgPSBvcHRpb25zLnNob3dQcm9ncmVzcztcbiAgICB2YXIgaGFuZGxlUmVhY3Rpb25FcnJvciA9IG9wdGlvbnMuaGFuZGxlUmVhY3Rpb25FcnJvcjtcbiAgICB2YXIgZWxlbWVudCA9IG9wdGlvbnMuZWxlbWVudDtcbiAgICB2YXIgZGVmYXVsdExheW91dERhdGEgPSBSZWFjdGlvbnNXaWRnZXRMYXlvdXRVdGlscy5jb21wdXRlTGF5b3V0RGF0YShkZWZhdWx0UmVhY3Rpb25zKTtcbiAgICB2YXIgJHJlYWN0aW9uc1dpbmRvdyA9ICQob3B0aW9ucy5yZWFjdGlvbnNXaW5kb3cpO1xuICAgIHZhciByYWN0aXZlID0gUmFjdGl2ZSh7XG4gICAgICAgIGVsOiBlbGVtZW50LFxuICAgICAgICBhcHBlbmQ6IHRydWUsXG4gICAgICAgIHRlbXBsYXRlOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvZGVmYXVsdHMtcGFnZS5oYnMuaHRtbCcpLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICBkZWZhdWx0UmVhY3Rpb25zOiBkZWZhdWx0UmVhY3Rpb25zLFxuICAgICAgICAgICAgZGVmYXVsdExheW91dENsYXNzOiBhcnJheUFjY2Vzc29yKGRlZmF1bHRMYXlvdXREYXRhLmxheW91dENsYXNzZXMpXG4gICAgICAgIH0sXG4gICAgICAgIGRlY29yYXRvcnM6IHtcbiAgICAgICAgICAgIHNpemV0b2ZpdDogUmVhY3Rpb25zV2lkZ2V0TGF5b3V0VXRpbHMuc2l6ZVRvRml0KCRyZWFjdGlvbnNXaW5kb3cpXG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIHJhY3RpdmUub24oJ25ld3JlYWN0aW9uJywgbmV3RGVmYXVsdFJlYWN0aW9uKTtcbiAgICByYWN0aXZlLm9uKCduZXdjdXN0b20nLCBuZXdDdXN0b21SZWFjdGlvbik7XG4gICAgcmFjdGl2ZS5vbignY3VzdG9tZm9jdXMnLCBjdXN0b21SZWFjdGlvbkZvY3VzKTtcbiAgICByYWN0aXZlLm9uKCdjdXN0b21ibHVyJywgY3VzdG9tUmVhY3Rpb25CbHVyKTtcbiAgICByYWN0aXZlLm9uKCdwYWdla2V5ZG93bicsIGtleWJvYXJkSW5wdXQpO1xuICAgIHJhY3RpdmUub24oJ2lucHV0a2V5ZG93bicsIGN1c3RvbVJlYWN0aW9uSW5wdXQpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgc2VsZWN0b3I6IHBhZ2VTZWxlY3RvcixcbiAgICAgICAgdGVhcmRvd246IGZ1bmN0aW9uKCkgeyByYWN0aXZlLnRlYXJkb3duKCk7IH1cbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gY3VzdG9tUmVhY3Rpb25JbnB1dChyYWN0aXZlRXZlbnQpIHtcbiAgICAgICAgdmFyIGV2ZW50ID0gcmFjdGl2ZUV2ZW50Lm9yaWdpbmFsO1xuICAgICAgICB2YXIga2V5ID0gKGV2ZW50LndoaWNoICE9PSB1bmRlZmluZWQpID8gZXZlbnQud2hpY2ggOiBldmVudC5rZXlDb2RlO1xuICAgICAgICBpZiAoa2V5ID09IDEzKSB7IC8vIEVudGVyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyAvLyBsZXQgdGhlIHByb2Nlc3Npbmcgb2YgdGhlIGtleWJvYXJkIGV2ZW50IGZpbmlzaCBiZWZvcmUgd2Ugc2hvdyB0aGUgcGFnZSAob3RoZXJ3aXNlLCB0aGUgY29uZmlybWF0aW9uIHBhZ2UgYWxzbyByZWNlaXZlcyB0aGUga2V5c3Ryb2tlKVxuICAgICAgICAgICAgICAgIG5ld0N1c3RvbVJlYWN0aW9uKCk7XG4gICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgfSBlbHNlIGlmIChrZXkgPT0gMjcpIHsgLy8gRXNjYXBlXG4gICAgICAgICAgICBldmVudC50YXJnZXQudmFsdWUgPSAnJztcbiAgICAgICAgICAgIHJvb3RFbGVtZW50KHJhY3RpdmUpLmZvY3VzKCk7XG4gICAgICAgIH1cbiAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbmV3RGVmYXVsdFJlYWN0aW9uKHJhY3RpdmVFdmVudCkge1xuICAgICAgICB2YXIgcmVhY3Rpb25EYXRhID0gcmFjdGl2ZUV2ZW50LmNvbnRleHQ7XG4gICAgICAgIHZhciByZWFjdGlvblByb3ZpZGVyID0gY3JlYXRlUmVhY3Rpb25Qcm92aWRlcigpO1xuICAgICAgICBzaG93Q29uZmlybWF0aW9uKHJlYWN0aW9uRGF0YSwgcmVhY3Rpb25Qcm92aWRlcik7IC8vIE9wdGltaXN0aWNhbGx5IHNob3cgY29uZmlybWF0aW9uIGZvciBkZWZhdWx0IHJlYWN0aW9ucyBiZWNhdXNlIHRoZXkgc2hvdWxkIGFsd2F5cyBiZSBhY2NlcHRlZC5cbiAgICAgICAgQWpheENsaWVudC5wb3N0TmV3UmVhY3Rpb24ocmVhY3Rpb25EYXRhLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgY29udGVudERhdGEsIHN1Y2Nlc3MsIGVycm9yKTtcblxuICAgICAgICBmdW5jdGlvbiBzdWNjZXNzKHJlYWN0aW9uKSB7XG4gICAgICAgICAgICByZWFjdGlvbiA9IFBhZ2VEYXRhLnJlZ2lzdGVyUmVhY3Rpb24ocmVhY3Rpb24sIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhKTtcbiAgICAgICAgICAgIHJlYWN0aW9uUHJvdmlkZXIucmVhY3Rpb25Mb2FkZWQocmVhY3Rpb24pO1xuICAgICAgICAgICAgRXZlbnRzLnBvc3RSZWFjdGlvbkNyZWF0ZWQocGFnZURhdGEsIGNvbnRhaW5lckRhdGEsIHJlYWN0aW9uLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGVycm9yKG1lc3NhZ2UpIHtcbiAgICAgICAgICAgIHZhciByZXRyeSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIEFqYXhDbGllbnQucG9zdE5ld1JlYWN0aW9uKHJlYWN0aW9uRGF0YSwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGNvbnRlbnREYXRhLCBzdWNjZXNzLCBlcnJvcik7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaGFuZGxlUmVhY3Rpb25FcnJvcihtZXNzYWdlLCByZXRyeSwgcGFnZVNlbGVjdG9yKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIG5ld0N1c3RvbVJlYWN0aW9uKCkge1xuICAgICAgICB2YXIgaW5wdXQgPSByYWN0aXZlLmZpbmQoJy5hbnRlbm5hLWRlZmF1bHRzLWZvb3RlciBpbnB1dCcpO1xuICAgICAgICB2YXIgYm9keSA9IGlucHV0LnZhbHVlLnRyaW0oKTtcbiAgICAgICAgaWYgKGJvZHkgIT09ICcnKSB7XG4gICAgICAgICAgICBzaG93UHJvZ3Jlc3MoKTsgLy8gU2hvdyBwcm9ncmVzcyBmb3IgY3VzdG9tIHJlYWN0aW9ucyBiZWNhdXNlIHRoZSBzZXJ2ZXIgbWlnaHQgcmVqZWN0IHRoZW0gZm9yIGEgbnVtYmVyIG9mIHJlYXNvbnNcbiAgICAgICAgICAgIHZhciByZWFjdGlvbkRhdGEgPSB7IHRleHQ6IGJvZHkgfTtcbiAgICAgICAgICAgIHZhciByZWFjdGlvblByb3ZpZGVyID0gY3JlYXRlUmVhY3Rpb25Qcm92aWRlcigpO1xuICAgICAgICAgICAgaW5wdXQuYmx1cigpO1xuICAgICAgICAgICAgQWpheENsaWVudC5wb3N0TmV3UmVhY3Rpb24ocmVhY3Rpb25EYXRhLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgY29udGVudERhdGEsIHN1Y2Nlc3MsIGVycm9yKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHN1Y2Nlc3MocmVhY3Rpb24pIHtcbiAgICAgICAgICAgIGlmIChyZWFjdGlvbi5hcHByb3ZlZCkge1xuICAgICAgICAgICAgICAgIHNob3dDb25maXJtYXRpb24ocmVhY3Rpb25EYXRhLCByZWFjdGlvblByb3ZpZGVyKTtcbiAgICAgICAgICAgICAgICByZWFjdGlvbiA9IFBhZ2VEYXRhLnJlZ2lzdGVyUmVhY3Rpb24ocmVhY3Rpb24sIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhKTtcbiAgICAgICAgICAgICAgICByZWFjdGlvblByb3ZpZGVyLnJlYWN0aW9uTG9hZGVkKHJlYWN0aW9uKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gSWYgdGhlIHJlYWN0aW9uIGlzbid0IGFwcHJvdmVkLCBkb24ndCBhZGQgaXQgdG8gb3VyIGRhdGEgbW9kZWwuIEp1c3Qgc2hvdyBmZWVkYmFjayBhbmQgZmlyZSBhbiBldmVudC5cbiAgICAgICAgICAgICAgICBzaG93UGVuZGluZ0FwcHJvdmFsKHJlYWN0aW9uKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIEV2ZW50cy5wb3N0UmVhY3Rpb25DcmVhdGVkKHBhZ2VEYXRhLCBjb250YWluZXJEYXRhLCByZWFjdGlvbiwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBlcnJvcihtZXNzYWdlKSB7XG4gICAgICAgICAgICB2YXIgcmV0cnkgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBBamF4Q2xpZW50LnBvc3ROZXdSZWFjdGlvbihyZWFjdGlvbkRhdGEsIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBjb250ZW50RGF0YSwgc3VjY2VzcywgZXJyb3IpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGhhbmRsZVJlYWN0aW9uRXJyb3IobWVzc2FnZSwgcmV0cnksIHBhZ2VTZWxlY3Rvcik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBrZXlib2FyZElucHV0KHJhY3RpdmVFdmVudCkge1xuICAgICAgICBpZiAoJChyb290RWxlbWVudChyYWN0aXZlKSkuaGFzQ2xhc3MoJ2FudGVubmEtcGFnZS1hY3RpdmUnKSkgeyAvLyBvbmx5IGhhbmRsZSBpbnB1dCB3aGVuIHRoaXMgcGFnZSBpcyBhY3RpdmVcbiAgICAgICAgICAgICQocm9vdEVsZW1lbnQocmFjdGl2ZSkpLmZpbmQoJy5hbnRlbm5hLWRlZmF1bHRzLWZvb3RlciBpbnB1dCcpLmZvY3VzKCk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIHJvb3RFbGVtZW50KHJhY3RpdmUpIHtcbiAgICByZXR1cm4gcmFjdGl2ZS5maW5kKHBhZ2VTZWxlY3Rvcik7XG59XG5cbmZ1bmN0aW9uIGFycmF5QWNjZXNzb3IoYXJyYXkpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oaW5kZXgpIHtcbiAgICAgICAgcmV0dXJuIGFycmF5W2luZGV4XTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGN1c3RvbVJlYWN0aW9uRm9jdXMocmFjdGl2ZUV2ZW50KSB7XG4gICAgdmFyICRmb290ZXIgPSAkKHJhY3RpdmVFdmVudC5vcmlnaW5hbC50YXJnZXQpLmNsb3Nlc3QoJy5hbnRlbm5hLWRlZmF1bHRzLWZvb3RlcicpO1xuICAgICRmb290ZXIuZmluZCgnaW5wdXQnKS5ub3QoJy5hY3RpdmUnKS52YWwoJycpLmFkZENsYXNzKCdhY3RpdmUnKTtcbiAgICAkZm9vdGVyLmZpbmQoJ2J1dHRvbicpLnNob3coKTtcbn1cblxuZnVuY3Rpb24gY3VzdG9tUmVhY3Rpb25CbHVyKHJhY3RpdmVFdmVudCkge1xuICAgIHZhciBldmVudCA9IHJhY3RpdmVFdmVudC5vcmlnaW5hbDtcbiAgICBpZiAoJChldmVudC5yZWxhdGVkVGFyZ2V0KS5jbG9zZXN0KCcuYW50ZW5uYS1kZWZhdWx0cy1mb290ZXIgYnV0dG9uJykuc2l6ZSgpID09IDApIHsgLy8gRG9uJ3QgaGlkZSB0aGUgaW5wdXQgd2hlbiB3ZSBjbGljayBvbiB0aGUgYnV0dG9uXG4gICAgICAgIHZhciAkZm9vdGVyID0gJChldmVudC50YXJnZXQpLmNsb3Nlc3QoJy5hbnRlbm5hLWRlZmF1bHRzLWZvb3RlcicpO1xuICAgICAgICB2YXIgaW5wdXQgPSAkZm9vdGVyLmZpbmQoJ2lucHV0Jyk7XG4gICAgICAgIGlmIChpbnB1dC52YWwoKSA9PT0gJycpIHtcbiAgICAgICAgICAgICRmb290ZXIuZmluZCgnYnV0dG9uJykuaGlkZSgpO1xuICAgICAgICAgICAgdmFyICRpbnB1dCA9ICRmb290ZXIuZmluZCgnaW5wdXQnKTtcbiAgICAgICAgICAgIC8vIFJlc2V0IHRoZSBpbnB1dCB2YWx1ZSB0byB0aGUgZGVmYXVsdCBpbiB0aGUgaHRtbC90ZW1wbGF0ZVxuICAgICAgICAgICAgJGlucHV0LnZhbCgkaW5wdXQuYXR0cigndmFsdWUnKSkucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBjcmVhdGVSZWFjdGlvblByb3ZpZGVyKCkge1xuXG4gICAgdmFyIGxvYWRlZFJlYWN0aW9uO1xuICAgIHZhciBjYWxsYmFja3MgPSBbXTtcblxuICAgIGZ1bmN0aW9uIG9uUmVhY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgY2FsbGJhY2tzLnB1c2goY2FsbGJhY2spO1xuICAgICAgICBub3RpZnlJZlJlYWR5KCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcmVhY3Rpb25Mb2FkZWQocmVhY3Rpb24pIHtcbiAgICAgICAgbG9hZGVkUmVhY3Rpb24gPSByZWFjdGlvbjtcbiAgICAgICAgbm90aWZ5SWZSZWFkeSgpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG5vdGlmeUlmUmVhZHkoKSB7XG4gICAgICAgIGlmIChsb2FkZWRSZWFjdGlvbikge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjYWxsYmFja3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFja3NbaV0obG9hZGVkUmVhY3Rpb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FsbGJhY2tzID0gW107XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBnZXQ6IG9uUmVhY3Rpb24sIC8vIFRPRE8gdGVybWlub2xvZ3lcbiAgICAgICAgcmVhY3Rpb25Mb2FkZWQ6IHJlYWN0aW9uTG9hZGVkXG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlOiBjcmVhdGVQYWdlXG59OyIsInZhciBBamF4Q2xpZW50ID0gcmVxdWlyZSgnLi91dGlscy9hamF4LWNsaWVudCcpO1xudmFyIEJyb3dzZXJNZXRyaWNzID0gcmVxdWlyZSgnLi91dGlscy9icm93c2VyLW1ldHJpY3MnKTtcbnZhciBVc2VyID0gcmVxdWlyZSgnLi91dGlscy91c2VyJyk7XG5cbmZ1bmN0aW9uIHBvc3RHcm91cFNldHRpbmdzTG9hZGVkKGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgZXZlbnQgPSBjcmVhdGVFdmVudChldmVudFR5cGVzLnNjcmlwdExvYWQsICcnLCBncm91cFNldHRpbmdzKTtcbiAgICBldmVudFthdHRyaWJ1dGVzLnBhZ2VJZF0gPSAnbmEnO1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMuYXJ0aWNsZUhlaWdodF0gPSAnbmEnO1xuICAgIHBvc3RFdmVudChldmVudCk7XG59XG5cbmZ1bmN0aW9uIHBvc3RQYWdlRGF0YUxvYWRlZChwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBldmVudCA9IGNyZWF0ZUV2ZW50KGV2ZW50VHlwZXMucGFnZURhdGFMb2FkZWQsICcnLCBncm91cFNldHRpbmdzKTtcbiAgICBhcHBlbmRQYWdlRGF0YVBhcmFtcyhldmVudCwgcGFnZURhdGEpO1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMuY29udGVudEF0dHJpYnV0ZXNdID0gcGFnZURhdGEubWV0cmljcy5pc011bHRpUGFnZSA/IGV2ZW50VmFsdWVzLm11bHRpcGxlUGFnZXMgOiBldmVudFZhbHVlcy5zaW5nbGVQYWdlO1xuICAgIHBvc3RFdmVudChldmVudCk7XG59XG5cbmZ1bmN0aW9uIHBvc3RSZWFjdGlvbldpZGdldE9wZW5lZChpc1Nob3dSZWFjdGlvbnMsIHBhZ2VEYXRhLCBjb250YWluZXJEYXRhLCBjb250ZW50RGF0YSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBldmVudFZhbHVlID0gaXNTaG93UmVhY3Rpb25zID8gZXZlbnRWYWx1ZXMuc2hvd1JlYWN0aW9ucyA6IGV2ZW50VmFsdWVzLnNob3dEZWZhdWx0cztcbiAgICB2YXIgZXZlbnQgPSBjcmVhdGVFdmVudChldmVudFR5cGVzLnJlYWN0aW9uV2lkZ2V0T3BlbmVkLCBldmVudFZhbHVlLCBncm91cFNldHRpbmdzKTtcbiAgICBhcHBlbmRQYWdlRGF0YVBhcmFtcyhldmVudCwgcGFnZURhdGEpO1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMuY29udGFpbmVySGFzaF0gPSBjb250YWluZXJEYXRhLmhhc2g7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5jb250YWluZXJLaW5kXSA9IGNvbnRlbnREYXRhLnR5cGU7XG4gICAgcG9zdEV2ZW50KGV2ZW50KTtcbn1cblxuZnVuY3Rpb24gcG9zdFN1bW1hcnlPcGVuZWQoaXNTaG93UmVhY3Rpb25zLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBldmVudFZhbHVlID0gaXNTaG93UmVhY3Rpb25zID8gZXZlbnRWYWx1ZXMudmlld1JlYWN0aW9ucyA6IGV2ZW50VmFsdWVzLnZpZXdEZWZhdWx0cztcbiAgICB2YXIgZXZlbnQgPSBjcmVhdGVFdmVudChldmVudFR5cGVzLnN1bW1hcnlXaWRnZXQsIGV2ZW50VmFsdWUsIGdyb3VwU2V0dGluZ3MpO1xuICAgIGFwcGVuZFBhZ2VEYXRhUGFyYW1zKGV2ZW50LCBwYWdlRGF0YSk7XG4gICAgcG9zdEV2ZW50KGV2ZW50KTtcbn1cblxuZnVuY3Rpb24gcG9zdFJlYWN0aW9uQ3JlYXRlZChwYWdlRGF0YSwgY29udGFpbmVyRGF0YSwgcmVhY3Rpb25EYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGV2ZW50ID0gY3JlYXRlRXZlbnQoZXZlbnRUeXBlcy5yZWFjdGlvbkNyZWF0ZWQsIHJlYWN0aW9uRGF0YS50ZXh0LCBncm91cFNldHRpbmdzKTtcbiAgICBhcHBlbmRQYWdlRGF0YVBhcmFtcyhldmVudCwgcGFnZURhdGEpO1xuICAgIGFwcGVuZENvbnRhaW5lckRhdGFQYXJhbXMoZXZlbnQsIGNvbnRhaW5lckRhdGEpO1xuICAgIGFwcGVuZFJlYWN0aW9uRGF0YVBhcmFtcyhldmVudCwgcmVhY3Rpb25EYXRhKTtcbiAgICBwb3N0RXZlbnQoZXZlbnQpO1xufVxuXG5mdW5jdGlvbiBwb3N0UmVhY3Rpb25TaGFyZWQodGFyZ2V0LCBwYWdlRGF0YSwgY29udGFpbmVyRGF0YSwgcmVhY3Rpb25EYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGV2ZW50VmFsdWUgPSB0YXJnZXQ7IC8vICdmYWNlYm9vaycsICd0d2l0dGVyJywgZXRjXG4gICAgdmFyIGV2ZW50ID0gY3JlYXRlRXZlbnQoZXZlbnRUeXBlcy5yZWFjdGlvblNoYXJlZCwgZXZlbnRWYWx1ZSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgYXBwZW5kUGFnZURhdGFQYXJhbXMoZXZlbnQsIHBhZ2VEYXRhKTtcbiAgICBhcHBlbmRDb250YWluZXJEYXRhUGFyYW1zKGV2ZW50LCBjb250YWluZXJEYXRhKTtcbiAgICBhcHBlbmRSZWFjdGlvbkRhdGFQYXJhbXMoZXZlbnQsIHJlYWN0aW9uRGF0YSk7XG4gICAgcG9zdEV2ZW50KGV2ZW50KTtcbn1cblxuZnVuY3Rpb24gcG9zdExvY2F0aW9uc1ZpZXdlZChwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBldmVudCA9IGNyZWF0ZUV2ZW50KGV2ZW50VHlwZXMuc3VtbWFyeVdpZGdldCwgZXZlbnRWYWx1ZXMubG9jYXRpb25zVmlld2VkLCBncm91cFNldHRpbmdzKTtcbiAgICBhcHBlbmRQYWdlRGF0YVBhcmFtcyhldmVudCwgcGFnZURhdGEpO1xuICAgIHBvc3RFdmVudChldmVudCk7XG59XG5cbmZ1bmN0aW9uIHBvc3RDb250ZW50Vmlld2VkKHBhZ2VEYXRhLCBjb250YWluZXJEYXRhLCBsb2NhdGlvbkRhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgZXZlbnQgPSBjcmVhdGVFdmVudChldmVudFR5cGVzLnN1bW1hcnlXaWRnZXQsIGV2ZW50VmFsdWVzLmNvbnRlbnRWaWV3ZWQsIGdyb3VwU2V0dGluZ3MpO1xuICAgIGFwcGVuZFBhZ2VEYXRhUGFyYW1zKGV2ZW50LCBwYWdlRGF0YSk7XG4gICAgYXBwZW5kQ29udGFpbmVyRGF0YVBhcmFtcyhldmVudCwgY29udGFpbmVyRGF0YSk7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5jb250ZW50SWRdID0gbG9jYXRpb25EYXRhLmNvbnRlbnRJZDtcbiAgICBldmVudFthdHRyaWJ1dGVzLmNvbnRlbnRMb2NhdGlvbl0gPSBsb2NhdGlvbkRhdGEubG9jYXRpb247XG4gICAgcG9zdEV2ZW50KGV2ZW50KTtcbn1cblxuZnVuY3Rpb24gcG9zdENvbW1lbnRzVmlld2VkKHBhZ2VEYXRhLCBjb250YWluZXJEYXRhLCByZWFjdGlvbkRhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgZXZlbnQgPSBjcmVhdGVFdmVudChldmVudFR5cGVzLmNvbW1lbnRzVmlld2VkLCAnJywgZ3JvdXBTZXR0aW5ncyk7XG4gICAgYXBwZW5kUGFnZURhdGFQYXJhbXMoZXZlbnQsIHBhZ2VEYXRhKTtcbiAgICBhcHBlbmRDb250YWluZXJEYXRhUGFyYW1zKGV2ZW50LCBjb250YWluZXJEYXRhKTtcbiAgICBhcHBlbmRSZWFjdGlvbkRhdGFQYXJhbXMoZXZlbnQsIHJlYWN0aW9uRGF0YSk7XG4gICAgcG9zdEV2ZW50KGV2ZW50KTtcbn1cblxuZnVuY3Rpb24gcG9zdENvbW1lbnRDcmVhdGVkKHBhZ2VEYXRhLCBjb250YWluZXJEYXRhLCByZWFjdGlvbkRhdGEsIGNvbW1lbnQsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgZXZlbnQgPSBjcmVhdGVFdmVudChldmVudFR5cGVzLmNvbW1lbnRDcmVhdGVkLCBjb21tZW50LCBncm91cFNldHRpbmdzKTtcbiAgICBhcHBlbmRQYWdlRGF0YVBhcmFtcyhldmVudCwgcGFnZURhdGEpO1xuICAgIGFwcGVuZENvbnRhaW5lckRhdGFQYXJhbXMoZXZlbnQsIGNvbnRhaW5lckRhdGEpO1xuICAgIGFwcGVuZFJlYWN0aW9uRGF0YVBhcmFtcyhldmVudCwgcmVhY3Rpb25EYXRhKTtcbiAgICBwb3N0RXZlbnQoZXZlbnQpO1xufVxuXG5mdW5jdGlvbiBwb3N0UmVjaXJjQ2xpY2tlZChwYWdlRGF0YSwgcmVhY3Rpb25JZCwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBldmVudCA9IGNyZWF0ZUV2ZW50KGV2ZW50VHlwZXMucmVjaXJjQ2xpY2tlZCwgcmVhY3Rpb25JZCwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgYXBwZW5kUGFnZURhdGFQYXJhbXMoZXZlbnQsIHBhZ2VEYXRhKTtcbiAgICBwb3N0RXZlbnQoZXZlbnQpO1xufVxuXG5mdW5jdGlvbiBhcHBlbmRQYWdlRGF0YVBhcmFtcyhldmVudCwgcGFnZURhdGEpIHtcbiAgICBldmVudFthdHRyaWJ1dGVzLnBhZ2VJZF0gPSBwYWdlRGF0YS5wYWdlSWQ7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5wYWdlVGl0bGVdID0gcGFnZURhdGEudGl0bGU7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5jYW5vbmljYWxVcmxdID0gcGFnZURhdGEuY2Fub25pY2FsVXJsO1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMucGFnZVVybF0gPSBwYWdlRGF0YS5yZXF1ZXN0ZWRVcmw7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5hcnRpY2xlSGVpZ2h0XSA9IDAgfHwgcGFnZURhdGEubWV0cmljcy5oZWlnaHQ7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5wYWdlVG9waWNzXSA9IHBhZ2VEYXRhLnRvcGljcztcbiAgICBldmVudFthdHRyaWJ1dGVzLmF1dGhvcl0gPSBwYWdlRGF0YS5hdXRob3I7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5zaXRlU2VjdGlvbl0gPSBwYWdlRGF0YS5zZWN0aW9uO1xufVxuXG5mdW5jdGlvbiBhcHBlbmRDb250YWluZXJEYXRhUGFyYW1zKGV2ZW50LCBjb250YWluZXJEYXRhKSB7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5jb250YWluZXJIYXNoXSA9IGNvbnRhaW5lckRhdGEuaGFzaDtcbiAgICBldmVudFthdHRyaWJ1dGVzLmNvbnRhaW5lcktpbmRdID0gY29udGFpbmVyRGF0YS50eXBlO1xufVxuXG5mdW5jdGlvbiBhcHBlbmRSZWFjdGlvbkRhdGFQYXJhbXMoZXZlbnQsIHJlYWN0aW9uRGF0YSkge1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMucmVhY3Rpb25Cb2R5XSA9IHJlYWN0aW9uRGF0YS50ZXh0O1xuICAgIGlmIChyZWFjdGlvbkRhdGEuY29udGVudCkge1xuICAgICAgICBldmVudFthdHRyaWJ1dGVzLmNvbnRlbnRMb2NhdGlvbl0gPSByZWFjdGlvbkRhdGEuY29udGVudC5sb2NhdGlvbjtcbiAgICAgICAgZXZlbnRbYXR0cmlidXRlcy5jb250ZW50SWRdID0gcmVhY3Rpb25EYXRhLmNvbnRlbnQuaWQ7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBjcmVhdGVFdmVudChldmVudFR5cGUsIGV2ZW50VmFsdWUsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgcmVmZXJyZXJEb21haW4gPSBkb2N1bWVudC5yZWZlcnJlci5zcGxpdCgnLycpLnNwbGljZSgyKS5qb2luKCcvJyk7IC8vIFRPRE86IGVuZ2FnZV9mdWxsIGNvZGUuIFJldmlld1xuXG4gICAgdmFyIGV2ZW50ID0ge307XG4gICAgZXZlbnRbYXR0cmlidXRlcy5ldmVudFR5cGVdID0gZXZlbnRUeXBlO1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMuZXZlbnRWYWx1ZV0gPSBldmVudFZhbHVlO1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMuZ3JvdXBJZF0gPSBncm91cFNldHRpbmdzLmdyb3VwSWQoKTtcbiAgICBldmVudFthdHRyaWJ1dGVzLnNob3J0VGVybVNlc3Npb25dID0gZ2V0U2hvcnRUZXJtU2Vzc2lvbklkKCk7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5sb25nVGVybVNlc3Npb25dID0gZ2V0TG9uZ1Rlcm1TZXNzaW9uSWQoKTtcbiAgICBldmVudFthdHRyaWJ1dGVzLnJlZmVycmVyVXJsXSA9IHJlZmVycmVyRG9tYWluO1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMuaXNUb3VjaEJyb3dzZXJdID0gQnJvd3Nlck1ldHJpY3Muc3VwcG9ydHNUb3VjaCgpO1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMuc2NyZWVuV2lkdGhdID0gc2NyZWVuLndpZHRoO1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMuc2NyZWVuSGVpZ2h0XSA9IHNjcmVlbi5oZWlnaHQ7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5waXhlbERlbnNpdHldID0gd2luZG93LmRldmljZVBpeGVsUmF0aW8gfHwgTWF0aC5yb3VuZCh3aW5kb3cuc2NyZWVuLmF2YWlsV2lkdGggLyBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50V2lkdGgpOyAvLyBUT0RPOiByZXZpZXcgdGhpcyBlbmdhZ2VfZnVsbCBjb2RlLCB3aGljaCBkb2Vzbid0IHNlZW0gY29ycmVjdFxuICAgIGV2ZW50W2F0dHJpYnV0ZXMudXNlckFnZW50XSA9IG5hdmlnYXRvci51c2VyQWdlbnQ7XG4gICAgcmV0dXJuIGV2ZW50O1xufVxuXG5mdW5jdGlvbiBwb3N0RXZlbnQoZXZlbnQpIHtcbiAgICBVc2VyLmNhY2hlZFVzZXIoZnVuY3Rpb24odXNlckluZm8pIHsgLy8gV2UgZG9uJ3Qgd2FudCB0byBjcmVhdGUgdXNlcnMganVzdCBmb3IgZXZlbnRzIChlLmcuIGV2ZXJ5IHNjcmlwdCBsb2FkKSwgYnV0IGFkZCB1c2VyIGluZm8gaWYgd2UgaGF2ZSBpdCBhbHJlYWR5LlxuICAgICAgICBpZiAodXNlckluZm8pIHtcbiAgICAgICAgICAgIGV2ZW50W2F0dHJpYnV0ZXMudXNlcklkXSA9IHVzZXJJbmZvLnVzZXJfaWQ7XG4gICAgICAgIH1cbiAgICAgICAgZmlsbEluTWlzc2luZ1Byb3BlcnRpZXMoZXZlbnQpO1xuICAgICAgICAvLyBTZW5kIHRoZSBldmVudCB0byBCaWdRdWVyeVxuICAgICAgICBBamF4Q2xpZW50LnBvc3RFdmVudChldmVudCk7XG4gICAgfSk7XG59XG5cbi8vIEZpbGwgaW4gYW55IG9wdGlvbmFsIHByb3BlcnRpZXMgd2l0aCBudWxsIHZhbHVlcy5cbmZ1bmN0aW9uIGZpbGxJbk1pc3NpbmdQcm9wZXJ0aWVzKGV2ZW50KSB7XG4gICAgZm9yICh2YXIgYXR0ciBpbiBhdHRyaWJ1dGVzKSB7XG4gICAgICAgIGlmIChldmVudFthdHRyaWJ1dGVzW2F0dHJdXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBldmVudFthdHRyaWJ1dGVzW2F0dHJdXSA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGdldExvbmdUZXJtU2Vzc2lvbklkKCkge1xuICAgIHZhciBndWlkID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ2FudF9sdHMnKTtcbiAgICBpZiAoIWd1aWQpIHtcbiAgICAgICAgZ3VpZCA9IGNyZWF0ZUd1aWQoKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdhbnRfbHRzJywgZ3VpZCk7XG4gICAgICAgIH0gY2F0Y2goZXJyb3IpIHtcbiAgICAgICAgICAgIC8vIFNvbWUgYnJvd3NlcnMgKG1vYmlsZSBTYWZhcmkpIHRocm93IGFuIGV4Y2VwdGlvbiB3aGVuIGluIHByaXZhdGUgYnJvd3NpbmcgbW9kZS5cbiAgICAgICAgICAgIC8vIE5vdGhpbmcgd2UgY2FuIGRvIGFib3V0IGl0LiBKdXN0IGZhbGwgdGhyb3VnaCBhbmQgcmV0dXJuIHRoZSB2YWx1ZSB3ZSBnZW5lcmF0ZWQuXG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGd1aWQ7XG59XG5cbmZ1bmN0aW9uIGdldFNob3J0VGVybVNlc3Npb25JZCgpIHtcbiAgICB2YXIgc2Vzc2lvbjtcbiAgICB2YXIganNvbiA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdhbnRfc3RzJyk7XG4gICAgaWYgKGpzb24pIHtcbiAgICAgICAgc2Vzc2lvbiA9IEpTT04ucGFyc2UoanNvbik7XG4gICAgICAgIGlmIChEYXRlLm5vdygpID4gc2Vzc2lvbi5leHBpcmVzKSB7XG4gICAgICAgICAgICBzZXNzaW9uID0gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAoIXNlc3Npb24pIHtcbiAgICAgICAgdmFyIG1pbnV0ZXMgPSAxNTtcbiAgICAgICAgc2Vzc2lvbiA9IHtcbiAgICAgICAgICAgIGd1aWQ6IGNyZWF0ZUd1aWQoKSxcbiAgICAgICAgICAgIGV4cGlyZXM6IERhdGUubm93KCkgKyBtaW51dGVzICogNjAwMDBcbiAgICAgICAgfTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2FudF9zdHMnLCBKU09OLnN0cmluZ2lmeShzZXNzaW9uKSk7XG4gICAgfSBjYXRjaChlcnJvcikge1xuICAgICAgICAvLyBTb21lIGJyb3dzZXJzIChtb2JpbGUgU2FmYXJpKSB0aHJvdyBhbiBleGNlcHRpb24gd2hlbiBpbiBwcml2YXRlIGJyb3dzaW5nIG1vZGUuXG4gICAgICAgIC8vIE5vdGhpbmcgd2UgY2FuIGRvIGFib3V0IGl0LiBKdXN0IGZhbGwgdGhyb3VnaCBhbmQgcmV0dXJuIHRoZSB2YWx1ZSB3ZSBnZW5lcmF0ZWQuXG4gICAgfVxuICAgIHJldHVybiBzZXNzaW9uLmd1aWQ7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUd1aWQoKSB7XG4gICAgLy8gQ29kZSBjb3BpZWQgZnJvbSBlbmdhZ2VfZnVsbCAob3JpZ2luYWxseSwgaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xMDUwMzQvY3JlYXRlLWd1aWQtdXVpZC1pbi1qYXZhc2NyaXB0KVxuICAgIHJldHVybiAneHh4eHh4eHgteHh4eC00eHh4LXl4eHgteHh4eHh4eHh4eHh4Jy5yZXBsYWNlKC9beHldL2csIGZ1bmN0aW9uIChjKSB7XG4gICAgICAgIHZhciByID0gTWF0aC5yYW5kb20oKSAqIDE2IHwgMCwgdiA9IGMgPT0gJ3gnID8gciA6IChyICYgMHgzIHwgMHg4KTtcbiAgICAgICAgcmV0dXJuIHYudG9TdHJpbmcoMTYpO1xuICAgIH0pO1xufVxuXG52YXIgYXR0cmlidXRlcyA9IHtcbiAgICBldmVudFR5cGU6ICdldCcsXG4gICAgZXZlbnRWYWx1ZTogJ2V2JyxcbiAgICBncm91cElkOiAnZ2lkJyxcbiAgICB1c2VySWQ6ICd1aWQnLFxuICAgIHBhZ2VJZDogJ3BpZCcsXG4gICAgbG9uZ1Rlcm1TZXNzaW9uOiAnbHRzJyxcbiAgICBzaG9ydFRlcm1TZXNzaW9uOiAnc3RzJyxcbiAgICByZWZlcnJlclVybDogJ3JlZicsXG4gICAgY29udGVudElkOiAnY2lkJyxcbiAgICBhcnRpY2xlSGVpZ2h0OiAnYWgnLFxuICAgIGNvbnRhaW5lckhhc2g6ICdjaCcsXG4gICAgY29udGFpbmVyS2luZDogJ2NrJyxcbiAgICByZWFjdGlvbkJvZHk6ICdyJyxcbiAgICBwYWdlVGl0bGU6ICdwdCcsXG4gICAgY2Fub25pY2FsVXJsOiAnY3UnLFxuICAgIHBhZ2VVcmw6ICdwdScsXG4gICAgY29udGVudEF0dHJpYnV0ZXM6ICdjYScsXG4gICAgY29udGVudExvY2F0aW9uOiAnY2wnLFxuICAgIHBhZ2VUb3BpY3M6ICdwdG9wJyxcbiAgICBhdXRob3I6ICdhJyxcbiAgICBzaXRlU2VjdGlvbjogJ3NlYycsXG4gICAgaXNUb3VjaEJyb3dzZXI6ICdpdCcsXG4gICAgc2NyZWVuV2lkdGg6ICdzdycsXG4gICAgc2NyZWVuSGVpZ2h0OiAnc2gnLFxuICAgIHBpeGVsRGVuc2l0eTogJ3BkJyxcbiAgICB1c2VyQWdlbnQ6ICd1YSdcbn07XG5cbnZhciBldmVudFR5cGVzID0ge1xuICAgIHNjcmlwdExvYWQ6ICdzbCcsXG4gICAgcmVhY3Rpb25TaGFyZWQ6ICdzaCcsXG4gICAgc3VtbWFyeVdpZGdldDogJ3NiJyxcbiAgICByZWFjdGlvbldpZGdldE9wZW5lZDogJ3JzJyxcbiAgICBwYWdlRGF0YUxvYWRlZDogJ3dsJyxcbiAgICBjb21tZW50Q3JlYXRlZDogJ2MnLFxuICAgIHJlYWN0aW9uQ3JlYXRlZDogJ3JlJyxcbiAgICBjb21tZW50c1ZpZXdlZDogJ3Zjb20nLFxuICAgIHJlY2lyY0NsaWNrZWQ6ICdyYydcbn07XG5cbnZhciBldmVudFZhbHVlcyA9IHtcbiAgICBjb250ZW50Vmlld2VkOiAndmMnLCAvLyB2aWV3X2NvbnRlbnRcbiAgICBsb2NhdGlvbnNWaWV3ZWQ6ICd2cicsIC8vIHZpZXdfcmVhY3Rpb25zXG4gICAgc2hvd0RlZmF1bHRzOiAnd3InLFxuICAgIHNob3dSZWFjdGlvbnM6ICdyZCcsXG4gICAgc2luZ2xlUGFnZTogJ3NpJyxcbiAgICBtdWx0aXBsZVBhZ2VzOiAnbXUnLFxuICAgIHZpZXdSZWFjdGlvbnM6ICd2dycsXG4gICAgdmlld0RlZmF1bHRzOiAnYWQnXG59O1xuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgcG9zdEdyb3VwU2V0dGluZ3NMb2FkZWQ6IHBvc3RHcm91cFNldHRpbmdzTG9hZGVkLFxuICAgIHBvc3RQYWdlRGF0YUxvYWRlZDogcG9zdFBhZ2VEYXRhTG9hZGVkLFxuICAgIHBvc3RTdW1tYXJ5T3BlbmVkOiBwb3N0U3VtbWFyeU9wZW5lZCxcbiAgICBwb3N0Q29tbWVudHNWaWV3ZWQ6IHBvc3RDb21tZW50c1ZpZXdlZCxcbiAgICBwb3N0Q29tbWVudENyZWF0ZWQ6IHBvc3RDb21tZW50Q3JlYXRlZCxcbiAgICBwb3N0UmVhY3Rpb25XaWRnZXRPcGVuZWQ6IHBvc3RSZWFjdGlvbldpZGdldE9wZW5lZCxcbiAgICBwb3N0UmVhY3Rpb25DcmVhdGVkOiBwb3N0UmVhY3Rpb25DcmVhdGVkLFxuICAgIHBvc3RSZWFjdGlvblNoYXJlZDogcG9zdFJlYWN0aW9uU2hhcmVkLFxuICAgIHBvc3RMb2NhdGlvbnNWaWV3ZWQ6IHBvc3RMb2NhdGlvbnNWaWV3ZWQsXG4gICAgcG9zdENvbnRlbnRWaWV3ZWQ6IHBvc3RDb250ZW50Vmlld2VkLFxuICAgIHBvc3RSZWNpcmNDbGlja2VkOiBwb3N0UmVjaXJjQ2xpY2tlZFxufTsiLCJ2YXIgUmFjdGl2ZTsgcmVxdWlyZSgnLi91dGlscy9yYWN0aXZlLXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGxvYWRlZFJhY3RpdmUpIHsgUmFjdGl2ZSA9IGxvYWRlZFJhY3RpdmU7fSk7XG52YXIgU1ZHcyA9IHJlcXVpcmUoJy4vc3ZncycpO1xuXG52YXIgcGFnZVNlbGVjdG9yID0gJy5hbnRlbm5hLWVycm9yLXBhZ2UnO1xuXG5mdW5jdGlvbiBjcmVhdGVQYWdlKG9wdGlvbnMpIHtcbiAgICB2YXIgZWxlbWVudCA9IG9wdGlvbnMuZWxlbWVudDtcbiAgICB2YXIgZ29CYWNrID0gb3B0aW9ucy5nb0JhY2s7XG4gICAgdmFyIHJhY3RpdmUgPSBSYWN0aXZlKHtcbiAgICAgICAgZWw6IGVsZW1lbnQsXG4gICAgICAgIGFwcGVuZDogdHJ1ZSxcbiAgICAgICAgZGF0YToge30sXG4gICAgICAgIHRlbXBsYXRlOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvZ2VuZXJpYy1lcnJvci1wYWdlLmhicy5odG1sJyksXG4gICAgICAgIHBhcnRpYWxzOiB7XG4gICAgICAgICAgICBsZWZ0OiBTVkdzLmxlZnRcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJhY3RpdmUub24oJ2JhY2snLCBnb0JhY2spO1xuICAgIHJldHVybiB7XG4gICAgICAgIHNlbGVjdG9yOiBwYWdlU2VsZWN0b3IsXG4gICAgICAgIHRlYXJkb3duOiBmdW5jdGlvbigpIHsgcmFjdGl2ZS50ZWFyZG93bigpOyB9XG4gICAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlUGFnZTogY3JlYXRlUGFnZVxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi91dGlscy9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciBBamF4Q2xpZW50ID0gcmVxdWlyZSgnLi91dGlscy9hamF4LWNsaWVudCcpO1xudmFyIFVSTHMgPSByZXF1aXJlKCcuL3V0aWxzL3VybHMnKTtcbnZhciBHcm91cFNldHRpbmdzID0gcmVxdWlyZSgnLi9ncm91cC1zZXR0aW5ncycpO1xuXG4vLyBUT0RPIGZvbGQgdGhpcyBtb2R1bGUgaW50byBncm91cC1zZXR0aW5ncz9cblxuZnVuY3Rpb24gbG9hZFNldHRpbmdzKGNhbGxiYWNrKSB7XG4gICAgQWpheENsaWVudC5nZXRKU09OUChVUkxzLmdyb3VwU2V0dGluZ3NVcmwoKSwgeyBob3N0X25hbWU6IHdpbmRvdy5hbnRlbm5hX2hvc3QgfSwgc3VjY2VzcywgZXJyb3IpO1xuXG4gICAgZnVuY3Rpb24gc3VjY2Vzcyhqc29uKSB7XG4gICAgICAgIHZhciBncm91cFNldHRpbmdzID0gR3JvdXBTZXR0aW5ncy5jcmVhdGUoanNvbik7XG4gICAgICAgIGNhbGxiYWNrKGdyb3VwU2V0dGluZ3MpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGVycm9yKG1lc3NhZ2UpIHtcbiAgICAgICAgLy8gVE9ETyBoYW5kbGUgZXJyb3JzIHRoYXQgaGFwcGVuIHdoZW4gbG9hZGluZyBjb25maWcgZGF0YVxuICAgICAgICBjb25zb2xlLmxvZygnQW4gZXJyb3Igb2NjdXJyZWQgbG9hZGluZyBncm91cCBzZXR0aW5nczogJyArIG1lc3NhZ2UpO1xuICAgIH1cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGxvYWQ6IGxvYWRTZXR0aW5nc1xufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi91dGlscy9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcblxudmFyIEV2ZW50cyA9IHJlcXVpcmUoJy4vZXZlbnRzJyk7XG5cbnZhciBncm91cFNldHRpbmdzO1xuXG4vLyBUT0RPOiBVcGRhdGUgYWxsIGNsaWVudHMgdGhhdCBhcmUgcGFzc2luZyBhcm91bmQgYSBncm91cFNldHRpbmdzIG9iamVjdCB0byBpbnN0ZWFkIGFjY2VzcyB0aGUgJ2dsb2JhbCcgc2V0dGluZ3MgaW5zdGFuY2VcbmZ1bmN0aW9uIGdldEdyb3VwU2V0dGluZ3MoKSB7XG4gICAgcmV0dXJuIGdyb3VwU2V0dGluZ3M7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZUZyb21KU09OKGpzb24pIHtcbiAgICBncm91cFNldHRpbmdzID0gY3JlYXRlRnJvbUpTT04oanNvbik7XG4gICAgRXZlbnRzLnBvc3RHcm91cFNldHRpbmdzTG9hZGVkKGdyb3VwU2V0dGluZ3MpO1xuICAgIHJldHVybiBncm91cFNldHRpbmdzO1xufVxuXG5cbi8vIFRPRE86IHRyaW0gdHJhaWxpbmcgY29tbWFzIGZyb20gYW55IHNlbGVjdG9yIHZhbHVlc1xuXG4vLyBUT0RPOiBSZXZpZXcuIFRoZXNlIGFyZSBqdXN0IGNvcGllZCBmcm9tIGVuZ2FnZV9mdWxsLlxudmFyIGRlZmF1bHRzID0ge1xuICAgIHByZW1pdW06IGZhbHNlLFxuICAgIGltZ19zZWxlY3RvcjogXCJpbWdcIiwgLy8gVE9ETzogdGhpcyBpcyBzb21lIGJvZ3VzIG9ic29sZXRlIHByb3BlcnR5LiB3ZSBzaG91bGRuJ3QgdXNlIGl0LlxuICAgIGltZ19jb250YWluZXJfc2VsZWN0b3JzOlwiI3ByaW1hcnktcGhvdG9cIixcbiAgICBhY3RpdmVfc2VjdGlvbnM6IFwiYm9keVwiLFxuICAgIC8vYW5ub193aGl0ZWxpc3Q6IFwiYm9keSBwXCIsXG4gICAgYW5ub193aGl0ZWxpc3Q6IFwicFwiLCAvLyBUT0RPOiBUaGUgY3VycmVudCBkZWZhdWx0IGlzIFwiYm9keSBwXCIsIHdoaWNoIG1ha2VzIG5vIHNlbnNlIHdoZW4gd2UncmUgc2VhcmNoaW5nIG9ubHkgd2l0aGluIHRoZSBhY3RpdmUgc2VjdGlvbnNcbiAgICBhY3RpdmVfc2VjdGlvbnNfd2l0aF9hbm5vX3doaXRlbGlzdDpcIlwiLFxuICAgIG1lZGlhX3NlbGVjdG9yOiBcImVtYmVkLCB2aWRlbywgb2JqZWN0LCBpZnJhbWVcIixcbiAgICBjb21tZW50X2xlbmd0aDogNTAwLFxuICAgIG5vX2FudDogXCJcIixcbiAgICBpbWdfYmxhY2tsaXN0OiBcIlwiLFxuICAgIGN1c3RvbV9jc3M6IFwiXCIsXG4gICAgLy90b2RvOiB0ZW1wIGlubGluZV9pbmRpY2F0b3IgZGVmYXVsdHMgdG8gbWFrZSB0aGVtIHNob3cgdXAgb24gYWxsIG1lZGlhIC0gcmVtb3ZlIHRoaXMgbGF0ZXIuXG4gICAgaW5saW5lX3NlbGVjdG9yOiAnaW1nLCBlbWJlZCwgdmlkZW8sIG9iamVjdCwgaWZyYW1lJyxcbiAgICBwYXJhZ3JhcGhfaGVscGVyOiB0cnVlLFxuICAgIG1lZGlhX3VybF9pZ25vcmVfcXVlcnk6IHRydWUsXG4gICAgc3VtbWFyeV93aWRnZXRfc2VsZWN0b3I6ICcuYW50LXBhZ2Utc3VtbWFyeScsIC8vIFRPRE86IHRoaXMgd2Fzbid0IGRlZmluZWQgYXMgYSBkZWZhdWx0IGluIGVuZ2FnZV9mdWxsLCBidXQgd2FzIGluIGNvZGUuIHdoeT9cbiAgICBzdW1tYXJ5X3dpZGdldF9tZXRob2Q6ICdhZnRlcicsXG4gICAgbGFuZ3VhZ2U6ICdlbicsXG4gICAgYWJfdGVzdF9pbXBhY3Q6IHRydWUsXG4gICAgYWJfdGVzdF9zYW1wbGVfcGVyY2VudGFnZTogMTAsXG4gICAgaW1nX2luZGljYXRvcl9zaG93X29ubG9hZDogdHJ1ZSxcbiAgICBpbWdfaW5kaWNhdG9yX3Nob3dfc2lkZTogJ2xlZnQnLFxuICAgIHRhZ19ib3hfYmdfY29sb3JzOiAnJyxcbiAgICB0YWdfYm94X3RleHRfY29sb3JzOiAnJyxcbiAgICB0YWdfYm94X2ZvbnRfZmFtaWx5OiAnSGVsdmV0aWNhTmV1ZSxIZWx2ZXRpY2EsQXJpYWwsc2Fucy1zZXJpZicsXG4gICAgdGFnc19iZ19jc3M6ICcnLFxuICAgIGlnbm9yZV9zdWJkb21haW46IGZhbHNlLFxuICAgIGltYWdlX3NlbGVjdG9yOiAnbWV0YVtwcm9wZXJ0eT1cIm9nOmltYWdlXCJdJywgLy8gVE9ETzogcmV2aWV3IHdoYXQgdGhpcyBzaG91bGQgYmUgKG5vdCBmcm9tIGVuZ2FnZV9mdWxsKVxuICAgIGltYWdlX2F0dHJpYnV0ZTogJ2NvbnRlbnQnLCAvLyBUT0RPOiByZXZpZXcgd2hhdCB0aGlzIHNob3VsZCBiZSAobm90IGZyb20gZW5nYWdlX2Z1bGwpLFxuICAgIHF1ZXJ5c3RyaW5nX2NvbnRlbnQ6IGZhbHNlLFxuICAgIGluaXRpYWxfcGluX2xpbWl0OiAzLFxuICAgIC8vdGhlIHNjb3BlIGluIHdoaWNoIHRvIGZpbmQgcGFyZW50cyBvZiA8YnI+IHRhZ3MuXG4gICAgLy9UaG9zZSBwYXJlbnRzIHdpbGwgYmUgY29udmVydGVkIHRvIGEgPHJ0PiBibG9jaywgc28gdGhlcmUgd29uJ3QgYmUgbmVzdGVkIDxwPiBibG9ja3MuXG4gICAgLy90aGVuIGl0IHdpbGwgc3BsaXQgdGhlIHBhcmVudCdzIGh0bWwgb24gPGJyPiB0YWdzIGFuZCB3cmFwIHRoZSBzZWN0aW9ucyBpbiA8cD4gdGFncy5cblxuICAgIC8vZXhhbXBsZTpcbiAgICAvLyBicl9yZXBsYWNlX3Njb3BlX3NlbGVjdG9yOiBcIi5hbnRfYnJfcmVwbGFjZVwiIC8vZS5nLiBcIiNtYWluc2VjdGlvblwiIG9yIFwicFwiXG5cbiAgICBicl9yZXBsYWNlX3Njb3BlX3NlbGVjdG9yOiBudWxsIC8vZS5nLiBcIiNtYWluc2VjdGlvblwiIG9yIFwicFwiXG59O1xuXG5mdW5jdGlvbiBjcmVhdGVGcm9tSlNPTihqc29uKSB7XG5cbiAgICBmdW5jdGlvbiBkYXRhKGtleSwgaWZBYnNlbnQpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIHZhbHVlO1xuICAgICAgICAgICAgaWYgKHdpbmRvdy5hbnRlbm5hX2V4dGVuZCkge1xuICAgICAgICAgICAgICAgIHZhbHVlID0gd2luZG93LmFudGVubmFfZXh0ZW5kW2tleV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodmFsdWUgPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSBqc29uW2tleV07XG4gICAgICAgICAgICAgICAgLy8gVE9ETzogb3VyIHNlcnZlciBhcHBhcmVudGx5IHNlbmRzIGJhY2sgbnVsbCBhcyBhIHZhbHVlIGZvciBzb21lIGF0dHJpYnV0ZXMuXG4gICAgICAgICAgICAgICAgLy8gVE9ETzogY29uc2lkZXIgY2hlY2tpbmcgZm9yIG51bGwgd2hlcmV2ZXIgd2UncmUgY2hlY2tpbmcgZm9yIHVuZGVmaW5lZFxuICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlID09PSAnJyB8fCB2YWx1ZSA9PT0gbnVsbCkgeyAvLyBUT0RPOiBTaG91bGQgdGhlIHNlcnZlciBiZSBzZW5kaW5nIGJhY2sgJycgaGVyZSBvciBub3RoaW5nIGF0IGFsbD8gKEl0IHByZWNsdWRlcyB0aGUgc2VydmVyIGZyb20gcmVhbGx5IHNheWluZyAnbm90aGluZycpXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gZGVmYXVsdHNba2V5XTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodmFsdWUgPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGlmQWJzZW50O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGV4Y2x1c2lvblNlbGVjdG9yKGtleSwgZGVwcmVjYXRlZEtleSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgc2VsZWN0b3JzID0gW107XG4gICAgICAgICAgICB2YXIgbm9BbnQgPSBkYXRhKCdub19hbnQnKSgpO1xuICAgICAgICAgICAgaWYgKG5vQW50KSB7XG4gICAgICAgICAgICAgICAgc2VsZWN0b3JzLnB1c2gobm9BbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIG5vUmVhZHIgPSBkYXRhKCdub19yZWFkcicpKCk7XG4gICAgICAgICAgICBpZiAobm9SZWFkcikge1xuICAgICAgICAgICAgICAgIHNlbGVjdG9ycy5wdXNoKG5vUmVhZHIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHNlbGVjdG9ycy5qb2luKCcsJyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBiYWNrZ3JvdW5kQ29sb3IoYWNjZXNzb3IpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIGNvbG9ycyA9IFtdO1xuICAgICAgICAgICAgdmFyIHZhbHVlID0gYWNjZXNzb3IoKTtcbiAgICAgICAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgIGNvbG9ycyA9IHZhbHVlLnNwbGl0KCc7Jyk7XG4gICAgICAgICAgICAgICAgY29sb3JzID0gbWlncmF0ZVZhbHVlcyhjb2xvcnMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGNvbG9ycztcblxuICAgICAgICAgICAgLy8gTWlncmF0ZSBhbnkgY29sb3JzIGZyb20gdGhlICcxLCAyLCAzJyBmb3JtYXQgdG8gJ3JnYigxLCAyLCAzKScuIFRoaXMgY29kZSBjYW4gYmUgZGVsZXRlZCBvbmNlIHdlJ3ZlIHVwZGF0ZWRcbiAgICAgICAgICAgIC8vIGFsbCBzaXRlcyB0byBzcGVjaWZ5aW5nIHZhbGlkIENTUyBjb2xvciB2YWx1ZXNcbiAgICAgICAgICAgIGZ1bmN0aW9uIG1pZ3JhdGVWYWx1ZXMoY29sb3JWYWx1ZXMpIHtcbiAgICAgICAgICAgICAgICB2YXIgbWlncmF0aW9uTWF0Y2hlciA9IC9eXFxzKlxcZCtcXHMqLFxccypcXGQrXFxzKixcXHMqXFxkK1xccyokL2dpbTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvbG9yVmFsdWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9IGNvbG9yVmFsdWVzW2ldO1xuICAgICAgICAgICAgICAgICAgICBpZiAobWlncmF0aW9uTWF0Y2hlci50ZXN0KHZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3JWYWx1ZXNbaV0gPSAncmdiKCcgKyB2YWx1ZSArICcpJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gY29sb3JWYWx1ZXM7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkZWZhdWx0UmVhY3Rpb25zKCRlbGVtZW50KSB7XG4gICAgICAgIC8vIERlZmF1bHQgcmVhY3Rpb25zIGFyZSBhdmFpbGFibGUgaW4gdGhyZWUgbG9jYXRpb25zIGluIHRocmVlIGRhdGEgZm9ybWF0czpcbiAgICAgICAgLy8gMS4gQXMgYSBjb21tYS1zZXBhcmF0ZWQgYXR0cmlidXRlIHZhbHVlIG9uIGEgcGFydGljdWxhciBlbGVtZW50XG4gICAgICAgIC8vIDIuIEFzIGFuIGFycmF5IG9mIHN0cmluZ3Mgb24gdGhlIHdpbmRvdy5hbnRlbm5hX2V4dGVuZCBwcm9wZXJ0eVxuICAgICAgICAvLyAzLiBBcyBhIGpzb24gb2JqZWN0IHdpdGggYSBib2R5IGFuZCBpZCBvbiB0aGUgZ3JvdXAgc2V0dGluZ3NcbiAgICAgICAgdmFyIHJlYWN0aW9ucyA9IFtdO1xuICAgICAgICB2YXIgcmVhY3Rpb25TdHJpbmdzO1xuICAgICAgICB2YXIgZWxlbWVudFJlYWN0aW9ucyA9ICRlbGVtZW50ID8gJGVsZW1lbnQuYXR0cignYW50LXJlYWN0aW9ucycpIDogdW5kZWZpbmVkO1xuICAgICAgICBpZiAoZWxlbWVudFJlYWN0aW9ucykge1xuICAgICAgICAgICAgcmVhY3Rpb25TdHJpbmdzID0gZWxlbWVudFJlYWN0aW9ucy5zcGxpdCgnOycpO1xuICAgICAgICB9IGVsc2UgaWYgKHdpbmRvdy5hbnRlbm5hX2V4dGVuZCkge1xuICAgICAgICAgICAgcmVhY3Rpb25TdHJpbmdzID0gd2luZG93LmFudGVubmFfZXh0ZW5kWydkZWZhdWx0X3JlYWN0aW9ucyddO1xuICAgICAgICB9XG4gICAgICAgIGlmIChyZWFjdGlvblN0cmluZ3MpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmVhY3Rpb25TdHJpbmdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgcmVhY3Rpb25zLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICB0ZXh0OiByZWFjdGlvblN0cmluZ3NbaV0sXG4gICAgICAgICAgICAgICAgICAgIGlzRGVmYXVsdDogdHJ1ZVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgdmFsdWVzID0ganNvblsnZGVmYXVsdF9yZWFjdGlvbnMnXTtcbiAgICAgICAgICAgIGlmICh2YWx1ZXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdmFsdWVzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9IHZhbHVlc1tqXTtcbiAgICAgICAgICAgICAgICAgICAgcmVhY3Rpb25zLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogdmFsdWUuYm9keSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkOiB2YWx1ZS5pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGlzRGVmYXVsdDogdHJ1ZVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlYWN0aW9ucztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjb21wdXRlQ3VzdG9tQ1NTKCkge1xuICAgICAgICAvLyBGaXJzdCByZWFkIGFueSByYXcgY3VzdG9tIENTUy5cbiAgICAgICAgdmFyIGN1c3RvbUNTUyA9IGRhdGEoJ2N1c3RvbV9jc3MnKSgpO1xuICAgICAgICAvLyBUaGVuIGFwcGVuZCBydWxlcyBmb3IgYW55IHNwZWNpZmljIENTUyBvdmVycmlkZXMuXG4gICAgICAgIGN1c3RvbUNTUyArPSBjcmVhdGVDdXN0b21DU1NSdWxlKG1pZ3JhdGVSZWFjdGlvbnNCYWNrZ3JvdW5kQ29sb3JTZXR0aW5ncyhkYXRhKCd0YWdzX2JnX2NzcycsICcnKSksICcuYW50ZW5uYS1yZWFjdGlvbnMtcGFnZSAuYW50ZW5uYS1ib2R5LCAuYW50ZW5uYS1kZWZhdWx0cy1wYWdlIC5hbnRlbm5hLWJvZHknKTtcbiAgICAgICAgY3VzdG9tQ1NTICs9IGNyZWF0ZUN1c3RvbUNTU1J1bGUoZGF0YSgndGFnX2JveF9iZ19jb2xvcnMnLCAnJyksICcuYW50ZW5uYS1yZWFjdGlvbi1ib3gnKTtcbiAgICAgICAgY3VzdG9tQ1NTICs9IGNyZWF0ZUN1c3RvbUNTU1J1bGUoZGF0YSgndGFnX2JveF9iZ19jb2xvcnNfaG92ZXInLCAnJyksICcuYW50ZW5uYS1yZWFjdGlvbjpob3ZlciA+IC5hbnRlbm5hLXJlYWN0aW9uLWJveCcpO1xuICAgICAgICBjdXN0b21DU1MgKz0gY3JlYXRlQ3VzdG9tQ1NTUnVsZShtaWdyYXRlVGV4dENvbG9yU2V0dGluZ3MoZGF0YSgndGFnX2JveF90ZXh0X2NvbG9ycycsICcnKSksICcuYW50ZW5uYS1yZWFjdGlvbi1ib3gsIC5hbnRlbm5hLXJlYWN0aW9uLWNvbW1lbnRzIC5hbnRlbm5hLWNvbW1lbnRzLXBhdGgsIC5hbnRlbm5hLXJlYWN0aW9uLWxvY2F0aW9uIC5hbnRlbm5hLWxvY2F0aW9uLXBhdGgnKTtcbiAgICAgICAgY3VzdG9tQ1NTICs9IGNyZWF0ZUN1c3RvbUNTU1J1bGUobWlncmF0ZUZvbnRGYW1pbHlTZXR0aW5nKGRhdGEoJ3RhZ19ib3hfZm9udF9mYW1pbHknLCAnJykpLCAnLmFudGVubmEtcmVhY3Rpb24tYm94IC5hbnRlbm5hLXJlc2V0Jyk7XG4gICAgICAgIHJldHVybiBjdXN0b21DU1M7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY3JlYXRlQ3VzdG9tQ1NTUnVsZShkZWNsYXJhdGlvbnNBY2Nlc3Nvciwgc2VsZWN0b3IpIHtcbiAgICAgICAgdmFyIGRlY2xhcmF0aW9ucyA9IGRlY2xhcmF0aW9uc0FjY2Vzc29yKCkudHJpbSgpO1xuICAgICAgICBpZiAoZGVjbGFyYXRpb25zKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1xcbicgKyBzZWxlY3RvciArICcge1xcbiAgICAnICsgZGVjbGFyYXRpb25zICsgJ1xcbn0nO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnJztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtaWdyYXRlUmVhY3Rpb25zQmFja2dyb3VuZENvbG9yU2V0dGluZ3MoYmFja2dyb3VuZENvbG9yQWNjZXNzb3IpIHtcbiAgICAgICAgLy8gVE9ETzogVGhpcyBpcyB0ZW1wb3JhcnkgY29kZSB0aGF0IG1pZ3JhdGVzIHRoZSBjdXJyZW50IHRhZ3NfYmdfY3NzIHNldHRpbmcgZnJvbSBhIHJhdyB2YWx1ZSB0byBhXG4gICAgICAgIC8vICAgICAgIENTUyBkZWNsYXJhdGlvbi4gV2Ugc2hvdWxkIG1pZ3JhdGUgYWxsIGRlcGxveWVkIHNpdGVzIHRvIHVzZSBhIENTUyBkZWNsYXJhdGlvbiBhbmQgdGhlbiByZW1vdmUgdGhpcy5cbiAgICAgICAgdmFyIGJhY2tncm91bmRDb2xvciA9IGJhY2tncm91bmRDb2xvckFjY2Vzc29yKCkudHJpbSgpO1xuICAgICAgICBpZiAoYmFja2dyb3VuZENvbG9yICYmIGJhY2tncm91bmRDb2xvci5pbmRleE9mKCdiYWNrZ3JvdW5kJykgPT09IC0xKSB7XG4gICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3IgPSAnYmFja2dyb3VuZC1pbWFnZTogJyArIGJhY2tncm91bmRDb2xvcjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gYmFja2dyb3VuZENvbG9yO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWlncmF0ZUZvbnRGYW1pbHlTZXR0aW5nKGZvbnRGYW1pbHlBY2Nlc3Nvcikge1xuICAgICAgICAvLyBUT0RPOiBUaGlzIGlzIHRlbXBvcmFyeSBjb2RlIHRoYXQgbWlncmF0ZXMgdGhlIGN1cnJlbnQgdGFnX2JveF9mb250X2ZhbWlseSBzZXR0aW5nIGZyb20gYSByYXcgdmFsdWUgdG8gYVxuICAgICAgICAvLyAgICAgICBDU1MgZGVjbGFyYXRpb24uIFdlIHNob3VsZCBtaWdyYXRlIGFsbCBkZXBsb3llZCBzaXRlcyB0byB1c2UgYSBDU1MgZGVjbGFyYXRpb24gYW5kIHRoZW4gcmVtb3ZlIHRoaXMuXG4gICAgICAgIHZhciBmb250RmFtaWx5ID0gZm9udEZhbWlseUFjY2Vzc29yKCkudHJpbSgpO1xuICAgICAgICBpZiAoZm9udEZhbWlseSAmJiBmb250RmFtaWx5LmluZGV4T2YoJ2ZvbnQtZmFtaWx5JykgPT09IC0xKSB7XG4gICAgICAgICAgICBmb250RmFtaWx5ID0gJ2ZvbnQtZmFtaWx5OiAnICsgZm9udEZhbWlseTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gZm9udEZhbWlseTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1pZ3JhdGVUZXh0Q29sb3JTZXR0aW5ncyh0ZXh0Q29sb3JBY2Nlc3Nvcikge1xuICAgICAgICAvLyBUT0RPOiBUaGlzIGlzIHRlbXBvcmFyeSBjb2RlIHRoYXQgbWlncmF0ZXMgdGhlIGN1cnJlbnQgdGFnX2JveF90ZXh0X2NvbG9ycyBwcm9wZXJ0eSwgd2hpY2ggaXMgYSBkZWNsYXJhdGlvblxuICAgICAgICAvLyAgICAgICB0aGF0IG9ubHkgc2V0cyB0aGUgY29sb3IgcHJvcGVydHksIHRvIHNldCBib3RoIHRoZSBjb2xvciBhbmQgZmlsbCBwcm9wZXJ0aWVzLlxuICAgICAgICB2YXIgdGV4dENvbG9yID0gdGV4dENvbG9yQWNjZXNzb3IoKS50cmltKCk7XG4gICAgICAgIGlmICh0ZXh0Q29sb3IgJiYgdGV4dENvbG9yLmluZGV4T2YoJ2NvbG9yOicpID09PSAwICYmIHRleHRDb2xvci5pbmRleE9mKCdmaWxsOicpID09PSAtMSkge1xuICAgICAgICAgICAgdGV4dENvbG9yICs9IHRleHRDb2xvclt0ZXh0Q29sb3IubGVuZ3RoIC0gMV0gPT0gJzsnID8gJycgOiAnOyc7IC8vIGFwcGVuZCBhIHNlbWljb2xvbiBpZiBuZWVkZWRcbiAgICAgICAgICAgIHRleHRDb2xvciArPSB0ZXh0Q29sb3IucmVwbGFjZSgnY29sb3I6JywgJ1xcbiAgICBmaWxsOicpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiB0ZXh0Q29sb3I7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBsZWdhY3lCZWhhdmlvcjogZGF0YSgnbGVnYWN5X2JlaGF2aW9yJywgZmFsc2UpLCAvLyBUT0RPOiBtYWtlIHRoaXMgcmVhbCBpbiB0aGUgc2Vuc2UgdGhhdCBpdCBjb21lcyBiYWNrIGZyb20gdGhlIHNlcnZlciBhbmQgcHJvYmFibHkgbW92ZSB0aGUgZmxhZyB0byB0aGUgcGFnZSBkYXRhLiBVbmxpa2VseSB0aGF0IHdlIG5lZWQgdG8gbWFpbnRhaW4gbGVnYWN5IGJlaGF2aW9yIGZvciBuZXcgcGFnZXM/XG4gICAgICAgIGdyb3VwSWQ6IGRhdGEoJ2lkJyksXG4gICAgICAgIGdyb3VwTmFtZTogZGF0YSgnbmFtZScpLFxuICAgICAgICBhY3RpdmVTZWN0aW9uczogZGF0YSgnYWN0aXZlX3NlY3Rpb25zJyksXG4gICAgICAgIHVybDoge1xuICAgICAgICAgICAgaWdub3JlU3ViZG9tYWluOiBkYXRhKCdpZ25vcmVfc3ViZG9tYWluJyksXG4gICAgICAgICAgICBpbmNsdWRlUXVlcnlTdHJpbmc6IGRhdGEoJ3F1ZXJ5c3RyaW5nX2NvbnRlbnQnKSxcbiAgICAgICAgICAgIGlnbm9yZU1lZGlhVXJsUXVlcnk6IGRhdGEoJ21lZGlhX3VybF9pZ25vcmVfcXVlcnknKSxcbiAgICAgICAgICAgIGNhbm9uaWNhbERvbWFpbjogZGF0YSgncGFnZV90bGQnKSAvLyBUT0RPOiB3aGF0IHRvIGNhbGwgdGhpcyBleGFjdGx5LiBncm91cERvbWFpbj8gc2l0ZURvbWFpbj8gY2Fub25pY2FsRG9tYWluP1xuICAgICAgICB9LFxuICAgICAgICBzdW1tYXJ5U2VsZWN0b3I6IGRhdGEoJ3N1bW1hcnlfd2lkZ2V0X3NlbGVjdG9yJyksXG4gICAgICAgIHN1bW1hcnlNZXRob2Q6IGRhdGEoJ3N1bW1hcnlfd2lkZ2V0X21ldGhvZCcpLFxuICAgICAgICBpc0hpZGVPbk1vYmlsZTogZGF0YSgnaGlkZU9uTW9iaWxlJyksXG4gICAgICAgIGlzRXhwYW5kZWRNb2JpbGVTdW1tYXJ5OiBkYXRhKCdzdW1tYXJ5X3dpZGdldF9leHBhbmRlZF9tb2JpbGUnKSxcbiAgICAgICAgaXNIaWRlVGFwSGVscGVyOiBkYXRhKCdoaWRlRG91YmxlVGFwTWVzc2FnZScpLFxuICAgICAgICBwYWdlU2VsZWN0b3I6IGRhdGEoJ3Bvc3Rfc2VsZWN0b3InKSxcbiAgICAgICAgcGFnZUxpbmtTZWxlY3RvcjogZGF0YSgncG9zdF9ocmVmX3NlbGVjdG9yJyksXG4gICAgICAgIHBhZ2VJbWFnZVNlbGVjdG9yOiBkYXRhKCdpbWFnZV9zZWxlY3RvcicpLFxuICAgICAgICBwYWdlSW1hZ2VBdHRyaWJ1dGU6IGRhdGEoJ2ltYWdlX2F0dHJpYnV0ZScpLFxuICAgICAgICBwYWdlQXV0aG9yU2VsZWN0b3I6IGRhdGEoJ2F1dGhvcl9zZWxlY3RvcicpLFxuICAgICAgICBwYWdlQXV0aG9yQXR0cmlidXRlOiBkYXRhKCdhdXRob3JfYXR0cmlidXRlJyksXG4gICAgICAgIHBhZ2VUb3BpY3NTZWxlY3RvcjogZGF0YSgndG9waWNzX3NlbGVjdG9yJyksXG4gICAgICAgIHBhZ2VUb3BpY3NBdHRyaWJ1dGU6IGRhdGEoJ3RvcGljc19hdHRyaWJ1dGUnKSxcbiAgICAgICAgcGFnZVNpdGVTZWN0aW9uU2VsZWN0b3I6IGRhdGEoJ3NlY3Rpb25fc2VsZWN0b3InKSxcbiAgICAgICAgcGFnZVNpdGVTZWN0aW9uQXR0cmlidXRlOiBkYXRhKCdzZWN0aW9uX2F0dHJpYnV0ZScpLFxuICAgICAgICBjb250ZW50U2VsZWN0b3I6IGRhdGEoJ2Fubm9fd2hpdGVsaXN0JyksXG4gICAgICAgIHRleHRJbmRpY2F0b3JMaW1pdDogZGF0YSgnaW5pdGlhbF9waW5fbGltaXQnKSxcbiAgICAgICAgZW5hYmxlVGV4dEhlbHBlcjogZGF0YSgncGFyYWdyYXBoX2hlbHBlcicpLFxuICAgICAgICBtZWRpYUluZGljYXRvckNvcm5lcjogZGF0YSgnaW1nX2luZGljYXRvcl9zaG93X3NpZGUnKSxcbiAgICAgICAgZ2VuZXJhdGVkQ3RhU2VsZWN0b3I6IGRhdGEoJ3NlcGFyYXRlX2N0YScpLFxuICAgICAgICBnZW5lcmF0ZWRDdGFFeHBhbmRlZDogZGF0YSgnc2VwYXJhdGVfY3RhX2V4cGFuZGVkJyksXG4gICAgICAgIHJlcXVpcmVzQXBwcm92YWw6IGRhdGEoJ3JlcXVpcmVzX2FwcHJvdmFsJyksXG4gICAgICAgIGRlZmF1bHRSZWFjdGlvbnM6IGRlZmF1bHRSZWFjdGlvbnMsXG4gICAgICAgIGN1c3RvbUNTUzogY29tcHV0ZUN1c3RvbUNTUyxcbiAgICAgICAgZXhjbHVzaW9uU2VsZWN0b3I6IGV4Y2x1c2lvblNlbGVjdG9yKCksXG4gICAgICAgIGxhbmd1YWdlOiBkYXRhKCdsYW5ndWFnZScpLFxuICAgICAgICB0d2l0dGVyQWNjb3VudDogZGF0YSgndHdpdHRlcicpXG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlOiB1cGRhdGVGcm9tSlNPTixcbiAgICBnZXQ6IGdldEdyb3VwU2V0dGluZ3Ncbn07IiwiLy8gVGhpcyBtb2R1bGUgc3RvcmVzIG91ciBtYXBwaW5nIGZyb20gaGFzaCB2YWx1ZXMgdG8gdGhlaXIgY29ycmVzcG9uZGluZyBlbGVtZW50cyBpbiB0aGUgRE9NLiBUaGUgZGF0YSBpcyBvcmdhbml6ZWRcbi8vIGJ5IHBhZ2UgZm9yIHRoZSBibG9nIHJvbGwgY2FzZSwgd2hlcmUgbXVsdGlwbGUgcGFnZXMgb2YgZGF0YSBjYW4gYmUgbG9hZGVkIGF0IG9uY2UuXG52YXIgcGFnZXMgPSB7fTtcblxuZnVuY3Rpb24gZ2V0RWxlbWVudChjb250YWluZXJIYXNoLCBwYWdlSGFzaCkge1xuICAgIHZhciBjb250YWluZXJzID0gcGFnZXNbcGFnZUhhc2hdO1xuICAgIGlmIChjb250YWluZXJzKSB7XG4gICAgICAgIHJldHVybiBjb250YWluZXJzW2NvbnRhaW5lckhhc2hdO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gc2V0RWxlbWVudChjb250YWluZXJIYXNoLCBwYWdlSGFzaCwgZWxlbWVudCkge1xuICAgIHZhciBjb250YWluZXJzID0gcGFnZXNbcGFnZUhhc2hdO1xuICAgIGlmICghY29udGFpbmVycykge1xuICAgICAgICBjb250YWluZXJzID0gcGFnZXNbcGFnZUhhc2hdID0ge307XG4gICAgfVxuICAgIGNvbnRhaW5lcnNbY29udGFpbmVySGFzaF0gPSBlbGVtZW50O1xufVxuXG4vLyBXaGVuIHdlIGZpcnN0IHNjYW4gYSBwYWdlLCB0aGUgXCJoYXNoXCIgaXMganVzdCB0aGUgVVJMIHdoaWxlIHdlIHdhaXQgdG8gaGVhciBiYWNrIGZyb20gdGhlIHNlcnZlciwgdGhlbiBpdCdzIHVwZGF0ZWRcbi8vIHRvIHdoYXRldmVyIHZhbHVlIHRoZSBzZXJ2ZXIgY29tcHV0ZWQuIFNvIGhlcmUgd2UgYWxsb3cgb3VyIG1hcHBpbmcgdG8gYmUgdXBkYXRlZCB3aGVuIHRoYXQgY2hhbmdlIGhhcHBlbnMuXG5mdW5jdGlvbiB1cGRhdGVQYWdlSGFzaChvbGRQYWdlSGFzaCwgbmV3UGFnZUhhc2gpIHtcbiAgICBwYWdlc1tuZXdQYWdlSGFzaF0gPSBwYWdlc1tvbGRQYWdlSGFzaF07XG4gICAgZGVsZXRlIHBhZ2VzW29sZFBhZ2VIYXNoXTtcbn1cblxuZnVuY3Rpb24gdGVhcmRvd24oKSB7XG4gICAgcGFnZXMgPSB7fTtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGdldEVsZW1lbnQ6IGdldEVsZW1lbnQsXG4gICAgc2V0RWxlbWVudDogc2V0RWxlbWVudCxcbiAgICB1cGRhdGVQYWdlSGFzaDogdXBkYXRlUGFnZUhhc2gsXG4gICAgdGVhcmRvd246IHRlYXJkb3duXG59OyIsInZhciAkOyByZXF1aXJlKCcuL3V0aWxzL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIFJhY3RpdmU7IHJlcXVpcmUoJy4vdXRpbHMvcmFjdGl2ZS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihsb2FkZWRSYWN0aXZlKSB7IFJhY3RpdmUgPSBsb2FkZWRSYWN0aXZlO30pO1xudmFyIFJhbmdlID0gcmVxdWlyZSgnLi91dGlscy9yYW5nZScpO1xuXG52YXIgRXZlbnRzID0gcmVxdWlyZSgnLi9ldmVudHMnKTtcbnZhciBIYXNoZWRFbGVtZW50cyA9IHJlcXVpcmUoJy4vaGFzaGVkLWVsZW1lbnRzJyk7XG52YXIgUGFnZURhdGEgPSByZXF1aXJlKCcuL3BhZ2UtZGF0YScpO1xudmFyIFNWR3MgPSByZXF1aXJlKCcuL3N2Z3MnKTtcblxudmFyIHBhZ2VTZWxlY3RvciA9ICcuYW50ZW5uYS1sb2NhdGlvbnMtcGFnZSc7XG5cbmZ1bmN0aW9uIGNyZWF0ZVBhZ2Uob3B0aW9ucykge1xuICAgIHZhciBlbGVtZW50ID0gb3B0aW9ucy5lbGVtZW50O1xuICAgIHZhciByZWFjdGlvbkxvY2F0aW9uRGF0YSA9IG9wdGlvbnMucmVhY3Rpb25Mb2NhdGlvbkRhdGE7XG4gICAgdmFyIHBhZ2VEYXRhID0gb3B0aW9ucy5wYWdlRGF0YTtcbiAgICB2YXIgZ3JvdXBTZXR0aW5ncyA9IG9wdGlvbnMuZ3JvdXBTZXR0aW5ncztcbiAgICB2YXIgY2xvc2VXaW5kb3cgPSBvcHRpb25zLmNsb3NlV2luZG93O1xuICAgIHZhciBnb0JhY2sgPSBvcHRpb25zLmdvQmFjaztcbiAgICB2YXIgcmFjdGl2ZSA9IFJhY3RpdmUoe1xuICAgICAgICBlbDogZWxlbWVudCxcbiAgICAgICAgYXBwZW5kOiB0cnVlLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICBsb2NhdGlvbkRhdGE6IHJlYWN0aW9uTG9jYXRpb25EYXRhLFxuICAgICAgICAgICAgcGFnZVJlYWN0aW9uQ291bnQ6IHBhZ2VSZWFjdGlvbkNvdW50KHJlYWN0aW9uTG9jYXRpb25EYXRhKSxcbiAgICAgICAgICAgIGNhbkxvY2F0ZTogZnVuY3Rpb24oY29udGFpbmVySGFzaCkge1xuICAgICAgICAgICAgICAgIC8vIFRPRE86IGlzIHRoZXJlIGEgYmV0dGVyIHdheSB0byBoYW5kbGUgcmVhY3Rpb25zIHRvIGhhc2hlcyB0aGF0IGFyZSBubyBsb25nZXIgb24gdGhlIHBhZ2U/XG4gICAgICAgICAgICAgICAgLy8gICAgICAgc2hvdWxkIHdlIHByb3ZpZGUgc29tZSBraW5kIG9mIGluZGljYXRpb24gd2hlbiB3ZSBmYWlsIHRvIGxvY2F0ZSBhIGhhc2ggb3IganVzdCBsZWF2ZSBpdCBhcyBpcz9cbiAgICAgICAgICAgICAgICAvLyBUT0RPOiBEb2VzIGl0IG1ha2Ugc2Vuc2UgdG8gZXZlbiBzaG93IGVudHJpZXMgdGhhdCB3ZSBjYW4ndCBsb2NhdGU/IFByb2JhYmx5IG5vdC5cbiAgICAgICAgICAgICAgICByZXR1cm4gSGFzaGVkRWxlbWVudHMuZ2V0RWxlbWVudChjb250YWluZXJIYXNoLCBwYWdlRGF0YS5wYWdlSGFzaCkgIT09IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgdGVtcGxhdGU6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9sb2NhdGlvbnMtcGFnZS5oYnMuaHRtbCcpLFxuICAgICAgICBwYXJ0aWFsczoge1xuICAgICAgICAgICAgbGVmdDogU1ZHcy5sZWZ0LFxuICAgICAgICAgICAgZmlsbTogU1ZHcy5maWxtXG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByYWN0aXZlLm9uKCdiYWNrJywgZ29CYWNrKTtcbiAgICByYWN0aXZlLm9uKCdyZXZlYWwnLCByZXZlYWxDb250ZW50KTtcbiAgICByZXR1cm4ge1xuICAgICAgICBzZWxlY3RvcjogcGFnZVNlbGVjdG9yLFxuICAgICAgICB0ZWFyZG93bjogZnVuY3Rpb24oKSB7IHJhY3RpdmUudGVhcmRvd24oKTsgfVxuICAgIH07XG5cblxuICAgIGZ1bmN0aW9uIHJldmVhbENvbnRlbnQocmFjdGl2ZUV2ZW50KSB7XG4gICAgICAgIHZhciBsb2NhdGlvbkRhdGEgPSByYWN0aXZlRXZlbnQuY29udGV4dDtcbiAgICAgICAgdmFyIGVsZW1lbnQgPSBIYXNoZWRFbGVtZW50cy5nZXRFbGVtZW50KGxvY2F0aW9uRGF0YS5jb250YWluZXJIYXNoLCBwYWdlRGF0YS5wYWdlSGFzaCk7XG4gICAgICAgIGlmIChlbGVtZW50KSB7XG4gICAgICAgICAgICB2YXIgZXZlbnQgPSByYWN0aXZlRXZlbnQub3JpZ2luYWw7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICBjbG9zZVdpbmRvdygpO1xuICAgICAgICAgICAgdmFyIHRhcmdldFNjcm9sbFRvcCA9ICQoZWxlbWVudCkub2Zmc2V0KCkudG9wIC0gMTMwO1xuICAgICAgICAgICAgJCgnaHRtbCxib2R5JykuYW5pbWF0ZSh7c2Nyb2xsVG9wOiB0YXJnZXRTY3JvbGxUb3B9LCAxMDAwKTtcbiAgICAgICAgICAgIGlmIChsb2NhdGlvbkRhdGEua2luZCA9PT0gJ3R4dCcpIHsgLy8gVE9ETzogc29tZXRoaW5nIGJldHRlciB0aGFuIGEgc3RyaW5nIGNvbXBhcmUuIGZpeCB0aGlzIGFsb25nIHdpdGggdGhlIHNhbWUgaXNzdWUgaW4gcGFnZS1kYXRhXG4gICAgICAgICAgICAgICAgUmFuZ2UuaGlnaGxpZ2h0KGVsZW1lbnQuZ2V0KDApLCBsb2NhdGlvbkRhdGEubG9jYXRpb24pO1xuICAgICAgICAgICAgICAgICQoZG9jdW1lbnQpLm9uKCdjbGljay5hbnRlbm5hJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIFJhbmdlLmNsZWFySGlnaGxpZ2h0cygpO1xuICAgICAgICAgICAgICAgICAgICAkKGRvY3VtZW50KS5vZmYoJ2NsaWNrLmFudGVubmEnKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBjb250YWluZXJEYXRhID0gUGFnZURhdGEuZ2V0Q29udGFpbmVyRGF0YShwYWdlRGF0YSwgbG9jYXRpb25EYXRhLmNvbnRhaW5lckhhc2gpO1xuICAgICAgICAgICAgRXZlbnRzLnBvc3RDb250ZW50Vmlld2VkKHBhZ2VEYXRhLCBjb250YWluZXJEYXRhLGxvY2F0aW9uRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIHBhZ2VSZWFjdGlvbkNvdW50KHJlYWN0aW9uTG9jYXRpb25EYXRhKSB7XG4gICAgZm9yICh2YXIgY29udGVudElEIGluIHJlYWN0aW9uTG9jYXRpb25EYXRhKSB7XG4gICAgICAgIGlmIChyZWFjdGlvbkxvY2F0aW9uRGF0YS5oYXNPd25Qcm9wZXJ0eShjb250ZW50SUQpKSB7XG4gICAgICAgICAgICB2YXIgY29udGVudExvY2F0aW9uRGF0YSA9IHJlYWN0aW9uTG9jYXRpb25EYXRhW2NvbnRlbnRJRF07XG4gICAgICAgICAgICBpZiAoY29udGVudExvY2F0aW9uRGF0YS5raW5kID09PSAncGFnJykgeyAvLyBUT0RPOiBzb21ldGhpbmcgYmV0dGVyIHRoYW4gYSBzdHJpbmcgY29tcGFyZS4gZml4IHRoaXMgYWxvbmcgd2l0aCB0aGUgc2FtZSBpc3N1ZSBpbiBwYWdlLWRhdGFcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udGVudExvY2F0aW9uRGF0YS5jb3VudDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZTogY3JlYXRlUGFnZVxufTsiLCJ2YXIgUmFjdGl2ZTsgcmVxdWlyZSgnLi91dGlscy9yYWN0aXZlLXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGxvYWRlZFJhY3RpdmUpIHsgUmFjdGl2ZSA9IGxvYWRlZFJhY3RpdmU7fSk7XG52YXIgVVJMcyA9IHJlcXVpcmUoJy4vdXRpbHMvdXJscycpO1xudmFyIFhETUNsaWVudCA9IHJlcXVpcmUoJy4vdXRpbHMveGRtLWNsaWVudCcpO1xudmFyIFNWR3MgPSByZXF1aXJlKCcuL3N2Z3MnKTtcblxudmFyIHBhZ2VTZWxlY3RvciA9ICcuYW50ZW5uYS1sb2dpbi1wYWdlJztcblxuZnVuY3Rpb24gY3JlYXRlUGFnZShvcHRpb25zKSB7XG4gICAgdmFyIGdyb3VwU2V0dGluZ3MgPSBvcHRpb25zLmdyb3VwU2V0dGluZ3M7XG4gICAgdmFyIGdvQmFjayA9IG9wdGlvbnMuZ29CYWNrO1xuICAgIHZhciByZXRyeSA9IG9wdGlvbnMucmV0cnk7XG4gICAgdmFyIGVsZW1lbnQgPSBvcHRpb25zLmVsZW1lbnQ7XG4gICAgdmFyIHJhY3RpdmUgPSBSYWN0aXZlKHtcbiAgICAgICAgZWw6IGVsZW1lbnQsXG4gICAgICAgIGFwcGVuZDogdHJ1ZSxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgbG9naW5QYWdlVXJsOiBjb21wdXRlTG9naW5QYWdlVXJsKGdyb3VwU2V0dGluZ3MpXG4gICAgICAgIH0sXG4gICAgICAgIHRlbXBsYXRlOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvbG9naW4tcGFnZS5oYnMuaHRtbCcpLFxuICAgICAgICBwYXJ0aWFsczoge1xuICAgICAgICAgICAgbGVmdDogU1ZHcy5sZWZ0XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICBhZGRSZXNwb25zZUhhbmRsZXJzKCk7XG4gICAgcmFjdGl2ZS5vbignYmFjaycsIGZ1bmN0aW9uKCkge1xuICAgICAgICBjbGVhclJlc3BvbnNlSGFuZGxlcnMoKTtcbiAgICAgICAgZ29CYWNrKCk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgc2VsZWN0b3I6IHBhZ2VTZWxlY3RvcixcbiAgICAgICAgdGVhcmRvd246IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY2xlYXJSZXNwb25zZUhhbmRsZXJzKCk7XG4gICAgICAgICAgICByYWN0aXZlLnRlYXJkb3duKCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gYWRkUmVzcG9uc2VIYW5kbGVycygpIHtcbiAgICAgICAgWERNQ2xpZW50LmFkZFJlc3BvbnNlSGFuZGxlcihcImNsb3NlIGxvZ2luIHBhbmVsXCIsIGRvUmV0cnkpO1xuICAgICAgICBYRE1DbGllbnQuYWRkUmVzcG9uc2VIYW5kbGVyKFwiZ2V0VXNlckxvZ2luU3RhdGVcIiwgZG9SZXRyeSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY2xlYXJSZXNwb25zZUhhbmRsZXJzKCkge1xuICAgICAgICBYRE1DbGllbnQucmVtb3ZlUmVzcG9uc2VIYW5kbGVyKFwiY2xvc2UgbG9naW4gcGFuZWxcIiwgZG9SZXRyeSk7XG4gICAgICAgIFhETUNsaWVudC5yZW1vdmVSZXNwb25zZUhhbmRsZXIoXCJnZXRVc2VyTG9naW5TdGF0ZVwiLCBkb1JldHJ5KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkb1JldHJ5KCkge1xuICAgICAgICBjbGVhclJlc3BvbnNlSGFuZGxlcnMoKTtcbiAgICAgICAgcmV0cnkoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVMb2dpblBhZ2VVcmwoZ3JvdXBTZXR0aW5ncykge1xuICAgIHJldHVybiBVUkxzLmFwcFNlcnZlclVybCgpICsgVVJMcy5sb2dpblBhZ2VVcmwoKSArXG4gICAgICAgICc/cGFyZW50VXJsPScgKyB3aW5kb3cubG9jYXRpb24uaHJlZiArXG4gICAgICAgICcmcGFyZW50SG9zdD0nICsgd2luZG93LmxvY2F0aW9uLnByb3RvY29sICsgXCIvL1wiICsgd2luZG93LmxvY2F0aW9uLmhvc3QgK1xuICAgICAgICAnJmdyb3VwX2lkPScgKyBncm91cFNldHRpbmdzLmdyb3VwSWQoKSArXG4gICAgICAgICcmZ3JvdXBfbmFtZT0nICsgZ3JvdXBTZXR0aW5ncy5ncm91cE5hbWUoKTtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZVBhZ2U6IGNyZWF0ZVBhZ2Vcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgUmFjdGl2ZTsgcmVxdWlyZSgnLi91dGlscy9yYWN0aXZlLXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGxvYWRlZFJhY3RpdmUpIHsgUmFjdGl2ZSA9IGxvYWRlZFJhY3RpdmU7fSk7XG52YXIgUmVhY3Rpb25zV2lkZ2V0ID0gcmVxdWlyZSgnLi9yZWFjdGlvbnMtd2lkZ2V0Jyk7XG52YXIgU1ZHcyA9IHJlcXVpcmUoJy4vc3ZncycpO1xuXG52YXIgQXBwTW9kZSA9IHJlcXVpcmUoJy4vdXRpbHMvYXBwLW1vZGUnKTtcbnZhciBNdXRhdGlvbk9ic2VydmVyID0gcmVxdWlyZSgnLi91dGlscy9tdXRhdGlvbi1vYnNlcnZlcicpO1xudmFyIFRocm90dGxlZEV2ZW50cyA9IHJlcXVpcmUoJy4vdXRpbHMvdGhyb3R0bGVkLWV2ZW50cycpO1xudmFyIFRvdWNoU3VwcG9ydCA9IHJlcXVpcmUoJy4vdXRpbHMvdG91Y2gtc3VwcG9ydCcpO1xuXG52YXIgQ0xBU1NfQUNUSVZFID0gJ2FudGVubmEtYWN0aXZlJztcblxuZnVuY3Rpb24gY3JlYXRlSW5kaWNhdG9yV2lkZ2V0KG9wdGlvbnMpIHtcbiAgICAvLyBUT0RPOiB2YWxpZGF0ZSB0aGF0IG9wdGlvbnMgY29udGFpbnMgYWxsIHJlcXVpcmVkIHByb3BlcnRpZXMgKGFwcGxpZXMgdG8gYWxsIHdpZGdldHMpLlxuICAgIHZhciBlbGVtZW50ID0gb3B0aW9ucy5lbGVtZW50O1xuICAgIHZhciBjb250YWluZXJEYXRhID0gb3B0aW9ucy5jb250YWluZXJEYXRhO1xuICAgIHZhciAkY29udGFpbmVyRWxlbWVudCA9IG9wdGlvbnMuY29udGFpbmVyRWxlbWVudDtcbiAgICB2YXIgcGFnZURhdGEgPSBvcHRpb25zLnBhZ2VEYXRhO1xuICAgIHZhciBncm91cFNldHRpbmdzID0gb3B0aW9ucy5ncm91cFNldHRpbmdzO1xuICAgIHZhciBkZWZhdWx0UmVhY3Rpb25zID0gb3B0aW9ucy5kZWZhdWx0UmVhY3Rpb25zO1xuICAgIHZhciBjb250ZW50RGF0YSA9IG9wdGlvbnMuY29udGVudERhdGE7XG4gICAgdmFyIHJhY3RpdmUgPSBSYWN0aXZlKHtcbiAgICAgICAgZWw6IGVsZW1lbnQsXG4gICAgICAgIGFwcGVuZDogdHJ1ZSxcbiAgICAgICAgbWFnaWM6IHRydWUsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIGNvbnRhaW5lckRhdGE6IGNvbnRhaW5lckRhdGEsXG4gICAgICAgICAgICBleHRyYUF0dHJpYnV0ZXM6IEFwcE1vZGUuZGVidWcgPyAnYW50LWhhc2g9XCInICsgY29udGFpbmVyRGF0YS5oYXNoICsgJ1wiJyA6ICcnIC8vIFRPRE86IHRoaXMgYWJvdXQgbWFraW5nIHRoaXMgYSBkZWNvcmF0b3IgaGFuZGxlZCBieSBhIFwiRGVidWdcIiBtb2R1bGVcbiAgICAgICAgfSxcbiAgICAgICAgdGVtcGxhdGU6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9tZWRpYS1pbmRpY2F0b3Itd2lkZ2V0Lmhicy5odG1sJyksXG4gICAgICAgIHBhcnRpYWxzOiB7XG4gICAgICAgICAgICBsb2dvOiBTVkdzLmxvZ29cbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgdmFyIHJlYWN0aW9uV2lkZ2V0T3B0aW9ucyA9IHtcbiAgICAgICAgcmVhY3Rpb25zRGF0YTogY29udGFpbmVyRGF0YS5yZWFjdGlvbnMsXG4gICAgICAgIGNvbnRhaW5lckRhdGE6IGNvbnRhaW5lckRhdGEsXG4gICAgICAgIGNvbnRhaW5lckVsZW1lbnQ6ICRjb250YWluZXJFbGVtZW50LFxuICAgICAgICBjb250ZW50RGF0YTogY29udGVudERhdGEsXG4gICAgICAgIGRlZmF1bHRSZWFjdGlvbnM6IGRlZmF1bHRSZWFjdGlvbnMsXG4gICAgICAgIHBhZ2VEYXRhOiBwYWdlRGF0YSxcbiAgICAgICAgZ3JvdXBTZXR0aW5nczogZ3JvdXBTZXR0aW5nc1xuICAgIH07XG5cbiAgICB2YXIgaG92ZXJUaW1lb3V0O1xuICAgIHZhciBhY3RpdmVUaW1lb3V0O1xuXG4gICAgdmFyICRyb290RWxlbWVudCA9ICQocm9vdEVsZW1lbnQocmFjdGl2ZSkpO1xuICAgIFRvdWNoU3VwcG9ydC5zZXR1cFRhcCgkcm9vdEVsZW1lbnQuZ2V0KDApLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgb3BlblJlYWN0aW9uc1dpbmRvdyhyZWFjdGlvbldpZGdldE9wdGlvbnMsIHJhY3RpdmUpXG4gICAgfSk7XG4gICAgJHJvb3RFbGVtZW50Lm9uKCdtb3VzZWVudGVyLmFudGVubmEnLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBpZiAoZXZlbnQuYnV0dG9ucyA+IDAgfHwgKGV2ZW50LmJ1dHRvbnMgPT0gdW5kZWZpbmVkICYmIGV2ZW50LndoaWNoID4gMCkpIHsgLy8gT24gU2FmYXJpLCBldmVudC5idXR0b25zIGlzIHVuZGVmaW5lZCBidXQgZXZlbnQud2hpY2ggZ2l2ZXMgYSBnb29kIHZhbHVlLiBldmVudC53aGljaCBpcyBiYWQgb24gRkZcbiAgICAgICAgICAgIC8vIERvbid0IHJlYWN0IGlmIHRoZSB1c2VyIGlzIGRyYWdnaW5nIG9yIHNlbGVjdGluZyB0ZXh0LlxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjb250YWluZXJEYXRhLnJlYWN0aW9ucy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBvcGVuUmVhY3Rpb25zV2luZG93KHJlYWN0aW9uV2lkZ2V0T3B0aW9ucywgcmFjdGl2ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjbGVhclRpbWVvdXQoaG92ZXJUaW1lb3V0KTtcbiAgICAgICAgICAgIGhvdmVyVGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgb3BlblJlYWN0aW9uc1dpbmRvdyhyZWFjdGlvbldpZGdldE9wdGlvbnMsIHJhY3RpdmUpO1xuICAgICAgICAgICAgfSwgNTApO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgJHJvb3RFbGVtZW50Lm9uKCdtb3VzZWxlYXZlLmFudGVubmEnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KGhvdmVyVGltZW91dCk7XG4gICAgICAgIGNsZWFyVGltZW91dChhY3RpdmVUaW1lb3V0KTtcbiAgICB9KTtcbiAgICAkY29udGFpbmVyRWxlbWVudC5vbignbW91c2VlbnRlci5hbnRlbm5hJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIGNsZWFyVGltZW91dChhY3RpdmVUaW1lb3V0KTtcbiAgICAgICAgYWN0aXZlVGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAkcm9vdEVsZW1lbnQuYWRkQ2xhc3MoQ0xBU1NfQUNUSVZFKTtcbiAgICAgICAgfSwgNTAwKTtcbiAgICB9KTtcbiAgICAkY29udGFpbmVyRWxlbWVudC5vbignbW91c2VsZWF2ZS5hbnRlbm5hJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIGNsZWFyVGltZW91dChhY3RpdmVUaW1lb3V0KTtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICRyb290RWxlbWVudC5yZW1vdmVDbGFzcyhDTEFTU19BQ1RJVkUpO1xuICAgICAgICB9LCAxMDApOyAvLyBXZSBnZXQgYSBtb3VzZWxlYXZlIGV2ZW50IHdoZW4gdGhlIHVzZXIgaG92ZXJzIHRoZSBpbmRpY2F0b3IuIFBhdXNlIGxvbmcgZW5vdWdoIHRoYXQgdGhlIHJlYWN0aW9uIHdpbmRvdyBjYW4gb3BlbiBpZiB0aGV5IGhvdmVyLlxuICAgIH0pO1xuICAgIHNldHVwUG9zaXRpb25pbmcoJGNvbnRhaW5lckVsZW1lbnQsIGdyb3VwU2V0dGluZ3MsIHJhY3RpdmUpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgdGVhcmRvd246IGZ1bmN0aW9uKCkgeyByYWN0aXZlLnRlYXJkb3duKCk7IH1cbiAgICB9O1xufVxuXG5mdW5jdGlvbiBzZXR1cFBvc2l0aW9uaW5nKCRjb250YWluZXJFbGVtZW50LCBncm91cFNldHRpbmdzLCByYWN0aXZlKSB7XG4gICAgdmFyICR3cmFwcGVyRWxlbWVudCA9ICQod3JhcHBlckVsZW1lbnQocmFjdGl2ZSkpO1xuICAgIHZhciAkcm9vdEVsZW1lbnQgPSAkKHJvb3RFbGVtZW50KHJhY3RpdmUpKTtcbiAgICBwb3NpdGlvbkluZGljYXRvcigpO1xuXG4gICAgVGhyb3R0bGVkRXZlbnRzLm9uKCdyZXNpemUnLCBwb3NpdGlvbklmTmVlZGVkKTtcbiAgICByYWN0aXZlLm9uKCd0ZWFyZG93bicsIGZ1bmN0aW9uKCkge1xuICAgICAgICBUaHJvdHRsZWRFdmVudHMub2ZmKCdyZXNpemUnLCBwb3NpdGlvbklmTmVlZGVkKTtcbiAgICB9KTtcbiAgICBUaHJvdHRsZWRFdmVudHMub24oJ3Njcm9sbCcsIHBvc2l0aW9uSWZOZWVkZWQpO1xuICAgIHJhY3RpdmUub24oJ3RlYXJkb3duJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIFRocm90dGxlZEV2ZW50cy5vZmYoJ3Njcm9sbCcsIHBvc2l0aW9uSWZOZWVkZWQpO1xuICAgIH0pO1xuXG4gICAgLy8gVE9ETzogY29uc2lkZXIgYWxzbyBsaXN0ZW5pbmcgdG8gc3JjIGF0dHJpYnV0ZSBjaGFuZ2VzLCB3aGljaCBtaWdodCBhZmZlY3QgdGhlIGhlaWdodCBvZiBlbGVtZW50cyBvbiB0aGUgcGFnZVxuICAgIE11dGF0aW9uT2JzZXJ2ZXIuYWRkQWRkaXRpb25MaXN0ZW5lcihlbGVtZW50c0FkZGVkT3JSZW1vdmVkKTtcbiAgICBNdXRhdGlvbk9ic2VydmVyLmFkZFJlbW92YWxMaXN0ZW5lcihlbGVtZW50c0FkZGVkT3JSZW1vdmVkKTtcblxuICAgIGZ1bmN0aW9uIGVsZW1lbnRzQWRkZWRPclJlbW92ZWQoJGVsZW1lbnRzKSB7XG4gICAgICAgIC8vIFJlcG9zaXRpb24gdGhlIGluZGljYXRvciBpZiBlbGVtZW50cyB3aGljaCBtaWdodCBhZGp1c3QgdGhlIGNvbnRhaW5lcidzIHBvc2l0aW9uIGFyZSBhZGRlZC9yZW1vdmVkLlxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8ICRlbGVtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyICRlbGVtZW50ID0gJGVsZW1lbnRzW2ldO1xuICAgICAgICAgICAgaWYgKCRlbGVtZW50LmhlaWdodCgpID4gMCkge1xuICAgICAgICAgICAgICAgIHBvc2l0aW9uSWZOZWVkZWQoKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgbGFzdENvbnRhaW5lck9mZnNldCA9ICRjb250YWluZXJFbGVtZW50Lm9mZnNldCgpO1xuICAgIHZhciBsYXN0Q29udGFpbmVySGVpZ2h0ID0gJGNvbnRhaW5lckVsZW1lbnQuaGVpZ2h0KCk7XG5cbiAgICBmdW5jdGlvbiBwb3NpdGlvbklmTmVlZGVkKCkge1xuICAgICAgICB2YXIgY29udGFpbmVyT2Zmc2V0ID0gJGNvbnRhaW5lckVsZW1lbnQub2Zmc2V0KCk7XG4gICAgICAgIHZhciBjb250YWluZXJIZWlnaHQgPSAkY29udGFpbmVyRWxlbWVudC5oZWlnaHQoKTtcbiAgICAgICAgaWYgKGNvbnRhaW5lck9mZnNldC50b3AgPT09IGxhc3RDb250YWluZXJPZmZzZXQudG9wICYmXG4gICAgICAgICAgICBjb250YWluZXJPZmZzZXQubGVmdCA9PT0gbGFzdENvbnRhaW5lck9mZnNldC5sZWZ0ICYmXG4gICAgICAgICAgICBjb250YWluZXJIZWlnaHQgPT09IGxhc3RDb250YWluZXJIZWlnaHQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBsYXN0Q29udGFpbmVyT2Zmc2V0ID0gY29udGFpbmVyT2Zmc2V0O1xuICAgICAgICBsYXN0Q29udGFpbmVySGVpZ2h0ID0gY29udGFpbmVySGVpZ2h0O1xuICAgICAgICBwb3NpdGlvbkluZGljYXRvcigpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBvc2l0aW9uSW5kaWNhdG9yKCkge1xuICAgICAgICAvLyBQb3NpdGlvbiB0aGUgd3JhcHBlciBlbGVtZW50ICh3aGljaCBoYXMgYSBoYXJkY29kZWQgd2lkdGgpIGluIHRoZSBhcHByb3ByaWF0ZSBjb3JuZXIuIFRoZW4gZmxpcCB0aGUgbGVmdC9yaWdodFxuICAgICAgICAvLyBwb3NpdGlvbmluZyBvZiB0aGUgbmVzdGVkIHdpZGdldCBlbGVtZW50IHRvIGFkanVzdCB0aGUgd2F5IGl0IHdpbGwgZXhwYW5kIHdoZW4gdGhlIG1lZGlhIGlzIGhvdmVyZWQuXG4gICAgICAgIHZhciBjb3JuZXIgPSBncm91cFNldHRpbmdzLm1lZGlhSW5kaWNhdG9yQ29ybmVyKCk7XG4gICAgICAgIHZhciBlbGVtZW50T2Zmc2V0ID0gJGNvbnRhaW5lckVsZW1lbnQub2Zmc2V0KCk7XG4gICAgICAgIHZhciBjb29yZHMgPSB7fTtcbiAgICAgICAgaWYgKGNvcm5lci5pbmRleE9mKCd0b3AnKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIGNvb3Jkcy50b3AgPSBlbGVtZW50T2Zmc2V0LnRvcDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvb3Jkcy50b3AgPSBlbGVtZW50T2Zmc2V0LnRvcCArICRjb250YWluZXJFbGVtZW50LmhlaWdodCgpIC0gJHJvb3RFbGVtZW50Lm91dGVySGVpZ2h0KCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvcm5lci5pbmRleE9mKCdyaWdodCcpICE9PSAtMSkge1xuICAgICAgICAgICAgY29vcmRzLmxlZnQgPSBlbGVtZW50T2Zmc2V0LmxlZnQgKyAkY29udGFpbmVyRWxlbWVudC53aWR0aCgpIC0gJHdyYXBwZXJFbGVtZW50Lm91dGVyV2lkdGgoKTtcbiAgICAgICAgICAgICRyb290RWxlbWVudC5jc3Moe3JpZ2h0OjAsbGVmdDonJ30pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29vcmRzLmxlZnQgPSBlbGVtZW50T2Zmc2V0LmxlZnQ7XG4gICAgICAgICAgICAkcm9vdEVsZW1lbnQuY3NzKHtyaWdodDonJyxsZWZ0OjB9KTtcbiAgICAgICAgfVxuICAgICAgICAkd3JhcHBlckVsZW1lbnQuY3NzKGNvb3Jkcyk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiB3cmFwcGVyRWxlbWVudChyYWN0aXZlKSB7XG4gICAgcmV0dXJuIHJhY3RpdmUuZmluZCgnLmFudGVubmEtbWVkaWEtaW5kaWNhdG9yLXdyYXBwZXInKTtcbn1cblxuZnVuY3Rpb24gcm9vdEVsZW1lbnQocmFjdGl2ZSkge1xuICAgIHJldHVybiByYWN0aXZlLmZpbmQoJy5hbnRlbm5hLW1lZGlhLWluZGljYXRvci13aWRnZXQnKTtcbn1cblxuZnVuY3Rpb24gb3BlblJlYWN0aW9uc1dpbmRvdyhyZWFjdGlvbk9wdGlvbnMsIHJhY3RpdmUpIHtcbiAgICBSZWFjdGlvbnNXaWRnZXQub3BlbihyZWFjdGlvbk9wdGlvbnMsIHJvb3RFbGVtZW50KHJhY3RpdmUpKTtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZTogY3JlYXRlSW5kaWNhdG9yV2lkZ2V0XG59OyIsInZhciAkOyByZXF1aXJlKCcuL3V0aWxzL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIEFqYXhDbGllbnQgPSByZXF1aXJlKCcuL3V0aWxzL2FqYXgtY2xpZW50Jyk7XG52YXIgUGFnZVV0aWxzID0gcmVxdWlyZSgnLi91dGlscy9wYWdlLXV0aWxzJyk7XG52YXIgVGhyb3R0bGVkRXZlbnRzID0gcmVxdWlyZSgnLi91dGlscy90aHJvdHRsZWQtZXZlbnRzJyk7XG52YXIgVVJMcyA9IHJlcXVpcmUoJy4vdXRpbHMvdXJscycpO1xudmFyIFBhZ2VEYXRhID0gcmVxdWlyZSgnLi9wYWdlLWRhdGEnKTtcblxuLy8gQ29tcHV0ZSB0aGUgcGFnZXMgdGhhdCB3ZSBuZWVkIHRvIGZldGNoLiBUaGlzIGlzIGVpdGhlcjpcbi8vIDEuIEFueSBuZXN0ZWQgcGFnZXMgd2UgZmluZCB1c2luZyB0aGUgcGFnZSBzZWxlY3RvciBPUlxuLy8gMi4gVGhlIGN1cnJlbnQgd2luZG93IGxvY2F0aW9uXG5mdW5jdGlvbiBjb21wdXRlUGFnZXNQYXJhbSgkcGFnZUVsZW1lbnRBcnJheSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBncm91cElkID0gZ3JvdXBTZXR0aW5ncy5ncm91cElkKCk7XG4gICAgdmFyIHBhZ2VzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCAkcGFnZUVsZW1lbnRBcnJheS5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgJHBhZ2VFbGVtZW50ID0gJHBhZ2VFbGVtZW50QXJyYXlbaV07XG4gICAgICAgIHBhZ2VzLnB1c2goe1xuICAgICAgICAgICAgZ3JvdXBfaWQ6IGdyb3VwSWQsXG4gICAgICAgICAgICB1cmw6IFBhZ2VVdGlscy5jb21wdXRlUGFnZVVybCgkcGFnZUVsZW1lbnQsIGdyb3VwU2V0dGluZ3MpLFxuICAgICAgICAgICAgdGl0bGU6IFBhZ2VVdGlscy5jb21wdXRlUGFnZVRpdGxlKCRwYWdlRWxlbWVudCwgZ3JvdXBTZXR0aW5ncylcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGlmIChwYWdlcy5sZW5ndGggPT0gMSkge1xuICAgICAgICBwYWdlc1swXS5pbWFnZSA9IFBhZ2VVdGlscy5jb21wdXRlVG9wTGV2ZWxQYWdlSW1hZ2UoZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIHBhZ2VzWzBdLmF1dGhvciA9IFBhZ2VVdGlscy5jb21wdXRlUGFnZUF1dGhvcihncm91cFNldHRpbmdzKTtcbiAgICAgICAgcGFnZXNbMF0udG9waWNzID0gUGFnZVV0aWxzLmNvbXB1dGVQYWdlVG9waWNzKGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICBwYWdlc1swXS5zZWN0aW9uID0gUGFnZVV0aWxzLmNvbXB1dGVQYWdlU2l0ZVNlY3Rpb24oZ3JvdXBTZXR0aW5ncyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHsgcGFnZXM6IHBhZ2VzIH07XG59XG5cbmZ1bmN0aW9uIGxvYWRQYWdlRGF0YShwYWdlRGF0YVBhcmFtLCBncm91cFNldHRpbmdzKSB7XG4gICAgQWpheENsaWVudC5nZXRKU09OUChVUkxzLnBhZ2VEYXRhVXJsKCksIHBhZ2VEYXRhUGFyYW0sIHN1Y2Nlc3MsIGVycm9yKTtcblxuICAgIGZ1bmN0aW9uIHN1Y2Nlc3MoanNvbikge1xuICAgICAgICAvL3NldFRpbWVvdXQoZnVuY3Rpb24oKSB7IFBhZ2VEYXRhLnVwZGF0ZUFsbFBhZ2VEYXRhKGpzb24sIGdyb3VwU2V0dGluZ3MpOyB9LCAzMDAwKTtcbiAgICAgICAgUGFnZURhdGEudXBkYXRlQWxsUGFnZURhdGEoanNvbiwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZXJyb3IobWVzc2FnZSkge1xuICAgICAgICAvLyBUT0RPIGhhbmRsZSBlcnJvcnMgdGhhdCBoYXBwZW4gd2hlbiBsb2FkaW5nIHBhZ2UgZGF0YVxuICAgICAgICBjb25zb2xlLmxvZygnQW4gZXJyb3Igb2NjdXJyZWQgbG9hZGluZyBwYWdlIGRhdGE6ICcgKyBtZXNzYWdlKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHN0YXJ0TG9hZGluZ1BhZ2VEYXRhKGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgJHBhZ2VFbGVtZW50cyA9ICQoZ3JvdXBTZXR0aW5ncy5wYWdlU2VsZWN0b3IoKSk7XG4gICAgaWYgKCRwYWdlRWxlbWVudHMubGVuZ3RoID09IDApIHtcbiAgICAgICAgJHBhZ2VFbGVtZW50cyA9ICQoJ2JvZHknKTtcbiAgICB9XG4gICAgcXVldWVQYWdlRGF0YUxvYWQoJHBhZ2VFbGVtZW50cywgZ3JvdXBTZXR0aW5ncyk7XG59XG5cbmZ1bmN0aW9uIHF1ZXVlUGFnZURhdGFMb2FkKCRwYWdlRWxlbWVudHMsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgcGFnZXNUb0xvYWQgPSBbXTtcbiAgICAkcGFnZUVsZW1lbnRzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkcGFnZUVsZW1lbnQgPSAkKHRoaXMpO1xuICAgICAgICBpZiAoaXNJblZpZXcoJHBhZ2VFbGVtZW50KSkge1xuICAgICAgICAgICAgcGFnZXNUb0xvYWQucHVzaCgkcGFnZUVsZW1lbnQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbG9hZFdoZW5WaXNpYmxlKCRwYWdlRWxlbWVudCwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIHZhciBwYWdlRGF0YVBhcmFtID0gY29tcHV0ZVBhZ2VzUGFyYW0ocGFnZXNUb0xvYWQsIGdyb3VwU2V0dGluZ3MpO1xuICAgIC8vIFRPRE86IGRlbGV0ZSB0aGUgY29tbWVudGVkIGxpbmUgYmVsb3csIHdoaWNoIGlzIGZvciB0ZXN0aW5nIHB1cnBvc2VzXG4gICAgLy9wYWdlRGF0YVBhcmFtID0ge3BhZ2VzOiBbe1wiZ3JvdXBfaWRcIjoxMTg0LCBcInVybFwiOlwiaHR0cDovL3d3dy5kdWtlY2hyb25pY2xlLmNvbS9hcnRpY2xlcy8yMDE0LzAyLzE0L3BvcnRyYWl0LXBvcm4tc3RhclwiLFwiY2Fub25pY2FsX3VybFwiOlwic2FtZVwiLFwidGl0bGVcIjpcIlBvcnRyYWl0IG9mIGEgcG9ybiBzdGFyXCIsXCJpbWFnZVwiOlwiXCJ9XX07XG4gICAgbG9hZFBhZ2VEYXRhKHBhZ2VEYXRhUGFyYW0sIGdyb3VwU2V0dGluZ3MpO1xufVxuXG5mdW5jdGlvbiBpc0luVmlldygkZWxlbWVudCkge1xuICAgIHZhciB0cmlnZ2VyRGlzdGFuY2UgPSAzMDA7XG4gICAgcmV0dXJuICRlbGVtZW50Lm9mZnNldCgpLnRvcCA8ICAkKGRvY3VtZW50KS5zY3JvbGxUb3AoKSArICQod2luZG93KS5oZWlnaHQoKSArIHRyaWdnZXJEaXN0YW5jZTtcbn1cblxuZnVuY3Rpb24gbG9hZFdoZW5WaXNpYmxlKCRwYWdlRWxlbWVudCwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBjaGVja1Zpc2liaWxpdHkgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKGlzSW5WaWV3KCRwYWdlRWxlbWVudCkpIHtcbiAgICAgICAgICAgIHZhciBwYWdlRGF0YVBhcmFtID0gY29tcHV0ZVBhZ2VzUGFyYW0oWyRwYWdlRWxlbWVudF0sIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgbG9hZFBhZ2VEYXRhKHBhZ2VEYXRhUGFyYW0sIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgVGhyb3R0bGVkRXZlbnRzLm9mZignc2Nyb2xsJywgY2hlY2tWaXNpYmlsaXR5KTtcbiAgICAgICAgICAgIFRocm90dGxlZEV2ZW50cy5vZmYoJ3Jlc2l6ZScsIGNoZWNrVmlzaWJpbGl0eSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFRocm90dGxlZEV2ZW50cy5vbignc2Nyb2xsJywgY2hlY2tWaXNpYmlsaXR5KTtcbiAgICBUaHJvdHRsZWRFdmVudHMub24oJ3Jlc2l6ZScsIGNoZWNrVmlzaWJpbGl0eSk7XG59XG5cbmZ1bmN0aW9uIHBhZ2VzQWRkZWQoJHBhZ2VFbGVtZW50cywgZ3JvdXBTZXR0aW5ncykge1xuICAgIHF1ZXVlUGFnZURhdGFMb2FkKCRwYWdlRWxlbWVudHMsIGdyb3VwU2V0dGluZ3MpO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgbG9hZDogc3RhcnRMb2FkaW5nUGFnZURhdGEsXG4gICAgcGFnZXNBZGRlZDogcGFnZXNBZGRlZFxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi91dGlscy9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcblxudmFyIEV2ZW50cyA9IHJlcXVpcmUoJy4vZXZlbnRzJyk7XG52YXIgSGFzaGVkRWxlbWVudHMgPSByZXF1aXJlKCcuL2hhc2hlZC1lbGVtZW50cycpO1xuXG4vLyBDb2xsZWN0aW9uIG9mIGFsbCBwYWdlIGRhdGEsIGtleWVkIGJ5IHBhZ2UgaGFzaFxudmFyIHBhZ2VzID0ge307XG4vLyBNYXBwaW5nIG9mIHBhZ2UgVVJMcyB0byBwYWdlIGhhc2hlcywgd2hpY2ggYXJlIGNvbXB1dGVkIG9uIHRoZSBzZXJ2ZXIuXG52YXIgdXJsSGFzaGVzID0ge307XG5cbmZ1bmN0aW9uIGdldFBhZ2VEYXRhKGhhc2gpIHtcbiAgICB2YXIgcGFnZURhdGEgPSBwYWdlc1toYXNoXTtcbiAgICBpZiAoIXBhZ2VEYXRhKSB7XG4gICAgICAgIC8vIFRPRE86IEdpdmUgdGhpcyBzZXJpb3VzIHRob3VnaHQuIEluIG9yZGVyIGZvciBtYWdpYyBtb2RlIHRvIHdvcmssIHRoZSBvYmplY3QgbmVlZHMgdG8gaGF2ZSB2YWx1ZXMgaW4gcGxhY2UgZm9yXG4gICAgICAgIC8vIHRoZSBvYnNlcnZlZCBwcm9wZXJ0aWVzIGF0IHRoZSBtb21lbnQgdGhlIHJhY3RpdmUgaXMgY3JlYXRlZC4gQnV0IHRoaXMgaXMgcHJldHR5IHVudXN1YWwgZm9yIEphdmFzY3JpcHQsIHRvIGhhdmVcbiAgICAgICAgLy8gdG8gZGVmaW5lIHRoZSB3aG9sZSBza2VsZXRvbiBmb3IgdGhlIG9iamVjdCBpbnN0ZWFkIG9mIGp1c3QgYWRkaW5nIHByb3BlcnRpZXMgd2hlbmV2ZXIgeW91IHdhbnQuXG4gICAgICAgIC8vIFRoZSBhbHRlcm5hdGl2ZSB3b3VsZCBiZSBmb3IgdXMgdG8ga2VlcCBvdXIgb3duIFwiZGF0YSBiaW5kaW5nXCIgYmV0d2VlbiB0aGUgcGFnZURhdGEgYW5kIHJhY3RpdmUgaW5zdGFuY2VzICgxIHRvIG1hbnkpXG4gICAgICAgIC8vIGFuZCB0ZWxsIHRoZSByYWN0aXZlcyB0byB1cGRhdGUgd2hlbmV2ZXIgdGhlIGRhdGEgY2hhbmdlcy5cbiAgICAgICAgcGFnZURhdGEgPSB7XG4gICAgICAgICAgICBwYWdlSGFzaDogaGFzaCxcbiAgICAgICAgICAgIHN1bW1hcnlSZWFjdGlvbnM6IFtdLFxuICAgICAgICAgICAgc3VtbWFyeVRvdGFsOiAwLFxuICAgICAgICAgICAgc3VtbWFyeUxvYWRlZDogZmFsc2UsXG4gICAgICAgICAgICBjb250YWluZXJzOiBbXSxcbiAgICAgICAgICAgIG1ldHJpY3M6IHt9IC8vIFRoaXMgaXMgYSBjYXRjaC1hbGwgZmllbGQgd2hlcmUgd2UgY2FuIGF0dGFjaCBjbGllbnQtc2lkZSBtZXRyaWNzIGZvciBhbmFseXRpY3NcbiAgICAgICAgfTtcbiAgICAgICAgcGFnZXNbaGFzaF0gPSBwYWdlRGF0YTtcbiAgICB9XG4gICAgcmV0dXJuIHBhZ2VEYXRhO1xufVxuXG5mdW5jdGlvbiB1cGRhdGVBbGxQYWdlRGF0YShqc29uUGFnZXMsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgYWxsUGFnZXMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGpzb25QYWdlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgcGFnZURhdGEgPSB1cGRhdGVQYWdlRGF0YShqc29uUGFnZXNbaV0sIGdyb3VwU2V0dGluZ3MpXG4gICAgICAgIGFsbFBhZ2VzLnB1c2gocGFnZURhdGEpO1xuICAgICAgICBFdmVudHMucG9zdFBhZ2VEYXRhTG9hZGVkKHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZVBhZ2VEYXRhKGpzb24sIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgcGFnZURhdGEgPSBnZXRQYWdlRGF0YUZvckpzb25SZXNwb25zZShqc29uKTtcbiAgICBwYWdlRGF0YS5wYWdlSWQgPSBqc29uLmlkO1xuICAgIHBhZ2VEYXRhLnBhZ2VIYXNoID0ganNvbi5wYWdlSGFzaDtcbiAgICBwYWdlRGF0YS5ncm91cElkID0gZ3JvdXBTZXR0aW5ncy5ncm91cElkKCk7XG4gICAgcGFnZURhdGEuY2Fub25pY2FsVXJsID0ganNvbi5jYW5vbmljYWxVUkw7XG4gICAgcGFnZURhdGEucmVxdWVzdGVkVXJsID0ganNvbi5yZXF1ZXN0ZWRVUkw7XG4gICAgcGFnZURhdGEuYXV0aG9yID0ganNvbi5hdXRob3I7XG4gICAgcGFnZURhdGEuc2VjdGlvbiA9IGpzb24uc2VjdGlvbjtcbiAgICBwYWdlRGF0YS50b3BpY3MgPSBqc29uLnRvcGljcztcbiAgICBwYWdlRGF0YS50aXRsZSA9IGpzb24udGl0bGU7XG4gICAgcGFnZURhdGEuaW1hZ2UgPSBqc29uLmltYWdlO1xuXG4gICAgdmFyIHN1bW1hcnlSZWFjdGlvbnMgPSBqc29uLnN1bW1hcnlSZWFjdGlvbnM7XG4gICAgcGFnZURhdGEuc3VtbWFyeVJlYWN0aW9ucyA9IHN1bW1hcnlSZWFjdGlvbnM7XG4gICAgc2V0Q29udGFpbmVycyhwYWdlRGF0YSwganNvbi5jb250YWluZXJzKTtcblxuICAgIC8vIFdlIGFkZCB1cCB0aGUgc3VtbWFyeSByZWFjdGlvbiB0b3RhbCBjbGllbnQtc2lkZVxuICAgIHZhciB0b3RhbCA9IDA7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdW1tYXJ5UmVhY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHRvdGFsID0gdG90YWwgKyBzdW1tYXJ5UmVhY3Rpb25zW2ldLmNvdW50O1xuICAgIH1cbiAgICBwYWdlRGF0YS5zdW1tYXJ5VG90YWwgPSB0b3RhbDtcbiAgICBwYWdlRGF0YS5zdW1tYXJ5TG9hZGVkID0gdHJ1ZTtcblxuICAgIC8vIFdlIGFkZCB1cCB0aGUgY29udGFpbmVyIHJlYWN0aW9uIHRvdGFscyBjbGllbnQtc2lkZVxuICAgIHZhciB0b3RhbCA9IDA7XG4gICAgdmFyIGNvbnRhaW5lckNvdW50cyA9IFtdO1xuICAgIHZhciBjb250YWluZXJzID0gcGFnZURhdGEuY29udGFpbmVycztcbiAgICBmb3IgKHZhciBoYXNoIGluIGpzb24uY29udGFpbmVycykge1xuICAgICAgICBpZiAoY29udGFpbmVycy5oYXNPd25Qcm9wZXJ0eShoYXNoKSkge1xuICAgICAgICAgICAgdmFyIGNvbnRhaW5lciA9IGNvbnRhaW5lcnNbaGFzaF07XG4gICAgICAgICAgICB2YXIgdG90YWwgPSAwO1xuICAgICAgICAgICAgdmFyIGNvbnRhaW5lclJlYWN0aW9ucyA9IGNvbnRhaW5lci5yZWFjdGlvbnM7XG4gICAgICAgICAgICBpZiAoY29udGFpbmVyUmVhY3Rpb25zKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb250YWluZXJSZWFjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdG90YWwgPSB0b3RhbCArIGNvbnRhaW5lclJlYWN0aW9uc1tpXS5jb3VudDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb250YWluZXIucmVhY3Rpb25Ub3RhbCA9IHRvdGFsO1xuICAgICAgICAgICAgY29udGFpbmVyQ291bnRzLnB1c2goeyBjb3VudDogdG90YWwsIGNvbnRhaW5lcjogY29udGFpbmVyIH0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIHZhciBpbmRpY2F0b3JMaW1pdCA9IGdyb3VwU2V0dGluZ3MudGV4dEluZGljYXRvckxpbWl0KCk7XG4gICAgaWYgKGluZGljYXRvckxpbWl0KSB7XG4gICAgICAgIC8vIElmIGFuIGluZGljYXRvciBsaW1pdCBpcyBzZXQsIHNvcnQgdGhlIGNvbnRhaW5lcnMgYW5kIG1hcmsgb25seSB0aGUgdG9wIE4gdG8gYmUgdmlzaWJsZS5cbiAgICAgICAgY29udGFpbmVyQ291bnRzLnNvcnQoZnVuY3Rpb24oYSwgYikgeyByZXR1cm4gYi5jb3VudCAtIGEuY291bnQ7IH0pOyAvLyBzb3J0IGxhcmdlc3QgY291bnQgZmlyc3RcbiAgICAgICAgZm9yICh2YXIgaSA9IGluZGljYXRvckxpbWl0OyBpIDwgY29udGFpbmVyQ291bnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb250YWluZXJDb3VudHNbaV0uY29udGFpbmVyLnN1cHByZXNzID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBwYWdlRGF0YTtcbn1cblxuZnVuY3Rpb24gZ2V0Q29udGFpbmVyRGF0YShwYWdlRGF0YSwgY29udGFpbmVySGFzaCkge1xuICAgIHZhciBjb250YWluZXJEYXRhID0gcGFnZURhdGEuY29udGFpbmVyc1tjb250YWluZXJIYXNoXTtcbiAgICBpZiAoIWNvbnRhaW5lckRhdGEpIHtcbiAgICAgICAgY29udGFpbmVyRGF0YSA9IHtcbiAgICAgICAgICAgIGhhc2g6IGNvbnRhaW5lckhhc2gsXG4gICAgICAgICAgICByZWFjdGlvblRvdGFsOiAwLFxuICAgICAgICAgICAgcmVhY3Rpb25zOiBbXSxcbiAgICAgICAgICAgIGxvYWRlZDogcGFnZURhdGEuc3VtbWFyeUxvYWRlZCxcbiAgICAgICAgICAgIHN1cHByZXNzOiBmYWxzZVxuICAgICAgICB9O1xuICAgICAgICBwYWdlRGF0YS5jb250YWluZXJzW2NvbnRhaW5lckhhc2hdID0gY29udGFpbmVyRGF0YTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbnRhaW5lckRhdGE7XG59XG5cbi8vIE1lcmdlIHRoZSBnaXZlbiBjb250YWluZXIgZGF0YSBpbnRvIHRoZSBwYWdlRGF0YS5jb250YWluZXJzIGRhdGEuIFRoaXMgaXMgbmVjZXNzYXJ5IGJlY2F1c2UgdGhlIHNrZWxldG9uIG9mIHRoZSBwYWdlRGF0YS5jb250YWluZXJzIG1hcFxuLy8gaXMgc2V0IHVwIGFuZCBib3VuZCB0byB0aGUgVUkgYmVmb3JlIGFsbCB0aGUgZGF0YSBpcyBmZXRjaGVkIGZyb20gdGhlIHNlcnZlciBhbmQgd2UgZG9uJ3Qgd2FudCB0byBicmVhayB0aGUgZGF0YSBiaW5kaW5nLlxuZnVuY3Rpb24gc2V0Q29udGFpbmVycyhwYWdlRGF0YSwganNvbkNvbnRhaW5lcnMpIHtcbiAgICBmb3IgKHZhciBoYXNoIGluIGpzb25Db250YWluZXJzKSB7XG4gICAgICAgIGlmIChqc29uQ29udGFpbmVycy5oYXNPd25Qcm9wZXJ0eShoYXNoKSkge1xuICAgICAgICAgICAgdmFyIGNvbnRhaW5lckRhdGEgPSBnZXRDb250YWluZXJEYXRhKHBhZ2VEYXRhLCBoYXNoKTtcbiAgICAgICAgICAgIHZhciBmZXRjaGVkQ29udGFpbmVyRGF0YSA9IGpzb25Db250YWluZXJzW2hhc2hdO1xuICAgICAgICAgICAgY29udGFpbmVyRGF0YS5pZCA9IGZldGNoZWRDb250YWluZXJEYXRhLmlkO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBmZXRjaGVkQ29udGFpbmVyRGF0YS5yZWFjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjb250YWluZXJEYXRhLnJlYWN0aW9ucy5wdXNoKGZldGNoZWRDb250YWluZXJEYXRhLnJlYWN0aW9uc1tpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgdmFyIGFsbENvbnRhaW5lcnMgPSBwYWdlRGF0YS5jb250YWluZXJzO1xuICAgIGZvciAodmFyIGhhc2ggaW4gYWxsQ29udGFpbmVycykge1xuICAgICAgICBpZiAoYWxsQ29udGFpbmVycy5oYXNPd25Qcm9wZXJ0eShoYXNoKSkge1xuICAgICAgICAgICAgdmFyIGNvbnRhaW5lciA9IGFsbENvbnRhaW5lcnNbaGFzaF07XG4gICAgICAgICAgICBjb250YWluZXIubG9hZGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gY2xlYXJJbmRpY2F0b3JMaW1pdChwYWdlRGF0YSkge1xuICAgIHZhciBjb250YWluZXJzID0gcGFnZURhdGEuY29udGFpbmVycztcbiAgICBmb3IgKHZhciBoYXNoIGluIGNvbnRhaW5lcnMpIHtcbiAgICAgICAgaWYgKGNvbnRhaW5lcnMuaGFzT3duUHJvcGVydHkoaGFzaCkpIHtcbiAgICAgICAgICAgIHZhciBjb250YWluZXIgPSBjb250YWluZXJzW2hhc2hdO1xuICAgICAgICAgICAgY29udGFpbmVyLnN1cHByZXNzID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8vIFJldHVybnMgdGhlIGxvY2F0aW9ucyB3aGVyZSB0aGUgZ2l2ZW4gcmVhY3Rpb24gb2NjdXJzIG9uIHRoZSBwYWdlLiBUaGUgcmV0dXJuIGZvcm1hdCBpczpcbi8vIHtcbi8vICAgPGNvbnRlbnRfaWQ+IDoge1xuLy8gICAgIGNvdW50OiA8bnVtYmVyPixcbi8vICAgICBpZDogPGNvbnRlbnRfaWQ+LFxuLy8gICAgIGNvbnRhaW5lcklEOiA8Y29udGFpbmVyX2lkPlxuLy8gICAgIGtpbmQ6IDxjb250ZW50IGtpbmQ+LFxuLy8gICAgIGxvY2F0aW9uOiA8bG9jYXRpb24+LFxuLy8gICAgIFtib2R5OiA8Ym9keT5dIGZpbGxlZCBpbiBsYXRlciB2aWEgdXBkYXRlTG9jYXRpb25EYXRhXG4vLyAgIH1cbi8vIH1cbmZ1bmN0aW9uIGdldFJlYWN0aW9uTG9jYXRpb25EYXRhKHJlYWN0aW9uLCBwYWdlRGF0YSkge1xuICAgIGlmICghcGFnZURhdGEubG9jYXRpb25EYXRhKSB7IC8vIFBvcHVsYXRlIHRoaXMgdHJlZSBsYXppbHksIHNpbmNlIGl0J3Mgbm90IGZyZXF1ZW50bHkgdXNlZC5cbiAgICAgICAgcGFnZURhdGEubG9jYXRpb25EYXRhID0gY29tcHV0ZUxvY2F0aW9uRGF0YShwYWdlRGF0YSk7XG4gICAgfVxuICAgIHJldHVybiBwYWdlRGF0YS5sb2NhdGlvbkRhdGFbcmVhY3Rpb24uaWRdO1xufVxuXG4vLyBSZXR1cm5zIGEgdmlldyBvbiB0aGUgZ2l2ZW4gdHJlZSBzdHJ1Y3R1cmUgdGhhdCdzIG9wdGltaXplZCBmb3IgcmVuZGVyaW5nIHRoZSBsb2NhdGlvbiBvZiByZWFjdGlvbnMgKGFzIGZyb20gdGhlXG4vLyBzdW1tYXJ5IHdpZGdldCkuIEZvciBlYWNoIHJlYWN0aW9uLCB3ZSBjYW4gcXVpY2tseSBnZXQgdG8gdGhlIHBpZWNlcyBvZiBjb250ZW50IHRoYXQgaGF2ZSB0aGF0IHJlYWN0aW9uIGFzIHdlbGwgYXNcbi8vIHRoZSBjb3VudCBvZiB0aG9zZSByZWFjdGlvbnMgZm9yIGVhY2ggcGllY2Ugb2YgY29udGVudC5cbi8vXG4vLyBUaGUgc3RydWN0dXJlIGxvb2tzIGxpa2UgdGhpczpcbi8vIHtcbi8vICAgPHJlYWN0aW9uX2lkPiA6IHsgICAodGhpcyBpcyB0aGUgaW50ZXJhY3Rpb25fbm9kZV9pZClcbi8vICAgICA8Y29udGVudF9pZD4gOiB7XG4vLyAgICAgICBjb3VudCA6IDxudW1iZXI+LFxuLy8gICAgICAgY29udGFpbmVySUQ6IDxjb250YWluZXJfaWQ+LFxuLy8gICAgICAga2luZDogPGNvbnRlbnQga2luZD4sXG4vLyAgICAgICBsb2NhdGlvbjogPGxvY2F0aW9uPlxuLy8gICAgICAgW2JvZHk6IDxib2R5Pl0gZmlsbGVkIGluIGxhdGVyIHZpYSB1cGRhdGVMb2NhdGlvbkRhdGFcbi8vICAgICB9XG4vLyAgIH1cbi8vIH1cbmZ1bmN0aW9uIGNvbXB1dGVMb2NhdGlvbkRhdGEocGFnZURhdGEpIHtcbiAgICB2YXIgbG9jYXRpb25EYXRhID0ge307XG4gICAgdmFyIGNvbnRhaW5lcnMgPSBwYWdlRGF0YS5jb250YWluZXJzO1xuICAgIGZvciAodmFyIGhhc2ggaW4gY29udGFpbmVycykge1xuICAgICAgICBpZiAoY29udGFpbmVycy5oYXNPd25Qcm9wZXJ0eShoYXNoKSkge1xuICAgICAgICAgICAgdmFyIGNvbnRhaW5lckRhdGEgPSBjb250YWluZXJzW2hhc2hdO1xuICAgICAgICAgICAgdmFyIHJlYWN0aW9ucyA9IGNvbnRhaW5lckRhdGEucmVhY3Rpb25zO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZWFjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgcmVhY3Rpb24gPSByZWFjdGlvbnNbaV07XG4gICAgICAgICAgICAgICAgdmFyIHJlYWN0aW9uSWQgPSByZWFjdGlvbi5pZDtcbiAgICAgICAgICAgICAgICB2YXIgY29udGVudCA9IHJlYWN0aW9uLmNvbnRlbnQ7XG4gICAgICAgICAgICAgICAgdmFyIGNvbnRlbnRJZCA9IGNvbnRlbnQuaWQ7XG4gICAgICAgICAgICAgICAgdmFyIHJlYWN0aW9uTG9jYXRpb25EYXRhID0gbG9jYXRpb25EYXRhW3JlYWN0aW9uSWRdO1xuICAgICAgICAgICAgICAgIGlmICghcmVhY3Rpb25Mb2NhdGlvbkRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVhY3Rpb25Mb2NhdGlvbkRhdGEgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgbG9jYXRpb25EYXRhW3JlYWN0aW9uSWRdID0gcmVhY3Rpb25Mb2NhdGlvbkRhdGE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBjb250ZW50TG9jYXRpb25EYXRhID0gcmVhY3Rpb25Mb2NhdGlvbkRhdGFbY29udGVudElkXTsgLy8gVE9ETzogSXQncyBub3QgcmVhbGx5IHBvc3NpYmxlIHRvIGdldCBhIGhpdCBoZXJlLCBpcyBpdD8gV2Ugc2hvdWxkIG5ldmVyIHNlZSB0d28gaW5zdGFuY2VzIG9mIHRoZSBzYW1lIHJlYWN0aW9uIGZvciB0aGUgc2FtZSBjb250ZW50PyAoVGhlcmUnZCB3b3VsZCBqdXN0IGJlIG9uZSBpbnN0YW5jZSB3aXRoIGEgY291bnQgPiAxLilcbiAgICAgICAgICAgICAgICBpZiAoIWNvbnRlbnRMb2NhdGlvbkRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGVudExvY2F0aW9uRGF0YSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50OiAwLFxuICAgICAgICAgICAgICAgICAgICAgICAga2luZDogY29udGVudC5raW5kLCAvLyBUT0RPOiBXZSBzaG91bGQgbm9ybWFsaXplIHRoaXMgdmFsdWUgdG8gYSBzZXQgb2YgY29uc3RhbnRzLiBmaXggdGhpcyBpbiBsb2NhdGlvbnMtcGFnZSB3aGVyZSB0aGUgdmFsdWUgaXMgcmVhZCBhcyB3ZWxsLlxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogYWxzbyBjb25zaWRlciB0cmFuc2xhdGluZyB0aGlzIGZyb20gdGhlIHJhdyBcImtpbmRcIiB0byBcInR5cGVcIi4gKGUuZy4gXCJwYWdcIiA9PiBcInBhZ2VcIilcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uOiBjb250ZW50LmxvY2F0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGFpbmVySGFzaDogY29udGFpbmVyRGF0YS5oYXNoLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudElkOiBjb250ZW50SWRcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgcmVhY3Rpb25Mb2NhdGlvbkRhdGFbY29udGVudElkXSA9IGNvbnRlbnRMb2NhdGlvbkRhdGE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnRlbnRMb2NhdGlvbkRhdGEuY291bnQgKz0gcmVhY3Rpb24uY291bnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGxvY2F0aW9uRGF0YTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlUmVhY3Rpb25Mb2NhdGlvbkRhdGEocmVhY3Rpb25Mb2NhdGlvbkRhdGEsIGNvbnRlbnRCb2RpZXMpIHtcbiAgICBmb3IgKHZhciBjb250ZW50SWQgaW4gY29udGVudEJvZGllcykge1xuICAgICAgICBpZiAoY29udGVudEJvZGllcy5oYXNPd25Qcm9wZXJ0eShjb250ZW50SWQpKSB7XG4gICAgICAgICAgICB2YXIgY29udGVudExvY2F0aW9uRGF0YSA9IHJlYWN0aW9uTG9jYXRpb25EYXRhW2NvbnRlbnRJZF07XG4gICAgICAgICAgICBpZiAoY29udGVudExvY2F0aW9uRGF0YSkge1xuICAgICAgICAgICAgICAgIGNvbnRlbnRMb2NhdGlvbkRhdGEuYm9keSA9IGNvbnRlbnRCb2RpZXNbY29udGVudElkXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gcmVnaXN0ZXJSZWFjdGlvbihyZWFjdGlvbiwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEpIHtcbiAgICB2YXIgZXhpc3RpbmdSZWFjdGlvbnMgPSBjb250YWluZXJEYXRhLnJlYWN0aW9ucztcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGV4aXN0aW5nUmVhY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChleGlzdGluZ1JlYWN0aW9uc1tpXS5pZCA9PT0gcmVhY3Rpb24uaWQpIHtcbiAgICAgICAgICAgIC8vIFRoaXMgcmVhY3Rpb24gaGFzIGFscmVhZHkgYmVlbiBhZGRlZCB0byB0aGlzIGNvbnRhaW5lci4gRG9uJ3QgYWRkIGl0IGFnYWluLlxuICAgICAgICAgICAgcmV0dXJuIGV4aXN0aW5nUmVhY3Rpb25zW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIGNvbnRhaW5lckRhdGEucmVhY3Rpb25zLnB1c2gocmVhY3Rpb24pO1xuICAgIGNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbCA9IGNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbCArIDE7XG4gICAgdmFyIHN1bW1hcnlSZWFjdGlvbiA9IHtcbiAgICAgICAgdGV4dDogcmVhY3Rpb24udGV4dCxcbiAgICAgICAgaWQ6IHJlYWN0aW9uLmlkLFxuICAgICAgICBjb3VudDogcmVhY3Rpb24uY291bnRcbiAgICB9O1xuICAgIHBhZ2VEYXRhLnN1bW1hcnlSZWFjdGlvbnMucHVzaChzdW1tYXJ5UmVhY3Rpb24pO1xuICAgIHBhZ2VEYXRhLnN1bW1hcnlUb3RhbCA9IHBhZ2VEYXRhLnN1bW1hcnlUb3RhbCArIDE7XG4gICAgcmV0dXJuIHJlYWN0aW9uO1xufVxuXG4vLyBHZXRzIHBhZ2UgZGF0YSBiYXNlZCBvbiBhIFVSTC4gVGhpcyBhbGxvd3Mgb3VyIGNsaWVudCB0byBzdGFydCBwcm9jZXNzaW5nIGEgcGFnZSAoYW5kIGJpbmRpbmcgZGF0YSBvYmplY3RzXG4vLyB0byB0aGUgVUkpICpiZWZvcmUqIHdlIGdldCBkYXRhIGJhY2sgZnJvbSB0aGUgc2VydmVyLlxuZnVuY3Rpb24gZ2V0UGFnZURhdGFCeVVSTCh1cmwpIHtcbiAgICB2YXIgc2VydmVySGFzaCA9IHVybEhhc2hlc1t1cmxdO1xuICAgIGlmIChzZXJ2ZXJIYXNoKSB7XG4gICAgICAgIC8vIElmIHRoZSBzZXJ2ZXIgYWxyZWFkeSBnaXZlbiB1cyB0aGUgaGFzaCBmb3IgdGhlIHBhZ2UsIHVzZSBpdC5cbiAgICAgICAgcmV0dXJuIGdldFBhZ2VEYXRhKHNlcnZlckhhc2gpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIE90aGVyd2lzZSwgdGVtcG9yYXJpbHkgdXNlIHRoZSB1cmwgYXMgdGhlIGhhc2guIFRoaXMgd2lsbCBnZXQgdXBkYXRlZCB3aGVuZXZlciB3ZSBnZXQgZGF0YSBiYWNrIGZyb20gdGhlIHNlcnZlci5cbiAgICAgICAgcmV0dXJuIGdldFBhZ2VEYXRhKHVybCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBnZXRQYWdlRGF0YUZvckpzb25SZXNwb25zZShqc29uKSB7XG4gICAgdmFyIHBhZ2VIYXNoID0ganNvbi5wYWdlSGFzaDtcbiAgICB2YXIgcmVxdWVzdGVkVVJMID0ganNvbi5yZXF1ZXN0ZWRVUkw7XG4gICAgdXJsSGFzaGVzW3JlcXVlc3RlZFVSTF0gPSBwYWdlSGFzaDtcbiAgICB2YXIgdXJsQmFzZWREYXRhID0gcGFnZXNbcmVxdWVzdGVkVVJMXTtcbiAgICBpZiAodXJsQmFzZWREYXRhKSB7XG4gICAgICAgIC8vIElmIHdlJ3ZlIGFscmVhZHkgY3JlYXRlZC9ib3VuZCBhIHBhZ2VEYXRhIG9iamVjdCB1bmRlciB0aGUgcmVxdWVzdGVkVXJsLCB1cGRhdGUgdGhlIHBhZ2VIYXNoIGFuZCBtb3ZlIHRoYXRcbiAgICAgICAgLy8gZGF0YSBvdmVyIHRvIHRoZSBoYXNoIGtleVxuICAgICAgICB1cmxCYXNlZERhdGEucGFnZUhhc2ggPSBqc29uLnBhZ2VIYXNoO1xuICAgICAgICBwYWdlc1twYWdlSGFzaF0gPSB1cmxCYXNlZERhdGE7XG4gICAgICAgIGRlbGV0ZSBwYWdlc1tyZXF1ZXN0ZWRVUkxdO1xuICAgICAgICAvLyBVcGRhdGUgdGhlIG1hcHBpbmcgb2YgaGFzaGVzIHRvIHBhZ2UgZWxlbWVudHMgc28gaXQgYWxzbyBrbm93cyBhYm91dCB0aGUgY2hhbmdlIHRvIHRoZSBwYWdlIGhhc2hcbiAgICAgICAgSGFzaGVkRWxlbWVudHMudXBkYXRlUGFnZUhhc2gocmVxdWVzdGVkVVJMLCBwYWdlSGFzaCk7XG4gICAgfVxuICAgIHJldHVybiBnZXRQYWdlRGF0YShwYWdlSGFzaCk7XG59XG5cbmZ1bmN0aW9uIHRlYXJkb3duKCkge1xuICAgIHBhZ2VzID0ge307XG4gICAgdXJsSGFzaGVzID0ge307XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBnZXRQYWdlRGF0YUJ5VVJMOiBnZXRQYWdlRGF0YUJ5VVJMLFxuICAgIGdldFBhZ2VEYXRhOiBnZXRQYWdlRGF0YSxcbiAgICB1cGRhdGVBbGxQYWdlRGF0YTogdXBkYXRlQWxsUGFnZURhdGEsXG4gICAgZ2V0Q29udGFpbmVyRGF0YTogZ2V0Q29udGFpbmVyRGF0YSxcbiAgICBnZXRSZWFjdGlvbkxvY2F0aW9uRGF0YTogZ2V0UmVhY3Rpb25Mb2NhdGlvbkRhdGEsXG4gICAgdXBkYXRlUmVhY3Rpb25Mb2NhdGlvbkRhdGE6IHVwZGF0ZVJlYWN0aW9uTG9jYXRpb25EYXRhLFxuICAgIHJlZ2lzdGVyUmVhY3Rpb246IHJlZ2lzdGVyUmVhY3Rpb24sXG4gICAgY2xlYXJJbmRpY2F0b3JMaW1pdDogY2xlYXJJbmRpY2F0b3JMaW1pdCxcbiAgICB0ZWFyZG93bjogdGVhcmRvd24sXG59OyIsInZhciAkOyByZXF1aXJlKCcuL3V0aWxzL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIEFwcE1vZGUgPSByZXF1aXJlKCcuL3V0aWxzL2FwcC1tb2RlJyk7XG52YXIgSGFzaCA9IHJlcXVpcmUoJy4vdXRpbHMvaGFzaCcpO1xudmFyIE11dGF0aW9uT2JzZXJ2ZXIgPSByZXF1aXJlKCcuL3V0aWxzL211dGF0aW9uLW9ic2VydmVyJyk7XG52YXIgUGFnZVV0aWxzID0gcmVxdWlyZSgnLi91dGlscy9wYWdlLXV0aWxzJyk7XG52YXIgVVJMcyA9IHJlcXVpcmUoJy4vdXRpbHMvdXJscycpO1xudmFyIFdpZGdldEJ1Y2tldCA9IHJlcXVpcmUoJy4vdXRpbHMvd2lkZ2V0LWJ1Y2tldCcpO1xuXG52YXIgQXV0b0NhbGxUb0FjdGlvbiA9IHJlcXVpcmUoJy4vYXV0by1jYWxsLXRvLWFjdGlvbicpO1xudmFyIENhbGxUb0FjdGlvbkluZGljYXRvciA9IHJlcXVpcmUoJy4vY2FsbC10by1hY3Rpb24taW5kaWNhdG9yJyk7XG52YXIgSGFzaGVkRWxlbWVudHMgPSByZXF1aXJlKCcuL2hhc2hlZC1lbGVtZW50cycpO1xudmFyIE1lZGlhSW5kaWNhdG9yV2lkZ2V0ID0gcmVxdWlyZSgnLi9tZWRpYS1pbmRpY2F0b3Itd2lkZ2V0Jyk7XG52YXIgUGFnZURhdGEgPSByZXF1aXJlKCcuL3BhZ2UtZGF0YScpO1xudmFyIFBhZ2VEYXRhTG9hZGVyID0gcmVxdWlyZSgnLi9wYWdlLWRhdGEtbG9hZGVyJyk7XG52YXIgU3VtbWFyeVdpZGdldCA9IHJlcXVpcmUoJy4vc3VtbWFyeS13aWRnZXQnKTtcbnZhciBUZXh0SW5kaWNhdG9yV2lkZ2V0ID0gcmVxdWlyZSgnLi90ZXh0LWluZGljYXRvci13aWRnZXQnKTtcbnZhciBUZXh0UmVhY3Rpb25zID0gcmVxdWlyZSgnLi90ZXh0LXJlYWN0aW9ucycpO1xuXG52YXIgVFlQRV9URVhUID0gXCJ0ZXh0XCI7XG52YXIgVFlQRV9JTUFHRSA9IFwiaW1hZ2VcIjtcbnZhciBUWVBFX01FRElBID0gXCJtZWRpYVwiO1xuXG52YXIgQVRUUl9IQVNIID0gXCJhbnQtaGFzaFwiO1xuXG52YXIgY3JlYXRlZFdpZGdldHMgPSBbXTtcblxuXG4vLyBTY2FuIGZvciBhbGwgcGFnZXMgYXQgdGhlIGN1cnJlbnQgYnJvd3NlciBsb2NhdGlvbi4gVGhpcyBjb3VsZCBqdXN0IGJlIHRoZSBjdXJyZW50IHBhZ2Ugb3IgaXQgY291bGQgYmUgYSBjb2xsZWN0aW9uXG4vLyBvZiBwYWdlcyAoYWthICdwb3N0cycpLlxuZnVuY3Rpb24gc2NhbkFsbFBhZ2VzKGdyb3VwU2V0dGluZ3MpIHtcbiAgICAkKGdyb3VwU2V0dGluZ3MuZXhjbHVzaW9uU2VsZWN0b3IoKSkuYWRkQ2xhc3MoJ25vLWFudCcpOyAvLyBBZGQgdGhlIG5vLWFudCBjbGFzcyB0byBldmVyeXRoaW5nIHRoYXQgaXMgZmxhZ2dlZCBmb3IgZXhjbHVzaW9uXG4gICAgdmFyICRwYWdlcyA9ICQoZ3JvdXBTZXR0aW5ncy5wYWdlU2VsZWN0b3IoKSk7IC8vIFRPRE86IG5vLWFudD9cbiAgICBpZiAoJHBhZ2VzLmxlbmd0aCA9PSAwKSB7XG4gICAgICAgIC8vIElmIHdlIGRvbid0IGRldGVjdCBhbnkgcGFnZSBtYXJrZXJzLCB0cmVhdCB0aGUgd2hvbGUgZG9jdW1lbnQgYXMgdGhlIHNpbmdsZSBwYWdlXG4gICAgICAgICRwYWdlcyA9ICQoJ2JvZHknKTsgLy8gVE9ETzogSXMgdGhpcyB0aGUgcmlnaHQgYmVoYXZpb3I/IChLZWVwIGluIHN5bmMgd2l0aCB0aGUgc2FtZSBhc3N1bXB0aW9uIHRoYXQncyBidWlsdCBpbnRvIHBhZ2UtZGF0YS1sb2FkZXIuKVxuICAgIH1cbiAgICAkcGFnZXMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRwYWdlID0gJCh0aGlzKTtcbiAgICAgICAgc2NhblBhZ2UoJHBhZ2UsIGdyb3VwU2V0dGluZ3MsICRwYWdlcy5sZW5ndGggPiAxKTtcbiAgICB9KTtcbiAgICBzZXR1cE11dGF0aW9uT2JzZXJ2ZXIoZ3JvdXBTZXR0aW5ncyk7XG59XG5cbi8vIFNjYW4gdGhlIHBhZ2UgdXNpbmcgdGhlIGdpdmVuIHNldHRpbmdzOlxuLy8gMS4gRmluZCBhbGwgdGhlIGNvbnRhaW5lcnMgdGhhdCB3ZSBjYXJlIGFib3V0LlxuLy8gMi4gQ29tcHV0ZSBoYXNoZXMgZm9yIGVhY2ggY29udGFpbmVyLlxuLy8gMy4gSW5zZXJ0IHdpZGdldCBhZmZvcmRhbmNlcyBmb3IgZWFjaCB3aGljaCBhcmUgYm91bmQgdG8gdGhlIGRhdGEgbW9kZWwgYnkgdGhlIGhhc2hlcy5cbmZ1bmN0aW9uIHNjYW5QYWdlKCRwYWdlLCBncm91cFNldHRpbmdzLCBpc011bHRpUGFnZSkge1xuICAgIHZhciB1cmwgPSBQYWdlVXRpbHMuY29tcHV0ZVBhZ2VVcmwoJHBhZ2UsIGdyb3VwU2V0dGluZ3MpO1xuICAgIHZhciBwYWdlRGF0YSA9IFBhZ2VEYXRhLmdldFBhZ2VEYXRhQnlVUkwodXJsKTtcbiAgICB2YXIgJGFjdGl2ZVNlY3Rpb25zID0gZmluZCgkcGFnZSwgZ3JvdXBTZXR0aW5ncy5hY3RpdmVTZWN0aW9ucygpLCB0cnVlKTtcblxuICAgIC8vIEZpcnN0LCBzY2FuIGZvciBlbGVtZW50cyB0aGF0IHdvdWxkIGNhdXNlIHVzIHRvIGluc2VydCBzb21ldGhpbmcgaW50byB0aGUgRE9NIHRoYXQgdGFrZXMgdXAgc3BhY2UuXG4gICAgLy8gV2Ugd2FudCB0byBnZXQgYW55IHBhZ2UgcmVzaXppbmcgb3V0IG9mIHRoZSB3YXkgYXMgZWFybHkgYXMgcG9zc2libGUuXG4gICAgLy8gVE9ETzogQ29uc2lkZXIgZG9pbmcgdGhpcyB3aXRoIHJhdyBKYXZhc2NyaXB0IGJlZm9yZSBqUXVlcnkgbG9hZHMsIHRvIGZ1cnRoZXIgcmVkdWNlIHRoZSBkZWxheS4gV2Ugd291bGRuJ3RcbiAgICAvLyBzYXZlIGEgKnRvbiogb2YgdGltZSBmcm9tIHRoaXMsIHRob3VnaCwgc28gaXQncyBkZWZpbml0ZWx5IGEgbGF0ZXIgb3B0aW1pemF0aW9uLlxuICAgIHNjYW5Gb3JTdW1tYXJpZXMoJHBhZ2UsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTsgLy8gU3VtbWFyeSB3aWRnZXQgbWF5IGJlIG9uIHRoZSBwYWdlLCBidXQgb3V0c2lkZSB0aGUgYWN0aXZlIHNlY3Rpb25cbiAgICAkYWN0aXZlU2VjdGlvbnMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRzZWN0aW9uID0gJCh0aGlzKTtcbiAgICAgICAgY3JlYXRlQXV0b0NhbGxzVG9BY3Rpb24oJHNlY3Rpb24sIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICB9KTtcbiAgICAvLyBTY2FuIGZvciBDVEFzIGFjcm9zcyB0aGUgZW50aXJlIHBhZ2UgKHRoZXkgY2FuIGJlIG91dHNpZGUgYW4gYWN0aXZlIHNlY3Rpb24pLiBDVEFzIGhhdmUgdG8gZ28gYmVmb3JlIHNjYW5zIGZvclxuICAgIC8vIGNvbnRlbnQgYmVjYXVzZSBjb250ZW50IGludm9sdmVkIGluIENUQXMgd2lsbCBiZSB0YWdnZWQgbm8tYW50LlxuICAgIHNjYW5Gb3JDYWxsc1RvQWN0aW9uKCRwYWdlLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgLy8gVGhlbiBzY2FuIGZvciBldmVyeXRoaW5nIGVsc2VcbiAgICAkYWN0aXZlU2VjdGlvbnMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRzZWN0aW9uID0gJCh0aGlzKTtcbiAgICAgICAgc2NhbkFjdGl2ZUVsZW1lbnQoJHNlY3Rpb24sIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICB9KTtcblxuICAgIHBhZ2VEYXRhLm1ldHJpY3MuaGVpZ2h0ID0gY29tcHV0ZVBhZ2VIZWlnaHQoJGFjdGl2ZVNlY3Rpb25zKTtcbiAgICBwYWdlRGF0YS5tZXRyaWNzLmlzTXVsdGlQYWdlID0gaXNNdWx0aVBhZ2U7XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVQYWdlSGVpZ2h0KCRhY3RpdmVTZWN0aW9ucykge1xuICAgIHZhciBjb250ZW50VG9wO1xuICAgIHZhciBjb250ZW50Qm90dG9tO1xuICAgICRhY3RpdmVTZWN0aW9ucy5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgJHNlY3Rpb24gPSAkKHRoaXMpO1xuICAgICAgICB2YXIgb2Zmc2V0ID0gJHNlY3Rpb24ub2Zmc2V0KCk7XG4gICAgICAgIGNvbnRlbnRUb3AgPSBjb250ZW50VG9wID09PSB1bmRlZmluZWQgPyBvZmZzZXQudG9wIDogTWF0aC5taW4oY29udGVudFRvcCwgb2Zmc2V0LnRvcCk7XG4gICAgICAgIHZhciBib3R0b20gPSBvZmZzZXQudG9wICsgJHNlY3Rpb24ub3V0ZXJIZWlnaHQoKTtcbiAgICAgICAgY29udGVudEJvdHRvbSA9IGNvbnRlbnRCb3R0b20gPT09IHVuZGVmaW5lZCA/IGJvdHRvbSA6IE1hdGgubWF4KGNvbnRlbnRCb3R0b20sIGJvdHRvbSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIGNvbnRlbnRCb3R0b20gLSBjb250ZW50VG9wO1xufVxuXG4vLyBTY2FucyB0aGUgZ2l2ZW4gZWxlbWVudCwgd2hpY2ggYXBwZWFycyBpbnNpZGUgYW4gYWN0aXZlIHNlY3Rpb24uIFRoZSBlbGVtZW50IGNhbiBiZSB0aGUgZW50aXJlIGFjdGl2ZSBzZWN0aW9uLFxuLy8gc29tZSBjb250YWluZXIgd2l0aGluIHRoZSBhY3RpdmUgc2VjdGlvbiwgb3IgYSBsZWFmIG5vZGUgaW4gdGhlIGFjdGl2ZSBzZWN0aW9uLlxuZnVuY3Rpb24gc2NhbkFjdGl2ZUVsZW1lbnQoJGVsZW1lbnQsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgc2NhbkZvckNvbnRlbnQoJGVsZW1lbnQsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbn1cblxuZnVuY3Rpb24gc2NhbkZvclN1bW1hcmllcygkZWxlbWVudCwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgJHN1bW1hcmllcyA9IGZpbmQoJGVsZW1lbnQsIGdyb3VwU2V0dGluZ3Muc3VtbWFyeVNlbGVjdG9yKCksIHRydWUsIHRydWUpOyAvLyBzdW1tYXJ5IHdpZGdldHMgY2FuIGJlIGluc2lkZSBuby1hbnQgc2VjdGlvbnNcbiAgICAkc3VtbWFyaWVzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkc3VtbWFyeSA9ICQodGhpcyk7XG4gICAgICAgIHZhciBjb250YWluZXJEYXRhID0gUGFnZURhdGEuZ2V0Q29udGFpbmVyRGF0YShwYWdlRGF0YSwgJ3BhZ2UnKTsgLy8gTWFnaWMgaGFzaCBmb3IgcGFnZSByZWFjdGlvbnNcbiAgICAgICAgY29udGFpbmVyRGF0YS50eXBlID0gJ3BhZ2UnOyAvLyBUT0RPOiByZXZpc2l0IHdoZXRoZXIgaXQgbWFrZXMgc2Vuc2UgdG8gc2V0IHRoZSB0eXBlIGhlcmVcbiAgICAgICAgdmFyIGRlZmF1bHRSZWFjdGlvbnMgPSBncm91cFNldHRpbmdzLmRlZmF1bHRSZWFjdGlvbnMoJHN1bW1hcnkpOyAvLyBUT0RPOiBkbyB3ZSBzdXBwb3J0IGN1c3RvbWl6aW5nIHRoZSBkZWZhdWx0IHJlYWN0aW9ucyBhdCB0aGlzIGxldmVsP1xuICAgICAgICB2YXIgc3VtbWFyeVdpZGdldCA9IFN1bW1hcnlXaWRnZXQuY3JlYXRlKGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBkZWZhdWx0UmVhY3Rpb25zLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgdmFyICRzdW1tYXJ5RWxlbWVudCA9IHN1bW1hcnlXaWRnZXQuZWxlbWVudDtcbiAgICAgICAgaW5zZXJ0Q29udGVudCgkc3VtbWFyeSwgJHN1bW1hcnlFbGVtZW50LCBncm91cFNldHRpbmdzLnN1bW1hcnlNZXRob2QoKSk7XG4gICAgICAgIGNyZWF0ZWRXaWRnZXRzLnB1c2goc3VtbWFyeVdpZGdldCk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIHNjYW5Gb3JDYWxsc1RvQWN0aW9uKCRlbGVtZW50LCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBjdGFUYXJnZXRzID0ge307IC8vIFRoZSBlbGVtZW50cyB0aGF0IHRoZSBjYWxsIHRvIGFjdGlvbnMgYWN0IG9uIChlLmcuIHRoZSBpbWFnZSBvciB2aWRlbylcbiAgICBmaW5kKCRlbGVtZW50LCAnW2FudC1pdGVtXScsIHRydWUpLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkY3RhVGFyZ2V0ID0gJCh0aGlzKTtcbiAgICAgICAgJGN0YVRhcmdldC5hZGRDbGFzcygnbm8tYW50Jyk7IC8vIGRvbid0IHNob3cgdGhlIG5vcm1hbCByZWFjdGlvbiBhZmZvcmRhbmNlIG9uIGEgY3RhIHRhcmdldFxuICAgICAgICB2YXIgYW50SXRlbUlkID0gJGN0YVRhcmdldC5hdHRyKCdhbnQtaXRlbScpLnRyaW0oKTtcbiAgICAgICAgY3RhVGFyZ2V0c1thbnRJdGVtSWRdID0gJGN0YVRhcmdldDtcbiAgICB9KTtcblxuICAgIHZhciBjdGFMYWJlbHMgPSB7fTsgLy8gT3B0aW9uYWwgZWxlbWVudHMgdGhhdCByZXBvcnQgdGhlIG51bWJlciBvZiByZWFjdGlvbnMgdG8gdGhlIGN0YSAoZS5nLiBcIjEgcmVhY3Rpb25cIilcbiAgICBmaW5kKCRlbGVtZW50LCAnW2FudC1yZWFjdGlvbnMtbGFiZWwtZm9yXScsIHRydWUpLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkY3RhTGFiZWwgPSAkKHRoaXMpO1xuICAgICAgICAkY3RhTGFiZWwuYWRkQ2xhc3MoJ25vLWFudCcpOyAvLyBkb24ndCBzaG93IHRoZSBub3JtYWwgcmVhY3Rpb24gYWZmb3JkYW5jZSBvbiBhIGN0YSBsYWJlbFxuICAgICAgICB2YXIgYW50SXRlbUlkID0gJGN0YUxhYmVsLmF0dHIoJ2FudC1yZWFjdGlvbnMtbGFiZWwtZm9yJykudHJpbSgpO1xuICAgICAgICBjdGFMYWJlbHNbYW50SXRlbUlkXSA9IGN0YUxhYmVsc1thbnRJdGVtSWRdIHx8IFtdO1xuICAgICAgICBjdGFMYWJlbHNbYW50SXRlbUlkXS5wdXNoKCRjdGFMYWJlbCk7XG4gICAgfSk7XG5cbiAgICB2YXIgY3RhQ291bnRlcnMgPSB7fTsgLy8gT3B0aW9uYWwgZWxlbWVudHMgdGhhdCByZXBvcnQgb25seSB0aGUgY291bnQgb2YgcmVhY3Rpb24gdG8gYSBjdGEgKGUuZy4gXCIxXCIpXG4gICAgZmluZCgkZWxlbWVudCwgJ1thbnQtY291bnRlci1mb3JdJywgdHJ1ZSkuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRjdGFDb3VudGVyID0gJCh0aGlzKTtcbiAgICAgICAgJGN0YUNvdW50ZXIuYWRkQ2xhc3MoJ25vLWFudCcpOyAvLyBkb24ndCBzaG93IHRoZSBub3JtYWwgcmVhY3Rpb24gYWZmb3JkYW5jZSBvbiBhIGN0YSBjb3VudGVyXG4gICAgICAgIHZhciBhbnRJdGVtSWQgPSAkY3RhQ291bnRlci5hdHRyKCdhbnQtY291bnRlci1mb3InKS50cmltKCk7XG4gICAgICAgIGN0YUNvdW50ZXJzW2FudEl0ZW1JZF0gPSBjdGFDb3VudGVyc1thbnRJdGVtSWRdIHx8IFtdO1xuICAgICAgICBjdGFDb3VudGVyc1thbnRJdGVtSWRdLnB1c2goJGN0YUNvdW50ZXIpO1xuICAgIH0pO1xuXG4gICAgdmFyIGN0YUV4cGFuZGVkUmVhY3Rpb25zID0ge307IC8vIE9wdGlvbmFsIGVsZW1lbnRzIHRoYXQgc2hvdyBleHBhbmRlZCByZWFjdGlvbnMgZm9yIHRoZSBjdGEgKGUuZy4gXCJJbnRlcmVzdGluZyAoMTUpIE5vIHRoYW5rcyAoMTApXCIpXG4gICAgZmluZCgkZWxlbWVudCwgJ1thbnQtZXhwYW5kZWQtcmVhY3Rpb25zLWZvcl0nLCB0cnVlKS5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgJGN0YUV4cGFuZGVkUmVhY3Rpb25BcmVhID0gJCh0aGlzKTtcbiAgICAgICAgJGN0YUV4cGFuZGVkUmVhY3Rpb25BcmVhLmFkZENsYXNzKCduby1hbnQnKTsgLy8gZG9uJ3Qgc2hvdyB0aGUgbm9ybWFsIHJlYWN0aW9uIGFmZm9yZGFuY2Ugb24gYSBjdGEgY291bnRlclxuICAgICAgICB2YXIgYW50SXRlbUlkID0gJGN0YUV4cGFuZGVkUmVhY3Rpb25BcmVhLmF0dHIoJ2FudC1leHBhbmRlZC1yZWFjdGlvbnMtZm9yJykudHJpbSgpO1xuICAgICAgICBjdGFFeHBhbmRlZFJlYWN0aW9uc1thbnRJdGVtSWRdID0gY3RhRXhwYW5kZWRSZWFjdGlvbnNbYW50SXRlbUlkXSB8fCBbXTtcbiAgICAgICAgY3RhRXhwYW5kZWRSZWFjdGlvbnNbYW50SXRlbUlkXS5wdXNoKCRjdGFFeHBhbmRlZFJlYWN0aW9uQXJlYSk7XG4gICAgfSk7XG5cbiAgICB2YXIgJGN0YUVsZW1lbnRzID0gZmluZCgkZWxlbWVudCwgJ1thbnQtY3RhLWZvcl0nKTsgLy8gVGhlIGNhbGwgdG8gYWN0aW9uIGVsZW1lbnRzIHdoaWNoIHByb21wdCB0aGUgdXNlciB0byByZWFjdFxuICAgICRjdGFFbGVtZW50cy5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgJGN0YUVsZW1lbnQgPSAkKHRoaXMpO1xuICAgICAgICB2YXIgYW50SXRlbUlkID0gJGN0YUVsZW1lbnQuYXR0cignYW50LWN0YS1mb3InKTtcbiAgICAgICAgdmFyICR0YXJnZXRFbGVtZW50ID0gY3RhVGFyZ2V0c1thbnRJdGVtSWRdO1xuICAgICAgICBpZiAoJHRhcmdldEVsZW1lbnQpIHtcbiAgICAgICAgICAgIHZhciBoYXNoID0gY29tcHV0ZUhhc2goJHRhcmdldEVsZW1lbnQsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgIHZhciBjb250ZW50RGF0YSA9IGNvbXB1dGVDb250ZW50RGF0YSgkdGFyZ2V0RWxlbWVudCwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICBpZiAoaGFzaCAmJiBjb250ZW50RGF0YSkge1xuICAgICAgICAgICAgICAgIHZhciBjb250YWluZXJEYXRhID0gUGFnZURhdGEuZ2V0Q29udGFpbmVyRGF0YShwYWdlRGF0YSwgaGFzaCk7XG4gICAgICAgICAgICAgICAgY29udGFpbmVyRGF0YS50eXBlID0gY29tcHV0ZUVsZW1lbnRUeXBlKCR0YXJnZXRFbGVtZW50KTsgLy8gVE9ETzogcmV2aXNpdCB3aGV0aGVyIGl0IG1ha2VzIHNlbnNlIHRvIHNldCB0aGUgdHlwZSBoZXJlXG4gICAgICAgICAgICAgICAgdmFyIGNhbGxUb0FjdGlvbiA9IENhbGxUb0FjdGlvbkluZGljYXRvci5jcmVhdGUoe1xuICAgICAgICAgICAgICAgICAgICBjb250YWluZXJEYXRhOiBjb250YWluZXJEYXRhLFxuICAgICAgICAgICAgICAgICAgICBjb250YWluZXJFbGVtZW50OiAkdGFyZ2V0RWxlbWVudCxcbiAgICAgICAgICAgICAgICAgICAgY29udGVudERhdGE6IGNvbnRlbnREYXRhLFxuICAgICAgICAgICAgICAgICAgICBjdGFFbGVtZW50OiAkY3RhRWxlbWVudCxcbiAgICAgICAgICAgICAgICAgICAgY3RhTGFiZWxzOiBjdGFMYWJlbHNbYW50SXRlbUlkXSxcbiAgICAgICAgICAgICAgICAgICAgY3RhQ291bnRlcnM6IGN0YUNvdW50ZXJzW2FudEl0ZW1JZF0sXG4gICAgICAgICAgICAgICAgICAgIGN0YUV4cGFuZGVkUmVhY3Rpb25zOiBjdGFFeHBhbmRlZFJlYWN0aW9uc1thbnRJdGVtSWRdLFxuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0UmVhY3Rpb25zOiBncm91cFNldHRpbmdzLmRlZmF1bHRSZWFjdGlvbnMoJHRhcmdldEVsZW1lbnQpLFxuICAgICAgICAgICAgICAgICAgICBwYWdlRGF0YTogcGFnZURhdGEsXG4gICAgICAgICAgICAgICAgICAgIGdyb3VwU2V0dGluZ3M6IGdyb3VwU2V0dGluZ3NcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjcmVhdGVkV2lkZ2V0cy5wdXNoKGNhbGxUb0FjdGlvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KVxufVxuXG5mdW5jdGlvbiBjcmVhdGVBdXRvQ2FsbHNUb0FjdGlvbigkc2VjdGlvbiwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgJGN0YVRhcmdldHMgPSBmaW5kKCRzZWN0aW9uLCBncm91cFNldHRpbmdzLmdlbmVyYXRlZEN0YVNlbGVjdG9yKCkpO1xuICAgICRjdGFUYXJnZXRzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkY3RhVGFyZ2V0ID0gJCh0aGlzKTtcbiAgICAgICAgdmFyIGFudEl0ZW1JZCA9IGdlbmVyYXRlQW50SXRlbUF0dHJpYnV0ZSgpO1xuICAgICAgICAkY3RhVGFyZ2V0LmF0dHIoJ2FudC1pdGVtJywgYW50SXRlbUlkKTtcbiAgICAgICAgdmFyIGF1dG9DdGEgPSBBdXRvQ2FsbFRvQWN0aW9uLmNyZWF0ZShhbnRJdGVtSWQsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgJGN0YVRhcmdldC5hZnRlcihhdXRvQ3RhLmVsZW1lbnQpOyAvLyBUT0RPOiBtYWtlIHRoZSBpbnNlcnQgYmVoYXZpb3IgY29uZmlndXJhYmxlIGxpa2UgdGhlIHN1bW1hcnlcbiAgICAgICAgY3JlYXRlZFdpZGdldHMucHVzaChhdXRvQ3RhKTtcbiAgICB9KTtcbn1cblxudmFyIGdlbmVyYXRlQW50SXRlbUF0dHJpYnV0ZSA9IGZ1bmN0aW9uKGluZGV4KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gJ2FudGVubmFfYXV0b19jdGFfJyArIGluZGV4Kys7XG4gICAgfVxufSgwKTtcblxuZnVuY3Rpb24gc2NhbkZvckNvbnRlbnQoJGVsZW1lbnQsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyICRjb250ZW50RWxlbWVudHMgPSBmaW5kKCRlbGVtZW50LCBncm91cFNldHRpbmdzLmNvbnRlbnRTZWxlY3RvcigpLCB0cnVlKTtcbiAgICAkY29udGVudEVsZW1lbnRzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkY29udGVudEVsZW1lbnQgPSAkKHRoaXMpO1xuICAgICAgICB2YXIgdHlwZSA9IGNvbXB1dGVFbGVtZW50VHlwZSgkY29udGVudEVsZW1lbnQpO1xuICAgICAgICBzd2l0Y2godHlwZSkge1xuICAgICAgICAgICAgY2FzZSBUWVBFX0lNQUdFOlxuICAgICAgICAgICAgY2FzZSBUWVBFX01FRElBOlxuICAgICAgICAgICAgICAgIHNjYW5NZWRpYSgkY29udGVudEVsZW1lbnQsIHR5cGUsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgVFlQRV9URVhUOlxuICAgICAgICAgICAgICAgIHNjYW5UZXh0KCRjb250ZW50RWxlbWVudCwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIHNjYW5UZXh0KCR0ZXh0RWxlbWVudCwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICBpZiAoc2hvdWxkSGFzaFRleHQoJHRleHRFbGVtZW50LCBncm91cFNldHRpbmdzKSkge1xuICAgICAgICB2YXIgaGFzaCA9IGNvbXB1dGVIYXNoKCR0ZXh0RWxlbWVudCwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICBpZiAoaGFzaCkge1xuICAgICAgICAgICAgdmFyIGNvbnRhaW5lckRhdGEgPSBQYWdlRGF0YS5nZXRDb250YWluZXJEYXRhKHBhZ2VEYXRhLCBoYXNoKTtcbiAgICAgICAgICAgIGNvbnRhaW5lckRhdGEudHlwZSA9ICd0ZXh0JzsgLy8gVE9ETzogcmV2aXNpdCB3aGV0aGVyIGl0IG1ha2VzIHNlbnNlIHRvIHNldCB0aGUgdHlwZSBoZXJlXG4gICAgICAgICAgICB2YXIgZGVmYXVsdFJlYWN0aW9ucyA9IGdyb3VwU2V0dGluZ3MuZGVmYXVsdFJlYWN0aW9ucygkdGV4dEVsZW1lbnQpO1xuICAgICAgICAgICAgdmFyIHRleHRJbmRpY2F0b3IgPSBUZXh0SW5kaWNhdG9yV2lkZ2V0LmNyZWF0ZSh7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lckRhdGE6IGNvbnRhaW5lckRhdGEsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lckVsZW1lbnQ6ICR0ZXh0RWxlbWVudCxcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdFJlYWN0aW9uczogZGVmYXVsdFJlYWN0aW9ucyxcbiAgICAgICAgICAgICAgICAgICAgcGFnZURhdGE6IHBhZ2VEYXRhLFxuICAgICAgICAgICAgICAgICAgICBncm91cFNldHRpbmdzOiBncm91cFNldHRpbmdzXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHZhciAkaW5kaWNhdG9yRWxlbWVudCA9IHRleHRJbmRpY2F0b3IuZWxlbWVudDtcbiAgICAgICAgICAgIHZhciBsYXN0Tm9kZSA9IGxhc3RDb250ZW50Tm9kZSgkdGV4dEVsZW1lbnQuZ2V0KDApKTtcbiAgICAgICAgICAgIGlmIChsYXN0Tm9kZS5ub2RlVHlwZSAhPT0gMykge1xuICAgICAgICAgICAgICAgICQobGFzdE5vZGUpLmJlZm9yZSgkaW5kaWNhdG9yRWxlbWVudCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICR0ZXh0RWxlbWVudC5hcHBlbmQoJGluZGljYXRvckVsZW1lbnQpOyAvLyBUT0RPIGlzIHRoaXMgY29uZmlndXJhYmxlIGFsYSBpbnNlcnRDb250ZW50KC4uLik/XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjcmVhdGVkV2lkZ2V0cy5wdXNoKHRleHRJbmRpY2F0b3IpO1xuXG4gICAgICAgICAgICB2YXIgdGV4dFJlYWN0aW9ucyA9IFRleHRSZWFjdGlvbnMuY3JlYXRlUmVhY3RhYmxlVGV4dCh7XG4gICAgICAgICAgICAgICAgY29udGFpbmVyRGF0YTogY29udGFpbmVyRGF0YSxcbiAgICAgICAgICAgICAgICBjb250YWluZXJFbGVtZW50OiAkdGV4dEVsZW1lbnQsXG4gICAgICAgICAgICAgICAgZGVmYXVsdFJlYWN0aW9uczogZGVmYXVsdFJlYWN0aW9ucyxcbiAgICAgICAgICAgICAgICBwYWdlRGF0YTogcGFnZURhdGEsXG4gICAgICAgICAgICAgICAgZ3JvdXBTZXR0aW5nczogZ3JvdXBTZXR0aW5ncyxcbiAgICAgICAgICAgICAgICBleGNsdWRlTm9kZTogJGluZGljYXRvckVsZW1lbnQuZ2V0KDApXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNyZWF0ZWRXaWRnZXRzLnB1c2godGV4dFJlYWN0aW9ucyk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8vIFdlIHVzZSB0aGlzIHRvIGhhbmRsZSB0aGUgc2ltcGxlIGNhc2Ugb2YgdGV4dCBjb250ZW50IHRoYXQgZW5kcyB3aXRoIHNvbWUgbWVkaWEgYXMgaW5cbi8vIDxwPk15IHRleHQuIDxpbWcgc3JjPVwid2hhdGV2ZXJcIj48L3A+LlxuLy8gVGhpcyBpcyBhIHNpbXBsaXN0aWMgYWxnb3JpdGhtLCBub3QgYSBnZW5lcmFsIHNvbHV0aW9uOlxuLy8gV2Ugd2FsayB0aGUgRE9NIGluc2lkZSB0aGUgZ2l2ZW4gbm9kZSBhbmQga2VlcCB0cmFjayBvZiB0aGUgbGFzdCBcImNvbnRlbnRcIiBub2RlIHRoYXQgd2UgZW5jb3VudGVyLCB3aGljaCBjb3VsZCBiZSBlaXRoZXJcbi8vIHRleHQgb3Igc29tZSBtZWRpYS4gIElmIHRoZSBsYXN0IGNvbnRlbnQgbm9kZSBpcyBub3QgdGV4dCwgd2Ugd2FudCB0byBpbnNlcnQgdGhlIHRleHQgaW5kaWNhdG9yIGJlZm9yZSB0aGUgbWVkaWEuXG5mdW5jdGlvbiBsYXN0Q29udGVudE5vZGUobm9kZSkge1xuICAgIHZhciBsYXN0Tm9kZTtcbiAgICB2YXIgY2hpbGROb2RlcyA9IG5vZGUuY2hpbGROb2RlcztcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkTm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGNoaWxkID0gY2hpbGROb2Rlc1tpXTtcbiAgICAgICAgaWYgKGNoaWxkLm5vZGVUeXBlID09PSAzKSB7XG4gICAgICAgICAgICBsYXN0Tm9kZSA9IGNoaWxkO1xuICAgICAgICB9IGVsc2UgaWYgKGNoaWxkLm5vZGVUeXBlID09PSAxKSB7XG4gICAgICAgICAgICB2YXIgdGFnTmFtZSA9IGNoaWxkLnRhZ05hbWUudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgIHN3aXRjaCAodGFnTmFtZSkge1xuICAgICAgICAgICAgICAgIGNhc2UgJ2ltZyc6XG4gICAgICAgICAgICAgICAgY2FzZSAnaWZyYW1lJzpcbiAgICAgICAgICAgICAgICBjYXNlICd2aWRlbyc6XG4gICAgICAgICAgICAgICAgY2FzZSAnaWZyYW1lJzpcbiAgICAgICAgICAgICAgICAgICAgbGFzdE5vZGUgPSBjaGlsZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBsYXN0Tm9kZSA9IGxhc3RDb250ZW50Tm9kZShjaGlsZCkgfHwgbGFzdE5vZGU7XG4gICAgfVxuICAgIHJldHVybiBsYXN0Tm9kZTtcbn1cblxuZnVuY3Rpb24gc2hvdWxkSGFzaFRleHQoJHRleHRFbGVtZW50LCBncm91cFNldHRpbmdzKSB7XG4gICAgaWYgKChpc0N0YSgkdGV4dEVsZW1lbnQsIGdyb3VwU2V0dGluZ3MpKSkge1xuICAgICAgICAvLyBEb24ndCBoYXNoIHRoZSB0ZXh0IGlmIGl0IGlzIHRoZSB0YXJnZXQgb2YgYSBDVEEuXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgLy8gRG9uJ3QgY3JlYXRlIGFuIGluZGljYXRvciBmb3IgdGV4dCBlbGVtZW50cyB0aGF0IGNvbnRhaW4gb3RoZXIgdGV4dCBub2Rlcy5cbiAgICB2YXIgJG5lc3RlZEVsZW1lbnRzID0gZmluZCgkdGV4dEVsZW1lbnQsIGdyb3VwU2V0dGluZ3MuY29udGVudFNlbGVjdG9yKCkpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgJG5lc3RlZEVsZW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmICgoY29tcHV0ZUVsZW1lbnRUeXBlKCQoJG5lc3RlZEVsZW1lbnRzW2ldKSkgPT09IFRZUEVfVEVYVCkpIHtcbiAgICAgICAgICAgIC8vIERvbid0IGhhc2ggYSB0ZXh0IGVsZW1lbnQgaWYgaXQgY29udGFpbnMgYW55IG90aGVyIG1hdGNoZWQgdGV4dCBlbGVtZW50c1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiBpc0N0YSgkZWxlbWVudCwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBjb21wb3NpdGVTZWxlY3RvciA9IGdyb3VwU2V0dGluZ3MuZ2VuZXJhdGVkQ3RhU2VsZWN0b3IoKSArICcsW2FudC1pdGVtXSc7XG4gICAgcmV0dXJuICRlbGVtZW50LmlzKGNvbXBvc2l0ZVNlbGVjdG9yKTtcbn1cblxuLy8gVGhlIFwiaW1hZ2VcIiBhbmQgXCJtZWRpYVwiIHBhdGhzIGNvbnZlcmdlIGhlcmUsIGJlY2F1c2Ugd2UgdXNlIHRoZSBzYW1lIGluZGljYXRvciBtb2R1bGUgZm9yIHRoZW0gYm90aC5cbmZ1bmN0aW9uIHNjYW5NZWRpYSgkbWVkaWFFbGVtZW50LCB0eXBlLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBpbmRpY2F0b3I7XG4gICAgdmFyIGNvbnRlbnREYXRhID0gY29tcHV0ZUNvbnRlbnREYXRhKCRtZWRpYUVsZW1lbnQsIGdyb3VwU2V0dGluZ3MpO1xuICAgIGlmIChjb250ZW50RGF0YSAmJiBjb250ZW50RGF0YS5kaW1lbnNpb25zKSB7XG4gICAgICAgIGlmIChjb250ZW50RGF0YS5kaW1lbnNpb25zLmhlaWdodCA+PSAxMDAgJiYgY29udGVudERhdGEuZGltZW5zaW9ucy53aWR0aCA+PSAxMDApIHsgLy8gRG9uJ3QgY3JlYXRlIGluZGljYXRvciBvbiBlbGVtZW50cyB0aGF0IGFyZSB0b28gc21hbGxcbiAgICAgICAgICAgIHZhciBoYXNoID0gY29tcHV0ZUhhc2goJG1lZGlhRWxlbWVudCwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgaWYgKGhhc2gpIHtcbiAgICAgICAgICAgICAgICB2YXIgY29udGFpbmVyRGF0YSA9IFBhZ2VEYXRhLmdldENvbnRhaW5lckRhdGEocGFnZURhdGEsIGhhc2gpO1xuICAgICAgICAgICAgICAgIGNvbnRhaW5lckRhdGEudHlwZSA9IHR5cGUgPT09IFRZUEVfSU1BR0UgPyAnaW1hZ2UnIDogJ21lZGlhJztcbiAgICAgICAgICAgICAgICB2YXIgZGVmYXVsdFJlYWN0aW9ucyA9IGdyb3VwU2V0dGluZ3MuZGVmYXVsdFJlYWN0aW9ucygkbWVkaWFFbGVtZW50KTtcbiAgICAgICAgICAgICAgICBpbmRpY2F0b3IgPSBNZWRpYUluZGljYXRvcldpZGdldC5jcmVhdGUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudDogV2lkZ2V0QnVja2V0LmdldCgpLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyRGF0YTogY29udGFpbmVyRGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnREYXRhOiBjb250ZW50RGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lckVsZW1lbnQ6ICRtZWRpYUVsZW1lbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0UmVhY3Rpb25zOiBkZWZhdWx0UmVhY3Rpb25zLFxuICAgICAgICAgICAgICAgICAgICAgICAgcGFnZURhdGE6IHBhZ2VEYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgZ3JvdXBTZXR0aW5nczogZ3JvdXBTZXR0aW5nc1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBjcmVhdGVkV2lkZ2V0cy5wdXNoKGluZGljYXRvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgLy8gTGlzdGVuIGZvciBjaGFuZ2VzIHRvIHRoZSBpbWFnZSBhdHRyaWJ1dGVzIHdoaWNoIGNvdWxkIGluZGljYXRlIGNvbnRlbnQgY2hhbmdlcy5cbiAgICBNdXRhdGlvbk9ic2VydmVyLmFkZE9uZVRpbWVBdHRyaWJ1dGVMaXN0ZW5lcigkbWVkaWFFbGVtZW50LmdldCgwKSwgWydzcmMnLCdhbnQtaXRlbS1jb250ZW50JywnZGF0YSddLCBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKGluZGljYXRvcikge1xuICAgICAgICAgICAgLy8gVE9ETzogdXBkYXRlIEhhc2hlZEVsZW1lbnRzIHRvIHJlbW92ZSB0aGUgcHJldmlvdXMgaGFzaC0+ZWxlbWVudCBtYXBwaW5nLiBDb25zaWRlciB0aGVyZSBjb3VsZCBiZSBtdWx0aXBsZVxuICAgICAgICAgICAgLy8gICAgICAgaW5zdGFuY2VzIG9mIHRoZSBzYW1lIGVsZW1lbnQgb24gYSBwYWdlLi4uIHNvIHdlIG1pZ2h0IG5lZWQgdG8gdXNlIGEgY291bnRlci5cbiAgICAgICAgICAgIGluZGljYXRvci50ZWFyZG93bigpO1xuICAgICAgICB9XG4gICAgICAgIHNjYW5NZWRpYSgkbWVkaWFFbGVtZW50LCB0eXBlLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGZpbmQoJGVsZW1lbnQsIHNlbGVjdG9yLCBhZGRCYWNrLCBpZ25vcmVOb0FudCkge1xuICAgIHZhciByZXN1bHQgPSAkZWxlbWVudC5maW5kKHNlbGVjdG9yKTtcbiAgICBpZiAoYWRkQmFjayAmJiBzZWxlY3RvcikgeyAvLyB3aXRoIGFuIHVuZGVmaW5lZCBzZWxlY3RvciwgYWRkQmFjayB3aWxsIG1hdGNoIGFuZCBhbHdheXMgcmV0dXJuIHRoZSBpbnB1dCBlbGVtZW50ICh1bmxpa2UgZmluZCgpIHdoaWNoIHJldHVybnMgYW4gZW1wdHkgbWF0Y2gpXG4gICAgICAgIHJlc3VsdCA9IHJlc3VsdC5hZGRCYWNrKHNlbGVjdG9yKTtcbiAgICB9XG4gICAgaWYgKGlnbm9yZU5vQW50KSB7IC8vIFNvbWUgcGllY2VzIG9mIGNvbnRlbnQgKGUuZy4gdGhlIHN1bW1hcnkgd2lkZ2V0KSBjYW4gYWN0dWFsbHkgZ28gaW5zaWRlIHNlY3Rpb25zIHRhZ2dlZCBuby1hbnRcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdC5maWx0ZXIoZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiAkKHRoaXMpLmNsb3Nlc3QoJy5uby1hbnQnKS5sZW5ndGggPT0gMDtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gaW5zZXJ0Q29udGVudCgkcGFyZW50LCBjb250ZW50LCBtZXRob2QpIHtcbiAgICBzd2l0Y2ggKG1ldGhvZCkge1xuICAgICAgICBjYXNlICdhcHBlbmQnOlxuICAgICAgICAgICAgJHBhcmVudC5hcHBlbmQoY29udGVudCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAncHJlcGVuZCc6XG4gICAgICAgICAgICAkcGFyZW50LnByZXBlbmQoY29udGVudCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnYmVmb3JlJzpcbiAgICAgICAgICAgICRwYXJlbnQuYmVmb3JlKGNvbnRlbnQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2FmdGVyJzpcbiAgICAgICAgICAgICRwYXJlbnQuYWZ0ZXIoY29udGVudCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVIYXNoKCRlbGVtZW50LCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBoYXNoO1xuICAgIHN3aXRjaCAoY29tcHV0ZUVsZW1lbnRUeXBlKCRlbGVtZW50KSkge1xuICAgICAgICBjYXNlIFRZUEVfSU1BR0U6XG4gICAgICAgICAgICB2YXIgaW1hZ2VVcmwgPSBVUkxzLmNvbXB1dGVJbWFnZVVybCgkZWxlbWVudCwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICBoYXNoID0gSGFzaC5oYXNoSW1hZ2UoaW1hZ2VVcmwsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgVFlQRV9NRURJQTpcbiAgICAgICAgICAgIHZhciBtZWRpYVVybCA9IFVSTHMuY29tcHV0ZU1lZGlhVXJsKCRlbGVtZW50LCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgIGhhc2ggPSBIYXNoLmhhc2hNZWRpYShtZWRpYVVybCwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBUWVBFX1RFWFQ6XG4gICAgICAgICAgICBoYXNoID0gSGFzaC5oYXNoVGV4dCgkZWxlbWVudCk7XG4gICAgICAgICAgICB2YXIgaW5jcmVtZW50ID0gMTtcbiAgICAgICAgICAgIHdoaWxlIChoYXNoICYmIEhhc2hlZEVsZW1lbnRzLmdldEVsZW1lbnQoaGFzaCwgcGFnZURhdGEucGFnZUhhc2gpKSB7XG4gICAgICAgICAgICAgICAgaGFzaCA9IEhhc2guaGFzaFRleHQoJGVsZW1lbnQsIGluY3JlbWVudCsrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBpZiAoaGFzaCkge1xuICAgICAgICBIYXNoZWRFbGVtZW50cy5zZXRFbGVtZW50KGhhc2gsIHBhZ2VEYXRhLnBhZ2VIYXNoLCAkZWxlbWVudCk7IC8vIFJlY29yZCB0aGUgcmVsYXRpb25zaGlwIGJldHdlZW4gdGhlIGhhc2ggYW5kIGRvbSBlbGVtZW50LlxuICAgICAgICBpZiAoQXBwTW9kZS5kZWJ1Zykge1xuICAgICAgICAgICAgJGVsZW1lbnQuYXR0cihBVFRSX0hBU0gsIGhhc2gpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBoYXNoO1xufVxuXG5mdW5jdGlvbiBjb21wdXRlQ29udGVudERhdGEoJGVsZW1lbnQsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgY29udGVudERhdGE7XG4gICAgc3dpdGNoIChjb21wdXRlRWxlbWVudFR5cGUoJGVsZW1lbnQpKSB7XG4gICAgICAgIGNhc2UgVFlQRV9JTUFHRTpcbiAgICAgICAgICAgIHZhciBpbWFnZVVybCA9IFVSTHMuY29tcHV0ZUltYWdlVXJsKCRlbGVtZW50LCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgIHZhciBpbWFnZURpbWVuc2lvbnMgPSB7XG4gICAgICAgICAgICAgICAgaGVpZ2h0OiBwYXJzZUludCgkZWxlbWVudC5hdHRyKCdoZWlnaHQnKSkgfHwgJGVsZW1lbnQuaGVpZ2h0KCkgfHwgMCxcbiAgICAgICAgICAgICAgICB3aWR0aDogcGFyc2VJbnQoJGVsZW1lbnQuYXR0cignd2lkdGgnKSkgfHwgJGVsZW1lbnQud2lkdGgoKSB8fCAwXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgY29udGVudERhdGEgPSB7XG4gICAgICAgICAgICAgICAgdHlwZTogJ2ltZycsXG4gICAgICAgICAgICAgICAgYm9keTogaW1hZ2VVcmwsXG4gICAgICAgICAgICAgICAgZGltZW5zaW9uczogaW1hZ2VEaW1lbnNpb25zXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgVFlQRV9NRURJQTpcbiAgICAgICAgICAgIHZhciBtZWRpYVVybCA9IFVSTHMuY29tcHV0ZU1lZGlhVXJsKCRlbGVtZW50LCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgIHZhciBtZWRpYURpbWVuc2lvbnMgPSB7XG4gICAgICAgICAgICAgICAgaGVpZ2h0OiBwYXJzZUludCgkZWxlbWVudC5hdHRyKCdoZWlnaHQnKSkgfHwgJGVsZW1lbnQuaGVpZ2h0KCkgfHwgMCxcbiAgICAgICAgICAgICAgICB3aWR0aDogcGFyc2VJbnQoJGVsZW1lbnQuYXR0cignd2lkdGgnKSkgfHwgJGVsZW1lbnQud2lkdGgoKSB8fCAwXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgY29udGVudERhdGEgPSB7XG4gICAgICAgICAgICAgICAgdHlwZTogJ21lZGlhJyxcbiAgICAgICAgICAgICAgICBib2R5OiBtZWRpYVVybCxcbiAgICAgICAgICAgICAgICBkaW1lbnNpb25zOiBtZWRpYURpbWVuc2lvbnNcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBUWVBFX1RFWFQ6XG4gICAgICAgICAgICBjb250ZW50RGF0YSA9IHsgdHlwZTogJ3RleHQnIH07XG4gICAgICAgICAgICBicmVhaztcbiAgICB9XG4gICAgcmV0dXJuIGNvbnRlbnREYXRhO1xufVxuXG5mdW5jdGlvbiBjb21wdXRlRWxlbWVudFR5cGUoJGVsZW1lbnQpIHtcbiAgICB2YXIgaXRlbVR5cGUgPSAkZWxlbWVudC5hdHRyKCdhbnQtaXRlbS10eXBlJyk7XG4gICAgaWYgKGl0ZW1UeXBlICYmIGl0ZW1UeXBlLnRyaW0oKS5sZW5ndGggPiAwKSB7XG4gICAgICAgIHJldHVybiBpdGVtVHlwZS50cmltKCk7XG4gICAgfVxuICAgIHZhciB0YWdOYW1lID0gJGVsZW1lbnQucHJvcCgndGFnTmFtZScpLnRvTG93ZXJDYXNlKCk7XG4gICAgc3dpdGNoICh0YWdOYW1lKSB7XG4gICAgICAgIGNhc2UgJ2ltZyc6XG4gICAgICAgICAgICByZXR1cm4gVFlQRV9JTUFHRTtcbiAgICAgICAgY2FzZSAndmlkZW8nOlxuICAgICAgICBjYXNlICdpZnJhbWUnOlxuICAgICAgICBjYXNlICdlbWJlZCc6XG4gICAgICAgICAgICByZXR1cm4gVFlQRV9NRURJQTtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHJldHVybiBUWVBFX1RFWFQ7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBzZXR1cE11dGF0aW9uT2JzZXJ2ZXIoZ3JvdXBTZXR0aW5ncykge1xuICAgIE11dGF0aW9uT2JzZXJ2ZXIuYWRkQWRkaXRpb25MaXN0ZW5lcihlbGVtZW50c0FkZGVkKTtcblxuICAgIGZ1bmN0aW9uIGVsZW1lbnRzQWRkZWQoJGVsZW1lbnRzKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgJGVsZW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgJGVsZW1lbnQgPSAkZWxlbWVudHNbaV07XG4gICAgICAgICAgICAkZWxlbWVudC5maW5kKGdyb3VwU2V0dGluZ3MuZXhjbHVzaW9uU2VsZWN0b3IoKSkuYWRkQmFjayhncm91cFNldHRpbmdzLmV4Y2x1c2lvblNlbGVjdG9yKCkpLmFkZENsYXNzKCduby1hbnQnKTsgLy8gQWRkIHRoZSBuby1hbnQgY2xhc3MgdG8gZXZlcnl0aGluZyB0aGF0IGlzIGZsYWdnZWQgZm9yIGV4Y2x1c2lvblxuICAgICAgICAgICAgaWYgKCRlbGVtZW50LmNsb3Nlc3QoJy5uby1hbnQnKS5sZW5ndGggPT09IDApIHsgLy8gSWdub3JlIGFueXRoaW5nIHRhZ2dlZCBuby1hbnRcbiAgICAgICAgICAgICAgICAvLyBGaXJzdCwgc2VlIGlmIGFueSBlbnRpcmUgcGFnZXMgd2VyZSBhZGRlZFxuICAgICAgICAgICAgICAgIHZhciAkcGFnZXMgPSBmaW5kKCRlbGVtZW50LCBncm91cFNldHRpbmdzLnBhZ2VTZWxlY3RvcigpLCB0cnVlKTtcbiAgICAgICAgICAgICAgICBpZiAoJHBhZ2VzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgUGFnZURhdGFMb2FkZXIucGFnZXNBZGRlZCgkcGFnZXMsIGdyb3VwU2V0dGluZ3MpOyAvLyBUT0RPOiBjb25zaWRlciBpZiB0aGVyZSdzIGEgYmV0dGVyIHdheSB0byBhcmNoaXRlY3QgdGhpc1xuICAgICAgICAgICAgICAgICAgICAkcGFnZXMuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzY2FuUGFnZSgkKHRoaXMpLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gSWYgbm90IGFuIGVudGlyZSBwYWdlL3BhZ2VzLCBzZWUgaWYgY29udGVudCB3YXMgYWRkZWQgdG8gYW4gZXhpc3RpbmcgcGFnZVxuICAgICAgICAgICAgICAgICAgICB2YXIgJHBhZ2UgPSAkZWxlbWVudC5jbG9zZXN0KGdyb3VwU2V0dGluZ3MucGFnZVNlbGVjdG9yKCkpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoJHBhZ2UubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkcGFnZSA9ICQoJ2JvZHknKTsgLy8gVE9ETzogaXMgdGhpcyByaWdodD8ga2VlcCBpbiBzeW5jIHdpdGggc2NhbkFsbFBhZ2VzXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdmFyIHVybCA9IFBhZ2VVdGlscy5jb21wdXRlUGFnZVVybCgkcGFnZSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwYWdlRGF0YSA9IFBhZ2VEYXRhLmdldFBhZ2VEYXRhQnlVUkwodXJsKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gRmlyc3QsIGNoZWNrIGZvciBhbnkgbmV3IHN1bW1hcnkgd2lkZ2V0cy4uLlxuICAgICAgICAgICAgICAgICAgICBzY2FuRm9yU3VtbWFyaWVzKCRlbGVtZW50LCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICAgICAgICAgIC8vIE5leHQsIHNlZSBpZiBhbnkgZW50aXJlIGFjdGl2ZSBzZWN0aW9ucyB3ZXJlIGFkZGVkXG4gICAgICAgICAgICAgICAgICAgIHZhciAkYWN0aXZlU2VjdGlvbnMgPSBmaW5kKCRlbGVtZW50LCBncm91cFNldHRpbmdzLmFjdGl2ZVNlY3Rpb25zKCkpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoJGFjdGl2ZVNlY3Rpb25zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRhY3RpdmVTZWN0aW9ucy5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjcmVhdGVBdXRvQ2FsbHNUb0FjdGlvbigkKHRoaXMpLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRhY3RpdmVTZWN0aW9ucy5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgJHNlY3Rpb24gPSAkKHRoaXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjYW5BY3RpdmVFbGVtZW50KCRzZWN0aW9uLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZpbmFsbHksIHNjYW4gaW5zaWRlIHRoZSBlbGVtZW50IGZvciBjb250ZW50XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgJGFjdGl2ZVNlY3Rpb24gPSAkZWxlbWVudC5jbG9zZXN0KGdyb3VwU2V0dGluZ3MuYWN0aXZlU2VjdGlvbnMoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoJGFjdGl2ZVNlY3Rpb24ubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNyZWF0ZUF1dG9DYWxsc1RvQWN0aW9uKCRlbGVtZW50LCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NhbkFjdGl2ZUVsZW1lbnQoJGVsZW1lbnQsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGhlIGVsZW1lbnQgaXMgYWRkZWQgb3V0c2lkZSBhbiBhY3RpdmUgc2VjdGlvbiwganVzdCBjaGVjayBpdCBmb3IgQ1RBc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjYW5Gb3JDYWxsc1RvQWN0aW9uKCRlbGVtZW50LCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIHRlYXJkb3duKCkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY3JlYXRlZFdpZGdldHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY3JlYXRlZFdpZGdldHNbaV0udGVhcmRvd24oKTtcbiAgICB9XG4gICAgY3JlYXRlZFdpZGdldHMgPSBbXTtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHNjYW46IHNjYW5BbGxQYWdlcyxcbiAgICB0ZWFyZG93bjogdGVhcmRvd25cbn07IiwidmFyIFJhY3RpdmU7IHJlcXVpcmUoJy4vdXRpbHMvcmFjdGl2ZS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihsb2FkZWRSYWN0aXZlKSB7IFJhY3RpdmUgPSBsb2FkZWRSYWN0aXZlO30pO1xudmFyIFNWR3MgPSByZXF1aXJlKCcuL3N2Z3MnKTtcblxudmFyIHBhZ2VTZWxlY3RvciA9ICcuYW50ZW5uYS1wZW5kaW5nLXBhZ2UnO1xuXG5mdW5jdGlvbiBjcmVhdGVQYWdlKHJlYWN0aW9uVGV4dCwgZWxlbWVudCkge1xuICAgIHZhciByYWN0aXZlID0gUmFjdGl2ZSh7XG4gICAgICAgIGVsOiBlbGVtZW50LFxuICAgICAgICBhcHBlbmQ6IHRydWUsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIHRleHQ6IHJlYWN0aW9uVGV4dFxuICAgICAgICB9LFxuICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL3BlbmRpbmctcmVhY3Rpb24tcGFnZS5oYnMuaHRtbCcpLFxuICAgICAgICBwYXJ0aWFsczoge1xuICAgICAgICAgICAgbGVmdDogU1ZHcy5sZWZ0XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4ge1xuICAgICAgICBzZWxlY3RvcjogcGFnZVNlbGVjdG9yLFxuICAgICAgICB0ZWFyZG93bjogZnVuY3Rpb24oKSB7IHJhY3RpdmUudGVhcmRvd24oKTsgfVxuICAgIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZVBhZ2U6IGNyZWF0ZVBhZ2Vcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgUmFjdGl2ZTsgcmVxdWlyZSgnLi91dGlscy9yYWN0aXZlLXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGxvYWRlZFJhY3RpdmUpIHsgUmFjdGl2ZSA9IGxvYWRlZFJhY3RpdmU7fSk7XG52YXIgV2lkZ2V0QnVja2V0ID0gcmVxdWlyZSgnLi91dGlscy93aWRnZXQtYnVja2V0Jyk7XG52YXIgVHJhbnNpdGlvblV0aWwgPSByZXF1aXJlKCcuL3V0aWxzL3RyYW5zaXRpb24tdXRpbCcpO1xuXG52YXIgU1ZHcyA9IHJlcXVpcmUoJy4vc3ZncycpO1xuXG52YXIgcmFjdGl2ZTtcbnZhciBjbGlja0hhbmRsZXI7XG5cblxuZnVuY3Rpb24gZ2V0Um9vdEVsZW1lbnQoKSB7XG4gICAgLy8gVE9ETyByZXZpc2l0IHRoaXMsIGl0J3Mga2luZCBvZiBnb29meSBhbmQgaXQgbWlnaHQgaGF2ZSBhIHRpbWluZyBwcm9ibGVtXG4gICAgaWYgKCFyYWN0aXZlKSB7XG4gICAgICAgIHZhciBidWNrZXQgPSBXaWRnZXRCdWNrZXQuZ2V0KCk7XG4gICAgICAgIHJhY3RpdmUgPSBSYWN0aXZlKHtcbiAgICAgICAgICAgIGVsOiBidWNrZXQsXG4gICAgICAgICAgICBhcHBlbmQ6IHRydWUsXG4gICAgICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL3BvcHVwLXdpZGdldC5oYnMuaHRtbCcpLFxuICAgICAgICAgICAgcGFydGlhbHM6IHtcbiAgICAgICAgICAgICAgICBsb2dvOiBTVkdzLmxvZ29cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHZhciAkZWxlbWVudCA9ICQocmFjdGl2ZS5maW5kKCcuYW50ZW5uYS1wb3B1cCcpKTtcbiAgICAgICAgJGVsZW1lbnQub24oJ21vdXNlZG93bicsIGZhbHNlKTsgLy8gUHJldmVudCBtb3VzZWRvd24gZnJvbSBwcm9wYWdhdGluZywgc28gdGhlIGJyb3dzZXIgZG9lc24ndCBjbGVhciB0aGUgdGV4dCBzZWxlY3Rpb24uXG4gICAgICAgICRlbGVtZW50Lm9uKCdjbGljay5hbnRlbm5hLXBvcHVwJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIGhpZGVQb3B1cCgkZWxlbWVudCk7XG4gICAgICAgICAgICBpZiAoY2xpY2tIYW5kbGVyKSB7XG4gICAgICAgICAgICAgICAgY2xpY2tIYW5kbGVyKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICAvLyBUaGUgOmhvdmVyIHBzZXVkbyBjbGFzcyBjYW4gYmVjb21lIHN0dWNrIG9uIHRoZSBhbnRlbm5hLXBvcHVwIGVsZW1lbnQgd2hlbiB3ZSBicmluZyB1cCB0aGUgcmVhY3Rpb24gd2luZG93XG4gICAgICAgIC8vIGluIHJlc3BvbnNlIHRvIHRoZSBjbGljay4gU28gaGVyZSB3ZSBhZGQvcmVtb3ZlIG91ciBvd24gaG92ZXIgY2xhc3MgaW5zdGVhZC5cbiAgICAgICAgLy8gU2VlOiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzEwMzIxMjc1L2hvdmVyLXN0YXRlLWlzLXN0aWNreS1hZnRlci1lbGVtZW50LWlzLW1vdmVkLW91dC1mcm9tLXVuZGVyLXRoZS1tb3VzZS1pbi1hbGwtYnJcbiAgICAgICAgJGVsZW1lbnQub24oJ21vdXNlZW50ZXInLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgJGVsZW1lbnQuYWRkQ2xhc3MoJ2hvdmVyJyk7XG4gICAgICAgIH0pO1xuICAgICAgICAkZWxlbWVudC5vbignbW91c2VsZWF2ZScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgJGVsZW1lbnQucmVtb3ZlQ2xhc3MoJ2hvdmVyJyk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gJGVsZW1lbnQ7XG4gICAgfVxuICAgIHJldHVybiAkKHJhY3RpdmUuZmluZCgnLmFudGVubmEtcG9wdXAnKSk7XG59XG5cbmZ1bmN0aW9uIHNob3dQb3B1cChjb29yZGluYXRlcywgY2FsbGJhY2spIHtcbiAgICB2YXIgJGVsZW1lbnQgPSBnZXRSb290RWxlbWVudCgpO1xuICAgIGlmICghJGVsZW1lbnQuaGFzQ2xhc3MoJ3Nob3cnKSkge1xuICAgICAgICBjbGlja0hhbmRsZXIgPSBjYWxsYmFjaztcbiAgICAgICAgJGVsZW1lbnRcbiAgICAgICAgICAgIC5zaG93KCkgLy8gc3RpbGwgaGFzIG9wYWNpdHkgMCBhdCB0aGlzIHBvaW50XG4gICAgICAgICAgICAuY3NzKHtcbiAgICAgICAgICAgICAgICB0b3A6IGNvb3JkaW5hdGVzLnRvcCAtICRlbGVtZW50Lm91dGVySGVpZ2h0KCkgLSA2LCAvLyBUT0RPIGZpbmQgYSBjbGVhbmVyIHdheSB0byBhY2NvdW50IGZvciB0aGUgcG9wdXAgJ3RhaWwnXG4gICAgICAgICAgICAgICAgbGVmdDogY29vcmRpbmF0ZXMubGVmdCAtIE1hdGguZmxvb3IoJGVsZW1lbnQub3V0ZXJXaWR0aCgpIC8gMilcbiAgICAgICAgICAgIH0pO1xuICAgICAgICBUcmFuc2l0aW9uVXRpbC50b2dnbGVDbGFzcygkZWxlbWVudCwgJ3Nob3cnLCB0cnVlLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIFRPRE86IGFmdGVyIHRoZSBhcHBlYXJhbmNlIHRyYW5zaXRpb24gaXMgY29tcGxldGUsIGFkZCBhIGhhbmRsZXIgZm9yIG1vdXNlZW50ZXIgd2hpY2ggdGhlbiByZWdpc3RlcnNcbiAgICAgICAgICAgIC8vICAgICAgIGEgaGFuZGxlciBmb3IgbW91c2VsZWF2ZSB0aGF0IGhpZGVzIHRoZSBwb3B1cFxuXG4gICAgICAgICAgICAvLyBUT0RPOiBhbHNvIHRha2UgZG93biB0aGUgcG9wdXAgaWYgdGhlIHVzZXIgbW91c2VzIG92ZXIgYW5vdGhlciB3aWRnZXQgKHN1bW1hcnkgb3IgaW5kaWNhdG9yKVxuICAgICAgICAgICAgJChkb2N1bWVudCkub24oJ2NsaWNrLmFudGVubmEtcG9wdXAnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaGlkZVBvcHVwKCRlbGVtZW50KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGhpZGVQb3B1cCgkZWxlbWVudCkge1xuICAgIFRyYW5zaXRpb25VdGlsLnRvZ2dsZUNsYXNzKCRlbGVtZW50LCAnc2hvdycsIGZhbHNlLCBmdW5jdGlvbigpIHtcbiAgICAgICAgJGVsZW1lbnQuaGlkZSgpOyAvLyBhZnRlciB3ZSdyZSBhdCBvcGFjaXR5IDAsIGhpZGUgdGhlIGVsZW1lbnQgc28gaXQgZG9lc24ndCByZWNlaXZlIGFjY2lkZW50YWwgY2xpY2tzXG4gICAgfSk7XG4gICAgJChkb2N1bWVudCkub2ZmKCdjbGljay5hbnRlbm5hLXBvcHVwJyk7XG59XG5cbmZ1bmN0aW9uIHRlYXJkb3duKCkge1xuICAgIGlmIChyYWN0aXZlKSB7XG4gICAgICAgIHJhY3RpdmUudGVhcmRvd24oKTtcbiAgICAgICAgcmFjdGl2ZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgY2xpY2tIYW5kbGVyID0gdW5kZWZpbmVkO1xuICAgIH1cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHNob3c6IHNob3dQb3B1cCxcbiAgICB0ZWFyZG93bjogdGVhcmRvd25cbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgUmFjdGl2ZTsgcmVxdWlyZSgnLi91dGlscy9yYWN0aXZlLXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGxvYWRlZFJhY3RpdmUpIHsgUmFjdGl2ZSA9IGxvYWRlZFJhY3RpdmU7fSk7XG5cbnZhciBBamF4Q2xpZW50ID0gcmVxdWlyZSgnLi91dGlscy9hamF4LWNsaWVudCcpO1xudmFyIFJhbmdlID0gcmVxdWlyZSgnLi91dGlscy9yYW5nZScpO1xudmFyIFJlYWN0aW9uc1dpZGdldExheW91dFV0aWxzID0gcmVxdWlyZSgnLi91dGlscy9yZWFjdGlvbnMtd2lkZ2V0LWxheW91dC11dGlscycpO1xuXG52YXIgRXZlbnRzID0gcmVxdWlyZSgnLi9ldmVudHMnKTtcbnZhciBTVkdzID0gcmVxdWlyZSgnLi9zdmdzJyk7XG5cbnZhciBwYWdlU2VsZWN0b3IgPSAnLmFudGVubmEtcmVhY3Rpb25zLXBhZ2UnO1xuXG5mdW5jdGlvbiBjcmVhdGVQYWdlKG9wdGlvbnMpIHtcbiAgICB2YXIgaXNTdW1tYXJ5ID0gb3B0aW9ucy5pc1N1bW1hcnk7XG4gICAgdmFyIHJlYWN0aW9uc0RhdGEgPSBvcHRpb25zLnJlYWN0aW9uc0RhdGE7XG4gICAgdmFyIGNvbnRhaW5lckRhdGEgPSBvcHRpb25zLmNvbnRhaW5lckRhdGE7XG4gICAgdmFyIHBhZ2VEYXRhID0gb3B0aW9ucy5wYWdlRGF0YTtcbiAgICB2YXIgZ3JvdXBTZXR0aW5ncyA9IG9wdGlvbnMuZ3JvdXBTZXR0aW5ncztcbiAgICB2YXIgY29udGFpbmVyRWxlbWVudCA9IG9wdGlvbnMuY29udGFpbmVyRWxlbWVudDsgLy8gb3B0aW9uYWxcbiAgICB2YXIgc2hvd0NvbmZpcm1hdGlvbiA9IG9wdGlvbnMuc2hvd0NvbmZpcm1hdGlvbjtcbiAgICB2YXIgc2hvd0RlZmF1bHRzID0gb3B0aW9ucy5zaG93RGVmYXVsdHM7XG4gICAgdmFyIHNob3dDb21tZW50cyA9IG9wdGlvbnMuc2hvd0NvbW1lbnRzO1xuICAgIHZhciBzaG93TG9jYXRpb25zID0gb3B0aW9ucy5zaG93TG9jYXRpb25zO1xuICAgIHZhciBoYW5kbGVSZWFjdGlvbkVycm9yID0gb3B0aW9ucy5oYW5kbGVSZWFjdGlvbkVycm9yO1xuICAgIHZhciBlbGVtZW50ID0gb3B0aW9ucy5lbGVtZW50O1xuICAgIHZhciByZWFjdGlvbnNMYXlvdXREYXRhID0gUmVhY3Rpb25zV2lkZ2V0TGF5b3V0VXRpbHMuY29tcHV0ZUxheW91dERhdGEocmVhY3Rpb25zRGF0YSk7XG4gICAgdmFyICRyZWFjdGlvbnNXaW5kb3cgPSAkKG9wdGlvbnMucmVhY3Rpb25zV2luZG93KTtcbiAgICB2YXIgcmFjdGl2ZSA9IFJhY3RpdmUoe1xuICAgICAgICBlbDogZWxlbWVudCxcbiAgICAgICAgYXBwZW5kOiB0cnVlLFxuICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL3JlYWN0aW9ucy1wYWdlLmhicy5odG1sJyksXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIHJlYWN0aW9uczogcmVhY3Rpb25zRGF0YSxcbiAgICAgICAgICAgIHJlYWN0aW9uc0xheW91dENsYXNzOiBhcnJheUFjY2Vzc29yKHJlYWN0aW9uc0xheW91dERhdGEubGF5b3V0Q2xhc3NlcyksXG4gICAgICAgICAgICBpc1N1bW1hcnk6IGlzU3VtbWFyeSxcbiAgICAgICAgICAgIGhpZGVDb21tZW50SW5wdXQ6IGdyb3VwU2V0dGluZ3MucmVxdWlyZXNBcHByb3ZhbCgpIC8vIEN1cnJlbnRseSwgc2l0ZXMgdGhhdCByZXF1aXJlIGFwcHJvdmFsIGRvbid0IHN1cHBvcnQgY29tbWVudCBpbnB1dC5cbiAgICAgICAgfSxcbiAgICAgICAgZGVjb3JhdG9yczoge1xuICAgICAgICAgICAgc2l6ZXRvZml0OiBzaXplVG9GaXQoJHJlYWN0aW9uc1dpbmRvdylcbiAgICAgICAgfSxcbiAgICAgICAgcGFydGlhbHM6IHtcbiAgICAgICAgICAgIGxvY2F0aW9uSWNvbjogU1ZHcy5sb2NhdGlvbixcbiAgICAgICAgICAgIGNvbW1lbnRzSWNvbjogU1ZHcy5jb21tZW50c1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICBpZiAoY29udGFpbmVyRWxlbWVudCkge1xuICAgICAgICByYWN0aXZlLm9uKCdoaWdobGlnaHQnLCBoaWdobGlnaHRDb250ZW50KGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBjb250YWluZXJFbGVtZW50KSk7XG4gICAgICAgIHJhY3RpdmUub24oJ2NsZWFyaGlnaGxpZ2h0cycsIFJhbmdlLmNsZWFySGlnaGxpZ2h0cyk7XG4gICAgfVxuICAgIHJhY3RpdmUub24oJ3BsdXNvbmUnLCBwbHVzT25lKTtcbiAgICByYWN0aXZlLm9uKCdzaG93ZGVmYXVsdCcsIHNob3dEZWZhdWx0cyk7XG4gICAgcmFjdGl2ZS5vbignc2hvd2NvbW1lbnRzJywgZnVuY3Rpb24ocmFjdGl2ZUV2ZW50KSB7IHNob3dDb21tZW50cyhyYWN0aXZlRXZlbnQuY29udGV4dCwgcGFnZVNlbGVjdG9yKTsgcmV0dXJuIGZhbHNlOyB9KTsgLy8gVE9ETyBjbGVhbiB1cFxuICAgIHJhY3RpdmUub24oJ3Nob3dsb2NhdGlvbnMnLCBmdW5jdGlvbihyYWN0aXZlRXZlbnQpIHsgc2hvd0xvY2F0aW9ucyhyYWN0aXZlRXZlbnQuY29udGV4dCwgcGFnZVNlbGVjdG9yKTsgcmV0dXJuIGZhbHNlOyB9KTsgLy8gVE9ETyBjbGVhbiB1cFxuICAgIHJldHVybiB7XG4gICAgICAgIHNlbGVjdG9yOiBwYWdlU2VsZWN0b3IsXG4gICAgICAgIHRlYXJkb3duOiBmdW5jdGlvbigpIHsgcmFjdGl2ZS50ZWFyZG93bigpOyB9XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIGFycmF5QWNjZXNzb3IoYXJyYXkpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGluZGV4KSB7XG4gICAgICAgICAgICByZXR1cm4gYXJyYXlbaW5kZXhdO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGx1c09uZShyYWN0aXZlRXZlbnQpIHtcbiAgICAgICAgdmFyIHJlYWN0aW9uRGF0YSA9IHJhY3RpdmVFdmVudC5jb250ZXh0O1xuICAgICAgICB2YXIgcmVhY3Rpb25Qcm92aWRlciA9IHsgLy8gdGhpcyByZWFjdGlvbiBwcm92aWRlciBpcyBhIG5vLWJyYWluZXIgYmVjYXVzZSB3ZSBhbHJlYWR5IGhhdmUgYSB2YWxpZCByZWFjdGlvbiAob25lIHdpdGggYW4gSUQpXG4gICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2socmVhY3Rpb25EYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgc2hvd0NvbmZpcm1hdGlvbihyZWFjdGlvbkRhdGEsIHJlYWN0aW9uUHJvdmlkZXIpO1xuICAgICAgICBBamF4Q2xpZW50LnBvc3RQbHVzT25lKHJlYWN0aW9uRGF0YSwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIHN1Y2Nlc3MsIGVycm9yKTtcblxuICAgICAgICBmdW5jdGlvbiBzdWNjZXNzKHJlYWN0aW9uRGF0YSkge1xuICAgICAgICAgICAgRXZlbnRzLnBvc3RSZWFjdGlvbkNyZWF0ZWQocGFnZURhdGEsIGNvbnRhaW5lckRhdGEsIHJlYWN0aW9uRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBlcnJvcihtZXNzYWdlKSB7XG4gICAgICAgICAgICB2YXIgcmV0cnkgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBBamF4Q2xpZW50LnBvc3RQbHVzT25lKHJlYWN0aW9uRGF0YSwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIHN1Y2Nlc3MsIGVycm9yKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBoYW5kbGVSZWFjdGlvbkVycm9yKG1lc3NhZ2UsIHJldHJ5LCBwYWdlU2VsZWN0b3IpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBzaXplVG9GaXQoJHJlYWN0aW9uc1dpbmRvdykge1xuICAgIHJldHVybiBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgIHZhciAkZWxlbWVudCA9ICQobm9kZSkuY2xvc2VzdCgnLmFudGVubmEtcmVhY3Rpb24tYm94Jyk7XG4gICAgICAgIC8vIFdoaWxlIHdlJ3JlIHNpemluZyB0aGUgdGV4dCB0byBmaXggaW4gdGhlIHJlYWN0aW9uIGJveCwgd2UgYWxzbyBmaXggdXAgdGhlIHdpZHRoIG9mIHRoZSByZWFjdGlvbiBjb3VudCBhbmRcbiAgICAgICAgLy8gcGx1cyBvbmUgYnV0dG9ucyBzbyB0aGF0IHRoZXkncmUgdGhlIHNhbWUuIFRoZXNlIHR3byB2aXN1YWxseSBzd2FwIHdpdGggZWFjaCBvdGhlciBvbiBob3ZlcjsgbWFraW5nIHRoZW1cbiAgICAgICAgLy8gdGhlIHNhbWUgd2lkdGggbWFrZXMgc3VyZSB3ZSBkb24ndCBnZXQganVtcGluZXNzIG9uIGhvdmVyLlxuICAgICAgICB2YXIgJHJlYWN0aW9uQ291bnQgPSAkZWxlbWVudC5maW5kKCcuYW50ZW5uYS1yZWFjdGlvbi1jb3VudCcpO1xuICAgICAgICB2YXIgJHBsdXNPbmUgPSAkZWxlbWVudC5maW5kKCcuYW50ZW5uYS1wbHVzb25lJyk7XG4gICAgICAgIHZhciBtaW5XaWR0aCA9IE1hdGgubWF4KCRyZWFjdGlvbkNvdW50LndpZHRoKCksICRwbHVzT25lLndpZHRoKCkpO1xuICAgICAgICBtaW5XaWR0aCsrOyAvLyBBZGQgYW4gZXh0cmEgcGl4ZWwgZm9yIHJvdW5kaW5nIGJlY2F1c2UgZWxlbWVudHMgdGhhdCBtZWFzdXJlLCBmb3IgZXhhbXBsZSwgMTcuMTg3NXB4IGNhbiBjb21lIGJhY2sgd2l0aCAxNyBhcyB0aGUgd2lkdGgoKVxuICAgICAgICAkcmVhY3Rpb25Db3VudC5jc3MoeydtaW4td2lkdGgnOiBtaW5XaWR0aH0pO1xuICAgICAgICAkcGx1c09uZS5jc3MoeydtaW4td2lkdGgnOiBtaW5XaWR0aH0pO1xuICAgICAgICByZXR1cm4gUmVhY3Rpb25zV2lkZ2V0TGF5b3V0VXRpbHMuc2l6ZVRvRml0KCRyZWFjdGlvbnNXaW5kb3cpKG5vZGUpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gaGlnaGxpZ2h0Q29udGVudChjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgJGNvbnRhaW5lckVsZW1lbnQpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdmFyIHJlYWN0aW9uRGF0YSA9IGV2ZW50LmNvbnRleHQ7XG4gICAgICAgIGlmIChyZWFjdGlvbkRhdGEuY29udGVudCkge1xuICAgICAgICAgICAgdmFyIGxvY2F0aW9uID0gcmVhY3Rpb25EYXRhLmNvbnRlbnQubG9jYXRpb247XG4gICAgICAgICAgICBpZiAobG9jYXRpb24pIHtcbiAgICAgICAgICAgICAgICBSYW5nZS5oaWdobGlnaHQoJGNvbnRhaW5lckVsZW1lbnQuZ2V0KDApLCBsb2NhdGlvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGU6IGNyZWF0ZVBhZ2Vcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgQWpheENsaWVudCA9IHJlcXVpcmUoJy4vdXRpbHMvYWpheC1jbGllbnQnKTtcbnZhciBCcm93c2VyTWV0cmljcyA9IHJlcXVpcmUoJy4vdXRpbHMvYnJvd3Nlci1tZXRyaWNzJyk7XG52YXIgTWVzc2FnZXMgPSByZXF1aXJlKCcuL3V0aWxzL21lc3NhZ2VzJyk7XG52YXIgTW92ZWFibGUgPSByZXF1aXJlKCcuL3V0aWxzL21vdmVhYmxlJyk7XG52YXIgUmFjdGl2ZTsgcmVxdWlyZSgnLi91dGlscy9yYWN0aXZlLXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGxvYWRlZFJhY3RpdmUpIHsgUmFjdGl2ZSA9IGxvYWRlZFJhY3RpdmU7fSk7XG52YXIgUmFuZ2UgPSByZXF1aXJlKCcuL3V0aWxzL3JhbmdlJyk7XG52YXIgVG91Y2hTdXBwb3J0ID0gcmVxdWlyZSgnLi91dGlscy90b3VjaC1zdXBwb3J0Jyk7XG52YXIgVHJhbnNpdGlvblV0aWwgPSByZXF1aXJlKCcuL3V0aWxzL3RyYW5zaXRpb24tdXRpbCcpO1xudmFyIFVzZXIgPSByZXF1aXJlKCcuL3V0aWxzL3VzZXInKTtcbnZhciBXaWRnZXRCdWNrZXQgPSByZXF1aXJlKCcuL3V0aWxzL3dpZGdldC1idWNrZXQnKTtcblxudmFyIEJsb2NrZWRSZWFjdGlvblBhZ2UgPSByZXF1aXJlKCcuL2Jsb2NrZWQtcmVhY3Rpb24tcGFnZScpO1xudmFyIENvbW1lbnRzUGFnZSA9IHJlcXVpcmUoJy4vY29tbWVudHMtcGFnZScpO1xudmFyIENvbmZpcm1hdGlvblBhZ2UgPSByZXF1aXJlKCcuL2NvbmZpcm1hdGlvbi1wYWdlJyk7XG52YXIgRGVmYXVsdHNQYWdlID0gcmVxdWlyZSgnLi9kZWZhdWx0cy1wYWdlJyk7XG52YXIgRXZlbnRzID0gcmVxdWlyZSgnLi9ldmVudHMnKTtcbnZhciBHZW5lcmljRXJyb3JQYWdlID0gcmVxdWlyZSgnLi9nZW5lcmljLWVycm9yLXBhZ2UnKTtcbnZhciBMb2NhdGlvbnNQYWdlID0gcmVxdWlyZSgnLi9sb2NhdGlvbnMtcGFnZScpO1xudmFyIExvZ2luUGFnZSA9IHJlcXVpcmUoJy4vbG9naW4tcGFnZScpO1xudmFyIFBhZ2VEYXRhID0gcmVxdWlyZSgnLi9wYWdlLWRhdGEnKTtcbnZhciBQZW5kaW5nUmVhY3Rpb25QYWdlID0gcmVxdWlyZSgnLi9wZW5kaW5nLXJlYWN0aW9uLXBhZ2UnKTtcbnZhciBSZWFjdGlvbnNQYWdlID0gcmVxdWlyZSgnLi9yZWFjdGlvbnMtcGFnZScpO1xudmFyIFNWR3MgPSByZXF1aXJlKCcuL3N2Z3MnKTtcblxudmFyIFBBR0VfUkVBQ1RJT05TID0gJ3JlYWN0aW9ucyc7XG52YXIgUEFHRV9ERUZBVUxUUyA9ICdkZWZhdWx0cyc7XG52YXIgUEFHRV9BVVRPID0gJ2F1dG8nO1xuXG52YXIgU0VMRUNUT1JfUkVBQ1RJT05TX1dJREdFVCA9ICcuYW50ZW5uYS1yZWFjdGlvbnMtd2lkZ2V0JztcblxudmFyIG9wZW5JbnN0YW5jZXMgPSBbXTtcblxuZnVuY3Rpb24gb3BlblJlYWN0aW9uc1dpZGdldChvcHRpb25zLCBlbGVtZW50T3JDb29yZHMpIHtcbiAgICBjbG9zZUFsbFdpbmRvd3MoKTtcbiAgICB2YXIgZGVmYXVsdFJlYWN0aW9ucyA9IG9wdGlvbnMuZGVmYXVsdFJlYWN0aW9ucztcbiAgICB2YXIgcmVhY3Rpb25zRGF0YSA9IG9wdGlvbnMucmVhY3Rpb25zRGF0YTtcbiAgICB2YXIgY29udGFpbmVyRGF0YSA9IG9wdGlvbnMuY29udGFpbmVyRGF0YTtcbiAgICB2YXIgY29udGFpbmVyRWxlbWVudCA9IG9wdGlvbnMuY29udGFpbmVyRWxlbWVudDsgLy8gb3B0aW9uYWxcbiAgICB2YXIgc3RhcnRQYWdlID0gb3B0aW9ucy5zdGFydFBhZ2UgfHwgUEFHRV9BVVRPOyAvLyBvcHRpb25hbFxuICAgIHZhciBpc1N1bW1hcnkgPSBvcHRpb25zLmlzU3VtbWFyeSA9PT0gdW5kZWZpbmVkID8gZmFsc2UgOiBvcHRpb25zLmlzU3VtbWFyeTsgLy8gb3B0aW9uYWxcbiAgICAvLyBjb250ZW50RGF0YSBjb250YWlucyBkZXRhaWxzIGFib3V0IHRoZSBjb250ZW50IGJlaW5nIHJlYWN0ZWQgdG8gbGlrZSB0ZXh0IHJhbmdlIG9yIGltYWdlIGhlaWdodC93aWR0aC5cbiAgICAvLyB3ZSBwb3RlbnRpYWxseSBtb2RpZnkgdGhpcyBkYXRhIChlLmcuIGluIHRoZSBkZWZhdWx0IHJlYWN0aW9uIGNhc2Ugd2Ugc2VsZWN0IHRoZSB0ZXh0IG91cnNlbHZlcykgc28gd2VcbiAgICAvLyBtYWtlIGEgbG9jYWwgY29weSBvZiBpdCB0byBhdm9pZCB1bmV4cGVjdGVkbHkgY2hhbmdpbmcgZGF0YSBvdXQgZnJvbSB1bmRlciBvbmUgb2YgdGhlIGNsaWVudHNcbiAgICB2YXIgY29udGVudERhdGEgPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KG9wdGlvbnMuY29udGVudERhdGEpKTtcbiAgICB2YXIgcGFnZURhdGEgPSBvcHRpb25zLnBhZ2VEYXRhO1xuICAgIHZhciBncm91cFNldHRpbmdzID0gb3B0aW9ucy5ncm91cFNldHRpbmdzO1xuICAgIHZhciByYWN0aXZlID0gUmFjdGl2ZSh7XG4gICAgICAgIGVsOiBXaWRnZXRCdWNrZXQuZ2V0KCksXG4gICAgICAgIGFwcGVuZDogdHJ1ZSxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgc3VwcG9ydHNUb3VjaDogQnJvd3Nlck1ldHJpY3Muc3VwcG9ydHNUb3VjaCgpXG4gICAgICAgIH0sXG4gICAgICAgIHRlbXBsYXRlOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvcmVhY3Rpb25zLXdpZGdldC5oYnMuaHRtbCcpLFxuICAgICAgICBwYXJ0aWFsczoge1xuICAgICAgICAgICAgbG9nbzogU1ZHcy5sb2dvXG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIHJhY3RpdmUub24oJ2Nsb3NlJywgY2xvc2VBbGxXaW5kb3dzKTtcbiAgICB2YXIgJHJvb3RFbGVtZW50ID0gJChyb290RWxlbWVudChyYWN0aXZlKSk7XG4gICAgTW92ZWFibGUubWFrZU1vdmVhYmxlKCRyb290RWxlbWVudCwgJHJvb3RFbGVtZW50LmZpbmQoJy5hbnRlbm5hLWhlYWRlcicpKTtcbiAgICB2YXIgcGFnZXMgPSBbXTtcblxuICAgIG9wZW5XaW5kb3coKTtcblxuICAgIGZ1bmN0aW9uIG9wZW5XaW5kb3coKSB7XG4gICAgICAgIFBhZ2VEYXRhLmNsZWFySW5kaWNhdG9yTGltaXQocGFnZURhdGEpO1xuICAgICAgICB2YXIgY29vcmRzO1xuICAgICAgICBpZiAoZWxlbWVudE9yQ29vcmRzLnRvcCAmJiBlbGVtZW50T3JDb29yZHMubGVmdCkge1xuICAgICAgICAgICAgY29vcmRzID0gZWxlbWVudE9yQ29vcmRzO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyICRyZWxhdGl2ZUVsZW1lbnQgPSAkKGVsZW1lbnRPckNvb3Jkcyk7XG4gICAgICAgICAgICB2YXIgb2Zmc2V0ID0gJHJlbGF0aXZlRWxlbWVudC5vZmZzZXQoKTtcbiAgICAgICAgICAgIGNvb3JkcyA9IHtcbiAgICAgICAgICAgICAgICB0b3A6IG9mZnNldC50b3AsXG4gICAgICAgICAgICAgICAgbGVmdDogb2Zmc2V0LmxlZnRcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGhvcml6b250YWxPdmVyZmxvdyA9IGNvb3Jkcy5sZWZ0ICsgJHJvb3RFbGVtZW50LndpZHRoKCkgLSBNYXRoLm1heChkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50V2lkdGgsIHdpbmRvdy5pbm5lcldpZHRoIHx8IDApOyAvLyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzEyNDgwODEvZ2V0LXRoZS1icm93c2VyLXZpZXdwb3J0LWRpbWVuc2lvbnMtd2l0aC1qYXZhc2NyaXB0Lzg4NzYwNjkjODg3NjA2OVxuICAgICAgICBpZiAoaG9yaXpvbnRhbE92ZXJmbG93ID4gMCkge1xuICAgICAgICAgICAgY29vcmRzLmxlZnQgPSBjb29yZHMubGVmdCAtIGhvcml6b250YWxPdmVyZmxvdztcbiAgICAgICAgfVxuICAgICAgICAkcm9vdEVsZW1lbnQuc3RvcCh0cnVlLCB0cnVlKS5hZGRDbGFzcygnYW50ZW5uYS1yZWFjdGlvbnMtb3BlbicpLmNzcyhjb29yZHMpO1xuXG4gICAgICAgIHZhciBpc1Nob3dSZWFjdGlvbnMgPSBzdGFydFBhZ2UgPT09IFBBR0VfUkVBQ1RJT05TIHx8IChzdGFydFBhZ2UgPT09IFBBR0VfQVVUTyAmJiByZWFjdGlvbnNEYXRhLmxlbmd0aCA+IDApO1xuICAgICAgICBpZiAoaXNTaG93UmVhY3Rpb25zKSB7XG4gICAgICAgICAgICBzaG93UmVhY3Rpb25zKGZhbHNlKTtcbiAgICAgICAgfSBlbHNlIHsgLy8gc3RhcnRQYWdlID09PSBwYWdlRGVmYXVsdHMgfHwgdGhlcmUgYXJlIG5vIHJlYWN0aW9uc1xuICAgICAgICAgICAgc2hvd0RlZmF1bHRSZWFjdGlvbnNQYWdlKGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaXNTdW1tYXJ5KSB7XG4gICAgICAgICAgICBFdmVudHMucG9zdFN1bW1hcnlPcGVuZWQoaXNTaG93UmVhY3Rpb25zLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBFdmVudHMucG9zdFJlYWN0aW9uV2lkZ2V0T3BlbmVkKGlzU2hvd1JlYWN0aW9ucywgcGFnZURhdGEsIGNvbnRhaW5lckRhdGEsIGNvbnRlbnREYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHNldHVwV2luZG93Q2xvc2UocGFnZXMsIHJhY3RpdmUpO1xuICAgICAgICBwcmV2ZW50RXh0cmFTY3JvbGwoJHJvb3RFbGVtZW50KTtcbiAgICAgICAgb3Blbkluc3RhbmNlcy5wdXNoKHJhY3RpdmUpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNob3dSZWFjdGlvbnMoYW5pbWF0ZSkge1xuICAgICAgICB2YXIgb3B0aW9ucyA9IHtcbiAgICAgICAgICAgIGlzU3VtbWFyeTogaXNTdW1tYXJ5LFxuICAgICAgICAgICAgcmVhY3Rpb25zRGF0YTogcmVhY3Rpb25zRGF0YSxcbiAgICAgICAgICAgIHBhZ2VEYXRhOiBwYWdlRGF0YSxcbiAgICAgICAgICAgIGdyb3VwU2V0dGluZ3M6IGdyb3VwU2V0dGluZ3MsXG4gICAgICAgICAgICBjb250YWluZXJEYXRhOiBjb250YWluZXJEYXRhLFxuICAgICAgICAgICAgY29udGFpbmVyRWxlbWVudDogY29udGFpbmVyRWxlbWVudCxcbiAgICAgICAgICAgIHNob3dDb25maXJtYXRpb246IHNob3dDb25maXJtYXRpb24sXG4gICAgICAgICAgICBzaG93RGVmYXVsdHM6IGZ1bmN0aW9uKCkgeyBzaG93RGVmYXVsdFJlYWN0aW9uc1BhZ2UodHJ1ZSkgfSxcbiAgICAgICAgICAgIHNob3dDb21tZW50czogc2hvd0NvbW1lbnRzLFxuICAgICAgICAgICAgc2hvd0xvY2F0aW9uczogc2hvd0xvY2F0aW9ucyxcbiAgICAgICAgICAgIGhhbmRsZVJlYWN0aW9uRXJyb3I6IGhhbmRsZVJlYWN0aW9uRXJyb3IsXG4gICAgICAgICAgICBlbGVtZW50OiBwYWdlQ29udGFpbmVyKHJhY3RpdmUpLFxuICAgICAgICAgICAgcmVhY3Rpb25zV2luZG93OiAkcm9vdEVsZW1lbnRcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIHBhZ2UgPSBSZWFjdGlvbnNQYWdlLmNyZWF0ZShvcHRpb25zKTtcbiAgICAgICAgcGFnZXMucHVzaChwYWdlKTtcbiAgICAgICAgc2hvd1BhZ2UocGFnZS5zZWxlY3RvciwgJHJvb3RFbGVtZW50LCBhbmltYXRlLCBmYWxzZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2hvd0RlZmF1bHRSZWFjdGlvbnNQYWdlKGFuaW1hdGUpIHtcbiAgICAgICAgaWYgKGNvbnRhaW5lckVsZW1lbnQgJiYgIWNvbnRlbnREYXRhLmxvY2F0aW9uICYmICFjb250ZW50RGF0YS5ib2R5KSB7XG4gICAgICAgICAgICBSYW5nZS5ncmFiTm9kZShjb250YWluZXJFbGVtZW50LmdldCgwKSwgZnVuY3Rpb24gKHRleHQsIGxvY2F0aW9uKSB7XG4gICAgICAgICAgICAgICAgY29udGVudERhdGEubG9jYXRpb24gPSBsb2NhdGlvbjtcbiAgICAgICAgICAgICAgICBjb250ZW50RGF0YS5ib2R5ID0gdGV4dDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHZhciBvcHRpb25zID0geyAvLyBUT0RPOiBjbGVhbiB1cCB0aGUgbnVtYmVyIG9mIHRoZXNlIFwib3B0aW9uc1wiIG9iamVjdHMgdGhhdCB3ZSBjcmVhdGUuXG4gICAgICAgICAgICBkZWZhdWx0UmVhY3Rpb25zOiBkZWZhdWx0UmVhY3Rpb25zLFxuICAgICAgICAgICAgcGFnZURhdGE6IHBhZ2VEYXRhLFxuICAgICAgICAgICAgZ3JvdXBTZXR0aW5nczogZ3JvdXBTZXR0aW5ncyxcbiAgICAgICAgICAgIGNvbnRhaW5lckRhdGE6IGNvbnRhaW5lckRhdGEsXG4gICAgICAgICAgICBjb250ZW50RGF0YTogY29udGVudERhdGEsXG4gICAgICAgICAgICBzaG93Q29uZmlybWF0aW9uOiBzaG93Q29uZmlybWF0aW9uLFxuICAgICAgICAgICAgc2hvd1BlbmRpbmdBcHByb3ZhbDogc2hvd1BlbmRpbmdBcHByb3ZhbCxcbiAgICAgICAgICAgIHNob3dQcm9ncmVzczogc2hvd1Byb2dyZXNzUGFnZSxcbiAgICAgICAgICAgIGhhbmRsZVJlYWN0aW9uRXJyb3I6IGhhbmRsZVJlYWN0aW9uRXJyb3IsXG4gICAgICAgICAgICBlbGVtZW50OiBwYWdlQ29udGFpbmVyKHJhY3RpdmUpLFxuICAgICAgICAgICAgcmVhY3Rpb25zV2luZG93OiAkcm9vdEVsZW1lbnRcbiAgICAgICAgfTtcbiAgICAgICAgc2V0V2luZG93VGl0bGUoTWVzc2FnZXMuZ2V0TWVzc2FnZSgncmVhY3Rpb25zX3dpZGdldF9fdGl0bGVfdGhpbmsnKSk7XG4gICAgICAgIHZhciBwYWdlID0gRGVmYXVsdHNQYWdlLmNyZWF0ZShvcHRpb25zKTtcbiAgICAgICAgcGFnZXMucHVzaChwYWdlKTtcbiAgICAgICAgc2hvd1BhZ2UocGFnZS5zZWxlY3RvciwgJHJvb3RFbGVtZW50LCBhbmltYXRlKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzaG93Q29uZmlybWF0aW9uKHJlYWN0aW9uRGF0YSwgcmVhY3Rpb25Qcm92aWRlcikge1xuICAgICAgICBzZXRXaW5kb3dUaXRsZShNZXNzYWdlcy5nZXRNZXNzYWdlKCdyZWFjdGlvbnNfd2lkZ2V0X190aXRsZV90aGFua3MnKSk7XG4gICAgICAgIHZhciBwYWdlID0gQ29uZmlybWF0aW9uUGFnZS5jcmVhdGUocmVhY3Rpb25EYXRhLnRleHQsIHJlYWN0aW9uUHJvdmlkZXIsIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzLCBwYWdlQ29udGFpbmVyKHJhY3RpdmUpKTtcbiAgICAgICAgcGFnZXMucHVzaChwYWdlKTtcbiAgICAgICAgLy8gVE9ETzogcmV2aXNpdCB3aHkgd2UgbmVlZCB0byB1c2UgdGhlIHRpbWVvdXQgdHJpY2sgZm9yIHRoZSBjb25maXJtIHBhZ2UsIGJ1dCBub3QgZm9yIHRoZSBkZWZhdWx0cyBwYWdlXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IC8vIEluIG9yZGVyIGZvciB0aGUgcG9zaXRpb25pbmcgYW5pbWF0aW9uIHRvIHdvcmssIHdlIG5lZWQgdG8gbGV0IHRoZSBicm93c2VyIHJlbmRlciB0aGUgYXBwZW5kZWQgRE9NIGVsZW1lbnRcbiAgICAgICAgICAgIHNob3dQYWdlKHBhZ2Uuc2VsZWN0b3IsICRyb290RWxlbWVudCwgdHJ1ZSk7XG4gICAgICAgIH0sIDEpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNob3dQZW5kaW5nQXBwcm92YWwocmVhY3Rpb24pIHtcbiAgICAgICAgc2V0V2luZG93VGl0bGUoTWVzc2FnZXMuZ2V0TWVzc2FnZSgncmVhY3Rpb25zX3dpZGdldF9fdGl0bGVfdGhhbmtzJykpO1xuICAgICAgICB2YXIgcGFnZSA9IFBlbmRpbmdSZWFjdGlvblBhZ2UuY3JlYXRlUGFnZShyZWFjdGlvbi50ZXh0LCBwYWdlQ29udGFpbmVyKHJhY3RpdmUpKTtcbiAgICAgICAgcGFnZXMucHVzaChwYWdlKTtcbiAgICAgICAgLy8gVE9ETzogcmV2aXNpdCB3aHkgd2UgbmVlZCB0byB1c2UgdGhlIHRpbWVvdXQgdHJpY2sgZm9yIHRoZSBjb25maXJtIHBhZ2UsIGJ1dCBub3QgZm9yIHRoZSBkZWZhdWx0cyBwYWdlXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IC8vIEluIG9yZGVyIGZvciB0aGUgcG9zaXRpb25pbmcgYW5pbWF0aW9uIHRvIHdvcmssIHdlIG5lZWQgdG8gbGV0IHRoZSBicm93c2VyIHJlbmRlciB0aGUgYXBwZW5kZWQgRE9NIGVsZW1lbnRcbiAgICAgICAgICAgIHNob3dQYWdlKHBhZ2Uuc2VsZWN0b3IsICRyb290RWxlbWVudCwgdHJ1ZSk7XG4gICAgICAgIH0sIDEpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNob3dQcm9ncmVzc1BhZ2UoKSB7XG4gICAgICAgIHNob3dQYWdlKCcuYW50ZW5uYS1wcm9ncmVzcy1wYWdlJywgJHJvb3RFbGVtZW50LCBmYWxzZSwgdHJ1ZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2hvd0NvbW1lbnRzKHJlYWN0aW9uLCBiYWNrUGFnZVNlbGVjdG9yKSB7XG4gICAgICAgIHNob3dQcm9ncmVzc1BhZ2UoKTsgLy8gVE9ETzogcHJvdmlkZSBzb21lIHdheSBmb3IgdGhlIHVzZXIgdG8gZ2l2ZSB1cCAvIGNhbmNlbC4gQWxzbywgaGFuZGxlIGVycm9ycyBmZXRjaGluZyBjb21tZW50cy5cbiAgICAgICAgdmFyIHN1Y2Nlc3MgPSBmdW5jdGlvbihjb21tZW50cykge1xuICAgICAgICAgICAgdmFyIG9wdGlvbnMgPSB7XG4gICAgICAgICAgICAgICAgcmVhY3Rpb246IHJlYWN0aW9uLFxuICAgICAgICAgICAgICAgIGNvbW1lbnRzOiBjb21tZW50cyxcbiAgICAgICAgICAgICAgICBlbGVtZW50OiBwYWdlQ29udGFpbmVyKHJhY3RpdmUpLFxuICAgICAgICAgICAgICAgIGdvQmFjazogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHNldFdpbmRvd1RpdGxlKE1lc3NhZ2VzLmdldE1lc3NhZ2UoJ3JlYWN0aW9uc193aWRnZXRfX3RpdGxlJykpO1xuICAgICAgICAgICAgICAgICAgICBnb0JhY2tUb1BhZ2UocGFnZXMsIGJhY2tQYWdlU2VsZWN0b3IsICRyb290RWxlbWVudCk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBjb250YWluZXJEYXRhOiBjb250YWluZXJEYXRhLFxuICAgICAgICAgICAgICAgIHBhZ2VEYXRhOiBwYWdlRGF0YSxcbiAgICAgICAgICAgICAgICBncm91cFNldHRpbmdzOiBncm91cFNldHRpbmdzXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdmFyIHBhZ2UgPSBDb21tZW50c1BhZ2UuY3JlYXRlKG9wdGlvbnMpO1xuICAgICAgICAgICAgcGFnZXMucHVzaChwYWdlKTtcblxuICAgICAgICAgICAgLy8gVE9ETzogcmV2aXNpdFxuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHsgLy8gSW4gb3JkZXIgZm9yIHRoZSBwb3NpdGlvbmluZyBhbmltYXRpb24gdG8gd29yaywgd2UgbmVlZCB0byBsZXQgdGhlIGJyb3dzZXIgcmVuZGVyIHRoZSBhcHBlbmRlZCBET00gZWxlbWVudFxuICAgICAgICAgICAgICAgIHNob3dQYWdlKHBhZ2Uuc2VsZWN0b3IsICRyb290RWxlbWVudCwgdHJ1ZSk7XG4gICAgICAgICAgICB9LCAxKTtcblxuICAgICAgICAgICAgRXZlbnRzLnBvc3RDb21tZW50c1ZpZXdlZChwYWdlRGF0YSwgY29udGFpbmVyRGF0YSwgcmVhY3Rpb24sIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgZXJyb3IgPSBmdW5jdGlvbihtZXNzYWdlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnQW4gZXJyb3Igb2NjdXJyZWQgZmV0Y2hpbmcgY29tbWVudHM6ICcgKyBtZXNzYWdlKTtcbiAgICAgICAgICAgIHNob3dHZW5lcmljRXJyb3JQYWdlKGJhY2tQYWdlU2VsZWN0b3IpO1xuICAgICAgICB9O1xuICAgICAgICBBamF4Q2xpZW50LmdldENvbW1lbnRzKHJlYWN0aW9uLCBzdWNjZXNzLCBlcnJvcik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2hvd0xvY2F0aW9ucyhyZWFjdGlvbiwgYmFja1BhZ2VTZWxlY3Rvcikge1xuICAgICAgICBzaG93UHJvZ3Jlc3NQYWdlKCk7IC8vIFRPRE86IHByb3ZpZGUgc29tZSB3YXkgZm9yIHRoZSB1c2VyIHRvIGdpdmUgdXAgLyBjYW5jZWwuIEFsc28sIGhhbmRsZSBlcnJvcnMgZmV0Y2hpbmcgY29tbWVudHMuXG4gICAgICAgIHZhciByZWFjdGlvbkxvY2F0aW9uRGF0YSA9IFBhZ2VEYXRhLmdldFJlYWN0aW9uTG9jYXRpb25EYXRhKHJlYWN0aW9uLCBwYWdlRGF0YSk7XG4gICAgICAgIHZhciBzdWNjZXNzID0gZnVuY3Rpb24obG9jYXRpb25EZXRhaWxzKSB7XG4gICAgICAgICAgICBQYWdlRGF0YS51cGRhdGVSZWFjdGlvbkxvY2F0aW9uRGF0YShyZWFjdGlvbkxvY2F0aW9uRGF0YSwgbG9jYXRpb25EZXRhaWxzKTtcbiAgICAgICAgICAgIHZhciBvcHRpb25zID0geyAvLyBUT0RPOiBjbGVhbiB1cCB0aGUgbnVtYmVyIG9mIHRoZXNlIFwib3B0aW9uc1wiIG9iamVjdHMgdGhhdCB3ZSBjcmVhdGUuXG4gICAgICAgICAgICAgICAgZWxlbWVudDogcGFnZUNvbnRhaW5lcihyYWN0aXZlKSxcbiAgICAgICAgICAgICAgICByZWFjdGlvbkxvY2F0aW9uRGF0YTogcmVhY3Rpb25Mb2NhdGlvbkRhdGEsXG4gICAgICAgICAgICAgICAgcGFnZURhdGE6IHBhZ2VEYXRhLFxuICAgICAgICAgICAgICAgIGdyb3VwU2V0dGluZ3M6IGdyb3VwU2V0dGluZ3MsXG4gICAgICAgICAgICAgICAgY2xvc2VXaW5kb3c6IGNsb3NlQWxsV2luZG93cyxcbiAgICAgICAgICAgICAgICBnb0JhY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBzZXRXaW5kb3dUaXRsZShNZXNzYWdlcy5nZXRNZXNzYWdlKCdyZWFjdGlvbnNfd2lkZ2V0X190aXRsZScpKTtcbiAgICAgICAgICAgICAgICAgICAgZ29CYWNrVG9QYWdlKHBhZ2VzLCBiYWNrUGFnZVNlbGVjdG9yLCAkcm9vdEVsZW1lbnQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB2YXIgcGFnZSA9IExvY2F0aW9uc1BhZ2UuY3JlYXRlKG9wdGlvbnMpO1xuICAgICAgICAgICAgcGFnZXMucHVzaChwYWdlKTtcbiAgICAgICAgICAgIHNldFdpbmRvd1RpdGxlKHJlYWN0aW9uLnRleHQpO1xuICAgICAgICAgICAgLy8gVE9ETzogcmV2aXNpdFxuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHsgLy8gSW4gb3JkZXIgZm9yIHRoZSBwb3NpdGlvbmluZyBhbmltYXRpb24gdG8gd29yaywgd2UgbmVlZCB0byBsZXQgdGhlIGJyb3dzZXIgcmVuZGVyIHRoZSBhcHBlbmRlZCBET00gZWxlbWVudFxuICAgICAgICAgICAgICAgIHNob3dQYWdlKHBhZ2Uuc2VsZWN0b3IsICRyb290RWxlbWVudCwgdHJ1ZSk7XG4gICAgICAgICAgICB9LCAxKTtcbiAgICAgICAgICAgIEV2ZW50cy5wb3N0TG9jYXRpb25zVmlld2VkKHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIGVycm9yID0gZnVuY3Rpb24obWVzc2FnZSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ0FuIGVycm9yIG9jY3VycmVkIGZldGNoaW5nIGNvbnRlbnQgYm9kaWVzOiAnICsgbWVzc2FnZSk7XG4gICAgICAgICAgICBzaG93R2VuZXJpY0Vycm9yUGFnZShiYWNrUGFnZVNlbGVjdG9yKTtcbiAgICAgICAgfTtcbiAgICAgICAgQWpheENsaWVudC5mZXRjaExvY2F0aW9uRGV0YWlscyhyZWFjdGlvbkxvY2F0aW9uRGF0YSwgcGFnZURhdGEsIHN1Y2Nlc3MsIGVycm9yKTtcbiAgICB9XG5cbiAgICAvLyBTaG93cyB0aGUgbG9naW4gcGFnZSwgd2l0aCBhIHByb21wdCB0byBnbyBCYWNrIHRvIHRoZSBwYWdlIHNwZWNpZmllZCBieSB0aGUgZ2l2ZW4gcGFnZSBzZWxlY3Rvci5cbiAgICBmdW5jdGlvbiBzaG93TG9naW5QYWdlKGJhY2tQYWdlU2VsZWN0b3IsIHJldHJ5Q2FsbGJhY2spIHtcbiAgICAgICAgc2V0V2luZG93VGl0bGUoTWVzc2FnZXMuZ2V0TWVzc2FnZSgncmVhY3Rpb25zX3dpZGdldF9fdGl0bGVfc2lnbmluJykpO1xuICAgICAgICB2YXIgb3B0aW9ucyA9IHtcbiAgICAgICAgICAgIGVsZW1lbnQ6IHBhZ2VDb250YWluZXIocmFjdGl2ZSksXG4gICAgICAgICAgICBncm91cFNldHRpbmdzOiBncm91cFNldHRpbmdzLFxuICAgICAgICAgICAgZ29CYWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBzZXRXaW5kb3dUaXRsZShNZXNzYWdlcy5nZXRNZXNzYWdlKCdyZWFjdGlvbnNfd2lkZ2V0X190aXRsZScpKTtcbiAgICAgICAgICAgICAgICBnb0JhY2tUb1BhZ2UocGFnZXMsIGJhY2tQYWdlU2VsZWN0b3IsICRyb290RWxlbWVudCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmV0cnk6IHJldHJ5Q2FsbGJhY2tcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIHBhZ2UgPSBMb2dpblBhZ2UuY3JlYXRlUGFnZShvcHRpb25zKTtcbiAgICAgICAgcGFnZXMucHVzaChwYWdlKTtcblxuICAgICAgICAvLyBUT0RPOiByZXZpc2l0IHdoeSB3ZSBuZWVkIHRvIHVzZSB0aGUgdGltZW91dCB0cmljayBmb3IgdGhlIGNvbmZpcm0gcGFnZSwgYnV0IG5vdCBmb3IgdGhlIGRlZmF1bHRzIHBhZ2VcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHsgLy8gSW4gb3JkZXIgZm9yIHRoZSBwb3NpdGlvbmluZyBhbmltYXRpb24gdG8gd29yaywgd2UgbmVlZCB0byBsZXQgdGhlIGJyb3dzZXIgcmVuZGVyIHRoZSBhcHBlbmRlZCBET00gZWxlbWVudFxuICAgICAgICAgICAgc2hvd1BhZ2UocGFnZS5zZWxlY3RvciwgJHJvb3RFbGVtZW50LCB0cnVlKTtcbiAgICAgICAgfSwgMSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2hvd0Jsb2NrZWRSZWFjdGlvblBhZ2UoYmFja1BhZ2VTZWxlY3Rvcikge1xuICAgICAgICBzZXRXaW5kb3dUaXRsZShNZXNzYWdlcy5nZXRNZXNzYWdlKCdyZWFjdGlvbnNfd2lkZ2V0X190aXRsZV9ibG9ja2VkJykpO1xuICAgICAgICB2YXIgb3B0aW9ucyA9IHtcbiAgICAgICAgICAgIGVsZW1lbnQ6IHBhZ2VDb250YWluZXIocmFjdGl2ZSksXG4gICAgICAgICAgICBncm91cFNldHRpbmdzOiBncm91cFNldHRpbmdzLFxuICAgICAgICAgICAgZ29CYWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBzZXRXaW5kb3dUaXRsZShNZXNzYWdlcy5nZXRNZXNzYWdlKCdyZWFjdGlvbnNfd2lkZ2V0X190aXRsZScpKTtcbiAgICAgICAgICAgICAgICBnb0JhY2tUb1BhZ2UocGFnZXMsIGJhY2tQYWdlU2VsZWN0b3IsICRyb290RWxlbWVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHZhciBwYWdlID0gQmxvY2tlZFJlYWN0aW9uUGFnZS5jcmVhdGVQYWdlKG9wdGlvbnMpO1xuICAgICAgICBwYWdlcy5wdXNoKHBhZ2UpO1xuXG4gICAgICAgIC8vIFRPRE86IHJldmlzaXQgd2h5IHdlIG5lZWQgdG8gdXNlIHRoZSB0aW1lb3V0IHRyaWNrIGZvciB0aGUgY29uZmlybSBwYWdlLCBidXQgbm90IGZvciB0aGUgZGVmYXVsdHMgcGFnZVxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyAvLyBJbiBvcmRlciBmb3IgdGhlIHBvc2l0aW9uaW5nIGFuaW1hdGlvbiB0byB3b3JrLCB3ZSBuZWVkIHRvIGxldCB0aGUgYnJvd3NlciByZW5kZXIgdGhlIGFwcGVuZGVkIERPTSBlbGVtZW50XG4gICAgICAgICAgICBzaG93UGFnZShwYWdlLnNlbGVjdG9yLCAkcm9vdEVsZW1lbnQsIHRydWUpO1xuICAgICAgICB9LCAxKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzaG93R2VuZXJpY0Vycm9yUGFnZShiYWNrUGFnZVNlbGVjdG9yKSB7XG4gICAgICAgIHNldFdpbmRvd1RpdGxlKE1lc3NhZ2VzLmdldE1lc3NhZ2UoJ3JlYWN0aW9uc193aWRnZXRfX3RpdGxlX2Vycm9yJykpO1xuICAgICAgICB2YXIgb3B0aW9ucyA9IHtcbiAgICAgICAgICAgIGVsZW1lbnQ6IHBhZ2VDb250YWluZXIocmFjdGl2ZSksXG4gICAgICAgICAgICBnb0JhY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHNldFdpbmRvd1RpdGxlKE1lc3NhZ2VzLmdldE1lc3NhZ2UoJ3JlYWN0aW9uc193aWRnZXRfX3RpdGxlJykpO1xuICAgICAgICAgICAgICAgIGdvQmFja1RvUGFnZShwYWdlcywgYmFja1BhZ2VTZWxlY3RvciwgJHJvb3RFbGVtZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgdmFyIHBhZ2UgPSBHZW5lcmljRXJyb3JQYWdlLmNyZWF0ZVBhZ2Uob3B0aW9ucyk7XG4gICAgICAgIHBhZ2VzLnB1c2gocGFnZSk7XG5cbiAgICAgICAgLy8gVE9ETzogcmV2aXNpdCB3aHkgd2UgbmVlZCB0byB1c2UgdGhlIHRpbWVvdXQgdHJpY2sgZm9yIHRoZSBjb25maXJtIHBhZ2UsIGJ1dCBub3QgZm9yIHRoZSBkZWZhdWx0cyBwYWdlXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IC8vIEluIG9yZGVyIGZvciB0aGUgcG9zaXRpb25pbmcgYW5pbWF0aW9uIHRvIHdvcmssIHdlIG5lZWQgdG8gbGV0IHRoZSBicm93c2VyIHJlbmRlciB0aGUgYXBwZW5kZWQgRE9NIGVsZW1lbnRcbiAgICAgICAgICAgIHNob3dQYWdlKHBhZ2Uuc2VsZWN0b3IsICRyb290RWxlbWVudCwgdHJ1ZSk7XG4gICAgICAgIH0sIDEpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGhhbmRsZVJlYWN0aW9uRXJyb3IobWVzc2FnZSwgcmV0cnlDYWxsYmFjaywgYmFja1BhZ2VTZWxlY3Rvcikge1xuICAgICAgICBpZiAobWVzc2FnZS5pbmRleE9mKCdzaWduIGluIHJlcXVpcmVkIGZvciBvcmdhbmljIHJlYWN0aW9ucycpICE9PSAtMSkge1xuICAgICAgICAgICAgc2hvd0xvZ2luUGFnZShiYWNrUGFnZVNlbGVjdG9yLCByZXRyeUNhbGxiYWNrKTtcbiAgICAgICAgfSBlbHNlIGlmIChtZXNzYWdlLmluZGV4T2YoJ0dyb3VwIGhhcyBibG9ja2VkIHRoaXMgdGFnLicpICE9PSAtMSkge1xuICAgICAgICAgICAgc2hvd0Jsb2NrZWRSZWFjdGlvblBhZ2UoYmFja1BhZ2VTZWxlY3Rvcik7XG4gICAgICAgIH0gZWxzZSBpZiAoaXNUb2tlbkVycm9yKG1lc3NhZ2UpKSB7XG4gICAgICAgICAgICBVc2VyLnJlQXV0aG9yaXplVXNlcihmdW5jdGlvbihoYXNOZXdUb2tlbikge1xuICAgICAgICAgICAgICAgIGlmIChoYXNOZXdUb2tlbikge1xuICAgICAgICAgICAgICAgICAgICByZXRyeUNhbGxiYWNrKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgc2hvd0xvZ2luUGFnZShiYWNrUGFnZVNlbGVjdG9yLCByZXRyeUNhbGxiYWNrKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiZXJyb3IgcG9zdGluZyByZWFjdGlvbjogXCIgKyBtZXNzYWdlKTtcbiAgICAgICAgICAgIHNob3dHZW5lcmljRXJyb3JQYWdlKGJhY2tQYWdlU2VsZWN0b3IpO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gaXNUb2tlbkVycm9yKG1lc3NhZ2UpIHtcbiAgICAgICAgICAgIHN3aXRjaChtZXNzYWdlKSB7XG4gICAgICAgICAgICAgICAgY2FzZSBcIlRva2VuIHdhcyBpbnZhbGlkXCI6XG4gICAgICAgICAgICAgICAgY2FzZSBcIkZhY2Vib29rIHRva2VuIGV4cGlyZWRcIjpcbiAgICAgICAgICAgICAgICBjYXNlIFwiRkIgZ3JhcGggZXJyb3IgLSB0b2tlbiBpbnZhbGlkXCI6XG4gICAgICAgICAgICAgICAgY2FzZSBcIlNvY2lhbCBBdXRoIGRvZXMgbm90IGV4aXN0IGZvciB1c2VyXCI6XG4gICAgICAgICAgICAgICAgY2FzZSBcIkRhdGEgdG8gY3JlYXRlIHRva2VuIGlzIG1pc3NpbmdcIjpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzZXRXaW5kb3dUaXRsZSh0aXRsZSkge1xuICAgICAgICAkKHJhY3RpdmUuZmluZCgnLmFudGVubmEtcmVhY3Rpb25zLXRpdGxlJykpLmh0bWwodGl0bGUpO1xuICAgIH1cblxufVxuXG5mdW5jdGlvbiByb290RWxlbWVudChyYWN0aXZlKSB7XG4gICAgcmV0dXJuIHJhY3RpdmUuZmluZChTRUxFQ1RPUl9SRUFDVElPTlNfV0lER0VUKTtcbn1cblxuZnVuY3Rpb24gcGFnZUNvbnRhaW5lcihyYWN0aXZlKSB7XG4gICAgcmV0dXJuIHJhY3RpdmUuZmluZCgnLmFudGVubmEtcGFnZS1jb250YWluZXInKTtcbn1cblxudmFyIHBhZ2VaID0gMTAwMDsgLy8gSXQncyBzYWZlIGZvciB0aGlzIHZhbHVlIHRvIGdvIGFjcm9zcyBpbnN0YW5jZXMuIFdlIGp1c3QgbmVlZCBpdCB0byBjb250aW51b3VzbHkgaW5jcmVhc2UgKG1heCB2YWx1ZSBpcyBvdmVyIDIgYmlsbGlvbikuXG5cbmZ1bmN0aW9uIHNob3dQYWdlKHBhZ2VTZWxlY3RvciwgJHJvb3RFbGVtZW50LCBhbmltYXRlLCBvdmVybGF5KSB7XG4gICAgdmFyICRwYWdlID0gJHJvb3RFbGVtZW50LmZpbmQocGFnZVNlbGVjdG9yKTtcbiAgICAkcGFnZS5jc3MoJ3otaW5kZXgnLCBwYWdlWik7XG4gICAgcGFnZVogKz0gMTtcblxuICAgICRwYWdlLnRvZ2dsZUNsYXNzKCdhbnRlbm5hLXBhZ2UtYW5pbWF0ZScsIGFuaW1hdGUpO1xuXG4gICAgdmFyICRjdXJyZW50ID0gJHJvb3RFbGVtZW50LmZpbmQoJy5hbnRlbm5hLXBhZ2UtYWN0aXZlJykubm90KHBhZ2VTZWxlY3Rvcik7XG4gICAgaWYgKG92ZXJsYXkpIHtcbiAgICAgICAgLy8gSW4gdGhlIG92ZXJsYXkgY2FzZSwgc2l6ZSB0aGUgcGFnZSB0byBtYXRjaCB3aGF0ZXZlciBwYWdlIGlzIGN1cnJlbnRseSBzaG93aW5nIGFuZCB0aGVuIG1ha2UgaXQgYWN0aXZlICh0aGVyZSB3aWxsIGJlIHR3byAnYWN0aXZlJyBwYWdlcylcbiAgICAgICAgJHBhZ2UuaGVpZ2h0KCRjdXJyZW50LmhlaWdodCgpKTtcbiAgICAgICAgJHBhZ2UuYWRkQ2xhc3MoJ2FudGVubmEtcGFnZS1hY3RpdmUnKTtcbiAgICB9IGVsc2UgaWYgKGFuaW1hdGUpIHtcbiAgICAgICAgVHJhbnNpdGlvblV0aWwudG9nZ2xlQ2xhc3MoJHBhZ2UsICdhbnRlbm5hLXBhZ2UtYWN0aXZlJywgdHJ1ZSwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAvLyBBZnRlciB0aGUgbmV3IHBhZ2Ugc2xpZGVzIGludG8gcG9zaXRpb24sIG1vdmUgdGhlIG90aGVyIHBhZ2VzIGJhY2sgb3V0IG9mIHRoZSB2aWV3YWJsZSBhcmVhXG4gICAgICAgICAgICAkY3VycmVudC5yZW1vdmVDbGFzcygnYW50ZW5uYS1wYWdlLWFjdGl2ZScpO1xuICAgICAgICAgICAgJHBhZ2UuZm9jdXMoKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHNpemVCb2R5VG9GaXQoJHJvb3RFbGVtZW50LCAkcGFnZSwgYW5pbWF0ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgJHBhZ2UuYWRkQ2xhc3MoJ2FudGVubmEtcGFnZS1hY3RpdmUnKTtcbiAgICAgICAgJGN1cnJlbnQucmVtb3ZlQ2xhc3MoJ2FudGVubmEtcGFnZS1hY3RpdmUnKTtcbiAgICAgICAgJHBhZ2UuZm9jdXMoKTtcbiAgICAgICAgc2l6ZUJvZHlUb0ZpdCgkcm9vdEVsZW1lbnQsICRwYWdlLCBhbmltYXRlKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGdvQmFja1RvUGFnZShwYWdlcywgcGFnZVNlbGVjdG9yLCAkcm9vdEVsZW1lbnQpIHtcbiAgICB2YXIgJHRhcmdldFBhZ2UgPSAkcm9vdEVsZW1lbnQuZmluZChwYWdlU2VsZWN0b3IpO1xuICAgIHZhciAkY3VycmVudFBhZ2UgPSAkcm9vdEVsZW1lbnQuZmluZCgnLmFudGVubmEtcGFnZS1hY3RpdmUnKTtcbiAgICAvLyBNb3ZlIHRoZSB0YXJnZXQgcGFnZSBpbnRvIHBsYWNlLCB1bmRlciB0aGUgY3VycmVudCBwYWdlXG4gICAgJHRhcmdldFBhZ2UuY3NzKCd6LWluZGV4JywgcGFyc2VJbnQoJGN1cnJlbnRQYWdlLmNzcygnei1pbmRleCcpKSAtIDEpO1xuICAgICR0YXJnZXRQYWdlLnRvZ2dsZUNsYXNzKCdhbnRlbm5hLXBhZ2UtYW5pbWF0ZScsIGZhbHNlKTtcbiAgICAkdGFyZ2V0UGFnZS50b2dnbGVDbGFzcygnYW50ZW5uYS1wYWdlLWFjdGl2ZScsIHRydWUpO1xuXG4gICAgLy8gVGhlbiBhbmltYXRlIHRoZSBjdXJyZW50IHBhZ2UgbW92aW5nIGF3YXkgdG8gcmV2ZWFsIHRoZSB0YXJnZXQuXG4gICAgJGN1cnJlbnRQYWdlLnRvZ2dsZUNsYXNzKCdhbnRlbm5hLXBhZ2UtYW5pbWF0ZScsIHRydWUpO1xuICAgIFRyYW5zaXRpb25VdGlsLnRvZ2dsZUNsYXNzKCRjdXJyZW50UGFnZSwgJ2FudGVubmEtcGFnZS1hY3RpdmUnLCBmYWxzZSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAvLyBBZnRlciB0aGUgY3VycmVudCBwYWdlIHNsaWRlcyBpbnRvIHBvc2l0aW9uLCBtb3ZlIGFsbCBvdGhlciBwYWdlcyBiYWNrIG91dCBvZiB0aGUgdmlld2FibGUgYXJlYVxuICAgICAgICAkcm9vdEVsZW1lbnQuZmluZCgnLmFudGVubmEtcGFnZScpLm5vdChwYWdlU2VsZWN0b3IpLnJlbW92ZUNsYXNzKCdhbnRlbm5hLXBhZ2UtYWN0aXZlJyk7XG4gICAgICAgICR0YXJnZXRQYWdlLmNzcygnei1pbmRleCcsIHBhZ2VaKyspOyAvLyBXaGVuIHRoZSBhbmltYXRpb24gaXMgZG9uZSwgbWFrZSBzdXJlIHRoZSBjdXJyZW50IHBhZ2UgaGFzIHRoZSBoaWdoZXN0IHotaW5kZXggKGp1c3QgZm9yIGNvbnNpc3RlbmN5KVxuICAgICAgICAvLyBUZWFyZG93biBhbGwgb3RoZXIgcGFnZXMuIFRoZXknbGwgYmUgcmUtY3JlYXRlZCBpZiBuZWNlc3NhcnkuXG4gICAgICAgIHZhciByZW1haW5pbmdQYWdlcyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBhZ2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgcGFnZSA9IHBhZ2VzW2ldO1xuICAgICAgICAgICAgaWYgKHBhZ2Uuc2VsZWN0b3IgPT09IHBhZ2VTZWxlY3Rvcikge1xuICAgICAgICAgICAgICAgIHJlbWFpbmluZ1BhZ2VzLnB1c2gocGFnZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHBhZ2UudGVhcmRvd24oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBwYWdlcyA9IHJlbWFpbmluZ1BhZ2VzO1xuICAgIH0pO1xuICAgIHNpemVCb2R5VG9GaXQoJHJvb3RFbGVtZW50LCAkdGFyZ2V0UGFnZSwgdHJ1ZSk7XG59XG5cbmZ1bmN0aW9uIHNpemVCb2R5VG9GaXQoJHJvb3RFbGVtZW50LCAkcGFnZSwgYW5pbWF0ZSkge1xuICAgIHZhciAkcGFnZUNvbnRhaW5lciA9ICRyb290RWxlbWVudC5maW5kKCcuYW50ZW5uYS1wYWdlLWNvbnRhaW5lcicpO1xuICAgIHZhciAkYm9keSA9ICRwYWdlLmZpbmQoJy5hbnRlbm5hLWJvZHknKTtcbiAgICB2YXIgY3VycmVudEhlaWdodCA9ICRwYWdlQ29udGFpbmVyLmNzcygnaGVpZ2h0Jyk7XG4gICAgJHBhZ2VDb250YWluZXIuY3NzKHsgaGVpZ2h0OiAnJyB9KTsgLy8gQ2xlYXIgYW55IHByZXZpb3VzbHkgY29tcHV0ZWQgaGVpZ2h0IHNvIHdlIGdldCBhIGZyZXNoIGNvbXB1dGF0aW9uIG9mIHRoZSBjaGlsZCBoZWlnaHRzXG4gICAgdmFyIG5ld0JvZHlIZWlnaHQgPSBNYXRoLm1pbigzMDAsICRib2R5LmdldCgwKS5zY3JvbGxIZWlnaHQpO1xuICAgICRib2R5LmNzcyh7IGhlaWdodDogbmV3Qm9keUhlaWdodCB9KTsgLy8gVE9ETzogZG91YmxlLWNoZWNrIHRoYXQgd2UgY2FuJ3QganVzdCBzZXQgYSBtYXgtaGVpZ2h0IG9mIDMwMHB4IG9uIHRoZSBib2R5LlxuICAgIHZhciBmb290ZXJIZWlnaHQgPSAkcGFnZS5maW5kKCcuYW50ZW5uYS1mb290ZXInKS5vdXRlckhlaWdodCgpOyAvLyByZXR1cm5zICdudWxsJyBpZiB0aGVyZSdzIG5vIGZvb3Rlci4gYWRkZWQgdG8gYW4gaW50ZWdlciwgJ251bGwnIGFjdHMgbGlrZSAwXG4gICAgdmFyIG5ld1BhZ2VIZWlnaHQgPSBuZXdCb2R5SGVpZ2h0ICsgZm9vdGVySGVpZ2h0O1xuICAgIGlmIChhbmltYXRlKSB7XG4gICAgICAgICRwYWdlQ29udGFpbmVyLmNzcyh7IGhlaWdodDogY3VycmVudEhlaWdodCB9KTtcbiAgICAgICAgJHBhZ2VDb250YWluZXIuYW5pbWF0ZSh7IGhlaWdodDogbmV3UGFnZUhlaWdodCB9LCAyMDApO1xuICAgIH0gZWxzZSB7XG4gICAgICAgICRwYWdlQ29udGFpbmVyLmNzcyh7IGhlaWdodDogbmV3UGFnZUhlaWdodCB9KTtcbiAgICB9XG4gICAgLy8gVE9ETzogd2UgbWlnaHQgbm90IG5lZWQgd2lkdGggcmVzaXppbmcgYXQgYWxsLlxuICAgIHZhciBtaW5XaWR0aCA9ICRwYWdlLmNzcygnbWluLXdpZHRoJyk7XG4gICAgdmFyIHdpZHRoID0gcGFyc2VJbnQobWluV2lkdGgpO1xuICAgIGlmICh3aWR0aCA+IDApIHtcbiAgICAgICAgaWYgKGFuaW1hdGUpIHtcbiAgICAgICAgICAgICRyb290RWxlbWVudC5hbmltYXRlKHsgd2lkdGg6IHdpZHRoIH0sIDIwMCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkcm9vdEVsZW1lbnQuY3NzKHsgd2lkdGg6IHdpZHRoIH0pO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBzZXR1cFdpbmRvd0Nsb3NlKHBhZ2VzLCByYWN0aXZlKSB7XG4gICAgdmFyICRyb290RWxlbWVudCA9ICQocm9vdEVsZW1lbnQocmFjdGl2ZSkpO1xuXG4gICAgLy8gVE9ETzogSWYgeW91IG1vdXNlIG92ZXIgdGhlIHRyaWdnZXIgc2xvd2x5IGZyb20gdGhlIHRvcCBsZWZ0LCB0aGUgd2luZG93IG9wZW5zIHdpdGhvdXQgYmVpbmcgdW5kZXIgdGhlIGN1cnNvcixcbiAgICAvLyAgICAgICBzbyBubyBtb3VzZW91dCBldmVudCBpcyByZWNlaXZlZC4gV2hlbiB3ZSBvcGVuIHRoZSB3aW5kb3csIHdlIHNob3VsZCBwcm9iYWJseSBqdXN0IHNjb290IGl0IHVwIHNsaWdodGx5XG4gICAgLy8gICAgICAgaWYgbmVlZGVkIHRvIGFzc3VyZSB0aGF0IGl0J3MgdW5kZXIgdGhlIGN1cnNvci4gQWx0ZXJuYXRpdmVseSwgd2UgY291bGQgYWRqdXN0IHRoZSBtb3VzZW92ZXIgYXJlYSB0byBtYXRjaFxuICAgIC8vICAgICAgIHRoZSByZWdpb24gdGhhdCB0aGUgd2luZG93IG9wZW5zLlxuICAgICRyb290RWxlbWVudFxuICAgICAgICAub24oJ21vdXNlb3V0LmFudGVubmEnLCBkZWxheWVkQ2xvc2VXaW5kb3cpXG4gICAgICAgIC5vbignbW91c2VvdmVyLmFudGVubmEnLCBrZWVwV2luZG93T3BlbilcbiAgICAgICAgLm9uKCdmb2N1c2luLmFudGVubmEnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIE9uY2UgdGhlIHdpbmRvdyBoYXMgZm9jdXMsIGRvbid0IGNsb3NlIGl0IG9uIG1vdXNlb3V0LlxuICAgICAgICAgICAga2VlcFdpbmRvd09wZW4oKTtcbiAgICAgICAgICAgICRyb290RWxlbWVudC5vZmYoJ21vdXNlb3V0LmFudGVubmEnKTtcbiAgICAgICAgICAgICRyb290RWxlbWVudC5vZmYoJ21vdXNlb3Zlci5hbnRlbm5hJyk7XG4gICAgICAgIH0pO1xuICAgICQoZG9jdW1lbnQpLm9uKCdjbGljay5hbnRlbm5hJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgaWYgKCQoZXZlbnQudGFyZ2V0KS5jbG9zZXN0KFNFTEVDVE9SX1JFQUNUSU9OU19XSURHRVQpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgY2xvc2VBbGxXaW5kb3dzKCk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICB2YXIgdGFwTGlzdGVuZXIgPSBUb3VjaFN1cHBvcnQuc2V0dXBUYXAoZG9jdW1lbnQsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGlmICgkKGV2ZW50LnRhcmdldCkuY2xvc2VzdChTRUxFQ1RPUl9SRUFDVElPTlNfV0lER0VUKS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIGNsb3NlQWxsV2luZG93cygpO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICB2YXIgY2xvc2VUaW1lcjtcblxuICAgIGZ1bmN0aW9uIGRlbGF5ZWRDbG9zZVdpbmRvdygpIHtcbiAgICAgICAgY2xvc2VUaW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBjbG9zZVRpbWVyID0gbnVsbDtcbiAgICAgICAgICAgIGNsb3NlQWxsV2luZG93cygpO1xuICAgICAgICB9LCA1MDApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGtlZXBXaW5kb3dPcGVuKCkge1xuICAgICAgICBjbGVhclRpbWVvdXQoY2xvc2VUaW1lcik7XG4gICAgfVxuXG4gICAgcmFjdGl2ZS5vbignaW50ZXJuYWxDbG9zZVdpbmRvdycsIGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBDbG9zZXMgb25lIHBhcnRpY3VsYXIgcmVhY3Rpb24gd2luZG93LiBUaGlzIGZ1bmN0aW9uIHNob3VsZCBvbmx5IGJlIGNhbGxlZCBmcm9tIGNsb3NlQWxsV2luZG93cywgd2hpY2ggYWxzb1xuICAgICAgICAvLyBjbGVhbnMgdXAgdGhlIGhhbmRsZXMgd2UgbWFpbnRhaW4gdG8gYWxsIHdpbmRvd3MuXG4gICAgICAgIGNsZWFyVGltZW91dChjbG9zZVRpbWVyKTtcblxuICAgICAgICAkcm9vdEVsZW1lbnQuc3RvcCh0cnVlLCB0cnVlKS5mYWRlT3V0KCdmYXN0JywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAkcm9vdEVsZW1lbnQuY3NzKCdkaXNwbGF5JywgJycpOyAvLyBDbGVhciB0aGUgZGlzcGxheTpub25lIHRoYXQgZmFkZU91dCBwdXRzIG9uIHRoZSBlbGVtZW50XG4gICAgICAgICAgICAkcm9vdEVsZW1lbnQucmVtb3ZlQ2xhc3MoJ2FudGVubmEtcmVhY3Rpb25zLW9wZW4nKTtcblxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYWdlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHBhZ2VzW2ldLnRlYXJkb3duKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByYWN0aXZlLnRlYXJkb3duKCk7XG4gICAgICAgIH0pO1xuICAgICAgICBSYW5nZS5jbGVhckhpZ2hsaWdodHMoKTtcbiAgICAgICAgJHJvb3RFbGVtZW50Lm9mZignLmFudGVubmEnKTsgLy8gVW5iaW5kIGFsbCBvZiB0aGUgaGFuZGxlcnMgaW4gb3VyIG5hbWVzcGFjZVxuICAgICAgICAkKGRvY3VtZW50KS5vZmYoJ2NsaWNrLmFudGVubmEnKTtcbiAgICAgICAgdGFwTGlzdGVuZXIudGVhcmRvd24oKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gY2xvc2VBbGxXaW5kb3dzKCkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb3Blbkluc3RhbmNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBvcGVuSW5zdGFuY2VzW2ldLmZpcmUoJ2ludGVybmFsQ2xvc2VXaW5kb3cnKTtcbiAgICB9XG4gICAgb3Blbkluc3RhbmNlcyA9IFtdO1xufVxuXG5mdW5jdGlvbiBpc09wZW5XaW5kb3coKSB7XG4gICAgcmV0dXJuIG9wZW5JbnN0YW5jZXMubGVuZ3RoID4gMDtcbn1cblxuLy8gUHJldmVudCBzY3JvbGxpbmcgb2YgdGhlIGRvY3VtZW50IGFmdGVyIHdlIHNjcm9sbCB0byB0aGUgdG9wL2JvdHRvbSBvZiB0aGUgcmVhY3Rpb25zIHdpbmRvd1xuLy8gQ29kZSBjb3BpZWQgZnJvbTogaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy81ODAyNDY3L3ByZXZlbnQtc2Nyb2xsaW5nLW9mLXBhcmVudC1lbGVtZW50XG4vLyBUT0RPOiBkb2VzIHRoaXMgd29yayBvbiBtb2JpbGU/XG5mdW5jdGlvbiBwcmV2ZW50RXh0cmFTY3JvbGwoJHJvb3RFbGVtZW50KSB7XG4gICAgJHJvb3RFbGVtZW50Lm9uKCdET01Nb3VzZVNjcm9sbC5hbnRlbm5hIG1vdXNld2hlZWwuYW50ZW5uYScsICcuYW50ZW5uYS1ib2R5JywgZnVuY3Rpb24oZXYpIHtcbiAgICAgICAgdmFyICR0aGlzID0gJCh0aGlzKSxcbiAgICAgICAgICAgIHNjcm9sbFRvcCA9IHRoaXMuc2Nyb2xsVG9wLFxuICAgICAgICAgICAgc2Nyb2xsSGVpZ2h0ID0gdGhpcy5zY3JvbGxIZWlnaHQsXG4gICAgICAgICAgICBoZWlnaHQgPSAkdGhpcy5oZWlnaHQoKSxcbiAgICAgICAgICAgIGRlbHRhID0gKGV2LnR5cGUgPT0gJ0RPTU1vdXNlU2Nyb2xsJyA/XG4gICAgICAgICAgICAgICAgZXYub3JpZ2luYWxFdmVudC5kZXRhaWwgKiAtNDAgOlxuICAgICAgICAgICAgICAgIGV2Lm9yaWdpbmFsRXZlbnQud2hlZWxEZWx0YSksXG4gICAgICAgICAgICB1cCA9IGRlbHRhID4gMDtcblxuICAgICAgICBpZiAoc2Nyb2xsSGVpZ2h0IDw9IGhlaWdodCkge1xuICAgICAgICAgICAgLy8gVGhpcyBpcyBhbiBhZGRpdGlvbiB0byB0aGUgU3RhY2tPdmVyZmxvdyBjb2RlLCB0byBtYWtlIHN1cmUgdGhlIHBhZ2Ugc2Nyb2xscyBhcyB1c3VhbCBpZiB0aGUgd2luZG93XG4gICAgICAgICAgICAvLyBjb250ZW50IGRvZXNuJ3Qgc2Nyb2xsLlxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHByZXZlbnQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGV2LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgZXYucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIGV2LnJldHVyblZhbHVlID0gZmFsc2U7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKCF1cCAmJiAtZGVsdGEgPiBzY3JvbGxIZWlnaHQgLSBoZWlnaHQgLSBzY3JvbGxUb3ApIHtcbiAgICAgICAgICAgIC8vIFNjcm9sbGluZyBkb3duLCBidXQgdGhpcyB3aWxsIHRha2UgdXMgcGFzdCB0aGUgYm90dG9tLlxuICAgICAgICAgICAgJHRoaXMuc2Nyb2xsVG9wKHNjcm9sbEhlaWdodCk7XG4gICAgICAgICAgICByZXR1cm4gcHJldmVudCgpO1xuICAgICAgICB9IGVsc2UgaWYgKHVwICYmIGRlbHRhID4gc2Nyb2xsVG9wKSB7XG4gICAgICAgICAgICAvLyBTY3JvbGxpbmcgdXAsIGJ1dCB0aGlzIHdpbGwgdGFrZSB1cyBwYXN0IHRoZSB0b3AuXG4gICAgICAgICAgICAkdGhpcy5zY3JvbGxUb3AoMCk7XG4gICAgICAgICAgICByZXR1cm4gcHJldmVudCgpO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBvcGVuOiBvcGVuUmVhY3Rpb25zV2lkZ2V0LFxuICAgIGlzT3BlbjogaXNPcGVuV2luZG93LFxuICAgIFBBR0VfUkVBQ1RJT05TOiBQQUdFX1JFQUNUSU9OUyxcbiAgICBQQUdFX0RFRkFVTFRTOiBQQUdFX0RFRkFVTFRTLFxuICAgIFBBR0VfQVVUTzogUEFHRV9BVVRPLFxuICAgIHNlbGVjdG9yOiBTRUxFQ1RPUl9SRUFDVElPTlNfV0lER0VULFxuICAgIHRlYXJkb3duOiBjbG9zZUFsbFdpbmRvd3Ncbn07IiwidmFyIEdyb3VwU2V0dGluZ3MgPSByZXF1aXJlKCcuL2dyb3VwLXNldHRpbmdzJyk7XG52YXIgSGFzaGVkRWxlbWVudHMgPSByZXF1aXJlKCcuL2hhc2hlZC1lbGVtZW50cycpO1xudmFyIFBhZ2VEYXRhID0gcmVxdWlyZSgnLi9wYWdlLWRhdGEnKTtcbnZhciBQYWdlRGF0YUxvYWRlciA9IHJlcXVpcmUoJy4vcGFnZS1kYXRhLWxvYWRlcicpO1xudmFyIFBhZ2VTY2FubmVyID0gcmVxdWlyZSgnLi9wYWdlLXNjYW5uZXInKTtcbnZhciBQb3B1cFdpZGdldCA9IHJlcXVpcmUoJy4vcG9wdXAtd2lkZ2V0Jyk7XG52YXIgUmVhY3Rpb25zV2lkZ2V0ID0gcmVxdWlyZSgnLi9yZWFjdGlvbnMtd2lkZ2V0Jyk7XG5cbnZhciBNdXRhdGlvbk9ic2VydmVyID0gcmVxdWlyZSgnLi91dGlscy9tdXRhdGlvbi1vYnNlcnZlcicpO1xuXG5mdW5jdGlvbiByZWluaXRpYWxpemVBbGwoKSB7XG4gICAgdmFyIGdyb3VwU2V0dGluZ3MgPSBHcm91cFNldHRpbmdzLmdldCgpO1xuICAgIGlmIChncm91cFNldHRpbmdzKSB7XG4gICAgICAgIHJlaW5pdGlhbGl6ZShncm91cFNldHRpbmdzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmxvZygnQW50ZW5uYSBjYW5ub3QgYmUgcmVpbml0aWFsaXplZC4gR3JvdXAgc2V0dGluZ3MgYXJlIG5vdCBsb2FkZWQuJyk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiByZWluaXRpYWxpemUoZ3JvdXBTZXR0aW5ncykge1xuICAgIFJlYWN0aW9uc1dpZGdldC50ZWFyZG93bigpO1xuICAgIFBvcHVwV2lkZ2V0LnRlYXJkb3duKCk7XG4gICAgUGFnZVNjYW5uZXIudGVhcmRvd24oKTtcbiAgICBQYWdlRGF0YS50ZWFyZG93bigpO1xuICAgIEhhc2hlZEVsZW1lbnRzLnRlYXJkb3duKCk7XG4gICAgTXV0YXRpb25PYnNlcnZlci50ZWFyZG93bigpO1xuXG4gICAgUGFnZURhdGFMb2FkZXIubG9hZChncm91cFNldHRpbmdzKTtcbiAgICBQYWdlU2Nhbm5lci5zY2FuKGdyb3VwU2V0dGluZ3MpO1xuXG4gICAgc2V0dXBSZWluaXRpYWxpemF0aW9uKGdyb3VwU2V0dGluZ3MpOyAvLyBuZWVkIHRvIHNldHVwIGFnYWluIGFmdGVyIHRlYXJpbmcgZG93biB0aGUgbXV0YXRpb24gb2JzZXJ2ZXIuXG59XG5cbmZ1bmN0aW9uIHNldHVwUmVpbml0aWFsaXphdGlvbihncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGJyb3dzZXJVcmwgPSBjb21wdXRlQnJvd3NlclVybChncm91cFNldHRpbmdzKTtcbiAgICBNdXRhdGlvbk9ic2VydmVyLmFkZEFkZGl0aW9uTGlzdGVuZXIoZnVuY3Rpb24oJGVsZW1lbnRzKSB7XG4gICAgICAgIHZhciBuZXdCcm93c2VyVXJsID0gY29tcHV0ZUJyb3dzZXJVcmwoZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIGlmIChicm93c2VyVXJsICE9IG5ld0Jyb3dzZXJVcmwpIHtcbiAgICAgICAgICAgIGJyb3dzZXJVcmwgPSBuZXdCcm93c2VyVXJsO1xuICAgICAgICAgICAgcmVpbml0aWFsaXplKGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICB9XG4gICAgfSk7XG5cblxuICAgIGZ1bmN0aW9uIGNvbXB1dGVCcm93c2VyVXJsKGdyb3VwU2V0dGluZ3MpIHtcbiAgICAgICAgLy8gV2UgbWFudWFsbHkgY29uc3RydWN0IHRoZSBVUkwgc28gdGhhdCB3ZSBjYW4gbGVhdmUgb3V0IHRoZSBzZWFyY2ggYW5kIGhhc2ggcG9ydGlvbnMuXG4gICAgICAgIHZhciBwb3J0ID0gKHdpbmRvdy5sb2NhdGlvbi5wb3J0ID8gJzonICsgd2luZG93LmxvY2F0aW9uLnBvcnQgOiAnJyk7XG4gICAgICAgIHZhciBxdWVyeSA9IGdyb3VwU2V0dGluZ3MudXJsLmluY2x1ZGVRdWVyeVN0cmluZygpICYmIHdpbmRvdy5sb2NhdGlvbi5zZWFyY2ggPyB3aW5kb3cubG9jYXRpb24uc2VhcmNoIDogJyc7XG4gICAgICAgIHJldHVybiAod2luZG93LmxvY2F0aW9uLnByb3RvY29sICsgJy8vJyArIHdpbmRvdy5sb2NhdGlvbi5ob3N0bmFtZSArIHBvcnQgKyB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUpLnRvTG93ZXJDYXNlKCkgKyBxdWVyeTtcbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHNldHVwUmVpbml0aWFsaXphdGlvbjogc2V0dXBSZWluaXRpYWxpemF0aW9uLFxuICAgIHJlaW5pdGlhbGl6ZUFsbDogcmVpbml0aWFsaXplQWxsXG59OyIsInZhciBSYWN0aXZlUHJvdmlkZXIgPSByZXF1aXJlKCcuL3V0aWxzL3JhY3RpdmUtcHJvdmlkZXInKTtcbnZhciBSYW5neVByb3ZpZGVyID0gcmVxdWlyZSgnLi91dGlscy9yYW5neS1wcm92aWRlcicpO1xudmFyIEpRdWVyeVByb3ZpZGVyID0gcmVxdWlyZSgnLi91dGlscy9qcXVlcnktcHJvdmlkZXInKTtcbnZhciBBcHBNb2RlID0gcmVxdWlyZSgnLi91dGlscy9hcHAtbW9kZScpO1xudmFyIFVSTHMgPSByZXF1aXJlKCcuL3V0aWxzL3VybHMnKTtcblxudmFyIHNjcmlwdHMgPSBbXG4gICAge3NyYzogJy8vY2RuanMuY2xvdWRmbGFyZS5jb20vYWpheC9saWJzL2pxdWVyeS8yLjEuNC9qcXVlcnkubWluLmpzJywgY2FsbGJhY2s6IEpRdWVyeVByb3ZpZGVyLmxvYWRlZH0sXG4gICAgLy8gVE9ETyBtaW5pZnkgb3VyIGNvbXBpbGVkIFJhY3RpdmUgYW5kIGhvc3QgaXQgb24gYSBDRE5cbiAgICB7c3JjOiBVUkxzLmFtYXpvblMzVXJsKCkgKyAnL3dpZGdldC1uZXcvbGliL3JhY3RpdmUucnVudGltZS0wLjcuMy5taW4uanMnLCBjYWxsYmFjazogUmFjdGl2ZVByb3ZpZGVyLmxvYWRlZCwgYWJvdXRUb0xvYWQ6IFJhY3RpdmVQcm92aWRlci5hYm91dFRvTG9hZH0sXG4gICAgLy8gVE9ETyBtaW5pZnkgb3VyIGNvbXBpbGVkIFJhbmR5IGFuZCBob3N0IGl0IG9uIGEgQ0ROXG4gICAge3NyYzogVVJMcy5hbWF6b25TM1VybCgpICsgJy93aWRnZXQtbmV3L2xpYi9yYW5neS5jb21waWxlZC0xLjMuMC5taW4uanMnLCBjYWxsYmFjazogUmFuZ3lQcm92aWRlci5sb2FkZWQsIGFib3V0VG9Mb2FkOiBSYW5neVByb3ZpZGVyLmFib3V0VG9Mb2FkfVxuXTtcbmlmIChBcHBNb2RlLm9mZmxpbmUpIHtcbiAgICAvLyBVc2UgdGhlIG9mZmxpbmUgdmVyc2lvbnMgb2YgdGhlIGxpYnJhcmllcyBmb3IgZGV2ZWxvcG1lbnQuXG4gICAgc2NyaXB0cyA9IFtcbiAgICAgICAge3NyYzogVVJMcy5hcHBTZXJ2ZXJVcmwoKSArICcvc3RhdGljL2pzL2Nkbi9qcXVlcnkvMi4xLjQvanF1ZXJ5LmpzJywgY2FsbGJhY2s6IEpRdWVyeVByb3ZpZGVyLmxvYWRlZH0sXG4gICAgICAgIHtzcmM6IFVSTHMuYXBwU2VydmVyVXJsKCkgKyAnL3N0YXRpYy93aWRnZXQtbmV3L2xpYi9yYWN0aXZlLnJ1bnRpbWUtMC43LjMuanMnLCBjYWxsYmFjazogUmFjdGl2ZVByb3ZpZGVyLmxvYWRlZCwgYWJvdXRUb0xvYWQ6IFJhY3RpdmVQcm92aWRlci5hYm91dFRvTG9hZH0sXG4gICAgICAgIHtzcmM6IFVSTHMuYXBwU2VydmVyVXJsKCkgKyAnL3N0YXRpYy93aWRnZXQtbmV3L2xpYi9yYW5neS5jb21waWxlZC0xLjMuMC5qcycsIGNhbGxiYWNrOiBSYW5neVByb3ZpZGVyLmxvYWRlZCwgYWJvdXRUb0xvYWQ6IFJhbmd5UHJvdmlkZXIuYWJvdXRUb0xvYWR9XG4gICAgXTtcbn1cblxuZnVuY3Rpb24gbG9hZEFsbFNjcmlwdHMobG9hZGVkQ2FsbGJhY2spIHtcbiAgICBsb2FkU2NyaXB0cyhzY3JpcHRzLCBsb2FkZWRDYWxsYmFjayk7XG59XG5cbmZ1bmN0aW9uIGxvYWRTY3JpcHRzKHNjcmlwdHMsIGxvYWRlZENhbGxiYWNrKSB7XG4gICAgdmFyIGxvYWRpbmdDb3VudCA9IHNjcmlwdHMubGVuZ3RoO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2NyaXB0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgc2NyaXB0ID0gc2NyaXB0c1tpXTtcbiAgICAgICAgaWYgKHNjcmlwdC5hYm91dFRvTG9hZCkgeyBzY3JpcHQuYWJvdXRUb0xvYWQoKTsgfVxuICAgICAgICBsb2FkU2NyaXB0KHNjcmlwdC5zcmMsIGZ1bmN0aW9uKHNjcmlwdENhbGxiYWNrKSB7XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNjcmlwdENhbGxiYWNrKSBzY3JpcHRDYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgIGxvYWRpbmdDb3VudCA9IGxvYWRpbmdDb3VudCAtIDE7XG4gICAgICAgICAgICAgICAgaWYgKGxvYWRpbmdDb3VudCA9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChsb2FkZWRDYWxsYmFjaykgbG9hZGVkQ2FsbGJhY2soKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICB9IChzY3JpcHQuY2FsbGJhY2spKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGxvYWRTY3JpcHQoc3JjLCBjYWxsYmFjaykge1xuICAgIHZhciBoZWFkID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKVswXTtcbiAgICBpZiAoaGVhZCkge1xuICAgICAgICB2YXIgc2NyaXB0VGFnID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XG4gICAgICAgIHNjcmlwdFRhZy5zZXRBdHRyaWJ1dGUoJ3NyYycsIHNyYyk7XG4gICAgICAgIHNjcmlwdFRhZy5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCd0ZXh0L2phdmFzY3JpcHQnKTtcblxuICAgICAgICBpZiAoc2NyaXB0VGFnLnJlYWR5U3RhdGUpIHsgLy8gSUUsIGluY2wuIElFOVxuICAgICAgICAgICAgc2NyaXB0VGFnLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmIChzY3JpcHRUYWcucmVhZHlTdGF0ZSA9PSBcImxvYWRlZFwiIHx8IHNjcmlwdFRhZy5yZWFkeVN0YXRlID09IFwiY29tcGxldGVcIikge1xuICAgICAgICAgICAgICAgICAgICBzY3JpcHRUYWcub25yZWFkeXN0YXRlY2hhbmdlID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNhbGxiYWNrKSB7IGNhbGxiYWNrKCk7IH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2NyaXB0VGFnLm9ubG9hZCA9IGZ1bmN0aW9uKCkgeyAvLyBPdGhlciBicm93c2Vyc1xuICAgICAgICAgICAgICAgIGlmIChjYWxsYmFjaykgeyBjYWxsYmFjaygpOyB9XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgaGVhZC5hcHBlbmRDaGlsZChzY3JpcHRUYWcpO1xuICAgIH1cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGxvYWQ6IGxvYWRBbGxTY3JpcHRzXG59OyIsInZhciAkOyByZXF1aXJlKCcuL3V0aWxzL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIEJyb3dzZXJNZXRyaWNzID0gcmVxdWlyZSgnLi91dGlscy9icm93c2VyLW1ldHJpY3MnKTtcbnZhciBSYWN0aXZlOyByZXF1aXJlKCcuL3V0aWxzL3JhY3RpdmUtcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24obG9hZGVkUmFjdGl2ZSkgeyBSYWN0aXZlID0gbG9hZGVkUmFjdGl2ZTt9KTtcbnZhciBUb3VjaFN1cHBvcnQgPSByZXF1aXJlKCcuL3V0aWxzL3RvdWNoLXN1cHBvcnQnKTtcblxudmFyIFJlYWN0aW9uc1dpZGdldCA9IHJlcXVpcmUoJy4vcmVhY3Rpb25zLXdpZGdldCcpO1xudmFyIFNWR3MgPSByZXF1aXJlKCcuL3N2Z3MnKTtcblxuZnVuY3Rpb24gY3JlYXRlU3VtbWFyeVdpZGdldChjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgZGVmYXVsdFJlYWN0aW9ucywgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciByYWN0aXZlID0gUmFjdGl2ZSh7XG4gICAgICAgIGVsOiAkKCc8ZGl2PicpLCAvLyB0aGUgcmVhbCByb290IG5vZGUgaXMgaW4gdGhlIHRlbXBsYXRlLiBpdCdzIGV4dHJhY3RlZCBhZnRlciB0aGUgdGVtcGxhdGUgaXMgcmVuZGVyZWQgaW50byB0aGlzIGR1bW15IGVsZW1lbnRcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgcGFnZURhdGE6IHBhZ2VEYXRhLFxuICAgICAgICAgICAgY29tcHV0ZUV4cGFuZGVkUmVhY3Rpb25zOiBjb21wdXRlRXhwYW5kZWRSZWFjdGlvbnMoZ3JvdXBTZXR0aW5ncylcbiAgICAgICAgfSxcbiAgICAgICAgbWFnaWM6IHRydWUsXG4gICAgICAgIHRlbXBsYXRlOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvc3VtbWFyeS13aWRnZXQuaGJzLmh0bWwnKSxcbiAgICAgICAgcGFydGlhbHM6IHtcbiAgICAgICAgICAgIGxvZ286IFNWR3MubG9nb1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgdmFyICRyb290RWxlbWVudCA9ICQocm9vdEVsZW1lbnQocmFjdGl2ZSkpO1xuICAgICRyb290RWxlbWVudC5vbignbW91c2VlbnRlcicsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgb3BlblJlYWN0aW9uc1dpbmRvdyhjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgZGVmYXVsdFJlYWN0aW9ucywgZ3JvdXBTZXR0aW5ncywgcmFjdGl2ZSk7XG4gICAgfSk7XG4gICAgVG91Y2hTdXBwb3J0LnNldHVwVGFwKCRyb290RWxlbWVudC5nZXQoMCksIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGlmICghUmVhY3Rpb25zV2lkZ2V0LmlzT3BlbigpKSB7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICBvcGVuUmVhY3Rpb25zV2luZG93KGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBkZWZhdWx0UmVhY3Rpb25zLCBncm91cFNldHRpbmdzLCByYWN0aXZlKTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiB7XG4gICAgICAgIGVsZW1lbnQ6ICRyb290RWxlbWVudCxcbiAgICAgICAgdGVhcmRvd246IGZ1bmN0aW9uKCkgeyByYWN0aXZlLnRlYXJkb3duKCk7IH1cbiAgICB9O1xufVxuXG5mdW5jdGlvbiByb290RWxlbWVudChyYWN0aXZlKSB7XG4gICAgcmV0dXJuIHJhY3RpdmUuZmluZCgnLmFudGVubmEtc3VtbWFyeS13aWRnZXQnKTtcbn1cblxuZnVuY3Rpb24gb3BlblJlYWN0aW9uc1dpbmRvdyhjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgZGVmYXVsdFJlYWN0aW9ucywgZ3JvdXBTZXR0aW5ncywgcmFjdGl2ZSkge1xuICAgIHZhciByZWFjdGlvbnNXaWRnZXRPcHRpb25zID0ge1xuICAgICAgICBpc1N1bW1hcnk6IHRydWUsXG4gICAgICAgIHJlYWN0aW9uc0RhdGE6IHBhZ2VEYXRhLnN1bW1hcnlSZWFjdGlvbnMsXG4gICAgICAgIGNvbnRhaW5lckRhdGE6IGNvbnRhaW5lckRhdGEsXG4gICAgICAgIGRlZmF1bHRSZWFjdGlvbnM6IGRlZmF1bHRSZWFjdGlvbnMsXG4gICAgICAgIHBhZ2VEYXRhOiBwYWdlRGF0YSxcbiAgICAgICAgZ3JvdXBTZXR0aW5nczogZ3JvdXBTZXR0aW5ncyxcbiAgICAgICAgY29udGVudERhdGE6IHsgdHlwZTogJ3BhZ2UnLCBib2R5OiAnJyB9XG4gICAgfTtcbiAgICBSZWFjdGlvbnNXaWRnZXQub3BlbihyZWFjdGlvbnNXaWRnZXRPcHRpb25zLCByb290RWxlbWVudChyYWN0aXZlKSk7XG59XG5cbmZ1bmN0aW9uIHNob3VsZFVzZUV4cGFuZGVkU3VtbWFyeShncm91cFNldHRpbmdzKSB7XG4gICAgcmV0dXJuIGdyb3VwU2V0dGluZ3MuaXNFeHBhbmRlZE1vYmlsZVN1bW1hcnkoKSAmJiBCcm93c2VyTWV0cmljcy5pc01vYmlsZSgpO1xufVxuXG5mdW5jdGlvbiBjb21wdXRlRXhwYW5kZWRSZWFjdGlvbnMoZ3JvdXBTZXR0aW5ncykge1xuICAgIHJldHVybiBmdW5jdGlvbihyZWFjdGlvbnNEYXRhKSB7XG4gICAgICAgIGlmIChzaG91bGRVc2VFeHBhbmRlZFN1bW1hcnkoZ3JvdXBTZXR0aW5ncykpIHtcbiAgICAgICAgICAgIHZhciBkZWZhdWx0UmVhY3Rpb25zID0gZ3JvdXBTZXR0aW5ncy5kZWZhdWx0UmVhY3Rpb25zKCk7XG4gICAgICAgICAgICB2YXIgbWF4ID0gMjtcbiAgICAgICAgICAgIHZhciBleHBhbmRlZFJlYWN0aW9ucyA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZWFjdGlvbnNEYXRhLmxlbmd0aCAmJiBleHBhbmRlZFJlYWN0aW9ucy5sZW5ndGggPCBtYXg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciByZWFjdGlvbkRhdGEgPSByZWFjdGlvbnNEYXRhW2ldO1xuICAgICAgICAgICAgICAgIGlmIChpc0RlZmF1bHRSZWFjdGlvbihyZWFjdGlvbkRhdGEsIGRlZmF1bHRSZWFjdGlvbnMpKSB7XG4gICAgICAgICAgICAgICAgICAgIGV4cGFuZGVkUmVhY3Rpb25zLnB1c2gocmVhY3Rpb25EYXRhKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZXhwYW5kZWRSZWFjdGlvbnM7XG4gICAgICAgIH1cbiAgICB9O1xufVxuXG5mdW5jdGlvbiBpc0RlZmF1bHRSZWFjdGlvbihyZWFjdGlvbkRhdGEsIGRlZmF1bHRSZWFjdGlvbnMpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRlZmF1bHRSZWFjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGRlZmF1bHRSZWFjdGlvbnNbaV0udGV4dCA9PT0gcmVhY3Rpb25EYXRhLnRleHQpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZTogY3JlYXRlU3VtbWFyeVdpZGdldFxufTsiLCJ2YXIgUmFjdGl2ZTsgcmVxdWlyZSgnLi91dGlscy9yYWN0aXZlLXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGxvYWRlZFJhY3RpdmUpIHsgUmFjdGl2ZSA9IGxvYWRlZFJhY3RpdmU7fSk7XG5cbi8vIEFib3V0IGhvdyB3ZSBoYW5kbGUgaWNvbnM6IFdlIGluc2VydCBhIHNpbmdsZSBTVkcgZWxlbWVudCBhdCB0aGUgdG9wIG9mIHRoZSBib2R5IGVsZW1lbnQgd2hpY2ggZGVmaW5lcyBhbGwgb2YgdGhlXG4vLyBpY29ucyB3ZSBuZWVkLiBUaGVuIGFsbCBpY29ucyB1c2VkIGJ5IHRoZSBhcHBsaWNhdGlvbnMgYXJlIHJlbmRlcmVkIHdpdGggdmVyeSBsaWdodHdlaWdodCBTVkcgZWxlbWVudHMgdGhhdCBzaW1wbHlcbi8vIHBvaW50IHRvIHRoZSBhcHByb3ByaWF0ZSBpY29uIGJ5IHJlZmVyZW5jZS5cblxuLy8gVE9ETzogbG9vayBpbnRvIHVzaW5nIGEgc2luZ2xlIHRlbXBsYXRlIGZvciB0aGUgXCJ1c2VcIiBTVkdzLiBDYW4gd2UgaW5zdGFudGlhdGUgYSBwYXJ0aWFsIHdpdGggYSBkeW5hbWljIGNvbnRleHQ/XG52YXIgdGVtcGxhdGVzID0ge1xuICAgIGxvZ286IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9zdmctbG9nby5oYnMuaHRtbCcpLFxuICAgIC8vIFRoZSBcInNlbGVjdGFibGVcIiBsb2dvIGRlZmluZXMgYW4gaW5saW5lICdwYXRoJyByYXRoZXIgdGhhbiBhICd1c2UnIHJlZmVyZW5jZSwgYXMgYSB3b3JrYXJvdW5kIGZvciBhIEZpcmVmb3ggdGV4dCBzZWxlY3Rpb24gYnVnLlxuICAgIGxvZ29TZWxlY3RhYmxlOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvc3ZnLWxvZ28tc2VsZWN0YWJsZS5oYnMuaHRtbCcpLFxuICAgIGNvbW1lbnRzOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvc3ZnLWNvbW1lbnRzLmhicy5odG1sJyksXG4gICAgbG9jYXRpb246IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9zdmctbG9jYXRpb24uaGJzLmh0bWwnKSxcbiAgICBmYWNlYm9vazogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL3N2Zy1mYWNlYm9vay5oYnMuaHRtbCcpLFxuICAgIHR3aXR0ZXI6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9zdmctdHdpdHRlci5oYnMuaHRtbCcpLFxuICAgIGxlZnQ6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9zdmctbGVmdC5oYnMuaHRtbCcpLFxuICAgIGZpbG06IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9zdmctZmlsbS5oYnMuaHRtbCcpXG59O1xuXG52YXIgaXNTZXR1cCA9IGZhbHNlO1xuXG5mdW5jdGlvbiBlbnN1cmVTZXR1cCgpIHtcbiAgICBpZiAoIWlzU2V0dXApIHtcbiAgICAgICAgdmFyIGR1bW15ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIFJhY3RpdmUoe1xuICAgICAgICAgICAgZWw6IGR1bW15LFxuICAgICAgICAgICAgdGVtcGxhdGU6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9zdmdzLmhicy5odG1sJylcbiAgICAgICAgfSk7XG4gICAgICAgIC8vIFNhZmFyaSBvbiBpT1MgcmVxdWlyZXMgdGhlIFNWRyB0aGF0IGRlZmluZXMgdGhlIGljb25zIGFwcGVhciBiZWZvcmUgdGhlIFNWR3MgdGhhdCByZWZlcmVuY2UgaXQuXG4gICAgICAgIGRvY3VtZW50LmJvZHkuaW5zZXJ0QmVmb3JlKGR1bW15LmNoaWxkcmVuWzBdLCBkb2N1bWVudC5ib2R5LmZpcnN0Q2hpbGQpO1xuICAgICAgICBpc1NldHVwID0gdHJ1ZTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGdldFNWRyh0ZW1wbGF0ZSkge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgZW5zdXJlU2V0dXAoKTtcbiAgICAgICAgcmV0dXJuIHRlbXBsYXRlO1xuICAgIH1cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGxvZ286IGdldFNWRyh0ZW1wbGF0ZXMubG9nbyksXG4gICAgbG9nb1NlbGVjdGFibGU6IGdldFNWRyh0ZW1wbGF0ZXMubG9nb1NlbGVjdGFibGUpLFxuICAgIGNvbW1lbnRzOiBnZXRTVkcodGVtcGxhdGVzLmNvbW1lbnRzKSxcbiAgICBsb2NhdGlvbjogZ2V0U1ZHKHRlbXBsYXRlcy5sb2NhdGlvbiksXG4gICAgZmFjZWJvb2s6IGdldFNWRyh0ZW1wbGF0ZXMuZmFjZWJvb2spLFxuICAgIHR3aXR0ZXI6IGdldFNWRyh0ZW1wbGF0ZXMudHdpdHRlciksXG4gICAgbGVmdDogZ2V0U1ZHKHRlbXBsYXRlcy5sZWZ0KSxcbiAgICBmaWxtOiBnZXRTVkcodGVtcGxhdGVzLmZpbG0pXG59OyIsInZhciBSYWN0aXZlOyByZXF1aXJlKCcuL3V0aWxzL3JhY3RpdmUtcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24obG9hZGVkUmFjdGl2ZSkgeyBSYWN0aXZlID0gbG9hZGVkUmFjdGl2ZTt9KTtcbnZhciBCcm93c2VyTWV0cmljcyA9IHJlcXVpcmUoJy4vdXRpbHMvYnJvd3Nlci1tZXRyaWNzJyk7XG52YXIgU1ZHcyA9IHJlcXVpcmUoJy4vc3ZncycpO1xudmFyIFdpZGdldEJ1Y2tldCA9IHJlcXVpcmUoJy4vdXRpbHMvd2lkZ2V0LWJ1Y2tldCcpO1xuXG5mdW5jdGlvbiBzZXR1cEhlbHBlcihncm91cFNldHRpbmdzKSB7XG4gICAgaWYgKCFpc0Rpc21pc3NlZCgpICYmICFncm91cFNldHRpbmdzLmlzSGlkZVRhcEhlbHBlcigpICYmIEJyb3dzZXJNZXRyaWNzLnN1cHBvcnRzVG91Y2goKSkge1xuICAgICAgICB2YXIgcmFjdGl2ZSA9IFJhY3RpdmUoe1xuICAgICAgICAgICAgZWw6IFdpZGdldEJ1Y2tldC5nZXQoKSxcbiAgICAgICAgICAgIGFwcGVuZDogdHJ1ZSxcbiAgICAgICAgICAgIGRhdGE6IHt9LFxuICAgICAgICAgICAgdGVtcGxhdGU6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy90YXAtaGVscGVyLmhicy5odG1sJyksXG4gICAgICAgICAgICBwYXJ0aWFsczoge1xuICAgICAgICAgICAgICAgIGxvZ286IFNWR3MubG9nb1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmFjdGl2ZS5vbignZGlzbWlzcycsIGRpc21pc3MpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRpc21pc3MoKSB7XG4gICAgICAgIHJhY3RpdmUudGVhcmRvd24oKTtcbiAgICAgICAgc2V0RGlzbWlzc2VkKHRydWUpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gc2V0RGlzbWlzc2VkKGRpc21pc3NlZCkge1xuICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdoaWRlRG91YmxlVGFwTWVzc2FnZScsIGRpc21pc3NlZCk7XG59XG5cbmZ1bmN0aW9uIGlzRGlzbWlzc2VkKCkge1xuICAgIHJldHVybiBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnaGlkZURvdWJsZVRhcE1lc3NhZ2UnKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgc2V0dXBIZWxwZXI6IHNldHVwSGVscGVyXG59OyIsInZhciAkOyByZXF1aXJlKCcuL3V0aWxzL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIFJhY3RpdmU7IHJlcXVpcmUoJy4vdXRpbHMvcmFjdGl2ZS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihsb2FkZWRSYWN0aXZlKSB7IFJhY3RpdmUgPSBsb2FkZWRSYWN0aXZlO30pO1xudmFyIFJhbmdlID0gcmVxdWlyZSgnLi91dGlscy9yYW5nZScpO1xudmFyIFRvdWNoU3VwcG9ydCA9IHJlcXVpcmUoJy4vdXRpbHMvdG91Y2gtc3VwcG9ydCcpO1xuXG52YXIgUG9wdXBXaWRnZXQgPSByZXF1aXJlKCcuL3BvcHVwLXdpZGdldCcpO1xudmFyIFJlYWN0aW9uc1dpZGdldCA9IHJlcXVpcmUoJy4vcmVhY3Rpb25zLXdpZGdldCcpO1xudmFyIFNWR3MgPSByZXF1aXJlKCcuL3N2Z3MnKTtcblxudmFyIENMQVNTX0FDVElWRSA9ICdhbnRlbm5hLWFjdGl2ZSc7XG5cbmZ1bmN0aW9uIGNyZWF0ZUluZGljYXRvcldpZGdldChvcHRpb25zKSB7XG4gICAgdmFyIGNvbnRhaW5lckRhdGEgPSBvcHRpb25zLmNvbnRhaW5lckRhdGE7XG4gICAgdmFyICRjb250YWluZXJFbGVtZW50ID0gb3B0aW9ucy5jb250YWluZXJFbGVtZW50O1xuICAgIHZhciBwYWdlRGF0YSA9IG9wdGlvbnMucGFnZURhdGE7XG4gICAgdmFyIGdyb3VwU2V0dGluZ3MgPSBvcHRpb25zLmdyb3VwU2V0dGluZ3M7XG4gICAgdmFyIGRlZmF1bHRSZWFjdGlvbnMgPSBvcHRpb25zLmRlZmF1bHRSZWFjdGlvbnM7XG4gICAgdmFyIGNvb3JkcyA9IG9wdGlvbnMuY29vcmRzO1xuICAgIHZhciByYWN0aXZlID0gUmFjdGl2ZSh7XG4gICAgICAgIGVsOiAkKCc8ZGl2PicpLCAvLyB0aGUgcmVhbCByb290IG5vZGUgaXMgaW4gdGhlIHRlbXBsYXRlLiBpdCdzIGV4dHJhY3RlZCBhZnRlciB0aGUgdGVtcGxhdGUgaXMgcmVuZGVyZWQgaW50byB0aGlzIGR1bW15IGVsZW1lbnRcbiAgICAgICAgYXBwZW5kOiB0cnVlLFxuICAgICAgICBtYWdpYzogdHJ1ZSxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgY29udGFpbmVyRGF0YTogY29udGFpbmVyRGF0YSxcbiAgICAgICAgICAgIGV4dHJhQ2xhc3NlczogZ3JvdXBTZXR0aW5ncy5lbmFibGVUZXh0SGVscGVyKCkgPyBcIlwiIDogXCJhbnRlbm5hLW5vaGludFwiXG4gICAgICAgIH0sXG4gICAgICAgIHRlbXBsYXRlOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvdGV4dC1pbmRpY2F0b3Itd2lkZ2V0Lmhicy5odG1sJyksXG4gICAgICAgIHBhcnRpYWxzOiB7XG4gICAgICAgICAgICBsb2dvOiBTVkdzLmxvZ29TZWxlY3RhYmxlXG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIHZhciByZWFjdGlvbldpZGdldE9wdGlvbnMgPSB7XG4gICAgICAgIHJlYWN0aW9uc0RhdGE6IGNvbnRhaW5lckRhdGEucmVhY3Rpb25zLFxuICAgICAgICBjb250YWluZXJEYXRhOiBjb250YWluZXJEYXRhLFxuICAgICAgICBjb250YWluZXJFbGVtZW50OiAkY29udGFpbmVyRWxlbWVudCxcbiAgICAgICAgY29udGVudERhdGE6IHsgdHlwZTogJ3RleHQnIH0sXG4gICAgICAgIGRlZmF1bHRSZWFjdGlvbnM6IGRlZmF1bHRSZWFjdGlvbnMsXG4gICAgICAgIHBhZ2VEYXRhOiBwYWdlRGF0YSxcbiAgICAgICAgZ3JvdXBTZXR0aW5nczogZ3JvdXBTZXR0aW5nc1xuICAgIH07XG5cbiAgICB2YXIgJHJvb3RFbGVtZW50ID0gJChyb290RWxlbWVudChyYWN0aXZlKSk7XG4gICAgaWYgKGNvb3Jkcykge1xuICAgICAgICAkcm9vdEVsZW1lbnQuY3NzKHtcbiAgICAgICAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxuICAgICAgICAgICAgdG9wOiBjb29yZHMudG9wIC0gJHJvb3RFbGVtZW50LmhlaWdodCgpLFxuICAgICAgICAgICAgYm90dG9tOiBjb29yZHMuYm90dG9tLFxuICAgICAgICAgICAgbGVmdDogY29vcmRzLmxlZnQsXG4gICAgICAgICAgICByaWdodDogY29vcmRzLnJpZ2h0LFxuICAgICAgICAgICAgJ3otaW5kZXgnOiAxMDAwIC8vIFRPRE86IGNvbXB1dGUgYSByZWFsIHZhbHVlP1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgdmFyIGhvdmVyVGltZW91dDtcbiAgICB2YXIgdGFwU3VwcG9ydCA9IFRvdWNoU3VwcG9ydC5zZXR1cFRhcCgkcm9vdEVsZW1lbnQuZ2V0KDApLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgb3BlblJlYWN0aW9uc1dpbmRvdyhyZWFjdGlvbldpZGdldE9wdGlvbnMsIHJhY3RpdmUpO1xuICAgIH0pO1xuICAgICRyb290RWxlbWVudC5vbignbW91c2VlbnRlci5hbnRlbm5hJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgaWYgKGV2ZW50LmJ1dHRvbnMgPiAwIHx8IChldmVudC5idXR0b25zID09IHVuZGVmaW5lZCAmJiBldmVudC53aGljaCA+IDApKSB7IC8vIE9uIFNhZmFyaSwgZXZlbnQuYnV0dG9ucyBpcyB1bmRlZmluZWQgYnV0IGV2ZW50LndoaWNoIGdpdmVzIGEgZ29vZCB2YWx1ZS4gZXZlbnQud2hpY2ggaXMgYmFkIG9uIEZGXG4gICAgICAgICAgICAvLyBEb24ndCByZWFjdCBpZiB0aGUgdXNlciBpcyBkcmFnZ2luZyBvciBzZWxlY3RpbmcgdGV4dC5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjbGVhclRpbWVvdXQoaG92ZXJUaW1lb3V0KTsgLy8gb25seSBvbmUgdGltZW91dCBhdCBhIHRpbWVcbiAgICAgICAgaG92ZXJUaW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmIChjb250YWluZXJEYXRhLnJlYWN0aW9ucy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgb3BlblJlYWN0aW9uc1dpbmRvdyhyZWFjdGlvbldpZGdldE9wdGlvbnMsIHJhY3RpdmUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YXIgJGljb24gPSAkKHJvb3RFbGVtZW50KHJhY3RpdmUpKS5maW5kKCcuYW50ZW5uYS1sb2dvJyk7XG4gICAgICAgICAgICAgICAgdmFyIG9mZnNldCA9ICRpY29uLm9mZnNldCgpO1xuICAgICAgICAgICAgICAgIHZhciBjb29yZGluYXRlcyA9IHtcbiAgICAgICAgICAgICAgICAgICAgdG9wOiBvZmZzZXQudG9wICsgTWF0aC5mbG9vcigkaWNvbi5oZWlnaHQoKSAvIDIpLCAvLyBUT0RPIHRoaXMgbnVtYmVyIGlzIGEgbGl0dGxlIG9mZiBiZWNhdXNlIHRoZSBkaXYgZG9lc24ndCB0aWdodGx5IHdyYXAgdGhlIGluc2VydGVkIGZvbnQgY2hhcmFjdGVyXG4gICAgICAgICAgICAgICAgICAgIGxlZnQ6IG9mZnNldC5sZWZ0ICsgTWF0aC5mbG9vcigkaWNvbi53aWR0aCgpIC8gMilcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIFBvcHVwV2lkZ2V0LnNob3coY29vcmRpbmF0ZXMsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBvcGVuUmVhY3Rpb25zV2luZG93KHJlYWN0aW9uV2lkZ2V0T3B0aW9ucywgcmFjdGl2ZSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIDIwMCk7XG4gICAgfSk7XG4gICAgJHJvb3RFbGVtZW50Lm9uKCdtb3VzZWxlYXZlLmFudGVubmEnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KGhvdmVyVGltZW91dCk7XG4gICAgfSk7XG4gICAgJGNvbnRhaW5lckVsZW1lbnQub24oJ21vdXNlZW50ZXIuYW50ZW5uYScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAkcm9vdEVsZW1lbnQuYWRkQ2xhc3MoQ0xBU1NfQUNUSVZFKTtcbiAgICB9KTtcbiAgICAkY29udGFpbmVyRWxlbWVudC5vbignbW91c2VsZWF2ZS5hbnRlbm5hJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICRyb290RWxlbWVudC5yZW1vdmVDbGFzcyhDTEFTU19BQ1RJVkUpO1xuICAgIH0pO1xuICAgIHJldHVybiB7XG4gICAgICAgIGVsZW1lbnQ6ICRyb290RWxlbWVudCxcbiAgICAgICAgdGVhcmRvd246IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgJGNvbnRhaW5lckVsZW1lbnQub2ZmKCcuYW50ZW5uYScpO1xuICAgICAgICAgICAgcmFjdGl2ZS50ZWFyZG93bigpO1xuICAgICAgICAgICAgdGFwU3VwcG9ydC50ZWFyZG93bigpO1xuICAgICAgICB9XG4gICAgfTtcbn1cblxuZnVuY3Rpb24gcm9vdEVsZW1lbnQocmFjdGl2ZSkge1xuICAgIHJldHVybiByYWN0aXZlLmZpbmQoJy5hbnRlbm5hLXRleHQtaW5kaWNhdG9yLXdpZGdldCcpO1xufVxuXG5mdW5jdGlvbiBvcGVuUmVhY3Rpb25zV2luZG93KHJlYWN0aW9uT3B0aW9ucywgcmFjdGl2ZSkge1xuICAgIFJlYWN0aW9uc1dpZGdldC5vcGVuKHJlYWN0aW9uT3B0aW9ucywgcm9vdEVsZW1lbnQocmFjdGl2ZSkpO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlOiBjcmVhdGVJbmRpY2F0b3JXaWRnZXRcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgUG9wdXBXaWRnZXQgPSByZXF1aXJlKCcuL3BvcHVwLXdpZGdldCcpO1xudmFyIFJhbmdlID0gcmVxdWlyZSgnLi91dGlscy9yYW5nZScpO1xudmFyIFJlYWN0aW9uc1dpZGdldCA9IHJlcXVpcmUoJy4vcmVhY3Rpb25zLXdpZGdldCcpO1xudmFyIFRvdWNoU3VwcG9ydCA9IHJlcXVpcmUoJy4vdXRpbHMvdG91Y2gtc3VwcG9ydCcpO1xuXG5cbmZ1bmN0aW9uIGNyZWF0ZVJlYWN0YWJsZVRleHQob3B0aW9ucykge1xuICAgIC8vIFRPRE86IGltcG9zZSBhbiB1cHBlciBsaW1pdCBvbiB0aGUgbGVuZ3RoIG9mIHRleHQgdGhhdCBjYW4gYmUgcmVhY3RlZCB0bz8gKGFwcGxpZXMgdG8gdGhlIGluZGljYXRvci13aWRnZXQgdG9vKVxuICAgIHZhciAkY29udGFpbmVyRWxlbWVudCA9IG9wdGlvbnMuY29udGFpbmVyRWxlbWVudDtcbiAgICB2YXIgY29udGFpbmVyRGF0YSA9IG9wdGlvbnMuY29udGFpbmVyRGF0YTtcbiAgICB2YXIgZXhjbHVkZU5vZGUgPSBvcHRpb25zLmV4Y2x1ZGVOb2RlO1xuICAgIHZhciByZWFjdGlvbnNXaWRnZXRPcHRpb25zID0ge1xuICAgICAgICByZWFjdGlvbnNEYXRhOiBbXSwgLy8gQWx3YXlzIG9wZW4gd2l0aCB0aGUgZGVmYXVsdCByZWFjdGlvbnNcbiAgICAgICAgY29udGFpbmVyRGF0YTogY29udGFpbmVyRGF0YSxcbiAgICAgICAgY29udGVudERhdGE6IHsgdHlwZTogJ3RleHQnIH0sXG4gICAgICAgIGNvbnRhaW5lckVsZW1lbnQ6ICRjb250YWluZXJFbGVtZW50LFxuICAgICAgICBkZWZhdWx0UmVhY3Rpb25zOiBvcHRpb25zLmRlZmF1bHRSZWFjdGlvbnMsXG4gICAgICAgIHBhZ2VEYXRhOiBvcHRpb25zLnBhZ2VEYXRhLFxuICAgICAgICBncm91cFNldHRpbmdzOiBvcHRpb25zLmdyb3VwU2V0dGluZ3NcbiAgICB9O1xuXG4gICAgdmFyIHRhcEV2ZW50cyA9IHNldHVwVGFwRXZlbnRzKCRjb250YWluZXJFbGVtZW50LmdldCgwKSwgcmVhY3Rpb25zV2lkZ2V0T3B0aW9ucyk7XG4gICAgJGNvbnRhaW5lckVsZW1lbnQub24oJ21vdXNldXAuYW50ZW5uYScsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGlmIChjb250YWluZXJEYXRhLmxvYWRlZCkge1xuICAgICAgICAgICAgdmFyIG5vZGUgPSAkY29udGFpbmVyRWxlbWVudC5nZXQoMCk7XG4gICAgICAgICAgICB2YXIgcG9pbnQgPSBSYW5nZS5nZXRTZWxlY3Rpb25FbmRQb2ludChub2RlLCBldmVudCwgZXhjbHVkZU5vZGUpO1xuICAgICAgICAgICAgaWYgKHBvaW50KSB7XG4gICAgICAgICAgICAgICAgdmFyIGNvb3JkaW5hdGVzID0ge3RvcDogcG9pbnQueSwgbGVmdDogcG9pbnQueH07XG4gICAgICAgICAgICAgICAgUG9wdXBXaWRnZXQuc2hvdyhjb29yZGluYXRlcywgZ3JhYlNlbGVjdGlvbkFuZE9wZW4obm9kZSwgY29vcmRpbmF0ZXMsIHJlYWN0aW9uc1dpZGdldE9wdGlvbnMsIGV4Y2x1ZGVOb2RlKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4ge1xuICAgICAgICB0ZWFyZG93bjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB0YXBFdmVudHMudGVhcmRvd24oKTtcbiAgICAgICAgICAgICRjb250YWluZXJFbGVtZW50Lm9mZignLmFudGVubmEnKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gZ3JhYlNlbGVjdGlvbkFuZE9wZW4obm9kZSwgY29vcmRpbmF0ZXMsIHJlYWN0aW9uc1dpZGdldE9wdGlvbnMsIGV4Y2x1ZGVOb2RlKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICBSYW5nZS5ncmFiU2VsZWN0aW9uKG5vZGUsIGZ1bmN0aW9uKHRleHQsIGxvY2F0aW9uKSB7XG4gICAgICAgICAgICByZWFjdGlvbnNXaWRnZXRPcHRpb25zLmNvbnRlbnREYXRhLmxvY2F0aW9uID0gbG9jYXRpb247XG4gICAgICAgICAgICByZWFjdGlvbnNXaWRnZXRPcHRpb25zLmNvbnRlbnREYXRhLmJvZHkgPSB0ZXh0O1xuICAgICAgICAgICAgUmVhY3Rpb25zV2lkZ2V0Lm9wZW4ocmVhY3Rpb25zV2lkZ2V0T3B0aW9ucywgY29vcmRpbmF0ZXMpO1xuICAgICAgICB9LCBleGNsdWRlTm9kZSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBncmFiTm9kZUFuZE9wZW4obm9kZSwgcmVhY3Rpb25zV2lkZ2V0T3B0aW9ucywgY29vcmRzKSB7XG4gICAgUmFuZ2UuZ3JhYk5vZGUobm9kZSwgZnVuY3Rpb24odGV4dCwgbG9jYXRpb24pIHtcbiAgICAgICAgcmVhY3Rpb25zV2lkZ2V0T3B0aW9ucy5jb250ZW50RGF0YS5sb2NhdGlvbiA9IGxvY2F0aW9uO1xuICAgICAgICByZWFjdGlvbnNXaWRnZXRPcHRpb25zLmNvbnRlbnREYXRhLmJvZHkgPSB0ZXh0O1xuICAgICAgICBSZWFjdGlvbnNXaWRnZXQub3BlbihyZWFjdGlvbnNXaWRnZXRPcHRpb25zLCBjb29yZHMpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBzZXR1cFRhcEV2ZW50cyhlbGVtZW50LCByZWFjdGlvbnNXaWRnZXRPcHRpb25zKSB7XG4gICAgcmV0dXJuIFRvdWNoU3VwcG9ydC5zZXR1cFRhcChlbGVtZW50LCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBpZiAoIVJlYWN0aW9uc1dpZGdldC5pc09wZW4oKSAmJiAkKGV2ZW50LnRhcmdldCkuY2xvc2VzdCgnYScpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgdmFyIHRvdWNoID0gZXZlbnQuY2hhbmdlZFRvdWNoZXNbMF07XG4gICAgICAgICAgICB2YXIgY29vcmRzID0geyB0b3A6IHRvdWNoLnBhZ2VZLCBsZWZ0OiB0b3VjaC5wYWdlWCB9O1xuICAgICAgICAgICAgZ3JhYk5vZGVBbmRPcGVuKGVsZW1lbnQsIHJlYWN0aW9uc1dpZGdldE9wdGlvbnMsIGNvb3Jkcyk7XG4gICAgICAgIH1cbiAgICB9KTtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZVJlYWN0YWJsZVRleHQ6IGNyZWF0ZVJlYWN0YWJsZVRleHRcbn07IiwiLy8gVE9ETzogbmVlZHMgYSBiZXR0ZXIgbmFtZSBvbmNlIHRoZSBzY29wZSBpcyBjbGVhclxuXG52YXIgJDsgcmVxdWlyZSgnLi9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciBBcHBNb2RlID0gcmVxdWlyZSgnLi9hcHAtbW9kZScpO1xudmFyIFVSTHMgPSByZXF1aXJlKCcuL3VybHMnKTtcbnZhciBVc2VyID0gcmVxdWlyZSgnLi91c2VyJyk7XG5cblxuZnVuY3Rpb24gcG9zdE5ld1JlYWN0aW9uKHJlYWN0aW9uRGF0YSwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGNvbnRlbnREYXRhLCBzdWNjZXNzLCBlcnJvcikge1xuICAgIHZhciBjb250ZW50Qm9keSA9IGNvbnRlbnREYXRhLmJvZHk7XG4gICAgdmFyIGNvbnRlbnRUeXBlID0gY29udGVudERhdGEudHlwZTtcbiAgICB2YXIgY29udGVudExvY2F0aW9uID0gY29udGVudERhdGEubG9jYXRpb247XG4gICAgdmFyIGNvbnRlbnREaW1lbnNpb25zID0gY29udGVudERhdGEuZGltZW5zaW9ucztcbiAgICBVc2VyLmZldGNoVXNlcihmdW5jdGlvbih1c2VySW5mbykge1xuICAgICAgICAvLyBUT0RPIGV4dHJhY3QgdGhlIHNoYXBlIG9mIHRoaXMgZGF0YSBhbmQgcG9zc2libHkgdGhlIHdob2xlIEFQSSBjYWxsXG4gICAgICAgIHZhciBkYXRhID0ge1xuICAgICAgICAgICAgdGFnOiB7XG4gICAgICAgICAgICAgICAgYm9keTogcmVhY3Rpb25EYXRhLnRleHQsXG4gICAgICAgICAgICAgICAgaXNfZGVmYXVsdDogcmVhY3Rpb25EYXRhLmlzRGVmYXVsdCAhPT0gdW5kZWZpbmVkICYmIHJlYWN0aW9uRGF0YS5pc0RlZmF1bHQgLy8gZmFsc2UgdW5sZXNzIHNwZWNpZmllZFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGhhc2g6IGNvbnRhaW5lckRhdGEuaGFzaCxcbiAgICAgICAgICAgIHVzZXJfaWQ6IHVzZXJJbmZvLnVzZXJfaWQsXG4gICAgICAgICAgICBhbnRfdG9rZW46IHVzZXJJbmZvLmFudF90b2tlbixcbiAgICAgICAgICAgIHBhZ2VfaWQ6IHBhZ2VEYXRhLnBhZ2VJZCxcbiAgICAgICAgICAgIGdyb3VwX2lkOiBwYWdlRGF0YS5ncm91cElkLFxuICAgICAgICAgICAgY29udGFpbmVyX2tpbmQ6IGNvbnRlbnRUeXBlLCAvLyBPbmUgb2YgJ3BhZ2UnLCAndGV4dCcsICdtZWRpYScsICdpbWcnXG4gICAgICAgICAgICBjb250ZW50X25vZGVfZGF0YToge1xuICAgICAgICAgICAgICAgIGJvZHk6IGNvbnRlbnRCb2R5LFxuICAgICAgICAgICAgICAgIGtpbmQ6IGNvbnRlbnRUeXBlLFxuICAgICAgICAgICAgICAgIGl0ZW1fdHlwZTogJycgLy8gVE9ETzogbG9va3MgdW51c2VkIGJ1dCBUYWdIYW5kbGVyIGJsb3dzIHVwIHdpdGhvdXQgaXQuIEN1cnJlbnQgY2xpZW50IHBhc3NlcyBpbiBcInBhZ2VcIiBmb3IgcGFnZSByZWFjdGlvbnMuXG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIGlmIChjb250ZW50TG9jYXRpb24pIHtcbiAgICAgICAgICAgIGRhdGEuY29udGVudF9ub2RlX2RhdGEubG9jYXRpb24gPSBjb250ZW50TG9jYXRpb247XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvbnRlbnREaW1lbnNpb25zKSB7XG4gICAgICAgICAgICBkYXRhLmNvbnRlbnRfbm9kZV9kYXRhLmhlaWdodCA9IGNvbnRlbnREaW1lbnNpb25zLmhlaWdodDtcbiAgICAgICAgICAgIGRhdGEuY29udGVudF9ub2RlX2RhdGEud2lkdGggPSBjb250ZW50RGltZW5zaW9ucy53aWR0aDtcbiAgICAgICAgfVxuICAgICAgICBpZiAocmVhY3Rpb25EYXRhLmlkKSB7XG4gICAgICAgICAgICBkYXRhLnRhZy5pZCA9IHJlYWN0aW9uRGF0YS5pZDsgLy8gVE9ETyB0aGUgY3VycmVudCBjbGllbnQgc2VuZHMgXCItMTAxXCIgaWYgdGhlcmUncyBubyBpZC4gaXMgdGhpcyBuZWNlc3Nhcnk/XG4gICAgICAgIH1cbiAgICAgICAgZ2V0SlNPTlAoVVJMcy5jcmVhdGVSZWFjdGlvblVybCgpLCBkYXRhLCBuZXdSZWFjdGlvblN1Y2Nlc3MoY29udGVudExvY2F0aW9uLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgc3VjY2VzcyksIGVycm9yKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gcG9zdFBsdXNPbmUocmVhY3Rpb25EYXRhLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgc3VjY2VzcywgZXJyb3IpIHtcbiAgICBVc2VyLmZldGNoVXNlcihmdW5jdGlvbih1c2VySW5mbykge1xuICAgICAgICAvLyBUT0RPIGV4dHJhY3QgdGhlIHNoYXBlIG9mIHRoaXMgZGF0YSBhbmQgcG9zc2libHkgdGhlIHdob2xlIEFQSSBjYWxsXG4gICAgICAgIGlmICghcmVhY3Rpb25EYXRhLmNvbnRlbnQpIHtcbiAgICAgICAgICAgIC8vIFRoaXMgaXMgYSBzdW1tYXJ5IHJlYWN0aW9uLiBTZWUgaWYgd2UgaGF2ZSBhbnkgY29udGFpbmVyIGRhdGEgdGhhdCB3ZSBjYW4gbGluayB0byBpdC5cbiAgICAgICAgICAgIHZhciBjb250YWluZXJSZWFjdGlvbnMgPSBjb250YWluZXJEYXRhLnJlYWN0aW9ucztcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY29udGFpbmVyUmVhY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNvbnRhaW5lclJlYWN0aW9uID0gY29udGFpbmVyUmVhY3Rpb25zW2ldO1xuICAgICAgICAgICAgICAgIGlmIChjb250YWluZXJSZWFjdGlvbi5pZCA9PT0gcmVhY3Rpb25EYXRhLmlkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlYWN0aW9uRGF0YS5wYXJlbnRJRCA9IGNvbnRhaW5lclJlYWN0aW9uLnBhcmVudElEO1xuICAgICAgICAgICAgICAgICAgICByZWFjdGlvbkRhdGEuY29udGVudCA9IGNvbnRhaW5lclJlYWN0aW9uLmNvbnRlbnQ7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB2YXIgZGF0YSA9IHtcbiAgICAgICAgICAgIHRhZzoge1xuICAgICAgICAgICAgICAgIGJvZHk6IHJlYWN0aW9uRGF0YS50ZXh0LFxuICAgICAgICAgICAgICAgIGlkOiByZWFjdGlvbkRhdGEuaWRcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBoYXNoOiBjb250YWluZXJEYXRhLmhhc2gsXG4gICAgICAgICAgICB1c2VyX2lkOiB1c2VySW5mby51c2VyX2lkLFxuICAgICAgICAgICAgYW50X3Rva2VuOiB1c2VySW5mby5hbnRfdG9rZW4sXG4gICAgICAgICAgICBwYWdlX2lkOiBwYWdlRGF0YS5wYWdlSWQsXG4gICAgICAgICAgICBncm91cF9pZDogcGFnZURhdGEuZ3JvdXBJZCxcbiAgICAgICAgICAgIGNvbnRhaW5lcl9raW5kOiBjb250YWluZXJEYXRhLnR5cGUsIC8vICdwYWdlJywgJ3RleHQnLCAnbWVkaWEnLCAnaW1nJ1xuICAgICAgICAgICAgY29udGVudF9ub2RlX2RhdGE6IHtcbiAgICAgICAgICAgICAgICBib2R5OiAnJywgLy8gVE9ETzogZG8gd2UgbmVlZCB0aGlzIGZvciArMXM/IGxvb2tzIGxpa2Ugb25seSB0aGUgaWQgZmllbGQgaXMgdXNlZCwgaWYgb25lIGlzIHNldFxuICAgICAgICAgICAgICAgIGtpbmQ6IGNvbnRlbnROb2RlRGF0YUtpbmQoY29udGFpbmVyRGF0YS50eXBlKSxcbiAgICAgICAgICAgICAgICBpdGVtX3R5cGU6ICcnIC8vIFRPRE86IGxvb2tzIHVudXNlZCBidXQgVGFnSGFuZGxlciBibG93cyB1cCB3aXRob3V0IGl0XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIGlmIChyZWFjdGlvbkRhdGEuY29udGVudCkge1xuICAgICAgICAgICAgZGF0YS5jb250ZW50X25vZGVfZGF0YS5pZCA9IHJlYWN0aW9uRGF0YS5jb250ZW50LmlkO1xuICAgICAgICAgICAgZGF0YS5jb250ZW50X25vZGVfZGF0YS5sb2NhdGlvbiA9IHJlYWN0aW9uRGF0YS5jb250ZW50LmxvY2F0aW9uO1xuICAgICAgICB9XG4gICAgICAgIC8vIFRPRE86IHNob3VsZCB3ZSBiYWlsIGlmIHRoZXJlJ3Mgbm8gcGFyZW50IElEPyBJdCdzIG5vdCByZWFsbHkgYSArMSB3aXRob3V0IG9uZS5cbiAgICAgICAgaWYgKHJlYWN0aW9uRGF0YS5wYXJlbnRJRCkge1xuICAgICAgICAgICAgZGF0YS50YWcucGFyZW50X2lkID0gcmVhY3Rpb25EYXRhLnBhcmVudElEO1xuICAgICAgICB9XG4gICAgICAgIGdldEpTT05QKFVSTHMuY3JlYXRlUmVhY3Rpb25VcmwoKSwgZGF0YSwgcGx1c09uZVN1Y2Nlc3MocmVhY3Rpb25EYXRhLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgc3VjY2VzcyksIGVycm9yKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gcG9zdENvbW1lbnQoY29tbWVudCwgcmVhY3Rpb25EYXRhLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgc3VjY2VzcywgZXJyb3IpIHtcbiAgICAvLyBUT0RPOiByZWZhY3RvciB0aGUgcG9zdCBmdW5jdGlvbnMgdG8gZWxpbWluYXRlIGFsbCB0aGUgY29waWVkIGNvZGVcbiAgICBVc2VyLmZldGNoVXNlcihmdW5jdGlvbih1c2VySW5mbykge1xuICAgICAgICAvLyBUT0RPIGV4dHJhY3QgdGhlIHNoYXBlIG9mIHRoaXMgZGF0YSBhbmQgcG9zc2libHkgdGhlIHdob2xlIEFQSSBjYWxsXG4gICAgICAgIGlmICghcmVhY3Rpb25EYXRhLmNvbnRlbnQpIHtcbiAgICAgICAgICAgIC8vIFRoaXMgaXMgYSBzdW1tYXJ5IHJlYWN0aW9uLiBTZWUgaWYgd2UgaGF2ZSBhbnkgY29udGFpbmVyIGRhdGEgdGhhdCB3ZSBjYW4gbGluayB0byBpdC5cbiAgICAgICAgICAgIHZhciBjb250YWluZXJSZWFjdGlvbnMgPSBjb250YWluZXJEYXRhLnJlYWN0aW9ucztcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY29udGFpbmVyUmVhY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNvbnRhaW5lclJlYWN0aW9uID0gY29udGFpbmVyUmVhY3Rpb25zW2ldO1xuICAgICAgICAgICAgICAgIGlmIChjb250YWluZXJSZWFjdGlvbi5pZCA9PT0gcmVhY3Rpb25EYXRhLmlkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlYWN0aW9uRGF0YS5wYXJlbnRJRCA9IGNvbnRhaW5lclJlYWN0aW9uLnBhcmVudElEO1xuICAgICAgICAgICAgICAgICAgICByZWFjdGlvbkRhdGEuY29udGVudCA9IGNvbnRhaW5lclJlYWN0aW9uLmNvbnRlbnQ7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB2YXIgZGF0YSA9IHtcbiAgICAgICAgICAgIGNvbW1lbnQ6IGNvbW1lbnQsXG4gICAgICAgICAgICB0YWc6IHtcbiAgICAgICAgICAgICAgICBwYXJlbnRfaWQ6IHJlYWN0aW9uRGF0YS5wYXJlbnRJRFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHVzZXJfaWQ6IHVzZXJJbmZvLnVzZXJfaWQsXG4gICAgICAgICAgICBhbnRfdG9rZW46IHVzZXJJbmZvLmFudF90b2tlbixcbiAgICAgICAgICAgIHBhZ2VfaWQ6IHBhZ2VEYXRhLnBhZ2VJZCxcbiAgICAgICAgICAgIGdyb3VwX2lkOiBwYWdlRGF0YS5ncm91cElkXG4gICAgICAgIH07XG4gICAgICAgIGdldEpTT05QKFVSTHMuY3JlYXRlQ29tbWVudFVybCgpLCBkYXRhLCBjb21tZW50U3VjY2VzcyhyZWFjdGlvbkRhdGEsIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBzdWNjZXNzKSwgZXJyb3IpO1xuICAgIH0pO1xufVxuXG4vLyBUT0RPOiBXZSBuZWVkIHRvIHJldmlldyB0aGUgQVBJIHNvIHRoYXQgaXQgcmV0dXJucy9hY2NlcHRzIGEgdW5pZm9ybSBzZXQgb2YgdmFsdWVzLlxuZnVuY3Rpb24gY29udGVudE5vZGVEYXRhS2luZCh0eXBlKSB7XG4gICAgaWYgKHR5cGUgPT09ICdpbWFnZScpIHtcbiAgICAgICAgcmV0dXJuICdpbWcnO1xuICAgIH1cbiAgICByZXR1cm4gdHlwZTtcbn1cblxuZnVuY3Rpb24gY29tbWVudFN1Y2Nlc3MocmVhY3Rpb25EYXRhLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgY2FsbGJhY2spIHtcbiAgICByZXR1cm4gZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgLy8gVE9ETzogaW4gdGhlIGNhc2UgdGhhdCBzb21lb25lIHJlYWN0cyBhbmQgdGhlbiBpbW1lZGlhdGVseSBjb21tZW50cywgd2UgaGF2ZSBhIHJhY2UgY29uZGl0aW9uIHdoZXJlIHRoZVxuICAgICAgICAvLyAgICAgICBjb21tZW50IHJlc3BvbnNlIGNvdWxkIGNvbWUgYmFjayBiZWZvcmUgdGhlIHJlYWN0aW9uLiB3ZSBuZWVkIHRvOlxuICAgICAgICAvLyAgICAgICAxLiBNYWtlIHN1cmUgdGhlIHNlcnZlciBvbmx5IGNyZWF0ZXMgYSBzaW5nbGUgcmVhY3Rpb24gaW4gdGhpcyBjYXNlIChub3QgYSBIVUdFIGRlYWwgaWYgaXQgbWFrZXMgdHdvKVxuICAgICAgICAvLyAgICAgICAyLiBSZXNvbHZlIHRoZSB0d28gcmVzcG9uc2VzIHRoYXQgYm90aCB0aGVvcmV0aWNhbGx5IGNvbWUgYmFjayB3aXRoIHRoZSBzYW1lIHJlYWN0aW9uIGRhdGEgYXQgdGhlIHNhbWVcbiAgICAgICAgLy8gICAgICAgICAgdGltZS4gTWFrZSBzdXJlIHdlIGRvbid0IGVuZCB1cCB3aXRoIHR3byBjb3BpZXMgb2YgdGhlIHNhbWUgZGF0YSBpbiB0aGUgbW9kZWwuXG4gICAgICAgIHZhciByZWFjdGlvbkNyZWF0ZWQgPSAhcmVzcG9uc2UuZXhpc3Rpbmc7XG4gICAgICAgIGlmIChyZWFjdGlvbkNyZWF0ZWQpIHtcbiAgICAgICAgICAgIGlmICghcmVhY3Rpb25EYXRhLmNvbW1lbnRDb3VudCkge1xuICAgICAgICAgICAgICAgIHJlYWN0aW9uRGF0YS5jb21tZW50Q291bnQgPSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVhY3Rpb25EYXRhLmNvbW1lbnRDb3VudCArPSAxO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gVE9ETzogZG8gd2UgZXZlciBnZXQgYSByZXNwb25zZSB0byBhIG5ldyByZWFjdGlvbiB0ZWxsaW5nIHVzIHRoYXQgaXQncyBhbHJlYWR5IGV4aXN0aW5nPyBJZiBzbywgY291bGQgdGhlIGNvdW50IG5lZWQgdG8gYmUgdXBkYXRlZD9cbiAgICAgICAgfVxuICAgICAgICBjYWxsYmFjayhyZWFjdGlvbkNyZWF0ZWQpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gcGx1c09uZVN1Y2Nlc3MocmVhY3Rpb25EYXRhLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgY2FsbGJhY2spIHtcbiAgICByZXR1cm4gZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgLy8gVE9ETzogRG8gd2UgY2FyZSBhYm91dCByZXNwb25zZS5leGlzdGluZyBhbnltb3JlICh3ZSB1c2VkIHRvIHNob3cgZGlmZmVyZW50IGZlZWRiYWNrIGluIHRoZSBVSSwgYnV0IG5vIGxvbmdlci4uLilcbiAgICAgICAgdmFyIHJlYWN0aW9uQ3JlYXRlZCA9ICFyZXNwb25zZS5leGlzdGluZztcbiAgICAgICAgaWYgKHJlYWN0aW9uQ3JlYXRlZCkge1xuICAgICAgICAgICAgLy8gVE9ETzogd2Ugc2hvdWxkIGdldCBiYWNrIGEgcmVzcG9uc2Ugd2l0aCBkYXRhIGluIHRoZSBcIm5ldyBmb3JtYXRcIiBhbmQgdXBkYXRlIHRoZSBtb2RlbCBmcm9tIHRoZSByZXNwb25zZVxuICAgICAgICAgICAgcmVhY3Rpb25EYXRhLmNvdW50ID0gcmVhY3Rpb25EYXRhLmNvdW50ICsgMTtcbiAgICAgICAgICAgIGNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbCA9IGNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbCArIDE7XG4gICAgICAgICAgICBwYWdlRGF0YS5zdW1tYXJ5VG90YWwgPSBwYWdlRGF0YS5zdW1tYXJ5VG90YWwgKyAxO1xuICAgICAgICAgICAgY29udGFpbmVyRGF0YS5yZWFjdGlvbnMuc29ydChmdW5jdGlvbihhLCBiKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGIuY291bnQgLSBhLmNvdW50O1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgY2FsbGJhY2socmVhY3Rpb25EYXRhKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIG5ld1JlYWN0aW9uU3VjY2Vzcyhjb250ZW50TG9jYXRpb24sIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBjYWxsYmFjaykge1xuICAgIHJldHVybiBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAvLyBUT0RPOiBDYW4gcmVzcG9uc2UuZXhpc3RpbmcgZXZlciBjb21lIGJhY2sgdHJ1ZSBmb3IgYSAnbmV3JyByZWFjdGlvbj8gU2hvdWxkIHdlIGJlaGF2ZSBhbnkgZGlmZmVyZW50bHkgaWYgaXQgZG9lcz9cbiAgICAgICAgdmFyIHJlYWN0aW9uID0gcmVhY3Rpb25Gcm9tUmVzcG9uc2UocmVzcG9uc2UsIGNvbnRlbnRMb2NhdGlvbik7XG4gICAgICAgIGNhbGxiYWNrKHJlYWN0aW9uKTtcbiAgICB9O1xufVxuXG5mdW5jdGlvbiByZWFjdGlvbkZyb21SZXNwb25zZShyZXNwb25zZSwgY29udGVudExvY2F0aW9uKSB7XG4gICAgLy8gVE9ETzogdGhlIHNlcnZlciBzaG91bGQgZ2l2ZSB1cyBiYWNrIGEgcmVhY3Rpb24gbWF0Y2hpbmcgdGhlIG5ldyBBUEkgZm9ybWF0LlxuICAgIC8vICAgICAgIHdlJ3JlIGp1c3QgZmFraW5nIGl0IG91dCBmb3Igbm93OyB0aGlzIGNvZGUgaXMgdGVtcG9yYXJ5XG4gICAgdmFyIHJlYWN0aW9uID0ge1xuICAgICAgICB0ZXh0OiByZXNwb25zZS5pbnRlcmFjdGlvbi5pbnRlcmFjdGlvbl9ub2RlLmJvZHksXG4gICAgICAgIGlkOiByZXNwb25zZS5pbnRlcmFjdGlvbi5pbnRlcmFjdGlvbl9ub2RlLmlkLFxuICAgICAgICBjb3VudDogMSxcbiAgICAgICAgcGFyZW50SUQ6IHJlc3BvbnNlLmludGVyYWN0aW9uLmlkLFxuICAgICAgICBhcHByb3ZlZDogcmVzcG9uc2UuYXBwcm92ZWQgPT09IHVuZGVmaW5lZCB8fCByZXNwb25zZS5hcHByb3ZlZFxuICAgIH07XG4gICAgaWYgKHJlc3BvbnNlLmNvbnRlbnRfbm9kZSkge1xuICAgICAgICByZWFjdGlvbi5jb250ZW50ID0ge1xuICAgICAgICAgICAgaWQ6IHJlc3BvbnNlLmNvbnRlbnRfbm9kZS5pZCxcbiAgICAgICAgICAgIGtpbmQ6IHJlc3BvbnNlLmNvbnRlbnRfbm9kZS5raW5kLFxuICAgICAgICAgICAgYm9keTogcmVzcG9uc2UuY29udGVudF9ub2RlLmJvZHlcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKHJlc3BvbnNlLmNvbnRlbnRfbm9kZS5sb2NhdGlvbikge1xuICAgICAgICAgICAgcmVhY3Rpb24uY29udGVudC5sb2NhdGlvbiA9IHJlc3BvbnNlLmNvbnRlbnRfbm9kZS5sb2NhdGlvbjtcbiAgICAgICAgfSBlbHNlIGlmIChjb250ZW50TG9jYXRpb24pIHtcbiAgICAgICAgICAgIC8vIFRPRE86IGVuc3VyZSB0aGF0IHRoZSBBUEkgYWx3YXlzIHJldHVybnMgYSBsb2NhdGlvbiBhbmQgcmVtb3ZlIHRoZSBcImNvbnRlbnRMb2NhdGlvblwiIHRoYXQncyBiZWluZyBwYXNzZWQgYXJvdW5kLlxuICAgICAgICAgICAgLy8gRm9yIG5vdywganVzdCBwYXRjaCB0aGUgcmVzcG9uc2Ugd2l0aCB0aGUgZGF0YSB3ZSBrbm93IHdlIHNlbnQgb3Zlci5cbiAgICAgICAgICAgIHJlYWN0aW9uLmNvbnRlbnQubG9jYXRpb24gPSBjb250ZW50TG9jYXRpb247XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlYWN0aW9uO1xufVxuXG5mdW5jdGlvbiBnZXRDb21tZW50cyhyZWFjdGlvbiwgc3VjY2Vzc0NhbGxiYWNrLCBlcnJvckNhbGxiYWNrKSB7XG4gICAgVXNlci5mZXRjaFVzZXIoZnVuY3Rpb24odXNlckluZm8pIHtcbiAgICAgICAgdmFyIGRhdGEgPSB7XG4gICAgICAgICAgICByZWFjdGlvbl9pZDogcmVhY3Rpb24ucGFyZW50SUQsXG4gICAgICAgICAgICB1c2VyX2lkOiB1c2VySW5mby51c2VyX2lkLFxuICAgICAgICAgICAgYW50X3Rva2VuOiB1c2VySW5mby5hbnRfdG9rZW5cbiAgICAgICAgfTtcbiAgICAgICAgZ2V0SlNPTlAoVVJMcy5mZXRjaENvbW1lbnRVcmwoKSwgZGF0YSwgZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIHN1Y2Nlc3NDYWxsYmFjayhjb21tZW50c0Zyb21SZXNwb25zZShyZXNwb25zZSkpO1xuICAgICAgICB9LCBlcnJvckNhbGxiYWNrKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gZmV0Y2hMb2NhdGlvbkRldGFpbHMocmVhY3Rpb25Mb2NhdGlvbkRhdGEsIHBhZ2VEYXRhLCBzdWNjZXNzQ2FsbGJhY2ssIGVycm9yQ2FsbGJhY2spIHtcbiAgICB2YXIgY29udGVudElEcyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHJlYWN0aW9uTG9jYXRpb25EYXRhKTtcbiAgICBVc2VyLmZldGNoVXNlcihmdW5jdGlvbih1c2VySW5mbykge1xuICAgICAgICB2YXIgZGF0YSA9IHtcbiAgICAgICAgICAgIHVzZXJfaWQ6IHVzZXJJbmZvLnVzZXJfaWQsXG4gICAgICAgICAgICBhbnRfdG9rZW46IHVzZXJJbmZvLmFudF90b2tlbixcbiAgICAgICAgICAgIGNvbnRlbnRfaWRzOiBjb250ZW50SURzXG4gICAgICAgIH07XG4gICAgICAgIGdldEpTT05QKFVSTHMuZmV0Y2hDb250ZW50Qm9kaWVzVXJsKCksIGRhdGEsIHN1Y2Nlc3NDYWxsYmFjaywgZXJyb3JDYWxsYmFjayk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGNvbW1lbnRzRnJvbVJlc3BvbnNlKGpzb25Db21tZW50cykge1xuICAgIHZhciBjb21tZW50cyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwganNvbkNvbW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBqc29uQ29tbWVudCA9IGpzb25Db21tZW50c1tpXTtcbiAgICAgICAgdmFyIGNvbW1lbnQgPSB7XG4gICAgICAgICAgICB0ZXh0OiBqc29uQ29tbWVudC50ZXh0LFxuICAgICAgICAgICAgaWQ6IGpzb25Db21tZW50LmlkLCAvLyBUT0RPOiB3ZSBwcm9iYWJseSBvbmx5IG5lZWQgdGhpcyBmb3IgKzEnaW5nIGNvbW1lbnRzXG4gICAgICAgICAgICBjb250ZW50SUQ6IGpzb25Db21tZW50LmNvbnRlbnRJRCwgLy8gVE9ETzogRG8gd2UgcmVhbGx5IG5lZWQgdGhpcz9cbiAgICAgICAgICAgIHVzZXI6IFVzZXIuZnJvbUNvbW1lbnRKU09OKGpzb25Db21tZW50LnVzZXIsIGpzb25Db21tZW50LnNvY2lhbF91c2VyKVxuICAgICAgICB9O1xuICAgICAgICBjb21tZW50cy5wdXNoKGNvbW1lbnQpO1xuICAgIH1cbiAgICByZXR1cm4gY29tbWVudHM7XG59XG5cbmZ1bmN0aW9uIHBvc3RTaGFyZVJlYWN0aW9uKHJlYWN0aW9uRGF0YSwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIHN1Y2Nlc3MsIGZhaWx1cmUpIHtcbiAgICBVc2VyLmZldGNoVXNlcihmdW5jdGlvbih1c2VySW5mbykge1xuICAgICAgICB2YXIgY29udGVudERhdGEgPSByZWFjdGlvbkRhdGEuY29udGVudDtcbiAgICAgICAgdmFyIGRhdGEgPSB7XG4gICAgICAgICAgICB0YWc6IHsgLy8gVE9ETzogd2h5IGRvZXMgdGhlIFNoYXJlSGFuZGxlciBjcmVhdGUgYSByZWFjdGlvbiBpZiBpdCBkb2Vzbid0IGV4aXN0PyBIb3cgY2FuIHlvdSBzaGFyZSBhIHJlYWN0aW9uIHRoYXQgaGFzbid0IGhhcHBlbmVkP1xuICAgICAgICAgICAgICAgIGlkOiByZWFjdGlvbkRhdGEuaWQsXG4gICAgICAgICAgICAgICAgYm9keTogcmVhY3Rpb25EYXRhLnRleHRcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBoYXNoOiBjb250YWluZXJEYXRhLmhhc2gsXG4gICAgICAgICAgICBjb250YWluZXJfa2luZDogY29udGFpbmVyRGF0YS50eXBlLFxuICAgICAgICAgICAgY29udGVudF9ub2RlX2RhdGE6IHsgLy8gVE9ETzogd2h5IGRvZXMgdGhlIFNoYXJlSGFuZGxlciBjcmVhdGUgYSBjb250ZW50IGlmIGl0IGRvZXNuJ3QgZXhpc3Q/IEhvdyBjYW4geW91IHNoYXJlIGEgcmVhY3Rpb24gdGhhdCBoYXNuJ3QgaGFwcGVuZWQ/XG4gICAgICAgICAgICAgICAgaWQ6IGNvbnRlbnREYXRhLmlkLFxuICAgICAgICAgICAgICAgIGJvZHk6IGNvbnRlbnREYXRhLnRleHQsXG4gICAgICAgICAgICAgICAgbG9jYXRpb246IGNvbnRlbnREYXRhLmxvY2F0aW9uLFxuICAgICAgICAgICAgICAgIGtpbmQ6IGNvbnRlbnROb2RlRGF0YUtpbmQoY29udGFpbmVyRGF0YS50eXBlKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHVzZXJfaWQ6IHVzZXJJbmZvLnVzZXJfaWQsXG4gICAgICAgICAgICBhbnRfdG9rZW46IHVzZXJJbmZvLmFudF90b2tlbixcbiAgICAgICAgICAgIGdyb3VwX2lkOiBwYWdlRGF0YS5ncm91cElkLFxuICAgICAgICAgICAgcGFnZV9pZDogcGFnZURhdGEucGFnZUlkLFxuICAgICAgICAgICAgcmVmZXJyaW5nX2ludF9pZDogcmVhY3Rpb25EYXRhLnBhcmVudElEXG4gICAgICAgIH07XG4gICAgICAgIGdldEpTT05QKFVSTHMuc2hhcmVSZWFjdGlvblVybCgpLCBkYXRhLCBzdWNjZXNzLCBmYWlsdXJlKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gZ2V0SlNPTlAodXJsLCBkYXRhLCBzdWNjZXNzLCBlcnJvcikge1xuICAgIHZhciBiYXNlVXJsID0gVVJMcy5hcHBTZXJ2ZXJVcmwoKTtcbiAgICBkb0dldEpTT05QKGJhc2VVcmwsIHVybCwgZGF0YSwgc3VjY2VzcywgZXJyb3IpO1xufVxuXG5mdW5jdGlvbiBwb3N0RXZlbnQoZXZlbnQpIHtcbiAgICB2YXIgYmFzZVVybCA9IFVSTHMuZXZlbnRzU2VydmVyVXJsKCk7XG4gICAgaWYgKEFwcE1vZGUuZGVidWcpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ0FOVEVOTkEgUG9zdGluZyBldmVudDogJyArIEpTT04uc3RyaW5naWZ5KGV2ZW50KSk7XG4gICAgfVxuICAgIGRvR2V0SlNPTlAoYmFzZVVybCwgVVJMcy5ldmVudFVybCgpLCBldmVudCwgZnVuY3Rpb24oKSB7IC8qc3VjY2VzcyovIH0sIGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgICAgIC8vIFRPRE86IGVycm9yIGhhbmRsaW5nXG4gICAgICAgIGNvbnNvbGUubG9nKCdBbiBlcnJvciBvY2N1cnJlZCBwb3N0aW5nIGV2ZW50OiAnLCBlcnJvcik7XG4gICAgfSk7XG59XG5cbi8vIElzc3VlcyBhIEpTT05QIHJlcXVlc3QgdG8gYSBnaXZlbiBzZXJ2ZXIuIFRvIHNlbmQgYSByZXF1ZXN0IHRvIHRoZSBhcHBsaWNhdGlvbiBzZXJ2ZXIsIHVzZSBnZXRKU09OUCBpbnN0ZWFkLlxuZnVuY3Rpb24gZG9HZXRKU09OUChiYXNlVXJsLCB1cmwsIGRhdGEsIHN1Y2Nlc3MsIGVycm9yKSB7XG4gICAgdmFyIG9wdGlvbnMgPSB7XG4gICAgICAgIHVybDogYmFzZVVybCArIHVybCxcbiAgICAgICAgdHlwZTogXCJnZXRcIixcbiAgICAgICAgY29udGVudFR5cGU6IFwiYXBwbGljYXRpb24vanNvblwiLFxuICAgICAgICBkYXRhVHlwZTogXCJqc29ucFwiLFxuICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbihyZXNwb25zZSwgdGV4dFN0YXR1cywgWEhSKSB7XG4gICAgICAgICAgICAvLyBUT0RPOiBSZXZpc2l0IHdoZXRoZXIgaXQncyByZWFsbHkgY29vbCB0byBrZXkgdGhpcyBvbiB0aGUgdGV4dFN0YXR1cyBvciBpZiB3ZSBzaG91bGQgYmUgbG9va2luZyBhdFxuICAgICAgICAgICAgLy8gICAgICAgdGhlIHN0YXR1cyBjb2RlIGluIHRoZSBYSFJcbiAgICAgICAgICAgIC8vIE5vdGU6IFRoZSBzZXJ2ZXIgY29tZXMgYmFjayB3aXRoIDIwMCByZXNwb25zZXMgd2l0aCBhIG5lc3RlZCBzdGF0dXMgb2YgXCJmYWlsXCIuLi5cbiAgICAgICAgICAgIGlmICh0ZXh0U3RhdHVzID09PSAnc3VjY2VzcycgJiYgcmVzcG9uc2Uuc3RhdHVzICE9PSAnZmFpbCcgJiYgKCFyZXNwb25zZS5kYXRhIHx8IHJlc3BvbnNlLmRhdGEuc3RhdHVzICE9PSAnZmFpbCcpKSB7XG4gICAgICAgICAgICAgICAgc3VjY2VzcyhyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gRm9yIEpTT05QIHJlcXVlc3RzLCBqUXVlcnkgZG9lc24ndCBjYWxsIGl0J3MgZXJyb3IgY2FsbGJhY2suIEl0IGNhbGxzIHN1Y2Nlc3MgaW5zdGVhZC5cbiAgICAgICAgICAgICAgICBlcnJvcihyZXNwb25zZS5tZXNzYWdlIHx8IHJlc3BvbnNlLmRhdGEubWVzc2FnZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGVycm9yOiBmdW5jdGlvbih4aHIsIHRleHRTdGF0dXMsIG1lc3NhZ2UpIHtcbiAgICAgICAgICAgIC8vIE9rYXksIGFwcGFyZW50bHkgalF1ZXJ5ICpkb2VzKiBjYWxsIGl0cyBlcnJvciBjYWxsYmFjayBmb3IgSlNPTlAgcmVxdWVzdHMgc29tZXRpbWVzLi4uXG4gICAgICAgICAgICAvLyBTcGVjaWZpY2FsbHksIHdoZW4gdGhlIHJlc3BvbnNlIHN0YXR1cyBpcyBPSyBidXQgYW4gZXJyb3Igb2NjdXJzIGNsaWVudC1zaWRlIHByb2Nlc3NpbmcgdGhlIHJlc3BvbnNlLlxuICAgICAgICAgICAgZXJyb3IgKG1lc3NhZ2UpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBpZiAoZGF0YSkge1xuICAgICAgICBvcHRpb25zLmRhdGEgPSB7IGpzb246IEpTT04uc3RyaW5naWZ5KGRhdGEpIH07XG4gICAgfVxuICAgICQuYWpheChvcHRpb25zKTtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGdldEpTT05QOiBnZXRKU09OUCxcbiAgICBwb3N0UGx1c09uZTogcG9zdFBsdXNPbmUsXG4gICAgcG9zdE5ld1JlYWN0aW9uOiBwb3N0TmV3UmVhY3Rpb24sXG4gICAgcG9zdENvbW1lbnQ6IHBvc3RDb21tZW50LFxuICAgIGdldENvbW1lbnRzOiBnZXRDb21tZW50cyxcbiAgICBwb3N0U2hhcmVSZWFjdGlvbjogcG9zdFNoYXJlUmVhY3Rpb24sXG4gICAgZmV0Y2hMb2NhdGlvbkRldGFpbHM6IGZldGNoTG9jYXRpb25EZXRhaWxzLFxuICAgIHBvc3RFdmVudDogcG9zdEV2ZW50XG59OyIsInZhciBVUkxDb25zdGFudHMgPSByZXF1aXJlKCcuL3VybC1jb25zdGFudHMnKTtcblxuZnVuY3Rpb24gY29tcHV0ZUN1cnJlbnRTY3JpcHRTcmMoKSB7XG4gICAgaWYgKGRvY3VtZW50LmN1cnJlbnRTY3JpcHQpIHtcbiAgICAgICAgcmV0dXJuIGRvY3VtZW50LmN1cnJlbnRTY3JpcHQuc3JjO1xuICAgIH1cbiAgICAvLyBJRSBmYWxsYmFjay4uLlxuICAgIHZhciBzY3JpcHRzID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ3NjcmlwdCcpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2NyaXB0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgc2NyaXB0ID0gc2NyaXB0c1tpXTtcbiAgICAgICAgaWYgKHNjcmlwdC5oYXNBdHRyaWJ1dGUoJ3NyYycpKSB7XG4gICAgICAgICAgICB2YXIgc2NyaXB0U3JjID0gc2NyaXB0LmdldEF0dHJpYnV0ZSgnc3JjJyk7XG4gICAgICAgICAgICB2YXIgYW50ZW5uYVNjcmlwdHMgPSBbICdhbnRlbm5hLmpzJywgJ2FudGVubmEubWluLmpzJywgJ2VuZ2FnZS5qcycsICdlbmdhZ2VfZnVsbC5qcycgXTtcbiAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgYW50ZW5uYVNjcmlwdHMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoc2NyaXB0U3JjLmluZGV4T2YoYW50ZW5uYVNjcmlwdHNbal0pICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2NyaXB0U3JjO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxudmFyIGN1cnJlbnRTY3JpcHRTcmMgPSBjb21wdXRlQ3VycmVudFNjcmlwdFNyYygpIHx8ICcnO1xuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgb2ZmbGluZTogY3VycmVudFNjcmlwdFNyYy5pbmRleE9mKFVSTENvbnN0YW50cy5ERVZFTE9QTUVOVCkgIT09IC0xIHx8IGN1cnJlbnRTY3JpcHRTcmMuaW5kZXhPZihVUkxDb25zdGFudHMuVEVTVCkgIT09IC0xLFxuICAgIHRlc3Q6IGN1cnJlbnRTY3JpcHRTcmMuaW5kZXhPZihVUkxDb25zdGFudHMuVEVTVCkgIT09IC0xLFxuICAgIGRlYnVnOiBjdXJyZW50U2NyaXB0U3JjLmluZGV4T2YoJz9kZWJ1ZycpICE9PSAtMVxufTsiLCJcbnZhciBpc1RvdWNoQnJvd3NlcjtcbnZhciBpc01vYmlsZURldmljZTtcblxuZnVuY3Rpb24gc3VwcG9ydHNUb3VjaCgpIHtcbiAgICBpZiAoaXNUb3VjaEJyb3dzZXIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAvL2lzVG91Y2hCcm93c2VyID0gKG5hdmlnYXRvci5tc01heFRvdWNoUG9pbnRzIHx8IFwib250b3VjaHN0YXJ0XCIgaW4gd2luZG93KSAmJiAoKHdpbmRvdy5tYXRjaE1lZGlhKFwib25seSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KVwiKSkubWF0Y2hlcyk7XG4gICAgICAgIGlzVG91Y2hCcm93c2VyID0gXCJvbnRvdWNoc3RhcnRcIiBpbiB3aW5kb3c7XG4gICAgfVxuICAgIHJldHVybiBpc1RvdWNoQnJvd3Nlcjtcbn1cblxuZnVuY3Rpb24gaXNNb2JpbGUoKSB7XG4gICAgaWYgKGlzTW9iaWxlRGV2aWNlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgaXNNb2JpbGVEZXZpY2UgPSBzdXBwb3J0c1RvdWNoKCkgJiZcbiAgICAgICAgICAgICgod2luZG93Lm1hdGNoTWVkaWEoXCJvbmx5IHNjcmVlbiBhbmQgKG1heC13aWR0aDogNDgwcHgpIGFuZCAob3JpZW50YXRpb246IHBvcnRyYWl0KVwiKSkubWF0Y2hlcyB8fFxuICAgICAgICAgICAgKHdpbmRvdy5tYXRjaE1lZGlhKFwib25seSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDY0MHB4KSBhbmQgKG9yaWVudGF0aW9uOiBsYW5kc2NhcGUpXCIpKS5tYXRjaGVzKTtcbiAgICB9XG4gICAgcmV0dXJuIGlzTW9iaWxlRGV2aWNlO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBzdXBwb3J0c1RvdWNoOiBzdXBwb3J0c1RvdWNoLFxuICAgIGlzTW9iaWxlOiBpc01vYmlsZVxufTsiLCJcbi8vIFJlLXVzYWJsZSBzdXBwb3J0IGZvciBtYW5hZ2luZyBhIGNvbGxlY3Rpb24gb2YgY2FsbGJhY2sgZnVuY3Rpb25zLlxuXG52YXIgYW50dWlkID0gMDsgLy8gXCJnbG9iYWxseVwiIHVuaXF1ZSBJRCB0aGF0IHdlIHVzZSB0byB0YWcgY2FsbGJhY2sgZnVuY3Rpb25zIGZvciBsYXRlciByZXRyaWV2YWwuIChUaGlzIGlzIGhvdyBcIm9mZlwiIHdvcmtzLilcblxuZnVuY3Rpb24gY3JlYXRlQ2FsbGJhY2tzKCkge1xuXG4gICAgdmFyIGNhbGxiYWNrcyA9IHt9O1xuXG4gICAgZnVuY3Rpb24gYWRkQ2FsbGJhY2soY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKGNhbGxiYWNrLmFudHVpZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBjYWxsYmFjay5hbnR1aWQgPSBhbnR1aWQrKztcbiAgICAgICAgfVxuICAgICAgICBjYWxsYmFja3NbY2FsbGJhY2suYW50dWlkXSA9IGNhbGxiYWNrO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJlbW92ZUNhbGxiYWNrKGNhbGxiYWNrKSB7XG4gICAgICAgIGlmIChjYWxsYmFjay5hbnR1aWQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgZGVsZXRlIGNhbGxiYWNrc1tjYWxsYmFjay5hbnR1aWRdO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0Q2FsbGJhY2tzKCkge1xuICAgICAgICB2YXIgYWxsQ2FsbGJhY2tzID0gW107XG4gICAgICAgIGZvciAodmFyIGtleSBpbiBjYWxsYmFja3MpIHtcbiAgICAgICAgICAgIGlmIChjYWxsYmFja3MuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgICAgIGFsbENhbGxiYWNrcy5wdXNoKGNhbGxiYWNrc1trZXldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYWxsQ2FsbGJhY2tzO1xuICAgIH1cblxuICAgIC8vIENvbnZlbmllbmNlIGZ1bmN0aW9uIHRoYXQgaW52b2tlcyBhbGwgY2FsbGJhY2tzIHdpdGggbm8gcGFyYW1ldGVycy4gQW55IGNhbGxiYWNrcyB0aGF0IG5lZWQgcGFyYW1zIGNhbiBiZSBjYWxsZWRcbiAgICAvLyBieSBjbGllbnRzIHVzaW5nIGdldENhbGxiYWNrcygpXG4gICAgZnVuY3Rpb24gaW52b2tlQWxsKCkge1xuICAgICAgICB2YXIgY2FsbGJhY2tzID0gZ2V0Q2FsbGJhY2tzKCk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2FsbGJhY2tzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjYWxsYmFja3NbaV0oKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGlzRW1wdHkoKSB7XG4gICAgICAgIHJldHVybiBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhjYWxsYmFja3MpLmxlbmd0aCA9PT0gMDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB0ZWFyZG93bigpIHtcbiAgICAgICAgY2FsbGJhY2tzID0ge307XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgYWRkOiBhZGRDYWxsYmFjayxcbiAgICAgICAgcmVtb3ZlOiByZW1vdmVDYWxsYmFjayxcbiAgICAgICAgZ2V0OiBnZXRDYWxsYmFja3MsXG4gICAgICAgIGlzRW1wdHk6IGlzRW1wdHksXG4gICAgICAgIGludm9rZUFsbDogaW52b2tlQWxsLFxuICAgICAgICB0ZWFyZG93bjogdGVhcmRvd25cbiAgICB9XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGU6IGNyZWF0ZUNhbGxiYWNrc1xufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciBNRDUgPSByZXF1aXJlKCcuL21kNScpO1xuXG5mdW5jdGlvbiBnZXRDbGVhblRleHQoJGVsZW1lbnQpIHtcbiAgICB2YXIgJGNsb25lID0gJGVsZW1lbnQuY2xvbmUoKTtcbiAgICAvLyBSZW1vdmUgYW55IGVsZW1lbnRzIHRoYXQgd2UgZG9uJ3Qgd2FudCBpbmNsdWRlZCBpbiB0aGUgdGV4dCBjYWxjdWxhdGlvblxuICAgICRjbG9uZS5maW5kKCdpZnJhbWUsIGltZywgc2NyaXB0LCB2aWRlbywgLmFudGVubmEsIC5uby1hbnQnKS5yZW1vdmUoKS5lbmQoKTtcbiAgICAvLyBUaGVuIG1hbnVhbGx5IGNvbnZlcnQgYW55IDxicj4gdGFncyBpbnRvIHNwYWNlcyAob3RoZXJ3aXNlLCB3b3JkcyB3aWxsIGdldCBhcHBlbmRlZCBieSB0aGUgdGV4dCgpIGNhbGwpXG4gICAgdmFyIGh0bWwgPSAkY2xvbmUuaHRtbCgpLnJlcGxhY2UoLzxcXFNiclxcU1xcLz8+L2dpLCAnICcpO1xuICAgIC8vIFB1dCB0aGUgSFRNTCBiYWNrIGludG8gYSBkaXYgYW5kIGNhbGwgdGV4dCgpLCB3aGljaCBkb2VzIG1vc3Qgb2YgdGhlIGhlYXZ5IGxpZnRpbmdcbiAgICB2YXIgdGV4dCA9ICQoJzxkaXY+JyArIGh0bWwgKyAnPC9kaXY+JykudGV4dCgpLnRvTG93ZXJDYXNlKCkudHJpbSgpO1xuICAgIHRleHQgPSB0ZXh0LnJlcGxhY2UoL1tcXG5cXHJcXHRdL2dpLCAnICcpOyAvLyBSZXBsYWNlIGFueSBuZXdsaW5lcy90YWJzIHdpdGggc3BhY2VzXG4gICAgcmV0dXJuIHRleHQ7XG59XG5cbmZ1bmN0aW9uIGhhc2hUZXh0KGVsZW1lbnQsIHN1ZmZpeCkge1xuICAgIHZhciB0ZXh0ID0gZ2V0Q2xlYW5UZXh0KGVsZW1lbnQpO1xuICAgIGlmICh0ZXh0KSB7XG4gICAgICAgIHZhciBoYXNoVGV4dCA9IFwicmRyLXRleHQtXCIgKyB0ZXh0O1xuICAgICAgICBpZiAoc3VmZml4ICE9PSB1bmRlZmluZWQpIHsgLy8gQXBwZW5kIHRoZSBvcHRpb25hbCBzdWZmaXhcbiAgICAgICAgICAgIGhhc2hUZXh0ICs9ICctJyArIHN1ZmZpeDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gTUQ1LmhleF9tZDUoaGFzaFRleHQpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gaGFzaFVybCh1cmwpIHtcbiAgICByZXR1cm4gTUQ1LmhleF9tZDUodXJsKTtcbn1cblxuZnVuY3Rpb24gaGFzaEltYWdlKGltYWdlVXJsLCBncm91cFNldHRpbmdzKSB7XG4gICAgaWYgKGltYWdlVXJsICYmIGltYWdlVXJsLmxlbmd0aCA+IDApIHtcbiAgICAgICAgaW1hZ2VVcmwgPSBmaWRkbGVXaXRoSW1hZ2VBbmRNZWRpYVVybHMoaW1hZ2VVcmwsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICB2YXIgaGFzaFRleHQgPSAncmRyLWltZy0nICsgaW1hZ2VVcmw7XG4gICAgICAgIHJldHVybiBNRDUuaGV4X21kNShoYXNoVGV4dCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBoYXNoTWVkaWEobWVkaWFVcmwsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICBpZiAobWVkaWFVcmwgJiYgbWVkaWFVcmwubGVuZ3RoID4gMCkge1xuICAgICAgICBtZWRpYVVybCA9IGZpZGRsZVdpdGhJbWFnZUFuZE1lZGlhVXJscyhtZWRpYVVybCwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIHZhciBoYXNoVGV4dCA9ICdyZHItbWVkaWEtJyArIG1lZGlhVXJsO1xuICAgICAgICByZXR1cm4gTUQ1LmhleF9tZDUoaGFzaFRleHQpO1xuICAgIH1cbn1cblxuLy8gVE9ETzogcmV2aWV3LiBjb3BpZWQgZnJvbSBlbmdhZ2VfZnVsbFxuZnVuY3Rpb24gZmlkZGxlV2l0aEltYWdlQW5kTWVkaWFVcmxzKHVybCwgZ3JvdXBTZXR0aW5ncykge1xuICAgIC8vIGZpZGRsZSB3aXRoIHRoZSB1cmwgdG8gYWNjb3VudCBmb3Igcm90YXRpbmcgc3ViZG9tYWlucyAoaS5lLiwgZGlmZmVyaW5nIENETiBuYW1lcyBmb3IgaW1hZ2UgaG9zdHMpXG4gICAgLy8gcmVnZXggZnJvbSBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzY0NDkzNDAvaG93LXRvLWdldC10b3AtbGV2ZWwtZG9tYWluLWJhc2UtZG9tYWluLWZyb20tdGhlLXVybC1pbi1qYXZhc2NyaXB0XG4gICAgLy8gbW9kaWZpZWQgdG8gc3VwcG9ydCAyIGNoYXJhY3RlciBzdWZmaXhlcywgbGlrZSAuZm0gb3IgLmlvXG4gICAgdmFyIEhPU1RET01BSU4gPSAvWy1cXHddK1xcLig/OlstXFx3XStcXC54bi0tWy1cXHddK3xbLVxcd117Mix9fFstXFx3XStcXC5bLVxcd117Mn0pJC9pO1xuICAgIHZhciBzcmNBcnJheSA9IHVybC5zcGxpdCgnLycpO1xuICAgIHNyY0FycmF5LnNwbGljZSgwLDIpO1xuXG4gICAgdmFyIGRvbWFpbldpdGhQb3J0ID0gc3JjQXJyYXkuc2hpZnQoKTtcbiAgICBpZiAoIWRvbWFpbldpdGhQb3J0KSB7IC8vdGhpcyBjb3VsZCBiZSB1bmRlZmluZWQgaWYgdGhlIHVybCBub3QgdmFsaWQgb3IgaXMgc29tZXRoaW5nIGxpa2UgamF2YXNjcmlwdDp2b2lkXG4gICAgICAgIHJldHVybiB1cmw7XG4gICAgfVxuICAgIHZhciBkb21haW4gPSBkb21haW5XaXRoUG9ydC5zcGxpdCgnOicpWzBdOyAvLyBnZXQgZG9tYWluLCBzdHJpcCBwb3J0XG5cbiAgICB2YXIgZmlsZW5hbWUgPSBzcmNBcnJheS5qb2luKCcvJyk7XG5cbiAgICAvLyB0ZXN0IGV4YW1wbGVzOlxuICAgIC8vIHZhciBtYXRjaCA9IEhPU1RET01BSU4uZXhlYygnaHR0cDovL21lZGlhMS5hYi5jZC5vbi10aGUtdGVsbHkuYmJjLmNvLnVrLycpOyAvLyBmYWlsczogdHJhaWxpbmcgc2xhc2hcbiAgICAvLyB2YXIgbWF0Y2ggPSBIT1NURE9NQUlOLmV4ZWMoJ2h0dHA6Ly9tZWRpYTEuYWIuY2Qub24tdGhlLXRlbGx5LmJiYy5jby51aycpOyAvLyBzdWNjZXNzXG4gICAgLy8gdmFyIG1hdGNoID0gSE9TVERPTUFJTi5leGVjKCdtZWRpYTEuYWIuY2Qub24tdGhlLXRlbGx5LmJiYy5jby51aycpOyAvLyBzdWNjZXNzXG4gICAgdmFyIG1hdGNoID0gSE9TVERPTUFJTi5leGVjKGRvbWFpbik7XG4gICAgaWYgKG1hdGNoID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIHVybDtcbiAgICB9IGVsc2Uge1xuICAgICAgICB1cmwgPSBtYXRjaFswXSArICcvJyArIGZpbGVuYW1lO1xuICAgIH1cbiAgICBpZiAoZ3JvdXBTZXR0aW5ncy51cmwuaWdub3JlTWVkaWFVcmxRdWVyeSgpICYmIHVybC5pbmRleE9mKCc/JykpIHtcbiAgICAgICAgdXJsID0gdXJsLnNwbGl0KCc/JylbMF07XG4gICAgfVxuICAgIHJldHVybiB1cmw7XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBoYXNoVGV4dDogaGFzaFRleHQsXG4gICAgaGFzaEltYWdlOiBoYXNoSW1hZ2UsXG4gICAgaGFzaE1lZGlhOiBoYXNoTWVkaWEsXG4gICAgaGFzaFVybDogaGFzaFVybFxufTsiLCJcbnZhciBsb2FkZWRqUXVlcnk7XG52YXIgY2FsbGJhY2tzID0gW107XG5cbi8vIE5vdGlmaWVzIHRoZSBqUXVlcnkgcHJvdmlkZXIgdGhhdCB3ZSd2ZSBsb2FkZWQgdGhlIGpRdWVyeSBsaWJyYXJ5LlxuZnVuY3Rpb24gbG9hZGVkKCkge1xuICAgIGxvYWRlZGpRdWVyeSA9IGpRdWVyeS5ub0NvbmZsaWN0KCk7XG4gICAgbm90aWZ5Q2FsbGJhY2tzKCk7XG59XG5cbmZ1bmN0aW9uIG5vdGlmeUNhbGxiYWNrcygpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNhbGxiYWNrcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjYWxsYmFja3NbaV0obG9hZGVkalF1ZXJ5KTtcbiAgICB9XG4gICAgY2FsbGJhY2tzID0gW107XG59XG5cbi8vIFJlZ2lzdGVycyB0aGUgZ2l2ZW4gY2FsbGJhY2sgdG8gYmUgbm90aWZpZWQgd2hlbiBvdXIgdmVyc2lvbiBvZiBqUXVlcnkgaXMgbG9hZGVkLlxuZnVuY3Rpb24gb25Mb2FkKGNhbGxiYWNrKSB7XG4gICAgaWYgKGxvYWRlZGpRdWVyeSkge1xuICAgICAgICBjYWxsYmFjayhsb2FkZWRqUXVlcnkpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGNhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKTtcbiAgICB9XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBsb2FkZWQ6IGxvYWRlZCxcbiAgICBvbkxvYWQ6IG9uTG9hZFxufTsiLCIvKlxuICogQSBKYXZhU2NyaXB0IGltcGxlbWVudGF0aW9uIG9mIHRoZSBSU0EgRGF0YSBTZWN1cml0eSwgSW5jLiBNRDUgTWVzc2FnZVxuICogRGlnZXN0IEFsZ29yaXRobSwgYXMgZGVmaW5lZCBpbiBSRkMgMTMyMS5cbiAqIFZlcnNpb24gMi4xIENvcHlyaWdodCAoQykgUGF1bCBKb2huc3RvbiAxOTk5IC0gMjAwMi5cbiAqIE90aGVyIGNvbnRyaWJ1dG9yczogR3JlZyBIb2x0LCBBbmRyZXcgS2VwZXJ0LCBZZG5hciwgTG9zdGluZXRcbiAqIERpc3RyaWJ1dGVkIHVuZGVyIHRoZSBCU0QgTGljZW5zZVxuICogU2VlIGh0dHA6Ly9wYWpob21lLm9yZy51ay9jcnlwdC9tZDUgZm9yIG1vcmUgaW5mby5cbiAqL1xuXG52YXIgaGV4Y2FzZSA9IDA7XG52YXIgYjY0cGFkICA9IFwiXCI7XG52YXIgY2hyc3ogPSA4O1xuXG5mdW5jdGlvbiBoZXhfbWQ1KHMpIHtcbiAgICByZXR1cm4gYmlubDJoZXgoY29yZV9tZDUoc3RyMmJpbmwocyksIHMubGVuZ3RoICogY2hyc3opKTtcbn1cblxuZnVuY3Rpb24gY29yZV9tZDUoeCwgbGVuKSB7XG4gICAgeFtsZW4gPj4gNV0gfD0gMHg4MCA8PCAoKGxlbikgJSAzMik7XG4gICAgeFsoKChsZW4gKyA2NCkgPj4+IDkpIDw8IDQpICsgMTRdID0gbGVuO1xuICAgIHZhciBhID0gMTczMjU4NDE5MztcbiAgICB2YXIgYiA9IC0yNzE3MzM4Nzk7XG4gICAgdmFyIGMgPSAtMTczMjU4NDE5NDtcbiAgICB2YXIgZCA9IDI3MTczMzg3ODtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHgubGVuZ3RoOyBpICs9IDE2KSB7XG4gICAgICAgIHZhciBvbGRhID0gYTtcbiAgICAgICAgdmFyIG9sZGIgPSBiO1xuICAgICAgICB2YXIgb2xkYyA9IGM7XG4gICAgICAgIHZhciBvbGRkID0gZDtcblxuICAgICAgICBhID0gbWQ1X2ZmKGEsIGIsIGMsIGQsIHhbaSArIDBdLCA3LCAtNjgwODc2OTM2KTtcbiAgICAgICAgZCA9IG1kNV9mZihkLCBhLCBiLCBjLCB4W2kgKyAxXSwgMTIsIC0zODk1NjQ1ODYpO1xuICAgICAgICBjID0gbWQ1X2ZmKGMsIGQsIGEsIGIsIHhbaSArIDJdLCAxNywgNjA2MTA1ODE5KTtcbiAgICAgICAgYiA9IG1kNV9mZihiLCBjLCBkLCBhLCB4W2kgKyAzXSwgMjIsIC0xMDQ0NTI1MzMwKTtcbiAgICAgICAgYSA9IG1kNV9mZihhLCBiLCBjLCBkLCB4W2kgKyA0XSwgNywgLTE3NjQxODg5Nyk7XG4gICAgICAgIGQgPSBtZDVfZmYoZCwgYSwgYiwgYywgeFtpICsgNV0sIDEyLCAxMjAwMDgwNDI2KTtcbiAgICAgICAgYyA9IG1kNV9mZihjLCBkLCBhLCBiLCB4W2kgKyA2XSwgMTcsIC0xNDczMjMxMzQxKTtcbiAgICAgICAgYiA9IG1kNV9mZihiLCBjLCBkLCBhLCB4W2kgKyA3XSwgMjIsIC00NTcwNTk4Myk7XG4gICAgICAgIGEgPSBtZDVfZmYoYSwgYiwgYywgZCwgeFtpICsgOF0sIDcsIDE3NzAwMzU0MTYpO1xuICAgICAgICBkID0gbWQ1X2ZmKGQsIGEsIGIsIGMsIHhbaSArIDldLCAxMiwgLTE5NTg0MTQ0MTcpO1xuICAgICAgICBjID0gbWQ1X2ZmKGMsIGQsIGEsIGIsIHhbaSArIDEwXSwgMTcsIC00MjA2Myk7XG4gICAgICAgIGIgPSBtZDVfZmYoYiwgYywgZCwgYSwgeFtpICsgMTFdLCAyMiwgLTE5OTA0MDQxNjIpO1xuICAgICAgICBhID0gbWQ1X2ZmKGEsIGIsIGMsIGQsIHhbaSArIDEyXSwgNywgMTgwNDYwMzY4Mik7XG4gICAgICAgIGQgPSBtZDVfZmYoZCwgYSwgYiwgYywgeFtpICsgMTNdLCAxMiwgLTQwMzQxMTAxKTtcbiAgICAgICAgYyA9IG1kNV9mZihjLCBkLCBhLCBiLCB4W2kgKyAxNF0sIDE3LCAtMTUwMjAwMjI5MCk7XG4gICAgICAgIGIgPSBtZDVfZmYoYiwgYywgZCwgYSwgeFtpICsgMTVdLCAyMiwgMTIzNjUzNTMyOSk7XG5cbiAgICAgICAgYSA9IG1kNV9nZyhhLCBiLCBjLCBkLCB4W2kgKyAxXSwgNSwgLTE2NTc5NjUxMCk7XG4gICAgICAgIGQgPSBtZDVfZ2coZCwgYSwgYiwgYywgeFtpICsgNl0sIDksIC0xMDY5NTAxNjMyKTtcbiAgICAgICAgYyA9IG1kNV9nZyhjLCBkLCBhLCBiLCB4W2kgKyAxMV0sIDE0LCA2NDM3MTc3MTMpO1xuICAgICAgICBiID0gbWQ1X2dnKGIsIGMsIGQsIGEsIHhbaSArIDBdLCAyMCwgLTM3Mzg5NzMwMik7XG4gICAgICAgIGEgPSBtZDVfZ2coYSwgYiwgYywgZCwgeFtpICsgNV0sIDUsIC03MDE1NTg2OTEpO1xuICAgICAgICBkID0gbWQ1X2dnKGQsIGEsIGIsIGMsIHhbaSArIDEwXSwgOSwgMzgwMTYwODMpO1xuICAgICAgICBjID0gbWQ1X2dnKGMsIGQsIGEsIGIsIHhbaSArIDE1XSwgMTQsIC02NjA0NzgzMzUpO1xuICAgICAgICBiID0gbWQ1X2dnKGIsIGMsIGQsIGEsIHhbaSArIDRdLCAyMCwgLTQwNTUzNzg0OCk7XG4gICAgICAgIGEgPSBtZDVfZ2coYSwgYiwgYywgZCwgeFtpICsgOV0sIDUsIDU2ODQ0NjQzOCk7XG4gICAgICAgIGQgPSBtZDVfZ2coZCwgYSwgYiwgYywgeFtpICsgMTRdLCA5LCAtMTAxOTgwMzY5MCk7XG4gICAgICAgIGMgPSBtZDVfZ2coYywgZCwgYSwgYiwgeFtpICsgM10sIDE0LCAtMTg3MzYzOTYxKTtcbiAgICAgICAgYiA9IG1kNV9nZyhiLCBjLCBkLCBhLCB4W2kgKyA4XSwgMjAsIDExNjM1MzE1MDEpO1xuICAgICAgICBhID0gbWQ1X2dnKGEsIGIsIGMsIGQsIHhbaSArIDEzXSwgNSwgLTE0NDQ2ODE0NjcpO1xuICAgICAgICBkID0gbWQ1X2dnKGQsIGEsIGIsIGMsIHhbaSArIDJdLCA5LCAtNTE0MDM3ODQpO1xuICAgICAgICBjID0gbWQ1X2dnKGMsIGQsIGEsIGIsIHhbaSArIDddLCAxNCwgMTczNTMyODQ3Myk7XG4gICAgICAgIGIgPSBtZDVfZ2coYiwgYywgZCwgYSwgeFtpICsgMTJdLCAyMCwgLTE5MjY2MDc3MzQpO1xuXG4gICAgICAgIGEgPSBtZDVfaGgoYSwgYiwgYywgZCwgeFtpICsgNV0sIDQsIC0zNzg1NTgpO1xuICAgICAgICBkID0gbWQ1X2hoKGQsIGEsIGIsIGMsIHhbaSArIDhdLCAxMSwgLTIwMjI1NzQ0NjMpO1xuICAgICAgICBjID0gbWQ1X2hoKGMsIGQsIGEsIGIsIHhbaSArIDExXSwgMTYsIDE4MzkwMzA1NjIpO1xuICAgICAgICBiID0gbWQ1X2hoKGIsIGMsIGQsIGEsIHhbaSArIDE0XSwgMjMsIC0zNTMwOTU1Nik7XG4gICAgICAgIGEgPSBtZDVfaGgoYSwgYiwgYywgZCwgeFtpICsgMV0sIDQsIC0xNTMwOTkyMDYwKTtcbiAgICAgICAgZCA9IG1kNV9oaChkLCBhLCBiLCBjLCB4W2kgKyA0XSwgMTEsIDEyNzI4OTMzNTMpO1xuICAgICAgICBjID0gbWQ1X2hoKGMsIGQsIGEsIGIsIHhbaSArIDddLCAxNiwgLTE1NTQ5NzYzMik7XG4gICAgICAgIGIgPSBtZDVfaGgoYiwgYywgZCwgYSwgeFtpICsgMTBdLCAyMywgLTEwOTQ3MzA2NDApO1xuICAgICAgICBhID0gbWQ1X2hoKGEsIGIsIGMsIGQsIHhbaSArIDEzXSwgNCwgNjgxMjc5MTc0KTtcbiAgICAgICAgZCA9IG1kNV9oaChkLCBhLCBiLCBjLCB4W2kgKyAwXSwgMTEsIC0zNTg1MzcyMjIpO1xuICAgICAgICBjID0gbWQ1X2hoKGMsIGQsIGEsIGIsIHhbaSArIDNdLCAxNiwgLTcyMjUyMTk3OSk7XG4gICAgICAgIGIgPSBtZDVfaGgoYiwgYywgZCwgYSwgeFtpICsgNl0sIDIzLCA3NjAyOTE4OSk7XG4gICAgICAgIGEgPSBtZDVfaGgoYSwgYiwgYywgZCwgeFtpICsgOV0sIDQsIC02NDAzNjQ0ODcpO1xuICAgICAgICBkID0gbWQ1X2hoKGQsIGEsIGIsIGMsIHhbaSArIDEyXSwgMTEsIC00MjE4MTU4MzUpO1xuICAgICAgICBjID0gbWQ1X2hoKGMsIGQsIGEsIGIsIHhbaSArIDE1XSwgMTYsIDUzMDc0MjUyMCk7XG4gICAgICAgIGIgPSBtZDVfaGgoYiwgYywgZCwgYSwgeFtpICsgMl0sIDIzLCAtOTk1MzM4NjUxKTtcblxuICAgICAgICBhID0gbWQ1X2lpKGEsIGIsIGMsIGQsIHhbaSArIDBdLCA2LCAtMTk4NjMwODQ0KTtcbiAgICAgICAgZCA9IG1kNV9paShkLCBhLCBiLCBjLCB4W2kgKyA3XSwgMTAsIDExMjY4OTE0MTUpO1xuICAgICAgICBjID0gbWQ1X2lpKGMsIGQsIGEsIGIsIHhbaSArIDE0XSwgMTUsIC0xNDE2MzU0OTA1KTtcbiAgICAgICAgYiA9IG1kNV9paShiLCBjLCBkLCBhLCB4W2kgKyA1XSwgMjEsIC01NzQzNDA1NSk7XG4gICAgICAgIGEgPSBtZDVfaWkoYSwgYiwgYywgZCwgeFtpICsgMTJdLCA2LCAxNzAwNDg1NTcxKTtcbiAgICAgICAgZCA9IG1kNV9paShkLCBhLCBiLCBjLCB4W2kgKyAzXSwgMTAsIC0xODk0OTg2NjA2KTtcbiAgICAgICAgYyA9IG1kNV9paShjLCBkLCBhLCBiLCB4W2kgKyAxMF0sIDE1LCAtMTA1MTUyMyk7XG4gICAgICAgIGIgPSBtZDVfaWkoYiwgYywgZCwgYSwgeFtpICsgMV0sIDIxLCAtMjA1NDkyMjc5OSk7XG4gICAgICAgIGEgPSBtZDVfaWkoYSwgYiwgYywgZCwgeFtpICsgOF0sIDYsIDE4NzMzMTMzNTkpO1xuICAgICAgICBkID0gbWQ1X2lpKGQsIGEsIGIsIGMsIHhbaSArIDE1XSwgMTAsIC0zMDYxMTc0NCk7XG4gICAgICAgIGMgPSBtZDVfaWkoYywgZCwgYSwgYiwgeFtpICsgNl0sIDE1LCAtMTU2MDE5ODM4MCk7XG4gICAgICAgIGIgPSBtZDVfaWkoYiwgYywgZCwgYSwgeFtpICsgMTNdLCAyMSwgMTMwOTE1MTY0OSk7XG4gICAgICAgIGEgPSBtZDVfaWkoYSwgYiwgYywgZCwgeFtpICsgNF0sIDYsIC0xNDU1MjMwNzApO1xuICAgICAgICBkID0gbWQ1X2lpKGQsIGEsIGIsIGMsIHhbaSArIDExXSwgMTAsIC0xMTIwMjEwMzc5KTtcbiAgICAgICAgYyA9IG1kNV9paShjLCBkLCBhLCBiLCB4W2kgKyAyXSwgMTUsIDcxODc4NzI1OSk7XG4gICAgICAgIGIgPSBtZDVfaWkoYiwgYywgZCwgYSwgeFtpICsgOV0sIDIxLCAtMzQzNDg1NTUxKTtcblxuICAgICAgICBhID0gc2FmZV9hZGQoYSwgb2xkYSk7XG4gICAgICAgIGIgPSBzYWZlX2FkZChiLCBvbGRiKTtcbiAgICAgICAgYyA9IHNhZmVfYWRkKGMsIG9sZGMpO1xuICAgICAgICBkID0gc2FmZV9hZGQoZCwgb2xkZCk7XG4gICAgfVxuICAgIHJldHVybiBbYSwgYiwgYywgZF07XG59XG5cbmZ1bmN0aW9uIG1kNV9jbW4ocSwgYSwgYiwgeCwgcywgdCkge1xuICAgIHJldHVybiBzYWZlX2FkZChiaXRfcm9sKHNhZmVfYWRkKHNhZmVfYWRkKGEsIHEpLCBzYWZlX2FkZCh4LCB0KSksIHMpLCBiKTtcbn1cblxuZnVuY3Rpb24gbWQ1X2ZmKGEsIGIsIGMsIGQsIHgsIHMsIHQpIHtcbiAgICByZXR1cm4gbWQ1X2NtbigoYiAmIGMpIHwgKCh+YikgJiBkKSwgYSwgYiwgeCwgcywgdCk7XG59XG5cbmZ1bmN0aW9uIG1kNV9nZyhhLCBiLCBjLCBkLCB4LCBzLCB0KSB7XG4gICAgcmV0dXJuIG1kNV9jbW4oKGIgJiBkKSB8IChjICYgKH5kKSksIGEsIGIsIHgsIHMsIHQpO1xufVxuXG5mdW5jdGlvbiBtZDVfaGgoYSwgYiwgYywgZCwgeCwgcywgdCkge1xuICAgIHJldHVybiBtZDVfY21uKGIgXiBjIF4gZCwgYSwgYiwgeCwgcywgdCk7XG59XG5cbmZ1bmN0aW9uIG1kNV9paShhLCBiLCBjLCBkLCB4LCBzLCB0KSB7XG4gICAgcmV0dXJuIG1kNV9jbW4oYyBeIChiIHwgKH5kKSksIGEsIGIsIHgsIHMsIHQpO1xufVxuXG5mdW5jdGlvbiBzYWZlX2FkZCh4LCB5KSB7XG4gICAgdmFyIGxzdyA9ICh4ICYgMHhGRkZGKSArICh5ICYgMHhGRkZGKTtcbiAgICB2YXIgbXN3ID0gKHggPj4gMTYpICsgKHkgPj4gMTYpICsgKGxzdyA+PiAxNik7XG4gICAgcmV0dXJuIChtc3cgPDwgMTYpIHwgKGxzdyAmIDB4RkZGRik7XG59XG5cbmZ1bmN0aW9uIGJpdF9yb2wobnVtLCBjbnQpIHtcbiAgICByZXR1cm4gKG51bSA8PCBjbnQpIHwgKG51bSA+Pj4gKDMyIC0gY250KSk7XG59XG5cbmZ1bmN0aW9uIHN0cjJiaW5sKHN0cikge1xuICAgIHZhciBiaW4gPSBbXTtcbiAgICB2YXIgbWFzayA9ICgxIDw8IGNocnN6KSAtIDE7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHIubGVuZ3RoICogY2hyc3o7IGkgKz0gY2hyc3opIHtcbiAgICAgICAgYmluW2kgPj4gNV0gfD0gKHN0ci5jaGFyQ29kZUF0KGkgLyBjaHJzeikgJiBtYXNrKSA8PCAoaSAlIDMyKTtcbiAgICB9XG4gICAgcmV0dXJuIGJpbjtcbn1cblxuZnVuY3Rpb24gYmlubDJoZXgoYmluYXJyYXkpIHtcbiAgICB2YXIgaGV4X3RhYiA9IGhleGNhc2UgPyBcIjAxMjM0NTY3ODlBQkNERUZcIiA6IFwiMDEyMzQ1Njc4OWFiY2RlZlwiO1xuICAgIHZhciBzdHIgPSBcIlwiO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYmluYXJyYXkubGVuZ3RoICogNDsgaSsrKSB7XG4gICAgICAgIHN0ciArPSBoZXhfdGFiLmNoYXJBdCgoYmluYXJyYXlbaSA+PiAyXSA+PiAoKGkgJSA0KSAqIDggKyA0KSkgJiAweEYpICsgaGV4X3RhYi5jaGFyQXQoKGJpbmFycmF5W2kgPj4gMl0gPj4gKChpICUgNCkgKiA4KSkgJiAweEYpO1xuICAgIH1cbiAgICByZXR1cm4gc3RyO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgaGV4X21kNTogaGV4X21kNVxufTsiLCIvL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgJ3N1bW1hcnlfd2lkZ2V0X19yZWFjdGlvbnMnOiAnUmVhY3Rpb25zJyxcbiAgICAnc3VtbWFyeV93aWRnZXRfX3JlYWN0aW9uc19vbmUnOiAnMSBSZWFjdGlvbicsXG4gICAgJ3N1bW1hcnlfd2lkZ2V0X19yZWFjdGlvbnNfbWFueSc6ICd7MH0gUmVhY3Rpb25zJyxcblxuICAgICdyZWFjdGlvbnNfd2lkZ2V0X190aXRsZSc6ICdSZWFjdGlvbnMnLFxuICAgICdyZWFjdGlvbnNfd2lkZ2V0X190aXRsZV90aGluayc6ICdXaGF0IGRvIHlvdSB0aGluaz8nLFxuICAgICdyZWFjdGlvbnNfd2lkZ2V0X190aXRsZV90aGFua3MnOiAnVGhhbmtzIGZvciB5b3VyIHJlYWN0aW9uIScsXG4gICAgJ3JlYWN0aW9uc193aWRnZXRfX3RpdGxlX3NpZ25pbic6ICdTaWduIGluIFJlcXVpcmVkJyxcbiAgICAncmVhY3Rpb25zX3dpZGdldF9fdGl0bGVfYmxvY2tlZCc6ICdCbG9ja2VkIFJlYWN0aW9uJyxcbiAgICAncmVhY3Rpb25zX3dpZGdldF9fdGl0bGVfZXJyb3InOiAnRXJyb3InLFxuICAgICdyZWFjdGlvbnNfd2lkZ2V0X19iYWNrJzogJ0JhY2snLFxuXG4gICAgJ3JlYWN0aW9uc19wYWdlX19ub19yZWFjdGlvbnMnOiAnTm8gcmVhY3Rpb25zIHlldCEnLFxuICAgICdyZWFjdGlvbnNfcGFnZV9fdGhpbmsnOiAnV2hhdCBkbyB5b3UgdGhpbms/JyxcblxuICAgICdtZWRpYV9pbmRpY2F0b3JfX3RoaW5rJzogJ1doYXQgZG8geW91IHRoaW5rPycsXG5cbiAgICAncG9wdXBfd2lkZ2V0X190aGluayc6ICdXaGF0IGRvIHlvdSB0aGluaz8nLFxuXG4gICAgJ2RlZmF1bHRzX3BhZ2VfX2FkZCc6ICcrIEFkZCBZb3VyIE93bicsXG4gICAgJ2RlZmF1bHRzX3BhZ2VfX29rJzogJ29rJyxcblxuICAgICdjb25maXJtYXRpb25fcGFnZV9fc2hhcmUnOiAnU2hhcmUgeW91ciByZWFjdGlvbjonLFxuXG4gICAgJ2NvbW1lbnRzX3BhZ2VfX2hlYWRlcic6ICcoezB9KSBDb21tZW50czonLFxuXG4gICAgJ2NvbW1lbnRfYXJlYV9fYWRkJzogJ0NvbW1lbnQnLFxuICAgICdjb21tZW50X2FyZWFfX3BsYWNlaG9sZGVyJzogJ0FkZCBjb21tZW50cyBvciAjaGFzaHRhZ3MnLFxuICAgICdjb21tZW50X2FyZWFfX3RoYW5rcyc6ICdUaGFua3MgZm9yIHlvdXIgY29tbWVudC4nLFxuICAgICdjb21tZW50X2FyZWFfX2NvdW50JzogJzxzcGFuIGNsYXNzPVwiYW50ZW5uYS1jb21tZW50LWNvdW50XCI+PC9zcGFuPiBjaGFyYWN0ZXJzIGxlZnQnLFxuXG4gICAgJ2xvY2F0aW9uc19wYWdlX19wYWdlbGV2ZWwnOiAnVG8gdGhpcyB3aG9sZSBwYWdlJyxcbiAgICAnbG9jYXRpb25zX3BhZ2VfX2NvdW50X29uZSc6ICc8c3BhbiBjbGFzcz1cImFudGVubmEtbG9jYXRpb24tY291bnRcIj4xPC9zcGFuPjxicj5yZWFjdGlvbicsXG4gICAgJ2xvY2F0aW9uc19wYWdlX19jb3VudF9tYW55JzogJzxzcGFuIGNsYXNzPVwiYW50ZW5uYS1sb2NhdGlvbi1jb3VudFwiPnswfTwvc3Bhbj48YnI+cmVhY3Rpb25zJyxcbiAgICAnbG9jYXRpb25zX3BhZ2VfX3ZpZGVvJzogJ1ZpZGVvJyxcblxuICAgICdjYWxsX3RvX2FjdGlvbl9sYWJlbF9fcmVzcG9uc2VzJzogJ1JlYWN0aW9ucycsXG4gICAgJ2NhbGxfdG9fYWN0aW9uX2xhYmVsX19yZXNwb25zZXNfb25lJzogJzEgUmVhY3Rpb24nLFxuICAgICdjYWxsX3RvX2FjdGlvbl9sYWJlbF9fcmVzcG9uc2VzX21hbnknOiAnezB9IFJlYWN0aW9ucycsXG5cbiAgICAnYmxvY2tlZF9wYWdlX19tZXNzYWdlMSc6ICdUaGlzIHNpdGUgaGFzIGJsb2NrZWQgc29tZSBvciBhbGwgb2YgdGhlIHRleHQgaW4gdGhhdCByZWFjdGlvbi4nLFxuICAgICdibG9ja2VkX3BhZ2VfX21lc3NhZ2UyJzogJ1BsZWFzZSB0cnkgc29tZXRoaW5nIHRoYXQgd2lsbCBiZSBtb3JlIGFwcHJvcHJpYXRlIGZvciB0aGlzIGNvbW11bml0eS4nLFxuXG4gICAgJ3BlbmRpbmdfcGFnZV9fbWVzc2FnZV9hcHBlYXInOiAnWW91ciByZWFjdGlvbiB3aWxsIGFwcGVhciBvbmNlIGl0IGlzIHJldmlld2VkLiBBbGwgbmV3IHJlYWN0aW9ucyBtdXN0IG1lZXQgb3VyIGNvbW11bml0eSBndWlkZWxpbmVzLicsXG5cbiAgICAnZXJyb3JfcGFnZV9fbWVzc2FnZSc6ICdPb3BzISBXZSByZWFsbHkgdmFsdWUgeW91ciBmZWVkYmFjaywgYnV0IHNvbWV0aGluZyB3ZW50IHdyb25nLicsXG5cbiAgICAndGFwX2hlbHBlcl9fcHJvbXB0JzogJ1RhcCBhbnkgcGFyYWdyYXBoIHRvIHJlc3BvbmQhJyxcbiAgICAndGFwX2hlbHBlcl9fY2xvc2UnOiAnQ2xvc2UnXG59OyIsIi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAnc3VtbWFyeV93aWRnZXRfX3JlYWN0aW9ucyc6ICdSZWFjY2lvbmVzJyxcbiAgICAnc3VtbWFyeV93aWRnZXRfX3JlYWN0aW9uc19vbmUnOiAnMSBSZWFjY2nDs24nLFxuICAgICdzdW1tYXJ5X3dpZGdldF9fcmVhY3Rpb25zX21hbnknOiAnezB9IFJlYWNjaW9uZXMnLFxuXG4gICAgJ3JlYWN0aW9uc193aWRnZXRfX3RpdGxlJzogJ1JlYWNjaW9uZXMnLFxuICAgICdyZWFjdGlvbnNfd2lkZ2V0X190aXRsZV90aGluayc6ICfCv1F1w6kgcGllbnNhcz8nLFxuICAgICdyZWFjdGlvbnNfd2lkZ2V0X190aXRsZV90aGFua3MnOiAnwqFHcmFjaWFzIHBvciB0dSByZWFjY2nDs24hJyxcbiAgICAncmVhY3Rpb25zX3dpZGdldF9fdGl0bGVfc2lnbmluJzogJ1NpZ24gaW4gUmVxdWlyZWQnLCAvLyBUT0RPOiBuZWVkIGEgdHJhbnNsYXRpb25cbiAgICAncmVhY3Rpb25zX3dpZGdldF9fdGl0bGVfYmxvY2tlZCc6ICdCbG9ja2VkIFJlYWN0aW9uJywgLy8gVE9ETzogbmVlZCBhIHRyYW5zbGF0aW9uXG4gICAgJ3JlYWN0aW9uc193aWRnZXRfX3RpdGxlX2Vycm9yJzogJ0Vycm9yJywgLy8gVE9ETzogbmVlZCBhIHRyYW5zbGF0aW9uXG4gICAgJ3JlYWN0aW9uc193aWRnZXRfX2JhY2snOiAnVm9sdmVyJyxcblxuICAgICdyZWFjdGlvbnNfcGFnZV9fbm9fcmVhY3Rpb25zJzogJ8KhTm8gcmVhY2Npb25lcyEnLCAvLyBUT0RPOiBuZWVkIGEgdHJhbnNsYXRpb24gb2YgXCJObyByZWFjdGlvbnMgeWV0IVwiXG4gICAgJ3JlYWN0aW9uc19wYWdlX190aGluayc6ICfCv1F1w6kgcGllbnNhcz8nLFxuXG4gICAgJ21lZGlhX2luZGljYXRvcl9fdGhpbmsnOiAnwr9RdcOpIHBpZW5zYXM/JyxcblxuICAgICdwb3B1cF93aWRnZXRfX3RoaW5rJzogJ8K/UXXDqSBwaWVuc2FzPycsXG5cbiAgICAnZGVmYXVsdHNfcGFnZV9fYWRkJzogJysgQcOxYWRlIGxvIHR1eW8nLFxuICAgICdkZWZhdWx0c19wYWdlX19vayc6ICdvaycsXG5cbiAgICAnY29uZmlybWF0aW9uX3BhZ2VfX3NoYXJlJzogJ0NvbXBhcnRlIHR1IHJlYWNjacOzbjonLFxuXG4gICAgJ2NvbW1lbnRzX3BhZ2VfX2hlYWRlcic6ICcoezB9KSBDb21lbnRhczonLFxuXG4gICAgJ2NvbW1lbnRfYXJlYV9fYWRkJzogJ0NvbWVudGEnLFxuICAgICdjb21tZW50X2FyZWFfX3BsYWNlaG9sZGVyJzogJ0HDsWFkZSBjb21lbnRhcmlvcyBvICNoYXNodGFncycsXG4gICAgJ2NvbW1lbnRfYXJlYV9fdGhhbmtzJzogJ0dyYWNpYXMgcG9yIHR1IHJlYWNjacOzbi4nLFxuICAgICdjb21tZW50X2FyZWFfX2NvdW50JzogJ1F1ZWRhbiA8c3BhbiBjbGFzcz1cImFudGVubmEtY29tbWVudC1jb3VudFwiPjwvc3Bhbj4gY2FyYWN0ZXJlcycsXG5cbiAgICAnbG9jYXRpb25zX3BhZ2VfX3BhZ2VsZXZlbCc6ICdBIGVzdGEgcMOhZ2luYScsIC8vIFRPRE86IG5lZWQgYSB0cmFuc2xhdGlvbiBvZiBcIlRvIHRoaXMgd2hvbGUgcGFnZVwiXG4gICAgJ2xvY2F0aW9uc19wYWdlX19jb3VudF9vbmUnOiAnPHNwYW4gY2xhc3M9XCJhbnRlbm5hLWxvY2F0aW9uLWNvdW50XCI+MTwvc3Bhbj48YnI+cmVhY2Npw7NuJyxcbiAgICAnbG9jYXRpb25zX3BhZ2VfX2NvdW50X21hbnknOiAnPHNwYW4gY2xhc3M9XCJhbnRlbm5hLWxvY2F0aW9uLWNvdW50XCI+ezB9PC9zcGFuPjxicj5yZWFjY2lvbmVzJyxcbiAgICAnbG9jYXRpb25zX3BhZ2VfX3ZpZGVvJzogJ1ZpZGVvJyxcblxuICAgICdjYWxsX3RvX2FjdGlvbl9sYWJlbF9fcmVzcG9uc2VzJzogJ1JlYWNjaW9uZXMnLFxuICAgICdjYWxsX3RvX2FjdGlvbl9sYWJlbF9fcmVzcG9uc2VzX29uZSc6ICcxIFJlYWNjacOzbicsXG4gICAgJ2NhbGxfdG9fYWN0aW9uX2xhYmVsX19yZXNwb25zZXNfbWFueSc6ICd7MH0gUmVhY2Npb25lcycsXG5cbiAgICAnYmxvY2tlZF9wYWdlX19tZXNzYWdlMSc6ICdUaGlzIHNpdGUgaGFzIGJsb2NrZWQgc29tZSBvciBhbGwgb2YgdGhlIHRleHQgaW4gdGhhdCByZWFjdGlvbi4nLCAvLyBUT0RPOiB0cmFuc2xhdGlvblxuICAgICdibG9ja2VkX3BhZ2VfX21lc3NhZ2UyJzogJ1BsZWFzZSB0cnkgc29tZXRoaW5nIHRoYXQgd2lsbCBiZSBtb3JlIGFwcHJvcHJpYXRlIGZvciB0aGlzIGNvbW11bml0eS4nLCAvLyBUT0RPOiB0cmFuc2xhdGlvblxuXG4gICAgJ3BlbmRpbmdfcGFnZV9fbWVzc2FnZV9hcHBlYXInOiAnWW91ciByZWFjdGlvbiB3aWxsIGFwcGVhciBvbmNlIGl0IGlzIHJldmlld2VkLiBBbGwgbmV3IHJlYWN0aW9ucyBtdXN0IG1lZXQgb3VyIGNvbW11bml0eSBndWlkZWxpbmVzLicsIC8vIFRPRE86IHRyYW5zbGF0aW9uXG5cbiAgICAnZXJyb3JfcGFnZV9fbWVzc2FnZSc6ICdPb3BzISBXZSByZWFsbHkgdmFsdWUgeW91ciBmZWVkYmFjaywgYnV0IHNvbWV0aGluZyB3ZW50IHdyb25nLicsIC8vIFRPRE86IHRyYW5zbGF0aW9uXG5cbiAgICAndGFwX2hlbHBlcl9fcHJvbXB0JzogJ8KhVG9jYSB1biBww6FycmFmbyBwYXJhIG9waW5hciEnLFxuICAgICd0YXBfaGVscGVyX19jbG9zZSc6ICdWb2x2ZXInXG59OyIsInZhciBHcm91cFNldHRpbmdzID0gcmVxdWlyZSgnLi4vZ3JvdXAtc2V0dGluZ3MnKTtcblxudmFyIEVuZ2xpc2hNZXNzYWdlcyA9IHJlcXVpcmUoJy4vbWVzc2FnZXMtZW4nKTtcbnZhciBTcGFuaXNoTWVzc2FnZXMgPSByZXF1aXJlKCcuL21lc3NhZ2VzLWVzJyk7XG52YWxpZGF0ZVRyYW5zbGF0aW9ucygpO1xuXG5mdW5jdGlvbiB2YWxpZGF0ZVRyYW5zbGF0aW9ucygpIHtcbiAgICBmb3IgKHZhciBlbmdsaXNoS2V5IGluIEVuZ2xpc2hNZXNzYWdlcykge1xuICAgICAgICBpZiAoRW5nbGlzaE1lc3NhZ2VzLmhhc093blByb3BlcnR5KGVuZ2xpc2hLZXkpKSB7XG4gICAgICAgICAgICBpZiAoIVNwYW5pc2hNZXNzYWdlcy5oYXNPd25Qcm9wZXJ0eShlbmdsaXNoS2V5KSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ0FudGVubmEgd2FybmluZzogU3BhbmlzaCB0cmFuc2xhdGlvbiBtaXNzaW5nIGZvciBrZXkgJyArIGVuZ2xpc2hLZXkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBnZXRNZXNzYWdlKGtleSwgdmFsdWVzKSB7XG4gICAgdmFyIHN0cmluZyA9IGdldExvY2FsaXplZFN0cmluZyhrZXksIEdyb3VwU2V0dGluZ3MuZ2V0KCkubGFuZ3VhZ2UoKSk7XG4gICAgaWYgKHZhbHVlcykge1xuICAgICAgICByZXR1cm4gZm9ybWF0KHN0cmluZywgdmFsdWVzKTtcbiAgICB9XG4gICAgcmV0dXJuIHN0cmluZztcbn1cblxuZnVuY3Rpb24gZ2V0TG9jYWxpemVkU3RyaW5nKGtleSwgbGFuZykge1xuICAgIHZhciBzdHJpbmc7XG4gICAgc3dpdGNoKGxhbmcpIHtcbiAgICAgICAgY2FzZSAnZW4nOlxuICAgICAgICAgICAgc3RyaW5nID0gRW5nbGlzaE1lc3NhZ2VzW2tleV07XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnZXMnOlxuICAgICAgICAgICAgc3RyaW5nID0gU3BhbmlzaE1lc3NhZ2VzW2tleV07XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIC8vIFRPRE86IHJldmlld1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ0ludmFsaWQgbGFuZ3VhZ2Ugc3BlY2lmaWVkIGluIEFudGVubmEgZ3JvdXAgc2V0dGluZ3MuJyk7XG4gICAgICAgICAgICBicmVhaztcbiAgICB9XG4gICAgaWYgKCFzdHJpbmcpIHsgLy8gRGVmYXVsdCB0byBFbmdsaXNoXG4gICAgICAgIHN0cmluZyA9IEVuZ2xpc2hNZXNzYWdlc1trZXldO1xuICAgIH1cbiAgICAvLyBUT0RPOiBoYW5kbGUgbWlzc2luZyBrZXlcbiAgICByZXR1cm4gc3RyaW5nO1xufVxuXG5mdW5jdGlvbiBmb3JtYXQoc3RyaW5nLCB2YWx1ZXMpIHtcbiAgICAvLyBQb3B1bGFyLCBzaW1wbGUgYWxnb3JpdGhtIGZyb20gaHR0cDovL2phdmFzY3JpcHQuY3JvY2tmb3JkLmNvbS9yZW1lZGlhbC5odG1sXG4gICAgcmV0dXJuIHN0cmluZy5yZXBsYWNlKFxuICAgICAgICAvXFx7KFtee31dKilcXH0vZyxcbiAgICAgICAgZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgICAgIHZhciByID0gdmFsdWVzW2JdO1xuICAgICAgICAgICAgcmV0dXJuIHR5cGVvZiByID09PSAnc3RyaW5nJyB8fCB0eXBlb2YgciA9PT0gJ251bWJlcicgPyByIDogYTtcbiAgICAgICAgfVxuICAgICk7XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBnZXRNZXNzYWdlOiBnZXRNZXNzYWdlXG59OyIsInZhciAkOyByZXF1aXJlKCcuL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xuXG5mdW5jdGlvbiBtYWtlTW92ZWFibGUoJGVsZW1lbnQsICRkcmFnSGFuZGxlKSB7XG4gICAgJGRyYWdIYW5kbGUub24oJ21vdXNlZG93bi5hbnRlbm5hJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdmFyIG9mZnNldFggPSBldmVudC5wYWdlWCAtICRkcmFnSGFuZGxlLm9mZnNldCgpLmxlZnQ7XG4gICAgICAgIHZhciBvZmZzZXRZID0gZXZlbnQucGFnZVkgLSAkZHJhZ0hhbmRsZS5vZmZzZXQoKS50b3A7XG4gICAgICAgICQoZG9jdW1lbnQpLm9uKCdtb3VzZXVwLmFudGVubmEnLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgJChkb2N1bWVudCkub2ZmKCdtb3VzZW1vdmUuYW50ZW5uYScpO1xuICAgICAgICB9KTtcbiAgICAgICAgJChkb2N1bWVudCkub24oJ21vdXNlbW92ZS5hbnRlbm5hJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgICRlbGVtZW50LmNzcyh7XG4gICAgICAgICAgICAgICAgdG9wOiBldmVudC5wYWdlWSAtIG9mZnNldFksXG4gICAgICAgICAgICAgICAgbGVmdDogZXZlbnQucGFnZVggLSBvZmZzZXRYXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIG1ha2VNb3ZlYWJsZTogbWFrZU1vdmVhYmxlXG59OyIsInZhciAkOyByZXF1aXJlKCcuL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIENhbGxiYWNrU3VwcG9ydCA9IHJlcXVpcmUoJy4vY2FsbGJhY2stc3VwcG9ydCcpO1xudmFyIFJhbmdlID0gcmVxdWlyZSgnLi9yYW5nZScpO1xudmFyIFdpZGdldEJ1Y2tldCA9IHJlcXVpcmUoJy4vd2lkZ2V0LWJ1Y2tldCcpO1xuXG4vLyBUT0RPOiBkZXRlY3Qgd2hldGhlciB0aGUgYnJvd3NlciBzdXBwb3J0cyBNdXRhdGlvbk9ic2VydmVyIGFuZCBmYWxsYmFjayB0byBNdXRhdGlvbnMgRXZlbnRzXG5cbnZhciBhZGRpdGlvbkxpc3RlbmVyO1xudmFyIHJlbW92YWxMaXN0ZW5lcjtcblxudmFyIGF0dHJpYnV0ZU9ic2VydmVycyA9IFtdO1xuXG5mdW5jdGlvbiBhZGRBZGRpdGlvbkxpc3RlbmVyKGNhbGxiYWNrKSB7XG4gICAgaWYgKCFhZGRpdGlvbkxpc3RlbmVyKSB7XG4gICAgICAgIGFkZGl0aW9uTGlzdGVuZXIgPSBjcmVhdGVBZGRpdGlvbkxpc3RlbmVyKCk7XG4gICAgfVxuICAgIGFkZGl0aW9uTGlzdGVuZXIuYWRkQ2FsbGJhY2soY2FsbGJhY2spO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVBZGRpdGlvbkxpc3RlbmVyKCkge1xuICAgIHZhciBjYWxsYmFja1N1cHBvcnQgPSBDYWxsYmFja1N1cHBvcnQuY3JlYXRlKCk7XG4gICAgdmFyIG9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoZnVuY3Rpb24obXV0YXRpb25SZWNvcmRzKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbXV0YXRpb25SZWNvcmRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgYWRkZWRFbGVtZW50cyA9IGZpbHRlcmVkRWxlbWVudHMobXV0YXRpb25SZWNvcmRzW2ldLmFkZGVkTm9kZXMpO1xuICAgICAgICAgICAgaWYgKGFkZGVkRWxlbWVudHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHZhciBjYWxsYmFja3MgPSBjYWxsYmFja1N1cHBvcnQuZ2V0KCk7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBjYWxsYmFja3MubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2tzW2pdKGFkZGVkRWxlbWVudHMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHZhciBib2R5ID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2JvZHknKVswXTtcbiAgICBvYnNlcnZlci5vYnNlcnZlKGJvZHksIHtcbiAgICAgICAgY2hpbGRMaXN0OiB0cnVlLFxuICAgICAgICBhdHRyaWJ1dGVzOiBmYWxzZSxcbiAgICAgICAgY2hhcmFjdGVyRGF0YTogZmFsc2UsXG4gICAgICAgIHN1YnRyZWU6IHRydWUsXG4gICAgICAgIGF0dHJpYnV0ZU9sZFZhbHVlOiBmYWxzZSxcbiAgICAgICAgY2hhcmFjdGVyRGF0YU9sZFZhbHVlOiBmYWxzZVxuICAgIH0pO1xuICAgIHJldHVybiB7XG4gICAgICAgIHRlYXJkb3duOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrU3VwcG9ydC50ZWFyZG93bigpO1xuICAgICAgICAgICAgb2JzZXJ2ZXIuZGlzY29ubmVjdCgpO1xuICAgICAgICB9LFxuICAgICAgICBhZGRDYWxsYmFjazogZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGNhbGxiYWNrU3VwcG9ydC5hZGQoY2FsbGJhY2spO1xuICAgICAgICB9LFxuICAgICAgICByZW1vdmVDYWxsYmFjazogZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGNhbGxiYWNrU3VwcG9ydC5yZW1vdmUoY2FsbGJhY2spO1xuICAgICAgICB9XG4gICAgfTtcbn1cblxuZnVuY3Rpb24gYWRkUmVtb3ZhbExpc3RlbmVyKGNhbGxiYWNrKSB7XG4gICAgaWYgKCFyZW1vdmFsTGlzdGVuZXIpIHtcbiAgICAgICAgcmVtb3ZhbExpc3RlbmVyID0gY3JlYXRlUmVtb3ZhbExpc3RlbmVyKCk7XG4gICAgfVxuICAgIHJlbW92YWxMaXN0ZW5lci5hZGRDYWxsYmFjayhjYWxsYmFjayk7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVJlbW92YWxMaXN0ZW5lcigpIHtcbiAgICB2YXIgY2FsbGJhY2tTdXBwb3J0ID0gQ2FsbGJhY2tTdXBwb3J0LmNyZWF0ZSgpO1xuICAgIHZhciBvYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKGZ1bmN0aW9uKG11dGF0aW9uUmVjb3Jkcykge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG11dGF0aW9uUmVjb3Jkcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIHJlbW92ZWRFbGVtZW50cyA9IGZpbHRlcmVkRWxlbWVudHMobXV0YXRpb25SZWNvcmRzW2ldLnJlbW92ZWROb2Rlcyk7XG4gICAgICAgICAgICBpZiAocmVtb3ZlZEVsZW1lbnRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICB2YXIgY2FsbGJhY2tzID0gY2FsbGJhY2tTdXBwb3J0LmdldCgpO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgY2FsbGJhY2tzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrc1tqXShyZW1vdmVkRWxlbWVudHMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHZhciBib2R5ID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2JvZHknKVswXTtcbiAgICBvYnNlcnZlci5vYnNlcnZlKGJvZHksIHtcbiAgICAgICAgY2hpbGRMaXN0OiB0cnVlLFxuICAgICAgICBhdHRyaWJ1dGVzOiBmYWxzZSxcbiAgICAgICAgY2hhcmFjdGVyRGF0YTogZmFsc2UsXG4gICAgICAgIHN1YnRyZWU6IHRydWUsXG4gICAgICAgIGF0dHJpYnV0ZU9sZFZhbHVlOiBmYWxzZSxcbiAgICAgICAgY2hhcmFjdGVyRGF0YU9sZFZhbHVlOiBmYWxzZVxuICAgIH0pO1xuICAgIHJldHVybiB7XG4gICAgICAgIHRlYXJkb3duOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrU3VwcG9ydC50ZWFyZG93bigpO1xuICAgICAgICAgICAgb2JzZXJ2ZXIuZGlzY29ubmVjdCgpO1xuICAgICAgICB9LFxuICAgICAgICBhZGRDYWxsYmFjazogZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGNhbGxiYWNrU3VwcG9ydC5hZGQoY2FsbGJhY2spO1xuICAgICAgICB9LFxuICAgICAgICByZW1vdmVDYWxsYmFjazogZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGNhbGxiYWNrU3VwcG9ydC5yZW1vdmUoY2FsbGJhY2spO1xuICAgICAgICB9XG4gICAgfTtcbn1cblxuLy8gRmlsdGVyIHRoZSBzZXQgb2Ygbm9kZXMgdG8gZWxpbWluYXRlIGFueXRoaW5nIGluc2lkZSBvdXIgb3duIERPTSBlbGVtZW50cyAob3RoZXJ3aXNlLCB3ZSBnZW5lcmF0ZSBhIHRvbiBvZiBjaGF0dGVyKVxuZnVuY3Rpb24gZmlsdGVyZWRFbGVtZW50cyhub2RlTGlzdCkge1xuICAgIHZhciBmaWx0ZXJlZCA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbm9kZUxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIG5vZGUgPSBub2RlTGlzdFtpXTtcbiAgICAgICAgaWYgKG5vZGUubm9kZVR5cGUgPT09IDEpIHsgLy8gT25seSBlbGVtZW50IG5vZGVzLiAoaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL05vZGUvbm9kZVR5cGUpXG4gICAgICAgICAgICB2YXIgJGVsZW1lbnQgPSAkKG5vZGUpO1xuICAgICAgICAgICAgaWYgKCRlbGVtZW50LmNsb3Nlc3QoUmFuZ2UuSElHSExJR0hUX1NFTEVDVE9SICsgJywgLmFudGVubmEsICcgKyBXaWRnZXRCdWNrZXQuc2VsZWN0b3IoKSkubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgZmlsdGVyZWQucHVzaCgkZWxlbWVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZpbHRlcmVkO1xufVxuXG5mdW5jdGlvbiBhZGRPbmVUaW1lQXR0cmlidXRlTGlzdGVuZXIobm9kZSwgYXR0cmlidXRlcywgY2FsbGJhY2spIHtcbiAgICB2YXIgb2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcihmdW5jdGlvbihtdXRhdGlvblJlY29yZHMpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtdXRhdGlvblJlY29yZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciB0YXJnZXQgPSBtdXRhdGlvblJlY29yZHNbaV0udGFyZ2V0O1xuICAgICAgICAgICAgY2FsbGJhY2sodGFyZ2V0KTtcbiAgICAgICAgICAgIG9ic2VydmVyLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIG9ic2VydmVyLm9ic2VydmUobm9kZSwge1xuICAgICAgICBjaGlsZExpc3Q6IGZhbHNlLFxuICAgICAgICBhdHRyaWJ1dGVzOiB0cnVlLFxuICAgICAgICBjaGFyYWN0ZXJEYXRhOiBmYWxzZSxcbiAgICAgICAgc3VidHJlZTogZmFsc2UsXG4gICAgICAgIGF0dHJpYnV0ZU9sZFZhbHVlOiBmYWxzZSxcbiAgICAgICAgY2hhcmFjdGVyRGF0YU9sZFZhbHVlOiBmYWxzZSxcbiAgICAgICAgYXR0cmlidXRlRmlsdGVyOiBhdHRyaWJ1dGVzXG4gICAgfSk7XG4gICAgYXR0cmlidXRlT2JzZXJ2ZXJzLnB1c2gob2JzZXJ2ZXIpO1xufVxuXG5mdW5jdGlvbiB0ZWFyZG93bigpIHtcbiAgICBpZiAoYWRkaXRpb25MaXN0ZW5lcikge1xuICAgICAgICBhZGRpdGlvbkxpc3RlbmVyLnRlYXJkb3duKCk7XG4gICAgICAgIGFkZGl0aW9uTGlzdGVuZXIgPSB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgaWYgKHJlbW92YWxMaXN0ZW5lcikge1xuICAgICAgICByZW1vdmFsTGlzdGVuZXIudGVhcmRvd24oKTtcbiAgICAgICAgcmVtb3ZhbExpc3RlbmVyID0gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXR0cmlidXRlT2JzZXJ2ZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGF0dHJpYnV0ZU9ic2VydmVyc1tpXS5kaXNjb25uZWN0KCk7XG4gICAgfVxuICAgIGF0dHJpYnV0ZU9ic2VydmVycyA9IFtdO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgYWRkQWRkaXRpb25MaXN0ZW5lcjogYWRkQWRkaXRpb25MaXN0ZW5lcixcbiAgICBhZGRSZW1vdmFsTGlzdGVuZXI6IGFkZFJlbW92YWxMaXN0ZW5lcixcbiAgICBhZGRPbmVUaW1lQXR0cmlidXRlTGlzdGVuZXI6IGFkZE9uZVRpbWVBdHRyaWJ1dGVMaXN0ZW5lcixcbiAgICB0ZWFyZG93bjogdGVhcmRvd25cbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG5cbmZ1bmN0aW9uIGNvbXB1dGVUb3BMZXZlbFBhZ2VUaXRsZSgpIHtcbiAgICAvLyBUT0RPOiBUaGlzIHNob3VsZCBiZSBhIGNvbmZpZ3VyYWJsZSBncm91cCBzZXR0aW5nIGxpa2UgdGhlIG90aGVyIHBhZ2UgcHJvcGVydGllcy5cbiAgICByZXR1cm4gZ2V0QXR0cmlidXRlVmFsdWUoJ21ldGFbcHJvcGVydHk9XCJvZzp0aXRsZVwiXScsICdjb250ZW50JykgfHwgJCgndGl0bGUnKS50ZXh0KCkudHJpbSgpO1xufVxuXG5mdW5jdGlvbiBjb21wdXRlUGFnZVRpdGxlKCRwYWdlLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIHBhZ2VUaXRsZSA9ICRwYWdlLmZpbmQoZ3JvdXBTZXR0aW5ncy5wYWdlTGlua1NlbGVjdG9yKCkpLnRleHQoKS50cmltKCk7XG4gICAgaWYgKHBhZ2VUaXRsZSA9PT0gJycpIHtcbiAgICAgICAgcGFnZVRpdGxlID0gY29tcHV0ZVRvcExldmVsUGFnZVRpdGxlKCk7XG4gICAgfVxuICAgIHJldHVybiBwYWdlVGl0bGU7XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVUb3BMZXZlbFBhZ2VJbWFnZShncm91cFNldHRpbmdzKSB7XG4gICAgcmV0dXJuIGdldEF0dHJpYnV0ZVZhbHVlKGdyb3VwU2V0dGluZ3MucGFnZUltYWdlU2VsZWN0b3IoKSwgZ3JvdXBTZXR0aW5ncy5wYWdlSW1hZ2VBdHRyaWJ1dGUoKSk7XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVQYWdlQXV0aG9yKGdyb3VwU2V0dGluZ3MpIHtcbiAgICByZXR1cm4gZ2V0QXR0cmlidXRlVmFsdWUoZ3JvdXBTZXR0aW5ncy5wYWdlQXV0aG9yU2VsZWN0b3IoKSwgZ3JvdXBTZXR0aW5ncy5wYWdlQXV0aG9yQXR0cmlidXRlKCkpO1xufVxuXG5mdW5jdGlvbiBjb21wdXRlUGFnZVRvcGljcyhncm91cFNldHRpbmdzKSB7XG4gICAgcmV0dXJuIGdldEF0dHJpYnV0ZVZhbHVlKGdyb3VwU2V0dGluZ3MucGFnZVRvcGljc1NlbGVjdG9yKCksIGdyb3VwU2V0dGluZ3MucGFnZVRvcGljc0F0dHJpYnV0ZSgpKTtcbn1cblxuZnVuY3Rpb24gY29tcHV0ZVBhZ2VTaXRlU2VjdGlvbihncm91cFNldHRpbmdzKSB7XG4gICAgcmV0dXJuIGdldEF0dHJpYnV0ZVZhbHVlKGdyb3VwU2V0dGluZ3MucGFnZVNpdGVTZWN0aW9uU2VsZWN0b3IoKSwgZ3JvdXBTZXR0aW5ncy5wYWdlU2l0ZVNlY3Rpb25BdHRyaWJ1dGUoKSk7XG59XG5cbmZ1bmN0aW9uIGdldEF0dHJpYnV0ZVZhbHVlKGVsZW1lbnRTZWxlY3RvciwgYXR0cmlidXRlU2VsZWN0b3IpIHtcbiAgICB2YXIgdmFsdWUgPSAnJztcbiAgICBpZiAoZWxlbWVudFNlbGVjdG9yICYmIGF0dHJpYnV0ZVNlbGVjdG9yKSB7XG4gICAgICAgIHZhbHVlID0gJChlbGVtZW50U2VsZWN0b3IpLmF0dHIoYXR0cmlidXRlU2VsZWN0b3IpIHx8ICcnO1xuICAgIH1cbiAgICByZXR1cm4gdmFsdWUudHJpbSgpO1xufVxuXG5mdW5jdGlvbiBjb21wdXRlVG9wTGV2ZWxDYW5vbmljYWxVcmwoZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBjYW5vbmljYWxVcmwgPSB3aW5kb3cubG9jYXRpb24uaHJlZi5zcGxpdCgnIycpWzBdLnRvTG93ZXJDYXNlKCk7XG4gICAgdmFyICRjYW5vbmljYWxMaW5rID0gJCgnbGlua1tyZWw9XCJjYW5vbmljYWxcIl0nKTtcbiAgICBpZiAoJGNhbm9uaWNhbExpbmsubGVuZ3RoID4gMCkge1xuICAgICAgICB2YXIgb3ZlcnJpZGVVcmwgPSAkY2Fub25pY2FsTGluay5hdHRyKCdocmVmJykudHJpbSgpLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIHZhciBkb21haW4gPSAod2luZG93LmxvY2F0aW9uLnByb3RvY29sKycvLycrd2luZG93LmxvY2F0aW9uLmhvc3RuYW1lKycvJykudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgaWYgKG92ZXJyaWRlVXJsICE9PSBkb21haW4pIHsgLy8gZmFzdGNvIGZpeCAoc2luY2UgdGhleSBzb21ldGltZXMgcmV3cml0ZSB0aGVpciBjYW5vbmljYWwgdG8gc2ltcGx5IGJlIHRoZWlyIGRvbWFpbi4pXG4gICAgICAgICAgICBjYW5vbmljYWxVcmwgPSBvdmVycmlkZVVybDtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVtb3ZlU3ViZG9tYWluRnJvbVBhZ2VVcmwoY2Fub25pY2FsVXJsLCBncm91cFNldHRpbmdzKTtcbn1cblxuZnVuY3Rpb24gY29tcHV0ZVBhZ2VFbGVtZW50VXJsKCRwYWdlRWxlbWVudCwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciB1cmwgPSAkcGFnZUVsZW1lbnQuZmluZChncm91cFNldHRpbmdzLnBhZ2VMaW5rU2VsZWN0b3IoKSkuYXR0cignaHJlZicpO1xuICAgIGlmICh1cmwpIHtcbiAgICAgICAgdXJsID0gcmVtb3ZlU3ViZG9tYWluRnJvbVBhZ2VVcmwodXJsLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgdmFyIG9yaWdpbiA9IHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4gfHwgd2luZG93LmxvY2F0aW9uLnByb3RvY29sICsgXCIvL1wiICsgd2luZG93LmxvY2F0aW9uLmhvc3RuYW1lICsgKHdpbmRvdy5sb2NhdGlvbi5wb3J0ID8gJzonICsgd2luZG93LmxvY2F0aW9uLnBvcnQ6ICcnKTtcbiAgICAgICAgaWYgKHVybC5pbmRleE9mKG9yaWdpbikgIT09IDAgJiYgLy8gTm90IGFuIGFic29sdXRlIFVSTFxuICAgICAgICAgICAgICAgICF1cmwuc3Vic3RyKDAsMikgIT09ICcvLycgJiYgLy8gTm90IHByb3RvY29sIHJlbGF0aXZlXG4gICAgICAgICAgICAgICAgIWdyb3VwU2V0dGluZ3MudXJsLmlnbm9yZVN1YmRvbWFpbigpKSB7IC8vIEFuZCB3ZSB3ZXJlbid0IG5vdCBpZ25vcmluZyB0aGUgc3ViZG9tYWluXG4gICAgICAgICAgICBpZiAodXJsLnN1YnN0cigwLDEpID09ICcvJykge1xuICAgICAgICAgICAgICAgIHVybCA9IG9yaWdpbiArIHVybDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdXJsID0gb3JpZ2luICsgd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lICsgdXJsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB1cmw7XG4gICAgfVxuICAgIHJldHVybiBjb21wdXRlVG9wTGV2ZWxDYW5vbmljYWxVcmwoZ3JvdXBTZXR0aW5ncyk7XG59XG5cbi8vIFRPRE8gY29waWVkIGZyb20gZW5nYWdlX2Z1bGwuIFJldmlldy5cbmZ1bmN0aW9uIHJlbW92ZVN1YmRvbWFpbkZyb21QYWdlVXJsKHVybCwgZ3JvdXBTZXR0aW5ncykge1xuICAgIC8vIEFOVC5hY3Rpb25zLnJlbW92ZVN1YmRvbWFpbkZyb21QYWdlVXJsOlxuICAgIC8vIGlmIFwiaWdub3JlX3N1YmRvbWFpblwiIGlzIGNoZWNrZWQgaW4gc2V0dGluZ3MsIEFORCB0aGV5IHN1cHBseSBhIFRMRCxcbiAgICAvLyB0aGVuIG1vZGlmeSB0aGUgcGFnZSBhbmQgY2Fub25pY2FsIFVSTHMgaGVyZS5cbiAgICAvLyBoYXZlIHRvIGhhdmUgdGhlbSBzdXBwbHkgb25lIGJlY2F1c2UgdGhlcmUgYXJlIHRvbyBtYW55IHZhcmlhdGlvbnMgdG8gcmVsaWFibHkgc3RyaXAgc3ViZG9tYWlucyAgKC5jb20sIC5pcywgLmNvbS5hciwgLmNvLnVrLCBldGMpXG4gICAgaWYgKGdyb3VwU2V0dGluZ3MudXJsLmlnbm9yZVN1YmRvbWFpbigpID09IHRydWUgJiYgZ3JvdXBTZXR0aW5ncy51cmwuY2Fub25pY2FsRG9tYWluKCkpIHtcbiAgICAgICAgdmFyIEhPU1RET01BSU4gPSAvWy1cXHddK1xcLig/OlstXFx3XStcXC54bi0tWy1cXHddK3xbLVxcd117Mix9fFstXFx3XStcXC5bLVxcd117Mn0pJC9pO1xuICAgICAgICB2YXIgc3JjQXJyYXkgPSB1cmwuc3BsaXQoJy8nKTtcblxuICAgICAgICB2YXIgcHJvdG9jb2wgPSBzcmNBcnJheVswXTtcbiAgICAgICAgc3JjQXJyYXkuc3BsaWNlKDAsMyk7XG5cbiAgICAgICAgdmFyIHJldHVyblVybCA9IHByb3RvY29sICsgJy8vJyArIGdyb3VwU2V0dGluZ3MudXJsLmNhbm9uaWNhbERvbWFpbigpICsgJy8nICsgc3JjQXJyYXkuam9pbignLycpO1xuXG4gICAgICAgIHJldHVybiByZXR1cm5Vcmw7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHVybDtcbiAgICB9XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjb21wdXRlUGFnZVVybDogY29tcHV0ZVBhZ2VFbGVtZW50VXJsLFxuICAgIGNvbXB1dGVQYWdlVGl0bGU6IGNvbXB1dGVQYWdlVGl0bGUsXG4gICAgY29tcHV0ZVRvcExldmVsUGFnZUltYWdlOiBjb21wdXRlVG9wTGV2ZWxQYWdlSW1hZ2UsXG4gICAgY29tcHV0ZVBhZ2VBdXRob3I6IGNvbXB1dGVQYWdlQXV0aG9yLFxuICAgIGNvbXB1dGVQYWdlVG9waWNzOiBjb21wdXRlUGFnZVRvcGljcyxcbiAgICBjb21wdXRlUGFnZVNpdGVTZWN0aW9uOiBjb21wdXRlUGFnZVNpdGVTZWN0aW9uXG59OyIsIi8vIEFudGVubmEgY2hhbmdlcyBmcm9tIG9yaWdpbmFsIHNvdXJjZSBtYXJrZWQgd2l0aCBPUklHSU5BTFxuLy8gU2VlIHRoZSBpc3N1ZSB3ZSBuZWVkZWQgdG8gd29yayBhcm91bmQgaGVyZTogaHR0cHM6Ly9naXRodWIuY29tL3JhY3RpdmVqcy9yYWN0aXZlLWV2ZW50cy10YXAvaXNzdWVzLzhcblxuLy8gVGFwL2Zhc3RjbGljayBldmVudCBwbHVnaW4gZm9yIFJhY3RpdmUuanMgLSBlbGltaW5hdGVzIHRoZSAzMDBtcyBkZWxheSBvbiB0b3VjaC1lbmFibGVkIGRldmljZXMsIGFuZCBub3JtYWxpc2VzXG4vLyBhY3Jvc3MgbW91c2UsIHRvdWNoIGFuZCBwb2ludGVyIGV2ZW50cy5cbi8vIEF1dGhvcjogUmljaCBIYXJyaXNcbi8vIExpY2Vuc2U6IE1JVFxuLy8gU291cmNlOiBodHRwczovL2dpdGh1Yi5jb20vcmFjdGl2ZWpzL3JhY3RpdmUtZXZlbnRzLXRhcFxuKGZ1bmN0aW9uIChnbG9iYWwsIGZhY3RvcnkpIHtcblx0bW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7XG59KHRoaXMsIGZ1bmN0aW9uICgpIHsgJ3VzZSBzdHJpY3QnO1xuXG5cdHZhciBESVNUQU5DRV9USFJFU0hPTEQgPSA1OyAvLyBtYXhpbXVtIHBpeGVscyBwb2ludGVyIGNhbiBtb3ZlIGJlZm9yZSBjYW5jZWxcblx0dmFyIFRJTUVfVEhSRVNIT0xEID0gNDAwOyAvLyBtYXhpbXVtIG1pbGxpc2Vjb25kcyBiZXR3ZWVuIGRvd24gYW5kIHVwIGJlZm9yZSBjYW5jZWxcblxuXHRmdW5jdGlvbiB0YXAobm9kZSwgY2FsbGJhY2spIHtcblx0XHRyZXR1cm4gbmV3IFRhcEhhbmRsZXIobm9kZSwgY2FsbGJhY2spO1xuXHR9XG5cblx0ZnVuY3Rpb24gVGFwSGFuZGxlcihub2RlLCBjYWxsYmFjaykge1xuXHRcdHRoaXMubm9kZSA9IG5vZGU7XG5cdFx0dGhpcy5jYWxsYmFjayA9IGNhbGxiYWNrO1xuXG5cdFx0dGhpcy5wcmV2ZW50TW91c2Vkb3duRXZlbnRzID0gZmFsc2U7XG5cblx0XHR0aGlzLmJpbmQobm9kZSk7XG5cdH1cblxuXHRUYXBIYW5kbGVyLnByb3RvdHlwZSA9IHtcblx0XHRiaW5kOiBmdW5jdGlvbiBiaW5kKG5vZGUpIHtcblx0XHRcdC8vIGxpc3RlbiBmb3IgbW91c2UvcG9pbnRlciBldmVudHMuLi5cblx0XHRcdC8vIE9SSUdJTkFMIGlmICh3aW5kb3cubmF2aWdhdG9yLnBvaW50ZXJFbmFibGVkKSB7XG5cdFx0XHRpZiAod2luZG93Lm5hdmlnYXRvci5wb2ludGVyRW5hYmxlZCAmJiAhKCdvbnRvdWNoc3RhcnQnIGluIHdpbmRvdykpIHtcblx0XHRcdFx0bm9kZS5hZGRFdmVudExpc3RlbmVyKCdwb2ludGVyZG93bicsIGhhbmRsZU1vdXNlZG93biwgZmFsc2UpO1xuXHRcdFx0Ly8gT1JJR0lOQUwgfSBlbHNlIGlmICh3aW5kb3cubmF2aWdhdG9yLm1zUG9pbnRlckVuYWJsZWQpIHtcblx0XHRcdH0gZWxzZSBpZiAod2luZG93Lm5hdmlnYXRvci5tc1BvaW50ZXJFbmFibGVkICYmICEoJ29udG91Y2hzdGFydCcgaW4gd2luZG93KSkge1xuXHRcdFx0XHRub2RlLmFkZEV2ZW50TGlzdGVuZXIoJ01TUG9pbnRlckRvd24nLCBoYW5kbGVNb3VzZWRvd24sIGZhbHNlKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdG5vZGUuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgaGFuZGxlTW91c2Vkb3duLCBmYWxzZSk7XG5cdFx0XHR9XG5cblx0XHRcdC8vIC4uLmFuZCB0b3VjaCBldmVudHNcblx0XHRcdG5vZGUuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIGhhbmRsZVRvdWNoc3RhcnQsIGZhbHNlKTtcblxuXHRcdFx0Ly8gbmF0aXZlIGJ1dHRvbnMsIGFuZCA8aW5wdXQgdHlwZT0nYnV0dG9uJz4gZWxlbWVudHMsIHNob3VsZCBmaXJlIGEgdGFwIGV2ZW50XG5cdFx0XHQvLyB3aGVuIHRoZSBzcGFjZSBrZXkgaXMgcHJlc3NlZFxuXHRcdFx0aWYgKG5vZGUudGFnTmFtZSA9PT0gJ0JVVFRPTicgfHwgbm9kZS50eXBlID09PSAnYnV0dG9uJykge1xuXHRcdFx0XHRub2RlLmFkZEV2ZW50TGlzdGVuZXIoJ2ZvY3VzJywgaGFuZGxlRm9jdXMsIGZhbHNlKTtcblx0XHRcdH1cblxuXHRcdFx0bm9kZS5fX3RhcF9oYW5kbGVyX18gPSB0aGlzO1xuXHRcdH0sXG5cdFx0ZmlyZTogZnVuY3Rpb24gZmlyZShldmVudCwgeCwgeSkge1xuXHRcdFx0dGhpcy5jYWxsYmFjayh7XG5cdFx0XHRcdG5vZGU6IHRoaXMubm9kZSxcblx0XHRcdFx0b3JpZ2luYWw6IGV2ZW50LFxuXHRcdFx0XHR4OiB4LFxuXHRcdFx0XHR5OiB5XG5cdFx0XHR9KTtcblx0XHR9LFxuXHRcdG1vdXNlZG93bjogZnVuY3Rpb24gbW91c2Vkb3duKGV2ZW50KSB7XG5cdFx0XHR2YXIgX3RoaXMgPSB0aGlzO1xuXG5cdFx0XHRpZiAodGhpcy5wcmV2ZW50TW91c2Vkb3duRXZlbnRzKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGV2ZW50LndoaWNoICE9PSB1bmRlZmluZWQgJiYgZXZlbnQud2hpY2ggIT09IDEpIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHR2YXIgeCA9IGV2ZW50LmNsaWVudFg7XG5cdFx0XHR2YXIgeSA9IGV2ZW50LmNsaWVudFk7XG5cblx0XHRcdC8vIFRoaXMgd2lsbCBiZSBudWxsIGZvciBtb3VzZSBldmVudHMuXG5cdFx0XHR2YXIgcG9pbnRlcklkID0gZXZlbnQucG9pbnRlcklkO1xuXG5cdFx0XHR2YXIgaGFuZGxlTW91c2V1cCA9IGZ1bmN0aW9uIGhhbmRsZU1vdXNldXAoZXZlbnQpIHtcblx0XHRcdFx0aWYgKGV2ZW50LnBvaW50ZXJJZCAhPSBwb2ludGVySWQpIHtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRfdGhpcy5maXJlKGV2ZW50LCB4LCB5KTtcblx0XHRcdFx0Y2FuY2VsKCk7XG5cdFx0XHR9O1xuXG5cdFx0XHR2YXIgaGFuZGxlTW91c2Vtb3ZlID0gZnVuY3Rpb24gaGFuZGxlTW91c2Vtb3ZlKGV2ZW50KSB7XG5cdFx0XHRcdGlmIChldmVudC5wb2ludGVySWQgIT0gcG9pbnRlcklkKSB7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKE1hdGguYWJzKGV2ZW50LmNsaWVudFggLSB4KSA+PSBESVNUQU5DRV9USFJFU0hPTEQgfHwgTWF0aC5hYnMoZXZlbnQuY2xpZW50WSAtIHkpID49IERJU1RBTkNFX1RIUkVTSE9MRCkge1xuXHRcdFx0XHRcdGNhbmNlbCgpO1xuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXG5cdFx0XHR2YXIgY2FuY2VsID0gZnVuY3Rpb24gY2FuY2VsKCkge1xuXHRcdFx0XHRfdGhpcy5ub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ01TUG9pbnRlclVwJywgaGFuZGxlTW91c2V1cCwgZmFsc2UpO1xuXHRcdFx0XHRkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdNU1BvaW50ZXJNb3ZlJywgaGFuZGxlTW91c2Vtb3ZlLCBmYWxzZSk7XG5cdFx0XHRcdGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ01TUG9pbnRlckNhbmNlbCcsIGNhbmNlbCwgZmFsc2UpO1xuXHRcdFx0XHRfdGhpcy5ub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJ1cCcsIGhhbmRsZU1vdXNldXAsIGZhbHNlKTtcblx0XHRcdFx0ZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigncG9pbnRlcm1vdmUnLCBoYW5kbGVNb3VzZW1vdmUsIGZhbHNlKTtcblx0XHRcdFx0ZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigncG9pbnRlcmNhbmNlbCcsIGNhbmNlbCwgZmFsc2UpO1xuXHRcdFx0XHRfdGhpcy5ub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlTW91c2V1cCwgZmFsc2UpO1xuXHRcdFx0XHRkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBoYW5kbGVNb3VzZW1vdmUsIGZhbHNlKTtcblx0XHRcdH07XG5cblx0XHRcdGlmICh3aW5kb3cubmF2aWdhdG9yLnBvaW50ZXJFbmFibGVkKSB7XG5cdFx0XHRcdHRoaXMubm9kZS5hZGRFdmVudExpc3RlbmVyKCdwb2ludGVydXAnLCBoYW5kbGVNb3VzZXVwLCBmYWxzZSk7XG5cdFx0XHRcdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJtb3ZlJywgaGFuZGxlTW91c2Vtb3ZlLCBmYWxzZSk7XG5cdFx0XHRcdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJjYW5jZWwnLCBjYW5jZWwsIGZhbHNlKTtcblx0XHRcdH0gZWxzZSBpZiAod2luZG93Lm5hdmlnYXRvci5tc1BvaW50ZXJFbmFibGVkKSB7XG5cdFx0XHRcdHRoaXMubm9kZS5hZGRFdmVudExpc3RlbmVyKCdNU1BvaW50ZXJVcCcsIGhhbmRsZU1vdXNldXAsIGZhbHNlKTtcblx0XHRcdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignTVNQb2ludGVyTW92ZScsIGhhbmRsZU1vdXNlbW92ZSwgZmFsc2UpO1xuXHRcdFx0XHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdNU1BvaW50ZXJDYW5jZWwnLCBjYW5jZWwsIGZhbHNlKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRoaXMubm9kZS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZU1vdXNldXAsIGZhbHNlKTtcblx0XHRcdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgaGFuZGxlTW91c2Vtb3ZlLCBmYWxzZSk7XG5cdFx0XHR9XG5cblx0XHRcdHNldFRpbWVvdXQoY2FuY2VsLCBUSU1FX1RIUkVTSE9MRCk7XG5cdFx0fSxcblx0XHR0b3VjaGRvd246IGZ1bmN0aW9uIHRvdWNoZG93bigpIHtcblx0XHRcdHZhciBfdGhpczIgPSB0aGlzO1xuXG5cdFx0XHR2YXIgdG91Y2ggPSBldmVudC50b3VjaGVzWzBdO1xuXG5cdFx0XHR2YXIgeCA9IHRvdWNoLmNsaWVudFg7XG5cdFx0XHR2YXIgeSA9IHRvdWNoLmNsaWVudFk7XG5cblx0XHRcdHZhciBmaW5nZXIgPSB0b3VjaC5pZGVudGlmaWVyO1xuXG5cdFx0XHR2YXIgaGFuZGxlVG91Y2h1cCA9IGZ1bmN0aW9uIGhhbmRsZVRvdWNodXAoZXZlbnQpIHtcblx0XHRcdFx0dmFyIHRvdWNoID0gZXZlbnQuY2hhbmdlZFRvdWNoZXNbMF07XG5cblx0XHRcdFx0aWYgKHRvdWNoLmlkZW50aWZpZXIgIT09IGZpbmdlcikge1xuXHRcdFx0XHRcdGNhbmNlbCgpO1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7IC8vIHByZXZlbnQgY29tcGF0aWJpbGl0eSBtb3VzZSBldmVudFxuXG5cdFx0XHRcdC8vIGZvciB0aGUgYmVuZWZpdCBvZiBtb2JpbGUgRmlyZWZveCBhbmQgb2xkIEFuZHJvaWQgYnJvd3NlcnMsIHdlIG5lZWQgdGhpcyBhYnN1cmQgaGFjay5cblx0XHRcdFx0X3RoaXMyLnByZXZlbnRNb3VzZWRvd25FdmVudHMgPSB0cnVlO1xuXHRcdFx0XHRjbGVhclRpbWVvdXQoX3RoaXMyLnByZXZlbnRNb3VzZWRvd25UaW1lb3V0KTtcblxuXHRcdFx0XHRfdGhpczIucHJldmVudE1vdXNlZG93blRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHRfdGhpczIucHJldmVudE1vdXNlZG93bkV2ZW50cyA9IGZhbHNlO1xuXHRcdFx0XHR9LCA0MDApO1xuXG5cdFx0XHRcdF90aGlzMi5maXJlKGV2ZW50LCB4LCB5KTtcblx0XHRcdFx0Y2FuY2VsKCk7XG5cdFx0XHR9O1xuXG5cdFx0XHR2YXIgaGFuZGxlVG91Y2htb3ZlID0gZnVuY3Rpb24gaGFuZGxlVG91Y2htb3ZlKGV2ZW50KSB7XG5cdFx0XHRcdGlmIChldmVudC50b3VjaGVzLmxlbmd0aCAhPT0gMSB8fCBldmVudC50b3VjaGVzWzBdLmlkZW50aWZpZXIgIT09IGZpbmdlcikge1xuXHRcdFx0XHRcdGNhbmNlbCgpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dmFyIHRvdWNoID0gZXZlbnQudG91Y2hlc1swXTtcblx0XHRcdFx0aWYgKE1hdGguYWJzKHRvdWNoLmNsaWVudFggLSB4KSA+PSBESVNUQU5DRV9USFJFU0hPTEQgfHwgTWF0aC5hYnModG91Y2guY2xpZW50WSAtIHkpID49IERJU1RBTkNFX1RIUkVTSE9MRCkge1xuXHRcdFx0XHRcdGNhbmNlbCgpO1xuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXG5cdFx0XHR2YXIgY2FuY2VsID0gZnVuY3Rpb24gY2FuY2VsKCkge1xuXHRcdFx0XHRfdGhpczIubm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIGhhbmRsZVRvdWNodXAsIGZhbHNlKTtcblx0XHRcdFx0d2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIGhhbmRsZVRvdWNobW92ZSwgZmFsc2UpO1xuXHRcdFx0XHR3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hjYW5jZWwnLCBjYW5jZWwsIGZhbHNlKTtcblx0XHRcdH07XG5cblx0XHRcdHRoaXMubm9kZS5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIGhhbmRsZVRvdWNodXAsIGZhbHNlKTtcblx0XHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCBoYW5kbGVUb3VjaG1vdmUsIGZhbHNlKTtcblx0XHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGNhbmNlbCcsIGNhbmNlbCwgZmFsc2UpO1xuXG5cdFx0XHRzZXRUaW1lb3V0KGNhbmNlbCwgVElNRV9USFJFU0hPTEQpO1xuXHRcdH0sXG5cdFx0dGVhcmRvd246IGZ1bmN0aW9uIHRlYXJkb3duKCkge1xuXHRcdFx0dmFyIG5vZGUgPSB0aGlzLm5vZGU7XG5cblx0XHRcdG5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcigncG9pbnRlcmRvd24nLCBoYW5kbGVNb3VzZWRvd24sIGZhbHNlKTtcblx0XHRcdG5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcignTVNQb2ludGVyRG93bicsIGhhbmRsZU1vdXNlZG93biwgZmFsc2UpO1xuXHRcdFx0bm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBoYW5kbGVNb3VzZWRvd24sIGZhbHNlKTtcblx0XHRcdG5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIGhhbmRsZVRvdWNoc3RhcnQsIGZhbHNlKTtcblx0XHRcdG5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcignZm9jdXMnLCBoYW5kbGVGb2N1cywgZmFsc2UpO1xuXHRcdH1cblx0fTtcblxuXHRmdW5jdGlvbiBoYW5kbGVNb3VzZWRvd24oZXZlbnQpIHtcblx0XHR0aGlzLl9fdGFwX2hhbmRsZXJfXy5tb3VzZWRvd24oZXZlbnQpO1xuXHR9XG5cblx0ZnVuY3Rpb24gaGFuZGxlVG91Y2hzdGFydChldmVudCkge1xuXHRcdHRoaXMuX190YXBfaGFuZGxlcl9fLnRvdWNoZG93bihldmVudCk7XG5cdH1cblxuXHRmdW5jdGlvbiBoYW5kbGVGb2N1cygpIHtcblx0XHR0aGlzLmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBoYW5kbGVLZXlkb3duLCBmYWxzZSk7XG5cdFx0dGhpcy5hZGRFdmVudExpc3RlbmVyKCdibHVyJywgaGFuZGxlQmx1ciwgZmFsc2UpO1xuXHR9XG5cblx0ZnVuY3Rpb24gaGFuZGxlQmx1cigpIHtcblx0XHR0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBoYW5kbGVLZXlkb3duLCBmYWxzZSk7XG5cdFx0dGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKCdibHVyJywgaGFuZGxlQmx1ciwgZmFsc2UpO1xuXHR9XG5cblx0ZnVuY3Rpb24gaGFuZGxlS2V5ZG93bihldmVudCkge1xuXHRcdGlmIChldmVudC53aGljaCA9PT0gMzIpIHtcblx0XHRcdC8vIHNwYWNlIGtleVxuXHRcdFx0dGhpcy5fX3RhcF9oYW5kbGVyX18uZmlyZSgpO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiB0YXA7XG5cbn0pKTsiLCJ2YXIgUmFjdGl2ZUV2ZW50c1RhcCA9IHJlcXVpcmUoJy4vcmFjdGl2ZS1ldmVudHMtdGFwJyk7XG5cbnZhciBNZXNzYWdlcyA9IHJlcXVpcmUoJy4vbWVzc2FnZXMnKTtcblxudmFyIG5vQ29uZmxpY3Q7XG52YXIgbG9hZGVkUmFjdGl2ZTtcbnZhciBjYWxsYmFja3MgPSBbXTtcblxuLy8gQ2FwdHVyZSBhbnkgZ2xvYmFsIGluc3RhbmNlIG9mIFJhY3RpdmUgd2hpY2ggYWxyZWFkeSBleGlzdHMgYmVmb3JlIHdlIGxvYWQgb3VyIG93bi5cbmZ1bmN0aW9uIGFib3V0VG9Mb2FkKCkge1xuICAgIG5vQ29uZmxpY3QgPSB3aW5kb3cuUmFjdGl2ZTtcbn1cblxuLy8gUmVzdG9yZSB0aGUgZ2xvYmFsIGluc3RhbmNlIG9mIFJhY3RpdmUgKGlmIGFueSkgYW5kIHBhc3Mgb3V0IG91ciB2ZXJzaW9uIHRvIG91ciBjYWxsYmFja3NcbmZ1bmN0aW9uIGxvYWRlZCgpIHtcbiAgICBsb2FkZWRSYWN0aXZlID0gUmFjdGl2ZTtcbiAgICB3aW5kb3cuUmFjdGl2ZSA9IG5vQ29uZmxpY3Q7XG4gICAgbG9hZGVkUmFjdGl2ZS5kZWNvcmF0b3JzLmNzc3Jlc2V0ID0gY3NzUmVzZXREZWNvcmF0b3I7IC8vIE1ha2Ugb3VyIGNzcyByZXNldCBkZWNvcmF0b3IgYXZhaWxhYmxlIHRvIGFsbCBpbnN0YW5jZXNcbiAgICBsb2FkZWRSYWN0aXZlLmV2ZW50cy50YXAgPSBSYWN0aXZlRXZlbnRzVGFwOyAvLyBNYWtlIHRoZSAnb24tdGFwJyBldmVudCBwbHVnaW4gYXZhaWxhYmxlIHRvIGFsbCBpbnN0YW5jZXNcbiAgICBsb2FkZWRSYWN0aXZlLmRlZmF1bHRzLmRhdGEuZ2V0TWVzc2FnZSA9IE1lc3NhZ2VzLmdldE1lc3NhZ2U7IC8vIE1ha2UgZ2V0TWVzc2FnZSBhdmFpbGFibGUgdG8gYWxsIGluc3RhbmNlc1xuICAgIGxvYWRlZFJhY3RpdmUuZGVmYXVsdHMudHdvd2F5ID0gZmFsc2U7IC8vIENoYW5nZSB0aGUgZGVmYXVsdCB0byBkaXNhYmxlIHR3by13YXkgZGF0YSBiaW5kaW5ncy5cbiAgICBsb2FkZWRSYWN0aXZlLkRFQlVHID0gZmFsc2U7XG4gICAgbm90aWZ5Q2FsbGJhY2tzKCk7XG59XG5cbmZ1bmN0aW9uIGNzc1Jlc2V0RGVjb3JhdG9yKG5vZGUpIHtcbiAgICB0YWdOb2RlQW5kQ2hpbGRyZW4obm9kZSwgJ2FudGVubmEtcmVzZXQnKTtcbiAgICByZXR1cm4geyB0ZWFyZG93bjogZnVuY3Rpb24oKSB7fSB9O1xufVxuXG5mdW5jdGlvbiB0YWdOb2RlQW5kQ2hpbGRyZW4obm9kZSwgY2xhenopIHtcbiAgICBub2RlLmNsYXNzTmFtZSA9IG5vZGUuY2xhc3NOYW1lID8gbm9kZS5jbGFzc05hbWUgKyAnICcgKyBjbGF6eiA6IGNsYXp6O1xuICAgIGlmIChub2RlLmNoaWxkcmVuKSB7IC8vIFNhZmFyaSByZXR1cm5zIHVuZGVmaW5lZCB3aGVuIGFza2luZyBmb3IgY2hpbGRyZW4gb24gYW4gU1ZHIGVsZW1lbnRcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBub2RlLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB0YWdOb2RlQW5kQ2hpbGRyZW4obm9kZS5jaGlsZHJlbltpXSwgY2xhenopO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBub3RpZnlDYWxsYmFja3MoKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjYWxsYmFja3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY2FsbGJhY2tzW2ldKGxvYWRlZFJhY3RpdmUpO1xuICAgIH1cbiAgICBjYWxsYmFja3MgPSBbXTtcbn1cblxuLy8gUmVnaXN0ZXJzIHRoZSBnaXZlbiBjYWxsYmFjayB0byBiZSBub3RpZmllZCB3aGVuIG91ciB2ZXJzaW9uIG9mIFJhY3RpdmUgaXMgbG9hZGVkLlxuZnVuY3Rpb24gb25Mb2FkKGNhbGxiYWNrKSB7XG4gICAgaWYgKGxvYWRlZFJhY3RpdmUpIHtcbiAgICAgICAgY2FsbGJhY2sobG9hZGVkUmFjdGl2ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgY2FsbGJhY2tzLnB1c2goY2FsbGJhY2spO1xuICAgIH1cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGFib3V0VG9Mb2FkOiBhYm91dFRvTG9hZCxcbiAgICBsb2FkZWQ6IGxvYWRlZCxcbiAgICBvbkxvYWQ6IG9uTG9hZFxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciByYW5neTsgcmVxdWlyZSgnLi9yYW5neS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihsb2FkZWRSYW5neSkgeyByYW5neSA9IGxvYWRlZFJhbmd5OyB9KTtcblxudmFyIGhpZ2hsaWdodENsYXNzID0gJ2FudGVubmEtaGlnaGxpZ2h0JztcbnZhciBoaWdobGlnaHRlZFJhbmdlcyA9IFtdO1xuXG52YXIgY2xhc3NBcHBsaWVyO1xuZnVuY3Rpb24gZ2V0Q2xhc3NBcHBsaWVyKCkge1xuICAgIGlmICghY2xhc3NBcHBsaWVyKSB7XG4gICAgICAgIGNsYXNzQXBwbGllciA9IHJhbmd5LmNyZWF0ZUNsYXNzQXBwbGllcihoaWdobGlnaHRDbGFzcywgeyBlbGVtZW50VGFnTmFtZTogJ2lucycgfSk7XG4gICAgfVxuICAgIHJldHVybiBjbGFzc0FwcGxpZXI7XG59XG5cbi8vIFJldHVybnMgYW4gYWRqdXN0ZWQgZW5kIHBvaW50IGZvciB0aGUgc2VsZWN0aW9uIHdpdGhpbiB0aGUgZ2l2ZW4gbm9kZSwgYXMgdHJpZ2dlcmVkIGJ5IHRoZSBnaXZlbiBtb3VzZSB1cCBldmVudC5cbi8vIFRoZSByZXR1cm5lZCBwb2ludCAoeCwgeSkgdGFrZXMgaW50byBhY2NvdW50IHRoZSBsb2NhdGlvbiBvZiB0aGUgbW91c2UgdXAgZXZlbnQgYXMgd2VsbCBhcyB0aGUgZGlyZWN0aW9uIG9mIHRoZVxuLy8gc2VsZWN0aW9uIChmb3J3YXJkL2JhY2spLlxuZnVuY3Rpb24gZ2V0U2VsZWN0aW9uRW5kUG9pbnQobm9kZSwgZXZlbnQsIGV4Y2x1ZGVOb2RlKSB7XG4gICAgLy8gVE9ETzogQ29uc2lkZXIgdXNpbmcgdGhlIGVsZW1lbnQgY3JlYXRlZCB3aXRoIHRoZSAnY2xhc3NpZmllcicgcmF0aGVyIHRoYW4gdGhlIG1vdXNlIGxvY2F0aW9uXG4gICAgdmFyIHNlbGVjdGlvbiA9IHJhbmd5LmdldFNlbGVjdGlvbigpO1xuICAgIGlmIChpc1ZhbGlkU2VsZWN0aW9uKHNlbGVjdGlvbiwgbm9kZSwgZXhjbHVkZU5vZGUpKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB4OiBldmVudC5wYWdlWCAtICggc2VsZWN0aW9uLmlzQmFja3dhcmRzKCkgPyAtNSA6IDUpLFxuICAgICAgICAgICAgeTogZXZlbnQucGFnZVkgLSA4IC8vIFRPRE86IGV4YWN0IGNvb3Jkc1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xufVxuXG4vLyBBdHRlbXB0cyB0byBnZXQgYSByYW5nZSBmcm9tIHRoZSBjdXJyZW50IHNlbGVjdGlvbi4gVGhpcyBleHBhbmRzIHRoZVxuLy8gc2VsZWN0ZWQgcmVnaW9uIHRvIGluY2x1ZGUgd29yZCBib3VuZGFyaWVzLlxuZnVuY3Rpb24gZ3JhYlNlbGVjdGlvbihub2RlLCBjYWxsYmFjaywgZXhjbHVkZU5vZGUpIHtcbiAgICB2YXIgc2VsZWN0aW9uID0gcmFuZ3kuZ2V0U2VsZWN0aW9uKCk7XG4gICAgaWYgKGlzVmFsaWRTZWxlY3Rpb24oc2VsZWN0aW9uLCBub2RlLCBleGNsdWRlTm9kZSkpIHtcbiAgICAgICAgZXhwYW5kQW5kVHJpbVJhbmdlKHNlbGVjdGlvbik7XG4gICAgICAgIGlmIChzZWxlY3Rpb24uY29udGFpbnNOb2RlKGV4Y2x1ZGVOb2RlKSkge1xuICAgICAgICAgICAgdmFyIHJhbmdlID0gc2VsZWN0aW9uLmdldFJhbmdlQXQoMCk7XG4gICAgICAgICAgICByYW5nZS5zZXRFbmRCZWZvcmUoZXhjbHVkZU5vZGUpO1xuICAgICAgICAgICAgc2VsZWN0aW9uLnNldFNpbmdsZVJhbmdlKHJhbmdlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaXNWYWxpZFNlbGVjdGlvbihzZWxlY3Rpb24sIG5vZGUsIGV4Y2x1ZGVOb2RlKSkge1xuICAgICAgICAgICAgdmFyIGxvY2F0aW9uO1xuICAgICAgICAgICAgaWYgKHNlbGVjdGlvbkVuY29tcGFzc2VzTm9kZShzZWxlY3Rpb24sIG5vZGUpKSB7XG4gICAgICAgICAgICAgICAgbG9jYXRpb24gPSAnOjAsOjEnOyAvLyBUaGUgdXNlciBoYXMgbWFudWFsbHkgc2VsZWN0ZWQgdGhlIGVudGlyZSBub2RlLiBOb3JtYWxpemUgdGhlIGxvY2F0aW9uLlxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBsb2NhdGlvbiA9IHJhbmd5LnNlcmlhbGl6ZVNlbGVjdGlvbihzZWxlY3Rpb24sIHRydWUsIG5vZGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHRleHQgPSBzZWxlY3Rpb24udG9TdHJpbmcoKTtcbiAgICAgICAgICAgIGhpZ2hsaWdodFNlbGVjdGlvbihzZWxlY3Rpb24pOyAvLyBIaWdobGlnaHRpbmcgZGVzZWxlY3RzIHRoZSB0ZXh0LCBzbyBkbyB0aGlzIGxhc3QuXG4gICAgICAgICAgICBjYWxsYmFjayh0ZXh0LCBsb2NhdGlvbik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBleHBhbmRBbmRUcmltUmFuZ2UocmFuZ2VPclNlbGVjdGlvbikge1xuICAgICAgICByYW5nZU9yU2VsZWN0aW9uLmV4cGFuZCgnd29yZCcsIHsgdHJpbTogdHJ1ZSwgd29yZE9wdGlvbnM6IHsgd29yZFJlZ2V4OiAvXFxTK1xcUyovZ2kgfSB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzZWxlY3Rpb25FbmNvbXBhc3Nlc05vZGUoc2VsZWN0aW9uLCBub2RlKSB7XG4gICAgICAgIHZhciByYW5nZSA9IGdldE5vZGVSYW5nZShub2RlKTtcbiAgICAgICAgZXhwYW5kQW5kVHJpbVJhbmdlKHJhbmdlKTtcbiAgICAgICAgcmV0dXJuIHJhbmdlLnRvU3RyaW5nKCkgPT09IHNlbGVjdGlvbi50b1N0cmluZygpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gaXNWYWxpZFNlbGVjdGlvbihzZWxlY3Rpb24sIG5vZGUsIGV4Y2x1ZGVOb2RlKSB7XG4gICAgcmV0dXJuICFzZWxlY3Rpb24uaXNDb2xsYXBzZWQgJiYgIC8vIE5vbi1lbXB0eSBzZWxlY3Rpb25cbiAgICAgICAgc2VsZWN0aW9uLnJhbmdlQ291bnQgPT09IDEgJiYgLy8gU2luZ2xlIHNlbGVjdGlvblxuICAgICAgICAoIWV4Y2x1ZGVOb2RlIHx8ICFzZWxlY3Rpb24uY29udGFpbnNOb2RlKGV4Y2x1ZGVOb2RlLCB0cnVlKSkgJiYgLy8gU2VsZWN0aW9uIGRvZXNuJ3QgY29udGFpbiBhbnl0aGluZyB3ZSd2ZSBzYWlkIHdlIGRvbid0IHdhbnQgKGUuZy4gdGhlIGluZGljYXRvcilcbiAgICAgICAgbm9kZUNvbnRhaW5zU2VsZWN0aW9uKG5vZGUsIHNlbGVjdGlvbik7IC8vIFNlbGVjdGlvbiBpcyBjb250YWluZWQgZW50aXJlbHkgd2l0aGluIHRoZSBub2RlXG59XG5cbmZ1bmN0aW9uIG5vZGVDb250YWluc1NlbGVjdGlvbihub2RlLCBzZWxlY3Rpb24pIHtcbiAgICB2YXIgY29tbW9uQW5jZXN0b3IgPSBzZWxlY3Rpb24uZ2V0UmFuZ2VBdCgwKS5jb21tb25BbmNlc3RvckNvbnRhaW5lcjsgLy8gY29tbW9uQW5jZXN0b3IgY291bGQgYmUgYSB0ZXh0IG5vZGUgb3Igc29tZSBwYXJlbnQgZWxlbWVudFxuICAgIHJldHVybiBub2RlLmNvbnRhaW5zKGNvbW1vbkFuY2VzdG9yKSB8fFxuICAgICAgICAgICAgLy8gVGhlIGZvbGxvd2luZyBjaGVjayBpcyBmb3IgSUUsIHdoaWNoIGRvZXNuJ3QgaW1wbGVtZW50IFwiY29udGFpbnNcIiBwcm9wZXJseSBmb3IgdGV4dCBub2Rlcy5cbiAgICAgICAgKGNvbW1vbkFuY2VzdG9yLm5vZGVUeXBlID09PSAzICYmIG5vZGUuY29udGFpbnMoY29tbW9uQW5jZXN0b3IucGFyZW50Tm9kZSkpO1xufVxuXG5mdW5jdGlvbiBnZXROb2RlUmFuZ2Uobm9kZSkge1xuICAgIHZhciByYW5nZSA9IHJhbmd5LmNyZWF0ZVJhbmdlKGRvY3VtZW50KTtcbiAgICByYW5nZS5zZWxlY3ROb2RlQ29udGVudHMobm9kZSk7XG4gICAgdmFyICRleGNsdWRlZCA9ICQobm9kZSkuZmluZCgnLmFudGVubmEtdGV4dC1pbmRpY2F0b3Itd2lkZ2V0Jyk7XG4gICAgaWYgKCRleGNsdWRlZC5zaXplKCkgPiAwKSB7IC8vIFJlbW92ZSB0aGUgaW5kaWNhdG9yIGZyb20gdGhlIGVuZCBvZiB0aGUgc2VsZWN0ZWQgcmFuZ2UuXG4gICAgICAgIHJhbmdlLnNldEVuZEJlZm9yZSgkZXhjbHVkZWQuZ2V0KDApKTtcbiAgICB9XG4gICAgcmV0dXJuIHJhbmdlO1xufVxuXG5mdW5jdGlvbiBncmFiTm9kZShub2RlLCBjYWxsYmFjaykge1xuICAgIHZhciByYW5nZSA9IGdldE5vZGVSYW5nZShub2RlKTtcbiAgICB2YXIgc2VsZWN0aW9uID0gcmFuZ3kuZ2V0U2VsZWN0aW9uKCk7XG4gICAgc2VsZWN0aW9uLnNldFNpbmdsZVJhbmdlKHJhbmdlKTtcbiAgICAvLyBXZSBzaG91bGQganVzdCBiZSBhYmxlIHRvIHNlcmlhbGl6ZSB0aGUgc2VsZWN0aW9uLCBidXQgdGhpcyBnaXZlcyB1cyBpbmNvbnNpc3RlbnQgdmFsdWVzIGluIFNhZmFyaS5cbiAgICAvLyBUaGUgdmFsdWUgKnNob3VsZCogYWx3YXlzIGJlIDowLDoxIHdoZW4gd2Ugc2VsZWN0IGFuIGVudGlyZSBub2RlLCBzbyB3ZSBqdXN0IGhhcmRjb2RlIGl0LlxuICAgIC8vdmFyIGxvY2F0aW9uID0gcmFuZ3kuc2VyaWFsaXplU2VsZWN0aW9uKHNlbGVjdGlvbiwgdHJ1ZSwgbm9kZSk7XG4gICAgdmFyIGxvY2F0aW9uID0gJzowLDoxJztcbiAgICB2YXIgdGV4dCA9IHNlbGVjdGlvbi50b1N0cmluZygpLnRyaW0oKTtcbiAgICBpZiAodGV4dC5sZW5ndGggPiAwKSB7XG4gICAgICAgIGhpZ2hsaWdodFNlbGVjdGlvbihzZWxlY3Rpb24pOyAvLyBIaWdobGlnaHRpbmcgZGVzZWxlY3RzIHRoZSB0ZXh0LCBzbyBkbyB0aGlzIGxhc3QuXG4gICAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICAgICAgY2FsbGJhY2sodGV4dCwgbG9jYXRpb24pO1xuICAgICAgICB9XG4gICAgfVxuICAgIHNlbGVjdGlvbi5yZW1vdmVBbGxSYW5nZXMoKTsgLy8gRG9uJ3QgYWN0dWFsbHkgbGVhdmUgdGhlIGVsZW1lbnQgc2VsZWN0ZWQuXG4gICAgc2VsZWN0aW9uLnJlZnJlc2goKTtcbn1cblxuLy8gSGlnaGxpZ2h0cyB0aGUgZ2l2ZW4gbG9jYXRpb24gaW5zaWRlIHRoZSBnaXZlbiBub2RlLlxuZnVuY3Rpb24gaGlnaGxpZ2h0TG9jYXRpb24obm9kZSwgbG9jYXRpb24pIHtcbiAgICAvLyBUT0RPIGVycm9yIGhhbmRsaW5nIGluIGNhc2UgdGhlIHJhbmdlIGlzIG5vdCB2YWxpZD9cbiAgICBpZiAocmFuZ3kuY2FuRGVzZXJpYWxpemVSYW5nZShsb2NhdGlvbiwgbm9kZSwgZG9jdW1lbnQpKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB2YXIgcmFuZ2UgPSByYW5neS5kZXNlcmlhbGl6ZVJhbmdlKGxvY2F0aW9uLCBub2RlLCBkb2N1bWVudCk7XG4gICAgICAgICAgICBoaWdobGlnaHRSYW5nZShyYW5nZSk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAvLyBUT0RPOiBDb25zaWRlciBsb2dnaW5nIHNvbWUga2luZCBvZiBldmVudCBzZXJ2ZXItc2lkZT9cbiAgICAgICAgICAgIC8vIFRPRE86IENvbnNpZGVyIGhpZ2hsaWdodGluZyB0aGUgd2hvbGUgbm9kZT8gT3IgaXMgaXQgYmV0dGVyIHRvIGp1c3QgaGlnaGxpZ2h0IG5vdGhpbmc/XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGhpZ2hsaWdodFNlbGVjdGlvbihzZWxlY3Rpb24pIHtcbiAgICBoaWdobGlnaHRSYW5nZShzZWxlY3Rpb24uZ2V0UmFuZ2VBdCgwKSk7XG59XG5cbmZ1bmN0aW9uIGhpZ2hsaWdodFJhbmdlKHJhbmdlKSB7XG4gICAgY2xlYXJIaWdobGlnaHRzKCk7XG4gICAgZ2V0Q2xhc3NBcHBsaWVyKCkuYXBwbHlUb1JhbmdlKHJhbmdlKTtcbiAgICBoaWdobGlnaHRlZFJhbmdlcy5wdXNoKHJhbmdlKTtcbn1cblxuLy8gQ2xlYXJzIGFsbCBoaWdobGlnaHRzIHRoYXQgaGF2ZSBiZWVuIGNyZWF0ZWQgb24gdGhlIHBhZ2UuXG5mdW5jdGlvbiBjbGVhckhpZ2hsaWdodHMoKSB7XG4gICAgdmFyIGNsYXNzQXBwbGllciA9IGdldENsYXNzQXBwbGllcigpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaGlnaGxpZ2h0ZWRSYW5nZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIHJhbmdlID0gaGlnaGxpZ2h0ZWRSYW5nZXNbaV07XG4gICAgICAgIGlmIChjbGFzc0FwcGxpZXIuaXNBcHBsaWVkVG9SYW5nZShyYW5nZSkpIHtcbiAgICAgICAgICAgIGNsYXNzQXBwbGllci51bmRvVG9SYW5nZShyYW5nZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaGlnaGxpZ2h0ZWRSYW5nZXMgPSBbXTtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGdldFNlbGVjdGlvbkVuZFBvaW50OiBnZXRTZWxlY3Rpb25FbmRQb2ludCxcbiAgICBncmFiU2VsZWN0aW9uOiBncmFiU2VsZWN0aW9uLFxuICAgIGdyYWJOb2RlOiBncmFiTm9kZSxcbiAgICBjbGVhckhpZ2hsaWdodHM6IGNsZWFySGlnaGxpZ2h0cyxcbiAgICBoaWdobGlnaHQ6IGhpZ2hsaWdodExvY2F0aW9uLFxuICAgIEhJR0hMSUdIVF9TRUxFQ1RPUjogJy4nICsgaGlnaGxpZ2h0Q2xhc3Ncbn07IiwiXG52YXIgbm9Db25mbGljdDtcbnZhciBsb2FkZWRSYW5neTtcbnZhciBjYWxsYmFja3MgPSBbXTtcblxuLy8gQ2FwdHVyZSBhbnkgZ2xvYmFsIGluc3RhbmNlIG9mIHJhbmd5IHdoaWNoIGFscmVhZHkgZXhpc3RzIGJlZm9yZSB3ZSBsb2FkIG91ciBvd24uXG5mdW5jdGlvbiBhYm91dFRvTG9hZCgpIHtcbiAgICBub0NvbmZsaWN0ID0gd2luZG93LnJhbmd5O1xufVxuXG4vLyBSZXN0b3JlIHRoZSBnbG9iYWwgaW5zdGFuY2Ugb2YgcmFuZ3kgKGlmIGFueSkgYW5kIHBhc3Mgb3V0IG91ciB2ZXJzaW9uIHRvIG91ciBjYWxsYmFja3NcbmZ1bmN0aW9uIGxvYWRlZCgpIHtcbiAgICBsb2FkZWRSYW5neSA9IHJhbmd5O1xuICAgIGxvYWRlZFJhbmd5LmluaXQoKTtcbiAgICB3aW5kb3cucmFuZ3kgPSBub0NvbmZsaWN0O1xuICAgIG5vdGlmeUNhbGxiYWNrcygpO1xufVxuXG5mdW5jdGlvbiBub3RpZnlDYWxsYmFja3MoKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjYWxsYmFja3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY2FsbGJhY2tzW2ldKGxvYWRlZFJhbmd5KTtcbiAgICB9XG4gICAgY2FsbGJhY2tzID0gW107XG59XG5cbi8vIFJlZ2lzdGVycyB0aGUgZ2l2ZW4gY2FsbGJhY2sgdG8gYmUgbm90aWZpZWQgd2hlbiBvdXIgdmVyc2lvbiBvZiBSYW5neSBpcyBsb2FkZWQuXG5mdW5jdGlvbiBvbkxvYWQoY2FsbGJhY2spIHtcbiAgICBpZiAobG9hZGVkUmFuZ3kpIHtcbiAgICAgICAgY2FsbGJhY2sobG9hZGVkUmFuZ3kpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGNhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKTtcbiAgICB9XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBhYm91dFRvTG9hZDogYWJvdXRUb0xvYWQsXG4gICAgbG9hZGVkOiBsb2FkZWQsXG4gICAgb25Mb2FkOiBvbkxvYWRcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG5cbnZhciBDTEFTU19GVUxMID0gJ2FudGVubmEtZnVsbCc7XG52YXIgQ0xBU1NfSEFMRiA9ICdhbnRlbm5hLWhhbGYnO1xuXG5mdW5jdGlvbiBjb21wdXRlTGF5b3V0RGF0YShyZWFjdGlvbnNEYXRhKSB7XG4gICAgdmFyIG51bVJlYWN0aW9ucyA9IHJlYWN0aW9uc0RhdGEubGVuZ3RoO1xuICAgIGlmIChudW1SZWFjdGlvbnMgPT0gMCkge1xuICAgICAgICByZXR1cm4ge307IC8vIFRPRE8gY2xlYW4gdGhpcyB1cFxuICAgIH1cbiAgICAvLyBUT0RPOiBDb3BpZWQgY29kZSBmcm9tIGVuZ2FnZV9mdWxsLmNyZWF0ZVRhZ0J1Y2tldHNcbiAgICB2YXIgbWF4ID0gcmVhY3Rpb25zRGF0YVswXS5jb3VudDtcbiAgICB2YXIgbWVkaWFuID0gcmVhY3Rpb25zRGF0YVsgTWF0aC5mbG9vcihyZWFjdGlvbnNEYXRhLmxlbmd0aC8yKSBdLmNvdW50O1xuICAgIHZhciBtaW4gPSByZWFjdGlvbnNEYXRhWyByZWFjdGlvbnNEYXRhLmxlbmd0aC0xIF0uY291bnQ7XG4gICAgdmFyIHRvdGFsID0gMDtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG51bVJlYWN0aW9uczsgaSsrKSB7XG4gICAgICAgIHRvdGFsICs9IHJlYWN0aW9uc0RhdGFbaV0uY291bnQ7XG4gICAgfVxuICAgIHZhciBhdmVyYWdlID0gTWF0aC5mbG9vcih0b3RhbCAvIG51bVJlYWN0aW9ucyk7XG4gICAgdmFyIG1pZFZhbHVlID0gKCBtZWRpYW4gPiBhdmVyYWdlICkgPyBtZWRpYW4gOiBhdmVyYWdlO1xuXG4gICAgdmFyIGxheW91dENsYXNzZXMgPSBbXTtcbiAgICB2YXIgbnVtSGFsZnNpZXMgPSAwO1xuICAgIHZhciBudW1GdWxsID0gMDtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG51bVJlYWN0aW9uczsgaSsrKSB7XG4gICAgICAgIGlmIChyZWFjdGlvbnNEYXRhW2ldLmNvdW50ID4gbWlkVmFsdWUpIHtcbiAgICAgICAgICAgIGxheW91dENsYXNzZXNbaV0gPSBDTEFTU19GVUxMO1xuICAgICAgICAgICAgbnVtRnVsbCsrO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbGF5b3V0Q2xhc3Nlc1tpXSA9IENMQVNTX0hBTEY7XG4gICAgICAgICAgICBudW1IYWxmc2llcysrO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChudW1IYWxmc2llcyAlIDIgIT09MCkge1xuICAgICAgICBsYXlvdXRDbGFzc2VzW251bVJlYWN0aW9ucyAtIDFdID0gQ0xBU1NfRlVMTDsgLy8gSWYgdGhlcmUgYXJlIGFuIG9kZCBudW1iZXIsIHRoZSBsYXN0IG9uZSBnb2VzIGZ1bGwuXG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgbGF5b3V0Q2xhc3NlczogbGF5b3V0Q2xhc3Nlc1xuICAgIH07XG59XG5cbmZ1bmN0aW9uIHNpemVSZWFjdGlvblRleHRUb0ZpdCgkcmVhY3Rpb25zV2luZG93KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIHNpemVSZWFjdGlvblRleHRUb0ZpdChub2RlKSB7XG4gICAgICAgIHZhciAkZWxlbWVudCA9ICQobm9kZSk7XG4gICAgICAgIHZhciBvcmlnaW5hbERpc3BsYXkgPSAkcmVhY3Rpb25zV2luZG93LmNzcygnZGlzcGxheScpO1xuICAgICAgICBpZiAob3JpZ2luYWxEaXNwbGF5ID09PSAnbm9uZScpIHsgLy8gSWYgd2UncmUgc2l6aW5nIHRoZSBib3hlcyBiZWZvcmUgdGhlIHdpZGdldCBpcyBkaXNwbGF5ZWQsIHRlbXBvcmFyaWx5IGRpc3BsYXkgaXQgb2Zmc2NyZWVuLlxuICAgICAgICAgICAgJHJlYWN0aW9uc1dpbmRvdy5jc3Moe2Rpc3BsYXk6ICdibG9jaycsIGxlZnQ6ICcxMDAlJ30pO1xuICAgICAgICB9XG4gICAgICAgIHZhciBob3Jpem9udGFsUmF0aW8gPSBub2RlLmNsaWVudFdpZHRoIC8gbm9kZS5zY3JvbGxXaWR0aDtcbiAgICAgICAgaWYgKGhvcml6b250YWxSYXRpbyA8IDEuMCkgeyAvLyBJZiB0aGUgdGV4dCBkb2Vzbid0IGZpdCwgZmlyc3QgdHJ5IHRvIHdyYXAgaXQgdG8gdHdvIGxpbmVzLiBUaGVuIHNjYWxlIGl0IGRvd24gaWYgc3RpbGwgbmVjZXNzYXJ5LlxuICAgICAgICAgICAgdmFyIHRleHQgPSBub2RlLmlubmVySFRNTDtcbiAgICAgICAgICAgIHZhciBtaWQgPSBNYXRoLmNlaWwodGV4dC5sZW5ndGggLyAyKTsgLy8gTG9vayBmb3IgdGhlIGNsb3Nlc3Qgc3BhY2UgdG8gdGhlIG1pZGRsZSwgd2VpZ2h0ZWQgc2xpZ2h0bHkgKE1hdGguY2VpbCkgdG93YXJkIGEgc3BhY2UgaW4gdGhlIHNlY29uZCBoYWxmLlxuICAgICAgICAgICAgdmFyIHNlY29uZEhhbGZJbmRleCA9IHRleHQuaW5kZXhPZignICcsIG1pZCk7XG4gICAgICAgICAgICB2YXIgZmlyc3RIYWxmSW5kZXggPSB0ZXh0Lmxhc3RJbmRleE9mKCcgJywgbWlkKTtcbiAgICAgICAgICAgIHZhciBzcGxpdEluZGV4ID0gTWF0aC5hYnMoc2Vjb25kSGFsZkluZGV4IC0gbWlkKSA8IE1hdGguYWJzKG1pZCAtIGZpcnN0SGFsZkluZGV4KSA/IHNlY29uZEhhbGZJbmRleCA6IGZpcnN0SGFsZkluZGV4O1xuICAgICAgICAgICAgdmFyIHZlcnRpY2FsUmF0aW87XG4gICAgICAgICAgICBpZiAoc3BsaXRJbmRleCA+IDEpIHtcbiAgICAgICAgICAgICAgICAvLyBTcGxpdCB0aGUgdGV4dCBhbmQgdGhlbiBzZWUgaG93IGl0IGZpdHMuXG4gICAgICAgICAgICAgICAgbm9kZS5pbm5lckhUTUwgPSB0ZXh0LnNsaWNlKDAsIHNwbGl0SW5kZXgpICsgJzxicj4nICsgdGV4dC5zbGljZShzcGxpdEluZGV4KTtcbiAgICAgICAgICAgICAgICB2YXIgd3JhcHBlZEhvcml6b250YWxSYXRpbyA9IG5vZGUuY2xpZW50V2lkdGggLyBub2RlLnNjcm9sbFdpZHRoO1xuICAgICAgICAgICAgICAgIHZhciBwYXJlbnRBdmFpbGFibGVIZWlnaHQgPSBjb21wdXRlQXZhaWxhYmxlQ2xpZW50QXJlYShub2RlLnBhcmVudE5vZGUpO1xuICAgICAgICAgICAgICAgIHZlcnRpY2FsUmF0aW8gPSBub2RlLnNjcm9sbEhlaWdodCAvIHBhcmVudEF2YWlsYWJsZUhlaWdodDtcblxuICAgICAgICAgICAgICAgIHZhciB2ZXJ0aWNhbFJhdGlvTWF4ID0gMC40O1xuICAgICAgICAgICAgICAgIGlmICh2ZXJ0aWNhbFJhdGlvICYmIHZlcnRpY2FsUmF0aW8gPiB2ZXJ0aWNhbFJhdGlvTWF4KSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzY2FsZUZhY3RvciA9IHZlcnRpY2FsUmF0aW9NYXggLyB2ZXJ0aWNhbFJhdGlvO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAod3JhcHBlZEhvcml6b250YWxSYXRpbyA8IDEuMCkge1xuICAgICAgICAgICAgICAgICAgICBzY2FsZUZhY3RvciA9IE1hdGgubWluKHNjYWxlRmFjdG9yLCB3cmFwcGVkSG9yaXpvbnRhbFJhdGlvKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHNjYWxlRmFjdG9yIDw9IGhvcml6b250YWxSYXRpbykge1xuICAgICAgICAgICAgICAgICAgICAvLyBJZiB3ZSBlbmRlZCB1cCBoYXZpbmcgdG8gbWFrZSB0aGUgdGV4dCBzbWFsbFxuICAgICAgICAgICAgICAgICAgICBub2RlLmlubmVySFRNTCA9IHRleHQ7XG4gICAgICAgICAgICAgICAgICAgIHNjYWxlRmFjdG9yID0gaG9yaXpvbnRhbFJhdGlvO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAkZWxlbWVudC5jc3MoJ2ZvbnQtc2l6ZScsIE1hdGgubWF4KDEwLCBNYXRoLmZsb29yKHBhcnNlSW50KCRlbGVtZW50LmNzcygnZm9udC1zaXplJykpICogc2NhbGVGYWN0b3IpIC0gMSkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAkZWxlbWVudC5jc3MoJ2ZvbnQtc2l6ZScsIE1hdGgubWF4KDEwLCBNYXRoLmZsb29yKHBhcnNlSW50KCRlbGVtZW50LmNzcygnZm9udC1zaXplJykpICogaG9yaXpvbnRhbFJhdGlvKSAtIDEpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAob3JpZ2luYWxEaXNwbGF5ID09PSAnbm9uZScpIHtcbiAgICAgICAgICAgICRyZWFjdGlvbnNXaW5kb3cuY3NzKHtkaXNwbGF5OiAnJywgbGVmdDogJyd9KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdGVhcmRvd246IGZ1bmN0aW9uKCkge31cbiAgICAgICAgfTtcbiAgICB9O1xufVxuXG5mdW5jdGlvbiBjb21wdXRlQXZhaWxhYmxlQ2xpZW50QXJlYShub2RlKSB7XG4gICAgdmFyIG5vZGVTdHlsZSA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKG5vZGUpO1xuICAgIHJldHVybiBwYXJzZUludChub2RlU3R5bGUuaGVpZ2h0KSAtIHBhcnNlSW50KG5vZGVTdHlsZS5wYWRkaW5nVG9wKSAtIHBhcnNlSW50KG5vZGVTdHlsZS5wYWRkaW5nQm90dG9tKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgc2l6ZVRvRml0OiBzaXplUmVhY3Rpb25UZXh0VG9GaXQsXG4gICAgY29tcHV0ZUxheW91dERhdGE6IGNvbXB1dGVMYXlvdXREYXRhXG59OyIsInZhciBDYWxsYmFja1N1cHBvcnQgPSByZXF1aXJlKCcuL2NhbGxiYWNrLXN1cHBvcnQnKTtcblxuLy8gVGhpcyBtb2R1bGUgYWxsb3dzIHVzIHRvIHJlZ2lzdGVyIGNhbGxiYWNrcyB0aGF0IGFyZSB0aHJvdHRsZWQgaW4gdGhlaXIgZnJlcXVlbmN5LiBUaGlzIGlzIHVzZWZ1bCBmb3IgZXZlbnRzIGxpa2Vcbi8vIHJlc2l6ZSBhbmQgc2Nyb2xsLCB3aGljaCBjYW4gYmUgZmlyZWQgYXQgYW4gZXh0cmVtZWx5IGhpZ2ggcmF0ZS5cblxudmFyIHRocm90dGxlZExpc3RlbmVycyA9IHt9O1xuXG5mdW5jdGlvbiBvbih0eXBlLCBjYWxsYmFjaykge1xuICAgIHRocm90dGxlZExpc3RlbmVyc1t0eXBlXSA9IHRocm90dGxlZExpc3RlbmVyc1t0eXBlXSB8fCBjcmVhdGVUaHJvdHRsZWRMaXN0ZW5lcih0eXBlKTtcbiAgICB0aHJvdHRsZWRMaXN0ZW5lcnNbdHlwZV0uYWRkQ2FsbGJhY2soY2FsbGJhY2spO1xufVxuXG5mdW5jdGlvbiBvZmYodHlwZSwgY2FsbGJhY2spIHtcbiAgICB2YXIgZXZlbnRMaXN0ZW5lciA9IHRocm90dGxlZExpc3RlbmVyc1t0eXBlXTtcbiAgICBpZiAoZXZlbnRMaXN0ZW5lcikge1xuICAgICAgICBldmVudExpc3RlbmVyLnJlbW92ZUNhbGxiYWNrKGNhbGxiYWNrKTtcbiAgICAgICAgaWYgKGV2ZW50TGlzdGVuZXIuaXNFbXB0eSgpKSB7XG4gICAgICAgICAgICBldmVudExpc3RlbmVyLnRlYXJkb3duKCk7XG4gICAgICAgICAgICBkZWxldGUgdGhyb3R0bGVkTGlzdGVuZXJzW3R5cGVdO1xuICAgICAgICB9XG4gICAgfVxufVxuXG4vLyBDcmVhdGVzIGEgbGlzdGVuZXIgb24gdGhlIHBhcnRpY3VsYXIgZXZlbnQgdHlwZS4gQ2FsbGJhY2tzIGFkZGVkIHRvIHRoaXMgbGlzdGVuZXIgd2lsbCBiZSB0aHJvdHRsZWQuXG5mdW5jdGlvbiBjcmVhdGVUaHJvdHRsZWRMaXN0ZW5lcih0eXBlKSB7XG4gICAgdmFyIGNhbGxiYWNrcyA9IENhbGxiYWNrU3VwcG9ydC5jcmVhdGUoKTtcbiAgICB2YXIgZXZlbnRUaW1lb3V0O1xuICAgIHNldHVwKCk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgYWRkQ2FsbGJhY2s6IGNhbGxiYWNrcy5hZGQsXG4gICAgICAgIHJlbW92ZUNhbGxiYWNrOiBjYWxsYmFja3MucmVtb3ZlLFxuICAgICAgICBpc0VtcHR5OiBjYWxsYmFja3MuaXNFbXB0eSxcbiAgICAgICAgdGVhcmRvd246IHRlYXJkb3duXG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIGhhbmRsZUV2ZW50KCkge1xuICAgICAgIGlmICghZXZlbnRUaW1lb3V0KSB7XG4gICAgICAgICAgIGV2ZW50VGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICBjYWxsYmFja3MuaW52b2tlQWxsKCk7XG4gICAgICAgICAgICAgICBldmVudFRpbWVvdXQgPSBudWxsO1xuICAgICAgICAgICB9LCA2Nik7IC8vIDE1IEZQU1xuICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzZXR1cCgpIHtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIodHlwZSwgaGFuZGxlRXZlbnQpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHRlYXJkb3duKCkge1xuICAgICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcih0eXBlLCBoYW5kbGVFdmVudCk7XG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgb246IG9uLFxuICAgIG9mZjogb2ZmXG59OyIsIlxuLy8gVE9ETzogQ29uc2lkZXIgYWRkaW5nIHN1cHBvcnQgZm9yIHRoZSBNUyBwcm9wcmlldGFyeSBcIlBvaW50ZXIgRXZlbnRzXCIgQVBJLlxuXG4vLyBTZXRzIHVwIHRoZSBnaXZlbiBlbGVtZW50IHRvIGJlIGNhbGxlZCB3aXRoIGEgVG91Y2hFdmVudCB0aGF0IHdlIHJlY29nbml6ZSBhcyBhIHRhcC5cbmZ1bmN0aW9uIHNldHVwVG91Y2hUYXBFdmVudHMoZWxlbWVudCwgY2FsbGJhY2spIHtcbiAgICB2YXIgdGltZW91dCA9IDQwMDsgLy8gVGhpcyBpcyB0aGUgdGltZSBiZXR3ZWVuIHRvdWNoc3RhcnQgYW5kIHRvdWNoZW5kIHRoYXQgd2UgdXNlIHRvIGRpc3Rpbmd1aXNoIGEgdGFwIGZyb20gYSBsb25nIHByZXNzLlxuICAgIHZhciB2YWxpZFRhcCA9IGZhbHNlO1xuICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRvdWNoU3RhcnQpO1xuICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgdG91Y2hNb3ZlKTtcbiAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoY2FuY2VsJywgdG91Y2hDYW5jZWwpO1xuICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCB0b3VjaEVuZCk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdGVhcmRvd246IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdG91Y2hTdGFydCk7XG4gICAgICAgICAgICBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIHRvdWNoTW92ZSk7XG4gICAgICAgICAgICBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoY2FuY2VsJywgdG91Y2hDYW5jZWwpO1xuICAgICAgICAgICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIHRvdWNoRW5kKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBmdW5jdGlvbiB0b3VjaFN0YXJ0KGV2ZW50KSB7XG4gICAgICAgIHZhbGlkVGFwID0gdHJ1ZTtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhbGlkVGFwID0gZmFsc2U7XG4gICAgICAgIH0sIHRpbWVvdXQpO1xuICAgIH1cbiAgICBmdW5jdGlvbiB0b3VjaEVuZChldmVudCkge1xuICAgICAgICBpZiAodmFsaWRUYXAgJiYgZXZlbnQuY2hhbmdlZFRvdWNoZXMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhldmVudCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gdG91Y2hNb3ZlKGV2ZW50KSB7XG4gICAgICAgIHZhbGlkVGFwID0gZmFsc2U7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHRvdWNoQ2FuY2VsKGV2ZW50KSB7XG4gICAgICAgIHZhbGlkVGFwID0gZmFsc2U7XG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgc2V0dXBUYXA6IHNldHVwVG91Y2hUYXBFdmVudHNcbn07IiwiXG5cbmZ1bmN0aW9uIHRvZ2dsZVRyYW5zaXRpb25DbGFzcygkZWxlbWVudCwgY2xhc3NOYW1lLCBzdGF0ZSwgbmV4dFN0ZXApIHtcbiAgICAkZWxlbWVudC5vbihcInRyYW5zaXRpb25lbmQgd2Via2l0VHJhbnNpdGlvbkVuZCBvVHJhbnNpdGlvbkVuZCBNU1RyYW5zaXRpb25FbmRcIixcbiAgICAgICAgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgIC8vIG9uY2UgdGhlIENTUyB0cmFuc2l0aW9uIGlzIGNvbXBsZXRlLCBjYWxsIG91ciBuZXh0IHN0ZXBcbiAgICAgICAgICAgIC8vIFNlZTogaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy85MjU1Mjc5L2NhbGxiYWNrLXdoZW4tY3NzMy10cmFuc2l0aW9uLWZpbmlzaGVzXG4gICAgICAgICAgICBpZiAoZXZlbnQudGFyZ2V0ID09IGV2ZW50LmN1cnJlbnRUYXJnZXQpIHtcbiAgICAgICAgICAgICAgICAkZWxlbWVudC5vZmYoXCJ0cmFuc2l0aW9uZW5kIHdlYmtpdFRyYW5zaXRpb25FbmQgb1RyYW5zaXRpb25FbmQgTVNUcmFuc2l0aW9uRW5kXCIpO1xuICAgICAgICAgICAgICAgIGlmIChuZXh0U3RlcCkge1xuICAgICAgICAgICAgICAgICAgICBuZXh0U3RlcCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICk7XG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gVGhpcyB3b3JrYXJvdW5kIGdldHMgdXMgY29uc2lzdGVudCB0cmFuc2l0aW9uZW5kIGV2ZW50cywgd2hpY2ggY2FuIG90aGVyd2lzZSBiZSBmbGFreSBpZiB3ZSdyZSBzZXR0aW5nIG90aGVyXG4gICAgICAgIC8vIGNsYXNzZXMgYXQgdGhlIHNhbWUgdGltZSBhcyB0cmFuc2l0aW9uIGNsYXNzZXMuXG4gICAgICAgICRlbGVtZW50LnRvZ2dsZUNsYXNzKGNsYXNzTmFtZSwgc3RhdGUpO1xuICAgIH0sIDIwKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgdG9nZ2xlQ2xhc3M6IHRvZ2dsZVRyYW5zaXRpb25DbGFzc1xufTsiLCJ2YXIgUFJPRF9TRVJWRVJfVVJMID0gXCJodHRwczovL3d3dy5hbnRlbm5hLmlzXCI7IC8vIFRPRE86IHd3dz8gaG93IGFib3V0IGFudGVubmEuaXMgb3IgYXBpLmFudGVubmEuaXM/XG52YXIgREVWX1NFUlZFUl9VUkwgPSBcImh0dHA6Ly9sb2NhbC1zdGF0aWMuYW50ZW5uYS5pczo4MDgxXCI7XG52YXIgVEVTVF9TRVJWRVJfVVJMID0gJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMSc7XG52YXIgQU1BWk9OX1MzX1VSTCA9ICcvL3MzLmFtYXpvbmF3cy5jb20vcmVhZHJib2FyZCc7XG5cbnZhciBQUk9EX0VWRU5UX1NFUlZFUl9VUkwgPSAnaHR0cDovL2V2ZW50cy5hbnRlbm5hLmlzJztcbnZhciBERVZfRVZFTlRfU0VSVkVSX1VSTCA9ICdodHRwOi8vbm9kZWJxLmRvY2tlcjozMDAwJztcblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIFBST0RVQ1RJT046IFBST0RfU0VSVkVSX1VSTCxcbiAgICBERVZFTE9QTUVOVDogREVWX1NFUlZFUl9VUkwsXG4gICAgVEVTVDogVEVTVF9TRVJWRVJfVVJMLFxuICAgIEFNQVpPTl9TMzogQU1BWk9OX1MzX1VSTCxcbiAgICBQUk9EVUNUSU9OX0VWRU5UUzogUFJPRF9FVkVOVF9TRVJWRVJfVVJMLFxuICAgIERFVkVMT1BNRU5UX0VWRU5UUzogREVWX0VWRU5UX1NFUlZFUl9VUkxcbn07IiwidmFyIEFwcE1vZGUgPSByZXF1aXJlKCcuL2FwcC1tb2RlJyk7XG52YXIgVVJMQ29uc3RhbnRzID0gcmVxdWlyZSgnLi91cmwtY29uc3RhbnRzJyk7XG5cbmZ1bmN0aW9uIGdldEdyb3VwU2V0dGluZ3NVcmwoKSB7XG4gICAgcmV0dXJuICcvYXBpL3NldHRpbmdzLyc7XG59XG5cbmZ1bmN0aW9uIGdldFBhZ2VEYXRhVXJsKCkge1xuICAgIHJldHVybiAnL2FwaS9wYWdlbmV3ZXIvJztcbn1cblxuZnVuY3Rpb24gZ2V0Q3JlYXRlUmVhY3Rpb25VcmwoKSB7XG4gICAgcmV0dXJuICcvYXBpL3RhZy9jcmVhdGUvJztcbn1cblxuZnVuY3Rpb24gZ2V0Q3JlYXRlQ29tbWVudFVybCgpIHtcbiAgICByZXR1cm4gJy9hcGkvY29tbWVudC9jcmVhdGUvJztcbn1cblxuZnVuY3Rpb24gZ2V0RmV0Y2hDb21tZW50VXJsKCkge1xuICAgIHJldHVybiAnL2FwaS9jb21tZW50L3JlcGxpZXMvJztcbn1cblxuZnVuY3Rpb24gZ2V0RmV0Y2hDb250ZW50Qm9kaWVzVXJsKCkge1xuICAgIHJldHVybiAnL2FwaS9jb250ZW50L2JvZGllcy8nO1xufVxuXG5mdW5jdGlvbiBnZXRTaGFyZVJlYWN0aW9uVXJsKCkge1xuICAgIHJldHVybiAnL2FwaS9zaGFyZS87J1xufVxuXG5mdW5jdGlvbiBnZXRTaGFyZVdpbmRvd1VybCgpIHtcbiAgICByZXR1cm4gJy9zdGF0aWMvc2hhcmUuaHRtbCc7XG59XG5cbmZ1bmN0aW9uIGdldEV2ZW50VXJsKCkge1xuICAgIHJldHVybiAnL2luc2VydCc7IC8vIE5vdGUgdGhhdCB0aGlzIFVSTCBpcyBmb3IgdGhlIGV2ZW50IHNlcnZlciwgbm90IHRoZSBhcHAgc2VydmVyLlxufVxuXG5mdW5jdGlvbiBnZXRMb2dpblBhZ2VVcmwoKSB7XG4gICAgcmV0dXJuICcvc3RhdGljL3dpZGdldC1uZXcvZmJfbG9naW4uaHRtbCc7XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVJbWFnZVVybCgkZWxlbWVudCwgZ3JvdXBTZXR0aW5ncykge1xuICAgIGlmIChncm91cFNldHRpbmdzLmxlZ2FjeUJlaGF2aW9yKCkpIHtcbiAgICAgICAgcmV0dXJuIGxlZ2FjeUNvbXB1dGVJbWFnZVVybCgkZWxlbWVudCk7XG4gICAgfVxuICAgIHZhciBjb250ZW50ID0gJGVsZW1lbnQuYXR0cignYW50LWl0ZW0tY29udGVudCcpIHx8ICRlbGVtZW50LmF0dHIoJ3NyYycpO1xuICAgIGlmIChjb250ZW50ICYmIGNvbnRlbnQuaW5kZXhPZignLy8nKSAhPT0gMCAmJiBjb250ZW50LmluZGV4T2YoJ2h0dHAnKSAhPT0gMCkgeyAvLyBwcm90b2NvbC1yZWxhdGl2ZSBvciBhYnNvbHV0ZSB1cmwsIGUuZy4gLy9kb21haW4uY29tL2Zvby9iYXIucG5nIG9yIGh0dHA6Ly9kb21haW4uY29tL2Zvby9iYXIvcG5nXG4gICAgICAgIGlmIChjb250ZW50LmluZGV4T2YoJy8nKSA9PT0gMCkgeyAvLyBkb21haW4tcmVsYXRpdmUgdXJsLCBlLmcuIC9mb28vYmFyLnBuZyA9PiBkb21haW4uY29tL2Zvby9iYXIucG5nXG4gICAgICAgICAgICBjb250ZW50ID0gd2luZG93LmxvY2F0aW9uLm9yaWdpbiArIGNvbnRlbnQ7XG4gICAgICAgIH0gZWxzZSB7IC8vIHBhdGgtcmVsYXRpdmUgdXJsLCBlLmcuIGJhci5wbmcgPT4gZG9tYWluLmNvbS9iYXovYmFyLnBuZ1xuICAgICAgICAgICAgdmFyIHBhdGggPSB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWU7XG4gICAgICAgICAgICB2YXIgaW5kZXggPSBwYXRoLmxhc3RJbmRleE9mKCcvJykgKyAxO1xuICAgICAgICAgICAgaWYgKHBhdGgubGVuZ3RoID4gaW5kZXgpIHtcbiAgICAgICAgICAgICAgICBwYXRoID0gcGF0aC5zdWJzdHJpbmcoMCwgaW5kZXgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29udGVudCA9IHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4gKyBwYXRoICsgY29udGVudDtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gY29udGVudDtcbn1cblxuLy8gTGVnYWN5IGltcGxlbWVudGF0aW9uIHdoaWNoIG1haW50YWlucyB0aGUgb2xkIGJlaGF2aW9yIG9mIGVuZ2FnZV9mdWxsXG4vLyBUaGlzIGNvZGUgaXMgd3JvbmcgZm9yIFVSTHMgdGhhdCBzdGFydCB3aXRoIFwiLy9cIi4gSXQgYWxzbyBnaXZlcyBwcmVjZWRlbmNlIHRvIHRoZSBzcmMgYXR0IGluc3RlYWQgb2YgYW50LWl0ZW0tY29udGVudFxuZnVuY3Rpb24gbGVnYWN5Q29tcHV0ZUltYWdlVXJsKCRlbGVtZW50KSB7XG4gICAgdmFyIGNvbnRlbnQgPSAkZWxlbWVudC5hdHRyKCdzcmMnKSB8fCAkZWxlbWVudC5hdHRyKCdhbnQtaXRlbS1jb250ZW50Jyk7XG4gICAgaWYgKGNvbnRlbnQpIHtcbiAgICAgICAgaWYgKGNvbnRlbnQuaW5kZXhPZignLycpID09PSAwKSB7XG4gICAgICAgICAgICBjb250ZW50ID0gd2luZG93LmxvY2F0aW9uLm9yaWdpbiArIGNvbnRlbnQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvbnRlbnQuaW5kZXhPZignaHR0cCcpICE9PSAwKSB7XG4gICAgICAgICAgICBjb250ZW50ID0gd2luZG93LmxvY2F0aW9uLm9yaWdpbiArIHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZSArIGNvbnRlbnQ7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGNvbnRlbnQ7XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVNZWRpYVVybCgkZWxlbWVudCwgZ3JvdXBTZXR0aW5ncykge1xuICAgIGlmIChncm91cFNldHRpbmdzLmxlZ2FjeUJlaGF2aW9yKCkpIHtcbiAgICAgICAgcmV0dXJuIGxlZ2FjeUNvbXB1dGVNZWRpYVVybCgkZWxlbWVudCk7XG4gICAgfVxuICAgIHZhciBjb250ZW50ID0gJGVsZW1lbnQuYXR0cignYW50LWl0ZW0tY29udGVudCcpIHx8ICRlbGVtZW50LmF0dHIoJ3NyYycpIHx8ICRlbGVtZW50LmF0dHIoJ2RhdGEnKTtcbiAgICBpZiAoY29udGVudCAmJiBjb250ZW50LmluZGV4T2YoJy8vJykgIT09IDAgJiYgY29udGVudC5pbmRleE9mKCdodHRwJykgIT09IDApIHsgLy8gcHJvdG9jb2wtcmVsYXRpdmUgb3IgYWJzb2x1dGUgdXJsLCBlLmcuIC8vZG9tYWluLmNvbS9mb28vYmFyLnBuZyBvciBodHRwOi8vZG9tYWluLmNvbS9mb28vYmFyL3BuZ1xuICAgICAgICBpZiAoY29udGVudC5pbmRleE9mKCcvJykgPT09IDApIHsgLy8gZG9tYWluLXJlbGF0aXZlIHVybCwgZS5nLiAvZm9vL2Jhci5wbmcgPT4gZG9tYWluLmNvbS9mb28vYmFyLnBuZ1xuICAgICAgICAgICAgY29udGVudCA9IHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4gKyBjb250ZW50O1xuICAgICAgICB9IGVsc2UgeyAvLyBwYXRoLXJlbGF0aXZlIHVybCwgZS5nLiBiYXIucG5nID0+IGRvbWFpbi5jb20vYmF6L2Jhci5wbmdcbiAgICAgICAgICAgIHZhciBwYXRoID0gd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lO1xuICAgICAgICAgICAgdmFyIGluZGV4ID0gcGF0aC5sYXN0SW5kZXhPZignLycpICsgMTtcbiAgICAgICAgICAgIGlmIChwYXRoLmxlbmd0aCA+IGluZGV4KSB7XG4gICAgICAgICAgICAgICAgcGF0aCA9IHBhdGguc3Vic3RyaW5nKDAsIGluZGV4KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnRlbnQgPSB3aW5kb3cubG9jYXRpb24ub3JpZ2luICsgcGF0aCArIGNvbnRlbnQ7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGNvbnRlbnQ7XG59XG5cbi8vIExlZ2FjeSBpbXBsZW1lbnRhdGlvbiB3aGljaCBtYWludGFpbnMgdGhlIG9sZCBiZWhhdmlvciBvZiBlbmdhZ2VfZnVsbFxuLy8gVGhpcyBjb2RlIGlzIHdyb25nIGZvciBVUkxzIHRoYXQgc3RhcnQgd2l0aCBcIi8vXCIuIEl0IGFsc28gZ2l2ZXMgcHJlY2VkZW5jZSB0byB0aGUgc3JjIGF0dCBpbnN0ZWFkIG9mIGFudC1pdGVtLWNvbnRlbnRcbmZ1bmN0aW9uIGxlZ2FjeUNvbXB1dGVNZWRpYVVybCgkZWxlbWVudCkge1xuICAgIHZhciBjb250ZW50ID0gJGVsZW1lbnQuYXR0cignYW50LWl0ZW0tY29udGVudCcpIHx8ICRlbGVtZW50LmF0dHIoJ3NyYycpIHx8ICRlbGVtZW50LmF0dHIoJ2RhdGEnKSB8fCAnJztcbiAgICBpZiAoY29udGVudCkge1xuICAgICAgICBpZiAoY29udGVudC5pbmRleE9mKCcvJykgPT09IDApIHtcbiAgICAgICAgICAgIGNvbnRlbnQgPSB3aW5kb3cubG9jYXRpb24ub3JpZ2luICsgY29udGVudDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY29udGVudC5pbmRleE9mKCdodHRwJykgIT09IDApIHtcbiAgICAgICAgICAgIGNvbnRlbnQgPSB3aW5kb3cubG9jYXRpb24ub3JpZ2luICsgd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lICsgY29udGVudDtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gY29udGVudDtcbn1cblxuZnVuY3Rpb24gYW1hem9uUzNVcmwoKSB7XG4gICAgcmV0dXJuIFVSTENvbnN0YW50cy5BTUFaT05fUzM7XG59XG5cbi8vIFRPRE86IHJlZmFjdG9yIHVzYWdlIG9mIGFwcCBzZXJ2ZXIgdXJsICsgcmVsYXRpdmUgcm91dGVzXG5mdW5jdGlvbiBhcHBTZXJ2ZXJVcmwoKSB7XG4gICAgaWYgKEFwcE1vZGUudGVzdCkge1xuICAgICAgICByZXR1cm4gVVJMQ29uc3RhbnRzLlRFU1Q7XG4gICAgfSBlbHNlIGlmIChBcHBNb2RlLm9mZmxpbmUpIHtcbiAgICAgICAgcmV0dXJuIFVSTENvbnN0YW50cy5ERVZFTE9QTUVOVDtcbiAgICB9XG4gICAgcmV0dXJuIFVSTENvbnN0YW50cy5QUk9EVUNUSU9OO1xufVxuXG4vLyBUT0RPOiByZWZhY3RvciB1c2FnZSBvZiBldmVudHMgc2VydmVyIHVybCArIHJlbGF0aXZlIHJvdXRlc1xuZnVuY3Rpb24gZXZlbnRzU2VydmVyVXJsKCkge1xuICAgIGlmIChBcHBNb2RlLm9mZmxpbmUpIHtcbiAgICAgICAgcmV0dXJuIFVSTENvbnN0YW50cy5ERVZFTE9QTUVOVF9FVkVOVFM7XG4gICAgfVxuICAgIHJldHVybiBVUkxDb25zdGFudHMuUFJPRFVDVElPTl9FVkVOVFM7XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBhcHBTZXJ2ZXJVcmw6IGFwcFNlcnZlclVybCxcbiAgICBldmVudHNTZXJ2ZXJVcmw6IGV2ZW50c1NlcnZlclVybCxcbiAgICBhbWF6b25TM1VybDogYW1hem9uUzNVcmwsXG4gICAgZ3JvdXBTZXR0aW5nc1VybDogZ2V0R3JvdXBTZXR0aW5nc1VybCxcbiAgICBwYWdlRGF0YVVybDogZ2V0UGFnZURhdGFVcmwsXG4gICAgY3JlYXRlUmVhY3Rpb25Vcmw6IGdldENyZWF0ZVJlYWN0aW9uVXJsLFxuICAgIGNyZWF0ZUNvbW1lbnRVcmw6IGdldENyZWF0ZUNvbW1lbnRVcmwsXG4gICAgZmV0Y2hDb21tZW50VXJsOiBnZXRGZXRjaENvbW1lbnRVcmwsXG4gICAgZmV0Y2hDb250ZW50Qm9kaWVzVXJsOiBnZXRGZXRjaENvbnRlbnRCb2RpZXNVcmwsXG4gICAgc2hhcmVSZWFjdGlvblVybDogZ2V0U2hhcmVSZWFjdGlvblVybCxcbiAgICBzaGFyZVdpbmRvd1VybDogZ2V0U2hhcmVXaW5kb3dVcmwsXG4gICAgbG9naW5QYWdlVXJsOiBnZXRMb2dpblBhZ2VVcmwsXG4gICAgY29tcHV0ZUltYWdlVXJsOiBjb21wdXRlSW1hZ2VVcmwsXG4gICAgY29tcHV0ZU1lZGlhVXJsOiBjb21wdXRlTWVkaWFVcmwsXG4gICAgZXZlbnRVcmw6IGdldEV2ZW50VXJsXG59O1xuIiwidmFyIEFwcE1vZGUgPSByZXF1aXJlKCcuL2FwcC1tb2RlJyk7XG52YXIgWERNQ2xpZW50ID0gcmVxdWlyZSgnLi94ZG0tY2xpZW50Jyk7XG5cbnZhciBjYWNoZWRVc2VySW5mbztcblxuLy8gRmV0Y2ggdGhlIGxvZ2dlZCBpbiB1c2VyLiBXaWxsIHRyaWdnZXIgYSBuZXR3b3JrIHJlcXVlc3QgdG8gY3JlYXRlIGEgdGVtcG9yYXJ5IHVzZXIgaWYgbmVlZGVkLlxuZnVuY3Rpb24gZmV0Y2hVc2VyKGNhbGxiYWNrKSB7XG4gICAgWERNQ2xpZW50LmZldGNoVXNlcihmdW5jdGlvbiAodXNlckluZm8pIHtcbiAgICAgICAgY2FjaGVkVXNlckluZm8gPSB1c2VySW5mbztcbiAgICAgICAgY2FsbGJhY2sodXNlckluZm8pO1xuICAgIH0pO1xufVxuXG4vLyBSZXR1cm5zIHRoZSBsb2dnZWQtaW4gdXNlciwgaWYgd2UgYWxyZWFkeSBoYXZlIG9uZS4gV2lsbCBub3QgdHJpZ2dlciBhIG5ldHdvcmsgcmVxdWVzdC5cbmZ1bmN0aW9uIGNhY2hlZFVzZXIoY2FsbGJhY2spIHtcbiAgICBjYWxsYmFjayhjYWNoZWRVc2VySW5mbyk7XG59XG5cbi8vIEF0dGVtcHRzIHRvIGNyZWF0ZSBhIG5ldyBhdXRob3JpemF0aW9uIHRva2VuIGZvciB0aGUgbG9nZ2VkLWluIHVzZXIuXG5mdW5jdGlvbiByZUF1dGhvcml6ZVVzZXIoY2FsbGJhY2spIHtcbiAgICB2YXIgb2xkVG9rZW4gPSBjYWNoZWRVc2VySW5mbyA/IGNhY2hlZFVzZXJJbmZvLmFudF90b2tlbiA6IHVuZGVmaW5lZDtcbiAgICBYRE1DbGllbnQucmVBdXRob3JpemVVc2VyKGZ1bmN0aW9uICh1c2VySW5mbykge1xuICAgICAgICBjYWNoZWRVc2VySW5mbyA9IHVzZXJJbmZvO1xuICAgICAgICB2YXIgaGFzTmV3VG9rZW4gPSB1c2VySW5mbyAmJiB1c2VySW5mby5hbnRfdG9rZW4gJiYgdXNlckluZm8uYW50X3Rva2VuICE9PSBvbGRUb2tlbjtcbiAgICAgICAgY2FsbGJhY2soaGFzTmV3VG9rZW4pO1xuICAgIH0pO1xufVxuXG4vLyBUT0RPOiBGaWd1cmUgb3V0IGhvdyBtYW55IGRpZmZlcmVudCBmb3JtYXRzIG9mIHVzZXIgZGF0YSB3ZSBoYXZlIGFuZCBlaXRoZXIgdW5pZnkgdGhlbSBvciBwcm92aWRlIGNsZWFyXG4vLyAgICAgICBBUEkgaGVyZSB0byB0cmFuc2xhdGUgZWFjaCB2YXJpYXRpb24gaW50byBzb21ldGhpbmcgc3RhbmRhcmQgZm9yIHRoZSBjbGllbnQuXG4vLyBUT0RPOiBIYXZlIFhETUNsaWVudCBwYXNzIHRocm91Z2ggdGhpcyBtb2R1bGUgYXMgd2VsbC5cbmZ1bmN0aW9uIHVzZXJGcm9tQ29tbWVudEpTT04oanNvblVzZXIsIHNvY2lhbFVzZXIpIHsgLy8gVGhpcyBmb3JtYXQgd29ya3MgZm9yIHRoZSB1c2VyIHJldHVybmVkIGZyb20gL2FwaS9jb21tZW50cy9yZXBsaWVzXG4gICAgdmFyIHVzZXIgPSB7fTtcbiAgICBpZiAoanNvblVzZXIudXNlcl9pZCkge1xuICAgICAgICB1c2VyLmlkID0ganNvblVzZXIudXNlcl9pZDtcbiAgICB9XG4gICAgaWYgKHNvY2lhbFVzZXIpIHtcbiAgICAgICAgdXNlci5pbWFnZVVSTCA9IHNvY2lhbFVzZXIuaW1nX3VybDtcbiAgICAgICAgdXNlci5uYW1lID0gc29jaWFsVXNlci5mdWxsX25hbWU7XG4gICAgfVxuICAgIGlmICghdXNlci5uYW1lKSB7XG4gICAgICAgIHVzZXIubmFtZSA9IGpzb25Vc2VyLmZpcnN0X25hbWUgPyAoanNvblVzZXIuZmlyc3RfbmFtZSArICcgJyArIGpzb25Vc2VyLmxhc3RfbmFtZSkgOiAnQW5vbnltb3VzJztcbiAgICB9XG4gICAgaWYgKCF1c2VyLmltYWdlVVJMKSB7XG4gICAgICAgIHVzZXIuaW1hZ2VVUkwgPSBhbm9ueW1vdXNJbWFnZVVSTCgpXG4gICAgfVxuICAgIHJldHVybiB1c2VyO1xufVxuXG5cbi8vIFRPRE86IFJldmlzaXQgdGhlIHVzZXIgdGhhdCB3ZSBwYXNzIGJhY2sgZm9yIG5ldyBjb21tZW50cy4gT3B0aW9ucyBhcmU6XG4vLyAgICAgICAxLiBVc2UgdGhlIGxvZ2dlZCBpbiB1c2VyLCBhc3N1bWluZyB0aGUgY2FjaGVkIHVzZXIgaGFzIHNvY2lhbF91c2VyIGluZm9cbi8vICAgICAgIDIuIFVzZSBhIGdlbmVyaWMgXCJ5b3VcIiByZXByZXNlbnRhdGlvbiBsaWtlIHdlJ3JlIGRvaW5nIG5vdy5cbi8vICAgICAgIDMuIERvbid0IHNob3cgYW55IGluZGljYXRpb24gb2YgdGhlIHVzZXIuIEp1c3Qgc2hvdyB0aGUgY29tbWVudC5cbi8vICAgICAgIEZvciBub3csIHRoaXMgaXMganVzdCBnaXZpbmcgdXMgc29tZSBub3Rpb24gb2YgdXNlciB3aXRob3V0IGEgcm91bmQgdHJpcC5cbmZ1bmN0aW9uIG9wdGltaXN0aWNDb21tZW50VXNlcigpIHtcbiAgICB2YXIgdXNlciA9IHtcbiAgICAgICAgbmFtZTogJ1lvdScsXG4gICAgICAgIGltYWdlVVJMOiBhbm9ueW1vdXNJbWFnZVVSTCgpXG4gICAgfTtcbiAgICByZXR1cm4gdXNlcjtcbn1cblxuZnVuY3Rpb24gYW5vbnltb3VzSW1hZ2VVUkwoKSB7XG4gICAgcmV0dXJuIEFwcE1vZGUub2ZmbGluZSA/ICcvc3RhdGljL3dpZGdldC9pbWFnZXMvYW5vbnltb3VzcGxvZGUucG5nJyA6ICdodHRwOi8vczMuYW1hem9uYXdzLmNvbS9yZWFkcmJvYXJkL3dpZGdldC9pbWFnZXMvYW5vbnltb3VzcGxvZGUucG5nJztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgZnJvbUNvbW1lbnRKU09OOiB1c2VyRnJvbUNvbW1lbnRKU09OLFxuICAgIG9wdGltaXN0aWNDb21tZW50VXNlcjogb3B0aW1pc3RpY0NvbW1lbnRVc2VyLFxuICAgIGZldGNoVXNlcjogZmV0Y2hVc2VyLFxuICAgIGNhY2hlZFVzZXI6IGNhY2hlZFVzZXIsXG4gICAgcmVBdXRob3JpemVVc2VyOiByZUF1dGhvcml6ZVVzZXJcbn07IiwidmFyIGlkID0gJ2FudGVubmEtd2lkZ2V0LWJ1Y2tldCc7XG5cbmZ1bmN0aW9uIGdldFdpZGdldEJ1Y2tldCgpIHtcbiAgICB2YXIgYnVja2V0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpO1xuICAgIGlmICghYnVja2V0KSB7XG4gICAgICAgIGJ1Y2tldCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBidWNrZXQuc2V0QXR0cmlidXRlKCdpZCcsIGlkKTtcbiAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChidWNrZXQpO1xuICAgIH1cbiAgICByZXR1cm4gYnVja2V0O1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgZ2V0OiBnZXRXaWRnZXRCdWNrZXQsXG4gICAgc2VsZWN0b3I6IGZ1bmN0aW9uKCkgeyByZXR1cm4gJyMnICsgaWQ7IH1cbn07IiwidmFyIENhbGxiYWNrU3VwcG9ydCA9IHJlcXVpcmUoJy4vY2FsbGJhY2stc3VwcG9ydCcpO1xudmFyIFhkbUxvYWRlciA9IHJlcXVpcmUoJy4veGRtLWxvYWRlcicpO1xuXG4vLyBSZWdpc3RlciBvdXJzZWx2ZXMgdG8gaGVhciBtZXNzYWdlc1xud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIHJlY2VpdmVNZXNzYWdlLCBmYWxzZSk7XG5cbnZhciByZXNwb25zZUhhbmRsZXJzID0ge307XG5cbmFkZFJlc3BvbnNlSGFuZGxlcigneGRtIGxvYWRlZCcsIHhkbUxvYWRlZCk7XG5cbmZ1bmN0aW9uIGFkZFJlc3BvbnNlSGFuZGxlcihtZXNzYWdlS2V5LCBjYWxsYmFjaykge1xuICAgIHZhciBoYW5kbGVycyA9IGdldFJlc3BvbnNlSGFuZGxlcnMobWVzc2FnZUtleSk7XG4gICAgaGFuZGxlcnMuYWRkKGNhbGxiYWNrKTtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlUmVzcG9uc2VIYW5kbGVyKG1lc3NhZ2VLZXksIGNhbGxiYWNrKSB7XG4gICAgdmFyIGhhbmRsZXJzID0gZ2V0UmVzcG9uc2VIYW5kbGVycyhtZXNzYWdlS2V5KTtcbiAgICBoYW5kbGVycy5yZW1vdmUoY2FsbGJhY2spO1xufVxuXG52YXIgaXNYRE1Mb2FkZWQgPSBmYWxzZTtcbi8vIFRoZSBpbml0aWFsIG1lc3NhZ2UgdGhhdCBYRE0gc2VuZHMgb3V0IHdoZW4gaXQgbG9hZHNcbmZ1bmN0aW9uIHhkbUxvYWRlZChkYXRhKSB7XG4gICAgaXNYRE1Mb2FkZWQgPSB0cnVlO1xufVxuXG5mdW5jdGlvbiBzZXRNZXNzYWdlSGFuZGxlcihtZXNzYWdlS2V5LCBjYWxsYmFjaykge1xuICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICBjYWxsYmFjay5wZXJzaXN0ZW50ID0gdHJ1ZTsgLy8gU2V0IHRoZSBmbGFnIHdoaWNoIHRlbGxzIHVzIHRoYXQgdGhpcyBpc24ndCBhIHR5cGljYWwgb25lLXRpbWUgY2FsbGJhY2suXG4gICAgfVxuICAgIGFkZFJlc3BvbnNlSGFuZGxlcihtZXNzYWdlS2V5LCBjYWxsYmFjayk7XG59XG5cbmZ1bmN0aW9uIGZldGNoVXNlcihjYWxsYmFjaykge1xuICAgIHBvc3RNZXNzYWdlKCdnZXRVc2VyJywgJ3NlbmRVc2VyJywgc3VjY2Vzcyk7XG5cbiAgICBmdW5jdGlvbiBzdWNjZXNzKHJlc3BvbnNlKSB7XG4gICAgICAgIHZhciB1c2VySW5mbyA9IHJlc3BvbnNlLmRldGFpbDtcbiAgICAgICAgY2FsbGJhY2sodXNlckluZm8pO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gcmVBdXRob3JpemVVc2VyKGNhbGxiYWNrKSB7XG4gICAgcG9zdE1lc3NhZ2UoJ3JlYXV0aFVzZXInLCAnc2VuZFVzZXInLCBzdWNjZXNzKTtcblxuICAgIGZ1bmN0aW9uIHN1Y2Nlc3MocmVzcG9uc2UpIHtcbiAgICAgICAgdmFyIHVzZXJJbmZvID0gcmVzcG9uc2UuZGV0YWlsO1xuICAgICAgICBjYWxsYmFjayh1c2VySW5mbyk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBnZXRSZXNwb25zZUhhbmRsZXJzKG1lc3NhZ2VLZXkpIHtcbiAgICB2YXIgaGFuZGxlcnMgPSByZXNwb25zZUhhbmRsZXJzW21lc3NhZ2VLZXldO1xuICAgIGlmICghaGFuZGxlcnMpIHtcbiAgICAgICAgaGFuZGxlcnMgPSBDYWxsYmFja1N1cHBvcnQuY3JlYXRlKCk7XG4gICAgICAgIHJlc3BvbnNlSGFuZGxlcnNbbWVzc2FnZUtleV0gPSBoYW5kbGVycztcbiAgICB9XG4gICAgcmV0dXJuIGhhbmRsZXJzO1xufVxuXG5mdW5jdGlvbiByZWNlaXZlTWVzc2FnZShldmVudCkge1xuICAgIHZhciBldmVudE9yaWdpbiA9IGV2ZW50Lm9yaWdpbjtcbiAgICBpZiAoZXZlbnRPcmlnaW4gPT09IFhkbUxvYWRlci5PUklHSU4pIHtcbiAgICAgICAgdmFyIHJlc3BvbnNlID0gZXZlbnQuZGF0YTtcbiAgICAgICAgLy8gVE9ETzogVGhlIGV2ZW50LnNvdXJjZSBwcm9wZXJ0eSBnaXZlcyB1cyB0aGUgc291cmNlIHdpbmRvdyBvZiB0aGUgbWVzc2FnZSBhbmQgY3VycmVudGx5IHRoZSBYRE0gZnJhbWUgZmlyZXMgb3V0XG4gICAgICAgIC8vIGV2ZW50cyB0aGF0IHdlIHJlY2VpdmUgYmVmb3JlIHdlIGV2ZXIgdHJ5IHRvIHBvc3QgYW55dGhpbmcuIFNvIHdlICpjb3VsZCogaG9sZCBvbnRvIHRoZSB3aW5kb3cgaGVyZSBhbmQgdXNlIGl0XG4gICAgICAgIC8vIGZvciBwb3N0aW5nIG1lc3NhZ2VzIHJhdGhlciB0aGFuIGxvb2tpbmcgZm9yIHRoZSBYRE0gZnJhbWUgb3Vyc2VsdmVzLiBOZWVkIHRvIGxvb2sgYXQgd2hpY2ggZXZlbnRzIHRoZSBYRE0gZnJhbWVcbiAgICAgICAgLy8gZmlyZXMgb3V0IHRvIGFsbCB3aW5kb3dzIGJlZm9yZSBiZWluZyBhc2tlZC4gQ3VycmVudGx5LCBpdCdzIG1vcmUgdGhhbiBcInhkbSBsb2FkZWRcIi4gV2h5P1xuICAgICAgICAvL3ZhciBzb3VyY2VXaW5kb3cgPSBldmVudC5zb3VyY2U7XG5cbiAgICAgICAgdmFyIG1lc3NhZ2VLZXkgPSByZXNwb25zZS5rZXk7XG4gICAgICAgIHZhciBoYW5kbGVycyA9IGdldFJlc3BvbnNlSGFuZGxlcnMobWVzc2FnZUtleSk7XG4gICAgICAgIHZhciBjYWxsYmFja3MgPSBoYW5kbGVycy5nZXQoKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjYWxsYmFja3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBjYWxsYmFjayA9IGNhbGxiYWNrc1tpXTtcbiAgICAgICAgICAgIGNhbGxiYWNrKHJlc3BvbnNlKTtcbiAgICAgICAgICAgIGlmICghY2FsbGJhY2sucGVyc2lzdGVudCkge1xuICAgICAgICAgICAgICAgIHJlbW92ZVJlc3BvbnNlSGFuZGxlcihtZXNzYWdlS2V5LCBjYWxsYmFjayk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIHBvc3RNZXNzYWdlKHNlbmRLZXksIHJlc3BvbnNlS2V5LCBjYWxsYmFjaykge1xuICAgIGlmIChpc1hETUxvYWRlZCkge1xuICAgICAgICB2YXIgeGRtRnJhbWUgPSBnZXRYRE1GcmFtZSgpO1xuICAgICAgICBpZiAoeGRtRnJhbWUpIHtcbiAgICAgICAgICAgIGFkZFJlc3BvbnNlSGFuZGxlcihyZXNwb25zZUtleSwgY2FsbGJhY2spO1xuICAgICAgICAgICAgeGRtRnJhbWUucG9zdE1lc3NhZ2Uoc2VuZEtleSwgWGRtTG9hZGVyLk9SSUdJTik7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZU1lc3NhZ2Uoc2VuZEtleSwgcmVzcG9uc2VLZXksIGNhbGxiYWNrKTtcbiAgICB9XG59XG5cbnZhciBtZXNzYWdlUXVldWUgPSBbXTtcbnZhciBtZXNzYWdlUXVldWVUaW1lcjtcblxuZnVuY3Rpb24gcXVldWVNZXNzYWdlKHNlbmRLZXksIHJlc3BvbnNlS2V5LCBjYWxsYmFjaykge1xuICAgIC8vIFRPRE86IFJldmlldyB0aGlzIGlkZWEuIFRoZSBtYWluIG1lc3NhZ2Ugd2UgcmVhbGx5IG5lZWQgdG8gcXVldWUgdXAgaXMgdGhlIGdldFVzZXIgcmVxdWVzdCBhcyBwYXJ0IG9mIHRoZSBcImdyb3VwIHNldHRpbmdzIGxvYWRlZFwiXG4gICAgLy8gZXZlbnQgd2hpY2ggZmlyZXMgdmVyeSBlYXJseSAocG9zc2libHkgXCJwYWdlIGRhdGEgbG9hZGVkXCIgdG9vKS4gQnV0IHdoYXQgYWJvdXQgdGhlIHJlc3Qgb2YgdGhlIHdpZGdldD8gU2hvdWxkIHdlIGV2ZW4gc2hvd1xuICAgIC8vIHRoZSByZWFjdGlvbiB3aW5kb3cgaWYgdGhlIFhETSBmcmFtZSBpc24ndCByZWFkeT8gT3Igc2hvdWxkIHRoZSB3aWRnZXQgd2FpdCB0byBiZWNvbWUgdmlzaWJsZSB1bnRpbCBYRE0gaXMgcmVhZHkgbGlrZSB0aGVcbiAgICAvLyB3YXkgaXQgd2FpdHMgZm9yIHBhZ2UgZGF0YSB0byBsb2FkP1xuICAgIG1lc3NhZ2VRdWV1ZS5wdXNoKHtzZW5kS2V5OiBzZW5kS2V5LCByZXNwb25zZUtleTogcmVzcG9uc2VLZXksIGNhbGxiYWNrOiBjYWxsYmFja30pO1xuICAgIGlmICghbWVzc2FnZVF1ZXVlVGltZXIpIHtcbiAgICAgICAgLy8gU3RhcnQgdGhlIHdhaXQuLi5cbiAgICAgICAgdmFyIHN0b3BUaW1lID0gRGF0ZS5ub3coKSArIDEwMDAwOyAvLyBHaXZlIHVwIGFmdGVyIDEwIHNlY29uZHNcbiAgICAgICAgbWVzc2FnZVF1ZXVlVGltZXIgPSBzZXRJbnRlcnZhbChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmIChpc1hETUxvYWRlZCB8fCBEYXRlLm5vdygpID4gc3RvcFRpbWUpIHtcbiAgICAgICAgICAgICAgICBjbGVhckludGVydmFsKG1lc3NhZ2VRdWV1ZVRpbWVyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpc1hETUxvYWRlZCkge1xuICAgICAgICAgICAgICAgIC8vIFRPRE86IENvbnNpZGVyIHRoZSB0aW1pbmcgaXNzdWUgd2hlcmUgbWVzc2FnZXMgY291bGQgc25lYWsgaW4gYW5kIGJlIHByb2Nlc3NlZCB3aGlsZSB0aGlzIGxvb3AgaXMgc2xlZXBpbmcuXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtZXNzYWdlUXVldWUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRlcXVldWVkID0gbWVzc2FnZVF1ZXVlW2ldO1xuICAgICAgICAgICAgICAgICAgICBwb3N0TWVzc2FnZShkZXF1ZXVlZC5zZW5kS2V5LCBkZXF1ZXVlZC5yZXNwb25zZUtleSwgZGVxdWV1ZWQuY2FsbGJhY2spO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBtZXNzYWdlUXVldWUgPSBbXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgNTApO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZ2V0WERNRnJhbWUoKSB7XG4gICAgLy8gVE9ETzogSXMgdGhpcyBhIHNlY3VyaXR5IHByb2JsZW0/IFdoYXQgcHJldmVudHMgc29tZW9uZSBmcm9tIHVzaW5nIHRoaXMgc2FtZSBuYW1lIGFuZCBpbnRlcmNlcHRpbmcgb3VyIG1lc3NhZ2VzP1xuICAgIHJldHVybiB3aW5kb3cuZnJhbWVzWydhbnQteGRtLWhpZGRlbiddO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBmZXRjaFVzZXI6IGZldGNoVXNlcixcbiAgICByZUF1dGhvcml6ZVVzZXI6IHJlQXV0aG9yaXplVXNlcixcbiAgICBzZXRNZXNzYWdlSGFuZGxlcjogc2V0TWVzc2FnZUhhbmRsZXIsXG4gICAgYWRkUmVzcG9uc2VIYW5kbGVyOiBhZGRSZXNwb25zZUhhbmRsZXIsXG4gICAgcmVtb3ZlUmVzcG9uc2VIYW5kbGVyOiByZW1vdmVSZXNwb25zZUhhbmRsZXJcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgQXBwTW9kZSA9IHJlcXVpcmUoJy4vYXBwLW1vZGUnKTtcbnZhciBVUkxDb25zdGFudHMgPSByZXF1aXJlKCcuL3VybC1jb25zdGFudHMnKTtcbnZhciBXaWRnZXRCdWNrZXQgPSByZXF1aXJlKCcuL3dpZGdldC1idWNrZXQnKTtcblxudmFyIFhETV9PUklHSU4gPSBBcHBNb2RlLm9mZmxpbmUgPyBVUkxDb25zdGFudHMuREVWRUxPUE1FTlQgOiBVUkxDb25zdGFudHMuUFJPRFVDVElPTjtcblxuZnVuY3Rpb24gY3JlYXRlWERNZnJhbWUoZ3JvdXBJZCkge1xuICAgIC8vQU5ULnNlc3Npb24ucmVjZWl2ZU1lc3NhZ2Uoe30sIGZ1bmN0aW9uKCkge1xuICAgIC8vICAgIEFOVC51dGlsLnVzZXJMb2dpblN0YXRlKCk7XG4gICAgLy99KTtcblxuICAgIHZhciBpZnJhbWVVcmwgPSBYRE1fT1JJR0lOICsgXCIvc3RhdGljL3dpZGdldC1uZXcveGRtLmh0bWxcIixcbiAgICBwYXJlbnRVcmwgPSB3aW5kb3cubG9jYXRpb24uaHJlZixcbiAgICBwYXJlbnRIb3N0ID0gd2luZG93LmxvY2F0aW9uLnByb3RvY29sICsgXCIvL1wiICsgd2luZG93LmxvY2F0aW9uLmhvc3QsXG4gICAgLy8gVE9ETzogUmVzdG9yZSB0aGUgYm9va21hcmtsZXQgYXR0cmlidXRlIG9uIHRoZSBpRnJhbWU/XG4gICAgLy9ib29rbWFya2xldCA9ICggQU5ULmVuZ2FnZVNjcmlwdFBhcmFtcy5ib29rbWFya2xldCApID8gXCJib29rbWFya2xldD10cnVlXCI6XCJcIixcbiAgICBib29rbWFya2xldCA9IFwiXCIsXG4gICAgLy8gVE9ETzogUmVzdG9yZSB0aGUgZ3JvdXBOYW1lIGF0dHJpYnV0ZS4gKFdoYXQgaXMgaXQgZm9yPylcbiAgICAkeGRtSWZyYW1lID0gJCgnPGlmcmFtZSBpZD1cImFudC14ZG0taGlkZGVuXCIgbmFtZT1cImFudC14ZG0taGlkZGVuXCIgc3JjPVwiJyArIGlmcmFtZVVybCArICc/cGFyZW50VXJsPScgKyBwYXJlbnRVcmwgKyAnJnBhcmVudEhvc3Q9JyArIHBhcmVudEhvc3QgKyAnJmdyb3VwX2lkPScrZ3JvdXBJZCsnXCIgd2lkdGg9XCIxXCIgaGVpZ2h0PVwiMVwiIHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGU7dG9wOi0xMDAwcHg7bGVmdDotMTAwMHB4O1wiIC8+Jyk7XG4gICAgLy8keGRtSWZyYW1lID0gJCgnPGlmcmFtZSBpZD1cImFudC14ZG0taGlkZGVuXCIgbmFtZT1cImFudC14ZG0taGlkZGVuXCIgc3JjPVwiJyArIGlmcmFtZVVybCArICc/cGFyZW50VXJsPScgKyBwYXJlbnRVcmwgKyAnJnBhcmVudEhvc3Q9JyArIHBhcmVudEhvc3QgKyAnJmdyb3VwX2lkPScrZ3JvdXBJZCsnJmdyb3VwX25hbWU9JytlbmNvZGVVUklDb21wb25lbnQoZ3JvdXBOYW1lKSsnJicrYm9va21hcmtsZXQrJ1wiIHdpZHRoPVwiMVwiIGhlaWdodD1cIjFcIiBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlO3RvcDotMTAwMHB4O2xlZnQ6LTEwMDBweDtcIiAvPicpO1xuICAgICQoV2lkZ2V0QnVja2V0LmdldCgpKS5hcHBlbmQoICR4ZG1JZnJhbWUgKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlWERNZnJhbWU6IGNyZWF0ZVhETWZyYW1lLFxuICAgIE9SSUdJTjogWERNX09SSUdJTlxufTsiLCJ2YXIgWERNQ2xpZW50ID0gcmVxdWlyZSgnLi91dGlscy94ZG0tY2xpZW50Jyk7XG52YXIgRXZlbnRzID0gcmVxdWlyZSgnLi9ldmVudHMnKTtcbnZhciBHcm91cFNldHRpbmdzID0gcmVxdWlyZSgnLi9ncm91cC1zZXR0aW5ncycpO1xudmFyIFBhZ2VEYXRhID0gcmVxdWlyZSgnLi9wYWdlLWRhdGEnKTtcblxuZnVuY3Rpb24gc3RhcnRMaXN0ZW5pbmcoKSB7XG4gICAgWERNQ2xpZW50LnNldE1lc3NhZ2VIYW5kbGVyKCdyZWNpcmNDbGljaycsIHJlY2lyY0NsaWNrZWQpO1xufVxuXG5mdW5jdGlvbiByZWNpcmNDbGlja2VkKHJlc3BvbnNlKSB7XG4gICAgdmFyIHJlYWN0aW9uSWQgPSByZXNwb25zZS5kZXRhaWwucmVmZXJyaW5nX2ludF9pZDtcbiAgICBnZXRQYWdlRGF0YShyZXNwb25zZS5kZXRhaWwucGFnZV9oYXNoLCBmdW5jdGlvbihwYWdlRGF0YSkge1xuICAgICAgICBFdmVudHMucG9zdFJlY2lyY0NsaWNrZWQocGFnZURhdGEsIHJlYWN0aW9uSWQsIEdyb3VwU2V0dGluZ3MuZ2V0KCkpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBnZXRQYWdlRGF0YShwYWdlSGFzaCwgY2FsbGJhY2spIHtcbiAgICBpZiAocGFnZUhhc2gpIHtcbiAgICAgICAgLy8gVGhpcyBtb2R1bGUgbG9hZHMgdmVyeSBlYXJseSBpbiB0aGUgYXBwIGxpZmVjeWNsZSBhbmQgbWF5IHJlY2VpdmUgZXZlbnRzIGZyb20gdGhlIFhETSBmcmFtZSBiZWZvcmUgcGFnZVxuICAgICAgICAvLyBkYXRhIGhhcyBiZWVuIGxvYWRlZC4gSG9sZCBvbnRvIGFueSBzdWNoIGV2ZW50cyB1bnRpbCB0aGUgcGFnZSBkYXRhIGxvYWRzIG9yIHdlIHRpbWVvdXQuXG4gICAgICAgIHZhciBtYXhXYWl0VGltZSA9IERhdGUubm93KCkgKyAxMDAwMDsgLy8gR2l2ZSB1cCBhZnRlciAxMCBzZWNvbmRzXG4gICAgICAgIHZhciBpbnRlcnZhbCA9IHNldEludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBwYWdlRGF0YSA9IFBhZ2VEYXRhLmdldFBhZ2VEYXRhKHBhZ2VIYXNoKTtcbiAgICAgICAgICAgIGlmIChwYWdlRGF0YSkge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKHBhZ2VEYXRhKTtcbiAgICAgICAgICAgICAgICBjbGVhckludGVydmFsKGludGVydmFsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChEYXRlLm5vdygpID4gbWF4V2FpdFRpbWUpIHtcbiAgICAgICAgICAgICAgICBjbGVhckludGVydmFsKGludGVydmFsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgNTApO1xuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgc3RhcnQ6IHN0YXJ0TGlzdGVuaW5nXG59OyIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hIGFudGVubmEtYXV0by1jdGFcIn0sXCJvXCI6XCJjc3NyZXNldFwiLFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWF1dG8tY3RhLWlubmVyXCIsXCJhbnQtY3RhLWZvclwiOlt7XCJ0XCI6MixcInJcIjpcImFudEl0ZW1JZFwifV19LFwiZlwiOlt7XCJ0XCI6OCxcInJcIjpcImxvZ29cIn0se1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtYXV0by1jdGEtbGFiZWxcIixcImFudC1yZWFjdGlvbnMtbGFiZWwtZm9yXCI6W3tcInRcIjoyLFwiclwiOlwiYW50SXRlbUlkXCJ9XX19LHtcInRcIjo0LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJhbnQtZXhwYW5kZWQtcmVhY3Rpb25zLWZvclwiOlt7XCJ0XCI6MixcInJcIjpcImFudEl0ZW1JZFwifV19fV0sXCJuXCI6NTAsXCJyXCI6XCJleHBhbmRSZWFjdGlvbnNcIn1dfV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1wYWdlIGFudGVubmEtYmxvY2tlZC1wYWdlXCJ9LFwib1wiOlwiY3NzcmVzZXRcIixcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1ib2R5XCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwidlwiOntcInRhcFwiOlwiYmFja1wifSxcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1ibG9ja2VkLWJhY2tcIn0sXCJmXCI6W3tcInRcIjo4LFwiclwiOlwibGVmdFwifSx7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJyZWFjdGlvbnNfd2lkZ2V0X19iYWNrXFxcIilcIn19XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1ibG9ja2VkLWJvZHlcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtYmxvY2tlZC1tZXNzYWdlXCJ9LFwiZlwiOlt7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJibG9ja2VkX3BhZ2VfX21lc3NhZ2UxXFxcIilcIn19XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1ibG9ja2VkLW1lc3NhZ2VcIn0sXCJmXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcImJsb2NrZWRfcGFnZV9fbWVzc2FnZTJcXFwiKVwifX1dfV19XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo0LFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcImNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbFwifV0sXCJuXCI6NTAsXCJ4XCI6e1wiclwiOltcImNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbFwiLFwiY29udGFpbmVyRGF0YS5sb2FkZWRcIl0sXCJzXCI6XCJfMCE9PXVuZGVmaW5lZCYmXzFcIn19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjQsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6W1wiYW50ZW5uYS1jdGEtZXhwYW5kZWQtcmVhY3Rpb24gXCIse1widFwiOjQsXCJmXCI6W1wiYW50ZW5uYS1jdGEtZXhwYW5kZWQtZmlyc3RcIl0sXCJuXCI6NTAsXCJ4XCI6e1wiclwiOltcIkBpbmRleFwiXSxcInNcIjpcIl8wPT09MFwifX1dfSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY3RhLWV4cGFuZGVkLXRleHRcIn0sXCJmXCI6W3tcInRcIjoyLFwiclwiOlwiLi90ZXh0XCJ9XX0se1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY3RhLWV4cGFuZGVkLWNvdW50XCJ9LFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcIi4vY291bnRcIn1dfV19XSxcInhcIjp7XCJyXCI6W1wiY29tcHV0ZUV4cGFuZGVkUmVhY3Rpb25zXCIsXCJjb250YWluZXJEYXRhLnJlYWN0aW9uc1wiXSxcInNcIjpcIl8wKF8xKVwifX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NCxcImZcIjpbe1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwiY2FsbF90b19hY3Rpb25fbGFiZWxfX3Jlc3BvbnNlc1xcXCIpXCJ9fV0sXCJuXCI6NTAsXCJ4XCI6e1wiclwiOltcImNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbFwiLFwiY29udGFpbmVyRGF0YS5sb2FkZWRcIl0sXCJzXCI6XCJfMD09PXVuZGVmaW5lZHx8IV8xXCJ9fSx7XCJ0XCI6NCxcIm5cIjo1MSxcImZcIjpbe1widFwiOjQsXCJuXCI6NTAsXCJ4XCI6e1wiclwiOltcImNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbFwiXSxcInNcIjpcIl8wPT09MVwifSxcImZcIjpbe1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwiY2FsbF90b19hY3Rpb25fbGFiZWxfX3Jlc3BvbnNlc19vbmVcXFwiKVwifX1dfSx7XCJ0XCI6NCxcIm5cIjo1MCxcInhcIjp7XCJyXCI6W1wiY29udGFpbmVyRGF0YS5yZWFjdGlvblRvdGFsXCJdLFwic1wiOlwiIShfMD09PTEpXCJ9LFwiZlwiOltcIiBcIix7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiLFwiY29udGFpbmVyRGF0YS5yZWFjdGlvblRvdGFsXCJdLFwic1wiOlwiXzAoXFxcImNhbGxfdG9fYWN0aW9uX2xhYmVsX19yZXNwb25zZXNfbWFueVxcXCIsW18xXSlcIn19XX1dLFwieFwiOntcInJcIjpbXCJjb250YWluZXJEYXRhLnJlYWN0aW9uVG90YWxcIixcImNvbnRhaW5lckRhdGEubG9hZGVkXCJdLFwic1wiOlwiXzA9PT11bmRlZmluZWR8fCFfMVwifX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWNvbW1lbnQtYXJlYVwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb21tZW50LXdpZGdldHNcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwidGV4dGFyZWFcIixcInZcIjp7XCJpbnB1dFwiOlwiaW5wdXRjaGFuZ2VkXCJ9LFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWNvbW1lbnQtaW5wdXRcIixcInBsYWNlaG9sZGVyXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcImNvbW1lbnRfYXJlYV9fcGxhY2Vob2xkZXJcXFwiKVwifX1dLFwibWF4bGVuZ3RoXCI6XCI1MDBcIn19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY29tbWVudC1mb290ZXJcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWNvbW1lbnQtbGltaXRcIn0sXCJmXCI6W3tcInRcIjozLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcImNvbW1lbnRfYXJlYV9fY291bnRcXFwiKVwifX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImJ1dHRvblwiLFwiYVwiOntcImlkXCI6XCJhbnRlbm5hLWNvbW1lbnQtc3BhY2VyXCJ9fSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImJ1dHRvblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWNvbW1lbnQtc3VibWl0XCJ9LFwidlwiOntcInRhcFwiOlwiYWRkY29tbWVudFwifSxcImZcIjpbe1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwiY29tbWVudF9hcmVhX19hZGRcXFwiKVwifX1dfV19XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb21tZW50LXdhaXRpbmdcIn0sXCJmXCI6W1wiLi4uXCJdfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWNvbW1lbnQtcmVjZWl2ZWRcIn0sXCJmXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcImNvbW1lbnRfYXJlYV9fdGhhbmtzXFxcIilcIn19XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcGFnZSBhbnRlbm5hLWNvbW1lbnRzLXBhZ2VcIn0sXCJvXCI6XCJjc3NyZXNldFwiLFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWJvZHlcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJ2XCI6e1widGFwXCI6XCJiYWNrXCJ9LFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWNvbW1lbnRzLWJhY2tcIn0sXCJmXCI6W3tcInRcIjo4LFwiclwiOlwibGVmdFwifSx7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJyZWFjdGlvbnNfd2lkZ2V0X19iYWNrXFxcIilcIn19XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb21tZW50cy1oZWFkZXJcIn0sXCJmXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCIsXCJjb21tZW50cy5sZW5ndGhcIl0sXCJzXCI6XCJfMChcXFwiY29tbWVudHNfcGFnZV9faGVhZGVyXFxcIixbXzFdKVwifX1dfSxcIiBcIix7XCJ0XCI6NCxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOltcImFudGVubmEtY29tbWVudC1lbnRyeSBcIix7XCJ0XCI6NCxcImZcIjpbXCJhbnRlbm5hLWNvbW1lbnQtbmV3XCJdLFwiblwiOjUwLFwiclwiOlwiLi9uZXdcIn1dfSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJ0YWJsZVwiLFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInRyXCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwidGRcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb21tZW50LWNlbGxcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiaW1nXCIsXCJhXCI6e1wic3JjXCI6W3tcInRcIjoyLFwiclwiOlwiLi91c2VyLmltYWdlVVJMXCJ9XX19XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJ0ZFwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWNvbW1lbnQtYXV0aG9yXCJ9LFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcIi4vdXNlci5uYW1lXCJ9XX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcInRyXCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwidGRcIixcImZcIjpbXX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJ0ZFwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWNvbW1lbnQtdGV4dFwifSxcImZcIjpbe1widFwiOjIsXCJyXCI6XCIuL3RleHRcIn1dfV19XX1dfV0sXCJpXCI6XCJpbmRleFwiLFwiclwiOlwiY29tbWVudHNcIn0sXCIgXCIse1widFwiOjgsXCJyXCI6XCJjb21tZW50QXJlYVwifV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXBhZ2UgYW50ZW5uYS1jb25maXJtYXRpb24tcGFnZVwifSxcIm9cIjpcImNzc3Jlc2V0XCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtYm9keVwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb21tZW50LXJlYWN0aW9uXCJ9LFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcInRleHRcIn1dfSxcIiBcIix7XCJ0XCI6OCxcInJcIjpcImNvbW1lbnRBcmVhXCJ9XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1mb290ZXIgYW50ZW5uYS1jb25maXJtLWZvb3RlclwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtc2hhcmVcIn0sXCJmXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcImNvbmZpcm1hdGlvbl9wYWdlX19zaGFyZVxcXCIpXCJ9fSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImFcIixcInZcIjp7XCJ0YXBcIjpcInNoYXJlLWZhY2Vib29rXCJ9LFwiYVwiOntcImhyZWZcIjpcIi8vZmFjZWJvb2suY29tXCJ9LFwiZlwiOlt7XCJ0XCI6OCxcInJcIjpcImZhY2Vib29rSWNvblwifV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiYVwiLFwidlwiOntcInRhcFwiOlwic2hhcmUtdHdpdHRlclwifSxcImFcIjp7XCJocmVmXCI6XCIvL3R3aXR0ZXIuY29tXCJ9LFwiZlwiOlt7XCJ0XCI6OCxcInJcIjpcInR3aXR0ZXJJY29uXCJ9XX1dfV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwidlwiOntcImtleWRvd25cIjpcInBhZ2VrZXlkb3duXCJ9LFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXBhZ2UgYW50ZW5uYS1kZWZhdWx0cy1wYWdlXCIsXCJ0YWJpbmRleFwiOlwiMFwifSxcIm9cIjpcImNzc3Jlc2V0XCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtYm9keVwifSxcImZcIjpbe1widFwiOjQsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJ2XCI6e1widGFwXCI6XCJuZXdyZWFjdGlvblwifSxcImFcIjp7XCJjbGFzc1wiOltcImFudGVubmEtcmVhY3Rpb24gXCIse1widFwiOjIsXCJ4XCI6e1wiclwiOltcImRlZmF1bHRMYXlvdXRDbGFzc1wiLFwiaW5kZXhcIl0sXCJzXCI6XCJfMChfMSlcIn19XX0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcmVhY3Rpb24tYm94XCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXJlYWN0aW9uLXRleHRcIn0sXCJvXCI6XCJzaXpldG9maXRcIixcImZcIjpbe1widFwiOjIsXCJyXCI6XCIuL3RleHRcIn1dfV19XX1dLFwiaVwiOlwiaW5kZXhcIixcInJcIjpcImRlZmF1bHRSZWFjdGlvbnNcIn1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWZvb3RlciBhbnRlbm5hLWRlZmF1bHRzLWZvb3RlclwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jdXN0b20tYXJlYVwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJpbnB1dFwiLFwidlwiOntcImZvY3VzXCI6XCJjdXN0b21mb2N1c1wiLFwia2V5ZG93blwiOlwiaW5wdXRrZXlkb3duXCIsXCJibHVyXCI6XCJjdXN0b21ibHVyXCJ9LFwiYVwiOntcInZhbHVlXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcImRlZmF1bHRzX3BhZ2VfX2FkZFxcXCIpXCJ9fV0sXCJtYXhsZW5ndGhcIjpcIjI1XCJ9fSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImJ1dHRvblwiLFwidlwiOntcInRhcFwiOlwibmV3Y3VzdG9tXCJ9LFwiZlwiOlt7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJkZWZhdWx0c19wYWdlX19va1xcXCIpXCJ9fV19XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS10ZXh0LWxvZ29cIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiYVwiLFwiYVwiOntcImhyZWZcIjpcIi8vd3d3LmFudGVubmEuaXNcIn0sXCJmXCI6W1wiQW50ZW5uYVwiXX1dfV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXBhZ2UgYW50ZW5uYS1lcnJvci1wYWdlXCJ9LFwib1wiOlwiY3NzcmVzZXRcIixcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1ib2R5XCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwidlwiOntcInRhcFwiOlwiYmFja1wifSxcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1lcnJvci1iYWNrXCJ9LFwiZlwiOlt7XCJ0XCI6OCxcInJcIjpcImxlZnRcIn0se1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwicmVhY3Rpb25zX3dpZGdldF9fYmFja1xcXCIpXCJ9fV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtZXJyb3ItYm9keVwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1lcnJvci1tZXNzYWdlXCJ9LFwiZlwiOlt7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJlcnJvcl9wYWdlX19tZXNzYWdlXFxcIilcIn19XX1dfV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXBhZ2UgYW50ZW5uYS1sb2NhdGlvbnMtcGFnZVwifSxcIm9cIjpcImNzc3Jlc2V0XCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtYm9keVwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcInZcIjp7XCJ0YXBcIjpcImJhY2tcIn0sXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtbG9jYXRpb25zLWJhY2tcIn0sXCJmXCI6W3tcInRcIjo4LFwiclwiOlwibGVmdFwifSx7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJyZWFjdGlvbnNfd2lkZ2V0X19iYWNrXFxcIilcIn19XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJ0YWJsZVwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxvY2F0aW9ucy10YWJsZVwifSxcImZcIjpbe1widFwiOjQsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwidHJcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1sb2NhdGlvbnMtY29udGVudC1yb3dcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwidGRcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1sb2NhdGlvbnMtY291bnQtY2VsbFwifSxcImZcIjpbe1widFwiOjQsXCJmXCI6W3tcInRcIjozLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcImxvY2F0aW9uc19wYWdlX19jb3VudF9vbmVcXFwiKVwifX1dLFwiblwiOjUwLFwieFwiOntcInJcIjpbXCJwYWdlUmVhY3Rpb25Db3VudFwiXSxcInNcIjpcIl8wPT09MVwifX0se1widFwiOjQsXCJuXCI6NTEsXCJmXCI6W3tcInRcIjozLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCIsXCJwYWdlUmVhY3Rpb25Db3VudFwiXSxcInNcIjpcIl8wKFxcXCJsb2NhdGlvbnNfcGFnZV9fY291bnRfbWFueVxcXCIsW18xXSlcIn19XSxcInhcIjp7XCJyXCI6W1wicGFnZVJlYWN0aW9uQ291bnRcIl0sXCJzXCI6XCJfMD09PTFcIn19XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJ0ZFwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxvY2F0aW9ucy1wYWdlLWJvZHlcIn0sXCJmXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcImxvY2F0aW9uc19wYWdlX19wYWdlbGV2ZWxcXFwiKVwifX1dfV19XSxcIm5cIjo1MCxcInJcIjpcInBhZ2VSZWFjdGlvbkNvdW50XCJ9LFwiIFwiLHtcInRcIjo0LFwiZlwiOlt7XCJ0XCI6NCxcImZcIjpbXCIgXCIse1widFwiOjcsXCJlXCI6XCJ0clwiLFwidlwiOntcInRhcFwiOlwicmV2ZWFsXCJ9LFwiYVwiOntcImNsYXNzXCI6W1wiYW50ZW5uYS1sb2NhdGlvbnMtY29udGVudC1yb3cgXCIse1widFwiOjQsXCJmXCI6W1wiYW50ZW5uYS1sb2NhdGVcIl0sXCJuXCI6NTAsXCJ4XCI6e1wiclwiOltcImNhbkxvY2F0ZVwiLFwiLi9jb250YWluZXJIYXNoXCJdLFwic1wiOlwiXzAoXzEpXCJ9fV19LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInRkXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtbG9jYXRpb25zLWNvdW50LWNlbGxcIn0sXCJmXCI6W3tcInRcIjo0LFwiZlwiOlt7XCJ0XCI6MyxcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJsb2NhdGlvbnNfcGFnZV9fY291bnRfb25lXFxcIilcIn19XSxcIm5cIjo1MCxcInhcIjp7XCJyXCI6W1wiLi9jb3VudFwiXSxcInNcIjpcIl8wPT09MVwifX0se1widFwiOjQsXCJuXCI6NTEsXCJmXCI6W3tcInRcIjozLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCIsXCIuL2NvdW50XCJdLFwic1wiOlwiXzAoXFxcImxvY2F0aW9uc19wYWdlX19jb3VudF9tYW55XFxcIixbXzFdKVwifX1dLFwieFwiOntcInJcIjpbXCIuL2NvdW50XCJdLFwic1wiOlwiXzA9PT0xXCJ9fV19LFwiIFwiLHtcInRcIjo0LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInRkXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtbG9jYXRpb25zLXRleHQtYm9keVwifSxcImZcIjpbe1widFwiOjIsXCJyXCI6XCIuL2JvZHlcIn1dfV0sXCJuXCI6NTAsXCJ4XCI6e1wiclwiOltcIi4va2luZFwiXSxcInNcIjpcIl8wPT09XFxcInR4dFxcXCJcIn19LHtcInRcIjo0LFwiblwiOjUxLFwiZlwiOlt7XCJ0XCI6NCxcIm5cIjo1MCxcInhcIjp7XCJyXCI6W1wiLi9raW5kXCJdLFwic1wiOlwiXzA9PT1cXFwiaW1nXFxcIlwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJ0ZFwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxvY2F0aW9ucy1pbWFnZS1ib2R5XCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImltZ1wiLFwiYVwiOntcInNyY1wiOlt7XCJ0XCI6MixcInJcIjpcIi4vYm9keVwifV19fV19XX0se1widFwiOjQsXCJuXCI6NTAsXCJ4XCI6e1wiclwiOltcIi4va2luZFwiXSxcInNcIjpcIighKF8wPT09XFxcImltZ1xcXCIpKSYmKF8wPT09XFxcIm1lZFxcXCIpXCJ9LFwiZlwiOltcIiBcIix7XCJ0XCI6NyxcImVcIjpcInRkXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtbG9jYXRpb25zLW1lZGlhLWJvZHlcIn0sXCJmXCI6W3tcInRcIjo4LFwiclwiOlwiZmlsbVwifSx7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1sb2NhdGlvbnMtdmlkZW9cIn0sXCJmXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcImxvY2F0aW9uc19wYWdlX192aWRlb1xcXCIpXCJ9fV19XX1dfSx7XCJ0XCI6NCxcIm5cIjo1MCxcInhcIjp7XCJyXCI6W1wiLi9raW5kXCJdLFwic1wiOlwiKCEoXzA9PT1cXFwiaW1nXFxcIikpJiYoIShfMD09PVxcXCJtZWRcXFwiKSlcIn0sXCJmXCI6W1wiIFwiLHtcInRcIjo3LFwiZVwiOlwidGRcIixcImZcIjpbXCLCoFwiXX1dfV0sXCJ4XCI6e1wiclwiOltcIi4va2luZFwiXSxcInNcIjpcIl8wPT09XFxcInR4dFxcXCJcIn19XX1dLFwiblwiOjUwLFwieFwiOntcInJcIjpbXCIuL2tpbmRcIl0sXCJzXCI6XCJfMCE9PVxcXCJwYWdcXFwiXCJ9fV0sXCJpXCI6XCJpZFwiLFwiclwiOlwibG9jYXRpb25EYXRhXCJ9XX1dfV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1wYWdlIGFudGVubmEtbG9naW4tcGFnZVwifSxcIm9cIjpcImNzc3Jlc2V0XCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtYm9keVwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcInZcIjp7XCJ0YXBcIjpcImJhY2tcIn0sXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtbG9naW4tYmFja1wifSxcImZcIjpbe1widFwiOjgsXCJyXCI6XCJsZWZ0XCJ9LHtcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcInJlYWN0aW9uc193aWRnZXRfX2JhY2tcXFwiKVwifX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxvZ2luLWNvbnRhaW5lclwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJpZnJhbWVcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1sb2dpbi1pZnJhbWVcIixcInNyY1wiOlt7XCJ0XCI6MixcInJcIjpcImxvZ2luUGFnZVVybFwifV0sXCJzZWFtbGVzc1wiOjB9fV19XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwib1wiOlwiY3NzcmVzZXRcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYSBhbnRlbm5hLW1lZGlhLWluZGljYXRvci13cmFwcGVyXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOltcImFudGVubmEgYW50ZW5uYS1tZWRpYS1pbmRpY2F0b3Itd2lkZ2V0IFwiLHtcInRcIjo0LFwiZlwiOltcImFudGVubmEtbm90bG9hZGVkXCJdLFwiblwiOjUxLFwiclwiOlwiY29udGFpbmVyRGF0YS5sb2FkZWRcIn1dfSxcIm1cIjpbe1widFwiOjIsXCJyXCI6XCJleHRyYUF0dHJpYnV0ZXNcIn1dLFwiZlwiOlt7XCJ0XCI6OCxcInJcIjpcImxvZ29cIn0sXCIgXCIse1widFwiOjQsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXJlYWN0aW9uLXRvdGFsXCJ9LFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcImNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbFwifV19XSxcIm5cIjo1MCxcInJcIjpcImNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbFwifSx7XCJ0XCI6NCxcIm5cIjo1MSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcmVhY3Rpb24tcHJvbXB0XCJ9LFwiZlwiOlt7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJtZWRpYV9pbmRpY2F0b3JfX3RoaW5rXFxcIilcIn19XX1dLFwiclwiOlwiY29udGFpbmVyRGF0YS5yZWFjdGlvblRvdGFsXCJ9XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcGFnZSBhbnRlbm5hLXBlbmRpbmctcGFnZVwifSxcIm9cIjpcImNzc3Jlc2V0XCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtYm9keVwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1wZW5kaW5nLXJlYWN0aW9uXCJ9LFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcInRleHRcIn1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXBlbmRpbmctbWVzc2FnZVwifSxcImZcIjpbe1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwicGVuZGluZ19wYWdlX19tZXNzYWdlX2FwcGVhclxcXCIpXCJ9fV19XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcG9wdXBcIn0sXCJvXCI6XCJjc3NyZXNldFwiLFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXBvcHVwLWJvZHlcIn0sXCJmXCI6W3tcInRcIjo4LFwiclwiOlwibG9nb1wifSx7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1wb3B1cC10ZXh0XCJ9LFwiZlwiOlt7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJwb3B1cF93aWRnZXRfX3RoaW5rXFxcIilcIn19XX1dfV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1wYWdlIGFudGVubmEtcmVhY3Rpb25zLXBhZ2VcIn0sXCJvXCI6XCJjc3NyZXNldFwiLFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWJvZHlcIn0sXCJmXCI6W3tcInRcIjo0LFwiZlwiOlt7XCJ0XCI6NCxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcInZcIjp7XCJ0YXBcIjpcInBsdXNvbmVcIixcIm1vdXNlZW50ZXJcIjpcImhpZ2hsaWdodFwiLFwibW91c2VsZWF2ZVwiOlwiY2xlYXJoaWdobGlnaHRzXCJ9LFwiYVwiOntcImNsYXNzXCI6W1wiYW50ZW5uYS1yZWFjdGlvbiBcIix7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wicmVhY3Rpb25zTGF5b3V0Q2xhc3NcIixcImluZGV4XCIsXCIuL2NvdW50XCJdLFwic1wiOlwiXzAoXzEsXzIpXCJ9fV19LFwiZlwiOltcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXJlYWN0aW9uLWJveFwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1yZWFjdGlvbi10ZXh0XCJ9LFwib1wiOlwic2l6ZXRvZml0XCIsXCJmXCI6W3tcInRcIjoyLFwiclwiOlwiLi90ZXh0XCJ9XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1yZWFjdGlvbi1jb3VudFwifSxcImZcIjpbe1widFwiOjIsXCJyXCI6XCIuL2NvdW50XCJ9XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1wbHVzb25lXCJ9LFwiZlwiOltcIisxXCJdfSxcIiBcIix7XCJ0XCI6NCxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcInZcIjp7XCJ0YXBcIjpcInNob3dsb2NhdGlvbnNcIn0sXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcmVhY3Rpb24tbG9jYXRpb25cIn0sXCJmXCI6W3tcInRcIjo4LFwiclwiOlwibG9jYXRpb25JY29uXCJ9XX1dLFwiblwiOjUwLFwiclwiOlwiaXNTdW1tYXJ5XCJ9LHtcInRcIjo0LFwiblwiOjUxLFwiZlwiOlt7XCJ0XCI6NCxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcInZcIjp7XCJ0YXBcIjpcInNob3djb21tZW50c1wifSxcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1yZWFjdGlvbi1jb21tZW50cyBoYXNjb21tZW50c1wifSxcImZcIjpbe1widFwiOjgsXCJyXCI6XCJjb21tZW50c0ljb25cIn0sXCIgXCIse1widFwiOjIsXCJyXCI6XCIuL2NvbW1lbnRDb3VudFwifV19XSxcIm5cIjo1MCxcInJcIjpcIi4vY29tbWVudENvdW50XCJ9LHtcInRcIjo0LFwiblwiOjUxLFwiZlwiOlt7XCJ0XCI6NCxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1yZWFjdGlvbi1jb21tZW50c1wifSxcImZcIjpbe1widFwiOjgsXCJyXCI6XCJjb21tZW50c0ljb25cIn1dfV0sXCJuXCI6NTAsXCJ4XCI6e1wiclwiOltcImhpZGVDb21tZW50SW5wdXRcIl0sXCJzXCI6XCIhXzBcIn19XSxcInJcIjpcIi4vY29tbWVudENvdW50XCJ9XSxcInJcIjpcImlzU3VtbWFyeVwifV19XX1dLFwiaVwiOlwiaW5kZXhcIixcInJcIjpcInJlYWN0aW9uc1wifV0sXCJuXCI6NTAsXCJyXCI6XCJyZWFjdGlvbnNcIn1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWZvb3RlciBhbnRlbm5hLXJlYWN0aW9ucy1mb290ZXJcIn0sXCJmXCI6W3tcInRcIjo0LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwidlwiOntcInRhcFwiOlwic2hvd2RlZmF1bHRcIn0sXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtdGhpbmtcIn0sXCJmXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcInJlYWN0aW9uc19wYWdlX190aGlua1xcXCIpXCJ9fV19XSxcIm5cIjo1MCxcInJcIjpcInJlYWN0aW9uc1wifSx7XCJ0XCI6NCxcIm5cIjo1MSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1uby1yZWFjdGlvbnNcIn0sXCJmXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcInJlYWN0aW9uc19wYWdlX19ub19yZWFjdGlvbnNcXFwiKVwifX1dfV0sXCJyXCI6XCJyZWFjdGlvbnNcIn0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS10ZXh0LWxvZ29cIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiYVwiLFwiYVwiOntcImhyZWZcIjpcIi8vd3d3LmFudGVubmEuaXNcIixcInRhcmdldFwiOlwiX2JsYW5rXCJ9LFwiZlwiOltcIkFudGVubmFcIl19XX1dfV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOltcImFudGVubmEgYW50ZW5uYS1yZWFjdGlvbnMtd2lkZ2V0IFwiLHtcInRcIjo0LFwiZlwiOltcImFudGVubmEtdG91Y2hcIl0sXCJuXCI6NTAsXCJyXCI6XCJzdXBwb3J0c1RvdWNoXCJ9XSxcInRhYmluZGV4XCI6XCIwXCJ9LFwib1wiOlwiY3NzcmVzZXRcIixcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1oZWFkZXJcIn0sXCJmXCI6W3tcInRcIjo4LFwiclwiOlwibG9nb1wifSx7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1yZWFjdGlvbnMtdGl0bGVcIn0sXCJmXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcInJlYWN0aW9uc193aWRnZXRfX3RpdGxlXFxcIilcIn19XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJ2XCI6e1widGFwXCI6XCJjbG9zZVwifSxcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1yZWFjdGlvbnMtY2xvc2VcIn0sXCJmXCI6W1wiWFwiXX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXBhZ2UtY29udGFpbmVyXCJ9LFwiZlwiOltcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXByb2dyZXNzLXBhZ2UgYW50ZW5uYS1wYWdlXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWJvZHlcIn0sXCJmXCI6W119LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcHJvZ3Jlc3Mtc3Bpbm5lclwifSxcImZcIjpbe1widFwiOjgsXCJyXCI6XCJsb2dvXCJ9XX1dfV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6W1wiYW50ZW5uYSBhbnRlbm5hLXN1bW1hcnktd2lkZ2V0IFwiLHtcInRcIjo0LFwiZlwiOltcImFudGVubmEtbm90bG9hZGVkXCJdLFwiblwiOjUxLFwiclwiOlwicGFnZURhdGEuc3VtbWFyeUxvYWRlZFwifV19LFwib1wiOlwiY3NzcmVzZXRcIixcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1zdW1tYXJ5LWlubmVyXCJ9LFwiZlwiOlt7XCJ0XCI6OCxcInJcIjpcImxvZ29cIn0se1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtc3VtbWFyeS10aXRsZVwifSxcImZcIjpbXCIgXCIse1widFwiOjQsXCJmXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcInN1bW1hcnlfd2lkZ2V0X19yZWFjdGlvbnNcXFwiKVwifX1dLFwiblwiOjUwLFwieFwiOntcInJcIjpbXCJwYWdlRGF0YS5zdW1tYXJ5VG90YWxcIl0sXCJzXCI6XCJfMD09PTBcIn19LHtcInRcIjo0LFwiblwiOjUxLFwiZlwiOlt7XCJ0XCI6NCxcIm5cIjo1MCxcInhcIjp7XCJyXCI6W1wicGFnZURhdGEuc3VtbWFyeVRvdGFsXCJdLFwic1wiOlwiXzA9PT0xXCJ9LFwiZlwiOlt7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJzdW1tYXJ5X3dpZGdldF9fcmVhY3Rpb25zX29uZVxcXCIpXCJ9fV19LHtcInRcIjo0LFwiblwiOjUwLFwieFwiOntcInJcIjpbXCJwYWdlRGF0YS5zdW1tYXJ5VG90YWxcIl0sXCJzXCI6XCIhKF8wPT09MSlcIn0sXCJmXCI6W1wiIFwiLHtcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCIsXCJwYWdlRGF0YS5zdW1tYXJ5VG90YWxcIl0sXCJzXCI6XCJfMChcXFwic3VtbWFyeV93aWRnZXRfX3JlYWN0aW9uc19tYW55XFxcIixbXzFdKVwifX1dfV0sXCJ4XCI6e1wiclwiOltcInBhZ2VEYXRhLnN1bW1hcnlUb3RhbFwiXSxcInNcIjpcIl8wPT09MFwifX1dfSx7XCJ0XCI6NCxcImZcIjpbXCIgXCIse1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpbXCJhbnRlbm5hLWV4cGFuZGVkLXJlYWN0aW9uIFwiLHtcInRcIjo0LFwiZlwiOltcImFudGVubmEtZXhwYW5kZWQtZmlyc3RcIl0sXCJuXCI6NTAsXCJ4XCI6e1wiclwiOltcIkBpbmRleFwiXSxcInNcIjpcIl8wPT09MFwifX1dfSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtZXhwYW5kZWQtdGV4dFwifSxcImZcIjpbe1widFwiOjIsXCJyXCI6XCIuL3RleHRcIn1dfSx7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1leHBhbmRlZC1jb3VudFwifSxcImZcIjpbe1widFwiOjIsXCJyXCI6XCIuL2NvdW50XCJ9XX1dfV0sXCJ4XCI6e1wiclwiOltcImNvbXB1dGVFeHBhbmRlZFJlYWN0aW9uc1wiLFwicGFnZURhdGEuc3VtbWFyeVJlYWN0aW9uc1wiXSxcInNcIjpcIl8wKF8xKVwifX1dfV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY29tbWVudHNcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3ZnXCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwidXNlXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY29tbWVudHMtcGF0aFwiLFwieGxpbms6aHJlZlwiOlwiI2FudGVubmEtc3ZnLWNvbW1lbnRcIn19XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWZhY2Vib29rXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInN2Z1wiLFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInVzZVwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWZhY2Vib29rLXBhdGhcIixcInhsaW5rOmhyZWZcIjpcIiNhbnRlbm5hLXN2Zy1mYWNlYm9va1wifX1dfV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtZmlsbVwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJzdmdcIixcImZcIjpbe1widFwiOjcsXCJlXCI6XCJ1c2VcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1maWxtLXBhdGhcIixcInhsaW5rOmhyZWZcIjpcIiNhbnRlbm5hLXN2Zy1maWxtXCJ9fV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1sZWZ0XCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInN2Z1wiLFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInVzZVwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxlZnQtcGF0aFwiLFwieGxpbms6aHJlZlwiOlwiI2FudGVubmEtc3ZnLWxlZnRcIn19XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxvY2F0aW9uXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInN2Z1wiLFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInVzZVwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxvY2F0aW9uLXBhdGhcIixcInhsaW5rOmhyZWZcIjpcIiNhbnRlbm5hLXN2Zy1zZWFyY2hcIn19XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxvZ29cIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3ZnXCIsXCJhXCI6e1widmlld0JveFwiOlwiMCAwIDUxMiA1MTJcIn0sXCJmXCI6W1wiIFwiLHtcInRcIjo3LFwiZVwiOlwicGF0aFwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxvZ28tcGF0aFwiLFwiZFwiOlwibTI4MyA1MTBjMTI1LTE3IDIyOS0xMjQgMjI5LTI1MyAwLTE0MS0xMTUtMjU2LTI1Ni0yNTYtMTQxIDAtMjU2IDExNS0yNTYgMjU2IDAgMTMwIDEwOCAyMzcgMjMzIDI1NGwwLTE0OWMtNDgtMTQtODQtNTAtODQtMTAyIDAtNjUgNDMtMTEzIDEwOC0xMTMgNjUgMCAxMDcgNDggMTA3IDExMyAwIDUyLTMzIDg4LTgxIDEwMnpcIn19XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxvZ29cIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3ZnXCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwidXNlXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtbG9nby1wYXRoXCIsXCJ4bGluazpocmVmXCI6XCIjYW50ZW5uYS1zdmctbG9nb1wifX1dfV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtdHdpdHRlclwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJzdmdcIixcImZcIjpbe1widFwiOjcsXCJlXCI6XCJ1c2VcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS10d2l0dGVyLXBhdGhcIixcInhsaW5rOmhyZWZcIjpcIiNhbnRlbm5hLXN2Zy10d2l0dGVyXCJ9fV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcInN2Z1wiLFwiYVwiOntcInhtbG5zXCI6XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLFwic3R5bGVcIjpcImRpc3BsYXk6IG5vbmU7XCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInN5bWJvbFwiLFwiYVwiOntcImlkXCI6XCJhbnRlbm5hLXN2Zy10d2l0dGVyXCIsXCJ2aWV3Qm94XCI6XCIwIDAgNTEyIDUxMlwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJwYXRoXCIsXCJhXCI6e1wiZFwiOlwibTQ1MyAxMzRjLTE0IDYtMzAgMTEtNDYgMTJjMTYtMTAgMjktMjUgMzUtNDRjLTE1IDktMzMgMTYtNTEgMTljLTE1LTE1LTM2LTI1LTU5LTI1Yy00NSAwLTgxIDM2LTgxIDgxYzAgNiAxIDEyIDIgMThjLTY3LTMtMTI3LTM1LTE2Ny04NGMtNyAxMi0xMSAyNS0xMSA0MGMwIDI4IDE1IDUzIDM2IDY4Yy0xMy0xLTI1LTQtMzYtMTFjMCAxIDAgMSAwIDJjMCAzOSAyOCA3MSA2NSA3OWMtNyAyLTE0IDMtMjIgM2MtNSAwLTEwLTEtMTUtMmMxMCAzMiA0MCA1NiA3NiA1NmMtMjggMjItNjMgMzUtMTAxIDM1Yy02IDAtMTMgMC0xOS0xYzM2IDIzIDc4IDM2IDEyNCAzNmMxNDkgMCAyMzAtMTIzIDIzMC0yMzBjMC0zIDAtNyAwLTEwYzE2LTEyIDI5LTI2IDQwLTQyelwifX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcInN5bWJvbFwiLFwiYVwiOntcImlkXCI6XCJhbnRlbm5hLXN2Zy1mYWNlYm9va1wiLFwidmlld0JveFwiOlwiMCAwIDUxMiA1MTJcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwicGF0aFwiLFwiYVwiOntcImRcIjpcIm00MjAgNzJsLTMyOCAwYy0xMSAwLTIwIDktMjAgMjBsMCAzMjhjMCAxMSA5IDIwIDIwIDIwbDE3NyAwbDAtMTQybC00OCAwbDAtNTZsNDggMGwwLTQxYzAtNDggMjktNzQgNzEtNzRjMjAgMCAzOCAyIDQzIDNsMCA0OWwtMjkgMGMtMjMgMC0yOCAxMS0yOCAyN2wwIDM2bDU1IDBsLTcgNTZsLTQ4IDBsMCAxNDJsOTQgMGMxMSAwIDIwLTkgMjAtMjBsMC0zMjhjMC0xMS05LTIwLTIwLTIwelwifX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcInN5bWJvbFwiLFwiYVwiOntcImlkXCI6XCJhbnRlbm5hLXN2Zy1jb21tZW50XCIsXCJ2aWV3Qm94XCI6XCIwIDAgNTEyIDUxMlwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJwYXRoXCIsXCJhXCI6e1wiZFwiOlwibTUxMiAyNTZjMCAzMy0xMSA2NC0zNCA5MmMtMjMgMjgtNTQgNTAtOTMgNjZjLTQwIDE3LTgzIDI1LTEyOSAyNWMtMTMgMC0yNy0xLTQxLTJjLTM4IDMzLTgyIDU2LTEzMiA2OWMtOSAyLTIwIDQtMzIgNmMtNCAwLTcgMC05LTNjLTMtMi00LTQtNS04bDAgMGMtMS0xLTEtMiAwLTRjMC0xIDAtMiAwLTJjMC0xIDEtMiAyLTNsMS0zYzAgMCAxLTEgMi0yYzItMiAyLTMgMy0zYzEtMSA0LTUgOC0xMGM1LTUgOC04IDEwLTEwYzItMyA1LTYgOS0xMmM0LTUgNy0xMCA5LTE0YzMtNSA1LTEwIDgtMTdjMy03IDUtMTQgOC0yMmMtMzAtMTctNTQtMzgtNzEtNjNjLTE3LTI1LTI2LTUxLTI2LTgwYzAtMjUgNy00OCAyMC03MWMxNC0yMyAzMi00MiA1NS01OGMyMy0xNyA1MC0zMCA4Mi0zOWMzMS0xMCA2NC0xNSA5OS0xNWM0NiAwIDg5IDggMTI5IDI1YzM5IDE2IDcwIDM4IDkzIDY2YzIzIDI4IDM0IDU5IDM0IDkyelwifX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcInN5bWJvbFwiLFwiYVwiOntcImlkXCI6XCJhbnRlbm5hLXN2Zy1zZWFyY2hcIixcInZpZXdCb3hcIjpcIjAgMCA1MTIgNTEyXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInBhdGhcIixcImFcIjp7XCJkXCI6XCJtMzQ3IDIzOGMwLTM2LTEyLTY2LTM3LTkxYy0yNS0yNS01NS0zNy05MS0zN2MtMzUgMC02NSAxMi05MCAzN2MtMjUgMjUtMzggNTUtMzggOTFjMCAzNSAxMyA2NSAzOCA5MGMyNSAyNSA1NSAzOCA5MCAzOGMzNiAwIDY2LTEzIDkxLTM4YzI1LTI1IDM3LTU1IDM3LTkweiBtMTQ3IDIzN2MwIDEwLTQgMTktMTEgMjZjLTcgNy0xNiAxMS0yNiAxMWMtMTAgMC0xOS00LTI2LTExbC05OC05OGMtMzQgMjQtNzIgMzYtMTE0IDM2Yy0yNyAwLTUzLTUtNzgtMTZjLTI1LTExLTQ2LTI1LTY0LTQzYy0xOC0xOC0zMi0zOS00My02NGMtMTAtMjUtMTYtNTEtMTYtNzhjMC0yOCA2LTU0IDE2LTc4YzExLTI1IDI1LTQ3IDQzLTY1YzE4LTE4IDM5LTMyIDY0LTQzYzI1LTEwIDUxLTE1IDc4LTE1YzI4IDAgNTQgNSA3OSAxNWMyNCAxMSA0NiAyNSA2NCA0M2MxOCAxOCAzMiA0MCA0MyA2NWMxMCAyNCAxNiA1MCAxNiA3OGMwIDQyLTEyIDgwLTM2IDExNGw5OCA5OGM3IDcgMTEgMTUgMTEgMjV6XCJ9fV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwic3ltYm9sXCIsXCJhXCI6e1wiaWRcIjpcImFudGVubmEtc3ZnLWxlZnRcIixcInZpZXdCb3hcIjpcIjAgMCA1MTIgNTEyXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInBhdGhcIixcImFcIjp7XCJkXCI6XCJtMzY4IDE2MGwtNjQtNjQtMTYwIDE2MCAxNjAgMTYwIDY0LTY0LTk2LTk2elwifX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcInN5bWJvbFwiLFwiYVwiOntcImlkXCI6XCJhbnRlbm5hLXN2Zy1sb2dvXCIsXCJ2aWV3Qm94XCI6XCIwIDAgNTEyIDUxMlwifSxcImZcIjpbXCIgXCIse1widFwiOjcsXCJlXCI6XCJwYXRoXCIsXCJhXCI6e1wiZFwiOlwibTI4MyA1MTBjMTI1LTE3IDIyOS0xMjQgMjI5LTI1MyAwLTE0MS0xMTUtMjU2LTI1Ni0yNTYtMTQxIDAtMjU2IDExNS0yNTYgMjU2IDAgMTMwIDEwOCAyMzcgMjMzIDI1NGwwLTE0OWMtNDgtMTQtODQtNTAtODQtMTAyIDAtNjUgNDMtMTEzIDEwOC0xMTMgNjUgMCAxMDcgNDggMTA3IDExMyAwIDUyLTMzIDg4LTgxIDEwMnpcIn19XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJzeW1ib2xcIixcImFcIjp7XCJpZFwiOlwiYW50ZW5uYS1zdmctZmlsbVwiLFwidmlld0JveFwiOlwiMCAwIDUxMiA1MTJcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwicGF0aFwiLFwiYVwiOntcImRcIjpcIm05MSA0NTdsMC0zNmMwLTUtMS0xMC01LTEzLTQtNC04LTYtMTMtNmwtMzYgMGMtNSAwLTEwIDItMTMgNi00IDMtNiA4LTYgMTNsMCAzNmMwIDUgMiA5IDYgMTMgMyA0IDggNSAxMyA1bDM2IDBjNSAwIDktMSAxMy01IDQtNCA1LTggNS0xM3ogbTAtMTEwbDAtMzZjMC01LTEtOS01LTEzLTQtNC04LTUtMTMtNWwtMzYgMGMtNSAwLTEwIDEtMTMgNS00IDQtNiA4LTYgMTNsMCAzNmMwIDUgMiAxMCA2IDEzIDMgNCA4IDYgMTMgNmwzNiAwYzUgMCA5LTIgMTMtNiA0LTMgNS04IDUtMTN6IG0wLTEwOWwwLTM3YzAtNS0xLTktNS0xMy00LTMtOC01LTEzLTVsLTM2IDBjLTUgMC0xMCAyLTEzIDUtNCA0LTYgOC02IDEzbDAgMzdjMCA1IDIgOSA2IDEzIDMgMyA4IDUgMTMgNWwzNiAwYzUgMCA5LTIgMTMtNSA0LTQgNS04IDUtMTN6IG0yOTMgMjE5bDAtMTQ2YzAtNS0yLTktNS0xMy00LTQtOC01LTEzLTVsLTIyMCAwYy01IDAtOSAxLTEzIDUtMyA0LTUgOC01IDEzbDAgMTQ2YzAgNSAyIDkgNSAxMyA0IDQgOCA1IDEzIDVsMjIwIDBjNSAwIDktMSAxMy01IDMtNCA1LTggNS0xM3ogbS0yOTMtMzI5bDAtMzdjMC01LTEtOS01LTEyLTQtNC04LTYtMTMtNmwtMzYgMGMtNSAwLTEwIDItMTMgNi00IDMtNiA3LTYgMTJsMCAzN2MwIDUgMiA5IDYgMTMgMyAzIDggNSAxMyA1bDM2IDBjNSAwIDktMiAxMy01IDQtNCA1LTggNS0xM3ogbTQwMyAzMjlsMC0zNmMwLTUtMi0xMC02LTEzLTMtNC04LTYtMTMtNmwtMzYgMGMtNSAwLTkgMi0xMyA2LTQgMy01IDgtNSAxM2wwIDM2YzAgNSAxIDkgNSAxMyA0IDQgOCA1IDEzIDVsMzYgMGM1IDAgMTAtMSAxMy01IDQtNCA2LTggNi0xM3ogbS0xMTAtMjE5bDAtMTQ3YzAtNS0yLTktNS0xMi00LTQtOC02LTEzLTZsLTIyMCAwYy01IDAtOSAyLTEzIDYtMyAzLTUgNy01IDEybDAgMTQ3YzAgNSAyIDkgNSAxMyA0IDMgOCA1IDEzIDVsMjIwIDBjNSAwIDktMiAxMy01IDMtNCA1LTggNS0xM3ogbTExMCAxMDlsMC0zNmMwLTUtMi05LTYtMTMtMy00LTgtNS0xMy01bC0zNiAwYy01IDAtOSAxLTEzIDUtNCA0LTUgOC01IDEzbDAgMzZjMCA1IDEgMTAgNSAxMyA0IDQgOCA2IDEzIDZsMzYgMGM1IDAgMTAtMiAxMy02IDQtMyA2LTggNi0xM3ogbTAtMTA5bDAtMzdjMC01LTItOS02LTEzLTMtMy04LTUtMTMtNWwtMzYgMGMtNSAwLTkgMi0xMyA1LTQgNC01IDgtNSAxM2wwIDM3YzAgNSAxIDkgNSAxMyA0IDMgOCA1IDEzIDVsMzYgMGM1IDAgMTAtMiAxMy01IDQtNCA2LTggNi0xM3ogbTAtMTEwbDAtMzdjMC01LTItOS02LTEyLTMtNC04LTYtMTMtNmwtMzYgMGMtNSAwLTkgMi0xMyA2LTQgMy01IDctNSAxMmwwIDM3YzAgNSAxIDkgNSAxMyA0IDMgOCA1IDEzIDVsMzYgMGM1IDAgMTAtMiAxMy01IDQtNCA2LTggNi0xM3ogbTM2LTQ2bDAgMzg0YzAgMTMtNCAyNC0xMyAzMy05IDktMjAgMTMtMzIgMTNsLTQ1OCAwYy0xMiAwLTIzLTQtMzItMTMtOS05LTEzLTIwLTEzLTMzbDAtMzg0YzAtMTIgNC0yMyAxMy0zMiA5LTkgMjAtMTMgMzItMTNsNDU4IDBjMTIgMCAyMyA0IDMyIDEzIDkgOSAxMyAyMCAxMyAzMnpcIn19XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEgYW50ZW5uYS10YXAtaGVscGVyXCJ9LFwib1wiOlwiY3NzcmVzZXRcIixcInZcIjp7XCJ0YXBcIjpcImRpc21pc3NcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtdGFwLWhlbHBlci1pbm5lclwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImZcIjpbe1widFwiOjgsXCJyXCI6XCJsb2dvXCJ9LHtcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXRhcC1oZWxwZXItcHJvbXB0XCJ9LFwiZlwiOlt7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJ0YXBfaGVscGVyX19wcm9tcHRcXFwiKVwifX1dfV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtdGFwLWhlbHBlci1jbG9zZVwifSxcImZcIjpbe1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwidGFwX2hlbHBlcl9fY2xvc2VcXFwiKVwifX1dfV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcIm9cIjpcImNzc3Jlc2V0XCIsXCJhXCI6e1wiY2xhc3NcIjpbXCJhbnRlbm5hIGFudGVubmEtdGV4dC1pbmRpY2F0b3Itd2lkZ2V0IFwiLHtcInRcIjo0LFwiZlwiOltcImFudGVubmEtbm90bG9hZGVkXCJdLFwiblwiOjUxLFwiclwiOlwiY29udGFpbmVyRGF0YS5sb2FkZWRcIn0sXCIgXCIse1widFwiOjQsXCJmXCI6W1wiYW50ZW5uYS1oYXNyZWFjdGlvbnNcIl0sXCJuXCI6NTAsXCJ4XCI6e1wiclwiOltcImNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbFwiXSxcInNcIjpcIl8wPjBcIn19LFwiIFwiLHtcInRcIjo0LFwiZlwiOltcImFudGVubmEtc3VwcHJlc3NcIl0sXCJuXCI6NTAsXCJyXCI6XCJjb250YWluZXJEYXRhLnN1cHByZXNzXCJ9LFwiIFwiLHtcInRcIjoyLFwiclwiOlwiZXh0cmFDbGFzc2VzXCJ9XX0sXCJmXCI6W3tcInRcIjo4LFwiclwiOlwibG9nb1wifSxcIiBcIix7XCJ0XCI6NCxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcmVhY3Rpb24tdG90YWxcIn0sXCJmXCI6W3tcInRcIjoyLFwiclwiOlwiY29udGFpbmVyRGF0YS5yZWFjdGlvblRvdGFsXCJ9XX1dLFwiblwiOjUwLFwiclwiOlwiY29udGFpbmVyRGF0YS5yZWFjdGlvblRvdGFsXCJ9XX1dfSJdfQ==
