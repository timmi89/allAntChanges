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
    PageScanner.scan(groupSettings, Reinitializer.reinitialize);
}

function setupMobileHelper(groupSettings) {
    TapHelper.setupHelper(groupSettings);
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
        tapHelperPosition: data('doubleTapMessagePosition'),
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
function scanAllPages(groupSettings, reinitializeCallback) {
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
    setupMutationObserver(groupSettings, reinitializeCallback);
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

function setupMutationObserver(groupSettings, reinitializeCallback) {
    var originalPathname = window.location.pathname;
    var originalSearch = window.location.search;
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
                    var $pageIndicator = find($page, groupSettings.pageLinkSelector());
                    if ($pageIndicator.length === 0) {
                        if (shouldReinitializeForLocationChange()) {
                            reinitializeCallback(groupSettings);
                            return;
                        }
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

    function shouldReinitializeForLocationChange() {
        // Reinitialize when the location changes in a way that we believe is meaningful.
        // The heuristic we use is that either:
        // 1. The query string changes and we're on a site that says the query string matters or
        // 2. The path changes...
        //    2a. But not if the change is an extension of the path.
        //        2aa. Unless we're going from an empty path ('/') to some other path.
        var newLocationPathname = window.location.pathname;
        return groupSettings.url.includeQueryString() && originalSearch != window.location.search ||
                newLocationPathname != originalPathname && (originalPathname === '/' || newLocationPathname.indexOf(originalPathname) === -1);
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
        setupMouseOver($element);
        return $element;
    }
    return $(ractive.find('.antenna-popup'));
}

function setupMouseOver($element) {
    var closeTimer;

    // The :hover pseudo class can become stuck on the antenna-popup element when we bring up the reaction window
    // in response to the click. So here we add/remove our own hover class instead.
    // See: http://stackoverflow.com/questions/10321275/hover-state-is-sticky-after-element-is-moved-out-from-under-the-mouse-in-all-br
    var hoverClass = 'antenna-hover';
    $element.on('mouseenter', function() {
        $element.addClass(hoverClass);
        keepOpen();
    });
    $element.on('mouseleave', function() {
        $element.removeClass(hoverClass);
        delayedClose();
    });

    function delayedClose() {
        closeTimer = setTimeout(function() {
            closeTimer = null;
            hidePopup($element);
        }, 500);
    }

    function keepOpen() {
        if (closeTimer) {
            clearTimeout(closeTimer);
        }
    }
}

function showPopup(coordinates, callback) {
    var $element = getRootElement();
    if (!$element.hasClass('antenna-show')) {
        clickHandler = callback;
        $element
            .show() // still has opacity 0 at this point
            .css({
                top: coordinates.top - $element.outerHeight() - 6, // TODO find a cleaner way to account for the popup 'tail'
                left: coordinates.left - Math.floor($element.outerWidth() / 2)
            });
        TransitionUtil.toggleClass($element, 'antenna-show', true, function() {
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
    TransitionUtil.toggleClass($element, 'antenna-show', false, function() {
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
    PageScanner.scan(groupSettings, reinitialize);
}

module.exports = {
    reinitialize: reinitialize,
    reinitializeAll: reinitializeAll,
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
            isExpandedSummary: shouldUseExpandedSummary(groupSettings),
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
            data: {
                positionTop: groupSettings.tapHelperPosition() === 'top'
            },
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
    if (numHalfsies % 2 !== 0) {
        // If there are an odd number of half-sized boxes, make one of them full.
        // If there are no other full-size boxes, make the first one full-size. Otherwise, make the last one full.
        layoutClasses[numFull === 0 ? 0 : numReactions - 1] = CLASS_FULL;
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
module.exports={"v":3,"t":[{"t":7,"e":"div","o":"cssreset","a":{"class":["antenna antenna-summary-widget ",{"t":4,"f":["antenna-notloaded"],"n":51,"r":"pageData.summaryLoaded"}," ",{"t":4,"f":["antenna-expanded-summary"],"n":50,"r":"isExpandedSummary"}]},"f":[{"t":7,"e":"div","a":{"class":"antenna-summary-inner"},"f":[{"t":8,"r":"logo"},{"t":7,"e":"span","a":{"class":"antenna-summary-title"},"f":[" ",{"t":4,"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"summary_widget__reactions\")"}}],"n":50,"x":{"r":["pageData.summaryTotal"],"s":"_0===0"}},{"t":4,"n":51,"f":[{"t":4,"n":50,"x":{"r":["pageData.summaryTotal"],"s":"_0===1"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"summary_widget__reactions_one\")"}}]},{"t":4,"n":50,"x":{"r":["pageData.summaryTotal"],"s":"!(_0===1)"},"f":[" ",{"t":2,"x":{"r":["getMessage","pageData.summaryTotal"],"s":"_0(\"summary_widget__reactions_many\",[_1])"}}]}],"x":{"r":["pageData.summaryTotal"],"s":"_0===0"}}]},{"t":4,"f":[{"t":4,"f":[{"t":7,"e":"span","a":{"class":["antenna-expanded-reaction ",{"t":4,"f":["antenna-expanded-first"],"n":50,"x":{"r":["@index"],"s":"_0===0"}}]},"f":[{"t":7,"e":"span","a":{"class":"antenna-expanded-text"},"f":[{"t":2,"r":"./text"}]},{"t":7,"e":"span","a":{"class":"antenna-expanded-count"},"f":[{"t":2,"r":"./count"}]}]}],"x":{"r":["computeExpandedReactions","pageData.summaryReactions"],"s":"_0(_1)"}}],"n":50,"r":"isExpandedSummary"}]}]}]}
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
module.exports={"v":3,"t":[{"t":7,"e":"div","o":"cssreset","v":{"tap":"dismiss"},"a":{"class":["antenna antenna-tap-helper ",{"t":4,"f":["antenna-helper-top"],"n":50,"r":"positionTop"},{"t":4,"n":51,"f":["antenna-helper-bottom"],"r":"positionTop"}]},"f":[{"t":7,"e":"div","a":{"class":"antenna-tap-helper-inner"},"f":[{"t":7,"e":"div","f":[{"t":8,"r":"logo"},{"t":7,"e":"span","a":{"class":"antenna-tap-helper-prompt"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"tap_helper__prompt\")"}}]}]}," ",{"t":7,"e":"div","a":{"class":"antenna-tap-helper-close"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"tap_helper__close\")"}}]}]}]}]}
},{}],91:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"span","o":"cssreset","a":{"class":["antenna antenna-text-indicator-widget ",{"t":4,"f":["antenna-notloaded"],"n":51,"r":"containerData.loaded"}," ",{"t":4,"f":["antenna-hasreactions"],"n":50,"x":{"r":["containerData.reactionTotal"],"s":"_0>0"}}," ",{"t":4,"f":["antenna-suppress"],"n":50,"r":"containerData.suppress"}," ",{"t":2,"r":"extraClasses"}]},"f":[{"t":7,"e":"span","a":{"class":"antenna-text-indicator-inner"},"f":[{"t":8,"r":"logo"},{"t":4,"f":[{"t":7,"e":"span","a":{"class":"antenna-reaction-total"},"f":[{"t":2,"r":"containerData.reactionTotal"}]}],"n":50,"r":"containerData.reactionTotal"}]}]}]}
},{}]},{},[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvYW50ZW5uYS1hcHAuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvYXV0by1jYWxsLXRvLWFjdGlvbi5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9ibG9ja2VkLXJlYWN0aW9uLXBhZ2UuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvY2FsbC10by1hY3Rpb24tY291bnRlci5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9jYWxsLXRvLWFjdGlvbi1leHBhbmRlZC1yZWFjdGlvbnMuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvY2FsbC10by1hY3Rpb24taW5kaWNhdG9yLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL2NhbGwtdG8tYWN0aW9uLWxhYmVsLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL2NvbW1lbnQtYXJlYS1wYXJ0aWFsLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL2NvbW1lbnRzLXBhZ2UuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvY29uZmlybWF0aW9uLXBhZ2UuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvY3NzLWxvYWRlci5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9kZWZhdWx0cy1wYWdlLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL2V2ZW50cy5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9nZW5lcmljLWVycm9yLXBhZ2UuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvZ3JvdXAtc2V0dGluZ3MtbG9hZGVyLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL2dyb3VwLXNldHRpbmdzLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL2hhc2hlZC1lbGVtZW50cy5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9sb2NhdGlvbnMtcGFnZS5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9sb2dpbi1wYWdlLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL21lZGlhLWluZGljYXRvci13aWRnZXQuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvcGFnZS1kYXRhLWxvYWRlci5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9wYWdlLWRhdGEuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvcGFnZS1zY2FubmVyLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3BlbmRpbmctcmVhY3Rpb24tcGFnZS5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9wb3B1cC13aWRnZXQuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvcmVhY3Rpb25zLXBhZ2UuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvcmVhY3Rpb25zLXdpZGdldC5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9yZWluaXRpYWxpemVyLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3NjcmlwdC1sb2FkZXIuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvc3VtbWFyeS13aWRnZXQuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvc3Zncy5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy90YXAtaGVscGVyLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3RleHQtaW5kaWNhdG9yLXdpZGdldC5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy90ZXh0LXJlYWN0aW9ucy5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9hamF4LWNsaWVudC5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9hcHAtbW9kZS5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9icm93c2VyLW1ldHJpY3MuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvY2FsbGJhY2stc3VwcG9ydC5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9oYXNoLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL2pxdWVyeS1wcm92aWRlci5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9tZDUuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvbWVzc2FnZXMtZW4uanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvbWVzc2FnZXMtZXMuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvbWVzc2FnZXMuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvbW92ZWFibGUuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvbXV0YXRpb24tb2JzZXJ2ZXIuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvcGFnZS11dGlscy5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9yYWN0aXZlLWV2ZW50cy10YXAuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvcmFjdGl2ZS1wcm92aWRlci5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9yYW5nZS5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9yYW5neS1wcm92aWRlci5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9yZWFjdGlvbnMtd2lkZ2V0LWxheW91dC11dGlscy5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy90aHJvdHRsZWQtZXZlbnRzLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL3RvdWNoLXN1cHBvcnQuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvdHJhbnNpdGlvbi11dGlsLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL3VybC1jb25zdGFudHMuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvdXJscy5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy91c2VyLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL3dpZGdldC1idWNrZXQuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMveGRtLWNsaWVudC5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy94ZG0tbG9hZGVyLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3hkbS1hbmFseXRpY3MuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL2F1dG8tY2FsbC10by1hY3Rpb24uaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL2Jsb2NrZWQtcmVhY3Rpb24tcGFnZS5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvY2FsbC10by1hY3Rpb24tY291bnRlci5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvY2FsbC10by1hY3Rpb24tZXhwYW5kZWQtcmVhY3Rpb25zLmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9jYWxsLXRvLWFjdGlvbi1sYWJlbC5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvY29tbWVudC1hcmVhLXBhcnRpYWwuaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL2NvbW1lbnRzLXBhZ2UuaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL2NvbmZpcm1hdGlvbi1wYWdlLmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9kZWZhdWx0cy1wYWdlLmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9nZW5lcmljLWVycm9yLXBhZ2UuaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL2xvY2F0aW9ucy1wYWdlLmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9sb2dpbi1wYWdlLmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9tZWRpYS1pbmRpY2F0b3Itd2lkZ2V0Lmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9wZW5kaW5nLXJlYWN0aW9uLXBhZ2UuaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL3BvcHVwLXdpZGdldC5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvcmVhY3Rpb25zLXBhZ2UuaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL3JlYWN0aW9ucy13aWRnZXQuaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL3N1bW1hcnktd2lkZ2V0Lmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9zdmctY29tbWVudHMuaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL3N2Zy1mYWNlYm9vay5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvc3ZnLWZpbG0uaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL3N2Zy1sZWZ0Lmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9zdmctbG9jYXRpb24uaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL3N2Zy1sb2dvLXNlbGVjdGFibGUuaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL3N2Zy1sb2dvLmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9zdmctdHdpdHRlci5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvc3Zncy5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvdGFwLWhlbHBlci5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvdGV4dC1pbmRpY2F0b3Itd2lkZ2V0Lmhicy5odG1sIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdFFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxUUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0tBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxZ0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25pQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xVQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUEiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiaWYgKHdpbmRvdy5BTlRFTk5BSVMgfHwgd2luZG93LmFudGVubmEgfHwgd2luZG93LkFudGVubmFBcHApIHtcbiAgICAvLyBQcm90ZWN0IGFnYWluc3QgbXVsdGlwbGUgaW5zdGFuY2VzIG9mIHRoaXMgc2NyaXB0IGJlaW5nIGFkZGVkIHRvIHRoZSBwYWdlIChvciB0aGlzIHNjcmlwdCBhbmQgZW5nYWdlLmpzKVxuICAgIHJldHVybjtcbn1cbmlmICghd2luZG93Lk11dGF0aW9uT2JzZXJ2ZXIpIHtcbiAgICAvLyBCYWlsIG91dCBvbiBsZWdhY3kgYnJvd3NlcnMuXG4gICAgcmV0dXJuO1xufVxuXG52YXIgU2NyaXB0TG9hZGVyID0gcmVxdWlyZSgnLi9zY3JpcHQtbG9hZGVyJyk7XG52YXIgQ3NzTG9hZGVyID0gcmVxdWlyZSgnLi9jc3MtbG9hZGVyJyk7XG52YXIgR3JvdXBTZXR0aW5nc0xvYWRlciA9IHJlcXVpcmUoJy4vZ3JvdXAtc2V0dGluZ3MtbG9hZGVyJyk7XG52YXIgVGFwSGVscGVyID0gcmVxdWlyZSgnLi90YXAtaGVscGVyJyk7XG52YXIgUGFnZURhdGFMb2FkZXIgPSByZXF1aXJlKCcuL3BhZ2UtZGF0YS1sb2FkZXInKTtcbnZhciBQYWdlU2Nhbm5lciA9IHJlcXVpcmUoJy4vcGFnZS1zY2FubmVyJyk7XG52YXIgUmVpbml0aWFsaXplciA9IHJlcXVpcmUoJy4vcmVpbml0aWFsaXplcicpO1xudmFyIFhETUFuYWx5dGljcyA9IHJlcXVpcmUoJy4veGRtLWFuYWx5dGljcycpO1xudmFyIEJyb3dzZXJNZXRyaWNzID0gcmVxdWlyZSgnLi91dGlscy9icm93c2VyLW1ldHJpY3MnKTtcbnZhciBYRE1Mb2FkZXIgPSByZXF1aXJlKCcuL3V0aWxzL3hkbS1sb2FkZXInKTtcblxud2luZG93LkFudGVubmFBcHAgPSB7IC8vIFRPRE8gZmxlc2ggb3V0IG91ciBkZXNpcmVkIEFQSVxuICAgIHJlaW5pdGlhbGl6ZTogUmVpbml0aWFsaXplci5yZWluaXRpYWxpemVBbGxcbiAgICAvLyB0ZWFyZG93bj9cbiAgICAvLyB0cmFjZT9cbiAgICAvLyBkZWJ1Zz9cbiAgICAvLyBwYWdlZGF0YT9cbiAgICAvLyBncm91cHNldHRpbmdzP1xuICAgIC8vIG5lZWQgdG8gbWFrZSBzdXJlIG90aGVycyAoZS5nLiBtYWxpY2lvdXMgc2NyaXB0cykgY2FuJ3Qgd3JpdGUgZGF0YVxufTtcblxuLy8gU3RlcCAxIC0ga2ljayBvZmYgdGhlIGFzeW5jaHJvbm91cyBsb2FkaW5nIG9mIHRoZSBKYXZhc2NyaXB0IGFuZCBDU1Mgd2UgbmVlZC5cbkNzc0xvYWRlci5sb2FkKCk7IC8vIEluamVjdCB0aGUgQ1NTIGZpcnN0IGJlY2F1c2Ugd2UgbWF5IHNvb24gYXBwZW5kIG1vcmUgYXN5bmNocm9ub3VzbHksIGluIHRoZSBncm91cFNldHRpbmdzIGNhbGxiYWNrLCBhbmQgd2Ugd2FudCB0aGF0IENTUyB0byBiZSBsb3dlciBpbiB0aGUgZG9jdW1lbnQuXG5TY3JpcHRMb2FkZXIubG9hZChzY3JpcHRMb2FkZWQpO1xuXG5mdW5jdGlvbiBzY3JpcHRMb2FkZWQoKSB7XG4gICAgLy8gU3RlcCAyIC0gT25jZSB3ZSBoYXZlIG91ciByZXF1aXJlZCBzY3JpcHRzLCBmZXRjaCB0aGUgZ3JvdXAgc2V0dGluZ3MgZnJvbSB0aGUgc2VydmVyXG4gICAgR3JvdXBTZXR0aW5nc0xvYWRlci5sb2FkKGZ1bmN0aW9uKGdyb3VwU2V0dGluZ3MpIHtcbiAgICAgICAgaWYgKGdyb3VwU2V0dGluZ3MuaXNIaWRlT25Nb2JpbGUoKSAmJiBCcm93c2VyTWV0cmljcy5pc01vYmlsZSgpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgLy8gU3RlcCAzIC0gT25jZSB3ZSBoYXZlIHRoZSBzZXR0aW5ncywgd2UgY2FuIGtpY2sgb2ZmIGEgY291cGxlIHRoaW5ncyBpbiBwYXJhbGxlbDpcbiAgICAgICAgLy9cbiAgICAgICAgLy8gLS0gaW5qZWN0IGFueSBjdXN0b20gQ1NTIGZyb20gdGhlIGdyb3VwIHNldHRpbmdzXG4gICAgICAgIC8vIC0tIGNyZWF0ZSB0aGUgaGlkZGVuIGlmcmFtZSB3ZSB1c2UgZm9yIGNyb3NzLWRvbWFpbiBjb29raWVzIChwcmltYXJpbHkgdXNlciBsb2dpbilcbiAgICAgICAgLy8gLS0gc3RhcnQgZmV0Y2hpbmcgdGhlIHBhZ2UgZGF0YVxuICAgICAgICAvLyAtLSBzdGFydCBoYXNoaW5nIHRoZSBwYWdlIGFuZCBpbnNlcnRpbmcgdGhlIGFmZm9yZGFuY2VzIChpbiB0aGUgZW1wdHkgc3RhdGUpXG4gICAgICAgIC8vXG4gICAgICAgIC8vIEFzIHRoZSBwYWdlIGlzIHNjYW5uZWQsIHRoZSB3aWRnZXRzIGFyZSBjcmVhdGVkIGFuZCBib3VuZCB0byB0aGUgcGFnZSBkYXRhIHRoYXQgY29tZXMgaW4uXG4gICAgICAgIGluaXRDdXN0b21DU1MoZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIGluaXRYZG1GcmFtZShncm91cFNldHRpbmdzKTtcbiAgICAgICAgZmV0Y2hQYWdlRGF0YShncm91cFNldHRpbmdzKTtcbiAgICAgICAgc2NhblBhZ2UoZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIHNldHVwTW9iaWxlSGVscGVyKGdyb3VwU2V0dGluZ3MpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBpbml0Q3VzdG9tQ1NTKGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgY3VzdG9tQ1NTID0gZ3JvdXBTZXR0aW5ncy5jdXN0b21DU1MoKTtcbiAgICBpZiAoY3VzdG9tQ1NTKSB7XG4gICAgICAgIENzc0xvYWRlci5pbmplY3QoY3VzdG9tQ1NTKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGluaXRYZG1GcmFtZShncm91cFNldHRpbmdzKSB7XG4gICAgWERNQW5hbHl0aWNzLnN0YXJ0KCk7IC8vIFRoZSBYRE0gaWZyYW1lIGhhcyBhIG51bWJlciBvZiBtZXNzYWdlcyBpdCBmaXJlcyBvbiBsb2FkIHJlbGF0ZWQgdG8gYW5hbHl0aWNzLiBTdGFydCBsaXN0ZW5pbmcuXG4gICAgWERNTG9hZGVyLmNyZWF0ZVhETWZyYW1lKGdyb3VwU2V0dGluZ3MuZ3JvdXBJZCgpKTtcbn1cblxuZnVuY3Rpb24gZmV0Y2hQYWdlRGF0YShncm91cFNldHRpbmdzKSB7XG4gICAgUGFnZURhdGFMb2FkZXIubG9hZChncm91cFNldHRpbmdzKTtcbn1cblxuZnVuY3Rpb24gc2NhblBhZ2UoZ3JvdXBTZXR0aW5ncykge1xuICAgIFBhZ2VTY2FubmVyLnNjYW4oZ3JvdXBTZXR0aW5ncywgUmVpbml0aWFsaXplci5yZWluaXRpYWxpemUpO1xufVxuXG5mdW5jdGlvbiBzZXR1cE1vYmlsZUhlbHBlcihncm91cFNldHRpbmdzKSB7XG4gICAgVGFwSGVscGVyLnNldHVwSGVscGVyKGdyb3VwU2V0dGluZ3MpO1xufSIsInZhciAkOyByZXF1aXJlKCcuL3V0aWxzL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIEJyb3dzZXJNZXRyaWNzID0gcmVxdWlyZSgnLi91dGlscy9icm93c2VyLW1ldHJpY3MnKTtcbnZhciBSYWN0aXZlOyByZXF1aXJlKCcuL3V0aWxzL3JhY3RpdmUtcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24obG9hZGVkUmFjdGl2ZSkgeyBSYWN0aXZlPWxvYWRlZFJhY3RpdmU7IH0pO1xudmFyIFNWR3MgPSByZXF1aXJlKCcuL3N2Z3MnKTtcblxuZnVuY3Rpb24gY3JlYXRlQ2FsbFRvQWN0aW9uKGFudEl0ZW1JZCwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgcmFjdGl2ZSA9IFJhY3RpdmUoe1xuICAgICAgICBlbDogJCgnPGRpdj4nKSxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgYW50SXRlbUlkOiBhbnRJdGVtSWQsXG4gICAgICAgICAgICBleHBhbmRSZWFjdGlvbnM6IHNob3VsZEV4cGFuZFJlYWN0aW9ucyhncm91cFNldHRpbmdzKVxuICAgICAgICB9LFxuICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL2F1dG8tY2FsbC10by1hY3Rpb24uaGJzLmh0bWwnKSxcbiAgICAgICAgcGFydGlhbHM6IHtcbiAgICAgICAgICAgIGxvZ286IFNWR3MubG9nb1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZWxlbWVudDogJChyYWN0aXZlLmZpbmQoJy5hbnRlbm5hLWF1dG8tY3RhJykpLFxuICAgICAgICB0ZWFyZG93bjogZnVuY3Rpb24oKSB7IHJhY3RpdmUudGVhcmRvd24oKTsgfVxuICAgIH07XG59XG5cbmZ1bmN0aW9uIHNob3VsZEV4cGFuZFJlYWN0aW9ucyhncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIHNldHRpbmcgPSBncm91cFNldHRpbmdzLmdlbmVyYXRlZEN0YUV4cGFuZGVkKCk7IC8vIFZhbHVlcyBhcmUgJ25vbmUnLCAnYm90aCcsICdkZXNrdG9wJywgYW5kICdtb2JpbGUnXG4gICAgcmV0dXJuIHNldHRpbmcgPT09ICdib3RoJyB8fFxuICAgICAgICAoc2V0dGluZyA9PT0gJ2Rlc2t0b3AnICYmICFCcm93c2VyTWV0cmljcy5pc01vYmlsZSgpKSB8fFxuICAgICAgICAoc2V0dGluZyA9PT0gJ21vYmlsZScgJiYgQnJvd3Nlck1ldHJpY3MuaXNNb2JpbGUoKSk7XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGU6IGNyZWF0ZUNhbGxUb0FjdGlvblxufTsiLCJ2YXIgUmFjdGl2ZTsgcmVxdWlyZSgnLi91dGlscy9yYWN0aXZlLXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGxvYWRlZFJhY3RpdmUpIHsgUmFjdGl2ZSA9IGxvYWRlZFJhY3RpdmU7fSk7XG52YXIgU1ZHcyA9IHJlcXVpcmUoJy4vc3ZncycpO1xuXG52YXIgcGFnZVNlbGVjdG9yID0gJy5hbnRlbm5hLWJsb2NrZWQtcGFnZSc7XG5cbmZ1bmN0aW9uIGNyZWF0ZVBhZ2Uob3B0aW9ucykge1xuICAgIHZhciBnb0JhY2sgPSBvcHRpb25zLmdvQmFjaztcbiAgICB2YXIgZWxlbWVudCA9IG9wdGlvbnMuZWxlbWVudDtcbiAgICB2YXIgcmFjdGl2ZSA9IFJhY3RpdmUoe1xuICAgICAgICBlbDogZWxlbWVudCxcbiAgICAgICAgYXBwZW5kOiB0cnVlLFxuICAgICAgICBkYXRhOiB7fSxcbiAgICAgICAgdGVtcGxhdGU6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9ibG9ja2VkLXJlYWN0aW9uLXBhZ2UuaGJzLmh0bWwnKSxcbiAgICAgICAgcGFydGlhbHM6IHtcbiAgICAgICAgICAgIGxlZnQ6IFNWR3MubGVmdFxuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmFjdGl2ZS5vbignYmFjaycsIGdvQmFjayk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgc2VsZWN0b3I6IHBhZ2VTZWxlY3RvcixcbiAgICAgICAgdGVhcmRvd246IGZ1bmN0aW9uKCkgeyByYWN0aXZlLnRlYXJkb3duKCk7IH1cbiAgICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGVQYWdlOiBjcmVhdGVQYWdlXG59OyIsInZhciBSYWN0aXZlOyByZXF1aXJlKCcuL3V0aWxzL3JhY3RpdmUtcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24obG9hZGVkUmFjdGl2ZSkgeyBSYWN0aXZlID0gbG9hZGVkUmFjdGl2ZTt9KTtcblxuZnVuY3Rpb24gY3JlYXRlQ291bnQoJGNvdW50RWxlbWVudCwgY29udGFpbmVyRGF0YSkge1xuICAgIHZhciByYWN0aXZlID0gUmFjdGl2ZSh7XG4gICAgICAgIGVsOiAkY291bnRFbGVtZW50LFxuICAgICAgICBtYWdpYzogdHJ1ZSxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgY29udGFpbmVyRGF0YTogY29udGFpbmVyRGF0YVxuICAgICAgICB9LFxuICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL2NhbGwtdG8tYWN0aW9uLWNvdW50ZXIuaGJzLmh0bWwnKVxuICAgIH0pO1xuICAgIHJldHVybiB7XG4gICAgICAgIHRlYXJkb3duOiBmdW5jdGlvbigpIHsgcmFjdGl2ZS50ZWFyZG93bigpOyB9XG4gICAgfTtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZTogY3JlYXRlQ291bnRcbn07IiwidmFyIFJhY3RpdmU7IHJlcXVpcmUoJy4vdXRpbHMvcmFjdGl2ZS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihsb2FkZWRSYWN0aXZlKSB7IFJhY3RpdmUgPSBsb2FkZWRSYWN0aXZlO30pO1xuXG5mdW5jdGlvbiBjcmVhdGVFeHBhbmRlZFJlYWN0aW9ucygkZXhwYW5kZWRSZWFjdGlvbnNFbGVtZW50LCAkY3RhRWxlbWVudCwgY29udGFpbmVyRGF0YSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciByYWN0aXZlID0gUmFjdGl2ZSh7XG4gICAgICAgIGVsOiAkZXhwYW5kZWRSZWFjdGlvbnNFbGVtZW50LFxuICAgICAgICBtYWdpYzogdHJ1ZSxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgY29udGFpbmVyRGF0YTogY29udGFpbmVyRGF0YSxcbiAgICAgICAgICAgIGNvbXB1dGVFeHBhbmRlZFJlYWN0aW9uczogY29tcHV0ZUV4cGFuZGVkUmVhY3Rpb25zKGdyb3VwU2V0dGluZ3MuZGVmYXVsdFJlYWN0aW9ucygkY3RhRWxlbWVudCkpXG4gICAgICAgIH0sXG4gICAgICAgIHRlbXBsYXRlOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvY2FsbC10by1hY3Rpb24tZXhwYW5kZWQtcmVhY3Rpb25zLmhicy5odG1sJylcbiAgICB9KTtcbiAgICByZXR1cm4ge1xuICAgICAgICB0ZWFyZG93bjogZnVuY3Rpb24oKSB7IHJhY3RpdmUudGVhcmRvd24oKTsgfVxuICAgIH07XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVFeHBhbmRlZFJlYWN0aW9ucyhkZWZhdWx0UmVhY3Rpb25zKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHJlYWN0aW9uc0RhdGEpIHtcbiAgICAgICAgdmFyIG1heCA9IDI7XG4gICAgICAgIHZhciBleHBhbmRlZFJlYWN0aW9ucyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJlYWN0aW9uc0RhdGEubGVuZ3RoICYmIGV4cGFuZGVkUmVhY3Rpb25zLmxlbmd0aCA8IG1heDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgcmVhY3Rpb25EYXRhID0gcmVhY3Rpb25zRGF0YVtpXTtcbiAgICAgICAgICAgIGlmIChpc0RlZmF1bHRSZWFjdGlvbihyZWFjdGlvbkRhdGEsIGRlZmF1bHRSZWFjdGlvbnMpKSB7XG4gICAgICAgICAgICAgICAgZXhwYW5kZWRSZWFjdGlvbnMucHVzaChyZWFjdGlvbkRhdGEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBleHBhbmRlZFJlYWN0aW9ucztcbiAgICB9O1xufVxuXG5mdW5jdGlvbiBpc0RlZmF1bHRSZWFjdGlvbihyZWFjdGlvbkRhdGEsIGRlZmF1bHRSZWFjdGlvbnMpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRlZmF1bHRSZWFjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGRlZmF1bHRSZWFjdGlvbnNbaV0udGV4dCA9PT0gcmVhY3Rpb25EYXRhLnRleHQpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZTogY3JlYXRlRXhwYW5kZWRSZWFjdGlvbnNcbn07IiwidmFyIENhbGxUb0FjdGlvbkNvdW50ZXIgPSByZXF1aXJlKCcuL2NhbGwtdG8tYWN0aW9uLWNvdW50ZXInKTtcbnZhciBDYWxsVG9BY3Rpb25FeHBhbmRlZFJlYWN0aW9ucyA9IHJlcXVpcmUoJy4vY2FsbC10by1hY3Rpb24tZXhwYW5kZWQtcmVhY3Rpb25zJyk7XG52YXIgQ2FsbFRvQWN0aW9uTGFiZWwgPSByZXF1aXJlKCcuL2NhbGwtdG8tYWN0aW9uLWxhYmVsJyk7XG52YXIgUmVhY3Rpb25zV2lkZ2V0ID0gcmVxdWlyZSgnLi9yZWFjdGlvbnMtd2lkZ2V0Jyk7XG5cblxuZnVuY3Rpb24gY3JlYXRlSW5kaWNhdG9yV2lkZ2V0KG9wdGlvbnMpIHtcbiAgICB2YXIgY29udGFpbmVyRGF0YSA9IG9wdGlvbnMuY29udGFpbmVyRGF0YTtcbiAgICB2YXIgJGNvbnRhaW5lckVsZW1lbnQgPSBvcHRpb25zLmNvbnRhaW5lckVsZW1lbnQ7XG4gICAgdmFyIGNvbnRlbnREYXRhID0gb3B0aW9ucy5jb250ZW50RGF0YTtcbiAgICB2YXIgJGN0YUVsZW1lbnQgPSBvcHRpb25zLmN0YUVsZW1lbnQ7XG4gICAgdmFyICRjdGFMYWJlbHMgPSBvcHRpb25zLmN0YUxhYmVsczsgLy8gb3B0aW9uYWxcbiAgICB2YXIgJGN0YUNvdW50ZXJzID0gb3B0aW9ucy5jdGFDb3VudGVyczsgLy8gb3B0aW9uYWxcbiAgICB2YXIgJGN0YUV4cGFuZGVkUmVhY3Rpb25zID0gb3B0aW9ucy5jdGFFeHBhbmRlZFJlYWN0aW9uczsgLy8gb3B0aW9uYWxcbiAgICB2YXIgcGFnZURhdGEgPSBvcHRpb25zLnBhZ2VEYXRhO1xuICAgIHZhciBncm91cFNldHRpbmdzID0gb3B0aW9ucy5ncm91cFNldHRpbmdzO1xuICAgIHZhciBkZWZhdWx0UmVhY3Rpb25zID0gb3B0aW9ucy5kZWZhdWx0UmVhY3Rpb25zO1xuXG4gICAgdmFyIHJlYWN0aW9uV2lkZ2V0T3B0aW9ucyA9IHtcbiAgICAgICAgcmVhY3Rpb25zRGF0YTogY29udGFpbmVyRGF0YS5yZWFjdGlvbnMsXG4gICAgICAgIGNvbnRhaW5lckRhdGE6IGNvbnRhaW5lckRhdGEsXG4gICAgICAgIGNvbnRhaW5lckVsZW1lbnQ6ICRjb250YWluZXJFbGVtZW50LFxuICAgICAgICBjb250ZW50RGF0YTogY29udGVudERhdGEsXG4gICAgICAgIGRlZmF1bHRSZWFjdGlvbnM6IGRlZmF1bHRSZWFjdGlvbnMsXG4gICAgICAgIHN0YXJ0UGFnZTogY29tcHV0ZVN0YXJ0UGFnZSgkY3RhRWxlbWVudCksXG4gICAgICAgIHBhZ2VEYXRhOiBwYWdlRGF0YSxcbiAgICAgICAgZ3JvdXBTZXR0aW5nczogZ3JvdXBTZXR0aW5nc1xuICAgIH07XG5cbiAgICAkY3RhRWxlbWVudC5vbignbW91c2VlbnRlci5hbnRlbm5hJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgaWYgKGV2ZW50LmJ1dHRvbnMgPiAwIHx8IChldmVudC5idXR0b25zID09IHVuZGVmaW5lZCAmJiBldmVudC53aGljaCA+IDApKSB7IC8vIE9uIFNhZmFyaSwgZXZlbnQuYnV0dG9ucyBpcyB1bmRlZmluZWQgYnV0IGV2ZW50LndoaWNoIGdpdmVzIGEgZ29vZCB2YWx1ZS4gZXZlbnQud2hpY2ggaXMgYmFkIG9uIEZGXG4gICAgICAgICAgICAvLyBEb24ndCByZWFjdCBpZiB0aGUgdXNlciBpcyBkcmFnZ2luZyBvciBzZWxlY3RpbmcgdGV4dC5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBvcGVuUmVhY3Rpb25zV2luZG93KHJlYWN0aW9uV2lkZ2V0T3B0aW9ucywgJGN0YUVsZW1lbnQpO1xuICAgIH0pO1xuXG4gICAgdmFyIGNyZWF0ZWRXaWRnZXRzID0gW107XG5cbiAgICBpZiAoJGN0YUxhYmVscykge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8ICRjdGFMYWJlbHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNyZWF0ZWRXaWRnZXRzLnB1c2goQ2FsbFRvQWN0aW9uTGFiZWwuY3JlYXRlKCRjdGFMYWJlbHNbaV0sIGNvbnRhaW5lckRhdGEpKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmICgkY3RhQ291bnRlcnMpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAkY3RhQ291bnRlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNyZWF0ZWRXaWRnZXRzLnB1c2goQ2FsbFRvQWN0aW9uQ291bnRlci5jcmVhdGUoJGN0YUNvdW50ZXJzW2ldLCBjb250YWluZXJEYXRhKSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoJGN0YUV4cGFuZGVkUmVhY3Rpb25zKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgJGN0YUV4cGFuZGVkUmVhY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjcmVhdGVkV2lkZ2V0cy5wdXNoKENhbGxUb0FjdGlvbkV4cGFuZGVkUmVhY3Rpb25zLmNyZWF0ZSgkY3RhRXhwYW5kZWRSZWFjdGlvbnNbaV0sICRjdGFFbGVtZW50LCBjb250YWluZXJEYXRhLCBncm91cFNldHRpbmdzKSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICB0ZWFyZG93bjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAkY3RhRWxlbWVudC5vZmYoJy5hbnRlbm5hJyk7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNyZWF0ZWRXaWRnZXRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY3JlYXRlZFdpZGdldHNbaV0udGVhcmRvd24oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gY29tcHV0ZVN0YXJ0UGFnZSgkZWxlbWVudCkge1xuICAgIHZhciB2YWwgPSAoJGVsZW1lbnQuYXR0cignYW50LW1vZGUnKSB8fCAnJykudHJpbSgpO1xuICAgIGlmICh2YWwgPT09ICd3cml0ZScpIHtcbiAgICAgICAgcmV0dXJuIFJlYWN0aW9uc1dpZGdldC5QQUdFX0RFRkFVTFRTO1xuICAgIH0gZWxzZSBpZiAodmFsID09PSAncmVhZCcpIHtcbiAgICAgICAgcmV0dXJuIFJlYWN0aW9uc1dpZGdldC5QQUdFX1JFQUNUSU9OUztcbiAgICB9XG4gICAgcmV0dXJuIFJlYWN0aW9uc1dpZGdldC5QQUdFX0FVVE87XG59XG5cbmZ1bmN0aW9uIG9wZW5SZWFjdGlvbnNXaW5kb3cocmVhY3Rpb25PcHRpb25zLCAkY3RhRWxlbWVudCkge1xuICAgIFJlYWN0aW9uc1dpZGdldC5vcGVuKHJlYWN0aW9uT3B0aW9ucywgJGN0YUVsZW1lbnQpO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlOiBjcmVhdGVJbmRpY2F0b3JXaWRnZXRcbn07IiwidmFyIFJhY3RpdmU7IHJlcXVpcmUoJy4vdXRpbHMvcmFjdGl2ZS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihsb2FkZWRSYWN0aXZlKSB7IFJhY3RpdmUgPSBsb2FkZWRSYWN0aXZlO30pO1xuXG5mdW5jdGlvbiBjcmVhdGVMYWJlbCgkbGFiZWxFbGVtZW50LCBjb250YWluZXJEYXRhKSB7XG4gICAgdmFyIHJhY3RpdmUgPSBSYWN0aXZlKHtcbiAgICAgICAgZWw6ICRsYWJlbEVsZW1lbnQsIC8vIFRPRE86IHJldmlldyB0aGUgc3RydWN0dXJlIG9mIHRoZSBET00gaGVyZS4gRG8gd2Ugd2FudCB0byByZW5kZXIgYW4gZWxlbWVudCBpbnRvICRjdGFMYWJlbCBvciBqdXN0IHRleHQ/XG4gICAgICAgIG1hZ2ljOiB0cnVlLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICBjb250YWluZXJEYXRhOiBjb250YWluZXJEYXRhXG4gICAgICAgIH0sXG4gICAgICAgIHRlbXBsYXRlOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvY2FsbC10by1hY3Rpb24tbGFiZWwuaGJzLmh0bWwnKVxuICAgIH0pO1xuICAgIHJldHVybiB7XG4gICAgICAgIHRlYXJkb3duOiBmdW5jdGlvbigpIHsgcmFjdGl2ZS50ZWFyZG93bigpOyB9XG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlOiBjcmVhdGVMYWJlbFxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi91dGlscy9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciBBamF4Q2xpZW50ID0gcmVxdWlyZSgnLi91dGlscy9hamF4LWNsaWVudCcpO1xudmFyIFVzZXIgPSByZXF1aXJlKCcuL3V0aWxzL3VzZXInKTtcblxudmFyIEV2ZW50cyA9IHJlcXVpcmUoJy4vZXZlbnRzJyk7XG5cbmZ1bmN0aW9uIHNldHVwQ29tbWVudEFyZWEocmVhY3Rpb25Qcm92aWRlciwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MsIGNhbGxiYWNrLCByYWN0aXZlKSB7XG4gICAgaWYgKGdyb3VwU2V0dGluZ3MucmVxdWlyZXNBcHByb3ZhbCgpKSB7XG4gICAgICAgIC8vIEN1cnJlbnRseSwgc2l0ZXMgdGhhdCByZXF1aXJlIGFwcHJvdmFsIGRvbid0IHN1cHBvcnQgY29tbWVudCBpbnB1dC5cbiAgICAgICAgJChyYWN0aXZlLmZpbmQoJy5hbnRlbm5hLWNvbW1lbnQtd2lkZ2V0cycpKS5oaWRlKCk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgcmFjdGl2ZS5vbignaW5wdXRjaGFuZ2VkJywgdXBkYXRlSW5wdXRDb3VudGVyKTtcbiAgICByYWN0aXZlLm9uKCdhZGRjb21tZW50JywgYWRkQ29tbWVudCk7XG4gICAgdXBkYXRlSW5wdXRDb3VudGVyKCk7XG5cbiAgICBmdW5jdGlvbiBhZGRDb21tZW50KCkge1xuICAgICAgICB2YXIgY29tbWVudCA9ICQocmFjdGl2ZS5maW5kKCcuYW50ZW5uYS1jb21tZW50LWlucHV0JykpLnZhbCgpLnRyaW0oKTsgLy8gVE9ETzogYWRkaXRpb25hbCB2YWxpZGF0aW9uPyBpbnB1dCBzYW5pdGl6aW5nP1xuICAgICAgICBpZiAoY29tbWVudC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAkKHJhY3RpdmUuZmluZCgnLmFudGVubmEtY29tbWVudC13aWRnZXRzJykpLmhpZGUoKTtcbiAgICAgICAgICAgICQocmFjdGl2ZS5maW5kKCcuYW50ZW5uYS1jb21tZW50LXdhaXRpbmcnKSkuZmFkZUluKCdzbG93Jyk7XG4gICAgICAgICAgICByZWFjdGlvblByb3ZpZGVyLmdldChmdW5jdGlvbiAocmVhY3Rpb24pIHtcbiAgICAgICAgICAgICAgICBBamF4Q2xpZW50LnBvc3RDb21tZW50KGNvbW1lbnQsIHJlYWN0aW9uLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBFdmVudHMucG9zdENvbW1lbnRDcmVhdGVkKHBhZ2VEYXRhLCBjb250YWluZXJEYXRhLCByZWFjdGlvbiwgY29tbWVudCwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICAgICAgfSwgZXJyb3IpO1xuICAgICAgICAgICAgICAgICQocmFjdGl2ZS5maW5kKCcuYW50ZW5uYS1jb21tZW50LXdhaXRpbmcnKSkuc3RvcCgpLmhpZGUoKTtcbiAgICAgICAgICAgICAgICAkKHJhY3RpdmUuZmluZCgnLmFudGVubmEtY29tbWVudC1yZWNlaXZlZCcpKS5mYWRlSW4oKTtcbiAgICAgICAgICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soY29tbWVudCwgVXNlci5vcHRpbWlzdGljQ29tbWVudFVzZXIoKSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gZXJyb3IobWVzc2FnZSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBUT0RPIHJlYWwgZXJyb3IgaGFuZGxpbmdcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0Vycm9yIHBvc3RpbmcgY29tbWVudDogJyArIG1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdXBkYXRlSW5wdXRDb3VudGVyKCkge1xuICAgICAgICB2YXIgJHRleHRhcmVhID0gJChyYWN0aXZlLmZpbmQoJy5hbnRlbm5hLWNvbW1lbnQtaW5wdXQnKSk7XG4gICAgICAgIHZhciBtYXggPSBwYXJzZUludCgkdGV4dGFyZWEuYXR0cignbWF4bGVuZ3RoJykpO1xuICAgICAgICB2YXIgbGVuZ3RoID0gJHRleHRhcmVhLnZhbCgpLmxlbmd0aDtcbiAgICAgICAgJChyYWN0aXZlLmZpbmQoJy5hbnRlbm5hLWNvbW1lbnQtY291bnQnKSkuaHRtbChNYXRoLm1heCgwLCBtYXggLSBsZW5ndGgpKTtcbiAgICB9XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBzZXR1cDogc2V0dXBDb21tZW50QXJlYVxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi91dGlscy9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciBSYWN0aXZlOyByZXF1aXJlKCcuL3V0aWxzL3JhY3RpdmUtcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24obG9hZGVkUmFjdGl2ZSkgeyBSYWN0aXZlID0gbG9hZGVkUmFjdGl2ZTt9KTtcbnZhciBDb21tZW50QXJlYVBhcnRpYWwgPSByZXF1aXJlKCcuL2NvbW1lbnQtYXJlYS1wYXJ0aWFsJyk7XG52YXIgU1ZHcyA9IHJlcXVpcmUoJy4vc3ZncycpO1xuXG52YXIgcGFnZVNlbGVjdG9yID0gJy5hbnRlbm5hLWNvbW1lbnRzLXBhZ2UnO1xuXG5mdW5jdGlvbiBjcmVhdGVQYWdlKG9wdGlvbnMpIHtcbiAgICB2YXIgcmVhY3Rpb24gPSBvcHRpb25zLnJlYWN0aW9uO1xuICAgIHZhciBjb21tZW50cyA9IG9wdGlvbnMuY29tbWVudHM7XG4gICAgdmFyIGVsZW1lbnQgPSBvcHRpb25zLmVsZW1lbnQ7XG4gICAgdmFyIGNvbnRhaW5lckRhdGEgPSBvcHRpb25zLmNvbnRhaW5lckRhdGE7XG4gICAgdmFyIHBhZ2VEYXRhID0gb3B0aW9ucy5wYWdlRGF0YTtcbiAgICB2YXIgZ3JvdXBTZXR0aW5ncyA9IG9wdGlvbnMuZ3JvdXBTZXR0aW5ncztcbiAgICB2YXIgZ29CYWNrID0gb3B0aW9ucy5nb0JhY2s7XG4gICAgdmFyIHJhY3RpdmUgPSBSYWN0aXZlKHtcbiAgICAgICAgZWw6IGVsZW1lbnQsXG4gICAgICAgIGFwcGVuZDogdHJ1ZSxcbiAgICAgICAgbWFnaWM6IHRydWUsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIHJlYWN0aW9uOiByZWFjdGlvbixcbiAgICAgICAgICAgIGNvbW1lbnRzOiBjb21tZW50c1xuICAgICAgICB9LFxuICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL2NvbW1lbnRzLXBhZ2UuaGJzLmh0bWwnKSxcbiAgICAgICAgcGFydGlhbHM6IHtcbiAgICAgICAgICAgIGNvbW1lbnRBcmVhOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvY29tbWVudC1hcmVhLXBhcnRpYWwuaGJzLmh0bWwnKSxcbiAgICAgICAgICAgIGxlZnQ6IFNWR3MubGVmdFxuICAgICAgICB9XG4gICAgfSk7XG4gICAgdmFyIHJlYWN0aW9uUHJvdmlkZXIgPSB7IC8vIHRoaXMgcmVhY3Rpb24gcHJvdmlkZXIgaXMgYSBuby1icmFpbmVyIGJlY2F1c2Ugd2UgYWxyZWFkeSBoYXZlIGEgdmFsaWQgcmVhY3Rpb24gKG9uZSB3aXRoIGFuIElEKVxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhyZWFjdGlvbik7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIENvbW1lbnRBcmVhUGFydGlhbC5zZXR1cChyZWFjdGlvblByb3ZpZGVyLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncywgY29tbWVudEFkZGVkLCByYWN0aXZlLCBncm91cFNldHRpbmdzKTtcbiAgICByYWN0aXZlLm9uKCdiYWNrJywgZ29CYWNrKTtcbiAgICByZXR1cm4ge1xuICAgICAgICBzZWxlY3RvcjogcGFnZVNlbGVjdG9yLFxuICAgICAgICB0ZWFyZG93bjogZnVuY3Rpb24oKSB7IHJhY3RpdmUudGVhcmRvd24oKTsgfVxuICAgIH07XG5cbiAgICBmdW5jdGlvbiBjb21tZW50QWRkZWQoY29tbWVudCwgdXNlcikge1xuICAgICAgICBjb21tZW50cy51bnNoaWZ0KHsgdGV4dDogY29tbWVudCwgdXNlcjogdXNlciwgbmV3OiB0cnVlIH0pO1xuICAgICAgICAkKHJhY3RpdmUuZmluZCgnLmFudGVubmEtYm9keScpKS5hbmltYXRlKHtzY3JvbGxUb3A6IDB9KTtcbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZTogY3JlYXRlUGFnZVxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi91dGlscy9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciBSYWN0aXZlOyByZXF1aXJlKCcuL3V0aWxzL3JhY3RpdmUtcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24obG9hZGVkUmFjdGl2ZSkgeyBSYWN0aXZlID0gbG9hZGVkUmFjdGl2ZTt9KTtcbnZhciBBamF4Q2xpZW50ID0gcmVxdWlyZSgnLi91dGlscy9hamF4LWNsaWVudCcpO1xudmFyIFVSTHMgPSByZXF1aXJlKCcuL3V0aWxzL3VybHMnKTtcbnZhciBDb21tZW50QXJlYVBhcnRpYWwgPSByZXF1aXJlKCcuL2NvbW1lbnQtYXJlYS1wYXJ0aWFsJyk7XG52YXIgRXZlbnRzID0gcmVxdWlyZSgnLi9ldmVudHMnKTtcbnZhciBTVkdzID0gcmVxdWlyZSgnLi9zdmdzJyk7XG5cbnZhciBwYWdlU2VsZWN0b3IgPSAnLmFudGVubmEtY29uZmlybWF0aW9uLXBhZ2UnO1xuXG5mdW5jdGlvbiBjcmVhdGVQYWdlKHJlYWN0aW9uVGV4dCwgcmVhY3Rpb25Qcm92aWRlciwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MsIGVsZW1lbnQpIHtcbiAgICB2YXIgcG9wdXBXaW5kb3c7XG4gICAgdmFyIHJhY3RpdmUgPSBSYWN0aXZlKHtcbiAgICAgICAgZWw6IGVsZW1lbnQsXG4gICAgICAgIGFwcGVuZDogdHJ1ZSxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgdGV4dDogcmVhY3Rpb25UZXh0XG4gICAgICAgIH0sXG4gICAgICAgIHRlbXBsYXRlOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvY29uZmlybWF0aW9uLXBhZ2UuaGJzLmh0bWwnKSxcbiAgICAgICAgcGFydGlhbHM6IHtcbiAgICAgICAgICAgIGNvbW1lbnRBcmVhOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvY29tbWVudC1hcmVhLXBhcnRpYWwuaGJzLmh0bWwnKSxcbiAgICAgICAgICAgIGZhY2Vib29rSWNvbjogU1ZHcy5mYWNlYm9vayxcbiAgICAgICAgICAgIHR3aXR0ZXJJY29uOiBTVkdzLnR3aXR0ZXJcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJhY3RpdmUub24oJ3NoYXJlLWZhY2Vib29rJywgc2hhcmVUb0ZhY2Vib29rKTtcbiAgICByYWN0aXZlLm9uKCdzaGFyZS10d2l0dGVyJywgc2hhcmVUb1R3aXR0ZXIpO1xuICAgIENvbW1lbnRBcmVhUGFydGlhbC5zZXR1cChyZWFjdGlvblByb3ZpZGVyLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncywgbnVsbCwgcmFjdGl2ZSk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgc2VsZWN0b3I6IHBhZ2VTZWxlY3RvcixcbiAgICAgICAgdGVhcmRvd246IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY2xvc2VTaGFyZVdpbmRvdygpO1xuICAgICAgICAgICAgcmFjdGl2ZS50ZWFyZG93bigpO1xuICAgICAgICB9XG4gICAgfTtcblxuXG4gICAgZnVuY3Rpb24gc2hhcmVUb0ZhY2Vib29rKHJhY3RpdmVFdmVudCkge1xuICAgICAgICByYWN0aXZlRXZlbnQub3JpZ2luYWwucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgc2hhcmVSZWFjdGlvbihmdW5jdGlvbihyZWFjdGlvbkRhdGEsIHNob3J0VXJsKSB7XG4gICAgICAgICAgICBFdmVudHMucG9zdFJlYWN0aW9uU2hhcmVkKCdmYWNlYm9vaycsIHBhZ2VEYXRhLCBjb250YWluZXJEYXRhLCByZWFjdGlvbkRhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgdmFyIHNoYXJlVGV4dCA9IGNvbXB1dGVTaGFyZVRleHQocmVhY3Rpb25EYXRhLCAzMDApO1xuICAgICAgICAgICAgdmFyIGltYWdlUGFyYW0gPSAnJztcbiAgICAgICAgICAgIGlmIChjb250YWluZXJEYXRhLnR5cGUgPT09ICdpbWFnZScpIHtcbiAgICAgICAgICAgICAgICBpbWFnZVBhcmFtID0gJyZwW2ltYWdlc11bMF09JyArIGVuY29kZVVSSShyZWFjdGlvbkRhdGEuY29udGVudC5ib2R5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiAnaHR0cDovL3d3dy5mYWNlYm9vay5jb20vc2hhcmVyLnBocD9zPTEwMCcgK1xuICAgICAgICAgICAgICAgICcmcFt1cmxdPScgKyBzaG9ydFVybCArXG4gICAgICAgICAgICAgICAgJyZwW3RpdGxlXT0nICsgZW5jb2RlVVJJKHNoYXJlVGV4dCkgK1xuICAgICAgICAgICAgICAgICcmcFtzdW1tYXJ5XT0nICsgZW5jb2RlVVJJKHNoYXJlVGV4dCkgK1xuICAgICAgICAgICAgICAgIGltYWdlUGFyYW07XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNoYXJlVG9Ud2l0dGVyKHJhY3RpdmVFdmVudCkge1xuICAgICAgICByYWN0aXZlRXZlbnQub3JpZ2luYWwucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgc2hhcmVSZWFjdGlvbihmdW5jdGlvbihyZWFjdGlvbkRhdGEsIHNob3J0VXJsKSB7XG4gICAgICAgICAgICBFdmVudHMucG9zdFJlYWN0aW9uU2hhcmVkKCd0d2l0dGVyJywgcGFnZURhdGEsIGNvbnRhaW5lckRhdGEsIHJlYWN0aW9uRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICB2YXIgc2hhcmVUZXh0ID0gY29tcHV0ZVNoYXJlVGV4dChyZWFjdGlvbkRhdGEsIDExMCk7IC8vIE1ha2Ugc3VyZSB3ZSBzdGF5IHVuZGVyIHRoZSAxNDAgY2hhciBsaW1pdCAodHdpdHRlciBhcHBlbmRzIGFkZGl0aW9uYWwgdGV4dCBsaWtlIHRoZSB1cmwpXG4gICAgICAgICAgICB2YXIgdHdpdHRlclZpYSA9IGdyb3VwU2V0dGluZ3MudHdpdHRlckFjY291bnQoKSA/ICcmdmlhPScgKyBncm91cFNldHRpbmdzLnR3aXR0ZXJBY2NvdW50KCkgOiAnJztcbiAgICAgICAgICAgIHJldHVybiAnaHR0cDovL3R3aXR0ZXIuY29tL2ludGVudC90d2VldD91cmw9JyArIHNob3J0VXJsICsgdHdpdHRlclZpYSArICcmdGV4dD0nICsgZW5jb2RlVVJJKHNoYXJlVGV4dCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNoYXJlUmVhY3Rpb24oY29tcHV0ZVdpbmRvd0xvY2F0aW9uKSB7XG4gICAgICAgIGNsb3NlU2hhcmVXaW5kb3coKTtcbiAgICAgICAgcmVhY3Rpb25Qcm92aWRlci5nZXQoZnVuY3Rpb24ocmVhY3Rpb25EYXRhKSB7XG4gICAgICAgICAgICB2YXIgd2luZG93ID0gb3BlblNoYXJlV2luZG93KCk7XG4gICAgICAgICAgICBpZiAod2luZG93KSB7XG4gICAgICAgICAgICAgICAgQWpheENsaWVudC5wb3N0U2hhcmVSZWFjdGlvbihyZWFjdGlvbkRhdGEsIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHVybCA9IGNvbXB1dGVXaW5kb3dMb2NhdGlvbihyZWFjdGlvbkRhdGEsIHJlc3BvbnNlLnNob3J0X3VybCk7XG4gICAgICAgICAgICAgICAgICAgIHJlZGlyZWN0U2hhcmVXaW5kb3codXJsKTtcbiAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAobWVzc2FnZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkZhaWxlZCB0byBzaGFyZSByZWFjdGlvbjogXCIgKyBtZXNzYWdlKTtcbiAgICAgICAgICAgICAgICAgICAgY2xvc2VTaGFyZVdpbmRvdygpO1xuICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiBlbmdhZ2VfZnVsbDo5ODE4XG4gICAgICAgICAgICAgICAgICAgIC8vaWYgKCByZXNwb25zZS5tZXNzYWdlLmluZGV4T2YoIFwiVGVtcG9yYXJ5IHVzZXIgaW50ZXJhY3Rpb24gbGltaXQgcmVhY2hlZFwiICkgIT0gLTEgKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vICAgIEFOVC5zZXNzaW9uLnNob3dMb2dpblBhbmVsKCBhcmdzICk7XG4gICAgICAgICAgICAgICAgICAgIC8vfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgLy8gaWYgaXQgZmFpbGVkLCBzZWUgaWYgd2UgY2FuIGZpeCBpdCwgYW5kIGlmIHNvLCB0cnkgdGhpcyBmdW5jdGlvbiBvbmUgbW9yZSB0aW1lXG4gICAgICAgICAgICAgICAgICAgIC8vICAgIEFOVC5zZXNzaW9uLmhhbmRsZUdldFVzZXJGYWlsKCBhcmdzLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgICAgIEFOVC5hY3Rpb25zLnNoYXJlX2dldExpbmsoIGFyZ3MgKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIC8vfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjbG9zZVNoYXJlV2luZG93KCkge1xuICAgICAgICBpZiAocG9wdXBXaW5kb3cgJiYgIXBvcHVwV2luZG93LmNsb3NlZCkge1xuICAgICAgICAgICAgcG9wdXBXaW5kb3cuY2xvc2UoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIG9wZW5TaGFyZVdpbmRvdygpIHtcbiAgICAgICAgcG9wdXBXaW5kb3cgPSB3aW5kb3cub3BlbihVUkxzLmFwcFNlcnZlclVybCgpICsgVVJMcy5zaGFyZVdpbmRvd1VybCgpLCAnYW50ZW5uYV9zaGFyZV93aW5kb3cnLCdtZW51YmFyPTEscmVzaXphYmxlPTEsd2lkdGg9NjI2LGhlaWdodD00MzYnKTtcbiAgICAgICAgcmV0dXJuIHBvcHVwV2luZG93O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJlZGlyZWN0U2hhcmVXaW5kb3codXJsKSB7XG4gICAgICAgIGlmIChwb3B1cFdpbmRvdyAmJiAhcG9wdXBXaW5kb3cuY2xvc2VkKSB7XG4gICAgICAgICAgICBwb3B1cFdpbmRvdy5sb2NhdGlvbiA9IHVybDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNvbXB1dGVTaGFyZVRleHQocmVhY3Rpb25EYXRhLCBtYXhUZXh0TGVuZ3RoKSB7XG4gICAgICAgIHZhciBzaGFyZVRleHQgPSByZWFjdGlvbkRhdGEudGV4dCArIFwiIMK7IFwiICsgJyc7XG4gICAgICAgIHZhciBncm91cE5hbWUgPSBncm91cFNldHRpbmdzLmdyb3VwTmFtZSgpO1xuICAgICAgICBzd2l0Y2ggKGNvbnRhaW5lckRhdGEudHlwZSkge1xuICAgICAgICAgICAgY2FzZSAnaW1hZ2UnOlxuICAgICAgICAgICAgICAgIHNoYXJlVGV4dCArPSAnW2EgcGljdHVyZSBvbiAnICsgZ3JvdXBOYW1lICsgJ10gQ2hlY2sgaXQgb3V0OiAnO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnbWVkaWEnOlxuICAgICAgICAgICAgICAgIHNoYXJlVGV4dCArPSAnW2EgdmlkZW8gb24gJyArIGdyb3VwTmFtZSArICddIENoZWNrIGl0IG91dDogJztcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ3BhZ2UnOlxuICAgICAgICAgICAgICAgIHNoYXJlVGV4dCArPSAnW2FuIGFydGljbGUgb24gJyArIGdyb3VwTmFtZSArICddIENoZWNrIGl0IG91dDogJztcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ3RleHQnOlxuICAgICAgICAgICAgICAgIHZhciBtYXhCb2R5TGVuZ3RoID0gbWF4VGV4dExlbmd0aCAtIHNoYXJlVGV4dC5sZW5ndGggLSAyOyAvLyB0aGUgZXh0cmEgMiBhY2NvdW50cyBmb3IgdGhlIHF1b3RlcyB3ZSBhZGRcbiAgICAgICAgICAgICAgICB2YXIgdGV4dEJvZHkgPSByZWFjdGlvbkRhdGEuY29udGVudC5ib2R5O1xuICAgICAgICAgICAgICAgIHRleHRCb2R5ID0gdGV4dEJvZHkubGVuZ3RoID4gbWF4Qm9keUxlbmd0aCA/IHRleHRCb2R5LnN1YnN0cmluZygwLCBtYXhCb2R5TGVuZ3RoLTMpICsgJy4uLicgOiB0ZXh0Qm9keTtcbiAgICAgICAgICAgICAgICBzaGFyZVRleHQgKz0gJ1wiJyArIHRleHRCb2R5ICsgJ1wiJztcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc2hhcmVUZXh0O1xuICAgIH1cblxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlOiBjcmVhdGVQYWdlXG59OyIsInZhciBBcHBNb2RlID0gcmVxdWlyZSgnLi91dGlscy9hcHAtbW9kZScpO1xudmFyIFVSTHMgPSByZXF1aXJlKCcuL3V0aWxzL3VybHMnKTtcblxuZnVuY3Rpb24gbG9hZENzcygpIHtcbiAgICAvLyBUbyBtYWtlIHN1cmUgbm9uZSBvZiBvdXIgY29udGVudCByZW5kZXJzIG9uIHRoZSBwYWdlIGJlZm9yZSBvdXIgQ1NTIGlzIGxvYWRlZCwgd2UgYXBwZW5kIGEgc2ltcGxlIGlubGluZSBzdHlsZVxuICAgIC8vIGVsZW1lbnQgdGhhdCB0dXJucyBvZmYgb3VyIGVsZW1lbnRzICpiZWZvcmUqIG91ciBDU1MgbGlua3MuIFRoaXMgZXhwbG9pdHMgdGhlIGNhc2NhZGUgcnVsZXMgLSBvdXIgQ1NTIGZpbGVzIGFwcGVhclxuICAgIC8vIGFmdGVyIHRoZSBpbmxpbmUgc3R5bGUgaW4gdGhlIGRvY3VtZW50LCBzbyB0aGV5IHRha2UgcHJlY2VkZW5jZSAoYW5kIG1ha2UgZXZlcnl0aGluZyBhcHBlYXIpIG9uY2UgdGhleSdyZSBsb2FkZWQuXG4gICAgaW5qZWN0Q3NzKCcuYW50ZW5uYXtkaXNwbGF5Om5vbmU7fScpO1xuICAgIHZhciBjc3NIcmVmID0gVVJMcy5hbWF6b25TM1VybCgpICsgJy93aWRnZXQtbmV3L2FudGVubmEuY3NzJztcbiAgICBpZiAoQXBwTW9kZS5vZmZsaW5lKSB7XG4gICAgICAgIGNzc0hyZWYgPSBVUkxzLmFwcFNlcnZlclVybCgpICsgJy9zdGF0aWMvd2lkZ2V0LW5ldy9hbnRlbm5hLmNzcyc7XG4gICAgfVxuICAgIGxvYWRGaWxlKGNzc0hyZWYpO1xufVxuXG5mdW5jdGlvbiBsb2FkRmlsZShocmVmKSB7XG4gICAgdmFyIGxpbmtUYWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaW5rJyk7XG4gICAgbGlua1RhZy5zZXRBdHRyaWJ1dGUoJ2hyZWYnLCBocmVmKTtcbiAgICBsaW5rVGFnLnNldEF0dHJpYnV0ZSgncmVsJywgJ3N0eWxlc2hlZXQnKTtcbiAgICBsaW5rVGFnLnNldEF0dHJpYnV0ZSgndHlwZScsICd0ZXh0L2NzcycpO1xuICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQobGlua1RhZyk7XG59XG5cbmZ1bmN0aW9uIGluamVjdENzcyhjc3NTdHJpbmcpIHtcbiAgICB2YXIgc3R5bGVUYWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xuICAgIHN0eWxlVGFnLnNldEF0dHJpYnV0ZSgndHlwZScsICd0ZXh0L2NzcycpO1xuICAgIHN0eWxlVGFnLmlubmVySFRNTCA9IGNzc1N0cmluZztcbiAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHN0eWxlVGFnKTtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGxvYWQgOiBsb2FkQ3NzLFxuICAgIGluamVjdDogaW5qZWN0Q3NzXG59OyIsInZhciAkOyByZXF1aXJlKCcuL3V0aWxzL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIEFqYXhDbGllbnQgPSByZXF1aXJlKCcuL3V0aWxzL2FqYXgtY2xpZW50Jyk7XG52YXIgUmFjdGl2ZTsgcmVxdWlyZSgnLi91dGlscy9yYWN0aXZlLXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGxvYWRlZFJhY3RpdmUpIHsgUmFjdGl2ZSA9IGxvYWRlZFJhY3RpdmU7fSk7XG52YXIgUmVhY3Rpb25zV2lkZ2V0TGF5b3V0VXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzL3JlYWN0aW9ucy13aWRnZXQtbGF5b3V0LXV0aWxzJyk7XG5cbnZhciBFdmVudHMgPSByZXF1aXJlKCcuL2V2ZW50cycpO1xudmFyIFBhZ2VEYXRhID0gcmVxdWlyZSgnLi9wYWdlLWRhdGEnKTtcblxudmFyIHBhZ2VTZWxlY3RvciA9ICcuYW50ZW5uYS1kZWZhdWx0cy1wYWdlJztcblxuZnVuY3Rpb24gY3JlYXRlUGFnZShvcHRpb25zKSB7XG4gICAgdmFyIGRlZmF1bHRSZWFjdGlvbnMgPSBvcHRpb25zLmRlZmF1bHRSZWFjdGlvbnM7XG4gICAgdmFyIGNvbnRhaW5lckRhdGEgPSBvcHRpb25zLmNvbnRhaW5lckRhdGE7XG4gICAgdmFyIHBhZ2VEYXRhID0gb3B0aW9ucy5wYWdlRGF0YTtcbiAgICB2YXIgZ3JvdXBTZXR0aW5ncyA9IG9wdGlvbnMuZ3JvdXBTZXR0aW5ncztcbiAgICB2YXIgY29udGVudERhdGEgPSBvcHRpb25zLmNvbnRlbnREYXRhO1xuICAgIHZhciBzaG93Q29uZmlybWF0aW9uID0gb3B0aW9ucy5zaG93Q29uZmlybWF0aW9uO1xuICAgIHZhciBzaG93UGVuZGluZ0FwcHJvdmFsID0gb3B0aW9ucy5zaG93UGVuZGluZ0FwcHJvdmFsO1xuICAgIHZhciBzaG93UHJvZ3Jlc3MgPSBvcHRpb25zLnNob3dQcm9ncmVzcztcbiAgICB2YXIgaGFuZGxlUmVhY3Rpb25FcnJvciA9IG9wdGlvbnMuaGFuZGxlUmVhY3Rpb25FcnJvcjtcbiAgICB2YXIgZWxlbWVudCA9IG9wdGlvbnMuZWxlbWVudDtcbiAgICB2YXIgZGVmYXVsdExheW91dERhdGEgPSBSZWFjdGlvbnNXaWRnZXRMYXlvdXRVdGlscy5jb21wdXRlTGF5b3V0RGF0YShkZWZhdWx0UmVhY3Rpb25zKTtcbiAgICB2YXIgJHJlYWN0aW9uc1dpbmRvdyA9ICQob3B0aW9ucy5yZWFjdGlvbnNXaW5kb3cpO1xuICAgIHZhciByYWN0aXZlID0gUmFjdGl2ZSh7XG4gICAgICAgIGVsOiBlbGVtZW50LFxuICAgICAgICBhcHBlbmQ6IHRydWUsXG4gICAgICAgIHRlbXBsYXRlOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvZGVmYXVsdHMtcGFnZS5oYnMuaHRtbCcpLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICBkZWZhdWx0UmVhY3Rpb25zOiBkZWZhdWx0UmVhY3Rpb25zLFxuICAgICAgICAgICAgZGVmYXVsdExheW91dENsYXNzOiBhcnJheUFjY2Vzc29yKGRlZmF1bHRMYXlvdXREYXRhLmxheW91dENsYXNzZXMpXG4gICAgICAgIH0sXG4gICAgICAgIGRlY29yYXRvcnM6IHtcbiAgICAgICAgICAgIHNpemV0b2ZpdDogUmVhY3Rpb25zV2lkZ2V0TGF5b3V0VXRpbHMuc2l6ZVRvRml0KCRyZWFjdGlvbnNXaW5kb3cpXG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIHJhY3RpdmUub24oJ25ld3JlYWN0aW9uJywgbmV3RGVmYXVsdFJlYWN0aW9uKTtcbiAgICByYWN0aXZlLm9uKCduZXdjdXN0b20nLCBuZXdDdXN0b21SZWFjdGlvbik7XG4gICAgcmFjdGl2ZS5vbignY3VzdG9tZm9jdXMnLCBjdXN0b21SZWFjdGlvbkZvY3VzKTtcbiAgICByYWN0aXZlLm9uKCdjdXN0b21ibHVyJywgY3VzdG9tUmVhY3Rpb25CbHVyKTtcbiAgICByYWN0aXZlLm9uKCdwYWdla2V5ZG93bicsIGtleWJvYXJkSW5wdXQpO1xuICAgIHJhY3RpdmUub24oJ2lucHV0a2V5ZG93bicsIGN1c3RvbVJlYWN0aW9uSW5wdXQpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgc2VsZWN0b3I6IHBhZ2VTZWxlY3RvcixcbiAgICAgICAgdGVhcmRvd246IGZ1bmN0aW9uKCkgeyByYWN0aXZlLnRlYXJkb3duKCk7IH1cbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gY3VzdG9tUmVhY3Rpb25JbnB1dChyYWN0aXZlRXZlbnQpIHtcbiAgICAgICAgdmFyIGV2ZW50ID0gcmFjdGl2ZUV2ZW50Lm9yaWdpbmFsO1xuICAgICAgICB2YXIga2V5ID0gKGV2ZW50LndoaWNoICE9PSB1bmRlZmluZWQpID8gZXZlbnQud2hpY2ggOiBldmVudC5rZXlDb2RlO1xuICAgICAgICBpZiAoa2V5ID09IDEzKSB7IC8vIEVudGVyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyAvLyBsZXQgdGhlIHByb2Nlc3Npbmcgb2YgdGhlIGtleWJvYXJkIGV2ZW50IGZpbmlzaCBiZWZvcmUgd2Ugc2hvdyB0aGUgcGFnZSAob3RoZXJ3aXNlLCB0aGUgY29uZmlybWF0aW9uIHBhZ2UgYWxzbyByZWNlaXZlcyB0aGUga2V5c3Ryb2tlKVxuICAgICAgICAgICAgICAgIG5ld0N1c3RvbVJlYWN0aW9uKCk7XG4gICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgfSBlbHNlIGlmIChrZXkgPT0gMjcpIHsgLy8gRXNjYXBlXG4gICAgICAgICAgICBldmVudC50YXJnZXQudmFsdWUgPSAnJztcbiAgICAgICAgICAgIHJvb3RFbGVtZW50KHJhY3RpdmUpLmZvY3VzKCk7XG4gICAgICAgIH1cbiAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbmV3RGVmYXVsdFJlYWN0aW9uKHJhY3RpdmVFdmVudCkge1xuICAgICAgICB2YXIgcmVhY3Rpb25EYXRhID0gcmFjdGl2ZUV2ZW50LmNvbnRleHQ7XG4gICAgICAgIHZhciByZWFjdGlvblByb3ZpZGVyID0gY3JlYXRlUmVhY3Rpb25Qcm92aWRlcigpO1xuICAgICAgICBzaG93Q29uZmlybWF0aW9uKHJlYWN0aW9uRGF0YSwgcmVhY3Rpb25Qcm92aWRlcik7IC8vIE9wdGltaXN0aWNhbGx5IHNob3cgY29uZmlybWF0aW9uIGZvciBkZWZhdWx0IHJlYWN0aW9ucyBiZWNhdXNlIHRoZXkgc2hvdWxkIGFsd2F5cyBiZSBhY2NlcHRlZC5cbiAgICAgICAgQWpheENsaWVudC5wb3N0TmV3UmVhY3Rpb24ocmVhY3Rpb25EYXRhLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgY29udGVudERhdGEsIHN1Y2Nlc3MsIGVycm9yKTtcblxuICAgICAgICBmdW5jdGlvbiBzdWNjZXNzKHJlYWN0aW9uKSB7XG4gICAgICAgICAgICByZWFjdGlvbiA9IFBhZ2VEYXRhLnJlZ2lzdGVyUmVhY3Rpb24ocmVhY3Rpb24sIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhKTtcbiAgICAgICAgICAgIHJlYWN0aW9uUHJvdmlkZXIucmVhY3Rpb25Mb2FkZWQocmVhY3Rpb24pO1xuICAgICAgICAgICAgRXZlbnRzLnBvc3RSZWFjdGlvbkNyZWF0ZWQocGFnZURhdGEsIGNvbnRhaW5lckRhdGEsIHJlYWN0aW9uLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGVycm9yKG1lc3NhZ2UpIHtcbiAgICAgICAgICAgIHZhciByZXRyeSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIEFqYXhDbGllbnQucG9zdE5ld1JlYWN0aW9uKHJlYWN0aW9uRGF0YSwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGNvbnRlbnREYXRhLCBzdWNjZXNzLCBlcnJvcik7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaGFuZGxlUmVhY3Rpb25FcnJvcihtZXNzYWdlLCByZXRyeSwgcGFnZVNlbGVjdG9yKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIG5ld0N1c3RvbVJlYWN0aW9uKCkge1xuICAgICAgICB2YXIgaW5wdXQgPSByYWN0aXZlLmZpbmQoJy5hbnRlbm5hLWRlZmF1bHRzLWZvb3RlciBpbnB1dCcpO1xuICAgICAgICB2YXIgYm9keSA9IGlucHV0LnZhbHVlLnRyaW0oKTtcbiAgICAgICAgaWYgKGJvZHkgIT09ICcnKSB7XG4gICAgICAgICAgICBzaG93UHJvZ3Jlc3MoKTsgLy8gU2hvdyBwcm9ncmVzcyBmb3IgY3VzdG9tIHJlYWN0aW9ucyBiZWNhdXNlIHRoZSBzZXJ2ZXIgbWlnaHQgcmVqZWN0IHRoZW0gZm9yIGEgbnVtYmVyIG9mIHJlYXNvbnNcbiAgICAgICAgICAgIHZhciByZWFjdGlvbkRhdGEgPSB7IHRleHQ6IGJvZHkgfTtcbiAgICAgICAgICAgIHZhciByZWFjdGlvblByb3ZpZGVyID0gY3JlYXRlUmVhY3Rpb25Qcm92aWRlcigpO1xuICAgICAgICAgICAgaW5wdXQuYmx1cigpO1xuICAgICAgICAgICAgQWpheENsaWVudC5wb3N0TmV3UmVhY3Rpb24ocmVhY3Rpb25EYXRhLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgY29udGVudERhdGEsIHN1Y2Nlc3MsIGVycm9yKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHN1Y2Nlc3MocmVhY3Rpb24pIHtcbiAgICAgICAgICAgIGlmIChyZWFjdGlvbi5hcHByb3ZlZCkge1xuICAgICAgICAgICAgICAgIHNob3dDb25maXJtYXRpb24ocmVhY3Rpb25EYXRhLCByZWFjdGlvblByb3ZpZGVyKTtcbiAgICAgICAgICAgICAgICByZWFjdGlvbiA9IFBhZ2VEYXRhLnJlZ2lzdGVyUmVhY3Rpb24ocmVhY3Rpb24sIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhKTtcbiAgICAgICAgICAgICAgICByZWFjdGlvblByb3ZpZGVyLnJlYWN0aW9uTG9hZGVkKHJlYWN0aW9uKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gSWYgdGhlIHJlYWN0aW9uIGlzbid0IGFwcHJvdmVkLCBkb24ndCBhZGQgaXQgdG8gb3VyIGRhdGEgbW9kZWwuIEp1c3Qgc2hvdyBmZWVkYmFjayBhbmQgZmlyZSBhbiBldmVudC5cbiAgICAgICAgICAgICAgICBzaG93UGVuZGluZ0FwcHJvdmFsKHJlYWN0aW9uKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIEV2ZW50cy5wb3N0UmVhY3Rpb25DcmVhdGVkKHBhZ2VEYXRhLCBjb250YWluZXJEYXRhLCByZWFjdGlvbiwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBlcnJvcihtZXNzYWdlKSB7XG4gICAgICAgICAgICB2YXIgcmV0cnkgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBBamF4Q2xpZW50LnBvc3ROZXdSZWFjdGlvbihyZWFjdGlvbkRhdGEsIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBjb250ZW50RGF0YSwgc3VjY2VzcywgZXJyb3IpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGhhbmRsZVJlYWN0aW9uRXJyb3IobWVzc2FnZSwgcmV0cnksIHBhZ2VTZWxlY3Rvcik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBrZXlib2FyZElucHV0KHJhY3RpdmVFdmVudCkge1xuICAgICAgICBpZiAoJChyb290RWxlbWVudChyYWN0aXZlKSkuaGFzQ2xhc3MoJ2FudGVubmEtcGFnZS1hY3RpdmUnKSkgeyAvLyBvbmx5IGhhbmRsZSBpbnB1dCB3aGVuIHRoaXMgcGFnZSBpcyBhY3RpdmVcbiAgICAgICAgICAgICQocm9vdEVsZW1lbnQocmFjdGl2ZSkpLmZpbmQoJy5hbnRlbm5hLWRlZmF1bHRzLWZvb3RlciBpbnB1dCcpLmZvY3VzKCk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIHJvb3RFbGVtZW50KHJhY3RpdmUpIHtcbiAgICByZXR1cm4gcmFjdGl2ZS5maW5kKHBhZ2VTZWxlY3Rvcik7XG59XG5cbmZ1bmN0aW9uIGFycmF5QWNjZXNzb3IoYXJyYXkpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oaW5kZXgpIHtcbiAgICAgICAgcmV0dXJuIGFycmF5W2luZGV4XTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGN1c3RvbVJlYWN0aW9uRm9jdXMocmFjdGl2ZUV2ZW50KSB7XG4gICAgdmFyICRmb290ZXIgPSAkKHJhY3RpdmVFdmVudC5vcmlnaW5hbC50YXJnZXQpLmNsb3Nlc3QoJy5hbnRlbm5hLWRlZmF1bHRzLWZvb3RlcicpO1xuICAgICRmb290ZXIuZmluZCgnaW5wdXQnKS5ub3QoJy5hY3RpdmUnKS52YWwoJycpLmFkZENsYXNzKCdhY3RpdmUnKTtcbiAgICAkZm9vdGVyLmZpbmQoJ2J1dHRvbicpLnNob3coKTtcbn1cblxuZnVuY3Rpb24gY3VzdG9tUmVhY3Rpb25CbHVyKHJhY3RpdmVFdmVudCkge1xuICAgIHZhciBldmVudCA9IHJhY3RpdmVFdmVudC5vcmlnaW5hbDtcbiAgICBpZiAoJChldmVudC5yZWxhdGVkVGFyZ2V0KS5jbG9zZXN0KCcuYW50ZW5uYS1kZWZhdWx0cy1mb290ZXIgYnV0dG9uJykuc2l6ZSgpID09IDApIHsgLy8gRG9uJ3QgaGlkZSB0aGUgaW5wdXQgd2hlbiB3ZSBjbGljayBvbiB0aGUgYnV0dG9uXG4gICAgICAgIHZhciAkZm9vdGVyID0gJChldmVudC50YXJnZXQpLmNsb3Nlc3QoJy5hbnRlbm5hLWRlZmF1bHRzLWZvb3RlcicpO1xuICAgICAgICB2YXIgaW5wdXQgPSAkZm9vdGVyLmZpbmQoJ2lucHV0Jyk7XG4gICAgICAgIGlmIChpbnB1dC52YWwoKSA9PT0gJycpIHtcbiAgICAgICAgICAgICRmb290ZXIuZmluZCgnYnV0dG9uJykuaGlkZSgpO1xuICAgICAgICAgICAgdmFyICRpbnB1dCA9ICRmb290ZXIuZmluZCgnaW5wdXQnKTtcbiAgICAgICAgICAgIC8vIFJlc2V0IHRoZSBpbnB1dCB2YWx1ZSB0byB0aGUgZGVmYXVsdCBpbiB0aGUgaHRtbC90ZW1wbGF0ZVxuICAgICAgICAgICAgJGlucHV0LnZhbCgkaW5wdXQuYXR0cigndmFsdWUnKSkucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBjcmVhdGVSZWFjdGlvblByb3ZpZGVyKCkge1xuXG4gICAgdmFyIGxvYWRlZFJlYWN0aW9uO1xuICAgIHZhciBjYWxsYmFja3MgPSBbXTtcblxuICAgIGZ1bmN0aW9uIG9uUmVhY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgY2FsbGJhY2tzLnB1c2goY2FsbGJhY2spO1xuICAgICAgICBub3RpZnlJZlJlYWR5KCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcmVhY3Rpb25Mb2FkZWQocmVhY3Rpb24pIHtcbiAgICAgICAgbG9hZGVkUmVhY3Rpb24gPSByZWFjdGlvbjtcbiAgICAgICAgbm90aWZ5SWZSZWFkeSgpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG5vdGlmeUlmUmVhZHkoKSB7XG4gICAgICAgIGlmIChsb2FkZWRSZWFjdGlvbikge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjYWxsYmFja3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFja3NbaV0obG9hZGVkUmVhY3Rpb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FsbGJhY2tzID0gW107XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBnZXQ6IG9uUmVhY3Rpb24sIC8vIFRPRE8gdGVybWlub2xvZ3lcbiAgICAgICAgcmVhY3Rpb25Mb2FkZWQ6IHJlYWN0aW9uTG9hZGVkXG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlOiBjcmVhdGVQYWdlXG59OyIsInZhciBBamF4Q2xpZW50ID0gcmVxdWlyZSgnLi91dGlscy9hamF4LWNsaWVudCcpO1xudmFyIEJyb3dzZXJNZXRyaWNzID0gcmVxdWlyZSgnLi91dGlscy9icm93c2VyLW1ldHJpY3MnKTtcbnZhciBVc2VyID0gcmVxdWlyZSgnLi91dGlscy91c2VyJyk7XG5cbmZ1bmN0aW9uIHBvc3RHcm91cFNldHRpbmdzTG9hZGVkKGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgZXZlbnQgPSBjcmVhdGVFdmVudChldmVudFR5cGVzLnNjcmlwdExvYWQsICcnLCBncm91cFNldHRpbmdzKTtcbiAgICBldmVudFthdHRyaWJ1dGVzLnBhZ2VJZF0gPSAnbmEnO1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMuYXJ0aWNsZUhlaWdodF0gPSAnbmEnO1xuICAgIHBvc3RFdmVudChldmVudCk7XG59XG5cbmZ1bmN0aW9uIHBvc3RQYWdlRGF0YUxvYWRlZChwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBldmVudCA9IGNyZWF0ZUV2ZW50KGV2ZW50VHlwZXMucGFnZURhdGFMb2FkZWQsICcnLCBncm91cFNldHRpbmdzKTtcbiAgICBhcHBlbmRQYWdlRGF0YVBhcmFtcyhldmVudCwgcGFnZURhdGEpO1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMuY29udGVudEF0dHJpYnV0ZXNdID0gcGFnZURhdGEubWV0cmljcy5pc011bHRpUGFnZSA/IGV2ZW50VmFsdWVzLm11bHRpcGxlUGFnZXMgOiBldmVudFZhbHVlcy5zaW5nbGVQYWdlO1xuICAgIHBvc3RFdmVudChldmVudCk7XG59XG5cbmZ1bmN0aW9uIHBvc3RSZWFjdGlvbldpZGdldE9wZW5lZChpc1Nob3dSZWFjdGlvbnMsIHBhZ2VEYXRhLCBjb250YWluZXJEYXRhLCBjb250ZW50RGF0YSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBldmVudFZhbHVlID0gaXNTaG93UmVhY3Rpb25zID8gZXZlbnRWYWx1ZXMuc2hvd1JlYWN0aW9ucyA6IGV2ZW50VmFsdWVzLnNob3dEZWZhdWx0cztcbiAgICB2YXIgZXZlbnQgPSBjcmVhdGVFdmVudChldmVudFR5cGVzLnJlYWN0aW9uV2lkZ2V0T3BlbmVkLCBldmVudFZhbHVlLCBncm91cFNldHRpbmdzKTtcbiAgICBhcHBlbmRQYWdlRGF0YVBhcmFtcyhldmVudCwgcGFnZURhdGEpO1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMuY29udGFpbmVySGFzaF0gPSBjb250YWluZXJEYXRhLmhhc2g7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5jb250YWluZXJLaW5kXSA9IGNvbnRlbnREYXRhLnR5cGU7XG4gICAgcG9zdEV2ZW50KGV2ZW50KTtcbn1cblxuZnVuY3Rpb24gcG9zdFN1bW1hcnlPcGVuZWQoaXNTaG93UmVhY3Rpb25zLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBldmVudFZhbHVlID0gaXNTaG93UmVhY3Rpb25zID8gZXZlbnRWYWx1ZXMudmlld1JlYWN0aW9ucyA6IGV2ZW50VmFsdWVzLnZpZXdEZWZhdWx0cztcbiAgICB2YXIgZXZlbnQgPSBjcmVhdGVFdmVudChldmVudFR5cGVzLnN1bW1hcnlXaWRnZXQsIGV2ZW50VmFsdWUsIGdyb3VwU2V0dGluZ3MpO1xuICAgIGFwcGVuZFBhZ2VEYXRhUGFyYW1zKGV2ZW50LCBwYWdlRGF0YSk7XG4gICAgcG9zdEV2ZW50KGV2ZW50KTtcbn1cblxuZnVuY3Rpb24gcG9zdFJlYWN0aW9uQ3JlYXRlZChwYWdlRGF0YSwgY29udGFpbmVyRGF0YSwgcmVhY3Rpb25EYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGV2ZW50ID0gY3JlYXRlRXZlbnQoZXZlbnRUeXBlcy5yZWFjdGlvbkNyZWF0ZWQsIHJlYWN0aW9uRGF0YS50ZXh0LCBncm91cFNldHRpbmdzKTtcbiAgICBhcHBlbmRQYWdlRGF0YVBhcmFtcyhldmVudCwgcGFnZURhdGEpO1xuICAgIGFwcGVuZENvbnRhaW5lckRhdGFQYXJhbXMoZXZlbnQsIGNvbnRhaW5lckRhdGEpO1xuICAgIGFwcGVuZFJlYWN0aW9uRGF0YVBhcmFtcyhldmVudCwgcmVhY3Rpb25EYXRhKTtcbiAgICBwb3N0RXZlbnQoZXZlbnQpO1xufVxuXG5mdW5jdGlvbiBwb3N0UmVhY3Rpb25TaGFyZWQodGFyZ2V0LCBwYWdlRGF0YSwgY29udGFpbmVyRGF0YSwgcmVhY3Rpb25EYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGV2ZW50VmFsdWUgPSB0YXJnZXQ7IC8vICdmYWNlYm9vaycsICd0d2l0dGVyJywgZXRjXG4gICAgdmFyIGV2ZW50ID0gY3JlYXRlRXZlbnQoZXZlbnRUeXBlcy5yZWFjdGlvblNoYXJlZCwgZXZlbnRWYWx1ZSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgYXBwZW5kUGFnZURhdGFQYXJhbXMoZXZlbnQsIHBhZ2VEYXRhKTtcbiAgICBhcHBlbmRDb250YWluZXJEYXRhUGFyYW1zKGV2ZW50LCBjb250YWluZXJEYXRhKTtcbiAgICBhcHBlbmRSZWFjdGlvbkRhdGFQYXJhbXMoZXZlbnQsIHJlYWN0aW9uRGF0YSk7XG4gICAgcG9zdEV2ZW50KGV2ZW50KTtcbn1cblxuZnVuY3Rpb24gcG9zdExvY2F0aW9uc1ZpZXdlZChwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBldmVudCA9IGNyZWF0ZUV2ZW50KGV2ZW50VHlwZXMuc3VtbWFyeVdpZGdldCwgZXZlbnRWYWx1ZXMubG9jYXRpb25zVmlld2VkLCBncm91cFNldHRpbmdzKTtcbiAgICBhcHBlbmRQYWdlRGF0YVBhcmFtcyhldmVudCwgcGFnZURhdGEpO1xuICAgIHBvc3RFdmVudChldmVudCk7XG59XG5cbmZ1bmN0aW9uIHBvc3RDb250ZW50Vmlld2VkKHBhZ2VEYXRhLCBjb250YWluZXJEYXRhLCBsb2NhdGlvbkRhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgZXZlbnQgPSBjcmVhdGVFdmVudChldmVudFR5cGVzLnN1bW1hcnlXaWRnZXQsIGV2ZW50VmFsdWVzLmNvbnRlbnRWaWV3ZWQsIGdyb3VwU2V0dGluZ3MpO1xuICAgIGFwcGVuZFBhZ2VEYXRhUGFyYW1zKGV2ZW50LCBwYWdlRGF0YSk7XG4gICAgYXBwZW5kQ29udGFpbmVyRGF0YVBhcmFtcyhldmVudCwgY29udGFpbmVyRGF0YSk7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5jb250ZW50SWRdID0gbG9jYXRpb25EYXRhLmNvbnRlbnRJZDtcbiAgICBldmVudFthdHRyaWJ1dGVzLmNvbnRlbnRMb2NhdGlvbl0gPSBsb2NhdGlvbkRhdGEubG9jYXRpb247XG4gICAgcG9zdEV2ZW50KGV2ZW50KTtcbn1cblxuZnVuY3Rpb24gcG9zdENvbW1lbnRzVmlld2VkKHBhZ2VEYXRhLCBjb250YWluZXJEYXRhLCByZWFjdGlvbkRhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgZXZlbnQgPSBjcmVhdGVFdmVudChldmVudFR5cGVzLmNvbW1lbnRzVmlld2VkLCAnJywgZ3JvdXBTZXR0aW5ncyk7XG4gICAgYXBwZW5kUGFnZURhdGFQYXJhbXMoZXZlbnQsIHBhZ2VEYXRhKTtcbiAgICBhcHBlbmRDb250YWluZXJEYXRhUGFyYW1zKGV2ZW50LCBjb250YWluZXJEYXRhKTtcbiAgICBhcHBlbmRSZWFjdGlvbkRhdGFQYXJhbXMoZXZlbnQsIHJlYWN0aW9uRGF0YSk7XG4gICAgcG9zdEV2ZW50KGV2ZW50KTtcbn1cblxuZnVuY3Rpb24gcG9zdENvbW1lbnRDcmVhdGVkKHBhZ2VEYXRhLCBjb250YWluZXJEYXRhLCByZWFjdGlvbkRhdGEsIGNvbW1lbnQsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgZXZlbnQgPSBjcmVhdGVFdmVudChldmVudFR5cGVzLmNvbW1lbnRDcmVhdGVkLCBjb21tZW50LCBncm91cFNldHRpbmdzKTtcbiAgICBhcHBlbmRQYWdlRGF0YVBhcmFtcyhldmVudCwgcGFnZURhdGEpO1xuICAgIGFwcGVuZENvbnRhaW5lckRhdGFQYXJhbXMoZXZlbnQsIGNvbnRhaW5lckRhdGEpO1xuICAgIGFwcGVuZFJlYWN0aW9uRGF0YVBhcmFtcyhldmVudCwgcmVhY3Rpb25EYXRhKTtcbiAgICBwb3N0RXZlbnQoZXZlbnQpO1xufVxuXG5mdW5jdGlvbiBwb3N0UmVjaXJjQ2xpY2tlZChwYWdlRGF0YSwgcmVhY3Rpb25JZCwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBldmVudCA9IGNyZWF0ZUV2ZW50KGV2ZW50VHlwZXMucmVjaXJjQ2xpY2tlZCwgcmVhY3Rpb25JZCwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgYXBwZW5kUGFnZURhdGFQYXJhbXMoZXZlbnQsIHBhZ2VEYXRhKTtcbiAgICBwb3N0RXZlbnQoZXZlbnQpO1xufVxuXG5mdW5jdGlvbiBhcHBlbmRQYWdlRGF0YVBhcmFtcyhldmVudCwgcGFnZURhdGEpIHtcbiAgICBldmVudFthdHRyaWJ1dGVzLnBhZ2VJZF0gPSBwYWdlRGF0YS5wYWdlSWQ7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5wYWdlVGl0bGVdID0gcGFnZURhdGEudGl0bGU7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5jYW5vbmljYWxVcmxdID0gcGFnZURhdGEuY2Fub25pY2FsVXJsO1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMucGFnZVVybF0gPSBwYWdlRGF0YS5yZXF1ZXN0ZWRVcmw7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5hcnRpY2xlSGVpZ2h0XSA9IDAgfHwgcGFnZURhdGEubWV0cmljcy5oZWlnaHQ7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5wYWdlVG9waWNzXSA9IHBhZ2VEYXRhLnRvcGljcztcbiAgICBldmVudFthdHRyaWJ1dGVzLmF1dGhvcl0gPSBwYWdlRGF0YS5hdXRob3I7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5zaXRlU2VjdGlvbl0gPSBwYWdlRGF0YS5zZWN0aW9uO1xufVxuXG5mdW5jdGlvbiBhcHBlbmRDb250YWluZXJEYXRhUGFyYW1zKGV2ZW50LCBjb250YWluZXJEYXRhKSB7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5jb250YWluZXJIYXNoXSA9IGNvbnRhaW5lckRhdGEuaGFzaDtcbiAgICBldmVudFthdHRyaWJ1dGVzLmNvbnRhaW5lcktpbmRdID0gY29udGFpbmVyRGF0YS50eXBlO1xufVxuXG5mdW5jdGlvbiBhcHBlbmRSZWFjdGlvbkRhdGFQYXJhbXMoZXZlbnQsIHJlYWN0aW9uRGF0YSkge1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMucmVhY3Rpb25Cb2R5XSA9IHJlYWN0aW9uRGF0YS50ZXh0O1xuICAgIGlmIChyZWFjdGlvbkRhdGEuY29udGVudCkge1xuICAgICAgICBldmVudFthdHRyaWJ1dGVzLmNvbnRlbnRMb2NhdGlvbl0gPSByZWFjdGlvbkRhdGEuY29udGVudC5sb2NhdGlvbjtcbiAgICAgICAgZXZlbnRbYXR0cmlidXRlcy5jb250ZW50SWRdID0gcmVhY3Rpb25EYXRhLmNvbnRlbnQuaWQ7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBjcmVhdGVFdmVudChldmVudFR5cGUsIGV2ZW50VmFsdWUsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgcmVmZXJyZXJEb21haW4gPSBkb2N1bWVudC5yZWZlcnJlci5zcGxpdCgnLycpLnNwbGljZSgyKS5qb2luKCcvJyk7IC8vIFRPRE86IGVuZ2FnZV9mdWxsIGNvZGUuIFJldmlld1xuXG4gICAgdmFyIGV2ZW50ID0ge307XG4gICAgZXZlbnRbYXR0cmlidXRlcy5ldmVudFR5cGVdID0gZXZlbnRUeXBlO1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMuZXZlbnRWYWx1ZV0gPSBldmVudFZhbHVlO1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMuZ3JvdXBJZF0gPSBncm91cFNldHRpbmdzLmdyb3VwSWQoKTtcbiAgICBldmVudFthdHRyaWJ1dGVzLnNob3J0VGVybVNlc3Npb25dID0gZ2V0U2hvcnRUZXJtU2Vzc2lvbklkKCk7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5sb25nVGVybVNlc3Npb25dID0gZ2V0TG9uZ1Rlcm1TZXNzaW9uSWQoKTtcbiAgICBldmVudFthdHRyaWJ1dGVzLnJlZmVycmVyVXJsXSA9IHJlZmVycmVyRG9tYWluO1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMuaXNUb3VjaEJyb3dzZXJdID0gQnJvd3Nlck1ldHJpY3Muc3VwcG9ydHNUb3VjaCgpO1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMuc2NyZWVuV2lkdGhdID0gc2NyZWVuLndpZHRoO1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMuc2NyZWVuSGVpZ2h0XSA9IHNjcmVlbi5oZWlnaHQ7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5waXhlbERlbnNpdHldID0gd2luZG93LmRldmljZVBpeGVsUmF0aW8gfHwgTWF0aC5yb3VuZCh3aW5kb3cuc2NyZWVuLmF2YWlsV2lkdGggLyBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50V2lkdGgpOyAvLyBUT0RPOiByZXZpZXcgdGhpcyBlbmdhZ2VfZnVsbCBjb2RlLCB3aGljaCBkb2Vzbid0IHNlZW0gY29ycmVjdFxuICAgIGV2ZW50W2F0dHJpYnV0ZXMudXNlckFnZW50XSA9IG5hdmlnYXRvci51c2VyQWdlbnQ7XG4gICAgcmV0dXJuIGV2ZW50O1xufVxuXG5mdW5jdGlvbiBwb3N0RXZlbnQoZXZlbnQpIHtcbiAgICBVc2VyLmNhY2hlZFVzZXIoZnVuY3Rpb24odXNlckluZm8pIHsgLy8gV2UgZG9uJ3Qgd2FudCB0byBjcmVhdGUgdXNlcnMganVzdCBmb3IgZXZlbnRzIChlLmcuIGV2ZXJ5IHNjcmlwdCBsb2FkKSwgYnV0IGFkZCB1c2VyIGluZm8gaWYgd2UgaGF2ZSBpdCBhbHJlYWR5LlxuICAgICAgICBpZiAodXNlckluZm8pIHtcbiAgICAgICAgICAgIGV2ZW50W2F0dHJpYnV0ZXMudXNlcklkXSA9IHVzZXJJbmZvLnVzZXJfaWQ7XG4gICAgICAgIH1cbiAgICAgICAgZmlsbEluTWlzc2luZ1Byb3BlcnRpZXMoZXZlbnQpO1xuICAgICAgICAvLyBTZW5kIHRoZSBldmVudCB0byBCaWdRdWVyeVxuICAgICAgICBBamF4Q2xpZW50LnBvc3RFdmVudChldmVudCk7XG4gICAgfSk7XG59XG5cbi8vIEZpbGwgaW4gYW55IG9wdGlvbmFsIHByb3BlcnRpZXMgd2l0aCBudWxsIHZhbHVlcy5cbmZ1bmN0aW9uIGZpbGxJbk1pc3NpbmdQcm9wZXJ0aWVzKGV2ZW50KSB7XG4gICAgZm9yICh2YXIgYXR0ciBpbiBhdHRyaWJ1dGVzKSB7XG4gICAgICAgIGlmIChldmVudFthdHRyaWJ1dGVzW2F0dHJdXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBldmVudFthdHRyaWJ1dGVzW2F0dHJdXSA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGdldExvbmdUZXJtU2Vzc2lvbklkKCkge1xuICAgIHZhciBndWlkID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ2FudF9sdHMnKTtcbiAgICBpZiAoIWd1aWQpIHtcbiAgICAgICAgZ3VpZCA9IGNyZWF0ZUd1aWQoKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdhbnRfbHRzJywgZ3VpZCk7XG4gICAgICAgIH0gY2F0Y2goZXJyb3IpIHtcbiAgICAgICAgICAgIC8vIFNvbWUgYnJvd3NlcnMgKG1vYmlsZSBTYWZhcmkpIHRocm93IGFuIGV4Y2VwdGlvbiB3aGVuIGluIHByaXZhdGUgYnJvd3NpbmcgbW9kZS5cbiAgICAgICAgICAgIC8vIE5vdGhpbmcgd2UgY2FuIGRvIGFib3V0IGl0LiBKdXN0IGZhbGwgdGhyb3VnaCBhbmQgcmV0dXJuIHRoZSB2YWx1ZSB3ZSBnZW5lcmF0ZWQuXG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGd1aWQ7XG59XG5cbmZ1bmN0aW9uIGdldFNob3J0VGVybVNlc3Npb25JZCgpIHtcbiAgICB2YXIgc2Vzc2lvbjtcbiAgICB2YXIganNvbiA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdhbnRfc3RzJyk7XG4gICAgaWYgKGpzb24pIHtcbiAgICAgICAgc2Vzc2lvbiA9IEpTT04ucGFyc2UoanNvbik7XG4gICAgICAgIGlmIChEYXRlLm5vdygpID4gc2Vzc2lvbi5leHBpcmVzKSB7XG4gICAgICAgICAgICBzZXNzaW9uID0gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAoIXNlc3Npb24pIHtcbiAgICAgICAgdmFyIG1pbnV0ZXMgPSAxNTtcbiAgICAgICAgc2Vzc2lvbiA9IHtcbiAgICAgICAgICAgIGd1aWQ6IGNyZWF0ZUd1aWQoKSxcbiAgICAgICAgICAgIGV4cGlyZXM6IERhdGUubm93KCkgKyBtaW51dGVzICogNjAwMDBcbiAgICAgICAgfTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2FudF9zdHMnLCBKU09OLnN0cmluZ2lmeShzZXNzaW9uKSk7XG4gICAgfSBjYXRjaChlcnJvcikge1xuICAgICAgICAvLyBTb21lIGJyb3dzZXJzIChtb2JpbGUgU2FmYXJpKSB0aHJvdyBhbiBleGNlcHRpb24gd2hlbiBpbiBwcml2YXRlIGJyb3dzaW5nIG1vZGUuXG4gICAgICAgIC8vIE5vdGhpbmcgd2UgY2FuIGRvIGFib3V0IGl0LiBKdXN0IGZhbGwgdGhyb3VnaCBhbmQgcmV0dXJuIHRoZSB2YWx1ZSB3ZSBnZW5lcmF0ZWQuXG4gICAgfVxuICAgIHJldHVybiBzZXNzaW9uLmd1aWQ7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUd1aWQoKSB7XG4gICAgLy8gQ29kZSBjb3BpZWQgZnJvbSBlbmdhZ2VfZnVsbCAob3JpZ2luYWxseSwgaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xMDUwMzQvY3JlYXRlLWd1aWQtdXVpZC1pbi1qYXZhc2NyaXB0KVxuICAgIHJldHVybiAneHh4eHh4eHgteHh4eC00eHh4LXl4eHgteHh4eHh4eHh4eHh4Jy5yZXBsYWNlKC9beHldL2csIGZ1bmN0aW9uIChjKSB7XG4gICAgICAgIHZhciByID0gTWF0aC5yYW5kb20oKSAqIDE2IHwgMCwgdiA9IGMgPT0gJ3gnID8gciA6IChyICYgMHgzIHwgMHg4KTtcbiAgICAgICAgcmV0dXJuIHYudG9TdHJpbmcoMTYpO1xuICAgIH0pO1xufVxuXG52YXIgYXR0cmlidXRlcyA9IHtcbiAgICBldmVudFR5cGU6ICdldCcsXG4gICAgZXZlbnRWYWx1ZTogJ2V2JyxcbiAgICBncm91cElkOiAnZ2lkJyxcbiAgICB1c2VySWQ6ICd1aWQnLFxuICAgIHBhZ2VJZDogJ3BpZCcsXG4gICAgbG9uZ1Rlcm1TZXNzaW9uOiAnbHRzJyxcbiAgICBzaG9ydFRlcm1TZXNzaW9uOiAnc3RzJyxcbiAgICByZWZlcnJlclVybDogJ3JlZicsXG4gICAgY29udGVudElkOiAnY2lkJyxcbiAgICBhcnRpY2xlSGVpZ2h0OiAnYWgnLFxuICAgIGNvbnRhaW5lckhhc2g6ICdjaCcsXG4gICAgY29udGFpbmVyS2luZDogJ2NrJyxcbiAgICByZWFjdGlvbkJvZHk6ICdyJyxcbiAgICBwYWdlVGl0bGU6ICdwdCcsXG4gICAgY2Fub25pY2FsVXJsOiAnY3UnLFxuICAgIHBhZ2VVcmw6ICdwdScsXG4gICAgY29udGVudEF0dHJpYnV0ZXM6ICdjYScsXG4gICAgY29udGVudExvY2F0aW9uOiAnY2wnLFxuICAgIHBhZ2VUb3BpY3M6ICdwdG9wJyxcbiAgICBhdXRob3I6ICdhJyxcbiAgICBzaXRlU2VjdGlvbjogJ3NlYycsXG4gICAgaXNUb3VjaEJyb3dzZXI6ICdpdCcsXG4gICAgc2NyZWVuV2lkdGg6ICdzdycsXG4gICAgc2NyZWVuSGVpZ2h0OiAnc2gnLFxuICAgIHBpeGVsRGVuc2l0eTogJ3BkJyxcbiAgICB1c2VyQWdlbnQ6ICd1YSdcbn07XG5cbnZhciBldmVudFR5cGVzID0ge1xuICAgIHNjcmlwdExvYWQ6ICdzbCcsXG4gICAgcmVhY3Rpb25TaGFyZWQ6ICdzaCcsXG4gICAgc3VtbWFyeVdpZGdldDogJ3NiJyxcbiAgICByZWFjdGlvbldpZGdldE9wZW5lZDogJ3JzJyxcbiAgICBwYWdlRGF0YUxvYWRlZDogJ3dsJyxcbiAgICBjb21tZW50Q3JlYXRlZDogJ2MnLFxuICAgIHJlYWN0aW9uQ3JlYXRlZDogJ3JlJyxcbiAgICBjb21tZW50c1ZpZXdlZDogJ3Zjb20nLFxuICAgIHJlY2lyY0NsaWNrZWQ6ICdyYydcbn07XG5cbnZhciBldmVudFZhbHVlcyA9IHtcbiAgICBjb250ZW50Vmlld2VkOiAndmMnLCAvLyB2aWV3X2NvbnRlbnRcbiAgICBsb2NhdGlvbnNWaWV3ZWQ6ICd2cicsIC8vIHZpZXdfcmVhY3Rpb25zXG4gICAgc2hvd0RlZmF1bHRzOiAnd3InLFxuICAgIHNob3dSZWFjdGlvbnM6ICdyZCcsXG4gICAgc2luZ2xlUGFnZTogJ3NpJyxcbiAgICBtdWx0aXBsZVBhZ2VzOiAnbXUnLFxuICAgIHZpZXdSZWFjdGlvbnM6ICd2dycsXG4gICAgdmlld0RlZmF1bHRzOiAnYWQnXG59O1xuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgcG9zdEdyb3VwU2V0dGluZ3NMb2FkZWQ6IHBvc3RHcm91cFNldHRpbmdzTG9hZGVkLFxuICAgIHBvc3RQYWdlRGF0YUxvYWRlZDogcG9zdFBhZ2VEYXRhTG9hZGVkLFxuICAgIHBvc3RTdW1tYXJ5T3BlbmVkOiBwb3N0U3VtbWFyeU9wZW5lZCxcbiAgICBwb3N0Q29tbWVudHNWaWV3ZWQ6IHBvc3RDb21tZW50c1ZpZXdlZCxcbiAgICBwb3N0Q29tbWVudENyZWF0ZWQ6IHBvc3RDb21tZW50Q3JlYXRlZCxcbiAgICBwb3N0UmVhY3Rpb25XaWRnZXRPcGVuZWQ6IHBvc3RSZWFjdGlvbldpZGdldE9wZW5lZCxcbiAgICBwb3N0UmVhY3Rpb25DcmVhdGVkOiBwb3N0UmVhY3Rpb25DcmVhdGVkLFxuICAgIHBvc3RSZWFjdGlvblNoYXJlZDogcG9zdFJlYWN0aW9uU2hhcmVkLFxuICAgIHBvc3RMb2NhdGlvbnNWaWV3ZWQ6IHBvc3RMb2NhdGlvbnNWaWV3ZWQsXG4gICAgcG9zdENvbnRlbnRWaWV3ZWQ6IHBvc3RDb250ZW50Vmlld2VkLFxuICAgIHBvc3RSZWNpcmNDbGlja2VkOiBwb3N0UmVjaXJjQ2xpY2tlZFxufTsiLCJ2YXIgUmFjdGl2ZTsgcmVxdWlyZSgnLi91dGlscy9yYWN0aXZlLXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGxvYWRlZFJhY3RpdmUpIHsgUmFjdGl2ZSA9IGxvYWRlZFJhY3RpdmU7fSk7XG52YXIgU1ZHcyA9IHJlcXVpcmUoJy4vc3ZncycpO1xuXG52YXIgcGFnZVNlbGVjdG9yID0gJy5hbnRlbm5hLWVycm9yLXBhZ2UnO1xuXG5mdW5jdGlvbiBjcmVhdGVQYWdlKG9wdGlvbnMpIHtcbiAgICB2YXIgZWxlbWVudCA9IG9wdGlvbnMuZWxlbWVudDtcbiAgICB2YXIgZ29CYWNrID0gb3B0aW9ucy5nb0JhY2s7XG4gICAgdmFyIHJhY3RpdmUgPSBSYWN0aXZlKHtcbiAgICAgICAgZWw6IGVsZW1lbnQsXG4gICAgICAgIGFwcGVuZDogdHJ1ZSxcbiAgICAgICAgZGF0YToge30sXG4gICAgICAgIHRlbXBsYXRlOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvZ2VuZXJpYy1lcnJvci1wYWdlLmhicy5odG1sJyksXG4gICAgICAgIHBhcnRpYWxzOiB7XG4gICAgICAgICAgICBsZWZ0OiBTVkdzLmxlZnRcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJhY3RpdmUub24oJ2JhY2snLCBnb0JhY2spO1xuICAgIHJldHVybiB7XG4gICAgICAgIHNlbGVjdG9yOiBwYWdlU2VsZWN0b3IsXG4gICAgICAgIHRlYXJkb3duOiBmdW5jdGlvbigpIHsgcmFjdGl2ZS50ZWFyZG93bigpOyB9XG4gICAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlUGFnZTogY3JlYXRlUGFnZVxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi91dGlscy9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciBBamF4Q2xpZW50ID0gcmVxdWlyZSgnLi91dGlscy9hamF4LWNsaWVudCcpO1xudmFyIFVSTHMgPSByZXF1aXJlKCcuL3V0aWxzL3VybHMnKTtcbnZhciBHcm91cFNldHRpbmdzID0gcmVxdWlyZSgnLi9ncm91cC1zZXR0aW5ncycpO1xuXG4vLyBUT0RPIGZvbGQgdGhpcyBtb2R1bGUgaW50byBncm91cC1zZXR0aW5ncz9cblxuZnVuY3Rpb24gbG9hZFNldHRpbmdzKGNhbGxiYWNrKSB7XG4gICAgQWpheENsaWVudC5nZXRKU09OUChVUkxzLmdyb3VwU2V0dGluZ3NVcmwoKSwgeyBob3N0X25hbWU6IHdpbmRvdy5hbnRlbm5hX2hvc3QgfSwgc3VjY2VzcywgZXJyb3IpO1xuXG4gICAgZnVuY3Rpb24gc3VjY2Vzcyhqc29uKSB7XG4gICAgICAgIHZhciBncm91cFNldHRpbmdzID0gR3JvdXBTZXR0aW5ncy5jcmVhdGUoanNvbik7XG4gICAgICAgIGNhbGxiYWNrKGdyb3VwU2V0dGluZ3MpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGVycm9yKG1lc3NhZ2UpIHtcbiAgICAgICAgLy8gVE9ETyBoYW5kbGUgZXJyb3JzIHRoYXQgaGFwcGVuIHdoZW4gbG9hZGluZyBjb25maWcgZGF0YVxuICAgICAgICBjb25zb2xlLmxvZygnQW4gZXJyb3Igb2NjdXJyZWQgbG9hZGluZyBncm91cCBzZXR0aW5nczogJyArIG1lc3NhZ2UpO1xuICAgIH1cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGxvYWQ6IGxvYWRTZXR0aW5nc1xufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi91dGlscy9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcblxudmFyIEV2ZW50cyA9IHJlcXVpcmUoJy4vZXZlbnRzJyk7XG5cbnZhciBncm91cFNldHRpbmdzO1xuXG4vLyBUT0RPOiBVcGRhdGUgYWxsIGNsaWVudHMgdGhhdCBhcmUgcGFzc2luZyBhcm91bmQgYSBncm91cFNldHRpbmdzIG9iamVjdCB0byBpbnN0ZWFkIGFjY2VzcyB0aGUgJ2dsb2JhbCcgc2V0dGluZ3MgaW5zdGFuY2VcbmZ1bmN0aW9uIGdldEdyb3VwU2V0dGluZ3MoKSB7XG4gICAgcmV0dXJuIGdyb3VwU2V0dGluZ3M7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZUZyb21KU09OKGpzb24pIHtcbiAgICBncm91cFNldHRpbmdzID0gY3JlYXRlRnJvbUpTT04oanNvbik7XG4gICAgRXZlbnRzLnBvc3RHcm91cFNldHRpbmdzTG9hZGVkKGdyb3VwU2V0dGluZ3MpO1xuICAgIHJldHVybiBncm91cFNldHRpbmdzO1xufVxuXG5cbi8vIFRPRE86IHRyaW0gdHJhaWxpbmcgY29tbWFzIGZyb20gYW55IHNlbGVjdG9yIHZhbHVlc1xuXG4vLyBUT0RPOiBSZXZpZXcuIFRoZXNlIGFyZSBqdXN0IGNvcGllZCBmcm9tIGVuZ2FnZV9mdWxsLlxudmFyIGRlZmF1bHRzID0ge1xuICAgIHByZW1pdW06IGZhbHNlLFxuICAgIGltZ19zZWxlY3RvcjogXCJpbWdcIiwgLy8gVE9ETzogdGhpcyBpcyBzb21lIGJvZ3VzIG9ic29sZXRlIHByb3BlcnR5LiB3ZSBzaG91bGRuJ3QgdXNlIGl0LlxuICAgIGltZ19jb250YWluZXJfc2VsZWN0b3JzOlwiI3ByaW1hcnktcGhvdG9cIixcbiAgICBhY3RpdmVfc2VjdGlvbnM6IFwiYm9keVwiLFxuICAgIC8vYW5ub193aGl0ZWxpc3Q6IFwiYm9keSBwXCIsXG4gICAgYW5ub193aGl0ZWxpc3Q6IFwicFwiLCAvLyBUT0RPOiBUaGUgY3VycmVudCBkZWZhdWx0IGlzIFwiYm9keSBwXCIsIHdoaWNoIG1ha2VzIG5vIHNlbnNlIHdoZW4gd2UncmUgc2VhcmNoaW5nIG9ubHkgd2l0aGluIHRoZSBhY3RpdmUgc2VjdGlvbnNcbiAgICBhY3RpdmVfc2VjdGlvbnNfd2l0aF9hbm5vX3doaXRlbGlzdDpcIlwiLFxuICAgIG1lZGlhX3NlbGVjdG9yOiBcImVtYmVkLCB2aWRlbywgb2JqZWN0LCBpZnJhbWVcIixcbiAgICBjb21tZW50X2xlbmd0aDogNTAwLFxuICAgIG5vX2FudDogXCJcIixcbiAgICBpbWdfYmxhY2tsaXN0OiBcIlwiLFxuICAgIGN1c3RvbV9jc3M6IFwiXCIsXG4gICAgLy90b2RvOiB0ZW1wIGlubGluZV9pbmRpY2F0b3IgZGVmYXVsdHMgdG8gbWFrZSB0aGVtIHNob3cgdXAgb24gYWxsIG1lZGlhIC0gcmVtb3ZlIHRoaXMgbGF0ZXIuXG4gICAgaW5saW5lX3NlbGVjdG9yOiAnaW1nLCBlbWJlZCwgdmlkZW8sIG9iamVjdCwgaWZyYW1lJyxcbiAgICBwYXJhZ3JhcGhfaGVscGVyOiB0cnVlLFxuICAgIG1lZGlhX3VybF9pZ25vcmVfcXVlcnk6IHRydWUsXG4gICAgc3VtbWFyeV93aWRnZXRfc2VsZWN0b3I6ICcuYW50LXBhZ2Utc3VtbWFyeScsIC8vIFRPRE86IHRoaXMgd2Fzbid0IGRlZmluZWQgYXMgYSBkZWZhdWx0IGluIGVuZ2FnZV9mdWxsLCBidXQgd2FzIGluIGNvZGUuIHdoeT9cbiAgICBzdW1tYXJ5X3dpZGdldF9tZXRob2Q6ICdhZnRlcicsXG4gICAgbGFuZ3VhZ2U6ICdlbicsXG4gICAgYWJfdGVzdF9pbXBhY3Q6IHRydWUsXG4gICAgYWJfdGVzdF9zYW1wbGVfcGVyY2VudGFnZTogMTAsXG4gICAgaW1nX2luZGljYXRvcl9zaG93X29ubG9hZDogdHJ1ZSxcbiAgICBpbWdfaW5kaWNhdG9yX3Nob3dfc2lkZTogJ2xlZnQnLFxuICAgIHRhZ19ib3hfYmdfY29sb3JzOiAnJyxcbiAgICB0YWdfYm94X3RleHRfY29sb3JzOiAnJyxcbiAgICB0YWdfYm94X2ZvbnRfZmFtaWx5OiAnSGVsdmV0aWNhTmV1ZSxIZWx2ZXRpY2EsQXJpYWwsc2Fucy1zZXJpZicsXG4gICAgdGFnc19iZ19jc3M6ICcnLFxuICAgIGlnbm9yZV9zdWJkb21haW46IGZhbHNlLFxuICAgIGltYWdlX3NlbGVjdG9yOiAnbWV0YVtwcm9wZXJ0eT1cIm9nOmltYWdlXCJdJywgLy8gVE9ETzogcmV2aWV3IHdoYXQgdGhpcyBzaG91bGQgYmUgKG5vdCBmcm9tIGVuZ2FnZV9mdWxsKVxuICAgIGltYWdlX2F0dHJpYnV0ZTogJ2NvbnRlbnQnLCAvLyBUT0RPOiByZXZpZXcgd2hhdCB0aGlzIHNob3VsZCBiZSAobm90IGZyb20gZW5nYWdlX2Z1bGwpLFxuICAgIHF1ZXJ5c3RyaW5nX2NvbnRlbnQ6IGZhbHNlLFxuICAgIGluaXRpYWxfcGluX2xpbWl0OiAzLFxuICAgIC8vdGhlIHNjb3BlIGluIHdoaWNoIHRvIGZpbmQgcGFyZW50cyBvZiA8YnI+IHRhZ3MuXG4gICAgLy9UaG9zZSBwYXJlbnRzIHdpbGwgYmUgY29udmVydGVkIHRvIGEgPHJ0PiBibG9jaywgc28gdGhlcmUgd29uJ3QgYmUgbmVzdGVkIDxwPiBibG9ja3MuXG4gICAgLy90aGVuIGl0IHdpbGwgc3BsaXQgdGhlIHBhcmVudCdzIGh0bWwgb24gPGJyPiB0YWdzIGFuZCB3cmFwIHRoZSBzZWN0aW9ucyBpbiA8cD4gdGFncy5cblxuICAgIC8vZXhhbXBsZTpcbiAgICAvLyBicl9yZXBsYWNlX3Njb3BlX3NlbGVjdG9yOiBcIi5hbnRfYnJfcmVwbGFjZVwiIC8vZS5nLiBcIiNtYWluc2VjdGlvblwiIG9yIFwicFwiXG5cbiAgICBicl9yZXBsYWNlX3Njb3BlX3NlbGVjdG9yOiBudWxsIC8vZS5nLiBcIiNtYWluc2VjdGlvblwiIG9yIFwicFwiXG59O1xuXG5mdW5jdGlvbiBjcmVhdGVGcm9tSlNPTihqc29uKSB7XG5cbiAgICBmdW5jdGlvbiBkYXRhKGtleSwgaWZBYnNlbnQpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIHZhbHVlO1xuICAgICAgICAgICAgaWYgKHdpbmRvdy5hbnRlbm5hX2V4dGVuZCkge1xuICAgICAgICAgICAgICAgIHZhbHVlID0gd2luZG93LmFudGVubmFfZXh0ZW5kW2tleV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodmFsdWUgPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSBqc29uW2tleV07XG4gICAgICAgICAgICAgICAgLy8gVE9ETzogb3VyIHNlcnZlciBhcHBhcmVudGx5IHNlbmRzIGJhY2sgbnVsbCBhcyBhIHZhbHVlIGZvciBzb21lIGF0dHJpYnV0ZXMuXG4gICAgICAgICAgICAgICAgLy8gVE9ETzogY29uc2lkZXIgY2hlY2tpbmcgZm9yIG51bGwgd2hlcmV2ZXIgd2UncmUgY2hlY2tpbmcgZm9yIHVuZGVmaW5lZFxuICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlID09PSAnJyB8fCB2YWx1ZSA9PT0gbnVsbCkgeyAvLyBUT0RPOiBTaG91bGQgdGhlIHNlcnZlciBiZSBzZW5kaW5nIGJhY2sgJycgaGVyZSBvciBub3RoaW5nIGF0IGFsbD8gKEl0IHByZWNsdWRlcyB0aGUgc2VydmVyIGZyb20gcmVhbGx5IHNheWluZyAnbm90aGluZycpXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gZGVmYXVsdHNba2V5XTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodmFsdWUgPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGlmQWJzZW50O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGV4Y2x1c2lvblNlbGVjdG9yKGtleSwgZGVwcmVjYXRlZEtleSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgc2VsZWN0b3JzID0gW107XG4gICAgICAgICAgICB2YXIgbm9BbnQgPSBkYXRhKCdub19hbnQnKSgpO1xuICAgICAgICAgICAgaWYgKG5vQW50KSB7XG4gICAgICAgICAgICAgICAgc2VsZWN0b3JzLnB1c2gobm9BbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIG5vUmVhZHIgPSBkYXRhKCdub19yZWFkcicpKCk7XG4gICAgICAgICAgICBpZiAobm9SZWFkcikge1xuICAgICAgICAgICAgICAgIHNlbGVjdG9ycy5wdXNoKG5vUmVhZHIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHNlbGVjdG9ycy5qb2luKCcsJyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBiYWNrZ3JvdW5kQ29sb3IoYWNjZXNzb3IpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIGNvbG9ycyA9IFtdO1xuICAgICAgICAgICAgdmFyIHZhbHVlID0gYWNjZXNzb3IoKTtcbiAgICAgICAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgIGNvbG9ycyA9IHZhbHVlLnNwbGl0KCc7Jyk7XG4gICAgICAgICAgICAgICAgY29sb3JzID0gbWlncmF0ZVZhbHVlcyhjb2xvcnMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGNvbG9ycztcblxuICAgICAgICAgICAgLy8gTWlncmF0ZSBhbnkgY29sb3JzIGZyb20gdGhlICcxLCAyLCAzJyBmb3JtYXQgdG8gJ3JnYigxLCAyLCAzKScuIFRoaXMgY29kZSBjYW4gYmUgZGVsZXRlZCBvbmNlIHdlJ3ZlIHVwZGF0ZWRcbiAgICAgICAgICAgIC8vIGFsbCBzaXRlcyB0byBzcGVjaWZ5aW5nIHZhbGlkIENTUyBjb2xvciB2YWx1ZXNcbiAgICAgICAgICAgIGZ1bmN0aW9uIG1pZ3JhdGVWYWx1ZXMoY29sb3JWYWx1ZXMpIHtcbiAgICAgICAgICAgICAgICB2YXIgbWlncmF0aW9uTWF0Y2hlciA9IC9eXFxzKlxcZCtcXHMqLFxccypcXGQrXFxzKixcXHMqXFxkK1xccyokL2dpbTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvbG9yVmFsdWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9IGNvbG9yVmFsdWVzW2ldO1xuICAgICAgICAgICAgICAgICAgICBpZiAobWlncmF0aW9uTWF0Y2hlci50ZXN0KHZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3JWYWx1ZXNbaV0gPSAncmdiKCcgKyB2YWx1ZSArICcpJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gY29sb3JWYWx1ZXM7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkZWZhdWx0UmVhY3Rpb25zKCRlbGVtZW50KSB7XG4gICAgICAgIC8vIERlZmF1bHQgcmVhY3Rpb25zIGFyZSBhdmFpbGFibGUgaW4gdGhyZWUgbG9jYXRpb25zIGluIHRocmVlIGRhdGEgZm9ybWF0czpcbiAgICAgICAgLy8gMS4gQXMgYSBjb21tYS1zZXBhcmF0ZWQgYXR0cmlidXRlIHZhbHVlIG9uIGEgcGFydGljdWxhciBlbGVtZW50XG4gICAgICAgIC8vIDIuIEFzIGFuIGFycmF5IG9mIHN0cmluZ3Mgb24gdGhlIHdpbmRvdy5hbnRlbm5hX2V4dGVuZCBwcm9wZXJ0eVxuICAgICAgICAvLyAzLiBBcyBhIGpzb24gb2JqZWN0IHdpdGggYSBib2R5IGFuZCBpZCBvbiB0aGUgZ3JvdXAgc2V0dGluZ3NcbiAgICAgICAgdmFyIHJlYWN0aW9ucyA9IFtdO1xuICAgICAgICB2YXIgcmVhY3Rpb25TdHJpbmdzO1xuICAgICAgICB2YXIgZWxlbWVudFJlYWN0aW9ucyA9ICRlbGVtZW50ID8gJGVsZW1lbnQuYXR0cignYW50LXJlYWN0aW9ucycpIDogdW5kZWZpbmVkO1xuICAgICAgICBpZiAoZWxlbWVudFJlYWN0aW9ucykge1xuICAgICAgICAgICAgcmVhY3Rpb25TdHJpbmdzID0gZWxlbWVudFJlYWN0aW9ucy5zcGxpdCgnOycpO1xuICAgICAgICB9IGVsc2UgaWYgKHdpbmRvdy5hbnRlbm5hX2V4dGVuZCkge1xuICAgICAgICAgICAgcmVhY3Rpb25TdHJpbmdzID0gd2luZG93LmFudGVubmFfZXh0ZW5kWydkZWZhdWx0X3JlYWN0aW9ucyddO1xuICAgICAgICB9XG4gICAgICAgIGlmIChyZWFjdGlvblN0cmluZ3MpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmVhY3Rpb25TdHJpbmdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgcmVhY3Rpb25zLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICB0ZXh0OiByZWFjdGlvblN0cmluZ3NbaV0sXG4gICAgICAgICAgICAgICAgICAgIGlzRGVmYXVsdDogdHJ1ZVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgdmFsdWVzID0ganNvblsnZGVmYXVsdF9yZWFjdGlvbnMnXTtcbiAgICAgICAgICAgIGlmICh2YWx1ZXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdmFsdWVzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9IHZhbHVlc1tqXTtcbiAgICAgICAgICAgICAgICAgICAgcmVhY3Rpb25zLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogdmFsdWUuYm9keSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkOiB2YWx1ZS5pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGlzRGVmYXVsdDogdHJ1ZVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlYWN0aW9ucztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjb21wdXRlQ3VzdG9tQ1NTKCkge1xuICAgICAgICAvLyBGaXJzdCByZWFkIGFueSByYXcgY3VzdG9tIENTUy5cbiAgICAgICAgdmFyIGN1c3RvbUNTUyA9IGRhdGEoJ2N1c3RvbV9jc3MnKSgpO1xuICAgICAgICAvLyBUaGVuIGFwcGVuZCBydWxlcyBmb3IgYW55IHNwZWNpZmljIENTUyBvdmVycmlkZXMuXG4gICAgICAgIGN1c3RvbUNTUyArPSBjcmVhdGVDdXN0b21DU1NSdWxlKG1pZ3JhdGVSZWFjdGlvbnNCYWNrZ3JvdW5kQ29sb3JTZXR0aW5ncyhkYXRhKCd0YWdzX2JnX2NzcycsICcnKSksICcuYW50ZW5uYS1yZWFjdGlvbnMtcGFnZSAuYW50ZW5uYS1ib2R5LCAuYW50ZW5uYS1kZWZhdWx0cy1wYWdlIC5hbnRlbm5hLWJvZHknKTtcbiAgICAgICAgY3VzdG9tQ1NTICs9IGNyZWF0ZUN1c3RvbUNTU1J1bGUoZGF0YSgndGFnX2JveF9iZ19jb2xvcnMnLCAnJyksICcuYW50ZW5uYS1yZWFjdGlvbi1ib3gnKTtcbiAgICAgICAgY3VzdG9tQ1NTICs9IGNyZWF0ZUN1c3RvbUNTU1J1bGUoZGF0YSgndGFnX2JveF9iZ19jb2xvcnNfaG92ZXInLCAnJyksICcuYW50ZW5uYS1yZWFjdGlvbjpob3ZlciA+IC5hbnRlbm5hLXJlYWN0aW9uLWJveCcpO1xuICAgICAgICBjdXN0b21DU1MgKz0gY3JlYXRlQ3VzdG9tQ1NTUnVsZShtaWdyYXRlVGV4dENvbG9yU2V0dGluZ3MoZGF0YSgndGFnX2JveF90ZXh0X2NvbG9ycycsICcnKSksICcuYW50ZW5uYS1yZWFjdGlvbi1ib3gsIC5hbnRlbm5hLXJlYWN0aW9uLWNvbW1lbnRzIC5hbnRlbm5hLWNvbW1lbnRzLXBhdGgsIC5hbnRlbm5hLXJlYWN0aW9uLWxvY2F0aW9uIC5hbnRlbm5hLWxvY2F0aW9uLXBhdGgnKTtcbiAgICAgICAgY3VzdG9tQ1NTICs9IGNyZWF0ZUN1c3RvbUNTU1J1bGUobWlncmF0ZUZvbnRGYW1pbHlTZXR0aW5nKGRhdGEoJ3RhZ19ib3hfZm9udF9mYW1pbHknLCAnJykpLCAnLmFudGVubmEtcmVhY3Rpb24tYm94IC5hbnRlbm5hLXJlc2V0Jyk7XG4gICAgICAgIHJldHVybiBjdXN0b21DU1M7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY3JlYXRlQ3VzdG9tQ1NTUnVsZShkZWNsYXJhdGlvbnNBY2Nlc3Nvciwgc2VsZWN0b3IpIHtcbiAgICAgICAgdmFyIGRlY2xhcmF0aW9ucyA9IGRlY2xhcmF0aW9uc0FjY2Vzc29yKCkudHJpbSgpO1xuICAgICAgICBpZiAoZGVjbGFyYXRpb25zKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1xcbicgKyBzZWxlY3RvciArICcge1xcbiAgICAnICsgZGVjbGFyYXRpb25zICsgJ1xcbn0nO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnJztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtaWdyYXRlUmVhY3Rpb25zQmFja2dyb3VuZENvbG9yU2V0dGluZ3MoYmFja2dyb3VuZENvbG9yQWNjZXNzb3IpIHtcbiAgICAgICAgLy8gVE9ETzogVGhpcyBpcyB0ZW1wb3JhcnkgY29kZSB0aGF0IG1pZ3JhdGVzIHRoZSBjdXJyZW50IHRhZ3NfYmdfY3NzIHNldHRpbmcgZnJvbSBhIHJhdyB2YWx1ZSB0byBhXG4gICAgICAgIC8vICAgICAgIENTUyBkZWNsYXJhdGlvbi4gV2Ugc2hvdWxkIG1pZ3JhdGUgYWxsIGRlcGxveWVkIHNpdGVzIHRvIHVzZSBhIENTUyBkZWNsYXJhdGlvbiBhbmQgdGhlbiByZW1vdmUgdGhpcy5cbiAgICAgICAgdmFyIGJhY2tncm91bmRDb2xvciA9IGJhY2tncm91bmRDb2xvckFjY2Vzc29yKCkudHJpbSgpO1xuICAgICAgICBpZiAoYmFja2dyb3VuZENvbG9yICYmIGJhY2tncm91bmRDb2xvci5pbmRleE9mKCdiYWNrZ3JvdW5kJykgPT09IC0xKSB7XG4gICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3IgPSAnYmFja2dyb3VuZC1pbWFnZTogJyArIGJhY2tncm91bmRDb2xvcjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gYmFja2dyb3VuZENvbG9yO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWlncmF0ZUZvbnRGYW1pbHlTZXR0aW5nKGZvbnRGYW1pbHlBY2Nlc3Nvcikge1xuICAgICAgICAvLyBUT0RPOiBUaGlzIGlzIHRlbXBvcmFyeSBjb2RlIHRoYXQgbWlncmF0ZXMgdGhlIGN1cnJlbnQgdGFnX2JveF9mb250X2ZhbWlseSBzZXR0aW5nIGZyb20gYSByYXcgdmFsdWUgdG8gYVxuICAgICAgICAvLyAgICAgICBDU1MgZGVjbGFyYXRpb24uIFdlIHNob3VsZCBtaWdyYXRlIGFsbCBkZXBsb3llZCBzaXRlcyB0byB1c2UgYSBDU1MgZGVjbGFyYXRpb24gYW5kIHRoZW4gcmVtb3ZlIHRoaXMuXG4gICAgICAgIHZhciBmb250RmFtaWx5ID0gZm9udEZhbWlseUFjY2Vzc29yKCkudHJpbSgpO1xuICAgICAgICBpZiAoZm9udEZhbWlseSAmJiBmb250RmFtaWx5LmluZGV4T2YoJ2ZvbnQtZmFtaWx5JykgPT09IC0xKSB7XG4gICAgICAgICAgICBmb250RmFtaWx5ID0gJ2ZvbnQtZmFtaWx5OiAnICsgZm9udEZhbWlseTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gZm9udEZhbWlseTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1pZ3JhdGVUZXh0Q29sb3JTZXR0aW5ncyh0ZXh0Q29sb3JBY2Nlc3Nvcikge1xuICAgICAgICAvLyBUT0RPOiBUaGlzIGlzIHRlbXBvcmFyeSBjb2RlIHRoYXQgbWlncmF0ZXMgdGhlIGN1cnJlbnQgdGFnX2JveF90ZXh0X2NvbG9ycyBwcm9wZXJ0eSwgd2hpY2ggaXMgYSBkZWNsYXJhdGlvblxuICAgICAgICAvLyAgICAgICB0aGF0IG9ubHkgc2V0cyB0aGUgY29sb3IgcHJvcGVydHksIHRvIHNldCBib3RoIHRoZSBjb2xvciBhbmQgZmlsbCBwcm9wZXJ0aWVzLlxuICAgICAgICB2YXIgdGV4dENvbG9yID0gdGV4dENvbG9yQWNjZXNzb3IoKS50cmltKCk7XG4gICAgICAgIGlmICh0ZXh0Q29sb3IgJiYgdGV4dENvbG9yLmluZGV4T2YoJ2NvbG9yOicpID09PSAwICYmIHRleHRDb2xvci5pbmRleE9mKCdmaWxsOicpID09PSAtMSkge1xuICAgICAgICAgICAgdGV4dENvbG9yICs9IHRleHRDb2xvclt0ZXh0Q29sb3IubGVuZ3RoIC0gMV0gPT0gJzsnID8gJycgOiAnOyc7IC8vIGFwcGVuZCBhIHNlbWljb2xvbiBpZiBuZWVkZWRcbiAgICAgICAgICAgIHRleHRDb2xvciArPSB0ZXh0Q29sb3IucmVwbGFjZSgnY29sb3I6JywgJ1xcbiAgICBmaWxsOicpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiB0ZXh0Q29sb3I7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBsZWdhY3lCZWhhdmlvcjogZGF0YSgnbGVnYWN5X2JlaGF2aW9yJywgZmFsc2UpLCAvLyBUT0RPOiBtYWtlIHRoaXMgcmVhbCBpbiB0aGUgc2Vuc2UgdGhhdCBpdCBjb21lcyBiYWNrIGZyb20gdGhlIHNlcnZlciBhbmQgcHJvYmFibHkgbW92ZSB0aGUgZmxhZyB0byB0aGUgcGFnZSBkYXRhLiBVbmxpa2VseSB0aGF0IHdlIG5lZWQgdG8gbWFpbnRhaW4gbGVnYWN5IGJlaGF2aW9yIGZvciBuZXcgcGFnZXM/XG4gICAgICAgIGdyb3VwSWQ6IGRhdGEoJ2lkJyksXG4gICAgICAgIGdyb3VwTmFtZTogZGF0YSgnbmFtZScpLFxuICAgICAgICBhY3RpdmVTZWN0aW9uczogZGF0YSgnYWN0aXZlX3NlY3Rpb25zJyksXG4gICAgICAgIHVybDoge1xuICAgICAgICAgICAgaWdub3JlU3ViZG9tYWluOiBkYXRhKCdpZ25vcmVfc3ViZG9tYWluJyksXG4gICAgICAgICAgICBpbmNsdWRlUXVlcnlTdHJpbmc6IGRhdGEoJ3F1ZXJ5c3RyaW5nX2NvbnRlbnQnKSxcbiAgICAgICAgICAgIGlnbm9yZU1lZGlhVXJsUXVlcnk6IGRhdGEoJ21lZGlhX3VybF9pZ25vcmVfcXVlcnknKSxcbiAgICAgICAgICAgIGNhbm9uaWNhbERvbWFpbjogZGF0YSgncGFnZV90bGQnKSAvLyBUT0RPOiB3aGF0IHRvIGNhbGwgdGhpcyBleGFjdGx5LiBncm91cERvbWFpbj8gc2l0ZURvbWFpbj8gY2Fub25pY2FsRG9tYWluP1xuICAgICAgICB9LFxuICAgICAgICBzdW1tYXJ5U2VsZWN0b3I6IGRhdGEoJ3N1bW1hcnlfd2lkZ2V0X3NlbGVjdG9yJyksXG4gICAgICAgIHN1bW1hcnlNZXRob2Q6IGRhdGEoJ3N1bW1hcnlfd2lkZ2V0X21ldGhvZCcpLFxuICAgICAgICBpc0hpZGVPbk1vYmlsZTogZGF0YSgnaGlkZU9uTW9iaWxlJyksXG4gICAgICAgIGlzRXhwYW5kZWRNb2JpbGVTdW1tYXJ5OiBkYXRhKCdzdW1tYXJ5X3dpZGdldF9leHBhbmRlZF9tb2JpbGUnKSxcbiAgICAgICAgaXNIaWRlVGFwSGVscGVyOiBkYXRhKCdoaWRlRG91YmxlVGFwTWVzc2FnZScpLFxuICAgICAgICB0YXBIZWxwZXJQb3NpdGlvbjogZGF0YSgnZG91YmxlVGFwTWVzc2FnZVBvc2l0aW9uJyksXG4gICAgICAgIHBhZ2VTZWxlY3RvcjogZGF0YSgncG9zdF9zZWxlY3RvcicpLFxuICAgICAgICBwYWdlTGlua1NlbGVjdG9yOiBkYXRhKCdwb3N0X2hyZWZfc2VsZWN0b3InKSxcbiAgICAgICAgcGFnZUltYWdlU2VsZWN0b3I6IGRhdGEoJ2ltYWdlX3NlbGVjdG9yJyksXG4gICAgICAgIHBhZ2VJbWFnZUF0dHJpYnV0ZTogZGF0YSgnaW1hZ2VfYXR0cmlidXRlJyksXG4gICAgICAgIHBhZ2VBdXRob3JTZWxlY3RvcjogZGF0YSgnYXV0aG9yX3NlbGVjdG9yJyksXG4gICAgICAgIHBhZ2VBdXRob3JBdHRyaWJ1dGU6IGRhdGEoJ2F1dGhvcl9hdHRyaWJ1dGUnKSxcbiAgICAgICAgcGFnZVRvcGljc1NlbGVjdG9yOiBkYXRhKCd0b3BpY3Nfc2VsZWN0b3InKSxcbiAgICAgICAgcGFnZVRvcGljc0F0dHJpYnV0ZTogZGF0YSgndG9waWNzX2F0dHJpYnV0ZScpLFxuICAgICAgICBwYWdlU2l0ZVNlY3Rpb25TZWxlY3RvcjogZGF0YSgnc2VjdGlvbl9zZWxlY3RvcicpLFxuICAgICAgICBwYWdlU2l0ZVNlY3Rpb25BdHRyaWJ1dGU6IGRhdGEoJ3NlY3Rpb25fYXR0cmlidXRlJyksXG4gICAgICAgIGNvbnRlbnRTZWxlY3RvcjogZGF0YSgnYW5ub193aGl0ZWxpc3QnKSxcbiAgICAgICAgdGV4dEluZGljYXRvckxpbWl0OiBkYXRhKCdpbml0aWFsX3Bpbl9saW1pdCcpLFxuICAgICAgICBlbmFibGVUZXh0SGVscGVyOiBkYXRhKCdwYXJhZ3JhcGhfaGVscGVyJyksXG4gICAgICAgIG1lZGlhSW5kaWNhdG9yQ29ybmVyOiBkYXRhKCdpbWdfaW5kaWNhdG9yX3Nob3dfc2lkZScpLFxuICAgICAgICBnZW5lcmF0ZWRDdGFTZWxlY3RvcjogZGF0YSgnc2VwYXJhdGVfY3RhJyksXG4gICAgICAgIGdlbmVyYXRlZEN0YUV4cGFuZGVkOiBkYXRhKCdzZXBhcmF0ZV9jdGFfZXhwYW5kZWQnKSxcbiAgICAgICAgcmVxdWlyZXNBcHByb3ZhbDogZGF0YSgncmVxdWlyZXNfYXBwcm92YWwnKSxcbiAgICAgICAgZGVmYXVsdFJlYWN0aW9uczogZGVmYXVsdFJlYWN0aW9ucyxcbiAgICAgICAgY3VzdG9tQ1NTOiBjb21wdXRlQ3VzdG9tQ1NTLFxuICAgICAgICBleGNsdXNpb25TZWxlY3RvcjogZXhjbHVzaW9uU2VsZWN0b3IoKSxcbiAgICAgICAgbGFuZ3VhZ2U6IGRhdGEoJ2xhbmd1YWdlJyksXG4gICAgICAgIHR3aXR0ZXJBY2NvdW50OiBkYXRhKCd0d2l0dGVyJylcbiAgICB9XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGU6IHVwZGF0ZUZyb21KU09OLFxuICAgIGdldDogZ2V0R3JvdXBTZXR0aW5nc1xufTsiLCIvLyBUaGlzIG1vZHVsZSBzdG9yZXMgb3VyIG1hcHBpbmcgZnJvbSBoYXNoIHZhbHVlcyB0byB0aGVpciBjb3JyZXNwb25kaW5nIGVsZW1lbnRzIGluIHRoZSBET00uIFRoZSBkYXRhIGlzIG9yZ2FuaXplZFxuLy8gYnkgcGFnZSBmb3IgdGhlIGJsb2cgcm9sbCBjYXNlLCB3aGVyZSBtdWx0aXBsZSBwYWdlcyBvZiBkYXRhIGNhbiBiZSBsb2FkZWQgYXQgb25jZS5cbnZhciBwYWdlcyA9IHt9O1xuXG5mdW5jdGlvbiBnZXRFbGVtZW50KGNvbnRhaW5lckhhc2gsIHBhZ2VIYXNoKSB7XG4gICAgdmFyIGNvbnRhaW5lcnMgPSBwYWdlc1twYWdlSGFzaF07XG4gICAgaWYgKGNvbnRhaW5lcnMpIHtcbiAgICAgICAgcmV0dXJuIGNvbnRhaW5lcnNbY29udGFpbmVySGFzaF07XG4gICAgfVxufVxuXG5mdW5jdGlvbiBzZXRFbGVtZW50KGNvbnRhaW5lckhhc2gsIHBhZ2VIYXNoLCBlbGVtZW50KSB7XG4gICAgdmFyIGNvbnRhaW5lcnMgPSBwYWdlc1twYWdlSGFzaF07XG4gICAgaWYgKCFjb250YWluZXJzKSB7XG4gICAgICAgIGNvbnRhaW5lcnMgPSBwYWdlc1twYWdlSGFzaF0gPSB7fTtcbiAgICB9XG4gICAgY29udGFpbmVyc1tjb250YWluZXJIYXNoXSA9IGVsZW1lbnQ7XG59XG5cbi8vIFdoZW4gd2UgZmlyc3Qgc2NhbiBhIHBhZ2UsIHRoZSBcImhhc2hcIiBpcyBqdXN0IHRoZSBVUkwgd2hpbGUgd2Ugd2FpdCB0byBoZWFyIGJhY2sgZnJvbSB0aGUgc2VydmVyLCB0aGVuIGl0J3MgdXBkYXRlZFxuLy8gdG8gd2hhdGV2ZXIgdmFsdWUgdGhlIHNlcnZlciBjb21wdXRlZC4gU28gaGVyZSB3ZSBhbGxvdyBvdXIgbWFwcGluZyB0byBiZSB1cGRhdGVkIHdoZW4gdGhhdCBjaGFuZ2UgaGFwcGVucy5cbmZ1bmN0aW9uIHVwZGF0ZVBhZ2VIYXNoKG9sZFBhZ2VIYXNoLCBuZXdQYWdlSGFzaCkge1xuICAgIHBhZ2VzW25ld1BhZ2VIYXNoXSA9IHBhZ2VzW29sZFBhZ2VIYXNoXTtcbiAgICBkZWxldGUgcGFnZXNbb2xkUGFnZUhhc2hdO1xufVxuXG5mdW5jdGlvbiB0ZWFyZG93bigpIHtcbiAgICBwYWdlcyA9IHt9O1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgZ2V0RWxlbWVudDogZ2V0RWxlbWVudCxcbiAgICBzZXRFbGVtZW50OiBzZXRFbGVtZW50LFxuICAgIHVwZGF0ZVBhZ2VIYXNoOiB1cGRhdGVQYWdlSGFzaCxcbiAgICB0ZWFyZG93bjogdGVhcmRvd25cbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgUmFjdGl2ZTsgcmVxdWlyZSgnLi91dGlscy9yYWN0aXZlLXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGxvYWRlZFJhY3RpdmUpIHsgUmFjdGl2ZSA9IGxvYWRlZFJhY3RpdmU7fSk7XG52YXIgUmFuZ2UgPSByZXF1aXJlKCcuL3V0aWxzL3JhbmdlJyk7XG5cbnZhciBFdmVudHMgPSByZXF1aXJlKCcuL2V2ZW50cycpO1xudmFyIEhhc2hlZEVsZW1lbnRzID0gcmVxdWlyZSgnLi9oYXNoZWQtZWxlbWVudHMnKTtcbnZhciBQYWdlRGF0YSA9IHJlcXVpcmUoJy4vcGFnZS1kYXRhJyk7XG52YXIgU1ZHcyA9IHJlcXVpcmUoJy4vc3ZncycpO1xuXG52YXIgcGFnZVNlbGVjdG9yID0gJy5hbnRlbm5hLWxvY2F0aW9ucy1wYWdlJztcblxuZnVuY3Rpb24gY3JlYXRlUGFnZShvcHRpb25zKSB7XG4gICAgdmFyIGVsZW1lbnQgPSBvcHRpb25zLmVsZW1lbnQ7XG4gICAgdmFyIHJlYWN0aW9uTG9jYXRpb25EYXRhID0gb3B0aW9ucy5yZWFjdGlvbkxvY2F0aW9uRGF0YTtcbiAgICB2YXIgcGFnZURhdGEgPSBvcHRpb25zLnBhZ2VEYXRhO1xuICAgIHZhciBncm91cFNldHRpbmdzID0gb3B0aW9ucy5ncm91cFNldHRpbmdzO1xuICAgIHZhciBjbG9zZVdpbmRvdyA9IG9wdGlvbnMuY2xvc2VXaW5kb3c7XG4gICAgdmFyIGdvQmFjayA9IG9wdGlvbnMuZ29CYWNrO1xuICAgIHZhciByYWN0aXZlID0gUmFjdGl2ZSh7XG4gICAgICAgIGVsOiBlbGVtZW50LFxuICAgICAgICBhcHBlbmQ6IHRydWUsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIGxvY2F0aW9uRGF0YTogcmVhY3Rpb25Mb2NhdGlvbkRhdGEsXG4gICAgICAgICAgICBwYWdlUmVhY3Rpb25Db3VudDogcGFnZVJlYWN0aW9uQ291bnQocmVhY3Rpb25Mb2NhdGlvbkRhdGEpLFxuICAgICAgICAgICAgY2FuTG9jYXRlOiBmdW5jdGlvbihjb250YWluZXJIYXNoKSB7XG4gICAgICAgICAgICAgICAgLy8gVE9ETzogaXMgdGhlcmUgYSBiZXR0ZXIgd2F5IHRvIGhhbmRsZSByZWFjdGlvbnMgdG8gaGFzaGVzIHRoYXQgYXJlIG5vIGxvbmdlciBvbiB0aGUgcGFnZT9cbiAgICAgICAgICAgICAgICAvLyAgICAgICBzaG91bGQgd2UgcHJvdmlkZSBzb21lIGtpbmQgb2YgaW5kaWNhdGlvbiB3aGVuIHdlIGZhaWwgdG8gbG9jYXRlIGEgaGFzaCBvciBqdXN0IGxlYXZlIGl0IGFzIGlzP1xuICAgICAgICAgICAgICAgIC8vIFRPRE86IERvZXMgaXQgbWFrZSBzZW5zZSB0byBldmVuIHNob3cgZW50cmllcyB0aGF0IHdlIGNhbid0IGxvY2F0ZT8gUHJvYmFibHkgbm90LlxuICAgICAgICAgICAgICAgIHJldHVybiBIYXNoZWRFbGVtZW50cy5nZXRFbGVtZW50KGNvbnRhaW5lckhhc2gsIHBhZ2VEYXRhLnBhZ2VIYXNoKSAhPT0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL2xvY2F0aW9ucy1wYWdlLmhicy5odG1sJyksXG4gICAgICAgIHBhcnRpYWxzOiB7XG4gICAgICAgICAgICBsZWZ0OiBTVkdzLmxlZnQsXG4gICAgICAgICAgICBmaWxtOiBTVkdzLmZpbG1cbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJhY3RpdmUub24oJ2JhY2snLCBnb0JhY2spO1xuICAgIHJhY3RpdmUub24oJ3JldmVhbCcsIHJldmVhbENvbnRlbnQpO1xuICAgIHJldHVybiB7XG4gICAgICAgIHNlbGVjdG9yOiBwYWdlU2VsZWN0b3IsXG4gICAgICAgIHRlYXJkb3duOiBmdW5jdGlvbigpIHsgcmFjdGl2ZS50ZWFyZG93bigpOyB9XG4gICAgfTtcblxuXG4gICAgZnVuY3Rpb24gcmV2ZWFsQ29udGVudChyYWN0aXZlRXZlbnQpIHtcbiAgICAgICAgdmFyIGxvY2F0aW9uRGF0YSA9IHJhY3RpdmVFdmVudC5jb250ZXh0O1xuICAgICAgICB2YXIgZWxlbWVudCA9IEhhc2hlZEVsZW1lbnRzLmdldEVsZW1lbnQobG9jYXRpb25EYXRhLmNvbnRhaW5lckhhc2gsIHBhZ2VEYXRhLnBhZ2VIYXNoKTtcbiAgICAgICAgaWYgKGVsZW1lbnQpIHtcbiAgICAgICAgICAgIHZhciBldmVudCA9IHJhY3RpdmVFdmVudC5vcmlnaW5hbDtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIGNsb3NlV2luZG93KCk7XG4gICAgICAgICAgICB2YXIgdGFyZ2V0U2Nyb2xsVG9wID0gJChlbGVtZW50KS5vZmZzZXQoKS50b3AgLSAxMzA7XG4gICAgICAgICAgICAkKCdodG1sLGJvZHknKS5hbmltYXRlKHtzY3JvbGxUb3A6IHRhcmdldFNjcm9sbFRvcH0sIDEwMDApO1xuICAgICAgICAgICAgaWYgKGxvY2F0aW9uRGF0YS5raW5kID09PSAndHh0JykgeyAvLyBUT0RPOiBzb21ldGhpbmcgYmV0dGVyIHRoYW4gYSBzdHJpbmcgY29tcGFyZS4gZml4IHRoaXMgYWxvbmcgd2l0aCB0aGUgc2FtZSBpc3N1ZSBpbiBwYWdlLWRhdGFcbiAgICAgICAgICAgICAgICBSYW5nZS5oaWdobGlnaHQoZWxlbWVudC5nZXQoMCksIGxvY2F0aW9uRGF0YS5sb2NhdGlvbik7XG4gICAgICAgICAgICAgICAgJChkb2N1bWVudCkub24oJ2NsaWNrLmFudGVubmEnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgUmFuZ2UuY2xlYXJIaWdobGlnaHRzKCk7XG4gICAgICAgICAgICAgICAgICAgICQoZG9jdW1lbnQpLm9mZignY2xpY2suYW50ZW5uYScpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGNvbnRhaW5lckRhdGEgPSBQYWdlRGF0YS5nZXRDb250YWluZXJEYXRhKHBhZ2VEYXRhLCBsb2NhdGlvbkRhdGEuY29udGFpbmVySGFzaCk7XG4gICAgICAgICAgICBFdmVudHMucG9zdENvbnRlbnRWaWV3ZWQocGFnZURhdGEsIGNvbnRhaW5lckRhdGEsbG9jYXRpb25EYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gcGFnZVJlYWN0aW9uQ291bnQocmVhY3Rpb25Mb2NhdGlvbkRhdGEpIHtcbiAgICBmb3IgKHZhciBjb250ZW50SUQgaW4gcmVhY3Rpb25Mb2NhdGlvbkRhdGEpIHtcbiAgICAgICAgaWYgKHJlYWN0aW9uTG9jYXRpb25EYXRhLmhhc093blByb3BlcnR5KGNvbnRlbnRJRCkpIHtcbiAgICAgICAgICAgIHZhciBjb250ZW50TG9jYXRpb25EYXRhID0gcmVhY3Rpb25Mb2NhdGlvbkRhdGFbY29udGVudElEXTtcbiAgICAgICAgICAgIGlmIChjb250ZW50TG9jYXRpb25EYXRhLmtpbmQgPT09ICdwYWcnKSB7IC8vIFRPRE86IHNvbWV0aGluZyBiZXR0ZXIgdGhhbiBhIHN0cmluZyBjb21wYXJlLiBmaXggdGhpcyBhbG9uZyB3aXRoIHRoZSBzYW1lIGlzc3VlIGluIHBhZ2UtZGF0YVxuICAgICAgICAgICAgICAgIHJldHVybiBjb250ZW50TG9jYXRpb25EYXRhLmNvdW50O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlOiBjcmVhdGVQYWdlXG59OyIsInZhciBSYWN0aXZlOyByZXF1aXJlKCcuL3V0aWxzL3JhY3RpdmUtcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24obG9hZGVkUmFjdGl2ZSkgeyBSYWN0aXZlID0gbG9hZGVkUmFjdGl2ZTt9KTtcbnZhciBVUkxzID0gcmVxdWlyZSgnLi91dGlscy91cmxzJyk7XG52YXIgWERNQ2xpZW50ID0gcmVxdWlyZSgnLi91dGlscy94ZG0tY2xpZW50Jyk7XG52YXIgU1ZHcyA9IHJlcXVpcmUoJy4vc3ZncycpO1xuXG52YXIgcGFnZVNlbGVjdG9yID0gJy5hbnRlbm5hLWxvZ2luLXBhZ2UnO1xuXG5mdW5jdGlvbiBjcmVhdGVQYWdlKG9wdGlvbnMpIHtcbiAgICB2YXIgZ3JvdXBTZXR0aW5ncyA9IG9wdGlvbnMuZ3JvdXBTZXR0aW5ncztcbiAgICB2YXIgZ29CYWNrID0gb3B0aW9ucy5nb0JhY2s7XG4gICAgdmFyIHJldHJ5ID0gb3B0aW9ucy5yZXRyeTtcbiAgICB2YXIgZWxlbWVudCA9IG9wdGlvbnMuZWxlbWVudDtcbiAgICB2YXIgcmFjdGl2ZSA9IFJhY3RpdmUoe1xuICAgICAgICBlbDogZWxlbWVudCxcbiAgICAgICAgYXBwZW5kOiB0cnVlLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICBsb2dpblBhZ2VVcmw6IGNvbXB1dGVMb2dpblBhZ2VVcmwoZ3JvdXBTZXR0aW5ncylcbiAgICAgICAgfSxcbiAgICAgICAgdGVtcGxhdGU6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9sb2dpbi1wYWdlLmhicy5odG1sJyksXG4gICAgICAgIHBhcnRpYWxzOiB7XG4gICAgICAgICAgICBsZWZ0OiBTVkdzLmxlZnRcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIGFkZFJlc3BvbnNlSGFuZGxlcnMoKTtcbiAgICByYWN0aXZlLm9uKCdiYWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIGNsZWFyUmVzcG9uc2VIYW5kbGVycygpO1xuICAgICAgICBnb0JhY2soKTtcbiAgICB9KTtcbiAgICByZXR1cm4ge1xuICAgICAgICBzZWxlY3RvcjogcGFnZVNlbGVjdG9yLFxuICAgICAgICB0ZWFyZG93bjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBjbGVhclJlc3BvbnNlSGFuZGxlcnMoKTtcbiAgICAgICAgICAgIHJhY3RpdmUudGVhcmRvd24oKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBmdW5jdGlvbiBhZGRSZXNwb25zZUhhbmRsZXJzKCkge1xuICAgICAgICBYRE1DbGllbnQuYWRkUmVzcG9uc2VIYW5kbGVyKFwiY2xvc2UgbG9naW4gcGFuZWxcIiwgZG9SZXRyeSk7XG4gICAgICAgIFhETUNsaWVudC5hZGRSZXNwb25zZUhhbmRsZXIoXCJnZXRVc2VyTG9naW5TdGF0ZVwiLCBkb1JldHJ5KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjbGVhclJlc3BvbnNlSGFuZGxlcnMoKSB7XG4gICAgICAgIFhETUNsaWVudC5yZW1vdmVSZXNwb25zZUhhbmRsZXIoXCJjbG9zZSBsb2dpbiBwYW5lbFwiLCBkb1JldHJ5KTtcbiAgICAgICAgWERNQ2xpZW50LnJlbW92ZVJlc3BvbnNlSGFuZGxlcihcImdldFVzZXJMb2dpblN0YXRlXCIsIGRvUmV0cnkpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRvUmV0cnkoKSB7XG4gICAgICAgIGNsZWFyUmVzcG9uc2VIYW5kbGVycygpO1xuICAgICAgICByZXRyeSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gY29tcHV0ZUxvZ2luUGFnZVVybChncm91cFNldHRpbmdzKSB7XG4gICAgcmV0dXJuIFVSTHMuYXBwU2VydmVyVXJsKCkgKyBVUkxzLmxvZ2luUGFnZVVybCgpICtcbiAgICAgICAgJz9wYXJlbnRVcmw9JyArIHdpbmRvdy5sb2NhdGlvbi5ocmVmICtcbiAgICAgICAgJyZwYXJlbnRIb3N0PScgKyB3aW5kb3cubG9jYXRpb24ucHJvdG9jb2wgKyBcIi8vXCIgKyB3aW5kb3cubG9jYXRpb24uaG9zdCArXG4gICAgICAgICcmZ3JvdXBfaWQ9JyArIGdyb3VwU2V0dGluZ3MuZ3JvdXBJZCgpICtcbiAgICAgICAgJyZncm91cF9uYW1lPScgKyBncm91cFNldHRpbmdzLmdyb3VwTmFtZSgpO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlUGFnZTogY3JlYXRlUGFnZVxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi91dGlscy9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciBSYWN0aXZlOyByZXF1aXJlKCcuL3V0aWxzL3JhY3RpdmUtcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24obG9hZGVkUmFjdGl2ZSkgeyBSYWN0aXZlID0gbG9hZGVkUmFjdGl2ZTt9KTtcbnZhciBSZWFjdGlvbnNXaWRnZXQgPSByZXF1aXJlKCcuL3JlYWN0aW9ucy13aWRnZXQnKTtcbnZhciBTVkdzID0gcmVxdWlyZSgnLi9zdmdzJyk7XG5cbnZhciBBcHBNb2RlID0gcmVxdWlyZSgnLi91dGlscy9hcHAtbW9kZScpO1xudmFyIE11dGF0aW9uT2JzZXJ2ZXIgPSByZXF1aXJlKCcuL3V0aWxzL211dGF0aW9uLW9ic2VydmVyJyk7XG52YXIgVGhyb3R0bGVkRXZlbnRzID0gcmVxdWlyZSgnLi91dGlscy90aHJvdHRsZWQtZXZlbnRzJyk7XG52YXIgVG91Y2hTdXBwb3J0ID0gcmVxdWlyZSgnLi91dGlscy90b3VjaC1zdXBwb3J0Jyk7XG5cbnZhciBDTEFTU19BQ1RJVkUgPSAnYW50ZW5uYS1hY3RpdmUnO1xuXG5mdW5jdGlvbiBjcmVhdGVJbmRpY2F0b3JXaWRnZXQob3B0aW9ucykge1xuICAgIC8vIFRPRE86IHZhbGlkYXRlIHRoYXQgb3B0aW9ucyBjb250YWlucyBhbGwgcmVxdWlyZWQgcHJvcGVydGllcyAoYXBwbGllcyB0byBhbGwgd2lkZ2V0cykuXG4gICAgdmFyIGVsZW1lbnQgPSBvcHRpb25zLmVsZW1lbnQ7XG4gICAgdmFyIGNvbnRhaW5lckRhdGEgPSBvcHRpb25zLmNvbnRhaW5lckRhdGE7XG4gICAgdmFyICRjb250YWluZXJFbGVtZW50ID0gb3B0aW9ucy5jb250YWluZXJFbGVtZW50O1xuICAgIHZhciBwYWdlRGF0YSA9IG9wdGlvbnMucGFnZURhdGE7XG4gICAgdmFyIGdyb3VwU2V0dGluZ3MgPSBvcHRpb25zLmdyb3VwU2V0dGluZ3M7XG4gICAgdmFyIGRlZmF1bHRSZWFjdGlvbnMgPSBvcHRpb25zLmRlZmF1bHRSZWFjdGlvbnM7XG4gICAgdmFyIGNvbnRlbnREYXRhID0gb3B0aW9ucy5jb250ZW50RGF0YTtcbiAgICB2YXIgcmFjdGl2ZSA9IFJhY3RpdmUoe1xuICAgICAgICBlbDogZWxlbWVudCxcbiAgICAgICAgYXBwZW5kOiB0cnVlLFxuICAgICAgICBtYWdpYzogdHJ1ZSxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgY29udGFpbmVyRGF0YTogY29udGFpbmVyRGF0YSxcbiAgICAgICAgICAgIGV4dHJhQXR0cmlidXRlczogQXBwTW9kZS5kZWJ1ZyA/ICdhbnQtaGFzaD1cIicgKyBjb250YWluZXJEYXRhLmhhc2ggKyAnXCInIDogJycgLy8gVE9ETzogdGhpcyBhYm91dCBtYWtpbmcgdGhpcyBhIGRlY29yYXRvciBoYW5kbGVkIGJ5IGEgXCJEZWJ1Z1wiIG1vZHVsZVxuICAgICAgICB9LFxuICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL21lZGlhLWluZGljYXRvci13aWRnZXQuaGJzLmh0bWwnKSxcbiAgICAgICAgcGFydGlhbHM6IHtcbiAgICAgICAgICAgIGxvZ286IFNWR3MubG9nb1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICB2YXIgcmVhY3Rpb25XaWRnZXRPcHRpb25zID0ge1xuICAgICAgICByZWFjdGlvbnNEYXRhOiBjb250YWluZXJEYXRhLnJlYWN0aW9ucyxcbiAgICAgICAgY29udGFpbmVyRGF0YTogY29udGFpbmVyRGF0YSxcbiAgICAgICAgY29udGFpbmVyRWxlbWVudDogJGNvbnRhaW5lckVsZW1lbnQsXG4gICAgICAgIGNvbnRlbnREYXRhOiBjb250ZW50RGF0YSxcbiAgICAgICAgZGVmYXVsdFJlYWN0aW9uczogZGVmYXVsdFJlYWN0aW9ucyxcbiAgICAgICAgcGFnZURhdGE6IHBhZ2VEYXRhLFxuICAgICAgICBncm91cFNldHRpbmdzOiBncm91cFNldHRpbmdzXG4gICAgfTtcblxuICAgIHZhciBob3ZlclRpbWVvdXQ7XG4gICAgdmFyIGFjdGl2ZVRpbWVvdXQ7XG5cbiAgICB2YXIgJHJvb3RFbGVtZW50ID0gJChyb290RWxlbWVudChyYWN0aXZlKSk7XG4gICAgVG91Y2hTdXBwb3J0LnNldHVwVGFwKCRyb290RWxlbWVudC5nZXQoMCksIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBvcGVuUmVhY3Rpb25zV2luZG93KHJlYWN0aW9uV2lkZ2V0T3B0aW9ucywgcmFjdGl2ZSlcbiAgICB9KTtcbiAgICAkcm9vdEVsZW1lbnQub24oJ21vdXNlZW50ZXIuYW50ZW5uYScsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGlmIChldmVudC5idXR0b25zID4gMCB8fCAoZXZlbnQuYnV0dG9ucyA9PSB1bmRlZmluZWQgJiYgZXZlbnQud2hpY2ggPiAwKSkgeyAvLyBPbiBTYWZhcmksIGV2ZW50LmJ1dHRvbnMgaXMgdW5kZWZpbmVkIGJ1dCBldmVudC53aGljaCBnaXZlcyBhIGdvb2QgdmFsdWUuIGV2ZW50LndoaWNoIGlzIGJhZCBvbiBGRlxuICAgICAgICAgICAgLy8gRG9uJ3QgcmVhY3QgaWYgdGhlIHVzZXIgaXMgZHJhZ2dpbmcgb3Igc2VsZWN0aW5nIHRleHQuXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvbnRhaW5lckRhdGEucmVhY3Rpb25zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIG9wZW5SZWFjdGlvbnNXaW5kb3cocmVhY3Rpb25XaWRnZXRPcHRpb25zLCByYWN0aXZlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNsZWFyVGltZW91dChob3ZlclRpbWVvdXQpO1xuICAgICAgICAgICAgaG92ZXJUaW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBvcGVuUmVhY3Rpb25zV2luZG93KHJlYWN0aW9uV2lkZ2V0T3B0aW9ucywgcmFjdGl2ZSk7XG4gICAgICAgICAgICB9LCA1MCk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICAkcm9vdEVsZW1lbnQub24oJ21vdXNlbGVhdmUuYW50ZW5uYScsIGZ1bmN0aW9uKCkge1xuICAgICAgICBjbGVhclRpbWVvdXQoaG92ZXJUaW1lb3V0KTtcbiAgICAgICAgY2xlYXJUaW1lb3V0KGFjdGl2ZVRpbWVvdXQpO1xuICAgIH0pO1xuICAgICRjb250YWluZXJFbGVtZW50Lm9uKCdtb3VzZWVudGVyLmFudGVubmEnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KGFjdGl2ZVRpbWVvdXQpO1xuICAgICAgICBhY3RpdmVUaW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICRyb290RWxlbWVudC5hZGRDbGFzcyhDTEFTU19BQ1RJVkUpO1xuICAgICAgICB9LCA1MDApO1xuICAgIH0pO1xuICAgICRjb250YWluZXJFbGVtZW50Lm9uKCdtb3VzZWxlYXZlLmFudGVubmEnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KGFjdGl2ZVRpbWVvdXQpO1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgJHJvb3RFbGVtZW50LnJlbW92ZUNsYXNzKENMQVNTX0FDVElWRSk7XG4gICAgICAgIH0sIDEwMCk7IC8vIFdlIGdldCBhIG1vdXNlbGVhdmUgZXZlbnQgd2hlbiB0aGUgdXNlciBob3ZlcnMgdGhlIGluZGljYXRvci4gUGF1c2UgbG9uZyBlbm91Z2ggdGhhdCB0aGUgcmVhY3Rpb24gd2luZG93IGNhbiBvcGVuIGlmIHRoZXkgaG92ZXIuXG4gICAgfSk7XG4gICAgc2V0dXBQb3NpdGlvbmluZygkY29udGFpbmVyRWxlbWVudCwgZ3JvdXBTZXR0aW5ncywgcmFjdGl2ZSk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICB0ZWFyZG93bjogZnVuY3Rpb24oKSB7IHJhY3RpdmUudGVhcmRvd24oKTsgfVxuICAgIH07XG59XG5cbmZ1bmN0aW9uIHNldHVwUG9zaXRpb25pbmcoJGNvbnRhaW5lckVsZW1lbnQsIGdyb3VwU2V0dGluZ3MsIHJhY3RpdmUpIHtcbiAgICB2YXIgJHdyYXBwZXJFbGVtZW50ID0gJCh3cmFwcGVyRWxlbWVudChyYWN0aXZlKSk7XG4gICAgdmFyICRyb290RWxlbWVudCA9ICQocm9vdEVsZW1lbnQocmFjdGl2ZSkpO1xuICAgIHBvc2l0aW9uSW5kaWNhdG9yKCk7XG5cbiAgICBUaHJvdHRsZWRFdmVudHMub24oJ3Jlc2l6ZScsIHBvc2l0aW9uSWZOZWVkZWQpO1xuICAgIHJhY3RpdmUub24oJ3RlYXJkb3duJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIFRocm90dGxlZEV2ZW50cy5vZmYoJ3Jlc2l6ZScsIHBvc2l0aW9uSWZOZWVkZWQpO1xuICAgIH0pO1xuICAgIFRocm90dGxlZEV2ZW50cy5vbignc2Nyb2xsJywgcG9zaXRpb25JZk5lZWRlZCk7XG4gICAgcmFjdGl2ZS5vbigndGVhcmRvd24nLCBmdW5jdGlvbigpIHtcbiAgICAgICAgVGhyb3R0bGVkRXZlbnRzLm9mZignc2Nyb2xsJywgcG9zaXRpb25JZk5lZWRlZCk7XG4gICAgfSk7XG5cbiAgICAvLyBUT0RPOiBjb25zaWRlciBhbHNvIGxpc3RlbmluZyB0byBzcmMgYXR0cmlidXRlIGNoYW5nZXMsIHdoaWNoIG1pZ2h0IGFmZmVjdCB0aGUgaGVpZ2h0IG9mIGVsZW1lbnRzIG9uIHRoZSBwYWdlXG4gICAgTXV0YXRpb25PYnNlcnZlci5hZGRBZGRpdGlvbkxpc3RlbmVyKGVsZW1lbnRzQWRkZWRPclJlbW92ZWQpO1xuICAgIE11dGF0aW9uT2JzZXJ2ZXIuYWRkUmVtb3ZhbExpc3RlbmVyKGVsZW1lbnRzQWRkZWRPclJlbW92ZWQpO1xuXG4gICAgZnVuY3Rpb24gZWxlbWVudHNBZGRlZE9yUmVtb3ZlZCgkZWxlbWVudHMpIHtcbiAgICAgICAgLy8gUmVwb3NpdGlvbiB0aGUgaW5kaWNhdG9yIGlmIGVsZW1lbnRzIHdoaWNoIG1pZ2h0IGFkanVzdCB0aGUgY29udGFpbmVyJ3MgcG9zaXRpb24gYXJlIGFkZGVkL3JlbW92ZWQuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgJGVsZW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgJGVsZW1lbnQgPSAkZWxlbWVudHNbaV07XG4gICAgICAgICAgICBpZiAoJGVsZW1lbnQuaGVpZ2h0KCkgPiAwKSB7XG4gICAgICAgICAgICAgICAgcG9zaXRpb25JZk5lZWRlZCgpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHZhciBsYXN0Q29udGFpbmVyT2Zmc2V0ID0gJGNvbnRhaW5lckVsZW1lbnQub2Zmc2V0KCk7XG4gICAgdmFyIGxhc3RDb250YWluZXJIZWlnaHQgPSAkY29udGFpbmVyRWxlbWVudC5oZWlnaHQoKTtcblxuICAgIGZ1bmN0aW9uIHBvc2l0aW9uSWZOZWVkZWQoKSB7XG4gICAgICAgIHZhciBjb250YWluZXJPZmZzZXQgPSAkY29udGFpbmVyRWxlbWVudC5vZmZzZXQoKTtcbiAgICAgICAgdmFyIGNvbnRhaW5lckhlaWdodCA9ICRjb250YWluZXJFbGVtZW50LmhlaWdodCgpO1xuICAgICAgICBpZiAoY29udGFpbmVyT2Zmc2V0LnRvcCA9PT0gbGFzdENvbnRhaW5lck9mZnNldC50b3AgJiZcbiAgICAgICAgICAgIGNvbnRhaW5lck9mZnNldC5sZWZ0ID09PSBsYXN0Q29udGFpbmVyT2Zmc2V0LmxlZnQgJiZcbiAgICAgICAgICAgIGNvbnRhaW5lckhlaWdodCA9PT0gbGFzdENvbnRhaW5lckhlaWdodCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGxhc3RDb250YWluZXJPZmZzZXQgPSBjb250YWluZXJPZmZzZXQ7XG4gICAgICAgIGxhc3RDb250YWluZXJIZWlnaHQgPSBjb250YWluZXJIZWlnaHQ7XG4gICAgICAgIHBvc2l0aW9uSW5kaWNhdG9yKCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcG9zaXRpb25JbmRpY2F0b3IoKSB7XG4gICAgICAgIC8vIFBvc2l0aW9uIHRoZSB3cmFwcGVyIGVsZW1lbnQgKHdoaWNoIGhhcyBhIGhhcmRjb2RlZCB3aWR0aCkgaW4gdGhlIGFwcHJvcHJpYXRlIGNvcm5lci4gVGhlbiBmbGlwIHRoZSBsZWZ0L3JpZ2h0XG4gICAgICAgIC8vIHBvc2l0aW9uaW5nIG9mIHRoZSBuZXN0ZWQgd2lkZ2V0IGVsZW1lbnQgdG8gYWRqdXN0IHRoZSB3YXkgaXQgd2lsbCBleHBhbmQgd2hlbiB0aGUgbWVkaWEgaXMgaG92ZXJlZC5cbiAgICAgICAgdmFyIGNvcm5lciA9IGdyb3VwU2V0dGluZ3MubWVkaWFJbmRpY2F0b3JDb3JuZXIoKTtcbiAgICAgICAgdmFyIGVsZW1lbnRPZmZzZXQgPSAkY29udGFpbmVyRWxlbWVudC5vZmZzZXQoKTtcbiAgICAgICAgdmFyIGNvb3JkcyA9IHt9O1xuICAgICAgICBpZiAoY29ybmVyLmluZGV4T2YoJ3RvcCcpICE9PSAtMSkge1xuICAgICAgICAgICAgY29vcmRzLnRvcCA9IGVsZW1lbnRPZmZzZXQudG9wO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29vcmRzLnRvcCA9IGVsZW1lbnRPZmZzZXQudG9wICsgJGNvbnRhaW5lckVsZW1lbnQuaGVpZ2h0KCkgLSAkcm9vdEVsZW1lbnQub3V0ZXJIZWlnaHQoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY29ybmVyLmluZGV4T2YoJ3JpZ2h0JykgIT09IC0xKSB7XG4gICAgICAgICAgICBjb29yZHMubGVmdCA9IGVsZW1lbnRPZmZzZXQubGVmdCArICRjb250YWluZXJFbGVtZW50LndpZHRoKCkgLSAkd3JhcHBlckVsZW1lbnQub3V0ZXJXaWR0aCgpO1xuICAgICAgICAgICAgJHJvb3RFbGVtZW50LmNzcyh7cmlnaHQ6MCxsZWZ0OicnfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb29yZHMubGVmdCA9IGVsZW1lbnRPZmZzZXQubGVmdDtcbiAgICAgICAgICAgICRyb290RWxlbWVudC5jc3Moe3JpZ2h0OicnLGxlZnQ6MH0pO1xuICAgICAgICB9XG4gICAgICAgICR3cmFwcGVyRWxlbWVudC5jc3MoY29vcmRzKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHdyYXBwZXJFbGVtZW50KHJhY3RpdmUpIHtcbiAgICByZXR1cm4gcmFjdGl2ZS5maW5kKCcuYW50ZW5uYS1tZWRpYS1pbmRpY2F0b3Itd3JhcHBlcicpO1xufVxuXG5mdW5jdGlvbiByb290RWxlbWVudChyYWN0aXZlKSB7XG4gICAgcmV0dXJuIHJhY3RpdmUuZmluZCgnLmFudGVubmEtbWVkaWEtaW5kaWNhdG9yLXdpZGdldCcpO1xufVxuXG5mdW5jdGlvbiBvcGVuUmVhY3Rpb25zV2luZG93KHJlYWN0aW9uT3B0aW9ucywgcmFjdGl2ZSkge1xuICAgIFJlYWN0aW9uc1dpZGdldC5vcGVuKHJlYWN0aW9uT3B0aW9ucywgcm9vdEVsZW1lbnQocmFjdGl2ZSkpO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlOiBjcmVhdGVJbmRpY2F0b3JXaWRnZXRcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgQWpheENsaWVudCA9IHJlcXVpcmUoJy4vdXRpbHMvYWpheC1jbGllbnQnKTtcbnZhciBQYWdlVXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzL3BhZ2UtdXRpbHMnKTtcbnZhciBUaHJvdHRsZWRFdmVudHMgPSByZXF1aXJlKCcuL3V0aWxzL3Rocm90dGxlZC1ldmVudHMnKTtcbnZhciBVUkxzID0gcmVxdWlyZSgnLi91dGlscy91cmxzJyk7XG52YXIgUGFnZURhdGEgPSByZXF1aXJlKCcuL3BhZ2UtZGF0YScpO1xuXG4vLyBDb21wdXRlIHRoZSBwYWdlcyB0aGF0IHdlIG5lZWQgdG8gZmV0Y2guIFRoaXMgaXMgZWl0aGVyOlxuLy8gMS4gQW55IG5lc3RlZCBwYWdlcyB3ZSBmaW5kIHVzaW5nIHRoZSBwYWdlIHNlbGVjdG9yIE9SXG4vLyAyLiBUaGUgY3VycmVudCB3aW5kb3cgbG9jYXRpb25cbmZ1bmN0aW9uIGNvbXB1dGVQYWdlc1BhcmFtKCRwYWdlRWxlbWVudEFycmF5LCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGdyb3VwSWQgPSBncm91cFNldHRpbmdzLmdyb3VwSWQoKTtcbiAgICB2YXIgcGFnZXMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8ICRwYWdlRWxlbWVudEFycmF5Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciAkcGFnZUVsZW1lbnQgPSAkcGFnZUVsZW1lbnRBcnJheVtpXTtcbiAgICAgICAgcGFnZXMucHVzaCh7XG4gICAgICAgICAgICBncm91cF9pZDogZ3JvdXBJZCxcbiAgICAgICAgICAgIHVybDogUGFnZVV0aWxzLmNvbXB1dGVQYWdlVXJsKCRwYWdlRWxlbWVudCwgZ3JvdXBTZXR0aW5ncyksXG4gICAgICAgICAgICB0aXRsZTogUGFnZVV0aWxzLmNvbXB1dGVQYWdlVGl0bGUoJHBhZ2VFbGVtZW50LCBncm91cFNldHRpbmdzKVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgaWYgKHBhZ2VzLmxlbmd0aCA9PSAxKSB7XG4gICAgICAgIHBhZ2VzWzBdLmltYWdlID0gUGFnZVV0aWxzLmNvbXB1dGVUb3BMZXZlbFBhZ2VJbWFnZShncm91cFNldHRpbmdzKTtcbiAgICAgICAgcGFnZXNbMF0uYXV0aG9yID0gUGFnZVV0aWxzLmNvbXB1dGVQYWdlQXV0aG9yKGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICBwYWdlc1swXS50b3BpY3MgPSBQYWdlVXRpbHMuY29tcHV0ZVBhZ2VUb3BpY3MoZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIHBhZ2VzWzBdLnNlY3Rpb24gPSBQYWdlVXRpbHMuY29tcHV0ZVBhZ2VTaXRlU2VjdGlvbihncm91cFNldHRpbmdzKTtcbiAgICB9XG5cbiAgICByZXR1cm4geyBwYWdlczogcGFnZXMgfTtcbn1cblxuZnVuY3Rpb24gbG9hZFBhZ2VEYXRhKHBhZ2VEYXRhUGFyYW0sIGdyb3VwU2V0dGluZ3MpIHtcbiAgICBBamF4Q2xpZW50LmdldEpTT05QKFVSTHMucGFnZURhdGFVcmwoKSwgcGFnZURhdGFQYXJhbSwgc3VjY2VzcywgZXJyb3IpO1xuXG4gICAgZnVuY3Rpb24gc3VjY2Vzcyhqc29uKSB7XG4gICAgICAgIC8vc2V0VGltZW91dChmdW5jdGlvbigpIHsgUGFnZURhdGEudXBkYXRlQWxsUGFnZURhdGEoanNvbiwgZ3JvdXBTZXR0aW5ncyk7IH0sIDMwMDApO1xuICAgICAgICBQYWdlRGF0YS51cGRhdGVBbGxQYWdlRGF0YShqc29uLCBncm91cFNldHRpbmdzKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBlcnJvcihtZXNzYWdlKSB7XG4gICAgICAgIC8vIFRPRE8gaGFuZGxlIGVycm9ycyB0aGF0IGhhcHBlbiB3aGVuIGxvYWRpbmcgcGFnZSBkYXRhXG4gICAgICAgIGNvbnNvbGUubG9nKCdBbiBlcnJvciBvY2N1cnJlZCBsb2FkaW5nIHBhZ2UgZGF0YTogJyArIG1lc3NhZ2UpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gc3RhcnRMb2FkaW5nUGFnZURhdGEoZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciAkcGFnZUVsZW1lbnRzID0gJChncm91cFNldHRpbmdzLnBhZ2VTZWxlY3RvcigpKTtcbiAgICBpZiAoJHBhZ2VFbGVtZW50cy5sZW5ndGggPT0gMCkge1xuICAgICAgICAkcGFnZUVsZW1lbnRzID0gJCgnYm9keScpO1xuICAgIH1cbiAgICBxdWV1ZVBhZ2VEYXRhTG9hZCgkcGFnZUVsZW1lbnRzLCBncm91cFNldHRpbmdzKTtcbn1cblxuZnVuY3Rpb24gcXVldWVQYWdlRGF0YUxvYWQoJHBhZ2VFbGVtZW50cywgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBwYWdlc1RvTG9hZCA9IFtdO1xuICAgICRwYWdlRWxlbWVudHMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRwYWdlRWxlbWVudCA9ICQodGhpcyk7XG4gICAgICAgIGlmIChpc0luVmlldygkcGFnZUVsZW1lbnQpKSB7XG4gICAgICAgICAgICBwYWdlc1RvTG9hZC5wdXNoKCRwYWdlRWxlbWVudCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsb2FkV2hlblZpc2libGUoJHBhZ2VFbGVtZW50LCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgdmFyIHBhZ2VEYXRhUGFyYW0gPSBjb21wdXRlUGFnZXNQYXJhbShwYWdlc1RvTG9hZCwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgLy8gVE9ETzogZGVsZXRlIHRoZSBjb21tZW50ZWQgbGluZSBiZWxvdywgd2hpY2ggaXMgZm9yIHRlc3RpbmcgcHVycG9zZXNcbiAgICAvL3BhZ2VEYXRhUGFyYW0gPSB7cGFnZXM6IFt7XCJncm91cF9pZFwiOjExODQsIFwidXJsXCI6XCJodHRwOi8vd3d3LmR1a2VjaHJvbmljbGUuY29tL2FydGljbGVzLzIwMTQvMDIvMTQvcG9ydHJhaXQtcG9ybi1zdGFyXCIsXCJjYW5vbmljYWxfdXJsXCI6XCJzYW1lXCIsXCJ0aXRsZVwiOlwiUG9ydHJhaXQgb2YgYSBwb3JuIHN0YXJcIixcImltYWdlXCI6XCJcIn1dfTtcbiAgICBsb2FkUGFnZURhdGEocGFnZURhdGFQYXJhbSwgZ3JvdXBTZXR0aW5ncyk7XG59XG5cbmZ1bmN0aW9uIGlzSW5WaWV3KCRlbGVtZW50KSB7XG4gICAgdmFyIHRyaWdnZXJEaXN0YW5jZSA9IDMwMDtcbiAgICByZXR1cm4gJGVsZW1lbnQub2Zmc2V0KCkudG9wIDwgICQoZG9jdW1lbnQpLnNjcm9sbFRvcCgpICsgJCh3aW5kb3cpLmhlaWdodCgpICsgdHJpZ2dlckRpc3RhbmNlO1xufVxuXG5mdW5jdGlvbiBsb2FkV2hlblZpc2libGUoJHBhZ2VFbGVtZW50LCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGNoZWNrVmlzaWJpbGl0eSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoaXNJblZpZXcoJHBhZ2VFbGVtZW50KSkge1xuICAgICAgICAgICAgdmFyIHBhZ2VEYXRhUGFyYW0gPSBjb21wdXRlUGFnZXNQYXJhbShbJHBhZ2VFbGVtZW50XSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICBsb2FkUGFnZURhdGEocGFnZURhdGFQYXJhbSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICBUaHJvdHRsZWRFdmVudHMub2ZmKCdzY3JvbGwnLCBjaGVja1Zpc2liaWxpdHkpO1xuICAgICAgICAgICAgVGhyb3R0bGVkRXZlbnRzLm9mZigncmVzaXplJywgY2hlY2tWaXNpYmlsaXR5KTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgVGhyb3R0bGVkRXZlbnRzLm9uKCdzY3JvbGwnLCBjaGVja1Zpc2liaWxpdHkpO1xuICAgIFRocm90dGxlZEV2ZW50cy5vbigncmVzaXplJywgY2hlY2tWaXNpYmlsaXR5KTtcbn1cblxuZnVuY3Rpb24gcGFnZXNBZGRlZCgkcGFnZUVsZW1lbnRzLCBncm91cFNldHRpbmdzKSB7XG4gICAgcXVldWVQYWdlRGF0YUxvYWQoJHBhZ2VFbGVtZW50cywgZ3JvdXBTZXR0aW5ncyk7XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBsb2FkOiBzdGFydExvYWRpbmdQYWdlRGF0YSxcbiAgICBwYWdlc0FkZGVkOiBwYWdlc0FkZGVkXG59OyIsInZhciAkOyByZXF1aXJlKCcuL3V0aWxzL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xuXG52YXIgRXZlbnRzID0gcmVxdWlyZSgnLi9ldmVudHMnKTtcbnZhciBIYXNoZWRFbGVtZW50cyA9IHJlcXVpcmUoJy4vaGFzaGVkLWVsZW1lbnRzJyk7XG5cbi8vIENvbGxlY3Rpb24gb2YgYWxsIHBhZ2UgZGF0YSwga2V5ZWQgYnkgcGFnZSBoYXNoXG52YXIgcGFnZXMgPSB7fTtcbi8vIE1hcHBpbmcgb2YgcGFnZSBVUkxzIHRvIHBhZ2UgaGFzaGVzLCB3aGljaCBhcmUgY29tcHV0ZWQgb24gdGhlIHNlcnZlci5cbnZhciB1cmxIYXNoZXMgPSB7fTtcblxuZnVuY3Rpb24gZ2V0UGFnZURhdGEoaGFzaCkge1xuICAgIHZhciBwYWdlRGF0YSA9IHBhZ2VzW2hhc2hdO1xuICAgIGlmICghcGFnZURhdGEpIHtcbiAgICAgICAgLy8gVE9ETzogR2l2ZSB0aGlzIHNlcmlvdXMgdGhvdWdodC4gSW4gb3JkZXIgZm9yIG1hZ2ljIG1vZGUgdG8gd29yaywgdGhlIG9iamVjdCBuZWVkcyB0byBoYXZlIHZhbHVlcyBpbiBwbGFjZSBmb3JcbiAgICAgICAgLy8gdGhlIG9ic2VydmVkIHByb3BlcnRpZXMgYXQgdGhlIG1vbWVudCB0aGUgcmFjdGl2ZSBpcyBjcmVhdGVkLiBCdXQgdGhpcyBpcyBwcmV0dHkgdW51c3VhbCBmb3IgSmF2YXNjcmlwdCwgdG8gaGF2ZVxuICAgICAgICAvLyB0byBkZWZpbmUgdGhlIHdob2xlIHNrZWxldG9uIGZvciB0aGUgb2JqZWN0IGluc3RlYWQgb2YganVzdCBhZGRpbmcgcHJvcGVydGllcyB3aGVuZXZlciB5b3Ugd2FudC5cbiAgICAgICAgLy8gVGhlIGFsdGVybmF0aXZlIHdvdWxkIGJlIGZvciB1cyB0byBrZWVwIG91ciBvd24gXCJkYXRhIGJpbmRpbmdcIiBiZXR3ZWVuIHRoZSBwYWdlRGF0YSBhbmQgcmFjdGl2ZSBpbnN0YW5jZXMgKDEgdG8gbWFueSlcbiAgICAgICAgLy8gYW5kIHRlbGwgdGhlIHJhY3RpdmVzIHRvIHVwZGF0ZSB3aGVuZXZlciB0aGUgZGF0YSBjaGFuZ2VzLlxuICAgICAgICBwYWdlRGF0YSA9IHtcbiAgICAgICAgICAgIHBhZ2VIYXNoOiBoYXNoLFxuICAgICAgICAgICAgc3VtbWFyeVJlYWN0aW9uczogW10sXG4gICAgICAgICAgICBzdW1tYXJ5VG90YWw6IDAsXG4gICAgICAgICAgICBzdW1tYXJ5TG9hZGVkOiBmYWxzZSxcbiAgICAgICAgICAgIGNvbnRhaW5lcnM6IFtdLFxuICAgICAgICAgICAgbWV0cmljczoge30gLy8gVGhpcyBpcyBhIGNhdGNoLWFsbCBmaWVsZCB3aGVyZSB3ZSBjYW4gYXR0YWNoIGNsaWVudC1zaWRlIG1ldHJpY3MgZm9yIGFuYWx5dGljc1xuICAgICAgICB9O1xuICAgICAgICBwYWdlc1toYXNoXSA9IHBhZ2VEYXRhO1xuICAgIH1cbiAgICByZXR1cm4gcGFnZURhdGE7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZUFsbFBhZ2VEYXRhKGpzb25QYWdlcywgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBhbGxQYWdlcyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwganNvblBhZ2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBwYWdlRGF0YSA9IHVwZGF0ZVBhZ2VEYXRhKGpzb25QYWdlc1tpXSwgZ3JvdXBTZXR0aW5ncylcbiAgICAgICAgYWxsUGFnZXMucHVzaChwYWdlRGF0YSk7XG4gICAgICAgIEV2ZW50cy5wb3N0UGFnZURhdGFMb2FkZWQocGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gdXBkYXRlUGFnZURhdGEoanNvbiwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBwYWdlRGF0YSA9IGdldFBhZ2VEYXRhRm9ySnNvblJlc3BvbnNlKGpzb24pO1xuICAgIHBhZ2VEYXRhLnBhZ2VJZCA9IGpzb24uaWQ7XG4gICAgcGFnZURhdGEucGFnZUhhc2ggPSBqc29uLnBhZ2VIYXNoO1xuICAgIHBhZ2VEYXRhLmdyb3VwSWQgPSBncm91cFNldHRpbmdzLmdyb3VwSWQoKTtcbiAgICBwYWdlRGF0YS5jYW5vbmljYWxVcmwgPSBqc29uLmNhbm9uaWNhbFVSTDtcbiAgICBwYWdlRGF0YS5yZXF1ZXN0ZWRVcmwgPSBqc29uLnJlcXVlc3RlZFVSTDtcbiAgICBwYWdlRGF0YS5hdXRob3IgPSBqc29uLmF1dGhvcjtcbiAgICBwYWdlRGF0YS5zZWN0aW9uID0ganNvbi5zZWN0aW9uO1xuICAgIHBhZ2VEYXRhLnRvcGljcyA9IGpzb24udG9waWNzO1xuICAgIHBhZ2VEYXRhLnRpdGxlID0ganNvbi50aXRsZTtcbiAgICBwYWdlRGF0YS5pbWFnZSA9IGpzb24uaW1hZ2U7XG5cbiAgICB2YXIgc3VtbWFyeVJlYWN0aW9ucyA9IGpzb24uc3VtbWFyeVJlYWN0aW9ucztcbiAgICBwYWdlRGF0YS5zdW1tYXJ5UmVhY3Rpb25zID0gc3VtbWFyeVJlYWN0aW9ucztcbiAgICBzZXRDb250YWluZXJzKHBhZ2VEYXRhLCBqc29uLmNvbnRhaW5lcnMpO1xuXG4gICAgLy8gV2UgYWRkIHVwIHRoZSBzdW1tYXJ5IHJlYWN0aW9uIHRvdGFsIGNsaWVudC1zaWRlXG4gICAgdmFyIHRvdGFsID0gMDtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN1bW1hcnlSZWFjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdG90YWwgPSB0b3RhbCArIHN1bW1hcnlSZWFjdGlvbnNbaV0uY291bnQ7XG4gICAgfVxuICAgIHBhZ2VEYXRhLnN1bW1hcnlUb3RhbCA9IHRvdGFsO1xuICAgIHBhZ2VEYXRhLnN1bW1hcnlMb2FkZWQgPSB0cnVlO1xuXG4gICAgLy8gV2UgYWRkIHVwIHRoZSBjb250YWluZXIgcmVhY3Rpb24gdG90YWxzIGNsaWVudC1zaWRlXG4gICAgdmFyIHRvdGFsID0gMDtcbiAgICB2YXIgY29udGFpbmVyQ291bnRzID0gW107XG4gICAgdmFyIGNvbnRhaW5lcnMgPSBwYWdlRGF0YS5jb250YWluZXJzO1xuICAgIGZvciAodmFyIGhhc2ggaW4ganNvbi5jb250YWluZXJzKSB7XG4gICAgICAgIGlmIChjb250YWluZXJzLmhhc093blByb3BlcnR5KGhhc2gpKSB7XG4gICAgICAgICAgICB2YXIgY29udGFpbmVyID0gY29udGFpbmVyc1toYXNoXTtcbiAgICAgICAgICAgIHZhciB0b3RhbCA9IDA7XG4gICAgICAgICAgICB2YXIgY29udGFpbmVyUmVhY3Rpb25zID0gY29udGFpbmVyLnJlYWN0aW9ucztcbiAgICAgICAgICAgIGlmIChjb250YWluZXJSZWFjdGlvbnMpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvbnRhaW5lclJlYWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICB0b3RhbCA9IHRvdGFsICsgY29udGFpbmVyUmVhY3Rpb25zW2ldLmNvdW50O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnRhaW5lci5yZWFjdGlvblRvdGFsID0gdG90YWw7XG4gICAgICAgICAgICBjb250YWluZXJDb3VudHMucHVzaCh7IGNvdW50OiB0b3RhbCwgY29udGFpbmVyOiBjb250YWluZXIgfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgdmFyIGluZGljYXRvckxpbWl0ID0gZ3JvdXBTZXR0aW5ncy50ZXh0SW5kaWNhdG9yTGltaXQoKTtcbiAgICBpZiAoaW5kaWNhdG9yTGltaXQpIHtcbiAgICAgICAgLy8gSWYgYW4gaW5kaWNhdG9yIGxpbWl0IGlzIHNldCwgc29ydCB0aGUgY29udGFpbmVycyBhbmQgbWFyayBvbmx5IHRoZSB0b3AgTiB0byBiZSB2aXNpYmxlLlxuICAgICAgICBjb250YWluZXJDb3VudHMuc29ydChmdW5jdGlvbihhLCBiKSB7IHJldHVybiBiLmNvdW50IC0gYS5jb3VudDsgfSk7IC8vIHNvcnQgbGFyZ2VzdCBjb3VudCBmaXJzdFxuICAgICAgICBmb3IgKHZhciBpID0gaW5kaWNhdG9yTGltaXQ7IGkgPCBjb250YWluZXJDb3VudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnRhaW5lckNvdW50c1tpXS5jb250YWluZXIuc3VwcHJlc3MgPSB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHBhZ2VEYXRhO1xufVxuXG5mdW5jdGlvbiBnZXRDb250YWluZXJEYXRhKHBhZ2VEYXRhLCBjb250YWluZXJIYXNoKSB7XG4gICAgdmFyIGNvbnRhaW5lckRhdGEgPSBwYWdlRGF0YS5jb250YWluZXJzW2NvbnRhaW5lckhhc2hdO1xuICAgIGlmICghY29udGFpbmVyRGF0YSkge1xuICAgICAgICBjb250YWluZXJEYXRhID0ge1xuICAgICAgICAgICAgaGFzaDogY29udGFpbmVySGFzaCxcbiAgICAgICAgICAgIHJlYWN0aW9uVG90YWw6IDAsXG4gICAgICAgICAgICByZWFjdGlvbnM6IFtdLFxuICAgICAgICAgICAgbG9hZGVkOiBwYWdlRGF0YS5zdW1tYXJ5TG9hZGVkLFxuICAgICAgICAgICAgc3VwcHJlc3M6IGZhbHNlXG4gICAgICAgIH07XG4gICAgICAgIHBhZ2VEYXRhLmNvbnRhaW5lcnNbY29udGFpbmVySGFzaF0gPSBjb250YWluZXJEYXRhO1xuICAgIH1cbiAgICByZXR1cm4gY29udGFpbmVyRGF0YTtcbn1cblxuLy8gTWVyZ2UgdGhlIGdpdmVuIGNvbnRhaW5lciBkYXRhIGludG8gdGhlIHBhZ2VEYXRhLmNvbnRhaW5lcnMgZGF0YS4gVGhpcyBpcyBuZWNlc3NhcnkgYmVjYXVzZSB0aGUgc2tlbGV0b24gb2YgdGhlIHBhZ2VEYXRhLmNvbnRhaW5lcnMgbWFwXG4vLyBpcyBzZXQgdXAgYW5kIGJvdW5kIHRvIHRoZSBVSSBiZWZvcmUgYWxsIHRoZSBkYXRhIGlzIGZldGNoZWQgZnJvbSB0aGUgc2VydmVyIGFuZCB3ZSBkb24ndCB3YW50IHRvIGJyZWFrIHRoZSBkYXRhIGJpbmRpbmcuXG5mdW5jdGlvbiBzZXRDb250YWluZXJzKHBhZ2VEYXRhLCBqc29uQ29udGFpbmVycykge1xuICAgIGZvciAodmFyIGhhc2ggaW4ganNvbkNvbnRhaW5lcnMpIHtcbiAgICAgICAgaWYgKGpzb25Db250YWluZXJzLmhhc093blByb3BlcnR5KGhhc2gpKSB7XG4gICAgICAgICAgICB2YXIgY29udGFpbmVyRGF0YSA9IGdldENvbnRhaW5lckRhdGEocGFnZURhdGEsIGhhc2gpO1xuICAgICAgICAgICAgdmFyIGZldGNoZWRDb250YWluZXJEYXRhID0ganNvbkNvbnRhaW5lcnNbaGFzaF07XG4gICAgICAgICAgICBjb250YWluZXJEYXRhLmlkID0gZmV0Y2hlZENvbnRhaW5lckRhdGEuaWQ7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGZldGNoZWRDb250YWluZXJEYXRhLnJlYWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGNvbnRhaW5lckRhdGEucmVhY3Rpb25zLnB1c2goZmV0Y2hlZENvbnRhaW5lckRhdGEucmVhY3Rpb25zW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICB2YXIgYWxsQ29udGFpbmVycyA9IHBhZ2VEYXRhLmNvbnRhaW5lcnM7XG4gICAgZm9yICh2YXIgaGFzaCBpbiBhbGxDb250YWluZXJzKSB7XG4gICAgICAgIGlmIChhbGxDb250YWluZXJzLmhhc093blByb3BlcnR5KGhhc2gpKSB7XG4gICAgICAgICAgICB2YXIgY29udGFpbmVyID0gYWxsQ29udGFpbmVyc1toYXNoXTtcbiAgICAgICAgICAgIGNvbnRhaW5lci5sb2FkZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBjbGVhckluZGljYXRvckxpbWl0KHBhZ2VEYXRhKSB7XG4gICAgdmFyIGNvbnRhaW5lcnMgPSBwYWdlRGF0YS5jb250YWluZXJzO1xuICAgIGZvciAodmFyIGhhc2ggaW4gY29udGFpbmVycykge1xuICAgICAgICBpZiAoY29udGFpbmVycy5oYXNPd25Qcm9wZXJ0eShoYXNoKSkge1xuICAgICAgICAgICAgdmFyIGNvbnRhaW5lciA9IGNvbnRhaW5lcnNbaGFzaF07XG4gICAgICAgICAgICBjb250YWluZXIuc3VwcHJlc3MgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLy8gUmV0dXJucyB0aGUgbG9jYXRpb25zIHdoZXJlIHRoZSBnaXZlbiByZWFjdGlvbiBvY2N1cnMgb24gdGhlIHBhZ2UuIFRoZSByZXR1cm4gZm9ybWF0IGlzOlxuLy8ge1xuLy8gICA8Y29udGVudF9pZD4gOiB7XG4vLyAgICAgY291bnQ6IDxudW1iZXI+LFxuLy8gICAgIGlkOiA8Y29udGVudF9pZD4sXG4vLyAgICAgY29udGFpbmVySUQ6IDxjb250YWluZXJfaWQ+XG4vLyAgICAga2luZDogPGNvbnRlbnQga2luZD4sXG4vLyAgICAgbG9jYXRpb246IDxsb2NhdGlvbj4sXG4vLyAgICAgW2JvZHk6IDxib2R5Pl0gZmlsbGVkIGluIGxhdGVyIHZpYSB1cGRhdGVMb2NhdGlvbkRhdGFcbi8vICAgfVxuLy8gfVxuZnVuY3Rpb24gZ2V0UmVhY3Rpb25Mb2NhdGlvbkRhdGEocmVhY3Rpb24sIHBhZ2VEYXRhKSB7XG4gICAgaWYgKCFwYWdlRGF0YS5sb2NhdGlvbkRhdGEpIHsgLy8gUG9wdWxhdGUgdGhpcyB0cmVlIGxhemlseSwgc2luY2UgaXQncyBub3QgZnJlcXVlbnRseSB1c2VkLlxuICAgICAgICBwYWdlRGF0YS5sb2NhdGlvbkRhdGEgPSBjb21wdXRlTG9jYXRpb25EYXRhKHBhZ2VEYXRhKTtcbiAgICB9XG4gICAgcmV0dXJuIHBhZ2VEYXRhLmxvY2F0aW9uRGF0YVtyZWFjdGlvbi5pZF07XG59XG5cbi8vIFJldHVybnMgYSB2aWV3IG9uIHRoZSBnaXZlbiB0cmVlIHN0cnVjdHVyZSB0aGF0J3Mgb3B0aW1pemVkIGZvciByZW5kZXJpbmcgdGhlIGxvY2F0aW9uIG9mIHJlYWN0aW9ucyAoYXMgZnJvbSB0aGVcbi8vIHN1bW1hcnkgd2lkZ2V0KS4gRm9yIGVhY2ggcmVhY3Rpb24sIHdlIGNhbiBxdWlja2x5IGdldCB0byB0aGUgcGllY2VzIG9mIGNvbnRlbnQgdGhhdCBoYXZlIHRoYXQgcmVhY3Rpb24gYXMgd2VsbCBhc1xuLy8gdGhlIGNvdW50IG9mIHRob3NlIHJlYWN0aW9ucyBmb3IgZWFjaCBwaWVjZSBvZiBjb250ZW50LlxuLy9cbi8vIFRoZSBzdHJ1Y3R1cmUgbG9va3MgbGlrZSB0aGlzOlxuLy8ge1xuLy8gICA8cmVhY3Rpb25faWQ+IDogeyAgICh0aGlzIGlzIHRoZSBpbnRlcmFjdGlvbl9ub2RlX2lkKVxuLy8gICAgIDxjb250ZW50X2lkPiA6IHtcbi8vICAgICAgIGNvdW50IDogPG51bWJlcj4sXG4vLyAgICAgICBjb250YWluZXJJRDogPGNvbnRhaW5lcl9pZD4sXG4vLyAgICAgICBraW5kOiA8Y29udGVudCBraW5kPixcbi8vICAgICAgIGxvY2F0aW9uOiA8bG9jYXRpb24+XG4vLyAgICAgICBbYm9keTogPGJvZHk+XSBmaWxsZWQgaW4gbGF0ZXIgdmlhIHVwZGF0ZUxvY2F0aW9uRGF0YVxuLy8gICAgIH1cbi8vICAgfVxuLy8gfVxuZnVuY3Rpb24gY29tcHV0ZUxvY2F0aW9uRGF0YShwYWdlRGF0YSkge1xuICAgIHZhciBsb2NhdGlvbkRhdGEgPSB7fTtcbiAgICB2YXIgY29udGFpbmVycyA9IHBhZ2VEYXRhLmNvbnRhaW5lcnM7XG4gICAgZm9yICh2YXIgaGFzaCBpbiBjb250YWluZXJzKSB7XG4gICAgICAgIGlmIChjb250YWluZXJzLmhhc093blByb3BlcnR5KGhhc2gpKSB7XG4gICAgICAgICAgICB2YXIgY29udGFpbmVyRGF0YSA9IGNvbnRhaW5lcnNbaGFzaF07XG4gICAgICAgICAgICB2YXIgcmVhY3Rpb25zID0gY29udGFpbmVyRGF0YS5yZWFjdGlvbnM7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJlYWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciByZWFjdGlvbiA9IHJlYWN0aW9uc1tpXTtcbiAgICAgICAgICAgICAgICB2YXIgcmVhY3Rpb25JZCA9IHJlYWN0aW9uLmlkO1xuICAgICAgICAgICAgICAgIHZhciBjb250ZW50ID0gcmVhY3Rpb24uY29udGVudDtcbiAgICAgICAgICAgICAgICB2YXIgY29udGVudElkID0gY29udGVudC5pZDtcbiAgICAgICAgICAgICAgICB2YXIgcmVhY3Rpb25Mb2NhdGlvbkRhdGEgPSBsb2NhdGlvbkRhdGFbcmVhY3Rpb25JZF07XG4gICAgICAgICAgICAgICAgaWYgKCFyZWFjdGlvbkxvY2F0aW9uRGF0YSkge1xuICAgICAgICAgICAgICAgICAgICByZWFjdGlvbkxvY2F0aW9uRGF0YSA9IHt9O1xuICAgICAgICAgICAgICAgICAgICBsb2NhdGlvbkRhdGFbcmVhY3Rpb25JZF0gPSByZWFjdGlvbkxvY2F0aW9uRGF0YTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIGNvbnRlbnRMb2NhdGlvbkRhdGEgPSByZWFjdGlvbkxvY2F0aW9uRGF0YVtjb250ZW50SWRdOyAvLyBUT0RPOiBJdCdzIG5vdCByZWFsbHkgcG9zc2libGUgdG8gZ2V0IGEgaGl0IGhlcmUsIGlzIGl0PyBXZSBzaG91bGQgbmV2ZXIgc2VlIHR3byBpbnN0YW5jZXMgb2YgdGhlIHNhbWUgcmVhY3Rpb24gZm9yIHRoZSBzYW1lIGNvbnRlbnQ/IChUaGVyZSdkIHdvdWxkIGp1c3QgYmUgb25lIGluc3RhbmNlIHdpdGggYSBjb3VudCA+IDEuKVxuICAgICAgICAgICAgICAgIGlmICghY29udGVudExvY2F0aW9uRGF0YSkge1xuICAgICAgICAgICAgICAgICAgICBjb250ZW50TG9jYXRpb25EYXRhID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY291bnQ6IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICBraW5kOiBjb250ZW50LmtpbmQsIC8vIFRPRE86IFdlIHNob3VsZCBub3JtYWxpemUgdGhpcyB2YWx1ZSB0byBhIHNldCBvZiBjb25zdGFudHMuIGZpeCB0aGlzIGluIGxvY2F0aW9ucy1wYWdlIHdoZXJlIHRoZSB2YWx1ZSBpcyByZWFkIGFzIHdlbGwuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiBhbHNvIGNvbnNpZGVyIHRyYW5zbGF0aW5nIHRoaXMgZnJvbSB0aGUgcmF3IFwia2luZFwiIHRvIFwidHlwZVwiLiAoZS5nLiBcInBhZ1wiID0+IFwicGFnZVwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgbG9jYXRpb246IGNvbnRlbnQubG9jYXRpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250YWluZXJIYXNoOiBjb250YWluZXJEYXRhLmhhc2gsXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50SWQ6IGNvbnRlbnRJZFxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICByZWFjdGlvbkxvY2F0aW9uRGF0YVtjb250ZW50SWRdID0gY29udGVudExvY2F0aW9uRGF0YTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29udGVudExvY2F0aW9uRGF0YS5jb3VudCArPSByZWFjdGlvbi5jb3VudDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbG9jYXRpb25EYXRhO1xufVxuXG5mdW5jdGlvbiB1cGRhdGVSZWFjdGlvbkxvY2F0aW9uRGF0YShyZWFjdGlvbkxvY2F0aW9uRGF0YSwgY29udGVudEJvZGllcykge1xuICAgIGZvciAodmFyIGNvbnRlbnRJZCBpbiBjb250ZW50Qm9kaWVzKSB7XG4gICAgICAgIGlmIChjb250ZW50Qm9kaWVzLmhhc093blByb3BlcnR5KGNvbnRlbnRJZCkpIHtcbiAgICAgICAgICAgIHZhciBjb250ZW50TG9jYXRpb25EYXRhID0gcmVhY3Rpb25Mb2NhdGlvbkRhdGFbY29udGVudElkXTtcbiAgICAgICAgICAgIGlmIChjb250ZW50TG9jYXRpb25EYXRhKSB7XG4gICAgICAgICAgICAgICAgY29udGVudExvY2F0aW9uRGF0YS5ib2R5ID0gY29udGVudEJvZGllc1tjb250ZW50SWRdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiByZWdpc3RlclJlYWN0aW9uKHJlYWN0aW9uLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSkge1xuICAgIHZhciBleGlzdGluZ1JlYWN0aW9ucyA9IGNvbnRhaW5lckRhdGEucmVhY3Rpb25zO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZXhpc3RpbmdSZWFjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGV4aXN0aW5nUmVhY3Rpb25zW2ldLmlkID09PSByZWFjdGlvbi5pZCkge1xuICAgICAgICAgICAgLy8gVGhpcyByZWFjdGlvbiBoYXMgYWxyZWFkeSBiZWVuIGFkZGVkIHRvIHRoaXMgY29udGFpbmVyLiBEb24ndCBhZGQgaXQgYWdhaW4uXG4gICAgICAgICAgICByZXR1cm4gZXhpc3RpbmdSZWFjdGlvbnNbaV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgY29udGFpbmVyRGF0YS5yZWFjdGlvbnMucHVzaChyZWFjdGlvbik7XG4gICAgY29udGFpbmVyRGF0YS5yZWFjdGlvblRvdGFsID0gY29udGFpbmVyRGF0YS5yZWFjdGlvblRvdGFsICsgMTtcbiAgICB2YXIgc3VtbWFyeVJlYWN0aW9uID0ge1xuICAgICAgICB0ZXh0OiByZWFjdGlvbi50ZXh0LFxuICAgICAgICBpZDogcmVhY3Rpb24uaWQsXG4gICAgICAgIGNvdW50OiByZWFjdGlvbi5jb3VudFxuICAgIH07XG4gICAgcGFnZURhdGEuc3VtbWFyeVJlYWN0aW9ucy5wdXNoKHN1bW1hcnlSZWFjdGlvbik7XG4gICAgcGFnZURhdGEuc3VtbWFyeVRvdGFsID0gcGFnZURhdGEuc3VtbWFyeVRvdGFsICsgMTtcbiAgICByZXR1cm4gcmVhY3Rpb247XG59XG5cbi8vIEdldHMgcGFnZSBkYXRhIGJhc2VkIG9uIGEgVVJMLiBUaGlzIGFsbG93cyBvdXIgY2xpZW50IHRvIHN0YXJ0IHByb2Nlc3NpbmcgYSBwYWdlIChhbmQgYmluZGluZyBkYXRhIG9iamVjdHNcbi8vIHRvIHRoZSBVSSkgKmJlZm9yZSogd2UgZ2V0IGRhdGEgYmFjayBmcm9tIHRoZSBzZXJ2ZXIuXG5mdW5jdGlvbiBnZXRQYWdlRGF0YUJ5VVJMKHVybCkge1xuICAgIHZhciBzZXJ2ZXJIYXNoID0gdXJsSGFzaGVzW3VybF07XG4gICAgaWYgKHNlcnZlckhhc2gpIHtcbiAgICAgICAgLy8gSWYgdGhlIHNlcnZlciBhbHJlYWR5IGdpdmVuIHVzIHRoZSBoYXNoIGZvciB0aGUgcGFnZSwgdXNlIGl0LlxuICAgICAgICByZXR1cm4gZ2V0UGFnZURhdGEoc2VydmVySGFzaCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy8gT3RoZXJ3aXNlLCB0ZW1wb3JhcmlseSB1c2UgdGhlIHVybCBhcyB0aGUgaGFzaC4gVGhpcyB3aWxsIGdldCB1cGRhdGVkIHdoZW5ldmVyIHdlIGdldCBkYXRhIGJhY2sgZnJvbSB0aGUgc2VydmVyLlxuICAgICAgICByZXR1cm4gZ2V0UGFnZURhdGEodXJsKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGdldFBhZ2VEYXRhRm9ySnNvblJlc3BvbnNlKGpzb24pIHtcbiAgICB2YXIgcGFnZUhhc2ggPSBqc29uLnBhZ2VIYXNoO1xuICAgIHZhciByZXF1ZXN0ZWRVUkwgPSBqc29uLnJlcXVlc3RlZFVSTDtcbiAgICB1cmxIYXNoZXNbcmVxdWVzdGVkVVJMXSA9IHBhZ2VIYXNoO1xuICAgIHZhciB1cmxCYXNlZERhdGEgPSBwYWdlc1tyZXF1ZXN0ZWRVUkxdO1xuICAgIGlmICh1cmxCYXNlZERhdGEpIHtcbiAgICAgICAgLy8gSWYgd2UndmUgYWxyZWFkeSBjcmVhdGVkL2JvdW5kIGEgcGFnZURhdGEgb2JqZWN0IHVuZGVyIHRoZSByZXF1ZXN0ZWRVcmwsIHVwZGF0ZSB0aGUgcGFnZUhhc2ggYW5kIG1vdmUgdGhhdFxuICAgICAgICAvLyBkYXRhIG92ZXIgdG8gdGhlIGhhc2gga2V5XG4gICAgICAgIHVybEJhc2VkRGF0YS5wYWdlSGFzaCA9IGpzb24ucGFnZUhhc2g7XG4gICAgICAgIHBhZ2VzW3BhZ2VIYXNoXSA9IHVybEJhc2VkRGF0YTtcbiAgICAgICAgZGVsZXRlIHBhZ2VzW3JlcXVlc3RlZFVSTF07XG4gICAgICAgIC8vIFVwZGF0ZSB0aGUgbWFwcGluZyBvZiBoYXNoZXMgdG8gcGFnZSBlbGVtZW50cyBzbyBpdCBhbHNvIGtub3dzIGFib3V0IHRoZSBjaGFuZ2UgdG8gdGhlIHBhZ2UgaGFzaFxuICAgICAgICBIYXNoZWRFbGVtZW50cy51cGRhdGVQYWdlSGFzaChyZXF1ZXN0ZWRVUkwsIHBhZ2VIYXNoKTtcbiAgICB9XG4gICAgcmV0dXJuIGdldFBhZ2VEYXRhKHBhZ2VIYXNoKTtcbn1cblxuZnVuY3Rpb24gdGVhcmRvd24oKSB7XG4gICAgcGFnZXMgPSB7fTtcbiAgICB1cmxIYXNoZXMgPSB7fTtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGdldFBhZ2VEYXRhQnlVUkw6IGdldFBhZ2VEYXRhQnlVUkwsXG4gICAgZ2V0UGFnZURhdGE6IGdldFBhZ2VEYXRhLFxuICAgIHVwZGF0ZUFsbFBhZ2VEYXRhOiB1cGRhdGVBbGxQYWdlRGF0YSxcbiAgICBnZXRDb250YWluZXJEYXRhOiBnZXRDb250YWluZXJEYXRhLFxuICAgIGdldFJlYWN0aW9uTG9jYXRpb25EYXRhOiBnZXRSZWFjdGlvbkxvY2F0aW9uRGF0YSxcbiAgICB1cGRhdGVSZWFjdGlvbkxvY2F0aW9uRGF0YTogdXBkYXRlUmVhY3Rpb25Mb2NhdGlvbkRhdGEsXG4gICAgcmVnaXN0ZXJSZWFjdGlvbjogcmVnaXN0ZXJSZWFjdGlvbixcbiAgICBjbGVhckluZGljYXRvckxpbWl0OiBjbGVhckluZGljYXRvckxpbWl0LFxuICAgIHRlYXJkb3duOiB0ZWFyZG93bixcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgQXBwTW9kZSA9IHJlcXVpcmUoJy4vdXRpbHMvYXBwLW1vZGUnKTtcbnZhciBIYXNoID0gcmVxdWlyZSgnLi91dGlscy9oYXNoJyk7XG52YXIgTXV0YXRpb25PYnNlcnZlciA9IHJlcXVpcmUoJy4vdXRpbHMvbXV0YXRpb24tb2JzZXJ2ZXInKTtcbnZhciBQYWdlVXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzL3BhZ2UtdXRpbHMnKTtcbnZhciBVUkxzID0gcmVxdWlyZSgnLi91dGlscy91cmxzJyk7XG52YXIgV2lkZ2V0QnVja2V0ID0gcmVxdWlyZSgnLi91dGlscy93aWRnZXQtYnVja2V0Jyk7XG5cbnZhciBBdXRvQ2FsbFRvQWN0aW9uID0gcmVxdWlyZSgnLi9hdXRvLWNhbGwtdG8tYWN0aW9uJyk7XG52YXIgQ2FsbFRvQWN0aW9uSW5kaWNhdG9yID0gcmVxdWlyZSgnLi9jYWxsLXRvLWFjdGlvbi1pbmRpY2F0b3InKTtcbnZhciBIYXNoZWRFbGVtZW50cyA9IHJlcXVpcmUoJy4vaGFzaGVkLWVsZW1lbnRzJyk7XG52YXIgTWVkaWFJbmRpY2F0b3JXaWRnZXQgPSByZXF1aXJlKCcuL21lZGlhLWluZGljYXRvci13aWRnZXQnKTtcbnZhciBQYWdlRGF0YSA9IHJlcXVpcmUoJy4vcGFnZS1kYXRhJyk7XG52YXIgUGFnZURhdGFMb2FkZXIgPSByZXF1aXJlKCcuL3BhZ2UtZGF0YS1sb2FkZXInKTtcbnZhciBTdW1tYXJ5V2lkZ2V0ID0gcmVxdWlyZSgnLi9zdW1tYXJ5LXdpZGdldCcpO1xudmFyIFRleHRJbmRpY2F0b3JXaWRnZXQgPSByZXF1aXJlKCcuL3RleHQtaW5kaWNhdG9yLXdpZGdldCcpO1xudmFyIFRleHRSZWFjdGlvbnMgPSByZXF1aXJlKCcuL3RleHQtcmVhY3Rpb25zJyk7XG5cbnZhciBUWVBFX1RFWFQgPSBcInRleHRcIjtcbnZhciBUWVBFX0lNQUdFID0gXCJpbWFnZVwiO1xudmFyIFRZUEVfTUVESUEgPSBcIm1lZGlhXCI7XG5cbnZhciBBVFRSX0hBU0ggPSBcImFudC1oYXNoXCI7XG5cbnZhciBjcmVhdGVkV2lkZ2V0cyA9IFtdO1xuXG5cbi8vIFNjYW4gZm9yIGFsbCBwYWdlcyBhdCB0aGUgY3VycmVudCBicm93c2VyIGxvY2F0aW9uLiBUaGlzIGNvdWxkIGp1c3QgYmUgdGhlIGN1cnJlbnQgcGFnZSBvciBpdCBjb3VsZCBiZSBhIGNvbGxlY3Rpb25cbi8vIG9mIHBhZ2VzIChha2EgJ3Bvc3RzJykuXG5mdW5jdGlvbiBzY2FuQWxsUGFnZXMoZ3JvdXBTZXR0aW5ncywgcmVpbml0aWFsaXplQ2FsbGJhY2spIHtcbiAgICAkKGdyb3VwU2V0dGluZ3MuZXhjbHVzaW9uU2VsZWN0b3IoKSkuYWRkQ2xhc3MoJ25vLWFudCcpOyAvLyBBZGQgdGhlIG5vLWFudCBjbGFzcyB0byBldmVyeXRoaW5nIHRoYXQgaXMgZmxhZ2dlZCBmb3IgZXhjbHVzaW9uXG4gICAgdmFyICRwYWdlcyA9ICQoZ3JvdXBTZXR0aW5ncy5wYWdlU2VsZWN0b3IoKSk7IC8vIFRPRE86IG5vLWFudD9cbiAgICBpZiAoJHBhZ2VzLmxlbmd0aCA9PSAwKSB7XG4gICAgICAgIC8vIElmIHdlIGRvbid0IGRldGVjdCBhbnkgcGFnZSBtYXJrZXJzLCB0cmVhdCB0aGUgd2hvbGUgZG9jdW1lbnQgYXMgdGhlIHNpbmdsZSBwYWdlXG4gICAgICAgICRwYWdlcyA9ICQoJ2JvZHknKTsgLy8gVE9ETzogSXMgdGhpcyB0aGUgcmlnaHQgYmVoYXZpb3I/IChLZWVwIGluIHN5bmMgd2l0aCB0aGUgc2FtZSBhc3N1bXB0aW9uIHRoYXQncyBidWlsdCBpbnRvIHBhZ2UtZGF0YS1sb2FkZXIuKVxuICAgIH1cbiAgICAkcGFnZXMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRwYWdlID0gJCh0aGlzKTtcbiAgICAgICAgc2NhblBhZ2UoJHBhZ2UsIGdyb3VwU2V0dGluZ3MsICRwYWdlcy5sZW5ndGggPiAxKTtcbiAgICB9KTtcbiAgICBzZXR1cE11dGF0aW9uT2JzZXJ2ZXIoZ3JvdXBTZXR0aW5ncywgcmVpbml0aWFsaXplQ2FsbGJhY2spO1xufVxuXG4vLyBTY2FuIHRoZSBwYWdlIHVzaW5nIHRoZSBnaXZlbiBzZXR0aW5nczpcbi8vIDEuIEZpbmQgYWxsIHRoZSBjb250YWluZXJzIHRoYXQgd2UgY2FyZSBhYm91dC5cbi8vIDIuIENvbXB1dGUgaGFzaGVzIGZvciBlYWNoIGNvbnRhaW5lci5cbi8vIDMuIEluc2VydCB3aWRnZXQgYWZmb3JkYW5jZXMgZm9yIGVhY2ggd2hpY2ggYXJlIGJvdW5kIHRvIHRoZSBkYXRhIG1vZGVsIGJ5IHRoZSBoYXNoZXMuXG5mdW5jdGlvbiBzY2FuUGFnZSgkcGFnZSwgZ3JvdXBTZXR0aW5ncywgaXNNdWx0aVBhZ2UpIHtcbiAgICB2YXIgdXJsID0gUGFnZVV0aWxzLmNvbXB1dGVQYWdlVXJsKCRwYWdlLCBncm91cFNldHRpbmdzKTtcbiAgICB2YXIgcGFnZURhdGEgPSBQYWdlRGF0YS5nZXRQYWdlRGF0YUJ5VVJMKHVybCk7XG4gICAgdmFyICRhY3RpdmVTZWN0aW9ucyA9IGZpbmQoJHBhZ2UsIGdyb3VwU2V0dGluZ3MuYWN0aXZlU2VjdGlvbnMoKSwgdHJ1ZSk7XG5cbiAgICAvLyBGaXJzdCwgc2NhbiBmb3IgZWxlbWVudHMgdGhhdCB3b3VsZCBjYXVzZSB1cyB0byBpbnNlcnQgc29tZXRoaW5nIGludG8gdGhlIERPTSB0aGF0IHRha2VzIHVwIHNwYWNlLlxuICAgIC8vIFdlIHdhbnQgdG8gZ2V0IGFueSBwYWdlIHJlc2l6aW5nIG91dCBvZiB0aGUgd2F5IGFzIGVhcmx5IGFzIHBvc3NpYmxlLlxuICAgIC8vIFRPRE86IENvbnNpZGVyIGRvaW5nIHRoaXMgd2l0aCByYXcgSmF2YXNjcmlwdCBiZWZvcmUgalF1ZXJ5IGxvYWRzLCB0byBmdXJ0aGVyIHJlZHVjZSB0aGUgZGVsYXkuIFdlIHdvdWxkbid0XG4gICAgLy8gc2F2ZSBhICp0b24qIG9mIHRpbWUgZnJvbSB0aGlzLCB0aG91Z2gsIHNvIGl0J3MgZGVmaW5pdGVseSBhIGxhdGVyIG9wdGltaXphdGlvbi5cbiAgICBzY2FuRm9yU3VtbWFyaWVzKCRwYWdlLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7IC8vIFN1bW1hcnkgd2lkZ2V0IG1heSBiZSBvbiB0aGUgcGFnZSwgYnV0IG91dHNpZGUgdGhlIGFjdGl2ZSBzZWN0aW9uXG4gICAgJGFjdGl2ZVNlY3Rpb25zLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkc2VjdGlvbiA9ICQodGhpcyk7XG4gICAgICAgIGNyZWF0ZUF1dG9DYWxsc1RvQWN0aW9uKCRzZWN0aW9uLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgfSk7XG4gICAgLy8gU2NhbiBmb3IgQ1RBcyBhY3Jvc3MgdGhlIGVudGlyZSBwYWdlICh0aGV5IGNhbiBiZSBvdXRzaWRlIGFuIGFjdGl2ZSBzZWN0aW9uKS4gQ1RBcyBoYXZlIHRvIGdvIGJlZm9yZSBzY2FucyBmb3JcbiAgICAvLyBjb250ZW50IGJlY2F1c2UgY29udGVudCBpbnZvbHZlZCBpbiBDVEFzIHdpbGwgYmUgdGFnZ2VkIG5vLWFudC5cbiAgICBzY2FuRm9yQ2FsbHNUb0FjdGlvbigkcGFnZSwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgIC8vIFRoZW4gc2NhbiBmb3IgZXZlcnl0aGluZyBlbHNlXG4gICAgJGFjdGl2ZVNlY3Rpb25zLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkc2VjdGlvbiA9ICQodGhpcyk7XG4gICAgICAgIHNjYW5BY3RpdmVFbGVtZW50KCRzZWN0aW9uLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgfSk7XG5cbiAgICBwYWdlRGF0YS5tZXRyaWNzLmhlaWdodCA9IGNvbXB1dGVQYWdlSGVpZ2h0KCRhY3RpdmVTZWN0aW9ucyk7XG4gICAgcGFnZURhdGEubWV0cmljcy5pc011bHRpUGFnZSA9IGlzTXVsdGlQYWdlO1xufVxuXG5mdW5jdGlvbiBjb21wdXRlUGFnZUhlaWdodCgkYWN0aXZlU2VjdGlvbnMpIHtcbiAgICB2YXIgY29udGVudFRvcDtcbiAgICB2YXIgY29udGVudEJvdHRvbTtcbiAgICAkYWN0aXZlU2VjdGlvbnMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRzZWN0aW9uID0gJCh0aGlzKTtcbiAgICAgICAgdmFyIG9mZnNldCA9ICRzZWN0aW9uLm9mZnNldCgpO1xuICAgICAgICBjb250ZW50VG9wID0gY29udGVudFRvcCA9PT0gdW5kZWZpbmVkID8gb2Zmc2V0LnRvcCA6IE1hdGgubWluKGNvbnRlbnRUb3AsIG9mZnNldC50b3ApO1xuICAgICAgICB2YXIgYm90dG9tID0gb2Zmc2V0LnRvcCArICRzZWN0aW9uLm91dGVySGVpZ2h0KCk7XG4gICAgICAgIGNvbnRlbnRCb3R0b20gPSBjb250ZW50Qm90dG9tID09PSB1bmRlZmluZWQgPyBib3R0b20gOiBNYXRoLm1heChjb250ZW50Qm90dG9tLCBib3R0b20pO1xuICAgIH0pO1xuICAgIHJldHVybiBjb250ZW50Qm90dG9tIC0gY29udGVudFRvcDtcbn1cblxuLy8gU2NhbnMgdGhlIGdpdmVuIGVsZW1lbnQsIHdoaWNoIGFwcGVhcnMgaW5zaWRlIGFuIGFjdGl2ZSBzZWN0aW9uLiBUaGUgZWxlbWVudCBjYW4gYmUgdGhlIGVudGlyZSBhY3RpdmUgc2VjdGlvbixcbi8vIHNvbWUgY29udGFpbmVyIHdpdGhpbiB0aGUgYWN0aXZlIHNlY3Rpb24sIG9yIGEgbGVhZiBub2RlIGluIHRoZSBhY3RpdmUgc2VjdGlvbi5cbmZ1bmN0aW9uIHNjYW5BY3RpdmVFbGVtZW50KCRlbGVtZW50LCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHNjYW5Gb3JDb250ZW50KCRlbGVtZW50LCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG59XG5cbmZ1bmN0aW9uIHNjYW5Gb3JTdW1tYXJpZXMoJGVsZW1lbnQsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyICRzdW1tYXJpZXMgPSBmaW5kKCRlbGVtZW50LCBncm91cFNldHRpbmdzLnN1bW1hcnlTZWxlY3RvcigpLCB0cnVlLCB0cnVlKTsgLy8gc3VtbWFyeSB3aWRnZXRzIGNhbiBiZSBpbnNpZGUgbm8tYW50IHNlY3Rpb25zXG4gICAgJHN1bW1hcmllcy5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgJHN1bW1hcnkgPSAkKHRoaXMpO1xuICAgICAgICB2YXIgY29udGFpbmVyRGF0YSA9IFBhZ2VEYXRhLmdldENvbnRhaW5lckRhdGEocGFnZURhdGEsICdwYWdlJyk7IC8vIE1hZ2ljIGhhc2ggZm9yIHBhZ2UgcmVhY3Rpb25zXG4gICAgICAgIGNvbnRhaW5lckRhdGEudHlwZSA9ICdwYWdlJzsgLy8gVE9ETzogcmV2aXNpdCB3aGV0aGVyIGl0IG1ha2VzIHNlbnNlIHRvIHNldCB0aGUgdHlwZSBoZXJlXG4gICAgICAgIHZhciBkZWZhdWx0UmVhY3Rpb25zID0gZ3JvdXBTZXR0aW5ncy5kZWZhdWx0UmVhY3Rpb25zKCRzdW1tYXJ5KTsgLy8gVE9ETzogZG8gd2Ugc3VwcG9ydCBjdXN0b21pemluZyB0aGUgZGVmYXVsdCByZWFjdGlvbnMgYXQgdGhpcyBsZXZlbD9cbiAgICAgICAgdmFyIHN1bW1hcnlXaWRnZXQgPSBTdW1tYXJ5V2lkZ2V0LmNyZWF0ZShjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgZGVmYXVsdFJlYWN0aW9ucywgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIHZhciAkc3VtbWFyeUVsZW1lbnQgPSBzdW1tYXJ5V2lkZ2V0LmVsZW1lbnQ7XG4gICAgICAgIGluc2VydENvbnRlbnQoJHN1bW1hcnksICRzdW1tYXJ5RWxlbWVudCwgZ3JvdXBTZXR0aW5ncy5zdW1tYXJ5TWV0aG9kKCkpO1xuICAgICAgICBjcmVhdGVkV2lkZ2V0cy5wdXNoKHN1bW1hcnlXaWRnZXQpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBzY2FuRm9yQ2FsbHNUb0FjdGlvbigkZWxlbWVudCwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgY3RhVGFyZ2V0cyA9IHt9OyAvLyBUaGUgZWxlbWVudHMgdGhhdCB0aGUgY2FsbCB0byBhY3Rpb25zIGFjdCBvbiAoZS5nLiB0aGUgaW1hZ2Ugb3IgdmlkZW8pXG4gICAgZmluZCgkZWxlbWVudCwgJ1thbnQtaXRlbV0nLCB0cnVlKS5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgJGN0YVRhcmdldCA9ICQodGhpcyk7XG4gICAgICAgICRjdGFUYXJnZXQuYWRkQ2xhc3MoJ25vLWFudCcpOyAvLyBkb24ndCBzaG93IHRoZSBub3JtYWwgcmVhY3Rpb24gYWZmb3JkYW5jZSBvbiBhIGN0YSB0YXJnZXRcbiAgICAgICAgdmFyIGFudEl0ZW1JZCA9ICRjdGFUYXJnZXQuYXR0cignYW50LWl0ZW0nKS50cmltKCk7XG4gICAgICAgIGN0YVRhcmdldHNbYW50SXRlbUlkXSA9ICRjdGFUYXJnZXQ7XG4gICAgfSk7XG5cbiAgICB2YXIgY3RhTGFiZWxzID0ge307IC8vIE9wdGlvbmFsIGVsZW1lbnRzIHRoYXQgcmVwb3J0IHRoZSBudW1iZXIgb2YgcmVhY3Rpb25zIHRvIHRoZSBjdGEgKGUuZy4gXCIxIHJlYWN0aW9uXCIpXG4gICAgZmluZCgkZWxlbWVudCwgJ1thbnQtcmVhY3Rpb25zLWxhYmVsLWZvcl0nLCB0cnVlKS5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgJGN0YUxhYmVsID0gJCh0aGlzKTtcbiAgICAgICAgJGN0YUxhYmVsLmFkZENsYXNzKCduby1hbnQnKTsgLy8gZG9uJ3Qgc2hvdyB0aGUgbm9ybWFsIHJlYWN0aW9uIGFmZm9yZGFuY2Ugb24gYSBjdGEgbGFiZWxcbiAgICAgICAgdmFyIGFudEl0ZW1JZCA9ICRjdGFMYWJlbC5hdHRyKCdhbnQtcmVhY3Rpb25zLWxhYmVsLWZvcicpLnRyaW0oKTtcbiAgICAgICAgY3RhTGFiZWxzW2FudEl0ZW1JZF0gPSBjdGFMYWJlbHNbYW50SXRlbUlkXSB8fCBbXTtcbiAgICAgICAgY3RhTGFiZWxzW2FudEl0ZW1JZF0ucHVzaCgkY3RhTGFiZWwpO1xuICAgIH0pO1xuXG4gICAgdmFyIGN0YUNvdW50ZXJzID0ge307IC8vIE9wdGlvbmFsIGVsZW1lbnRzIHRoYXQgcmVwb3J0IG9ubHkgdGhlIGNvdW50IG9mIHJlYWN0aW9uIHRvIGEgY3RhIChlLmcuIFwiMVwiKVxuICAgIGZpbmQoJGVsZW1lbnQsICdbYW50LWNvdW50ZXItZm9yXScsIHRydWUpLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkY3RhQ291bnRlciA9ICQodGhpcyk7XG4gICAgICAgICRjdGFDb3VudGVyLmFkZENsYXNzKCduby1hbnQnKTsgLy8gZG9uJ3Qgc2hvdyB0aGUgbm9ybWFsIHJlYWN0aW9uIGFmZm9yZGFuY2Ugb24gYSBjdGEgY291bnRlclxuICAgICAgICB2YXIgYW50SXRlbUlkID0gJGN0YUNvdW50ZXIuYXR0cignYW50LWNvdW50ZXItZm9yJykudHJpbSgpO1xuICAgICAgICBjdGFDb3VudGVyc1thbnRJdGVtSWRdID0gY3RhQ291bnRlcnNbYW50SXRlbUlkXSB8fCBbXTtcbiAgICAgICAgY3RhQ291bnRlcnNbYW50SXRlbUlkXS5wdXNoKCRjdGFDb3VudGVyKTtcbiAgICB9KTtcblxuICAgIHZhciBjdGFFeHBhbmRlZFJlYWN0aW9ucyA9IHt9OyAvLyBPcHRpb25hbCBlbGVtZW50cyB0aGF0IHNob3cgZXhwYW5kZWQgcmVhY3Rpb25zIGZvciB0aGUgY3RhIChlLmcuIFwiSW50ZXJlc3RpbmcgKDE1KSBObyB0aGFua3MgKDEwKVwiKVxuICAgIGZpbmQoJGVsZW1lbnQsICdbYW50LWV4cGFuZGVkLXJlYWN0aW9ucy1mb3JdJywgdHJ1ZSkuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRjdGFFeHBhbmRlZFJlYWN0aW9uQXJlYSA9ICQodGhpcyk7XG4gICAgICAgICRjdGFFeHBhbmRlZFJlYWN0aW9uQXJlYS5hZGRDbGFzcygnbm8tYW50Jyk7IC8vIGRvbid0IHNob3cgdGhlIG5vcm1hbCByZWFjdGlvbiBhZmZvcmRhbmNlIG9uIGEgY3RhIGNvdW50ZXJcbiAgICAgICAgdmFyIGFudEl0ZW1JZCA9ICRjdGFFeHBhbmRlZFJlYWN0aW9uQXJlYS5hdHRyKCdhbnQtZXhwYW5kZWQtcmVhY3Rpb25zLWZvcicpLnRyaW0oKTtcbiAgICAgICAgY3RhRXhwYW5kZWRSZWFjdGlvbnNbYW50SXRlbUlkXSA9IGN0YUV4cGFuZGVkUmVhY3Rpb25zW2FudEl0ZW1JZF0gfHwgW107XG4gICAgICAgIGN0YUV4cGFuZGVkUmVhY3Rpb25zW2FudEl0ZW1JZF0ucHVzaCgkY3RhRXhwYW5kZWRSZWFjdGlvbkFyZWEpO1xuICAgIH0pO1xuXG4gICAgdmFyICRjdGFFbGVtZW50cyA9IGZpbmQoJGVsZW1lbnQsICdbYW50LWN0YS1mb3JdJyk7IC8vIFRoZSBjYWxsIHRvIGFjdGlvbiBlbGVtZW50cyB3aGljaCBwcm9tcHQgdGhlIHVzZXIgdG8gcmVhY3RcbiAgICAkY3RhRWxlbWVudHMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRjdGFFbGVtZW50ID0gJCh0aGlzKTtcbiAgICAgICAgdmFyIGFudEl0ZW1JZCA9ICRjdGFFbGVtZW50LmF0dHIoJ2FudC1jdGEtZm9yJyk7XG4gICAgICAgIHZhciAkdGFyZ2V0RWxlbWVudCA9IGN0YVRhcmdldHNbYW50SXRlbUlkXTtcbiAgICAgICAgaWYgKCR0YXJnZXRFbGVtZW50KSB7XG4gICAgICAgICAgICB2YXIgaGFzaCA9IGNvbXB1dGVIYXNoKCR0YXJnZXRFbGVtZW50LCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICB2YXIgY29udGVudERhdGEgPSBjb21wdXRlQ29udGVudERhdGEoJHRhcmdldEVsZW1lbnQsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgaWYgKGhhc2ggJiYgY29udGVudERhdGEpIHtcbiAgICAgICAgICAgICAgICB2YXIgY29udGFpbmVyRGF0YSA9IFBhZ2VEYXRhLmdldENvbnRhaW5lckRhdGEocGFnZURhdGEsIGhhc2gpO1xuICAgICAgICAgICAgICAgIGNvbnRhaW5lckRhdGEudHlwZSA9IGNvbXB1dGVFbGVtZW50VHlwZSgkdGFyZ2V0RWxlbWVudCk7IC8vIFRPRE86IHJldmlzaXQgd2hldGhlciBpdCBtYWtlcyBzZW5zZSB0byBzZXQgdGhlIHR5cGUgaGVyZVxuICAgICAgICAgICAgICAgIHZhciBjYWxsVG9BY3Rpb24gPSBDYWxsVG9BY3Rpb25JbmRpY2F0b3IuY3JlYXRlKHtcbiAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyRGF0YTogY29udGFpbmVyRGF0YSxcbiAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyRWxlbWVudDogJHRhcmdldEVsZW1lbnQsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnREYXRhOiBjb250ZW50RGF0YSxcbiAgICAgICAgICAgICAgICAgICAgY3RhRWxlbWVudDogJGN0YUVsZW1lbnQsXG4gICAgICAgICAgICAgICAgICAgIGN0YUxhYmVsczogY3RhTGFiZWxzW2FudEl0ZW1JZF0sXG4gICAgICAgICAgICAgICAgICAgIGN0YUNvdW50ZXJzOiBjdGFDb3VudGVyc1thbnRJdGVtSWRdLFxuICAgICAgICAgICAgICAgICAgICBjdGFFeHBhbmRlZFJlYWN0aW9uczogY3RhRXhwYW5kZWRSZWFjdGlvbnNbYW50SXRlbUlkXSxcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdFJlYWN0aW9uczogZ3JvdXBTZXR0aW5ncy5kZWZhdWx0UmVhY3Rpb25zKCR0YXJnZXRFbGVtZW50KSxcbiAgICAgICAgICAgICAgICAgICAgcGFnZURhdGE6IHBhZ2VEYXRhLFxuICAgICAgICAgICAgICAgICAgICBncm91cFNldHRpbmdzOiBncm91cFNldHRpbmdzXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY3JlYXRlZFdpZGdldHMucHVzaChjYWxsVG9BY3Rpb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSlcbn1cblxuZnVuY3Rpb24gY3JlYXRlQXV0b0NhbGxzVG9BY3Rpb24oJHNlY3Rpb24sIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyICRjdGFUYXJnZXRzID0gZmluZCgkc2VjdGlvbiwgZ3JvdXBTZXR0aW5ncy5nZW5lcmF0ZWRDdGFTZWxlY3RvcigpKTtcbiAgICAkY3RhVGFyZ2V0cy5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgJGN0YVRhcmdldCA9ICQodGhpcyk7XG4gICAgICAgIHZhciBhbnRJdGVtSWQgPSBnZW5lcmF0ZUFudEl0ZW1BdHRyaWJ1dGUoKTtcbiAgICAgICAgJGN0YVRhcmdldC5hdHRyKCdhbnQtaXRlbScsIGFudEl0ZW1JZCk7XG4gICAgICAgIHZhciBhdXRvQ3RhID0gQXV0b0NhbGxUb0FjdGlvbi5jcmVhdGUoYW50SXRlbUlkLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICRjdGFUYXJnZXQuYWZ0ZXIoYXV0b0N0YS5lbGVtZW50KTsgLy8gVE9ETzogbWFrZSB0aGUgaW5zZXJ0IGJlaGF2aW9yIGNvbmZpZ3VyYWJsZSBsaWtlIHRoZSBzdW1tYXJ5XG4gICAgICAgIGNyZWF0ZWRXaWRnZXRzLnB1c2goYXV0b0N0YSk7XG4gICAgfSk7XG59XG5cbnZhciBnZW5lcmF0ZUFudEl0ZW1BdHRyaWJ1dGUgPSBmdW5jdGlvbihpbmRleCkge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuICdhbnRlbm5hX2F1dG9fY3RhXycgKyBpbmRleCsrO1xuICAgIH1cbn0oMCk7XG5cbmZ1bmN0aW9uIHNjYW5Gb3JDb250ZW50KCRlbGVtZW50LCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciAkY29udGVudEVsZW1lbnRzID0gZmluZCgkZWxlbWVudCwgZ3JvdXBTZXR0aW5ncy5jb250ZW50U2VsZWN0b3IoKSwgdHJ1ZSk7XG4gICAgJGNvbnRlbnRFbGVtZW50cy5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgJGNvbnRlbnRFbGVtZW50ID0gJCh0aGlzKTtcbiAgICAgICAgdmFyIHR5cGUgPSBjb21wdXRlRWxlbWVudFR5cGUoJGNvbnRlbnRFbGVtZW50KTtcbiAgICAgICAgc3dpdGNoKHR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgVFlQRV9JTUFHRTpcbiAgICAgICAgICAgIGNhc2UgVFlQRV9NRURJQTpcbiAgICAgICAgICAgICAgICBzY2FuTWVkaWEoJGNvbnRlbnRFbGVtZW50LCB0eXBlLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFRZUEVfVEVYVDpcbiAgICAgICAgICAgICAgICBzY2FuVGV4dCgkY29udGVudEVsZW1lbnQsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBzY2FuVGV4dCgkdGV4dEVsZW1lbnQsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgaWYgKHNob3VsZEhhc2hUZXh0KCR0ZXh0RWxlbWVudCwgZ3JvdXBTZXR0aW5ncykpIHtcbiAgICAgICAgdmFyIGhhc2ggPSBjb21wdXRlSGFzaCgkdGV4dEVsZW1lbnQsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgaWYgKGhhc2gpIHtcbiAgICAgICAgICAgIHZhciBjb250YWluZXJEYXRhID0gUGFnZURhdGEuZ2V0Q29udGFpbmVyRGF0YShwYWdlRGF0YSwgaGFzaCk7XG4gICAgICAgICAgICBjb250YWluZXJEYXRhLnR5cGUgPSAndGV4dCc7IC8vIFRPRE86IHJldmlzaXQgd2hldGhlciBpdCBtYWtlcyBzZW5zZSB0byBzZXQgdGhlIHR5cGUgaGVyZVxuICAgICAgICAgICAgdmFyIGRlZmF1bHRSZWFjdGlvbnMgPSBncm91cFNldHRpbmdzLmRlZmF1bHRSZWFjdGlvbnMoJHRleHRFbGVtZW50KTtcbiAgICAgICAgICAgIHZhciB0ZXh0SW5kaWNhdG9yID0gVGV4dEluZGljYXRvcldpZGdldC5jcmVhdGUoe1xuICAgICAgICAgICAgICAgICAgICBjb250YWluZXJEYXRhOiBjb250YWluZXJEYXRhLFxuICAgICAgICAgICAgICAgICAgICBjb250YWluZXJFbGVtZW50OiAkdGV4dEVsZW1lbnQsXG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHRSZWFjdGlvbnM6IGRlZmF1bHRSZWFjdGlvbnMsXG4gICAgICAgICAgICAgICAgICAgIHBhZ2VEYXRhOiBwYWdlRGF0YSxcbiAgICAgICAgICAgICAgICAgICAgZ3JvdXBTZXR0aW5nczogZ3JvdXBTZXR0aW5nc1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICB2YXIgJGluZGljYXRvckVsZW1lbnQgPSB0ZXh0SW5kaWNhdG9yLmVsZW1lbnQ7XG4gICAgICAgICAgICB2YXIgbGFzdE5vZGUgPSBsYXN0Q29udGVudE5vZGUoJHRleHRFbGVtZW50LmdldCgwKSk7XG4gICAgICAgICAgICBpZiAobGFzdE5vZGUubm9kZVR5cGUgIT09IDMpIHtcbiAgICAgICAgICAgICAgICAkKGxhc3ROb2RlKS5iZWZvcmUoJGluZGljYXRvckVsZW1lbnQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAkdGV4dEVsZW1lbnQuYXBwZW5kKCRpbmRpY2F0b3JFbGVtZW50KTsgLy8gVE9ETyBpcyB0aGlzIGNvbmZpZ3VyYWJsZSBhbGEgaW5zZXJ0Q29udGVudCguLi4pP1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY3JlYXRlZFdpZGdldHMucHVzaCh0ZXh0SW5kaWNhdG9yKTtcblxuICAgICAgICAgICAgdmFyIHRleHRSZWFjdGlvbnMgPSBUZXh0UmVhY3Rpb25zLmNyZWF0ZVJlYWN0YWJsZVRleHQoe1xuICAgICAgICAgICAgICAgIGNvbnRhaW5lckRhdGE6IGNvbnRhaW5lckRhdGEsXG4gICAgICAgICAgICAgICAgY29udGFpbmVyRWxlbWVudDogJHRleHRFbGVtZW50LFxuICAgICAgICAgICAgICAgIGRlZmF1bHRSZWFjdGlvbnM6IGRlZmF1bHRSZWFjdGlvbnMsXG4gICAgICAgICAgICAgICAgcGFnZURhdGE6IHBhZ2VEYXRhLFxuICAgICAgICAgICAgICAgIGdyb3VwU2V0dGluZ3M6IGdyb3VwU2V0dGluZ3MsXG4gICAgICAgICAgICAgICAgZXhjbHVkZU5vZGU6ICRpbmRpY2F0b3JFbGVtZW50LmdldCgwKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjcmVhdGVkV2lkZ2V0cy5wdXNoKHRleHRSZWFjdGlvbnMpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG4vLyBXZSB1c2UgdGhpcyB0byBoYW5kbGUgdGhlIHNpbXBsZSBjYXNlIG9mIHRleHQgY29udGVudCB0aGF0IGVuZHMgd2l0aCBzb21lIG1lZGlhIGFzIGluXG4vLyA8cD5NeSB0ZXh0LiA8aW1nIHNyYz1cIndoYXRldmVyXCI+PC9wPi5cbi8vIFRoaXMgaXMgYSBzaW1wbGlzdGljIGFsZ29yaXRobSwgbm90IGEgZ2VuZXJhbCBzb2x1dGlvbjpcbi8vIFdlIHdhbGsgdGhlIERPTSBpbnNpZGUgdGhlIGdpdmVuIG5vZGUgYW5kIGtlZXAgdHJhY2sgb2YgdGhlIGxhc3QgXCJjb250ZW50XCIgbm9kZSB0aGF0IHdlIGVuY291bnRlciwgd2hpY2ggY291bGQgYmUgZWl0aGVyXG4vLyB0ZXh0IG9yIHNvbWUgbWVkaWEuICBJZiB0aGUgbGFzdCBjb250ZW50IG5vZGUgaXMgbm90IHRleHQsIHdlIHdhbnQgdG8gaW5zZXJ0IHRoZSB0ZXh0IGluZGljYXRvciBiZWZvcmUgdGhlIG1lZGlhLlxuZnVuY3Rpb24gbGFzdENvbnRlbnROb2RlKG5vZGUpIHtcbiAgICB2YXIgbGFzdE5vZGU7XG4gICAgdmFyIGNoaWxkTm9kZXMgPSBub2RlLmNoaWxkTm9kZXM7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGlsZE5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBjaGlsZCA9IGNoaWxkTm9kZXNbaV07XG4gICAgICAgIGlmIChjaGlsZC5ub2RlVHlwZSA9PT0gMykge1xuICAgICAgICAgICAgbGFzdE5vZGUgPSBjaGlsZDtcbiAgICAgICAgfSBlbHNlIGlmIChjaGlsZC5ub2RlVHlwZSA9PT0gMSkge1xuICAgICAgICAgICAgdmFyIHRhZ05hbWUgPSBjaGlsZC50YWdOYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICBzd2l0Y2ggKHRhZ05hbWUpIHtcbiAgICAgICAgICAgICAgICBjYXNlICdpbWcnOlxuICAgICAgICAgICAgICAgIGNhc2UgJ2lmcmFtZSc6XG4gICAgICAgICAgICAgICAgY2FzZSAndmlkZW8nOlxuICAgICAgICAgICAgICAgIGNhc2UgJ2lmcmFtZSc6XG4gICAgICAgICAgICAgICAgICAgIGxhc3ROb2RlID0gY2hpbGQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgbGFzdE5vZGUgPSBsYXN0Q29udGVudE5vZGUoY2hpbGQpIHx8IGxhc3ROb2RlO1xuICAgIH1cbiAgICByZXR1cm4gbGFzdE5vZGU7XG59XG5cbmZ1bmN0aW9uIHNob3VsZEhhc2hUZXh0KCR0ZXh0RWxlbWVudCwgZ3JvdXBTZXR0aW5ncykge1xuICAgIGlmICgoaXNDdGEoJHRleHRFbGVtZW50LCBncm91cFNldHRpbmdzKSkpIHtcbiAgICAgICAgLy8gRG9uJ3QgaGFzaCB0aGUgdGV4dCBpZiBpdCBpcyB0aGUgdGFyZ2V0IG9mIGEgQ1RBLlxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIC8vIERvbid0IGNyZWF0ZSBhbiBpbmRpY2F0b3IgZm9yIHRleHQgZWxlbWVudHMgdGhhdCBjb250YWluIG90aGVyIHRleHQgbm9kZXMuXG4gICAgdmFyICRuZXN0ZWRFbGVtZW50cyA9IGZpbmQoJHRleHRFbGVtZW50LCBncm91cFNldHRpbmdzLmNvbnRlbnRTZWxlY3RvcigpKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8ICRuZXN0ZWRFbGVtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoKGNvbXB1dGVFbGVtZW50VHlwZSgkKCRuZXN0ZWRFbGVtZW50c1tpXSkpID09PSBUWVBFX1RFWFQpKSB7XG4gICAgICAgICAgICAvLyBEb24ndCBoYXNoIGEgdGV4dCBlbGVtZW50IGlmIGl0IGNvbnRhaW5zIGFueSBvdGhlciBtYXRjaGVkIHRleHQgZWxlbWVudHNcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gaXNDdGEoJGVsZW1lbnQsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgY29tcG9zaXRlU2VsZWN0b3IgPSBncm91cFNldHRpbmdzLmdlbmVyYXRlZEN0YVNlbGVjdG9yKCkgKyAnLFthbnQtaXRlbV0nO1xuICAgIHJldHVybiAkZWxlbWVudC5pcyhjb21wb3NpdGVTZWxlY3Rvcik7XG59XG5cbi8vIFRoZSBcImltYWdlXCIgYW5kIFwibWVkaWFcIiBwYXRocyBjb252ZXJnZSBoZXJlLCBiZWNhdXNlIHdlIHVzZSB0aGUgc2FtZSBpbmRpY2F0b3IgbW9kdWxlIGZvciB0aGVtIGJvdGguXG5mdW5jdGlvbiBzY2FuTWVkaWEoJG1lZGlhRWxlbWVudCwgdHlwZSwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgaW5kaWNhdG9yO1xuICAgIHZhciBjb250ZW50RGF0YSA9IGNvbXB1dGVDb250ZW50RGF0YSgkbWVkaWFFbGVtZW50LCBncm91cFNldHRpbmdzKTtcbiAgICBpZiAoY29udGVudERhdGEgJiYgY29udGVudERhdGEuZGltZW5zaW9ucykge1xuICAgICAgICBpZiAoY29udGVudERhdGEuZGltZW5zaW9ucy5oZWlnaHQgPj0gMTAwICYmIGNvbnRlbnREYXRhLmRpbWVuc2lvbnMud2lkdGggPj0gMTAwKSB7IC8vIERvbid0IGNyZWF0ZSBpbmRpY2F0b3Igb24gZWxlbWVudHMgdGhhdCBhcmUgdG9vIHNtYWxsXG4gICAgICAgICAgICB2YXIgaGFzaCA9IGNvbXB1dGVIYXNoKCRtZWRpYUVsZW1lbnQsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgIGlmIChoYXNoKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNvbnRhaW5lckRhdGEgPSBQYWdlRGF0YS5nZXRDb250YWluZXJEYXRhKHBhZ2VEYXRhLCBoYXNoKTtcbiAgICAgICAgICAgICAgICBjb250YWluZXJEYXRhLnR5cGUgPSB0eXBlID09PSBUWVBFX0lNQUdFID8gJ2ltYWdlJyA6ICdtZWRpYSc7XG4gICAgICAgICAgICAgICAgdmFyIGRlZmF1bHRSZWFjdGlvbnMgPSBncm91cFNldHRpbmdzLmRlZmF1bHRSZWFjdGlvbnMoJG1lZGlhRWxlbWVudCk7XG4gICAgICAgICAgICAgICAgaW5kaWNhdG9yID0gTWVkaWFJbmRpY2F0b3JXaWRnZXQuY3JlYXRlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQ6IFdpZGdldEJ1Y2tldC5nZXQoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lckRhdGE6IGNvbnRhaW5lckRhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50RGF0YTogY29udGVudERhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250YWluZXJFbGVtZW50OiAkbWVkaWFFbGVtZW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdFJlYWN0aW9uczogZGVmYXVsdFJlYWN0aW9ucyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhZ2VEYXRhOiBwYWdlRGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGdyb3VwU2V0dGluZ3M6IGdyb3VwU2V0dGluZ3NcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgY3JlYXRlZFdpZGdldHMucHVzaChpbmRpY2F0b3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIC8vIExpc3RlbiBmb3IgY2hhbmdlcyB0byB0aGUgaW1hZ2UgYXR0cmlidXRlcyB3aGljaCBjb3VsZCBpbmRpY2F0ZSBjb250ZW50IGNoYW5nZXMuXG4gICAgTXV0YXRpb25PYnNlcnZlci5hZGRPbmVUaW1lQXR0cmlidXRlTGlzdGVuZXIoJG1lZGlhRWxlbWVudC5nZXQoMCksIFsnc3JjJywnYW50LWl0ZW0tY29udGVudCcsJ2RhdGEnXSwgZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmIChpbmRpY2F0b3IpIHtcbiAgICAgICAgICAgIC8vIFRPRE86IHVwZGF0ZSBIYXNoZWRFbGVtZW50cyB0byByZW1vdmUgdGhlIHByZXZpb3VzIGhhc2gtPmVsZW1lbnQgbWFwcGluZy4gQ29uc2lkZXIgdGhlcmUgY291bGQgYmUgbXVsdGlwbGVcbiAgICAgICAgICAgIC8vICAgICAgIGluc3RhbmNlcyBvZiB0aGUgc2FtZSBlbGVtZW50IG9uIGEgcGFnZS4uLiBzbyB3ZSBtaWdodCBuZWVkIHRvIHVzZSBhIGNvdW50ZXIuXG4gICAgICAgICAgICBpbmRpY2F0b3IudGVhcmRvd24oKTtcbiAgICAgICAgfVxuICAgICAgICBzY2FuTWVkaWEoJG1lZGlhRWxlbWVudCwgdHlwZSwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBmaW5kKCRlbGVtZW50LCBzZWxlY3RvciwgYWRkQmFjaywgaWdub3JlTm9BbnQpIHtcbiAgICB2YXIgcmVzdWx0ID0gJGVsZW1lbnQuZmluZChzZWxlY3Rvcik7XG4gICAgaWYgKGFkZEJhY2sgJiYgc2VsZWN0b3IpIHsgLy8gd2l0aCBhbiB1bmRlZmluZWQgc2VsZWN0b3IsIGFkZEJhY2sgd2lsbCBtYXRjaCBhbmQgYWx3YXlzIHJldHVybiB0aGUgaW5wdXQgZWxlbWVudCAodW5saWtlIGZpbmQoKSB3aGljaCByZXR1cm5zIGFuIGVtcHR5IG1hdGNoKVxuICAgICAgICByZXN1bHQgPSByZXN1bHQuYWRkQmFjayhzZWxlY3Rvcik7XG4gICAgfVxuICAgIGlmIChpZ25vcmVOb0FudCkgeyAvLyBTb21lIHBpZWNlcyBvZiBjb250ZW50IChlLmcuIHRoZSBzdW1tYXJ5IHdpZGdldCkgY2FuIGFjdHVhbGx5IGdvIGluc2lkZSBzZWN0aW9ucyB0YWdnZWQgbm8tYW50XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQuZmlsdGVyKGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gJCh0aGlzKS5jbG9zZXN0KCcubm8tYW50JykubGVuZ3RoID09IDA7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGluc2VydENvbnRlbnQoJHBhcmVudCwgY29udGVudCwgbWV0aG9kKSB7XG4gICAgc3dpdGNoIChtZXRob2QpIHtcbiAgICAgICAgY2FzZSAnYXBwZW5kJzpcbiAgICAgICAgICAgICRwYXJlbnQuYXBwZW5kKGNvbnRlbnQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3ByZXBlbmQnOlxuICAgICAgICAgICAgJHBhcmVudC5wcmVwZW5kKGNvbnRlbnQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2JlZm9yZSc6XG4gICAgICAgICAgICAkcGFyZW50LmJlZm9yZShjb250ZW50KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdhZnRlcic6XG4gICAgICAgICAgICAkcGFyZW50LmFmdGVyKGNvbnRlbnQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBjb21wdXRlSGFzaCgkZWxlbWVudCwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgaGFzaDtcbiAgICBzd2l0Y2ggKGNvbXB1dGVFbGVtZW50VHlwZSgkZWxlbWVudCkpIHtcbiAgICAgICAgY2FzZSBUWVBFX0lNQUdFOlxuICAgICAgICAgICAgdmFyIGltYWdlVXJsID0gVVJMcy5jb21wdXRlSW1hZ2VVcmwoJGVsZW1lbnQsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgaGFzaCA9IEhhc2guaGFzaEltYWdlKGltYWdlVXJsLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFRZUEVfTUVESUE6XG4gICAgICAgICAgICB2YXIgbWVkaWFVcmwgPSBVUkxzLmNvbXB1dGVNZWRpYVVybCgkZWxlbWVudCwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICBoYXNoID0gSGFzaC5oYXNoTWVkaWEobWVkaWFVcmwsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgVFlQRV9URVhUOlxuICAgICAgICAgICAgaGFzaCA9IEhhc2guaGFzaFRleHQoJGVsZW1lbnQpO1xuICAgICAgICAgICAgdmFyIGluY3JlbWVudCA9IDE7XG4gICAgICAgICAgICB3aGlsZSAoaGFzaCAmJiBIYXNoZWRFbGVtZW50cy5nZXRFbGVtZW50KGhhc2gsIHBhZ2VEYXRhLnBhZ2VIYXNoKSkge1xuICAgICAgICAgICAgICAgIGhhc2ggPSBIYXNoLmhhc2hUZXh0KCRlbGVtZW50LCBpbmNyZW1lbnQrKyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICB9XG4gICAgaWYgKGhhc2gpIHtcbiAgICAgICAgSGFzaGVkRWxlbWVudHMuc2V0RWxlbWVudChoYXNoLCBwYWdlRGF0YS5wYWdlSGFzaCwgJGVsZW1lbnQpOyAvLyBSZWNvcmQgdGhlIHJlbGF0aW9uc2hpcCBiZXR3ZWVuIHRoZSBoYXNoIGFuZCBkb20gZWxlbWVudC5cbiAgICAgICAgaWYgKEFwcE1vZGUuZGVidWcpIHtcbiAgICAgICAgICAgICRlbGVtZW50LmF0dHIoQVRUUl9IQVNILCBoYXNoKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gaGFzaDtcbn1cblxuZnVuY3Rpb24gY29tcHV0ZUNvbnRlbnREYXRhKCRlbGVtZW50LCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGNvbnRlbnREYXRhO1xuICAgIHN3aXRjaCAoY29tcHV0ZUVsZW1lbnRUeXBlKCRlbGVtZW50KSkge1xuICAgICAgICBjYXNlIFRZUEVfSU1BR0U6XG4gICAgICAgICAgICB2YXIgaW1hZ2VVcmwgPSBVUkxzLmNvbXB1dGVJbWFnZVVybCgkZWxlbWVudCwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICB2YXIgaW1hZ2VEaW1lbnNpb25zID0ge1xuICAgICAgICAgICAgICAgIGhlaWdodDogcGFyc2VJbnQoJGVsZW1lbnQuYXR0cignaGVpZ2h0JykpIHx8ICRlbGVtZW50LmhlaWdodCgpIHx8IDAsXG4gICAgICAgICAgICAgICAgd2lkdGg6IHBhcnNlSW50KCRlbGVtZW50LmF0dHIoJ3dpZHRoJykpIHx8ICRlbGVtZW50LndpZHRoKCkgfHwgMFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGNvbnRlbnREYXRhID0ge1xuICAgICAgICAgICAgICAgIHR5cGU6ICdpbWcnLFxuICAgICAgICAgICAgICAgIGJvZHk6IGltYWdlVXJsLFxuICAgICAgICAgICAgICAgIGRpbWVuc2lvbnM6IGltYWdlRGltZW5zaW9uc1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFRZUEVfTUVESUE6XG4gICAgICAgICAgICB2YXIgbWVkaWFVcmwgPSBVUkxzLmNvbXB1dGVNZWRpYVVybCgkZWxlbWVudCwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICB2YXIgbWVkaWFEaW1lbnNpb25zID0ge1xuICAgICAgICAgICAgICAgIGhlaWdodDogcGFyc2VJbnQoJGVsZW1lbnQuYXR0cignaGVpZ2h0JykpIHx8ICRlbGVtZW50LmhlaWdodCgpIHx8IDAsXG4gICAgICAgICAgICAgICAgd2lkdGg6IHBhcnNlSW50KCRlbGVtZW50LmF0dHIoJ3dpZHRoJykpIHx8ICRlbGVtZW50LndpZHRoKCkgfHwgMFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGNvbnRlbnREYXRhID0ge1xuICAgICAgICAgICAgICAgIHR5cGU6ICdtZWRpYScsXG4gICAgICAgICAgICAgICAgYm9keTogbWVkaWFVcmwsXG4gICAgICAgICAgICAgICAgZGltZW5zaW9uczogbWVkaWFEaW1lbnNpb25zXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgVFlQRV9URVhUOlxuICAgICAgICAgICAgY29udGVudERhdGEgPSB7IHR5cGU6ICd0ZXh0JyB9O1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIHJldHVybiBjb250ZW50RGF0YTtcbn1cblxuZnVuY3Rpb24gY29tcHV0ZUVsZW1lbnRUeXBlKCRlbGVtZW50KSB7XG4gICAgdmFyIGl0ZW1UeXBlID0gJGVsZW1lbnQuYXR0cignYW50LWl0ZW0tdHlwZScpO1xuICAgIGlmIChpdGVtVHlwZSAmJiBpdGVtVHlwZS50cmltKCkubGVuZ3RoID4gMCkge1xuICAgICAgICByZXR1cm4gaXRlbVR5cGUudHJpbSgpO1xuICAgIH1cbiAgICB2YXIgdGFnTmFtZSA9ICRlbGVtZW50LnByb3AoJ3RhZ05hbWUnKS50b0xvd2VyQ2FzZSgpO1xuICAgIHN3aXRjaCAodGFnTmFtZSkge1xuICAgICAgICBjYXNlICdpbWcnOlxuICAgICAgICAgICAgcmV0dXJuIFRZUEVfSU1BR0U7XG4gICAgICAgIGNhc2UgJ3ZpZGVvJzpcbiAgICAgICAgY2FzZSAnaWZyYW1lJzpcbiAgICAgICAgY2FzZSAnZW1iZWQnOlxuICAgICAgICAgICAgcmV0dXJuIFRZUEVfTUVESUE7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICByZXR1cm4gVFlQRV9URVhUO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gc2V0dXBNdXRhdGlvbk9ic2VydmVyKGdyb3VwU2V0dGluZ3MsIHJlaW5pdGlhbGl6ZUNhbGxiYWNrKSB7XG4gICAgdmFyIG9yaWdpbmFsUGF0aG5hbWUgPSB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWU7XG4gICAgdmFyIG9yaWdpbmFsU2VhcmNoID0gd2luZG93LmxvY2F0aW9uLnNlYXJjaDtcbiAgICBNdXRhdGlvbk9ic2VydmVyLmFkZEFkZGl0aW9uTGlzdGVuZXIoZWxlbWVudHNBZGRlZCk7XG5cbiAgICBmdW5jdGlvbiBlbGVtZW50c0FkZGVkKCRlbGVtZW50cykge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8ICRlbGVtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyICRlbGVtZW50ID0gJGVsZW1lbnRzW2ldO1xuICAgICAgICAgICAgJGVsZW1lbnQuZmluZChncm91cFNldHRpbmdzLmV4Y2x1c2lvblNlbGVjdG9yKCkpLmFkZEJhY2soZ3JvdXBTZXR0aW5ncy5leGNsdXNpb25TZWxlY3RvcigpKS5hZGRDbGFzcygnbm8tYW50Jyk7IC8vIEFkZCB0aGUgbm8tYW50IGNsYXNzIHRvIGV2ZXJ5dGhpbmcgdGhhdCBpcyBmbGFnZ2VkIGZvciBleGNsdXNpb25cbiAgICAgICAgICAgIGlmICgkZWxlbWVudC5jbG9zZXN0KCcubm8tYW50JykubGVuZ3RoID09PSAwKSB7IC8vIElnbm9yZSBhbnl0aGluZyB0YWdnZWQgbm8tYW50XG4gICAgICAgICAgICAgICAgLy8gRmlyc3QsIHNlZSBpZiBhbnkgZW50aXJlIHBhZ2VzIHdlcmUgYWRkZWRcbiAgICAgICAgICAgICAgICB2YXIgJHBhZ2VzID0gZmluZCgkZWxlbWVudCwgZ3JvdXBTZXR0aW5ncy5wYWdlU2VsZWN0b3IoKSwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgaWYgKCRwYWdlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIFBhZ2VEYXRhTG9hZGVyLnBhZ2VzQWRkZWQoJHBhZ2VzLCBncm91cFNldHRpbmdzKTsgLy8gVE9ETzogY29uc2lkZXIgaWYgdGhlcmUncyBhIGJldHRlciB3YXkgdG8gYXJjaGl0ZWN0IHRoaXNcbiAgICAgICAgICAgICAgICAgICAgJHBhZ2VzLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2NhblBhZ2UoJCh0aGlzKSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIElmIG5vdCBhbiBlbnRpcmUgcGFnZS9wYWdlcywgc2VlIGlmIGNvbnRlbnQgd2FzIGFkZGVkIHRvIGFuIGV4aXN0aW5nIHBhZ2VcbiAgICAgICAgICAgICAgICAgICAgdmFyICRwYWdlID0gJGVsZW1lbnQuY2xvc2VzdChncm91cFNldHRpbmdzLnBhZ2VTZWxlY3RvcigpKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCRwYWdlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHBhZ2UgPSAkKCdib2R5Jyk7IC8vIFRPRE86IGlzIHRoaXMgcmlnaHQ/IGtlZXAgaW4gc3luYyB3aXRoIHNjYW5BbGxQYWdlc1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHZhciAkcGFnZUluZGljYXRvciA9IGZpbmQoJHBhZ2UsIGdyb3VwU2V0dGluZ3MucGFnZUxpbmtTZWxlY3RvcigpKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCRwYWdlSW5kaWNhdG9yLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNob3VsZFJlaW5pdGlhbGl6ZUZvckxvY2F0aW9uQ2hhbmdlKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWluaXRpYWxpemVDYWxsYmFjayhncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdmFyIHVybCA9IFBhZ2VVdGlscy5jb21wdXRlUGFnZVVybCgkcGFnZSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwYWdlRGF0YSA9IFBhZ2VEYXRhLmdldFBhZ2VEYXRhQnlVUkwodXJsKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gRmlyc3QsIGNoZWNrIGZvciBhbnkgbmV3IHN1bW1hcnkgd2lkZ2V0cy4uLlxuICAgICAgICAgICAgICAgICAgICBzY2FuRm9yU3VtbWFyaWVzKCRlbGVtZW50LCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICAgICAgICAgIC8vIE5leHQsIHNlZSBpZiBhbnkgZW50aXJlIGFjdGl2ZSBzZWN0aW9ucyB3ZXJlIGFkZGVkXG4gICAgICAgICAgICAgICAgICAgIHZhciAkYWN0aXZlU2VjdGlvbnMgPSBmaW5kKCRlbGVtZW50LCBncm91cFNldHRpbmdzLmFjdGl2ZVNlY3Rpb25zKCkpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoJGFjdGl2ZVNlY3Rpb25zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRhY3RpdmVTZWN0aW9ucy5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjcmVhdGVBdXRvQ2FsbHNUb0FjdGlvbigkKHRoaXMpLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRhY3RpdmVTZWN0aW9ucy5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgJHNlY3Rpb24gPSAkKHRoaXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjYW5BY3RpdmVFbGVtZW50KCRzZWN0aW9uLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZpbmFsbHksIHNjYW4gaW5zaWRlIHRoZSBlbGVtZW50IGZvciBjb250ZW50XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgJGFjdGl2ZVNlY3Rpb24gPSAkZWxlbWVudC5jbG9zZXN0KGdyb3VwU2V0dGluZ3MuYWN0aXZlU2VjdGlvbnMoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoJGFjdGl2ZVNlY3Rpb24ubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNyZWF0ZUF1dG9DYWxsc1RvQWN0aW9uKCRlbGVtZW50LCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NhbkFjdGl2ZUVsZW1lbnQoJGVsZW1lbnQsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGhlIGVsZW1lbnQgaXMgYWRkZWQgb3V0c2lkZSBhbiBhY3RpdmUgc2VjdGlvbiwganVzdCBjaGVjayBpdCBmb3IgQ1RBc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjYW5Gb3JDYWxsc1RvQWN0aW9uKCRlbGVtZW50LCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzaG91bGRSZWluaXRpYWxpemVGb3JMb2NhdGlvbkNoYW5nZSgpIHtcbiAgICAgICAgLy8gUmVpbml0aWFsaXplIHdoZW4gdGhlIGxvY2F0aW9uIGNoYW5nZXMgaW4gYSB3YXkgdGhhdCB3ZSBiZWxpZXZlIGlzIG1lYW5pbmdmdWwuXG4gICAgICAgIC8vIFRoZSBoZXVyaXN0aWMgd2UgdXNlIGlzIHRoYXQgZWl0aGVyOlxuICAgICAgICAvLyAxLiBUaGUgcXVlcnkgc3RyaW5nIGNoYW5nZXMgYW5kIHdlJ3JlIG9uIGEgc2l0ZSB0aGF0IHNheXMgdGhlIHF1ZXJ5IHN0cmluZyBtYXR0ZXJzIG9yXG4gICAgICAgIC8vIDIuIFRoZSBwYXRoIGNoYW5nZXMuLi5cbiAgICAgICAgLy8gICAgMmEuIEJ1dCBub3QgaWYgdGhlIGNoYW5nZSBpcyBhbiBleHRlbnNpb24gb2YgdGhlIHBhdGguXG4gICAgICAgIC8vICAgICAgICAyYWEuIFVubGVzcyB3ZSdyZSBnb2luZyBmcm9tIGFuIGVtcHR5IHBhdGggKCcvJykgdG8gc29tZSBvdGhlciBwYXRoLlxuICAgICAgICB2YXIgbmV3TG9jYXRpb25QYXRobmFtZSA9IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZTtcbiAgICAgICAgcmV0dXJuIGdyb3VwU2V0dGluZ3MudXJsLmluY2x1ZGVRdWVyeVN0cmluZygpICYmIG9yaWdpbmFsU2VhcmNoICE9IHdpbmRvdy5sb2NhdGlvbi5zZWFyY2ggfHxcbiAgICAgICAgICAgICAgICBuZXdMb2NhdGlvblBhdGhuYW1lICE9IG9yaWdpbmFsUGF0aG5hbWUgJiYgKG9yaWdpbmFsUGF0aG5hbWUgPT09ICcvJyB8fCBuZXdMb2NhdGlvblBhdGhuYW1lLmluZGV4T2Yob3JpZ2luYWxQYXRobmFtZSkgPT09IC0xKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHRlYXJkb3duKCkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY3JlYXRlZFdpZGdldHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY3JlYXRlZFdpZGdldHNbaV0udGVhcmRvd24oKTtcbiAgICB9XG4gICAgY3JlYXRlZFdpZGdldHMgPSBbXTtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHNjYW46IHNjYW5BbGxQYWdlcyxcbiAgICB0ZWFyZG93bjogdGVhcmRvd25cbn07IiwidmFyIFJhY3RpdmU7IHJlcXVpcmUoJy4vdXRpbHMvcmFjdGl2ZS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihsb2FkZWRSYWN0aXZlKSB7IFJhY3RpdmUgPSBsb2FkZWRSYWN0aXZlO30pO1xudmFyIFNWR3MgPSByZXF1aXJlKCcuL3N2Z3MnKTtcblxudmFyIHBhZ2VTZWxlY3RvciA9ICcuYW50ZW5uYS1wZW5kaW5nLXBhZ2UnO1xuXG5mdW5jdGlvbiBjcmVhdGVQYWdlKHJlYWN0aW9uVGV4dCwgZWxlbWVudCkge1xuICAgIHZhciByYWN0aXZlID0gUmFjdGl2ZSh7XG4gICAgICAgIGVsOiBlbGVtZW50LFxuICAgICAgICBhcHBlbmQ6IHRydWUsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIHRleHQ6IHJlYWN0aW9uVGV4dFxuICAgICAgICB9LFxuICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL3BlbmRpbmctcmVhY3Rpb24tcGFnZS5oYnMuaHRtbCcpLFxuICAgICAgICBwYXJ0aWFsczoge1xuICAgICAgICAgICAgbGVmdDogU1ZHcy5sZWZ0XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4ge1xuICAgICAgICBzZWxlY3RvcjogcGFnZVNlbGVjdG9yLFxuICAgICAgICB0ZWFyZG93bjogZnVuY3Rpb24oKSB7IHJhY3RpdmUudGVhcmRvd24oKTsgfVxuICAgIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZVBhZ2U6IGNyZWF0ZVBhZ2Vcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgUmFjdGl2ZTsgcmVxdWlyZSgnLi91dGlscy9yYWN0aXZlLXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGxvYWRlZFJhY3RpdmUpIHsgUmFjdGl2ZSA9IGxvYWRlZFJhY3RpdmU7fSk7XG52YXIgV2lkZ2V0QnVja2V0ID0gcmVxdWlyZSgnLi91dGlscy93aWRnZXQtYnVja2V0Jyk7XG52YXIgVHJhbnNpdGlvblV0aWwgPSByZXF1aXJlKCcuL3V0aWxzL3RyYW5zaXRpb24tdXRpbCcpO1xuXG52YXIgU1ZHcyA9IHJlcXVpcmUoJy4vc3ZncycpO1xuXG52YXIgcmFjdGl2ZTtcbnZhciBjbGlja0hhbmRsZXI7XG5cblxuZnVuY3Rpb24gZ2V0Um9vdEVsZW1lbnQoKSB7XG4gICAgLy8gVE9ETyByZXZpc2l0IHRoaXMsIGl0J3Mga2luZCBvZiBnb29meSBhbmQgaXQgbWlnaHQgaGF2ZSBhIHRpbWluZyBwcm9ibGVtXG4gICAgaWYgKCFyYWN0aXZlKSB7XG4gICAgICAgIHZhciBidWNrZXQgPSBXaWRnZXRCdWNrZXQuZ2V0KCk7XG4gICAgICAgIHJhY3RpdmUgPSBSYWN0aXZlKHtcbiAgICAgICAgICAgIGVsOiBidWNrZXQsXG4gICAgICAgICAgICBhcHBlbmQ6IHRydWUsXG4gICAgICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL3BvcHVwLXdpZGdldC5oYnMuaHRtbCcpLFxuICAgICAgICAgICAgcGFydGlhbHM6IHtcbiAgICAgICAgICAgICAgICBsb2dvOiBTVkdzLmxvZ29cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHZhciAkZWxlbWVudCA9ICQocmFjdGl2ZS5maW5kKCcuYW50ZW5uYS1wb3B1cCcpKTtcbiAgICAgICAgJGVsZW1lbnQub24oJ21vdXNlZG93bicsIGZhbHNlKTsgLy8gUHJldmVudCBtb3VzZWRvd24gZnJvbSBwcm9wYWdhdGluZywgc28gdGhlIGJyb3dzZXIgZG9lc24ndCBjbGVhciB0aGUgdGV4dCBzZWxlY3Rpb24uXG4gICAgICAgICRlbGVtZW50Lm9uKCdjbGljay5hbnRlbm5hLXBvcHVwJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIGhpZGVQb3B1cCgkZWxlbWVudCk7XG4gICAgICAgICAgICBpZiAoY2xpY2tIYW5kbGVyKSB7XG4gICAgICAgICAgICAgICAgY2xpY2tIYW5kbGVyKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBzZXR1cE1vdXNlT3ZlcigkZWxlbWVudCk7XG4gICAgICAgIHJldHVybiAkZWxlbWVudDtcbiAgICB9XG4gICAgcmV0dXJuICQocmFjdGl2ZS5maW5kKCcuYW50ZW5uYS1wb3B1cCcpKTtcbn1cblxuZnVuY3Rpb24gc2V0dXBNb3VzZU92ZXIoJGVsZW1lbnQpIHtcbiAgICB2YXIgY2xvc2VUaW1lcjtcblxuICAgIC8vIFRoZSA6aG92ZXIgcHNldWRvIGNsYXNzIGNhbiBiZWNvbWUgc3R1Y2sgb24gdGhlIGFudGVubmEtcG9wdXAgZWxlbWVudCB3aGVuIHdlIGJyaW5nIHVwIHRoZSByZWFjdGlvbiB3aW5kb3dcbiAgICAvLyBpbiByZXNwb25zZSB0byB0aGUgY2xpY2suIFNvIGhlcmUgd2UgYWRkL3JlbW92ZSBvdXIgb3duIGhvdmVyIGNsYXNzIGluc3RlYWQuXG4gICAgLy8gU2VlOiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzEwMzIxMjc1L2hvdmVyLXN0YXRlLWlzLXN0aWNreS1hZnRlci1lbGVtZW50LWlzLW1vdmVkLW91dC1mcm9tLXVuZGVyLXRoZS1tb3VzZS1pbi1hbGwtYnJcbiAgICB2YXIgaG92ZXJDbGFzcyA9ICdhbnRlbm5hLWhvdmVyJztcbiAgICAkZWxlbWVudC5vbignbW91c2VlbnRlcicsIGZ1bmN0aW9uKCkge1xuICAgICAgICAkZWxlbWVudC5hZGRDbGFzcyhob3ZlckNsYXNzKTtcbiAgICAgICAga2VlcE9wZW4oKTtcbiAgICB9KTtcbiAgICAkZWxlbWVudC5vbignbW91c2VsZWF2ZScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAkZWxlbWVudC5yZW1vdmVDbGFzcyhob3ZlckNsYXNzKTtcbiAgICAgICAgZGVsYXllZENsb3NlKCk7XG4gICAgfSk7XG5cbiAgICBmdW5jdGlvbiBkZWxheWVkQ2xvc2UoKSB7XG4gICAgICAgIGNsb3NlVGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY2xvc2VUaW1lciA9IG51bGw7XG4gICAgICAgICAgICBoaWRlUG9wdXAoJGVsZW1lbnQpO1xuICAgICAgICB9LCA1MDApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGtlZXBPcGVuKCkge1xuICAgICAgICBpZiAoY2xvc2VUaW1lcikge1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KGNsb3NlVGltZXIpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBzaG93UG9wdXAoY29vcmRpbmF0ZXMsIGNhbGxiYWNrKSB7XG4gICAgdmFyICRlbGVtZW50ID0gZ2V0Um9vdEVsZW1lbnQoKTtcbiAgICBpZiAoISRlbGVtZW50Lmhhc0NsYXNzKCdhbnRlbm5hLXNob3cnKSkge1xuICAgICAgICBjbGlja0hhbmRsZXIgPSBjYWxsYmFjaztcbiAgICAgICAgJGVsZW1lbnRcbiAgICAgICAgICAgIC5zaG93KCkgLy8gc3RpbGwgaGFzIG9wYWNpdHkgMCBhdCB0aGlzIHBvaW50XG4gICAgICAgICAgICAuY3NzKHtcbiAgICAgICAgICAgICAgICB0b3A6IGNvb3JkaW5hdGVzLnRvcCAtICRlbGVtZW50Lm91dGVySGVpZ2h0KCkgLSA2LCAvLyBUT0RPIGZpbmQgYSBjbGVhbmVyIHdheSB0byBhY2NvdW50IGZvciB0aGUgcG9wdXAgJ3RhaWwnXG4gICAgICAgICAgICAgICAgbGVmdDogY29vcmRpbmF0ZXMubGVmdCAtIE1hdGguZmxvb3IoJGVsZW1lbnQub3V0ZXJXaWR0aCgpIC8gMilcbiAgICAgICAgICAgIH0pO1xuICAgICAgICBUcmFuc2l0aW9uVXRpbC50b2dnbGVDbGFzcygkZWxlbWVudCwgJ2FudGVubmEtc2hvdycsIHRydWUsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy8gVE9ETzogYWZ0ZXIgdGhlIGFwcGVhcmFuY2UgdHJhbnNpdGlvbiBpcyBjb21wbGV0ZSwgYWRkIGEgaGFuZGxlciBmb3IgbW91c2VlbnRlciB3aGljaCB0aGVuIHJlZ2lzdGVyc1xuICAgICAgICAgICAgLy8gICAgICAgYSBoYW5kbGVyIGZvciBtb3VzZWxlYXZlIHRoYXQgaGlkZXMgdGhlIHBvcHVwXG5cbiAgICAgICAgICAgIC8vIFRPRE86IGFsc28gdGFrZSBkb3duIHRoZSBwb3B1cCBpZiB0aGUgdXNlciBtb3VzZXMgb3ZlciBhbm90aGVyIHdpZGdldCAoc3VtbWFyeSBvciBpbmRpY2F0b3IpXG4gICAgICAgICAgICAkKGRvY3VtZW50KS5vbignY2xpY2suYW50ZW5uYS1wb3B1cCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBoaWRlUG9wdXAoJGVsZW1lbnQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gaGlkZVBvcHVwKCRlbGVtZW50KSB7XG4gICAgVHJhbnNpdGlvblV0aWwudG9nZ2xlQ2xhc3MoJGVsZW1lbnQsICdhbnRlbm5hLXNob3cnLCBmYWxzZSwgZnVuY3Rpb24oKSB7XG4gICAgICAgICRlbGVtZW50LmhpZGUoKTsgLy8gYWZ0ZXIgd2UncmUgYXQgb3BhY2l0eSAwLCBoaWRlIHRoZSBlbGVtZW50IHNvIGl0IGRvZXNuJ3QgcmVjZWl2ZSBhY2NpZGVudGFsIGNsaWNrc1xuICAgIH0pO1xuICAgICQoZG9jdW1lbnQpLm9mZignY2xpY2suYW50ZW5uYS1wb3B1cCcpO1xufVxuXG5mdW5jdGlvbiB0ZWFyZG93bigpIHtcbiAgICBpZiAocmFjdGl2ZSkge1xuICAgICAgICByYWN0aXZlLnRlYXJkb3duKCk7XG4gICAgICAgIHJhY3RpdmUgPSB1bmRlZmluZWQ7XG4gICAgICAgIGNsaWNrSGFuZGxlciA9IHVuZGVmaW5lZDtcbiAgICB9XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBzaG93OiBzaG93UG9wdXAsXG4gICAgdGVhcmRvd246IHRlYXJkb3duXG59OyIsInZhciAkOyByZXF1aXJlKCcuL3V0aWxzL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIFJhY3RpdmU7IHJlcXVpcmUoJy4vdXRpbHMvcmFjdGl2ZS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihsb2FkZWRSYWN0aXZlKSB7IFJhY3RpdmUgPSBsb2FkZWRSYWN0aXZlO30pO1xuXG52YXIgQWpheENsaWVudCA9IHJlcXVpcmUoJy4vdXRpbHMvYWpheC1jbGllbnQnKTtcbnZhciBSYW5nZSA9IHJlcXVpcmUoJy4vdXRpbHMvcmFuZ2UnKTtcbnZhciBSZWFjdGlvbnNXaWRnZXRMYXlvdXRVdGlscyA9IHJlcXVpcmUoJy4vdXRpbHMvcmVhY3Rpb25zLXdpZGdldC1sYXlvdXQtdXRpbHMnKTtcblxudmFyIEV2ZW50cyA9IHJlcXVpcmUoJy4vZXZlbnRzJyk7XG52YXIgU1ZHcyA9IHJlcXVpcmUoJy4vc3ZncycpO1xuXG52YXIgcGFnZVNlbGVjdG9yID0gJy5hbnRlbm5hLXJlYWN0aW9ucy1wYWdlJztcblxuZnVuY3Rpb24gY3JlYXRlUGFnZShvcHRpb25zKSB7XG4gICAgdmFyIGlzU3VtbWFyeSA9IG9wdGlvbnMuaXNTdW1tYXJ5O1xuICAgIHZhciByZWFjdGlvbnNEYXRhID0gb3B0aW9ucy5yZWFjdGlvbnNEYXRhO1xuICAgIHZhciBjb250YWluZXJEYXRhID0gb3B0aW9ucy5jb250YWluZXJEYXRhO1xuICAgIHZhciBwYWdlRGF0YSA9IG9wdGlvbnMucGFnZURhdGE7XG4gICAgdmFyIGdyb3VwU2V0dGluZ3MgPSBvcHRpb25zLmdyb3VwU2V0dGluZ3M7XG4gICAgdmFyIGNvbnRhaW5lckVsZW1lbnQgPSBvcHRpb25zLmNvbnRhaW5lckVsZW1lbnQ7IC8vIG9wdGlvbmFsXG4gICAgdmFyIHNob3dDb25maXJtYXRpb24gPSBvcHRpb25zLnNob3dDb25maXJtYXRpb247XG4gICAgdmFyIHNob3dEZWZhdWx0cyA9IG9wdGlvbnMuc2hvd0RlZmF1bHRzO1xuICAgIHZhciBzaG93Q29tbWVudHMgPSBvcHRpb25zLnNob3dDb21tZW50cztcbiAgICB2YXIgc2hvd0xvY2F0aW9ucyA9IG9wdGlvbnMuc2hvd0xvY2F0aW9ucztcbiAgICB2YXIgaGFuZGxlUmVhY3Rpb25FcnJvciA9IG9wdGlvbnMuaGFuZGxlUmVhY3Rpb25FcnJvcjtcbiAgICB2YXIgZWxlbWVudCA9IG9wdGlvbnMuZWxlbWVudDtcbiAgICB2YXIgcmVhY3Rpb25zTGF5b3V0RGF0YSA9IFJlYWN0aW9uc1dpZGdldExheW91dFV0aWxzLmNvbXB1dGVMYXlvdXREYXRhKHJlYWN0aW9uc0RhdGEpO1xuICAgIHZhciAkcmVhY3Rpb25zV2luZG93ID0gJChvcHRpb25zLnJlYWN0aW9uc1dpbmRvdyk7XG4gICAgdmFyIHJhY3RpdmUgPSBSYWN0aXZlKHtcbiAgICAgICAgZWw6IGVsZW1lbnQsXG4gICAgICAgIGFwcGVuZDogdHJ1ZSxcbiAgICAgICAgdGVtcGxhdGU6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9yZWFjdGlvbnMtcGFnZS5oYnMuaHRtbCcpLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICByZWFjdGlvbnM6IHJlYWN0aW9uc0RhdGEsXG4gICAgICAgICAgICByZWFjdGlvbnNMYXlvdXRDbGFzczogYXJyYXlBY2Nlc3NvcihyZWFjdGlvbnNMYXlvdXREYXRhLmxheW91dENsYXNzZXMpLFxuICAgICAgICAgICAgaXNTdW1tYXJ5OiBpc1N1bW1hcnksXG4gICAgICAgICAgICBoaWRlQ29tbWVudElucHV0OiBncm91cFNldHRpbmdzLnJlcXVpcmVzQXBwcm92YWwoKSAvLyBDdXJyZW50bHksIHNpdGVzIHRoYXQgcmVxdWlyZSBhcHByb3ZhbCBkb24ndCBzdXBwb3J0IGNvbW1lbnQgaW5wdXQuXG4gICAgICAgIH0sXG4gICAgICAgIGRlY29yYXRvcnM6IHtcbiAgICAgICAgICAgIHNpemV0b2ZpdDogc2l6ZVRvRml0KCRyZWFjdGlvbnNXaW5kb3cpXG4gICAgICAgIH0sXG4gICAgICAgIHBhcnRpYWxzOiB7XG4gICAgICAgICAgICBsb2NhdGlvbkljb246IFNWR3MubG9jYXRpb24sXG4gICAgICAgICAgICBjb21tZW50c0ljb246IFNWR3MuY29tbWVudHNcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgaWYgKGNvbnRhaW5lckVsZW1lbnQpIHtcbiAgICAgICAgcmFjdGl2ZS5vbignaGlnaGxpZ2h0JywgaGlnaGxpZ2h0Q29udGVudChjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgY29udGFpbmVyRWxlbWVudCkpO1xuICAgICAgICByYWN0aXZlLm9uKCdjbGVhcmhpZ2hsaWdodHMnLCBSYW5nZS5jbGVhckhpZ2hsaWdodHMpO1xuICAgIH1cbiAgICByYWN0aXZlLm9uKCdwbHVzb25lJywgcGx1c09uZSk7XG4gICAgcmFjdGl2ZS5vbignc2hvd2RlZmF1bHQnLCBzaG93RGVmYXVsdHMpO1xuICAgIHJhY3RpdmUub24oJ3Nob3djb21tZW50cycsIGZ1bmN0aW9uKHJhY3RpdmVFdmVudCkgeyBzaG93Q29tbWVudHMocmFjdGl2ZUV2ZW50LmNvbnRleHQsIHBhZ2VTZWxlY3Rvcik7IHJldHVybiBmYWxzZTsgfSk7IC8vIFRPRE8gY2xlYW4gdXBcbiAgICByYWN0aXZlLm9uKCdzaG93bG9jYXRpb25zJywgZnVuY3Rpb24ocmFjdGl2ZUV2ZW50KSB7IHNob3dMb2NhdGlvbnMocmFjdGl2ZUV2ZW50LmNvbnRleHQsIHBhZ2VTZWxlY3Rvcik7IHJldHVybiBmYWxzZTsgfSk7IC8vIFRPRE8gY2xlYW4gdXBcbiAgICByZXR1cm4ge1xuICAgICAgICBzZWxlY3RvcjogcGFnZVNlbGVjdG9yLFxuICAgICAgICB0ZWFyZG93bjogZnVuY3Rpb24oKSB7IHJhY3RpdmUudGVhcmRvd24oKTsgfVxuICAgIH07XG5cbiAgICBmdW5jdGlvbiBhcnJheUFjY2Vzc29yKGFycmF5KSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbihpbmRleCkge1xuICAgICAgICAgICAgcmV0dXJuIGFycmF5W2luZGV4XTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBsdXNPbmUocmFjdGl2ZUV2ZW50KSB7XG4gICAgICAgIHZhciByZWFjdGlvbkRhdGEgPSByYWN0aXZlRXZlbnQuY29udGV4dDtcbiAgICAgICAgdmFyIHJlYWN0aW9uUHJvdmlkZXIgPSB7IC8vIHRoaXMgcmVhY3Rpb24gcHJvdmlkZXIgaXMgYSBuby1icmFpbmVyIGJlY2F1c2Ugd2UgYWxyZWFkeSBoYXZlIGEgdmFsaWQgcmVhY3Rpb24gKG9uZSB3aXRoIGFuIElEKVxuICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKHJlYWN0aW9uRGF0YSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHNob3dDb25maXJtYXRpb24ocmVhY3Rpb25EYXRhLCByZWFjdGlvblByb3ZpZGVyKTtcbiAgICAgICAgQWpheENsaWVudC5wb3N0UGx1c09uZShyZWFjdGlvbkRhdGEsIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBzdWNjZXNzLCBlcnJvcik7XG5cbiAgICAgICAgZnVuY3Rpb24gc3VjY2VzcyhyZWFjdGlvbkRhdGEpIHtcbiAgICAgICAgICAgIEV2ZW50cy5wb3N0UmVhY3Rpb25DcmVhdGVkKHBhZ2VEYXRhLCBjb250YWluZXJEYXRhLCByZWFjdGlvbkRhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZXJyb3IobWVzc2FnZSkge1xuICAgICAgICAgICAgdmFyIHJldHJ5ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgQWpheENsaWVudC5wb3N0UGx1c09uZShyZWFjdGlvbkRhdGEsIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBzdWNjZXNzLCBlcnJvcik7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaGFuZGxlUmVhY3Rpb25FcnJvcihtZXNzYWdlLCByZXRyeSwgcGFnZVNlbGVjdG9yKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gc2l6ZVRvRml0KCRyZWFjdGlvbnNXaW5kb3cpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24obm9kZSkge1xuICAgICAgICB2YXIgJGVsZW1lbnQgPSAkKG5vZGUpLmNsb3Nlc3QoJy5hbnRlbm5hLXJlYWN0aW9uLWJveCcpO1xuICAgICAgICAvLyBXaGlsZSB3ZSdyZSBzaXppbmcgdGhlIHRleHQgdG8gZml4IGluIHRoZSByZWFjdGlvbiBib3gsIHdlIGFsc28gZml4IHVwIHRoZSB3aWR0aCBvZiB0aGUgcmVhY3Rpb24gY291bnQgYW5kXG4gICAgICAgIC8vIHBsdXMgb25lIGJ1dHRvbnMgc28gdGhhdCB0aGV5J3JlIHRoZSBzYW1lLiBUaGVzZSB0d28gdmlzdWFsbHkgc3dhcCB3aXRoIGVhY2ggb3RoZXIgb24gaG92ZXI7IG1ha2luZyB0aGVtXG4gICAgICAgIC8vIHRoZSBzYW1lIHdpZHRoIG1ha2VzIHN1cmUgd2UgZG9uJ3QgZ2V0IGp1bXBpbmVzcyBvbiBob3Zlci5cbiAgICAgICAgdmFyICRyZWFjdGlvbkNvdW50ID0gJGVsZW1lbnQuZmluZCgnLmFudGVubmEtcmVhY3Rpb24tY291bnQnKTtcbiAgICAgICAgdmFyICRwbHVzT25lID0gJGVsZW1lbnQuZmluZCgnLmFudGVubmEtcGx1c29uZScpO1xuICAgICAgICB2YXIgbWluV2lkdGggPSBNYXRoLm1heCgkcmVhY3Rpb25Db3VudC53aWR0aCgpLCAkcGx1c09uZS53aWR0aCgpKTtcbiAgICAgICAgbWluV2lkdGgrKzsgLy8gQWRkIGFuIGV4dHJhIHBpeGVsIGZvciByb3VuZGluZyBiZWNhdXNlIGVsZW1lbnRzIHRoYXQgbWVhc3VyZSwgZm9yIGV4YW1wbGUsIDE3LjE4NzVweCBjYW4gY29tZSBiYWNrIHdpdGggMTcgYXMgdGhlIHdpZHRoKClcbiAgICAgICAgJHJlYWN0aW9uQ291bnQuY3NzKHsnbWluLXdpZHRoJzogbWluV2lkdGh9KTtcbiAgICAgICAgJHBsdXNPbmUuY3NzKHsnbWluLXdpZHRoJzogbWluV2lkdGh9KTtcbiAgICAgICAgcmV0dXJuIFJlYWN0aW9uc1dpZGdldExheW91dFV0aWxzLnNpemVUb0ZpdCgkcmVhY3Rpb25zV2luZG93KShub2RlKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGhpZ2hsaWdodENvbnRlbnQoY29udGFpbmVyRGF0YSwgcGFnZURhdGEsICRjb250YWluZXJFbGVtZW50KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHZhciByZWFjdGlvbkRhdGEgPSBldmVudC5jb250ZXh0O1xuICAgICAgICBpZiAocmVhY3Rpb25EYXRhLmNvbnRlbnQpIHtcbiAgICAgICAgICAgIHZhciBsb2NhdGlvbiA9IHJlYWN0aW9uRGF0YS5jb250ZW50LmxvY2F0aW9uO1xuICAgICAgICAgICAgaWYgKGxvY2F0aW9uKSB7XG4gICAgICAgICAgICAgICAgUmFuZ2UuaGlnaGxpZ2h0KCRjb250YWluZXJFbGVtZW50LmdldCgwKSwgbG9jYXRpb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlOiBjcmVhdGVQYWdlXG59OyIsInZhciAkOyByZXF1aXJlKCcuL3V0aWxzL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIEFqYXhDbGllbnQgPSByZXF1aXJlKCcuL3V0aWxzL2FqYXgtY2xpZW50Jyk7XG52YXIgQnJvd3Nlck1ldHJpY3MgPSByZXF1aXJlKCcuL3V0aWxzL2Jyb3dzZXItbWV0cmljcycpO1xudmFyIE1lc3NhZ2VzID0gcmVxdWlyZSgnLi91dGlscy9tZXNzYWdlcycpO1xudmFyIE1vdmVhYmxlID0gcmVxdWlyZSgnLi91dGlscy9tb3ZlYWJsZScpO1xudmFyIFJhY3RpdmU7IHJlcXVpcmUoJy4vdXRpbHMvcmFjdGl2ZS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihsb2FkZWRSYWN0aXZlKSB7IFJhY3RpdmUgPSBsb2FkZWRSYWN0aXZlO30pO1xudmFyIFJhbmdlID0gcmVxdWlyZSgnLi91dGlscy9yYW5nZScpO1xudmFyIFRvdWNoU3VwcG9ydCA9IHJlcXVpcmUoJy4vdXRpbHMvdG91Y2gtc3VwcG9ydCcpO1xudmFyIFRyYW5zaXRpb25VdGlsID0gcmVxdWlyZSgnLi91dGlscy90cmFuc2l0aW9uLXV0aWwnKTtcbnZhciBVc2VyID0gcmVxdWlyZSgnLi91dGlscy91c2VyJyk7XG52YXIgV2lkZ2V0QnVja2V0ID0gcmVxdWlyZSgnLi91dGlscy93aWRnZXQtYnVja2V0Jyk7XG5cbnZhciBCbG9ja2VkUmVhY3Rpb25QYWdlID0gcmVxdWlyZSgnLi9ibG9ja2VkLXJlYWN0aW9uLXBhZ2UnKTtcbnZhciBDb21tZW50c1BhZ2UgPSByZXF1aXJlKCcuL2NvbW1lbnRzLXBhZ2UnKTtcbnZhciBDb25maXJtYXRpb25QYWdlID0gcmVxdWlyZSgnLi9jb25maXJtYXRpb24tcGFnZScpO1xudmFyIERlZmF1bHRzUGFnZSA9IHJlcXVpcmUoJy4vZGVmYXVsdHMtcGFnZScpO1xudmFyIEV2ZW50cyA9IHJlcXVpcmUoJy4vZXZlbnRzJyk7XG52YXIgR2VuZXJpY0Vycm9yUGFnZSA9IHJlcXVpcmUoJy4vZ2VuZXJpYy1lcnJvci1wYWdlJyk7XG52YXIgTG9jYXRpb25zUGFnZSA9IHJlcXVpcmUoJy4vbG9jYXRpb25zLXBhZ2UnKTtcbnZhciBMb2dpblBhZ2UgPSByZXF1aXJlKCcuL2xvZ2luLXBhZ2UnKTtcbnZhciBQYWdlRGF0YSA9IHJlcXVpcmUoJy4vcGFnZS1kYXRhJyk7XG52YXIgUGVuZGluZ1JlYWN0aW9uUGFnZSA9IHJlcXVpcmUoJy4vcGVuZGluZy1yZWFjdGlvbi1wYWdlJyk7XG52YXIgUmVhY3Rpb25zUGFnZSA9IHJlcXVpcmUoJy4vcmVhY3Rpb25zLXBhZ2UnKTtcbnZhciBTVkdzID0gcmVxdWlyZSgnLi9zdmdzJyk7XG5cbnZhciBQQUdFX1JFQUNUSU9OUyA9ICdyZWFjdGlvbnMnO1xudmFyIFBBR0VfREVGQVVMVFMgPSAnZGVmYXVsdHMnO1xudmFyIFBBR0VfQVVUTyA9ICdhdXRvJztcblxudmFyIFNFTEVDVE9SX1JFQUNUSU9OU19XSURHRVQgPSAnLmFudGVubmEtcmVhY3Rpb25zLXdpZGdldCc7XG5cbnZhciBvcGVuSW5zdGFuY2VzID0gW107XG5cbmZ1bmN0aW9uIG9wZW5SZWFjdGlvbnNXaWRnZXQob3B0aW9ucywgZWxlbWVudE9yQ29vcmRzKSB7XG4gICAgY2xvc2VBbGxXaW5kb3dzKCk7XG4gICAgdmFyIGRlZmF1bHRSZWFjdGlvbnMgPSBvcHRpb25zLmRlZmF1bHRSZWFjdGlvbnM7XG4gICAgdmFyIHJlYWN0aW9uc0RhdGEgPSBvcHRpb25zLnJlYWN0aW9uc0RhdGE7XG4gICAgdmFyIGNvbnRhaW5lckRhdGEgPSBvcHRpb25zLmNvbnRhaW5lckRhdGE7XG4gICAgdmFyIGNvbnRhaW5lckVsZW1lbnQgPSBvcHRpb25zLmNvbnRhaW5lckVsZW1lbnQ7IC8vIG9wdGlvbmFsXG4gICAgdmFyIHN0YXJ0UGFnZSA9IG9wdGlvbnMuc3RhcnRQYWdlIHx8IFBBR0VfQVVUTzsgLy8gb3B0aW9uYWxcbiAgICB2YXIgaXNTdW1tYXJ5ID0gb3B0aW9ucy5pc1N1bW1hcnkgPT09IHVuZGVmaW5lZCA/IGZhbHNlIDogb3B0aW9ucy5pc1N1bW1hcnk7IC8vIG9wdGlvbmFsXG4gICAgLy8gY29udGVudERhdGEgY29udGFpbnMgZGV0YWlscyBhYm91dCB0aGUgY29udGVudCBiZWluZyByZWFjdGVkIHRvIGxpa2UgdGV4dCByYW5nZSBvciBpbWFnZSBoZWlnaHQvd2lkdGguXG4gICAgLy8gd2UgcG90ZW50aWFsbHkgbW9kaWZ5IHRoaXMgZGF0YSAoZS5nLiBpbiB0aGUgZGVmYXVsdCByZWFjdGlvbiBjYXNlIHdlIHNlbGVjdCB0aGUgdGV4dCBvdXJzZWx2ZXMpIHNvIHdlXG4gICAgLy8gbWFrZSBhIGxvY2FsIGNvcHkgb2YgaXQgdG8gYXZvaWQgdW5leHBlY3RlZGx5IGNoYW5naW5nIGRhdGEgb3V0IGZyb20gdW5kZXIgb25lIG9mIHRoZSBjbGllbnRzXG4gICAgdmFyIGNvbnRlbnREYXRhID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShvcHRpb25zLmNvbnRlbnREYXRhKSk7XG4gICAgdmFyIHBhZ2VEYXRhID0gb3B0aW9ucy5wYWdlRGF0YTtcbiAgICB2YXIgZ3JvdXBTZXR0aW5ncyA9IG9wdGlvbnMuZ3JvdXBTZXR0aW5ncztcbiAgICB2YXIgcmFjdGl2ZSA9IFJhY3RpdmUoe1xuICAgICAgICBlbDogV2lkZ2V0QnVja2V0LmdldCgpLFxuICAgICAgICBhcHBlbmQ6IHRydWUsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIHN1cHBvcnRzVG91Y2g6IEJyb3dzZXJNZXRyaWNzLnN1cHBvcnRzVG91Y2goKVxuICAgICAgICB9LFxuICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL3JlYWN0aW9ucy13aWRnZXQuaGJzLmh0bWwnKSxcbiAgICAgICAgcGFydGlhbHM6IHtcbiAgICAgICAgICAgIGxvZ286IFNWR3MubG9nb1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICByYWN0aXZlLm9uKCdjbG9zZScsIGNsb3NlQWxsV2luZG93cyk7XG4gICAgdmFyICRyb290RWxlbWVudCA9ICQocm9vdEVsZW1lbnQocmFjdGl2ZSkpO1xuICAgIE1vdmVhYmxlLm1ha2VNb3ZlYWJsZSgkcm9vdEVsZW1lbnQsICRyb290RWxlbWVudC5maW5kKCcuYW50ZW5uYS1oZWFkZXInKSk7XG4gICAgdmFyIHBhZ2VzID0gW107XG5cbiAgICBvcGVuV2luZG93KCk7XG5cbiAgICBmdW5jdGlvbiBvcGVuV2luZG93KCkge1xuICAgICAgICBQYWdlRGF0YS5jbGVhckluZGljYXRvckxpbWl0KHBhZ2VEYXRhKTtcbiAgICAgICAgdmFyIGNvb3JkcztcbiAgICAgICAgaWYgKGVsZW1lbnRPckNvb3Jkcy50b3AgJiYgZWxlbWVudE9yQ29vcmRzLmxlZnQpIHtcbiAgICAgICAgICAgIGNvb3JkcyA9IGVsZW1lbnRPckNvb3JkcztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciAkcmVsYXRpdmVFbGVtZW50ID0gJChlbGVtZW50T3JDb29yZHMpO1xuICAgICAgICAgICAgdmFyIG9mZnNldCA9ICRyZWxhdGl2ZUVsZW1lbnQub2Zmc2V0KCk7XG4gICAgICAgICAgICBjb29yZHMgPSB7XG4gICAgICAgICAgICAgICAgdG9wOiBvZmZzZXQudG9wLFxuICAgICAgICAgICAgICAgIGxlZnQ6IG9mZnNldC5sZWZ0XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIHZhciBob3Jpem9udGFsT3ZlcmZsb3cgPSBjb29yZHMubGVmdCArICRyb290RWxlbWVudC53aWR0aCgpIC0gTWF0aC5tYXgoZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudFdpZHRoLCB3aW5kb3cuaW5uZXJXaWR0aCB8fCAwKTsgLy8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xMjQ4MDgxL2dldC10aGUtYnJvd3Nlci12aWV3cG9ydC1kaW1lbnNpb25zLXdpdGgtamF2YXNjcmlwdC84ODc2MDY5Izg4NzYwNjlcbiAgICAgICAgaWYgKGhvcml6b250YWxPdmVyZmxvdyA+IDApIHtcbiAgICAgICAgICAgIGNvb3Jkcy5sZWZ0ID0gY29vcmRzLmxlZnQgLSBob3Jpem9udGFsT3ZlcmZsb3c7XG4gICAgICAgIH1cbiAgICAgICAgJHJvb3RFbGVtZW50LnN0b3AodHJ1ZSwgdHJ1ZSkuYWRkQ2xhc3MoJ2FudGVubmEtcmVhY3Rpb25zLW9wZW4nKS5jc3MoY29vcmRzKTtcblxuICAgICAgICB2YXIgaXNTaG93UmVhY3Rpb25zID0gc3RhcnRQYWdlID09PSBQQUdFX1JFQUNUSU9OUyB8fCAoc3RhcnRQYWdlID09PSBQQUdFX0FVVE8gJiYgcmVhY3Rpb25zRGF0YS5sZW5ndGggPiAwKTtcbiAgICAgICAgaWYgKGlzU2hvd1JlYWN0aW9ucykge1xuICAgICAgICAgICAgc2hvd1JlYWN0aW9ucyhmYWxzZSk7XG4gICAgICAgIH0gZWxzZSB7IC8vIHN0YXJ0UGFnZSA9PT0gcGFnZURlZmF1bHRzIHx8IHRoZXJlIGFyZSBubyByZWFjdGlvbnNcbiAgICAgICAgICAgIHNob3dEZWZhdWx0UmVhY3Rpb25zUGFnZShmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlzU3VtbWFyeSkge1xuICAgICAgICAgICAgRXZlbnRzLnBvc3RTdW1tYXJ5T3BlbmVkKGlzU2hvd1JlYWN0aW9ucywgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgRXZlbnRzLnBvc3RSZWFjdGlvbldpZGdldE9wZW5lZChpc1Nob3dSZWFjdGlvbnMsIHBhZ2VEYXRhLCBjb250YWluZXJEYXRhLCBjb250ZW50RGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIH1cblxuICAgICAgICBzZXR1cFdpbmRvd0Nsb3NlKHBhZ2VzLCByYWN0aXZlKTtcbiAgICAgICAgcHJldmVudEV4dHJhU2Nyb2xsKCRyb290RWxlbWVudCk7XG4gICAgICAgIG9wZW5JbnN0YW5jZXMucHVzaChyYWN0aXZlKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzaG93UmVhY3Rpb25zKGFuaW1hdGUpIHtcbiAgICAgICAgdmFyIG9wdGlvbnMgPSB7XG4gICAgICAgICAgICBpc1N1bW1hcnk6IGlzU3VtbWFyeSxcbiAgICAgICAgICAgIHJlYWN0aW9uc0RhdGE6IHJlYWN0aW9uc0RhdGEsXG4gICAgICAgICAgICBwYWdlRGF0YTogcGFnZURhdGEsXG4gICAgICAgICAgICBncm91cFNldHRpbmdzOiBncm91cFNldHRpbmdzLFxuICAgICAgICAgICAgY29udGFpbmVyRGF0YTogY29udGFpbmVyRGF0YSxcbiAgICAgICAgICAgIGNvbnRhaW5lckVsZW1lbnQ6IGNvbnRhaW5lckVsZW1lbnQsXG4gICAgICAgICAgICBzaG93Q29uZmlybWF0aW9uOiBzaG93Q29uZmlybWF0aW9uLFxuICAgICAgICAgICAgc2hvd0RlZmF1bHRzOiBmdW5jdGlvbigpIHsgc2hvd0RlZmF1bHRSZWFjdGlvbnNQYWdlKHRydWUpIH0sXG4gICAgICAgICAgICBzaG93Q29tbWVudHM6IHNob3dDb21tZW50cyxcbiAgICAgICAgICAgIHNob3dMb2NhdGlvbnM6IHNob3dMb2NhdGlvbnMsXG4gICAgICAgICAgICBoYW5kbGVSZWFjdGlvbkVycm9yOiBoYW5kbGVSZWFjdGlvbkVycm9yLFxuICAgICAgICAgICAgZWxlbWVudDogcGFnZUNvbnRhaW5lcihyYWN0aXZlKSxcbiAgICAgICAgICAgIHJlYWN0aW9uc1dpbmRvdzogJHJvb3RFbGVtZW50XG4gICAgICAgIH07XG4gICAgICAgIHZhciBwYWdlID0gUmVhY3Rpb25zUGFnZS5jcmVhdGUob3B0aW9ucyk7XG4gICAgICAgIHBhZ2VzLnB1c2gocGFnZSk7XG4gICAgICAgIHNob3dQYWdlKHBhZ2Uuc2VsZWN0b3IsICRyb290RWxlbWVudCwgYW5pbWF0ZSwgZmFsc2UpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNob3dEZWZhdWx0UmVhY3Rpb25zUGFnZShhbmltYXRlKSB7XG4gICAgICAgIGlmIChjb250YWluZXJFbGVtZW50ICYmICFjb250ZW50RGF0YS5sb2NhdGlvbiAmJiAhY29udGVudERhdGEuYm9keSkge1xuICAgICAgICAgICAgUmFuZ2UuZ3JhYk5vZGUoY29udGFpbmVyRWxlbWVudC5nZXQoMCksIGZ1bmN0aW9uICh0ZXh0LCBsb2NhdGlvbikge1xuICAgICAgICAgICAgICAgIGNvbnRlbnREYXRhLmxvY2F0aW9uID0gbG9jYXRpb247XG4gICAgICAgICAgICAgICAgY29udGVudERhdGEuYm9keSA9IHRleHQ7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgb3B0aW9ucyA9IHsgLy8gVE9ETzogY2xlYW4gdXAgdGhlIG51bWJlciBvZiB0aGVzZSBcIm9wdGlvbnNcIiBvYmplY3RzIHRoYXQgd2UgY3JlYXRlLlxuICAgICAgICAgICAgZGVmYXVsdFJlYWN0aW9uczogZGVmYXVsdFJlYWN0aW9ucyxcbiAgICAgICAgICAgIHBhZ2VEYXRhOiBwYWdlRGF0YSxcbiAgICAgICAgICAgIGdyb3VwU2V0dGluZ3M6IGdyb3VwU2V0dGluZ3MsXG4gICAgICAgICAgICBjb250YWluZXJEYXRhOiBjb250YWluZXJEYXRhLFxuICAgICAgICAgICAgY29udGVudERhdGE6IGNvbnRlbnREYXRhLFxuICAgICAgICAgICAgc2hvd0NvbmZpcm1hdGlvbjogc2hvd0NvbmZpcm1hdGlvbixcbiAgICAgICAgICAgIHNob3dQZW5kaW5nQXBwcm92YWw6IHNob3dQZW5kaW5nQXBwcm92YWwsXG4gICAgICAgICAgICBzaG93UHJvZ3Jlc3M6IHNob3dQcm9ncmVzc1BhZ2UsXG4gICAgICAgICAgICBoYW5kbGVSZWFjdGlvbkVycm9yOiBoYW5kbGVSZWFjdGlvbkVycm9yLFxuICAgICAgICAgICAgZWxlbWVudDogcGFnZUNvbnRhaW5lcihyYWN0aXZlKSxcbiAgICAgICAgICAgIHJlYWN0aW9uc1dpbmRvdzogJHJvb3RFbGVtZW50XG4gICAgICAgIH07XG4gICAgICAgIHNldFdpbmRvd1RpdGxlKE1lc3NhZ2VzLmdldE1lc3NhZ2UoJ3JlYWN0aW9uc193aWRnZXRfX3RpdGxlX3RoaW5rJykpO1xuICAgICAgICB2YXIgcGFnZSA9IERlZmF1bHRzUGFnZS5jcmVhdGUob3B0aW9ucyk7XG4gICAgICAgIHBhZ2VzLnB1c2gocGFnZSk7XG4gICAgICAgIHNob3dQYWdlKHBhZ2Uuc2VsZWN0b3IsICRyb290RWxlbWVudCwgYW5pbWF0ZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2hvd0NvbmZpcm1hdGlvbihyZWFjdGlvbkRhdGEsIHJlYWN0aW9uUHJvdmlkZXIpIHtcbiAgICAgICAgc2V0V2luZG93VGl0bGUoTWVzc2FnZXMuZ2V0TWVzc2FnZSgncmVhY3Rpb25zX3dpZGdldF9fdGl0bGVfdGhhbmtzJykpO1xuICAgICAgICB2YXIgcGFnZSA9IENvbmZpcm1hdGlvblBhZ2UuY3JlYXRlKHJlYWN0aW9uRGF0YS50ZXh0LCByZWFjdGlvblByb3ZpZGVyLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncywgcGFnZUNvbnRhaW5lcihyYWN0aXZlKSk7XG4gICAgICAgIHBhZ2VzLnB1c2gocGFnZSk7XG4gICAgICAgIC8vIFRPRE86IHJldmlzaXQgd2h5IHdlIG5lZWQgdG8gdXNlIHRoZSB0aW1lb3V0IHRyaWNrIGZvciB0aGUgY29uZmlybSBwYWdlLCBidXQgbm90IGZvciB0aGUgZGVmYXVsdHMgcGFnZVxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyAvLyBJbiBvcmRlciBmb3IgdGhlIHBvc2l0aW9uaW5nIGFuaW1hdGlvbiB0byB3b3JrLCB3ZSBuZWVkIHRvIGxldCB0aGUgYnJvd3NlciByZW5kZXIgdGhlIGFwcGVuZGVkIERPTSBlbGVtZW50XG4gICAgICAgICAgICBzaG93UGFnZShwYWdlLnNlbGVjdG9yLCAkcm9vdEVsZW1lbnQsIHRydWUpO1xuICAgICAgICB9LCAxKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzaG93UGVuZGluZ0FwcHJvdmFsKHJlYWN0aW9uKSB7XG4gICAgICAgIHNldFdpbmRvd1RpdGxlKE1lc3NhZ2VzLmdldE1lc3NhZ2UoJ3JlYWN0aW9uc193aWRnZXRfX3RpdGxlX3RoYW5rcycpKTtcbiAgICAgICAgdmFyIHBhZ2UgPSBQZW5kaW5nUmVhY3Rpb25QYWdlLmNyZWF0ZVBhZ2UocmVhY3Rpb24udGV4dCwgcGFnZUNvbnRhaW5lcihyYWN0aXZlKSk7XG4gICAgICAgIHBhZ2VzLnB1c2gocGFnZSk7XG4gICAgICAgIC8vIFRPRE86IHJldmlzaXQgd2h5IHdlIG5lZWQgdG8gdXNlIHRoZSB0aW1lb3V0IHRyaWNrIGZvciB0aGUgY29uZmlybSBwYWdlLCBidXQgbm90IGZvciB0aGUgZGVmYXVsdHMgcGFnZVxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyAvLyBJbiBvcmRlciBmb3IgdGhlIHBvc2l0aW9uaW5nIGFuaW1hdGlvbiB0byB3b3JrLCB3ZSBuZWVkIHRvIGxldCB0aGUgYnJvd3NlciByZW5kZXIgdGhlIGFwcGVuZGVkIERPTSBlbGVtZW50XG4gICAgICAgICAgICBzaG93UGFnZShwYWdlLnNlbGVjdG9yLCAkcm9vdEVsZW1lbnQsIHRydWUpO1xuICAgICAgICB9LCAxKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzaG93UHJvZ3Jlc3NQYWdlKCkge1xuICAgICAgICBzaG93UGFnZSgnLmFudGVubmEtcHJvZ3Jlc3MtcGFnZScsICRyb290RWxlbWVudCwgZmFsc2UsIHRydWUpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNob3dDb21tZW50cyhyZWFjdGlvbiwgYmFja1BhZ2VTZWxlY3Rvcikge1xuICAgICAgICBzaG93UHJvZ3Jlc3NQYWdlKCk7IC8vIFRPRE86IHByb3ZpZGUgc29tZSB3YXkgZm9yIHRoZSB1c2VyIHRvIGdpdmUgdXAgLyBjYW5jZWwuIEFsc28sIGhhbmRsZSBlcnJvcnMgZmV0Y2hpbmcgY29tbWVudHMuXG4gICAgICAgIHZhciBzdWNjZXNzID0gZnVuY3Rpb24oY29tbWVudHMpIHtcbiAgICAgICAgICAgIHZhciBvcHRpb25zID0ge1xuICAgICAgICAgICAgICAgIHJlYWN0aW9uOiByZWFjdGlvbixcbiAgICAgICAgICAgICAgICBjb21tZW50czogY29tbWVudHMsXG4gICAgICAgICAgICAgICAgZWxlbWVudDogcGFnZUNvbnRhaW5lcihyYWN0aXZlKSxcbiAgICAgICAgICAgICAgICBnb0JhY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBzZXRXaW5kb3dUaXRsZShNZXNzYWdlcy5nZXRNZXNzYWdlKCdyZWFjdGlvbnNfd2lkZ2V0X190aXRsZScpKTtcbiAgICAgICAgICAgICAgICAgICAgZ29CYWNrVG9QYWdlKHBhZ2VzLCBiYWNrUGFnZVNlbGVjdG9yLCAkcm9vdEVsZW1lbnQpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgY29udGFpbmVyRGF0YTogY29udGFpbmVyRGF0YSxcbiAgICAgICAgICAgICAgICBwYWdlRGF0YTogcGFnZURhdGEsXG4gICAgICAgICAgICAgICAgZ3JvdXBTZXR0aW5nczogZ3JvdXBTZXR0aW5nc1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHZhciBwYWdlID0gQ29tbWVudHNQYWdlLmNyZWF0ZShvcHRpb25zKTtcbiAgICAgICAgICAgIHBhZ2VzLnB1c2gocGFnZSk7XG5cbiAgICAgICAgICAgIC8vIFRPRE86IHJldmlzaXRcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IC8vIEluIG9yZGVyIGZvciB0aGUgcG9zaXRpb25pbmcgYW5pbWF0aW9uIHRvIHdvcmssIHdlIG5lZWQgdG8gbGV0IHRoZSBicm93c2VyIHJlbmRlciB0aGUgYXBwZW5kZWQgRE9NIGVsZW1lbnRcbiAgICAgICAgICAgICAgICBzaG93UGFnZShwYWdlLnNlbGVjdG9yLCAkcm9vdEVsZW1lbnQsIHRydWUpO1xuICAgICAgICAgICAgfSwgMSk7XG5cbiAgICAgICAgICAgIEV2ZW50cy5wb3N0Q29tbWVudHNWaWV3ZWQocGFnZURhdGEsIGNvbnRhaW5lckRhdGEsIHJlYWN0aW9uLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIGVycm9yID0gZnVuY3Rpb24obWVzc2FnZSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ0FuIGVycm9yIG9jY3VycmVkIGZldGNoaW5nIGNvbW1lbnRzOiAnICsgbWVzc2FnZSk7XG4gICAgICAgICAgICBzaG93R2VuZXJpY0Vycm9yUGFnZShiYWNrUGFnZVNlbGVjdG9yKTtcbiAgICAgICAgfTtcbiAgICAgICAgQWpheENsaWVudC5nZXRDb21tZW50cyhyZWFjdGlvbiwgc3VjY2VzcywgZXJyb3IpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNob3dMb2NhdGlvbnMocmVhY3Rpb24sIGJhY2tQYWdlU2VsZWN0b3IpIHtcbiAgICAgICAgc2hvd1Byb2dyZXNzUGFnZSgpOyAvLyBUT0RPOiBwcm92aWRlIHNvbWUgd2F5IGZvciB0aGUgdXNlciB0byBnaXZlIHVwIC8gY2FuY2VsLiBBbHNvLCBoYW5kbGUgZXJyb3JzIGZldGNoaW5nIGNvbW1lbnRzLlxuICAgICAgICB2YXIgcmVhY3Rpb25Mb2NhdGlvbkRhdGEgPSBQYWdlRGF0YS5nZXRSZWFjdGlvbkxvY2F0aW9uRGF0YShyZWFjdGlvbiwgcGFnZURhdGEpO1xuICAgICAgICB2YXIgc3VjY2VzcyA9IGZ1bmN0aW9uKGxvY2F0aW9uRGV0YWlscykge1xuICAgICAgICAgICAgUGFnZURhdGEudXBkYXRlUmVhY3Rpb25Mb2NhdGlvbkRhdGEocmVhY3Rpb25Mb2NhdGlvbkRhdGEsIGxvY2F0aW9uRGV0YWlscyk7XG4gICAgICAgICAgICB2YXIgb3B0aW9ucyA9IHsgLy8gVE9ETzogY2xlYW4gdXAgdGhlIG51bWJlciBvZiB0aGVzZSBcIm9wdGlvbnNcIiBvYmplY3RzIHRoYXQgd2UgY3JlYXRlLlxuICAgICAgICAgICAgICAgIGVsZW1lbnQ6IHBhZ2VDb250YWluZXIocmFjdGl2ZSksXG4gICAgICAgICAgICAgICAgcmVhY3Rpb25Mb2NhdGlvbkRhdGE6IHJlYWN0aW9uTG9jYXRpb25EYXRhLFxuICAgICAgICAgICAgICAgIHBhZ2VEYXRhOiBwYWdlRGF0YSxcbiAgICAgICAgICAgICAgICBncm91cFNldHRpbmdzOiBncm91cFNldHRpbmdzLFxuICAgICAgICAgICAgICAgIGNsb3NlV2luZG93OiBjbG9zZUFsbFdpbmRvd3MsXG4gICAgICAgICAgICAgICAgZ29CYWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgc2V0V2luZG93VGl0bGUoTWVzc2FnZXMuZ2V0TWVzc2FnZSgncmVhY3Rpb25zX3dpZGdldF9fdGl0bGUnKSk7XG4gICAgICAgICAgICAgICAgICAgIGdvQmFja1RvUGFnZShwYWdlcywgYmFja1BhZ2VTZWxlY3RvciwgJHJvb3RFbGVtZW50KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdmFyIHBhZ2UgPSBMb2NhdGlvbnNQYWdlLmNyZWF0ZShvcHRpb25zKTtcbiAgICAgICAgICAgIHBhZ2VzLnB1c2gocGFnZSk7XG4gICAgICAgICAgICBzZXRXaW5kb3dUaXRsZShyZWFjdGlvbi50ZXh0KTtcbiAgICAgICAgICAgIC8vIFRPRE86IHJldmlzaXRcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IC8vIEluIG9yZGVyIGZvciB0aGUgcG9zaXRpb25pbmcgYW5pbWF0aW9uIHRvIHdvcmssIHdlIG5lZWQgdG8gbGV0IHRoZSBicm93c2VyIHJlbmRlciB0aGUgYXBwZW5kZWQgRE9NIGVsZW1lbnRcbiAgICAgICAgICAgICAgICBzaG93UGFnZShwYWdlLnNlbGVjdG9yLCAkcm9vdEVsZW1lbnQsIHRydWUpO1xuICAgICAgICAgICAgfSwgMSk7XG4gICAgICAgICAgICBFdmVudHMucG9zdExvY2F0aW9uc1ZpZXdlZChwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIH07XG4gICAgICAgIHZhciBlcnJvciA9IGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdBbiBlcnJvciBvY2N1cnJlZCBmZXRjaGluZyBjb250ZW50IGJvZGllczogJyArIG1lc3NhZ2UpO1xuICAgICAgICAgICAgc2hvd0dlbmVyaWNFcnJvclBhZ2UoYmFja1BhZ2VTZWxlY3Rvcik7XG4gICAgICAgIH07XG4gICAgICAgIEFqYXhDbGllbnQuZmV0Y2hMb2NhdGlvbkRldGFpbHMocmVhY3Rpb25Mb2NhdGlvbkRhdGEsIHBhZ2VEYXRhLCBzdWNjZXNzLCBlcnJvcik7XG4gICAgfVxuXG4gICAgLy8gU2hvd3MgdGhlIGxvZ2luIHBhZ2UsIHdpdGggYSBwcm9tcHQgdG8gZ28gQmFjayB0byB0aGUgcGFnZSBzcGVjaWZpZWQgYnkgdGhlIGdpdmVuIHBhZ2Ugc2VsZWN0b3IuXG4gICAgZnVuY3Rpb24gc2hvd0xvZ2luUGFnZShiYWNrUGFnZVNlbGVjdG9yLCByZXRyeUNhbGxiYWNrKSB7XG4gICAgICAgIHNldFdpbmRvd1RpdGxlKE1lc3NhZ2VzLmdldE1lc3NhZ2UoJ3JlYWN0aW9uc193aWRnZXRfX3RpdGxlX3NpZ25pbicpKTtcbiAgICAgICAgdmFyIG9wdGlvbnMgPSB7XG4gICAgICAgICAgICBlbGVtZW50OiBwYWdlQ29udGFpbmVyKHJhY3RpdmUpLFxuICAgICAgICAgICAgZ3JvdXBTZXR0aW5nczogZ3JvdXBTZXR0aW5ncyxcbiAgICAgICAgICAgIGdvQmFjazogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgc2V0V2luZG93VGl0bGUoTWVzc2FnZXMuZ2V0TWVzc2FnZSgncmVhY3Rpb25zX3dpZGdldF9fdGl0bGUnKSk7XG4gICAgICAgICAgICAgICAgZ29CYWNrVG9QYWdlKHBhZ2VzLCBiYWNrUGFnZVNlbGVjdG9yLCAkcm9vdEVsZW1lbnQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJldHJ5OiByZXRyeUNhbGxiYWNrXG4gICAgICAgIH07XG4gICAgICAgIHZhciBwYWdlID0gTG9naW5QYWdlLmNyZWF0ZVBhZ2Uob3B0aW9ucyk7XG4gICAgICAgIHBhZ2VzLnB1c2gocGFnZSk7XG5cbiAgICAgICAgLy8gVE9ETzogcmV2aXNpdCB3aHkgd2UgbmVlZCB0byB1c2UgdGhlIHRpbWVvdXQgdHJpY2sgZm9yIHRoZSBjb25maXJtIHBhZ2UsIGJ1dCBub3QgZm9yIHRoZSBkZWZhdWx0cyBwYWdlXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IC8vIEluIG9yZGVyIGZvciB0aGUgcG9zaXRpb25pbmcgYW5pbWF0aW9uIHRvIHdvcmssIHdlIG5lZWQgdG8gbGV0IHRoZSBicm93c2VyIHJlbmRlciB0aGUgYXBwZW5kZWQgRE9NIGVsZW1lbnRcbiAgICAgICAgICAgIHNob3dQYWdlKHBhZ2Uuc2VsZWN0b3IsICRyb290RWxlbWVudCwgdHJ1ZSk7XG4gICAgICAgIH0sIDEpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNob3dCbG9ja2VkUmVhY3Rpb25QYWdlKGJhY2tQYWdlU2VsZWN0b3IpIHtcbiAgICAgICAgc2V0V2luZG93VGl0bGUoTWVzc2FnZXMuZ2V0TWVzc2FnZSgncmVhY3Rpb25zX3dpZGdldF9fdGl0bGVfYmxvY2tlZCcpKTtcbiAgICAgICAgdmFyIG9wdGlvbnMgPSB7XG4gICAgICAgICAgICBlbGVtZW50OiBwYWdlQ29udGFpbmVyKHJhY3RpdmUpLFxuICAgICAgICAgICAgZ3JvdXBTZXR0aW5nczogZ3JvdXBTZXR0aW5ncyxcbiAgICAgICAgICAgIGdvQmFjazogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgc2V0V2luZG93VGl0bGUoTWVzc2FnZXMuZ2V0TWVzc2FnZSgncmVhY3Rpb25zX3dpZGdldF9fdGl0bGUnKSk7XG4gICAgICAgICAgICAgICAgZ29CYWNrVG9QYWdlKHBhZ2VzLCBiYWNrUGFnZVNlbGVjdG9yLCAkcm9vdEVsZW1lbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICB2YXIgcGFnZSA9IEJsb2NrZWRSZWFjdGlvblBhZ2UuY3JlYXRlUGFnZShvcHRpb25zKTtcbiAgICAgICAgcGFnZXMucHVzaChwYWdlKTtcblxuICAgICAgICAvLyBUT0RPOiByZXZpc2l0IHdoeSB3ZSBuZWVkIHRvIHVzZSB0aGUgdGltZW91dCB0cmljayBmb3IgdGhlIGNvbmZpcm0gcGFnZSwgYnV0IG5vdCBmb3IgdGhlIGRlZmF1bHRzIHBhZ2VcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHsgLy8gSW4gb3JkZXIgZm9yIHRoZSBwb3NpdGlvbmluZyBhbmltYXRpb24gdG8gd29yaywgd2UgbmVlZCB0byBsZXQgdGhlIGJyb3dzZXIgcmVuZGVyIHRoZSBhcHBlbmRlZCBET00gZWxlbWVudFxuICAgICAgICAgICAgc2hvd1BhZ2UocGFnZS5zZWxlY3RvciwgJHJvb3RFbGVtZW50LCB0cnVlKTtcbiAgICAgICAgfSwgMSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2hvd0dlbmVyaWNFcnJvclBhZ2UoYmFja1BhZ2VTZWxlY3Rvcikge1xuICAgICAgICBzZXRXaW5kb3dUaXRsZShNZXNzYWdlcy5nZXRNZXNzYWdlKCdyZWFjdGlvbnNfd2lkZ2V0X190aXRsZV9lcnJvcicpKTtcbiAgICAgICAgdmFyIG9wdGlvbnMgPSB7XG4gICAgICAgICAgICBlbGVtZW50OiBwYWdlQ29udGFpbmVyKHJhY3RpdmUpLFxuICAgICAgICAgICAgZ29CYWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBzZXRXaW5kb3dUaXRsZShNZXNzYWdlcy5nZXRNZXNzYWdlKCdyZWFjdGlvbnNfd2lkZ2V0X190aXRsZScpKTtcbiAgICAgICAgICAgICAgICBnb0JhY2tUb1BhZ2UocGFnZXMsIGJhY2tQYWdlU2VsZWN0b3IsICRyb290RWxlbWVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHZhciBwYWdlID0gR2VuZXJpY0Vycm9yUGFnZS5jcmVhdGVQYWdlKG9wdGlvbnMpO1xuICAgICAgICBwYWdlcy5wdXNoKHBhZ2UpO1xuXG4gICAgICAgIC8vIFRPRE86IHJldmlzaXQgd2h5IHdlIG5lZWQgdG8gdXNlIHRoZSB0aW1lb3V0IHRyaWNrIGZvciB0aGUgY29uZmlybSBwYWdlLCBidXQgbm90IGZvciB0aGUgZGVmYXVsdHMgcGFnZVxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyAvLyBJbiBvcmRlciBmb3IgdGhlIHBvc2l0aW9uaW5nIGFuaW1hdGlvbiB0byB3b3JrLCB3ZSBuZWVkIHRvIGxldCB0aGUgYnJvd3NlciByZW5kZXIgdGhlIGFwcGVuZGVkIERPTSBlbGVtZW50XG4gICAgICAgICAgICBzaG93UGFnZShwYWdlLnNlbGVjdG9yLCAkcm9vdEVsZW1lbnQsIHRydWUpO1xuICAgICAgICB9LCAxKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBoYW5kbGVSZWFjdGlvbkVycm9yKG1lc3NhZ2UsIHJldHJ5Q2FsbGJhY2ssIGJhY2tQYWdlU2VsZWN0b3IpIHtcbiAgICAgICAgaWYgKG1lc3NhZ2UuaW5kZXhPZignc2lnbiBpbiByZXF1aXJlZCBmb3Igb3JnYW5pYyByZWFjdGlvbnMnKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIHNob3dMb2dpblBhZ2UoYmFja1BhZ2VTZWxlY3RvciwgcmV0cnlDYWxsYmFjayk7XG4gICAgICAgIH0gZWxzZSBpZiAobWVzc2FnZS5pbmRleE9mKCdHcm91cCBoYXMgYmxvY2tlZCB0aGlzIHRhZy4nKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIHNob3dCbG9ja2VkUmVhY3Rpb25QYWdlKGJhY2tQYWdlU2VsZWN0b3IpO1xuICAgICAgICB9IGVsc2UgaWYgKGlzVG9rZW5FcnJvcihtZXNzYWdlKSkge1xuICAgICAgICAgICAgVXNlci5yZUF1dGhvcml6ZVVzZXIoZnVuY3Rpb24oaGFzTmV3VG9rZW4pIHtcbiAgICAgICAgICAgICAgICBpZiAoaGFzTmV3VG9rZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0cnlDYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHNob3dMb2dpblBhZ2UoYmFja1BhZ2VTZWxlY3RvciwgcmV0cnlDYWxsYmFjayk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcImVycm9yIHBvc3RpbmcgcmVhY3Rpb246IFwiICsgbWVzc2FnZSk7XG4gICAgICAgICAgICBzaG93R2VuZXJpY0Vycm9yUGFnZShiYWNrUGFnZVNlbGVjdG9yKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGlzVG9rZW5FcnJvcihtZXNzYWdlKSB7XG4gICAgICAgICAgICBzd2l0Y2gobWVzc2FnZSkge1xuICAgICAgICAgICAgICAgIGNhc2UgXCJUb2tlbiB3YXMgaW52YWxpZFwiOlxuICAgICAgICAgICAgICAgIGNhc2UgXCJGYWNlYm9vayB0b2tlbiBleHBpcmVkXCI6XG4gICAgICAgICAgICAgICAgY2FzZSBcIkZCIGdyYXBoIGVycm9yIC0gdG9rZW4gaW52YWxpZFwiOlxuICAgICAgICAgICAgICAgIGNhc2UgXCJTb2NpYWwgQXV0aCBkb2VzIG5vdCBleGlzdCBmb3IgdXNlclwiOlxuICAgICAgICAgICAgICAgIGNhc2UgXCJEYXRhIHRvIGNyZWF0ZSB0b2tlbiBpcyBtaXNzaW5nXCI6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2V0V2luZG93VGl0bGUodGl0bGUpIHtcbiAgICAgICAgJChyYWN0aXZlLmZpbmQoJy5hbnRlbm5hLXJlYWN0aW9ucy10aXRsZScpKS5odG1sKHRpdGxlKTtcbiAgICB9XG5cbn1cblxuZnVuY3Rpb24gcm9vdEVsZW1lbnQocmFjdGl2ZSkge1xuICAgIHJldHVybiByYWN0aXZlLmZpbmQoU0VMRUNUT1JfUkVBQ1RJT05TX1dJREdFVCk7XG59XG5cbmZ1bmN0aW9uIHBhZ2VDb250YWluZXIocmFjdGl2ZSkge1xuICAgIHJldHVybiByYWN0aXZlLmZpbmQoJy5hbnRlbm5hLXBhZ2UtY29udGFpbmVyJyk7XG59XG5cbnZhciBwYWdlWiA9IDEwMDA7IC8vIEl0J3Mgc2FmZSBmb3IgdGhpcyB2YWx1ZSB0byBnbyBhY3Jvc3MgaW5zdGFuY2VzLiBXZSBqdXN0IG5lZWQgaXQgdG8gY29udGludW91c2x5IGluY3JlYXNlIChtYXggdmFsdWUgaXMgb3ZlciAyIGJpbGxpb24pLlxuXG5mdW5jdGlvbiBzaG93UGFnZShwYWdlU2VsZWN0b3IsICRyb290RWxlbWVudCwgYW5pbWF0ZSwgb3ZlcmxheSkge1xuICAgIHZhciAkcGFnZSA9ICRyb290RWxlbWVudC5maW5kKHBhZ2VTZWxlY3Rvcik7XG4gICAgJHBhZ2UuY3NzKCd6LWluZGV4JywgcGFnZVopO1xuICAgIHBhZ2VaICs9IDE7XG5cbiAgICAkcGFnZS50b2dnbGVDbGFzcygnYW50ZW5uYS1wYWdlLWFuaW1hdGUnLCBhbmltYXRlKTtcblxuICAgIHZhciAkY3VycmVudCA9ICRyb290RWxlbWVudC5maW5kKCcuYW50ZW5uYS1wYWdlLWFjdGl2ZScpLm5vdChwYWdlU2VsZWN0b3IpO1xuICAgIGlmIChvdmVybGF5KSB7XG4gICAgICAgIC8vIEluIHRoZSBvdmVybGF5IGNhc2UsIHNpemUgdGhlIHBhZ2UgdG8gbWF0Y2ggd2hhdGV2ZXIgcGFnZSBpcyBjdXJyZW50bHkgc2hvd2luZyBhbmQgdGhlbiBtYWtlIGl0IGFjdGl2ZSAodGhlcmUgd2lsbCBiZSB0d28gJ2FjdGl2ZScgcGFnZXMpXG4gICAgICAgICRwYWdlLmhlaWdodCgkY3VycmVudC5oZWlnaHQoKSk7XG4gICAgICAgICRwYWdlLmFkZENsYXNzKCdhbnRlbm5hLXBhZ2UtYWN0aXZlJyk7XG4gICAgfSBlbHNlIGlmIChhbmltYXRlKSB7XG4gICAgICAgIFRyYW5zaXRpb25VdGlsLnRvZ2dsZUNsYXNzKCRwYWdlLCAnYW50ZW5uYS1wYWdlLWFjdGl2ZScsIHRydWUsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy8gQWZ0ZXIgdGhlIG5ldyBwYWdlIHNsaWRlcyBpbnRvIHBvc2l0aW9uLCBtb3ZlIHRoZSBvdGhlciBwYWdlcyBiYWNrIG91dCBvZiB0aGUgdmlld2FibGUgYXJlYVxuICAgICAgICAgICAgJGN1cnJlbnQucmVtb3ZlQ2xhc3MoJ2FudGVubmEtcGFnZS1hY3RpdmUnKTtcbiAgICAgICAgICAgICRwYWdlLmZvY3VzKCk7XG4gICAgICAgIH0pO1xuICAgICAgICBzaXplQm9keVRvRml0KCRyb290RWxlbWVudCwgJHBhZ2UsIGFuaW1hdGUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgICRwYWdlLmFkZENsYXNzKCdhbnRlbm5hLXBhZ2UtYWN0aXZlJyk7XG4gICAgICAgICRjdXJyZW50LnJlbW92ZUNsYXNzKCdhbnRlbm5hLXBhZ2UtYWN0aXZlJyk7XG4gICAgICAgICRwYWdlLmZvY3VzKCk7XG4gICAgICAgIHNpemVCb2R5VG9GaXQoJHJvb3RFbGVtZW50LCAkcGFnZSwgYW5pbWF0ZSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBnb0JhY2tUb1BhZ2UocGFnZXMsIHBhZ2VTZWxlY3RvciwgJHJvb3RFbGVtZW50KSB7XG4gICAgdmFyICR0YXJnZXRQYWdlID0gJHJvb3RFbGVtZW50LmZpbmQocGFnZVNlbGVjdG9yKTtcbiAgICB2YXIgJGN1cnJlbnRQYWdlID0gJHJvb3RFbGVtZW50LmZpbmQoJy5hbnRlbm5hLXBhZ2UtYWN0aXZlJyk7XG4gICAgLy8gTW92ZSB0aGUgdGFyZ2V0IHBhZ2UgaW50byBwbGFjZSwgdW5kZXIgdGhlIGN1cnJlbnQgcGFnZVxuICAgICR0YXJnZXRQYWdlLmNzcygnei1pbmRleCcsIHBhcnNlSW50KCRjdXJyZW50UGFnZS5jc3MoJ3otaW5kZXgnKSkgLSAxKTtcbiAgICAkdGFyZ2V0UGFnZS50b2dnbGVDbGFzcygnYW50ZW5uYS1wYWdlLWFuaW1hdGUnLCBmYWxzZSk7XG4gICAgJHRhcmdldFBhZ2UudG9nZ2xlQ2xhc3MoJ2FudGVubmEtcGFnZS1hY3RpdmUnLCB0cnVlKTtcblxuICAgIC8vIFRoZW4gYW5pbWF0ZSB0aGUgY3VycmVudCBwYWdlIG1vdmluZyBhd2F5IHRvIHJldmVhbCB0aGUgdGFyZ2V0LlxuICAgICRjdXJyZW50UGFnZS50b2dnbGVDbGFzcygnYW50ZW5uYS1wYWdlLWFuaW1hdGUnLCB0cnVlKTtcbiAgICBUcmFuc2l0aW9uVXRpbC50b2dnbGVDbGFzcygkY3VycmVudFBhZ2UsICdhbnRlbm5hLXBhZ2UtYWN0aXZlJywgZmFsc2UsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLy8gQWZ0ZXIgdGhlIGN1cnJlbnQgcGFnZSBzbGlkZXMgaW50byBwb3NpdGlvbiwgbW92ZSBhbGwgb3RoZXIgcGFnZXMgYmFjayBvdXQgb2YgdGhlIHZpZXdhYmxlIGFyZWFcbiAgICAgICAgJHJvb3RFbGVtZW50LmZpbmQoJy5hbnRlbm5hLXBhZ2UnKS5ub3QocGFnZVNlbGVjdG9yKS5yZW1vdmVDbGFzcygnYW50ZW5uYS1wYWdlLWFjdGl2ZScpO1xuICAgICAgICAkdGFyZ2V0UGFnZS5jc3MoJ3otaW5kZXgnLCBwYWdlWisrKTsgLy8gV2hlbiB0aGUgYW5pbWF0aW9uIGlzIGRvbmUsIG1ha2Ugc3VyZSB0aGUgY3VycmVudCBwYWdlIGhhcyB0aGUgaGlnaGVzdCB6LWluZGV4IChqdXN0IGZvciBjb25zaXN0ZW5jeSlcbiAgICAgICAgLy8gVGVhcmRvd24gYWxsIG90aGVyIHBhZ2VzLiBUaGV5J2xsIGJlIHJlLWNyZWF0ZWQgaWYgbmVjZXNzYXJ5LlxuICAgICAgICB2YXIgcmVtYWluaW5nUGFnZXMgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYWdlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIHBhZ2UgPSBwYWdlc1tpXTtcbiAgICAgICAgICAgIGlmIChwYWdlLnNlbGVjdG9yID09PSBwYWdlU2VsZWN0b3IpIHtcbiAgICAgICAgICAgICAgICByZW1haW5pbmdQYWdlcy5wdXNoKHBhZ2UpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBwYWdlLnRlYXJkb3duKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcGFnZXMgPSByZW1haW5pbmdQYWdlcztcbiAgICB9KTtcbiAgICBzaXplQm9keVRvRml0KCRyb290RWxlbWVudCwgJHRhcmdldFBhZ2UsIHRydWUpO1xufVxuXG5mdW5jdGlvbiBzaXplQm9keVRvRml0KCRyb290RWxlbWVudCwgJHBhZ2UsIGFuaW1hdGUpIHtcbiAgICB2YXIgJHBhZ2VDb250YWluZXIgPSAkcm9vdEVsZW1lbnQuZmluZCgnLmFudGVubmEtcGFnZS1jb250YWluZXInKTtcbiAgICB2YXIgJGJvZHkgPSAkcGFnZS5maW5kKCcuYW50ZW5uYS1ib2R5Jyk7XG4gICAgdmFyIGN1cnJlbnRIZWlnaHQgPSAkcGFnZUNvbnRhaW5lci5jc3MoJ2hlaWdodCcpO1xuICAgICRwYWdlQ29udGFpbmVyLmNzcyh7IGhlaWdodDogJycgfSk7IC8vIENsZWFyIGFueSBwcmV2aW91c2x5IGNvbXB1dGVkIGhlaWdodCBzbyB3ZSBnZXQgYSBmcmVzaCBjb21wdXRhdGlvbiBvZiB0aGUgY2hpbGQgaGVpZ2h0c1xuICAgIHZhciBuZXdCb2R5SGVpZ2h0ID0gTWF0aC5taW4oMzAwLCAkYm9keS5nZXQoMCkuc2Nyb2xsSGVpZ2h0KTtcbiAgICAkYm9keS5jc3MoeyBoZWlnaHQ6IG5ld0JvZHlIZWlnaHQgfSk7IC8vIFRPRE86IGRvdWJsZS1jaGVjayB0aGF0IHdlIGNhbid0IGp1c3Qgc2V0IGEgbWF4LWhlaWdodCBvZiAzMDBweCBvbiB0aGUgYm9keS5cbiAgICB2YXIgZm9vdGVySGVpZ2h0ID0gJHBhZ2UuZmluZCgnLmFudGVubmEtZm9vdGVyJykub3V0ZXJIZWlnaHQoKTsgLy8gcmV0dXJucyAnbnVsbCcgaWYgdGhlcmUncyBubyBmb290ZXIuIGFkZGVkIHRvIGFuIGludGVnZXIsICdudWxsJyBhY3RzIGxpa2UgMFxuICAgIHZhciBuZXdQYWdlSGVpZ2h0ID0gbmV3Qm9keUhlaWdodCArIGZvb3RlckhlaWdodDtcbiAgICBpZiAoYW5pbWF0ZSkge1xuICAgICAgICAkcGFnZUNvbnRhaW5lci5jc3MoeyBoZWlnaHQ6IGN1cnJlbnRIZWlnaHQgfSk7XG4gICAgICAgICRwYWdlQ29udGFpbmVyLmFuaW1hdGUoeyBoZWlnaHQ6IG5ld1BhZ2VIZWlnaHQgfSwgMjAwKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAkcGFnZUNvbnRhaW5lci5jc3MoeyBoZWlnaHQ6IG5ld1BhZ2VIZWlnaHQgfSk7XG4gICAgfVxuICAgIC8vIFRPRE86IHdlIG1pZ2h0IG5vdCBuZWVkIHdpZHRoIHJlc2l6aW5nIGF0IGFsbC5cbiAgICB2YXIgbWluV2lkdGggPSAkcGFnZS5jc3MoJ21pbi13aWR0aCcpO1xuICAgIHZhciB3aWR0aCA9IHBhcnNlSW50KG1pbldpZHRoKTtcbiAgICBpZiAod2lkdGggPiAwKSB7XG4gICAgICAgIGlmIChhbmltYXRlKSB7XG4gICAgICAgICAgICAkcm9vdEVsZW1lbnQuYW5pbWF0ZSh7IHdpZHRoOiB3aWR0aCB9LCAyMDApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJHJvb3RFbGVtZW50LmNzcyh7IHdpZHRoOiB3aWR0aCB9KTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gc2V0dXBXaW5kb3dDbG9zZShwYWdlcywgcmFjdGl2ZSkge1xuICAgIHZhciAkcm9vdEVsZW1lbnQgPSAkKHJvb3RFbGVtZW50KHJhY3RpdmUpKTtcblxuICAgIC8vIFRPRE86IElmIHlvdSBtb3VzZSBvdmVyIHRoZSB0cmlnZ2VyIHNsb3dseSBmcm9tIHRoZSB0b3AgbGVmdCwgdGhlIHdpbmRvdyBvcGVucyB3aXRob3V0IGJlaW5nIHVuZGVyIHRoZSBjdXJzb3IsXG4gICAgLy8gICAgICAgc28gbm8gbW91c2VvdXQgZXZlbnQgaXMgcmVjZWl2ZWQuIFdoZW4gd2Ugb3BlbiB0aGUgd2luZG93LCB3ZSBzaG91bGQgcHJvYmFibHkganVzdCBzY29vdCBpdCB1cCBzbGlnaHRseVxuICAgIC8vICAgICAgIGlmIG5lZWRlZCB0byBhc3N1cmUgdGhhdCBpdCdzIHVuZGVyIHRoZSBjdXJzb3IuIEFsdGVybmF0aXZlbHksIHdlIGNvdWxkIGFkanVzdCB0aGUgbW91c2VvdmVyIGFyZWEgdG8gbWF0Y2hcbiAgICAvLyAgICAgICB0aGUgcmVnaW9uIHRoYXQgdGhlIHdpbmRvdyBvcGVucy5cbiAgICAkcm9vdEVsZW1lbnRcbiAgICAgICAgLm9uKCdtb3VzZW91dC5hbnRlbm5hJywgZGVsYXllZENsb3NlV2luZG93KVxuICAgICAgICAub24oJ21vdXNlb3Zlci5hbnRlbm5hJywga2VlcFdpbmRvd09wZW4pXG4gICAgICAgIC5vbignZm9jdXNpbi5hbnRlbm5hJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAvLyBPbmNlIHRoZSB3aW5kb3cgaGFzIGZvY3VzLCBkb24ndCBjbG9zZSBpdCBvbiBtb3VzZW91dC5cbiAgICAgICAgICAgIGtlZXBXaW5kb3dPcGVuKCk7XG4gICAgICAgICAgICAkcm9vdEVsZW1lbnQub2ZmKCdtb3VzZW91dC5hbnRlbm5hJyk7XG4gICAgICAgICAgICAkcm9vdEVsZW1lbnQub2ZmKCdtb3VzZW92ZXIuYW50ZW5uYScpO1xuICAgICAgICB9KTtcbiAgICAkKGRvY3VtZW50KS5vbignY2xpY2suYW50ZW5uYScsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGlmICgkKGV2ZW50LnRhcmdldCkuY2xvc2VzdChTRUxFQ1RPUl9SRUFDVElPTlNfV0lER0VUKS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIGNsb3NlQWxsV2luZG93cygpO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgdmFyIHRhcExpc3RlbmVyID0gVG91Y2hTdXBwb3J0LnNldHVwVGFwKGRvY3VtZW50LCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBpZiAoJChldmVudC50YXJnZXQpLmNsb3Nlc3QoU0VMRUNUT1JfUkVBQ1RJT05TX1dJREdFVCkubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICBjbG9zZUFsbFdpbmRvd3MoKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgdmFyIGNsb3NlVGltZXI7XG5cbiAgICBmdW5jdGlvbiBkZWxheWVkQ2xvc2VXaW5kb3coKSB7XG4gICAgICAgIGNsb3NlVGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY2xvc2VUaW1lciA9IG51bGw7XG4gICAgICAgICAgICBjbG9zZUFsbFdpbmRvd3MoKTtcbiAgICAgICAgfSwgNTAwKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBrZWVwV2luZG93T3BlbigpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KGNsb3NlVGltZXIpO1xuICAgIH1cblxuICAgIHJhY3RpdmUub24oJ2ludGVybmFsQ2xvc2VXaW5kb3cnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gQ2xvc2VzIG9uZSBwYXJ0aWN1bGFyIHJlYWN0aW9uIHdpbmRvdy4gVGhpcyBmdW5jdGlvbiBzaG91bGQgb25seSBiZSBjYWxsZWQgZnJvbSBjbG9zZUFsbFdpbmRvd3MsIHdoaWNoIGFsc29cbiAgICAgICAgLy8gY2xlYW5zIHVwIHRoZSBoYW5kbGVzIHdlIG1haW50YWluIHRvIGFsbCB3aW5kb3dzLlxuICAgICAgICBjbGVhclRpbWVvdXQoY2xvc2VUaW1lcik7XG5cbiAgICAgICAgJHJvb3RFbGVtZW50LnN0b3AodHJ1ZSwgdHJ1ZSkuZmFkZU91dCgnZmFzdCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgJHJvb3RFbGVtZW50LmNzcygnZGlzcGxheScsICcnKTsgLy8gQ2xlYXIgdGhlIGRpc3BsYXk6bm9uZSB0aGF0IGZhZGVPdXQgcHV0cyBvbiB0aGUgZWxlbWVudFxuICAgICAgICAgICAgJHJvb3RFbGVtZW50LnJlbW92ZUNsYXNzKCdhbnRlbm5hLXJlYWN0aW9ucy1vcGVuJyk7XG5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGFnZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBwYWdlc1tpXS50ZWFyZG93bigpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmFjdGl2ZS50ZWFyZG93bigpO1xuICAgICAgICB9KTtcbiAgICAgICAgUmFuZ2UuY2xlYXJIaWdobGlnaHRzKCk7XG4gICAgICAgICRyb290RWxlbWVudC5vZmYoJy5hbnRlbm5hJyk7IC8vIFVuYmluZCBhbGwgb2YgdGhlIGhhbmRsZXJzIGluIG91ciBuYW1lc3BhY2VcbiAgICAgICAgJChkb2N1bWVudCkub2ZmKCdjbGljay5hbnRlbm5hJyk7XG4gICAgICAgIHRhcExpc3RlbmVyLnRlYXJkb3duKCk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGNsb3NlQWxsV2luZG93cygpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG9wZW5JbnN0YW5jZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgb3Blbkluc3RhbmNlc1tpXS5maXJlKCdpbnRlcm5hbENsb3NlV2luZG93Jyk7XG4gICAgfVxuICAgIG9wZW5JbnN0YW5jZXMgPSBbXTtcbn1cblxuZnVuY3Rpb24gaXNPcGVuV2luZG93KCkge1xuICAgIHJldHVybiBvcGVuSW5zdGFuY2VzLmxlbmd0aCA+IDA7XG59XG5cbi8vIFByZXZlbnQgc2Nyb2xsaW5nIG9mIHRoZSBkb2N1bWVudCBhZnRlciB3ZSBzY3JvbGwgdG8gdGhlIHRvcC9ib3R0b20gb2YgdGhlIHJlYWN0aW9ucyB3aW5kb3dcbi8vIENvZGUgY29waWVkIGZyb206IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvNTgwMjQ2Ny9wcmV2ZW50LXNjcm9sbGluZy1vZi1wYXJlbnQtZWxlbWVudFxuLy8gVE9ETzogZG9lcyB0aGlzIHdvcmsgb24gbW9iaWxlP1xuZnVuY3Rpb24gcHJldmVudEV4dHJhU2Nyb2xsKCRyb290RWxlbWVudCkge1xuICAgICRyb290RWxlbWVudC5vbignRE9NTW91c2VTY3JvbGwuYW50ZW5uYSBtb3VzZXdoZWVsLmFudGVubmEnLCAnLmFudGVubmEtYm9keScsIGZ1bmN0aW9uKGV2KSB7XG4gICAgICAgIHZhciAkdGhpcyA9ICQodGhpcyksXG4gICAgICAgICAgICBzY3JvbGxUb3AgPSB0aGlzLnNjcm9sbFRvcCxcbiAgICAgICAgICAgIHNjcm9sbEhlaWdodCA9IHRoaXMuc2Nyb2xsSGVpZ2h0LFxuICAgICAgICAgICAgaGVpZ2h0ID0gJHRoaXMuaGVpZ2h0KCksXG4gICAgICAgICAgICBkZWx0YSA9IChldi50eXBlID09ICdET01Nb3VzZVNjcm9sbCcgP1xuICAgICAgICAgICAgICAgIGV2Lm9yaWdpbmFsRXZlbnQuZGV0YWlsICogLTQwIDpcbiAgICAgICAgICAgICAgICBldi5vcmlnaW5hbEV2ZW50LndoZWVsRGVsdGEpLFxuICAgICAgICAgICAgdXAgPSBkZWx0YSA+IDA7XG5cbiAgICAgICAgaWYgKHNjcm9sbEhlaWdodCA8PSBoZWlnaHQpIHtcbiAgICAgICAgICAgIC8vIFRoaXMgaXMgYW4gYWRkaXRpb24gdG8gdGhlIFN0YWNrT3ZlcmZsb3cgY29kZSwgdG8gbWFrZSBzdXJlIHRoZSBwYWdlIHNjcm9sbHMgYXMgdXN1YWwgaWYgdGhlIHdpbmRvd1xuICAgICAgICAgICAgLy8gY29udGVudCBkb2Vzbid0IHNjcm9sbC5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBwcmV2ZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBldi5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBldi5yZXR1cm5WYWx1ZSA9IGZhbHNlO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9O1xuXG4gICAgICAgIGlmICghdXAgJiYgLWRlbHRhID4gc2Nyb2xsSGVpZ2h0IC0gaGVpZ2h0IC0gc2Nyb2xsVG9wKSB7XG4gICAgICAgICAgICAvLyBTY3JvbGxpbmcgZG93biwgYnV0IHRoaXMgd2lsbCB0YWtlIHVzIHBhc3QgdGhlIGJvdHRvbS5cbiAgICAgICAgICAgICR0aGlzLnNjcm9sbFRvcChzY3JvbGxIZWlnaHQpO1xuICAgICAgICAgICAgcmV0dXJuIHByZXZlbnQoKTtcbiAgICAgICAgfSBlbHNlIGlmICh1cCAmJiBkZWx0YSA+IHNjcm9sbFRvcCkge1xuICAgICAgICAgICAgLy8gU2Nyb2xsaW5nIHVwLCBidXQgdGhpcyB3aWxsIHRha2UgdXMgcGFzdCB0aGUgdG9wLlxuICAgICAgICAgICAgJHRoaXMuc2Nyb2xsVG9wKDApO1xuICAgICAgICAgICAgcmV0dXJuIHByZXZlbnQoKTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgb3Blbjogb3BlblJlYWN0aW9uc1dpZGdldCxcbiAgICBpc09wZW46IGlzT3BlbldpbmRvdyxcbiAgICBQQUdFX1JFQUNUSU9OUzogUEFHRV9SRUFDVElPTlMsXG4gICAgUEFHRV9ERUZBVUxUUzogUEFHRV9ERUZBVUxUUyxcbiAgICBQQUdFX0FVVE86IFBBR0VfQVVUTyxcbiAgICBzZWxlY3RvcjogU0VMRUNUT1JfUkVBQ1RJT05TX1dJREdFVCxcbiAgICB0ZWFyZG93bjogY2xvc2VBbGxXaW5kb3dzXG59OyIsInZhciBHcm91cFNldHRpbmdzID0gcmVxdWlyZSgnLi9ncm91cC1zZXR0aW5ncycpO1xudmFyIEhhc2hlZEVsZW1lbnRzID0gcmVxdWlyZSgnLi9oYXNoZWQtZWxlbWVudHMnKTtcbnZhciBQYWdlRGF0YSA9IHJlcXVpcmUoJy4vcGFnZS1kYXRhJyk7XG52YXIgUGFnZURhdGFMb2FkZXIgPSByZXF1aXJlKCcuL3BhZ2UtZGF0YS1sb2FkZXInKTtcbnZhciBQYWdlU2Nhbm5lciA9IHJlcXVpcmUoJy4vcGFnZS1zY2FubmVyJyk7XG52YXIgUG9wdXBXaWRnZXQgPSByZXF1aXJlKCcuL3BvcHVwLXdpZGdldCcpO1xudmFyIFJlYWN0aW9uc1dpZGdldCA9IHJlcXVpcmUoJy4vcmVhY3Rpb25zLXdpZGdldCcpO1xuXG52YXIgTXV0YXRpb25PYnNlcnZlciA9IHJlcXVpcmUoJy4vdXRpbHMvbXV0YXRpb24tb2JzZXJ2ZXInKTtcblxuZnVuY3Rpb24gcmVpbml0aWFsaXplQWxsKCkge1xuICAgIHZhciBncm91cFNldHRpbmdzID0gR3JvdXBTZXR0aW5ncy5nZXQoKTtcbiAgICBpZiAoZ3JvdXBTZXR0aW5ncykge1xuICAgICAgICByZWluaXRpYWxpemUoZ3JvdXBTZXR0aW5ncyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5sb2coJ0FudGVubmEgY2Fubm90IGJlIHJlaW5pdGlhbGl6ZWQuIEdyb3VwIHNldHRpbmdzIGFyZSBub3QgbG9hZGVkLicpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gcmVpbml0aWFsaXplKGdyb3VwU2V0dGluZ3MpIHtcbiAgICBSZWFjdGlvbnNXaWRnZXQudGVhcmRvd24oKTtcbiAgICBQb3B1cFdpZGdldC50ZWFyZG93bigpO1xuICAgIFBhZ2VTY2FubmVyLnRlYXJkb3duKCk7XG4gICAgUGFnZURhdGEudGVhcmRvd24oKTtcbiAgICBIYXNoZWRFbGVtZW50cy50ZWFyZG93bigpO1xuICAgIE11dGF0aW9uT2JzZXJ2ZXIudGVhcmRvd24oKTtcblxuICAgIFBhZ2VEYXRhTG9hZGVyLmxvYWQoZ3JvdXBTZXR0aW5ncyk7XG4gICAgUGFnZVNjYW5uZXIuc2Nhbihncm91cFNldHRpbmdzLCByZWluaXRpYWxpemUpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICByZWluaXRpYWxpemU6IHJlaW5pdGlhbGl6ZSxcbiAgICByZWluaXRpYWxpemVBbGw6IHJlaW5pdGlhbGl6ZUFsbCxcbn07IiwidmFyIFJhY3RpdmVQcm92aWRlciA9IHJlcXVpcmUoJy4vdXRpbHMvcmFjdGl2ZS1wcm92aWRlcicpO1xudmFyIFJhbmd5UHJvdmlkZXIgPSByZXF1aXJlKCcuL3V0aWxzL3Jhbmd5LXByb3ZpZGVyJyk7XG52YXIgSlF1ZXJ5UHJvdmlkZXIgPSByZXF1aXJlKCcuL3V0aWxzL2pxdWVyeS1wcm92aWRlcicpO1xudmFyIEFwcE1vZGUgPSByZXF1aXJlKCcuL3V0aWxzL2FwcC1tb2RlJyk7XG52YXIgVVJMcyA9IHJlcXVpcmUoJy4vdXRpbHMvdXJscycpO1xuXG52YXIgc2NyaXB0cyA9IFtcbiAgICB7c3JjOiAnLy9jZG5qcy5jbG91ZGZsYXJlLmNvbS9hamF4L2xpYnMvanF1ZXJ5LzIuMS40L2pxdWVyeS5taW4uanMnLCBjYWxsYmFjazogSlF1ZXJ5UHJvdmlkZXIubG9hZGVkfSxcbiAgICAvLyBUT0RPIG1pbmlmeSBvdXIgY29tcGlsZWQgUmFjdGl2ZSBhbmQgaG9zdCBpdCBvbiBhIENETlxuICAgIHtzcmM6IFVSTHMuYW1hem9uUzNVcmwoKSArICcvd2lkZ2V0LW5ldy9saWIvcmFjdGl2ZS5ydW50aW1lLTAuNy4zLm1pbi5qcycsIGNhbGxiYWNrOiBSYWN0aXZlUHJvdmlkZXIubG9hZGVkLCBhYm91dFRvTG9hZDogUmFjdGl2ZVByb3ZpZGVyLmFib3V0VG9Mb2FkfSxcbiAgICAvLyBUT0RPIG1pbmlmeSBvdXIgY29tcGlsZWQgUmFuZHkgYW5kIGhvc3QgaXQgb24gYSBDRE5cbiAgICB7c3JjOiBVUkxzLmFtYXpvblMzVXJsKCkgKyAnL3dpZGdldC1uZXcvbGliL3Jhbmd5LmNvbXBpbGVkLTEuMy4wLm1pbi5qcycsIGNhbGxiYWNrOiBSYW5neVByb3ZpZGVyLmxvYWRlZCwgYWJvdXRUb0xvYWQ6IFJhbmd5UHJvdmlkZXIuYWJvdXRUb0xvYWR9XG5dO1xuaWYgKEFwcE1vZGUub2ZmbGluZSkge1xuICAgIC8vIFVzZSB0aGUgb2ZmbGluZSB2ZXJzaW9ucyBvZiB0aGUgbGlicmFyaWVzIGZvciBkZXZlbG9wbWVudC5cbiAgICBzY3JpcHRzID0gW1xuICAgICAgICB7c3JjOiBVUkxzLmFwcFNlcnZlclVybCgpICsgJy9zdGF0aWMvanMvY2RuL2pxdWVyeS8yLjEuNC9qcXVlcnkuanMnLCBjYWxsYmFjazogSlF1ZXJ5UHJvdmlkZXIubG9hZGVkfSxcbiAgICAgICAge3NyYzogVVJMcy5hcHBTZXJ2ZXJVcmwoKSArICcvc3RhdGljL3dpZGdldC1uZXcvbGliL3JhY3RpdmUucnVudGltZS0wLjcuMy5qcycsIGNhbGxiYWNrOiBSYWN0aXZlUHJvdmlkZXIubG9hZGVkLCBhYm91dFRvTG9hZDogUmFjdGl2ZVByb3ZpZGVyLmFib3V0VG9Mb2FkfSxcbiAgICAgICAge3NyYzogVVJMcy5hcHBTZXJ2ZXJVcmwoKSArICcvc3RhdGljL3dpZGdldC1uZXcvbGliL3Jhbmd5LmNvbXBpbGVkLTEuMy4wLmpzJywgY2FsbGJhY2s6IFJhbmd5UHJvdmlkZXIubG9hZGVkLCBhYm91dFRvTG9hZDogUmFuZ3lQcm92aWRlci5hYm91dFRvTG9hZH1cbiAgICBdO1xufVxuXG5mdW5jdGlvbiBsb2FkQWxsU2NyaXB0cyhsb2FkZWRDYWxsYmFjaykge1xuICAgIGxvYWRTY3JpcHRzKHNjcmlwdHMsIGxvYWRlZENhbGxiYWNrKTtcbn1cblxuZnVuY3Rpb24gbG9hZFNjcmlwdHMoc2NyaXB0cywgbG9hZGVkQ2FsbGJhY2spIHtcbiAgICB2YXIgbG9hZGluZ0NvdW50ID0gc2NyaXB0cy5sZW5ndGg7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzY3JpcHRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBzY3JpcHQgPSBzY3JpcHRzW2ldO1xuICAgICAgICBpZiAoc2NyaXB0LmFib3V0VG9Mb2FkKSB7IHNjcmlwdC5hYm91dFRvTG9hZCgpOyB9XG4gICAgICAgIGxvYWRTY3JpcHQoc2NyaXB0LnNyYywgZnVuY3Rpb24oc2NyaXB0Q2FsbGJhY2spIHtcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBpZiAoc2NyaXB0Q2FsbGJhY2spIHNjcmlwdENhbGxiYWNrKCk7XG4gICAgICAgICAgICAgICAgbG9hZGluZ0NvdW50ID0gbG9hZGluZ0NvdW50IC0gMTtcbiAgICAgICAgICAgICAgICBpZiAobG9hZGluZ0NvdW50ID09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxvYWRlZENhbGxiYWNrKSBsb2FkZWRDYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gKHNjcmlwdC5jYWxsYmFjaykpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gbG9hZFNjcmlwdChzcmMsIGNhbGxiYWNrKSB7XG4gICAgdmFyIGhlYWQgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaGVhZCcpWzBdO1xuICAgIGlmIChoZWFkKSB7XG4gICAgICAgIHZhciBzY3JpcHRUYWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKTtcbiAgICAgICAgc2NyaXB0VGFnLnNldEF0dHJpYnV0ZSgnc3JjJywgc3JjKTtcbiAgICAgICAgc2NyaXB0VGFnLnNldEF0dHJpYnV0ZSgndHlwZScsJ3RleHQvamF2YXNjcmlwdCcpO1xuXG4gICAgICAgIGlmIChzY3JpcHRUYWcucmVhZHlTdGF0ZSkgeyAvLyBJRSwgaW5jbC4gSUU5XG4gICAgICAgICAgICBzY3JpcHRUYWcub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNjcmlwdFRhZy5yZWFkeVN0YXRlID09IFwibG9hZGVkXCIgfHwgc2NyaXB0VGFnLnJlYWR5U3RhdGUgPT0gXCJjb21wbGV0ZVwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHNjcmlwdFRhZy5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICBpZiAoY2FsbGJhY2spIHsgY2FsbGJhY2soKTsgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzY3JpcHRUYWcub25sb2FkID0gZnVuY3Rpb24oKSB7IC8vIE90aGVyIGJyb3dzZXJzXG4gICAgICAgICAgICAgICAgaWYgKGNhbGxiYWNrKSB7IGNhbGxiYWNrKCk7IH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICBoZWFkLmFwcGVuZENoaWxkKHNjcmlwdFRhZyk7XG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgbG9hZDogbG9hZEFsbFNjcmlwdHNcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgQnJvd3Nlck1ldHJpY3MgPSByZXF1aXJlKCcuL3V0aWxzL2Jyb3dzZXItbWV0cmljcycpO1xudmFyIFJhY3RpdmU7IHJlcXVpcmUoJy4vdXRpbHMvcmFjdGl2ZS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihsb2FkZWRSYWN0aXZlKSB7IFJhY3RpdmUgPSBsb2FkZWRSYWN0aXZlO30pO1xudmFyIFRvdWNoU3VwcG9ydCA9IHJlcXVpcmUoJy4vdXRpbHMvdG91Y2gtc3VwcG9ydCcpO1xuXG52YXIgUmVhY3Rpb25zV2lkZ2V0ID0gcmVxdWlyZSgnLi9yZWFjdGlvbnMtd2lkZ2V0Jyk7XG52YXIgU1ZHcyA9IHJlcXVpcmUoJy4vc3ZncycpO1xuXG5mdW5jdGlvbiBjcmVhdGVTdW1tYXJ5V2lkZ2V0KGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBkZWZhdWx0UmVhY3Rpb25zLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIHJhY3RpdmUgPSBSYWN0aXZlKHtcbiAgICAgICAgZWw6ICQoJzxkaXY+JyksIC8vIHRoZSByZWFsIHJvb3Qgbm9kZSBpcyBpbiB0aGUgdGVtcGxhdGUuIGl0J3MgZXh0cmFjdGVkIGFmdGVyIHRoZSB0ZW1wbGF0ZSBpcyByZW5kZXJlZCBpbnRvIHRoaXMgZHVtbXkgZWxlbWVudFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICBwYWdlRGF0YTogcGFnZURhdGEsXG4gICAgICAgICAgICBpc0V4cGFuZGVkU3VtbWFyeTogc2hvdWxkVXNlRXhwYW5kZWRTdW1tYXJ5KGdyb3VwU2V0dGluZ3MpLFxuICAgICAgICAgICAgY29tcHV0ZUV4cGFuZGVkUmVhY3Rpb25zOiBjb21wdXRlRXhwYW5kZWRSZWFjdGlvbnMoZ3JvdXBTZXR0aW5ncylcbiAgICAgICAgfSxcbiAgICAgICAgbWFnaWM6IHRydWUsXG4gICAgICAgIHRlbXBsYXRlOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvc3VtbWFyeS13aWRnZXQuaGJzLmh0bWwnKSxcbiAgICAgICAgcGFydGlhbHM6IHtcbiAgICAgICAgICAgIGxvZ286IFNWR3MubG9nb1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgdmFyICRyb290RWxlbWVudCA9ICQocm9vdEVsZW1lbnQocmFjdGl2ZSkpO1xuICAgICRyb290RWxlbWVudC5vbignbW91c2VlbnRlcicsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgb3BlblJlYWN0aW9uc1dpbmRvdyhjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgZGVmYXVsdFJlYWN0aW9ucywgZ3JvdXBTZXR0aW5ncywgcmFjdGl2ZSk7XG4gICAgfSk7XG4gICAgVG91Y2hTdXBwb3J0LnNldHVwVGFwKCRyb290RWxlbWVudC5nZXQoMCksIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGlmICghUmVhY3Rpb25zV2lkZ2V0LmlzT3BlbigpKSB7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICBvcGVuUmVhY3Rpb25zV2luZG93KGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBkZWZhdWx0UmVhY3Rpb25zLCBncm91cFNldHRpbmdzLCByYWN0aXZlKTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiB7XG4gICAgICAgIGVsZW1lbnQ6ICRyb290RWxlbWVudCxcbiAgICAgICAgdGVhcmRvd246IGZ1bmN0aW9uKCkgeyByYWN0aXZlLnRlYXJkb3duKCk7IH1cbiAgICB9O1xufVxuXG5mdW5jdGlvbiByb290RWxlbWVudChyYWN0aXZlKSB7XG4gICAgcmV0dXJuIHJhY3RpdmUuZmluZCgnLmFudGVubmEtc3VtbWFyeS13aWRnZXQnKTtcbn1cblxuZnVuY3Rpb24gb3BlblJlYWN0aW9uc1dpbmRvdyhjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgZGVmYXVsdFJlYWN0aW9ucywgZ3JvdXBTZXR0aW5ncywgcmFjdGl2ZSkge1xuICAgIHZhciByZWFjdGlvbnNXaWRnZXRPcHRpb25zID0ge1xuICAgICAgICBpc1N1bW1hcnk6IHRydWUsXG4gICAgICAgIHJlYWN0aW9uc0RhdGE6IHBhZ2VEYXRhLnN1bW1hcnlSZWFjdGlvbnMsXG4gICAgICAgIGNvbnRhaW5lckRhdGE6IGNvbnRhaW5lckRhdGEsXG4gICAgICAgIGRlZmF1bHRSZWFjdGlvbnM6IGRlZmF1bHRSZWFjdGlvbnMsXG4gICAgICAgIHBhZ2VEYXRhOiBwYWdlRGF0YSxcbiAgICAgICAgZ3JvdXBTZXR0aW5nczogZ3JvdXBTZXR0aW5ncyxcbiAgICAgICAgY29udGVudERhdGE6IHsgdHlwZTogJ3BhZ2UnLCBib2R5OiAnJyB9XG4gICAgfTtcbiAgICBSZWFjdGlvbnNXaWRnZXQub3BlbihyZWFjdGlvbnNXaWRnZXRPcHRpb25zLCByb290RWxlbWVudChyYWN0aXZlKSk7XG59XG5cbmZ1bmN0aW9uIHNob3VsZFVzZUV4cGFuZGVkU3VtbWFyeShncm91cFNldHRpbmdzKSB7XG4gICAgcmV0dXJuIGdyb3VwU2V0dGluZ3MuaXNFeHBhbmRlZE1vYmlsZVN1bW1hcnkoKSAmJiBCcm93c2VyTWV0cmljcy5pc01vYmlsZSgpO1xufVxuXG5mdW5jdGlvbiBjb21wdXRlRXhwYW5kZWRSZWFjdGlvbnMoZ3JvdXBTZXR0aW5ncykge1xuICAgIHJldHVybiBmdW5jdGlvbihyZWFjdGlvbnNEYXRhKSB7XG4gICAgICAgIHZhciBkZWZhdWx0UmVhY3Rpb25zID0gZ3JvdXBTZXR0aW5ncy5kZWZhdWx0UmVhY3Rpb25zKCk7XG4gICAgICAgIHZhciBtYXggPSAyO1xuICAgICAgICB2YXIgZXhwYW5kZWRSZWFjdGlvbnMgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZWFjdGlvbnNEYXRhLmxlbmd0aCAmJiBleHBhbmRlZFJlYWN0aW9ucy5sZW5ndGggPCBtYXg7IGkrKykge1xuICAgICAgICAgICAgdmFyIHJlYWN0aW9uRGF0YSA9IHJlYWN0aW9uc0RhdGFbaV07XG4gICAgICAgICAgICBpZiAoaXNEZWZhdWx0UmVhY3Rpb24ocmVhY3Rpb25EYXRhLCBkZWZhdWx0UmVhY3Rpb25zKSkge1xuICAgICAgICAgICAgICAgIGV4cGFuZGVkUmVhY3Rpb25zLnB1c2gocmVhY3Rpb25EYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZXhwYW5kZWRSZWFjdGlvbnM7XG4gICAgfTtcbn1cblxuZnVuY3Rpb24gaXNEZWZhdWx0UmVhY3Rpb24ocmVhY3Rpb25EYXRhLCBkZWZhdWx0UmVhY3Rpb25zKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkZWZhdWx0UmVhY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChkZWZhdWx0UmVhY3Rpb25zW2ldLnRleHQgPT09IHJlYWN0aW9uRGF0YS50ZXh0KSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGU6IGNyZWF0ZVN1bW1hcnlXaWRnZXRcbn07IiwidmFyIFJhY3RpdmU7IHJlcXVpcmUoJy4vdXRpbHMvcmFjdGl2ZS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihsb2FkZWRSYWN0aXZlKSB7IFJhY3RpdmUgPSBsb2FkZWRSYWN0aXZlO30pO1xuXG4vLyBBYm91dCBob3cgd2UgaGFuZGxlIGljb25zOiBXZSBpbnNlcnQgYSBzaW5nbGUgU1ZHIGVsZW1lbnQgYXQgdGhlIHRvcCBvZiB0aGUgYm9keSBlbGVtZW50IHdoaWNoIGRlZmluZXMgYWxsIG9mIHRoZVxuLy8gaWNvbnMgd2UgbmVlZC4gVGhlbiBhbGwgaWNvbnMgdXNlZCBieSB0aGUgYXBwbGljYXRpb25zIGFyZSByZW5kZXJlZCB3aXRoIHZlcnkgbGlnaHR3ZWlnaHQgU1ZHIGVsZW1lbnRzIHRoYXQgc2ltcGx5XG4vLyBwb2ludCB0byB0aGUgYXBwcm9wcmlhdGUgaWNvbiBieSByZWZlcmVuY2UuXG5cbi8vIFRPRE86IGxvb2sgaW50byB1c2luZyBhIHNpbmdsZSB0ZW1wbGF0ZSBmb3IgdGhlIFwidXNlXCIgU1ZHcy4gQ2FuIHdlIGluc3RhbnRpYXRlIGEgcGFydGlhbCB3aXRoIGEgZHluYW1pYyBjb250ZXh0P1xudmFyIHRlbXBsYXRlcyA9IHtcbiAgICBsb2dvOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvc3ZnLWxvZ28uaGJzLmh0bWwnKSxcbiAgICAvLyBUaGUgXCJzZWxlY3RhYmxlXCIgbG9nbyBkZWZpbmVzIGFuIGlubGluZSAncGF0aCcgcmF0aGVyIHRoYW4gYSAndXNlJyByZWZlcmVuY2UsIGFzIGEgd29ya2Fyb3VuZCBmb3IgYSBGaXJlZm94IHRleHQgc2VsZWN0aW9uIGJ1Zy5cbiAgICBsb2dvU2VsZWN0YWJsZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL3N2Zy1sb2dvLXNlbGVjdGFibGUuaGJzLmh0bWwnKSxcbiAgICBjb21tZW50czogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL3N2Zy1jb21tZW50cy5oYnMuaHRtbCcpLFxuICAgIGxvY2F0aW9uOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvc3ZnLWxvY2F0aW9uLmhicy5odG1sJyksXG4gICAgZmFjZWJvb2s6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9zdmctZmFjZWJvb2suaGJzLmh0bWwnKSxcbiAgICB0d2l0dGVyOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvc3ZnLXR3aXR0ZXIuaGJzLmh0bWwnKSxcbiAgICBsZWZ0OiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvc3ZnLWxlZnQuaGJzLmh0bWwnKSxcbiAgICBmaWxtOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvc3ZnLWZpbG0uaGJzLmh0bWwnKVxufTtcblxudmFyIGlzU2V0dXAgPSBmYWxzZTtcblxuZnVuY3Rpb24gZW5zdXJlU2V0dXAoKSB7XG4gICAgaWYgKCFpc1NldHVwKSB7XG4gICAgICAgIHZhciBkdW1teSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBSYWN0aXZlKHtcbiAgICAgICAgICAgIGVsOiBkdW1teSxcbiAgICAgICAgICAgIHRlbXBsYXRlOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvc3Zncy5oYnMuaHRtbCcpXG4gICAgICAgIH0pO1xuICAgICAgICAvLyBTYWZhcmkgb24gaU9TIHJlcXVpcmVzIHRoZSBTVkcgdGhhdCBkZWZpbmVzIHRoZSBpY29ucyBhcHBlYXIgYmVmb3JlIHRoZSBTVkdzIHRoYXQgcmVmZXJlbmNlIGl0LlxuICAgICAgICBkb2N1bWVudC5ib2R5Lmluc2VydEJlZm9yZShkdW1teS5jaGlsZHJlblswXSwgZG9jdW1lbnQuYm9keS5maXJzdENoaWxkKTtcbiAgICAgICAgaXNTZXR1cCA9IHRydWU7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBnZXRTVkcodGVtcGxhdGUpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgIGVuc3VyZVNldHVwKCk7XG4gICAgICAgIHJldHVybiB0ZW1wbGF0ZTtcbiAgICB9XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBsb2dvOiBnZXRTVkcodGVtcGxhdGVzLmxvZ28pLFxuICAgIGxvZ29TZWxlY3RhYmxlOiBnZXRTVkcodGVtcGxhdGVzLmxvZ29TZWxlY3RhYmxlKSxcbiAgICBjb21tZW50czogZ2V0U1ZHKHRlbXBsYXRlcy5jb21tZW50cyksXG4gICAgbG9jYXRpb246IGdldFNWRyh0ZW1wbGF0ZXMubG9jYXRpb24pLFxuICAgIGZhY2Vib29rOiBnZXRTVkcodGVtcGxhdGVzLmZhY2Vib29rKSxcbiAgICB0d2l0dGVyOiBnZXRTVkcodGVtcGxhdGVzLnR3aXR0ZXIpLFxuICAgIGxlZnQ6IGdldFNWRyh0ZW1wbGF0ZXMubGVmdCksXG4gICAgZmlsbTogZ2V0U1ZHKHRlbXBsYXRlcy5maWxtKVxufTsiLCJ2YXIgUmFjdGl2ZTsgcmVxdWlyZSgnLi91dGlscy9yYWN0aXZlLXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGxvYWRlZFJhY3RpdmUpIHsgUmFjdGl2ZSA9IGxvYWRlZFJhY3RpdmU7fSk7XG52YXIgQnJvd3Nlck1ldHJpY3MgPSByZXF1aXJlKCcuL3V0aWxzL2Jyb3dzZXItbWV0cmljcycpO1xudmFyIFNWR3MgPSByZXF1aXJlKCcuL3N2Z3MnKTtcbnZhciBXaWRnZXRCdWNrZXQgPSByZXF1aXJlKCcuL3V0aWxzL3dpZGdldC1idWNrZXQnKTtcblxuZnVuY3Rpb24gc2V0dXBIZWxwZXIoZ3JvdXBTZXR0aW5ncykge1xuICAgIGlmICghaXNEaXNtaXNzZWQoKSAmJiAhZ3JvdXBTZXR0aW5ncy5pc0hpZGVUYXBIZWxwZXIoKSAmJiBCcm93c2VyTWV0cmljcy5zdXBwb3J0c1RvdWNoKCkpIHtcbiAgICAgICAgdmFyIHJhY3RpdmUgPSBSYWN0aXZlKHtcbiAgICAgICAgICAgIGVsOiBXaWRnZXRCdWNrZXQuZ2V0KCksXG4gICAgICAgICAgICBhcHBlbmQ6IHRydWUsXG4gICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgcG9zaXRpb25Ub3A6IGdyb3VwU2V0dGluZ3MudGFwSGVscGVyUG9zaXRpb24oKSA9PT0gJ3RvcCdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL3RhcC1oZWxwZXIuaGJzLmh0bWwnKSxcbiAgICAgICAgICAgIHBhcnRpYWxzOiB7XG4gICAgICAgICAgICAgICAgbG9nbzogU1ZHcy5sb2dvXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByYWN0aXZlLm9uKCdkaXNtaXNzJywgZGlzbWlzcyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZGlzbWlzcygpIHtcbiAgICAgICAgcmFjdGl2ZS50ZWFyZG93bigpO1xuICAgICAgICBzZXREaXNtaXNzZWQodHJ1ZSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBzZXREaXNtaXNzZWQoZGlzbWlzc2VkKSB7XG4gICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2hpZGVEb3VibGVUYXBNZXNzYWdlJywgZGlzbWlzc2VkKTtcbn1cblxuZnVuY3Rpb24gaXNEaXNtaXNzZWQoKSB7XG4gICAgcmV0dXJuIGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdoaWRlRG91YmxlVGFwTWVzc2FnZScpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBzZXR1cEhlbHBlcjogc2V0dXBIZWxwZXJcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgUmFjdGl2ZTsgcmVxdWlyZSgnLi91dGlscy9yYWN0aXZlLXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGxvYWRlZFJhY3RpdmUpIHsgUmFjdGl2ZSA9IGxvYWRlZFJhY3RpdmU7fSk7XG52YXIgUmFuZ2UgPSByZXF1aXJlKCcuL3V0aWxzL3JhbmdlJyk7XG52YXIgVG91Y2hTdXBwb3J0ID0gcmVxdWlyZSgnLi91dGlscy90b3VjaC1zdXBwb3J0Jyk7XG5cbnZhciBQb3B1cFdpZGdldCA9IHJlcXVpcmUoJy4vcG9wdXAtd2lkZ2V0Jyk7XG52YXIgUmVhY3Rpb25zV2lkZ2V0ID0gcmVxdWlyZSgnLi9yZWFjdGlvbnMtd2lkZ2V0Jyk7XG52YXIgU1ZHcyA9IHJlcXVpcmUoJy4vc3ZncycpO1xuXG52YXIgQ0xBU1NfQUNUSVZFID0gJ2FudGVubmEtYWN0aXZlJztcblxuZnVuY3Rpb24gY3JlYXRlSW5kaWNhdG9yV2lkZ2V0KG9wdGlvbnMpIHtcbiAgICB2YXIgY29udGFpbmVyRGF0YSA9IG9wdGlvbnMuY29udGFpbmVyRGF0YTtcbiAgICB2YXIgJGNvbnRhaW5lckVsZW1lbnQgPSBvcHRpb25zLmNvbnRhaW5lckVsZW1lbnQ7XG4gICAgdmFyIHBhZ2VEYXRhID0gb3B0aW9ucy5wYWdlRGF0YTtcbiAgICB2YXIgZ3JvdXBTZXR0aW5ncyA9IG9wdGlvbnMuZ3JvdXBTZXR0aW5ncztcbiAgICB2YXIgZGVmYXVsdFJlYWN0aW9ucyA9IG9wdGlvbnMuZGVmYXVsdFJlYWN0aW9ucztcbiAgICB2YXIgY29vcmRzID0gb3B0aW9ucy5jb29yZHM7XG4gICAgdmFyIHJhY3RpdmUgPSBSYWN0aXZlKHtcbiAgICAgICAgZWw6ICQoJzxkaXY+JyksIC8vIHRoZSByZWFsIHJvb3Qgbm9kZSBpcyBpbiB0aGUgdGVtcGxhdGUuIGl0J3MgZXh0cmFjdGVkIGFmdGVyIHRoZSB0ZW1wbGF0ZSBpcyByZW5kZXJlZCBpbnRvIHRoaXMgZHVtbXkgZWxlbWVudFxuICAgICAgICBhcHBlbmQ6IHRydWUsXG4gICAgICAgIG1hZ2ljOiB0cnVlLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICBjb250YWluZXJEYXRhOiBjb250YWluZXJEYXRhLFxuICAgICAgICAgICAgZXh0cmFDbGFzc2VzOiBncm91cFNldHRpbmdzLmVuYWJsZVRleHRIZWxwZXIoKSA/IFwiXCIgOiBcImFudGVubmEtbm9oaW50XCJcbiAgICAgICAgfSxcbiAgICAgICAgdGVtcGxhdGU6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy90ZXh0LWluZGljYXRvci13aWRnZXQuaGJzLmh0bWwnKSxcbiAgICAgICAgcGFydGlhbHM6IHtcbiAgICAgICAgICAgIGxvZ286IFNWR3MubG9nb1NlbGVjdGFibGVcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgdmFyIHJlYWN0aW9uV2lkZ2V0T3B0aW9ucyA9IHtcbiAgICAgICAgcmVhY3Rpb25zRGF0YTogY29udGFpbmVyRGF0YS5yZWFjdGlvbnMsXG4gICAgICAgIGNvbnRhaW5lckRhdGE6IGNvbnRhaW5lckRhdGEsXG4gICAgICAgIGNvbnRhaW5lckVsZW1lbnQ6ICRjb250YWluZXJFbGVtZW50LFxuICAgICAgICBjb250ZW50RGF0YTogeyB0eXBlOiAndGV4dCcgfSxcbiAgICAgICAgZGVmYXVsdFJlYWN0aW9uczogZGVmYXVsdFJlYWN0aW9ucyxcbiAgICAgICAgcGFnZURhdGE6IHBhZ2VEYXRhLFxuICAgICAgICBncm91cFNldHRpbmdzOiBncm91cFNldHRpbmdzXG4gICAgfTtcblxuICAgIHZhciAkcm9vdEVsZW1lbnQgPSAkKHJvb3RFbGVtZW50KHJhY3RpdmUpKTtcbiAgICBpZiAoY29vcmRzKSB7XG4gICAgICAgICRyb290RWxlbWVudC5jc3Moe1xuICAgICAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXG4gICAgICAgICAgICB0b3A6IGNvb3Jkcy50b3AgLSAkcm9vdEVsZW1lbnQuaGVpZ2h0KCksXG4gICAgICAgICAgICBib3R0b206IGNvb3Jkcy5ib3R0b20sXG4gICAgICAgICAgICBsZWZ0OiBjb29yZHMubGVmdCxcbiAgICAgICAgICAgIHJpZ2h0OiBjb29yZHMucmlnaHQsXG4gICAgICAgICAgICAnei1pbmRleCc6IDEwMDAgLy8gVE9ETzogY29tcHV0ZSBhIHJlYWwgdmFsdWU/XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICB2YXIgaG92ZXJUaW1lb3V0O1xuICAgIHZhciB0YXBTdXBwb3J0ID0gVG91Y2hTdXBwb3J0LnNldHVwVGFwKCRyb290RWxlbWVudC5nZXQoMCksIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBvcGVuUmVhY3Rpb25zV2luZG93KHJlYWN0aW9uV2lkZ2V0T3B0aW9ucywgcmFjdGl2ZSk7XG4gICAgfSk7XG4gICAgJHJvb3RFbGVtZW50Lm9uKCdtb3VzZWVudGVyLmFudGVubmEnLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBpZiAoZXZlbnQuYnV0dG9ucyA+IDAgfHwgKGV2ZW50LmJ1dHRvbnMgPT0gdW5kZWZpbmVkICYmIGV2ZW50LndoaWNoID4gMCkpIHsgLy8gT24gU2FmYXJpLCBldmVudC5idXR0b25zIGlzIHVuZGVmaW5lZCBidXQgZXZlbnQud2hpY2ggZ2l2ZXMgYSBnb29kIHZhbHVlLiBldmVudC53aGljaCBpcyBiYWQgb24gRkZcbiAgICAgICAgICAgIC8vIERvbid0IHJlYWN0IGlmIHRoZSB1c2VyIGlzIGRyYWdnaW5nIG9yIHNlbGVjdGluZyB0ZXh0LlxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNsZWFyVGltZW91dChob3ZlclRpbWVvdXQpOyAvLyBvbmx5IG9uZSB0aW1lb3V0IGF0IGEgdGltZVxuICAgICAgICBob3ZlclRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKGNvbnRhaW5lckRhdGEucmVhY3Rpb25zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBvcGVuUmVhY3Rpb25zV2luZG93KHJlYWN0aW9uV2lkZ2V0T3B0aW9ucywgcmFjdGl2ZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhciAkaWNvbiA9ICQocm9vdEVsZW1lbnQocmFjdGl2ZSkpLmZpbmQoJy5hbnRlbm5hLWxvZ28nKTtcbiAgICAgICAgICAgICAgICB2YXIgb2Zmc2V0ID0gJGljb24ub2Zmc2V0KCk7XG4gICAgICAgICAgICAgICAgdmFyIGNvb3JkaW5hdGVzID0ge1xuICAgICAgICAgICAgICAgICAgICB0b3A6IG9mZnNldC50b3AgKyBNYXRoLmZsb29yKCRpY29uLmhlaWdodCgpIC8gMiksIC8vIFRPRE8gdGhpcyBudW1iZXIgaXMgYSBsaXR0bGUgb2ZmIGJlY2F1c2UgdGhlIGRpdiBkb2Vzbid0IHRpZ2h0bHkgd3JhcCB0aGUgaW5zZXJ0ZWQgZm9udCBjaGFyYWN0ZXJcbiAgICAgICAgICAgICAgICAgICAgbGVmdDogb2Zmc2V0LmxlZnQgKyBNYXRoLmZsb29yKCRpY29uLndpZHRoKCkgLyAyKVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgUG9wdXBXaWRnZXQuc2hvdyhjb29yZGluYXRlcywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIG9wZW5SZWFjdGlvbnNXaW5kb3cocmVhY3Rpb25XaWRnZXRPcHRpb25zLCByYWN0aXZlKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgMjAwKTtcbiAgICB9KTtcbiAgICAkcm9vdEVsZW1lbnQub24oJ21vdXNlbGVhdmUuYW50ZW5uYScsIGZ1bmN0aW9uKCkge1xuICAgICAgICBjbGVhclRpbWVvdXQoaG92ZXJUaW1lb3V0KTtcbiAgICB9KTtcbiAgICAkY29udGFpbmVyRWxlbWVudC5vbignbW91c2VlbnRlci5hbnRlbm5hJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICRyb290RWxlbWVudC5hZGRDbGFzcyhDTEFTU19BQ1RJVkUpO1xuICAgIH0pO1xuICAgICRjb250YWluZXJFbGVtZW50Lm9uKCdtb3VzZWxlYXZlLmFudGVubmEnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgJHJvb3RFbGVtZW50LnJlbW92ZUNsYXNzKENMQVNTX0FDVElWRSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZWxlbWVudDogJHJvb3RFbGVtZW50LFxuICAgICAgICB0ZWFyZG93bjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAkY29udGFpbmVyRWxlbWVudC5vZmYoJy5hbnRlbm5hJyk7XG4gICAgICAgICAgICByYWN0aXZlLnRlYXJkb3duKCk7XG4gICAgICAgICAgICB0YXBTdXBwb3J0LnRlYXJkb3duKCk7XG4gICAgICAgIH1cbiAgICB9O1xufVxuXG5mdW5jdGlvbiByb290RWxlbWVudChyYWN0aXZlKSB7XG4gICAgcmV0dXJuIHJhY3RpdmUuZmluZCgnLmFudGVubmEtdGV4dC1pbmRpY2F0b3Itd2lkZ2V0Jyk7XG59XG5cbmZ1bmN0aW9uIG9wZW5SZWFjdGlvbnNXaW5kb3cocmVhY3Rpb25PcHRpb25zLCByYWN0aXZlKSB7XG4gICAgUmVhY3Rpb25zV2lkZ2V0Lm9wZW4ocmVhY3Rpb25PcHRpb25zLCByb290RWxlbWVudChyYWN0aXZlKSk7XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGU6IGNyZWF0ZUluZGljYXRvcldpZGdldFxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi91dGlscy9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciBQb3B1cFdpZGdldCA9IHJlcXVpcmUoJy4vcG9wdXAtd2lkZ2V0Jyk7XG52YXIgUmFuZ2UgPSByZXF1aXJlKCcuL3V0aWxzL3JhbmdlJyk7XG52YXIgUmVhY3Rpb25zV2lkZ2V0ID0gcmVxdWlyZSgnLi9yZWFjdGlvbnMtd2lkZ2V0Jyk7XG52YXIgVG91Y2hTdXBwb3J0ID0gcmVxdWlyZSgnLi91dGlscy90b3VjaC1zdXBwb3J0Jyk7XG5cblxuZnVuY3Rpb24gY3JlYXRlUmVhY3RhYmxlVGV4dChvcHRpb25zKSB7XG4gICAgLy8gVE9ETzogaW1wb3NlIGFuIHVwcGVyIGxpbWl0IG9uIHRoZSBsZW5ndGggb2YgdGV4dCB0aGF0IGNhbiBiZSByZWFjdGVkIHRvPyAoYXBwbGllcyB0byB0aGUgaW5kaWNhdG9yLXdpZGdldCB0b28pXG4gICAgdmFyICRjb250YWluZXJFbGVtZW50ID0gb3B0aW9ucy5jb250YWluZXJFbGVtZW50O1xuICAgIHZhciBjb250YWluZXJEYXRhID0gb3B0aW9ucy5jb250YWluZXJEYXRhO1xuICAgIHZhciBleGNsdWRlTm9kZSA9IG9wdGlvbnMuZXhjbHVkZU5vZGU7XG4gICAgdmFyIHJlYWN0aW9uc1dpZGdldE9wdGlvbnMgPSB7XG4gICAgICAgIHJlYWN0aW9uc0RhdGE6IFtdLCAvLyBBbHdheXMgb3BlbiB3aXRoIHRoZSBkZWZhdWx0IHJlYWN0aW9uc1xuICAgICAgICBjb250YWluZXJEYXRhOiBjb250YWluZXJEYXRhLFxuICAgICAgICBjb250ZW50RGF0YTogeyB0eXBlOiAndGV4dCcgfSxcbiAgICAgICAgY29udGFpbmVyRWxlbWVudDogJGNvbnRhaW5lckVsZW1lbnQsXG4gICAgICAgIGRlZmF1bHRSZWFjdGlvbnM6IG9wdGlvbnMuZGVmYXVsdFJlYWN0aW9ucyxcbiAgICAgICAgcGFnZURhdGE6IG9wdGlvbnMucGFnZURhdGEsXG4gICAgICAgIGdyb3VwU2V0dGluZ3M6IG9wdGlvbnMuZ3JvdXBTZXR0aW5nc1xuICAgIH07XG5cbiAgICB2YXIgdGFwRXZlbnRzID0gc2V0dXBUYXBFdmVudHMoJGNvbnRhaW5lckVsZW1lbnQuZ2V0KDApLCByZWFjdGlvbnNXaWRnZXRPcHRpb25zKTtcbiAgICAkY29udGFpbmVyRWxlbWVudC5vbignbW91c2V1cC5hbnRlbm5hJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgaWYgKGNvbnRhaW5lckRhdGEubG9hZGVkKSB7XG4gICAgICAgICAgICB2YXIgbm9kZSA9ICRjb250YWluZXJFbGVtZW50LmdldCgwKTtcbiAgICAgICAgICAgIHZhciBwb2ludCA9IFJhbmdlLmdldFNlbGVjdGlvbkVuZFBvaW50KG5vZGUsIGV2ZW50LCBleGNsdWRlTm9kZSk7XG4gICAgICAgICAgICBpZiAocG9pbnQpIHtcbiAgICAgICAgICAgICAgICB2YXIgY29vcmRpbmF0ZXMgPSB7dG9wOiBwb2ludC55LCBsZWZ0OiBwb2ludC54fTtcbiAgICAgICAgICAgICAgICBQb3B1cFdpZGdldC5zaG93KGNvb3JkaW5hdGVzLCBncmFiU2VsZWN0aW9uQW5kT3Blbihub2RlLCBjb29yZGluYXRlcywgcmVhY3Rpb25zV2lkZ2V0T3B0aW9ucywgZXhjbHVkZU5vZGUpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiB7XG4gICAgICAgIHRlYXJkb3duOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHRhcEV2ZW50cy50ZWFyZG93bigpO1xuICAgICAgICAgICAgJGNvbnRhaW5lckVsZW1lbnQub2ZmKCcuYW50ZW5uYScpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBncmFiU2VsZWN0aW9uQW5kT3Blbihub2RlLCBjb29yZGluYXRlcywgcmVhY3Rpb25zV2lkZ2V0T3B0aW9ucywgZXhjbHVkZU5vZGUpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgIFJhbmdlLmdyYWJTZWxlY3Rpb24obm9kZSwgZnVuY3Rpb24odGV4dCwgbG9jYXRpb24pIHtcbiAgICAgICAgICAgIHJlYWN0aW9uc1dpZGdldE9wdGlvbnMuY29udGVudERhdGEubG9jYXRpb24gPSBsb2NhdGlvbjtcbiAgICAgICAgICAgIHJlYWN0aW9uc1dpZGdldE9wdGlvbnMuY29udGVudERhdGEuYm9keSA9IHRleHQ7XG4gICAgICAgICAgICBSZWFjdGlvbnNXaWRnZXQub3BlbihyZWFjdGlvbnNXaWRnZXRPcHRpb25zLCBjb29yZGluYXRlcyk7XG4gICAgICAgIH0sIGV4Y2x1ZGVOb2RlKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGdyYWJOb2RlQW5kT3Blbihub2RlLCByZWFjdGlvbnNXaWRnZXRPcHRpb25zLCBjb29yZHMpIHtcbiAgICBSYW5nZS5ncmFiTm9kZShub2RlLCBmdW5jdGlvbih0ZXh0LCBsb2NhdGlvbikge1xuICAgICAgICByZWFjdGlvbnNXaWRnZXRPcHRpb25zLmNvbnRlbnREYXRhLmxvY2F0aW9uID0gbG9jYXRpb247XG4gICAgICAgIHJlYWN0aW9uc1dpZGdldE9wdGlvbnMuY29udGVudERhdGEuYm9keSA9IHRleHQ7XG4gICAgICAgIFJlYWN0aW9uc1dpZGdldC5vcGVuKHJlYWN0aW9uc1dpZGdldE9wdGlvbnMsIGNvb3Jkcyk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIHNldHVwVGFwRXZlbnRzKGVsZW1lbnQsIHJlYWN0aW9uc1dpZGdldE9wdGlvbnMpIHtcbiAgICByZXR1cm4gVG91Y2hTdXBwb3J0LnNldHVwVGFwKGVsZW1lbnQsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGlmICghUmVhY3Rpb25zV2lkZ2V0LmlzT3BlbigpICYmICQoZXZlbnQudGFyZ2V0KS5jbG9zZXN0KCdhJykubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICB2YXIgdG91Y2ggPSBldmVudC5jaGFuZ2VkVG91Y2hlc1swXTtcbiAgICAgICAgICAgIHZhciBjb29yZHMgPSB7IHRvcDogdG91Y2gucGFnZVksIGxlZnQ6IHRvdWNoLnBhZ2VYIH07XG4gICAgICAgICAgICBncmFiTm9kZUFuZE9wZW4oZWxlbWVudCwgcmVhY3Rpb25zV2lkZ2V0T3B0aW9ucywgY29vcmRzKTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlUmVhY3RhYmxlVGV4dDogY3JlYXRlUmVhY3RhYmxlVGV4dFxufTsiLCIvLyBUT0RPOiBuZWVkcyBhIGJldHRlciBuYW1lIG9uY2UgdGhlIHNjb3BlIGlzIGNsZWFyXG5cbnZhciAkOyByZXF1aXJlKCcuL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIEFwcE1vZGUgPSByZXF1aXJlKCcuL2FwcC1tb2RlJyk7XG52YXIgVVJMcyA9IHJlcXVpcmUoJy4vdXJscycpO1xudmFyIFVzZXIgPSByZXF1aXJlKCcuL3VzZXInKTtcblxuXG5mdW5jdGlvbiBwb3N0TmV3UmVhY3Rpb24ocmVhY3Rpb25EYXRhLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgY29udGVudERhdGEsIHN1Y2Nlc3MsIGVycm9yKSB7XG4gICAgdmFyIGNvbnRlbnRCb2R5ID0gY29udGVudERhdGEuYm9keTtcbiAgICB2YXIgY29udGVudFR5cGUgPSBjb250ZW50RGF0YS50eXBlO1xuICAgIHZhciBjb250ZW50TG9jYXRpb24gPSBjb250ZW50RGF0YS5sb2NhdGlvbjtcbiAgICB2YXIgY29udGVudERpbWVuc2lvbnMgPSBjb250ZW50RGF0YS5kaW1lbnNpb25zO1xuICAgIFVzZXIuZmV0Y2hVc2VyKGZ1bmN0aW9uKHVzZXJJbmZvKSB7XG4gICAgICAgIC8vIFRPRE8gZXh0cmFjdCB0aGUgc2hhcGUgb2YgdGhpcyBkYXRhIGFuZCBwb3NzaWJseSB0aGUgd2hvbGUgQVBJIGNhbGxcbiAgICAgICAgdmFyIGRhdGEgPSB7XG4gICAgICAgICAgICB0YWc6IHtcbiAgICAgICAgICAgICAgICBib2R5OiByZWFjdGlvbkRhdGEudGV4dCxcbiAgICAgICAgICAgICAgICBpc19kZWZhdWx0OiByZWFjdGlvbkRhdGEuaXNEZWZhdWx0ICE9PSB1bmRlZmluZWQgJiYgcmVhY3Rpb25EYXRhLmlzRGVmYXVsdCAvLyBmYWxzZSB1bmxlc3Mgc3BlY2lmaWVkXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaGFzaDogY29udGFpbmVyRGF0YS5oYXNoLFxuICAgICAgICAgICAgdXNlcl9pZDogdXNlckluZm8udXNlcl9pZCxcbiAgICAgICAgICAgIGFudF90b2tlbjogdXNlckluZm8uYW50X3Rva2VuLFxuICAgICAgICAgICAgcGFnZV9pZDogcGFnZURhdGEucGFnZUlkLFxuICAgICAgICAgICAgZ3JvdXBfaWQ6IHBhZ2VEYXRhLmdyb3VwSWQsXG4gICAgICAgICAgICBjb250YWluZXJfa2luZDogY29udGVudFR5cGUsIC8vIE9uZSBvZiAncGFnZScsICd0ZXh0JywgJ21lZGlhJywgJ2ltZydcbiAgICAgICAgICAgIGNvbnRlbnRfbm9kZV9kYXRhOiB7XG4gICAgICAgICAgICAgICAgYm9keTogY29udGVudEJvZHksXG4gICAgICAgICAgICAgICAga2luZDogY29udGVudFR5cGUsXG4gICAgICAgICAgICAgICAgaXRlbV90eXBlOiAnJyAvLyBUT0RPOiBsb29rcyB1bnVzZWQgYnV0IFRhZ0hhbmRsZXIgYmxvd3MgdXAgd2l0aG91dCBpdC4gQ3VycmVudCBjbGllbnQgcGFzc2VzIGluIFwicGFnZVwiIGZvciBwYWdlIHJlYWN0aW9ucy5cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgaWYgKGNvbnRlbnRMb2NhdGlvbikge1xuICAgICAgICAgICAgZGF0YS5jb250ZW50X25vZGVfZGF0YS5sb2NhdGlvbiA9IGNvbnRlbnRMb2NhdGlvbjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY29udGVudERpbWVuc2lvbnMpIHtcbiAgICAgICAgICAgIGRhdGEuY29udGVudF9ub2RlX2RhdGEuaGVpZ2h0ID0gY29udGVudERpbWVuc2lvbnMuaGVpZ2h0O1xuICAgICAgICAgICAgZGF0YS5jb250ZW50X25vZGVfZGF0YS53aWR0aCA9IGNvbnRlbnREaW1lbnNpb25zLndpZHRoO1xuICAgICAgICB9XG4gICAgICAgIGlmIChyZWFjdGlvbkRhdGEuaWQpIHtcbiAgICAgICAgICAgIGRhdGEudGFnLmlkID0gcmVhY3Rpb25EYXRhLmlkOyAvLyBUT0RPIHRoZSBjdXJyZW50IGNsaWVudCBzZW5kcyBcIi0xMDFcIiBpZiB0aGVyZSdzIG5vIGlkLiBpcyB0aGlzIG5lY2Vzc2FyeT9cbiAgICAgICAgfVxuICAgICAgICBnZXRKU09OUChVUkxzLmNyZWF0ZVJlYWN0aW9uVXJsKCksIGRhdGEsIG5ld1JlYWN0aW9uU3VjY2Vzcyhjb250ZW50TG9jYXRpb24sIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBzdWNjZXNzKSwgZXJyb3IpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBwb3N0UGx1c09uZShyZWFjdGlvbkRhdGEsIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBzdWNjZXNzLCBlcnJvcikge1xuICAgIFVzZXIuZmV0Y2hVc2VyKGZ1bmN0aW9uKHVzZXJJbmZvKSB7XG4gICAgICAgIC8vIFRPRE8gZXh0cmFjdCB0aGUgc2hhcGUgb2YgdGhpcyBkYXRhIGFuZCBwb3NzaWJseSB0aGUgd2hvbGUgQVBJIGNhbGxcbiAgICAgICAgaWYgKCFyZWFjdGlvbkRhdGEuY29udGVudCkge1xuICAgICAgICAgICAgLy8gVGhpcyBpcyBhIHN1bW1hcnkgcmVhY3Rpb24uIFNlZSBpZiB3ZSBoYXZlIGFueSBjb250YWluZXIgZGF0YSB0aGF0IHdlIGNhbiBsaW5rIHRvIGl0LlxuICAgICAgICAgICAgdmFyIGNvbnRhaW5lclJlYWN0aW9ucyA9IGNvbnRhaW5lckRhdGEucmVhY3Rpb25zO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb250YWluZXJSZWFjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgY29udGFpbmVyUmVhY3Rpb24gPSBjb250YWluZXJSZWFjdGlvbnNbaV07XG4gICAgICAgICAgICAgICAgaWYgKGNvbnRhaW5lclJlYWN0aW9uLmlkID09PSByZWFjdGlvbkRhdGEuaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVhY3Rpb25EYXRhLnBhcmVudElEID0gY29udGFpbmVyUmVhY3Rpb24ucGFyZW50SUQ7XG4gICAgICAgICAgICAgICAgICAgIHJlYWN0aW9uRGF0YS5jb250ZW50ID0gY29udGFpbmVyUmVhY3Rpb24uY29udGVudDtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHZhciBkYXRhID0ge1xuICAgICAgICAgICAgdGFnOiB7XG4gICAgICAgICAgICAgICAgYm9keTogcmVhY3Rpb25EYXRhLnRleHQsXG4gICAgICAgICAgICAgICAgaWQ6IHJlYWN0aW9uRGF0YS5pZFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGhhc2g6IGNvbnRhaW5lckRhdGEuaGFzaCxcbiAgICAgICAgICAgIHVzZXJfaWQ6IHVzZXJJbmZvLnVzZXJfaWQsXG4gICAgICAgICAgICBhbnRfdG9rZW46IHVzZXJJbmZvLmFudF90b2tlbixcbiAgICAgICAgICAgIHBhZ2VfaWQ6IHBhZ2VEYXRhLnBhZ2VJZCxcbiAgICAgICAgICAgIGdyb3VwX2lkOiBwYWdlRGF0YS5ncm91cElkLFxuICAgICAgICAgICAgY29udGFpbmVyX2tpbmQ6IGNvbnRhaW5lckRhdGEudHlwZSwgLy8gJ3BhZ2UnLCAndGV4dCcsICdtZWRpYScsICdpbWcnXG4gICAgICAgICAgICBjb250ZW50X25vZGVfZGF0YToge1xuICAgICAgICAgICAgICAgIGJvZHk6ICcnLCAvLyBUT0RPOiBkbyB3ZSBuZWVkIHRoaXMgZm9yICsxcz8gbG9va3MgbGlrZSBvbmx5IHRoZSBpZCBmaWVsZCBpcyB1c2VkLCBpZiBvbmUgaXMgc2V0XG4gICAgICAgICAgICAgICAga2luZDogY29udGVudE5vZGVEYXRhS2luZChjb250YWluZXJEYXRhLnR5cGUpLFxuICAgICAgICAgICAgICAgIGl0ZW1fdHlwZTogJycgLy8gVE9ETzogbG9va3MgdW51c2VkIGJ1dCBUYWdIYW5kbGVyIGJsb3dzIHVwIHdpdGhvdXQgaXRcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgaWYgKHJlYWN0aW9uRGF0YS5jb250ZW50KSB7XG4gICAgICAgICAgICBkYXRhLmNvbnRlbnRfbm9kZV9kYXRhLmlkID0gcmVhY3Rpb25EYXRhLmNvbnRlbnQuaWQ7XG4gICAgICAgICAgICBkYXRhLmNvbnRlbnRfbm9kZV9kYXRhLmxvY2F0aW9uID0gcmVhY3Rpb25EYXRhLmNvbnRlbnQubG9jYXRpb247XG4gICAgICAgIH1cbiAgICAgICAgLy8gVE9ETzogc2hvdWxkIHdlIGJhaWwgaWYgdGhlcmUncyBubyBwYXJlbnQgSUQ/IEl0J3Mgbm90IHJlYWxseSBhICsxIHdpdGhvdXQgb25lLlxuICAgICAgICBpZiAocmVhY3Rpb25EYXRhLnBhcmVudElEKSB7XG4gICAgICAgICAgICBkYXRhLnRhZy5wYXJlbnRfaWQgPSByZWFjdGlvbkRhdGEucGFyZW50SUQ7XG4gICAgICAgIH1cbiAgICAgICAgZ2V0SlNPTlAoVVJMcy5jcmVhdGVSZWFjdGlvblVybCgpLCBkYXRhLCBwbHVzT25lU3VjY2VzcyhyZWFjdGlvbkRhdGEsIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBzdWNjZXNzKSwgZXJyb3IpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBwb3N0Q29tbWVudChjb21tZW50LCByZWFjdGlvbkRhdGEsIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBzdWNjZXNzLCBlcnJvcikge1xuICAgIC8vIFRPRE86IHJlZmFjdG9yIHRoZSBwb3N0IGZ1bmN0aW9ucyB0byBlbGltaW5hdGUgYWxsIHRoZSBjb3BpZWQgY29kZVxuICAgIFVzZXIuZmV0Y2hVc2VyKGZ1bmN0aW9uKHVzZXJJbmZvKSB7XG4gICAgICAgIC8vIFRPRE8gZXh0cmFjdCB0aGUgc2hhcGUgb2YgdGhpcyBkYXRhIGFuZCBwb3NzaWJseSB0aGUgd2hvbGUgQVBJIGNhbGxcbiAgICAgICAgaWYgKCFyZWFjdGlvbkRhdGEuY29udGVudCkge1xuICAgICAgICAgICAgLy8gVGhpcyBpcyBhIHN1bW1hcnkgcmVhY3Rpb24uIFNlZSBpZiB3ZSBoYXZlIGFueSBjb250YWluZXIgZGF0YSB0aGF0IHdlIGNhbiBsaW5rIHRvIGl0LlxuICAgICAgICAgICAgdmFyIGNvbnRhaW5lclJlYWN0aW9ucyA9IGNvbnRhaW5lckRhdGEucmVhY3Rpb25zO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb250YWluZXJSZWFjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgY29udGFpbmVyUmVhY3Rpb24gPSBjb250YWluZXJSZWFjdGlvbnNbaV07XG4gICAgICAgICAgICAgICAgaWYgKGNvbnRhaW5lclJlYWN0aW9uLmlkID09PSByZWFjdGlvbkRhdGEuaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVhY3Rpb25EYXRhLnBhcmVudElEID0gY29udGFpbmVyUmVhY3Rpb24ucGFyZW50SUQ7XG4gICAgICAgICAgICAgICAgICAgIHJlYWN0aW9uRGF0YS5jb250ZW50ID0gY29udGFpbmVyUmVhY3Rpb24uY29udGVudDtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHZhciBkYXRhID0ge1xuICAgICAgICAgICAgY29tbWVudDogY29tbWVudCxcbiAgICAgICAgICAgIHRhZzoge1xuICAgICAgICAgICAgICAgIHBhcmVudF9pZDogcmVhY3Rpb25EYXRhLnBhcmVudElEXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdXNlcl9pZDogdXNlckluZm8udXNlcl9pZCxcbiAgICAgICAgICAgIGFudF90b2tlbjogdXNlckluZm8uYW50X3Rva2VuLFxuICAgICAgICAgICAgcGFnZV9pZDogcGFnZURhdGEucGFnZUlkLFxuICAgICAgICAgICAgZ3JvdXBfaWQ6IHBhZ2VEYXRhLmdyb3VwSWRcbiAgICAgICAgfTtcbiAgICAgICAgZ2V0SlNPTlAoVVJMcy5jcmVhdGVDb21tZW50VXJsKCksIGRhdGEsIGNvbW1lbnRTdWNjZXNzKHJlYWN0aW9uRGF0YSwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIHN1Y2Nlc3MpLCBlcnJvcik7XG4gICAgfSk7XG59XG5cbi8vIFRPRE86IFdlIG5lZWQgdG8gcmV2aWV3IHRoZSBBUEkgc28gdGhhdCBpdCByZXR1cm5zL2FjY2VwdHMgYSB1bmlmb3JtIHNldCBvZiB2YWx1ZXMuXG5mdW5jdGlvbiBjb250ZW50Tm9kZURhdGFLaW5kKHR5cGUpIHtcbiAgICBpZiAodHlwZSA9PT0gJ2ltYWdlJykge1xuICAgICAgICByZXR1cm4gJ2ltZyc7XG4gICAgfVxuICAgIHJldHVybiB0eXBlO1xufVxuXG5mdW5jdGlvbiBjb21tZW50U3VjY2VzcyhyZWFjdGlvbkRhdGEsIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBjYWxsYmFjaykge1xuICAgIHJldHVybiBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAvLyBUT0RPOiBpbiB0aGUgY2FzZSB0aGF0IHNvbWVvbmUgcmVhY3RzIGFuZCB0aGVuIGltbWVkaWF0ZWx5IGNvbW1lbnRzLCB3ZSBoYXZlIGEgcmFjZSBjb25kaXRpb24gd2hlcmUgdGhlXG4gICAgICAgIC8vICAgICAgIGNvbW1lbnQgcmVzcG9uc2UgY291bGQgY29tZSBiYWNrIGJlZm9yZSB0aGUgcmVhY3Rpb24uIHdlIG5lZWQgdG86XG4gICAgICAgIC8vICAgICAgIDEuIE1ha2Ugc3VyZSB0aGUgc2VydmVyIG9ubHkgY3JlYXRlcyBhIHNpbmdsZSByZWFjdGlvbiBpbiB0aGlzIGNhc2UgKG5vdCBhIEhVR0UgZGVhbCBpZiBpdCBtYWtlcyB0d28pXG4gICAgICAgIC8vICAgICAgIDIuIFJlc29sdmUgdGhlIHR3byByZXNwb25zZXMgdGhhdCBib3RoIHRoZW9yZXRpY2FsbHkgY29tZSBiYWNrIHdpdGggdGhlIHNhbWUgcmVhY3Rpb24gZGF0YSBhdCB0aGUgc2FtZVxuICAgICAgICAvLyAgICAgICAgICB0aW1lLiBNYWtlIHN1cmUgd2UgZG9uJ3QgZW5kIHVwIHdpdGggdHdvIGNvcGllcyBvZiB0aGUgc2FtZSBkYXRhIGluIHRoZSBtb2RlbC5cbiAgICAgICAgdmFyIHJlYWN0aW9uQ3JlYXRlZCA9ICFyZXNwb25zZS5leGlzdGluZztcbiAgICAgICAgaWYgKHJlYWN0aW9uQ3JlYXRlZCkge1xuICAgICAgICAgICAgaWYgKCFyZWFjdGlvbkRhdGEuY29tbWVudENvdW50KSB7XG4gICAgICAgICAgICAgICAgcmVhY3Rpb25EYXRhLmNvbW1lbnRDb3VudCA9IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZWFjdGlvbkRhdGEuY29tbWVudENvdW50ICs9IDE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBUT0RPOiBkbyB3ZSBldmVyIGdldCBhIHJlc3BvbnNlIHRvIGEgbmV3IHJlYWN0aW9uIHRlbGxpbmcgdXMgdGhhdCBpdCdzIGFscmVhZHkgZXhpc3Rpbmc/IElmIHNvLCBjb3VsZCB0aGUgY291bnQgbmVlZCB0byBiZSB1cGRhdGVkP1xuICAgICAgICB9XG4gICAgICAgIGNhbGxiYWNrKHJlYWN0aW9uQ3JlYXRlZCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBwbHVzT25lU3VjY2VzcyhyZWFjdGlvbkRhdGEsIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBjYWxsYmFjaykge1xuICAgIHJldHVybiBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAvLyBUT0RPOiBEbyB3ZSBjYXJlIGFib3V0IHJlc3BvbnNlLmV4aXN0aW5nIGFueW1vcmUgKHdlIHVzZWQgdG8gc2hvdyBkaWZmZXJlbnQgZmVlZGJhY2sgaW4gdGhlIFVJLCBidXQgbm8gbG9uZ2VyLi4uKVxuICAgICAgICB2YXIgcmVhY3Rpb25DcmVhdGVkID0gIXJlc3BvbnNlLmV4aXN0aW5nO1xuICAgICAgICBpZiAocmVhY3Rpb25DcmVhdGVkKSB7XG4gICAgICAgICAgICAvLyBUT0RPOiB3ZSBzaG91bGQgZ2V0IGJhY2sgYSByZXNwb25zZSB3aXRoIGRhdGEgaW4gdGhlIFwibmV3IGZvcm1hdFwiIGFuZCB1cGRhdGUgdGhlIG1vZGVsIGZyb20gdGhlIHJlc3BvbnNlXG4gICAgICAgICAgICByZWFjdGlvbkRhdGEuY291bnQgPSByZWFjdGlvbkRhdGEuY291bnQgKyAxO1xuICAgICAgICAgICAgY29udGFpbmVyRGF0YS5yZWFjdGlvblRvdGFsID0gY29udGFpbmVyRGF0YS5yZWFjdGlvblRvdGFsICsgMTtcbiAgICAgICAgICAgIHBhZ2VEYXRhLnN1bW1hcnlUb3RhbCA9IHBhZ2VEYXRhLnN1bW1hcnlUb3RhbCArIDE7XG4gICAgICAgICAgICBjb250YWluZXJEYXRhLnJlYWN0aW9ucy5zb3J0KGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYi5jb3VudCAtIGEuY291bnQ7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBjYWxsYmFjayhyZWFjdGlvbkRhdGEpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gbmV3UmVhY3Rpb25TdWNjZXNzKGNvbnRlbnRMb2NhdGlvbiwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGNhbGxiYWNrKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgIC8vIFRPRE86IENhbiByZXNwb25zZS5leGlzdGluZyBldmVyIGNvbWUgYmFjayB0cnVlIGZvciBhICduZXcnIHJlYWN0aW9uPyBTaG91bGQgd2UgYmVoYXZlIGFueSBkaWZmZXJlbnRseSBpZiBpdCBkb2VzP1xuICAgICAgICB2YXIgcmVhY3Rpb24gPSByZWFjdGlvbkZyb21SZXNwb25zZShyZXNwb25zZSwgY29udGVudExvY2F0aW9uKTtcbiAgICAgICAgY2FsbGJhY2socmVhY3Rpb24pO1xuICAgIH07XG59XG5cbmZ1bmN0aW9uIHJlYWN0aW9uRnJvbVJlc3BvbnNlKHJlc3BvbnNlLCBjb250ZW50TG9jYXRpb24pIHtcbiAgICAvLyBUT0RPOiB0aGUgc2VydmVyIHNob3VsZCBnaXZlIHVzIGJhY2sgYSByZWFjdGlvbiBtYXRjaGluZyB0aGUgbmV3IEFQSSBmb3JtYXQuXG4gICAgLy8gICAgICAgd2UncmUganVzdCBmYWtpbmcgaXQgb3V0IGZvciBub3c7IHRoaXMgY29kZSBpcyB0ZW1wb3JhcnlcbiAgICB2YXIgcmVhY3Rpb24gPSB7XG4gICAgICAgIHRleHQ6IHJlc3BvbnNlLmludGVyYWN0aW9uLmludGVyYWN0aW9uX25vZGUuYm9keSxcbiAgICAgICAgaWQ6IHJlc3BvbnNlLmludGVyYWN0aW9uLmludGVyYWN0aW9uX25vZGUuaWQsXG4gICAgICAgIGNvdW50OiAxLFxuICAgICAgICBwYXJlbnRJRDogcmVzcG9uc2UuaW50ZXJhY3Rpb24uaWQsXG4gICAgICAgIGFwcHJvdmVkOiByZXNwb25zZS5hcHByb3ZlZCA9PT0gdW5kZWZpbmVkIHx8IHJlc3BvbnNlLmFwcHJvdmVkXG4gICAgfTtcbiAgICBpZiAocmVzcG9uc2UuY29udGVudF9ub2RlKSB7XG4gICAgICAgIHJlYWN0aW9uLmNvbnRlbnQgPSB7XG4gICAgICAgICAgICBpZDogcmVzcG9uc2UuY29udGVudF9ub2RlLmlkLFxuICAgICAgICAgICAga2luZDogcmVzcG9uc2UuY29udGVudF9ub2RlLmtpbmQsXG4gICAgICAgICAgICBib2R5OiByZXNwb25zZS5jb250ZW50X25vZGUuYm9keVxuICAgICAgICB9O1xuICAgICAgICBpZiAocmVzcG9uc2UuY29udGVudF9ub2RlLmxvY2F0aW9uKSB7XG4gICAgICAgICAgICByZWFjdGlvbi5jb250ZW50LmxvY2F0aW9uID0gcmVzcG9uc2UuY29udGVudF9ub2RlLmxvY2F0aW9uO1xuICAgICAgICB9IGVsc2UgaWYgKGNvbnRlbnRMb2NhdGlvbikge1xuICAgICAgICAgICAgLy8gVE9ETzogZW5zdXJlIHRoYXQgdGhlIEFQSSBhbHdheXMgcmV0dXJucyBhIGxvY2F0aW9uIGFuZCByZW1vdmUgdGhlIFwiY29udGVudExvY2F0aW9uXCIgdGhhdCdzIGJlaW5nIHBhc3NlZCBhcm91bmQuXG4gICAgICAgICAgICAvLyBGb3Igbm93LCBqdXN0IHBhdGNoIHRoZSByZXNwb25zZSB3aXRoIHRoZSBkYXRhIHdlIGtub3cgd2Ugc2VudCBvdmVyLlxuICAgICAgICAgICAgcmVhY3Rpb24uY29udGVudC5sb2NhdGlvbiA9IGNvbnRlbnRMb2NhdGlvbjtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVhY3Rpb247XG59XG5cbmZ1bmN0aW9uIGdldENvbW1lbnRzKHJlYWN0aW9uLCBzdWNjZXNzQ2FsbGJhY2ssIGVycm9yQ2FsbGJhY2spIHtcbiAgICBVc2VyLmZldGNoVXNlcihmdW5jdGlvbih1c2VySW5mbykge1xuICAgICAgICB2YXIgZGF0YSA9IHtcbiAgICAgICAgICAgIHJlYWN0aW9uX2lkOiByZWFjdGlvbi5wYXJlbnRJRCxcbiAgICAgICAgICAgIHVzZXJfaWQ6IHVzZXJJbmZvLnVzZXJfaWQsXG4gICAgICAgICAgICBhbnRfdG9rZW46IHVzZXJJbmZvLmFudF90b2tlblxuICAgICAgICB9O1xuICAgICAgICBnZXRKU09OUChVUkxzLmZldGNoQ29tbWVudFVybCgpLCBkYXRhLCBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKGNvbW1lbnRzRnJvbVJlc3BvbnNlKHJlc3BvbnNlKSk7XG4gICAgICAgIH0sIGVycm9yQ2FsbGJhY2spO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBmZXRjaExvY2F0aW9uRGV0YWlscyhyZWFjdGlvbkxvY2F0aW9uRGF0YSwgcGFnZURhdGEsIHN1Y2Nlc3NDYWxsYmFjaywgZXJyb3JDYWxsYmFjaykge1xuICAgIHZhciBjb250ZW50SURzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMocmVhY3Rpb25Mb2NhdGlvbkRhdGEpO1xuICAgIFVzZXIuZmV0Y2hVc2VyKGZ1bmN0aW9uKHVzZXJJbmZvKSB7XG4gICAgICAgIHZhciBkYXRhID0ge1xuICAgICAgICAgICAgdXNlcl9pZDogdXNlckluZm8udXNlcl9pZCxcbiAgICAgICAgICAgIGFudF90b2tlbjogdXNlckluZm8uYW50X3Rva2VuLFxuICAgICAgICAgICAgY29udGVudF9pZHM6IGNvbnRlbnRJRHNcbiAgICAgICAgfTtcbiAgICAgICAgZ2V0SlNPTlAoVVJMcy5mZXRjaENvbnRlbnRCb2RpZXNVcmwoKSwgZGF0YSwgc3VjY2Vzc0NhbGxiYWNrLCBlcnJvckNhbGxiYWNrKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gY29tbWVudHNGcm9tUmVzcG9uc2UoanNvbkNvbW1lbnRzKSB7XG4gICAgdmFyIGNvbW1lbnRzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBqc29uQ29tbWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGpzb25Db21tZW50ID0ganNvbkNvbW1lbnRzW2ldO1xuICAgICAgICB2YXIgY29tbWVudCA9IHtcbiAgICAgICAgICAgIHRleHQ6IGpzb25Db21tZW50LnRleHQsXG4gICAgICAgICAgICBpZDoganNvbkNvbW1lbnQuaWQsIC8vIFRPRE86IHdlIHByb2JhYmx5IG9ubHkgbmVlZCB0aGlzIGZvciArMSdpbmcgY29tbWVudHNcbiAgICAgICAgICAgIGNvbnRlbnRJRDoganNvbkNvbW1lbnQuY29udGVudElELCAvLyBUT0RPOiBEbyB3ZSByZWFsbHkgbmVlZCB0aGlzP1xuICAgICAgICAgICAgdXNlcjogVXNlci5mcm9tQ29tbWVudEpTT04oanNvbkNvbW1lbnQudXNlciwganNvbkNvbW1lbnQuc29jaWFsX3VzZXIpXG4gICAgICAgIH07XG4gICAgICAgIGNvbW1lbnRzLnB1c2goY29tbWVudCk7XG4gICAgfVxuICAgIHJldHVybiBjb21tZW50cztcbn1cblxuZnVuY3Rpb24gcG9zdFNoYXJlUmVhY3Rpb24ocmVhY3Rpb25EYXRhLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgc3VjY2VzcywgZmFpbHVyZSkge1xuICAgIFVzZXIuZmV0Y2hVc2VyKGZ1bmN0aW9uKHVzZXJJbmZvKSB7XG4gICAgICAgIHZhciBjb250ZW50RGF0YSA9IHJlYWN0aW9uRGF0YS5jb250ZW50O1xuICAgICAgICB2YXIgZGF0YSA9IHtcbiAgICAgICAgICAgIHRhZzogeyAvLyBUT0RPOiB3aHkgZG9lcyB0aGUgU2hhcmVIYW5kbGVyIGNyZWF0ZSBhIHJlYWN0aW9uIGlmIGl0IGRvZXNuJ3QgZXhpc3Q/IEhvdyBjYW4geW91IHNoYXJlIGEgcmVhY3Rpb24gdGhhdCBoYXNuJ3QgaGFwcGVuZWQ/XG4gICAgICAgICAgICAgICAgaWQ6IHJlYWN0aW9uRGF0YS5pZCxcbiAgICAgICAgICAgICAgICBib2R5OiByZWFjdGlvbkRhdGEudGV4dFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGhhc2g6IGNvbnRhaW5lckRhdGEuaGFzaCxcbiAgICAgICAgICAgIGNvbnRhaW5lcl9raW5kOiBjb250YWluZXJEYXRhLnR5cGUsXG4gICAgICAgICAgICBjb250ZW50X25vZGVfZGF0YTogeyAvLyBUT0RPOiB3aHkgZG9lcyB0aGUgU2hhcmVIYW5kbGVyIGNyZWF0ZSBhIGNvbnRlbnQgaWYgaXQgZG9lc24ndCBleGlzdD8gSG93IGNhbiB5b3Ugc2hhcmUgYSByZWFjdGlvbiB0aGF0IGhhc24ndCBoYXBwZW5lZD9cbiAgICAgICAgICAgICAgICBpZDogY29udGVudERhdGEuaWQsXG4gICAgICAgICAgICAgICAgYm9keTogY29udGVudERhdGEudGV4dCxcbiAgICAgICAgICAgICAgICBsb2NhdGlvbjogY29udGVudERhdGEubG9jYXRpb24sXG4gICAgICAgICAgICAgICAga2luZDogY29udGVudE5vZGVEYXRhS2luZChjb250YWluZXJEYXRhLnR5cGUpXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdXNlcl9pZDogdXNlckluZm8udXNlcl9pZCxcbiAgICAgICAgICAgIGFudF90b2tlbjogdXNlckluZm8uYW50X3Rva2VuLFxuICAgICAgICAgICAgZ3JvdXBfaWQ6IHBhZ2VEYXRhLmdyb3VwSWQsXG4gICAgICAgICAgICBwYWdlX2lkOiBwYWdlRGF0YS5wYWdlSWQsXG4gICAgICAgICAgICByZWZlcnJpbmdfaW50X2lkOiByZWFjdGlvbkRhdGEucGFyZW50SURcbiAgICAgICAgfTtcbiAgICAgICAgZ2V0SlNPTlAoVVJMcy5zaGFyZVJlYWN0aW9uVXJsKCksIGRhdGEsIHN1Y2Nlc3MsIGZhaWx1cmUpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBnZXRKU09OUCh1cmwsIGRhdGEsIHN1Y2Nlc3MsIGVycm9yKSB7XG4gICAgdmFyIGJhc2VVcmwgPSBVUkxzLmFwcFNlcnZlclVybCgpO1xuICAgIGRvR2V0SlNPTlAoYmFzZVVybCwgdXJsLCBkYXRhLCBzdWNjZXNzLCBlcnJvcik7XG59XG5cbmZ1bmN0aW9uIHBvc3RFdmVudChldmVudCkge1xuICAgIHZhciBiYXNlVXJsID0gVVJMcy5ldmVudHNTZXJ2ZXJVcmwoKTtcbiAgICBpZiAoQXBwTW9kZS5kZWJ1Zykge1xuICAgICAgICBjb25zb2xlLmxvZygnQU5URU5OQSBQb3N0aW5nIGV2ZW50OiAnICsgSlNPTi5zdHJpbmdpZnkoZXZlbnQpKTtcbiAgICB9XG4gICAgZG9HZXRKU09OUChiYXNlVXJsLCBVUkxzLmV2ZW50VXJsKCksIGV2ZW50LCBmdW5jdGlvbigpIHsgLypzdWNjZXNzKi8gfSwgZnVuY3Rpb24oZXJyb3IpIHtcbiAgICAgICAgLy8gVE9ETzogZXJyb3IgaGFuZGxpbmdcbiAgICAgICAgY29uc29sZS5sb2coJ0FuIGVycm9yIG9jY3VycmVkIHBvc3RpbmcgZXZlbnQ6ICcsIGVycm9yKTtcbiAgICB9KTtcbn1cblxuLy8gSXNzdWVzIGEgSlNPTlAgcmVxdWVzdCB0byBhIGdpdmVuIHNlcnZlci4gVG8gc2VuZCBhIHJlcXVlc3QgdG8gdGhlIGFwcGxpY2F0aW9uIHNlcnZlciwgdXNlIGdldEpTT05QIGluc3RlYWQuXG5mdW5jdGlvbiBkb0dldEpTT05QKGJhc2VVcmwsIHVybCwgZGF0YSwgc3VjY2VzcywgZXJyb3IpIHtcbiAgICB2YXIgb3B0aW9ucyA9IHtcbiAgICAgICAgdXJsOiBiYXNlVXJsICsgdXJsLFxuICAgICAgICB0eXBlOiBcImdldFwiLFxuICAgICAgICBjb250ZW50VHlwZTogXCJhcHBsaWNhdGlvbi9qc29uXCIsXG4gICAgICAgIGRhdGFUeXBlOiBcImpzb25wXCIsXG4gICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uKHJlc3BvbnNlLCB0ZXh0U3RhdHVzLCBYSFIpIHtcbiAgICAgICAgICAgIC8vIFRPRE86IFJldmlzaXQgd2hldGhlciBpdCdzIHJlYWxseSBjb29sIHRvIGtleSB0aGlzIG9uIHRoZSB0ZXh0U3RhdHVzIG9yIGlmIHdlIHNob3VsZCBiZSBsb29raW5nIGF0XG4gICAgICAgICAgICAvLyAgICAgICB0aGUgc3RhdHVzIGNvZGUgaW4gdGhlIFhIUlxuICAgICAgICAgICAgLy8gTm90ZTogVGhlIHNlcnZlciBjb21lcyBiYWNrIHdpdGggMjAwIHJlc3BvbnNlcyB3aXRoIGEgbmVzdGVkIHN0YXR1cyBvZiBcImZhaWxcIi4uLlxuICAgICAgICAgICAgaWYgKHRleHRTdGF0dXMgPT09ICdzdWNjZXNzJyAmJiByZXNwb25zZS5zdGF0dXMgIT09ICdmYWlsJyAmJiAoIXJlc3BvbnNlLmRhdGEgfHwgcmVzcG9uc2UuZGF0YS5zdGF0dXMgIT09ICdmYWlsJykpIHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBGb3IgSlNPTlAgcmVxdWVzdHMsIGpRdWVyeSBkb2Vzbid0IGNhbGwgaXQncyBlcnJvciBjYWxsYmFjay4gSXQgY2FsbHMgc3VjY2VzcyBpbnN0ZWFkLlxuICAgICAgICAgICAgICAgIGVycm9yKHJlc3BvbnNlLm1lc3NhZ2UgfHwgcmVzcG9uc2UuZGF0YS5tZXNzYWdlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgZXJyb3I6IGZ1bmN0aW9uKHhociwgdGV4dFN0YXR1cywgbWVzc2FnZSkge1xuICAgICAgICAgICAgLy8gT2theSwgYXBwYXJlbnRseSBqUXVlcnkgKmRvZXMqIGNhbGwgaXRzIGVycm9yIGNhbGxiYWNrIGZvciBKU09OUCByZXF1ZXN0cyBzb21ldGltZXMuLi5cbiAgICAgICAgICAgIC8vIFNwZWNpZmljYWxseSwgd2hlbiB0aGUgcmVzcG9uc2Ugc3RhdHVzIGlzIE9LIGJ1dCBhbiBlcnJvciBvY2N1cnMgY2xpZW50LXNpZGUgcHJvY2Vzc2luZyB0aGUgcmVzcG9uc2UuXG4gICAgICAgICAgICBlcnJvciAobWVzc2FnZSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIGlmIChkYXRhKSB7XG4gICAgICAgIG9wdGlvbnMuZGF0YSA9IHsganNvbjogSlNPTi5zdHJpbmdpZnkoZGF0YSkgfTtcbiAgICB9XG4gICAgJC5hamF4KG9wdGlvbnMpO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgZ2V0SlNPTlA6IGdldEpTT05QLFxuICAgIHBvc3RQbHVzT25lOiBwb3N0UGx1c09uZSxcbiAgICBwb3N0TmV3UmVhY3Rpb246IHBvc3ROZXdSZWFjdGlvbixcbiAgICBwb3N0Q29tbWVudDogcG9zdENvbW1lbnQsXG4gICAgZ2V0Q29tbWVudHM6IGdldENvbW1lbnRzLFxuICAgIHBvc3RTaGFyZVJlYWN0aW9uOiBwb3N0U2hhcmVSZWFjdGlvbixcbiAgICBmZXRjaExvY2F0aW9uRGV0YWlsczogZmV0Y2hMb2NhdGlvbkRldGFpbHMsXG4gICAgcG9zdEV2ZW50OiBwb3N0RXZlbnRcbn07IiwidmFyIFVSTENvbnN0YW50cyA9IHJlcXVpcmUoJy4vdXJsLWNvbnN0YW50cycpO1xuXG5mdW5jdGlvbiBjb21wdXRlQ3VycmVudFNjcmlwdFNyYygpIHtcbiAgICBpZiAoZG9jdW1lbnQuY3VycmVudFNjcmlwdCkge1xuICAgICAgICByZXR1cm4gZG9jdW1lbnQuY3VycmVudFNjcmlwdC5zcmM7XG4gICAgfVxuICAgIC8vIElFIGZhbGxiYWNrLi4uXG4gICAgdmFyIHNjcmlwdHMgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnc2NyaXB0Jyk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzY3JpcHRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBzY3JpcHQgPSBzY3JpcHRzW2ldO1xuICAgICAgICBpZiAoc2NyaXB0Lmhhc0F0dHJpYnV0ZSgnc3JjJykpIHtcbiAgICAgICAgICAgIHZhciBzY3JpcHRTcmMgPSBzY3JpcHQuZ2V0QXR0cmlidXRlKCdzcmMnKTtcbiAgICAgICAgICAgIHZhciBhbnRlbm5hU2NyaXB0cyA9IFsgJ2FudGVubmEuanMnLCAnYW50ZW5uYS5taW4uanMnLCAnZW5nYWdlLmpzJywgJ2VuZ2FnZV9mdWxsLmpzJyBdO1xuICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBhbnRlbm5hU2NyaXB0cy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgIGlmIChzY3JpcHRTcmMuaW5kZXhPZihhbnRlbm5hU2NyaXB0c1tqXSkgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzY3JpcHRTcmM7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuXG52YXIgY3VycmVudFNjcmlwdFNyYyA9IGNvbXB1dGVDdXJyZW50U2NyaXB0U3JjKCkgfHwgJyc7XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBvZmZsaW5lOiBjdXJyZW50U2NyaXB0U3JjLmluZGV4T2YoVVJMQ29uc3RhbnRzLkRFVkVMT1BNRU5UKSAhPT0gLTEgfHwgY3VycmVudFNjcmlwdFNyYy5pbmRleE9mKFVSTENvbnN0YW50cy5URVNUKSAhPT0gLTEsXG4gICAgdGVzdDogY3VycmVudFNjcmlwdFNyYy5pbmRleE9mKFVSTENvbnN0YW50cy5URVNUKSAhPT0gLTEsXG4gICAgZGVidWc6IGN1cnJlbnRTY3JpcHRTcmMuaW5kZXhPZignP2RlYnVnJykgIT09IC0xXG59OyIsIlxudmFyIGlzVG91Y2hCcm93c2VyO1xudmFyIGlzTW9iaWxlRGV2aWNlO1xuXG5mdW5jdGlvbiBzdXBwb3J0c1RvdWNoKCkge1xuICAgIGlmIChpc1RvdWNoQnJvd3NlciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIC8vaXNUb3VjaEJyb3dzZXIgPSAobmF2aWdhdG9yLm1zTWF4VG91Y2hQb2ludHMgfHwgXCJvbnRvdWNoc3RhcnRcIiBpbiB3aW5kb3cpICYmICgod2luZG93Lm1hdGNoTWVkaWEoXCJvbmx5IHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpXCIpKS5tYXRjaGVzKTtcbiAgICAgICAgaXNUb3VjaEJyb3dzZXIgPSBcIm9udG91Y2hzdGFydFwiIGluIHdpbmRvdztcbiAgICB9XG4gICAgcmV0dXJuIGlzVG91Y2hCcm93c2VyO1xufVxuXG5mdW5jdGlvbiBpc01vYmlsZSgpIHtcbiAgICBpZiAoaXNNb2JpbGVEZXZpY2UgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBpc01vYmlsZURldmljZSA9IHN1cHBvcnRzVG91Y2goKSAmJlxuICAgICAgICAgICAgKCh3aW5kb3cubWF0Y2hNZWRpYShcIm9ubHkgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA0ODBweCkgYW5kIChvcmllbnRhdGlvbjogcG9ydHJhaXQpXCIpKS5tYXRjaGVzIHx8XG4gICAgICAgICAgICAod2luZG93Lm1hdGNoTWVkaWEoXCJvbmx5IHNjcmVlbiBhbmQgKG1heC13aWR0aDogNjQwcHgpIGFuZCAob3JpZW50YXRpb246IGxhbmRzY2FwZSlcIikpLm1hdGNoZXMpO1xuICAgIH1cbiAgICByZXR1cm4gaXNNb2JpbGVEZXZpY2U7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHN1cHBvcnRzVG91Y2g6IHN1cHBvcnRzVG91Y2gsXG4gICAgaXNNb2JpbGU6IGlzTW9iaWxlXG59OyIsIlxuLy8gUmUtdXNhYmxlIHN1cHBvcnQgZm9yIG1hbmFnaW5nIGEgY29sbGVjdGlvbiBvZiBjYWxsYmFjayBmdW5jdGlvbnMuXG5cbnZhciBhbnR1aWQgPSAwOyAvLyBcImdsb2JhbGx5XCIgdW5pcXVlIElEIHRoYXQgd2UgdXNlIHRvIHRhZyBjYWxsYmFjayBmdW5jdGlvbnMgZm9yIGxhdGVyIHJldHJpZXZhbC4gKFRoaXMgaXMgaG93IFwib2ZmXCIgd29ya3MuKVxuXG5mdW5jdGlvbiBjcmVhdGVDYWxsYmFja3MoKSB7XG5cbiAgICB2YXIgY2FsbGJhY2tzID0ge307XG5cbiAgICBmdW5jdGlvbiBhZGRDYWxsYmFjayhjYWxsYmFjaykge1xuICAgICAgICBpZiAoY2FsbGJhY2suYW50dWlkID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrLmFudHVpZCA9IGFudHVpZCsrO1xuICAgICAgICB9XG4gICAgICAgIGNhbGxiYWNrc1tjYWxsYmFjay5hbnR1aWRdID0gY2FsbGJhY2s7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcmVtb3ZlQ2FsbGJhY2soY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKGNhbGxiYWNrLmFudHVpZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBkZWxldGUgY2FsbGJhY2tzW2NhbGxiYWNrLmFudHVpZF07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRDYWxsYmFja3MoKSB7XG4gICAgICAgIHZhciBhbGxDYWxsYmFja3MgPSBbXTtcbiAgICAgICAgZm9yICh2YXIga2V5IGluIGNhbGxiYWNrcykge1xuICAgICAgICAgICAgaWYgKGNhbGxiYWNrcy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgYWxsQ2FsbGJhY2tzLnB1c2goY2FsbGJhY2tzW2tleV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhbGxDYWxsYmFja3M7XG4gICAgfVxuXG4gICAgLy8gQ29udmVuaWVuY2UgZnVuY3Rpb24gdGhhdCBpbnZva2VzIGFsbCBjYWxsYmFja3Mgd2l0aCBubyBwYXJhbWV0ZXJzLiBBbnkgY2FsbGJhY2tzIHRoYXQgbmVlZCBwYXJhbXMgY2FuIGJlIGNhbGxlZFxuICAgIC8vIGJ5IGNsaWVudHMgdXNpbmcgZ2V0Q2FsbGJhY2tzKClcbiAgICBmdW5jdGlvbiBpbnZva2VBbGwoKSB7XG4gICAgICAgIHZhciBjYWxsYmFja3MgPSBnZXRDYWxsYmFja3MoKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjYWxsYmFja3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNhbGxiYWNrc1tpXSgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNFbXB0eSgpIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKGNhbGxiYWNrcykubGVuZ3RoID09PSAwO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHRlYXJkb3duKCkge1xuICAgICAgICBjYWxsYmFja3MgPSB7fTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBhZGQ6IGFkZENhbGxiYWNrLFxuICAgICAgICByZW1vdmU6IHJlbW92ZUNhbGxiYWNrLFxuICAgICAgICBnZXQ6IGdldENhbGxiYWNrcyxcbiAgICAgICAgaXNFbXB0eTogaXNFbXB0eSxcbiAgICAgICAgaW52b2tlQWxsOiBpbnZva2VBbGwsXG4gICAgICAgIHRlYXJkb3duOiB0ZWFyZG93blxuICAgIH1cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZTogY3JlYXRlQ2FsbGJhY2tzXG59OyIsInZhciAkOyByZXF1aXJlKCcuL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIE1ENSA9IHJlcXVpcmUoJy4vbWQ1Jyk7XG5cbmZ1bmN0aW9uIGdldENsZWFuVGV4dCgkZWxlbWVudCkge1xuICAgIHZhciAkY2xvbmUgPSAkZWxlbWVudC5jbG9uZSgpO1xuICAgIC8vIFJlbW92ZSBhbnkgZWxlbWVudHMgdGhhdCB3ZSBkb24ndCB3YW50IGluY2x1ZGVkIGluIHRoZSB0ZXh0IGNhbGN1bGF0aW9uXG4gICAgJGNsb25lLmZpbmQoJ2lmcmFtZSwgaW1nLCBzY3JpcHQsIHZpZGVvLCAuYW50ZW5uYSwgLm5vLWFudCcpLnJlbW92ZSgpLmVuZCgpO1xuICAgIC8vIFRoZW4gbWFudWFsbHkgY29udmVydCBhbnkgPGJyPiB0YWdzIGludG8gc3BhY2VzIChvdGhlcndpc2UsIHdvcmRzIHdpbGwgZ2V0IGFwcGVuZGVkIGJ5IHRoZSB0ZXh0KCkgY2FsbClcbiAgICB2YXIgaHRtbCA9ICRjbG9uZS5odG1sKCkucmVwbGFjZSgvPFxcU2JyXFxTXFwvPz4vZ2ksICcgJyk7XG4gICAgLy8gUHV0IHRoZSBIVE1MIGJhY2sgaW50byBhIGRpdiBhbmQgY2FsbCB0ZXh0KCksIHdoaWNoIGRvZXMgbW9zdCBvZiB0aGUgaGVhdnkgbGlmdGluZ1xuICAgIHZhciB0ZXh0ID0gJCgnPGRpdj4nICsgaHRtbCArICc8L2Rpdj4nKS50ZXh0KCkudG9Mb3dlckNhc2UoKS50cmltKCk7XG4gICAgdGV4dCA9IHRleHQucmVwbGFjZSgvW1xcblxcclxcdF0vZ2ksICcgJyk7IC8vIFJlcGxhY2UgYW55IG5ld2xpbmVzL3RhYnMgd2l0aCBzcGFjZXNcbiAgICByZXR1cm4gdGV4dDtcbn1cblxuZnVuY3Rpb24gaGFzaFRleHQoZWxlbWVudCwgc3VmZml4KSB7XG4gICAgdmFyIHRleHQgPSBnZXRDbGVhblRleHQoZWxlbWVudCk7XG4gICAgaWYgKHRleHQpIHtcbiAgICAgICAgdmFyIGhhc2hUZXh0ID0gXCJyZHItdGV4dC1cIiArIHRleHQ7XG4gICAgICAgIGlmIChzdWZmaXggIT09IHVuZGVmaW5lZCkgeyAvLyBBcHBlbmQgdGhlIG9wdGlvbmFsIHN1ZmZpeFxuICAgICAgICAgICAgaGFzaFRleHQgKz0gJy0nICsgc3VmZml4O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBNRDUuaGV4X21kNShoYXNoVGV4dCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBoYXNoVXJsKHVybCkge1xuICAgIHJldHVybiBNRDUuaGV4X21kNSh1cmwpO1xufVxuXG5mdW5jdGlvbiBoYXNoSW1hZ2UoaW1hZ2VVcmwsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICBpZiAoaW1hZ2VVcmwgJiYgaW1hZ2VVcmwubGVuZ3RoID4gMCkge1xuICAgICAgICBpbWFnZVVybCA9IGZpZGRsZVdpdGhJbWFnZUFuZE1lZGlhVXJscyhpbWFnZVVybCwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIHZhciBoYXNoVGV4dCA9ICdyZHItaW1nLScgKyBpbWFnZVVybDtcbiAgICAgICAgcmV0dXJuIE1ENS5oZXhfbWQ1KGhhc2hUZXh0KTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGhhc2hNZWRpYShtZWRpYVVybCwgZ3JvdXBTZXR0aW5ncykge1xuICAgIGlmIChtZWRpYVVybCAmJiBtZWRpYVVybC5sZW5ndGggPiAwKSB7XG4gICAgICAgIG1lZGlhVXJsID0gZmlkZGxlV2l0aEltYWdlQW5kTWVkaWFVcmxzKG1lZGlhVXJsLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgdmFyIGhhc2hUZXh0ID0gJ3Jkci1tZWRpYS0nICsgbWVkaWFVcmw7XG4gICAgICAgIHJldHVybiBNRDUuaGV4X21kNShoYXNoVGV4dCk7XG4gICAgfVxufVxuXG4vLyBUT0RPOiByZXZpZXcuIGNvcGllZCBmcm9tIGVuZ2FnZV9mdWxsXG5mdW5jdGlvbiBmaWRkbGVXaXRoSW1hZ2VBbmRNZWRpYVVybHModXJsLCBncm91cFNldHRpbmdzKSB7XG4gICAgLy8gZmlkZGxlIHdpdGggdGhlIHVybCB0byBhY2NvdW50IGZvciByb3RhdGluZyBzdWJkb21haW5zIChpLmUuLCBkaWZmZXJpbmcgQ0ROIG5hbWVzIGZvciBpbWFnZSBob3N0cylcbiAgICAvLyByZWdleCBmcm9tIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvNjQ0OTM0MC9ob3ctdG8tZ2V0LXRvcC1sZXZlbC1kb21haW4tYmFzZS1kb21haW4tZnJvbS10aGUtdXJsLWluLWphdmFzY3JpcHRcbiAgICAvLyBtb2RpZmllZCB0byBzdXBwb3J0IDIgY2hhcmFjdGVyIHN1ZmZpeGVzLCBsaWtlIC5mbSBvciAuaW9cbiAgICB2YXIgSE9TVERPTUFJTiA9IC9bLVxcd10rXFwuKD86Wy1cXHddK1xcLnhuLS1bLVxcd10rfFstXFx3XXsyLH18Wy1cXHddK1xcLlstXFx3XXsyfSkkL2k7XG4gICAgdmFyIHNyY0FycmF5ID0gdXJsLnNwbGl0KCcvJyk7XG4gICAgc3JjQXJyYXkuc3BsaWNlKDAsMik7XG5cbiAgICB2YXIgZG9tYWluV2l0aFBvcnQgPSBzcmNBcnJheS5zaGlmdCgpO1xuICAgIGlmICghZG9tYWluV2l0aFBvcnQpIHsgLy90aGlzIGNvdWxkIGJlIHVuZGVmaW5lZCBpZiB0aGUgdXJsIG5vdCB2YWxpZCBvciBpcyBzb21ldGhpbmcgbGlrZSBqYXZhc2NyaXB0OnZvaWRcbiAgICAgICAgcmV0dXJuIHVybDtcbiAgICB9XG4gICAgdmFyIGRvbWFpbiA9IGRvbWFpbldpdGhQb3J0LnNwbGl0KCc6JylbMF07IC8vIGdldCBkb21haW4sIHN0cmlwIHBvcnRcblxuICAgIHZhciBmaWxlbmFtZSA9IHNyY0FycmF5LmpvaW4oJy8nKTtcblxuICAgIC8vIHRlc3QgZXhhbXBsZXM6XG4gICAgLy8gdmFyIG1hdGNoID0gSE9TVERPTUFJTi5leGVjKCdodHRwOi8vbWVkaWExLmFiLmNkLm9uLXRoZS10ZWxseS5iYmMuY28udWsvJyk7IC8vIGZhaWxzOiB0cmFpbGluZyBzbGFzaFxuICAgIC8vIHZhciBtYXRjaCA9IEhPU1RET01BSU4uZXhlYygnaHR0cDovL21lZGlhMS5hYi5jZC5vbi10aGUtdGVsbHkuYmJjLmNvLnVrJyk7IC8vIHN1Y2Nlc3NcbiAgICAvLyB2YXIgbWF0Y2ggPSBIT1NURE9NQUlOLmV4ZWMoJ21lZGlhMS5hYi5jZC5vbi10aGUtdGVsbHkuYmJjLmNvLnVrJyk7IC8vIHN1Y2Nlc3NcbiAgICB2YXIgbWF0Y2ggPSBIT1NURE9NQUlOLmV4ZWMoZG9tYWluKTtcbiAgICBpZiAobWF0Y2ggPT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gdXJsO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHVybCA9IG1hdGNoWzBdICsgJy8nICsgZmlsZW5hbWU7XG4gICAgfVxuICAgIGlmIChncm91cFNldHRpbmdzLnVybC5pZ25vcmVNZWRpYVVybFF1ZXJ5KCkgJiYgdXJsLmluZGV4T2YoJz8nKSkge1xuICAgICAgICB1cmwgPSB1cmwuc3BsaXQoJz8nKVswXTtcbiAgICB9XG4gICAgcmV0dXJuIHVybDtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGhhc2hUZXh0OiBoYXNoVGV4dCxcbiAgICBoYXNoSW1hZ2U6IGhhc2hJbWFnZSxcbiAgICBoYXNoTWVkaWE6IGhhc2hNZWRpYSxcbiAgICBoYXNoVXJsOiBoYXNoVXJsXG59OyIsIlxudmFyIGxvYWRlZGpRdWVyeTtcbnZhciBjYWxsYmFja3MgPSBbXTtcblxuLy8gTm90aWZpZXMgdGhlIGpRdWVyeSBwcm92aWRlciB0aGF0IHdlJ3ZlIGxvYWRlZCB0aGUgalF1ZXJ5IGxpYnJhcnkuXG5mdW5jdGlvbiBsb2FkZWQoKSB7XG4gICAgbG9hZGVkalF1ZXJ5ID0galF1ZXJ5Lm5vQ29uZmxpY3QoKTtcbiAgICBub3RpZnlDYWxsYmFja3MoKTtcbn1cblxuZnVuY3Rpb24gbm90aWZ5Q2FsbGJhY2tzKCkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2FsbGJhY2tzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNhbGxiYWNrc1tpXShsb2FkZWRqUXVlcnkpO1xuICAgIH1cbiAgICBjYWxsYmFja3MgPSBbXTtcbn1cblxuLy8gUmVnaXN0ZXJzIHRoZSBnaXZlbiBjYWxsYmFjayB0byBiZSBub3RpZmllZCB3aGVuIG91ciB2ZXJzaW9uIG9mIGpRdWVyeSBpcyBsb2FkZWQuXG5mdW5jdGlvbiBvbkxvYWQoY2FsbGJhY2spIHtcbiAgICBpZiAobG9hZGVkalF1ZXJ5KSB7XG4gICAgICAgIGNhbGxiYWNrKGxvYWRlZGpRdWVyeSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgY2FsbGJhY2tzLnB1c2goY2FsbGJhY2spO1xuICAgIH1cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGxvYWRlZDogbG9hZGVkLFxuICAgIG9uTG9hZDogb25Mb2FkXG59OyIsIi8qXG4gKiBBIEphdmFTY3JpcHQgaW1wbGVtZW50YXRpb24gb2YgdGhlIFJTQSBEYXRhIFNlY3VyaXR5LCBJbmMuIE1ENSBNZXNzYWdlXG4gKiBEaWdlc3QgQWxnb3JpdGhtLCBhcyBkZWZpbmVkIGluIFJGQyAxMzIxLlxuICogVmVyc2lvbiAyLjEgQ29weXJpZ2h0IChDKSBQYXVsIEpvaG5zdG9uIDE5OTkgLSAyMDAyLlxuICogT3RoZXIgY29udHJpYnV0b3JzOiBHcmVnIEhvbHQsIEFuZHJldyBLZXBlcnQsIFlkbmFyLCBMb3N0aW5ldFxuICogRGlzdHJpYnV0ZWQgdW5kZXIgdGhlIEJTRCBMaWNlbnNlXG4gKiBTZWUgaHR0cDovL3BhamhvbWUub3JnLnVrL2NyeXB0L21kNSBmb3IgbW9yZSBpbmZvLlxuICovXG5cbnZhciBoZXhjYXNlID0gMDtcbnZhciBiNjRwYWQgID0gXCJcIjtcbnZhciBjaHJzeiA9IDg7XG5cbmZ1bmN0aW9uIGhleF9tZDUocykge1xuICAgIHJldHVybiBiaW5sMmhleChjb3JlX21kNShzdHIyYmlubChzKSwgcy5sZW5ndGggKiBjaHJzeikpO1xufVxuXG5mdW5jdGlvbiBjb3JlX21kNSh4LCBsZW4pIHtcbiAgICB4W2xlbiA+PiA1XSB8PSAweDgwIDw8ICgobGVuKSAlIDMyKTtcbiAgICB4WygoKGxlbiArIDY0KSA+Pj4gOSkgPDwgNCkgKyAxNF0gPSBsZW47XG4gICAgdmFyIGEgPSAxNzMyNTg0MTkzO1xuICAgIHZhciBiID0gLTI3MTczMzg3OTtcbiAgICB2YXIgYyA9IC0xNzMyNTg0MTk0O1xuICAgIHZhciBkID0gMjcxNzMzODc4O1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgeC5sZW5ndGg7IGkgKz0gMTYpIHtcbiAgICAgICAgdmFyIG9sZGEgPSBhO1xuICAgICAgICB2YXIgb2xkYiA9IGI7XG4gICAgICAgIHZhciBvbGRjID0gYztcbiAgICAgICAgdmFyIG9sZGQgPSBkO1xuXG4gICAgICAgIGEgPSBtZDVfZmYoYSwgYiwgYywgZCwgeFtpICsgMF0sIDcsIC02ODA4NzY5MzYpO1xuICAgICAgICBkID0gbWQ1X2ZmKGQsIGEsIGIsIGMsIHhbaSArIDFdLCAxMiwgLTM4OTU2NDU4Nik7XG4gICAgICAgIGMgPSBtZDVfZmYoYywgZCwgYSwgYiwgeFtpICsgMl0sIDE3LCA2MDYxMDU4MTkpO1xuICAgICAgICBiID0gbWQ1X2ZmKGIsIGMsIGQsIGEsIHhbaSArIDNdLCAyMiwgLTEwNDQ1MjUzMzApO1xuICAgICAgICBhID0gbWQ1X2ZmKGEsIGIsIGMsIGQsIHhbaSArIDRdLCA3LCAtMTc2NDE4ODk3KTtcbiAgICAgICAgZCA9IG1kNV9mZihkLCBhLCBiLCBjLCB4W2kgKyA1XSwgMTIsIDEyMDAwODA0MjYpO1xuICAgICAgICBjID0gbWQ1X2ZmKGMsIGQsIGEsIGIsIHhbaSArIDZdLCAxNywgLTE0NzMyMzEzNDEpO1xuICAgICAgICBiID0gbWQ1X2ZmKGIsIGMsIGQsIGEsIHhbaSArIDddLCAyMiwgLTQ1NzA1OTgzKTtcbiAgICAgICAgYSA9IG1kNV9mZihhLCBiLCBjLCBkLCB4W2kgKyA4XSwgNywgMTc3MDAzNTQxNik7XG4gICAgICAgIGQgPSBtZDVfZmYoZCwgYSwgYiwgYywgeFtpICsgOV0sIDEyLCAtMTk1ODQxNDQxNyk7XG4gICAgICAgIGMgPSBtZDVfZmYoYywgZCwgYSwgYiwgeFtpICsgMTBdLCAxNywgLTQyMDYzKTtcbiAgICAgICAgYiA9IG1kNV9mZihiLCBjLCBkLCBhLCB4W2kgKyAxMV0sIDIyLCAtMTk5MDQwNDE2Mik7XG4gICAgICAgIGEgPSBtZDVfZmYoYSwgYiwgYywgZCwgeFtpICsgMTJdLCA3LCAxODA0NjAzNjgyKTtcbiAgICAgICAgZCA9IG1kNV9mZihkLCBhLCBiLCBjLCB4W2kgKyAxM10sIDEyLCAtNDAzNDExMDEpO1xuICAgICAgICBjID0gbWQ1X2ZmKGMsIGQsIGEsIGIsIHhbaSArIDE0XSwgMTcsIC0xNTAyMDAyMjkwKTtcbiAgICAgICAgYiA9IG1kNV9mZihiLCBjLCBkLCBhLCB4W2kgKyAxNV0sIDIyLCAxMjM2NTM1MzI5KTtcblxuICAgICAgICBhID0gbWQ1X2dnKGEsIGIsIGMsIGQsIHhbaSArIDFdLCA1LCAtMTY1Nzk2NTEwKTtcbiAgICAgICAgZCA9IG1kNV9nZyhkLCBhLCBiLCBjLCB4W2kgKyA2XSwgOSwgLTEwNjk1MDE2MzIpO1xuICAgICAgICBjID0gbWQ1X2dnKGMsIGQsIGEsIGIsIHhbaSArIDExXSwgMTQsIDY0MzcxNzcxMyk7XG4gICAgICAgIGIgPSBtZDVfZ2coYiwgYywgZCwgYSwgeFtpICsgMF0sIDIwLCAtMzczODk3MzAyKTtcbiAgICAgICAgYSA9IG1kNV9nZyhhLCBiLCBjLCBkLCB4W2kgKyA1XSwgNSwgLTcwMTU1ODY5MSk7XG4gICAgICAgIGQgPSBtZDVfZ2coZCwgYSwgYiwgYywgeFtpICsgMTBdLCA5LCAzODAxNjA4Myk7XG4gICAgICAgIGMgPSBtZDVfZ2coYywgZCwgYSwgYiwgeFtpICsgMTVdLCAxNCwgLTY2MDQ3ODMzNSk7XG4gICAgICAgIGIgPSBtZDVfZ2coYiwgYywgZCwgYSwgeFtpICsgNF0sIDIwLCAtNDA1NTM3ODQ4KTtcbiAgICAgICAgYSA9IG1kNV9nZyhhLCBiLCBjLCBkLCB4W2kgKyA5XSwgNSwgNTY4NDQ2NDM4KTtcbiAgICAgICAgZCA9IG1kNV9nZyhkLCBhLCBiLCBjLCB4W2kgKyAxNF0sIDksIC0xMDE5ODAzNjkwKTtcbiAgICAgICAgYyA9IG1kNV9nZyhjLCBkLCBhLCBiLCB4W2kgKyAzXSwgMTQsIC0xODczNjM5NjEpO1xuICAgICAgICBiID0gbWQ1X2dnKGIsIGMsIGQsIGEsIHhbaSArIDhdLCAyMCwgMTE2MzUzMTUwMSk7XG4gICAgICAgIGEgPSBtZDVfZ2coYSwgYiwgYywgZCwgeFtpICsgMTNdLCA1LCAtMTQ0NDY4MTQ2Nyk7XG4gICAgICAgIGQgPSBtZDVfZ2coZCwgYSwgYiwgYywgeFtpICsgMl0sIDksIC01MTQwMzc4NCk7XG4gICAgICAgIGMgPSBtZDVfZ2coYywgZCwgYSwgYiwgeFtpICsgN10sIDE0LCAxNzM1MzI4NDczKTtcbiAgICAgICAgYiA9IG1kNV9nZyhiLCBjLCBkLCBhLCB4W2kgKyAxMl0sIDIwLCAtMTkyNjYwNzczNCk7XG5cbiAgICAgICAgYSA9IG1kNV9oaChhLCBiLCBjLCBkLCB4W2kgKyA1XSwgNCwgLTM3ODU1OCk7XG4gICAgICAgIGQgPSBtZDVfaGgoZCwgYSwgYiwgYywgeFtpICsgOF0sIDExLCAtMjAyMjU3NDQ2Myk7XG4gICAgICAgIGMgPSBtZDVfaGgoYywgZCwgYSwgYiwgeFtpICsgMTFdLCAxNiwgMTgzOTAzMDU2Mik7XG4gICAgICAgIGIgPSBtZDVfaGgoYiwgYywgZCwgYSwgeFtpICsgMTRdLCAyMywgLTM1MzA5NTU2KTtcbiAgICAgICAgYSA9IG1kNV9oaChhLCBiLCBjLCBkLCB4W2kgKyAxXSwgNCwgLTE1MzA5OTIwNjApO1xuICAgICAgICBkID0gbWQ1X2hoKGQsIGEsIGIsIGMsIHhbaSArIDRdLCAxMSwgMTI3Mjg5MzM1Myk7XG4gICAgICAgIGMgPSBtZDVfaGgoYywgZCwgYSwgYiwgeFtpICsgN10sIDE2LCAtMTU1NDk3NjMyKTtcbiAgICAgICAgYiA9IG1kNV9oaChiLCBjLCBkLCBhLCB4W2kgKyAxMF0sIDIzLCAtMTA5NDczMDY0MCk7XG4gICAgICAgIGEgPSBtZDVfaGgoYSwgYiwgYywgZCwgeFtpICsgMTNdLCA0LCA2ODEyNzkxNzQpO1xuICAgICAgICBkID0gbWQ1X2hoKGQsIGEsIGIsIGMsIHhbaSArIDBdLCAxMSwgLTM1ODUzNzIyMik7XG4gICAgICAgIGMgPSBtZDVfaGgoYywgZCwgYSwgYiwgeFtpICsgM10sIDE2LCAtNzIyNTIxOTc5KTtcbiAgICAgICAgYiA9IG1kNV9oaChiLCBjLCBkLCBhLCB4W2kgKyA2XSwgMjMsIDc2MDI5MTg5KTtcbiAgICAgICAgYSA9IG1kNV9oaChhLCBiLCBjLCBkLCB4W2kgKyA5XSwgNCwgLTY0MDM2NDQ4Nyk7XG4gICAgICAgIGQgPSBtZDVfaGgoZCwgYSwgYiwgYywgeFtpICsgMTJdLCAxMSwgLTQyMTgxNTgzNSk7XG4gICAgICAgIGMgPSBtZDVfaGgoYywgZCwgYSwgYiwgeFtpICsgMTVdLCAxNiwgNTMwNzQyNTIwKTtcbiAgICAgICAgYiA9IG1kNV9oaChiLCBjLCBkLCBhLCB4W2kgKyAyXSwgMjMsIC05OTUzMzg2NTEpO1xuXG4gICAgICAgIGEgPSBtZDVfaWkoYSwgYiwgYywgZCwgeFtpICsgMF0sIDYsIC0xOTg2MzA4NDQpO1xuICAgICAgICBkID0gbWQ1X2lpKGQsIGEsIGIsIGMsIHhbaSArIDddLCAxMCwgMTEyNjg5MTQxNSk7XG4gICAgICAgIGMgPSBtZDVfaWkoYywgZCwgYSwgYiwgeFtpICsgMTRdLCAxNSwgLTE0MTYzNTQ5MDUpO1xuICAgICAgICBiID0gbWQ1X2lpKGIsIGMsIGQsIGEsIHhbaSArIDVdLCAyMSwgLTU3NDM0MDU1KTtcbiAgICAgICAgYSA9IG1kNV9paShhLCBiLCBjLCBkLCB4W2kgKyAxMl0sIDYsIDE3MDA0ODU1NzEpO1xuICAgICAgICBkID0gbWQ1X2lpKGQsIGEsIGIsIGMsIHhbaSArIDNdLCAxMCwgLTE4OTQ5ODY2MDYpO1xuICAgICAgICBjID0gbWQ1X2lpKGMsIGQsIGEsIGIsIHhbaSArIDEwXSwgMTUsIC0xMDUxNTIzKTtcbiAgICAgICAgYiA9IG1kNV9paShiLCBjLCBkLCBhLCB4W2kgKyAxXSwgMjEsIC0yMDU0OTIyNzk5KTtcbiAgICAgICAgYSA9IG1kNV9paShhLCBiLCBjLCBkLCB4W2kgKyA4XSwgNiwgMTg3MzMxMzM1OSk7XG4gICAgICAgIGQgPSBtZDVfaWkoZCwgYSwgYiwgYywgeFtpICsgMTVdLCAxMCwgLTMwNjExNzQ0KTtcbiAgICAgICAgYyA9IG1kNV9paShjLCBkLCBhLCBiLCB4W2kgKyA2XSwgMTUsIC0xNTYwMTk4MzgwKTtcbiAgICAgICAgYiA9IG1kNV9paShiLCBjLCBkLCBhLCB4W2kgKyAxM10sIDIxLCAxMzA5MTUxNjQ5KTtcbiAgICAgICAgYSA9IG1kNV9paShhLCBiLCBjLCBkLCB4W2kgKyA0XSwgNiwgLTE0NTUyMzA3MCk7XG4gICAgICAgIGQgPSBtZDVfaWkoZCwgYSwgYiwgYywgeFtpICsgMTFdLCAxMCwgLTExMjAyMTAzNzkpO1xuICAgICAgICBjID0gbWQ1X2lpKGMsIGQsIGEsIGIsIHhbaSArIDJdLCAxNSwgNzE4Nzg3MjU5KTtcbiAgICAgICAgYiA9IG1kNV9paShiLCBjLCBkLCBhLCB4W2kgKyA5XSwgMjEsIC0zNDM0ODU1NTEpO1xuXG4gICAgICAgIGEgPSBzYWZlX2FkZChhLCBvbGRhKTtcbiAgICAgICAgYiA9IHNhZmVfYWRkKGIsIG9sZGIpO1xuICAgICAgICBjID0gc2FmZV9hZGQoYywgb2xkYyk7XG4gICAgICAgIGQgPSBzYWZlX2FkZChkLCBvbGRkKTtcbiAgICB9XG4gICAgcmV0dXJuIFthLCBiLCBjLCBkXTtcbn1cblxuZnVuY3Rpb24gbWQ1X2NtbihxLCBhLCBiLCB4LCBzLCB0KSB7XG4gICAgcmV0dXJuIHNhZmVfYWRkKGJpdF9yb2woc2FmZV9hZGQoc2FmZV9hZGQoYSwgcSksIHNhZmVfYWRkKHgsIHQpKSwgcyksIGIpO1xufVxuXG5mdW5jdGlvbiBtZDVfZmYoYSwgYiwgYywgZCwgeCwgcywgdCkge1xuICAgIHJldHVybiBtZDVfY21uKChiICYgYykgfCAoKH5iKSAmIGQpLCBhLCBiLCB4LCBzLCB0KTtcbn1cblxuZnVuY3Rpb24gbWQ1X2dnKGEsIGIsIGMsIGQsIHgsIHMsIHQpIHtcbiAgICByZXR1cm4gbWQ1X2NtbigoYiAmIGQpIHwgKGMgJiAofmQpKSwgYSwgYiwgeCwgcywgdCk7XG59XG5cbmZ1bmN0aW9uIG1kNV9oaChhLCBiLCBjLCBkLCB4LCBzLCB0KSB7XG4gICAgcmV0dXJuIG1kNV9jbW4oYiBeIGMgXiBkLCBhLCBiLCB4LCBzLCB0KTtcbn1cblxuZnVuY3Rpb24gbWQ1X2lpKGEsIGIsIGMsIGQsIHgsIHMsIHQpIHtcbiAgICByZXR1cm4gbWQ1X2NtbihjIF4gKGIgfCAofmQpKSwgYSwgYiwgeCwgcywgdCk7XG59XG5cbmZ1bmN0aW9uIHNhZmVfYWRkKHgsIHkpIHtcbiAgICB2YXIgbHN3ID0gKHggJiAweEZGRkYpICsgKHkgJiAweEZGRkYpO1xuICAgIHZhciBtc3cgPSAoeCA+PiAxNikgKyAoeSA+PiAxNikgKyAobHN3ID4+IDE2KTtcbiAgICByZXR1cm4gKG1zdyA8PCAxNikgfCAobHN3ICYgMHhGRkZGKTtcbn1cblxuZnVuY3Rpb24gYml0X3JvbChudW0sIGNudCkge1xuICAgIHJldHVybiAobnVtIDw8IGNudCkgfCAobnVtID4+PiAoMzIgLSBjbnQpKTtcbn1cblxuZnVuY3Rpb24gc3RyMmJpbmwoc3RyKSB7XG4gICAgdmFyIGJpbiA9IFtdO1xuICAgIHZhciBtYXNrID0gKDEgPDwgY2hyc3opIC0gMTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN0ci5sZW5ndGggKiBjaHJzejsgaSArPSBjaHJzeikge1xuICAgICAgICBiaW5baSA+PiA1XSB8PSAoc3RyLmNoYXJDb2RlQXQoaSAvIGNocnN6KSAmIG1hc2spIDw8IChpICUgMzIpO1xuICAgIH1cbiAgICByZXR1cm4gYmluO1xufVxuXG5mdW5jdGlvbiBiaW5sMmhleChiaW5hcnJheSkge1xuICAgIHZhciBoZXhfdGFiID0gaGV4Y2FzZSA/IFwiMDEyMzQ1Njc4OUFCQ0RFRlwiIDogXCIwMTIzNDU2Nzg5YWJjZGVmXCI7XG4gICAgdmFyIHN0ciA9IFwiXCI7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBiaW5hcnJheS5sZW5ndGggKiA0OyBpKyspIHtcbiAgICAgICAgc3RyICs9IGhleF90YWIuY2hhckF0KChiaW5hcnJheVtpID4+IDJdID4+ICgoaSAlIDQpICogOCArIDQpKSAmIDB4RikgKyBoZXhfdGFiLmNoYXJBdCgoYmluYXJyYXlbaSA+PiAyXSA+PiAoKGkgJSA0KSAqIDgpKSAmIDB4Rik7XG4gICAgfVxuICAgIHJldHVybiBzdHI7XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBoZXhfbWQ1OiBoZXhfbWQ1XG59OyIsIi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAnc3VtbWFyeV93aWRnZXRfX3JlYWN0aW9ucyc6ICdSZWFjdGlvbnMnLFxuICAgICdzdW1tYXJ5X3dpZGdldF9fcmVhY3Rpb25zX29uZSc6ICcxIFJlYWN0aW9uJyxcbiAgICAnc3VtbWFyeV93aWRnZXRfX3JlYWN0aW9uc19tYW55JzogJ3swfSBSZWFjdGlvbnMnLFxuXG4gICAgJ3JlYWN0aW9uc193aWRnZXRfX3RpdGxlJzogJ1JlYWN0aW9ucycsXG4gICAgJ3JlYWN0aW9uc193aWRnZXRfX3RpdGxlX3RoaW5rJzogJ1doYXQgZG8geW91IHRoaW5rPycsXG4gICAgJ3JlYWN0aW9uc193aWRnZXRfX3RpdGxlX3RoYW5rcyc6ICdUaGFua3MgZm9yIHlvdXIgcmVhY3Rpb24hJyxcbiAgICAncmVhY3Rpb25zX3dpZGdldF9fdGl0bGVfc2lnbmluJzogJ1NpZ24gaW4gUmVxdWlyZWQnLFxuICAgICdyZWFjdGlvbnNfd2lkZ2V0X190aXRsZV9ibG9ja2VkJzogJ0Jsb2NrZWQgUmVhY3Rpb24nLFxuICAgICdyZWFjdGlvbnNfd2lkZ2V0X190aXRsZV9lcnJvcic6ICdFcnJvcicsXG4gICAgJ3JlYWN0aW9uc193aWRnZXRfX2JhY2snOiAnQmFjaycsXG5cbiAgICAncmVhY3Rpb25zX3BhZ2VfX25vX3JlYWN0aW9ucyc6ICdObyByZWFjdGlvbnMgeWV0IScsXG4gICAgJ3JlYWN0aW9uc19wYWdlX190aGluayc6ICdXaGF0IGRvIHlvdSB0aGluaz8nLFxuXG4gICAgJ21lZGlhX2luZGljYXRvcl9fdGhpbmsnOiAnV2hhdCBkbyB5b3UgdGhpbms/JyxcblxuICAgICdwb3B1cF93aWRnZXRfX3RoaW5rJzogJ1doYXQgZG8geW91IHRoaW5rPycsXG5cbiAgICAnZGVmYXVsdHNfcGFnZV9fYWRkJzogJysgQWRkIFlvdXIgT3duJyxcbiAgICAnZGVmYXVsdHNfcGFnZV9fb2snOiAnb2snLFxuXG4gICAgJ2NvbmZpcm1hdGlvbl9wYWdlX19zaGFyZSc6ICdTaGFyZSB5b3VyIHJlYWN0aW9uOicsXG5cbiAgICAnY29tbWVudHNfcGFnZV9faGVhZGVyJzogJyh7MH0pIENvbW1lbnRzOicsXG5cbiAgICAnY29tbWVudF9hcmVhX19hZGQnOiAnQ29tbWVudCcsXG4gICAgJ2NvbW1lbnRfYXJlYV9fcGxhY2Vob2xkZXInOiAnQWRkIGNvbW1lbnRzIG9yICNoYXNodGFncycsXG4gICAgJ2NvbW1lbnRfYXJlYV9fdGhhbmtzJzogJ1RoYW5rcyBmb3IgeW91ciBjb21tZW50LicsXG4gICAgJ2NvbW1lbnRfYXJlYV9fY291bnQnOiAnPHNwYW4gY2xhc3M9XCJhbnRlbm5hLWNvbW1lbnQtY291bnRcIj48L3NwYW4+IGNoYXJhY3RlcnMgbGVmdCcsXG5cbiAgICAnbG9jYXRpb25zX3BhZ2VfX3BhZ2VsZXZlbCc6ICdUbyB0aGlzIHdob2xlIHBhZ2UnLFxuICAgICdsb2NhdGlvbnNfcGFnZV9fY291bnRfb25lJzogJzxzcGFuIGNsYXNzPVwiYW50ZW5uYS1sb2NhdGlvbi1jb3VudFwiPjE8L3NwYW4+PGJyPnJlYWN0aW9uJyxcbiAgICAnbG9jYXRpb25zX3BhZ2VfX2NvdW50X21hbnknOiAnPHNwYW4gY2xhc3M9XCJhbnRlbm5hLWxvY2F0aW9uLWNvdW50XCI+ezB9PC9zcGFuPjxicj5yZWFjdGlvbnMnLFxuICAgICdsb2NhdGlvbnNfcGFnZV9fdmlkZW8nOiAnVmlkZW8nLFxuXG4gICAgJ2NhbGxfdG9fYWN0aW9uX2xhYmVsX19yZXNwb25zZXMnOiAnUmVhY3Rpb25zJyxcbiAgICAnY2FsbF90b19hY3Rpb25fbGFiZWxfX3Jlc3BvbnNlc19vbmUnOiAnMSBSZWFjdGlvbicsXG4gICAgJ2NhbGxfdG9fYWN0aW9uX2xhYmVsX19yZXNwb25zZXNfbWFueSc6ICd7MH0gUmVhY3Rpb25zJyxcblxuICAgICdibG9ja2VkX3BhZ2VfX21lc3NhZ2UxJzogJ1RoaXMgc2l0ZSBoYXMgYmxvY2tlZCBzb21lIG9yIGFsbCBvZiB0aGUgdGV4dCBpbiB0aGF0IHJlYWN0aW9uLicsXG4gICAgJ2Jsb2NrZWRfcGFnZV9fbWVzc2FnZTInOiAnUGxlYXNlIHRyeSBzb21ldGhpbmcgdGhhdCB3aWxsIGJlIG1vcmUgYXBwcm9wcmlhdGUgZm9yIHRoaXMgY29tbXVuaXR5LicsXG5cbiAgICAncGVuZGluZ19wYWdlX19tZXNzYWdlX2FwcGVhcic6ICdZb3VyIHJlYWN0aW9uIHdpbGwgYXBwZWFyIG9uY2UgaXQgaXMgcmV2aWV3ZWQuIEFsbCBuZXcgcmVhY3Rpb25zIG11c3QgbWVldCBvdXIgY29tbXVuaXR5IGd1aWRlbGluZXMuJyxcblxuICAgICdlcnJvcl9wYWdlX19tZXNzYWdlJzogJ09vcHMhIFdlIHJlYWxseSB2YWx1ZSB5b3VyIGZlZWRiYWNrLCBidXQgc29tZXRoaW5nIHdlbnQgd3JvbmcuJyxcblxuICAgICd0YXBfaGVscGVyX19wcm9tcHQnOiAnVGFwIGFueSBwYXJhZ3JhcGggdG8gcmVzcG9uZCEnLFxuICAgICd0YXBfaGVscGVyX19jbG9zZSc6ICdDbG9zZSdcbn07IiwiLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgICdzdW1tYXJ5X3dpZGdldF9fcmVhY3Rpb25zJzogJ1JlYWNjaW9uZXMnLFxuICAgICdzdW1tYXJ5X3dpZGdldF9fcmVhY3Rpb25zX29uZSc6ICcxIFJlYWNjacOzbicsXG4gICAgJ3N1bW1hcnlfd2lkZ2V0X19yZWFjdGlvbnNfbWFueSc6ICd7MH0gUmVhY2Npb25lcycsXG5cbiAgICAncmVhY3Rpb25zX3dpZGdldF9fdGl0bGUnOiAnUmVhY2Npb25lcycsXG4gICAgJ3JlYWN0aW9uc193aWRnZXRfX3RpdGxlX3RoaW5rJzogJ8K/UXXDqSBwaWVuc2FzPycsXG4gICAgJ3JlYWN0aW9uc193aWRnZXRfX3RpdGxlX3RoYW5rcyc6ICfCoUdyYWNpYXMgcG9yIHR1IHJlYWNjacOzbiEnLFxuICAgICdyZWFjdGlvbnNfd2lkZ2V0X190aXRsZV9zaWduaW4nOiAnU2lnbiBpbiBSZXF1aXJlZCcsIC8vIFRPRE86IG5lZWQgYSB0cmFuc2xhdGlvblxuICAgICdyZWFjdGlvbnNfd2lkZ2V0X190aXRsZV9ibG9ja2VkJzogJ0Jsb2NrZWQgUmVhY3Rpb24nLCAvLyBUT0RPOiBuZWVkIGEgdHJhbnNsYXRpb25cbiAgICAncmVhY3Rpb25zX3dpZGdldF9fdGl0bGVfZXJyb3InOiAnRXJyb3InLCAvLyBUT0RPOiBuZWVkIGEgdHJhbnNsYXRpb25cbiAgICAncmVhY3Rpb25zX3dpZGdldF9fYmFjayc6ICdWb2x2ZXInLFxuXG4gICAgJ3JlYWN0aW9uc19wYWdlX19ub19yZWFjdGlvbnMnOiAnwqFObyByZWFjY2lvbmVzIScsIC8vIFRPRE86IG5lZWQgYSB0cmFuc2xhdGlvbiBvZiBcIk5vIHJlYWN0aW9ucyB5ZXQhXCJcbiAgICAncmVhY3Rpb25zX3BhZ2VfX3RoaW5rJzogJ8K/UXXDqSBwaWVuc2FzPycsXG5cbiAgICAnbWVkaWFfaW5kaWNhdG9yX190aGluayc6ICfCv1F1w6kgcGllbnNhcz8nLFxuXG4gICAgJ3BvcHVwX3dpZGdldF9fdGhpbmsnOiAnwr9RdcOpIHBpZW5zYXM/JyxcblxuICAgICdkZWZhdWx0c19wYWdlX19hZGQnOiAnKyBBw7FhZGUgbG8gdHV5bycsXG4gICAgJ2RlZmF1bHRzX3BhZ2VfX29rJzogJ29rJyxcblxuICAgICdjb25maXJtYXRpb25fcGFnZV9fc2hhcmUnOiAnQ29tcGFydGUgdHUgcmVhY2Npw7NuOicsXG5cbiAgICAnY29tbWVudHNfcGFnZV9faGVhZGVyJzogJyh7MH0pIENvbWVudGFzOicsXG5cbiAgICAnY29tbWVudF9hcmVhX19hZGQnOiAnQ29tZW50YScsXG4gICAgJ2NvbW1lbnRfYXJlYV9fcGxhY2Vob2xkZXInOiAnQcOxYWRlIGNvbWVudGFyaW9zIG8gI2hhc2h0YWdzJyxcbiAgICAnY29tbWVudF9hcmVhX190aGFua3MnOiAnR3JhY2lhcyBwb3IgdHUgcmVhY2Npw7NuLicsXG4gICAgJ2NvbW1lbnRfYXJlYV9fY291bnQnOiAnUXVlZGFuIDxzcGFuIGNsYXNzPVwiYW50ZW5uYS1jb21tZW50LWNvdW50XCI+PC9zcGFuPiBjYXJhY3RlcmVzJyxcblxuICAgICdsb2NhdGlvbnNfcGFnZV9fcGFnZWxldmVsJzogJ0EgZXN0YSBww6FnaW5hJywgLy8gVE9ETzogbmVlZCBhIHRyYW5zbGF0aW9uIG9mIFwiVG8gdGhpcyB3aG9sZSBwYWdlXCJcbiAgICAnbG9jYXRpb25zX3BhZ2VfX2NvdW50X29uZSc6ICc8c3BhbiBjbGFzcz1cImFudGVubmEtbG9jYXRpb24tY291bnRcIj4xPC9zcGFuPjxicj5yZWFjY2nDs24nLFxuICAgICdsb2NhdGlvbnNfcGFnZV9fY291bnRfbWFueSc6ICc8c3BhbiBjbGFzcz1cImFudGVubmEtbG9jYXRpb24tY291bnRcIj57MH08L3NwYW4+PGJyPnJlYWNjaW9uZXMnLFxuICAgICdsb2NhdGlvbnNfcGFnZV9fdmlkZW8nOiAnVmlkZW8nLFxuXG4gICAgJ2NhbGxfdG9fYWN0aW9uX2xhYmVsX19yZXNwb25zZXMnOiAnUmVhY2Npb25lcycsXG4gICAgJ2NhbGxfdG9fYWN0aW9uX2xhYmVsX19yZXNwb25zZXNfb25lJzogJzEgUmVhY2Npw7NuJyxcbiAgICAnY2FsbF90b19hY3Rpb25fbGFiZWxfX3Jlc3BvbnNlc19tYW55JzogJ3swfSBSZWFjY2lvbmVzJyxcblxuICAgICdibG9ja2VkX3BhZ2VfX21lc3NhZ2UxJzogJ1RoaXMgc2l0ZSBoYXMgYmxvY2tlZCBzb21lIG9yIGFsbCBvZiB0aGUgdGV4dCBpbiB0aGF0IHJlYWN0aW9uLicsIC8vIFRPRE86IHRyYW5zbGF0aW9uXG4gICAgJ2Jsb2NrZWRfcGFnZV9fbWVzc2FnZTInOiAnUGxlYXNlIHRyeSBzb21ldGhpbmcgdGhhdCB3aWxsIGJlIG1vcmUgYXBwcm9wcmlhdGUgZm9yIHRoaXMgY29tbXVuaXR5LicsIC8vIFRPRE86IHRyYW5zbGF0aW9uXG5cbiAgICAncGVuZGluZ19wYWdlX19tZXNzYWdlX2FwcGVhcic6ICdZb3VyIHJlYWN0aW9uIHdpbGwgYXBwZWFyIG9uY2UgaXQgaXMgcmV2aWV3ZWQuIEFsbCBuZXcgcmVhY3Rpb25zIG11c3QgbWVldCBvdXIgY29tbXVuaXR5IGd1aWRlbGluZXMuJywgLy8gVE9ETzogdHJhbnNsYXRpb25cblxuICAgICdlcnJvcl9wYWdlX19tZXNzYWdlJzogJ09vcHMhIFdlIHJlYWxseSB2YWx1ZSB5b3VyIGZlZWRiYWNrLCBidXQgc29tZXRoaW5nIHdlbnQgd3JvbmcuJywgLy8gVE9ETzogdHJhbnNsYXRpb25cblxuICAgICd0YXBfaGVscGVyX19wcm9tcHQnOiAnwqFUb2NhIHVuIHDDoXJyYWZvIHBhcmEgb3BpbmFyIScsXG4gICAgJ3RhcF9oZWxwZXJfX2Nsb3NlJzogJ1ZvbHZlcidcbn07IiwidmFyIEdyb3VwU2V0dGluZ3MgPSByZXF1aXJlKCcuLi9ncm91cC1zZXR0aW5ncycpO1xuXG52YXIgRW5nbGlzaE1lc3NhZ2VzID0gcmVxdWlyZSgnLi9tZXNzYWdlcy1lbicpO1xudmFyIFNwYW5pc2hNZXNzYWdlcyA9IHJlcXVpcmUoJy4vbWVzc2FnZXMtZXMnKTtcbnZhbGlkYXRlVHJhbnNsYXRpb25zKCk7XG5cbmZ1bmN0aW9uIHZhbGlkYXRlVHJhbnNsYXRpb25zKCkge1xuICAgIGZvciAodmFyIGVuZ2xpc2hLZXkgaW4gRW5nbGlzaE1lc3NhZ2VzKSB7XG4gICAgICAgIGlmIChFbmdsaXNoTWVzc2FnZXMuaGFzT3duUHJvcGVydHkoZW5nbGlzaEtleSkpIHtcbiAgICAgICAgICAgIGlmICghU3BhbmlzaE1lc3NhZ2VzLmhhc093blByb3BlcnR5KGVuZ2xpc2hLZXkpKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnQW50ZW5uYSB3YXJuaW5nOiBTcGFuaXNoIHRyYW5zbGF0aW9uIG1pc3NpbmcgZm9yIGtleSAnICsgZW5nbGlzaEtleSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGdldE1lc3NhZ2Uoa2V5LCB2YWx1ZXMpIHtcbiAgICB2YXIgc3RyaW5nID0gZ2V0TG9jYWxpemVkU3RyaW5nKGtleSwgR3JvdXBTZXR0aW5ncy5nZXQoKS5sYW5ndWFnZSgpKTtcbiAgICBpZiAodmFsdWVzKSB7XG4gICAgICAgIHJldHVybiBmb3JtYXQoc3RyaW5nLCB2YWx1ZXMpO1xuICAgIH1cbiAgICByZXR1cm4gc3RyaW5nO1xufVxuXG5mdW5jdGlvbiBnZXRMb2NhbGl6ZWRTdHJpbmcoa2V5LCBsYW5nKSB7XG4gICAgdmFyIHN0cmluZztcbiAgICBzd2l0Y2gobGFuZykge1xuICAgICAgICBjYXNlICdlbic6XG4gICAgICAgICAgICBzdHJpbmcgPSBFbmdsaXNoTWVzc2FnZXNba2V5XTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdlcyc6XG4gICAgICAgICAgICBzdHJpbmcgPSBTcGFuaXNoTWVzc2FnZXNba2V5XTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgLy8gVE9ETzogcmV2aWV3XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnSW52YWxpZCBsYW5ndWFnZSBzcGVjaWZpZWQgaW4gQW50ZW5uYSBncm91cCBzZXR0aW5ncy4nKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBpZiAoIXN0cmluZykgeyAvLyBEZWZhdWx0IHRvIEVuZ2xpc2hcbiAgICAgICAgc3RyaW5nID0gRW5nbGlzaE1lc3NhZ2VzW2tleV07XG4gICAgfVxuICAgIC8vIFRPRE86IGhhbmRsZSBtaXNzaW5nIGtleVxuICAgIHJldHVybiBzdHJpbmc7XG59XG5cbmZ1bmN0aW9uIGZvcm1hdChzdHJpbmcsIHZhbHVlcykge1xuICAgIC8vIFBvcHVsYXIsIHNpbXBsZSBhbGdvcml0aG0gZnJvbSBodHRwOi8vamF2YXNjcmlwdC5jcm9ja2ZvcmQuY29tL3JlbWVkaWFsLmh0bWxcbiAgICByZXR1cm4gc3RyaW5nLnJlcGxhY2UoXG4gICAgICAgIC9cXHsoW157fV0qKVxcfS9nLFxuICAgICAgICBmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICAgICAgdmFyIHIgPSB2YWx1ZXNbYl07XG4gICAgICAgICAgICByZXR1cm4gdHlwZW9mIHIgPT09ICdzdHJpbmcnIHx8IHR5cGVvZiByID09PSAnbnVtYmVyJyA/IHIgOiBhO1xuICAgICAgICB9XG4gICAgKTtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGdldE1lc3NhZ2U6IGdldE1lc3NhZ2Vcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG5cbmZ1bmN0aW9uIG1ha2VNb3ZlYWJsZSgkZWxlbWVudCwgJGRyYWdIYW5kbGUpIHtcbiAgICAkZHJhZ0hhbmRsZS5vbignbW91c2Vkb3duLmFudGVubmEnLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICB2YXIgb2Zmc2V0WCA9IGV2ZW50LnBhZ2VYIC0gJGRyYWdIYW5kbGUub2Zmc2V0KCkubGVmdDtcbiAgICAgICAgdmFyIG9mZnNldFkgPSBldmVudC5wYWdlWSAtICRkcmFnSGFuZGxlLm9mZnNldCgpLnRvcDtcbiAgICAgICAgJChkb2N1bWVudCkub24oJ21vdXNldXAuYW50ZW5uYScsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICAkKGRvY3VtZW50KS5vZmYoJ21vdXNlbW92ZS5hbnRlbm5hJyk7XG4gICAgICAgIH0pO1xuICAgICAgICAkKGRvY3VtZW50KS5vbignbW91c2Vtb3ZlLmFudGVubmEnLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgJGVsZW1lbnQuY3NzKHtcbiAgICAgICAgICAgICAgICB0b3A6IGV2ZW50LnBhZ2VZIC0gb2Zmc2V0WSxcbiAgICAgICAgICAgICAgICBsZWZ0OiBldmVudC5wYWdlWCAtIG9mZnNldFhcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgbWFrZU1vdmVhYmxlOiBtYWtlTW92ZWFibGVcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgQ2FsbGJhY2tTdXBwb3J0ID0gcmVxdWlyZSgnLi9jYWxsYmFjay1zdXBwb3J0Jyk7XG52YXIgUmFuZ2UgPSByZXF1aXJlKCcuL3JhbmdlJyk7XG52YXIgV2lkZ2V0QnVja2V0ID0gcmVxdWlyZSgnLi93aWRnZXQtYnVja2V0Jyk7XG5cbi8vIFRPRE86IGRldGVjdCB3aGV0aGVyIHRoZSBicm93c2VyIHN1cHBvcnRzIE11dGF0aW9uT2JzZXJ2ZXIgYW5kIGZhbGxiYWNrIHRvIE11dGF0aW9ucyBFdmVudHNcblxudmFyIGFkZGl0aW9uTGlzdGVuZXI7XG52YXIgcmVtb3ZhbExpc3RlbmVyO1xuXG52YXIgYXR0cmlidXRlT2JzZXJ2ZXJzID0gW107XG5cbmZ1bmN0aW9uIGFkZEFkZGl0aW9uTGlzdGVuZXIoY2FsbGJhY2spIHtcbiAgICBpZiAoIWFkZGl0aW9uTGlzdGVuZXIpIHtcbiAgICAgICAgYWRkaXRpb25MaXN0ZW5lciA9IGNyZWF0ZUFkZGl0aW9uTGlzdGVuZXIoKTtcbiAgICB9XG4gICAgYWRkaXRpb25MaXN0ZW5lci5hZGRDYWxsYmFjayhjYWxsYmFjayk7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUFkZGl0aW9uTGlzdGVuZXIoKSB7XG4gICAgdmFyIGNhbGxiYWNrU3VwcG9ydCA9IENhbGxiYWNrU3VwcG9ydC5jcmVhdGUoKTtcbiAgICB2YXIgb2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcihmdW5jdGlvbihtdXRhdGlvblJlY29yZHMpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtdXRhdGlvblJlY29yZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBhZGRlZEVsZW1lbnRzID0gZmlsdGVyZWRFbGVtZW50cyhtdXRhdGlvblJlY29yZHNbaV0uYWRkZWROb2Rlcyk7XG4gICAgICAgICAgICBpZiAoYWRkZWRFbGVtZW50cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNhbGxiYWNrcyA9IGNhbGxiYWNrU3VwcG9ydC5nZXQoKTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGNhbGxiYWNrcy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFja3Nbal0oYWRkZWRFbGVtZW50cyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG4gICAgdmFyIGJvZHkgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnYm9keScpWzBdO1xuICAgIG9ic2VydmVyLm9ic2VydmUoYm9keSwge1xuICAgICAgICBjaGlsZExpc3Q6IHRydWUsXG4gICAgICAgIGF0dHJpYnV0ZXM6IGZhbHNlLFxuICAgICAgICBjaGFyYWN0ZXJEYXRhOiBmYWxzZSxcbiAgICAgICAgc3VidHJlZTogdHJ1ZSxcbiAgICAgICAgYXR0cmlidXRlT2xkVmFsdWU6IGZhbHNlLFxuICAgICAgICBjaGFyYWN0ZXJEYXRhT2xkVmFsdWU6IGZhbHNlXG4gICAgfSk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdGVhcmRvd246IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY2FsbGJhY2tTdXBwb3J0LnRlYXJkb3duKCk7XG4gICAgICAgICAgICBvYnNlcnZlci5kaXNjb25uZWN0KCk7XG4gICAgICAgIH0sXG4gICAgICAgIGFkZENhbGxiYWNrOiBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICAgICAgY2FsbGJhY2tTdXBwb3J0LmFkZChjYWxsYmFjayk7XG4gICAgICAgIH0sXG4gICAgICAgIHJlbW92ZUNhbGxiYWNrOiBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICAgICAgY2FsbGJhY2tTdXBwb3J0LnJlbW92ZShjYWxsYmFjayk7XG4gICAgICAgIH1cbiAgICB9O1xufVxuXG5mdW5jdGlvbiBhZGRSZW1vdmFsTGlzdGVuZXIoY2FsbGJhY2spIHtcbiAgICBpZiAoIXJlbW92YWxMaXN0ZW5lcikge1xuICAgICAgICByZW1vdmFsTGlzdGVuZXIgPSBjcmVhdGVSZW1vdmFsTGlzdGVuZXIoKTtcbiAgICB9XG4gICAgcmVtb3ZhbExpc3RlbmVyLmFkZENhbGxiYWNrKGNhbGxiYWNrKTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlUmVtb3ZhbExpc3RlbmVyKCkge1xuICAgIHZhciBjYWxsYmFja1N1cHBvcnQgPSBDYWxsYmFja1N1cHBvcnQuY3JlYXRlKCk7XG4gICAgdmFyIG9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoZnVuY3Rpb24obXV0YXRpb25SZWNvcmRzKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbXV0YXRpb25SZWNvcmRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgcmVtb3ZlZEVsZW1lbnRzID0gZmlsdGVyZWRFbGVtZW50cyhtdXRhdGlvblJlY29yZHNbaV0ucmVtb3ZlZE5vZGVzKTtcbiAgICAgICAgICAgIGlmIChyZW1vdmVkRWxlbWVudHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHZhciBjYWxsYmFja3MgPSBjYWxsYmFja1N1cHBvcnQuZ2V0KCk7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBjYWxsYmFja3MubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2tzW2pdKHJlbW92ZWRFbGVtZW50cyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG4gICAgdmFyIGJvZHkgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnYm9keScpWzBdO1xuICAgIG9ic2VydmVyLm9ic2VydmUoYm9keSwge1xuICAgICAgICBjaGlsZExpc3Q6IHRydWUsXG4gICAgICAgIGF0dHJpYnV0ZXM6IGZhbHNlLFxuICAgICAgICBjaGFyYWN0ZXJEYXRhOiBmYWxzZSxcbiAgICAgICAgc3VidHJlZTogdHJ1ZSxcbiAgICAgICAgYXR0cmlidXRlT2xkVmFsdWU6IGZhbHNlLFxuICAgICAgICBjaGFyYWN0ZXJEYXRhT2xkVmFsdWU6IGZhbHNlXG4gICAgfSk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdGVhcmRvd246IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY2FsbGJhY2tTdXBwb3J0LnRlYXJkb3duKCk7XG4gICAgICAgICAgICBvYnNlcnZlci5kaXNjb25uZWN0KCk7XG4gICAgICAgIH0sXG4gICAgICAgIGFkZENhbGxiYWNrOiBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICAgICAgY2FsbGJhY2tTdXBwb3J0LmFkZChjYWxsYmFjayk7XG4gICAgICAgIH0sXG4gICAgICAgIHJlbW92ZUNhbGxiYWNrOiBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICAgICAgY2FsbGJhY2tTdXBwb3J0LnJlbW92ZShjYWxsYmFjayk7XG4gICAgICAgIH1cbiAgICB9O1xufVxuXG4vLyBGaWx0ZXIgdGhlIHNldCBvZiBub2RlcyB0byBlbGltaW5hdGUgYW55dGhpbmcgaW5zaWRlIG91ciBvd24gRE9NIGVsZW1lbnRzIChvdGhlcndpc2UsIHdlIGdlbmVyYXRlIGEgdG9uIG9mIGNoYXR0ZXIpXG5mdW5jdGlvbiBmaWx0ZXJlZEVsZW1lbnRzKG5vZGVMaXN0KSB7XG4gICAgdmFyIGZpbHRlcmVkID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBub2RlTGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgbm9kZSA9IG5vZGVMaXN0W2ldO1xuICAgICAgICBpZiAobm9kZS5ub2RlVHlwZSA9PT0gMSkgeyAvLyBPbmx5IGVsZW1lbnQgbm9kZXMuIChodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvTm9kZS9ub2RlVHlwZSlcbiAgICAgICAgICAgIHZhciAkZWxlbWVudCA9ICQobm9kZSk7XG4gICAgICAgICAgICBpZiAoJGVsZW1lbnQuY2xvc2VzdChSYW5nZS5ISUdITElHSFRfU0VMRUNUT1IgKyAnLCAuYW50ZW5uYSwgJyArIFdpZGdldEJ1Y2tldC5zZWxlY3RvcigpKS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICBmaWx0ZXJlZC5wdXNoKCRlbGVtZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmlsdGVyZWQ7XG59XG5cbmZ1bmN0aW9uIGFkZE9uZVRpbWVBdHRyaWJ1dGVMaXN0ZW5lcihub2RlLCBhdHRyaWJ1dGVzLCBjYWxsYmFjaykge1xuICAgIHZhciBvYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKGZ1bmN0aW9uKG11dGF0aW9uUmVjb3Jkcykge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG11dGF0aW9uUmVjb3Jkcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIHRhcmdldCA9IG11dGF0aW9uUmVjb3Jkc1tpXS50YXJnZXQ7XG4gICAgICAgICAgICBjYWxsYmFjayh0YXJnZXQpO1xuICAgICAgICAgICAgb2JzZXJ2ZXIuZGlzY29ubmVjdCgpO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgb2JzZXJ2ZXIub2JzZXJ2ZShub2RlLCB7XG4gICAgICAgIGNoaWxkTGlzdDogZmFsc2UsXG4gICAgICAgIGF0dHJpYnV0ZXM6IHRydWUsXG4gICAgICAgIGNoYXJhY3RlckRhdGE6IGZhbHNlLFxuICAgICAgICBzdWJ0cmVlOiBmYWxzZSxcbiAgICAgICAgYXR0cmlidXRlT2xkVmFsdWU6IGZhbHNlLFxuICAgICAgICBjaGFyYWN0ZXJEYXRhT2xkVmFsdWU6IGZhbHNlLFxuICAgICAgICBhdHRyaWJ1dGVGaWx0ZXI6IGF0dHJpYnV0ZXNcbiAgICB9KTtcbiAgICBhdHRyaWJ1dGVPYnNlcnZlcnMucHVzaChvYnNlcnZlcik7XG59XG5cbmZ1bmN0aW9uIHRlYXJkb3duKCkge1xuICAgIGlmIChhZGRpdGlvbkxpc3RlbmVyKSB7XG4gICAgICAgIGFkZGl0aW9uTGlzdGVuZXIudGVhcmRvd24oKTtcbiAgICAgICAgYWRkaXRpb25MaXN0ZW5lciA9IHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBpZiAocmVtb3ZhbExpc3RlbmVyKSB7XG4gICAgICAgIHJlbW92YWxMaXN0ZW5lci50ZWFyZG93bigpO1xuICAgICAgICByZW1vdmFsTGlzdGVuZXIgPSB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhdHRyaWJ1dGVPYnNlcnZlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgYXR0cmlidXRlT2JzZXJ2ZXJzW2ldLmRpc2Nvbm5lY3QoKTtcbiAgICB9XG4gICAgYXR0cmlidXRlT2JzZXJ2ZXJzID0gW107XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBhZGRBZGRpdGlvbkxpc3RlbmVyOiBhZGRBZGRpdGlvbkxpc3RlbmVyLFxuICAgIGFkZFJlbW92YWxMaXN0ZW5lcjogYWRkUmVtb3ZhbExpc3RlbmVyLFxuICAgIGFkZE9uZVRpbWVBdHRyaWJ1dGVMaXN0ZW5lcjogYWRkT25lVGltZUF0dHJpYnV0ZUxpc3RlbmVyLFxuICAgIHRlYXJkb3duOiB0ZWFyZG93blxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcblxuZnVuY3Rpb24gY29tcHV0ZVRvcExldmVsUGFnZVRpdGxlKCkge1xuICAgIC8vIFRPRE86IFRoaXMgc2hvdWxkIGJlIGEgY29uZmlndXJhYmxlIGdyb3VwIHNldHRpbmcgbGlrZSB0aGUgb3RoZXIgcGFnZSBwcm9wZXJ0aWVzLlxuICAgIHJldHVybiBnZXRBdHRyaWJ1dGVWYWx1ZSgnbWV0YVtwcm9wZXJ0eT1cIm9nOnRpdGxlXCJdJywgJ2NvbnRlbnQnKSB8fCAkKCd0aXRsZScpLnRleHQoKS50cmltKCk7XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVQYWdlVGl0bGUoJHBhZ2UsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgcGFnZVRpdGxlID0gJHBhZ2UuZmluZChncm91cFNldHRpbmdzLnBhZ2VMaW5rU2VsZWN0b3IoKSkudGV4dCgpLnRyaW0oKTtcbiAgICBpZiAocGFnZVRpdGxlID09PSAnJykge1xuICAgICAgICBwYWdlVGl0bGUgPSBjb21wdXRlVG9wTGV2ZWxQYWdlVGl0bGUoKTtcbiAgICB9XG4gICAgcmV0dXJuIHBhZ2VUaXRsZTtcbn1cblxuZnVuY3Rpb24gY29tcHV0ZVRvcExldmVsUGFnZUltYWdlKGdyb3VwU2V0dGluZ3MpIHtcbiAgICByZXR1cm4gZ2V0QXR0cmlidXRlVmFsdWUoZ3JvdXBTZXR0aW5ncy5wYWdlSW1hZ2VTZWxlY3RvcigpLCBncm91cFNldHRpbmdzLnBhZ2VJbWFnZUF0dHJpYnV0ZSgpKTtcbn1cblxuZnVuY3Rpb24gY29tcHV0ZVBhZ2VBdXRob3IoZ3JvdXBTZXR0aW5ncykge1xuICAgIHJldHVybiBnZXRBdHRyaWJ1dGVWYWx1ZShncm91cFNldHRpbmdzLnBhZ2VBdXRob3JTZWxlY3RvcigpLCBncm91cFNldHRpbmdzLnBhZ2VBdXRob3JBdHRyaWJ1dGUoKSk7XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVQYWdlVG9waWNzKGdyb3VwU2V0dGluZ3MpIHtcbiAgICByZXR1cm4gZ2V0QXR0cmlidXRlVmFsdWUoZ3JvdXBTZXR0aW5ncy5wYWdlVG9waWNzU2VsZWN0b3IoKSwgZ3JvdXBTZXR0aW5ncy5wYWdlVG9waWNzQXR0cmlidXRlKCkpO1xufVxuXG5mdW5jdGlvbiBjb21wdXRlUGFnZVNpdGVTZWN0aW9uKGdyb3VwU2V0dGluZ3MpIHtcbiAgICByZXR1cm4gZ2V0QXR0cmlidXRlVmFsdWUoZ3JvdXBTZXR0aW5ncy5wYWdlU2l0ZVNlY3Rpb25TZWxlY3RvcigpLCBncm91cFNldHRpbmdzLnBhZ2VTaXRlU2VjdGlvbkF0dHJpYnV0ZSgpKTtcbn1cblxuZnVuY3Rpb24gZ2V0QXR0cmlidXRlVmFsdWUoZWxlbWVudFNlbGVjdG9yLCBhdHRyaWJ1dGVTZWxlY3Rvcikge1xuICAgIHZhciB2YWx1ZSA9ICcnO1xuICAgIGlmIChlbGVtZW50U2VsZWN0b3IgJiYgYXR0cmlidXRlU2VsZWN0b3IpIHtcbiAgICAgICAgdmFsdWUgPSAkKGVsZW1lbnRTZWxlY3RvcikuYXR0cihhdHRyaWJ1dGVTZWxlY3RvcikgfHwgJyc7XG4gICAgfVxuICAgIHJldHVybiB2YWx1ZS50cmltKCk7XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVUb3BMZXZlbENhbm9uaWNhbFVybChncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGNhbm9uaWNhbFVybCA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmLnNwbGl0KCcjJylbMF0udG9Mb3dlckNhc2UoKTtcbiAgICB2YXIgJGNhbm9uaWNhbExpbmsgPSAkKCdsaW5rW3JlbD1cImNhbm9uaWNhbFwiXScpO1xuICAgIGlmICgkY2Fub25pY2FsTGluay5sZW5ndGggPiAwKSB7XG4gICAgICAgIHZhciBvdmVycmlkZVVybCA9ICRjYW5vbmljYWxMaW5rLmF0dHIoJ2hyZWYnKS50cmltKCkudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgdmFyIGRvbWFpbiA9ICh3aW5kb3cubG9jYXRpb24ucHJvdG9jb2wrJy8vJyt3aW5kb3cubG9jYXRpb24uaG9zdG5hbWUrJy8nKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICBpZiAob3ZlcnJpZGVVcmwgIT09IGRvbWFpbikgeyAvLyBmYXN0Y28gZml4IChzaW5jZSB0aGV5IHNvbWV0aW1lcyByZXdyaXRlIHRoZWlyIGNhbm9uaWNhbCB0byBzaW1wbHkgYmUgdGhlaXIgZG9tYWluLilcbiAgICAgICAgICAgIGNhbm9uaWNhbFVybCA9IG92ZXJyaWRlVXJsO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZW1vdmVTdWJkb21haW5Gcm9tUGFnZVVybChjYW5vbmljYWxVcmwsIGdyb3VwU2V0dGluZ3MpO1xufVxuXG5mdW5jdGlvbiBjb21wdXRlUGFnZUVsZW1lbnRVcmwoJHBhZ2VFbGVtZW50LCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIHVybCA9ICRwYWdlRWxlbWVudC5maW5kKGdyb3VwU2V0dGluZ3MucGFnZUxpbmtTZWxlY3RvcigpKS5hdHRyKCdocmVmJyk7XG4gICAgaWYgKHVybCkge1xuICAgICAgICB1cmwgPSByZW1vdmVTdWJkb21haW5Gcm9tUGFnZVVybCh1cmwsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICB2YXIgb3JpZ2luID0gd2luZG93LmxvY2F0aW9uLm9yaWdpbiB8fCB3aW5kb3cubG9jYXRpb24ucHJvdG9jb2wgKyBcIi8vXCIgKyB3aW5kb3cubG9jYXRpb24uaG9zdG5hbWUgKyAod2luZG93LmxvY2F0aW9uLnBvcnQgPyAnOicgKyB3aW5kb3cubG9jYXRpb24ucG9ydDogJycpO1xuICAgICAgICBpZiAodXJsLmluZGV4T2Yob3JpZ2luKSAhPT0gMCAmJiAvLyBOb3QgYW4gYWJzb2x1dGUgVVJMXG4gICAgICAgICAgICAgICAgIXVybC5zdWJzdHIoMCwyKSAhPT0gJy8vJyAmJiAvLyBOb3QgcHJvdG9jb2wgcmVsYXRpdmVcbiAgICAgICAgICAgICAgICAhZ3JvdXBTZXR0aW5ncy51cmwuaWdub3JlU3ViZG9tYWluKCkpIHsgLy8gQW5kIHdlIHdlcmVuJ3Qgbm90IGlnbm9yaW5nIHRoZSBzdWJkb21haW5cbiAgICAgICAgICAgIGlmICh1cmwuc3Vic3RyKDAsMSkgPT0gJy8nKSB7XG4gICAgICAgICAgICAgICAgdXJsID0gb3JpZ2luICsgdXJsO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB1cmwgPSBvcmlnaW4gKyB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUgKyB1cmw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHVybDtcbiAgICB9XG4gICAgcmV0dXJuIGNvbXB1dGVUb3BMZXZlbENhbm9uaWNhbFVybChncm91cFNldHRpbmdzKTtcbn1cblxuLy8gVE9ETyBjb3BpZWQgZnJvbSBlbmdhZ2VfZnVsbC4gUmV2aWV3LlxuZnVuY3Rpb24gcmVtb3ZlU3ViZG9tYWluRnJvbVBhZ2VVcmwodXJsLCBncm91cFNldHRpbmdzKSB7XG4gICAgLy8gQU5ULmFjdGlvbnMucmVtb3ZlU3ViZG9tYWluRnJvbVBhZ2VVcmw6XG4gICAgLy8gaWYgXCJpZ25vcmVfc3ViZG9tYWluXCIgaXMgY2hlY2tlZCBpbiBzZXR0aW5ncywgQU5EIHRoZXkgc3VwcGx5IGEgVExELFxuICAgIC8vIHRoZW4gbW9kaWZ5IHRoZSBwYWdlIGFuZCBjYW5vbmljYWwgVVJMcyBoZXJlLlxuICAgIC8vIGhhdmUgdG8gaGF2ZSB0aGVtIHN1cHBseSBvbmUgYmVjYXVzZSB0aGVyZSBhcmUgdG9vIG1hbnkgdmFyaWF0aW9ucyB0byByZWxpYWJseSBzdHJpcCBzdWJkb21haW5zICAoLmNvbSwgLmlzLCAuY29tLmFyLCAuY28udWssIGV0YylcbiAgICBpZiAoZ3JvdXBTZXR0aW5ncy51cmwuaWdub3JlU3ViZG9tYWluKCkgPT0gdHJ1ZSAmJiBncm91cFNldHRpbmdzLnVybC5jYW5vbmljYWxEb21haW4oKSkge1xuICAgICAgICB2YXIgSE9TVERPTUFJTiA9IC9bLVxcd10rXFwuKD86Wy1cXHddK1xcLnhuLS1bLVxcd10rfFstXFx3XXsyLH18Wy1cXHddK1xcLlstXFx3XXsyfSkkL2k7XG4gICAgICAgIHZhciBzcmNBcnJheSA9IHVybC5zcGxpdCgnLycpO1xuXG4gICAgICAgIHZhciBwcm90b2NvbCA9IHNyY0FycmF5WzBdO1xuICAgICAgICBzcmNBcnJheS5zcGxpY2UoMCwzKTtcblxuICAgICAgICB2YXIgcmV0dXJuVXJsID0gcHJvdG9jb2wgKyAnLy8nICsgZ3JvdXBTZXR0aW5ncy51cmwuY2Fub25pY2FsRG9tYWluKCkgKyAnLycgKyBzcmNBcnJheS5qb2luKCcvJyk7XG5cbiAgICAgICAgcmV0dXJuIHJldHVyblVybDtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdXJsO1xuICAgIH1cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNvbXB1dGVQYWdlVXJsOiBjb21wdXRlUGFnZUVsZW1lbnRVcmwsXG4gICAgY29tcHV0ZVBhZ2VUaXRsZTogY29tcHV0ZVBhZ2VUaXRsZSxcbiAgICBjb21wdXRlVG9wTGV2ZWxQYWdlSW1hZ2U6IGNvbXB1dGVUb3BMZXZlbFBhZ2VJbWFnZSxcbiAgICBjb21wdXRlUGFnZUF1dGhvcjogY29tcHV0ZVBhZ2VBdXRob3IsXG4gICAgY29tcHV0ZVBhZ2VUb3BpY3M6IGNvbXB1dGVQYWdlVG9waWNzLFxuICAgIGNvbXB1dGVQYWdlU2l0ZVNlY3Rpb246IGNvbXB1dGVQYWdlU2l0ZVNlY3Rpb25cbn07IiwiLy8gQW50ZW5uYSBjaGFuZ2VzIGZyb20gb3JpZ2luYWwgc291cmNlIG1hcmtlZCB3aXRoIE9SSUdJTkFMXG4vLyBTZWUgdGhlIGlzc3VlIHdlIG5lZWRlZCB0byB3b3JrIGFyb3VuZCBoZXJlOiBodHRwczovL2dpdGh1Yi5jb20vcmFjdGl2ZWpzL3JhY3RpdmUtZXZlbnRzLXRhcC9pc3N1ZXMvOFxuXG4vLyBUYXAvZmFzdGNsaWNrIGV2ZW50IHBsdWdpbiBmb3IgUmFjdGl2ZS5qcyAtIGVsaW1pbmF0ZXMgdGhlIDMwMG1zIGRlbGF5IG9uIHRvdWNoLWVuYWJsZWQgZGV2aWNlcywgYW5kIG5vcm1hbGlzZXNcbi8vIGFjcm9zcyBtb3VzZSwgdG91Y2ggYW5kIHBvaW50ZXIgZXZlbnRzLlxuLy8gQXV0aG9yOiBSaWNoIEhhcnJpc1xuLy8gTGljZW5zZTogTUlUXG4vLyBTb3VyY2U6IGh0dHBzOi8vZ2l0aHViLmNvbS9yYWN0aXZlanMvcmFjdGl2ZS1ldmVudHMtdGFwXG4oZnVuY3Rpb24gKGdsb2JhbCwgZmFjdG9yeSkge1xuXHRtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcbn0odGhpcywgZnVuY3Rpb24gKCkgeyAndXNlIHN0cmljdCc7XG5cblx0dmFyIERJU1RBTkNFX1RIUkVTSE9MRCA9IDU7IC8vIG1heGltdW0gcGl4ZWxzIHBvaW50ZXIgY2FuIG1vdmUgYmVmb3JlIGNhbmNlbFxuXHR2YXIgVElNRV9USFJFU0hPTEQgPSA0MDA7IC8vIG1heGltdW0gbWlsbGlzZWNvbmRzIGJldHdlZW4gZG93biBhbmQgdXAgYmVmb3JlIGNhbmNlbFxuXG5cdGZ1bmN0aW9uIHRhcChub2RlLCBjYWxsYmFjaykge1xuXHRcdHJldHVybiBuZXcgVGFwSGFuZGxlcihub2RlLCBjYWxsYmFjayk7XG5cdH1cblxuXHRmdW5jdGlvbiBUYXBIYW5kbGVyKG5vZGUsIGNhbGxiYWNrKSB7XG5cdFx0dGhpcy5ub2RlID0gbm9kZTtcblx0XHR0aGlzLmNhbGxiYWNrID0gY2FsbGJhY2s7XG5cblx0XHR0aGlzLnByZXZlbnRNb3VzZWRvd25FdmVudHMgPSBmYWxzZTtcblxuXHRcdHRoaXMuYmluZChub2RlKTtcblx0fVxuXG5cdFRhcEhhbmRsZXIucHJvdG90eXBlID0ge1xuXHRcdGJpbmQ6IGZ1bmN0aW9uIGJpbmQobm9kZSkge1xuXHRcdFx0Ly8gbGlzdGVuIGZvciBtb3VzZS9wb2ludGVyIGV2ZW50cy4uLlxuXHRcdFx0Ly8gT1JJR0lOQUwgaWYgKHdpbmRvdy5uYXZpZ2F0b3IucG9pbnRlckVuYWJsZWQpIHtcblx0XHRcdGlmICh3aW5kb3cubmF2aWdhdG9yLnBvaW50ZXJFbmFibGVkICYmICEoJ29udG91Y2hzdGFydCcgaW4gd2luZG93KSkge1xuXHRcdFx0XHRub2RlLmFkZEV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJkb3duJywgaGFuZGxlTW91c2Vkb3duLCBmYWxzZSk7XG5cdFx0XHQvLyBPUklHSU5BTCB9IGVsc2UgaWYgKHdpbmRvdy5uYXZpZ2F0b3IubXNQb2ludGVyRW5hYmxlZCkge1xuXHRcdFx0fSBlbHNlIGlmICh3aW5kb3cubmF2aWdhdG9yLm1zUG9pbnRlckVuYWJsZWQgJiYgISgnb250b3VjaHN0YXJ0JyBpbiB3aW5kb3cpKSB7XG5cdFx0XHRcdG5vZGUuYWRkRXZlbnRMaXN0ZW5lcignTVNQb2ludGVyRG93bicsIGhhbmRsZU1vdXNlZG93biwgZmFsc2UpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0bm9kZS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBoYW5kbGVNb3VzZWRvd24sIGZhbHNlKTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gLi4uYW5kIHRvdWNoIGV2ZW50c1xuXHRcdFx0bm9kZS5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgaGFuZGxlVG91Y2hzdGFydCwgZmFsc2UpO1xuXG5cdFx0XHQvLyBuYXRpdmUgYnV0dG9ucywgYW5kIDxpbnB1dCB0eXBlPSdidXR0b24nPiBlbGVtZW50cywgc2hvdWxkIGZpcmUgYSB0YXAgZXZlbnRcblx0XHRcdC8vIHdoZW4gdGhlIHNwYWNlIGtleSBpcyBwcmVzc2VkXG5cdFx0XHRpZiAobm9kZS50YWdOYW1lID09PSAnQlVUVE9OJyB8fCBub2RlLnR5cGUgPT09ICdidXR0b24nKSB7XG5cdFx0XHRcdG5vZGUuYWRkRXZlbnRMaXN0ZW5lcignZm9jdXMnLCBoYW5kbGVGb2N1cywgZmFsc2UpO1xuXHRcdFx0fVxuXG5cdFx0XHRub2RlLl9fdGFwX2hhbmRsZXJfXyA9IHRoaXM7XG5cdFx0fSxcblx0XHRmaXJlOiBmdW5jdGlvbiBmaXJlKGV2ZW50LCB4LCB5KSB7XG5cdFx0XHR0aGlzLmNhbGxiYWNrKHtcblx0XHRcdFx0bm9kZTogdGhpcy5ub2RlLFxuXHRcdFx0XHRvcmlnaW5hbDogZXZlbnQsXG5cdFx0XHRcdHg6IHgsXG5cdFx0XHRcdHk6IHlcblx0XHRcdH0pO1xuXHRcdH0sXG5cdFx0bW91c2Vkb3duOiBmdW5jdGlvbiBtb3VzZWRvd24oZXZlbnQpIHtcblx0XHRcdHZhciBfdGhpcyA9IHRoaXM7XG5cblx0XHRcdGlmICh0aGlzLnByZXZlbnRNb3VzZWRvd25FdmVudHMpIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZXZlbnQud2hpY2ggIT09IHVuZGVmaW5lZCAmJiBldmVudC53aGljaCAhPT0gMSkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdHZhciB4ID0gZXZlbnQuY2xpZW50WDtcblx0XHRcdHZhciB5ID0gZXZlbnQuY2xpZW50WTtcblxuXHRcdFx0Ly8gVGhpcyB3aWxsIGJlIG51bGwgZm9yIG1vdXNlIGV2ZW50cy5cblx0XHRcdHZhciBwb2ludGVySWQgPSBldmVudC5wb2ludGVySWQ7XG5cblx0XHRcdHZhciBoYW5kbGVNb3VzZXVwID0gZnVuY3Rpb24gaGFuZGxlTW91c2V1cChldmVudCkge1xuXHRcdFx0XHRpZiAoZXZlbnQucG9pbnRlcklkICE9IHBvaW50ZXJJZCkge1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdF90aGlzLmZpcmUoZXZlbnQsIHgsIHkpO1xuXHRcdFx0XHRjYW5jZWwoKTtcblx0XHRcdH07XG5cblx0XHRcdHZhciBoYW5kbGVNb3VzZW1vdmUgPSBmdW5jdGlvbiBoYW5kbGVNb3VzZW1vdmUoZXZlbnQpIHtcblx0XHRcdFx0aWYgKGV2ZW50LnBvaW50ZXJJZCAhPSBwb2ludGVySWQpIHtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoTWF0aC5hYnMoZXZlbnQuY2xpZW50WCAtIHgpID49IERJU1RBTkNFX1RIUkVTSE9MRCB8fCBNYXRoLmFicyhldmVudC5jbGllbnRZIC0geSkgPj0gRElTVEFOQ0VfVEhSRVNIT0xEKSB7XG5cdFx0XHRcdFx0Y2FuY2VsKCk7XG5cdFx0XHRcdH1cblx0XHRcdH07XG5cblx0XHRcdHZhciBjYW5jZWwgPSBmdW5jdGlvbiBjYW5jZWwoKSB7XG5cdFx0XHRcdF90aGlzLm5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcignTVNQb2ludGVyVXAnLCBoYW5kbGVNb3VzZXVwLCBmYWxzZSk7XG5cdFx0XHRcdGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ01TUG9pbnRlck1vdmUnLCBoYW5kbGVNb3VzZW1vdmUsIGZhbHNlKTtcblx0XHRcdFx0ZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignTVNQb2ludGVyQ2FuY2VsJywgY2FuY2VsLCBmYWxzZSk7XG5cdFx0XHRcdF90aGlzLm5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcigncG9pbnRlcnVwJywgaGFuZGxlTW91c2V1cCwgZmFsc2UpO1xuXHRcdFx0XHRkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdwb2ludGVybW92ZScsIGhhbmRsZU1vdXNlbW92ZSwgZmFsc2UpO1xuXHRcdFx0XHRkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdwb2ludGVyY2FuY2VsJywgY2FuY2VsLCBmYWxzZSk7XG5cdFx0XHRcdF90aGlzLm5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVNb3VzZXVwLCBmYWxzZSk7XG5cdFx0XHRcdGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIGhhbmRsZU1vdXNlbW92ZSwgZmFsc2UpO1xuXHRcdFx0fTtcblxuXHRcdFx0aWYgKHdpbmRvdy5uYXZpZ2F0b3IucG9pbnRlckVuYWJsZWQpIHtcblx0XHRcdFx0dGhpcy5ub2RlLmFkZEV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJ1cCcsIGhhbmRsZU1vdXNldXAsIGZhbHNlKTtcblx0XHRcdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigncG9pbnRlcm1vdmUnLCBoYW5kbGVNb3VzZW1vdmUsIGZhbHNlKTtcblx0XHRcdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigncG9pbnRlcmNhbmNlbCcsIGNhbmNlbCwgZmFsc2UpO1xuXHRcdFx0fSBlbHNlIGlmICh3aW5kb3cubmF2aWdhdG9yLm1zUG9pbnRlckVuYWJsZWQpIHtcblx0XHRcdFx0dGhpcy5ub2RlLmFkZEV2ZW50TGlzdGVuZXIoJ01TUG9pbnRlclVwJywgaGFuZGxlTW91c2V1cCwgZmFsc2UpO1xuXHRcdFx0XHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdNU1BvaW50ZXJNb3ZlJywgaGFuZGxlTW91c2Vtb3ZlLCBmYWxzZSk7XG5cdFx0XHRcdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ01TUG9pbnRlckNhbmNlbCcsIGNhbmNlbCwgZmFsc2UpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhpcy5ub2RlLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlTW91c2V1cCwgZmFsc2UpO1xuXHRcdFx0XHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBoYW5kbGVNb3VzZW1vdmUsIGZhbHNlKTtcblx0XHRcdH1cblxuXHRcdFx0c2V0VGltZW91dChjYW5jZWwsIFRJTUVfVEhSRVNIT0xEKTtcblx0XHR9LFxuXHRcdHRvdWNoZG93bjogZnVuY3Rpb24gdG91Y2hkb3duKCkge1xuXHRcdFx0dmFyIF90aGlzMiA9IHRoaXM7XG5cblx0XHRcdHZhciB0b3VjaCA9IGV2ZW50LnRvdWNoZXNbMF07XG5cblx0XHRcdHZhciB4ID0gdG91Y2guY2xpZW50WDtcblx0XHRcdHZhciB5ID0gdG91Y2guY2xpZW50WTtcblxuXHRcdFx0dmFyIGZpbmdlciA9IHRvdWNoLmlkZW50aWZpZXI7XG5cblx0XHRcdHZhciBoYW5kbGVUb3VjaHVwID0gZnVuY3Rpb24gaGFuZGxlVG91Y2h1cChldmVudCkge1xuXHRcdFx0XHR2YXIgdG91Y2ggPSBldmVudC5jaGFuZ2VkVG91Y2hlc1swXTtcblxuXHRcdFx0XHRpZiAodG91Y2guaWRlbnRpZmllciAhPT0gZmluZ2VyKSB7XG5cdFx0XHRcdFx0Y2FuY2VsKCk7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTsgLy8gcHJldmVudCBjb21wYXRpYmlsaXR5IG1vdXNlIGV2ZW50XG5cblx0XHRcdFx0Ly8gZm9yIHRoZSBiZW5lZml0IG9mIG1vYmlsZSBGaXJlZm94IGFuZCBvbGQgQW5kcm9pZCBicm93c2Vycywgd2UgbmVlZCB0aGlzIGFic3VyZCBoYWNrLlxuXHRcdFx0XHRfdGhpczIucHJldmVudE1vdXNlZG93bkV2ZW50cyA9IHRydWU7XG5cdFx0XHRcdGNsZWFyVGltZW91dChfdGhpczIucHJldmVudE1vdXNlZG93blRpbWVvdXQpO1xuXG5cdFx0XHRcdF90aGlzMi5wcmV2ZW50TW91c2Vkb3duVGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdF90aGlzMi5wcmV2ZW50TW91c2Vkb3duRXZlbnRzID0gZmFsc2U7XG5cdFx0XHRcdH0sIDQwMCk7XG5cblx0XHRcdFx0X3RoaXMyLmZpcmUoZXZlbnQsIHgsIHkpO1xuXHRcdFx0XHRjYW5jZWwoKTtcblx0XHRcdH07XG5cblx0XHRcdHZhciBoYW5kbGVUb3VjaG1vdmUgPSBmdW5jdGlvbiBoYW5kbGVUb3VjaG1vdmUoZXZlbnQpIHtcblx0XHRcdFx0aWYgKGV2ZW50LnRvdWNoZXMubGVuZ3RoICE9PSAxIHx8IGV2ZW50LnRvdWNoZXNbMF0uaWRlbnRpZmllciAhPT0gZmluZ2VyKSB7XG5cdFx0XHRcdFx0Y2FuY2VsKCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR2YXIgdG91Y2ggPSBldmVudC50b3VjaGVzWzBdO1xuXHRcdFx0XHRpZiAoTWF0aC5hYnModG91Y2guY2xpZW50WCAtIHgpID49IERJU1RBTkNFX1RIUkVTSE9MRCB8fCBNYXRoLmFicyh0b3VjaC5jbGllbnRZIC0geSkgPj0gRElTVEFOQ0VfVEhSRVNIT0xEKSB7XG5cdFx0XHRcdFx0Y2FuY2VsKCk7XG5cdFx0XHRcdH1cblx0XHRcdH07XG5cblx0XHRcdHZhciBjYW5jZWwgPSBmdW5jdGlvbiBjYW5jZWwoKSB7XG5cdFx0XHRcdF90aGlzMi5ub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgaGFuZGxlVG91Y2h1cCwgZmFsc2UpO1xuXHRcdFx0XHR3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgaGFuZGxlVG91Y2htb3ZlLCBmYWxzZSk7XG5cdFx0XHRcdHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaGNhbmNlbCcsIGNhbmNlbCwgZmFsc2UpO1xuXHRcdFx0fTtcblxuXHRcdFx0dGhpcy5ub2RlLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgaGFuZGxlVG91Y2h1cCwgZmFsc2UpO1xuXHRcdFx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIGhhbmRsZVRvdWNobW92ZSwgZmFsc2UpO1xuXHRcdFx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoY2FuY2VsJywgY2FuY2VsLCBmYWxzZSk7XG5cblx0XHRcdHNldFRpbWVvdXQoY2FuY2VsLCBUSU1FX1RIUkVTSE9MRCk7XG5cdFx0fSxcblx0XHR0ZWFyZG93bjogZnVuY3Rpb24gdGVhcmRvd24oKSB7XG5cdFx0XHR2YXIgbm9kZSA9IHRoaXMubm9kZTtcblxuXHRcdFx0bm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKCdwb2ludGVyZG93bicsIGhhbmRsZU1vdXNlZG93biwgZmFsc2UpO1xuXHRcdFx0bm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKCdNU1BvaW50ZXJEb3duJywgaGFuZGxlTW91c2Vkb3duLCBmYWxzZSk7XG5cdFx0XHRub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIGhhbmRsZU1vdXNlZG93biwgZmFsc2UpO1xuXHRcdFx0bm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgaGFuZGxlVG91Y2hzdGFydCwgZmFsc2UpO1xuXHRcdFx0bm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKCdmb2N1cycsIGhhbmRsZUZvY3VzLCBmYWxzZSk7XG5cdFx0fVxuXHR9O1xuXG5cdGZ1bmN0aW9uIGhhbmRsZU1vdXNlZG93bihldmVudCkge1xuXHRcdHRoaXMuX190YXBfaGFuZGxlcl9fLm1vdXNlZG93bihldmVudCk7XG5cdH1cblxuXHRmdW5jdGlvbiBoYW5kbGVUb3VjaHN0YXJ0KGV2ZW50KSB7XG5cdFx0dGhpcy5fX3RhcF9oYW5kbGVyX18udG91Y2hkb3duKGV2ZW50KTtcblx0fVxuXG5cdGZ1bmN0aW9uIGhhbmRsZUZvY3VzKCkge1xuXHRcdHRoaXMuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGhhbmRsZUtleWRvd24sIGZhbHNlKTtcblx0XHR0aGlzLmFkZEV2ZW50TGlzdGVuZXIoJ2JsdXInLCBoYW5kbGVCbHVyLCBmYWxzZSk7XG5cdH1cblxuXHRmdW5jdGlvbiBoYW5kbGVCbHVyKCkge1xuXHRcdHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGhhbmRsZUtleWRvd24sIGZhbHNlKTtcblx0XHR0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2JsdXInLCBoYW5kbGVCbHVyLCBmYWxzZSk7XG5cdH1cblxuXHRmdW5jdGlvbiBoYW5kbGVLZXlkb3duKGV2ZW50KSB7XG5cdFx0aWYgKGV2ZW50LndoaWNoID09PSAzMikge1xuXHRcdFx0Ly8gc3BhY2Uga2V5XG5cdFx0XHR0aGlzLl9fdGFwX2hhbmRsZXJfXy5maXJlKCk7XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIHRhcDtcblxufSkpOyIsInZhciBSYWN0aXZlRXZlbnRzVGFwID0gcmVxdWlyZSgnLi9yYWN0aXZlLWV2ZW50cy10YXAnKTtcblxudmFyIE1lc3NhZ2VzID0gcmVxdWlyZSgnLi9tZXNzYWdlcycpO1xuXG52YXIgbm9Db25mbGljdDtcbnZhciBsb2FkZWRSYWN0aXZlO1xudmFyIGNhbGxiYWNrcyA9IFtdO1xuXG4vLyBDYXB0dXJlIGFueSBnbG9iYWwgaW5zdGFuY2Ugb2YgUmFjdGl2ZSB3aGljaCBhbHJlYWR5IGV4aXN0cyBiZWZvcmUgd2UgbG9hZCBvdXIgb3duLlxuZnVuY3Rpb24gYWJvdXRUb0xvYWQoKSB7XG4gICAgbm9Db25mbGljdCA9IHdpbmRvdy5SYWN0aXZlO1xufVxuXG4vLyBSZXN0b3JlIHRoZSBnbG9iYWwgaW5zdGFuY2Ugb2YgUmFjdGl2ZSAoaWYgYW55KSBhbmQgcGFzcyBvdXQgb3VyIHZlcnNpb24gdG8gb3VyIGNhbGxiYWNrc1xuZnVuY3Rpb24gbG9hZGVkKCkge1xuICAgIGxvYWRlZFJhY3RpdmUgPSBSYWN0aXZlO1xuICAgIHdpbmRvdy5SYWN0aXZlID0gbm9Db25mbGljdDtcbiAgICBsb2FkZWRSYWN0aXZlLmRlY29yYXRvcnMuY3NzcmVzZXQgPSBjc3NSZXNldERlY29yYXRvcjsgLy8gTWFrZSBvdXIgY3NzIHJlc2V0IGRlY29yYXRvciBhdmFpbGFibGUgdG8gYWxsIGluc3RhbmNlc1xuICAgIGxvYWRlZFJhY3RpdmUuZXZlbnRzLnRhcCA9IFJhY3RpdmVFdmVudHNUYXA7IC8vIE1ha2UgdGhlICdvbi10YXAnIGV2ZW50IHBsdWdpbiBhdmFpbGFibGUgdG8gYWxsIGluc3RhbmNlc1xuICAgIGxvYWRlZFJhY3RpdmUuZGVmYXVsdHMuZGF0YS5nZXRNZXNzYWdlID0gTWVzc2FnZXMuZ2V0TWVzc2FnZTsgLy8gTWFrZSBnZXRNZXNzYWdlIGF2YWlsYWJsZSB0byBhbGwgaW5zdGFuY2VzXG4gICAgbG9hZGVkUmFjdGl2ZS5kZWZhdWx0cy50d293YXkgPSBmYWxzZTsgLy8gQ2hhbmdlIHRoZSBkZWZhdWx0IHRvIGRpc2FibGUgdHdvLXdheSBkYXRhIGJpbmRpbmdzLlxuICAgIGxvYWRlZFJhY3RpdmUuREVCVUcgPSBmYWxzZTtcbiAgICBub3RpZnlDYWxsYmFja3MoKTtcbn1cblxuZnVuY3Rpb24gY3NzUmVzZXREZWNvcmF0b3Iobm9kZSkge1xuICAgIHRhZ05vZGVBbmRDaGlsZHJlbihub2RlLCAnYW50ZW5uYS1yZXNldCcpO1xuICAgIHJldHVybiB7IHRlYXJkb3duOiBmdW5jdGlvbigpIHt9IH07XG59XG5cbmZ1bmN0aW9uIHRhZ05vZGVBbmRDaGlsZHJlbihub2RlLCBjbGF6eikge1xuICAgIG5vZGUuY2xhc3NOYW1lID0gbm9kZS5jbGFzc05hbWUgPyBub2RlLmNsYXNzTmFtZSArICcgJyArIGNsYXp6IDogY2xheno7XG4gICAgaWYgKG5vZGUuY2hpbGRyZW4pIHsgLy8gU2FmYXJpIHJldHVybnMgdW5kZWZpbmVkIHdoZW4gYXNraW5nIGZvciBjaGlsZHJlbiBvbiBhbiBTVkcgZWxlbWVudFxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG5vZGUuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHRhZ05vZGVBbmRDaGlsZHJlbihub2RlLmNoaWxkcmVuW2ldLCBjbGF6eik7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIG5vdGlmeUNhbGxiYWNrcygpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNhbGxiYWNrcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjYWxsYmFja3NbaV0obG9hZGVkUmFjdGl2ZSk7XG4gICAgfVxuICAgIGNhbGxiYWNrcyA9IFtdO1xufVxuXG4vLyBSZWdpc3RlcnMgdGhlIGdpdmVuIGNhbGxiYWNrIHRvIGJlIG5vdGlmaWVkIHdoZW4gb3VyIHZlcnNpb24gb2YgUmFjdGl2ZSBpcyBsb2FkZWQuXG5mdW5jdGlvbiBvbkxvYWQoY2FsbGJhY2spIHtcbiAgICBpZiAobG9hZGVkUmFjdGl2ZSkge1xuICAgICAgICBjYWxsYmFjayhsb2FkZWRSYWN0aXZlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBjYWxsYmFja3MucHVzaChjYWxsYmFjayk7XG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgYWJvdXRUb0xvYWQ6IGFib3V0VG9Mb2FkLFxuICAgIGxvYWRlZDogbG9hZGVkLFxuICAgIG9uTG9hZDogb25Mb2FkXG59OyIsInZhciAkOyByZXF1aXJlKCcuL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIHJhbmd5OyByZXF1aXJlKCcuL3Jhbmd5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGxvYWRlZFJhbmd5KSB7IHJhbmd5ID0gbG9hZGVkUmFuZ3k7IH0pO1xuXG52YXIgaGlnaGxpZ2h0Q2xhc3MgPSAnYW50ZW5uYS1oaWdobGlnaHQnO1xudmFyIGhpZ2hsaWdodGVkUmFuZ2VzID0gW107XG5cbnZhciBjbGFzc0FwcGxpZXI7XG5mdW5jdGlvbiBnZXRDbGFzc0FwcGxpZXIoKSB7XG4gICAgaWYgKCFjbGFzc0FwcGxpZXIpIHtcbiAgICAgICAgY2xhc3NBcHBsaWVyID0gcmFuZ3kuY3JlYXRlQ2xhc3NBcHBsaWVyKGhpZ2hsaWdodENsYXNzLCB7IGVsZW1lbnRUYWdOYW1lOiAnaW5zJyB9KTtcbiAgICB9XG4gICAgcmV0dXJuIGNsYXNzQXBwbGllcjtcbn1cblxuLy8gUmV0dXJucyBhbiBhZGp1c3RlZCBlbmQgcG9pbnQgZm9yIHRoZSBzZWxlY3Rpb24gd2l0aGluIHRoZSBnaXZlbiBub2RlLCBhcyB0cmlnZ2VyZWQgYnkgdGhlIGdpdmVuIG1vdXNlIHVwIGV2ZW50LlxuLy8gVGhlIHJldHVybmVkIHBvaW50ICh4LCB5KSB0YWtlcyBpbnRvIGFjY291bnQgdGhlIGxvY2F0aW9uIG9mIHRoZSBtb3VzZSB1cCBldmVudCBhcyB3ZWxsIGFzIHRoZSBkaXJlY3Rpb24gb2YgdGhlXG4vLyBzZWxlY3Rpb24gKGZvcndhcmQvYmFjaykuXG5mdW5jdGlvbiBnZXRTZWxlY3Rpb25FbmRQb2ludChub2RlLCBldmVudCwgZXhjbHVkZU5vZGUpIHtcbiAgICAvLyBUT0RPOiBDb25zaWRlciB1c2luZyB0aGUgZWxlbWVudCBjcmVhdGVkIHdpdGggdGhlICdjbGFzc2lmaWVyJyByYXRoZXIgdGhhbiB0aGUgbW91c2UgbG9jYXRpb25cbiAgICB2YXIgc2VsZWN0aW9uID0gcmFuZ3kuZ2V0U2VsZWN0aW9uKCk7XG4gICAgaWYgKGlzVmFsaWRTZWxlY3Rpb24oc2VsZWN0aW9uLCBub2RlLCBleGNsdWRlTm9kZSkpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHg6IGV2ZW50LnBhZ2VYIC0gKCBzZWxlY3Rpb24uaXNCYWNrd2FyZHMoKSA/IC01IDogNSksXG4gICAgICAgICAgICB5OiBldmVudC5wYWdlWSAtIDggLy8gVE9ETzogZXhhY3QgY29vcmRzXG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG59XG5cbi8vIEF0dGVtcHRzIHRvIGdldCBhIHJhbmdlIGZyb20gdGhlIGN1cnJlbnQgc2VsZWN0aW9uLiBUaGlzIGV4cGFuZHMgdGhlXG4vLyBzZWxlY3RlZCByZWdpb24gdG8gaW5jbHVkZSB3b3JkIGJvdW5kYXJpZXMuXG5mdW5jdGlvbiBncmFiU2VsZWN0aW9uKG5vZGUsIGNhbGxiYWNrLCBleGNsdWRlTm9kZSkge1xuICAgIHZhciBzZWxlY3Rpb24gPSByYW5neS5nZXRTZWxlY3Rpb24oKTtcbiAgICBpZiAoaXNWYWxpZFNlbGVjdGlvbihzZWxlY3Rpb24sIG5vZGUsIGV4Y2x1ZGVOb2RlKSkge1xuICAgICAgICBleHBhbmRBbmRUcmltUmFuZ2Uoc2VsZWN0aW9uKTtcbiAgICAgICAgaWYgKHNlbGVjdGlvbi5jb250YWluc05vZGUoZXhjbHVkZU5vZGUpKSB7XG4gICAgICAgICAgICB2YXIgcmFuZ2UgPSBzZWxlY3Rpb24uZ2V0UmFuZ2VBdCgwKTtcbiAgICAgICAgICAgIHJhbmdlLnNldEVuZEJlZm9yZShleGNsdWRlTm9kZSk7XG4gICAgICAgICAgICBzZWxlY3Rpb24uc2V0U2luZ2xlUmFuZ2UocmFuZ2UpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpc1ZhbGlkU2VsZWN0aW9uKHNlbGVjdGlvbiwgbm9kZSwgZXhjbHVkZU5vZGUpKSB7XG4gICAgICAgICAgICB2YXIgbG9jYXRpb247XG4gICAgICAgICAgICBpZiAoc2VsZWN0aW9uRW5jb21wYXNzZXNOb2RlKHNlbGVjdGlvbiwgbm9kZSkpIHtcbiAgICAgICAgICAgICAgICBsb2NhdGlvbiA9ICc6MCw6MSc7IC8vIFRoZSB1c2VyIGhhcyBtYW51YWxseSBzZWxlY3RlZCB0aGUgZW50aXJlIG5vZGUuIE5vcm1hbGl6ZSB0aGUgbG9jYXRpb24uXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGxvY2F0aW9uID0gcmFuZ3kuc2VyaWFsaXplU2VsZWN0aW9uKHNlbGVjdGlvbiwgdHJ1ZSwgbm9kZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgdGV4dCA9IHNlbGVjdGlvbi50b1N0cmluZygpO1xuICAgICAgICAgICAgaGlnaGxpZ2h0U2VsZWN0aW9uKHNlbGVjdGlvbik7IC8vIEhpZ2hsaWdodGluZyBkZXNlbGVjdHMgdGhlIHRleHQsIHNvIGRvIHRoaXMgbGFzdC5cbiAgICAgICAgICAgIGNhbGxiYWNrKHRleHQsIGxvY2F0aW9uKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGV4cGFuZEFuZFRyaW1SYW5nZShyYW5nZU9yU2VsZWN0aW9uKSB7XG4gICAgICAgIHJhbmdlT3JTZWxlY3Rpb24uZXhwYW5kKCd3b3JkJywgeyB0cmltOiB0cnVlLCB3b3JkT3B0aW9uczogeyB3b3JkUmVnZXg6IC9cXFMrXFxTKi9naSB9IH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNlbGVjdGlvbkVuY29tcGFzc2VzTm9kZShzZWxlY3Rpb24sIG5vZGUpIHtcbiAgICAgICAgdmFyIHJhbmdlID0gZ2V0Tm9kZVJhbmdlKG5vZGUpO1xuICAgICAgICBleHBhbmRBbmRUcmltUmFuZ2UocmFuZ2UpO1xuICAgICAgICByZXR1cm4gcmFuZ2UudG9TdHJpbmcoKSA9PT0gc2VsZWN0aW9uLnRvU3RyaW5nKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBpc1ZhbGlkU2VsZWN0aW9uKHNlbGVjdGlvbiwgbm9kZSwgZXhjbHVkZU5vZGUpIHtcbiAgICByZXR1cm4gIXNlbGVjdGlvbi5pc0NvbGxhcHNlZCAmJiAgLy8gTm9uLWVtcHR5IHNlbGVjdGlvblxuICAgICAgICBzZWxlY3Rpb24ucmFuZ2VDb3VudCA9PT0gMSAmJiAvLyBTaW5nbGUgc2VsZWN0aW9uXG4gICAgICAgICghZXhjbHVkZU5vZGUgfHwgIXNlbGVjdGlvbi5jb250YWluc05vZGUoZXhjbHVkZU5vZGUsIHRydWUpKSAmJiAvLyBTZWxlY3Rpb24gZG9lc24ndCBjb250YWluIGFueXRoaW5nIHdlJ3ZlIHNhaWQgd2UgZG9uJ3Qgd2FudCAoZS5nLiB0aGUgaW5kaWNhdG9yKVxuICAgICAgICBub2RlQ29udGFpbnNTZWxlY3Rpb24obm9kZSwgc2VsZWN0aW9uKTsgLy8gU2VsZWN0aW9uIGlzIGNvbnRhaW5lZCBlbnRpcmVseSB3aXRoaW4gdGhlIG5vZGVcbn1cblxuZnVuY3Rpb24gbm9kZUNvbnRhaW5zU2VsZWN0aW9uKG5vZGUsIHNlbGVjdGlvbikge1xuICAgIHZhciBjb21tb25BbmNlc3RvciA9IHNlbGVjdGlvbi5nZXRSYW5nZUF0KDApLmNvbW1vbkFuY2VzdG9yQ29udGFpbmVyOyAvLyBjb21tb25BbmNlc3RvciBjb3VsZCBiZSBhIHRleHQgbm9kZSBvciBzb21lIHBhcmVudCBlbGVtZW50XG4gICAgcmV0dXJuIG5vZGUuY29udGFpbnMoY29tbW9uQW5jZXN0b3IpIHx8XG4gICAgICAgICAgICAvLyBUaGUgZm9sbG93aW5nIGNoZWNrIGlzIGZvciBJRSwgd2hpY2ggZG9lc24ndCBpbXBsZW1lbnQgXCJjb250YWluc1wiIHByb3Blcmx5IGZvciB0ZXh0IG5vZGVzLlxuICAgICAgICAoY29tbW9uQW5jZXN0b3Iubm9kZVR5cGUgPT09IDMgJiYgbm9kZS5jb250YWlucyhjb21tb25BbmNlc3Rvci5wYXJlbnROb2RlKSk7XG59XG5cbmZ1bmN0aW9uIGdldE5vZGVSYW5nZShub2RlKSB7XG4gICAgdmFyIHJhbmdlID0gcmFuZ3kuY3JlYXRlUmFuZ2UoZG9jdW1lbnQpO1xuICAgIHJhbmdlLnNlbGVjdE5vZGVDb250ZW50cyhub2RlKTtcbiAgICB2YXIgJGV4Y2x1ZGVkID0gJChub2RlKS5maW5kKCcuYW50ZW5uYS10ZXh0LWluZGljYXRvci13aWRnZXQnKTtcbiAgICBpZiAoJGV4Y2x1ZGVkLnNpemUoKSA+IDApIHsgLy8gUmVtb3ZlIHRoZSBpbmRpY2F0b3IgZnJvbSB0aGUgZW5kIG9mIHRoZSBzZWxlY3RlZCByYW5nZS5cbiAgICAgICAgcmFuZ2Uuc2V0RW5kQmVmb3JlKCRleGNsdWRlZC5nZXQoMCkpO1xuICAgIH1cbiAgICByZXR1cm4gcmFuZ2U7XG59XG5cbmZ1bmN0aW9uIGdyYWJOb2RlKG5vZGUsIGNhbGxiYWNrKSB7XG4gICAgdmFyIHJhbmdlID0gZ2V0Tm9kZVJhbmdlKG5vZGUpO1xuICAgIHZhciBzZWxlY3Rpb24gPSByYW5neS5nZXRTZWxlY3Rpb24oKTtcbiAgICBzZWxlY3Rpb24uc2V0U2luZ2xlUmFuZ2UocmFuZ2UpO1xuICAgIC8vIFdlIHNob3VsZCBqdXN0IGJlIGFibGUgdG8gc2VyaWFsaXplIHRoZSBzZWxlY3Rpb24sIGJ1dCB0aGlzIGdpdmVzIHVzIGluY29uc2lzdGVudCB2YWx1ZXMgaW4gU2FmYXJpLlxuICAgIC8vIFRoZSB2YWx1ZSAqc2hvdWxkKiBhbHdheXMgYmUgOjAsOjEgd2hlbiB3ZSBzZWxlY3QgYW4gZW50aXJlIG5vZGUsIHNvIHdlIGp1c3QgaGFyZGNvZGUgaXQuXG4gICAgLy92YXIgbG9jYXRpb24gPSByYW5neS5zZXJpYWxpemVTZWxlY3Rpb24oc2VsZWN0aW9uLCB0cnVlLCBub2RlKTtcbiAgICB2YXIgbG9jYXRpb24gPSAnOjAsOjEnO1xuICAgIHZhciB0ZXh0ID0gc2VsZWN0aW9uLnRvU3RyaW5nKCkudHJpbSgpO1xuICAgIGlmICh0ZXh0Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgaGlnaGxpZ2h0U2VsZWN0aW9uKHNlbGVjdGlvbik7IC8vIEhpZ2hsaWdodGluZyBkZXNlbGVjdHMgdGhlIHRleHQsIHNvIGRvIHRoaXMgbGFzdC5cbiAgICAgICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBjYWxsYmFjayh0ZXh0LCBsb2NhdGlvbik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgc2VsZWN0aW9uLnJlbW92ZUFsbFJhbmdlcygpOyAvLyBEb24ndCBhY3R1YWxseSBsZWF2ZSB0aGUgZWxlbWVudCBzZWxlY3RlZC5cbiAgICBzZWxlY3Rpb24ucmVmcmVzaCgpO1xufVxuXG4vLyBIaWdobGlnaHRzIHRoZSBnaXZlbiBsb2NhdGlvbiBpbnNpZGUgdGhlIGdpdmVuIG5vZGUuXG5mdW5jdGlvbiBoaWdobGlnaHRMb2NhdGlvbihub2RlLCBsb2NhdGlvbikge1xuICAgIC8vIFRPRE8gZXJyb3IgaGFuZGxpbmcgaW4gY2FzZSB0aGUgcmFuZ2UgaXMgbm90IHZhbGlkP1xuICAgIGlmIChyYW5neS5jYW5EZXNlcmlhbGl6ZVJhbmdlKGxvY2F0aW9uLCBub2RlLCBkb2N1bWVudCkpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHZhciByYW5nZSA9IHJhbmd5LmRlc2VyaWFsaXplUmFuZ2UobG9jYXRpb24sIG5vZGUsIGRvY3VtZW50KTtcbiAgICAgICAgICAgIGhpZ2hsaWdodFJhbmdlKHJhbmdlKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIC8vIFRPRE86IENvbnNpZGVyIGxvZ2dpbmcgc29tZSBraW5kIG9mIGV2ZW50IHNlcnZlci1zaWRlP1xuICAgICAgICAgICAgLy8gVE9ETzogQ29uc2lkZXIgaGlnaGxpZ2h0aW5nIHRoZSB3aG9sZSBub2RlPyBPciBpcyBpdCBiZXR0ZXIgdG8ganVzdCBoaWdobGlnaHQgbm90aGluZz9cbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gaGlnaGxpZ2h0U2VsZWN0aW9uKHNlbGVjdGlvbikge1xuICAgIGhpZ2hsaWdodFJhbmdlKHNlbGVjdGlvbi5nZXRSYW5nZUF0KDApKTtcbn1cblxuZnVuY3Rpb24gaGlnaGxpZ2h0UmFuZ2UocmFuZ2UpIHtcbiAgICBjbGVhckhpZ2hsaWdodHMoKTtcbiAgICBnZXRDbGFzc0FwcGxpZXIoKS5hcHBseVRvUmFuZ2UocmFuZ2UpO1xuICAgIGhpZ2hsaWdodGVkUmFuZ2VzLnB1c2gocmFuZ2UpO1xufVxuXG4vLyBDbGVhcnMgYWxsIGhpZ2hsaWdodHMgdGhhdCBoYXZlIGJlZW4gY3JlYXRlZCBvbiB0aGUgcGFnZS5cbmZ1bmN0aW9uIGNsZWFySGlnaGxpZ2h0cygpIHtcbiAgICB2YXIgY2xhc3NBcHBsaWVyID0gZ2V0Q2xhc3NBcHBsaWVyKCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBoaWdobGlnaHRlZFJhbmdlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgcmFuZ2UgPSBoaWdobGlnaHRlZFJhbmdlc1tpXTtcbiAgICAgICAgaWYgKGNsYXNzQXBwbGllci5pc0FwcGxpZWRUb1JhbmdlKHJhbmdlKSkge1xuICAgICAgICAgICAgY2xhc3NBcHBsaWVyLnVuZG9Ub1JhbmdlKHJhbmdlKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBoaWdobGlnaHRlZFJhbmdlcyA9IFtdO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgZ2V0U2VsZWN0aW9uRW5kUG9pbnQ6IGdldFNlbGVjdGlvbkVuZFBvaW50LFxuICAgIGdyYWJTZWxlY3Rpb246IGdyYWJTZWxlY3Rpb24sXG4gICAgZ3JhYk5vZGU6IGdyYWJOb2RlLFxuICAgIGNsZWFySGlnaGxpZ2h0czogY2xlYXJIaWdobGlnaHRzLFxuICAgIGhpZ2hsaWdodDogaGlnaGxpZ2h0TG9jYXRpb24sXG4gICAgSElHSExJR0hUX1NFTEVDVE9SOiAnLicgKyBoaWdobGlnaHRDbGFzc1xufTsiLCJcbnZhciBub0NvbmZsaWN0O1xudmFyIGxvYWRlZFJhbmd5O1xudmFyIGNhbGxiYWNrcyA9IFtdO1xuXG4vLyBDYXB0dXJlIGFueSBnbG9iYWwgaW5zdGFuY2Ugb2YgcmFuZ3kgd2hpY2ggYWxyZWFkeSBleGlzdHMgYmVmb3JlIHdlIGxvYWQgb3VyIG93bi5cbmZ1bmN0aW9uIGFib3V0VG9Mb2FkKCkge1xuICAgIG5vQ29uZmxpY3QgPSB3aW5kb3cucmFuZ3k7XG59XG5cbi8vIFJlc3RvcmUgdGhlIGdsb2JhbCBpbnN0YW5jZSBvZiByYW5neSAoaWYgYW55KSBhbmQgcGFzcyBvdXQgb3VyIHZlcnNpb24gdG8gb3VyIGNhbGxiYWNrc1xuZnVuY3Rpb24gbG9hZGVkKCkge1xuICAgIGxvYWRlZFJhbmd5ID0gcmFuZ3k7XG4gICAgbG9hZGVkUmFuZ3kuaW5pdCgpO1xuICAgIHdpbmRvdy5yYW5neSA9IG5vQ29uZmxpY3Q7XG4gICAgbm90aWZ5Q2FsbGJhY2tzKCk7XG59XG5cbmZ1bmN0aW9uIG5vdGlmeUNhbGxiYWNrcygpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNhbGxiYWNrcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjYWxsYmFja3NbaV0obG9hZGVkUmFuZ3kpO1xuICAgIH1cbiAgICBjYWxsYmFja3MgPSBbXTtcbn1cblxuLy8gUmVnaXN0ZXJzIHRoZSBnaXZlbiBjYWxsYmFjayB0byBiZSBub3RpZmllZCB3aGVuIG91ciB2ZXJzaW9uIG9mIFJhbmd5IGlzIGxvYWRlZC5cbmZ1bmN0aW9uIG9uTG9hZChjYWxsYmFjaykge1xuICAgIGlmIChsb2FkZWRSYW5neSkge1xuICAgICAgICBjYWxsYmFjayhsb2FkZWRSYW5neSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgY2FsbGJhY2tzLnB1c2goY2FsbGJhY2spO1xuICAgIH1cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGFib3V0VG9Mb2FkOiBhYm91dFRvTG9hZCxcbiAgICBsb2FkZWQ6IGxvYWRlZCxcbiAgICBvbkxvYWQ6IG9uTG9hZFxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcblxudmFyIENMQVNTX0ZVTEwgPSAnYW50ZW5uYS1mdWxsJztcbnZhciBDTEFTU19IQUxGID0gJ2FudGVubmEtaGFsZic7XG5cbmZ1bmN0aW9uIGNvbXB1dGVMYXlvdXREYXRhKHJlYWN0aW9uc0RhdGEpIHtcbiAgICB2YXIgbnVtUmVhY3Rpb25zID0gcmVhY3Rpb25zRGF0YS5sZW5ndGg7XG4gICAgaWYgKG51bVJlYWN0aW9ucyA9PSAwKSB7XG4gICAgICAgIHJldHVybiB7fTsgLy8gVE9ETyBjbGVhbiB0aGlzIHVwXG4gICAgfVxuICAgIC8vIFRPRE86IENvcGllZCBjb2RlIGZyb20gZW5nYWdlX2Z1bGwuY3JlYXRlVGFnQnVja2V0c1xuICAgIHZhciBtYXggPSByZWFjdGlvbnNEYXRhWzBdLmNvdW50O1xuICAgIHZhciBtZWRpYW4gPSByZWFjdGlvbnNEYXRhWyBNYXRoLmZsb29yKHJlYWN0aW9uc0RhdGEubGVuZ3RoLzIpIF0uY291bnQ7XG4gICAgdmFyIG1pbiA9IHJlYWN0aW9uc0RhdGFbIHJlYWN0aW9uc0RhdGEubGVuZ3RoLTEgXS5jb3VudDtcbiAgICB2YXIgdG90YWwgPSAwO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbnVtUmVhY3Rpb25zOyBpKyspIHtcbiAgICAgICAgdG90YWwgKz0gcmVhY3Rpb25zRGF0YVtpXS5jb3VudDtcbiAgICB9XG4gICAgdmFyIGF2ZXJhZ2UgPSBNYXRoLmZsb29yKHRvdGFsIC8gbnVtUmVhY3Rpb25zKTtcbiAgICB2YXIgbWlkVmFsdWUgPSAoIG1lZGlhbiA+IGF2ZXJhZ2UgKSA/IG1lZGlhbiA6IGF2ZXJhZ2U7XG5cbiAgICB2YXIgbGF5b3V0Q2xhc3NlcyA9IFtdO1xuICAgIHZhciBudW1IYWxmc2llcyA9IDA7XG4gICAgdmFyIG51bUZ1bGwgPSAwO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbnVtUmVhY3Rpb25zOyBpKyspIHtcbiAgICAgICAgaWYgKHJlYWN0aW9uc0RhdGFbaV0uY291bnQgPiBtaWRWYWx1ZSkge1xuICAgICAgICAgICAgbGF5b3V0Q2xhc3Nlc1tpXSA9IENMQVNTX0ZVTEw7XG4gICAgICAgICAgICBudW1GdWxsKys7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsYXlvdXRDbGFzc2VzW2ldID0gQ0xBU1NfSEFMRjtcbiAgICAgICAgICAgIG51bUhhbGZzaWVzKys7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKG51bUhhbGZzaWVzICUgMiAhPT0gMCkge1xuICAgICAgICAvLyBJZiB0aGVyZSBhcmUgYW4gb2RkIG51bWJlciBvZiBoYWxmLXNpemVkIGJveGVzLCBtYWtlIG9uZSBvZiB0aGVtIGZ1bGwuXG4gICAgICAgIC8vIElmIHRoZXJlIGFyZSBubyBvdGhlciBmdWxsLXNpemUgYm94ZXMsIG1ha2UgdGhlIGZpcnN0IG9uZSBmdWxsLXNpemUuIE90aGVyd2lzZSwgbWFrZSB0aGUgbGFzdCBvbmUgZnVsbC5cbiAgICAgICAgbGF5b3V0Q2xhc3Nlc1tudW1GdWxsID09PSAwID8gMCA6IG51bVJlYWN0aW9ucyAtIDFdID0gQ0xBU1NfRlVMTDtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBsYXlvdXRDbGFzc2VzOiBsYXlvdXRDbGFzc2VzXG4gICAgfTtcbn1cblxuZnVuY3Rpb24gc2l6ZVJlYWN0aW9uVGV4dFRvRml0KCRyZWFjdGlvbnNXaW5kb3cpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gc2l6ZVJlYWN0aW9uVGV4dFRvRml0KG5vZGUpIHtcbiAgICAgICAgdmFyICRlbGVtZW50ID0gJChub2RlKTtcbiAgICAgICAgdmFyIG9yaWdpbmFsRGlzcGxheSA9ICRyZWFjdGlvbnNXaW5kb3cuY3NzKCdkaXNwbGF5Jyk7XG4gICAgICAgIGlmIChvcmlnaW5hbERpc3BsYXkgPT09ICdub25lJykgeyAvLyBJZiB3ZSdyZSBzaXppbmcgdGhlIGJveGVzIGJlZm9yZSB0aGUgd2lkZ2V0IGlzIGRpc3BsYXllZCwgdGVtcG9yYXJpbHkgZGlzcGxheSBpdCBvZmZzY3JlZW4uXG4gICAgICAgICAgICAkcmVhY3Rpb25zV2luZG93LmNzcyh7ZGlzcGxheTogJ2Jsb2NrJywgbGVmdDogJzEwMCUnfSk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGhvcml6b250YWxSYXRpbyA9IG5vZGUuY2xpZW50V2lkdGggLyBub2RlLnNjcm9sbFdpZHRoO1xuICAgICAgICBpZiAoaG9yaXpvbnRhbFJhdGlvIDwgMS4wKSB7IC8vIElmIHRoZSB0ZXh0IGRvZXNuJ3QgZml0LCBmaXJzdCB0cnkgdG8gd3JhcCBpdCB0byB0d28gbGluZXMuIFRoZW4gc2NhbGUgaXQgZG93biBpZiBzdGlsbCBuZWNlc3NhcnkuXG4gICAgICAgICAgICB2YXIgdGV4dCA9IG5vZGUuaW5uZXJIVE1MO1xuICAgICAgICAgICAgdmFyIG1pZCA9IE1hdGguY2VpbCh0ZXh0Lmxlbmd0aCAvIDIpOyAvLyBMb29rIGZvciB0aGUgY2xvc2VzdCBzcGFjZSB0byB0aGUgbWlkZGxlLCB3ZWlnaHRlZCBzbGlnaHRseSAoTWF0aC5jZWlsKSB0b3dhcmQgYSBzcGFjZSBpbiB0aGUgc2Vjb25kIGhhbGYuXG4gICAgICAgICAgICB2YXIgc2Vjb25kSGFsZkluZGV4ID0gdGV4dC5pbmRleE9mKCcgJywgbWlkKTtcbiAgICAgICAgICAgIHZhciBmaXJzdEhhbGZJbmRleCA9IHRleHQubGFzdEluZGV4T2YoJyAnLCBtaWQpO1xuICAgICAgICAgICAgdmFyIHNwbGl0SW5kZXggPSBNYXRoLmFicyhzZWNvbmRIYWxmSW5kZXggLSBtaWQpIDwgTWF0aC5hYnMobWlkIC0gZmlyc3RIYWxmSW5kZXgpID8gc2Vjb25kSGFsZkluZGV4IDogZmlyc3RIYWxmSW5kZXg7XG4gICAgICAgICAgICB2YXIgdmVydGljYWxSYXRpbztcbiAgICAgICAgICAgIGlmIChzcGxpdEluZGV4ID4gMSkge1xuICAgICAgICAgICAgICAgIC8vIFNwbGl0IHRoZSB0ZXh0IGFuZCB0aGVuIHNlZSBob3cgaXQgZml0cy5cbiAgICAgICAgICAgICAgICBub2RlLmlubmVySFRNTCA9IHRleHQuc2xpY2UoMCwgc3BsaXRJbmRleCkgKyAnPGJyPicgKyB0ZXh0LnNsaWNlKHNwbGl0SW5kZXgpO1xuICAgICAgICAgICAgICAgIHZhciB3cmFwcGVkSG9yaXpvbnRhbFJhdGlvID0gbm9kZS5jbGllbnRXaWR0aCAvIG5vZGUuc2Nyb2xsV2lkdGg7XG4gICAgICAgICAgICAgICAgdmFyIHBhcmVudEF2YWlsYWJsZUhlaWdodCA9IGNvbXB1dGVBdmFpbGFibGVDbGllbnRBcmVhKG5vZGUucGFyZW50Tm9kZSk7XG4gICAgICAgICAgICAgICAgdmVydGljYWxSYXRpbyA9IG5vZGUuc2Nyb2xsSGVpZ2h0IC8gcGFyZW50QXZhaWxhYmxlSGVpZ2h0O1xuXG4gICAgICAgICAgICAgICAgdmFyIHZlcnRpY2FsUmF0aW9NYXggPSAwLjQ7XG4gICAgICAgICAgICAgICAgaWYgKHZlcnRpY2FsUmF0aW8gJiYgdmVydGljYWxSYXRpbyA+IHZlcnRpY2FsUmF0aW9NYXgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNjYWxlRmFjdG9yID0gdmVydGljYWxSYXRpb01heCAvIHZlcnRpY2FsUmF0aW87XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh3cmFwcGVkSG9yaXpvbnRhbFJhdGlvIDwgMS4wKSB7XG4gICAgICAgICAgICAgICAgICAgIHNjYWxlRmFjdG9yID0gTWF0aC5taW4oc2NhbGVGYWN0b3IsIHdyYXBwZWRIb3Jpem9udGFsUmF0aW8pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoc2NhbGVGYWN0b3IgPD0gaG9yaXpvbnRhbFJhdGlvKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIElmIHdlIGVuZGVkIHVwIGhhdmluZyB0byBtYWtlIHRoZSB0ZXh0IHNtYWxsXG4gICAgICAgICAgICAgICAgICAgIG5vZGUuaW5uZXJIVE1MID0gdGV4dDtcbiAgICAgICAgICAgICAgICAgICAgc2NhbGVGYWN0b3IgPSBob3Jpem9udGFsUmF0aW87XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICRlbGVtZW50LmNzcygnZm9udC1zaXplJywgTWF0aC5tYXgoMTAsIE1hdGguZmxvb3IocGFyc2VJbnQoJGVsZW1lbnQuY3NzKCdmb250LXNpemUnKSkgKiBzY2FsZUZhY3RvcikgLSAxKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICRlbGVtZW50LmNzcygnZm9udC1zaXplJywgTWF0aC5tYXgoMTAsIE1hdGguZmxvb3IocGFyc2VJbnQoJGVsZW1lbnQuY3NzKCdmb250LXNpemUnKSkgKiBob3Jpem9udGFsUmF0aW8pIC0gMSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChvcmlnaW5hbERpc3BsYXkgPT09ICdub25lJykge1xuICAgICAgICAgICAgJHJlYWN0aW9uc1dpbmRvdy5jc3Moe2Rpc3BsYXk6ICcnLCBsZWZ0OiAnJ30pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0ZWFyZG93bjogZnVuY3Rpb24oKSB7fVxuICAgICAgICB9O1xuICAgIH07XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVBdmFpbGFibGVDbGllbnRBcmVhKG5vZGUpIHtcbiAgICB2YXIgbm9kZVN0eWxlID0gd2luZG93LmdldENvbXB1dGVkU3R5bGUobm9kZSk7XG4gICAgcmV0dXJuIHBhcnNlSW50KG5vZGVTdHlsZS5oZWlnaHQpIC0gcGFyc2VJbnQobm9kZVN0eWxlLnBhZGRpbmdUb3ApIC0gcGFyc2VJbnQobm9kZVN0eWxlLnBhZGRpbmdCb3R0b20pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBzaXplVG9GaXQ6IHNpemVSZWFjdGlvblRleHRUb0ZpdCxcbiAgICBjb21wdXRlTGF5b3V0RGF0YTogY29tcHV0ZUxheW91dERhdGFcbn07IiwidmFyIENhbGxiYWNrU3VwcG9ydCA9IHJlcXVpcmUoJy4vY2FsbGJhY2stc3VwcG9ydCcpO1xuXG4vLyBUaGlzIG1vZHVsZSBhbGxvd3MgdXMgdG8gcmVnaXN0ZXIgY2FsbGJhY2tzIHRoYXQgYXJlIHRocm90dGxlZCBpbiB0aGVpciBmcmVxdWVuY3kuIFRoaXMgaXMgdXNlZnVsIGZvciBldmVudHMgbGlrZVxuLy8gcmVzaXplIGFuZCBzY3JvbGwsIHdoaWNoIGNhbiBiZSBmaXJlZCBhdCBhbiBleHRyZW1lbHkgaGlnaCByYXRlLlxuXG52YXIgdGhyb3R0bGVkTGlzdGVuZXJzID0ge307XG5cbmZ1bmN0aW9uIG9uKHR5cGUsIGNhbGxiYWNrKSB7XG4gICAgdGhyb3R0bGVkTGlzdGVuZXJzW3R5cGVdID0gdGhyb3R0bGVkTGlzdGVuZXJzW3R5cGVdIHx8IGNyZWF0ZVRocm90dGxlZExpc3RlbmVyKHR5cGUpO1xuICAgIHRocm90dGxlZExpc3RlbmVyc1t0eXBlXS5hZGRDYWxsYmFjayhjYWxsYmFjayk7XG59XG5cbmZ1bmN0aW9uIG9mZih0eXBlLCBjYWxsYmFjaykge1xuICAgIHZhciBldmVudExpc3RlbmVyID0gdGhyb3R0bGVkTGlzdGVuZXJzW3R5cGVdO1xuICAgIGlmIChldmVudExpc3RlbmVyKSB7XG4gICAgICAgIGV2ZW50TGlzdGVuZXIucmVtb3ZlQ2FsbGJhY2soY2FsbGJhY2spO1xuICAgICAgICBpZiAoZXZlbnRMaXN0ZW5lci5pc0VtcHR5KCkpIHtcbiAgICAgICAgICAgIGV2ZW50TGlzdGVuZXIudGVhcmRvd24oKTtcbiAgICAgICAgICAgIGRlbGV0ZSB0aHJvdHRsZWRMaXN0ZW5lcnNbdHlwZV07XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8vIENyZWF0ZXMgYSBsaXN0ZW5lciBvbiB0aGUgcGFydGljdWxhciBldmVudCB0eXBlLiBDYWxsYmFja3MgYWRkZWQgdG8gdGhpcyBsaXN0ZW5lciB3aWxsIGJlIHRocm90dGxlZC5cbmZ1bmN0aW9uIGNyZWF0ZVRocm90dGxlZExpc3RlbmVyKHR5cGUpIHtcbiAgICB2YXIgY2FsbGJhY2tzID0gQ2FsbGJhY2tTdXBwb3J0LmNyZWF0ZSgpO1xuICAgIHZhciBldmVudFRpbWVvdXQ7XG4gICAgc2V0dXAoKTtcbiAgICByZXR1cm4ge1xuICAgICAgICBhZGRDYWxsYmFjazogY2FsbGJhY2tzLmFkZCxcbiAgICAgICAgcmVtb3ZlQ2FsbGJhY2s6IGNhbGxiYWNrcy5yZW1vdmUsXG4gICAgICAgIGlzRW1wdHk6IGNhbGxiYWNrcy5pc0VtcHR5LFxuICAgICAgICB0ZWFyZG93bjogdGVhcmRvd25cbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gaGFuZGxlRXZlbnQoKSB7XG4gICAgICAgaWYgKCFldmVudFRpbWVvdXQpIHtcbiAgICAgICAgICAgZXZlbnRUaW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgIGNhbGxiYWNrcy5pbnZva2VBbGwoKTtcbiAgICAgICAgICAgICAgIGV2ZW50VGltZW91dCA9IG51bGw7XG4gICAgICAgICAgIH0sIDY2KTsgLy8gMTUgRlBTXG4gICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNldHVwKCkge1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcih0eXBlLCBoYW5kbGVFdmVudCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdGVhcmRvd24oKSB7XG4gICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKHR5cGUsIGhhbmRsZUV2ZW50KTtcbiAgICB9XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBvbjogb24sXG4gICAgb2ZmOiBvZmZcbn07IiwiXG4vLyBUT0RPOiBDb25zaWRlciBhZGRpbmcgc3VwcG9ydCBmb3IgdGhlIE1TIHByb3ByaWV0YXJ5IFwiUG9pbnRlciBFdmVudHNcIiBBUEkuXG5cbi8vIFNldHMgdXAgdGhlIGdpdmVuIGVsZW1lbnQgdG8gYmUgY2FsbGVkIHdpdGggYSBUb3VjaEV2ZW50IHRoYXQgd2UgcmVjb2duaXplIGFzIGEgdGFwLlxuZnVuY3Rpb24gc2V0dXBUb3VjaFRhcEV2ZW50cyhlbGVtZW50LCBjYWxsYmFjaykge1xuICAgIHZhciB0aW1lb3V0ID0gNDAwOyAvLyBUaGlzIGlzIHRoZSB0aW1lIGJldHdlZW4gdG91Y2hzdGFydCBhbmQgdG91Y2hlbmQgdGhhdCB3ZSB1c2UgdG8gZGlzdGluZ3Vpc2ggYSB0YXAgZnJvbSBhIGxvbmcgcHJlc3MuXG4gICAgdmFyIHZhbGlkVGFwID0gZmFsc2U7XG4gICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdG91Y2hTdGFydCk7XG4gICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCB0b3VjaE1vdmUpO1xuICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hjYW5jZWwnLCB0b3VjaENhbmNlbCk7XG4gICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIHRvdWNoRW5kKTtcbiAgICByZXR1cm4ge1xuICAgICAgICB0ZWFyZG93bjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0b3VjaFN0YXJ0KTtcbiAgICAgICAgICAgIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgdG91Y2hNb3ZlKTtcbiAgICAgICAgICAgIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hjYW5jZWwnLCB0b3VjaENhbmNlbCk7XG4gICAgICAgICAgICBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgdG91Y2hFbmQpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIHRvdWNoU3RhcnQoZXZlbnQpIHtcbiAgICAgICAgdmFsaWRUYXAgPSB0cnVlO1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFsaWRUYXAgPSBmYWxzZTtcbiAgICAgICAgfSwgdGltZW91dCk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHRvdWNoRW5kKGV2ZW50KSB7XG4gICAgICAgIGlmICh2YWxpZFRhcCAmJiBldmVudC5jaGFuZ2VkVG91Y2hlcy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKGV2ZW50KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiB0b3VjaE1vdmUoZXZlbnQpIHtcbiAgICAgICAgdmFsaWRUYXAgPSBmYWxzZTtcbiAgICB9XG4gICAgZnVuY3Rpb24gdG91Y2hDYW5jZWwoZXZlbnQpIHtcbiAgICAgICAgdmFsaWRUYXAgPSBmYWxzZTtcbiAgICB9XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBzZXR1cFRhcDogc2V0dXBUb3VjaFRhcEV2ZW50c1xufTsiLCJcblxuZnVuY3Rpb24gdG9nZ2xlVHJhbnNpdGlvbkNsYXNzKCRlbGVtZW50LCBjbGFzc05hbWUsIHN0YXRlLCBuZXh0U3RlcCkge1xuICAgICRlbGVtZW50Lm9uKFwidHJhbnNpdGlvbmVuZCB3ZWJraXRUcmFuc2l0aW9uRW5kIG9UcmFuc2l0aW9uRW5kIE1TVHJhbnNpdGlvbkVuZFwiLFxuICAgICAgICBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgLy8gb25jZSB0aGUgQ1NTIHRyYW5zaXRpb24gaXMgY29tcGxldGUsIGNhbGwgb3VyIG5leHQgc3RlcFxuICAgICAgICAgICAgLy8gU2VlOiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzkyNTUyNzkvY2FsbGJhY2std2hlbi1jc3MzLXRyYW5zaXRpb24tZmluaXNoZXNcbiAgICAgICAgICAgIGlmIChldmVudC50YXJnZXQgPT0gZXZlbnQuY3VycmVudFRhcmdldCkge1xuICAgICAgICAgICAgICAgICRlbGVtZW50Lm9mZihcInRyYW5zaXRpb25lbmQgd2Via2l0VHJhbnNpdGlvbkVuZCBvVHJhbnNpdGlvbkVuZCBNU1RyYW5zaXRpb25FbmRcIik7XG4gICAgICAgICAgICAgICAgaWYgKG5leHRTdGVwKSB7XG4gICAgICAgICAgICAgICAgICAgIG5leHRTdGVwKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgKTtcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBUaGlzIHdvcmthcm91bmQgZ2V0cyB1cyBjb25zaXN0ZW50IHRyYW5zaXRpb25lbmQgZXZlbnRzLCB3aGljaCBjYW4gb3RoZXJ3aXNlIGJlIGZsYWt5IGlmIHdlJ3JlIHNldHRpbmcgb3RoZXJcbiAgICAgICAgLy8gY2xhc3NlcyBhdCB0aGUgc2FtZSB0aW1lIGFzIHRyYW5zaXRpb24gY2xhc3Nlcy5cbiAgICAgICAgJGVsZW1lbnQudG9nZ2xlQ2xhc3MoY2xhc3NOYW1lLCBzdGF0ZSk7XG4gICAgfSwgMjApO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICB0b2dnbGVDbGFzczogdG9nZ2xlVHJhbnNpdGlvbkNsYXNzXG59OyIsInZhciBQUk9EX1NFUlZFUl9VUkwgPSBcImh0dHBzOi8vd3d3LmFudGVubmEuaXNcIjsgLy8gVE9ETzogd3d3PyBob3cgYWJvdXQgYW50ZW5uYS5pcyBvciBhcGkuYW50ZW5uYS5pcz9cbnZhciBERVZfU0VSVkVSX1VSTCA9IFwiaHR0cDovL2xvY2FsLXN0YXRpYy5hbnRlbm5hLmlzOjgwODFcIjtcbnZhciBURVNUX1NFUlZFUl9VUkwgPSAnaHR0cDovL2xvY2FsaG9zdDozMDAxJztcbnZhciBBTUFaT05fUzNfVVJMID0gJy8vczMuYW1hem9uYXdzLmNvbS9yZWFkcmJvYXJkJztcblxudmFyIFBST0RfRVZFTlRfU0VSVkVSX1VSTCA9ICdodHRwOi8vZXZlbnRzLmFudGVubmEuaXMnO1xudmFyIERFVl9FVkVOVF9TRVJWRVJfVVJMID0gJ2h0dHA6Ly9ub2RlYnEuZG9ja2VyOjMwMDAnO1xuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgUFJPRFVDVElPTjogUFJPRF9TRVJWRVJfVVJMLFxuICAgIERFVkVMT1BNRU5UOiBERVZfU0VSVkVSX1VSTCxcbiAgICBURVNUOiBURVNUX1NFUlZFUl9VUkwsXG4gICAgQU1BWk9OX1MzOiBBTUFaT05fUzNfVVJMLFxuICAgIFBST0RVQ1RJT05fRVZFTlRTOiBQUk9EX0VWRU5UX1NFUlZFUl9VUkwsXG4gICAgREVWRUxPUE1FTlRfRVZFTlRTOiBERVZfRVZFTlRfU0VSVkVSX1VSTFxufTsiLCJ2YXIgQXBwTW9kZSA9IHJlcXVpcmUoJy4vYXBwLW1vZGUnKTtcbnZhciBVUkxDb25zdGFudHMgPSByZXF1aXJlKCcuL3VybC1jb25zdGFudHMnKTtcblxuZnVuY3Rpb24gZ2V0R3JvdXBTZXR0aW5nc1VybCgpIHtcbiAgICByZXR1cm4gJy9hcGkvc2V0dGluZ3MvJztcbn1cblxuZnVuY3Rpb24gZ2V0UGFnZURhdGFVcmwoKSB7XG4gICAgcmV0dXJuICcvYXBpL3BhZ2VuZXdlci8nO1xufVxuXG5mdW5jdGlvbiBnZXRDcmVhdGVSZWFjdGlvblVybCgpIHtcbiAgICByZXR1cm4gJy9hcGkvdGFnL2NyZWF0ZS8nO1xufVxuXG5mdW5jdGlvbiBnZXRDcmVhdGVDb21tZW50VXJsKCkge1xuICAgIHJldHVybiAnL2FwaS9jb21tZW50L2NyZWF0ZS8nO1xufVxuXG5mdW5jdGlvbiBnZXRGZXRjaENvbW1lbnRVcmwoKSB7XG4gICAgcmV0dXJuICcvYXBpL2NvbW1lbnQvcmVwbGllcy8nO1xufVxuXG5mdW5jdGlvbiBnZXRGZXRjaENvbnRlbnRCb2RpZXNVcmwoKSB7XG4gICAgcmV0dXJuICcvYXBpL2NvbnRlbnQvYm9kaWVzLyc7XG59XG5cbmZ1bmN0aW9uIGdldFNoYXJlUmVhY3Rpb25VcmwoKSB7XG4gICAgcmV0dXJuICcvYXBpL3NoYXJlLzsnXG59XG5cbmZ1bmN0aW9uIGdldFNoYXJlV2luZG93VXJsKCkge1xuICAgIHJldHVybiAnL3N0YXRpYy9zaGFyZS5odG1sJztcbn1cblxuZnVuY3Rpb24gZ2V0RXZlbnRVcmwoKSB7XG4gICAgcmV0dXJuICcvaW5zZXJ0JzsgLy8gTm90ZSB0aGF0IHRoaXMgVVJMIGlzIGZvciB0aGUgZXZlbnQgc2VydmVyLCBub3QgdGhlIGFwcCBzZXJ2ZXIuXG59XG5cbmZ1bmN0aW9uIGdldExvZ2luUGFnZVVybCgpIHtcbiAgICByZXR1cm4gJy9zdGF0aWMvd2lkZ2V0LW5ldy9mYl9sb2dpbi5odG1sJztcbn1cblxuZnVuY3Rpb24gY29tcHV0ZUltYWdlVXJsKCRlbGVtZW50LCBncm91cFNldHRpbmdzKSB7XG4gICAgaWYgKGdyb3VwU2V0dGluZ3MubGVnYWN5QmVoYXZpb3IoKSkge1xuICAgICAgICByZXR1cm4gbGVnYWN5Q29tcHV0ZUltYWdlVXJsKCRlbGVtZW50KTtcbiAgICB9XG4gICAgdmFyIGNvbnRlbnQgPSAkZWxlbWVudC5hdHRyKCdhbnQtaXRlbS1jb250ZW50JykgfHwgJGVsZW1lbnQuYXR0cignc3JjJyk7XG4gICAgaWYgKGNvbnRlbnQgJiYgY29udGVudC5pbmRleE9mKCcvLycpICE9PSAwICYmIGNvbnRlbnQuaW5kZXhPZignaHR0cCcpICE9PSAwKSB7IC8vIHByb3RvY29sLXJlbGF0aXZlIG9yIGFic29sdXRlIHVybCwgZS5nLiAvL2RvbWFpbi5jb20vZm9vL2Jhci5wbmcgb3IgaHR0cDovL2RvbWFpbi5jb20vZm9vL2Jhci9wbmdcbiAgICAgICAgaWYgKGNvbnRlbnQuaW5kZXhPZignLycpID09PSAwKSB7IC8vIGRvbWFpbi1yZWxhdGl2ZSB1cmwsIGUuZy4gL2Zvby9iYXIucG5nID0+IGRvbWFpbi5jb20vZm9vL2Jhci5wbmdcbiAgICAgICAgICAgIGNvbnRlbnQgPSB3aW5kb3cubG9jYXRpb24ub3JpZ2luICsgY29udGVudDtcbiAgICAgICAgfSBlbHNlIHsgLy8gcGF0aC1yZWxhdGl2ZSB1cmwsIGUuZy4gYmFyLnBuZyA9PiBkb21haW4uY29tL2Jhei9iYXIucG5nXG4gICAgICAgICAgICB2YXIgcGF0aCA9IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZTtcbiAgICAgICAgICAgIHZhciBpbmRleCA9IHBhdGgubGFzdEluZGV4T2YoJy8nKSArIDE7XG4gICAgICAgICAgICBpZiAocGF0aC5sZW5ndGggPiBpbmRleCkge1xuICAgICAgICAgICAgICAgIHBhdGggPSBwYXRoLnN1YnN0cmluZygwLCBpbmRleCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb250ZW50ID0gd2luZG93LmxvY2F0aW9uLm9yaWdpbiArIHBhdGggKyBjb250ZW50O1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBjb250ZW50O1xufVxuXG4vLyBMZWdhY3kgaW1wbGVtZW50YXRpb24gd2hpY2ggbWFpbnRhaW5zIHRoZSBvbGQgYmVoYXZpb3Igb2YgZW5nYWdlX2Z1bGxcbi8vIFRoaXMgY29kZSBpcyB3cm9uZyBmb3IgVVJMcyB0aGF0IHN0YXJ0IHdpdGggXCIvL1wiLiBJdCBhbHNvIGdpdmVzIHByZWNlZGVuY2UgdG8gdGhlIHNyYyBhdHQgaW5zdGVhZCBvZiBhbnQtaXRlbS1jb250ZW50XG5mdW5jdGlvbiBsZWdhY3lDb21wdXRlSW1hZ2VVcmwoJGVsZW1lbnQpIHtcbiAgICB2YXIgY29udGVudCA9ICRlbGVtZW50LmF0dHIoJ3NyYycpIHx8ICRlbGVtZW50LmF0dHIoJ2FudC1pdGVtLWNvbnRlbnQnKTtcbiAgICBpZiAoY29udGVudCkge1xuICAgICAgICBpZiAoY29udGVudC5pbmRleE9mKCcvJykgPT09IDApIHtcbiAgICAgICAgICAgIGNvbnRlbnQgPSB3aW5kb3cubG9jYXRpb24ub3JpZ2luICsgY29udGVudDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY29udGVudC5pbmRleE9mKCdodHRwJykgIT09IDApIHtcbiAgICAgICAgICAgIGNvbnRlbnQgPSB3aW5kb3cubG9jYXRpb24ub3JpZ2luICsgd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lICsgY29udGVudDtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gY29udGVudDtcbn1cblxuZnVuY3Rpb24gY29tcHV0ZU1lZGlhVXJsKCRlbGVtZW50LCBncm91cFNldHRpbmdzKSB7XG4gICAgaWYgKGdyb3VwU2V0dGluZ3MubGVnYWN5QmVoYXZpb3IoKSkge1xuICAgICAgICByZXR1cm4gbGVnYWN5Q29tcHV0ZU1lZGlhVXJsKCRlbGVtZW50KTtcbiAgICB9XG4gICAgdmFyIGNvbnRlbnQgPSAkZWxlbWVudC5hdHRyKCdhbnQtaXRlbS1jb250ZW50JykgfHwgJGVsZW1lbnQuYXR0cignc3JjJykgfHwgJGVsZW1lbnQuYXR0cignZGF0YScpO1xuICAgIGlmIChjb250ZW50ICYmIGNvbnRlbnQuaW5kZXhPZignLy8nKSAhPT0gMCAmJiBjb250ZW50LmluZGV4T2YoJ2h0dHAnKSAhPT0gMCkgeyAvLyBwcm90b2NvbC1yZWxhdGl2ZSBvciBhYnNvbHV0ZSB1cmwsIGUuZy4gLy9kb21haW4uY29tL2Zvby9iYXIucG5nIG9yIGh0dHA6Ly9kb21haW4uY29tL2Zvby9iYXIvcG5nXG4gICAgICAgIGlmIChjb250ZW50LmluZGV4T2YoJy8nKSA9PT0gMCkgeyAvLyBkb21haW4tcmVsYXRpdmUgdXJsLCBlLmcuIC9mb28vYmFyLnBuZyA9PiBkb21haW4uY29tL2Zvby9iYXIucG5nXG4gICAgICAgICAgICBjb250ZW50ID0gd2luZG93LmxvY2F0aW9uLm9yaWdpbiArIGNvbnRlbnQ7XG4gICAgICAgIH0gZWxzZSB7IC8vIHBhdGgtcmVsYXRpdmUgdXJsLCBlLmcuIGJhci5wbmcgPT4gZG9tYWluLmNvbS9iYXovYmFyLnBuZ1xuICAgICAgICAgICAgdmFyIHBhdGggPSB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWU7XG4gICAgICAgICAgICB2YXIgaW5kZXggPSBwYXRoLmxhc3RJbmRleE9mKCcvJykgKyAxO1xuICAgICAgICAgICAgaWYgKHBhdGgubGVuZ3RoID4gaW5kZXgpIHtcbiAgICAgICAgICAgICAgICBwYXRoID0gcGF0aC5zdWJzdHJpbmcoMCwgaW5kZXgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29udGVudCA9IHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4gKyBwYXRoICsgY29udGVudDtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gY29udGVudDtcbn1cblxuLy8gTGVnYWN5IGltcGxlbWVudGF0aW9uIHdoaWNoIG1haW50YWlucyB0aGUgb2xkIGJlaGF2aW9yIG9mIGVuZ2FnZV9mdWxsXG4vLyBUaGlzIGNvZGUgaXMgd3JvbmcgZm9yIFVSTHMgdGhhdCBzdGFydCB3aXRoIFwiLy9cIi4gSXQgYWxzbyBnaXZlcyBwcmVjZWRlbmNlIHRvIHRoZSBzcmMgYXR0IGluc3RlYWQgb2YgYW50LWl0ZW0tY29udGVudFxuZnVuY3Rpb24gbGVnYWN5Q29tcHV0ZU1lZGlhVXJsKCRlbGVtZW50KSB7XG4gICAgdmFyIGNvbnRlbnQgPSAkZWxlbWVudC5hdHRyKCdhbnQtaXRlbS1jb250ZW50JykgfHwgJGVsZW1lbnQuYXR0cignc3JjJykgfHwgJGVsZW1lbnQuYXR0cignZGF0YScpIHx8ICcnO1xuICAgIGlmIChjb250ZW50KSB7XG4gICAgICAgIGlmIChjb250ZW50LmluZGV4T2YoJy8nKSA9PT0gMCkge1xuICAgICAgICAgICAgY29udGVudCA9IHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4gKyBjb250ZW50O1xuICAgICAgICB9XG4gICAgICAgIGlmIChjb250ZW50LmluZGV4T2YoJ2h0dHAnKSAhPT0gMCkge1xuICAgICAgICAgICAgY29udGVudCA9IHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4gKyB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUgKyBjb250ZW50O1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBjb250ZW50O1xufVxuXG5mdW5jdGlvbiBhbWF6b25TM1VybCgpIHtcbiAgICByZXR1cm4gVVJMQ29uc3RhbnRzLkFNQVpPTl9TMztcbn1cblxuLy8gVE9ETzogcmVmYWN0b3IgdXNhZ2Ugb2YgYXBwIHNlcnZlciB1cmwgKyByZWxhdGl2ZSByb3V0ZXNcbmZ1bmN0aW9uIGFwcFNlcnZlclVybCgpIHtcbiAgICBpZiAoQXBwTW9kZS50ZXN0KSB7XG4gICAgICAgIHJldHVybiBVUkxDb25zdGFudHMuVEVTVDtcbiAgICB9IGVsc2UgaWYgKEFwcE1vZGUub2ZmbGluZSkge1xuICAgICAgICByZXR1cm4gVVJMQ29uc3RhbnRzLkRFVkVMT1BNRU5UO1xuICAgIH1cbiAgICByZXR1cm4gVVJMQ29uc3RhbnRzLlBST0RVQ1RJT047XG59XG5cbi8vIFRPRE86IHJlZmFjdG9yIHVzYWdlIG9mIGV2ZW50cyBzZXJ2ZXIgdXJsICsgcmVsYXRpdmUgcm91dGVzXG5mdW5jdGlvbiBldmVudHNTZXJ2ZXJVcmwoKSB7XG4gICAgaWYgKEFwcE1vZGUub2ZmbGluZSkge1xuICAgICAgICByZXR1cm4gVVJMQ29uc3RhbnRzLkRFVkVMT1BNRU5UX0VWRU5UUztcbiAgICB9XG4gICAgcmV0dXJuIFVSTENvbnN0YW50cy5QUk9EVUNUSU9OX0VWRU5UUztcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGFwcFNlcnZlclVybDogYXBwU2VydmVyVXJsLFxuICAgIGV2ZW50c1NlcnZlclVybDogZXZlbnRzU2VydmVyVXJsLFxuICAgIGFtYXpvblMzVXJsOiBhbWF6b25TM1VybCxcbiAgICBncm91cFNldHRpbmdzVXJsOiBnZXRHcm91cFNldHRpbmdzVXJsLFxuICAgIHBhZ2VEYXRhVXJsOiBnZXRQYWdlRGF0YVVybCxcbiAgICBjcmVhdGVSZWFjdGlvblVybDogZ2V0Q3JlYXRlUmVhY3Rpb25VcmwsXG4gICAgY3JlYXRlQ29tbWVudFVybDogZ2V0Q3JlYXRlQ29tbWVudFVybCxcbiAgICBmZXRjaENvbW1lbnRVcmw6IGdldEZldGNoQ29tbWVudFVybCxcbiAgICBmZXRjaENvbnRlbnRCb2RpZXNVcmw6IGdldEZldGNoQ29udGVudEJvZGllc1VybCxcbiAgICBzaGFyZVJlYWN0aW9uVXJsOiBnZXRTaGFyZVJlYWN0aW9uVXJsLFxuICAgIHNoYXJlV2luZG93VXJsOiBnZXRTaGFyZVdpbmRvd1VybCxcbiAgICBsb2dpblBhZ2VVcmw6IGdldExvZ2luUGFnZVVybCxcbiAgICBjb21wdXRlSW1hZ2VVcmw6IGNvbXB1dGVJbWFnZVVybCxcbiAgICBjb21wdXRlTWVkaWFVcmw6IGNvbXB1dGVNZWRpYVVybCxcbiAgICBldmVudFVybDogZ2V0RXZlbnRVcmxcbn07XG4iLCJ2YXIgQXBwTW9kZSA9IHJlcXVpcmUoJy4vYXBwLW1vZGUnKTtcbnZhciBYRE1DbGllbnQgPSByZXF1aXJlKCcuL3hkbS1jbGllbnQnKTtcblxudmFyIGNhY2hlZFVzZXJJbmZvO1xuXG4vLyBGZXRjaCB0aGUgbG9nZ2VkIGluIHVzZXIuIFdpbGwgdHJpZ2dlciBhIG5ldHdvcmsgcmVxdWVzdCB0byBjcmVhdGUgYSB0ZW1wb3JhcnkgdXNlciBpZiBuZWVkZWQuXG5mdW5jdGlvbiBmZXRjaFVzZXIoY2FsbGJhY2spIHtcbiAgICBYRE1DbGllbnQuZmV0Y2hVc2VyKGZ1bmN0aW9uICh1c2VySW5mbykge1xuICAgICAgICBjYWNoZWRVc2VySW5mbyA9IHVzZXJJbmZvO1xuICAgICAgICBjYWxsYmFjayh1c2VySW5mbyk7XG4gICAgfSk7XG59XG5cbi8vIFJldHVybnMgdGhlIGxvZ2dlZC1pbiB1c2VyLCBpZiB3ZSBhbHJlYWR5IGhhdmUgb25lLiBXaWxsIG5vdCB0cmlnZ2VyIGEgbmV0d29yayByZXF1ZXN0LlxuZnVuY3Rpb24gY2FjaGVkVXNlcihjYWxsYmFjaykge1xuICAgIGNhbGxiYWNrKGNhY2hlZFVzZXJJbmZvKTtcbn1cblxuLy8gQXR0ZW1wdHMgdG8gY3JlYXRlIGEgbmV3IGF1dGhvcml6YXRpb24gdG9rZW4gZm9yIHRoZSBsb2dnZWQtaW4gdXNlci5cbmZ1bmN0aW9uIHJlQXV0aG9yaXplVXNlcihjYWxsYmFjaykge1xuICAgIHZhciBvbGRUb2tlbiA9IGNhY2hlZFVzZXJJbmZvID8gY2FjaGVkVXNlckluZm8uYW50X3Rva2VuIDogdW5kZWZpbmVkO1xuICAgIFhETUNsaWVudC5yZUF1dGhvcml6ZVVzZXIoZnVuY3Rpb24gKHVzZXJJbmZvKSB7XG4gICAgICAgIGNhY2hlZFVzZXJJbmZvID0gdXNlckluZm87XG4gICAgICAgIHZhciBoYXNOZXdUb2tlbiA9IHVzZXJJbmZvICYmIHVzZXJJbmZvLmFudF90b2tlbiAmJiB1c2VySW5mby5hbnRfdG9rZW4gIT09IG9sZFRva2VuO1xuICAgICAgICBjYWxsYmFjayhoYXNOZXdUb2tlbik7XG4gICAgfSk7XG59XG5cbi8vIFRPRE86IEZpZ3VyZSBvdXQgaG93IG1hbnkgZGlmZmVyZW50IGZvcm1hdHMgb2YgdXNlciBkYXRhIHdlIGhhdmUgYW5kIGVpdGhlciB1bmlmeSB0aGVtIG9yIHByb3ZpZGUgY2xlYXJcbi8vICAgICAgIEFQSSBoZXJlIHRvIHRyYW5zbGF0ZSBlYWNoIHZhcmlhdGlvbiBpbnRvIHNvbWV0aGluZyBzdGFuZGFyZCBmb3IgdGhlIGNsaWVudC5cbi8vIFRPRE86IEhhdmUgWERNQ2xpZW50IHBhc3MgdGhyb3VnaCB0aGlzIG1vZHVsZSBhcyB3ZWxsLlxuZnVuY3Rpb24gdXNlckZyb21Db21tZW50SlNPTihqc29uVXNlciwgc29jaWFsVXNlcikgeyAvLyBUaGlzIGZvcm1hdCB3b3JrcyBmb3IgdGhlIHVzZXIgcmV0dXJuZWQgZnJvbSAvYXBpL2NvbW1lbnRzL3JlcGxpZXNcbiAgICB2YXIgdXNlciA9IHt9O1xuICAgIGlmIChqc29uVXNlci51c2VyX2lkKSB7XG4gICAgICAgIHVzZXIuaWQgPSBqc29uVXNlci51c2VyX2lkO1xuICAgIH1cbiAgICBpZiAoc29jaWFsVXNlcikge1xuICAgICAgICB1c2VyLmltYWdlVVJMID0gc29jaWFsVXNlci5pbWdfdXJsO1xuICAgICAgICB1c2VyLm5hbWUgPSBzb2NpYWxVc2VyLmZ1bGxfbmFtZTtcbiAgICB9XG4gICAgaWYgKCF1c2VyLm5hbWUpIHtcbiAgICAgICAgdXNlci5uYW1lID0ganNvblVzZXIuZmlyc3RfbmFtZSA/IChqc29uVXNlci5maXJzdF9uYW1lICsgJyAnICsganNvblVzZXIubGFzdF9uYW1lKSA6ICdBbm9ueW1vdXMnO1xuICAgIH1cbiAgICBpZiAoIXVzZXIuaW1hZ2VVUkwpIHtcbiAgICAgICAgdXNlci5pbWFnZVVSTCA9IGFub255bW91c0ltYWdlVVJMKClcbiAgICB9XG4gICAgcmV0dXJuIHVzZXI7XG59XG5cblxuLy8gVE9ETzogUmV2aXNpdCB0aGUgdXNlciB0aGF0IHdlIHBhc3MgYmFjayBmb3IgbmV3IGNvbW1lbnRzLiBPcHRpb25zIGFyZTpcbi8vICAgICAgIDEuIFVzZSB0aGUgbG9nZ2VkIGluIHVzZXIsIGFzc3VtaW5nIHRoZSBjYWNoZWQgdXNlciBoYXMgc29jaWFsX3VzZXIgaW5mb1xuLy8gICAgICAgMi4gVXNlIGEgZ2VuZXJpYyBcInlvdVwiIHJlcHJlc2VudGF0aW9uIGxpa2Ugd2UncmUgZG9pbmcgbm93LlxuLy8gICAgICAgMy4gRG9uJ3Qgc2hvdyBhbnkgaW5kaWNhdGlvbiBvZiB0aGUgdXNlci4gSnVzdCBzaG93IHRoZSBjb21tZW50LlxuLy8gICAgICAgRm9yIG5vdywgdGhpcyBpcyBqdXN0IGdpdmluZyB1cyBzb21lIG5vdGlvbiBvZiB1c2VyIHdpdGhvdXQgYSByb3VuZCB0cmlwLlxuZnVuY3Rpb24gb3B0aW1pc3RpY0NvbW1lbnRVc2VyKCkge1xuICAgIHZhciB1c2VyID0ge1xuICAgICAgICBuYW1lOiAnWW91JyxcbiAgICAgICAgaW1hZ2VVUkw6IGFub255bW91c0ltYWdlVVJMKClcbiAgICB9O1xuICAgIHJldHVybiB1c2VyO1xufVxuXG5mdW5jdGlvbiBhbm9ueW1vdXNJbWFnZVVSTCgpIHtcbiAgICByZXR1cm4gQXBwTW9kZS5vZmZsaW5lID8gJy9zdGF0aWMvd2lkZ2V0L2ltYWdlcy9hbm9ueW1vdXNwbG9kZS5wbmcnIDogJ2h0dHA6Ly9zMy5hbWF6b25hd3MuY29tL3JlYWRyYm9hcmQvd2lkZ2V0L2ltYWdlcy9hbm9ueW1vdXNwbG9kZS5wbmcnO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBmcm9tQ29tbWVudEpTT046IHVzZXJGcm9tQ29tbWVudEpTT04sXG4gICAgb3B0aW1pc3RpY0NvbW1lbnRVc2VyOiBvcHRpbWlzdGljQ29tbWVudFVzZXIsXG4gICAgZmV0Y2hVc2VyOiBmZXRjaFVzZXIsXG4gICAgY2FjaGVkVXNlcjogY2FjaGVkVXNlcixcbiAgICByZUF1dGhvcml6ZVVzZXI6IHJlQXV0aG9yaXplVXNlclxufTsiLCJ2YXIgaWQgPSAnYW50ZW5uYS13aWRnZXQtYnVja2V0JztcblxuZnVuY3Rpb24gZ2V0V2lkZ2V0QnVja2V0KCkge1xuICAgIHZhciBidWNrZXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7XG4gICAgaWYgKCFidWNrZXQpIHtcbiAgICAgICAgYnVja2V0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIGJ1Y2tldC5zZXRBdHRyaWJ1dGUoJ2lkJywgaWQpO1xuICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGJ1Y2tldCk7XG4gICAgfVxuICAgIHJldHVybiBidWNrZXQ7XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBnZXQ6IGdldFdpZGdldEJ1Y2tldCxcbiAgICBzZWxlY3RvcjogZnVuY3Rpb24oKSB7IHJldHVybiAnIycgKyBpZDsgfVxufTsiLCJ2YXIgQ2FsbGJhY2tTdXBwb3J0ID0gcmVxdWlyZSgnLi9jYWxsYmFjay1zdXBwb3J0Jyk7XG52YXIgWGRtTG9hZGVyID0gcmVxdWlyZSgnLi94ZG0tbG9hZGVyJyk7XG5cbi8vIFJlZ2lzdGVyIG91cnNlbHZlcyB0byBoZWFyIG1lc3NhZ2VzXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcIm1lc3NhZ2VcIiwgcmVjZWl2ZU1lc3NhZ2UsIGZhbHNlKTtcblxudmFyIHJlc3BvbnNlSGFuZGxlcnMgPSB7fTtcblxuYWRkUmVzcG9uc2VIYW5kbGVyKCd4ZG0gbG9hZGVkJywgeGRtTG9hZGVkKTtcblxuZnVuY3Rpb24gYWRkUmVzcG9uc2VIYW5kbGVyKG1lc3NhZ2VLZXksIGNhbGxiYWNrKSB7XG4gICAgdmFyIGhhbmRsZXJzID0gZ2V0UmVzcG9uc2VIYW5kbGVycyhtZXNzYWdlS2V5KTtcbiAgICBoYW5kbGVycy5hZGQoY2FsbGJhY2spO1xufVxuXG5mdW5jdGlvbiByZW1vdmVSZXNwb25zZUhhbmRsZXIobWVzc2FnZUtleSwgY2FsbGJhY2spIHtcbiAgICB2YXIgaGFuZGxlcnMgPSBnZXRSZXNwb25zZUhhbmRsZXJzKG1lc3NhZ2VLZXkpO1xuICAgIGhhbmRsZXJzLnJlbW92ZShjYWxsYmFjayk7XG59XG5cbnZhciBpc1hETUxvYWRlZCA9IGZhbHNlO1xuLy8gVGhlIGluaXRpYWwgbWVzc2FnZSB0aGF0IFhETSBzZW5kcyBvdXQgd2hlbiBpdCBsb2Fkc1xuZnVuY3Rpb24geGRtTG9hZGVkKGRhdGEpIHtcbiAgICBpc1hETUxvYWRlZCA9IHRydWU7XG59XG5cbmZ1bmN0aW9uIHNldE1lc3NhZ2VIYW5kbGVyKG1lc3NhZ2VLZXksIGNhbGxiYWNrKSB7XG4gICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgIGNhbGxiYWNrLnBlcnNpc3RlbnQgPSB0cnVlOyAvLyBTZXQgdGhlIGZsYWcgd2hpY2ggdGVsbHMgdXMgdGhhdCB0aGlzIGlzbid0IGEgdHlwaWNhbCBvbmUtdGltZSBjYWxsYmFjay5cbiAgICB9XG4gICAgYWRkUmVzcG9uc2VIYW5kbGVyKG1lc3NhZ2VLZXksIGNhbGxiYWNrKTtcbn1cblxuZnVuY3Rpb24gZmV0Y2hVc2VyKGNhbGxiYWNrKSB7XG4gICAgcG9zdE1lc3NhZ2UoJ2dldFVzZXInLCAnc2VuZFVzZXInLCBzdWNjZXNzKTtcblxuICAgIGZ1bmN0aW9uIHN1Y2Nlc3MocmVzcG9uc2UpIHtcbiAgICAgICAgdmFyIHVzZXJJbmZvID0gcmVzcG9uc2UuZGV0YWlsO1xuICAgICAgICBjYWxsYmFjayh1c2VySW5mbyk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiByZUF1dGhvcml6ZVVzZXIoY2FsbGJhY2spIHtcbiAgICBwb3N0TWVzc2FnZSgncmVhdXRoVXNlcicsICdzZW5kVXNlcicsIHN1Y2Nlc3MpO1xuXG4gICAgZnVuY3Rpb24gc3VjY2VzcyhyZXNwb25zZSkge1xuICAgICAgICB2YXIgdXNlckluZm8gPSByZXNwb25zZS5kZXRhaWw7XG4gICAgICAgIGNhbGxiYWNrKHVzZXJJbmZvKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGdldFJlc3BvbnNlSGFuZGxlcnMobWVzc2FnZUtleSkge1xuICAgIHZhciBoYW5kbGVycyA9IHJlc3BvbnNlSGFuZGxlcnNbbWVzc2FnZUtleV07XG4gICAgaWYgKCFoYW5kbGVycykge1xuICAgICAgICBoYW5kbGVycyA9IENhbGxiYWNrU3VwcG9ydC5jcmVhdGUoKTtcbiAgICAgICAgcmVzcG9uc2VIYW5kbGVyc1ttZXNzYWdlS2V5XSA9IGhhbmRsZXJzO1xuICAgIH1cbiAgICByZXR1cm4gaGFuZGxlcnM7XG59XG5cbmZ1bmN0aW9uIHJlY2VpdmVNZXNzYWdlKGV2ZW50KSB7XG4gICAgdmFyIGV2ZW50T3JpZ2luID0gZXZlbnQub3JpZ2luO1xuICAgIGlmIChldmVudE9yaWdpbiA9PT0gWGRtTG9hZGVyLk9SSUdJTikge1xuICAgICAgICB2YXIgcmVzcG9uc2UgPSBldmVudC5kYXRhO1xuICAgICAgICAvLyBUT0RPOiBUaGUgZXZlbnQuc291cmNlIHByb3BlcnR5IGdpdmVzIHVzIHRoZSBzb3VyY2Ugd2luZG93IG9mIHRoZSBtZXNzYWdlIGFuZCBjdXJyZW50bHkgdGhlIFhETSBmcmFtZSBmaXJlcyBvdXRcbiAgICAgICAgLy8gZXZlbnRzIHRoYXQgd2UgcmVjZWl2ZSBiZWZvcmUgd2UgZXZlciB0cnkgdG8gcG9zdCBhbnl0aGluZy4gU28gd2UgKmNvdWxkKiBob2xkIG9udG8gdGhlIHdpbmRvdyBoZXJlIGFuZCB1c2UgaXRcbiAgICAgICAgLy8gZm9yIHBvc3RpbmcgbWVzc2FnZXMgcmF0aGVyIHRoYW4gbG9va2luZyBmb3IgdGhlIFhETSBmcmFtZSBvdXJzZWx2ZXMuIE5lZWQgdG8gbG9vayBhdCB3aGljaCBldmVudHMgdGhlIFhETSBmcmFtZVxuICAgICAgICAvLyBmaXJlcyBvdXQgdG8gYWxsIHdpbmRvd3MgYmVmb3JlIGJlaW5nIGFza2VkLiBDdXJyZW50bHksIGl0J3MgbW9yZSB0aGFuIFwieGRtIGxvYWRlZFwiLiBXaHk/XG4gICAgICAgIC8vdmFyIHNvdXJjZVdpbmRvdyA9IGV2ZW50LnNvdXJjZTtcblxuICAgICAgICB2YXIgbWVzc2FnZUtleSA9IHJlc3BvbnNlLmtleTtcbiAgICAgICAgdmFyIGhhbmRsZXJzID0gZ2V0UmVzcG9uc2VIYW5kbGVycyhtZXNzYWdlS2V5KTtcbiAgICAgICAgdmFyIGNhbGxiYWNrcyA9IGhhbmRsZXJzLmdldCgpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNhbGxiYWNrcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGNhbGxiYWNrID0gY2FsbGJhY2tzW2ldO1xuICAgICAgICAgICAgY2FsbGJhY2socmVzcG9uc2UpO1xuICAgICAgICAgICAgaWYgKCFjYWxsYmFjay5wZXJzaXN0ZW50KSB7XG4gICAgICAgICAgICAgICAgcmVtb3ZlUmVzcG9uc2VIYW5kbGVyKG1lc3NhZ2VLZXksIGNhbGxiYWNrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gcG9zdE1lc3NhZ2Uoc2VuZEtleSwgcmVzcG9uc2VLZXksIGNhbGxiYWNrKSB7XG4gICAgaWYgKGlzWERNTG9hZGVkKSB7XG4gICAgICAgIHZhciB4ZG1GcmFtZSA9IGdldFhETUZyYW1lKCk7XG4gICAgICAgIGlmICh4ZG1GcmFtZSkge1xuICAgICAgICAgICAgYWRkUmVzcG9uc2VIYW5kbGVyKHJlc3BvbnNlS2V5LCBjYWxsYmFjayk7XG4gICAgICAgICAgICB4ZG1GcmFtZS5wb3N0TWVzc2FnZShzZW5kS2V5LCBYZG1Mb2FkZXIuT1JJR0lOKTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIHF1ZXVlTWVzc2FnZShzZW5kS2V5LCByZXNwb25zZUtleSwgY2FsbGJhY2spO1xuICAgIH1cbn1cblxudmFyIG1lc3NhZ2VRdWV1ZSA9IFtdO1xudmFyIG1lc3NhZ2VRdWV1ZVRpbWVyO1xuXG5mdW5jdGlvbiBxdWV1ZU1lc3NhZ2Uoc2VuZEtleSwgcmVzcG9uc2VLZXksIGNhbGxiYWNrKSB7XG4gICAgLy8gVE9ETzogUmV2aWV3IHRoaXMgaWRlYS4gVGhlIG1haW4gbWVzc2FnZSB3ZSByZWFsbHkgbmVlZCB0byBxdWV1ZSB1cCBpcyB0aGUgZ2V0VXNlciByZXF1ZXN0IGFzIHBhcnQgb2YgdGhlIFwiZ3JvdXAgc2V0dGluZ3MgbG9hZGVkXCJcbiAgICAvLyBldmVudCB3aGljaCBmaXJlcyB2ZXJ5IGVhcmx5IChwb3NzaWJseSBcInBhZ2UgZGF0YSBsb2FkZWRcIiB0b28pLiBCdXQgd2hhdCBhYm91dCB0aGUgcmVzdCBvZiB0aGUgd2lkZ2V0PyBTaG91bGQgd2UgZXZlbiBzaG93XG4gICAgLy8gdGhlIHJlYWN0aW9uIHdpbmRvdyBpZiB0aGUgWERNIGZyYW1lIGlzbid0IHJlYWR5PyBPciBzaG91bGQgdGhlIHdpZGdldCB3YWl0IHRvIGJlY29tZSB2aXNpYmxlIHVudGlsIFhETSBpcyByZWFkeSBsaWtlIHRoZVxuICAgIC8vIHdheSBpdCB3YWl0cyBmb3IgcGFnZSBkYXRhIHRvIGxvYWQ/XG4gICAgbWVzc2FnZVF1ZXVlLnB1c2goe3NlbmRLZXk6IHNlbmRLZXksIHJlc3BvbnNlS2V5OiByZXNwb25zZUtleSwgY2FsbGJhY2s6IGNhbGxiYWNrfSk7XG4gICAgaWYgKCFtZXNzYWdlUXVldWVUaW1lcikge1xuICAgICAgICAvLyBTdGFydCB0aGUgd2FpdC4uLlxuICAgICAgICB2YXIgc3RvcFRpbWUgPSBEYXRlLm5vdygpICsgMTAwMDA7IC8vIEdpdmUgdXAgYWZ0ZXIgMTAgc2Vjb25kc1xuICAgICAgICBtZXNzYWdlUXVldWVUaW1lciA9IHNldEludGVydmFsKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKGlzWERNTG9hZGVkIHx8IERhdGUubm93KCkgPiBzdG9wVGltZSkge1xuICAgICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwobWVzc2FnZVF1ZXVlVGltZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGlzWERNTG9hZGVkKSB7XG4gICAgICAgICAgICAgICAgLy8gVE9ETzogQ29uc2lkZXIgdGhlIHRpbWluZyBpc3N1ZSB3aGVyZSBtZXNzYWdlcyBjb3VsZCBzbmVhayBpbiBhbmQgYmUgcHJvY2Vzc2VkIHdoaWxlIHRoaXMgbG9vcCBpcyBzbGVlcGluZy5cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG1lc3NhZ2VRdWV1ZS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZGVxdWV1ZWQgPSBtZXNzYWdlUXVldWVbaV07XG4gICAgICAgICAgICAgICAgICAgIHBvc3RNZXNzYWdlKGRlcXVldWVkLnNlbmRLZXksIGRlcXVldWVkLnJlc3BvbnNlS2V5LCBkZXF1ZXVlZC5jYWxsYmFjayk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIG1lc3NhZ2VRdWV1ZSA9IFtdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCA1MCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBnZXRYRE1GcmFtZSgpIHtcbiAgICAvLyBUT0RPOiBJcyB0aGlzIGEgc2VjdXJpdHkgcHJvYmxlbT8gV2hhdCBwcmV2ZW50cyBzb21lb25lIGZyb20gdXNpbmcgdGhpcyBzYW1lIG5hbWUgYW5kIGludGVyY2VwdGluZyBvdXIgbWVzc2FnZXM/XG4gICAgcmV0dXJuIHdpbmRvdy5mcmFtZXNbJ2FudC14ZG0taGlkZGVuJ107XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGZldGNoVXNlcjogZmV0Y2hVc2VyLFxuICAgIHJlQXV0aG9yaXplVXNlcjogcmVBdXRob3JpemVVc2VyLFxuICAgIHNldE1lc3NhZ2VIYW5kbGVyOiBzZXRNZXNzYWdlSGFuZGxlcixcbiAgICBhZGRSZXNwb25zZUhhbmRsZXI6IGFkZFJlc3BvbnNlSGFuZGxlcixcbiAgICByZW1vdmVSZXNwb25zZUhhbmRsZXI6IHJlbW92ZVJlc3BvbnNlSGFuZGxlclxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciBBcHBNb2RlID0gcmVxdWlyZSgnLi9hcHAtbW9kZScpO1xudmFyIFVSTENvbnN0YW50cyA9IHJlcXVpcmUoJy4vdXJsLWNvbnN0YW50cycpO1xudmFyIFdpZGdldEJ1Y2tldCA9IHJlcXVpcmUoJy4vd2lkZ2V0LWJ1Y2tldCcpO1xuXG52YXIgWERNX09SSUdJTiA9IEFwcE1vZGUub2ZmbGluZSA/IFVSTENvbnN0YW50cy5ERVZFTE9QTUVOVCA6IFVSTENvbnN0YW50cy5QUk9EVUNUSU9OO1xuXG5mdW5jdGlvbiBjcmVhdGVYRE1mcmFtZShncm91cElkKSB7XG4gICAgLy9BTlQuc2Vzc2lvbi5yZWNlaXZlTWVzc2FnZSh7fSwgZnVuY3Rpb24oKSB7XG4gICAgLy8gICAgQU5ULnV0aWwudXNlckxvZ2luU3RhdGUoKTtcbiAgICAvL30pO1xuXG4gICAgdmFyIGlmcmFtZVVybCA9IFhETV9PUklHSU4gKyBcIi9zdGF0aWMvd2lkZ2V0LW5ldy94ZG0uaHRtbFwiLFxuICAgIHBhcmVudFVybCA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmLFxuICAgIHBhcmVudEhvc3QgPSB3aW5kb3cubG9jYXRpb24ucHJvdG9jb2wgKyBcIi8vXCIgKyB3aW5kb3cubG9jYXRpb24uaG9zdCxcbiAgICAvLyBUT0RPOiBSZXN0b3JlIHRoZSBib29rbWFya2xldCBhdHRyaWJ1dGUgb24gdGhlIGlGcmFtZT9cbiAgICAvL2Jvb2ttYXJrbGV0ID0gKCBBTlQuZW5nYWdlU2NyaXB0UGFyYW1zLmJvb2ttYXJrbGV0ICkgPyBcImJvb2ttYXJrbGV0PXRydWVcIjpcIlwiLFxuICAgIGJvb2ttYXJrbGV0ID0gXCJcIixcbiAgICAvLyBUT0RPOiBSZXN0b3JlIHRoZSBncm91cE5hbWUgYXR0cmlidXRlLiAoV2hhdCBpcyBpdCBmb3I/KVxuICAgICR4ZG1JZnJhbWUgPSAkKCc8aWZyYW1lIGlkPVwiYW50LXhkbS1oaWRkZW5cIiBuYW1lPVwiYW50LXhkbS1oaWRkZW5cIiBzcmM9XCInICsgaWZyYW1lVXJsICsgJz9wYXJlbnRVcmw9JyArIHBhcmVudFVybCArICcmcGFyZW50SG9zdD0nICsgcGFyZW50SG9zdCArICcmZ3JvdXBfaWQ9Jytncm91cElkKydcIiB3aWR0aD1cIjFcIiBoZWlnaHQ9XCIxXCIgc3R5bGU9XCJwb3NpdGlvbjphYnNvbHV0ZTt0b3A6LTEwMDBweDtsZWZ0Oi0xMDAwcHg7XCIgLz4nKTtcbiAgICAvLyR4ZG1JZnJhbWUgPSAkKCc8aWZyYW1lIGlkPVwiYW50LXhkbS1oaWRkZW5cIiBuYW1lPVwiYW50LXhkbS1oaWRkZW5cIiBzcmM9XCInICsgaWZyYW1lVXJsICsgJz9wYXJlbnRVcmw9JyArIHBhcmVudFVybCArICcmcGFyZW50SG9zdD0nICsgcGFyZW50SG9zdCArICcmZ3JvdXBfaWQ9Jytncm91cElkKycmZ3JvdXBfbmFtZT0nK2VuY29kZVVSSUNvbXBvbmVudChncm91cE5hbWUpKycmJytib29rbWFya2xldCsnXCIgd2lkdGg9XCIxXCIgaGVpZ2h0PVwiMVwiIHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGU7dG9wOi0xMDAwcHg7bGVmdDotMTAwMHB4O1wiIC8+Jyk7XG4gICAgJChXaWRnZXRCdWNrZXQuZ2V0KCkpLmFwcGVuZCggJHhkbUlmcmFtZSApO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGVYRE1mcmFtZTogY3JlYXRlWERNZnJhbWUsXG4gICAgT1JJR0lOOiBYRE1fT1JJR0lOXG59OyIsInZhciBYRE1DbGllbnQgPSByZXF1aXJlKCcuL3V0aWxzL3hkbS1jbGllbnQnKTtcbnZhciBFdmVudHMgPSByZXF1aXJlKCcuL2V2ZW50cycpO1xudmFyIEdyb3VwU2V0dGluZ3MgPSByZXF1aXJlKCcuL2dyb3VwLXNldHRpbmdzJyk7XG52YXIgUGFnZURhdGEgPSByZXF1aXJlKCcuL3BhZ2UtZGF0YScpO1xuXG5mdW5jdGlvbiBzdGFydExpc3RlbmluZygpIHtcbiAgICBYRE1DbGllbnQuc2V0TWVzc2FnZUhhbmRsZXIoJ3JlY2lyY0NsaWNrJywgcmVjaXJjQ2xpY2tlZCk7XG59XG5cbmZ1bmN0aW9uIHJlY2lyY0NsaWNrZWQocmVzcG9uc2UpIHtcbiAgICB2YXIgcmVhY3Rpb25JZCA9IHJlc3BvbnNlLmRldGFpbC5yZWZlcnJpbmdfaW50X2lkO1xuICAgIGdldFBhZ2VEYXRhKHJlc3BvbnNlLmRldGFpbC5wYWdlX2hhc2gsIGZ1bmN0aW9uKHBhZ2VEYXRhKSB7XG4gICAgICAgIEV2ZW50cy5wb3N0UmVjaXJjQ2xpY2tlZChwYWdlRGF0YSwgcmVhY3Rpb25JZCwgR3JvdXBTZXR0aW5ncy5nZXQoKSk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGdldFBhZ2VEYXRhKHBhZ2VIYXNoLCBjYWxsYmFjaykge1xuICAgIGlmIChwYWdlSGFzaCkge1xuICAgICAgICAvLyBUaGlzIG1vZHVsZSBsb2FkcyB2ZXJ5IGVhcmx5IGluIHRoZSBhcHAgbGlmZWN5Y2xlIGFuZCBtYXkgcmVjZWl2ZSBldmVudHMgZnJvbSB0aGUgWERNIGZyYW1lIGJlZm9yZSBwYWdlXG4gICAgICAgIC8vIGRhdGEgaGFzIGJlZW4gbG9hZGVkLiBIb2xkIG9udG8gYW55IHN1Y2ggZXZlbnRzIHVudGlsIHRoZSBwYWdlIGRhdGEgbG9hZHMgb3Igd2UgdGltZW91dC5cbiAgICAgICAgdmFyIG1heFdhaXRUaW1lID0gRGF0ZS5ub3coKSArIDEwMDAwOyAvLyBHaXZlIHVwIGFmdGVyIDEwIHNlY29uZHNcbiAgICAgICAgdmFyIGludGVydmFsID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHBhZ2VEYXRhID0gUGFnZURhdGEuZ2V0UGFnZURhdGEocGFnZUhhc2gpO1xuICAgICAgICAgICAgaWYgKHBhZ2VEYXRhKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2socGFnZURhdGEpO1xuICAgICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoaW50ZXJ2YWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKERhdGUubm93KCkgPiBtYXhXYWl0VGltZSkge1xuICAgICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoaW50ZXJ2YWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCA1MCk7XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBzdGFydDogc3RhcnRMaXN0ZW5pbmdcbn07IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEgYW50ZW5uYS1hdXRvLWN0YVwifSxcIm9cIjpcImNzc3Jlc2V0XCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtYXV0by1jdGEtaW5uZXJcIixcImFudC1jdGEtZm9yXCI6W3tcInRcIjoyLFwiclwiOlwiYW50SXRlbUlkXCJ9XX0sXCJmXCI6W3tcInRcIjo4LFwiclwiOlwibG9nb1wifSx7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1hdXRvLWN0YS1sYWJlbFwiLFwiYW50LXJlYWN0aW9ucy1sYWJlbC1mb3JcIjpbe1widFwiOjIsXCJyXCI6XCJhbnRJdGVtSWRcIn1dfX0se1widFwiOjQsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImFudC1leHBhbmRlZC1yZWFjdGlvbnMtZm9yXCI6W3tcInRcIjoyLFwiclwiOlwiYW50SXRlbUlkXCJ9XX19XSxcIm5cIjo1MCxcInJcIjpcImV4cGFuZFJlYWN0aW9uc1wifV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXBhZ2UgYW50ZW5uYS1ibG9ja2VkLXBhZ2VcIn0sXCJvXCI6XCJjc3NyZXNldFwiLFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWJvZHlcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJ2XCI6e1widGFwXCI6XCJiYWNrXCJ9LFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWJsb2NrZWQtYmFja1wifSxcImZcIjpbe1widFwiOjgsXCJyXCI6XCJsZWZ0XCJ9LHtcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcInJlYWN0aW9uc193aWRnZXRfX2JhY2tcXFwiKVwifX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWJsb2NrZWQtYm9keVwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1ibG9ja2VkLW1lc3NhZ2VcIn0sXCJmXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcImJsb2NrZWRfcGFnZV9fbWVzc2FnZTFcXFwiKVwifX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWJsb2NrZWQtbWVzc2FnZVwifSxcImZcIjpbe1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwiYmxvY2tlZF9wYWdlX19tZXNzYWdlMlxcXCIpXCJ9fV19XX1dfV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjQsXCJmXCI6W3tcInRcIjoyLFwiclwiOlwiY29udGFpbmVyRGF0YS5yZWFjdGlvblRvdGFsXCJ9XSxcIm5cIjo1MCxcInhcIjp7XCJyXCI6W1wiY29udGFpbmVyRGF0YS5yZWFjdGlvblRvdGFsXCIsXCJjb250YWluZXJEYXRhLmxvYWRlZFwiXSxcInNcIjpcIl8wIT09dW5kZWZpbmVkJiZfMVwifX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NCxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpbXCJhbnRlbm5hLWN0YS1leHBhbmRlZC1yZWFjdGlvbiBcIix7XCJ0XCI6NCxcImZcIjpbXCJhbnRlbm5hLWN0YS1leHBhbmRlZC1maXJzdFwiXSxcIm5cIjo1MCxcInhcIjp7XCJyXCI6W1wiQGluZGV4XCJdLFwic1wiOlwiXzA9PT0wXCJ9fV19LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jdGEtZXhwYW5kZWQtdGV4dFwifSxcImZcIjpbe1widFwiOjIsXCJyXCI6XCIuL3RleHRcIn1dfSx7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jdGEtZXhwYW5kZWQtY291bnRcIn0sXCJmXCI6W3tcInRcIjoyLFwiclwiOlwiLi9jb3VudFwifV19XX1dLFwieFwiOntcInJcIjpbXCJjb21wdXRlRXhwYW5kZWRSZWFjdGlvbnNcIixcImNvbnRhaW5lckRhdGEucmVhY3Rpb25zXCJdLFwic1wiOlwiXzAoXzEpXCJ9fV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo0LFwiZlwiOlt7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJjYWxsX3RvX2FjdGlvbl9sYWJlbF9fcmVzcG9uc2VzXFxcIilcIn19XSxcIm5cIjo1MCxcInhcIjp7XCJyXCI6W1wiY29udGFpbmVyRGF0YS5yZWFjdGlvblRvdGFsXCIsXCJjb250YWluZXJEYXRhLmxvYWRlZFwiXSxcInNcIjpcIl8wPT09dW5kZWZpbmVkfHwhXzFcIn19LHtcInRcIjo0LFwiblwiOjUxLFwiZlwiOlt7XCJ0XCI6NCxcIm5cIjo1MCxcInhcIjp7XCJyXCI6W1wiY29udGFpbmVyRGF0YS5yZWFjdGlvblRvdGFsXCJdLFwic1wiOlwiXzA9PT0xXCJ9LFwiZlwiOlt7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJjYWxsX3RvX2FjdGlvbl9sYWJlbF9fcmVzcG9uc2VzX29uZVxcXCIpXCJ9fV19LHtcInRcIjo0LFwiblwiOjUwLFwieFwiOntcInJcIjpbXCJjb250YWluZXJEYXRhLnJlYWN0aW9uVG90YWxcIl0sXCJzXCI6XCIhKF8wPT09MSlcIn0sXCJmXCI6W1wiIFwiLHtcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCIsXCJjb250YWluZXJEYXRhLnJlYWN0aW9uVG90YWxcIl0sXCJzXCI6XCJfMChcXFwiY2FsbF90b19hY3Rpb25fbGFiZWxfX3Jlc3BvbnNlc19tYW55XFxcIixbXzFdKVwifX1dfV0sXCJ4XCI6e1wiclwiOltcImNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbFwiLFwiY29udGFpbmVyRGF0YS5sb2FkZWRcIl0sXCJzXCI6XCJfMD09PXVuZGVmaW5lZHx8IV8xXCJ9fV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY29tbWVudC1hcmVhXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWNvbW1lbnQtd2lkZ2V0c1wifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJ0ZXh0YXJlYVwiLFwidlwiOntcImlucHV0XCI6XCJpbnB1dGNoYW5nZWRcIn0sXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY29tbWVudC1pbnB1dFwiLFwicGxhY2Vob2xkZXJcIjpbe1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwiY29tbWVudF9hcmVhX19wbGFjZWhvbGRlclxcXCIpXCJ9fV0sXCJtYXhsZW5ndGhcIjpcIjUwMFwifX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb21tZW50LWZvb3RlclwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY29tbWVudC1saW1pdFwifSxcImZcIjpbe1widFwiOjMsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwiY29tbWVudF9hcmVhX19jb3VudFxcXCIpXCJ9fV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiYnV0dG9uXCIsXCJhXCI6e1wiaWRcIjpcImFudGVubmEtY29tbWVudC1zcGFjZXJcIn19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiYnV0dG9uXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY29tbWVudC1zdWJtaXRcIn0sXCJ2XCI6e1widGFwXCI6XCJhZGRjb21tZW50XCJ9LFwiZlwiOlt7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJjb21tZW50X2FyZWFfX2FkZFxcXCIpXCJ9fV19XX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWNvbW1lbnQtd2FpdGluZ1wifSxcImZcIjpbXCIuLi5cIl19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY29tbWVudC1yZWNlaXZlZFwifSxcImZcIjpbe1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwiY29tbWVudF9hcmVhX190aGFua3NcXFwiKVwifX1dfV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1wYWdlIGFudGVubmEtY29tbWVudHMtcGFnZVwifSxcIm9cIjpcImNzc3Jlc2V0XCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtYm9keVwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcInZcIjp7XCJ0YXBcIjpcImJhY2tcIn0sXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY29tbWVudHMtYmFja1wifSxcImZcIjpbe1widFwiOjgsXCJyXCI6XCJsZWZ0XCJ9LHtcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcInJlYWN0aW9uc193aWRnZXRfX2JhY2tcXFwiKVwifX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWNvbW1lbnRzLWhlYWRlclwifSxcImZcIjpbe1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIixcImNvbW1lbnRzLmxlbmd0aFwiXSxcInNcIjpcIl8wKFxcXCJjb21tZW50c19wYWdlX19oZWFkZXJcXFwiLFtfMV0pXCJ9fV19LFwiIFwiLHtcInRcIjo0LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6W1wiYW50ZW5uYS1jb21tZW50LWVudHJ5IFwiLHtcInRcIjo0LFwiZlwiOltcImFudGVubmEtY29tbWVudC1uZXdcIl0sXCJuXCI6NTAsXCJyXCI6XCIuL25ld1wifV19LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInRhYmxlXCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwidHJcIixcImZcIjpbe1widFwiOjcsXCJlXCI6XCJ0ZFwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWNvbW1lbnQtY2VsbFwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJpbWdcIixcImFcIjp7XCJzcmNcIjpbe1widFwiOjIsXCJyXCI6XCIuL3VzZXIuaW1hZ2VVUkxcIn1dfX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcInRkXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY29tbWVudC1hdXRob3JcIn0sXCJmXCI6W3tcInRcIjoyLFwiclwiOlwiLi91c2VyLm5hbWVcIn1dfV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwidHJcIixcImZcIjpbe1widFwiOjcsXCJlXCI6XCJ0ZFwiLFwiZlwiOltdfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcInRkXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY29tbWVudC10ZXh0XCJ9LFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcIi4vdGV4dFwifV19XX1dfV19XSxcImlcIjpcImluZGV4XCIsXCJyXCI6XCJjb21tZW50c1wifSxcIiBcIix7XCJ0XCI6OCxcInJcIjpcImNvbW1lbnRBcmVhXCJ9XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcGFnZSBhbnRlbm5hLWNvbmZpcm1hdGlvbi1wYWdlXCJ9LFwib1wiOlwiY3NzcmVzZXRcIixcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1ib2R5XCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWNvbW1lbnQtcmVhY3Rpb25cIn0sXCJmXCI6W3tcInRcIjoyLFwiclwiOlwidGV4dFwifV19LFwiIFwiLHtcInRcIjo4LFwiclwiOlwiY29tbWVudEFyZWFcIn1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWZvb3RlciBhbnRlbm5hLWNvbmZpcm0tZm9vdGVyXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1zaGFyZVwifSxcImZcIjpbe1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwiY29uZmlybWF0aW9uX3BhZ2VfX3NoYXJlXFxcIilcIn19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiYVwiLFwidlwiOntcInRhcFwiOlwic2hhcmUtZmFjZWJvb2tcIn0sXCJhXCI6e1wiaHJlZlwiOlwiLy9mYWNlYm9vay5jb21cIn0sXCJmXCI6W3tcInRcIjo4LFwiclwiOlwiZmFjZWJvb2tJY29uXCJ9XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJhXCIsXCJ2XCI6e1widGFwXCI6XCJzaGFyZS10d2l0dGVyXCJ9LFwiYVwiOntcImhyZWZcIjpcIi8vdHdpdHRlci5jb21cIn0sXCJmXCI6W3tcInRcIjo4LFwiclwiOlwidHdpdHRlckljb25cIn1dfV19XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJ2XCI6e1wia2V5ZG93blwiOlwicGFnZWtleWRvd25cIn0sXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcGFnZSBhbnRlbm5hLWRlZmF1bHRzLXBhZ2VcIixcInRhYmluZGV4XCI6XCIwXCJ9LFwib1wiOlwiY3NzcmVzZXRcIixcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1ib2R5XCJ9LFwiZlwiOlt7XCJ0XCI6NCxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcInZcIjp7XCJ0YXBcIjpcIm5ld3JlYWN0aW9uXCJ9LFwiYVwiOntcImNsYXNzXCI6W1wiYW50ZW5uYS1yZWFjdGlvbiBcIix7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZGVmYXVsdExheW91dENsYXNzXCIsXCJpbmRleFwiXSxcInNcIjpcIl8wKF8xKVwifX1dfSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1yZWFjdGlvbi1ib3hcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcmVhY3Rpb24tdGV4dFwifSxcIm9cIjpcInNpemV0b2ZpdFwiLFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcIi4vdGV4dFwifV19XX1dfV0sXCJpXCI6XCJpbmRleFwiLFwiclwiOlwiZGVmYXVsdFJlYWN0aW9uc1wifV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtZm9vdGVyIGFudGVubmEtZGVmYXVsdHMtZm9vdGVyXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWN1c3RvbS1hcmVhXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImlucHV0XCIsXCJ2XCI6e1wiZm9jdXNcIjpcImN1c3RvbWZvY3VzXCIsXCJrZXlkb3duXCI6XCJpbnB1dGtleWRvd25cIixcImJsdXJcIjpcImN1c3RvbWJsdXJcIn0sXCJhXCI6e1widmFsdWVcIjpbe1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwiZGVmYXVsdHNfcGFnZV9fYWRkXFxcIilcIn19XSxcIm1heGxlbmd0aFwiOlwiMjVcIn19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiYnV0dG9uXCIsXCJ2XCI6e1widGFwXCI6XCJuZXdjdXN0b21cIn0sXCJmXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcImRlZmF1bHRzX3BhZ2VfX29rXFxcIilcIn19XX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXRleHQtbG9nb1wifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJhXCIsXCJhXCI6e1wiaHJlZlwiOlwiLy93d3cuYW50ZW5uYS5pc1wifSxcImZcIjpbXCJBbnRlbm5hXCJdfV19XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcGFnZSBhbnRlbm5hLWVycm9yLXBhZ2VcIn0sXCJvXCI6XCJjc3NyZXNldFwiLFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWJvZHlcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJ2XCI6e1widGFwXCI6XCJiYWNrXCJ9LFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWVycm9yLWJhY2tcIn0sXCJmXCI6W3tcInRcIjo4LFwiclwiOlwibGVmdFwifSx7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJyZWFjdGlvbnNfd2lkZ2V0X19iYWNrXFxcIilcIn19XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1lcnJvci1ib2R5XCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWVycm9yLW1lc3NhZ2VcIn0sXCJmXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcImVycm9yX3BhZ2VfX21lc3NhZ2VcXFwiKVwifX1dfV19XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcGFnZSBhbnRlbm5hLWxvY2F0aW9ucy1wYWdlXCJ9LFwib1wiOlwiY3NzcmVzZXRcIixcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1ib2R5XCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwidlwiOntcInRhcFwiOlwiYmFja1wifSxcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1sb2NhdGlvbnMtYmFja1wifSxcImZcIjpbe1widFwiOjgsXCJyXCI6XCJsZWZ0XCJ9LHtcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcInJlYWN0aW9uc193aWRnZXRfX2JhY2tcXFwiKVwifX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcInRhYmxlXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtbG9jYXRpb25zLXRhYmxlXCJ9LFwiZlwiOlt7XCJ0XCI6NCxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJ0clwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxvY2F0aW9ucy1jb250ZW50LXJvd1wifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJ0ZFwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxvY2F0aW9ucy1jb3VudC1jZWxsXCJ9LFwiZlwiOlt7XCJ0XCI6NCxcImZcIjpbe1widFwiOjMsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwibG9jYXRpb25zX3BhZ2VfX2NvdW50X29uZVxcXCIpXCJ9fV0sXCJuXCI6NTAsXCJ4XCI6e1wiclwiOltcInBhZ2VSZWFjdGlvbkNvdW50XCJdLFwic1wiOlwiXzA9PT0xXCJ9fSx7XCJ0XCI6NCxcIm5cIjo1MSxcImZcIjpbe1widFwiOjMsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIixcInBhZ2VSZWFjdGlvbkNvdW50XCJdLFwic1wiOlwiXzAoXFxcImxvY2F0aW9uc19wYWdlX19jb3VudF9tYW55XFxcIixbXzFdKVwifX1dLFwieFwiOntcInJcIjpbXCJwYWdlUmVhY3Rpb25Db3VudFwiXSxcInNcIjpcIl8wPT09MVwifX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcInRkXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtbG9jYXRpb25zLXBhZ2UtYm9keVwifSxcImZcIjpbe1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwibG9jYXRpb25zX3BhZ2VfX3BhZ2VsZXZlbFxcXCIpXCJ9fV19XX1dLFwiblwiOjUwLFwiclwiOlwicGFnZVJlYWN0aW9uQ291bnRcIn0sXCIgXCIse1widFwiOjQsXCJmXCI6W3tcInRcIjo0LFwiZlwiOltcIiBcIix7XCJ0XCI6NyxcImVcIjpcInRyXCIsXCJ2XCI6e1widGFwXCI6XCJyZXZlYWxcIn0sXCJhXCI6e1wiY2xhc3NcIjpbXCJhbnRlbm5hLWxvY2F0aW9ucy1jb250ZW50LXJvdyBcIix7XCJ0XCI6NCxcImZcIjpbXCJhbnRlbm5hLWxvY2F0ZVwiXSxcIm5cIjo1MCxcInhcIjp7XCJyXCI6W1wiY2FuTG9jYXRlXCIsXCIuL2NvbnRhaW5lckhhc2hcIl0sXCJzXCI6XCJfMChfMSlcIn19XX0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwidGRcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1sb2NhdGlvbnMtY291bnQtY2VsbFwifSxcImZcIjpbe1widFwiOjQsXCJmXCI6W3tcInRcIjozLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcImxvY2F0aW9uc19wYWdlX19jb3VudF9vbmVcXFwiKVwifX1dLFwiblwiOjUwLFwieFwiOntcInJcIjpbXCIuL2NvdW50XCJdLFwic1wiOlwiXzA9PT0xXCJ9fSx7XCJ0XCI6NCxcIm5cIjo1MSxcImZcIjpbe1widFwiOjMsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIixcIi4vY291bnRcIl0sXCJzXCI6XCJfMChcXFwibG9jYXRpb25zX3BhZ2VfX2NvdW50X21hbnlcXFwiLFtfMV0pXCJ9fV0sXCJ4XCI6e1wiclwiOltcIi4vY291bnRcIl0sXCJzXCI6XCJfMD09PTFcIn19XX0sXCIgXCIse1widFwiOjQsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwidGRcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1sb2NhdGlvbnMtdGV4dC1ib2R5XCJ9LFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcIi4vYm9keVwifV19XSxcIm5cIjo1MCxcInhcIjp7XCJyXCI6W1wiLi9raW5kXCJdLFwic1wiOlwiXzA9PT1cXFwidHh0XFxcIlwifX0se1widFwiOjQsXCJuXCI6NTEsXCJmXCI6W3tcInRcIjo0LFwiblwiOjUwLFwieFwiOntcInJcIjpbXCIuL2tpbmRcIl0sXCJzXCI6XCJfMD09PVxcXCJpbWdcXFwiXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInRkXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtbG9jYXRpb25zLWltYWdlLWJvZHlcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiaW1nXCIsXCJhXCI6e1wic3JjXCI6W3tcInRcIjoyLFwiclwiOlwiLi9ib2R5XCJ9XX19XX1dfSx7XCJ0XCI6NCxcIm5cIjo1MCxcInhcIjp7XCJyXCI6W1wiLi9raW5kXCJdLFwic1wiOlwiKCEoXzA9PT1cXFwiaW1nXFxcIikpJiYoXzA9PT1cXFwibWVkXFxcIilcIn0sXCJmXCI6W1wiIFwiLHtcInRcIjo3LFwiZVwiOlwidGRcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1sb2NhdGlvbnMtbWVkaWEtYm9keVwifSxcImZcIjpbe1widFwiOjgsXCJyXCI6XCJmaWxtXCJ9LHtcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxvY2F0aW9ucy12aWRlb1wifSxcImZcIjpbe1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwibG9jYXRpb25zX3BhZ2VfX3ZpZGVvXFxcIilcIn19XX1dfV19LHtcInRcIjo0LFwiblwiOjUwLFwieFwiOntcInJcIjpbXCIuL2tpbmRcIl0sXCJzXCI6XCIoIShfMD09PVxcXCJpbWdcXFwiKSkmJighKF8wPT09XFxcIm1lZFxcXCIpKVwifSxcImZcIjpbXCIgXCIse1widFwiOjcsXCJlXCI6XCJ0ZFwiLFwiZlwiOltcIsKgXCJdfV19XSxcInhcIjp7XCJyXCI6W1wiLi9raW5kXCJdLFwic1wiOlwiXzA9PT1cXFwidHh0XFxcIlwifX1dfV0sXCJuXCI6NTAsXCJ4XCI6e1wiclwiOltcIi4va2luZFwiXSxcInNcIjpcIl8wIT09XFxcInBhZ1xcXCJcIn19XSxcImlcIjpcImlkXCIsXCJyXCI6XCJsb2NhdGlvbkRhdGFcIn1dfV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXBhZ2UgYW50ZW5uYS1sb2dpbi1wYWdlXCJ9LFwib1wiOlwiY3NzcmVzZXRcIixcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1ib2R5XCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwidlwiOntcInRhcFwiOlwiYmFja1wifSxcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1sb2dpbi1iYWNrXCJ9LFwiZlwiOlt7XCJ0XCI6OCxcInJcIjpcImxlZnRcIn0se1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwicmVhY3Rpb25zX3dpZGdldF9fYmFja1xcXCIpXCJ9fV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtbG9naW4tY29udGFpbmVyXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImlmcmFtZVwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxvZ2luLWlmcmFtZVwiLFwic3JjXCI6W3tcInRcIjoyLFwiclwiOlwibG9naW5QYWdlVXJsXCJ9XSxcInNlYW1sZXNzXCI6MH19XX1dfV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJvXCI6XCJjc3NyZXNldFwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hIGFudGVubmEtbWVkaWEtaW5kaWNhdG9yLXdyYXBwZXJcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6W1wiYW50ZW5uYSBhbnRlbm5hLW1lZGlhLWluZGljYXRvci13aWRnZXQgXCIse1widFwiOjQsXCJmXCI6W1wiYW50ZW5uYS1ub3Rsb2FkZWRcIl0sXCJuXCI6NTEsXCJyXCI6XCJjb250YWluZXJEYXRhLmxvYWRlZFwifV19LFwibVwiOlt7XCJ0XCI6MixcInJcIjpcImV4dHJhQXR0cmlidXRlc1wifV0sXCJmXCI6W3tcInRcIjo4LFwiclwiOlwibG9nb1wifSxcIiBcIix7XCJ0XCI6NCxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcmVhY3Rpb24tdG90YWxcIn0sXCJmXCI6W3tcInRcIjoyLFwiclwiOlwiY29udGFpbmVyRGF0YS5yZWFjdGlvblRvdGFsXCJ9XX1dLFwiblwiOjUwLFwiclwiOlwiY29udGFpbmVyRGF0YS5yZWFjdGlvblRvdGFsXCJ9LHtcInRcIjo0LFwiblwiOjUxLFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1yZWFjdGlvbi1wcm9tcHRcIn0sXCJmXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcIm1lZGlhX2luZGljYXRvcl9fdGhpbmtcXFwiKVwifX1dfV0sXCJyXCI6XCJjb250YWluZXJEYXRhLnJlYWN0aW9uVG90YWxcIn1dfV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1wYWdlIGFudGVubmEtcGVuZGluZy1wYWdlXCJ9LFwib1wiOlwiY3NzcmVzZXRcIixcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1ib2R5XCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXBlbmRpbmctcmVhY3Rpb25cIn0sXCJmXCI6W3tcInRcIjoyLFwiclwiOlwidGV4dFwifV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcGVuZGluZy1tZXNzYWdlXCJ9LFwiZlwiOlt7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJwZW5kaW5nX3BhZ2VfX21lc3NhZ2VfYXBwZWFyXFxcIilcIn19XX1dfV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1wb3B1cFwifSxcIm9cIjpcImNzc3Jlc2V0XCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcG9wdXAtYm9keVwifSxcImZcIjpbe1widFwiOjgsXCJyXCI6XCJsb2dvXCJ9LHtcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXBvcHVwLXRleHRcIn0sXCJmXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcInBvcHVwX3dpZGdldF9fdGhpbmtcXFwiKVwifX1dfV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXBhZ2UgYW50ZW5uYS1yZWFjdGlvbnMtcGFnZVwifSxcIm9cIjpcImNzc3Jlc2V0XCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtYm9keVwifSxcImZcIjpbe1widFwiOjQsXCJmXCI6W3tcInRcIjo0LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwidlwiOntcInRhcFwiOlwicGx1c29uZVwiLFwibW91c2VlbnRlclwiOlwiaGlnaGxpZ2h0XCIsXCJtb3VzZWxlYXZlXCI6XCJjbGVhcmhpZ2hsaWdodHNcIn0sXCJhXCI6e1wiY2xhc3NcIjpbXCJhbnRlbm5hLXJlYWN0aW9uIFwiLHtcInRcIjoyLFwieFwiOntcInJcIjpbXCJyZWFjdGlvbnNMYXlvdXRDbGFzc1wiLFwiaW5kZXhcIixcIi4vY291bnRcIl0sXCJzXCI6XCJfMChfMSxfMilcIn19XX0sXCJmXCI6W1wiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcmVhY3Rpb24tYm94XCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXJlYWN0aW9uLXRleHRcIn0sXCJvXCI6XCJzaXpldG9maXRcIixcImZcIjpbe1widFwiOjIsXCJyXCI6XCIuL3RleHRcIn1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXJlYWN0aW9uLWNvdW50XCJ9LFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcIi4vY291bnRcIn1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXBsdXNvbmVcIn0sXCJmXCI6W1wiKzFcIl19LFwiIFwiLHtcInRcIjo0LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwidlwiOntcInRhcFwiOlwic2hvd2xvY2F0aW9uc1wifSxcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1yZWFjdGlvbi1sb2NhdGlvblwifSxcImZcIjpbe1widFwiOjgsXCJyXCI6XCJsb2NhdGlvbkljb25cIn1dfV0sXCJuXCI6NTAsXCJyXCI6XCJpc1N1bW1hcnlcIn0se1widFwiOjQsXCJuXCI6NTEsXCJmXCI6W3tcInRcIjo0LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwidlwiOntcInRhcFwiOlwic2hvd2NvbW1lbnRzXCJ9LFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXJlYWN0aW9uLWNvbW1lbnRzIGhhc2NvbW1lbnRzXCJ9LFwiZlwiOlt7XCJ0XCI6OCxcInJcIjpcImNvbW1lbnRzSWNvblwifSxcIiBcIix7XCJ0XCI6MixcInJcIjpcIi4vY29tbWVudENvdW50XCJ9XX1dLFwiblwiOjUwLFwiclwiOlwiLi9jb21tZW50Q291bnRcIn0se1widFwiOjQsXCJuXCI6NTEsXCJmXCI6W3tcInRcIjo0LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXJlYWN0aW9uLWNvbW1lbnRzXCJ9LFwiZlwiOlt7XCJ0XCI6OCxcInJcIjpcImNvbW1lbnRzSWNvblwifV19XSxcIm5cIjo1MCxcInhcIjp7XCJyXCI6W1wiaGlkZUNvbW1lbnRJbnB1dFwiXSxcInNcIjpcIiFfMFwifX1dLFwiclwiOlwiLi9jb21tZW50Q291bnRcIn1dLFwiclwiOlwiaXNTdW1tYXJ5XCJ9XX1dfV0sXCJpXCI6XCJpbmRleFwiLFwiclwiOlwicmVhY3Rpb25zXCJ9XSxcIm5cIjo1MCxcInJcIjpcInJlYWN0aW9uc1wifV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtZm9vdGVyIGFudGVubmEtcmVhY3Rpb25zLWZvb3RlclwifSxcImZcIjpbe1widFwiOjQsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJ2XCI6e1widGFwXCI6XCJzaG93ZGVmYXVsdFwifSxcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS10aGlua1wifSxcImZcIjpbe1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwicmVhY3Rpb25zX3BhZ2VfX3RoaW5rXFxcIilcIn19XX1dLFwiblwiOjUwLFwiclwiOlwicmVhY3Rpb25zXCJ9LHtcInRcIjo0LFwiblwiOjUxLFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLW5vLXJlYWN0aW9uc1wifSxcImZcIjpbe1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwicmVhY3Rpb25zX3BhZ2VfX25vX3JlYWN0aW9uc1xcXCIpXCJ9fV19XSxcInJcIjpcInJlYWN0aW9uc1wifSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXRleHQtbG9nb1wifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJhXCIsXCJhXCI6e1wiaHJlZlwiOlwiLy93d3cuYW50ZW5uYS5pc1wiLFwidGFyZ2V0XCI6XCJfYmxhbmtcIn0sXCJmXCI6W1wiQW50ZW5uYVwiXX1dfV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6W1wiYW50ZW5uYSBhbnRlbm5hLXJlYWN0aW9ucy13aWRnZXQgXCIse1widFwiOjQsXCJmXCI6W1wiYW50ZW5uYS10b3VjaFwiXSxcIm5cIjo1MCxcInJcIjpcInN1cHBvcnRzVG91Y2hcIn1dLFwidGFiaW5kZXhcIjpcIjBcIn0sXCJvXCI6XCJjc3NyZXNldFwiLFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWhlYWRlclwifSxcImZcIjpbe1widFwiOjgsXCJyXCI6XCJsb2dvXCJ9LHtcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXJlYWN0aW9ucy10aXRsZVwifSxcImZcIjpbe1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwicmVhY3Rpb25zX3dpZGdldF9fdGl0bGVcXFwiKVwifX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcInZcIjp7XCJ0YXBcIjpcImNsb3NlXCJ9LFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXJlYWN0aW9ucy1jbG9zZVwifSxcImZcIjpbXCJYXCJdfV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcGFnZS1jb250YWluZXJcIn0sXCJmXCI6W1wiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcHJvZ3Jlc3MtcGFnZSBhbnRlbm5hLXBhZ2VcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtYm9keVwifSxcImZcIjpbXX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1wcm9ncmVzcy1zcGlubmVyXCJ9LFwiZlwiOlt7XCJ0XCI6OCxcInJcIjpcImxvZ29cIn1dfV19XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJvXCI6XCJjc3NyZXNldFwiLFwiYVwiOntcImNsYXNzXCI6W1wiYW50ZW5uYSBhbnRlbm5hLXN1bW1hcnktd2lkZ2V0IFwiLHtcInRcIjo0LFwiZlwiOltcImFudGVubmEtbm90bG9hZGVkXCJdLFwiblwiOjUxLFwiclwiOlwicGFnZURhdGEuc3VtbWFyeUxvYWRlZFwifSxcIiBcIix7XCJ0XCI6NCxcImZcIjpbXCJhbnRlbm5hLWV4cGFuZGVkLXN1bW1hcnlcIl0sXCJuXCI6NTAsXCJyXCI6XCJpc0V4cGFuZGVkU3VtbWFyeVwifV19LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXN1bW1hcnktaW5uZXJcIn0sXCJmXCI6W3tcInRcIjo4LFwiclwiOlwibG9nb1wifSx7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1zdW1tYXJ5LXRpdGxlXCJ9LFwiZlwiOltcIiBcIix7XCJ0XCI6NCxcImZcIjpbe1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwic3VtbWFyeV93aWRnZXRfX3JlYWN0aW9uc1xcXCIpXCJ9fV0sXCJuXCI6NTAsXCJ4XCI6e1wiclwiOltcInBhZ2VEYXRhLnN1bW1hcnlUb3RhbFwiXSxcInNcIjpcIl8wPT09MFwifX0se1widFwiOjQsXCJuXCI6NTEsXCJmXCI6W3tcInRcIjo0LFwiblwiOjUwLFwieFwiOntcInJcIjpbXCJwYWdlRGF0YS5zdW1tYXJ5VG90YWxcIl0sXCJzXCI6XCJfMD09PTFcIn0sXCJmXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcInN1bW1hcnlfd2lkZ2V0X19yZWFjdGlvbnNfb25lXFxcIilcIn19XX0se1widFwiOjQsXCJuXCI6NTAsXCJ4XCI6e1wiclwiOltcInBhZ2VEYXRhLnN1bW1hcnlUb3RhbFwiXSxcInNcIjpcIiEoXzA9PT0xKVwifSxcImZcIjpbXCIgXCIse1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIixcInBhZ2VEYXRhLnN1bW1hcnlUb3RhbFwiXSxcInNcIjpcIl8wKFxcXCJzdW1tYXJ5X3dpZGdldF9fcmVhY3Rpb25zX21hbnlcXFwiLFtfMV0pXCJ9fV19XSxcInhcIjp7XCJyXCI6W1wicGFnZURhdGEuc3VtbWFyeVRvdGFsXCJdLFwic1wiOlwiXzA9PT0wXCJ9fV19LHtcInRcIjo0LFwiZlwiOlt7XCJ0XCI6NCxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpbXCJhbnRlbm5hLWV4cGFuZGVkLXJlYWN0aW9uIFwiLHtcInRcIjo0LFwiZlwiOltcImFudGVubmEtZXhwYW5kZWQtZmlyc3RcIl0sXCJuXCI6NTAsXCJ4XCI6e1wiclwiOltcIkBpbmRleFwiXSxcInNcIjpcIl8wPT09MFwifX1dfSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtZXhwYW5kZWQtdGV4dFwifSxcImZcIjpbe1widFwiOjIsXCJyXCI6XCIuL3RleHRcIn1dfSx7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1leHBhbmRlZC1jb3VudFwifSxcImZcIjpbe1widFwiOjIsXCJyXCI6XCIuL2NvdW50XCJ9XX1dfV0sXCJ4XCI6e1wiclwiOltcImNvbXB1dGVFeHBhbmRlZFJlYWN0aW9uc1wiLFwicGFnZURhdGEuc3VtbWFyeVJlYWN0aW9uc1wiXSxcInNcIjpcIl8wKF8xKVwifX1dLFwiblwiOjUwLFwiclwiOlwiaXNFeHBhbmRlZFN1bW1hcnlcIn1dfV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY29tbWVudHNcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3ZnXCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwidXNlXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY29tbWVudHMtcGF0aFwiLFwieGxpbms6aHJlZlwiOlwiI2FudGVubmEtc3ZnLWNvbW1lbnRcIn19XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWZhY2Vib29rXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInN2Z1wiLFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInVzZVwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWZhY2Vib29rLXBhdGhcIixcInhsaW5rOmhyZWZcIjpcIiNhbnRlbm5hLXN2Zy1mYWNlYm9va1wifX1dfV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtZmlsbVwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJzdmdcIixcImZcIjpbe1widFwiOjcsXCJlXCI6XCJ1c2VcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1maWxtLXBhdGhcIixcInhsaW5rOmhyZWZcIjpcIiNhbnRlbm5hLXN2Zy1maWxtXCJ9fV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1sZWZ0XCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInN2Z1wiLFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInVzZVwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxlZnQtcGF0aFwiLFwieGxpbms6aHJlZlwiOlwiI2FudGVubmEtc3ZnLWxlZnRcIn19XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxvY2F0aW9uXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInN2Z1wiLFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInVzZVwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxvY2F0aW9uLXBhdGhcIixcInhsaW5rOmhyZWZcIjpcIiNhbnRlbm5hLXN2Zy1zZWFyY2hcIn19XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxvZ29cIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3ZnXCIsXCJhXCI6e1widmlld0JveFwiOlwiMCAwIDUxMiA1MTJcIn0sXCJmXCI6W1wiIFwiLHtcInRcIjo3LFwiZVwiOlwicGF0aFwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxvZ28tcGF0aFwiLFwiZFwiOlwibTI4MyA1MTBjMTI1LTE3IDIyOS0xMjQgMjI5LTI1MyAwLTE0MS0xMTUtMjU2LTI1Ni0yNTYtMTQxIDAtMjU2IDExNS0yNTYgMjU2IDAgMTMwIDEwOCAyMzcgMjMzIDI1NGwwLTE0OWMtNDgtMTQtODQtNTAtODQtMTAyIDAtNjUgNDMtMTEzIDEwOC0xMTMgNjUgMCAxMDcgNDggMTA3IDExMyAwIDUyLTMzIDg4LTgxIDEwMnpcIn19XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxvZ29cIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3ZnXCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwidXNlXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtbG9nby1wYXRoXCIsXCJ4bGluazpocmVmXCI6XCIjYW50ZW5uYS1zdmctbG9nb1wifX1dfV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtdHdpdHRlclwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJzdmdcIixcImZcIjpbe1widFwiOjcsXCJlXCI6XCJ1c2VcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS10d2l0dGVyLXBhdGhcIixcInhsaW5rOmhyZWZcIjpcIiNhbnRlbm5hLXN2Zy10d2l0dGVyXCJ9fV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcInN2Z1wiLFwiYVwiOntcInhtbG5zXCI6XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLFwic3R5bGVcIjpcImRpc3BsYXk6IG5vbmU7XCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInN5bWJvbFwiLFwiYVwiOntcImlkXCI6XCJhbnRlbm5hLXN2Zy10d2l0dGVyXCIsXCJ2aWV3Qm94XCI6XCIwIDAgNTEyIDUxMlwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJwYXRoXCIsXCJhXCI6e1wiZFwiOlwibTQ1MyAxMzRjLTE0IDYtMzAgMTEtNDYgMTJjMTYtMTAgMjktMjUgMzUtNDRjLTE1IDktMzMgMTYtNTEgMTljLTE1LTE1LTM2LTI1LTU5LTI1Yy00NSAwLTgxIDM2LTgxIDgxYzAgNiAxIDEyIDIgMThjLTY3LTMtMTI3LTM1LTE2Ny04NGMtNyAxMi0xMSAyNS0xMSA0MGMwIDI4IDE1IDUzIDM2IDY4Yy0xMy0xLTI1LTQtMzYtMTFjMCAxIDAgMSAwIDJjMCAzOSAyOCA3MSA2NSA3OWMtNyAyLTE0IDMtMjIgM2MtNSAwLTEwLTEtMTUtMmMxMCAzMiA0MCA1NiA3NiA1NmMtMjggMjItNjMgMzUtMTAxIDM1Yy02IDAtMTMgMC0xOS0xYzM2IDIzIDc4IDM2IDEyNCAzNmMxNDkgMCAyMzAtMTIzIDIzMC0yMzBjMC0zIDAtNyAwLTEwYzE2LTEyIDI5LTI2IDQwLTQyelwifX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcInN5bWJvbFwiLFwiYVwiOntcImlkXCI6XCJhbnRlbm5hLXN2Zy1mYWNlYm9va1wiLFwidmlld0JveFwiOlwiMCAwIDUxMiA1MTJcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwicGF0aFwiLFwiYVwiOntcImRcIjpcIm00MjAgNzJsLTMyOCAwYy0xMSAwLTIwIDktMjAgMjBsMCAzMjhjMCAxMSA5IDIwIDIwIDIwbDE3NyAwbDAtMTQybC00OCAwbDAtNTZsNDggMGwwLTQxYzAtNDggMjktNzQgNzEtNzRjMjAgMCAzOCAyIDQzIDNsMCA0OWwtMjkgMGMtMjMgMC0yOCAxMS0yOCAyN2wwIDM2bDU1IDBsLTcgNTZsLTQ4IDBsMCAxNDJsOTQgMGMxMSAwIDIwLTkgMjAtMjBsMC0zMjhjMC0xMS05LTIwLTIwLTIwelwifX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcInN5bWJvbFwiLFwiYVwiOntcImlkXCI6XCJhbnRlbm5hLXN2Zy1jb21tZW50XCIsXCJ2aWV3Qm94XCI6XCIwIDAgNTEyIDUxMlwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJwYXRoXCIsXCJhXCI6e1wiZFwiOlwibTUxMiAyNTZjMCAzMy0xMSA2NC0zNCA5MmMtMjMgMjgtNTQgNTAtOTMgNjZjLTQwIDE3LTgzIDI1LTEyOSAyNWMtMTMgMC0yNy0xLTQxLTJjLTM4IDMzLTgyIDU2LTEzMiA2OWMtOSAyLTIwIDQtMzIgNmMtNCAwLTcgMC05LTNjLTMtMi00LTQtNS04bDAgMGMtMS0xLTEtMiAwLTRjMC0xIDAtMiAwLTJjMC0xIDEtMiAyLTNsMS0zYzAgMCAxLTEgMi0yYzItMiAyLTMgMy0zYzEtMSA0LTUgOC0xMGM1LTUgOC04IDEwLTEwYzItMyA1LTYgOS0xMmM0LTUgNy0xMCA5LTE0YzMtNSA1LTEwIDgtMTdjMy03IDUtMTQgOC0yMmMtMzAtMTctNTQtMzgtNzEtNjNjLTE3LTI1LTI2LTUxLTI2LTgwYzAtMjUgNy00OCAyMC03MWMxNC0yMyAzMi00MiA1NS01OGMyMy0xNyA1MC0zMCA4Mi0zOWMzMS0xMCA2NC0xNSA5OS0xNWM0NiAwIDg5IDggMTI5IDI1YzM5IDE2IDcwIDM4IDkzIDY2YzIzIDI4IDM0IDU5IDM0IDkyelwifX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcInN5bWJvbFwiLFwiYVwiOntcImlkXCI6XCJhbnRlbm5hLXN2Zy1zZWFyY2hcIixcInZpZXdCb3hcIjpcIjAgMCA1MTIgNTEyXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInBhdGhcIixcImFcIjp7XCJkXCI6XCJtMzQ3IDIzOGMwLTM2LTEyLTY2LTM3LTkxYy0yNS0yNS01NS0zNy05MS0zN2MtMzUgMC02NSAxMi05MCAzN2MtMjUgMjUtMzggNTUtMzggOTFjMCAzNSAxMyA2NSAzOCA5MGMyNSAyNSA1NSAzOCA5MCAzOGMzNiAwIDY2LTEzIDkxLTM4YzI1LTI1IDM3LTU1IDM3LTkweiBtMTQ3IDIzN2MwIDEwLTQgMTktMTEgMjZjLTcgNy0xNiAxMS0yNiAxMWMtMTAgMC0xOS00LTI2LTExbC05OC05OGMtMzQgMjQtNzIgMzYtMTE0IDM2Yy0yNyAwLTUzLTUtNzgtMTZjLTI1LTExLTQ2LTI1LTY0LTQzYy0xOC0xOC0zMi0zOS00My02NGMtMTAtMjUtMTYtNTEtMTYtNzhjMC0yOCA2LTU0IDE2LTc4YzExLTI1IDI1LTQ3IDQzLTY1YzE4LTE4IDM5LTMyIDY0LTQzYzI1LTEwIDUxLTE1IDc4LTE1YzI4IDAgNTQgNSA3OSAxNWMyNCAxMSA0NiAyNSA2NCA0M2MxOCAxOCAzMiA0MCA0MyA2NWMxMCAyNCAxNiA1MCAxNiA3OGMwIDQyLTEyIDgwLTM2IDExNGw5OCA5OGM3IDcgMTEgMTUgMTEgMjV6XCJ9fV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwic3ltYm9sXCIsXCJhXCI6e1wiaWRcIjpcImFudGVubmEtc3ZnLWxlZnRcIixcInZpZXdCb3hcIjpcIjAgMCA1MTIgNTEyXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInBhdGhcIixcImFcIjp7XCJkXCI6XCJtMzY4IDE2MGwtNjQtNjQtMTYwIDE2MCAxNjAgMTYwIDY0LTY0LTk2LTk2elwifX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcInN5bWJvbFwiLFwiYVwiOntcImlkXCI6XCJhbnRlbm5hLXN2Zy1sb2dvXCIsXCJ2aWV3Qm94XCI6XCIwIDAgNTEyIDUxMlwifSxcImZcIjpbXCIgXCIse1widFwiOjcsXCJlXCI6XCJwYXRoXCIsXCJhXCI6e1wiZFwiOlwibTI4MyA1MTBjMTI1LTE3IDIyOS0xMjQgMjI5LTI1MyAwLTE0MS0xMTUtMjU2LTI1Ni0yNTYtMTQxIDAtMjU2IDExNS0yNTYgMjU2IDAgMTMwIDEwOCAyMzcgMjMzIDI1NGwwLTE0OWMtNDgtMTQtODQtNTAtODQtMTAyIDAtNjUgNDMtMTEzIDEwOC0xMTMgNjUgMCAxMDcgNDggMTA3IDExMyAwIDUyLTMzIDg4LTgxIDEwMnpcIn19XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJzeW1ib2xcIixcImFcIjp7XCJpZFwiOlwiYW50ZW5uYS1zdmctZmlsbVwiLFwidmlld0JveFwiOlwiMCAwIDUxMiA1MTJcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwicGF0aFwiLFwiYVwiOntcImRcIjpcIm05MSA0NTdsMC0zNmMwLTUtMS0xMC01LTEzLTQtNC04LTYtMTMtNmwtMzYgMGMtNSAwLTEwIDItMTMgNi00IDMtNiA4LTYgMTNsMCAzNmMwIDUgMiA5IDYgMTMgMyA0IDggNSAxMyA1bDM2IDBjNSAwIDktMSAxMy01IDQtNCA1LTggNS0xM3ogbTAtMTEwbDAtMzZjMC01LTEtOS01LTEzLTQtNC04LTUtMTMtNWwtMzYgMGMtNSAwLTEwIDEtMTMgNS00IDQtNiA4LTYgMTNsMCAzNmMwIDUgMiAxMCA2IDEzIDMgNCA4IDYgMTMgNmwzNiAwYzUgMCA5LTIgMTMtNiA0LTMgNS04IDUtMTN6IG0wLTEwOWwwLTM3YzAtNS0xLTktNS0xMy00LTMtOC01LTEzLTVsLTM2IDBjLTUgMC0xMCAyLTEzIDUtNCA0LTYgOC02IDEzbDAgMzdjMCA1IDIgOSA2IDEzIDMgMyA4IDUgMTMgNWwzNiAwYzUgMCA5LTIgMTMtNSA0LTQgNS04IDUtMTN6IG0yOTMgMjE5bDAtMTQ2YzAtNS0yLTktNS0xMy00LTQtOC01LTEzLTVsLTIyMCAwYy01IDAtOSAxLTEzIDUtMyA0LTUgOC01IDEzbDAgMTQ2YzAgNSAyIDkgNSAxMyA0IDQgOCA1IDEzIDVsMjIwIDBjNSAwIDktMSAxMy01IDMtNCA1LTggNS0xM3ogbS0yOTMtMzI5bDAtMzdjMC01LTEtOS01LTEyLTQtNC04LTYtMTMtNmwtMzYgMGMtNSAwLTEwIDItMTMgNi00IDMtNiA3LTYgMTJsMCAzN2MwIDUgMiA5IDYgMTMgMyAzIDggNSAxMyA1bDM2IDBjNSAwIDktMiAxMy01IDQtNCA1LTggNS0xM3ogbTQwMyAzMjlsMC0zNmMwLTUtMi0xMC02LTEzLTMtNC04LTYtMTMtNmwtMzYgMGMtNSAwLTkgMi0xMyA2LTQgMy01IDgtNSAxM2wwIDM2YzAgNSAxIDkgNSAxMyA0IDQgOCA1IDEzIDVsMzYgMGM1IDAgMTAtMSAxMy01IDQtNCA2LTggNi0xM3ogbS0xMTAtMjE5bDAtMTQ3YzAtNS0yLTktNS0xMi00LTQtOC02LTEzLTZsLTIyMCAwYy01IDAtOSAyLTEzIDYtMyAzLTUgNy01IDEybDAgMTQ3YzAgNSAyIDkgNSAxMyA0IDMgOCA1IDEzIDVsMjIwIDBjNSAwIDktMiAxMy01IDMtNCA1LTggNS0xM3ogbTExMCAxMDlsMC0zNmMwLTUtMi05LTYtMTMtMy00LTgtNS0xMy01bC0zNiAwYy01IDAtOSAxLTEzIDUtNCA0LTUgOC01IDEzbDAgMzZjMCA1IDEgMTAgNSAxMyA0IDQgOCA2IDEzIDZsMzYgMGM1IDAgMTAtMiAxMy02IDQtMyA2LTggNi0xM3ogbTAtMTA5bDAtMzdjMC01LTItOS02LTEzLTMtMy04LTUtMTMtNWwtMzYgMGMtNSAwLTkgMi0xMyA1LTQgNC01IDgtNSAxM2wwIDM3YzAgNSAxIDkgNSAxMyA0IDMgOCA1IDEzIDVsMzYgMGM1IDAgMTAtMiAxMy01IDQtNCA2LTggNi0xM3ogbTAtMTEwbDAtMzdjMC01LTItOS02LTEyLTMtNC04LTYtMTMtNmwtMzYgMGMtNSAwLTkgMi0xMyA2LTQgMy01IDctNSAxMmwwIDM3YzAgNSAxIDkgNSAxMyA0IDMgOCA1IDEzIDVsMzYgMGM1IDAgMTAtMiAxMy01IDQtNCA2LTggNi0xM3ogbTM2LTQ2bDAgMzg0YzAgMTMtNCAyNC0xMyAzMy05IDktMjAgMTMtMzIgMTNsLTQ1OCAwYy0xMiAwLTIzLTQtMzItMTMtOS05LTEzLTIwLTEzLTMzbDAtMzg0YzAtMTIgNC0yMyAxMy0zMiA5LTkgMjAtMTMgMzItMTNsNDU4IDBjMTIgMCAyMyA0IDMyIDEzIDkgOSAxMyAyMCAxMyAzMnpcIn19XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJvXCI6XCJjc3NyZXNldFwiLFwidlwiOntcInRhcFwiOlwiZGlzbWlzc1wifSxcImFcIjp7XCJjbGFzc1wiOltcImFudGVubmEgYW50ZW5uYS10YXAtaGVscGVyIFwiLHtcInRcIjo0LFwiZlwiOltcImFudGVubmEtaGVscGVyLXRvcFwiXSxcIm5cIjo1MCxcInJcIjpcInBvc2l0aW9uVG9wXCJ9LHtcInRcIjo0LFwiblwiOjUxLFwiZlwiOltcImFudGVubmEtaGVscGVyLWJvdHRvbVwiXSxcInJcIjpcInBvc2l0aW9uVG9wXCJ9XX0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtdGFwLWhlbHBlci1pbm5lclwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImZcIjpbe1widFwiOjgsXCJyXCI6XCJsb2dvXCJ9LHtcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXRhcC1oZWxwZXItcHJvbXB0XCJ9LFwiZlwiOlt7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJ0YXBfaGVscGVyX19wcm9tcHRcXFwiKVwifX1dfV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtdGFwLWhlbHBlci1jbG9zZVwifSxcImZcIjpbe1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwidGFwX2hlbHBlcl9fY2xvc2VcXFwiKVwifX1dfV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcIm9cIjpcImNzc3Jlc2V0XCIsXCJhXCI6e1wiY2xhc3NcIjpbXCJhbnRlbm5hIGFudGVubmEtdGV4dC1pbmRpY2F0b3Itd2lkZ2V0IFwiLHtcInRcIjo0LFwiZlwiOltcImFudGVubmEtbm90bG9hZGVkXCJdLFwiblwiOjUxLFwiclwiOlwiY29udGFpbmVyRGF0YS5sb2FkZWRcIn0sXCIgXCIse1widFwiOjQsXCJmXCI6W1wiYW50ZW5uYS1oYXNyZWFjdGlvbnNcIl0sXCJuXCI6NTAsXCJ4XCI6e1wiclwiOltcImNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbFwiXSxcInNcIjpcIl8wPjBcIn19LFwiIFwiLHtcInRcIjo0LFwiZlwiOltcImFudGVubmEtc3VwcHJlc3NcIl0sXCJuXCI6NTAsXCJyXCI6XCJjb250YWluZXJEYXRhLnN1cHByZXNzXCJ9LFwiIFwiLHtcInRcIjoyLFwiclwiOlwiZXh0cmFDbGFzc2VzXCJ9XX0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXRleHQtaW5kaWNhdG9yLWlubmVyXCJ9LFwiZlwiOlt7XCJ0XCI6OCxcInJcIjpcImxvZ29cIn0se1widFwiOjQsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXJlYWN0aW9uLXRvdGFsXCJ9LFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcImNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbFwifV19XSxcIm5cIjo1MCxcInJcIjpcImNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbFwifV19XX1dfSJdfQ==
