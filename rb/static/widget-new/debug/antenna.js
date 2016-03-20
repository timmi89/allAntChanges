(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
if (window.ANTENNAIS || window.antenna || window.AntennaApp) {
    // Protect against multiple instances of this script being added to the page (or this script and engage.js)
    return;
}
if (!window.MutationObserver || !Element.prototype.addEventListener || !('classList' in document.createElement('div'))) {
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
},{"./css-loader":13,"./group-settings-loader":17,"./page-data-loader":23,"./page-scanner":25,"./reinitializer":31,"./script-loader":32,"./tap-helper":35,"./utils/browser-metrics":40,"./utils/xdm-loader":68,"./xdm-analytics":69}],2:[function(require,module,exports){
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
},{"../templates/auto-call-to-action.hbs.html":70,"./svgs":34,"./utils/browser-metrics":40,"./utils/jquery-provider":43,"./utils/ractive-provider":53}],3:[function(require,module,exports){
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
},{"../templates/blocked-reaction-page.hbs.html":71,"./svgs":34,"./utils/ractive-provider":53}],4:[function(require,module,exports){
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
},{"../templates/call-to-action-counter.hbs.html":72,"./utils/ractive-provider":53}],5:[function(require,module,exports){
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
},{"../templates/call-to-action-expanded-reactions.hbs.html":73,"./utils/ractive-provider":53}],6:[function(require,module,exports){
var CallToActionCounter = require('./call-to-action-counter');
var CallToActionExpandedReactions = require('./call-to-action-expanded-reactions');
var CallToActionLabel = require('./call-to-action-label');
var ReactionsWidget = require('./reactions-widget');
var TouchSupport = require('./utils/touch-support');


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

    TouchSupport.setupTap($ctaElement.get(0), function(event) {
        event.preventDefault();
        event.stopPropagation();
        openReactionsWindow(reactionWidgetOptions, $ctaElement);
    });
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
},{"./call-to-action-counter":4,"./call-to-action-expanded-reactions":5,"./call-to-action-label":7,"./reactions-widget":29,"./utils/touch-support":59}],7:[function(require,module,exports){
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
},{"../templates/call-to-action-label.hbs.html":74,"./utils/ractive-provider":53}],8:[function(require,module,exports){
var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var AjaxClient = require('./utils/ajax-client');
var User = require('./utils/user');

var Events = require('./events');

function setupCommentArea(reactionProvider, containerData, pageData, groupSettings, callback, ractive) {
    if (groupSettings.requiresApproval() || containerData.type === 'page') {
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
},{"./events":15,"./utils/ajax-client":38,"./utils/jquery-provider":43,"./utils/user":64}],9:[function(require,module,exports){
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
},{"../templates/comment-area-partial.hbs.html":75,"../templates/comments-page.hbs.html":76,"./comment-area-partial":8,"./svgs":34,"./utils/jquery-provider":43,"./utils/ractive-provider":53}],10:[function(require,module,exports){
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
},{"../templates/comment-area-partial.hbs.html":75,"../templates/confirmation-page.hbs.html":77,"./comment-area-partial":8,"./events":15,"./svgs":34,"./utils/ajax-client":38,"./utils/jquery-provider":43,"./utils/ractive-provider":53,"./utils/urls":63}],11:[function(require,module,exports){
var AjaxClient = require('./utils/ajax-client');
var URLs = require('./utils/urls');

var contentFetchTriggerSize = 0; // The size of the pool at which we'll proactively fetch more content.
var freshContentPool = [];
var pendingCallbacks = []; // The callback model in this module is unusual because of the way content is served from a pool.
var prefetchedGroups = {}; //

function prefetchIfNeeded(groupSettings) {
    var groupId = groupSettings.groupId();
    if (!prefetchedGroups[groupId]) {
        prefetchedGroups[groupId] = true;
        fetchRecommendedContent(groupSettings);
    }
}

function getRecommendedContent(count, pageData, groupSettings, callback) {
    contentFetchTriggerSize = Math.max(contentFetchTriggerSize, count); // Update the trigger size to the most we've been asked for.
    // Queue up the callback and try to serve. If more content is needed, it will
    // be automatically fetched.
    pendingCallbacks.push({ callback: callback, count: count });
    serveContent(pageData, groupSettings);
}

function fetchRecommendedContent(groupSettings, callback) {
    AjaxClient.getJSONP(URLs.fetchContentRecommendationUrl(), { group_id: groupSettings.groupId()} , function(jsonData) {
        // Update the fresh content pool with the new data. Append any existing content to the end, so it is pulled first.
        var contentData = jsonData || [];
        contentData = massageContent(contentData);
        var newArray = shuffleArray(contentData);
        for (var i = 0; i < freshContentPool.length; i++) {
            newArray.push(freshContentPool[i]);
        }
        freshContentPool = newArray;
        if (callback) { callback(groupSettings); }
    }, function(errorMessage) {
        /* TODO: Error handling */
        console.log('An error occurred fetching recommended content: ' + errorMessage);
    });
}

// Apply any client-side filtering/modifications to the content rec data.
function massageContent(contentData) {
    var massagedContent = [];
    for (var i = 0; i < contentData.length; i++) {
        var data = contentData[i];
        if (data.content.type === 'media') {
            // For now, the only video we handle is YouTube, which has a known format
            // for converting video URLs into images.
            var youtubeMatcher = /^((http|https):)?\/\/(www\.)?youtube\.com.*/;
            if (youtubeMatcher.test(data.content.body)) { // Is this a youtube URL? (the ID matcher below doesn't guarantee this)
                // http://stackoverflow.com/questions/3452546/javascript-regex-how-to-get-youtube-video-id-from-url/27728417#27728417
                var videoIDMatcher = /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/;
                var match = videoIDMatcher.exec(data.content.body);
                if (match.length === 2) {
                    // Convert the content into an image.
                    data.content.body = 'https://img.youtube.com/vi/' + match[1] + '/mqdefault.jpg'; /* 16:9 ratio thumbnail, so we get no black bars. */
                    data.content.type = 'image';
                    massagedContent.push(data);
                }
            }
        } else {
            massagedContent.push(data);
        }
    }
    return massagedContent;
}

function serveContent(pageData, groupSettings, preventLoop/*only used recursively*/) {
    for (var i = 0; i < pendingCallbacks.length; i++) {
        var entry = pendingCallbacks[i];
        var chosenContent = [];
        var urlsToAvoid = [ pageData.canonicalUrl ];
        for (var j = 0; j < entry.count; j++) {
            var preferredType = j % 2 === 0 ? 'image':'text';
            var data = chooseContent(preferredType, urlsToAvoid);
            if (data) {
                chosenContent.push(data);
                urlsToAvoid.push(data.page.url); // don't link to the same page twice
            }
        }
        if (chosenContent.length >= entry.count) {
            entry.callback(chosenContent);
        } else {
            if (!preventLoop) {
                // Ran out of content. Go get more. The "preventLoop" flag tells us whether
                // we've already tried to fetch but we just have no good content to choose.
                fetchRecommendedContent(groupSettings, function() {
                    serveContent(pageData, groupSettings, true);
                });
            }
            break;
        }
    }
    pendingCallbacks = pendingCallbacks.splice(i); // Trim any callbacks that we notified.
}

function chooseContent(preferredType, urlsToAvoid) {
    var alternateIndex;
    for (var i = freshContentPool.length-1; i >= 0; i--) {
        var contentData = freshContentPool[i];
        if (!arrayContains(urlsToAvoid, contentData.page.url)) {
            if (contentData.content.type === preferredType) {
                return freshContentPool.splice(i, 1)[0];
            }
            alternateIndex = i;
        }
    }
    if (alternateIndex !== undefined) {
        return freshContentPool.splice(alternateIndex, 1)[0];
    }
}

function arrayContains(array, element) {
    for (var i = 0; i < array.length; i++) {
        if (array[i] === element) {
            return true;
        }
    }
    return false;
}

// Durstenfeld shuffle algorithm from: http://stackoverflow.com/a/12646864/4135431
function shuffleArray(array) {
    var copy = array.slice(0);
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = copy[i];
        copy[i] = copy[j];
        copy[j] = temp;
    }
    return copy;
}

module.exports = {
    prefetchIfNeeded: prefetchIfNeeded,
    getRecommendedContent: getRecommendedContent
};
},{"./utils/ajax-client":38,"./utils/urls":63}],12:[function(require,module,exports){
var Ractive; require('./utils/ractive-provider').onLoad(function(loadedRactive) { Ractive = loadedRactive;});
var Messages = require('./utils/messages');
var ThrottledEvents = require('./utils/throttled-events');

var ContentRecLoader = require('./content-rec-loader');
var Events = require('./events');
var SVGs = require('./svgs');

function createContentRec(pageData, groupSettings) {
    var contentRecContainer = document.createElement('div');
    contentRecContainer.className = 'antenna antenna-content-rec';
    // We can't really request content until the full page data is loaded (because we need to know the server-side computed
    // canonical URL), but we can start prefetching the content pool for the group.
    ContentRecLoader.prefetchIfNeeded(groupSettings);
    var numEntries = 2;
    var contentData = { entries: undefined }; // Need to stub out the data so Ractive can bind to it
    var ractive = Ractive({
        el: contentRecContainer,
        magic: true,
        append: true,
        data: {
            title: groupSettings.contentRecTitle() || Messages.getMessage('content_rec_widget__title'),
            pageData: pageData,
            contentData: contentData,
            populateContentEntries: populateContentEntries(numEntries, contentData, pageData, groupSettings),
            colors: pickColors(numEntries, groupSettings)
        },
        template: require('../templates/content-rec-widget.hbs.html'),
        partials: {
            logo: SVGs.logo
        },
        decorators: {
            'rendertext': renderText
        }
    });
    setupNavigationHandler();
    setupVisibilityHandler();

    return {
        element: contentRecContainer,
        teardown: function() { ractive.teardown(); }
    };

    function setupNavigationHandler() {
        var pendingNavigation = false;
        ractive.on('navigate', function(ractiveEvent) {
            if (!pendingNavigation) {
                pendingNavigation = true;
                var targetUrl = ractiveEvent.context.page.url;
                var contentId = ractiveEvent.context.content.id;
                Events.postContentRecClicked(pageData, targetUrl, contentId, groupSettings);
                setTimeout(function() { // Give the event some time to post.
                    window.location.href = targetUrl;
                }, 100);
            }
        });
    }

    function setupVisibilityHandler() {
        setTimeout(function() {
            // When content rec loads, give it a moment and then see if we're
            // visible. If not, start tracking scroll events.
            if (isContentRecVisible()) {
                Events.postContentRecVisible(pageData, groupSettings);
            } else {
                ThrottledEvents.on('scroll', handleScrollEvent);
            }
        }, 200);

        function handleScrollEvent() {
            if (isContentRecVisible()) {
                Events.postContentRecVisible(pageData, groupSettings);
                ThrottledEvents.off('scroll', handleScrollEvent);
            }
        }
    }

    function isContentRecVisible() {
        // Because this function is called on scroll, we try to avoid unnecessary
        // computation as much as possible here, bailing out as early as possible.
        // First, check whether we even have page data.
        if (pageData.summaryLoaded) {
            // Then check if the outer content rec is in the viewport at all.
            var contentBox = contentRecContainer.getBoundingClientRect();
            var viewportBottom = document.documentElement.clientHeight;
            if (contentBox.top > 0 && contentBox.top < viewportBottom ||
                contentBox.bottom > 0 && contentBox.bottom < viewportBottom) {
                // Finally, look to see whether any recommended content has been
                // rendered onto the page and is on screen enough to be considered
                // visible.
                var entries = ractive.findAll('.antenna-contentrec-entry');
                for (var i = 0; i < entries.length; i++) {
                    var entry = entries[i];
                    var entryBox = entry.getBoundingClientRect();
                    if (entryBox.top > 0 && entryBox.bottom < viewportBottom) {
                        // The entry is fully visible
                        return true;
                    }
                }
            }
        }
        return false;
    }
}

// This function is triggered from within the Ractive template when the page data is loaded. Once page data is loaded,
// we're ready to ask for content.
function populateContentEntries(numEntries, contentData, pageData, groupSettings) {
    return function(pageDataIsLoaded) {
        if (pageDataIsLoaded && !contentData.entries) {
            // Since this function is called by Ractive when pageData.summaryLoaded changes and it can potentially
            // *trigger* a Ractive update (if content data is ready to be served, we modify contentData.entries),
            // we need to wrap in a timeout so that the first Ractive update can complete before we trigger another.
            // Otherwise, Ractive bails out because it thinks we're triggering an infinite update loop.
            setTimeout(function() {
                ContentRecLoader.getRecommendedContent(numEntries, pageData, groupSettings, function (fetchedContentEntries) {
                    contentData.entries = fetchedContentEntries;
                    Events.postContentRecLoaded(pageData, groupSettings);
                });
            }, 0);
        }
        return pageDataIsLoaded;
    }
}

function renderText(node) {
    var text = cropIfNeeded(node);
    if (text.length !== node.innerHTML.length) {
        text += '...';
    }
    text = applyBolding(text);
    if (text.length !== node.innerHTML.length) {
        node.innerHTML = text;
        // Check again, just to make sure the text fits after bolding.
        text = cropIfNeeded(node);
        if (text.length !== node.innerHTML.length) { //
            node.innerHTML = text + '...';
        }
    }

    return { teardown: function() {} };

    function cropIfNeeded(node) {
        var text = node.innerHTML;
        var ratio = node.clientHeight / node.scrollHeight;
        if (ratio < 1) { // If the text is larger than the client area, crop the text.
            var cropWordBreak = text.lastIndexOf(' ', text.length * ratio - 3); // account for the '...' that we'll add
            text = text.substring(0, cropWordBreak);
        }
        return text;
    }

    function applyBolding(text) {
        var boldStartPoint = Math.floor(text.length * .25);
        var boldEndPoint = Math.floor(text.length *.66);
        var matches = text.substring(boldStartPoint, boldEndPoint).match(/,|\.|\?|"/gi);
        if (matches) {
            var boldPoint = text.lastIndexOf(matches[matches.length - 1], boldEndPoint);
            text = '<strong>' + text.substring(0, boldPoint) + '</strong>' + text.substring(boldPoint);
        }
        return text;
    }
}

function pickColors(count, groupSettings) {
    var colorPallete = [ // TODO: get this from groupsettings
        { background: '#41e7d0', foreground: '#FFFFFF' },
        { background: '#86bbfd', foreground: '#FFFFFF' },
        { background: '#FF6666', foreground: '#FFFFFF' }
        // { background: '#979797', foreground: '#FFFFFF' }
    ];
    var colors = shuffleArray(colorPallete); // shuffleArray(groupSettings.whatever())
    if (count < colors.length) {
        return colors.slice(0, count);
    } else { // If we're asking for more colors than we have, just repeat the same colors as necessary.
        var output = [];
        for (var i = 0; i < count; i++) {
            output.push(colors[i%colors.length]);
        }
    }
}

// Durstenfeld shuffle algorithm from: http://stackoverflow.com/a/12646864/4135431
function shuffleArray(array) {
    var copy = array.slice(0);
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = copy[i];
        copy[i] = copy[j];
        copy[j] = temp;
    }
    return copy;
}

module.exports = {
    createContentRec: createContentRec
};
},{"../templates/content-rec-widget.hbs.html":78,"./content-rec-loader":11,"./events":15,"./svgs":34,"./utils/messages":48,"./utils/ractive-provider":53,"./utils/throttled-events":58}],13:[function(require,module,exports){
var AppMode = require('./utils/app-mode');
var URLs = require('./utils/urls');

function loadCss() {
    // To make sure none of our content renders on the page before our CSS is loaded, we append a simple inline style
    // element that turns off our elements *before* our CSS links. This exploits the cascade rules - our CSS files appear
    // after the inline style in the document, so they take precedence (and make everything appear) once they're loaded.
    injectCss('.antenna{display:none;}');
    var cssHref = URLs.amazonS3Url() + '/widget-new/antenna.css?v=1';
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
},{"./utils/app-mode":39,"./utils/urls":63}],14:[function(require,module,exports){
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
},{"../templates/defaults-page.hbs.html":79,"./events":15,"./page-data":24,"./utils/ajax-client":38,"./utils/jquery-provider":43,"./utils/ractive-provider":53,"./utils/reactions-widget-layout-utils":56}],15:[function(require,module,exports){
var AjaxClient = require('./utils/ajax-client');
var BrowserMetrics = require('./utils/browser-metrics');
var JSONUtils = require('./utils/json-utils');
var Segment = require('./utils/segment');
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
    // TODO: recording of single/multi is disabled so we can instead record A/B/C segment data
    // event[attributes.contentAttributes] = pageData.metrics.isMultiPage ? eventValues.multiplePages : eventValues.singlePage;
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

function postLegacyRecircClicked(pageData, reactionId, groupSettings) {
    var event = createEvent(eventTypes.recircClicked, reactionId, groupSettings);
    appendPageDataParams(event, pageData);
    postEvent(event);
}

function postContentRecLoaded(pageData, groupSettings) {
    var event = createEvent(eventTypes.contentRecLoaded, '', groupSettings);
    appendPageDataParams(event, pageData);
    postEvent(event);
}

function postContentRecVisible(pageData, groupSettings) {
    var event = createEvent(eventTypes.contentRecVisible, '', groupSettings);
    appendPageDataParams(event, pageData);
    postEvent(event);
}

function postContentRecClicked(pageData, targetUrl, contentId, groupSettings) {
    var event = createEvent(eventTypes.contentRecClicked, targetUrl, groupSettings);
    event[attributes.contentId] = contentId;
    appendPageDataParams(event, pageData);
    postEvent(event, true);
}

function postReadMoreLoaded(pageData, groupSettings) {
    var event = createEvent(eventTypes.readMoreLoaded, '', groupSettings);
    appendPageDataParams(event, pageData);
    postEvent(event);
}

function postReadMoreVisible(pageData, groupSettings) {
    var event = createEvent(eventTypes.readMoreVisible, '', groupSettings);
    appendPageDataParams(event, pageData);
    postEvent(event);
}

function postReadMoreClicked(pageData, groupSettings) {
    var event = createEvent(eventTypes.readMoreClicked, '', groupSettings);
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
    var segment = Segment.getSegment(groupSettings);
    if (segment) {
        event[attributes.contentAttributes] = segment;
    }
    return event;
}

function postEvent(event, sendAsTrackingEvent) {
    User.cachedUser(function(userInfo) { // We don't want to create users just for events (e.g. every script load), but add user info if we have it already.
        if (userInfo) {
            event[attributes.userId] = userInfo.user_id;
        }
        fillInMissingProperties(event);
        // Send the event to BigQuery
        if (sendAsTrackingEvent) {
            AjaxClient.postTrackingEvent(event);
        } else {
            AjaxClient.postEvent(event);
        }
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
            session = null; // expire the session
        }
    }
    if (!session) {
        session = { guid: createGuid() };
    }
    // Always set a new expires time, so that we keep extending the time as long as the user is active
    var minutes = 15;
    session.expires = Date.now() + minutes * 60000;
    try {
        localStorage.setItem('ant_sts', JSONUtils.stringify(session));
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
    recircClicked: 'rc',
    contentRecLoaded: 'crl',
    contentRecVisible: 'crv',
    contentRecClicked: 'crc',
    readMoreLoaded: 'rml',
    readMoreVisible: 'rmv',
    readMoreClicked: 'rmc'
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
    postLegacyRecircClicked: postLegacyRecircClicked,
    postContentRecLoaded: postContentRecLoaded,
    postContentRecVisible: postContentRecVisible,
    postContentRecClicked: postContentRecClicked,
    postReadMoreLoaded: postReadMoreLoaded,
    postReadMoreVisible: postReadMoreVisible,
    postReadMoreClicked: postReadMoreClicked
};
},{"./utils/ajax-client":38,"./utils/browser-metrics":40,"./utils/json-utils":44,"./utils/segment":57,"./utils/user":64}],16:[function(require,module,exports){
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
},{"../templates/generic-error-page.hbs.html":80,"./svgs":34,"./utils/ractive-provider":53}],17:[function(require,module,exports){
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
},{"./group-settings":18,"./utils/ajax-client":38,"./utils/jquery-provider":43,"./utils/urls":63}],18:[function(require,module,exports){
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
        pageUrlSelector: data('post_href_selector'),
        pageUrlAttribute: data('post_href_attribute', 'href'),
        pageTitleSelector: data('post_title_selector'),
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
        twitterAccount: data('twitter'),
        isShowContentRec: data('show_recirc'),
        contentRecSelector: data('recirc_selector'),
        contentRecTitle: data('recirc_title'),
        contentRecMethod: data('recirc_jquery_method')
    }
}

//noinspection JSUnresolvedVariable
module.exports = {
    create: updateFromJSON,
    get: getGroupSettings
};
},{"./events":15,"./utils/jquery-provider":43}],19:[function(require,module,exports){
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
},{}],20:[function(require,module,exports){
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
},{"../templates/locations-page.hbs.html":81,"./events":15,"./hashed-elements":19,"./page-data":24,"./svgs":34,"./utils/jquery-provider":43,"./utils/ractive-provider":53,"./utils/range":54}],21:[function(require,module,exports){
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
},{"../templates/login-page.hbs.html":82,"./svgs":34,"./utils/ractive-provider":53,"./utils/urls":63,"./utils/xdm-client":67}],22:[function(require,module,exports){
var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var Ractive; require('./utils/ractive-provider').onLoad(function(loadedRactive) { Ractive = loadedRactive;});
var ReactionsWidget = require('./reactions-widget');
var SVGs = require('./svgs');

var AppMode = require('./utils/app-mode');
var BrowserMetrics = require('./utils/browser-metrics');
var MutationObserver = require('./utils/mutation-observer');
var ThrottledEvents = require('./utils/throttled-events');
var TouchSupport = require('./utils/touch-support');
var Visibility = require('./utils/visibility');

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
            supportsTouch: BrowserMetrics.supportsTouch(),
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
        openReactionsWindow(reactionWidgetOptions, ractive);
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
    MutationObserver.addRemovalListener(elementsRemoved);

    function elementsRemoved($elements) {
        // Special case: If we see that our own readmore elements are removed,
        // always update our indicators because their visibility might have changed.
        for (var i = 0; i < $elements.length; i++) {
            var $element = $elements[i];
            if ($element.hasClass('antenna-readmore')|| $element.hasClass('antenna-content-rec-readmore')) {
                positionIndicator();
                return;
            }
        }
        elementsAddedOrRemoved($elements);
    }

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
        updateDisplayForVisibility(); // Update visibility whenever we position the element.
        // Position the wrapper element (which has a hardcoded width) in the appropriate corner. Then flip the left/right
        // positioning of the nested widget element to adjust the way it will expand when the media is hovered.
        var corner = groupSettings.mediaIndicatorCorner();
        var elementOffset = $containerElement.offset();
        var coords = {};
        if (corner.indexOf('top') !== -1) {
            coords.top = elementOffset.top;
        } else {
            var borderTop = parseInt($containerElement.css('border-top')) || 0;
            coords.top = elementOffset.top + $containerElement.height() + borderTop - $rootElement.outerHeight();
        }
        if (corner.indexOf('right') !== -1) {
            coords.left = elementOffset.left + $containerElement.width() - $wrapperElement.outerWidth();
            $rootElement.css({right:0,left:''});
        } else {
            var borderLeft = parseInt($containerElement.css('border-left')) || 0;
            coords.left = elementOffset.left + borderLeft;
            $rootElement.css({right:'',left:0});
        }
        $wrapperElement.css(coords);
    }

    function updateDisplayForVisibility() {
        // Hide/show the indicator based on whether the container element is visible.
        // Examples of where we need there are carousels and our own readmore widget.
        $rootElement.css({display: Visibility.isVisible($containerElement.get(0)) ? '': 'none'});
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
},{"../templates/media-indicator-widget.hbs.html":83,"./reactions-widget":29,"./svgs":34,"./utils/app-mode":39,"./utils/browser-metrics":40,"./utils/jquery-provider":43,"./utils/mutation-observer":50,"./utils/ractive-provider":53,"./utils/throttled-events":58,"./utils/touch-support":59,"./utils/visibility":65}],23:[function(require,module,exports){
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

    if (pagesToLoad.length > 0) {
        var pageDataParam = computePagesParam(pagesToLoad, groupSettings);
        loadPageData(pageDataParam, groupSettings);
    }
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
},{"./page-data":24,"./utils/ajax-client":38,"./utils/jquery-provider":43,"./utils/page-utils":51,"./utils/throttled-events":58,"./utils/urls":63}],24:[function(require,module,exports){
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
    var existsInSummary = false;
    var existingSummaryReactions = pageData.summaryReactions;
    for (var j = 0; j < existingSummaryReactions.length; j++) {
        if (existingSummaryReactions[j].id === reaction.id) {
            // If this reaction already exists in the summary, increment the count.
            existingSummaryReactions[j].count += 1;
            existsInSummary = true;
            break;
        }
    }
    if (!existsInSummary) {
        var summaryReaction = {
            text: reaction.text,
            id: reaction.id,
            count: reaction.count
        };
        pageData.summaryReactions.push(summaryReaction);
    }
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
},{"./events":15,"./hashed-elements":19,"./utils/jquery-provider":43}],25:[function(require,module,exports){
var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var AppMode = require('./utils/app-mode');
var BrowserMetrics = require('./utils/browser-metrics');
var Hash = require('./utils/hash');
var MutationObserver = require('./utils/mutation-observer');
var PageUtils = require('./utils/page-utils');
var Segment = require('./utils/segment');
var URLs = require('./utils/urls');
var WidgetBucket = require('./utils/widget-bucket');

var AutoCallToAction = require('./auto-call-to-action');
var CallToActionIndicator = require('./call-to-action-indicator');
var ContentRec = require('./content-rec-widget');
var HashedElements = require('./hashed-elements');
var MediaIndicatorWidget = require('./media-indicator-widget');
var PageData = require('./page-data');
var PageDataLoader = require('./page-data-loader');
var ReadMoreEvents = require('./readmore-events');
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
    scanForReadMore($page, pageData, groupSettings);
    scanForContentRec($page, pageData, groupSettings);
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

function scanForReadMore($element, pageData, groupSettings) {
    ReadMoreEvents.setupReadMoreEvents($element.get(0), pageData, groupSettings);
}

function scanForContentRec($element, pageData, groupSettings) {
    if (groupSettings.isShowContentRec() && BrowserMetrics.isMobile() && Segment.isInContentRecSegment(groupSettings)) {
        var $contentRecLocations = find($element, groupSettings.contentRecSelector(), true, true);
        for (var i = 0; i < $contentRecLocations.length; i++) {
            var contentRecLocation = $contentRecLocations[i];
            var contentRec = ContentRec.createContentRec(pageData, groupSettings);
            var contentRecElement = contentRec.element;
            var method = groupSettings.contentRecMethod();
            switch (method) {
                case 'append':
                    contentRecLocation.appendChild(contentRecElement);
                    break;
                case 'prepend':
                    contentRecLocation.insertBefore(contentRecElement, contentRecLocation.firstChild);
                    break;
                case 'before':
                    contentRecLocation.parentNode.insertBefore(contentRecElement, contentRecLocation);
                    break;
                case 'after':
                default:
                    contentRecLocation.parentNode.insertBefore(contentRecElement, contentRecLocation.nextSibling);
            }
            createdWidgets.push(contentRec);
        }
    }
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

    // We use this to handle the case of text content that ends with some non-text node as in
    // <p>My text. <img src="whatever"></p> or
    // <p>My long paragraph text with a common CMS problem.<br></p>
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
                    case 'br':
                        lastNode = child;
                }
            }
            lastNode = lastContentNode(child) || lastNode;
        }
        return lastNode;
    }
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
    var couldBeSinglePageApp = true;
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
                    // If an entire page is added, assume that this is an "infinite scroll" site and stop checking for
                    // single page apps. This is necessary because some infinite scroll sites update the location, which
                    // can trigger an unnecessary reinitialization.
                    couldBeSinglePageApp = false;
                } else {
                    // If not an entire page/pages, see if content was added to an existing page
                    var $page = $element.closest(groupSettings.pageSelector());
                    if ($page.length === 0) {
                        $page = $('body');
                    }
                    if (couldBeSinglePageApp) {
                        var $pageIndicator = find($page, groupSettings.pageUrlSelector());
                        if ($pageIndicator.length === 0) {
                            // Whenever new content is added, check if we need to reinitialize all our data based on the
                            // window.location. This accomodates single page apps that don't use browser navigation.
                            // (As an optimization, we don't do this check if the added element contains an entire page
                            // with a URL specified inside the content.)
                            if (shouldReinitializeForLocationChange()) {
                                reinitializeCallback(groupSettings);
                                return;
                            }
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
},{"./auto-call-to-action":2,"./call-to-action-indicator":6,"./content-rec-widget":12,"./hashed-elements":19,"./media-indicator-widget":22,"./page-data":24,"./page-data-loader":23,"./readmore-events":30,"./summary-widget":33,"./text-indicator-widget":36,"./text-reactions":37,"./utils/app-mode":39,"./utils/browser-metrics":40,"./utils/hash":42,"./utils/jquery-provider":43,"./utils/mutation-observer":50,"./utils/page-utils":51,"./utils/segment":57,"./utils/urls":63,"./utils/widget-bucket":66}],26:[function(require,module,exports){
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
},{"../templates/pending-reaction-page.hbs.html":84,"./svgs":34,"./utils/ractive-provider":53}],27:[function(require,module,exports){
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

function isShowing() {
    if (!ractive) {
        return false;
    }
    var $element = getRootElement();
    return $element.hasClass('antenna-show');
}

function showPopup(coordinates, callback) {
    var $element = getRootElement();
    if (!$element.hasClass('antenna-show')) {
        clickHandler = callback;
        var bodyOffset = $('body').offset(); // account for any offset that sites apply to the entire body
        var tail = 6; // TODO find a cleaner way to account for the popup 'tail'
        $element
            .show() // still has opacity 0 at this point
            .css({
                top: coordinates.top - $element.outerHeight() - tail - bodyOffset.top,
                left: coordinates.left - bodyOffset.left - Math.floor($element.outerWidth() / 2)
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
        if (!$element.hasClass('antenna-show')) { // By the time the transition finishes, the widget could be showing again.
            $element.hide(); // after we're at opacity 0, hide the element so it doesn't receive accidental clicks
        }
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
    isShowing: isShowing,
    show: showPopup,
    teardown: teardown
};
},{"../templates/popup-widget.hbs.html":85,"./svgs":34,"./utils/jquery-provider":43,"./utils/ractive-provider":53,"./utils/transition-util":60,"./utils/widget-bucket":66}],28:[function(require,module,exports){
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
},{"../templates/reactions-page.hbs.html":86,"./events":15,"./svgs":34,"./utils/ajax-client":38,"./utils/jquery-provider":43,"./utils/ractive-provider":53,"./utils/range":54,"./utils/reactions-widget-layout-utils":56}],29:[function(require,module,exports){
var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var AjaxClient = require('./utils/ajax-client');
var BrowserMetrics = require('./utils/browser-metrics');
var JSONUtils = require('./utils/json-utils');
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
    var contentData = JSON.parse(JSONUtils.stringify(options.contentData));
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
            var bodyOffset = $('body').offset(); // account for any offset that sites apply to the entire body
            coords = {
                top: offset.top - bodyOffset.top,
                left: offset.left - bodyOffset.left
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
},{"../templates/reactions-widget.hbs.html":87,"./blocked-reaction-page":3,"./comments-page":9,"./confirmation-page":10,"./defaults-page":14,"./events":15,"./generic-error-page":16,"./locations-page":20,"./login-page":21,"./page-data":24,"./pending-reaction-page":26,"./reactions-page":28,"./svgs":34,"./utils/ajax-client":38,"./utils/browser-metrics":40,"./utils/jquery-provider":43,"./utils/json-utils":44,"./utils/messages":48,"./utils/moveable":49,"./utils/ractive-provider":53,"./utils/range":54,"./utils/touch-support":59,"./utils/transition-util":60,"./utils/user":64,"./utils/widget-bucket":66}],30:[function(require,module,exports){
// This module sets up listeners on the readmore widget in order to record events using all the data available to
// the reaction widget.

var ThrottledEvents = require('./utils/throttled-events');
var Events = require('./events');

function setupReadMoreEvents(element, pageData, groupSettings) {
    var readMoreElement = element.querySelector('.antenna-readmore');
    if (readMoreElement) {
        var readMoreAction = readMoreElement.querySelector('.antenna-readmore-action');
        if (readMoreAction) {
            Events.postReadMoreLoaded(pageData, groupSettings);
            setupVisibilityListener();
            // TODO: Both the readmore widget and this code should be moved to using touch events
            readMoreAction.addEventListener('click', fireClicked);
        }
    }
    var visibilityFired = false;

    function setupVisibilityListener() {
        if (isVisible()) {
            fireVisible();
        } else {
            ThrottledEvents.on('scroll', handleScrollEvent);
        }
    }

    function handleScrollEvent() {
        if (isVisible()) {
            fireVisible();
        }
    }

    function isVisible() {
        var contentBox = readMoreElement.getBoundingClientRect();
        var viewportBottom = document.documentElement.clientHeight;
        return contentBox.top > 0 && contentBox.top < viewportBottom &&
                contentBox.bottom > 0 && contentBox.bottom < viewportBottom;
    }

    function fireClicked() {
        if (!visibilityFired) { // Data integrity - make sure we always fire a visibility event before firing a click.
            fireVisible();
        }
        Events.postReadMoreClicked(pageData, groupSettings);
    }

    function fireVisible() {
        Events.postReadMoreVisible(pageData, groupSettings);
        ThrottledEvents.off('scroll', handleScrollEvent);
        visibilityFired = true;
    }
}

module.exports = {
    setupReadMoreEvents: setupReadMoreEvents
};
},{"./events":15,"./utils/throttled-events":58}],31:[function(require,module,exports){
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
},{"./group-settings":18,"./hashed-elements":19,"./page-data":24,"./page-data-loader":23,"./page-scanner":25,"./popup-widget":27,"./reactions-widget":29,"./utils/mutation-observer":50}],32:[function(require,module,exports){
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
},{"./utils/app-mode":39,"./utils/jquery-provider":43,"./utils/ractive-provider":53,"./utils/rangy-provider":55,"./utils/urls":63}],33:[function(require,module,exports){
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
},{"../templates/summary-widget.hbs.html":88,"./reactions-widget":29,"./svgs":34,"./utils/browser-metrics":40,"./utils/jquery-provider":43,"./utils/ractive-provider":53,"./utils/touch-support":59}],34:[function(require,module,exports){
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
},{"../templates/svg-comments.hbs.html":89,"../templates/svg-facebook.hbs.html":90,"../templates/svg-film.hbs.html":91,"../templates/svg-left.hbs.html":92,"../templates/svg-location.hbs.html":93,"../templates/svg-logo-selectable.hbs.html":94,"../templates/svg-logo.hbs.html":95,"../templates/svg-twitter.hbs.html":96,"../templates/svgs.hbs.html":97,"./utils/ractive-provider":53}],35:[function(require,module,exports){
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
},{"../templates/tap-helper.hbs.html":98,"./svgs":34,"./utils/browser-metrics":40,"./utils/ractive-provider":53,"./utils/widget-bucket":66}],36:[function(require,module,exports){
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
},{"../templates/text-indicator-widget.hbs.html":99,"./popup-widget":27,"./reactions-widget":29,"./svgs":34,"./utils/jquery-provider":43,"./utils/ractive-provider":53,"./utils/range":54,"./utils/touch-support":59}],37:[function(require,module,exports){
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
        // Note that we have to do a preemptive check if the popup is showing because of a timing difference in Safari.
        // We were seeing the document click handler closing the popup while the selection was being computed, which
        // meant that calling PopupWidget.show would think it needed to reopen the popup (instead of quietly doing nothing as it should).
        if (containerData.loaded && !PopupWidget.isShowing()) {
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
        if (!ReactionsWidget.isOpen() && $(event.target).closest('a,.no-ant').length === 0) {
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
},{"./popup-widget":27,"./reactions-widget":29,"./utils/jquery-provider":43,"./utils/range":54,"./utils/touch-support":59}],38:[function(require,module,exports){
var AppMode = require('./app-mode');
var JSONUtils = require('./json-utils');
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
        console.log('ANTENNA Posting event: ' + JSONUtils.stringify(event));
    }
    doGetJSONP(baseUrl, URLs.eventUrl(), event, function() { /*success*/ }, function(error) {
        // TODO: error handling
        console.log('An error occurred posting event: ', error);
    });
}

function postTrackingEvent(event) {
    var baseUrl = URLs.eventsServerUrl();
    if (AppMode.debug) {
        console.log('ANTENNA Posting event: ' + JSONUtils.stringify(event));
    }
    var trackingUrl = baseUrl + URLs.eventUrl() + '/event.gif';
    if (event) {
        trackingUrl += '?json=' + encodeURI(JSONUtils.stringify(event));
    }
    var imageTag = document.createElement('img');
    imageTag.setAttribute('height', 1);
    imageTag.setAttribute('width', 1);
    imageTag.setAttribute('src', trackingUrl);
    document.getElementsByTagName('body')[0].appendChild(imageTag);
}

// Issues a JSONP request to a given server. To send a request to the application server, use getJSONP instead.
function doGetJSONP(baseUrl, url, params, success, error) {
    var scriptTag = document.createElement('script');
    var responseCallback = 'antenna' + Math.random().toString(16).slice(2);
    window[responseCallback] = function(response) {
        try {
            // TODO: Revisit whether it's really cool to key this on the textStatus or if we should be looking at
            //       the status code in the XHR
            // Note: The server comes back with 200 responses with a nested status of "fail"...
            if (response.status !== 'fail' && (!response.data || response.data.status !== 'fail')) {
                success(response.data);
            } else {
                if (error) { error(response.message || response.data.message); }
            }
        } finally {
            delete window[responseCallback];
            scriptTag.parentNode.removeChild(scriptTag);
        }
    };
    var jsonpUrl = baseUrl + url + '?callback=' + responseCallback;
    if (params) {
        jsonpUrl += '&json=' + encodeURIComponent(JSONUtils.stringify(params));
    }
    scriptTag.setAttribute('type', 'application/javascript');
    scriptTag.setAttribute('src', jsonpUrl);
    (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(scriptTag);
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
    postEvent: postEvent,
    postTrackingEvent: postTrackingEvent
};
},{"./app-mode":39,"./json-utils":44,"./urls":63,"./user":64}],39:[function(require,module,exports){
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
},{"./url-constants":61}],40:[function(require,module,exports){

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
            ((window.matchMedia("screen and (max-device-width: 480px) and (orientation: portrait)")).matches ||
            (window.matchMedia("screen and (max-device-width: 768px) and (orientation: landscape)")).matches);
    }
    return isMobileDevice;
}

module.exports = {
    supportsTouch: supportsTouch,
    isMobile: isMobile
};
},{}],41:[function(require,module,exports){

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
},{}],42:[function(require,module,exports){
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
},{"./jquery-provider":43,"./md5":45}],43:[function(require,module,exports){

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
},{}],44:[function(require,module,exports){

// There are libraries in the wild that modify Array.prototype with a toJSON function that breaks JSON.stringify.
// Workaround this problem by temporarily removing the function when we stringify our objects.
function stringify(jsonObject) {
    var toJSON = Array.prototype.toJSON;
    delete Array.prototype.toJSON;
    var string = JSON.stringify(jsonObject);
    if (toJSON) {
        Array.prototype.toJSON = toJSON;
    }
    return string;
}

module.exports = {
    stringify: stringify
};
},{}],45:[function(require,module,exports){
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
},{}],46:[function(require,module,exports){
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
    'tap_helper__close': 'Close',

    'content_rec_widget__title': 'Reader Reactions'
};
},{}],47:[function(require,module,exports){
//noinspection JSUnresolvedVariable
module.exports = {
    'summary_widget__reactions': 'Reacciones',
    'summary_widget__reactions_one': '1 Reacción',
    'summary_widget__reactions_many': '{0} Reacciones',

    'reactions_widget__title': 'Reacciones',
    'reactions_widget__title_think': '¿Qué piensas?',
    'reactions_widget__title_thanks': '¡Gracias por tu reacción!',
    'reactions_widget__title_signin': 'Es necesario iniciar sesión', // TODO: check translation
    'reactions_widget__title_blocked': 'Reacción bloqueado', // TODO: check translation
    'reactions_widget__title_error': 'Error', // TODO: check translation
    'reactions_widget__back': 'Volver',
    'reactions_page__no_reactions': '¡No reacciones ya!', // TODO: check translation 
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

    'blocked_page__message1': 'Este sitio web ha bloqueado esa reacción.', // TODO: check translation
    'blocked_page__message2': 'Por favor, intente algo que será más apropiado para esta comunidad.', // TODO: check translation
    'pending_page__message_appear': 'Aparecerá su reacción una vez que se revisa. Todas las nuevas reacciones deben cumplir con normas de la comunidad.', // TODO: check translation
    'error_page__message': '¡Lo siento! Valoramos sus comentarios, pero algo salió mal.', // TODO: check translation
    'tap_helper__prompt': '¡Toca un párrafo para opinar!',
    'tap_helper__close': 'Volver',
    'content_rec_widget__title': 'Reacciones de la gente' // TODO: check translation
};
},{}],48:[function(require,module,exports){
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
},{"../group-settings":18,"./messages-en":46,"./messages-es":47}],49:[function(require,module,exports){
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
},{"./jquery-provider":43}],50:[function(require,module,exports){
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
},{"./callback-support":41,"./jquery-provider":43,"./range":54,"./widget-bucket":66}],51:[function(require,module,exports){
var $; require('./jquery-provider').onLoad(function(jQuery) { $=jQuery; });

function computePageTitle($page, groupSettings) {
    var titleSelector = groupSettings.pageTitleSelector();
    if (!titleSelector) {
        // Backwards compatibility for sites which deployed before we had a separate title selector.
        titleSelector = groupSettings.pageUrlSelector();
    }
    var pageTitle = $page.find(titleSelector).text().trim();
    if (pageTitle === '') {
        // If we couldn't find a title based on the group settings, fallback to some hard-coded behavior.
        pageTitle = getAttributeValue('meta[property="og:title"]', 'content') || $('title').text().trim();
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
    if ($canonicalLink.length > 0 && $canonicalLink.attr('href')) {
        var overrideUrl = $canonicalLink.attr('href').trim().toLowerCase();
        var domain = (window.location.protocol+'//'+window.location.hostname+'/').toLowerCase();
        if (overrideUrl !== domain) { // fastco fix (since they sometimes rewrite their canonical to simply be their domain.)
            canonicalUrl = overrideUrl;
        }
    }
    return removeSubdomainFromPageUrl(canonicalUrl, groupSettings);
}

function computePageElementUrl($pageElement, groupSettings) {
    var pageUrlSelector = groupSettings.pageUrlSelector();
    var $pageUrlElement = $pageElement.find(pageUrlSelector);
    if (pageUrlSelector) { // with an undefined selector, addBack will match and always return the input element (unlike find() which returns an empty match)
        $pageUrlElement = $pageUrlElement.addBack(pageUrlSelector);
    }
    var url = $pageUrlElement.attr(groupSettings.pageUrlAttribute());
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
},{"./jquery-provider":43}],52:[function(require,module,exports){
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
},{}],53:[function(require,module,exports){
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
    node.classList.add(clazz);
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
},{"./messages":48,"./ractive-events-tap":52}],54:[function(require,module,exports){
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
    if (location === ':0,:1') {
        grabNode(node);
        return;
    }
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
},{"./jquery-provider":43,"./rangy-provider":55}],55:[function(require,module,exports){

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
},{}],56:[function(require,module,exports){
var $; require('./jquery-provider').onLoad(function(jQuery) { $=jQuery; });

var CLASS_FULL = 'antenna-full';
var CLASS_HALF = 'antenna-half';
var CLASS_HALF_STRETCH = CLASS_HALF + ' antenna-stretch';

function computeLayoutData(reactionsData) {
    var numReactions = reactionsData.length;
    if (numReactions == 0) {
        return {}; // TODO clean this up
    }
    // TODO: Copied code from engage_full.createTagBuckets
    var median = reactionsData[ Math.floor(reactionsData.length/2) ].count;
    var total = 0;
    for (var i = 0; i < numReactions; i++) {
        total += reactionsData[i].count;
    }
    var average = Math.floor(total / numReactions);
    var midValue = ( median > average ) ? median : average;

    var layoutClasses = [];
    var numHalfsies = 0;
    var numFull = 0;
    for (var j = 0; j < numReactions; j++) {
        if (reactionsData[j].count > midValue) {
            layoutClasses[j] = CLASS_FULL;
            numFull++;
        } else {
            layoutClasses[j] = CLASS_HALF;
            numHalfsies++;
        }
    }
    if (numHalfsies % 2 !== 0) {
        // If there are an odd number of half-sized boxes, make one of them full.
        if (numFull === 0) {
            // If there are no other full-size boxes, make the first one full-size.
            layoutClasses[0] = CLASS_FULL;
        } else {
            // Otherwise, simply stretch the last box to fill the available width (this keeps the smaller font size).
            layoutClasses[numReactions - 1] = CLASS_HALF_STRETCH;
        }
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
            if (splitIndex < 1) {
                // If there's no space in the text, just split the text. Split on the overflow ratio if the top line will
                // have more characters than the bottom (so it looks like the text naturally wraps) or otherwise in the middle.
                splitIndex = horizontalRatio > 0.5 ? Math.ceil(text.length * horizontalRatio) : Math.ceil(text.length / 2);
            }
            // Split the text and then see how it fits.
            node.innerHTML = text.slice(0, splitIndex) + '<br>' + text.slice(splitIndex);
            var wrappedHorizontalRatio = node.clientWidth / node.scrollWidth;
            if (wrappedHorizontalRatio < 1) {
                $element.css('font-size', Math.max(10, Math.floor(parseInt($element.css('font-size')) * wrappedHorizontalRatio)));
            }
            // Shrink the containing box padding if necessary to fit the 'count'
            var count = node.parentNode.querySelector('.antenna-reaction-count');
            if (count) {
                var approxHeight = parseInt($element.css('font-size')) * 2; // At this point the browser won't give us a real height, so we need to estimate ourselves
                var clientArea = computeAvailableClientArea(node.parentNode);
                var remainingSpace = clientArea - approxHeight;
                var countHeight = computeNeededHeight(count);
                if (remainingSpace < countHeight) {
                    var $parent = $(node.parentNode);
                    $parent.css('padding-top', parseInt($parent.css('padding-top')) - ((countHeight-remainingSpace)/2) );
                }
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

function computeNeededHeight(node) {
    var nodeStyle = window.getComputedStyle(node);
    return parseInt(nodeStyle.height) + parseInt(nodeStyle.marginTop) + parseInt(nodeStyle.marginBottom);
}

module.exports = {
    sizeToFit: sizeReactionTextToFit,
    computeLayoutData: computeLayoutData
};
},{"./jquery-provider":43}],57:[function(require,module,exports){
var UrlParams = require('./url-params');

var segment;

function getSegment(groupSettings) {
    if (!segment) {
        segment = computeSegment(groupSettings);
    }
    return segment;
}

function computeSegment(groupSettings) {
    var segmentOverride = UrlParams.getUrlParams()['antennaSegment'];
    if (segmentOverride) {
        storeSegment(segmentOverride);
        return segmentOverride;
    }
    var segment = localStorage.getItem('ant_segment');
    if (!segment && (groupSettings.groupId() === 3714 || groupSettings.groupId() === 2)) {
        segment = createSegment(groupSettings);
        storeSegment(segment);
    }
    return segment;
}

function createSegment(groupSettings) {
    // TODO: let group settings control the segments
    var segments = [ 'ao', 'rm', 'rm_cr' ];
    return segments[Math.floor(Math.random() * 3)];
}

function storeSegment(segment) {
    try {
        localStorage.setItem('ant_segment', segment);
    } catch(error) {
        // Some browsers (mobile Safari) throw an exception when in private browsing mode.
        // Nothing we can do about it. Just fall through and return the value we generated.
    }
}

function isInContentRecSegment(groupSettings) {
    var segment = getSegment(groupSettings);
    return segment === 'rm_cr';
}


module.exports = {
    getSegment: getSegment,
    isInContentRecSegment: isInContentRecSegment
};
},{"./url-params":62}],58:[function(require,module,exports){
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
},{"./callback-support":41}],59:[function(require,module,exports){

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
},{}],60:[function(require,module,exports){


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
},{}],61:[function(require,module,exports){
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
},{}],62:[function(require,module,exports){

var urlParams;

function getUrlParams() {
    if (!urlParams) {
        urlParams = parseUrlParams();
    }
    return urlParams;
}

function parseUrlParams() {
    var queryString = window.location.search;
    var urlParams = {};
    var e,
    a = /\+/g,  // Regex for replacing addition symbol with a space
    r = /([^&=]+)=?([^&]*)/g,
    d = function (s) { return decodeURIComponent(s.replace(a, " ")); },
    q = queryString.substring(1);

    while (e = r.exec(q)) {
        urlParams[d(e[1])] = d(e[2]);
    }
    return urlParams;
}

module.exports = {
    getUrlParams: getUrlParams
};
},{}],63:[function(require,module,exports){
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

function getFetchContentRecommendationUrl() {
    return '/api/contentrec';
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
    fetchContentRecommendationUrl: getFetchContentRecommendationUrl,
    shareReactionUrl: getShareReactionUrl,
    shareWindowUrl: getShareWindowUrl,
    loginPageUrl: getLoginPageUrl,
    computeImageUrl: computeImageUrl,
    computeMediaUrl: computeMediaUrl,
    eventUrl: getEventUrl
};

},{"./app-mode":39,"./url-constants":61}],64:[function(require,module,exports){
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
},{"./app-mode":39,"./xdm-client":67}],65:[function(require,module,exports){
/**
 * Author: Jason Farrell
 * Author URI: http://useallfive.com/
 *
 * Description: Checks if a DOM element is truly visible.
 * Package URL: https://github.com/UseAllFive/true-visibility
 */
function isVisible(element) {

    /**
     * Checks if a DOM element is visible. Takes into
     * consideration its parents and overflow.
     *
     * @param (el)      the DOM element to check if is visible
     *
     * These params are optional that are sent in recursively,
     * you typically won't use these:
     *
     * @param (t)       Top corner position number
     * @param (r)       Right corner position number
     * @param (b)       Bottom corner position number
     * @param (l)       Left corner position number
     * @param (w)       Element width number
     * @param (h)       Element height number
     */
    function _isVisible(el, t, r, b, l, w, h) {
        var p = el.parentNode,
                VISIBLE_PADDING = 2;

        if ( !_elementInDocument(el) ) {
            return false;
        }

        //-- Return true for document node
        if ( 9 === p.nodeType ) {
            return true;
        }

        //-- Return false if our element is invisible
        if (
             '0' === _getStyle(el, 'opacity') ||
             'none' === _getStyle(el, 'display') ||
             'hidden' === _getStyle(el, 'visibility')
        ) {
            return false;
        }

        if (
            'undefined' === typeof(t) ||
            'undefined' === typeof(r) ||
            'undefined' === typeof(b) ||
            'undefined' === typeof(l) ||
            'undefined' === typeof(w) ||
            'undefined' === typeof(h)
        ) {
            t = el.offsetTop;
            l = el.offsetLeft;
            b = t + el.offsetHeight;
            r = l + el.offsetWidth;
            w = el.offsetWidth;
            h = el.offsetHeight;
        }
        //-- If we have a parent, let's continue:
        if ( p ) {
            //-- Check if the parent can hide its children.
            if ( _overflowHidden(p) ) {
                //-- Only check if the offset is different for the parent
                if (
                    //-- If the target element is to the right of the parent elm
                    l + VISIBLE_PADDING > p.offsetWidth + p.scrollLeft ||
                    //-- If the target element is to the left of the parent elm
                    l + w - VISIBLE_PADDING < p.scrollLeft ||
                    //-- If the target element is under the parent elm
                    t + VISIBLE_PADDING > p.offsetHeight + p.scrollTop ||
                    //-- If the target element is above the parent elm
                    t + h - VISIBLE_PADDING < p.scrollTop
                ) {
                    //-- Our target element is out of bounds:
                    return false;
                }
            }
            //-- Add the offset parent's left/top coords to our element's offset:
            if ( el.offsetParent === p ) {
                l += p.offsetLeft;
                t += p.offsetTop;
            }
            //-- Let's recursively check upwards:
            return _isVisible(p, t, r, b, l, w, h);
        }
        return true;
    }

    //-- Cross browser method to get style properties:
    function _getStyle(el, property) {
        if ( window.getComputedStyle ) {
            return document.defaultView.getComputedStyle(el,null)[property];
        }
        if ( el.currentStyle ) {
            return el.currentStyle[property];
        }
    }

    function _elementInDocument(element) {
        while (element = element.parentNode) {
            if (element == document) {
                    return true;
            }
        }
        return false;
    }

    function _overflowHidden(el) {
        return 'hidden' === _getStyle(el, 'overflow') || 'hidden' === _getStyle(el, 'overflow-x') || 'hidden' === _getStyle(el, 'overflow-y') ||
                'scroll' === _getStyle(el, 'overflow') || 'scroll' === _getStyle(el, 'overflow-x') || 'scroll' === _getStyle(el, 'overflow-y')
    }

    return _isVisible(element);

}

module.exports = {
    isVisible: isVisible
};
},{}],66:[function(require,module,exports){
var id = 'antenna-widget-bucket';

function getWidgetBucket() {
    var bucket = document.getElementById(id);
    if (!bucket) {
        bucket = document.createElement('div');
        bucket.setAttribute('id', id);
        bucket.classList.add('antenna-reset','no-ant');
        document.body.appendChild(bucket);
    }
    return bucket;
}

//noinspection JSUnresolvedVariable
module.exports = {
    get: getWidgetBucket,
    selector: function() { return '#' + id; }
};
},{}],67:[function(require,module,exports){
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
},{"./callback-support":41,"./xdm-loader":68}],68:[function(require,module,exports){
var $; require('./jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var AppMode = require('./app-mode');
var URLConstants = require('./url-constants');
var WidgetBucket = require('./widget-bucket');

var XDM_ORIGIN = AppMode.offline ? URLConstants.DEVELOPMENT : URLConstants.PRODUCTION;

function createXDMframe(groupId) {
    var iframeUrl = XDM_ORIGIN + "/static/widget-new/xdm.html",
    parentUrl = encodeURI(window.location.href),
    parentHost = encodeURI(window.location.protocol + "//" + window.location.host),
    $xdmIframe = $('<iframe id="ant-xdm-hidden" name="ant-xdm-hidden" src="' + iframeUrl + '?parentUrl=' + parentUrl + '&parentHost=' + parentHost + '&group_id='+groupId+'" width="1" height="1" style="position:absolute;top:-1000px;left:-1000px;" />');
    $(WidgetBucket.get()).append( $xdmIframe );
}

module.exports = {
    createXDMframe: createXDMframe,
    ORIGIN: XDM_ORIGIN
};
},{"./app-mode":39,"./jquery-provider":43,"./url-constants":61,"./widget-bucket":66}],69:[function(require,module,exports){
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
        Events.postLegacyRecircClicked(pageData, reactionId, GroupSettings.get());
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
},{"./events":15,"./group-settings":18,"./page-data":24,"./utils/xdm-client":67}],70:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna antenna-auto-cta"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-auto-cta-inner","ant-cta-for":[{"t":2,"r":"antItemId"}]},"f":[{"t":8,"r":"logo"},{"t":7,"e":"span","a":{"class":"antenna-auto-cta-label","ant-reactions-label-for":[{"t":2,"r":"antItemId"}]}},{"t":4,"f":[{"t":7,"e":"span","a":{"ant-expanded-reactions-for":[{"t":2,"r":"antItemId"}]}}],"n":50,"r":"expandReactions"}]}]}]}
},{}],71:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna-page antenna-blocked-page"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-body"},"f":[{"t":7,"e":"div","v":{"tap":"back"},"a":{"class":"antenna-blocked-back"},"f":[{"t":8,"r":"left"},{"t":2,"x":{"r":["getMessage"],"s":"_0(\"reactions_widget__back\")"}}]}," ",{"t":7,"e":"div","a":{"class":"antenna-blocked-body"},"f":[{"t":7,"e":"div","a":{"class":"antenna-blocked-message"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"blocked_page__message1\")"}}]}," ",{"t":7,"e":"div","a":{"class":"antenna-blocked-message"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"blocked_page__message2\")"}}]}]}]}]}]}
},{}],72:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":4,"f":[{"t":2,"r":"containerData.reactionTotal"}],"n":50,"x":{"r":["containerData.reactionTotal","containerData.loaded"],"s":"_0&&_1"}}]}
},{}],73:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":4,"f":[{"t":7,"e":"span","a":{"class":["antenna-cta-expanded-reaction ",{"t":4,"f":["antenna-cta-expanded-first"],"n":50,"x":{"r":["@index"],"s":"_0===0"}}]},"f":[{"t":7,"e":"span","a":{"class":"antenna-cta-expanded-text"},"f":[{"t":2,"r":"./text"}]},{"t":7,"e":"span","a":{"class":"antenna-cta-expanded-count"},"f":[{"t":2,"r":"./count"}]}]}],"x":{"r":["computeExpandedReactions","containerData.reactions"],"s":"_0(_1)"}}]}
},{}],74:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":4,"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"call_to_action_label__responses\")"}}],"n":50,"x":{"r":["containerData.loaded","containerData.reactionTotal"],"s":"!_0||_1===undefined||_1===0"}},{"t":4,"n":51,"f":[{"t":4,"n":50,"x":{"r":["containerData.reactionTotal"],"s":"_0===1"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"call_to_action_label__responses_one\")"}}]},{"t":4,"n":50,"x":{"r":["containerData.reactionTotal"],"s":"!(_0===1)"},"f":[" ",{"t":2,"x":{"r":["getMessage","containerData.reactionTotal"],"s":"_0(\"call_to_action_label__responses_many\",[_1])"}}]}],"x":{"r":["containerData.loaded","containerData.reactionTotal"],"s":"!_0||_1===undefined||_1===0"}}]}
},{}],75:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna-comment-area"},"f":[{"t":7,"e":"div","a":{"class":"antenna-comment-widgets"},"f":[{"t":7,"e":"textarea","v":{"input":"inputchanged"},"a":{"class":"antenna-comment-input","placeholder":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"comment_area__placeholder\")"}}],"maxlength":"500"}}," ",{"t":7,"e":"div","a":{"class":"antenna-comment-footer"},"f":[{"t":7,"e":"span","a":{"class":"antenna-comment-limit"},"f":[{"t":3,"x":{"r":["getMessage"],"s":"_0(\"comment_area__count\")"}}]}," ",{"t":7,"e":"button","a":{"id":"antenna-comment-spacer"}}," ",{"t":7,"e":"button","a":{"class":"antenna-comment-submit"},"v":{"tap":"addcomment"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"comment_area__add\")"}}]}]}]}," ",{"t":7,"e":"div","a":{"class":"antenna-comment-waiting"},"f":["..."]}," ",{"t":7,"e":"div","a":{"class":"antenna-comment-received"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"comment_area__thanks\")"}}]}]}]}
},{}],76:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna-page antenna-comments-page"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-body"},"f":[{"t":7,"e":"div","v":{"tap":"back"},"a":{"class":"antenna-comments-back"},"f":[{"t":8,"r":"left"},{"t":2,"x":{"r":["getMessage"],"s":"_0(\"reactions_widget__back\")"}}]}," ",{"t":7,"e":"div","a":{"class":"antenna-comments-header"},"f":[{"t":2,"x":{"r":["getMessage","comments.length"],"s":"_0(\"comments_page__header\",[_1])"}}]}," ",{"t":4,"f":[{"t":7,"e":"div","a":{"class":["antenna-comment-entry ",{"t":4,"f":["antenna-comment-new"],"n":50,"r":"./new"}]},"f":[{"t":7,"e":"table","f":[{"t":7,"e":"tr","f":[{"t":7,"e":"td","a":{"class":"antenna-comment-cell"},"f":[{"t":7,"e":"img","a":{"src":[{"t":2,"r":"./user.imageURL"}]}}]}," ",{"t":7,"e":"td","a":{"class":"antenna-comment-author"},"f":[{"t":2,"r":"./user.name"}]}]}," ",{"t":7,"e":"tr","f":[{"t":7,"e":"td","f":[]}," ",{"t":7,"e":"td","a":{"class":"antenna-comment-text"},"f":[{"t":2,"r":"./text"}]}]}]}]}],"i":"index","r":"comments"}," ",{"t":8,"r":"commentArea"}]}]}]}
},{}],77:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna-page antenna-confirmation-page"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-body"},"f":[{"t":7,"e":"div","a":{"class":"antenna-confirm-reaction"},"f":[{"t":2,"r":"text"}]}," ",{"t":8,"r":"commentArea"}]}," ",{"t":7,"e":"div","a":{"class":"antenna-footer antenna-confirm-footer"},"f":[{"t":7,"e":"span","a":{"class":"antenna-share"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"confirmation_page__share\")"}}," ",{"t":7,"e":"a","v":{"tap":"share-facebook"},"a":{"href":"//facebook.com"},"f":[{"t":8,"r":"facebookIcon"}]}," ",{"t":7,"e":"a","v":{"tap":"share-twitter"},"a":{"href":"//twitter.com"},"f":[{"t":8,"r":"twitterIcon"}]}]}]}]}]}
},{}],78:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":4,"f":[{"t":7,"e":"div","a":{"class":"antenna antenna-contentrec-inner"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-contentrec-header"},"f":[{"t":2,"r":"title"}]}," ",{"t":4,"f":[{"t":7,"e":"div","a":{"class":"antenna-contentrec-entry"},"v":{"tap":"navigate"},"f":[{"t":7,"e":"div","a":{"class":"antenna-contentrec-entry-header"},"f":[{"t":7,"e":"div","a":{"class":"antenna-contentrec-reaction-text"},"f":[{"t":2,"r":"./top_reaction.text"}]}," ",{"t":7,"e":"div","a":{"class":"antenna-contentrec-indicator-wrapper"},"f":[{"t":7,"e":"div","a":{"class":"antenna-contentrec-reaction-indicator"},"f":[{"t":8,"r":"logo"},{"t":7,"e":"span","a":{"class":"antenna-contentrec-reaction-count"},"f":[" ",{"t":2,"r":"./reaction_count"}]}]}]}]}," ",{"t":7,"e":"div","a":{"class":"antenna-contentrec-body","style":["background:",{"t":2,"rx":{"r":"colors","m":[{"t":30,"n":"index"},"background"]}},";color:",{"t":2,"rx":{"r":"colors","m":[{"t":30,"n":"index"},"foreground"]}},";"]},"f":[{"t":4,"f":[{"t":7,"e":"div","a":{"class":"antenna-contentrec-body-image"},"f":[{"t":7,"e":"img","a":{"src":[{"t":2,"r":"./content.body"}]}}]}],"n":50,"x":{"r":["./content.type"],"s":"_0===\"image\""}},{"t":4,"n":51,"f":[{"t":4,"n":50,"x":{"r":["./content.type"],"s":"_0===\"text\""},"f":[{"t":7,"e":"div","a":{"class":"antenna-contentrec-body-text"},"o":"rendertext","f":[{"t":2,"r":"./content.body"}]}]}],"x":{"r":["./content.type"],"s":"_0===\"image\""}}]}," ",{"t":7,"e":"div","a":{"class":"antenna-contentrec-page-title"},"f":[{"t":2,"r":"./page.title"}]}]}],"i":"index","r":"contentData.entries"}]}],"n":50,"x":{"r":["populateContentEntries","pageData.summaryLoaded","contentData.entries"],"s":"_0(_1)&&_2"}}]}
},{}],79:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","v":{"keydown":"pagekeydown"},"a":{"class":"antenna-page antenna-defaults-page","tabindex":"0"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-body"},"f":[{"t":4,"f":[{"t":7,"e":"div","v":{"tap":"newreaction"},"a":{"class":["antenna-reaction ",{"t":2,"x":{"r":["defaultLayoutClass","index"],"s":"_0(_1)"}}]},"f":[{"t":7,"e":"div","a":{"class":"antenna-reaction-box"},"f":[{"t":7,"e":"div","a":{"class":"antenna-reaction-text"},"o":"sizetofit","f":[{"t":2,"r":"./text"}]}]}]}],"i":"index","r":"defaultReactions"}]}," ",{"t":7,"e":"div","a":{"class":"antenna-footer antenna-defaults-footer"},"f":[{"t":7,"e":"div","a":{"class":"antenna-custom-area"},"f":[{"t":7,"e":"input","v":{"focus":"customfocus","keydown":"inputkeydown","blur":"customblur"},"a":{"value":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"defaults_page__add\")"}}],"maxlength":"25"}}," ",{"t":7,"e":"button","v":{"tap":"newcustom"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"defaults_page__ok\")"}}]}]}," ",{"t":7,"e":"div","a":{"class":"antenna-text-logo"},"f":[{"t":7,"e":"a","a":{"href":"//www.antenna.is"},"f":["Antenna"]}]}]}]}]}
},{}],80:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna-page antenna-error-page"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-body"},"f":[{"t":7,"e":"div","v":{"tap":"back"},"a":{"class":"antenna-error-back"},"f":[{"t":8,"r":"left"},{"t":2,"x":{"r":["getMessage"],"s":"_0(\"reactions_widget__back\")"}}]}," ",{"t":7,"e":"div","a":{"class":"antenna-error-body"},"f":[{"t":7,"e":"div","a":{"class":"antenna-error-message"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"error_page__message\")"}}]}]}]}]}]}
},{}],81:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna-page antenna-locations-page"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-body"},"f":[{"t":7,"e":"div","v":{"tap":"back"},"a":{"class":"antenna-locations-back"},"f":[{"t":8,"r":"left"},{"t":2,"x":{"r":["getMessage"],"s":"_0(\"reactions_widget__back\")"}}]}," ",{"t":7,"e":"table","a":{"class":"antenna-locations-table"},"f":[{"t":4,"f":[{"t":7,"e":"tr","a":{"class":"antenna-locations-content-row"},"f":[{"t":7,"e":"td","a":{"class":"antenna-locations-count-cell"},"f":[{"t":4,"f":[{"t":3,"x":{"r":["getMessage"],"s":"_0(\"locations_page__count_one\")"}}],"n":50,"x":{"r":["pageReactionCount"],"s":"_0===1"}},{"t":4,"n":51,"f":[{"t":3,"x":{"r":["getMessage","pageReactionCount"],"s":"_0(\"locations_page__count_many\",[_1])"}}],"x":{"r":["pageReactionCount"],"s":"_0===1"}}]}," ",{"t":7,"e":"td","a":{"class":"antenna-locations-page-body"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"locations_page__pagelevel\")"}}]}]}],"n":50,"r":"pageReactionCount"}," ",{"t":4,"f":[{"t":4,"f":[" ",{"t":7,"e":"tr","v":{"tap":"reveal"},"a":{"class":["antenna-locations-content-row ",{"t":4,"f":["antenna-locate"],"n":50,"x":{"r":["canLocate","./containerHash"],"s":"_0(_1)"}}]},"f":[{"t":7,"e":"td","a":{"class":"antenna-locations-count-cell"},"f":[{"t":4,"f":[{"t":3,"x":{"r":["getMessage"],"s":"_0(\"locations_page__count_one\")"}}],"n":50,"x":{"r":["./count"],"s":"_0===1"}},{"t":4,"n":51,"f":[{"t":3,"x":{"r":["getMessage","./count"],"s":"_0(\"locations_page__count_many\",[_1])"}}],"x":{"r":["./count"],"s":"_0===1"}}]}," ",{"t":4,"f":[{"t":7,"e":"td","a":{"class":"antenna-locations-text-body"},"f":[{"t":2,"r":"./body"}]}],"n":50,"x":{"r":["./kind"],"s":"_0===\"txt\""}},{"t":4,"n":51,"f":[{"t":4,"n":50,"x":{"r":["./kind"],"s":"_0===\"img\""},"f":[{"t":7,"e":"td","a":{"class":"antenna-locations-image-body"},"f":[{"t":7,"e":"img","a":{"src":[{"t":2,"r":"./body"}]}}]}]},{"t":4,"n":50,"x":{"r":["./kind"],"s":"(!(_0===\"img\"))&&(_0===\"med\")"},"f":[" ",{"t":7,"e":"td","a":{"class":"antenna-locations-media-body"},"f":[{"t":8,"r":"film"},{"t":7,"e":"span","a":{"class":"antenna-locations-video"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"locations_page__video\")"}}]}]}]},{"t":4,"n":50,"x":{"r":["./kind"],"s":"(!(_0===\"img\"))&&(!(_0===\"med\"))"},"f":[" ",{"t":7,"e":"td","f":[" "]}]}],"x":{"r":["./kind"],"s":"_0===\"txt\""}}]}],"n":50,"x":{"r":["./kind"],"s":"_0!==\"pag\""}}],"i":"id","r":"locationData"}]}]}]}]}
},{}],82:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna-page antenna-login-page"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-body"},"f":[{"t":7,"e":"div","v":{"tap":"back"},"a":{"class":"antenna-login-back"},"f":[{"t":8,"r":"left"},{"t":2,"x":{"r":["getMessage"],"s":"_0(\"reactions_widget__back\")"}}]}," ",{"t":7,"e":"div","a":{"class":"antenna-login-container"},"f":[{"t":7,"e":"iframe","a":{"class":"antenna-login-iframe","src":[{"t":2,"r":"loginPageUrl"}],"seamless":0}}]}]}]}]}
},{}],83:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"span","o":"cssreset","a":{"class":"antenna antenna-media-indicator-wrapper"},"f":[{"t":7,"e":"span","m":[{"t":2,"r":"extraAttributes"}],"a":{"class":["antenna antenna-media-indicator-widget ",{"t":4,"f":["antenna-notloaded"],"n":51,"r":"containerData.loaded"}," antenna-reset ",{"t":4,"f":["antenna-touch"],"n":50,"r":"supportsTouch"}]},"f":[" ",{"t":8,"r":"logo"}," ",{"t":4,"f":[{"t":7,"e":"span","a":{"class":"antenna-reaction-total"},"o":"cssreset","f":[{"t":2,"r":"containerData.reactionTotal"}]}],"n":50,"r":"containerData.reactionTotal"},{"t":4,"n":51,"f":[{"t":7,"e":"span","a":{"class":"antenna-reaction-prompt"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"media_indicator__think\")"}}]}],"r":"containerData.reactionTotal"}]}]}]}
},{}],84:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna-page antenna-pending-page"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-body"},"f":[{"t":7,"e":"div","a":{"class":"antenna-pending-reaction"},"f":[{"t":2,"r":"text"}]}," ",{"t":7,"e":"div","a":{"class":"antenna-pending-message"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"pending_page__message_appear\")"}}]}]}]}]}
},{}],85:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna-popup"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-popup-body"},"f":[{"t":8,"r":"logo"},{"t":7,"e":"span","a":{"class":"antenna-popup-text"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"popup_widget__think\")"}}]}]}]}]}
},{}],86:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna-page antenna-reactions-page"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-body"},"f":[{"t":4,"f":[{"t":4,"f":[{"t":7,"e":"div","v":{"tap":"plusone","mouseenter":"highlight","mouseleave":"clearhighlights"},"a":{"class":["antenna-reaction ",{"t":2,"x":{"r":["reactionsLayoutClass","index"],"s":"_0(_1)"}}]},"f":[{"t":7,"e":"div","a":{"class":"antenna-reaction-box"},"f":[{"t":7,"e":"div","a":{"class":"antenna-reaction-text"},"o":"sizetofit","f":[{"t":2,"r":"./text"}]}," ",{"t":7,"e":"div","a":{"class":"antenna-reaction-count"},"f":[{"t":2,"r":"./count"}]}," ",{"t":7,"e":"div","a":{"class":"antenna-plusone"},"f":["+1"]}," ",{"t":4,"f":[{"t":7,"e":"div","v":{"tap":"showlocations"},"a":{"class":"antenna-reaction-location"},"f":[{"t":8,"r":"locationIcon"}]}],"n":50,"r":"isSummary"},{"t":4,"n":51,"f":[{"t":4,"f":[{"t":7,"e":"div","v":{"tap":"showcomments"},"a":{"class":"antenna-reaction-comments hascomments"},"f":[{"t":8,"r":"commentsIcon"}," ",{"t":2,"r":"./commentCount"}]}],"n":50,"r":"./commentCount"},{"t":4,"n":51,"f":[{"t":4,"f":[{"t":7,"e":"div","a":{"class":"antenna-reaction-comments"},"f":[{"t":8,"r":"commentsIcon"}]}],"n":50,"x":{"r":["hideCommentInput"],"s":"!_0"}}],"r":"./commentCount"}],"r":"isSummary"}]}]}],"i":"index","r":"reactions"}],"n":50,"r":"reactions"}]}," ",{"t":7,"e":"div","a":{"class":"antenna-footer antenna-reactions-footer"},"f":[{"t":4,"f":[{"t":7,"e":"div","v":{"tap":"showdefault"},"a":{"class":"antenna-think"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"reactions_page__think\")"}}]}],"n":50,"r":"reactions"},{"t":4,"n":51,"f":[{"t":7,"e":"div","a":{"class":"antenna-no-reactions"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"reactions_page__no_reactions\")"}}]}],"r":"reactions"}," ",{"t":7,"e":"div","a":{"class":"antenna-text-logo"},"f":[{"t":7,"e":"a","a":{"href":"//www.antenna.is","target":"_blank"},"f":["Antenna"]}]}]}]}]}
},{}],87:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":["antenna antenna-reactions-widget ",{"t":4,"f":["antenna-touch"],"n":50,"r":"supportsTouch"}],"tabindex":"0"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-header"},"f":[{"t":8,"r":"logo"},{"t":7,"e":"span","a":{"class":"antenna-reactions-title"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"reactions_widget__title\")"}}]}," ",{"t":7,"e":"span","v":{"tap":"close"},"a":{"class":"antenna-reactions-close"},"f":["X"]}]}," ",{"t":7,"e":"div","a":{"class":"antenna-page-container"},"f":[" ",{"t":7,"e":"div","a":{"class":"antenna-progress-page antenna-page"},"f":[{"t":7,"e":"div","a":{"class":"antenna-body"},"f":[]}," ",{"t":7,"e":"div","a":{"class":"antenna-progress-spinner"},"f":[{"t":8,"r":"logo"}]}]}]}]}]}
},{}],88:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","o":"cssreset","a":{"class":["antenna antenna-summary-widget no-ant ",{"t":4,"f":["antenna-notloaded"],"n":51,"r":"pageData.summaryLoaded"}," antenna-reset ",{"t":4,"f":["antenna-expanded-summary"],"n":50,"r":"isExpandedSummary"}]},"f":[" ",{"t":7,"e":"div","a":{"class":"antenna-summary-inner"},"f":[{"t":8,"r":"logo"},{"t":7,"e":"span","a":{"class":"antenna-summary-title"},"f":[" ",{"t":4,"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"summary_widget__reactions\")"}}],"n":50,"x":{"r":["pageData.summaryTotal"],"s":"_0===0"}},{"t":4,"n":51,"f":[{"t":4,"n":50,"x":{"r":["pageData.summaryTotal"],"s":"_0===1"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"summary_widget__reactions_one\")"}}]},{"t":4,"n":50,"x":{"r":["pageData.summaryTotal"],"s":"!(_0===1)"},"f":[" ",{"t":2,"x":{"r":["getMessage","pageData.summaryTotal"],"s":"_0(\"summary_widget__reactions_many\",[_1])"}}]}],"x":{"r":["pageData.summaryTotal"],"s":"_0===0"}}]},{"t":4,"f":[{"t":4,"f":[{"t":7,"e":"span","o":"cssreset","a":{"class":["antenna-expanded-reaction ",{"t":4,"f":["antenna-expanded-first"],"n":50,"x":{"r":["@index"],"s":"_0===0"}}]},"f":[{"t":7,"e":"span","a":{"class":"antenna-expanded-text"},"f":[{"t":2,"r":"./text"}]},{"t":7,"e":"span","a":{"class":"antenna-expanded-count"},"f":[{"t":2,"r":"./count"}]}]}],"x":{"r":["computeExpandedReactions","pageData.summaryReactions"],"s":"_0(_1)"}}],"n":50,"r":"isExpandedSummary"}]}]}]}
},{}],89:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"span","a":{"class":"antenna-comments"},"f":[{"t":7,"e":"svg","f":[{"t":7,"e":"use","a":{"class":"antenna-comments-path","xlink:href":"#antenna-svg-comment"}}]}]}]}
},{}],90:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"span","a":{"class":"antenna-facebook"},"f":[{"t":7,"e":"svg","f":[{"t":7,"e":"use","a":{"class":"antenna-facebook-path","xlink:href":"#antenna-svg-facebook"}}]}]}]}
},{}],91:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"span","a":{"class":"antenna-film"},"f":[{"t":7,"e":"svg","f":[{"t":7,"e":"use","a":{"class":"antenna-film-path","xlink:href":"#antenna-svg-film"}}]}]}]}
},{}],92:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"span","a":{"class":"antenna-left"},"f":[{"t":7,"e":"svg","f":[{"t":7,"e":"use","a":{"class":"antenna-left-path","xlink:href":"#antenna-svg-left"}}]}]}]}
},{}],93:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"span","a":{"class":"antenna-location"},"f":[{"t":7,"e":"svg","f":[{"t":7,"e":"use","a":{"class":"antenna-location-path","xlink:href":"#antenna-svg-search"}}]}]}]}
},{}],94:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"span","a":{"class":"antenna-logo"},"f":[{"t":7,"e":"svg","a":{"viewBox":"0 0 512 512"},"f":[" ",{"t":7,"e":"path","a":{"class":"antenna-logo-path","d":"m283 510c125-17 229-124 229-253 0-141-115-256-256-256-141 0-256 115-256 256 0 130 108 237 233 254l0-149c-48-14-84-50-84-102 0-65 43-113 108-113 65 0 107 48 107 113 0 52-33 88-81 102z"}}]}]}]}
},{}],95:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"span","a":{"class":"antenna-logo"},"f":[{"t":7,"e":"svg","f":[{"t":7,"e":"use","a":{"class":"antenna-logo-path","xlink:href":"#antenna-svg-logo"}}]}]}]}
},{}],96:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"span","a":{"class":"antenna-twitter"},"f":[{"t":7,"e":"svg","f":[{"t":7,"e":"use","a":{"class":"antenna-twitter-path","xlink:href":"#antenna-svg-twitter"}}]}]}]}
},{}],97:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"svg","a":{"xmlns":"http://www.w3.org/2000/svg","style":"display: none;"},"f":[{"t":7,"e":"symbol","a":{"id":"antenna-svg-twitter","viewBox":"0 0 512 512"},"f":[{"t":7,"e":"path","a":{"d":"m453 134c-14 6-30 11-46 12c16-10 29-25 35-44c-15 9-33 16-51 19c-15-15-36-25-59-25c-45 0-81 36-81 81c0 6 1 12 2 18c-67-3-127-35-167-84c-7 12-11 25-11 40c0 28 15 53 36 68c-13-1-25-4-36-11c0 1 0 1 0 2c0 39 28 71 65 79c-7 2-14 3-22 3c-5 0-10-1-15-2c10 32 40 56 76 56c-28 22-63 35-101 35c-6 0-13 0-19-1c36 23 78 36 124 36c149 0 230-123 230-230c0-3 0-7 0-10c16-12 29-26 40-42z"}}]}," ",{"t":7,"e":"symbol","a":{"id":"antenna-svg-facebook","viewBox":"0 0 512 512"},"f":[{"t":7,"e":"path","a":{"d":"m420 72l-328 0c-11 0-20 9-20 20l0 328c0 11 9 20 20 20l177 0l0-142l-48 0l0-56l48 0l0-41c0-48 29-74 71-74c20 0 38 2 43 3l0 49l-29 0c-23 0-28 11-28 27l0 36l55 0l-7 56l-48 0l0 142l94 0c11 0 20-9 20-20l0-328c0-11-9-20-20-20z"}}]}," ",{"t":7,"e":"symbol","a":{"id":"antenna-svg-comment","viewBox":"0 0 512 512"},"f":[{"t":7,"e":"path","a":{"d":"m512 256c0 33-11 64-34 92c-23 28-54 50-93 66c-40 17-83 25-129 25c-13 0-27-1-41-2c-38 33-82 56-132 69c-9 2-20 4-32 6c-4 0-7 0-9-3c-3-2-4-4-5-8l0 0c-1-1-1-2 0-4c0-1 0-2 0-2c0-1 1-2 2-3l1-3c0 0 1-1 2-2c2-2 2-3 3-3c1-1 4-5 8-10c5-5 8-8 10-10c2-3 5-6 9-12c4-5 7-10 9-14c3-5 5-10 8-17c3-7 5-14 8-22c-30-17-54-38-71-63c-17-25-26-51-26-80c0-25 7-48 20-71c14-23 32-42 55-58c23-17 50-30 82-39c31-10 64-15 99-15c46 0 89 8 129 25c39 16 70 38 93 66c23 28 34 59 34 92z"}}]}," ",{"t":7,"e":"symbol","a":{"id":"antenna-svg-search","viewBox":"0 0 512 512"},"f":[{"t":7,"e":"path","a":{"d":"m347 238c0-36-12-66-37-91c-25-25-55-37-91-37c-35 0-65 12-90 37c-25 25-38 55-38 91c0 35 13 65 38 90c25 25 55 38 90 38c36 0 66-13 91-38c25-25 37-55 37-90z m147 237c0 10-4 19-11 26c-7 7-16 11-26 11c-10 0-19-4-26-11l-98-98c-34 24-72 36-114 36c-27 0-53-5-78-16c-25-11-46-25-64-43c-18-18-32-39-43-64c-10-25-16-51-16-78c0-28 6-54 16-78c11-25 25-47 43-65c18-18 39-32 64-43c25-10 51-15 78-15c28 0 54 5 79 15c24 11 46 25 64 43c18 18 32 40 43 65c10 24 16 50 16 78c0 42-12 80-36 114l98 98c7 7 11 15 11 25z"}}]}," ",{"t":7,"e":"symbol","a":{"id":"antenna-svg-left","viewBox":"0 0 512 512"},"f":[{"t":7,"e":"path","a":{"d":"m368 160l-64-64-160 160 160 160 64-64-96-96z"}}]}," ",{"t":7,"e":"symbol","a":{"id":"antenna-svg-logo","viewBox":"0 0 512 512"},"f":[" ",{"t":7,"e":"path","a":{"d":"m283 510c125-17 229-124 229-253 0-141-115-256-256-256-141 0-256 115-256 256 0 130 108 237 233 254l0-149c-48-14-84-50-84-102 0-65 43-113 108-113 65 0 107 48 107 113 0 52-33 88-81 102z"}}]}," ",{"t":7,"e":"symbol","a":{"id":"antenna-svg-film","viewBox":"0 0 512 512"},"f":[{"t":7,"e":"path","a":{"d":"m91 457l0-36c0-5-1-10-5-13-4-4-8-6-13-6l-36 0c-5 0-10 2-13 6-4 3-6 8-6 13l0 36c0 5 2 9 6 13 3 4 8 5 13 5l36 0c5 0 9-1 13-5 4-4 5-8 5-13z m0-110l0-36c0-5-1-9-5-13-4-4-8-5-13-5l-36 0c-5 0-10 1-13 5-4 4-6 8-6 13l0 36c0 5 2 10 6 13 3 4 8 6 13 6l36 0c5 0 9-2 13-6 4-3 5-8 5-13z m0-109l0-37c0-5-1-9-5-13-4-3-8-5-13-5l-36 0c-5 0-10 2-13 5-4 4-6 8-6 13l0 37c0 5 2 9 6 13 3 3 8 5 13 5l36 0c5 0 9-2 13-5 4-4 5-8 5-13z m293 219l0-146c0-5-2-9-5-13-4-4-8-5-13-5l-220 0c-5 0-9 1-13 5-3 4-5 8-5 13l0 146c0 5 2 9 5 13 4 4 8 5 13 5l220 0c5 0 9-1 13-5 3-4 5-8 5-13z m-293-329l0-37c0-5-1-9-5-12-4-4-8-6-13-6l-36 0c-5 0-10 2-13 6-4 3-6 7-6 12l0 37c0 5 2 9 6 13 3 3 8 5 13 5l36 0c5 0 9-2 13-5 4-4 5-8 5-13z m403 329l0-36c0-5-2-10-6-13-3-4-8-6-13-6l-36 0c-5 0-9 2-13 6-4 3-5 8-5 13l0 36c0 5 1 9 5 13 4 4 8 5 13 5l36 0c5 0 10-1 13-5 4-4 6-8 6-13z m-110-219l0-147c0-5-2-9-5-12-4-4-8-6-13-6l-220 0c-5 0-9 2-13 6-3 3-5 7-5 12l0 147c0 5 2 9 5 13 4 3 8 5 13 5l220 0c5 0 9-2 13-5 3-4 5-8 5-13z m110 109l0-36c0-5-2-9-6-13-3-4-8-5-13-5l-36 0c-5 0-9 1-13 5-4 4-5 8-5 13l0 36c0 5 1 10 5 13 4 4 8 6 13 6l36 0c5 0 10-2 13-6 4-3 6-8 6-13z m0-109l0-37c0-5-2-9-6-13-3-3-8-5-13-5l-36 0c-5 0-9 2-13 5-4 4-5 8-5 13l0 37c0 5 1 9 5 13 4 3 8 5 13 5l36 0c5 0 10-2 13-5 4-4 6-8 6-13z m0-110l0-37c0-5-2-9-6-12-3-4-8-6-13-6l-36 0c-5 0-9 2-13 6-4 3-5 7-5 12l0 37c0 5 1 9 5 13 4 3 8 5 13 5l36 0c5 0 10-2 13-5 4-4 6-8 6-13z m36-46l0 384c0 13-4 24-13 33-9 9-20 13-32 13l-458 0c-12 0-23-4-32-13-9-9-13-20-13-33l0-384c0-12 4-23 13-32 9-9 20-13 32-13l458 0c12 0 23 4 32 13 9 9 13 20 13 32z"}}]}]}]}
},{}],98:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","o":"cssreset","v":{"tap":"dismiss"},"a":{"class":["antenna antenna-tap-helper ",{"t":4,"f":["antenna-helper-top"],"n":50,"r":"positionTop"},{"t":4,"n":51,"f":["antenna-helper-bottom"],"r":"positionTop"}]},"f":[{"t":7,"e":"div","a":{"class":"antenna-tap-helper-inner"},"f":[{"t":7,"e":"div","f":[{"t":8,"r":"logo"},{"t":7,"e":"span","a":{"class":"antenna-tap-helper-prompt"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"tap_helper__prompt\")"}}]}]}," ",{"t":7,"e":"div","a":{"class":"antenna-tap-helper-close"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"tap_helper__close\")"}}]}]}]}]}
},{}],99:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"span","o":"cssreset","a":{"class":["antenna antenna-text-indicator-widget ",{"t":4,"f":["antenna-notloaded"],"n":51,"r":"containerData.loaded"}," antenna-reset ",{"t":4,"f":["antenna-hasreactions"],"n":50,"x":{"r":["containerData.reactionTotal"],"s":"_0>0"}}," ",{"t":4,"f":["antenna-suppress"],"n":50,"r":"containerData.suppress"}," ",{"t":2,"r":"extraClasses"}]},"f":[" ",{"t":7,"e":"span","a":{"class":"antenna-text-indicator-inner"},"f":[{"t":8,"r":"logo"},{"t":4,"f":[{"t":7,"e":"span","a":{"class":"antenna-reaction-total"},"o":"cssreset","f":[{"t":2,"r":"containerData.reactionTotal"}]}],"n":50,"r":"containerData.reactionTotal"}]}]}]}
},{}]},{},[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,31,32,33,34,35,36,37,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvYW50ZW5uYS1hcHAuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvYXV0by1jYWxsLXRvLWFjdGlvbi5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9ibG9ja2VkLXJlYWN0aW9uLXBhZ2UuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvY2FsbC10by1hY3Rpb24tY291bnRlci5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9jYWxsLXRvLWFjdGlvbi1leHBhbmRlZC1yZWFjdGlvbnMuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvY2FsbC10by1hY3Rpb24taW5kaWNhdG9yLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL2NhbGwtdG8tYWN0aW9uLWxhYmVsLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL2NvbW1lbnQtYXJlYS1wYXJ0aWFsLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL2NvbW1lbnRzLXBhZ2UuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvY29uZmlybWF0aW9uLXBhZ2UuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvY29udGVudC1yZWMtbG9hZGVyLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL2NvbnRlbnQtcmVjLXdpZGdldC5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9jc3MtbG9hZGVyLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL2RlZmF1bHRzLXBhZ2UuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvZXZlbnRzLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL2dlbmVyaWMtZXJyb3ItcGFnZS5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9ncm91cC1zZXR0aW5ncy1sb2FkZXIuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvZ3JvdXAtc2V0dGluZ3MuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvaGFzaGVkLWVsZW1lbnRzLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL2xvY2F0aW9ucy1wYWdlLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL2xvZ2luLXBhZ2UuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvbWVkaWEtaW5kaWNhdG9yLXdpZGdldC5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9wYWdlLWRhdGEtbG9hZGVyLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3BhZ2UtZGF0YS5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9wYWdlLXNjYW5uZXIuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvcGVuZGluZy1yZWFjdGlvbi1wYWdlLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3BvcHVwLXdpZGdldC5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9yZWFjdGlvbnMtcGFnZS5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9yZWFjdGlvbnMtd2lkZ2V0LmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3JlYWRtb3JlLWV2ZW50cy5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9yZWluaXRpYWxpemVyLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3NjcmlwdC1sb2FkZXIuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvc3VtbWFyeS13aWRnZXQuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvc3Zncy5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy90YXAtaGVscGVyLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3RleHQtaW5kaWNhdG9yLXdpZGdldC5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy90ZXh0LXJlYWN0aW9ucy5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9hamF4LWNsaWVudC5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9hcHAtbW9kZS5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9icm93c2VyLW1ldHJpY3MuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvY2FsbGJhY2stc3VwcG9ydC5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9oYXNoLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL2pxdWVyeS1wcm92aWRlci5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9qc29uLXV0aWxzLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL21kNS5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9tZXNzYWdlcy1lbi5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9tZXNzYWdlcy1lcy5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9tZXNzYWdlcy5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9tb3ZlYWJsZS5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9tdXRhdGlvbi1vYnNlcnZlci5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9wYWdlLXV0aWxzLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL3JhY3RpdmUtZXZlbnRzLXRhcC5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9yYWN0aXZlLXByb3ZpZGVyLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL3JhbmdlLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL3Jhbmd5LXByb3ZpZGVyLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL3JlYWN0aW9ucy13aWRnZXQtbGF5b3V0LXV0aWxzLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL3NlZ21lbnQuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvdGhyb3R0bGVkLWV2ZW50cy5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy90b3VjaC1zdXBwb3J0LmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL3RyYW5zaXRpb24tdXRpbC5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy91cmwtY29uc3RhbnRzLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL3VybC1wYXJhbXMuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvdXJscy5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy91c2VyLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL3Zpc2liaWxpdHkuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvd2lkZ2V0LWJ1Y2tldC5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy94ZG0tY2xpZW50LmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL3hkbS1sb2FkZXIuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMveGRtLWFuYWx5dGljcy5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvYXV0by1jYWxsLXRvLWFjdGlvbi5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvYmxvY2tlZC1yZWFjdGlvbi1wYWdlLmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9jYWxsLXRvLWFjdGlvbi1jb3VudGVyLmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9jYWxsLXRvLWFjdGlvbi1leHBhbmRlZC1yZWFjdGlvbnMuaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL2NhbGwtdG8tYWN0aW9uLWxhYmVsLmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9jb21tZW50LWFyZWEtcGFydGlhbC5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvY29tbWVudHMtcGFnZS5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvY29uZmlybWF0aW9uLXBhZ2UuaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL2NvbnRlbnQtcmVjLXdpZGdldC5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvZGVmYXVsdHMtcGFnZS5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvZ2VuZXJpYy1lcnJvci1wYWdlLmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9sb2NhdGlvbnMtcGFnZS5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvbG9naW4tcGFnZS5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvbWVkaWEtaW5kaWNhdG9yLXdpZGdldC5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvcGVuZGluZy1yZWFjdGlvbi1wYWdlLmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9wb3B1cC13aWRnZXQuaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL3JlYWN0aW9ucy1wYWdlLmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9yZWFjdGlvbnMtd2lkZ2V0Lmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9zdW1tYXJ5LXdpZGdldC5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvc3ZnLWNvbW1lbnRzLmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9zdmctZmFjZWJvb2suaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL3N2Zy1maWxtLmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9zdmctbGVmdC5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvc3ZnLWxvY2F0aW9uLmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9zdmctbG9nby1zZWxlY3RhYmxlLmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9zdmctbG9nby5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvc3ZnLXR3aXR0ZXIuaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL3N2Z3MuaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL3RhcC1oZWxwZXIuaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL3RleHQtaW5kaWNhdG9yLXdpZGdldC5oYnMuaHRtbCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pVQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaFJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdE1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNWpCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyaUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlVQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2TkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBOztBQ0FBOztBQ0FBOztBQ0FBOztBQ0FBOztBQ0FBOztBQ0FBOztBQ0FBOztBQ0FBOztBQ0FBOztBQ0FBOztBQ0FBOztBQ0FBOztBQ0FBOztBQ0FBOztBQ0FBOztBQ0FBOztBQ0FBOztBQ0FBOztBQ0FBOztBQ0FBOztBQ0FBOztBQ0FBOztBQ0FBOztBQ0FBOztBQ0FBOztBQ0FBOztBQ0FBOztBQ0FBOztBQ0FBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImlmICh3aW5kb3cuQU5URU5OQUlTIHx8IHdpbmRvdy5hbnRlbm5hIHx8IHdpbmRvdy5BbnRlbm5hQXBwKSB7XG4gICAgLy8gUHJvdGVjdCBhZ2FpbnN0IG11bHRpcGxlIGluc3RhbmNlcyBvZiB0aGlzIHNjcmlwdCBiZWluZyBhZGRlZCB0byB0aGUgcGFnZSAob3IgdGhpcyBzY3JpcHQgYW5kIGVuZ2FnZS5qcylcbiAgICByZXR1cm47XG59XG5pZiAoIXdpbmRvdy5NdXRhdGlvbk9ic2VydmVyIHx8ICFFbGVtZW50LnByb3RvdHlwZS5hZGRFdmVudExpc3RlbmVyIHx8ICEoJ2NsYXNzTGlzdCcgaW4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JykpKSB7XG4gICAgLy8gQmFpbCBvdXQgb24gbGVnYWN5IGJyb3dzZXJzLlxuICAgIHJldHVybjtcbn1cblxudmFyIFNjcmlwdExvYWRlciA9IHJlcXVpcmUoJy4vc2NyaXB0LWxvYWRlcicpO1xudmFyIENzc0xvYWRlciA9IHJlcXVpcmUoJy4vY3NzLWxvYWRlcicpO1xudmFyIEdyb3VwU2V0dGluZ3NMb2FkZXIgPSByZXF1aXJlKCcuL2dyb3VwLXNldHRpbmdzLWxvYWRlcicpO1xudmFyIFRhcEhlbHBlciA9IHJlcXVpcmUoJy4vdGFwLWhlbHBlcicpO1xudmFyIFBhZ2VEYXRhTG9hZGVyID0gcmVxdWlyZSgnLi9wYWdlLWRhdGEtbG9hZGVyJyk7XG52YXIgUGFnZVNjYW5uZXIgPSByZXF1aXJlKCcuL3BhZ2Utc2Nhbm5lcicpO1xudmFyIFJlaW5pdGlhbGl6ZXIgPSByZXF1aXJlKCcuL3JlaW5pdGlhbGl6ZXInKTtcbnZhciBYRE1BbmFseXRpY3MgPSByZXF1aXJlKCcuL3hkbS1hbmFseXRpY3MnKTtcbnZhciBCcm93c2VyTWV0cmljcyA9IHJlcXVpcmUoJy4vdXRpbHMvYnJvd3Nlci1tZXRyaWNzJyk7XG52YXIgWERNTG9hZGVyID0gcmVxdWlyZSgnLi91dGlscy94ZG0tbG9hZGVyJyk7XG5cbndpbmRvdy5BbnRlbm5hQXBwID0geyAvLyBUT0RPIGZsZXNoIG91dCBvdXIgZGVzaXJlZCBBUElcbiAgICByZWluaXRpYWxpemU6IFJlaW5pdGlhbGl6ZXIucmVpbml0aWFsaXplQWxsXG4gICAgLy8gdGVhcmRvd24/XG4gICAgLy8gdHJhY2U/XG4gICAgLy8gZGVidWc/XG4gICAgLy8gcGFnZWRhdGE/XG4gICAgLy8gZ3JvdXBzZXR0aW5ncz9cbiAgICAvLyBuZWVkIHRvIG1ha2Ugc3VyZSBvdGhlcnMgKGUuZy4gbWFsaWNpb3VzIHNjcmlwdHMpIGNhbid0IHdyaXRlIGRhdGFcbn07XG5cbi8vIFN0ZXAgMSAtIGtpY2sgb2ZmIHRoZSBhc3luY2hyb25vdXMgbG9hZGluZyBvZiB0aGUgSmF2YXNjcmlwdCBhbmQgQ1NTIHdlIG5lZWQuXG5Dc3NMb2FkZXIubG9hZCgpOyAvLyBJbmplY3QgdGhlIENTUyBmaXJzdCBiZWNhdXNlIHdlIG1heSBzb29uIGFwcGVuZCBtb3JlIGFzeW5jaHJvbm91c2x5LCBpbiB0aGUgZ3JvdXBTZXR0aW5ncyBjYWxsYmFjaywgYW5kIHdlIHdhbnQgdGhhdCBDU1MgdG8gYmUgbG93ZXIgaW4gdGhlIGRvY3VtZW50LlxuU2NyaXB0TG9hZGVyLmxvYWQoc2NyaXB0TG9hZGVkKTtcblxuZnVuY3Rpb24gc2NyaXB0TG9hZGVkKCkge1xuICAgIC8vIFN0ZXAgMiAtIE9uY2Ugd2UgaGF2ZSBvdXIgcmVxdWlyZWQgc2NyaXB0cywgZmV0Y2ggdGhlIGdyb3VwIHNldHRpbmdzIGZyb20gdGhlIHNlcnZlclxuICAgIEdyb3VwU2V0dGluZ3NMb2FkZXIubG9hZChmdW5jdGlvbihncm91cFNldHRpbmdzKSB7XG4gICAgICAgIGlmIChncm91cFNldHRpbmdzLmlzSGlkZU9uTW9iaWxlKCkgJiYgQnJvd3Nlck1ldHJpY3MuaXNNb2JpbGUoKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIC8vIFN0ZXAgMyAtIE9uY2Ugd2UgaGF2ZSB0aGUgc2V0dGluZ3MsIHdlIGNhbiBraWNrIG9mZiBhIGNvdXBsZSB0aGluZ3MgaW4gcGFyYWxsZWw6XG4gICAgICAgIC8vXG4gICAgICAgIC8vIC0tIGluamVjdCBhbnkgY3VzdG9tIENTUyBmcm9tIHRoZSBncm91cCBzZXR0aW5nc1xuICAgICAgICAvLyAtLSBjcmVhdGUgdGhlIGhpZGRlbiBpZnJhbWUgd2UgdXNlIGZvciBjcm9zcy1kb21haW4gY29va2llcyAocHJpbWFyaWx5IHVzZXIgbG9naW4pXG4gICAgICAgIC8vIC0tIHN0YXJ0IGZldGNoaW5nIHRoZSBwYWdlIGRhdGFcbiAgICAgICAgLy8gLS0gc3RhcnQgaGFzaGluZyB0aGUgcGFnZSBhbmQgaW5zZXJ0aW5nIHRoZSBhZmZvcmRhbmNlcyAoaW4gdGhlIGVtcHR5IHN0YXRlKVxuICAgICAgICAvL1xuICAgICAgICAvLyBBcyB0aGUgcGFnZSBpcyBzY2FubmVkLCB0aGUgd2lkZ2V0cyBhcmUgY3JlYXRlZCBhbmQgYm91bmQgdG8gdGhlIHBhZ2UgZGF0YSB0aGF0IGNvbWVzIGluLlxuICAgICAgICBpbml0Q3VzdG9tQ1NTKGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICBpbml0WGRtRnJhbWUoZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIGZldGNoUGFnZURhdGEoZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIHNjYW5QYWdlKGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICBzZXR1cE1vYmlsZUhlbHBlcihncm91cFNldHRpbmdzKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gaW5pdEN1c3RvbUNTUyhncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGN1c3RvbUNTUyA9IGdyb3VwU2V0dGluZ3MuY3VzdG9tQ1NTKCk7XG4gICAgaWYgKGN1c3RvbUNTUykge1xuICAgICAgICBDc3NMb2FkZXIuaW5qZWN0KGN1c3RvbUNTUyk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBpbml0WGRtRnJhbWUoZ3JvdXBTZXR0aW5ncykge1xuICAgIFhETUFuYWx5dGljcy5zdGFydCgpOyAvLyBUaGUgWERNIGlmcmFtZSBoYXMgYSBudW1iZXIgb2YgbWVzc2FnZXMgaXQgZmlyZXMgb24gbG9hZCByZWxhdGVkIHRvIGFuYWx5dGljcy4gU3RhcnQgbGlzdGVuaW5nLlxuICAgIFhETUxvYWRlci5jcmVhdGVYRE1mcmFtZShncm91cFNldHRpbmdzLmdyb3VwSWQoKSk7XG59XG5cbmZ1bmN0aW9uIGZldGNoUGFnZURhdGEoZ3JvdXBTZXR0aW5ncykge1xuICAgIFBhZ2VEYXRhTG9hZGVyLmxvYWQoZ3JvdXBTZXR0aW5ncyk7XG59XG5cbmZ1bmN0aW9uIHNjYW5QYWdlKGdyb3VwU2V0dGluZ3MpIHtcbiAgICBQYWdlU2Nhbm5lci5zY2FuKGdyb3VwU2V0dGluZ3MsIFJlaW5pdGlhbGl6ZXIucmVpbml0aWFsaXplKTtcbn1cblxuZnVuY3Rpb24gc2V0dXBNb2JpbGVIZWxwZXIoZ3JvdXBTZXR0aW5ncykge1xuICAgIFRhcEhlbHBlci5zZXR1cEhlbHBlcihncm91cFNldHRpbmdzKTtcbn0iLCJ2YXIgJDsgcmVxdWlyZSgnLi91dGlscy9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciBCcm93c2VyTWV0cmljcyA9IHJlcXVpcmUoJy4vdXRpbHMvYnJvd3Nlci1tZXRyaWNzJyk7XG52YXIgUmFjdGl2ZTsgcmVxdWlyZSgnLi91dGlscy9yYWN0aXZlLXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGxvYWRlZFJhY3RpdmUpIHsgUmFjdGl2ZT1sb2FkZWRSYWN0aXZlOyB9KTtcbnZhciBTVkdzID0gcmVxdWlyZSgnLi9zdmdzJyk7XG5cbmZ1bmN0aW9uIGNyZWF0ZUNhbGxUb0FjdGlvbihhbnRJdGVtSWQsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIHJhY3RpdmUgPSBSYWN0aXZlKHtcbiAgICAgICAgZWw6ICQoJzxkaXY+JyksXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIGFudEl0ZW1JZDogYW50SXRlbUlkLFxuICAgICAgICAgICAgZXhwYW5kUmVhY3Rpb25zOiBzaG91bGRFeHBhbmRSZWFjdGlvbnMoZ3JvdXBTZXR0aW5ncylcbiAgICAgICAgfSxcbiAgICAgICAgdGVtcGxhdGU6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9hdXRvLWNhbGwtdG8tYWN0aW9uLmhicy5odG1sJyksXG4gICAgICAgIHBhcnRpYWxzOiB7XG4gICAgICAgICAgICBsb2dvOiBTVkdzLmxvZ29cbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiB7XG4gICAgICAgIGVsZW1lbnQ6ICQocmFjdGl2ZS5maW5kKCcuYW50ZW5uYS1hdXRvLWN0YScpKSxcbiAgICAgICAgdGVhcmRvd246IGZ1bmN0aW9uKCkgeyByYWN0aXZlLnRlYXJkb3duKCk7IH1cbiAgICB9O1xufVxuXG5mdW5jdGlvbiBzaG91bGRFeHBhbmRSZWFjdGlvbnMoZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBzZXR0aW5nID0gZ3JvdXBTZXR0aW5ncy5nZW5lcmF0ZWRDdGFFeHBhbmRlZCgpOyAvLyBWYWx1ZXMgYXJlICdub25lJywgJ2JvdGgnLCAnZGVza3RvcCcsIGFuZCAnbW9iaWxlJ1xuICAgIHJldHVybiBzZXR0aW5nID09PSAnYm90aCcgfHxcbiAgICAgICAgKHNldHRpbmcgPT09ICdkZXNrdG9wJyAmJiAhQnJvd3Nlck1ldHJpY3MuaXNNb2JpbGUoKSkgfHxcbiAgICAgICAgKHNldHRpbmcgPT09ICdtb2JpbGUnICYmIEJyb3dzZXJNZXRyaWNzLmlzTW9iaWxlKCkpO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlOiBjcmVhdGVDYWxsVG9BY3Rpb25cbn07IiwidmFyIFJhY3RpdmU7IHJlcXVpcmUoJy4vdXRpbHMvcmFjdGl2ZS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihsb2FkZWRSYWN0aXZlKSB7IFJhY3RpdmUgPSBsb2FkZWRSYWN0aXZlO30pO1xudmFyIFNWR3MgPSByZXF1aXJlKCcuL3N2Z3MnKTtcblxudmFyIHBhZ2VTZWxlY3RvciA9ICcuYW50ZW5uYS1ibG9ja2VkLXBhZ2UnO1xuXG5mdW5jdGlvbiBjcmVhdGVQYWdlKG9wdGlvbnMpIHtcbiAgICB2YXIgZ29CYWNrID0gb3B0aW9ucy5nb0JhY2s7XG4gICAgdmFyIGVsZW1lbnQgPSBvcHRpb25zLmVsZW1lbnQ7XG4gICAgdmFyIHJhY3RpdmUgPSBSYWN0aXZlKHtcbiAgICAgICAgZWw6IGVsZW1lbnQsXG4gICAgICAgIGFwcGVuZDogdHJ1ZSxcbiAgICAgICAgZGF0YToge30sXG4gICAgICAgIHRlbXBsYXRlOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvYmxvY2tlZC1yZWFjdGlvbi1wYWdlLmhicy5odG1sJyksXG4gICAgICAgIHBhcnRpYWxzOiB7XG4gICAgICAgICAgICBsZWZ0OiBTVkdzLmxlZnRcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJhY3RpdmUub24oJ2JhY2snLCBnb0JhY2spO1xuICAgIHJldHVybiB7XG4gICAgICAgIHNlbGVjdG9yOiBwYWdlU2VsZWN0b3IsXG4gICAgICAgIHRlYXJkb3duOiBmdW5jdGlvbigpIHsgcmFjdGl2ZS50ZWFyZG93bigpOyB9XG4gICAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlUGFnZTogY3JlYXRlUGFnZVxufTsiLCJ2YXIgUmFjdGl2ZTsgcmVxdWlyZSgnLi91dGlscy9yYWN0aXZlLXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGxvYWRlZFJhY3RpdmUpIHsgUmFjdGl2ZSA9IGxvYWRlZFJhY3RpdmU7fSk7XG5cbmZ1bmN0aW9uIGNyZWF0ZUNvdW50KCRjb3VudEVsZW1lbnQsIGNvbnRhaW5lckRhdGEpIHtcbiAgICB2YXIgcmFjdGl2ZSA9IFJhY3RpdmUoe1xuICAgICAgICBlbDogJGNvdW50RWxlbWVudCxcbiAgICAgICAgbWFnaWM6IHRydWUsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIGNvbnRhaW5lckRhdGE6IGNvbnRhaW5lckRhdGFcbiAgICAgICAgfSxcbiAgICAgICAgdGVtcGxhdGU6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9jYWxsLXRvLWFjdGlvbi1jb3VudGVyLmhicy5odG1sJylcbiAgICB9KTtcbiAgICByZXR1cm4ge1xuICAgICAgICB0ZWFyZG93bjogZnVuY3Rpb24oKSB7IHJhY3RpdmUudGVhcmRvd24oKTsgfVxuICAgIH07XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGU6IGNyZWF0ZUNvdW50XG59OyIsInZhciBSYWN0aXZlOyByZXF1aXJlKCcuL3V0aWxzL3JhY3RpdmUtcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24obG9hZGVkUmFjdGl2ZSkgeyBSYWN0aXZlID0gbG9hZGVkUmFjdGl2ZTt9KTtcblxuZnVuY3Rpb24gY3JlYXRlRXhwYW5kZWRSZWFjdGlvbnMoJGV4cGFuZGVkUmVhY3Rpb25zRWxlbWVudCwgJGN0YUVsZW1lbnQsIGNvbnRhaW5lckRhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgcmFjdGl2ZSA9IFJhY3RpdmUoe1xuICAgICAgICBlbDogJGV4cGFuZGVkUmVhY3Rpb25zRWxlbWVudCxcbiAgICAgICAgbWFnaWM6IHRydWUsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIGNvbnRhaW5lckRhdGE6IGNvbnRhaW5lckRhdGEsXG4gICAgICAgICAgICBjb21wdXRlRXhwYW5kZWRSZWFjdGlvbnM6IGNvbXB1dGVFeHBhbmRlZFJlYWN0aW9ucyhncm91cFNldHRpbmdzLmRlZmF1bHRSZWFjdGlvbnMoJGN0YUVsZW1lbnQpKVxuICAgICAgICB9LFxuICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL2NhbGwtdG8tYWN0aW9uLWV4cGFuZGVkLXJlYWN0aW9ucy5oYnMuaHRtbCcpXG4gICAgfSk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdGVhcmRvd246IGZ1bmN0aW9uKCkgeyByYWN0aXZlLnRlYXJkb3duKCk7IH1cbiAgICB9O1xufVxuXG5mdW5jdGlvbiBjb21wdXRlRXhwYW5kZWRSZWFjdGlvbnMoZGVmYXVsdFJlYWN0aW9ucykge1xuICAgIHJldHVybiBmdW5jdGlvbihyZWFjdGlvbnNEYXRhKSB7XG4gICAgICAgIHZhciBtYXggPSAyO1xuICAgICAgICB2YXIgZXhwYW5kZWRSZWFjdGlvbnMgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZWFjdGlvbnNEYXRhLmxlbmd0aCAmJiBleHBhbmRlZFJlYWN0aW9ucy5sZW5ndGggPCBtYXg7IGkrKykge1xuICAgICAgICAgICAgdmFyIHJlYWN0aW9uRGF0YSA9IHJlYWN0aW9uc0RhdGFbaV07XG4gICAgICAgICAgICBpZiAoaXNEZWZhdWx0UmVhY3Rpb24ocmVhY3Rpb25EYXRhLCBkZWZhdWx0UmVhY3Rpb25zKSkge1xuICAgICAgICAgICAgICAgIGV4cGFuZGVkUmVhY3Rpb25zLnB1c2gocmVhY3Rpb25EYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZXhwYW5kZWRSZWFjdGlvbnM7XG4gICAgfTtcbn1cblxuZnVuY3Rpb24gaXNEZWZhdWx0UmVhY3Rpb24ocmVhY3Rpb25EYXRhLCBkZWZhdWx0UmVhY3Rpb25zKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkZWZhdWx0UmVhY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChkZWZhdWx0UmVhY3Rpb25zW2ldLnRleHQgPT09IHJlYWN0aW9uRGF0YS50ZXh0KSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGU6IGNyZWF0ZUV4cGFuZGVkUmVhY3Rpb25zXG59OyIsInZhciBDYWxsVG9BY3Rpb25Db3VudGVyID0gcmVxdWlyZSgnLi9jYWxsLXRvLWFjdGlvbi1jb3VudGVyJyk7XG52YXIgQ2FsbFRvQWN0aW9uRXhwYW5kZWRSZWFjdGlvbnMgPSByZXF1aXJlKCcuL2NhbGwtdG8tYWN0aW9uLWV4cGFuZGVkLXJlYWN0aW9ucycpO1xudmFyIENhbGxUb0FjdGlvbkxhYmVsID0gcmVxdWlyZSgnLi9jYWxsLXRvLWFjdGlvbi1sYWJlbCcpO1xudmFyIFJlYWN0aW9uc1dpZGdldCA9IHJlcXVpcmUoJy4vcmVhY3Rpb25zLXdpZGdldCcpO1xudmFyIFRvdWNoU3VwcG9ydCA9IHJlcXVpcmUoJy4vdXRpbHMvdG91Y2gtc3VwcG9ydCcpO1xuXG5cbmZ1bmN0aW9uIGNyZWF0ZUluZGljYXRvcldpZGdldChvcHRpb25zKSB7XG4gICAgdmFyIGNvbnRhaW5lckRhdGEgPSBvcHRpb25zLmNvbnRhaW5lckRhdGE7XG4gICAgdmFyICRjb250YWluZXJFbGVtZW50ID0gb3B0aW9ucy5jb250YWluZXJFbGVtZW50O1xuICAgIHZhciBjb250ZW50RGF0YSA9IG9wdGlvbnMuY29udGVudERhdGE7XG4gICAgdmFyICRjdGFFbGVtZW50ID0gb3B0aW9ucy5jdGFFbGVtZW50O1xuICAgIHZhciAkY3RhTGFiZWxzID0gb3B0aW9ucy5jdGFMYWJlbHM7IC8vIG9wdGlvbmFsXG4gICAgdmFyICRjdGFDb3VudGVycyA9IG9wdGlvbnMuY3RhQ291bnRlcnM7IC8vIG9wdGlvbmFsXG4gICAgdmFyICRjdGFFeHBhbmRlZFJlYWN0aW9ucyA9IG9wdGlvbnMuY3RhRXhwYW5kZWRSZWFjdGlvbnM7IC8vIG9wdGlvbmFsXG4gICAgdmFyIHBhZ2VEYXRhID0gb3B0aW9ucy5wYWdlRGF0YTtcbiAgICB2YXIgZ3JvdXBTZXR0aW5ncyA9IG9wdGlvbnMuZ3JvdXBTZXR0aW5ncztcbiAgICB2YXIgZGVmYXVsdFJlYWN0aW9ucyA9IG9wdGlvbnMuZGVmYXVsdFJlYWN0aW9ucztcblxuICAgIHZhciByZWFjdGlvbldpZGdldE9wdGlvbnMgPSB7XG4gICAgICAgIHJlYWN0aW9uc0RhdGE6IGNvbnRhaW5lckRhdGEucmVhY3Rpb25zLFxuICAgICAgICBjb250YWluZXJEYXRhOiBjb250YWluZXJEYXRhLFxuICAgICAgICBjb250YWluZXJFbGVtZW50OiAkY29udGFpbmVyRWxlbWVudCxcbiAgICAgICAgY29udGVudERhdGE6IGNvbnRlbnREYXRhLFxuICAgICAgICBkZWZhdWx0UmVhY3Rpb25zOiBkZWZhdWx0UmVhY3Rpb25zLFxuICAgICAgICBzdGFydFBhZ2U6IGNvbXB1dGVTdGFydFBhZ2UoJGN0YUVsZW1lbnQpLFxuICAgICAgICBwYWdlRGF0YTogcGFnZURhdGEsXG4gICAgICAgIGdyb3VwU2V0dGluZ3M6IGdyb3VwU2V0dGluZ3NcbiAgICB9O1xuXG4gICAgVG91Y2hTdXBwb3J0LnNldHVwVGFwKCRjdGFFbGVtZW50LmdldCgwKSwgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIG9wZW5SZWFjdGlvbnNXaW5kb3cocmVhY3Rpb25XaWRnZXRPcHRpb25zLCAkY3RhRWxlbWVudCk7XG4gICAgfSk7XG4gICAgJGN0YUVsZW1lbnQub24oJ21vdXNlZW50ZXIuYW50ZW5uYScsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGlmIChldmVudC5idXR0b25zID4gMCB8fCAoZXZlbnQuYnV0dG9ucyA9PSB1bmRlZmluZWQgJiYgZXZlbnQud2hpY2ggPiAwKSkgeyAvLyBPbiBTYWZhcmksIGV2ZW50LmJ1dHRvbnMgaXMgdW5kZWZpbmVkIGJ1dCBldmVudC53aGljaCBnaXZlcyBhIGdvb2QgdmFsdWUuIGV2ZW50LndoaWNoIGlzIGJhZCBvbiBGRlxuICAgICAgICAgICAgLy8gRG9uJ3QgcmVhY3QgaWYgdGhlIHVzZXIgaXMgZHJhZ2dpbmcgb3Igc2VsZWN0aW5nIHRleHQuXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgb3BlblJlYWN0aW9uc1dpbmRvdyhyZWFjdGlvbldpZGdldE9wdGlvbnMsICRjdGFFbGVtZW50KTtcbiAgICB9KTtcblxuICAgIHZhciBjcmVhdGVkV2lkZ2V0cyA9IFtdO1xuXG4gICAgaWYgKCRjdGFMYWJlbHMpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAkY3RhTGFiZWxzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjcmVhdGVkV2lkZ2V0cy5wdXNoKENhbGxUb0FjdGlvbkxhYmVsLmNyZWF0ZSgkY3RhTGFiZWxzW2ldLCBjb250YWluZXJEYXRhKSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoJGN0YUNvdW50ZXJzKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgJGN0YUNvdW50ZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjcmVhdGVkV2lkZ2V0cy5wdXNoKENhbGxUb0FjdGlvbkNvdW50ZXIuY3JlYXRlKCRjdGFDb3VudGVyc1tpXSwgY29udGFpbmVyRGF0YSkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCRjdGFFeHBhbmRlZFJlYWN0aW9ucykge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8ICRjdGFFeHBhbmRlZFJlYWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY3JlYXRlZFdpZGdldHMucHVzaChDYWxsVG9BY3Rpb25FeHBhbmRlZFJlYWN0aW9ucy5jcmVhdGUoJGN0YUV4cGFuZGVkUmVhY3Rpb25zW2ldLCAkY3RhRWxlbWVudCwgY29udGFpbmVyRGF0YSwgZ3JvdXBTZXR0aW5ncykpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgdGVhcmRvd246IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgJGN0YUVsZW1lbnQub2ZmKCcuYW50ZW5uYScpO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjcmVhdGVkV2lkZ2V0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGNyZWF0ZWRXaWRnZXRzW2ldLnRlYXJkb3duKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVTdGFydFBhZ2UoJGVsZW1lbnQpIHtcbiAgICB2YXIgdmFsID0gKCRlbGVtZW50LmF0dHIoJ2FudC1tb2RlJykgfHwgJycpLnRyaW0oKTtcbiAgICBpZiAodmFsID09PSAnd3JpdGUnKSB7XG4gICAgICAgIHJldHVybiBSZWFjdGlvbnNXaWRnZXQuUEFHRV9ERUZBVUxUUztcbiAgICB9IGVsc2UgaWYgKHZhbCA9PT0gJ3JlYWQnKSB7XG4gICAgICAgIHJldHVybiBSZWFjdGlvbnNXaWRnZXQuUEFHRV9SRUFDVElPTlM7XG4gICAgfVxuICAgIHJldHVybiBSZWFjdGlvbnNXaWRnZXQuUEFHRV9BVVRPO1xufVxuXG5mdW5jdGlvbiBvcGVuUmVhY3Rpb25zV2luZG93KHJlYWN0aW9uT3B0aW9ucywgJGN0YUVsZW1lbnQpIHtcbiAgICBSZWFjdGlvbnNXaWRnZXQub3BlbihyZWFjdGlvbk9wdGlvbnMsICRjdGFFbGVtZW50KTtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZTogY3JlYXRlSW5kaWNhdG9yV2lkZ2V0XG59OyIsInZhciBSYWN0aXZlOyByZXF1aXJlKCcuL3V0aWxzL3JhY3RpdmUtcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24obG9hZGVkUmFjdGl2ZSkgeyBSYWN0aXZlID0gbG9hZGVkUmFjdGl2ZTt9KTtcblxuZnVuY3Rpb24gY3JlYXRlTGFiZWwoJGxhYmVsRWxlbWVudCwgY29udGFpbmVyRGF0YSkge1xuICAgIHZhciByYWN0aXZlID0gUmFjdGl2ZSh7XG4gICAgICAgIGVsOiAkbGFiZWxFbGVtZW50LCAvLyBUT0RPOiByZXZpZXcgdGhlIHN0cnVjdHVyZSBvZiB0aGUgRE9NIGhlcmUuIERvIHdlIHdhbnQgdG8gcmVuZGVyIGFuIGVsZW1lbnQgaW50byAkY3RhTGFiZWwgb3IganVzdCB0ZXh0P1xuICAgICAgICBtYWdpYzogdHJ1ZSxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgY29udGFpbmVyRGF0YTogY29udGFpbmVyRGF0YVxuICAgICAgICB9LFxuICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL2NhbGwtdG8tYWN0aW9uLWxhYmVsLmhicy5odG1sJylcbiAgICB9KTtcbiAgICByZXR1cm4ge1xuICAgICAgICB0ZWFyZG93bjogZnVuY3Rpb24oKSB7IHJhY3RpdmUudGVhcmRvd24oKTsgfVxuICAgIH1cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZTogY3JlYXRlTGFiZWxcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgQWpheENsaWVudCA9IHJlcXVpcmUoJy4vdXRpbHMvYWpheC1jbGllbnQnKTtcbnZhciBVc2VyID0gcmVxdWlyZSgnLi91dGlscy91c2VyJyk7XG5cbnZhciBFdmVudHMgPSByZXF1aXJlKCcuL2V2ZW50cycpO1xuXG5mdW5jdGlvbiBzZXR1cENvbW1lbnRBcmVhKHJlYWN0aW9uUHJvdmlkZXIsIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzLCBjYWxsYmFjaywgcmFjdGl2ZSkge1xuICAgIGlmIChncm91cFNldHRpbmdzLnJlcXVpcmVzQXBwcm92YWwoKSB8fCBjb250YWluZXJEYXRhLnR5cGUgPT09ICdwYWdlJykge1xuICAgICAgICAvLyBDdXJyZW50bHksIHNpdGVzIHRoYXQgcmVxdWlyZSBhcHByb3ZhbCBkb24ndCBzdXBwb3J0IGNvbW1lbnQgaW5wdXQuXG4gICAgICAgICQocmFjdGl2ZS5maW5kKCcuYW50ZW5uYS1jb21tZW50LXdpZGdldHMnKSkuaGlkZSgpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHJhY3RpdmUub24oJ2lucHV0Y2hhbmdlZCcsIHVwZGF0ZUlucHV0Q291bnRlcik7XG4gICAgcmFjdGl2ZS5vbignYWRkY29tbWVudCcsIGFkZENvbW1lbnQpO1xuICAgIHVwZGF0ZUlucHV0Q291bnRlcigpO1xuXG4gICAgZnVuY3Rpb24gYWRkQ29tbWVudCgpIHtcbiAgICAgICAgdmFyIGNvbW1lbnQgPSAkKHJhY3RpdmUuZmluZCgnLmFudGVubmEtY29tbWVudC1pbnB1dCcpKS52YWwoKS50cmltKCk7IC8vIFRPRE86IGFkZGl0aW9uYWwgdmFsaWRhdGlvbj8gaW5wdXQgc2FuaXRpemluZz9cbiAgICAgICAgaWYgKGNvbW1lbnQubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgJChyYWN0aXZlLmZpbmQoJy5hbnRlbm5hLWNvbW1lbnQtd2lkZ2V0cycpKS5oaWRlKCk7XG4gICAgICAgICAgICAkKHJhY3RpdmUuZmluZCgnLmFudGVubmEtY29tbWVudC13YWl0aW5nJykpLmZhZGVJbignc2xvdycpO1xuICAgICAgICAgICAgcmVhY3Rpb25Qcm92aWRlci5nZXQoZnVuY3Rpb24gKHJlYWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgQWpheENsaWVudC5wb3N0Q29tbWVudChjb21tZW50LCByZWFjdGlvbiwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgRXZlbnRzLnBvc3RDb21tZW50Q3JlYXRlZChwYWdlRGF0YSwgY29udGFpbmVyRGF0YSwgcmVhY3Rpb24sIGNvbW1lbnQsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgICAgIH0sIGVycm9yKTtcbiAgICAgICAgICAgICAgICAkKHJhY3RpdmUuZmluZCgnLmFudGVubmEtY29tbWVudC13YWl0aW5nJykpLnN0b3AoKS5oaWRlKCk7XG4gICAgICAgICAgICAgICAgJChyYWN0aXZlLmZpbmQoJy5hbnRlbm5hLWNvbW1lbnQtcmVjZWl2ZWQnKSkuZmFkZUluKCk7XG4gICAgICAgICAgICAgICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGNvbW1lbnQsIFVzZXIub3B0aW1pc3RpY0NvbW1lbnRVc2VyKCkpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGVycm9yKG1lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gVE9ETyByZWFsIGVycm9yIGhhbmRsaW5nXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdFcnJvciBwb3N0aW5nIGNvbW1lbnQ6ICcgKyBtZXNzYWdlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHVwZGF0ZUlucHV0Q291bnRlcigpIHtcbiAgICAgICAgdmFyICR0ZXh0YXJlYSA9ICQocmFjdGl2ZS5maW5kKCcuYW50ZW5uYS1jb21tZW50LWlucHV0JykpO1xuICAgICAgICB2YXIgbWF4ID0gcGFyc2VJbnQoJHRleHRhcmVhLmF0dHIoJ21heGxlbmd0aCcpKTtcbiAgICAgICAgdmFyIGxlbmd0aCA9ICR0ZXh0YXJlYS52YWwoKS5sZW5ndGg7XG4gICAgICAgICQocmFjdGl2ZS5maW5kKCcuYW50ZW5uYS1jb21tZW50LWNvdW50JykpLmh0bWwoTWF0aC5tYXgoMCwgbWF4IC0gbGVuZ3RoKSk7XG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgc2V0dXA6IHNldHVwQ29tbWVudEFyZWFcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgUmFjdGl2ZTsgcmVxdWlyZSgnLi91dGlscy9yYWN0aXZlLXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGxvYWRlZFJhY3RpdmUpIHsgUmFjdGl2ZSA9IGxvYWRlZFJhY3RpdmU7fSk7XG52YXIgQ29tbWVudEFyZWFQYXJ0aWFsID0gcmVxdWlyZSgnLi9jb21tZW50LWFyZWEtcGFydGlhbCcpO1xudmFyIFNWR3MgPSByZXF1aXJlKCcuL3N2Z3MnKTtcblxudmFyIHBhZ2VTZWxlY3RvciA9ICcuYW50ZW5uYS1jb21tZW50cy1wYWdlJztcblxuZnVuY3Rpb24gY3JlYXRlUGFnZShvcHRpb25zKSB7XG4gICAgdmFyIHJlYWN0aW9uID0gb3B0aW9ucy5yZWFjdGlvbjtcbiAgICB2YXIgY29tbWVudHMgPSBvcHRpb25zLmNvbW1lbnRzO1xuICAgIHZhciBlbGVtZW50ID0gb3B0aW9ucy5lbGVtZW50O1xuICAgIHZhciBjb250YWluZXJEYXRhID0gb3B0aW9ucy5jb250YWluZXJEYXRhO1xuICAgIHZhciBwYWdlRGF0YSA9IG9wdGlvbnMucGFnZURhdGE7XG4gICAgdmFyIGdyb3VwU2V0dGluZ3MgPSBvcHRpb25zLmdyb3VwU2V0dGluZ3M7XG4gICAgdmFyIGdvQmFjayA9IG9wdGlvbnMuZ29CYWNrO1xuICAgIHZhciByYWN0aXZlID0gUmFjdGl2ZSh7XG4gICAgICAgIGVsOiBlbGVtZW50LFxuICAgICAgICBhcHBlbmQ6IHRydWUsXG4gICAgICAgIG1hZ2ljOiB0cnVlLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICByZWFjdGlvbjogcmVhY3Rpb24sXG4gICAgICAgICAgICBjb21tZW50czogY29tbWVudHNcbiAgICAgICAgfSxcbiAgICAgICAgdGVtcGxhdGU6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9jb21tZW50cy1wYWdlLmhicy5odG1sJyksXG4gICAgICAgIHBhcnRpYWxzOiB7XG4gICAgICAgICAgICBjb21tZW50QXJlYTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL2NvbW1lbnQtYXJlYS1wYXJ0aWFsLmhicy5odG1sJyksXG4gICAgICAgICAgICBsZWZ0OiBTVkdzLmxlZnRcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHZhciByZWFjdGlvblByb3ZpZGVyID0geyAvLyB0aGlzIHJlYWN0aW9uIHByb3ZpZGVyIGlzIGEgbm8tYnJhaW5lciBiZWNhdXNlIHdlIGFscmVhZHkgaGF2ZSBhIHZhbGlkIHJlYWN0aW9uIChvbmUgd2l0aCBhbiBJRClcbiAgICAgICAgZ2V0OiBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICAgICAgY2FsbGJhY2socmVhY3Rpb24pO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBDb21tZW50QXJlYVBhcnRpYWwuc2V0dXAocmVhY3Rpb25Qcm92aWRlciwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MsIGNvbW1lbnRBZGRlZCwgcmFjdGl2ZSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgcmFjdGl2ZS5vbignYmFjaycsIGdvQmFjayk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgc2VsZWN0b3I6IHBhZ2VTZWxlY3RvcixcbiAgICAgICAgdGVhcmRvd246IGZ1bmN0aW9uKCkgeyByYWN0aXZlLnRlYXJkb3duKCk7IH1cbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gY29tbWVudEFkZGVkKGNvbW1lbnQsIHVzZXIpIHtcbiAgICAgICAgY29tbWVudHMudW5zaGlmdCh7IHRleHQ6IGNvbW1lbnQsIHVzZXI6IHVzZXIsIG5ldzogdHJ1ZSB9KTtcbiAgICAgICAgJChyYWN0aXZlLmZpbmQoJy5hbnRlbm5hLWJvZHknKSkuYW5pbWF0ZSh7c2Nyb2xsVG9wOiAwfSk7XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGU6IGNyZWF0ZVBhZ2Vcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgUmFjdGl2ZTsgcmVxdWlyZSgnLi91dGlscy9yYWN0aXZlLXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGxvYWRlZFJhY3RpdmUpIHsgUmFjdGl2ZSA9IGxvYWRlZFJhY3RpdmU7fSk7XG52YXIgQWpheENsaWVudCA9IHJlcXVpcmUoJy4vdXRpbHMvYWpheC1jbGllbnQnKTtcbnZhciBVUkxzID0gcmVxdWlyZSgnLi91dGlscy91cmxzJyk7XG52YXIgQ29tbWVudEFyZWFQYXJ0aWFsID0gcmVxdWlyZSgnLi9jb21tZW50LWFyZWEtcGFydGlhbCcpO1xudmFyIEV2ZW50cyA9IHJlcXVpcmUoJy4vZXZlbnRzJyk7XG52YXIgU1ZHcyA9IHJlcXVpcmUoJy4vc3ZncycpO1xuXG52YXIgcGFnZVNlbGVjdG9yID0gJy5hbnRlbm5hLWNvbmZpcm1hdGlvbi1wYWdlJztcblxuZnVuY3Rpb24gY3JlYXRlUGFnZShyZWFjdGlvblRleHQsIHJlYWN0aW9uUHJvdmlkZXIsIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzLCBlbGVtZW50KSB7XG4gICAgdmFyIHBvcHVwV2luZG93O1xuICAgIHZhciByYWN0aXZlID0gUmFjdGl2ZSh7XG4gICAgICAgIGVsOiBlbGVtZW50LFxuICAgICAgICBhcHBlbmQ6IHRydWUsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIHRleHQ6IHJlYWN0aW9uVGV4dFxuICAgICAgICB9LFxuICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL2NvbmZpcm1hdGlvbi1wYWdlLmhicy5odG1sJyksXG4gICAgICAgIHBhcnRpYWxzOiB7XG4gICAgICAgICAgICBjb21tZW50QXJlYTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL2NvbW1lbnQtYXJlYS1wYXJ0aWFsLmhicy5odG1sJyksXG4gICAgICAgICAgICBmYWNlYm9va0ljb246IFNWR3MuZmFjZWJvb2ssXG4gICAgICAgICAgICB0d2l0dGVySWNvbjogU1ZHcy50d2l0dGVyXG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByYWN0aXZlLm9uKCdzaGFyZS1mYWNlYm9vaycsIHNoYXJlVG9GYWNlYm9vayk7XG4gICAgcmFjdGl2ZS5vbignc2hhcmUtdHdpdHRlcicsIHNoYXJlVG9Ud2l0dGVyKTtcbiAgICBDb21tZW50QXJlYVBhcnRpYWwuc2V0dXAocmVhY3Rpb25Qcm92aWRlciwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MsIG51bGwsIHJhY3RpdmUpO1xuICAgIHJldHVybiB7XG4gICAgICAgIHNlbGVjdG9yOiBwYWdlU2VsZWN0b3IsXG4gICAgICAgIHRlYXJkb3duOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNsb3NlU2hhcmVXaW5kb3coKTtcbiAgICAgICAgICAgIHJhY3RpdmUudGVhcmRvd24oKTtcbiAgICAgICAgfVxuICAgIH07XG5cblxuICAgIGZ1bmN0aW9uIHNoYXJlVG9GYWNlYm9vayhyYWN0aXZlRXZlbnQpIHtcbiAgICAgICAgcmFjdGl2ZUV2ZW50Lm9yaWdpbmFsLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHNoYXJlUmVhY3Rpb24oZnVuY3Rpb24ocmVhY3Rpb25EYXRhLCBzaG9ydFVybCkge1xuICAgICAgICAgICAgRXZlbnRzLnBvc3RSZWFjdGlvblNoYXJlZCgnZmFjZWJvb2snLCBwYWdlRGF0YSwgY29udGFpbmVyRGF0YSwgcmVhY3Rpb25EYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgIHZhciBzaGFyZVRleHQgPSBjb21wdXRlU2hhcmVUZXh0KHJlYWN0aW9uRGF0YSwgMzAwKTtcbiAgICAgICAgICAgIHZhciBpbWFnZVBhcmFtID0gJyc7XG4gICAgICAgICAgICBpZiAoY29udGFpbmVyRGF0YS50eXBlID09PSAnaW1hZ2UnKSB7XG4gICAgICAgICAgICAgICAgaW1hZ2VQYXJhbSA9ICcmcFtpbWFnZXNdWzBdPScgKyBlbmNvZGVVUkkocmVhY3Rpb25EYXRhLmNvbnRlbnQuYm9keSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gJ2h0dHA6Ly93d3cuZmFjZWJvb2suY29tL3NoYXJlci5waHA/cz0xMDAnICtcbiAgICAgICAgICAgICAgICAnJnBbdXJsXT0nICsgc2hvcnRVcmwgK1xuICAgICAgICAgICAgICAgICcmcFt0aXRsZV09JyArIGVuY29kZVVSSShzaGFyZVRleHQpICtcbiAgICAgICAgICAgICAgICAnJnBbc3VtbWFyeV09JyArIGVuY29kZVVSSShzaGFyZVRleHQpICtcbiAgICAgICAgICAgICAgICBpbWFnZVBhcmFtO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzaGFyZVRvVHdpdHRlcihyYWN0aXZlRXZlbnQpIHtcbiAgICAgICAgcmFjdGl2ZUV2ZW50Lm9yaWdpbmFsLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHNoYXJlUmVhY3Rpb24oZnVuY3Rpb24ocmVhY3Rpb25EYXRhLCBzaG9ydFVybCkge1xuICAgICAgICAgICAgRXZlbnRzLnBvc3RSZWFjdGlvblNoYXJlZCgndHdpdHRlcicsIHBhZ2VEYXRhLCBjb250YWluZXJEYXRhLCByZWFjdGlvbkRhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgdmFyIHNoYXJlVGV4dCA9IGNvbXB1dGVTaGFyZVRleHQocmVhY3Rpb25EYXRhLCAxMTApOyAvLyBNYWtlIHN1cmUgd2Ugc3RheSB1bmRlciB0aGUgMTQwIGNoYXIgbGltaXQgKHR3aXR0ZXIgYXBwZW5kcyBhZGRpdGlvbmFsIHRleHQgbGlrZSB0aGUgdXJsKVxuICAgICAgICAgICAgdmFyIHR3aXR0ZXJWaWEgPSBncm91cFNldHRpbmdzLnR3aXR0ZXJBY2NvdW50KCkgPyAnJnZpYT0nICsgZ3JvdXBTZXR0aW5ncy50d2l0dGVyQWNjb3VudCgpIDogJyc7XG4gICAgICAgICAgICByZXR1cm4gJ2h0dHA6Ly90d2l0dGVyLmNvbS9pbnRlbnQvdHdlZXQ/dXJsPScgKyBzaG9ydFVybCArIHR3aXR0ZXJWaWEgKyAnJnRleHQ9JyArIGVuY29kZVVSSShzaGFyZVRleHQpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzaGFyZVJlYWN0aW9uKGNvbXB1dGVXaW5kb3dMb2NhdGlvbikge1xuICAgICAgICBjbG9zZVNoYXJlV2luZG93KCk7XG4gICAgICAgIHJlYWN0aW9uUHJvdmlkZXIuZ2V0KGZ1bmN0aW9uKHJlYWN0aW9uRGF0YSkge1xuICAgICAgICAgICAgdmFyIHdpbmRvdyA9IG9wZW5TaGFyZVdpbmRvdygpO1xuICAgICAgICAgICAgaWYgKHdpbmRvdykge1xuICAgICAgICAgICAgICAgIEFqYXhDbGllbnQucG9zdFNoYXJlUmVhY3Rpb24ocmVhY3Rpb25EYXRhLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB1cmwgPSBjb21wdXRlV2luZG93TG9jYXRpb24ocmVhY3Rpb25EYXRhLCByZXNwb25zZS5zaG9ydF91cmwpO1xuICAgICAgICAgICAgICAgICAgICByZWRpcmVjdFNoYXJlV2luZG93KHVybCk7XG4gICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKG1lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJGYWlsZWQgdG8gc2hhcmUgcmVhY3Rpb246IFwiICsgbWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgICAgIGNsb3NlU2hhcmVXaW5kb3coKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogZW5nYWdlX2Z1bGw6OTgxOFxuICAgICAgICAgICAgICAgICAgICAvL2lmICggcmVzcG9uc2UubWVzc2FnZS5pbmRleE9mKCBcIlRlbXBvcmFyeSB1c2VyIGludGVyYWN0aW9uIGxpbWl0IHJlYWNoZWRcIiApICE9IC0xICkge1xuICAgICAgICAgICAgICAgICAgICAvLyAgICBBTlQuc2Vzc2lvbi5zaG93TG9naW5QYW5lbCggYXJncyApO1xuICAgICAgICAgICAgICAgICAgICAvL30gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vICAgIC8vIGlmIGl0IGZhaWxlZCwgc2VlIGlmIHdlIGNhbiBmaXggaXQsIGFuZCBpZiBzbywgdHJ5IHRoaXMgZnVuY3Rpb24gb25lIG1vcmUgdGltZVxuICAgICAgICAgICAgICAgICAgICAvLyAgICBBTlQuc2Vzc2lvbi5oYW5kbGVHZXRVc2VyRmFpbCggYXJncywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vICAgICAgICBBTlQuYWN0aW9ucy5zaGFyZV9nZXRMaW5rKCBhcmdzICk7XG4gICAgICAgICAgICAgICAgICAgIC8vICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAvL31cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY2xvc2VTaGFyZVdpbmRvdygpIHtcbiAgICAgICAgaWYgKHBvcHVwV2luZG93ICYmICFwb3B1cFdpbmRvdy5jbG9zZWQpIHtcbiAgICAgICAgICAgIHBvcHVwV2luZG93LmNsb3NlKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBvcGVuU2hhcmVXaW5kb3coKSB7XG4gICAgICAgIHBvcHVwV2luZG93ID0gd2luZG93Lm9wZW4oVVJMcy5hcHBTZXJ2ZXJVcmwoKSArIFVSTHMuc2hhcmVXaW5kb3dVcmwoKSwgJ2FudGVubmFfc2hhcmVfd2luZG93JywnbWVudWJhcj0xLHJlc2l6YWJsZT0xLHdpZHRoPTYyNixoZWlnaHQ9NDM2Jyk7XG4gICAgICAgIHJldHVybiBwb3B1cFdpbmRvdztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByZWRpcmVjdFNoYXJlV2luZG93KHVybCkge1xuICAgICAgICBpZiAocG9wdXBXaW5kb3cgJiYgIXBvcHVwV2luZG93LmNsb3NlZCkge1xuICAgICAgICAgICAgcG9wdXBXaW5kb3cubG9jYXRpb24gPSB1cmw7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjb21wdXRlU2hhcmVUZXh0KHJlYWN0aW9uRGF0YSwgbWF4VGV4dExlbmd0aCkge1xuICAgICAgICB2YXIgc2hhcmVUZXh0ID0gcmVhY3Rpb25EYXRhLnRleHQgKyBcIiDCuyBcIiArICcnO1xuICAgICAgICB2YXIgZ3JvdXBOYW1lID0gZ3JvdXBTZXR0aW5ncy5ncm91cE5hbWUoKTtcbiAgICAgICAgc3dpdGNoIChjb250YWluZXJEYXRhLnR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgJ2ltYWdlJzpcbiAgICAgICAgICAgICAgICBzaGFyZVRleHQgKz0gJ1thIHBpY3R1cmUgb24gJyArIGdyb3VwTmFtZSArICddIENoZWNrIGl0IG91dDogJztcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ21lZGlhJzpcbiAgICAgICAgICAgICAgICBzaGFyZVRleHQgKz0gJ1thIHZpZGVvIG9uICcgKyBncm91cE5hbWUgKyAnXSBDaGVjayBpdCBvdXQ6ICc7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdwYWdlJzpcbiAgICAgICAgICAgICAgICBzaGFyZVRleHQgKz0gJ1thbiBhcnRpY2xlIG9uICcgKyBncm91cE5hbWUgKyAnXSBDaGVjayBpdCBvdXQ6ICc7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICd0ZXh0JzpcbiAgICAgICAgICAgICAgICB2YXIgbWF4Qm9keUxlbmd0aCA9IG1heFRleHRMZW5ndGggLSBzaGFyZVRleHQubGVuZ3RoIC0gMjsgLy8gdGhlIGV4dHJhIDIgYWNjb3VudHMgZm9yIHRoZSBxdW90ZXMgd2UgYWRkXG4gICAgICAgICAgICAgICAgdmFyIHRleHRCb2R5ID0gcmVhY3Rpb25EYXRhLmNvbnRlbnQuYm9keTtcbiAgICAgICAgICAgICAgICB0ZXh0Qm9keSA9IHRleHRCb2R5Lmxlbmd0aCA+IG1heEJvZHlMZW5ndGggPyB0ZXh0Qm9keS5zdWJzdHJpbmcoMCwgbWF4Qm9keUxlbmd0aC0zKSArICcuLi4nIDogdGV4dEJvZHk7XG4gICAgICAgICAgICAgICAgc2hhcmVUZXh0ICs9ICdcIicgKyB0ZXh0Qm9keSArICdcIic7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNoYXJlVGV4dDtcbiAgICB9XG5cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZTogY3JlYXRlUGFnZVxufTsiLCJ2YXIgQWpheENsaWVudCA9IHJlcXVpcmUoJy4vdXRpbHMvYWpheC1jbGllbnQnKTtcbnZhciBVUkxzID0gcmVxdWlyZSgnLi91dGlscy91cmxzJyk7XG5cbnZhciBjb250ZW50RmV0Y2hUcmlnZ2VyU2l6ZSA9IDA7IC8vIFRoZSBzaXplIG9mIHRoZSBwb29sIGF0IHdoaWNoIHdlJ2xsIHByb2FjdGl2ZWx5IGZldGNoIG1vcmUgY29udGVudC5cbnZhciBmcmVzaENvbnRlbnRQb29sID0gW107XG52YXIgcGVuZGluZ0NhbGxiYWNrcyA9IFtdOyAvLyBUaGUgY2FsbGJhY2sgbW9kZWwgaW4gdGhpcyBtb2R1bGUgaXMgdW51c3VhbCBiZWNhdXNlIG9mIHRoZSB3YXkgY29udGVudCBpcyBzZXJ2ZWQgZnJvbSBhIHBvb2wuXG52YXIgcHJlZmV0Y2hlZEdyb3VwcyA9IHt9OyAvL1xuXG5mdW5jdGlvbiBwcmVmZXRjaElmTmVlZGVkKGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgZ3JvdXBJZCA9IGdyb3VwU2V0dGluZ3MuZ3JvdXBJZCgpO1xuICAgIGlmICghcHJlZmV0Y2hlZEdyb3Vwc1tncm91cElkXSkge1xuICAgICAgICBwcmVmZXRjaGVkR3JvdXBzW2dyb3VwSWRdID0gdHJ1ZTtcbiAgICAgICAgZmV0Y2hSZWNvbW1lbmRlZENvbnRlbnQoZ3JvdXBTZXR0aW5ncyk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBnZXRSZWNvbW1lbmRlZENvbnRlbnQoY291bnQsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzLCBjYWxsYmFjaykge1xuICAgIGNvbnRlbnRGZXRjaFRyaWdnZXJTaXplID0gTWF0aC5tYXgoY29udGVudEZldGNoVHJpZ2dlclNpemUsIGNvdW50KTsgLy8gVXBkYXRlIHRoZSB0cmlnZ2VyIHNpemUgdG8gdGhlIG1vc3Qgd2UndmUgYmVlbiBhc2tlZCBmb3IuXG4gICAgLy8gUXVldWUgdXAgdGhlIGNhbGxiYWNrIGFuZCB0cnkgdG8gc2VydmUuIElmIG1vcmUgY29udGVudCBpcyBuZWVkZWQsIGl0IHdpbGxcbiAgICAvLyBiZSBhdXRvbWF0aWNhbGx5IGZldGNoZWQuXG4gICAgcGVuZGluZ0NhbGxiYWNrcy5wdXNoKHsgY2FsbGJhY2s6IGNhbGxiYWNrLCBjb3VudDogY291bnQgfSk7XG4gICAgc2VydmVDb250ZW50KHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbn1cblxuZnVuY3Rpb24gZmV0Y2hSZWNvbW1lbmRlZENvbnRlbnQoZ3JvdXBTZXR0aW5ncywgY2FsbGJhY2spIHtcbiAgICBBamF4Q2xpZW50LmdldEpTT05QKFVSTHMuZmV0Y2hDb250ZW50UmVjb21tZW5kYXRpb25VcmwoKSwgeyBncm91cF9pZDogZ3JvdXBTZXR0aW5ncy5ncm91cElkKCl9ICwgZnVuY3Rpb24oanNvbkRhdGEpIHtcbiAgICAgICAgLy8gVXBkYXRlIHRoZSBmcmVzaCBjb250ZW50IHBvb2wgd2l0aCB0aGUgbmV3IGRhdGEuIEFwcGVuZCBhbnkgZXhpc3RpbmcgY29udGVudCB0byB0aGUgZW5kLCBzbyBpdCBpcyBwdWxsZWQgZmlyc3QuXG4gICAgICAgIHZhciBjb250ZW50RGF0YSA9IGpzb25EYXRhIHx8IFtdO1xuICAgICAgICBjb250ZW50RGF0YSA9IG1hc3NhZ2VDb250ZW50KGNvbnRlbnREYXRhKTtcbiAgICAgICAgdmFyIG5ld0FycmF5ID0gc2h1ZmZsZUFycmF5KGNvbnRlbnREYXRhKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBmcmVzaENvbnRlbnRQb29sLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBuZXdBcnJheS5wdXNoKGZyZXNoQ29udGVudFBvb2xbaV0pO1xuICAgICAgICB9XG4gICAgICAgIGZyZXNoQ29udGVudFBvb2wgPSBuZXdBcnJheTtcbiAgICAgICAgaWYgKGNhbGxiYWNrKSB7IGNhbGxiYWNrKGdyb3VwU2V0dGluZ3MpOyB9XG4gICAgfSwgZnVuY3Rpb24oZXJyb3JNZXNzYWdlKSB7XG4gICAgICAgIC8qIFRPRE86IEVycm9yIGhhbmRsaW5nICovXG4gICAgICAgIGNvbnNvbGUubG9nKCdBbiBlcnJvciBvY2N1cnJlZCBmZXRjaGluZyByZWNvbW1lbmRlZCBjb250ZW50OiAnICsgZXJyb3JNZXNzYWdlKTtcbiAgICB9KTtcbn1cblxuLy8gQXBwbHkgYW55IGNsaWVudC1zaWRlIGZpbHRlcmluZy9tb2RpZmljYXRpb25zIHRvIHRoZSBjb250ZW50IHJlYyBkYXRhLlxuZnVuY3Rpb24gbWFzc2FnZUNvbnRlbnQoY29udGVudERhdGEpIHtcbiAgICB2YXIgbWFzc2FnZWRDb250ZW50ID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb250ZW50RGF0YS5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgZGF0YSA9IGNvbnRlbnREYXRhW2ldO1xuICAgICAgICBpZiAoZGF0YS5jb250ZW50LnR5cGUgPT09ICdtZWRpYScpIHtcbiAgICAgICAgICAgIC8vIEZvciBub3csIHRoZSBvbmx5IHZpZGVvIHdlIGhhbmRsZSBpcyBZb3VUdWJlLCB3aGljaCBoYXMgYSBrbm93biBmb3JtYXRcbiAgICAgICAgICAgIC8vIGZvciBjb252ZXJ0aW5nIHZpZGVvIFVSTHMgaW50byBpbWFnZXMuXG4gICAgICAgICAgICB2YXIgeW91dHViZU1hdGNoZXIgPSAvXigoaHR0cHxodHRwcyk6KT9cXC9cXC8od3d3XFwuKT95b3V0dWJlXFwuY29tLiovO1xuICAgICAgICAgICAgaWYgKHlvdXR1YmVNYXRjaGVyLnRlc3QoZGF0YS5jb250ZW50LmJvZHkpKSB7IC8vIElzIHRoaXMgYSB5b3V0dWJlIFVSTD8gKHRoZSBJRCBtYXRjaGVyIGJlbG93IGRvZXNuJ3QgZ3VhcmFudGVlIHRoaXMpXG4gICAgICAgICAgICAgICAgLy8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8zNDUyNTQ2L2phdmFzY3JpcHQtcmVnZXgtaG93LXRvLWdldC15b3V0dWJlLXZpZGVvLWlkLWZyb20tdXJsLzI3NzI4NDE3IzI3NzI4NDE3XG4gICAgICAgICAgICAgICAgdmFyIHZpZGVvSURNYXRjaGVyID0gL14uKig/Oig/OnlvdXR1XFwuYmVcXC98dlxcL3x2aVxcL3x1XFwvXFx3XFwvfGVtYmVkXFwvKXwoPzooPzp3YXRjaCk/XFw/dig/OmkpPz18XFwmdig/OmkpPz0pKShbXiNcXCZcXD9dKikuKi87XG4gICAgICAgICAgICAgICAgdmFyIG1hdGNoID0gdmlkZW9JRE1hdGNoZXIuZXhlYyhkYXRhLmNvbnRlbnQuYm9keSk7XG4gICAgICAgICAgICAgICAgaWYgKG1hdGNoLmxlbmd0aCA9PT0gMikge1xuICAgICAgICAgICAgICAgICAgICAvLyBDb252ZXJ0IHRoZSBjb250ZW50IGludG8gYW4gaW1hZ2UuXG4gICAgICAgICAgICAgICAgICAgIGRhdGEuY29udGVudC5ib2R5ID0gJ2h0dHBzOi8vaW1nLnlvdXR1YmUuY29tL3ZpLycgKyBtYXRjaFsxXSArICcvbXFkZWZhdWx0LmpwZyc7IC8qIDE2OjkgcmF0aW8gdGh1bWJuYWlsLCBzbyB3ZSBnZXQgbm8gYmxhY2sgYmFycy4gKi9cbiAgICAgICAgICAgICAgICAgICAgZGF0YS5jb250ZW50LnR5cGUgPSAnaW1hZ2UnO1xuICAgICAgICAgICAgICAgICAgICBtYXNzYWdlZENvbnRlbnQucHVzaChkYXRhKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBtYXNzYWdlZENvbnRlbnQucHVzaChkYXRhKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbWFzc2FnZWRDb250ZW50O1xufVxuXG5mdW5jdGlvbiBzZXJ2ZUNvbnRlbnQocGFnZURhdGEsIGdyb3VwU2V0dGluZ3MsIHByZXZlbnRMb29wLypvbmx5IHVzZWQgcmVjdXJzaXZlbHkqLykge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGVuZGluZ0NhbGxiYWNrcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgZW50cnkgPSBwZW5kaW5nQ2FsbGJhY2tzW2ldO1xuICAgICAgICB2YXIgY2hvc2VuQ29udGVudCA9IFtdO1xuICAgICAgICB2YXIgdXJsc1RvQXZvaWQgPSBbIHBhZ2VEYXRhLmNhbm9uaWNhbFVybCBdO1xuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGVudHJ5LmNvdW50OyBqKyspIHtcbiAgICAgICAgICAgIHZhciBwcmVmZXJyZWRUeXBlID0gaiAlIDIgPT09IDAgPyAnaW1hZ2UnOid0ZXh0JztcbiAgICAgICAgICAgIHZhciBkYXRhID0gY2hvb3NlQ29udGVudChwcmVmZXJyZWRUeXBlLCB1cmxzVG9Bdm9pZCk7XG4gICAgICAgICAgICBpZiAoZGF0YSkge1xuICAgICAgICAgICAgICAgIGNob3NlbkNvbnRlbnQucHVzaChkYXRhKTtcbiAgICAgICAgICAgICAgICB1cmxzVG9Bdm9pZC5wdXNoKGRhdGEucGFnZS51cmwpOyAvLyBkb24ndCBsaW5rIHRvIHRoZSBzYW1lIHBhZ2UgdHdpY2VcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoY2hvc2VuQ29udGVudC5sZW5ndGggPj0gZW50cnkuY291bnQpIHtcbiAgICAgICAgICAgIGVudHJ5LmNhbGxiYWNrKGNob3NlbkNvbnRlbnQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKCFwcmV2ZW50TG9vcCkge1xuICAgICAgICAgICAgICAgIC8vIFJhbiBvdXQgb2YgY29udGVudC4gR28gZ2V0IG1vcmUuIFRoZSBcInByZXZlbnRMb29wXCIgZmxhZyB0ZWxscyB1cyB3aGV0aGVyXG4gICAgICAgICAgICAgICAgLy8gd2UndmUgYWxyZWFkeSB0cmllZCB0byBmZXRjaCBidXQgd2UganVzdCBoYXZlIG5vIGdvb2QgY29udGVudCB0byBjaG9vc2UuXG4gICAgICAgICAgICAgICAgZmV0Y2hSZWNvbW1lbmRlZENvbnRlbnQoZ3JvdXBTZXR0aW5ncywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlcnZlQ29udGVudChwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncywgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cbiAgICBwZW5kaW5nQ2FsbGJhY2tzID0gcGVuZGluZ0NhbGxiYWNrcy5zcGxpY2UoaSk7IC8vIFRyaW0gYW55IGNhbGxiYWNrcyB0aGF0IHdlIG5vdGlmaWVkLlxufVxuXG5mdW5jdGlvbiBjaG9vc2VDb250ZW50KHByZWZlcnJlZFR5cGUsIHVybHNUb0F2b2lkKSB7XG4gICAgdmFyIGFsdGVybmF0ZUluZGV4O1xuICAgIGZvciAodmFyIGkgPSBmcmVzaENvbnRlbnRQb29sLmxlbmd0aC0xOyBpID49IDA7IGktLSkge1xuICAgICAgICB2YXIgY29udGVudERhdGEgPSBmcmVzaENvbnRlbnRQb29sW2ldO1xuICAgICAgICBpZiAoIWFycmF5Q29udGFpbnModXJsc1RvQXZvaWQsIGNvbnRlbnREYXRhLnBhZ2UudXJsKSkge1xuICAgICAgICAgICAgaWYgKGNvbnRlbnREYXRhLmNvbnRlbnQudHlwZSA9PT0gcHJlZmVycmVkVHlwZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmcmVzaENvbnRlbnRQb29sLnNwbGljZShpLCAxKVswXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGFsdGVybmF0ZUluZGV4ID0gaTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAoYWx0ZXJuYXRlSW5kZXggIT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gZnJlc2hDb250ZW50UG9vbC5zcGxpY2UoYWx0ZXJuYXRlSW5kZXgsIDEpWzBdO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gYXJyYXlDb250YWlucyhhcnJheSwgZWxlbWVudCkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJyYXkubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGFycmF5W2ldID09PSBlbGVtZW50KSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG59XG5cbi8vIER1cnN0ZW5mZWxkIHNodWZmbGUgYWxnb3JpdGhtIGZyb206IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzEyNjQ2ODY0LzQxMzU0MzFcbmZ1bmN0aW9uIHNodWZmbGVBcnJheShhcnJheSkge1xuICAgIHZhciBjb3B5ID0gYXJyYXkuc2xpY2UoMCk7XG4gICAgZm9yICh2YXIgaSA9IGFycmF5Lmxlbmd0aCAtIDE7IGkgPiAwOyBpLS0pIHtcbiAgICAgICAgdmFyIGogPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAoaSArIDEpKTtcbiAgICAgICAgdmFyIHRlbXAgPSBjb3B5W2ldO1xuICAgICAgICBjb3B5W2ldID0gY29weVtqXTtcbiAgICAgICAgY29weVtqXSA9IHRlbXA7XG4gICAgfVxuICAgIHJldHVybiBjb3B5O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBwcmVmZXRjaElmTmVlZGVkOiBwcmVmZXRjaElmTmVlZGVkLFxuICAgIGdldFJlY29tbWVuZGVkQ29udGVudDogZ2V0UmVjb21tZW5kZWRDb250ZW50XG59OyIsInZhciBSYWN0aXZlOyByZXF1aXJlKCcuL3V0aWxzL3JhY3RpdmUtcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24obG9hZGVkUmFjdGl2ZSkgeyBSYWN0aXZlID0gbG9hZGVkUmFjdGl2ZTt9KTtcbnZhciBNZXNzYWdlcyA9IHJlcXVpcmUoJy4vdXRpbHMvbWVzc2FnZXMnKTtcbnZhciBUaHJvdHRsZWRFdmVudHMgPSByZXF1aXJlKCcuL3V0aWxzL3Rocm90dGxlZC1ldmVudHMnKTtcblxudmFyIENvbnRlbnRSZWNMb2FkZXIgPSByZXF1aXJlKCcuL2NvbnRlbnQtcmVjLWxvYWRlcicpO1xudmFyIEV2ZW50cyA9IHJlcXVpcmUoJy4vZXZlbnRzJyk7XG52YXIgU1ZHcyA9IHJlcXVpcmUoJy4vc3ZncycpO1xuXG5mdW5jdGlvbiBjcmVhdGVDb250ZW50UmVjKHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGNvbnRlbnRSZWNDb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBjb250ZW50UmVjQ29udGFpbmVyLmNsYXNzTmFtZSA9ICdhbnRlbm5hIGFudGVubmEtY29udGVudC1yZWMnO1xuICAgIC8vIFdlIGNhbid0IHJlYWxseSByZXF1ZXN0IGNvbnRlbnQgdW50aWwgdGhlIGZ1bGwgcGFnZSBkYXRhIGlzIGxvYWRlZCAoYmVjYXVzZSB3ZSBuZWVkIHRvIGtub3cgdGhlIHNlcnZlci1zaWRlIGNvbXB1dGVkXG4gICAgLy8gY2Fub25pY2FsIFVSTCksIGJ1dCB3ZSBjYW4gc3RhcnQgcHJlZmV0Y2hpbmcgdGhlIGNvbnRlbnQgcG9vbCBmb3IgdGhlIGdyb3VwLlxuICAgIENvbnRlbnRSZWNMb2FkZXIucHJlZmV0Y2hJZk5lZWRlZChncm91cFNldHRpbmdzKTtcbiAgICB2YXIgbnVtRW50cmllcyA9IDI7XG4gICAgdmFyIGNvbnRlbnREYXRhID0geyBlbnRyaWVzOiB1bmRlZmluZWQgfTsgLy8gTmVlZCB0byBzdHViIG91dCB0aGUgZGF0YSBzbyBSYWN0aXZlIGNhbiBiaW5kIHRvIGl0XG4gICAgdmFyIHJhY3RpdmUgPSBSYWN0aXZlKHtcbiAgICAgICAgZWw6IGNvbnRlbnRSZWNDb250YWluZXIsXG4gICAgICAgIG1hZ2ljOiB0cnVlLFxuICAgICAgICBhcHBlbmQ6IHRydWUsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIHRpdGxlOiBncm91cFNldHRpbmdzLmNvbnRlbnRSZWNUaXRsZSgpIHx8IE1lc3NhZ2VzLmdldE1lc3NhZ2UoJ2NvbnRlbnRfcmVjX3dpZGdldF9fdGl0bGUnKSxcbiAgICAgICAgICAgIHBhZ2VEYXRhOiBwYWdlRGF0YSxcbiAgICAgICAgICAgIGNvbnRlbnREYXRhOiBjb250ZW50RGF0YSxcbiAgICAgICAgICAgIHBvcHVsYXRlQ29udGVudEVudHJpZXM6IHBvcHVsYXRlQ29udGVudEVudHJpZXMobnVtRW50cmllcywgY29udGVudERhdGEsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKSxcbiAgICAgICAgICAgIGNvbG9yczogcGlja0NvbG9ycyhudW1FbnRyaWVzLCBncm91cFNldHRpbmdzKVxuICAgICAgICB9LFxuICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL2NvbnRlbnQtcmVjLXdpZGdldC5oYnMuaHRtbCcpLFxuICAgICAgICBwYXJ0aWFsczoge1xuICAgICAgICAgICAgbG9nbzogU1ZHcy5sb2dvXG4gICAgICAgIH0sXG4gICAgICAgIGRlY29yYXRvcnM6IHtcbiAgICAgICAgICAgICdyZW5kZXJ0ZXh0JzogcmVuZGVyVGV4dFxuICAgICAgICB9XG4gICAgfSk7XG4gICAgc2V0dXBOYXZpZ2F0aW9uSGFuZGxlcigpO1xuICAgIHNldHVwVmlzaWJpbGl0eUhhbmRsZXIoKTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIGVsZW1lbnQ6IGNvbnRlbnRSZWNDb250YWluZXIsXG4gICAgICAgIHRlYXJkb3duOiBmdW5jdGlvbigpIHsgcmFjdGl2ZS50ZWFyZG93bigpOyB9XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIHNldHVwTmF2aWdhdGlvbkhhbmRsZXIoKSB7XG4gICAgICAgIHZhciBwZW5kaW5nTmF2aWdhdGlvbiA9IGZhbHNlO1xuICAgICAgICByYWN0aXZlLm9uKCduYXZpZ2F0ZScsIGZ1bmN0aW9uKHJhY3RpdmVFdmVudCkge1xuICAgICAgICAgICAgaWYgKCFwZW5kaW5nTmF2aWdhdGlvbikge1xuICAgICAgICAgICAgICAgIHBlbmRpbmdOYXZpZ2F0aW9uID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB2YXIgdGFyZ2V0VXJsID0gcmFjdGl2ZUV2ZW50LmNvbnRleHQucGFnZS51cmw7XG4gICAgICAgICAgICAgICAgdmFyIGNvbnRlbnRJZCA9IHJhY3RpdmVFdmVudC5jb250ZXh0LmNvbnRlbnQuaWQ7XG4gICAgICAgICAgICAgICAgRXZlbnRzLnBvc3RDb250ZW50UmVjQ2xpY2tlZChwYWdlRGF0YSwgdGFyZ2V0VXJsLCBjb250ZW50SWQsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IC8vIEdpdmUgdGhlIGV2ZW50IHNvbWUgdGltZSB0byBwb3N0LlxuICAgICAgICAgICAgICAgICAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9IHRhcmdldFVybDtcbiAgICAgICAgICAgICAgICB9LCAxMDApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzZXR1cFZpc2liaWxpdHlIYW5kbGVyKCkge1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy8gV2hlbiBjb250ZW50IHJlYyBsb2FkcywgZ2l2ZSBpdCBhIG1vbWVudCBhbmQgdGhlbiBzZWUgaWYgd2UncmVcbiAgICAgICAgICAgIC8vIHZpc2libGUuIElmIG5vdCwgc3RhcnQgdHJhY2tpbmcgc2Nyb2xsIGV2ZW50cy5cbiAgICAgICAgICAgIGlmIChpc0NvbnRlbnRSZWNWaXNpYmxlKCkpIHtcbiAgICAgICAgICAgICAgICBFdmVudHMucG9zdENvbnRlbnRSZWNWaXNpYmxlKHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgVGhyb3R0bGVkRXZlbnRzLm9uKCdzY3JvbGwnLCBoYW5kbGVTY3JvbGxFdmVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIDIwMCk7XG5cbiAgICAgICAgZnVuY3Rpb24gaGFuZGxlU2Nyb2xsRXZlbnQoKSB7XG4gICAgICAgICAgICBpZiAoaXNDb250ZW50UmVjVmlzaWJsZSgpKSB7XG4gICAgICAgICAgICAgICAgRXZlbnRzLnBvc3RDb250ZW50UmVjVmlzaWJsZShwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICAgICAgVGhyb3R0bGVkRXZlbnRzLm9mZignc2Nyb2xsJywgaGFuZGxlU2Nyb2xsRXZlbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNDb250ZW50UmVjVmlzaWJsZSgpIHtcbiAgICAgICAgLy8gQmVjYXVzZSB0aGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCBvbiBzY3JvbGwsIHdlIHRyeSB0byBhdm9pZCB1bm5lY2Vzc2FyeVxuICAgICAgICAvLyBjb21wdXRhdGlvbiBhcyBtdWNoIGFzIHBvc3NpYmxlIGhlcmUsIGJhaWxpbmcgb3V0IGFzIGVhcmx5IGFzIHBvc3NpYmxlLlxuICAgICAgICAvLyBGaXJzdCwgY2hlY2sgd2hldGhlciB3ZSBldmVuIGhhdmUgcGFnZSBkYXRhLlxuICAgICAgICBpZiAocGFnZURhdGEuc3VtbWFyeUxvYWRlZCkge1xuICAgICAgICAgICAgLy8gVGhlbiBjaGVjayBpZiB0aGUgb3V0ZXIgY29udGVudCByZWMgaXMgaW4gdGhlIHZpZXdwb3J0IGF0IGFsbC5cbiAgICAgICAgICAgIHZhciBjb250ZW50Qm94ID0gY29udGVudFJlY0NvbnRhaW5lci5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgICAgIHZhciB2aWV3cG9ydEJvdHRvbSA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRIZWlnaHQ7XG4gICAgICAgICAgICBpZiAoY29udGVudEJveC50b3AgPiAwICYmIGNvbnRlbnRCb3gudG9wIDwgdmlld3BvcnRCb3R0b20gfHxcbiAgICAgICAgICAgICAgICBjb250ZW50Qm94LmJvdHRvbSA+IDAgJiYgY29udGVudEJveC5ib3R0b20gPCB2aWV3cG9ydEJvdHRvbSkge1xuICAgICAgICAgICAgICAgIC8vIEZpbmFsbHksIGxvb2sgdG8gc2VlIHdoZXRoZXIgYW55IHJlY29tbWVuZGVkIGNvbnRlbnQgaGFzIGJlZW5cbiAgICAgICAgICAgICAgICAvLyByZW5kZXJlZCBvbnRvIHRoZSBwYWdlIGFuZCBpcyBvbiBzY3JlZW4gZW5vdWdoIHRvIGJlIGNvbnNpZGVyZWRcbiAgICAgICAgICAgICAgICAvLyB2aXNpYmxlLlxuICAgICAgICAgICAgICAgIHZhciBlbnRyaWVzID0gcmFjdGl2ZS5maW5kQWxsKCcuYW50ZW5uYS1jb250ZW50cmVjLWVudHJ5Jyk7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBlbnRyaWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBlbnRyeSA9IGVudHJpZXNbaV07XG4gICAgICAgICAgICAgICAgICAgIHZhciBlbnRyeUJveCA9IGVudHJ5LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZW50cnlCb3gudG9wID4gMCAmJiBlbnRyeUJveC5ib3R0b20gPCB2aWV3cG9ydEJvdHRvbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVGhlIGVudHJ5IGlzIGZ1bGx5IHZpc2libGVcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG59XG5cbi8vIFRoaXMgZnVuY3Rpb24gaXMgdHJpZ2dlcmVkIGZyb20gd2l0aGluIHRoZSBSYWN0aXZlIHRlbXBsYXRlIHdoZW4gdGhlIHBhZ2UgZGF0YSBpcyBsb2FkZWQuIE9uY2UgcGFnZSBkYXRhIGlzIGxvYWRlZCxcbi8vIHdlJ3JlIHJlYWR5IHRvIGFzayBmb3IgY29udGVudC5cbmZ1bmN0aW9uIHBvcHVsYXRlQ29udGVudEVudHJpZXMobnVtRW50cmllcywgY29udGVudERhdGEsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHBhZ2VEYXRhSXNMb2FkZWQpIHtcbiAgICAgICAgaWYgKHBhZ2VEYXRhSXNMb2FkZWQgJiYgIWNvbnRlbnREYXRhLmVudHJpZXMpIHtcbiAgICAgICAgICAgIC8vIFNpbmNlIHRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkIGJ5IFJhY3RpdmUgd2hlbiBwYWdlRGF0YS5zdW1tYXJ5TG9hZGVkIGNoYW5nZXMgYW5kIGl0IGNhbiBwb3RlbnRpYWxseVxuICAgICAgICAgICAgLy8gKnRyaWdnZXIqIGEgUmFjdGl2ZSB1cGRhdGUgKGlmIGNvbnRlbnQgZGF0YSBpcyByZWFkeSB0byBiZSBzZXJ2ZWQsIHdlIG1vZGlmeSBjb250ZW50RGF0YS5lbnRyaWVzKSxcbiAgICAgICAgICAgIC8vIHdlIG5lZWQgdG8gd3JhcCBpbiBhIHRpbWVvdXQgc28gdGhhdCB0aGUgZmlyc3QgUmFjdGl2ZSB1cGRhdGUgY2FuIGNvbXBsZXRlIGJlZm9yZSB3ZSB0cmlnZ2VyIGFub3RoZXIuXG4gICAgICAgICAgICAvLyBPdGhlcndpc2UsIFJhY3RpdmUgYmFpbHMgb3V0IGJlY2F1c2UgaXQgdGhpbmtzIHdlJ3JlIHRyaWdnZXJpbmcgYW4gaW5maW5pdGUgdXBkYXRlIGxvb3AuXG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIENvbnRlbnRSZWNMb2FkZXIuZ2V0UmVjb21tZW5kZWRDb250ZW50KG51bUVudHJpZXMsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzLCBmdW5jdGlvbiAoZmV0Y2hlZENvbnRlbnRFbnRyaWVzKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnREYXRhLmVudHJpZXMgPSBmZXRjaGVkQ29udGVudEVudHJpZXM7XG4gICAgICAgICAgICAgICAgICAgIEV2ZW50cy5wb3N0Q29udGVudFJlY0xvYWRlZChwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcGFnZURhdGFJc0xvYWRlZDtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHJlbmRlclRleHQobm9kZSkge1xuICAgIHZhciB0ZXh0ID0gY3JvcElmTmVlZGVkKG5vZGUpO1xuICAgIGlmICh0ZXh0Lmxlbmd0aCAhPT0gbm9kZS5pbm5lckhUTUwubGVuZ3RoKSB7XG4gICAgICAgIHRleHQgKz0gJy4uLic7XG4gICAgfVxuICAgIHRleHQgPSBhcHBseUJvbGRpbmcodGV4dCk7XG4gICAgaWYgKHRleHQubGVuZ3RoICE9PSBub2RlLmlubmVySFRNTC5sZW5ndGgpIHtcbiAgICAgICAgbm9kZS5pbm5lckhUTUwgPSB0ZXh0O1xuICAgICAgICAvLyBDaGVjayBhZ2FpbiwganVzdCB0byBtYWtlIHN1cmUgdGhlIHRleHQgZml0cyBhZnRlciBib2xkaW5nLlxuICAgICAgICB0ZXh0ID0gY3JvcElmTmVlZGVkKG5vZGUpO1xuICAgICAgICBpZiAodGV4dC5sZW5ndGggIT09IG5vZGUuaW5uZXJIVE1MLmxlbmd0aCkgeyAvL1xuICAgICAgICAgICAgbm9kZS5pbm5lckhUTUwgPSB0ZXh0ICsgJy4uLic7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4geyB0ZWFyZG93bjogZnVuY3Rpb24oKSB7fSB9O1xuXG4gICAgZnVuY3Rpb24gY3JvcElmTmVlZGVkKG5vZGUpIHtcbiAgICAgICAgdmFyIHRleHQgPSBub2RlLmlubmVySFRNTDtcbiAgICAgICAgdmFyIHJhdGlvID0gbm9kZS5jbGllbnRIZWlnaHQgLyBub2RlLnNjcm9sbEhlaWdodDtcbiAgICAgICAgaWYgKHJhdGlvIDwgMSkgeyAvLyBJZiB0aGUgdGV4dCBpcyBsYXJnZXIgdGhhbiB0aGUgY2xpZW50IGFyZWEsIGNyb3AgdGhlIHRleHQuXG4gICAgICAgICAgICB2YXIgY3JvcFdvcmRCcmVhayA9IHRleHQubGFzdEluZGV4T2YoJyAnLCB0ZXh0Lmxlbmd0aCAqIHJhdGlvIC0gMyk7IC8vIGFjY291bnQgZm9yIHRoZSAnLi4uJyB0aGF0IHdlJ2xsIGFkZFxuICAgICAgICAgICAgdGV4dCA9IHRleHQuc3Vic3RyaW5nKDAsIGNyb3BXb3JkQnJlYWspO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0ZXh0O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGFwcGx5Qm9sZGluZyh0ZXh0KSB7XG4gICAgICAgIHZhciBib2xkU3RhcnRQb2ludCA9IE1hdGguZmxvb3IodGV4dC5sZW5ndGggKiAuMjUpO1xuICAgICAgICB2YXIgYm9sZEVuZFBvaW50ID0gTWF0aC5mbG9vcih0ZXh0Lmxlbmd0aCAqLjY2KTtcbiAgICAgICAgdmFyIG1hdGNoZXMgPSB0ZXh0LnN1YnN0cmluZyhib2xkU3RhcnRQb2ludCwgYm9sZEVuZFBvaW50KS5tYXRjaCgvLHxcXC58XFw/fFwiL2dpKTtcbiAgICAgICAgaWYgKG1hdGNoZXMpIHtcbiAgICAgICAgICAgIHZhciBib2xkUG9pbnQgPSB0ZXh0Lmxhc3RJbmRleE9mKG1hdGNoZXNbbWF0Y2hlcy5sZW5ndGggLSAxXSwgYm9sZEVuZFBvaW50KTtcbiAgICAgICAgICAgIHRleHQgPSAnPHN0cm9uZz4nICsgdGV4dC5zdWJzdHJpbmcoMCwgYm9sZFBvaW50KSArICc8L3N0cm9uZz4nICsgdGV4dC5zdWJzdHJpbmcoYm9sZFBvaW50KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGV4dDtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHBpY2tDb2xvcnMoY291bnQsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgY29sb3JQYWxsZXRlID0gWyAvLyBUT0RPOiBnZXQgdGhpcyBmcm9tIGdyb3Vwc2V0dGluZ3NcbiAgICAgICAgeyBiYWNrZ3JvdW5kOiAnIzQxZTdkMCcsIGZvcmVncm91bmQ6ICcjRkZGRkZGJyB9LFxuICAgICAgICB7IGJhY2tncm91bmQ6ICcjODZiYmZkJywgZm9yZWdyb3VuZDogJyNGRkZGRkYnIH0sXG4gICAgICAgIHsgYmFja2dyb3VuZDogJyNGRjY2NjYnLCBmb3JlZ3JvdW5kOiAnI0ZGRkZGRicgfVxuICAgICAgICAvLyB7IGJhY2tncm91bmQ6ICcjOTc5Nzk3JywgZm9yZWdyb3VuZDogJyNGRkZGRkYnIH1cbiAgICBdO1xuICAgIHZhciBjb2xvcnMgPSBzaHVmZmxlQXJyYXkoY29sb3JQYWxsZXRlKTsgLy8gc2h1ZmZsZUFycmF5KGdyb3VwU2V0dGluZ3Mud2hhdGV2ZXIoKSlcbiAgICBpZiAoY291bnQgPCBjb2xvcnMubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBjb2xvcnMuc2xpY2UoMCwgY291bnQpO1xuICAgIH0gZWxzZSB7IC8vIElmIHdlJ3JlIGFza2luZyBmb3IgbW9yZSBjb2xvcnMgdGhhbiB3ZSBoYXZlLCBqdXN0IHJlcGVhdCB0aGUgc2FtZSBjb2xvcnMgYXMgbmVjZXNzYXJ5LlxuICAgICAgICB2YXIgb3V0cHV0ID0gW107XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xuICAgICAgICAgICAgb3V0cHV0LnB1c2goY29sb3JzW2klY29sb3JzLmxlbmd0aF0pO1xuICAgICAgICB9XG4gICAgfVxufVxuXG4vLyBEdXJzdGVuZmVsZCBzaHVmZmxlIGFsZ29yaXRobSBmcm9tOiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8xMjY0Njg2NC80MTM1NDMxXG5mdW5jdGlvbiBzaHVmZmxlQXJyYXkoYXJyYXkpIHtcbiAgICB2YXIgY29weSA9IGFycmF5LnNsaWNlKDApO1xuICAgIGZvciAodmFyIGkgPSBhcnJheS5sZW5ndGggLSAxOyBpID4gMDsgaS0tKSB7XG4gICAgICAgIHZhciBqID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKGkgKyAxKSk7XG4gICAgICAgIHZhciB0ZW1wID0gY29weVtpXTtcbiAgICAgICAgY29weVtpXSA9IGNvcHlbal07XG4gICAgICAgIGNvcHlbal0gPSB0ZW1wO1xuICAgIH1cbiAgICByZXR1cm4gY29weTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlQ29udGVudFJlYzogY3JlYXRlQ29udGVudFJlY1xufTsiLCJ2YXIgQXBwTW9kZSA9IHJlcXVpcmUoJy4vdXRpbHMvYXBwLW1vZGUnKTtcbnZhciBVUkxzID0gcmVxdWlyZSgnLi91dGlscy91cmxzJyk7XG5cbmZ1bmN0aW9uIGxvYWRDc3MoKSB7XG4gICAgLy8gVG8gbWFrZSBzdXJlIG5vbmUgb2Ygb3VyIGNvbnRlbnQgcmVuZGVycyBvbiB0aGUgcGFnZSBiZWZvcmUgb3VyIENTUyBpcyBsb2FkZWQsIHdlIGFwcGVuZCBhIHNpbXBsZSBpbmxpbmUgc3R5bGVcbiAgICAvLyBlbGVtZW50IHRoYXQgdHVybnMgb2ZmIG91ciBlbGVtZW50cyAqYmVmb3JlKiBvdXIgQ1NTIGxpbmtzLiBUaGlzIGV4cGxvaXRzIHRoZSBjYXNjYWRlIHJ1bGVzIC0gb3VyIENTUyBmaWxlcyBhcHBlYXJcbiAgICAvLyBhZnRlciB0aGUgaW5saW5lIHN0eWxlIGluIHRoZSBkb2N1bWVudCwgc28gdGhleSB0YWtlIHByZWNlZGVuY2UgKGFuZCBtYWtlIGV2ZXJ5dGhpbmcgYXBwZWFyKSBvbmNlIHRoZXkncmUgbG9hZGVkLlxuICAgIGluamVjdENzcygnLmFudGVubmF7ZGlzcGxheTpub25lO30nKTtcbiAgICB2YXIgY3NzSHJlZiA9IFVSTHMuYW1hem9uUzNVcmwoKSArICcvd2lkZ2V0LW5ldy9hbnRlbm5hLmNzcz92PTEnO1xuICAgIGlmIChBcHBNb2RlLm9mZmxpbmUpIHtcbiAgICAgICAgY3NzSHJlZiA9IFVSTHMuYXBwU2VydmVyVXJsKCkgKyAnL3N0YXRpYy93aWRnZXQtbmV3L2FudGVubmEuY3NzJztcbiAgICB9XG4gICAgbG9hZEZpbGUoY3NzSHJlZik7XG59XG5cbmZ1bmN0aW9uIGxvYWRGaWxlKGhyZWYpIHtcbiAgICB2YXIgbGlua1RhZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpbmsnKTtcbiAgICBsaW5rVGFnLnNldEF0dHJpYnV0ZSgnaHJlZicsIGhyZWYpO1xuICAgIGxpbmtUYWcuc2V0QXR0cmlidXRlKCdyZWwnLCAnc3R5bGVzaGVldCcpO1xuICAgIGxpbmtUYWcuc2V0QXR0cmlidXRlKCd0eXBlJywgJ3RleHQvY3NzJyk7XG4gICAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChsaW5rVGFnKTtcbn1cblxuZnVuY3Rpb24gaW5qZWN0Q3NzKGNzc1N0cmluZykge1xuICAgIHZhciBzdHlsZVRhZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XG4gICAgc3R5bGVUYWcuc2V0QXR0cmlidXRlKCd0eXBlJywgJ3RleHQvY3NzJyk7XG4gICAgc3R5bGVUYWcuaW5uZXJIVE1MID0gY3NzU3RyaW5nO1xuICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc3R5bGVUYWcpO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgbG9hZCA6IGxvYWRDc3MsXG4gICAgaW5qZWN0OiBpbmplY3RDc3Ncbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgQWpheENsaWVudCA9IHJlcXVpcmUoJy4vdXRpbHMvYWpheC1jbGllbnQnKTtcbnZhciBSYWN0aXZlOyByZXF1aXJlKCcuL3V0aWxzL3JhY3RpdmUtcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24obG9hZGVkUmFjdGl2ZSkgeyBSYWN0aXZlID0gbG9hZGVkUmFjdGl2ZTt9KTtcbnZhciBSZWFjdGlvbnNXaWRnZXRMYXlvdXRVdGlscyA9IHJlcXVpcmUoJy4vdXRpbHMvcmVhY3Rpb25zLXdpZGdldC1sYXlvdXQtdXRpbHMnKTtcblxudmFyIEV2ZW50cyA9IHJlcXVpcmUoJy4vZXZlbnRzJyk7XG52YXIgUGFnZURhdGEgPSByZXF1aXJlKCcuL3BhZ2UtZGF0YScpO1xuXG52YXIgcGFnZVNlbGVjdG9yID0gJy5hbnRlbm5hLWRlZmF1bHRzLXBhZ2UnO1xuXG5mdW5jdGlvbiBjcmVhdGVQYWdlKG9wdGlvbnMpIHtcbiAgICB2YXIgZGVmYXVsdFJlYWN0aW9ucyA9IG9wdGlvbnMuZGVmYXVsdFJlYWN0aW9ucztcbiAgICB2YXIgY29udGFpbmVyRGF0YSA9IG9wdGlvbnMuY29udGFpbmVyRGF0YTtcbiAgICB2YXIgcGFnZURhdGEgPSBvcHRpb25zLnBhZ2VEYXRhO1xuICAgIHZhciBncm91cFNldHRpbmdzID0gb3B0aW9ucy5ncm91cFNldHRpbmdzO1xuICAgIHZhciBjb250ZW50RGF0YSA9IG9wdGlvbnMuY29udGVudERhdGE7XG4gICAgdmFyIHNob3dDb25maXJtYXRpb24gPSBvcHRpb25zLnNob3dDb25maXJtYXRpb247XG4gICAgdmFyIHNob3dQZW5kaW5nQXBwcm92YWwgPSBvcHRpb25zLnNob3dQZW5kaW5nQXBwcm92YWw7XG4gICAgdmFyIHNob3dQcm9ncmVzcyA9IG9wdGlvbnMuc2hvd1Byb2dyZXNzO1xuICAgIHZhciBoYW5kbGVSZWFjdGlvbkVycm9yID0gb3B0aW9ucy5oYW5kbGVSZWFjdGlvbkVycm9yO1xuICAgIHZhciBlbGVtZW50ID0gb3B0aW9ucy5lbGVtZW50O1xuICAgIHZhciBkZWZhdWx0TGF5b3V0RGF0YSA9IFJlYWN0aW9uc1dpZGdldExheW91dFV0aWxzLmNvbXB1dGVMYXlvdXREYXRhKGRlZmF1bHRSZWFjdGlvbnMpO1xuICAgIHZhciAkcmVhY3Rpb25zV2luZG93ID0gJChvcHRpb25zLnJlYWN0aW9uc1dpbmRvdyk7XG4gICAgdmFyIHJhY3RpdmUgPSBSYWN0aXZlKHtcbiAgICAgICAgZWw6IGVsZW1lbnQsXG4gICAgICAgIGFwcGVuZDogdHJ1ZSxcbiAgICAgICAgdGVtcGxhdGU6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9kZWZhdWx0cy1wYWdlLmhicy5odG1sJyksXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIGRlZmF1bHRSZWFjdGlvbnM6IGRlZmF1bHRSZWFjdGlvbnMsXG4gICAgICAgICAgICBkZWZhdWx0TGF5b3V0Q2xhc3M6IGFycmF5QWNjZXNzb3IoZGVmYXVsdExheW91dERhdGEubGF5b3V0Q2xhc3NlcylcbiAgICAgICAgfSxcbiAgICAgICAgZGVjb3JhdG9yczoge1xuICAgICAgICAgICAgc2l6ZXRvZml0OiBSZWFjdGlvbnNXaWRnZXRMYXlvdXRVdGlscy5zaXplVG9GaXQoJHJlYWN0aW9uc1dpbmRvdylcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmFjdGl2ZS5vbignbmV3cmVhY3Rpb24nLCBuZXdEZWZhdWx0UmVhY3Rpb24pO1xuICAgIHJhY3RpdmUub24oJ25ld2N1c3RvbScsIG5ld0N1c3RvbVJlYWN0aW9uKTtcbiAgICByYWN0aXZlLm9uKCdjdXN0b21mb2N1cycsIGN1c3RvbVJlYWN0aW9uRm9jdXMpO1xuICAgIHJhY3RpdmUub24oJ2N1c3RvbWJsdXInLCBjdXN0b21SZWFjdGlvbkJsdXIpO1xuICAgIHJhY3RpdmUub24oJ3BhZ2VrZXlkb3duJywga2V5Ym9hcmRJbnB1dCk7XG4gICAgcmFjdGl2ZS5vbignaW5wdXRrZXlkb3duJywgY3VzdG9tUmVhY3Rpb25JbnB1dCk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBzZWxlY3RvcjogcGFnZVNlbGVjdG9yLFxuICAgICAgICB0ZWFyZG93bjogZnVuY3Rpb24oKSB7IHJhY3RpdmUudGVhcmRvd24oKTsgfVxuICAgIH07XG5cbiAgICBmdW5jdGlvbiBjdXN0b21SZWFjdGlvbklucHV0KHJhY3RpdmVFdmVudCkge1xuICAgICAgICB2YXIgZXZlbnQgPSByYWN0aXZlRXZlbnQub3JpZ2luYWw7XG4gICAgICAgIHZhciBrZXkgPSAoZXZlbnQud2hpY2ggIT09IHVuZGVmaW5lZCkgPyBldmVudC53aGljaCA6IGV2ZW50LmtleUNvZGU7XG4gICAgICAgIGlmIChrZXkgPT0gMTMpIHsgLy8gRW50ZXJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IC8vIGxldCB0aGUgcHJvY2Vzc2luZyBvZiB0aGUga2V5Ym9hcmQgZXZlbnQgZmluaXNoIGJlZm9yZSB3ZSBzaG93IHRoZSBwYWdlIChvdGhlcndpc2UsIHRoZSBjb25maXJtYXRpb24gcGFnZSBhbHNvIHJlY2VpdmVzIHRoZSBrZXlzdHJva2UpXG4gICAgICAgICAgICAgICAgbmV3Q3VzdG9tUmVhY3Rpb24oKTtcbiAgICAgICAgICAgIH0sIDApO1xuICAgICAgICB9IGVsc2UgaWYgKGtleSA9PSAyNykgeyAvLyBFc2NhcGVcbiAgICAgICAgICAgIGV2ZW50LnRhcmdldC52YWx1ZSA9ICcnO1xuICAgICAgICAgICAgcm9vdEVsZW1lbnQocmFjdGl2ZSkuZm9jdXMoKTtcbiAgICAgICAgfVxuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBuZXdEZWZhdWx0UmVhY3Rpb24ocmFjdGl2ZUV2ZW50KSB7XG4gICAgICAgIHZhciByZWFjdGlvbkRhdGEgPSByYWN0aXZlRXZlbnQuY29udGV4dDtcbiAgICAgICAgdmFyIHJlYWN0aW9uUHJvdmlkZXIgPSBjcmVhdGVSZWFjdGlvblByb3ZpZGVyKCk7XG4gICAgICAgIHNob3dDb25maXJtYXRpb24ocmVhY3Rpb25EYXRhLCByZWFjdGlvblByb3ZpZGVyKTsgLy8gT3B0aW1pc3RpY2FsbHkgc2hvdyBjb25maXJtYXRpb24gZm9yIGRlZmF1bHQgcmVhY3Rpb25zIGJlY2F1c2UgdGhleSBzaG91bGQgYWx3YXlzIGJlIGFjY2VwdGVkLlxuICAgICAgICBBamF4Q2xpZW50LnBvc3ROZXdSZWFjdGlvbihyZWFjdGlvbkRhdGEsIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBjb250ZW50RGF0YSwgc3VjY2VzcywgZXJyb3IpO1xuXG4gICAgICAgIGZ1bmN0aW9uIHN1Y2Nlc3MocmVhY3Rpb24pIHtcbiAgICAgICAgICAgIHJlYWN0aW9uID0gUGFnZURhdGEucmVnaXN0ZXJSZWFjdGlvbihyZWFjdGlvbiwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEpO1xuICAgICAgICAgICAgcmVhY3Rpb25Qcm92aWRlci5yZWFjdGlvbkxvYWRlZChyZWFjdGlvbik7XG4gICAgICAgICAgICBFdmVudHMucG9zdFJlYWN0aW9uQ3JlYXRlZChwYWdlRGF0YSwgY29udGFpbmVyRGF0YSwgcmVhY3Rpb24sIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZXJyb3IobWVzc2FnZSkge1xuICAgICAgICAgICAgdmFyIHJldHJ5ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgQWpheENsaWVudC5wb3N0TmV3UmVhY3Rpb24ocmVhY3Rpb25EYXRhLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgY29udGVudERhdGEsIHN1Y2Nlc3MsIGVycm9yKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBoYW5kbGVSZWFjdGlvbkVycm9yKG1lc3NhZ2UsIHJldHJ5LCBwYWdlU2VsZWN0b3IpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbmV3Q3VzdG9tUmVhY3Rpb24oKSB7XG4gICAgICAgIHZhciBpbnB1dCA9IHJhY3RpdmUuZmluZCgnLmFudGVubmEtZGVmYXVsdHMtZm9vdGVyIGlucHV0Jyk7XG4gICAgICAgIHZhciBib2R5ID0gaW5wdXQudmFsdWUudHJpbSgpO1xuICAgICAgICBpZiAoYm9keSAhPT0gJycpIHtcbiAgICAgICAgICAgIHNob3dQcm9ncmVzcygpOyAvLyBTaG93IHByb2dyZXNzIGZvciBjdXN0b20gcmVhY3Rpb25zIGJlY2F1c2UgdGhlIHNlcnZlciBtaWdodCByZWplY3QgdGhlbSBmb3IgYSBudW1iZXIgb2YgcmVhc29uc1xuICAgICAgICAgICAgdmFyIHJlYWN0aW9uRGF0YSA9IHsgdGV4dDogYm9keSB9O1xuICAgICAgICAgICAgdmFyIHJlYWN0aW9uUHJvdmlkZXIgPSBjcmVhdGVSZWFjdGlvblByb3ZpZGVyKCk7XG4gICAgICAgICAgICBpbnB1dC5ibHVyKCk7XG4gICAgICAgICAgICBBamF4Q2xpZW50LnBvc3ROZXdSZWFjdGlvbihyZWFjdGlvbkRhdGEsIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBjb250ZW50RGF0YSwgc3VjY2VzcywgZXJyb3IpO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gc3VjY2VzcyhyZWFjdGlvbikge1xuICAgICAgICAgICAgaWYgKHJlYWN0aW9uLmFwcHJvdmVkKSB7XG4gICAgICAgICAgICAgICAgc2hvd0NvbmZpcm1hdGlvbihyZWFjdGlvbkRhdGEsIHJlYWN0aW9uUHJvdmlkZXIpO1xuICAgICAgICAgICAgICAgIHJlYWN0aW9uID0gUGFnZURhdGEucmVnaXN0ZXJSZWFjdGlvbihyZWFjdGlvbiwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEpO1xuICAgICAgICAgICAgICAgIHJlYWN0aW9uUHJvdmlkZXIucmVhY3Rpb25Mb2FkZWQocmVhY3Rpb24pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBJZiB0aGUgcmVhY3Rpb24gaXNuJ3QgYXBwcm92ZWQsIGRvbid0IGFkZCBpdCB0byBvdXIgZGF0YSBtb2RlbC4gSnVzdCBzaG93IGZlZWRiYWNrIGFuZCBmaXJlIGFuIGV2ZW50LlxuICAgICAgICAgICAgICAgIHNob3dQZW5kaW5nQXBwcm92YWwocmVhY3Rpb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgRXZlbnRzLnBvc3RSZWFjdGlvbkNyZWF0ZWQocGFnZURhdGEsIGNvbnRhaW5lckRhdGEsIHJlYWN0aW9uLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGVycm9yKG1lc3NhZ2UpIHtcbiAgICAgICAgICAgIHZhciByZXRyeSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIEFqYXhDbGllbnQucG9zdE5ld1JlYWN0aW9uKHJlYWN0aW9uRGF0YSwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGNvbnRlbnREYXRhLCBzdWNjZXNzLCBlcnJvcik7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaGFuZGxlUmVhY3Rpb25FcnJvcihtZXNzYWdlLCByZXRyeSwgcGFnZVNlbGVjdG9yKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGtleWJvYXJkSW5wdXQocmFjdGl2ZUV2ZW50KSB7XG4gICAgICAgIGlmICgkKHJvb3RFbGVtZW50KHJhY3RpdmUpKS5oYXNDbGFzcygnYW50ZW5uYS1wYWdlLWFjdGl2ZScpKSB7IC8vIG9ubHkgaGFuZGxlIGlucHV0IHdoZW4gdGhpcyBwYWdlIGlzIGFjdGl2ZVxuICAgICAgICAgICAgJChyb290RWxlbWVudChyYWN0aXZlKSkuZmluZCgnLmFudGVubmEtZGVmYXVsdHMtZm9vdGVyIGlucHV0JykuZm9jdXMoKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gcm9vdEVsZW1lbnQocmFjdGl2ZSkge1xuICAgIHJldHVybiByYWN0aXZlLmZpbmQocGFnZVNlbGVjdG9yKTtcbn1cblxuZnVuY3Rpb24gYXJyYXlBY2Nlc3NvcihhcnJheSkge1xuICAgIHJldHVybiBmdW5jdGlvbihpbmRleCkge1xuICAgICAgICByZXR1cm4gYXJyYXlbaW5kZXhdO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gY3VzdG9tUmVhY3Rpb25Gb2N1cyhyYWN0aXZlRXZlbnQpIHtcbiAgICB2YXIgJGZvb3RlciA9ICQocmFjdGl2ZUV2ZW50Lm9yaWdpbmFsLnRhcmdldCkuY2xvc2VzdCgnLmFudGVubmEtZGVmYXVsdHMtZm9vdGVyJyk7XG4gICAgJGZvb3Rlci5maW5kKCdpbnB1dCcpLm5vdCgnLmFjdGl2ZScpLnZhbCgnJykuYWRkQ2xhc3MoJ2FjdGl2ZScpO1xuICAgICRmb290ZXIuZmluZCgnYnV0dG9uJykuc2hvdygpO1xufVxuXG5mdW5jdGlvbiBjdXN0b21SZWFjdGlvbkJsdXIocmFjdGl2ZUV2ZW50KSB7XG4gICAgdmFyIGV2ZW50ID0gcmFjdGl2ZUV2ZW50Lm9yaWdpbmFsO1xuICAgIGlmICgkKGV2ZW50LnJlbGF0ZWRUYXJnZXQpLmNsb3Nlc3QoJy5hbnRlbm5hLWRlZmF1bHRzLWZvb3RlciBidXR0b24nKS5zaXplKCkgPT0gMCkgeyAvLyBEb24ndCBoaWRlIHRoZSBpbnB1dCB3aGVuIHdlIGNsaWNrIG9uIHRoZSBidXR0b25cbiAgICAgICAgdmFyICRmb290ZXIgPSAkKGV2ZW50LnRhcmdldCkuY2xvc2VzdCgnLmFudGVubmEtZGVmYXVsdHMtZm9vdGVyJyk7XG4gICAgICAgIHZhciBpbnB1dCA9ICRmb290ZXIuZmluZCgnaW5wdXQnKTtcbiAgICAgICAgaWYgKGlucHV0LnZhbCgpID09PSAnJykge1xuICAgICAgICAgICAgJGZvb3Rlci5maW5kKCdidXR0b24nKS5oaWRlKCk7XG4gICAgICAgICAgICB2YXIgJGlucHV0ID0gJGZvb3Rlci5maW5kKCdpbnB1dCcpO1xuICAgICAgICAgICAgLy8gUmVzZXQgdGhlIGlucHV0IHZhbHVlIHRvIHRoZSBkZWZhdWx0IGluIHRoZSBodG1sL3RlbXBsYXRlXG4gICAgICAgICAgICAkaW5wdXQudmFsKCRpbnB1dC5hdHRyKCd2YWx1ZScpKS5yZW1vdmVDbGFzcygnYWN0aXZlJyk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVJlYWN0aW9uUHJvdmlkZXIoKSB7XG5cbiAgICB2YXIgbG9hZGVkUmVhY3Rpb247XG4gICAgdmFyIGNhbGxiYWNrcyA9IFtdO1xuXG4gICAgZnVuY3Rpb24gb25SZWFjdGlvbihjYWxsYmFjaykge1xuICAgICAgICBjYWxsYmFja3MucHVzaChjYWxsYmFjayk7XG4gICAgICAgIG5vdGlmeUlmUmVhZHkoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByZWFjdGlvbkxvYWRlZChyZWFjdGlvbikge1xuICAgICAgICBsb2FkZWRSZWFjdGlvbiA9IHJlYWN0aW9uO1xuICAgICAgICBub3RpZnlJZlJlYWR5KCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbm90aWZ5SWZSZWFkeSgpIHtcbiAgICAgICAgaWYgKGxvYWRlZFJlYWN0aW9uKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNhbGxiYWNrcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrc1tpXShsb2FkZWRSZWFjdGlvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYWxsYmFja3MgPSBbXTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIGdldDogb25SZWFjdGlvbiwgLy8gVE9ETyB0ZXJtaW5vbG9neVxuICAgICAgICByZWFjdGlvbkxvYWRlZDogcmVhY3Rpb25Mb2FkZWRcbiAgICB9XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGU6IGNyZWF0ZVBhZ2Vcbn07IiwidmFyIEFqYXhDbGllbnQgPSByZXF1aXJlKCcuL3V0aWxzL2FqYXgtY2xpZW50Jyk7XG52YXIgQnJvd3Nlck1ldHJpY3MgPSByZXF1aXJlKCcuL3V0aWxzL2Jyb3dzZXItbWV0cmljcycpO1xudmFyIEpTT05VdGlscyA9IHJlcXVpcmUoJy4vdXRpbHMvanNvbi11dGlscycpO1xudmFyIFNlZ21lbnQgPSByZXF1aXJlKCcuL3V0aWxzL3NlZ21lbnQnKTtcbnZhciBVc2VyID0gcmVxdWlyZSgnLi91dGlscy91c2VyJyk7XG5cbmZ1bmN0aW9uIHBvc3RHcm91cFNldHRpbmdzTG9hZGVkKGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgZXZlbnQgPSBjcmVhdGVFdmVudChldmVudFR5cGVzLnNjcmlwdExvYWQsICcnLCBncm91cFNldHRpbmdzKTtcbiAgICBldmVudFthdHRyaWJ1dGVzLnBhZ2VJZF0gPSAnbmEnO1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMuYXJ0aWNsZUhlaWdodF0gPSAnbmEnO1xuICAgIHBvc3RFdmVudChldmVudCk7XG59XG5cbmZ1bmN0aW9uIHBvc3RQYWdlRGF0YUxvYWRlZChwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBldmVudCA9IGNyZWF0ZUV2ZW50KGV2ZW50VHlwZXMucGFnZURhdGFMb2FkZWQsICcnLCBncm91cFNldHRpbmdzKTtcbiAgICBhcHBlbmRQYWdlRGF0YVBhcmFtcyhldmVudCwgcGFnZURhdGEpO1xuICAgIC8vIFRPRE86IHJlY29yZGluZyBvZiBzaW5nbGUvbXVsdGkgaXMgZGlzYWJsZWQgc28gd2UgY2FuIGluc3RlYWQgcmVjb3JkIEEvQi9DIHNlZ21lbnQgZGF0YVxuICAgIC8vIGV2ZW50W2F0dHJpYnV0ZXMuY29udGVudEF0dHJpYnV0ZXNdID0gcGFnZURhdGEubWV0cmljcy5pc011bHRpUGFnZSA/IGV2ZW50VmFsdWVzLm11bHRpcGxlUGFnZXMgOiBldmVudFZhbHVlcy5zaW5nbGVQYWdlO1xuICAgIHBvc3RFdmVudChldmVudCk7XG59XG5cbmZ1bmN0aW9uIHBvc3RSZWFjdGlvbldpZGdldE9wZW5lZChpc1Nob3dSZWFjdGlvbnMsIHBhZ2VEYXRhLCBjb250YWluZXJEYXRhLCBjb250ZW50RGF0YSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBldmVudFZhbHVlID0gaXNTaG93UmVhY3Rpb25zID8gZXZlbnRWYWx1ZXMuc2hvd1JlYWN0aW9ucyA6IGV2ZW50VmFsdWVzLnNob3dEZWZhdWx0cztcbiAgICB2YXIgZXZlbnQgPSBjcmVhdGVFdmVudChldmVudFR5cGVzLnJlYWN0aW9uV2lkZ2V0T3BlbmVkLCBldmVudFZhbHVlLCBncm91cFNldHRpbmdzKTtcbiAgICBhcHBlbmRQYWdlRGF0YVBhcmFtcyhldmVudCwgcGFnZURhdGEpO1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMuY29udGFpbmVySGFzaF0gPSBjb250YWluZXJEYXRhLmhhc2g7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5jb250YWluZXJLaW5kXSA9IGNvbnRlbnREYXRhLnR5cGU7XG4gICAgcG9zdEV2ZW50KGV2ZW50KTtcbn1cblxuZnVuY3Rpb24gcG9zdFN1bW1hcnlPcGVuZWQoaXNTaG93UmVhY3Rpb25zLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBldmVudFZhbHVlID0gaXNTaG93UmVhY3Rpb25zID8gZXZlbnRWYWx1ZXMudmlld1JlYWN0aW9ucyA6IGV2ZW50VmFsdWVzLnZpZXdEZWZhdWx0cztcbiAgICB2YXIgZXZlbnQgPSBjcmVhdGVFdmVudChldmVudFR5cGVzLnN1bW1hcnlXaWRnZXQsIGV2ZW50VmFsdWUsIGdyb3VwU2V0dGluZ3MpO1xuICAgIGFwcGVuZFBhZ2VEYXRhUGFyYW1zKGV2ZW50LCBwYWdlRGF0YSk7XG4gICAgcG9zdEV2ZW50KGV2ZW50KTtcbn1cblxuZnVuY3Rpb24gcG9zdFJlYWN0aW9uQ3JlYXRlZChwYWdlRGF0YSwgY29udGFpbmVyRGF0YSwgcmVhY3Rpb25EYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGV2ZW50ID0gY3JlYXRlRXZlbnQoZXZlbnRUeXBlcy5yZWFjdGlvbkNyZWF0ZWQsIHJlYWN0aW9uRGF0YS50ZXh0LCBncm91cFNldHRpbmdzKTtcbiAgICBhcHBlbmRQYWdlRGF0YVBhcmFtcyhldmVudCwgcGFnZURhdGEpO1xuICAgIGFwcGVuZENvbnRhaW5lckRhdGFQYXJhbXMoZXZlbnQsIGNvbnRhaW5lckRhdGEpO1xuICAgIGFwcGVuZFJlYWN0aW9uRGF0YVBhcmFtcyhldmVudCwgcmVhY3Rpb25EYXRhKTtcbiAgICBwb3N0RXZlbnQoZXZlbnQpO1xufVxuXG5mdW5jdGlvbiBwb3N0UmVhY3Rpb25TaGFyZWQodGFyZ2V0LCBwYWdlRGF0YSwgY29udGFpbmVyRGF0YSwgcmVhY3Rpb25EYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGV2ZW50VmFsdWUgPSB0YXJnZXQ7IC8vICdmYWNlYm9vaycsICd0d2l0dGVyJywgZXRjXG4gICAgdmFyIGV2ZW50ID0gY3JlYXRlRXZlbnQoZXZlbnRUeXBlcy5yZWFjdGlvblNoYXJlZCwgZXZlbnRWYWx1ZSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgYXBwZW5kUGFnZURhdGFQYXJhbXMoZXZlbnQsIHBhZ2VEYXRhKTtcbiAgICBhcHBlbmRDb250YWluZXJEYXRhUGFyYW1zKGV2ZW50LCBjb250YWluZXJEYXRhKTtcbiAgICBhcHBlbmRSZWFjdGlvbkRhdGFQYXJhbXMoZXZlbnQsIHJlYWN0aW9uRGF0YSk7XG4gICAgcG9zdEV2ZW50KGV2ZW50KTtcbn1cblxuZnVuY3Rpb24gcG9zdExvY2F0aW9uc1ZpZXdlZChwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBldmVudCA9IGNyZWF0ZUV2ZW50KGV2ZW50VHlwZXMuc3VtbWFyeVdpZGdldCwgZXZlbnRWYWx1ZXMubG9jYXRpb25zVmlld2VkLCBncm91cFNldHRpbmdzKTtcbiAgICBhcHBlbmRQYWdlRGF0YVBhcmFtcyhldmVudCwgcGFnZURhdGEpO1xuICAgIHBvc3RFdmVudChldmVudCk7XG59XG5cbmZ1bmN0aW9uIHBvc3RDb250ZW50Vmlld2VkKHBhZ2VEYXRhLCBjb250YWluZXJEYXRhLCBsb2NhdGlvbkRhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgZXZlbnQgPSBjcmVhdGVFdmVudChldmVudFR5cGVzLnN1bW1hcnlXaWRnZXQsIGV2ZW50VmFsdWVzLmNvbnRlbnRWaWV3ZWQsIGdyb3VwU2V0dGluZ3MpO1xuICAgIGFwcGVuZFBhZ2VEYXRhUGFyYW1zKGV2ZW50LCBwYWdlRGF0YSk7XG4gICAgYXBwZW5kQ29udGFpbmVyRGF0YVBhcmFtcyhldmVudCwgY29udGFpbmVyRGF0YSk7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5jb250ZW50SWRdID0gbG9jYXRpb25EYXRhLmNvbnRlbnRJZDtcbiAgICBldmVudFthdHRyaWJ1dGVzLmNvbnRlbnRMb2NhdGlvbl0gPSBsb2NhdGlvbkRhdGEubG9jYXRpb247XG4gICAgcG9zdEV2ZW50KGV2ZW50KTtcbn1cblxuZnVuY3Rpb24gcG9zdENvbW1lbnRzVmlld2VkKHBhZ2VEYXRhLCBjb250YWluZXJEYXRhLCByZWFjdGlvbkRhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgZXZlbnQgPSBjcmVhdGVFdmVudChldmVudFR5cGVzLmNvbW1lbnRzVmlld2VkLCAnJywgZ3JvdXBTZXR0aW5ncyk7XG4gICAgYXBwZW5kUGFnZURhdGFQYXJhbXMoZXZlbnQsIHBhZ2VEYXRhKTtcbiAgICBhcHBlbmRDb250YWluZXJEYXRhUGFyYW1zKGV2ZW50LCBjb250YWluZXJEYXRhKTtcbiAgICBhcHBlbmRSZWFjdGlvbkRhdGFQYXJhbXMoZXZlbnQsIHJlYWN0aW9uRGF0YSk7XG4gICAgcG9zdEV2ZW50KGV2ZW50KTtcbn1cblxuZnVuY3Rpb24gcG9zdENvbW1lbnRDcmVhdGVkKHBhZ2VEYXRhLCBjb250YWluZXJEYXRhLCByZWFjdGlvbkRhdGEsIGNvbW1lbnQsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgZXZlbnQgPSBjcmVhdGVFdmVudChldmVudFR5cGVzLmNvbW1lbnRDcmVhdGVkLCBjb21tZW50LCBncm91cFNldHRpbmdzKTtcbiAgICBhcHBlbmRQYWdlRGF0YVBhcmFtcyhldmVudCwgcGFnZURhdGEpO1xuICAgIGFwcGVuZENvbnRhaW5lckRhdGFQYXJhbXMoZXZlbnQsIGNvbnRhaW5lckRhdGEpO1xuICAgIGFwcGVuZFJlYWN0aW9uRGF0YVBhcmFtcyhldmVudCwgcmVhY3Rpb25EYXRhKTtcbiAgICBwb3N0RXZlbnQoZXZlbnQpO1xufVxuXG5mdW5jdGlvbiBwb3N0TGVnYWN5UmVjaXJjQ2xpY2tlZChwYWdlRGF0YSwgcmVhY3Rpb25JZCwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBldmVudCA9IGNyZWF0ZUV2ZW50KGV2ZW50VHlwZXMucmVjaXJjQ2xpY2tlZCwgcmVhY3Rpb25JZCwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgYXBwZW5kUGFnZURhdGFQYXJhbXMoZXZlbnQsIHBhZ2VEYXRhKTtcbiAgICBwb3N0RXZlbnQoZXZlbnQpO1xufVxuXG5mdW5jdGlvbiBwb3N0Q29udGVudFJlY0xvYWRlZChwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBldmVudCA9IGNyZWF0ZUV2ZW50KGV2ZW50VHlwZXMuY29udGVudFJlY0xvYWRlZCwgJycsIGdyb3VwU2V0dGluZ3MpO1xuICAgIGFwcGVuZFBhZ2VEYXRhUGFyYW1zKGV2ZW50LCBwYWdlRGF0YSk7XG4gICAgcG9zdEV2ZW50KGV2ZW50KTtcbn1cblxuZnVuY3Rpb24gcG9zdENvbnRlbnRSZWNWaXNpYmxlKHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGV2ZW50ID0gY3JlYXRlRXZlbnQoZXZlbnRUeXBlcy5jb250ZW50UmVjVmlzaWJsZSwgJycsIGdyb3VwU2V0dGluZ3MpO1xuICAgIGFwcGVuZFBhZ2VEYXRhUGFyYW1zKGV2ZW50LCBwYWdlRGF0YSk7XG4gICAgcG9zdEV2ZW50KGV2ZW50KTtcbn1cblxuZnVuY3Rpb24gcG9zdENvbnRlbnRSZWNDbGlja2VkKHBhZ2VEYXRhLCB0YXJnZXRVcmwsIGNvbnRlbnRJZCwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBldmVudCA9IGNyZWF0ZUV2ZW50KGV2ZW50VHlwZXMuY29udGVudFJlY0NsaWNrZWQsIHRhcmdldFVybCwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5jb250ZW50SWRdID0gY29udGVudElkO1xuICAgIGFwcGVuZFBhZ2VEYXRhUGFyYW1zKGV2ZW50LCBwYWdlRGF0YSk7XG4gICAgcG9zdEV2ZW50KGV2ZW50LCB0cnVlKTtcbn1cblxuZnVuY3Rpb24gcG9zdFJlYWRNb3JlTG9hZGVkKHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGV2ZW50ID0gY3JlYXRlRXZlbnQoZXZlbnRUeXBlcy5yZWFkTW9yZUxvYWRlZCwgJycsIGdyb3VwU2V0dGluZ3MpO1xuICAgIGFwcGVuZFBhZ2VEYXRhUGFyYW1zKGV2ZW50LCBwYWdlRGF0YSk7XG4gICAgcG9zdEV2ZW50KGV2ZW50KTtcbn1cblxuZnVuY3Rpb24gcG9zdFJlYWRNb3JlVmlzaWJsZShwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBldmVudCA9IGNyZWF0ZUV2ZW50KGV2ZW50VHlwZXMucmVhZE1vcmVWaXNpYmxlLCAnJywgZ3JvdXBTZXR0aW5ncyk7XG4gICAgYXBwZW5kUGFnZURhdGFQYXJhbXMoZXZlbnQsIHBhZ2VEYXRhKTtcbiAgICBwb3N0RXZlbnQoZXZlbnQpO1xufVxuXG5mdW5jdGlvbiBwb3N0UmVhZE1vcmVDbGlja2VkKHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGV2ZW50ID0gY3JlYXRlRXZlbnQoZXZlbnRUeXBlcy5yZWFkTW9yZUNsaWNrZWQsICcnLCBncm91cFNldHRpbmdzKTtcbiAgICBhcHBlbmRQYWdlRGF0YVBhcmFtcyhldmVudCwgcGFnZURhdGEpO1xuICAgIHBvc3RFdmVudChldmVudCk7XG59XG5cbmZ1bmN0aW9uIGFwcGVuZFBhZ2VEYXRhUGFyYW1zKGV2ZW50LCBwYWdlRGF0YSkge1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMucGFnZUlkXSA9IHBhZ2VEYXRhLnBhZ2VJZDtcbiAgICBldmVudFthdHRyaWJ1dGVzLnBhZ2VUaXRsZV0gPSBwYWdlRGF0YS50aXRsZTtcbiAgICBldmVudFthdHRyaWJ1dGVzLmNhbm9uaWNhbFVybF0gPSBwYWdlRGF0YS5jYW5vbmljYWxVcmw7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5wYWdlVXJsXSA9IHBhZ2VEYXRhLnJlcXVlc3RlZFVybDtcbiAgICBldmVudFthdHRyaWJ1dGVzLmFydGljbGVIZWlnaHRdID0gMCB8fCBwYWdlRGF0YS5tZXRyaWNzLmhlaWdodDtcbiAgICBldmVudFthdHRyaWJ1dGVzLnBhZ2VUb3BpY3NdID0gcGFnZURhdGEudG9waWNzO1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMuYXV0aG9yXSA9IHBhZ2VEYXRhLmF1dGhvcjtcbiAgICBldmVudFthdHRyaWJ1dGVzLnNpdGVTZWN0aW9uXSA9IHBhZ2VEYXRhLnNlY3Rpb247XG59XG5cbmZ1bmN0aW9uIGFwcGVuZENvbnRhaW5lckRhdGFQYXJhbXMoZXZlbnQsIGNvbnRhaW5lckRhdGEpIHtcbiAgICBldmVudFthdHRyaWJ1dGVzLmNvbnRhaW5lckhhc2hdID0gY29udGFpbmVyRGF0YS5oYXNoO1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMuY29udGFpbmVyS2luZF0gPSBjb250YWluZXJEYXRhLnR5cGU7XG59XG5cbmZ1bmN0aW9uIGFwcGVuZFJlYWN0aW9uRGF0YVBhcmFtcyhldmVudCwgcmVhY3Rpb25EYXRhKSB7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5yZWFjdGlvbkJvZHldID0gcmVhY3Rpb25EYXRhLnRleHQ7XG4gICAgaWYgKHJlYWN0aW9uRGF0YS5jb250ZW50KSB7XG4gICAgICAgIGV2ZW50W2F0dHJpYnV0ZXMuY29udGVudExvY2F0aW9uXSA9IHJlYWN0aW9uRGF0YS5jb250ZW50LmxvY2F0aW9uO1xuICAgICAgICBldmVudFthdHRyaWJ1dGVzLmNvbnRlbnRJZF0gPSByZWFjdGlvbkRhdGEuY29udGVudC5pZDtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUV2ZW50KGV2ZW50VHlwZSwgZXZlbnRWYWx1ZSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciByZWZlcnJlckRvbWFpbiA9IGRvY3VtZW50LnJlZmVycmVyLnNwbGl0KCcvJykuc3BsaWNlKDIpLmpvaW4oJy8nKTsgLy8gVE9ETzogZW5nYWdlX2Z1bGwgY29kZS4gUmV2aWV3XG5cbiAgICB2YXIgZXZlbnQgPSB7fTtcbiAgICBldmVudFthdHRyaWJ1dGVzLmV2ZW50VHlwZV0gPSBldmVudFR5cGU7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5ldmVudFZhbHVlXSA9IGV2ZW50VmFsdWU7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5ncm91cElkXSA9IGdyb3VwU2V0dGluZ3MuZ3JvdXBJZCgpO1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMuc2hvcnRUZXJtU2Vzc2lvbl0gPSBnZXRTaG9ydFRlcm1TZXNzaW9uSWQoKTtcbiAgICBldmVudFthdHRyaWJ1dGVzLmxvbmdUZXJtU2Vzc2lvbl0gPSBnZXRMb25nVGVybVNlc3Npb25JZCgpO1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMucmVmZXJyZXJVcmxdID0gcmVmZXJyZXJEb21haW47XG4gICAgZXZlbnRbYXR0cmlidXRlcy5pc1RvdWNoQnJvd3Nlcl0gPSBCcm93c2VyTWV0cmljcy5zdXBwb3J0c1RvdWNoKCk7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5zY3JlZW5XaWR0aF0gPSBzY3JlZW4ud2lkdGg7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5zY3JlZW5IZWlnaHRdID0gc2NyZWVuLmhlaWdodDtcbiAgICBldmVudFthdHRyaWJ1dGVzLnBpeGVsRGVuc2l0eV0gPSB3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbyB8fCBNYXRoLnJvdW5kKHdpbmRvdy5zY3JlZW4uYXZhaWxXaWR0aCAvIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRXaWR0aCk7IC8vIFRPRE86IHJldmlldyB0aGlzIGVuZ2FnZV9mdWxsIGNvZGUsIHdoaWNoIGRvZXNuJ3Qgc2VlbSBjb3JyZWN0XG4gICAgZXZlbnRbYXR0cmlidXRlcy51c2VyQWdlbnRdID0gbmF2aWdhdG9yLnVzZXJBZ2VudDtcbiAgICB2YXIgc2VnbWVudCA9IFNlZ21lbnQuZ2V0U2VnbWVudChncm91cFNldHRpbmdzKTtcbiAgICBpZiAoc2VnbWVudCkge1xuICAgICAgICBldmVudFthdHRyaWJ1dGVzLmNvbnRlbnRBdHRyaWJ1dGVzXSA9IHNlZ21lbnQ7XG4gICAgfVxuICAgIHJldHVybiBldmVudDtcbn1cblxuZnVuY3Rpb24gcG9zdEV2ZW50KGV2ZW50LCBzZW5kQXNUcmFja2luZ0V2ZW50KSB7XG4gICAgVXNlci5jYWNoZWRVc2VyKGZ1bmN0aW9uKHVzZXJJbmZvKSB7IC8vIFdlIGRvbid0IHdhbnQgdG8gY3JlYXRlIHVzZXJzIGp1c3QgZm9yIGV2ZW50cyAoZS5nLiBldmVyeSBzY3JpcHQgbG9hZCksIGJ1dCBhZGQgdXNlciBpbmZvIGlmIHdlIGhhdmUgaXQgYWxyZWFkeS5cbiAgICAgICAgaWYgKHVzZXJJbmZvKSB7XG4gICAgICAgICAgICBldmVudFthdHRyaWJ1dGVzLnVzZXJJZF0gPSB1c2VySW5mby51c2VyX2lkO1xuICAgICAgICB9XG4gICAgICAgIGZpbGxJbk1pc3NpbmdQcm9wZXJ0aWVzKGV2ZW50KTtcbiAgICAgICAgLy8gU2VuZCB0aGUgZXZlbnQgdG8gQmlnUXVlcnlcbiAgICAgICAgaWYgKHNlbmRBc1RyYWNraW5nRXZlbnQpIHtcbiAgICAgICAgICAgIEFqYXhDbGllbnQucG9zdFRyYWNraW5nRXZlbnQoZXZlbnQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgQWpheENsaWVudC5wb3N0RXZlbnQoZXZlbnQpO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5cbi8vIEZpbGwgaW4gYW55IG9wdGlvbmFsIHByb3BlcnRpZXMgd2l0aCBudWxsIHZhbHVlcy5cbmZ1bmN0aW9uIGZpbGxJbk1pc3NpbmdQcm9wZXJ0aWVzKGV2ZW50KSB7XG4gICAgZm9yICh2YXIgYXR0ciBpbiBhdHRyaWJ1dGVzKSB7XG4gICAgICAgIGlmIChldmVudFthdHRyaWJ1dGVzW2F0dHJdXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBldmVudFthdHRyaWJ1dGVzW2F0dHJdXSA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGdldExvbmdUZXJtU2Vzc2lvbklkKCkge1xuICAgIHZhciBndWlkID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ2FudF9sdHMnKTtcbiAgICBpZiAoIWd1aWQpIHtcbiAgICAgICAgZ3VpZCA9IGNyZWF0ZUd1aWQoKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdhbnRfbHRzJywgZ3VpZCk7XG4gICAgICAgIH0gY2F0Y2goZXJyb3IpIHtcbiAgICAgICAgICAgIC8vIFNvbWUgYnJvd3NlcnMgKG1vYmlsZSBTYWZhcmkpIHRocm93IGFuIGV4Y2VwdGlvbiB3aGVuIGluIHByaXZhdGUgYnJvd3NpbmcgbW9kZS5cbiAgICAgICAgICAgIC8vIE5vdGhpbmcgd2UgY2FuIGRvIGFib3V0IGl0LiBKdXN0IGZhbGwgdGhyb3VnaCBhbmQgcmV0dXJuIHRoZSB2YWx1ZSB3ZSBnZW5lcmF0ZWQuXG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGd1aWQ7XG59XG5cbmZ1bmN0aW9uIGdldFNob3J0VGVybVNlc3Npb25JZCgpIHtcbiAgICB2YXIgc2Vzc2lvbjtcbiAgICB2YXIganNvbiA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdhbnRfc3RzJyk7XG4gICAgaWYgKGpzb24pIHtcbiAgICAgICAgc2Vzc2lvbiA9IEpTT04ucGFyc2UoanNvbik7XG4gICAgICAgIGlmIChEYXRlLm5vdygpID4gc2Vzc2lvbi5leHBpcmVzKSB7XG4gICAgICAgICAgICBzZXNzaW9uID0gbnVsbDsgLy8gZXhwaXJlIHRoZSBzZXNzaW9uXG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKCFzZXNzaW9uKSB7XG4gICAgICAgIHNlc3Npb24gPSB7IGd1aWQ6IGNyZWF0ZUd1aWQoKSB9O1xuICAgIH1cbiAgICAvLyBBbHdheXMgc2V0IGEgbmV3IGV4cGlyZXMgdGltZSwgc28gdGhhdCB3ZSBrZWVwIGV4dGVuZGluZyB0aGUgdGltZSBhcyBsb25nIGFzIHRoZSB1c2VyIGlzIGFjdGl2ZVxuICAgIHZhciBtaW51dGVzID0gMTU7XG4gICAgc2Vzc2lvbi5leHBpcmVzID0gRGF0ZS5ub3coKSArIG1pbnV0ZXMgKiA2MDAwMDtcbiAgICB0cnkge1xuICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnYW50X3N0cycsIEpTT05VdGlscy5zdHJpbmdpZnkoc2Vzc2lvbikpO1xuICAgIH0gY2F0Y2goZXJyb3IpIHtcbiAgICAgICAgLy8gU29tZSBicm93c2VycyAobW9iaWxlIFNhZmFyaSkgdGhyb3cgYW4gZXhjZXB0aW9uIHdoZW4gaW4gcHJpdmF0ZSBicm93c2luZyBtb2RlLlxuICAgICAgICAvLyBOb3RoaW5nIHdlIGNhbiBkbyBhYm91dCBpdC4gSnVzdCBmYWxsIHRocm91Z2ggYW5kIHJldHVybiB0aGUgdmFsdWUgd2UgZ2VuZXJhdGVkLlxuICAgIH1cbiAgICByZXR1cm4gc2Vzc2lvbi5ndWlkO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVHdWlkKCkge1xuICAgIC8vIENvZGUgY29waWVkIGZyb20gZW5nYWdlX2Z1bGwgKG9yaWdpbmFsbHksIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTA1MDM0L2NyZWF0ZS1ndWlkLXV1aWQtaW4tamF2YXNjcmlwdClcbiAgICByZXR1cm4gJ3h4eHh4eHh4LXh4eHgtNHh4eC15eHh4LXh4eHh4eHh4eHh4eCcucmVwbGFjZSgvW3h5XS9nLCBmdW5jdGlvbiAoYykge1xuICAgICAgICB2YXIgciA9IE1hdGgucmFuZG9tKCkgKiAxNiB8IDAsIHYgPSBjID09ICd4JyA/IHIgOiAociAmIDB4MyB8IDB4OCk7XG4gICAgICAgIHJldHVybiB2LnRvU3RyaW5nKDE2KTtcbiAgICB9KTtcbn1cblxudmFyIGF0dHJpYnV0ZXMgPSB7XG4gICAgZXZlbnRUeXBlOiAnZXQnLFxuICAgIGV2ZW50VmFsdWU6ICdldicsXG4gICAgZ3JvdXBJZDogJ2dpZCcsXG4gICAgdXNlcklkOiAndWlkJyxcbiAgICBwYWdlSWQ6ICdwaWQnLFxuICAgIGxvbmdUZXJtU2Vzc2lvbjogJ2x0cycsXG4gICAgc2hvcnRUZXJtU2Vzc2lvbjogJ3N0cycsXG4gICAgcmVmZXJyZXJVcmw6ICdyZWYnLFxuICAgIGNvbnRlbnRJZDogJ2NpZCcsXG4gICAgYXJ0aWNsZUhlaWdodDogJ2FoJyxcbiAgICBjb250YWluZXJIYXNoOiAnY2gnLFxuICAgIGNvbnRhaW5lcktpbmQ6ICdjaycsXG4gICAgcmVhY3Rpb25Cb2R5OiAncicsXG4gICAgcGFnZVRpdGxlOiAncHQnLFxuICAgIGNhbm9uaWNhbFVybDogJ2N1JyxcbiAgICBwYWdlVXJsOiAncHUnLFxuICAgIGNvbnRlbnRBdHRyaWJ1dGVzOiAnY2EnLFxuICAgIGNvbnRlbnRMb2NhdGlvbjogJ2NsJyxcbiAgICBwYWdlVG9waWNzOiAncHRvcCcsXG4gICAgYXV0aG9yOiAnYScsXG4gICAgc2l0ZVNlY3Rpb246ICdzZWMnLFxuICAgIGlzVG91Y2hCcm93c2VyOiAnaXQnLFxuICAgIHNjcmVlbldpZHRoOiAnc3cnLFxuICAgIHNjcmVlbkhlaWdodDogJ3NoJyxcbiAgICBwaXhlbERlbnNpdHk6ICdwZCcsXG4gICAgdXNlckFnZW50OiAndWEnXG59O1xuXG52YXIgZXZlbnRUeXBlcyA9IHtcbiAgICBzY3JpcHRMb2FkOiAnc2wnLFxuICAgIHJlYWN0aW9uU2hhcmVkOiAnc2gnLFxuICAgIHN1bW1hcnlXaWRnZXQ6ICdzYicsXG4gICAgcmVhY3Rpb25XaWRnZXRPcGVuZWQ6ICdycycsXG4gICAgcGFnZURhdGFMb2FkZWQ6ICd3bCcsXG4gICAgY29tbWVudENyZWF0ZWQ6ICdjJyxcbiAgICByZWFjdGlvbkNyZWF0ZWQ6ICdyZScsXG4gICAgY29tbWVudHNWaWV3ZWQ6ICd2Y29tJyxcbiAgICByZWNpcmNDbGlja2VkOiAncmMnLFxuICAgIGNvbnRlbnRSZWNMb2FkZWQ6ICdjcmwnLFxuICAgIGNvbnRlbnRSZWNWaXNpYmxlOiAnY3J2JyxcbiAgICBjb250ZW50UmVjQ2xpY2tlZDogJ2NyYycsXG4gICAgcmVhZE1vcmVMb2FkZWQ6ICdybWwnLFxuICAgIHJlYWRNb3JlVmlzaWJsZTogJ3JtdicsXG4gICAgcmVhZE1vcmVDbGlja2VkOiAncm1jJ1xufTtcblxudmFyIGV2ZW50VmFsdWVzID0ge1xuICAgIGNvbnRlbnRWaWV3ZWQ6ICd2YycsIC8vIHZpZXdfY29udGVudFxuICAgIGxvY2F0aW9uc1ZpZXdlZDogJ3ZyJywgLy8gdmlld19yZWFjdGlvbnNcbiAgICBzaG93RGVmYXVsdHM6ICd3cicsXG4gICAgc2hvd1JlYWN0aW9uczogJ3JkJyxcbiAgICBzaW5nbGVQYWdlOiAnc2knLFxuICAgIG11bHRpcGxlUGFnZXM6ICdtdScsXG4gICAgdmlld1JlYWN0aW9uczogJ3Z3JyxcbiAgICB2aWV3RGVmYXVsdHM6ICdhZCdcbn07XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBwb3N0R3JvdXBTZXR0aW5nc0xvYWRlZDogcG9zdEdyb3VwU2V0dGluZ3NMb2FkZWQsXG4gICAgcG9zdFBhZ2VEYXRhTG9hZGVkOiBwb3N0UGFnZURhdGFMb2FkZWQsXG4gICAgcG9zdFN1bW1hcnlPcGVuZWQ6IHBvc3RTdW1tYXJ5T3BlbmVkLFxuICAgIHBvc3RDb21tZW50c1ZpZXdlZDogcG9zdENvbW1lbnRzVmlld2VkLFxuICAgIHBvc3RDb21tZW50Q3JlYXRlZDogcG9zdENvbW1lbnRDcmVhdGVkLFxuICAgIHBvc3RSZWFjdGlvbldpZGdldE9wZW5lZDogcG9zdFJlYWN0aW9uV2lkZ2V0T3BlbmVkLFxuICAgIHBvc3RSZWFjdGlvbkNyZWF0ZWQ6IHBvc3RSZWFjdGlvbkNyZWF0ZWQsXG4gICAgcG9zdFJlYWN0aW9uU2hhcmVkOiBwb3N0UmVhY3Rpb25TaGFyZWQsXG4gICAgcG9zdExvY2F0aW9uc1ZpZXdlZDogcG9zdExvY2F0aW9uc1ZpZXdlZCxcbiAgICBwb3N0Q29udGVudFZpZXdlZDogcG9zdENvbnRlbnRWaWV3ZWQsXG4gICAgcG9zdExlZ2FjeVJlY2lyY0NsaWNrZWQ6IHBvc3RMZWdhY3lSZWNpcmNDbGlja2VkLFxuICAgIHBvc3RDb250ZW50UmVjTG9hZGVkOiBwb3N0Q29udGVudFJlY0xvYWRlZCxcbiAgICBwb3N0Q29udGVudFJlY1Zpc2libGU6IHBvc3RDb250ZW50UmVjVmlzaWJsZSxcbiAgICBwb3N0Q29udGVudFJlY0NsaWNrZWQ6IHBvc3RDb250ZW50UmVjQ2xpY2tlZCxcbiAgICBwb3N0UmVhZE1vcmVMb2FkZWQ6IHBvc3RSZWFkTW9yZUxvYWRlZCxcbiAgICBwb3N0UmVhZE1vcmVWaXNpYmxlOiBwb3N0UmVhZE1vcmVWaXNpYmxlLFxuICAgIHBvc3RSZWFkTW9yZUNsaWNrZWQ6IHBvc3RSZWFkTW9yZUNsaWNrZWRcbn07IiwidmFyIFJhY3RpdmU7IHJlcXVpcmUoJy4vdXRpbHMvcmFjdGl2ZS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihsb2FkZWRSYWN0aXZlKSB7IFJhY3RpdmUgPSBsb2FkZWRSYWN0aXZlO30pO1xudmFyIFNWR3MgPSByZXF1aXJlKCcuL3N2Z3MnKTtcblxudmFyIHBhZ2VTZWxlY3RvciA9ICcuYW50ZW5uYS1lcnJvci1wYWdlJztcblxuZnVuY3Rpb24gY3JlYXRlUGFnZShvcHRpb25zKSB7XG4gICAgdmFyIGVsZW1lbnQgPSBvcHRpb25zLmVsZW1lbnQ7XG4gICAgdmFyIGdvQmFjayA9IG9wdGlvbnMuZ29CYWNrO1xuICAgIHZhciByYWN0aXZlID0gUmFjdGl2ZSh7XG4gICAgICAgIGVsOiBlbGVtZW50LFxuICAgICAgICBhcHBlbmQ6IHRydWUsXG4gICAgICAgIGRhdGE6IHt9LFxuICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL2dlbmVyaWMtZXJyb3ItcGFnZS5oYnMuaHRtbCcpLFxuICAgICAgICBwYXJ0aWFsczoge1xuICAgICAgICAgICAgbGVmdDogU1ZHcy5sZWZ0XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByYWN0aXZlLm9uKCdiYWNrJywgZ29CYWNrKTtcbiAgICByZXR1cm4ge1xuICAgICAgICBzZWxlY3RvcjogcGFnZVNlbGVjdG9yLFxuICAgICAgICB0ZWFyZG93bjogZnVuY3Rpb24oKSB7IHJhY3RpdmUudGVhcmRvd24oKTsgfVxuICAgIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZVBhZ2U6IGNyZWF0ZVBhZ2Vcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgQWpheENsaWVudCA9IHJlcXVpcmUoJy4vdXRpbHMvYWpheC1jbGllbnQnKTtcbnZhciBVUkxzID0gcmVxdWlyZSgnLi91dGlscy91cmxzJyk7XG52YXIgR3JvdXBTZXR0aW5ncyA9IHJlcXVpcmUoJy4vZ3JvdXAtc2V0dGluZ3MnKTtcblxuLy8gVE9ETyBmb2xkIHRoaXMgbW9kdWxlIGludG8gZ3JvdXAtc2V0dGluZ3M/XG5cbmZ1bmN0aW9uIGxvYWRTZXR0aW5ncyhjYWxsYmFjaykge1xuICAgIEFqYXhDbGllbnQuZ2V0SlNPTlAoVVJMcy5ncm91cFNldHRpbmdzVXJsKCksIHsgaG9zdF9uYW1lOiB3aW5kb3cuYW50ZW5uYV9ob3N0IH0sIHN1Y2Nlc3MsIGVycm9yKTtcblxuICAgIGZ1bmN0aW9uIHN1Y2Nlc3MoanNvbikge1xuICAgICAgICB2YXIgZ3JvdXBTZXR0aW5ncyA9IEdyb3VwU2V0dGluZ3MuY3JlYXRlKGpzb24pO1xuICAgICAgICBjYWxsYmFjayhncm91cFNldHRpbmdzKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBlcnJvcihtZXNzYWdlKSB7XG4gICAgICAgIC8vIFRPRE8gaGFuZGxlIGVycm9ycyB0aGF0IGhhcHBlbiB3aGVuIGxvYWRpbmcgY29uZmlnIGRhdGFcbiAgICAgICAgY29uc29sZS5sb2coJ0FuIGVycm9yIG9jY3VycmVkIGxvYWRpbmcgZ3JvdXAgc2V0dGluZ3M6ICcgKyBtZXNzYWdlKTtcbiAgICB9XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBsb2FkOiBsb2FkU2V0dGluZ3Ncbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG5cbnZhciBFdmVudHMgPSByZXF1aXJlKCcuL2V2ZW50cycpO1xuXG52YXIgZ3JvdXBTZXR0aW5ncztcblxuLy8gVE9ETzogVXBkYXRlIGFsbCBjbGllbnRzIHRoYXQgYXJlIHBhc3NpbmcgYXJvdW5kIGEgZ3JvdXBTZXR0aW5ncyBvYmplY3QgdG8gaW5zdGVhZCBhY2Nlc3MgdGhlICdnbG9iYWwnIHNldHRpbmdzIGluc3RhbmNlXG5mdW5jdGlvbiBnZXRHcm91cFNldHRpbmdzKCkge1xuICAgIHJldHVybiBncm91cFNldHRpbmdzO1xufVxuXG5mdW5jdGlvbiB1cGRhdGVGcm9tSlNPTihqc29uKSB7XG4gICAgZ3JvdXBTZXR0aW5ncyA9IGNyZWF0ZUZyb21KU09OKGpzb24pO1xuICAgIEV2ZW50cy5wb3N0R3JvdXBTZXR0aW5nc0xvYWRlZChncm91cFNldHRpbmdzKTtcbiAgICByZXR1cm4gZ3JvdXBTZXR0aW5ncztcbn1cblxuXG4vLyBUT0RPOiB0cmltIHRyYWlsaW5nIGNvbW1hcyBmcm9tIGFueSBzZWxlY3RvciB2YWx1ZXNcblxuLy8gVE9ETzogUmV2aWV3LiBUaGVzZSBhcmUganVzdCBjb3BpZWQgZnJvbSBlbmdhZ2VfZnVsbC5cbnZhciBkZWZhdWx0cyA9IHtcbiAgICBwcmVtaXVtOiBmYWxzZSxcbiAgICBpbWdfc2VsZWN0b3I6IFwiaW1nXCIsIC8vIFRPRE86IHRoaXMgaXMgc29tZSBib2d1cyBvYnNvbGV0ZSBwcm9wZXJ0eS4gd2Ugc2hvdWxkbid0IHVzZSBpdC5cbiAgICBpbWdfY29udGFpbmVyX3NlbGVjdG9yczpcIiNwcmltYXJ5LXBob3RvXCIsXG4gICAgYWN0aXZlX3NlY3Rpb25zOiBcImJvZHlcIixcbiAgICAvL2Fubm9fd2hpdGVsaXN0OiBcImJvZHkgcFwiLFxuICAgIGFubm9fd2hpdGVsaXN0OiBcInBcIiwgLy8gVE9ETzogVGhlIGN1cnJlbnQgZGVmYXVsdCBpcyBcImJvZHkgcFwiLCB3aGljaCBtYWtlcyBubyBzZW5zZSB3aGVuIHdlJ3JlIHNlYXJjaGluZyBvbmx5IHdpdGhpbiB0aGUgYWN0aXZlIHNlY3Rpb25zXG4gICAgYWN0aXZlX3NlY3Rpb25zX3dpdGhfYW5ub193aGl0ZWxpc3Q6XCJcIixcbiAgICBtZWRpYV9zZWxlY3RvcjogXCJlbWJlZCwgdmlkZW8sIG9iamVjdCwgaWZyYW1lXCIsXG4gICAgY29tbWVudF9sZW5ndGg6IDUwMCxcbiAgICBub19hbnQ6IFwiXCIsXG4gICAgaW1nX2JsYWNrbGlzdDogXCJcIixcbiAgICBjdXN0b21fY3NzOiBcIlwiLFxuICAgIC8vdG9kbzogdGVtcCBpbmxpbmVfaW5kaWNhdG9yIGRlZmF1bHRzIHRvIG1ha2UgdGhlbSBzaG93IHVwIG9uIGFsbCBtZWRpYSAtIHJlbW92ZSB0aGlzIGxhdGVyLlxuICAgIGlubGluZV9zZWxlY3RvcjogJ2ltZywgZW1iZWQsIHZpZGVvLCBvYmplY3QsIGlmcmFtZScsXG4gICAgcGFyYWdyYXBoX2hlbHBlcjogdHJ1ZSxcbiAgICBtZWRpYV91cmxfaWdub3JlX3F1ZXJ5OiB0cnVlLFxuICAgIHN1bW1hcnlfd2lkZ2V0X3NlbGVjdG9yOiAnLmFudC1wYWdlLXN1bW1hcnknLCAvLyBUT0RPOiB0aGlzIHdhc24ndCBkZWZpbmVkIGFzIGEgZGVmYXVsdCBpbiBlbmdhZ2VfZnVsbCwgYnV0IHdhcyBpbiBjb2RlLiB3aHk/XG4gICAgc3VtbWFyeV93aWRnZXRfbWV0aG9kOiAnYWZ0ZXInLFxuICAgIGxhbmd1YWdlOiAnZW4nLFxuICAgIGFiX3Rlc3RfaW1wYWN0OiB0cnVlLFxuICAgIGFiX3Rlc3Rfc2FtcGxlX3BlcmNlbnRhZ2U6IDEwLFxuICAgIGltZ19pbmRpY2F0b3Jfc2hvd19vbmxvYWQ6IHRydWUsXG4gICAgaW1nX2luZGljYXRvcl9zaG93X3NpZGU6ICdsZWZ0JyxcbiAgICB0YWdfYm94X2JnX2NvbG9yczogJycsXG4gICAgdGFnX2JveF90ZXh0X2NvbG9yczogJycsXG4gICAgdGFnX2JveF9mb250X2ZhbWlseTogJ0hlbHZldGljYU5ldWUsSGVsdmV0aWNhLEFyaWFsLHNhbnMtc2VyaWYnLFxuICAgIHRhZ3NfYmdfY3NzOiAnJyxcbiAgICBpZ25vcmVfc3ViZG9tYWluOiBmYWxzZSxcbiAgICBpbWFnZV9zZWxlY3RvcjogJ21ldGFbcHJvcGVydHk9XCJvZzppbWFnZVwiXScsIC8vIFRPRE86IHJldmlldyB3aGF0IHRoaXMgc2hvdWxkIGJlIChub3QgZnJvbSBlbmdhZ2VfZnVsbClcbiAgICBpbWFnZV9hdHRyaWJ1dGU6ICdjb250ZW50JywgLy8gVE9ETzogcmV2aWV3IHdoYXQgdGhpcyBzaG91bGQgYmUgKG5vdCBmcm9tIGVuZ2FnZV9mdWxsKSxcbiAgICBxdWVyeXN0cmluZ19jb250ZW50OiBmYWxzZSxcbiAgICBpbml0aWFsX3Bpbl9saW1pdDogMyxcbiAgICAvL3RoZSBzY29wZSBpbiB3aGljaCB0byBmaW5kIHBhcmVudHMgb2YgPGJyPiB0YWdzLlxuICAgIC8vVGhvc2UgcGFyZW50cyB3aWxsIGJlIGNvbnZlcnRlZCB0byBhIDxydD4gYmxvY2ssIHNvIHRoZXJlIHdvbid0IGJlIG5lc3RlZCA8cD4gYmxvY2tzLlxuICAgIC8vdGhlbiBpdCB3aWxsIHNwbGl0IHRoZSBwYXJlbnQncyBodG1sIG9uIDxicj4gdGFncyBhbmQgd3JhcCB0aGUgc2VjdGlvbnMgaW4gPHA+IHRhZ3MuXG5cbiAgICAvL2V4YW1wbGU6XG4gICAgLy8gYnJfcmVwbGFjZV9zY29wZV9zZWxlY3RvcjogXCIuYW50X2JyX3JlcGxhY2VcIiAvL2UuZy4gXCIjbWFpbnNlY3Rpb25cIiBvciBcInBcIlxuXG4gICAgYnJfcmVwbGFjZV9zY29wZV9zZWxlY3RvcjogbnVsbCAvL2UuZy4gXCIjbWFpbnNlY3Rpb25cIiBvciBcInBcIlxufTtcblxuZnVuY3Rpb24gY3JlYXRlRnJvbUpTT04oanNvbikge1xuXG4gICAgZnVuY3Rpb24gZGF0YShrZXksIGlmQWJzZW50KSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciB2YWx1ZTtcbiAgICAgICAgICAgIGlmICh3aW5kb3cuYW50ZW5uYV9leHRlbmQpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHdpbmRvdy5hbnRlbm5hX2V4dGVuZFtrZXldO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHZhbHVlID09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHZhbHVlID0ganNvbltrZXldO1xuICAgICAgICAgICAgICAgIC8vIFRPRE86IG91ciBzZXJ2ZXIgYXBwYXJlbnRseSBzZW5kcyBiYWNrIG51bGwgYXMgYSB2YWx1ZSBmb3Igc29tZSBhdHRyaWJ1dGVzLlxuICAgICAgICAgICAgICAgIC8vIFRPRE86IGNvbnNpZGVyIGNoZWNraW5nIGZvciBudWxsIHdoZXJldmVyIHdlJ3JlIGNoZWNraW5nIGZvciB1bmRlZmluZWRcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCB8fCB2YWx1ZSA9PT0gJycgfHwgdmFsdWUgPT09IG51bGwpIHsgLy8gVE9ETzogU2hvdWxkIHRoZSBzZXJ2ZXIgYmUgc2VuZGluZyBiYWNrICcnIGhlcmUgb3Igbm90aGluZyBhdCBhbGw/IChJdCBwcmVjbHVkZXMgdGhlIHNlcnZlciBmcm9tIHJlYWxseSBzYXlpbmcgJ25vdGhpbmcnKVxuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IGRlZmF1bHRzW2tleV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHZhbHVlID09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBpZkFic2VudDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBleGNsdXNpb25TZWxlY3RvcihrZXksIGRlcHJlY2F0ZWRLZXkpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIHNlbGVjdG9ycyA9IFtdO1xuICAgICAgICAgICAgdmFyIG5vQW50ID0gZGF0YSgnbm9fYW50JykoKTtcbiAgICAgICAgICAgIGlmIChub0FudCkge1xuICAgICAgICAgICAgICAgIHNlbGVjdG9ycy5wdXNoKG5vQW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBub1JlYWRyID0gZGF0YSgnbm9fcmVhZHInKSgpO1xuICAgICAgICAgICAgaWYgKG5vUmVhZHIpIHtcbiAgICAgICAgICAgICAgICBzZWxlY3RvcnMucHVzaChub1JlYWRyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBzZWxlY3RvcnMuam9pbignLCcpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYmFja2dyb3VuZENvbG9yKGFjY2Vzc29yKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBjb2xvcnMgPSBbXTtcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IGFjY2Vzc29yKCk7XG4gICAgICAgICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICBjb2xvcnMgPSB2YWx1ZS5zcGxpdCgnOycpO1xuICAgICAgICAgICAgICAgIGNvbG9ycyA9IG1pZ3JhdGVWYWx1ZXMoY29sb3JzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBjb2xvcnM7XG5cbiAgICAgICAgICAgIC8vIE1pZ3JhdGUgYW55IGNvbG9ycyBmcm9tIHRoZSAnMSwgMiwgMycgZm9ybWF0IHRvICdyZ2IoMSwgMiwgMyknLiBUaGlzIGNvZGUgY2FuIGJlIGRlbGV0ZWQgb25jZSB3ZSd2ZSB1cGRhdGVkXG4gICAgICAgICAgICAvLyBhbGwgc2l0ZXMgdG8gc3BlY2lmeWluZyB2YWxpZCBDU1MgY29sb3IgdmFsdWVzXG4gICAgICAgICAgICBmdW5jdGlvbiBtaWdyYXRlVmFsdWVzKGNvbG9yVmFsdWVzKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1pZ3JhdGlvbk1hdGNoZXIgPSAvXlxccypcXGQrXFxzKixcXHMqXFxkK1xccyosXFxzKlxcZCtcXHMqJC9naW07XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb2xvclZhbHVlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgdmFsdWUgPSBjb2xvclZhbHVlc1tpXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG1pZ3JhdGlvbk1hdGNoZXIudGVzdCh2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yVmFsdWVzW2ldID0gJ3JnYignICsgdmFsdWUgKyAnKSc7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbG9yVmFsdWVzO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZGVmYXVsdFJlYWN0aW9ucygkZWxlbWVudCkge1xuICAgICAgICAvLyBEZWZhdWx0IHJlYWN0aW9ucyBhcmUgYXZhaWxhYmxlIGluIHRocmVlIGxvY2F0aW9ucyBpbiB0aHJlZSBkYXRhIGZvcm1hdHM6XG4gICAgICAgIC8vIDEuIEFzIGEgY29tbWEtc2VwYXJhdGVkIGF0dHJpYnV0ZSB2YWx1ZSBvbiBhIHBhcnRpY3VsYXIgZWxlbWVudFxuICAgICAgICAvLyAyLiBBcyBhbiBhcnJheSBvZiBzdHJpbmdzIG9uIHRoZSB3aW5kb3cuYW50ZW5uYV9leHRlbmQgcHJvcGVydHlcbiAgICAgICAgLy8gMy4gQXMgYSBqc29uIG9iamVjdCB3aXRoIGEgYm9keSBhbmQgaWQgb24gdGhlIGdyb3VwIHNldHRpbmdzXG4gICAgICAgIHZhciByZWFjdGlvbnMgPSBbXTtcbiAgICAgICAgdmFyIHJlYWN0aW9uU3RyaW5ncztcbiAgICAgICAgdmFyIGVsZW1lbnRSZWFjdGlvbnMgPSAkZWxlbWVudCA/ICRlbGVtZW50LmF0dHIoJ2FudC1yZWFjdGlvbnMnKSA6IHVuZGVmaW5lZDtcbiAgICAgICAgaWYgKGVsZW1lbnRSZWFjdGlvbnMpIHtcbiAgICAgICAgICAgIHJlYWN0aW9uU3RyaW5ncyA9IGVsZW1lbnRSZWFjdGlvbnMuc3BsaXQoJzsnKTtcbiAgICAgICAgfSBlbHNlIGlmICh3aW5kb3cuYW50ZW5uYV9leHRlbmQpIHtcbiAgICAgICAgICAgIHJlYWN0aW9uU3RyaW5ncyA9IHdpbmRvdy5hbnRlbm5hX2V4dGVuZFsnZGVmYXVsdF9yZWFjdGlvbnMnXTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocmVhY3Rpb25TdHJpbmdzKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJlYWN0aW9uU3RyaW5ncy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHJlYWN0aW9ucy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgdGV4dDogcmVhY3Rpb25TdHJpbmdzW2ldLFxuICAgICAgICAgICAgICAgICAgICBpc0RlZmF1bHQ6IHRydWVcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyIHZhbHVlcyA9IGpzb25bJ2RlZmF1bHRfcmVhY3Rpb25zJ107XG4gICAgICAgICAgICBpZiAodmFsdWVzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHZhbHVlcy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgdmFsdWUgPSB2YWx1ZXNbal07XG4gICAgICAgICAgICAgICAgICAgIHJlYWN0aW9ucy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6IHZhbHVlLmJvZHksXG4gICAgICAgICAgICAgICAgICAgICAgICBpZDogdmFsdWUuaWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBpc0RlZmF1bHQ6IHRydWVcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZWFjdGlvbnM7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY29tcHV0ZUN1c3RvbUNTUygpIHtcbiAgICAgICAgLy8gRmlyc3QgcmVhZCBhbnkgcmF3IGN1c3RvbSBDU1MuXG4gICAgICAgIHZhciBjdXN0b21DU1MgPSBkYXRhKCdjdXN0b21fY3NzJykoKTtcbiAgICAgICAgLy8gVGhlbiBhcHBlbmQgcnVsZXMgZm9yIGFueSBzcGVjaWZpYyBDU1Mgb3ZlcnJpZGVzLlxuICAgICAgICBjdXN0b21DU1MgKz0gY3JlYXRlQ3VzdG9tQ1NTUnVsZShtaWdyYXRlUmVhY3Rpb25zQmFja2dyb3VuZENvbG9yU2V0dGluZ3MoZGF0YSgndGFnc19iZ19jc3MnLCAnJykpLCAnLmFudGVubmEtcmVhY3Rpb25zLXBhZ2UgLmFudGVubmEtYm9keSwgLmFudGVubmEtZGVmYXVsdHMtcGFnZSAuYW50ZW5uYS1ib2R5Jyk7XG4gICAgICAgIGN1c3RvbUNTUyArPSBjcmVhdGVDdXN0b21DU1NSdWxlKGRhdGEoJ3RhZ19ib3hfYmdfY29sb3JzJywgJycpLCAnLmFudGVubmEtcmVhY3Rpb24tYm94Jyk7XG4gICAgICAgIGN1c3RvbUNTUyArPSBjcmVhdGVDdXN0b21DU1NSdWxlKGRhdGEoJ3RhZ19ib3hfYmdfY29sb3JzX2hvdmVyJywgJycpLCAnLmFudGVubmEtcmVhY3Rpb246aG92ZXIgPiAuYW50ZW5uYS1yZWFjdGlvbi1ib3gnKTtcbiAgICAgICAgY3VzdG9tQ1NTICs9IGNyZWF0ZUN1c3RvbUNTU1J1bGUobWlncmF0ZVRleHRDb2xvclNldHRpbmdzKGRhdGEoJ3RhZ19ib3hfdGV4dF9jb2xvcnMnLCAnJykpLCAnLmFudGVubmEtcmVhY3Rpb24tYm94LCAuYW50ZW5uYS1yZWFjdGlvbi1jb21tZW50cyAuYW50ZW5uYS1jb21tZW50cy1wYXRoLCAuYW50ZW5uYS1yZWFjdGlvbi1sb2NhdGlvbiAuYW50ZW5uYS1sb2NhdGlvbi1wYXRoJyk7XG4gICAgICAgIGN1c3RvbUNTUyArPSBjcmVhdGVDdXN0b21DU1NSdWxlKG1pZ3JhdGVGb250RmFtaWx5U2V0dGluZyhkYXRhKCd0YWdfYm94X2ZvbnRfZmFtaWx5JywgJycpKSwgJy5hbnRlbm5hLXJlYWN0aW9uLWJveCAuYW50ZW5uYS1yZXNldCcpO1xuICAgICAgICByZXR1cm4gY3VzdG9tQ1NTO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNyZWF0ZUN1c3RvbUNTU1J1bGUoZGVjbGFyYXRpb25zQWNjZXNzb3IsIHNlbGVjdG9yKSB7XG4gICAgICAgIHZhciBkZWNsYXJhdGlvbnMgPSBkZWNsYXJhdGlvbnNBY2Nlc3NvcigpLnRyaW0oKTtcbiAgICAgICAgaWYgKGRlY2xhcmF0aW9ucykge1xuICAgICAgICAgICAgcmV0dXJuICdcXG4nICsgc2VsZWN0b3IgKyAnIHtcXG4gICAgJyArIGRlY2xhcmF0aW9ucyArICdcXG59JztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gJyc7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWlncmF0ZVJlYWN0aW9uc0JhY2tncm91bmRDb2xvclNldHRpbmdzKGJhY2tncm91bmRDb2xvckFjY2Vzc29yKSB7XG4gICAgICAgIC8vIFRPRE86IFRoaXMgaXMgdGVtcG9yYXJ5IGNvZGUgdGhhdCBtaWdyYXRlcyB0aGUgY3VycmVudCB0YWdzX2JnX2NzcyBzZXR0aW5nIGZyb20gYSByYXcgdmFsdWUgdG8gYVxuICAgICAgICAvLyAgICAgICBDU1MgZGVjbGFyYXRpb24uIFdlIHNob3VsZCBtaWdyYXRlIGFsbCBkZXBsb3llZCBzaXRlcyB0byB1c2UgYSBDU1MgZGVjbGFyYXRpb24gYW5kIHRoZW4gcmVtb3ZlIHRoaXMuXG4gICAgICAgIHZhciBiYWNrZ3JvdW5kQ29sb3IgPSBiYWNrZ3JvdW5kQ29sb3JBY2Nlc3NvcigpLnRyaW0oKTtcbiAgICAgICAgaWYgKGJhY2tncm91bmRDb2xvciAmJiBiYWNrZ3JvdW5kQ29sb3IuaW5kZXhPZignYmFja2dyb3VuZCcpID09PSAtMSkge1xuICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yID0gJ2JhY2tncm91bmQtaW1hZ2U6ICcgKyBiYWNrZ3JvdW5kQ29sb3I7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIGJhY2tncm91bmRDb2xvcjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1pZ3JhdGVGb250RmFtaWx5U2V0dGluZyhmb250RmFtaWx5QWNjZXNzb3IpIHtcbiAgICAgICAgLy8gVE9ETzogVGhpcyBpcyB0ZW1wb3JhcnkgY29kZSB0aGF0IG1pZ3JhdGVzIHRoZSBjdXJyZW50IHRhZ19ib3hfZm9udF9mYW1pbHkgc2V0dGluZyBmcm9tIGEgcmF3IHZhbHVlIHRvIGFcbiAgICAgICAgLy8gICAgICAgQ1NTIGRlY2xhcmF0aW9uLiBXZSBzaG91bGQgbWlncmF0ZSBhbGwgZGVwbG95ZWQgc2l0ZXMgdG8gdXNlIGEgQ1NTIGRlY2xhcmF0aW9uIGFuZCB0aGVuIHJlbW92ZSB0aGlzLlxuICAgICAgICB2YXIgZm9udEZhbWlseSA9IGZvbnRGYW1pbHlBY2Nlc3NvcigpLnRyaW0oKTtcbiAgICAgICAgaWYgKGZvbnRGYW1pbHkgJiYgZm9udEZhbWlseS5pbmRleE9mKCdmb250LWZhbWlseScpID09PSAtMSkge1xuICAgICAgICAgICAgZm9udEZhbWlseSA9ICdmb250LWZhbWlseTogJyArIGZvbnRGYW1pbHk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIGZvbnRGYW1pbHk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtaWdyYXRlVGV4dENvbG9yU2V0dGluZ3ModGV4dENvbG9yQWNjZXNzb3IpIHtcbiAgICAgICAgLy8gVE9ETzogVGhpcyBpcyB0ZW1wb3JhcnkgY29kZSB0aGF0IG1pZ3JhdGVzIHRoZSBjdXJyZW50IHRhZ19ib3hfdGV4dF9jb2xvcnMgcHJvcGVydHksIHdoaWNoIGlzIGEgZGVjbGFyYXRpb25cbiAgICAgICAgLy8gICAgICAgdGhhdCBvbmx5IHNldHMgdGhlIGNvbG9yIHByb3BlcnR5LCB0byBzZXQgYm90aCB0aGUgY29sb3IgYW5kIGZpbGwgcHJvcGVydGllcy5cbiAgICAgICAgdmFyIHRleHRDb2xvciA9IHRleHRDb2xvckFjY2Vzc29yKCkudHJpbSgpO1xuICAgICAgICBpZiAodGV4dENvbG9yICYmIHRleHRDb2xvci5pbmRleE9mKCdjb2xvcjonKSA9PT0gMCAmJiB0ZXh0Q29sb3IuaW5kZXhPZignZmlsbDonKSA9PT0gLTEpIHtcbiAgICAgICAgICAgIHRleHRDb2xvciArPSB0ZXh0Q29sb3JbdGV4dENvbG9yLmxlbmd0aCAtIDFdID09ICc7JyA/ICcnIDogJzsnOyAvLyBhcHBlbmQgYSBzZW1pY29sb24gaWYgbmVlZGVkXG4gICAgICAgICAgICB0ZXh0Q29sb3IgKz0gdGV4dENvbG9yLnJlcGxhY2UoJ2NvbG9yOicsICdcXG4gICAgZmlsbDonKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gdGV4dENvbG9yO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgbGVnYWN5QmVoYXZpb3I6IGRhdGEoJ2xlZ2FjeV9iZWhhdmlvcicsIGZhbHNlKSwgLy8gVE9ETzogbWFrZSB0aGlzIHJlYWwgaW4gdGhlIHNlbnNlIHRoYXQgaXQgY29tZXMgYmFjayBmcm9tIHRoZSBzZXJ2ZXIgYW5kIHByb2JhYmx5IG1vdmUgdGhlIGZsYWcgdG8gdGhlIHBhZ2UgZGF0YS4gVW5saWtlbHkgdGhhdCB3ZSBuZWVkIHRvIG1haW50YWluIGxlZ2FjeSBiZWhhdmlvciBmb3IgbmV3IHBhZ2VzP1xuICAgICAgICBncm91cElkOiBkYXRhKCdpZCcpLFxuICAgICAgICBncm91cE5hbWU6IGRhdGEoJ25hbWUnKSxcbiAgICAgICAgYWN0aXZlU2VjdGlvbnM6IGRhdGEoJ2FjdGl2ZV9zZWN0aW9ucycpLFxuICAgICAgICB1cmw6IHtcbiAgICAgICAgICAgIGlnbm9yZVN1YmRvbWFpbjogZGF0YSgnaWdub3JlX3N1YmRvbWFpbicpLFxuICAgICAgICAgICAgaW5jbHVkZVF1ZXJ5U3RyaW5nOiBkYXRhKCdxdWVyeXN0cmluZ19jb250ZW50JyksXG4gICAgICAgICAgICBpZ25vcmVNZWRpYVVybFF1ZXJ5OiBkYXRhKCdtZWRpYV91cmxfaWdub3JlX3F1ZXJ5JyksXG4gICAgICAgICAgICBjYW5vbmljYWxEb21haW46IGRhdGEoJ3BhZ2VfdGxkJykgLy8gVE9ETzogd2hhdCB0byBjYWxsIHRoaXMgZXhhY3RseS4gZ3JvdXBEb21haW4/IHNpdGVEb21haW4/IGNhbm9uaWNhbERvbWFpbj9cbiAgICAgICAgfSxcbiAgICAgICAgc3VtbWFyeVNlbGVjdG9yOiBkYXRhKCdzdW1tYXJ5X3dpZGdldF9zZWxlY3RvcicpLFxuICAgICAgICBzdW1tYXJ5TWV0aG9kOiBkYXRhKCdzdW1tYXJ5X3dpZGdldF9tZXRob2QnKSxcbiAgICAgICAgaXNIaWRlT25Nb2JpbGU6IGRhdGEoJ2hpZGVPbk1vYmlsZScpLFxuICAgICAgICBpc0V4cGFuZGVkTW9iaWxlU3VtbWFyeTogZGF0YSgnc3VtbWFyeV93aWRnZXRfZXhwYW5kZWRfbW9iaWxlJyksXG4gICAgICAgIGlzSGlkZVRhcEhlbHBlcjogZGF0YSgnaGlkZURvdWJsZVRhcE1lc3NhZ2UnKSxcbiAgICAgICAgdGFwSGVscGVyUG9zaXRpb246IGRhdGEoJ2RvdWJsZVRhcE1lc3NhZ2VQb3NpdGlvbicpLFxuICAgICAgICBwYWdlU2VsZWN0b3I6IGRhdGEoJ3Bvc3Rfc2VsZWN0b3InKSxcbiAgICAgICAgcGFnZVVybFNlbGVjdG9yOiBkYXRhKCdwb3N0X2hyZWZfc2VsZWN0b3InKSxcbiAgICAgICAgcGFnZVVybEF0dHJpYnV0ZTogZGF0YSgncG9zdF9ocmVmX2F0dHJpYnV0ZScsICdocmVmJyksXG4gICAgICAgIHBhZ2VUaXRsZVNlbGVjdG9yOiBkYXRhKCdwb3N0X3RpdGxlX3NlbGVjdG9yJyksXG4gICAgICAgIHBhZ2VJbWFnZVNlbGVjdG9yOiBkYXRhKCdpbWFnZV9zZWxlY3RvcicpLFxuICAgICAgICBwYWdlSW1hZ2VBdHRyaWJ1dGU6IGRhdGEoJ2ltYWdlX2F0dHJpYnV0ZScpLFxuICAgICAgICBwYWdlQXV0aG9yU2VsZWN0b3I6IGRhdGEoJ2F1dGhvcl9zZWxlY3RvcicpLFxuICAgICAgICBwYWdlQXV0aG9yQXR0cmlidXRlOiBkYXRhKCdhdXRob3JfYXR0cmlidXRlJyksXG4gICAgICAgIHBhZ2VUb3BpY3NTZWxlY3RvcjogZGF0YSgndG9waWNzX3NlbGVjdG9yJyksXG4gICAgICAgIHBhZ2VUb3BpY3NBdHRyaWJ1dGU6IGRhdGEoJ3RvcGljc19hdHRyaWJ1dGUnKSxcbiAgICAgICAgcGFnZVNpdGVTZWN0aW9uU2VsZWN0b3I6IGRhdGEoJ3NlY3Rpb25fc2VsZWN0b3InKSxcbiAgICAgICAgcGFnZVNpdGVTZWN0aW9uQXR0cmlidXRlOiBkYXRhKCdzZWN0aW9uX2F0dHJpYnV0ZScpLFxuICAgICAgICBjb250ZW50U2VsZWN0b3I6IGRhdGEoJ2Fubm9fd2hpdGVsaXN0JyksXG4gICAgICAgIHRleHRJbmRpY2F0b3JMaW1pdDogZGF0YSgnaW5pdGlhbF9waW5fbGltaXQnKSxcbiAgICAgICAgZW5hYmxlVGV4dEhlbHBlcjogZGF0YSgncGFyYWdyYXBoX2hlbHBlcicpLFxuICAgICAgICBtZWRpYUluZGljYXRvckNvcm5lcjogZGF0YSgnaW1nX2luZGljYXRvcl9zaG93X3NpZGUnKSxcbiAgICAgICAgZ2VuZXJhdGVkQ3RhU2VsZWN0b3I6IGRhdGEoJ3NlcGFyYXRlX2N0YScpLFxuICAgICAgICBnZW5lcmF0ZWRDdGFFeHBhbmRlZDogZGF0YSgnc2VwYXJhdGVfY3RhX2V4cGFuZGVkJyksXG4gICAgICAgIHJlcXVpcmVzQXBwcm92YWw6IGRhdGEoJ3JlcXVpcmVzX2FwcHJvdmFsJyksXG4gICAgICAgIGRlZmF1bHRSZWFjdGlvbnM6IGRlZmF1bHRSZWFjdGlvbnMsXG4gICAgICAgIGN1c3RvbUNTUzogY29tcHV0ZUN1c3RvbUNTUyxcbiAgICAgICAgZXhjbHVzaW9uU2VsZWN0b3I6IGV4Y2x1c2lvblNlbGVjdG9yKCksXG4gICAgICAgIGxhbmd1YWdlOiBkYXRhKCdsYW5ndWFnZScpLFxuICAgICAgICB0d2l0dGVyQWNjb3VudDogZGF0YSgndHdpdHRlcicpLFxuICAgICAgICBpc1Nob3dDb250ZW50UmVjOiBkYXRhKCdzaG93X3JlY2lyYycpLFxuICAgICAgICBjb250ZW50UmVjU2VsZWN0b3I6IGRhdGEoJ3JlY2lyY19zZWxlY3RvcicpLFxuICAgICAgICBjb250ZW50UmVjVGl0bGU6IGRhdGEoJ3JlY2lyY190aXRsZScpLFxuICAgICAgICBjb250ZW50UmVjTWV0aG9kOiBkYXRhKCdyZWNpcmNfanF1ZXJ5X21ldGhvZCcpXG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlOiB1cGRhdGVGcm9tSlNPTixcbiAgICBnZXQ6IGdldEdyb3VwU2V0dGluZ3Ncbn07IiwiLy8gVGhpcyBtb2R1bGUgc3RvcmVzIG91ciBtYXBwaW5nIGZyb20gaGFzaCB2YWx1ZXMgdG8gdGhlaXIgY29ycmVzcG9uZGluZyBlbGVtZW50cyBpbiB0aGUgRE9NLiBUaGUgZGF0YSBpcyBvcmdhbml6ZWRcbi8vIGJ5IHBhZ2UgZm9yIHRoZSBibG9nIHJvbGwgY2FzZSwgd2hlcmUgbXVsdGlwbGUgcGFnZXMgb2YgZGF0YSBjYW4gYmUgbG9hZGVkIGF0IG9uY2UuXG52YXIgcGFnZXMgPSB7fTtcblxuZnVuY3Rpb24gZ2V0RWxlbWVudChjb250YWluZXJIYXNoLCBwYWdlSGFzaCkge1xuICAgIHZhciBjb250YWluZXJzID0gcGFnZXNbcGFnZUhhc2hdO1xuICAgIGlmIChjb250YWluZXJzKSB7XG4gICAgICAgIHJldHVybiBjb250YWluZXJzW2NvbnRhaW5lckhhc2hdO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gc2V0RWxlbWVudChjb250YWluZXJIYXNoLCBwYWdlSGFzaCwgZWxlbWVudCkge1xuICAgIHZhciBjb250YWluZXJzID0gcGFnZXNbcGFnZUhhc2hdO1xuICAgIGlmICghY29udGFpbmVycykge1xuICAgICAgICBjb250YWluZXJzID0gcGFnZXNbcGFnZUhhc2hdID0ge307XG4gICAgfVxuICAgIGNvbnRhaW5lcnNbY29udGFpbmVySGFzaF0gPSBlbGVtZW50O1xufVxuXG4vLyBXaGVuIHdlIGZpcnN0IHNjYW4gYSBwYWdlLCB0aGUgXCJoYXNoXCIgaXMganVzdCB0aGUgVVJMIHdoaWxlIHdlIHdhaXQgdG8gaGVhciBiYWNrIGZyb20gdGhlIHNlcnZlciwgdGhlbiBpdCdzIHVwZGF0ZWRcbi8vIHRvIHdoYXRldmVyIHZhbHVlIHRoZSBzZXJ2ZXIgY29tcHV0ZWQuIFNvIGhlcmUgd2UgYWxsb3cgb3VyIG1hcHBpbmcgdG8gYmUgdXBkYXRlZCB3aGVuIHRoYXQgY2hhbmdlIGhhcHBlbnMuXG5mdW5jdGlvbiB1cGRhdGVQYWdlSGFzaChvbGRQYWdlSGFzaCwgbmV3UGFnZUhhc2gpIHtcbiAgICBwYWdlc1tuZXdQYWdlSGFzaF0gPSBwYWdlc1tvbGRQYWdlSGFzaF07XG4gICAgZGVsZXRlIHBhZ2VzW29sZFBhZ2VIYXNoXTtcbn1cblxuZnVuY3Rpb24gdGVhcmRvd24oKSB7XG4gICAgcGFnZXMgPSB7fTtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGdldEVsZW1lbnQ6IGdldEVsZW1lbnQsXG4gICAgc2V0RWxlbWVudDogc2V0RWxlbWVudCxcbiAgICB1cGRhdGVQYWdlSGFzaDogdXBkYXRlUGFnZUhhc2gsXG4gICAgdGVhcmRvd246IHRlYXJkb3duXG59OyIsInZhciAkOyByZXF1aXJlKCcuL3V0aWxzL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIFJhY3RpdmU7IHJlcXVpcmUoJy4vdXRpbHMvcmFjdGl2ZS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihsb2FkZWRSYWN0aXZlKSB7IFJhY3RpdmUgPSBsb2FkZWRSYWN0aXZlO30pO1xudmFyIFJhbmdlID0gcmVxdWlyZSgnLi91dGlscy9yYW5nZScpO1xuXG52YXIgRXZlbnRzID0gcmVxdWlyZSgnLi9ldmVudHMnKTtcbnZhciBIYXNoZWRFbGVtZW50cyA9IHJlcXVpcmUoJy4vaGFzaGVkLWVsZW1lbnRzJyk7XG52YXIgUGFnZURhdGEgPSByZXF1aXJlKCcuL3BhZ2UtZGF0YScpO1xudmFyIFNWR3MgPSByZXF1aXJlKCcuL3N2Z3MnKTtcblxudmFyIHBhZ2VTZWxlY3RvciA9ICcuYW50ZW5uYS1sb2NhdGlvbnMtcGFnZSc7XG5cbmZ1bmN0aW9uIGNyZWF0ZVBhZ2Uob3B0aW9ucykge1xuICAgIHZhciBlbGVtZW50ID0gb3B0aW9ucy5lbGVtZW50O1xuICAgIHZhciByZWFjdGlvbkxvY2F0aW9uRGF0YSA9IG9wdGlvbnMucmVhY3Rpb25Mb2NhdGlvbkRhdGE7XG4gICAgdmFyIHBhZ2VEYXRhID0gb3B0aW9ucy5wYWdlRGF0YTtcbiAgICB2YXIgZ3JvdXBTZXR0aW5ncyA9IG9wdGlvbnMuZ3JvdXBTZXR0aW5ncztcbiAgICB2YXIgY2xvc2VXaW5kb3cgPSBvcHRpb25zLmNsb3NlV2luZG93O1xuICAgIHZhciBnb0JhY2sgPSBvcHRpb25zLmdvQmFjaztcbiAgICB2YXIgcmFjdGl2ZSA9IFJhY3RpdmUoe1xuICAgICAgICBlbDogZWxlbWVudCxcbiAgICAgICAgYXBwZW5kOiB0cnVlLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICBsb2NhdGlvbkRhdGE6IHJlYWN0aW9uTG9jYXRpb25EYXRhLFxuICAgICAgICAgICAgcGFnZVJlYWN0aW9uQ291bnQ6IHBhZ2VSZWFjdGlvbkNvdW50KHJlYWN0aW9uTG9jYXRpb25EYXRhKSxcbiAgICAgICAgICAgIGNhbkxvY2F0ZTogZnVuY3Rpb24oY29udGFpbmVySGFzaCkge1xuICAgICAgICAgICAgICAgIC8vIFRPRE86IGlzIHRoZXJlIGEgYmV0dGVyIHdheSB0byBoYW5kbGUgcmVhY3Rpb25zIHRvIGhhc2hlcyB0aGF0IGFyZSBubyBsb25nZXIgb24gdGhlIHBhZ2U/XG4gICAgICAgICAgICAgICAgLy8gICAgICAgc2hvdWxkIHdlIHByb3ZpZGUgc29tZSBraW5kIG9mIGluZGljYXRpb24gd2hlbiB3ZSBmYWlsIHRvIGxvY2F0ZSBhIGhhc2ggb3IganVzdCBsZWF2ZSBpdCBhcyBpcz9cbiAgICAgICAgICAgICAgICAvLyBUT0RPOiBEb2VzIGl0IG1ha2Ugc2Vuc2UgdG8gZXZlbiBzaG93IGVudHJpZXMgdGhhdCB3ZSBjYW4ndCBsb2NhdGU/IFByb2JhYmx5IG5vdC5cbiAgICAgICAgICAgICAgICByZXR1cm4gSGFzaGVkRWxlbWVudHMuZ2V0RWxlbWVudChjb250YWluZXJIYXNoLCBwYWdlRGF0YS5wYWdlSGFzaCkgIT09IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgdGVtcGxhdGU6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9sb2NhdGlvbnMtcGFnZS5oYnMuaHRtbCcpLFxuICAgICAgICBwYXJ0aWFsczoge1xuICAgICAgICAgICAgbGVmdDogU1ZHcy5sZWZ0LFxuICAgICAgICAgICAgZmlsbTogU1ZHcy5maWxtXG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByYWN0aXZlLm9uKCdiYWNrJywgZ29CYWNrKTtcbiAgICByYWN0aXZlLm9uKCdyZXZlYWwnLCByZXZlYWxDb250ZW50KTtcbiAgICByZXR1cm4ge1xuICAgICAgICBzZWxlY3RvcjogcGFnZVNlbGVjdG9yLFxuICAgICAgICB0ZWFyZG93bjogZnVuY3Rpb24oKSB7IHJhY3RpdmUudGVhcmRvd24oKTsgfVxuICAgIH07XG5cblxuICAgIGZ1bmN0aW9uIHJldmVhbENvbnRlbnQocmFjdGl2ZUV2ZW50KSB7XG4gICAgICAgIHZhciBsb2NhdGlvbkRhdGEgPSByYWN0aXZlRXZlbnQuY29udGV4dDtcbiAgICAgICAgdmFyIGVsZW1lbnQgPSBIYXNoZWRFbGVtZW50cy5nZXRFbGVtZW50KGxvY2F0aW9uRGF0YS5jb250YWluZXJIYXNoLCBwYWdlRGF0YS5wYWdlSGFzaCk7XG4gICAgICAgIGlmIChlbGVtZW50KSB7XG4gICAgICAgICAgICB2YXIgZXZlbnQgPSByYWN0aXZlRXZlbnQub3JpZ2luYWw7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICBjbG9zZVdpbmRvdygpO1xuICAgICAgICAgICAgdmFyIHRhcmdldFNjcm9sbFRvcCA9ICQoZWxlbWVudCkub2Zmc2V0KCkudG9wIC0gMTMwO1xuICAgICAgICAgICAgJCgnaHRtbCxib2R5JykuYW5pbWF0ZSh7c2Nyb2xsVG9wOiB0YXJnZXRTY3JvbGxUb3B9LCAxMDAwKTtcbiAgICAgICAgICAgIGlmIChsb2NhdGlvbkRhdGEua2luZCA9PT0gJ3R4dCcpIHsgLy8gVE9ETzogc29tZXRoaW5nIGJldHRlciB0aGFuIGEgc3RyaW5nIGNvbXBhcmUuIGZpeCB0aGlzIGFsb25nIHdpdGggdGhlIHNhbWUgaXNzdWUgaW4gcGFnZS1kYXRhXG4gICAgICAgICAgICAgICAgUmFuZ2UuaGlnaGxpZ2h0KGVsZW1lbnQuZ2V0KDApLCBsb2NhdGlvbkRhdGEubG9jYXRpb24pO1xuICAgICAgICAgICAgICAgICQoZG9jdW1lbnQpLm9uKCdjbGljay5hbnRlbm5hJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIFJhbmdlLmNsZWFySGlnaGxpZ2h0cygpO1xuICAgICAgICAgICAgICAgICAgICAkKGRvY3VtZW50KS5vZmYoJ2NsaWNrLmFudGVubmEnKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBjb250YWluZXJEYXRhID0gUGFnZURhdGEuZ2V0Q29udGFpbmVyRGF0YShwYWdlRGF0YSwgbG9jYXRpb25EYXRhLmNvbnRhaW5lckhhc2gpO1xuICAgICAgICAgICAgRXZlbnRzLnBvc3RDb250ZW50Vmlld2VkKHBhZ2VEYXRhLCBjb250YWluZXJEYXRhLGxvY2F0aW9uRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIHBhZ2VSZWFjdGlvbkNvdW50KHJlYWN0aW9uTG9jYXRpb25EYXRhKSB7XG4gICAgZm9yICh2YXIgY29udGVudElEIGluIHJlYWN0aW9uTG9jYXRpb25EYXRhKSB7XG4gICAgICAgIGlmIChyZWFjdGlvbkxvY2F0aW9uRGF0YS5oYXNPd25Qcm9wZXJ0eShjb250ZW50SUQpKSB7XG4gICAgICAgICAgICB2YXIgY29udGVudExvY2F0aW9uRGF0YSA9IHJlYWN0aW9uTG9jYXRpb25EYXRhW2NvbnRlbnRJRF07XG4gICAgICAgICAgICBpZiAoY29udGVudExvY2F0aW9uRGF0YS5raW5kID09PSAncGFnJykgeyAvLyBUT0RPOiBzb21ldGhpbmcgYmV0dGVyIHRoYW4gYSBzdHJpbmcgY29tcGFyZS4gZml4IHRoaXMgYWxvbmcgd2l0aCB0aGUgc2FtZSBpc3N1ZSBpbiBwYWdlLWRhdGFcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udGVudExvY2F0aW9uRGF0YS5jb3VudDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZTogY3JlYXRlUGFnZVxufTsiLCJ2YXIgUmFjdGl2ZTsgcmVxdWlyZSgnLi91dGlscy9yYWN0aXZlLXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGxvYWRlZFJhY3RpdmUpIHsgUmFjdGl2ZSA9IGxvYWRlZFJhY3RpdmU7fSk7XG52YXIgVVJMcyA9IHJlcXVpcmUoJy4vdXRpbHMvdXJscycpO1xudmFyIFhETUNsaWVudCA9IHJlcXVpcmUoJy4vdXRpbHMveGRtLWNsaWVudCcpO1xudmFyIFNWR3MgPSByZXF1aXJlKCcuL3N2Z3MnKTtcblxudmFyIHBhZ2VTZWxlY3RvciA9ICcuYW50ZW5uYS1sb2dpbi1wYWdlJztcblxuZnVuY3Rpb24gY3JlYXRlUGFnZShvcHRpb25zKSB7XG4gICAgdmFyIGdyb3VwU2V0dGluZ3MgPSBvcHRpb25zLmdyb3VwU2V0dGluZ3M7XG4gICAgdmFyIGdvQmFjayA9IG9wdGlvbnMuZ29CYWNrO1xuICAgIHZhciByZXRyeSA9IG9wdGlvbnMucmV0cnk7XG4gICAgdmFyIGVsZW1lbnQgPSBvcHRpb25zLmVsZW1lbnQ7XG4gICAgdmFyIHJhY3RpdmUgPSBSYWN0aXZlKHtcbiAgICAgICAgZWw6IGVsZW1lbnQsXG4gICAgICAgIGFwcGVuZDogdHJ1ZSxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgbG9naW5QYWdlVXJsOiBjb21wdXRlTG9naW5QYWdlVXJsKGdyb3VwU2V0dGluZ3MpXG4gICAgICAgIH0sXG4gICAgICAgIHRlbXBsYXRlOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvbG9naW4tcGFnZS5oYnMuaHRtbCcpLFxuICAgICAgICBwYXJ0aWFsczoge1xuICAgICAgICAgICAgbGVmdDogU1ZHcy5sZWZ0XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICBhZGRSZXNwb25zZUhhbmRsZXJzKCk7XG4gICAgcmFjdGl2ZS5vbignYmFjaycsIGZ1bmN0aW9uKCkge1xuICAgICAgICBjbGVhclJlc3BvbnNlSGFuZGxlcnMoKTtcbiAgICAgICAgZ29CYWNrKCk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgc2VsZWN0b3I6IHBhZ2VTZWxlY3RvcixcbiAgICAgICAgdGVhcmRvd246IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY2xlYXJSZXNwb25zZUhhbmRsZXJzKCk7XG4gICAgICAgICAgICByYWN0aXZlLnRlYXJkb3duKCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gYWRkUmVzcG9uc2VIYW5kbGVycygpIHtcbiAgICAgICAgWERNQ2xpZW50LmFkZFJlc3BvbnNlSGFuZGxlcihcImNsb3NlIGxvZ2luIHBhbmVsXCIsIGRvUmV0cnkpO1xuICAgICAgICBYRE1DbGllbnQuYWRkUmVzcG9uc2VIYW5kbGVyKFwiZ2V0VXNlckxvZ2luU3RhdGVcIiwgZG9SZXRyeSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY2xlYXJSZXNwb25zZUhhbmRsZXJzKCkge1xuICAgICAgICBYRE1DbGllbnQucmVtb3ZlUmVzcG9uc2VIYW5kbGVyKFwiY2xvc2UgbG9naW4gcGFuZWxcIiwgZG9SZXRyeSk7XG4gICAgICAgIFhETUNsaWVudC5yZW1vdmVSZXNwb25zZUhhbmRsZXIoXCJnZXRVc2VyTG9naW5TdGF0ZVwiLCBkb1JldHJ5KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkb1JldHJ5KCkge1xuICAgICAgICBjbGVhclJlc3BvbnNlSGFuZGxlcnMoKTtcbiAgICAgICAgcmV0cnkoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVMb2dpblBhZ2VVcmwoZ3JvdXBTZXR0aW5ncykge1xuICAgIHJldHVybiBVUkxzLmFwcFNlcnZlclVybCgpICsgVVJMcy5sb2dpblBhZ2VVcmwoKSArXG4gICAgICAgICc/cGFyZW50VXJsPScgKyB3aW5kb3cubG9jYXRpb24uaHJlZiArXG4gICAgICAgICcmcGFyZW50SG9zdD0nICsgd2luZG93LmxvY2F0aW9uLnByb3RvY29sICsgXCIvL1wiICsgd2luZG93LmxvY2F0aW9uLmhvc3QgK1xuICAgICAgICAnJmdyb3VwX2lkPScgKyBncm91cFNldHRpbmdzLmdyb3VwSWQoKSArXG4gICAgICAgICcmZ3JvdXBfbmFtZT0nICsgZ3JvdXBTZXR0aW5ncy5ncm91cE5hbWUoKTtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZVBhZ2U6IGNyZWF0ZVBhZ2Vcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgUmFjdGl2ZTsgcmVxdWlyZSgnLi91dGlscy9yYWN0aXZlLXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGxvYWRlZFJhY3RpdmUpIHsgUmFjdGl2ZSA9IGxvYWRlZFJhY3RpdmU7fSk7XG52YXIgUmVhY3Rpb25zV2lkZ2V0ID0gcmVxdWlyZSgnLi9yZWFjdGlvbnMtd2lkZ2V0Jyk7XG52YXIgU1ZHcyA9IHJlcXVpcmUoJy4vc3ZncycpO1xuXG52YXIgQXBwTW9kZSA9IHJlcXVpcmUoJy4vdXRpbHMvYXBwLW1vZGUnKTtcbnZhciBCcm93c2VyTWV0cmljcyA9IHJlcXVpcmUoJy4vdXRpbHMvYnJvd3Nlci1tZXRyaWNzJyk7XG52YXIgTXV0YXRpb25PYnNlcnZlciA9IHJlcXVpcmUoJy4vdXRpbHMvbXV0YXRpb24tb2JzZXJ2ZXInKTtcbnZhciBUaHJvdHRsZWRFdmVudHMgPSByZXF1aXJlKCcuL3V0aWxzL3Rocm90dGxlZC1ldmVudHMnKTtcbnZhciBUb3VjaFN1cHBvcnQgPSByZXF1aXJlKCcuL3V0aWxzL3RvdWNoLXN1cHBvcnQnKTtcbnZhciBWaXNpYmlsaXR5ID0gcmVxdWlyZSgnLi91dGlscy92aXNpYmlsaXR5Jyk7XG5cbnZhciBDTEFTU19BQ1RJVkUgPSAnYW50ZW5uYS1hY3RpdmUnO1xuXG5mdW5jdGlvbiBjcmVhdGVJbmRpY2F0b3JXaWRnZXQob3B0aW9ucykge1xuICAgIC8vIFRPRE86IHZhbGlkYXRlIHRoYXQgb3B0aW9ucyBjb250YWlucyBhbGwgcmVxdWlyZWQgcHJvcGVydGllcyAoYXBwbGllcyB0byBhbGwgd2lkZ2V0cykuXG4gICAgdmFyIGVsZW1lbnQgPSBvcHRpb25zLmVsZW1lbnQ7XG4gICAgdmFyIGNvbnRhaW5lckRhdGEgPSBvcHRpb25zLmNvbnRhaW5lckRhdGE7XG4gICAgdmFyICRjb250YWluZXJFbGVtZW50ID0gb3B0aW9ucy5jb250YWluZXJFbGVtZW50O1xuICAgIHZhciBwYWdlRGF0YSA9IG9wdGlvbnMucGFnZURhdGE7XG4gICAgdmFyIGdyb3VwU2V0dGluZ3MgPSBvcHRpb25zLmdyb3VwU2V0dGluZ3M7XG4gICAgdmFyIGRlZmF1bHRSZWFjdGlvbnMgPSBvcHRpb25zLmRlZmF1bHRSZWFjdGlvbnM7XG4gICAgdmFyIGNvbnRlbnREYXRhID0gb3B0aW9ucy5jb250ZW50RGF0YTtcbiAgICB2YXIgcmFjdGl2ZSA9IFJhY3RpdmUoe1xuICAgICAgICBlbDogZWxlbWVudCxcbiAgICAgICAgYXBwZW5kOiB0cnVlLFxuICAgICAgICBtYWdpYzogdHJ1ZSxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgY29udGFpbmVyRGF0YTogY29udGFpbmVyRGF0YSxcbiAgICAgICAgICAgIHN1cHBvcnRzVG91Y2g6IEJyb3dzZXJNZXRyaWNzLnN1cHBvcnRzVG91Y2goKSxcbiAgICAgICAgICAgIGV4dHJhQXR0cmlidXRlczogQXBwTW9kZS5kZWJ1ZyA/ICdhbnQtaGFzaD1cIicgKyBjb250YWluZXJEYXRhLmhhc2ggKyAnXCInIDogJycgLy8gVE9ETzogdGhpcyBhYm91dCBtYWtpbmcgdGhpcyBhIGRlY29yYXRvciBoYW5kbGVkIGJ5IGEgXCJEZWJ1Z1wiIG1vZHVsZVxuICAgICAgICB9LFxuICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL21lZGlhLWluZGljYXRvci13aWRnZXQuaGJzLmh0bWwnKSxcbiAgICAgICAgcGFydGlhbHM6IHtcbiAgICAgICAgICAgIGxvZ286IFNWR3MubG9nb1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICB2YXIgcmVhY3Rpb25XaWRnZXRPcHRpb25zID0ge1xuICAgICAgICByZWFjdGlvbnNEYXRhOiBjb250YWluZXJEYXRhLnJlYWN0aW9ucyxcbiAgICAgICAgY29udGFpbmVyRGF0YTogY29udGFpbmVyRGF0YSxcbiAgICAgICAgY29udGFpbmVyRWxlbWVudDogJGNvbnRhaW5lckVsZW1lbnQsXG4gICAgICAgIGNvbnRlbnREYXRhOiBjb250ZW50RGF0YSxcbiAgICAgICAgZGVmYXVsdFJlYWN0aW9uczogZGVmYXVsdFJlYWN0aW9ucyxcbiAgICAgICAgcGFnZURhdGE6IHBhZ2VEYXRhLFxuICAgICAgICBncm91cFNldHRpbmdzOiBncm91cFNldHRpbmdzXG4gICAgfTtcblxuICAgIHZhciBob3ZlclRpbWVvdXQ7XG4gICAgdmFyIGFjdGl2ZVRpbWVvdXQ7XG5cbiAgICB2YXIgJHJvb3RFbGVtZW50ID0gJChyb290RWxlbWVudChyYWN0aXZlKSk7XG4gICAgVG91Y2hTdXBwb3J0LnNldHVwVGFwKCRyb290RWxlbWVudC5nZXQoMCksIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBvcGVuUmVhY3Rpb25zV2luZG93KHJlYWN0aW9uV2lkZ2V0T3B0aW9ucywgcmFjdGl2ZSk7XG4gICAgfSk7XG4gICAgJHJvb3RFbGVtZW50Lm9uKCdtb3VzZWVudGVyLmFudGVubmEnLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBpZiAoZXZlbnQuYnV0dG9ucyA+IDAgfHwgKGV2ZW50LmJ1dHRvbnMgPT0gdW5kZWZpbmVkICYmIGV2ZW50LndoaWNoID4gMCkpIHsgLy8gT24gU2FmYXJpLCBldmVudC5idXR0b25zIGlzIHVuZGVmaW5lZCBidXQgZXZlbnQud2hpY2ggZ2l2ZXMgYSBnb29kIHZhbHVlLiBldmVudC53aGljaCBpcyBiYWQgb24gRkZcbiAgICAgICAgICAgIC8vIERvbid0IHJlYWN0IGlmIHRoZSB1c2VyIGlzIGRyYWdnaW5nIG9yIHNlbGVjdGluZyB0ZXh0LlxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjb250YWluZXJEYXRhLnJlYWN0aW9ucy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBvcGVuUmVhY3Rpb25zV2luZG93KHJlYWN0aW9uV2lkZ2V0T3B0aW9ucywgcmFjdGl2ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjbGVhclRpbWVvdXQoaG92ZXJUaW1lb3V0KTtcbiAgICAgICAgICAgIGhvdmVyVGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgb3BlblJlYWN0aW9uc1dpbmRvdyhyZWFjdGlvbldpZGdldE9wdGlvbnMsIHJhY3RpdmUpO1xuICAgICAgICAgICAgfSwgNTApO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgJHJvb3RFbGVtZW50Lm9uKCdtb3VzZWxlYXZlLmFudGVubmEnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KGhvdmVyVGltZW91dCk7XG4gICAgICAgIGNsZWFyVGltZW91dChhY3RpdmVUaW1lb3V0KTtcbiAgICB9KTtcbiAgICAkY29udGFpbmVyRWxlbWVudC5vbignbW91c2VlbnRlci5hbnRlbm5hJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIGNsZWFyVGltZW91dChhY3RpdmVUaW1lb3V0KTtcbiAgICAgICAgYWN0aXZlVGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAkcm9vdEVsZW1lbnQuYWRkQ2xhc3MoQ0xBU1NfQUNUSVZFKTtcbiAgICAgICAgfSwgNTAwKTtcbiAgICB9KTtcbiAgICAkY29udGFpbmVyRWxlbWVudC5vbignbW91c2VsZWF2ZS5hbnRlbm5hJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIGNsZWFyVGltZW91dChhY3RpdmVUaW1lb3V0KTtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICRyb290RWxlbWVudC5yZW1vdmVDbGFzcyhDTEFTU19BQ1RJVkUpO1xuICAgICAgICB9LCAxMDApOyAvLyBXZSBnZXQgYSBtb3VzZWxlYXZlIGV2ZW50IHdoZW4gdGhlIHVzZXIgaG92ZXJzIHRoZSBpbmRpY2F0b3IuIFBhdXNlIGxvbmcgZW5vdWdoIHRoYXQgdGhlIHJlYWN0aW9uIHdpbmRvdyBjYW4gb3BlbiBpZiB0aGV5IGhvdmVyLlxuICAgIH0pO1xuICAgIHNldHVwUG9zaXRpb25pbmcoJGNvbnRhaW5lckVsZW1lbnQsIGdyb3VwU2V0dGluZ3MsIHJhY3RpdmUpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgdGVhcmRvd246IGZ1bmN0aW9uKCkgeyByYWN0aXZlLnRlYXJkb3duKCk7IH1cbiAgICB9O1xufVxuXG5mdW5jdGlvbiBzZXR1cFBvc2l0aW9uaW5nKCRjb250YWluZXJFbGVtZW50LCBncm91cFNldHRpbmdzLCByYWN0aXZlKSB7XG4gICAgdmFyICR3cmFwcGVyRWxlbWVudCA9ICQod3JhcHBlckVsZW1lbnQocmFjdGl2ZSkpO1xuICAgIHZhciAkcm9vdEVsZW1lbnQgPSAkKHJvb3RFbGVtZW50KHJhY3RpdmUpKTtcbiAgICBwb3NpdGlvbkluZGljYXRvcigpO1xuXG4gICAgVGhyb3R0bGVkRXZlbnRzLm9uKCdyZXNpemUnLCBwb3NpdGlvbklmTmVlZGVkKTtcbiAgICByYWN0aXZlLm9uKCd0ZWFyZG93bicsIGZ1bmN0aW9uKCkge1xuICAgICAgICBUaHJvdHRsZWRFdmVudHMub2ZmKCdyZXNpemUnLCBwb3NpdGlvbklmTmVlZGVkKTtcbiAgICB9KTtcbiAgICBUaHJvdHRsZWRFdmVudHMub24oJ3Njcm9sbCcsIHBvc2l0aW9uSWZOZWVkZWQpO1xuICAgIHJhY3RpdmUub24oJ3RlYXJkb3duJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIFRocm90dGxlZEV2ZW50cy5vZmYoJ3Njcm9sbCcsIHBvc2l0aW9uSWZOZWVkZWQpO1xuICAgIH0pO1xuXG4gICAgLy8gVE9ETzogY29uc2lkZXIgYWxzbyBsaXN0ZW5pbmcgdG8gc3JjIGF0dHJpYnV0ZSBjaGFuZ2VzLCB3aGljaCBtaWdodCBhZmZlY3QgdGhlIGhlaWdodCBvZiBlbGVtZW50cyBvbiB0aGUgcGFnZVxuICAgIE11dGF0aW9uT2JzZXJ2ZXIuYWRkQWRkaXRpb25MaXN0ZW5lcihlbGVtZW50c0FkZGVkT3JSZW1vdmVkKTtcbiAgICBNdXRhdGlvbk9ic2VydmVyLmFkZFJlbW92YWxMaXN0ZW5lcihlbGVtZW50c1JlbW92ZWQpO1xuXG4gICAgZnVuY3Rpb24gZWxlbWVudHNSZW1vdmVkKCRlbGVtZW50cykge1xuICAgICAgICAvLyBTcGVjaWFsIGNhc2U6IElmIHdlIHNlZSB0aGF0IG91ciBvd24gcmVhZG1vcmUgZWxlbWVudHMgYXJlIHJlbW92ZWQsXG4gICAgICAgIC8vIGFsd2F5cyB1cGRhdGUgb3VyIGluZGljYXRvcnMgYmVjYXVzZSB0aGVpciB2aXNpYmlsaXR5IG1pZ2h0IGhhdmUgY2hhbmdlZC5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAkZWxlbWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciAkZWxlbWVudCA9ICRlbGVtZW50c1tpXTtcbiAgICAgICAgICAgIGlmICgkZWxlbWVudC5oYXNDbGFzcygnYW50ZW5uYS1yZWFkbW9yZScpfHwgJGVsZW1lbnQuaGFzQ2xhc3MoJ2FudGVubmEtY29udGVudC1yZWMtcmVhZG1vcmUnKSkge1xuICAgICAgICAgICAgICAgIHBvc2l0aW9uSW5kaWNhdG9yKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsZW1lbnRzQWRkZWRPclJlbW92ZWQoJGVsZW1lbnRzKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBlbGVtZW50c0FkZGVkT3JSZW1vdmVkKCRlbGVtZW50cykge1xuICAgICAgICAvLyBSZXBvc2l0aW9uIHRoZSBpbmRpY2F0b3IgaWYgZWxlbWVudHMgd2hpY2ggbWlnaHQgYWRqdXN0IHRoZSBjb250YWluZXIncyBwb3NpdGlvbiBhcmUgYWRkZWQvcmVtb3ZlZC5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAkZWxlbWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciAkZWxlbWVudCA9ICRlbGVtZW50c1tpXTtcbiAgICAgICAgICAgIGlmICgkZWxlbWVudC5oZWlnaHQoKSA+IDApIHtcbiAgICAgICAgICAgICAgICBwb3NpdGlvbklmTmVlZGVkKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgdmFyIGxhc3RDb250YWluZXJPZmZzZXQgPSAkY29udGFpbmVyRWxlbWVudC5vZmZzZXQoKTtcbiAgICB2YXIgbGFzdENvbnRhaW5lckhlaWdodCA9ICRjb250YWluZXJFbGVtZW50LmhlaWdodCgpO1xuXG4gICAgZnVuY3Rpb24gcG9zaXRpb25JZk5lZWRlZCgpIHtcbiAgICAgICAgdmFyIGNvbnRhaW5lck9mZnNldCA9ICRjb250YWluZXJFbGVtZW50Lm9mZnNldCgpO1xuICAgICAgICB2YXIgY29udGFpbmVySGVpZ2h0ID0gJGNvbnRhaW5lckVsZW1lbnQuaGVpZ2h0KCk7XG4gICAgICAgIGlmIChjb250YWluZXJPZmZzZXQudG9wID09PSBsYXN0Q29udGFpbmVyT2Zmc2V0LnRvcCAmJlxuICAgICAgICAgICAgY29udGFpbmVyT2Zmc2V0LmxlZnQgPT09IGxhc3RDb250YWluZXJPZmZzZXQubGVmdCAmJlxuICAgICAgICAgICAgY29udGFpbmVySGVpZ2h0ID09PSBsYXN0Q29udGFpbmVySGVpZ2h0KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgbGFzdENvbnRhaW5lck9mZnNldCA9IGNvbnRhaW5lck9mZnNldDtcbiAgICAgICAgbGFzdENvbnRhaW5lckhlaWdodCA9IGNvbnRhaW5lckhlaWdodDtcbiAgICAgICAgcG9zaXRpb25JbmRpY2F0b3IoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwb3NpdGlvbkluZGljYXRvcigpIHtcbiAgICAgICAgdXBkYXRlRGlzcGxheUZvclZpc2liaWxpdHkoKTsgLy8gVXBkYXRlIHZpc2liaWxpdHkgd2hlbmV2ZXIgd2UgcG9zaXRpb24gdGhlIGVsZW1lbnQuXG4gICAgICAgIC8vIFBvc2l0aW9uIHRoZSB3cmFwcGVyIGVsZW1lbnQgKHdoaWNoIGhhcyBhIGhhcmRjb2RlZCB3aWR0aCkgaW4gdGhlIGFwcHJvcHJpYXRlIGNvcm5lci4gVGhlbiBmbGlwIHRoZSBsZWZ0L3JpZ2h0XG4gICAgICAgIC8vIHBvc2l0aW9uaW5nIG9mIHRoZSBuZXN0ZWQgd2lkZ2V0IGVsZW1lbnQgdG8gYWRqdXN0IHRoZSB3YXkgaXQgd2lsbCBleHBhbmQgd2hlbiB0aGUgbWVkaWEgaXMgaG92ZXJlZC5cbiAgICAgICAgdmFyIGNvcm5lciA9IGdyb3VwU2V0dGluZ3MubWVkaWFJbmRpY2F0b3JDb3JuZXIoKTtcbiAgICAgICAgdmFyIGVsZW1lbnRPZmZzZXQgPSAkY29udGFpbmVyRWxlbWVudC5vZmZzZXQoKTtcbiAgICAgICAgdmFyIGNvb3JkcyA9IHt9O1xuICAgICAgICBpZiAoY29ybmVyLmluZGV4T2YoJ3RvcCcpICE9PSAtMSkge1xuICAgICAgICAgICAgY29vcmRzLnRvcCA9IGVsZW1lbnRPZmZzZXQudG9wO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyIGJvcmRlclRvcCA9IHBhcnNlSW50KCRjb250YWluZXJFbGVtZW50LmNzcygnYm9yZGVyLXRvcCcpKSB8fCAwO1xuICAgICAgICAgICAgY29vcmRzLnRvcCA9IGVsZW1lbnRPZmZzZXQudG9wICsgJGNvbnRhaW5lckVsZW1lbnQuaGVpZ2h0KCkgKyBib3JkZXJUb3AgLSAkcm9vdEVsZW1lbnQub3V0ZXJIZWlnaHQoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY29ybmVyLmluZGV4T2YoJ3JpZ2h0JykgIT09IC0xKSB7XG4gICAgICAgICAgICBjb29yZHMubGVmdCA9IGVsZW1lbnRPZmZzZXQubGVmdCArICRjb250YWluZXJFbGVtZW50LndpZHRoKCkgLSAkd3JhcHBlckVsZW1lbnQub3V0ZXJXaWR0aCgpO1xuICAgICAgICAgICAgJHJvb3RFbGVtZW50LmNzcyh7cmlnaHQ6MCxsZWZ0OicnfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgYm9yZGVyTGVmdCA9IHBhcnNlSW50KCRjb250YWluZXJFbGVtZW50LmNzcygnYm9yZGVyLWxlZnQnKSkgfHwgMDtcbiAgICAgICAgICAgIGNvb3Jkcy5sZWZ0ID0gZWxlbWVudE9mZnNldC5sZWZ0ICsgYm9yZGVyTGVmdDtcbiAgICAgICAgICAgICRyb290RWxlbWVudC5jc3Moe3JpZ2h0OicnLGxlZnQ6MH0pO1xuICAgICAgICB9XG4gICAgICAgICR3cmFwcGVyRWxlbWVudC5jc3MoY29vcmRzKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB1cGRhdGVEaXNwbGF5Rm9yVmlzaWJpbGl0eSgpIHtcbiAgICAgICAgLy8gSGlkZS9zaG93IHRoZSBpbmRpY2F0b3IgYmFzZWQgb24gd2hldGhlciB0aGUgY29udGFpbmVyIGVsZW1lbnQgaXMgdmlzaWJsZS5cbiAgICAgICAgLy8gRXhhbXBsZXMgb2Ygd2hlcmUgd2UgbmVlZCB0aGVyZSBhcmUgY2Fyb3VzZWxzIGFuZCBvdXIgb3duIHJlYWRtb3JlIHdpZGdldC5cbiAgICAgICAgJHJvb3RFbGVtZW50LmNzcyh7ZGlzcGxheTogVmlzaWJpbGl0eS5pc1Zpc2libGUoJGNvbnRhaW5lckVsZW1lbnQuZ2V0KDApKSA/ICcnOiAnbm9uZSd9KTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHdyYXBwZXJFbGVtZW50KHJhY3RpdmUpIHtcbiAgICByZXR1cm4gcmFjdGl2ZS5maW5kKCcuYW50ZW5uYS1tZWRpYS1pbmRpY2F0b3Itd3JhcHBlcicpO1xufVxuXG5mdW5jdGlvbiByb290RWxlbWVudChyYWN0aXZlKSB7XG4gICAgcmV0dXJuIHJhY3RpdmUuZmluZCgnLmFudGVubmEtbWVkaWEtaW5kaWNhdG9yLXdpZGdldCcpO1xufVxuXG5mdW5jdGlvbiBvcGVuUmVhY3Rpb25zV2luZG93KHJlYWN0aW9uT3B0aW9ucywgcmFjdGl2ZSkge1xuICAgIFJlYWN0aW9uc1dpZGdldC5vcGVuKHJlYWN0aW9uT3B0aW9ucywgcm9vdEVsZW1lbnQocmFjdGl2ZSkpO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlOiBjcmVhdGVJbmRpY2F0b3JXaWRnZXRcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgQWpheENsaWVudCA9IHJlcXVpcmUoJy4vdXRpbHMvYWpheC1jbGllbnQnKTtcbnZhciBQYWdlVXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzL3BhZ2UtdXRpbHMnKTtcbnZhciBUaHJvdHRsZWRFdmVudHMgPSByZXF1aXJlKCcuL3V0aWxzL3Rocm90dGxlZC1ldmVudHMnKTtcbnZhciBVUkxzID0gcmVxdWlyZSgnLi91dGlscy91cmxzJyk7XG52YXIgUGFnZURhdGEgPSByZXF1aXJlKCcuL3BhZ2UtZGF0YScpO1xuXG4vLyBDb21wdXRlIHRoZSBwYWdlcyB0aGF0IHdlIG5lZWQgdG8gZmV0Y2guIFRoaXMgaXMgZWl0aGVyOlxuLy8gMS4gQW55IG5lc3RlZCBwYWdlcyB3ZSBmaW5kIHVzaW5nIHRoZSBwYWdlIHNlbGVjdG9yIE9SXG4vLyAyLiBUaGUgY3VycmVudCB3aW5kb3cgbG9jYXRpb25cbmZ1bmN0aW9uIGNvbXB1dGVQYWdlc1BhcmFtKCRwYWdlRWxlbWVudEFycmF5LCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGdyb3VwSWQgPSBncm91cFNldHRpbmdzLmdyb3VwSWQoKTtcbiAgICB2YXIgcGFnZXMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8ICRwYWdlRWxlbWVudEFycmF5Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciAkcGFnZUVsZW1lbnQgPSAkcGFnZUVsZW1lbnRBcnJheVtpXTtcbiAgICAgICAgcGFnZXMucHVzaCh7XG4gICAgICAgICAgICBncm91cF9pZDogZ3JvdXBJZCxcbiAgICAgICAgICAgIHVybDogUGFnZVV0aWxzLmNvbXB1dGVQYWdlVXJsKCRwYWdlRWxlbWVudCwgZ3JvdXBTZXR0aW5ncyksXG4gICAgICAgICAgICB0aXRsZTogUGFnZVV0aWxzLmNvbXB1dGVQYWdlVGl0bGUoJHBhZ2VFbGVtZW50LCBncm91cFNldHRpbmdzKVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgaWYgKHBhZ2VzLmxlbmd0aCA9PSAxKSB7XG4gICAgICAgIHBhZ2VzWzBdLmltYWdlID0gUGFnZVV0aWxzLmNvbXB1dGVUb3BMZXZlbFBhZ2VJbWFnZShncm91cFNldHRpbmdzKTtcbiAgICAgICAgcGFnZXNbMF0uYXV0aG9yID0gUGFnZVV0aWxzLmNvbXB1dGVQYWdlQXV0aG9yKGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICBwYWdlc1swXS50b3BpY3MgPSBQYWdlVXRpbHMuY29tcHV0ZVBhZ2VUb3BpY3MoZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIHBhZ2VzWzBdLnNlY3Rpb24gPSBQYWdlVXRpbHMuY29tcHV0ZVBhZ2VTaXRlU2VjdGlvbihncm91cFNldHRpbmdzKTtcbiAgICB9XG5cbiAgICByZXR1cm4geyBwYWdlczogcGFnZXMgfTtcbn1cblxuZnVuY3Rpb24gbG9hZFBhZ2VEYXRhKHBhZ2VEYXRhUGFyYW0sIGdyb3VwU2V0dGluZ3MpIHtcbiAgICBBamF4Q2xpZW50LmdldEpTT05QKFVSTHMucGFnZURhdGFVcmwoKSwgcGFnZURhdGFQYXJhbSwgc3VjY2VzcywgZXJyb3IpO1xuXG4gICAgZnVuY3Rpb24gc3VjY2Vzcyhqc29uKSB7XG4gICAgICAgIC8vc2V0VGltZW91dChmdW5jdGlvbigpIHsgUGFnZURhdGEudXBkYXRlQWxsUGFnZURhdGEoanNvbiwgZ3JvdXBTZXR0aW5ncyk7IH0sIDMwMDApO1xuICAgICAgICBQYWdlRGF0YS51cGRhdGVBbGxQYWdlRGF0YShqc29uLCBncm91cFNldHRpbmdzKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBlcnJvcihtZXNzYWdlKSB7XG4gICAgICAgIC8vIFRPRE8gaGFuZGxlIGVycm9ycyB0aGF0IGhhcHBlbiB3aGVuIGxvYWRpbmcgcGFnZSBkYXRhXG4gICAgICAgIGNvbnNvbGUubG9nKCdBbiBlcnJvciBvY2N1cnJlZCBsb2FkaW5nIHBhZ2UgZGF0YTogJyArIG1lc3NhZ2UpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gc3RhcnRMb2FkaW5nUGFnZURhdGEoZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciAkcGFnZUVsZW1lbnRzID0gJChncm91cFNldHRpbmdzLnBhZ2VTZWxlY3RvcigpKTtcbiAgICBpZiAoJHBhZ2VFbGVtZW50cy5sZW5ndGggPT0gMCkge1xuICAgICAgICAkcGFnZUVsZW1lbnRzID0gJCgnYm9keScpO1xuICAgIH1cbiAgICBxdWV1ZVBhZ2VEYXRhTG9hZCgkcGFnZUVsZW1lbnRzLCBncm91cFNldHRpbmdzKTtcbn1cblxuZnVuY3Rpb24gcXVldWVQYWdlRGF0YUxvYWQoJHBhZ2VFbGVtZW50cywgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBwYWdlc1RvTG9hZCA9IFtdO1xuICAgICRwYWdlRWxlbWVudHMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRwYWdlRWxlbWVudCA9ICQodGhpcyk7XG4gICAgICAgIGlmIChpc0luVmlldygkcGFnZUVsZW1lbnQpKSB7XG4gICAgICAgICAgICBwYWdlc1RvTG9hZC5wdXNoKCRwYWdlRWxlbWVudCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsb2FkV2hlblZpc2libGUoJHBhZ2VFbGVtZW50LCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgaWYgKHBhZ2VzVG9Mb2FkLmxlbmd0aCA+IDApIHtcbiAgICAgICAgdmFyIHBhZ2VEYXRhUGFyYW0gPSBjb21wdXRlUGFnZXNQYXJhbShwYWdlc1RvTG9hZCwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIGxvYWRQYWdlRGF0YShwYWdlRGF0YVBhcmFtLCBncm91cFNldHRpbmdzKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGlzSW5WaWV3KCRlbGVtZW50KSB7XG4gICAgdmFyIHRyaWdnZXJEaXN0YW5jZSA9IDMwMDtcbiAgICByZXR1cm4gJGVsZW1lbnQub2Zmc2V0KCkudG9wIDwgICQoZG9jdW1lbnQpLnNjcm9sbFRvcCgpICsgJCh3aW5kb3cpLmhlaWdodCgpICsgdHJpZ2dlckRpc3RhbmNlO1xufVxuXG5mdW5jdGlvbiBsb2FkV2hlblZpc2libGUoJHBhZ2VFbGVtZW50LCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGNoZWNrVmlzaWJpbGl0eSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoaXNJblZpZXcoJHBhZ2VFbGVtZW50KSkge1xuICAgICAgICAgICAgdmFyIHBhZ2VEYXRhUGFyYW0gPSBjb21wdXRlUGFnZXNQYXJhbShbJHBhZ2VFbGVtZW50XSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICBsb2FkUGFnZURhdGEocGFnZURhdGFQYXJhbSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICBUaHJvdHRsZWRFdmVudHMub2ZmKCdzY3JvbGwnLCBjaGVja1Zpc2liaWxpdHkpO1xuICAgICAgICAgICAgVGhyb3R0bGVkRXZlbnRzLm9mZigncmVzaXplJywgY2hlY2tWaXNpYmlsaXR5KTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgVGhyb3R0bGVkRXZlbnRzLm9uKCdzY3JvbGwnLCBjaGVja1Zpc2liaWxpdHkpO1xuICAgIFRocm90dGxlZEV2ZW50cy5vbigncmVzaXplJywgY2hlY2tWaXNpYmlsaXR5KTtcbn1cblxuZnVuY3Rpb24gcGFnZXNBZGRlZCgkcGFnZUVsZW1lbnRzLCBncm91cFNldHRpbmdzKSB7XG4gICAgcXVldWVQYWdlRGF0YUxvYWQoJHBhZ2VFbGVtZW50cywgZ3JvdXBTZXR0aW5ncyk7XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBsb2FkOiBzdGFydExvYWRpbmdQYWdlRGF0YSxcbiAgICBwYWdlc0FkZGVkOiBwYWdlc0FkZGVkXG59OyIsInZhciAkOyByZXF1aXJlKCcuL3V0aWxzL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xuXG52YXIgRXZlbnRzID0gcmVxdWlyZSgnLi9ldmVudHMnKTtcbnZhciBIYXNoZWRFbGVtZW50cyA9IHJlcXVpcmUoJy4vaGFzaGVkLWVsZW1lbnRzJyk7XG5cbi8vIENvbGxlY3Rpb24gb2YgYWxsIHBhZ2UgZGF0YSwga2V5ZWQgYnkgcGFnZSBoYXNoXG52YXIgcGFnZXMgPSB7fTtcbi8vIE1hcHBpbmcgb2YgcGFnZSBVUkxzIHRvIHBhZ2UgaGFzaGVzLCB3aGljaCBhcmUgY29tcHV0ZWQgb24gdGhlIHNlcnZlci5cbnZhciB1cmxIYXNoZXMgPSB7fTtcblxuZnVuY3Rpb24gZ2V0UGFnZURhdGEoaGFzaCkge1xuICAgIHZhciBwYWdlRGF0YSA9IHBhZ2VzW2hhc2hdO1xuICAgIGlmICghcGFnZURhdGEpIHtcbiAgICAgICAgLy8gVE9ETzogR2l2ZSB0aGlzIHNlcmlvdXMgdGhvdWdodC4gSW4gb3JkZXIgZm9yIG1hZ2ljIG1vZGUgdG8gd29yaywgdGhlIG9iamVjdCBuZWVkcyB0byBoYXZlIHZhbHVlcyBpbiBwbGFjZSBmb3JcbiAgICAgICAgLy8gdGhlIG9ic2VydmVkIHByb3BlcnRpZXMgYXQgdGhlIG1vbWVudCB0aGUgcmFjdGl2ZSBpcyBjcmVhdGVkLiBCdXQgdGhpcyBpcyBwcmV0dHkgdW51c3VhbCBmb3IgSmF2YXNjcmlwdCwgdG8gaGF2ZVxuICAgICAgICAvLyB0byBkZWZpbmUgdGhlIHdob2xlIHNrZWxldG9uIGZvciB0aGUgb2JqZWN0IGluc3RlYWQgb2YganVzdCBhZGRpbmcgcHJvcGVydGllcyB3aGVuZXZlciB5b3Ugd2FudC5cbiAgICAgICAgLy8gVGhlIGFsdGVybmF0aXZlIHdvdWxkIGJlIGZvciB1cyB0byBrZWVwIG91ciBvd24gXCJkYXRhIGJpbmRpbmdcIiBiZXR3ZWVuIHRoZSBwYWdlRGF0YSBhbmQgcmFjdGl2ZSBpbnN0YW5jZXMgKDEgdG8gbWFueSlcbiAgICAgICAgLy8gYW5kIHRlbGwgdGhlIHJhY3RpdmVzIHRvIHVwZGF0ZSB3aGVuZXZlciB0aGUgZGF0YSBjaGFuZ2VzLlxuICAgICAgICBwYWdlRGF0YSA9IHtcbiAgICAgICAgICAgIHBhZ2VIYXNoOiBoYXNoLFxuICAgICAgICAgICAgc3VtbWFyeVJlYWN0aW9uczogW10sXG4gICAgICAgICAgICBzdW1tYXJ5VG90YWw6IDAsXG4gICAgICAgICAgICBzdW1tYXJ5TG9hZGVkOiBmYWxzZSxcbiAgICAgICAgICAgIGNvbnRhaW5lcnM6IFtdLFxuICAgICAgICAgICAgbWV0cmljczoge30gLy8gVGhpcyBpcyBhIGNhdGNoLWFsbCBmaWVsZCB3aGVyZSB3ZSBjYW4gYXR0YWNoIGNsaWVudC1zaWRlIG1ldHJpY3MgZm9yIGFuYWx5dGljc1xuICAgICAgICB9O1xuICAgICAgICBwYWdlc1toYXNoXSA9IHBhZ2VEYXRhO1xuICAgIH1cbiAgICByZXR1cm4gcGFnZURhdGE7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZUFsbFBhZ2VEYXRhKGpzb25QYWdlcywgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBhbGxQYWdlcyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwganNvblBhZ2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBwYWdlRGF0YSA9IHVwZGF0ZVBhZ2VEYXRhKGpzb25QYWdlc1tpXSwgZ3JvdXBTZXR0aW5ncylcbiAgICAgICAgYWxsUGFnZXMucHVzaChwYWdlRGF0YSk7XG4gICAgICAgIEV2ZW50cy5wb3N0UGFnZURhdGFMb2FkZWQocGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gdXBkYXRlUGFnZURhdGEoanNvbiwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBwYWdlRGF0YSA9IGdldFBhZ2VEYXRhRm9ySnNvblJlc3BvbnNlKGpzb24pO1xuICAgIHBhZ2VEYXRhLnBhZ2VJZCA9IGpzb24uaWQ7XG4gICAgcGFnZURhdGEucGFnZUhhc2ggPSBqc29uLnBhZ2VIYXNoO1xuICAgIHBhZ2VEYXRhLmdyb3VwSWQgPSBncm91cFNldHRpbmdzLmdyb3VwSWQoKTtcbiAgICBwYWdlRGF0YS5jYW5vbmljYWxVcmwgPSBqc29uLmNhbm9uaWNhbFVSTDtcbiAgICBwYWdlRGF0YS5yZXF1ZXN0ZWRVcmwgPSBqc29uLnJlcXVlc3RlZFVSTDtcbiAgICBwYWdlRGF0YS5hdXRob3IgPSBqc29uLmF1dGhvcjtcbiAgICBwYWdlRGF0YS5zZWN0aW9uID0ganNvbi5zZWN0aW9uO1xuICAgIHBhZ2VEYXRhLnRvcGljcyA9IGpzb24udG9waWNzO1xuICAgIHBhZ2VEYXRhLnRpdGxlID0ganNvbi50aXRsZTtcbiAgICBwYWdlRGF0YS5pbWFnZSA9IGpzb24uaW1hZ2U7XG5cbiAgICB2YXIgc3VtbWFyeVJlYWN0aW9ucyA9IGpzb24uc3VtbWFyeVJlYWN0aW9ucztcbiAgICBwYWdlRGF0YS5zdW1tYXJ5UmVhY3Rpb25zID0gc3VtbWFyeVJlYWN0aW9ucztcbiAgICBzZXRDb250YWluZXJzKHBhZ2VEYXRhLCBqc29uLmNvbnRhaW5lcnMpO1xuXG4gICAgLy8gV2UgYWRkIHVwIHRoZSBzdW1tYXJ5IHJlYWN0aW9uIHRvdGFsIGNsaWVudC1zaWRlXG4gICAgdmFyIHRvdGFsID0gMDtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN1bW1hcnlSZWFjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdG90YWwgPSB0b3RhbCArIHN1bW1hcnlSZWFjdGlvbnNbaV0uY291bnQ7XG4gICAgfVxuICAgIHBhZ2VEYXRhLnN1bW1hcnlUb3RhbCA9IHRvdGFsO1xuICAgIHBhZ2VEYXRhLnN1bW1hcnlMb2FkZWQgPSB0cnVlO1xuXG4gICAgLy8gV2UgYWRkIHVwIHRoZSBjb250YWluZXIgcmVhY3Rpb24gdG90YWxzIGNsaWVudC1zaWRlXG4gICAgdmFyIHRvdGFsID0gMDtcbiAgICB2YXIgY29udGFpbmVyQ291bnRzID0gW107XG4gICAgdmFyIGNvbnRhaW5lcnMgPSBwYWdlRGF0YS5jb250YWluZXJzO1xuICAgIGZvciAodmFyIGhhc2ggaW4ganNvbi5jb250YWluZXJzKSB7XG4gICAgICAgIGlmIChjb250YWluZXJzLmhhc093blByb3BlcnR5KGhhc2gpKSB7XG4gICAgICAgICAgICB2YXIgY29udGFpbmVyID0gY29udGFpbmVyc1toYXNoXTtcbiAgICAgICAgICAgIHZhciB0b3RhbCA9IDA7XG4gICAgICAgICAgICB2YXIgY29udGFpbmVyUmVhY3Rpb25zID0gY29udGFpbmVyLnJlYWN0aW9ucztcbiAgICAgICAgICAgIGlmIChjb250YWluZXJSZWFjdGlvbnMpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvbnRhaW5lclJlYWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICB0b3RhbCA9IHRvdGFsICsgY29udGFpbmVyUmVhY3Rpb25zW2ldLmNvdW50O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnRhaW5lci5yZWFjdGlvblRvdGFsID0gdG90YWw7XG4gICAgICAgICAgICBjb250YWluZXJDb3VudHMucHVzaCh7IGNvdW50OiB0b3RhbCwgY29udGFpbmVyOiBjb250YWluZXIgfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgdmFyIGluZGljYXRvckxpbWl0ID0gZ3JvdXBTZXR0aW5ncy50ZXh0SW5kaWNhdG9yTGltaXQoKTtcbiAgICBpZiAoaW5kaWNhdG9yTGltaXQpIHtcbiAgICAgICAgLy8gSWYgYW4gaW5kaWNhdG9yIGxpbWl0IGlzIHNldCwgc29ydCB0aGUgY29udGFpbmVycyBhbmQgbWFyayBvbmx5IHRoZSB0b3AgTiB0byBiZSB2aXNpYmxlLlxuICAgICAgICBjb250YWluZXJDb3VudHMuc29ydChmdW5jdGlvbihhLCBiKSB7IHJldHVybiBiLmNvdW50IC0gYS5jb3VudDsgfSk7IC8vIHNvcnQgbGFyZ2VzdCBjb3VudCBmaXJzdFxuICAgICAgICBmb3IgKHZhciBpID0gaW5kaWNhdG9yTGltaXQ7IGkgPCBjb250YWluZXJDb3VudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnRhaW5lckNvdW50c1tpXS5jb250YWluZXIuc3VwcHJlc3MgPSB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHBhZ2VEYXRhO1xufVxuXG5mdW5jdGlvbiBnZXRDb250YWluZXJEYXRhKHBhZ2VEYXRhLCBjb250YWluZXJIYXNoKSB7XG4gICAgdmFyIGNvbnRhaW5lckRhdGEgPSBwYWdlRGF0YS5jb250YWluZXJzW2NvbnRhaW5lckhhc2hdO1xuICAgIGlmICghY29udGFpbmVyRGF0YSkge1xuICAgICAgICBjb250YWluZXJEYXRhID0ge1xuICAgICAgICAgICAgaGFzaDogY29udGFpbmVySGFzaCxcbiAgICAgICAgICAgIHJlYWN0aW9uVG90YWw6IDAsXG4gICAgICAgICAgICByZWFjdGlvbnM6IFtdLFxuICAgICAgICAgICAgbG9hZGVkOiBwYWdlRGF0YS5zdW1tYXJ5TG9hZGVkLFxuICAgICAgICAgICAgc3VwcHJlc3M6IGZhbHNlXG4gICAgICAgIH07XG4gICAgICAgIHBhZ2VEYXRhLmNvbnRhaW5lcnNbY29udGFpbmVySGFzaF0gPSBjb250YWluZXJEYXRhO1xuICAgIH1cbiAgICByZXR1cm4gY29udGFpbmVyRGF0YTtcbn1cblxuLy8gTWVyZ2UgdGhlIGdpdmVuIGNvbnRhaW5lciBkYXRhIGludG8gdGhlIHBhZ2VEYXRhLmNvbnRhaW5lcnMgZGF0YS4gVGhpcyBpcyBuZWNlc3NhcnkgYmVjYXVzZSB0aGUgc2tlbGV0b24gb2YgdGhlIHBhZ2VEYXRhLmNvbnRhaW5lcnMgbWFwXG4vLyBpcyBzZXQgdXAgYW5kIGJvdW5kIHRvIHRoZSBVSSBiZWZvcmUgYWxsIHRoZSBkYXRhIGlzIGZldGNoZWQgZnJvbSB0aGUgc2VydmVyIGFuZCB3ZSBkb24ndCB3YW50IHRvIGJyZWFrIHRoZSBkYXRhIGJpbmRpbmcuXG5mdW5jdGlvbiBzZXRDb250YWluZXJzKHBhZ2VEYXRhLCBqc29uQ29udGFpbmVycykge1xuICAgIGZvciAodmFyIGhhc2ggaW4ganNvbkNvbnRhaW5lcnMpIHtcbiAgICAgICAgaWYgKGpzb25Db250YWluZXJzLmhhc093blByb3BlcnR5KGhhc2gpKSB7XG4gICAgICAgICAgICB2YXIgY29udGFpbmVyRGF0YSA9IGdldENvbnRhaW5lckRhdGEocGFnZURhdGEsIGhhc2gpO1xuICAgICAgICAgICAgdmFyIGZldGNoZWRDb250YWluZXJEYXRhID0ganNvbkNvbnRhaW5lcnNbaGFzaF07XG4gICAgICAgICAgICBjb250YWluZXJEYXRhLmlkID0gZmV0Y2hlZENvbnRhaW5lckRhdGEuaWQ7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGZldGNoZWRDb250YWluZXJEYXRhLnJlYWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGNvbnRhaW5lckRhdGEucmVhY3Rpb25zLnB1c2goZmV0Y2hlZENvbnRhaW5lckRhdGEucmVhY3Rpb25zW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICB2YXIgYWxsQ29udGFpbmVycyA9IHBhZ2VEYXRhLmNvbnRhaW5lcnM7XG4gICAgZm9yICh2YXIgaGFzaCBpbiBhbGxDb250YWluZXJzKSB7XG4gICAgICAgIGlmIChhbGxDb250YWluZXJzLmhhc093blByb3BlcnR5KGhhc2gpKSB7XG4gICAgICAgICAgICB2YXIgY29udGFpbmVyID0gYWxsQ29udGFpbmVyc1toYXNoXTtcbiAgICAgICAgICAgIGNvbnRhaW5lci5sb2FkZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBjbGVhckluZGljYXRvckxpbWl0KHBhZ2VEYXRhKSB7XG4gICAgdmFyIGNvbnRhaW5lcnMgPSBwYWdlRGF0YS5jb250YWluZXJzO1xuICAgIGZvciAodmFyIGhhc2ggaW4gY29udGFpbmVycykge1xuICAgICAgICBpZiAoY29udGFpbmVycy5oYXNPd25Qcm9wZXJ0eShoYXNoKSkge1xuICAgICAgICAgICAgdmFyIGNvbnRhaW5lciA9IGNvbnRhaW5lcnNbaGFzaF07XG4gICAgICAgICAgICBjb250YWluZXIuc3VwcHJlc3MgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLy8gUmV0dXJucyB0aGUgbG9jYXRpb25zIHdoZXJlIHRoZSBnaXZlbiByZWFjdGlvbiBvY2N1cnMgb24gdGhlIHBhZ2UuIFRoZSByZXR1cm4gZm9ybWF0IGlzOlxuLy8ge1xuLy8gICA8Y29udGVudF9pZD4gOiB7XG4vLyAgICAgY291bnQ6IDxudW1iZXI+LFxuLy8gICAgIGlkOiA8Y29udGVudF9pZD4sXG4vLyAgICAgY29udGFpbmVySUQ6IDxjb250YWluZXJfaWQ+XG4vLyAgICAga2luZDogPGNvbnRlbnQga2luZD4sXG4vLyAgICAgbG9jYXRpb246IDxsb2NhdGlvbj4sXG4vLyAgICAgW2JvZHk6IDxib2R5Pl0gZmlsbGVkIGluIGxhdGVyIHZpYSB1cGRhdGVMb2NhdGlvbkRhdGFcbi8vICAgfVxuLy8gfVxuZnVuY3Rpb24gZ2V0UmVhY3Rpb25Mb2NhdGlvbkRhdGEocmVhY3Rpb24sIHBhZ2VEYXRhKSB7XG4gICAgaWYgKCFwYWdlRGF0YS5sb2NhdGlvbkRhdGEpIHsgLy8gUG9wdWxhdGUgdGhpcyB0cmVlIGxhemlseSwgc2luY2UgaXQncyBub3QgZnJlcXVlbnRseSB1c2VkLlxuICAgICAgICBwYWdlRGF0YS5sb2NhdGlvbkRhdGEgPSBjb21wdXRlTG9jYXRpb25EYXRhKHBhZ2VEYXRhKTtcbiAgICB9XG4gICAgcmV0dXJuIHBhZ2VEYXRhLmxvY2F0aW9uRGF0YVtyZWFjdGlvbi5pZF07XG59XG5cbi8vIFJldHVybnMgYSB2aWV3IG9uIHRoZSBnaXZlbiB0cmVlIHN0cnVjdHVyZSB0aGF0J3Mgb3B0aW1pemVkIGZvciByZW5kZXJpbmcgdGhlIGxvY2F0aW9uIG9mIHJlYWN0aW9ucyAoYXMgZnJvbSB0aGVcbi8vIHN1bW1hcnkgd2lkZ2V0KS4gRm9yIGVhY2ggcmVhY3Rpb24sIHdlIGNhbiBxdWlja2x5IGdldCB0byB0aGUgcGllY2VzIG9mIGNvbnRlbnQgdGhhdCBoYXZlIHRoYXQgcmVhY3Rpb24gYXMgd2VsbCBhc1xuLy8gdGhlIGNvdW50IG9mIHRob3NlIHJlYWN0aW9ucyBmb3IgZWFjaCBwaWVjZSBvZiBjb250ZW50LlxuLy9cbi8vIFRoZSBzdHJ1Y3R1cmUgbG9va3MgbGlrZSB0aGlzOlxuLy8ge1xuLy8gICA8cmVhY3Rpb25faWQ+IDogeyAgICh0aGlzIGlzIHRoZSBpbnRlcmFjdGlvbl9ub2RlX2lkKVxuLy8gICAgIDxjb250ZW50X2lkPiA6IHtcbi8vICAgICAgIGNvdW50IDogPG51bWJlcj4sXG4vLyAgICAgICBjb250YWluZXJJRDogPGNvbnRhaW5lcl9pZD4sXG4vLyAgICAgICBraW5kOiA8Y29udGVudCBraW5kPixcbi8vICAgICAgIGxvY2F0aW9uOiA8bG9jYXRpb24+XG4vLyAgICAgICBbYm9keTogPGJvZHk+XSBmaWxsZWQgaW4gbGF0ZXIgdmlhIHVwZGF0ZUxvY2F0aW9uRGF0YVxuLy8gICAgIH1cbi8vICAgfVxuLy8gfVxuZnVuY3Rpb24gY29tcHV0ZUxvY2F0aW9uRGF0YShwYWdlRGF0YSkge1xuICAgIHZhciBsb2NhdGlvbkRhdGEgPSB7fTtcbiAgICB2YXIgY29udGFpbmVycyA9IHBhZ2VEYXRhLmNvbnRhaW5lcnM7XG4gICAgZm9yICh2YXIgaGFzaCBpbiBjb250YWluZXJzKSB7XG4gICAgICAgIGlmIChjb250YWluZXJzLmhhc093blByb3BlcnR5KGhhc2gpKSB7XG4gICAgICAgICAgICB2YXIgY29udGFpbmVyRGF0YSA9IGNvbnRhaW5lcnNbaGFzaF07XG4gICAgICAgICAgICB2YXIgcmVhY3Rpb25zID0gY29udGFpbmVyRGF0YS5yZWFjdGlvbnM7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJlYWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciByZWFjdGlvbiA9IHJlYWN0aW9uc1tpXTtcbiAgICAgICAgICAgICAgICB2YXIgcmVhY3Rpb25JZCA9IHJlYWN0aW9uLmlkO1xuICAgICAgICAgICAgICAgIHZhciBjb250ZW50ID0gcmVhY3Rpb24uY29udGVudDtcbiAgICAgICAgICAgICAgICB2YXIgY29udGVudElkID0gY29udGVudC5pZDtcbiAgICAgICAgICAgICAgICB2YXIgcmVhY3Rpb25Mb2NhdGlvbkRhdGEgPSBsb2NhdGlvbkRhdGFbcmVhY3Rpb25JZF07XG4gICAgICAgICAgICAgICAgaWYgKCFyZWFjdGlvbkxvY2F0aW9uRGF0YSkge1xuICAgICAgICAgICAgICAgICAgICByZWFjdGlvbkxvY2F0aW9uRGF0YSA9IHt9O1xuICAgICAgICAgICAgICAgICAgICBsb2NhdGlvbkRhdGFbcmVhY3Rpb25JZF0gPSByZWFjdGlvbkxvY2F0aW9uRGF0YTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIGNvbnRlbnRMb2NhdGlvbkRhdGEgPSByZWFjdGlvbkxvY2F0aW9uRGF0YVtjb250ZW50SWRdOyAvLyBUT0RPOiBJdCdzIG5vdCByZWFsbHkgcG9zc2libGUgdG8gZ2V0IGEgaGl0IGhlcmUsIGlzIGl0PyBXZSBzaG91bGQgbmV2ZXIgc2VlIHR3byBpbnN0YW5jZXMgb2YgdGhlIHNhbWUgcmVhY3Rpb24gZm9yIHRoZSBzYW1lIGNvbnRlbnQ/IChUaGVyZSdkIHdvdWxkIGp1c3QgYmUgb25lIGluc3RhbmNlIHdpdGggYSBjb3VudCA+IDEuKVxuICAgICAgICAgICAgICAgIGlmICghY29udGVudExvY2F0aW9uRGF0YSkge1xuICAgICAgICAgICAgICAgICAgICBjb250ZW50TG9jYXRpb25EYXRhID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY291bnQ6IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICBraW5kOiBjb250ZW50LmtpbmQsIC8vIFRPRE86IFdlIHNob3VsZCBub3JtYWxpemUgdGhpcyB2YWx1ZSB0byBhIHNldCBvZiBjb25zdGFudHMuIGZpeCB0aGlzIGluIGxvY2F0aW9ucy1wYWdlIHdoZXJlIHRoZSB2YWx1ZSBpcyByZWFkIGFzIHdlbGwuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiBhbHNvIGNvbnNpZGVyIHRyYW5zbGF0aW5nIHRoaXMgZnJvbSB0aGUgcmF3IFwia2luZFwiIHRvIFwidHlwZVwiLiAoZS5nLiBcInBhZ1wiID0+IFwicGFnZVwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgbG9jYXRpb246IGNvbnRlbnQubG9jYXRpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250YWluZXJIYXNoOiBjb250YWluZXJEYXRhLmhhc2gsXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50SWQ6IGNvbnRlbnRJZFxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICByZWFjdGlvbkxvY2F0aW9uRGF0YVtjb250ZW50SWRdID0gY29udGVudExvY2F0aW9uRGF0YTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29udGVudExvY2F0aW9uRGF0YS5jb3VudCArPSByZWFjdGlvbi5jb3VudDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbG9jYXRpb25EYXRhO1xufVxuXG5mdW5jdGlvbiB1cGRhdGVSZWFjdGlvbkxvY2F0aW9uRGF0YShyZWFjdGlvbkxvY2F0aW9uRGF0YSwgY29udGVudEJvZGllcykge1xuICAgIGZvciAodmFyIGNvbnRlbnRJZCBpbiBjb250ZW50Qm9kaWVzKSB7XG4gICAgICAgIGlmIChjb250ZW50Qm9kaWVzLmhhc093blByb3BlcnR5KGNvbnRlbnRJZCkpIHtcbiAgICAgICAgICAgIHZhciBjb250ZW50TG9jYXRpb25EYXRhID0gcmVhY3Rpb25Mb2NhdGlvbkRhdGFbY29udGVudElkXTtcbiAgICAgICAgICAgIGlmIChjb250ZW50TG9jYXRpb25EYXRhKSB7XG4gICAgICAgICAgICAgICAgY29udGVudExvY2F0aW9uRGF0YS5ib2R5ID0gY29udGVudEJvZGllc1tjb250ZW50SWRdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiByZWdpc3RlclJlYWN0aW9uKHJlYWN0aW9uLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSkge1xuICAgIHZhciBleGlzdGluZ1JlYWN0aW9ucyA9IGNvbnRhaW5lckRhdGEucmVhY3Rpb25zO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZXhpc3RpbmdSZWFjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGV4aXN0aW5nUmVhY3Rpb25zW2ldLmlkID09PSByZWFjdGlvbi5pZCkge1xuICAgICAgICAgICAgLy8gVGhpcyByZWFjdGlvbiBoYXMgYWxyZWFkeSBiZWVuIGFkZGVkIHRvIHRoaXMgY29udGFpbmVyLiBEb24ndCBhZGQgaXQgYWdhaW4uXG4gICAgICAgICAgICByZXR1cm4gZXhpc3RpbmdSZWFjdGlvbnNbaV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgY29udGFpbmVyRGF0YS5yZWFjdGlvbnMucHVzaChyZWFjdGlvbik7XG4gICAgY29udGFpbmVyRGF0YS5yZWFjdGlvblRvdGFsID0gY29udGFpbmVyRGF0YS5yZWFjdGlvblRvdGFsICsgMTtcbiAgICB2YXIgZXhpc3RzSW5TdW1tYXJ5ID0gZmFsc2U7XG4gICAgdmFyIGV4aXN0aW5nU3VtbWFyeVJlYWN0aW9ucyA9IHBhZ2VEYXRhLnN1bW1hcnlSZWFjdGlvbnM7XG4gICAgZm9yICh2YXIgaiA9IDA7IGogPCBleGlzdGluZ1N1bW1hcnlSZWFjdGlvbnMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgaWYgKGV4aXN0aW5nU3VtbWFyeVJlYWN0aW9uc1tqXS5pZCA9PT0gcmVhY3Rpb24uaWQpIHtcbiAgICAgICAgICAgIC8vIElmIHRoaXMgcmVhY3Rpb24gYWxyZWFkeSBleGlzdHMgaW4gdGhlIHN1bW1hcnksIGluY3JlbWVudCB0aGUgY291bnQuXG4gICAgICAgICAgICBleGlzdGluZ1N1bW1hcnlSZWFjdGlvbnNbal0uY291bnQgKz0gMTtcbiAgICAgICAgICAgIGV4aXN0c0luU3VtbWFyeSA9IHRydWU7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAoIWV4aXN0c0luU3VtbWFyeSkge1xuICAgICAgICB2YXIgc3VtbWFyeVJlYWN0aW9uID0ge1xuICAgICAgICAgICAgdGV4dDogcmVhY3Rpb24udGV4dCxcbiAgICAgICAgICAgIGlkOiByZWFjdGlvbi5pZCxcbiAgICAgICAgICAgIGNvdW50OiByZWFjdGlvbi5jb3VudFxuICAgICAgICB9O1xuICAgICAgICBwYWdlRGF0YS5zdW1tYXJ5UmVhY3Rpb25zLnB1c2goc3VtbWFyeVJlYWN0aW9uKTtcbiAgICB9XG4gICAgcGFnZURhdGEuc3VtbWFyeVRvdGFsID0gcGFnZURhdGEuc3VtbWFyeVRvdGFsICsgMTtcbiAgICByZXR1cm4gcmVhY3Rpb247XG59XG5cbi8vIEdldHMgcGFnZSBkYXRhIGJhc2VkIG9uIGEgVVJMLiBUaGlzIGFsbG93cyBvdXIgY2xpZW50IHRvIHN0YXJ0IHByb2Nlc3NpbmcgYSBwYWdlIChhbmQgYmluZGluZyBkYXRhIG9iamVjdHNcbi8vIHRvIHRoZSBVSSkgKmJlZm9yZSogd2UgZ2V0IGRhdGEgYmFjayBmcm9tIHRoZSBzZXJ2ZXIuXG5mdW5jdGlvbiBnZXRQYWdlRGF0YUJ5VVJMKHVybCkge1xuICAgIHZhciBzZXJ2ZXJIYXNoID0gdXJsSGFzaGVzW3VybF07XG4gICAgaWYgKHNlcnZlckhhc2gpIHtcbiAgICAgICAgLy8gSWYgdGhlIHNlcnZlciBhbHJlYWR5IGdpdmVuIHVzIHRoZSBoYXNoIGZvciB0aGUgcGFnZSwgdXNlIGl0LlxuICAgICAgICByZXR1cm4gZ2V0UGFnZURhdGEoc2VydmVySGFzaCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy8gT3RoZXJ3aXNlLCB0ZW1wb3JhcmlseSB1c2UgdGhlIHVybCBhcyB0aGUgaGFzaC4gVGhpcyB3aWxsIGdldCB1cGRhdGVkIHdoZW5ldmVyIHdlIGdldCBkYXRhIGJhY2sgZnJvbSB0aGUgc2VydmVyLlxuICAgICAgICByZXR1cm4gZ2V0UGFnZURhdGEodXJsKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGdldFBhZ2VEYXRhRm9ySnNvblJlc3BvbnNlKGpzb24pIHtcbiAgICB2YXIgcGFnZUhhc2ggPSBqc29uLnBhZ2VIYXNoO1xuICAgIHZhciByZXF1ZXN0ZWRVUkwgPSBqc29uLnJlcXVlc3RlZFVSTDtcbiAgICB1cmxIYXNoZXNbcmVxdWVzdGVkVVJMXSA9IHBhZ2VIYXNoO1xuICAgIHZhciB1cmxCYXNlZERhdGEgPSBwYWdlc1tyZXF1ZXN0ZWRVUkxdO1xuICAgIGlmICh1cmxCYXNlZERhdGEpIHtcbiAgICAgICAgLy8gSWYgd2UndmUgYWxyZWFkeSBjcmVhdGVkL2JvdW5kIGEgcGFnZURhdGEgb2JqZWN0IHVuZGVyIHRoZSByZXF1ZXN0ZWRVcmwsIHVwZGF0ZSB0aGUgcGFnZUhhc2ggYW5kIG1vdmUgdGhhdFxuICAgICAgICAvLyBkYXRhIG92ZXIgdG8gdGhlIGhhc2gga2V5XG4gICAgICAgIHVybEJhc2VkRGF0YS5wYWdlSGFzaCA9IGpzb24ucGFnZUhhc2g7XG4gICAgICAgIHBhZ2VzW3BhZ2VIYXNoXSA9IHVybEJhc2VkRGF0YTtcbiAgICAgICAgZGVsZXRlIHBhZ2VzW3JlcXVlc3RlZFVSTF07XG4gICAgICAgIC8vIFVwZGF0ZSB0aGUgbWFwcGluZyBvZiBoYXNoZXMgdG8gcGFnZSBlbGVtZW50cyBzbyBpdCBhbHNvIGtub3dzIGFib3V0IHRoZSBjaGFuZ2UgdG8gdGhlIHBhZ2UgaGFzaFxuICAgICAgICBIYXNoZWRFbGVtZW50cy51cGRhdGVQYWdlSGFzaChyZXF1ZXN0ZWRVUkwsIHBhZ2VIYXNoKTtcbiAgICB9XG4gICAgcmV0dXJuIGdldFBhZ2VEYXRhKHBhZ2VIYXNoKTtcbn1cblxuZnVuY3Rpb24gdGVhcmRvd24oKSB7XG4gICAgcGFnZXMgPSB7fTtcbiAgICB1cmxIYXNoZXMgPSB7fTtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGdldFBhZ2VEYXRhQnlVUkw6IGdldFBhZ2VEYXRhQnlVUkwsXG4gICAgZ2V0UGFnZURhdGE6IGdldFBhZ2VEYXRhLFxuICAgIHVwZGF0ZUFsbFBhZ2VEYXRhOiB1cGRhdGVBbGxQYWdlRGF0YSxcbiAgICBnZXRDb250YWluZXJEYXRhOiBnZXRDb250YWluZXJEYXRhLFxuICAgIGdldFJlYWN0aW9uTG9jYXRpb25EYXRhOiBnZXRSZWFjdGlvbkxvY2F0aW9uRGF0YSxcbiAgICB1cGRhdGVSZWFjdGlvbkxvY2F0aW9uRGF0YTogdXBkYXRlUmVhY3Rpb25Mb2NhdGlvbkRhdGEsXG4gICAgcmVnaXN0ZXJSZWFjdGlvbjogcmVnaXN0ZXJSZWFjdGlvbixcbiAgICBjbGVhckluZGljYXRvckxpbWl0OiBjbGVhckluZGljYXRvckxpbWl0LFxuICAgIHRlYXJkb3duOiB0ZWFyZG93bixcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgQXBwTW9kZSA9IHJlcXVpcmUoJy4vdXRpbHMvYXBwLW1vZGUnKTtcbnZhciBCcm93c2VyTWV0cmljcyA9IHJlcXVpcmUoJy4vdXRpbHMvYnJvd3Nlci1tZXRyaWNzJyk7XG52YXIgSGFzaCA9IHJlcXVpcmUoJy4vdXRpbHMvaGFzaCcpO1xudmFyIE11dGF0aW9uT2JzZXJ2ZXIgPSByZXF1aXJlKCcuL3V0aWxzL211dGF0aW9uLW9ic2VydmVyJyk7XG52YXIgUGFnZVV0aWxzID0gcmVxdWlyZSgnLi91dGlscy9wYWdlLXV0aWxzJyk7XG52YXIgU2VnbWVudCA9IHJlcXVpcmUoJy4vdXRpbHMvc2VnbWVudCcpO1xudmFyIFVSTHMgPSByZXF1aXJlKCcuL3V0aWxzL3VybHMnKTtcbnZhciBXaWRnZXRCdWNrZXQgPSByZXF1aXJlKCcuL3V0aWxzL3dpZGdldC1idWNrZXQnKTtcblxudmFyIEF1dG9DYWxsVG9BY3Rpb24gPSByZXF1aXJlKCcuL2F1dG8tY2FsbC10by1hY3Rpb24nKTtcbnZhciBDYWxsVG9BY3Rpb25JbmRpY2F0b3IgPSByZXF1aXJlKCcuL2NhbGwtdG8tYWN0aW9uLWluZGljYXRvcicpO1xudmFyIENvbnRlbnRSZWMgPSByZXF1aXJlKCcuL2NvbnRlbnQtcmVjLXdpZGdldCcpO1xudmFyIEhhc2hlZEVsZW1lbnRzID0gcmVxdWlyZSgnLi9oYXNoZWQtZWxlbWVudHMnKTtcbnZhciBNZWRpYUluZGljYXRvcldpZGdldCA9IHJlcXVpcmUoJy4vbWVkaWEtaW5kaWNhdG9yLXdpZGdldCcpO1xudmFyIFBhZ2VEYXRhID0gcmVxdWlyZSgnLi9wYWdlLWRhdGEnKTtcbnZhciBQYWdlRGF0YUxvYWRlciA9IHJlcXVpcmUoJy4vcGFnZS1kYXRhLWxvYWRlcicpO1xudmFyIFJlYWRNb3JlRXZlbnRzID0gcmVxdWlyZSgnLi9yZWFkbW9yZS1ldmVudHMnKTtcbnZhciBTdW1tYXJ5V2lkZ2V0ID0gcmVxdWlyZSgnLi9zdW1tYXJ5LXdpZGdldCcpO1xudmFyIFRleHRJbmRpY2F0b3JXaWRnZXQgPSByZXF1aXJlKCcuL3RleHQtaW5kaWNhdG9yLXdpZGdldCcpO1xudmFyIFRleHRSZWFjdGlvbnMgPSByZXF1aXJlKCcuL3RleHQtcmVhY3Rpb25zJyk7XG5cbnZhciBUWVBFX1RFWFQgPSBcInRleHRcIjtcbnZhciBUWVBFX0lNQUdFID0gXCJpbWFnZVwiO1xudmFyIFRZUEVfTUVESUEgPSBcIm1lZGlhXCI7XG5cbnZhciBBVFRSX0hBU0ggPSBcImFudC1oYXNoXCI7XG5cbnZhciBjcmVhdGVkV2lkZ2V0cyA9IFtdO1xuXG5cbi8vIFNjYW4gZm9yIGFsbCBwYWdlcyBhdCB0aGUgY3VycmVudCBicm93c2VyIGxvY2F0aW9uLiBUaGlzIGNvdWxkIGp1c3QgYmUgdGhlIGN1cnJlbnQgcGFnZSBvciBpdCBjb3VsZCBiZSBhIGNvbGxlY3Rpb25cbi8vIG9mIHBhZ2VzIChha2EgJ3Bvc3RzJykuXG5mdW5jdGlvbiBzY2FuQWxsUGFnZXMoZ3JvdXBTZXR0aW5ncywgcmVpbml0aWFsaXplQ2FsbGJhY2spIHtcbiAgICAkKGdyb3VwU2V0dGluZ3MuZXhjbHVzaW9uU2VsZWN0b3IoKSkuYWRkQ2xhc3MoJ25vLWFudCcpOyAvLyBBZGQgdGhlIG5vLWFudCBjbGFzcyB0byBldmVyeXRoaW5nIHRoYXQgaXMgZmxhZ2dlZCBmb3IgZXhjbHVzaW9uXG4gICAgdmFyICRwYWdlcyA9ICQoZ3JvdXBTZXR0aW5ncy5wYWdlU2VsZWN0b3IoKSk7IC8vIFRPRE86IG5vLWFudD9cbiAgICBpZiAoJHBhZ2VzLmxlbmd0aCA9PSAwKSB7XG4gICAgICAgIC8vIElmIHdlIGRvbid0IGRldGVjdCBhbnkgcGFnZSBtYXJrZXJzLCB0cmVhdCB0aGUgd2hvbGUgZG9jdW1lbnQgYXMgdGhlIHNpbmdsZSBwYWdlXG4gICAgICAgICRwYWdlcyA9ICQoJ2JvZHknKTsgLy8gVE9ETzogSXMgdGhpcyB0aGUgcmlnaHQgYmVoYXZpb3I/IChLZWVwIGluIHN5bmMgd2l0aCB0aGUgc2FtZSBhc3N1bXB0aW9uIHRoYXQncyBidWlsdCBpbnRvIHBhZ2UtZGF0YS1sb2FkZXIuKVxuICAgIH1cbiAgICAkcGFnZXMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRwYWdlID0gJCh0aGlzKTtcbiAgICAgICAgc2NhblBhZ2UoJHBhZ2UsIGdyb3VwU2V0dGluZ3MsICRwYWdlcy5sZW5ndGggPiAxKTtcbiAgICB9KTtcbiAgICBzZXR1cE11dGF0aW9uT2JzZXJ2ZXIoZ3JvdXBTZXR0aW5ncywgcmVpbml0aWFsaXplQ2FsbGJhY2spO1xufVxuXG4vLyBTY2FuIHRoZSBwYWdlIHVzaW5nIHRoZSBnaXZlbiBzZXR0aW5nczpcbi8vIDEuIEZpbmQgYWxsIHRoZSBjb250YWluZXJzIHRoYXQgd2UgY2FyZSBhYm91dC5cbi8vIDIuIENvbXB1dGUgaGFzaGVzIGZvciBlYWNoIGNvbnRhaW5lci5cbi8vIDMuIEluc2VydCB3aWRnZXQgYWZmb3JkYW5jZXMgZm9yIGVhY2ggd2hpY2ggYXJlIGJvdW5kIHRvIHRoZSBkYXRhIG1vZGVsIGJ5IHRoZSBoYXNoZXMuXG5mdW5jdGlvbiBzY2FuUGFnZSgkcGFnZSwgZ3JvdXBTZXR0aW5ncywgaXNNdWx0aVBhZ2UpIHtcbiAgICB2YXIgdXJsID0gUGFnZVV0aWxzLmNvbXB1dGVQYWdlVXJsKCRwYWdlLCBncm91cFNldHRpbmdzKTtcbiAgICB2YXIgcGFnZURhdGEgPSBQYWdlRGF0YS5nZXRQYWdlRGF0YUJ5VVJMKHVybCk7XG4gICAgdmFyICRhY3RpdmVTZWN0aW9ucyA9IGZpbmQoJHBhZ2UsIGdyb3VwU2V0dGluZ3MuYWN0aXZlU2VjdGlvbnMoKSwgdHJ1ZSk7XG5cbiAgICAvLyBGaXJzdCwgc2NhbiBmb3IgZWxlbWVudHMgdGhhdCB3b3VsZCBjYXVzZSB1cyB0byBpbnNlcnQgc29tZXRoaW5nIGludG8gdGhlIERPTSB0aGF0IHRha2VzIHVwIHNwYWNlLlxuICAgIC8vIFdlIHdhbnQgdG8gZ2V0IGFueSBwYWdlIHJlc2l6aW5nIG91dCBvZiB0aGUgd2F5IGFzIGVhcmx5IGFzIHBvc3NpYmxlLlxuICAgIC8vIFRPRE86IENvbnNpZGVyIGRvaW5nIHRoaXMgd2l0aCByYXcgSmF2YXNjcmlwdCBiZWZvcmUgalF1ZXJ5IGxvYWRzLCB0byBmdXJ0aGVyIHJlZHVjZSB0aGUgZGVsYXkuIFdlIHdvdWxkbid0XG4gICAgLy8gc2F2ZSBhICp0b24qIG9mIHRpbWUgZnJvbSB0aGlzLCB0aG91Z2gsIHNvIGl0J3MgZGVmaW5pdGVseSBhIGxhdGVyIG9wdGltaXphdGlvbi5cbiAgICBzY2FuRm9yU3VtbWFyaWVzKCRwYWdlLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7IC8vIFN1bW1hcnkgd2lkZ2V0IG1heSBiZSBvbiB0aGUgcGFnZSwgYnV0IG91dHNpZGUgdGhlIGFjdGl2ZSBzZWN0aW9uXG4gICAgc2NhbkZvclJlYWRNb3JlKCRwYWdlLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgc2NhbkZvckNvbnRlbnRSZWMoJHBhZ2UsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICAkYWN0aXZlU2VjdGlvbnMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRzZWN0aW9uID0gJCh0aGlzKTtcbiAgICAgICAgY3JlYXRlQXV0b0NhbGxzVG9BY3Rpb24oJHNlY3Rpb24sIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICB9KTtcbiAgICAvLyBTY2FuIGZvciBDVEFzIGFjcm9zcyB0aGUgZW50aXJlIHBhZ2UgKHRoZXkgY2FuIGJlIG91dHNpZGUgYW4gYWN0aXZlIHNlY3Rpb24pLiBDVEFzIGhhdmUgdG8gZ28gYmVmb3JlIHNjYW5zIGZvclxuICAgIC8vIGNvbnRlbnQgYmVjYXVzZSBjb250ZW50IGludm9sdmVkIGluIENUQXMgd2lsbCBiZSB0YWdnZWQgbm8tYW50LlxuICAgIHNjYW5Gb3JDYWxsc1RvQWN0aW9uKCRwYWdlLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgLy8gVGhlbiBzY2FuIGZvciBldmVyeXRoaW5nIGVsc2VcbiAgICAkYWN0aXZlU2VjdGlvbnMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRzZWN0aW9uID0gJCh0aGlzKTtcbiAgICAgICAgc2NhbkFjdGl2ZUVsZW1lbnQoJHNlY3Rpb24sIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICB9KTtcblxuICAgIHBhZ2VEYXRhLm1ldHJpY3MuaGVpZ2h0ID0gY29tcHV0ZVBhZ2VIZWlnaHQoJGFjdGl2ZVNlY3Rpb25zKTtcbiAgICBwYWdlRGF0YS5tZXRyaWNzLmlzTXVsdGlQYWdlID0gaXNNdWx0aVBhZ2U7XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVQYWdlSGVpZ2h0KCRhY3RpdmVTZWN0aW9ucykge1xuICAgIHZhciBjb250ZW50VG9wO1xuICAgIHZhciBjb250ZW50Qm90dG9tO1xuICAgICRhY3RpdmVTZWN0aW9ucy5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgJHNlY3Rpb24gPSAkKHRoaXMpO1xuICAgICAgICB2YXIgb2Zmc2V0ID0gJHNlY3Rpb24ub2Zmc2V0KCk7XG4gICAgICAgIGNvbnRlbnRUb3AgPSBjb250ZW50VG9wID09PSB1bmRlZmluZWQgPyBvZmZzZXQudG9wIDogTWF0aC5taW4oY29udGVudFRvcCwgb2Zmc2V0LnRvcCk7XG4gICAgICAgIHZhciBib3R0b20gPSBvZmZzZXQudG9wICsgJHNlY3Rpb24ub3V0ZXJIZWlnaHQoKTtcbiAgICAgICAgY29udGVudEJvdHRvbSA9IGNvbnRlbnRCb3R0b20gPT09IHVuZGVmaW5lZCA/IGJvdHRvbSA6IE1hdGgubWF4KGNvbnRlbnRCb3R0b20sIGJvdHRvbSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIGNvbnRlbnRCb3R0b20gLSBjb250ZW50VG9wO1xufVxuXG4vLyBTY2FucyB0aGUgZ2l2ZW4gZWxlbWVudCwgd2hpY2ggYXBwZWFycyBpbnNpZGUgYW4gYWN0aXZlIHNlY3Rpb24uIFRoZSBlbGVtZW50IGNhbiBiZSB0aGUgZW50aXJlIGFjdGl2ZSBzZWN0aW9uLFxuLy8gc29tZSBjb250YWluZXIgd2l0aGluIHRoZSBhY3RpdmUgc2VjdGlvbiwgb3IgYSBsZWFmIG5vZGUgaW4gdGhlIGFjdGl2ZSBzZWN0aW9uLlxuZnVuY3Rpb24gc2NhbkFjdGl2ZUVsZW1lbnQoJGVsZW1lbnQsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgc2NhbkZvckNvbnRlbnQoJGVsZW1lbnQsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbn1cblxuZnVuY3Rpb24gc2NhbkZvclN1bW1hcmllcygkZWxlbWVudCwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgJHN1bW1hcmllcyA9IGZpbmQoJGVsZW1lbnQsIGdyb3VwU2V0dGluZ3Muc3VtbWFyeVNlbGVjdG9yKCksIHRydWUsIHRydWUpOyAvLyBzdW1tYXJ5IHdpZGdldHMgY2FuIGJlIGluc2lkZSBuby1hbnQgc2VjdGlvbnNcbiAgICAkc3VtbWFyaWVzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkc3VtbWFyeSA9ICQodGhpcyk7XG4gICAgICAgIHZhciBjb250YWluZXJEYXRhID0gUGFnZURhdGEuZ2V0Q29udGFpbmVyRGF0YShwYWdlRGF0YSwgJ3BhZ2UnKTsgLy8gTWFnaWMgaGFzaCBmb3IgcGFnZSByZWFjdGlvbnNcbiAgICAgICAgY29udGFpbmVyRGF0YS50eXBlID0gJ3BhZ2UnOyAvLyBUT0RPOiByZXZpc2l0IHdoZXRoZXIgaXQgbWFrZXMgc2Vuc2UgdG8gc2V0IHRoZSB0eXBlIGhlcmVcbiAgICAgICAgdmFyIGRlZmF1bHRSZWFjdGlvbnMgPSBncm91cFNldHRpbmdzLmRlZmF1bHRSZWFjdGlvbnMoJHN1bW1hcnkpOyAvLyBUT0RPOiBkbyB3ZSBzdXBwb3J0IGN1c3RvbWl6aW5nIHRoZSBkZWZhdWx0IHJlYWN0aW9ucyBhdCB0aGlzIGxldmVsP1xuICAgICAgICB2YXIgc3VtbWFyeVdpZGdldCA9IFN1bW1hcnlXaWRnZXQuY3JlYXRlKGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBkZWZhdWx0UmVhY3Rpb25zLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgdmFyICRzdW1tYXJ5RWxlbWVudCA9IHN1bW1hcnlXaWRnZXQuZWxlbWVudDtcbiAgICAgICAgaW5zZXJ0Q29udGVudCgkc3VtbWFyeSwgJHN1bW1hcnlFbGVtZW50LCBncm91cFNldHRpbmdzLnN1bW1hcnlNZXRob2QoKSk7XG4gICAgICAgIGNyZWF0ZWRXaWRnZXRzLnB1c2goc3VtbWFyeVdpZGdldCk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIHNjYW5Gb3JSZWFkTW9yZSgkZWxlbWVudCwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICBSZWFkTW9yZUV2ZW50cy5zZXR1cFJlYWRNb3JlRXZlbnRzKCRlbGVtZW50LmdldCgwKSwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpO1xufVxuXG5mdW5jdGlvbiBzY2FuRm9yQ29udGVudFJlYygkZWxlbWVudCwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICBpZiAoZ3JvdXBTZXR0aW5ncy5pc1Nob3dDb250ZW50UmVjKCkgJiYgQnJvd3Nlck1ldHJpY3MuaXNNb2JpbGUoKSAmJiBTZWdtZW50LmlzSW5Db250ZW50UmVjU2VnbWVudChncm91cFNldHRpbmdzKSkge1xuICAgICAgICB2YXIgJGNvbnRlbnRSZWNMb2NhdGlvbnMgPSBmaW5kKCRlbGVtZW50LCBncm91cFNldHRpbmdzLmNvbnRlbnRSZWNTZWxlY3RvcigpLCB0cnVlLCB0cnVlKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAkY29udGVudFJlY0xvY2F0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGNvbnRlbnRSZWNMb2NhdGlvbiA9ICRjb250ZW50UmVjTG9jYXRpb25zW2ldO1xuICAgICAgICAgICAgdmFyIGNvbnRlbnRSZWMgPSBDb250ZW50UmVjLmNyZWF0ZUNvbnRlbnRSZWMocGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgdmFyIGNvbnRlbnRSZWNFbGVtZW50ID0gY29udGVudFJlYy5lbGVtZW50O1xuICAgICAgICAgICAgdmFyIG1ldGhvZCA9IGdyb3VwU2V0dGluZ3MuY29udGVudFJlY01ldGhvZCgpO1xuICAgICAgICAgICAgc3dpdGNoIChtZXRob2QpIHtcbiAgICAgICAgICAgICAgICBjYXNlICdhcHBlbmQnOlxuICAgICAgICAgICAgICAgICAgICBjb250ZW50UmVjTG9jYXRpb24uYXBwZW5kQ2hpbGQoY29udGVudFJlY0VsZW1lbnQpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdwcmVwZW5kJzpcbiAgICAgICAgICAgICAgICAgICAgY29udGVudFJlY0xvY2F0aW9uLmluc2VydEJlZm9yZShjb250ZW50UmVjRWxlbWVudCwgY29udGVudFJlY0xvY2F0aW9uLmZpcnN0Q2hpbGQpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdiZWZvcmUnOlxuICAgICAgICAgICAgICAgICAgICBjb250ZW50UmVjTG9jYXRpb24ucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoY29udGVudFJlY0VsZW1lbnQsIGNvbnRlbnRSZWNMb2NhdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ2FmdGVyJzpcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICBjb250ZW50UmVjTG9jYXRpb24ucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoY29udGVudFJlY0VsZW1lbnQsIGNvbnRlbnRSZWNMb2NhdGlvbi5uZXh0U2libGluZyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjcmVhdGVkV2lkZ2V0cy5wdXNoKGNvbnRlbnRSZWMpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBzY2FuRm9yQ2FsbHNUb0FjdGlvbigkZWxlbWVudCwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgY3RhVGFyZ2V0cyA9IHt9OyAvLyBUaGUgZWxlbWVudHMgdGhhdCB0aGUgY2FsbCB0byBhY3Rpb25zIGFjdCBvbiAoZS5nLiB0aGUgaW1hZ2Ugb3IgdmlkZW8pXG4gICAgZmluZCgkZWxlbWVudCwgJ1thbnQtaXRlbV0nLCB0cnVlKS5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgJGN0YVRhcmdldCA9ICQodGhpcyk7XG4gICAgICAgICRjdGFUYXJnZXQuYWRkQ2xhc3MoJ25vLWFudCcpOyAvLyBkb24ndCBzaG93IHRoZSBub3JtYWwgcmVhY3Rpb24gYWZmb3JkYW5jZSBvbiBhIGN0YSB0YXJnZXRcbiAgICAgICAgdmFyIGFudEl0ZW1JZCA9ICRjdGFUYXJnZXQuYXR0cignYW50LWl0ZW0nKS50cmltKCk7XG4gICAgICAgIGN0YVRhcmdldHNbYW50SXRlbUlkXSA9ICRjdGFUYXJnZXQ7XG4gICAgfSk7XG5cbiAgICB2YXIgY3RhTGFiZWxzID0ge307IC8vIE9wdGlvbmFsIGVsZW1lbnRzIHRoYXQgcmVwb3J0IHRoZSBudW1iZXIgb2YgcmVhY3Rpb25zIHRvIHRoZSBjdGEgKGUuZy4gXCIxIHJlYWN0aW9uXCIpXG4gICAgZmluZCgkZWxlbWVudCwgJ1thbnQtcmVhY3Rpb25zLWxhYmVsLWZvcl0nLCB0cnVlKS5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgJGN0YUxhYmVsID0gJCh0aGlzKTtcbiAgICAgICAgJGN0YUxhYmVsLmFkZENsYXNzKCduby1hbnQnKTsgLy8gZG9uJ3Qgc2hvdyB0aGUgbm9ybWFsIHJlYWN0aW9uIGFmZm9yZGFuY2Ugb24gYSBjdGEgbGFiZWxcbiAgICAgICAgdmFyIGFudEl0ZW1JZCA9ICRjdGFMYWJlbC5hdHRyKCdhbnQtcmVhY3Rpb25zLWxhYmVsLWZvcicpLnRyaW0oKTtcbiAgICAgICAgY3RhTGFiZWxzW2FudEl0ZW1JZF0gPSBjdGFMYWJlbHNbYW50SXRlbUlkXSB8fCBbXTtcbiAgICAgICAgY3RhTGFiZWxzW2FudEl0ZW1JZF0ucHVzaCgkY3RhTGFiZWwpO1xuICAgIH0pO1xuXG4gICAgdmFyIGN0YUNvdW50ZXJzID0ge307IC8vIE9wdGlvbmFsIGVsZW1lbnRzIHRoYXQgcmVwb3J0IG9ubHkgdGhlIGNvdW50IG9mIHJlYWN0aW9uIHRvIGEgY3RhIChlLmcuIFwiMVwiKVxuICAgIGZpbmQoJGVsZW1lbnQsICdbYW50LWNvdW50ZXItZm9yXScsIHRydWUpLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkY3RhQ291bnRlciA9ICQodGhpcyk7XG4gICAgICAgICRjdGFDb3VudGVyLmFkZENsYXNzKCduby1hbnQnKTsgLy8gZG9uJ3Qgc2hvdyB0aGUgbm9ybWFsIHJlYWN0aW9uIGFmZm9yZGFuY2Ugb24gYSBjdGEgY291bnRlclxuICAgICAgICB2YXIgYW50SXRlbUlkID0gJGN0YUNvdW50ZXIuYXR0cignYW50LWNvdW50ZXItZm9yJykudHJpbSgpO1xuICAgICAgICBjdGFDb3VudGVyc1thbnRJdGVtSWRdID0gY3RhQ291bnRlcnNbYW50SXRlbUlkXSB8fCBbXTtcbiAgICAgICAgY3RhQ291bnRlcnNbYW50SXRlbUlkXS5wdXNoKCRjdGFDb3VudGVyKTtcbiAgICB9KTtcblxuICAgIHZhciBjdGFFeHBhbmRlZFJlYWN0aW9ucyA9IHt9OyAvLyBPcHRpb25hbCBlbGVtZW50cyB0aGF0IHNob3cgZXhwYW5kZWQgcmVhY3Rpb25zIGZvciB0aGUgY3RhIChlLmcuIFwiSW50ZXJlc3RpbmcgKDE1KSBObyB0aGFua3MgKDEwKVwiKVxuICAgIGZpbmQoJGVsZW1lbnQsICdbYW50LWV4cGFuZGVkLXJlYWN0aW9ucy1mb3JdJywgdHJ1ZSkuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRjdGFFeHBhbmRlZFJlYWN0aW9uQXJlYSA9ICQodGhpcyk7XG4gICAgICAgICRjdGFFeHBhbmRlZFJlYWN0aW9uQXJlYS5hZGRDbGFzcygnbm8tYW50Jyk7IC8vIGRvbid0IHNob3cgdGhlIG5vcm1hbCByZWFjdGlvbiBhZmZvcmRhbmNlIG9uIGEgY3RhIGNvdW50ZXJcbiAgICAgICAgdmFyIGFudEl0ZW1JZCA9ICRjdGFFeHBhbmRlZFJlYWN0aW9uQXJlYS5hdHRyKCdhbnQtZXhwYW5kZWQtcmVhY3Rpb25zLWZvcicpLnRyaW0oKTtcbiAgICAgICAgY3RhRXhwYW5kZWRSZWFjdGlvbnNbYW50SXRlbUlkXSA9IGN0YUV4cGFuZGVkUmVhY3Rpb25zW2FudEl0ZW1JZF0gfHwgW107XG4gICAgICAgIGN0YUV4cGFuZGVkUmVhY3Rpb25zW2FudEl0ZW1JZF0ucHVzaCgkY3RhRXhwYW5kZWRSZWFjdGlvbkFyZWEpO1xuICAgIH0pO1xuXG4gICAgdmFyICRjdGFFbGVtZW50cyA9IGZpbmQoJGVsZW1lbnQsICdbYW50LWN0YS1mb3JdJyk7IC8vIFRoZSBjYWxsIHRvIGFjdGlvbiBlbGVtZW50cyB3aGljaCBwcm9tcHQgdGhlIHVzZXIgdG8gcmVhY3RcbiAgICAkY3RhRWxlbWVudHMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRjdGFFbGVtZW50ID0gJCh0aGlzKTtcbiAgICAgICAgdmFyIGFudEl0ZW1JZCA9ICRjdGFFbGVtZW50LmF0dHIoJ2FudC1jdGEtZm9yJyk7XG4gICAgICAgIHZhciAkdGFyZ2V0RWxlbWVudCA9IGN0YVRhcmdldHNbYW50SXRlbUlkXTtcbiAgICAgICAgaWYgKCR0YXJnZXRFbGVtZW50KSB7XG4gICAgICAgICAgICB2YXIgaGFzaCA9IGNvbXB1dGVIYXNoKCR0YXJnZXRFbGVtZW50LCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICB2YXIgY29udGVudERhdGEgPSBjb21wdXRlQ29udGVudERhdGEoJHRhcmdldEVsZW1lbnQsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgaWYgKGhhc2ggJiYgY29udGVudERhdGEpIHtcbiAgICAgICAgICAgICAgICB2YXIgY29udGFpbmVyRGF0YSA9IFBhZ2VEYXRhLmdldENvbnRhaW5lckRhdGEocGFnZURhdGEsIGhhc2gpO1xuICAgICAgICAgICAgICAgIGNvbnRhaW5lckRhdGEudHlwZSA9IGNvbXB1dGVFbGVtZW50VHlwZSgkdGFyZ2V0RWxlbWVudCk7IC8vIFRPRE86IHJldmlzaXQgd2hldGhlciBpdCBtYWtlcyBzZW5zZSB0byBzZXQgdGhlIHR5cGUgaGVyZVxuICAgICAgICAgICAgICAgIHZhciBjYWxsVG9BY3Rpb24gPSBDYWxsVG9BY3Rpb25JbmRpY2F0b3IuY3JlYXRlKHtcbiAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyRGF0YTogY29udGFpbmVyRGF0YSxcbiAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyRWxlbWVudDogJHRhcmdldEVsZW1lbnQsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnREYXRhOiBjb250ZW50RGF0YSxcbiAgICAgICAgICAgICAgICAgICAgY3RhRWxlbWVudDogJGN0YUVsZW1lbnQsXG4gICAgICAgICAgICAgICAgICAgIGN0YUxhYmVsczogY3RhTGFiZWxzW2FudEl0ZW1JZF0sXG4gICAgICAgICAgICAgICAgICAgIGN0YUNvdW50ZXJzOiBjdGFDb3VudGVyc1thbnRJdGVtSWRdLFxuICAgICAgICAgICAgICAgICAgICBjdGFFeHBhbmRlZFJlYWN0aW9uczogY3RhRXhwYW5kZWRSZWFjdGlvbnNbYW50SXRlbUlkXSxcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdFJlYWN0aW9uczogZ3JvdXBTZXR0aW5ncy5kZWZhdWx0UmVhY3Rpb25zKCR0YXJnZXRFbGVtZW50KSxcbiAgICAgICAgICAgICAgICAgICAgcGFnZURhdGE6IHBhZ2VEYXRhLFxuICAgICAgICAgICAgICAgICAgICBncm91cFNldHRpbmdzOiBncm91cFNldHRpbmdzXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY3JlYXRlZFdpZGdldHMucHVzaChjYWxsVG9BY3Rpb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSlcbn1cblxuZnVuY3Rpb24gY3JlYXRlQXV0b0NhbGxzVG9BY3Rpb24oJHNlY3Rpb24sIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyICRjdGFUYXJnZXRzID0gZmluZCgkc2VjdGlvbiwgZ3JvdXBTZXR0aW5ncy5nZW5lcmF0ZWRDdGFTZWxlY3RvcigpKTtcbiAgICAkY3RhVGFyZ2V0cy5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgJGN0YVRhcmdldCA9ICQodGhpcyk7XG4gICAgICAgIHZhciBhbnRJdGVtSWQgPSBnZW5lcmF0ZUFudEl0ZW1BdHRyaWJ1dGUoKTtcbiAgICAgICAgJGN0YVRhcmdldC5hdHRyKCdhbnQtaXRlbScsIGFudEl0ZW1JZCk7XG4gICAgICAgIHZhciBhdXRvQ3RhID0gQXV0b0NhbGxUb0FjdGlvbi5jcmVhdGUoYW50SXRlbUlkLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICRjdGFUYXJnZXQuYWZ0ZXIoYXV0b0N0YS5lbGVtZW50KTsgLy8gVE9ETzogbWFrZSB0aGUgaW5zZXJ0IGJlaGF2aW9yIGNvbmZpZ3VyYWJsZSBsaWtlIHRoZSBzdW1tYXJ5XG4gICAgICAgIGNyZWF0ZWRXaWRnZXRzLnB1c2goYXV0b0N0YSk7XG4gICAgfSk7XG59XG5cbnZhciBnZW5lcmF0ZUFudEl0ZW1BdHRyaWJ1dGUgPSBmdW5jdGlvbihpbmRleCkge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuICdhbnRlbm5hX2F1dG9fY3RhXycgKyBpbmRleCsrO1xuICAgIH1cbn0oMCk7XG5cbmZ1bmN0aW9uIHNjYW5Gb3JDb250ZW50KCRlbGVtZW50LCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciAkY29udGVudEVsZW1lbnRzID0gZmluZCgkZWxlbWVudCwgZ3JvdXBTZXR0aW5ncy5jb250ZW50U2VsZWN0b3IoKSwgdHJ1ZSk7XG4gICAgJGNvbnRlbnRFbGVtZW50cy5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgJGNvbnRlbnRFbGVtZW50ID0gJCh0aGlzKTtcbiAgICAgICAgdmFyIHR5cGUgPSBjb21wdXRlRWxlbWVudFR5cGUoJGNvbnRlbnRFbGVtZW50KTtcbiAgICAgICAgc3dpdGNoKHR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgVFlQRV9JTUFHRTpcbiAgICAgICAgICAgIGNhc2UgVFlQRV9NRURJQTpcbiAgICAgICAgICAgICAgICBzY2FuTWVkaWEoJGNvbnRlbnRFbGVtZW50LCB0eXBlLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFRZUEVfVEVYVDpcbiAgICAgICAgICAgICAgICBzY2FuVGV4dCgkY29udGVudEVsZW1lbnQsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBzY2FuVGV4dCgkdGV4dEVsZW1lbnQsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgaWYgKHNob3VsZEhhc2hUZXh0KCR0ZXh0RWxlbWVudCwgZ3JvdXBTZXR0aW5ncykpIHtcbiAgICAgICAgdmFyIGhhc2ggPSBjb21wdXRlSGFzaCgkdGV4dEVsZW1lbnQsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgaWYgKGhhc2gpIHtcbiAgICAgICAgICAgIHZhciBjb250YWluZXJEYXRhID0gUGFnZURhdGEuZ2V0Q29udGFpbmVyRGF0YShwYWdlRGF0YSwgaGFzaCk7XG4gICAgICAgICAgICBjb250YWluZXJEYXRhLnR5cGUgPSAndGV4dCc7IC8vIFRPRE86IHJldmlzaXQgd2hldGhlciBpdCBtYWtlcyBzZW5zZSB0byBzZXQgdGhlIHR5cGUgaGVyZVxuICAgICAgICAgICAgdmFyIGRlZmF1bHRSZWFjdGlvbnMgPSBncm91cFNldHRpbmdzLmRlZmF1bHRSZWFjdGlvbnMoJHRleHRFbGVtZW50KTtcbiAgICAgICAgICAgIHZhciB0ZXh0SW5kaWNhdG9yID0gVGV4dEluZGljYXRvcldpZGdldC5jcmVhdGUoe1xuICAgICAgICAgICAgICAgICAgICBjb250YWluZXJEYXRhOiBjb250YWluZXJEYXRhLFxuICAgICAgICAgICAgICAgICAgICBjb250YWluZXJFbGVtZW50OiAkdGV4dEVsZW1lbnQsXG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHRSZWFjdGlvbnM6IGRlZmF1bHRSZWFjdGlvbnMsXG4gICAgICAgICAgICAgICAgICAgIHBhZ2VEYXRhOiBwYWdlRGF0YSxcbiAgICAgICAgICAgICAgICAgICAgZ3JvdXBTZXR0aW5nczogZ3JvdXBTZXR0aW5nc1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICB2YXIgJGluZGljYXRvckVsZW1lbnQgPSB0ZXh0SW5kaWNhdG9yLmVsZW1lbnQ7XG4gICAgICAgICAgICB2YXIgbGFzdE5vZGUgPSBsYXN0Q29udGVudE5vZGUoJHRleHRFbGVtZW50LmdldCgwKSk7XG4gICAgICAgICAgICBpZiAobGFzdE5vZGUubm9kZVR5cGUgIT09IDMpIHtcbiAgICAgICAgICAgICAgICAkKGxhc3ROb2RlKS5iZWZvcmUoJGluZGljYXRvckVsZW1lbnQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAkdGV4dEVsZW1lbnQuYXBwZW5kKCRpbmRpY2F0b3JFbGVtZW50KTsgLy8gVE9ETyBpcyB0aGlzIGNvbmZpZ3VyYWJsZSBhbGEgaW5zZXJ0Q29udGVudCguLi4pP1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY3JlYXRlZFdpZGdldHMucHVzaCh0ZXh0SW5kaWNhdG9yKTtcblxuICAgICAgICAgICAgdmFyIHRleHRSZWFjdGlvbnMgPSBUZXh0UmVhY3Rpb25zLmNyZWF0ZVJlYWN0YWJsZVRleHQoe1xuICAgICAgICAgICAgICAgIGNvbnRhaW5lckRhdGE6IGNvbnRhaW5lckRhdGEsXG4gICAgICAgICAgICAgICAgY29udGFpbmVyRWxlbWVudDogJHRleHRFbGVtZW50LFxuICAgICAgICAgICAgICAgIGRlZmF1bHRSZWFjdGlvbnM6IGRlZmF1bHRSZWFjdGlvbnMsXG4gICAgICAgICAgICAgICAgcGFnZURhdGE6IHBhZ2VEYXRhLFxuICAgICAgICAgICAgICAgIGdyb3VwU2V0dGluZ3M6IGdyb3VwU2V0dGluZ3MsXG4gICAgICAgICAgICAgICAgZXhjbHVkZU5vZGU6ICRpbmRpY2F0b3JFbGVtZW50LmdldCgwKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjcmVhdGVkV2lkZ2V0cy5wdXNoKHRleHRSZWFjdGlvbnMpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gV2UgdXNlIHRoaXMgdG8gaGFuZGxlIHRoZSBjYXNlIG9mIHRleHQgY29udGVudCB0aGF0IGVuZHMgd2l0aCBzb21lIG5vbi10ZXh0IG5vZGUgYXMgaW5cbiAgICAvLyA8cD5NeSB0ZXh0LiA8aW1nIHNyYz1cIndoYXRldmVyXCI+PC9wPiBvclxuICAgIC8vIDxwPk15IGxvbmcgcGFyYWdyYXBoIHRleHQgd2l0aCBhIGNvbW1vbiBDTVMgcHJvYmxlbS48YnI+PC9wPlxuICAgIC8vIFRoaXMgaXMgYSBzaW1wbGlzdGljIGFsZ29yaXRobSwgbm90IGEgZ2VuZXJhbCBzb2x1dGlvbjpcbiAgICAvLyBXZSB3YWxrIHRoZSBET00gaW5zaWRlIHRoZSBnaXZlbiBub2RlIGFuZCBrZWVwIHRyYWNrIG9mIHRoZSBsYXN0IFwiY29udGVudFwiIG5vZGUgdGhhdCB3ZSBlbmNvdW50ZXIsIHdoaWNoIGNvdWxkIGJlIGVpdGhlclxuICAgIC8vIHRleHQgb3Igc29tZSBtZWRpYS4gIElmIHRoZSBsYXN0IGNvbnRlbnQgbm9kZSBpcyBub3QgdGV4dCwgd2Ugd2FudCB0byBpbnNlcnQgdGhlIHRleHQgaW5kaWNhdG9yIGJlZm9yZSB0aGUgbWVkaWEuXG4gICAgZnVuY3Rpb24gbGFzdENvbnRlbnROb2RlKG5vZGUpIHtcbiAgICAgICAgdmFyIGxhc3ROb2RlO1xuICAgICAgICB2YXIgY2hpbGROb2RlcyA9IG5vZGUuY2hpbGROb2RlcztcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGlsZE5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgY2hpbGQgPSBjaGlsZE5vZGVzW2ldO1xuICAgICAgICAgICAgaWYgKGNoaWxkLm5vZGVUeXBlID09PSAzKSB7XG4gICAgICAgICAgICAgICAgbGFzdE5vZGUgPSBjaGlsZDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY2hpbGQubm9kZVR5cGUgPT09IDEpIHtcbiAgICAgICAgICAgICAgICB2YXIgdGFnTmFtZSA9IGNoaWxkLnRhZ05hbWUudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKHRhZ05hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnaW1nJzpcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnaWZyYW1lJzpcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAndmlkZW8nOlxuICAgICAgICAgICAgICAgICAgICBjYXNlICdpZnJhbWUnOlxuICAgICAgICAgICAgICAgICAgICBjYXNlICdicic6XG4gICAgICAgICAgICAgICAgICAgICAgICBsYXN0Tm9kZSA9IGNoaWxkO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxhc3ROb2RlID0gbGFzdENvbnRlbnROb2RlKGNoaWxkKSB8fCBsYXN0Tm9kZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbGFzdE5vZGU7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBzaG91bGRIYXNoVGV4dCgkdGV4dEVsZW1lbnQsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICBpZiAoKGlzQ3RhKCR0ZXh0RWxlbWVudCwgZ3JvdXBTZXR0aW5ncykpKSB7XG4gICAgICAgIC8vIERvbid0IGhhc2ggdGhlIHRleHQgaWYgaXQgaXMgdGhlIHRhcmdldCBvZiBhIENUQS5cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAvLyBEb24ndCBjcmVhdGUgYW4gaW5kaWNhdG9yIGZvciB0ZXh0IGVsZW1lbnRzIHRoYXQgY29udGFpbiBvdGhlciB0ZXh0IG5vZGVzLlxuICAgIHZhciAkbmVzdGVkRWxlbWVudHMgPSBmaW5kKCR0ZXh0RWxlbWVudCwgZ3JvdXBTZXR0aW5ncy5jb250ZW50U2VsZWN0b3IoKSk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCAkbmVzdGVkRWxlbWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKChjb21wdXRlRWxlbWVudFR5cGUoJCgkbmVzdGVkRWxlbWVudHNbaV0pKSA9PT0gVFlQRV9URVhUKSkge1xuICAgICAgICAgICAgLy8gRG9uJ3QgaGFzaCBhIHRleHQgZWxlbWVudCBpZiBpdCBjb250YWlucyBhbnkgb3RoZXIgbWF0Y2hlZCB0ZXh0IGVsZW1lbnRzXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIGlzQ3RhKCRlbGVtZW50LCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGNvbXBvc2l0ZVNlbGVjdG9yID0gZ3JvdXBTZXR0aW5ncy5nZW5lcmF0ZWRDdGFTZWxlY3RvcigpICsgJyxbYW50LWl0ZW1dJztcbiAgICByZXR1cm4gJGVsZW1lbnQuaXMoY29tcG9zaXRlU2VsZWN0b3IpO1xufVxuXG4vLyBUaGUgXCJpbWFnZVwiIGFuZCBcIm1lZGlhXCIgcGF0aHMgY29udmVyZ2UgaGVyZSwgYmVjYXVzZSB3ZSB1c2UgdGhlIHNhbWUgaW5kaWNhdG9yIG1vZHVsZSBmb3IgdGhlbSBib3RoLlxuZnVuY3Rpb24gc2Nhbk1lZGlhKCRtZWRpYUVsZW1lbnQsIHR5cGUsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGluZGljYXRvcjtcbiAgICB2YXIgY29udGVudERhdGEgPSBjb21wdXRlQ29udGVudERhdGEoJG1lZGlhRWxlbWVudCwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgaWYgKGNvbnRlbnREYXRhICYmIGNvbnRlbnREYXRhLmRpbWVuc2lvbnMpIHtcbiAgICAgICAgaWYgKGNvbnRlbnREYXRhLmRpbWVuc2lvbnMuaGVpZ2h0ID49IDEwMCAmJiBjb250ZW50RGF0YS5kaW1lbnNpb25zLndpZHRoID49IDEwMCkgeyAvLyBEb24ndCBjcmVhdGUgaW5kaWNhdG9yIG9uIGVsZW1lbnRzIHRoYXQgYXJlIHRvbyBzbWFsbFxuICAgICAgICAgICAgdmFyIGhhc2ggPSBjb21wdXRlSGFzaCgkbWVkaWFFbGVtZW50LCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICBpZiAoaGFzaCkge1xuICAgICAgICAgICAgICAgIHZhciBjb250YWluZXJEYXRhID0gUGFnZURhdGEuZ2V0Q29udGFpbmVyRGF0YShwYWdlRGF0YSwgaGFzaCk7XG4gICAgICAgICAgICAgICAgY29udGFpbmVyRGF0YS50eXBlID0gdHlwZSA9PT0gVFlQRV9JTUFHRSA/ICdpbWFnZScgOiAnbWVkaWEnO1xuICAgICAgICAgICAgICAgIHZhciBkZWZhdWx0UmVhY3Rpb25zID0gZ3JvdXBTZXR0aW5ncy5kZWZhdWx0UmVhY3Rpb25zKCRtZWRpYUVsZW1lbnQpO1xuICAgICAgICAgICAgICAgIGluZGljYXRvciA9IE1lZGlhSW5kaWNhdG9yV2lkZ2V0LmNyZWF0ZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50OiBXaWRnZXRCdWNrZXQuZ2V0KCksXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250YWluZXJEYXRhOiBjb250YWluZXJEYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudERhdGE6IGNvbnRlbnREYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyRWxlbWVudDogJG1lZGlhRWxlbWVudCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHRSZWFjdGlvbnM6IGRlZmF1bHRSZWFjdGlvbnMsXG4gICAgICAgICAgICAgICAgICAgICAgICBwYWdlRGF0YTogcGFnZURhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICBncm91cFNldHRpbmdzOiBncm91cFNldHRpbmdzXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIGNyZWF0ZWRXaWRnZXRzLnB1c2goaW5kaWNhdG9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICAvLyBMaXN0ZW4gZm9yIGNoYW5nZXMgdG8gdGhlIGltYWdlIGF0dHJpYnV0ZXMgd2hpY2ggY291bGQgaW5kaWNhdGUgY29udGVudCBjaGFuZ2VzLlxuICAgIE11dGF0aW9uT2JzZXJ2ZXIuYWRkT25lVGltZUF0dHJpYnV0ZUxpc3RlbmVyKCRtZWRpYUVsZW1lbnQuZ2V0KDApLCBbJ3NyYycsJ2FudC1pdGVtLWNvbnRlbnQnLCdkYXRhJ10sIGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoaW5kaWNhdG9yKSB7XG4gICAgICAgICAgICAvLyBUT0RPOiB1cGRhdGUgSGFzaGVkRWxlbWVudHMgdG8gcmVtb3ZlIHRoZSBwcmV2aW91cyBoYXNoLT5lbGVtZW50IG1hcHBpbmcuIENvbnNpZGVyIHRoZXJlIGNvdWxkIGJlIG11bHRpcGxlXG4gICAgICAgICAgICAvLyAgICAgICBpbnN0YW5jZXMgb2YgdGhlIHNhbWUgZWxlbWVudCBvbiBhIHBhZ2UuLi4gc28gd2UgbWlnaHQgbmVlZCB0byB1c2UgYSBjb3VudGVyLlxuICAgICAgICAgICAgaW5kaWNhdG9yLnRlYXJkb3duKCk7XG4gICAgICAgIH1cbiAgICAgICAgc2Nhbk1lZGlhKCRtZWRpYUVsZW1lbnQsIHR5cGUsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gZmluZCgkZWxlbWVudCwgc2VsZWN0b3IsIGFkZEJhY2ssIGlnbm9yZU5vQW50KSB7XG4gICAgdmFyIHJlc3VsdCA9ICRlbGVtZW50LmZpbmQoc2VsZWN0b3IpO1xuICAgIGlmIChhZGRCYWNrICYmIHNlbGVjdG9yKSB7IC8vIHdpdGggYW4gdW5kZWZpbmVkIHNlbGVjdG9yLCBhZGRCYWNrIHdpbGwgbWF0Y2ggYW5kIGFsd2F5cyByZXR1cm4gdGhlIGlucHV0IGVsZW1lbnQgKHVubGlrZSBmaW5kKCkgd2hpY2ggcmV0dXJucyBhbiBlbXB0eSBtYXRjaClcbiAgICAgICAgcmVzdWx0ID0gcmVzdWx0LmFkZEJhY2soc2VsZWN0b3IpO1xuICAgIH1cbiAgICBpZiAoaWdub3JlTm9BbnQpIHsgLy8gU29tZSBwaWVjZXMgb2YgY29udGVudCAoZS5nLiB0aGUgc3VtbWFyeSB3aWRnZXQpIGNhbiBhY3R1YWxseSBnbyBpbnNpZGUgc2VjdGlvbnMgdGFnZ2VkIG5vLWFudFxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0LmZpbHRlcihmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuICQodGhpcykuY2xvc2VzdCgnLm5vLWFudCcpLmxlbmd0aCA9PSAwO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBpbnNlcnRDb250ZW50KCRwYXJlbnQsIGNvbnRlbnQsIG1ldGhvZCkge1xuICAgIHN3aXRjaCAobWV0aG9kKSB7XG4gICAgICAgIGNhc2UgJ2FwcGVuZCc6XG4gICAgICAgICAgICAkcGFyZW50LmFwcGVuZChjb250ZW50KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdwcmVwZW5kJzpcbiAgICAgICAgICAgICRwYXJlbnQucHJlcGVuZChjb250ZW50KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdiZWZvcmUnOlxuICAgICAgICAgICAgJHBhcmVudC5iZWZvcmUoY29udGVudCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnYWZ0ZXInOlxuICAgICAgICAgICAgJHBhcmVudC5hZnRlcihjb250ZW50KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gY29tcHV0ZUhhc2goJGVsZW1lbnQsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGhhc2g7XG4gICAgc3dpdGNoIChjb21wdXRlRWxlbWVudFR5cGUoJGVsZW1lbnQpKSB7XG4gICAgICAgIGNhc2UgVFlQRV9JTUFHRTpcbiAgICAgICAgICAgIHZhciBpbWFnZVVybCA9IFVSTHMuY29tcHV0ZUltYWdlVXJsKCRlbGVtZW50LCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgIGhhc2ggPSBIYXNoLmhhc2hJbWFnZShpbWFnZVVybCwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBUWVBFX01FRElBOlxuICAgICAgICAgICAgdmFyIG1lZGlhVXJsID0gVVJMcy5jb21wdXRlTWVkaWFVcmwoJGVsZW1lbnQsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgaGFzaCA9IEhhc2guaGFzaE1lZGlhKG1lZGlhVXJsLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFRZUEVfVEVYVDpcbiAgICAgICAgICAgIGhhc2ggPSBIYXNoLmhhc2hUZXh0KCRlbGVtZW50KTtcbiAgICAgICAgICAgIHZhciBpbmNyZW1lbnQgPSAxO1xuICAgICAgICAgICAgd2hpbGUgKGhhc2ggJiYgSGFzaGVkRWxlbWVudHMuZ2V0RWxlbWVudChoYXNoLCBwYWdlRGF0YS5wYWdlSGFzaCkpIHtcbiAgICAgICAgICAgICAgICBoYXNoID0gSGFzaC5oYXNoVGV4dCgkZWxlbWVudCwgaW5jcmVtZW50KyspO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGlmIChoYXNoKSB7XG4gICAgICAgIEhhc2hlZEVsZW1lbnRzLnNldEVsZW1lbnQoaGFzaCwgcGFnZURhdGEucGFnZUhhc2gsICRlbGVtZW50KTsgLy8gUmVjb3JkIHRoZSByZWxhdGlvbnNoaXAgYmV0d2VlbiB0aGUgaGFzaCBhbmQgZG9tIGVsZW1lbnQuXG4gICAgICAgIGlmIChBcHBNb2RlLmRlYnVnKSB7XG4gICAgICAgICAgICAkZWxlbWVudC5hdHRyKEFUVFJfSEFTSCwgaGFzaCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGhhc2g7XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVDb250ZW50RGF0YSgkZWxlbWVudCwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBjb250ZW50RGF0YTtcbiAgICBzd2l0Y2ggKGNvbXB1dGVFbGVtZW50VHlwZSgkZWxlbWVudCkpIHtcbiAgICAgICAgY2FzZSBUWVBFX0lNQUdFOlxuICAgICAgICAgICAgdmFyIGltYWdlVXJsID0gVVJMcy5jb21wdXRlSW1hZ2VVcmwoJGVsZW1lbnQsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgdmFyIGltYWdlRGltZW5zaW9ucyA9IHtcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IHBhcnNlSW50KCRlbGVtZW50LmF0dHIoJ2hlaWdodCcpKSB8fCAkZWxlbWVudC5oZWlnaHQoKSB8fCAwLFxuICAgICAgICAgICAgICAgIHdpZHRoOiBwYXJzZUludCgkZWxlbWVudC5hdHRyKCd3aWR0aCcpKSB8fCAkZWxlbWVudC53aWR0aCgpIHx8IDBcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBjb250ZW50RGF0YSA9IHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnaW1nJyxcbiAgICAgICAgICAgICAgICBib2R5OiBpbWFnZVVybCxcbiAgICAgICAgICAgICAgICBkaW1lbnNpb25zOiBpbWFnZURpbWVuc2lvbnNcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBUWVBFX01FRElBOlxuICAgICAgICAgICAgdmFyIG1lZGlhVXJsID0gVVJMcy5jb21wdXRlTWVkaWFVcmwoJGVsZW1lbnQsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgdmFyIG1lZGlhRGltZW5zaW9ucyA9IHtcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IHBhcnNlSW50KCRlbGVtZW50LmF0dHIoJ2hlaWdodCcpKSB8fCAkZWxlbWVudC5oZWlnaHQoKSB8fCAwLFxuICAgICAgICAgICAgICAgIHdpZHRoOiBwYXJzZUludCgkZWxlbWVudC5hdHRyKCd3aWR0aCcpKSB8fCAkZWxlbWVudC53aWR0aCgpIHx8IDBcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBjb250ZW50RGF0YSA9IHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnbWVkaWEnLFxuICAgICAgICAgICAgICAgIGJvZHk6IG1lZGlhVXJsLFxuICAgICAgICAgICAgICAgIGRpbWVuc2lvbnM6IG1lZGlhRGltZW5zaW9uc1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFRZUEVfVEVYVDpcbiAgICAgICAgICAgIGNvbnRlbnREYXRhID0geyB0eXBlOiAndGV4dCcgfTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICByZXR1cm4gY29udGVudERhdGE7XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVFbGVtZW50VHlwZSgkZWxlbWVudCkge1xuICAgIHZhciBpdGVtVHlwZSA9ICRlbGVtZW50LmF0dHIoJ2FudC1pdGVtLXR5cGUnKTtcbiAgICBpZiAoaXRlbVR5cGUgJiYgaXRlbVR5cGUudHJpbSgpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgcmV0dXJuIGl0ZW1UeXBlLnRyaW0oKTtcbiAgICB9XG4gICAgdmFyIHRhZ05hbWUgPSAkZWxlbWVudC5wcm9wKCd0YWdOYW1lJykudG9Mb3dlckNhc2UoKTtcbiAgICBzd2l0Y2ggKHRhZ05hbWUpIHtcbiAgICAgICAgY2FzZSAnaW1nJzpcbiAgICAgICAgICAgIHJldHVybiBUWVBFX0lNQUdFO1xuICAgICAgICBjYXNlICd2aWRlbyc6XG4gICAgICAgIGNhc2UgJ2lmcmFtZSc6XG4gICAgICAgIGNhc2UgJ2VtYmVkJzpcbiAgICAgICAgICAgIHJldHVybiBUWVBFX01FRElBO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgcmV0dXJuIFRZUEVfVEVYVDtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHNldHVwTXV0YXRpb25PYnNlcnZlcihncm91cFNldHRpbmdzLCByZWluaXRpYWxpemVDYWxsYmFjaykge1xuICAgIHZhciBjb3VsZEJlU2luZ2xlUGFnZUFwcCA9IHRydWU7XG4gICAgdmFyIG9yaWdpbmFsUGF0aG5hbWUgPSB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWU7XG4gICAgdmFyIG9yaWdpbmFsU2VhcmNoID0gd2luZG93LmxvY2F0aW9uLnNlYXJjaDtcbiAgICBNdXRhdGlvbk9ic2VydmVyLmFkZEFkZGl0aW9uTGlzdGVuZXIoZWxlbWVudHNBZGRlZCk7XG5cbiAgICBmdW5jdGlvbiBlbGVtZW50c0FkZGVkKCRlbGVtZW50cykge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8ICRlbGVtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyICRlbGVtZW50ID0gJGVsZW1lbnRzW2ldO1xuICAgICAgICAgICAgJGVsZW1lbnQuZmluZChncm91cFNldHRpbmdzLmV4Y2x1c2lvblNlbGVjdG9yKCkpLmFkZEJhY2soZ3JvdXBTZXR0aW5ncy5leGNsdXNpb25TZWxlY3RvcigpKS5hZGRDbGFzcygnbm8tYW50Jyk7IC8vIEFkZCB0aGUgbm8tYW50IGNsYXNzIHRvIGV2ZXJ5dGhpbmcgdGhhdCBpcyBmbGFnZ2VkIGZvciBleGNsdXNpb25cbiAgICAgICAgICAgIGlmICgkZWxlbWVudC5jbG9zZXN0KCcubm8tYW50JykubGVuZ3RoID09PSAwKSB7IC8vIElnbm9yZSBhbnl0aGluZyB0YWdnZWQgbm8tYW50XG4gICAgICAgICAgICAgICAgLy8gRmlyc3QsIHNlZSBpZiBhbnkgZW50aXJlIHBhZ2VzIHdlcmUgYWRkZWRcbiAgICAgICAgICAgICAgICB2YXIgJHBhZ2VzID0gZmluZCgkZWxlbWVudCwgZ3JvdXBTZXR0aW5ncy5wYWdlU2VsZWN0b3IoKSwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgaWYgKCRwYWdlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIFBhZ2VEYXRhTG9hZGVyLnBhZ2VzQWRkZWQoJHBhZ2VzLCBncm91cFNldHRpbmdzKTsgLy8gVE9ETzogY29uc2lkZXIgaWYgdGhlcmUncyBhIGJldHRlciB3YXkgdG8gYXJjaGl0ZWN0IHRoaXNcbiAgICAgICAgICAgICAgICAgICAgJHBhZ2VzLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2NhblBhZ2UoJCh0aGlzKSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAvLyBJZiBhbiBlbnRpcmUgcGFnZSBpcyBhZGRlZCwgYXNzdW1lIHRoYXQgdGhpcyBpcyBhbiBcImluZmluaXRlIHNjcm9sbFwiIHNpdGUgYW5kIHN0b3AgY2hlY2tpbmcgZm9yXG4gICAgICAgICAgICAgICAgICAgIC8vIHNpbmdsZSBwYWdlIGFwcHMuIFRoaXMgaXMgbmVjZXNzYXJ5IGJlY2F1c2Ugc29tZSBpbmZpbml0ZSBzY3JvbGwgc2l0ZXMgdXBkYXRlIHRoZSBsb2NhdGlvbiwgd2hpY2hcbiAgICAgICAgICAgICAgICAgICAgLy8gY2FuIHRyaWdnZXIgYW4gdW5uZWNlc3NhcnkgcmVpbml0aWFsaXphdGlvbi5cbiAgICAgICAgICAgICAgICAgICAgY291bGRCZVNpbmdsZVBhZ2VBcHAgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBJZiBub3QgYW4gZW50aXJlIHBhZ2UvcGFnZXMsIHNlZSBpZiBjb250ZW50IHdhcyBhZGRlZCB0byBhbiBleGlzdGluZyBwYWdlXG4gICAgICAgICAgICAgICAgICAgIHZhciAkcGFnZSA9ICRlbGVtZW50LmNsb3Nlc3QoZ3JvdXBTZXR0aW5ncy5wYWdlU2VsZWN0b3IoKSk7XG4gICAgICAgICAgICAgICAgICAgIGlmICgkcGFnZS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRwYWdlID0gJCgnYm9keScpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChjb3VsZEJlU2luZ2xlUGFnZUFwcCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyICRwYWdlSW5kaWNhdG9yID0gZmluZCgkcGFnZSwgZ3JvdXBTZXR0aW5ncy5wYWdlVXJsU2VsZWN0b3IoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoJHBhZ2VJbmRpY2F0b3IubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gV2hlbmV2ZXIgbmV3IGNvbnRlbnQgaXMgYWRkZWQsIGNoZWNrIGlmIHdlIG5lZWQgdG8gcmVpbml0aWFsaXplIGFsbCBvdXIgZGF0YSBiYXNlZCBvbiB0aGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB3aW5kb3cubG9jYXRpb24uIFRoaXMgYWNjb21vZGF0ZXMgc2luZ2xlIHBhZ2UgYXBwcyB0aGF0IGRvbid0IHVzZSBicm93c2VyIG5hdmlnYXRpb24uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gKEFzIGFuIG9wdGltaXphdGlvbiwgd2UgZG9uJ3QgZG8gdGhpcyBjaGVjayBpZiB0aGUgYWRkZWQgZWxlbWVudCBjb250YWlucyBhbiBlbnRpcmUgcGFnZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHdpdGggYSBVUkwgc3BlY2lmaWVkIGluc2lkZSB0aGUgY29udGVudC4pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNob3VsZFJlaW5pdGlhbGl6ZUZvckxvY2F0aW9uQ2hhbmdlKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVpbml0aWFsaXplQ2FsbGJhY2soZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdmFyIHVybCA9IFBhZ2VVdGlscy5jb21wdXRlUGFnZVVybCgkcGFnZSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwYWdlRGF0YSA9IFBhZ2VEYXRhLmdldFBhZ2VEYXRhQnlVUkwodXJsKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gRmlyc3QsIGNoZWNrIGZvciBhbnkgbmV3IHN1bW1hcnkgd2lkZ2V0cy4uLlxuICAgICAgICAgICAgICAgICAgICBzY2FuRm9yU3VtbWFyaWVzKCRlbGVtZW50LCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICAgICAgICAgIC8vIE5leHQsIHNlZSBpZiBhbnkgZW50aXJlIGFjdGl2ZSBzZWN0aW9ucyB3ZXJlIGFkZGVkXG4gICAgICAgICAgICAgICAgICAgIHZhciAkYWN0aXZlU2VjdGlvbnMgPSBmaW5kKCRlbGVtZW50LCBncm91cFNldHRpbmdzLmFjdGl2ZVNlY3Rpb25zKCkpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoJGFjdGl2ZVNlY3Rpb25zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRhY3RpdmVTZWN0aW9ucy5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjcmVhdGVBdXRvQ2FsbHNUb0FjdGlvbigkKHRoaXMpLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRhY3RpdmVTZWN0aW9ucy5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgJHNlY3Rpb24gPSAkKHRoaXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjYW5BY3RpdmVFbGVtZW50KCRzZWN0aW9uLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZpbmFsbHksIHNjYW4gaW5zaWRlIHRoZSBlbGVtZW50IGZvciBjb250ZW50XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgJGFjdGl2ZVNlY3Rpb24gPSAkZWxlbWVudC5jbG9zZXN0KGdyb3VwU2V0dGluZ3MuYWN0aXZlU2VjdGlvbnMoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoJGFjdGl2ZVNlY3Rpb24ubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNyZWF0ZUF1dG9DYWxsc1RvQWN0aW9uKCRlbGVtZW50LCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NhbkFjdGl2ZUVsZW1lbnQoJGVsZW1lbnQsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGhlIGVsZW1lbnQgaXMgYWRkZWQgb3V0c2lkZSBhbiBhY3RpdmUgc2VjdGlvbiwganVzdCBjaGVjayBpdCBmb3IgQ1RBc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjYW5Gb3JDYWxsc1RvQWN0aW9uKCRlbGVtZW50LCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzaG91bGRSZWluaXRpYWxpemVGb3JMb2NhdGlvbkNoYW5nZSgpIHtcbiAgICAgICAgLy8gUmVpbml0aWFsaXplIHdoZW4gdGhlIGxvY2F0aW9uIGNoYW5nZXMgaW4gYSB3YXkgdGhhdCB3ZSBiZWxpZXZlIGlzIG1lYW5pbmdmdWwuXG4gICAgICAgIC8vIFRoZSBoZXVyaXN0aWMgd2UgdXNlIGlzIHRoYXQgZWl0aGVyOlxuICAgICAgICAvLyAxLiBUaGUgcXVlcnkgc3RyaW5nIGNoYW5nZXMgYW5kIHdlJ3JlIG9uIGEgc2l0ZSB0aGF0IHNheXMgdGhlIHF1ZXJ5IHN0cmluZyBtYXR0ZXJzIG9yXG4gICAgICAgIC8vIDIuIFRoZSBwYXRoIGNoYW5nZXMuLi5cbiAgICAgICAgLy8gICAgMmEuIEJ1dCBub3QgaWYgdGhlIGNoYW5nZSBpcyBhbiBleHRlbnNpb24gb2YgdGhlIHBhdGguXG4gICAgICAgIC8vICAgICAgICAyYWEuIFVubGVzcyB3ZSdyZSBnb2luZyBmcm9tIGFuIGVtcHR5IHBhdGggKCcvJykgdG8gc29tZSBvdGhlciBwYXRoLlxuICAgICAgICB2YXIgbmV3TG9jYXRpb25QYXRobmFtZSA9IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZTtcbiAgICAgICAgcmV0dXJuIGdyb3VwU2V0dGluZ3MudXJsLmluY2x1ZGVRdWVyeVN0cmluZygpICYmIG9yaWdpbmFsU2VhcmNoICE9IHdpbmRvdy5sb2NhdGlvbi5zZWFyY2ggfHxcbiAgICAgICAgICAgICAgICBuZXdMb2NhdGlvblBhdGhuYW1lICE9IG9yaWdpbmFsUGF0aG5hbWUgJiYgKG9yaWdpbmFsUGF0aG5hbWUgPT09ICcvJyB8fCBuZXdMb2NhdGlvblBhdGhuYW1lLmluZGV4T2Yob3JpZ2luYWxQYXRobmFtZSkgPT09IC0xKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHRlYXJkb3duKCkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY3JlYXRlZFdpZGdldHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY3JlYXRlZFdpZGdldHNbaV0udGVhcmRvd24oKTtcbiAgICB9XG4gICAgY3JlYXRlZFdpZGdldHMgPSBbXTtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHNjYW46IHNjYW5BbGxQYWdlcyxcbiAgICB0ZWFyZG93bjogdGVhcmRvd25cbn07IiwidmFyIFJhY3RpdmU7IHJlcXVpcmUoJy4vdXRpbHMvcmFjdGl2ZS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihsb2FkZWRSYWN0aXZlKSB7IFJhY3RpdmUgPSBsb2FkZWRSYWN0aXZlO30pO1xudmFyIFNWR3MgPSByZXF1aXJlKCcuL3N2Z3MnKTtcblxudmFyIHBhZ2VTZWxlY3RvciA9ICcuYW50ZW5uYS1wZW5kaW5nLXBhZ2UnO1xuXG5mdW5jdGlvbiBjcmVhdGVQYWdlKHJlYWN0aW9uVGV4dCwgZWxlbWVudCkge1xuICAgIHZhciByYWN0aXZlID0gUmFjdGl2ZSh7XG4gICAgICAgIGVsOiBlbGVtZW50LFxuICAgICAgICBhcHBlbmQ6IHRydWUsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIHRleHQ6IHJlYWN0aW9uVGV4dFxuICAgICAgICB9LFxuICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL3BlbmRpbmctcmVhY3Rpb24tcGFnZS5oYnMuaHRtbCcpLFxuICAgICAgICBwYXJ0aWFsczoge1xuICAgICAgICAgICAgbGVmdDogU1ZHcy5sZWZ0XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4ge1xuICAgICAgICBzZWxlY3RvcjogcGFnZVNlbGVjdG9yLFxuICAgICAgICB0ZWFyZG93bjogZnVuY3Rpb24oKSB7IHJhY3RpdmUudGVhcmRvd24oKTsgfVxuICAgIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZVBhZ2U6IGNyZWF0ZVBhZ2Vcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgUmFjdGl2ZTsgcmVxdWlyZSgnLi91dGlscy9yYWN0aXZlLXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGxvYWRlZFJhY3RpdmUpIHsgUmFjdGl2ZSA9IGxvYWRlZFJhY3RpdmU7fSk7XG52YXIgV2lkZ2V0QnVja2V0ID0gcmVxdWlyZSgnLi91dGlscy93aWRnZXQtYnVja2V0Jyk7XG52YXIgVHJhbnNpdGlvblV0aWwgPSByZXF1aXJlKCcuL3V0aWxzL3RyYW5zaXRpb24tdXRpbCcpO1xuXG52YXIgU1ZHcyA9IHJlcXVpcmUoJy4vc3ZncycpO1xuXG52YXIgcmFjdGl2ZTtcbnZhciBjbGlja0hhbmRsZXI7XG5cblxuZnVuY3Rpb24gZ2V0Um9vdEVsZW1lbnQoKSB7XG4gICAgLy8gVE9ETyByZXZpc2l0IHRoaXMsIGl0J3Mga2luZCBvZiBnb29meSBhbmQgaXQgbWlnaHQgaGF2ZSBhIHRpbWluZyBwcm9ibGVtXG4gICAgaWYgKCFyYWN0aXZlKSB7XG4gICAgICAgIHZhciBidWNrZXQgPSBXaWRnZXRCdWNrZXQuZ2V0KCk7XG4gICAgICAgIHJhY3RpdmUgPSBSYWN0aXZlKHtcbiAgICAgICAgICAgIGVsOiBidWNrZXQsXG4gICAgICAgICAgICBhcHBlbmQ6IHRydWUsXG4gICAgICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL3BvcHVwLXdpZGdldC5oYnMuaHRtbCcpLFxuICAgICAgICAgICAgcGFydGlhbHM6IHtcbiAgICAgICAgICAgICAgICBsb2dvOiBTVkdzLmxvZ29cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHZhciAkZWxlbWVudCA9ICQocmFjdGl2ZS5maW5kKCcuYW50ZW5uYS1wb3B1cCcpKTtcbiAgICAgICAgJGVsZW1lbnQub24oJ21vdXNlZG93bicsIGZhbHNlKTsgLy8gUHJldmVudCBtb3VzZWRvd24gZnJvbSBwcm9wYWdhdGluZywgc28gdGhlIGJyb3dzZXIgZG9lc24ndCBjbGVhciB0aGUgdGV4dCBzZWxlY3Rpb24uXG4gICAgICAgICRlbGVtZW50Lm9uKCdjbGljay5hbnRlbm5hLXBvcHVwJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIGhpZGVQb3B1cCgkZWxlbWVudCk7XG4gICAgICAgICAgICBpZiAoY2xpY2tIYW5kbGVyKSB7XG4gICAgICAgICAgICAgICAgY2xpY2tIYW5kbGVyKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBzZXR1cE1vdXNlT3ZlcigkZWxlbWVudCk7XG4gICAgICAgIHJldHVybiAkZWxlbWVudDtcbiAgICB9XG4gICAgcmV0dXJuICQocmFjdGl2ZS5maW5kKCcuYW50ZW5uYS1wb3B1cCcpKTtcbn1cblxuZnVuY3Rpb24gc2V0dXBNb3VzZU92ZXIoJGVsZW1lbnQpIHtcbiAgICB2YXIgY2xvc2VUaW1lcjtcblxuICAgIC8vIFRoZSA6aG92ZXIgcHNldWRvIGNsYXNzIGNhbiBiZWNvbWUgc3R1Y2sgb24gdGhlIGFudGVubmEtcG9wdXAgZWxlbWVudCB3aGVuIHdlIGJyaW5nIHVwIHRoZSByZWFjdGlvbiB3aW5kb3dcbiAgICAvLyBpbiByZXNwb25zZSB0byB0aGUgY2xpY2suIFNvIGhlcmUgd2UgYWRkL3JlbW92ZSBvdXIgb3duIGhvdmVyIGNsYXNzIGluc3RlYWQuXG4gICAgLy8gU2VlOiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzEwMzIxMjc1L2hvdmVyLXN0YXRlLWlzLXN0aWNreS1hZnRlci1lbGVtZW50LWlzLW1vdmVkLW91dC1mcm9tLXVuZGVyLXRoZS1tb3VzZS1pbi1hbGwtYnJcbiAgICB2YXIgaG92ZXJDbGFzcyA9ICdhbnRlbm5hLWhvdmVyJztcbiAgICAkZWxlbWVudC5vbignbW91c2VlbnRlcicsIGZ1bmN0aW9uKCkge1xuICAgICAgICAkZWxlbWVudC5hZGRDbGFzcyhob3ZlckNsYXNzKTtcbiAgICAgICAga2VlcE9wZW4oKTtcbiAgICB9KTtcbiAgICAkZWxlbWVudC5vbignbW91c2VsZWF2ZScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAkZWxlbWVudC5yZW1vdmVDbGFzcyhob3ZlckNsYXNzKTtcbiAgICAgICAgZGVsYXllZENsb3NlKCk7XG4gICAgfSk7XG5cbiAgICBmdW5jdGlvbiBkZWxheWVkQ2xvc2UoKSB7XG4gICAgICAgIGNsb3NlVGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY2xvc2VUaW1lciA9IG51bGw7XG4gICAgICAgICAgICBoaWRlUG9wdXAoJGVsZW1lbnQpO1xuICAgICAgICB9LCA1MDApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGtlZXBPcGVuKCkge1xuICAgICAgICBpZiAoY2xvc2VUaW1lcikge1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KGNsb3NlVGltZXIpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBpc1Nob3dpbmcoKSB7XG4gICAgaWYgKCFyYWN0aXZlKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdmFyICRlbGVtZW50ID0gZ2V0Um9vdEVsZW1lbnQoKTtcbiAgICByZXR1cm4gJGVsZW1lbnQuaGFzQ2xhc3MoJ2FudGVubmEtc2hvdycpO1xufVxuXG5mdW5jdGlvbiBzaG93UG9wdXAoY29vcmRpbmF0ZXMsIGNhbGxiYWNrKSB7XG4gICAgdmFyICRlbGVtZW50ID0gZ2V0Um9vdEVsZW1lbnQoKTtcbiAgICBpZiAoISRlbGVtZW50Lmhhc0NsYXNzKCdhbnRlbm5hLXNob3cnKSkge1xuICAgICAgICBjbGlja0hhbmRsZXIgPSBjYWxsYmFjaztcbiAgICAgICAgdmFyIGJvZHlPZmZzZXQgPSAkKCdib2R5Jykub2Zmc2V0KCk7IC8vIGFjY291bnQgZm9yIGFueSBvZmZzZXQgdGhhdCBzaXRlcyBhcHBseSB0byB0aGUgZW50aXJlIGJvZHlcbiAgICAgICAgdmFyIHRhaWwgPSA2OyAvLyBUT0RPIGZpbmQgYSBjbGVhbmVyIHdheSB0byBhY2NvdW50IGZvciB0aGUgcG9wdXAgJ3RhaWwnXG4gICAgICAgICRlbGVtZW50XG4gICAgICAgICAgICAuc2hvdygpIC8vIHN0aWxsIGhhcyBvcGFjaXR5IDAgYXQgdGhpcyBwb2ludFxuICAgICAgICAgICAgLmNzcyh7XG4gICAgICAgICAgICAgICAgdG9wOiBjb29yZGluYXRlcy50b3AgLSAkZWxlbWVudC5vdXRlckhlaWdodCgpIC0gdGFpbCAtIGJvZHlPZmZzZXQudG9wLFxuICAgICAgICAgICAgICAgIGxlZnQ6IGNvb3JkaW5hdGVzLmxlZnQgLSBib2R5T2Zmc2V0LmxlZnQgLSBNYXRoLmZsb29yKCRlbGVtZW50Lm91dGVyV2lkdGgoKSAvIDIpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgVHJhbnNpdGlvblV0aWwudG9nZ2xlQ2xhc3MoJGVsZW1lbnQsICdhbnRlbm5hLXNob3cnLCB0cnVlLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIFRPRE86IGFmdGVyIHRoZSBhcHBlYXJhbmNlIHRyYW5zaXRpb24gaXMgY29tcGxldGUsIGFkZCBhIGhhbmRsZXIgZm9yIG1vdXNlZW50ZXIgd2hpY2ggdGhlbiByZWdpc3RlcnNcbiAgICAgICAgICAgIC8vICAgICAgIGEgaGFuZGxlciBmb3IgbW91c2VsZWF2ZSB0aGF0IGhpZGVzIHRoZSBwb3B1cFxuXG4gICAgICAgICAgICAvLyBUT0RPOiBhbHNvIHRha2UgZG93biB0aGUgcG9wdXAgaWYgdGhlIHVzZXIgbW91c2VzIG92ZXIgYW5vdGhlciB3aWRnZXQgKHN1bW1hcnkgb3IgaW5kaWNhdG9yKVxuICAgICAgICAgICAgJChkb2N1bWVudCkub24oJ2NsaWNrLmFudGVubmEtcG9wdXAnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaGlkZVBvcHVwKCRlbGVtZW50KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGhpZGVQb3B1cCgkZWxlbWVudCkge1xuICAgIFRyYW5zaXRpb25VdGlsLnRvZ2dsZUNsYXNzKCRlbGVtZW50LCAnYW50ZW5uYS1zaG93JywgZmFsc2UsIGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoISRlbGVtZW50Lmhhc0NsYXNzKCdhbnRlbm5hLXNob3cnKSkgeyAvLyBCeSB0aGUgdGltZSB0aGUgdHJhbnNpdGlvbiBmaW5pc2hlcywgdGhlIHdpZGdldCBjb3VsZCBiZSBzaG93aW5nIGFnYWluLlxuICAgICAgICAgICAgJGVsZW1lbnQuaGlkZSgpOyAvLyBhZnRlciB3ZSdyZSBhdCBvcGFjaXR5IDAsIGhpZGUgdGhlIGVsZW1lbnQgc28gaXQgZG9lc24ndCByZWNlaXZlIGFjY2lkZW50YWwgY2xpY2tzXG4gICAgICAgIH1cbiAgICB9KTtcbiAgICAkKGRvY3VtZW50KS5vZmYoJ2NsaWNrLmFudGVubmEtcG9wdXAnKTtcbn1cblxuZnVuY3Rpb24gdGVhcmRvd24oKSB7XG4gICAgaWYgKHJhY3RpdmUpIHtcbiAgICAgICAgcmFjdGl2ZS50ZWFyZG93bigpO1xuICAgICAgICByYWN0aXZlID0gdW5kZWZpbmVkO1xuICAgICAgICBjbGlja0hhbmRsZXIgPSB1bmRlZmluZWQ7XG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgaXNTaG93aW5nOiBpc1Nob3dpbmcsXG4gICAgc2hvdzogc2hvd1BvcHVwLFxuICAgIHRlYXJkb3duOiB0ZWFyZG93blxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi91dGlscy9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciBSYWN0aXZlOyByZXF1aXJlKCcuL3V0aWxzL3JhY3RpdmUtcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24obG9hZGVkUmFjdGl2ZSkgeyBSYWN0aXZlID0gbG9hZGVkUmFjdGl2ZTt9KTtcblxudmFyIEFqYXhDbGllbnQgPSByZXF1aXJlKCcuL3V0aWxzL2FqYXgtY2xpZW50Jyk7XG52YXIgUmFuZ2UgPSByZXF1aXJlKCcuL3V0aWxzL3JhbmdlJyk7XG52YXIgUmVhY3Rpb25zV2lkZ2V0TGF5b3V0VXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzL3JlYWN0aW9ucy13aWRnZXQtbGF5b3V0LXV0aWxzJyk7XG5cbnZhciBFdmVudHMgPSByZXF1aXJlKCcuL2V2ZW50cycpO1xudmFyIFNWR3MgPSByZXF1aXJlKCcuL3N2Z3MnKTtcblxudmFyIHBhZ2VTZWxlY3RvciA9ICcuYW50ZW5uYS1yZWFjdGlvbnMtcGFnZSc7XG5cbmZ1bmN0aW9uIGNyZWF0ZVBhZ2Uob3B0aW9ucykge1xuICAgIHZhciBpc1N1bW1hcnkgPSBvcHRpb25zLmlzU3VtbWFyeTtcbiAgICB2YXIgcmVhY3Rpb25zRGF0YSA9IG9wdGlvbnMucmVhY3Rpb25zRGF0YTtcbiAgICB2YXIgY29udGFpbmVyRGF0YSA9IG9wdGlvbnMuY29udGFpbmVyRGF0YTtcbiAgICB2YXIgcGFnZURhdGEgPSBvcHRpb25zLnBhZ2VEYXRhO1xuICAgIHZhciBncm91cFNldHRpbmdzID0gb3B0aW9ucy5ncm91cFNldHRpbmdzO1xuICAgIHZhciBjb250YWluZXJFbGVtZW50ID0gb3B0aW9ucy5jb250YWluZXJFbGVtZW50OyAvLyBvcHRpb25hbFxuICAgIHZhciBzaG93Q29uZmlybWF0aW9uID0gb3B0aW9ucy5zaG93Q29uZmlybWF0aW9uO1xuICAgIHZhciBzaG93RGVmYXVsdHMgPSBvcHRpb25zLnNob3dEZWZhdWx0cztcbiAgICB2YXIgc2hvd0NvbW1lbnRzID0gb3B0aW9ucy5zaG93Q29tbWVudHM7XG4gICAgdmFyIHNob3dMb2NhdGlvbnMgPSBvcHRpb25zLnNob3dMb2NhdGlvbnM7XG4gICAgdmFyIGhhbmRsZVJlYWN0aW9uRXJyb3IgPSBvcHRpb25zLmhhbmRsZVJlYWN0aW9uRXJyb3I7XG4gICAgdmFyIGVsZW1lbnQgPSBvcHRpb25zLmVsZW1lbnQ7XG4gICAgdmFyIHJlYWN0aW9uc0xheW91dERhdGEgPSBSZWFjdGlvbnNXaWRnZXRMYXlvdXRVdGlscy5jb21wdXRlTGF5b3V0RGF0YShyZWFjdGlvbnNEYXRhKTtcbiAgICB2YXIgJHJlYWN0aW9uc1dpbmRvdyA9ICQob3B0aW9ucy5yZWFjdGlvbnNXaW5kb3cpO1xuICAgIHZhciByYWN0aXZlID0gUmFjdGl2ZSh7XG4gICAgICAgIGVsOiBlbGVtZW50LFxuICAgICAgICBhcHBlbmQ6IHRydWUsXG4gICAgICAgIHRlbXBsYXRlOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvcmVhY3Rpb25zLXBhZ2UuaGJzLmh0bWwnKSxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgcmVhY3Rpb25zOiByZWFjdGlvbnNEYXRhLFxuICAgICAgICAgICAgcmVhY3Rpb25zTGF5b3V0Q2xhc3M6IGFycmF5QWNjZXNzb3IocmVhY3Rpb25zTGF5b3V0RGF0YS5sYXlvdXRDbGFzc2VzKSxcbiAgICAgICAgICAgIGlzU3VtbWFyeTogaXNTdW1tYXJ5LFxuICAgICAgICAgICAgaGlkZUNvbW1lbnRJbnB1dDogZ3JvdXBTZXR0aW5ncy5yZXF1aXJlc0FwcHJvdmFsKCkgLy8gQ3VycmVudGx5LCBzaXRlcyB0aGF0IHJlcXVpcmUgYXBwcm92YWwgZG9uJ3Qgc3VwcG9ydCBjb21tZW50IGlucHV0LlxuICAgICAgICB9LFxuICAgICAgICBkZWNvcmF0b3JzOiB7XG4gICAgICAgICAgICBzaXpldG9maXQ6IHNpemVUb0ZpdCgkcmVhY3Rpb25zV2luZG93KVxuICAgICAgICB9LFxuICAgICAgICBwYXJ0aWFsczoge1xuICAgICAgICAgICAgbG9jYXRpb25JY29uOiBTVkdzLmxvY2F0aW9uLFxuICAgICAgICAgICAgY29tbWVudHNJY29uOiBTVkdzLmNvbW1lbnRzXG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIGlmIChjb250YWluZXJFbGVtZW50KSB7XG4gICAgICAgIHJhY3RpdmUub24oJ2hpZ2hsaWdodCcsIGhpZ2hsaWdodENvbnRlbnQoY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGNvbnRhaW5lckVsZW1lbnQpKTtcbiAgICAgICAgcmFjdGl2ZS5vbignY2xlYXJoaWdobGlnaHRzJywgUmFuZ2UuY2xlYXJIaWdobGlnaHRzKTtcbiAgICB9XG4gICAgcmFjdGl2ZS5vbigncGx1c29uZScsIHBsdXNPbmUpO1xuICAgIHJhY3RpdmUub24oJ3Nob3dkZWZhdWx0Jywgc2hvd0RlZmF1bHRzKTtcbiAgICByYWN0aXZlLm9uKCdzaG93Y29tbWVudHMnLCBmdW5jdGlvbihyYWN0aXZlRXZlbnQpIHsgc2hvd0NvbW1lbnRzKHJhY3RpdmVFdmVudC5jb250ZXh0LCBwYWdlU2VsZWN0b3IpOyByZXR1cm4gZmFsc2U7IH0pOyAvLyBUT0RPIGNsZWFuIHVwXG4gICAgcmFjdGl2ZS5vbignc2hvd2xvY2F0aW9ucycsIGZ1bmN0aW9uKHJhY3RpdmVFdmVudCkgeyBzaG93TG9jYXRpb25zKHJhY3RpdmVFdmVudC5jb250ZXh0LCBwYWdlU2VsZWN0b3IpOyByZXR1cm4gZmFsc2U7IH0pOyAvLyBUT0RPIGNsZWFuIHVwXG4gICAgcmV0dXJuIHtcbiAgICAgICAgc2VsZWN0b3I6IHBhZ2VTZWxlY3RvcixcbiAgICAgICAgdGVhcmRvd246IGZ1bmN0aW9uKCkgeyByYWN0aXZlLnRlYXJkb3duKCk7IH1cbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gYXJyYXlBY2Nlc3NvcihhcnJheSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oaW5kZXgpIHtcbiAgICAgICAgICAgIHJldHVybiBhcnJheVtpbmRleF07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwbHVzT25lKHJhY3RpdmVFdmVudCkge1xuICAgICAgICB2YXIgcmVhY3Rpb25EYXRhID0gcmFjdGl2ZUV2ZW50LmNvbnRleHQ7XG4gICAgICAgIHZhciByZWFjdGlvblByb3ZpZGVyID0geyAvLyB0aGlzIHJlYWN0aW9uIHByb3ZpZGVyIGlzIGEgbm8tYnJhaW5lciBiZWNhdXNlIHdlIGFscmVhZHkgaGF2ZSBhIHZhbGlkIHJlYWN0aW9uIChvbmUgd2l0aCBhbiBJRClcbiAgICAgICAgICAgIGdldDogZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhyZWFjdGlvbkRhdGEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBzaG93Q29uZmlybWF0aW9uKHJlYWN0aW9uRGF0YSwgcmVhY3Rpb25Qcm92aWRlcik7XG4gICAgICAgIEFqYXhDbGllbnQucG9zdFBsdXNPbmUocmVhY3Rpb25EYXRhLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgc3VjY2VzcywgZXJyb3IpO1xuXG4gICAgICAgIGZ1bmN0aW9uIHN1Y2Nlc3MocmVhY3Rpb25EYXRhKSB7XG4gICAgICAgICAgICBFdmVudHMucG9zdFJlYWN0aW9uQ3JlYXRlZChwYWdlRGF0YSwgY29udGFpbmVyRGF0YSwgcmVhY3Rpb25EYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGVycm9yKG1lc3NhZ2UpIHtcbiAgICAgICAgICAgIHZhciByZXRyeSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIEFqYXhDbGllbnQucG9zdFBsdXNPbmUocmVhY3Rpb25EYXRhLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgc3VjY2VzcywgZXJyb3IpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGhhbmRsZVJlYWN0aW9uRXJyb3IobWVzc2FnZSwgcmV0cnksIHBhZ2VTZWxlY3Rvcik7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIHNpemVUb0ZpdCgkcmVhY3Rpb25zV2luZG93KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgdmFyICRlbGVtZW50ID0gJChub2RlKS5jbG9zZXN0KCcuYW50ZW5uYS1yZWFjdGlvbi1ib3gnKTtcbiAgICAgICAgLy8gV2hpbGUgd2UncmUgc2l6aW5nIHRoZSB0ZXh0IHRvIGZpeCBpbiB0aGUgcmVhY3Rpb24gYm94LCB3ZSBhbHNvIGZpeCB1cCB0aGUgd2lkdGggb2YgdGhlIHJlYWN0aW9uIGNvdW50IGFuZFxuICAgICAgICAvLyBwbHVzIG9uZSBidXR0b25zIHNvIHRoYXQgdGhleSdyZSB0aGUgc2FtZS4gVGhlc2UgdHdvIHZpc3VhbGx5IHN3YXAgd2l0aCBlYWNoIG90aGVyIG9uIGhvdmVyOyBtYWtpbmcgdGhlbVxuICAgICAgICAvLyB0aGUgc2FtZSB3aWR0aCBtYWtlcyBzdXJlIHdlIGRvbid0IGdldCBqdW1waW5lc3Mgb24gaG92ZXIuXG4gICAgICAgIHZhciAkcmVhY3Rpb25Db3VudCA9ICRlbGVtZW50LmZpbmQoJy5hbnRlbm5hLXJlYWN0aW9uLWNvdW50Jyk7XG4gICAgICAgIHZhciAkcGx1c09uZSA9ICRlbGVtZW50LmZpbmQoJy5hbnRlbm5hLXBsdXNvbmUnKTtcbiAgICAgICAgdmFyIG1pbldpZHRoID0gTWF0aC5tYXgoJHJlYWN0aW9uQ291bnQud2lkdGgoKSwgJHBsdXNPbmUud2lkdGgoKSk7XG4gICAgICAgIG1pbldpZHRoKys7IC8vIEFkZCBhbiBleHRyYSBwaXhlbCBmb3Igcm91bmRpbmcgYmVjYXVzZSBlbGVtZW50cyB0aGF0IG1lYXN1cmUsIGZvciBleGFtcGxlLCAxNy4xODc1cHggY2FuIGNvbWUgYmFjayB3aXRoIDE3IGFzIHRoZSB3aWR0aCgpXG4gICAgICAgICRyZWFjdGlvbkNvdW50LmNzcyh7J21pbi13aWR0aCc6IG1pbldpZHRofSk7XG4gICAgICAgICRwbHVzT25lLmNzcyh7J21pbi13aWR0aCc6IG1pbldpZHRofSk7XG4gICAgICAgIHJldHVybiBSZWFjdGlvbnNXaWRnZXRMYXlvdXRVdGlscy5zaXplVG9GaXQoJHJlYWN0aW9uc1dpbmRvdykobm9kZSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBoaWdobGlnaHRDb250ZW50KGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCAkY29udGFpbmVyRWxlbWVudCkge1xuICAgIHJldHVybiBmdW5jdGlvbihldmVudCkge1xuICAgICAgICB2YXIgcmVhY3Rpb25EYXRhID0gZXZlbnQuY29udGV4dDtcbiAgICAgICAgaWYgKHJlYWN0aW9uRGF0YS5jb250ZW50KSB7XG4gICAgICAgICAgICB2YXIgbG9jYXRpb24gPSByZWFjdGlvbkRhdGEuY29udGVudC5sb2NhdGlvbjtcbiAgICAgICAgICAgIGlmIChsb2NhdGlvbikge1xuICAgICAgICAgICAgICAgIFJhbmdlLmhpZ2hsaWdodCgkY29udGFpbmVyRWxlbWVudC5nZXQoMCksIGxvY2F0aW9uKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZTogY3JlYXRlUGFnZVxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi91dGlscy9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciBBamF4Q2xpZW50ID0gcmVxdWlyZSgnLi91dGlscy9hamF4LWNsaWVudCcpO1xudmFyIEJyb3dzZXJNZXRyaWNzID0gcmVxdWlyZSgnLi91dGlscy9icm93c2VyLW1ldHJpY3MnKTtcbnZhciBKU09OVXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzL2pzb24tdXRpbHMnKTtcbnZhciBNZXNzYWdlcyA9IHJlcXVpcmUoJy4vdXRpbHMvbWVzc2FnZXMnKTtcbnZhciBNb3ZlYWJsZSA9IHJlcXVpcmUoJy4vdXRpbHMvbW92ZWFibGUnKTtcbnZhciBSYWN0aXZlOyByZXF1aXJlKCcuL3V0aWxzL3JhY3RpdmUtcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24obG9hZGVkUmFjdGl2ZSkgeyBSYWN0aXZlID0gbG9hZGVkUmFjdGl2ZTt9KTtcbnZhciBSYW5nZSA9IHJlcXVpcmUoJy4vdXRpbHMvcmFuZ2UnKTtcbnZhciBUb3VjaFN1cHBvcnQgPSByZXF1aXJlKCcuL3V0aWxzL3RvdWNoLXN1cHBvcnQnKTtcbnZhciBUcmFuc2l0aW9uVXRpbCA9IHJlcXVpcmUoJy4vdXRpbHMvdHJhbnNpdGlvbi11dGlsJyk7XG52YXIgVXNlciA9IHJlcXVpcmUoJy4vdXRpbHMvdXNlcicpO1xudmFyIFdpZGdldEJ1Y2tldCA9IHJlcXVpcmUoJy4vdXRpbHMvd2lkZ2V0LWJ1Y2tldCcpO1xuXG52YXIgQmxvY2tlZFJlYWN0aW9uUGFnZSA9IHJlcXVpcmUoJy4vYmxvY2tlZC1yZWFjdGlvbi1wYWdlJyk7XG52YXIgQ29tbWVudHNQYWdlID0gcmVxdWlyZSgnLi9jb21tZW50cy1wYWdlJyk7XG52YXIgQ29uZmlybWF0aW9uUGFnZSA9IHJlcXVpcmUoJy4vY29uZmlybWF0aW9uLXBhZ2UnKTtcbnZhciBEZWZhdWx0c1BhZ2UgPSByZXF1aXJlKCcuL2RlZmF1bHRzLXBhZ2UnKTtcbnZhciBFdmVudHMgPSByZXF1aXJlKCcuL2V2ZW50cycpO1xudmFyIEdlbmVyaWNFcnJvclBhZ2UgPSByZXF1aXJlKCcuL2dlbmVyaWMtZXJyb3ItcGFnZScpO1xudmFyIExvY2F0aW9uc1BhZ2UgPSByZXF1aXJlKCcuL2xvY2F0aW9ucy1wYWdlJyk7XG52YXIgTG9naW5QYWdlID0gcmVxdWlyZSgnLi9sb2dpbi1wYWdlJyk7XG52YXIgUGFnZURhdGEgPSByZXF1aXJlKCcuL3BhZ2UtZGF0YScpO1xudmFyIFBlbmRpbmdSZWFjdGlvblBhZ2UgPSByZXF1aXJlKCcuL3BlbmRpbmctcmVhY3Rpb24tcGFnZScpO1xudmFyIFJlYWN0aW9uc1BhZ2UgPSByZXF1aXJlKCcuL3JlYWN0aW9ucy1wYWdlJyk7XG52YXIgU1ZHcyA9IHJlcXVpcmUoJy4vc3ZncycpO1xuXG52YXIgUEFHRV9SRUFDVElPTlMgPSAncmVhY3Rpb25zJztcbnZhciBQQUdFX0RFRkFVTFRTID0gJ2RlZmF1bHRzJztcbnZhciBQQUdFX0FVVE8gPSAnYXV0byc7XG5cbnZhciBTRUxFQ1RPUl9SRUFDVElPTlNfV0lER0VUID0gJy5hbnRlbm5hLXJlYWN0aW9ucy13aWRnZXQnO1xuXG52YXIgb3Blbkluc3RhbmNlcyA9IFtdO1xuXG5mdW5jdGlvbiBvcGVuUmVhY3Rpb25zV2lkZ2V0KG9wdGlvbnMsIGVsZW1lbnRPckNvb3Jkcykge1xuICAgIGNsb3NlQWxsV2luZG93cygpO1xuICAgIHZhciBkZWZhdWx0UmVhY3Rpb25zID0gb3B0aW9ucy5kZWZhdWx0UmVhY3Rpb25zO1xuICAgIHZhciByZWFjdGlvbnNEYXRhID0gb3B0aW9ucy5yZWFjdGlvbnNEYXRhO1xuICAgIHZhciBjb250YWluZXJEYXRhID0gb3B0aW9ucy5jb250YWluZXJEYXRhO1xuICAgIHZhciBjb250YWluZXJFbGVtZW50ID0gb3B0aW9ucy5jb250YWluZXJFbGVtZW50OyAvLyBvcHRpb25hbFxuICAgIHZhciBzdGFydFBhZ2UgPSBvcHRpb25zLnN0YXJ0UGFnZSB8fCBQQUdFX0FVVE87IC8vIG9wdGlvbmFsXG4gICAgdmFyIGlzU3VtbWFyeSA9IG9wdGlvbnMuaXNTdW1tYXJ5ID09PSB1bmRlZmluZWQgPyBmYWxzZSA6IG9wdGlvbnMuaXNTdW1tYXJ5OyAvLyBvcHRpb25hbFxuICAgIC8vIGNvbnRlbnREYXRhIGNvbnRhaW5zIGRldGFpbHMgYWJvdXQgdGhlIGNvbnRlbnQgYmVpbmcgcmVhY3RlZCB0byBsaWtlIHRleHQgcmFuZ2Ugb3IgaW1hZ2UgaGVpZ2h0L3dpZHRoLlxuICAgIC8vIHdlIHBvdGVudGlhbGx5IG1vZGlmeSB0aGlzIGRhdGEgKGUuZy4gaW4gdGhlIGRlZmF1bHQgcmVhY3Rpb24gY2FzZSB3ZSBzZWxlY3QgdGhlIHRleHQgb3Vyc2VsdmVzKSBzbyB3ZVxuICAgIC8vIG1ha2UgYSBsb2NhbCBjb3B5IG9mIGl0IHRvIGF2b2lkIHVuZXhwZWN0ZWRseSBjaGFuZ2luZyBkYXRhIG91dCBmcm9tIHVuZGVyIG9uZSBvZiB0aGUgY2xpZW50c1xuICAgIHZhciBjb250ZW50RGF0YSA9IEpTT04ucGFyc2UoSlNPTlV0aWxzLnN0cmluZ2lmeShvcHRpb25zLmNvbnRlbnREYXRhKSk7XG4gICAgdmFyIHBhZ2VEYXRhID0gb3B0aW9ucy5wYWdlRGF0YTtcbiAgICB2YXIgZ3JvdXBTZXR0aW5ncyA9IG9wdGlvbnMuZ3JvdXBTZXR0aW5ncztcbiAgICB2YXIgcmFjdGl2ZSA9IFJhY3RpdmUoe1xuICAgICAgICBlbDogV2lkZ2V0QnVja2V0LmdldCgpLFxuICAgICAgICBhcHBlbmQ6IHRydWUsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIHN1cHBvcnRzVG91Y2g6IEJyb3dzZXJNZXRyaWNzLnN1cHBvcnRzVG91Y2goKVxuICAgICAgICB9LFxuICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL3JlYWN0aW9ucy13aWRnZXQuaGJzLmh0bWwnKSxcbiAgICAgICAgcGFydGlhbHM6IHtcbiAgICAgICAgICAgIGxvZ286IFNWR3MubG9nb1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICByYWN0aXZlLm9uKCdjbG9zZScsIGNsb3NlQWxsV2luZG93cyk7XG4gICAgdmFyICRyb290RWxlbWVudCA9ICQocm9vdEVsZW1lbnQocmFjdGl2ZSkpO1xuICAgIE1vdmVhYmxlLm1ha2VNb3ZlYWJsZSgkcm9vdEVsZW1lbnQsICRyb290RWxlbWVudC5maW5kKCcuYW50ZW5uYS1oZWFkZXInKSk7XG4gICAgdmFyIHBhZ2VzID0gW107XG5cbiAgICBvcGVuV2luZG93KCk7XG5cbiAgICBmdW5jdGlvbiBvcGVuV2luZG93KCkge1xuICAgICAgICBQYWdlRGF0YS5jbGVhckluZGljYXRvckxpbWl0KHBhZ2VEYXRhKTtcbiAgICAgICAgdmFyIGNvb3JkcztcbiAgICAgICAgaWYgKGVsZW1lbnRPckNvb3Jkcy50b3AgJiYgZWxlbWVudE9yQ29vcmRzLmxlZnQpIHtcbiAgICAgICAgICAgIGNvb3JkcyA9IGVsZW1lbnRPckNvb3JkcztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciAkcmVsYXRpdmVFbGVtZW50ID0gJChlbGVtZW50T3JDb29yZHMpO1xuICAgICAgICAgICAgdmFyIG9mZnNldCA9ICRyZWxhdGl2ZUVsZW1lbnQub2Zmc2V0KCk7XG4gICAgICAgICAgICB2YXIgYm9keU9mZnNldCA9ICQoJ2JvZHknKS5vZmZzZXQoKTsgLy8gYWNjb3VudCBmb3IgYW55IG9mZnNldCB0aGF0IHNpdGVzIGFwcGx5IHRvIHRoZSBlbnRpcmUgYm9keVxuICAgICAgICAgICAgY29vcmRzID0ge1xuICAgICAgICAgICAgICAgIHRvcDogb2Zmc2V0LnRvcCAtIGJvZHlPZmZzZXQudG9wLFxuICAgICAgICAgICAgICAgIGxlZnQ6IG9mZnNldC5sZWZ0IC0gYm9keU9mZnNldC5sZWZ0XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIHZhciBob3Jpem9udGFsT3ZlcmZsb3cgPSBjb29yZHMubGVmdCArICRyb290RWxlbWVudC53aWR0aCgpIC0gTWF0aC5tYXgoZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudFdpZHRoLCB3aW5kb3cuaW5uZXJXaWR0aCB8fCAwKTsgLy8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xMjQ4MDgxL2dldC10aGUtYnJvd3Nlci12aWV3cG9ydC1kaW1lbnNpb25zLXdpdGgtamF2YXNjcmlwdC84ODc2MDY5Izg4NzYwNjlcbiAgICAgICAgaWYgKGhvcml6b250YWxPdmVyZmxvdyA+IDApIHtcbiAgICAgICAgICAgIGNvb3Jkcy5sZWZ0ID0gY29vcmRzLmxlZnQgLSBob3Jpem9udGFsT3ZlcmZsb3c7XG4gICAgICAgIH1cbiAgICAgICAgJHJvb3RFbGVtZW50LnN0b3AodHJ1ZSwgdHJ1ZSkuYWRkQ2xhc3MoJ2FudGVubmEtcmVhY3Rpb25zLW9wZW4nKS5jc3MoY29vcmRzKTtcblxuICAgICAgICB2YXIgaXNTaG93UmVhY3Rpb25zID0gc3RhcnRQYWdlID09PSBQQUdFX1JFQUNUSU9OUyB8fCAoc3RhcnRQYWdlID09PSBQQUdFX0FVVE8gJiYgcmVhY3Rpb25zRGF0YS5sZW5ndGggPiAwKTtcbiAgICAgICAgaWYgKGlzU2hvd1JlYWN0aW9ucykge1xuICAgICAgICAgICAgc2hvd1JlYWN0aW9ucyhmYWxzZSk7XG4gICAgICAgIH0gZWxzZSB7IC8vIHN0YXJ0UGFnZSA9PT0gcGFnZURlZmF1bHRzIHx8IHRoZXJlIGFyZSBubyByZWFjdGlvbnNcbiAgICAgICAgICAgIHNob3dEZWZhdWx0UmVhY3Rpb25zUGFnZShmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlzU3VtbWFyeSkge1xuICAgICAgICAgICAgRXZlbnRzLnBvc3RTdW1tYXJ5T3BlbmVkKGlzU2hvd1JlYWN0aW9ucywgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgRXZlbnRzLnBvc3RSZWFjdGlvbldpZGdldE9wZW5lZChpc1Nob3dSZWFjdGlvbnMsIHBhZ2VEYXRhLCBjb250YWluZXJEYXRhLCBjb250ZW50RGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIH1cblxuICAgICAgICBzZXR1cFdpbmRvd0Nsb3NlKHBhZ2VzLCByYWN0aXZlKTtcbiAgICAgICAgcHJldmVudEV4dHJhU2Nyb2xsKCRyb290RWxlbWVudCk7XG4gICAgICAgIG9wZW5JbnN0YW5jZXMucHVzaChyYWN0aXZlKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzaG93UmVhY3Rpb25zKGFuaW1hdGUpIHtcbiAgICAgICAgdmFyIG9wdGlvbnMgPSB7XG4gICAgICAgICAgICBpc1N1bW1hcnk6IGlzU3VtbWFyeSxcbiAgICAgICAgICAgIHJlYWN0aW9uc0RhdGE6IHJlYWN0aW9uc0RhdGEsXG4gICAgICAgICAgICBwYWdlRGF0YTogcGFnZURhdGEsXG4gICAgICAgICAgICBncm91cFNldHRpbmdzOiBncm91cFNldHRpbmdzLFxuICAgICAgICAgICAgY29udGFpbmVyRGF0YTogY29udGFpbmVyRGF0YSxcbiAgICAgICAgICAgIGNvbnRhaW5lckVsZW1lbnQ6IGNvbnRhaW5lckVsZW1lbnQsXG4gICAgICAgICAgICBzaG93Q29uZmlybWF0aW9uOiBzaG93Q29uZmlybWF0aW9uLFxuICAgICAgICAgICAgc2hvd0RlZmF1bHRzOiBmdW5jdGlvbigpIHsgc2hvd0RlZmF1bHRSZWFjdGlvbnNQYWdlKHRydWUpIH0sXG4gICAgICAgICAgICBzaG93Q29tbWVudHM6IHNob3dDb21tZW50cyxcbiAgICAgICAgICAgIHNob3dMb2NhdGlvbnM6IHNob3dMb2NhdGlvbnMsXG4gICAgICAgICAgICBoYW5kbGVSZWFjdGlvbkVycm9yOiBoYW5kbGVSZWFjdGlvbkVycm9yLFxuICAgICAgICAgICAgZWxlbWVudDogcGFnZUNvbnRhaW5lcihyYWN0aXZlKSxcbiAgICAgICAgICAgIHJlYWN0aW9uc1dpbmRvdzogJHJvb3RFbGVtZW50XG4gICAgICAgIH07XG4gICAgICAgIHZhciBwYWdlID0gUmVhY3Rpb25zUGFnZS5jcmVhdGUob3B0aW9ucyk7XG4gICAgICAgIHBhZ2VzLnB1c2gocGFnZSk7XG4gICAgICAgIHNob3dQYWdlKHBhZ2Uuc2VsZWN0b3IsICRyb290RWxlbWVudCwgYW5pbWF0ZSwgZmFsc2UpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNob3dEZWZhdWx0UmVhY3Rpb25zUGFnZShhbmltYXRlKSB7XG4gICAgICAgIGlmIChjb250YWluZXJFbGVtZW50ICYmICFjb250ZW50RGF0YS5sb2NhdGlvbiAmJiAhY29udGVudERhdGEuYm9keSkge1xuICAgICAgICAgICAgUmFuZ2UuZ3JhYk5vZGUoY29udGFpbmVyRWxlbWVudC5nZXQoMCksIGZ1bmN0aW9uICh0ZXh0LCBsb2NhdGlvbikge1xuICAgICAgICAgICAgICAgIGNvbnRlbnREYXRhLmxvY2F0aW9uID0gbG9jYXRpb247XG4gICAgICAgICAgICAgICAgY29udGVudERhdGEuYm9keSA9IHRleHQ7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgb3B0aW9ucyA9IHsgLy8gVE9ETzogY2xlYW4gdXAgdGhlIG51bWJlciBvZiB0aGVzZSBcIm9wdGlvbnNcIiBvYmplY3RzIHRoYXQgd2UgY3JlYXRlLlxuICAgICAgICAgICAgZGVmYXVsdFJlYWN0aW9uczogZGVmYXVsdFJlYWN0aW9ucyxcbiAgICAgICAgICAgIHBhZ2VEYXRhOiBwYWdlRGF0YSxcbiAgICAgICAgICAgIGdyb3VwU2V0dGluZ3M6IGdyb3VwU2V0dGluZ3MsXG4gICAgICAgICAgICBjb250YWluZXJEYXRhOiBjb250YWluZXJEYXRhLFxuICAgICAgICAgICAgY29udGVudERhdGE6IGNvbnRlbnREYXRhLFxuICAgICAgICAgICAgc2hvd0NvbmZpcm1hdGlvbjogc2hvd0NvbmZpcm1hdGlvbixcbiAgICAgICAgICAgIHNob3dQZW5kaW5nQXBwcm92YWw6IHNob3dQZW5kaW5nQXBwcm92YWwsXG4gICAgICAgICAgICBzaG93UHJvZ3Jlc3M6IHNob3dQcm9ncmVzc1BhZ2UsXG4gICAgICAgICAgICBoYW5kbGVSZWFjdGlvbkVycm9yOiBoYW5kbGVSZWFjdGlvbkVycm9yLFxuICAgICAgICAgICAgZWxlbWVudDogcGFnZUNvbnRhaW5lcihyYWN0aXZlKSxcbiAgICAgICAgICAgIHJlYWN0aW9uc1dpbmRvdzogJHJvb3RFbGVtZW50XG4gICAgICAgIH07XG4gICAgICAgIHNldFdpbmRvd1RpdGxlKE1lc3NhZ2VzLmdldE1lc3NhZ2UoJ3JlYWN0aW9uc193aWRnZXRfX3RpdGxlX3RoaW5rJykpO1xuICAgICAgICB2YXIgcGFnZSA9IERlZmF1bHRzUGFnZS5jcmVhdGUob3B0aW9ucyk7XG4gICAgICAgIHBhZ2VzLnB1c2gocGFnZSk7XG4gICAgICAgIHNob3dQYWdlKHBhZ2Uuc2VsZWN0b3IsICRyb290RWxlbWVudCwgYW5pbWF0ZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2hvd0NvbmZpcm1hdGlvbihyZWFjdGlvbkRhdGEsIHJlYWN0aW9uUHJvdmlkZXIpIHtcbiAgICAgICAgc2V0V2luZG93VGl0bGUoTWVzc2FnZXMuZ2V0TWVzc2FnZSgncmVhY3Rpb25zX3dpZGdldF9fdGl0bGVfdGhhbmtzJykpO1xuICAgICAgICB2YXIgcGFnZSA9IENvbmZpcm1hdGlvblBhZ2UuY3JlYXRlKHJlYWN0aW9uRGF0YS50ZXh0LCByZWFjdGlvblByb3ZpZGVyLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncywgcGFnZUNvbnRhaW5lcihyYWN0aXZlKSk7XG4gICAgICAgIHBhZ2VzLnB1c2gocGFnZSk7XG4gICAgICAgIC8vIFRPRE86IHJldmlzaXQgd2h5IHdlIG5lZWQgdG8gdXNlIHRoZSB0aW1lb3V0IHRyaWNrIGZvciB0aGUgY29uZmlybSBwYWdlLCBidXQgbm90IGZvciB0aGUgZGVmYXVsdHMgcGFnZVxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyAvLyBJbiBvcmRlciBmb3IgdGhlIHBvc2l0aW9uaW5nIGFuaW1hdGlvbiB0byB3b3JrLCB3ZSBuZWVkIHRvIGxldCB0aGUgYnJvd3NlciByZW5kZXIgdGhlIGFwcGVuZGVkIERPTSBlbGVtZW50XG4gICAgICAgICAgICBzaG93UGFnZShwYWdlLnNlbGVjdG9yLCAkcm9vdEVsZW1lbnQsIHRydWUpO1xuICAgICAgICB9LCAxKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzaG93UGVuZGluZ0FwcHJvdmFsKHJlYWN0aW9uKSB7XG4gICAgICAgIHNldFdpbmRvd1RpdGxlKE1lc3NhZ2VzLmdldE1lc3NhZ2UoJ3JlYWN0aW9uc193aWRnZXRfX3RpdGxlX3RoYW5rcycpKTtcbiAgICAgICAgdmFyIHBhZ2UgPSBQZW5kaW5nUmVhY3Rpb25QYWdlLmNyZWF0ZVBhZ2UocmVhY3Rpb24udGV4dCwgcGFnZUNvbnRhaW5lcihyYWN0aXZlKSk7XG4gICAgICAgIHBhZ2VzLnB1c2gocGFnZSk7XG4gICAgICAgIC8vIFRPRE86IHJldmlzaXQgd2h5IHdlIG5lZWQgdG8gdXNlIHRoZSB0aW1lb3V0IHRyaWNrIGZvciB0aGUgY29uZmlybSBwYWdlLCBidXQgbm90IGZvciB0aGUgZGVmYXVsdHMgcGFnZVxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyAvLyBJbiBvcmRlciBmb3IgdGhlIHBvc2l0aW9uaW5nIGFuaW1hdGlvbiB0byB3b3JrLCB3ZSBuZWVkIHRvIGxldCB0aGUgYnJvd3NlciByZW5kZXIgdGhlIGFwcGVuZGVkIERPTSBlbGVtZW50XG4gICAgICAgICAgICBzaG93UGFnZShwYWdlLnNlbGVjdG9yLCAkcm9vdEVsZW1lbnQsIHRydWUpO1xuICAgICAgICB9LCAxKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzaG93UHJvZ3Jlc3NQYWdlKCkge1xuICAgICAgICBzaG93UGFnZSgnLmFudGVubmEtcHJvZ3Jlc3MtcGFnZScsICRyb290RWxlbWVudCwgZmFsc2UsIHRydWUpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNob3dDb21tZW50cyhyZWFjdGlvbiwgYmFja1BhZ2VTZWxlY3Rvcikge1xuICAgICAgICBzaG93UHJvZ3Jlc3NQYWdlKCk7IC8vIFRPRE86IHByb3ZpZGUgc29tZSB3YXkgZm9yIHRoZSB1c2VyIHRvIGdpdmUgdXAgLyBjYW5jZWwuIEFsc28sIGhhbmRsZSBlcnJvcnMgZmV0Y2hpbmcgY29tbWVudHMuXG4gICAgICAgIHZhciBzdWNjZXNzID0gZnVuY3Rpb24oY29tbWVudHMpIHtcbiAgICAgICAgICAgIHZhciBvcHRpb25zID0ge1xuICAgICAgICAgICAgICAgIHJlYWN0aW9uOiByZWFjdGlvbixcbiAgICAgICAgICAgICAgICBjb21tZW50czogY29tbWVudHMsXG4gICAgICAgICAgICAgICAgZWxlbWVudDogcGFnZUNvbnRhaW5lcihyYWN0aXZlKSxcbiAgICAgICAgICAgICAgICBnb0JhY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBzZXRXaW5kb3dUaXRsZShNZXNzYWdlcy5nZXRNZXNzYWdlKCdyZWFjdGlvbnNfd2lkZ2V0X190aXRsZScpKTtcbiAgICAgICAgICAgICAgICAgICAgZ29CYWNrVG9QYWdlKHBhZ2VzLCBiYWNrUGFnZVNlbGVjdG9yLCAkcm9vdEVsZW1lbnQpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgY29udGFpbmVyRGF0YTogY29udGFpbmVyRGF0YSxcbiAgICAgICAgICAgICAgICBwYWdlRGF0YTogcGFnZURhdGEsXG4gICAgICAgICAgICAgICAgZ3JvdXBTZXR0aW5nczogZ3JvdXBTZXR0aW5nc1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHZhciBwYWdlID0gQ29tbWVudHNQYWdlLmNyZWF0ZShvcHRpb25zKTtcbiAgICAgICAgICAgIHBhZ2VzLnB1c2gocGFnZSk7XG5cbiAgICAgICAgICAgIC8vIFRPRE86IHJldmlzaXRcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IC8vIEluIG9yZGVyIGZvciB0aGUgcG9zaXRpb25pbmcgYW5pbWF0aW9uIHRvIHdvcmssIHdlIG5lZWQgdG8gbGV0IHRoZSBicm93c2VyIHJlbmRlciB0aGUgYXBwZW5kZWQgRE9NIGVsZW1lbnRcbiAgICAgICAgICAgICAgICBzaG93UGFnZShwYWdlLnNlbGVjdG9yLCAkcm9vdEVsZW1lbnQsIHRydWUpO1xuICAgICAgICAgICAgfSwgMSk7XG5cbiAgICAgICAgICAgIEV2ZW50cy5wb3N0Q29tbWVudHNWaWV3ZWQocGFnZURhdGEsIGNvbnRhaW5lckRhdGEsIHJlYWN0aW9uLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIGVycm9yID0gZnVuY3Rpb24obWVzc2FnZSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ0FuIGVycm9yIG9jY3VycmVkIGZldGNoaW5nIGNvbW1lbnRzOiAnICsgbWVzc2FnZSk7XG4gICAgICAgICAgICBzaG93R2VuZXJpY0Vycm9yUGFnZShiYWNrUGFnZVNlbGVjdG9yKTtcbiAgICAgICAgfTtcbiAgICAgICAgQWpheENsaWVudC5nZXRDb21tZW50cyhyZWFjdGlvbiwgc3VjY2VzcywgZXJyb3IpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNob3dMb2NhdGlvbnMocmVhY3Rpb24sIGJhY2tQYWdlU2VsZWN0b3IpIHtcbiAgICAgICAgc2hvd1Byb2dyZXNzUGFnZSgpOyAvLyBUT0RPOiBwcm92aWRlIHNvbWUgd2F5IGZvciB0aGUgdXNlciB0byBnaXZlIHVwIC8gY2FuY2VsLiBBbHNvLCBoYW5kbGUgZXJyb3JzIGZldGNoaW5nIGNvbW1lbnRzLlxuICAgICAgICB2YXIgcmVhY3Rpb25Mb2NhdGlvbkRhdGEgPSBQYWdlRGF0YS5nZXRSZWFjdGlvbkxvY2F0aW9uRGF0YShyZWFjdGlvbiwgcGFnZURhdGEpO1xuICAgICAgICB2YXIgc3VjY2VzcyA9IGZ1bmN0aW9uKGxvY2F0aW9uRGV0YWlscykge1xuICAgICAgICAgICAgUGFnZURhdGEudXBkYXRlUmVhY3Rpb25Mb2NhdGlvbkRhdGEocmVhY3Rpb25Mb2NhdGlvbkRhdGEsIGxvY2F0aW9uRGV0YWlscyk7XG4gICAgICAgICAgICB2YXIgb3B0aW9ucyA9IHsgLy8gVE9ETzogY2xlYW4gdXAgdGhlIG51bWJlciBvZiB0aGVzZSBcIm9wdGlvbnNcIiBvYmplY3RzIHRoYXQgd2UgY3JlYXRlLlxuICAgICAgICAgICAgICAgIGVsZW1lbnQ6IHBhZ2VDb250YWluZXIocmFjdGl2ZSksXG4gICAgICAgICAgICAgICAgcmVhY3Rpb25Mb2NhdGlvbkRhdGE6IHJlYWN0aW9uTG9jYXRpb25EYXRhLFxuICAgICAgICAgICAgICAgIHBhZ2VEYXRhOiBwYWdlRGF0YSxcbiAgICAgICAgICAgICAgICBncm91cFNldHRpbmdzOiBncm91cFNldHRpbmdzLFxuICAgICAgICAgICAgICAgIGNsb3NlV2luZG93OiBjbG9zZUFsbFdpbmRvd3MsXG4gICAgICAgICAgICAgICAgZ29CYWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgc2V0V2luZG93VGl0bGUoTWVzc2FnZXMuZ2V0TWVzc2FnZSgncmVhY3Rpb25zX3dpZGdldF9fdGl0bGUnKSk7XG4gICAgICAgICAgICAgICAgICAgIGdvQmFja1RvUGFnZShwYWdlcywgYmFja1BhZ2VTZWxlY3RvciwgJHJvb3RFbGVtZW50KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdmFyIHBhZ2UgPSBMb2NhdGlvbnNQYWdlLmNyZWF0ZShvcHRpb25zKTtcbiAgICAgICAgICAgIHBhZ2VzLnB1c2gocGFnZSk7XG4gICAgICAgICAgICBzZXRXaW5kb3dUaXRsZShyZWFjdGlvbi50ZXh0KTtcbiAgICAgICAgICAgIC8vIFRPRE86IHJldmlzaXRcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IC8vIEluIG9yZGVyIGZvciB0aGUgcG9zaXRpb25pbmcgYW5pbWF0aW9uIHRvIHdvcmssIHdlIG5lZWQgdG8gbGV0IHRoZSBicm93c2VyIHJlbmRlciB0aGUgYXBwZW5kZWQgRE9NIGVsZW1lbnRcbiAgICAgICAgICAgICAgICBzaG93UGFnZShwYWdlLnNlbGVjdG9yLCAkcm9vdEVsZW1lbnQsIHRydWUpO1xuICAgICAgICAgICAgfSwgMSk7XG4gICAgICAgICAgICBFdmVudHMucG9zdExvY2F0aW9uc1ZpZXdlZChwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIH07XG4gICAgICAgIHZhciBlcnJvciA9IGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdBbiBlcnJvciBvY2N1cnJlZCBmZXRjaGluZyBjb250ZW50IGJvZGllczogJyArIG1lc3NhZ2UpO1xuICAgICAgICAgICAgc2hvd0dlbmVyaWNFcnJvclBhZ2UoYmFja1BhZ2VTZWxlY3Rvcik7XG4gICAgICAgIH07XG4gICAgICAgIEFqYXhDbGllbnQuZmV0Y2hMb2NhdGlvbkRldGFpbHMocmVhY3Rpb25Mb2NhdGlvbkRhdGEsIHBhZ2VEYXRhLCBzdWNjZXNzLCBlcnJvcik7XG4gICAgfVxuXG4gICAgLy8gU2hvd3MgdGhlIGxvZ2luIHBhZ2UsIHdpdGggYSBwcm9tcHQgdG8gZ28gQmFjayB0byB0aGUgcGFnZSBzcGVjaWZpZWQgYnkgdGhlIGdpdmVuIHBhZ2Ugc2VsZWN0b3IuXG4gICAgZnVuY3Rpb24gc2hvd0xvZ2luUGFnZShiYWNrUGFnZVNlbGVjdG9yLCByZXRyeUNhbGxiYWNrKSB7XG4gICAgICAgIHNldFdpbmRvd1RpdGxlKE1lc3NhZ2VzLmdldE1lc3NhZ2UoJ3JlYWN0aW9uc193aWRnZXRfX3RpdGxlX3NpZ25pbicpKTtcbiAgICAgICAgdmFyIG9wdGlvbnMgPSB7XG4gICAgICAgICAgICBlbGVtZW50OiBwYWdlQ29udGFpbmVyKHJhY3RpdmUpLFxuICAgICAgICAgICAgZ3JvdXBTZXR0aW5nczogZ3JvdXBTZXR0aW5ncyxcbiAgICAgICAgICAgIGdvQmFjazogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgc2V0V2luZG93VGl0bGUoTWVzc2FnZXMuZ2V0TWVzc2FnZSgncmVhY3Rpb25zX3dpZGdldF9fdGl0bGUnKSk7XG4gICAgICAgICAgICAgICAgZ29CYWNrVG9QYWdlKHBhZ2VzLCBiYWNrUGFnZVNlbGVjdG9yLCAkcm9vdEVsZW1lbnQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJldHJ5OiByZXRyeUNhbGxiYWNrXG4gICAgICAgIH07XG4gICAgICAgIHZhciBwYWdlID0gTG9naW5QYWdlLmNyZWF0ZVBhZ2Uob3B0aW9ucyk7XG4gICAgICAgIHBhZ2VzLnB1c2gocGFnZSk7XG5cbiAgICAgICAgLy8gVE9ETzogcmV2aXNpdCB3aHkgd2UgbmVlZCB0byB1c2UgdGhlIHRpbWVvdXQgdHJpY2sgZm9yIHRoZSBjb25maXJtIHBhZ2UsIGJ1dCBub3QgZm9yIHRoZSBkZWZhdWx0cyBwYWdlXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IC8vIEluIG9yZGVyIGZvciB0aGUgcG9zaXRpb25pbmcgYW5pbWF0aW9uIHRvIHdvcmssIHdlIG5lZWQgdG8gbGV0IHRoZSBicm93c2VyIHJlbmRlciB0aGUgYXBwZW5kZWQgRE9NIGVsZW1lbnRcbiAgICAgICAgICAgIHNob3dQYWdlKHBhZ2Uuc2VsZWN0b3IsICRyb290RWxlbWVudCwgdHJ1ZSk7XG4gICAgICAgIH0sIDEpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNob3dCbG9ja2VkUmVhY3Rpb25QYWdlKGJhY2tQYWdlU2VsZWN0b3IpIHtcbiAgICAgICAgc2V0V2luZG93VGl0bGUoTWVzc2FnZXMuZ2V0TWVzc2FnZSgncmVhY3Rpb25zX3dpZGdldF9fdGl0bGVfYmxvY2tlZCcpKTtcbiAgICAgICAgdmFyIG9wdGlvbnMgPSB7XG4gICAgICAgICAgICBlbGVtZW50OiBwYWdlQ29udGFpbmVyKHJhY3RpdmUpLFxuICAgICAgICAgICAgZ3JvdXBTZXR0aW5nczogZ3JvdXBTZXR0aW5ncyxcbiAgICAgICAgICAgIGdvQmFjazogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgc2V0V2luZG93VGl0bGUoTWVzc2FnZXMuZ2V0TWVzc2FnZSgncmVhY3Rpb25zX3dpZGdldF9fdGl0bGUnKSk7XG4gICAgICAgICAgICAgICAgZ29CYWNrVG9QYWdlKHBhZ2VzLCBiYWNrUGFnZVNlbGVjdG9yLCAkcm9vdEVsZW1lbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICB2YXIgcGFnZSA9IEJsb2NrZWRSZWFjdGlvblBhZ2UuY3JlYXRlUGFnZShvcHRpb25zKTtcbiAgICAgICAgcGFnZXMucHVzaChwYWdlKTtcblxuICAgICAgICAvLyBUT0RPOiByZXZpc2l0IHdoeSB3ZSBuZWVkIHRvIHVzZSB0aGUgdGltZW91dCB0cmljayBmb3IgdGhlIGNvbmZpcm0gcGFnZSwgYnV0IG5vdCBmb3IgdGhlIGRlZmF1bHRzIHBhZ2VcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHsgLy8gSW4gb3JkZXIgZm9yIHRoZSBwb3NpdGlvbmluZyBhbmltYXRpb24gdG8gd29yaywgd2UgbmVlZCB0byBsZXQgdGhlIGJyb3dzZXIgcmVuZGVyIHRoZSBhcHBlbmRlZCBET00gZWxlbWVudFxuICAgICAgICAgICAgc2hvd1BhZ2UocGFnZS5zZWxlY3RvciwgJHJvb3RFbGVtZW50LCB0cnVlKTtcbiAgICAgICAgfSwgMSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2hvd0dlbmVyaWNFcnJvclBhZ2UoYmFja1BhZ2VTZWxlY3Rvcikge1xuICAgICAgICBzZXRXaW5kb3dUaXRsZShNZXNzYWdlcy5nZXRNZXNzYWdlKCdyZWFjdGlvbnNfd2lkZ2V0X190aXRsZV9lcnJvcicpKTtcbiAgICAgICAgdmFyIG9wdGlvbnMgPSB7XG4gICAgICAgICAgICBlbGVtZW50OiBwYWdlQ29udGFpbmVyKHJhY3RpdmUpLFxuICAgICAgICAgICAgZ29CYWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBzZXRXaW5kb3dUaXRsZShNZXNzYWdlcy5nZXRNZXNzYWdlKCdyZWFjdGlvbnNfd2lkZ2V0X190aXRsZScpKTtcbiAgICAgICAgICAgICAgICBnb0JhY2tUb1BhZ2UocGFnZXMsIGJhY2tQYWdlU2VsZWN0b3IsICRyb290RWxlbWVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHZhciBwYWdlID0gR2VuZXJpY0Vycm9yUGFnZS5jcmVhdGVQYWdlKG9wdGlvbnMpO1xuICAgICAgICBwYWdlcy5wdXNoKHBhZ2UpO1xuXG4gICAgICAgIC8vIFRPRE86IHJldmlzaXQgd2h5IHdlIG5lZWQgdG8gdXNlIHRoZSB0aW1lb3V0IHRyaWNrIGZvciB0aGUgY29uZmlybSBwYWdlLCBidXQgbm90IGZvciB0aGUgZGVmYXVsdHMgcGFnZVxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyAvLyBJbiBvcmRlciBmb3IgdGhlIHBvc2l0aW9uaW5nIGFuaW1hdGlvbiB0byB3b3JrLCB3ZSBuZWVkIHRvIGxldCB0aGUgYnJvd3NlciByZW5kZXIgdGhlIGFwcGVuZGVkIERPTSBlbGVtZW50XG4gICAgICAgICAgICBzaG93UGFnZShwYWdlLnNlbGVjdG9yLCAkcm9vdEVsZW1lbnQsIHRydWUpO1xuICAgICAgICB9LCAxKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBoYW5kbGVSZWFjdGlvbkVycm9yKG1lc3NhZ2UsIHJldHJ5Q2FsbGJhY2ssIGJhY2tQYWdlU2VsZWN0b3IpIHtcbiAgICAgICAgaWYgKG1lc3NhZ2UuaW5kZXhPZignc2lnbiBpbiByZXF1aXJlZCBmb3Igb3JnYW5pYyByZWFjdGlvbnMnKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIHNob3dMb2dpblBhZ2UoYmFja1BhZ2VTZWxlY3RvciwgcmV0cnlDYWxsYmFjayk7XG4gICAgICAgIH0gZWxzZSBpZiAobWVzc2FnZS5pbmRleE9mKCdHcm91cCBoYXMgYmxvY2tlZCB0aGlzIHRhZy4nKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIHNob3dCbG9ja2VkUmVhY3Rpb25QYWdlKGJhY2tQYWdlU2VsZWN0b3IpO1xuICAgICAgICB9IGVsc2UgaWYgKGlzVG9rZW5FcnJvcihtZXNzYWdlKSkge1xuICAgICAgICAgICAgVXNlci5yZUF1dGhvcml6ZVVzZXIoZnVuY3Rpb24oaGFzTmV3VG9rZW4pIHtcbiAgICAgICAgICAgICAgICBpZiAoaGFzTmV3VG9rZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0cnlDYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHNob3dMb2dpblBhZ2UoYmFja1BhZ2VTZWxlY3RvciwgcmV0cnlDYWxsYmFjayk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcImVycm9yIHBvc3RpbmcgcmVhY3Rpb246IFwiICsgbWVzc2FnZSk7XG4gICAgICAgICAgICBzaG93R2VuZXJpY0Vycm9yUGFnZShiYWNrUGFnZVNlbGVjdG9yKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGlzVG9rZW5FcnJvcihtZXNzYWdlKSB7XG4gICAgICAgICAgICBzd2l0Y2gobWVzc2FnZSkge1xuICAgICAgICAgICAgICAgIGNhc2UgXCJUb2tlbiB3YXMgaW52YWxpZFwiOlxuICAgICAgICAgICAgICAgIGNhc2UgXCJGYWNlYm9vayB0b2tlbiBleHBpcmVkXCI6XG4gICAgICAgICAgICAgICAgY2FzZSBcIkZCIGdyYXBoIGVycm9yIC0gdG9rZW4gaW52YWxpZFwiOlxuICAgICAgICAgICAgICAgIGNhc2UgXCJTb2NpYWwgQXV0aCBkb2VzIG5vdCBleGlzdCBmb3IgdXNlclwiOlxuICAgICAgICAgICAgICAgIGNhc2UgXCJEYXRhIHRvIGNyZWF0ZSB0b2tlbiBpcyBtaXNzaW5nXCI6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2V0V2luZG93VGl0bGUodGl0bGUpIHtcbiAgICAgICAgJChyYWN0aXZlLmZpbmQoJy5hbnRlbm5hLXJlYWN0aW9ucy10aXRsZScpKS5odG1sKHRpdGxlKTtcbiAgICB9XG5cbn1cblxuZnVuY3Rpb24gcm9vdEVsZW1lbnQocmFjdGl2ZSkge1xuICAgIHJldHVybiByYWN0aXZlLmZpbmQoU0VMRUNUT1JfUkVBQ1RJT05TX1dJREdFVCk7XG59XG5cbmZ1bmN0aW9uIHBhZ2VDb250YWluZXIocmFjdGl2ZSkge1xuICAgIHJldHVybiByYWN0aXZlLmZpbmQoJy5hbnRlbm5hLXBhZ2UtY29udGFpbmVyJyk7XG59XG5cbnZhciBwYWdlWiA9IDEwMDA7IC8vIEl0J3Mgc2FmZSBmb3IgdGhpcyB2YWx1ZSB0byBnbyBhY3Jvc3MgaW5zdGFuY2VzLiBXZSBqdXN0IG5lZWQgaXQgdG8gY29udGludW91c2x5IGluY3JlYXNlIChtYXggdmFsdWUgaXMgb3ZlciAyIGJpbGxpb24pLlxuXG5mdW5jdGlvbiBzaG93UGFnZShwYWdlU2VsZWN0b3IsICRyb290RWxlbWVudCwgYW5pbWF0ZSwgb3ZlcmxheSkge1xuICAgIHZhciAkcGFnZSA9ICRyb290RWxlbWVudC5maW5kKHBhZ2VTZWxlY3Rvcik7XG4gICAgJHBhZ2UuY3NzKCd6LWluZGV4JywgcGFnZVopO1xuICAgIHBhZ2VaICs9IDE7XG5cbiAgICAkcGFnZS50b2dnbGVDbGFzcygnYW50ZW5uYS1wYWdlLWFuaW1hdGUnLCBhbmltYXRlKTtcblxuICAgIHZhciAkY3VycmVudCA9ICRyb290RWxlbWVudC5maW5kKCcuYW50ZW5uYS1wYWdlLWFjdGl2ZScpLm5vdChwYWdlU2VsZWN0b3IpO1xuICAgIGlmIChvdmVybGF5KSB7XG4gICAgICAgIC8vIEluIHRoZSBvdmVybGF5IGNhc2UsIHNpemUgdGhlIHBhZ2UgdG8gbWF0Y2ggd2hhdGV2ZXIgcGFnZSBpcyBjdXJyZW50bHkgc2hvd2luZyBhbmQgdGhlbiBtYWtlIGl0IGFjdGl2ZSAodGhlcmUgd2lsbCBiZSB0d28gJ2FjdGl2ZScgcGFnZXMpXG4gICAgICAgICRwYWdlLmhlaWdodCgkY3VycmVudC5oZWlnaHQoKSk7XG4gICAgICAgICRwYWdlLmFkZENsYXNzKCdhbnRlbm5hLXBhZ2UtYWN0aXZlJyk7XG4gICAgfSBlbHNlIGlmIChhbmltYXRlKSB7XG4gICAgICAgIFRyYW5zaXRpb25VdGlsLnRvZ2dsZUNsYXNzKCRwYWdlLCAnYW50ZW5uYS1wYWdlLWFjdGl2ZScsIHRydWUsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy8gQWZ0ZXIgdGhlIG5ldyBwYWdlIHNsaWRlcyBpbnRvIHBvc2l0aW9uLCBtb3ZlIHRoZSBvdGhlciBwYWdlcyBiYWNrIG91dCBvZiB0aGUgdmlld2FibGUgYXJlYVxuICAgICAgICAgICAgJGN1cnJlbnQucmVtb3ZlQ2xhc3MoJ2FudGVubmEtcGFnZS1hY3RpdmUnKTtcbiAgICAgICAgICAgICRwYWdlLmZvY3VzKCk7XG4gICAgICAgIH0pO1xuICAgICAgICBzaXplQm9keVRvRml0KCRyb290RWxlbWVudCwgJHBhZ2UsIGFuaW1hdGUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgICRwYWdlLmFkZENsYXNzKCdhbnRlbm5hLXBhZ2UtYWN0aXZlJyk7XG4gICAgICAgICRjdXJyZW50LnJlbW92ZUNsYXNzKCdhbnRlbm5hLXBhZ2UtYWN0aXZlJyk7XG4gICAgICAgICRwYWdlLmZvY3VzKCk7XG4gICAgICAgIHNpemVCb2R5VG9GaXQoJHJvb3RFbGVtZW50LCAkcGFnZSwgYW5pbWF0ZSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBnb0JhY2tUb1BhZ2UocGFnZXMsIHBhZ2VTZWxlY3RvciwgJHJvb3RFbGVtZW50KSB7XG4gICAgdmFyICR0YXJnZXRQYWdlID0gJHJvb3RFbGVtZW50LmZpbmQocGFnZVNlbGVjdG9yKTtcbiAgICB2YXIgJGN1cnJlbnRQYWdlID0gJHJvb3RFbGVtZW50LmZpbmQoJy5hbnRlbm5hLXBhZ2UtYWN0aXZlJyk7XG4gICAgLy8gTW92ZSB0aGUgdGFyZ2V0IHBhZ2UgaW50byBwbGFjZSwgdW5kZXIgdGhlIGN1cnJlbnQgcGFnZVxuICAgICR0YXJnZXRQYWdlLmNzcygnei1pbmRleCcsIHBhcnNlSW50KCRjdXJyZW50UGFnZS5jc3MoJ3otaW5kZXgnKSkgLSAxKTtcbiAgICAkdGFyZ2V0UGFnZS50b2dnbGVDbGFzcygnYW50ZW5uYS1wYWdlLWFuaW1hdGUnLCBmYWxzZSk7XG4gICAgJHRhcmdldFBhZ2UudG9nZ2xlQ2xhc3MoJ2FudGVubmEtcGFnZS1hY3RpdmUnLCB0cnVlKTtcblxuICAgIC8vIFRoZW4gYW5pbWF0ZSB0aGUgY3VycmVudCBwYWdlIG1vdmluZyBhd2F5IHRvIHJldmVhbCB0aGUgdGFyZ2V0LlxuICAgICRjdXJyZW50UGFnZS50b2dnbGVDbGFzcygnYW50ZW5uYS1wYWdlLWFuaW1hdGUnLCB0cnVlKTtcbiAgICBUcmFuc2l0aW9uVXRpbC50b2dnbGVDbGFzcygkY3VycmVudFBhZ2UsICdhbnRlbm5hLXBhZ2UtYWN0aXZlJywgZmFsc2UsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLy8gQWZ0ZXIgdGhlIGN1cnJlbnQgcGFnZSBzbGlkZXMgaW50byBwb3NpdGlvbiwgbW92ZSBhbGwgb3RoZXIgcGFnZXMgYmFjayBvdXQgb2YgdGhlIHZpZXdhYmxlIGFyZWFcbiAgICAgICAgJHJvb3RFbGVtZW50LmZpbmQoJy5hbnRlbm5hLXBhZ2UnKS5ub3QocGFnZVNlbGVjdG9yKS5yZW1vdmVDbGFzcygnYW50ZW5uYS1wYWdlLWFjdGl2ZScpO1xuICAgICAgICAkdGFyZ2V0UGFnZS5jc3MoJ3otaW5kZXgnLCBwYWdlWisrKTsgLy8gV2hlbiB0aGUgYW5pbWF0aW9uIGlzIGRvbmUsIG1ha2Ugc3VyZSB0aGUgY3VycmVudCBwYWdlIGhhcyB0aGUgaGlnaGVzdCB6LWluZGV4IChqdXN0IGZvciBjb25zaXN0ZW5jeSlcbiAgICAgICAgLy8gVGVhcmRvd24gYWxsIG90aGVyIHBhZ2VzLiBUaGV5J2xsIGJlIHJlLWNyZWF0ZWQgaWYgbmVjZXNzYXJ5LlxuICAgICAgICB2YXIgcmVtYWluaW5nUGFnZXMgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYWdlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIHBhZ2UgPSBwYWdlc1tpXTtcbiAgICAgICAgICAgIGlmIChwYWdlLnNlbGVjdG9yID09PSBwYWdlU2VsZWN0b3IpIHtcbiAgICAgICAgICAgICAgICByZW1haW5pbmdQYWdlcy5wdXNoKHBhZ2UpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBwYWdlLnRlYXJkb3duKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcGFnZXMgPSByZW1haW5pbmdQYWdlcztcbiAgICB9KTtcbiAgICBzaXplQm9keVRvRml0KCRyb290RWxlbWVudCwgJHRhcmdldFBhZ2UsIHRydWUpO1xufVxuXG5mdW5jdGlvbiBzaXplQm9keVRvRml0KCRyb290RWxlbWVudCwgJHBhZ2UsIGFuaW1hdGUpIHtcbiAgICB2YXIgJHBhZ2VDb250YWluZXIgPSAkcm9vdEVsZW1lbnQuZmluZCgnLmFudGVubmEtcGFnZS1jb250YWluZXInKTtcbiAgICB2YXIgJGJvZHkgPSAkcGFnZS5maW5kKCcuYW50ZW5uYS1ib2R5Jyk7XG4gICAgdmFyIGN1cnJlbnRIZWlnaHQgPSAkcGFnZUNvbnRhaW5lci5jc3MoJ2hlaWdodCcpO1xuICAgICRwYWdlQ29udGFpbmVyLmNzcyh7IGhlaWdodDogJycgfSk7IC8vIENsZWFyIGFueSBwcmV2aW91c2x5IGNvbXB1dGVkIGhlaWdodCBzbyB3ZSBnZXQgYSBmcmVzaCBjb21wdXRhdGlvbiBvZiB0aGUgY2hpbGQgaGVpZ2h0c1xuICAgIHZhciBuZXdCb2R5SGVpZ2h0ID0gTWF0aC5taW4oMzAwLCAkYm9keS5nZXQoMCkuc2Nyb2xsSGVpZ2h0KTtcbiAgICAkYm9keS5jc3MoeyBoZWlnaHQ6IG5ld0JvZHlIZWlnaHQgfSk7IC8vIFRPRE86IGRvdWJsZS1jaGVjayB0aGF0IHdlIGNhbid0IGp1c3Qgc2V0IGEgbWF4LWhlaWdodCBvZiAzMDBweCBvbiB0aGUgYm9keS5cbiAgICB2YXIgZm9vdGVySGVpZ2h0ID0gJHBhZ2UuZmluZCgnLmFudGVubmEtZm9vdGVyJykub3V0ZXJIZWlnaHQoKTsgLy8gcmV0dXJucyAnbnVsbCcgaWYgdGhlcmUncyBubyBmb290ZXIuIGFkZGVkIHRvIGFuIGludGVnZXIsICdudWxsJyBhY3RzIGxpa2UgMFxuICAgIHZhciBuZXdQYWdlSGVpZ2h0ID0gbmV3Qm9keUhlaWdodCArIGZvb3RlckhlaWdodDtcbiAgICBpZiAoYW5pbWF0ZSkge1xuICAgICAgICAkcGFnZUNvbnRhaW5lci5jc3MoeyBoZWlnaHQ6IGN1cnJlbnRIZWlnaHQgfSk7XG4gICAgICAgICRwYWdlQ29udGFpbmVyLmFuaW1hdGUoeyBoZWlnaHQ6IG5ld1BhZ2VIZWlnaHQgfSwgMjAwKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAkcGFnZUNvbnRhaW5lci5jc3MoeyBoZWlnaHQ6IG5ld1BhZ2VIZWlnaHQgfSk7XG4gICAgfVxuICAgIC8vIFRPRE86IHdlIG1pZ2h0IG5vdCBuZWVkIHdpZHRoIHJlc2l6aW5nIGF0IGFsbC5cbiAgICB2YXIgbWluV2lkdGggPSAkcGFnZS5jc3MoJ21pbi13aWR0aCcpO1xuICAgIHZhciB3aWR0aCA9IHBhcnNlSW50KG1pbldpZHRoKTtcbiAgICBpZiAod2lkdGggPiAwKSB7XG4gICAgICAgIGlmIChhbmltYXRlKSB7XG4gICAgICAgICAgICAkcm9vdEVsZW1lbnQuYW5pbWF0ZSh7IHdpZHRoOiB3aWR0aCB9LCAyMDApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJHJvb3RFbGVtZW50LmNzcyh7IHdpZHRoOiB3aWR0aCB9KTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gc2V0dXBXaW5kb3dDbG9zZShwYWdlcywgcmFjdGl2ZSkge1xuICAgIHZhciAkcm9vdEVsZW1lbnQgPSAkKHJvb3RFbGVtZW50KHJhY3RpdmUpKTtcblxuICAgIC8vIFRPRE86IElmIHlvdSBtb3VzZSBvdmVyIHRoZSB0cmlnZ2VyIHNsb3dseSBmcm9tIHRoZSB0b3AgbGVmdCwgdGhlIHdpbmRvdyBvcGVucyB3aXRob3V0IGJlaW5nIHVuZGVyIHRoZSBjdXJzb3IsXG4gICAgLy8gICAgICAgc28gbm8gbW91c2VvdXQgZXZlbnQgaXMgcmVjZWl2ZWQuIFdoZW4gd2Ugb3BlbiB0aGUgd2luZG93LCB3ZSBzaG91bGQgcHJvYmFibHkganVzdCBzY29vdCBpdCB1cCBzbGlnaHRseVxuICAgIC8vICAgICAgIGlmIG5lZWRlZCB0byBhc3N1cmUgdGhhdCBpdCdzIHVuZGVyIHRoZSBjdXJzb3IuIEFsdGVybmF0aXZlbHksIHdlIGNvdWxkIGFkanVzdCB0aGUgbW91c2VvdmVyIGFyZWEgdG8gbWF0Y2hcbiAgICAvLyAgICAgICB0aGUgcmVnaW9uIHRoYXQgdGhlIHdpbmRvdyBvcGVucy5cbiAgICAkcm9vdEVsZW1lbnRcbiAgICAgICAgLm9uKCdtb3VzZW91dC5hbnRlbm5hJywgZGVsYXllZENsb3NlV2luZG93KVxuICAgICAgICAub24oJ21vdXNlb3Zlci5hbnRlbm5hJywga2VlcFdpbmRvd09wZW4pXG4gICAgICAgIC5vbignZm9jdXNpbi5hbnRlbm5hJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAvLyBPbmNlIHRoZSB3aW5kb3cgaGFzIGZvY3VzLCBkb24ndCBjbG9zZSBpdCBvbiBtb3VzZW91dC5cbiAgICAgICAgICAgIGtlZXBXaW5kb3dPcGVuKCk7XG4gICAgICAgICAgICAkcm9vdEVsZW1lbnQub2ZmKCdtb3VzZW91dC5hbnRlbm5hJyk7XG4gICAgICAgICAgICAkcm9vdEVsZW1lbnQub2ZmKCdtb3VzZW92ZXIuYW50ZW5uYScpO1xuICAgICAgICB9KTtcbiAgICAkKGRvY3VtZW50KS5vbignY2xpY2suYW50ZW5uYScsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGlmICgkKGV2ZW50LnRhcmdldCkuY2xvc2VzdChTRUxFQ1RPUl9SRUFDVElPTlNfV0lER0VUKS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIGNsb3NlQWxsV2luZG93cygpO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgdmFyIHRhcExpc3RlbmVyID0gVG91Y2hTdXBwb3J0LnNldHVwVGFwKGRvY3VtZW50LCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBpZiAoJChldmVudC50YXJnZXQpLmNsb3Nlc3QoU0VMRUNUT1JfUkVBQ1RJT05TX1dJREdFVCkubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICBjbG9zZUFsbFdpbmRvd3MoKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgdmFyIGNsb3NlVGltZXI7XG5cbiAgICBmdW5jdGlvbiBkZWxheWVkQ2xvc2VXaW5kb3coKSB7XG4gICAgICAgIGNsb3NlVGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY2xvc2VUaW1lciA9IG51bGw7XG4gICAgICAgICAgICBjbG9zZUFsbFdpbmRvd3MoKTtcbiAgICAgICAgfSwgNTAwKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBrZWVwV2luZG93T3BlbigpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KGNsb3NlVGltZXIpO1xuICAgIH1cblxuICAgIHJhY3RpdmUub24oJ2ludGVybmFsQ2xvc2VXaW5kb3cnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gQ2xvc2VzIG9uZSBwYXJ0aWN1bGFyIHJlYWN0aW9uIHdpbmRvdy4gVGhpcyBmdW5jdGlvbiBzaG91bGQgb25seSBiZSBjYWxsZWQgZnJvbSBjbG9zZUFsbFdpbmRvd3MsIHdoaWNoIGFsc29cbiAgICAgICAgLy8gY2xlYW5zIHVwIHRoZSBoYW5kbGVzIHdlIG1haW50YWluIHRvIGFsbCB3aW5kb3dzLlxuICAgICAgICBjbGVhclRpbWVvdXQoY2xvc2VUaW1lcik7XG5cbiAgICAgICAgJHJvb3RFbGVtZW50LnN0b3AodHJ1ZSwgdHJ1ZSkuZmFkZU91dCgnZmFzdCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgJHJvb3RFbGVtZW50LmNzcygnZGlzcGxheScsICcnKTsgLy8gQ2xlYXIgdGhlIGRpc3BsYXk6bm9uZSB0aGF0IGZhZGVPdXQgcHV0cyBvbiB0aGUgZWxlbWVudFxuICAgICAgICAgICAgJHJvb3RFbGVtZW50LnJlbW92ZUNsYXNzKCdhbnRlbm5hLXJlYWN0aW9ucy1vcGVuJyk7XG5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGFnZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBwYWdlc1tpXS50ZWFyZG93bigpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmFjdGl2ZS50ZWFyZG93bigpO1xuICAgICAgICB9KTtcbiAgICAgICAgUmFuZ2UuY2xlYXJIaWdobGlnaHRzKCk7XG4gICAgICAgICRyb290RWxlbWVudC5vZmYoJy5hbnRlbm5hJyk7IC8vIFVuYmluZCBhbGwgb2YgdGhlIGhhbmRsZXJzIGluIG91ciBuYW1lc3BhY2VcbiAgICAgICAgJChkb2N1bWVudCkub2ZmKCdjbGljay5hbnRlbm5hJyk7XG4gICAgICAgIHRhcExpc3RlbmVyLnRlYXJkb3duKCk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGNsb3NlQWxsV2luZG93cygpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG9wZW5JbnN0YW5jZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgb3Blbkluc3RhbmNlc1tpXS5maXJlKCdpbnRlcm5hbENsb3NlV2luZG93Jyk7XG4gICAgfVxuICAgIG9wZW5JbnN0YW5jZXMgPSBbXTtcbn1cblxuZnVuY3Rpb24gaXNPcGVuV2luZG93KCkge1xuICAgIHJldHVybiBvcGVuSW5zdGFuY2VzLmxlbmd0aCA+IDA7XG59XG5cbi8vIFByZXZlbnQgc2Nyb2xsaW5nIG9mIHRoZSBkb2N1bWVudCBhZnRlciB3ZSBzY3JvbGwgdG8gdGhlIHRvcC9ib3R0b20gb2YgdGhlIHJlYWN0aW9ucyB3aW5kb3dcbi8vIENvZGUgY29waWVkIGZyb206IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvNTgwMjQ2Ny9wcmV2ZW50LXNjcm9sbGluZy1vZi1wYXJlbnQtZWxlbWVudFxuLy8gVE9ETzogZG9lcyB0aGlzIHdvcmsgb24gbW9iaWxlP1xuZnVuY3Rpb24gcHJldmVudEV4dHJhU2Nyb2xsKCRyb290RWxlbWVudCkge1xuICAgICRyb290RWxlbWVudC5vbignRE9NTW91c2VTY3JvbGwuYW50ZW5uYSBtb3VzZXdoZWVsLmFudGVubmEnLCAnLmFudGVubmEtYm9keScsIGZ1bmN0aW9uKGV2KSB7XG4gICAgICAgIHZhciAkdGhpcyA9ICQodGhpcyksXG4gICAgICAgICAgICBzY3JvbGxUb3AgPSB0aGlzLnNjcm9sbFRvcCxcbiAgICAgICAgICAgIHNjcm9sbEhlaWdodCA9IHRoaXMuc2Nyb2xsSGVpZ2h0LFxuICAgICAgICAgICAgaGVpZ2h0ID0gJHRoaXMuaGVpZ2h0KCksXG4gICAgICAgICAgICBkZWx0YSA9IChldi50eXBlID09ICdET01Nb3VzZVNjcm9sbCcgP1xuICAgICAgICAgICAgICAgIGV2Lm9yaWdpbmFsRXZlbnQuZGV0YWlsICogLTQwIDpcbiAgICAgICAgICAgICAgICBldi5vcmlnaW5hbEV2ZW50LndoZWVsRGVsdGEpLFxuICAgICAgICAgICAgdXAgPSBkZWx0YSA+IDA7XG5cbiAgICAgICAgaWYgKHNjcm9sbEhlaWdodCA8PSBoZWlnaHQpIHtcbiAgICAgICAgICAgIC8vIFRoaXMgaXMgYW4gYWRkaXRpb24gdG8gdGhlIFN0YWNrT3ZlcmZsb3cgY29kZSwgdG8gbWFrZSBzdXJlIHRoZSBwYWdlIHNjcm9sbHMgYXMgdXN1YWwgaWYgdGhlIHdpbmRvd1xuICAgICAgICAgICAgLy8gY29udGVudCBkb2Vzbid0IHNjcm9sbC5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBwcmV2ZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBldi5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBldi5yZXR1cm5WYWx1ZSA9IGZhbHNlO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9O1xuXG4gICAgICAgIGlmICghdXAgJiYgLWRlbHRhID4gc2Nyb2xsSGVpZ2h0IC0gaGVpZ2h0IC0gc2Nyb2xsVG9wKSB7XG4gICAgICAgICAgICAvLyBTY3JvbGxpbmcgZG93biwgYnV0IHRoaXMgd2lsbCB0YWtlIHVzIHBhc3QgdGhlIGJvdHRvbS5cbiAgICAgICAgICAgICR0aGlzLnNjcm9sbFRvcChzY3JvbGxIZWlnaHQpO1xuICAgICAgICAgICAgcmV0dXJuIHByZXZlbnQoKTtcbiAgICAgICAgfSBlbHNlIGlmICh1cCAmJiBkZWx0YSA+IHNjcm9sbFRvcCkge1xuICAgICAgICAgICAgLy8gU2Nyb2xsaW5nIHVwLCBidXQgdGhpcyB3aWxsIHRha2UgdXMgcGFzdCB0aGUgdG9wLlxuICAgICAgICAgICAgJHRoaXMuc2Nyb2xsVG9wKDApO1xuICAgICAgICAgICAgcmV0dXJuIHByZXZlbnQoKTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgb3Blbjogb3BlblJlYWN0aW9uc1dpZGdldCxcbiAgICBpc09wZW46IGlzT3BlbldpbmRvdyxcbiAgICBQQUdFX1JFQUNUSU9OUzogUEFHRV9SRUFDVElPTlMsXG4gICAgUEFHRV9ERUZBVUxUUzogUEFHRV9ERUZBVUxUUyxcbiAgICBQQUdFX0FVVE86IFBBR0VfQVVUTyxcbiAgICBzZWxlY3RvcjogU0VMRUNUT1JfUkVBQ1RJT05TX1dJREdFVCxcbiAgICB0ZWFyZG93bjogY2xvc2VBbGxXaW5kb3dzXG59OyIsIi8vIFRoaXMgbW9kdWxlIHNldHMgdXAgbGlzdGVuZXJzIG9uIHRoZSByZWFkbW9yZSB3aWRnZXQgaW4gb3JkZXIgdG8gcmVjb3JkIGV2ZW50cyB1c2luZyBhbGwgdGhlIGRhdGEgYXZhaWxhYmxlIHRvXG4vLyB0aGUgcmVhY3Rpb24gd2lkZ2V0LlxuXG52YXIgVGhyb3R0bGVkRXZlbnRzID0gcmVxdWlyZSgnLi91dGlscy90aHJvdHRsZWQtZXZlbnRzJyk7XG52YXIgRXZlbnRzID0gcmVxdWlyZSgnLi9ldmVudHMnKTtcblxuZnVuY3Rpb24gc2V0dXBSZWFkTW9yZUV2ZW50cyhlbGVtZW50LCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciByZWFkTW9yZUVsZW1lbnQgPSBlbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy5hbnRlbm5hLXJlYWRtb3JlJyk7XG4gICAgaWYgKHJlYWRNb3JlRWxlbWVudCkge1xuICAgICAgICB2YXIgcmVhZE1vcmVBY3Rpb24gPSByZWFkTW9yZUVsZW1lbnQucXVlcnlTZWxlY3RvcignLmFudGVubmEtcmVhZG1vcmUtYWN0aW9uJyk7XG4gICAgICAgIGlmIChyZWFkTW9yZUFjdGlvbikge1xuICAgICAgICAgICAgRXZlbnRzLnBvc3RSZWFkTW9yZUxvYWRlZChwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICBzZXR1cFZpc2liaWxpdHlMaXN0ZW5lcigpO1xuICAgICAgICAgICAgLy8gVE9ETzogQm90aCB0aGUgcmVhZG1vcmUgd2lkZ2V0IGFuZCB0aGlzIGNvZGUgc2hvdWxkIGJlIG1vdmVkIHRvIHVzaW5nIHRvdWNoIGV2ZW50c1xuICAgICAgICAgICAgcmVhZE1vcmVBY3Rpb24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmaXJlQ2xpY2tlZCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgdmFyIHZpc2liaWxpdHlGaXJlZCA9IGZhbHNlO1xuXG4gICAgZnVuY3Rpb24gc2V0dXBWaXNpYmlsaXR5TGlzdGVuZXIoKSB7XG4gICAgICAgIGlmIChpc1Zpc2libGUoKSkge1xuICAgICAgICAgICAgZmlyZVZpc2libGUoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIFRocm90dGxlZEV2ZW50cy5vbignc2Nyb2xsJywgaGFuZGxlU2Nyb2xsRXZlbnQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaGFuZGxlU2Nyb2xsRXZlbnQoKSB7XG4gICAgICAgIGlmIChpc1Zpc2libGUoKSkge1xuICAgICAgICAgICAgZmlyZVZpc2libGUoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGlzVmlzaWJsZSgpIHtcbiAgICAgICAgdmFyIGNvbnRlbnRCb3ggPSByZWFkTW9yZUVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgIHZhciB2aWV3cG9ydEJvdHRvbSA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRIZWlnaHQ7XG4gICAgICAgIHJldHVybiBjb250ZW50Qm94LnRvcCA+IDAgJiYgY29udGVudEJveC50b3AgPCB2aWV3cG9ydEJvdHRvbSAmJlxuICAgICAgICAgICAgICAgIGNvbnRlbnRCb3guYm90dG9tID4gMCAmJiBjb250ZW50Qm94LmJvdHRvbSA8IHZpZXdwb3J0Qm90dG9tO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGZpcmVDbGlja2VkKCkge1xuICAgICAgICBpZiAoIXZpc2liaWxpdHlGaXJlZCkgeyAvLyBEYXRhIGludGVncml0eSAtIG1ha2Ugc3VyZSB3ZSBhbHdheXMgZmlyZSBhIHZpc2liaWxpdHkgZXZlbnQgYmVmb3JlIGZpcmluZyBhIGNsaWNrLlxuICAgICAgICAgICAgZmlyZVZpc2libGUoKTtcbiAgICAgICAgfVxuICAgICAgICBFdmVudHMucG9zdFJlYWRNb3JlQ2xpY2tlZChwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZmlyZVZpc2libGUoKSB7XG4gICAgICAgIEV2ZW50cy5wb3N0UmVhZE1vcmVWaXNpYmxlKHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgVGhyb3R0bGVkRXZlbnRzLm9mZignc2Nyb2xsJywgaGFuZGxlU2Nyb2xsRXZlbnQpO1xuICAgICAgICB2aXNpYmlsaXR5RmlyZWQgPSB0cnVlO1xuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgc2V0dXBSZWFkTW9yZUV2ZW50czogc2V0dXBSZWFkTW9yZUV2ZW50c1xufTsiLCJ2YXIgR3JvdXBTZXR0aW5ncyA9IHJlcXVpcmUoJy4vZ3JvdXAtc2V0dGluZ3MnKTtcbnZhciBIYXNoZWRFbGVtZW50cyA9IHJlcXVpcmUoJy4vaGFzaGVkLWVsZW1lbnRzJyk7XG52YXIgUGFnZURhdGEgPSByZXF1aXJlKCcuL3BhZ2UtZGF0YScpO1xudmFyIFBhZ2VEYXRhTG9hZGVyID0gcmVxdWlyZSgnLi9wYWdlLWRhdGEtbG9hZGVyJyk7XG52YXIgUGFnZVNjYW5uZXIgPSByZXF1aXJlKCcuL3BhZ2Utc2Nhbm5lcicpO1xudmFyIFBvcHVwV2lkZ2V0ID0gcmVxdWlyZSgnLi9wb3B1cC13aWRnZXQnKTtcbnZhciBSZWFjdGlvbnNXaWRnZXQgPSByZXF1aXJlKCcuL3JlYWN0aW9ucy13aWRnZXQnKTtcblxudmFyIE11dGF0aW9uT2JzZXJ2ZXIgPSByZXF1aXJlKCcuL3V0aWxzL211dGF0aW9uLW9ic2VydmVyJyk7XG5cbmZ1bmN0aW9uIHJlaW5pdGlhbGl6ZUFsbCgpIHtcbiAgICB2YXIgZ3JvdXBTZXR0aW5ncyA9IEdyb3VwU2V0dGluZ3MuZ2V0KCk7XG4gICAgaWYgKGdyb3VwU2V0dGluZ3MpIHtcbiAgICAgICAgcmVpbml0aWFsaXplKGdyb3VwU2V0dGluZ3MpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdBbnRlbm5hIGNhbm5vdCBiZSByZWluaXRpYWxpemVkLiBHcm91cCBzZXR0aW5ncyBhcmUgbm90IGxvYWRlZC4nKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHJlaW5pdGlhbGl6ZShncm91cFNldHRpbmdzKSB7XG4gICAgUmVhY3Rpb25zV2lkZ2V0LnRlYXJkb3duKCk7XG4gICAgUG9wdXBXaWRnZXQudGVhcmRvd24oKTtcbiAgICBQYWdlU2Nhbm5lci50ZWFyZG93bigpO1xuICAgIFBhZ2VEYXRhLnRlYXJkb3duKCk7XG4gICAgSGFzaGVkRWxlbWVudHMudGVhcmRvd24oKTtcbiAgICBNdXRhdGlvbk9ic2VydmVyLnRlYXJkb3duKCk7XG5cbiAgICBQYWdlRGF0YUxvYWRlci5sb2FkKGdyb3VwU2V0dGluZ3MpO1xuICAgIFBhZ2VTY2FubmVyLnNjYW4oZ3JvdXBTZXR0aW5ncywgcmVpbml0aWFsaXplKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgcmVpbml0aWFsaXplOiByZWluaXRpYWxpemUsXG4gICAgcmVpbml0aWFsaXplQWxsOiByZWluaXRpYWxpemVBbGwsXG59OyIsInZhciBSYWN0aXZlUHJvdmlkZXIgPSByZXF1aXJlKCcuL3V0aWxzL3JhY3RpdmUtcHJvdmlkZXInKTtcbnZhciBSYW5neVByb3ZpZGVyID0gcmVxdWlyZSgnLi91dGlscy9yYW5neS1wcm92aWRlcicpO1xudmFyIEpRdWVyeVByb3ZpZGVyID0gcmVxdWlyZSgnLi91dGlscy9qcXVlcnktcHJvdmlkZXInKTtcbnZhciBBcHBNb2RlID0gcmVxdWlyZSgnLi91dGlscy9hcHAtbW9kZScpO1xudmFyIFVSTHMgPSByZXF1aXJlKCcuL3V0aWxzL3VybHMnKTtcblxudmFyIHNjcmlwdHMgPSBbXG4gICAge3NyYzogJy8vY2RuanMuY2xvdWRmbGFyZS5jb20vYWpheC9saWJzL2pxdWVyeS8yLjEuNC9qcXVlcnkubWluLmpzJywgY2FsbGJhY2s6IEpRdWVyeVByb3ZpZGVyLmxvYWRlZH0sXG4gICAgLy8gVE9ETyBtaW5pZnkgb3VyIGNvbXBpbGVkIFJhY3RpdmUgYW5kIGhvc3QgaXQgb24gYSBDRE5cbiAgICB7c3JjOiBVUkxzLmFtYXpvblMzVXJsKCkgKyAnL3dpZGdldC1uZXcvbGliL3JhY3RpdmUucnVudGltZS0wLjcuMy5taW4uanMnLCBjYWxsYmFjazogUmFjdGl2ZVByb3ZpZGVyLmxvYWRlZCwgYWJvdXRUb0xvYWQ6IFJhY3RpdmVQcm92aWRlci5hYm91dFRvTG9hZH0sXG4gICAgLy8gVE9ETyBtaW5pZnkgb3VyIGNvbXBpbGVkIFJhbmR5IGFuZCBob3N0IGl0IG9uIGEgQ0ROXG4gICAge3NyYzogVVJMcy5hbWF6b25TM1VybCgpICsgJy93aWRnZXQtbmV3L2xpYi9yYW5neS5jb21waWxlZC0xLjMuMC5taW4uanMnLCBjYWxsYmFjazogUmFuZ3lQcm92aWRlci5sb2FkZWQsIGFib3V0VG9Mb2FkOiBSYW5neVByb3ZpZGVyLmFib3V0VG9Mb2FkfVxuXTtcbmlmIChBcHBNb2RlLm9mZmxpbmUpIHtcbiAgICAvLyBVc2UgdGhlIG9mZmxpbmUgdmVyc2lvbnMgb2YgdGhlIGxpYnJhcmllcyBmb3IgZGV2ZWxvcG1lbnQuXG4gICAgc2NyaXB0cyA9IFtcbiAgICAgICAge3NyYzogVVJMcy5hcHBTZXJ2ZXJVcmwoKSArICcvc3RhdGljL2pzL2Nkbi9qcXVlcnkvMi4xLjQvanF1ZXJ5LmpzJywgY2FsbGJhY2s6IEpRdWVyeVByb3ZpZGVyLmxvYWRlZH0sXG4gICAgICAgIHtzcmM6IFVSTHMuYXBwU2VydmVyVXJsKCkgKyAnL3N0YXRpYy93aWRnZXQtbmV3L2xpYi9yYWN0aXZlLnJ1bnRpbWUtMC43LjMuanMnLCBjYWxsYmFjazogUmFjdGl2ZVByb3ZpZGVyLmxvYWRlZCwgYWJvdXRUb0xvYWQ6IFJhY3RpdmVQcm92aWRlci5hYm91dFRvTG9hZH0sXG4gICAgICAgIHtzcmM6IFVSTHMuYXBwU2VydmVyVXJsKCkgKyAnL3N0YXRpYy93aWRnZXQtbmV3L2xpYi9yYW5neS5jb21waWxlZC0xLjMuMC5qcycsIGNhbGxiYWNrOiBSYW5neVByb3ZpZGVyLmxvYWRlZCwgYWJvdXRUb0xvYWQ6IFJhbmd5UHJvdmlkZXIuYWJvdXRUb0xvYWR9XG4gICAgXTtcbn1cblxuZnVuY3Rpb24gbG9hZEFsbFNjcmlwdHMobG9hZGVkQ2FsbGJhY2spIHtcbiAgICBsb2FkU2NyaXB0cyhzY3JpcHRzLCBsb2FkZWRDYWxsYmFjayk7XG59XG5cbmZ1bmN0aW9uIGxvYWRTY3JpcHRzKHNjcmlwdHMsIGxvYWRlZENhbGxiYWNrKSB7XG4gICAgdmFyIGxvYWRpbmdDb3VudCA9IHNjcmlwdHMubGVuZ3RoO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2NyaXB0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgc2NyaXB0ID0gc2NyaXB0c1tpXTtcbiAgICAgICAgaWYgKHNjcmlwdC5hYm91dFRvTG9hZCkgeyBzY3JpcHQuYWJvdXRUb0xvYWQoKTsgfVxuICAgICAgICBsb2FkU2NyaXB0KHNjcmlwdC5zcmMsIGZ1bmN0aW9uKHNjcmlwdENhbGxiYWNrKSB7XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNjcmlwdENhbGxiYWNrKSBzY3JpcHRDYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgIGxvYWRpbmdDb3VudCA9IGxvYWRpbmdDb3VudCAtIDE7XG4gICAgICAgICAgICAgICAgaWYgKGxvYWRpbmdDb3VudCA9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChsb2FkZWRDYWxsYmFjaykgbG9hZGVkQ2FsbGJhY2soKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICB9IChzY3JpcHQuY2FsbGJhY2spKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGxvYWRTY3JpcHQoc3JjLCBjYWxsYmFjaykge1xuICAgIHZhciBoZWFkID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKVswXTtcbiAgICBpZiAoaGVhZCkge1xuICAgICAgICB2YXIgc2NyaXB0VGFnID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XG4gICAgICAgIHNjcmlwdFRhZy5zZXRBdHRyaWJ1dGUoJ3NyYycsIHNyYyk7XG4gICAgICAgIHNjcmlwdFRhZy5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCd0ZXh0L2phdmFzY3JpcHQnKTtcblxuICAgICAgICBpZiAoc2NyaXB0VGFnLnJlYWR5U3RhdGUpIHsgLy8gSUUsIGluY2wuIElFOVxuICAgICAgICAgICAgc2NyaXB0VGFnLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmIChzY3JpcHRUYWcucmVhZHlTdGF0ZSA9PSBcImxvYWRlZFwiIHx8IHNjcmlwdFRhZy5yZWFkeVN0YXRlID09IFwiY29tcGxldGVcIikge1xuICAgICAgICAgICAgICAgICAgICBzY3JpcHRUYWcub25yZWFkeXN0YXRlY2hhbmdlID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNhbGxiYWNrKSB7IGNhbGxiYWNrKCk7IH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2NyaXB0VGFnLm9ubG9hZCA9IGZ1bmN0aW9uKCkgeyAvLyBPdGhlciBicm93c2Vyc1xuICAgICAgICAgICAgICAgIGlmIChjYWxsYmFjaykgeyBjYWxsYmFjaygpOyB9XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgaGVhZC5hcHBlbmRDaGlsZChzY3JpcHRUYWcpO1xuICAgIH1cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGxvYWQ6IGxvYWRBbGxTY3JpcHRzXG59OyIsInZhciAkOyByZXF1aXJlKCcuL3V0aWxzL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIEJyb3dzZXJNZXRyaWNzID0gcmVxdWlyZSgnLi91dGlscy9icm93c2VyLW1ldHJpY3MnKTtcbnZhciBSYWN0aXZlOyByZXF1aXJlKCcuL3V0aWxzL3JhY3RpdmUtcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24obG9hZGVkUmFjdGl2ZSkgeyBSYWN0aXZlID0gbG9hZGVkUmFjdGl2ZTt9KTtcbnZhciBUb3VjaFN1cHBvcnQgPSByZXF1aXJlKCcuL3V0aWxzL3RvdWNoLXN1cHBvcnQnKTtcblxudmFyIFJlYWN0aW9uc1dpZGdldCA9IHJlcXVpcmUoJy4vcmVhY3Rpb25zLXdpZGdldCcpO1xudmFyIFNWR3MgPSByZXF1aXJlKCcuL3N2Z3MnKTtcblxuZnVuY3Rpb24gY3JlYXRlU3VtbWFyeVdpZGdldChjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgZGVmYXVsdFJlYWN0aW9ucywgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciByYWN0aXZlID0gUmFjdGl2ZSh7XG4gICAgICAgIGVsOiAkKCc8ZGl2PicpLCAvLyB0aGUgcmVhbCByb290IG5vZGUgaXMgaW4gdGhlIHRlbXBsYXRlLiBpdCdzIGV4dHJhY3RlZCBhZnRlciB0aGUgdGVtcGxhdGUgaXMgcmVuZGVyZWQgaW50byB0aGlzIGR1bW15IGVsZW1lbnRcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgcGFnZURhdGE6IHBhZ2VEYXRhLFxuICAgICAgICAgICAgaXNFeHBhbmRlZFN1bW1hcnk6IHNob3VsZFVzZUV4cGFuZGVkU3VtbWFyeShncm91cFNldHRpbmdzKSxcbiAgICAgICAgICAgIGNvbXB1dGVFeHBhbmRlZFJlYWN0aW9uczogY29tcHV0ZUV4cGFuZGVkUmVhY3Rpb25zKGdyb3VwU2V0dGluZ3MpXG4gICAgICAgIH0sXG4gICAgICAgIG1hZ2ljOiB0cnVlLFxuICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL3N1bW1hcnktd2lkZ2V0Lmhicy5odG1sJyksXG4gICAgICAgIHBhcnRpYWxzOiB7XG4gICAgICAgICAgICBsb2dvOiBTVkdzLmxvZ29cbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHZhciAkcm9vdEVsZW1lbnQgPSAkKHJvb3RFbGVtZW50KHJhY3RpdmUpKTtcbiAgICAkcm9vdEVsZW1lbnQub24oJ21vdXNlZW50ZXInLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgIG9wZW5SZWFjdGlvbnNXaW5kb3coY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGRlZmF1bHRSZWFjdGlvbnMsIGdyb3VwU2V0dGluZ3MsIHJhY3RpdmUpO1xuICAgIH0pO1xuICAgIFRvdWNoU3VwcG9ydC5zZXR1cFRhcCgkcm9vdEVsZW1lbnQuZ2V0KDApLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBpZiAoIVJlYWN0aW9uc1dpZGdldC5pc09wZW4oKSkge1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgb3BlblJlYWN0aW9uc1dpbmRvdyhjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgZGVmYXVsdFJlYWN0aW9ucywgZ3JvdXBTZXR0aW5ncywgcmFjdGl2ZSk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4ge1xuICAgICAgICBlbGVtZW50OiAkcm9vdEVsZW1lbnQsXG4gICAgICAgIHRlYXJkb3duOiBmdW5jdGlvbigpIHsgcmFjdGl2ZS50ZWFyZG93bigpOyB9XG4gICAgfTtcbn1cblxuZnVuY3Rpb24gcm9vdEVsZW1lbnQocmFjdGl2ZSkge1xuICAgIHJldHVybiByYWN0aXZlLmZpbmQoJy5hbnRlbm5hLXN1bW1hcnktd2lkZ2V0Jyk7XG59XG5cbmZ1bmN0aW9uIG9wZW5SZWFjdGlvbnNXaW5kb3coY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGRlZmF1bHRSZWFjdGlvbnMsIGdyb3VwU2V0dGluZ3MsIHJhY3RpdmUpIHtcbiAgICB2YXIgcmVhY3Rpb25zV2lkZ2V0T3B0aW9ucyA9IHtcbiAgICAgICAgaXNTdW1tYXJ5OiB0cnVlLFxuICAgICAgICByZWFjdGlvbnNEYXRhOiBwYWdlRGF0YS5zdW1tYXJ5UmVhY3Rpb25zLFxuICAgICAgICBjb250YWluZXJEYXRhOiBjb250YWluZXJEYXRhLFxuICAgICAgICBkZWZhdWx0UmVhY3Rpb25zOiBkZWZhdWx0UmVhY3Rpb25zLFxuICAgICAgICBwYWdlRGF0YTogcGFnZURhdGEsXG4gICAgICAgIGdyb3VwU2V0dGluZ3M6IGdyb3VwU2V0dGluZ3MsXG4gICAgICAgIGNvbnRlbnREYXRhOiB7IHR5cGU6ICdwYWdlJywgYm9keTogJycgfVxuICAgIH07XG4gICAgUmVhY3Rpb25zV2lkZ2V0Lm9wZW4ocmVhY3Rpb25zV2lkZ2V0T3B0aW9ucywgcm9vdEVsZW1lbnQocmFjdGl2ZSkpO1xufVxuXG5mdW5jdGlvbiBzaG91bGRVc2VFeHBhbmRlZFN1bW1hcnkoZ3JvdXBTZXR0aW5ncykge1xuICAgIHJldHVybiBncm91cFNldHRpbmdzLmlzRXhwYW5kZWRNb2JpbGVTdW1tYXJ5KCkgJiYgQnJvd3Nlck1ldHJpY3MuaXNNb2JpbGUoKTtcbn1cblxuZnVuY3Rpb24gY29tcHV0ZUV4cGFuZGVkUmVhY3Rpb25zKGdyb3VwU2V0dGluZ3MpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24ocmVhY3Rpb25zRGF0YSkge1xuICAgICAgICB2YXIgZGVmYXVsdFJlYWN0aW9ucyA9IGdyb3VwU2V0dGluZ3MuZGVmYXVsdFJlYWN0aW9ucygpO1xuICAgICAgICB2YXIgbWF4ID0gMjtcbiAgICAgICAgdmFyIGV4cGFuZGVkUmVhY3Rpb25zID0gW107XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmVhY3Rpb25zRGF0YS5sZW5ndGggJiYgZXhwYW5kZWRSZWFjdGlvbnMubGVuZ3RoIDwgbWF4OyBpKyspIHtcbiAgICAgICAgICAgIHZhciByZWFjdGlvbkRhdGEgPSByZWFjdGlvbnNEYXRhW2ldO1xuICAgICAgICAgICAgaWYgKGlzRGVmYXVsdFJlYWN0aW9uKHJlYWN0aW9uRGF0YSwgZGVmYXVsdFJlYWN0aW9ucykpIHtcbiAgICAgICAgICAgICAgICBleHBhbmRlZFJlYWN0aW9ucy5wdXNoKHJlYWN0aW9uRGF0YSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGV4cGFuZGVkUmVhY3Rpb25zO1xuICAgIH07XG59XG5cbmZ1bmN0aW9uIGlzRGVmYXVsdFJlYWN0aW9uKHJlYWN0aW9uRGF0YSwgZGVmYXVsdFJlYWN0aW9ucykge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGVmYXVsdFJlYWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoZGVmYXVsdFJlYWN0aW9uc1tpXS50ZXh0ID09PSByZWFjdGlvbkRhdGEudGV4dCkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlOiBjcmVhdGVTdW1tYXJ5V2lkZ2V0XG59OyIsInZhciBSYWN0aXZlOyByZXF1aXJlKCcuL3V0aWxzL3JhY3RpdmUtcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24obG9hZGVkUmFjdGl2ZSkgeyBSYWN0aXZlID0gbG9hZGVkUmFjdGl2ZTt9KTtcblxuLy8gQWJvdXQgaG93IHdlIGhhbmRsZSBpY29uczogV2UgaW5zZXJ0IGEgc2luZ2xlIFNWRyBlbGVtZW50IGF0IHRoZSB0b3Agb2YgdGhlIGJvZHkgZWxlbWVudCB3aGljaCBkZWZpbmVzIGFsbCBvZiB0aGVcbi8vIGljb25zIHdlIG5lZWQuIFRoZW4gYWxsIGljb25zIHVzZWQgYnkgdGhlIGFwcGxpY2F0aW9ucyBhcmUgcmVuZGVyZWQgd2l0aCB2ZXJ5IGxpZ2h0d2VpZ2h0IFNWRyBlbGVtZW50cyB0aGF0IHNpbXBseVxuLy8gcG9pbnQgdG8gdGhlIGFwcHJvcHJpYXRlIGljb24gYnkgcmVmZXJlbmNlLlxuXG4vLyBUT0RPOiBsb29rIGludG8gdXNpbmcgYSBzaW5nbGUgdGVtcGxhdGUgZm9yIHRoZSBcInVzZVwiIFNWR3MuIENhbiB3ZSBpbnN0YW50aWF0ZSBhIHBhcnRpYWwgd2l0aCBhIGR5bmFtaWMgY29udGV4dD9cbnZhciB0ZW1wbGF0ZXMgPSB7XG4gICAgbG9nbzogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL3N2Zy1sb2dvLmhicy5odG1sJyksXG4gICAgLy8gVGhlIFwic2VsZWN0YWJsZVwiIGxvZ28gZGVmaW5lcyBhbiBpbmxpbmUgJ3BhdGgnIHJhdGhlciB0aGFuIGEgJ3VzZScgcmVmZXJlbmNlLCBhcyBhIHdvcmthcm91bmQgZm9yIGEgRmlyZWZveCB0ZXh0IHNlbGVjdGlvbiBidWcuXG4gICAgbG9nb1NlbGVjdGFibGU6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9zdmctbG9nby1zZWxlY3RhYmxlLmhicy5odG1sJyksXG4gICAgY29tbWVudHM6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9zdmctY29tbWVudHMuaGJzLmh0bWwnKSxcbiAgICBsb2NhdGlvbjogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL3N2Zy1sb2NhdGlvbi5oYnMuaHRtbCcpLFxuICAgIGZhY2Vib29rOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvc3ZnLWZhY2Vib29rLmhicy5odG1sJyksXG4gICAgdHdpdHRlcjogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL3N2Zy10d2l0dGVyLmhicy5odG1sJyksXG4gICAgbGVmdDogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL3N2Zy1sZWZ0Lmhicy5odG1sJyksXG4gICAgZmlsbTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL3N2Zy1maWxtLmhicy5odG1sJylcbn07XG5cbnZhciBpc1NldHVwID0gZmFsc2U7XG5cbmZ1bmN0aW9uIGVuc3VyZVNldHVwKCkge1xuICAgIGlmICghaXNTZXR1cCkge1xuICAgICAgICB2YXIgZHVtbXkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgUmFjdGl2ZSh7XG4gICAgICAgICAgICBlbDogZHVtbXksXG4gICAgICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL3N2Z3MuaGJzLmh0bWwnKVxuICAgICAgICB9KTtcbiAgICAgICAgLy8gU2FmYXJpIG9uIGlPUyByZXF1aXJlcyB0aGUgU1ZHIHRoYXQgZGVmaW5lcyB0aGUgaWNvbnMgYXBwZWFyIGJlZm9yZSB0aGUgU1ZHcyB0aGF0IHJlZmVyZW5jZSBpdC5cbiAgICAgICAgZG9jdW1lbnQuYm9keS5pbnNlcnRCZWZvcmUoZHVtbXkuY2hpbGRyZW5bMF0sIGRvY3VtZW50LmJvZHkuZmlyc3RDaGlsZCk7XG4gICAgICAgIGlzU2V0dXAgPSB0cnVlO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZ2V0U1ZHKHRlbXBsYXRlKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICBlbnN1cmVTZXR1cCgpO1xuICAgICAgICByZXR1cm4gdGVtcGxhdGU7XG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgbG9nbzogZ2V0U1ZHKHRlbXBsYXRlcy5sb2dvKSxcbiAgICBsb2dvU2VsZWN0YWJsZTogZ2V0U1ZHKHRlbXBsYXRlcy5sb2dvU2VsZWN0YWJsZSksXG4gICAgY29tbWVudHM6IGdldFNWRyh0ZW1wbGF0ZXMuY29tbWVudHMpLFxuICAgIGxvY2F0aW9uOiBnZXRTVkcodGVtcGxhdGVzLmxvY2F0aW9uKSxcbiAgICBmYWNlYm9vazogZ2V0U1ZHKHRlbXBsYXRlcy5mYWNlYm9vayksXG4gICAgdHdpdHRlcjogZ2V0U1ZHKHRlbXBsYXRlcy50d2l0dGVyKSxcbiAgICBsZWZ0OiBnZXRTVkcodGVtcGxhdGVzLmxlZnQpLFxuICAgIGZpbG06IGdldFNWRyh0ZW1wbGF0ZXMuZmlsbSlcbn07IiwidmFyIFJhY3RpdmU7IHJlcXVpcmUoJy4vdXRpbHMvcmFjdGl2ZS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihsb2FkZWRSYWN0aXZlKSB7IFJhY3RpdmUgPSBsb2FkZWRSYWN0aXZlO30pO1xudmFyIEJyb3dzZXJNZXRyaWNzID0gcmVxdWlyZSgnLi91dGlscy9icm93c2VyLW1ldHJpY3MnKTtcbnZhciBTVkdzID0gcmVxdWlyZSgnLi9zdmdzJyk7XG52YXIgV2lkZ2V0QnVja2V0ID0gcmVxdWlyZSgnLi91dGlscy93aWRnZXQtYnVja2V0Jyk7XG5cbmZ1bmN0aW9uIHNldHVwSGVscGVyKGdyb3VwU2V0dGluZ3MpIHtcbiAgICBpZiAoIWlzRGlzbWlzc2VkKCkgJiYgIWdyb3VwU2V0dGluZ3MuaXNIaWRlVGFwSGVscGVyKCkgJiYgQnJvd3Nlck1ldHJpY3Muc3VwcG9ydHNUb3VjaCgpKSB7XG4gICAgICAgIHZhciByYWN0aXZlID0gUmFjdGl2ZSh7XG4gICAgICAgICAgICBlbDogV2lkZ2V0QnVja2V0LmdldCgpLFxuICAgICAgICAgICAgYXBwZW5kOiB0cnVlLFxuICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgIHBvc2l0aW9uVG9wOiBncm91cFNldHRpbmdzLnRhcEhlbHBlclBvc2l0aW9uKCkgPT09ICd0b3AnXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGVtcGxhdGU6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy90YXAtaGVscGVyLmhicy5odG1sJyksXG4gICAgICAgICAgICBwYXJ0aWFsczoge1xuICAgICAgICAgICAgICAgIGxvZ286IFNWR3MubG9nb1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmFjdGl2ZS5vbignZGlzbWlzcycsIGRpc21pc3MpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRpc21pc3MoKSB7XG4gICAgICAgIHJhY3RpdmUudGVhcmRvd24oKTtcbiAgICAgICAgc2V0RGlzbWlzc2VkKHRydWUpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gc2V0RGlzbWlzc2VkKGRpc21pc3NlZCkge1xuICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdoaWRlRG91YmxlVGFwTWVzc2FnZScsIGRpc21pc3NlZCk7XG59XG5cbmZ1bmN0aW9uIGlzRGlzbWlzc2VkKCkge1xuICAgIHJldHVybiBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnaGlkZURvdWJsZVRhcE1lc3NhZ2UnKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgc2V0dXBIZWxwZXI6IHNldHVwSGVscGVyXG59OyIsInZhciAkOyByZXF1aXJlKCcuL3V0aWxzL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIFJhY3RpdmU7IHJlcXVpcmUoJy4vdXRpbHMvcmFjdGl2ZS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihsb2FkZWRSYWN0aXZlKSB7IFJhY3RpdmUgPSBsb2FkZWRSYWN0aXZlO30pO1xudmFyIFJhbmdlID0gcmVxdWlyZSgnLi91dGlscy9yYW5nZScpO1xudmFyIFRvdWNoU3VwcG9ydCA9IHJlcXVpcmUoJy4vdXRpbHMvdG91Y2gtc3VwcG9ydCcpO1xuXG52YXIgUG9wdXBXaWRnZXQgPSByZXF1aXJlKCcuL3BvcHVwLXdpZGdldCcpO1xudmFyIFJlYWN0aW9uc1dpZGdldCA9IHJlcXVpcmUoJy4vcmVhY3Rpb25zLXdpZGdldCcpO1xudmFyIFNWR3MgPSByZXF1aXJlKCcuL3N2Z3MnKTtcblxudmFyIENMQVNTX0FDVElWRSA9ICdhbnRlbm5hLWFjdGl2ZSc7XG5cbmZ1bmN0aW9uIGNyZWF0ZUluZGljYXRvcldpZGdldChvcHRpb25zKSB7XG4gICAgdmFyIGNvbnRhaW5lckRhdGEgPSBvcHRpb25zLmNvbnRhaW5lckRhdGE7XG4gICAgdmFyICRjb250YWluZXJFbGVtZW50ID0gb3B0aW9ucy5jb250YWluZXJFbGVtZW50O1xuICAgIHZhciBwYWdlRGF0YSA9IG9wdGlvbnMucGFnZURhdGE7XG4gICAgdmFyIGdyb3VwU2V0dGluZ3MgPSBvcHRpb25zLmdyb3VwU2V0dGluZ3M7XG4gICAgdmFyIGRlZmF1bHRSZWFjdGlvbnMgPSBvcHRpb25zLmRlZmF1bHRSZWFjdGlvbnM7XG4gICAgdmFyIGNvb3JkcyA9IG9wdGlvbnMuY29vcmRzO1xuICAgIHZhciByYWN0aXZlID0gUmFjdGl2ZSh7XG4gICAgICAgIGVsOiAkKCc8ZGl2PicpLCAvLyB0aGUgcmVhbCByb290IG5vZGUgaXMgaW4gdGhlIHRlbXBsYXRlLiBpdCdzIGV4dHJhY3RlZCBhZnRlciB0aGUgdGVtcGxhdGUgaXMgcmVuZGVyZWQgaW50byB0aGlzIGR1bW15IGVsZW1lbnRcbiAgICAgICAgYXBwZW5kOiB0cnVlLFxuICAgICAgICBtYWdpYzogdHJ1ZSxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgY29udGFpbmVyRGF0YTogY29udGFpbmVyRGF0YSxcbiAgICAgICAgICAgIGV4dHJhQ2xhc3NlczogZ3JvdXBTZXR0aW5ncy5lbmFibGVUZXh0SGVscGVyKCkgPyBcIlwiIDogXCJhbnRlbm5hLW5vaGludFwiXG4gICAgICAgIH0sXG4gICAgICAgIHRlbXBsYXRlOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvdGV4dC1pbmRpY2F0b3Itd2lkZ2V0Lmhicy5odG1sJyksXG4gICAgICAgIHBhcnRpYWxzOiB7XG4gICAgICAgICAgICBsb2dvOiBTVkdzLmxvZ29TZWxlY3RhYmxlXG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIHZhciByZWFjdGlvbldpZGdldE9wdGlvbnMgPSB7XG4gICAgICAgIHJlYWN0aW9uc0RhdGE6IGNvbnRhaW5lckRhdGEucmVhY3Rpb25zLFxuICAgICAgICBjb250YWluZXJEYXRhOiBjb250YWluZXJEYXRhLFxuICAgICAgICBjb250YWluZXJFbGVtZW50OiAkY29udGFpbmVyRWxlbWVudCxcbiAgICAgICAgY29udGVudERhdGE6IHsgdHlwZTogJ3RleHQnIH0sXG4gICAgICAgIGRlZmF1bHRSZWFjdGlvbnM6IGRlZmF1bHRSZWFjdGlvbnMsXG4gICAgICAgIHBhZ2VEYXRhOiBwYWdlRGF0YSxcbiAgICAgICAgZ3JvdXBTZXR0aW5nczogZ3JvdXBTZXR0aW5nc1xuICAgIH07XG5cbiAgICB2YXIgJHJvb3RFbGVtZW50ID0gJChyb290RWxlbWVudChyYWN0aXZlKSk7XG4gICAgaWYgKGNvb3Jkcykge1xuICAgICAgICAkcm9vdEVsZW1lbnQuY3NzKHtcbiAgICAgICAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxuICAgICAgICAgICAgdG9wOiBjb29yZHMudG9wIC0gJHJvb3RFbGVtZW50LmhlaWdodCgpLFxuICAgICAgICAgICAgYm90dG9tOiBjb29yZHMuYm90dG9tLFxuICAgICAgICAgICAgbGVmdDogY29vcmRzLmxlZnQsXG4gICAgICAgICAgICByaWdodDogY29vcmRzLnJpZ2h0LFxuICAgICAgICAgICAgJ3otaW5kZXgnOiAxMDAwIC8vIFRPRE86IGNvbXB1dGUgYSByZWFsIHZhbHVlP1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgdmFyIGhvdmVyVGltZW91dDtcbiAgICB2YXIgdGFwU3VwcG9ydCA9IFRvdWNoU3VwcG9ydC5zZXR1cFRhcCgkcm9vdEVsZW1lbnQuZ2V0KDApLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgb3BlblJlYWN0aW9uc1dpbmRvdyhyZWFjdGlvbldpZGdldE9wdGlvbnMsIHJhY3RpdmUpO1xuICAgIH0pO1xuICAgICRyb290RWxlbWVudC5vbignbW91c2VlbnRlci5hbnRlbm5hJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgaWYgKGV2ZW50LmJ1dHRvbnMgPiAwIHx8IChldmVudC5idXR0b25zID09IHVuZGVmaW5lZCAmJiBldmVudC53aGljaCA+IDApKSB7IC8vIE9uIFNhZmFyaSwgZXZlbnQuYnV0dG9ucyBpcyB1bmRlZmluZWQgYnV0IGV2ZW50LndoaWNoIGdpdmVzIGEgZ29vZCB2YWx1ZS4gZXZlbnQud2hpY2ggaXMgYmFkIG9uIEZGXG4gICAgICAgICAgICAvLyBEb24ndCByZWFjdCBpZiB0aGUgdXNlciBpcyBkcmFnZ2luZyBvciBzZWxlY3RpbmcgdGV4dC5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjbGVhclRpbWVvdXQoaG92ZXJUaW1lb3V0KTsgLy8gb25seSBvbmUgdGltZW91dCBhdCBhIHRpbWVcbiAgICAgICAgaG92ZXJUaW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmIChjb250YWluZXJEYXRhLnJlYWN0aW9ucy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgb3BlblJlYWN0aW9uc1dpbmRvdyhyZWFjdGlvbldpZGdldE9wdGlvbnMsIHJhY3RpdmUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YXIgJGljb24gPSAkKHJvb3RFbGVtZW50KHJhY3RpdmUpKS5maW5kKCcuYW50ZW5uYS1sb2dvJyk7XG4gICAgICAgICAgICAgICAgdmFyIG9mZnNldCA9ICRpY29uLm9mZnNldCgpO1xuICAgICAgICAgICAgICAgIHZhciBjb29yZGluYXRlcyA9IHtcbiAgICAgICAgICAgICAgICAgICAgdG9wOiBvZmZzZXQudG9wICsgTWF0aC5mbG9vcigkaWNvbi5oZWlnaHQoKSAvIDIpLCAvLyBUT0RPIHRoaXMgbnVtYmVyIGlzIGEgbGl0dGxlIG9mZiBiZWNhdXNlIHRoZSBkaXYgZG9lc24ndCB0aWdodGx5IHdyYXAgdGhlIGluc2VydGVkIGZvbnQgY2hhcmFjdGVyXG4gICAgICAgICAgICAgICAgICAgIGxlZnQ6IG9mZnNldC5sZWZ0ICsgTWF0aC5mbG9vcigkaWNvbi53aWR0aCgpIC8gMilcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIFBvcHVwV2lkZ2V0LnNob3coY29vcmRpbmF0ZXMsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBvcGVuUmVhY3Rpb25zV2luZG93KHJlYWN0aW9uV2lkZ2V0T3B0aW9ucywgcmFjdGl2ZSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIDIwMCk7XG4gICAgfSk7XG4gICAgJHJvb3RFbGVtZW50Lm9uKCdtb3VzZWxlYXZlLmFudGVubmEnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KGhvdmVyVGltZW91dCk7XG4gICAgfSk7XG4gICAgJGNvbnRhaW5lckVsZW1lbnQub24oJ21vdXNlZW50ZXIuYW50ZW5uYScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAkcm9vdEVsZW1lbnQuYWRkQ2xhc3MoQ0xBU1NfQUNUSVZFKTtcbiAgICB9KTtcbiAgICAkY29udGFpbmVyRWxlbWVudC5vbignbW91c2VsZWF2ZS5hbnRlbm5hJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICRyb290RWxlbWVudC5yZW1vdmVDbGFzcyhDTEFTU19BQ1RJVkUpO1xuICAgIH0pO1xuICAgIHJldHVybiB7XG4gICAgICAgIGVsZW1lbnQ6ICRyb290RWxlbWVudCxcbiAgICAgICAgdGVhcmRvd246IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgJGNvbnRhaW5lckVsZW1lbnQub2ZmKCcuYW50ZW5uYScpO1xuICAgICAgICAgICAgcmFjdGl2ZS50ZWFyZG93bigpO1xuICAgICAgICAgICAgdGFwU3VwcG9ydC50ZWFyZG93bigpO1xuICAgICAgICB9XG4gICAgfTtcbn1cblxuZnVuY3Rpb24gcm9vdEVsZW1lbnQocmFjdGl2ZSkge1xuICAgIHJldHVybiByYWN0aXZlLmZpbmQoJy5hbnRlbm5hLXRleHQtaW5kaWNhdG9yLXdpZGdldCcpO1xufVxuXG5mdW5jdGlvbiBvcGVuUmVhY3Rpb25zV2luZG93KHJlYWN0aW9uT3B0aW9ucywgcmFjdGl2ZSkge1xuICAgIFJlYWN0aW9uc1dpZGdldC5vcGVuKHJlYWN0aW9uT3B0aW9ucywgcm9vdEVsZW1lbnQocmFjdGl2ZSkpO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlOiBjcmVhdGVJbmRpY2F0b3JXaWRnZXRcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgUG9wdXBXaWRnZXQgPSByZXF1aXJlKCcuL3BvcHVwLXdpZGdldCcpO1xudmFyIFJhbmdlID0gcmVxdWlyZSgnLi91dGlscy9yYW5nZScpO1xudmFyIFJlYWN0aW9uc1dpZGdldCA9IHJlcXVpcmUoJy4vcmVhY3Rpb25zLXdpZGdldCcpO1xudmFyIFRvdWNoU3VwcG9ydCA9IHJlcXVpcmUoJy4vdXRpbHMvdG91Y2gtc3VwcG9ydCcpO1xuXG5cbmZ1bmN0aW9uIGNyZWF0ZVJlYWN0YWJsZVRleHQob3B0aW9ucykge1xuICAgIC8vIFRPRE86IGltcG9zZSBhbiB1cHBlciBsaW1pdCBvbiB0aGUgbGVuZ3RoIG9mIHRleHQgdGhhdCBjYW4gYmUgcmVhY3RlZCB0bz8gKGFwcGxpZXMgdG8gdGhlIGluZGljYXRvci13aWRnZXQgdG9vKVxuICAgIHZhciAkY29udGFpbmVyRWxlbWVudCA9IG9wdGlvbnMuY29udGFpbmVyRWxlbWVudDtcbiAgICB2YXIgY29udGFpbmVyRGF0YSA9IG9wdGlvbnMuY29udGFpbmVyRGF0YTtcbiAgICB2YXIgZXhjbHVkZU5vZGUgPSBvcHRpb25zLmV4Y2x1ZGVOb2RlO1xuICAgIHZhciByZWFjdGlvbnNXaWRnZXRPcHRpb25zID0ge1xuICAgICAgICByZWFjdGlvbnNEYXRhOiBbXSwgLy8gQWx3YXlzIG9wZW4gd2l0aCB0aGUgZGVmYXVsdCByZWFjdGlvbnNcbiAgICAgICAgY29udGFpbmVyRGF0YTogY29udGFpbmVyRGF0YSxcbiAgICAgICAgY29udGVudERhdGE6IHsgdHlwZTogJ3RleHQnIH0sXG4gICAgICAgIGNvbnRhaW5lckVsZW1lbnQ6ICRjb250YWluZXJFbGVtZW50LFxuICAgICAgICBkZWZhdWx0UmVhY3Rpb25zOiBvcHRpb25zLmRlZmF1bHRSZWFjdGlvbnMsXG4gICAgICAgIHBhZ2VEYXRhOiBvcHRpb25zLnBhZ2VEYXRhLFxuICAgICAgICBncm91cFNldHRpbmdzOiBvcHRpb25zLmdyb3VwU2V0dGluZ3NcbiAgICB9O1xuXG4gICAgdmFyIHRhcEV2ZW50cyA9IHNldHVwVGFwRXZlbnRzKCRjb250YWluZXJFbGVtZW50LmdldCgwKSwgcmVhY3Rpb25zV2lkZ2V0T3B0aW9ucyk7XG4gICAgJGNvbnRhaW5lckVsZW1lbnQub24oJ21vdXNldXAuYW50ZW5uYScsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIC8vIE5vdGUgdGhhdCB3ZSBoYXZlIHRvIGRvIGEgcHJlZW1wdGl2ZSBjaGVjayBpZiB0aGUgcG9wdXAgaXMgc2hvd2luZyBiZWNhdXNlIG9mIGEgdGltaW5nIGRpZmZlcmVuY2UgaW4gU2FmYXJpLlxuICAgICAgICAvLyBXZSB3ZXJlIHNlZWluZyB0aGUgZG9jdW1lbnQgY2xpY2sgaGFuZGxlciBjbG9zaW5nIHRoZSBwb3B1cCB3aGlsZSB0aGUgc2VsZWN0aW9uIHdhcyBiZWluZyBjb21wdXRlZCwgd2hpY2hcbiAgICAgICAgLy8gbWVhbnQgdGhhdCBjYWxsaW5nIFBvcHVwV2lkZ2V0LnNob3cgd291bGQgdGhpbmsgaXQgbmVlZGVkIHRvIHJlb3BlbiB0aGUgcG9wdXAgKGluc3RlYWQgb2YgcXVpZXRseSBkb2luZyBub3RoaW5nIGFzIGl0IHNob3VsZCkuXG4gICAgICAgIGlmIChjb250YWluZXJEYXRhLmxvYWRlZCAmJiAhUG9wdXBXaWRnZXQuaXNTaG93aW5nKCkpIHtcbiAgICAgICAgICAgIHZhciBub2RlID0gJGNvbnRhaW5lckVsZW1lbnQuZ2V0KDApO1xuICAgICAgICAgICAgdmFyIHBvaW50ID0gUmFuZ2UuZ2V0U2VsZWN0aW9uRW5kUG9pbnQobm9kZSwgZXZlbnQsIGV4Y2x1ZGVOb2RlKTtcbiAgICAgICAgICAgIGlmIChwb2ludCkge1xuICAgICAgICAgICAgICAgIHZhciBjb29yZGluYXRlcyA9IHt0b3A6IHBvaW50LnksIGxlZnQ6IHBvaW50Lnh9O1xuICAgICAgICAgICAgICAgIFBvcHVwV2lkZ2V0LnNob3coY29vcmRpbmF0ZXMsIGdyYWJTZWxlY3Rpb25BbmRPcGVuKG5vZGUsIGNvb3JkaW5hdGVzLCByZWFjdGlvbnNXaWRnZXRPcHRpb25zLCBleGNsdWRlTm9kZSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdGVhcmRvd246IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdGFwRXZlbnRzLnRlYXJkb3duKCk7XG4gICAgICAgICAgICAkY29udGFpbmVyRWxlbWVudC5vZmYoJy5hbnRlbm5hJyk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGdyYWJTZWxlY3Rpb25BbmRPcGVuKG5vZGUsIGNvb3JkaW5hdGVzLCByZWFjdGlvbnNXaWRnZXRPcHRpb25zLCBleGNsdWRlTm9kZSkge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgUmFuZ2UuZ3JhYlNlbGVjdGlvbihub2RlLCBmdW5jdGlvbih0ZXh0LCBsb2NhdGlvbikge1xuICAgICAgICAgICAgcmVhY3Rpb25zV2lkZ2V0T3B0aW9ucy5jb250ZW50RGF0YS5sb2NhdGlvbiA9IGxvY2F0aW9uO1xuICAgICAgICAgICAgcmVhY3Rpb25zV2lkZ2V0T3B0aW9ucy5jb250ZW50RGF0YS5ib2R5ID0gdGV4dDtcbiAgICAgICAgICAgIFJlYWN0aW9uc1dpZGdldC5vcGVuKHJlYWN0aW9uc1dpZGdldE9wdGlvbnMsIGNvb3JkaW5hdGVzKTtcbiAgICAgICAgfSwgZXhjbHVkZU5vZGUpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZ3JhYk5vZGVBbmRPcGVuKG5vZGUsIHJlYWN0aW9uc1dpZGdldE9wdGlvbnMsIGNvb3Jkcykge1xuICAgIFJhbmdlLmdyYWJOb2RlKG5vZGUsIGZ1bmN0aW9uKHRleHQsIGxvY2F0aW9uKSB7XG4gICAgICAgIHJlYWN0aW9uc1dpZGdldE9wdGlvbnMuY29udGVudERhdGEubG9jYXRpb24gPSBsb2NhdGlvbjtcbiAgICAgICAgcmVhY3Rpb25zV2lkZ2V0T3B0aW9ucy5jb250ZW50RGF0YS5ib2R5ID0gdGV4dDtcbiAgICAgICAgUmVhY3Rpb25zV2lkZ2V0Lm9wZW4ocmVhY3Rpb25zV2lkZ2V0T3B0aW9ucywgY29vcmRzKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gc2V0dXBUYXBFdmVudHMoZWxlbWVudCwgcmVhY3Rpb25zV2lkZ2V0T3B0aW9ucykge1xuICAgIHJldHVybiBUb3VjaFN1cHBvcnQuc2V0dXBUYXAoZWxlbWVudCwgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgaWYgKCFSZWFjdGlvbnNXaWRnZXQuaXNPcGVuKCkgJiYgJChldmVudC50YXJnZXQpLmNsb3Nlc3QoJ2EsLm5vLWFudCcpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgdmFyIHRvdWNoID0gZXZlbnQuY2hhbmdlZFRvdWNoZXNbMF07XG4gICAgICAgICAgICB2YXIgY29vcmRzID0geyB0b3A6IHRvdWNoLnBhZ2VZLCBsZWZ0OiB0b3VjaC5wYWdlWCB9O1xuICAgICAgICAgICAgZ3JhYk5vZGVBbmRPcGVuKGVsZW1lbnQsIHJlYWN0aW9uc1dpZGdldE9wdGlvbnMsIGNvb3Jkcyk7XG4gICAgICAgIH1cbiAgICB9KTtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZVJlYWN0YWJsZVRleHQ6IGNyZWF0ZVJlYWN0YWJsZVRleHRcbn07IiwidmFyIEFwcE1vZGUgPSByZXF1aXJlKCcuL2FwcC1tb2RlJyk7XG52YXIgSlNPTlV0aWxzID0gcmVxdWlyZSgnLi9qc29uLXV0aWxzJyk7XG52YXIgVVJMcyA9IHJlcXVpcmUoJy4vdXJscycpO1xudmFyIFVzZXIgPSByZXF1aXJlKCcuL3VzZXInKTtcblxuZnVuY3Rpb24gcG9zdE5ld1JlYWN0aW9uKHJlYWN0aW9uRGF0YSwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGNvbnRlbnREYXRhLCBzdWNjZXNzLCBlcnJvcikge1xuICAgIHZhciBjb250ZW50Qm9keSA9IGNvbnRlbnREYXRhLmJvZHk7XG4gICAgdmFyIGNvbnRlbnRUeXBlID0gY29udGVudERhdGEudHlwZTtcbiAgICB2YXIgY29udGVudExvY2F0aW9uID0gY29udGVudERhdGEubG9jYXRpb247XG4gICAgdmFyIGNvbnRlbnREaW1lbnNpb25zID0gY29udGVudERhdGEuZGltZW5zaW9ucztcbiAgICBVc2VyLmZldGNoVXNlcihmdW5jdGlvbih1c2VySW5mbykge1xuICAgICAgICAvLyBUT0RPIGV4dHJhY3QgdGhlIHNoYXBlIG9mIHRoaXMgZGF0YSBhbmQgcG9zc2libHkgdGhlIHdob2xlIEFQSSBjYWxsXG4gICAgICAgIHZhciBkYXRhID0ge1xuICAgICAgICAgICAgdGFnOiB7XG4gICAgICAgICAgICAgICAgYm9keTogcmVhY3Rpb25EYXRhLnRleHQsXG4gICAgICAgICAgICAgICAgaXNfZGVmYXVsdDogcmVhY3Rpb25EYXRhLmlzRGVmYXVsdCAhPT0gdW5kZWZpbmVkICYmIHJlYWN0aW9uRGF0YS5pc0RlZmF1bHQgLy8gZmFsc2UgdW5sZXNzIHNwZWNpZmllZFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGhhc2g6IGNvbnRhaW5lckRhdGEuaGFzaCxcbiAgICAgICAgICAgIHVzZXJfaWQ6IHVzZXJJbmZvLnVzZXJfaWQsXG4gICAgICAgICAgICBhbnRfdG9rZW46IHVzZXJJbmZvLmFudF90b2tlbixcbiAgICAgICAgICAgIHBhZ2VfaWQ6IHBhZ2VEYXRhLnBhZ2VJZCxcbiAgICAgICAgICAgIGdyb3VwX2lkOiBwYWdlRGF0YS5ncm91cElkLFxuICAgICAgICAgICAgY29udGFpbmVyX2tpbmQ6IGNvbnRlbnRUeXBlLCAvLyBPbmUgb2YgJ3BhZ2UnLCAndGV4dCcsICdtZWRpYScsICdpbWcnXG4gICAgICAgICAgICBjb250ZW50X25vZGVfZGF0YToge1xuICAgICAgICAgICAgICAgIGJvZHk6IGNvbnRlbnRCb2R5LFxuICAgICAgICAgICAgICAgIGtpbmQ6IGNvbnRlbnRUeXBlLFxuICAgICAgICAgICAgICAgIGl0ZW1fdHlwZTogJycgLy8gVE9ETzogbG9va3MgdW51c2VkIGJ1dCBUYWdIYW5kbGVyIGJsb3dzIHVwIHdpdGhvdXQgaXQuIEN1cnJlbnQgY2xpZW50IHBhc3NlcyBpbiBcInBhZ2VcIiBmb3IgcGFnZSByZWFjdGlvbnMuXG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIGlmIChjb250ZW50TG9jYXRpb24pIHtcbiAgICAgICAgICAgIGRhdGEuY29udGVudF9ub2RlX2RhdGEubG9jYXRpb24gPSBjb250ZW50TG9jYXRpb247XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvbnRlbnREaW1lbnNpb25zKSB7XG4gICAgICAgICAgICBkYXRhLmNvbnRlbnRfbm9kZV9kYXRhLmhlaWdodCA9IGNvbnRlbnREaW1lbnNpb25zLmhlaWdodDtcbiAgICAgICAgICAgIGRhdGEuY29udGVudF9ub2RlX2RhdGEud2lkdGggPSBjb250ZW50RGltZW5zaW9ucy53aWR0aDtcbiAgICAgICAgfVxuICAgICAgICBpZiAocmVhY3Rpb25EYXRhLmlkKSB7XG4gICAgICAgICAgICBkYXRhLnRhZy5pZCA9IHJlYWN0aW9uRGF0YS5pZDsgLy8gVE9ETyB0aGUgY3VycmVudCBjbGllbnQgc2VuZHMgXCItMTAxXCIgaWYgdGhlcmUncyBubyBpZC4gaXMgdGhpcyBuZWNlc3Nhcnk/XG4gICAgICAgIH1cbiAgICAgICAgZ2V0SlNPTlAoVVJMcy5jcmVhdGVSZWFjdGlvblVybCgpLCBkYXRhLCBuZXdSZWFjdGlvblN1Y2Nlc3MoY29udGVudExvY2F0aW9uLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgc3VjY2VzcyksIGVycm9yKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gcG9zdFBsdXNPbmUocmVhY3Rpb25EYXRhLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgc3VjY2VzcywgZXJyb3IpIHtcbiAgICBVc2VyLmZldGNoVXNlcihmdW5jdGlvbih1c2VySW5mbykge1xuICAgICAgICAvLyBUT0RPIGV4dHJhY3QgdGhlIHNoYXBlIG9mIHRoaXMgZGF0YSBhbmQgcG9zc2libHkgdGhlIHdob2xlIEFQSSBjYWxsXG4gICAgICAgIGlmICghcmVhY3Rpb25EYXRhLmNvbnRlbnQpIHtcbiAgICAgICAgICAgIC8vIFRoaXMgaXMgYSBzdW1tYXJ5IHJlYWN0aW9uLiBTZWUgaWYgd2UgaGF2ZSBhbnkgY29udGFpbmVyIGRhdGEgdGhhdCB3ZSBjYW4gbGluayB0byBpdC5cbiAgICAgICAgICAgIHZhciBjb250YWluZXJSZWFjdGlvbnMgPSBjb250YWluZXJEYXRhLnJlYWN0aW9ucztcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY29udGFpbmVyUmVhY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNvbnRhaW5lclJlYWN0aW9uID0gY29udGFpbmVyUmVhY3Rpb25zW2ldO1xuICAgICAgICAgICAgICAgIGlmIChjb250YWluZXJSZWFjdGlvbi5pZCA9PT0gcmVhY3Rpb25EYXRhLmlkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlYWN0aW9uRGF0YS5wYXJlbnRJRCA9IGNvbnRhaW5lclJlYWN0aW9uLnBhcmVudElEO1xuICAgICAgICAgICAgICAgICAgICByZWFjdGlvbkRhdGEuY29udGVudCA9IGNvbnRhaW5lclJlYWN0aW9uLmNvbnRlbnQ7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB2YXIgZGF0YSA9IHtcbiAgICAgICAgICAgIHRhZzoge1xuICAgICAgICAgICAgICAgIGJvZHk6IHJlYWN0aW9uRGF0YS50ZXh0LFxuICAgICAgICAgICAgICAgIGlkOiByZWFjdGlvbkRhdGEuaWRcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBoYXNoOiBjb250YWluZXJEYXRhLmhhc2gsXG4gICAgICAgICAgICB1c2VyX2lkOiB1c2VySW5mby51c2VyX2lkLFxuICAgICAgICAgICAgYW50X3Rva2VuOiB1c2VySW5mby5hbnRfdG9rZW4sXG4gICAgICAgICAgICBwYWdlX2lkOiBwYWdlRGF0YS5wYWdlSWQsXG4gICAgICAgICAgICBncm91cF9pZDogcGFnZURhdGEuZ3JvdXBJZCxcbiAgICAgICAgICAgIGNvbnRhaW5lcl9raW5kOiBjb250YWluZXJEYXRhLnR5cGUsIC8vICdwYWdlJywgJ3RleHQnLCAnbWVkaWEnLCAnaW1nJ1xuICAgICAgICAgICAgY29udGVudF9ub2RlX2RhdGE6IHtcbiAgICAgICAgICAgICAgICBib2R5OiAnJywgLy8gVE9ETzogZG8gd2UgbmVlZCB0aGlzIGZvciArMXM/IGxvb2tzIGxpa2Ugb25seSB0aGUgaWQgZmllbGQgaXMgdXNlZCwgaWYgb25lIGlzIHNldFxuICAgICAgICAgICAgICAgIGtpbmQ6IGNvbnRlbnROb2RlRGF0YUtpbmQoY29udGFpbmVyRGF0YS50eXBlKSxcbiAgICAgICAgICAgICAgICBpdGVtX3R5cGU6ICcnIC8vIFRPRE86IGxvb2tzIHVudXNlZCBidXQgVGFnSGFuZGxlciBibG93cyB1cCB3aXRob3V0IGl0XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIGlmIChyZWFjdGlvbkRhdGEuY29udGVudCkge1xuICAgICAgICAgICAgZGF0YS5jb250ZW50X25vZGVfZGF0YS5pZCA9IHJlYWN0aW9uRGF0YS5jb250ZW50LmlkO1xuICAgICAgICAgICAgZGF0YS5jb250ZW50X25vZGVfZGF0YS5sb2NhdGlvbiA9IHJlYWN0aW9uRGF0YS5jb250ZW50LmxvY2F0aW9uO1xuICAgICAgICB9XG4gICAgICAgIC8vIFRPRE86IHNob3VsZCB3ZSBiYWlsIGlmIHRoZXJlJ3Mgbm8gcGFyZW50IElEPyBJdCdzIG5vdCByZWFsbHkgYSArMSB3aXRob3V0IG9uZS5cbiAgICAgICAgaWYgKHJlYWN0aW9uRGF0YS5wYXJlbnRJRCkge1xuICAgICAgICAgICAgZGF0YS50YWcucGFyZW50X2lkID0gcmVhY3Rpb25EYXRhLnBhcmVudElEO1xuICAgICAgICB9XG4gICAgICAgIGdldEpTT05QKFVSTHMuY3JlYXRlUmVhY3Rpb25VcmwoKSwgZGF0YSwgcGx1c09uZVN1Y2Nlc3MocmVhY3Rpb25EYXRhLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgc3VjY2VzcyksIGVycm9yKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gcG9zdENvbW1lbnQoY29tbWVudCwgcmVhY3Rpb25EYXRhLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgc3VjY2VzcywgZXJyb3IpIHtcbiAgICAvLyBUT0RPOiByZWZhY3RvciB0aGUgcG9zdCBmdW5jdGlvbnMgdG8gZWxpbWluYXRlIGFsbCB0aGUgY29waWVkIGNvZGVcbiAgICBVc2VyLmZldGNoVXNlcihmdW5jdGlvbih1c2VySW5mbykge1xuICAgICAgICAvLyBUT0RPIGV4dHJhY3QgdGhlIHNoYXBlIG9mIHRoaXMgZGF0YSBhbmQgcG9zc2libHkgdGhlIHdob2xlIEFQSSBjYWxsXG4gICAgICAgIGlmICghcmVhY3Rpb25EYXRhLmNvbnRlbnQpIHtcbiAgICAgICAgICAgIC8vIFRoaXMgaXMgYSBzdW1tYXJ5IHJlYWN0aW9uLiBTZWUgaWYgd2UgaGF2ZSBhbnkgY29udGFpbmVyIGRhdGEgdGhhdCB3ZSBjYW4gbGluayB0byBpdC5cbiAgICAgICAgICAgIHZhciBjb250YWluZXJSZWFjdGlvbnMgPSBjb250YWluZXJEYXRhLnJlYWN0aW9ucztcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY29udGFpbmVyUmVhY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNvbnRhaW5lclJlYWN0aW9uID0gY29udGFpbmVyUmVhY3Rpb25zW2ldO1xuICAgICAgICAgICAgICAgIGlmIChjb250YWluZXJSZWFjdGlvbi5pZCA9PT0gcmVhY3Rpb25EYXRhLmlkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlYWN0aW9uRGF0YS5wYXJlbnRJRCA9IGNvbnRhaW5lclJlYWN0aW9uLnBhcmVudElEO1xuICAgICAgICAgICAgICAgICAgICByZWFjdGlvbkRhdGEuY29udGVudCA9IGNvbnRhaW5lclJlYWN0aW9uLmNvbnRlbnQ7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB2YXIgZGF0YSA9IHtcbiAgICAgICAgICAgIGNvbW1lbnQ6IGNvbW1lbnQsXG4gICAgICAgICAgICB0YWc6IHtcbiAgICAgICAgICAgICAgICBwYXJlbnRfaWQ6IHJlYWN0aW9uRGF0YS5wYXJlbnRJRFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHVzZXJfaWQ6IHVzZXJJbmZvLnVzZXJfaWQsXG4gICAgICAgICAgICBhbnRfdG9rZW46IHVzZXJJbmZvLmFudF90b2tlbixcbiAgICAgICAgICAgIHBhZ2VfaWQ6IHBhZ2VEYXRhLnBhZ2VJZCxcbiAgICAgICAgICAgIGdyb3VwX2lkOiBwYWdlRGF0YS5ncm91cElkXG4gICAgICAgIH07XG4gICAgICAgIGdldEpTT05QKFVSTHMuY3JlYXRlQ29tbWVudFVybCgpLCBkYXRhLCBjb21tZW50U3VjY2VzcyhyZWFjdGlvbkRhdGEsIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBzdWNjZXNzKSwgZXJyb3IpO1xuICAgIH0pO1xufVxuXG4vLyBUT0RPOiBXZSBuZWVkIHRvIHJldmlldyB0aGUgQVBJIHNvIHRoYXQgaXQgcmV0dXJucy9hY2NlcHRzIGEgdW5pZm9ybSBzZXQgb2YgdmFsdWVzLlxuZnVuY3Rpb24gY29udGVudE5vZGVEYXRhS2luZCh0eXBlKSB7XG4gICAgaWYgKHR5cGUgPT09ICdpbWFnZScpIHtcbiAgICAgICAgcmV0dXJuICdpbWcnO1xuICAgIH1cbiAgICByZXR1cm4gdHlwZTtcbn1cblxuZnVuY3Rpb24gY29tbWVudFN1Y2Nlc3MocmVhY3Rpb25EYXRhLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgY2FsbGJhY2spIHtcbiAgICByZXR1cm4gZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgLy8gVE9ETzogaW4gdGhlIGNhc2UgdGhhdCBzb21lb25lIHJlYWN0cyBhbmQgdGhlbiBpbW1lZGlhdGVseSBjb21tZW50cywgd2UgaGF2ZSBhIHJhY2UgY29uZGl0aW9uIHdoZXJlIHRoZVxuICAgICAgICAvLyAgICAgICBjb21tZW50IHJlc3BvbnNlIGNvdWxkIGNvbWUgYmFjayBiZWZvcmUgdGhlIHJlYWN0aW9uLiB3ZSBuZWVkIHRvOlxuICAgICAgICAvLyAgICAgICAxLiBNYWtlIHN1cmUgdGhlIHNlcnZlciBvbmx5IGNyZWF0ZXMgYSBzaW5nbGUgcmVhY3Rpb24gaW4gdGhpcyBjYXNlIChub3QgYSBIVUdFIGRlYWwgaWYgaXQgbWFrZXMgdHdvKVxuICAgICAgICAvLyAgICAgICAyLiBSZXNvbHZlIHRoZSB0d28gcmVzcG9uc2VzIHRoYXQgYm90aCB0aGVvcmV0aWNhbGx5IGNvbWUgYmFjayB3aXRoIHRoZSBzYW1lIHJlYWN0aW9uIGRhdGEgYXQgdGhlIHNhbWVcbiAgICAgICAgLy8gICAgICAgICAgdGltZS4gTWFrZSBzdXJlIHdlIGRvbid0IGVuZCB1cCB3aXRoIHR3byBjb3BpZXMgb2YgdGhlIHNhbWUgZGF0YSBpbiB0aGUgbW9kZWwuXG4gICAgICAgIHZhciByZWFjdGlvbkNyZWF0ZWQgPSAhcmVzcG9uc2UuZXhpc3Rpbmc7XG4gICAgICAgIGlmIChyZWFjdGlvbkNyZWF0ZWQpIHtcbiAgICAgICAgICAgIGlmICghcmVhY3Rpb25EYXRhLmNvbW1lbnRDb3VudCkge1xuICAgICAgICAgICAgICAgIHJlYWN0aW9uRGF0YS5jb21tZW50Q291bnQgPSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVhY3Rpb25EYXRhLmNvbW1lbnRDb3VudCArPSAxO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gVE9ETzogZG8gd2UgZXZlciBnZXQgYSByZXNwb25zZSB0byBhIG5ldyByZWFjdGlvbiB0ZWxsaW5nIHVzIHRoYXQgaXQncyBhbHJlYWR5IGV4aXN0aW5nPyBJZiBzbywgY291bGQgdGhlIGNvdW50IG5lZWQgdG8gYmUgdXBkYXRlZD9cbiAgICAgICAgfVxuICAgICAgICBjYWxsYmFjayhyZWFjdGlvbkNyZWF0ZWQpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gcGx1c09uZVN1Y2Nlc3MocmVhY3Rpb25EYXRhLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgY2FsbGJhY2spIHtcbiAgICByZXR1cm4gZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgLy8gVE9ETzogRG8gd2UgY2FyZSBhYm91dCByZXNwb25zZS5leGlzdGluZyBhbnltb3JlICh3ZSB1c2VkIHRvIHNob3cgZGlmZmVyZW50IGZlZWRiYWNrIGluIHRoZSBVSSwgYnV0IG5vIGxvbmdlci4uLilcbiAgICAgICAgdmFyIHJlYWN0aW9uQ3JlYXRlZCA9ICFyZXNwb25zZS5leGlzdGluZztcbiAgICAgICAgaWYgKHJlYWN0aW9uQ3JlYXRlZCkge1xuICAgICAgICAgICAgLy8gVE9ETzogd2Ugc2hvdWxkIGdldCBiYWNrIGEgcmVzcG9uc2Ugd2l0aCBkYXRhIGluIHRoZSBcIm5ldyBmb3JtYXRcIiBhbmQgdXBkYXRlIHRoZSBtb2RlbCBmcm9tIHRoZSByZXNwb25zZVxuICAgICAgICAgICAgcmVhY3Rpb25EYXRhLmNvdW50ID0gcmVhY3Rpb25EYXRhLmNvdW50ICsgMTtcbiAgICAgICAgICAgIGNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbCA9IGNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbCArIDE7XG4gICAgICAgICAgICBwYWdlRGF0YS5zdW1tYXJ5VG90YWwgPSBwYWdlRGF0YS5zdW1tYXJ5VG90YWwgKyAxO1xuICAgICAgICAgICAgY29udGFpbmVyRGF0YS5yZWFjdGlvbnMuc29ydChmdW5jdGlvbihhLCBiKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGIuY291bnQgLSBhLmNvdW50O1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgY2FsbGJhY2socmVhY3Rpb25EYXRhKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIG5ld1JlYWN0aW9uU3VjY2Vzcyhjb250ZW50TG9jYXRpb24sIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBjYWxsYmFjaykge1xuICAgIHJldHVybiBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAvLyBUT0RPOiBDYW4gcmVzcG9uc2UuZXhpc3RpbmcgZXZlciBjb21lIGJhY2sgdHJ1ZSBmb3IgYSAnbmV3JyByZWFjdGlvbj8gU2hvdWxkIHdlIGJlaGF2ZSBhbnkgZGlmZmVyZW50bHkgaWYgaXQgZG9lcz9cbiAgICAgICAgdmFyIHJlYWN0aW9uID0gcmVhY3Rpb25Gcm9tUmVzcG9uc2UocmVzcG9uc2UsIGNvbnRlbnRMb2NhdGlvbik7XG4gICAgICAgIGNhbGxiYWNrKHJlYWN0aW9uKTtcbiAgICB9O1xufVxuXG5mdW5jdGlvbiByZWFjdGlvbkZyb21SZXNwb25zZShyZXNwb25zZSwgY29udGVudExvY2F0aW9uKSB7XG4gICAgLy8gVE9ETzogdGhlIHNlcnZlciBzaG91bGQgZ2l2ZSB1cyBiYWNrIGEgcmVhY3Rpb24gbWF0Y2hpbmcgdGhlIG5ldyBBUEkgZm9ybWF0LlxuICAgIC8vICAgICAgIHdlJ3JlIGp1c3QgZmFraW5nIGl0IG91dCBmb3Igbm93OyB0aGlzIGNvZGUgaXMgdGVtcG9yYXJ5XG4gICAgdmFyIHJlYWN0aW9uID0ge1xuICAgICAgICB0ZXh0OiByZXNwb25zZS5pbnRlcmFjdGlvbi5pbnRlcmFjdGlvbl9ub2RlLmJvZHksXG4gICAgICAgIGlkOiByZXNwb25zZS5pbnRlcmFjdGlvbi5pbnRlcmFjdGlvbl9ub2RlLmlkLFxuICAgICAgICBjb3VudDogMSxcbiAgICAgICAgcGFyZW50SUQ6IHJlc3BvbnNlLmludGVyYWN0aW9uLmlkLFxuICAgICAgICBhcHByb3ZlZDogcmVzcG9uc2UuYXBwcm92ZWQgPT09IHVuZGVmaW5lZCB8fCByZXNwb25zZS5hcHByb3ZlZFxuICAgIH07XG4gICAgaWYgKHJlc3BvbnNlLmNvbnRlbnRfbm9kZSkge1xuICAgICAgICByZWFjdGlvbi5jb250ZW50ID0ge1xuICAgICAgICAgICAgaWQ6IHJlc3BvbnNlLmNvbnRlbnRfbm9kZS5pZCxcbiAgICAgICAgICAgIGtpbmQ6IHJlc3BvbnNlLmNvbnRlbnRfbm9kZS5raW5kLFxuICAgICAgICAgICAgYm9keTogcmVzcG9uc2UuY29udGVudF9ub2RlLmJvZHlcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKHJlc3BvbnNlLmNvbnRlbnRfbm9kZS5sb2NhdGlvbikge1xuICAgICAgICAgICAgcmVhY3Rpb24uY29udGVudC5sb2NhdGlvbiA9IHJlc3BvbnNlLmNvbnRlbnRfbm9kZS5sb2NhdGlvbjtcbiAgICAgICAgfSBlbHNlIGlmIChjb250ZW50TG9jYXRpb24pIHtcbiAgICAgICAgICAgIC8vIFRPRE86IGVuc3VyZSB0aGF0IHRoZSBBUEkgYWx3YXlzIHJldHVybnMgYSBsb2NhdGlvbiBhbmQgcmVtb3ZlIHRoZSBcImNvbnRlbnRMb2NhdGlvblwiIHRoYXQncyBiZWluZyBwYXNzZWQgYXJvdW5kLlxuICAgICAgICAgICAgLy8gRm9yIG5vdywganVzdCBwYXRjaCB0aGUgcmVzcG9uc2Ugd2l0aCB0aGUgZGF0YSB3ZSBrbm93IHdlIHNlbnQgb3Zlci5cbiAgICAgICAgICAgIHJlYWN0aW9uLmNvbnRlbnQubG9jYXRpb24gPSBjb250ZW50TG9jYXRpb247XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlYWN0aW9uO1xufVxuXG5mdW5jdGlvbiBnZXRDb21tZW50cyhyZWFjdGlvbiwgc3VjY2Vzc0NhbGxiYWNrLCBlcnJvckNhbGxiYWNrKSB7XG4gICAgVXNlci5mZXRjaFVzZXIoZnVuY3Rpb24odXNlckluZm8pIHtcbiAgICAgICAgdmFyIGRhdGEgPSB7XG4gICAgICAgICAgICByZWFjdGlvbl9pZDogcmVhY3Rpb24ucGFyZW50SUQsXG4gICAgICAgICAgICB1c2VyX2lkOiB1c2VySW5mby51c2VyX2lkLFxuICAgICAgICAgICAgYW50X3Rva2VuOiB1c2VySW5mby5hbnRfdG9rZW5cbiAgICAgICAgfTtcbiAgICAgICAgZ2V0SlNPTlAoVVJMcy5mZXRjaENvbW1lbnRVcmwoKSwgZGF0YSwgZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIHN1Y2Nlc3NDYWxsYmFjayhjb21tZW50c0Zyb21SZXNwb25zZShyZXNwb25zZSkpO1xuICAgICAgICB9LCBlcnJvckNhbGxiYWNrKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gZmV0Y2hMb2NhdGlvbkRldGFpbHMocmVhY3Rpb25Mb2NhdGlvbkRhdGEsIHBhZ2VEYXRhLCBzdWNjZXNzQ2FsbGJhY2ssIGVycm9yQ2FsbGJhY2spIHtcbiAgICB2YXIgY29udGVudElEcyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHJlYWN0aW9uTG9jYXRpb25EYXRhKTtcbiAgICBVc2VyLmZldGNoVXNlcihmdW5jdGlvbih1c2VySW5mbykge1xuICAgICAgICB2YXIgZGF0YSA9IHtcbiAgICAgICAgICAgIHVzZXJfaWQ6IHVzZXJJbmZvLnVzZXJfaWQsXG4gICAgICAgICAgICBhbnRfdG9rZW46IHVzZXJJbmZvLmFudF90b2tlbixcbiAgICAgICAgICAgIGNvbnRlbnRfaWRzOiBjb250ZW50SURzXG4gICAgICAgIH07XG4gICAgICAgIGdldEpTT05QKFVSTHMuZmV0Y2hDb250ZW50Qm9kaWVzVXJsKCksIGRhdGEsIHN1Y2Nlc3NDYWxsYmFjaywgZXJyb3JDYWxsYmFjayk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGNvbW1lbnRzRnJvbVJlc3BvbnNlKGpzb25Db21tZW50cykge1xuICAgIHZhciBjb21tZW50cyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwganNvbkNvbW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBqc29uQ29tbWVudCA9IGpzb25Db21tZW50c1tpXTtcbiAgICAgICAgdmFyIGNvbW1lbnQgPSB7XG4gICAgICAgICAgICB0ZXh0OiBqc29uQ29tbWVudC50ZXh0LFxuICAgICAgICAgICAgaWQ6IGpzb25Db21tZW50LmlkLCAvLyBUT0RPOiB3ZSBwcm9iYWJseSBvbmx5IG5lZWQgdGhpcyBmb3IgKzEnaW5nIGNvbW1lbnRzXG4gICAgICAgICAgICBjb250ZW50SUQ6IGpzb25Db21tZW50LmNvbnRlbnRJRCwgLy8gVE9ETzogRG8gd2UgcmVhbGx5IG5lZWQgdGhpcz9cbiAgICAgICAgICAgIHVzZXI6IFVzZXIuZnJvbUNvbW1lbnRKU09OKGpzb25Db21tZW50LnVzZXIsIGpzb25Db21tZW50LnNvY2lhbF91c2VyKVxuICAgICAgICB9O1xuICAgICAgICBjb21tZW50cy5wdXNoKGNvbW1lbnQpO1xuICAgIH1cbiAgICByZXR1cm4gY29tbWVudHM7XG59XG5cbmZ1bmN0aW9uIHBvc3RTaGFyZVJlYWN0aW9uKHJlYWN0aW9uRGF0YSwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIHN1Y2Nlc3MsIGZhaWx1cmUpIHtcbiAgICBVc2VyLmZldGNoVXNlcihmdW5jdGlvbih1c2VySW5mbykge1xuICAgICAgICB2YXIgY29udGVudERhdGEgPSByZWFjdGlvbkRhdGEuY29udGVudDtcbiAgICAgICAgdmFyIGRhdGEgPSB7XG4gICAgICAgICAgICB0YWc6IHsgLy8gVE9ETzogd2h5IGRvZXMgdGhlIFNoYXJlSGFuZGxlciBjcmVhdGUgYSByZWFjdGlvbiBpZiBpdCBkb2Vzbid0IGV4aXN0PyBIb3cgY2FuIHlvdSBzaGFyZSBhIHJlYWN0aW9uIHRoYXQgaGFzbid0IGhhcHBlbmVkP1xuICAgICAgICAgICAgICAgIGlkOiByZWFjdGlvbkRhdGEuaWQsXG4gICAgICAgICAgICAgICAgYm9keTogcmVhY3Rpb25EYXRhLnRleHRcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBoYXNoOiBjb250YWluZXJEYXRhLmhhc2gsXG4gICAgICAgICAgICBjb250YWluZXJfa2luZDogY29udGFpbmVyRGF0YS50eXBlLFxuICAgICAgICAgICAgY29udGVudF9ub2RlX2RhdGE6IHsgLy8gVE9ETzogd2h5IGRvZXMgdGhlIFNoYXJlSGFuZGxlciBjcmVhdGUgYSBjb250ZW50IGlmIGl0IGRvZXNuJ3QgZXhpc3Q/IEhvdyBjYW4geW91IHNoYXJlIGEgcmVhY3Rpb24gdGhhdCBoYXNuJ3QgaGFwcGVuZWQ/XG4gICAgICAgICAgICAgICAgaWQ6IGNvbnRlbnREYXRhLmlkLFxuICAgICAgICAgICAgICAgIGJvZHk6IGNvbnRlbnREYXRhLnRleHQsXG4gICAgICAgICAgICAgICAgbG9jYXRpb246IGNvbnRlbnREYXRhLmxvY2F0aW9uLFxuICAgICAgICAgICAgICAgIGtpbmQ6IGNvbnRlbnROb2RlRGF0YUtpbmQoY29udGFpbmVyRGF0YS50eXBlKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHVzZXJfaWQ6IHVzZXJJbmZvLnVzZXJfaWQsXG4gICAgICAgICAgICBhbnRfdG9rZW46IHVzZXJJbmZvLmFudF90b2tlbixcbiAgICAgICAgICAgIGdyb3VwX2lkOiBwYWdlRGF0YS5ncm91cElkLFxuICAgICAgICAgICAgcGFnZV9pZDogcGFnZURhdGEucGFnZUlkLFxuICAgICAgICAgICAgcmVmZXJyaW5nX2ludF9pZDogcmVhY3Rpb25EYXRhLnBhcmVudElEXG4gICAgICAgIH07XG4gICAgICAgIGdldEpTT05QKFVSTHMuc2hhcmVSZWFjdGlvblVybCgpLCBkYXRhLCBzdWNjZXNzLCBmYWlsdXJlKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gZ2V0SlNPTlAodXJsLCBkYXRhLCBzdWNjZXNzLCBlcnJvcikge1xuICAgIHZhciBiYXNlVXJsID0gVVJMcy5hcHBTZXJ2ZXJVcmwoKTtcbiAgICBkb0dldEpTT05QKGJhc2VVcmwsIHVybCwgZGF0YSwgc3VjY2VzcywgZXJyb3IpO1xufVxuXG5mdW5jdGlvbiBwb3N0RXZlbnQoZXZlbnQpIHtcbiAgICB2YXIgYmFzZVVybCA9IFVSTHMuZXZlbnRzU2VydmVyVXJsKCk7XG4gICAgaWYgKEFwcE1vZGUuZGVidWcpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ0FOVEVOTkEgUG9zdGluZyBldmVudDogJyArIEpTT05VdGlscy5zdHJpbmdpZnkoZXZlbnQpKTtcbiAgICB9XG4gICAgZG9HZXRKU09OUChiYXNlVXJsLCBVUkxzLmV2ZW50VXJsKCksIGV2ZW50LCBmdW5jdGlvbigpIHsgLypzdWNjZXNzKi8gfSwgZnVuY3Rpb24oZXJyb3IpIHtcbiAgICAgICAgLy8gVE9ETzogZXJyb3IgaGFuZGxpbmdcbiAgICAgICAgY29uc29sZS5sb2coJ0FuIGVycm9yIG9jY3VycmVkIHBvc3RpbmcgZXZlbnQ6ICcsIGVycm9yKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gcG9zdFRyYWNraW5nRXZlbnQoZXZlbnQpIHtcbiAgICB2YXIgYmFzZVVybCA9IFVSTHMuZXZlbnRzU2VydmVyVXJsKCk7XG4gICAgaWYgKEFwcE1vZGUuZGVidWcpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ0FOVEVOTkEgUG9zdGluZyBldmVudDogJyArIEpTT05VdGlscy5zdHJpbmdpZnkoZXZlbnQpKTtcbiAgICB9XG4gICAgdmFyIHRyYWNraW5nVXJsID0gYmFzZVVybCArIFVSTHMuZXZlbnRVcmwoKSArICcvZXZlbnQuZ2lmJztcbiAgICBpZiAoZXZlbnQpIHtcbiAgICAgICAgdHJhY2tpbmdVcmwgKz0gJz9qc29uPScgKyBlbmNvZGVVUkkoSlNPTlV0aWxzLnN0cmluZ2lmeShldmVudCkpO1xuICAgIH1cbiAgICB2YXIgaW1hZ2VUYWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbWcnKTtcbiAgICBpbWFnZVRhZy5zZXRBdHRyaWJ1dGUoJ2hlaWdodCcsIDEpO1xuICAgIGltYWdlVGFnLnNldEF0dHJpYnV0ZSgnd2lkdGgnLCAxKTtcbiAgICBpbWFnZVRhZy5zZXRBdHRyaWJ1dGUoJ3NyYycsIHRyYWNraW5nVXJsKTtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnYm9keScpWzBdLmFwcGVuZENoaWxkKGltYWdlVGFnKTtcbn1cblxuLy8gSXNzdWVzIGEgSlNPTlAgcmVxdWVzdCB0byBhIGdpdmVuIHNlcnZlci4gVG8gc2VuZCBhIHJlcXVlc3QgdG8gdGhlIGFwcGxpY2F0aW9uIHNlcnZlciwgdXNlIGdldEpTT05QIGluc3RlYWQuXG5mdW5jdGlvbiBkb0dldEpTT05QKGJhc2VVcmwsIHVybCwgcGFyYW1zLCBzdWNjZXNzLCBlcnJvcikge1xuICAgIHZhciBzY3JpcHRUYWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKTtcbiAgICB2YXIgcmVzcG9uc2VDYWxsYmFjayA9ICdhbnRlbm5hJyArIE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMTYpLnNsaWNlKDIpO1xuICAgIHdpbmRvd1tyZXNwb25zZUNhbGxiYWNrXSA9IGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBUT0RPOiBSZXZpc2l0IHdoZXRoZXIgaXQncyByZWFsbHkgY29vbCB0byBrZXkgdGhpcyBvbiB0aGUgdGV4dFN0YXR1cyBvciBpZiB3ZSBzaG91bGQgYmUgbG9va2luZyBhdFxuICAgICAgICAgICAgLy8gICAgICAgdGhlIHN0YXR1cyBjb2RlIGluIHRoZSBYSFJcbiAgICAgICAgICAgIC8vIE5vdGU6IFRoZSBzZXJ2ZXIgY29tZXMgYmFjayB3aXRoIDIwMCByZXNwb25zZXMgd2l0aCBhIG5lc3RlZCBzdGF0dXMgb2YgXCJmYWlsXCIuLi5cbiAgICAgICAgICAgIGlmIChyZXNwb25zZS5zdGF0dXMgIT09ICdmYWlsJyAmJiAoIXJlc3BvbnNlLmRhdGEgfHwgcmVzcG9uc2UuZGF0YS5zdGF0dXMgIT09ICdmYWlsJykpIHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyb3IpIHsgZXJyb3IocmVzcG9uc2UubWVzc2FnZSB8fCByZXNwb25zZS5kYXRhLm1lc3NhZ2UpOyB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICBkZWxldGUgd2luZG93W3Jlc3BvbnNlQ2FsbGJhY2tdO1xuICAgICAgICAgICAgc2NyaXB0VGFnLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoc2NyaXB0VGFnKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgdmFyIGpzb25wVXJsID0gYmFzZVVybCArIHVybCArICc/Y2FsbGJhY2s9JyArIHJlc3BvbnNlQ2FsbGJhY2s7XG4gICAgaWYgKHBhcmFtcykge1xuICAgICAgICBqc29ucFVybCArPSAnJmpzb249JyArIGVuY29kZVVSSUNvbXBvbmVudChKU09OVXRpbHMuc3RyaW5naWZ5KHBhcmFtcykpO1xuICAgIH1cbiAgICBzY3JpcHRUYWcuc2V0QXR0cmlidXRlKCd0eXBlJywgJ2FwcGxpY2F0aW9uL2phdmFzY3JpcHQnKTtcbiAgICBzY3JpcHRUYWcuc2V0QXR0cmlidXRlKCdzcmMnLCBqc29ucFVybCk7XG4gICAgKGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF0gfHwgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2JvZHknKVswXSkuYXBwZW5kQ2hpbGQoc2NyaXB0VGFnKTtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGdldEpTT05QOiBnZXRKU09OUCxcbiAgICBwb3N0UGx1c09uZTogcG9zdFBsdXNPbmUsXG4gICAgcG9zdE5ld1JlYWN0aW9uOiBwb3N0TmV3UmVhY3Rpb24sXG4gICAgcG9zdENvbW1lbnQ6IHBvc3RDb21tZW50LFxuICAgIGdldENvbW1lbnRzOiBnZXRDb21tZW50cyxcbiAgICBwb3N0U2hhcmVSZWFjdGlvbjogcG9zdFNoYXJlUmVhY3Rpb24sXG4gICAgZmV0Y2hMb2NhdGlvbkRldGFpbHM6IGZldGNoTG9jYXRpb25EZXRhaWxzLFxuICAgIHBvc3RFdmVudDogcG9zdEV2ZW50LFxuICAgIHBvc3RUcmFja2luZ0V2ZW50OiBwb3N0VHJhY2tpbmdFdmVudFxufTsiLCJ2YXIgVVJMQ29uc3RhbnRzID0gcmVxdWlyZSgnLi91cmwtY29uc3RhbnRzJyk7XG5cbmZ1bmN0aW9uIGNvbXB1dGVDdXJyZW50U2NyaXB0U3JjKCkge1xuICAgIGlmIChkb2N1bWVudC5jdXJyZW50U2NyaXB0KSB7XG4gICAgICAgIHJldHVybiBkb2N1bWVudC5jdXJyZW50U2NyaXB0LnNyYztcbiAgICB9XG4gICAgLy8gSUUgZmFsbGJhY2suLi5cbiAgICB2YXIgc2NyaXB0cyA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdzY3JpcHQnKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNjcmlwdHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIHNjcmlwdCA9IHNjcmlwdHNbaV07XG4gICAgICAgIGlmIChzY3JpcHQuaGFzQXR0cmlidXRlKCdzcmMnKSkge1xuICAgICAgICAgICAgdmFyIHNjcmlwdFNyYyA9IHNjcmlwdC5nZXRBdHRyaWJ1dGUoJ3NyYycpO1xuICAgICAgICAgICAgdmFyIGFudGVubmFTY3JpcHRzID0gWyAnYW50ZW5uYS5qcycsICdhbnRlbm5hLm1pbi5qcycsICdlbmdhZ2UuanMnLCAnZW5nYWdlX2Z1bGwuanMnIF07XG4gICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGFudGVubmFTY3JpcHRzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNjcmlwdFNyYy5pbmRleE9mKGFudGVubmFTY3JpcHRzW2pdKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNjcmlwdFNyYztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbnZhciBjdXJyZW50U2NyaXB0U3JjID0gY29tcHV0ZUN1cnJlbnRTY3JpcHRTcmMoKSB8fCAnJztcblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIG9mZmxpbmU6IGN1cnJlbnRTY3JpcHRTcmMuaW5kZXhPZihVUkxDb25zdGFudHMuREVWRUxPUE1FTlQpICE9PSAtMSB8fCBjdXJyZW50U2NyaXB0U3JjLmluZGV4T2YoVVJMQ29uc3RhbnRzLlRFU1QpICE9PSAtMSxcbiAgICB0ZXN0OiBjdXJyZW50U2NyaXB0U3JjLmluZGV4T2YoVVJMQ29uc3RhbnRzLlRFU1QpICE9PSAtMSxcbiAgICBkZWJ1ZzogY3VycmVudFNjcmlwdFNyYy5pbmRleE9mKCc/ZGVidWcnKSAhPT0gLTFcbn07IiwiXG52YXIgaXNUb3VjaEJyb3dzZXI7XG52YXIgaXNNb2JpbGVEZXZpY2U7XG5cbmZ1bmN0aW9uIHN1cHBvcnRzVG91Y2goKSB7XG4gICAgaWYgKGlzVG91Y2hCcm93c2VyID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgLy9pc1RvdWNoQnJvd3NlciA9IChuYXZpZ2F0b3IubXNNYXhUb3VjaFBvaW50cyB8fCBcIm9udG91Y2hzdGFydFwiIGluIHdpbmRvdykgJiYgKCh3aW5kb3cubWF0Y2hNZWRpYShcIm9ubHkgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjhweClcIikpLm1hdGNoZXMpO1xuICAgICAgICBpc1RvdWNoQnJvd3NlciA9IFwib250b3VjaHN0YXJ0XCIgaW4gd2luZG93O1xuICAgIH1cbiAgICByZXR1cm4gaXNUb3VjaEJyb3dzZXI7XG59XG5cbmZ1bmN0aW9uIGlzTW9iaWxlKCkge1xuICAgIGlmIChpc01vYmlsZURldmljZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGlzTW9iaWxlRGV2aWNlID0gc3VwcG9ydHNUb3VjaCgpICYmXG4gICAgICAgICAgICAoKHdpbmRvdy5tYXRjaE1lZGlhKFwic2NyZWVuIGFuZCAobWF4LWRldmljZS13aWR0aDogNDgwcHgpIGFuZCAob3JpZW50YXRpb246IHBvcnRyYWl0KVwiKSkubWF0Y2hlcyB8fFxuICAgICAgICAgICAgKHdpbmRvdy5tYXRjaE1lZGlhKFwic2NyZWVuIGFuZCAobWF4LWRldmljZS13aWR0aDogNzY4cHgpIGFuZCAob3JpZW50YXRpb246IGxhbmRzY2FwZSlcIikpLm1hdGNoZXMpO1xuICAgIH1cbiAgICByZXR1cm4gaXNNb2JpbGVEZXZpY2U7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHN1cHBvcnRzVG91Y2g6IHN1cHBvcnRzVG91Y2gsXG4gICAgaXNNb2JpbGU6IGlzTW9iaWxlXG59OyIsIlxuLy8gUmUtdXNhYmxlIHN1cHBvcnQgZm9yIG1hbmFnaW5nIGEgY29sbGVjdGlvbiBvZiBjYWxsYmFjayBmdW5jdGlvbnMuXG5cbnZhciBhbnR1aWQgPSAwOyAvLyBcImdsb2JhbGx5XCIgdW5pcXVlIElEIHRoYXQgd2UgdXNlIHRvIHRhZyBjYWxsYmFjayBmdW5jdGlvbnMgZm9yIGxhdGVyIHJldHJpZXZhbC4gKFRoaXMgaXMgaG93IFwib2ZmXCIgd29ya3MuKVxuXG5mdW5jdGlvbiBjcmVhdGVDYWxsYmFja3MoKSB7XG5cbiAgICB2YXIgY2FsbGJhY2tzID0ge307XG5cbiAgICBmdW5jdGlvbiBhZGRDYWxsYmFjayhjYWxsYmFjaykge1xuICAgICAgICBpZiAoY2FsbGJhY2suYW50dWlkID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrLmFudHVpZCA9IGFudHVpZCsrO1xuICAgICAgICB9XG4gICAgICAgIGNhbGxiYWNrc1tjYWxsYmFjay5hbnR1aWRdID0gY2FsbGJhY2s7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcmVtb3ZlQ2FsbGJhY2soY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKGNhbGxiYWNrLmFudHVpZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBkZWxldGUgY2FsbGJhY2tzW2NhbGxiYWNrLmFudHVpZF07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRDYWxsYmFja3MoKSB7XG4gICAgICAgIHZhciBhbGxDYWxsYmFja3MgPSBbXTtcbiAgICAgICAgZm9yICh2YXIga2V5IGluIGNhbGxiYWNrcykge1xuICAgICAgICAgICAgaWYgKGNhbGxiYWNrcy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgYWxsQ2FsbGJhY2tzLnB1c2goY2FsbGJhY2tzW2tleV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhbGxDYWxsYmFja3M7XG4gICAgfVxuXG4gICAgLy8gQ29udmVuaWVuY2UgZnVuY3Rpb24gdGhhdCBpbnZva2VzIGFsbCBjYWxsYmFja3Mgd2l0aCBubyBwYXJhbWV0ZXJzLiBBbnkgY2FsbGJhY2tzIHRoYXQgbmVlZCBwYXJhbXMgY2FuIGJlIGNhbGxlZFxuICAgIC8vIGJ5IGNsaWVudHMgdXNpbmcgZ2V0Q2FsbGJhY2tzKClcbiAgICBmdW5jdGlvbiBpbnZva2VBbGwoKSB7XG4gICAgICAgIHZhciBjYWxsYmFja3MgPSBnZXRDYWxsYmFja3MoKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjYWxsYmFja3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNhbGxiYWNrc1tpXSgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNFbXB0eSgpIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKGNhbGxiYWNrcykubGVuZ3RoID09PSAwO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHRlYXJkb3duKCkge1xuICAgICAgICBjYWxsYmFja3MgPSB7fTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBhZGQ6IGFkZENhbGxiYWNrLFxuICAgICAgICByZW1vdmU6IHJlbW92ZUNhbGxiYWNrLFxuICAgICAgICBnZXQ6IGdldENhbGxiYWNrcyxcbiAgICAgICAgaXNFbXB0eTogaXNFbXB0eSxcbiAgICAgICAgaW52b2tlQWxsOiBpbnZva2VBbGwsXG4gICAgICAgIHRlYXJkb3duOiB0ZWFyZG93blxuICAgIH1cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZTogY3JlYXRlQ2FsbGJhY2tzXG59OyIsInZhciAkOyByZXF1aXJlKCcuL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIE1ENSA9IHJlcXVpcmUoJy4vbWQ1Jyk7XG5cbmZ1bmN0aW9uIGdldENsZWFuVGV4dCgkZWxlbWVudCkge1xuICAgIHZhciAkY2xvbmUgPSAkZWxlbWVudC5jbG9uZSgpO1xuICAgIC8vIFJlbW92ZSBhbnkgZWxlbWVudHMgdGhhdCB3ZSBkb24ndCB3YW50IGluY2x1ZGVkIGluIHRoZSB0ZXh0IGNhbGN1bGF0aW9uXG4gICAgJGNsb25lLmZpbmQoJ2lmcmFtZSwgaW1nLCBzY3JpcHQsIHZpZGVvLCAuYW50ZW5uYSwgLm5vLWFudCcpLnJlbW92ZSgpLmVuZCgpO1xuICAgIC8vIFRoZW4gbWFudWFsbHkgY29udmVydCBhbnkgPGJyPiB0YWdzIGludG8gc3BhY2VzIChvdGhlcndpc2UsIHdvcmRzIHdpbGwgZ2V0IGFwcGVuZGVkIGJ5IHRoZSB0ZXh0KCkgY2FsbClcbiAgICB2YXIgaHRtbCA9ICRjbG9uZS5odG1sKCkucmVwbGFjZSgvPFxcU2JyXFxTXFwvPz4vZ2ksICcgJyk7XG4gICAgLy8gUHV0IHRoZSBIVE1MIGJhY2sgaW50byBhIGRpdiBhbmQgY2FsbCB0ZXh0KCksIHdoaWNoIGRvZXMgbW9zdCBvZiB0aGUgaGVhdnkgbGlmdGluZ1xuICAgIHZhciB0ZXh0ID0gJCgnPGRpdj4nICsgaHRtbCArICc8L2Rpdj4nKS50ZXh0KCkudG9Mb3dlckNhc2UoKS50cmltKCk7XG4gICAgdGV4dCA9IHRleHQucmVwbGFjZSgvW1xcblxcclxcdF0vZ2ksICcgJyk7IC8vIFJlcGxhY2UgYW55IG5ld2xpbmVzL3RhYnMgd2l0aCBzcGFjZXNcbiAgICByZXR1cm4gdGV4dDtcbn1cblxuZnVuY3Rpb24gaGFzaFRleHQoZWxlbWVudCwgc3VmZml4KSB7XG4gICAgdmFyIHRleHQgPSBnZXRDbGVhblRleHQoZWxlbWVudCk7XG4gICAgaWYgKHRleHQpIHtcbiAgICAgICAgdmFyIGhhc2hUZXh0ID0gXCJyZHItdGV4dC1cIiArIHRleHQ7XG4gICAgICAgIGlmIChzdWZmaXggIT09IHVuZGVmaW5lZCkgeyAvLyBBcHBlbmQgdGhlIG9wdGlvbmFsIHN1ZmZpeFxuICAgICAgICAgICAgaGFzaFRleHQgKz0gJy0nICsgc3VmZml4O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBNRDUuaGV4X21kNShoYXNoVGV4dCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBoYXNoVXJsKHVybCkge1xuICAgIHJldHVybiBNRDUuaGV4X21kNSh1cmwpO1xufVxuXG5mdW5jdGlvbiBoYXNoSW1hZ2UoaW1hZ2VVcmwsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICBpZiAoaW1hZ2VVcmwgJiYgaW1hZ2VVcmwubGVuZ3RoID4gMCkge1xuICAgICAgICBpbWFnZVVybCA9IGZpZGRsZVdpdGhJbWFnZUFuZE1lZGlhVXJscyhpbWFnZVVybCwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIHZhciBoYXNoVGV4dCA9ICdyZHItaW1nLScgKyBpbWFnZVVybDtcbiAgICAgICAgcmV0dXJuIE1ENS5oZXhfbWQ1KGhhc2hUZXh0KTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGhhc2hNZWRpYShtZWRpYVVybCwgZ3JvdXBTZXR0aW5ncykge1xuICAgIGlmIChtZWRpYVVybCAmJiBtZWRpYVVybC5sZW5ndGggPiAwKSB7XG4gICAgICAgIG1lZGlhVXJsID0gZmlkZGxlV2l0aEltYWdlQW5kTWVkaWFVcmxzKG1lZGlhVXJsLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgdmFyIGhhc2hUZXh0ID0gJ3Jkci1tZWRpYS0nICsgbWVkaWFVcmw7XG4gICAgICAgIHJldHVybiBNRDUuaGV4X21kNShoYXNoVGV4dCk7XG4gICAgfVxufVxuXG4vLyBUT0RPOiByZXZpZXcuIGNvcGllZCBmcm9tIGVuZ2FnZV9mdWxsXG5mdW5jdGlvbiBmaWRkbGVXaXRoSW1hZ2VBbmRNZWRpYVVybHModXJsLCBncm91cFNldHRpbmdzKSB7XG4gICAgLy8gZmlkZGxlIHdpdGggdGhlIHVybCB0byBhY2NvdW50IGZvciByb3RhdGluZyBzdWJkb21haW5zIChpLmUuLCBkaWZmZXJpbmcgQ0ROIG5hbWVzIGZvciBpbWFnZSBob3N0cylcbiAgICAvLyByZWdleCBmcm9tIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvNjQ0OTM0MC9ob3ctdG8tZ2V0LXRvcC1sZXZlbC1kb21haW4tYmFzZS1kb21haW4tZnJvbS10aGUtdXJsLWluLWphdmFzY3JpcHRcbiAgICAvLyBtb2RpZmllZCB0byBzdXBwb3J0IDIgY2hhcmFjdGVyIHN1ZmZpeGVzLCBsaWtlIC5mbSBvciAuaW9cbiAgICB2YXIgSE9TVERPTUFJTiA9IC9bLVxcd10rXFwuKD86Wy1cXHddK1xcLnhuLS1bLVxcd10rfFstXFx3XXsyLH18Wy1cXHddK1xcLlstXFx3XXsyfSkkL2k7XG4gICAgdmFyIHNyY0FycmF5ID0gdXJsLnNwbGl0KCcvJyk7XG4gICAgc3JjQXJyYXkuc3BsaWNlKDAsMik7XG5cbiAgICB2YXIgZG9tYWluV2l0aFBvcnQgPSBzcmNBcnJheS5zaGlmdCgpO1xuICAgIGlmICghZG9tYWluV2l0aFBvcnQpIHsgLy90aGlzIGNvdWxkIGJlIHVuZGVmaW5lZCBpZiB0aGUgdXJsIG5vdCB2YWxpZCBvciBpcyBzb21ldGhpbmcgbGlrZSBqYXZhc2NyaXB0OnZvaWRcbiAgICAgICAgcmV0dXJuIHVybDtcbiAgICB9XG4gICAgdmFyIGRvbWFpbiA9IGRvbWFpbldpdGhQb3J0LnNwbGl0KCc6JylbMF07IC8vIGdldCBkb21haW4sIHN0cmlwIHBvcnRcblxuICAgIHZhciBmaWxlbmFtZSA9IHNyY0FycmF5LmpvaW4oJy8nKTtcblxuICAgIC8vIHRlc3QgZXhhbXBsZXM6XG4gICAgLy8gdmFyIG1hdGNoID0gSE9TVERPTUFJTi5leGVjKCdodHRwOi8vbWVkaWExLmFiLmNkLm9uLXRoZS10ZWxseS5iYmMuY28udWsvJyk7IC8vIGZhaWxzOiB0cmFpbGluZyBzbGFzaFxuICAgIC8vIHZhciBtYXRjaCA9IEhPU1RET01BSU4uZXhlYygnaHR0cDovL21lZGlhMS5hYi5jZC5vbi10aGUtdGVsbHkuYmJjLmNvLnVrJyk7IC8vIHN1Y2Nlc3NcbiAgICAvLyB2YXIgbWF0Y2ggPSBIT1NURE9NQUlOLmV4ZWMoJ21lZGlhMS5hYi5jZC5vbi10aGUtdGVsbHkuYmJjLmNvLnVrJyk7IC8vIHN1Y2Nlc3NcbiAgICB2YXIgbWF0Y2ggPSBIT1NURE9NQUlOLmV4ZWMoZG9tYWluKTtcbiAgICBpZiAobWF0Y2ggPT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gdXJsO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHVybCA9IG1hdGNoWzBdICsgJy8nICsgZmlsZW5hbWU7XG4gICAgfVxuICAgIGlmIChncm91cFNldHRpbmdzLnVybC5pZ25vcmVNZWRpYVVybFF1ZXJ5KCkgJiYgdXJsLmluZGV4T2YoJz8nKSkge1xuICAgICAgICB1cmwgPSB1cmwuc3BsaXQoJz8nKVswXTtcbiAgICB9XG4gICAgcmV0dXJuIHVybDtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGhhc2hUZXh0OiBoYXNoVGV4dCxcbiAgICBoYXNoSW1hZ2U6IGhhc2hJbWFnZSxcbiAgICBoYXNoTWVkaWE6IGhhc2hNZWRpYSxcbiAgICBoYXNoVXJsOiBoYXNoVXJsXG59OyIsIlxudmFyIGxvYWRlZGpRdWVyeTtcbnZhciBjYWxsYmFja3MgPSBbXTtcblxuLy8gTm90aWZpZXMgdGhlIGpRdWVyeSBwcm92aWRlciB0aGF0IHdlJ3ZlIGxvYWRlZCB0aGUgalF1ZXJ5IGxpYnJhcnkuXG5mdW5jdGlvbiBsb2FkZWQoKSB7XG4gICAgbG9hZGVkalF1ZXJ5ID0galF1ZXJ5Lm5vQ29uZmxpY3QoKTtcbiAgICBub3RpZnlDYWxsYmFja3MoKTtcbn1cblxuZnVuY3Rpb24gbm90aWZ5Q2FsbGJhY2tzKCkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2FsbGJhY2tzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNhbGxiYWNrc1tpXShsb2FkZWRqUXVlcnkpO1xuICAgIH1cbiAgICBjYWxsYmFja3MgPSBbXTtcbn1cblxuLy8gUmVnaXN0ZXJzIHRoZSBnaXZlbiBjYWxsYmFjayB0byBiZSBub3RpZmllZCB3aGVuIG91ciB2ZXJzaW9uIG9mIGpRdWVyeSBpcyBsb2FkZWQuXG5mdW5jdGlvbiBvbkxvYWQoY2FsbGJhY2spIHtcbiAgICBpZiAobG9hZGVkalF1ZXJ5KSB7XG4gICAgICAgIGNhbGxiYWNrKGxvYWRlZGpRdWVyeSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgY2FsbGJhY2tzLnB1c2goY2FsbGJhY2spO1xuICAgIH1cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGxvYWRlZDogbG9hZGVkLFxuICAgIG9uTG9hZDogb25Mb2FkXG59OyIsIlxuLy8gVGhlcmUgYXJlIGxpYnJhcmllcyBpbiB0aGUgd2lsZCB0aGF0IG1vZGlmeSBBcnJheS5wcm90b3R5cGUgd2l0aCBhIHRvSlNPTiBmdW5jdGlvbiB0aGF0IGJyZWFrcyBKU09OLnN0cmluZ2lmeS5cbi8vIFdvcmthcm91bmQgdGhpcyBwcm9ibGVtIGJ5IHRlbXBvcmFyaWx5IHJlbW92aW5nIHRoZSBmdW5jdGlvbiB3aGVuIHdlIHN0cmluZ2lmeSBvdXIgb2JqZWN0cy5cbmZ1bmN0aW9uIHN0cmluZ2lmeShqc29uT2JqZWN0KSB7XG4gICAgdmFyIHRvSlNPTiA9IEFycmF5LnByb3RvdHlwZS50b0pTT047XG4gICAgZGVsZXRlIEFycmF5LnByb3RvdHlwZS50b0pTT047XG4gICAgdmFyIHN0cmluZyA9IEpTT04uc3RyaW5naWZ5KGpzb25PYmplY3QpO1xuICAgIGlmICh0b0pTT04pIHtcbiAgICAgICAgQXJyYXkucHJvdG90eXBlLnRvSlNPTiA9IHRvSlNPTjtcbiAgICB9XG4gICAgcmV0dXJuIHN0cmluZztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgc3RyaW5naWZ5OiBzdHJpbmdpZnlcbn07IiwiLypcbiAqIEEgSmF2YVNjcmlwdCBpbXBsZW1lbnRhdGlvbiBvZiB0aGUgUlNBIERhdGEgU2VjdXJpdHksIEluYy4gTUQ1IE1lc3NhZ2VcbiAqIERpZ2VzdCBBbGdvcml0aG0sIGFzIGRlZmluZWQgaW4gUkZDIDEzMjEuXG4gKiBWZXJzaW9uIDIuMSBDb3B5cmlnaHQgKEMpIFBhdWwgSm9obnN0b24gMTk5OSAtIDIwMDIuXG4gKiBPdGhlciBjb250cmlidXRvcnM6IEdyZWcgSG9sdCwgQW5kcmV3IEtlcGVydCwgWWRuYXIsIExvc3RpbmV0XG4gKiBEaXN0cmlidXRlZCB1bmRlciB0aGUgQlNEIExpY2Vuc2VcbiAqIFNlZSBodHRwOi8vcGFqaG9tZS5vcmcudWsvY3J5cHQvbWQ1IGZvciBtb3JlIGluZm8uXG4gKi9cblxudmFyIGhleGNhc2UgPSAwO1xudmFyIGI2NHBhZCAgPSBcIlwiO1xudmFyIGNocnN6ID0gODtcblxuZnVuY3Rpb24gaGV4X21kNShzKSB7XG4gICAgcmV0dXJuIGJpbmwyaGV4KGNvcmVfbWQ1KHN0cjJiaW5sKHMpLCBzLmxlbmd0aCAqIGNocnN6KSk7XG59XG5cbmZ1bmN0aW9uIGNvcmVfbWQ1KHgsIGxlbikge1xuICAgIHhbbGVuID4+IDVdIHw9IDB4ODAgPDwgKChsZW4pICUgMzIpO1xuICAgIHhbKCgobGVuICsgNjQpID4+PiA5KSA8PCA0KSArIDE0XSA9IGxlbjtcbiAgICB2YXIgYSA9IDE3MzI1ODQxOTM7XG4gICAgdmFyIGIgPSAtMjcxNzMzODc5O1xuICAgIHZhciBjID0gLTE3MzI1ODQxOTQ7XG4gICAgdmFyIGQgPSAyNzE3MzM4Nzg7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB4Lmxlbmd0aDsgaSArPSAxNikge1xuICAgICAgICB2YXIgb2xkYSA9IGE7XG4gICAgICAgIHZhciBvbGRiID0gYjtcbiAgICAgICAgdmFyIG9sZGMgPSBjO1xuICAgICAgICB2YXIgb2xkZCA9IGQ7XG5cbiAgICAgICAgYSA9IG1kNV9mZihhLCBiLCBjLCBkLCB4W2kgKyAwXSwgNywgLTY4MDg3NjkzNik7XG4gICAgICAgIGQgPSBtZDVfZmYoZCwgYSwgYiwgYywgeFtpICsgMV0sIDEyLCAtMzg5NTY0NTg2KTtcbiAgICAgICAgYyA9IG1kNV9mZihjLCBkLCBhLCBiLCB4W2kgKyAyXSwgMTcsIDYwNjEwNTgxOSk7XG4gICAgICAgIGIgPSBtZDVfZmYoYiwgYywgZCwgYSwgeFtpICsgM10sIDIyLCAtMTA0NDUyNTMzMCk7XG4gICAgICAgIGEgPSBtZDVfZmYoYSwgYiwgYywgZCwgeFtpICsgNF0sIDcsIC0xNzY0MTg4OTcpO1xuICAgICAgICBkID0gbWQ1X2ZmKGQsIGEsIGIsIGMsIHhbaSArIDVdLCAxMiwgMTIwMDA4MDQyNik7XG4gICAgICAgIGMgPSBtZDVfZmYoYywgZCwgYSwgYiwgeFtpICsgNl0sIDE3LCAtMTQ3MzIzMTM0MSk7XG4gICAgICAgIGIgPSBtZDVfZmYoYiwgYywgZCwgYSwgeFtpICsgN10sIDIyLCAtNDU3MDU5ODMpO1xuICAgICAgICBhID0gbWQ1X2ZmKGEsIGIsIGMsIGQsIHhbaSArIDhdLCA3LCAxNzcwMDM1NDE2KTtcbiAgICAgICAgZCA9IG1kNV9mZihkLCBhLCBiLCBjLCB4W2kgKyA5XSwgMTIsIC0xOTU4NDE0NDE3KTtcbiAgICAgICAgYyA9IG1kNV9mZihjLCBkLCBhLCBiLCB4W2kgKyAxMF0sIDE3LCAtNDIwNjMpO1xuICAgICAgICBiID0gbWQ1X2ZmKGIsIGMsIGQsIGEsIHhbaSArIDExXSwgMjIsIC0xOTkwNDA0MTYyKTtcbiAgICAgICAgYSA9IG1kNV9mZihhLCBiLCBjLCBkLCB4W2kgKyAxMl0sIDcsIDE4MDQ2MDM2ODIpO1xuICAgICAgICBkID0gbWQ1X2ZmKGQsIGEsIGIsIGMsIHhbaSArIDEzXSwgMTIsIC00MDM0MTEwMSk7XG4gICAgICAgIGMgPSBtZDVfZmYoYywgZCwgYSwgYiwgeFtpICsgMTRdLCAxNywgLTE1MDIwMDIyOTApO1xuICAgICAgICBiID0gbWQ1X2ZmKGIsIGMsIGQsIGEsIHhbaSArIDE1XSwgMjIsIDEyMzY1MzUzMjkpO1xuXG4gICAgICAgIGEgPSBtZDVfZ2coYSwgYiwgYywgZCwgeFtpICsgMV0sIDUsIC0xNjU3OTY1MTApO1xuICAgICAgICBkID0gbWQ1X2dnKGQsIGEsIGIsIGMsIHhbaSArIDZdLCA5LCAtMTA2OTUwMTYzMik7XG4gICAgICAgIGMgPSBtZDVfZ2coYywgZCwgYSwgYiwgeFtpICsgMTFdLCAxNCwgNjQzNzE3NzEzKTtcbiAgICAgICAgYiA9IG1kNV9nZyhiLCBjLCBkLCBhLCB4W2kgKyAwXSwgMjAsIC0zNzM4OTczMDIpO1xuICAgICAgICBhID0gbWQ1X2dnKGEsIGIsIGMsIGQsIHhbaSArIDVdLCA1LCAtNzAxNTU4NjkxKTtcbiAgICAgICAgZCA9IG1kNV9nZyhkLCBhLCBiLCBjLCB4W2kgKyAxMF0sIDksIDM4MDE2MDgzKTtcbiAgICAgICAgYyA9IG1kNV9nZyhjLCBkLCBhLCBiLCB4W2kgKyAxNV0sIDE0LCAtNjYwNDc4MzM1KTtcbiAgICAgICAgYiA9IG1kNV9nZyhiLCBjLCBkLCBhLCB4W2kgKyA0XSwgMjAsIC00MDU1Mzc4NDgpO1xuICAgICAgICBhID0gbWQ1X2dnKGEsIGIsIGMsIGQsIHhbaSArIDldLCA1LCA1Njg0NDY0MzgpO1xuICAgICAgICBkID0gbWQ1X2dnKGQsIGEsIGIsIGMsIHhbaSArIDE0XSwgOSwgLTEwMTk4MDM2OTApO1xuICAgICAgICBjID0gbWQ1X2dnKGMsIGQsIGEsIGIsIHhbaSArIDNdLCAxNCwgLTE4NzM2Mzk2MSk7XG4gICAgICAgIGIgPSBtZDVfZ2coYiwgYywgZCwgYSwgeFtpICsgOF0sIDIwLCAxMTYzNTMxNTAxKTtcbiAgICAgICAgYSA9IG1kNV9nZyhhLCBiLCBjLCBkLCB4W2kgKyAxM10sIDUsIC0xNDQ0NjgxNDY3KTtcbiAgICAgICAgZCA9IG1kNV9nZyhkLCBhLCBiLCBjLCB4W2kgKyAyXSwgOSwgLTUxNDAzNzg0KTtcbiAgICAgICAgYyA9IG1kNV9nZyhjLCBkLCBhLCBiLCB4W2kgKyA3XSwgMTQsIDE3MzUzMjg0NzMpO1xuICAgICAgICBiID0gbWQ1X2dnKGIsIGMsIGQsIGEsIHhbaSArIDEyXSwgMjAsIC0xOTI2NjA3NzM0KTtcblxuICAgICAgICBhID0gbWQ1X2hoKGEsIGIsIGMsIGQsIHhbaSArIDVdLCA0LCAtMzc4NTU4KTtcbiAgICAgICAgZCA9IG1kNV9oaChkLCBhLCBiLCBjLCB4W2kgKyA4XSwgMTEsIC0yMDIyNTc0NDYzKTtcbiAgICAgICAgYyA9IG1kNV9oaChjLCBkLCBhLCBiLCB4W2kgKyAxMV0sIDE2LCAxODM5MDMwNTYyKTtcbiAgICAgICAgYiA9IG1kNV9oaChiLCBjLCBkLCBhLCB4W2kgKyAxNF0sIDIzLCAtMzUzMDk1NTYpO1xuICAgICAgICBhID0gbWQ1X2hoKGEsIGIsIGMsIGQsIHhbaSArIDFdLCA0LCAtMTUzMDk5MjA2MCk7XG4gICAgICAgIGQgPSBtZDVfaGgoZCwgYSwgYiwgYywgeFtpICsgNF0sIDExLCAxMjcyODkzMzUzKTtcbiAgICAgICAgYyA9IG1kNV9oaChjLCBkLCBhLCBiLCB4W2kgKyA3XSwgMTYsIC0xNTU0OTc2MzIpO1xuICAgICAgICBiID0gbWQ1X2hoKGIsIGMsIGQsIGEsIHhbaSArIDEwXSwgMjMsIC0xMDk0NzMwNjQwKTtcbiAgICAgICAgYSA9IG1kNV9oaChhLCBiLCBjLCBkLCB4W2kgKyAxM10sIDQsIDY4MTI3OTE3NCk7XG4gICAgICAgIGQgPSBtZDVfaGgoZCwgYSwgYiwgYywgeFtpICsgMF0sIDExLCAtMzU4NTM3MjIyKTtcbiAgICAgICAgYyA9IG1kNV9oaChjLCBkLCBhLCBiLCB4W2kgKyAzXSwgMTYsIC03MjI1MjE5NzkpO1xuICAgICAgICBiID0gbWQ1X2hoKGIsIGMsIGQsIGEsIHhbaSArIDZdLCAyMywgNzYwMjkxODkpO1xuICAgICAgICBhID0gbWQ1X2hoKGEsIGIsIGMsIGQsIHhbaSArIDldLCA0LCAtNjQwMzY0NDg3KTtcbiAgICAgICAgZCA9IG1kNV9oaChkLCBhLCBiLCBjLCB4W2kgKyAxMl0sIDExLCAtNDIxODE1ODM1KTtcbiAgICAgICAgYyA9IG1kNV9oaChjLCBkLCBhLCBiLCB4W2kgKyAxNV0sIDE2LCA1MzA3NDI1MjApO1xuICAgICAgICBiID0gbWQ1X2hoKGIsIGMsIGQsIGEsIHhbaSArIDJdLCAyMywgLTk5NTMzODY1MSk7XG5cbiAgICAgICAgYSA9IG1kNV9paShhLCBiLCBjLCBkLCB4W2kgKyAwXSwgNiwgLTE5ODYzMDg0NCk7XG4gICAgICAgIGQgPSBtZDVfaWkoZCwgYSwgYiwgYywgeFtpICsgN10sIDEwLCAxMTI2ODkxNDE1KTtcbiAgICAgICAgYyA9IG1kNV9paShjLCBkLCBhLCBiLCB4W2kgKyAxNF0sIDE1LCAtMTQxNjM1NDkwNSk7XG4gICAgICAgIGIgPSBtZDVfaWkoYiwgYywgZCwgYSwgeFtpICsgNV0sIDIxLCAtNTc0MzQwNTUpO1xuICAgICAgICBhID0gbWQ1X2lpKGEsIGIsIGMsIGQsIHhbaSArIDEyXSwgNiwgMTcwMDQ4NTU3MSk7XG4gICAgICAgIGQgPSBtZDVfaWkoZCwgYSwgYiwgYywgeFtpICsgM10sIDEwLCAtMTg5NDk4NjYwNik7XG4gICAgICAgIGMgPSBtZDVfaWkoYywgZCwgYSwgYiwgeFtpICsgMTBdLCAxNSwgLTEwNTE1MjMpO1xuICAgICAgICBiID0gbWQ1X2lpKGIsIGMsIGQsIGEsIHhbaSArIDFdLCAyMSwgLTIwNTQ5MjI3OTkpO1xuICAgICAgICBhID0gbWQ1X2lpKGEsIGIsIGMsIGQsIHhbaSArIDhdLCA2LCAxODczMzEzMzU5KTtcbiAgICAgICAgZCA9IG1kNV9paShkLCBhLCBiLCBjLCB4W2kgKyAxNV0sIDEwLCAtMzA2MTE3NDQpO1xuICAgICAgICBjID0gbWQ1X2lpKGMsIGQsIGEsIGIsIHhbaSArIDZdLCAxNSwgLTE1NjAxOTgzODApO1xuICAgICAgICBiID0gbWQ1X2lpKGIsIGMsIGQsIGEsIHhbaSArIDEzXSwgMjEsIDEzMDkxNTE2NDkpO1xuICAgICAgICBhID0gbWQ1X2lpKGEsIGIsIGMsIGQsIHhbaSArIDRdLCA2LCAtMTQ1NTIzMDcwKTtcbiAgICAgICAgZCA9IG1kNV9paShkLCBhLCBiLCBjLCB4W2kgKyAxMV0sIDEwLCAtMTEyMDIxMDM3OSk7XG4gICAgICAgIGMgPSBtZDVfaWkoYywgZCwgYSwgYiwgeFtpICsgMl0sIDE1LCA3MTg3ODcyNTkpO1xuICAgICAgICBiID0gbWQ1X2lpKGIsIGMsIGQsIGEsIHhbaSArIDldLCAyMSwgLTM0MzQ4NTU1MSk7XG5cbiAgICAgICAgYSA9IHNhZmVfYWRkKGEsIG9sZGEpO1xuICAgICAgICBiID0gc2FmZV9hZGQoYiwgb2xkYik7XG4gICAgICAgIGMgPSBzYWZlX2FkZChjLCBvbGRjKTtcbiAgICAgICAgZCA9IHNhZmVfYWRkKGQsIG9sZGQpO1xuICAgIH1cbiAgICByZXR1cm4gW2EsIGIsIGMsIGRdO1xufVxuXG5mdW5jdGlvbiBtZDVfY21uKHEsIGEsIGIsIHgsIHMsIHQpIHtcbiAgICByZXR1cm4gc2FmZV9hZGQoYml0X3JvbChzYWZlX2FkZChzYWZlX2FkZChhLCBxKSwgc2FmZV9hZGQoeCwgdCkpLCBzKSwgYik7XG59XG5cbmZ1bmN0aW9uIG1kNV9mZihhLCBiLCBjLCBkLCB4LCBzLCB0KSB7XG4gICAgcmV0dXJuIG1kNV9jbW4oKGIgJiBjKSB8ICgofmIpICYgZCksIGEsIGIsIHgsIHMsIHQpO1xufVxuXG5mdW5jdGlvbiBtZDVfZ2coYSwgYiwgYywgZCwgeCwgcywgdCkge1xuICAgIHJldHVybiBtZDVfY21uKChiICYgZCkgfCAoYyAmICh+ZCkpLCBhLCBiLCB4LCBzLCB0KTtcbn1cblxuZnVuY3Rpb24gbWQ1X2hoKGEsIGIsIGMsIGQsIHgsIHMsIHQpIHtcbiAgICByZXR1cm4gbWQ1X2NtbihiIF4gYyBeIGQsIGEsIGIsIHgsIHMsIHQpO1xufVxuXG5mdW5jdGlvbiBtZDVfaWkoYSwgYiwgYywgZCwgeCwgcywgdCkge1xuICAgIHJldHVybiBtZDVfY21uKGMgXiAoYiB8ICh+ZCkpLCBhLCBiLCB4LCBzLCB0KTtcbn1cblxuZnVuY3Rpb24gc2FmZV9hZGQoeCwgeSkge1xuICAgIHZhciBsc3cgPSAoeCAmIDB4RkZGRikgKyAoeSAmIDB4RkZGRik7XG4gICAgdmFyIG1zdyA9ICh4ID4+IDE2KSArICh5ID4+IDE2KSArIChsc3cgPj4gMTYpO1xuICAgIHJldHVybiAobXN3IDw8IDE2KSB8IChsc3cgJiAweEZGRkYpO1xufVxuXG5mdW5jdGlvbiBiaXRfcm9sKG51bSwgY250KSB7XG4gICAgcmV0dXJuIChudW0gPDwgY250KSB8IChudW0gPj4+ICgzMiAtIGNudCkpO1xufVxuXG5mdW5jdGlvbiBzdHIyYmlubChzdHIpIHtcbiAgICB2YXIgYmluID0gW107XG4gICAgdmFyIG1hc2sgPSAoMSA8PCBjaHJzeikgLSAxO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyLmxlbmd0aCAqIGNocnN6OyBpICs9IGNocnN6KSB7XG4gICAgICAgIGJpbltpID4+IDVdIHw9IChzdHIuY2hhckNvZGVBdChpIC8gY2hyc3opICYgbWFzaykgPDwgKGkgJSAzMik7XG4gICAgfVxuICAgIHJldHVybiBiaW47XG59XG5cbmZ1bmN0aW9uIGJpbmwyaGV4KGJpbmFycmF5KSB7XG4gICAgdmFyIGhleF90YWIgPSBoZXhjYXNlID8gXCIwMTIzNDU2Nzg5QUJDREVGXCIgOiBcIjAxMjM0NTY3ODlhYmNkZWZcIjtcbiAgICB2YXIgc3RyID0gXCJcIjtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGJpbmFycmF5Lmxlbmd0aCAqIDQ7IGkrKykge1xuICAgICAgICBzdHIgKz0gaGV4X3RhYi5jaGFyQXQoKGJpbmFycmF5W2kgPj4gMl0gPj4gKChpICUgNCkgKiA4ICsgNCkpICYgMHhGKSArIGhleF90YWIuY2hhckF0KChiaW5hcnJheVtpID4+IDJdID4+ICgoaSAlIDQpICogOCkpICYgMHhGKTtcbiAgICB9XG4gICAgcmV0dXJuIHN0cjtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGhleF9tZDU6IGhleF9tZDVcbn07IiwiLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgICdzdW1tYXJ5X3dpZGdldF9fcmVhY3Rpb25zJzogJ1JlYWN0aW9ucycsXG4gICAgJ3N1bW1hcnlfd2lkZ2V0X19yZWFjdGlvbnNfb25lJzogJzEgUmVhY3Rpb24nLFxuICAgICdzdW1tYXJ5X3dpZGdldF9fcmVhY3Rpb25zX21hbnknOiAnezB9IFJlYWN0aW9ucycsXG5cbiAgICAncmVhY3Rpb25zX3dpZGdldF9fdGl0bGUnOiAnUmVhY3Rpb25zJyxcbiAgICAncmVhY3Rpb25zX3dpZGdldF9fdGl0bGVfdGhpbmsnOiAnV2hhdCBkbyB5b3UgdGhpbms/JyxcbiAgICAncmVhY3Rpb25zX3dpZGdldF9fdGl0bGVfdGhhbmtzJzogJ1RoYW5rcyBmb3IgeW91ciByZWFjdGlvbiEnLFxuICAgICdyZWFjdGlvbnNfd2lkZ2V0X190aXRsZV9zaWduaW4nOiAnU2lnbiBpbiBSZXF1aXJlZCcsXG4gICAgJ3JlYWN0aW9uc193aWRnZXRfX3RpdGxlX2Jsb2NrZWQnOiAnQmxvY2tlZCBSZWFjdGlvbicsXG4gICAgJ3JlYWN0aW9uc193aWRnZXRfX3RpdGxlX2Vycm9yJzogJ0Vycm9yJyxcbiAgICAncmVhY3Rpb25zX3dpZGdldF9fYmFjayc6ICdCYWNrJyxcblxuICAgICdyZWFjdGlvbnNfcGFnZV9fbm9fcmVhY3Rpb25zJzogJ05vIHJlYWN0aW9ucyB5ZXQhJyxcbiAgICAncmVhY3Rpb25zX3BhZ2VfX3RoaW5rJzogJ1doYXQgZG8geW91IHRoaW5rPycsXG5cbiAgICAnbWVkaWFfaW5kaWNhdG9yX190aGluayc6ICdXaGF0IGRvIHlvdSB0aGluaz8nLFxuXG4gICAgJ3BvcHVwX3dpZGdldF9fdGhpbmsnOiAnV2hhdCBkbyB5b3UgdGhpbms/JyxcblxuICAgICdkZWZhdWx0c19wYWdlX19hZGQnOiAnKyBBZGQgWW91ciBPd24nLFxuICAgICdkZWZhdWx0c19wYWdlX19vayc6ICdvaycsXG5cbiAgICAnY29uZmlybWF0aW9uX3BhZ2VfX3NoYXJlJzogJ1NoYXJlIHlvdXIgcmVhY3Rpb246JyxcblxuICAgICdjb21tZW50c19wYWdlX19oZWFkZXInOiAnKHswfSkgQ29tbWVudHM6JyxcblxuICAgICdjb21tZW50X2FyZWFfX2FkZCc6ICdDb21tZW50JyxcbiAgICAnY29tbWVudF9hcmVhX19wbGFjZWhvbGRlcic6ICdBZGQgY29tbWVudHMgb3IgI2hhc2h0YWdzJyxcbiAgICAnY29tbWVudF9hcmVhX190aGFua3MnOiAnVGhhbmtzIGZvciB5b3VyIGNvbW1lbnQuJyxcbiAgICAnY29tbWVudF9hcmVhX19jb3VudCc6ICc8c3BhbiBjbGFzcz1cImFudGVubmEtY29tbWVudC1jb3VudFwiPjwvc3Bhbj4gY2hhcmFjdGVycyBsZWZ0JyxcblxuICAgICdsb2NhdGlvbnNfcGFnZV9fcGFnZWxldmVsJzogJ1RvIHRoaXMgd2hvbGUgcGFnZScsXG4gICAgJ2xvY2F0aW9uc19wYWdlX19jb3VudF9vbmUnOiAnPHNwYW4gY2xhc3M9XCJhbnRlbm5hLWxvY2F0aW9uLWNvdW50XCI+MTwvc3Bhbj48YnI+cmVhY3Rpb24nLFxuICAgICdsb2NhdGlvbnNfcGFnZV9fY291bnRfbWFueSc6ICc8c3BhbiBjbGFzcz1cImFudGVubmEtbG9jYXRpb24tY291bnRcIj57MH08L3NwYW4+PGJyPnJlYWN0aW9ucycsXG4gICAgJ2xvY2F0aW9uc19wYWdlX192aWRlbyc6ICdWaWRlbycsXG5cbiAgICAnY2FsbF90b19hY3Rpb25fbGFiZWxfX3Jlc3BvbnNlcyc6ICdSZWFjdGlvbnMnLFxuICAgICdjYWxsX3RvX2FjdGlvbl9sYWJlbF9fcmVzcG9uc2VzX29uZSc6ICcxIFJlYWN0aW9uJyxcbiAgICAnY2FsbF90b19hY3Rpb25fbGFiZWxfX3Jlc3BvbnNlc19tYW55JzogJ3swfSBSZWFjdGlvbnMnLFxuXG4gICAgJ2Jsb2NrZWRfcGFnZV9fbWVzc2FnZTEnOiAnVGhpcyBzaXRlIGhhcyBibG9ja2VkIHNvbWUgb3IgYWxsIG9mIHRoZSB0ZXh0IGluIHRoYXQgcmVhY3Rpb24uJyxcbiAgICAnYmxvY2tlZF9wYWdlX19tZXNzYWdlMic6ICdQbGVhc2UgdHJ5IHNvbWV0aGluZyB0aGF0IHdpbGwgYmUgbW9yZSBhcHByb3ByaWF0ZSBmb3IgdGhpcyBjb21tdW5pdHkuJyxcblxuICAgICdwZW5kaW5nX3BhZ2VfX21lc3NhZ2VfYXBwZWFyJzogJ1lvdXIgcmVhY3Rpb24gd2lsbCBhcHBlYXIgb25jZSBpdCBpcyByZXZpZXdlZC4gQWxsIG5ldyByZWFjdGlvbnMgbXVzdCBtZWV0IG91ciBjb21tdW5pdHkgZ3VpZGVsaW5lcy4nLFxuXG4gICAgJ2Vycm9yX3BhZ2VfX21lc3NhZ2UnOiAnT29wcyEgV2UgcmVhbGx5IHZhbHVlIHlvdXIgZmVlZGJhY2ssIGJ1dCBzb21ldGhpbmcgd2VudCB3cm9uZy4nLFxuXG4gICAgJ3RhcF9oZWxwZXJfX3Byb21wdCc6ICdUYXAgYW55IHBhcmFncmFwaCB0byByZXNwb25kIScsXG4gICAgJ3RhcF9oZWxwZXJfX2Nsb3NlJzogJ0Nsb3NlJyxcblxuICAgICdjb250ZW50X3JlY193aWRnZXRfX3RpdGxlJzogJ1JlYWRlciBSZWFjdGlvbnMnXG59OyIsIi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAnc3VtbWFyeV93aWRnZXRfX3JlYWN0aW9ucyc6ICdSZWFjY2lvbmVzJyxcbiAgICAnc3VtbWFyeV93aWRnZXRfX3JlYWN0aW9uc19vbmUnOiAnMSBSZWFjY2nDs24nLFxuICAgICdzdW1tYXJ5X3dpZGdldF9fcmVhY3Rpb25zX21hbnknOiAnezB9IFJlYWNjaW9uZXMnLFxuXG4gICAgJ3JlYWN0aW9uc193aWRnZXRfX3RpdGxlJzogJ1JlYWNjaW9uZXMnLFxuICAgICdyZWFjdGlvbnNfd2lkZ2V0X190aXRsZV90aGluayc6ICfCv1F1w6kgcGllbnNhcz8nLFxuICAgICdyZWFjdGlvbnNfd2lkZ2V0X190aXRsZV90aGFua3MnOiAnwqFHcmFjaWFzIHBvciB0dSByZWFjY2nDs24hJyxcbiAgICAncmVhY3Rpb25zX3dpZGdldF9fdGl0bGVfc2lnbmluJzogJ0VzIG5lY2VzYXJpbyBpbmljaWFyIHNlc2nDs24nLCAvLyBUT0RPOiBjaGVjayB0cmFuc2xhdGlvblxuICAgICdyZWFjdGlvbnNfd2lkZ2V0X190aXRsZV9ibG9ja2VkJzogJ1JlYWNjacOzbiBibG9xdWVhZG8nLCAvLyBUT0RPOiBjaGVjayB0cmFuc2xhdGlvblxuICAgICdyZWFjdGlvbnNfd2lkZ2V0X190aXRsZV9lcnJvcic6ICdFcnJvcicsIC8vIFRPRE86IGNoZWNrIHRyYW5zbGF0aW9uXG4gICAgJ3JlYWN0aW9uc193aWRnZXRfX2JhY2snOiAnVm9sdmVyJyxcbiAgICAncmVhY3Rpb25zX3BhZ2VfX25vX3JlYWN0aW9ucyc6ICfCoU5vIHJlYWNjaW9uZXMgeWEhJywgLy8gVE9ETzogY2hlY2sgdHJhbnNsYXRpb24gXG4gICAgJ3JlYWN0aW9uc19wYWdlX190aGluayc6ICfCv1F1w6kgcGllbnNhcz8nLFxuXG4gICAgJ21lZGlhX2luZGljYXRvcl9fdGhpbmsnOiAnwr9RdcOpIHBpZW5zYXM/JyxcblxuICAgICdwb3B1cF93aWRnZXRfX3RoaW5rJzogJ8K/UXXDqSBwaWVuc2FzPycsXG5cbiAgICAnZGVmYXVsdHNfcGFnZV9fYWRkJzogJysgQcOxYWRlIGxvIHR1eW8nLFxuICAgICdkZWZhdWx0c19wYWdlX19vayc6ICdvaycsXG5cbiAgICAnY29uZmlybWF0aW9uX3BhZ2VfX3NoYXJlJzogJ0NvbXBhcnRlIHR1IHJlYWNjacOzbjonLFxuXG4gICAgJ2NvbW1lbnRzX3BhZ2VfX2hlYWRlcic6ICcoezB9KSBDb21lbnRhczonLFxuXG4gICAgJ2NvbW1lbnRfYXJlYV9fYWRkJzogJ0NvbWVudGEnLFxuICAgICdjb21tZW50X2FyZWFfX3BsYWNlaG9sZGVyJzogJ0HDsWFkZSBjb21lbnRhcmlvcyBvICNoYXNodGFncycsXG4gICAgJ2NvbW1lbnRfYXJlYV9fdGhhbmtzJzogJ0dyYWNpYXMgcG9yIHR1IHJlYWNjacOzbi4nLFxuICAgICdjb21tZW50X2FyZWFfX2NvdW50JzogJ1F1ZWRhbiA8c3BhbiBjbGFzcz1cImFudGVubmEtY29tbWVudC1jb3VudFwiPjwvc3Bhbj4gY2FyYWN0ZXJlcycsXG5cbiAgICAnbG9jYXRpb25zX3BhZ2VfX3BhZ2VsZXZlbCc6ICdBIGVzdGEgcMOhZ2luYScsIC8vIFRPRE86IG5lZWQgYSB0cmFuc2xhdGlvbiBvZiBcIlRvIHRoaXMgd2hvbGUgcGFnZVwiXG4gICAgJ2xvY2F0aW9uc19wYWdlX19jb3VudF9vbmUnOiAnPHNwYW4gY2xhc3M9XCJhbnRlbm5hLWxvY2F0aW9uLWNvdW50XCI+MTwvc3Bhbj48YnI+cmVhY2Npw7NuJyxcbiAgICAnbG9jYXRpb25zX3BhZ2VfX2NvdW50X21hbnknOiAnPHNwYW4gY2xhc3M9XCJhbnRlbm5hLWxvY2F0aW9uLWNvdW50XCI+ezB9PC9zcGFuPjxicj5yZWFjY2lvbmVzJyxcbiAgICAnbG9jYXRpb25zX3BhZ2VfX3ZpZGVvJzogJ1ZpZGVvJyxcblxuICAgICdjYWxsX3RvX2FjdGlvbl9sYWJlbF9fcmVzcG9uc2VzJzogJ1JlYWNjaW9uZXMnLFxuICAgICdjYWxsX3RvX2FjdGlvbl9sYWJlbF9fcmVzcG9uc2VzX29uZSc6ICcxIFJlYWNjacOzbicsXG4gICAgJ2NhbGxfdG9fYWN0aW9uX2xhYmVsX19yZXNwb25zZXNfbWFueSc6ICd7MH0gUmVhY2Npb25lcycsXG5cbiAgICAnYmxvY2tlZF9wYWdlX19tZXNzYWdlMSc6ICdFc3RlIHNpdGlvIHdlYiBoYSBibG9xdWVhZG8gZXNhIHJlYWNjacOzbi4nLCAvLyBUT0RPOiBjaGVjayB0cmFuc2xhdGlvblxuICAgICdibG9ja2VkX3BhZ2VfX21lc3NhZ2UyJzogJ1BvciBmYXZvciwgaW50ZW50ZSBhbGdvIHF1ZSBzZXLDoSBtw6FzIGFwcm9waWFkbyBwYXJhIGVzdGEgY29tdW5pZGFkLicsIC8vIFRPRE86IGNoZWNrIHRyYW5zbGF0aW9uXG4gICAgJ3BlbmRpbmdfcGFnZV9fbWVzc2FnZV9hcHBlYXInOiAnQXBhcmVjZXLDoSBzdSByZWFjY2nDs24gdW5hIHZleiBxdWUgc2UgcmV2aXNhLiBUb2RhcyBsYXMgbnVldmFzIHJlYWNjaW9uZXMgZGViZW4gY3VtcGxpciBjb24gbm9ybWFzIGRlIGxhIGNvbXVuaWRhZC4nLCAvLyBUT0RPOiBjaGVjayB0cmFuc2xhdGlvblxuICAgICdlcnJvcl9wYWdlX19tZXNzYWdlJzogJ8KhTG8gc2llbnRvISBWYWxvcmFtb3Mgc3VzIGNvbWVudGFyaW9zLCBwZXJvIGFsZ28gc2FsacOzIG1hbC4nLCAvLyBUT0RPOiBjaGVjayB0cmFuc2xhdGlvblxuICAgICd0YXBfaGVscGVyX19wcm9tcHQnOiAnwqFUb2NhIHVuIHDDoXJyYWZvIHBhcmEgb3BpbmFyIScsXG4gICAgJ3RhcF9oZWxwZXJfX2Nsb3NlJzogJ1ZvbHZlcicsXG4gICAgJ2NvbnRlbnRfcmVjX3dpZGdldF9fdGl0bGUnOiAnUmVhY2Npb25lcyBkZSBsYSBnZW50ZScgLy8gVE9ETzogY2hlY2sgdHJhbnNsYXRpb25cbn07IiwidmFyIEdyb3VwU2V0dGluZ3MgPSByZXF1aXJlKCcuLi9ncm91cC1zZXR0aW5ncycpO1xuXG52YXIgRW5nbGlzaE1lc3NhZ2VzID0gcmVxdWlyZSgnLi9tZXNzYWdlcy1lbicpO1xudmFyIFNwYW5pc2hNZXNzYWdlcyA9IHJlcXVpcmUoJy4vbWVzc2FnZXMtZXMnKTtcbnZhbGlkYXRlVHJhbnNsYXRpb25zKCk7XG5cbmZ1bmN0aW9uIHZhbGlkYXRlVHJhbnNsYXRpb25zKCkge1xuICAgIGZvciAodmFyIGVuZ2xpc2hLZXkgaW4gRW5nbGlzaE1lc3NhZ2VzKSB7XG4gICAgICAgIGlmIChFbmdsaXNoTWVzc2FnZXMuaGFzT3duUHJvcGVydHkoZW5nbGlzaEtleSkpIHtcbiAgICAgICAgICAgIGlmICghU3BhbmlzaE1lc3NhZ2VzLmhhc093blByb3BlcnR5KGVuZ2xpc2hLZXkpKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnQW50ZW5uYSB3YXJuaW5nOiBTcGFuaXNoIHRyYW5zbGF0aW9uIG1pc3NpbmcgZm9yIGtleSAnICsgZW5nbGlzaEtleSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGdldE1lc3NhZ2Uoa2V5LCB2YWx1ZXMpIHtcbiAgICB2YXIgc3RyaW5nID0gZ2V0TG9jYWxpemVkU3RyaW5nKGtleSwgR3JvdXBTZXR0aW5ncy5nZXQoKS5sYW5ndWFnZSgpKTtcbiAgICBpZiAodmFsdWVzKSB7XG4gICAgICAgIHJldHVybiBmb3JtYXQoc3RyaW5nLCB2YWx1ZXMpO1xuICAgIH1cbiAgICByZXR1cm4gc3RyaW5nO1xufVxuXG5mdW5jdGlvbiBnZXRMb2NhbGl6ZWRTdHJpbmcoa2V5LCBsYW5nKSB7XG4gICAgdmFyIHN0cmluZztcbiAgICBzd2l0Y2gobGFuZykge1xuICAgICAgICBjYXNlICdlbic6XG4gICAgICAgICAgICBzdHJpbmcgPSBFbmdsaXNoTWVzc2FnZXNba2V5XTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdlcyc6XG4gICAgICAgICAgICBzdHJpbmcgPSBTcGFuaXNoTWVzc2FnZXNba2V5XTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgLy8gVE9ETzogcmV2aWV3XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnSW52YWxpZCBsYW5ndWFnZSBzcGVjaWZpZWQgaW4gQW50ZW5uYSBncm91cCBzZXR0aW5ncy4nKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBpZiAoIXN0cmluZykgeyAvLyBEZWZhdWx0IHRvIEVuZ2xpc2hcbiAgICAgICAgc3RyaW5nID0gRW5nbGlzaE1lc3NhZ2VzW2tleV07XG4gICAgfVxuICAgIC8vIFRPRE86IGhhbmRsZSBtaXNzaW5nIGtleVxuICAgIHJldHVybiBzdHJpbmc7XG59XG5cbmZ1bmN0aW9uIGZvcm1hdChzdHJpbmcsIHZhbHVlcykge1xuICAgIC8vIFBvcHVsYXIsIHNpbXBsZSBhbGdvcml0aG0gZnJvbSBodHRwOi8vamF2YXNjcmlwdC5jcm9ja2ZvcmQuY29tL3JlbWVkaWFsLmh0bWxcbiAgICByZXR1cm4gc3RyaW5nLnJlcGxhY2UoXG4gICAgICAgIC9cXHsoW157fV0qKVxcfS9nLFxuICAgICAgICBmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICAgICAgdmFyIHIgPSB2YWx1ZXNbYl07XG4gICAgICAgICAgICByZXR1cm4gdHlwZW9mIHIgPT09ICdzdHJpbmcnIHx8IHR5cGVvZiByID09PSAnbnVtYmVyJyA/IHIgOiBhO1xuICAgICAgICB9XG4gICAgKTtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGdldE1lc3NhZ2U6IGdldE1lc3NhZ2Vcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG5cbmZ1bmN0aW9uIG1ha2VNb3ZlYWJsZSgkZWxlbWVudCwgJGRyYWdIYW5kbGUpIHtcbiAgICAkZHJhZ0hhbmRsZS5vbignbW91c2Vkb3duLmFudGVubmEnLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICB2YXIgb2Zmc2V0WCA9IGV2ZW50LnBhZ2VYIC0gJGRyYWdIYW5kbGUub2Zmc2V0KCkubGVmdDtcbiAgICAgICAgdmFyIG9mZnNldFkgPSBldmVudC5wYWdlWSAtICRkcmFnSGFuZGxlLm9mZnNldCgpLnRvcDtcbiAgICAgICAgJChkb2N1bWVudCkub24oJ21vdXNldXAuYW50ZW5uYScsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICAkKGRvY3VtZW50KS5vZmYoJ21vdXNlbW92ZS5hbnRlbm5hJyk7XG4gICAgICAgIH0pO1xuICAgICAgICAkKGRvY3VtZW50KS5vbignbW91c2Vtb3ZlLmFudGVubmEnLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgJGVsZW1lbnQuY3NzKHtcbiAgICAgICAgICAgICAgICB0b3A6IGV2ZW50LnBhZ2VZIC0gb2Zmc2V0WSxcbiAgICAgICAgICAgICAgICBsZWZ0OiBldmVudC5wYWdlWCAtIG9mZnNldFhcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgbWFrZU1vdmVhYmxlOiBtYWtlTW92ZWFibGVcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgQ2FsbGJhY2tTdXBwb3J0ID0gcmVxdWlyZSgnLi9jYWxsYmFjay1zdXBwb3J0Jyk7XG52YXIgUmFuZ2UgPSByZXF1aXJlKCcuL3JhbmdlJyk7XG52YXIgV2lkZ2V0QnVja2V0ID0gcmVxdWlyZSgnLi93aWRnZXQtYnVja2V0Jyk7XG5cbi8vIFRPRE86IGRldGVjdCB3aGV0aGVyIHRoZSBicm93c2VyIHN1cHBvcnRzIE11dGF0aW9uT2JzZXJ2ZXIgYW5kIGZhbGxiYWNrIHRvIE11dGF0aW9ucyBFdmVudHNcblxudmFyIGFkZGl0aW9uTGlzdGVuZXI7XG52YXIgcmVtb3ZhbExpc3RlbmVyO1xuXG52YXIgYXR0cmlidXRlT2JzZXJ2ZXJzID0gW107XG5cbmZ1bmN0aW9uIGFkZEFkZGl0aW9uTGlzdGVuZXIoY2FsbGJhY2spIHtcbiAgICBpZiAoIWFkZGl0aW9uTGlzdGVuZXIpIHtcbiAgICAgICAgYWRkaXRpb25MaXN0ZW5lciA9IGNyZWF0ZUFkZGl0aW9uTGlzdGVuZXIoKTtcbiAgICB9XG4gICAgYWRkaXRpb25MaXN0ZW5lci5hZGRDYWxsYmFjayhjYWxsYmFjayk7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUFkZGl0aW9uTGlzdGVuZXIoKSB7XG4gICAgdmFyIGNhbGxiYWNrU3VwcG9ydCA9IENhbGxiYWNrU3VwcG9ydC5jcmVhdGUoKTtcbiAgICB2YXIgb2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcihmdW5jdGlvbihtdXRhdGlvblJlY29yZHMpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtdXRhdGlvblJlY29yZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBhZGRlZEVsZW1lbnRzID0gZmlsdGVyZWRFbGVtZW50cyhtdXRhdGlvblJlY29yZHNbaV0uYWRkZWROb2Rlcyk7XG4gICAgICAgICAgICBpZiAoYWRkZWRFbGVtZW50cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNhbGxiYWNrcyA9IGNhbGxiYWNrU3VwcG9ydC5nZXQoKTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGNhbGxiYWNrcy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFja3Nbal0oYWRkZWRFbGVtZW50cyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG4gICAgdmFyIGJvZHkgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnYm9keScpWzBdO1xuICAgIG9ic2VydmVyLm9ic2VydmUoYm9keSwge1xuICAgICAgICBjaGlsZExpc3Q6IHRydWUsXG4gICAgICAgIGF0dHJpYnV0ZXM6IGZhbHNlLFxuICAgICAgICBjaGFyYWN0ZXJEYXRhOiBmYWxzZSxcbiAgICAgICAgc3VidHJlZTogdHJ1ZSxcbiAgICAgICAgYXR0cmlidXRlT2xkVmFsdWU6IGZhbHNlLFxuICAgICAgICBjaGFyYWN0ZXJEYXRhT2xkVmFsdWU6IGZhbHNlXG4gICAgfSk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdGVhcmRvd246IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY2FsbGJhY2tTdXBwb3J0LnRlYXJkb3duKCk7XG4gICAgICAgICAgICBvYnNlcnZlci5kaXNjb25uZWN0KCk7XG4gICAgICAgIH0sXG4gICAgICAgIGFkZENhbGxiYWNrOiBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICAgICAgY2FsbGJhY2tTdXBwb3J0LmFkZChjYWxsYmFjayk7XG4gICAgICAgIH0sXG4gICAgICAgIHJlbW92ZUNhbGxiYWNrOiBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICAgICAgY2FsbGJhY2tTdXBwb3J0LnJlbW92ZShjYWxsYmFjayk7XG4gICAgICAgIH1cbiAgICB9O1xufVxuXG5mdW5jdGlvbiBhZGRSZW1vdmFsTGlzdGVuZXIoY2FsbGJhY2spIHtcbiAgICBpZiAoIXJlbW92YWxMaXN0ZW5lcikge1xuICAgICAgICByZW1vdmFsTGlzdGVuZXIgPSBjcmVhdGVSZW1vdmFsTGlzdGVuZXIoKTtcbiAgICB9XG4gICAgcmVtb3ZhbExpc3RlbmVyLmFkZENhbGxiYWNrKGNhbGxiYWNrKTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlUmVtb3ZhbExpc3RlbmVyKCkge1xuICAgIHZhciBjYWxsYmFja1N1cHBvcnQgPSBDYWxsYmFja1N1cHBvcnQuY3JlYXRlKCk7XG4gICAgdmFyIG9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoZnVuY3Rpb24obXV0YXRpb25SZWNvcmRzKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbXV0YXRpb25SZWNvcmRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgcmVtb3ZlZEVsZW1lbnRzID0gZmlsdGVyZWRFbGVtZW50cyhtdXRhdGlvblJlY29yZHNbaV0ucmVtb3ZlZE5vZGVzKTtcbiAgICAgICAgICAgIGlmIChyZW1vdmVkRWxlbWVudHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHZhciBjYWxsYmFja3MgPSBjYWxsYmFja1N1cHBvcnQuZ2V0KCk7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBjYWxsYmFja3MubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2tzW2pdKHJlbW92ZWRFbGVtZW50cyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG4gICAgdmFyIGJvZHkgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnYm9keScpWzBdO1xuICAgIG9ic2VydmVyLm9ic2VydmUoYm9keSwge1xuICAgICAgICBjaGlsZExpc3Q6IHRydWUsXG4gICAgICAgIGF0dHJpYnV0ZXM6IGZhbHNlLFxuICAgICAgICBjaGFyYWN0ZXJEYXRhOiBmYWxzZSxcbiAgICAgICAgc3VidHJlZTogdHJ1ZSxcbiAgICAgICAgYXR0cmlidXRlT2xkVmFsdWU6IGZhbHNlLFxuICAgICAgICBjaGFyYWN0ZXJEYXRhT2xkVmFsdWU6IGZhbHNlXG4gICAgfSk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdGVhcmRvd246IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY2FsbGJhY2tTdXBwb3J0LnRlYXJkb3duKCk7XG4gICAgICAgICAgICBvYnNlcnZlci5kaXNjb25uZWN0KCk7XG4gICAgICAgIH0sXG4gICAgICAgIGFkZENhbGxiYWNrOiBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICAgICAgY2FsbGJhY2tTdXBwb3J0LmFkZChjYWxsYmFjayk7XG4gICAgICAgIH0sXG4gICAgICAgIHJlbW92ZUNhbGxiYWNrOiBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICAgICAgY2FsbGJhY2tTdXBwb3J0LnJlbW92ZShjYWxsYmFjayk7XG4gICAgICAgIH1cbiAgICB9O1xufVxuXG4vLyBGaWx0ZXIgdGhlIHNldCBvZiBub2RlcyB0byBlbGltaW5hdGUgYW55dGhpbmcgaW5zaWRlIG91ciBvd24gRE9NIGVsZW1lbnRzIChvdGhlcndpc2UsIHdlIGdlbmVyYXRlIGEgdG9uIG9mIGNoYXR0ZXIpXG5mdW5jdGlvbiBmaWx0ZXJlZEVsZW1lbnRzKG5vZGVMaXN0KSB7XG4gICAgdmFyIGZpbHRlcmVkID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBub2RlTGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgbm9kZSA9IG5vZGVMaXN0W2ldO1xuICAgICAgICBpZiAobm9kZS5ub2RlVHlwZSA9PT0gMSkgeyAvLyBPbmx5IGVsZW1lbnQgbm9kZXMuIChodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvTm9kZS9ub2RlVHlwZSlcbiAgICAgICAgICAgIHZhciAkZWxlbWVudCA9ICQobm9kZSk7XG4gICAgICAgICAgICBpZiAoJGVsZW1lbnQuY2xvc2VzdChSYW5nZS5ISUdITElHSFRfU0VMRUNUT1IgKyAnLCAuYW50ZW5uYSwgJyArIFdpZGdldEJ1Y2tldC5zZWxlY3RvcigpKS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICBmaWx0ZXJlZC5wdXNoKCRlbGVtZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmlsdGVyZWQ7XG59XG5cbmZ1bmN0aW9uIGFkZE9uZVRpbWVBdHRyaWJ1dGVMaXN0ZW5lcihub2RlLCBhdHRyaWJ1dGVzLCBjYWxsYmFjaykge1xuICAgIHZhciBvYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKGZ1bmN0aW9uKG11dGF0aW9uUmVjb3Jkcykge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG11dGF0aW9uUmVjb3Jkcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIHRhcmdldCA9IG11dGF0aW9uUmVjb3Jkc1tpXS50YXJnZXQ7XG4gICAgICAgICAgICBjYWxsYmFjayh0YXJnZXQpO1xuICAgICAgICAgICAgb2JzZXJ2ZXIuZGlzY29ubmVjdCgpO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgb2JzZXJ2ZXIub2JzZXJ2ZShub2RlLCB7XG4gICAgICAgIGNoaWxkTGlzdDogZmFsc2UsXG4gICAgICAgIGF0dHJpYnV0ZXM6IHRydWUsXG4gICAgICAgIGNoYXJhY3RlckRhdGE6IGZhbHNlLFxuICAgICAgICBzdWJ0cmVlOiBmYWxzZSxcbiAgICAgICAgYXR0cmlidXRlT2xkVmFsdWU6IGZhbHNlLFxuICAgICAgICBjaGFyYWN0ZXJEYXRhT2xkVmFsdWU6IGZhbHNlLFxuICAgICAgICBhdHRyaWJ1dGVGaWx0ZXI6IGF0dHJpYnV0ZXNcbiAgICB9KTtcbiAgICBhdHRyaWJ1dGVPYnNlcnZlcnMucHVzaChvYnNlcnZlcik7XG59XG5cbmZ1bmN0aW9uIHRlYXJkb3duKCkge1xuICAgIGlmIChhZGRpdGlvbkxpc3RlbmVyKSB7XG4gICAgICAgIGFkZGl0aW9uTGlzdGVuZXIudGVhcmRvd24oKTtcbiAgICAgICAgYWRkaXRpb25MaXN0ZW5lciA9IHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBpZiAocmVtb3ZhbExpc3RlbmVyKSB7XG4gICAgICAgIHJlbW92YWxMaXN0ZW5lci50ZWFyZG93bigpO1xuICAgICAgICByZW1vdmFsTGlzdGVuZXIgPSB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhdHRyaWJ1dGVPYnNlcnZlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgYXR0cmlidXRlT2JzZXJ2ZXJzW2ldLmRpc2Nvbm5lY3QoKTtcbiAgICB9XG4gICAgYXR0cmlidXRlT2JzZXJ2ZXJzID0gW107XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBhZGRBZGRpdGlvbkxpc3RlbmVyOiBhZGRBZGRpdGlvbkxpc3RlbmVyLFxuICAgIGFkZFJlbW92YWxMaXN0ZW5lcjogYWRkUmVtb3ZhbExpc3RlbmVyLFxuICAgIGFkZE9uZVRpbWVBdHRyaWJ1dGVMaXN0ZW5lcjogYWRkT25lVGltZUF0dHJpYnV0ZUxpc3RlbmVyLFxuICAgIHRlYXJkb3duOiB0ZWFyZG93blxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcblxuZnVuY3Rpb24gY29tcHV0ZVBhZ2VUaXRsZSgkcGFnZSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciB0aXRsZVNlbGVjdG9yID0gZ3JvdXBTZXR0aW5ncy5wYWdlVGl0bGVTZWxlY3RvcigpO1xuICAgIGlmICghdGl0bGVTZWxlY3Rvcikge1xuICAgICAgICAvLyBCYWNrd2FyZHMgY29tcGF0aWJpbGl0eSBmb3Igc2l0ZXMgd2hpY2ggZGVwbG95ZWQgYmVmb3JlIHdlIGhhZCBhIHNlcGFyYXRlIHRpdGxlIHNlbGVjdG9yLlxuICAgICAgICB0aXRsZVNlbGVjdG9yID0gZ3JvdXBTZXR0aW5ncy5wYWdlVXJsU2VsZWN0b3IoKTtcbiAgICB9XG4gICAgdmFyIHBhZ2VUaXRsZSA9ICRwYWdlLmZpbmQodGl0bGVTZWxlY3RvcikudGV4dCgpLnRyaW0oKTtcbiAgICBpZiAocGFnZVRpdGxlID09PSAnJykge1xuICAgICAgICAvLyBJZiB3ZSBjb3VsZG4ndCBmaW5kIGEgdGl0bGUgYmFzZWQgb24gdGhlIGdyb3VwIHNldHRpbmdzLCBmYWxsYmFjayB0byBzb21lIGhhcmQtY29kZWQgYmVoYXZpb3IuXG4gICAgICAgIHBhZ2VUaXRsZSA9IGdldEF0dHJpYnV0ZVZhbHVlKCdtZXRhW3Byb3BlcnR5PVwib2c6dGl0bGVcIl0nLCAnY29udGVudCcpIHx8ICQoJ3RpdGxlJykudGV4dCgpLnRyaW0oKTtcbiAgICB9XG4gICAgcmV0dXJuIHBhZ2VUaXRsZTtcbn1cblxuZnVuY3Rpb24gY29tcHV0ZVRvcExldmVsUGFnZUltYWdlKGdyb3VwU2V0dGluZ3MpIHtcbiAgICByZXR1cm4gZ2V0QXR0cmlidXRlVmFsdWUoZ3JvdXBTZXR0aW5ncy5wYWdlSW1hZ2VTZWxlY3RvcigpLCBncm91cFNldHRpbmdzLnBhZ2VJbWFnZUF0dHJpYnV0ZSgpKTtcbn1cblxuZnVuY3Rpb24gY29tcHV0ZVBhZ2VBdXRob3IoZ3JvdXBTZXR0aW5ncykge1xuICAgIHJldHVybiBnZXRBdHRyaWJ1dGVWYWx1ZShncm91cFNldHRpbmdzLnBhZ2VBdXRob3JTZWxlY3RvcigpLCBncm91cFNldHRpbmdzLnBhZ2VBdXRob3JBdHRyaWJ1dGUoKSk7XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVQYWdlVG9waWNzKGdyb3VwU2V0dGluZ3MpIHtcbiAgICByZXR1cm4gZ2V0QXR0cmlidXRlVmFsdWUoZ3JvdXBTZXR0aW5ncy5wYWdlVG9waWNzU2VsZWN0b3IoKSwgZ3JvdXBTZXR0aW5ncy5wYWdlVG9waWNzQXR0cmlidXRlKCkpO1xufVxuXG5mdW5jdGlvbiBjb21wdXRlUGFnZVNpdGVTZWN0aW9uKGdyb3VwU2V0dGluZ3MpIHtcbiAgICByZXR1cm4gZ2V0QXR0cmlidXRlVmFsdWUoZ3JvdXBTZXR0aW5ncy5wYWdlU2l0ZVNlY3Rpb25TZWxlY3RvcigpLCBncm91cFNldHRpbmdzLnBhZ2VTaXRlU2VjdGlvbkF0dHJpYnV0ZSgpKTtcbn1cblxuZnVuY3Rpb24gZ2V0QXR0cmlidXRlVmFsdWUoZWxlbWVudFNlbGVjdG9yLCBhdHRyaWJ1dGVTZWxlY3Rvcikge1xuICAgIHZhciB2YWx1ZSA9ICcnO1xuICAgIGlmIChlbGVtZW50U2VsZWN0b3IgJiYgYXR0cmlidXRlU2VsZWN0b3IpIHtcbiAgICAgICAgdmFsdWUgPSAkKGVsZW1lbnRTZWxlY3RvcikuYXR0cihhdHRyaWJ1dGVTZWxlY3RvcikgfHwgJyc7XG4gICAgfVxuICAgIHJldHVybiB2YWx1ZS50cmltKCk7XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVUb3BMZXZlbENhbm9uaWNhbFVybChncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGNhbm9uaWNhbFVybCA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmLnNwbGl0KCcjJylbMF0udG9Mb3dlckNhc2UoKTtcbiAgICB2YXIgJGNhbm9uaWNhbExpbmsgPSAkKCdsaW5rW3JlbD1cImNhbm9uaWNhbFwiXScpO1xuICAgIGlmICgkY2Fub25pY2FsTGluay5sZW5ndGggPiAwICYmICRjYW5vbmljYWxMaW5rLmF0dHIoJ2hyZWYnKSkge1xuICAgICAgICB2YXIgb3ZlcnJpZGVVcmwgPSAkY2Fub25pY2FsTGluay5hdHRyKCdocmVmJykudHJpbSgpLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIHZhciBkb21haW4gPSAod2luZG93LmxvY2F0aW9uLnByb3RvY29sKycvLycrd2luZG93LmxvY2F0aW9uLmhvc3RuYW1lKycvJykudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgaWYgKG92ZXJyaWRlVXJsICE9PSBkb21haW4pIHsgLy8gZmFzdGNvIGZpeCAoc2luY2UgdGhleSBzb21ldGltZXMgcmV3cml0ZSB0aGVpciBjYW5vbmljYWwgdG8gc2ltcGx5IGJlIHRoZWlyIGRvbWFpbi4pXG4gICAgICAgICAgICBjYW5vbmljYWxVcmwgPSBvdmVycmlkZVVybDtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVtb3ZlU3ViZG9tYWluRnJvbVBhZ2VVcmwoY2Fub25pY2FsVXJsLCBncm91cFNldHRpbmdzKTtcbn1cblxuZnVuY3Rpb24gY29tcHV0ZVBhZ2VFbGVtZW50VXJsKCRwYWdlRWxlbWVudCwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBwYWdlVXJsU2VsZWN0b3IgPSBncm91cFNldHRpbmdzLnBhZ2VVcmxTZWxlY3RvcigpO1xuICAgIHZhciAkcGFnZVVybEVsZW1lbnQgPSAkcGFnZUVsZW1lbnQuZmluZChwYWdlVXJsU2VsZWN0b3IpO1xuICAgIGlmIChwYWdlVXJsU2VsZWN0b3IpIHsgLy8gd2l0aCBhbiB1bmRlZmluZWQgc2VsZWN0b3IsIGFkZEJhY2sgd2lsbCBtYXRjaCBhbmQgYWx3YXlzIHJldHVybiB0aGUgaW5wdXQgZWxlbWVudCAodW5saWtlIGZpbmQoKSB3aGljaCByZXR1cm5zIGFuIGVtcHR5IG1hdGNoKVxuICAgICAgICAkcGFnZVVybEVsZW1lbnQgPSAkcGFnZVVybEVsZW1lbnQuYWRkQmFjayhwYWdlVXJsU2VsZWN0b3IpO1xuICAgIH1cbiAgICB2YXIgdXJsID0gJHBhZ2VVcmxFbGVtZW50LmF0dHIoZ3JvdXBTZXR0aW5ncy5wYWdlVXJsQXR0cmlidXRlKCkpO1xuICAgIGlmICh1cmwpIHtcbiAgICAgICAgdXJsID0gcmVtb3ZlU3ViZG9tYWluRnJvbVBhZ2VVcmwodXJsLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgdmFyIG9yaWdpbiA9IHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4gfHwgd2luZG93LmxvY2F0aW9uLnByb3RvY29sICsgXCIvL1wiICsgd2luZG93LmxvY2F0aW9uLmhvc3RuYW1lICsgKHdpbmRvdy5sb2NhdGlvbi5wb3J0ID8gJzonICsgd2luZG93LmxvY2F0aW9uLnBvcnQ6ICcnKTtcbiAgICAgICAgaWYgKHVybC5pbmRleE9mKG9yaWdpbikgIT09IDAgJiYgLy8gTm90IGFuIGFic29sdXRlIFVSTFxuICAgICAgICAgICAgICAgICF1cmwuc3Vic3RyKDAsMikgIT09ICcvLycgJiYgLy8gTm90IHByb3RvY29sIHJlbGF0aXZlXG4gICAgICAgICAgICAgICAgIWdyb3VwU2V0dGluZ3MudXJsLmlnbm9yZVN1YmRvbWFpbigpKSB7IC8vIEFuZCB3ZSB3ZXJlbid0IG5vdCBpZ25vcmluZyB0aGUgc3ViZG9tYWluXG4gICAgICAgICAgICBpZiAodXJsLnN1YnN0cigwLDEpID09ICcvJykge1xuICAgICAgICAgICAgICAgIHVybCA9IG9yaWdpbiArIHVybDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdXJsID0gb3JpZ2luICsgd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lICsgdXJsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB1cmw7XG4gICAgfVxuICAgIHJldHVybiBjb21wdXRlVG9wTGV2ZWxDYW5vbmljYWxVcmwoZ3JvdXBTZXR0aW5ncyk7XG59XG5cbi8vIFRPRE8gY29waWVkIGZyb20gZW5nYWdlX2Z1bGwuIFJldmlldy5cbmZ1bmN0aW9uIHJlbW92ZVN1YmRvbWFpbkZyb21QYWdlVXJsKHVybCwgZ3JvdXBTZXR0aW5ncykge1xuICAgIC8vIEFOVC5hY3Rpb25zLnJlbW92ZVN1YmRvbWFpbkZyb21QYWdlVXJsOlxuICAgIC8vIGlmIFwiaWdub3JlX3N1YmRvbWFpblwiIGlzIGNoZWNrZWQgaW4gc2V0dGluZ3MsIEFORCB0aGV5IHN1cHBseSBhIFRMRCxcbiAgICAvLyB0aGVuIG1vZGlmeSB0aGUgcGFnZSBhbmQgY2Fub25pY2FsIFVSTHMgaGVyZS5cbiAgICAvLyBoYXZlIHRvIGhhdmUgdGhlbSBzdXBwbHkgb25lIGJlY2F1c2UgdGhlcmUgYXJlIHRvbyBtYW55IHZhcmlhdGlvbnMgdG8gcmVsaWFibHkgc3RyaXAgc3ViZG9tYWlucyAgKC5jb20sIC5pcywgLmNvbS5hciwgLmNvLnVrLCBldGMpXG4gICAgaWYgKGdyb3VwU2V0dGluZ3MudXJsLmlnbm9yZVN1YmRvbWFpbigpID09IHRydWUgJiYgZ3JvdXBTZXR0aW5ncy51cmwuY2Fub25pY2FsRG9tYWluKCkpIHtcbiAgICAgICAgdmFyIEhPU1RET01BSU4gPSAvWy1cXHddK1xcLig/OlstXFx3XStcXC54bi0tWy1cXHddK3xbLVxcd117Mix9fFstXFx3XStcXC5bLVxcd117Mn0pJC9pO1xuICAgICAgICB2YXIgc3JjQXJyYXkgPSB1cmwuc3BsaXQoJy8nKTtcblxuICAgICAgICB2YXIgcHJvdG9jb2wgPSBzcmNBcnJheVswXTtcbiAgICAgICAgc3JjQXJyYXkuc3BsaWNlKDAsMyk7XG5cbiAgICAgICAgdmFyIHJldHVyblVybCA9IHByb3RvY29sICsgJy8vJyArIGdyb3VwU2V0dGluZ3MudXJsLmNhbm9uaWNhbERvbWFpbigpICsgJy8nICsgc3JjQXJyYXkuam9pbignLycpO1xuXG4gICAgICAgIHJldHVybiByZXR1cm5Vcmw7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHVybDtcbiAgICB9XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjb21wdXRlUGFnZVVybDogY29tcHV0ZVBhZ2VFbGVtZW50VXJsLFxuICAgIGNvbXB1dGVQYWdlVGl0bGU6IGNvbXB1dGVQYWdlVGl0bGUsXG4gICAgY29tcHV0ZVRvcExldmVsUGFnZUltYWdlOiBjb21wdXRlVG9wTGV2ZWxQYWdlSW1hZ2UsXG4gICAgY29tcHV0ZVBhZ2VBdXRob3I6IGNvbXB1dGVQYWdlQXV0aG9yLFxuICAgIGNvbXB1dGVQYWdlVG9waWNzOiBjb21wdXRlUGFnZVRvcGljcyxcbiAgICBjb21wdXRlUGFnZVNpdGVTZWN0aW9uOiBjb21wdXRlUGFnZVNpdGVTZWN0aW9uXG59OyIsIi8vIEFudGVubmEgY2hhbmdlcyBmcm9tIG9yaWdpbmFsIHNvdXJjZSBtYXJrZWQgd2l0aCBPUklHSU5BTFxuLy8gU2VlIHRoZSBpc3N1ZSB3ZSBuZWVkZWQgdG8gd29yayBhcm91bmQgaGVyZTogaHR0cHM6Ly9naXRodWIuY29tL3JhY3RpdmVqcy9yYWN0aXZlLWV2ZW50cy10YXAvaXNzdWVzLzhcblxuLy8gVGFwL2Zhc3RjbGljayBldmVudCBwbHVnaW4gZm9yIFJhY3RpdmUuanMgLSBlbGltaW5hdGVzIHRoZSAzMDBtcyBkZWxheSBvbiB0b3VjaC1lbmFibGVkIGRldmljZXMsIGFuZCBub3JtYWxpc2VzXG4vLyBhY3Jvc3MgbW91c2UsIHRvdWNoIGFuZCBwb2ludGVyIGV2ZW50cy5cbi8vIEF1dGhvcjogUmljaCBIYXJyaXNcbi8vIExpY2Vuc2U6IE1JVFxuLy8gU291cmNlOiBodHRwczovL2dpdGh1Yi5jb20vcmFjdGl2ZWpzL3JhY3RpdmUtZXZlbnRzLXRhcFxuKGZ1bmN0aW9uIChnbG9iYWwsIGZhY3RvcnkpIHtcblx0bW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7XG59KHRoaXMsIGZ1bmN0aW9uICgpIHsgJ3VzZSBzdHJpY3QnO1xuXG5cdHZhciBESVNUQU5DRV9USFJFU0hPTEQgPSA1OyAvLyBtYXhpbXVtIHBpeGVscyBwb2ludGVyIGNhbiBtb3ZlIGJlZm9yZSBjYW5jZWxcblx0dmFyIFRJTUVfVEhSRVNIT0xEID0gNDAwOyAvLyBtYXhpbXVtIG1pbGxpc2Vjb25kcyBiZXR3ZWVuIGRvd24gYW5kIHVwIGJlZm9yZSBjYW5jZWxcblxuXHRmdW5jdGlvbiB0YXAobm9kZSwgY2FsbGJhY2spIHtcblx0XHRyZXR1cm4gbmV3IFRhcEhhbmRsZXIobm9kZSwgY2FsbGJhY2spO1xuXHR9XG5cblx0ZnVuY3Rpb24gVGFwSGFuZGxlcihub2RlLCBjYWxsYmFjaykge1xuXHRcdHRoaXMubm9kZSA9IG5vZGU7XG5cdFx0dGhpcy5jYWxsYmFjayA9IGNhbGxiYWNrO1xuXG5cdFx0dGhpcy5wcmV2ZW50TW91c2Vkb3duRXZlbnRzID0gZmFsc2U7XG5cblx0XHR0aGlzLmJpbmQobm9kZSk7XG5cdH1cblxuXHRUYXBIYW5kbGVyLnByb3RvdHlwZSA9IHtcblx0XHRiaW5kOiBmdW5jdGlvbiBiaW5kKG5vZGUpIHtcblx0XHRcdC8vIGxpc3RlbiBmb3IgbW91c2UvcG9pbnRlciBldmVudHMuLi5cblx0XHRcdC8vIE9SSUdJTkFMIGlmICh3aW5kb3cubmF2aWdhdG9yLnBvaW50ZXJFbmFibGVkKSB7XG5cdFx0XHRpZiAod2luZG93Lm5hdmlnYXRvci5wb2ludGVyRW5hYmxlZCAmJiAhKCdvbnRvdWNoc3RhcnQnIGluIHdpbmRvdykpIHtcblx0XHRcdFx0bm9kZS5hZGRFdmVudExpc3RlbmVyKCdwb2ludGVyZG93bicsIGhhbmRsZU1vdXNlZG93biwgZmFsc2UpO1xuXHRcdFx0Ly8gT1JJR0lOQUwgfSBlbHNlIGlmICh3aW5kb3cubmF2aWdhdG9yLm1zUG9pbnRlckVuYWJsZWQpIHtcblx0XHRcdH0gZWxzZSBpZiAod2luZG93Lm5hdmlnYXRvci5tc1BvaW50ZXJFbmFibGVkICYmICEoJ29udG91Y2hzdGFydCcgaW4gd2luZG93KSkge1xuXHRcdFx0XHRub2RlLmFkZEV2ZW50TGlzdGVuZXIoJ01TUG9pbnRlckRvd24nLCBoYW5kbGVNb3VzZWRvd24sIGZhbHNlKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdG5vZGUuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgaGFuZGxlTW91c2Vkb3duLCBmYWxzZSk7XG5cdFx0XHR9XG5cblx0XHRcdC8vIC4uLmFuZCB0b3VjaCBldmVudHNcblx0XHRcdG5vZGUuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIGhhbmRsZVRvdWNoc3RhcnQsIGZhbHNlKTtcblxuXHRcdFx0Ly8gbmF0aXZlIGJ1dHRvbnMsIGFuZCA8aW5wdXQgdHlwZT0nYnV0dG9uJz4gZWxlbWVudHMsIHNob3VsZCBmaXJlIGEgdGFwIGV2ZW50XG5cdFx0XHQvLyB3aGVuIHRoZSBzcGFjZSBrZXkgaXMgcHJlc3NlZFxuXHRcdFx0aWYgKG5vZGUudGFnTmFtZSA9PT0gJ0JVVFRPTicgfHwgbm9kZS50eXBlID09PSAnYnV0dG9uJykge1xuXHRcdFx0XHRub2RlLmFkZEV2ZW50TGlzdGVuZXIoJ2ZvY3VzJywgaGFuZGxlRm9jdXMsIGZhbHNlKTtcblx0XHRcdH1cblxuXHRcdFx0bm9kZS5fX3RhcF9oYW5kbGVyX18gPSB0aGlzO1xuXHRcdH0sXG5cdFx0ZmlyZTogZnVuY3Rpb24gZmlyZShldmVudCwgeCwgeSkge1xuXHRcdFx0dGhpcy5jYWxsYmFjayh7XG5cdFx0XHRcdG5vZGU6IHRoaXMubm9kZSxcblx0XHRcdFx0b3JpZ2luYWw6IGV2ZW50LFxuXHRcdFx0XHR4OiB4LFxuXHRcdFx0XHR5OiB5XG5cdFx0XHR9KTtcblx0XHR9LFxuXHRcdG1vdXNlZG93bjogZnVuY3Rpb24gbW91c2Vkb3duKGV2ZW50KSB7XG5cdFx0XHR2YXIgX3RoaXMgPSB0aGlzO1xuXG5cdFx0XHRpZiAodGhpcy5wcmV2ZW50TW91c2Vkb3duRXZlbnRzKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGV2ZW50LndoaWNoICE9PSB1bmRlZmluZWQgJiYgZXZlbnQud2hpY2ggIT09IDEpIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHR2YXIgeCA9IGV2ZW50LmNsaWVudFg7XG5cdFx0XHR2YXIgeSA9IGV2ZW50LmNsaWVudFk7XG5cblx0XHRcdC8vIFRoaXMgd2lsbCBiZSBudWxsIGZvciBtb3VzZSBldmVudHMuXG5cdFx0XHR2YXIgcG9pbnRlcklkID0gZXZlbnQucG9pbnRlcklkO1xuXG5cdFx0XHR2YXIgaGFuZGxlTW91c2V1cCA9IGZ1bmN0aW9uIGhhbmRsZU1vdXNldXAoZXZlbnQpIHtcblx0XHRcdFx0aWYgKGV2ZW50LnBvaW50ZXJJZCAhPSBwb2ludGVySWQpIHtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRfdGhpcy5maXJlKGV2ZW50LCB4LCB5KTtcblx0XHRcdFx0Y2FuY2VsKCk7XG5cdFx0XHR9O1xuXG5cdFx0XHR2YXIgaGFuZGxlTW91c2Vtb3ZlID0gZnVuY3Rpb24gaGFuZGxlTW91c2Vtb3ZlKGV2ZW50KSB7XG5cdFx0XHRcdGlmIChldmVudC5wb2ludGVySWQgIT0gcG9pbnRlcklkKSB7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKE1hdGguYWJzKGV2ZW50LmNsaWVudFggLSB4KSA+PSBESVNUQU5DRV9USFJFU0hPTEQgfHwgTWF0aC5hYnMoZXZlbnQuY2xpZW50WSAtIHkpID49IERJU1RBTkNFX1RIUkVTSE9MRCkge1xuXHRcdFx0XHRcdGNhbmNlbCgpO1xuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXG5cdFx0XHR2YXIgY2FuY2VsID0gZnVuY3Rpb24gY2FuY2VsKCkge1xuXHRcdFx0XHRfdGhpcy5ub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ01TUG9pbnRlclVwJywgaGFuZGxlTW91c2V1cCwgZmFsc2UpO1xuXHRcdFx0XHRkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdNU1BvaW50ZXJNb3ZlJywgaGFuZGxlTW91c2Vtb3ZlLCBmYWxzZSk7XG5cdFx0XHRcdGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ01TUG9pbnRlckNhbmNlbCcsIGNhbmNlbCwgZmFsc2UpO1xuXHRcdFx0XHRfdGhpcy5ub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJ1cCcsIGhhbmRsZU1vdXNldXAsIGZhbHNlKTtcblx0XHRcdFx0ZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigncG9pbnRlcm1vdmUnLCBoYW5kbGVNb3VzZW1vdmUsIGZhbHNlKTtcblx0XHRcdFx0ZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigncG9pbnRlcmNhbmNlbCcsIGNhbmNlbCwgZmFsc2UpO1xuXHRcdFx0XHRfdGhpcy5ub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlTW91c2V1cCwgZmFsc2UpO1xuXHRcdFx0XHRkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBoYW5kbGVNb3VzZW1vdmUsIGZhbHNlKTtcblx0XHRcdH07XG5cblx0XHRcdGlmICh3aW5kb3cubmF2aWdhdG9yLnBvaW50ZXJFbmFibGVkKSB7XG5cdFx0XHRcdHRoaXMubm9kZS5hZGRFdmVudExpc3RlbmVyKCdwb2ludGVydXAnLCBoYW5kbGVNb3VzZXVwLCBmYWxzZSk7XG5cdFx0XHRcdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJtb3ZlJywgaGFuZGxlTW91c2Vtb3ZlLCBmYWxzZSk7XG5cdFx0XHRcdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJjYW5jZWwnLCBjYW5jZWwsIGZhbHNlKTtcblx0XHRcdH0gZWxzZSBpZiAod2luZG93Lm5hdmlnYXRvci5tc1BvaW50ZXJFbmFibGVkKSB7XG5cdFx0XHRcdHRoaXMubm9kZS5hZGRFdmVudExpc3RlbmVyKCdNU1BvaW50ZXJVcCcsIGhhbmRsZU1vdXNldXAsIGZhbHNlKTtcblx0XHRcdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignTVNQb2ludGVyTW92ZScsIGhhbmRsZU1vdXNlbW92ZSwgZmFsc2UpO1xuXHRcdFx0XHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdNU1BvaW50ZXJDYW5jZWwnLCBjYW5jZWwsIGZhbHNlKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRoaXMubm9kZS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZU1vdXNldXAsIGZhbHNlKTtcblx0XHRcdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgaGFuZGxlTW91c2Vtb3ZlLCBmYWxzZSk7XG5cdFx0XHR9XG5cblx0XHRcdHNldFRpbWVvdXQoY2FuY2VsLCBUSU1FX1RIUkVTSE9MRCk7XG5cdFx0fSxcblx0XHR0b3VjaGRvd246IGZ1bmN0aW9uIHRvdWNoZG93bigpIHtcblx0XHRcdHZhciBfdGhpczIgPSB0aGlzO1xuXG5cdFx0XHR2YXIgdG91Y2ggPSBldmVudC50b3VjaGVzWzBdO1xuXG5cdFx0XHR2YXIgeCA9IHRvdWNoLmNsaWVudFg7XG5cdFx0XHR2YXIgeSA9IHRvdWNoLmNsaWVudFk7XG5cblx0XHRcdHZhciBmaW5nZXIgPSB0b3VjaC5pZGVudGlmaWVyO1xuXG5cdFx0XHR2YXIgaGFuZGxlVG91Y2h1cCA9IGZ1bmN0aW9uIGhhbmRsZVRvdWNodXAoZXZlbnQpIHtcblx0XHRcdFx0dmFyIHRvdWNoID0gZXZlbnQuY2hhbmdlZFRvdWNoZXNbMF07XG5cblx0XHRcdFx0aWYgKHRvdWNoLmlkZW50aWZpZXIgIT09IGZpbmdlcikge1xuXHRcdFx0XHRcdGNhbmNlbCgpO1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7IC8vIHByZXZlbnQgY29tcGF0aWJpbGl0eSBtb3VzZSBldmVudFxuXG5cdFx0XHRcdC8vIGZvciB0aGUgYmVuZWZpdCBvZiBtb2JpbGUgRmlyZWZveCBhbmQgb2xkIEFuZHJvaWQgYnJvd3NlcnMsIHdlIG5lZWQgdGhpcyBhYnN1cmQgaGFjay5cblx0XHRcdFx0X3RoaXMyLnByZXZlbnRNb3VzZWRvd25FdmVudHMgPSB0cnVlO1xuXHRcdFx0XHRjbGVhclRpbWVvdXQoX3RoaXMyLnByZXZlbnRNb3VzZWRvd25UaW1lb3V0KTtcblxuXHRcdFx0XHRfdGhpczIucHJldmVudE1vdXNlZG93blRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHRfdGhpczIucHJldmVudE1vdXNlZG93bkV2ZW50cyA9IGZhbHNlO1xuXHRcdFx0XHR9LCA0MDApO1xuXG5cdFx0XHRcdF90aGlzMi5maXJlKGV2ZW50LCB4LCB5KTtcblx0XHRcdFx0Y2FuY2VsKCk7XG5cdFx0XHR9O1xuXG5cdFx0XHR2YXIgaGFuZGxlVG91Y2htb3ZlID0gZnVuY3Rpb24gaGFuZGxlVG91Y2htb3ZlKGV2ZW50KSB7XG5cdFx0XHRcdGlmIChldmVudC50b3VjaGVzLmxlbmd0aCAhPT0gMSB8fCBldmVudC50b3VjaGVzWzBdLmlkZW50aWZpZXIgIT09IGZpbmdlcikge1xuXHRcdFx0XHRcdGNhbmNlbCgpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dmFyIHRvdWNoID0gZXZlbnQudG91Y2hlc1swXTtcblx0XHRcdFx0aWYgKE1hdGguYWJzKHRvdWNoLmNsaWVudFggLSB4KSA+PSBESVNUQU5DRV9USFJFU0hPTEQgfHwgTWF0aC5hYnModG91Y2guY2xpZW50WSAtIHkpID49IERJU1RBTkNFX1RIUkVTSE9MRCkge1xuXHRcdFx0XHRcdGNhbmNlbCgpO1xuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXG5cdFx0XHR2YXIgY2FuY2VsID0gZnVuY3Rpb24gY2FuY2VsKCkge1xuXHRcdFx0XHRfdGhpczIubm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIGhhbmRsZVRvdWNodXAsIGZhbHNlKTtcblx0XHRcdFx0d2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIGhhbmRsZVRvdWNobW92ZSwgZmFsc2UpO1xuXHRcdFx0XHR3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hjYW5jZWwnLCBjYW5jZWwsIGZhbHNlKTtcblx0XHRcdH07XG5cblx0XHRcdHRoaXMubm9kZS5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIGhhbmRsZVRvdWNodXAsIGZhbHNlKTtcblx0XHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCBoYW5kbGVUb3VjaG1vdmUsIGZhbHNlKTtcblx0XHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGNhbmNlbCcsIGNhbmNlbCwgZmFsc2UpO1xuXG5cdFx0XHRzZXRUaW1lb3V0KGNhbmNlbCwgVElNRV9USFJFU0hPTEQpO1xuXHRcdH0sXG5cdFx0dGVhcmRvd246IGZ1bmN0aW9uIHRlYXJkb3duKCkge1xuXHRcdFx0dmFyIG5vZGUgPSB0aGlzLm5vZGU7XG5cblx0XHRcdG5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcigncG9pbnRlcmRvd24nLCBoYW5kbGVNb3VzZWRvd24sIGZhbHNlKTtcblx0XHRcdG5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcignTVNQb2ludGVyRG93bicsIGhhbmRsZU1vdXNlZG93biwgZmFsc2UpO1xuXHRcdFx0bm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBoYW5kbGVNb3VzZWRvd24sIGZhbHNlKTtcblx0XHRcdG5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIGhhbmRsZVRvdWNoc3RhcnQsIGZhbHNlKTtcblx0XHRcdG5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcignZm9jdXMnLCBoYW5kbGVGb2N1cywgZmFsc2UpO1xuXHRcdH1cblx0fTtcblxuXHRmdW5jdGlvbiBoYW5kbGVNb3VzZWRvd24oZXZlbnQpIHtcblx0XHR0aGlzLl9fdGFwX2hhbmRsZXJfXy5tb3VzZWRvd24oZXZlbnQpO1xuXHR9XG5cblx0ZnVuY3Rpb24gaGFuZGxlVG91Y2hzdGFydChldmVudCkge1xuXHRcdHRoaXMuX190YXBfaGFuZGxlcl9fLnRvdWNoZG93bihldmVudCk7XG5cdH1cblxuXHRmdW5jdGlvbiBoYW5kbGVGb2N1cygpIHtcblx0XHR0aGlzLmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBoYW5kbGVLZXlkb3duLCBmYWxzZSk7XG5cdFx0dGhpcy5hZGRFdmVudExpc3RlbmVyKCdibHVyJywgaGFuZGxlQmx1ciwgZmFsc2UpO1xuXHR9XG5cblx0ZnVuY3Rpb24gaGFuZGxlQmx1cigpIHtcblx0XHR0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBoYW5kbGVLZXlkb3duLCBmYWxzZSk7XG5cdFx0dGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKCdibHVyJywgaGFuZGxlQmx1ciwgZmFsc2UpO1xuXHR9XG5cblx0ZnVuY3Rpb24gaGFuZGxlS2V5ZG93bihldmVudCkge1xuXHRcdGlmIChldmVudC53aGljaCA9PT0gMzIpIHtcblx0XHRcdC8vIHNwYWNlIGtleVxuXHRcdFx0dGhpcy5fX3RhcF9oYW5kbGVyX18uZmlyZSgpO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiB0YXA7XG5cbn0pKTsiLCJ2YXIgUmFjdGl2ZUV2ZW50c1RhcCA9IHJlcXVpcmUoJy4vcmFjdGl2ZS1ldmVudHMtdGFwJyk7XG5cbnZhciBNZXNzYWdlcyA9IHJlcXVpcmUoJy4vbWVzc2FnZXMnKTtcblxudmFyIG5vQ29uZmxpY3Q7XG52YXIgbG9hZGVkUmFjdGl2ZTtcbnZhciBjYWxsYmFja3MgPSBbXTtcblxuLy8gQ2FwdHVyZSBhbnkgZ2xvYmFsIGluc3RhbmNlIG9mIFJhY3RpdmUgd2hpY2ggYWxyZWFkeSBleGlzdHMgYmVmb3JlIHdlIGxvYWQgb3VyIG93bi5cbmZ1bmN0aW9uIGFib3V0VG9Mb2FkKCkge1xuICAgIG5vQ29uZmxpY3QgPSB3aW5kb3cuUmFjdGl2ZTtcbn1cblxuLy8gUmVzdG9yZSB0aGUgZ2xvYmFsIGluc3RhbmNlIG9mIFJhY3RpdmUgKGlmIGFueSkgYW5kIHBhc3Mgb3V0IG91ciB2ZXJzaW9uIHRvIG91ciBjYWxsYmFja3NcbmZ1bmN0aW9uIGxvYWRlZCgpIHtcbiAgICBsb2FkZWRSYWN0aXZlID0gUmFjdGl2ZTtcbiAgICB3aW5kb3cuUmFjdGl2ZSA9IG5vQ29uZmxpY3Q7XG4gICAgbG9hZGVkUmFjdGl2ZS5kZWNvcmF0b3JzLmNzc3Jlc2V0ID0gY3NzUmVzZXREZWNvcmF0b3I7IC8vIE1ha2Ugb3VyIGNzcyByZXNldCBkZWNvcmF0b3IgYXZhaWxhYmxlIHRvIGFsbCBpbnN0YW5jZXNcbiAgICBsb2FkZWRSYWN0aXZlLmV2ZW50cy50YXAgPSBSYWN0aXZlRXZlbnRzVGFwOyAvLyBNYWtlIHRoZSAnb24tdGFwJyBldmVudCBwbHVnaW4gYXZhaWxhYmxlIHRvIGFsbCBpbnN0YW5jZXNcbiAgICBsb2FkZWRSYWN0aXZlLmRlZmF1bHRzLmRhdGEuZ2V0TWVzc2FnZSA9IE1lc3NhZ2VzLmdldE1lc3NhZ2U7IC8vIE1ha2UgZ2V0TWVzc2FnZSBhdmFpbGFibGUgdG8gYWxsIGluc3RhbmNlc1xuICAgIGxvYWRlZFJhY3RpdmUuZGVmYXVsdHMudHdvd2F5ID0gZmFsc2U7IC8vIENoYW5nZSB0aGUgZGVmYXVsdCB0byBkaXNhYmxlIHR3by13YXkgZGF0YSBiaW5kaW5ncy5cbiAgICBsb2FkZWRSYWN0aXZlLkRFQlVHID0gZmFsc2U7XG4gICAgbm90aWZ5Q2FsbGJhY2tzKCk7XG59XG5cbmZ1bmN0aW9uIGNzc1Jlc2V0RGVjb3JhdG9yKG5vZGUpIHtcbiAgICB0YWdOb2RlQW5kQ2hpbGRyZW4obm9kZSwgJ2FudGVubmEtcmVzZXQnKTtcbiAgICByZXR1cm4geyB0ZWFyZG93bjogZnVuY3Rpb24oKSB7fSB9O1xufVxuXG5mdW5jdGlvbiB0YWdOb2RlQW5kQ2hpbGRyZW4obm9kZSwgY2xhenopIHtcbiAgICBub2RlLmNsYXNzTGlzdC5hZGQoY2xhenopO1xuICAgIGlmIChub2RlLmNoaWxkcmVuKSB7IC8vIFNhZmFyaSByZXR1cm5zIHVuZGVmaW5lZCB3aGVuIGFza2luZyBmb3IgY2hpbGRyZW4gb24gYW4gU1ZHIGVsZW1lbnRcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBub2RlLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB0YWdOb2RlQW5kQ2hpbGRyZW4obm9kZS5jaGlsZHJlbltpXSwgY2xhenopO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBub3RpZnlDYWxsYmFja3MoKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjYWxsYmFja3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY2FsbGJhY2tzW2ldKGxvYWRlZFJhY3RpdmUpO1xuICAgIH1cbiAgICBjYWxsYmFja3MgPSBbXTtcbn1cblxuLy8gUmVnaXN0ZXJzIHRoZSBnaXZlbiBjYWxsYmFjayB0byBiZSBub3RpZmllZCB3aGVuIG91ciB2ZXJzaW9uIG9mIFJhY3RpdmUgaXMgbG9hZGVkLlxuZnVuY3Rpb24gb25Mb2FkKGNhbGxiYWNrKSB7XG4gICAgaWYgKGxvYWRlZFJhY3RpdmUpIHtcbiAgICAgICAgY2FsbGJhY2sobG9hZGVkUmFjdGl2ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgY2FsbGJhY2tzLnB1c2goY2FsbGJhY2spO1xuICAgIH1cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGFib3V0VG9Mb2FkOiBhYm91dFRvTG9hZCxcbiAgICBsb2FkZWQ6IGxvYWRlZCxcbiAgICBvbkxvYWQ6IG9uTG9hZFxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciByYW5neTsgcmVxdWlyZSgnLi9yYW5neS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihsb2FkZWRSYW5neSkgeyByYW5neSA9IGxvYWRlZFJhbmd5OyB9KTtcblxudmFyIGhpZ2hsaWdodENsYXNzID0gJ2FudGVubmEtaGlnaGxpZ2h0JztcbnZhciBoaWdobGlnaHRlZFJhbmdlcyA9IFtdO1xuXG52YXIgY2xhc3NBcHBsaWVyO1xuZnVuY3Rpb24gZ2V0Q2xhc3NBcHBsaWVyKCkge1xuICAgIGlmICghY2xhc3NBcHBsaWVyKSB7XG4gICAgICAgIGNsYXNzQXBwbGllciA9IHJhbmd5LmNyZWF0ZUNsYXNzQXBwbGllcihoaWdobGlnaHRDbGFzcywgeyBlbGVtZW50VGFnTmFtZTogJ2lucycgfSk7XG4gICAgfVxuICAgIHJldHVybiBjbGFzc0FwcGxpZXI7XG59XG5cbi8vIFJldHVybnMgYW4gYWRqdXN0ZWQgZW5kIHBvaW50IGZvciB0aGUgc2VsZWN0aW9uIHdpdGhpbiB0aGUgZ2l2ZW4gbm9kZSwgYXMgdHJpZ2dlcmVkIGJ5IHRoZSBnaXZlbiBtb3VzZSB1cCBldmVudC5cbi8vIFRoZSByZXR1cm5lZCBwb2ludCAoeCwgeSkgdGFrZXMgaW50byBhY2NvdW50IHRoZSBsb2NhdGlvbiBvZiB0aGUgbW91c2UgdXAgZXZlbnQgYXMgd2VsbCBhcyB0aGUgZGlyZWN0aW9uIG9mIHRoZVxuLy8gc2VsZWN0aW9uIChmb3J3YXJkL2JhY2spLlxuZnVuY3Rpb24gZ2V0U2VsZWN0aW9uRW5kUG9pbnQobm9kZSwgZXZlbnQsIGV4Y2x1ZGVOb2RlKSB7XG4gICAgLy8gVE9ETzogQ29uc2lkZXIgdXNpbmcgdGhlIGVsZW1lbnQgY3JlYXRlZCB3aXRoIHRoZSAnY2xhc3NpZmllcicgcmF0aGVyIHRoYW4gdGhlIG1vdXNlIGxvY2F0aW9uXG4gICAgdmFyIHNlbGVjdGlvbiA9IHJhbmd5LmdldFNlbGVjdGlvbigpO1xuICAgIGlmIChpc1ZhbGlkU2VsZWN0aW9uKHNlbGVjdGlvbiwgbm9kZSwgZXhjbHVkZU5vZGUpKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB4OiBldmVudC5wYWdlWCAtICggc2VsZWN0aW9uLmlzQmFja3dhcmRzKCkgPyAtNSA6IDUpLFxuICAgICAgICAgICAgeTogZXZlbnQucGFnZVkgLSA4IC8vIFRPRE86IGV4YWN0IGNvb3Jkc1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xufVxuXG4vLyBBdHRlbXB0cyB0byBnZXQgYSByYW5nZSBmcm9tIHRoZSBjdXJyZW50IHNlbGVjdGlvbi4gVGhpcyBleHBhbmRzIHRoZVxuLy8gc2VsZWN0ZWQgcmVnaW9uIHRvIGluY2x1ZGUgd29yZCBib3VuZGFyaWVzLlxuZnVuY3Rpb24gZ3JhYlNlbGVjdGlvbihub2RlLCBjYWxsYmFjaywgZXhjbHVkZU5vZGUpIHtcbiAgICB2YXIgc2VsZWN0aW9uID0gcmFuZ3kuZ2V0U2VsZWN0aW9uKCk7XG4gICAgaWYgKGlzVmFsaWRTZWxlY3Rpb24oc2VsZWN0aW9uLCBub2RlLCBleGNsdWRlTm9kZSkpIHtcbiAgICAgICAgZXhwYW5kQW5kVHJpbVJhbmdlKHNlbGVjdGlvbik7XG4gICAgICAgIGlmIChzZWxlY3Rpb24uY29udGFpbnNOb2RlKGV4Y2x1ZGVOb2RlKSkge1xuICAgICAgICAgICAgdmFyIHJhbmdlID0gc2VsZWN0aW9uLmdldFJhbmdlQXQoMCk7XG4gICAgICAgICAgICByYW5nZS5zZXRFbmRCZWZvcmUoZXhjbHVkZU5vZGUpO1xuICAgICAgICAgICAgc2VsZWN0aW9uLnNldFNpbmdsZVJhbmdlKHJhbmdlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaXNWYWxpZFNlbGVjdGlvbihzZWxlY3Rpb24sIG5vZGUsIGV4Y2x1ZGVOb2RlKSkge1xuICAgICAgICAgICAgdmFyIGxvY2F0aW9uO1xuICAgICAgICAgICAgaWYgKHNlbGVjdGlvbkVuY29tcGFzc2VzTm9kZShzZWxlY3Rpb24sIG5vZGUpKSB7XG4gICAgICAgICAgICAgICAgbG9jYXRpb24gPSAnOjAsOjEnOyAvLyBUaGUgdXNlciBoYXMgbWFudWFsbHkgc2VsZWN0ZWQgdGhlIGVudGlyZSBub2RlLiBOb3JtYWxpemUgdGhlIGxvY2F0aW9uLlxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBsb2NhdGlvbiA9IHJhbmd5LnNlcmlhbGl6ZVNlbGVjdGlvbihzZWxlY3Rpb24sIHRydWUsIG5vZGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHRleHQgPSBzZWxlY3Rpb24udG9TdHJpbmcoKTtcbiAgICAgICAgICAgIGhpZ2hsaWdodFNlbGVjdGlvbihzZWxlY3Rpb24pOyAvLyBIaWdobGlnaHRpbmcgZGVzZWxlY3RzIHRoZSB0ZXh0LCBzbyBkbyB0aGlzIGxhc3QuXG4gICAgICAgICAgICBjYWxsYmFjayh0ZXh0LCBsb2NhdGlvbik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBleHBhbmRBbmRUcmltUmFuZ2UocmFuZ2VPclNlbGVjdGlvbikge1xuICAgICAgICByYW5nZU9yU2VsZWN0aW9uLmV4cGFuZCgnd29yZCcsIHsgdHJpbTogdHJ1ZSwgd29yZE9wdGlvbnM6IHsgd29yZFJlZ2V4OiAvXFxTK1xcUyovZ2kgfSB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzZWxlY3Rpb25FbmNvbXBhc3Nlc05vZGUoc2VsZWN0aW9uLCBub2RlKSB7XG4gICAgICAgIHZhciByYW5nZSA9IGdldE5vZGVSYW5nZShub2RlKTtcbiAgICAgICAgZXhwYW5kQW5kVHJpbVJhbmdlKHJhbmdlKTtcbiAgICAgICAgcmV0dXJuIHJhbmdlLnRvU3RyaW5nKCkgPT09IHNlbGVjdGlvbi50b1N0cmluZygpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gaXNWYWxpZFNlbGVjdGlvbihzZWxlY3Rpb24sIG5vZGUsIGV4Y2x1ZGVOb2RlKSB7XG4gICAgcmV0dXJuICFzZWxlY3Rpb24uaXNDb2xsYXBzZWQgJiYgIC8vIE5vbi1lbXB0eSBzZWxlY3Rpb25cbiAgICAgICAgc2VsZWN0aW9uLnJhbmdlQ291bnQgPT09IDEgJiYgLy8gU2luZ2xlIHNlbGVjdGlvblxuICAgICAgICAoIWV4Y2x1ZGVOb2RlIHx8ICFzZWxlY3Rpb24uY29udGFpbnNOb2RlKGV4Y2x1ZGVOb2RlLCB0cnVlKSkgJiYgLy8gU2VsZWN0aW9uIGRvZXNuJ3QgY29udGFpbiBhbnl0aGluZyB3ZSd2ZSBzYWlkIHdlIGRvbid0IHdhbnQgKGUuZy4gdGhlIGluZGljYXRvcilcbiAgICAgICAgbm9kZUNvbnRhaW5zU2VsZWN0aW9uKG5vZGUsIHNlbGVjdGlvbik7IC8vIFNlbGVjdGlvbiBpcyBjb250YWluZWQgZW50aXJlbHkgd2l0aGluIHRoZSBub2RlXG59XG5cbmZ1bmN0aW9uIG5vZGVDb250YWluc1NlbGVjdGlvbihub2RlLCBzZWxlY3Rpb24pIHtcbiAgICB2YXIgY29tbW9uQW5jZXN0b3IgPSBzZWxlY3Rpb24uZ2V0UmFuZ2VBdCgwKS5jb21tb25BbmNlc3RvckNvbnRhaW5lcjsgLy8gY29tbW9uQW5jZXN0b3IgY291bGQgYmUgYSB0ZXh0IG5vZGUgb3Igc29tZSBwYXJlbnQgZWxlbWVudFxuICAgIHJldHVybiBub2RlLmNvbnRhaW5zKGNvbW1vbkFuY2VzdG9yKSB8fFxuICAgICAgICAgICAgLy8gVGhlIGZvbGxvd2luZyBjaGVjayBpcyBmb3IgSUUsIHdoaWNoIGRvZXNuJ3QgaW1wbGVtZW50IFwiY29udGFpbnNcIiBwcm9wZXJseSBmb3IgdGV4dCBub2Rlcy5cbiAgICAgICAgKGNvbW1vbkFuY2VzdG9yLm5vZGVUeXBlID09PSAzICYmIG5vZGUuY29udGFpbnMoY29tbW9uQW5jZXN0b3IucGFyZW50Tm9kZSkpO1xufVxuXG5mdW5jdGlvbiBnZXROb2RlUmFuZ2Uobm9kZSkge1xuICAgIHZhciByYW5nZSA9IHJhbmd5LmNyZWF0ZVJhbmdlKGRvY3VtZW50KTtcbiAgICByYW5nZS5zZWxlY3ROb2RlQ29udGVudHMobm9kZSk7XG4gICAgdmFyICRleGNsdWRlZCA9ICQobm9kZSkuZmluZCgnLmFudGVubmEtdGV4dC1pbmRpY2F0b3Itd2lkZ2V0Jyk7XG4gICAgaWYgKCRleGNsdWRlZC5zaXplKCkgPiAwKSB7IC8vIFJlbW92ZSB0aGUgaW5kaWNhdG9yIGZyb20gdGhlIGVuZCBvZiB0aGUgc2VsZWN0ZWQgcmFuZ2UuXG4gICAgICAgIHJhbmdlLnNldEVuZEJlZm9yZSgkZXhjbHVkZWQuZ2V0KDApKTtcbiAgICB9XG4gICAgcmV0dXJuIHJhbmdlO1xufVxuXG5mdW5jdGlvbiBncmFiTm9kZShub2RlLCBjYWxsYmFjaykge1xuICAgIHZhciByYW5nZSA9IGdldE5vZGVSYW5nZShub2RlKTtcbiAgICB2YXIgc2VsZWN0aW9uID0gcmFuZ3kuZ2V0U2VsZWN0aW9uKCk7XG4gICAgc2VsZWN0aW9uLnNldFNpbmdsZVJhbmdlKHJhbmdlKTtcbiAgICAvLyBXZSBzaG91bGQganVzdCBiZSBhYmxlIHRvIHNlcmlhbGl6ZSB0aGUgc2VsZWN0aW9uLCBidXQgdGhpcyBnaXZlcyB1cyBpbmNvbnNpc3RlbnQgdmFsdWVzIGluIFNhZmFyaS5cbiAgICAvLyBUaGUgdmFsdWUgKnNob3VsZCogYWx3YXlzIGJlIDowLDoxIHdoZW4gd2Ugc2VsZWN0IGFuIGVudGlyZSBub2RlLCBzbyB3ZSBqdXN0IGhhcmRjb2RlIGl0LlxuICAgIC8vdmFyIGxvY2F0aW9uID0gcmFuZ3kuc2VyaWFsaXplU2VsZWN0aW9uKHNlbGVjdGlvbiwgdHJ1ZSwgbm9kZSk7XG4gICAgdmFyIGxvY2F0aW9uID0gJzowLDoxJztcbiAgICB2YXIgdGV4dCA9IHNlbGVjdGlvbi50b1N0cmluZygpLnRyaW0oKTtcbiAgICBpZiAodGV4dC5sZW5ndGggPiAwKSB7XG4gICAgICAgIGhpZ2hsaWdodFNlbGVjdGlvbihzZWxlY3Rpb24pOyAvLyBIaWdobGlnaHRpbmcgZGVzZWxlY3RzIHRoZSB0ZXh0LCBzbyBkbyB0aGlzIGxhc3QuXG4gICAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICAgICAgY2FsbGJhY2sodGV4dCwgbG9jYXRpb24pO1xuICAgICAgICB9XG4gICAgfVxuICAgIHNlbGVjdGlvbi5yZW1vdmVBbGxSYW5nZXMoKTsgLy8gRG9uJ3QgYWN0dWFsbHkgbGVhdmUgdGhlIGVsZW1lbnQgc2VsZWN0ZWQuXG4gICAgc2VsZWN0aW9uLnJlZnJlc2goKTtcbn1cblxuLy8gSGlnaGxpZ2h0cyB0aGUgZ2l2ZW4gbG9jYXRpb24gaW5zaWRlIHRoZSBnaXZlbiBub2RlLlxuZnVuY3Rpb24gaGlnaGxpZ2h0TG9jYXRpb24obm9kZSwgbG9jYXRpb24pIHtcbiAgICAvLyBUT0RPIGVycm9yIGhhbmRsaW5nIGluIGNhc2UgdGhlIHJhbmdlIGlzIG5vdCB2YWxpZD9cbiAgICBpZiAobG9jYXRpb24gPT09ICc6MCw6MScpIHtcbiAgICAgICAgZ3JhYk5vZGUobm9kZSk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHJhbmd5LmNhbkRlc2VyaWFsaXplUmFuZ2UobG9jYXRpb24sIG5vZGUsIGRvY3VtZW50KSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdmFyIHJhbmdlID0gcmFuZ3kuZGVzZXJpYWxpemVSYW5nZShsb2NhdGlvbiwgbm9kZSwgZG9jdW1lbnQpO1xuICAgICAgICAgICAgaGlnaGxpZ2h0UmFuZ2UocmFuZ2UpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgLy8gVE9ETzogQ29uc2lkZXIgbG9nZ2luZyBzb21lIGtpbmQgb2YgZXZlbnQgc2VydmVyLXNpZGU/XG4gICAgICAgICAgICAvLyBUT0RPOiBDb25zaWRlciBoaWdobGlnaHRpbmcgdGhlIHdob2xlIG5vZGU/IE9yIGlzIGl0IGJldHRlciB0byBqdXN0IGhpZ2hsaWdodCBub3RoaW5nP1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBoaWdobGlnaHRTZWxlY3Rpb24oc2VsZWN0aW9uKSB7XG4gICAgaGlnaGxpZ2h0UmFuZ2Uoc2VsZWN0aW9uLmdldFJhbmdlQXQoMCkpO1xufVxuXG5mdW5jdGlvbiBoaWdobGlnaHRSYW5nZShyYW5nZSkge1xuICAgIGNsZWFySGlnaGxpZ2h0cygpO1xuICAgIGdldENsYXNzQXBwbGllcigpLmFwcGx5VG9SYW5nZShyYW5nZSk7XG4gICAgaGlnaGxpZ2h0ZWRSYW5nZXMucHVzaChyYW5nZSk7XG59XG5cbi8vIENsZWFycyBhbGwgaGlnaGxpZ2h0cyB0aGF0IGhhdmUgYmVlbiBjcmVhdGVkIG9uIHRoZSBwYWdlLlxuZnVuY3Rpb24gY2xlYXJIaWdobGlnaHRzKCkge1xuICAgIHZhciBjbGFzc0FwcGxpZXIgPSBnZXRDbGFzc0FwcGxpZXIoKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGhpZ2hsaWdodGVkUmFuZ2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciByYW5nZSA9IGhpZ2hsaWdodGVkUmFuZ2VzW2ldO1xuICAgICAgICBpZiAoY2xhc3NBcHBsaWVyLmlzQXBwbGllZFRvUmFuZ2UocmFuZ2UpKSB7XG4gICAgICAgICAgICBjbGFzc0FwcGxpZXIudW5kb1RvUmFuZ2UocmFuZ2UpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGhpZ2hsaWdodGVkUmFuZ2VzID0gW107XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBnZXRTZWxlY3Rpb25FbmRQb2ludDogZ2V0U2VsZWN0aW9uRW5kUG9pbnQsXG4gICAgZ3JhYlNlbGVjdGlvbjogZ3JhYlNlbGVjdGlvbixcbiAgICBncmFiTm9kZTogZ3JhYk5vZGUsXG4gICAgY2xlYXJIaWdobGlnaHRzOiBjbGVhckhpZ2hsaWdodHMsXG4gICAgaGlnaGxpZ2h0OiBoaWdobGlnaHRMb2NhdGlvbixcbiAgICBISUdITElHSFRfU0VMRUNUT1I6ICcuJyArIGhpZ2hsaWdodENsYXNzXG59OyIsIlxudmFyIG5vQ29uZmxpY3Q7XG52YXIgbG9hZGVkUmFuZ3k7XG52YXIgY2FsbGJhY2tzID0gW107XG5cbi8vIENhcHR1cmUgYW55IGdsb2JhbCBpbnN0YW5jZSBvZiByYW5neSB3aGljaCBhbHJlYWR5IGV4aXN0cyBiZWZvcmUgd2UgbG9hZCBvdXIgb3duLlxuZnVuY3Rpb24gYWJvdXRUb0xvYWQoKSB7XG4gICAgbm9Db25mbGljdCA9IHdpbmRvdy5yYW5neTtcbn1cblxuLy8gUmVzdG9yZSB0aGUgZ2xvYmFsIGluc3RhbmNlIG9mIHJhbmd5IChpZiBhbnkpIGFuZCBwYXNzIG91dCBvdXIgdmVyc2lvbiB0byBvdXIgY2FsbGJhY2tzXG5mdW5jdGlvbiBsb2FkZWQoKSB7XG4gICAgbG9hZGVkUmFuZ3kgPSByYW5neTtcbiAgICBsb2FkZWRSYW5neS5pbml0KCk7XG4gICAgd2luZG93LnJhbmd5ID0gbm9Db25mbGljdDtcbiAgICBub3RpZnlDYWxsYmFja3MoKTtcbn1cblxuZnVuY3Rpb24gbm90aWZ5Q2FsbGJhY2tzKCkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2FsbGJhY2tzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNhbGxiYWNrc1tpXShsb2FkZWRSYW5neSk7XG4gICAgfVxuICAgIGNhbGxiYWNrcyA9IFtdO1xufVxuXG4vLyBSZWdpc3RlcnMgdGhlIGdpdmVuIGNhbGxiYWNrIHRvIGJlIG5vdGlmaWVkIHdoZW4gb3VyIHZlcnNpb24gb2YgUmFuZ3kgaXMgbG9hZGVkLlxuZnVuY3Rpb24gb25Mb2FkKGNhbGxiYWNrKSB7XG4gICAgaWYgKGxvYWRlZFJhbmd5KSB7XG4gICAgICAgIGNhbGxiYWNrKGxvYWRlZFJhbmd5KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBjYWxsYmFja3MucHVzaChjYWxsYmFjayk7XG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgYWJvdXRUb0xvYWQ6IGFib3V0VG9Mb2FkLFxuICAgIGxvYWRlZDogbG9hZGVkLFxuICAgIG9uTG9hZDogb25Mb2FkXG59OyIsInZhciAkOyByZXF1aXJlKCcuL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xuXG52YXIgQ0xBU1NfRlVMTCA9ICdhbnRlbm5hLWZ1bGwnO1xudmFyIENMQVNTX0hBTEYgPSAnYW50ZW5uYS1oYWxmJztcbnZhciBDTEFTU19IQUxGX1NUUkVUQ0ggPSBDTEFTU19IQUxGICsgJyBhbnRlbm5hLXN0cmV0Y2gnO1xuXG5mdW5jdGlvbiBjb21wdXRlTGF5b3V0RGF0YShyZWFjdGlvbnNEYXRhKSB7XG4gICAgdmFyIG51bVJlYWN0aW9ucyA9IHJlYWN0aW9uc0RhdGEubGVuZ3RoO1xuICAgIGlmIChudW1SZWFjdGlvbnMgPT0gMCkge1xuICAgICAgICByZXR1cm4ge307IC8vIFRPRE8gY2xlYW4gdGhpcyB1cFxuICAgIH1cbiAgICAvLyBUT0RPOiBDb3BpZWQgY29kZSBmcm9tIGVuZ2FnZV9mdWxsLmNyZWF0ZVRhZ0J1Y2tldHNcbiAgICB2YXIgbWVkaWFuID0gcmVhY3Rpb25zRGF0YVsgTWF0aC5mbG9vcihyZWFjdGlvbnNEYXRhLmxlbmd0aC8yKSBdLmNvdW50O1xuICAgIHZhciB0b3RhbCA9IDA7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBudW1SZWFjdGlvbnM7IGkrKykge1xuICAgICAgICB0b3RhbCArPSByZWFjdGlvbnNEYXRhW2ldLmNvdW50O1xuICAgIH1cbiAgICB2YXIgYXZlcmFnZSA9IE1hdGguZmxvb3IodG90YWwgLyBudW1SZWFjdGlvbnMpO1xuICAgIHZhciBtaWRWYWx1ZSA9ICggbWVkaWFuID4gYXZlcmFnZSApID8gbWVkaWFuIDogYXZlcmFnZTtcblxuICAgIHZhciBsYXlvdXRDbGFzc2VzID0gW107XG4gICAgdmFyIG51bUhhbGZzaWVzID0gMDtcbiAgICB2YXIgbnVtRnVsbCA9IDA7XG4gICAgZm9yICh2YXIgaiA9IDA7IGogPCBudW1SZWFjdGlvbnM7IGorKykge1xuICAgICAgICBpZiAocmVhY3Rpb25zRGF0YVtqXS5jb3VudCA+IG1pZFZhbHVlKSB7XG4gICAgICAgICAgICBsYXlvdXRDbGFzc2VzW2pdID0gQ0xBU1NfRlVMTDtcbiAgICAgICAgICAgIG51bUZ1bGwrKztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGxheW91dENsYXNzZXNbal0gPSBDTEFTU19IQUxGO1xuICAgICAgICAgICAgbnVtSGFsZnNpZXMrKztcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAobnVtSGFsZnNpZXMgJSAyICE9PSAwKSB7XG4gICAgICAgIC8vIElmIHRoZXJlIGFyZSBhbiBvZGQgbnVtYmVyIG9mIGhhbGYtc2l6ZWQgYm94ZXMsIG1ha2Ugb25lIG9mIHRoZW0gZnVsbC5cbiAgICAgICAgaWYgKG51bUZ1bGwgPT09IDApIHtcbiAgICAgICAgICAgIC8vIElmIHRoZXJlIGFyZSBubyBvdGhlciBmdWxsLXNpemUgYm94ZXMsIG1ha2UgdGhlIGZpcnN0IG9uZSBmdWxsLXNpemUuXG4gICAgICAgICAgICBsYXlvdXRDbGFzc2VzWzBdID0gQ0xBU1NfRlVMTDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIE90aGVyd2lzZSwgc2ltcGx5IHN0cmV0Y2ggdGhlIGxhc3QgYm94IHRvIGZpbGwgdGhlIGF2YWlsYWJsZSB3aWR0aCAodGhpcyBrZWVwcyB0aGUgc21hbGxlciBmb250IHNpemUpLlxuICAgICAgICAgICAgbGF5b3V0Q2xhc3Nlc1tudW1SZWFjdGlvbnMgLSAxXSA9IENMQVNTX0hBTEZfU1RSRVRDSDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIGxheW91dENsYXNzZXM6IGxheW91dENsYXNzZXNcbiAgICB9O1xufVxuXG5mdW5jdGlvbiBzaXplUmVhY3Rpb25UZXh0VG9GaXQoJHJlYWN0aW9uc1dpbmRvdykge1xuICAgIHJldHVybiBmdW5jdGlvbiBzaXplUmVhY3Rpb25UZXh0VG9GaXQobm9kZSkge1xuICAgICAgICB2YXIgJGVsZW1lbnQgPSAkKG5vZGUpO1xuICAgICAgICB2YXIgb3JpZ2luYWxEaXNwbGF5ID0gJHJlYWN0aW9uc1dpbmRvdy5jc3MoJ2Rpc3BsYXknKTtcbiAgICAgICAgaWYgKG9yaWdpbmFsRGlzcGxheSA9PT0gJ25vbmUnKSB7IC8vIElmIHdlJ3JlIHNpemluZyB0aGUgYm94ZXMgYmVmb3JlIHRoZSB3aWRnZXQgaXMgZGlzcGxheWVkLCB0ZW1wb3JhcmlseSBkaXNwbGF5IGl0IG9mZnNjcmVlbi5cbiAgICAgICAgICAgICRyZWFjdGlvbnNXaW5kb3cuY3NzKHtkaXNwbGF5OiAnYmxvY2snLCBsZWZ0OiAnMTAwJSd9KTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgaG9yaXpvbnRhbFJhdGlvID0gbm9kZS5jbGllbnRXaWR0aCAvIG5vZGUuc2Nyb2xsV2lkdGg7XG4gICAgICAgIGlmIChob3Jpem9udGFsUmF0aW8gPCAxLjApIHsgLy8gSWYgdGhlIHRleHQgZG9lc24ndCBmaXQsIGZpcnN0IHRyeSB0byB3cmFwIGl0IHRvIHR3byBsaW5lcy4gVGhlbiBzY2FsZSBpdCBkb3duIGlmIHN0aWxsIG5lY2Vzc2FyeS5cbiAgICAgICAgICAgIHZhciB0ZXh0ID0gbm9kZS5pbm5lckhUTUw7XG4gICAgICAgICAgICB2YXIgbWlkID0gTWF0aC5jZWlsKHRleHQubGVuZ3RoIC8gMik7IC8vIExvb2sgZm9yIHRoZSBjbG9zZXN0IHNwYWNlIHRvIHRoZSBtaWRkbGUsIHdlaWdodGVkIHNsaWdodGx5IChNYXRoLmNlaWwpIHRvd2FyZCBhIHNwYWNlIGluIHRoZSBzZWNvbmQgaGFsZi5cbiAgICAgICAgICAgIHZhciBzZWNvbmRIYWxmSW5kZXggPSB0ZXh0LmluZGV4T2YoJyAnLCBtaWQpO1xuICAgICAgICAgICAgdmFyIGZpcnN0SGFsZkluZGV4ID0gdGV4dC5sYXN0SW5kZXhPZignICcsIG1pZCk7XG4gICAgICAgICAgICB2YXIgc3BsaXRJbmRleCA9IE1hdGguYWJzKHNlY29uZEhhbGZJbmRleCAtIG1pZCkgPCBNYXRoLmFicyhtaWQgLSBmaXJzdEhhbGZJbmRleCkgPyBzZWNvbmRIYWxmSW5kZXggOiBmaXJzdEhhbGZJbmRleDtcbiAgICAgICAgICAgIGlmIChzcGxpdEluZGV4IDwgMSkge1xuICAgICAgICAgICAgICAgIC8vIElmIHRoZXJlJ3Mgbm8gc3BhY2UgaW4gdGhlIHRleHQsIGp1c3Qgc3BsaXQgdGhlIHRleHQuIFNwbGl0IG9uIHRoZSBvdmVyZmxvdyByYXRpbyBpZiB0aGUgdG9wIGxpbmUgd2lsbFxuICAgICAgICAgICAgICAgIC8vIGhhdmUgbW9yZSBjaGFyYWN0ZXJzIHRoYW4gdGhlIGJvdHRvbSAoc28gaXQgbG9va3MgbGlrZSB0aGUgdGV4dCBuYXR1cmFsbHkgd3JhcHMpIG9yIG90aGVyd2lzZSBpbiB0aGUgbWlkZGxlLlxuICAgICAgICAgICAgICAgIHNwbGl0SW5kZXggPSBob3Jpem9udGFsUmF0aW8gPiAwLjUgPyBNYXRoLmNlaWwodGV4dC5sZW5ndGggKiBob3Jpem9udGFsUmF0aW8pIDogTWF0aC5jZWlsKHRleHQubGVuZ3RoIC8gMik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBTcGxpdCB0aGUgdGV4dCBhbmQgdGhlbiBzZWUgaG93IGl0IGZpdHMuXG4gICAgICAgICAgICBub2RlLmlubmVySFRNTCA9IHRleHQuc2xpY2UoMCwgc3BsaXRJbmRleCkgKyAnPGJyPicgKyB0ZXh0LnNsaWNlKHNwbGl0SW5kZXgpO1xuICAgICAgICAgICAgdmFyIHdyYXBwZWRIb3Jpem9udGFsUmF0aW8gPSBub2RlLmNsaWVudFdpZHRoIC8gbm9kZS5zY3JvbGxXaWR0aDtcbiAgICAgICAgICAgIGlmICh3cmFwcGVkSG9yaXpvbnRhbFJhdGlvIDwgMSkge1xuICAgICAgICAgICAgICAgICRlbGVtZW50LmNzcygnZm9udC1zaXplJywgTWF0aC5tYXgoMTAsIE1hdGguZmxvb3IocGFyc2VJbnQoJGVsZW1lbnQuY3NzKCdmb250LXNpemUnKSkgKiB3cmFwcGVkSG9yaXpvbnRhbFJhdGlvKSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gU2hyaW5rIHRoZSBjb250YWluaW5nIGJveCBwYWRkaW5nIGlmIG5lY2Vzc2FyeSB0byBmaXQgdGhlICdjb3VudCdcbiAgICAgICAgICAgIHZhciBjb3VudCA9IG5vZGUucGFyZW50Tm9kZS5xdWVyeVNlbGVjdG9yKCcuYW50ZW5uYS1yZWFjdGlvbi1jb3VudCcpO1xuICAgICAgICAgICAgaWYgKGNvdW50KSB7XG4gICAgICAgICAgICAgICAgdmFyIGFwcHJveEhlaWdodCA9IHBhcnNlSW50KCRlbGVtZW50LmNzcygnZm9udC1zaXplJykpICogMjsgLy8gQXQgdGhpcyBwb2ludCB0aGUgYnJvd3NlciB3b24ndCBnaXZlIHVzIGEgcmVhbCBoZWlnaHQsIHNvIHdlIG5lZWQgdG8gZXN0aW1hdGUgb3Vyc2VsdmVzXG4gICAgICAgICAgICAgICAgdmFyIGNsaWVudEFyZWEgPSBjb21wdXRlQXZhaWxhYmxlQ2xpZW50QXJlYShub2RlLnBhcmVudE5vZGUpO1xuICAgICAgICAgICAgICAgIHZhciByZW1haW5pbmdTcGFjZSA9IGNsaWVudEFyZWEgLSBhcHByb3hIZWlnaHQ7XG4gICAgICAgICAgICAgICAgdmFyIGNvdW50SGVpZ2h0ID0gY29tcHV0ZU5lZWRlZEhlaWdodChjb3VudCk7XG4gICAgICAgICAgICAgICAgaWYgKHJlbWFpbmluZ1NwYWNlIDwgY291bnRIZWlnaHQpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyICRwYXJlbnQgPSAkKG5vZGUucGFyZW50Tm9kZSk7XG4gICAgICAgICAgICAgICAgICAgICRwYXJlbnQuY3NzKCdwYWRkaW5nLXRvcCcsIHBhcnNlSW50KCRwYXJlbnQuY3NzKCdwYWRkaW5nLXRvcCcpKSAtICgoY291bnRIZWlnaHQtcmVtYWluaW5nU3BhY2UpLzIpICk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChvcmlnaW5hbERpc3BsYXkgPT09ICdub25lJykge1xuICAgICAgICAgICAgJHJlYWN0aW9uc1dpbmRvdy5jc3Moe2Rpc3BsYXk6ICcnLCBsZWZ0OiAnJ30pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0ZWFyZG93bjogZnVuY3Rpb24oKSB7fVxuICAgICAgICB9O1xuICAgIH07XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVBdmFpbGFibGVDbGllbnRBcmVhKG5vZGUpIHtcbiAgICB2YXIgbm9kZVN0eWxlID0gd2luZG93LmdldENvbXB1dGVkU3R5bGUobm9kZSk7XG4gICAgcmV0dXJuIHBhcnNlSW50KG5vZGVTdHlsZS5oZWlnaHQpIC0gcGFyc2VJbnQobm9kZVN0eWxlLnBhZGRpbmdUb3ApIC0gcGFyc2VJbnQobm9kZVN0eWxlLnBhZGRpbmdCb3R0b20pO1xufVxuXG5mdW5jdGlvbiBjb21wdXRlTmVlZGVkSGVpZ2h0KG5vZGUpIHtcbiAgICB2YXIgbm9kZVN0eWxlID0gd2luZG93LmdldENvbXB1dGVkU3R5bGUobm9kZSk7XG4gICAgcmV0dXJuIHBhcnNlSW50KG5vZGVTdHlsZS5oZWlnaHQpICsgcGFyc2VJbnQobm9kZVN0eWxlLm1hcmdpblRvcCkgKyBwYXJzZUludChub2RlU3R5bGUubWFyZ2luQm90dG9tKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgc2l6ZVRvRml0OiBzaXplUmVhY3Rpb25UZXh0VG9GaXQsXG4gICAgY29tcHV0ZUxheW91dERhdGE6IGNvbXB1dGVMYXlvdXREYXRhXG59OyIsInZhciBVcmxQYXJhbXMgPSByZXF1aXJlKCcuL3VybC1wYXJhbXMnKTtcblxudmFyIHNlZ21lbnQ7XG5cbmZ1bmN0aW9uIGdldFNlZ21lbnQoZ3JvdXBTZXR0aW5ncykge1xuICAgIGlmICghc2VnbWVudCkge1xuICAgICAgICBzZWdtZW50ID0gY29tcHV0ZVNlZ21lbnQoZ3JvdXBTZXR0aW5ncyk7XG4gICAgfVxuICAgIHJldHVybiBzZWdtZW50O1xufVxuXG5mdW5jdGlvbiBjb21wdXRlU2VnbWVudChncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIHNlZ21lbnRPdmVycmlkZSA9IFVybFBhcmFtcy5nZXRVcmxQYXJhbXMoKVsnYW50ZW5uYVNlZ21lbnQnXTtcbiAgICBpZiAoc2VnbWVudE92ZXJyaWRlKSB7XG4gICAgICAgIHN0b3JlU2VnbWVudChzZWdtZW50T3ZlcnJpZGUpO1xuICAgICAgICByZXR1cm4gc2VnbWVudE92ZXJyaWRlO1xuICAgIH1cbiAgICB2YXIgc2VnbWVudCA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdhbnRfc2VnbWVudCcpO1xuICAgIGlmICghc2VnbWVudCAmJiAoZ3JvdXBTZXR0aW5ncy5ncm91cElkKCkgPT09IDM3MTQgfHwgZ3JvdXBTZXR0aW5ncy5ncm91cElkKCkgPT09IDIpKSB7XG4gICAgICAgIHNlZ21lbnQgPSBjcmVhdGVTZWdtZW50KGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICBzdG9yZVNlZ21lbnQoc2VnbWVudCk7XG4gICAgfVxuICAgIHJldHVybiBzZWdtZW50O1xufVxuXG5mdW5jdGlvbiBjcmVhdGVTZWdtZW50KGdyb3VwU2V0dGluZ3MpIHtcbiAgICAvLyBUT0RPOiBsZXQgZ3JvdXAgc2V0dGluZ3MgY29udHJvbCB0aGUgc2VnbWVudHNcbiAgICB2YXIgc2VnbWVudHMgPSBbICdhbycsICdybScsICdybV9jcicgXTtcbiAgICByZXR1cm4gc2VnbWVudHNbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMyldO1xufVxuXG5mdW5jdGlvbiBzdG9yZVNlZ21lbnQoc2VnbWVudCkge1xuICAgIHRyeSB7XG4gICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdhbnRfc2VnbWVudCcsIHNlZ21lbnQpO1xuICAgIH0gY2F0Y2goZXJyb3IpIHtcbiAgICAgICAgLy8gU29tZSBicm93c2VycyAobW9iaWxlIFNhZmFyaSkgdGhyb3cgYW4gZXhjZXB0aW9uIHdoZW4gaW4gcHJpdmF0ZSBicm93c2luZyBtb2RlLlxuICAgICAgICAvLyBOb3RoaW5nIHdlIGNhbiBkbyBhYm91dCBpdC4gSnVzdCBmYWxsIHRocm91Z2ggYW5kIHJldHVybiB0aGUgdmFsdWUgd2UgZ2VuZXJhdGVkLlxuICAgIH1cbn1cblxuZnVuY3Rpb24gaXNJbkNvbnRlbnRSZWNTZWdtZW50KGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgc2VnbWVudCA9IGdldFNlZ21lbnQoZ3JvdXBTZXR0aW5ncyk7XG4gICAgcmV0dXJuIHNlZ21lbnQgPT09ICdybV9jcic7XG59XG5cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgZ2V0U2VnbWVudDogZ2V0U2VnbWVudCxcbiAgICBpc0luQ29udGVudFJlY1NlZ21lbnQ6IGlzSW5Db250ZW50UmVjU2VnbWVudFxufTsiLCJ2YXIgQ2FsbGJhY2tTdXBwb3J0ID0gcmVxdWlyZSgnLi9jYWxsYmFjay1zdXBwb3J0Jyk7XG5cbi8vIFRoaXMgbW9kdWxlIGFsbG93cyB1cyB0byByZWdpc3RlciBjYWxsYmFja3MgdGhhdCBhcmUgdGhyb3R0bGVkIGluIHRoZWlyIGZyZXF1ZW5jeS4gVGhpcyBpcyB1c2VmdWwgZm9yIGV2ZW50cyBsaWtlXG4vLyByZXNpemUgYW5kIHNjcm9sbCwgd2hpY2ggY2FuIGJlIGZpcmVkIGF0IGFuIGV4dHJlbWVseSBoaWdoIHJhdGUuXG5cbnZhciB0aHJvdHRsZWRMaXN0ZW5lcnMgPSB7fTtcblxuZnVuY3Rpb24gb24odHlwZSwgY2FsbGJhY2spIHtcbiAgICB0aHJvdHRsZWRMaXN0ZW5lcnNbdHlwZV0gPSB0aHJvdHRsZWRMaXN0ZW5lcnNbdHlwZV0gfHwgY3JlYXRlVGhyb3R0bGVkTGlzdGVuZXIodHlwZSk7XG4gICAgdGhyb3R0bGVkTGlzdGVuZXJzW3R5cGVdLmFkZENhbGxiYWNrKGNhbGxiYWNrKTtcbn1cblxuZnVuY3Rpb24gb2ZmKHR5cGUsIGNhbGxiYWNrKSB7XG4gICAgdmFyIGV2ZW50TGlzdGVuZXIgPSB0aHJvdHRsZWRMaXN0ZW5lcnNbdHlwZV07XG4gICAgaWYgKGV2ZW50TGlzdGVuZXIpIHtcbiAgICAgICAgZXZlbnRMaXN0ZW5lci5yZW1vdmVDYWxsYmFjayhjYWxsYmFjayk7XG4gICAgICAgIGlmIChldmVudExpc3RlbmVyLmlzRW1wdHkoKSkge1xuICAgICAgICAgICAgZXZlbnRMaXN0ZW5lci50ZWFyZG93bigpO1xuICAgICAgICAgICAgZGVsZXRlIHRocm90dGxlZExpc3RlbmVyc1t0eXBlXTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLy8gQ3JlYXRlcyBhIGxpc3RlbmVyIG9uIHRoZSBwYXJ0aWN1bGFyIGV2ZW50IHR5cGUuIENhbGxiYWNrcyBhZGRlZCB0byB0aGlzIGxpc3RlbmVyIHdpbGwgYmUgdGhyb3R0bGVkLlxuZnVuY3Rpb24gY3JlYXRlVGhyb3R0bGVkTGlzdGVuZXIodHlwZSkge1xuICAgIHZhciBjYWxsYmFja3MgPSBDYWxsYmFja1N1cHBvcnQuY3JlYXRlKCk7XG4gICAgdmFyIGV2ZW50VGltZW91dDtcbiAgICBzZXR1cCgpO1xuICAgIHJldHVybiB7XG4gICAgICAgIGFkZENhbGxiYWNrOiBjYWxsYmFja3MuYWRkLFxuICAgICAgICByZW1vdmVDYWxsYmFjazogY2FsbGJhY2tzLnJlbW92ZSxcbiAgICAgICAgaXNFbXB0eTogY2FsbGJhY2tzLmlzRW1wdHksXG4gICAgICAgIHRlYXJkb3duOiB0ZWFyZG93blxuICAgIH07XG5cbiAgICBmdW5jdGlvbiBoYW5kbGVFdmVudCgpIHtcbiAgICAgICBpZiAoIWV2ZW50VGltZW91dCkge1xuICAgICAgICAgICBldmVudFRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgY2FsbGJhY2tzLmludm9rZUFsbCgpO1xuICAgICAgICAgICAgICAgZXZlbnRUaW1lb3V0ID0gbnVsbDtcbiAgICAgICAgICAgfSwgNjYpOyAvLyAxNSBGUFNcbiAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2V0dXAoKSB7XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKHR5cGUsIGhhbmRsZUV2ZW50KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB0ZWFyZG93bigpIHtcbiAgICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIodHlwZSwgaGFuZGxlRXZlbnQpO1xuICAgIH1cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIG9uOiBvbixcbiAgICBvZmY6IG9mZlxufTsiLCJcbi8vIFRPRE86IENvbnNpZGVyIGFkZGluZyBzdXBwb3J0IGZvciB0aGUgTVMgcHJvcHJpZXRhcnkgXCJQb2ludGVyIEV2ZW50c1wiIEFQSS5cblxuLy8gU2V0cyB1cCB0aGUgZ2l2ZW4gZWxlbWVudCB0byBiZSBjYWxsZWQgd2l0aCBhIFRvdWNoRXZlbnQgdGhhdCB3ZSByZWNvZ25pemUgYXMgYSB0YXAuXG5mdW5jdGlvbiBzZXR1cFRvdWNoVGFwRXZlbnRzKGVsZW1lbnQsIGNhbGxiYWNrKSB7XG4gICAgdmFyIHRpbWVvdXQgPSA0MDA7IC8vIFRoaXMgaXMgdGhlIHRpbWUgYmV0d2VlbiB0b3VjaHN0YXJ0IGFuZCB0b3VjaGVuZCB0aGF0IHdlIHVzZSB0byBkaXN0aW5ndWlzaCBhIHRhcCBmcm9tIGEgbG9uZyBwcmVzcy5cbiAgICB2YXIgdmFsaWRUYXAgPSBmYWxzZTtcbiAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0b3VjaFN0YXJ0KTtcbiAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIHRvdWNoTW92ZSk7XG4gICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGNhbmNlbCcsIHRvdWNoQ2FuY2VsKTtcbiAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgdG91Y2hFbmQpO1xuICAgIHJldHVybiB7XG4gICAgICAgIHRlYXJkb3duOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRvdWNoU3RhcnQpO1xuICAgICAgICAgICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCB0b3VjaE1vdmUpO1xuICAgICAgICAgICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaGNhbmNlbCcsIHRvdWNoQ2FuY2VsKTtcbiAgICAgICAgICAgIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCB0b3VjaEVuZCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gdG91Y2hTdGFydChldmVudCkge1xuICAgICAgICB2YWxpZFRhcCA9IHRydWU7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YWxpZFRhcCA9IGZhbHNlO1xuICAgICAgICB9LCB0aW1lb3V0KTtcbiAgICB9XG4gICAgZnVuY3Rpb24gdG91Y2hFbmQoZXZlbnQpIHtcbiAgICAgICAgaWYgKHZhbGlkVGFwICYmIGV2ZW50LmNoYW5nZWRUb3VjaGVzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgY2FsbGJhY2soZXZlbnQpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIHRvdWNoTW92ZShldmVudCkge1xuICAgICAgICB2YWxpZFRhcCA9IGZhbHNlO1xuICAgIH1cbiAgICBmdW5jdGlvbiB0b3VjaENhbmNlbChldmVudCkge1xuICAgICAgICB2YWxpZFRhcCA9IGZhbHNlO1xuICAgIH1cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHNldHVwVGFwOiBzZXR1cFRvdWNoVGFwRXZlbnRzXG59OyIsIlxuXG5mdW5jdGlvbiB0b2dnbGVUcmFuc2l0aW9uQ2xhc3MoJGVsZW1lbnQsIGNsYXNzTmFtZSwgc3RhdGUsIG5leHRTdGVwKSB7XG4gICAgJGVsZW1lbnQub24oXCJ0cmFuc2l0aW9uZW5kIHdlYmtpdFRyYW5zaXRpb25FbmQgb1RyYW5zaXRpb25FbmQgTVNUcmFuc2l0aW9uRW5kXCIsXG4gICAgICAgIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICAvLyBvbmNlIHRoZSBDU1MgdHJhbnNpdGlvbiBpcyBjb21wbGV0ZSwgY2FsbCBvdXIgbmV4dCBzdGVwXG4gICAgICAgICAgICAvLyBTZWU6IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvOTI1NTI3OS9jYWxsYmFjay13aGVuLWNzczMtdHJhbnNpdGlvbi1maW5pc2hlc1xuICAgICAgICAgICAgaWYgKGV2ZW50LnRhcmdldCA9PSBldmVudC5jdXJyZW50VGFyZ2V0KSB7XG4gICAgICAgICAgICAgICAgJGVsZW1lbnQub2ZmKFwidHJhbnNpdGlvbmVuZCB3ZWJraXRUcmFuc2l0aW9uRW5kIG9UcmFuc2l0aW9uRW5kIE1TVHJhbnNpdGlvbkVuZFwiKTtcbiAgICAgICAgICAgICAgICBpZiAobmV4dFN0ZXApIHtcbiAgICAgICAgICAgICAgICAgICAgbmV4dFN0ZXAoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICApO1xuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIFRoaXMgd29ya2Fyb3VuZCBnZXRzIHVzIGNvbnNpc3RlbnQgdHJhbnNpdGlvbmVuZCBldmVudHMsIHdoaWNoIGNhbiBvdGhlcndpc2UgYmUgZmxha3kgaWYgd2UncmUgc2V0dGluZyBvdGhlclxuICAgICAgICAvLyBjbGFzc2VzIGF0IHRoZSBzYW1lIHRpbWUgYXMgdHJhbnNpdGlvbiBjbGFzc2VzLlxuICAgICAgICAkZWxlbWVudC50b2dnbGVDbGFzcyhjbGFzc05hbWUsIHN0YXRlKTtcbiAgICB9LCAyMCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHRvZ2dsZUNsYXNzOiB0b2dnbGVUcmFuc2l0aW9uQ2xhc3Ncbn07IiwidmFyIFBST0RfU0VSVkVSX1VSTCA9IFwiaHR0cHM6Ly93d3cuYW50ZW5uYS5pc1wiOyAvLyBUT0RPOiB3d3c/IGhvdyBhYm91dCBhbnRlbm5hLmlzIG9yIGFwaS5hbnRlbm5hLmlzP1xudmFyIERFVl9TRVJWRVJfVVJMID0gXCJodHRwOi8vbG9jYWwtc3RhdGljLmFudGVubmEuaXM6ODA4MVwiO1xudmFyIFRFU1RfU0VSVkVSX1VSTCA9ICdodHRwOi8vbG9jYWxob3N0OjMwMDEnO1xudmFyIEFNQVpPTl9TM19VUkwgPSAnLy9zMy5hbWF6b25hd3MuY29tL3JlYWRyYm9hcmQnO1xuXG52YXIgUFJPRF9FVkVOVF9TRVJWRVJfVVJMID0gJ2h0dHA6Ly9ldmVudHMuYW50ZW5uYS5pcyc7XG52YXIgREVWX0VWRU5UX1NFUlZFUl9VUkwgPSAnaHR0cDovL25vZGVicS5kb2NrZXI6MzAwMCc7XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBQUk9EVUNUSU9OOiBQUk9EX1NFUlZFUl9VUkwsXG4gICAgREVWRUxPUE1FTlQ6IERFVl9TRVJWRVJfVVJMLFxuICAgIFRFU1Q6IFRFU1RfU0VSVkVSX1VSTCxcbiAgICBBTUFaT05fUzM6IEFNQVpPTl9TM19VUkwsXG4gICAgUFJPRFVDVElPTl9FVkVOVFM6IFBST0RfRVZFTlRfU0VSVkVSX1VSTCxcbiAgICBERVZFTE9QTUVOVF9FVkVOVFM6IERFVl9FVkVOVF9TRVJWRVJfVVJMXG59OyIsIlxudmFyIHVybFBhcmFtcztcblxuZnVuY3Rpb24gZ2V0VXJsUGFyYW1zKCkge1xuICAgIGlmICghdXJsUGFyYW1zKSB7XG4gICAgICAgIHVybFBhcmFtcyA9IHBhcnNlVXJsUGFyYW1zKCk7XG4gICAgfVxuICAgIHJldHVybiB1cmxQYXJhbXM7XG59XG5cbmZ1bmN0aW9uIHBhcnNlVXJsUGFyYW1zKCkge1xuICAgIHZhciBxdWVyeVN0cmluZyA9IHdpbmRvdy5sb2NhdGlvbi5zZWFyY2g7XG4gICAgdmFyIHVybFBhcmFtcyA9IHt9O1xuICAgIHZhciBlLFxuICAgIGEgPSAvXFwrL2csICAvLyBSZWdleCBmb3IgcmVwbGFjaW5nIGFkZGl0aW9uIHN5bWJvbCB3aXRoIGEgc3BhY2VcbiAgICByID0gLyhbXiY9XSspPT8oW14mXSopL2csXG4gICAgZCA9IGZ1bmN0aW9uIChzKSB7IHJldHVybiBkZWNvZGVVUklDb21wb25lbnQocy5yZXBsYWNlKGEsIFwiIFwiKSk7IH0sXG4gICAgcSA9IHF1ZXJ5U3RyaW5nLnN1YnN0cmluZygxKTtcblxuICAgIHdoaWxlIChlID0gci5leGVjKHEpKSB7XG4gICAgICAgIHVybFBhcmFtc1tkKGVbMV0pXSA9IGQoZVsyXSk7XG4gICAgfVxuICAgIHJldHVybiB1cmxQYXJhbXM7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGdldFVybFBhcmFtczogZ2V0VXJsUGFyYW1zXG59OyIsInZhciBBcHBNb2RlID0gcmVxdWlyZSgnLi9hcHAtbW9kZScpO1xudmFyIFVSTENvbnN0YW50cyA9IHJlcXVpcmUoJy4vdXJsLWNvbnN0YW50cycpO1xuXG5mdW5jdGlvbiBnZXRHcm91cFNldHRpbmdzVXJsKCkge1xuICAgIHJldHVybiAnL2FwaS9zZXR0aW5ncy8nO1xufVxuXG5mdW5jdGlvbiBnZXRQYWdlRGF0YVVybCgpIHtcbiAgICByZXR1cm4gJy9hcGkvcGFnZW5ld2VyLyc7XG59XG5cbmZ1bmN0aW9uIGdldENyZWF0ZVJlYWN0aW9uVXJsKCkge1xuICAgIHJldHVybiAnL2FwaS90YWcvY3JlYXRlLyc7XG59XG5cbmZ1bmN0aW9uIGdldENyZWF0ZUNvbW1lbnRVcmwoKSB7XG4gICAgcmV0dXJuICcvYXBpL2NvbW1lbnQvY3JlYXRlLyc7XG59XG5cbmZ1bmN0aW9uIGdldEZldGNoQ29tbWVudFVybCgpIHtcbiAgICByZXR1cm4gJy9hcGkvY29tbWVudC9yZXBsaWVzLyc7XG59XG5cbmZ1bmN0aW9uIGdldEZldGNoQ29udGVudEJvZGllc1VybCgpIHtcbiAgICByZXR1cm4gJy9hcGkvY29udGVudC9ib2RpZXMvJztcbn1cblxuZnVuY3Rpb24gZ2V0RmV0Y2hDb250ZW50UmVjb21tZW5kYXRpb25VcmwoKSB7XG4gICAgcmV0dXJuICcvYXBpL2NvbnRlbnRyZWMnO1xufVxuXG5mdW5jdGlvbiBnZXRTaGFyZVJlYWN0aW9uVXJsKCkge1xuICAgIHJldHVybiAnL2FwaS9zaGFyZS87J1xufVxuXG5mdW5jdGlvbiBnZXRTaGFyZVdpbmRvd1VybCgpIHtcbiAgICByZXR1cm4gJy9zdGF0aWMvc2hhcmUuaHRtbCc7XG59XG5cbmZ1bmN0aW9uIGdldEV2ZW50VXJsKCkge1xuICAgIHJldHVybiAnL2luc2VydCc7IC8vIE5vdGUgdGhhdCB0aGlzIFVSTCBpcyBmb3IgdGhlIGV2ZW50IHNlcnZlciwgbm90IHRoZSBhcHAgc2VydmVyLlxufVxuXG5mdW5jdGlvbiBnZXRMb2dpblBhZ2VVcmwoKSB7XG4gICAgcmV0dXJuICcvc3RhdGljL3dpZGdldC1uZXcvZmJfbG9naW4uaHRtbCc7XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVJbWFnZVVybCgkZWxlbWVudCwgZ3JvdXBTZXR0aW5ncykge1xuICAgIGlmIChncm91cFNldHRpbmdzLmxlZ2FjeUJlaGF2aW9yKCkpIHtcbiAgICAgICAgcmV0dXJuIGxlZ2FjeUNvbXB1dGVJbWFnZVVybCgkZWxlbWVudCk7XG4gICAgfVxuICAgIHZhciBjb250ZW50ID0gJGVsZW1lbnQuYXR0cignYW50LWl0ZW0tY29udGVudCcpIHx8ICRlbGVtZW50LmF0dHIoJ3NyYycpO1xuICAgIGlmIChjb250ZW50ICYmIGNvbnRlbnQuaW5kZXhPZignLy8nKSAhPT0gMCAmJiBjb250ZW50LmluZGV4T2YoJ2h0dHAnKSAhPT0gMCkgeyAvLyBwcm90b2NvbC1yZWxhdGl2ZSBvciBhYnNvbHV0ZSB1cmwsIGUuZy4gLy9kb21haW4uY29tL2Zvby9iYXIucG5nIG9yIGh0dHA6Ly9kb21haW4uY29tL2Zvby9iYXIvcG5nXG4gICAgICAgIGlmIChjb250ZW50LmluZGV4T2YoJy8nKSA9PT0gMCkgeyAvLyBkb21haW4tcmVsYXRpdmUgdXJsLCBlLmcuIC9mb28vYmFyLnBuZyA9PiBkb21haW4uY29tL2Zvby9iYXIucG5nXG4gICAgICAgICAgICBjb250ZW50ID0gd2luZG93LmxvY2F0aW9uLm9yaWdpbiArIGNvbnRlbnQ7XG4gICAgICAgIH0gZWxzZSB7IC8vIHBhdGgtcmVsYXRpdmUgdXJsLCBlLmcuIGJhci5wbmcgPT4gZG9tYWluLmNvbS9iYXovYmFyLnBuZ1xuICAgICAgICAgICAgdmFyIHBhdGggPSB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWU7XG4gICAgICAgICAgICB2YXIgaW5kZXggPSBwYXRoLmxhc3RJbmRleE9mKCcvJykgKyAxO1xuICAgICAgICAgICAgaWYgKHBhdGgubGVuZ3RoID4gaW5kZXgpIHtcbiAgICAgICAgICAgICAgICBwYXRoID0gcGF0aC5zdWJzdHJpbmcoMCwgaW5kZXgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29udGVudCA9IHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4gKyBwYXRoICsgY29udGVudDtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gY29udGVudDtcbn1cblxuLy8gTGVnYWN5IGltcGxlbWVudGF0aW9uIHdoaWNoIG1haW50YWlucyB0aGUgb2xkIGJlaGF2aW9yIG9mIGVuZ2FnZV9mdWxsXG4vLyBUaGlzIGNvZGUgaXMgd3JvbmcgZm9yIFVSTHMgdGhhdCBzdGFydCB3aXRoIFwiLy9cIi4gSXQgYWxzbyBnaXZlcyBwcmVjZWRlbmNlIHRvIHRoZSBzcmMgYXR0IGluc3RlYWQgb2YgYW50LWl0ZW0tY29udGVudFxuZnVuY3Rpb24gbGVnYWN5Q29tcHV0ZUltYWdlVXJsKCRlbGVtZW50KSB7XG4gICAgdmFyIGNvbnRlbnQgPSAkZWxlbWVudC5hdHRyKCdzcmMnKSB8fCAkZWxlbWVudC5hdHRyKCdhbnQtaXRlbS1jb250ZW50Jyk7XG4gICAgaWYgKGNvbnRlbnQpIHtcbiAgICAgICAgaWYgKGNvbnRlbnQuaW5kZXhPZignLycpID09PSAwKSB7XG4gICAgICAgICAgICBjb250ZW50ID0gd2luZG93LmxvY2F0aW9uLm9yaWdpbiArIGNvbnRlbnQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvbnRlbnQuaW5kZXhPZignaHR0cCcpICE9PSAwKSB7XG4gICAgICAgICAgICBjb250ZW50ID0gd2luZG93LmxvY2F0aW9uLm9yaWdpbiArIHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZSArIGNvbnRlbnQ7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGNvbnRlbnQ7XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVNZWRpYVVybCgkZWxlbWVudCwgZ3JvdXBTZXR0aW5ncykge1xuICAgIGlmIChncm91cFNldHRpbmdzLmxlZ2FjeUJlaGF2aW9yKCkpIHtcbiAgICAgICAgcmV0dXJuIGxlZ2FjeUNvbXB1dGVNZWRpYVVybCgkZWxlbWVudCk7XG4gICAgfVxuICAgIHZhciBjb250ZW50ID0gJGVsZW1lbnQuYXR0cignYW50LWl0ZW0tY29udGVudCcpIHx8ICRlbGVtZW50LmF0dHIoJ3NyYycpIHx8ICRlbGVtZW50LmF0dHIoJ2RhdGEnKTtcbiAgICBpZiAoY29udGVudCAmJiBjb250ZW50LmluZGV4T2YoJy8vJykgIT09IDAgJiYgY29udGVudC5pbmRleE9mKCdodHRwJykgIT09IDApIHsgLy8gcHJvdG9jb2wtcmVsYXRpdmUgb3IgYWJzb2x1dGUgdXJsLCBlLmcuIC8vZG9tYWluLmNvbS9mb28vYmFyLnBuZyBvciBodHRwOi8vZG9tYWluLmNvbS9mb28vYmFyL3BuZ1xuICAgICAgICBpZiAoY29udGVudC5pbmRleE9mKCcvJykgPT09IDApIHsgLy8gZG9tYWluLXJlbGF0aXZlIHVybCwgZS5nLiAvZm9vL2Jhci5wbmcgPT4gZG9tYWluLmNvbS9mb28vYmFyLnBuZ1xuICAgICAgICAgICAgY29udGVudCA9IHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4gKyBjb250ZW50O1xuICAgICAgICB9IGVsc2UgeyAvLyBwYXRoLXJlbGF0aXZlIHVybCwgZS5nLiBiYXIucG5nID0+IGRvbWFpbi5jb20vYmF6L2Jhci5wbmdcbiAgICAgICAgICAgIHZhciBwYXRoID0gd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lO1xuICAgICAgICAgICAgdmFyIGluZGV4ID0gcGF0aC5sYXN0SW5kZXhPZignLycpICsgMTtcbiAgICAgICAgICAgIGlmIChwYXRoLmxlbmd0aCA+IGluZGV4KSB7XG4gICAgICAgICAgICAgICAgcGF0aCA9IHBhdGguc3Vic3RyaW5nKDAsIGluZGV4KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnRlbnQgPSB3aW5kb3cubG9jYXRpb24ub3JpZ2luICsgcGF0aCArIGNvbnRlbnQ7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGNvbnRlbnQ7XG59XG5cbi8vIExlZ2FjeSBpbXBsZW1lbnRhdGlvbiB3aGljaCBtYWludGFpbnMgdGhlIG9sZCBiZWhhdmlvciBvZiBlbmdhZ2VfZnVsbFxuLy8gVGhpcyBjb2RlIGlzIHdyb25nIGZvciBVUkxzIHRoYXQgc3RhcnQgd2l0aCBcIi8vXCIuIEl0IGFsc28gZ2l2ZXMgcHJlY2VkZW5jZSB0byB0aGUgc3JjIGF0dCBpbnN0ZWFkIG9mIGFudC1pdGVtLWNvbnRlbnRcbmZ1bmN0aW9uIGxlZ2FjeUNvbXB1dGVNZWRpYVVybCgkZWxlbWVudCkge1xuICAgIHZhciBjb250ZW50ID0gJGVsZW1lbnQuYXR0cignYW50LWl0ZW0tY29udGVudCcpIHx8ICRlbGVtZW50LmF0dHIoJ3NyYycpIHx8ICRlbGVtZW50LmF0dHIoJ2RhdGEnKSB8fCAnJztcbiAgICBpZiAoY29udGVudCkge1xuICAgICAgICBpZiAoY29udGVudC5pbmRleE9mKCcvJykgPT09IDApIHtcbiAgICAgICAgICAgIGNvbnRlbnQgPSB3aW5kb3cubG9jYXRpb24ub3JpZ2luICsgY29udGVudDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY29udGVudC5pbmRleE9mKCdodHRwJykgIT09IDApIHtcbiAgICAgICAgICAgIGNvbnRlbnQgPSB3aW5kb3cubG9jYXRpb24ub3JpZ2luICsgd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lICsgY29udGVudDtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gY29udGVudDtcbn1cblxuZnVuY3Rpb24gYW1hem9uUzNVcmwoKSB7XG4gICAgcmV0dXJuIFVSTENvbnN0YW50cy5BTUFaT05fUzM7XG59XG5cbi8vIFRPRE86IHJlZmFjdG9yIHVzYWdlIG9mIGFwcCBzZXJ2ZXIgdXJsICsgcmVsYXRpdmUgcm91dGVzXG5mdW5jdGlvbiBhcHBTZXJ2ZXJVcmwoKSB7XG4gICAgaWYgKEFwcE1vZGUudGVzdCkge1xuICAgICAgICByZXR1cm4gVVJMQ29uc3RhbnRzLlRFU1Q7XG4gICAgfSBlbHNlIGlmIChBcHBNb2RlLm9mZmxpbmUpIHtcbiAgICAgICAgcmV0dXJuIFVSTENvbnN0YW50cy5ERVZFTE9QTUVOVDtcbiAgICB9XG4gICAgcmV0dXJuIFVSTENvbnN0YW50cy5QUk9EVUNUSU9OO1xufVxuXG4vLyBUT0RPOiByZWZhY3RvciB1c2FnZSBvZiBldmVudHMgc2VydmVyIHVybCArIHJlbGF0aXZlIHJvdXRlc1xuZnVuY3Rpb24gZXZlbnRzU2VydmVyVXJsKCkge1xuICAgIGlmIChBcHBNb2RlLm9mZmxpbmUpIHtcbiAgICAgICAgcmV0dXJuIFVSTENvbnN0YW50cy5ERVZFTE9QTUVOVF9FVkVOVFM7XG4gICAgfVxuICAgIHJldHVybiBVUkxDb25zdGFudHMuUFJPRFVDVElPTl9FVkVOVFM7XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBhcHBTZXJ2ZXJVcmw6IGFwcFNlcnZlclVybCxcbiAgICBldmVudHNTZXJ2ZXJVcmw6IGV2ZW50c1NlcnZlclVybCxcbiAgICBhbWF6b25TM1VybDogYW1hem9uUzNVcmwsXG4gICAgZ3JvdXBTZXR0aW5nc1VybDogZ2V0R3JvdXBTZXR0aW5nc1VybCxcbiAgICBwYWdlRGF0YVVybDogZ2V0UGFnZURhdGFVcmwsXG4gICAgY3JlYXRlUmVhY3Rpb25Vcmw6IGdldENyZWF0ZVJlYWN0aW9uVXJsLFxuICAgIGNyZWF0ZUNvbW1lbnRVcmw6IGdldENyZWF0ZUNvbW1lbnRVcmwsXG4gICAgZmV0Y2hDb21tZW50VXJsOiBnZXRGZXRjaENvbW1lbnRVcmwsXG4gICAgZmV0Y2hDb250ZW50Qm9kaWVzVXJsOiBnZXRGZXRjaENvbnRlbnRCb2RpZXNVcmwsXG4gICAgZmV0Y2hDb250ZW50UmVjb21tZW5kYXRpb25Vcmw6IGdldEZldGNoQ29udGVudFJlY29tbWVuZGF0aW9uVXJsLFxuICAgIHNoYXJlUmVhY3Rpb25Vcmw6IGdldFNoYXJlUmVhY3Rpb25VcmwsXG4gICAgc2hhcmVXaW5kb3dVcmw6IGdldFNoYXJlV2luZG93VXJsLFxuICAgIGxvZ2luUGFnZVVybDogZ2V0TG9naW5QYWdlVXJsLFxuICAgIGNvbXB1dGVJbWFnZVVybDogY29tcHV0ZUltYWdlVXJsLFxuICAgIGNvbXB1dGVNZWRpYVVybDogY29tcHV0ZU1lZGlhVXJsLFxuICAgIGV2ZW50VXJsOiBnZXRFdmVudFVybFxufTtcbiIsInZhciBBcHBNb2RlID0gcmVxdWlyZSgnLi9hcHAtbW9kZScpO1xudmFyIFhETUNsaWVudCA9IHJlcXVpcmUoJy4veGRtLWNsaWVudCcpO1xuXG52YXIgY2FjaGVkVXNlckluZm87XG5cbi8vIEZldGNoIHRoZSBsb2dnZWQgaW4gdXNlci4gV2lsbCB0cmlnZ2VyIGEgbmV0d29yayByZXF1ZXN0IHRvIGNyZWF0ZSBhIHRlbXBvcmFyeSB1c2VyIGlmIG5lZWRlZC5cbmZ1bmN0aW9uIGZldGNoVXNlcihjYWxsYmFjaykge1xuICAgIFhETUNsaWVudC5mZXRjaFVzZXIoZnVuY3Rpb24gKHVzZXJJbmZvKSB7XG4gICAgICAgIGNhY2hlZFVzZXJJbmZvID0gdXNlckluZm87XG4gICAgICAgIGNhbGxiYWNrKHVzZXJJbmZvKTtcbiAgICB9KTtcbn1cblxuLy8gUmV0dXJucyB0aGUgbG9nZ2VkLWluIHVzZXIsIGlmIHdlIGFscmVhZHkgaGF2ZSBvbmUuIFdpbGwgbm90IHRyaWdnZXIgYSBuZXR3b3JrIHJlcXVlc3QuXG5mdW5jdGlvbiBjYWNoZWRVc2VyKGNhbGxiYWNrKSB7XG4gICAgY2FsbGJhY2soY2FjaGVkVXNlckluZm8pO1xufVxuXG4vLyBBdHRlbXB0cyB0byBjcmVhdGUgYSBuZXcgYXV0aG9yaXphdGlvbiB0b2tlbiBmb3IgdGhlIGxvZ2dlZC1pbiB1c2VyLlxuZnVuY3Rpb24gcmVBdXRob3JpemVVc2VyKGNhbGxiYWNrKSB7XG4gICAgdmFyIG9sZFRva2VuID0gY2FjaGVkVXNlckluZm8gPyBjYWNoZWRVc2VySW5mby5hbnRfdG9rZW4gOiB1bmRlZmluZWQ7XG4gICAgWERNQ2xpZW50LnJlQXV0aG9yaXplVXNlcihmdW5jdGlvbiAodXNlckluZm8pIHtcbiAgICAgICAgY2FjaGVkVXNlckluZm8gPSB1c2VySW5mbztcbiAgICAgICAgdmFyIGhhc05ld1Rva2VuID0gdXNlckluZm8gJiYgdXNlckluZm8uYW50X3Rva2VuICYmIHVzZXJJbmZvLmFudF90b2tlbiAhPT0gb2xkVG9rZW47XG4gICAgICAgIGNhbGxiYWNrKGhhc05ld1Rva2VuKTtcbiAgICB9KTtcbn1cblxuLy8gVE9ETzogRmlndXJlIG91dCBob3cgbWFueSBkaWZmZXJlbnQgZm9ybWF0cyBvZiB1c2VyIGRhdGEgd2UgaGF2ZSBhbmQgZWl0aGVyIHVuaWZ5IHRoZW0gb3IgcHJvdmlkZSBjbGVhclxuLy8gICAgICAgQVBJIGhlcmUgdG8gdHJhbnNsYXRlIGVhY2ggdmFyaWF0aW9uIGludG8gc29tZXRoaW5nIHN0YW5kYXJkIGZvciB0aGUgY2xpZW50LlxuLy8gVE9ETzogSGF2ZSBYRE1DbGllbnQgcGFzcyB0aHJvdWdoIHRoaXMgbW9kdWxlIGFzIHdlbGwuXG5mdW5jdGlvbiB1c2VyRnJvbUNvbW1lbnRKU09OKGpzb25Vc2VyLCBzb2NpYWxVc2VyKSB7IC8vIFRoaXMgZm9ybWF0IHdvcmtzIGZvciB0aGUgdXNlciByZXR1cm5lZCBmcm9tIC9hcGkvY29tbWVudHMvcmVwbGllc1xuICAgIHZhciB1c2VyID0ge307XG4gICAgaWYgKGpzb25Vc2VyLnVzZXJfaWQpIHtcbiAgICAgICAgdXNlci5pZCA9IGpzb25Vc2VyLnVzZXJfaWQ7XG4gICAgfVxuICAgIGlmIChzb2NpYWxVc2VyKSB7XG4gICAgICAgIHVzZXIuaW1hZ2VVUkwgPSBzb2NpYWxVc2VyLmltZ191cmw7XG4gICAgICAgIHVzZXIubmFtZSA9IHNvY2lhbFVzZXIuZnVsbF9uYW1lO1xuICAgIH1cbiAgICBpZiAoIXVzZXIubmFtZSkge1xuICAgICAgICB1c2VyLm5hbWUgPSBqc29uVXNlci5maXJzdF9uYW1lID8gKGpzb25Vc2VyLmZpcnN0X25hbWUgKyAnICcgKyBqc29uVXNlci5sYXN0X25hbWUpIDogJ0Fub255bW91cyc7XG4gICAgfVxuICAgIGlmICghdXNlci5pbWFnZVVSTCkge1xuICAgICAgICB1c2VyLmltYWdlVVJMID0gYW5vbnltb3VzSW1hZ2VVUkwoKVxuICAgIH1cbiAgICByZXR1cm4gdXNlcjtcbn1cblxuXG4vLyBUT0RPOiBSZXZpc2l0IHRoZSB1c2VyIHRoYXQgd2UgcGFzcyBiYWNrIGZvciBuZXcgY29tbWVudHMuIE9wdGlvbnMgYXJlOlxuLy8gICAgICAgMS4gVXNlIHRoZSBsb2dnZWQgaW4gdXNlciwgYXNzdW1pbmcgdGhlIGNhY2hlZCB1c2VyIGhhcyBzb2NpYWxfdXNlciBpbmZvXG4vLyAgICAgICAyLiBVc2UgYSBnZW5lcmljIFwieW91XCIgcmVwcmVzZW50YXRpb24gbGlrZSB3ZSdyZSBkb2luZyBub3cuXG4vLyAgICAgICAzLiBEb24ndCBzaG93IGFueSBpbmRpY2F0aW9uIG9mIHRoZSB1c2VyLiBKdXN0IHNob3cgdGhlIGNvbW1lbnQuXG4vLyAgICAgICBGb3Igbm93LCB0aGlzIGlzIGp1c3QgZ2l2aW5nIHVzIHNvbWUgbm90aW9uIG9mIHVzZXIgd2l0aG91dCBhIHJvdW5kIHRyaXAuXG5mdW5jdGlvbiBvcHRpbWlzdGljQ29tbWVudFVzZXIoKSB7XG4gICAgdmFyIHVzZXIgPSB7XG4gICAgICAgIG5hbWU6ICdZb3UnLFxuICAgICAgICBpbWFnZVVSTDogYW5vbnltb3VzSW1hZ2VVUkwoKVxuICAgIH07XG4gICAgcmV0dXJuIHVzZXI7XG59XG5cbmZ1bmN0aW9uIGFub255bW91c0ltYWdlVVJMKCkge1xuICAgIHJldHVybiBBcHBNb2RlLm9mZmxpbmUgPyAnL3N0YXRpYy93aWRnZXQvaW1hZ2VzL2Fub255bW91c3Bsb2RlLnBuZycgOiAnaHR0cDovL3MzLmFtYXpvbmF3cy5jb20vcmVhZHJib2FyZC93aWRnZXQvaW1hZ2VzL2Fub255bW91c3Bsb2RlLnBuZyc7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGZyb21Db21tZW50SlNPTjogdXNlckZyb21Db21tZW50SlNPTixcbiAgICBvcHRpbWlzdGljQ29tbWVudFVzZXI6IG9wdGltaXN0aWNDb21tZW50VXNlcixcbiAgICBmZXRjaFVzZXI6IGZldGNoVXNlcixcbiAgICBjYWNoZWRVc2VyOiBjYWNoZWRVc2VyLFxuICAgIHJlQXV0aG9yaXplVXNlcjogcmVBdXRob3JpemVVc2VyXG59OyIsIi8qKlxuICogQXV0aG9yOiBKYXNvbiBGYXJyZWxsXG4gKiBBdXRob3IgVVJJOiBodHRwOi8vdXNlYWxsZml2ZS5jb20vXG4gKlxuICogRGVzY3JpcHRpb246IENoZWNrcyBpZiBhIERPTSBlbGVtZW50IGlzIHRydWx5IHZpc2libGUuXG4gKiBQYWNrYWdlIFVSTDogaHR0cHM6Ly9naXRodWIuY29tL1VzZUFsbEZpdmUvdHJ1ZS12aXNpYmlsaXR5XG4gKi9cbmZ1bmN0aW9uIGlzVmlzaWJsZShlbGVtZW50KSB7XG5cbiAgICAvKipcbiAgICAgKiBDaGVja3MgaWYgYSBET00gZWxlbWVudCBpcyB2aXNpYmxlLiBUYWtlcyBpbnRvXG4gICAgICogY29uc2lkZXJhdGlvbiBpdHMgcGFyZW50cyBhbmQgb3ZlcmZsb3cuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gKGVsKSAgICAgIHRoZSBET00gZWxlbWVudCB0byBjaGVjayBpZiBpcyB2aXNpYmxlXG4gICAgICpcbiAgICAgKiBUaGVzZSBwYXJhbXMgYXJlIG9wdGlvbmFsIHRoYXQgYXJlIHNlbnQgaW4gcmVjdXJzaXZlbHksXG4gICAgICogeW91IHR5cGljYWxseSB3b24ndCB1c2UgdGhlc2U6XG4gICAgICpcbiAgICAgKiBAcGFyYW0gKHQpICAgICAgIFRvcCBjb3JuZXIgcG9zaXRpb24gbnVtYmVyXG4gICAgICogQHBhcmFtIChyKSAgICAgICBSaWdodCBjb3JuZXIgcG9zaXRpb24gbnVtYmVyXG4gICAgICogQHBhcmFtIChiKSAgICAgICBCb3R0b20gY29ybmVyIHBvc2l0aW9uIG51bWJlclxuICAgICAqIEBwYXJhbSAobCkgICAgICAgTGVmdCBjb3JuZXIgcG9zaXRpb24gbnVtYmVyXG4gICAgICogQHBhcmFtICh3KSAgICAgICBFbGVtZW50IHdpZHRoIG51bWJlclxuICAgICAqIEBwYXJhbSAoaCkgICAgICAgRWxlbWVudCBoZWlnaHQgbnVtYmVyXG4gICAgICovXG4gICAgZnVuY3Rpb24gX2lzVmlzaWJsZShlbCwgdCwgciwgYiwgbCwgdywgaCkge1xuICAgICAgICB2YXIgcCA9IGVsLnBhcmVudE5vZGUsXG4gICAgICAgICAgICAgICAgVklTSUJMRV9QQURESU5HID0gMjtcblxuICAgICAgICBpZiAoICFfZWxlbWVudEluRG9jdW1lbnQoZWwpICkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8tLSBSZXR1cm4gdHJ1ZSBmb3IgZG9jdW1lbnQgbm9kZVxuICAgICAgICBpZiAoIDkgPT09IHAubm9kZVR5cGUgKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vLS0gUmV0dXJuIGZhbHNlIGlmIG91ciBlbGVtZW50IGlzIGludmlzaWJsZVxuICAgICAgICBpZiAoXG4gICAgICAgICAgICAgJzAnID09PSBfZ2V0U3R5bGUoZWwsICdvcGFjaXR5JykgfHxcbiAgICAgICAgICAgICAnbm9uZScgPT09IF9nZXRTdHlsZShlbCwgJ2Rpc3BsYXknKSB8fFxuICAgICAgICAgICAgICdoaWRkZW4nID09PSBfZ2V0U3R5bGUoZWwsICd2aXNpYmlsaXR5JylcbiAgICAgICAgKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoXG4gICAgICAgICAgICAndW5kZWZpbmVkJyA9PT0gdHlwZW9mKHQpIHx8XG4gICAgICAgICAgICAndW5kZWZpbmVkJyA9PT0gdHlwZW9mKHIpIHx8XG4gICAgICAgICAgICAndW5kZWZpbmVkJyA9PT0gdHlwZW9mKGIpIHx8XG4gICAgICAgICAgICAndW5kZWZpbmVkJyA9PT0gdHlwZW9mKGwpIHx8XG4gICAgICAgICAgICAndW5kZWZpbmVkJyA9PT0gdHlwZW9mKHcpIHx8XG4gICAgICAgICAgICAndW5kZWZpbmVkJyA9PT0gdHlwZW9mKGgpXG4gICAgICAgICkge1xuICAgICAgICAgICAgdCA9IGVsLm9mZnNldFRvcDtcbiAgICAgICAgICAgIGwgPSBlbC5vZmZzZXRMZWZ0O1xuICAgICAgICAgICAgYiA9IHQgKyBlbC5vZmZzZXRIZWlnaHQ7XG4gICAgICAgICAgICByID0gbCArIGVsLm9mZnNldFdpZHRoO1xuICAgICAgICAgICAgdyA9IGVsLm9mZnNldFdpZHRoO1xuICAgICAgICAgICAgaCA9IGVsLm9mZnNldEhlaWdodDtcbiAgICAgICAgfVxuICAgICAgICAvLy0tIElmIHdlIGhhdmUgYSBwYXJlbnQsIGxldCdzIGNvbnRpbnVlOlxuICAgICAgICBpZiAoIHAgKSB7XG4gICAgICAgICAgICAvLy0tIENoZWNrIGlmIHRoZSBwYXJlbnQgY2FuIGhpZGUgaXRzIGNoaWxkcmVuLlxuICAgICAgICAgICAgaWYgKCBfb3ZlcmZsb3dIaWRkZW4ocCkgKSB7XG4gICAgICAgICAgICAgICAgLy8tLSBPbmx5IGNoZWNrIGlmIHRoZSBvZmZzZXQgaXMgZGlmZmVyZW50IGZvciB0aGUgcGFyZW50XG4gICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAvLy0tIElmIHRoZSB0YXJnZXQgZWxlbWVudCBpcyB0byB0aGUgcmlnaHQgb2YgdGhlIHBhcmVudCBlbG1cbiAgICAgICAgICAgICAgICAgICAgbCArIFZJU0lCTEVfUEFERElORyA+IHAub2Zmc2V0V2lkdGggKyBwLnNjcm9sbExlZnQgfHxcbiAgICAgICAgICAgICAgICAgICAgLy8tLSBJZiB0aGUgdGFyZ2V0IGVsZW1lbnQgaXMgdG8gdGhlIGxlZnQgb2YgdGhlIHBhcmVudCBlbG1cbiAgICAgICAgICAgICAgICAgICAgbCArIHcgLSBWSVNJQkxFX1BBRERJTkcgPCBwLnNjcm9sbExlZnQgfHxcbiAgICAgICAgICAgICAgICAgICAgLy8tLSBJZiB0aGUgdGFyZ2V0IGVsZW1lbnQgaXMgdW5kZXIgdGhlIHBhcmVudCBlbG1cbiAgICAgICAgICAgICAgICAgICAgdCArIFZJU0lCTEVfUEFERElORyA+IHAub2Zmc2V0SGVpZ2h0ICsgcC5zY3JvbGxUb3AgfHxcbiAgICAgICAgICAgICAgICAgICAgLy8tLSBJZiB0aGUgdGFyZ2V0IGVsZW1lbnQgaXMgYWJvdmUgdGhlIHBhcmVudCBlbG1cbiAgICAgICAgICAgICAgICAgICAgdCArIGggLSBWSVNJQkxFX1BBRERJTkcgPCBwLnNjcm9sbFRvcFxuICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAvLy0tIE91ciB0YXJnZXQgZWxlbWVudCBpcyBvdXQgb2YgYm91bmRzOlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8tLSBBZGQgdGhlIG9mZnNldCBwYXJlbnQncyBsZWZ0L3RvcCBjb29yZHMgdG8gb3VyIGVsZW1lbnQncyBvZmZzZXQ6XG4gICAgICAgICAgICBpZiAoIGVsLm9mZnNldFBhcmVudCA9PT0gcCApIHtcbiAgICAgICAgICAgICAgICBsICs9IHAub2Zmc2V0TGVmdDtcbiAgICAgICAgICAgICAgICB0ICs9IHAub2Zmc2V0VG9wO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8tLSBMZXQncyByZWN1cnNpdmVseSBjaGVjayB1cHdhcmRzOlxuICAgICAgICAgICAgcmV0dXJuIF9pc1Zpc2libGUocCwgdCwgciwgYiwgbCwgdywgaCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgLy8tLSBDcm9zcyBicm93c2VyIG1ldGhvZCB0byBnZXQgc3R5bGUgcHJvcGVydGllczpcbiAgICBmdW5jdGlvbiBfZ2V0U3R5bGUoZWwsIHByb3BlcnR5KSB7XG4gICAgICAgIGlmICggd2luZG93LmdldENvbXB1dGVkU3R5bGUgKSB7XG4gICAgICAgICAgICByZXR1cm4gZG9jdW1lbnQuZGVmYXVsdFZpZXcuZ2V0Q29tcHV0ZWRTdHlsZShlbCxudWxsKVtwcm9wZXJ0eV07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCBlbC5jdXJyZW50U3R5bGUgKSB7XG4gICAgICAgICAgICByZXR1cm4gZWwuY3VycmVudFN0eWxlW3Byb3BlcnR5XTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIF9lbGVtZW50SW5Eb2N1bWVudChlbGVtZW50KSB7XG4gICAgICAgIHdoaWxlIChlbGVtZW50ID0gZWxlbWVudC5wYXJlbnROb2RlKSB7XG4gICAgICAgICAgICBpZiAoZWxlbWVudCA9PSBkb2N1bWVudCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX292ZXJmbG93SGlkZGVuKGVsKSB7XG4gICAgICAgIHJldHVybiAnaGlkZGVuJyA9PT0gX2dldFN0eWxlKGVsLCAnb3ZlcmZsb3cnKSB8fCAnaGlkZGVuJyA9PT0gX2dldFN0eWxlKGVsLCAnb3ZlcmZsb3cteCcpIHx8ICdoaWRkZW4nID09PSBfZ2V0U3R5bGUoZWwsICdvdmVyZmxvdy15JykgfHxcbiAgICAgICAgICAgICAgICAnc2Nyb2xsJyA9PT0gX2dldFN0eWxlKGVsLCAnb3ZlcmZsb3cnKSB8fCAnc2Nyb2xsJyA9PT0gX2dldFN0eWxlKGVsLCAnb3ZlcmZsb3cteCcpIHx8ICdzY3JvbGwnID09PSBfZ2V0U3R5bGUoZWwsICdvdmVyZmxvdy15JylcbiAgICB9XG5cbiAgICByZXR1cm4gX2lzVmlzaWJsZShlbGVtZW50KTtcblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBpc1Zpc2libGU6IGlzVmlzaWJsZVxufTsiLCJ2YXIgaWQgPSAnYW50ZW5uYS13aWRnZXQtYnVja2V0JztcblxuZnVuY3Rpb24gZ2V0V2lkZ2V0QnVja2V0KCkge1xuICAgIHZhciBidWNrZXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7XG4gICAgaWYgKCFidWNrZXQpIHtcbiAgICAgICAgYnVja2V0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIGJ1Y2tldC5zZXRBdHRyaWJ1dGUoJ2lkJywgaWQpO1xuICAgICAgICBidWNrZXQuY2xhc3NMaXN0LmFkZCgnYW50ZW5uYS1yZXNldCcsJ25vLWFudCcpO1xuICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGJ1Y2tldCk7XG4gICAgfVxuICAgIHJldHVybiBidWNrZXQ7XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBnZXQ6IGdldFdpZGdldEJ1Y2tldCxcbiAgICBzZWxlY3RvcjogZnVuY3Rpb24oKSB7IHJldHVybiAnIycgKyBpZDsgfVxufTsiLCJ2YXIgQ2FsbGJhY2tTdXBwb3J0ID0gcmVxdWlyZSgnLi9jYWxsYmFjay1zdXBwb3J0Jyk7XG52YXIgWGRtTG9hZGVyID0gcmVxdWlyZSgnLi94ZG0tbG9hZGVyJyk7XG5cbi8vIFJlZ2lzdGVyIG91cnNlbHZlcyB0byBoZWFyIG1lc3NhZ2VzXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcIm1lc3NhZ2VcIiwgcmVjZWl2ZU1lc3NhZ2UsIGZhbHNlKTtcblxudmFyIHJlc3BvbnNlSGFuZGxlcnMgPSB7fTtcblxuYWRkUmVzcG9uc2VIYW5kbGVyKCd4ZG0gbG9hZGVkJywgeGRtTG9hZGVkKTtcblxuZnVuY3Rpb24gYWRkUmVzcG9uc2VIYW5kbGVyKG1lc3NhZ2VLZXksIGNhbGxiYWNrKSB7XG4gICAgdmFyIGhhbmRsZXJzID0gZ2V0UmVzcG9uc2VIYW5kbGVycyhtZXNzYWdlS2V5KTtcbiAgICBoYW5kbGVycy5hZGQoY2FsbGJhY2spO1xufVxuXG5mdW5jdGlvbiByZW1vdmVSZXNwb25zZUhhbmRsZXIobWVzc2FnZUtleSwgY2FsbGJhY2spIHtcbiAgICB2YXIgaGFuZGxlcnMgPSBnZXRSZXNwb25zZUhhbmRsZXJzKG1lc3NhZ2VLZXkpO1xuICAgIGhhbmRsZXJzLnJlbW92ZShjYWxsYmFjayk7XG59XG5cbnZhciBpc1hETUxvYWRlZCA9IGZhbHNlO1xuLy8gVGhlIGluaXRpYWwgbWVzc2FnZSB0aGF0IFhETSBzZW5kcyBvdXQgd2hlbiBpdCBsb2Fkc1xuZnVuY3Rpb24geGRtTG9hZGVkKGRhdGEpIHtcbiAgICBpc1hETUxvYWRlZCA9IHRydWU7XG59XG5cbmZ1bmN0aW9uIHNldE1lc3NhZ2VIYW5kbGVyKG1lc3NhZ2VLZXksIGNhbGxiYWNrKSB7XG4gICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgIGNhbGxiYWNrLnBlcnNpc3RlbnQgPSB0cnVlOyAvLyBTZXQgdGhlIGZsYWcgd2hpY2ggdGVsbHMgdXMgdGhhdCB0aGlzIGlzbid0IGEgdHlwaWNhbCBvbmUtdGltZSBjYWxsYmFjay5cbiAgICB9XG4gICAgYWRkUmVzcG9uc2VIYW5kbGVyKG1lc3NhZ2VLZXksIGNhbGxiYWNrKTtcbn1cblxuZnVuY3Rpb24gZmV0Y2hVc2VyKGNhbGxiYWNrKSB7XG4gICAgcG9zdE1lc3NhZ2UoJ2dldFVzZXInLCAnc2VuZFVzZXInLCBzdWNjZXNzKTtcblxuICAgIGZ1bmN0aW9uIHN1Y2Nlc3MocmVzcG9uc2UpIHtcbiAgICAgICAgdmFyIHVzZXJJbmZvID0gcmVzcG9uc2UuZGV0YWlsO1xuICAgICAgICBjYWxsYmFjayh1c2VySW5mbyk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiByZUF1dGhvcml6ZVVzZXIoY2FsbGJhY2spIHtcbiAgICBwb3N0TWVzc2FnZSgncmVhdXRoVXNlcicsICdzZW5kVXNlcicsIHN1Y2Nlc3MpO1xuXG4gICAgZnVuY3Rpb24gc3VjY2VzcyhyZXNwb25zZSkge1xuICAgICAgICB2YXIgdXNlckluZm8gPSByZXNwb25zZS5kZXRhaWw7XG4gICAgICAgIGNhbGxiYWNrKHVzZXJJbmZvKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGdldFJlc3BvbnNlSGFuZGxlcnMobWVzc2FnZUtleSkge1xuICAgIHZhciBoYW5kbGVycyA9IHJlc3BvbnNlSGFuZGxlcnNbbWVzc2FnZUtleV07XG4gICAgaWYgKCFoYW5kbGVycykge1xuICAgICAgICBoYW5kbGVycyA9IENhbGxiYWNrU3VwcG9ydC5jcmVhdGUoKTtcbiAgICAgICAgcmVzcG9uc2VIYW5kbGVyc1ttZXNzYWdlS2V5XSA9IGhhbmRsZXJzO1xuICAgIH1cbiAgICByZXR1cm4gaGFuZGxlcnM7XG59XG5cbmZ1bmN0aW9uIHJlY2VpdmVNZXNzYWdlKGV2ZW50KSB7XG4gICAgdmFyIGV2ZW50T3JpZ2luID0gZXZlbnQub3JpZ2luO1xuICAgIGlmIChldmVudE9yaWdpbiA9PT0gWGRtTG9hZGVyLk9SSUdJTikge1xuICAgICAgICB2YXIgcmVzcG9uc2UgPSBldmVudC5kYXRhO1xuICAgICAgICAvLyBUT0RPOiBUaGUgZXZlbnQuc291cmNlIHByb3BlcnR5IGdpdmVzIHVzIHRoZSBzb3VyY2Ugd2luZG93IG9mIHRoZSBtZXNzYWdlIGFuZCBjdXJyZW50bHkgdGhlIFhETSBmcmFtZSBmaXJlcyBvdXRcbiAgICAgICAgLy8gZXZlbnRzIHRoYXQgd2UgcmVjZWl2ZSBiZWZvcmUgd2UgZXZlciB0cnkgdG8gcG9zdCBhbnl0aGluZy4gU28gd2UgKmNvdWxkKiBob2xkIG9udG8gdGhlIHdpbmRvdyBoZXJlIGFuZCB1c2UgaXRcbiAgICAgICAgLy8gZm9yIHBvc3RpbmcgbWVzc2FnZXMgcmF0aGVyIHRoYW4gbG9va2luZyBmb3IgdGhlIFhETSBmcmFtZSBvdXJzZWx2ZXMuIE5lZWQgdG8gbG9vayBhdCB3aGljaCBldmVudHMgdGhlIFhETSBmcmFtZVxuICAgICAgICAvLyBmaXJlcyBvdXQgdG8gYWxsIHdpbmRvd3MgYmVmb3JlIGJlaW5nIGFza2VkLiBDdXJyZW50bHksIGl0J3MgbW9yZSB0aGFuIFwieGRtIGxvYWRlZFwiLiBXaHk/XG4gICAgICAgIC8vdmFyIHNvdXJjZVdpbmRvdyA9IGV2ZW50LnNvdXJjZTtcblxuICAgICAgICB2YXIgbWVzc2FnZUtleSA9IHJlc3BvbnNlLmtleTtcbiAgICAgICAgdmFyIGhhbmRsZXJzID0gZ2V0UmVzcG9uc2VIYW5kbGVycyhtZXNzYWdlS2V5KTtcbiAgICAgICAgdmFyIGNhbGxiYWNrcyA9IGhhbmRsZXJzLmdldCgpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNhbGxiYWNrcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGNhbGxiYWNrID0gY2FsbGJhY2tzW2ldO1xuICAgICAgICAgICAgY2FsbGJhY2socmVzcG9uc2UpO1xuICAgICAgICAgICAgaWYgKCFjYWxsYmFjay5wZXJzaXN0ZW50KSB7XG4gICAgICAgICAgICAgICAgcmVtb3ZlUmVzcG9uc2VIYW5kbGVyKG1lc3NhZ2VLZXksIGNhbGxiYWNrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gcG9zdE1lc3NhZ2Uoc2VuZEtleSwgcmVzcG9uc2VLZXksIGNhbGxiYWNrKSB7XG4gICAgaWYgKGlzWERNTG9hZGVkKSB7XG4gICAgICAgIHZhciB4ZG1GcmFtZSA9IGdldFhETUZyYW1lKCk7XG4gICAgICAgIGlmICh4ZG1GcmFtZSkge1xuICAgICAgICAgICAgYWRkUmVzcG9uc2VIYW5kbGVyKHJlc3BvbnNlS2V5LCBjYWxsYmFjayk7XG4gICAgICAgICAgICB4ZG1GcmFtZS5wb3N0TWVzc2FnZShzZW5kS2V5LCBYZG1Mb2FkZXIuT1JJR0lOKTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIHF1ZXVlTWVzc2FnZShzZW5kS2V5LCByZXNwb25zZUtleSwgY2FsbGJhY2spO1xuICAgIH1cbn1cblxudmFyIG1lc3NhZ2VRdWV1ZSA9IFtdO1xudmFyIG1lc3NhZ2VRdWV1ZVRpbWVyO1xuXG5mdW5jdGlvbiBxdWV1ZU1lc3NhZ2Uoc2VuZEtleSwgcmVzcG9uc2VLZXksIGNhbGxiYWNrKSB7XG4gICAgLy8gVE9ETzogUmV2aWV3IHRoaXMgaWRlYS4gVGhlIG1haW4gbWVzc2FnZSB3ZSByZWFsbHkgbmVlZCB0byBxdWV1ZSB1cCBpcyB0aGUgZ2V0VXNlciByZXF1ZXN0IGFzIHBhcnQgb2YgdGhlIFwiZ3JvdXAgc2V0dGluZ3MgbG9hZGVkXCJcbiAgICAvLyBldmVudCB3aGljaCBmaXJlcyB2ZXJ5IGVhcmx5IChwb3NzaWJseSBcInBhZ2UgZGF0YSBsb2FkZWRcIiB0b28pLiBCdXQgd2hhdCBhYm91dCB0aGUgcmVzdCBvZiB0aGUgd2lkZ2V0PyBTaG91bGQgd2UgZXZlbiBzaG93XG4gICAgLy8gdGhlIHJlYWN0aW9uIHdpbmRvdyBpZiB0aGUgWERNIGZyYW1lIGlzbid0IHJlYWR5PyBPciBzaG91bGQgdGhlIHdpZGdldCB3YWl0IHRvIGJlY29tZSB2aXNpYmxlIHVudGlsIFhETSBpcyByZWFkeSBsaWtlIHRoZVxuICAgIC8vIHdheSBpdCB3YWl0cyBmb3IgcGFnZSBkYXRhIHRvIGxvYWQ/XG4gICAgbWVzc2FnZVF1ZXVlLnB1c2goe3NlbmRLZXk6IHNlbmRLZXksIHJlc3BvbnNlS2V5OiByZXNwb25zZUtleSwgY2FsbGJhY2s6IGNhbGxiYWNrfSk7XG4gICAgaWYgKCFtZXNzYWdlUXVldWVUaW1lcikge1xuICAgICAgICAvLyBTdGFydCB0aGUgd2FpdC4uLlxuICAgICAgICB2YXIgc3RvcFRpbWUgPSBEYXRlLm5vdygpICsgMTAwMDA7IC8vIEdpdmUgdXAgYWZ0ZXIgMTAgc2Vjb25kc1xuICAgICAgICBtZXNzYWdlUXVldWVUaW1lciA9IHNldEludGVydmFsKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKGlzWERNTG9hZGVkIHx8IERhdGUubm93KCkgPiBzdG9wVGltZSkge1xuICAgICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwobWVzc2FnZVF1ZXVlVGltZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGlzWERNTG9hZGVkKSB7XG4gICAgICAgICAgICAgICAgLy8gVE9ETzogQ29uc2lkZXIgdGhlIHRpbWluZyBpc3N1ZSB3aGVyZSBtZXNzYWdlcyBjb3VsZCBzbmVhayBpbiBhbmQgYmUgcHJvY2Vzc2VkIHdoaWxlIHRoaXMgbG9vcCBpcyBzbGVlcGluZy5cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG1lc3NhZ2VRdWV1ZS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZGVxdWV1ZWQgPSBtZXNzYWdlUXVldWVbaV07XG4gICAgICAgICAgICAgICAgICAgIHBvc3RNZXNzYWdlKGRlcXVldWVkLnNlbmRLZXksIGRlcXVldWVkLnJlc3BvbnNlS2V5LCBkZXF1ZXVlZC5jYWxsYmFjayk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIG1lc3NhZ2VRdWV1ZSA9IFtdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCA1MCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBnZXRYRE1GcmFtZSgpIHtcbiAgICAvLyBUT0RPOiBJcyB0aGlzIGEgc2VjdXJpdHkgcHJvYmxlbT8gV2hhdCBwcmV2ZW50cyBzb21lb25lIGZyb20gdXNpbmcgdGhpcyBzYW1lIG5hbWUgYW5kIGludGVyY2VwdGluZyBvdXIgbWVzc2FnZXM/XG4gICAgcmV0dXJuIHdpbmRvdy5mcmFtZXNbJ2FudC14ZG0taGlkZGVuJ107XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGZldGNoVXNlcjogZmV0Y2hVc2VyLFxuICAgIHJlQXV0aG9yaXplVXNlcjogcmVBdXRob3JpemVVc2VyLFxuICAgIHNldE1lc3NhZ2VIYW5kbGVyOiBzZXRNZXNzYWdlSGFuZGxlcixcbiAgICBhZGRSZXNwb25zZUhhbmRsZXI6IGFkZFJlc3BvbnNlSGFuZGxlcixcbiAgICByZW1vdmVSZXNwb25zZUhhbmRsZXI6IHJlbW92ZVJlc3BvbnNlSGFuZGxlclxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciBBcHBNb2RlID0gcmVxdWlyZSgnLi9hcHAtbW9kZScpO1xudmFyIFVSTENvbnN0YW50cyA9IHJlcXVpcmUoJy4vdXJsLWNvbnN0YW50cycpO1xudmFyIFdpZGdldEJ1Y2tldCA9IHJlcXVpcmUoJy4vd2lkZ2V0LWJ1Y2tldCcpO1xuXG52YXIgWERNX09SSUdJTiA9IEFwcE1vZGUub2ZmbGluZSA/IFVSTENvbnN0YW50cy5ERVZFTE9QTUVOVCA6IFVSTENvbnN0YW50cy5QUk9EVUNUSU9OO1xuXG5mdW5jdGlvbiBjcmVhdGVYRE1mcmFtZShncm91cElkKSB7XG4gICAgdmFyIGlmcmFtZVVybCA9IFhETV9PUklHSU4gKyBcIi9zdGF0aWMvd2lkZ2V0LW5ldy94ZG0uaHRtbFwiLFxuICAgIHBhcmVudFVybCA9IGVuY29kZVVSSSh3aW5kb3cubG9jYXRpb24uaHJlZiksXG4gICAgcGFyZW50SG9zdCA9IGVuY29kZVVSSSh3aW5kb3cubG9jYXRpb24ucHJvdG9jb2wgKyBcIi8vXCIgKyB3aW5kb3cubG9jYXRpb24uaG9zdCksXG4gICAgJHhkbUlmcmFtZSA9ICQoJzxpZnJhbWUgaWQ9XCJhbnQteGRtLWhpZGRlblwiIG5hbWU9XCJhbnQteGRtLWhpZGRlblwiIHNyYz1cIicgKyBpZnJhbWVVcmwgKyAnP3BhcmVudFVybD0nICsgcGFyZW50VXJsICsgJyZwYXJlbnRIb3N0PScgKyBwYXJlbnRIb3N0ICsgJyZncm91cF9pZD0nK2dyb3VwSWQrJ1wiIHdpZHRoPVwiMVwiIGhlaWdodD1cIjFcIiBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlO3RvcDotMTAwMHB4O2xlZnQ6LTEwMDBweDtcIiAvPicpO1xuICAgICQoV2lkZ2V0QnVja2V0LmdldCgpKS5hcHBlbmQoICR4ZG1JZnJhbWUgKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlWERNZnJhbWU6IGNyZWF0ZVhETWZyYW1lLFxuICAgIE9SSUdJTjogWERNX09SSUdJTlxufTsiLCJ2YXIgWERNQ2xpZW50ID0gcmVxdWlyZSgnLi91dGlscy94ZG0tY2xpZW50Jyk7XG52YXIgRXZlbnRzID0gcmVxdWlyZSgnLi9ldmVudHMnKTtcbnZhciBHcm91cFNldHRpbmdzID0gcmVxdWlyZSgnLi9ncm91cC1zZXR0aW5ncycpO1xudmFyIFBhZ2VEYXRhID0gcmVxdWlyZSgnLi9wYWdlLWRhdGEnKTtcblxuZnVuY3Rpb24gc3RhcnRMaXN0ZW5pbmcoKSB7XG4gICAgWERNQ2xpZW50LnNldE1lc3NhZ2VIYW5kbGVyKCdyZWNpcmNDbGljaycsIHJlY2lyY0NsaWNrZWQpO1xufVxuXG5mdW5jdGlvbiByZWNpcmNDbGlja2VkKHJlc3BvbnNlKSB7XG4gICAgdmFyIHJlYWN0aW9uSWQgPSByZXNwb25zZS5kZXRhaWwucmVmZXJyaW5nX2ludF9pZDtcbiAgICBnZXRQYWdlRGF0YShyZXNwb25zZS5kZXRhaWwucGFnZV9oYXNoLCBmdW5jdGlvbihwYWdlRGF0YSkge1xuICAgICAgICBFdmVudHMucG9zdExlZ2FjeVJlY2lyY0NsaWNrZWQocGFnZURhdGEsIHJlYWN0aW9uSWQsIEdyb3VwU2V0dGluZ3MuZ2V0KCkpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBnZXRQYWdlRGF0YShwYWdlSGFzaCwgY2FsbGJhY2spIHtcbiAgICBpZiAocGFnZUhhc2gpIHtcbiAgICAgICAgLy8gVGhpcyBtb2R1bGUgbG9hZHMgdmVyeSBlYXJseSBpbiB0aGUgYXBwIGxpZmVjeWNsZSBhbmQgbWF5IHJlY2VpdmUgZXZlbnRzIGZyb20gdGhlIFhETSBmcmFtZSBiZWZvcmUgcGFnZVxuICAgICAgICAvLyBkYXRhIGhhcyBiZWVuIGxvYWRlZC4gSG9sZCBvbnRvIGFueSBzdWNoIGV2ZW50cyB1bnRpbCB0aGUgcGFnZSBkYXRhIGxvYWRzIG9yIHdlIHRpbWVvdXQuXG4gICAgICAgIHZhciBtYXhXYWl0VGltZSA9IERhdGUubm93KCkgKyAxMDAwMDsgLy8gR2l2ZSB1cCBhZnRlciAxMCBzZWNvbmRzXG4gICAgICAgIHZhciBpbnRlcnZhbCA9IHNldEludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBwYWdlRGF0YSA9IFBhZ2VEYXRhLmdldFBhZ2VEYXRhKHBhZ2VIYXNoKTtcbiAgICAgICAgICAgIGlmIChwYWdlRGF0YSkge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKHBhZ2VEYXRhKTtcbiAgICAgICAgICAgICAgICBjbGVhckludGVydmFsKGludGVydmFsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChEYXRlLm5vdygpID4gbWF4V2FpdFRpbWUpIHtcbiAgICAgICAgICAgICAgICBjbGVhckludGVydmFsKGludGVydmFsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgNTApO1xuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgc3RhcnQ6IHN0YXJ0TGlzdGVuaW5nXG59OyIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hIGFudGVubmEtYXV0by1jdGFcIn0sXCJvXCI6XCJjc3NyZXNldFwiLFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWF1dG8tY3RhLWlubmVyXCIsXCJhbnQtY3RhLWZvclwiOlt7XCJ0XCI6MixcInJcIjpcImFudEl0ZW1JZFwifV19LFwiZlwiOlt7XCJ0XCI6OCxcInJcIjpcImxvZ29cIn0se1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtYXV0by1jdGEtbGFiZWxcIixcImFudC1yZWFjdGlvbnMtbGFiZWwtZm9yXCI6W3tcInRcIjoyLFwiclwiOlwiYW50SXRlbUlkXCJ9XX19LHtcInRcIjo0LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJhbnQtZXhwYW5kZWQtcmVhY3Rpb25zLWZvclwiOlt7XCJ0XCI6MixcInJcIjpcImFudEl0ZW1JZFwifV19fV0sXCJuXCI6NTAsXCJyXCI6XCJleHBhbmRSZWFjdGlvbnNcIn1dfV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1wYWdlIGFudGVubmEtYmxvY2tlZC1wYWdlXCJ9LFwib1wiOlwiY3NzcmVzZXRcIixcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1ib2R5XCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwidlwiOntcInRhcFwiOlwiYmFja1wifSxcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1ibG9ja2VkLWJhY2tcIn0sXCJmXCI6W3tcInRcIjo4LFwiclwiOlwibGVmdFwifSx7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJyZWFjdGlvbnNfd2lkZ2V0X19iYWNrXFxcIilcIn19XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1ibG9ja2VkLWJvZHlcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtYmxvY2tlZC1tZXNzYWdlXCJ9LFwiZlwiOlt7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJibG9ja2VkX3BhZ2VfX21lc3NhZ2UxXFxcIilcIn19XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1ibG9ja2VkLW1lc3NhZ2VcIn0sXCJmXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcImJsb2NrZWRfcGFnZV9fbWVzc2FnZTJcXFwiKVwifX1dfV19XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo0LFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcImNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbFwifV0sXCJuXCI6NTAsXCJ4XCI6e1wiclwiOltcImNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbFwiLFwiY29udGFpbmVyRGF0YS5sb2FkZWRcIl0sXCJzXCI6XCJfMCYmXzFcIn19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjQsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6W1wiYW50ZW5uYS1jdGEtZXhwYW5kZWQtcmVhY3Rpb24gXCIse1widFwiOjQsXCJmXCI6W1wiYW50ZW5uYS1jdGEtZXhwYW5kZWQtZmlyc3RcIl0sXCJuXCI6NTAsXCJ4XCI6e1wiclwiOltcIkBpbmRleFwiXSxcInNcIjpcIl8wPT09MFwifX1dfSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY3RhLWV4cGFuZGVkLXRleHRcIn0sXCJmXCI6W3tcInRcIjoyLFwiclwiOlwiLi90ZXh0XCJ9XX0se1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY3RhLWV4cGFuZGVkLWNvdW50XCJ9LFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcIi4vY291bnRcIn1dfV19XSxcInhcIjp7XCJyXCI6W1wiY29tcHV0ZUV4cGFuZGVkUmVhY3Rpb25zXCIsXCJjb250YWluZXJEYXRhLnJlYWN0aW9uc1wiXSxcInNcIjpcIl8wKF8xKVwifX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NCxcImZcIjpbe1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwiY2FsbF90b19hY3Rpb25fbGFiZWxfX3Jlc3BvbnNlc1xcXCIpXCJ9fV0sXCJuXCI6NTAsXCJ4XCI6e1wiclwiOltcImNvbnRhaW5lckRhdGEubG9hZGVkXCIsXCJjb250YWluZXJEYXRhLnJlYWN0aW9uVG90YWxcIl0sXCJzXCI6XCIhXzB8fF8xPT09dW5kZWZpbmVkfHxfMT09PTBcIn19LHtcInRcIjo0LFwiblwiOjUxLFwiZlwiOlt7XCJ0XCI6NCxcIm5cIjo1MCxcInhcIjp7XCJyXCI6W1wiY29udGFpbmVyRGF0YS5yZWFjdGlvblRvdGFsXCJdLFwic1wiOlwiXzA9PT0xXCJ9LFwiZlwiOlt7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJjYWxsX3RvX2FjdGlvbl9sYWJlbF9fcmVzcG9uc2VzX29uZVxcXCIpXCJ9fV19LHtcInRcIjo0LFwiblwiOjUwLFwieFwiOntcInJcIjpbXCJjb250YWluZXJEYXRhLnJlYWN0aW9uVG90YWxcIl0sXCJzXCI6XCIhKF8wPT09MSlcIn0sXCJmXCI6W1wiIFwiLHtcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCIsXCJjb250YWluZXJEYXRhLnJlYWN0aW9uVG90YWxcIl0sXCJzXCI6XCJfMChcXFwiY2FsbF90b19hY3Rpb25fbGFiZWxfX3Jlc3BvbnNlc19tYW55XFxcIixbXzFdKVwifX1dfV0sXCJ4XCI6e1wiclwiOltcImNvbnRhaW5lckRhdGEubG9hZGVkXCIsXCJjb250YWluZXJEYXRhLnJlYWN0aW9uVG90YWxcIl0sXCJzXCI6XCIhXzB8fF8xPT09dW5kZWZpbmVkfHxfMT09PTBcIn19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb21tZW50LWFyZWFcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY29tbWVudC13aWRnZXRzXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInRleHRhcmVhXCIsXCJ2XCI6e1wiaW5wdXRcIjpcImlucHV0Y2hhbmdlZFwifSxcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb21tZW50LWlucHV0XCIsXCJwbGFjZWhvbGRlclwiOlt7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJjb21tZW50X2FyZWFfX3BsYWNlaG9sZGVyXFxcIilcIn19XSxcIm1heGxlbmd0aFwiOlwiNTAwXCJ9fSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWNvbW1lbnQtZm9vdGVyXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb21tZW50LWxpbWl0XCJ9LFwiZlwiOlt7XCJ0XCI6MyxcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJjb21tZW50X2FyZWFfX2NvdW50XFxcIilcIn19XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJidXR0b25cIixcImFcIjp7XCJpZFwiOlwiYW50ZW5uYS1jb21tZW50LXNwYWNlclwifX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJidXR0b25cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb21tZW50LXN1Ym1pdFwifSxcInZcIjp7XCJ0YXBcIjpcImFkZGNvbW1lbnRcIn0sXCJmXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcImNvbW1lbnRfYXJlYV9fYWRkXFxcIilcIn19XX1dfV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY29tbWVudC13YWl0aW5nXCJ9LFwiZlwiOltcIi4uLlwiXX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb21tZW50LXJlY2VpdmVkXCJ9LFwiZlwiOlt7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJjb21tZW50X2FyZWFfX3RoYW5rc1xcXCIpXCJ9fV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXBhZ2UgYW50ZW5uYS1jb21tZW50cy1wYWdlXCJ9LFwib1wiOlwiY3NzcmVzZXRcIixcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1ib2R5XCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwidlwiOntcInRhcFwiOlwiYmFja1wifSxcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb21tZW50cy1iYWNrXCJ9LFwiZlwiOlt7XCJ0XCI6OCxcInJcIjpcImxlZnRcIn0se1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwicmVhY3Rpb25zX3dpZGdldF9fYmFja1xcXCIpXCJ9fV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY29tbWVudHMtaGVhZGVyXCJ9LFwiZlwiOlt7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiLFwiY29tbWVudHMubGVuZ3RoXCJdLFwic1wiOlwiXzAoXFxcImNvbW1lbnRzX3BhZ2VfX2hlYWRlclxcXCIsW18xXSlcIn19XX0sXCIgXCIse1widFwiOjQsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpbXCJhbnRlbm5hLWNvbW1lbnQtZW50cnkgXCIse1widFwiOjQsXCJmXCI6W1wiYW50ZW5uYS1jb21tZW50LW5ld1wiXSxcIm5cIjo1MCxcInJcIjpcIi4vbmV3XCJ9XX0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwidGFibGVcIixcImZcIjpbe1widFwiOjcsXCJlXCI6XCJ0clwiLFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInRkXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY29tbWVudC1jZWxsXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImltZ1wiLFwiYVwiOntcInNyY1wiOlt7XCJ0XCI6MixcInJcIjpcIi4vdXNlci5pbWFnZVVSTFwifV19fV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwidGRcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb21tZW50LWF1dGhvclwifSxcImZcIjpbe1widFwiOjIsXCJyXCI6XCIuL3VzZXIubmFtZVwifV19XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJ0clwiLFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInRkXCIsXCJmXCI6W119LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwidGRcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb21tZW50LXRleHRcIn0sXCJmXCI6W3tcInRcIjoyLFwiclwiOlwiLi90ZXh0XCJ9XX1dfV19XX1dLFwiaVwiOlwiaW5kZXhcIixcInJcIjpcImNvbW1lbnRzXCJ9LFwiIFwiLHtcInRcIjo4LFwiclwiOlwiY29tbWVudEFyZWFcIn1dfV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1wYWdlIGFudGVubmEtY29uZmlybWF0aW9uLXBhZ2VcIn0sXCJvXCI6XCJjc3NyZXNldFwiLFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWJvZHlcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY29uZmlybS1yZWFjdGlvblwifSxcImZcIjpbe1widFwiOjIsXCJyXCI6XCJ0ZXh0XCJ9XX0sXCIgXCIse1widFwiOjgsXCJyXCI6XCJjb21tZW50QXJlYVwifV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtZm9vdGVyIGFudGVubmEtY29uZmlybS1mb290ZXJcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXNoYXJlXCJ9LFwiZlwiOlt7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJjb25maXJtYXRpb25fcGFnZV9fc2hhcmVcXFwiKVwifX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJhXCIsXCJ2XCI6e1widGFwXCI6XCJzaGFyZS1mYWNlYm9va1wifSxcImFcIjp7XCJocmVmXCI6XCIvL2ZhY2Vib29rLmNvbVwifSxcImZcIjpbe1widFwiOjgsXCJyXCI6XCJmYWNlYm9va0ljb25cIn1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImFcIixcInZcIjp7XCJ0YXBcIjpcInNoYXJlLXR3aXR0ZXJcIn0sXCJhXCI6e1wiaHJlZlwiOlwiLy90d2l0dGVyLmNvbVwifSxcImZcIjpbe1widFwiOjgsXCJyXCI6XCJ0d2l0dGVySWNvblwifV19XX1dfV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjQsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEgYW50ZW5uYS1jb250ZW50cmVjLWlubmVyXCJ9LFwib1wiOlwiY3NzcmVzZXRcIixcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb250ZW50cmVjLWhlYWRlclwifSxcImZcIjpbe1widFwiOjIsXCJyXCI6XCJ0aXRsZVwifV19LFwiIFwiLHtcInRcIjo0LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWNvbnRlbnRyZWMtZW50cnlcIn0sXCJ2XCI6e1widGFwXCI6XCJuYXZpZ2F0ZVwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb250ZW50cmVjLWVudHJ5LWhlYWRlclwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb250ZW50cmVjLXJlYWN0aW9uLXRleHRcIn0sXCJmXCI6W3tcInRcIjoyLFwiclwiOlwiLi90b3BfcmVhY3Rpb24udGV4dFwifV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY29udGVudHJlYy1pbmRpY2F0b3Itd3JhcHBlclwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb250ZW50cmVjLXJlYWN0aW9uLWluZGljYXRvclwifSxcImZcIjpbe1widFwiOjgsXCJyXCI6XCJsb2dvXCJ9LHtcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWNvbnRlbnRyZWMtcmVhY3Rpb24tY291bnRcIn0sXCJmXCI6W1wiIFwiLHtcInRcIjoyLFwiclwiOlwiLi9yZWFjdGlvbl9jb3VudFwifV19XX1dfV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY29udGVudHJlYy1ib2R5XCIsXCJzdHlsZVwiOltcImJhY2tncm91bmQ6XCIse1widFwiOjIsXCJyeFwiOntcInJcIjpcImNvbG9yc1wiLFwibVwiOlt7XCJ0XCI6MzAsXCJuXCI6XCJpbmRleFwifSxcImJhY2tncm91bmRcIl19fSxcIjtjb2xvcjpcIix7XCJ0XCI6MixcInJ4XCI6e1wiclwiOlwiY29sb3JzXCIsXCJtXCI6W3tcInRcIjozMCxcIm5cIjpcImluZGV4XCJ9LFwiZm9yZWdyb3VuZFwiXX19LFwiO1wiXX0sXCJmXCI6W3tcInRcIjo0LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWNvbnRlbnRyZWMtYm9keS1pbWFnZVwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJpbWdcIixcImFcIjp7XCJzcmNcIjpbe1widFwiOjIsXCJyXCI6XCIuL2NvbnRlbnQuYm9keVwifV19fV19XSxcIm5cIjo1MCxcInhcIjp7XCJyXCI6W1wiLi9jb250ZW50LnR5cGVcIl0sXCJzXCI6XCJfMD09PVxcXCJpbWFnZVxcXCJcIn19LHtcInRcIjo0LFwiblwiOjUxLFwiZlwiOlt7XCJ0XCI6NCxcIm5cIjo1MCxcInhcIjp7XCJyXCI6W1wiLi9jb250ZW50LnR5cGVcIl0sXCJzXCI6XCJfMD09PVxcXCJ0ZXh0XFxcIlwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb250ZW50cmVjLWJvZHktdGV4dFwifSxcIm9cIjpcInJlbmRlcnRleHRcIixcImZcIjpbe1widFwiOjIsXCJyXCI6XCIuL2NvbnRlbnQuYm9keVwifV19XX1dLFwieFwiOntcInJcIjpbXCIuL2NvbnRlbnQudHlwZVwiXSxcInNcIjpcIl8wPT09XFxcImltYWdlXFxcIlwifX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWNvbnRlbnRyZWMtcGFnZS10aXRsZVwifSxcImZcIjpbe1widFwiOjIsXCJyXCI6XCIuL3BhZ2UudGl0bGVcIn1dfV19XSxcImlcIjpcImluZGV4XCIsXCJyXCI6XCJjb250ZW50RGF0YS5lbnRyaWVzXCJ9XX1dLFwiblwiOjUwLFwieFwiOntcInJcIjpbXCJwb3B1bGF0ZUNvbnRlbnRFbnRyaWVzXCIsXCJwYWdlRGF0YS5zdW1tYXJ5TG9hZGVkXCIsXCJjb250ZW50RGF0YS5lbnRyaWVzXCJdLFwic1wiOlwiXzAoXzEpJiZfMlwifX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwidlwiOntcImtleWRvd25cIjpcInBhZ2VrZXlkb3duXCJ9LFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXBhZ2UgYW50ZW5uYS1kZWZhdWx0cy1wYWdlXCIsXCJ0YWJpbmRleFwiOlwiMFwifSxcIm9cIjpcImNzc3Jlc2V0XCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtYm9keVwifSxcImZcIjpbe1widFwiOjQsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJ2XCI6e1widGFwXCI6XCJuZXdyZWFjdGlvblwifSxcImFcIjp7XCJjbGFzc1wiOltcImFudGVubmEtcmVhY3Rpb24gXCIse1widFwiOjIsXCJ4XCI6e1wiclwiOltcImRlZmF1bHRMYXlvdXRDbGFzc1wiLFwiaW5kZXhcIl0sXCJzXCI6XCJfMChfMSlcIn19XX0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcmVhY3Rpb24tYm94XCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXJlYWN0aW9uLXRleHRcIn0sXCJvXCI6XCJzaXpldG9maXRcIixcImZcIjpbe1widFwiOjIsXCJyXCI6XCIuL3RleHRcIn1dfV19XX1dLFwiaVwiOlwiaW5kZXhcIixcInJcIjpcImRlZmF1bHRSZWFjdGlvbnNcIn1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWZvb3RlciBhbnRlbm5hLWRlZmF1bHRzLWZvb3RlclwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jdXN0b20tYXJlYVwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJpbnB1dFwiLFwidlwiOntcImZvY3VzXCI6XCJjdXN0b21mb2N1c1wiLFwia2V5ZG93blwiOlwiaW5wdXRrZXlkb3duXCIsXCJibHVyXCI6XCJjdXN0b21ibHVyXCJ9LFwiYVwiOntcInZhbHVlXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcImRlZmF1bHRzX3BhZ2VfX2FkZFxcXCIpXCJ9fV0sXCJtYXhsZW5ndGhcIjpcIjI1XCJ9fSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImJ1dHRvblwiLFwidlwiOntcInRhcFwiOlwibmV3Y3VzdG9tXCJ9LFwiZlwiOlt7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJkZWZhdWx0c19wYWdlX19va1xcXCIpXCJ9fV19XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS10ZXh0LWxvZ29cIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiYVwiLFwiYVwiOntcImhyZWZcIjpcIi8vd3d3LmFudGVubmEuaXNcIn0sXCJmXCI6W1wiQW50ZW5uYVwiXX1dfV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXBhZ2UgYW50ZW5uYS1lcnJvci1wYWdlXCJ9LFwib1wiOlwiY3NzcmVzZXRcIixcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1ib2R5XCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwidlwiOntcInRhcFwiOlwiYmFja1wifSxcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1lcnJvci1iYWNrXCJ9LFwiZlwiOlt7XCJ0XCI6OCxcInJcIjpcImxlZnRcIn0se1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwicmVhY3Rpb25zX3dpZGdldF9fYmFja1xcXCIpXCJ9fV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtZXJyb3ItYm9keVwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1lcnJvci1tZXNzYWdlXCJ9LFwiZlwiOlt7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJlcnJvcl9wYWdlX19tZXNzYWdlXFxcIilcIn19XX1dfV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXBhZ2UgYW50ZW5uYS1sb2NhdGlvbnMtcGFnZVwifSxcIm9cIjpcImNzc3Jlc2V0XCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtYm9keVwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcInZcIjp7XCJ0YXBcIjpcImJhY2tcIn0sXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtbG9jYXRpb25zLWJhY2tcIn0sXCJmXCI6W3tcInRcIjo4LFwiclwiOlwibGVmdFwifSx7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJyZWFjdGlvbnNfd2lkZ2V0X19iYWNrXFxcIilcIn19XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJ0YWJsZVwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxvY2F0aW9ucy10YWJsZVwifSxcImZcIjpbe1widFwiOjQsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwidHJcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1sb2NhdGlvbnMtY29udGVudC1yb3dcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwidGRcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1sb2NhdGlvbnMtY291bnQtY2VsbFwifSxcImZcIjpbe1widFwiOjQsXCJmXCI6W3tcInRcIjozLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcImxvY2F0aW9uc19wYWdlX19jb3VudF9vbmVcXFwiKVwifX1dLFwiblwiOjUwLFwieFwiOntcInJcIjpbXCJwYWdlUmVhY3Rpb25Db3VudFwiXSxcInNcIjpcIl8wPT09MVwifX0se1widFwiOjQsXCJuXCI6NTEsXCJmXCI6W3tcInRcIjozLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCIsXCJwYWdlUmVhY3Rpb25Db3VudFwiXSxcInNcIjpcIl8wKFxcXCJsb2NhdGlvbnNfcGFnZV9fY291bnRfbWFueVxcXCIsW18xXSlcIn19XSxcInhcIjp7XCJyXCI6W1wicGFnZVJlYWN0aW9uQ291bnRcIl0sXCJzXCI6XCJfMD09PTFcIn19XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJ0ZFwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxvY2F0aW9ucy1wYWdlLWJvZHlcIn0sXCJmXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcImxvY2F0aW9uc19wYWdlX19wYWdlbGV2ZWxcXFwiKVwifX1dfV19XSxcIm5cIjo1MCxcInJcIjpcInBhZ2VSZWFjdGlvbkNvdW50XCJ9LFwiIFwiLHtcInRcIjo0LFwiZlwiOlt7XCJ0XCI6NCxcImZcIjpbXCIgXCIse1widFwiOjcsXCJlXCI6XCJ0clwiLFwidlwiOntcInRhcFwiOlwicmV2ZWFsXCJ9LFwiYVwiOntcImNsYXNzXCI6W1wiYW50ZW5uYS1sb2NhdGlvbnMtY29udGVudC1yb3cgXCIse1widFwiOjQsXCJmXCI6W1wiYW50ZW5uYS1sb2NhdGVcIl0sXCJuXCI6NTAsXCJ4XCI6e1wiclwiOltcImNhbkxvY2F0ZVwiLFwiLi9jb250YWluZXJIYXNoXCJdLFwic1wiOlwiXzAoXzEpXCJ9fV19LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInRkXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtbG9jYXRpb25zLWNvdW50LWNlbGxcIn0sXCJmXCI6W3tcInRcIjo0LFwiZlwiOlt7XCJ0XCI6MyxcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJsb2NhdGlvbnNfcGFnZV9fY291bnRfb25lXFxcIilcIn19XSxcIm5cIjo1MCxcInhcIjp7XCJyXCI6W1wiLi9jb3VudFwiXSxcInNcIjpcIl8wPT09MVwifX0se1widFwiOjQsXCJuXCI6NTEsXCJmXCI6W3tcInRcIjozLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCIsXCIuL2NvdW50XCJdLFwic1wiOlwiXzAoXFxcImxvY2F0aW9uc19wYWdlX19jb3VudF9tYW55XFxcIixbXzFdKVwifX1dLFwieFwiOntcInJcIjpbXCIuL2NvdW50XCJdLFwic1wiOlwiXzA9PT0xXCJ9fV19LFwiIFwiLHtcInRcIjo0LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInRkXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtbG9jYXRpb25zLXRleHQtYm9keVwifSxcImZcIjpbe1widFwiOjIsXCJyXCI6XCIuL2JvZHlcIn1dfV0sXCJuXCI6NTAsXCJ4XCI6e1wiclwiOltcIi4va2luZFwiXSxcInNcIjpcIl8wPT09XFxcInR4dFxcXCJcIn19LHtcInRcIjo0LFwiblwiOjUxLFwiZlwiOlt7XCJ0XCI6NCxcIm5cIjo1MCxcInhcIjp7XCJyXCI6W1wiLi9raW5kXCJdLFwic1wiOlwiXzA9PT1cXFwiaW1nXFxcIlwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJ0ZFwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxvY2F0aW9ucy1pbWFnZS1ib2R5XCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImltZ1wiLFwiYVwiOntcInNyY1wiOlt7XCJ0XCI6MixcInJcIjpcIi4vYm9keVwifV19fV19XX0se1widFwiOjQsXCJuXCI6NTAsXCJ4XCI6e1wiclwiOltcIi4va2luZFwiXSxcInNcIjpcIighKF8wPT09XFxcImltZ1xcXCIpKSYmKF8wPT09XFxcIm1lZFxcXCIpXCJ9LFwiZlwiOltcIiBcIix7XCJ0XCI6NyxcImVcIjpcInRkXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtbG9jYXRpb25zLW1lZGlhLWJvZHlcIn0sXCJmXCI6W3tcInRcIjo4LFwiclwiOlwiZmlsbVwifSx7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1sb2NhdGlvbnMtdmlkZW9cIn0sXCJmXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcImxvY2F0aW9uc19wYWdlX192aWRlb1xcXCIpXCJ9fV19XX1dfSx7XCJ0XCI6NCxcIm5cIjo1MCxcInhcIjp7XCJyXCI6W1wiLi9raW5kXCJdLFwic1wiOlwiKCEoXzA9PT1cXFwiaW1nXFxcIikpJiYoIShfMD09PVxcXCJtZWRcXFwiKSlcIn0sXCJmXCI6W1wiIFwiLHtcInRcIjo3LFwiZVwiOlwidGRcIixcImZcIjpbXCLCoFwiXX1dfV0sXCJ4XCI6e1wiclwiOltcIi4va2luZFwiXSxcInNcIjpcIl8wPT09XFxcInR4dFxcXCJcIn19XX1dLFwiblwiOjUwLFwieFwiOntcInJcIjpbXCIuL2tpbmRcIl0sXCJzXCI6XCJfMCE9PVxcXCJwYWdcXFwiXCJ9fV0sXCJpXCI6XCJpZFwiLFwiclwiOlwibG9jYXRpb25EYXRhXCJ9XX1dfV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1wYWdlIGFudGVubmEtbG9naW4tcGFnZVwifSxcIm9cIjpcImNzc3Jlc2V0XCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtYm9keVwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcInZcIjp7XCJ0YXBcIjpcImJhY2tcIn0sXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtbG9naW4tYmFja1wifSxcImZcIjpbe1widFwiOjgsXCJyXCI6XCJsZWZ0XCJ9LHtcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcInJlYWN0aW9uc193aWRnZXRfX2JhY2tcXFwiKVwifX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxvZ2luLWNvbnRhaW5lclwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJpZnJhbWVcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1sb2dpbi1pZnJhbWVcIixcInNyY1wiOlt7XCJ0XCI6MixcInJcIjpcImxvZ2luUGFnZVVybFwifV0sXCJzZWFtbGVzc1wiOjB9fV19XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwib1wiOlwiY3NzcmVzZXRcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYSBhbnRlbm5hLW1lZGlhLWluZGljYXRvci13cmFwcGVyXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcIm1cIjpbe1widFwiOjIsXCJyXCI6XCJleHRyYUF0dHJpYnV0ZXNcIn1dLFwiYVwiOntcImNsYXNzXCI6W1wiYW50ZW5uYSBhbnRlbm5hLW1lZGlhLWluZGljYXRvci13aWRnZXQgXCIse1widFwiOjQsXCJmXCI6W1wiYW50ZW5uYS1ub3Rsb2FkZWRcIl0sXCJuXCI6NTEsXCJyXCI6XCJjb250YWluZXJEYXRhLmxvYWRlZFwifSxcIiBhbnRlbm5hLXJlc2V0IFwiLHtcInRcIjo0LFwiZlwiOltcImFudGVubmEtdG91Y2hcIl0sXCJuXCI6NTAsXCJyXCI6XCJzdXBwb3J0c1RvdWNoXCJ9XX0sXCJmXCI6W1wiIFwiLHtcInRcIjo4LFwiclwiOlwibG9nb1wifSxcIiBcIix7XCJ0XCI6NCxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcmVhY3Rpb24tdG90YWxcIn0sXCJvXCI6XCJjc3NyZXNldFwiLFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcImNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbFwifV19XSxcIm5cIjo1MCxcInJcIjpcImNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbFwifSx7XCJ0XCI6NCxcIm5cIjo1MSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcmVhY3Rpb24tcHJvbXB0XCJ9LFwiZlwiOlt7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJtZWRpYV9pbmRpY2F0b3JfX3RoaW5rXFxcIilcIn19XX1dLFwiclwiOlwiY29udGFpbmVyRGF0YS5yZWFjdGlvblRvdGFsXCJ9XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcGFnZSBhbnRlbm5hLXBlbmRpbmctcGFnZVwifSxcIm9cIjpcImNzc3Jlc2V0XCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtYm9keVwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1wZW5kaW5nLXJlYWN0aW9uXCJ9LFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcInRleHRcIn1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXBlbmRpbmctbWVzc2FnZVwifSxcImZcIjpbe1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwicGVuZGluZ19wYWdlX19tZXNzYWdlX2FwcGVhclxcXCIpXCJ9fV19XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcG9wdXBcIn0sXCJvXCI6XCJjc3NyZXNldFwiLFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXBvcHVwLWJvZHlcIn0sXCJmXCI6W3tcInRcIjo4LFwiclwiOlwibG9nb1wifSx7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1wb3B1cC10ZXh0XCJ9LFwiZlwiOlt7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJwb3B1cF93aWRnZXRfX3RoaW5rXFxcIilcIn19XX1dfV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1wYWdlIGFudGVubmEtcmVhY3Rpb25zLXBhZ2VcIn0sXCJvXCI6XCJjc3NyZXNldFwiLFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWJvZHlcIn0sXCJmXCI6W3tcInRcIjo0LFwiZlwiOlt7XCJ0XCI6NCxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcInZcIjp7XCJ0YXBcIjpcInBsdXNvbmVcIixcIm1vdXNlZW50ZXJcIjpcImhpZ2hsaWdodFwiLFwibW91c2VsZWF2ZVwiOlwiY2xlYXJoaWdobGlnaHRzXCJ9LFwiYVwiOntcImNsYXNzXCI6W1wiYW50ZW5uYS1yZWFjdGlvbiBcIix7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wicmVhY3Rpb25zTGF5b3V0Q2xhc3NcIixcImluZGV4XCJdLFwic1wiOlwiXzAoXzEpXCJ9fV19LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXJlYWN0aW9uLWJveFwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1yZWFjdGlvbi10ZXh0XCJ9LFwib1wiOlwic2l6ZXRvZml0XCIsXCJmXCI6W3tcInRcIjoyLFwiclwiOlwiLi90ZXh0XCJ9XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1yZWFjdGlvbi1jb3VudFwifSxcImZcIjpbe1widFwiOjIsXCJyXCI6XCIuL2NvdW50XCJ9XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1wbHVzb25lXCJ9LFwiZlwiOltcIisxXCJdfSxcIiBcIix7XCJ0XCI6NCxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcInZcIjp7XCJ0YXBcIjpcInNob3dsb2NhdGlvbnNcIn0sXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcmVhY3Rpb24tbG9jYXRpb25cIn0sXCJmXCI6W3tcInRcIjo4LFwiclwiOlwibG9jYXRpb25JY29uXCJ9XX1dLFwiblwiOjUwLFwiclwiOlwiaXNTdW1tYXJ5XCJ9LHtcInRcIjo0LFwiblwiOjUxLFwiZlwiOlt7XCJ0XCI6NCxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcInZcIjp7XCJ0YXBcIjpcInNob3djb21tZW50c1wifSxcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1yZWFjdGlvbi1jb21tZW50cyBoYXNjb21tZW50c1wifSxcImZcIjpbe1widFwiOjgsXCJyXCI6XCJjb21tZW50c0ljb25cIn0sXCIgXCIse1widFwiOjIsXCJyXCI6XCIuL2NvbW1lbnRDb3VudFwifV19XSxcIm5cIjo1MCxcInJcIjpcIi4vY29tbWVudENvdW50XCJ9LHtcInRcIjo0LFwiblwiOjUxLFwiZlwiOlt7XCJ0XCI6NCxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1yZWFjdGlvbi1jb21tZW50c1wifSxcImZcIjpbe1widFwiOjgsXCJyXCI6XCJjb21tZW50c0ljb25cIn1dfV0sXCJuXCI6NTAsXCJ4XCI6e1wiclwiOltcImhpZGVDb21tZW50SW5wdXRcIl0sXCJzXCI6XCIhXzBcIn19XSxcInJcIjpcIi4vY29tbWVudENvdW50XCJ9XSxcInJcIjpcImlzU3VtbWFyeVwifV19XX1dLFwiaVwiOlwiaW5kZXhcIixcInJcIjpcInJlYWN0aW9uc1wifV0sXCJuXCI6NTAsXCJyXCI6XCJyZWFjdGlvbnNcIn1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWZvb3RlciBhbnRlbm5hLXJlYWN0aW9ucy1mb290ZXJcIn0sXCJmXCI6W3tcInRcIjo0LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwidlwiOntcInRhcFwiOlwic2hvd2RlZmF1bHRcIn0sXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtdGhpbmtcIn0sXCJmXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcInJlYWN0aW9uc19wYWdlX190aGlua1xcXCIpXCJ9fV19XSxcIm5cIjo1MCxcInJcIjpcInJlYWN0aW9uc1wifSx7XCJ0XCI6NCxcIm5cIjo1MSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1uby1yZWFjdGlvbnNcIn0sXCJmXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcInJlYWN0aW9uc19wYWdlX19ub19yZWFjdGlvbnNcXFwiKVwifX1dfV0sXCJyXCI6XCJyZWFjdGlvbnNcIn0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS10ZXh0LWxvZ29cIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiYVwiLFwiYVwiOntcImhyZWZcIjpcIi8vd3d3LmFudGVubmEuaXNcIixcInRhcmdldFwiOlwiX2JsYW5rXCJ9LFwiZlwiOltcIkFudGVubmFcIl19XX1dfV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOltcImFudGVubmEgYW50ZW5uYS1yZWFjdGlvbnMtd2lkZ2V0IFwiLHtcInRcIjo0LFwiZlwiOltcImFudGVubmEtdG91Y2hcIl0sXCJuXCI6NTAsXCJyXCI6XCJzdXBwb3J0c1RvdWNoXCJ9XSxcInRhYmluZGV4XCI6XCIwXCJ9LFwib1wiOlwiY3NzcmVzZXRcIixcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1oZWFkZXJcIn0sXCJmXCI6W3tcInRcIjo4LFwiclwiOlwibG9nb1wifSx7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1yZWFjdGlvbnMtdGl0bGVcIn0sXCJmXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcInJlYWN0aW9uc193aWRnZXRfX3RpdGxlXFxcIilcIn19XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJ2XCI6e1widGFwXCI6XCJjbG9zZVwifSxcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1yZWFjdGlvbnMtY2xvc2VcIn0sXCJmXCI6W1wiWFwiXX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXBhZ2UtY29udGFpbmVyXCJ9LFwiZlwiOltcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXByb2dyZXNzLXBhZ2UgYW50ZW5uYS1wYWdlXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWJvZHlcIn0sXCJmXCI6W119LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcHJvZ3Jlc3Mtc3Bpbm5lclwifSxcImZcIjpbe1widFwiOjgsXCJyXCI6XCJsb2dvXCJ9XX1dfV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwib1wiOlwiY3NzcmVzZXRcIixcImFcIjp7XCJjbGFzc1wiOltcImFudGVubmEgYW50ZW5uYS1zdW1tYXJ5LXdpZGdldCBuby1hbnQgXCIse1widFwiOjQsXCJmXCI6W1wiYW50ZW5uYS1ub3Rsb2FkZWRcIl0sXCJuXCI6NTEsXCJyXCI6XCJwYWdlRGF0YS5zdW1tYXJ5TG9hZGVkXCJ9LFwiIGFudGVubmEtcmVzZXQgXCIse1widFwiOjQsXCJmXCI6W1wiYW50ZW5uYS1leHBhbmRlZC1zdW1tYXJ5XCJdLFwiblwiOjUwLFwiclwiOlwiaXNFeHBhbmRlZFN1bW1hcnlcIn1dfSxcImZcIjpbXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1zdW1tYXJ5LWlubmVyXCJ9LFwiZlwiOlt7XCJ0XCI6OCxcInJcIjpcImxvZ29cIn0se1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtc3VtbWFyeS10aXRsZVwifSxcImZcIjpbXCIgXCIse1widFwiOjQsXCJmXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcInN1bW1hcnlfd2lkZ2V0X19yZWFjdGlvbnNcXFwiKVwifX1dLFwiblwiOjUwLFwieFwiOntcInJcIjpbXCJwYWdlRGF0YS5zdW1tYXJ5VG90YWxcIl0sXCJzXCI6XCJfMD09PTBcIn19LHtcInRcIjo0LFwiblwiOjUxLFwiZlwiOlt7XCJ0XCI6NCxcIm5cIjo1MCxcInhcIjp7XCJyXCI6W1wicGFnZURhdGEuc3VtbWFyeVRvdGFsXCJdLFwic1wiOlwiXzA9PT0xXCJ9LFwiZlwiOlt7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJzdW1tYXJ5X3dpZGdldF9fcmVhY3Rpb25zX29uZVxcXCIpXCJ9fV19LHtcInRcIjo0LFwiblwiOjUwLFwieFwiOntcInJcIjpbXCJwYWdlRGF0YS5zdW1tYXJ5VG90YWxcIl0sXCJzXCI6XCIhKF8wPT09MSlcIn0sXCJmXCI6W1wiIFwiLHtcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCIsXCJwYWdlRGF0YS5zdW1tYXJ5VG90YWxcIl0sXCJzXCI6XCJfMChcXFwic3VtbWFyeV93aWRnZXRfX3JlYWN0aW9uc19tYW55XFxcIixbXzFdKVwifX1dfV0sXCJ4XCI6e1wiclwiOltcInBhZ2VEYXRhLnN1bW1hcnlUb3RhbFwiXSxcInNcIjpcIl8wPT09MFwifX1dfSx7XCJ0XCI6NCxcImZcIjpbe1widFwiOjQsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwib1wiOlwiY3NzcmVzZXRcIixcImFcIjp7XCJjbGFzc1wiOltcImFudGVubmEtZXhwYW5kZWQtcmVhY3Rpb24gXCIse1widFwiOjQsXCJmXCI6W1wiYW50ZW5uYS1leHBhbmRlZC1maXJzdFwiXSxcIm5cIjo1MCxcInhcIjp7XCJyXCI6W1wiQGluZGV4XCJdLFwic1wiOlwiXzA9PT0wXCJ9fV19LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1leHBhbmRlZC10ZXh0XCJ9LFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcIi4vdGV4dFwifV19LHtcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWV4cGFuZGVkLWNvdW50XCJ9LFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcIi4vY291bnRcIn1dfV19XSxcInhcIjp7XCJyXCI6W1wiY29tcHV0ZUV4cGFuZGVkUmVhY3Rpb25zXCIsXCJwYWdlRGF0YS5zdW1tYXJ5UmVhY3Rpb25zXCJdLFwic1wiOlwiXzAoXzEpXCJ9fV0sXCJuXCI6NTAsXCJyXCI6XCJpc0V4cGFuZGVkU3VtbWFyeVwifV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb21tZW50c1wifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJzdmdcIixcImZcIjpbe1widFwiOjcsXCJlXCI6XCJ1c2VcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb21tZW50cy1wYXRoXCIsXCJ4bGluazpocmVmXCI6XCIjYW50ZW5uYS1zdmctY29tbWVudFwifX1dfV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtZmFjZWJvb2tcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3ZnXCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwidXNlXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtZmFjZWJvb2stcGF0aFwiLFwieGxpbms6aHJlZlwiOlwiI2FudGVubmEtc3ZnLWZhY2Vib29rXCJ9fV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1maWxtXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInN2Z1wiLFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInVzZVwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWZpbG0tcGF0aFwiLFwieGxpbms6aHJlZlwiOlwiI2FudGVubmEtc3ZnLWZpbG1cIn19XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxlZnRcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3ZnXCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwidXNlXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtbGVmdC1wYXRoXCIsXCJ4bGluazpocmVmXCI6XCIjYW50ZW5uYS1zdmctbGVmdFwifX1dfV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtbG9jYXRpb25cIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3ZnXCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwidXNlXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtbG9jYXRpb24tcGF0aFwiLFwieGxpbms6aHJlZlwiOlwiI2FudGVubmEtc3ZnLXNlYXJjaFwifX1dfV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtbG9nb1wifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJzdmdcIixcImFcIjp7XCJ2aWV3Qm94XCI6XCIwIDAgNTEyIDUxMlwifSxcImZcIjpbXCIgXCIse1widFwiOjcsXCJlXCI6XCJwYXRoXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtbG9nby1wYXRoXCIsXCJkXCI6XCJtMjgzIDUxMGMxMjUtMTcgMjI5LTEyNCAyMjktMjUzIDAtMTQxLTExNS0yNTYtMjU2LTI1Ni0xNDEgMC0yNTYgMTE1LTI1NiAyNTYgMCAxMzAgMTA4IDIzNyAyMzMgMjU0bDAtMTQ5Yy00OC0xNC04NC01MC04NC0xMDIgMC02NSA0My0xMTMgMTA4LTExMyA2NSAwIDEwNyA0OCAxMDcgMTEzIDAgNTItMzMgODgtODEgMTAyelwifX1dfV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtbG9nb1wifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJzdmdcIixcImZcIjpbe1widFwiOjcsXCJlXCI6XCJ1c2VcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1sb2dvLXBhdGhcIixcInhsaW5rOmhyZWZcIjpcIiNhbnRlbm5hLXN2Zy1sb2dvXCJ9fV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS10d2l0dGVyXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInN2Z1wiLFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInVzZVwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXR3aXR0ZXItcGF0aFwiLFwieGxpbms6aHJlZlwiOlwiI2FudGVubmEtc3ZnLXR3aXR0ZXJcIn19XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwic3ZnXCIsXCJhXCI6e1wieG1sbnNcIjpcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIsXCJzdHlsZVwiOlwiZGlzcGxheTogbm9uZTtcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3ltYm9sXCIsXCJhXCI6e1wiaWRcIjpcImFudGVubmEtc3ZnLXR3aXR0ZXJcIixcInZpZXdCb3hcIjpcIjAgMCA1MTIgNTEyXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInBhdGhcIixcImFcIjp7XCJkXCI6XCJtNDUzIDEzNGMtMTQgNi0zMCAxMS00NiAxMmMxNi0xMCAyOS0yNSAzNS00NGMtMTUgOS0zMyAxNi01MSAxOWMtMTUtMTUtMzYtMjUtNTktMjVjLTQ1IDAtODEgMzYtODEgODFjMCA2IDEgMTIgMiAxOGMtNjctMy0xMjctMzUtMTY3LTg0Yy03IDEyLTExIDI1LTExIDQwYzAgMjggMTUgNTMgMzYgNjhjLTEzLTEtMjUtNC0zNi0xMWMwIDEgMCAxIDAgMmMwIDM5IDI4IDcxIDY1IDc5Yy03IDItMTQgMy0yMiAzYy01IDAtMTAtMS0xNS0yYzEwIDMyIDQwIDU2IDc2IDU2Yy0yOCAyMi02MyAzNS0xMDEgMzVjLTYgMC0xMyAwLTE5LTFjMzYgMjMgNzggMzYgMTI0IDM2YzE0OSAwIDIzMC0xMjMgMjMwLTIzMGMwLTMgMC03IDAtMTBjMTYtMTIgMjktMjYgNDAtNDJ6XCJ9fV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwic3ltYm9sXCIsXCJhXCI6e1wiaWRcIjpcImFudGVubmEtc3ZnLWZhY2Vib29rXCIsXCJ2aWV3Qm94XCI6XCIwIDAgNTEyIDUxMlwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJwYXRoXCIsXCJhXCI6e1wiZFwiOlwibTQyMCA3MmwtMzI4IDBjLTExIDAtMjAgOS0yMCAyMGwwIDMyOGMwIDExIDkgMjAgMjAgMjBsMTc3IDBsMC0xNDJsLTQ4IDBsMC01Nmw0OCAwbDAtNDFjMC00OCAyOS03NCA3MS03NGMyMCAwIDM4IDIgNDMgM2wwIDQ5bC0yOSAwYy0yMyAwLTI4IDExLTI4IDI3bDAgMzZsNTUgMGwtNyA1NmwtNDggMGwwIDE0Mmw5NCAwYzExIDAgMjAtOSAyMC0yMGwwLTMyOGMwLTExLTktMjAtMjAtMjB6XCJ9fV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwic3ltYm9sXCIsXCJhXCI6e1wiaWRcIjpcImFudGVubmEtc3ZnLWNvbW1lbnRcIixcInZpZXdCb3hcIjpcIjAgMCA1MTIgNTEyXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInBhdGhcIixcImFcIjp7XCJkXCI6XCJtNTEyIDI1NmMwIDMzLTExIDY0LTM0IDkyYy0yMyAyOC01NCA1MC05MyA2NmMtNDAgMTctODMgMjUtMTI5IDI1Yy0xMyAwLTI3LTEtNDEtMmMtMzggMzMtODIgNTYtMTMyIDY5Yy05IDItMjAgNC0zMiA2Yy00IDAtNyAwLTktM2MtMy0yLTQtNC01LThsMCAwYy0xLTEtMS0yIDAtNGMwLTEgMC0yIDAtMmMwLTEgMS0yIDItM2wxLTNjMCAwIDEtMSAyLTJjMi0yIDItMyAzLTNjMS0xIDQtNSA4LTEwYzUtNSA4LTggMTAtMTBjMi0zIDUtNiA5LTEyYzQtNSA3LTEwIDktMTRjMy01IDUtMTAgOC0xN2MzLTcgNS0xNCA4LTIyYy0zMC0xNy01NC0zOC03MS02M2MtMTctMjUtMjYtNTEtMjYtODBjMC0yNSA3LTQ4IDIwLTcxYzE0LTIzIDMyLTQyIDU1LTU4YzIzLTE3IDUwLTMwIDgyLTM5YzMxLTEwIDY0LTE1IDk5LTE1YzQ2IDAgODkgOCAxMjkgMjVjMzkgMTYgNzAgMzggOTMgNjZjMjMgMjggMzQgNTkgMzQgOTJ6XCJ9fV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwic3ltYm9sXCIsXCJhXCI6e1wiaWRcIjpcImFudGVubmEtc3ZnLXNlYXJjaFwiLFwidmlld0JveFwiOlwiMCAwIDUxMiA1MTJcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwicGF0aFwiLFwiYVwiOntcImRcIjpcIm0zNDcgMjM4YzAtMzYtMTItNjYtMzctOTFjLTI1LTI1LTU1LTM3LTkxLTM3Yy0zNSAwLTY1IDEyLTkwIDM3Yy0yNSAyNS0zOCA1NS0zOCA5MWMwIDM1IDEzIDY1IDM4IDkwYzI1IDI1IDU1IDM4IDkwIDM4YzM2IDAgNjYtMTMgOTEtMzhjMjUtMjUgMzctNTUgMzctOTB6IG0xNDcgMjM3YzAgMTAtNCAxOS0xMSAyNmMtNyA3LTE2IDExLTI2IDExYy0xMCAwLTE5LTQtMjYtMTFsLTk4LTk4Yy0zNCAyNC03MiAzNi0xMTQgMzZjLTI3IDAtNTMtNS03OC0xNmMtMjUtMTEtNDYtMjUtNjQtNDNjLTE4LTE4LTMyLTM5LTQzLTY0Yy0xMC0yNS0xNi01MS0xNi03OGMwLTI4IDYtNTQgMTYtNzhjMTEtMjUgMjUtNDcgNDMtNjVjMTgtMTggMzktMzIgNjQtNDNjMjUtMTAgNTEtMTUgNzgtMTVjMjggMCA1NCA1IDc5IDE1YzI0IDExIDQ2IDI1IDY0IDQzYzE4IDE4IDMyIDQwIDQzIDY1YzEwIDI0IDE2IDUwIDE2IDc4YzAgNDItMTIgODAtMzYgMTE0bDk4IDk4YzcgNyAxMSAxNSAxMSAyNXpcIn19XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJzeW1ib2xcIixcImFcIjp7XCJpZFwiOlwiYW50ZW5uYS1zdmctbGVmdFwiLFwidmlld0JveFwiOlwiMCAwIDUxMiA1MTJcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwicGF0aFwiLFwiYVwiOntcImRcIjpcIm0zNjggMTYwbC02NC02NC0xNjAgMTYwIDE2MCAxNjAgNjQtNjQtOTYtOTZ6XCJ9fV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwic3ltYm9sXCIsXCJhXCI6e1wiaWRcIjpcImFudGVubmEtc3ZnLWxvZ29cIixcInZpZXdCb3hcIjpcIjAgMCA1MTIgNTEyXCJ9LFwiZlwiOltcIiBcIix7XCJ0XCI6NyxcImVcIjpcInBhdGhcIixcImFcIjp7XCJkXCI6XCJtMjgzIDUxMGMxMjUtMTcgMjI5LTEyNCAyMjktMjUzIDAtMTQxLTExNS0yNTYtMjU2LTI1Ni0xNDEgMC0yNTYgMTE1LTI1NiAyNTYgMCAxMzAgMTA4IDIzNyAyMzMgMjU0bDAtMTQ5Yy00OC0xNC04NC01MC04NC0xMDIgMC02NSA0My0xMTMgMTA4LTExMyA2NSAwIDEwNyA0OCAxMDcgMTEzIDAgNTItMzMgODgtODEgMTAyelwifX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcInN5bWJvbFwiLFwiYVwiOntcImlkXCI6XCJhbnRlbm5hLXN2Zy1maWxtXCIsXCJ2aWV3Qm94XCI6XCIwIDAgNTEyIDUxMlwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJwYXRoXCIsXCJhXCI6e1wiZFwiOlwibTkxIDQ1N2wwLTM2YzAtNS0xLTEwLTUtMTMtNC00LTgtNi0xMy02bC0zNiAwYy01IDAtMTAgMi0xMyA2LTQgMy02IDgtNiAxM2wwIDM2YzAgNSAyIDkgNiAxMyAzIDQgOCA1IDEzIDVsMzYgMGM1IDAgOS0xIDEzLTUgNC00IDUtOCA1LTEzeiBtMC0xMTBsMC0zNmMwLTUtMS05LTUtMTMtNC00LTgtNS0xMy01bC0zNiAwYy01IDAtMTAgMS0xMyA1LTQgNC02IDgtNiAxM2wwIDM2YzAgNSAyIDEwIDYgMTMgMyA0IDggNiAxMyA2bDM2IDBjNSAwIDktMiAxMy02IDQtMyA1LTggNS0xM3ogbTAtMTA5bDAtMzdjMC01LTEtOS01LTEzLTQtMy04LTUtMTMtNWwtMzYgMGMtNSAwLTEwIDItMTMgNS00IDQtNiA4LTYgMTNsMCAzN2MwIDUgMiA5IDYgMTMgMyAzIDggNSAxMyA1bDM2IDBjNSAwIDktMiAxMy01IDQtNCA1LTggNS0xM3ogbTI5MyAyMTlsMC0xNDZjMC01LTItOS01LTEzLTQtNC04LTUtMTMtNWwtMjIwIDBjLTUgMC05IDEtMTMgNS0zIDQtNSA4LTUgMTNsMCAxNDZjMCA1IDIgOSA1IDEzIDQgNCA4IDUgMTMgNWwyMjAgMGM1IDAgOS0xIDEzLTUgMy00IDUtOCA1LTEzeiBtLTI5My0zMjlsMC0zN2MwLTUtMS05LTUtMTItNC00LTgtNi0xMy02bC0zNiAwYy01IDAtMTAgMi0xMyA2LTQgMy02IDctNiAxMmwwIDM3YzAgNSAyIDkgNiAxMyAzIDMgOCA1IDEzIDVsMzYgMGM1IDAgOS0yIDEzLTUgNC00IDUtOCA1LTEzeiBtNDAzIDMyOWwwLTM2YzAtNS0yLTEwLTYtMTMtMy00LTgtNi0xMy02bC0zNiAwYy01IDAtOSAyLTEzIDYtNCAzLTUgOC01IDEzbDAgMzZjMCA1IDEgOSA1IDEzIDQgNCA4IDUgMTMgNWwzNiAwYzUgMCAxMC0xIDEzLTUgNC00IDYtOCA2LTEzeiBtLTExMC0yMTlsMC0xNDdjMC01LTItOS01LTEyLTQtNC04LTYtMTMtNmwtMjIwIDBjLTUgMC05IDItMTMgNi0zIDMtNSA3LTUgMTJsMCAxNDdjMCA1IDIgOSA1IDEzIDQgMyA4IDUgMTMgNWwyMjAgMGM1IDAgOS0yIDEzLTUgMy00IDUtOCA1LTEzeiBtMTEwIDEwOWwwLTM2YzAtNS0yLTktNi0xMy0zLTQtOC01LTEzLTVsLTM2IDBjLTUgMC05IDEtMTMgNS00IDQtNSA4LTUgMTNsMCAzNmMwIDUgMSAxMCA1IDEzIDQgNCA4IDYgMTMgNmwzNiAwYzUgMCAxMC0yIDEzLTYgNC0zIDYtOCA2LTEzeiBtMC0xMDlsMC0zN2MwLTUtMi05LTYtMTMtMy0zLTgtNS0xMy01bC0zNiAwYy01IDAtOSAyLTEzIDUtNCA0LTUgOC01IDEzbDAgMzdjMCA1IDEgOSA1IDEzIDQgMyA4IDUgMTMgNWwzNiAwYzUgMCAxMC0yIDEzLTUgNC00IDYtOCA2LTEzeiBtMC0xMTBsMC0zN2MwLTUtMi05LTYtMTItMy00LTgtNi0xMy02bC0zNiAwYy01IDAtOSAyLTEzIDYtNCAzLTUgNy01IDEybDAgMzdjMCA1IDEgOSA1IDEzIDQgMyA4IDUgMTMgNWwzNiAwYzUgMCAxMC0yIDEzLTUgNC00IDYtOCA2LTEzeiBtMzYtNDZsMCAzODRjMCAxMy00IDI0LTEzIDMzLTkgOS0yMCAxMy0zMiAxM2wtNDU4IDBjLTEyIDAtMjMtNC0zMi0xMy05LTktMTMtMjAtMTMtMzNsMC0zODRjMC0xMiA0LTIzIDEzLTMyIDktOSAyMC0xMyAzMi0xM2w0NTggMGMxMiAwIDIzIDQgMzIgMTMgOSA5IDEzIDIwIDEzIDMyelwifX1dfV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcIm9cIjpcImNzc3Jlc2V0XCIsXCJ2XCI6e1widGFwXCI6XCJkaXNtaXNzXCJ9LFwiYVwiOntcImNsYXNzXCI6W1wiYW50ZW5uYSBhbnRlbm5hLXRhcC1oZWxwZXIgXCIse1widFwiOjQsXCJmXCI6W1wiYW50ZW5uYS1oZWxwZXItdG9wXCJdLFwiblwiOjUwLFwiclwiOlwicG9zaXRpb25Ub3BcIn0se1widFwiOjQsXCJuXCI6NTEsXCJmXCI6W1wiYW50ZW5uYS1oZWxwZXItYm90dG9tXCJdLFwiclwiOlwicG9zaXRpb25Ub3BcIn1dfSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS10YXAtaGVscGVyLWlubmVyXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiZlwiOlt7XCJ0XCI6OCxcInJcIjpcImxvZ29cIn0se1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtdGFwLWhlbHBlci1wcm9tcHRcIn0sXCJmXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcInRhcF9oZWxwZXJfX3Byb21wdFxcXCIpXCJ9fV19XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS10YXAtaGVscGVyLWNsb3NlXCJ9LFwiZlwiOlt7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJ0YXBfaGVscGVyX19jbG9zZVxcXCIpXCJ9fV19XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwib1wiOlwiY3NzcmVzZXRcIixcImFcIjp7XCJjbGFzc1wiOltcImFudGVubmEgYW50ZW5uYS10ZXh0LWluZGljYXRvci13aWRnZXQgXCIse1widFwiOjQsXCJmXCI6W1wiYW50ZW5uYS1ub3Rsb2FkZWRcIl0sXCJuXCI6NTEsXCJyXCI6XCJjb250YWluZXJEYXRhLmxvYWRlZFwifSxcIiBhbnRlbm5hLXJlc2V0IFwiLHtcInRcIjo0LFwiZlwiOltcImFudGVubmEtaGFzcmVhY3Rpb25zXCJdLFwiblwiOjUwLFwieFwiOntcInJcIjpbXCJjb250YWluZXJEYXRhLnJlYWN0aW9uVG90YWxcIl0sXCJzXCI6XCJfMD4wXCJ9fSxcIiBcIix7XCJ0XCI6NCxcImZcIjpbXCJhbnRlbm5hLXN1cHByZXNzXCJdLFwiblwiOjUwLFwiclwiOlwiY29udGFpbmVyRGF0YS5zdXBwcmVzc1wifSxcIiBcIix7XCJ0XCI6MixcInJcIjpcImV4dHJhQ2xhc3Nlc1wifV19LFwiZlwiOltcIiBcIix7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS10ZXh0LWluZGljYXRvci1pbm5lclwifSxcImZcIjpbe1widFwiOjgsXCJyXCI6XCJsb2dvXCJ9LHtcInRcIjo0LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1yZWFjdGlvbi10b3RhbFwifSxcIm9cIjpcImNzc3Jlc2V0XCIsXCJmXCI6W3tcInRcIjoyLFwiclwiOlwiY29udGFpbmVyRGF0YS5yZWFjdGlvblRvdGFsXCJ9XX1dLFwiblwiOjUwLFwiclwiOlwiY29udGFpbmVyRGF0YS5yZWFjdGlvblRvdGFsXCJ9XX1dfV19Il19
