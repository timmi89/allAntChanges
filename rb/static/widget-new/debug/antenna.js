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
    XDMAnalytics.start();
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
},{"./css-loader":13,"./group-settings-loader":16,"./page-data-loader":22,"./page-scanner":24,"./reinitializer":30,"./script-loader":31,"./tap-helper":34,"./utils/browser-metrics":39,"./utils/xdm-loader":70,"./xdm-analytics":71}],2:[function(require,module,exports){
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
},{"../templates/auto-call-to-action.hbs.html":72,"./svgs":33,"./utils/browser-metrics":39,"./utils/jquery-provider":42,"./utils/ractive-provider":54}],3:[function(require,module,exports){
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
},{"../templates/blocked-reaction-page.hbs.html":73,"./svgs":33,"./utils/ractive-provider":54}],4:[function(require,module,exports){
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
},{"../templates/call-to-action-counter.hbs.html":74,"./utils/ractive-provider":54}],5:[function(require,module,exports){
var Ractive; require('./utils/ractive-provider').onLoad(function(loadedRactive) { Ractive = loadedRactive;});

function createExpandedReactions($expandedReactionsElement, $containerElement, containerData, groupSettings) {
    var ractive = Ractive({
        el: $expandedReactionsElement,
        magic: true,
        data: {
            containerData: containerData,
            computeExpandedReactions: computeExpandedReactions(groupSettings.defaultReactions($containerElement))
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
},{"../templates/call-to-action-expanded-reactions.hbs.html":75,"./utils/ractive-provider":54}],6:[function(require,module,exports){
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
            createdWidgets.push(CallToActionExpandedReactions.create($ctaExpandedReactions[i], $containerElement, containerData, groupSettings));
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

function openReactionsWindow(reactionOptions, $ctaElement) {
    ReactionsWidget.open(reactionOptions, $ctaElement);
}

//noinspection JSUnresolvedVariable
module.exports = {
    create: createIndicatorWidget
};
},{"./call-to-action-counter":4,"./call-to-action-expanded-reactions":5,"./call-to-action-label":7,"./reactions-widget":28,"./utils/touch-support":61}],7:[function(require,module,exports){
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
},{"../templates/call-to-action-label.hbs.html":76,"./utils/ractive-provider":54}],8:[function(require,module,exports){
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
                AjaxClient.postComment(comment, reaction, containerData, pageData, groupSettings, function () {
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
},{"./events":14,"./utils/ajax-client":37,"./utils/jquery-provider":42,"./utils/user":66}],9:[function(require,module,exports){
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
},{"../templates/comment-area-partial.hbs.html":77,"../templates/comments-page.hbs.html":78,"./comment-area-partial":8,"./svgs":33,"./utils/jquery-provider":42,"./utils/ractive-provider":54}],10:[function(require,module,exports){
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
                AjaxClient.postShareReaction(reactionData, containerData, pageData, groupSettings, function (response) {
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
},{"../templates/comment-area-partial.hbs.html":77,"../templates/confirmation-page.hbs.html":79,"./comment-area-partial":8,"./events":14,"./svgs":33,"./utils/ajax-client":37,"./utils/jquery-provider":42,"./utils/ractive-provider":54,"./utils/urls":65}],11:[function(require,module,exports){
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
},{"./utils/ajax-client":37,"./utils/urls":65}],12:[function(require,module,exports){
var Ractive; require('./utils/ractive-provider').onLoad(function(loadedRactive) { Ractive = loadedRactive;});
var BrowserMetrics = require('./utils/browser-metrics');
var JSONUtils = require('./utils/json-utils');
var Messages = require('./utils/messages');
var ThrottledEvents = require('./utils/throttled-events');
var URLs = require('./utils/urls');

var ContentRecLoader = require('./content-rec-loader');
var Events = require('./events');
var SVGs = require('./svgs');

function createContentRec(pageData, groupSettings) {
    var contentRecContainer = document.createElement('div');
    contentRecContainer.className = 'antenna antenna-content-rec';
    // We can't really request content until the full page data is loaded (because we need to know the server-side computed
    // canonical URL), but we can start prefetching the content pool for the group.
    ContentRecLoader.prefetchIfNeeded(groupSettings);
    var numEntries = BrowserMetrics.isMobile() ? groupSettings.contentRecCountMobile() : groupSettings.contentRecCountDesktop();
    var numEntriesPerRow = BrowserMetrics.isMobile() ? groupSettings.contentRecRowCountMobile() : groupSettings.contentRecRowCountDesktop();
    var entryWidth = Math.floor(100/numEntriesPerRow) + '%';
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
            colors: pickColors(numEntries, groupSettings),
            isMobile: BrowserMetrics.isMobile(),
            entryWidth: entryWidth,
            computeEntryUrl: computeEntryUrl
        },
        template: require('../templates/content-rec-widget.hbs.html'),
        partials: {
            logo: SVGs.logo
        },
        decorators: {
            renderText: renderText
        }
    });
    setupVisibilityHandler();

    return {
        element: contentRecContainer,
        teardown: function() { ractive.teardown(); }
    };

    function computeEntryUrl(contentEntry) {
        var targetUrl = contentEntry.page.url;
        var contentId = contentEntry.content.id;
        var event = Events.createContentRecClickedEvent(pageData, targetUrl, contentId, groupSettings);
        return URLs.computeContentRecUrl(targetUrl, event);
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
        var boldEndPoint = Math.floor(text.length *.8);
        var matches = text.substring(boldStartPoint, boldEndPoint).match(/,|\.|\?|"/gi);
        if (matches) {
            var boldPoint = text.lastIndexOf(matches[matches.length - 1], boldEndPoint) + 1;
            text = '<strong>' + text.substring(0, boldPoint) + '</strong>' + text.substring(boldPoint);
        }
        return text;
    }
}

function pickColors(count, groupSettings) {
    var colorPallete = [];
    var colorData = groupSettings.contentRecColors();
    if (colorData) {
        var colorPairs = colorData.split(';');
        for (var i = 0; i < colorPairs.length; i++) {
            var colors = colorPairs[i].split('/');
            if (colors.length === 2) {
                colorPallete.push({ background: colors[0], foreground: colors[1] });
            }
        }
    }
    if (colorPallete.length === 0) {
        colorPallete.push({ background: '#000000', foreground: '#FFFFFF' });
    }
    if (count < colorPallete.length) {
        return shuffleArray(colorPallete).slice(0, count);
    } else { // If we're asking for more colors than we have, just repeat the same colors as necessary.
        var output = [];
        var chosenIndex;
        for (var i = 0; i < count; i++) {
            chosenIndex = randomIndex(chosenIndex);
            output.push(colorPallete[chosenIndex]);
        }
        return output;
    }

    function randomIndex(avoid) {
        do {
            var picked = Math.floor(Math.random() * colorPallete.length);
        } while (picked === avoid && colorPallete.length > 1);
        return picked;
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
},{"../templates/content-rec-widget.hbs.html":80,"./content-rec-loader":11,"./events":14,"./svgs":33,"./utils/browser-metrics":39,"./utils/json-utils":43,"./utils/messages":49,"./utils/ractive-provider":54,"./utils/throttled-events":60,"./utils/urls":65}],13:[function(require,module,exports){
var AppMode = require('./utils/app-mode');
var URLs = require('./utils/urls');

function loadCss() {
    // To make sure none of our content renders on the page before our CSS is loaded, we append a simple inline style
    // element that turns off our elements *before* our CSS links. This exploits the cascade rules - our CSS files appear
    // after the inline style in the document, so they take precedence (and make everything appear) once they're loaded.
    injectCss('.antenna{display:none;}');
    var cssHref = URLs.amazonS3Url() + '/widget-new/antenna.css?v=3';
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
},{"./utils/app-mode":38,"./utils/urls":65}],14:[function(require,module,exports){
var AjaxClient = require('./utils/ajax-client');
var BrowserMetrics = require('./utils/browser-metrics');
var Logging = require('./utils/logging');
var Segment = require('./utils/segment');
var SessionData = require('./utils/session-data');
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

function postReactionWidgetOpened(pageData, containerData, contentData, groupSettings) {
    var event = createEvent(eventTypes.reactionWidgetOpened, '', groupSettings);
    appendPageDataParams(event, pageData);
    event[attributes.containerHash] = containerData.hash;
    event[attributes.containerKind] = contentData.type;
    postEvent(event);

    var customEvent = createCustomEvent(emitEventTypes.reactionView);
    emitEvent(customEvent);
}

function postSummaryOpened(pageData, groupSettings) {
    var event = createEvent(eventTypes.summaryWidget, '', groupSettings);
    appendPageDataParams(event, pageData);
    postEvent(event);

    var customEvent = createCustomEvent(emitEventTypes.reactionView);
    emitEvent(customEvent);
}

function postReactionCreated(pageData, containerData, reactionData, groupSettings) {
    var event = createEvent(eventTypes.reactionCreated, reactionData.text, groupSettings);
    appendPageDataParams(event, pageData);
    appendContainerDataParams(event, containerData);
    appendReactionDataParams(event, reactionData);
    postEvent(event);

    var eventDetail = {
        reaction: reactionData.text,
        content: reactionData.content.body
    };
    switch (reactionData.content.kind) { // Map our internal content types to better values for consumers
        case 'txt':
            eventDetail.contentType = 'text';
            break;
        case 'img':
            eventDetail.contentType = 'image';
            break;
        case 'med':
            eventDetail.contentType = 'media';
            break;
        default:
            eventDetail.contentType = reactionData.content.kind;
    }
    var customEvent = createCustomEvent(emitEventTypes.reactionCreate, eventDetail);
    emitEvent(customEvent);
}

function postReactionShared(target, pageData, containerData, reactionData, groupSettings) {
    var eventValue = target; // 'facebook', 'twitter', etc
    var event = createEvent(eventTypes.reactionShared, eventValue, groupSettings);
    appendPageDataParams(event, pageData);
    appendContainerDataParams(event, containerData);
    appendReactionDataParams(event, reactionData);
    postEvent(event);

    var customEvent = createCustomEvent(emitEventTypes.reactionShare);
    emitEvent(customEvent);
}

function postLocationsViewed(pageData, groupSettings) {
    var event = createEvent(eventTypes.summaryWidget, eventValues.locationsViewed, groupSettings);
    appendPageDataParams(event, pageData);
    postEvent(event);

    var customEvent = createCustomEvent(emitEventTypes.contentWithReactionView);
    emitEvent(customEvent);
}

function postContentViewed(pageData, containerData, locationData, groupSettings) {
    var event = createEvent(eventTypes.summaryWidget, eventValues.contentViewed, groupSettings);
    appendPageDataParams(event, pageData);
    appendContainerDataParams(event, containerData);
    event[attributes.contentId] = locationData.contentId;
    event[attributes.contentLocation] = locationData.location;
    postEvent(event);

    var customEvent = createCustomEvent(emitEventTypes.contentWithReactionFind);
    emitEvent(customEvent);
}

function postCommentsViewed(pageData, containerData, reactionData, groupSettings) {
    var event = createEvent(eventTypes.commentsViewed, '', groupSettings);
    appendPageDataParams(event, pageData);
    appendContainerDataParams(event, containerData);
    appendReactionDataParams(event, reactionData);
    postEvent(event);

    var customEvent = createCustomEvent(emitEventTypes.commentView);
    emitEvent(customEvent);
}

function postCommentCreated(pageData, containerData, reactionData, comment, groupSettings) {
    var event = createEvent(eventTypes.commentCreated, comment, groupSettings);
    appendPageDataParams(event, pageData);
    appendContainerDataParams(event, containerData);
    appendReactionDataParams(event, reactionData);
    postEvent(event);

    var customEvent = createCustomEvent(emitEventTypes.commentCreate);
    emitEvent(customEvent);
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

function createContentRecClickedEvent(pageData, targetUrl, contentId, groupSettings) {
    var event = createEvent(eventTypes.contentRecClicked, targetUrl, groupSettings);
    event[attributes.contentId] = contentId;
    appendPageDataParams(event, pageData);
    return event;
}

function postReadMoreLoaded(pageData, groupSettings) {
    var event = createEvent(eventTypes.readMoreLoaded, '', groupSettings);
    appendPageDataParams(event, pageData);
    postEvent(event);

    var customEvent = createCustomEvent(emitEventTypes.readMoreLoad);
    emitEvent(customEvent);
}

function postReadMoreVisible(pageData, groupSettings) {
    var event = createEvent(eventTypes.readMoreVisible, '', groupSettings);
    appendPageDataParams(event, pageData);
    postEvent(event);

    var customEvent = createCustomEvent(emitEventTypes.readMoreView);
    emitEvent(customEvent);
}

function postReadMoreClicked(pageData, groupSettings) {
    var event = createEvent(eventTypes.readMoreClicked, '', groupSettings);
    appendPageDataParams(event, pageData);
    postEvent(event);

    var customEvent = createCustomEvent(emitEventTypes.readMoreClick);
    emitEvent(customEvent);
}

function postFacebookLoginStart(groupSettings) {
    var event = createEvent(eventTypes.facebookLoginAttempt, eventValues.start, groupSettings);
    postEvent(event);
}

function postFacebookLoginFail(groupSettings) {
    var event = createEvent(eventTypes.facebookLoginAttempt, eventValues.fail, groupSettings);
    postEvent(event);
}

function postAntennaLoginStart(groupSettings) {
    var event = createEvent(eventTypes.antennaLoginAttempt, eventValues.start, groupSettings);
    postEvent(event);
}

function postAntennaLoginFail(groupSettings) {
    var event = createEvent(eventTypes.antennaLoginAttempt, eventValues.fail, groupSettings);
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
    event[attributes.shortTermSession] = SessionData.getShortTermSession();
    event[attributes.longTermSession] = SessionData.getLongTermSession();
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
    var userInfo = User.cachedUser(); // We don't want to create users just for events (e.g. every script load), but add user info if we have it already.
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
}

function createCustomEvent(eventType, eventDetail) {
    eventDetail = eventDetail || {};
    eventDetail.userId = SessionData.getLongTermSession();

    var customEvent;
    if (typeof window.CustomEvent === "function" ) {
        customEvent = new CustomEvent(eventType, { detail: eventDetail });
    } else {
        // Deprecated API for backwards compatibility + IE
        customEvent = document.createEvent('CustomEvent');
        customEvent.initCustomEvent(eventType, true, true, eventDetail);
    }
    Logging.debugMessage('Emitting event. type: ' + eventType + ' detail: ' + JSON.stringify(eventDetail));
    return customEvent;
}

function emitEvent(customEvent) {
    document.dispatchEvent(customEvent);
}

// Fill in any optional properties with null values.
function fillInMissingProperties(event) {
    for (var attr in attributes) {
        if (event[attributes[attr]] === undefined) {
            event[attributes[attr]] = null;
        }
    }
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
    readMoreClicked: 'rmc',
    facebookLoginAttempt: 'login attempt facebook',
    antennaLoginAttempt: 'login attempt antenna'
};

var eventValues = {
    contentViewed: 'vc', // view_content
    locationsViewed: 'vr', // view_reactions
    // showDefaults: 'wr',
    // showReactions: 'rd',
    singlePage: 'si',
    multiplePages: 'mu',
    viewReactions: 'vw',
    viewDefaults: 'ad',
    start: 'start',
    fail: 'fail'
};

var emitEventTypes = {
    reactionView: 'antenna.reactionView',
    reactionCreate: 'antenna.reactionCreate',
    reactionShare: 'antenna.reactionShare',
    contentWithReactionView: 'antenna.contentWithReactionView',
    contentWithReactionFind: 'antenna.contentWithReactionFind',
    commentView: 'antenna.commentView',
    commentCreate: 'antenna.commentCreate',
    readMoreLoad: 'antenna.readMoreLoad',
    readMoreView: 'antenna.readMoreView',
    readMoreClick: 'antenna.readMoreClick'
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
    createContentRecClickedEvent: createContentRecClickedEvent,
    postReadMoreLoaded: postReadMoreLoaded,
    postReadMoreVisible: postReadMoreVisible,
    postReadMoreClicked: postReadMoreClicked,
    postFacebookLoginStart: postFacebookLoginStart,
    postFacebookLoginFail: postFacebookLoginFail,
    postAntennaLoginStart: postAntennaLoginStart,
    postAntennaLoginFail: postAntennaLoginFail
};

},{"./utils/ajax-client":37,"./utils/browser-metrics":39,"./utils/logging":45,"./utils/segment":58,"./utils/session-data":59,"./utils/user":66}],15:[function(require,module,exports){
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
},{"../templates/generic-error-page.hbs.html":81,"./svgs":33,"./utils/ractive-provider":54}],16:[function(require,module,exports){
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
},{"./group-settings":17,"./utils/ajax-client":37,"./utils/jquery-provider":42,"./utils/urls":65}],17:[function(require,module,exports){
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

var defaults = {
    active_sections: "body",
    anno_whitelist: "p",
    no_ant: "",
    custom_css: "",
    paragraph_helper: true,
    media_url_ignore_query: true,
    summary_widget_selector: '.ant-page-summary', // TODO: this wasn't defined as a default in engage_full, but was in code. why?
    summary_widget_method: 'after',
    language: 'en',
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
    initial_pin_limit: 3
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
        customCSS += createCustomCSSRule(migrateReactionsBackgroundColorSettings(data('tags_bg_css', '')), '.antenna-reactions-page .antenna-body');
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
        contentRecMethod: data('recirc_jquery_method'),
        contentRecColors: data('recirc_background'),
        contentRecCountDesktop: data('recirc_count_desktop'),
        contentRecCountMobile: data('recirc_count_mobile'),
        contentRecRowCountDesktop: data('recirc_rowcount_desktop'),
        contentRecRowCountMobile: data('recirc_rowcount_mobile')
    }
}

//noinspection JSUnresolvedVariable
module.exports = {
    create: updateFromJSON,
    get: getGroupSettings
};
},{"./events":14,"./utils/jquery-provider":42}],18:[function(require,module,exports){
// This module stores our mapping from hash values to their corresponding elements in the DOM. The data is organized
// by page for the blog roll case, where multiple pages of data can be loaded at once.
var pages = {};

// This module provides a get/set interface, but it allows multiple elements with the same key. This applies for image
// elements, where we allow multiple instances on the same page with the same hash.

function getElement(containerHash, pageHash) {
    var containers = pages[pageHash];
    if (containers) {
        var elements = containers[containerHash];
        if (elements) {
            return elements[0];
        }
    }
}

function setElement(containerHash, pageHash, $element) {
    var containers = pages[pageHash];
    if (!containers) {
        containers = pages[pageHash] = {};
    }
    containers[containerHash] = containers[containerHash] || [];
    var elements = containers[containerHash];
    for (var i = 0; i < elements.length; i++) {
        if (elements[i].get(0) === $element.get(0)) {
            return; // We've already got this association
        }
    }
    elements.push($element);
}

function removeElement(containerHash, pageHash, $element) {
    var containers = pages[pageHash] || {};
    var elements = containers[containerHash] || [];
    for (var i = 0; i < elements.length; i++) {
        if (elements[i].get(0) === $element.get(0)) {
            elements.splice(i, 1);
            if (elements.length === 0) {
                delete containers[containerHash];
            }
            return;
        }
    }
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
    removeElement: removeElement,
    updatePageHash: updatePageHash,
    teardown: teardown
};
},{}],19:[function(require,module,exports){
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
},{"../templates/locations-page.hbs.html":82,"./events":14,"./hashed-elements":18,"./page-data":23,"./svgs":33,"./utils/jquery-provider":42,"./utils/ractive-provider":54,"./utils/range":55}],20:[function(require,module,exports){
var Ractive; require('./utils/ractive-provider').onLoad(function(loadedRactive) { Ractive = loadedRactive;});
var URLs = require('./utils/urls');
var User = require('./utils/user');

var Events = require('./events');
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
            groupName: encodeURI(groupSettings.groupName())
        },
        template: require('../templates/login-page.hbs.html'),
        partials: {
            left: SVGs.left,
            logo: SVGs.logo
        }
    });
    ractive.on('back', function() {
        goBack();
    });
    ractive.on('facebookLogin', function() {
        showLoginPending();
        Events.postFacebookLoginStart(groupSettings);
        User.facebookLogin(groupSettings, function() {
            var userInfo = User.cachedUser();
            if (userInfo.user_type !== 'facebook') {
                Events.postFacebookLoginFail(groupSettings);
            }
            doRetry();
        });
    });
    ractive.on('antennaLogin', function() {
        showLoginPending();
        openAntennaLoginWindow(doRetry);
    });
    ractive.on('retry', function() {
        doRetry();
    });
    var antennaLoginWindow;
    var antennaLoginCancelled = false;
    return {
        selector: pageSelector,
        teardown: function() {
            ractive.teardown();
            cancelAntennaLogin();
        }
    };

    function doRetry() {
        retry();
    }

    function openAntennaLoginWindow(callback) {
        if (antennaLoginWindow && !antennaLoginWindow.closed) {
            antennaLoginWindow.focus(); // Bring the window to the front if it's already open.
        } else {
            Events.postAntennaLoginStart(groupSettings);
            var windowId = 'antenna_login';
            var windowProperties = computeWindowProperties();
            antennaLoginWindow = window.open(URLs.appServerUrl() + URLs.antennaLoginUrl(), windowId, windowProperties);
            var interval = setInterval(function() {
                // Watch for the window to close, then go read the latest cookies.
                if (antennaLoginWindow && antennaLoginWindow.closed) {
                    clearInterval(interval);
                    antennaLoginWindow = null;
                    if (!antennaLoginCancelled) {
                        var oldUserInfo = User.cachedUser() || {};
                        User.refreshUserFromCookies(function (userInfo) {
                            if (userInfo && userInfo.temp_user) {
                                Events.postAntennaLoginFail(groupSettings);
                            }
                            callback();
                        });
                    }
                }
            }, 50);
        }

        function computeWindowProperties() {
            var w = 400;
            var h = 350;
            var l = (window.screen.width/2)-(w/2);
            var t = (window.screen.height/2)-(h/2);
            return 'menubar=1,resizable=1,scrollbars=yes,width='+w+',height='+h+',top='+t+',left='+l;
        }
    }

    function cancelAntennaLogin() {
        // Close/cancel any login windows that we have open.
        if (antennaLoginWindow && !antennaLoginWindow.closed) {
            antennaLoginCancelled = true;
            antennaLoginWindow.close();
        }
    }

    function showLoginPending() {
        $(ractive.find('.antenna-login-content')).hide();
        $(ractive.find('.antenna-login-pending')).show();
    }
}

//noinspection JSUnresolvedVariable
module.exports = {
    createPage: createPage
};
},{"../templates/login-page.hbs.html":83,"./events":14,"./svgs":33,"./utils/ractive-provider":54,"./utils/urls":65,"./utils/user":66}],21:[function(require,module,exports){
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
    var lastContainerVisibility = Visibility.isVisible($containerElement.get(0));

    function positionIfNeeded() {
        var containerOffset = $containerElement.offset();
        var containerHeight = $containerElement.height();
        var containerVisibility = Visibility.isVisible($containerElement.get(0));
        if (containerOffset.top === lastContainerOffset.top &&
            containerOffset.left === lastContainerOffset.left &&
            containerHeight === lastContainerHeight &&
            containerVisibility === lastContainerVisibility) {
            return;
        }
        lastContainerOffset = containerOffset;
        lastContainerHeight = containerHeight;
        lastContainerVisibility = containerVisibility;
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
},{"../templates/media-indicator-widget.hbs.html":84,"./reactions-widget":28,"./svgs":33,"./utils/app-mode":38,"./utils/browser-metrics":39,"./utils/jquery-provider":42,"./utils/mutation-observer":51,"./utils/ractive-provider":54,"./utils/throttled-events":60,"./utils/touch-support":61,"./utils/visibility":67}],22:[function(require,module,exports){
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
},{"./page-data":23,"./utils/ajax-client":37,"./utils/jquery-provider":42,"./utils/page-utils":52,"./utils/throttled-events":60,"./utils/urls":65}],23:[function(require,module,exports){
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
},{"./events":14,"./hashed-elements":18,"./utils/jquery-provider":42}],24:[function(require,module,exports){
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
    if (groupSettings.isShowContentRec() &&
            (BrowserMetrics.isMobile() || AppMode.debug)) {
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

            MutationObserver.addOneTimeElementRemovalListener($textElement.get(0), function() {
                HashedElements.removeElement(hash, pageData.pageHash, $textElement);
                textIndicator.teardown();
                textReactions.teardown();
            });
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

                MutationObserver.addOneTimeElementRemovalListener($mediaElement.get(0), function() {
                    HashedElements.removeElement(hash, pageData.pageHash, $mediaElement);
                    indicator.teardown();
                });
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
                    scanForReadMore($element, pageData, groupSettings);
                    scanForContentRec($element, pageData, groupSettings);
                    // Next, see if any entire active sections were added
                    var $activeSections = find($element, groupSettings.activeSections(), true);
                    if ($activeSections.length > 0) {
                        $activeSections.each(function () {
                            var $section = $(this);
                            createAutoCallsToAction($section, pageData, groupSettings);
                        });
                        scanForCallsToAction($element, pageData, groupSettings);
                        $activeSections.each(function () {
                            var $section = $(this);
                            scanActiveElement($section, pageData, groupSettings);
                        });
                    } else {
                        // Finally, scan inside the element for content
                        var $activeSection = $element.closest(groupSettings.activeSections());
                        if ($activeSection.length > 0) {
                            createAutoCallsToAction($element, pageData, groupSettings);
                            scanForCallsToAction($element, pageData, groupSettings);
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
},{"./auto-call-to-action":2,"./call-to-action-indicator":6,"./content-rec-widget":12,"./hashed-elements":18,"./media-indicator-widget":21,"./page-data":23,"./page-data-loader":22,"./readmore-events":29,"./summary-widget":32,"./text-indicator-widget":35,"./text-reactions":36,"./utils/app-mode":38,"./utils/browser-metrics":39,"./utils/hash":41,"./utils/jquery-provider":42,"./utils/mutation-observer":51,"./utils/page-utils":52,"./utils/segment":58,"./utils/urls":65,"./utils/widget-bucket":68}],25:[function(require,module,exports){
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
},{"../templates/pending-reaction-page.hbs.html":85,"./svgs":33,"./utils/ractive-provider":54}],26:[function(require,module,exports){
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
},{"../templates/popup-widget.hbs.html":86,"./svgs":33,"./utils/jquery-provider":42,"./utils/ractive-provider":54,"./utils/transition-util":62,"./utils/widget-bucket":68}],27:[function(require,module,exports){
var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var Ractive; require('./utils/ractive-provider').onLoad(function(loadedRactive) { Ractive = loadedRactive;});

var AjaxClient = require('./utils/ajax-client');
var Range = require('./utils/range');
var ReactionsWidgetLayoutUtils = require('./utils/reactions-widget-layout-utils');

var Events = require('./events');
var PageData = require('./page-data');
var SVGs = require('./svgs');

var pageSelector = '.antenna-reactions-page';

function createPage(options) {
    var isSummary = options.isSummary;
    var reactionsData = options.reactionsData;
    var defaultReactions = options.defaultReactions;
    var containerData = options.containerData;
    var pageData = options.pageData;
    var groupSettings = options.groupSettings;
    var contentData = options.contentData;
    var containerElement = options.containerElement; // optional
    var showConfirmation = options.showConfirmation;
    var showComments = options.showComments;
    var showLocations = options.showLocations;
    var showPendingApproval = options.showPendingApproval;
    var showProgress = options.showProgress;
    var handleReactionError = options.handleReactionError;
    var element = options.element;

    var combinedReactionsData = combineReactionData(reactionsData, defaultReactions);
    var reactionsLayoutData = ReactionsWidgetLayoutUtils.computeLayoutData(combinedReactionsData);
    var $reactionsWindow = $(options.reactionsWindow);
    var ractive = Ractive({
        el: element,
        append: true,
        template: require('../templates/reactions-page.hbs.html'),
        data: {
            reactions: combinedReactionsData,
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
    ractive.on('react', function(ractiveEvent) {
        if (ractiveEvent.context.isDefault) {
            newDefaultReaction(ractiveEvent);
        } else {
            plusOne(ractiveEvent);
        }
    });
    ractive.on('newcustom', newCustomReaction);
    ractive.on('customfocus', customReactionFocus);
    ractive.on('customblur', customReactionBlur);
    ractive.on('pagekeydown', keyboardInput);
    ractive.on('inputkeydown', customReactionInput);
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
        AjaxClient.postPlusOne(reactionData, containerData, pageData, groupSettings, success, error);

        function success(reactionData, existing) {
            if (!existing) {
                Events.postReactionCreated(pageData, containerData, reactionData, groupSettings);
            }
        }

        function error(message) {
            var retry = function() {
                AjaxClient.postPlusOne(reactionData, containerData, pageData, groupSettings, success, error);
            };
            handleReactionError(message, retry, pageSelector);
        }
    }

    function newDefaultReaction(ractiveEvent) {
        var reactionData = ractiveEvent.context;
        var reactionProvider = createReactionProvider();
        showConfirmation(reactionData, reactionProvider); // Optimistically show confirmation for default reactions because they should always be accepted.
        AjaxClient.postNewReaction(reactionData, containerData, pageData, contentData, groupSettings, success, error);

        function success(reaction) {
            reaction = PageData.registerReaction(reaction, containerData, pageData);
            reactionProvider.reactionLoaded(reaction);
            Events.postReactionCreated(pageData, containerData, reaction, groupSettings);
        }

        function error(message) {
            var retry = function() {
                AjaxClient.postNewReaction(reactionData, containerData, pageData, contentData, groupSettings, success, error);
            };
            handleReactionError(message, retry, pageSelector);
        }
    }

    function newCustomReaction() {
        var input = ractive.find('.antenna-reactions-footer input');
        var body = input.value.trim();
        if (body !== '') {
            showProgress(); // Show progress for custom reactions because the server might reject them for a number of reasons
            var reactionData = { text: body };
            var reactionProvider = createReactionProvider();
            input.blur();
            AjaxClient.postNewReaction(reactionData, containerData, pageData, contentData, groupSettings, success, error);
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
                AjaxClient.postNewReaction(reactionData, containerData, pageData, contentData, groupSettings, success, error);
            };
            handleReactionError(message, retry, pageSelector);
        }
    }

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

    function keyboardInput(ractiveEvent) {
        if ($(rootElement(ractive)).hasClass('antenna-page-active')) { // only handle input when this page is active
            $(rootElement(ractive)).find('.antenna-reactions-footer input').focus();
        }
    }

    function rootElement(ractive) {
        return ractive.find(pageSelector);
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

function customReactionFocus(ractiveEvent) {
    var $footer = $(ractiveEvent.original.target).closest('.antenna-reactions-footer');
    $footer.find('input').not('.active').val('').addClass('active');
    $footer.find('button').show();
}

function customReactionBlur(ractiveEvent) {
    var event = ractiveEvent.original;
    if ($(event.relatedTarget).closest('.antenna-reactions-footer button').size() == 0) { // Don't hide the input when we click on the button
        var $footer = $(event.target).closest('.antenna-reactions-footer');
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

function combineReactionData(reactionsData, defaultReactions) {
    var combinedReactions = [];
    for (var i = 0; i < reactionsData.length; i++) {
        combinedReactions.push(reactionsData[i]);
    }
    for (var j = 0; j < defaultReactions.length; j++) {
        var defaultReaction = defaultReactions[j];
        var existing = false;
        for (var k = 0; k < reactionsData.length; k++) {
            if (reactionsData[k].text === defaultReaction.text) {
                existing = true;
                break;
            }
        }
        if (!existing) {
            combinedReactions.push(defaultReaction);
        }
    }
    return combinedReactions;
}

//noinspection JSUnresolvedVariable
module.exports = {
    create: createPage
};
},{"../templates/reactions-page.hbs.html":87,"./events":14,"./page-data":23,"./svgs":33,"./utils/ajax-client":37,"./utils/jquery-provider":42,"./utils/ractive-provider":54,"./utils/range":55,"./utils/reactions-widget-layout-utils":57}],28:[function(require,module,exports){
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
var Events = require('./events');
var GenericErrorPage = require('./generic-error-page');
var LocationsPage = require('./locations-page');
var LoginPage = require('./login-page');
var PageData = require('./page-data');
var PendingReactionPage = require('./pending-reaction-page');
var ReactionsPage = require('./reactions-page');
var SVGs = require('./svgs');

var SELECTOR_REACTIONS_WIDGET = '.antenna-reactions-widget';

var openInstances = [];

function openReactionsWidget(options, elementOrCoords) {
    closeAllWindows();
    var defaultReactions = options.defaultReactions;
    var reactionsData = options.reactionsData;
    var containerData = options.containerData;
    var containerElement = options.containerElement; // optional
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

        showReactions(false);
        if (isSummary) {
            Events.postSummaryOpened(pageData, groupSettings);
        } else {
            Events.postReactionWidgetOpened(pageData, containerData, contentData, groupSettings);
        }

        setupWindowClose(pages, ractive);
        preventExtraScroll($rootElement);
        openInstances.push(ractive);
    }

    function showReactions(animate) {
        if (containerElement && !contentData.location && !contentData.body) {
            Range.grabNode(containerElement.get(0), function (text, location) {
                contentData.location = location;
                contentData.body = text;
            });
        }
        var options = {
            isSummary: isSummary,
            reactionsData: reactionsData,
            defaultReactions: defaultReactions,
            pageData: pageData,
            groupSettings: groupSettings,
            containerData: containerData,
            contentData: contentData,
            containerElement: containerElement,
            showConfirmation: showConfirmation,
            showPendingApproval: showPendingApproval,
            showProgress: showProgressPage,
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
        AjaxClient.getComments(reaction, groupSettings, success, error);
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
        AjaxClient.fetchLocationDetails(reactionLocationData, pageData, groupSettings, success, error);
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
    $body.css({ height: newBodyHeight });
    var footerHeight = $page.find('.antenna-footer').outerHeight(); // returns 'null' if there's no footer. added to an integer, 'null' acts like 0
    var newPageHeight = newBodyHeight + footerHeight;
    if (animate) {
        $pageContainer.css({ height: currentHeight });
        $pageContainer.animate({ height: newPageHeight }, 200);
    } else {
        $pageContainer.css({ height: newPageHeight });
    }
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
    selector: SELECTOR_REACTIONS_WIDGET,
    teardown: closeAllWindows
};
},{"../templates/reactions-widget.hbs.html":88,"./blocked-reaction-page":3,"./comments-page":9,"./confirmation-page":10,"./events":14,"./generic-error-page":15,"./locations-page":19,"./login-page":20,"./page-data":23,"./pending-reaction-page":25,"./reactions-page":27,"./svgs":33,"./utils/ajax-client":37,"./utils/browser-metrics":39,"./utils/jquery-provider":42,"./utils/json-utils":43,"./utils/messages":49,"./utils/moveable":50,"./utils/ractive-provider":54,"./utils/range":55,"./utils/touch-support":61,"./utils/transition-util":62,"./utils/user":66,"./utils/widget-bucket":68}],29:[function(require,module,exports){
// This module sets up listeners on the readmore widget in order to record events using all the data available to
// the reaction widget.

var ThrottledEvents = require('./utils/throttled-events');
var Events = require('./events');

function setupReadMoreEvents(element, pageData, groupSettings) {
    var visibilityFired = false;
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
        if (!visibilityFired) { // don't fire more than once
            Events.postReadMoreVisible(pageData, groupSettings);
            ThrottledEvents.off('scroll', handleScrollEvent);
        }
        visibilityFired = true;
    }
}

module.exports = {
    setupReadMoreEvents: setupReadMoreEvents
};
},{"./events":14,"./utils/throttled-events":60}],30:[function(require,module,exports){
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
},{"./group-settings":17,"./hashed-elements":18,"./page-data":23,"./page-data-loader":22,"./page-scanner":24,"./popup-widget":26,"./reactions-widget":28,"./utils/mutation-observer":51}],31:[function(require,module,exports){
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
},{"./utils/app-mode":38,"./utils/jquery-provider":42,"./utils/ractive-provider":54,"./utils/rangy-provider":56,"./utils/urls":65}],32:[function(require,module,exports){
var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var BrowserMetrics = require('./utils/browser-metrics');
var Ractive; require('./utils/ractive-provider').onLoad(function(loadedRactive) { Ractive = loadedRactive;});
var Segment = require('./utils/segment');
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
    return BrowserMetrics.isMobile() && (groupSettings.isExpandedMobileSummary() || Segment.isExpandedSummarySegment(groupSettings));
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
},{"../templates/summary-widget.hbs.html":89,"./reactions-widget":28,"./svgs":33,"./utils/browser-metrics":39,"./utils/jquery-provider":42,"./utils/ractive-provider":54,"./utils/segment":58,"./utils/touch-support":61}],33:[function(require,module,exports){
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
},{"../templates/svg-comments.hbs.html":90,"../templates/svg-facebook.hbs.html":91,"../templates/svg-film.hbs.html":92,"../templates/svg-left.hbs.html":93,"../templates/svg-location.hbs.html":94,"../templates/svg-logo-selectable.hbs.html":95,"../templates/svg-logo.hbs.html":96,"../templates/svg-twitter.hbs.html":97,"../templates/svgs.hbs.html":98,"./utils/ractive-provider":54}],34:[function(require,module,exports){
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
},{"../templates/tap-helper.hbs.html":99,"./svgs":33,"./utils/browser-metrics":39,"./utils/ractive-provider":54,"./utils/widget-bucket":68}],35:[function(require,module,exports){
var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var Ractive; require('./utils/ractive-provider').onLoad(function(loadedRactive) { Ractive = loadedRactive;});
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
},{"../templates/text-indicator-widget.hbs.html":100,"./popup-widget":26,"./reactions-widget":28,"./svgs":33,"./utils/jquery-provider":42,"./utils/ractive-provider":54,"./utils/touch-support":61}],36:[function(require,module,exports){
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
},{"./popup-widget":26,"./reactions-widget":28,"./utils/jquery-provider":42,"./utils/range":55,"./utils/touch-support":61}],37:[function(require,module,exports){
var AppMode = require('./app-mode');
var JSONPClient = require('./jsonp-client');
var JSONUtils = require('./json-utils');
var Logging = require('./logging');
var URLs = require('./urls');
var User = require('./user');

function postNewReaction(reactionData, containerData, pageData, contentData, groupSettings, success, error) {
    var contentBody = contentData.body;
    var contentType = contentData.type;
    var contentLocation = contentData.location;
    var contentDimensions = contentData.dimensions;
    User.fetchUser(groupSettings, function(userInfo) {
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

function postPlusOne(reactionData, containerData, pageData, groupSettings, success, error) {
    User.fetchUser(groupSettings, function(userInfo) {
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

function postComment(comment, reactionData, containerData, pageData, groupSettings, success, error) {
    // TODO: refactor the post functions to eliminate all the copied code
    User.fetchUser(groupSettings, function(userInfo) {
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
        callback(reactionData, response.existing);
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

function getComments(reaction, groupSettings, successCallback, errorCallback) {
    User.fetchUser(groupSettings, function(userInfo) {
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

function fetchLocationDetails(reactionLocationData, pageData, groupSettings, successCallback, errorCallback) {
    var contentIDs = Object.getOwnPropertyNames(reactionLocationData);
    User.fetchUser(groupSettings, function(userInfo) {
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

function postShareReaction(reactionData, containerData, pageData, groupSettings, success, failure) {
    User.fetchUser(groupSettings, function(userInfo) {
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
    doGetJSONP(baseUrl, URLs.eventUrl(), event, function() { /*success*/ }, function(error) {
        // TODO: error handling
        Logging.debugMessage('An error occurred posting event: ', error);
    });
}

// Issues a JSONP request to a given server. To send a request to the application server, use getJSONP instead.
function doGetJSONP(baseUrl, url, params, success, error) {
    JSONPClient.doGetJSONP(baseUrl, url, params, success, error);
}

function postTrackingEvent(event) {
    var baseUrl = URLs.eventsServerUrl();
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
},{"./app-mode":38,"./json-utils":43,"./jsonp-client":44,"./logging":45,"./urls":65,"./user":66}],38:[function(require,module,exports){
var URLConstants = require('./url-constants');
var URLParams = require('./url-params');

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
    debug: URLParams.getUrlParam('antennaDebug') === 'true'
};
},{"./url-constants":63,"./url-params":64}],39:[function(require,module,exports){

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
},{}],40:[function(require,module,exports){

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
},{}],41:[function(require,module,exports){
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
},{"./jquery-provider":42,"./md5":46}],42:[function(require,module,exports){

var loadedjQuery;
var callbacks = [];

// Notifies the jQuery provider that we've loaded the jQuery library.
function loaded() {
    loadedjQuery = jQuery.noConflict(true);
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
},{}],43:[function(require,module,exports){

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
},{}],44:[function(require,module,exports){
var JSONUtils = require('./json-utils');

// Issues a JSONP request to a given server. Most higher-level functionality is in ajax-client.
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

module.exports = {
    doGetJSONP: doGetJSONP
};
},{"./json-utils":43}],45:[function(require,module,exports){
var AppMode = require('./app-mode');

function logDebugMessage(message) {
    if (AppMode.debug) {
        console.debug('AntennaDebug: ' + message);
    }
}

module.exports = {
    debugMessage: logDebugMessage
};
},{"./app-mode":38}],46:[function(require,module,exports){
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
},{}],47:[function(require,module,exports){
//noinspection JSUnresolvedVariable
module.exports = {
    'summary_widget__reactions': 'Reactions',
    'summary_widget__reactions_one': '1 Reaction',
    'summary_widget__reactions_many': '{0} Reactions',

    'reactions_widget__title': 'Reactions',
    'reactions_widget__title_thanks': 'Thanks for your reaction!',
    'reactions_widget__title_signin': 'Sign in Required',
    'reactions_widget__title_blocked': 'Blocked Reaction',
    'reactions_widget__title_error': 'Error',
    'reactions_widget__back': 'Back',

    'media_indicator__think': 'What do you think?',

    'popup_widget__think': 'What do you think?',

    'reactions_page__add': '+ Add Your Own',
    'reactions_page__ok': 'ok',

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

    'content_rec_widget__title': 'Reader Reactions',

    'login_page__message_1': '<span class="antenna-login-group">{0}</span> uses <a href="http://www.antenna.is/" target="_blank">Antenna</a> so you can react to content easily and safely.',
    'login_page__message_2': 'To keep participating, just log in:',
    'login_page__privacy': 'Antenna values your privacy. <a href="http://www.antenna.is/faq/" target="_blank">Learn more</a>.',
    'login_page__pending_pre': 'You might need to ',
    'login_page__pending_click': 'click here',
    'login_page__pending_post': ' once you\'ve logged in.'
};
},{}],48:[function(require,module,exports){
//noinspection JSUnresolvedVariable
module.exports = {
    'summary_widget__reactions': 'Reacciones',
    'summary_widget__reactions_one': '1 Reacción',
    'summary_widget__reactions_many': '{0} Reacciones',

    'reactions_widget__title': 'Reacciones',
    'reactions_widget__title_thanks': '¡Gracias por tu reacción!',
    'reactions_widget__title_signin': 'Es necesario iniciar sesión', // TODO: check translation
    'reactions_widget__title_blocked': 'Reacción bloqueado', // TODO: check translation
    'reactions_widget__title_error': 'Error', // TODO: check translation
    'reactions_widget__back': 'Volver',

    'media_indicator__think': '¿Qué piensas?',

    'popup_widget__think': '¿Qué piensas?',

    'reactions_page__add': '+ Añade lo tuyo',
    'reactions_page__ok': 'ok',

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
},{}],49:[function(require,module,exports){
var AppMode = require('./app-mode');
var GroupSettings = require('../group-settings');

var EnglishMessages = require('./messages-en');
var SpanishMessages = require('./messages-es');
validateTranslations();

function validateTranslations() {
    for (var englishKey in EnglishMessages) {
        if (EnglishMessages.hasOwnProperty(englishKey)) {
            if (!SpanishMessages.hasOwnProperty(englishKey)) {
                if (AppMode.offline || AppMode.debug) {
                    console.debug('Antenna warning: Spanish translation missing for key ' + englishKey);
                }
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
},{"../group-settings":17,"./app-mode":38,"./messages-en":47,"./messages-es":48}],50:[function(require,module,exports){
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
},{"./jquery-provider":42}],51:[function(require,module,exports){
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

function removeRemovalListener(callback) {
    if (removalListener) {
        removalListener.removeCallback(callback);
    }
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

function addOneTimeElementRemovalListener(node, callback) {
    var listener = function(removedElements) {
        for (var i = 0; i < removedElements.length; i++) {
            var removedElement = removedElements[i].get(0);
            if (removedElement.contains(node)) {
                removeRemovalListener(listener);
                callback();
            }
        }
    };
    addRemovalListener(listener);
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
    addOneTimeElementRemovalListener: addOneTimeElementRemovalListener,
    addOneTimeAttributeListener: addOneTimeAttributeListener,
    teardown: teardown
};
},{"./callback-support":40,"./jquery-provider":42,"./range":55,"./widget-bucket":68}],52:[function(require,module,exports){
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
},{"./jquery-provider":42}],53:[function(require,module,exports){
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
},{}],54:[function(require,module,exports){
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
    if (node.tagName.toLowerCase() != 'svg') { // IE returns no classList for SVG elements and Safari can't compute SVG element children
        node.classList.add(clazz);
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
},{"./messages":49,"./ractive-events-tap":53}],55:[function(require,module,exports){
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
},{"./jquery-provider":42,"./rangy-provider":56}],56:[function(require,module,exports){

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
},{}],57:[function(require,module,exports){
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
},{"./jquery-provider":42}],58:[function(require,module,exports){
var UrlParams = require('./url-params');

var segment;

function getSegment(groupSettings) {
    if (!segment) {
        segment = computeSegment(groupSettings);
    }
    return segment;
}

function computeSegment(groupSettings) {
    var segments = [ 'sw', 'xsw' ];
    var segmentOverride = UrlParams.getUrlParam('antennaSegment');
    if (segmentOverride) {
        storeSegment(segmentOverride);
        return segmentOverride;
    }
    var segment;
    if (isSegmentGroup()) {
        segment = readSegment();
        if (!segment) {
            segment = createSegment(groupSettings);
            segment = storeSegment(segment);
        }
    }
    return segment;

    function readSegment() {
        // Returns the stored segment, but only if it is one of the current valid segments.
        var segment = localStorage.getItem('ant_segment');
        if (segment) {
            for (var i = 0; i < segments.length; i++) {
                if (segment === segments[i]) {
                    return segment; // Valid segment. Return.
                }
            }
        }
    }

    function createSegment(groupSettings) {
        return segments[Math.floor(Math.random() * segments.length)];
    }

    function storeSegment(segment) {
        try {
            localStorage.setItem('ant_segment', segment);
        } catch(error) {
            // Some browsers (mobile Safari) throw an exception when in private browsing mode.
            // If this happens, fall back to a default value that will at least give us stable behavior.
            segment = segments[0];
        }
        return segment;
    }

    function isSegmentGroup() {
        var groupName = groupSettings.groupName();
        var testGroups = [ 'bustle.com', 'local.antenna.is:8081' ];
        for (var i = 0; i < testGroups.length; i++) {
            if (testGroups[i] === groupName) {
                return true;
            }
        }
        return false;
    }
}

function isExpandedSummarySegment(groupSettings) {
    return getSegment(groupSettings) === 'xsw';
}

module.exports = {
    getSegment: getSegment,
    isExpandedSummarySegment: isExpandedSummarySegment
};
},{"./url-params":64}],59:[function(require,module,exports){
var JSONUtils = require('./json-utils');

var ltsData;
var stsData;

function getLongTermSessionId() {
    if (!ltsData) {
        ltsData = localStorage.getItem('ant_lts');
        if (!ltsData) {
            ltsData = createGuid();
            try {
                localStorage.setItem('ant_lts', ltsData);
            } catch (error) {
                // Some browsers (mobile Safari) throw an exception when in private browsing mode.
                // Nothing we can do about it. Just fall through and return the data we have in memory.
            }
        }
    }
    return ltsData;
}

function getShortTermSessionId() {
    if (!stsData) {
        var json = localStorage.getItem('ant_sts');
        if (json) {
            stsData = JSON.parse(json);
        }
    }
    if (stsData && Date.now() > stsData.expires) {
        stsData = null; // expire the session
    }
    if (!stsData) {
        stsData = { guid: createGuid() }; // create a new session
    }
    // Always set a new expires time, so that we keep extending the time as long as the user is active
    var minutes = 15;
    stsData.expires = Date.now() + minutes * 60000;
    try {
        localStorage.setItem('ant_sts', JSONUtils.stringify(stsData));
    } catch(error) {
        // Some browsers (mobile Safari) throw an exception when in private browsing mode.
        // Nothing we can do about it. Just fall through and return the data we have in memory.
    }
    return stsData.guid;
}

function createGuid() {
    // Code copied from engage_full (originally, http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript)
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

module.exports = {
    getLongTermSession: getLongTermSessionId,
    getShortTermSession: getShortTermSessionId
};
},{"./json-utils":43}],60:[function(require,module,exports){
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
},{"./callback-support":40}],61:[function(require,module,exports){

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
},{}],62:[function(require,module,exports){


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
},{}],63:[function(require,module,exports){
var PROD_SERVER_URL = "https://www.antenna.is"; // TODO: www? how about antenna.is or api.antenna.is?
var DEV_SERVER_URL = "http://local-static.antenna.is:8081";
var TEST_SERVER_URL = 'http://localhost:3001';
var AMAZON_S3_URL = '//cdn.antenna.is';

var PROD_EVENT_SERVER_URL = 'https://events.antenna.is';
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
},{}],64:[function(require,module,exports){

var urlParams;

function getUrlParam(key) {
    if (!urlParams) {
        urlParams = parseUrlParams();
    }
    return urlParams[key];
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
    getUrlParam: getUrlParam
};
},{}],65:[function(require,module,exports){
var AppMode = require('./app-mode');
var JSONUtils = require('./json-utils');
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
    return '/api/contentrec/';
}

function getShareReactionUrl() {
    return '/api/share/;'
}

function getCreateTempUserUrl() {
    return '/api/tempuser/';
}

function getShareWindowUrl() {
    return '/static/share.html';
}

function getEventUrl() {
    return '/insert'; // Note that this URL is for the event server, not the app server.
}

function antennaLoginUrl() {
    return '/ant_login/';
}

function computeImageUrl($element, groupSettings) {
    var transform = getImageURLTransform(groupSettings);
    if (transform) {
        return transform($element.get(0));
    }
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

function getImageURLTransform(groupSettings) {
    if (groupSettings.groupName().indexOf('.about.com') !== -1) {
        var pattern = /(http:\/\/f\.tqn\.com\/y\/[^\/]*\/1)\/[LW]\/([^\/]\/[^\/]\/[^\/]\/[^\/]\/[^\/]*)/gi;
        return function(element) {
            var src = element.getAttribute('src');
            if (src) {
                return src.replace(pattern, '$1/S/$2');
            }
        }
    }
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

// Returns a URL for content rec which will take the user to the target url and record the given click event
function computeContentRecUrl(targetUrl, clickEvent) {
    return appServerUrl() + '/cr/?targetUrl=' + encodeURIComponent(targetUrl) + '&event=' + encodeURIComponent(JSONUtils.stringify(clickEvent))
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
    createTempUserUrl: getCreateTempUserUrl,
    shareWindowUrl: getShareWindowUrl,
    antennaLoginUrl: antennaLoginUrl,
    computeImageUrl: computeImageUrl,
    computeMediaUrl: computeMediaUrl,
    computeContentRecUrl: computeContentRecUrl,
    eventUrl: getEventUrl
};

},{"./app-mode":38,"./json-utils":43,"./url-constants":63}],66:[function(require,module,exports){
var AppMode = require('./app-mode');
var JSONPClient = require('./jsonp-client');
var URLs = require('./urls');
var XDMClient = require('./xdm-client');

var cachedUserInfo;

// Fetch the logged in user. Will trigger a network request to create a temporary user if needed.
function fetchUser(groupSettings, callback) {
    getUserCookies(function(cookies) {
        if (!cookies.ant_token) {
            createTempUser(groupSettings, callback);
        } else {
            updateUserFromCookies(cookies);
            callback(cachedUserInfo);
        }
    });
}

function refreshUserFromCookies(callback) {
    getUserCookies(function(cookies) {
        updateUserFromCookies(cookies);
        callback(cachedUserInfo);
    });
}

function getUserCookies(callback) {
    XDMClient.sendMessage('getCookies', [ 'user_id', 'user_type', 'ant_token', 'temp_user' ], function(cookies) {
        callback(cookies);
    });
}

function storeUserCookies(userInfo) {
    var cookies = {
        'user_id': userInfo.user_id,
        'user_type': userInfo.user_type,
        'ant_token': userInfo.ant_token,
        'temp_user': userInfo.temp_user
    };
    XDMClient.sendMessage('setCookies', cookies);
}

function createTempUser(groupSettings, callback) {
    var sendData = {
        group_id : groupSettings.groupId()
    };
    // This module uses the low-level JSONPClient instead of AjaxClient in order to avoid a circular dependency.
    JSONPClient.doGetJSONP(URLs.appServerUrl(), URLs.createTempUserUrl(), sendData, function (response) {
        if (!cachedUserInfo || !cachedUserInfo.user_id || !cachedUserInfo.ant_token || !cachedUserInfo.temp_user) {
            // It's possible that multiple of these ajax requests got fired in parallel. Whichever one
            // comes back first wins.
            updateUserFromResponse(response);
        }
        callback(cachedUserInfo);
    });
}

function updateUserFromCookies(cookies) {
    var userInfo = {};
    userInfo.user_id = cookies.user_id;
    userInfo.user_type = cookies.user_type;
    userInfo.ant_token = cookies.ant_token;
    userInfo.temp_user = cookies.temp_user;

    cachedUserInfo = userInfo;
    return cachedUserInfo;

}

function updateUserFromResponse(response) {
    response = response || {};

    var userInfo = {};
    userInfo.ant_token = response.ant_token;
    userInfo.user_id = response.user_id;
    userInfo.full_name = response.full_name;
    userInfo.first_name = response.full_name;
    userInfo.img_url = response.img_url;
    userInfo.user_type = response.user_type;
    userInfo.temp_user = !userInfo.first_name && !userInfo.full_name;

    cachedUserInfo = userInfo;
    storeUserCookies(userInfo); // Update cookies whenever we get a user from the server.
}

// Returns the logged-in user, if we already have one. Will not trigger a network request.
function cachedUser() {
    return cachedUserInfo;
}

// Attempts to create a new authorization token for the logged-in user.
function reAuthorizeUser(groupSettings, callback) {
    var oldToken = cachedUserInfo ? cachedUserInfo.ant_token : undefined;
    getUserCookies(function(cookies) {
        updateUserFromCookies(cookies);
        var userType = cookies.user_type;
        if (userType === 'facebook') {
            XDMClient.sendMessage('facebookGetLoginStatus', true, function(response) { // Force a round trip to reauthorize.
                if (response.status === 'connected') {
                    getAntTokenForFacebookLogin(response.authResponse, groupSettings, notifyHasNewToken);
                } else if (response.status === 'not_authorized') {
                    // The user didn't authorize us for FB login. Revert them to a temp user instead.
                    deAuthorizeUser(function() {
                        createTempUser(groupSettings, notifyHasNewToken);
                    });
                } else {
                    // TODO: Make sure the FB login window opens properly when triggered from the background like this.
                    facebookLogin(groupSettings, notifyHasNewToken);
                }
            });
        } else {
            // For Antenna users, just re-read the cookies and see if they've changed.
            notifyHasNewToken();
        }
    });

    function notifyHasNewToken() {
        var hasNewToken = cachedUserInfo && cachedUserInfo.ant_token && cachedUserInfo.ant_token !== oldToken;
        if (callback) { callback(hasNewToken) };
    }
}

function facebookLogin(groupSettings, callback) {
    XDMClient.sendMessage('facebookLogin', { scope: 'email' }, function(response) {
        var authResponse = response.authResponse;
        if (authResponse) {
            getAntTokenForFacebookLogin(authResponse, groupSettings, function() {
                callback(cachedUserInfo);
            });
        } else {
            callback(cachedUserInfo);
        }
    });
}

function getAntTokenForFacebookLogin(facebookAuthResponse, groupSettings, callback) {
    var sendData = {
        fb: facebookAuthResponse,
        group_id: groupSettings.groupId(),
        user_id: cachedUserInfo.user_id, // might be temp, might be the ID of a valid FB-created user
        ant_token: cachedUserInfo.ant_token
    };
    JSONPClient.doGetJSONP(URLs.appServerUrl(), '/api/fb', sendData, function (response) {
        updateUserFromResponse(response);
        callback(cachedUserInfo);
    }, function (error) {
        createTempUser(groupSettings, callback);
    });
}

function deAuthorizeUser(callback) {
    if (cachedUserInfo && !cachedUserInfo.temp_user) {
        var sendData = {
            user_id : cachedUserInfo.user_id,
            ant_token : cachedUserInfo.ant_token
        };
        JSONPClient.doGetJSONP(URLs.appServerUrl(), '/api/deauthorize', sendData, function(response) {
            discardUserInfo(callback);
        })
    } else {
        discardUserInfo(callback);
    }
}

function discardUserInfo(callback) {
    XDMClient.sendMessage('removeCookies', ['user_id', 'user_type', 'ant_token', 'temp_user'], {}, function (response) {
        cachedUserInfo = {};
        callback();
    });
}

// TODO: Figure out how many different formats of user data we have and either unify them or provide clear
//       API here to translate each variation into something standard for the client.
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
    refreshUserFromCookies: refreshUserFromCookies,
    cachedUser: cachedUser,
    reAuthorizeUser: reAuthorizeUser,
    facebookLogin: facebookLogin
};
},{"./app-mode":38,"./jsonp-client":44,"./urls":65,"./xdm-client":69}],67:[function(require,module,exports){
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
                // ANTENNA modification: use the bounding client rect, which accounts for things like CSS transforms
                var elr = el.getBoundingClientRect();
                var pr = p.getBoundingClientRect();
                if (elr.left >= pr.right ||
                    elr.right <= pr.left ||
                    elr.top >= pr.bottom ||
                    elr.bottom <= pr.top) {
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
},{}],68:[function(require,module,exports){
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
},{}],69:[function(require,module,exports){
var XdmLoader = require('./xdm-loader');

// Register ourselves to hear messages
window.addEventListener("message", receiveMessage, false);

var responseHandlers = { 'xdm_loaded': xdmLoaded };
var queuedMessages = [];

var isXDMLoaded = false;
// The initial message that XDM sends out when it loads
function xdmLoaded(data) {
    isXDMLoaded = true;
    // Fire any messages that have been waiting for XDM to be ready
    for (var i = 0; i < queuedMessages.length; i++) {
        var messageData = queuedMessages[i];
        sendMessage(messageData.messageKey, messageData.messageParams, messageData.callback);
    }
}

function sendMessage(messageKey, messageParams, callback) {
    if (isXDMLoaded) {
        var callbackKey = 'antenna' + Math.random().toString(16).slice(2);
        if (callback) { responseHandlers[callbackKey] = callback; }
        postMessage({
            messageKey: messageKey,
            messageParams: messageParams,
            callbackKey: callbackKey
        });
    } else {
        queuedMessages.push({ messageKey: messageKey, messageParams: messageParams, callback: callback });
    }
}

function receiveMessage(event) {
    var eventOrigin = event.origin;
    if (eventOrigin === XdmLoader.ORIGIN) {
        var data = event.data;
        // TODO: The event.source property gives us the source window of the message and currently the XDM frame fires out
        // events that we receive before we ever try to post anything. So we *could* hold onto the window here and use it
        // for posting messages rather than looking for the XDM frame ourselves. Need to look at which events the XDM frame
        // fires out to all windows before being asked. Currently, it's more than "xdm loaded". Why?
        //var sourceWindow = event.source;

        var callbackKey = data.messageKey;
        var callback = responseHandlers[callbackKey];
        if (callback) {
            callback(data.messageParams);
            delete responseHandlers[callbackKey];
        }
    }
}

function postMessage(message) {
    var xdmFrame = getXDMFrame();
    if (xdmFrame) {
        xdmFrame.postMessage(message, XdmLoader.ORIGIN);
    }
}

function getXDMFrame() {
    // TODO: Is this a security problem? What prevents someone from using this same name and intercepting our messages?
    return window.frames['ant-xdm-hidden'];
}

module.exports = {
    sendMessage: sendMessage
};
},{"./xdm-loader":70}],70:[function(require,module,exports){
var AppMode = require('./app-mode');
var URLConstants = require('./url-constants');
var WidgetBucket = require('./widget-bucket');

var XDM_ORIGIN = AppMode.offline ? URLConstants.DEVELOPMENT : URLConstants.PRODUCTION;

function createXDMframe(groupId) {
    var xdmUrl = XDM_ORIGIN + '/static/widget-new/xdm-new.html';
    var parentUrl = encodeURIComponent(window.location.href);
    var parentHost = encodeURIComponent(window.location.protocol + '//' + window.location.host);
    var xdmFrame = document.createElement('iframe');
    xdmFrame.setAttribute('id', 'ant-xdm-hidden');
    xdmFrame.setAttribute('name', 'ant-xdm-hidden');
    xdmFrame.setAttribute('src', xdmUrl + '?parentUrl=' + parentUrl + '&parentHost=' + parentHost + '&group_id=' + groupId);
    xdmFrame.setAttribute('width', 1);
    xdmFrame.setAttribute('height', 1);
    xdmFrame.setAttribute('style', 'position:absolute;top:-1000px;left:-1000px;');

    WidgetBucket.get().appendChild(xdmFrame);
}

module.exports = {
    createXDMframe: createXDMframe,
    ORIGIN: XDM_ORIGIN
};
},{"./app-mode":38,"./url-constants":63,"./widget-bucket":68}],71:[function(require,module,exports){
var XDMClient = require('./utils/xdm-client');
var Events = require('./events');
var GroupSettings = require('./group-settings');
var PageData = require('./page-data');

function checkAnalyticsCookies() {
    // When the widget loads, check for any cookies that have been written by the legacy content rec.
    // If those cookies exist, fire the event and clear them.
    XDMClient.sendMessage('getCookies', [ 'redirect_type', 'referring_int_id', 'page_hash' ], function(cookies) {
        if (cookies.redirect_type === '/r/') {
            var reactionId = cookies.referring_int_id;
            var pageHash = cookies.page_hash;
            getPageData(pageHash, function(pageData) {
                Events.postLegacyRecircClicked(pageData, reactionId, GroupSettings.get());
                XDMClient.sendMessage('removeCookies', [ 'redirect_type', 'referring_int_id', 'page_hash' ]);
            });
        }
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
    start: checkAnalyticsCookies
};
},{"./events":14,"./group-settings":17,"./page-data":23,"./utils/xdm-client":69}],72:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna antenna-auto-cta"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-auto-cta-inner","ant-cta-for":[{"t":2,"r":"antItemId"}]},"f":[{"t":8,"r":"logo"},{"t":7,"e":"span","a":{"class":"antenna-auto-cta-label","ant-reactions-label-for":[{"t":2,"r":"antItemId"}]}},{"t":4,"f":[{"t":7,"e":"span","a":{"ant-expanded-reactions-for":[{"t":2,"r":"antItemId"}]}}],"n":50,"r":"expandReactions"}]}]}]}
},{}],73:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna-page antenna-blocked-page"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-body"},"f":[{"t":7,"e":"div","v":{"tap":"back"},"a":{"class":"antenna-blocked-back"},"f":[{"t":8,"r":"left"},{"t":2,"x":{"r":["getMessage"],"s":"_0(\"reactions_widget__back\")"}}]}," ",{"t":7,"e":"div","a":{"class":"antenna-blocked-body"},"f":[{"t":7,"e":"div","a":{"class":"antenna-blocked-message"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"blocked_page__message1\")"}}]}," ",{"t":7,"e":"div","a":{"class":"antenna-blocked-message"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"blocked_page__message2\")"}}]}]}]}]}]}
},{}],74:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":4,"f":[{"t":2,"r":"containerData.reactionTotal"}],"n":50,"x":{"r":["containerData.reactionTotal","containerData.loaded"],"s":"_0&&_1"}}]}
},{}],75:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":4,"f":[{"t":7,"e":"span","a":{"class":["antenna-cta-expanded-reaction ",{"t":4,"f":["antenna-cta-expanded-first"],"n":50,"x":{"r":["@index"],"s":"_0===0"}}]},"f":[{"t":7,"e":"span","a":{"class":"antenna-cta-expanded-text"},"f":[{"t":2,"r":"./text"}]},{"t":7,"e":"span","a":{"class":"antenna-cta-expanded-count"},"f":[{"t":2,"r":"./count"}]}]}],"x":{"r":["computeExpandedReactions","containerData.reactions"],"s":"_0(_1)"}}]}
},{}],76:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":4,"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"call_to_action_label__responses\")"}}],"n":50,"x":{"r":["containerData.loaded","containerData.reactionTotal"],"s":"!_0||_1===undefined||_1===0"}},{"t":4,"n":51,"f":[{"t":4,"n":50,"x":{"r":["containerData.reactionTotal"],"s":"_0===1"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"call_to_action_label__responses_one\")"}}]},{"t":4,"n":50,"x":{"r":["containerData.reactionTotal"],"s":"!(_0===1)"},"f":[" ",{"t":2,"x":{"r":["getMessage","containerData.reactionTotal"],"s":"_0(\"call_to_action_label__responses_many\",[_1])"}}]}],"x":{"r":["containerData.loaded","containerData.reactionTotal"],"s":"!_0||_1===undefined||_1===0"}}]}
},{}],77:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna-comment-area"},"f":[{"t":7,"e":"div","a":{"class":"antenna-comment-widgets"},"f":[{"t":7,"e":"textarea","v":{"input":"inputchanged"},"a":{"class":"antenna-comment-input","placeholder":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"comment_area__placeholder\")"}}],"maxlength":"500"}}," ",{"t":7,"e":"div","a":{"class":"antenna-comment-footer"},"f":[{"t":7,"e":"span","a":{"class":"antenna-comment-limit"},"f":[{"t":3,"x":{"r":["getMessage"],"s":"_0(\"comment_area__count\")"}}]}," ",{"t":7,"e":"button","a":{"id":"antenna-comment-spacer"}}," ",{"t":7,"e":"button","a":{"class":"antenna-comment-submit"},"v":{"tap":"addcomment"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"comment_area__add\")"}}]}]}]}," ",{"t":7,"e":"div","a":{"class":"antenna-comment-waiting"},"f":["..."]}," ",{"t":7,"e":"div","a":{"class":"antenna-comment-received"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"comment_area__thanks\")"}}]}]}]}
},{}],78:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna-page antenna-comments-page"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-body"},"f":[{"t":7,"e":"div","v":{"tap":"back"},"a":{"class":"antenna-comments-back"},"f":[{"t":8,"r":"left"},{"t":2,"x":{"r":["getMessage"],"s":"_0(\"reactions_widget__back\")"}}]}," ",{"t":7,"e":"div","a":{"class":"antenna-comments-header"},"f":[{"t":2,"x":{"r":["getMessage","comments.length"],"s":"_0(\"comments_page__header\",[_1])"}}]}," ",{"t":4,"f":[{"t":7,"e":"div","a":{"class":["antenna-comment-entry ",{"t":4,"f":["antenna-comment-new"],"n":50,"r":"./new"}]},"f":[{"t":7,"e":"table","f":[{"t":7,"e":"tr","f":[{"t":7,"e":"td","a":{"class":"antenna-comment-cell"},"f":[{"t":7,"e":"img","a":{"src":[{"t":2,"r":"./user.imageURL"}]}}]}," ",{"t":7,"e":"td","a":{"class":"antenna-comment-author"},"f":[{"t":2,"r":"./user.name"}]}]}," ",{"t":7,"e":"tr","f":[{"t":7,"e":"td","f":[]}," ",{"t":7,"e":"td","a":{"class":"antenna-comment-text"},"f":[{"t":2,"r":"./text"}]}]}]}]}],"i":"index","r":"comments"}," ",{"t":8,"r":"commentArea"}]}]}]}
},{}],79:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna-page antenna-confirmation-page"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-body"},"f":[{"t":7,"e":"div","a":{"class":"antenna-confirm-reaction"},"f":[{"t":2,"r":"text"}]}," ",{"t":8,"r":"commentArea"}]}," ",{"t":7,"e":"div","a":{"class":"antenna-footer antenna-confirm-footer"},"f":[{"t":7,"e":"span","a":{"class":"antenna-share"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"confirmation_page__share\")"}}," ",{"t":7,"e":"a","v":{"tap":"share-facebook"},"a":{"href":"//facebook.com"},"f":[{"t":8,"r":"facebookIcon"}]}," ",{"t":7,"e":"a","v":{"tap":"share-twitter"},"a":{"href":"//twitter.com"},"f":[{"t":8,"r":"twitterIcon"}]}]}]}]}]}
},{}],80:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":4,"f":[{"t":7,"e":"div","a":{"class":"antenna antenna-contentrec-inner"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-contentrec-header"},"f":[{"t":2,"r":"title"}]}," ",{"t":7,"e":"div","a":{"class":"antenna-contentrec-entries"},"f":[{"t":4,"f":[{"t":7,"e":"div","a":{"class":["antenna-contentrec-entry antenna-reset ",{"t":4,"f":["antenna-desktop"],"n":51,"r":"isMobile"}],"style":["width:",{"t":2,"r":"entryWidth"},";"]},"f":[{"t":7,"e":"a","a":{"href":[{"t":2,"x":{"r":["computeEntryUrl","."],"s":"_0(_1)"}}],"target":[{"t":4,"f":["_self"],"n":50,"r":"isMobile"},{"t":4,"n":51,"f":["_target"],"r":"isMobile"}]},"f":[{"t":7,"e":"div","a":{"class":"antenna-contentrec-entry-inner"},"f":[{"t":7,"e":"div","a":{"class":"antenna-contentrec-entry-header"},"f":[{"t":7,"e":"div","a":{"class":"antenna-contentrec-reaction-text"},"f":[{"t":2,"r":"./top_reaction.text"}]}," ",{"t":7,"e":"div","a":{"class":"antenna-contentrec-indicator-wrapper"},"f":[{"t":7,"e":"div","a":{"class":"antenna-contentrec-reaction-indicator"},"f":[{"t":8,"r":"logo"},{"t":7,"e":"span","a":{"class":"antenna-contentrec-reaction-count"},"f":[" ",{"t":2,"r":"./reaction_count"}]}]}]}]}," ",{"t":7,"e":"div","a":{"class":"antenna-contentrec-body","style":["background:",{"t":2,"rx":{"r":"colors","m":[{"t":30,"n":"index"},"background"]}},";color:",{"t":2,"rx":{"r":"colors","m":[{"t":30,"n":"index"},"foreground"]}},";"]},"f":[{"t":4,"f":[{"t":7,"e":"div","a":{"class":"antenna-contentrec-body-image"},"f":[{"t":7,"e":"img","a":{"src":[{"t":2,"r":"./content.body"}]}}]}],"n":50,"x":{"r":["./content.type"],"s":"_0===\"image\""}},{"t":4,"n":51,"f":[{"t":4,"n":50,"x":{"r":["./content.type"],"s":"_0===\"text\""},"f":[{"t":7,"e":"div","a":{"class":"antenna-contentrec-body-text"},"o":"renderText","f":[{"t":2,"r":"./content.body"}]}]}],"x":{"r":["./content.type"],"s":"_0===\"image\""}}]}," ",{"t":7,"e":"div","a":{"class":"antenna-contentrec-page-title"},"f":[{"t":2,"r":"./page.title"}]}]}]}]}],"i":"index","r":"contentData.entries"}]}]}],"n":50,"x":{"r":["populateContentEntries","pageData.summaryLoaded","contentData.entries"],"s":"_0(_1)&&_2"}}]}
},{}],81:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna-page antenna-error-page"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-body"},"f":[{"t":7,"e":"div","v":{"tap":"back"},"a":{"class":"antenna-error-back"},"f":[{"t":8,"r":"left"},{"t":2,"x":{"r":["getMessage"],"s":"_0(\"reactions_widget__back\")"}}]}," ",{"t":7,"e":"div","a":{"class":"antenna-error-body"},"f":[{"t":7,"e":"div","a":{"class":"antenna-error-message"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"error_page__message\")"}}]}]}]}]}]}
},{}],82:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna-page antenna-locations-page"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-body"},"f":[{"t":7,"e":"div","v":{"tap":"back"},"a":{"class":"antenna-locations-back"},"f":[{"t":8,"r":"left"},{"t":2,"x":{"r":["getMessage"],"s":"_0(\"reactions_widget__back\")"}}]}," ",{"t":7,"e":"table","a":{"class":"antenna-locations-table"},"f":[{"t":4,"f":[{"t":7,"e":"tr","a":{"class":"antenna-locations-content-row"},"f":[{"t":7,"e":"td","a":{"class":"antenna-locations-count-cell"},"f":[{"t":4,"f":[{"t":3,"x":{"r":["getMessage"],"s":"_0(\"locations_page__count_one\")"}}],"n":50,"x":{"r":["pageReactionCount"],"s":"_0===1"}},{"t":4,"n":51,"f":[{"t":3,"x":{"r":["getMessage","pageReactionCount"],"s":"_0(\"locations_page__count_many\",[_1])"}}],"x":{"r":["pageReactionCount"],"s":"_0===1"}}]}," ",{"t":7,"e":"td","a":{"class":"antenna-locations-page-body"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"locations_page__pagelevel\")"}}]}]}],"n":50,"r":"pageReactionCount"}," ",{"t":4,"f":[{"t":4,"f":[" ",{"t":7,"e":"tr","v":{"tap":"reveal"},"a":{"class":["antenna-locations-content-row ",{"t":4,"f":["antenna-locate"],"n":50,"x":{"r":["canLocate","./containerHash"],"s":"_0(_1)"}}]},"f":[{"t":7,"e":"td","a":{"class":"antenna-locations-count-cell"},"f":[{"t":4,"f":[{"t":3,"x":{"r":["getMessage"],"s":"_0(\"locations_page__count_one\")"}}],"n":50,"x":{"r":["./count"],"s":"_0===1"}},{"t":4,"n":51,"f":[{"t":3,"x":{"r":["getMessage","./count"],"s":"_0(\"locations_page__count_many\",[_1])"}}],"x":{"r":["./count"],"s":"_0===1"}}]}," ",{"t":4,"f":[{"t":7,"e":"td","a":{"class":"antenna-locations-text-body"},"f":[{"t":2,"r":"./body"}]}],"n":50,"x":{"r":["./kind"],"s":"_0===\"txt\""}},{"t":4,"n":51,"f":[{"t":4,"n":50,"x":{"r":["./kind"],"s":"_0===\"img\""},"f":[{"t":7,"e":"td","a":{"class":"antenna-locations-image-body"},"f":[{"t":7,"e":"img","a":{"src":[{"t":2,"r":"./body"}]}}]}]},{"t":4,"n":50,"x":{"r":["./kind"],"s":"(!(_0===\"img\"))&&(_0===\"med\")"},"f":[" ",{"t":7,"e":"td","a":{"class":"antenna-locations-media-body"},"f":[{"t":8,"r":"film"},{"t":7,"e":"span","a":{"class":"antenna-locations-video"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"locations_page__video\")"}}]}]}]},{"t":4,"n":50,"x":{"r":["./kind"],"s":"(!(_0===\"img\"))&&(!(_0===\"med\"))"},"f":[" ",{"t":7,"e":"td","f":[" "]}]}],"x":{"r":["./kind"],"s":"_0===\"txt\""}}]}],"n":50,"x":{"r":["./kind"],"s":"_0!==\"pag\""}}],"i":"id","r":"locationData"}]}]}]}]}
},{}],83:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna-page antenna-login-page"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-body"},"f":[{"t":7,"e":"div","v":{"tap":"back"},"a":{"class":"antenna-login-back"},"f":[{"t":8,"r":"left"},{"t":2,"x":{"r":["getMessage"],"s":"_0(\"reactions_widget__back\")"}}]}," ",{"t":7,"e":"div","a":{"class":"antenna-login-container"},"f":[{"t":7,"e":"div","a":{"class":"antenna-login-content"},"f":[{"t":7,"e":"div","a":{"class":"antenna-login-message"},"f":[{"t":3,"x":{"r":["getMessage","groupName"],"s":"_0(\"login_page__message_1\",[_1])"}}]}," ",{"t":7,"e":"div","a":{"class":"antenna-login-message"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"login_page__message_2\")"}}]}," ",{"t":7,"e":"div","a":{"class":"antenna-login-buttons"},"f":[{"t":7,"e":"div","a":{"class":"fb-login-button"},"v":{"tap":"facebookLogin"},"f":[{"t":7,"e":"img","a":{"src":"/static/widget/images/fb-login_to_readrboard.png"}}]}," ",{"t":7,"e":"div","a":{"class":"antenna-or"},"f":["or"]}," ",{"t":7,"e":"div","a":{"class":"antenna-login-button"},"v":{"tap":"antennaLogin"},"f":[{"t":8,"r":"logo"},{"t":7,"e":"span","a":{"class":"antenna-login-text"},"f":["Login to Antenna"]}]}]}," ",{"t":7,"e":"div","a":{"class":"antenna-privacy-text"},"f":[{"t":3,"x":{"r":["getMessage"],"s":"_0(\"login_page__privacy\")"}}]}]}," ",{"t":7,"e":"div","a":{"class":"antenna-login-pending"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"login_page__pending_pre\")"}},{"t":7,"e":"a","a":{"href":"javascript:void(0);"},"v":{"tap":"retry"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"login_page__pending_click\")"}}]},{"t":2,"x":{"r":["getMessage"],"s":"_0(\"login_page__pending_post\")"}}]}]}]}]}]}
},{}],84:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"span","o":"cssreset","a":{"class":"antenna antenna-media-indicator-wrapper"},"f":[{"t":7,"e":"span","m":[{"t":2,"r":"extraAttributes"}],"a":{"class":["antenna antenna-media-indicator-widget ",{"t":4,"f":["antenna-notloaded"],"n":51,"r":"containerData.loaded"}," antenna-reset ",{"t":4,"f":["antenna-touch"],"n":50,"r":"supportsTouch"}]},"f":[" ",{"t":8,"r":"logo"}," ",{"t":4,"f":[{"t":7,"e":"span","a":{"class":"antenna-reaction-total"},"o":"cssreset","f":[{"t":2,"r":"containerData.reactionTotal"}]}],"n":50,"r":"containerData.reactionTotal"},{"t":4,"n":51,"f":[{"t":7,"e":"span","a":{"class":"antenna-reaction-prompt"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"media_indicator__think\")"}}]}],"r":"containerData.reactionTotal"}]}]}]}
},{}],85:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna-page antenna-pending-page"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-body"},"f":[{"t":7,"e":"div","a":{"class":"antenna-pending-reaction"},"f":[{"t":2,"r":"text"}]}," ",{"t":7,"e":"div","a":{"class":"antenna-pending-message"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"pending_page__message_appear\")"}}]}]}]}]}
},{}],86:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna-popup"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-popup-body"},"f":[{"t":8,"r":"logo"},{"t":7,"e":"span","a":{"class":"antenna-popup-text"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"popup_widget__think\")"}}]}]}]}]}
},{}],87:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna-page antenna-reactions-page"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-body"},"f":[{"t":4,"f":[{"t":4,"f":[{"t":7,"e":"div","v":{"tap":"react","mouseenter":"highlight","mouseleave":"clearhighlights"},"a":{"class":["antenna-reaction ",{"t":2,"x":{"r":["reactionsLayoutClass","index"],"s":"_0(_1)"}}]},"f":[{"t":7,"e":"div","a":{"class":"antenna-reaction-box"},"f":[{"t":7,"e":"div","a":{"class":["antenna-reaction-text ",{"t":4,"f":["antenna-reaction-zero"],"n":51,"r":"./count"}]},"o":"sizetofit","f":[{"t":2,"r":"./text"}]}," ",{"t":7,"e":"div","a":{"class":"antenna-reaction-count"},"f":[{"t":2,"r":"./count"}]}," ",{"t":7,"e":"div","a":{"class":"antenna-plusone"},"f":["+1"]}," ",{"t":4,"f":[{"t":7,"e":"div","v":{"tap":"showlocations"},"a":{"class":"antenna-reaction-location"},"f":[{"t":8,"r":"locationIcon"}]}],"n":50,"x":{"r":["isSummary","./count"],"s":"_0&&_1"}},{"t":4,"n":51,"f":[{"t":4,"f":[{"t":7,"e":"div","v":{"tap":"showcomments"},"a":{"class":"antenna-reaction-comments hascomments"},"f":[{"t":8,"r":"commentsIcon"}," ",{"t":2,"r":"./commentCount"}]}],"n":50,"r":"./commentCount"}],"x":{"r":["isSummary","./count"],"s":"_0&&_1"}}]}]}],"i":"index","r":"reactions"}],"n":50,"r":"reactions"}]}," ",{"t":7,"e":"div","a":{"class":"antenna-footer antenna-reactions-footer"},"f":[{"t":7,"e":"div","a":{"class":"antenna-custom-area"},"f":[{"t":7,"e":"input","v":{"focus":"customfocus","keydown":"inputkeydown","blur":"customblur"},"a":{"value":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"reactions_page__add\")"}}],"maxlength":"25"}}," ",{"t":7,"e":"button","v":{"tap":"newcustom"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"reactions_page__ok\")"}}]}]}," ",{"t":7,"e":"div","a":{"class":"antenna-text-logo"},"f":[{"t":7,"e":"a","a":{"href":"//www.antenna.is"},"f":["Antenna"]}]}]}]}]}
},{}],88:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":["antenna antenna-reactions-widget ",{"t":4,"f":["antenna-touch"],"n":50,"r":"supportsTouch"}],"tabindex":"0"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-header"},"f":[{"t":8,"r":"logo"},{"t":7,"e":"span","a":{"class":"antenna-reactions-title"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"reactions_widget__title\")"}}]}," ",{"t":7,"e":"span","v":{"tap":"close"},"a":{"class":"antenna-reactions-close"},"f":["X"]}]}," ",{"t":7,"e":"div","a":{"class":"antenna-page-container"},"f":[" ",{"t":7,"e":"div","a":{"class":"antenna-progress-page antenna-page"},"f":[{"t":7,"e":"div","a":{"class":"antenna-body"},"f":[]}," ",{"t":7,"e":"div","a":{"class":"antenna-progress-spinner"},"f":[{"t":8,"r":"logo"}]}]}]}]}]}
},{}],89:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","o":"cssreset","a":{"class":["antenna antenna-summary-widget no-ant ",{"t":4,"f":["antenna-notloaded"],"n":51,"r":"pageData.summaryLoaded"}," antenna-reset ",{"t":4,"f":["antenna-expanded-summary"],"n":50,"r":"isExpandedSummary"}]},"f":[" ",{"t":7,"e":"div","a":{"class":"antenna-summary-inner"},"f":[{"t":8,"r":"logo"},{"t":7,"e":"span","a":{"class":"antenna-summary-title"},"f":[" ",{"t":4,"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"summary_widget__reactions\")"}}],"n":50,"x":{"r":["pageData.summaryTotal"],"s":"_0===0"}},{"t":4,"n":51,"f":[{"t":4,"n":50,"x":{"r":["pageData.summaryTotal"],"s":"_0===1"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"summary_widget__reactions_one\")"}}]},{"t":4,"n":50,"x":{"r":["pageData.summaryTotal"],"s":"!(_0===1)"},"f":[" ",{"t":2,"x":{"r":["getMessage","pageData.summaryTotal"],"s":"_0(\"summary_widget__reactions_many\",[_1])"}}]}],"x":{"r":["pageData.summaryTotal"],"s":"_0===0"}}]},{"t":4,"f":[{"t":4,"f":[{"t":7,"e":"span","o":"cssreset","a":{"class":["antenna-expanded-reaction ",{"t":4,"f":["antenna-expanded-first"],"n":50,"x":{"r":["@index"],"s":"_0===0"}}]},"f":[{"t":7,"e":"span","a":{"class":"antenna-expanded-text"},"f":[{"t":2,"r":"./text"}]},{"t":7,"e":"span","a":{"class":"antenna-expanded-count"},"f":[{"t":2,"r":"./count"}]}]}],"x":{"r":["computeExpandedReactions","pageData.summaryReactions"],"s":"_0(_1)"}}],"n":50,"r":"isExpandedSummary"}]}]}]}
},{}],90:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"span","a":{"class":"antenna-comments"},"f":[{"t":7,"e":"svg","f":[{"t":7,"e":"use","a":{"class":"antenna-comments-path","xlink:href":"#antenna-svg-comment"}}]}]}]}
},{}],91:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"span","a":{"class":"antenna-facebook"},"f":[{"t":7,"e":"svg","f":[{"t":7,"e":"use","a":{"class":"antenna-facebook-path","xlink:href":"#antenna-svg-facebook"}}]}]}]}
},{}],92:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"span","a":{"class":"antenna-film"},"f":[{"t":7,"e":"svg","f":[{"t":7,"e":"use","a":{"class":"antenna-film-path","xlink:href":"#antenna-svg-film"}}]}]}]}
},{}],93:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"span","a":{"class":"antenna-left"},"f":[{"t":7,"e":"svg","f":[{"t":7,"e":"use","a":{"class":"antenna-left-path","xlink:href":"#antenna-svg-left"}}]}]}]}
},{}],94:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"span","a":{"class":"antenna-location"},"f":[{"t":7,"e":"svg","f":[{"t":7,"e":"use","a":{"class":"antenna-location-path","xlink:href":"#antenna-svg-search"}}]}]}]}
},{}],95:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"span","a":{"class":"antenna-logo"},"f":[{"t":7,"e":"svg","a":{"viewBox":"0 0 512 512"},"f":[" ",{"t":7,"e":"path","a":{"class":"antenna-logo-path","d":"m283 510c125-17 229-124 229-253 0-141-115-256-256-256-141 0-256 115-256 256 0 130 108 237 233 254l0-149c-48-14-84-50-84-102 0-65 43-113 108-113 65 0 107 48 107 113 0 52-33 88-81 102z"}}]}]}]}
},{}],96:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"span","a":{"class":"antenna-logo"},"f":[{"t":7,"e":"svg","f":[{"t":7,"e":"use","a":{"class":"antenna-logo-path","xlink:href":"#antenna-svg-logo"}}]}]}]}
},{}],97:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"span","a":{"class":"antenna-twitter"},"f":[{"t":7,"e":"svg","f":[{"t":7,"e":"use","a":{"class":"antenna-twitter-path","xlink:href":"#antenna-svg-twitter"}}]}]}]}
},{}],98:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"svg","a":{"xmlns":"http://www.w3.org/2000/svg","style":"display: none;"},"f":[{"t":7,"e":"symbol","a":{"id":"antenna-svg-twitter","viewBox":"0 0 512 512"},"f":[{"t":7,"e":"path","a":{"d":"m453 134c-14 6-30 11-46 12c16-10 29-25 35-44c-15 9-33 16-51 19c-15-15-36-25-59-25c-45 0-81 36-81 81c0 6 1 12 2 18c-67-3-127-35-167-84c-7 12-11 25-11 40c0 28 15 53 36 68c-13-1-25-4-36-11c0 1 0 1 0 2c0 39 28 71 65 79c-7 2-14 3-22 3c-5 0-10-1-15-2c10 32 40 56 76 56c-28 22-63 35-101 35c-6 0-13 0-19-1c36 23 78 36 124 36c149 0 230-123 230-230c0-3 0-7 0-10c16-12 29-26 40-42z"}}]}," ",{"t":7,"e":"symbol","a":{"id":"antenna-svg-facebook","viewBox":"0 0 512 512"},"f":[{"t":7,"e":"path","a":{"d":"m420 72l-328 0c-11 0-20 9-20 20l0 328c0 11 9 20 20 20l177 0l0-142l-48 0l0-56l48 0l0-41c0-48 29-74 71-74c20 0 38 2 43 3l0 49l-29 0c-23 0-28 11-28 27l0 36l55 0l-7 56l-48 0l0 142l94 0c11 0 20-9 20-20l0-328c0-11-9-20-20-20z"}}]}," ",{"t":7,"e":"symbol","a":{"id":"antenna-svg-comment","viewBox":"0 0 512 512"},"f":[{"t":7,"e":"path","a":{"d":"m512 256c0 33-11 64-34 92c-23 28-54 50-93 66c-40 17-83 25-129 25c-13 0-27-1-41-2c-38 33-82 56-132 69c-9 2-20 4-32 6c-4 0-7 0-9-3c-3-2-4-4-5-8l0 0c-1-1-1-2 0-4c0-1 0-2 0-2c0-1 1-2 2-3l1-3c0 0 1-1 2-2c2-2 2-3 3-3c1-1 4-5 8-10c5-5 8-8 10-10c2-3 5-6 9-12c4-5 7-10 9-14c3-5 5-10 8-17c3-7 5-14 8-22c-30-17-54-38-71-63c-17-25-26-51-26-80c0-25 7-48 20-71c14-23 32-42 55-58c23-17 50-30 82-39c31-10 64-15 99-15c46 0 89 8 129 25c39 16 70 38 93 66c23 28 34 59 34 92z"}}]}," ",{"t":7,"e":"symbol","a":{"id":"antenna-svg-search","viewBox":"0 0 512 512"},"f":[{"t":7,"e":"path","a":{"d":"m347 238c0-36-12-66-37-91c-25-25-55-37-91-37c-35 0-65 12-90 37c-25 25-38 55-38 91c0 35 13 65 38 90c25 25 55 38 90 38c36 0 66-13 91-38c25-25 37-55 37-90z m147 237c0 10-4 19-11 26c-7 7-16 11-26 11c-10 0-19-4-26-11l-98-98c-34 24-72 36-114 36c-27 0-53-5-78-16c-25-11-46-25-64-43c-18-18-32-39-43-64c-10-25-16-51-16-78c0-28 6-54 16-78c11-25 25-47 43-65c18-18 39-32 64-43c25-10 51-15 78-15c28 0 54 5 79 15c24 11 46 25 64 43c18 18 32 40 43 65c10 24 16 50 16 78c0 42-12 80-36 114l98 98c7 7 11 15 11 25z"}}]}," ",{"t":7,"e":"symbol","a":{"id":"antenna-svg-left","viewBox":"0 0 512 512"},"f":[{"t":7,"e":"path","a":{"d":"m368 160l-64-64-160 160 160 160 64-64-96-96z"}}]}," ",{"t":7,"e":"symbol","a":{"id":"antenna-svg-logo","viewBox":"0 0 512 512"},"f":[" ",{"t":7,"e":"path","a":{"d":"m283 510c125-17 229-124 229-253 0-141-115-256-256-256-141 0-256 115-256 256 0 130 108 237 233 254l0-149c-48-14-84-50-84-102 0-65 43-113 108-113 65 0 107 48 107 113 0 52-33 88-81 102z"}}]}," ",{"t":7,"e":"symbol","a":{"id":"antenna-svg-film","viewBox":"0 0 512 512"},"f":[{"t":7,"e":"path","a":{"d":"m91 457l0-36c0-5-1-10-5-13-4-4-8-6-13-6l-36 0c-5 0-10 2-13 6-4 3-6 8-6 13l0 36c0 5 2 9 6 13 3 4 8 5 13 5l36 0c5 0 9-1 13-5 4-4 5-8 5-13z m0-110l0-36c0-5-1-9-5-13-4-4-8-5-13-5l-36 0c-5 0-10 1-13 5-4 4-6 8-6 13l0 36c0 5 2 10 6 13 3 4 8 6 13 6l36 0c5 0 9-2 13-6 4-3 5-8 5-13z m0-109l0-37c0-5-1-9-5-13-4-3-8-5-13-5l-36 0c-5 0-10 2-13 5-4 4-6 8-6 13l0 37c0 5 2 9 6 13 3 3 8 5 13 5l36 0c5 0 9-2 13-5 4-4 5-8 5-13z m293 219l0-146c0-5-2-9-5-13-4-4-8-5-13-5l-220 0c-5 0-9 1-13 5-3 4-5 8-5 13l0 146c0 5 2 9 5 13 4 4 8 5 13 5l220 0c5 0 9-1 13-5 3-4 5-8 5-13z m-293-329l0-37c0-5-1-9-5-12-4-4-8-6-13-6l-36 0c-5 0-10 2-13 6-4 3-6 7-6 12l0 37c0 5 2 9 6 13 3 3 8 5 13 5l36 0c5 0 9-2 13-5 4-4 5-8 5-13z m403 329l0-36c0-5-2-10-6-13-3-4-8-6-13-6l-36 0c-5 0-9 2-13 6-4 3-5 8-5 13l0 36c0 5 1 9 5 13 4 4 8 5 13 5l36 0c5 0 10-1 13-5 4-4 6-8 6-13z m-110-219l0-147c0-5-2-9-5-12-4-4-8-6-13-6l-220 0c-5 0-9 2-13 6-3 3-5 7-5 12l0 147c0 5 2 9 5 13 4 3 8 5 13 5l220 0c5 0 9-2 13-5 3-4 5-8 5-13z m110 109l0-36c0-5-2-9-6-13-3-4-8-5-13-5l-36 0c-5 0-9 1-13 5-4 4-5 8-5 13l0 36c0 5 1 10 5 13 4 4 8 6 13 6l36 0c5 0 10-2 13-6 4-3 6-8 6-13z m0-109l0-37c0-5-2-9-6-13-3-3-8-5-13-5l-36 0c-5 0-9 2-13 5-4 4-5 8-5 13l0 37c0 5 1 9 5 13 4 3 8 5 13 5l36 0c5 0 10-2 13-5 4-4 6-8 6-13z m0-110l0-37c0-5-2-9-6-12-3-4-8-6-13-6l-36 0c-5 0-9 2-13 6-4 3-5 7-5 12l0 37c0 5 1 9 5 13 4 3 8 5 13 5l36 0c5 0 10-2 13-5 4-4 6-8 6-13z m36-46l0 384c0 13-4 24-13 33-9 9-20 13-32 13l-458 0c-12 0-23-4-32-13-9-9-13-20-13-33l0-384c0-12 4-23 13-32 9-9 20-13 32-13l458 0c12 0 23 4 32 13 9 9 13 20 13 32z"}}]}]}]}
},{}],99:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","o":"cssreset","v":{"tap":"dismiss"},"a":{"class":["antenna antenna-tap-helper ",{"t":4,"f":["antenna-helper-top"],"n":50,"r":"positionTop"},{"t":4,"n":51,"f":["antenna-helper-bottom"],"r":"positionTop"}]},"f":[{"t":7,"e":"div","a":{"class":"antenna-tap-helper-inner"},"f":[{"t":7,"e":"div","f":[{"t":8,"r":"logo"},{"t":7,"e":"span","a":{"class":"antenna-tap-helper-prompt"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"tap_helper__prompt\")"}}]}]}," ",{"t":7,"e":"div","a":{"class":"antenna-tap-helper-close"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"tap_helper__close\")"}}]}]}]}]}
},{}],100:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"span","o":"cssreset","a":{"class":["antenna antenna-text-indicator-widget ",{"t":4,"f":["antenna-notloaded"],"n":51,"r":"containerData.loaded"}," antenna-reset ",{"t":4,"f":["antenna-hasreactions"],"n":50,"x":{"r":["containerData.reactionTotal"],"s":"_0>0"}}," ",{"t":4,"f":["antenna-suppress"],"n":50,"r":"containerData.suppress"}," ",{"t":2,"r":"extraClasses"}]},"f":[" ",{"t":7,"e":"span","a":{"class":"antenna-text-indicator-inner"},"f":[{"t":8,"r":"logo"},{"t":4,"f":[{"t":7,"e":"span","a":{"class":"antenna-reaction-total"},"o":"cssreset","f":[{"t":2,"r":"containerData.reactionTotal"}]}],"n":50,"r":"containerData.reactionTotal"}]}]}]}
},{}]},{},[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvYW50ZW5uYS1hcHAuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvYXV0by1jYWxsLXRvLWFjdGlvbi5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9ibG9ja2VkLXJlYWN0aW9uLXBhZ2UuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvY2FsbC10by1hY3Rpb24tY291bnRlci5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9jYWxsLXRvLWFjdGlvbi1leHBhbmRlZC1yZWFjdGlvbnMuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvY2FsbC10by1hY3Rpb24taW5kaWNhdG9yLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL2NhbGwtdG8tYWN0aW9uLWxhYmVsLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL2NvbW1lbnQtYXJlYS1wYXJ0aWFsLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL2NvbW1lbnRzLXBhZ2UuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvY29uZmlybWF0aW9uLXBhZ2UuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvY29udGVudC1yZWMtbG9hZGVyLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL2NvbnRlbnQtcmVjLXdpZGdldC5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9jc3MtbG9hZGVyLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL2V2ZW50cy5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9nZW5lcmljLWVycm9yLXBhZ2UuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvZ3JvdXAtc2V0dGluZ3MtbG9hZGVyLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL2dyb3VwLXNldHRpbmdzLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL2hhc2hlZC1lbGVtZW50cy5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9sb2NhdGlvbnMtcGFnZS5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9sb2dpbi1wYWdlLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL21lZGlhLWluZGljYXRvci13aWRnZXQuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvcGFnZS1kYXRhLWxvYWRlci5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9wYWdlLWRhdGEuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvcGFnZS1zY2FubmVyLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3BlbmRpbmctcmVhY3Rpb24tcGFnZS5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9wb3B1cC13aWRnZXQuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvcmVhY3Rpb25zLXBhZ2UuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvcmVhY3Rpb25zLXdpZGdldC5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9yZWFkbW9yZS1ldmVudHMuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvcmVpbml0aWFsaXplci5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9zY3JpcHQtbG9hZGVyLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3N1bW1hcnktd2lkZ2V0LmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3N2Z3MuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdGFwLWhlbHBlci5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy90ZXh0LWluZGljYXRvci13aWRnZXQuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdGV4dC1yZWFjdGlvbnMuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvYWpheC1jbGllbnQuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvYXBwLW1vZGUuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvYnJvd3Nlci1tZXRyaWNzLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL2NhbGxiYWNrLXN1cHBvcnQuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvaGFzaC5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9qcXVlcnktcHJvdmlkZXIuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvanNvbi11dGlscy5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9qc29ucC1jbGllbnQuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvbG9nZ2luZy5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9tZDUuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvbWVzc2FnZXMtZW4uanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvbWVzc2FnZXMtZXMuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvbWVzc2FnZXMuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvbW92ZWFibGUuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvbXV0YXRpb24tb2JzZXJ2ZXIuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvcGFnZS11dGlscy5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9yYWN0aXZlLWV2ZW50cy10YXAuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvcmFjdGl2ZS1wcm92aWRlci5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9yYW5nZS5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9yYW5neS1wcm92aWRlci5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9yZWFjdGlvbnMtd2lkZ2V0LWxheW91dC11dGlscy5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9zZWdtZW50LmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL3Nlc3Npb24tZGF0YS5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy90aHJvdHRsZWQtZXZlbnRzLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL3RvdWNoLXN1cHBvcnQuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvdHJhbnNpdGlvbi11dGlsLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL3VybC1jb25zdGFudHMuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvdXJsLXBhcmFtcy5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy91cmxzLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL3VzZXIuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvdmlzaWJpbGl0eS5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy93aWRnZXQtYnVja2V0LmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL3hkbS1jbGllbnQuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMveGRtLWxvYWRlci5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy94ZG0tYW5hbHl0aWNzLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9hdXRvLWNhbGwtdG8tYWN0aW9uLmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9ibG9ja2VkLXJlYWN0aW9uLXBhZ2UuaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL2NhbGwtdG8tYWN0aW9uLWNvdW50ZXIuaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL2NhbGwtdG8tYWN0aW9uLWV4cGFuZGVkLXJlYWN0aW9ucy5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvY2FsbC10by1hY3Rpb24tbGFiZWwuaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL2NvbW1lbnQtYXJlYS1wYXJ0aWFsLmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9jb21tZW50cy1wYWdlLmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9jb25maXJtYXRpb24tcGFnZS5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvY29udGVudC1yZWMtd2lkZ2V0Lmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9nZW5lcmljLWVycm9yLXBhZ2UuaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL2xvY2F0aW9ucy1wYWdlLmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9sb2dpbi1wYWdlLmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9tZWRpYS1pbmRpY2F0b3Itd2lkZ2V0Lmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9wZW5kaW5nLXJlYWN0aW9uLXBhZ2UuaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL3BvcHVwLXdpZGdldC5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvcmVhY3Rpb25zLXBhZ2UuaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL3JlYWN0aW9ucy13aWRnZXQuaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL3N1bW1hcnktd2lkZ2V0Lmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9zdmctY29tbWVudHMuaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL3N2Zy1mYWNlYm9vay5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvc3ZnLWZpbG0uaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL3N2Zy1sZWZ0Lmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9zdmctbG9jYXRpb24uaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL3N2Zy1sb2dvLXNlbGVjdGFibGUuaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL3N2Zy1sb2dvLmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9zdmctdHdpdHRlci5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvc3Zncy5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvdGFwLWhlbHBlci5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvdGV4dC1pbmRpY2F0b3Itd2lkZ2V0Lmhicy5odG1sIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDellBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN1NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN2tCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMVJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BnQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6TkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25JQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUEiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiaWYgKHdpbmRvdy5BTlRFTk5BSVMgfHwgd2luZG93LmFudGVubmEgfHwgd2luZG93LkFudGVubmFBcHApIHtcbiAgICAvLyBQcm90ZWN0IGFnYWluc3QgbXVsdGlwbGUgaW5zdGFuY2VzIG9mIHRoaXMgc2NyaXB0IGJlaW5nIGFkZGVkIHRvIHRoZSBwYWdlIChvciB0aGlzIHNjcmlwdCBhbmQgZW5nYWdlLmpzKVxuICAgIHJldHVybjtcbn1cbmlmICghd2luZG93Lk11dGF0aW9uT2JzZXJ2ZXIgfHwgIUVsZW1lbnQucHJvdG90eXBlLmFkZEV2ZW50TGlzdGVuZXIgfHwgISgnY2xhc3NMaXN0JyBpbiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSkpIHtcbiAgICAvLyBCYWlsIG91dCBvbiBsZWdhY3kgYnJvd3NlcnMuXG4gICAgcmV0dXJuO1xufVxuXG52YXIgU2NyaXB0TG9hZGVyID0gcmVxdWlyZSgnLi9zY3JpcHQtbG9hZGVyJyk7XG52YXIgQ3NzTG9hZGVyID0gcmVxdWlyZSgnLi9jc3MtbG9hZGVyJyk7XG52YXIgR3JvdXBTZXR0aW5nc0xvYWRlciA9IHJlcXVpcmUoJy4vZ3JvdXAtc2V0dGluZ3MtbG9hZGVyJyk7XG52YXIgVGFwSGVscGVyID0gcmVxdWlyZSgnLi90YXAtaGVscGVyJyk7XG52YXIgUGFnZURhdGFMb2FkZXIgPSByZXF1aXJlKCcuL3BhZ2UtZGF0YS1sb2FkZXInKTtcbnZhciBQYWdlU2Nhbm5lciA9IHJlcXVpcmUoJy4vcGFnZS1zY2FubmVyJyk7XG52YXIgUmVpbml0aWFsaXplciA9IHJlcXVpcmUoJy4vcmVpbml0aWFsaXplcicpO1xudmFyIFhETUFuYWx5dGljcyA9IHJlcXVpcmUoJy4veGRtLWFuYWx5dGljcycpO1xudmFyIEJyb3dzZXJNZXRyaWNzID0gcmVxdWlyZSgnLi91dGlscy9icm93c2VyLW1ldHJpY3MnKTtcbnZhciBYRE1Mb2FkZXIgPSByZXF1aXJlKCcuL3V0aWxzL3hkbS1sb2FkZXInKTtcblxud2luZG93LkFudGVubmFBcHAgPSB7IC8vIFRPRE8gZmxlc2ggb3V0IG91ciBkZXNpcmVkIEFQSVxuICAgIHJlaW5pdGlhbGl6ZTogUmVpbml0aWFsaXplci5yZWluaXRpYWxpemVBbGxcbiAgICAvLyB0ZWFyZG93bj9cbiAgICAvLyB0cmFjZT9cbiAgICAvLyBkZWJ1Zz9cbiAgICAvLyBwYWdlZGF0YT9cbiAgICAvLyBncm91cHNldHRpbmdzP1xuICAgIC8vIG5lZWQgdG8gbWFrZSBzdXJlIG90aGVycyAoZS5nLiBtYWxpY2lvdXMgc2NyaXB0cykgY2FuJ3Qgd3JpdGUgZGF0YVxufTtcblxuLy8gU3RlcCAxIC0ga2ljayBvZmYgdGhlIGFzeW5jaHJvbm91cyBsb2FkaW5nIG9mIHRoZSBKYXZhc2NyaXB0IGFuZCBDU1Mgd2UgbmVlZC5cbkNzc0xvYWRlci5sb2FkKCk7IC8vIEluamVjdCB0aGUgQ1NTIGZpcnN0IGJlY2F1c2Ugd2UgbWF5IHNvb24gYXBwZW5kIG1vcmUgYXN5bmNocm9ub3VzbHksIGluIHRoZSBncm91cFNldHRpbmdzIGNhbGxiYWNrLCBhbmQgd2Ugd2FudCB0aGF0IENTUyB0byBiZSBsb3dlciBpbiB0aGUgZG9jdW1lbnQuXG5TY3JpcHRMb2FkZXIubG9hZChzY3JpcHRMb2FkZWQpO1xuXG5mdW5jdGlvbiBzY3JpcHRMb2FkZWQoKSB7XG4gICAgLy8gU3RlcCAyIC0gT25jZSB3ZSBoYXZlIG91ciByZXF1aXJlZCBzY3JpcHRzLCBmZXRjaCB0aGUgZ3JvdXAgc2V0dGluZ3MgZnJvbSB0aGUgc2VydmVyXG4gICAgR3JvdXBTZXR0aW5nc0xvYWRlci5sb2FkKGZ1bmN0aW9uKGdyb3VwU2V0dGluZ3MpIHtcbiAgICAgICAgaWYgKGdyb3VwU2V0dGluZ3MuaXNIaWRlT25Nb2JpbGUoKSAmJiBCcm93c2VyTWV0cmljcy5pc01vYmlsZSgpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgLy8gU3RlcCAzIC0gT25jZSB3ZSBoYXZlIHRoZSBzZXR0aW5ncywgd2UgY2FuIGtpY2sgb2ZmIGEgY291cGxlIHRoaW5ncyBpbiBwYXJhbGxlbDpcbiAgICAgICAgLy9cbiAgICAgICAgLy8gLS0gaW5qZWN0IGFueSBjdXN0b20gQ1NTIGZyb20gdGhlIGdyb3VwIHNldHRpbmdzXG4gICAgICAgIC8vIC0tIGNyZWF0ZSB0aGUgaGlkZGVuIGlmcmFtZSB3ZSB1c2UgZm9yIGNyb3NzLWRvbWFpbiBjb29raWVzIChwcmltYXJpbHkgdXNlciBsb2dpbilcbiAgICAgICAgLy8gLS0gc3RhcnQgZmV0Y2hpbmcgdGhlIHBhZ2UgZGF0YVxuICAgICAgICAvLyAtLSBzdGFydCBoYXNoaW5nIHRoZSBwYWdlIGFuZCBpbnNlcnRpbmcgdGhlIGFmZm9yZGFuY2VzIChpbiB0aGUgZW1wdHkgc3RhdGUpXG4gICAgICAgIC8vXG4gICAgICAgIC8vIEFzIHRoZSBwYWdlIGlzIHNjYW5uZWQsIHRoZSB3aWRnZXRzIGFyZSBjcmVhdGVkIGFuZCBib3VuZCB0byB0aGUgcGFnZSBkYXRhIHRoYXQgY29tZXMgaW4uXG4gICAgICAgIGluaXRDdXN0b21DU1MoZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIGluaXRYZG1GcmFtZShncm91cFNldHRpbmdzKTtcbiAgICAgICAgZmV0Y2hQYWdlRGF0YShncm91cFNldHRpbmdzKTtcbiAgICAgICAgc2NhblBhZ2UoZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIHNldHVwTW9iaWxlSGVscGVyKGdyb3VwU2V0dGluZ3MpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBpbml0Q3VzdG9tQ1NTKGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgY3VzdG9tQ1NTID0gZ3JvdXBTZXR0aW5ncy5jdXN0b21DU1MoKTtcbiAgICBpZiAoY3VzdG9tQ1NTKSB7XG4gICAgICAgIENzc0xvYWRlci5pbmplY3QoY3VzdG9tQ1NTKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGluaXRYZG1GcmFtZShncm91cFNldHRpbmdzKSB7XG4gICAgWERNQW5hbHl0aWNzLnN0YXJ0KCk7XG4gICAgWERNTG9hZGVyLmNyZWF0ZVhETWZyYW1lKGdyb3VwU2V0dGluZ3MuZ3JvdXBJZCgpKTtcbn1cblxuZnVuY3Rpb24gZmV0Y2hQYWdlRGF0YShncm91cFNldHRpbmdzKSB7XG4gICAgUGFnZURhdGFMb2FkZXIubG9hZChncm91cFNldHRpbmdzKTtcbn1cblxuZnVuY3Rpb24gc2NhblBhZ2UoZ3JvdXBTZXR0aW5ncykge1xuICAgIFBhZ2VTY2FubmVyLnNjYW4oZ3JvdXBTZXR0aW5ncywgUmVpbml0aWFsaXplci5yZWluaXRpYWxpemUpO1xufVxuXG5mdW5jdGlvbiBzZXR1cE1vYmlsZUhlbHBlcihncm91cFNldHRpbmdzKSB7XG4gICAgVGFwSGVscGVyLnNldHVwSGVscGVyKGdyb3VwU2V0dGluZ3MpO1xufSIsInZhciAkOyByZXF1aXJlKCcuL3V0aWxzL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIEJyb3dzZXJNZXRyaWNzID0gcmVxdWlyZSgnLi91dGlscy9icm93c2VyLW1ldHJpY3MnKTtcbnZhciBSYWN0aXZlOyByZXF1aXJlKCcuL3V0aWxzL3JhY3RpdmUtcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24obG9hZGVkUmFjdGl2ZSkgeyBSYWN0aXZlPWxvYWRlZFJhY3RpdmU7IH0pO1xudmFyIFNWR3MgPSByZXF1aXJlKCcuL3N2Z3MnKTtcblxuZnVuY3Rpb24gY3JlYXRlQ2FsbFRvQWN0aW9uKGFudEl0ZW1JZCwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgcmFjdGl2ZSA9IFJhY3RpdmUoe1xuICAgICAgICBlbDogJCgnPGRpdj4nKSxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgYW50SXRlbUlkOiBhbnRJdGVtSWQsXG4gICAgICAgICAgICBleHBhbmRSZWFjdGlvbnM6IHNob3VsZEV4cGFuZFJlYWN0aW9ucyhncm91cFNldHRpbmdzKVxuICAgICAgICB9LFxuICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL2F1dG8tY2FsbC10by1hY3Rpb24uaGJzLmh0bWwnKSxcbiAgICAgICAgcGFydGlhbHM6IHtcbiAgICAgICAgICAgIGxvZ286IFNWR3MubG9nb1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZWxlbWVudDogJChyYWN0aXZlLmZpbmQoJy5hbnRlbm5hLWF1dG8tY3RhJykpLFxuICAgICAgICB0ZWFyZG93bjogZnVuY3Rpb24oKSB7IHJhY3RpdmUudGVhcmRvd24oKTsgfVxuICAgIH07XG59XG5cbmZ1bmN0aW9uIHNob3VsZEV4cGFuZFJlYWN0aW9ucyhncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIHNldHRpbmcgPSBncm91cFNldHRpbmdzLmdlbmVyYXRlZEN0YUV4cGFuZGVkKCk7IC8vIFZhbHVlcyBhcmUgJ25vbmUnLCAnYm90aCcsICdkZXNrdG9wJywgYW5kICdtb2JpbGUnXG4gICAgcmV0dXJuIHNldHRpbmcgPT09ICdib3RoJyB8fFxuICAgICAgICAoc2V0dGluZyA9PT0gJ2Rlc2t0b3AnICYmICFCcm93c2VyTWV0cmljcy5pc01vYmlsZSgpKSB8fFxuICAgICAgICAoc2V0dGluZyA9PT0gJ21vYmlsZScgJiYgQnJvd3Nlck1ldHJpY3MuaXNNb2JpbGUoKSk7XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGU6IGNyZWF0ZUNhbGxUb0FjdGlvblxufTsiLCJ2YXIgUmFjdGl2ZTsgcmVxdWlyZSgnLi91dGlscy9yYWN0aXZlLXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGxvYWRlZFJhY3RpdmUpIHsgUmFjdGl2ZSA9IGxvYWRlZFJhY3RpdmU7fSk7XG52YXIgU1ZHcyA9IHJlcXVpcmUoJy4vc3ZncycpO1xuXG52YXIgcGFnZVNlbGVjdG9yID0gJy5hbnRlbm5hLWJsb2NrZWQtcGFnZSc7XG5cbmZ1bmN0aW9uIGNyZWF0ZVBhZ2Uob3B0aW9ucykge1xuICAgIHZhciBnb0JhY2sgPSBvcHRpb25zLmdvQmFjaztcbiAgICB2YXIgZWxlbWVudCA9IG9wdGlvbnMuZWxlbWVudDtcbiAgICB2YXIgcmFjdGl2ZSA9IFJhY3RpdmUoe1xuICAgICAgICBlbDogZWxlbWVudCxcbiAgICAgICAgYXBwZW5kOiB0cnVlLFxuICAgICAgICBkYXRhOiB7fSxcbiAgICAgICAgdGVtcGxhdGU6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9ibG9ja2VkLXJlYWN0aW9uLXBhZ2UuaGJzLmh0bWwnKSxcbiAgICAgICAgcGFydGlhbHM6IHtcbiAgICAgICAgICAgIGxlZnQ6IFNWR3MubGVmdFxuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmFjdGl2ZS5vbignYmFjaycsIGdvQmFjayk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgc2VsZWN0b3I6IHBhZ2VTZWxlY3RvcixcbiAgICAgICAgdGVhcmRvd246IGZ1bmN0aW9uKCkgeyByYWN0aXZlLnRlYXJkb3duKCk7IH1cbiAgICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGVQYWdlOiBjcmVhdGVQYWdlXG59OyIsInZhciBSYWN0aXZlOyByZXF1aXJlKCcuL3V0aWxzL3JhY3RpdmUtcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24obG9hZGVkUmFjdGl2ZSkgeyBSYWN0aXZlID0gbG9hZGVkUmFjdGl2ZTt9KTtcblxuZnVuY3Rpb24gY3JlYXRlQ291bnQoJGNvdW50RWxlbWVudCwgY29udGFpbmVyRGF0YSkge1xuICAgIHZhciByYWN0aXZlID0gUmFjdGl2ZSh7XG4gICAgICAgIGVsOiAkY291bnRFbGVtZW50LFxuICAgICAgICBtYWdpYzogdHJ1ZSxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgY29udGFpbmVyRGF0YTogY29udGFpbmVyRGF0YVxuICAgICAgICB9LFxuICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL2NhbGwtdG8tYWN0aW9uLWNvdW50ZXIuaGJzLmh0bWwnKVxuICAgIH0pO1xuICAgIHJldHVybiB7XG4gICAgICAgIHRlYXJkb3duOiBmdW5jdGlvbigpIHsgcmFjdGl2ZS50ZWFyZG93bigpOyB9XG4gICAgfTtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZTogY3JlYXRlQ291bnRcbn07IiwidmFyIFJhY3RpdmU7IHJlcXVpcmUoJy4vdXRpbHMvcmFjdGl2ZS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihsb2FkZWRSYWN0aXZlKSB7IFJhY3RpdmUgPSBsb2FkZWRSYWN0aXZlO30pO1xuXG5mdW5jdGlvbiBjcmVhdGVFeHBhbmRlZFJlYWN0aW9ucygkZXhwYW5kZWRSZWFjdGlvbnNFbGVtZW50LCAkY29udGFpbmVyRWxlbWVudCwgY29udGFpbmVyRGF0YSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciByYWN0aXZlID0gUmFjdGl2ZSh7XG4gICAgICAgIGVsOiAkZXhwYW5kZWRSZWFjdGlvbnNFbGVtZW50LFxuICAgICAgICBtYWdpYzogdHJ1ZSxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgY29udGFpbmVyRGF0YTogY29udGFpbmVyRGF0YSxcbiAgICAgICAgICAgIGNvbXB1dGVFeHBhbmRlZFJlYWN0aW9uczogY29tcHV0ZUV4cGFuZGVkUmVhY3Rpb25zKGdyb3VwU2V0dGluZ3MuZGVmYXVsdFJlYWN0aW9ucygkY29udGFpbmVyRWxlbWVudCkpXG4gICAgICAgIH0sXG4gICAgICAgIHRlbXBsYXRlOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvY2FsbC10by1hY3Rpb24tZXhwYW5kZWQtcmVhY3Rpb25zLmhicy5odG1sJylcbiAgICB9KTtcbiAgICByZXR1cm4ge1xuICAgICAgICB0ZWFyZG93bjogZnVuY3Rpb24oKSB7IHJhY3RpdmUudGVhcmRvd24oKTsgfVxuICAgIH07XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVFeHBhbmRlZFJlYWN0aW9ucyhkZWZhdWx0UmVhY3Rpb25zKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHJlYWN0aW9uc0RhdGEpIHtcbiAgICAgICAgdmFyIG1heCA9IDI7XG4gICAgICAgIHZhciBleHBhbmRlZFJlYWN0aW9ucyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJlYWN0aW9uc0RhdGEubGVuZ3RoICYmIGV4cGFuZGVkUmVhY3Rpb25zLmxlbmd0aCA8IG1heDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgcmVhY3Rpb25EYXRhID0gcmVhY3Rpb25zRGF0YVtpXTtcbiAgICAgICAgICAgIGlmIChpc0RlZmF1bHRSZWFjdGlvbihyZWFjdGlvbkRhdGEsIGRlZmF1bHRSZWFjdGlvbnMpKSB7XG4gICAgICAgICAgICAgICAgZXhwYW5kZWRSZWFjdGlvbnMucHVzaChyZWFjdGlvbkRhdGEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBleHBhbmRlZFJlYWN0aW9ucztcbiAgICB9O1xufVxuXG5mdW5jdGlvbiBpc0RlZmF1bHRSZWFjdGlvbihyZWFjdGlvbkRhdGEsIGRlZmF1bHRSZWFjdGlvbnMpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRlZmF1bHRSZWFjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGRlZmF1bHRSZWFjdGlvbnNbaV0udGV4dCA9PT0gcmVhY3Rpb25EYXRhLnRleHQpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZTogY3JlYXRlRXhwYW5kZWRSZWFjdGlvbnNcbn07IiwidmFyIENhbGxUb0FjdGlvbkNvdW50ZXIgPSByZXF1aXJlKCcuL2NhbGwtdG8tYWN0aW9uLWNvdW50ZXInKTtcbnZhciBDYWxsVG9BY3Rpb25FeHBhbmRlZFJlYWN0aW9ucyA9IHJlcXVpcmUoJy4vY2FsbC10by1hY3Rpb24tZXhwYW5kZWQtcmVhY3Rpb25zJyk7XG52YXIgQ2FsbFRvQWN0aW9uTGFiZWwgPSByZXF1aXJlKCcuL2NhbGwtdG8tYWN0aW9uLWxhYmVsJyk7XG52YXIgUmVhY3Rpb25zV2lkZ2V0ID0gcmVxdWlyZSgnLi9yZWFjdGlvbnMtd2lkZ2V0Jyk7XG52YXIgVG91Y2hTdXBwb3J0ID0gcmVxdWlyZSgnLi91dGlscy90b3VjaC1zdXBwb3J0Jyk7XG5cblxuZnVuY3Rpb24gY3JlYXRlSW5kaWNhdG9yV2lkZ2V0KG9wdGlvbnMpIHtcbiAgICB2YXIgY29udGFpbmVyRGF0YSA9IG9wdGlvbnMuY29udGFpbmVyRGF0YTtcbiAgICB2YXIgJGNvbnRhaW5lckVsZW1lbnQgPSBvcHRpb25zLmNvbnRhaW5lckVsZW1lbnQ7XG4gICAgdmFyIGNvbnRlbnREYXRhID0gb3B0aW9ucy5jb250ZW50RGF0YTtcbiAgICB2YXIgJGN0YUVsZW1lbnQgPSBvcHRpb25zLmN0YUVsZW1lbnQ7XG4gICAgdmFyICRjdGFMYWJlbHMgPSBvcHRpb25zLmN0YUxhYmVsczsgLy8gb3B0aW9uYWxcbiAgICB2YXIgJGN0YUNvdW50ZXJzID0gb3B0aW9ucy5jdGFDb3VudGVyczsgLy8gb3B0aW9uYWxcbiAgICB2YXIgJGN0YUV4cGFuZGVkUmVhY3Rpb25zID0gb3B0aW9ucy5jdGFFeHBhbmRlZFJlYWN0aW9uczsgLy8gb3B0aW9uYWxcbiAgICB2YXIgcGFnZURhdGEgPSBvcHRpb25zLnBhZ2VEYXRhO1xuICAgIHZhciBncm91cFNldHRpbmdzID0gb3B0aW9ucy5ncm91cFNldHRpbmdzO1xuICAgIHZhciBkZWZhdWx0UmVhY3Rpb25zID0gb3B0aW9ucy5kZWZhdWx0UmVhY3Rpb25zO1xuXG4gICAgdmFyIHJlYWN0aW9uV2lkZ2V0T3B0aW9ucyA9IHtcbiAgICAgICAgcmVhY3Rpb25zRGF0YTogY29udGFpbmVyRGF0YS5yZWFjdGlvbnMsXG4gICAgICAgIGNvbnRhaW5lckRhdGE6IGNvbnRhaW5lckRhdGEsXG4gICAgICAgIGNvbnRhaW5lckVsZW1lbnQ6ICRjb250YWluZXJFbGVtZW50LFxuICAgICAgICBjb250ZW50RGF0YTogY29udGVudERhdGEsXG4gICAgICAgIGRlZmF1bHRSZWFjdGlvbnM6IGRlZmF1bHRSZWFjdGlvbnMsXG4gICAgICAgIHBhZ2VEYXRhOiBwYWdlRGF0YSxcbiAgICAgICAgZ3JvdXBTZXR0aW5nczogZ3JvdXBTZXR0aW5nc1xuICAgIH07XG5cbiAgICBUb3VjaFN1cHBvcnQuc2V0dXBUYXAoJGN0YUVsZW1lbnQuZ2V0KDApLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgb3BlblJlYWN0aW9uc1dpbmRvdyhyZWFjdGlvbldpZGdldE9wdGlvbnMsICRjdGFFbGVtZW50KTtcbiAgICB9KTtcbiAgICAkY3RhRWxlbWVudC5vbignbW91c2VlbnRlci5hbnRlbm5hJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgaWYgKGV2ZW50LmJ1dHRvbnMgPiAwIHx8IChldmVudC5idXR0b25zID09IHVuZGVmaW5lZCAmJiBldmVudC53aGljaCA+IDApKSB7IC8vIE9uIFNhZmFyaSwgZXZlbnQuYnV0dG9ucyBpcyB1bmRlZmluZWQgYnV0IGV2ZW50LndoaWNoIGdpdmVzIGEgZ29vZCB2YWx1ZS4gZXZlbnQud2hpY2ggaXMgYmFkIG9uIEZGXG4gICAgICAgICAgICAvLyBEb24ndCByZWFjdCBpZiB0aGUgdXNlciBpcyBkcmFnZ2luZyBvciBzZWxlY3RpbmcgdGV4dC5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBvcGVuUmVhY3Rpb25zV2luZG93KHJlYWN0aW9uV2lkZ2V0T3B0aW9ucywgJGN0YUVsZW1lbnQpO1xuICAgIH0pO1xuXG4gICAgdmFyIGNyZWF0ZWRXaWRnZXRzID0gW107XG5cbiAgICBpZiAoJGN0YUxhYmVscykge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8ICRjdGFMYWJlbHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNyZWF0ZWRXaWRnZXRzLnB1c2goQ2FsbFRvQWN0aW9uTGFiZWwuY3JlYXRlKCRjdGFMYWJlbHNbaV0sIGNvbnRhaW5lckRhdGEpKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmICgkY3RhQ291bnRlcnMpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAkY3RhQ291bnRlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNyZWF0ZWRXaWRnZXRzLnB1c2goQ2FsbFRvQWN0aW9uQ291bnRlci5jcmVhdGUoJGN0YUNvdW50ZXJzW2ldLCBjb250YWluZXJEYXRhKSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoJGN0YUV4cGFuZGVkUmVhY3Rpb25zKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgJGN0YUV4cGFuZGVkUmVhY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjcmVhdGVkV2lkZ2V0cy5wdXNoKENhbGxUb0FjdGlvbkV4cGFuZGVkUmVhY3Rpb25zLmNyZWF0ZSgkY3RhRXhwYW5kZWRSZWFjdGlvbnNbaV0sICRjb250YWluZXJFbGVtZW50LCBjb250YWluZXJEYXRhLCBncm91cFNldHRpbmdzKSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICB0ZWFyZG93bjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAkY3RhRWxlbWVudC5vZmYoJy5hbnRlbm5hJyk7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNyZWF0ZWRXaWRnZXRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY3JlYXRlZFdpZGdldHNbaV0udGVhcmRvd24oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gb3BlblJlYWN0aW9uc1dpbmRvdyhyZWFjdGlvbk9wdGlvbnMsICRjdGFFbGVtZW50KSB7XG4gICAgUmVhY3Rpb25zV2lkZ2V0Lm9wZW4ocmVhY3Rpb25PcHRpb25zLCAkY3RhRWxlbWVudCk7XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGU6IGNyZWF0ZUluZGljYXRvcldpZGdldFxufTsiLCJ2YXIgUmFjdGl2ZTsgcmVxdWlyZSgnLi91dGlscy9yYWN0aXZlLXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGxvYWRlZFJhY3RpdmUpIHsgUmFjdGl2ZSA9IGxvYWRlZFJhY3RpdmU7fSk7XG5cbmZ1bmN0aW9uIGNyZWF0ZUxhYmVsKCRsYWJlbEVsZW1lbnQsIGNvbnRhaW5lckRhdGEpIHtcbiAgICB2YXIgcmFjdGl2ZSA9IFJhY3RpdmUoe1xuICAgICAgICBlbDogJGxhYmVsRWxlbWVudCwgLy8gVE9ETzogcmV2aWV3IHRoZSBzdHJ1Y3R1cmUgb2YgdGhlIERPTSBoZXJlLiBEbyB3ZSB3YW50IHRvIHJlbmRlciBhbiBlbGVtZW50IGludG8gJGN0YUxhYmVsIG9yIGp1c3QgdGV4dD9cbiAgICAgICAgbWFnaWM6IHRydWUsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIGNvbnRhaW5lckRhdGE6IGNvbnRhaW5lckRhdGFcbiAgICAgICAgfSxcbiAgICAgICAgdGVtcGxhdGU6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9jYWxsLXRvLWFjdGlvbi1sYWJlbC5oYnMuaHRtbCcpXG4gICAgfSk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdGVhcmRvd246IGZ1bmN0aW9uKCkgeyByYWN0aXZlLnRlYXJkb3duKCk7IH1cbiAgICB9XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGU6IGNyZWF0ZUxhYmVsXG59OyIsInZhciAkOyByZXF1aXJlKCcuL3V0aWxzL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIEFqYXhDbGllbnQgPSByZXF1aXJlKCcuL3V0aWxzL2FqYXgtY2xpZW50Jyk7XG52YXIgVXNlciA9IHJlcXVpcmUoJy4vdXRpbHMvdXNlcicpO1xuXG52YXIgRXZlbnRzID0gcmVxdWlyZSgnLi9ldmVudHMnKTtcblxuZnVuY3Rpb24gc2V0dXBDb21tZW50QXJlYShyZWFjdGlvblByb3ZpZGVyLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncywgY2FsbGJhY2ssIHJhY3RpdmUpIHtcbiAgICBpZiAoZ3JvdXBTZXR0aW5ncy5yZXF1aXJlc0FwcHJvdmFsKCkgfHwgY29udGFpbmVyRGF0YS50eXBlID09PSAncGFnZScpIHtcbiAgICAgICAgLy8gQ3VycmVudGx5LCBzaXRlcyB0aGF0IHJlcXVpcmUgYXBwcm92YWwgZG9uJ3Qgc3VwcG9ydCBjb21tZW50IGlucHV0LlxuICAgICAgICAkKHJhY3RpdmUuZmluZCgnLmFudGVubmEtY29tbWVudC13aWRnZXRzJykpLmhpZGUoKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICByYWN0aXZlLm9uKCdpbnB1dGNoYW5nZWQnLCB1cGRhdGVJbnB1dENvdW50ZXIpO1xuICAgIHJhY3RpdmUub24oJ2FkZGNvbW1lbnQnLCBhZGRDb21tZW50KTtcbiAgICB1cGRhdGVJbnB1dENvdW50ZXIoKTtcblxuICAgIGZ1bmN0aW9uIGFkZENvbW1lbnQoKSB7XG4gICAgICAgIHZhciBjb21tZW50ID0gJChyYWN0aXZlLmZpbmQoJy5hbnRlbm5hLWNvbW1lbnQtaW5wdXQnKSkudmFsKCkudHJpbSgpOyAvLyBUT0RPOiBhZGRpdGlvbmFsIHZhbGlkYXRpb24/IGlucHV0IHNhbml0aXppbmc/XG4gICAgICAgIGlmIChjb21tZW50Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICQocmFjdGl2ZS5maW5kKCcuYW50ZW5uYS1jb21tZW50LXdpZGdldHMnKSkuaGlkZSgpO1xuICAgICAgICAgICAgJChyYWN0aXZlLmZpbmQoJy5hbnRlbm5hLWNvbW1lbnQtd2FpdGluZycpKS5mYWRlSW4oJ3Nsb3cnKTtcbiAgICAgICAgICAgIHJlYWN0aW9uUHJvdmlkZXIuZ2V0KGZ1bmN0aW9uIChyZWFjdGlvbikge1xuICAgICAgICAgICAgICAgIEFqYXhDbGllbnQucG9zdENvbW1lbnQoY29tbWVudCwgcmVhY3Rpb24sIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIEV2ZW50cy5wb3N0Q29tbWVudENyZWF0ZWQocGFnZURhdGEsIGNvbnRhaW5lckRhdGEsIHJlYWN0aW9uLCBjb21tZW50LCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgICAgICB9LCBlcnJvcik7XG4gICAgICAgICAgICAgICAgJChyYWN0aXZlLmZpbmQoJy5hbnRlbm5hLWNvbW1lbnQtd2FpdGluZycpKS5zdG9wKCkuaGlkZSgpO1xuICAgICAgICAgICAgICAgICQocmFjdGl2ZS5maW5kKCcuYW50ZW5uYS1jb21tZW50LXJlY2VpdmVkJykpLmZhZGVJbigpO1xuICAgICAgICAgICAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhjb21tZW50LCBVc2VyLm9wdGltaXN0aWNDb21tZW50VXNlcigpKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBlcnJvcihtZXNzYWdlKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFRPRE8gcmVhbCBlcnJvciBoYW5kbGluZ1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnRXJyb3IgcG9zdGluZyBjb21tZW50OiAnICsgbWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiB1cGRhdGVJbnB1dENvdW50ZXIoKSB7XG4gICAgICAgIHZhciAkdGV4dGFyZWEgPSAkKHJhY3RpdmUuZmluZCgnLmFudGVubmEtY29tbWVudC1pbnB1dCcpKTtcbiAgICAgICAgdmFyIG1heCA9IHBhcnNlSW50KCR0ZXh0YXJlYS5hdHRyKCdtYXhsZW5ndGgnKSk7XG4gICAgICAgIHZhciBsZW5ndGggPSAkdGV4dGFyZWEudmFsKCkubGVuZ3RoO1xuICAgICAgICAkKHJhY3RpdmUuZmluZCgnLmFudGVubmEtY29tbWVudC1jb3VudCcpKS5odG1sKE1hdGgubWF4KDAsIG1heCAtIGxlbmd0aCkpO1xuICAgIH1cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHNldHVwOiBzZXR1cENvbW1lbnRBcmVhXG59OyIsInZhciAkOyByZXF1aXJlKCcuL3V0aWxzL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIFJhY3RpdmU7IHJlcXVpcmUoJy4vdXRpbHMvcmFjdGl2ZS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihsb2FkZWRSYWN0aXZlKSB7IFJhY3RpdmUgPSBsb2FkZWRSYWN0aXZlO30pO1xudmFyIENvbW1lbnRBcmVhUGFydGlhbCA9IHJlcXVpcmUoJy4vY29tbWVudC1hcmVhLXBhcnRpYWwnKTtcbnZhciBTVkdzID0gcmVxdWlyZSgnLi9zdmdzJyk7XG5cbnZhciBwYWdlU2VsZWN0b3IgPSAnLmFudGVubmEtY29tbWVudHMtcGFnZSc7XG5cbmZ1bmN0aW9uIGNyZWF0ZVBhZ2Uob3B0aW9ucykge1xuICAgIHZhciByZWFjdGlvbiA9IG9wdGlvbnMucmVhY3Rpb247XG4gICAgdmFyIGNvbW1lbnRzID0gb3B0aW9ucy5jb21tZW50cztcbiAgICB2YXIgZWxlbWVudCA9IG9wdGlvbnMuZWxlbWVudDtcbiAgICB2YXIgY29udGFpbmVyRGF0YSA9IG9wdGlvbnMuY29udGFpbmVyRGF0YTtcbiAgICB2YXIgcGFnZURhdGEgPSBvcHRpb25zLnBhZ2VEYXRhO1xuICAgIHZhciBncm91cFNldHRpbmdzID0gb3B0aW9ucy5ncm91cFNldHRpbmdzO1xuICAgIHZhciBnb0JhY2sgPSBvcHRpb25zLmdvQmFjaztcbiAgICB2YXIgcmFjdGl2ZSA9IFJhY3RpdmUoe1xuICAgICAgICBlbDogZWxlbWVudCxcbiAgICAgICAgYXBwZW5kOiB0cnVlLFxuICAgICAgICBtYWdpYzogdHJ1ZSxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgcmVhY3Rpb246IHJlYWN0aW9uLFxuICAgICAgICAgICAgY29tbWVudHM6IGNvbW1lbnRzXG4gICAgICAgIH0sXG4gICAgICAgIHRlbXBsYXRlOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvY29tbWVudHMtcGFnZS5oYnMuaHRtbCcpLFxuICAgICAgICBwYXJ0aWFsczoge1xuICAgICAgICAgICAgY29tbWVudEFyZWE6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9jb21tZW50LWFyZWEtcGFydGlhbC5oYnMuaHRtbCcpLFxuICAgICAgICAgICAgbGVmdDogU1ZHcy5sZWZ0XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICB2YXIgcmVhY3Rpb25Qcm92aWRlciA9IHsgLy8gdGhpcyByZWFjdGlvbiBwcm92aWRlciBpcyBhIG5vLWJyYWluZXIgYmVjYXVzZSB3ZSBhbHJlYWR5IGhhdmUgYSB2YWxpZCByZWFjdGlvbiAob25lIHdpdGggYW4gSUQpXG4gICAgICAgIGdldDogZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKHJlYWN0aW9uKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgQ29tbWVudEFyZWFQYXJ0aWFsLnNldHVwKHJlYWN0aW9uUHJvdmlkZXIsIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzLCBjb21tZW50QWRkZWQsIHJhY3RpdmUsIGdyb3VwU2V0dGluZ3MpO1xuICAgIHJhY3RpdmUub24oJ2JhY2snLCBnb0JhY2spO1xuICAgIHJldHVybiB7XG4gICAgICAgIHNlbGVjdG9yOiBwYWdlU2VsZWN0b3IsXG4gICAgICAgIHRlYXJkb3duOiBmdW5jdGlvbigpIHsgcmFjdGl2ZS50ZWFyZG93bigpOyB9XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIGNvbW1lbnRBZGRlZChjb21tZW50LCB1c2VyKSB7XG4gICAgICAgIGNvbW1lbnRzLnVuc2hpZnQoeyB0ZXh0OiBjb21tZW50LCB1c2VyOiB1c2VyLCBuZXc6IHRydWUgfSk7XG4gICAgICAgICQocmFjdGl2ZS5maW5kKCcuYW50ZW5uYS1ib2R5JykpLmFuaW1hdGUoe3Njcm9sbFRvcDogMH0pO1xuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlOiBjcmVhdGVQYWdlXG59OyIsInZhciAkOyByZXF1aXJlKCcuL3V0aWxzL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIFJhY3RpdmU7IHJlcXVpcmUoJy4vdXRpbHMvcmFjdGl2ZS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihsb2FkZWRSYWN0aXZlKSB7IFJhY3RpdmUgPSBsb2FkZWRSYWN0aXZlO30pO1xudmFyIEFqYXhDbGllbnQgPSByZXF1aXJlKCcuL3V0aWxzL2FqYXgtY2xpZW50Jyk7XG52YXIgVVJMcyA9IHJlcXVpcmUoJy4vdXRpbHMvdXJscycpO1xudmFyIENvbW1lbnRBcmVhUGFydGlhbCA9IHJlcXVpcmUoJy4vY29tbWVudC1hcmVhLXBhcnRpYWwnKTtcbnZhciBFdmVudHMgPSByZXF1aXJlKCcuL2V2ZW50cycpO1xudmFyIFNWR3MgPSByZXF1aXJlKCcuL3N2Z3MnKTtcblxudmFyIHBhZ2VTZWxlY3RvciA9ICcuYW50ZW5uYS1jb25maXJtYXRpb24tcGFnZSc7XG5cbmZ1bmN0aW9uIGNyZWF0ZVBhZ2UocmVhY3Rpb25UZXh0LCByZWFjdGlvblByb3ZpZGVyLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncywgZWxlbWVudCkge1xuICAgIHZhciBwb3B1cFdpbmRvdztcbiAgICB2YXIgcmFjdGl2ZSA9IFJhY3RpdmUoe1xuICAgICAgICBlbDogZWxlbWVudCxcbiAgICAgICAgYXBwZW5kOiB0cnVlLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICB0ZXh0OiByZWFjdGlvblRleHRcbiAgICAgICAgfSxcbiAgICAgICAgdGVtcGxhdGU6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9jb25maXJtYXRpb24tcGFnZS5oYnMuaHRtbCcpLFxuICAgICAgICBwYXJ0aWFsczoge1xuICAgICAgICAgICAgY29tbWVudEFyZWE6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9jb21tZW50LWFyZWEtcGFydGlhbC5oYnMuaHRtbCcpLFxuICAgICAgICAgICAgZmFjZWJvb2tJY29uOiBTVkdzLmZhY2Vib29rLFxuICAgICAgICAgICAgdHdpdHRlckljb246IFNWR3MudHdpdHRlclxuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmFjdGl2ZS5vbignc2hhcmUtZmFjZWJvb2snLCBzaGFyZVRvRmFjZWJvb2spO1xuICAgIHJhY3RpdmUub24oJ3NoYXJlLXR3aXR0ZXInLCBzaGFyZVRvVHdpdHRlcik7XG4gICAgQ29tbWVudEFyZWFQYXJ0aWFsLnNldHVwKHJlYWN0aW9uUHJvdmlkZXIsIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzLCBudWxsLCByYWN0aXZlKTtcbiAgICByZXR1cm4ge1xuICAgICAgICBzZWxlY3RvcjogcGFnZVNlbGVjdG9yLFxuICAgICAgICB0ZWFyZG93bjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBjbG9zZVNoYXJlV2luZG93KCk7XG4gICAgICAgICAgICByYWN0aXZlLnRlYXJkb3duKCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG5cbiAgICBmdW5jdGlvbiBzaGFyZVRvRmFjZWJvb2socmFjdGl2ZUV2ZW50KSB7XG4gICAgICAgIHJhY3RpdmVFdmVudC5vcmlnaW5hbC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBzaGFyZVJlYWN0aW9uKGZ1bmN0aW9uKHJlYWN0aW9uRGF0YSwgc2hvcnRVcmwpIHtcbiAgICAgICAgICAgIEV2ZW50cy5wb3N0UmVhY3Rpb25TaGFyZWQoJ2ZhY2Vib29rJywgcGFnZURhdGEsIGNvbnRhaW5lckRhdGEsIHJlYWN0aW9uRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICB2YXIgc2hhcmVUZXh0ID0gY29tcHV0ZVNoYXJlVGV4dChyZWFjdGlvbkRhdGEsIDMwMCk7XG4gICAgICAgICAgICB2YXIgaW1hZ2VQYXJhbSA9ICcnO1xuICAgICAgICAgICAgaWYgKGNvbnRhaW5lckRhdGEudHlwZSA9PT0gJ2ltYWdlJykge1xuICAgICAgICAgICAgICAgIGltYWdlUGFyYW0gPSAnJnBbaW1hZ2VzXVswXT0nICsgZW5jb2RlVVJJKHJlYWN0aW9uRGF0YS5jb250ZW50LmJvZHkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuICdodHRwOi8vd3d3LmZhY2Vib29rLmNvbS9zaGFyZXIucGhwP3M9MTAwJyArXG4gICAgICAgICAgICAgICAgJyZwW3VybF09JyArIHNob3J0VXJsICtcbiAgICAgICAgICAgICAgICAnJnBbdGl0bGVdPScgKyBlbmNvZGVVUkkoc2hhcmVUZXh0KSArXG4gICAgICAgICAgICAgICAgJyZwW3N1bW1hcnldPScgKyBlbmNvZGVVUkkoc2hhcmVUZXh0KSArXG4gICAgICAgICAgICAgICAgaW1hZ2VQYXJhbTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2hhcmVUb1R3aXR0ZXIocmFjdGl2ZUV2ZW50KSB7XG4gICAgICAgIHJhY3RpdmVFdmVudC5vcmlnaW5hbC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBzaGFyZVJlYWN0aW9uKGZ1bmN0aW9uKHJlYWN0aW9uRGF0YSwgc2hvcnRVcmwpIHtcbiAgICAgICAgICAgIEV2ZW50cy5wb3N0UmVhY3Rpb25TaGFyZWQoJ3R3aXR0ZXInLCBwYWdlRGF0YSwgY29udGFpbmVyRGF0YSwgcmVhY3Rpb25EYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgIHZhciBzaGFyZVRleHQgPSBjb21wdXRlU2hhcmVUZXh0KHJlYWN0aW9uRGF0YSwgMTEwKTsgLy8gTWFrZSBzdXJlIHdlIHN0YXkgdW5kZXIgdGhlIDE0MCBjaGFyIGxpbWl0ICh0d2l0dGVyIGFwcGVuZHMgYWRkaXRpb25hbCB0ZXh0IGxpa2UgdGhlIHVybClcbiAgICAgICAgICAgIHZhciB0d2l0dGVyVmlhID0gZ3JvdXBTZXR0aW5ncy50d2l0dGVyQWNjb3VudCgpID8gJyZ2aWE9JyArIGdyb3VwU2V0dGluZ3MudHdpdHRlckFjY291bnQoKSA6ICcnO1xuICAgICAgICAgICAgcmV0dXJuICdodHRwOi8vdHdpdHRlci5jb20vaW50ZW50L3R3ZWV0P3VybD0nICsgc2hvcnRVcmwgKyB0d2l0dGVyVmlhICsgJyZ0ZXh0PScgKyBlbmNvZGVVUkkoc2hhcmVUZXh0KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2hhcmVSZWFjdGlvbihjb21wdXRlV2luZG93TG9jYXRpb24pIHtcbiAgICAgICAgY2xvc2VTaGFyZVdpbmRvdygpO1xuICAgICAgICByZWFjdGlvblByb3ZpZGVyLmdldChmdW5jdGlvbihyZWFjdGlvbkRhdGEpIHtcbiAgICAgICAgICAgIHZhciB3aW5kb3cgPSBvcGVuU2hhcmVXaW5kb3coKTtcbiAgICAgICAgICAgIGlmICh3aW5kb3cpIHtcbiAgICAgICAgICAgICAgICBBamF4Q2xpZW50LnBvc3RTaGFyZVJlYWN0aW9uKHJlYWN0aW9uRGF0YSwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MsIGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgdXJsID0gY29tcHV0ZVdpbmRvd0xvY2F0aW9uKHJlYWN0aW9uRGF0YSwgcmVzcG9uc2Uuc2hvcnRfdXJsKTtcbiAgICAgICAgICAgICAgICAgICAgcmVkaXJlY3RTaGFyZVdpbmRvdyh1cmwpO1xuICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChtZXNzYWdlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRmFpbGVkIHRvIHNoYXJlIHJlYWN0aW9uOiBcIiArIG1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgICAgICBjbG9zZVNoYXJlV2luZG93KCk7XG4gICAgICAgICAgICAgICAgICAgIC8vIFRPRE86IGVuZ2FnZV9mdWxsOjk4MThcbiAgICAgICAgICAgICAgICAgICAgLy9pZiAoIHJlc3BvbnNlLm1lc3NhZ2UuaW5kZXhPZiggXCJUZW1wb3JhcnkgdXNlciBpbnRlcmFjdGlvbiBsaW1pdCByZWFjaGVkXCIgKSAhPSAtMSApIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgQU5ULnNlc3Npb24uc2hvd0xvZ2luUGFuZWwoIGFyZ3MgKTtcbiAgICAgICAgICAgICAgICAgICAgLy99IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyAgICAvLyBpZiBpdCBmYWlsZWQsIHNlZSBpZiB3ZSBjYW4gZml4IGl0LCBhbmQgaWYgc28sIHRyeSB0aGlzIGZ1bmN0aW9uIG9uZSBtb3JlIHRpbWVcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgQU5ULnNlc3Npb24uaGFuZGxlR2V0VXNlckZhaWwoIGFyZ3MsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAvLyAgICAgICAgQU5ULmFjdGlvbnMuc2hhcmVfZ2V0TGluayggYXJncyApO1xuICAgICAgICAgICAgICAgICAgICAvLyAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgLy99XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNsb3NlU2hhcmVXaW5kb3coKSB7XG4gICAgICAgIGlmIChwb3B1cFdpbmRvdyAmJiAhcG9wdXBXaW5kb3cuY2xvc2VkKSB7XG4gICAgICAgICAgICBwb3B1cFdpbmRvdy5jbG9zZSgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gb3BlblNoYXJlV2luZG93KCkge1xuICAgICAgICBwb3B1cFdpbmRvdyA9IHdpbmRvdy5vcGVuKFVSTHMuYXBwU2VydmVyVXJsKCkgKyBVUkxzLnNoYXJlV2luZG93VXJsKCksICdhbnRlbm5hX3NoYXJlX3dpbmRvdycsJ21lbnViYXI9MSxyZXNpemFibGU9MSx3aWR0aD02MjYsaGVpZ2h0PTQzNicpO1xuICAgICAgICByZXR1cm4gcG9wdXBXaW5kb3c7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcmVkaXJlY3RTaGFyZVdpbmRvdyh1cmwpIHtcbiAgICAgICAgaWYgKHBvcHVwV2luZG93ICYmICFwb3B1cFdpbmRvdy5jbG9zZWQpIHtcbiAgICAgICAgICAgIHBvcHVwV2luZG93LmxvY2F0aW9uID0gdXJsO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY29tcHV0ZVNoYXJlVGV4dChyZWFjdGlvbkRhdGEsIG1heFRleHRMZW5ndGgpIHtcbiAgICAgICAgdmFyIHNoYXJlVGV4dCA9IHJlYWN0aW9uRGF0YS50ZXh0ICsgXCIgwrsgXCIgKyAnJztcbiAgICAgICAgdmFyIGdyb3VwTmFtZSA9IGdyb3VwU2V0dGluZ3MuZ3JvdXBOYW1lKCk7XG4gICAgICAgIHN3aXRjaCAoY29udGFpbmVyRGF0YS50eXBlKSB7XG4gICAgICAgICAgICBjYXNlICdpbWFnZSc6XG4gICAgICAgICAgICAgICAgc2hhcmVUZXh0ICs9ICdbYSBwaWN0dXJlIG9uICcgKyBncm91cE5hbWUgKyAnXSBDaGVjayBpdCBvdXQ6ICc7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdtZWRpYSc6XG4gICAgICAgICAgICAgICAgc2hhcmVUZXh0ICs9ICdbYSB2aWRlbyBvbiAnICsgZ3JvdXBOYW1lICsgJ10gQ2hlY2sgaXQgb3V0OiAnO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAncGFnZSc6XG4gICAgICAgICAgICAgICAgc2hhcmVUZXh0ICs9ICdbYW4gYXJ0aWNsZSBvbiAnICsgZ3JvdXBOYW1lICsgJ10gQ2hlY2sgaXQgb3V0OiAnO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAndGV4dCc6XG4gICAgICAgICAgICAgICAgdmFyIG1heEJvZHlMZW5ndGggPSBtYXhUZXh0TGVuZ3RoIC0gc2hhcmVUZXh0Lmxlbmd0aCAtIDI7IC8vIHRoZSBleHRyYSAyIGFjY291bnRzIGZvciB0aGUgcXVvdGVzIHdlIGFkZFxuICAgICAgICAgICAgICAgIHZhciB0ZXh0Qm9keSA9IHJlYWN0aW9uRGF0YS5jb250ZW50LmJvZHk7XG4gICAgICAgICAgICAgICAgdGV4dEJvZHkgPSB0ZXh0Qm9keS5sZW5ndGggPiBtYXhCb2R5TGVuZ3RoID8gdGV4dEJvZHkuc3Vic3RyaW5nKDAsIG1heEJvZHlMZW5ndGgtMykgKyAnLi4uJyA6IHRleHRCb2R5O1xuICAgICAgICAgICAgICAgIHNoYXJlVGV4dCArPSAnXCInICsgdGV4dEJvZHkgKyAnXCInO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzaGFyZVRleHQ7XG4gICAgfVxuXG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGU6IGNyZWF0ZVBhZ2Vcbn07IiwidmFyIEFqYXhDbGllbnQgPSByZXF1aXJlKCcuL3V0aWxzL2FqYXgtY2xpZW50Jyk7XG52YXIgVVJMcyA9IHJlcXVpcmUoJy4vdXRpbHMvdXJscycpO1xuXG52YXIgY29udGVudEZldGNoVHJpZ2dlclNpemUgPSAwOyAvLyBUaGUgc2l6ZSBvZiB0aGUgcG9vbCBhdCB3aGljaCB3ZSdsbCBwcm9hY3RpdmVseSBmZXRjaCBtb3JlIGNvbnRlbnQuXG52YXIgZnJlc2hDb250ZW50UG9vbCA9IFtdO1xudmFyIHBlbmRpbmdDYWxsYmFja3MgPSBbXTsgLy8gVGhlIGNhbGxiYWNrIG1vZGVsIGluIHRoaXMgbW9kdWxlIGlzIHVudXN1YWwgYmVjYXVzZSBvZiB0aGUgd2F5IGNvbnRlbnQgaXMgc2VydmVkIGZyb20gYSBwb29sLlxudmFyIHByZWZldGNoZWRHcm91cHMgPSB7fTsgLy9cblxuZnVuY3Rpb24gcHJlZmV0Y2hJZk5lZWRlZChncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGdyb3VwSWQgPSBncm91cFNldHRpbmdzLmdyb3VwSWQoKTtcbiAgICBpZiAoIXByZWZldGNoZWRHcm91cHNbZ3JvdXBJZF0pIHtcbiAgICAgICAgcHJlZmV0Y2hlZEdyb3Vwc1tncm91cElkXSA9IHRydWU7XG4gICAgICAgIGZldGNoUmVjb21tZW5kZWRDb250ZW50KGdyb3VwU2V0dGluZ3MpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZ2V0UmVjb21tZW5kZWRDb250ZW50KGNvdW50LCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncywgY2FsbGJhY2spIHtcbiAgICBjb250ZW50RmV0Y2hUcmlnZ2VyU2l6ZSA9IE1hdGgubWF4KGNvbnRlbnRGZXRjaFRyaWdnZXJTaXplLCBjb3VudCk7IC8vIFVwZGF0ZSB0aGUgdHJpZ2dlciBzaXplIHRvIHRoZSBtb3N0IHdlJ3ZlIGJlZW4gYXNrZWQgZm9yLlxuICAgIC8vIFF1ZXVlIHVwIHRoZSBjYWxsYmFjayBhbmQgdHJ5IHRvIHNlcnZlLiBJZiBtb3JlIGNvbnRlbnQgaXMgbmVlZGVkLCBpdCB3aWxsXG4gICAgLy8gYmUgYXV0b21hdGljYWxseSBmZXRjaGVkLlxuICAgIHBlbmRpbmdDYWxsYmFja3MucHVzaCh7IGNhbGxiYWNrOiBjYWxsYmFjaywgY291bnQ6IGNvdW50IH0pO1xuICAgIHNlcnZlQ29udGVudChwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG59XG5cbmZ1bmN0aW9uIGZldGNoUmVjb21tZW5kZWRDb250ZW50KGdyb3VwU2V0dGluZ3MsIGNhbGxiYWNrKSB7XG4gICAgQWpheENsaWVudC5nZXRKU09OUChVUkxzLmZldGNoQ29udGVudFJlY29tbWVuZGF0aW9uVXJsKCksIHsgZ3JvdXBfaWQ6IGdyb3VwU2V0dGluZ3MuZ3JvdXBJZCgpfSAsIGZ1bmN0aW9uKGpzb25EYXRhKSB7XG4gICAgICAgIC8vIFVwZGF0ZSB0aGUgZnJlc2ggY29udGVudCBwb29sIHdpdGggdGhlIG5ldyBkYXRhLiBBcHBlbmQgYW55IGV4aXN0aW5nIGNvbnRlbnQgdG8gdGhlIGVuZCwgc28gaXQgaXMgcHVsbGVkIGZpcnN0LlxuICAgICAgICB2YXIgY29udGVudERhdGEgPSBqc29uRGF0YSB8fCBbXTtcbiAgICAgICAgY29udGVudERhdGEgPSBtYXNzYWdlQ29udGVudChjb250ZW50RGF0YSk7XG4gICAgICAgIHZhciBuZXdBcnJheSA9IHNodWZmbGVBcnJheShjb250ZW50RGF0YSk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZnJlc2hDb250ZW50UG9vbC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgbmV3QXJyYXkucHVzaChmcmVzaENvbnRlbnRQb29sW2ldKTtcbiAgICAgICAgfVxuICAgICAgICBmcmVzaENvbnRlbnRQb29sID0gbmV3QXJyYXk7XG4gICAgICAgIGlmIChjYWxsYmFjaykgeyBjYWxsYmFjayhncm91cFNldHRpbmdzKTsgfVxuICAgIH0sIGZ1bmN0aW9uKGVycm9yTWVzc2FnZSkge1xuICAgICAgICAvKiBUT0RPOiBFcnJvciBoYW5kbGluZyAqL1xuICAgICAgICBjb25zb2xlLmxvZygnQW4gZXJyb3Igb2NjdXJyZWQgZmV0Y2hpbmcgcmVjb21tZW5kZWQgY29udGVudDogJyArIGVycm9yTWVzc2FnZSk7XG4gICAgfSk7XG59XG5cbi8vIEFwcGx5IGFueSBjbGllbnQtc2lkZSBmaWx0ZXJpbmcvbW9kaWZpY2F0aW9ucyB0byB0aGUgY29udGVudCByZWMgZGF0YS5cbmZ1bmN0aW9uIG1hc3NhZ2VDb250ZW50KGNvbnRlbnREYXRhKSB7XG4gICAgdmFyIG1hc3NhZ2VkQ29udGVudCA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY29udGVudERhdGEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGRhdGEgPSBjb250ZW50RGF0YVtpXTtcbiAgICAgICAgaWYgKGRhdGEuY29udGVudC50eXBlID09PSAnbWVkaWEnKSB7XG4gICAgICAgICAgICAvLyBGb3Igbm93LCB0aGUgb25seSB2aWRlbyB3ZSBoYW5kbGUgaXMgWW91VHViZSwgd2hpY2ggaGFzIGEga25vd24gZm9ybWF0XG4gICAgICAgICAgICAvLyBmb3IgY29udmVydGluZyB2aWRlbyBVUkxzIGludG8gaW1hZ2VzLlxuICAgICAgICAgICAgdmFyIHlvdXR1YmVNYXRjaGVyID0gL14oKGh0dHB8aHR0cHMpOik/XFwvXFwvKHd3d1xcLik/eW91dHViZVxcLmNvbS4qLztcbiAgICAgICAgICAgIGlmICh5b3V0dWJlTWF0Y2hlci50ZXN0KGRhdGEuY29udGVudC5ib2R5KSkgeyAvLyBJcyB0aGlzIGEgeW91dHViZSBVUkw/ICh0aGUgSUQgbWF0Y2hlciBiZWxvdyBkb2Vzbid0IGd1YXJhbnRlZSB0aGlzKVxuICAgICAgICAgICAgICAgIC8vIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMzQ1MjU0Ni9qYXZhc2NyaXB0LXJlZ2V4LWhvdy10by1nZXQteW91dHViZS12aWRlby1pZC1mcm9tLXVybC8yNzcyODQxNyMyNzcyODQxN1xuICAgICAgICAgICAgICAgIHZhciB2aWRlb0lETWF0Y2hlciA9IC9eLiooPzooPzp5b3V0dVxcLmJlXFwvfHZcXC98dmlcXC98dVxcL1xcd1xcL3xlbWJlZFxcLyl8KD86KD86d2F0Y2gpP1xcP3YoPzppKT89fFxcJnYoPzppKT89KSkoW14jXFwmXFw/XSopLiovO1xuICAgICAgICAgICAgICAgIHZhciBtYXRjaCA9IHZpZGVvSURNYXRjaGVyLmV4ZWMoZGF0YS5jb250ZW50LmJvZHkpO1xuICAgICAgICAgICAgICAgIGlmIChtYXRjaC5sZW5ndGggPT09IDIpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQ29udmVydCB0aGUgY29udGVudCBpbnRvIGFuIGltYWdlLlxuICAgICAgICAgICAgICAgICAgICBkYXRhLmNvbnRlbnQuYm9keSA9ICdodHRwczovL2ltZy55b3V0dWJlLmNvbS92aS8nICsgbWF0Y2hbMV0gKyAnL21xZGVmYXVsdC5qcGcnOyAvKiAxNjo5IHJhdGlvIHRodW1ibmFpbCwgc28gd2UgZ2V0IG5vIGJsYWNrIGJhcnMuICovXG4gICAgICAgICAgICAgICAgICAgIGRhdGEuY29udGVudC50eXBlID0gJ2ltYWdlJztcbiAgICAgICAgICAgICAgICAgICAgbWFzc2FnZWRDb250ZW50LnB1c2goZGF0YSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbWFzc2FnZWRDb250ZW50LnB1c2goZGF0YSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG1hc3NhZ2VkQ29udGVudDtcbn1cblxuZnVuY3Rpb24gc2VydmVDb250ZW50KHBhZ2VEYXRhLCBncm91cFNldHRpbmdzLCBwcmV2ZW50TG9vcC8qb25seSB1c2VkIHJlY3Vyc2l2ZWx5Ki8pIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBlbmRpbmdDYWxsYmFja3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGVudHJ5ID0gcGVuZGluZ0NhbGxiYWNrc1tpXTtcbiAgICAgICAgdmFyIGNob3NlbkNvbnRlbnQgPSBbXTtcbiAgICAgICAgdmFyIHVybHNUb0F2b2lkID0gWyBwYWdlRGF0YS5jYW5vbmljYWxVcmwgXTtcbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBlbnRyeS5jb3VudDsgaisrKSB7XG4gICAgICAgICAgICB2YXIgcHJlZmVycmVkVHlwZSA9IGogJSAyID09PSAwID8gJ2ltYWdlJzondGV4dCc7XG4gICAgICAgICAgICB2YXIgZGF0YSA9IGNob29zZUNvbnRlbnQocHJlZmVycmVkVHlwZSwgdXJsc1RvQXZvaWQpO1xuICAgICAgICAgICAgaWYgKGRhdGEpIHtcbiAgICAgICAgICAgICAgICBjaG9zZW5Db250ZW50LnB1c2goZGF0YSk7XG4gICAgICAgICAgICAgICAgdXJsc1RvQXZvaWQucHVzaChkYXRhLnBhZ2UudXJsKTsgLy8gZG9uJ3QgbGluayB0byB0aGUgc2FtZSBwYWdlIHR3aWNlXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNob3NlbkNvbnRlbnQubGVuZ3RoID49IGVudHJ5LmNvdW50KSB7XG4gICAgICAgICAgICBlbnRyeS5jYWxsYmFjayhjaG9zZW5Db250ZW50KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmICghcHJldmVudExvb3ApIHtcbiAgICAgICAgICAgICAgICAvLyBSYW4gb3V0IG9mIGNvbnRlbnQuIEdvIGdldCBtb3JlLiBUaGUgXCJwcmV2ZW50TG9vcFwiIGZsYWcgdGVsbHMgdXMgd2hldGhlclxuICAgICAgICAgICAgICAgIC8vIHdlJ3ZlIGFscmVhZHkgdHJpZWQgdG8gZmV0Y2ggYnV0IHdlIGp1c3QgaGF2ZSBubyBnb29kIGNvbnRlbnQgdG8gY2hvb3NlLlxuICAgICAgICAgICAgICAgIGZldGNoUmVjb21tZW5kZWRDb250ZW50KGdyb3VwU2V0dGluZ3MsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBzZXJ2ZUNvbnRlbnQocGFnZURhdGEsIGdyb3VwU2V0dGluZ3MsIHRydWUpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcGVuZGluZ0NhbGxiYWNrcyA9IHBlbmRpbmdDYWxsYmFja3Muc3BsaWNlKGkpOyAvLyBUcmltIGFueSBjYWxsYmFja3MgdGhhdCB3ZSBub3RpZmllZC5cbn1cblxuZnVuY3Rpb24gY2hvb3NlQ29udGVudChwcmVmZXJyZWRUeXBlLCB1cmxzVG9Bdm9pZCkge1xuICAgIHZhciBhbHRlcm5hdGVJbmRleDtcbiAgICBmb3IgKHZhciBpID0gZnJlc2hDb250ZW50UG9vbC5sZW5ndGgtMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgdmFyIGNvbnRlbnREYXRhID0gZnJlc2hDb250ZW50UG9vbFtpXTtcbiAgICAgICAgaWYgKCFhcnJheUNvbnRhaW5zKHVybHNUb0F2b2lkLCBjb250ZW50RGF0YS5wYWdlLnVybCkpIHtcbiAgICAgICAgICAgIGlmIChjb250ZW50RGF0YS5jb250ZW50LnR5cGUgPT09IHByZWZlcnJlZFR5cGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZnJlc2hDb250ZW50UG9vbC5zcGxpY2UoaSwgMSlbMF07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhbHRlcm5hdGVJbmRleCA9IGk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKGFsdGVybmF0ZUluZGV4ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIGZyZXNoQ29udGVudFBvb2wuc3BsaWNlKGFsdGVybmF0ZUluZGV4LCAxKVswXTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGFycmF5Q29udGFpbnMoYXJyYXksIGVsZW1lbnQpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFycmF5Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChhcnJheVtpXSA9PT0gZWxlbWVudCkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xufVxuXG4vLyBEdXJzdGVuZmVsZCBzaHVmZmxlIGFsZ29yaXRobSBmcm9tOiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8xMjY0Njg2NC80MTM1NDMxXG5mdW5jdGlvbiBzaHVmZmxlQXJyYXkoYXJyYXkpIHtcbiAgICB2YXIgY29weSA9IGFycmF5LnNsaWNlKDApO1xuICAgIGZvciAodmFyIGkgPSBhcnJheS5sZW5ndGggLSAxOyBpID4gMDsgaS0tKSB7XG4gICAgICAgIHZhciBqID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKGkgKyAxKSk7XG4gICAgICAgIHZhciB0ZW1wID0gY29weVtpXTtcbiAgICAgICAgY29weVtpXSA9IGNvcHlbal07XG4gICAgICAgIGNvcHlbal0gPSB0ZW1wO1xuICAgIH1cbiAgICByZXR1cm4gY29weTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgcHJlZmV0Y2hJZk5lZWRlZDogcHJlZmV0Y2hJZk5lZWRlZCxcbiAgICBnZXRSZWNvbW1lbmRlZENvbnRlbnQ6IGdldFJlY29tbWVuZGVkQ29udGVudFxufTsiLCJ2YXIgUmFjdGl2ZTsgcmVxdWlyZSgnLi91dGlscy9yYWN0aXZlLXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGxvYWRlZFJhY3RpdmUpIHsgUmFjdGl2ZSA9IGxvYWRlZFJhY3RpdmU7fSk7XG52YXIgQnJvd3Nlck1ldHJpY3MgPSByZXF1aXJlKCcuL3V0aWxzL2Jyb3dzZXItbWV0cmljcycpO1xudmFyIEpTT05VdGlscyA9IHJlcXVpcmUoJy4vdXRpbHMvanNvbi11dGlscycpO1xudmFyIE1lc3NhZ2VzID0gcmVxdWlyZSgnLi91dGlscy9tZXNzYWdlcycpO1xudmFyIFRocm90dGxlZEV2ZW50cyA9IHJlcXVpcmUoJy4vdXRpbHMvdGhyb3R0bGVkLWV2ZW50cycpO1xudmFyIFVSTHMgPSByZXF1aXJlKCcuL3V0aWxzL3VybHMnKTtcblxudmFyIENvbnRlbnRSZWNMb2FkZXIgPSByZXF1aXJlKCcuL2NvbnRlbnQtcmVjLWxvYWRlcicpO1xudmFyIEV2ZW50cyA9IHJlcXVpcmUoJy4vZXZlbnRzJyk7XG52YXIgU1ZHcyA9IHJlcXVpcmUoJy4vc3ZncycpO1xuXG5mdW5jdGlvbiBjcmVhdGVDb250ZW50UmVjKHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGNvbnRlbnRSZWNDb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBjb250ZW50UmVjQ29udGFpbmVyLmNsYXNzTmFtZSA9ICdhbnRlbm5hIGFudGVubmEtY29udGVudC1yZWMnO1xuICAgIC8vIFdlIGNhbid0IHJlYWxseSByZXF1ZXN0IGNvbnRlbnQgdW50aWwgdGhlIGZ1bGwgcGFnZSBkYXRhIGlzIGxvYWRlZCAoYmVjYXVzZSB3ZSBuZWVkIHRvIGtub3cgdGhlIHNlcnZlci1zaWRlIGNvbXB1dGVkXG4gICAgLy8gY2Fub25pY2FsIFVSTCksIGJ1dCB3ZSBjYW4gc3RhcnQgcHJlZmV0Y2hpbmcgdGhlIGNvbnRlbnQgcG9vbCBmb3IgdGhlIGdyb3VwLlxuICAgIENvbnRlbnRSZWNMb2FkZXIucHJlZmV0Y2hJZk5lZWRlZChncm91cFNldHRpbmdzKTtcbiAgICB2YXIgbnVtRW50cmllcyA9IEJyb3dzZXJNZXRyaWNzLmlzTW9iaWxlKCkgPyBncm91cFNldHRpbmdzLmNvbnRlbnRSZWNDb3VudE1vYmlsZSgpIDogZ3JvdXBTZXR0aW5ncy5jb250ZW50UmVjQ291bnREZXNrdG9wKCk7XG4gICAgdmFyIG51bUVudHJpZXNQZXJSb3cgPSBCcm93c2VyTWV0cmljcy5pc01vYmlsZSgpID8gZ3JvdXBTZXR0aW5ncy5jb250ZW50UmVjUm93Q291bnRNb2JpbGUoKSA6IGdyb3VwU2V0dGluZ3MuY29udGVudFJlY1Jvd0NvdW50RGVza3RvcCgpO1xuICAgIHZhciBlbnRyeVdpZHRoID0gTWF0aC5mbG9vcigxMDAvbnVtRW50cmllc1BlclJvdykgKyAnJSc7XG4gICAgdmFyIGNvbnRlbnREYXRhID0geyBlbnRyaWVzOiB1bmRlZmluZWQgfTsgLy8gTmVlZCB0byBzdHViIG91dCB0aGUgZGF0YSBzbyBSYWN0aXZlIGNhbiBiaW5kIHRvIGl0XG4gICAgdmFyIHJhY3RpdmUgPSBSYWN0aXZlKHtcbiAgICAgICAgZWw6IGNvbnRlbnRSZWNDb250YWluZXIsXG4gICAgICAgIG1hZ2ljOiB0cnVlLFxuICAgICAgICBhcHBlbmQ6IHRydWUsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIHRpdGxlOiBncm91cFNldHRpbmdzLmNvbnRlbnRSZWNUaXRsZSgpIHx8IE1lc3NhZ2VzLmdldE1lc3NhZ2UoJ2NvbnRlbnRfcmVjX3dpZGdldF9fdGl0bGUnKSxcbiAgICAgICAgICAgIHBhZ2VEYXRhOiBwYWdlRGF0YSxcbiAgICAgICAgICAgIGNvbnRlbnREYXRhOiBjb250ZW50RGF0YSxcbiAgICAgICAgICAgIHBvcHVsYXRlQ29udGVudEVudHJpZXM6IHBvcHVsYXRlQ29udGVudEVudHJpZXMobnVtRW50cmllcywgY29udGVudERhdGEsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKSxcbiAgICAgICAgICAgIGNvbG9yczogcGlja0NvbG9ycyhudW1FbnRyaWVzLCBncm91cFNldHRpbmdzKSxcbiAgICAgICAgICAgIGlzTW9iaWxlOiBCcm93c2VyTWV0cmljcy5pc01vYmlsZSgpLFxuICAgICAgICAgICAgZW50cnlXaWR0aDogZW50cnlXaWR0aCxcbiAgICAgICAgICAgIGNvbXB1dGVFbnRyeVVybDogY29tcHV0ZUVudHJ5VXJsXG4gICAgICAgIH0sXG4gICAgICAgIHRlbXBsYXRlOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvY29udGVudC1yZWMtd2lkZ2V0Lmhicy5odG1sJyksXG4gICAgICAgIHBhcnRpYWxzOiB7XG4gICAgICAgICAgICBsb2dvOiBTVkdzLmxvZ29cbiAgICAgICAgfSxcbiAgICAgICAgZGVjb3JhdG9yczoge1xuICAgICAgICAgICAgcmVuZGVyVGV4dDogcmVuZGVyVGV4dFxuICAgICAgICB9XG4gICAgfSk7XG4gICAgc2V0dXBWaXNpYmlsaXR5SGFuZGxlcigpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgZWxlbWVudDogY29udGVudFJlY0NvbnRhaW5lcixcbiAgICAgICAgdGVhcmRvd246IGZ1bmN0aW9uKCkgeyByYWN0aXZlLnRlYXJkb3duKCk7IH1cbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gY29tcHV0ZUVudHJ5VXJsKGNvbnRlbnRFbnRyeSkge1xuICAgICAgICB2YXIgdGFyZ2V0VXJsID0gY29udGVudEVudHJ5LnBhZ2UudXJsO1xuICAgICAgICB2YXIgY29udGVudElkID0gY29udGVudEVudHJ5LmNvbnRlbnQuaWQ7XG4gICAgICAgIHZhciBldmVudCA9IEV2ZW50cy5jcmVhdGVDb250ZW50UmVjQ2xpY2tlZEV2ZW50KHBhZ2VEYXRhLCB0YXJnZXRVcmwsIGNvbnRlbnRJZCwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIHJldHVybiBVUkxzLmNvbXB1dGVDb250ZW50UmVjVXJsKHRhcmdldFVybCwgZXZlbnQpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNldHVwVmlzaWJpbGl0eUhhbmRsZXIoKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAvLyBXaGVuIGNvbnRlbnQgcmVjIGxvYWRzLCBnaXZlIGl0IGEgbW9tZW50IGFuZCB0aGVuIHNlZSBpZiB3ZSdyZVxuICAgICAgICAgICAgLy8gdmlzaWJsZS4gSWYgbm90LCBzdGFydCB0cmFja2luZyBzY3JvbGwgZXZlbnRzLlxuICAgICAgICAgICAgaWYgKGlzQ29udGVudFJlY1Zpc2libGUoKSkge1xuICAgICAgICAgICAgICAgIEV2ZW50cy5wb3N0Q29udGVudFJlY1Zpc2libGUocGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBUaHJvdHRsZWRFdmVudHMub24oJ3Njcm9sbCcsIGhhbmRsZVNjcm9sbEV2ZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgMjAwKTtcblxuICAgICAgICBmdW5jdGlvbiBoYW5kbGVTY3JvbGxFdmVudCgpIHtcbiAgICAgICAgICAgIGlmIChpc0NvbnRlbnRSZWNWaXNpYmxlKCkpIHtcbiAgICAgICAgICAgICAgICBFdmVudHMucG9zdENvbnRlbnRSZWNWaXNpYmxlKHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgICAgICBUaHJvdHRsZWRFdmVudHMub2ZmKCdzY3JvbGwnLCBoYW5kbGVTY3JvbGxFdmVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpc0NvbnRlbnRSZWNWaXNpYmxlKCkge1xuICAgICAgICAvLyBCZWNhdXNlIHRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkIG9uIHNjcm9sbCwgd2UgdHJ5IHRvIGF2b2lkIHVubmVjZXNzYXJ5XG4gICAgICAgIC8vIGNvbXB1dGF0aW9uIGFzIG11Y2ggYXMgcG9zc2libGUgaGVyZSwgYmFpbGluZyBvdXQgYXMgZWFybHkgYXMgcG9zc2libGUuXG4gICAgICAgIC8vIEZpcnN0LCBjaGVjayB3aGV0aGVyIHdlIGV2ZW4gaGF2ZSBwYWdlIGRhdGEuXG4gICAgICAgIGlmIChwYWdlRGF0YS5zdW1tYXJ5TG9hZGVkKSB7XG4gICAgICAgICAgICAvLyBUaGVuIGNoZWNrIGlmIHRoZSBvdXRlciBjb250ZW50IHJlYyBpcyBpbiB0aGUgdmlld3BvcnQgYXQgYWxsLlxuICAgICAgICAgICAgdmFyIGNvbnRlbnRCb3ggPSBjb250ZW50UmVjQ29udGFpbmVyLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICAgICAgdmFyIHZpZXdwb3J0Qm90dG9tID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudEhlaWdodDtcbiAgICAgICAgICAgIGlmIChjb250ZW50Qm94LnRvcCA+IDAgJiYgY29udGVudEJveC50b3AgPCB2aWV3cG9ydEJvdHRvbSB8fFxuICAgICAgICAgICAgICAgIGNvbnRlbnRCb3guYm90dG9tID4gMCAmJiBjb250ZW50Qm94LmJvdHRvbSA8IHZpZXdwb3J0Qm90dG9tKSB7XG4gICAgICAgICAgICAgICAgLy8gRmluYWxseSwgbG9vayB0byBzZWUgd2hldGhlciBhbnkgcmVjb21tZW5kZWQgY29udGVudCBoYXMgYmVlblxuICAgICAgICAgICAgICAgIC8vIHJlbmRlcmVkIG9udG8gdGhlIHBhZ2UgYW5kIGlzIG9uIHNjcmVlbiBlbm91Z2ggdG8gYmUgY29uc2lkZXJlZFxuICAgICAgICAgICAgICAgIC8vIHZpc2libGUuXG4gICAgICAgICAgICAgICAgdmFyIGVudHJpZXMgPSByYWN0aXZlLmZpbmRBbGwoJy5hbnRlbm5hLWNvbnRlbnRyZWMtZW50cnknKTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGVudHJpZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGVudHJ5ID0gZW50cmllc1tpXTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGVudHJ5Qm94ID0gZW50cnkuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlbnRyeUJveC50b3AgPiAwICYmIGVudHJ5Qm94LmJvdHRvbSA8IHZpZXdwb3J0Qm90dG9tKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBUaGUgZW50cnkgaXMgZnVsbHkgdmlzaWJsZVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbn1cblxuLy8gVGhpcyBmdW5jdGlvbiBpcyB0cmlnZ2VyZWQgZnJvbSB3aXRoaW4gdGhlIFJhY3RpdmUgdGVtcGxhdGUgd2hlbiB0aGUgcGFnZSBkYXRhIGlzIGxvYWRlZC4gT25jZSBwYWdlIGRhdGEgaXMgbG9hZGVkLFxuLy8gd2UncmUgcmVhZHkgdG8gYXNrIGZvciBjb250ZW50LlxuZnVuY3Rpb24gcG9wdWxhdGVDb250ZW50RW50cmllcyhudW1FbnRyaWVzLCBjb250ZW50RGF0YSwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24ocGFnZURhdGFJc0xvYWRlZCkge1xuICAgICAgICBpZiAocGFnZURhdGFJc0xvYWRlZCAmJiAhY29udGVudERhdGEuZW50cmllcykge1xuICAgICAgICAgICAgLy8gU2luY2UgdGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgYnkgUmFjdGl2ZSB3aGVuIHBhZ2VEYXRhLnN1bW1hcnlMb2FkZWQgY2hhbmdlcyBhbmQgaXQgY2FuIHBvdGVudGlhbGx5XG4gICAgICAgICAgICAvLyAqdHJpZ2dlciogYSBSYWN0aXZlIHVwZGF0ZSAoaWYgY29udGVudCBkYXRhIGlzIHJlYWR5IHRvIGJlIHNlcnZlZCwgd2UgbW9kaWZ5IGNvbnRlbnREYXRhLmVudHJpZXMpLFxuICAgICAgICAgICAgLy8gd2UgbmVlZCB0byB3cmFwIGluIGEgdGltZW91dCBzbyB0aGF0IHRoZSBmaXJzdCBSYWN0aXZlIHVwZGF0ZSBjYW4gY29tcGxldGUgYmVmb3JlIHdlIHRyaWdnZXIgYW5vdGhlci5cbiAgICAgICAgICAgIC8vIE90aGVyd2lzZSwgUmFjdGl2ZSBiYWlscyBvdXQgYmVjYXVzZSBpdCB0aGlua3Mgd2UncmUgdHJpZ2dlcmluZyBhbiBpbmZpbml0ZSB1cGRhdGUgbG9vcC5cbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgQ29udGVudFJlY0xvYWRlci5nZXRSZWNvbW1lbmRlZENvbnRlbnQobnVtRW50cmllcywgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MsIGZ1bmN0aW9uIChmZXRjaGVkQ29udGVudEVudHJpZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGVudERhdGEuZW50cmllcyA9IGZldGNoZWRDb250ZW50RW50cmllcztcbiAgICAgICAgICAgICAgICAgICAgRXZlbnRzLnBvc3RDb250ZW50UmVjTG9hZGVkKHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sIDApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwYWdlRGF0YUlzTG9hZGVkO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gcmVuZGVyVGV4dChub2RlKSB7XG4gICAgdmFyIHRleHQgPSBjcm9wSWZOZWVkZWQobm9kZSk7XG4gICAgaWYgKHRleHQubGVuZ3RoICE9PSBub2RlLmlubmVySFRNTC5sZW5ndGgpIHtcbiAgICAgICAgdGV4dCArPSAnLi4uJztcbiAgICB9XG4gICAgdGV4dCA9IGFwcGx5Qm9sZGluZyh0ZXh0KTtcbiAgICBpZiAodGV4dC5sZW5ndGggIT09IG5vZGUuaW5uZXJIVE1MLmxlbmd0aCkge1xuICAgICAgICBub2RlLmlubmVySFRNTCA9IHRleHQ7XG4gICAgICAgIC8vIENoZWNrIGFnYWluLCBqdXN0IHRvIG1ha2Ugc3VyZSB0aGUgdGV4dCBmaXRzIGFmdGVyIGJvbGRpbmcuXG4gICAgICAgIHRleHQgPSBjcm9wSWZOZWVkZWQobm9kZSk7XG4gICAgICAgIGlmICh0ZXh0Lmxlbmd0aCAhPT0gbm9kZS5pbm5lckhUTUwubGVuZ3RoKSB7IC8vXG4gICAgICAgICAgICBub2RlLmlubmVySFRNTCA9IHRleHQgKyAnLi4uJztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7IHRlYXJkb3duOiBmdW5jdGlvbigpIHt9IH07XG5cbiAgICBmdW5jdGlvbiBjcm9wSWZOZWVkZWQobm9kZSkge1xuICAgICAgICB2YXIgdGV4dCA9IG5vZGUuaW5uZXJIVE1MO1xuICAgICAgICB2YXIgcmF0aW8gPSBub2RlLmNsaWVudEhlaWdodCAvIG5vZGUuc2Nyb2xsSGVpZ2h0O1xuICAgICAgICBpZiAocmF0aW8gPCAxKSB7IC8vIElmIHRoZSB0ZXh0IGlzIGxhcmdlciB0aGFuIHRoZSBjbGllbnQgYXJlYSwgY3JvcCB0aGUgdGV4dC5cbiAgICAgICAgICAgIHZhciBjcm9wV29yZEJyZWFrID0gdGV4dC5sYXN0SW5kZXhPZignICcsIHRleHQubGVuZ3RoICogcmF0aW8gLSAzKTsgLy8gYWNjb3VudCBmb3IgdGhlICcuLi4nIHRoYXQgd2UnbGwgYWRkXG4gICAgICAgICAgICB0ZXh0ID0gdGV4dC5zdWJzdHJpbmcoMCwgY3JvcFdvcmRCcmVhayk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRleHQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYXBwbHlCb2xkaW5nKHRleHQpIHtcbiAgICAgICAgdmFyIGJvbGRTdGFydFBvaW50ID0gTWF0aC5mbG9vcih0ZXh0Lmxlbmd0aCAqIC4yNSk7XG4gICAgICAgIHZhciBib2xkRW5kUG9pbnQgPSBNYXRoLmZsb29yKHRleHQubGVuZ3RoICouOCk7XG4gICAgICAgIHZhciBtYXRjaGVzID0gdGV4dC5zdWJzdHJpbmcoYm9sZFN0YXJ0UG9pbnQsIGJvbGRFbmRQb2ludCkubWF0Y2goLyx8XFwufFxcP3xcIi9naSk7XG4gICAgICAgIGlmIChtYXRjaGVzKSB7XG4gICAgICAgICAgICB2YXIgYm9sZFBvaW50ID0gdGV4dC5sYXN0SW5kZXhPZihtYXRjaGVzW21hdGNoZXMubGVuZ3RoIC0gMV0sIGJvbGRFbmRQb2ludCkgKyAxO1xuICAgICAgICAgICAgdGV4dCA9ICc8c3Ryb25nPicgKyB0ZXh0LnN1YnN0cmluZygwLCBib2xkUG9pbnQpICsgJzwvc3Ryb25nPicgKyB0ZXh0LnN1YnN0cmluZyhib2xkUG9pbnQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0ZXh0O1xuICAgIH1cbn1cblxuZnVuY3Rpb24gcGlja0NvbG9ycyhjb3VudCwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBjb2xvclBhbGxldGUgPSBbXTtcbiAgICB2YXIgY29sb3JEYXRhID0gZ3JvdXBTZXR0aW5ncy5jb250ZW50UmVjQ29sb3JzKCk7XG4gICAgaWYgKGNvbG9yRGF0YSkge1xuICAgICAgICB2YXIgY29sb3JQYWlycyA9IGNvbG9yRGF0YS5zcGxpdCgnOycpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvbG9yUGFpcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBjb2xvcnMgPSBjb2xvclBhaXJzW2ldLnNwbGl0KCcvJyk7XG4gICAgICAgICAgICBpZiAoY29sb3JzLmxlbmd0aCA9PT0gMikge1xuICAgICAgICAgICAgICAgIGNvbG9yUGFsbGV0ZS5wdXNoKHsgYmFja2dyb3VuZDogY29sb3JzWzBdLCBmb3JlZ3JvdW5kOiBjb2xvcnNbMV0gfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKGNvbG9yUGFsbGV0ZS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgY29sb3JQYWxsZXRlLnB1c2goeyBiYWNrZ3JvdW5kOiAnIzAwMDAwMCcsIGZvcmVncm91bmQ6ICcjRkZGRkZGJyB9KTtcbiAgICB9XG4gICAgaWYgKGNvdW50IDwgY29sb3JQYWxsZXRlLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gc2h1ZmZsZUFycmF5KGNvbG9yUGFsbGV0ZSkuc2xpY2UoMCwgY291bnQpO1xuICAgIH0gZWxzZSB7IC8vIElmIHdlJ3JlIGFza2luZyBmb3IgbW9yZSBjb2xvcnMgdGhhbiB3ZSBoYXZlLCBqdXN0IHJlcGVhdCB0aGUgc2FtZSBjb2xvcnMgYXMgbmVjZXNzYXJ5LlxuICAgICAgICB2YXIgb3V0cHV0ID0gW107XG4gICAgICAgIHZhciBjaG9zZW5JbmRleDtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb3VudDsgaSsrKSB7XG4gICAgICAgICAgICBjaG9zZW5JbmRleCA9IHJhbmRvbUluZGV4KGNob3NlbkluZGV4KTtcbiAgICAgICAgICAgIG91dHB1dC5wdXNoKGNvbG9yUGFsbGV0ZVtjaG9zZW5JbmRleF0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBvdXRwdXQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcmFuZG9tSW5kZXgoYXZvaWQpIHtcbiAgICAgICAgZG8ge1xuICAgICAgICAgICAgdmFyIHBpY2tlZCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGNvbG9yUGFsbGV0ZS5sZW5ndGgpO1xuICAgICAgICB9IHdoaWxlIChwaWNrZWQgPT09IGF2b2lkICYmIGNvbG9yUGFsbGV0ZS5sZW5ndGggPiAxKTtcbiAgICAgICAgcmV0dXJuIHBpY2tlZDtcbiAgICB9XG59XG5cbi8vIER1cnN0ZW5mZWxkIHNodWZmbGUgYWxnb3JpdGhtIGZyb206IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzEyNjQ2ODY0LzQxMzU0MzFcbmZ1bmN0aW9uIHNodWZmbGVBcnJheShhcnJheSkge1xuICAgIHZhciBjb3B5ID0gYXJyYXkuc2xpY2UoMCk7XG4gICAgZm9yICh2YXIgaSA9IGFycmF5Lmxlbmd0aCAtIDE7IGkgPiAwOyBpLS0pIHtcbiAgICAgICAgdmFyIGogPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAoaSArIDEpKTtcbiAgICAgICAgdmFyIHRlbXAgPSBjb3B5W2ldO1xuICAgICAgICBjb3B5W2ldID0gY29weVtqXTtcbiAgICAgICAgY29weVtqXSA9IHRlbXA7XG4gICAgfVxuICAgIHJldHVybiBjb3B5O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGVDb250ZW50UmVjOiBjcmVhdGVDb250ZW50UmVjXG59OyIsInZhciBBcHBNb2RlID0gcmVxdWlyZSgnLi91dGlscy9hcHAtbW9kZScpO1xudmFyIFVSTHMgPSByZXF1aXJlKCcuL3V0aWxzL3VybHMnKTtcblxuZnVuY3Rpb24gbG9hZENzcygpIHtcbiAgICAvLyBUbyBtYWtlIHN1cmUgbm9uZSBvZiBvdXIgY29udGVudCByZW5kZXJzIG9uIHRoZSBwYWdlIGJlZm9yZSBvdXIgQ1NTIGlzIGxvYWRlZCwgd2UgYXBwZW5kIGEgc2ltcGxlIGlubGluZSBzdHlsZVxuICAgIC8vIGVsZW1lbnQgdGhhdCB0dXJucyBvZmYgb3VyIGVsZW1lbnRzICpiZWZvcmUqIG91ciBDU1MgbGlua3MuIFRoaXMgZXhwbG9pdHMgdGhlIGNhc2NhZGUgcnVsZXMgLSBvdXIgQ1NTIGZpbGVzIGFwcGVhclxuICAgIC8vIGFmdGVyIHRoZSBpbmxpbmUgc3R5bGUgaW4gdGhlIGRvY3VtZW50LCBzbyB0aGV5IHRha2UgcHJlY2VkZW5jZSAoYW5kIG1ha2UgZXZlcnl0aGluZyBhcHBlYXIpIG9uY2UgdGhleSdyZSBsb2FkZWQuXG4gICAgaW5qZWN0Q3NzKCcuYW50ZW5uYXtkaXNwbGF5Om5vbmU7fScpO1xuICAgIHZhciBjc3NIcmVmID0gVVJMcy5hbWF6b25TM1VybCgpICsgJy93aWRnZXQtbmV3L2FudGVubmEuY3NzP3Y9Myc7XG4gICAgaWYgKEFwcE1vZGUub2ZmbGluZSkge1xuICAgICAgICBjc3NIcmVmID0gVVJMcy5hcHBTZXJ2ZXJVcmwoKSArICcvc3RhdGljL3dpZGdldC1uZXcvYW50ZW5uYS5jc3MnO1xuICAgIH1cbiAgICBsb2FkRmlsZShjc3NIcmVmKTtcbn1cblxuZnVuY3Rpb24gbG9hZEZpbGUoaHJlZikge1xuICAgIHZhciBsaW5rVGFnID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGluaycpO1xuICAgIGxpbmtUYWcuc2V0QXR0cmlidXRlKCdocmVmJywgaHJlZik7XG4gICAgbGlua1RhZy5zZXRBdHRyaWJ1dGUoJ3JlbCcsICdzdHlsZXNoZWV0Jyk7XG4gICAgbGlua1RhZy5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCAndGV4dC9jc3MnKTtcbiAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKGxpbmtUYWcpO1xufVxuXG5mdW5jdGlvbiBpbmplY3RDc3MoY3NzU3RyaW5nKSB7XG4gICAgdmFyIHN0eWxlVGFnID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcbiAgICBzdHlsZVRhZy5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCAndGV4dC9jc3MnKTtcbiAgICBzdHlsZVRhZy5pbm5lckhUTUwgPSBjc3NTdHJpbmc7XG4gICAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzdHlsZVRhZyk7XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBsb2FkIDogbG9hZENzcyxcbiAgICBpbmplY3Q6IGluamVjdENzc1xufTsiLCJ2YXIgQWpheENsaWVudCA9IHJlcXVpcmUoJy4vdXRpbHMvYWpheC1jbGllbnQnKTtcbnZhciBCcm93c2VyTWV0cmljcyA9IHJlcXVpcmUoJy4vdXRpbHMvYnJvd3Nlci1tZXRyaWNzJyk7XG52YXIgTG9nZ2luZyA9IHJlcXVpcmUoJy4vdXRpbHMvbG9nZ2luZycpO1xudmFyIFNlZ21lbnQgPSByZXF1aXJlKCcuL3V0aWxzL3NlZ21lbnQnKTtcbnZhciBTZXNzaW9uRGF0YSA9IHJlcXVpcmUoJy4vdXRpbHMvc2Vzc2lvbi1kYXRhJyk7XG52YXIgVXNlciA9IHJlcXVpcmUoJy4vdXRpbHMvdXNlcicpO1xuXG5mdW5jdGlvbiBwb3N0R3JvdXBTZXR0aW5nc0xvYWRlZChncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGV2ZW50ID0gY3JlYXRlRXZlbnQoZXZlbnRUeXBlcy5zY3JpcHRMb2FkLCAnJywgZ3JvdXBTZXR0aW5ncyk7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5wYWdlSWRdID0gJ25hJztcbiAgICBldmVudFthdHRyaWJ1dGVzLmFydGljbGVIZWlnaHRdID0gJ25hJztcbiAgICBwb3N0RXZlbnQoZXZlbnQpO1xufVxuXG5mdW5jdGlvbiBwb3N0UGFnZURhdGFMb2FkZWQocGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgZXZlbnQgPSBjcmVhdGVFdmVudChldmVudFR5cGVzLnBhZ2VEYXRhTG9hZGVkLCAnJywgZ3JvdXBTZXR0aW5ncyk7XG4gICAgYXBwZW5kUGFnZURhdGFQYXJhbXMoZXZlbnQsIHBhZ2VEYXRhKTtcbiAgICAvLyBUT0RPOiByZWNvcmRpbmcgb2Ygc2luZ2xlL211bHRpIGlzIGRpc2FibGVkIHNvIHdlIGNhbiBpbnN0ZWFkIHJlY29yZCBBL0IvQyBzZWdtZW50IGRhdGFcbiAgICAvLyBldmVudFthdHRyaWJ1dGVzLmNvbnRlbnRBdHRyaWJ1dGVzXSA9IHBhZ2VEYXRhLm1ldHJpY3MuaXNNdWx0aVBhZ2UgPyBldmVudFZhbHVlcy5tdWx0aXBsZVBhZ2VzIDogZXZlbnRWYWx1ZXMuc2luZ2xlUGFnZTtcbiAgICBwb3N0RXZlbnQoZXZlbnQpO1xufVxuXG5mdW5jdGlvbiBwb3N0UmVhY3Rpb25XaWRnZXRPcGVuZWQocGFnZURhdGEsIGNvbnRhaW5lckRhdGEsIGNvbnRlbnREYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGV2ZW50ID0gY3JlYXRlRXZlbnQoZXZlbnRUeXBlcy5yZWFjdGlvbldpZGdldE9wZW5lZCwgJycsIGdyb3VwU2V0dGluZ3MpO1xuICAgIGFwcGVuZFBhZ2VEYXRhUGFyYW1zKGV2ZW50LCBwYWdlRGF0YSk7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5jb250YWluZXJIYXNoXSA9IGNvbnRhaW5lckRhdGEuaGFzaDtcbiAgICBldmVudFthdHRyaWJ1dGVzLmNvbnRhaW5lcktpbmRdID0gY29udGVudERhdGEudHlwZTtcbiAgICBwb3N0RXZlbnQoZXZlbnQpO1xuXG4gICAgdmFyIGN1c3RvbUV2ZW50ID0gY3JlYXRlQ3VzdG9tRXZlbnQoZW1pdEV2ZW50VHlwZXMucmVhY3Rpb25WaWV3KTtcbiAgICBlbWl0RXZlbnQoY3VzdG9tRXZlbnQpO1xufVxuXG5mdW5jdGlvbiBwb3N0U3VtbWFyeU9wZW5lZChwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBldmVudCA9IGNyZWF0ZUV2ZW50KGV2ZW50VHlwZXMuc3VtbWFyeVdpZGdldCwgJycsIGdyb3VwU2V0dGluZ3MpO1xuICAgIGFwcGVuZFBhZ2VEYXRhUGFyYW1zKGV2ZW50LCBwYWdlRGF0YSk7XG4gICAgcG9zdEV2ZW50KGV2ZW50KTtcblxuICAgIHZhciBjdXN0b21FdmVudCA9IGNyZWF0ZUN1c3RvbUV2ZW50KGVtaXRFdmVudFR5cGVzLnJlYWN0aW9uVmlldyk7XG4gICAgZW1pdEV2ZW50KGN1c3RvbUV2ZW50KTtcbn1cblxuZnVuY3Rpb24gcG9zdFJlYWN0aW9uQ3JlYXRlZChwYWdlRGF0YSwgY29udGFpbmVyRGF0YSwgcmVhY3Rpb25EYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGV2ZW50ID0gY3JlYXRlRXZlbnQoZXZlbnRUeXBlcy5yZWFjdGlvbkNyZWF0ZWQsIHJlYWN0aW9uRGF0YS50ZXh0LCBncm91cFNldHRpbmdzKTtcbiAgICBhcHBlbmRQYWdlRGF0YVBhcmFtcyhldmVudCwgcGFnZURhdGEpO1xuICAgIGFwcGVuZENvbnRhaW5lckRhdGFQYXJhbXMoZXZlbnQsIGNvbnRhaW5lckRhdGEpO1xuICAgIGFwcGVuZFJlYWN0aW9uRGF0YVBhcmFtcyhldmVudCwgcmVhY3Rpb25EYXRhKTtcbiAgICBwb3N0RXZlbnQoZXZlbnQpO1xuXG4gICAgdmFyIGV2ZW50RGV0YWlsID0ge1xuICAgICAgICByZWFjdGlvbjogcmVhY3Rpb25EYXRhLnRleHQsXG4gICAgICAgIGNvbnRlbnQ6IHJlYWN0aW9uRGF0YS5jb250ZW50LmJvZHlcbiAgICB9O1xuICAgIHN3aXRjaCAocmVhY3Rpb25EYXRhLmNvbnRlbnQua2luZCkgeyAvLyBNYXAgb3VyIGludGVybmFsIGNvbnRlbnQgdHlwZXMgdG8gYmV0dGVyIHZhbHVlcyBmb3IgY29uc3VtZXJzXG4gICAgICAgIGNhc2UgJ3R4dCc6XG4gICAgICAgICAgICBldmVudERldGFpbC5jb250ZW50VHlwZSA9ICd0ZXh0JztcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdpbWcnOlxuICAgICAgICAgICAgZXZlbnREZXRhaWwuY29udGVudFR5cGUgPSAnaW1hZ2UnO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ21lZCc6XG4gICAgICAgICAgICBldmVudERldGFpbC5jb250ZW50VHlwZSA9ICdtZWRpYSc7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIGV2ZW50RGV0YWlsLmNvbnRlbnRUeXBlID0gcmVhY3Rpb25EYXRhLmNvbnRlbnQua2luZDtcbiAgICB9XG4gICAgdmFyIGN1c3RvbUV2ZW50ID0gY3JlYXRlQ3VzdG9tRXZlbnQoZW1pdEV2ZW50VHlwZXMucmVhY3Rpb25DcmVhdGUsIGV2ZW50RGV0YWlsKTtcbiAgICBlbWl0RXZlbnQoY3VzdG9tRXZlbnQpO1xufVxuXG5mdW5jdGlvbiBwb3N0UmVhY3Rpb25TaGFyZWQodGFyZ2V0LCBwYWdlRGF0YSwgY29udGFpbmVyRGF0YSwgcmVhY3Rpb25EYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGV2ZW50VmFsdWUgPSB0YXJnZXQ7IC8vICdmYWNlYm9vaycsICd0d2l0dGVyJywgZXRjXG4gICAgdmFyIGV2ZW50ID0gY3JlYXRlRXZlbnQoZXZlbnRUeXBlcy5yZWFjdGlvblNoYXJlZCwgZXZlbnRWYWx1ZSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgYXBwZW5kUGFnZURhdGFQYXJhbXMoZXZlbnQsIHBhZ2VEYXRhKTtcbiAgICBhcHBlbmRDb250YWluZXJEYXRhUGFyYW1zKGV2ZW50LCBjb250YWluZXJEYXRhKTtcbiAgICBhcHBlbmRSZWFjdGlvbkRhdGFQYXJhbXMoZXZlbnQsIHJlYWN0aW9uRGF0YSk7XG4gICAgcG9zdEV2ZW50KGV2ZW50KTtcblxuICAgIHZhciBjdXN0b21FdmVudCA9IGNyZWF0ZUN1c3RvbUV2ZW50KGVtaXRFdmVudFR5cGVzLnJlYWN0aW9uU2hhcmUpO1xuICAgIGVtaXRFdmVudChjdXN0b21FdmVudCk7XG59XG5cbmZ1bmN0aW9uIHBvc3RMb2NhdGlvbnNWaWV3ZWQocGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgZXZlbnQgPSBjcmVhdGVFdmVudChldmVudFR5cGVzLnN1bW1hcnlXaWRnZXQsIGV2ZW50VmFsdWVzLmxvY2F0aW9uc1ZpZXdlZCwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgYXBwZW5kUGFnZURhdGFQYXJhbXMoZXZlbnQsIHBhZ2VEYXRhKTtcbiAgICBwb3N0RXZlbnQoZXZlbnQpO1xuXG4gICAgdmFyIGN1c3RvbUV2ZW50ID0gY3JlYXRlQ3VzdG9tRXZlbnQoZW1pdEV2ZW50VHlwZXMuY29udGVudFdpdGhSZWFjdGlvblZpZXcpO1xuICAgIGVtaXRFdmVudChjdXN0b21FdmVudCk7XG59XG5cbmZ1bmN0aW9uIHBvc3RDb250ZW50Vmlld2VkKHBhZ2VEYXRhLCBjb250YWluZXJEYXRhLCBsb2NhdGlvbkRhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgZXZlbnQgPSBjcmVhdGVFdmVudChldmVudFR5cGVzLnN1bW1hcnlXaWRnZXQsIGV2ZW50VmFsdWVzLmNvbnRlbnRWaWV3ZWQsIGdyb3VwU2V0dGluZ3MpO1xuICAgIGFwcGVuZFBhZ2VEYXRhUGFyYW1zKGV2ZW50LCBwYWdlRGF0YSk7XG4gICAgYXBwZW5kQ29udGFpbmVyRGF0YVBhcmFtcyhldmVudCwgY29udGFpbmVyRGF0YSk7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5jb250ZW50SWRdID0gbG9jYXRpb25EYXRhLmNvbnRlbnRJZDtcbiAgICBldmVudFthdHRyaWJ1dGVzLmNvbnRlbnRMb2NhdGlvbl0gPSBsb2NhdGlvbkRhdGEubG9jYXRpb247XG4gICAgcG9zdEV2ZW50KGV2ZW50KTtcblxuICAgIHZhciBjdXN0b21FdmVudCA9IGNyZWF0ZUN1c3RvbUV2ZW50KGVtaXRFdmVudFR5cGVzLmNvbnRlbnRXaXRoUmVhY3Rpb25GaW5kKTtcbiAgICBlbWl0RXZlbnQoY3VzdG9tRXZlbnQpO1xufVxuXG5mdW5jdGlvbiBwb3N0Q29tbWVudHNWaWV3ZWQocGFnZURhdGEsIGNvbnRhaW5lckRhdGEsIHJlYWN0aW9uRGF0YSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBldmVudCA9IGNyZWF0ZUV2ZW50KGV2ZW50VHlwZXMuY29tbWVudHNWaWV3ZWQsICcnLCBncm91cFNldHRpbmdzKTtcbiAgICBhcHBlbmRQYWdlRGF0YVBhcmFtcyhldmVudCwgcGFnZURhdGEpO1xuICAgIGFwcGVuZENvbnRhaW5lckRhdGFQYXJhbXMoZXZlbnQsIGNvbnRhaW5lckRhdGEpO1xuICAgIGFwcGVuZFJlYWN0aW9uRGF0YVBhcmFtcyhldmVudCwgcmVhY3Rpb25EYXRhKTtcbiAgICBwb3N0RXZlbnQoZXZlbnQpO1xuXG4gICAgdmFyIGN1c3RvbUV2ZW50ID0gY3JlYXRlQ3VzdG9tRXZlbnQoZW1pdEV2ZW50VHlwZXMuY29tbWVudFZpZXcpO1xuICAgIGVtaXRFdmVudChjdXN0b21FdmVudCk7XG59XG5cbmZ1bmN0aW9uIHBvc3RDb21tZW50Q3JlYXRlZChwYWdlRGF0YSwgY29udGFpbmVyRGF0YSwgcmVhY3Rpb25EYXRhLCBjb21tZW50LCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGV2ZW50ID0gY3JlYXRlRXZlbnQoZXZlbnRUeXBlcy5jb21tZW50Q3JlYXRlZCwgY29tbWVudCwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgYXBwZW5kUGFnZURhdGFQYXJhbXMoZXZlbnQsIHBhZ2VEYXRhKTtcbiAgICBhcHBlbmRDb250YWluZXJEYXRhUGFyYW1zKGV2ZW50LCBjb250YWluZXJEYXRhKTtcbiAgICBhcHBlbmRSZWFjdGlvbkRhdGFQYXJhbXMoZXZlbnQsIHJlYWN0aW9uRGF0YSk7XG4gICAgcG9zdEV2ZW50KGV2ZW50KTtcblxuICAgIHZhciBjdXN0b21FdmVudCA9IGNyZWF0ZUN1c3RvbUV2ZW50KGVtaXRFdmVudFR5cGVzLmNvbW1lbnRDcmVhdGUpO1xuICAgIGVtaXRFdmVudChjdXN0b21FdmVudCk7XG59XG5cbmZ1bmN0aW9uIHBvc3RMZWdhY3lSZWNpcmNDbGlja2VkKHBhZ2VEYXRhLCByZWFjdGlvbklkLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGV2ZW50ID0gY3JlYXRlRXZlbnQoZXZlbnRUeXBlcy5yZWNpcmNDbGlja2VkLCByZWFjdGlvbklkLCBncm91cFNldHRpbmdzKTtcbiAgICBhcHBlbmRQYWdlRGF0YVBhcmFtcyhldmVudCwgcGFnZURhdGEpO1xuICAgIHBvc3RFdmVudChldmVudCk7XG59XG5cbmZ1bmN0aW9uIHBvc3RDb250ZW50UmVjTG9hZGVkKHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGV2ZW50ID0gY3JlYXRlRXZlbnQoZXZlbnRUeXBlcy5jb250ZW50UmVjTG9hZGVkLCAnJywgZ3JvdXBTZXR0aW5ncyk7XG4gICAgYXBwZW5kUGFnZURhdGFQYXJhbXMoZXZlbnQsIHBhZ2VEYXRhKTtcbiAgICBwb3N0RXZlbnQoZXZlbnQpO1xufVxuXG5mdW5jdGlvbiBwb3N0Q29udGVudFJlY1Zpc2libGUocGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgZXZlbnQgPSBjcmVhdGVFdmVudChldmVudFR5cGVzLmNvbnRlbnRSZWNWaXNpYmxlLCAnJywgZ3JvdXBTZXR0aW5ncyk7XG4gICAgYXBwZW5kUGFnZURhdGFQYXJhbXMoZXZlbnQsIHBhZ2VEYXRhKTtcbiAgICBwb3N0RXZlbnQoZXZlbnQpO1xufVxuXG5mdW5jdGlvbiBwb3N0Q29udGVudFJlY0NsaWNrZWQocGFnZURhdGEsIHRhcmdldFVybCwgY29udGVudElkLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGV2ZW50ID0gY3JlYXRlRXZlbnQoZXZlbnRUeXBlcy5jb250ZW50UmVjQ2xpY2tlZCwgdGFyZ2V0VXJsLCBncm91cFNldHRpbmdzKTtcbiAgICBldmVudFthdHRyaWJ1dGVzLmNvbnRlbnRJZF0gPSBjb250ZW50SWQ7XG4gICAgYXBwZW5kUGFnZURhdGFQYXJhbXMoZXZlbnQsIHBhZ2VEYXRhKTtcbiAgICBwb3N0RXZlbnQoZXZlbnQsIHRydWUpO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVDb250ZW50UmVjQ2xpY2tlZEV2ZW50KHBhZ2VEYXRhLCB0YXJnZXRVcmwsIGNvbnRlbnRJZCwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBldmVudCA9IGNyZWF0ZUV2ZW50KGV2ZW50VHlwZXMuY29udGVudFJlY0NsaWNrZWQsIHRhcmdldFVybCwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5jb250ZW50SWRdID0gY29udGVudElkO1xuICAgIGFwcGVuZFBhZ2VEYXRhUGFyYW1zKGV2ZW50LCBwYWdlRGF0YSk7XG4gICAgcmV0dXJuIGV2ZW50O1xufVxuXG5mdW5jdGlvbiBwb3N0UmVhZE1vcmVMb2FkZWQocGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgZXZlbnQgPSBjcmVhdGVFdmVudChldmVudFR5cGVzLnJlYWRNb3JlTG9hZGVkLCAnJywgZ3JvdXBTZXR0aW5ncyk7XG4gICAgYXBwZW5kUGFnZURhdGFQYXJhbXMoZXZlbnQsIHBhZ2VEYXRhKTtcbiAgICBwb3N0RXZlbnQoZXZlbnQpO1xuXG4gICAgdmFyIGN1c3RvbUV2ZW50ID0gY3JlYXRlQ3VzdG9tRXZlbnQoZW1pdEV2ZW50VHlwZXMucmVhZE1vcmVMb2FkKTtcbiAgICBlbWl0RXZlbnQoY3VzdG9tRXZlbnQpO1xufVxuXG5mdW5jdGlvbiBwb3N0UmVhZE1vcmVWaXNpYmxlKHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGV2ZW50ID0gY3JlYXRlRXZlbnQoZXZlbnRUeXBlcy5yZWFkTW9yZVZpc2libGUsICcnLCBncm91cFNldHRpbmdzKTtcbiAgICBhcHBlbmRQYWdlRGF0YVBhcmFtcyhldmVudCwgcGFnZURhdGEpO1xuICAgIHBvc3RFdmVudChldmVudCk7XG5cbiAgICB2YXIgY3VzdG9tRXZlbnQgPSBjcmVhdGVDdXN0b21FdmVudChlbWl0RXZlbnRUeXBlcy5yZWFkTW9yZVZpZXcpO1xuICAgIGVtaXRFdmVudChjdXN0b21FdmVudCk7XG59XG5cbmZ1bmN0aW9uIHBvc3RSZWFkTW9yZUNsaWNrZWQocGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgZXZlbnQgPSBjcmVhdGVFdmVudChldmVudFR5cGVzLnJlYWRNb3JlQ2xpY2tlZCwgJycsIGdyb3VwU2V0dGluZ3MpO1xuICAgIGFwcGVuZFBhZ2VEYXRhUGFyYW1zKGV2ZW50LCBwYWdlRGF0YSk7XG4gICAgcG9zdEV2ZW50KGV2ZW50KTtcblxuICAgIHZhciBjdXN0b21FdmVudCA9IGNyZWF0ZUN1c3RvbUV2ZW50KGVtaXRFdmVudFR5cGVzLnJlYWRNb3JlQ2xpY2spO1xuICAgIGVtaXRFdmVudChjdXN0b21FdmVudCk7XG59XG5cbmZ1bmN0aW9uIHBvc3RGYWNlYm9va0xvZ2luU3RhcnQoZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBldmVudCA9IGNyZWF0ZUV2ZW50KGV2ZW50VHlwZXMuZmFjZWJvb2tMb2dpbkF0dGVtcHQsIGV2ZW50VmFsdWVzLnN0YXJ0LCBncm91cFNldHRpbmdzKTtcbiAgICBwb3N0RXZlbnQoZXZlbnQpO1xufVxuXG5mdW5jdGlvbiBwb3N0RmFjZWJvb2tMb2dpbkZhaWwoZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBldmVudCA9IGNyZWF0ZUV2ZW50KGV2ZW50VHlwZXMuZmFjZWJvb2tMb2dpbkF0dGVtcHQsIGV2ZW50VmFsdWVzLmZhaWwsIGdyb3VwU2V0dGluZ3MpO1xuICAgIHBvc3RFdmVudChldmVudCk7XG59XG5cbmZ1bmN0aW9uIHBvc3RBbnRlbm5hTG9naW5TdGFydChncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGV2ZW50ID0gY3JlYXRlRXZlbnQoZXZlbnRUeXBlcy5hbnRlbm5hTG9naW5BdHRlbXB0LCBldmVudFZhbHVlcy5zdGFydCwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgcG9zdEV2ZW50KGV2ZW50KTtcbn1cblxuZnVuY3Rpb24gcG9zdEFudGVubmFMb2dpbkZhaWwoZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBldmVudCA9IGNyZWF0ZUV2ZW50KGV2ZW50VHlwZXMuYW50ZW5uYUxvZ2luQXR0ZW1wdCwgZXZlbnRWYWx1ZXMuZmFpbCwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgcG9zdEV2ZW50KGV2ZW50KTtcbn1cblxuZnVuY3Rpb24gYXBwZW5kUGFnZURhdGFQYXJhbXMoZXZlbnQsIHBhZ2VEYXRhKSB7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5wYWdlSWRdID0gcGFnZURhdGEucGFnZUlkO1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMucGFnZVRpdGxlXSA9IHBhZ2VEYXRhLnRpdGxlO1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMuY2Fub25pY2FsVXJsXSA9IHBhZ2VEYXRhLmNhbm9uaWNhbFVybDtcbiAgICBldmVudFthdHRyaWJ1dGVzLnBhZ2VVcmxdID0gcGFnZURhdGEucmVxdWVzdGVkVXJsO1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMuYXJ0aWNsZUhlaWdodF0gPSAwIHx8IHBhZ2VEYXRhLm1ldHJpY3MuaGVpZ2h0O1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMucGFnZVRvcGljc10gPSBwYWdlRGF0YS50b3BpY3M7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5hdXRob3JdID0gcGFnZURhdGEuYXV0aG9yO1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMuc2l0ZVNlY3Rpb25dID0gcGFnZURhdGEuc2VjdGlvbjtcbn1cblxuZnVuY3Rpb24gYXBwZW5kQ29udGFpbmVyRGF0YVBhcmFtcyhldmVudCwgY29udGFpbmVyRGF0YSkge1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMuY29udGFpbmVySGFzaF0gPSBjb250YWluZXJEYXRhLmhhc2g7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5jb250YWluZXJLaW5kXSA9IGNvbnRhaW5lckRhdGEudHlwZTtcbn1cblxuZnVuY3Rpb24gYXBwZW5kUmVhY3Rpb25EYXRhUGFyYW1zKGV2ZW50LCByZWFjdGlvbkRhdGEpIHtcbiAgICBldmVudFthdHRyaWJ1dGVzLnJlYWN0aW9uQm9keV0gPSByZWFjdGlvbkRhdGEudGV4dDtcbiAgICBpZiAocmVhY3Rpb25EYXRhLmNvbnRlbnQpIHtcbiAgICAgICAgZXZlbnRbYXR0cmlidXRlcy5jb250ZW50TG9jYXRpb25dID0gcmVhY3Rpb25EYXRhLmNvbnRlbnQubG9jYXRpb247XG4gICAgICAgIGV2ZW50W2F0dHJpYnV0ZXMuY29udGVudElkXSA9IHJlYWN0aW9uRGF0YS5jb250ZW50LmlkO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gY3JlYXRlRXZlbnQoZXZlbnRUeXBlLCBldmVudFZhbHVlLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIHJlZmVycmVyRG9tYWluID0gZG9jdW1lbnQucmVmZXJyZXIuc3BsaXQoJy8nKS5zcGxpY2UoMikuam9pbignLycpOyAvLyBUT0RPOiBlbmdhZ2VfZnVsbCBjb2RlLiBSZXZpZXdcblxuICAgIHZhciBldmVudCA9IHt9O1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMuZXZlbnRUeXBlXSA9IGV2ZW50VHlwZTtcbiAgICBldmVudFthdHRyaWJ1dGVzLmV2ZW50VmFsdWVdID0gZXZlbnRWYWx1ZTtcbiAgICBldmVudFthdHRyaWJ1dGVzLmdyb3VwSWRdID0gZ3JvdXBTZXR0aW5ncy5ncm91cElkKCk7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5zaG9ydFRlcm1TZXNzaW9uXSA9IFNlc3Npb25EYXRhLmdldFNob3J0VGVybVNlc3Npb24oKTtcbiAgICBldmVudFthdHRyaWJ1dGVzLmxvbmdUZXJtU2Vzc2lvbl0gPSBTZXNzaW9uRGF0YS5nZXRMb25nVGVybVNlc3Npb24oKTtcbiAgICBldmVudFthdHRyaWJ1dGVzLnJlZmVycmVyVXJsXSA9IHJlZmVycmVyRG9tYWluO1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMuaXNUb3VjaEJyb3dzZXJdID0gQnJvd3Nlck1ldHJpY3Muc3VwcG9ydHNUb3VjaCgpO1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMuc2NyZWVuV2lkdGhdID0gc2NyZWVuLndpZHRoO1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMuc2NyZWVuSGVpZ2h0XSA9IHNjcmVlbi5oZWlnaHQ7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5waXhlbERlbnNpdHldID0gd2luZG93LmRldmljZVBpeGVsUmF0aW8gfHwgTWF0aC5yb3VuZCh3aW5kb3cuc2NyZWVuLmF2YWlsV2lkdGggLyBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50V2lkdGgpOyAvLyBUT0RPOiByZXZpZXcgdGhpcyBlbmdhZ2VfZnVsbCBjb2RlLCB3aGljaCBkb2Vzbid0IHNlZW0gY29ycmVjdFxuICAgIGV2ZW50W2F0dHJpYnV0ZXMudXNlckFnZW50XSA9IG5hdmlnYXRvci51c2VyQWdlbnQ7XG4gICAgdmFyIHNlZ21lbnQgPSBTZWdtZW50LmdldFNlZ21lbnQoZ3JvdXBTZXR0aW5ncyk7XG4gICAgaWYgKHNlZ21lbnQpIHtcbiAgICAgICAgZXZlbnRbYXR0cmlidXRlcy5jb250ZW50QXR0cmlidXRlc10gPSBzZWdtZW50O1xuICAgIH1cbiAgICByZXR1cm4gZXZlbnQ7XG59XG5cbmZ1bmN0aW9uIHBvc3RFdmVudChldmVudCwgc2VuZEFzVHJhY2tpbmdFdmVudCkge1xuICAgIHZhciB1c2VySW5mbyA9IFVzZXIuY2FjaGVkVXNlcigpOyAvLyBXZSBkb24ndCB3YW50IHRvIGNyZWF0ZSB1c2VycyBqdXN0IGZvciBldmVudHMgKGUuZy4gZXZlcnkgc2NyaXB0IGxvYWQpLCBidXQgYWRkIHVzZXIgaW5mbyBpZiB3ZSBoYXZlIGl0IGFscmVhZHkuXG4gICAgaWYgKHVzZXJJbmZvKSB7XG4gICAgICAgIGV2ZW50W2F0dHJpYnV0ZXMudXNlcklkXSA9IHVzZXJJbmZvLnVzZXJfaWQ7XG4gICAgfVxuICAgIGZpbGxJbk1pc3NpbmdQcm9wZXJ0aWVzKGV2ZW50KTtcbiAgICAvLyBTZW5kIHRoZSBldmVudCB0byBCaWdRdWVyeVxuICAgIGlmIChzZW5kQXNUcmFja2luZ0V2ZW50KSB7XG4gICAgICAgIEFqYXhDbGllbnQucG9zdFRyYWNraW5nRXZlbnQoZXZlbnQpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIEFqYXhDbGllbnQucG9zdEV2ZW50KGV2ZW50KTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUN1c3RvbUV2ZW50KGV2ZW50VHlwZSwgZXZlbnREZXRhaWwpIHtcbiAgICBldmVudERldGFpbCA9IGV2ZW50RGV0YWlsIHx8IHt9O1xuICAgIGV2ZW50RGV0YWlsLnVzZXJJZCA9IFNlc3Npb25EYXRhLmdldExvbmdUZXJtU2Vzc2lvbigpO1xuXG4gICAgdmFyIGN1c3RvbUV2ZW50O1xuICAgIGlmICh0eXBlb2Ygd2luZG93LkN1c3RvbUV2ZW50ID09PSBcImZ1bmN0aW9uXCIgKSB7XG4gICAgICAgIGN1c3RvbUV2ZW50ID0gbmV3IEN1c3RvbUV2ZW50KGV2ZW50VHlwZSwgeyBkZXRhaWw6IGV2ZW50RGV0YWlsIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIERlcHJlY2F0ZWQgQVBJIGZvciBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eSArIElFXG4gICAgICAgIGN1c3RvbUV2ZW50ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ0N1c3RvbUV2ZW50Jyk7XG4gICAgICAgIGN1c3RvbUV2ZW50LmluaXRDdXN0b21FdmVudChldmVudFR5cGUsIHRydWUsIHRydWUsIGV2ZW50RGV0YWlsKTtcbiAgICB9XG4gICAgTG9nZ2luZy5kZWJ1Z01lc3NhZ2UoJ0VtaXR0aW5nIGV2ZW50LiB0eXBlOiAnICsgZXZlbnRUeXBlICsgJyBkZXRhaWw6ICcgKyBKU09OLnN0cmluZ2lmeShldmVudERldGFpbCkpO1xuICAgIHJldHVybiBjdXN0b21FdmVudDtcbn1cblxuZnVuY3Rpb24gZW1pdEV2ZW50KGN1c3RvbUV2ZW50KSB7XG4gICAgZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChjdXN0b21FdmVudCk7XG59XG5cbi8vIEZpbGwgaW4gYW55IG9wdGlvbmFsIHByb3BlcnRpZXMgd2l0aCBudWxsIHZhbHVlcy5cbmZ1bmN0aW9uIGZpbGxJbk1pc3NpbmdQcm9wZXJ0aWVzKGV2ZW50KSB7XG4gICAgZm9yICh2YXIgYXR0ciBpbiBhdHRyaWJ1dGVzKSB7XG4gICAgICAgIGlmIChldmVudFthdHRyaWJ1dGVzW2F0dHJdXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBldmVudFthdHRyaWJ1dGVzW2F0dHJdXSA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbnZhciBhdHRyaWJ1dGVzID0ge1xuICAgIGV2ZW50VHlwZTogJ2V0JyxcbiAgICBldmVudFZhbHVlOiAnZXYnLFxuICAgIGdyb3VwSWQ6ICdnaWQnLFxuICAgIHVzZXJJZDogJ3VpZCcsXG4gICAgcGFnZUlkOiAncGlkJyxcbiAgICBsb25nVGVybVNlc3Npb246ICdsdHMnLFxuICAgIHNob3J0VGVybVNlc3Npb246ICdzdHMnLFxuICAgIHJlZmVycmVyVXJsOiAncmVmJyxcbiAgICBjb250ZW50SWQ6ICdjaWQnLFxuICAgIGFydGljbGVIZWlnaHQ6ICdhaCcsXG4gICAgY29udGFpbmVySGFzaDogJ2NoJyxcbiAgICBjb250YWluZXJLaW5kOiAnY2snLFxuICAgIHJlYWN0aW9uQm9keTogJ3InLFxuICAgIHBhZ2VUaXRsZTogJ3B0JyxcbiAgICBjYW5vbmljYWxVcmw6ICdjdScsXG4gICAgcGFnZVVybDogJ3B1JyxcbiAgICBjb250ZW50QXR0cmlidXRlczogJ2NhJyxcbiAgICBjb250ZW50TG9jYXRpb246ICdjbCcsXG4gICAgcGFnZVRvcGljczogJ3B0b3AnLFxuICAgIGF1dGhvcjogJ2EnLFxuICAgIHNpdGVTZWN0aW9uOiAnc2VjJyxcbiAgICBpc1RvdWNoQnJvd3NlcjogJ2l0JyxcbiAgICBzY3JlZW5XaWR0aDogJ3N3JyxcbiAgICBzY3JlZW5IZWlnaHQ6ICdzaCcsXG4gICAgcGl4ZWxEZW5zaXR5OiAncGQnLFxuICAgIHVzZXJBZ2VudDogJ3VhJ1xufTtcblxudmFyIGV2ZW50VHlwZXMgPSB7XG4gICAgc2NyaXB0TG9hZDogJ3NsJyxcbiAgICByZWFjdGlvblNoYXJlZDogJ3NoJyxcbiAgICBzdW1tYXJ5V2lkZ2V0OiAnc2InLFxuICAgIHJlYWN0aW9uV2lkZ2V0T3BlbmVkOiAncnMnLFxuICAgIHBhZ2VEYXRhTG9hZGVkOiAnd2wnLFxuICAgIGNvbW1lbnRDcmVhdGVkOiAnYycsXG4gICAgcmVhY3Rpb25DcmVhdGVkOiAncmUnLFxuICAgIGNvbW1lbnRzVmlld2VkOiAndmNvbScsXG4gICAgcmVjaXJjQ2xpY2tlZDogJ3JjJyxcbiAgICBjb250ZW50UmVjTG9hZGVkOiAnY3JsJyxcbiAgICBjb250ZW50UmVjVmlzaWJsZTogJ2NydicsXG4gICAgY29udGVudFJlY0NsaWNrZWQ6ICdjcmMnLFxuICAgIHJlYWRNb3JlTG9hZGVkOiAncm1sJyxcbiAgICByZWFkTW9yZVZpc2libGU6ICdybXYnLFxuICAgIHJlYWRNb3JlQ2xpY2tlZDogJ3JtYycsXG4gICAgZmFjZWJvb2tMb2dpbkF0dGVtcHQ6ICdsb2dpbiBhdHRlbXB0IGZhY2Vib29rJyxcbiAgICBhbnRlbm5hTG9naW5BdHRlbXB0OiAnbG9naW4gYXR0ZW1wdCBhbnRlbm5hJ1xufTtcblxudmFyIGV2ZW50VmFsdWVzID0ge1xuICAgIGNvbnRlbnRWaWV3ZWQ6ICd2YycsIC8vIHZpZXdfY29udGVudFxuICAgIGxvY2F0aW9uc1ZpZXdlZDogJ3ZyJywgLy8gdmlld19yZWFjdGlvbnNcbiAgICAvLyBzaG93RGVmYXVsdHM6ICd3cicsXG4gICAgLy8gc2hvd1JlYWN0aW9uczogJ3JkJyxcbiAgICBzaW5nbGVQYWdlOiAnc2knLFxuICAgIG11bHRpcGxlUGFnZXM6ICdtdScsXG4gICAgdmlld1JlYWN0aW9uczogJ3Z3JyxcbiAgICB2aWV3RGVmYXVsdHM6ICdhZCcsXG4gICAgc3RhcnQ6ICdzdGFydCcsXG4gICAgZmFpbDogJ2ZhaWwnXG59O1xuXG52YXIgZW1pdEV2ZW50VHlwZXMgPSB7XG4gICAgcmVhY3Rpb25WaWV3OiAnYW50ZW5uYS5yZWFjdGlvblZpZXcnLFxuICAgIHJlYWN0aW9uQ3JlYXRlOiAnYW50ZW5uYS5yZWFjdGlvbkNyZWF0ZScsXG4gICAgcmVhY3Rpb25TaGFyZTogJ2FudGVubmEucmVhY3Rpb25TaGFyZScsXG4gICAgY29udGVudFdpdGhSZWFjdGlvblZpZXc6ICdhbnRlbm5hLmNvbnRlbnRXaXRoUmVhY3Rpb25WaWV3JyxcbiAgICBjb250ZW50V2l0aFJlYWN0aW9uRmluZDogJ2FudGVubmEuY29udGVudFdpdGhSZWFjdGlvbkZpbmQnLFxuICAgIGNvbW1lbnRWaWV3OiAnYW50ZW5uYS5jb21tZW50VmlldycsXG4gICAgY29tbWVudENyZWF0ZTogJ2FudGVubmEuY29tbWVudENyZWF0ZScsXG4gICAgcmVhZE1vcmVMb2FkOiAnYW50ZW5uYS5yZWFkTW9yZUxvYWQnLFxuICAgIHJlYWRNb3JlVmlldzogJ2FudGVubmEucmVhZE1vcmVWaWV3JyxcbiAgICByZWFkTW9yZUNsaWNrOiAnYW50ZW5uYS5yZWFkTW9yZUNsaWNrJ1xufTtcblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHBvc3RHcm91cFNldHRpbmdzTG9hZGVkOiBwb3N0R3JvdXBTZXR0aW5nc0xvYWRlZCxcbiAgICBwb3N0UGFnZURhdGFMb2FkZWQ6IHBvc3RQYWdlRGF0YUxvYWRlZCxcbiAgICBwb3N0U3VtbWFyeU9wZW5lZDogcG9zdFN1bW1hcnlPcGVuZWQsXG4gICAgcG9zdENvbW1lbnRzVmlld2VkOiBwb3N0Q29tbWVudHNWaWV3ZWQsXG4gICAgcG9zdENvbW1lbnRDcmVhdGVkOiBwb3N0Q29tbWVudENyZWF0ZWQsXG4gICAgcG9zdFJlYWN0aW9uV2lkZ2V0T3BlbmVkOiBwb3N0UmVhY3Rpb25XaWRnZXRPcGVuZWQsXG4gICAgcG9zdFJlYWN0aW9uQ3JlYXRlZDogcG9zdFJlYWN0aW9uQ3JlYXRlZCxcbiAgICBwb3N0UmVhY3Rpb25TaGFyZWQ6IHBvc3RSZWFjdGlvblNoYXJlZCxcbiAgICBwb3N0TG9jYXRpb25zVmlld2VkOiBwb3N0TG9jYXRpb25zVmlld2VkLFxuICAgIHBvc3RDb250ZW50Vmlld2VkOiBwb3N0Q29udGVudFZpZXdlZCxcbiAgICBwb3N0TGVnYWN5UmVjaXJjQ2xpY2tlZDogcG9zdExlZ2FjeVJlY2lyY0NsaWNrZWQsXG4gICAgcG9zdENvbnRlbnRSZWNMb2FkZWQ6IHBvc3RDb250ZW50UmVjTG9hZGVkLFxuICAgIHBvc3RDb250ZW50UmVjVmlzaWJsZTogcG9zdENvbnRlbnRSZWNWaXNpYmxlLFxuICAgIHBvc3RDb250ZW50UmVjQ2xpY2tlZDogcG9zdENvbnRlbnRSZWNDbGlja2VkLFxuICAgIGNyZWF0ZUNvbnRlbnRSZWNDbGlja2VkRXZlbnQ6IGNyZWF0ZUNvbnRlbnRSZWNDbGlja2VkRXZlbnQsXG4gICAgcG9zdFJlYWRNb3JlTG9hZGVkOiBwb3N0UmVhZE1vcmVMb2FkZWQsXG4gICAgcG9zdFJlYWRNb3JlVmlzaWJsZTogcG9zdFJlYWRNb3JlVmlzaWJsZSxcbiAgICBwb3N0UmVhZE1vcmVDbGlja2VkOiBwb3N0UmVhZE1vcmVDbGlja2VkLFxuICAgIHBvc3RGYWNlYm9va0xvZ2luU3RhcnQ6IHBvc3RGYWNlYm9va0xvZ2luU3RhcnQsXG4gICAgcG9zdEZhY2Vib29rTG9naW5GYWlsOiBwb3N0RmFjZWJvb2tMb2dpbkZhaWwsXG4gICAgcG9zdEFudGVubmFMb2dpblN0YXJ0OiBwb3N0QW50ZW5uYUxvZ2luU3RhcnQsXG4gICAgcG9zdEFudGVubmFMb2dpbkZhaWw6IHBvc3RBbnRlbm5hTG9naW5GYWlsXG59O1xuIiwidmFyIFJhY3RpdmU7IHJlcXVpcmUoJy4vdXRpbHMvcmFjdGl2ZS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihsb2FkZWRSYWN0aXZlKSB7IFJhY3RpdmUgPSBsb2FkZWRSYWN0aXZlO30pO1xudmFyIFNWR3MgPSByZXF1aXJlKCcuL3N2Z3MnKTtcblxudmFyIHBhZ2VTZWxlY3RvciA9ICcuYW50ZW5uYS1lcnJvci1wYWdlJztcblxuZnVuY3Rpb24gY3JlYXRlUGFnZShvcHRpb25zKSB7XG4gICAgdmFyIGVsZW1lbnQgPSBvcHRpb25zLmVsZW1lbnQ7XG4gICAgdmFyIGdvQmFjayA9IG9wdGlvbnMuZ29CYWNrO1xuICAgIHZhciByYWN0aXZlID0gUmFjdGl2ZSh7XG4gICAgICAgIGVsOiBlbGVtZW50LFxuICAgICAgICBhcHBlbmQ6IHRydWUsXG4gICAgICAgIGRhdGE6IHt9LFxuICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL2dlbmVyaWMtZXJyb3ItcGFnZS5oYnMuaHRtbCcpLFxuICAgICAgICBwYXJ0aWFsczoge1xuICAgICAgICAgICAgbGVmdDogU1ZHcy5sZWZ0XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByYWN0aXZlLm9uKCdiYWNrJywgZ29CYWNrKTtcbiAgICByZXR1cm4ge1xuICAgICAgICBzZWxlY3RvcjogcGFnZVNlbGVjdG9yLFxuICAgICAgICB0ZWFyZG93bjogZnVuY3Rpb24oKSB7IHJhY3RpdmUudGVhcmRvd24oKTsgfVxuICAgIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZVBhZ2U6IGNyZWF0ZVBhZ2Vcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgQWpheENsaWVudCA9IHJlcXVpcmUoJy4vdXRpbHMvYWpheC1jbGllbnQnKTtcbnZhciBVUkxzID0gcmVxdWlyZSgnLi91dGlscy91cmxzJyk7XG52YXIgR3JvdXBTZXR0aW5ncyA9IHJlcXVpcmUoJy4vZ3JvdXAtc2V0dGluZ3MnKTtcblxuLy8gVE9ETyBmb2xkIHRoaXMgbW9kdWxlIGludG8gZ3JvdXAtc2V0dGluZ3M/XG5cbmZ1bmN0aW9uIGxvYWRTZXR0aW5ncyhjYWxsYmFjaykge1xuICAgIEFqYXhDbGllbnQuZ2V0SlNPTlAoVVJMcy5ncm91cFNldHRpbmdzVXJsKCksIHsgaG9zdF9uYW1lOiB3aW5kb3cuYW50ZW5uYV9ob3N0IH0sIHN1Y2Nlc3MsIGVycm9yKTtcblxuICAgIGZ1bmN0aW9uIHN1Y2Nlc3MoanNvbikge1xuICAgICAgICB2YXIgZ3JvdXBTZXR0aW5ncyA9IEdyb3VwU2V0dGluZ3MuY3JlYXRlKGpzb24pO1xuICAgICAgICBjYWxsYmFjayhncm91cFNldHRpbmdzKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBlcnJvcihtZXNzYWdlKSB7XG4gICAgICAgIC8vIFRPRE8gaGFuZGxlIGVycm9ycyB0aGF0IGhhcHBlbiB3aGVuIGxvYWRpbmcgY29uZmlnIGRhdGFcbiAgICAgICAgY29uc29sZS5sb2coJ0FuIGVycm9yIG9jY3VycmVkIGxvYWRpbmcgZ3JvdXAgc2V0dGluZ3M6ICcgKyBtZXNzYWdlKTtcbiAgICB9XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBsb2FkOiBsb2FkU2V0dGluZ3Ncbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG5cbnZhciBFdmVudHMgPSByZXF1aXJlKCcuL2V2ZW50cycpO1xuXG52YXIgZ3JvdXBTZXR0aW5ncztcblxuLy8gVE9ETzogVXBkYXRlIGFsbCBjbGllbnRzIHRoYXQgYXJlIHBhc3NpbmcgYXJvdW5kIGEgZ3JvdXBTZXR0aW5ncyBvYmplY3QgdG8gaW5zdGVhZCBhY2Nlc3MgdGhlICdnbG9iYWwnIHNldHRpbmdzIGluc3RhbmNlXG5mdW5jdGlvbiBnZXRHcm91cFNldHRpbmdzKCkge1xuICAgIHJldHVybiBncm91cFNldHRpbmdzO1xufVxuXG5mdW5jdGlvbiB1cGRhdGVGcm9tSlNPTihqc29uKSB7XG4gICAgZ3JvdXBTZXR0aW5ncyA9IGNyZWF0ZUZyb21KU09OKGpzb24pO1xuICAgIEV2ZW50cy5wb3N0R3JvdXBTZXR0aW5nc0xvYWRlZChncm91cFNldHRpbmdzKTtcbiAgICByZXR1cm4gZ3JvdXBTZXR0aW5ncztcbn1cblxudmFyIGRlZmF1bHRzID0ge1xuICAgIGFjdGl2ZV9zZWN0aW9uczogXCJib2R5XCIsXG4gICAgYW5ub193aGl0ZWxpc3Q6IFwicFwiLFxuICAgIG5vX2FudDogXCJcIixcbiAgICBjdXN0b21fY3NzOiBcIlwiLFxuICAgIHBhcmFncmFwaF9oZWxwZXI6IHRydWUsXG4gICAgbWVkaWFfdXJsX2lnbm9yZV9xdWVyeTogdHJ1ZSxcbiAgICBzdW1tYXJ5X3dpZGdldF9zZWxlY3RvcjogJy5hbnQtcGFnZS1zdW1tYXJ5JywgLy8gVE9ETzogdGhpcyB3YXNuJ3QgZGVmaW5lZCBhcyBhIGRlZmF1bHQgaW4gZW5nYWdlX2Z1bGwsIGJ1dCB3YXMgaW4gY29kZS4gd2h5P1xuICAgIHN1bW1hcnlfd2lkZ2V0X21ldGhvZDogJ2FmdGVyJyxcbiAgICBsYW5ndWFnZTogJ2VuJyxcbiAgICBpbWdfaW5kaWNhdG9yX3Nob3dfb25sb2FkOiB0cnVlLFxuICAgIGltZ19pbmRpY2F0b3Jfc2hvd19zaWRlOiAnbGVmdCcsXG4gICAgdGFnX2JveF9iZ19jb2xvcnM6ICcnLFxuICAgIHRhZ19ib3hfdGV4dF9jb2xvcnM6ICcnLFxuICAgIHRhZ19ib3hfZm9udF9mYW1pbHk6ICdIZWx2ZXRpY2FOZXVlLEhlbHZldGljYSxBcmlhbCxzYW5zLXNlcmlmJyxcbiAgICB0YWdzX2JnX2NzczogJycsXG4gICAgaWdub3JlX3N1YmRvbWFpbjogZmFsc2UsXG4gICAgaW1hZ2Vfc2VsZWN0b3I6ICdtZXRhW3Byb3BlcnR5PVwib2c6aW1hZ2VcIl0nLCAvLyBUT0RPOiByZXZpZXcgd2hhdCB0aGlzIHNob3VsZCBiZSAobm90IGZyb20gZW5nYWdlX2Z1bGwpXG4gICAgaW1hZ2VfYXR0cmlidXRlOiAnY29udGVudCcsIC8vIFRPRE86IHJldmlldyB3aGF0IHRoaXMgc2hvdWxkIGJlIChub3QgZnJvbSBlbmdhZ2VfZnVsbCksXG4gICAgcXVlcnlzdHJpbmdfY29udGVudDogZmFsc2UsXG4gICAgaW5pdGlhbF9waW5fbGltaXQ6IDNcbn07XG5cbmZ1bmN0aW9uIGNyZWF0ZUZyb21KU09OKGpzb24pIHtcblxuICAgIGZ1bmN0aW9uIGRhdGEoa2V5LCBpZkFic2VudCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgdmFsdWU7XG4gICAgICAgICAgICBpZiAod2luZG93LmFudGVubmFfZXh0ZW5kKSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSB3aW5kb3cuYW50ZW5uYV9leHRlbmRba2V5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IGpzb25ba2V5XTtcbiAgICAgICAgICAgICAgICAvLyBUT0RPOiBvdXIgc2VydmVyIGFwcGFyZW50bHkgc2VuZHMgYmFjayBudWxsIGFzIGEgdmFsdWUgZm9yIHNvbWUgYXR0cmlidXRlcy5cbiAgICAgICAgICAgICAgICAvLyBUT0RPOiBjb25zaWRlciBjaGVja2luZyBmb3IgbnVsbCB3aGVyZXZlciB3ZSdyZSBjaGVja2luZyBmb3IgdW5kZWZpbmVkXG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09ICcnIHx8IHZhbHVlID09PSBudWxsKSB7IC8vIFRPRE86IFNob3VsZCB0aGUgc2VydmVyIGJlIHNlbmRpbmcgYmFjayAnJyBoZXJlIG9yIG5vdGhpbmcgYXQgYWxsPyAoSXQgcHJlY2x1ZGVzIHRoZSBzZXJ2ZXIgZnJvbSByZWFsbHkgc2F5aW5nICdub3RoaW5nJylcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBkZWZhdWx0c1trZXldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaWZBYnNlbnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZXhjbHVzaW9uU2VsZWN0b3Ioa2V5LCBkZXByZWNhdGVkS2V5KSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBzZWxlY3RvcnMgPSBbXTtcbiAgICAgICAgICAgIHZhciBub0FudCA9IGRhdGEoJ25vX2FudCcpKCk7XG4gICAgICAgICAgICBpZiAobm9BbnQpIHtcbiAgICAgICAgICAgICAgICBzZWxlY3RvcnMucHVzaChub0FudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgbm9SZWFkciA9IGRhdGEoJ25vX3JlYWRyJykoKTtcbiAgICAgICAgICAgIGlmIChub1JlYWRyKSB7XG4gICAgICAgICAgICAgICAgc2VsZWN0b3JzLnB1c2gobm9SZWFkcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gc2VsZWN0b3JzLmpvaW4oJywnKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGJhY2tncm91bmRDb2xvcihhY2Nlc3Nvcikge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgY29sb3JzID0gW107XG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBhY2Nlc3NvcigpO1xuICAgICAgICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgY29sb3JzID0gdmFsdWUuc3BsaXQoJzsnKTtcbiAgICAgICAgICAgICAgICBjb2xvcnMgPSBtaWdyYXRlVmFsdWVzKGNvbG9ycyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gY29sb3JzO1xuXG4gICAgICAgICAgICAvLyBNaWdyYXRlIGFueSBjb2xvcnMgZnJvbSB0aGUgJzEsIDIsIDMnIGZvcm1hdCB0byAncmdiKDEsIDIsIDMpJy4gVGhpcyBjb2RlIGNhbiBiZSBkZWxldGVkIG9uY2Ugd2UndmUgdXBkYXRlZFxuICAgICAgICAgICAgLy8gYWxsIHNpdGVzIHRvIHNwZWNpZnlpbmcgdmFsaWQgQ1NTIGNvbG9yIHZhbHVlc1xuICAgICAgICAgICAgZnVuY3Rpb24gbWlncmF0ZVZhbHVlcyhjb2xvclZhbHVlcykge1xuICAgICAgICAgICAgICAgIHZhciBtaWdyYXRpb25NYXRjaGVyID0gL15cXHMqXFxkK1xccyosXFxzKlxcZCtcXHMqLFxccypcXGQrXFxzKiQvZ2ltO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY29sb3JWYWx1ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gY29sb3JWYWx1ZXNbaV07XG4gICAgICAgICAgICAgICAgICAgIGlmIChtaWdyYXRpb25NYXRjaGVyLnRlc3QodmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xvclZhbHVlc1tpXSA9ICdyZ2IoJyArIHZhbHVlICsgJyknO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBjb2xvclZhbHVlcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRlZmF1bHRSZWFjdGlvbnMoJGVsZW1lbnQpIHtcbiAgICAgICAgLy8gRGVmYXVsdCByZWFjdGlvbnMgYXJlIGF2YWlsYWJsZSBpbiB0aHJlZSBsb2NhdGlvbnMgaW4gdGhyZWUgZGF0YSBmb3JtYXRzOlxuICAgICAgICAvLyAxLiBBcyBhIGNvbW1hLXNlcGFyYXRlZCBhdHRyaWJ1dGUgdmFsdWUgb24gYSBwYXJ0aWN1bGFyIGVsZW1lbnRcbiAgICAgICAgLy8gMi4gQXMgYW4gYXJyYXkgb2Ygc3RyaW5ncyBvbiB0aGUgd2luZG93LmFudGVubmFfZXh0ZW5kIHByb3BlcnR5XG4gICAgICAgIC8vIDMuIEFzIGEganNvbiBvYmplY3Qgd2l0aCBhIGJvZHkgYW5kIGlkIG9uIHRoZSBncm91cCBzZXR0aW5nc1xuICAgICAgICB2YXIgcmVhY3Rpb25zID0gW107XG4gICAgICAgIHZhciByZWFjdGlvblN0cmluZ3M7XG4gICAgICAgIHZhciBlbGVtZW50UmVhY3Rpb25zID0gJGVsZW1lbnQgPyAkZWxlbWVudC5hdHRyKCdhbnQtcmVhY3Rpb25zJykgOiB1bmRlZmluZWQ7XG4gICAgICAgIGlmIChlbGVtZW50UmVhY3Rpb25zKSB7XG4gICAgICAgICAgICByZWFjdGlvblN0cmluZ3MgPSBlbGVtZW50UmVhY3Rpb25zLnNwbGl0KCc7Jyk7XG4gICAgICAgIH0gZWxzZSBpZiAod2luZG93LmFudGVubmFfZXh0ZW5kKSB7XG4gICAgICAgICAgICByZWFjdGlvblN0cmluZ3MgPSB3aW5kb3cuYW50ZW5uYV9leHRlbmRbJ2RlZmF1bHRfcmVhY3Rpb25zJ107XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJlYWN0aW9uU3RyaW5ncykge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZWFjdGlvblN0cmluZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICByZWFjdGlvbnMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIHRleHQ6IHJlYWN0aW9uU3RyaW5nc1tpXSxcbiAgICAgICAgICAgICAgICAgICAgaXNEZWZhdWx0OiB0cnVlXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciB2YWx1ZXMgPSBqc29uWydkZWZhdWx0X3JlYWN0aW9ucyddO1xuICAgICAgICAgICAgaWYgKHZhbHVlcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCB2YWx1ZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gdmFsdWVzW2pdO1xuICAgICAgICAgICAgICAgICAgICByZWFjdGlvbnMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiB2YWx1ZS5ib2R5LFxuICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IHZhbHVlLmlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgaXNEZWZhdWx0OiB0cnVlXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVhY3Rpb25zO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNvbXB1dGVDdXN0b21DU1MoKSB7XG4gICAgICAgIC8vIEZpcnN0IHJlYWQgYW55IHJhdyBjdXN0b20gQ1NTLlxuICAgICAgICB2YXIgY3VzdG9tQ1NTID0gZGF0YSgnY3VzdG9tX2NzcycpKCk7XG4gICAgICAgIC8vIFRoZW4gYXBwZW5kIHJ1bGVzIGZvciBhbnkgc3BlY2lmaWMgQ1NTIG92ZXJyaWRlcy5cbiAgICAgICAgY3VzdG9tQ1NTICs9IGNyZWF0ZUN1c3RvbUNTU1J1bGUobWlncmF0ZVJlYWN0aW9uc0JhY2tncm91bmRDb2xvclNldHRpbmdzKGRhdGEoJ3RhZ3NfYmdfY3NzJywgJycpKSwgJy5hbnRlbm5hLXJlYWN0aW9ucy1wYWdlIC5hbnRlbm5hLWJvZHknKTtcbiAgICAgICAgY3VzdG9tQ1NTICs9IGNyZWF0ZUN1c3RvbUNTU1J1bGUoZGF0YSgndGFnX2JveF9iZ19jb2xvcnMnLCAnJyksICcuYW50ZW5uYS1yZWFjdGlvbi1ib3gnKTtcbiAgICAgICAgY3VzdG9tQ1NTICs9IGNyZWF0ZUN1c3RvbUNTU1J1bGUoZGF0YSgndGFnX2JveF9iZ19jb2xvcnNfaG92ZXInLCAnJyksICcuYW50ZW5uYS1yZWFjdGlvbjpob3ZlciA+IC5hbnRlbm5hLXJlYWN0aW9uLWJveCcpO1xuICAgICAgICBjdXN0b21DU1MgKz0gY3JlYXRlQ3VzdG9tQ1NTUnVsZShtaWdyYXRlVGV4dENvbG9yU2V0dGluZ3MoZGF0YSgndGFnX2JveF90ZXh0X2NvbG9ycycsICcnKSksICcuYW50ZW5uYS1yZWFjdGlvbi1ib3gsIC5hbnRlbm5hLXJlYWN0aW9uLWNvbW1lbnRzIC5hbnRlbm5hLWNvbW1lbnRzLXBhdGgsIC5hbnRlbm5hLXJlYWN0aW9uLWxvY2F0aW9uIC5hbnRlbm5hLWxvY2F0aW9uLXBhdGgnKTtcbiAgICAgICAgY3VzdG9tQ1NTICs9IGNyZWF0ZUN1c3RvbUNTU1J1bGUobWlncmF0ZUZvbnRGYW1pbHlTZXR0aW5nKGRhdGEoJ3RhZ19ib3hfZm9udF9mYW1pbHknLCAnJykpLCAnLmFudGVubmEtcmVhY3Rpb24tYm94IC5hbnRlbm5hLXJlc2V0Jyk7XG4gICAgICAgIHJldHVybiBjdXN0b21DU1M7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY3JlYXRlQ3VzdG9tQ1NTUnVsZShkZWNsYXJhdGlvbnNBY2Nlc3Nvciwgc2VsZWN0b3IpIHtcbiAgICAgICAgdmFyIGRlY2xhcmF0aW9ucyA9IGRlY2xhcmF0aW9uc0FjY2Vzc29yKCkudHJpbSgpO1xuICAgICAgICBpZiAoZGVjbGFyYXRpb25zKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1xcbicgKyBzZWxlY3RvciArICcge1xcbiAgICAnICsgZGVjbGFyYXRpb25zICsgJ1xcbn0nO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnJztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtaWdyYXRlUmVhY3Rpb25zQmFja2dyb3VuZENvbG9yU2V0dGluZ3MoYmFja2dyb3VuZENvbG9yQWNjZXNzb3IpIHtcbiAgICAgICAgLy8gVE9ETzogVGhpcyBpcyB0ZW1wb3JhcnkgY29kZSB0aGF0IG1pZ3JhdGVzIHRoZSBjdXJyZW50IHRhZ3NfYmdfY3NzIHNldHRpbmcgZnJvbSBhIHJhdyB2YWx1ZSB0byBhXG4gICAgICAgIC8vICAgICAgIENTUyBkZWNsYXJhdGlvbi4gV2Ugc2hvdWxkIG1pZ3JhdGUgYWxsIGRlcGxveWVkIHNpdGVzIHRvIHVzZSBhIENTUyBkZWNsYXJhdGlvbiBhbmQgdGhlbiByZW1vdmUgdGhpcy5cbiAgICAgICAgdmFyIGJhY2tncm91bmRDb2xvciA9IGJhY2tncm91bmRDb2xvckFjY2Vzc29yKCkudHJpbSgpO1xuICAgICAgICBpZiAoYmFja2dyb3VuZENvbG9yICYmIGJhY2tncm91bmRDb2xvci5pbmRleE9mKCdiYWNrZ3JvdW5kJykgPT09IC0xKSB7XG4gICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3IgPSAnYmFja2dyb3VuZC1pbWFnZTogJyArIGJhY2tncm91bmRDb2xvcjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gYmFja2dyb3VuZENvbG9yO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWlncmF0ZUZvbnRGYW1pbHlTZXR0aW5nKGZvbnRGYW1pbHlBY2Nlc3Nvcikge1xuICAgICAgICAvLyBUT0RPOiBUaGlzIGlzIHRlbXBvcmFyeSBjb2RlIHRoYXQgbWlncmF0ZXMgdGhlIGN1cnJlbnQgdGFnX2JveF9mb250X2ZhbWlseSBzZXR0aW5nIGZyb20gYSByYXcgdmFsdWUgdG8gYVxuICAgICAgICAvLyAgICAgICBDU1MgZGVjbGFyYXRpb24uIFdlIHNob3VsZCBtaWdyYXRlIGFsbCBkZXBsb3llZCBzaXRlcyB0byB1c2UgYSBDU1MgZGVjbGFyYXRpb24gYW5kIHRoZW4gcmVtb3ZlIHRoaXMuXG4gICAgICAgIHZhciBmb250RmFtaWx5ID0gZm9udEZhbWlseUFjY2Vzc29yKCkudHJpbSgpO1xuICAgICAgICBpZiAoZm9udEZhbWlseSAmJiBmb250RmFtaWx5LmluZGV4T2YoJ2ZvbnQtZmFtaWx5JykgPT09IC0xKSB7XG4gICAgICAgICAgICBmb250RmFtaWx5ID0gJ2ZvbnQtZmFtaWx5OiAnICsgZm9udEZhbWlseTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gZm9udEZhbWlseTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1pZ3JhdGVUZXh0Q29sb3JTZXR0aW5ncyh0ZXh0Q29sb3JBY2Nlc3Nvcikge1xuICAgICAgICAvLyBUT0RPOiBUaGlzIGlzIHRlbXBvcmFyeSBjb2RlIHRoYXQgbWlncmF0ZXMgdGhlIGN1cnJlbnQgdGFnX2JveF90ZXh0X2NvbG9ycyBwcm9wZXJ0eSwgd2hpY2ggaXMgYSBkZWNsYXJhdGlvblxuICAgICAgICAvLyAgICAgICB0aGF0IG9ubHkgc2V0cyB0aGUgY29sb3IgcHJvcGVydHksIHRvIHNldCBib3RoIHRoZSBjb2xvciBhbmQgZmlsbCBwcm9wZXJ0aWVzLlxuICAgICAgICB2YXIgdGV4dENvbG9yID0gdGV4dENvbG9yQWNjZXNzb3IoKS50cmltKCk7XG4gICAgICAgIGlmICh0ZXh0Q29sb3IgJiYgdGV4dENvbG9yLmluZGV4T2YoJ2NvbG9yOicpID09PSAwICYmIHRleHRDb2xvci5pbmRleE9mKCdmaWxsOicpID09PSAtMSkge1xuICAgICAgICAgICAgdGV4dENvbG9yICs9IHRleHRDb2xvclt0ZXh0Q29sb3IubGVuZ3RoIC0gMV0gPT0gJzsnID8gJycgOiAnOyc7IC8vIGFwcGVuZCBhIHNlbWljb2xvbiBpZiBuZWVkZWRcbiAgICAgICAgICAgIHRleHRDb2xvciArPSB0ZXh0Q29sb3IucmVwbGFjZSgnY29sb3I6JywgJ1xcbiAgICBmaWxsOicpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiB0ZXh0Q29sb3I7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBsZWdhY3lCZWhhdmlvcjogZGF0YSgnbGVnYWN5X2JlaGF2aW9yJywgZmFsc2UpLCAvLyBUT0RPOiBtYWtlIHRoaXMgcmVhbCBpbiB0aGUgc2Vuc2UgdGhhdCBpdCBjb21lcyBiYWNrIGZyb20gdGhlIHNlcnZlciBhbmQgcHJvYmFibHkgbW92ZSB0aGUgZmxhZyB0byB0aGUgcGFnZSBkYXRhLiBVbmxpa2VseSB0aGF0IHdlIG5lZWQgdG8gbWFpbnRhaW4gbGVnYWN5IGJlaGF2aW9yIGZvciBuZXcgcGFnZXM/XG4gICAgICAgIGdyb3VwSWQ6IGRhdGEoJ2lkJyksXG4gICAgICAgIGdyb3VwTmFtZTogZGF0YSgnbmFtZScpLFxuICAgICAgICBhY3RpdmVTZWN0aW9uczogZGF0YSgnYWN0aXZlX3NlY3Rpb25zJyksXG4gICAgICAgIHVybDoge1xuICAgICAgICAgICAgaWdub3JlU3ViZG9tYWluOiBkYXRhKCdpZ25vcmVfc3ViZG9tYWluJyksXG4gICAgICAgICAgICBpbmNsdWRlUXVlcnlTdHJpbmc6IGRhdGEoJ3F1ZXJ5c3RyaW5nX2NvbnRlbnQnKSxcbiAgICAgICAgICAgIGlnbm9yZU1lZGlhVXJsUXVlcnk6IGRhdGEoJ21lZGlhX3VybF9pZ25vcmVfcXVlcnknKSxcbiAgICAgICAgICAgIGNhbm9uaWNhbERvbWFpbjogZGF0YSgncGFnZV90bGQnKSAvLyBUT0RPOiB3aGF0IHRvIGNhbGwgdGhpcyBleGFjdGx5LiBncm91cERvbWFpbj8gc2l0ZURvbWFpbj8gY2Fub25pY2FsRG9tYWluP1xuICAgICAgICB9LFxuICAgICAgICBzdW1tYXJ5U2VsZWN0b3I6IGRhdGEoJ3N1bW1hcnlfd2lkZ2V0X3NlbGVjdG9yJyksXG4gICAgICAgIHN1bW1hcnlNZXRob2Q6IGRhdGEoJ3N1bW1hcnlfd2lkZ2V0X21ldGhvZCcpLFxuICAgICAgICBpc0hpZGVPbk1vYmlsZTogZGF0YSgnaGlkZU9uTW9iaWxlJyksXG4gICAgICAgIGlzRXhwYW5kZWRNb2JpbGVTdW1tYXJ5OiBkYXRhKCdzdW1tYXJ5X3dpZGdldF9leHBhbmRlZF9tb2JpbGUnKSxcbiAgICAgICAgaXNIaWRlVGFwSGVscGVyOiBkYXRhKCdoaWRlRG91YmxlVGFwTWVzc2FnZScpLFxuICAgICAgICB0YXBIZWxwZXJQb3NpdGlvbjogZGF0YSgnZG91YmxlVGFwTWVzc2FnZVBvc2l0aW9uJyksXG4gICAgICAgIHBhZ2VTZWxlY3RvcjogZGF0YSgncG9zdF9zZWxlY3RvcicpLFxuICAgICAgICBwYWdlVXJsU2VsZWN0b3I6IGRhdGEoJ3Bvc3RfaHJlZl9zZWxlY3RvcicpLFxuICAgICAgICBwYWdlVXJsQXR0cmlidXRlOiBkYXRhKCdwb3N0X2hyZWZfYXR0cmlidXRlJywgJ2hyZWYnKSxcbiAgICAgICAgcGFnZVRpdGxlU2VsZWN0b3I6IGRhdGEoJ3Bvc3RfdGl0bGVfc2VsZWN0b3InKSxcbiAgICAgICAgcGFnZUltYWdlU2VsZWN0b3I6IGRhdGEoJ2ltYWdlX3NlbGVjdG9yJyksXG4gICAgICAgIHBhZ2VJbWFnZUF0dHJpYnV0ZTogZGF0YSgnaW1hZ2VfYXR0cmlidXRlJyksXG4gICAgICAgIHBhZ2VBdXRob3JTZWxlY3RvcjogZGF0YSgnYXV0aG9yX3NlbGVjdG9yJyksXG4gICAgICAgIHBhZ2VBdXRob3JBdHRyaWJ1dGU6IGRhdGEoJ2F1dGhvcl9hdHRyaWJ1dGUnKSxcbiAgICAgICAgcGFnZVRvcGljc1NlbGVjdG9yOiBkYXRhKCd0b3BpY3Nfc2VsZWN0b3InKSxcbiAgICAgICAgcGFnZVRvcGljc0F0dHJpYnV0ZTogZGF0YSgndG9waWNzX2F0dHJpYnV0ZScpLFxuICAgICAgICBwYWdlU2l0ZVNlY3Rpb25TZWxlY3RvcjogZGF0YSgnc2VjdGlvbl9zZWxlY3RvcicpLFxuICAgICAgICBwYWdlU2l0ZVNlY3Rpb25BdHRyaWJ1dGU6IGRhdGEoJ3NlY3Rpb25fYXR0cmlidXRlJyksXG4gICAgICAgIGNvbnRlbnRTZWxlY3RvcjogZGF0YSgnYW5ub193aGl0ZWxpc3QnKSxcbiAgICAgICAgdGV4dEluZGljYXRvckxpbWl0OiBkYXRhKCdpbml0aWFsX3Bpbl9saW1pdCcpLFxuICAgICAgICBlbmFibGVUZXh0SGVscGVyOiBkYXRhKCdwYXJhZ3JhcGhfaGVscGVyJyksXG4gICAgICAgIG1lZGlhSW5kaWNhdG9yQ29ybmVyOiBkYXRhKCdpbWdfaW5kaWNhdG9yX3Nob3dfc2lkZScpLFxuICAgICAgICBnZW5lcmF0ZWRDdGFTZWxlY3RvcjogZGF0YSgnc2VwYXJhdGVfY3RhJyksXG4gICAgICAgIGdlbmVyYXRlZEN0YUV4cGFuZGVkOiBkYXRhKCdzZXBhcmF0ZV9jdGFfZXhwYW5kZWQnKSxcbiAgICAgICAgcmVxdWlyZXNBcHByb3ZhbDogZGF0YSgncmVxdWlyZXNfYXBwcm92YWwnKSxcbiAgICAgICAgZGVmYXVsdFJlYWN0aW9uczogZGVmYXVsdFJlYWN0aW9ucyxcbiAgICAgICAgY3VzdG9tQ1NTOiBjb21wdXRlQ3VzdG9tQ1NTLFxuICAgICAgICBleGNsdXNpb25TZWxlY3RvcjogZXhjbHVzaW9uU2VsZWN0b3IoKSxcbiAgICAgICAgbGFuZ3VhZ2U6IGRhdGEoJ2xhbmd1YWdlJyksXG4gICAgICAgIHR3aXR0ZXJBY2NvdW50OiBkYXRhKCd0d2l0dGVyJyksXG4gICAgICAgIGlzU2hvd0NvbnRlbnRSZWM6IGRhdGEoJ3Nob3dfcmVjaXJjJyksXG4gICAgICAgIGNvbnRlbnRSZWNTZWxlY3RvcjogZGF0YSgncmVjaXJjX3NlbGVjdG9yJyksXG4gICAgICAgIGNvbnRlbnRSZWNUaXRsZTogZGF0YSgncmVjaXJjX3RpdGxlJyksXG4gICAgICAgIGNvbnRlbnRSZWNNZXRob2Q6IGRhdGEoJ3JlY2lyY19qcXVlcnlfbWV0aG9kJyksXG4gICAgICAgIGNvbnRlbnRSZWNDb2xvcnM6IGRhdGEoJ3JlY2lyY19iYWNrZ3JvdW5kJyksXG4gICAgICAgIGNvbnRlbnRSZWNDb3VudERlc2t0b3A6IGRhdGEoJ3JlY2lyY19jb3VudF9kZXNrdG9wJyksXG4gICAgICAgIGNvbnRlbnRSZWNDb3VudE1vYmlsZTogZGF0YSgncmVjaXJjX2NvdW50X21vYmlsZScpLFxuICAgICAgICBjb250ZW50UmVjUm93Q291bnREZXNrdG9wOiBkYXRhKCdyZWNpcmNfcm93Y291bnRfZGVza3RvcCcpLFxuICAgICAgICBjb250ZW50UmVjUm93Q291bnRNb2JpbGU6IGRhdGEoJ3JlY2lyY19yb3djb3VudF9tb2JpbGUnKVxuICAgIH1cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZTogdXBkYXRlRnJvbUpTT04sXG4gICAgZ2V0OiBnZXRHcm91cFNldHRpbmdzXG59OyIsIi8vIFRoaXMgbW9kdWxlIHN0b3JlcyBvdXIgbWFwcGluZyBmcm9tIGhhc2ggdmFsdWVzIHRvIHRoZWlyIGNvcnJlc3BvbmRpbmcgZWxlbWVudHMgaW4gdGhlIERPTS4gVGhlIGRhdGEgaXMgb3JnYW5pemVkXG4vLyBieSBwYWdlIGZvciB0aGUgYmxvZyByb2xsIGNhc2UsIHdoZXJlIG11bHRpcGxlIHBhZ2VzIG9mIGRhdGEgY2FuIGJlIGxvYWRlZCBhdCBvbmNlLlxudmFyIHBhZ2VzID0ge307XG5cbi8vIFRoaXMgbW9kdWxlIHByb3ZpZGVzIGEgZ2V0L3NldCBpbnRlcmZhY2UsIGJ1dCBpdCBhbGxvd3MgbXVsdGlwbGUgZWxlbWVudHMgd2l0aCB0aGUgc2FtZSBrZXkuIFRoaXMgYXBwbGllcyBmb3IgaW1hZ2Vcbi8vIGVsZW1lbnRzLCB3aGVyZSB3ZSBhbGxvdyBtdWx0aXBsZSBpbnN0YW5jZXMgb24gdGhlIHNhbWUgcGFnZSB3aXRoIHRoZSBzYW1lIGhhc2guXG5cbmZ1bmN0aW9uIGdldEVsZW1lbnQoY29udGFpbmVySGFzaCwgcGFnZUhhc2gpIHtcbiAgICB2YXIgY29udGFpbmVycyA9IHBhZ2VzW3BhZ2VIYXNoXTtcbiAgICBpZiAoY29udGFpbmVycykge1xuICAgICAgICB2YXIgZWxlbWVudHMgPSBjb250YWluZXJzW2NvbnRhaW5lckhhc2hdO1xuICAgICAgICBpZiAoZWxlbWVudHMpIHtcbiAgICAgICAgICAgIHJldHVybiBlbGVtZW50c1swXTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gc2V0RWxlbWVudChjb250YWluZXJIYXNoLCBwYWdlSGFzaCwgJGVsZW1lbnQpIHtcbiAgICB2YXIgY29udGFpbmVycyA9IHBhZ2VzW3BhZ2VIYXNoXTtcbiAgICBpZiAoIWNvbnRhaW5lcnMpIHtcbiAgICAgICAgY29udGFpbmVycyA9IHBhZ2VzW3BhZ2VIYXNoXSA9IHt9O1xuICAgIH1cbiAgICBjb250YWluZXJzW2NvbnRhaW5lckhhc2hdID0gY29udGFpbmVyc1tjb250YWluZXJIYXNoXSB8fCBbXTtcbiAgICB2YXIgZWxlbWVudHMgPSBjb250YWluZXJzW2NvbnRhaW5lckhhc2hdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZWxlbWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGVsZW1lbnRzW2ldLmdldCgwKSA9PT0gJGVsZW1lbnQuZ2V0KDApKSB7XG4gICAgICAgICAgICByZXR1cm47IC8vIFdlJ3ZlIGFscmVhZHkgZ290IHRoaXMgYXNzb2NpYXRpb25cbiAgICAgICAgfVxuICAgIH1cbiAgICBlbGVtZW50cy5wdXNoKCRlbGVtZW50KTtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlRWxlbWVudChjb250YWluZXJIYXNoLCBwYWdlSGFzaCwgJGVsZW1lbnQpIHtcbiAgICB2YXIgY29udGFpbmVycyA9IHBhZ2VzW3BhZ2VIYXNoXSB8fCB7fTtcbiAgICB2YXIgZWxlbWVudHMgPSBjb250YWluZXJzW2NvbnRhaW5lckhhc2hdIHx8IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZWxlbWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGVsZW1lbnRzW2ldLmdldCgwKSA9PT0gJGVsZW1lbnQuZ2V0KDApKSB7XG4gICAgICAgICAgICBlbGVtZW50cy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICBpZiAoZWxlbWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgZGVsZXRlIGNvbnRhaW5lcnNbY29udGFpbmVySGFzaF07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8vIFdoZW4gd2UgZmlyc3Qgc2NhbiBhIHBhZ2UsIHRoZSBcImhhc2hcIiBpcyBqdXN0IHRoZSBVUkwgd2hpbGUgd2Ugd2FpdCB0byBoZWFyIGJhY2sgZnJvbSB0aGUgc2VydmVyLCB0aGVuIGl0J3MgdXBkYXRlZFxuLy8gdG8gd2hhdGV2ZXIgdmFsdWUgdGhlIHNlcnZlciBjb21wdXRlZC4gU28gaGVyZSB3ZSBhbGxvdyBvdXIgbWFwcGluZyB0byBiZSB1cGRhdGVkIHdoZW4gdGhhdCBjaGFuZ2UgaGFwcGVucy5cbmZ1bmN0aW9uIHVwZGF0ZVBhZ2VIYXNoKG9sZFBhZ2VIYXNoLCBuZXdQYWdlSGFzaCkge1xuICAgIHBhZ2VzW25ld1BhZ2VIYXNoXSA9IHBhZ2VzW29sZFBhZ2VIYXNoXTtcbiAgICBkZWxldGUgcGFnZXNbb2xkUGFnZUhhc2hdO1xufVxuXG5mdW5jdGlvbiB0ZWFyZG93bigpIHtcbiAgICBwYWdlcyA9IHt9O1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgZ2V0RWxlbWVudDogZ2V0RWxlbWVudCxcbiAgICBzZXRFbGVtZW50OiBzZXRFbGVtZW50LFxuICAgIHJlbW92ZUVsZW1lbnQ6IHJlbW92ZUVsZW1lbnQsXG4gICAgdXBkYXRlUGFnZUhhc2g6IHVwZGF0ZVBhZ2VIYXNoLFxuICAgIHRlYXJkb3duOiB0ZWFyZG93blxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi91dGlscy9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciBSYWN0aXZlOyByZXF1aXJlKCcuL3V0aWxzL3JhY3RpdmUtcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24obG9hZGVkUmFjdGl2ZSkgeyBSYWN0aXZlID0gbG9hZGVkUmFjdGl2ZTt9KTtcbnZhciBSYW5nZSA9IHJlcXVpcmUoJy4vdXRpbHMvcmFuZ2UnKTtcblxudmFyIEV2ZW50cyA9IHJlcXVpcmUoJy4vZXZlbnRzJyk7XG52YXIgSGFzaGVkRWxlbWVudHMgPSByZXF1aXJlKCcuL2hhc2hlZC1lbGVtZW50cycpO1xudmFyIFBhZ2VEYXRhID0gcmVxdWlyZSgnLi9wYWdlLWRhdGEnKTtcbnZhciBTVkdzID0gcmVxdWlyZSgnLi9zdmdzJyk7XG5cbnZhciBwYWdlU2VsZWN0b3IgPSAnLmFudGVubmEtbG9jYXRpb25zLXBhZ2UnO1xuXG5mdW5jdGlvbiBjcmVhdGVQYWdlKG9wdGlvbnMpIHtcbiAgICB2YXIgZWxlbWVudCA9IG9wdGlvbnMuZWxlbWVudDtcbiAgICB2YXIgcmVhY3Rpb25Mb2NhdGlvbkRhdGEgPSBvcHRpb25zLnJlYWN0aW9uTG9jYXRpb25EYXRhO1xuICAgIHZhciBwYWdlRGF0YSA9IG9wdGlvbnMucGFnZURhdGE7XG4gICAgdmFyIGdyb3VwU2V0dGluZ3MgPSBvcHRpb25zLmdyb3VwU2V0dGluZ3M7XG4gICAgdmFyIGNsb3NlV2luZG93ID0gb3B0aW9ucy5jbG9zZVdpbmRvdztcbiAgICB2YXIgZ29CYWNrID0gb3B0aW9ucy5nb0JhY2s7XG4gICAgdmFyIHJhY3RpdmUgPSBSYWN0aXZlKHtcbiAgICAgICAgZWw6IGVsZW1lbnQsXG4gICAgICAgIGFwcGVuZDogdHJ1ZSxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgbG9jYXRpb25EYXRhOiByZWFjdGlvbkxvY2F0aW9uRGF0YSxcbiAgICAgICAgICAgIHBhZ2VSZWFjdGlvbkNvdW50OiBwYWdlUmVhY3Rpb25Db3VudChyZWFjdGlvbkxvY2F0aW9uRGF0YSksXG4gICAgICAgICAgICBjYW5Mb2NhdGU6IGZ1bmN0aW9uKGNvbnRhaW5lckhhc2gpIHtcbiAgICAgICAgICAgICAgICAvLyBUT0RPOiBpcyB0aGVyZSBhIGJldHRlciB3YXkgdG8gaGFuZGxlIHJlYWN0aW9ucyB0byBoYXNoZXMgdGhhdCBhcmUgbm8gbG9uZ2VyIG9uIHRoZSBwYWdlP1xuICAgICAgICAgICAgICAgIC8vICAgICAgIHNob3VsZCB3ZSBwcm92aWRlIHNvbWUga2luZCBvZiBpbmRpY2F0aW9uIHdoZW4gd2UgZmFpbCB0byBsb2NhdGUgYSBoYXNoIG9yIGp1c3QgbGVhdmUgaXQgYXMgaXM/XG4gICAgICAgICAgICAgICAgLy8gVE9ETzogRG9lcyBpdCBtYWtlIHNlbnNlIHRvIGV2ZW4gc2hvdyBlbnRyaWVzIHRoYXQgd2UgY2FuJ3QgbG9jYXRlPyBQcm9iYWJseSBub3QuXG4gICAgICAgICAgICAgICAgcmV0dXJuIEhhc2hlZEVsZW1lbnRzLmdldEVsZW1lbnQoY29udGFpbmVySGFzaCwgcGFnZURhdGEucGFnZUhhc2gpICE9PSB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHRlbXBsYXRlOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvbG9jYXRpb25zLXBhZ2UuaGJzLmh0bWwnKSxcbiAgICAgICAgcGFydGlhbHM6IHtcbiAgICAgICAgICAgIGxlZnQ6IFNWR3MubGVmdCxcbiAgICAgICAgICAgIGZpbG06IFNWR3MuZmlsbVxuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmFjdGl2ZS5vbignYmFjaycsIGdvQmFjayk7XG4gICAgcmFjdGl2ZS5vbigncmV2ZWFsJywgcmV2ZWFsQ29udGVudCk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgc2VsZWN0b3I6IHBhZ2VTZWxlY3RvcixcbiAgICAgICAgdGVhcmRvd246IGZ1bmN0aW9uKCkgeyByYWN0aXZlLnRlYXJkb3duKCk7IH1cbiAgICB9O1xuXG5cbiAgICBmdW5jdGlvbiByZXZlYWxDb250ZW50KHJhY3RpdmVFdmVudCkge1xuICAgICAgICB2YXIgbG9jYXRpb25EYXRhID0gcmFjdGl2ZUV2ZW50LmNvbnRleHQ7XG4gICAgICAgIHZhciBlbGVtZW50ID0gSGFzaGVkRWxlbWVudHMuZ2V0RWxlbWVudChsb2NhdGlvbkRhdGEuY29udGFpbmVySGFzaCwgcGFnZURhdGEucGFnZUhhc2gpO1xuICAgICAgICBpZiAoZWxlbWVudCkge1xuICAgICAgICAgICAgdmFyIGV2ZW50ID0gcmFjdGl2ZUV2ZW50Lm9yaWdpbmFsO1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgY2xvc2VXaW5kb3coKTtcbiAgICAgICAgICAgIHZhciB0YXJnZXRTY3JvbGxUb3AgPSAkKGVsZW1lbnQpLm9mZnNldCgpLnRvcCAtIDEzMDtcbiAgICAgICAgICAgICQoJ2h0bWwsYm9keScpLmFuaW1hdGUoe3Njcm9sbFRvcDogdGFyZ2V0U2Nyb2xsVG9wfSwgMTAwMCk7XG4gICAgICAgICAgICBpZiAobG9jYXRpb25EYXRhLmtpbmQgPT09ICd0eHQnKSB7IC8vIFRPRE86IHNvbWV0aGluZyBiZXR0ZXIgdGhhbiBhIHN0cmluZyBjb21wYXJlLiBmaXggdGhpcyBhbG9uZyB3aXRoIHRoZSBzYW1lIGlzc3VlIGluIHBhZ2UtZGF0YVxuICAgICAgICAgICAgICAgIFJhbmdlLmhpZ2hsaWdodChlbGVtZW50LmdldCgwKSwgbG9jYXRpb25EYXRhLmxvY2F0aW9uKTtcbiAgICAgICAgICAgICAgICAkKGRvY3VtZW50KS5vbignY2xpY2suYW50ZW5uYScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBSYW5nZS5jbGVhckhpZ2hsaWdodHMoKTtcbiAgICAgICAgICAgICAgICAgICAgJChkb2N1bWVudCkub2ZmKCdjbGljay5hbnRlbm5hJyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgY29udGFpbmVyRGF0YSA9IFBhZ2VEYXRhLmdldENvbnRhaW5lckRhdGEocGFnZURhdGEsIGxvY2F0aW9uRGF0YS5jb250YWluZXJIYXNoKTtcbiAgICAgICAgICAgIEV2ZW50cy5wb3N0Q29udGVudFZpZXdlZChwYWdlRGF0YSwgY29udGFpbmVyRGF0YSxsb2NhdGlvbkRhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBwYWdlUmVhY3Rpb25Db3VudChyZWFjdGlvbkxvY2F0aW9uRGF0YSkge1xuICAgIGZvciAodmFyIGNvbnRlbnRJRCBpbiByZWFjdGlvbkxvY2F0aW9uRGF0YSkge1xuICAgICAgICBpZiAocmVhY3Rpb25Mb2NhdGlvbkRhdGEuaGFzT3duUHJvcGVydHkoY29udGVudElEKSkge1xuICAgICAgICAgICAgdmFyIGNvbnRlbnRMb2NhdGlvbkRhdGEgPSByZWFjdGlvbkxvY2F0aW9uRGF0YVtjb250ZW50SURdO1xuICAgICAgICAgICAgaWYgKGNvbnRlbnRMb2NhdGlvbkRhdGEua2luZCA9PT0gJ3BhZycpIHsgLy8gVE9ETzogc29tZXRoaW5nIGJldHRlciB0aGFuIGEgc3RyaW5nIGNvbXBhcmUuIGZpeCB0aGlzIGFsb25nIHdpdGggdGhlIHNhbWUgaXNzdWUgaW4gcGFnZS1kYXRhXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRlbnRMb2NhdGlvbkRhdGEuY291bnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGU6IGNyZWF0ZVBhZ2Vcbn07IiwidmFyIFJhY3RpdmU7IHJlcXVpcmUoJy4vdXRpbHMvcmFjdGl2ZS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihsb2FkZWRSYWN0aXZlKSB7IFJhY3RpdmUgPSBsb2FkZWRSYWN0aXZlO30pO1xudmFyIFVSTHMgPSByZXF1aXJlKCcuL3V0aWxzL3VybHMnKTtcbnZhciBVc2VyID0gcmVxdWlyZSgnLi91dGlscy91c2VyJyk7XG5cbnZhciBFdmVudHMgPSByZXF1aXJlKCcuL2V2ZW50cycpO1xudmFyIFNWR3MgPSByZXF1aXJlKCcuL3N2Z3MnKTtcblxudmFyIHBhZ2VTZWxlY3RvciA9ICcuYW50ZW5uYS1sb2dpbi1wYWdlJztcblxuZnVuY3Rpb24gY3JlYXRlUGFnZShvcHRpb25zKSB7XG4gICAgdmFyIGdyb3VwU2V0dGluZ3MgPSBvcHRpb25zLmdyb3VwU2V0dGluZ3M7XG4gICAgdmFyIGdvQmFjayA9IG9wdGlvbnMuZ29CYWNrO1xuICAgIHZhciByZXRyeSA9IG9wdGlvbnMucmV0cnk7XG4gICAgdmFyIGVsZW1lbnQgPSBvcHRpb25zLmVsZW1lbnQ7XG4gICAgdmFyIHJhY3RpdmUgPSBSYWN0aXZlKHtcbiAgICAgICAgZWw6IGVsZW1lbnQsXG4gICAgICAgIGFwcGVuZDogdHJ1ZSxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgZ3JvdXBOYW1lOiBlbmNvZGVVUkkoZ3JvdXBTZXR0aW5ncy5ncm91cE5hbWUoKSlcbiAgICAgICAgfSxcbiAgICAgICAgdGVtcGxhdGU6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9sb2dpbi1wYWdlLmhicy5odG1sJyksXG4gICAgICAgIHBhcnRpYWxzOiB7XG4gICAgICAgICAgICBsZWZ0OiBTVkdzLmxlZnQsXG4gICAgICAgICAgICBsb2dvOiBTVkdzLmxvZ29cbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJhY3RpdmUub24oJ2JhY2snLCBmdW5jdGlvbigpIHtcbiAgICAgICAgZ29CYWNrKCk7XG4gICAgfSk7XG4gICAgcmFjdGl2ZS5vbignZmFjZWJvb2tMb2dpbicsIGZ1bmN0aW9uKCkge1xuICAgICAgICBzaG93TG9naW5QZW5kaW5nKCk7XG4gICAgICAgIEV2ZW50cy5wb3N0RmFjZWJvb2tMb2dpblN0YXJ0KGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICBVc2VyLmZhY2Vib29rTG9naW4oZ3JvdXBTZXR0aW5ncywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgdXNlckluZm8gPSBVc2VyLmNhY2hlZFVzZXIoKTtcbiAgICAgICAgICAgIGlmICh1c2VySW5mby51c2VyX3R5cGUgIT09ICdmYWNlYm9vaycpIHtcbiAgICAgICAgICAgICAgICBFdmVudHMucG9zdEZhY2Vib29rTG9naW5GYWlsKGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZG9SZXRyeSgpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbiAgICByYWN0aXZlLm9uKCdhbnRlbm5hTG9naW4nLCBmdW5jdGlvbigpIHtcbiAgICAgICAgc2hvd0xvZ2luUGVuZGluZygpO1xuICAgICAgICBvcGVuQW50ZW5uYUxvZ2luV2luZG93KGRvUmV0cnkpO1xuICAgIH0pO1xuICAgIHJhY3RpdmUub24oJ3JldHJ5JywgZnVuY3Rpb24oKSB7XG4gICAgICAgIGRvUmV0cnkoKTtcbiAgICB9KTtcbiAgICB2YXIgYW50ZW5uYUxvZ2luV2luZG93O1xuICAgIHZhciBhbnRlbm5hTG9naW5DYW5jZWxsZWQgPSBmYWxzZTtcbiAgICByZXR1cm4ge1xuICAgICAgICBzZWxlY3RvcjogcGFnZVNlbGVjdG9yLFxuICAgICAgICB0ZWFyZG93bjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByYWN0aXZlLnRlYXJkb3duKCk7XG4gICAgICAgICAgICBjYW5jZWxBbnRlbm5hTG9naW4oKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBmdW5jdGlvbiBkb1JldHJ5KCkge1xuICAgICAgICByZXRyeSgpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG9wZW5BbnRlbm5hTG9naW5XaW5kb3coY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKGFudGVubmFMb2dpbldpbmRvdyAmJiAhYW50ZW5uYUxvZ2luV2luZG93LmNsb3NlZCkge1xuICAgICAgICAgICAgYW50ZW5uYUxvZ2luV2luZG93LmZvY3VzKCk7IC8vIEJyaW5nIHRoZSB3aW5kb3cgdG8gdGhlIGZyb250IGlmIGl0J3MgYWxyZWFkeSBvcGVuLlxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgRXZlbnRzLnBvc3RBbnRlbm5hTG9naW5TdGFydChncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgIHZhciB3aW5kb3dJZCA9ICdhbnRlbm5hX2xvZ2luJztcbiAgICAgICAgICAgIHZhciB3aW5kb3dQcm9wZXJ0aWVzID0gY29tcHV0ZVdpbmRvd1Byb3BlcnRpZXMoKTtcbiAgICAgICAgICAgIGFudGVubmFMb2dpbldpbmRvdyA9IHdpbmRvdy5vcGVuKFVSTHMuYXBwU2VydmVyVXJsKCkgKyBVUkxzLmFudGVubmFMb2dpblVybCgpLCB3aW5kb3dJZCwgd2luZG93UHJvcGVydGllcyk7XG4gICAgICAgICAgICB2YXIgaW50ZXJ2YWwgPSBzZXRJbnRlcnZhbChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAvLyBXYXRjaCBmb3IgdGhlIHdpbmRvdyB0byBjbG9zZSwgdGhlbiBnbyByZWFkIHRoZSBsYXRlc3QgY29va2llcy5cbiAgICAgICAgICAgICAgICBpZiAoYW50ZW5uYUxvZ2luV2luZG93ICYmIGFudGVubmFMb2dpbldpbmRvdy5jbG9zZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChpbnRlcnZhbCk7XG4gICAgICAgICAgICAgICAgICAgIGFudGVubmFMb2dpbldpbmRvdyA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIGlmICghYW50ZW5uYUxvZ2luQ2FuY2VsbGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgb2xkVXNlckluZm8gPSBVc2VyLmNhY2hlZFVzZXIoKSB8fCB7fTtcbiAgICAgICAgICAgICAgICAgICAgICAgIFVzZXIucmVmcmVzaFVzZXJGcm9tQ29va2llcyhmdW5jdGlvbiAodXNlckluZm8pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodXNlckluZm8gJiYgdXNlckluZm8udGVtcF91c2VyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEV2ZW50cy5wb3N0QW50ZW5uYUxvZ2luRmFpbChncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgNTApO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gY29tcHV0ZVdpbmRvd1Byb3BlcnRpZXMoKSB7XG4gICAgICAgICAgICB2YXIgdyA9IDQwMDtcbiAgICAgICAgICAgIHZhciBoID0gMzUwO1xuICAgICAgICAgICAgdmFyIGwgPSAod2luZG93LnNjcmVlbi53aWR0aC8yKS0ody8yKTtcbiAgICAgICAgICAgIHZhciB0ID0gKHdpbmRvdy5zY3JlZW4uaGVpZ2h0LzIpLShoLzIpO1xuICAgICAgICAgICAgcmV0dXJuICdtZW51YmFyPTEscmVzaXphYmxlPTEsc2Nyb2xsYmFycz15ZXMsd2lkdGg9Jyt3KycsaGVpZ2h0PScraCsnLHRvcD0nK3QrJyxsZWZ0PScrbDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNhbmNlbEFudGVubmFMb2dpbigpIHtcbiAgICAgICAgLy8gQ2xvc2UvY2FuY2VsIGFueSBsb2dpbiB3aW5kb3dzIHRoYXQgd2UgaGF2ZSBvcGVuLlxuICAgICAgICBpZiAoYW50ZW5uYUxvZ2luV2luZG93ICYmICFhbnRlbm5hTG9naW5XaW5kb3cuY2xvc2VkKSB7XG4gICAgICAgICAgICBhbnRlbm5hTG9naW5DYW5jZWxsZWQgPSB0cnVlO1xuICAgICAgICAgICAgYW50ZW5uYUxvZ2luV2luZG93LmNsb3NlKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzaG93TG9naW5QZW5kaW5nKCkge1xuICAgICAgICAkKHJhY3RpdmUuZmluZCgnLmFudGVubmEtbG9naW4tY29udGVudCcpKS5oaWRlKCk7XG4gICAgICAgICQocmFjdGl2ZS5maW5kKCcuYW50ZW5uYS1sb2dpbi1wZW5kaW5nJykpLnNob3coKTtcbiAgICB9XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGVQYWdlOiBjcmVhdGVQYWdlXG59OyIsInZhciAkOyByZXF1aXJlKCcuL3V0aWxzL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIFJhY3RpdmU7IHJlcXVpcmUoJy4vdXRpbHMvcmFjdGl2ZS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihsb2FkZWRSYWN0aXZlKSB7IFJhY3RpdmUgPSBsb2FkZWRSYWN0aXZlO30pO1xudmFyIFJlYWN0aW9uc1dpZGdldCA9IHJlcXVpcmUoJy4vcmVhY3Rpb25zLXdpZGdldCcpO1xudmFyIFNWR3MgPSByZXF1aXJlKCcuL3N2Z3MnKTtcblxudmFyIEFwcE1vZGUgPSByZXF1aXJlKCcuL3V0aWxzL2FwcC1tb2RlJyk7XG52YXIgQnJvd3Nlck1ldHJpY3MgPSByZXF1aXJlKCcuL3V0aWxzL2Jyb3dzZXItbWV0cmljcycpO1xudmFyIE11dGF0aW9uT2JzZXJ2ZXIgPSByZXF1aXJlKCcuL3V0aWxzL211dGF0aW9uLW9ic2VydmVyJyk7XG52YXIgVGhyb3R0bGVkRXZlbnRzID0gcmVxdWlyZSgnLi91dGlscy90aHJvdHRsZWQtZXZlbnRzJyk7XG52YXIgVG91Y2hTdXBwb3J0ID0gcmVxdWlyZSgnLi91dGlscy90b3VjaC1zdXBwb3J0Jyk7XG52YXIgVmlzaWJpbGl0eSA9IHJlcXVpcmUoJy4vdXRpbHMvdmlzaWJpbGl0eScpO1xuXG52YXIgQ0xBU1NfQUNUSVZFID0gJ2FudGVubmEtYWN0aXZlJztcblxuZnVuY3Rpb24gY3JlYXRlSW5kaWNhdG9yV2lkZ2V0KG9wdGlvbnMpIHtcbiAgICAvLyBUT0RPOiB2YWxpZGF0ZSB0aGF0IG9wdGlvbnMgY29udGFpbnMgYWxsIHJlcXVpcmVkIHByb3BlcnRpZXMgKGFwcGxpZXMgdG8gYWxsIHdpZGdldHMpLlxuICAgIHZhciBlbGVtZW50ID0gb3B0aW9ucy5lbGVtZW50O1xuICAgIHZhciBjb250YWluZXJEYXRhID0gb3B0aW9ucy5jb250YWluZXJEYXRhO1xuICAgIHZhciAkY29udGFpbmVyRWxlbWVudCA9IG9wdGlvbnMuY29udGFpbmVyRWxlbWVudDtcbiAgICB2YXIgcGFnZURhdGEgPSBvcHRpb25zLnBhZ2VEYXRhO1xuICAgIHZhciBncm91cFNldHRpbmdzID0gb3B0aW9ucy5ncm91cFNldHRpbmdzO1xuICAgIHZhciBkZWZhdWx0UmVhY3Rpb25zID0gb3B0aW9ucy5kZWZhdWx0UmVhY3Rpb25zO1xuICAgIHZhciBjb250ZW50RGF0YSA9IG9wdGlvbnMuY29udGVudERhdGE7XG4gICAgdmFyIHJhY3RpdmUgPSBSYWN0aXZlKHtcbiAgICAgICAgZWw6IGVsZW1lbnQsXG4gICAgICAgIGFwcGVuZDogdHJ1ZSxcbiAgICAgICAgbWFnaWM6IHRydWUsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIGNvbnRhaW5lckRhdGE6IGNvbnRhaW5lckRhdGEsXG4gICAgICAgICAgICBzdXBwb3J0c1RvdWNoOiBCcm93c2VyTWV0cmljcy5zdXBwb3J0c1RvdWNoKCksXG4gICAgICAgICAgICBleHRyYUF0dHJpYnV0ZXM6IEFwcE1vZGUuZGVidWcgPyAnYW50LWhhc2g9XCInICsgY29udGFpbmVyRGF0YS5oYXNoICsgJ1wiJyA6ICcnIC8vIFRPRE86IHRoaXMgYWJvdXQgbWFraW5nIHRoaXMgYSBkZWNvcmF0b3IgaGFuZGxlZCBieSBhIFwiRGVidWdcIiBtb2R1bGVcbiAgICAgICAgfSxcbiAgICAgICAgdGVtcGxhdGU6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9tZWRpYS1pbmRpY2F0b3Itd2lkZ2V0Lmhicy5odG1sJyksXG4gICAgICAgIHBhcnRpYWxzOiB7XG4gICAgICAgICAgICBsb2dvOiBTVkdzLmxvZ29cbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgdmFyIHJlYWN0aW9uV2lkZ2V0T3B0aW9ucyA9IHtcbiAgICAgICAgcmVhY3Rpb25zRGF0YTogY29udGFpbmVyRGF0YS5yZWFjdGlvbnMsXG4gICAgICAgIGNvbnRhaW5lckRhdGE6IGNvbnRhaW5lckRhdGEsXG4gICAgICAgIGNvbnRhaW5lckVsZW1lbnQ6ICRjb250YWluZXJFbGVtZW50LFxuICAgICAgICBjb250ZW50RGF0YTogY29udGVudERhdGEsXG4gICAgICAgIGRlZmF1bHRSZWFjdGlvbnM6IGRlZmF1bHRSZWFjdGlvbnMsXG4gICAgICAgIHBhZ2VEYXRhOiBwYWdlRGF0YSxcbiAgICAgICAgZ3JvdXBTZXR0aW5nczogZ3JvdXBTZXR0aW5nc1xuICAgIH07XG5cbiAgICB2YXIgaG92ZXJUaW1lb3V0O1xuICAgIHZhciBhY3RpdmVUaW1lb3V0O1xuXG4gICAgdmFyICRyb290RWxlbWVudCA9ICQocm9vdEVsZW1lbnQocmFjdGl2ZSkpO1xuICAgIFRvdWNoU3VwcG9ydC5zZXR1cFRhcCgkcm9vdEVsZW1lbnQuZ2V0KDApLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgb3BlblJlYWN0aW9uc1dpbmRvdyhyZWFjdGlvbldpZGdldE9wdGlvbnMsIHJhY3RpdmUpO1xuICAgIH0pO1xuICAgICRyb290RWxlbWVudC5vbignbW91c2VlbnRlci5hbnRlbm5hJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgaWYgKGV2ZW50LmJ1dHRvbnMgPiAwIHx8IChldmVudC5idXR0b25zID09IHVuZGVmaW5lZCAmJiBldmVudC53aGljaCA+IDApKSB7IC8vIE9uIFNhZmFyaSwgZXZlbnQuYnV0dG9ucyBpcyB1bmRlZmluZWQgYnV0IGV2ZW50LndoaWNoIGdpdmVzIGEgZ29vZCB2YWx1ZS4gZXZlbnQud2hpY2ggaXMgYmFkIG9uIEZGXG4gICAgICAgICAgICAvLyBEb24ndCByZWFjdCBpZiB0aGUgdXNlciBpcyBkcmFnZ2luZyBvciBzZWxlY3RpbmcgdGV4dC5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY29udGFpbmVyRGF0YS5yZWFjdGlvbnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgb3BlblJlYWN0aW9uc1dpbmRvdyhyZWFjdGlvbldpZGdldE9wdGlvbnMsIHJhY3RpdmUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KGhvdmVyVGltZW91dCk7XG4gICAgICAgICAgICBob3ZlclRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIG9wZW5SZWFjdGlvbnNXaW5kb3cocmVhY3Rpb25XaWRnZXRPcHRpb25zLCByYWN0aXZlKTtcbiAgICAgICAgICAgIH0sIDUwKTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgICRyb290RWxlbWVudC5vbignbW91c2VsZWF2ZS5hbnRlbm5hJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIGNsZWFyVGltZW91dChob3ZlclRpbWVvdXQpO1xuICAgICAgICBjbGVhclRpbWVvdXQoYWN0aXZlVGltZW91dCk7XG4gICAgfSk7XG4gICAgJGNvbnRhaW5lckVsZW1lbnQub24oJ21vdXNlZW50ZXIuYW50ZW5uYScsIGZ1bmN0aW9uKCkge1xuICAgICAgICBjbGVhclRpbWVvdXQoYWN0aXZlVGltZW91dCk7XG4gICAgICAgIGFjdGl2ZVRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgJHJvb3RFbGVtZW50LmFkZENsYXNzKENMQVNTX0FDVElWRSk7XG4gICAgICAgIH0sIDUwMCk7XG4gICAgfSk7XG4gICAgJGNvbnRhaW5lckVsZW1lbnQub24oJ21vdXNlbGVhdmUuYW50ZW5uYScsIGZ1bmN0aW9uKCkge1xuICAgICAgICBjbGVhclRpbWVvdXQoYWN0aXZlVGltZW91dCk7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAkcm9vdEVsZW1lbnQucmVtb3ZlQ2xhc3MoQ0xBU1NfQUNUSVZFKTtcbiAgICAgICAgfSwgMTAwKTsgLy8gV2UgZ2V0IGEgbW91c2VsZWF2ZSBldmVudCB3aGVuIHRoZSB1c2VyIGhvdmVycyB0aGUgaW5kaWNhdG9yLiBQYXVzZSBsb25nIGVub3VnaCB0aGF0IHRoZSByZWFjdGlvbiB3aW5kb3cgY2FuIG9wZW4gaWYgdGhleSBob3Zlci5cbiAgICB9KTtcbiAgICBzZXR1cFBvc2l0aW9uaW5nKCRjb250YWluZXJFbGVtZW50LCBncm91cFNldHRpbmdzLCByYWN0aXZlKTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIHRlYXJkb3duOiBmdW5jdGlvbigpIHsgcmFjdGl2ZS50ZWFyZG93bigpOyB9XG4gICAgfTtcbn1cblxuZnVuY3Rpb24gc2V0dXBQb3NpdGlvbmluZygkY29udGFpbmVyRWxlbWVudCwgZ3JvdXBTZXR0aW5ncywgcmFjdGl2ZSkge1xuICAgIHZhciAkd3JhcHBlckVsZW1lbnQgPSAkKHdyYXBwZXJFbGVtZW50KHJhY3RpdmUpKTtcbiAgICB2YXIgJHJvb3RFbGVtZW50ID0gJChyb290RWxlbWVudChyYWN0aXZlKSk7XG4gICAgcG9zaXRpb25JbmRpY2F0b3IoKTtcblxuICAgIFRocm90dGxlZEV2ZW50cy5vbigncmVzaXplJywgcG9zaXRpb25JZk5lZWRlZCk7XG4gICAgcmFjdGl2ZS5vbigndGVhcmRvd24nLCBmdW5jdGlvbigpIHtcbiAgICAgICAgVGhyb3R0bGVkRXZlbnRzLm9mZigncmVzaXplJywgcG9zaXRpb25JZk5lZWRlZCk7XG4gICAgfSk7XG4gICAgVGhyb3R0bGVkRXZlbnRzLm9uKCdzY3JvbGwnLCBwb3NpdGlvbklmTmVlZGVkKTtcbiAgICByYWN0aXZlLm9uKCd0ZWFyZG93bicsIGZ1bmN0aW9uKCkge1xuICAgICAgICBUaHJvdHRsZWRFdmVudHMub2ZmKCdzY3JvbGwnLCBwb3NpdGlvbklmTmVlZGVkKTtcbiAgICB9KTtcblxuICAgIC8vIFRPRE86IGNvbnNpZGVyIGFsc28gbGlzdGVuaW5nIHRvIHNyYyBhdHRyaWJ1dGUgY2hhbmdlcywgd2hpY2ggbWlnaHQgYWZmZWN0IHRoZSBoZWlnaHQgb2YgZWxlbWVudHMgb24gdGhlIHBhZ2VcbiAgICBNdXRhdGlvbk9ic2VydmVyLmFkZEFkZGl0aW9uTGlzdGVuZXIoZWxlbWVudHNBZGRlZE9yUmVtb3ZlZCk7XG4gICAgTXV0YXRpb25PYnNlcnZlci5hZGRSZW1vdmFsTGlzdGVuZXIoZWxlbWVudHNSZW1vdmVkKTtcblxuICAgIGZ1bmN0aW9uIGVsZW1lbnRzUmVtb3ZlZCgkZWxlbWVudHMpIHtcbiAgICAgICAgLy8gU3BlY2lhbCBjYXNlOiBJZiB3ZSBzZWUgdGhhdCBvdXIgb3duIHJlYWRtb3JlIGVsZW1lbnRzIGFyZSByZW1vdmVkLFxuICAgICAgICAvLyBhbHdheXMgdXBkYXRlIG91ciBpbmRpY2F0b3JzIGJlY2F1c2UgdGhlaXIgdmlzaWJpbGl0eSBtaWdodCBoYXZlIGNoYW5nZWQuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgJGVsZW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgJGVsZW1lbnQgPSAkZWxlbWVudHNbaV07XG4gICAgICAgICAgICBpZiAoJGVsZW1lbnQuaGFzQ2xhc3MoJ2FudGVubmEtcmVhZG1vcmUnKXx8ICRlbGVtZW50Lmhhc0NsYXNzKCdhbnRlbm5hLWNvbnRlbnQtcmVjLXJlYWRtb3JlJykpIHtcbiAgICAgICAgICAgICAgICBwb3NpdGlvbkluZGljYXRvcigpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbGVtZW50c0FkZGVkT3JSZW1vdmVkKCRlbGVtZW50cyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZWxlbWVudHNBZGRlZE9yUmVtb3ZlZCgkZWxlbWVudHMpIHtcbiAgICAgICAgLy8gUmVwb3NpdGlvbiB0aGUgaW5kaWNhdG9yIGlmIGVsZW1lbnRzIHdoaWNoIG1pZ2h0IGFkanVzdCB0aGUgY29udGFpbmVyJ3MgcG9zaXRpb24gYXJlIGFkZGVkL3JlbW92ZWQuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgJGVsZW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgJGVsZW1lbnQgPSAkZWxlbWVudHNbaV07XG4gICAgICAgICAgICBpZiAoJGVsZW1lbnQuaGVpZ2h0KCkgPiAwKSB7XG4gICAgICAgICAgICAgICAgcG9zaXRpb25JZk5lZWRlZCgpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHZhciBsYXN0Q29udGFpbmVyT2Zmc2V0ID0gJGNvbnRhaW5lckVsZW1lbnQub2Zmc2V0KCk7XG4gICAgdmFyIGxhc3RDb250YWluZXJIZWlnaHQgPSAkY29udGFpbmVyRWxlbWVudC5oZWlnaHQoKTtcbiAgICB2YXIgbGFzdENvbnRhaW5lclZpc2liaWxpdHkgPSBWaXNpYmlsaXR5LmlzVmlzaWJsZSgkY29udGFpbmVyRWxlbWVudC5nZXQoMCkpO1xuXG4gICAgZnVuY3Rpb24gcG9zaXRpb25JZk5lZWRlZCgpIHtcbiAgICAgICAgdmFyIGNvbnRhaW5lck9mZnNldCA9ICRjb250YWluZXJFbGVtZW50Lm9mZnNldCgpO1xuICAgICAgICB2YXIgY29udGFpbmVySGVpZ2h0ID0gJGNvbnRhaW5lckVsZW1lbnQuaGVpZ2h0KCk7XG4gICAgICAgIHZhciBjb250YWluZXJWaXNpYmlsaXR5ID0gVmlzaWJpbGl0eS5pc1Zpc2libGUoJGNvbnRhaW5lckVsZW1lbnQuZ2V0KDApKTtcbiAgICAgICAgaWYgKGNvbnRhaW5lck9mZnNldC50b3AgPT09IGxhc3RDb250YWluZXJPZmZzZXQudG9wICYmXG4gICAgICAgICAgICBjb250YWluZXJPZmZzZXQubGVmdCA9PT0gbGFzdENvbnRhaW5lck9mZnNldC5sZWZ0ICYmXG4gICAgICAgICAgICBjb250YWluZXJIZWlnaHQgPT09IGxhc3RDb250YWluZXJIZWlnaHQgJiZcbiAgICAgICAgICAgIGNvbnRhaW5lclZpc2liaWxpdHkgPT09IGxhc3RDb250YWluZXJWaXNpYmlsaXR5KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgbGFzdENvbnRhaW5lck9mZnNldCA9IGNvbnRhaW5lck9mZnNldDtcbiAgICAgICAgbGFzdENvbnRhaW5lckhlaWdodCA9IGNvbnRhaW5lckhlaWdodDtcbiAgICAgICAgbGFzdENvbnRhaW5lclZpc2liaWxpdHkgPSBjb250YWluZXJWaXNpYmlsaXR5O1xuICAgICAgICBwb3NpdGlvbkluZGljYXRvcigpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBvc2l0aW9uSW5kaWNhdG9yKCkge1xuICAgICAgICB1cGRhdGVEaXNwbGF5Rm9yVmlzaWJpbGl0eSgpOyAvLyBVcGRhdGUgdmlzaWJpbGl0eSB3aGVuZXZlciB3ZSBwb3NpdGlvbiB0aGUgZWxlbWVudC5cbiAgICAgICAgLy8gUG9zaXRpb24gdGhlIHdyYXBwZXIgZWxlbWVudCAod2hpY2ggaGFzIGEgaGFyZGNvZGVkIHdpZHRoKSBpbiB0aGUgYXBwcm9wcmlhdGUgY29ybmVyLiBUaGVuIGZsaXAgdGhlIGxlZnQvcmlnaHRcbiAgICAgICAgLy8gcG9zaXRpb25pbmcgb2YgdGhlIG5lc3RlZCB3aWRnZXQgZWxlbWVudCB0byBhZGp1c3QgdGhlIHdheSBpdCB3aWxsIGV4cGFuZCB3aGVuIHRoZSBtZWRpYSBpcyBob3ZlcmVkLlxuICAgICAgICB2YXIgY29ybmVyID0gZ3JvdXBTZXR0aW5ncy5tZWRpYUluZGljYXRvckNvcm5lcigpO1xuICAgICAgICB2YXIgZWxlbWVudE9mZnNldCA9ICRjb250YWluZXJFbGVtZW50Lm9mZnNldCgpO1xuICAgICAgICB2YXIgY29vcmRzID0ge307XG4gICAgICAgIGlmIChjb3JuZXIuaW5kZXhPZigndG9wJykgIT09IC0xKSB7XG4gICAgICAgICAgICBjb29yZHMudG9wID0gZWxlbWVudE9mZnNldC50b3A7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgYm9yZGVyVG9wID0gcGFyc2VJbnQoJGNvbnRhaW5lckVsZW1lbnQuY3NzKCdib3JkZXItdG9wJykpIHx8IDA7XG4gICAgICAgICAgICBjb29yZHMudG9wID0gZWxlbWVudE9mZnNldC50b3AgKyAkY29udGFpbmVyRWxlbWVudC5oZWlnaHQoKSArIGJvcmRlclRvcCAtICRyb290RWxlbWVudC5vdXRlckhlaWdodCgpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjb3JuZXIuaW5kZXhPZigncmlnaHQnKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIGNvb3Jkcy5sZWZ0ID0gZWxlbWVudE9mZnNldC5sZWZ0ICsgJGNvbnRhaW5lckVsZW1lbnQud2lkdGgoKSAtICR3cmFwcGVyRWxlbWVudC5vdXRlcldpZHRoKCk7XG4gICAgICAgICAgICAkcm9vdEVsZW1lbnQuY3NzKHtyaWdodDowLGxlZnQ6Jyd9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciBib3JkZXJMZWZ0ID0gcGFyc2VJbnQoJGNvbnRhaW5lckVsZW1lbnQuY3NzKCdib3JkZXItbGVmdCcpKSB8fCAwO1xuICAgICAgICAgICAgY29vcmRzLmxlZnQgPSBlbGVtZW50T2Zmc2V0LmxlZnQgKyBib3JkZXJMZWZ0O1xuICAgICAgICAgICAgJHJvb3RFbGVtZW50LmNzcyh7cmlnaHQ6JycsbGVmdDowfSk7XG4gICAgICAgIH1cbiAgICAgICAgJHdyYXBwZXJFbGVtZW50LmNzcyhjb29yZHMpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHVwZGF0ZURpc3BsYXlGb3JWaXNpYmlsaXR5KCkge1xuICAgICAgICAvLyBIaWRlL3Nob3cgdGhlIGluZGljYXRvciBiYXNlZCBvbiB3aGV0aGVyIHRoZSBjb250YWluZXIgZWxlbWVudCBpcyB2aXNpYmxlLlxuICAgICAgICAvLyBFeGFtcGxlcyBvZiB3aGVyZSB3ZSBuZWVkIHRoZXJlIGFyZSBjYXJvdXNlbHMgYW5kIG91ciBvd24gcmVhZG1vcmUgd2lkZ2V0LlxuICAgICAgICAkcm9vdEVsZW1lbnQuY3NzKHtkaXNwbGF5OiBWaXNpYmlsaXR5LmlzVmlzaWJsZSgkY29udGFpbmVyRWxlbWVudC5nZXQoMCkpID8gJyc6ICdub25lJ30pO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gd3JhcHBlckVsZW1lbnQocmFjdGl2ZSkge1xuICAgIHJldHVybiByYWN0aXZlLmZpbmQoJy5hbnRlbm5hLW1lZGlhLWluZGljYXRvci13cmFwcGVyJyk7XG59XG5cbmZ1bmN0aW9uIHJvb3RFbGVtZW50KHJhY3RpdmUpIHtcbiAgICByZXR1cm4gcmFjdGl2ZS5maW5kKCcuYW50ZW5uYS1tZWRpYS1pbmRpY2F0b3Itd2lkZ2V0Jyk7XG59XG5cbmZ1bmN0aW9uIG9wZW5SZWFjdGlvbnNXaW5kb3cocmVhY3Rpb25PcHRpb25zLCByYWN0aXZlKSB7XG4gICAgUmVhY3Rpb25zV2lkZ2V0Lm9wZW4ocmVhY3Rpb25PcHRpb25zLCByb290RWxlbWVudChyYWN0aXZlKSk7XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGU6IGNyZWF0ZUluZGljYXRvcldpZGdldFxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi91dGlscy9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciBBamF4Q2xpZW50ID0gcmVxdWlyZSgnLi91dGlscy9hamF4LWNsaWVudCcpO1xudmFyIFBhZ2VVdGlscyA9IHJlcXVpcmUoJy4vdXRpbHMvcGFnZS11dGlscycpO1xudmFyIFRocm90dGxlZEV2ZW50cyA9IHJlcXVpcmUoJy4vdXRpbHMvdGhyb3R0bGVkLWV2ZW50cycpO1xudmFyIFVSTHMgPSByZXF1aXJlKCcuL3V0aWxzL3VybHMnKTtcbnZhciBQYWdlRGF0YSA9IHJlcXVpcmUoJy4vcGFnZS1kYXRhJyk7XG5cbi8vIENvbXB1dGUgdGhlIHBhZ2VzIHRoYXQgd2UgbmVlZCB0byBmZXRjaC4gVGhpcyBpcyBlaXRoZXI6XG4vLyAxLiBBbnkgbmVzdGVkIHBhZ2VzIHdlIGZpbmQgdXNpbmcgdGhlIHBhZ2Ugc2VsZWN0b3IgT1Jcbi8vIDIuIFRoZSBjdXJyZW50IHdpbmRvdyBsb2NhdGlvblxuZnVuY3Rpb24gY29tcHV0ZVBhZ2VzUGFyYW0oJHBhZ2VFbGVtZW50QXJyYXksIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgZ3JvdXBJZCA9IGdyb3VwU2V0dGluZ3MuZ3JvdXBJZCgpO1xuICAgIHZhciBwYWdlcyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgJHBhZ2VFbGVtZW50QXJyYXkubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyICRwYWdlRWxlbWVudCA9ICRwYWdlRWxlbWVudEFycmF5W2ldO1xuICAgICAgICBwYWdlcy5wdXNoKHtcbiAgICAgICAgICAgIGdyb3VwX2lkOiBncm91cElkLFxuICAgICAgICAgICAgdXJsOiBQYWdlVXRpbHMuY29tcHV0ZVBhZ2VVcmwoJHBhZ2VFbGVtZW50LCBncm91cFNldHRpbmdzKSxcbiAgICAgICAgICAgIHRpdGxlOiBQYWdlVXRpbHMuY29tcHV0ZVBhZ2VUaXRsZSgkcGFnZUVsZW1lbnQsIGdyb3VwU2V0dGluZ3MpXG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBpZiAocGFnZXMubGVuZ3RoID09IDEpIHtcbiAgICAgICAgcGFnZXNbMF0uaW1hZ2UgPSBQYWdlVXRpbHMuY29tcHV0ZVRvcExldmVsUGFnZUltYWdlKGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICBwYWdlc1swXS5hdXRob3IgPSBQYWdlVXRpbHMuY29tcHV0ZVBhZ2VBdXRob3IoZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIHBhZ2VzWzBdLnRvcGljcyA9IFBhZ2VVdGlscy5jb21wdXRlUGFnZVRvcGljcyhncm91cFNldHRpbmdzKTtcbiAgICAgICAgcGFnZXNbMF0uc2VjdGlvbiA9IFBhZ2VVdGlscy5jb21wdXRlUGFnZVNpdGVTZWN0aW9uKGdyb3VwU2V0dGluZ3MpO1xuICAgIH1cblxuICAgIHJldHVybiB7IHBhZ2VzOiBwYWdlcyB9O1xufVxuXG5mdW5jdGlvbiBsb2FkUGFnZURhdGEocGFnZURhdGFQYXJhbSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIEFqYXhDbGllbnQuZ2V0SlNPTlAoVVJMcy5wYWdlRGF0YVVybCgpLCBwYWdlRGF0YVBhcmFtLCBzdWNjZXNzLCBlcnJvcik7XG5cbiAgICBmdW5jdGlvbiBzdWNjZXNzKGpzb24pIHtcbiAgICAgICAgLy9zZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyBQYWdlRGF0YS51cGRhdGVBbGxQYWdlRGF0YShqc29uLCBncm91cFNldHRpbmdzKTsgfSwgMzAwMCk7XG4gICAgICAgIFBhZ2VEYXRhLnVwZGF0ZUFsbFBhZ2VEYXRhKGpzb24sIGdyb3VwU2V0dGluZ3MpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGVycm9yKG1lc3NhZ2UpIHtcbiAgICAgICAgLy8gVE9ETyBoYW5kbGUgZXJyb3JzIHRoYXQgaGFwcGVuIHdoZW4gbG9hZGluZyBwYWdlIGRhdGFcbiAgICAgICAgY29uc29sZS5sb2coJ0FuIGVycm9yIG9jY3VycmVkIGxvYWRpbmcgcGFnZSBkYXRhOiAnICsgbWVzc2FnZSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBzdGFydExvYWRpbmdQYWdlRGF0YShncm91cFNldHRpbmdzKSB7XG4gICAgdmFyICRwYWdlRWxlbWVudHMgPSAkKGdyb3VwU2V0dGluZ3MucGFnZVNlbGVjdG9yKCkpO1xuICAgIGlmICgkcGFnZUVsZW1lbnRzLmxlbmd0aCA9PSAwKSB7XG4gICAgICAgICRwYWdlRWxlbWVudHMgPSAkKCdib2R5Jyk7XG4gICAgfVxuICAgIHF1ZXVlUGFnZURhdGFMb2FkKCRwYWdlRWxlbWVudHMsIGdyb3VwU2V0dGluZ3MpO1xufVxuXG5mdW5jdGlvbiBxdWV1ZVBhZ2VEYXRhTG9hZCgkcGFnZUVsZW1lbnRzLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIHBhZ2VzVG9Mb2FkID0gW107XG4gICAgJHBhZ2VFbGVtZW50cy5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgJHBhZ2VFbGVtZW50ID0gJCh0aGlzKTtcbiAgICAgICAgaWYgKGlzSW5WaWV3KCRwYWdlRWxlbWVudCkpIHtcbiAgICAgICAgICAgIHBhZ2VzVG9Mb2FkLnB1c2goJHBhZ2VFbGVtZW50KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGxvYWRXaGVuVmlzaWJsZSgkcGFnZUVsZW1lbnQsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICBpZiAocGFnZXNUb0xvYWQubGVuZ3RoID4gMCkge1xuICAgICAgICB2YXIgcGFnZURhdGFQYXJhbSA9IGNvbXB1dGVQYWdlc1BhcmFtKHBhZ2VzVG9Mb2FkLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgbG9hZFBhZ2VEYXRhKHBhZ2VEYXRhUGFyYW0sIGdyb3VwU2V0dGluZ3MpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gaXNJblZpZXcoJGVsZW1lbnQpIHtcbiAgICB2YXIgdHJpZ2dlckRpc3RhbmNlID0gMzAwO1xuICAgIHJldHVybiAkZWxlbWVudC5vZmZzZXQoKS50b3AgPCAgJChkb2N1bWVudCkuc2Nyb2xsVG9wKCkgKyAkKHdpbmRvdykuaGVpZ2h0KCkgKyB0cmlnZ2VyRGlzdGFuY2U7XG59XG5cbmZ1bmN0aW9uIGxvYWRXaGVuVmlzaWJsZSgkcGFnZUVsZW1lbnQsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgY2hlY2tWaXNpYmlsaXR5ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmIChpc0luVmlldygkcGFnZUVsZW1lbnQpKSB7XG4gICAgICAgICAgICB2YXIgcGFnZURhdGFQYXJhbSA9IGNvbXB1dGVQYWdlc1BhcmFtKFskcGFnZUVsZW1lbnRdLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgIGxvYWRQYWdlRGF0YShwYWdlRGF0YVBhcmFtLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgIFRocm90dGxlZEV2ZW50cy5vZmYoJ3Njcm9sbCcsIGNoZWNrVmlzaWJpbGl0eSk7XG4gICAgICAgICAgICBUaHJvdHRsZWRFdmVudHMub2ZmKCdyZXNpemUnLCBjaGVja1Zpc2liaWxpdHkpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBUaHJvdHRsZWRFdmVudHMub24oJ3Njcm9sbCcsIGNoZWNrVmlzaWJpbGl0eSk7XG4gICAgVGhyb3R0bGVkRXZlbnRzLm9uKCdyZXNpemUnLCBjaGVja1Zpc2liaWxpdHkpO1xufVxuXG5mdW5jdGlvbiBwYWdlc0FkZGVkKCRwYWdlRWxlbWVudHMsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICBxdWV1ZVBhZ2VEYXRhTG9hZCgkcGFnZUVsZW1lbnRzLCBncm91cFNldHRpbmdzKTtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGxvYWQ6IHN0YXJ0TG9hZGluZ1BhZ2VEYXRhLFxuICAgIHBhZ2VzQWRkZWQ6IHBhZ2VzQWRkZWRcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG5cbnZhciBFdmVudHMgPSByZXF1aXJlKCcuL2V2ZW50cycpO1xudmFyIEhhc2hlZEVsZW1lbnRzID0gcmVxdWlyZSgnLi9oYXNoZWQtZWxlbWVudHMnKTtcblxuLy8gQ29sbGVjdGlvbiBvZiBhbGwgcGFnZSBkYXRhLCBrZXllZCBieSBwYWdlIGhhc2hcbnZhciBwYWdlcyA9IHt9O1xuLy8gTWFwcGluZyBvZiBwYWdlIFVSTHMgdG8gcGFnZSBoYXNoZXMsIHdoaWNoIGFyZSBjb21wdXRlZCBvbiB0aGUgc2VydmVyLlxudmFyIHVybEhhc2hlcyA9IHt9O1xuXG5mdW5jdGlvbiBnZXRQYWdlRGF0YShoYXNoKSB7XG4gICAgdmFyIHBhZ2VEYXRhID0gcGFnZXNbaGFzaF07XG4gICAgaWYgKCFwYWdlRGF0YSkge1xuICAgICAgICAvLyBUT0RPOiBHaXZlIHRoaXMgc2VyaW91cyB0aG91Z2h0LiBJbiBvcmRlciBmb3IgbWFnaWMgbW9kZSB0byB3b3JrLCB0aGUgb2JqZWN0IG5lZWRzIHRvIGhhdmUgdmFsdWVzIGluIHBsYWNlIGZvclxuICAgICAgICAvLyB0aGUgb2JzZXJ2ZWQgcHJvcGVydGllcyBhdCB0aGUgbW9tZW50IHRoZSByYWN0aXZlIGlzIGNyZWF0ZWQuIEJ1dCB0aGlzIGlzIHByZXR0eSB1bnVzdWFsIGZvciBKYXZhc2NyaXB0LCB0byBoYXZlXG4gICAgICAgIC8vIHRvIGRlZmluZSB0aGUgd2hvbGUgc2tlbGV0b24gZm9yIHRoZSBvYmplY3QgaW5zdGVhZCBvZiBqdXN0IGFkZGluZyBwcm9wZXJ0aWVzIHdoZW5ldmVyIHlvdSB3YW50LlxuICAgICAgICAvLyBUaGUgYWx0ZXJuYXRpdmUgd291bGQgYmUgZm9yIHVzIHRvIGtlZXAgb3VyIG93biBcImRhdGEgYmluZGluZ1wiIGJldHdlZW4gdGhlIHBhZ2VEYXRhIGFuZCByYWN0aXZlIGluc3RhbmNlcyAoMSB0byBtYW55KVxuICAgICAgICAvLyBhbmQgdGVsbCB0aGUgcmFjdGl2ZXMgdG8gdXBkYXRlIHdoZW5ldmVyIHRoZSBkYXRhIGNoYW5nZXMuXG4gICAgICAgIHBhZ2VEYXRhID0ge1xuICAgICAgICAgICAgcGFnZUhhc2g6IGhhc2gsXG4gICAgICAgICAgICBzdW1tYXJ5UmVhY3Rpb25zOiBbXSxcbiAgICAgICAgICAgIHN1bW1hcnlUb3RhbDogMCxcbiAgICAgICAgICAgIHN1bW1hcnlMb2FkZWQ6IGZhbHNlLFxuICAgICAgICAgICAgY29udGFpbmVyczogW10sXG4gICAgICAgICAgICBtZXRyaWNzOiB7fSAvLyBUaGlzIGlzIGEgY2F0Y2gtYWxsIGZpZWxkIHdoZXJlIHdlIGNhbiBhdHRhY2ggY2xpZW50LXNpZGUgbWV0cmljcyBmb3IgYW5hbHl0aWNzXG4gICAgICAgIH07XG4gICAgICAgIHBhZ2VzW2hhc2hdID0gcGFnZURhdGE7XG4gICAgfVxuICAgIHJldHVybiBwYWdlRGF0YTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlQWxsUGFnZURhdGEoanNvblBhZ2VzLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGFsbFBhZ2VzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBqc29uUGFnZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIHBhZ2VEYXRhID0gdXBkYXRlUGFnZURhdGEoanNvblBhZ2VzW2ldLCBncm91cFNldHRpbmdzKVxuICAgICAgICBhbGxQYWdlcy5wdXNoKHBhZ2VEYXRhKTtcbiAgICAgICAgRXZlbnRzLnBvc3RQYWdlRGF0YUxvYWRlZChwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiB1cGRhdGVQYWdlRGF0YShqc29uLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIHBhZ2VEYXRhID0gZ2V0UGFnZURhdGFGb3JKc29uUmVzcG9uc2UoanNvbik7XG4gICAgcGFnZURhdGEucGFnZUlkID0ganNvbi5pZDtcbiAgICBwYWdlRGF0YS5wYWdlSGFzaCA9IGpzb24ucGFnZUhhc2g7XG4gICAgcGFnZURhdGEuZ3JvdXBJZCA9IGdyb3VwU2V0dGluZ3MuZ3JvdXBJZCgpO1xuICAgIHBhZ2VEYXRhLmNhbm9uaWNhbFVybCA9IGpzb24uY2Fub25pY2FsVVJMO1xuICAgIHBhZ2VEYXRhLnJlcXVlc3RlZFVybCA9IGpzb24ucmVxdWVzdGVkVVJMO1xuICAgIHBhZ2VEYXRhLmF1dGhvciA9IGpzb24uYXV0aG9yO1xuICAgIHBhZ2VEYXRhLnNlY3Rpb24gPSBqc29uLnNlY3Rpb247XG4gICAgcGFnZURhdGEudG9waWNzID0ganNvbi50b3BpY3M7XG4gICAgcGFnZURhdGEudGl0bGUgPSBqc29uLnRpdGxlO1xuICAgIHBhZ2VEYXRhLmltYWdlID0ganNvbi5pbWFnZTtcblxuICAgIHZhciBzdW1tYXJ5UmVhY3Rpb25zID0ganNvbi5zdW1tYXJ5UmVhY3Rpb25zO1xuICAgIHBhZ2VEYXRhLnN1bW1hcnlSZWFjdGlvbnMgPSBzdW1tYXJ5UmVhY3Rpb25zO1xuICAgIHNldENvbnRhaW5lcnMocGFnZURhdGEsIGpzb24uY29udGFpbmVycyk7XG5cbiAgICAvLyBXZSBhZGQgdXAgdGhlIHN1bW1hcnkgcmVhY3Rpb24gdG90YWwgY2xpZW50LXNpZGVcbiAgICB2YXIgdG90YWwgPSAwO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3VtbWFyeVJlYWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICB0b3RhbCA9IHRvdGFsICsgc3VtbWFyeVJlYWN0aW9uc1tpXS5jb3VudDtcbiAgICB9XG4gICAgcGFnZURhdGEuc3VtbWFyeVRvdGFsID0gdG90YWw7XG4gICAgcGFnZURhdGEuc3VtbWFyeUxvYWRlZCA9IHRydWU7XG5cbiAgICAvLyBXZSBhZGQgdXAgdGhlIGNvbnRhaW5lciByZWFjdGlvbiB0b3RhbHMgY2xpZW50LXNpZGVcbiAgICB2YXIgdG90YWwgPSAwO1xuICAgIHZhciBjb250YWluZXJDb3VudHMgPSBbXTtcbiAgICB2YXIgY29udGFpbmVycyA9IHBhZ2VEYXRhLmNvbnRhaW5lcnM7XG4gICAgZm9yICh2YXIgaGFzaCBpbiBqc29uLmNvbnRhaW5lcnMpIHtcbiAgICAgICAgaWYgKGNvbnRhaW5lcnMuaGFzT3duUHJvcGVydHkoaGFzaCkpIHtcbiAgICAgICAgICAgIHZhciBjb250YWluZXIgPSBjb250YWluZXJzW2hhc2hdO1xuICAgICAgICAgICAgdmFyIHRvdGFsID0gMDtcbiAgICAgICAgICAgIHZhciBjb250YWluZXJSZWFjdGlvbnMgPSBjb250YWluZXIucmVhY3Rpb25zO1xuICAgICAgICAgICAgaWYgKGNvbnRhaW5lclJlYWN0aW9ucykge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY29udGFpbmVyUmVhY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHRvdGFsID0gdG90YWwgKyBjb250YWluZXJSZWFjdGlvbnNbaV0uY291bnQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29udGFpbmVyLnJlYWN0aW9uVG90YWwgPSB0b3RhbDtcbiAgICAgICAgICAgIGNvbnRhaW5lckNvdW50cy5wdXNoKHsgY291bnQ6IHRvdGFsLCBjb250YWluZXI6IGNvbnRhaW5lciB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICB2YXIgaW5kaWNhdG9yTGltaXQgPSBncm91cFNldHRpbmdzLnRleHRJbmRpY2F0b3JMaW1pdCgpO1xuICAgIGlmIChpbmRpY2F0b3JMaW1pdCkge1xuICAgICAgICAvLyBJZiBhbiBpbmRpY2F0b3IgbGltaXQgaXMgc2V0LCBzb3J0IHRoZSBjb250YWluZXJzIGFuZCBtYXJrIG9ubHkgdGhlIHRvcCBOIHRvIGJlIHZpc2libGUuXG4gICAgICAgIGNvbnRhaW5lckNvdW50cy5zb3J0KGZ1bmN0aW9uKGEsIGIpIHsgcmV0dXJuIGIuY291bnQgLSBhLmNvdW50OyB9KTsgLy8gc29ydCBsYXJnZXN0IGNvdW50IGZpcnN0XG4gICAgICAgIGZvciAodmFyIGkgPSBpbmRpY2F0b3JMaW1pdDsgaSA8IGNvbnRhaW5lckNvdW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29udGFpbmVyQ291bnRzW2ldLmNvbnRhaW5lci5zdXBwcmVzcyA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcGFnZURhdGE7XG59XG5cbmZ1bmN0aW9uIGdldENvbnRhaW5lckRhdGEocGFnZURhdGEsIGNvbnRhaW5lckhhc2gpIHtcbiAgICB2YXIgY29udGFpbmVyRGF0YSA9IHBhZ2VEYXRhLmNvbnRhaW5lcnNbY29udGFpbmVySGFzaF07XG4gICAgaWYgKCFjb250YWluZXJEYXRhKSB7XG4gICAgICAgIGNvbnRhaW5lckRhdGEgPSB7XG4gICAgICAgICAgICBoYXNoOiBjb250YWluZXJIYXNoLFxuICAgICAgICAgICAgcmVhY3Rpb25Ub3RhbDogMCxcbiAgICAgICAgICAgIHJlYWN0aW9uczogW10sXG4gICAgICAgICAgICBsb2FkZWQ6IHBhZ2VEYXRhLnN1bW1hcnlMb2FkZWQsXG4gICAgICAgICAgICBzdXBwcmVzczogZmFsc2VcbiAgICAgICAgfTtcbiAgICAgICAgcGFnZURhdGEuY29udGFpbmVyc1tjb250YWluZXJIYXNoXSA9IGNvbnRhaW5lckRhdGE7XG4gICAgfVxuICAgIHJldHVybiBjb250YWluZXJEYXRhO1xufVxuXG4vLyBNZXJnZSB0aGUgZ2l2ZW4gY29udGFpbmVyIGRhdGEgaW50byB0aGUgcGFnZURhdGEuY29udGFpbmVycyBkYXRhLiBUaGlzIGlzIG5lY2Vzc2FyeSBiZWNhdXNlIHRoZSBza2VsZXRvbiBvZiB0aGUgcGFnZURhdGEuY29udGFpbmVycyBtYXBcbi8vIGlzIHNldCB1cCBhbmQgYm91bmQgdG8gdGhlIFVJIGJlZm9yZSBhbGwgdGhlIGRhdGEgaXMgZmV0Y2hlZCBmcm9tIHRoZSBzZXJ2ZXIgYW5kIHdlIGRvbid0IHdhbnQgdG8gYnJlYWsgdGhlIGRhdGEgYmluZGluZy5cbmZ1bmN0aW9uIHNldENvbnRhaW5lcnMocGFnZURhdGEsIGpzb25Db250YWluZXJzKSB7XG4gICAgZm9yICh2YXIgaGFzaCBpbiBqc29uQ29udGFpbmVycykge1xuICAgICAgICBpZiAoanNvbkNvbnRhaW5lcnMuaGFzT3duUHJvcGVydHkoaGFzaCkpIHtcbiAgICAgICAgICAgIHZhciBjb250YWluZXJEYXRhID0gZ2V0Q29udGFpbmVyRGF0YShwYWdlRGF0YSwgaGFzaCk7XG4gICAgICAgICAgICB2YXIgZmV0Y2hlZENvbnRhaW5lckRhdGEgPSBqc29uQ29udGFpbmVyc1toYXNoXTtcbiAgICAgICAgICAgIGNvbnRhaW5lckRhdGEuaWQgPSBmZXRjaGVkQ29udGFpbmVyRGF0YS5pZDtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZmV0Y2hlZENvbnRhaW5lckRhdGEucmVhY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY29udGFpbmVyRGF0YS5yZWFjdGlvbnMucHVzaChmZXRjaGVkQ29udGFpbmVyRGF0YS5yZWFjdGlvbnNbaV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHZhciBhbGxDb250YWluZXJzID0gcGFnZURhdGEuY29udGFpbmVycztcbiAgICBmb3IgKHZhciBoYXNoIGluIGFsbENvbnRhaW5lcnMpIHtcbiAgICAgICAgaWYgKGFsbENvbnRhaW5lcnMuaGFzT3duUHJvcGVydHkoaGFzaCkpIHtcbiAgICAgICAgICAgIHZhciBjb250YWluZXIgPSBhbGxDb250YWluZXJzW2hhc2hdO1xuICAgICAgICAgICAgY29udGFpbmVyLmxvYWRlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGNsZWFySW5kaWNhdG9yTGltaXQocGFnZURhdGEpIHtcbiAgICB2YXIgY29udGFpbmVycyA9IHBhZ2VEYXRhLmNvbnRhaW5lcnM7XG4gICAgZm9yICh2YXIgaGFzaCBpbiBjb250YWluZXJzKSB7XG4gICAgICAgIGlmIChjb250YWluZXJzLmhhc093blByb3BlcnR5KGhhc2gpKSB7XG4gICAgICAgICAgICB2YXIgY29udGFpbmVyID0gY29udGFpbmVyc1toYXNoXTtcbiAgICAgICAgICAgIGNvbnRhaW5lci5zdXBwcmVzcyA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxufVxuXG4vLyBSZXR1cm5zIHRoZSBsb2NhdGlvbnMgd2hlcmUgdGhlIGdpdmVuIHJlYWN0aW9uIG9jY3VycyBvbiB0aGUgcGFnZS4gVGhlIHJldHVybiBmb3JtYXQgaXM6XG4vLyB7XG4vLyAgIDxjb250ZW50X2lkPiA6IHtcbi8vICAgICBjb3VudDogPG51bWJlcj4sXG4vLyAgICAgaWQ6IDxjb250ZW50X2lkPixcbi8vICAgICBjb250YWluZXJJRDogPGNvbnRhaW5lcl9pZD5cbi8vICAgICBraW5kOiA8Y29udGVudCBraW5kPixcbi8vICAgICBsb2NhdGlvbjogPGxvY2F0aW9uPixcbi8vICAgICBbYm9keTogPGJvZHk+XSBmaWxsZWQgaW4gbGF0ZXIgdmlhIHVwZGF0ZUxvY2F0aW9uRGF0YVxuLy8gICB9XG4vLyB9XG5mdW5jdGlvbiBnZXRSZWFjdGlvbkxvY2F0aW9uRGF0YShyZWFjdGlvbiwgcGFnZURhdGEpIHtcbiAgICBpZiAoIXBhZ2VEYXRhLmxvY2F0aW9uRGF0YSkgeyAvLyBQb3B1bGF0ZSB0aGlzIHRyZWUgbGF6aWx5LCBzaW5jZSBpdCdzIG5vdCBmcmVxdWVudGx5IHVzZWQuXG4gICAgICAgIHBhZ2VEYXRhLmxvY2F0aW9uRGF0YSA9IGNvbXB1dGVMb2NhdGlvbkRhdGEocGFnZURhdGEpO1xuICAgIH1cbiAgICByZXR1cm4gcGFnZURhdGEubG9jYXRpb25EYXRhW3JlYWN0aW9uLmlkXTtcbn1cblxuLy8gUmV0dXJucyBhIHZpZXcgb24gdGhlIGdpdmVuIHRyZWUgc3RydWN0dXJlIHRoYXQncyBvcHRpbWl6ZWQgZm9yIHJlbmRlcmluZyB0aGUgbG9jYXRpb24gb2YgcmVhY3Rpb25zIChhcyBmcm9tIHRoZVxuLy8gc3VtbWFyeSB3aWRnZXQpLiBGb3IgZWFjaCByZWFjdGlvbiwgd2UgY2FuIHF1aWNrbHkgZ2V0IHRvIHRoZSBwaWVjZXMgb2YgY29udGVudCB0aGF0IGhhdmUgdGhhdCByZWFjdGlvbiBhcyB3ZWxsIGFzXG4vLyB0aGUgY291bnQgb2YgdGhvc2UgcmVhY3Rpb25zIGZvciBlYWNoIHBpZWNlIG9mIGNvbnRlbnQuXG4vL1xuLy8gVGhlIHN0cnVjdHVyZSBsb29rcyBsaWtlIHRoaXM6XG4vLyB7XG4vLyAgIDxyZWFjdGlvbl9pZD4gOiB7ICAgKHRoaXMgaXMgdGhlIGludGVyYWN0aW9uX25vZGVfaWQpXG4vLyAgICAgPGNvbnRlbnRfaWQ+IDoge1xuLy8gICAgICAgY291bnQgOiA8bnVtYmVyPixcbi8vICAgICAgIGNvbnRhaW5lcklEOiA8Y29udGFpbmVyX2lkPixcbi8vICAgICAgIGtpbmQ6IDxjb250ZW50IGtpbmQ+LFxuLy8gICAgICAgbG9jYXRpb246IDxsb2NhdGlvbj5cbi8vICAgICAgIFtib2R5OiA8Ym9keT5dIGZpbGxlZCBpbiBsYXRlciB2aWEgdXBkYXRlTG9jYXRpb25EYXRhXG4vLyAgICAgfVxuLy8gICB9XG4vLyB9XG5mdW5jdGlvbiBjb21wdXRlTG9jYXRpb25EYXRhKHBhZ2VEYXRhKSB7XG4gICAgdmFyIGxvY2F0aW9uRGF0YSA9IHt9O1xuICAgIHZhciBjb250YWluZXJzID0gcGFnZURhdGEuY29udGFpbmVycztcbiAgICBmb3IgKHZhciBoYXNoIGluIGNvbnRhaW5lcnMpIHtcbiAgICAgICAgaWYgKGNvbnRhaW5lcnMuaGFzT3duUHJvcGVydHkoaGFzaCkpIHtcbiAgICAgICAgICAgIHZhciBjb250YWluZXJEYXRhID0gY29udGFpbmVyc1toYXNoXTtcbiAgICAgICAgICAgIHZhciByZWFjdGlvbnMgPSBjb250YWluZXJEYXRhLnJlYWN0aW9ucztcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmVhY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJlYWN0aW9uID0gcmVhY3Rpb25zW2ldO1xuICAgICAgICAgICAgICAgIHZhciByZWFjdGlvbklkID0gcmVhY3Rpb24uaWQ7XG4gICAgICAgICAgICAgICAgdmFyIGNvbnRlbnQgPSByZWFjdGlvbi5jb250ZW50O1xuICAgICAgICAgICAgICAgIHZhciBjb250ZW50SWQgPSBjb250ZW50LmlkO1xuICAgICAgICAgICAgICAgIHZhciByZWFjdGlvbkxvY2F0aW9uRGF0YSA9IGxvY2F0aW9uRGF0YVtyZWFjdGlvbklkXTtcbiAgICAgICAgICAgICAgICBpZiAoIXJlYWN0aW9uTG9jYXRpb25EYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlYWN0aW9uTG9jYXRpb25EYXRhID0ge307XG4gICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uRGF0YVtyZWFjdGlvbklkXSA9IHJlYWN0aW9uTG9jYXRpb25EYXRhO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgY29udGVudExvY2F0aW9uRGF0YSA9IHJlYWN0aW9uTG9jYXRpb25EYXRhW2NvbnRlbnRJZF07IC8vIFRPRE86IEl0J3Mgbm90IHJlYWxseSBwb3NzaWJsZSB0byBnZXQgYSBoaXQgaGVyZSwgaXMgaXQ/IFdlIHNob3VsZCBuZXZlciBzZWUgdHdvIGluc3RhbmNlcyBvZiB0aGUgc2FtZSByZWFjdGlvbiBmb3IgdGhlIHNhbWUgY29udGVudD8gKFRoZXJlJ2Qgd291bGQganVzdCBiZSBvbmUgaW5zdGFuY2Ugd2l0aCBhIGNvdW50ID4gMS4pXG4gICAgICAgICAgICAgICAgaWYgKCFjb250ZW50TG9jYXRpb25EYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnRMb2NhdGlvbkRhdGEgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb3VudDogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGtpbmQ6IGNvbnRlbnQua2luZCwgLy8gVE9ETzogV2Ugc2hvdWxkIG5vcm1hbGl6ZSB0aGlzIHZhbHVlIHRvIGEgc2V0IG9mIGNvbnN0YW50cy4gZml4IHRoaXMgaW4gbG9jYXRpb25zLXBhZ2Ugd2hlcmUgdGhlIHZhbHVlIGlzIHJlYWQgYXMgd2VsbC5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRPRE86IGFsc28gY29uc2lkZXIgdHJhbnNsYXRpbmcgdGhpcyBmcm9tIHRoZSByYXcgXCJraW5kXCIgdG8gXCJ0eXBlXCIuIChlLmcuIFwicGFnXCIgPT4gXCJwYWdlXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICBsb2NhdGlvbjogY29udGVudC5sb2NhdGlvbixcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lckhhc2g6IGNvbnRhaW5lckRhdGEuaGFzaCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnRJZDogY29udGVudElkXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIHJlYWN0aW9uTG9jYXRpb25EYXRhW2NvbnRlbnRJZF0gPSBjb250ZW50TG9jYXRpb25EYXRhO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb250ZW50TG9jYXRpb25EYXRhLmNvdW50ICs9IHJlYWN0aW9uLmNvdW50O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBsb2NhdGlvbkRhdGE7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZVJlYWN0aW9uTG9jYXRpb25EYXRhKHJlYWN0aW9uTG9jYXRpb25EYXRhLCBjb250ZW50Qm9kaWVzKSB7XG4gICAgZm9yICh2YXIgY29udGVudElkIGluIGNvbnRlbnRCb2RpZXMpIHtcbiAgICAgICAgaWYgKGNvbnRlbnRCb2RpZXMuaGFzT3duUHJvcGVydHkoY29udGVudElkKSkge1xuICAgICAgICAgICAgdmFyIGNvbnRlbnRMb2NhdGlvbkRhdGEgPSByZWFjdGlvbkxvY2F0aW9uRGF0YVtjb250ZW50SWRdO1xuICAgICAgICAgICAgaWYgKGNvbnRlbnRMb2NhdGlvbkRhdGEpIHtcbiAgICAgICAgICAgICAgICBjb250ZW50TG9jYXRpb25EYXRhLmJvZHkgPSBjb250ZW50Qm9kaWVzW2NvbnRlbnRJZF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIHJlZ2lzdGVyUmVhY3Rpb24ocmVhY3Rpb24sIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhKSB7XG4gICAgdmFyIGV4aXN0aW5nUmVhY3Rpb25zID0gY29udGFpbmVyRGF0YS5yZWFjdGlvbnM7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBleGlzdGluZ1JlYWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoZXhpc3RpbmdSZWFjdGlvbnNbaV0uaWQgPT09IHJlYWN0aW9uLmlkKSB7XG4gICAgICAgICAgICAvLyBUaGlzIHJlYWN0aW9uIGhhcyBhbHJlYWR5IGJlZW4gYWRkZWQgdG8gdGhpcyBjb250YWluZXIuIERvbid0IGFkZCBpdCBhZ2Fpbi5cbiAgICAgICAgICAgIHJldHVybiBleGlzdGluZ1JlYWN0aW9uc1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBjb250YWluZXJEYXRhLnJlYWN0aW9ucy5wdXNoKHJlYWN0aW9uKTtcbiAgICBjb250YWluZXJEYXRhLnJlYWN0aW9uVG90YWwgPSBjb250YWluZXJEYXRhLnJlYWN0aW9uVG90YWwgKyAxO1xuICAgIHZhciBleGlzdHNJblN1bW1hcnkgPSBmYWxzZTtcbiAgICB2YXIgZXhpc3RpbmdTdW1tYXJ5UmVhY3Rpb25zID0gcGFnZURhdGEuc3VtbWFyeVJlYWN0aW9ucztcbiAgICBmb3IgKHZhciBqID0gMDsgaiA8IGV4aXN0aW5nU3VtbWFyeVJlYWN0aW9ucy5sZW5ndGg7IGorKykge1xuICAgICAgICBpZiAoZXhpc3RpbmdTdW1tYXJ5UmVhY3Rpb25zW2pdLmlkID09PSByZWFjdGlvbi5pZCkge1xuICAgICAgICAgICAgLy8gSWYgdGhpcyByZWFjdGlvbiBhbHJlYWR5IGV4aXN0cyBpbiB0aGUgc3VtbWFyeSwgaW5jcmVtZW50IHRoZSBjb3VudC5cbiAgICAgICAgICAgIGV4aXN0aW5nU3VtbWFyeVJlYWN0aW9uc1tqXS5jb3VudCArPSAxO1xuICAgICAgICAgICAgZXhpc3RzSW5TdW1tYXJ5ID0gdHJ1ZTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmICghZXhpc3RzSW5TdW1tYXJ5KSB7XG4gICAgICAgIHZhciBzdW1tYXJ5UmVhY3Rpb24gPSB7XG4gICAgICAgICAgICB0ZXh0OiByZWFjdGlvbi50ZXh0LFxuICAgICAgICAgICAgaWQ6IHJlYWN0aW9uLmlkLFxuICAgICAgICAgICAgY291bnQ6IHJlYWN0aW9uLmNvdW50XG4gICAgICAgIH07XG4gICAgICAgIHBhZ2VEYXRhLnN1bW1hcnlSZWFjdGlvbnMucHVzaChzdW1tYXJ5UmVhY3Rpb24pO1xuICAgIH1cbiAgICBwYWdlRGF0YS5zdW1tYXJ5VG90YWwgPSBwYWdlRGF0YS5zdW1tYXJ5VG90YWwgKyAxO1xuICAgIHJldHVybiByZWFjdGlvbjtcbn1cblxuLy8gR2V0cyBwYWdlIGRhdGEgYmFzZWQgb24gYSBVUkwuIFRoaXMgYWxsb3dzIG91ciBjbGllbnQgdG8gc3RhcnQgcHJvY2Vzc2luZyBhIHBhZ2UgKGFuZCBiaW5kaW5nIGRhdGEgb2JqZWN0c1xuLy8gdG8gdGhlIFVJKSAqYmVmb3JlKiB3ZSBnZXQgZGF0YSBiYWNrIGZyb20gdGhlIHNlcnZlci5cbmZ1bmN0aW9uIGdldFBhZ2VEYXRhQnlVUkwodXJsKSB7XG4gICAgdmFyIHNlcnZlckhhc2ggPSB1cmxIYXNoZXNbdXJsXTtcbiAgICBpZiAoc2VydmVySGFzaCkge1xuICAgICAgICAvLyBJZiB0aGUgc2VydmVyIGFscmVhZHkgZ2l2ZW4gdXMgdGhlIGhhc2ggZm9yIHRoZSBwYWdlLCB1c2UgaXQuXG4gICAgICAgIHJldHVybiBnZXRQYWdlRGF0YShzZXJ2ZXJIYXNoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBPdGhlcndpc2UsIHRlbXBvcmFyaWx5IHVzZSB0aGUgdXJsIGFzIHRoZSBoYXNoLiBUaGlzIHdpbGwgZ2V0IHVwZGF0ZWQgd2hlbmV2ZXIgd2UgZ2V0IGRhdGEgYmFjayBmcm9tIHRoZSBzZXJ2ZXIuXG4gICAgICAgIHJldHVybiBnZXRQYWdlRGF0YSh1cmwpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZ2V0UGFnZURhdGFGb3JKc29uUmVzcG9uc2UoanNvbikge1xuICAgIHZhciBwYWdlSGFzaCA9IGpzb24ucGFnZUhhc2g7XG4gICAgdmFyIHJlcXVlc3RlZFVSTCA9IGpzb24ucmVxdWVzdGVkVVJMO1xuICAgIHVybEhhc2hlc1tyZXF1ZXN0ZWRVUkxdID0gcGFnZUhhc2g7XG4gICAgdmFyIHVybEJhc2VkRGF0YSA9IHBhZ2VzW3JlcXVlc3RlZFVSTF07XG4gICAgaWYgKHVybEJhc2VkRGF0YSkge1xuICAgICAgICAvLyBJZiB3ZSd2ZSBhbHJlYWR5IGNyZWF0ZWQvYm91bmQgYSBwYWdlRGF0YSBvYmplY3QgdW5kZXIgdGhlIHJlcXVlc3RlZFVybCwgdXBkYXRlIHRoZSBwYWdlSGFzaCBhbmQgbW92ZSB0aGF0XG4gICAgICAgIC8vIGRhdGEgb3ZlciB0byB0aGUgaGFzaCBrZXlcbiAgICAgICAgdXJsQmFzZWREYXRhLnBhZ2VIYXNoID0ganNvbi5wYWdlSGFzaDtcbiAgICAgICAgcGFnZXNbcGFnZUhhc2hdID0gdXJsQmFzZWREYXRhO1xuICAgICAgICBkZWxldGUgcGFnZXNbcmVxdWVzdGVkVVJMXTtcbiAgICAgICAgLy8gVXBkYXRlIHRoZSBtYXBwaW5nIG9mIGhhc2hlcyB0byBwYWdlIGVsZW1lbnRzIHNvIGl0IGFsc28ga25vd3MgYWJvdXQgdGhlIGNoYW5nZSB0byB0aGUgcGFnZSBoYXNoXG4gICAgICAgIEhhc2hlZEVsZW1lbnRzLnVwZGF0ZVBhZ2VIYXNoKHJlcXVlc3RlZFVSTCwgcGFnZUhhc2gpO1xuICAgIH1cbiAgICByZXR1cm4gZ2V0UGFnZURhdGEocGFnZUhhc2gpO1xufVxuXG5mdW5jdGlvbiB0ZWFyZG93bigpIHtcbiAgICBwYWdlcyA9IHt9O1xuICAgIHVybEhhc2hlcyA9IHt9O1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgZ2V0UGFnZURhdGFCeVVSTDogZ2V0UGFnZURhdGFCeVVSTCxcbiAgICBnZXRQYWdlRGF0YTogZ2V0UGFnZURhdGEsXG4gICAgdXBkYXRlQWxsUGFnZURhdGE6IHVwZGF0ZUFsbFBhZ2VEYXRhLFxuICAgIGdldENvbnRhaW5lckRhdGE6IGdldENvbnRhaW5lckRhdGEsXG4gICAgZ2V0UmVhY3Rpb25Mb2NhdGlvbkRhdGE6IGdldFJlYWN0aW9uTG9jYXRpb25EYXRhLFxuICAgIHVwZGF0ZVJlYWN0aW9uTG9jYXRpb25EYXRhOiB1cGRhdGVSZWFjdGlvbkxvY2F0aW9uRGF0YSxcbiAgICByZWdpc3RlclJlYWN0aW9uOiByZWdpc3RlclJlYWN0aW9uLFxuICAgIGNsZWFySW5kaWNhdG9yTGltaXQ6IGNsZWFySW5kaWNhdG9yTGltaXQsXG4gICAgdGVhcmRvd246IHRlYXJkb3duLFxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi91dGlscy9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciBBcHBNb2RlID0gcmVxdWlyZSgnLi91dGlscy9hcHAtbW9kZScpO1xudmFyIEJyb3dzZXJNZXRyaWNzID0gcmVxdWlyZSgnLi91dGlscy9icm93c2VyLW1ldHJpY3MnKTtcbnZhciBIYXNoID0gcmVxdWlyZSgnLi91dGlscy9oYXNoJyk7XG52YXIgTXV0YXRpb25PYnNlcnZlciA9IHJlcXVpcmUoJy4vdXRpbHMvbXV0YXRpb24tb2JzZXJ2ZXInKTtcbnZhciBQYWdlVXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzL3BhZ2UtdXRpbHMnKTtcbnZhciBTZWdtZW50ID0gcmVxdWlyZSgnLi91dGlscy9zZWdtZW50Jyk7XG52YXIgVVJMcyA9IHJlcXVpcmUoJy4vdXRpbHMvdXJscycpO1xudmFyIFdpZGdldEJ1Y2tldCA9IHJlcXVpcmUoJy4vdXRpbHMvd2lkZ2V0LWJ1Y2tldCcpO1xuXG52YXIgQXV0b0NhbGxUb0FjdGlvbiA9IHJlcXVpcmUoJy4vYXV0by1jYWxsLXRvLWFjdGlvbicpO1xudmFyIENhbGxUb0FjdGlvbkluZGljYXRvciA9IHJlcXVpcmUoJy4vY2FsbC10by1hY3Rpb24taW5kaWNhdG9yJyk7XG52YXIgQ29udGVudFJlYyA9IHJlcXVpcmUoJy4vY29udGVudC1yZWMtd2lkZ2V0Jyk7XG52YXIgSGFzaGVkRWxlbWVudHMgPSByZXF1aXJlKCcuL2hhc2hlZC1lbGVtZW50cycpO1xudmFyIE1lZGlhSW5kaWNhdG9yV2lkZ2V0ID0gcmVxdWlyZSgnLi9tZWRpYS1pbmRpY2F0b3Itd2lkZ2V0Jyk7XG52YXIgUGFnZURhdGEgPSByZXF1aXJlKCcuL3BhZ2UtZGF0YScpO1xudmFyIFBhZ2VEYXRhTG9hZGVyID0gcmVxdWlyZSgnLi9wYWdlLWRhdGEtbG9hZGVyJyk7XG52YXIgUmVhZE1vcmVFdmVudHMgPSByZXF1aXJlKCcuL3JlYWRtb3JlLWV2ZW50cycpO1xudmFyIFN1bW1hcnlXaWRnZXQgPSByZXF1aXJlKCcuL3N1bW1hcnktd2lkZ2V0Jyk7XG52YXIgVGV4dEluZGljYXRvcldpZGdldCA9IHJlcXVpcmUoJy4vdGV4dC1pbmRpY2F0b3Itd2lkZ2V0Jyk7XG52YXIgVGV4dFJlYWN0aW9ucyA9IHJlcXVpcmUoJy4vdGV4dC1yZWFjdGlvbnMnKTtcblxudmFyIFRZUEVfVEVYVCA9IFwidGV4dFwiO1xudmFyIFRZUEVfSU1BR0UgPSBcImltYWdlXCI7XG52YXIgVFlQRV9NRURJQSA9IFwibWVkaWFcIjtcblxudmFyIEFUVFJfSEFTSCA9IFwiYW50LWhhc2hcIjtcblxudmFyIGNyZWF0ZWRXaWRnZXRzID0gW107XG5cblxuLy8gU2NhbiBmb3IgYWxsIHBhZ2VzIGF0IHRoZSBjdXJyZW50IGJyb3dzZXIgbG9jYXRpb24uIFRoaXMgY291bGQganVzdCBiZSB0aGUgY3VycmVudCBwYWdlIG9yIGl0IGNvdWxkIGJlIGEgY29sbGVjdGlvblxuLy8gb2YgcGFnZXMgKGFrYSAncG9zdHMnKS5cbmZ1bmN0aW9uIHNjYW5BbGxQYWdlcyhncm91cFNldHRpbmdzLCByZWluaXRpYWxpemVDYWxsYmFjaykge1xuICAgICQoZ3JvdXBTZXR0aW5ncy5leGNsdXNpb25TZWxlY3RvcigpKS5hZGRDbGFzcygnbm8tYW50Jyk7IC8vIEFkZCB0aGUgbm8tYW50IGNsYXNzIHRvIGV2ZXJ5dGhpbmcgdGhhdCBpcyBmbGFnZ2VkIGZvciBleGNsdXNpb25cbiAgICB2YXIgJHBhZ2VzID0gJChncm91cFNldHRpbmdzLnBhZ2VTZWxlY3RvcigpKTsgLy8gVE9ETzogbm8tYW50P1xuICAgIGlmICgkcGFnZXMubGVuZ3RoID09IDApIHtcbiAgICAgICAgLy8gSWYgd2UgZG9uJ3QgZGV0ZWN0IGFueSBwYWdlIG1hcmtlcnMsIHRyZWF0IHRoZSB3aG9sZSBkb2N1bWVudCBhcyB0aGUgc2luZ2xlIHBhZ2VcbiAgICAgICAgJHBhZ2VzID0gJCgnYm9keScpOyAvLyBUT0RPOiBJcyB0aGlzIHRoZSByaWdodCBiZWhhdmlvcj8gKEtlZXAgaW4gc3luYyB3aXRoIHRoZSBzYW1lIGFzc3VtcHRpb24gdGhhdCdzIGJ1aWx0IGludG8gcGFnZS1kYXRhLWxvYWRlci4pXG4gICAgfVxuICAgICRwYWdlcy5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgJHBhZ2UgPSAkKHRoaXMpO1xuICAgICAgICBzY2FuUGFnZSgkcGFnZSwgZ3JvdXBTZXR0aW5ncywgJHBhZ2VzLmxlbmd0aCA+IDEpO1xuICAgIH0pO1xuICAgIHNldHVwTXV0YXRpb25PYnNlcnZlcihncm91cFNldHRpbmdzLCByZWluaXRpYWxpemVDYWxsYmFjayk7XG59XG5cbi8vIFNjYW4gdGhlIHBhZ2UgdXNpbmcgdGhlIGdpdmVuIHNldHRpbmdzOlxuLy8gMS4gRmluZCBhbGwgdGhlIGNvbnRhaW5lcnMgdGhhdCB3ZSBjYXJlIGFib3V0LlxuLy8gMi4gQ29tcHV0ZSBoYXNoZXMgZm9yIGVhY2ggY29udGFpbmVyLlxuLy8gMy4gSW5zZXJ0IHdpZGdldCBhZmZvcmRhbmNlcyBmb3IgZWFjaCB3aGljaCBhcmUgYm91bmQgdG8gdGhlIGRhdGEgbW9kZWwgYnkgdGhlIGhhc2hlcy5cbmZ1bmN0aW9uIHNjYW5QYWdlKCRwYWdlLCBncm91cFNldHRpbmdzLCBpc011bHRpUGFnZSkge1xuICAgIHZhciB1cmwgPSBQYWdlVXRpbHMuY29tcHV0ZVBhZ2VVcmwoJHBhZ2UsIGdyb3VwU2V0dGluZ3MpO1xuICAgIHZhciBwYWdlRGF0YSA9IFBhZ2VEYXRhLmdldFBhZ2VEYXRhQnlVUkwodXJsKTtcbiAgICB2YXIgJGFjdGl2ZVNlY3Rpb25zID0gZmluZCgkcGFnZSwgZ3JvdXBTZXR0aW5ncy5hY3RpdmVTZWN0aW9ucygpLCB0cnVlKTtcblxuICAgIC8vIEZpcnN0LCBzY2FuIGZvciBlbGVtZW50cyB0aGF0IHdvdWxkIGNhdXNlIHVzIHRvIGluc2VydCBzb21ldGhpbmcgaW50byB0aGUgRE9NIHRoYXQgdGFrZXMgdXAgc3BhY2UuXG4gICAgLy8gV2Ugd2FudCB0byBnZXQgYW55IHBhZ2UgcmVzaXppbmcgb3V0IG9mIHRoZSB3YXkgYXMgZWFybHkgYXMgcG9zc2libGUuXG4gICAgLy8gVE9ETzogQ29uc2lkZXIgZG9pbmcgdGhpcyB3aXRoIHJhdyBKYXZhc2NyaXB0IGJlZm9yZSBqUXVlcnkgbG9hZHMsIHRvIGZ1cnRoZXIgcmVkdWNlIHRoZSBkZWxheS4gV2Ugd291bGRuJ3RcbiAgICAvLyBzYXZlIGEgKnRvbiogb2YgdGltZSBmcm9tIHRoaXMsIHRob3VnaCwgc28gaXQncyBkZWZpbml0ZWx5IGEgbGF0ZXIgb3B0aW1pemF0aW9uLlxuICAgIHNjYW5Gb3JTdW1tYXJpZXMoJHBhZ2UsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTsgLy8gU3VtbWFyeSB3aWRnZXQgbWF5IGJlIG9uIHRoZSBwYWdlLCBidXQgb3V0c2lkZSB0aGUgYWN0aXZlIHNlY3Rpb25cbiAgICBzY2FuRm9yUmVhZE1vcmUoJHBhZ2UsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICBzY2FuRm9yQ29udGVudFJlYygkcGFnZSwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgICRhY3RpdmVTZWN0aW9ucy5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgJHNlY3Rpb24gPSAkKHRoaXMpO1xuICAgICAgICBjcmVhdGVBdXRvQ2FsbHNUb0FjdGlvbigkc2VjdGlvbiwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgIH0pO1xuICAgIC8vIFNjYW4gZm9yIENUQXMgYWNyb3NzIHRoZSBlbnRpcmUgcGFnZSAodGhleSBjYW4gYmUgb3V0c2lkZSBhbiBhY3RpdmUgc2VjdGlvbikuIENUQXMgaGF2ZSB0byBnbyBiZWZvcmUgc2NhbnMgZm9yXG4gICAgLy8gY29udGVudCBiZWNhdXNlIGNvbnRlbnQgaW52b2x2ZWQgaW4gQ1RBcyB3aWxsIGJlIHRhZ2dlZCBuby1hbnQuXG4gICAgc2NhbkZvckNhbGxzVG9BY3Rpb24oJHBhZ2UsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICAvLyBUaGVuIHNjYW4gZm9yIGV2ZXJ5dGhpbmcgZWxzZVxuICAgICRhY3RpdmVTZWN0aW9ucy5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgJHNlY3Rpb24gPSAkKHRoaXMpO1xuICAgICAgICBzY2FuQWN0aXZlRWxlbWVudCgkc2VjdGlvbiwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgIH0pO1xuXG4gICAgcGFnZURhdGEubWV0cmljcy5oZWlnaHQgPSBjb21wdXRlUGFnZUhlaWdodCgkYWN0aXZlU2VjdGlvbnMpO1xuICAgIHBhZ2VEYXRhLm1ldHJpY3MuaXNNdWx0aVBhZ2UgPSBpc011bHRpUGFnZTtcbn1cblxuZnVuY3Rpb24gY29tcHV0ZVBhZ2VIZWlnaHQoJGFjdGl2ZVNlY3Rpb25zKSB7XG4gICAgdmFyIGNvbnRlbnRUb3A7XG4gICAgdmFyIGNvbnRlbnRCb3R0b207XG4gICAgJGFjdGl2ZVNlY3Rpb25zLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkc2VjdGlvbiA9ICQodGhpcyk7XG4gICAgICAgIHZhciBvZmZzZXQgPSAkc2VjdGlvbi5vZmZzZXQoKTtcbiAgICAgICAgY29udGVudFRvcCA9IGNvbnRlbnRUb3AgPT09IHVuZGVmaW5lZCA/IG9mZnNldC50b3AgOiBNYXRoLm1pbihjb250ZW50VG9wLCBvZmZzZXQudG9wKTtcbiAgICAgICAgdmFyIGJvdHRvbSA9IG9mZnNldC50b3AgKyAkc2VjdGlvbi5vdXRlckhlaWdodCgpO1xuICAgICAgICBjb250ZW50Qm90dG9tID0gY29udGVudEJvdHRvbSA9PT0gdW5kZWZpbmVkID8gYm90dG9tIDogTWF0aC5tYXgoY29udGVudEJvdHRvbSwgYm90dG9tKTtcbiAgICB9KTtcbiAgICByZXR1cm4gY29udGVudEJvdHRvbSAtIGNvbnRlbnRUb3A7XG59XG5cbi8vIFNjYW5zIHRoZSBnaXZlbiBlbGVtZW50LCB3aGljaCBhcHBlYXJzIGluc2lkZSBhbiBhY3RpdmUgc2VjdGlvbi4gVGhlIGVsZW1lbnQgY2FuIGJlIHRoZSBlbnRpcmUgYWN0aXZlIHNlY3Rpb24sXG4vLyBzb21lIGNvbnRhaW5lciB3aXRoaW4gdGhlIGFjdGl2ZSBzZWN0aW9uLCBvciBhIGxlYWYgbm9kZSBpbiB0aGUgYWN0aXZlIHNlY3Rpb24uXG5mdW5jdGlvbiBzY2FuQWN0aXZlRWxlbWVudCgkZWxlbWVudCwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICBzY2FuRm9yQ29udGVudCgkZWxlbWVudCwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpO1xufVxuXG5mdW5jdGlvbiBzY2FuRm9yU3VtbWFyaWVzKCRlbGVtZW50LCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciAkc3VtbWFyaWVzID0gZmluZCgkZWxlbWVudCwgZ3JvdXBTZXR0aW5ncy5zdW1tYXJ5U2VsZWN0b3IoKSwgdHJ1ZSwgdHJ1ZSk7IC8vIHN1bW1hcnkgd2lkZ2V0cyBjYW4gYmUgaW5zaWRlIG5vLWFudCBzZWN0aW9uc1xuICAgICRzdW1tYXJpZXMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRzdW1tYXJ5ID0gJCh0aGlzKTtcbiAgICAgICAgdmFyIGNvbnRhaW5lckRhdGEgPSBQYWdlRGF0YS5nZXRDb250YWluZXJEYXRhKHBhZ2VEYXRhLCAncGFnZScpOyAvLyBNYWdpYyBoYXNoIGZvciBwYWdlIHJlYWN0aW9uc1xuICAgICAgICBjb250YWluZXJEYXRhLnR5cGUgPSAncGFnZSc7IC8vIFRPRE86IHJldmlzaXQgd2hldGhlciBpdCBtYWtlcyBzZW5zZSB0byBzZXQgdGhlIHR5cGUgaGVyZVxuICAgICAgICB2YXIgZGVmYXVsdFJlYWN0aW9ucyA9IGdyb3VwU2V0dGluZ3MuZGVmYXVsdFJlYWN0aW9ucygkc3VtbWFyeSk7IC8vIFRPRE86IGRvIHdlIHN1cHBvcnQgY3VzdG9taXppbmcgdGhlIGRlZmF1bHQgcmVhY3Rpb25zIGF0IHRoaXMgbGV2ZWw/XG4gICAgICAgIHZhciBzdW1tYXJ5V2lkZ2V0ID0gU3VtbWFyeVdpZGdldC5jcmVhdGUoY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGRlZmF1bHRSZWFjdGlvbnMsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICB2YXIgJHN1bW1hcnlFbGVtZW50ID0gc3VtbWFyeVdpZGdldC5lbGVtZW50O1xuICAgICAgICBpbnNlcnRDb250ZW50KCRzdW1tYXJ5LCAkc3VtbWFyeUVsZW1lbnQsIGdyb3VwU2V0dGluZ3Muc3VtbWFyeU1ldGhvZCgpKTtcbiAgICAgICAgY3JlYXRlZFdpZGdldHMucHVzaChzdW1tYXJ5V2lkZ2V0KTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gc2NhbkZvclJlYWRNb3JlKCRlbGVtZW50LCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIFJlYWRNb3JlRXZlbnRzLnNldHVwUmVhZE1vcmVFdmVudHMoJGVsZW1lbnQuZ2V0KDApLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG59XG5cbmZ1bmN0aW9uIHNjYW5Gb3JDb250ZW50UmVjKCRlbGVtZW50LCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIGlmIChncm91cFNldHRpbmdzLmlzU2hvd0NvbnRlbnRSZWMoKSAmJlxuICAgICAgICAgICAgKEJyb3dzZXJNZXRyaWNzLmlzTW9iaWxlKCkgfHwgQXBwTW9kZS5kZWJ1ZykpIHtcbiAgICAgICAgdmFyICRjb250ZW50UmVjTG9jYXRpb25zID0gZmluZCgkZWxlbWVudCwgZ3JvdXBTZXR0aW5ncy5jb250ZW50UmVjU2VsZWN0b3IoKSwgdHJ1ZSwgdHJ1ZSk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgJGNvbnRlbnRSZWNMb2NhdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBjb250ZW50UmVjTG9jYXRpb24gPSAkY29udGVudFJlY0xvY2F0aW9uc1tpXTtcbiAgICAgICAgICAgIHZhciBjb250ZW50UmVjID0gQ29udGVudFJlYy5jcmVhdGVDb250ZW50UmVjKHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgIHZhciBjb250ZW50UmVjRWxlbWVudCA9IGNvbnRlbnRSZWMuZWxlbWVudDtcbiAgICAgICAgICAgIHZhciBtZXRob2QgPSBncm91cFNldHRpbmdzLmNvbnRlbnRSZWNNZXRob2QoKTtcbiAgICAgICAgICAgIHN3aXRjaCAobWV0aG9kKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAnYXBwZW5kJzpcbiAgICAgICAgICAgICAgICAgICAgY29udGVudFJlY0xvY2F0aW9uLmFwcGVuZENoaWxkKGNvbnRlbnRSZWNFbGVtZW50KTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAncHJlcGVuZCc6XG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnRSZWNMb2NhdGlvbi5pbnNlcnRCZWZvcmUoY29udGVudFJlY0VsZW1lbnQsIGNvbnRlbnRSZWNMb2NhdGlvbi5maXJzdENoaWxkKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnYmVmb3JlJzpcbiAgICAgICAgICAgICAgICAgICAgY29udGVudFJlY0xvY2F0aW9uLnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKGNvbnRlbnRSZWNFbGVtZW50LCBjb250ZW50UmVjTG9jYXRpb24pO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdhZnRlcic6XG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgY29udGVudFJlY0xvY2F0aW9uLnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKGNvbnRlbnRSZWNFbGVtZW50LCBjb250ZW50UmVjTG9jYXRpb24ubmV4dFNpYmxpbmcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY3JlYXRlZFdpZGdldHMucHVzaChjb250ZW50UmVjKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gc2NhbkZvckNhbGxzVG9BY3Rpb24oJGVsZW1lbnQsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGN0YVRhcmdldHMgPSB7fTsgLy8gVGhlIGVsZW1lbnRzIHRoYXQgdGhlIGNhbGwgdG8gYWN0aW9ucyBhY3Qgb24gKGUuZy4gdGhlIGltYWdlIG9yIHZpZGVvKVxuICAgIGZpbmQoJGVsZW1lbnQsICdbYW50LWl0ZW1dJywgdHJ1ZSkuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRjdGFUYXJnZXQgPSAkKHRoaXMpO1xuICAgICAgICAkY3RhVGFyZ2V0LmFkZENsYXNzKCduby1hbnQnKTsgLy8gZG9uJ3Qgc2hvdyB0aGUgbm9ybWFsIHJlYWN0aW9uIGFmZm9yZGFuY2Ugb24gYSBjdGEgdGFyZ2V0XG4gICAgICAgIHZhciBhbnRJdGVtSWQgPSAkY3RhVGFyZ2V0LmF0dHIoJ2FudC1pdGVtJykudHJpbSgpO1xuICAgICAgICBjdGFUYXJnZXRzW2FudEl0ZW1JZF0gPSAkY3RhVGFyZ2V0O1xuICAgIH0pO1xuXG4gICAgdmFyIGN0YUxhYmVscyA9IHt9OyAvLyBPcHRpb25hbCBlbGVtZW50cyB0aGF0IHJlcG9ydCB0aGUgbnVtYmVyIG9mIHJlYWN0aW9ucyB0byB0aGUgY3RhIChlLmcuIFwiMSByZWFjdGlvblwiKVxuICAgIGZpbmQoJGVsZW1lbnQsICdbYW50LXJlYWN0aW9ucy1sYWJlbC1mb3JdJywgdHJ1ZSkuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRjdGFMYWJlbCA9ICQodGhpcyk7XG4gICAgICAgICRjdGFMYWJlbC5hZGRDbGFzcygnbm8tYW50Jyk7IC8vIGRvbid0IHNob3cgdGhlIG5vcm1hbCByZWFjdGlvbiBhZmZvcmRhbmNlIG9uIGEgY3RhIGxhYmVsXG4gICAgICAgIHZhciBhbnRJdGVtSWQgPSAkY3RhTGFiZWwuYXR0cignYW50LXJlYWN0aW9ucy1sYWJlbC1mb3InKS50cmltKCk7XG4gICAgICAgIGN0YUxhYmVsc1thbnRJdGVtSWRdID0gY3RhTGFiZWxzW2FudEl0ZW1JZF0gfHwgW107XG4gICAgICAgIGN0YUxhYmVsc1thbnRJdGVtSWRdLnB1c2goJGN0YUxhYmVsKTtcbiAgICB9KTtcblxuICAgIHZhciBjdGFDb3VudGVycyA9IHt9OyAvLyBPcHRpb25hbCBlbGVtZW50cyB0aGF0IHJlcG9ydCBvbmx5IHRoZSBjb3VudCBvZiByZWFjdGlvbiB0byBhIGN0YSAoZS5nLiBcIjFcIilcbiAgICBmaW5kKCRlbGVtZW50LCAnW2FudC1jb3VudGVyLWZvcl0nLCB0cnVlKS5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgJGN0YUNvdW50ZXIgPSAkKHRoaXMpO1xuICAgICAgICAkY3RhQ291bnRlci5hZGRDbGFzcygnbm8tYW50Jyk7IC8vIGRvbid0IHNob3cgdGhlIG5vcm1hbCByZWFjdGlvbiBhZmZvcmRhbmNlIG9uIGEgY3RhIGNvdW50ZXJcbiAgICAgICAgdmFyIGFudEl0ZW1JZCA9ICRjdGFDb3VudGVyLmF0dHIoJ2FudC1jb3VudGVyLWZvcicpLnRyaW0oKTtcbiAgICAgICAgY3RhQ291bnRlcnNbYW50SXRlbUlkXSA9IGN0YUNvdW50ZXJzW2FudEl0ZW1JZF0gfHwgW107XG4gICAgICAgIGN0YUNvdW50ZXJzW2FudEl0ZW1JZF0ucHVzaCgkY3RhQ291bnRlcik7XG4gICAgfSk7XG5cbiAgICB2YXIgY3RhRXhwYW5kZWRSZWFjdGlvbnMgPSB7fTsgLy8gT3B0aW9uYWwgZWxlbWVudHMgdGhhdCBzaG93IGV4cGFuZGVkIHJlYWN0aW9ucyBmb3IgdGhlIGN0YSAoZS5nLiBcIkludGVyZXN0aW5nICgxNSkgTm8gdGhhbmtzICgxMClcIilcbiAgICBmaW5kKCRlbGVtZW50LCAnW2FudC1leHBhbmRlZC1yZWFjdGlvbnMtZm9yXScsIHRydWUpLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkY3RhRXhwYW5kZWRSZWFjdGlvbkFyZWEgPSAkKHRoaXMpO1xuICAgICAgICAkY3RhRXhwYW5kZWRSZWFjdGlvbkFyZWEuYWRkQ2xhc3MoJ25vLWFudCcpOyAvLyBkb24ndCBzaG93IHRoZSBub3JtYWwgcmVhY3Rpb24gYWZmb3JkYW5jZSBvbiBhIGN0YSBjb3VudGVyXG4gICAgICAgIHZhciBhbnRJdGVtSWQgPSAkY3RhRXhwYW5kZWRSZWFjdGlvbkFyZWEuYXR0cignYW50LWV4cGFuZGVkLXJlYWN0aW9ucy1mb3InKS50cmltKCk7XG4gICAgICAgIGN0YUV4cGFuZGVkUmVhY3Rpb25zW2FudEl0ZW1JZF0gPSBjdGFFeHBhbmRlZFJlYWN0aW9uc1thbnRJdGVtSWRdIHx8IFtdO1xuICAgICAgICBjdGFFeHBhbmRlZFJlYWN0aW9uc1thbnRJdGVtSWRdLnB1c2goJGN0YUV4cGFuZGVkUmVhY3Rpb25BcmVhKTtcbiAgICB9KTtcblxuICAgIHZhciAkY3RhRWxlbWVudHMgPSBmaW5kKCRlbGVtZW50LCAnW2FudC1jdGEtZm9yXScpOyAvLyBUaGUgY2FsbCB0byBhY3Rpb24gZWxlbWVudHMgd2hpY2ggcHJvbXB0IHRoZSB1c2VyIHRvIHJlYWN0XG4gICAgJGN0YUVsZW1lbnRzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkY3RhRWxlbWVudCA9ICQodGhpcyk7XG4gICAgICAgIHZhciBhbnRJdGVtSWQgPSAkY3RhRWxlbWVudC5hdHRyKCdhbnQtY3RhLWZvcicpO1xuICAgICAgICB2YXIgJHRhcmdldEVsZW1lbnQgPSBjdGFUYXJnZXRzW2FudEl0ZW1JZF07XG4gICAgICAgIGlmICgkdGFyZ2V0RWxlbWVudCkge1xuICAgICAgICAgICAgdmFyIGhhc2ggPSBjb21wdXRlSGFzaCgkdGFyZ2V0RWxlbWVudCwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgdmFyIGNvbnRlbnREYXRhID0gY29tcHV0ZUNvbnRlbnREYXRhKCR0YXJnZXRFbGVtZW50LCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgIGlmIChoYXNoICYmIGNvbnRlbnREYXRhKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNvbnRhaW5lckRhdGEgPSBQYWdlRGF0YS5nZXRDb250YWluZXJEYXRhKHBhZ2VEYXRhLCBoYXNoKTtcbiAgICAgICAgICAgICAgICBjb250YWluZXJEYXRhLnR5cGUgPSBjb21wdXRlRWxlbWVudFR5cGUoJHRhcmdldEVsZW1lbnQpOyAvLyBUT0RPOiByZXZpc2l0IHdoZXRoZXIgaXQgbWFrZXMgc2Vuc2UgdG8gc2V0IHRoZSB0eXBlIGhlcmVcbiAgICAgICAgICAgICAgICB2YXIgY2FsbFRvQWN0aW9uID0gQ2FsbFRvQWN0aW9uSW5kaWNhdG9yLmNyZWF0ZSh7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lckRhdGE6IGNvbnRhaW5lckRhdGEsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lckVsZW1lbnQ6ICR0YXJnZXRFbGVtZW50LFxuICAgICAgICAgICAgICAgICAgICBjb250ZW50RGF0YTogY29udGVudERhdGEsXG4gICAgICAgICAgICAgICAgICAgIGN0YUVsZW1lbnQ6ICRjdGFFbGVtZW50LFxuICAgICAgICAgICAgICAgICAgICBjdGFMYWJlbHM6IGN0YUxhYmVsc1thbnRJdGVtSWRdLFxuICAgICAgICAgICAgICAgICAgICBjdGFDb3VudGVyczogY3RhQ291bnRlcnNbYW50SXRlbUlkXSxcbiAgICAgICAgICAgICAgICAgICAgY3RhRXhwYW5kZWRSZWFjdGlvbnM6IGN0YUV4cGFuZGVkUmVhY3Rpb25zW2FudEl0ZW1JZF0sXG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHRSZWFjdGlvbnM6IGdyb3VwU2V0dGluZ3MuZGVmYXVsdFJlYWN0aW9ucygkdGFyZ2V0RWxlbWVudCksXG4gICAgICAgICAgICAgICAgICAgIHBhZ2VEYXRhOiBwYWdlRGF0YSxcbiAgICAgICAgICAgICAgICAgICAgZ3JvdXBTZXR0aW5nczogZ3JvdXBTZXR0aW5nc1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNyZWF0ZWRXaWRnZXRzLnB1c2goY2FsbFRvQWN0aW9uKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pXG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUF1dG9DYWxsc1RvQWN0aW9uKCRzZWN0aW9uLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciAkY3RhVGFyZ2V0cyA9IGZpbmQoJHNlY3Rpb24sIGdyb3VwU2V0dGluZ3MuZ2VuZXJhdGVkQ3RhU2VsZWN0b3IoKSk7XG4gICAgJGN0YVRhcmdldHMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRjdGFUYXJnZXQgPSAkKHRoaXMpO1xuICAgICAgICB2YXIgYW50SXRlbUlkID0gZ2VuZXJhdGVBbnRJdGVtQXR0cmlidXRlKCk7XG4gICAgICAgICRjdGFUYXJnZXQuYXR0cignYW50LWl0ZW0nLCBhbnRJdGVtSWQpO1xuICAgICAgICB2YXIgYXV0b0N0YSA9IEF1dG9DYWxsVG9BY3Rpb24uY3JlYXRlKGFudEl0ZW1JZCwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAkY3RhVGFyZ2V0LmFmdGVyKGF1dG9DdGEuZWxlbWVudCk7IC8vIFRPRE86IG1ha2UgdGhlIGluc2VydCBiZWhhdmlvciBjb25maWd1cmFibGUgbGlrZSB0aGUgc3VtbWFyeVxuICAgICAgICBjcmVhdGVkV2lkZ2V0cy5wdXNoKGF1dG9DdGEpO1xuICAgIH0pO1xufVxuXG52YXIgZ2VuZXJhdGVBbnRJdGVtQXR0cmlidXRlID0gZnVuY3Rpb24oaW5kZXgpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiAnYW50ZW5uYV9hdXRvX2N0YV8nICsgaW5kZXgrKztcbiAgICB9XG59KDApO1xuXG5mdW5jdGlvbiBzY2FuRm9yQ29udGVudCgkZWxlbWVudCwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgJGNvbnRlbnRFbGVtZW50cyA9IGZpbmQoJGVsZW1lbnQsIGdyb3VwU2V0dGluZ3MuY29udGVudFNlbGVjdG9yKCksIHRydWUpO1xuICAgICRjb250ZW50RWxlbWVudHMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRjb250ZW50RWxlbWVudCA9ICQodGhpcyk7XG4gICAgICAgIHZhciB0eXBlID0gY29tcHV0ZUVsZW1lbnRUeXBlKCRjb250ZW50RWxlbWVudCk7XG4gICAgICAgIHN3aXRjaCh0eXBlKSB7XG4gICAgICAgICAgICBjYXNlIFRZUEVfSU1BR0U6XG4gICAgICAgICAgICBjYXNlIFRZUEVfTUVESUE6XG4gICAgICAgICAgICAgICAgc2Nhbk1lZGlhKCRjb250ZW50RWxlbWVudCwgdHlwZSwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBUWVBFX1RFWFQ6XG4gICAgICAgICAgICAgICAgc2NhblRleHQoJGNvbnRlbnRFbGVtZW50LCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gc2NhblRleHQoJHRleHRFbGVtZW50LCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIGlmIChzaG91bGRIYXNoVGV4dCgkdGV4dEVsZW1lbnQsIGdyb3VwU2V0dGluZ3MpKSB7XG4gICAgICAgIHZhciBoYXNoID0gY29tcHV0ZUhhc2goJHRleHRFbGVtZW50LCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIGlmIChoYXNoKSB7XG4gICAgICAgICAgICB2YXIgY29udGFpbmVyRGF0YSA9IFBhZ2VEYXRhLmdldENvbnRhaW5lckRhdGEocGFnZURhdGEsIGhhc2gpO1xuICAgICAgICAgICAgY29udGFpbmVyRGF0YS50eXBlID0gJ3RleHQnOyAvLyBUT0RPOiByZXZpc2l0IHdoZXRoZXIgaXQgbWFrZXMgc2Vuc2UgdG8gc2V0IHRoZSB0eXBlIGhlcmVcbiAgICAgICAgICAgIHZhciBkZWZhdWx0UmVhY3Rpb25zID0gZ3JvdXBTZXR0aW5ncy5kZWZhdWx0UmVhY3Rpb25zKCR0ZXh0RWxlbWVudCk7XG4gICAgICAgICAgICB2YXIgdGV4dEluZGljYXRvciA9IFRleHRJbmRpY2F0b3JXaWRnZXQuY3JlYXRlKHtcbiAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyRGF0YTogY29udGFpbmVyRGF0YSxcbiAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyRWxlbWVudDogJHRleHRFbGVtZW50LFxuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0UmVhY3Rpb25zOiBkZWZhdWx0UmVhY3Rpb25zLFxuICAgICAgICAgICAgICAgICAgICBwYWdlRGF0YTogcGFnZURhdGEsXG4gICAgICAgICAgICAgICAgICAgIGdyb3VwU2V0dGluZ3M6IGdyb3VwU2V0dGluZ3NcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgdmFyICRpbmRpY2F0b3JFbGVtZW50ID0gdGV4dEluZGljYXRvci5lbGVtZW50O1xuICAgICAgICAgICAgdmFyIGxhc3ROb2RlID0gbGFzdENvbnRlbnROb2RlKCR0ZXh0RWxlbWVudC5nZXQoMCkpO1xuICAgICAgICAgICAgaWYgKGxhc3ROb2RlLm5vZGVUeXBlICE9PSAzKSB7XG4gICAgICAgICAgICAgICAgJChsYXN0Tm9kZSkuYmVmb3JlKCRpbmRpY2F0b3JFbGVtZW50KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgJHRleHRFbGVtZW50LmFwcGVuZCgkaW5kaWNhdG9yRWxlbWVudCk7IC8vIFRPRE8gaXMgdGhpcyBjb25maWd1cmFibGUgYWxhIGluc2VydENvbnRlbnQoLi4uKT9cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNyZWF0ZWRXaWRnZXRzLnB1c2godGV4dEluZGljYXRvcik7XG5cbiAgICAgICAgICAgIHZhciB0ZXh0UmVhY3Rpb25zID0gVGV4dFJlYWN0aW9ucy5jcmVhdGVSZWFjdGFibGVUZXh0KHtcbiAgICAgICAgICAgICAgICBjb250YWluZXJEYXRhOiBjb250YWluZXJEYXRhLFxuICAgICAgICAgICAgICAgIGNvbnRhaW5lckVsZW1lbnQ6ICR0ZXh0RWxlbWVudCxcbiAgICAgICAgICAgICAgICBkZWZhdWx0UmVhY3Rpb25zOiBkZWZhdWx0UmVhY3Rpb25zLFxuICAgICAgICAgICAgICAgIHBhZ2VEYXRhOiBwYWdlRGF0YSxcbiAgICAgICAgICAgICAgICBncm91cFNldHRpbmdzOiBncm91cFNldHRpbmdzLFxuICAgICAgICAgICAgICAgIGV4Y2x1ZGVOb2RlOiAkaW5kaWNhdG9yRWxlbWVudC5nZXQoMClcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY3JlYXRlZFdpZGdldHMucHVzaCh0ZXh0UmVhY3Rpb25zKTtcblxuICAgICAgICAgICAgTXV0YXRpb25PYnNlcnZlci5hZGRPbmVUaW1lRWxlbWVudFJlbW92YWxMaXN0ZW5lcigkdGV4dEVsZW1lbnQuZ2V0KDApLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBIYXNoZWRFbGVtZW50cy5yZW1vdmVFbGVtZW50KGhhc2gsIHBhZ2VEYXRhLnBhZ2VIYXNoLCAkdGV4dEVsZW1lbnQpO1xuICAgICAgICAgICAgICAgIHRleHRJbmRpY2F0b3IudGVhcmRvd24oKTtcbiAgICAgICAgICAgICAgICB0ZXh0UmVhY3Rpb25zLnRlYXJkb3duKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIFdlIHVzZSB0aGlzIHRvIGhhbmRsZSB0aGUgY2FzZSBvZiB0ZXh0IGNvbnRlbnQgdGhhdCBlbmRzIHdpdGggc29tZSBub24tdGV4dCBub2RlIGFzIGluXG4gICAgLy8gPHA+TXkgdGV4dC4gPGltZyBzcmM9XCJ3aGF0ZXZlclwiPjwvcD4gb3JcbiAgICAvLyA8cD5NeSBsb25nIHBhcmFncmFwaCB0ZXh0IHdpdGggYSBjb21tb24gQ01TIHByb2JsZW0uPGJyPjwvcD5cbiAgICAvLyBUaGlzIGlzIGEgc2ltcGxpc3RpYyBhbGdvcml0aG0sIG5vdCBhIGdlbmVyYWwgc29sdXRpb246XG4gICAgLy8gV2Ugd2FsayB0aGUgRE9NIGluc2lkZSB0aGUgZ2l2ZW4gbm9kZSBhbmQga2VlcCB0cmFjayBvZiB0aGUgbGFzdCBcImNvbnRlbnRcIiBub2RlIHRoYXQgd2UgZW5jb3VudGVyLCB3aGljaCBjb3VsZCBiZSBlaXRoZXJcbiAgICAvLyB0ZXh0IG9yIHNvbWUgbWVkaWEuICBJZiB0aGUgbGFzdCBjb250ZW50IG5vZGUgaXMgbm90IHRleHQsIHdlIHdhbnQgdG8gaW5zZXJ0IHRoZSB0ZXh0IGluZGljYXRvciBiZWZvcmUgdGhlIG1lZGlhLlxuICAgIGZ1bmN0aW9uIGxhc3RDb250ZW50Tm9kZShub2RlKSB7XG4gICAgICAgIHZhciBsYXN0Tm9kZTtcbiAgICAgICAgdmFyIGNoaWxkTm9kZXMgPSBub2RlLmNoaWxkTm9kZXM7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGROb2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGNoaWxkID0gY2hpbGROb2Rlc1tpXTtcbiAgICAgICAgICAgIGlmIChjaGlsZC5ub2RlVHlwZSA9PT0gMykge1xuICAgICAgICAgICAgICAgIGxhc3ROb2RlID0gY2hpbGQ7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNoaWxkLm5vZGVUeXBlID09PSAxKSB7XG4gICAgICAgICAgICAgICAgdmFyIHRhZ05hbWUgPSBjaGlsZC50YWdOYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICAgICAgc3dpdGNoICh0YWdOYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2ltZyc6XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2lmcmFtZSc6XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ3ZpZGVvJzpcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnaWZyYW1lJzpcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnYnInOlxuICAgICAgICAgICAgICAgICAgICAgICAgbGFzdE5vZGUgPSBjaGlsZDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsYXN0Tm9kZSA9IGxhc3RDb250ZW50Tm9kZShjaGlsZCkgfHwgbGFzdE5vZGU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGxhc3ROb2RlO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gc2hvdWxkSGFzaFRleHQoJHRleHRFbGVtZW50LCBncm91cFNldHRpbmdzKSB7XG4gICAgaWYgKChpc0N0YSgkdGV4dEVsZW1lbnQsIGdyb3VwU2V0dGluZ3MpKSkge1xuICAgICAgICAvLyBEb24ndCBoYXNoIHRoZSB0ZXh0IGlmIGl0IGlzIHRoZSB0YXJnZXQgb2YgYSBDVEEuXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgLy8gRG9uJ3QgY3JlYXRlIGFuIGluZGljYXRvciBmb3IgdGV4dCBlbGVtZW50cyB0aGF0IGNvbnRhaW4gb3RoZXIgdGV4dCBub2Rlcy5cbiAgICB2YXIgJG5lc3RlZEVsZW1lbnRzID0gZmluZCgkdGV4dEVsZW1lbnQsIGdyb3VwU2V0dGluZ3MuY29udGVudFNlbGVjdG9yKCkpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgJG5lc3RlZEVsZW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmICgoY29tcHV0ZUVsZW1lbnRUeXBlKCQoJG5lc3RlZEVsZW1lbnRzW2ldKSkgPT09IFRZUEVfVEVYVCkpIHtcbiAgICAgICAgICAgIC8vIERvbid0IGhhc2ggYSB0ZXh0IGVsZW1lbnQgaWYgaXQgY29udGFpbnMgYW55IG90aGVyIG1hdGNoZWQgdGV4dCBlbGVtZW50c1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiBpc0N0YSgkZWxlbWVudCwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBjb21wb3NpdGVTZWxlY3RvciA9IGdyb3VwU2V0dGluZ3MuZ2VuZXJhdGVkQ3RhU2VsZWN0b3IoKSArICcsW2FudC1pdGVtXSc7XG4gICAgcmV0dXJuICRlbGVtZW50LmlzKGNvbXBvc2l0ZVNlbGVjdG9yKTtcbn1cblxuLy8gVGhlIFwiaW1hZ2VcIiBhbmQgXCJtZWRpYVwiIHBhdGhzIGNvbnZlcmdlIGhlcmUsIGJlY2F1c2Ugd2UgdXNlIHRoZSBzYW1lIGluZGljYXRvciBtb2R1bGUgZm9yIHRoZW0gYm90aC5cbmZ1bmN0aW9uIHNjYW5NZWRpYSgkbWVkaWFFbGVtZW50LCB0eXBlLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBpbmRpY2F0b3I7XG4gICAgdmFyIGNvbnRlbnREYXRhID0gY29tcHV0ZUNvbnRlbnREYXRhKCRtZWRpYUVsZW1lbnQsIGdyb3VwU2V0dGluZ3MpO1xuICAgIGlmIChjb250ZW50RGF0YSAmJiBjb250ZW50RGF0YS5kaW1lbnNpb25zKSB7XG4gICAgICAgIGlmIChjb250ZW50RGF0YS5kaW1lbnNpb25zLmhlaWdodCA+PSAxMDAgJiYgY29udGVudERhdGEuZGltZW5zaW9ucy53aWR0aCA+PSAxMDApIHsgLy8gRG9uJ3QgY3JlYXRlIGluZGljYXRvciBvbiBlbGVtZW50cyB0aGF0IGFyZSB0b28gc21hbGxcbiAgICAgICAgICAgIHZhciBoYXNoID0gY29tcHV0ZUhhc2goJG1lZGlhRWxlbWVudCwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgaWYgKGhhc2gpIHtcbiAgICAgICAgICAgICAgICB2YXIgY29udGFpbmVyRGF0YSA9IFBhZ2VEYXRhLmdldENvbnRhaW5lckRhdGEocGFnZURhdGEsIGhhc2gpO1xuICAgICAgICAgICAgICAgIGNvbnRhaW5lckRhdGEudHlwZSA9IHR5cGUgPT09IFRZUEVfSU1BR0UgPyAnaW1hZ2UnIDogJ21lZGlhJztcbiAgICAgICAgICAgICAgICB2YXIgZGVmYXVsdFJlYWN0aW9ucyA9IGdyb3VwU2V0dGluZ3MuZGVmYXVsdFJlYWN0aW9ucygkbWVkaWFFbGVtZW50KTtcbiAgICAgICAgICAgICAgICBpbmRpY2F0b3IgPSBNZWRpYUluZGljYXRvcldpZGdldC5jcmVhdGUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudDogV2lkZ2V0QnVja2V0LmdldCgpLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyRGF0YTogY29udGFpbmVyRGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnREYXRhOiBjb250ZW50RGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lckVsZW1lbnQ6ICRtZWRpYUVsZW1lbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0UmVhY3Rpb25zOiBkZWZhdWx0UmVhY3Rpb25zLFxuICAgICAgICAgICAgICAgICAgICAgICAgcGFnZURhdGE6IHBhZ2VEYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgZ3JvdXBTZXR0aW5nczogZ3JvdXBTZXR0aW5nc1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBjcmVhdGVkV2lkZ2V0cy5wdXNoKGluZGljYXRvcik7XG5cbiAgICAgICAgICAgICAgICBNdXRhdGlvbk9ic2VydmVyLmFkZE9uZVRpbWVFbGVtZW50UmVtb3ZhbExpc3RlbmVyKCRtZWRpYUVsZW1lbnQuZ2V0KDApLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgSGFzaGVkRWxlbWVudHMucmVtb3ZlRWxlbWVudChoYXNoLCBwYWdlRGF0YS5wYWdlSGFzaCwgJG1lZGlhRWxlbWVudCk7XG4gICAgICAgICAgICAgICAgICAgIGluZGljYXRvci50ZWFyZG93bigpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIC8vIExpc3RlbiBmb3IgY2hhbmdlcyB0byB0aGUgaW1hZ2UgYXR0cmlidXRlcyB3aGljaCBjb3VsZCBpbmRpY2F0ZSBjb250ZW50IGNoYW5nZXMuXG4gICAgTXV0YXRpb25PYnNlcnZlci5hZGRPbmVUaW1lQXR0cmlidXRlTGlzdGVuZXIoJG1lZGlhRWxlbWVudC5nZXQoMCksIFsnc3JjJywnYW50LWl0ZW0tY29udGVudCcsJ2RhdGEnXSwgZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmIChpbmRpY2F0b3IpIHtcbiAgICAgICAgICAgIC8vIFRPRE86IHVwZGF0ZSBIYXNoZWRFbGVtZW50cyB0byByZW1vdmUgdGhlIHByZXZpb3VzIGhhc2gtPmVsZW1lbnQgbWFwcGluZy4gQ29uc2lkZXIgdGhlcmUgY291bGQgYmUgbXVsdGlwbGVcbiAgICAgICAgICAgIC8vICAgICAgIGluc3RhbmNlcyBvZiB0aGUgc2FtZSBlbGVtZW50IG9uIGEgcGFnZS4uLiBzbyB3ZSBtaWdodCBuZWVkIHRvIHVzZSBhIGNvdW50ZXIuXG4gICAgICAgICAgICBpbmRpY2F0b3IudGVhcmRvd24oKTtcbiAgICAgICAgfVxuICAgICAgICBzY2FuTWVkaWEoJG1lZGlhRWxlbWVudCwgdHlwZSwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBmaW5kKCRlbGVtZW50LCBzZWxlY3RvciwgYWRkQmFjaywgaWdub3JlTm9BbnQpIHtcbiAgICB2YXIgcmVzdWx0ID0gJGVsZW1lbnQuZmluZChzZWxlY3Rvcik7XG4gICAgaWYgKGFkZEJhY2sgJiYgc2VsZWN0b3IpIHsgLy8gd2l0aCBhbiB1bmRlZmluZWQgc2VsZWN0b3IsIGFkZEJhY2sgd2lsbCBtYXRjaCBhbmQgYWx3YXlzIHJldHVybiB0aGUgaW5wdXQgZWxlbWVudCAodW5saWtlIGZpbmQoKSB3aGljaCByZXR1cm5zIGFuIGVtcHR5IG1hdGNoKVxuICAgICAgICByZXN1bHQgPSByZXN1bHQuYWRkQmFjayhzZWxlY3Rvcik7XG4gICAgfVxuICAgIGlmIChpZ25vcmVOb0FudCkgeyAvLyBTb21lIHBpZWNlcyBvZiBjb250ZW50IChlLmcuIHRoZSBzdW1tYXJ5IHdpZGdldCkgY2FuIGFjdHVhbGx5IGdvIGluc2lkZSBzZWN0aW9ucyB0YWdnZWQgbm8tYW50XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQuZmlsdGVyKGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gJCh0aGlzKS5jbG9zZXN0KCcubm8tYW50JykubGVuZ3RoID09IDA7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGluc2VydENvbnRlbnQoJHBhcmVudCwgY29udGVudCwgbWV0aG9kKSB7XG4gICAgc3dpdGNoIChtZXRob2QpIHtcbiAgICAgICAgY2FzZSAnYXBwZW5kJzpcbiAgICAgICAgICAgICRwYXJlbnQuYXBwZW5kKGNvbnRlbnQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3ByZXBlbmQnOlxuICAgICAgICAgICAgJHBhcmVudC5wcmVwZW5kKGNvbnRlbnQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2JlZm9yZSc6XG4gICAgICAgICAgICAkcGFyZW50LmJlZm9yZShjb250ZW50KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdhZnRlcic6XG4gICAgICAgICAgICAkcGFyZW50LmFmdGVyKGNvbnRlbnQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBjb21wdXRlSGFzaCgkZWxlbWVudCwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgaGFzaDtcbiAgICBzd2l0Y2ggKGNvbXB1dGVFbGVtZW50VHlwZSgkZWxlbWVudCkpIHtcbiAgICAgICAgY2FzZSBUWVBFX0lNQUdFOlxuICAgICAgICAgICAgdmFyIGltYWdlVXJsID0gVVJMcy5jb21wdXRlSW1hZ2VVcmwoJGVsZW1lbnQsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgaGFzaCA9IEhhc2guaGFzaEltYWdlKGltYWdlVXJsLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFRZUEVfTUVESUE6XG4gICAgICAgICAgICB2YXIgbWVkaWFVcmwgPSBVUkxzLmNvbXB1dGVNZWRpYVVybCgkZWxlbWVudCwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICBoYXNoID0gSGFzaC5oYXNoTWVkaWEobWVkaWFVcmwsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgVFlQRV9URVhUOlxuICAgICAgICAgICAgaGFzaCA9IEhhc2guaGFzaFRleHQoJGVsZW1lbnQpO1xuICAgICAgICAgICAgdmFyIGluY3JlbWVudCA9IDE7XG4gICAgICAgICAgICB3aGlsZSAoaGFzaCAmJiBIYXNoZWRFbGVtZW50cy5nZXRFbGVtZW50KGhhc2gsIHBhZ2VEYXRhLnBhZ2VIYXNoKSkge1xuICAgICAgICAgICAgICAgIGhhc2ggPSBIYXNoLmhhc2hUZXh0KCRlbGVtZW50LCBpbmNyZW1lbnQrKyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICB9XG4gICAgaWYgKGhhc2gpIHtcbiAgICAgICAgSGFzaGVkRWxlbWVudHMuc2V0RWxlbWVudChoYXNoLCBwYWdlRGF0YS5wYWdlSGFzaCwgJGVsZW1lbnQpOyAvLyBSZWNvcmQgdGhlIHJlbGF0aW9uc2hpcCBiZXR3ZWVuIHRoZSBoYXNoIGFuZCBkb20gZWxlbWVudC5cbiAgICAgICAgaWYgKEFwcE1vZGUuZGVidWcpIHtcbiAgICAgICAgICAgICRlbGVtZW50LmF0dHIoQVRUUl9IQVNILCBoYXNoKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gaGFzaDtcbn1cblxuZnVuY3Rpb24gY29tcHV0ZUNvbnRlbnREYXRhKCRlbGVtZW50LCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGNvbnRlbnREYXRhO1xuICAgIHN3aXRjaCAoY29tcHV0ZUVsZW1lbnRUeXBlKCRlbGVtZW50KSkge1xuICAgICAgICBjYXNlIFRZUEVfSU1BR0U6XG4gICAgICAgICAgICB2YXIgaW1hZ2VVcmwgPSBVUkxzLmNvbXB1dGVJbWFnZVVybCgkZWxlbWVudCwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICB2YXIgaW1hZ2VEaW1lbnNpb25zID0ge1xuICAgICAgICAgICAgICAgIGhlaWdodDogcGFyc2VJbnQoJGVsZW1lbnQuYXR0cignaGVpZ2h0JykpIHx8ICRlbGVtZW50LmhlaWdodCgpIHx8IDAsXG4gICAgICAgICAgICAgICAgd2lkdGg6IHBhcnNlSW50KCRlbGVtZW50LmF0dHIoJ3dpZHRoJykpIHx8ICRlbGVtZW50LndpZHRoKCkgfHwgMFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGNvbnRlbnREYXRhID0ge1xuICAgICAgICAgICAgICAgIHR5cGU6ICdpbWcnLFxuICAgICAgICAgICAgICAgIGJvZHk6IGltYWdlVXJsLFxuICAgICAgICAgICAgICAgIGRpbWVuc2lvbnM6IGltYWdlRGltZW5zaW9uc1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFRZUEVfTUVESUE6XG4gICAgICAgICAgICB2YXIgbWVkaWFVcmwgPSBVUkxzLmNvbXB1dGVNZWRpYVVybCgkZWxlbWVudCwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICB2YXIgbWVkaWFEaW1lbnNpb25zID0ge1xuICAgICAgICAgICAgICAgIGhlaWdodDogcGFyc2VJbnQoJGVsZW1lbnQuYXR0cignaGVpZ2h0JykpIHx8ICRlbGVtZW50LmhlaWdodCgpIHx8IDAsXG4gICAgICAgICAgICAgICAgd2lkdGg6IHBhcnNlSW50KCRlbGVtZW50LmF0dHIoJ3dpZHRoJykpIHx8ICRlbGVtZW50LndpZHRoKCkgfHwgMFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGNvbnRlbnREYXRhID0ge1xuICAgICAgICAgICAgICAgIHR5cGU6ICdtZWRpYScsXG4gICAgICAgICAgICAgICAgYm9keTogbWVkaWFVcmwsXG4gICAgICAgICAgICAgICAgZGltZW5zaW9uczogbWVkaWFEaW1lbnNpb25zXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgVFlQRV9URVhUOlxuICAgICAgICAgICAgY29udGVudERhdGEgPSB7IHR5cGU6ICd0ZXh0JyB9O1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIHJldHVybiBjb250ZW50RGF0YTtcbn1cblxuZnVuY3Rpb24gY29tcHV0ZUVsZW1lbnRUeXBlKCRlbGVtZW50KSB7XG4gICAgdmFyIGl0ZW1UeXBlID0gJGVsZW1lbnQuYXR0cignYW50LWl0ZW0tdHlwZScpO1xuICAgIGlmIChpdGVtVHlwZSAmJiBpdGVtVHlwZS50cmltKCkubGVuZ3RoID4gMCkge1xuICAgICAgICByZXR1cm4gaXRlbVR5cGUudHJpbSgpO1xuICAgIH1cbiAgICB2YXIgdGFnTmFtZSA9ICRlbGVtZW50LnByb3AoJ3RhZ05hbWUnKS50b0xvd2VyQ2FzZSgpO1xuICAgIHN3aXRjaCAodGFnTmFtZSkge1xuICAgICAgICBjYXNlICdpbWcnOlxuICAgICAgICAgICAgcmV0dXJuIFRZUEVfSU1BR0U7XG4gICAgICAgIGNhc2UgJ3ZpZGVvJzpcbiAgICAgICAgY2FzZSAnaWZyYW1lJzpcbiAgICAgICAgY2FzZSAnZW1iZWQnOlxuICAgICAgICAgICAgcmV0dXJuIFRZUEVfTUVESUE7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICByZXR1cm4gVFlQRV9URVhUO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gc2V0dXBNdXRhdGlvbk9ic2VydmVyKGdyb3VwU2V0dGluZ3MsIHJlaW5pdGlhbGl6ZUNhbGxiYWNrKSB7XG4gICAgdmFyIGNvdWxkQmVTaW5nbGVQYWdlQXBwID0gdHJ1ZTtcbiAgICB2YXIgb3JpZ2luYWxQYXRobmFtZSA9IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZTtcbiAgICB2YXIgb3JpZ2luYWxTZWFyY2ggPSB3aW5kb3cubG9jYXRpb24uc2VhcmNoO1xuICAgIE11dGF0aW9uT2JzZXJ2ZXIuYWRkQWRkaXRpb25MaXN0ZW5lcihlbGVtZW50c0FkZGVkKTtcblxuICAgIGZ1bmN0aW9uIGVsZW1lbnRzQWRkZWQoJGVsZW1lbnRzKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgJGVsZW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgJGVsZW1lbnQgPSAkZWxlbWVudHNbaV07XG4gICAgICAgICAgICAkZWxlbWVudC5maW5kKGdyb3VwU2V0dGluZ3MuZXhjbHVzaW9uU2VsZWN0b3IoKSkuYWRkQmFjayhncm91cFNldHRpbmdzLmV4Y2x1c2lvblNlbGVjdG9yKCkpLmFkZENsYXNzKCduby1hbnQnKTsgLy8gQWRkIHRoZSBuby1hbnQgY2xhc3MgdG8gZXZlcnl0aGluZyB0aGF0IGlzIGZsYWdnZWQgZm9yIGV4Y2x1c2lvblxuICAgICAgICAgICAgaWYgKCRlbGVtZW50LmNsb3Nlc3QoJy5uby1hbnQnKS5sZW5ndGggPT09IDApIHsgLy8gSWdub3JlIGFueXRoaW5nIHRhZ2dlZCBuby1hbnRcbiAgICAgICAgICAgICAgICAvLyBGaXJzdCwgc2VlIGlmIGFueSBlbnRpcmUgcGFnZXMgd2VyZSBhZGRlZFxuICAgICAgICAgICAgICAgIHZhciAkcGFnZXMgPSBmaW5kKCRlbGVtZW50LCBncm91cFNldHRpbmdzLnBhZ2VTZWxlY3RvcigpLCB0cnVlKTtcbiAgICAgICAgICAgICAgICBpZiAoJHBhZ2VzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgUGFnZURhdGFMb2FkZXIucGFnZXNBZGRlZCgkcGFnZXMsIGdyb3VwU2V0dGluZ3MpOyAvLyBUT0RPOiBjb25zaWRlciBpZiB0aGVyZSdzIGEgYmV0dGVyIHdheSB0byBhcmNoaXRlY3QgdGhpc1xuICAgICAgICAgICAgICAgICAgICAkcGFnZXMuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzY2FuUGFnZSgkKHRoaXMpLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIC8vIElmIGFuIGVudGlyZSBwYWdlIGlzIGFkZGVkLCBhc3N1bWUgdGhhdCB0aGlzIGlzIGFuIFwiaW5maW5pdGUgc2Nyb2xsXCIgc2l0ZSBhbmQgc3RvcCBjaGVja2luZyBmb3JcbiAgICAgICAgICAgICAgICAgICAgLy8gc2luZ2xlIHBhZ2UgYXBwcy4gVGhpcyBpcyBuZWNlc3NhcnkgYmVjYXVzZSBzb21lIGluZmluaXRlIHNjcm9sbCBzaXRlcyB1cGRhdGUgdGhlIGxvY2F0aW9uLCB3aGljaFxuICAgICAgICAgICAgICAgICAgICAvLyBjYW4gdHJpZ2dlciBhbiB1bm5lY2Vzc2FyeSByZWluaXRpYWxpemF0aW9uLlxuICAgICAgICAgICAgICAgICAgICBjb3VsZEJlU2luZ2xlUGFnZUFwcCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIElmIG5vdCBhbiBlbnRpcmUgcGFnZS9wYWdlcywgc2VlIGlmIGNvbnRlbnQgd2FzIGFkZGVkIHRvIGFuIGV4aXN0aW5nIHBhZ2VcbiAgICAgICAgICAgICAgICAgICAgdmFyICRwYWdlID0gJGVsZW1lbnQuY2xvc2VzdChncm91cFNldHRpbmdzLnBhZ2VTZWxlY3RvcigpKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCRwYWdlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHBhZ2UgPSAkKCdib2R5Jyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvdWxkQmVTaW5nbGVQYWdlQXBwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgJHBhZ2VJbmRpY2F0b3IgPSBmaW5kKCRwYWdlLCBncm91cFNldHRpbmdzLnBhZ2VVcmxTZWxlY3RvcigpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgkcGFnZUluZGljYXRvci5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBXaGVuZXZlciBuZXcgY29udGVudCBpcyBhZGRlZCwgY2hlY2sgaWYgd2UgbmVlZCB0byByZWluaXRpYWxpemUgYWxsIG91ciBkYXRhIGJhc2VkIG9uIHRoZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHdpbmRvdy5sb2NhdGlvbi4gVGhpcyBhY2NvbW9kYXRlcyBzaW5nbGUgcGFnZSBhcHBzIHRoYXQgZG9uJ3QgdXNlIGJyb3dzZXIgbmF2aWdhdGlvbi5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAoQXMgYW4gb3B0aW1pemF0aW9uLCB3ZSBkb24ndCBkbyB0aGlzIGNoZWNrIGlmIHRoZSBhZGRlZCBlbGVtZW50IGNvbnRhaW5zIGFuIGVudGlyZSBwYWdlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gd2l0aCBhIFVSTCBzcGVjaWZpZWQgaW5zaWRlIHRoZSBjb250ZW50LilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2hvdWxkUmVpbml0aWFsaXplRm9yTG9jYXRpb25DaGFuZ2UoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWluaXRpYWxpemVDYWxsYmFjayhncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB2YXIgdXJsID0gUGFnZVV0aWxzLmNvbXB1dGVQYWdlVXJsKCRwYWdlLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBhZ2VEYXRhID0gUGFnZURhdGEuZ2V0UGFnZURhdGFCeVVSTCh1cmwpO1xuICAgICAgICAgICAgICAgICAgICAvLyBGaXJzdCwgY2hlY2sgZm9yIGFueSBuZXcgc3VtbWFyeSB3aWRnZXRzLi4uXG4gICAgICAgICAgICAgICAgICAgIHNjYW5Gb3JTdW1tYXJpZXMoJGVsZW1lbnQsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgICAgICAgICAgc2NhbkZvclJlYWRNb3JlKCRlbGVtZW50LCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICAgICAgICAgIHNjYW5Gb3JDb250ZW50UmVjKCRlbGVtZW50LCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICAgICAgICAgIC8vIE5leHQsIHNlZSBpZiBhbnkgZW50aXJlIGFjdGl2ZSBzZWN0aW9ucyB3ZXJlIGFkZGVkXG4gICAgICAgICAgICAgICAgICAgIHZhciAkYWN0aXZlU2VjdGlvbnMgPSBmaW5kKCRlbGVtZW50LCBncm91cFNldHRpbmdzLmFjdGl2ZVNlY3Rpb25zKCksIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoJGFjdGl2ZVNlY3Rpb25zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRhY3RpdmVTZWN0aW9ucy5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgJHNlY3Rpb24gPSAkKHRoaXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNyZWF0ZUF1dG9DYWxsc1RvQWN0aW9uKCRzZWN0aW9uLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjYW5Gb3JDYWxsc1RvQWN0aW9uKCRlbGVtZW50LCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkYWN0aXZlU2VjdGlvbnMuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyICRzZWN0aW9uID0gJCh0aGlzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY2FuQWN0aXZlRWxlbWVudCgkc2VjdGlvbiwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBGaW5hbGx5LCBzY2FuIGluc2lkZSB0aGUgZWxlbWVudCBmb3IgY29udGVudFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyICRhY3RpdmVTZWN0aW9uID0gJGVsZW1lbnQuY2xvc2VzdChncm91cFNldHRpbmdzLmFjdGl2ZVNlY3Rpb25zKCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCRhY3RpdmVTZWN0aW9uLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjcmVhdGVBdXRvQ2FsbHNUb0FjdGlvbigkZWxlbWVudCwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjYW5Gb3JDYWxsc1RvQWN0aW9uKCRlbGVtZW50LCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NhbkFjdGl2ZUVsZW1lbnQoJGVsZW1lbnQsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGhlIGVsZW1lbnQgaXMgYWRkZWQgb3V0c2lkZSBhbiBhY3RpdmUgc2VjdGlvbiwganVzdCBjaGVjayBpdCBmb3IgQ1RBc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjYW5Gb3JDYWxsc1RvQWN0aW9uKCRlbGVtZW50LCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzaG91bGRSZWluaXRpYWxpemVGb3JMb2NhdGlvbkNoYW5nZSgpIHtcbiAgICAgICAgLy8gUmVpbml0aWFsaXplIHdoZW4gdGhlIGxvY2F0aW9uIGNoYW5nZXMgaW4gYSB3YXkgdGhhdCB3ZSBiZWxpZXZlIGlzIG1lYW5pbmdmdWwuXG4gICAgICAgIC8vIFRoZSBoZXVyaXN0aWMgd2UgdXNlIGlzIHRoYXQgZWl0aGVyOlxuICAgICAgICAvLyAxLiBUaGUgcXVlcnkgc3RyaW5nIGNoYW5nZXMgYW5kIHdlJ3JlIG9uIGEgc2l0ZSB0aGF0IHNheXMgdGhlIHF1ZXJ5IHN0cmluZyBtYXR0ZXJzIG9yXG4gICAgICAgIC8vIDIuIFRoZSBwYXRoIGNoYW5nZXMuLi5cbiAgICAgICAgLy8gICAgMmEuIEJ1dCBub3QgaWYgdGhlIGNoYW5nZSBpcyBhbiBleHRlbnNpb24gb2YgdGhlIHBhdGguXG4gICAgICAgIC8vICAgICAgICAyYWEuIFVubGVzcyB3ZSdyZSBnb2luZyBmcm9tIGFuIGVtcHR5IHBhdGggKCcvJykgdG8gc29tZSBvdGhlciBwYXRoLlxuICAgICAgICB2YXIgbmV3TG9jYXRpb25QYXRobmFtZSA9IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZTtcbiAgICAgICAgcmV0dXJuIGdyb3VwU2V0dGluZ3MudXJsLmluY2x1ZGVRdWVyeVN0cmluZygpICYmIG9yaWdpbmFsU2VhcmNoICE9IHdpbmRvdy5sb2NhdGlvbi5zZWFyY2ggfHxcbiAgICAgICAgICAgICAgICBuZXdMb2NhdGlvblBhdGhuYW1lICE9IG9yaWdpbmFsUGF0aG5hbWUgJiYgKG9yaWdpbmFsUGF0aG5hbWUgPT09ICcvJyB8fCBuZXdMb2NhdGlvblBhdGhuYW1lLmluZGV4T2Yob3JpZ2luYWxQYXRobmFtZSkgPT09IC0xKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHRlYXJkb3duKCkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY3JlYXRlZFdpZGdldHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY3JlYXRlZFdpZGdldHNbaV0udGVhcmRvd24oKTtcbiAgICB9XG4gICAgY3JlYXRlZFdpZGdldHMgPSBbXTtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHNjYW46IHNjYW5BbGxQYWdlcyxcbiAgICB0ZWFyZG93bjogdGVhcmRvd25cbn07IiwidmFyIFJhY3RpdmU7IHJlcXVpcmUoJy4vdXRpbHMvcmFjdGl2ZS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihsb2FkZWRSYWN0aXZlKSB7IFJhY3RpdmUgPSBsb2FkZWRSYWN0aXZlO30pO1xudmFyIFNWR3MgPSByZXF1aXJlKCcuL3N2Z3MnKTtcblxudmFyIHBhZ2VTZWxlY3RvciA9ICcuYW50ZW5uYS1wZW5kaW5nLXBhZ2UnO1xuXG5mdW5jdGlvbiBjcmVhdGVQYWdlKHJlYWN0aW9uVGV4dCwgZWxlbWVudCkge1xuICAgIHZhciByYWN0aXZlID0gUmFjdGl2ZSh7XG4gICAgICAgIGVsOiBlbGVtZW50LFxuICAgICAgICBhcHBlbmQ6IHRydWUsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIHRleHQ6IHJlYWN0aW9uVGV4dFxuICAgICAgICB9LFxuICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL3BlbmRpbmctcmVhY3Rpb24tcGFnZS5oYnMuaHRtbCcpLFxuICAgICAgICBwYXJ0aWFsczoge1xuICAgICAgICAgICAgbGVmdDogU1ZHcy5sZWZ0XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4ge1xuICAgICAgICBzZWxlY3RvcjogcGFnZVNlbGVjdG9yLFxuICAgICAgICB0ZWFyZG93bjogZnVuY3Rpb24oKSB7IHJhY3RpdmUudGVhcmRvd24oKTsgfVxuICAgIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZVBhZ2U6IGNyZWF0ZVBhZ2Vcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgUmFjdGl2ZTsgcmVxdWlyZSgnLi91dGlscy9yYWN0aXZlLXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGxvYWRlZFJhY3RpdmUpIHsgUmFjdGl2ZSA9IGxvYWRlZFJhY3RpdmU7fSk7XG52YXIgV2lkZ2V0QnVja2V0ID0gcmVxdWlyZSgnLi91dGlscy93aWRnZXQtYnVja2V0Jyk7XG52YXIgVHJhbnNpdGlvblV0aWwgPSByZXF1aXJlKCcuL3V0aWxzL3RyYW5zaXRpb24tdXRpbCcpO1xuXG52YXIgU1ZHcyA9IHJlcXVpcmUoJy4vc3ZncycpO1xuXG52YXIgcmFjdGl2ZTtcbnZhciBjbGlja0hhbmRsZXI7XG5cblxuZnVuY3Rpb24gZ2V0Um9vdEVsZW1lbnQoKSB7XG4gICAgLy8gVE9ETyByZXZpc2l0IHRoaXMsIGl0J3Mga2luZCBvZiBnb29meSBhbmQgaXQgbWlnaHQgaGF2ZSBhIHRpbWluZyBwcm9ibGVtXG4gICAgaWYgKCFyYWN0aXZlKSB7XG4gICAgICAgIHZhciBidWNrZXQgPSBXaWRnZXRCdWNrZXQuZ2V0KCk7XG4gICAgICAgIHJhY3RpdmUgPSBSYWN0aXZlKHtcbiAgICAgICAgICAgIGVsOiBidWNrZXQsXG4gICAgICAgICAgICBhcHBlbmQ6IHRydWUsXG4gICAgICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL3BvcHVwLXdpZGdldC5oYnMuaHRtbCcpLFxuICAgICAgICAgICAgcGFydGlhbHM6IHtcbiAgICAgICAgICAgICAgICBsb2dvOiBTVkdzLmxvZ29cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHZhciAkZWxlbWVudCA9ICQocmFjdGl2ZS5maW5kKCcuYW50ZW5uYS1wb3B1cCcpKTtcbiAgICAgICAgJGVsZW1lbnQub24oJ21vdXNlZG93bicsIGZhbHNlKTsgLy8gUHJldmVudCBtb3VzZWRvd24gZnJvbSBwcm9wYWdhdGluZywgc28gdGhlIGJyb3dzZXIgZG9lc24ndCBjbGVhciB0aGUgdGV4dCBzZWxlY3Rpb24uXG4gICAgICAgICRlbGVtZW50Lm9uKCdjbGljay5hbnRlbm5hLXBvcHVwJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIGhpZGVQb3B1cCgkZWxlbWVudCk7XG4gICAgICAgICAgICBpZiAoY2xpY2tIYW5kbGVyKSB7XG4gICAgICAgICAgICAgICAgY2xpY2tIYW5kbGVyKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBzZXR1cE1vdXNlT3ZlcigkZWxlbWVudCk7XG4gICAgICAgIHJldHVybiAkZWxlbWVudDtcbiAgICB9XG4gICAgcmV0dXJuICQocmFjdGl2ZS5maW5kKCcuYW50ZW5uYS1wb3B1cCcpKTtcbn1cblxuZnVuY3Rpb24gc2V0dXBNb3VzZU92ZXIoJGVsZW1lbnQpIHtcbiAgICB2YXIgY2xvc2VUaW1lcjtcblxuICAgIC8vIFRoZSA6aG92ZXIgcHNldWRvIGNsYXNzIGNhbiBiZWNvbWUgc3R1Y2sgb24gdGhlIGFudGVubmEtcG9wdXAgZWxlbWVudCB3aGVuIHdlIGJyaW5nIHVwIHRoZSByZWFjdGlvbiB3aW5kb3dcbiAgICAvLyBpbiByZXNwb25zZSB0byB0aGUgY2xpY2suIFNvIGhlcmUgd2UgYWRkL3JlbW92ZSBvdXIgb3duIGhvdmVyIGNsYXNzIGluc3RlYWQuXG4gICAgLy8gU2VlOiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzEwMzIxMjc1L2hvdmVyLXN0YXRlLWlzLXN0aWNreS1hZnRlci1lbGVtZW50LWlzLW1vdmVkLW91dC1mcm9tLXVuZGVyLXRoZS1tb3VzZS1pbi1hbGwtYnJcbiAgICB2YXIgaG92ZXJDbGFzcyA9ICdhbnRlbm5hLWhvdmVyJztcbiAgICAkZWxlbWVudC5vbignbW91c2VlbnRlcicsIGZ1bmN0aW9uKCkge1xuICAgICAgICAkZWxlbWVudC5hZGRDbGFzcyhob3ZlckNsYXNzKTtcbiAgICAgICAga2VlcE9wZW4oKTtcbiAgICB9KTtcbiAgICAkZWxlbWVudC5vbignbW91c2VsZWF2ZScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAkZWxlbWVudC5yZW1vdmVDbGFzcyhob3ZlckNsYXNzKTtcbiAgICAgICAgZGVsYXllZENsb3NlKCk7XG4gICAgfSk7XG5cbiAgICBmdW5jdGlvbiBkZWxheWVkQ2xvc2UoKSB7XG4gICAgICAgIGNsb3NlVGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY2xvc2VUaW1lciA9IG51bGw7XG4gICAgICAgICAgICBoaWRlUG9wdXAoJGVsZW1lbnQpO1xuICAgICAgICB9LCA1MDApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGtlZXBPcGVuKCkge1xuICAgICAgICBpZiAoY2xvc2VUaW1lcikge1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KGNsb3NlVGltZXIpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBpc1Nob3dpbmcoKSB7XG4gICAgaWYgKCFyYWN0aXZlKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdmFyICRlbGVtZW50ID0gZ2V0Um9vdEVsZW1lbnQoKTtcbiAgICByZXR1cm4gJGVsZW1lbnQuaGFzQ2xhc3MoJ2FudGVubmEtc2hvdycpO1xufVxuXG5mdW5jdGlvbiBzaG93UG9wdXAoY29vcmRpbmF0ZXMsIGNhbGxiYWNrKSB7XG4gICAgdmFyICRlbGVtZW50ID0gZ2V0Um9vdEVsZW1lbnQoKTtcbiAgICBpZiAoISRlbGVtZW50Lmhhc0NsYXNzKCdhbnRlbm5hLXNob3cnKSkge1xuICAgICAgICBjbGlja0hhbmRsZXIgPSBjYWxsYmFjaztcbiAgICAgICAgdmFyIGJvZHlPZmZzZXQgPSAkKCdib2R5Jykub2Zmc2V0KCk7IC8vIGFjY291bnQgZm9yIGFueSBvZmZzZXQgdGhhdCBzaXRlcyBhcHBseSB0byB0aGUgZW50aXJlIGJvZHlcbiAgICAgICAgdmFyIHRhaWwgPSA2OyAvLyBUT0RPIGZpbmQgYSBjbGVhbmVyIHdheSB0byBhY2NvdW50IGZvciB0aGUgcG9wdXAgJ3RhaWwnXG4gICAgICAgICRlbGVtZW50XG4gICAgICAgICAgICAuc2hvdygpIC8vIHN0aWxsIGhhcyBvcGFjaXR5IDAgYXQgdGhpcyBwb2ludFxuICAgICAgICAgICAgLmNzcyh7XG4gICAgICAgICAgICAgICAgdG9wOiBjb29yZGluYXRlcy50b3AgLSAkZWxlbWVudC5vdXRlckhlaWdodCgpIC0gdGFpbCAtIGJvZHlPZmZzZXQudG9wLFxuICAgICAgICAgICAgICAgIGxlZnQ6IGNvb3JkaW5hdGVzLmxlZnQgLSBib2R5T2Zmc2V0LmxlZnQgLSBNYXRoLmZsb29yKCRlbGVtZW50Lm91dGVyV2lkdGgoKSAvIDIpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgVHJhbnNpdGlvblV0aWwudG9nZ2xlQ2xhc3MoJGVsZW1lbnQsICdhbnRlbm5hLXNob3cnLCB0cnVlLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIFRPRE86IGFmdGVyIHRoZSBhcHBlYXJhbmNlIHRyYW5zaXRpb24gaXMgY29tcGxldGUsIGFkZCBhIGhhbmRsZXIgZm9yIG1vdXNlZW50ZXIgd2hpY2ggdGhlbiByZWdpc3RlcnNcbiAgICAgICAgICAgIC8vICAgICAgIGEgaGFuZGxlciBmb3IgbW91c2VsZWF2ZSB0aGF0IGhpZGVzIHRoZSBwb3B1cFxuXG4gICAgICAgICAgICAvLyBUT0RPOiBhbHNvIHRha2UgZG93biB0aGUgcG9wdXAgaWYgdGhlIHVzZXIgbW91c2VzIG92ZXIgYW5vdGhlciB3aWRnZXQgKHN1bW1hcnkgb3IgaW5kaWNhdG9yKVxuICAgICAgICAgICAgJChkb2N1bWVudCkub24oJ2NsaWNrLmFudGVubmEtcG9wdXAnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaGlkZVBvcHVwKCRlbGVtZW50KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGhpZGVQb3B1cCgkZWxlbWVudCkge1xuICAgIFRyYW5zaXRpb25VdGlsLnRvZ2dsZUNsYXNzKCRlbGVtZW50LCAnYW50ZW5uYS1zaG93JywgZmFsc2UsIGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoISRlbGVtZW50Lmhhc0NsYXNzKCdhbnRlbm5hLXNob3cnKSkgeyAvLyBCeSB0aGUgdGltZSB0aGUgdHJhbnNpdGlvbiBmaW5pc2hlcywgdGhlIHdpZGdldCBjb3VsZCBiZSBzaG93aW5nIGFnYWluLlxuICAgICAgICAgICAgJGVsZW1lbnQuaGlkZSgpOyAvLyBhZnRlciB3ZSdyZSBhdCBvcGFjaXR5IDAsIGhpZGUgdGhlIGVsZW1lbnQgc28gaXQgZG9lc24ndCByZWNlaXZlIGFjY2lkZW50YWwgY2xpY2tzXG4gICAgICAgIH1cbiAgICB9KTtcbiAgICAkKGRvY3VtZW50KS5vZmYoJ2NsaWNrLmFudGVubmEtcG9wdXAnKTtcbn1cblxuZnVuY3Rpb24gdGVhcmRvd24oKSB7XG4gICAgaWYgKHJhY3RpdmUpIHtcbiAgICAgICAgcmFjdGl2ZS50ZWFyZG93bigpO1xuICAgICAgICByYWN0aXZlID0gdW5kZWZpbmVkO1xuICAgICAgICBjbGlja0hhbmRsZXIgPSB1bmRlZmluZWQ7XG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgaXNTaG93aW5nOiBpc1Nob3dpbmcsXG4gICAgc2hvdzogc2hvd1BvcHVwLFxuICAgIHRlYXJkb3duOiB0ZWFyZG93blxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi91dGlscy9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciBSYWN0aXZlOyByZXF1aXJlKCcuL3V0aWxzL3JhY3RpdmUtcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24obG9hZGVkUmFjdGl2ZSkgeyBSYWN0aXZlID0gbG9hZGVkUmFjdGl2ZTt9KTtcblxudmFyIEFqYXhDbGllbnQgPSByZXF1aXJlKCcuL3V0aWxzL2FqYXgtY2xpZW50Jyk7XG52YXIgUmFuZ2UgPSByZXF1aXJlKCcuL3V0aWxzL3JhbmdlJyk7XG52YXIgUmVhY3Rpb25zV2lkZ2V0TGF5b3V0VXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzL3JlYWN0aW9ucy13aWRnZXQtbGF5b3V0LXV0aWxzJyk7XG5cbnZhciBFdmVudHMgPSByZXF1aXJlKCcuL2V2ZW50cycpO1xudmFyIFBhZ2VEYXRhID0gcmVxdWlyZSgnLi9wYWdlLWRhdGEnKTtcbnZhciBTVkdzID0gcmVxdWlyZSgnLi9zdmdzJyk7XG5cbnZhciBwYWdlU2VsZWN0b3IgPSAnLmFudGVubmEtcmVhY3Rpb25zLXBhZ2UnO1xuXG5mdW5jdGlvbiBjcmVhdGVQYWdlKG9wdGlvbnMpIHtcbiAgICB2YXIgaXNTdW1tYXJ5ID0gb3B0aW9ucy5pc1N1bW1hcnk7XG4gICAgdmFyIHJlYWN0aW9uc0RhdGEgPSBvcHRpb25zLnJlYWN0aW9uc0RhdGE7XG4gICAgdmFyIGRlZmF1bHRSZWFjdGlvbnMgPSBvcHRpb25zLmRlZmF1bHRSZWFjdGlvbnM7XG4gICAgdmFyIGNvbnRhaW5lckRhdGEgPSBvcHRpb25zLmNvbnRhaW5lckRhdGE7XG4gICAgdmFyIHBhZ2VEYXRhID0gb3B0aW9ucy5wYWdlRGF0YTtcbiAgICB2YXIgZ3JvdXBTZXR0aW5ncyA9IG9wdGlvbnMuZ3JvdXBTZXR0aW5ncztcbiAgICB2YXIgY29udGVudERhdGEgPSBvcHRpb25zLmNvbnRlbnREYXRhO1xuICAgIHZhciBjb250YWluZXJFbGVtZW50ID0gb3B0aW9ucy5jb250YWluZXJFbGVtZW50OyAvLyBvcHRpb25hbFxuICAgIHZhciBzaG93Q29uZmlybWF0aW9uID0gb3B0aW9ucy5zaG93Q29uZmlybWF0aW9uO1xuICAgIHZhciBzaG93Q29tbWVudHMgPSBvcHRpb25zLnNob3dDb21tZW50cztcbiAgICB2YXIgc2hvd0xvY2F0aW9ucyA9IG9wdGlvbnMuc2hvd0xvY2F0aW9ucztcbiAgICB2YXIgc2hvd1BlbmRpbmdBcHByb3ZhbCA9IG9wdGlvbnMuc2hvd1BlbmRpbmdBcHByb3ZhbDtcbiAgICB2YXIgc2hvd1Byb2dyZXNzID0gb3B0aW9ucy5zaG93UHJvZ3Jlc3M7XG4gICAgdmFyIGhhbmRsZVJlYWN0aW9uRXJyb3IgPSBvcHRpb25zLmhhbmRsZVJlYWN0aW9uRXJyb3I7XG4gICAgdmFyIGVsZW1lbnQgPSBvcHRpb25zLmVsZW1lbnQ7XG5cbiAgICB2YXIgY29tYmluZWRSZWFjdGlvbnNEYXRhID0gY29tYmluZVJlYWN0aW9uRGF0YShyZWFjdGlvbnNEYXRhLCBkZWZhdWx0UmVhY3Rpb25zKTtcbiAgICB2YXIgcmVhY3Rpb25zTGF5b3V0RGF0YSA9IFJlYWN0aW9uc1dpZGdldExheW91dFV0aWxzLmNvbXB1dGVMYXlvdXREYXRhKGNvbWJpbmVkUmVhY3Rpb25zRGF0YSk7XG4gICAgdmFyICRyZWFjdGlvbnNXaW5kb3cgPSAkKG9wdGlvbnMucmVhY3Rpb25zV2luZG93KTtcbiAgICB2YXIgcmFjdGl2ZSA9IFJhY3RpdmUoe1xuICAgICAgICBlbDogZWxlbWVudCxcbiAgICAgICAgYXBwZW5kOiB0cnVlLFxuICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL3JlYWN0aW9ucy1wYWdlLmhicy5odG1sJyksXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIHJlYWN0aW9uczogY29tYmluZWRSZWFjdGlvbnNEYXRhLFxuICAgICAgICAgICAgcmVhY3Rpb25zTGF5b3V0Q2xhc3M6IGFycmF5QWNjZXNzb3IocmVhY3Rpb25zTGF5b3V0RGF0YS5sYXlvdXRDbGFzc2VzKSxcbiAgICAgICAgICAgIGlzU3VtbWFyeTogaXNTdW1tYXJ5XG4gICAgICAgIH0sXG4gICAgICAgIGRlY29yYXRvcnM6IHtcbiAgICAgICAgICAgIHNpemV0b2ZpdDogc2l6ZVRvRml0KCRyZWFjdGlvbnNXaW5kb3cpXG4gICAgICAgIH0sXG4gICAgICAgIHBhcnRpYWxzOiB7XG4gICAgICAgICAgICBsb2NhdGlvbkljb246IFNWR3MubG9jYXRpb24sXG4gICAgICAgICAgICBjb21tZW50c0ljb246IFNWR3MuY29tbWVudHNcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgaWYgKGNvbnRhaW5lckVsZW1lbnQpIHtcbiAgICAgICAgcmFjdGl2ZS5vbignaGlnaGxpZ2h0JywgaGlnaGxpZ2h0Q29udGVudChjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgY29udGFpbmVyRWxlbWVudCkpO1xuICAgICAgICByYWN0aXZlLm9uKCdjbGVhcmhpZ2hsaWdodHMnLCBSYW5nZS5jbGVhckhpZ2hsaWdodHMpO1xuICAgIH1cbiAgICByYWN0aXZlLm9uKCdyZWFjdCcsIGZ1bmN0aW9uKHJhY3RpdmVFdmVudCkge1xuICAgICAgICBpZiAocmFjdGl2ZUV2ZW50LmNvbnRleHQuaXNEZWZhdWx0KSB7XG4gICAgICAgICAgICBuZXdEZWZhdWx0UmVhY3Rpb24ocmFjdGl2ZUV2ZW50KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBsdXNPbmUocmFjdGl2ZUV2ZW50KTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJhY3RpdmUub24oJ25ld2N1c3RvbScsIG5ld0N1c3RvbVJlYWN0aW9uKTtcbiAgICByYWN0aXZlLm9uKCdjdXN0b21mb2N1cycsIGN1c3RvbVJlYWN0aW9uRm9jdXMpO1xuICAgIHJhY3RpdmUub24oJ2N1c3RvbWJsdXInLCBjdXN0b21SZWFjdGlvbkJsdXIpO1xuICAgIHJhY3RpdmUub24oJ3BhZ2VrZXlkb3duJywga2V5Ym9hcmRJbnB1dCk7XG4gICAgcmFjdGl2ZS5vbignaW5wdXRrZXlkb3duJywgY3VzdG9tUmVhY3Rpb25JbnB1dCk7XG4gICAgcmFjdGl2ZS5vbignc2hvd2NvbW1lbnRzJywgZnVuY3Rpb24ocmFjdGl2ZUV2ZW50KSB7IHNob3dDb21tZW50cyhyYWN0aXZlRXZlbnQuY29udGV4dCwgcGFnZVNlbGVjdG9yKTsgcmV0dXJuIGZhbHNlOyB9KTsgLy8gVE9ETyBjbGVhbiB1cFxuICAgIHJhY3RpdmUub24oJ3Nob3dsb2NhdGlvbnMnLCBmdW5jdGlvbihyYWN0aXZlRXZlbnQpIHsgc2hvd0xvY2F0aW9ucyhyYWN0aXZlRXZlbnQuY29udGV4dCwgcGFnZVNlbGVjdG9yKTsgcmV0dXJuIGZhbHNlOyB9KTsgLy8gVE9ETyBjbGVhbiB1cFxuICAgIHJldHVybiB7XG4gICAgICAgIHNlbGVjdG9yOiBwYWdlU2VsZWN0b3IsXG4gICAgICAgIHRlYXJkb3duOiBmdW5jdGlvbigpIHsgcmFjdGl2ZS50ZWFyZG93bigpOyB9XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIGFycmF5QWNjZXNzb3IoYXJyYXkpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGluZGV4KSB7XG4gICAgICAgICAgICByZXR1cm4gYXJyYXlbaW5kZXhdO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGx1c09uZShyYWN0aXZlRXZlbnQpIHtcbiAgICAgICAgdmFyIHJlYWN0aW9uRGF0YSA9IHJhY3RpdmVFdmVudC5jb250ZXh0O1xuICAgICAgICB2YXIgcmVhY3Rpb25Qcm92aWRlciA9IHsgLy8gdGhpcyByZWFjdGlvbiBwcm92aWRlciBpcyBhIG5vLWJyYWluZXIgYmVjYXVzZSB3ZSBhbHJlYWR5IGhhdmUgYSB2YWxpZCByZWFjdGlvbiAob25lIHdpdGggYW4gSUQpXG4gICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2socmVhY3Rpb25EYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgc2hvd0NvbmZpcm1hdGlvbihyZWFjdGlvbkRhdGEsIHJlYWN0aW9uUHJvdmlkZXIpO1xuICAgICAgICBBamF4Q2xpZW50LnBvc3RQbHVzT25lKHJlYWN0aW9uRGF0YSwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MsIHN1Y2Nlc3MsIGVycm9yKTtcblxuICAgICAgICBmdW5jdGlvbiBzdWNjZXNzKHJlYWN0aW9uRGF0YSwgZXhpc3RpbmcpIHtcbiAgICAgICAgICAgIGlmICghZXhpc3RpbmcpIHtcbiAgICAgICAgICAgICAgICBFdmVudHMucG9zdFJlYWN0aW9uQ3JlYXRlZChwYWdlRGF0YSwgY29udGFpbmVyRGF0YSwgcmVhY3Rpb25EYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGVycm9yKG1lc3NhZ2UpIHtcbiAgICAgICAgICAgIHZhciByZXRyeSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIEFqYXhDbGllbnQucG9zdFBsdXNPbmUocmVhY3Rpb25EYXRhLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncywgc3VjY2VzcywgZXJyb3IpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGhhbmRsZVJlYWN0aW9uRXJyb3IobWVzc2FnZSwgcmV0cnksIHBhZ2VTZWxlY3Rvcik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBuZXdEZWZhdWx0UmVhY3Rpb24ocmFjdGl2ZUV2ZW50KSB7XG4gICAgICAgIHZhciByZWFjdGlvbkRhdGEgPSByYWN0aXZlRXZlbnQuY29udGV4dDtcbiAgICAgICAgdmFyIHJlYWN0aW9uUHJvdmlkZXIgPSBjcmVhdGVSZWFjdGlvblByb3ZpZGVyKCk7XG4gICAgICAgIHNob3dDb25maXJtYXRpb24ocmVhY3Rpb25EYXRhLCByZWFjdGlvblByb3ZpZGVyKTsgLy8gT3B0aW1pc3RpY2FsbHkgc2hvdyBjb25maXJtYXRpb24gZm9yIGRlZmF1bHQgcmVhY3Rpb25zIGJlY2F1c2UgdGhleSBzaG91bGQgYWx3YXlzIGJlIGFjY2VwdGVkLlxuICAgICAgICBBamF4Q2xpZW50LnBvc3ROZXdSZWFjdGlvbihyZWFjdGlvbkRhdGEsIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBjb250ZW50RGF0YSwgZ3JvdXBTZXR0aW5ncywgc3VjY2VzcywgZXJyb3IpO1xuXG4gICAgICAgIGZ1bmN0aW9uIHN1Y2Nlc3MocmVhY3Rpb24pIHtcbiAgICAgICAgICAgIHJlYWN0aW9uID0gUGFnZURhdGEucmVnaXN0ZXJSZWFjdGlvbihyZWFjdGlvbiwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEpO1xuICAgICAgICAgICAgcmVhY3Rpb25Qcm92aWRlci5yZWFjdGlvbkxvYWRlZChyZWFjdGlvbik7XG4gICAgICAgICAgICBFdmVudHMucG9zdFJlYWN0aW9uQ3JlYXRlZChwYWdlRGF0YSwgY29udGFpbmVyRGF0YSwgcmVhY3Rpb24sIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZXJyb3IobWVzc2FnZSkge1xuICAgICAgICAgICAgdmFyIHJldHJ5ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgQWpheENsaWVudC5wb3N0TmV3UmVhY3Rpb24ocmVhY3Rpb25EYXRhLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgY29udGVudERhdGEsIGdyb3VwU2V0dGluZ3MsIHN1Y2Nlc3MsIGVycm9yKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBoYW5kbGVSZWFjdGlvbkVycm9yKG1lc3NhZ2UsIHJldHJ5LCBwYWdlU2VsZWN0b3IpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbmV3Q3VzdG9tUmVhY3Rpb24oKSB7XG4gICAgICAgIHZhciBpbnB1dCA9IHJhY3RpdmUuZmluZCgnLmFudGVubmEtcmVhY3Rpb25zLWZvb3RlciBpbnB1dCcpO1xuICAgICAgICB2YXIgYm9keSA9IGlucHV0LnZhbHVlLnRyaW0oKTtcbiAgICAgICAgaWYgKGJvZHkgIT09ICcnKSB7XG4gICAgICAgICAgICBzaG93UHJvZ3Jlc3MoKTsgLy8gU2hvdyBwcm9ncmVzcyBmb3IgY3VzdG9tIHJlYWN0aW9ucyBiZWNhdXNlIHRoZSBzZXJ2ZXIgbWlnaHQgcmVqZWN0IHRoZW0gZm9yIGEgbnVtYmVyIG9mIHJlYXNvbnNcbiAgICAgICAgICAgIHZhciByZWFjdGlvbkRhdGEgPSB7IHRleHQ6IGJvZHkgfTtcbiAgICAgICAgICAgIHZhciByZWFjdGlvblByb3ZpZGVyID0gY3JlYXRlUmVhY3Rpb25Qcm92aWRlcigpO1xuICAgICAgICAgICAgaW5wdXQuYmx1cigpO1xuICAgICAgICAgICAgQWpheENsaWVudC5wb3N0TmV3UmVhY3Rpb24ocmVhY3Rpb25EYXRhLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgY29udGVudERhdGEsIGdyb3VwU2V0dGluZ3MsIHN1Y2Nlc3MsIGVycm9yKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHN1Y2Nlc3MocmVhY3Rpb24pIHtcbiAgICAgICAgICAgIGlmIChyZWFjdGlvbi5hcHByb3ZlZCkge1xuICAgICAgICAgICAgICAgIHNob3dDb25maXJtYXRpb24ocmVhY3Rpb25EYXRhLCByZWFjdGlvblByb3ZpZGVyKTtcbiAgICAgICAgICAgICAgICByZWFjdGlvbiA9IFBhZ2VEYXRhLnJlZ2lzdGVyUmVhY3Rpb24ocmVhY3Rpb24sIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhKTtcbiAgICAgICAgICAgICAgICByZWFjdGlvblByb3ZpZGVyLnJlYWN0aW9uTG9hZGVkKHJlYWN0aW9uKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gSWYgdGhlIHJlYWN0aW9uIGlzbid0IGFwcHJvdmVkLCBkb24ndCBhZGQgaXQgdG8gb3VyIGRhdGEgbW9kZWwuIEp1c3Qgc2hvdyBmZWVkYmFjayBhbmQgZmlyZSBhbiBldmVudC5cbiAgICAgICAgICAgICAgICBzaG93UGVuZGluZ0FwcHJvdmFsKHJlYWN0aW9uKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIEV2ZW50cy5wb3N0UmVhY3Rpb25DcmVhdGVkKHBhZ2VEYXRhLCBjb250YWluZXJEYXRhLCByZWFjdGlvbiwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBlcnJvcihtZXNzYWdlKSB7XG4gICAgICAgICAgICB2YXIgcmV0cnkgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBBamF4Q2xpZW50LnBvc3ROZXdSZWFjdGlvbihyZWFjdGlvbkRhdGEsIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBjb250ZW50RGF0YSwgZ3JvdXBTZXR0aW5ncywgc3VjY2VzcywgZXJyb3IpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGhhbmRsZVJlYWN0aW9uRXJyb3IobWVzc2FnZSwgcmV0cnksIHBhZ2VTZWxlY3Rvcik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjdXN0b21SZWFjdGlvbklucHV0KHJhY3RpdmVFdmVudCkge1xuICAgICAgICB2YXIgZXZlbnQgPSByYWN0aXZlRXZlbnQub3JpZ2luYWw7XG4gICAgICAgIHZhciBrZXkgPSAoZXZlbnQud2hpY2ggIT09IHVuZGVmaW5lZCkgPyBldmVudC53aGljaCA6IGV2ZW50LmtleUNvZGU7XG4gICAgICAgIGlmIChrZXkgPT0gMTMpIHsgLy8gRW50ZXJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IC8vIGxldCB0aGUgcHJvY2Vzc2luZyBvZiB0aGUga2V5Ym9hcmQgZXZlbnQgZmluaXNoIGJlZm9yZSB3ZSBzaG93IHRoZSBwYWdlIChvdGhlcndpc2UsIHRoZSBjb25maXJtYXRpb24gcGFnZSBhbHNvIHJlY2VpdmVzIHRoZSBrZXlzdHJva2UpXG4gICAgICAgICAgICAgICAgbmV3Q3VzdG9tUmVhY3Rpb24oKTtcbiAgICAgICAgICAgIH0sIDApO1xuICAgICAgICB9IGVsc2UgaWYgKGtleSA9PSAyNykgeyAvLyBFc2NhcGVcbiAgICAgICAgICAgIGV2ZW50LnRhcmdldC52YWx1ZSA9ICcnO1xuICAgICAgICAgICAgcm9vdEVsZW1lbnQocmFjdGl2ZSkuZm9jdXMoKTtcbiAgICAgICAgfVxuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBrZXlib2FyZElucHV0KHJhY3RpdmVFdmVudCkge1xuICAgICAgICBpZiAoJChyb290RWxlbWVudChyYWN0aXZlKSkuaGFzQ2xhc3MoJ2FudGVubmEtcGFnZS1hY3RpdmUnKSkgeyAvLyBvbmx5IGhhbmRsZSBpbnB1dCB3aGVuIHRoaXMgcGFnZSBpcyBhY3RpdmVcbiAgICAgICAgICAgICQocm9vdEVsZW1lbnQocmFjdGl2ZSkpLmZpbmQoJy5hbnRlbm5hLXJlYWN0aW9ucy1mb290ZXIgaW5wdXQnKS5mb2N1cygpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcm9vdEVsZW1lbnQocmFjdGl2ZSkge1xuICAgICAgICByZXR1cm4gcmFjdGl2ZS5maW5kKHBhZ2VTZWxlY3Rvcik7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBzaXplVG9GaXQoJHJlYWN0aW9uc1dpbmRvdykge1xuICAgIHJldHVybiBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgIHZhciAkZWxlbWVudCA9ICQobm9kZSkuY2xvc2VzdCgnLmFudGVubmEtcmVhY3Rpb24tYm94Jyk7XG4gICAgICAgIC8vIFdoaWxlIHdlJ3JlIHNpemluZyB0aGUgdGV4dCB0byBmaXggaW4gdGhlIHJlYWN0aW9uIGJveCwgd2UgYWxzbyBmaXggdXAgdGhlIHdpZHRoIG9mIHRoZSByZWFjdGlvbiBjb3VudCBhbmRcbiAgICAgICAgLy8gcGx1cyBvbmUgYnV0dG9ucyBzbyB0aGF0IHRoZXkncmUgdGhlIHNhbWUuIFRoZXNlIHR3byB2aXN1YWxseSBzd2FwIHdpdGggZWFjaCBvdGhlciBvbiBob3ZlcjsgbWFraW5nIHRoZW1cbiAgICAgICAgLy8gdGhlIHNhbWUgd2lkdGggbWFrZXMgc3VyZSB3ZSBkb24ndCBnZXQganVtcGluZXNzIG9uIGhvdmVyLlxuICAgICAgICB2YXIgJHJlYWN0aW9uQ291bnQgPSAkZWxlbWVudC5maW5kKCcuYW50ZW5uYS1yZWFjdGlvbi1jb3VudCcpO1xuICAgICAgICB2YXIgJHBsdXNPbmUgPSAkZWxlbWVudC5maW5kKCcuYW50ZW5uYS1wbHVzb25lJyk7XG4gICAgICAgIHZhciBtaW5XaWR0aCA9IE1hdGgubWF4KCRyZWFjdGlvbkNvdW50LndpZHRoKCksICRwbHVzT25lLndpZHRoKCkpO1xuICAgICAgICBtaW5XaWR0aCsrOyAvLyBBZGQgYW4gZXh0cmEgcGl4ZWwgZm9yIHJvdW5kaW5nIGJlY2F1c2UgZWxlbWVudHMgdGhhdCBtZWFzdXJlLCBmb3IgZXhhbXBsZSwgMTcuMTg3NXB4IGNhbiBjb21lIGJhY2sgd2l0aCAxNyBhcyB0aGUgd2lkdGgoKVxuICAgICAgICAkcmVhY3Rpb25Db3VudC5jc3MoeydtaW4td2lkdGgnOiBtaW5XaWR0aH0pO1xuICAgICAgICAkcGx1c09uZS5jc3MoeydtaW4td2lkdGgnOiBtaW5XaWR0aH0pO1xuICAgICAgICByZXR1cm4gUmVhY3Rpb25zV2lkZ2V0TGF5b3V0VXRpbHMuc2l6ZVRvRml0KCRyZWFjdGlvbnNXaW5kb3cpKG5vZGUpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gaGlnaGxpZ2h0Q29udGVudChjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgJGNvbnRhaW5lckVsZW1lbnQpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdmFyIHJlYWN0aW9uRGF0YSA9IGV2ZW50LmNvbnRleHQ7XG4gICAgICAgIGlmIChyZWFjdGlvbkRhdGEuY29udGVudCkge1xuICAgICAgICAgICAgdmFyIGxvY2F0aW9uID0gcmVhY3Rpb25EYXRhLmNvbnRlbnQubG9jYXRpb247XG4gICAgICAgICAgICBpZiAobG9jYXRpb24pIHtcbiAgICAgICAgICAgICAgICBSYW5nZS5oaWdobGlnaHQoJGNvbnRhaW5lckVsZW1lbnQuZ2V0KDApLCBsb2NhdGlvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGN1c3RvbVJlYWN0aW9uRm9jdXMocmFjdGl2ZUV2ZW50KSB7XG4gICAgdmFyICRmb290ZXIgPSAkKHJhY3RpdmVFdmVudC5vcmlnaW5hbC50YXJnZXQpLmNsb3Nlc3QoJy5hbnRlbm5hLXJlYWN0aW9ucy1mb290ZXInKTtcbiAgICAkZm9vdGVyLmZpbmQoJ2lucHV0Jykubm90KCcuYWN0aXZlJykudmFsKCcnKS5hZGRDbGFzcygnYWN0aXZlJyk7XG4gICAgJGZvb3Rlci5maW5kKCdidXR0b24nKS5zaG93KCk7XG59XG5cbmZ1bmN0aW9uIGN1c3RvbVJlYWN0aW9uQmx1cihyYWN0aXZlRXZlbnQpIHtcbiAgICB2YXIgZXZlbnQgPSByYWN0aXZlRXZlbnQub3JpZ2luYWw7XG4gICAgaWYgKCQoZXZlbnQucmVsYXRlZFRhcmdldCkuY2xvc2VzdCgnLmFudGVubmEtcmVhY3Rpb25zLWZvb3RlciBidXR0b24nKS5zaXplKCkgPT0gMCkgeyAvLyBEb24ndCBoaWRlIHRoZSBpbnB1dCB3aGVuIHdlIGNsaWNrIG9uIHRoZSBidXR0b25cbiAgICAgICAgdmFyICRmb290ZXIgPSAkKGV2ZW50LnRhcmdldCkuY2xvc2VzdCgnLmFudGVubmEtcmVhY3Rpb25zLWZvb3RlcicpO1xuICAgICAgICB2YXIgaW5wdXQgPSAkZm9vdGVyLmZpbmQoJ2lucHV0Jyk7XG4gICAgICAgIGlmIChpbnB1dC52YWwoKSA9PT0gJycpIHtcbiAgICAgICAgICAgICRmb290ZXIuZmluZCgnYnV0dG9uJykuaGlkZSgpO1xuICAgICAgICAgICAgdmFyICRpbnB1dCA9ICRmb290ZXIuZmluZCgnaW5wdXQnKTtcbiAgICAgICAgICAgIC8vIFJlc2V0IHRoZSBpbnB1dCB2YWx1ZSB0byB0aGUgZGVmYXVsdCBpbiB0aGUgaHRtbC90ZW1wbGF0ZVxuICAgICAgICAgICAgJGlucHV0LnZhbCgkaW5wdXQuYXR0cigndmFsdWUnKSkucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBjcmVhdGVSZWFjdGlvblByb3ZpZGVyKCkge1xuXG4gICAgdmFyIGxvYWRlZFJlYWN0aW9uO1xuICAgIHZhciBjYWxsYmFja3MgPSBbXTtcblxuICAgIGZ1bmN0aW9uIG9uUmVhY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgY2FsbGJhY2tzLnB1c2goY2FsbGJhY2spO1xuICAgICAgICBub3RpZnlJZlJlYWR5KCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcmVhY3Rpb25Mb2FkZWQocmVhY3Rpb24pIHtcbiAgICAgICAgbG9hZGVkUmVhY3Rpb24gPSByZWFjdGlvbjtcbiAgICAgICAgbm90aWZ5SWZSZWFkeSgpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG5vdGlmeUlmUmVhZHkoKSB7XG4gICAgICAgIGlmIChsb2FkZWRSZWFjdGlvbikge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjYWxsYmFja3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFja3NbaV0obG9hZGVkUmVhY3Rpb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FsbGJhY2tzID0gW107XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBnZXQ6IG9uUmVhY3Rpb24sIC8vIFRPRE8gdGVybWlub2xvZ3lcbiAgICAgICAgcmVhY3Rpb25Mb2FkZWQ6IHJlYWN0aW9uTG9hZGVkXG4gICAgfVxufVxuXG5mdW5jdGlvbiBjb21iaW5lUmVhY3Rpb25EYXRhKHJlYWN0aW9uc0RhdGEsIGRlZmF1bHRSZWFjdGlvbnMpIHtcbiAgICB2YXIgY29tYmluZWRSZWFjdGlvbnMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJlYWN0aW9uc0RhdGEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29tYmluZWRSZWFjdGlvbnMucHVzaChyZWFjdGlvbnNEYXRhW2ldKTtcbiAgICB9XG4gICAgZm9yICh2YXIgaiA9IDA7IGogPCBkZWZhdWx0UmVhY3Rpb25zLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIHZhciBkZWZhdWx0UmVhY3Rpb24gPSBkZWZhdWx0UmVhY3Rpb25zW2pdO1xuICAgICAgICB2YXIgZXhpc3RpbmcgPSBmYWxzZTtcbiAgICAgICAgZm9yICh2YXIgayA9IDA7IGsgPCByZWFjdGlvbnNEYXRhLmxlbmd0aDsgaysrKSB7XG4gICAgICAgICAgICBpZiAocmVhY3Rpb25zRGF0YVtrXS50ZXh0ID09PSBkZWZhdWx0UmVhY3Rpb24udGV4dCkge1xuICAgICAgICAgICAgICAgIGV4aXN0aW5nID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoIWV4aXN0aW5nKSB7XG4gICAgICAgICAgICBjb21iaW5lZFJlYWN0aW9ucy5wdXNoKGRlZmF1bHRSZWFjdGlvbik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGNvbWJpbmVkUmVhY3Rpb25zO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlOiBjcmVhdGVQYWdlXG59OyIsInZhciAkOyByZXF1aXJlKCcuL3V0aWxzL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIEFqYXhDbGllbnQgPSByZXF1aXJlKCcuL3V0aWxzL2FqYXgtY2xpZW50Jyk7XG52YXIgQnJvd3Nlck1ldHJpY3MgPSByZXF1aXJlKCcuL3V0aWxzL2Jyb3dzZXItbWV0cmljcycpO1xudmFyIEpTT05VdGlscyA9IHJlcXVpcmUoJy4vdXRpbHMvanNvbi11dGlscycpO1xudmFyIE1lc3NhZ2VzID0gcmVxdWlyZSgnLi91dGlscy9tZXNzYWdlcycpO1xudmFyIE1vdmVhYmxlID0gcmVxdWlyZSgnLi91dGlscy9tb3ZlYWJsZScpO1xudmFyIFJhY3RpdmU7IHJlcXVpcmUoJy4vdXRpbHMvcmFjdGl2ZS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihsb2FkZWRSYWN0aXZlKSB7IFJhY3RpdmUgPSBsb2FkZWRSYWN0aXZlO30pO1xudmFyIFJhbmdlID0gcmVxdWlyZSgnLi91dGlscy9yYW5nZScpO1xudmFyIFRvdWNoU3VwcG9ydCA9IHJlcXVpcmUoJy4vdXRpbHMvdG91Y2gtc3VwcG9ydCcpO1xudmFyIFRyYW5zaXRpb25VdGlsID0gcmVxdWlyZSgnLi91dGlscy90cmFuc2l0aW9uLXV0aWwnKTtcbnZhciBVc2VyID0gcmVxdWlyZSgnLi91dGlscy91c2VyJyk7XG52YXIgV2lkZ2V0QnVja2V0ID0gcmVxdWlyZSgnLi91dGlscy93aWRnZXQtYnVja2V0Jyk7XG5cbnZhciBCbG9ja2VkUmVhY3Rpb25QYWdlID0gcmVxdWlyZSgnLi9ibG9ja2VkLXJlYWN0aW9uLXBhZ2UnKTtcbnZhciBDb21tZW50c1BhZ2UgPSByZXF1aXJlKCcuL2NvbW1lbnRzLXBhZ2UnKTtcbnZhciBDb25maXJtYXRpb25QYWdlID0gcmVxdWlyZSgnLi9jb25maXJtYXRpb24tcGFnZScpO1xudmFyIEV2ZW50cyA9IHJlcXVpcmUoJy4vZXZlbnRzJyk7XG52YXIgR2VuZXJpY0Vycm9yUGFnZSA9IHJlcXVpcmUoJy4vZ2VuZXJpYy1lcnJvci1wYWdlJyk7XG52YXIgTG9jYXRpb25zUGFnZSA9IHJlcXVpcmUoJy4vbG9jYXRpb25zLXBhZ2UnKTtcbnZhciBMb2dpblBhZ2UgPSByZXF1aXJlKCcuL2xvZ2luLXBhZ2UnKTtcbnZhciBQYWdlRGF0YSA9IHJlcXVpcmUoJy4vcGFnZS1kYXRhJyk7XG52YXIgUGVuZGluZ1JlYWN0aW9uUGFnZSA9IHJlcXVpcmUoJy4vcGVuZGluZy1yZWFjdGlvbi1wYWdlJyk7XG52YXIgUmVhY3Rpb25zUGFnZSA9IHJlcXVpcmUoJy4vcmVhY3Rpb25zLXBhZ2UnKTtcbnZhciBTVkdzID0gcmVxdWlyZSgnLi9zdmdzJyk7XG5cbnZhciBTRUxFQ1RPUl9SRUFDVElPTlNfV0lER0VUID0gJy5hbnRlbm5hLXJlYWN0aW9ucy13aWRnZXQnO1xuXG52YXIgb3Blbkluc3RhbmNlcyA9IFtdO1xuXG5mdW5jdGlvbiBvcGVuUmVhY3Rpb25zV2lkZ2V0KG9wdGlvbnMsIGVsZW1lbnRPckNvb3Jkcykge1xuICAgIGNsb3NlQWxsV2luZG93cygpO1xuICAgIHZhciBkZWZhdWx0UmVhY3Rpb25zID0gb3B0aW9ucy5kZWZhdWx0UmVhY3Rpb25zO1xuICAgIHZhciByZWFjdGlvbnNEYXRhID0gb3B0aW9ucy5yZWFjdGlvbnNEYXRhO1xuICAgIHZhciBjb250YWluZXJEYXRhID0gb3B0aW9ucy5jb250YWluZXJEYXRhO1xuICAgIHZhciBjb250YWluZXJFbGVtZW50ID0gb3B0aW9ucy5jb250YWluZXJFbGVtZW50OyAvLyBvcHRpb25hbFxuICAgIHZhciBpc1N1bW1hcnkgPSBvcHRpb25zLmlzU3VtbWFyeSA9PT0gdW5kZWZpbmVkID8gZmFsc2UgOiBvcHRpb25zLmlzU3VtbWFyeTsgLy8gb3B0aW9uYWxcbiAgICAvLyBjb250ZW50RGF0YSBjb250YWlucyBkZXRhaWxzIGFib3V0IHRoZSBjb250ZW50IGJlaW5nIHJlYWN0ZWQgdG8gbGlrZSB0ZXh0IHJhbmdlIG9yIGltYWdlIGhlaWdodC93aWR0aC5cbiAgICAvLyB3ZSBwb3RlbnRpYWxseSBtb2RpZnkgdGhpcyBkYXRhIChlLmcuIGluIHRoZSBkZWZhdWx0IHJlYWN0aW9uIGNhc2Ugd2Ugc2VsZWN0IHRoZSB0ZXh0IG91cnNlbHZlcykgc28gd2VcbiAgICAvLyBtYWtlIGEgbG9jYWwgY29weSBvZiBpdCB0byBhdm9pZCB1bmV4cGVjdGVkbHkgY2hhbmdpbmcgZGF0YSBvdXQgZnJvbSB1bmRlciBvbmUgb2YgdGhlIGNsaWVudHNcbiAgICB2YXIgY29udGVudERhdGEgPSBKU09OLnBhcnNlKEpTT05VdGlscy5zdHJpbmdpZnkob3B0aW9ucy5jb250ZW50RGF0YSkpO1xuICAgIHZhciBwYWdlRGF0YSA9IG9wdGlvbnMucGFnZURhdGE7XG4gICAgdmFyIGdyb3VwU2V0dGluZ3MgPSBvcHRpb25zLmdyb3VwU2V0dGluZ3M7XG4gICAgdmFyIHJhY3RpdmUgPSBSYWN0aXZlKHtcbiAgICAgICAgZWw6IFdpZGdldEJ1Y2tldC5nZXQoKSxcbiAgICAgICAgYXBwZW5kOiB0cnVlLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICBzdXBwb3J0c1RvdWNoOiBCcm93c2VyTWV0cmljcy5zdXBwb3J0c1RvdWNoKClcbiAgICAgICAgfSxcbiAgICAgICAgdGVtcGxhdGU6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9yZWFjdGlvbnMtd2lkZ2V0Lmhicy5odG1sJyksXG4gICAgICAgIHBhcnRpYWxzOiB7XG4gICAgICAgICAgICBsb2dvOiBTVkdzLmxvZ29cbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmFjdGl2ZS5vbignY2xvc2UnLCBjbG9zZUFsbFdpbmRvd3MpO1xuICAgIHZhciAkcm9vdEVsZW1lbnQgPSAkKHJvb3RFbGVtZW50KHJhY3RpdmUpKTtcbiAgICBNb3ZlYWJsZS5tYWtlTW92ZWFibGUoJHJvb3RFbGVtZW50LCAkcm9vdEVsZW1lbnQuZmluZCgnLmFudGVubmEtaGVhZGVyJykpO1xuICAgIHZhciBwYWdlcyA9IFtdO1xuXG4gICAgb3BlbldpbmRvdygpO1xuXG4gICAgZnVuY3Rpb24gb3BlbldpbmRvdygpIHtcbiAgICAgICAgUGFnZURhdGEuY2xlYXJJbmRpY2F0b3JMaW1pdChwYWdlRGF0YSk7XG4gICAgICAgIHZhciBjb29yZHM7XG4gICAgICAgIGlmIChlbGVtZW50T3JDb29yZHMudG9wICYmIGVsZW1lbnRPckNvb3Jkcy5sZWZ0KSB7XG4gICAgICAgICAgICBjb29yZHMgPSBlbGVtZW50T3JDb29yZHM7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgJHJlbGF0aXZlRWxlbWVudCA9ICQoZWxlbWVudE9yQ29vcmRzKTtcbiAgICAgICAgICAgIHZhciBvZmZzZXQgPSAkcmVsYXRpdmVFbGVtZW50Lm9mZnNldCgpO1xuICAgICAgICAgICAgdmFyIGJvZHlPZmZzZXQgPSAkKCdib2R5Jykub2Zmc2V0KCk7IC8vIGFjY291bnQgZm9yIGFueSBvZmZzZXQgdGhhdCBzaXRlcyBhcHBseSB0byB0aGUgZW50aXJlIGJvZHlcbiAgICAgICAgICAgIGNvb3JkcyA9IHtcbiAgICAgICAgICAgICAgICB0b3A6IG9mZnNldC50b3AgLSBib2R5T2Zmc2V0LnRvcCxcbiAgICAgICAgICAgICAgICBsZWZ0OiBvZmZzZXQubGVmdCAtIGJvZHlPZmZzZXQubGVmdFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgaG9yaXpvbnRhbE92ZXJmbG93ID0gY29vcmRzLmxlZnQgKyAkcm9vdEVsZW1lbnQud2lkdGgoKSAtIE1hdGgubWF4KGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRXaWR0aCwgd2luZG93LmlubmVyV2lkdGggfHwgMCk7IC8vIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTI0ODA4MS9nZXQtdGhlLWJyb3dzZXItdmlld3BvcnQtZGltZW5zaW9ucy13aXRoLWphdmFzY3JpcHQvODg3NjA2OSM4ODc2MDY5XG4gICAgICAgIGlmIChob3Jpem9udGFsT3ZlcmZsb3cgPiAwKSB7XG4gICAgICAgICAgICBjb29yZHMubGVmdCA9IGNvb3Jkcy5sZWZ0IC0gaG9yaXpvbnRhbE92ZXJmbG93O1xuICAgICAgICB9XG4gICAgICAgICRyb290RWxlbWVudC5zdG9wKHRydWUsIHRydWUpLmFkZENsYXNzKCdhbnRlbm5hLXJlYWN0aW9ucy1vcGVuJykuY3NzKGNvb3Jkcyk7XG5cbiAgICAgICAgc2hvd1JlYWN0aW9ucyhmYWxzZSk7XG4gICAgICAgIGlmIChpc1N1bW1hcnkpIHtcbiAgICAgICAgICAgIEV2ZW50cy5wb3N0U3VtbWFyeU9wZW5lZChwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBFdmVudHMucG9zdFJlYWN0aW9uV2lkZ2V0T3BlbmVkKHBhZ2VEYXRhLCBjb250YWluZXJEYXRhLCBjb250ZW50RGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIH1cblxuICAgICAgICBzZXR1cFdpbmRvd0Nsb3NlKHBhZ2VzLCByYWN0aXZlKTtcbiAgICAgICAgcHJldmVudEV4dHJhU2Nyb2xsKCRyb290RWxlbWVudCk7XG4gICAgICAgIG9wZW5JbnN0YW5jZXMucHVzaChyYWN0aXZlKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzaG93UmVhY3Rpb25zKGFuaW1hdGUpIHtcbiAgICAgICAgaWYgKGNvbnRhaW5lckVsZW1lbnQgJiYgIWNvbnRlbnREYXRhLmxvY2F0aW9uICYmICFjb250ZW50RGF0YS5ib2R5KSB7XG4gICAgICAgICAgICBSYW5nZS5ncmFiTm9kZShjb250YWluZXJFbGVtZW50LmdldCgwKSwgZnVuY3Rpb24gKHRleHQsIGxvY2F0aW9uKSB7XG4gICAgICAgICAgICAgICAgY29udGVudERhdGEubG9jYXRpb24gPSBsb2NhdGlvbjtcbiAgICAgICAgICAgICAgICBjb250ZW50RGF0YS5ib2R5ID0gdGV4dDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHZhciBvcHRpb25zID0ge1xuICAgICAgICAgICAgaXNTdW1tYXJ5OiBpc1N1bW1hcnksXG4gICAgICAgICAgICByZWFjdGlvbnNEYXRhOiByZWFjdGlvbnNEYXRhLFxuICAgICAgICAgICAgZGVmYXVsdFJlYWN0aW9uczogZGVmYXVsdFJlYWN0aW9ucyxcbiAgICAgICAgICAgIHBhZ2VEYXRhOiBwYWdlRGF0YSxcbiAgICAgICAgICAgIGdyb3VwU2V0dGluZ3M6IGdyb3VwU2V0dGluZ3MsXG4gICAgICAgICAgICBjb250YWluZXJEYXRhOiBjb250YWluZXJEYXRhLFxuICAgICAgICAgICAgY29udGVudERhdGE6IGNvbnRlbnREYXRhLFxuICAgICAgICAgICAgY29udGFpbmVyRWxlbWVudDogY29udGFpbmVyRWxlbWVudCxcbiAgICAgICAgICAgIHNob3dDb25maXJtYXRpb246IHNob3dDb25maXJtYXRpb24sXG4gICAgICAgICAgICBzaG93UGVuZGluZ0FwcHJvdmFsOiBzaG93UGVuZGluZ0FwcHJvdmFsLFxuICAgICAgICAgICAgc2hvd1Byb2dyZXNzOiBzaG93UHJvZ3Jlc3NQYWdlLFxuICAgICAgICAgICAgc2hvd0NvbW1lbnRzOiBzaG93Q29tbWVudHMsXG4gICAgICAgICAgICBzaG93TG9jYXRpb25zOiBzaG93TG9jYXRpb25zLFxuICAgICAgICAgICAgaGFuZGxlUmVhY3Rpb25FcnJvcjogaGFuZGxlUmVhY3Rpb25FcnJvcixcbiAgICAgICAgICAgIGVsZW1lbnQ6IHBhZ2VDb250YWluZXIocmFjdGl2ZSksXG4gICAgICAgICAgICByZWFjdGlvbnNXaW5kb3c6ICRyb290RWxlbWVudFxuICAgICAgICB9O1xuICAgICAgICB2YXIgcGFnZSA9IFJlYWN0aW9uc1BhZ2UuY3JlYXRlKG9wdGlvbnMpO1xuICAgICAgICBwYWdlcy5wdXNoKHBhZ2UpO1xuICAgICAgICBzaG93UGFnZShwYWdlLnNlbGVjdG9yLCAkcm9vdEVsZW1lbnQsIGFuaW1hdGUsIGZhbHNlKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzaG93Q29uZmlybWF0aW9uKHJlYWN0aW9uRGF0YSwgcmVhY3Rpb25Qcm92aWRlcikge1xuICAgICAgICBzZXRXaW5kb3dUaXRsZShNZXNzYWdlcy5nZXRNZXNzYWdlKCdyZWFjdGlvbnNfd2lkZ2V0X190aXRsZV90aGFua3MnKSk7XG4gICAgICAgIHZhciBwYWdlID0gQ29uZmlybWF0aW9uUGFnZS5jcmVhdGUocmVhY3Rpb25EYXRhLnRleHQsIHJlYWN0aW9uUHJvdmlkZXIsIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzLCBwYWdlQ29udGFpbmVyKHJhY3RpdmUpKTtcbiAgICAgICAgcGFnZXMucHVzaChwYWdlKTtcbiAgICAgICAgLy8gVE9ETzogcmV2aXNpdCB3aHkgd2UgbmVlZCB0byB1c2UgdGhlIHRpbWVvdXQgdHJpY2sgZm9yIHRoZSBjb25maXJtIHBhZ2UsIGJ1dCBub3QgZm9yIHRoZSBkZWZhdWx0cyBwYWdlXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IC8vIEluIG9yZGVyIGZvciB0aGUgcG9zaXRpb25pbmcgYW5pbWF0aW9uIHRvIHdvcmssIHdlIG5lZWQgdG8gbGV0IHRoZSBicm93c2VyIHJlbmRlciB0aGUgYXBwZW5kZWQgRE9NIGVsZW1lbnRcbiAgICAgICAgICAgIHNob3dQYWdlKHBhZ2Uuc2VsZWN0b3IsICRyb290RWxlbWVudCwgdHJ1ZSk7XG4gICAgICAgIH0sIDEpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNob3dQZW5kaW5nQXBwcm92YWwocmVhY3Rpb24pIHtcbiAgICAgICAgc2V0V2luZG93VGl0bGUoTWVzc2FnZXMuZ2V0TWVzc2FnZSgncmVhY3Rpb25zX3dpZGdldF9fdGl0bGVfdGhhbmtzJykpO1xuICAgICAgICB2YXIgcGFnZSA9IFBlbmRpbmdSZWFjdGlvblBhZ2UuY3JlYXRlUGFnZShyZWFjdGlvbi50ZXh0LCBwYWdlQ29udGFpbmVyKHJhY3RpdmUpKTtcbiAgICAgICAgcGFnZXMucHVzaChwYWdlKTtcbiAgICAgICAgLy8gVE9ETzogcmV2aXNpdCB3aHkgd2UgbmVlZCB0byB1c2UgdGhlIHRpbWVvdXQgdHJpY2sgZm9yIHRoZSBjb25maXJtIHBhZ2UsIGJ1dCBub3QgZm9yIHRoZSBkZWZhdWx0cyBwYWdlXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IC8vIEluIG9yZGVyIGZvciB0aGUgcG9zaXRpb25pbmcgYW5pbWF0aW9uIHRvIHdvcmssIHdlIG5lZWQgdG8gbGV0IHRoZSBicm93c2VyIHJlbmRlciB0aGUgYXBwZW5kZWQgRE9NIGVsZW1lbnRcbiAgICAgICAgICAgIHNob3dQYWdlKHBhZ2Uuc2VsZWN0b3IsICRyb290RWxlbWVudCwgdHJ1ZSk7XG4gICAgICAgIH0sIDEpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNob3dQcm9ncmVzc1BhZ2UoKSB7XG4gICAgICAgIHNob3dQYWdlKCcuYW50ZW5uYS1wcm9ncmVzcy1wYWdlJywgJHJvb3RFbGVtZW50LCBmYWxzZSwgdHJ1ZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2hvd0NvbW1lbnRzKHJlYWN0aW9uLCBiYWNrUGFnZVNlbGVjdG9yKSB7XG4gICAgICAgIHNob3dQcm9ncmVzc1BhZ2UoKTsgLy8gVE9ETzogcHJvdmlkZSBzb21lIHdheSBmb3IgdGhlIHVzZXIgdG8gZ2l2ZSB1cCAvIGNhbmNlbC4gQWxzbywgaGFuZGxlIGVycm9ycyBmZXRjaGluZyBjb21tZW50cy5cbiAgICAgICAgdmFyIHN1Y2Nlc3MgPSBmdW5jdGlvbihjb21tZW50cykge1xuICAgICAgICAgICAgdmFyIG9wdGlvbnMgPSB7XG4gICAgICAgICAgICAgICAgcmVhY3Rpb246IHJlYWN0aW9uLFxuICAgICAgICAgICAgICAgIGNvbW1lbnRzOiBjb21tZW50cyxcbiAgICAgICAgICAgICAgICBlbGVtZW50OiBwYWdlQ29udGFpbmVyKHJhY3RpdmUpLFxuICAgICAgICAgICAgICAgIGdvQmFjazogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHNldFdpbmRvd1RpdGxlKE1lc3NhZ2VzLmdldE1lc3NhZ2UoJ3JlYWN0aW9uc193aWRnZXRfX3RpdGxlJykpO1xuICAgICAgICAgICAgICAgICAgICBnb0JhY2tUb1BhZ2UocGFnZXMsIGJhY2tQYWdlU2VsZWN0b3IsICRyb290RWxlbWVudCk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBjb250YWluZXJEYXRhOiBjb250YWluZXJEYXRhLFxuICAgICAgICAgICAgICAgIHBhZ2VEYXRhOiBwYWdlRGF0YSxcbiAgICAgICAgICAgICAgICBncm91cFNldHRpbmdzOiBncm91cFNldHRpbmdzXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdmFyIHBhZ2UgPSBDb21tZW50c1BhZ2UuY3JlYXRlKG9wdGlvbnMpO1xuICAgICAgICAgICAgcGFnZXMucHVzaChwYWdlKTtcblxuICAgICAgICAgICAgLy8gVE9ETzogcmV2aXNpdFxuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHsgLy8gSW4gb3JkZXIgZm9yIHRoZSBwb3NpdGlvbmluZyBhbmltYXRpb24gdG8gd29yaywgd2UgbmVlZCB0byBsZXQgdGhlIGJyb3dzZXIgcmVuZGVyIHRoZSBhcHBlbmRlZCBET00gZWxlbWVudFxuICAgICAgICAgICAgICAgIHNob3dQYWdlKHBhZ2Uuc2VsZWN0b3IsICRyb290RWxlbWVudCwgdHJ1ZSk7XG4gICAgICAgICAgICB9LCAxKTtcblxuICAgICAgICAgICAgRXZlbnRzLnBvc3RDb21tZW50c1ZpZXdlZChwYWdlRGF0YSwgY29udGFpbmVyRGF0YSwgcmVhY3Rpb24sIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgZXJyb3IgPSBmdW5jdGlvbihtZXNzYWdlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnQW4gZXJyb3Igb2NjdXJyZWQgZmV0Y2hpbmcgY29tbWVudHM6ICcgKyBtZXNzYWdlKTtcbiAgICAgICAgICAgIHNob3dHZW5lcmljRXJyb3JQYWdlKGJhY2tQYWdlU2VsZWN0b3IpO1xuICAgICAgICB9O1xuICAgICAgICBBamF4Q2xpZW50LmdldENvbW1lbnRzKHJlYWN0aW9uLCBncm91cFNldHRpbmdzLCBzdWNjZXNzLCBlcnJvcik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2hvd0xvY2F0aW9ucyhyZWFjdGlvbiwgYmFja1BhZ2VTZWxlY3Rvcikge1xuICAgICAgICBzaG93UHJvZ3Jlc3NQYWdlKCk7IC8vIFRPRE86IHByb3ZpZGUgc29tZSB3YXkgZm9yIHRoZSB1c2VyIHRvIGdpdmUgdXAgLyBjYW5jZWwuIEFsc28sIGhhbmRsZSBlcnJvcnMgZmV0Y2hpbmcgY29tbWVudHMuXG4gICAgICAgIHZhciByZWFjdGlvbkxvY2F0aW9uRGF0YSA9IFBhZ2VEYXRhLmdldFJlYWN0aW9uTG9jYXRpb25EYXRhKHJlYWN0aW9uLCBwYWdlRGF0YSk7XG4gICAgICAgIHZhciBzdWNjZXNzID0gZnVuY3Rpb24obG9jYXRpb25EZXRhaWxzKSB7XG4gICAgICAgICAgICBQYWdlRGF0YS51cGRhdGVSZWFjdGlvbkxvY2F0aW9uRGF0YShyZWFjdGlvbkxvY2F0aW9uRGF0YSwgbG9jYXRpb25EZXRhaWxzKTtcbiAgICAgICAgICAgIHZhciBvcHRpb25zID0geyAvLyBUT0RPOiBjbGVhbiB1cCB0aGUgbnVtYmVyIG9mIHRoZXNlIFwib3B0aW9uc1wiIG9iamVjdHMgdGhhdCB3ZSBjcmVhdGUuXG4gICAgICAgICAgICAgICAgZWxlbWVudDogcGFnZUNvbnRhaW5lcihyYWN0aXZlKSxcbiAgICAgICAgICAgICAgICByZWFjdGlvbkxvY2F0aW9uRGF0YTogcmVhY3Rpb25Mb2NhdGlvbkRhdGEsXG4gICAgICAgICAgICAgICAgcGFnZURhdGE6IHBhZ2VEYXRhLFxuICAgICAgICAgICAgICAgIGdyb3VwU2V0dGluZ3M6IGdyb3VwU2V0dGluZ3MsXG4gICAgICAgICAgICAgICAgY2xvc2VXaW5kb3c6IGNsb3NlQWxsV2luZG93cyxcbiAgICAgICAgICAgICAgICBnb0JhY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBzZXRXaW5kb3dUaXRsZShNZXNzYWdlcy5nZXRNZXNzYWdlKCdyZWFjdGlvbnNfd2lkZ2V0X190aXRsZScpKTtcbiAgICAgICAgICAgICAgICAgICAgZ29CYWNrVG9QYWdlKHBhZ2VzLCBiYWNrUGFnZVNlbGVjdG9yLCAkcm9vdEVsZW1lbnQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB2YXIgcGFnZSA9IExvY2F0aW9uc1BhZ2UuY3JlYXRlKG9wdGlvbnMpO1xuICAgICAgICAgICAgcGFnZXMucHVzaChwYWdlKTtcbiAgICAgICAgICAgIHNldFdpbmRvd1RpdGxlKHJlYWN0aW9uLnRleHQpO1xuICAgICAgICAgICAgLy8gVE9ETzogcmV2aXNpdFxuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHsgLy8gSW4gb3JkZXIgZm9yIHRoZSBwb3NpdGlvbmluZyBhbmltYXRpb24gdG8gd29yaywgd2UgbmVlZCB0byBsZXQgdGhlIGJyb3dzZXIgcmVuZGVyIHRoZSBhcHBlbmRlZCBET00gZWxlbWVudFxuICAgICAgICAgICAgICAgIHNob3dQYWdlKHBhZ2Uuc2VsZWN0b3IsICRyb290RWxlbWVudCwgdHJ1ZSk7XG4gICAgICAgICAgICB9LCAxKTtcbiAgICAgICAgICAgIEV2ZW50cy5wb3N0TG9jYXRpb25zVmlld2VkKHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIGVycm9yID0gZnVuY3Rpb24obWVzc2FnZSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ0FuIGVycm9yIG9jY3VycmVkIGZldGNoaW5nIGNvbnRlbnQgYm9kaWVzOiAnICsgbWVzc2FnZSk7XG4gICAgICAgICAgICBzaG93R2VuZXJpY0Vycm9yUGFnZShiYWNrUGFnZVNlbGVjdG9yKTtcbiAgICAgICAgfTtcbiAgICAgICAgQWpheENsaWVudC5mZXRjaExvY2F0aW9uRGV0YWlscyhyZWFjdGlvbkxvY2F0aW9uRGF0YSwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MsIHN1Y2Nlc3MsIGVycm9yKTtcbiAgICB9XG5cbiAgICAvLyBTaG93cyB0aGUgbG9naW4gcGFnZSwgd2l0aCBhIHByb21wdCB0byBnbyBCYWNrIHRvIHRoZSBwYWdlIHNwZWNpZmllZCBieSB0aGUgZ2l2ZW4gcGFnZSBzZWxlY3Rvci5cbiAgICBmdW5jdGlvbiBzaG93TG9naW5QYWdlKGJhY2tQYWdlU2VsZWN0b3IsIHJldHJ5Q2FsbGJhY2spIHtcbiAgICAgICAgc2V0V2luZG93VGl0bGUoTWVzc2FnZXMuZ2V0TWVzc2FnZSgncmVhY3Rpb25zX3dpZGdldF9fdGl0bGVfc2lnbmluJykpO1xuICAgICAgICB2YXIgb3B0aW9ucyA9IHtcbiAgICAgICAgICAgIGVsZW1lbnQ6IHBhZ2VDb250YWluZXIocmFjdGl2ZSksXG4gICAgICAgICAgICBncm91cFNldHRpbmdzOiBncm91cFNldHRpbmdzLFxuICAgICAgICAgICAgZ29CYWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBzZXRXaW5kb3dUaXRsZShNZXNzYWdlcy5nZXRNZXNzYWdlKCdyZWFjdGlvbnNfd2lkZ2V0X190aXRsZScpKTtcbiAgICAgICAgICAgICAgICBnb0JhY2tUb1BhZ2UocGFnZXMsIGJhY2tQYWdlU2VsZWN0b3IsICRyb290RWxlbWVudCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmV0cnk6IHJldHJ5Q2FsbGJhY2tcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIHBhZ2UgPSBMb2dpblBhZ2UuY3JlYXRlUGFnZShvcHRpb25zKTtcbiAgICAgICAgcGFnZXMucHVzaChwYWdlKTtcblxuICAgICAgICAvLyBUT0RPOiByZXZpc2l0IHdoeSB3ZSBuZWVkIHRvIHVzZSB0aGUgdGltZW91dCB0cmljayBmb3IgdGhlIGNvbmZpcm0gcGFnZSwgYnV0IG5vdCBmb3IgdGhlIGRlZmF1bHRzIHBhZ2VcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHsgLy8gSW4gb3JkZXIgZm9yIHRoZSBwb3NpdGlvbmluZyBhbmltYXRpb24gdG8gd29yaywgd2UgbmVlZCB0byBsZXQgdGhlIGJyb3dzZXIgcmVuZGVyIHRoZSBhcHBlbmRlZCBET00gZWxlbWVudFxuICAgICAgICAgICAgc2hvd1BhZ2UocGFnZS5zZWxlY3RvciwgJHJvb3RFbGVtZW50LCB0cnVlKTtcbiAgICAgICAgfSwgMSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2hvd0Jsb2NrZWRSZWFjdGlvblBhZ2UoYmFja1BhZ2VTZWxlY3Rvcikge1xuICAgICAgICBzZXRXaW5kb3dUaXRsZShNZXNzYWdlcy5nZXRNZXNzYWdlKCdyZWFjdGlvbnNfd2lkZ2V0X190aXRsZV9ibG9ja2VkJykpO1xuICAgICAgICB2YXIgb3B0aW9ucyA9IHtcbiAgICAgICAgICAgIGVsZW1lbnQ6IHBhZ2VDb250YWluZXIocmFjdGl2ZSksXG4gICAgICAgICAgICBncm91cFNldHRpbmdzOiBncm91cFNldHRpbmdzLFxuICAgICAgICAgICAgZ29CYWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBzZXRXaW5kb3dUaXRsZShNZXNzYWdlcy5nZXRNZXNzYWdlKCdyZWFjdGlvbnNfd2lkZ2V0X190aXRsZScpKTtcbiAgICAgICAgICAgICAgICBnb0JhY2tUb1BhZ2UocGFnZXMsIGJhY2tQYWdlU2VsZWN0b3IsICRyb290RWxlbWVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHZhciBwYWdlID0gQmxvY2tlZFJlYWN0aW9uUGFnZS5jcmVhdGVQYWdlKG9wdGlvbnMpO1xuICAgICAgICBwYWdlcy5wdXNoKHBhZ2UpO1xuXG4gICAgICAgIC8vIFRPRE86IHJldmlzaXQgd2h5IHdlIG5lZWQgdG8gdXNlIHRoZSB0aW1lb3V0IHRyaWNrIGZvciB0aGUgY29uZmlybSBwYWdlLCBidXQgbm90IGZvciB0aGUgZGVmYXVsdHMgcGFnZVxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyAvLyBJbiBvcmRlciBmb3IgdGhlIHBvc2l0aW9uaW5nIGFuaW1hdGlvbiB0byB3b3JrLCB3ZSBuZWVkIHRvIGxldCB0aGUgYnJvd3NlciByZW5kZXIgdGhlIGFwcGVuZGVkIERPTSBlbGVtZW50XG4gICAgICAgICAgICBzaG93UGFnZShwYWdlLnNlbGVjdG9yLCAkcm9vdEVsZW1lbnQsIHRydWUpO1xuICAgICAgICB9LCAxKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzaG93R2VuZXJpY0Vycm9yUGFnZShiYWNrUGFnZVNlbGVjdG9yKSB7XG4gICAgICAgIHNldFdpbmRvd1RpdGxlKE1lc3NhZ2VzLmdldE1lc3NhZ2UoJ3JlYWN0aW9uc193aWRnZXRfX3RpdGxlX2Vycm9yJykpO1xuICAgICAgICB2YXIgb3B0aW9ucyA9IHtcbiAgICAgICAgICAgIGVsZW1lbnQ6IHBhZ2VDb250YWluZXIocmFjdGl2ZSksXG4gICAgICAgICAgICBnb0JhY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHNldFdpbmRvd1RpdGxlKE1lc3NhZ2VzLmdldE1lc3NhZ2UoJ3JlYWN0aW9uc193aWRnZXRfX3RpdGxlJykpO1xuICAgICAgICAgICAgICAgIGdvQmFja1RvUGFnZShwYWdlcywgYmFja1BhZ2VTZWxlY3RvciwgJHJvb3RFbGVtZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgdmFyIHBhZ2UgPSBHZW5lcmljRXJyb3JQYWdlLmNyZWF0ZVBhZ2Uob3B0aW9ucyk7XG4gICAgICAgIHBhZ2VzLnB1c2gocGFnZSk7XG5cbiAgICAgICAgLy8gVE9ETzogcmV2aXNpdCB3aHkgd2UgbmVlZCB0byB1c2UgdGhlIHRpbWVvdXQgdHJpY2sgZm9yIHRoZSBjb25maXJtIHBhZ2UsIGJ1dCBub3QgZm9yIHRoZSBkZWZhdWx0cyBwYWdlXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IC8vIEluIG9yZGVyIGZvciB0aGUgcG9zaXRpb25pbmcgYW5pbWF0aW9uIHRvIHdvcmssIHdlIG5lZWQgdG8gbGV0IHRoZSBicm93c2VyIHJlbmRlciB0aGUgYXBwZW5kZWQgRE9NIGVsZW1lbnRcbiAgICAgICAgICAgIHNob3dQYWdlKHBhZ2Uuc2VsZWN0b3IsICRyb290RWxlbWVudCwgdHJ1ZSk7XG4gICAgICAgIH0sIDEpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGhhbmRsZVJlYWN0aW9uRXJyb3IobWVzc2FnZSwgcmV0cnlDYWxsYmFjaywgYmFja1BhZ2VTZWxlY3Rvcikge1xuICAgICAgICBpZiAobWVzc2FnZS5pbmRleE9mKCdzaWduIGluIHJlcXVpcmVkIGZvciBvcmdhbmljIHJlYWN0aW9ucycpICE9PSAtMSkge1xuICAgICAgICAgICAgc2hvd0xvZ2luUGFnZShiYWNrUGFnZVNlbGVjdG9yLCByZXRyeUNhbGxiYWNrKTtcbiAgICAgICAgfSBlbHNlIGlmIChtZXNzYWdlLmluZGV4T2YoJ0dyb3VwIGhhcyBibG9ja2VkIHRoaXMgdGFnLicpICE9PSAtMSkge1xuICAgICAgICAgICAgc2hvd0Jsb2NrZWRSZWFjdGlvblBhZ2UoYmFja1BhZ2VTZWxlY3Rvcik7XG4gICAgICAgIH0gZWxzZSBpZiAoaXNUb2tlbkVycm9yKG1lc3NhZ2UpKSB7XG4gICAgICAgICAgICBVc2VyLnJlQXV0aG9yaXplVXNlcihmdW5jdGlvbihoYXNOZXdUb2tlbikge1xuICAgICAgICAgICAgICAgIGlmIChoYXNOZXdUb2tlbikge1xuICAgICAgICAgICAgICAgICAgICByZXRyeUNhbGxiYWNrKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgc2hvd0xvZ2luUGFnZShiYWNrUGFnZVNlbGVjdG9yLCByZXRyeUNhbGxiYWNrKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiZXJyb3IgcG9zdGluZyByZWFjdGlvbjogXCIgKyBtZXNzYWdlKTtcbiAgICAgICAgICAgIHNob3dHZW5lcmljRXJyb3JQYWdlKGJhY2tQYWdlU2VsZWN0b3IpO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gaXNUb2tlbkVycm9yKG1lc3NhZ2UpIHtcbiAgICAgICAgICAgIHN3aXRjaChtZXNzYWdlKSB7XG4gICAgICAgICAgICAgICAgY2FzZSBcIlRva2VuIHdhcyBpbnZhbGlkXCI6XG4gICAgICAgICAgICAgICAgY2FzZSBcIkZhY2Vib29rIHRva2VuIGV4cGlyZWRcIjpcbiAgICAgICAgICAgICAgICBjYXNlIFwiRkIgZ3JhcGggZXJyb3IgLSB0b2tlbiBpbnZhbGlkXCI6XG4gICAgICAgICAgICAgICAgY2FzZSBcIlNvY2lhbCBBdXRoIGRvZXMgbm90IGV4aXN0IGZvciB1c2VyXCI6XG4gICAgICAgICAgICAgICAgY2FzZSBcIkRhdGEgdG8gY3JlYXRlIHRva2VuIGlzIG1pc3NpbmdcIjpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzZXRXaW5kb3dUaXRsZSh0aXRsZSkge1xuICAgICAgICAkKHJhY3RpdmUuZmluZCgnLmFudGVubmEtcmVhY3Rpb25zLXRpdGxlJykpLmh0bWwodGl0bGUpO1xuICAgIH1cblxufVxuXG5mdW5jdGlvbiByb290RWxlbWVudChyYWN0aXZlKSB7XG4gICAgcmV0dXJuIHJhY3RpdmUuZmluZChTRUxFQ1RPUl9SRUFDVElPTlNfV0lER0VUKTtcbn1cblxuZnVuY3Rpb24gcGFnZUNvbnRhaW5lcihyYWN0aXZlKSB7XG4gICAgcmV0dXJuIHJhY3RpdmUuZmluZCgnLmFudGVubmEtcGFnZS1jb250YWluZXInKTtcbn1cblxudmFyIHBhZ2VaID0gMTAwMDsgLy8gSXQncyBzYWZlIGZvciB0aGlzIHZhbHVlIHRvIGdvIGFjcm9zcyBpbnN0YW5jZXMuIFdlIGp1c3QgbmVlZCBpdCB0byBjb250aW51b3VzbHkgaW5jcmVhc2UgKG1heCB2YWx1ZSBpcyBvdmVyIDIgYmlsbGlvbikuXG5cbmZ1bmN0aW9uIHNob3dQYWdlKHBhZ2VTZWxlY3RvciwgJHJvb3RFbGVtZW50LCBhbmltYXRlLCBvdmVybGF5KSB7XG4gICAgdmFyICRwYWdlID0gJHJvb3RFbGVtZW50LmZpbmQocGFnZVNlbGVjdG9yKTtcbiAgICAkcGFnZS5jc3MoJ3otaW5kZXgnLCBwYWdlWik7XG4gICAgcGFnZVogKz0gMTtcblxuICAgICRwYWdlLnRvZ2dsZUNsYXNzKCdhbnRlbm5hLXBhZ2UtYW5pbWF0ZScsIGFuaW1hdGUpO1xuXG4gICAgdmFyICRjdXJyZW50ID0gJHJvb3RFbGVtZW50LmZpbmQoJy5hbnRlbm5hLXBhZ2UtYWN0aXZlJykubm90KHBhZ2VTZWxlY3Rvcik7XG4gICAgaWYgKG92ZXJsYXkpIHtcbiAgICAgICAgLy8gSW4gdGhlIG92ZXJsYXkgY2FzZSwgc2l6ZSB0aGUgcGFnZSB0byBtYXRjaCB3aGF0ZXZlciBwYWdlIGlzIGN1cnJlbnRseSBzaG93aW5nIGFuZCB0aGVuIG1ha2UgaXQgYWN0aXZlICh0aGVyZSB3aWxsIGJlIHR3byAnYWN0aXZlJyBwYWdlcylcbiAgICAgICAgJHBhZ2UuaGVpZ2h0KCRjdXJyZW50LmhlaWdodCgpKTtcbiAgICAgICAgJHBhZ2UuYWRkQ2xhc3MoJ2FudGVubmEtcGFnZS1hY3RpdmUnKTtcbiAgICB9IGVsc2UgaWYgKGFuaW1hdGUpIHtcbiAgICAgICAgVHJhbnNpdGlvblV0aWwudG9nZ2xlQ2xhc3MoJHBhZ2UsICdhbnRlbm5hLXBhZ2UtYWN0aXZlJywgdHJ1ZSwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAvLyBBZnRlciB0aGUgbmV3IHBhZ2Ugc2xpZGVzIGludG8gcG9zaXRpb24sIG1vdmUgdGhlIG90aGVyIHBhZ2VzIGJhY2sgb3V0IG9mIHRoZSB2aWV3YWJsZSBhcmVhXG4gICAgICAgICAgICAkY3VycmVudC5yZW1vdmVDbGFzcygnYW50ZW5uYS1wYWdlLWFjdGl2ZScpO1xuICAgICAgICAgICAgJHBhZ2UuZm9jdXMoKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHNpemVCb2R5VG9GaXQoJHJvb3RFbGVtZW50LCAkcGFnZSwgYW5pbWF0ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgJHBhZ2UuYWRkQ2xhc3MoJ2FudGVubmEtcGFnZS1hY3RpdmUnKTtcbiAgICAgICAgJGN1cnJlbnQucmVtb3ZlQ2xhc3MoJ2FudGVubmEtcGFnZS1hY3RpdmUnKTtcbiAgICAgICAgJHBhZ2UuZm9jdXMoKTtcbiAgICAgICAgc2l6ZUJvZHlUb0ZpdCgkcm9vdEVsZW1lbnQsICRwYWdlLCBhbmltYXRlKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGdvQmFja1RvUGFnZShwYWdlcywgcGFnZVNlbGVjdG9yLCAkcm9vdEVsZW1lbnQpIHtcbiAgICB2YXIgJHRhcmdldFBhZ2UgPSAkcm9vdEVsZW1lbnQuZmluZChwYWdlU2VsZWN0b3IpO1xuICAgIHZhciAkY3VycmVudFBhZ2UgPSAkcm9vdEVsZW1lbnQuZmluZCgnLmFudGVubmEtcGFnZS1hY3RpdmUnKTtcbiAgICAvLyBNb3ZlIHRoZSB0YXJnZXQgcGFnZSBpbnRvIHBsYWNlLCB1bmRlciB0aGUgY3VycmVudCBwYWdlXG4gICAgJHRhcmdldFBhZ2UuY3NzKCd6LWluZGV4JywgcGFyc2VJbnQoJGN1cnJlbnRQYWdlLmNzcygnei1pbmRleCcpKSAtIDEpO1xuICAgICR0YXJnZXRQYWdlLnRvZ2dsZUNsYXNzKCdhbnRlbm5hLXBhZ2UtYW5pbWF0ZScsIGZhbHNlKTtcbiAgICAkdGFyZ2V0UGFnZS50b2dnbGVDbGFzcygnYW50ZW5uYS1wYWdlLWFjdGl2ZScsIHRydWUpO1xuXG4gICAgLy8gVGhlbiBhbmltYXRlIHRoZSBjdXJyZW50IHBhZ2UgbW92aW5nIGF3YXkgdG8gcmV2ZWFsIHRoZSB0YXJnZXQuXG4gICAgJGN1cnJlbnRQYWdlLnRvZ2dsZUNsYXNzKCdhbnRlbm5hLXBhZ2UtYW5pbWF0ZScsIHRydWUpO1xuICAgIFRyYW5zaXRpb25VdGlsLnRvZ2dsZUNsYXNzKCRjdXJyZW50UGFnZSwgJ2FudGVubmEtcGFnZS1hY3RpdmUnLCBmYWxzZSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAvLyBBZnRlciB0aGUgY3VycmVudCBwYWdlIHNsaWRlcyBpbnRvIHBvc2l0aW9uLCBtb3ZlIGFsbCBvdGhlciBwYWdlcyBiYWNrIG91dCBvZiB0aGUgdmlld2FibGUgYXJlYVxuICAgICAgICAkcm9vdEVsZW1lbnQuZmluZCgnLmFudGVubmEtcGFnZScpLm5vdChwYWdlU2VsZWN0b3IpLnJlbW92ZUNsYXNzKCdhbnRlbm5hLXBhZ2UtYWN0aXZlJyk7XG4gICAgICAgICR0YXJnZXRQYWdlLmNzcygnei1pbmRleCcsIHBhZ2VaKyspOyAvLyBXaGVuIHRoZSBhbmltYXRpb24gaXMgZG9uZSwgbWFrZSBzdXJlIHRoZSBjdXJyZW50IHBhZ2UgaGFzIHRoZSBoaWdoZXN0IHotaW5kZXggKGp1c3QgZm9yIGNvbnNpc3RlbmN5KVxuICAgICAgICAvLyBUZWFyZG93biBhbGwgb3RoZXIgcGFnZXMuIFRoZXknbGwgYmUgcmUtY3JlYXRlZCBpZiBuZWNlc3NhcnkuXG4gICAgICAgIHZhciByZW1haW5pbmdQYWdlcyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBhZ2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgcGFnZSA9IHBhZ2VzW2ldO1xuICAgICAgICAgICAgaWYgKHBhZ2Uuc2VsZWN0b3IgPT09IHBhZ2VTZWxlY3Rvcikge1xuICAgICAgICAgICAgICAgIHJlbWFpbmluZ1BhZ2VzLnB1c2gocGFnZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHBhZ2UudGVhcmRvd24oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBwYWdlcyA9IHJlbWFpbmluZ1BhZ2VzO1xuICAgIH0pO1xuICAgIHNpemVCb2R5VG9GaXQoJHJvb3RFbGVtZW50LCAkdGFyZ2V0UGFnZSwgdHJ1ZSk7XG59XG5cbmZ1bmN0aW9uIHNpemVCb2R5VG9GaXQoJHJvb3RFbGVtZW50LCAkcGFnZSwgYW5pbWF0ZSkge1xuICAgIHZhciAkcGFnZUNvbnRhaW5lciA9ICRyb290RWxlbWVudC5maW5kKCcuYW50ZW5uYS1wYWdlLWNvbnRhaW5lcicpO1xuICAgIHZhciAkYm9keSA9ICRwYWdlLmZpbmQoJy5hbnRlbm5hLWJvZHknKTtcbiAgICB2YXIgY3VycmVudEhlaWdodCA9ICRwYWdlQ29udGFpbmVyLmNzcygnaGVpZ2h0Jyk7XG4gICAgJHBhZ2VDb250YWluZXIuY3NzKHsgaGVpZ2h0OiAnJyB9KTsgLy8gQ2xlYXIgYW55IHByZXZpb3VzbHkgY29tcHV0ZWQgaGVpZ2h0IHNvIHdlIGdldCBhIGZyZXNoIGNvbXB1dGF0aW9uIG9mIHRoZSBjaGlsZCBoZWlnaHRzXG4gICAgdmFyIG5ld0JvZHlIZWlnaHQgPSBNYXRoLm1pbigzMDAsICRib2R5LmdldCgwKS5zY3JvbGxIZWlnaHQpO1xuICAgICRib2R5LmNzcyh7IGhlaWdodDogbmV3Qm9keUhlaWdodCB9KTtcbiAgICB2YXIgZm9vdGVySGVpZ2h0ID0gJHBhZ2UuZmluZCgnLmFudGVubmEtZm9vdGVyJykub3V0ZXJIZWlnaHQoKTsgLy8gcmV0dXJucyAnbnVsbCcgaWYgdGhlcmUncyBubyBmb290ZXIuIGFkZGVkIHRvIGFuIGludGVnZXIsICdudWxsJyBhY3RzIGxpa2UgMFxuICAgIHZhciBuZXdQYWdlSGVpZ2h0ID0gbmV3Qm9keUhlaWdodCArIGZvb3RlckhlaWdodDtcbiAgICBpZiAoYW5pbWF0ZSkge1xuICAgICAgICAkcGFnZUNvbnRhaW5lci5jc3MoeyBoZWlnaHQ6IGN1cnJlbnRIZWlnaHQgfSk7XG4gICAgICAgICRwYWdlQ29udGFpbmVyLmFuaW1hdGUoeyBoZWlnaHQ6IG5ld1BhZ2VIZWlnaHQgfSwgMjAwKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAkcGFnZUNvbnRhaW5lci5jc3MoeyBoZWlnaHQ6IG5ld1BhZ2VIZWlnaHQgfSk7XG4gICAgfVxuICAgIHZhciBtaW5XaWR0aCA9ICRwYWdlLmNzcygnbWluLXdpZHRoJyk7XG4gICAgdmFyIHdpZHRoID0gcGFyc2VJbnQobWluV2lkdGgpO1xuICAgIGlmICh3aWR0aCA+IDApIHtcbiAgICAgICAgaWYgKGFuaW1hdGUpIHtcbiAgICAgICAgICAgICRyb290RWxlbWVudC5hbmltYXRlKHsgd2lkdGg6IHdpZHRoIH0sIDIwMCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkcm9vdEVsZW1lbnQuY3NzKHsgd2lkdGg6IHdpZHRoIH0pO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBzZXR1cFdpbmRvd0Nsb3NlKHBhZ2VzLCByYWN0aXZlKSB7XG4gICAgdmFyICRyb290RWxlbWVudCA9ICQocm9vdEVsZW1lbnQocmFjdGl2ZSkpO1xuXG4gICAgLy8gVE9ETzogSWYgeW91IG1vdXNlIG92ZXIgdGhlIHRyaWdnZXIgc2xvd2x5IGZyb20gdGhlIHRvcCBsZWZ0LCB0aGUgd2luZG93IG9wZW5zIHdpdGhvdXQgYmVpbmcgdW5kZXIgdGhlIGN1cnNvcixcbiAgICAvLyAgICAgICBzbyBubyBtb3VzZW91dCBldmVudCBpcyByZWNlaXZlZC4gV2hlbiB3ZSBvcGVuIHRoZSB3aW5kb3csIHdlIHNob3VsZCBwcm9iYWJseSBqdXN0IHNjb290IGl0IHVwIHNsaWdodGx5XG4gICAgLy8gICAgICAgaWYgbmVlZGVkIHRvIGFzc3VyZSB0aGF0IGl0J3MgdW5kZXIgdGhlIGN1cnNvci4gQWx0ZXJuYXRpdmVseSwgd2UgY291bGQgYWRqdXN0IHRoZSBtb3VzZW92ZXIgYXJlYSB0byBtYXRjaFxuICAgIC8vICAgICAgIHRoZSByZWdpb24gdGhhdCB0aGUgd2luZG93IG9wZW5zLlxuICAgICRyb290RWxlbWVudFxuICAgICAgICAub24oJ21vdXNlb3V0LmFudGVubmEnLCBkZWxheWVkQ2xvc2VXaW5kb3cpXG4gICAgICAgIC5vbignbW91c2VvdmVyLmFudGVubmEnLCBrZWVwV2luZG93T3BlbilcbiAgICAgICAgLm9uKCdmb2N1c2luLmFudGVubmEnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIE9uY2UgdGhlIHdpbmRvdyBoYXMgZm9jdXMsIGRvbid0IGNsb3NlIGl0IG9uIG1vdXNlb3V0LlxuICAgICAgICAgICAga2VlcFdpbmRvd09wZW4oKTtcbiAgICAgICAgICAgICRyb290RWxlbWVudC5vZmYoJ21vdXNlb3V0LmFudGVubmEnKTtcbiAgICAgICAgICAgICRyb290RWxlbWVudC5vZmYoJ21vdXNlb3Zlci5hbnRlbm5hJyk7XG4gICAgICAgIH0pO1xuICAgICQoZG9jdW1lbnQpLm9uKCdjbGljay5hbnRlbm5hJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgaWYgKCQoZXZlbnQudGFyZ2V0KS5jbG9zZXN0KFNFTEVDVE9SX1JFQUNUSU9OU19XSURHRVQpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgY2xvc2VBbGxXaW5kb3dzKCk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICB2YXIgdGFwTGlzdGVuZXIgPSBUb3VjaFN1cHBvcnQuc2V0dXBUYXAoZG9jdW1lbnQsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGlmICgkKGV2ZW50LnRhcmdldCkuY2xvc2VzdChTRUxFQ1RPUl9SRUFDVElPTlNfV0lER0VUKS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIGNsb3NlQWxsV2luZG93cygpO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICB2YXIgY2xvc2VUaW1lcjtcblxuICAgIGZ1bmN0aW9uIGRlbGF5ZWRDbG9zZVdpbmRvdygpIHtcbiAgICAgICAgY2xvc2VUaW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBjbG9zZVRpbWVyID0gbnVsbDtcbiAgICAgICAgICAgIGNsb3NlQWxsV2luZG93cygpO1xuICAgICAgICB9LCA1MDApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGtlZXBXaW5kb3dPcGVuKCkge1xuICAgICAgICBjbGVhclRpbWVvdXQoY2xvc2VUaW1lcik7XG4gICAgfVxuXG4gICAgcmFjdGl2ZS5vbignaW50ZXJuYWxDbG9zZVdpbmRvdycsIGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBDbG9zZXMgb25lIHBhcnRpY3VsYXIgcmVhY3Rpb24gd2luZG93LiBUaGlzIGZ1bmN0aW9uIHNob3VsZCBvbmx5IGJlIGNhbGxlZCBmcm9tIGNsb3NlQWxsV2luZG93cywgd2hpY2ggYWxzb1xuICAgICAgICAvLyBjbGVhbnMgdXAgdGhlIGhhbmRsZXMgd2UgbWFpbnRhaW4gdG8gYWxsIHdpbmRvd3MuXG4gICAgICAgIGNsZWFyVGltZW91dChjbG9zZVRpbWVyKTtcblxuICAgICAgICAkcm9vdEVsZW1lbnQuc3RvcCh0cnVlLCB0cnVlKS5mYWRlT3V0KCdmYXN0JywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAkcm9vdEVsZW1lbnQuY3NzKCdkaXNwbGF5JywgJycpOyAvLyBDbGVhciB0aGUgZGlzcGxheTpub25lIHRoYXQgZmFkZU91dCBwdXRzIG9uIHRoZSBlbGVtZW50XG4gICAgICAgICAgICAkcm9vdEVsZW1lbnQucmVtb3ZlQ2xhc3MoJ2FudGVubmEtcmVhY3Rpb25zLW9wZW4nKTtcblxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYWdlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHBhZ2VzW2ldLnRlYXJkb3duKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByYWN0aXZlLnRlYXJkb3duKCk7XG4gICAgICAgIH0pO1xuICAgICAgICBSYW5nZS5jbGVhckhpZ2hsaWdodHMoKTtcbiAgICAgICAgJHJvb3RFbGVtZW50Lm9mZignLmFudGVubmEnKTsgLy8gVW5iaW5kIGFsbCBvZiB0aGUgaGFuZGxlcnMgaW4gb3VyIG5hbWVzcGFjZVxuICAgICAgICAkKGRvY3VtZW50KS5vZmYoJ2NsaWNrLmFudGVubmEnKTtcbiAgICAgICAgdGFwTGlzdGVuZXIudGVhcmRvd24oKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gY2xvc2VBbGxXaW5kb3dzKCkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb3Blbkluc3RhbmNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBvcGVuSW5zdGFuY2VzW2ldLmZpcmUoJ2ludGVybmFsQ2xvc2VXaW5kb3cnKTtcbiAgICB9XG4gICAgb3Blbkluc3RhbmNlcyA9IFtdO1xufVxuXG5mdW5jdGlvbiBpc09wZW5XaW5kb3coKSB7XG4gICAgcmV0dXJuIG9wZW5JbnN0YW5jZXMubGVuZ3RoID4gMDtcbn1cblxuLy8gUHJldmVudCBzY3JvbGxpbmcgb2YgdGhlIGRvY3VtZW50IGFmdGVyIHdlIHNjcm9sbCB0byB0aGUgdG9wL2JvdHRvbSBvZiB0aGUgcmVhY3Rpb25zIHdpbmRvd1xuLy8gQ29kZSBjb3BpZWQgZnJvbTogaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy81ODAyNDY3L3ByZXZlbnQtc2Nyb2xsaW5nLW9mLXBhcmVudC1lbGVtZW50XG5mdW5jdGlvbiBwcmV2ZW50RXh0cmFTY3JvbGwoJHJvb3RFbGVtZW50KSB7XG4gICAgJHJvb3RFbGVtZW50Lm9uKCdET01Nb3VzZVNjcm9sbC5hbnRlbm5hIG1vdXNld2hlZWwuYW50ZW5uYScsICcuYW50ZW5uYS1ib2R5JywgZnVuY3Rpb24oZXYpIHtcbiAgICAgICAgdmFyICR0aGlzID0gJCh0aGlzKSxcbiAgICAgICAgICAgIHNjcm9sbFRvcCA9IHRoaXMuc2Nyb2xsVG9wLFxuICAgICAgICAgICAgc2Nyb2xsSGVpZ2h0ID0gdGhpcy5zY3JvbGxIZWlnaHQsXG4gICAgICAgICAgICBoZWlnaHQgPSAkdGhpcy5oZWlnaHQoKSxcbiAgICAgICAgICAgIGRlbHRhID0gKGV2LnR5cGUgPT0gJ0RPTU1vdXNlU2Nyb2xsJyA/XG4gICAgICAgICAgICAgICAgZXYub3JpZ2luYWxFdmVudC5kZXRhaWwgKiAtNDAgOlxuICAgICAgICAgICAgICAgIGV2Lm9yaWdpbmFsRXZlbnQud2hlZWxEZWx0YSksXG4gICAgICAgICAgICB1cCA9IGRlbHRhID4gMDtcblxuICAgICAgICBpZiAoc2Nyb2xsSGVpZ2h0IDw9IGhlaWdodCkge1xuICAgICAgICAgICAgLy8gVGhpcyBpcyBhbiBhZGRpdGlvbiB0byB0aGUgU3RhY2tPdmVyZmxvdyBjb2RlLCB0byBtYWtlIHN1cmUgdGhlIHBhZ2Ugc2Nyb2xscyBhcyB1c3VhbCBpZiB0aGUgd2luZG93XG4gICAgICAgICAgICAvLyBjb250ZW50IGRvZXNuJ3Qgc2Nyb2xsLlxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHByZXZlbnQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGV2LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgZXYucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIGV2LnJldHVyblZhbHVlID0gZmFsc2U7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKCF1cCAmJiAtZGVsdGEgPiBzY3JvbGxIZWlnaHQgLSBoZWlnaHQgLSBzY3JvbGxUb3ApIHtcbiAgICAgICAgICAgIC8vIFNjcm9sbGluZyBkb3duLCBidXQgdGhpcyB3aWxsIHRha2UgdXMgcGFzdCB0aGUgYm90dG9tLlxuICAgICAgICAgICAgJHRoaXMuc2Nyb2xsVG9wKHNjcm9sbEhlaWdodCk7XG4gICAgICAgICAgICByZXR1cm4gcHJldmVudCgpO1xuICAgICAgICB9IGVsc2UgaWYgKHVwICYmIGRlbHRhID4gc2Nyb2xsVG9wKSB7XG4gICAgICAgICAgICAvLyBTY3JvbGxpbmcgdXAsIGJ1dCB0aGlzIHdpbGwgdGFrZSB1cyBwYXN0IHRoZSB0b3AuXG4gICAgICAgICAgICAkdGhpcy5zY3JvbGxUb3AoMCk7XG4gICAgICAgICAgICByZXR1cm4gcHJldmVudCgpO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBvcGVuOiBvcGVuUmVhY3Rpb25zV2lkZ2V0LFxuICAgIGlzT3BlbjogaXNPcGVuV2luZG93LFxuICAgIHNlbGVjdG9yOiBTRUxFQ1RPUl9SRUFDVElPTlNfV0lER0VULFxuICAgIHRlYXJkb3duOiBjbG9zZUFsbFdpbmRvd3Ncbn07IiwiLy8gVGhpcyBtb2R1bGUgc2V0cyB1cCBsaXN0ZW5lcnMgb24gdGhlIHJlYWRtb3JlIHdpZGdldCBpbiBvcmRlciB0byByZWNvcmQgZXZlbnRzIHVzaW5nIGFsbCB0aGUgZGF0YSBhdmFpbGFibGUgdG9cbi8vIHRoZSByZWFjdGlvbiB3aWRnZXQuXG5cbnZhciBUaHJvdHRsZWRFdmVudHMgPSByZXF1aXJlKCcuL3V0aWxzL3Rocm90dGxlZC1ldmVudHMnKTtcbnZhciBFdmVudHMgPSByZXF1aXJlKCcuL2V2ZW50cycpO1xuXG5mdW5jdGlvbiBzZXR1cFJlYWRNb3JlRXZlbnRzKGVsZW1lbnQsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIHZpc2liaWxpdHlGaXJlZCA9IGZhbHNlO1xuICAgIHZhciByZWFkTW9yZUVsZW1lbnQgPSBlbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy5hbnRlbm5hLXJlYWRtb3JlJyk7XG4gICAgaWYgKHJlYWRNb3JlRWxlbWVudCkge1xuICAgICAgICB2YXIgcmVhZE1vcmVBY3Rpb24gPSByZWFkTW9yZUVsZW1lbnQucXVlcnlTZWxlY3RvcignLmFudGVubmEtcmVhZG1vcmUtYWN0aW9uJyk7XG4gICAgICAgIGlmIChyZWFkTW9yZUFjdGlvbikge1xuICAgICAgICAgICAgRXZlbnRzLnBvc3RSZWFkTW9yZUxvYWRlZChwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICBzZXR1cFZpc2liaWxpdHlMaXN0ZW5lcigpO1xuICAgICAgICAgICAgLy8gVE9ETzogQm90aCB0aGUgcmVhZG1vcmUgd2lkZ2V0IGFuZCB0aGlzIGNvZGUgc2hvdWxkIGJlIG1vdmVkIHRvIHVzaW5nIHRvdWNoIGV2ZW50c1xuICAgICAgICAgICAgcmVhZE1vcmVBY3Rpb24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmaXJlQ2xpY2tlZCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzZXR1cFZpc2liaWxpdHlMaXN0ZW5lcigpIHtcbiAgICAgICAgaWYgKGlzVmlzaWJsZSgpKSB7XG4gICAgICAgICAgICBmaXJlVmlzaWJsZSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgVGhyb3R0bGVkRXZlbnRzLm9uKCdzY3JvbGwnLCBoYW5kbGVTY3JvbGxFdmVudCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBoYW5kbGVTY3JvbGxFdmVudCgpIHtcbiAgICAgICAgaWYgKGlzVmlzaWJsZSgpKSB7XG4gICAgICAgICAgICBmaXJlVmlzaWJsZSgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNWaXNpYmxlKCkge1xuICAgICAgICB2YXIgY29udGVudEJveCA9IHJlYWRNb3JlRWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgdmFyIHZpZXdwb3J0Qm90dG9tID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudEhlaWdodDtcbiAgICAgICAgcmV0dXJuIGNvbnRlbnRCb3gudG9wID4gMCAmJiBjb250ZW50Qm94LnRvcCA8IHZpZXdwb3J0Qm90dG9tICYmXG4gICAgICAgICAgICAgICAgY29udGVudEJveC5ib3R0b20gPiAwICYmIGNvbnRlbnRCb3guYm90dG9tIDwgdmlld3BvcnRCb3R0b207XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZmlyZUNsaWNrZWQoKSB7XG4gICAgICAgIGlmICghdmlzaWJpbGl0eUZpcmVkKSB7IC8vIERhdGEgaW50ZWdyaXR5IC0gbWFrZSBzdXJlIHdlIGFsd2F5cyBmaXJlIGEgdmlzaWJpbGl0eSBldmVudCBiZWZvcmUgZmlyaW5nIGEgY2xpY2suXG4gICAgICAgICAgICBmaXJlVmlzaWJsZSgpO1xuICAgICAgICB9XG4gICAgICAgIEV2ZW50cy5wb3N0UmVhZE1vcmVDbGlja2VkKHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmaXJlVmlzaWJsZSgpIHtcbiAgICAgICAgaWYgKCF2aXNpYmlsaXR5RmlyZWQpIHsgLy8gZG9uJ3QgZmlyZSBtb3JlIHRoYW4gb25jZVxuICAgICAgICAgICAgRXZlbnRzLnBvc3RSZWFkTW9yZVZpc2libGUocGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgVGhyb3R0bGVkRXZlbnRzLm9mZignc2Nyb2xsJywgaGFuZGxlU2Nyb2xsRXZlbnQpO1xuICAgICAgICB9XG4gICAgICAgIHZpc2liaWxpdHlGaXJlZCA9IHRydWU7XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBzZXR1cFJlYWRNb3JlRXZlbnRzOiBzZXR1cFJlYWRNb3JlRXZlbnRzXG59OyIsInZhciBHcm91cFNldHRpbmdzID0gcmVxdWlyZSgnLi9ncm91cC1zZXR0aW5ncycpO1xudmFyIEhhc2hlZEVsZW1lbnRzID0gcmVxdWlyZSgnLi9oYXNoZWQtZWxlbWVudHMnKTtcbnZhciBQYWdlRGF0YSA9IHJlcXVpcmUoJy4vcGFnZS1kYXRhJyk7XG52YXIgUGFnZURhdGFMb2FkZXIgPSByZXF1aXJlKCcuL3BhZ2UtZGF0YS1sb2FkZXInKTtcbnZhciBQYWdlU2Nhbm5lciA9IHJlcXVpcmUoJy4vcGFnZS1zY2FubmVyJyk7XG52YXIgUG9wdXBXaWRnZXQgPSByZXF1aXJlKCcuL3BvcHVwLXdpZGdldCcpO1xudmFyIFJlYWN0aW9uc1dpZGdldCA9IHJlcXVpcmUoJy4vcmVhY3Rpb25zLXdpZGdldCcpO1xuXG52YXIgTXV0YXRpb25PYnNlcnZlciA9IHJlcXVpcmUoJy4vdXRpbHMvbXV0YXRpb24tb2JzZXJ2ZXInKTtcblxuZnVuY3Rpb24gcmVpbml0aWFsaXplQWxsKCkge1xuICAgIHZhciBncm91cFNldHRpbmdzID0gR3JvdXBTZXR0aW5ncy5nZXQoKTtcbiAgICBpZiAoZ3JvdXBTZXR0aW5ncykge1xuICAgICAgICByZWluaXRpYWxpemUoZ3JvdXBTZXR0aW5ncyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5sb2coJ0FudGVubmEgY2Fubm90IGJlIHJlaW5pdGlhbGl6ZWQuIEdyb3VwIHNldHRpbmdzIGFyZSBub3QgbG9hZGVkLicpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gcmVpbml0aWFsaXplKGdyb3VwU2V0dGluZ3MpIHtcbiAgICBSZWFjdGlvbnNXaWRnZXQudGVhcmRvd24oKTtcbiAgICBQb3B1cFdpZGdldC50ZWFyZG93bigpO1xuICAgIFBhZ2VTY2FubmVyLnRlYXJkb3duKCk7XG4gICAgUGFnZURhdGEudGVhcmRvd24oKTtcbiAgICBIYXNoZWRFbGVtZW50cy50ZWFyZG93bigpO1xuICAgIE11dGF0aW9uT2JzZXJ2ZXIudGVhcmRvd24oKTtcblxuICAgIFBhZ2VEYXRhTG9hZGVyLmxvYWQoZ3JvdXBTZXR0aW5ncyk7XG4gICAgUGFnZVNjYW5uZXIuc2Nhbihncm91cFNldHRpbmdzLCByZWluaXRpYWxpemUpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICByZWluaXRpYWxpemU6IHJlaW5pdGlhbGl6ZSxcbiAgICByZWluaXRpYWxpemVBbGw6IHJlaW5pdGlhbGl6ZUFsbCxcbn07IiwidmFyIFJhY3RpdmVQcm92aWRlciA9IHJlcXVpcmUoJy4vdXRpbHMvcmFjdGl2ZS1wcm92aWRlcicpO1xudmFyIFJhbmd5UHJvdmlkZXIgPSByZXF1aXJlKCcuL3V0aWxzL3Jhbmd5LXByb3ZpZGVyJyk7XG52YXIgSlF1ZXJ5UHJvdmlkZXIgPSByZXF1aXJlKCcuL3V0aWxzL2pxdWVyeS1wcm92aWRlcicpO1xudmFyIEFwcE1vZGUgPSByZXF1aXJlKCcuL3V0aWxzL2FwcC1tb2RlJyk7XG52YXIgVVJMcyA9IHJlcXVpcmUoJy4vdXRpbHMvdXJscycpO1xuXG52YXIgc2NyaXB0cyA9IFtcbiAgICB7c3JjOiAnLy9jZG5qcy5jbG91ZGZsYXJlLmNvbS9hamF4L2xpYnMvanF1ZXJ5LzIuMS40L2pxdWVyeS5taW4uanMnLCBjYWxsYmFjazogSlF1ZXJ5UHJvdmlkZXIubG9hZGVkfSxcbiAgICAvLyBUT0RPIG1pbmlmeSBvdXIgY29tcGlsZWQgUmFjdGl2ZSBhbmQgaG9zdCBpdCBvbiBhIENETlxuICAgIHtzcmM6IFVSTHMuYW1hem9uUzNVcmwoKSArICcvd2lkZ2V0LW5ldy9saWIvcmFjdGl2ZS5ydW50aW1lLTAuNy4zLm1pbi5qcycsIGNhbGxiYWNrOiBSYWN0aXZlUHJvdmlkZXIubG9hZGVkLCBhYm91dFRvTG9hZDogUmFjdGl2ZVByb3ZpZGVyLmFib3V0VG9Mb2FkfSxcbiAgICAvLyBUT0RPIG1pbmlmeSBvdXIgY29tcGlsZWQgUmFuZHkgYW5kIGhvc3QgaXQgb24gYSBDRE5cbiAgICB7c3JjOiBVUkxzLmFtYXpvblMzVXJsKCkgKyAnL3dpZGdldC1uZXcvbGliL3Jhbmd5LmNvbXBpbGVkLTEuMy4wLm1pbi5qcycsIGNhbGxiYWNrOiBSYW5neVByb3ZpZGVyLmxvYWRlZCwgYWJvdXRUb0xvYWQ6IFJhbmd5UHJvdmlkZXIuYWJvdXRUb0xvYWR9XG5dO1xuaWYgKEFwcE1vZGUub2ZmbGluZSkge1xuICAgIC8vIFVzZSB0aGUgb2ZmbGluZSB2ZXJzaW9ucyBvZiB0aGUgbGlicmFyaWVzIGZvciBkZXZlbG9wbWVudC5cbiAgICBzY3JpcHRzID0gW1xuICAgICAgICB7c3JjOiBVUkxzLmFwcFNlcnZlclVybCgpICsgJy9zdGF0aWMvanMvY2RuL2pxdWVyeS8yLjEuNC9qcXVlcnkuanMnLCBjYWxsYmFjazogSlF1ZXJ5UHJvdmlkZXIubG9hZGVkfSxcbiAgICAgICAge3NyYzogVVJMcy5hcHBTZXJ2ZXJVcmwoKSArICcvc3RhdGljL3dpZGdldC1uZXcvbGliL3JhY3RpdmUucnVudGltZS0wLjcuMy5qcycsIGNhbGxiYWNrOiBSYWN0aXZlUHJvdmlkZXIubG9hZGVkLCBhYm91dFRvTG9hZDogUmFjdGl2ZVByb3ZpZGVyLmFib3V0VG9Mb2FkfSxcbiAgICAgICAge3NyYzogVVJMcy5hcHBTZXJ2ZXJVcmwoKSArICcvc3RhdGljL3dpZGdldC1uZXcvbGliL3Jhbmd5LmNvbXBpbGVkLTEuMy4wLmpzJywgY2FsbGJhY2s6IFJhbmd5UHJvdmlkZXIubG9hZGVkLCBhYm91dFRvTG9hZDogUmFuZ3lQcm92aWRlci5hYm91dFRvTG9hZH1cbiAgICBdO1xufVxuXG5mdW5jdGlvbiBsb2FkQWxsU2NyaXB0cyhsb2FkZWRDYWxsYmFjaykge1xuICAgIGxvYWRTY3JpcHRzKHNjcmlwdHMsIGxvYWRlZENhbGxiYWNrKTtcbn1cblxuZnVuY3Rpb24gbG9hZFNjcmlwdHMoc2NyaXB0cywgbG9hZGVkQ2FsbGJhY2spIHtcbiAgICB2YXIgbG9hZGluZ0NvdW50ID0gc2NyaXB0cy5sZW5ndGg7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzY3JpcHRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBzY3JpcHQgPSBzY3JpcHRzW2ldO1xuICAgICAgICBpZiAoc2NyaXB0LmFib3V0VG9Mb2FkKSB7IHNjcmlwdC5hYm91dFRvTG9hZCgpOyB9XG4gICAgICAgIGxvYWRTY3JpcHQoc2NyaXB0LnNyYywgZnVuY3Rpb24oc2NyaXB0Q2FsbGJhY2spIHtcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBpZiAoc2NyaXB0Q2FsbGJhY2spIHNjcmlwdENhbGxiYWNrKCk7XG4gICAgICAgICAgICAgICAgbG9hZGluZ0NvdW50ID0gbG9hZGluZ0NvdW50IC0gMTtcbiAgICAgICAgICAgICAgICBpZiAobG9hZGluZ0NvdW50ID09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxvYWRlZENhbGxiYWNrKSBsb2FkZWRDYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gKHNjcmlwdC5jYWxsYmFjaykpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gbG9hZFNjcmlwdChzcmMsIGNhbGxiYWNrKSB7XG4gICAgdmFyIGhlYWQgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaGVhZCcpWzBdO1xuICAgIGlmIChoZWFkKSB7XG4gICAgICAgIHZhciBzY3JpcHRUYWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKTtcbiAgICAgICAgc2NyaXB0VGFnLnNldEF0dHJpYnV0ZSgnc3JjJywgc3JjKTtcbiAgICAgICAgc2NyaXB0VGFnLnNldEF0dHJpYnV0ZSgndHlwZScsJ3RleHQvamF2YXNjcmlwdCcpO1xuXG4gICAgICAgIGlmIChzY3JpcHRUYWcucmVhZHlTdGF0ZSkgeyAvLyBJRSwgaW5jbC4gSUU5XG4gICAgICAgICAgICBzY3JpcHRUYWcub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNjcmlwdFRhZy5yZWFkeVN0YXRlID09IFwibG9hZGVkXCIgfHwgc2NyaXB0VGFnLnJlYWR5U3RhdGUgPT0gXCJjb21wbGV0ZVwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHNjcmlwdFRhZy5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICBpZiAoY2FsbGJhY2spIHsgY2FsbGJhY2soKTsgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzY3JpcHRUYWcub25sb2FkID0gZnVuY3Rpb24oKSB7IC8vIE90aGVyIGJyb3dzZXJzXG4gICAgICAgICAgICAgICAgaWYgKGNhbGxiYWNrKSB7IGNhbGxiYWNrKCk7IH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICBoZWFkLmFwcGVuZENoaWxkKHNjcmlwdFRhZyk7XG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgbG9hZDogbG9hZEFsbFNjcmlwdHNcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgQnJvd3Nlck1ldHJpY3MgPSByZXF1aXJlKCcuL3V0aWxzL2Jyb3dzZXItbWV0cmljcycpO1xudmFyIFJhY3RpdmU7IHJlcXVpcmUoJy4vdXRpbHMvcmFjdGl2ZS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihsb2FkZWRSYWN0aXZlKSB7IFJhY3RpdmUgPSBsb2FkZWRSYWN0aXZlO30pO1xudmFyIFNlZ21lbnQgPSByZXF1aXJlKCcuL3V0aWxzL3NlZ21lbnQnKTtcbnZhciBUb3VjaFN1cHBvcnQgPSByZXF1aXJlKCcuL3V0aWxzL3RvdWNoLXN1cHBvcnQnKTtcblxudmFyIFJlYWN0aW9uc1dpZGdldCA9IHJlcXVpcmUoJy4vcmVhY3Rpb25zLXdpZGdldCcpO1xudmFyIFNWR3MgPSByZXF1aXJlKCcuL3N2Z3MnKTtcblxuZnVuY3Rpb24gY3JlYXRlU3VtbWFyeVdpZGdldChjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgZGVmYXVsdFJlYWN0aW9ucywgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciByYWN0aXZlID0gUmFjdGl2ZSh7XG4gICAgICAgIGVsOiAkKCc8ZGl2PicpLCAvLyB0aGUgcmVhbCByb290IG5vZGUgaXMgaW4gdGhlIHRlbXBsYXRlLiBpdCdzIGV4dHJhY3RlZCBhZnRlciB0aGUgdGVtcGxhdGUgaXMgcmVuZGVyZWQgaW50byB0aGlzIGR1bW15IGVsZW1lbnRcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgcGFnZURhdGE6IHBhZ2VEYXRhLFxuICAgICAgICAgICAgaXNFeHBhbmRlZFN1bW1hcnk6IHNob3VsZFVzZUV4cGFuZGVkU3VtbWFyeShncm91cFNldHRpbmdzKSxcbiAgICAgICAgICAgIGNvbXB1dGVFeHBhbmRlZFJlYWN0aW9uczogY29tcHV0ZUV4cGFuZGVkUmVhY3Rpb25zKGdyb3VwU2V0dGluZ3MpXG4gICAgICAgIH0sXG4gICAgICAgIG1hZ2ljOiB0cnVlLFxuICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL3N1bW1hcnktd2lkZ2V0Lmhicy5odG1sJyksXG4gICAgICAgIHBhcnRpYWxzOiB7XG4gICAgICAgICAgICBsb2dvOiBTVkdzLmxvZ29cbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHZhciAkcm9vdEVsZW1lbnQgPSAkKHJvb3RFbGVtZW50KHJhY3RpdmUpKTtcbiAgICAkcm9vdEVsZW1lbnQub24oJ21vdXNlZW50ZXInLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgIG9wZW5SZWFjdGlvbnNXaW5kb3coY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGRlZmF1bHRSZWFjdGlvbnMsIGdyb3VwU2V0dGluZ3MsIHJhY3RpdmUpO1xuICAgIH0pO1xuICAgIFRvdWNoU3VwcG9ydC5zZXR1cFRhcCgkcm9vdEVsZW1lbnQuZ2V0KDApLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBpZiAoIVJlYWN0aW9uc1dpZGdldC5pc09wZW4oKSkge1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgb3BlblJlYWN0aW9uc1dpbmRvdyhjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgZGVmYXVsdFJlYWN0aW9ucywgZ3JvdXBTZXR0aW5ncywgcmFjdGl2ZSk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4ge1xuICAgICAgICBlbGVtZW50OiAkcm9vdEVsZW1lbnQsXG4gICAgICAgIHRlYXJkb3duOiBmdW5jdGlvbigpIHsgcmFjdGl2ZS50ZWFyZG93bigpOyB9XG4gICAgfTtcbn1cblxuZnVuY3Rpb24gcm9vdEVsZW1lbnQocmFjdGl2ZSkge1xuICAgIHJldHVybiByYWN0aXZlLmZpbmQoJy5hbnRlbm5hLXN1bW1hcnktd2lkZ2V0Jyk7XG59XG5cbmZ1bmN0aW9uIG9wZW5SZWFjdGlvbnNXaW5kb3coY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGRlZmF1bHRSZWFjdGlvbnMsIGdyb3VwU2V0dGluZ3MsIHJhY3RpdmUpIHtcbiAgICB2YXIgcmVhY3Rpb25zV2lkZ2V0T3B0aW9ucyA9IHtcbiAgICAgICAgaXNTdW1tYXJ5OiB0cnVlLFxuICAgICAgICByZWFjdGlvbnNEYXRhOiBwYWdlRGF0YS5zdW1tYXJ5UmVhY3Rpb25zLFxuICAgICAgICBjb250YWluZXJEYXRhOiBjb250YWluZXJEYXRhLFxuICAgICAgICBkZWZhdWx0UmVhY3Rpb25zOiBkZWZhdWx0UmVhY3Rpb25zLFxuICAgICAgICBwYWdlRGF0YTogcGFnZURhdGEsXG4gICAgICAgIGdyb3VwU2V0dGluZ3M6IGdyb3VwU2V0dGluZ3MsXG4gICAgICAgIGNvbnRlbnREYXRhOiB7IHR5cGU6ICdwYWdlJywgYm9keTogJycgfVxuICAgIH07XG4gICAgUmVhY3Rpb25zV2lkZ2V0Lm9wZW4ocmVhY3Rpb25zV2lkZ2V0T3B0aW9ucywgcm9vdEVsZW1lbnQocmFjdGl2ZSkpO1xufVxuXG5mdW5jdGlvbiBzaG91bGRVc2VFeHBhbmRlZFN1bW1hcnkoZ3JvdXBTZXR0aW5ncykge1xuICAgIHJldHVybiBCcm93c2VyTWV0cmljcy5pc01vYmlsZSgpICYmIChncm91cFNldHRpbmdzLmlzRXhwYW5kZWRNb2JpbGVTdW1tYXJ5KCkgfHwgU2VnbWVudC5pc0V4cGFuZGVkU3VtbWFyeVNlZ21lbnQoZ3JvdXBTZXR0aW5ncykpO1xufVxuXG5mdW5jdGlvbiBjb21wdXRlRXhwYW5kZWRSZWFjdGlvbnMoZ3JvdXBTZXR0aW5ncykge1xuICAgIHJldHVybiBmdW5jdGlvbihyZWFjdGlvbnNEYXRhKSB7XG4gICAgICAgIHZhciBkZWZhdWx0UmVhY3Rpb25zID0gZ3JvdXBTZXR0aW5ncy5kZWZhdWx0UmVhY3Rpb25zKCk7XG4gICAgICAgIHZhciBtYXggPSAyO1xuICAgICAgICB2YXIgZXhwYW5kZWRSZWFjdGlvbnMgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZWFjdGlvbnNEYXRhLmxlbmd0aCAmJiBleHBhbmRlZFJlYWN0aW9ucy5sZW5ndGggPCBtYXg7IGkrKykge1xuICAgICAgICAgICAgdmFyIHJlYWN0aW9uRGF0YSA9IHJlYWN0aW9uc0RhdGFbaV07XG4gICAgICAgICAgICBpZiAoaXNEZWZhdWx0UmVhY3Rpb24ocmVhY3Rpb25EYXRhLCBkZWZhdWx0UmVhY3Rpb25zKSkge1xuICAgICAgICAgICAgICAgIGV4cGFuZGVkUmVhY3Rpb25zLnB1c2gocmVhY3Rpb25EYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZXhwYW5kZWRSZWFjdGlvbnM7XG4gICAgfTtcbn1cblxuZnVuY3Rpb24gaXNEZWZhdWx0UmVhY3Rpb24ocmVhY3Rpb25EYXRhLCBkZWZhdWx0UmVhY3Rpb25zKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkZWZhdWx0UmVhY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChkZWZhdWx0UmVhY3Rpb25zW2ldLnRleHQgPT09IHJlYWN0aW9uRGF0YS50ZXh0KSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGU6IGNyZWF0ZVN1bW1hcnlXaWRnZXRcbn07IiwidmFyIFJhY3RpdmU7IHJlcXVpcmUoJy4vdXRpbHMvcmFjdGl2ZS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihsb2FkZWRSYWN0aXZlKSB7IFJhY3RpdmUgPSBsb2FkZWRSYWN0aXZlO30pO1xuXG4vLyBBYm91dCBob3cgd2UgaGFuZGxlIGljb25zOiBXZSBpbnNlcnQgYSBzaW5nbGUgU1ZHIGVsZW1lbnQgYXQgdGhlIHRvcCBvZiB0aGUgYm9keSBlbGVtZW50IHdoaWNoIGRlZmluZXMgYWxsIG9mIHRoZVxuLy8gaWNvbnMgd2UgbmVlZC4gVGhlbiBhbGwgaWNvbnMgdXNlZCBieSB0aGUgYXBwbGljYXRpb25zIGFyZSByZW5kZXJlZCB3aXRoIHZlcnkgbGlnaHR3ZWlnaHQgU1ZHIGVsZW1lbnRzIHRoYXQgc2ltcGx5XG4vLyBwb2ludCB0byB0aGUgYXBwcm9wcmlhdGUgaWNvbiBieSByZWZlcmVuY2UuXG5cbi8vIFRPRE86IGxvb2sgaW50byB1c2luZyBhIHNpbmdsZSB0ZW1wbGF0ZSBmb3IgdGhlIFwidXNlXCIgU1ZHcy4gQ2FuIHdlIGluc3RhbnRpYXRlIGEgcGFydGlhbCB3aXRoIGEgZHluYW1pYyBjb250ZXh0P1xudmFyIHRlbXBsYXRlcyA9IHtcbiAgICBsb2dvOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvc3ZnLWxvZ28uaGJzLmh0bWwnKSxcbiAgICAvLyBUaGUgXCJzZWxlY3RhYmxlXCIgbG9nbyBkZWZpbmVzIGFuIGlubGluZSAncGF0aCcgcmF0aGVyIHRoYW4gYSAndXNlJyByZWZlcmVuY2UsIGFzIGEgd29ya2Fyb3VuZCBmb3IgYSBGaXJlZm94IHRleHQgc2VsZWN0aW9uIGJ1Zy5cbiAgICBsb2dvU2VsZWN0YWJsZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL3N2Zy1sb2dvLXNlbGVjdGFibGUuaGJzLmh0bWwnKSxcbiAgICBjb21tZW50czogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL3N2Zy1jb21tZW50cy5oYnMuaHRtbCcpLFxuICAgIGxvY2F0aW9uOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvc3ZnLWxvY2F0aW9uLmhicy5odG1sJyksXG4gICAgZmFjZWJvb2s6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9zdmctZmFjZWJvb2suaGJzLmh0bWwnKSxcbiAgICB0d2l0dGVyOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvc3ZnLXR3aXR0ZXIuaGJzLmh0bWwnKSxcbiAgICBsZWZ0OiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvc3ZnLWxlZnQuaGJzLmh0bWwnKSxcbiAgICBmaWxtOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvc3ZnLWZpbG0uaGJzLmh0bWwnKVxufTtcblxudmFyIGlzU2V0dXAgPSBmYWxzZTtcblxuZnVuY3Rpb24gZW5zdXJlU2V0dXAoKSB7XG4gICAgaWYgKCFpc1NldHVwKSB7XG4gICAgICAgIHZhciBkdW1teSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBSYWN0aXZlKHtcbiAgICAgICAgICAgIGVsOiBkdW1teSxcbiAgICAgICAgICAgIHRlbXBsYXRlOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvc3Zncy5oYnMuaHRtbCcpXG4gICAgICAgIH0pO1xuICAgICAgICAvLyBTYWZhcmkgb24gaU9TIHJlcXVpcmVzIHRoZSBTVkcgdGhhdCBkZWZpbmVzIHRoZSBpY29ucyBhcHBlYXIgYmVmb3JlIHRoZSBTVkdzIHRoYXQgcmVmZXJlbmNlIGl0LlxuICAgICAgICBkb2N1bWVudC5ib2R5Lmluc2VydEJlZm9yZShkdW1teS5jaGlsZHJlblswXSwgZG9jdW1lbnQuYm9keS5maXJzdENoaWxkKTtcbiAgICAgICAgaXNTZXR1cCA9IHRydWU7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBnZXRTVkcodGVtcGxhdGUpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgIGVuc3VyZVNldHVwKCk7XG4gICAgICAgIHJldHVybiB0ZW1wbGF0ZTtcbiAgICB9XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBsb2dvOiBnZXRTVkcodGVtcGxhdGVzLmxvZ28pLFxuICAgIGxvZ29TZWxlY3RhYmxlOiBnZXRTVkcodGVtcGxhdGVzLmxvZ29TZWxlY3RhYmxlKSxcbiAgICBjb21tZW50czogZ2V0U1ZHKHRlbXBsYXRlcy5jb21tZW50cyksXG4gICAgbG9jYXRpb246IGdldFNWRyh0ZW1wbGF0ZXMubG9jYXRpb24pLFxuICAgIGZhY2Vib29rOiBnZXRTVkcodGVtcGxhdGVzLmZhY2Vib29rKSxcbiAgICB0d2l0dGVyOiBnZXRTVkcodGVtcGxhdGVzLnR3aXR0ZXIpLFxuICAgIGxlZnQ6IGdldFNWRyh0ZW1wbGF0ZXMubGVmdCksXG4gICAgZmlsbTogZ2V0U1ZHKHRlbXBsYXRlcy5maWxtKVxufTsiLCJ2YXIgUmFjdGl2ZTsgcmVxdWlyZSgnLi91dGlscy9yYWN0aXZlLXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGxvYWRlZFJhY3RpdmUpIHsgUmFjdGl2ZSA9IGxvYWRlZFJhY3RpdmU7fSk7XG52YXIgQnJvd3Nlck1ldHJpY3MgPSByZXF1aXJlKCcuL3V0aWxzL2Jyb3dzZXItbWV0cmljcycpO1xudmFyIFNWR3MgPSByZXF1aXJlKCcuL3N2Z3MnKTtcbnZhciBXaWRnZXRCdWNrZXQgPSByZXF1aXJlKCcuL3V0aWxzL3dpZGdldC1idWNrZXQnKTtcblxuZnVuY3Rpb24gc2V0dXBIZWxwZXIoZ3JvdXBTZXR0aW5ncykge1xuICAgIGlmICghaXNEaXNtaXNzZWQoKSAmJiAhZ3JvdXBTZXR0aW5ncy5pc0hpZGVUYXBIZWxwZXIoKSAmJiBCcm93c2VyTWV0cmljcy5zdXBwb3J0c1RvdWNoKCkpIHtcbiAgICAgICAgdmFyIHJhY3RpdmUgPSBSYWN0aXZlKHtcbiAgICAgICAgICAgIGVsOiBXaWRnZXRCdWNrZXQuZ2V0KCksXG4gICAgICAgICAgICBhcHBlbmQ6IHRydWUsXG4gICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgcG9zaXRpb25Ub3A6IGdyb3VwU2V0dGluZ3MudGFwSGVscGVyUG9zaXRpb24oKSA9PT0gJ3RvcCdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL3RhcC1oZWxwZXIuaGJzLmh0bWwnKSxcbiAgICAgICAgICAgIHBhcnRpYWxzOiB7XG4gICAgICAgICAgICAgICAgbG9nbzogU1ZHcy5sb2dvXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByYWN0aXZlLm9uKCdkaXNtaXNzJywgZGlzbWlzcyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZGlzbWlzcygpIHtcbiAgICAgICAgcmFjdGl2ZS50ZWFyZG93bigpO1xuICAgICAgICBzZXREaXNtaXNzZWQodHJ1ZSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBzZXREaXNtaXNzZWQoZGlzbWlzc2VkKSB7XG4gICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2hpZGVEb3VibGVUYXBNZXNzYWdlJywgZGlzbWlzc2VkKTtcbn1cblxuZnVuY3Rpb24gaXNEaXNtaXNzZWQoKSB7XG4gICAgcmV0dXJuIGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdoaWRlRG91YmxlVGFwTWVzc2FnZScpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBzZXR1cEhlbHBlcjogc2V0dXBIZWxwZXJcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgUmFjdGl2ZTsgcmVxdWlyZSgnLi91dGlscy9yYWN0aXZlLXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGxvYWRlZFJhY3RpdmUpIHsgUmFjdGl2ZSA9IGxvYWRlZFJhY3RpdmU7fSk7XG52YXIgVG91Y2hTdXBwb3J0ID0gcmVxdWlyZSgnLi91dGlscy90b3VjaC1zdXBwb3J0Jyk7XG5cbnZhciBQb3B1cFdpZGdldCA9IHJlcXVpcmUoJy4vcG9wdXAtd2lkZ2V0Jyk7XG52YXIgUmVhY3Rpb25zV2lkZ2V0ID0gcmVxdWlyZSgnLi9yZWFjdGlvbnMtd2lkZ2V0Jyk7XG52YXIgU1ZHcyA9IHJlcXVpcmUoJy4vc3ZncycpO1xuXG52YXIgQ0xBU1NfQUNUSVZFID0gJ2FudGVubmEtYWN0aXZlJztcblxuZnVuY3Rpb24gY3JlYXRlSW5kaWNhdG9yV2lkZ2V0KG9wdGlvbnMpIHtcbiAgICB2YXIgY29udGFpbmVyRGF0YSA9IG9wdGlvbnMuY29udGFpbmVyRGF0YTtcbiAgICB2YXIgJGNvbnRhaW5lckVsZW1lbnQgPSBvcHRpb25zLmNvbnRhaW5lckVsZW1lbnQ7XG4gICAgdmFyIHBhZ2VEYXRhID0gb3B0aW9ucy5wYWdlRGF0YTtcbiAgICB2YXIgZ3JvdXBTZXR0aW5ncyA9IG9wdGlvbnMuZ3JvdXBTZXR0aW5ncztcbiAgICB2YXIgZGVmYXVsdFJlYWN0aW9ucyA9IG9wdGlvbnMuZGVmYXVsdFJlYWN0aW9ucztcbiAgICB2YXIgY29vcmRzID0gb3B0aW9ucy5jb29yZHM7XG4gICAgdmFyIHJhY3RpdmUgPSBSYWN0aXZlKHtcbiAgICAgICAgZWw6ICQoJzxkaXY+JyksIC8vIHRoZSByZWFsIHJvb3Qgbm9kZSBpcyBpbiB0aGUgdGVtcGxhdGUuIGl0J3MgZXh0cmFjdGVkIGFmdGVyIHRoZSB0ZW1wbGF0ZSBpcyByZW5kZXJlZCBpbnRvIHRoaXMgZHVtbXkgZWxlbWVudFxuICAgICAgICBhcHBlbmQ6IHRydWUsXG4gICAgICAgIG1hZ2ljOiB0cnVlLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICBjb250YWluZXJEYXRhOiBjb250YWluZXJEYXRhLFxuICAgICAgICAgICAgZXh0cmFDbGFzc2VzOiBncm91cFNldHRpbmdzLmVuYWJsZVRleHRIZWxwZXIoKSA/IFwiXCIgOiBcImFudGVubmEtbm9oaW50XCJcbiAgICAgICAgfSxcbiAgICAgICAgdGVtcGxhdGU6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy90ZXh0LWluZGljYXRvci13aWRnZXQuaGJzLmh0bWwnKSxcbiAgICAgICAgcGFydGlhbHM6IHtcbiAgICAgICAgICAgIGxvZ286IFNWR3MubG9nb1NlbGVjdGFibGVcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgdmFyIHJlYWN0aW9uV2lkZ2V0T3B0aW9ucyA9IHtcbiAgICAgICAgcmVhY3Rpb25zRGF0YTogY29udGFpbmVyRGF0YS5yZWFjdGlvbnMsXG4gICAgICAgIGNvbnRhaW5lckRhdGE6IGNvbnRhaW5lckRhdGEsXG4gICAgICAgIGNvbnRhaW5lckVsZW1lbnQ6ICRjb250YWluZXJFbGVtZW50LFxuICAgICAgICBjb250ZW50RGF0YTogeyB0eXBlOiAndGV4dCcgfSxcbiAgICAgICAgZGVmYXVsdFJlYWN0aW9uczogZGVmYXVsdFJlYWN0aW9ucyxcbiAgICAgICAgcGFnZURhdGE6IHBhZ2VEYXRhLFxuICAgICAgICBncm91cFNldHRpbmdzOiBncm91cFNldHRpbmdzXG4gICAgfTtcblxuICAgIHZhciAkcm9vdEVsZW1lbnQgPSAkKHJvb3RFbGVtZW50KHJhY3RpdmUpKTtcbiAgICBpZiAoY29vcmRzKSB7XG4gICAgICAgICRyb290RWxlbWVudC5jc3Moe1xuICAgICAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXG4gICAgICAgICAgICB0b3A6IGNvb3Jkcy50b3AgLSAkcm9vdEVsZW1lbnQuaGVpZ2h0KCksXG4gICAgICAgICAgICBib3R0b206IGNvb3Jkcy5ib3R0b20sXG4gICAgICAgICAgICBsZWZ0OiBjb29yZHMubGVmdCxcbiAgICAgICAgICAgIHJpZ2h0OiBjb29yZHMucmlnaHQsXG4gICAgICAgICAgICAnei1pbmRleCc6IDEwMDAgLy8gVE9ETzogY29tcHV0ZSBhIHJlYWwgdmFsdWU/XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICB2YXIgaG92ZXJUaW1lb3V0O1xuICAgIHZhciB0YXBTdXBwb3J0ID0gVG91Y2hTdXBwb3J0LnNldHVwVGFwKCRyb290RWxlbWVudC5nZXQoMCksIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBvcGVuUmVhY3Rpb25zV2luZG93KHJlYWN0aW9uV2lkZ2V0T3B0aW9ucywgcmFjdGl2ZSk7XG4gICAgfSk7XG4gICAgJHJvb3RFbGVtZW50Lm9uKCdtb3VzZWVudGVyLmFudGVubmEnLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBpZiAoZXZlbnQuYnV0dG9ucyA+IDAgfHwgKGV2ZW50LmJ1dHRvbnMgPT0gdW5kZWZpbmVkICYmIGV2ZW50LndoaWNoID4gMCkpIHsgLy8gT24gU2FmYXJpLCBldmVudC5idXR0b25zIGlzIHVuZGVmaW5lZCBidXQgZXZlbnQud2hpY2ggZ2l2ZXMgYSBnb29kIHZhbHVlLiBldmVudC53aGljaCBpcyBiYWQgb24gRkZcbiAgICAgICAgICAgIC8vIERvbid0IHJlYWN0IGlmIHRoZSB1c2VyIGlzIGRyYWdnaW5nIG9yIHNlbGVjdGluZyB0ZXh0LlxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNsZWFyVGltZW91dChob3ZlclRpbWVvdXQpOyAvLyBvbmx5IG9uZSB0aW1lb3V0IGF0IGEgdGltZVxuICAgICAgICBob3ZlclRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKGNvbnRhaW5lckRhdGEucmVhY3Rpb25zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBvcGVuUmVhY3Rpb25zV2luZG93KHJlYWN0aW9uV2lkZ2V0T3B0aW9ucywgcmFjdGl2ZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhciAkaWNvbiA9ICQocm9vdEVsZW1lbnQocmFjdGl2ZSkpLmZpbmQoJy5hbnRlbm5hLWxvZ28nKTtcbiAgICAgICAgICAgICAgICB2YXIgb2Zmc2V0ID0gJGljb24ub2Zmc2V0KCk7XG4gICAgICAgICAgICAgICAgdmFyIGNvb3JkaW5hdGVzID0ge1xuICAgICAgICAgICAgICAgICAgICB0b3A6IG9mZnNldC50b3AgKyBNYXRoLmZsb29yKCRpY29uLmhlaWdodCgpIC8gMiksIC8vIFRPRE8gdGhpcyBudW1iZXIgaXMgYSBsaXR0bGUgb2ZmIGJlY2F1c2UgdGhlIGRpdiBkb2Vzbid0IHRpZ2h0bHkgd3JhcCB0aGUgaW5zZXJ0ZWQgZm9udCBjaGFyYWN0ZXJcbiAgICAgICAgICAgICAgICAgICAgbGVmdDogb2Zmc2V0LmxlZnQgKyBNYXRoLmZsb29yKCRpY29uLndpZHRoKCkgLyAyKVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgUG9wdXBXaWRnZXQuc2hvdyhjb29yZGluYXRlcywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIG9wZW5SZWFjdGlvbnNXaW5kb3cocmVhY3Rpb25XaWRnZXRPcHRpb25zLCByYWN0aXZlKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgMjAwKTtcbiAgICB9KTtcbiAgICAkcm9vdEVsZW1lbnQub24oJ21vdXNlbGVhdmUuYW50ZW5uYScsIGZ1bmN0aW9uKCkge1xuICAgICAgICBjbGVhclRpbWVvdXQoaG92ZXJUaW1lb3V0KTtcbiAgICB9KTtcbiAgICAkY29udGFpbmVyRWxlbWVudC5vbignbW91c2VlbnRlci5hbnRlbm5hJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICRyb290RWxlbWVudC5hZGRDbGFzcyhDTEFTU19BQ1RJVkUpO1xuICAgIH0pO1xuICAgICRjb250YWluZXJFbGVtZW50Lm9uKCdtb3VzZWxlYXZlLmFudGVubmEnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgJHJvb3RFbGVtZW50LnJlbW92ZUNsYXNzKENMQVNTX0FDVElWRSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZWxlbWVudDogJHJvb3RFbGVtZW50LFxuICAgICAgICB0ZWFyZG93bjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAkY29udGFpbmVyRWxlbWVudC5vZmYoJy5hbnRlbm5hJyk7XG4gICAgICAgICAgICByYWN0aXZlLnRlYXJkb3duKCk7XG4gICAgICAgICAgICB0YXBTdXBwb3J0LnRlYXJkb3duKCk7XG4gICAgICAgIH1cbiAgICB9O1xufVxuXG5mdW5jdGlvbiByb290RWxlbWVudChyYWN0aXZlKSB7XG4gICAgcmV0dXJuIHJhY3RpdmUuZmluZCgnLmFudGVubmEtdGV4dC1pbmRpY2F0b3Itd2lkZ2V0Jyk7XG59XG5cbmZ1bmN0aW9uIG9wZW5SZWFjdGlvbnNXaW5kb3cocmVhY3Rpb25PcHRpb25zLCByYWN0aXZlKSB7XG4gICAgUmVhY3Rpb25zV2lkZ2V0Lm9wZW4ocmVhY3Rpb25PcHRpb25zLCByb290RWxlbWVudChyYWN0aXZlKSk7XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGU6IGNyZWF0ZUluZGljYXRvcldpZGdldFxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi91dGlscy9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciBQb3B1cFdpZGdldCA9IHJlcXVpcmUoJy4vcG9wdXAtd2lkZ2V0Jyk7XG52YXIgUmFuZ2UgPSByZXF1aXJlKCcuL3V0aWxzL3JhbmdlJyk7XG52YXIgUmVhY3Rpb25zV2lkZ2V0ID0gcmVxdWlyZSgnLi9yZWFjdGlvbnMtd2lkZ2V0Jyk7XG52YXIgVG91Y2hTdXBwb3J0ID0gcmVxdWlyZSgnLi91dGlscy90b3VjaC1zdXBwb3J0Jyk7XG5cblxuZnVuY3Rpb24gY3JlYXRlUmVhY3RhYmxlVGV4dChvcHRpb25zKSB7XG4gICAgLy8gVE9ETzogaW1wb3NlIGFuIHVwcGVyIGxpbWl0IG9uIHRoZSBsZW5ndGggb2YgdGV4dCB0aGF0IGNhbiBiZSByZWFjdGVkIHRvPyAoYXBwbGllcyB0byB0aGUgaW5kaWNhdG9yLXdpZGdldCB0b28pXG4gICAgdmFyICRjb250YWluZXJFbGVtZW50ID0gb3B0aW9ucy5jb250YWluZXJFbGVtZW50O1xuICAgIHZhciBjb250YWluZXJEYXRhID0gb3B0aW9ucy5jb250YWluZXJEYXRhO1xuICAgIHZhciBleGNsdWRlTm9kZSA9IG9wdGlvbnMuZXhjbHVkZU5vZGU7XG4gICAgdmFyIHJlYWN0aW9uc1dpZGdldE9wdGlvbnMgPSB7XG4gICAgICAgIHJlYWN0aW9uc0RhdGE6IFtdLCAvLyBBbHdheXMgb3BlbiB3aXRoIHRoZSBkZWZhdWx0IHJlYWN0aW9uc1xuICAgICAgICBjb250YWluZXJEYXRhOiBjb250YWluZXJEYXRhLFxuICAgICAgICBjb250ZW50RGF0YTogeyB0eXBlOiAndGV4dCcgfSxcbiAgICAgICAgY29udGFpbmVyRWxlbWVudDogJGNvbnRhaW5lckVsZW1lbnQsXG4gICAgICAgIGRlZmF1bHRSZWFjdGlvbnM6IG9wdGlvbnMuZGVmYXVsdFJlYWN0aW9ucyxcbiAgICAgICAgcGFnZURhdGE6IG9wdGlvbnMucGFnZURhdGEsXG4gICAgICAgIGdyb3VwU2V0dGluZ3M6IG9wdGlvbnMuZ3JvdXBTZXR0aW5nc1xuICAgIH07XG5cbiAgICB2YXIgdGFwRXZlbnRzID0gc2V0dXBUYXBFdmVudHMoJGNvbnRhaW5lckVsZW1lbnQuZ2V0KDApLCByZWFjdGlvbnNXaWRnZXRPcHRpb25zKTtcbiAgICAkY29udGFpbmVyRWxlbWVudC5vbignbW91c2V1cC5hbnRlbm5hJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgLy8gTm90ZSB0aGF0IHdlIGhhdmUgdG8gZG8gYSBwcmVlbXB0aXZlIGNoZWNrIGlmIHRoZSBwb3B1cCBpcyBzaG93aW5nIGJlY2F1c2Ugb2YgYSB0aW1pbmcgZGlmZmVyZW5jZSBpbiBTYWZhcmkuXG4gICAgICAgIC8vIFdlIHdlcmUgc2VlaW5nIHRoZSBkb2N1bWVudCBjbGljayBoYW5kbGVyIGNsb3NpbmcgdGhlIHBvcHVwIHdoaWxlIHRoZSBzZWxlY3Rpb24gd2FzIGJlaW5nIGNvbXB1dGVkLCB3aGljaFxuICAgICAgICAvLyBtZWFudCB0aGF0IGNhbGxpbmcgUG9wdXBXaWRnZXQuc2hvdyB3b3VsZCB0aGluayBpdCBuZWVkZWQgdG8gcmVvcGVuIHRoZSBwb3B1cCAoaW5zdGVhZCBvZiBxdWlldGx5IGRvaW5nIG5vdGhpbmcgYXMgaXQgc2hvdWxkKS5cbiAgICAgICAgaWYgKGNvbnRhaW5lckRhdGEubG9hZGVkICYmICFQb3B1cFdpZGdldC5pc1Nob3dpbmcoKSkge1xuICAgICAgICAgICAgdmFyIG5vZGUgPSAkY29udGFpbmVyRWxlbWVudC5nZXQoMCk7XG4gICAgICAgICAgICB2YXIgcG9pbnQgPSBSYW5nZS5nZXRTZWxlY3Rpb25FbmRQb2ludChub2RlLCBldmVudCwgZXhjbHVkZU5vZGUpO1xuICAgICAgICAgICAgaWYgKHBvaW50KSB7XG4gICAgICAgICAgICAgICAgdmFyIGNvb3JkaW5hdGVzID0ge3RvcDogcG9pbnQueSwgbGVmdDogcG9pbnQueH07XG4gICAgICAgICAgICAgICAgUG9wdXBXaWRnZXQuc2hvdyhjb29yZGluYXRlcywgZ3JhYlNlbGVjdGlvbkFuZE9wZW4obm9kZSwgY29vcmRpbmF0ZXMsIHJlYWN0aW9uc1dpZGdldE9wdGlvbnMsIGV4Y2x1ZGVOb2RlKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4ge1xuICAgICAgICB0ZWFyZG93bjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB0YXBFdmVudHMudGVhcmRvd24oKTtcbiAgICAgICAgICAgICRjb250YWluZXJFbGVtZW50Lm9mZignLmFudGVubmEnKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gZ3JhYlNlbGVjdGlvbkFuZE9wZW4obm9kZSwgY29vcmRpbmF0ZXMsIHJlYWN0aW9uc1dpZGdldE9wdGlvbnMsIGV4Y2x1ZGVOb2RlKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICBSYW5nZS5ncmFiU2VsZWN0aW9uKG5vZGUsIGZ1bmN0aW9uKHRleHQsIGxvY2F0aW9uKSB7XG4gICAgICAgICAgICByZWFjdGlvbnNXaWRnZXRPcHRpb25zLmNvbnRlbnREYXRhLmxvY2F0aW9uID0gbG9jYXRpb247XG4gICAgICAgICAgICByZWFjdGlvbnNXaWRnZXRPcHRpb25zLmNvbnRlbnREYXRhLmJvZHkgPSB0ZXh0O1xuICAgICAgICAgICAgUmVhY3Rpb25zV2lkZ2V0Lm9wZW4ocmVhY3Rpb25zV2lkZ2V0T3B0aW9ucywgY29vcmRpbmF0ZXMpO1xuICAgICAgICB9LCBleGNsdWRlTm9kZSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBncmFiTm9kZUFuZE9wZW4obm9kZSwgcmVhY3Rpb25zV2lkZ2V0T3B0aW9ucywgY29vcmRzKSB7XG4gICAgUmFuZ2UuZ3JhYk5vZGUobm9kZSwgZnVuY3Rpb24odGV4dCwgbG9jYXRpb24pIHtcbiAgICAgICAgcmVhY3Rpb25zV2lkZ2V0T3B0aW9ucy5jb250ZW50RGF0YS5sb2NhdGlvbiA9IGxvY2F0aW9uO1xuICAgICAgICByZWFjdGlvbnNXaWRnZXRPcHRpb25zLmNvbnRlbnREYXRhLmJvZHkgPSB0ZXh0O1xuICAgICAgICBSZWFjdGlvbnNXaWRnZXQub3BlbihyZWFjdGlvbnNXaWRnZXRPcHRpb25zLCBjb29yZHMpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBzZXR1cFRhcEV2ZW50cyhlbGVtZW50LCByZWFjdGlvbnNXaWRnZXRPcHRpb25zKSB7XG4gICAgcmV0dXJuIFRvdWNoU3VwcG9ydC5zZXR1cFRhcChlbGVtZW50LCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBpZiAoIVJlYWN0aW9uc1dpZGdldC5pc09wZW4oKSAmJiAkKGV2ZW50LnRhcmdldCkuY2xvc2VzdCgnYSwubm8tYW50JykubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICB2YXIgdG91Y2ggPSBldmVudC5jaGFuZ2VkVG91Y2hlc1swXTtcbiAgICAgICAgICAgIHZhciBjb29yZHMgPSB7IHRvcDogdG91Y2gucGFnZVksIGxlZnQ6IHRvdWNoLnBhZ2VYIH07XG4gICAgICAgICAgICBncmFiTm9kZUFuZE9wZW4oZWxlbWVudCwgcmVhY3Rpb25zV2lkZ2V0T3B0aW9ucywgY29vcmRzKTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlUmVhY3RhYmxlVGV4dDogY3JlYXRlUmVhY3RhYmxlVGV4dFxufTsiLCJ2YXIgQXBwTW9kZSA9IHJlcXVpcmUoJy4vYXBwLW1vZGUnKTtcbnZhciBKU09OUENsaWVudCA9IHJlcXVpcmUoJy4vanNvbnAtY2xpZW50Jyk7XG52YXIgSlNPTlV0aWxzID0gcmVxdWlyZSgnLi9qc29uLXV0aWxzJyk7XG52YXIgTG9nZ2luZyA9IHJlcXVpcmUoJy4vbG9nZ2luZycpO1xudmFyIFVSTHMgPSByZXF1aXJlKCcuL3VybHMnKTtcbnZhciBVc2VyID0gcmVxdWlyZSgnLi91c2VyJyk7XG5cbmZ1bmN0aW9uIHBvc3ROZXdSZWFjdGlvbihyZWFjdGlvbkRhdGEsIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBjb250ZW50RGF0YSwgZ3JvdXBTZXR0aW5ncywgc3VjY2VzcywgZXJyb3IpIHtcbiAgICB2YXIgY29udGVudEJvZHkgPSBjb250ZW50RGF0YS5ib2R5O1xuICAgIHZhciBjb250ZW50VHlwZSA9IGNvbnRlbnREYXRhLnR5cGU7XG4gICAgdmFyIGNvbnRlbnRMb2NhdGlvbiA9IGNvbnRlbnREYXRhLmxvY2F0aW9uO1xuICAgIHZhciBjb250ZW50RGltZW5zaW9ucyA9IGNvbnRlbnREYXRhLmRpbWVuc2lvbnM7XG4gICAgVXNlci5mZXRjaFVzZXIoZ3JvdXBTZXR0aW5ncywgZnVuY3Rpb24odXNlckluZm8pIHtcbiAgICAgICAgLy8gVE9ETyBleHRyYWN0IHRoZSBzaGFwZSBvZiB0aGlzIGRhdGEgYW5kIHBvc3NpYmx5IHRoZSB3aG9sZSBBUEkgY2FsbFxuICAgICAgICB2YXIgZGF0YSA9IHtcbiAgICAgICAgICAgIHRhZzoge1xuICAgICAgICAgICAgICAgIGJvZHk6IHJlYWN0aW9uRGF0YS50ZXh0LFxuICAgICAgICAgICAgICAgIGlzX2RlZmF1bHQ6IHJlYWN0aW9uRGF0YS5pc0RlZmF1bHQgIT09IHVuZGVmaW5lZCAmJiByZWFjdGlvbkRhdGEuaXNEZWZhdWx0IC8vIGZhbHNlIHVubGVzcyBzcGVjaWZpZWRcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBoYXNoOiBjb250YWluZXJEYXRhLmhhc2gsXG4gICAgICAgICAgICB1c2VyX2lkOiB1c2VySW5mby51c2VyX2lkLFxuICAgICAgICAgICAgYW50X3Rva2VuOiB1c2VySW5mby5hbnRfdG9rZW4sXG4gICAgICAgICAgICBwYWdlX2lkOiBwYWdlRGF0YS5wYWdlSWQsXG4gICAgICAgICAgICBncm91cF9pZDogcGFnZURhdGEuZ3JvdXBJZCxcbiAgICAgICAgICAgIGNvbnRhaW5lcl9raW5kOiBjb250ZW50VHlwZSwgLy8gT25lIG9mICdwYWdlJywgJ3RleHQnLCAnbWVkaWEnLCAnaW1nJ1xuICAgICAgICAgICAgY29udGVudF9ub2RlX2RhdGE6IHtcbiAgICAgICAgICAgICAgICBib2R5OiBjb250ZW50Qm9keSxcbiAgICAgICAgICAgICAgICBraW5kOiBjb250ZW50VHlwZSxcbiAgICAgICAgICAgICAgICBpdGVtX3R5cGU6ICcnIC8vIFRPRE86IGxvb2tzIHVudXNlZCBidXQgVGFnSGFuZGxlciBibG93cyB1cCB3aXRob3V0IGl0LiBDdXJyZW50IGNsaWVudCBwYXNzZXMgaW4gXCJwYWdlXCIgZm9yIHBhZ2UgcmVhY3Rpb25zLlxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBpZiAoY29udGVudExvY2F0aW9uKSB7XG4gICAgICAgICAgICBkYXRhLmNvbnRlbnRfbm9kZV9kYXRhLmxvY2F0aW9uID0gY29udGVudExvY2F0aW9uO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjb250ZW50RGltZW5zaW9ucykge1xuICAgICAgICAgICAgZGF0YS5jb250ZW50X25vZGVfZGF0YS5oZWlnaHQgPSBjb250ZW50RGltZW5zaW9ucy5oZWlnaHQ7XG4gICAgICAgICAgICBkYXRhLmNvbnRlbnRfbm9kZV9kYXRhLndpZHRoID0gY29udGVudERpbWVuc2lvbnMud2lkdGg7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJlYWN0aW9uRGF0YS5pZCkge1xuICAgICAgICAgICAgZGF0YS50YWcuaWQgPSByZWFjdGlvbkRhdGEuaWQ7IC8vIFRPRE8gdGhlIGN1cnJlbnQgY2xpZW50IHNlbmRzIFwiLTEwMVwiIGlmIHRoZXJlJ3Mgbm8gaWQuIGlzIHRoaXMgbmVjZXNzYXJ5P1xuICAgICAgICB9XG4gICAgICAgIGdldEpTT05QKFVSTHMuY3JlYXRlUmVhY3Rpb25VcmwoKSwgZGF0YSwgbmV3UmVhY3Rpb25TdWNjZXNzKGNvbnRlbnRMb2NhdGlvbiwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIHN1Y2Nlc3MpLCBlcnJvcik7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIHBvc3RQbHVzT25lKHJlYWN0aW9uRGF0YSwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MsIHN1Y2Nlc3MsIGVycm9yKSB7XG4gICAgVXNlci5mZXRjaFVzZXIoZ3JvdXBTZXR0aW5ncywgZnVuY3Rpb24odXNlckluZm8pIHtcbiAgICAgICAgLy8gVE9ETyBleHRyYWN0IHRoZSBzaGFwZSBvZiB0aGlzIGRhdGEgYW5kIHBvc3NpYmx5IHRoZSB3aG9sZSBBUEkgY2FsbFxuICAgICAgICBpZiAoIXJlYWN0aW9uRGF0YS5jb250ZW50KSB7XG4gICAgICAgICAgICAvLyBUaGlzIGlzIGEgc3VtbWFyeSByZWFjdGlvbi4gU2VlIGlmIHdlIGhhdmUgYW55IGNvbnRhaW5lciBkYXRhIHRoYXQgd2UgY2FuIGxpbmsgdG8gaXQuXG4gICAgICAgICAgICB2YXIgY29udGFpbmVyUmVhY3Rpb25zID0gY29udGFpbmVyRGF0YS5yZWFjdGlvbnM7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvbnRhaW5lclJlYWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBjb250YWluZXJSZWFjdGlvbiA9IGNvbnRhaW5lclJlYWN0aW9uc1tpXTtcbiAgICAgICAgICAgICAgICBpZiAoY29udGFpbmVyUmVhY3Rpb24uaWQgPT09IHJlYWN0aW9uRGF0YS5pZCkge1xuICAgICAgICAgICAgICAgICAgICByZWFjdGlvbkRhdGEucGFyZW50SUQgPSBjb250YWluZXJSZWFjdGlvbi5wYXJlbnRJRDtcbiAgICAgICAgICAgICAgICAgICAgcmVhY3Rpb25EYXRhLmNvbnRlbnQgPSBjb250YWluZXJSZWFjdGlvbi5jb250ZW50O1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGRhdGEgPSB7XG4gICAgICAgICAgICB0YWc6IHtcbiAgICAgICAgICAgICAgICBib2R5OiByZWFjdGlvbkRhdGEudGV4dCxcbiAgICAgICAgICAgICAgICBpZDogcmVhY3Rpb25EYXRhLmlkXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaGFzaDogY29udGFpbmVyRGF0YS5oYXNoLFxuICAgICAgICAgICAgdXNlcl9pZDogdXNlckluZm8udXNlcl9pZCxcbiAgICAgICAgICAgIGFudF90b2tlbjogdXNlckluZm8uYW50X3Rva2VuLFxuICAgICAgICAgICAgcGFnZV9pZDogcGFnZURhdGEucGFnZUlkLFxuICAgICAgICAgICAgZ3JvdXBfaWQ6IHBhZ2VEYXRhLmdyb3VwSWQsXG4gICAgICAgICAgICBjb250YWluZXJfa2luZDogY29udGFpbmVyRGF0YS50eXBlLCAvLyAncGFnZScsICd0ZXh0JywgJ21lZGlhJywgJ2ltZydcbiAgICAgICAgICAgIGNvbnRlbnRfbm9kZV9kYXRhOiB7XG4gICAgICAgICAgICAgICAgYm9keTogJycsIC8vIFRPRE86IGRvIHdlIG5lZWQgdGhpcyBmb3IgKzFzPyBsb29rcyBsaWtlIG9ubHkgdGhlIGlkIGZpZWxkIGlzIHVzZWQsIGlmIG9uZSBpcyBzZXRcbiAgICAgICAgICAgICAgICBraW5kOiBjb250ZW50Tm9kZURhdGFLaW5kKGNvbnRhaW5lckRhdGEudHlwZSksXG4gICAgICAgICAgICAgICAgaXRlbV90eXBlOiAnJyAvLyBUT0RPOiBsb29rcyB1bnVzZWQgYnV0IFRhZ0hhbmRsZXIgYmxvd3MgdXAgd2l0aG91dCBpdFxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBpZiAocmVhY3Rpb25EYXRhLmNvbnRlbnQpIHtcbiAgICAgICAgICAgIGRhdGEuY29udGVudF9ub2RlX2RhdGEuaWQgPSByZWFjdGlvbkRhdGEuY29udGVudC5pZDtcbiAgICAgICAgICAgIGRhdGEuY29udGVudF9ub2RlX2RhdGEubG9jYXRpb24gPSByZWFjdGlvbkRhdGEuY29udGVudC5sb2NhdGlvbjtcbiAgICAgICAgfVxuICAgICAgICAvLyBUT0RPOiBzaG91bGQgd2UgYmFpbCBpZiB0aGVyZSdzIG5vIHBhcmVudCBJRD8gSXQncyBub3QgcmVhbGx5IGEgKzEgd2l0aG91dCBvbmUuXG4gICAgICAgIGlmIChyZWFjdGlvbkRhdGEucGFyZW50SUQpIHtcbiAgICAgICAgICAgIGRhdGEudGFnLnBhcmVudF9pZCA9IHJlYWN0aW9uRGF0YS5wYXJlbnRJRDtcbiAgICAgICAgfVxuICAgICAgICBnZXRKU09OUChVUkxzLmNyZWF0ZVJlYWN0aW9uVXJsKCksIGRhdGEsIHBsdXNPbmVTdWNjZXNzKHJlYWN0aW9uRGF0YSwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIHN1Y2Nlc3MpLCBlcnJvcik7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIHBvc3RDb21tZW50KGNvbW1lbnQsIHJlYWN0aW9uRGF0YSwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MsIHN1Y2Nlc3MsIGVycm9yKSB7XG4gICAgLy8gVE9ETzogcmVmYWN0b3IgdGhlIHBvc3QgZnVuY3Rpb25zIHRvIGVsaW1pbmF0ZSBhbGwgdGhlIGNvcGllZCBjb2RlXG4gICAgVXNlci5mZXRjaFVzZXIoZ3JvdXBTZXR0aW5ncywgZnVuY3Rpb24odXNlckluZm8pIHtcbiAgICAgICAgLy8gVE9ETyBleHRyYWN0IHRoZSBzaGFwZSBvZiB0aGlzIGRhdGEgYW5kIHBvc3NpYmx5IHRoZSB3aG9sZSBBUEkgY2FsbFxuICAgICAgICBpZiAoIXJlYWN0aW9uRGF0YS5jb250ZW50KSB7XG4gICAgICAgICAgICAvLyBUaGlzIGlzIGEgc3VtbWFyeSByZWFjdGlvbi4gU2VlIGlmIHdlIGhhdmUgYW55IGNvbnRhaW5lciBkYXRhIHRoYXQgd2UgY2FuIGxpbmsgdG8gaXQuXG4gICAgICAgICAgICB2YXIgY29udGFpbmVyUmVhY3Rpb25zID0gY29udGFpbmVyRGF0YS5yZWFjdGlvbnM7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvbnRhaW5lclJlYWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBjb250YWluZXJSZWFjdGlvbiA9IGNvbnRhaW5lclJlYWN0aW9uc1tpXTtcbiAgICAgICAgICAgICAgICBpZiAoY29udGFpbmVyUmVhY3Rpb24uaWQgPT09IHJlYWN0aW9uRGF0YS5pZCkge1xuICAgICAgICAgICAgICAgICAgICByZWFjdGlvbkRhdGEucGFyZW50SUQgPSBjb250YWluZXJSZWFjdGlvbi5wYXJlbnRJRDtcbiAgICAgICAgICAgICAgICAgICAgcmVhY3Rpb25EYXRhLmNvbnRlbnQgPSBjb250YWluZXJSZWFjdGlvbi5jb250ZW50O1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGRhdGEgPSB7XG4gICAgICAgICAgICBjb21tZW50OiBjb21tZW50LFxuICAgICAgICAgICAgdGFnOiB7XG4gICAgICAgICAgICAgICAgcGFyZW50X2lkOiByZWFjdGlvbkRhdGEucGFyZW50SURcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB1c2VyX2lkOiB1c2VySW5mby51c2VyX2lkLFxuICAgICAgICAgICAgYW50X3Rva2VuOiB1c2VySW5mby5hbnRfdG9rZW4sXG4gICAgICAgICAgICBwYWdlX2lkOiBwYWdlRGF0YS5wYWdlSWQsXG4gICAgICAgICAgICBncm91cF9pZDogcGFnZURhdGEuZ3JvdXBJZFxuICAgICAgICB9O1xuICAgICAgICBnZXRKU09OUChVUkxzLmNyZWF0ZUNvbW1lbnRVcmwoKSwgZGF0YSwgY29tbWVudFN1Y2Nlc3MocmVhY3Rpb25EYXRhLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgc3VjY2VzcyksIGVycm9yKTtcbiAgICB9KTtcbn1cblxuLy8gVE9ETzogV2UgbmVlZCB0byByZXZpZXcgdGhlIEFQSSBzbyB0aGF0IGl0IHJldHVybnMvYWNjZXB0cyBhIHVuaWZvcm0gc2V0IG9mIHZhbHVlcy5cbmZ1bmN0aW9uIGNvbnRlbnROb2RlRGF0YUtpbmQodHlwZSkge1xuICAgIGlmICh0eXBlID09PSAnaW1hZ2UnKSB7XG4gICAgICAgIHJldHVybiAnaW1nJztcbiAgICB9XG4gICAgcmV0dXJuIHR5cGU7XG59XG5cbmZ1bmN0aW9uIGNvbW1lbnRTdWNjZXNzKHJlYWN0aW9uRGF0YSwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGNhbGxiYWNrKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgIC8vIFRPRE86IGluIHRoZSBjYXNlIHRoYXQgc29tZW9uZSByZWFjdHMgYW5kIHRoZW4gaW1tZWRpYXRlbHkgY29tbWVudHMsIHdlIGhhdmUgYSByYWNlIGNvbmRpdGlvbiB3aGVyZSB0aGVcbiAgICAgICAgLy8gICAgICAgY29tbWVudCByZXNwb25zZSBjb3VsZCBjb21lIGJhY2sgYmVmb3JlIHRoZSByZWFjdGlvbi4gd2UgbmVlZCB0bzpcbiAgICAgICAgLy8gICAgICAgMS4gTWFrZSBzdXJlIHRoZSBzZXJ2ZXIgb25seSBjcmVhdGVzIGEgc2luZ2xlIHJlYWN0aW9uIGluIHRoaXMgY2FzZSAobm90IGEgSFVHRSBkZWFsIGlmIGl0IG1ha2VzIHR3bylcbiAgICAgICAgLy8gICAgICAgMi4gUmVzb2x2ZSB0aGUgdHdvIHJlc3BvbnNlcyB0aGF0IGJvdGggdGhlb3JldGljYWxseSBjb21lIGJhY2sgd2l0aCB0aGUgc2FtZSByZWFjdGlvbiBkYXRhIGF0IHRoZSBzYW1lXG4gICAgICAgIC8vICAgICAgICAgIHRpbWUuIE1ha2Ugc3VyZSB3ZSBkb24ndCBlbmQgdXAgd2l0aCB0d28gY29waWVzIG9mIHRoZSBzYW1lIGRhdGEgaW4gdGhlIG1vZGVsLlxuICAgICAgICB2YXIgcmVhY3Rpb25DcmVhdGVkID0gIXJlc3BvbnNlLmV4aXN0aW5nO1xuICAgICAgICBpZiAocmVhY3Rpb25DcmVhdGVkKSB7XG4gICAgICAgICAgICBpZiAoIXJlYWN0aW9uRGF0YS5jb21tZW50Q291bnQpIHtcbiAgICAgICAgICAgICAgICByZWFjdGlvbkRhdGEuY29tbWVudENvdW50ID0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlYWN0aW9uRGF0YS5jb21tZW50Q291bnQgKz0gMTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIFRPRE86IGRvIHdlIGV2ZXIgZ2V0IGEgcmVzcG9uc2UgdG8gYSBuZXcgcmVhY3Rpb24gdGVsbGluZyB1cyB0aGF0IGl0J3MgYWxyZWFkeSBleGlzdGluZz8gSWYgc28sIGNvdWxkIHRoZSBjb3VudCBuZWVkIHRvIGJlIHVwZGF0ZWQ/XG4gICAgICAgIH1cbiAgICAgICAgY2FsbGJhY2socmVhY3Rpb25DcmVhdGVkKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHBsdXNPbmVTdWNjZXNzKHJlYWN0aW9uRGF0YSwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGNhbGxiYWNrKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgIHZhciByZWFjdGlvbkNyZWF0ZWQgPSAhcmVzcG9uc2UuZXhpc3Rpbmc7XG4gICAgICAgIGlmIChyZWFjdGlvbkNyZWF0ZWQpIHtcbiAgICAgICAgICAgIC8vIFRPRE86IHdlIHNob3VsZCBnZXQgYmFjayBhIHJlc3BvbnNlIHdpdGggZGF0YSBpbiB0aGUgXCJuZXcgZm9ybWF0XCIgYW5kIHVwZGF0ZSB0aGUgbW9kZWwgZnJvbSB0aGUgcmVzcG9uc2VcbiAgICAgICAgICAgIHJlYWN0aW9uRGF0YS5jb3VudCA9IHJlYWN0aW9uRGF0YS5jb3VudCArIDE7XG4gICAgICAgICAgICBjb250YWluZXJEYXRhLnJlYWN0aW9uVG90YWwgPSBjb250YWluZXJEYXRhLnJlYWN0aW9uVG90YWwgKyAxO1xuICAgICAgICAgICAgcGFnZURhdGEuc3VtbWFyeVRvdGFsID0gcGFnZURhdGEuc3VtbWFyeVRvdGFsICsgMTtcbiAgICAgICAgICAgIGNvbnRhaW5lckRhdGEucmVhY3Rpb25zLnNvcnQoZnVuY3Rpb24oYSwgYikge1xuICAgICAgICAgICAgICAgIHJldHVybiBiLmNvdW50IC0gYS5jb3VudDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGNhbGxiYWNrKHJlYWN0aW9uRGF0YSwgcmVzcG9uc2UuZXhpc3RpbmcpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gbmV3UmVhY3Rpb25TdWNjZXNzKGNvbnRlbnRMb2NhdGlvbiwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGNhbGxiYWNrKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgIC8vIFRPRE86IENhbiByZXNwb25zZS5leGlzdGluZyBldmVyIGNvbWUgYmFjayB0cnVlIGZvciBhICduZXcnIHJlYWN0aW9uPyBTaG91bGQgd2UgYmVoYXZlIGFueSBkaWZmZXJlbnRseSBpZiBpdCBkb2VzP1xuICAgICAgICB2YXIgcmVhY3Rpb24gPSByZWFjdGlvbkZyb21SZXNwb25zZShyZXNwb25zZSwgY29udGVudExvY2F0aW9uKTtcbiAgICAgICAgY2FsbGJhY2socmVhY3Rpb24pO1xuICAgIH07XG59XG5cbmZ1bmN0aW9uIHJlYWN0aW9uRnJvbVJlc3BvbnNlKHJlc3BvbnNlLCBjb250ZW50TG9jYXRpb24pIHtcbiAgICAvLyBUT0RPOiB0aGUgc2VydmVyIHNob3VsZCBnaXZlIHVzIGJhY2sgYSByZWFjdGlvbiBtYXRjaGluZyB0aGUgbmV3IEFQSSBmb3JtYXQuXG4gICAgLy8gICAgICAgd2UncmUganVzdCBmYWtpbmcgaXQgb3V0IGZvciBub3c7IHRoaXMgY29kZSBpcyB0ZW1wb3JhcnlcbiAgICB2YXIgcmVhY3Rpb24gPSB7XG4gICAgICAgIHRleHQ6IHJlc3BvbnNlLmludGVyYWN0aW9uLmludGVyYWN0aW9uX25vZGUuYm9keSxcbiAgICAgICAgaWQ6IHJlc3BvbnNlLmludGVyYWN0aW9uLmludGVyYWN0aW9uX25vZGUuaWQsXG4gICAgICAgIGNvdW50OiAxLFxuICAgICAgICBwYXJlbnRJRDogcmVzcG9uc2UuaW50ZXJhY3Rpb24uaWQsXG4gICAgICAgIGFwcHJvdmVkOiByZXNwb25zZS5hcHByb3ZlZCA9PT0gdW5kZWZpbmVkIHx8IHJlc3BvbnNlLmFwcHJvdmVkXG4gICAgfTtcbiAgICBpZiAocmVzcG9uc2UuY29udGVudF9ub2RlKSB7XG4gICAgICAgIHJlYWN0aW9uLmNvbnRlbnQgPSB7XG4gICAgICAgICAgICBpZDogcmVzcG9uc2UuY29udGVudF9ub2RlLmlkLFxuICAgICAgICAgICAga2luZDogcmVzcG9uc2UuY29udGVudF9ub2RlLmtpbmQsXG4gICAgICAgICAgICBib2R5OiByZXNwb25zZS5jb250ZW50X25vZGUuYm9keVxuICAgICAgICB9O1xuICAgICAgICBpZiAocmVzcG9uc2UuY29udGVudF9ub2RlLmxvY2F0aW9uKSB7XG4gICAgICAgICAgICByZWFjdGlvbi5jb250ZW50LmxvY2F0aW9uID0gcmVzcG9uc2UuY29udGVudF9ub2RlLmxvY2F0aW9uO1xuICAgICAgICB9IGVsc2UgaWYgKGNvbnRlbnRMb2NhdGlvbikge1xuICAgICAgICAgICAgLy8gVE9ETzogZW5zdXJlIHRoYXQgdGhlIEFQSSBhbHdheXMgcmV0dXJucyBhIGxvY2F0aW9uIGFuZCByZW1vdmUgdGhlIFwiY29udGVudExvY2F0aW9uXCIgdGhhdCdzIGJlaW5nIHBhc3NlZCBhcm91bmQuXG4gICAgICAgICAgICAvLyBGb3Igbm93LCBqdXN0IHBhdGNoIHRoZSByZXNwb25zZSB3aXRoIHRoZSBkYXRhIHdlIGtub3cgd2Ugc2VudCBvdmVyLlxuICAgICAgICAgICAgcmVhY3Rpb24uY29udGVudC5sb2NhdGlvbiA9IGNvbnRlbnRMb2NhdGlvbjtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVhY3Rpb247XG59XG5cbmZ1bmN0aW9uIGdldENvbW1lbnRzKHJlYWN0aW9uLCBncm91cFNldHRpbmdzLCBzdWNjZXNzQ2FsbGJhY2ssIGVycm9yQ2FsbGJhY2spIHtcbiAgICBVc2VyLmZldGNoVXNlcihncm91cFNldHRpbmdzLCBmdW5jdGlvbih1c2VySW5mbykge1xuICAgICAgICB2YXIgZGF0YSA9IHtcbiAgICAgICAgICAgIHJlYWN0aW9uX2lkOiByZWFjdGlvbi5wYXJlbnRJRCxcbiAgICAgICAgICAgIHVzZXJfaWQ6IHVzZXJJbmZvLnVzZXJfaWQsXG4gICAgICAgICAgICBhbnRfdG9rZW46IHVzZXJJbmZvLmFudF90b2tlblxuICAgICAgICB9O1xuICAgICAgICBnZXRKU09OUChVUkxzLmZldGNoQ29tbWVudFVybCgpLCBkYXRhLCBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKGNvbW1lbnRzRnJvbVJlc3BvbnNlKHJlc3BvbnNlKSk7XG4gICAgICAgIH0sIGVycm9yQ2FsbGJhY2spO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBmZXRjaExvY2F0aW9uRGV0YWlscyhyZWFjdGlvbkxvY2F0aW9uRGF0YSwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MsIHN1Y2Nlc3NDYWxsYmFjaywgZXJyb3JDYWxsYmFjaykge1xuICAgIHZhciBjb250ZW50SURzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMocmVhY3Rpb25Mb2NhdGlvbkRhdGEpO1xuICAgIFVzZXIuZmV0Y2hVc2VyKGdyb3VwU2V0dGluZ3MsIGZ1bmN0aW9uKHVzZXJJbmZvKSB7XG4gICAgICAgIHZhciBkYXRhID0ge1xuICAgICAgICAgICAgdXNlcl9pZDogdXNlckluZm8udXNlcl9pZCxcbiAgICAgICAgICAgIGFudF90b2tlbjogdXNlckluZm8uYW50X3Rva2VuLFxuICAgICAgICAgICAgY29udGVudF9pZHM6IGNvbnRlbnRJRHNcbiAgICAgICAgfTtcbiAgICAgICAgZ2V0SlNPTlAoVVJMcy5mZXRjaENvbnRlbnRCb2RpZXNVcmwoKSwgZGF0YSwgc3VjY2Vzc0NhbGxiYWNrLCBlcnJvckNhbGxiYWNrKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gY29tbWVudHNGcm9tUmVzcG9uc2UoanNvbkNvbW1lbnRzKSB7XG4gICAgdmFyIGNvbW1lbnRzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBqc29uQ29tbWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGpzb25Db21tZW50ID0ganNvbkNvbW1lbnRzW2ldO1xuICAgICAgICB2YXIgY29tbWVudCA9IHtcbiAgICAgICAgICAgIHRleHQ6IGpzb25Db21tZW50LnRleHQsXG4gICAgICAgICAgICBpZDoganNvbkNvbW1lbnQuaWQsIC8vIFRPRE86IHdlIHByb2JhYmx5IG9ubHkgbmVlZCB0aGlzIGZvciArMSdpbmcgY29tbWVudHNcbiAgICAgICAgICAgIGNvbnRlbnRJRDoganNvbkNvbW1lbnQuY29udGVudElELCAvLyBUT0RPOiBEbyB3ZSByZWFsbHkgbmVlZCB0aGlzP1xuICAgICAgICAgICAgdXNlcjogVXNlci5mcm9tQ29tbWVudEpTT04oanNvbkNvbW1lbnQudXNlciwganNvbkNvbW1lbnQuc29jaWFsX3VzZXIpXG4gICAgICAgIH07XG4gICAgICAgIGNvbW1lbnRzLnB1c2goY29tbWVudCk7XG4gICAgfVxuICAgIHJldHVybiBjb21tZW50cztcbn1cblxuZnVuY3Rpb24gcG9zdFNoYXJlUmVhY3Rpb24ocmVhY3Rpb25EYXRhLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncywgc3VjY2VzcywgZmFpbHVyZSkge1xuICAgIFVzZXIuZmV0Y2hVc2VyKGdyb3VwU2V0dGluZ3MsIGZ1bmN0aW9uKHVzZXJJbmZvKSB7XG4gICAgICAgIHZhciBjb250ZW50RGF0YSA9IHJlYWN0aW9uRGF0YS5jb250ZW50O1xuICAgICAgICB2YXIgZGF0YSA9IHtcbiAgICAgICAgICAgIHRhZzogeyAvLyBUT0RPOiB3aHkgZG9lcyB0aGUgU2hhcmVIYW5kbGVyIGNyZWF0ZSBhIHJlYWN0aW9uIGlmIGl0IGRvZXNuJ3QgZXhpc3Q/IEhvdyBjYW4geW91IHNoYXJlIGEgcmVhY3Rpb24gdGhhdCBoYXNuJ3QgaGFwcGVuZWQ/XG4gICAgICAgICAgICAgICAgaWQ6IHJlYWN0aW9uRGF0YS5pZCxcbiAgICAgICAgICAgICAgICBib2R5OiByZWFjdGlvbkRhdGEudGV4dFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGhhc2g6IGNvbnRhaW5lckRhdGEuaGFzaCxcbiAgICAgICAgICAgIGNvbnRhaW5lcl9raW5kOiBjb250YWluZXJEYXRhLnR5cGUsXG4gICAgICAgICAgICBjb250ZW50X25vZGVfZGF0YTogeyAvLyBUT0RPOiB3aHkgZG9lcyB0aGUgU2hhcmVIYW5kbGVyIGNyZWF0ZSBhIGNvbnRlbnQgaWYgaXQgZG9lc24ndCBleGlzdD8gSG93IGNhbiB5b3Ugc2hhcmUgYSByZWFjdGlvbiB0aGF0IGhhc24ndCBoYXBwZW5lZD9cbiAgICAgICAgICAgICAgICBpZDogY29udGVudERhdGEuaWQsXG4gICAgICAgICAgICAgICAgYm9keTogY29udGVudERhdGEudGV4dCxcbiAgICAgICAgICAgICAgICBsb2NhdGlvbjogY29udGVudERhdGEubG9jYXRpb24sXG4gICAgICAgICAgICAgICAga2luZDogY29udGVudE5vZGVEYXRhS2luZChjb250YWluZXJEYXRhLnR5cGUpXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdXNlcl9pZDogdXNlckluZm8udXNlcl9pZCxcbiAgICAgICAgICAgIGFudF90b2tlbjogdXNlckluZm8uYW50X3Rva2VuLFxuICAgICAgICAgICAgZ3JvdXBfaWQ6IHBhZ2VEYXRhLmdyb3VwSWQsXG4gICAgICAgICAgICBwYWdlX2lkOiBwYWdlRGF0YS5wYWdlSWQsXG4gICAgICAgICAgICByZWZlcnJpbmdfaW50X2lkOiByZWFjdGlvbkRhdGEucGFyZW50SURcbiAgICAgICAgfTtcbiAgICAgICAgZ2V0SlNPTlAoVVJMcy5zaGFyZVJlYWN0aW9uVXJsKCksIGRhdGEsIHN1Y2Nlc3MsIGZhaWx1cmUpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBnZXRKU09OUCh1cmwsIGRhdGEsIHN1Y2Nlc3MsIGVycm9yKSB7XG4gICAgdmFyIGJhc2VVcmwgPSBVUkxzLmFwcFNlcnZlclVybCgpO1xuICAgIGRvR2V0SlNPTlAoYmFzZVVybCwgdXJsLCBkYXRhLCBzdWNjZXNzLCBlcnJvcik7XG59XG5cbmZ1bmN0aW9uIHBvc3RFdmVudChldmVudCkge1xuICAgIHZhciBiYXNlVXJsID0gVVJMcy5ldmVudHNTZXJ2ZXJVcmwoKTtcbiAgICBkb0dldEpTT05QKGJhc2VVcmwsIFVSTHMuZXZlbnRVcmwoKSwgZXZlbnQsIGZ1bmN0aW9uKCkgeyAvKnN1Y2Nlc3MqLyB9LCBmdW5jdGlvbihlcnJvcikge1xuICAgICAgICAvLyBUT0RPOiBlcnJvciBoYW5kbGluZ1xuICAgICAgICBMb2dnaW5nLmRlYnVnTWVzc2FnZSgnQW4gZXJyb3Igb2NjdXJyZWQgcG9zdGluZyBldmVudDogJywgZXJyb3IpO1xuICAgIH0pO1xufVxuXG4vLyBJc3N1ZXMgYSBKU09OUCByZXF1ZXN0IHRvIGEgZ2l2ZW4gc2VydmVyLiBUbyBzZW5kIGEgcmVxdWVzdCB0byB0aGUgYXBwbGljYXRpb24gc2VydmVyLCB1c2UgZ2V0SlNPTlAgaW5zdGVhZC5cbmZ1bmN0aW9uIGRvR2V0SlNPTlAoYmFzZVVybCwgdXJsLCBwYXJhbXMsIHN1Y2Nlc3MsIGVycm9yKSB7XG4gICAgSlNPTlBDbGllbnQuZG9HZXRKU09OUChiYXNlVXJsLCB1cmwsIHBhcmFtcywgc3VjY2VzcywgZXJyb3IpO1xufVxuXG5mdW5jdGlvbiBwb3N0VHJhY2tpbmdFdmVudChldmVudCkge1xuICAgIHZhciBiYXNlVXJsID0gVVJMcy5ldmVudHNTZXJ2ZXJVcmwoKTtcbiAgICB2YXIgdHJhY2tpbmdVcmwgPSBiYXNlVXJsICsgVVJMcy5ldmVudFVybCgpICsgJy9ldmVudC5naWYnO1xuICAgIGlmIChldmVudCkge1xuICAgICAgICB0cmFja2luZ1VybCArPSAnP2pzb249JyArIGVuY29kZVVSSShKU09OVXRpbHMuc3RyaW5naWZ5KGV2ZW50KSk7XG4gICAgfVxuICAgIHZhciBpbWFnZVRhZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2ltZycpO1xuICAgIGltYWdlVGFnLnNldEF0dHJpYnV0ZSgnaGVpZ2h0JywgMSk7XG4gICAgaW1hZ2VUYWcuc2V0QXR0cmlidXRlKCd3aWR0aCcsIDEpO1xuICAgIGltYWdlVGFnLnNldEF0dHJpYnV0ZSgnc3JjJywgdHJhY2tpbmdVcmwpO1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdib2R5JylbMF0uYXBwZW5kQ2hpbGQoaW1hZ2VUYWcpO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgZ2V0SlNPTlA6IGdldEpTT05QLFxuICAgIHBvc3RQbHVzT25lOiBwb3N0UGx1c09uZSxcbiAgICBwb3N0TmV3UmVhY3Rpb246IHBvc3ROZXdSZWFjdGlvbixcbiAgICBwb3N0Q29tbWVudDogcG9zdENvbW1lbnQsXG4gICAgZ2V0Q29tbWVudHM6IGdldENvbW1lbnRzLFxuICAgIHBvc3RTaGFyZVJlYWN0aW9uOiBwb3N0U2hhcmVSZWFjdGlvbixcbiAgICBmZXRjaExvY2F0aW9uRGV0YWlsczogZmV0Y2hMb2NhdGlvbkRldGFpbHMsXG4gICAgcG9zdEV2ZW50OiBwb3N0RXZlbnQsXG4gICAgcG9zdFRyYWNraW5nRXZlbnQ6IHBvc3RUcmFja2luZ0V2ZW50XG59OyIsInZhciBVUkxDb25zdGFudHMgPSByZXF1aXJlKCcuL3VybC1jb25zdGFudHMnKTtcbnZhciBVUkxQYXJhbXMgPSByZXF1aXJlKCcuL3VybC1wYXJhbXMnKTtcblxuZnVuY3Rpb24gY29tcHV0ZUN1cnJlbnRTY3JpcHRTcmMoKSB7XG4gICAgaWYgKGRvY3VtZW50LmN1cnJlbnRTY3JpcHQpIHtcbiAgICAgICAgcmV0dXJuIGRvY3VtZW50LmN1cnJlbnRTY3JpcHQuc3JjO1xuICAgIH1cbiAgICAvLyBJRSBmYWxsYmFjay4uLlxuICAgIHZhciBzY3JpcHRzID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ3NjcmlwdCcpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2NyaXB0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgc2NyaXB0ID0gc2NyaXB0c1tpXTtcbiAgICAgICAgaWYgKHNjcmlwdC5oYXNBdHRyaWJ1dGUoJ3NyYycpKSB7XG4gICAgICAgICAgICB2YXIgc2NyaXB0U3JjID0gc2NyaXB0LmdldEF0dHJpYnV0ZSgnc3JjJyk7XG4gICAgICAgICAgICB2YXIgYW50ZW5uYVNjcmlwdHMgPSBbICdhbnRlbm5hLmpzJywgJ2FudGVubmEubWluLmpzJywgJ2VuZ2FnZS5qcycsICdlbmdhZ2VfZnVsbC5qcycgXTtcbiAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgYW50ZW5uYVNjcmlwdHMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoc2NyaXB0U3JjLmluZGV4T2YoYW50ZW5uYVNjcmlwdHNbal0pICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2NyaXB0U3JjO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxudmFyIGN1cnJlbnRTY3JpcHRTcmMgPSBjb21wdXRlQ3VycmVudFNjcmlwdFNyYygpIHx8ICcnO1xuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgb2ZmbGluZTogY3VycmVudFNjcmlwdFNyYy5pbmRleE9mKFVSTENvbnN0YW50cy5ERVZFTE9QTUVOVCkgIT09IC0xIHx8IGN1cnJlbnRTY3JpcHRTcmMuaW5kZXhPZihVUkxDb25zdGFudHMuVEVTVCkgIT09IC0xLFxuICAgIHRlc3Q6IGN1cnJlbnRTY3JpcHRTcmMuaW5kZXhPZihVUkxDb25zdGFudHMuVEVTVCkgIT09IC0xLFxuICAgIGRlYnVnOiBVUkxQYXJhbXMuZ2V0VXJsUGFyYW0oJ2FudGVubmFEZWJ1ZycpID09PSAndHJ1ZSdcbn07IiwiXG52YXIgaXNUb3VjaEJyb3dzZXI7XG52YXIgaXNNb2JpbGVEZXZpY2U7XG5cbmZ1bmN0aW9uIHN1cHBvcnRzVG91Y2goKSB7XG4gICAgaWYgKGlzVG91Y2hCcm93c2VyID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgLy9pc1RvdWNoQnJvd3NlciA9IChuYXZpZ2F0b3IubXNNYXhUb3VjaFBvaW50cyB8fCBcIm9udG91Y2hzdGFydFwiIGluIHdpbmRvdykgJiYgKCh3aW5kb3cubWF0Y2hNZWRpYShcIm9ubHkgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjhweClcIikpLm1hdGNoZXMpO1xuICAgICAgICBpc1RvdWNoQnJvd3NlciA9IFwib250b3VjaHN0YXJ0XCIgaW4gd2luZG93O1xuICAgIH1cbiAgICByZXR1cm4gaXNUb3VjaEJyb3dzZXI7XG59XG5cbmZ1bmN0aW9uIGlzTW9iaWxlKCkge1xuICAgIGlmIChpc01vYmlsZURldmljZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGlzTW9iaWxlRGV2aWNlID0gc3VwcG9ydHNUb3VjaCgpICYmXG4gICAgICAgICAgICAoKHdpbmRvdy5tYXRjaE1lZGlhKFwic2NyZWVuIGFuZCAobWF4LWRldmljZS13aWR0aDogNDgwcHgpIGFuZCAob3JpZW50YXRpb246IHBvcnRyYWl0KVwiKSkubWF0Y2hlcyB8fFxuICAgICAgICAgICAgKHdpbmRvdy5tYXRjaE1lZGlhKFwic2NyZWVuIGFuZCAobWF4LWRldmljZS13aWR0aDogNzY4cHgpIGFuZCAob3JpZW50YXRpb246IGxhbmRzY2FwZSlcIikpLm1hdGNoZXMpO1xuICAgIH1cbiAgICByZXR1cm4gaXNNb2JpbGVEZXZpY2U7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHN1cHBvcnRzVG91Y2g6IHN1cHBvcnRzVG91Y2gsXG4gICAgaXNNb2JpbGU6IGlzTW9iaWxlXG59OyIsIlxuLy8gUmUtdXNhYmxlIHN1cHBvcnQgZm9yIG1hbmFnaW5nIGEgY29sbGVjdGlvbiBvZiBjYWxsYmFjayBmdW5jdGlvbnMuXG5cbnZhciBhbnR1aWQgPSAwOyAvLyBcImdsb2JhbGx5XCIgdW5pcXVlIElEIHRoYXQgd2UgdXNlIHRvIHRhZyBjYWxsYmFjayBmdW5jdGlvbnMgZm9yIGxhdGVyIHJldHJpZXZhbC4gKFRoaXMgaXMgaG93IFwib2ZmXCIgd29ya3MuKVxuXG5mdW5jdGlvbiBjcmVhdGVDYWxsYmFja3MoKSB7XG5cbiAgICB2YXIgY2FsbGJhY2tzID0ge307XG5cbiAgICBmdW5jdGlvbiBhZGRDYWxsYmFjayhjYWxsYmFjaykge1xuICAgICAgICBpZiAoY2FsbGJhY2suYW50dWlkID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrLmFudHVpZCA9IGFudHVpZCsrO1xuICAgICAgICB9XG4gICAgICAgIGNhbGxiYWNrc1tjYWxsYmFjay5hbnR1aWRdID0gY2FsbGJhY2s7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcmVtb3ZlQ2FsbGJhY2soY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKGNhbGxiYWNrLmFudHVpZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBkZWxldGUgY2FsbGJhY2tzW2NhbGxiYWNrLmFudHVpZF07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRDYWxsYmFja3MoKSB7XG4gICAgICAgIHZhciBhbGxDYWxsYmFja3MgPSBbXTtcbiAgICAgICAgZm9yICh2YXIga2V5IGluIGNhbGxiYWNrcykge1xuICAgICAgICAgICAgaWYgKGNhbGxiYWNrcy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgYWxsQ2FsbGJhY2tzLnB1c2goY2FsbGJhY2tzW2tleV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhbGxDYWxsYmFja3M7XG4gICAgfVxuXG4gICAgLy8gQ29udmVuaWVuY2UgZnVuY3Rpb24gdGhhdCBpbnZva2VzIGFsbCBjYWxsYmFja3Mgd2l0aCBubyBwYXJhbWV0ZXJzLiBBbnkgY2FsbGJhY2tzIHRoYXQgbmVlZCBwYXJhbXMgY2FuIGJlIGNhbGxlZFxuICAgIC8vIGJ5IGNsaWVudHMgdXNpbmcgZ2V0Q2FsbGJhY2tzKClcbiAgICBmdW5jdGlvbiBpbnZva2VBbGwoKSB7XG4gICAgICAgIHZhciBjYWxsYmFja3MgPSBnZXRDYWxsYmFja3MoKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjYWxsYmFja3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNhbGxiYWNrc1tpXSgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNFbXB0eSgpIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKGNhbGxiYWNrcykubGVuZ3RoID09PSAwO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHRlYXJkb3duKCkge1xuICAgICAgICBjYWxsYmFja3MgPSB7fTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBhZGQ6IGFkZENhbGxiYWNrLFxuICAgICAgICByZW1vdmU6IHJlbW92ZUNhbGxiYWNrLFxuICAgICAgICBnZXQ6IGdldENhbGxiYWNrcyxcbiAgICAgICAgaXNFbXB0eTogaXNFbXB0eSxcbiAgICAgICAgaW52b2tlQWxsOiBpbnZva2VBbGwsXG4gICAgICAgIHRlYXJkb3duOiB0ZWFyZG93blxuICAgIH1cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZTogY3JlYXRlQ2FsbGJhY2tzXG59OyIsInZhciAkOyByZXF1aXJlKCcuL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIE1ENSA9IHJlcXVpcmUoJy4vbWQ1Jyk7XG5cbmZ1bmN0aW9uIGdldENsZWFuVGV4dCgkZWxlbWVudCkge1xuICAgIHZhciAkY2xvbmUgPSAkZWxlbWVudC5jbG9uZSgpO1xuICAgIC8vIFJlbW92ZSBhbnkgZWxlbWVudHMgdGhhdCB3ZSBkb24ndCB3YW50IGluY2x1ZGVkIGluIHRoZSB0ZXh0IGNhbGN1bGF0aW9uXG4gICAgJGNsb25lLmZpbmQoJ2lmcmFtZSwgaW1nLCBzY3JpcHQsIHZpZGVvLCAuYW50ZW5uYSwgLm5vLWFudCcpLnJlbW92ZSgpLmVuZCgpO1xuICAgIC8vIFRoZW4gbWFudWFsbHkgY29udmVydCBhbnkgPGJyPiB0YWdzIGludG8gc3BhY2VzIChvdGhlcndpc2UsIHdvcmRzIHdpbGwgZ2V0IGFwcGVuZGVkIGJ5IHRoZSB0ZXh0KCkgY2FsbClcbiAgICB2YXIgaHRtbCA9ICRjbG9uZS5odG1sKCkucmVwbGFjZSgvPFxcU2JyXFxTXFwvPz4vZ2ksICcgJyk7XG4gICAgLy8gUHV0IHRoZSBIVE1MIGJhY2sgaW50byBhIGRpdiBhbmQgY2FsbCB0ZXh0KCksIHdoaWNoIGRvZXMgbW9zdCBvZiB0aGUgaGVhdnkgbGlmdGluZ1xuICAgIHZhciB0ZXh0ID0gJCgnPGRpdj4nICsgaHRtbCArICc8L2Rpdj4nKS50ZXh0KCkudG9Mb3dlckNhc2UoKS50cmltKCk7XG4gICAgdGV4dCA9IHRleHQucmVwbGFjZSgvW1xcblxcclxcdF0vZ2ksICcgJyk7IC8vIFJlcGxhY2UgYW55IG5ld2xpbmVzL3RhYnMgd2l0aCBzcGFjZXNcbiAgICByZXR1cm4gdGV4dDtcbn1cblxuZnVuY3Rpb24gaGFzaFRleHQoZWxlbWVudCwgc3VmZml4KSB7XG4gICAgdmFyIHRleHQgPSBnZXRDbGVhblRleHQoZWxlbWVudCk7XG4gICAgaWYgKHRleHQpIHtcbiAgICAgICAgdmFyIGhhc2hUZXh0ID0gXCJyZHItdGV4dC1cIiArIHRleHQ7XG4gICAgICAgIGlmIChzdWZmaXggIT09IHVuZGVmaW5lZCkgeyAvLyBBcHBlbmQgdGhlIG9wdGlvbmFsIHN1ZmZpeFxuICAgICAgICAgICAgaGFzaFRleHQgKz0gJy0nICsgc3VmZml4O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBNRDUuaGV4X21kNShoYXNoVGV4dCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBoYXNoVXJsKHVybCkge1xuICAgIHJldHVybiBNRDUuaGV4X21kNSh1cmwpO1xufVxuXG5mdW5jdGlvbiBoYXNoSW1hZ2UoaW1hZ2VVcmwsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICBpZiAoaW1hZ2VVcmwgJiYgaW1hZ2VVcmwubGVuZ3RoID4gMCkge1xuICAgICAgICBpbWFnZVVybCA9IGZpZGRsZVdpdGhJbWFnZUFuZE1lZGlhVXJscyhpbWFnZVVybCwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIHZhciBoYXNoVGV4dCA9ICdyZHItaW1nLScgKyBpbWFnZVVybDtcbiAgICAgICAgcmV0dXJuIE1ENS5oZXhfbWQ1KGhhc2hUZXh0KTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGhhc2hNZWRpYShtZWRpYVVybCwgZ3JvdXBTZXR0aW5ncykge1xuICAgIGlmIChtZWRpYVVybCAmJiBtZWRpYVVybC5sZW5ndGggPiAwKSB7XG4gICAgICAgIG1lZGlhVXJsID0gZmlkZGxlV2l0aEltYWdlQW5kTWVkaWFVcmxzKG1lZGlhVXJsLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgdmFyIGhhc2hUZXh0ID0gJ3Jkci1tZWRpYS0nICsgbWVkaWFVcmw7XG4gICAgICAgIHJldHVybiBNRDUuaGV4X21kNShoYXNoVGV4dCk7XG4gICAgfVxufVxuXG4vLyBUT0RPOiByZXZpZXcuIGNvcGllZCBmcm9tIGVuZ2FnZV9mdWxsXG5mdW5jdGlvbiBmaWRkbGVXaXRoSW1hZ2VBbmRNZWRpYVVybHModXJsLCBncm91cFNldHRpbmdzKSB7XG4gICAgLy8gZmlkZGxlIHdpdGggdGhlIHVybCB0byBhY2NvdW50IGZvciByb3RhdGluZyBzdWJkb21haW5zIChpLmUuLCBkaWZmZXJpbmcgQ0ROIG5hbWVzIGZvciBpbWFnZSBob3N0cylcbiAgICAvLyByZWdleCBmcm9tIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvNjQ0OTM0MC9ob3ctdG8tZ2V0LXRvcC1sZXZlbC1kb21haW4tYmFzZS1kb21haW4tZnJvbS10aGUtdXJsLWluLWphdmFzY3JpcHRcbiAgICAvLyBtb2RpZmllZCB0byBzdXBwb3J0IDIgY2hhcmFjdGVyIHN1ZmZpeGVzLCBsaWtlIC5mbSBvciAuaW9cbiAgICB2YXIgSE9TVERPTUFJTiA9IC9bLVxcd10rXFwuKD86Wy1cXHddK1xcLnhuLS1bLVxcd10rfFstXFx3XXsyLH18Wy1cXHddK1xcLlstXFx3XXsyfSkkL2k7XG4gICAgdmFyIHNyY0FycmF5ID0gdXJsLnNwbGl0KCcvJyk7XG4gICAgc3JjQXJyYXkuc3BsaWNlKDAsMik7XG5cbiAgICB2YXIgZG9tYWluV2l0aFBvcnQgPSBzcmNBcnJheS5zaGlmdCgpO1xuICAgIGlmICghZG9tYWluV2l0aFBvcnQpIHsgLy90aGlzIGNvdWxkIGJlIHVuZGVmaW5lZCBpZiB0aGUgdXJsIG5vdCB2YWxpZCBvciBpcyBzb21ldGhpbmcgbGlrZSBqYXZhc2NyaXB0OnZvaWRcbiAgICAgICAgcmV0dXJuIHVybDtcbiAgICB9XG4gICAgdmFyIGRvbWFpbiA9IGRvbWFpbldpdGhQb3J0LnNwbGl0KCc6JylbMF07IC8vIGdldCBkb21haW4sIHN0cmlwIHBvcnRcblxuICAgIHZhciBmaWxlbmFtZSA9IHNyY0FycmF5LmpvaW4oJy8nKTtcblxuICAgIC8vIHRlc3QgZXhhbXBsZXM6XG4gICAgLy8gdmFyIG1hdGNoID0gSE9TVERPTUFJTi5leGVjKCdodHRwOi8vbWVkaWExLmFiLmNkLm9uLXRoZS10ZWxseS5iYmMuY28udWsvJyk7IC8vIGZhaWxzOiB0cmFpbGluZyBzbGFzaFxuICAgIC8vIHZhciBtYXRjaCA9IEhPU1RET01BSU4uZXhlYygnaHR0cDovL21lZGlhMS5hYi5jZC5vbi10aGUtdGVsbHkuYmJjLmNvLnVrJyk7IC8vIHN1Y2Nlc3NcbiAgICAvLyB2YXIgbWF0Y2ggPSBIT1NURE9NQUlOLmV4ZWMoJ21lZGlhMS5hYi5jZC5vbi10aGUtdGVsbHkuYmJjLmNvLnVrJyk7IC8vIHN1Y2Nlc3NcbiAgICB2YXIgbWF0Y2ggPSBIT1NURE9NQUlOLmV4ZWMoZG9tYWluKTtcbiAgICBpZiAobWF0Y2ggPT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gdXJsO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHVybCA9IG1hdGNoWzBdICsgJy8nICsgZmlsZW5hbWU7XG4gICAgfVxuICAgIGlmIChncm91cFNldHRpbmdzLnVybC5pZ25vcmVNZWRpYVVybFF1ZXJ5KCkgJiYgdXJsLmluZGV4T2YoJz8nKSkge1xuICAgICAgICB1cmwgPSB1cmwuc3BsaXQoJz8nKVswXTtcbiAgICB9XG4gICAgcmV0dXJuIHVybDtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGhhc2hUZXh0OiBoYXNoVGV4dCxcbiAgICBoYXNoSW1hZ2U6IGhhc2hJbWFnZSxcbiAgICBoYXNoTWVkaWE6IGhhc2hNZWRpYSxcbiAgICBoYXNoVXJsOiBoYXNoVXJsXG59OyIsIlxudmFyIGxvYWRlZGpRdWVyeTtcbnZhciBjYWxsYmFja3MgPSBbXTtcblxuLy8gTm90aWZpZXMgdGhlIGpRdWVyeSBwcm92aWRlciB0aGF0IHdlJ3ZlIGxvYWRlZCB0aGUgalF1ZXJ5IGxpYnJhcnkuXG5mdW5jdGlvbiBsb2FkZWQoKSB7XG4gICAgbG9hZGVkalF1ZXJ5ID0galF1ZXJ5Lm5vQ29uZmxpY3QodHJ1ZSk7XG4gICAgbm90aWZ5Q2FsbGJhY2tzKCk7XG59XG5cbmZ1bmN0aW9uIG5vdGlmeUNhbGxiYWNrcygpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNhbGxiYWNrcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjYWxsYmFja3NbaV0obG9hZGVkalF1ZXJ5KTtcbiAgICB9XG4gICAgY2FsbGJhY2tzID0gW107XG59XG5cbi8vIFJlZ2lzdGVycyB0aGUgZ2l2ZW4gY2FsbGJhY2sgdG8gYmUgbm90aWZpZWQgd2hlbiBvdXIgdmVyc2lvbiBvZiBqUXVlcnkgaXMgbG9hZGVkLlxuZnVuY3Rpb24gb25Mb2FkKGNhbGxiYWNrKSB7XG4gICAgaWYgKGxvYWRlZGpRdWVyeSkge1xuICAgICAgICBjYWxsYmFjayhsb2FkZWRqUXVlcnkpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGNhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKTtcbiAgICB9XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBsb2FkZWQ6IGxvYWRlZCxcbiAgICBvbkxvYWQ6IG9uTG9hZFxufTsiLCJcbi8vIFRoZXJlIGFyZSBsaWJyYXJpZXMgaW4gdGhlIHdpbGQgdGhhdCBtb2RpZnkgQXJyYXkucHJvdG90eXBlIHdpdGggYSB0b0pTT04gZnVuY3Rpb24gdGhhdCBicmVha3MgSlNPTi5zdHJpbmdpZnkuXG4vLyBXb3JrYXJvdW5kIHRoaXMgcHJvYmxlbSBieSB0ZW1wb3JhcmlseSByZW1vdmluZyB0aGUgZnVuY3Rpb24gd2hlbiB3ZSBzdHJpbmdpZnkgb3VyIG9iamVjdHMuXG5mdW5jdGlvbiBzdHJpbmdpZnkoanNvbk9iamVjdCkge1xuICAgIHZhciB0b0pTT04gPSBBcnJheS5wcm90b3R5cGUudG9KU09OO1xuICAgIGRlbGV0ZSBBcnJheS5wcm90b3R5cGUudG9KU09OO1xuICAgIHZhciBzdHJpbmcgPSBKU09OLnN0cmluZ2lmeShqc29uT2JqZWN0KTtcbiAgICBpZiAodG9KU09OKSB7XG4gICAgICAgIEFycmF5LnByb3RvdHlwZS50b0pTT04gPSB0b0pTT047XG4gICAgfVxuICAgIHJldHVybiBzdHJpbmc7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHN0cmluZ2lmeTogc3RyaW5naWZ5XG59OyIsInZhciBKU09OVXRpbHMgPSByZXF1aXJlKCcuL2pzb24tdXRpbHMnKTtcblxuLy8gSXNzdWVzIGEgSlNPTlAgcmVxdWVzdCB0byBhIGdpdmVuIHNlcnZlci4gTW9zdCBoaWdoZXItbGV2ZWwgZnVuY3Rpb25hbGl0eSBpcyBpbiBhamF4LWNsaWVudC5cbmZ1bmN0aW9uIGRvR2V0SlNPTlAoYmFzZVVybCwgdXJsLCBwYXJhbXMsIHN1Y2Nlc3MsIGVycm9yKSB7XG4gICAgdmFyIHNjcmlwdFRhZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuICAgIHZhciByZXNwb25zZUNhbGxiYWNrID0gJ2FudGVubmEnICsgTWF0aC5yYW5kb20oKS50b1N0cmluZygxNikuc2xpY2UoMik7XG4gICAgd2luZG93W3Jlc3BvbnNlQ2FsbGJhY2tdID0gZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFRPRE86IFJldmlzaXQgd2hldGhlciBpdCdzIHJlYWxseSBjb29sIHRvIGtleSB0aGlzIG9uIHRoZSB0ZXh0U3RhdHVzIG9yIGlmIHdlIHNob3VsZCBiZSBsb29raW5nIGF0XG4gICAgICAgICAgICAvLyAgICAgICB0aGUgc3RhdHVzIGNvZGUgaW4gdGhlIFhIUlxuICAgICAgICAgICAgLy8gTm90ZTogVGhlIHNlcnZlciBjb21lcyBiYWNrIHdpdGggMjAwIHJlc3BvbnNlcyB3aXRoIGEgbmVzdGVkIHN0YXR1cyBvZiBcImZhaWxcIi4uLlxuICAgICAgICAgICAgaWYgKHJlc3BvbnNlLnN0YXR1cyAhPT0gJ2ZhaWwnICYmICghcmVzcG9uc2UuZGF0YSB8fCByZXNwb25zZS5kYXRhLnN0YXR1cyAhPT0gJ2ZhaWwnKSkge1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3MocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChlcnJvcikgeyBlcnJvcihyZXNwb25zZS5tZXNzYWdlIHx8IHJlc3BvbnNlLmRhdGEubWVzc2FnZSk7IH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgIGRlbGV0ZSB3aW5kb3dbcmVzcG9uc2VDYWxsYmFja107XG4gICAgICAgICAgICBzY3JpcHRUYWcucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChzY3JpcHRUYWcpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICB2YXIganNvbnBVcmwgPSBiYXNlVXJsICsgdXJsICsgJz9jYWxsYmFjaz0nICsgcmVzcG9uc2VDYWxsYmFjaztcbiAgICBpZiAocGFyYW1zKSB7XG4gICAgICAgIGpzb25wVXJsICs9ICcmanNvbj0nICsgZW5jb2RlVVJJQ29tcG9uZW50KEpTT05VdGlscy5zdHJpbmdpZnkocGFyYW1zKSk7XG4gICAgfVxuICAgIHNjcmlwdFRhZy5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCAnYXBwbGljYXRpb24vamF2YXNjcmlwdCcpO1xuICAgIHNjcmlwdFRhZy5zZXRBdHRyaWJ1dGUoJ3NyYycsIGpzb25wVXJsKTtcbiAgICAoZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKVswXSB8fCBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnYm9keScpWzBdKS5hcHBlbmRDaGlsZChzY3JpcHRUYWcpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBkb0dldEpTT05QOiBkb0dldEpTT05QXG59OyIsInZhciBBcHBNb2RlID0gcmVxdWlyZSgnLi9hcHAtbW9kZScpO1xuXG5mdW5jdGlvbiBsb2dEZWJ1Z01lc3NhZ2UobWVzc2FnZSkge1xuICAgIGlmIChBcHBNb2RlLmRlYnVnKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ0FudGVubmFEZWJ1ZzogJyArIG1lc3NhZ2UpO1xuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgZGVidWdNZXNzYWdlOiBsb2dEZWJ1Z01lc3NhZ2Vcbn07IiwiLypcbiAqIEEgSmF2YVNjcmlwdCBpbXBsZW1lbnRhdGlvbiBvZiB0aGUgUlNBIERhdGEgU2VjdXJpdHksIEluYy4gTUQ1IE1lc3NhZ2VcbiAqIERpZ2VzdCBBbGdvcml0aG0sIGFzIGRlZmluZWQgaW4gUkZDIDEzMjEuXG4gKiBWZXJzaW9uIDIuMSBDb3B5cmlnaHQgKEMpIFBhdWwgSm9obnN0b24gMTk5OSAtIDIwMDIuXG4gKiBPdGhlciBjb250cmlidXRvcnM6IEdyZWcgSG9sdCwgQW5kcmV3IEtlcGVydCwgWWRuYXIsIExvc3RpbmV0XG4gKiBEaXN0cmlidXRlZCB1bmRlciB0aGUgQlNEIExpY2Vuc2VcbiAqIFNlZSBodHRwOi8vcGFqaG9tZS5vcmcudWsvY3J5cHQvbWQ1IGZvciBtb3JlIGluZm8uXG4gKi9cblxudmFyIGhleGNhc2UgPSAwO1xudmFyIGI2NHBhZCAgPSBcIlwiO1xudmFyIGNocnN6ID0gODtcblxuZnVuY3Rpb24gaGV4X21kNShzKSB7XG4gICAgcmV0dXJuIGJpbmwyaGV4KGNvcmVfbWQ1KHN0cjJiaW5sKHMpLCBzLmxlbmd0aCAqIGNocnN6KSk7XG59XG5cbmZ1bmN0aW9uIGNvcmVfbWQ1KHgsIGxlbikge1xuICAgIHhbbGVuID4+IDVdIHw9IDB4ODAgPDwgKChsZW4pICUgMzIpO1xuICAgIHhbKCgobGVuICsgNjQpID4+PiA5KSA8PCA0KSArIDE0XSA9IGxlbjtcbiAgICB2YXIgYSA9IDE3MzI1ODQxOTM7XG4gICAgdmFyIGIgPSAtMjcxNzMzODc5O1xuICAgIHZhciBjID0gLTE3MzI1ODQxOTQ7XG4gICAgdmFyIGQgPSAyNzE3MzM4Nzg7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB4Lmxlbmd0aDsgaSArPSAxNikge1xuICAgICAgICB2YXIgb2xkYSA9IGE7XG4gICAgICAgIHZhciBvbGRiID0gYjtcbiAgICAgICAgdmFyIG9sZGMgPSBjO1xuICAgICAgICB2YXIgb2xkZCA9IGQ7XG5cbiAgICAgICAgYSA9IG1kNV9mZihhLCBiLCBjLCBkLCB4W2kgKyAwXSwgNywgLTY4MDg3NjkzNik7XG4gICAgICAgIGQgPSBtZDVfZmYoZCwgYSwgYiwgYywgeFtpICsgMV0sIDEyLCAtMzg5NTY0NTg2KTtcbiAgICAgICAgYyA9IG1kNV9mZihjLCBkLCBhLCBiLCB4W2kgKyAyXSwgMTcsIDYwNjEwNTgxOSk7XG4gICAgICAgIGIgPSBtZDVfZmYoYiwgYywgZCwgYSwgeFtpICsgM10sIDIyLCAtMTA0NDUyNTMzMCk7XG4gICAgICAgIGEgPSBtZDVfZmYoYSwgYiwgYywgZCwgeFtpICsgNF0sIDcsIC0xNzY0MTg4OTcpO1xuICAgICAgICBkID0gbWQ1X2ZmKGQsIGEsIGIsIGMsIHhbaSArIDVdLCAxMiwgMTIwMDA4MDQyNik7XG4gICAgICAgIGMgPSBtZDVfZmYoYywgZCwgYSwgYiwgeFtpICsgNl0sIDE3LCAtMTQ3MzIzMTM0MSk7XG4gICAgICAgIGIgPSBtZDVfZmYoYiwgYywgZCwgYSwgeFtpICsgN10sIDIyLCAtNDU3MDU5ODMpO1xuICAgICAgICBhID0gbWQ1X2ZmKGEsIGIsIGMsIGQsIHhbaSArIDhdLCA3LCAxNzcwMDM1NDE2KTtcbiAgICAgICAgZCA9IG1kNV9mZihkLCBhLCBiLCBjLCB4W2kgKyA5XSwgMTIsIC0xOTU4NDE0NDE3KTtcbiAgICAgICAgYyA9IG1kNV9mZihjLCBkLCBhLCBiLCB4W2kgKyAxMF0sIDE3LCAtNDIwNjMpO1xuICAgICAgICBiID0gbWQ1X2ZmKGIsIGMsIGQsIGEsIHhbaSArIDExXSwgMjIsIC0xOTkwNDA0MTYyKTtcbiAgICAgICAgYSA9IG1kNV9mZihhLCBiLCBjLCBkLCB4W2kgKyAxMl0sIDcsIDE4MDQ2MDM2ODIpO1xuICAgICAgICBkID0gbWQ1X2ZmKGQsIGEsIGIsIGMsIHhbaSArIDEzXSwgMTIsIC00MDM0MTEwMSk7XG4gICAgICAgIGMgPSBtZDVfZmYoYywgZCwgYSwgYiwgeFtpICsgMTRdLCAxNywgLTE1MDIwMDIyOTApO1xuICAgICAgICBiID0gbWQ1X2ZmKGIsIGMsIGQsIGEsIHhbaSArIDE1XSwgMjIsIDEyMzY1MzUzMjkpO1xuXG4gICAgICAgIGEgPSBtZDVfZ2coYSwgYiwgYywgZCwgeFtpICsgMV0sIDUsIC0xNjU3OTY1MTApO1xuICAgICAgICBkID0gbWQ1X2dnKGQsIGEsIGIsIGMsIHhbaSArIDZdLCA5LCAtMTA2OTUwMTYzMik7XG4gICAgICAgIGMgPSBtZDVfZ2coYywgZCwgYSwgYiwgeFtpICsgMTFdLCAxNCwgNjQzNzE3NzEzKTtcbiAgICAgICAgYiA9IG1kNV9nZyhiLCBjLCBkLCBhLCB4W2kgKyAwXSwgMjAsIC0zNzM4OTczMDIpO1xuICAgICAgICBhID0gbWQ1X2dnKGEsIGIsIGMsIGQsIHhbaSArIDVdLCA1LCAtNzAxNTU4NjkxKTtcbiAgICAgICAgZCA9IG1kNV9nZyhkLCBhLCBiLCBjLCB4W2kgKyAxMF0sIDksIDM4MDE2MDgzKTtcbiAgICAgICAgYyA9IG1kNV9nZyhjLCBkLCBhLCBiLCB4W2kgKyAxNV0sIDE0LCAtNjYwNDc4MzM1KTtcbiAgICAgICAgYiA9IG1kNV9nZyhiLCBjLCBkLCBhLCB4W2kgKyA0XSwgMjAsIC00MDU1Mzc4NDgpO1xuICAgICAgICBhID0gbWQ1X2dnKGEsIGIsIGMsIGQsIHhbaSArIDldLCA1LCA1Njg0NDY0MzgpO1xuICAgICAgICBkID0gbWQ1X2dnKGQsIGEsIGIsIGMsIHhbaSArIDE0XSwgOSwgLTEwMTk4MDM2OTApO1xuICAgICAgICBjID0gbWQ1X2dnKGMsIGQsIGEsIGIsIHhbaSArIDNdLCAxNCwgLTE4NzM2Mzk2MSk7XG4gICAgICAgIGIgPSBtZDVfZ2coYiwgYywgZCwgYSwgeFtpICsgOF0sIDIwLCAxMTYzNTMxNTAxKTtcbiAgICAgICAgYSA9IG1kNV9nZyhhLCBiLCBjLCBkLCB4W2kgKyAxM10sIDUsIC0xNDQ0NjgxNDY3KTtcbiAgICAgICAgZCA9IG1kNV9nZyhkLCBhLCBiLCBjLCB4W2kgKyAyXSwgOSwgLTUxNDAzNzg0KTtcbiAgICAgICAgYyA9IG1kNV9nZyhjLCBkLCBhLCBiLCB4W2kgKyA3XSwgMTQsIDE3MzUzMjg0NzMpO1xuICAgICAgICBiID0gbWQ1X2dnKGIsIGMsIGQsIGEsIHhbaSArIDEyXSwgMjAsIC0xOTI2NjA3NzM0KTtcblxuICAgICAgICBhID0gbWQ1X2hoKGEsIGIsIGMsIGQsIHhbaSArIDVdLCA0LCAtMzc4NTU4KTtcbiAgICAgICAgZCA9IG1kNV9oaChkLCBhLCBiLCBjLCB4W2kgKyA4XSwgMTEsIC0yMDIyNTc0NDYzKTtcbiAgICAgICAgYyA9IG1kNV9oaChjLCBkLCBhLCBiLCB4W2kgKyAxMV0sIDE2LCAxODM5MDMwNTYyKTtcbiAgICAgICAgYiA9IG1kNV9oaChiLCBjLCBkLCBhLCB4W2kgKyAxNF0sIDIzLCAtMzUzMDk1NTYpO1xuICAgICAgICBhID0gbWQ1X2hoKGEsIGIsIGMsIGQsIHhbaSArIDFdLCA0LCAtMTUzMDk5MjA2MCk7XG4gICAgICAgIGQgPSBtZDVfaGgoZCwgYSwgYiwgYywgeFtpICsgNF0sIDExLCAxMjcyODkzMzUzKTtcbiAgICAgICAgYyA9IG1kNV9oaChjLCBkLCBhLCBiLCB4W2kgKyA3XSwgMTYsIC0xNTU0OTc2MzIpO1xuICAgICAgICBiID0gbWQ1X2hoKGIsIGMsIGQsIGEsIHhbaSArIDEwXSwgMjMsIC0xMDk0NzMwNjQwKTtcbiAgICAgICAgYSA9IG1kNV9oaChhLCBiLCBjLCBkLCB4W2kgKyAxM10sIDQsIDY4MTI3OTE3NCk7XG4gICAgICAgIGQgPSBtZDVfaGgoZCwgYSwgYiwgYywgeFtpICsgMF0sIDExLCAtMzU4NTM3MjIyKTtcbiAgICAgICAgYyA9IG1kNV9oaChjLCBkLCBhLCBiLCB4W2kgKyAzXSwgMTYsIC03MjI1MjE5NzkpO1xuICAgICAgICBiID0gbWQ1X2hoKGIsIGMsIGQsIGEsIHhbaSArIDZdLCAyMywgNzYwMjkxODkpO1xuICAgICAgICBhID0gbWQ1X2hoKGEsIGIsIGMsIGQsIHhbaSArIDldLCA0LCAtNjQwMzY0NDg3KTtcbiAgICAgICAgZCA9IG1kNV9oaChkLCBhLCBiLCBjLCB4W2kgKyAxMl0sIDExLCAtNDIxODE1ODM1KTtcbiAgICAgICAgYyA9IG1kNV9oaChjLCBkLCBhLCBiLCB4W2kgKyAxNV0sIDE2LCA1MzA3NDI1MjApO1xuICAgICAgICBiID0gbWQ1X2hoKGIsIGMsIGQsIGEsIHhbaSArIDJdLCAyMywgLTk5NTMzODY1MSk7XG5cbiAgICAgICAgYSA9IG1kNV9paShhLCBiLCBjLCBkLCB4W2kgKyAwXSwgNiwgLTE5ODYzMDg0NCk7XG4gICAgICAgIGQgPSBtZDVfaWkoZCwgYSwgYiwgYywgeFtpICsgN10sIDEwLCAxMTI2ODkxNDE1KTtcbiAgICAgICAgYyA9IG1kNV9paShjLCBkLCBhLCBiLCB4W2kgKyAxNF0sIDE1LCAtMTQxNjM1NDkwNSk7XG4gICAgICAgIGIgPSBtZDVfaWkoYiwgYywgZCwgYSwgeFtpICsgNV0sIDIxLCAtNTc0MzQwNTUpO1xuICAgICAgICBhID0gbWQ1X2lpKGEsIGIsIGMsIGQsIHhbaSArIDEyXSwgNiwgMTcwMDQ4NTU3MSk7XG4gICAgICAgIGQgPSBtZDVfaWkoZCwgYSwgYiwgYywgeFtpICsgM10sIDEwLCAtMTg5NDk4NjYwNik7XG4gICAgICAgIGMgPSBtZDVfaWkoYywgZCwgYSwgYiwgeFtpICsgMTBdLCAxNSwgLTEwNTE1MjMpO1xuICAgICAgICBiID0gbWQ1X2lpKGIsIGMsIGQsIGEsIHhbaSArIDFdLCAyMSwgLTIwNTQ5MjI3OTkpO1xuICAgICAgICBhID0gbWQ1X2lpKGEsIGIsIGMsIGQsIHhbaSArIDhdLCA2LCAxODczMzEzMzU5KTtcbiAgICAgICAgZCA9IG1kNV9paShkLCBhLCBiLCBjLCB4W2kgKyAxNV0sIDEwLCAtMzA2MTE3NDQpO1xuICAgICAgICBjID0gbWQ1X2lpKGMsIGQsIGEsIGIsIHhbaSArIDZdLCAxNSwgLTE1NjAxOTgzODApO1xuICAgICAgICBiID0gbWQ1X2lpKGIsIGMsIGQsIGEsIHhbaSArIDEzXSwgMjEsIDEzMDkxNTE2NDkpO1xuICAgICAgICBhID0gbWQ1X2lpKGEsIGIsIGMsIGQsIHhbaSArIDRdLCA2LCAtMTQ1NTIzMDcwKTtcbiAgICAgICAgZCA9IG1kNV9paShkLCBhLCBiLCBjLCB4W2kgKyAxMV0sIDEwLCAtMTEyMDIxMDM3OSk7XG4gICAgICAgIGMgPSBtZDVfaWkoYywgZCwgYSwgYiwgeFtpICsgMl0sIDE1LCA3MTg3ODcyNTkpO1xuICAgICAgICBiID0gbWQ1X2lpKGIsIGMsIGQsIGEsIHhbaSArIDldLCAyMSwgLTM0MzQ4NTU1MSk7XG5cbiAgICAgICAgYSA9IHNhZmVfYWRkKGEsIG9sZGEpO1xuICAgICAgICBiID0gc2FmZV9hZGQoYiwgb2xkYik7XG4gICAgICAgIGMgPSBzYWZlX2FkZChjLCBvbGRjKTtcbiAgICAgICAgZCA9IHNhZmVfYWRkKGQsIG9sZGQpO1xuICAgIH1cbiAgICByZXR1cm4gW2EsIGIsIGMsIGRdO1xufVxuXG5mdW5jdGlvbiBtZDVfY21uKHEsIGEsIGIsIHgsIHMsIHQpIHtcbiAgICByZXR1cm4gc2FmZV9hZGQoYml0X3JvbChzYWZlX2FkZChzYWZlX2FkZChhLCBxKSwgc2FmZV9hZGQoeCwgdCkpLCBzKSwgYik7XG59XG5cbmZ1bmN0aW9uIG1kNV9mZihhLCBiLCBjLCBkLCB4LCBzLCB0KSB7XG4gICAgcmV0dXJuIG1kNV9jbW4oKGIgJiBjKSB8ICgofmIpICYgZCksIGEsIGIsIHgsIHMsIHQpO1xufVxuXG5mdW5jdGlvbiBtZDVfZ2coYSwgYiwgYywgZCwgeCwgcywgdCkge1xuICAgIHJldHVybiBtZDVfY21uKChiICYgZCkgfCAoYyAmICh+ZCkpLCBhLCBiLCB4LCBzLCB0KTtcbn1cblxuZnVuY3Rpb24gbWQ1X2hoKGEsIGIsIGMsIGQsIHgsIHMsIHQpIHtcbiAgICByZXR1cm4gbWQ1X2NtbihiIF4gYyBeIGQsIGEsIGIsIHgsIHMsIHQpO1xufVxuXG5mdW5jdGlvbiBtZDVfaWkoYSwgYiwgYywgZCwgeCwgcywgdCkge1xuICAgIHJldHVybiBtZDVfY21uKGMgXiAoYiB8ICh+ZCkpLCBhLCBiLCB4LCBzLCB0KTtcbn1cblxuZnVuY3Rpb24gc2FmZV9hZGQoeCwgeSkge1xuICAgIHZhciBsc3cgPSAoeCAmIDB4RkZGRikgKyAoeSAmIDB4RkZGRik7XG4gICAgdmFyIG1zdyA9ICh4ID4+IDE2KSArICh5ID4+IDE2KSArIChsc3cgPj4gMTYpO1xuICAgIHJldHVybiAobXN3IDw8IDE2KSB8IChsc3cgJiAweEZGRkYpO1xufVxuXG5mdW5jdGlvbiBiaXRfcm9sKG51bSwgY250KSB7XG4gICAgcmV0dXJuIChudW0gPDwgY250KSB8IChudW0gPj4+ICgzMiAtIGNudCkpO1xufVxuXG5mdW5jdGlvbiBzdHIyYmlubChzdHIpIHtcbiAgICB2YXIgYmluID0gW107XG4gICAgdmFyIG1hc2sgPSAoMSA8PCBjaHJzeikgLSAxO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyLmxlbmd0aCAqIGNocnN6OyBpICs9IGNocnN6KSB7XG4gICAgICAgIGJpbltpID4+IDVdIHw9IChzdHIuY2hhckNvZGVBdChpIC8gY2hyc3opICYgbWFzaykgPDwgKGkgJSAzMik7XG4gICAgfVxuICAgIHJldHVybiBiaW47XG59XG5cbmZ1bmN0aW9uIGJpbmwyaGV4KGJpbmFycmF5KSB7XG4gICAgdmFyIGhleF90YWIgPSBoZXhjYXNlID8gXCIwMTIzNDU2Nzg5QUJDREVGXCIgOiBcIjAxMjM0NTY3ODlhYmNkZWZcIjtcbiAgICB2YXIgc3RyID0gXCJcIjtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGJpbmFycmF5Lmxlbmd0aCAqIDQ7IGkrKykge1xuICAgICAgICBzdHIgKz0gaGV4X3RhYi5jaGFyQXQoKGJpbmFycmF5W2kgPj4gMl0gPj4gKChpICUgNCkgKiA4ICsgNCkpICYgMHhGKSArIGhleF90YWIuY2hhckF0KChiaW5hcnJheVtpID4+IDJdID4+ICgoaSAlIDQpICogOCkpICYgMHhGKTtcbiAgICB9XG4gICAgcmV0dXJuIHN0cjtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGhleF9tZDU6IGhleF9tZDVcbn07IiwiLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgICdzdW1tYXJ5X3dpZGdldF9fcmVhY3Rpb25zJzogJ1JlYWN0aW9ucycsXG4gICAgJ3N1bW1hcnlfd2lkZ2V0X19yZWFjdGlvbnNfb25lJzogJzEgUmVhY3Rpb24nLFxuICAgICdzdW1tYXJ5X3dpZGdldF9fcmVhY3Rpb25zX21hbnknOiAnezB9IFJlYWN0aW9ucycsXG5cbiAgICAncmVhY3Rpb25zX3dpZGdldF9fdGl0bGUnOiAnUmVhY3Rpb25zJyxcbiAgICAncmVhY3Rpb25zX3dpZGdldF9fdGl0bGVfdGhhbmtzJzogJ1RoYW5rcyBmb3IgeW91ciByZWFjdGlvbiEnLFxuICAgICdyZWFjdGlvbnNfd2lkZ2V0X190aXRsZV9zaWduaW4nOiAnU2lnbiBpbiBSZXF1aXJlZCcsXG4gICAgJ3JlYWN0aW9uc193aWRnZXRfX3RpdGxlX2Jsb2NrZWQnOiAnQmxvY2tlZCBSZWFjdGlvbicsXG4gICAgJ3JlYWN0aW9uc193aWRnZXRfX3RpdGxlX2Vycm9yJzogJ0Vycm9yJyxcbiAgICAncmVhY3Rpb25zX3dpZGdldF9fYmFjayc6ICdCYWNrJyxcblxuICAgICdtZWRpYV9pbmRpY2F0b3JfX3RoaW5rJzogJ1doYXQgZG8geW91IHRoaW5rPycsXG5cbiAgICAncG9wdXBfd2lkZ2V0X190aGluayc6ICdXaGF0IGRvIHlvdSB0aGluaz8nLFxuXG4gICAgJ3JlYWN0aW9uc19wYWdlX19hZGQnOiAnKyBBZGQgWW91ciBPd24nLFxuICAgICdyZWFjdGlvbnNfcGFnZV9fb2snOiAnb2snLFxuXG4gICAgJ2NvbmZpcm1hdGlvbl9wYWdlX19zaGFyZSc6ICdTaGFyZSB5b3VyIHJlYWN0aW9uOicsXG5cbiAgICAnY29tbWVudHNfcGFnZV9faGVhZGVyJzogJyh7MH0pIENvbW1lbnRzOicsXG5cbiAgICAnY29tbWVudF9hcmVhX19hZGQnOiAnQ29tbWVudCcsXG4gICAgJ2NvbW1lbnRfYXJlYV9fcGxhY2Vob2xkZXInOiAnQWRkIGNvbW1lbnRzIG9yICNoYXNodGFncycsXG4gICAgJ2NvbW1lbnRfYXJlYV9fdGhhbmtzJzogJ1RoYW5rcyBmb3IgeW91ciBjb21tZW50LicsXG4gICAgJ2NvbW1lbnRfYXJlYV9fY291bnQnOiAnPHNwYW4gY2xhc3M9XCJhbnRlbm5hLWNvbW1lbnQtY291bnRcIj48L3NwYW4+IGNoYXJhY3RlcnMgbGVmdCcsXG5cbiAgICAnbG9jYXRpb25zX3BhZ2VfX3BhZ2VsZXZlbCc6ICdUbyB0aGlzIHdob2xlIHBhZ2UnLFxuICAgICdsb2NhdGlvbnNfcGFnZV9fY291bnRfb25lJzogJzxzcGFuIGNsYXNzPVwiYW50ZW5uYS1sb2NhdGlvbi1jb3VudFwiPjE8L3NwYW4+PGJyPnJlYWN0aW9uJyxcbiAgICAnbG9jYXRpb25zX3BhZ2VfX2NvdW50X21hbnknOiAnPHNwYW4gY2xhc3M9XCJhbnRlbm5hLWxvY2F0aW9uLWNvdW50XCI+ezB9PC9zcGFuPjxicj5yZWFjdGlvbnMnLFxuICAgICdsb2NhdGlvbnNfcGFnZV9fdmlkZW8nOiAnVmlkZW8nLFxuXG4gICAgJ2NhbGxfdG9fYWN0aW9uX2xhYmVsX19yZXNwb25zZXMnOiAnUmVhY3Rpb25zJyxcbiAgICAnY2FsbF90b19hY3Rpb25fbGFiZWxfX3Jlc3BvbnNlc19vbmUnOiAnMSBSZWFjdGlvbicsXG4gICAgJ2NhbGxfdG9fYWN0aW9uX2xhYmVsX19yZXNwb25zZXNfbWFueSc6ICd7MH0gUmVhY3Rpb25zJyxcblxuICAgICdibG9ja2VkX3BhZ2VfX21lc3NhZ2UxJzogJ1RoaXMgc2l0ZSBoYXMgYmxvY2tlZCBzb21lIG9yIGFsbCBvZiB0aGUgdGV4dCBpbiB0aGF0IHJlYWN0aW9uLicsXG4gICAgJ2Jsb2NrZWRfcGFnZV9fbWVzc2FnZTInOiAnUGxlYXNlIHRyeSBzb21ldGhpbmcgdGhhdCB3aWxsIGJlIG1vcmUgYXBwcm9wcmlhdGUgZm9yIHRoaXMgY29tbXVuaXR5LicsXG5cbiAgICAncGVuZGluZ19wYWdlX19tZXNzYWdlX2FwcGVhcic6ICdZb3VyIHJlYWN0aW9uIHdpbGwgYXBwZWFyIG9uY2UgaXQgaXMgcmV2aWV3ZWQuIEFsbCBuZXcgcmVhY3Rpb25zIG11c3QgbWVldCBvdXIgY29tbXVuaXR5IGd1aWRlbGluZXMuJyxcblxuICAgICdlcnJvcl9wYWdlX19tZXNzYWdlJzogJ09vcHMhIFdlIHJlYWxseSB2YWx1ZSB5b3VyIGZlZWRiYWNrLCBidXQgc29tZXRoaW5nIHdlbnQgd3JvbmcuJyxcblxuICAgICd0YXBfaGVscGVyX19wcm9tcHQnOiAnVGFwIGFueSBwYXJhZ3JhcGggdG8gcmVzcG9uZCEnLFxuICAgICd0YXBfaGVscGVyX19jbG9zZSc6ICdDbG9zZScsXG5cbiAgICAnY29udGVudF9yZWNfd2lkZ2V0X190aXRsZSc6ICdSZWFkZXIgUmVhY3Rpb25zJyxcblxuICAgICdsb2dpbl9wYWdlX19tZXNzYWdlXzEnOiAnPHNwYW4gY2xhc3M9XCJhbnRlbm5hLWxvZ2luLWdyb3VwXCI+ezB9PC9zcGFuPiB1c2VzIDxhIGhyZWY9XCJodHRwOi8vd3d3LmFudGVubmEuaXMvXCIgdGFyZ2V0PVwiX2JsYW5rXCI+QW50ZW5uYTwvYT4gc28geW91IGNhbiByZWFjdCB0byBjb250ZW50IGVhc2lseSBhbmQgc2FmZWx5LicsXG4gICAgJ2xvZ2luX3BhZ2VfX21lc3NhZ2VfMic6ICdUbyBrZWVwIHBhcnRpY2lwYXRpbmcsIGp1c3QgbG9nIGluOicsXG4gICAgJ2xvZ2luX3BhZ2VfX3ByaXZhY3knOiAnQW50ZW5uYSB2YWx1ZXMgeW91ciBwcml2YWN5LiA8YSBocmVmPVwiaHR0cDovL3d3dy5hbnRlbm5hLmlzL2ZhcS9cIiB0YXJnZXQ9XCJfYmxhbmtcIj5MZWFybiBtb3JlPC9hPi4nLFxuICAgICdsb2dpbl9wYWdlX19wZW5kaW5nX3ByZSc6ICdZb3UgbWlnaHQgbmVlZCB0byAnLFxuICAgICdsb2dpbl9wYWdlX19wZW5kaW5nX2NsaWNrJzogJ2NsaWNrIGhlcmUnLFxuICAgICdsb2dpbl9wYWdlX19wZW5kaW5nX3Bvc3QnOiAnIG9uY2UgeW91XFwndmUgbG9nZ2VkIGluLidcbn07IiwiLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgICdzdW1tYXJ5X3dpZGdldF9fcmVhY3Rpb25zJzogJ1JlYWNjaW9uZXMnLFxuICAgICdzdW1tYXJ5X3dpZGdldF9fcmVhY3Rpb25zX29uZSc6ICcxIFJlYWNjacOzbicsXG4gICAgJ3N1bW1hcnlfd2lkZ2V0X19yZWFjdGlvbnNfbWFueSc6ICd7MH0gUmVhY2Npb25lcycsXG5cbiAgICAncmVhY3Rpb25zX3dpZGdldF9fdGl0bGUnOiAnUmVhY2Npb25lcycsXG4gICAgJ3JlYWN0aW9uc193aWRnZXRfX3RpdGxlX3RoYW5rcyc6ICfCoUdyYWNpYXMgcG9yIHR1IHJlYWNjacOzbiEnLFxuICAgICdyZWFjdGlvbnNfd2lkZ2V0X190aXRsZV9zaWduaW4nOiAnRXMgbmVjZXNhcmlvIGluaWNpYXIgc2VzacOzbicsIC8vIFRPRE86IGNoZWNrIHRyYW5zbGF0aW9uXG4gICAgJ3JlYWN0aW9uc193aWRnZXRfX3RpdGxlX2Jsb2NrZWQnOiAnUmVhY2Npw7NuIGJsb3F1ZWFkbycsIC8vIFRPRE86IGNoZWNrIHRyYW5zbGF0aW9uXG4gICAgJ3JlYWN0aW9uc193aWRnZXRfX3RpdGxlX2Vycm9yJzogJ0Vycm9yJywgLy8gVE9ETzogY2hlY2sgdHJhbnNsYXRpb25cbiAgICAncmVhY3Rpb25zX3dpZGdldF9fYmFjayc6ICdWb2x2ZXInLFxuXG4gICAgJ21lZGlhX2luZGljYXRvcl9fdGhpbmsnOiAnwr9RdcOpIHBpZW5zYXM/JyxcblxuICAgICdwb3B1cF93aWRnZXRfX3RoaW5rJzogJ8K/UXXDqSBwaWVuc2FzPycsXG5cbiAgICAncmVhY3Rpb25zX3BhZ2VfX2FkZCc6ICcrIEHDsWFkZSBsbyB0dXlvJyxcbiAgICAncmVhY3Rpb25zX3BhZ2VfX29rJzogJ29rJyxcblxuICAgICdjb25maXJtYXRpb25fcGFnZV9fc2hhcmUnOiAnQ29tcGFydGUgdHUgcmVhY2Npw7NuOicsXG5cbiAgICAnY29tbWVudHNfcGFnZV9faGVhZGVyJzogJyh7MH0pIENvbWVudGFzOicsXG5cbiAgICAnY29tbWVudF9hcmVhX19hZGQnOiAnQ29tZW50YScsXG4gICAgJ2NvbW1lbnRfYXJlYV9fcGxhY2Vob2xkZXInOiAnQcOxYWRlIGNvbWVudGFyaW9zIG8gI2hhc2h0YWdzJyxcbiAgICAnY29tbWVudF9hcmVhX190aGFua3MnOiAnR3JhY2lhcyBwb3IgdHUgcmVhY2Npw7NuLicsXG4gICAgJ2NvbW1lbnRfYXJlYV9fY291bnQnOiAnUXVlZGFuIDxzcGFuIGNsYXNzPVwiYW50ZW5uYS1jb21tZW50LWNvdW50XCI+PC9zcGFuPiBjYXJhY3RlcmVzJyxcblxuICAgICdsb2NhdGlvbnNfcGFnZV9fcGFnZWxldmVsJzogJ0EgZXN0YSBww6FnaW5hJywgLy8gVE9ETzogbmVlZCBhIHRyYW5zbGF0aW9uIG9mIFwiVG8gdGhpcyB3aG9sZSBwYWdlXCJcbiAgICAnbG9jYXRpb25zX3BhZ2VfX2NvdW50X29uZSc6ICc8c3BhbiBjbGFzcz1cImFudGVubmEtbG9jYXRpb24tY291bnRcIj4xPC9zcGFuPjxicj5yZWFjY2nDs24nLFxuICAgICdsb2NhdGlvbnNfcGFnZV9fY291bnRfbWFueSc6ICc8c3BhbiBjbGFzcz1cImFudGVubmEtbG9jYXRpb24tY291bnRcIj57MH08L3NwYW4+PGJyPnJlYWNjaW9uZXMnLFxuICAgICdsb2NhdGlvbnNfcGFnZV9fdmlkZW8nOiAnVmlkZW8nLFxuXG4gICAgJ2NhbGxfdG9fYWN0aW9uX2xhYmVsX19yZXNwb25zZXMnOiAnUmVhY2Npb25lcycsXG4gICAgJ2NhbGxfdG9fYWN0aW9uX2xhYmVsX19yZXNwb25zZXNfb25lJzogJzEgUmVhY2Npw7NuJyxcbiAgICAnY2FsbF90b19hY3Rpb25fbGFiZWxfX3Jlc3BvbnNlc19tYW55JzogJ3swfSBSZWFjY2lvbmVzJyxcblxuICAgICdibG9ja2VkX3BhZ2VfX21lc3NhZ2UxJzogJ0VzdGUgc2l0aW8gd2ViIGhhIGJsb3F1ZWFkbyBlc2EgcmVhY2Npw7NuLicsIC8vIFRPRE86IGNoZWNrIHRyYW5zbGF0aW9uXG4gICAgJ2Jsb2NrZWRfcGFnZV9fbWVzc2FnZTInOiAnUG9yIGZhdm9yLCBpbnRlbnRlIGFsZ28gcXVlIHNlcsOhIG3DoXMgYXByb3BpYWRvIHBhcmEgZXN0YSBjb211bmlkYWQuJywgLy8gVE9ETzogY2hlY2sgdHJhbnNsYXRpb25cbiAgICAncGVuZGluZ19wYWdlX19tZXNzYWdlX2FwcGVhcic6ICdBcGFyZWNlcsOhIHN1IHJlYWNjacOzbiB1bmEgdmV6IHF1ZSBzZSByZXZpc2EuIFRvZGFzIGxhcyBudWV2YXMgcmVhY2Npb25lcyBkZWJlbiBjdW1wbGlyIGNvbiBub3JtYXMgZGUgbGEgY29tdW5pZGFkLicsIC8vIFRPRE86IGNoZWNrIHRyYW5zbGF0aW9uXG4gICAgJ2Vycm9yX3BhZ2VfX21lc3NhZ2UnOiAnwqFMbyBzaWVudG8hIFZhbG9yYW1vcyBzdXMgY29tZW50YXJpb3MsIHBlcm8gYWxnbyBzYWxpw7MgbWFsLicsIC8vIFRPRE86IGNoZWNrIHRyYW5zbGF0aW9uXG4gICAgJ3RhcF9oZWxwZXJfX3Byb21wdCc6ICfCoVRvY2EgdW4gcMOhcnJhZm8gcGFyYSBvcGluYXIhJyxcbiAgICAndGFwX2hlbHBlcl9fY2xvc2UnOiAnVm9sdmVyJyxcbiAgICAnY29udGVudF9yZWNfd2lkZ2V0X190aXRsZSc6ICdSZWFjY2lvbmVzIGRlIGxhIGdlbnRlJyAvLyBUT0RPOiBjaGVjayB0cmFuc2xhdGlvblxufTsiLCJ2YXIgQXBwTW9kZSA9IHJlcXVpcmUoJy4vYXBwLW1vZGUnKTtcbnZhciBHcm91cFNldHRpbmdzID0gcmVxdWlyZSgnLi4vZ3JvdXAtc2V0dGluZ3MnKTtcblxudmFyIEVuZ2xpc2hNZXNzYWdlcyA9IHJlcXVpcmUoJy4vbWVzc2FnZXMtZW4nKTtcbnZhciBTcGFuaXNoTWVzc2FnZXMgPSByZXF1aXJlKCcuL21lc3NhZ2VzLWVzJyk7XG52YWxpZGF0ZVRyYW5zbGF0aW9ucygpO1xuXG5mdW5jdGlvbiB2YWxpZGF0ZVRyYW5zbGF0aW9ucygpIHtcbiAgICBmb3IgKHZhciBlbmdsaXNoS2V5IGluIEVuZ2xpc2hNZXNzYWdlcykge1xuICAgICAgICBpZiAoRW5nbGlzaE1lc3NhZ2VzLmhhc093blByb3BlcnR5KGVuZ2xpc2hLZXkpKSB7XG4gICAgICAgICAgICBpZiAoIVNwYW5pc2hNZXNzYWdlcy5oYXNPd25Qcm9wZXJ0eShlbmdsaXNoS2V5KSkge1xuICAgICAgICAgICAgICAgIGlmIChBcHBNb2RlLm9mZmxpbmUgfHwgQXBwTW9kZS5kZWJ1Zykge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdBbnRlbm5hIHdhcm5pbmc6IFNwYW5pc2ggdHJhbnNsYXRpb24gbWlzc2luZyBmb3Iga2V5ICcgKyBlbmdsaXNoS2V5KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGdldE1lc3NhZ2Uoa2V5LCB2YWx1ZXMpIHtcbiAgICB2YXIgc3RyaW5nID0gZ2V0TG9jYWxpemVkU3RyaW5nKGtleSwgR3JvdXBTZXR0aW5ncy5nZXQoKS5sYW5ndWFnZSgpKTtcbiAgICBpZiAodmFsdWVzKSB7XG4gICAgICAgIHJldHVybiBmb3JtYXQoc3RyaW5nLCB2YWx1ZXMpO1xuICAgIH1cbiAgICByZXR1cm4gc3RyaW5nO1xufVxuXG5mdW5jdGlvbiBnZXRMb2NhbGl6ZWRTdHJpbmcoa2V5LCBsYW5nKSB7XG4gICAgdmFyIHN0cmluZztcbiAgICBzd2l0Y2gobGFuZykge1xuICAgICAgICBjYXNlICdlbic6XG4gICAgICAgICAgICBzdHJpbmcgPSBFbmdsaXNoTWVzc2FnZXNba2V5XTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdlcyc6XG4gICAgICAgICAgICBzdHJpbmcgPSBTcGFuaXNoTWVzc2FnZXNba2V5XTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgLy8gVE9ETzogcmV2aWV3XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnSW52YWxpZCBsYW5ndWFnZSBzcGVjaWZpZWQgaW4gQW50ZW5uYSBncm91cCBzZXR0aW5ncy4nKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBpZiAoIXN0cmluZykgeyAvLyBEZWZhdWx0IHRvIEVuZ2xpc2hcbiAgICAgICAgc3RyaW5nID0gRW5nbGlzaE1lc3NhZ2VzW2tleV07XG4gICAgfVxuICAgIC8vIFRPRE86IGhhbmRsZSBtaXNzaW5nIGtleVxuICAgIHJldHVybiBzdHJpbmc7XG59XG5cbmZ1bmN0aW9uIGZvcm1hdChzdHJpbmcsIHZhbHVlcykge1xuICAgIC8vIFBvcHVsYXIsIHNpbXBsZSBhbGdvcml0aG0gZnJvbSBodHRwOi8vamF2YXNjcmlwdC5jcm9ja2ZvcmQuY29tL3JlbWVkaWFsLmh0bWxcbiAgICByZXR1cm4gc3RyaW5nLnJlcGxhY2UoXG4gICAgICAgIC9cXHsoW157fV0qKVxcfS9nLFxuICAgICAgICBmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICAgICAgdmFyIHIgPSB2YWx1ZXNbYl07XG4gICAgICAgICAgICByZXR1cm4gdHlwZW9mIHIgPT09ICdzdHJpbmcnIHx8IHR5cGVvZiByID09PSAnbnVtYmVyJyA/IHIgOiBhO1xuICAgICAgICB9XG4gICAgKTtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGdldE1lc3NhZ2U6IGdldE1lc3NhZ2Vcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG5cbmZ1bmN0aW9uIG1ha2VNb3ZlYWJsZSgkZWxlbWVudCwgJGRyYWdIYW5kbGUpIHtcbiAgICAkZHJhZ0hhbmRsZS5vbignbW91c2Vkb3duLmFudGVubmEnLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICB2YXIgb2Zmc2V0WCA9IGV2ZW50LnBhZ2VYIC0gJGRyYWdIYW5kbGUub2Zmc2V0KCkubGVmdDtcbiAgICAgICAgdmFyIG9mZnNldFkgPSBldmVudC5wYWdlWSAtICRkcmFnSGFuZGxlLm9mZnNldCgpLnRvcDtcbiAgICAgICAgJChkb2N1bWVudCkub24oJ21vdXNldXAuYW50ZW5uYScsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICAkKGRvY3VtZW50KS5vZmYoJ21vdXNlbW92ZS5hbnRlbm5hJyk7XG4gICAgICAgIH0pO1xuICAgICAgICAkKGRvY3VtZW50KS5vbignbW91c2Vtb3ZlLmFudGVubmEnLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgJGVsZW1lbnQuY3NzKHtcbiAgICAgICAgICAgICAgICB0b3A6IGV2ZW50LnBhZ2VZIC0gb2Zmc2V0WSxcbiAgICAgICAgICAgICAgICBsZWZ0OiBldmVudC5wYWdlWCAtIG9mZnNldFhcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgbWFrZU1vdmVhYmxlOiBtYWtlTW92ZWFibGVcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgQ2FsbGJhY2tTdXBwb3J0ID0gcmVxdWlyZSgnLi9jYWxsYmFjay1zdXBwb3J0Jyk7XG52YXIgUmFuZ2UgPSByZXF1aXJlKCcuL3JhbmdlJyk7XG52YXIgV2lkZ2V0QnVja2V0ID0gcmVxdWlyZSgnLi93aWRnZXQtYnVja2V0Jyk7XG5cbi8vIFRPRE86IGRldGVjdCB3aGV0aGVyIHRoZSBicm93c2VyIHN1cHBvcnRzIE11dGF0aW9uT2JzZXJ2ZXIgYW5kIGZhbGxiYWNrIHRvIE11dGF0aW9ucyBFdmVudHNcblxudmFyIGFkZGl0aW9uTGlzdGVuZXI7XG52YXIgcmVtb3ZhbExpc3RlbmVyO1xuXG52YXIgYXR0cmlidXRlT2JzZXJ2ZXJzID0gW107XG5cbmZ1bmN0aW9uIGFkZEFkZGl0aW9uTGlzdGVuZXIoY2FsbGJhY2spIHtcbiAgICBpZiAoIWFkZGl0aW9uTGlzdGVuZXIpIHtcbiAgICAgICAgYWRkaXRpb25MaXN0ZW5lciA9IGNyZWF0ZUFkZGl0aW9uTGlzdGVuZXIoKTtcbiAgICB9XG4gICAgYWRkaXRpb25MaXN0ZW5lci5hZGRDYWxsYmFjayhjYWxsYmFjayk7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUFkZGl0aW9uTGlzdGVuZXIoKSB7XG4gICAgdmFyIGNhbGxiYWNrU3VwcG9ydCA9IENhbGxiYWNrU3VwcG9ydC5jcmVhdGUoKTtcbiAgICB2YXIgb2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcihmdW5jdGlvbihtdXRhdGlvblJlY29yZHMpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtdXRhdGlvblJlY29yZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBhZGRlZEVsZW1lbnRzID0gZmlsdGVyZWRFbGVtZW50cyhtdXRhdGlvblJlY29yZHNbaV0uYWRkZWROb2Rlcyk7XG4gICAgICAgICAgICBpZiAoYWRkZWRFbGVtZW50cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNhbGxiYWNrcyA9IGNhbGxiYWNrU3VwcG9ydC5nZXQoKTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGNhbGxiYWNrcy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFja3Nbal0oYWRkZWRFbGVtZW50cyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG4gICAgdmFyIGJvZHkgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnYm9keScpWzBdO1xuICAgIG9ic2VydmVyLm9ic2VydmUoYm9keSwge1xuICAgICAgICBjaGlsZExpc3Q6IHRydWUsXG4gICAgICAgIGF0dHJpYnV0ZXM6IGZhbHNlLFxuICAgICAgICBjaGFyYWN0ZXJEYXRhOiBmYWxzZSxcbiAgICAgICAgc3VidHJlZTogdHJ1ZSxcbiAgICAgICAgYXR0cmlidXRlT2xkVmFsdWU6IGZhbHNlLFxuICAgICAgICBjaGFyYWN0ZXJEYXRhT2xkVmFsdWU6IGZhbHNlXG4gICAgfSk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdGVhcmRvd246IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY2FsbGJhY2tTdXBwb3J0LnRlYXJkb3duKCk7XG4gICAgICAgICAgICBvYnNlcnZlci5kaXNjb25uZWN0KCk7XG4gICAgICAgIH0sXG4gICAgICAgIGFkZENhbGxiYWNrOiBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICAgICAgY2FsbGJhY2tTdXBwb3J0LmFkZChjYWxsYmFjayk7XG4gICAgICAgIH0sXG4gICAgICAgIHJlbW92ZUNhbGxiYWNrOiBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICAgICAgY2FsbGJhY2tTdXBwb3J0LnJlbW92ZShjYWxsYmFjayk7XG4gICAgICAgIH1cbiAgICB9O1xufVxuXG5mdW5jdGlvbiBhZGRSZW1vdmFsTGlzdGVuZXIoY2FsbGJhY2spIHtcbiAgICBpZiAoIXJlbW92YWxMaXN0ZW5lcikge1xuICAgICAgICByZW1vdmFsTGlzdGVuZXIgPSBjcmVhdGVSZW1vdmFsTGlzdGVuZXIoKTtcbiAgICB9XG4gICAgcmVtb3ZhbExpc3RlbmVyLmFkZENhbGxiYWNrKGNhbGxiYWNrKTtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlUmVtb3ZhbExpc3RlbmVyKGNhbGxiYWNrKSB7XG4gICAgaWYgKHJlbW92YWxMaXN0ZW5lcikge1xuICAgICAgICByZW1vdmFsTGlzdGVuZXIucmVtb3ZlQ2FsbGJhY2soY2FsbGJhY2spO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gY3JlYXRlUmVtb3ZhbExpc3RlbmVyKCkge1xuICAgIHZhciBjYWxsYmFja1N1cHBvcnQgPSBDYWxsYmFja1N1cHBvcnQuY3JlYXRlKCk7XG4gICAgdmFyIG9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoZnVuY3Rpb24obXV0YXRpb25SZWNvcmRzKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbXV0YXRpb25SZWNvcmRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgcmVtb3ZlZEVsZW1lbnRzID0gZmlsdGVyZWRFbGVtZW50cyhtdXRhdGlvblJlY29yZHNbaV0ucmVtb3ZlZE5vZGVzKTtcbiAgICAgICAgICAgIGlmIChyZW1vdmVkRWxlbWVudHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHZhciBjYWxsYmFja3MgPSBjYWxsYmFja1N1cHBvcnQuZ2V0KCk7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBjYWxsYmFja3MubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2tzW2pdKHJlbW92ZWRFbGVtZW50cyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG4gICAgdmFyIGJvZHkgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnYm9keScpWzBdO1xuICAgIG9ic2VydmVyLm9ic2VydmUoYm9keSwge1xuICAgICAgICBjaGlsZExpc3Q6IHRydWUsXG4gICAgICAgIGF0dHJpYnV0ZXM6IGZhbHNlLFxuICAgICAgICBjaGFyYWN0ZXJEYXRhOiBmYWxzZSxcbiAgICAgICAgc3VidHJlZTogdHJ1ZSxcbiAgICAgICAgYXR0cmlidXRlT2xkVmFsdWU6IGZhbHNlLFxuICAgICAgICBjaGFyYWN0ZXJEYXRhT2xkVmFsdWU6IGZhbHNlXG4gICAgfSk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdGVhcmRvd246IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY2FsbGJhY2tTdXBwb3J0LnRlYXJkb3duKCk7XG4gICAgICAgICAgICBvYnNlcnZlci5kaXNjb25uZWN0KCk7XG4gICAgICAgIH0sXG4gICAgICAgIGFkZENhbGxiYWNrOiBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICAgICAgY2FsbGJhY2tTdXBwb3J0LmFkZChjYWxsYmFjayk7XG4gICAgICAgIH0sXG4gICAgICAgIHJlbW92ZUNhbGxiYWNrOiBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICAgICAgY2FsbGJhY2tTdXBwb3J0LnJlbW92ZShjYWxsYmFjayk7XG4gICAgICAgIH1cbiAgICB9O1xufVxuXG4vLyBGaWx0ZXIgdGhlIHNldCBvZiBub2RlcyB0byBlbGltaW5hdGUgYW55dGhpbmcgaW5zaWRlIG91ciBvd24gRE9NIGVsZW1lbnRzIChvdGhlcndpc2UsIHdlIGdlbmVyYXRlIGEgdG9uIG9mIGNoYXR0ZXIpXG5mdW5jdGlvbiBmaWx0ZXJlZEVsZW1lbnRzKG5vZGVMaXN0KSB7XG4gICAgdmFyIGZpbHRlcmVkID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBub2RlTGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgbm9kZSA9IG5vZGVMaXN0W2ldO1xuICAgICAgICBpZiAobm9kZS5ub2RlVHlwZSA9PT0gMSkgeyAvLyBPbmx5IGVsZW1lbnQgbm9kZXMuIChodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvTm9kZS9ub2RlVHlwZSlcbiAgICAgICAgICAgIHZhciAkZWxlbWVudCA9ICQobm9kZSk7XG4gICAgICAgICAgICBpZiAoJGVsZW1lbnQuY2xvc2VzdChSYW5nZS5ISUdITElHSFRfU0VMRUNUT1IgKyAnLCAuYW50ZW5uYSwgJyArIFdpZGdldEJ1Y2tldC5zZWxlY3RvcigpKS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICBmaWx0ZXJlZC5wdXNoKCRlbGVtZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmlsdGVyZWQ7XG59XG5cbmZ1bmN0aW9uIGFkZE9uZVRpbWVFbGVtZW50UmVtb3ZhbExpc3RlbmVyKG5vZGUsIGNhbGxiYWNrKSB7XG4gICAgdmFyIGxpc3RlbmVyID0gZnVuY3Rpb24ocmVtb3ZlZEVsZW1lbnRzKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmVtb3ZlZEVsZW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgcmVtb3ZlZEVsZW1lbnQgPSByZW1vdmVkRWxlbWVudHNbaV0uZ2V0KDApO1xuICAgICAgICAgICAgaWYgKHJlbW92ZWRFbGVtZW50LmNvbnRhaW5zKG5vZGUpKSB7XG4gICAgICAgICAgICAgICAgcmVtb3ZlUmVtb3ZhbExpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiAgICBhZGRSZW1vdmFsTGlzdGVuZXIobGlzdGVuZXIpO1xufVxuXG5mdW5jdGlvbiBhZGRPbmVUaW1lQXR0cmlidXRlTGlzdGVuZXIobm9kZSwgYXR0cmlidXRlcywgY2FsbGJhY2spIHtcbiAgICB2YXIgb2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcihmdW5jdGlvbihtdXRhdGlvblJlY29yZHMpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtdXRhdGlvblJlY29yZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciB0YXJnZXQgPSBtdXRhdGlvblJlY29yZHNbaV0udGFyZ2V0O1xuICAgICAgICAgICAgY2FsbGJhY2sodGFyZ2V0KTtcbiAgICAgICAgICAgIG9ic2VydmVyLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIG9ic2VydmVyLm9ic2VydmUobm9kZSwge1xuICAgICAgICBjaGlsZExpc3Q6IGZhbHNlLFxuICAgICAgICBhdHRyaWJ1dGVzOiB0cnVlLFxuICAgICAgICBjaGFyYWN0ZXJEYXRhOiBmYWxzZSxcbiAgICAgICAgc3VidHJlZTogZmFsc2UsXG4gICAgICAgIGF0dHJpYnV0ZU9sZFZhbHVlOiBmYWxzZSxcbiAgICAgICAgY2hhcmFjdGVyRGF0YU9sZFZhbHVlOiBmYWxzZSxcbiAgICAgICAgYXR0cmlidXRlRmlsdGVyOiBhdHRyaWJ1dGVzXG4gICAgfSk7XG4gICAgYXR0cmlidXRlT2JzZXJ2ZXJzLnB1c2gob2JzZXJ2ZXIpO1xufVxuXG5mdW5jdGlvbiB0ZWFyZG93bigpIHtcbiAgICBpZiAoYWRkaXRpb25MaXN0ZW5lcikge1xuICAgICAgICBhZGRpdGlvbkxpc3RlbmVyLnRlYXJkb3duKCk7XG4gICAgICAgIGFkZGl0aW9uTGlzdGVuZXIgPSB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgaWYgKHJlbW92YWxMaXN0ZW5lcikge1xuICAgICAgICByZW1vdmFsTGlzdGVuZXIudGVhcmRvd24oKTtcbiAgICAgICAgcmVtb3ZhbExpc3RlbmVyID0gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXR0cmlidXRlT2JzZXJ2ZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGF0dHJpYnV0ZU9ic2VydmVyc1tpXS5kaXNjb25uZWN0KCk7XG4gICAgfVxuICAgIGF0dHJpYnV0ZU9ic2VydmVycyA9IFtdO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgYWRkQWRkaXRpb25MaXN0ZW5lcjogYWRkQWRkaXRpb25MaXN0ZW5lcixcbiAgICBhZGRSZW1vdmFsTGlzdGVuZXI6IGFkZFJlbW92YWxMaXN0ZW5lcixcbiAgICBhZGRPbmVUaW1lRWxlbWVudFJlbW92YWxMaXN0ZW5lcjogYWRkT25lVGltZUVsZW1lbnRSZW1vdmFsTGlzdGVuZXIsXG4gICAgYWRkT25lVGltZUF0dHJpYnV0ZUxpc3RlbmVyOiBhZGRPbmVUaW1lQXR0cmlidXRlTGlzdGVuZXIsXG4gICAgdGVhcmRvd246IHRlYXJkb3duXG59OyIsInZhciAkOyByZXF1aXJlKCcuL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xuXG5mdW5jdGlvbiBjb21wdXRlUGFnZVRpdGxlKCRwYWdlLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIHRpdGxlU2VsZWN0b3IgPSBncm91cFNldHRpbmdzLnBhZ2VUaXRsZVNlbGVjdG9yKCk7XG4gICAgaWYgKCF0aXRsZVNlbGVjdG9yKSB7XG4gICAgICAgIC8vIEJhY2t3YXJkcyBjb21wYXRpYmlsaXR5IGZvciBzaXRlcyB3aGljaCBkZXBsb3llZCBiZWZvcmUgd2UgaGFkIGEgc2VwYXJhdGUgdGl0bGUgc2VsZWN0b3IuXG4gICAgICAgIHRpdGxlU2VsZWN0b3IgPSBncm91cFNldHRpbmdzLnBhZ2VVcmxTZWxlY3RvcigpO1xuICAgIH1cbiAgICB2YXIgcGFnZVRpdGxlID0gJHBhZ2UuZmluZCh0aXRsZVNlbGVjdG9yKS50ZXh0KCkudHJpbSgpO1xuICAgIGlmIChwYWdlVGl0bGUgPT09ICcnKSB7XG4gICAgICAgIC8vIElmIHdlIGNvdWxkbid0IGZpbmQgYSB0aXRsZSBiYXNlZCBvbiB0aGUgZ3JvdXAgc2V0dGluZ3MsIGZhbGxiYWNrIHRvIHNvbWUgaGFyZC1jb2RlZCBiZWhhdmlvci5cbiAgICAgICAgcGFnZVRpdGxlID0gZ2V0QXR0cmlidXRlVmFsdWUoJ21ldGFbcHJvcGVydHk9XCJvZzp0aXRsZVwiXScsICdjb250ZW50JykgfHwgJCgndGl0bGUnKS50ZXh0KCkudHJpbSgpO1xuICAgIH1cbiAgICByZXR1cm4gcGFnZVRpdGxlO1xufVxuXG5mdW5jdGlvbiBjb21wdXRlVG9wTGV2ZWxQYWdlSW1hZ2UoZ3JvdXBTZXR0aW5ncykge1xuICAgIHJldHVybiBnZXRBdHRyaWJ1dGVWYWx1ZShncm91cFNldHRpbmdzLnBhZ2VJbWFnZVNlbGVjdG9yKCksIGdyb3VwU2V0dGluZ3MucGFnZUltYWdlQXR0cmlidXRlKCkpO1xufVxuXG5mdW5jdGlvbiBjb21wdXRlUGFnZUF1dGhvcihncm91cFNldHRpbmdzKSB7XG4gICAgcmV0dXJuIGdldEF0dHJpYnV0ZVZhbHVlKGdyb3VwU2V0dGluZ3MucGFnZUF1dGhvclNlbGVjdG9yKCksIGdyb3VwU2V0dGluZ3MucGFnZUF1dGhvckF0dHJpYnV0ZSgpKTtcbn1cblxuZnVuY3Rpb24gY29tcHV0ZVBhZ2VUb3BpY3MoZ3JvdXBTZXR0aW5ncykge1xuICAgIHJldHVybiBnZXRBdHRyaWJ1dGVWYWx1ZShncm91cFNldHRpbmdzLnBhZ2VUb3BpY3NTZWxlY3RvcigpLCBncm91cFNldHRpbmdzLnBhZ2VUb3BpY3NBdHRyaWJ1dGUoKSk7XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVQYWdlU2l0ZVNlY3Rpb24oZ3JvdXBTZXR0aW5ncykge1xuICAgIHJldHVybiBnZXRBdHRyaWJ1dGVWYWx1ZShncm91cFNldHRpbmdzLnBhZ2VTaXRlU2VjdGlvblNlbGVjdG9yKCksIGdyb3VwU2V0dGluZ3MucGFnZVNpdGVTZWN0aW9uQXR0cmlidXRlKCkpO1xufVxuXG5mdW5jdGlvbiBnZXRBdHRyaWJ1dGVWYWx1ZShlbGVtZW50U2VsZWN0b3IsIGF0dHJpYnV0ZVNlbGVjdG9yKSB7XG4gICAgdmFyIHZhbHVlID0gJyc7XG4gICAgaWYgKGVsZW1lbnRTZWxlY3RvciAmJiBhdHRyaWJ1dGVTZWxlY3Rvcikge1xuICAgICAgICB2YWx1ZSA9ICQoZWxlbWVudFNlbGVjdG9yKS5hdHRyKGF0dHJpYnV0ZVNlbGVjdG9yKSB8fCAnJztcbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlLnRyaW0oKTtcbn1cblxuZnVuY3Rpb24gY29tcHV0ZVRvcExldmVsQ2Fub25pY2FsVXJsKGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgY2Fub25pY2FsVXJsID0gd2luZG93LmxvY2F0aW9uLmhyZWYuc3BsaXQoJyMnKVswXS50b0xvd2VyQ2FzZSgpO1xuICAgIHZhciAkY2Fub25pY2FsTGluayA9ICQoJ2xpbmtbcmVsPVwiY2Fub25pY2FsXCJdJyk7XG4gICAgaWYgKCRjYW5vbmljYWxMaW5rLmxlbmd0aCA+IDAgJiYgJGNhbm9uaWNhbExpbmsuYXR0cignaHJlZicpKSB7XG4gICAgICAgIHZhciBvdmVycmlkZVVybCA9ICRjYW5vbmljYWxMaW5rLmF0dHIoJ2hyZWYnKS50cmltKCkudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgdmFyIGRvbWFpbiA9ICh3aW5kb3cubG9jYXRpb24ucHJvdG9jb2wrJy8vJyt3aW5kb3cubG9jYXRpb24uaG9zdG5hbWUrJy8nKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICBpZiAob3ZlcnJpZGVVcmwgIT09IGRvbWFpbikgeyAvLyBmYXN0Y28gZml4IChzaW5jZSB0aGV5IHNvbWV0aW1lcyByZXdyaXRlIHRoZWlyIGNhbm9uaWNhbCB0byBzaW1wbHkgYmUgdGhlaXIgZG9tYWluLilcbiAgICAgICAgICAgIGNhbm9uaWNhbFVybCA9IG92ZXJyaWRlVXJsO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZW1vdmVTdWJkb21haW5Gcm9tUGFnZVVybChjYW5vbmljYWxVcmwsIGdyb3VwU2V0dGluZ3MpO1xufVxuXG5mdW5jdGlvbiBjb21wdXRlUGFnZUVsZW1lbnRVcmwoJHBhZ2VFbGVtZW50LCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIHBhZ2VVcmxTZWxlY3RvciA9IGdyb3VwU2V0dGluZ3MucGFnZVVybFNlbGVjdG9yKCk7XG4gICAgdmFyICRwYWdlVXJsRWxlbWVudCA9ICRwYWdlRWxlbWVudC5maW5kKHBhZ2VVcmxTZWxlY3Rvcik7XG4gICAgaWYgKHBhZ2VVcmxTZWxlY3RvcikgeyAvLyB3aXRoIGFuIHVuZGVmaW5lZCBzZWxlY3RvciwgYWRkQmFjayB3aWxsIG1hdGNoIGFuZCBhbHdheXMgcmV0dXJuIHRoZSBpbnB1dCBlbGVtZW50ICh1bmxpa2UgZmluZCgpIHdoaWNoIHJldHVybnMgYW4gZW1wdHkgbWF0Y2gpXG4gICAgICAgICRwYWdlVXJsRWxlbWVudCA9ICRwYWdlVXJsRWxlbWVudC5hZGRCYWNrKHBhZ2VVcmxTZWxlY3Rvcik7XG4gICAgfVxuICAgIHZhciB1cmwgPSAkcGFnZVVybEVsZW1lbnQuYXR0cihncm91cFNldHRpbmdzLnBhZ2VVcmxBdHRyaWJ1dGUoKSk7XG4gICAgaWYgKHVybCkge1xuICAgICAgICB1cmwgPSByZW1vdmVTdWJkb21haW5Gcm9tUGFnZVVybCh1cmwsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICB2YXIgb3JpZ2luID0gd2luZG93LmxvY2F0aW9uLm9yaWdpbiB8fCB3aW5kb3cubG9jYXRpb24ucHJvdG9jb2wgKyBcIi8vXCIgKyB3aW5kb3cubG9jYXRpb24uaG9zdG5hbWUgKyAod2luZG93LmxvY2F0aW9uLnBvcnQgPyAnOicgKyB3aW5kb3cubG9jYXRpb24ucG9ydDogJycpO1xuICAgICAgICBpZiAodXJsLmluZGV4T2Yob3JpZ2luKSAhPT0gMCAmJiAvLyBOb3QgYW4gYWJzb2x1dGUgVVJMXG4gICAgICAgICAgICAgICAgIXVybC5zdWJzdHIoMCwyKSAhPT0gJy8vJyAmJiAvLyBOb3QgcHJvdG9jb2wgcmVsYXRpdmVcbiAgICAgICAgICAgICAgICAhZ3JvdXBTZXR0aW5ncy51cmwuaWdub3JlU3ViZG9tYWluKCkpIHsgLy8gQW5kIHdlIHdlcmVuJ3Qgbm90IGlnbm9yaW5nIHRoZSBzdWJkb21haW5cbiAgICAgICAgICAgIGlmICh1cmwuc3Vic3RyKDAsMSkgPT0gJy8nKSB7XG4gICAgICAgICAgICAgICAgdXJsID0gb3JpZ2luICsgdXJsO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB1cmwgPSBvcmlnaW4gKyB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUgKyB1cmw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHVybDtcbiAgICB9XG4gICAgcmV0dXJuIGNvbXB1dGVUb3BMZXZlbENhbm9uaWNhbFVybChncm91cFNldHRpbmdzKTtcbn1cblxuLy8gVE9ETyBjb3BpZWQgZnJvbSBlbmdhZ2VfZnVsbC4gUmV2aWV3LlxuZnVuY3Rpb24gcmVtb3ZlU3ViZG9tYWluRnJvbVBhZ2VVcmwodXJsLCBncm91cFNldHRpbmdzKSB7XG4gICAgLy8gQU5ULmFjdGlvbnMucmVtb3ZlU3ViZG9tYWluRnJvbVBhZ2VVcmw6XG4gICAgLy8gaWYgXCJpZ25vcmVfc3ViZG9tYWluXCIgaXMgY2hlY2tlZCBpbiBzZXR0aW5ncywgQU5EIHRoZXkgc3VwcGx5IGEgVExELFxuICAgIC8vIHRoZW4gbW9kaWZ5IHRoZSBwYWdlIGFuZCBjYW5vbmljYWwgVVJMcyBoZXJlLlxuICAgIC8vIGhhdmUgdG8gaGF2ZSB0aGVtIHN1cHBseSBvbmUgYmVjYXVzZSB0aGVyZSBhcmUgdG9vIG1hbnkgdmFyaWF0aW9ucyB0byByZWxpYWJseSBzdHJpcCBzdWJkb21haW5zICAoLmNvbSwgLmlzLCAuY29tLmFyLCAuY28udWssIGV0YylcbiAgICBpZiAoZ3JvdXBTZXR0aW5ncy51cmwuaWdub3JlU3ViZG9tYWluKCkgPT0gdHJ1ZSAmJiBncm91cFNldHRpbmdzLnVybC5jYW5vbmljYWxEb21haW4oKSkge1xuICAgICAgICB2YXIgSE9TVERPTUFJTiA9IC9bLVxcd10rXFwuKD86Wy1cXHddK1xcLnhuLS1bLVxcd10rfFstXFx3XXsyLH18Wy1cXHddK1xcLlstXFx3XXsyfSkkL2k7XG4gICAgICAgIHZhciBzcmNBcnJheSA9IHVybC5zcGxpdCgnLycpO1xuXG4gICAgICAgIHZhciBwcm90b2NvbCA9IHNyY0FycmF5WzBdO1xuICAgICAgICBzcmNBcnJheS5zcGxpY2UoMCwzKTtcblxuICAgICAgICB2YXIgcmV0dXJuVXJsID0gcHJvdG9jb2wgKyAnLy8nICsgZ3JvdXBTZXR0aW5ncy51cmwuY2Fub25pY2FsRG9tYWluKCkgKyAnLycgKyBzcmNBcnJheS5qb2luKCcvJyk7XG5cbiAgICAgICAgcmV0dXJuIHJldHVyblVybDtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdXJsO1xuICAgIH1cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNvbXB1dGVQYWdlVXJsOiBjb21wdXRlUGFnZUVsZW1lbnRVcmwsXG4gICAgY29tcHV0ZVBhZ2VUaXRsZTogY29tcHV0ZVBhZ2VUaXRsZSxcbiAgICBjb21wdXRlVG9wTGV2ZWxQYWdlSW1hZ2U6IGNvbXB1dGVUb3BMZXZlbFBhZ2VJbWFnZSxcbiAgICBjb21wdXRlUGFnZUF1dGhvcjogY29tcHV0ZVBhZ2VBdXRob3IsXG4gICAgY29tcHV0ZVBhZ2VUb3BpY3M6IGNvbXB1dGVQYWdlVG9waWNzLFxuICAgIGNvbXB1dGVQYWdlU2l0ZVNlY3Rpb246IGNvbXB1dGVQYWdlU2l0ZVNlY3Rpb25cbn07IiwiLy8gQW50ZW5uYSBjaGFuZ2VzIGZyb20gb3JpZ2luYWwgc291cmNlIG1hcmtlZCB3aXRoIE9SSUdJTkFMXG4vLyBTZWUgdGhlIGlzc3VlIHdlIG5lZWRlZCB0byB3b3JrIGFyb3VuZCBoZXJlOiBodHRwczovL2dpdGh1Yi5jb20vcmFjdGl2ZWpzL3JhY3RpdmUtZXZlbnRzLXRhcC9pc3N1ZXMvOFxuXG4vLyBUYXAvZmFzdGNsaWNrIGV2ZW50IHBsdWdpbiBmb3IgUmFjdGl2ZS5qcyAtIGVsaW1pbmF0ZXMgdGhlIDMwMG1zIGRlbGF5IG9uIHRvdWNoLWVuYWJsZWQgZGV2aWNlcywgYW5kIG5vcm1hbGlzZXNcbi8vIGFjcm9zcyBtb3VzZSwgdG91Y2ggYW5kIHBvaW50ZXIgZXZlbnRzLlxuLy8gQXV0aG9yOiBSaWNoIEhhcnJpc1xuLy8gTGljZW5zZTogTUlUXG4vLyBTb3VyY2U6IGh0dHBzOi8vZ2l0aHViLmNvbS9yYWN0aXZlanMvcmFjdGl2ZS1ldmVudHMtdGFwXG4oZnVuY3Rpb24gKGdsb2JhbCwgZmFjdG9yeSkge1xuXHRtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcbn0odGhpcywgZnVuY3Rpb24gKCkgeyAndXNlIHN0cmljdCc7XG5cblx0dmFyIERJU1RBTkNFX1RIUkVTSE9MRCA9IDU7IC8vIG1heGltdW0gcGl4ZWxzIHBvaW50ZXIgY2FuIG1vdmUgYmVmb3JlIGNhbmNlbFxuXHR2YXIgVElNRV9USFJFU0hPTEQgPSA0MDA7IC8vIG1heGltdW0gbWlsbGlzZWNvbmRzIGJldHdlZW4gZG93biBhbmQgdXAgYmVmb3JlIGNhbmNlbFxuXG5cdGZ1bmN0aW9uIHRhcChub2RlLCBjYWxsYmFjaykge1xuXHRcdHJldHVybiBuZXcgVGFwSGFuZGxlcihub2RlLCBjYWxsYmFjayk7XG5cdH1cblxuXHRmdW5jdGlvbiBUYXBIYW5kbGVyKG5vZGUsIGNhbGxiYWNrKSB7XG5cdFx0dGhpcy5ub2RlID0gbm9kZTtcblx0XHR0aGlzLmNhbGxiYWNrID0gY2FsbGJhY2s7XG5cblx0XHR0aGlzLnByZXZlbnRNb3VzZWRvd25FdmVudHMgPSBmYWxzZTtcblxuXHRcdHRoaXMuYmluZChub2RlKTtcblx0fVxuXG5cdFRhcEhhbmRsZXIucHJvdG90eXBlID0ge1xuXHRcdGJpbmQ6IGZ1bmN0aW9uIGJpbmQobm9kZSkge1xuXHRcdFx0Ly8gbGlzdGVuIGZvciBtb3VzZS9wb2ludGVyIGV2ZW50cy4uLlxuXHRcdFx0Ly8gT1JJR0lOQUwgaWYgKHdpbmRvdy5uYXZpZ2F0b3IucG9pbnRlckVuYWJsZWQpIHtcblx0XHRcdGlmICh3aW5kb3cubmF2aWdhdG9yLnBvaW50ZXJFbmFibGVkICYmICEoJ29udG91Y2hzdGFydCcgaW4gd2luZG93KSkge1xuXHRcdFx0XHRub2RlLmFkZEV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJkb3duJywgaGFuZGxlTW91c2Vkb3duLCBmYWxzZSk7XG5cdFx0XHQvLyBPUklHSU5BTCB9IGVsc2UgaWYgKHdpbmRvdy5uYXZpZ2F0b3IubXNQb2ludGVyRW5hYmxlZCkge1xuXHRcdFx0fSBlbHNlIGlmICh3aW5kb3cubmF2aWdhdG9yLm1zUG9pbnRlckVuYWJsZWQgJiYgISgnb250b3VjaHN0YXJ0JyBpbiB3aW5kb3cpKSB7XG5cdFx0XHRcdG5vZGUuYWRkRXZlbnRMaXN0ZW5lcignTVNQb2ludGVyRG93bicsIGhhbmRsZU1vdXNlZG93biwgZmFsc2UpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0bm9kZS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBoYW5kbGVNb3VzZWRvd24sIGZhbHNlKTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gLi4uYW5kIHRvdWNoIGV2ZW50c1xuXHRcdFx0bm9kZS5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgaGFuZGxlVG91Y2hzdGFydCwgZmFsc2UpO1xuXG5cdFx0XHQvLyBuYXRpdmUgYnV0dG9ucywgYW5kIDxpbnB1dCB0eXBlPSdidXR0b24nPiBlbGVtZW50cywgc2hvdWxkIGZpcmUgYSB0YXAgZXZlbnRcblx0XHRcdC8vIHdoZW4gdGhlIHNwYWNlIGtleSBpcyBwcmVzc2VkXG5cdFx0XHRpZiAobm9kZS50YWdOYW1lID09PSAnQlVUVE9OJyB8fCBub2RlLnR5cGUgPT09ICdidXR0b24nKSB7XG5cdFx0XHRcdG5vZGUuYWRkRXZlbnRMaXN0ZW5lcignZm9jdXMnLCBoYW5kbGVGb2N1cywgZmFsc2UpO1xuXHRcdFx0fVxuXG5cdFx0XHRub2RlLl9fdGFwX2hhbmRsZXJfXyA9IHRoaXM7XG5cdFx0fSxcblx0XHRmaXJlOiBmdW5jdGlvbiBmaXJlKGV2ZW50LCB4LCB5KSB7XG5cdFx0XHR0aGlzLmNhbGxiYWNrKHtcblx0XHRcdFx0bm9kZTogdGhpcy5ub2RlLFxuXHRcdFx0XHRvcmlnaW5hbDogZXZlbnQsXG5cdFx0XHRcdHg6IHgsXG5cdFx0XHRcdHk6IHlcblx0XHRcdH0pO1xuXHRcdH0sXG5cdFx0bW91c2Vkb3duOiBmdW5jdGlvbiBtb3VzZWRvd24oZXZlbnQpIHtcblx0XHRcdHZhciBfdGhpcyA9IHRoaXM7XG5cblx0XHRcdGlmICh0aGlzLnByZXZlbnRNb3VzZWRvd25FdmVudHMpIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZXZlbnQud2hpY2ggIT09IHVuZGVmaW5lZCAmJiBldmVudC53aGljaCAhPT0gMSkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdHZhciB4ID0gZXZlbnQuY2xpZW50WDtcblx0XHRcdHZhciB5ID0gZXZlbnQuY2xpZW50WTtcblxuXHRcdFx0Ly8gVGhpcyB3aWxsIGJlIG51bGwgZm9yIG1vdXNlIGV2ZW50cy5cblx0XHRcdHZhciBwb2ludGVySWQgPSBldmVudC5wb2ludGVySWQ7XG5cblx0XHRcdHZhciBoYW5kbGVNb3VzZXVwID0gZnVuY3Rpb24gaGFuZGxlTW91c2V1cChldmVudCkge1xuXHRcdFx0XHRpZiAoZXZlbnQucG9pbnRlcklkICE9IHBvaW50ZXJJZCkge1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdF90aGlzLmZpcmUoZXZlbnQsIHgsIHkpO1xuXHRcdFx0XHRjYW5jZWwoKTtcblx0XHRcdH07XG5cblx0XHRcdHZhciBoYW5kbGVNb3VzZW1vdmUgPSBmdW5jdGlvbiBoYW5kbGVNb3VzZW1vdmUoZXZlbnQpIHtcblx0XHRcdFx0aWYgKGV2ZW50LnBvaW50ZXJJZCAhPSBwb2ludGVySWQpIHtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoTWF0aC5hYnMoZXZlbnQuY2xpZW50WCAtIHgpID49IERJU1RBTkNFX1RIUkVTSE9MRCB8fCBNYXRoLmFicyhldmVudC5jbGllbnRZIC0geSkgPj0gRElTVEFOQ0VfVEhSRVNIT0xEKSB7XG5cdFx0XHRcdFx0Y2FuY2VsKCk7XG5cdFx0XHRcdH1cblx0XHRcdH07XG5cblx0XHRcdHZhciBjYW5jZWwgPSBmdW5jdGlvbiBjYW5jZWwoKSB7XG5cdFx0XHRcdF90aGlzLm5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcignTVNQb2ludGVyVXAnLCBoYW5kbGVNb3VzZXVwLCBmYWxzZSk7XG5cdFx0XHRcdGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ01TUG9pbnRlck1vdmUnLCBoYW5kbGVNb3VzZW1vdmUsIGZhbHNlKTtcblx0XHRcdFx0ZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignTVNQb2ludGVyQ2FuY2VsJywgY2FuY2VsLCBmYWxzZSk7XG5cdFx0XHRcdF90aGlzLm5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcigncG9pbnRlcnVwJywgaGFuZGxlTW91c2V1cCwgZmFsc2UpO1xuXHRcdFx0XHRkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdwb2ludGVybW92ZScsIGhhbmRsZU1vdXNlbW92ZSwgZmFsc2UpO1xuXHRcdFx0XHRkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdwb2ludGVyY2FuY2VsJywgY2FuY2VsLCBmYWxzZSk7XG5cdFx0XHRcdF90aGlzLm5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVNb3VzZXVwLCBmYWxzZSk7XG5cdFx0XHRcdGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIGhhbmRsZU1vdXNlbW92ZSwgZmFsc2UpO1xuXHRcdFx0fTtcblxuXHRcdFx0aWYgKHdpbmRvdy5uYXZpZ2F0b3IucG9pbnRlckVuYWJsZWQpIHtcblx0XHRcdFx0dGhpcy5ub2RlLmFkZEV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJ1cCcsIGhhbmRsZU1vdXNldXAsIGZhbHNlKTtcblx0XHRcdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigncG9pbnRlcm1vdmUnLCBoYW5kbGVNb3VzZW1vdmUsIGZhbHNlKTtcblx0XHRcdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigncG9pbnRlcmNhbmNlbCcsIGNhbmNlbCwgZmFsc2UpO1xuXHRcdFx0fSBlbHNlIGlmICh3aW5kb3cubmF2aWdhdG9yLm1zUG9pbnRlckVuYWJsZWQpIHtcblx0XHRcdFx0dGhpcy5ub2RlLmFkZEV2ZW50TGlzdGVuZXIoJ01TUG9pbnRlclVwJywgaGFuZGxlTW91c2V1cCwgZmFsc2UpO1xuXHRcdFx0XHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdNU1BvaW50ZXJNb3ZlJywgaGFuZGxlTW91c2Vtb3ZlLCBmYWxzZSk7XG5cdFx0XHRcdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ01TUG9pbnRlckNhbmNlbCcsIGNhbmNlbCwgZmFsc2UpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhpcy5ub2RlLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlTW91c2V1cCwgZmFsc2UpO1xuXHRcdFx0XHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBoYW5kbGVNb3VzZW1vdmUsIGZhbHNlKTtcblx0XHRcdH1cblxuXHRcdFx0c2V0VGltZW91dChjYW5jZWwsIFRJTUVfVEhSRVNIT0xEKTtcblx0XHR9LFxuXHRcdHRvdWNoZG93bjogZnVuY3Rpb24gdG91Y2hkb3duKCkge1xuXHRcdFx0dmFyIF90aGlzMiA9IHRoaXM7XG5cblx0XHRcdHZhciB0b3VjaCA9IGV2ZW50LnRvdWNoZXNbMF07XG5cblx0XHRcdHZhciB4ID0gdG91Y2guY2xpZW50WDtcblx0XHRcdHZhciB5ID0gdG91Y2guY2xpZW50WTtcblxuXHRcdFx0dmFyIGZpbmdlciA9IHRvdWNoLmlkZW50aWZpZXI7XG5cblx0XHRcdHZhciBoYW5kbGVUb3VjaHVwID0gZnVuY3Rpb24gaGFuZGxlVG91Y2h1cChldmVudCkge1xuXHRcdFx0XHR2YXIgdG91Y2ggPSBldmVudC5jaGFuZ2VkVG91Y2hlc1swXTtcblxuXHRcdFx0XHRpZiAodG91Y2guaWRlbnRpZmllciAhPT0gZmluZ2VyKSB7XG5cdFx0XHRcdFx0Y2FuY2VsKCk7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTsgLy8gcHJldmVudCBjb21wYXRpYmlsaXR5IG1vdXNlIGV2ZW50XG5cblx0XHRcdFx0Ly8gZm9yIHRoZSBiZW5lZml0IG9mIG1vYmlsZSBGaXJlZm94IGFuZCBvbGQgQW5kcm9pZCBicm93c2Vycywgd2UgbmVlZCB0aGlzIGFic3VyZCBoYWNrLlxuXHRcdFx0XHRfdGhpczIucHJldmVudE1vdXNlZG93bkV2ZW50cyA9IHRydWU7XG5cdFx0XHRcdGNsZWFyVGltZW91dChfdGhpczIucHJldmVudE1vdXNlZG93blRpbWVvdXQpO1xuXG5cdFx0XHRcdF90aGlzMi5wcmV2ZW50TW91c2Vkb3duVGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdF90aGlzMi5wcmV2ZW50TW91c2Vkb3duRXZlbnRzID0gZmFsc2U7XG5cdFx0XHRcdH0sIDQwMCk7XG5cblx0XHRcdFx0X3RoaXMyLmZpcmUoZXZlbnQsIHgsIHkpO1xuXHRcdFx0XHRjYW5jZWwoKTtcblx0XHRcdH07XG5cblx0XHRcdHZhciBoYW5kbGVUb3VjaG1vdmUgPSBmdW5jdGlvbiBoYW5kbGVUb3VjaG1vdmUoZXZlbnQpIHtcblx0XHRcdFx0aWYgKGV2ZW50LnRvdWNoZXMubGVuZ3RoICE9PSAxIHx8IGV2ZW50LnRvdWNoZXNbMF0uaWRlbnRpZmllciAhPT0gZmluZ2VyKSB7XG5cdFx0XHRcdFx0Y2FuY2VsKCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR2YXIgdG91Y2ggPSBldmVudC50b3VjaGVzWzBdO1xuXHRcdFx0XHRpZiAoTWF0aC5hYnModG91Y2guY2xpZW50WCAtIHgpID49IERJU1RBTkNFX1RIUkVTSE9MRCB8fCBNYXRoLmFicyh0b3VjaC5jbGllbnRZIC0geSkgPj0gRElTVEFOQ0VfVEhSRVNIT0xEKSB7XG5cdFx0XHRcdFx0Y2FuY2VsKCk7XG5cdFx0XHRcdH1cblx0XHRcdH07XG5cblx0XHRcdHZhciBjYW5jZWwgPSBmdW5jdGlvbiBjYW5jZWwoKSB7XG5cdFx0XHRcdF90aGlzMi5ub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgaGFuZGxlVG91Y2h1cCwgZmFsc2UpO1xuXHRcdFx0XHR3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgaGFuZGxlVG91Y2htb3ZlLCBmYWxzZSk7XG5cdFx0XHRcdHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaGNhbmNlbCcsIGNhbmNlbCwgZmFsc2UpO1xuXHRcdFx0fTtcblxuXHRcdFx0dGhpcy5ub2RlLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgaGFuZGxlVG91Y2h1cCwgZmFsc2UpO1xuXHRcdFx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIGhhbmRsZVRvdWNobW92ZSwgZmFsc2UpO1xuXHRcdFx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoY2FuY2VsJywgY2FuY2VsLCBmYWxzZSk7XG5cblx0XHRcdHNldFRpbWVvdXQoY2FuY2VsLCBUSU1FX1RIUkVTSE9MRCk7XG5cdFx0fSxcblx0XHR0ZWFyZG93bjogZnVuY3Rpb24gdGVhcmRvd24oKSB7XG5cdFx0XHR2YXIgbm9kZSA9IHRoaXMubm9kZTtcblxuXHRcdFx0bm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKCdwb2ludGVyZG93bicsIGhhbmRsZU1vdXNlZG93biwgZmFsc2UpO1xuXHRcdFx0bm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKCdNU1BvaW50ZXJEb3duJywgaGFuZGxlTW91c2Vkb3duLCBmYWxzZSk7XG5cdFx0XHRub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIGhhbmRsZU1vdXNlZG93biwgZmFsc2UpO1xuXHRcdFx0bm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgaGFuZGxlVG91Y2hzdGFydCwgZmFsc2UpO1xuXHRcdFx0bm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKCdmb2N1cycsIGhhbmRsZUZvY3VzLCBmYWxzZSk7XG5cdFx0fVxuXHR9O1xuXG5cdGZ1bmN0aW9uIGhhbmRsZU1vdXNlZG93bihldmVudCkge1xuXHRcdHRoaXMuX190YXBfaGFuZGxlcl9fLm1vdXNlZG93bihldmVudCk7XG5cdH1cblxuXHRmdW5jdGlvbiBoYW5kbGVUb3VjaHN0YXJ0KGV2ZW50KSB7XG5cdFx0dGhpcy5fX3RhcF9oYW5kbGVyX18udG91Y2hkb3duKGV2ZW50KTtcblx0fVxuXG5cdGZ1bmN0aW9uIGhhbmRsZUZvY3VzKCkge1xuXHRcdHRoaXMuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGhhbmRsZUtleWRvd24sIGZhbHNlKTtcblx0XHR0aGlzLmFkZEV2ZW50TGlzdGVuZXIoJ2JsdXInLCBoYW5kbGVCbHVyLCBmYWxzZSk7XG5cdH1cblxuXHRmdW5jdGlvbiBoYW5kbGVCbHVyKCkge1xuXHRcdHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGhhbmRsZUtleWRvd24sIGZhbHNlKTtcblx0XHR0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2JsdXInLCBoYW5kbGVCbHVyLCBmYWxzZSk7XG5cdH1cblxuXHRmdW5jdGlvbiBoYW5kbGVLZXlkb3duKGV2ZW50KSB7XG5cdFx0aWYgKGV2ZW50LndoaWNoID09PSAzMikge1xuXHRcdFx0Ly8gc3BhY2Uga2V5XG5cdFx0XHR0aGlzLl9fdGFwX2hhbmRsZXJfXy5maXJlKCk7XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIHRhcDtcblxufSkpOyIsInZhciBSYWN0aXZlRXZlbnRzVGFwID0gcmVxdWlyZSgnLi9yYWN0aXZlLWV2ZW50cy10YXAnKTtcblxudmFyIE1lc3NhZ2VzID0gcmVxdWlyZSgnLi9tZXNzYWdlcycpO1xuXG52YXIgbm9Db25mbGljdDtcbnZhciBsb2FkZWRSYWN0aXZlO1xudmFyIGNhbGxiYWNrcyA9IFtdO1xuXG4vLyBDYXB0dXJlIGFueSBnbG9iYWwgaW5zdGFuY2Ugb2YgUmFjdGl2ZSB3aGljaCBhbHJlYWR5IGV4aXN0cyBiZWZvcmUgd2UgbG9hZCBvdXIgb3duLlxuZnVuY3Rpb24gYWJvdXRUb0xvYWQoKSB7XG4gICAgbm9Db25mbGljdCA9IHdpbmRvdy5SYWN0aXZlO1xufVxuXG4vLyBSZXN0b3JlIHRoZSBnbG9iYWwgaW5zdGFuY2Ugb2YgUmFjdGl2ZSAoaWYgYW55KSBhbmQgcGFzcyBvdXQgb3VyIHZlcnNpb24gdG8gb3VyIGNhbGxiYWNrc1xuZnVuY3Rpb24gbG9hZGVkKCkge1xuICAgIGxvYWRlZFJhY3RpdmUgPSBSYWN0aXZlO1xuICAgIHdpbmRvdy5SYWN0aXZlID0gbm9Db25mbGljdDtcbiAgICBsb2FkZWRSYWN0aXZlLmRlY29yYXRvcnMuY3NzcmVzZXQgPSBjc3NSZXNldERlY29yYXRvcjsgLy8gTWFrZSBvdXIgY3NzIHJlc2V0IGRlY29yYXRvciBhdmFpbGFibGUgdG8gYWxsIGluc3RhbmNlc1xuICAgIGxvYWRlZFJhY3RpdmUuZXZlbnRzLnRhcCA9IFJhY3RpdmVFdmVudHNUYXA7IC8vIE1ha2UgdGhlICdvbi10YXAnIGV2ZW50IHBsdWdpbiBhdmFpbGFibGUgdG8gYWxsIGluc3RhbmNlc1xuICAgIGxvYWRlZFJhY3RpdmUuZGVmYXVsdHMuZGF0YS5nZXRNZXNzYWdlID0gTWVzc2FnZXMuZ2V0TWVzc2FnZTsgLy8gTWFrZSBnZXRNZXNzYWdlIGF2YWlsYWJsZSB0byBhbGwgaW5zdGFuY2VzXG4gICAgbG9hZGVkUmFjdGl2ZS5kZWZhdWx0cy50d293YXkgPSBmYWxzZTsgLy8gQ2hhbmdlIHRoZSBkZWZhdWx0IHRvIGRpc2FibGUgdHdvLXdheSBkYXRhIGJpbmRpbmdzLlxuICAgIGxvYWRlZFJhY3RpdmUuREVCVUcgPSBmYWxzZTtcbiAgICBub3RpZnlDYWxsYmFja3MoKTtcbn1cblxuZnVuY3Rpb24gY3NzUmVzZXREZWNvcmF0b3Iobm9kZSkge1xuICAgIHRhZ05vZGVBbmRDaGlsZHJlbihub2RlLCAnYW50ZW5uYS1yZXNldCcpO1xuICAgIHJldHVybiB7IHRlYXJkb3duOiBmdW5jdGlvbigpIHt9IH07XG59XG5cbmZ1bmN0aW9uIHRhZ05vZGVBbmRDaGlsZHJlbihub2RlLCBjbGF6eikge1xuICAgIGlmIChub2RlLnRhZ05hbWUudG9Mb3dlckNhc2UoKSAhPSAnc3ZnJykgeyAvLyBJRSByZXR1cm5zIG5vIGNsYXNzTGlzdCBmb3IgU1ZHIGVsZW1lbnRzIGFuZCBTYWZhcmkgY2FuJ3QgY29tcHV0ZSBTVkcgZWxlbWVudCBjaGlsZHJlblxuICAgICAgICBub2RlLmNsYXNzTGlzdC5hZGQoY2xhenopO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG5vZGUuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHRhZ05vZGVBbmRDaGlsZHJlbihub2RlLmNoaWxkcmVuW2ldLCBjbGF6eik7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIG5vdGlmeUNhbGxiYWNrcygpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNhbGxiYWNrcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjYWxsYmFja3NbaV0obG9hZGVkUmFjdGl2ZSk7XG4gICAgfVxuICAgIGNhbGxiYWNrcyA9IFtdO1xufVxuXG4vLyBSZWdpc3RlcnMgdGhlIGdpdmVuIGNhbGxiYWNrIHRvIGJlIG5vdGlmaWVkIHdoZW4gb3VyIHZlcnNpb24gb2YgUmFjdGl2ZSBpcyBsb2FkZWQuXG5mdW5jdGlvbiBvbkxvYWQoY2FsbGJhY2spIHtcbiAgICBpZiAobG9hZGVkUmFjdGl2ZSkge1xuICAgICAgICBjYWxsYmFjayhsb2FkZWRSYWN0aXZlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBjYWxsYmFja3MucHVzaChjYWxsYmFjayk7XG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgYWJvdXRUb0xvYWQ6IGFib3V0VG9Mb2FkLFxuICAgIGxvYWRlZDogbG9hZGVkLFxuICAgIG9uTG9hZDogb25Mb2FkXG59OyIsInZhciAkOyByZXF1aXJlKCcuL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIHJhbmd5OyByZXF1aXJlKCcuL3Jhbmd5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGxvYWRlZFJhbmd5KSB7IHJhbmd5ID0gbG9hZGVkUmFuZ3k7IH0pO1xuXG52YXIgaGlnaGxpZ2h0Q2xhc3MgPSAnYW50ZW5uYS1oaWdobGlnaHQnO1xudmFyIGhpZ2hsaWdodGVkUmFuZ2VzID0gW107XG5cbnZhciBjbGFzc0FwcGxpZXI7XG5mdW5jdGlvbiBnZXRDbGFzc0FwcGxpZXIoKSB7XG4gICAgaWYgKCFjbGFzc0FwcGxpZXIpIHtcbiAgICAgICAgY2xhc3NBcHBsaWVyID0gcmFuZ3kuY3JlYXRlQ2xhc3NBcHBsaWVyKGhpZ2hsaWdodENsYXNzLCB7IGVsZW1lbnRUYWdOYW1lOiAnaW5zJyB9KTtcbiAgICB9XG4gICAgcmV0dXJuIGNsYXNzQXBwbGllcjtcbn1cblxuLy8gUmV0dXJucyBhbiBhZGp1c3RlZCBlbmQgcG9pbnQgZm9yIHRoZSBzZWxlY3Rpb24gd2l0aGluIHRoZSBnaXZlbiBub2RlLCBhcyB0cmlnZ2VyZWQgYnkgdGhlIGdpdmVuIG1vdXNlIHVwIGV2ZW50LlxuLy8gVGhlIHJldHVybmVkIHBvaW50ICh4LCB5KSB0YWtlcyBpbnRvIGFjY291bnQgdGhlIGxvY2F0aW9uIG9mIHRoZSBtb3VzZSB1cCBldmVudCBhcyB3ZWxsIGFzIHRoZSBkaXJlY3Rpb24gb2YgdGhlXG4vLyBzZWxlY3Rpb24gKGZvcndhcmQvYmFjaykuXG5mdW5jdGlvbiBnZXRTZWxlY3Rpb25FbmRQb2ludChub2RlLCBldmVudCwgZXhjbHVkZU5vZGUpIHtcbiAgICAvLyBUT0RPOiBDb25zaWRlciB1c2luZyB0aGUgZWxlbWVudCBjcmVhdGVkIHdpdGggdGhlICdjbGFzc2lmaWVyJyByYXRoZXIgdGhhbiB0aGUgbW91c2UgbG9jYXRpb25cbiAgICB2YXIgc2VsZWN0aW9uID0gcmFuZ3kuZ2V0U2VsZWN0aW9uKCk7XG4gICAgaWYgKGlzVmFsaWRTZWxlY3Rpb24oc2VsZWN0aW9uLCBub2RlLCBleGNsdWRlTm9kZSkpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHg6IGV2ZW50LnBhZ2VYIC0gKCBzZWxlY3Rpb24uaXNCYWNrd2FyZHMoKSA/IC01IDogNSksXG4gICAgICAgICAgICB5OiBldmVudC5wYWdlWSAtIDggLy8gVE9ETzogZXhhY3QgY29vcmRzXG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG59XG5cbi8vIEF0dGVtcHRzIHRvIGdldCBhIHJhbmdlIGZyb20gdGhlIGN1cnJlbnQgc2VsZWN0aW9uLiBUaGlzIGV4cGFuZHMgdGhlXG4vLyBzZWxlY3RlZCByZWdpb24gdG8gaW5jbHVkZSB3b3JkIGJvdW5kYXJpZXMuXG5mdW5jdGlvbiBncmFiU2VsZWN0aW9uKG5vZGUsIGNhbGxiYWNrLCBleGNsdWRlTm9kZSkge1xuICAgIHZhciBzZWxlY3Rpb24gPSByYW5neS5nZXRTZWxlY3Rpb24oKTtcbiAgICBpZiAoaXNWYWxpZFNlbGVjdGlvbihzZWxlY3Rpb24sIG5vZGUsIGV4Y2x1ZGVOb2RlKSkge1xuICAgICAgICBleHBhbmRBbmRUcmltUmFuZ2Uoc2VsZWN0aW9uKTtcbiAgICAgICAgaWYgKHNlbGVjdGlvbi5jb250YWluc05vZGUoZXhjbHVkZU5vZGUpKSB7XG4gICAgICAgICAgICB2YXIgcmFuZ2UgPSBzZWxlY3Rpb24uZ2V0UmFuZ2VBdCgwKTtcbiAgICAgICAgICAgIHJhbmdlLnNldEVuZEJlZm9yZShleGNsdWRlTm9kZSk7XG4gICAgICAgICAgICBzZWxlY3Rpb24uc2V0U2luZ2xlUmFuZ2UocmFuZ2UpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpc1ZhbGlkU2VsZWN0aW9uKHNlbGVjdGlvbiwgbm9kZSwgZXhjbHVkZU5vZGUpKSB7XG4gICAgICAgICAgICB2YXIgbG9jYXRpb247XG4gICAgICAgICAgICBpZiAoc2VsZWN0aW9uRW5jb21wYXNzZXNOb2RlKHNlbGVjdGlvbiwgbm9kZSkpIHtcbiAgICAgICAgICAgICAgICBsb2NhdGlvbiA9ICc6MCw6MSc7IC8vIFRoZSB1c2VyIGhhcyBtYW51YWxseSBzZWxlY3RlZCB0aGUgZW50aXJlIG5vZGUuIE5vcm1hbGl6ZSB0aGUgbG9jYXRpb24uXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGxvY2F0aW9uID0gcmFuZ3kuc2VyaWFsaXplU2VsZWN0aW9uKHNlbGVjdGlvbiwgdHJ1ZSwgbm9kZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgdGV4dCA9IHNlbGVjdGlvbi50b1N0cmluZygpO1xuICAgICAgICAgICAgaGlnaGxpZ2h0U2VsZWN0aW9uKHNlbGVjdGlvbik7IC8vIEhpZ2hsaWdodGluZyBkZXNlbGVjdHMgdGhlIHRleHQsIHNvIGRvIHRoaXMgbGFzdC5cbiAgICAgICAgICAgIGNhbGxiYWNrKHRleHQsIGxvY2F0aW9uKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGV4cGFuZEFuZFRyaW1SYW5nZShyYW5nZU9yU2VsZWN0aW9uKSB7XG4gICAgICAgIHJhbmdlT3JTZWxlY3Rpb24uZXhwYW5kKCd3b3JkJywgeyB0cmltOiB0cnVlLCB3b3JkT3B0aW9uczogeyB3b3JkUmVnZXg6IC9cXFMrXFxTKi9naSB9IH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNlbGVjdGlvbkVuY29tcGFzc2VzTm9kZShzZWxlY3Rpb24sIG5vZGUpIHtcbiAgICAgICAgdmFyIHJhbmdlID0gZ2V0Tm9kZVJhbmdlKG5vZGUpO1xuICAgICAgICBleHBhbmRBbmRUcmltUmFuZ2UocmFuZ2UpO1xuICAgICAgICByZXR1cm4gcmFuZ2UudG9TdHJpbmcoKSA9PT0gc2VsZWN0aW9uLnRvU3RyaW5nKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBpc1ZhbGlkU2VsZWN0aW9uKHNlbGVjdGlvbiwgbm9kZSwgZXhjbHVkZU5vZGUpIHtcbiAgICByZXR1cm4gIXNlbGVjdGlvbi5pc0NvbGxhcHNlZCAmJiAgLy8gTm9uLWVtcHR5IHNlbGVjdGlvblxuICAgICAgICBzZWxlY3Rpb24ucmFuZ2VDb3VudCA9PT0gMSAmJiAvLyBTaW5nbGUgc2VsZWN0aW9uXG4gICAgICAgICghZXhjbHVkZU5vZGUgfHwgIXNlbGVjdGlvbi5jb250YWluc05vZGUoZXhjbHVkZU5vZGUsIHRydWUpKSAmJiAvLyBTZWxlY3Rpb24gZG9lc24ndCBjb250YWluIGFueXRoaW5nIHdlJ3ZlIHNhaWQgd2UgZG9uJ3Qgd2FudCAoZS5nLiB0aGUgaW5kaWNhdG9yKVxuICAgICAgICBub2RlQ29udGFpbnNTZWxlY3Rpb24obm9kZSwgc2VsZWN0aW9uKTsgLy8gU2VsZWN0aW9uIGlzIGNvbnRhaW5lZCBlbnRpcmVseSB3aXRoaW4gdGhlIG5vZGVcbn1cblxuZnVuY3Rpb24gbm9kZUNvbnRhaW5zU2VsZWN0aW9uKG5vZGUsIHNlbGVjdGlvbikge1xuICAgIHZhciBjb21tb25BbmNlc3RvciA9IHNlbGVjdGlvbi5nZXRSYW5nZUF0KDApLmNvbW1vbkFuY2VzdG9yQ29udGFpbmVyOyAvLyBjb21tb25BbmNlc3RvciBjb3VsZCBiZSBhIHRleHQgbm9kZSBvciBzb21lIHBhcmVudCBlbGVtZW50XG4gICAgcmV0dXJuIG5vZGUuY29udGFpbnMoY29tbW9uQW5jZXN0b3IpIHx8XG4gICAgICAgICAgICAvLyBUaGUgZm9sbG93aW5nIGNoZWNrIGlzIGZvciBJRSwgd2hpY2ggZG9lc24ndCBpbXBsZW1lbnQgXCJjb250YWluc1wiIHByb3Blcmx5IGZvciB0ZXh0IG5vZGVzLlxuICAgICAgICAoY29tbW9uQW5jZXN0b3Iubm9kZVR5cGUgPT09IDMgJiYgbm9kZS5jb250YWlucyhjb21tb25BbmNlc3Rvci5wYXJlbnROb2RlKSk7XG59XG5cbmZ1bmN0aW9uIGdldE5vZGVSYW5nZShub2RlKSB7XG4gICAgdmFyIHJhbmdlID0gcmFuZ3kuY3JlYXRlUmFuZ2UoZG9jdW1lbnQpO1xuICAgIHJhbmdlLnNlbGVjdE5vZGVDb250ZW50cyhub2RlKTtcbiAgICB2YXIgJGV4Y2x1ZGVkID0gJChub2RlKS5maW5kKCcuYW50ZW5uYS10ZXh0LWluZGljYXRvci13aWRnZXQnKTtcbiAgICBpZiAoJGV4Y2x1ZGVkLnNpemUoKSA+IDApIHsgLy8gUmVtb3ZlIHRoZSBpbmRpY2F0b3IgZnJvbSB0aGUgZW5kIG9mIHRoZSBzZWxlY3RlZCByYW5nZS5cbiAgICAgICAgcmFuZ2Uuc2V0RW5kQmVmb3JlKCRleGNsdWRlZC5nZXQoMCkpO1xuICAgIH1cbiAgICByZXR1cm4gcmFuZ2U7XG59XG5cbmZ1bmN0aW9uIGdyYWJOb2RlKG5vZGUsIGNhbGxiYWNrKSB7XG4gICAgdmFyIHJhbmdlID0gZ2V0Tm9kZVJhbmdlKG5vZGUpO1xuICAgIHZhciBzZWxlY3Rpb24gPSByYW5neS5nZXRTZWxlY3Rpb24oKTtcbiAgICBzZWxlY3Rpb24uc2V0U2luZ2xlUmFuZ2UocmFuZ2UpO1xuICAgIC8vIFdlIHNob3VsZCBqdXN0IGJlIGFibGUgdG8gc2VyaWFsaXplIHRoZSBzZWxlY3Rpb24sIGJ1dCB0aGlzIGdpdmVzIHVzIGluY29uc2lzdGVudCB2YWx1ZXMgaW4gU2FmYXJpLlxuICAgIC8vIFRoZSB2YWx1ZSAqc2hvdWxkKiBhbHdheXMgYmUgOjAsOjEgd2hlbiB3ZSBzZWxlY3QgYW4gZW50aXJlIG5vZGUsIHNvIHdlIGp1c3QgaGFyZGNvZGUgaXQuXG4gICAgLy92YXIgbG9jYXRpb24gPSByYW5neS5zZXJpYWxpemVTZWxlY3Rpb24oc2VsZWN0aW9uLCB0cnVlLCBub2RlKTtcbiAgICB2YXIgbG9jYXRpb24gPSAnOjAsOjEnO1xuICAgIHZhciB0ZXh0ID0gc2VsZWN0aW9uLnRvU3RyaW5nKCkudHJpbSgpO1xuICAgIGlmICh0ZXh0Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgaGlnaGxpZ2h0U2VsZWN0aW9uKHNlbGVjdGlvbik7IC8vIEhpZ2hsaWdodGluZyBkZXNlbGVjdHMgdGhlIHRleHQsIHNvIGRvIHRoaXMgbGFzdC5cbiAgICAgICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBjYWxsYmFjayh0ZXh0LCBsb2NhdGlvbik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgc2VsZWN0aW9uLnJlbW92ZUFsbFJhbmdlcygpOyAvLyBEb24ndCBhY3R1YWxseSBsZWF2ZSB0aGUgZWxlbWVudCBzZWxlY3RlZC5cbiAgICBzZWxlY3Rpb24ucmVmcmVzaCgpO1xufVxuXG4vLyBIaWdobGlnaHRzIHRoZSBnaXZlbiBsb2NhdGlvbiBpbnNpZGUgdGhlIGdpdmVuIG5vZGUuXG5mdW5jdGlvbiBoaWdobGlnaHRMb2NhdGlvbihub2RlLCBsb2NhdGlvbikge1xuICAgIC8vIFRPRE8gZXJyb3IgaGFuZGxpbmcgaW4gY2FzZSB0aGUgcmFuZ2UgaXMgbm90IHZhbGlkP1xuICAgIGlmIChsb2NhdGlvbiA9PT0gJzowLDoxJykge1xuICAgICAgICBncmFiTm9kZShub2RlKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAocmFuZ3kuY2FuRGVzZXJpYWxpemVSYW5nZShsb2NhdGlvbiwgbm9kZSwgZG9jdW1lbnQpKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB2YXIgcmFuZ2UgPSByYW5neS5kZXNlcmlhbGl6ZVJhbmdlKGxvY2F0aW9uLCBub2RlLCBkb2N1bWVudCk7XG4gICAgICAgICAgICBoaWdobGlnaHRSYW5nZShyYW5nZSk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAvLyBUT0RPOiBDb25zaWRlciBsb2dnaW5nIHNvbWUga2luZCBvZiBldmVudCBzZXJ2ZXItc2lkZT9cbiAgICAgICAgICAgIC8vIFRPRE86IENvbnNpZGVyIGhpZ2hsaWdodGluZyB0aGUgd2hvbGUgbm9kZT8gT3IgaXMgaXQgYmV0dGVyIHRvIGp1c3QgaGlnaGxpZ2h0IG5vdGhpbmc/XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGhpZ2hsaWdodFNlbGVjdGlvbihzZWxlY3Rpb24pIHtcbiAgICBoaWdobGlnaHRSYW5nZShzZWxlY3Rpb24uZ2V0UmFuZ2VBdCgwKSk7XG59XG5cbmZ1bmN0aW9uIGhpZ2hsaWdodFJhbmdlKHJhbmdlKSB7XG4gICAgY2xlYXJIaWdobGlnaHRzKCk7XG4gICAgZ2V0Q2xhc3NBcHBsaWVyKCkuYXBwbHlUb1JhbmdlKHJhbmdlKTtcbiAgICBoaWdobGlnaHRlZFJhbmdlcy5wdXNoKHJhbmdlKTtcbn1cblxuLy8gQ2xlYXJzIGFsbCBoaWdobGlnaHRzIHRoYXQgaGF2ZSBiZWVuIGNyZWF0ZWQgb24gdGhlIHBhZ2UuXG5mdW5jdGlvbiBjbGVhckhpZ2hsaWdodHMoKSB7XG4gICAgdmFyIGNsYXNzQXBwbGllciA9IGdldENsYXNzQXBwbGllcigpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaGlnaGxpZ2h0ZWRSYW5nZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIHJhbmdlID0gaGlnaGxpZ2h0ZWRSYW5nZXNbaV07XG4gICAgICAgIGlmIChjbGFzc0FwcGxpZXIuaXNBcHBsaWVkVG9SYW5nZShyYW5nZSkpIHtcbiAgICAgICAgICAgIGNsYXNzQXBwbGllci51bmRvVG9SYW5nZShyYW5nZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaGlnaGxpZ2h0ZWRSYW5nZXMgPSBbXTtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGdldFNlbGVjdGlvbkVuZFBvaW50OiBnZXRTZWxlY3Rpb25FbmRQb2ludCxcbiAgICBncmFiU2VsZWN0aW9uOiBncmFiU2VsZWN0aW9uLFxuICAgIGdyYWJOb2RlOiBncmFiTm9kZSxcbiAgICBjbGVhckhpZ2hsaWdodHM6IGNsZWFySGlnaGxpZ2h0cyxcbiAgICBoaWdobGlnaHQ6IGhpZ2hsaWdodExvY2F0aW9uLFxuICAgIEhJR0hMSUdIVF9TRUxFQ1RPUjogJy4nICsgaGlnaGxpZ2h0Q2xhc3Ncbn07IiwiXG52YXIgbm9Db25mbGljdDtcbnZhciBsb2FkZWRSYW5neTtcbnZhciBjYWxsYmFja3MgPSBbXTtcblxuLy8gQ2FwdHVyZSBhbnkgZ2xvYmFsIGluc3RhbmNlIG9mIHJhbmd5IHdoaWNoIGFscmVhZHkgZXhpc3RzIGJlZm9yZSB3ZSBsb2FkIG91ciBvd24uXG5mdW5jdGlvbiBhYm91dFRvTG9hZCgpIHtcbiAgICBub0NvbmZsaWN0ID0gd2luZG93LnJhbmd5O1xufVxuXG4vLyBSZXN0b3JlIHRoZSBnbG9iYWwgaW5zdGFuY2Ugb2YgcmFuZ3kgKGlmIGFueSkgYW5kIHBhc3Mgb3V0IG91ciB2ZXJzaW9uIHRvIG91ciBjYWxsYmFja3NcbmZ1bmN0aW9uIGxvYWRlZCgpIHtcbiAgICBsb2FkZWRSYW5neSA9IHJhbmd5O1xuICAgIGxvYWRlZFJhbmd5LmluaXQoKTtcbiAgICB3aW5kb3cucmFuZ3kgPSBub0NvbmZsaWN0O1xuICAgIG5vdGlmeUNhbGxiYWNrcygpO1xufVxuXG5mdW5jdGlvbiBub3RpZnlDYWxsYmFja3MoKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjYWxsYmFja3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY2FsbGJhY2tzW2ldKGxvYWRlZFJhbmd5KTtcbiAgICB9XG4gICAgY2FsbGJhY2tzID0gW107XG59XG5cbi8vIFJlZ2lzdGVycyB0aGUgZ2l2ZW4gY2FsbGJhY2sgdG8gYmUgbm90aWZpZWQgd2hlbiBvdXIgdmVyc2lvbiBvZiBSYW5neSBpcyBsb2FkZWQuXG5mdW5jdGlvbiBvbkxvYWQoY2FsbGJhY2spIHtcbiAgICBpZiAobG9hZGVkUmFuZ3kpIHtcbiAgICAgICAgY2FsbGJhY2sobG9hZGVkUmFuZ3kpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGNhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKTtcbiAgICB9XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBhYm91dFRvTG9hZDogYWJvdXRUb0xvYWQsXG4gICAgbG9hZGVkOiBsb2FkZWQsXG4gICAgb25Mb2FkOiBvbkxvYWRcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG5cbnZhciBDTEFTU19GVUxMID0gJ2FudGVubmEtZnVsbCc7XG52YXIgQ0xBU1NfSEFMRiA9ICdhbnRlbm5hLWhhbGYnO1xudmFyIENMQVNTX0hBTEZfU1RSRVRDSCA9IENMQVNTX0hBTEYgKyAnIGFudGVubmEtc3RyZXRjaCc7XG5cbmZ1bmN0aW9uIGNvbXB1dGVMYXlvdXREYXRhKHJlYWN0aW9uc0RhdGEpIHtcbiAgICB2YXIgbnVtUmVhY3Rpb25zID0gcmVhY3Rpb25zRGF0YS5sZW5ndGg7XG4gICAgaWYgKG51bVJlYWN0aW9ucyA9PSAwKSB7XG4gICAgICAgIHJldHVybiB7fTsgLy8gVE9ETyBjbGVhbiB0aGlzIHVwXG4gICAgfVxuICAgIC8vIFRPRE86IENvcGllZCBjb2RlIGZyb20gZW5nYWdlX2Z1bGwuY3JlYXRlVGFnQnVja2V0c1xuICAgIHZhciBtZWRpYW4gPSByZWFjdGlvbnNEYXRhWyBNYXRoLmZsb29yKHJlYWN0aW9uc0RhdGEubGVuZ3RoLzIpIF0uY291bnQ7XG4gICAgdmFyIHRvdGFsID0gMDtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG51bVJlYWN0aW9uczsgaSsrKSB7XG4gICAgICAgIHRvdGFsICs9IHJlYWN0aW9uc0RhdGFbaV0uY291bnQ7XG4gICAgfVxuICAgIHZhciBhdmVyYWdlID0gTWF0aC5mbG9vcih0b3RhbCAvIG51bVJlYWN0aW9ucyk7XG4gICAgdmFyIG1pZFZhbHVlID0gKCBtZWRpYW4gPiBhdmVyYWdlICkgPyBtZWRpYW4gOiBhdmVyYWdlO1xuXG4gICAgdmFyIGxheW91dENsYXNzZXMgPSBbXTtcbiAgICB2YXIgbnVtSGFsZnNpZXMgPSAwO1xuICAgIHZhciBudW1GdWxsID0gMDtcbiAgICBmb3IgKHZhciBqID0gMDsgaiA8IG51bVJlYWN0aW9uczsgaisrKSB7XG4gICAgICAgIGlmIChyZWFjdGlvbnNEYXRhW2pdLmNvdW50ID4gbWlkVmFsdWUpIHtcbiAgICAgICAgICAgIGxheW91dENsYXNzZXNbal0gPSBDTEFTU19GVUxMO1xuICAgICAgICAgICAgbnVtRnVsbCsrO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbGF5b3V0Q2xhc3Nlc1tqXSA9IENMQVNTX0hBTEY7XG4gICAgICAgICAgICBudW1IYWxmc2llcysrO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChudW1IYWxmc2llcyAlIDIgIT09IDApIHtcbiAgICAgICAgLy8gSWYgdGhlcmUgYXJlIGFuIG9kZCBudW1iZXIgb2YgaGFsZi1zaXplZCBib3hlcywgbWFrZSBvbmUgb2YgdGhlbSBmdWxsLlxuICAgICAgICBpZiAobnVtRnVsbCA9PT0gMCkge1xuICAgICAgICAgICAgLy8gSWYgdGhlcmUgYXJlIG5vIG90aGVyIGZ1bGwtc2l6ZSBib3hlcywgbWFrZSB0aGUgZmlyc3Qgb25lIGZ1bGwtc2l6ZS5cbiAgICAgICAgICAgIGxheW91dENsYXNzZXNbMF0gPSBDTEFTU19GVUxMO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gT3RoZXJ3aXNlLCBzaW1wbHkgc3RyZXRjaCB0aGUgbGFzdCBib3ggdG8gZmlsbCB0aGUgYXZhaWxhYmxlIHdpZHRoICh0aGlzIGtlZXBzIHRoZSBzbWFsbGVyIGZvbnQgc2l6ZSkuXG4gICAgICAgICAgICBsYXlvdXRDbGFzc2VzW251bVJlYWN0aW9ucyAtIDFdID0gQ0xBU1NfSEFMRl9TVFJFVENIO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgbGF5b3V0Q2xhc3NlczogbGF5b3V0Q2xhc3Nlc1xuICAgIH07XG59XG5cbmZ1bmN0aW9uIHNpemVSZWFjdGlvblRleHRUb0ZpdCgkcmVhY3Rpb25zV2luZG93KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIHNpemVSZWFjdGlvblRleHRUb0ZpdChub2RlKSB7XG4gICAgICAgIHZhciAkZWxlbWVudCA9ICQobm9kZSk7XG4gICAgICAgIHZhciBvcmlnaW5hbERpc3BsYXkgPSAkcmVhY3Rpb25zV2luZG93LmNzcygnZGlzcGxheScpO1xuICAgICAgICBpZiAob3JpZ2luYWxEaXNwbGF5ID09PSAnbm9uZScpIHsgLy8gSWYgd2UncmUgc2l6aW5nIHRoZSBib3hlcyBiZWZvcmUgdGhlIHdpZGdldCBpcyBkaXNwbGF5ZWQsIHRlbXBvcmFyaWx5IGRpc3BsYXkgaXQgb2Zmc2NyZWVuLlxuICAgICAgICAgICAgJHJlYWN0aW9uc1dpbmRvdy5jc3Moe2Rpc3BsYXk6ICdibG9jaycsIGxlZnQ6ICcxMDAlJ30pO1xuICAgICAgICB9XG4gICAgICAgIHZhciBob3Jpem9udGFsUmF0aW8gPSBub2RlLmNsaWVudFdpZHRoIC8gbm9kZS5zY3JvbGxXaWR0aDtcbiAgICAgICAgaWYgKGhvcml6b250YWxSYXRpbyA8IDEuMCkgeyAvLyBJZiB0aGUgdGV4dCBkb2Vzbid0IGZpdCwgZmlyc3QgdHJ5IHRvIHdyYXAgaXQgdG8gdHdvIGxpbmVzLiBUaGVuIHNjYWxlIGl0IGRvd24gaWYgc3RpbGwgbmVjZXNzYXJ5LlxuICAgICAgICAgICAgdmFyIHRleHQgPSBub2RlLmlubmVySFRNTDtcbiAgICAgICAgICAgIHZhciBtaWQgPSBNYXRoLmNlaWwodGV4dC5sZW5ndGggLyAyKTsgLy8gTG9vayBmb3IgdGhlIGNsb3Nlc3Qgc3BhY2UgdG8gdGhlIG1pZGRsZSwgd2VpZ2h0ZWQgc2xpZ2h0bHkgKE1hdGguY2VpbCkgdG93YXJkIGEgc3BhY2UgaW4gdGhlIHNlY29uZCBoYWxmLlxuICAgICAgICAgICAgdmFyIHNlY29uZEhhbGZJbmRleCA9IHRleHQuaW5kZXhPZignICcsIG1pZCk7XG4gICAgICAgICAgICB2YXIgZmlyc3RIYWxmSW5kZXggPSB0ZXh0Lmxhc3RJbmRleE9mKCcgJywgbWlkKTtcbiAgICAgICAgICAgIHZhciBzcGxpdEluZGV4ID0gTWF0aC5hYnMoc2Vjb25kSGFsZkluZGV4IC0gbWlkKSA8IE1hdGguYWJzKG1pZCAtIGZpcnN0SGFsZkluZGV4KSA/IHNlY29uZEhhbGZJbmRleCA6IGZpcnN0SGFsZkluZGV4O1xuICAgICAgICAgICAgaWYgKHNwbGl0SW5kZXggPCAxKSB7XG4gICAgICAgICAgICAgICAgLy8gSWYgdGhlcmUncyBubyBzcGFjZSBpbiB0aGUgdGV4dCwganVzdCBzcGxpdCB0aGUgdGV4dC4gU3BsaXQgb24gdGhlIG92ZXJmbG93IHJhdGlvIGlmIHRoZSB0b3AgbGluZSB3aWxsXG4gICAgICAgICAgICAgICAgLy8gaGF2ZSBtb3JlIGNoYXJhY3RlcnMgdGhhbiB0aGUgYm90dG9tIChzbyBpdCBsb29rcyBsaWtlIHRoZSB0ZXh0IG5hdHVyYWxseSB3cmFwcykgb3Igb3RoZXJ3aXNlIGluIHRoZSBtaWRkbGUuXG4gICAgICAgICAgICAgICAgc3BsaXRJbmRleCA9IGhvcml6b250YWxSYXRpbyA+IDAuNSA/IE1hdGguY2VpbCh0ZXh0Lmxlbmd0aCAqIGhvcml6b250YWxSYXRpbykgOiBNYXRoLmNlaWwodGV4dC5sZW5ndGggLyAyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIFNwbGl0IHRoZSB0ZXh0IGFuZCB0aGVuIHNlZSBob3cgaXQgZml0cy5cbiAgICAgICAgICAgIG5vZGUuaW5uZXJIVE1MID0gdGV4dC5zbGljZSgwLCBzcGxpdEluZGV4KSArICc8YnI+JyArIHRleHQuc2xpY2Uoc3BsaXRJbmRleCk7XG4gICAgICAgICAgICB2YXIgd3JhcHBlZEhvcml6b250YWxSYXRpbyA9IG5vZGUuY2xpZW50V2lkdGggLyBub2RlLnNjcm9sbFdpZHRoO1xuICAgICAgICAgICAgaWYgKHdyYXBwZWRIb3Jpem9udGFsUmF0aW8gPCAxKSB7XG4gICAgICAgICAgICAgICAgJGVsZW1lbnQuY3NzKCdmb250LXNpemUnLCBNYXRoLm1heCgxMCwgTWF0aC5mbG9vcihwYXJzZUludCgkZWxlbWVudC5jc3MoJ2ZvbnQtc2l6ZScpKSAqIHdyYXBwZWRIb3Jpem9udGFsUmF0aW8pKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBTaHJpbmsgdGhlIGNvbnRhaW5pbmcgYm94IHBhZGRpbmcgaWYgbmVjZXNzYXJ5IHRvIGZpdCB0aGUgJ2NvdW50J1xuICAgICAgICAgICAgdmFyIGNvdW50ID0gbm9kZS5wYXJlbnROb2RlLnF1ZXJ5U2VsZWN0b3IoJy5hbnRlbm5hLXJlYWN0aW9uLWNvdW50Jyk7XG4gICAgICAgICAgICBpZiAoY291bnQpIHtcbiAgICAgICAgICAgICAgICB2YXIgYXBwcm94SGVpZ2h0ID0gcGFyc2VJbnQoJGVsZW1lbnQuY3NzKCdmb250LXNpemUnKSkgKiAyOyAvLyBBdCB0aGlzIHBvaW50IHRoZSBicm93c2VyIHdvbid0IGdpdmUgdXMgYSByZWFsIGhlaWdodCwgc28gd2UgbmVlZCB0byBlc3RpbWF0ZSBvdXJzZWx2ZXNcbiAgICAgICAgICAgICAgICB2YXIgY2xpZW50QXJlYSA9IGNvbXB1dGVBdmFpbGFibGVDbGllbnRBcmVhKG5vZGUucGFyZW50Tm9kZSk7XG4gICAgICAgICAgICAgICAgdmFyIHJlbWFpbmluZ1NwYWNlID0gY2xpZW50QXJlYSAtIGFwcHJveEhlaWdodDtcbiAgICAgICAgICAgICAgICB2YXIgY291bnRIZWlnaHQgPSBjb21wdXRlTmVlZGVkSGVpZ2h0KGNvdW50KTtcbiAgICAgICAgICAgICAgICBpZiAocmVtYWluaW5nU3BhY2UgPCBjb3VudEhlaWdodCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgJHBhcmVudCA9ICQobm9kZS5wYXJlbnROb2RlKTtcbiAgICAgICAgICAgICAgICAgICAgJHBhcmVudC5jc3MoJ3BhZGRpbmctdG9wJywgcGFyc2VJbnQoJHBhcmVudC5jc3MoJ3BhZGRpbmctdG9wJykpIC0gKChjb3VudEhlaWdodC1yZW1haW5pbmdTcGFjZSkvMikgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9yaWdpbmFsRGlzcGxheSA9PT0gJ25vbmUnKSB7XG4gICAgICAgICAgICAkcmVhY3Rpb25zV2luZG93LmNzcyh7ZGlzcGxheTogJycsIGxlZnQ6ICcnfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHRlYXJkb3duOiBmdW5jdGlvbigpIHt9XG4gICAgICAgIH07XG4gICAgfTtcbn1cblxuZnVuY3Rpb24gY29tcHV0ZUF2YWlsYWJsZUNsaWVudEFyZWEobm9kZSkge1xuICAgIHZhciBub2RlU3R5bGUgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShub2RlKTtcbiAgICByZXR1cm4gcGFyc2VJbnQobm9kZVN0eWxlLmhlaWdodCkgLSBwYXJzZUludChub2RlU3R5bGUucGFkZGluZ1RvcCkgLSBwYXJzZUludChub2RlU3R5bGUucGFkZGluZ0JvdHRvbSk7XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVOZWVkZWRIZWlnaHQobm9kZSkge1xuICAgIHZhciBub2RlU3R5bGUgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShub2RlKTtcbiAgICByZXR1cm4gcGFyc2VJbnQobm9kZVN0eWxlLmhlaWdodCkgKyBwYXJzZUludChub2RlU3R5bGUubWFyZ2luVG9wKSArIHBhcnNlSW50KG5vZGVTdHlsZS5tYXJnaW5Cb3R0b20pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBzaXplVG9GaXQ6IHNpemVSZWFjdGlvblRleHRUb0ZpdCxcbiAgICBjb21wdXRlTGF5b3V0RGF0YTogY29tcHV0ZUxheW91dERhdGFcbn07IiwidmFyIFVybFBhcmFtcyA9IHJlcXVpcmUoJy4vdXJsLXBhcmFtcycpO1xuXG52YXIgc2VnbWVudDtcblxuZnVuY3Rpb24gZ2V0U2VnbWVudChncm91cFNldHRpbmdzKSB7XG4gICAgaWYgKCFzZWdtZW50KSB7XG4gICAgICAgIHNlZ21lbnQgPSBjb21wdXRlU2VnbWVudChncm91cFNldHRpbmdzKTtcbiAgICB9XG4gICAgcmV0dXJuIHNlZ21lbnQ7XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVTZWdtZW50KGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgc2VnbWVudHMgPSBbICdzdycsICd4c3cnIF07XG4gICAgdmFyIHNlZ21lbnRPdmVycmlkZSA9IFVybFBhcmFtcy5nZXRVcmxQYXJhbSgnYW50ZW5uYVNlZ21lbnQnKTtcbiAgICBpZiAoc2VnbWVudE92ZXJyaWRlKSB7XG4gICAgICAgIHN0b3JlU2VnbWVudChzZWdtZW50T3ZlcnJpZGUpO1xuICAgICAgICByZXR1cm4gc2VnbWVudE92ZXJyaWRlO1xuICAgIH1cbiAgICB2YXIgc2VnbWVudDtcbiAgICBpZiAoaXNTZWdtZW50R3JvdXAoKSkge1xuICAgICAgICBzZWdtZW50ID0gcmVhZFNlZ21lbnQoKTtcbiAgICAgICAgaWYgKCFzZWdtZW50KSB7XG4gICAgICAgICAgICBzZWdtZW50ID0gY3JlYXRlU2VnbWVudChncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgIHNlZ21lbnQgPSBzdG9yZVNlZ21lbnQoc2VnbWVudCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHNlZ21lbnQ7XG5cbiAgICBmdW5jdGlvbiByZWFkU2VnbWVudCgpIHtcbiAgICAgICAgLy8gUmV0dXJucyB0aGUgc3RvcmVkIHNlZ21lbnQsIGJ1dCBvbmx5IGlmIGl0IGlzIG9uZSBvZiB0aGUgY3VycmVudCB2YWxpZCBzZWdtZW50cy5cbiAgICAgICAgdmFyIHNlZ21lbnQgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnYW50X3NlZ21lbnQnKTtcbiAgICAgICAgaWYgKHNlZ21lbnQpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2VnbWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoc2VnbWVudCA9PT0gc2VnbWVudHNbaV0pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNlZ21lbnQ7IC8vIFZhbGlkIHNlZ21lbnQuIFJldHVybi5cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjcmVhdGVTZWdtZW50KGdyb3VwU2V0dGluZ3MpIHtcbiAgICAgICAgcmV0dXJuIHNlZ21lbnRzW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIHNlZ21lbnRzLmxlbmd0aCldO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHN0b3JlU2VnbWVudChzZWdtZW50KSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnYW50X3NlZ21lbnQnLCBzZWdtZW50KTtcbiAgICAgICAgfSBjYXRjaChlcnJvcikge1xuICAgICAgICAgICAgLy8gU29tZSBicm93c2VycyAobW9iaWxlIFNhZmFyaSkgdGhyb3cgYW4gZXhjZXB0aW9uIHdoZW4gaW4gcHJpdmF0ZSBicm93c2luZyBtb2RlLlxuICAgICAgICAgICAgLy8gSWYgdGhpcyBoYXBwZW5zLCBmYWxsIGJhY2sgdG8gYSBkZWZhdWx0IHZhbHVlIHRoYXQgd2lsbCBhdCBsZWFzdCBnaXZlIHVzIHN0YWJsZSBiZWhhdmlvci5cbiAgICAgICAgICAgIHNlZ21lbnQgPSBzZWdtZW50c1swXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc2VnbWVudDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpc1NlZ21lbnRHcm91cCgpIHtcbiAgICAgICAgdmFyIGdyb3VwTmFtZSA9IGdyb3VwU2V0dGluZ3MuZ3JvdXBOYW1lKCk7XG4gICAgICAgIHZhciB0ZXN0R3JvdXBzID0gWyAnYnVzdGxlLmNvbScsICdsb2NhbC5hbnRlbm5hLmlzOjgwODEnIF07XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGVzdEdyb3Vwcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKHRlc3RHcm91cHNbaV0gPT09IGdyb3VwTmFtZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGlzRXhwYW5kZWRTdW1tYXJ5U2VnbWVudChncm91cFNldHRpbmdzKSB7XG4gICAgcmV0dXJuIGdldFNlZ21lbnQoZ3JvdXBTZXR0aW5ncykgPT09ICd4c3cnO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBnZXRTZWdtZW50OiBnZXRTZWdtZW50LFxuICAgIGlzRXhwYW5kZWRTdW1tYXJ5U2VnbWVudDogaXNFeHBhbmRlZFN1bW1hcnlTZWdtZW50XG59OyIsInZhciBKU09OVXRpbHMgPSByZXF1aXJlKCcuL2pzb24tdXRpbHMnKTtcblxudmFyIGx0c0RhdGE7XG52YXIgc3RzRGF0YTtcblxuZnVuY3Rpb24gZ2V0TG9uZ1Rlcm1TZXNzaW9uSWQoKSB7XG4gICAgaWYgKCFsdHNEYXRhKSB7XG4gICAgICAgIGx0c0RhdGEgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnYW50X2x0cycpO1xuICAgICAgICBpZiAoIWx0c0RhdGEpIHtcbiAgICAgICAgICAgIGx0c0RhdGEgPSBjcmVhdGVHdWlkKCk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdhbnRfbHRzJywgbHRzRGF0YSk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIC8vIFNvbWUgYnJvd3NlcnMgKG1vYmlsZSBTYWZhcmkpIHRocm93IGFuIGV4Y2VwdGlvbiB3aGVuIGluIHByaXZhdGUgYnJvd3NpbmcgbW9kZS5cbiAgICAgICAgICAgICAgICAvLyBOb3RoaW5nIHdlIGNhbiBkbyBhYm91dCBpdC4gSnVzdCBmYWxsIHRocm91Z2ggYW5kIHJldHVybiB0aGUgZGF0YSB3ZSBoYXZlIGluIG1lbW9yeS5cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbHRzRGF0YTtcbn1cblxuZnVuY3Rpb24gZ2V0U2hvcnRUZXJtU2Vzc2lvbklkKCkge1xuICAgIGlmICghc3RzRGF0YSkge1xuICAgICAgICB2YXIganNvbiA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdhbnRfc3RzJyk7XG4gICAgICAgIGlmIChqc29uKSB7XG4gICAgICAgICAgICBzdHNEYXRhID0gSlNPTi5wYXJzZShqc29uKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAoc3RzRGF0YSAmJiBEYXRlLm5vdygpID4gc3RzRGF0YS5leHBpcmVzKSB7XG4gICAgICAgIHN0c0RhdGEgPSBudWxsOyAvLyBleHBpcmUgdGhlIHNlc3Npb25cbiAgICB9XG4gICAgaWYgKCFzdHNEYXRhKSB7XG4gICAgICAgIHN0c0RhdGEgPSB7IGd1aWQ6IGNyZWF0ZUd1aWQoKSB9OyAvLyBjcmVhdGUgYSBuZXcgc2Vzc2lvblxuICAgIH1cbiAgICAvLyBBbHdheXMgc2V0IGEgbmV3IGV4cGlyZXMgdGltZSwgc28gdGhhdCB3ZSBrZWVwIGV4dGVuZGluZyB0aGUgdGltZSBhcyBsb25nIGFzIHRoZSB1c2VyIGlzIGFjdGl2ZVxuICAgIHZhciBtaW51dGVzID0gMTU7XG4gICAgc3RzRGF0YS5leHBpcmVzID0gRGF0ZS5ub3coKSArIG1pbnV0ZXMgKiA2MDAwMDtcbiAgICB0cnkge1xuICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnYW50X3N0cycsIEpTT05VdGlscy5zdHJpbmdpZnkoc3RzRGF0YSkpO1xuICAgIH0gY2F0Y2goZXJyb3IpIHtcbiAgICAgICAgLy8gU29tZSBicm93c2VycyAobW9iaWxlIFNhZmFyaSkgdGhyb3cgYW4gZXhjZXB0aW9uIHdoZW4gaW4gcHJpdmF0ZSBicm93c2luZyBtb2RlLlxuICAgICAgICAvLyBOb3RoaW5nIHdlIGNhbiBkbyBhYm91dCBpdC4gSnVzdCBmYWxsIHRocm91Z2ggYW5kIHJldHVybiB0aGUgZGF0YSB3ZSBoYXZlIGluIG1lbW9yeS5cbiAgICB9XG4gICAgcmV0dXJuIHN0c0RhdGEuZ3VpZDtcbn1cblxuZnVuY3Rpb24gY3JlYXRlR3VpZCgpIHtcbiAgICAvLyBDb2RlIGNvcGllZCBmcm9tIGVuZ2FnZV9mdWxsIChvcmlnaW5hbGx5LCBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzEwNTAzNC9jcmVhdGUtZ3VpZC11dWlkLWluLWphdmFzY3JpcHQpXG4gICAgcmV0dXJuICd4eHh4eHh4eC14eHh4LTR4eHgteXh4eC14eHh4eHh4eHh4eHgnLnJlcGxhY2UoL1t4eV0vZywgZnVuY3Rpb24gKGMpIHtcbiAgICAgICAgdmFyIHIgPSBNYXRoLnJhbmRvbSgpICogMTYgfCAwLCB2ID0gYyA9PSAneCcgPyByIDogKHIgJiAweDMgfCAweDgpO1xuICAgICAgICByZXR1cm4gdi50b1N0cmluZygxNik7XG4gICAgfSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGdldExvbmdUZXJtU2Vzc2lvbjogZ2V0TG9uZ1Rlcm1TZXNzaW9uSWQsXG4gICAgZ2V0U2hvcnRUZXJtU2Vzc2lvbjogZ2V0U2hvcnRUZXJtU2Vzc2lvbklkXG59OyIsInZhciBDYWxsYmFja1N1cHBvcnQgPSByZXF1aXJlKCcuL2NhbGxiYWNrLXN1cHBvcnQnKTtcblxuLy8gVGhpcyBtb2R1bGUgYWxsb3dzIHVzIHRvIHJlZ2lzdGVyIGNhbGxiYWNrcyB0aGF0IGFyZSB0aHJvdHRsZWQgaW4gdGhlaXIgZnJlcXVlbmN5LiBUaGlzIGlzIHVzZWZ1bCBmb3IgZXZlbnRzIGxpa2Vcbi8vIHJlc2l6ZSBhbmQgc2Nyb2xsLCB3aGljaCBjYW4gYmUgZmlyZWQgYXQgYW4gZXh0cmVtZWx5IGhpZ2ggcmF0ZS5cblxudmFyIHRocm90dGxlZExpc3RlbmVycyA9IHt9O1xuXG5mdW5jdGlvbiBvbih0eXBlLCBjYWxsYmFjaykge1xuICAgIHRocm90dGxlZExpc3RlbmVyc1t0eXBlXSA9IHRocm90dGxlZExpc3RlbmVyc1t0eXBlXSB8fCBjcmVhdGVUaHJvdHRsZWRMaXN0ZW5lcih0eXBlKTtcbiAgICB0aHJvdHRsZWRMaXN0ZW5lcnNbdHlwZV0uYWRkQ2FsbGJhY2soY2FsbGJhY2spO1xufVxuXG5mdW5jdGlvbiBvZmYodHlwZSwgY2FsbGJhY2spIHtcbiAgICB2YXIgZXZlbnRMaXN0ZW5lciA9IHRocm90dGxlZExpc3RlbmVyc1t0eXBlXTtcbiAgICBpZiAoZXZlbnRMaXN0ZW5lcikge1xuICAgICAgICBldmVudExpc3RlbmVyLnJlbW92ZUNhbGxiYWNrKGNhbGxiYWNrKTtcbiAgICAgICAgaWYgKGV2ZW50TGlzdGVuZXIuaXNFbXB0eSgpKSB7XG4gICAgICAgICAgICBldmVudExpc3RlbmVyLnRlYXJkb3duKCk7XG4gICAgICAgICAgICBkZWxldGUgdGhyb3R0bGVkTGlzdGVuZXJzW3R5cGVdO1xuICAgICAgICB9XG4gICAgfVxufVxuXG4vLyBDcmVhdGVzIGEgbGlzdGVuZXIgb24gdGhlIHBhcnRpY3VsYXIgZXZlbnQgdHlwZS4gQ2FsbGJhY2tzIGFkZGVkIHRvIHRoaXMgbGlzdGVuZXIgd2lsbCBiZSB0aHJvdHRsZWQuXG5mdW5jdGlvbiBjcmVhdGVUaHJvdHRsZWRMaXN0ZW5lcih0eXBlKSB7XG4gICAgdmFyIGNhbGxiYWNrcyA9IENhbGxiYWNrU3VwcG9ydC5jcmVhdGUoKTtcbiAgICB2YXIgZXZlbnRUaW1lb3V0O1xuICAgIHNldHVwKCk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgYWRkQ2FsbGJhY2s6IGNhbGxiYWNrcy5hZGQsXG4gICAgICAgIHJlbW92ZUNhbGxiYWNrOiBjYWxsYmFja3MucmVtb3ZlLFxuICAgICAgICBpc0VtcHR5OiBjYWxsYmFja3MuaXNFbXB0eSxcbiAgICAgICAgdGVhcmRvd246IHRlYXJkb3duXG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIGhhbmRsZUV2ZW50KCkge1xuICAgICAgIGlmICghZXZlbnRUaW1lb3V0KSB7XG4gICAgICAgICAgIGV2ZW50VGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICBjYWxsYmFja3MuaW52b2tlQWxsKCk7XG4gICAgICAgICAgICAgICBldmVudFRpbWVvdXQgPSBudWxsO1xuICAgICAgICAgICB9LCA2Nik7IC8vIDE1IEZQU1xuICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzZXR1cCgpIHtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIodHlwZSwgaGFuZGxlRXZlbnQpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHRlYXJkb3duKCkge1xuICAgICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcih0eXBlLCBoYW5kbGVFdmVudCk7XG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgb246IG9uLFxuICAgIG9mZjogb2ZmXG59OyIsIlxuLy8gVE9ETzogQ29uc2lkZXIgYWRkaW5nIHN1cHBvcnQgZm9yIHRoZSBNUyBwcm9wcmlldGFyeSBcIlBvaW50ZXIgRXZlbnRzXCIgQVBJLlxuXG4vLyBTZXRzIHVwIHRoZSBnaXZlbiBlbGVtZW50IHRvIGJlIGNhbGxlZCB3aXRoIGEgVG91Y2hFdmVudCB0aGF0IHdlIHJlY29nbml6ZSBhcyBhIHRhcC5cbmZ1bmN0aW9uIHNldHVwVG91Y2hUYXBFdmVudHMoZWxlbWVudCwgY2FsbGJhY2spIHtcbiAgICB2YXIgdGltZW91dCA9IDQwMDsgLy8gVGhpcyBpcyB0aGUgdGltZSBiZXR3ZWVuIHRvdWNoc3RhcnQgYW5kIHRvdWNoZW5kIHRoYXQgd2UgdXNlIHRvIGRpc3Rpbmd1aXNoIGEgdGFwIGZyb20gYSBsb25nIHByZXNzLlxuICAgIHZhciB2YWxpZFRhcCA9IGZhbHNlO1xuICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRvdWNoU3RhcnQpO1xuICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgdG91Y2hNb3ZlKTtcbiAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoY2FuY2VsJywgdG91Y2hDYW5jZWwpO1xuICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCB0b3VjaEVuZCk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdGVhcmRvd246IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdG91Y2hTdGFydCk7XG4gICAgICAgICAgICBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIHRvdWNoTW92ZSk7XG4gICAgICAgICAgICBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoY2FuY2VsJywgdG91Y2hDYW5jZWwpO1xuICAgICAgICAgICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIHRvdWNoRW5kKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBmdW5jdGlvbiB0b3VjaFN0YXJ0KGV2ZW50KSB7XG4gICAgICAgIHZhbGlkVGFwID0gdHJ1ZTtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhbGlkVGFwID0gZmFsc2U7XG4gICAgICAgIH0sIHRpbWVvdXQpO1xuICAgIH1cbiAgICBmdW5jdGlvbiB0b3VjaEVuZChldmVudCkge1xuICAgICAgICBpZiAodmFsaWRUYXAgJiYgZXZlbnQuY2hhbmdlZFRvdWNoZXMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhldmVudCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gdG91Y2hNb3ZlKGV2ZW50KSB7XG4gICAgICAgIHZhbGlkVGFwID0gZmFsc2U7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHRvdWNoQ2FuY2VsKGV2ZW50KSB7XG4gICAgICAgIHZhbGlkVGFwID0gZmFsc2U7XG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgc2V0dXBUYXA6IHNldHVwVG91Y2hUYXBFdmVudHNcbn07IiwiXG5cbmZ1bmN0aW9uIHRvZ2dsZVRyYW5zaXRpb25DbGFzcygkZWxlbWVudCwgY2xhc3NOYW1lLCBzdGF0ZSwgbmV4dFN0ZXApIHtcbiAgICAkZWxlbWVudC5vbihcInRyYW5zaXRpb25lbmQgd2Via2l0VHJhbnNpdGlvbkVuZCBvVHJhbnNpdGlvbkVuZCBNU1RyYW5zaXRpb25FbmRcIixcbiAgICAgICAgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgIC8vIG9uY2UgdGhlIENTUyB0cmFuc2l0aW9uIGlzIGNvbXBsZXRlLCBjYWxsIG91ciBuZXh0IHN0ZXBcbiAgICAgICAgICAgIC8vIFNlZTogaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy85MjU1Mjc5L2NhbGxiYWNrLXdoZW4tY3NzMy10cmFuc2l0aW9uLWZpbmlzaGVzXG4gICAgICAgICAgICBpZiAoZXZlbnQudGFyZ2V0ID09IGV2ZW50LmN1cnJlbnRUYXJnZXQpIHtcbiAgICAgICAgICAgICAgICAkZWxlbWVudC5vZmYoXCJ0cmFuc2l0aW9uZW5kIHdlYmtpdFRyYW5zaXRpb25FbmQgb1RyYW5zaXRpb25FbmQgTVNUcmFuc2l0aW9uRW5kXCIpO1xuICAgICAgICAgICAgICAgIGlmIChuZXh0U3RlcCkge1xuICAgICAgICAgICAgICAgICAgICBuZXh0U3RlcCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICk7XG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gVGhpcyB3b3JrYXJvdW5kIGdldHMgdXMgY29uc2lzdGVudCB0cmFuc2l0aW9uZW5kIGV2ZW50cywgd2hpY2ggY2FuIG90aGVyd2lzZSBiZSBmbGFreSBpZiB3ZSdyZSBzZXR0aW5nIG90aGVyXG4gICAgICAgIC8vIGNsYXNzZXMgYXQgdGhlIHNhbWUgdGltZSBhcyB0cmFuc2l0aW9uIGNsYXNzZXMuXG4gICAgICAgICRlbGVtZW50LnRvZ2dsZUNsYXNzKGNsYXNzTmFtZSwgc3RhdGUpO1xuICAgIH0sIDIwKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgdG9nZ2xlQ2xhc3M6IHRvZ2dsZVRyYW5zaXRpb25DbGFzc1xufTsiLCJ2YXIgUFJPRF9TRVJWRVJfVVJMID0gXCJodHRwczovL3d3dy5hbnRlbm5hLmlzXCI7IC8vIFRPRE86IHd3dz8gaG93IGFib3V0IGFudGVubmEuaXMgb3IgYXBpLmFudGVubmEuaXM/XG52YXIgREVWX1NFUlZFUl9VUkwgPSBcImh0dHA6Ly9sb2NhbC1zdGF0aWMuYW50ZW5uYS5pczo4MDgxXCI7XG52YXIgVEVTVF9TRVJWRVJfVVJMID0gJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMSc7XG52YXIgQU1BWk9OX1MzX1VSTCA9ICcvL2Nkbi5hbnRlbm5hLmlzJztcblxudmFyIFBST0RfRVZFTlRfU0VSVkVSX1VSTCA9ICdodHRwczovL2V2ZW50cy5hbnRlbm5hLmlzJztcbnZhciBERVZfRVZFTlRfU0VSVkVSX1VSTCA9ICdodHRwOi8vbm9kZWJxLmRvY2tlcjozMDAwJztcblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIFBST0RVQ1RJT046IFBST0RfU0VSVkVSX1VSTCxcbiAgICBERVZFTE9QTUVOVDogREVWX1NFUlZFUl9VUkwsXG4gICAgVEVTVDogVEVTVF9TRVJWRVJfVVJMLFxuICAgIEFNQVpPTl9TMzogQU1BWk9OX1MzX1VSTCxcbiAgICBQUk9EVUNUSU9OX0VWRU5UUzogUFJPRF9FVkVOVF9TRVJWRVJfVVJMLFxuICAgIERFVkVMT1BNRU5UX0VWRU5UUzogREVWX0VWRU5UX1NFUlZFUl9VUkxcbn07IiwiXG52YXIgdXJsUGFyYW1zO1xuXG5mdW5jdGlvbiBnZXRVcmxQYXJhbShrZXkpIHtcbiAgICBpZiAoIXVybFBhcmFtcykge1xuICAgICAgICB1cmxQYXJhbXMgPSBwYXJzZVVybFBhcmFtcygpO1xuICAgIH1cbiAgICByZXR1cm4gdXJsUGFyYW1zW2tleV07XG59XG5cbmZ1bmN0aW9uIHBhcnNlVXJsUGFyYW1zKCkge1xuICAgIHZhciBxdWVyeVN0cmluZyA9IHdpbmRvdy5sb2NhdGlvbi5zZWFyY2g7XG4gICAgdmFyIHVybFBhcmFtcyA9IHt9O1xuICAgIHZhciBlLFxuICAgIGEgPSAvXFwrL2csICAvLyBSZWdleCBmb3IgcmVwbGFjaW5nIGFkZGl0aW9uIHN5bWJvbCB3aXRoIGEgc3BhY2VcbiAgICByID0gLyhbXiY9XSspPT8oW14mXSopL2csXG4gICAgZCA9IGZ1bmN0aW9uIChzKSB7IHJldHVybiBkZWNvZGVVUklDb21wb25lbnQocy5yZXBsYWNlKGEsIFwiIFwiKSk7IH0sXG4gICAgcSA9IHF1ZXJ5U3RyaW5nLnN1YnN0cmluZygxKTtcblxuICAgIHdoaWxlIChlID0gci5leGVjKHEpKSB7XG4gICAgICAgIHVybFBhcmFtc1tkKGVbMV0pXSA9IGQoZVsyXSk7XG4gICAgfVxuICAgIHJldHVybiB1cmxQYXJhbXM7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGdldFVybFBhcmFtOiBnZXRVcmxQYXJhbVxufTsiLCJ2YXIgQXBwTW9kZSA9IHJlcXVpcmUoJy4vYXBwLW1vZGUnKTtcbnZhciBKU09OVXRpbHMgPSByZXF1aXJlKCcuL2pzb24tdXRpbHMnKTtcbnZhciBVUkxDb25zdGFudHMgPSByZXF1aXJlKCcuL3VybC1jb25zdGFudHMnKTtcblxuZnVuY3Rpb24gZ2V0R3JvdXBTZXR0aW5nc1VybCgpIHtcbiAgICByZXR1cm4gJy9hcGkvc2V0dGluZ3MvJztcbn1cblxuZnVuY3Rpb24gZ2V0UGFnZURhdGFVcmwoKSB7XG4gICAgcmV0dXJuICcvYXBpL3BhZ2VuZXdlci8nO1xufVxuXG5mdW5jdGlvbiBnZXRDcmVhdGVSZWFjdGlvblVybCgpIHtcbiAgICByZXR1cm4gJy9hcGkvdGFnL2NyZWF0ZS8nO1xufVxuXG5mdW5jdGlvbiBnZXRDcmVhdGVDb21tZW50VXJsKCkge1xuICAgIHJldHVybiAnL2FwaS9jb21tZW50L2NyZWF0ZS8nO1xufVxuXG5mdW5jdGlvbiBnZXRGZXRjaENvbW1lbnRVcmwoKSB7XG4gICAgcmV0dXJuICcvYXBpL2NvbW1lbnQvcmVwbGllcy8nO1xufVxuXG5mdW5jdGlvbiBnZXRGZXRjaENvbnRlbnRCb2RpZXNVcmwoKSB7XG4gICAgcmV0dXJuICcvYXBpL2NvbnRlbnQvYm9kaWVzLyc7XG59XG5cbmZ1bmN0aW9uIGdldEZldGNoQ29udGVudFJlY29tbWVuZGF0aW9uVXJsKCkge1xuICAgIHJldHVybiAnL2FwaS9jb250ZW50cmVjLyc7XG59XG5cbmZ1bmN0aW9uIGdldFNoYXJlUmVhY3Rpb25VcmwoKSB7XG4gICAgcmV0dXJuICcvYXBpL3NoYXJlLzsnXG59XG5cbmZ1bmN0aW9uIGdldENyZWF0ZVRlbXBVc2VyVXJsKCkge1xuICAgIHJldHVybiAnL2FwaS90ZW1wdXNlci8nO1xufVxuXG5mdW5jdGlvbiBnZXRTaGFyZVdpbmRvd1VybCgpIHtcbiAgICByZXR1cm4gJy9zdGF0aWMvc2hhcmUuaHRtbCc7XG59XG5cbmZ1bmN0aW9uIGdldEV2ZW50VXJsKCkge1xuICAgIHJldHVybiAnL2luc2VydCc7IC8vIE5vdGUgdGhhdCB0aGlzIFVSTCBpcyBmb3IgdGhlIGV2ZW50IHNlcnZlciwgbm90IHRoZSBhcHAgc2VydmVyLlxufVxuXG5mdW5jdGlvbiBhbnRlbm5hTG9naW5VcmwoKSB7XG4gICAgcmV0dXJuICcvYW50X2xvZ2luLyc7XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVJbWFnZVVybCgkZWxlbWVudCwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciB0cmFuc2Zvcm0gPSBnZXRJbWFnZVVSTFRyYW5zZm9ybShncm91cFNldHRpbmdzKTtcbiAgICBpZiAodHJhbnNmb3JtKSB7XG4gICAgICAgIHJldHVybiB0cmFuc2Zvcm0oJGVsZW1lbnQuZ2V0KDApKTtcbiAgICB9XG4gICAgaWYgKGdyb3VwU2V0dGluZ3MubGVnYWN5QmVoYXZpb3IoKSkge1xuICAgICAgICByZXR1cm4gbGVnYWN5Q29tcHV0ZUltYWdlVXJsKCRlbGVtZW50KTtcbiAgICB9XG4gICAgdmFyIGNvbnRlbnQgPSAkZWxlbWVudC5hdHRyKCdhbnQtaXRlbS1jb250ZW50JykgfHwgJGVsZW1lbnQuYXR0cignc3JjJyk7XG4gICAgaWYgKGNvbnRlbnQgJiYgY29udGVudC5pbmRleE9mKCcvLycpICE9PSAwICYmIGNvbnRlbnQuaW5kZXhPZignaHR0cCcpICE9PSAwKSB7IC8vIHByb3RvY29sLXJlbGF0aXZlIG9yIGFic29sdXRlIHVybCwgZS5nLiAvL2RvbWFpbi5jb20vZm9vL2Jhci5wbmcgb3IgaHR0cDovL2RvbWFpbi5jb20vZm9vL2Jhci9wbmdcbiAgICAgICAgaWYgKGNvbnRlbnQuaW5kZXhPZignLycpID09PSAwKSB7IC8vIGRvbWFpbi1yZWxhdGl2ZSB1cmwsIGUuZy4gL2Zvby9iYXIucG5nID0+IGRvbWFpbi5jb20vZm9vL2Jhci5wbmdcbiAgICAgICAgICAgIGNvbnRlbnQgPSB3aW5kb3cubG9jYXRpb24ub3JpZ2luICsgY29udGVudDtcbiAgICAgICAgfSBlbHNlIHsgLy8gcGF0aC1yZWxhdGl2ZSB1cmwsIGUuZy4gYmFyLnBuZyA9PiBkb21haW4uY29tL2Jhei9iYXIucG5nXG4gICAgICAgICAgICB2YXIgcGF0aCA9IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZTtcbiAgICAgICAgICAgIHZhciBpbmRleCA9IHBhdGgubGFzdEluZGV4T2YoJy8nKSArIDE7XG4gICAgICAgICAgICBpZiAocGF0aC5sZW5ndGggPiBpbmRleCkge1xuICAgICAgICAgICAgICAgIHBhdGggPSBwYXRoLnN1YnN0cmluZygwLCBpbmRleCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb250ZW50ID0gd2luZG93LmxvY2F0aW9uLm9yaWdpbiArIHBhdGggKyBjb250ZW50O1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBjb250ZW50O1xufVxuXG5mdW5jdGlvbiBnZXRJbWFnZVVSTFRyYW5zZm9ybShncm91cFNldHRpbmdzKSB7XG4gICAgaWYgKGdyb3VwU2V0dGluZ3MuZ3JvdXBOYW1lKCkuaW5kZXhPZignLmFib3V0LmNvbScpICE9PSAtMSkge1xuICAgICAgICB2YXIgcGF0dGVybiA9IC8oaHR0cDpcXC9cXC9mXFwudHFuXFwuY29tXFwveVxcL1teXFwvXSpcXC8xKVxcL1tMV11cXC8oW15cXC9dXFwvW15cXC9dXFwvW15cXC9dXFwvW15cXC9dXFwvW15cXC9dKikvZ2k7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgICAgICAgICB2YXIgc3JjID0gZWxlbWVudC5nZXRBdHRyaWJ1dGUoJ3NyYycpO1xuICAgICAgICAgICAgaWYgKHNyYykge1xuICAgICAgICAgICAgICAgIHJldHVybiBzcmMucmVwbGFjZShwYXR0ZXJuLCAnJDEvUy8kMicpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuXG4vLyBMZWdhY3kgaW1wbGVtZW50YXRpb24gd2hpY2ggbWFpbnRhaW5zIHRoZSBvbGQgYmVoYXZpb3Igb2YgZW5nYWdlX2Z1bGxcbi8vIFRoaXMgY29kZSBpcyB3cm9uZyBmb3IgVVJMcyB0aGF0IHN0YXJ0IHdpdGggXCIvL1wiLiBJdCBhbHNvIGdpdmVzIHByZWNlZGVuY2UgdG8gdGhlIHNyYyBhdHQgaW5zdGVhZCBvZiBhbnQtaXRlbS1jb250ZW50XG5mdW5jdGlvbiBsZWdhY3lDb21wdXRlSW1hZ2VVcmwoJGVsZW1lbnQpIHtcbiAgICB2YXIgY29udGVudCA9ICRlbGVtZW50LmF0dHIoJ3NyYycpIHx8ICRlbGVtZW50LmF0dHIoJ2FudC1pdGVtLWNvbnRlbnQnKTtcbiAgICBpZiAoY29udGVudCkge1xuICAgICAgICBpZiAoY29udGVudC5pbmRleE9mKCcvJykgPT09IDApIHtcbiAgICAgICAgICAgIGNvbnRlbnQgPSB3aW5kb3cubG9jYXRpb24ub3JpZ2luICsgY29udGVudDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY29udGVudC5pbmRleE9mKCdodHRwJykgIT09IDApIHtcbiAgICAgICAgICAgIGNvbnRlbnQgPSB3aW5kb3cubG9jYXRpb24ub3JpZ2luICsgd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lICsgY29udGVudDtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gY29udGVudDtcbn1cblxuZnVuY3Rpb24gY29tcHV0ZU1lZGlhVXJsKCRlbGVtZW50LCBncm91cFNldHRpbmdzKSB7XG4gICAgaWYgKGdyb3VwU2V0dGluZ3MubGVnYWN5QmVoYXZpb3IoKSkge1xuICAgICAgICByZXR1cm4gbGVnYWN5Q29tcHV0ZU1lZGlhVXJsKCRlbGVtZW50KTtcbiAgICB9XG4gICAgdmFyIGNvbnRlbnQgPSAkZWxlbWVudC5hdHRyKCdhbnQtaXRlbS1jb250ZW50JykgfHwgJGVsZW1lbnQuYXR0cignc3JjJykgfHwgJGVsZW1lbnQuYXR0cignZGF0YScpO1xuICAgIGlmIChjb250ZW50ICYmIGNvbnRlbnQuaW5kZXhPZignLy8nKSAhPT0gMCAmJiBjb250ZW50LmluZGV4T2YoJ2h0dHAnKSAhPT0gMCkgeyAvLyBwcm90b2NvbC1yZWxhdGl2ZSBvciBhYnNvbHV0ZSB1cmwsIGUuZy4gLy9kb21haW4uY29tL2Zvby9iYXIucG5nIG9yIGh0dHA6Ly9kb21haW4uY29tL2Zvby9iYXIvcG5nXG4gICAgICAgIGlmIChjb250ZW50LmluZGV4T2YoJy8nKSA9PT0gMCkgeyAvLyBkb21haW4tcmVsYXRpdmUgdXJsLCBlLmcuIC9mb28vYmFyLnBuZyA9PiBkb21haW4uY29tL2Zvby9iYXIucG5nXG4gICAgICAgICAgICBjb250ZW50ID0gd2luZG93LmxvY2F0aW9uLm9yaWdpbiArIGNvbnRlbnQ7XG4gICAgICAgIH0gZWxzZSB7IC8vIHBhdGgtcmVsYXRpdmUgdXJsLCBlLmcuIGJhci5wbmcgPT4gZG9tYWluLmNvbS9iYXovYmFyLnBuZ1xuICAgICAgICAgICAgdmFyIHBhdGggPSB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWU7XG4gICAgICAgICAgICB2YXIgaW5kZXggPSBwYXRoLmxhc3RJbmRleE9mKCcvJykgKyAxO1xuICAgICAgICAgICAgaWYgKHBhdGgubGVuZ3RoID4gaW5kZXgpIHtcbiAgICAgICAgICAgICAgICBwYXRoID0gcGF0aC5zdWJzdHJpbmcoMCwgaW5kZXgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29udGVudCA9IHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4gKyBwYXRoICsgY29udGVudDtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gY29udGVudDtcbn1cblxuLy8gTGVnYWN5IGltcGxlbWVudGF0aW9uIHdoaWNoIG1haW50YWlucyB0aGUgb2xkIGJlaGF2aW9yIG9mIGVuZ2FnZV9mdWxsXG4vLyBUaGlzIGNvZGUgaXMgd3JvbmcgZm9yIFVSTHMgdGhhdCBzdGFydCB3aXRoIFwiLy9cIi4gSXQgYWxzbyBnaXZlcyBwcmVjZWRlbmNlIHRvIHRoZSBzcmMgYXR0IGluc3RlYWQgb2YgYW50LWl0ZW0tY29udGVudFxuZnVuY3Rpb24gbGVnYWN5Q29tcHV0ZU1lZGlhVXJsKCRlbGVtZW50KSB7XG4gICAgdmFyIGNvbnRlbnQgPSAkZWxlbWVudC5hdHRyKCdhbnQtaXRlbS1jb250ZW50JykgfHwgJGVsZW1lbnQuYXR0cignc3JjJykgfHwgJGVsZW1lbnQuYXR0cignZGF0YScpIHx8ICcnO1xuICAgIGlmIChjb250ZW50KSB7XG4gICAgICAgIGlmIChjb250ZW50LmluZGV4T2YoJy8nKSA9PT0gMCkge1xuICAgICAgICAgICAgY29udGVudCA9IHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4gKyBjb250ZW50O1xuICAgICAgICB9XG4gICAgICAgIGlmIChjb250ZW50LmluZGV4T2YoJ2h0dHAnKSAhPT0gMCkge1xuICAgICAgICAgICAgY29udGVudCA9IHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4gKyB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUgKyBjb250ZW50O1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBjb250ZW50O1xufVxuXG4vLyBSZXR1cm5zIGEgVVJMIGZvciBjb250ZW50IHJlYyB3aGljaCB3aWxsIHRha2UgdGhlIHVzZXIgdG8gdGhlIHRhcmdldCB1cmwgYW5kIHJlY29yZCB0aGUgZ2l2ZW4gY2xpY2sgZXZlbnRcbmZ1bmN0aW9uIGNvbXB1dGVDb250ZW50UmVjVXJsKHRhcmdldFVybCwgY2xpY2tFdmVudCkge1xuICAgIHJldHVybiBhcHBTZXJ2ZXJVcmwoKSArICcvY3IvP3RhcmdldFVybD0nICsgZW5jb2RlVVJJQ29tcG9uZW50KHRhcmdldFVybCkgKyAnJmV2ZW50PScgKyBlbmNvZGVVUklDb21wb25lbnQoSlNPTlV0aWxzLnN0cmluZ2lmeShjbGlja0V2ZW50KSlcbn1cblxuZnVuY3Rpb24gYW1hem9uUzNVcmwoKSB7XG4gICAgcmV0dXJuIFVSTENvbnN0YW50cy5BTUFaT05fUzM7XG59XG5cbi8vIFRPRE86IHJlZmFjdG9yIHVzYWdlIG9mIGFwcCBzZXJ2ZXIgdXJsICsgcmVsYXRpdmUgcm91dGVzXG5mdW5jdGlvbiBhcHBTZXJ2ZXJVcmwoKSB7XG4gICAgaWYgKEFwcE1vZGUudGVzdCkge1xuICAgICAgICByZXR1cm4gVVJMQ29uc3RhbnRzLlRFU1Q7XG4gICAgfSBlbHNlIGlmIChBcHBNb2RlLm9mZmxpbmUpIHtcbiAgICAgICAgcmV0dXJuIFVSTENvbnN0YW50cy5ERVZFTE9QTUVOVDtcbiAgICB9XG4gICAgcmV0dXJuIFVSTENvbnN0YW50cy5QUk9EVUNUSU9OO1xufVxuXG4vLyBUT0RPOiByZWZhY3RvciB1c2FnZSBvZiBldmVudHMgc2VydmVyIHVybCArIHJlbGF0aXZlIHJvdXRlc1xuZnVuY3Rpb24gZXZlbnRzU2VydmVyVXJsKCkge1xuICAgIGlmIChBcHBNb2RlLm9mZmxpbmUpIHtcbiAgICAgICAgcmV0dXJuIFVSTENvbnN0YW50cy5ERVZFTE9QTUVOVF9FVkVOVFM7XG4gICAgfVxuICAgIHJldHVybiBVUkxDb25zdGFudHMuUFJPRFVDVElPTl9FVkVOVFM7XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBhcHBTZXJ2ZXJVcmw6IGFwcFNlcnZlclVybCxcbiAgICBldmVudHNTZXJ2ZXJVcmw6IGV2ZW50c1NlcnZlclVybCxcbiAgICBhbWF6b25TM1VybDogYW1hem9uUzNVcmwsXG4gICAgZ3JvdXBTZXR0aW5nc1VybDogZ2V0R3JvdXBTZXR0aW5nc1VybCxcbiAgICBwYWdlRGF0YVVybDogZ2V0UGFnZURhdGFVcmwsXG4gICAgY3JlYXRlUmVhY3Rpb25Vcmw6IGdldENyZWF0ZVJlYWN0aW9uVXJsLFxuICAgIGNyZWF0ZUNvbW1lbnRVcmw6IGdldENyZWF0ZUNvbW1lbnRVcmwsXG4gICAgZmV0Y2hDb21tZW50VXJsOiBnZXRGZXRjaENvbW1lbnRVcmwsXG4gICAgZmV0Y2hDb250ZW50Qm9kaWVzVXJsOiBnZXRGZXRjaENvbnRlbnRCb2RpZXNVcmwsXG4gICAgZmV0Y2hDb250ZW50UmVjb21tZW5kYXRpb25Vcmw6IGdldEZldGNoQ29udGVudFJlY29tbWVuZGF0aW9uVXJsLFxuICAgIHNoYXJlUmVhY3Rpb25Vcmw6IGdldFNoYXJlUmVhY3Rpb25VcmwsXG4gICAgY3JlYXRlVGVtcFVzZXJVcmw6IGdldENyZWF0ZVRlbXBVc2VyVXJsLFxuICAgIHNoYXJlV2luZG93VXJsOiBnZXRTaGFyZVdpbmRvd1VybCxcbiAgICBhbnRlbm5hTG9naW5Vcmw6IGFudGVubmFMb2dpblVybCxcbiAgICBjb21wdXRlSW1hZ2VVcmw6IGNvbXB1dGVJbWFnZVVybCxcbiAgICBjb21wdXRlTWVkaWFVcmw6IGNvbXB1dGVNZWRpYVVybCxcbiAgICBjb21wdXRlQ29udGVudFJlY1VybDogY29tcHV0ZUNvbnRlbnRSZWNVcmwsXG4gICAgZXZlbnRVcmw6IGdldEV2ZW50VXJsXG59O1xuIiwidmFyIEFwcE1vZGUgPSByZXF1aXJlKCcuL2FwcC1tb2RlJyk7XG52YXIgSlNPTlBDbGllbnQgPSByZXF1aXJlKCcuL2pzb25wLWNsaWVudCcpO1xudmFyIFVSTHMgPSByZXF1aXJlKCcuL3VybHMnKTtcbnZhciBYRE1DbGllbnQgPSByZXF1aXJlKCcuL3hkbS1jbGllbnQnKTtcblxudmFyIGNhY2hlZFVzZXJJbmZvO1xuXG4vLyBGZXRjaCB0aGUgbG9nZ2VkIGluIHVzZXIuIFdpbGwgdHJpZ2dlciBhIG5ldHdvcmsgcmVxdWVzdCB0byBjcmVhdGUgYSB0ZW1wb3JhcnkgdXNlciBpZiBuZWVkZWQuXG5mdW5jdGlvbiBmZXRjaFVzZXIoZ3JvdXBTZXR0aW5ncywgY2FsbGJhY2spIHtcbiAgICBnZXRVc2VyQ29va2llcyhmdW5jdGlvbihjb29raWVzKSB7XG4gICAgICAgIGlmICghY29va2llcy5hbnRfdG9rZW4pIHtcbiAgICAgICAgICAgIGNyZWF0ZVRlbXBVc2VyKGdyb3VwU2V0dGluZ3MsIGNhbGxiYWNrKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHVwZGF0ZVVzZXJGcm9tQ29va2llcyhjb29raWVzKTtcbiAgICAgICAgICAgIGNhbGxiYWNrKGNhY2hlZFVzZXJJbmZvKTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG5mdW5jdGlvbiByZWZyZXNoVXNlckZyb21Db29raWVzKGNhbGxiYWNrKSB7XG4gICAgZ2V0VXNlckNvb2tpZXMoZnVuY3Rpb24oY29va2llcykge1xuICAgICAgICB1cGRhdGVVc2VyRnJvbUNvb2tpZXMoY29va2llcyk7XG4gICAgICAgIGNhbGxiYWNrKGNhY2hlZFVzZXJJbmZvKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gZ2V0VXNlckNvb2tpZXMoY2FsbGJhY2spIHtcbiAgICBYRE1DbGllbnQuc2VuZE1lc3NhZ2UoJ2dldENvb2tpZXMnLCBbICd1c2VyX2lkJywgJ3VzZXJfdHlwZScsICdhbnRfdG9rZW4nLCAndGVtcF91c2VyJyBdLCBmdW5jdGlvbihjb29raWVzKSB7XG4gICAgICAgIGNhbGxiYWNrKGNvb2tpZXMpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBzdG9yZVVzZXJDb29raWVzKHVzZXJJbmZvKSB7XG4gICAgdmFyIGNvb2tpZXMgPSB7XG4gICAgICAgICd1c2VyX2lkJzogdXNlckluZm8udXNlcl9pZCxcbiAgICAgICAgJ3VzZXJfdHlwZSc6IHVzZXJJbmZvLnVzZXJfdHlwZSxcbiAgICAgICAgJ2FudF90b2tlbic6IHVzZXJJbmZvLmFudF90b2tlbixcbiAgICAgICAgJ3RlbXBfdXNlcic6IHVzZXJJbmZvLnRlbXBfdXNlclxuICAgIH07XG4gICAgWERNQ2xpZW50LnNlbmRNZXNzYWdlKCdzZXRDb29raWVzJywgY29va2llcyk7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVRlbXBVc2VyKGdyb3VwU2V0dGluZ3MsIGNhbGxiYWNrKSB7XG4gICAgdmFyIHNlbmREYXRhID0ge1xuICAgICAgICBncm91cF9pZCA6IGdyb3VwU2V0dGluZ3MuZ3JvdXBJZCgpXG4gICAgfTtcbiAgICAvLyBUaGlzIG1vZHVsZSB1c2VzIHRoZSBsb3ctbGV2ZWwgSlNPTlBDbGllbnQgaW5zdGVhZCBvZiBBamF4Q2xpZW50IGluIG9yZGVyIHRvIGF2b2lkIGEgY2lyY3VsYXIgZGVwZW5kZW5jeS5cbiAgICBKU09OUENsaWVudC5kb0dldEpTT05QKFVSTHMuYXBwU2VydmVyVXJsKCksIFVSTHMuY3JlYXRlVGVtcFVzZXJVcmwoKSwgc2VuZERhdGEsIGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICBpZiAoIWNhY2hlZFVzZXJJbmZvIHx8ICFjYWNoZWRVc2VySW5mby51c2VyX2lkIHx8ICFjYWNoZWRVc2VySW5mby5hbnRfdG9rZW4gfHwgIWNhY2hlZFVzZXJJbmZvLnRlbXBfdXNlcikge1xuICAgICAgICAgICAgLy8gSXQncyBwb3NzaWJsZSB0aGF0IG11bHRpcGxlIG9mIHRoZXNlIGFqYXggcmVxdWVzdHMgZ290IGZpcmVkIGluIHBhcmFsbGVsLiBXaGljaGV2ZXIgb25lXG4gICAgICAgICAgICAvLyBjb21lcyBiYWNrIGZpcnN0IHdpbnMuXG4gICAgICAgICAgICB1cGRhdGVVc2VyRnJvbVJlc3BvbnNlKHJlc3BvbnNlKTtcbiAgICAgICAgfVxuICAgICAgICBjYWxsYmFjayhjYWNoZWRVc2VySW5mbyk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZVVzZXJGcm9tQ29va2llcyhjb29raWVzKSB7XG4gICAgdmFyIHVzZXJJbmZvID0ge307XG4gICAgdXNlckluZm8udXNlcl9pZCA9IGNvb2tpZXMudXNlcl9pZDtcbiAgICB1c2VySW5mby51c2VyX3R5cGUgPSBjb29raWVzLnVzZXJfdHlwZTtcbiAgICB1c2VySW5mby5hbnRfdG9rZW4gPSBjb29raWVzLmFudF90b2tlbjtcbiAgICB1c2VySW5mby50ZW1wX3VzZXIgPSBjb29raWVzLnRlbXBfdXNlcjtcblxuICAgIGNhY2hlZFVzZXJJbmZvID0gdXNlckluZm87XG4gICAgcmV0dXJuIGNhY2hlZFVzZXJJbmZvO1xuXG59XG5cbmZ1bmN0aW9uIHVwZGF0ZVVzZXJGcm9tUmVzcG9uc2UocmVzcG9uc2UpIHtcbiAgICByZXNwb25zZSA9IHJlc3BvbnNlIHx8IHt9O1xuXG4gICAgdmFyIHVzZXJJbmZvID0ge307XG4gICAgdXNlckluZm8uYW50X3Rva2VuID0gcmVzcG9uc2UuYW50X3Rva2VuO1xuICAgIHVzZXJJbmZvLnVzZXJfaWQgPSByZXNwb25zZS51c2VyX2lkO1xuICAgIHVzZXJJbmZvLmZ1bGxfbmFtZSA9IHJlc3BvbnNlLmZ1bGxfbmFtZTtcbiAgICB1c2VySW5mby5maXJzdF9uYW1lID0gcmVzcG9uc2UuZnVsbF9uYW1lO1xuICAgIHVzZXJJbmZvLmltZ191cmwgPSByZXNwb25zZS5pbWdfdXJsO1xuICAgIHVzZXJJbmZvLnVzZXJfdHlwZSA9IHJlc3BvbnNlLnVzZXJfdHlwZTtcbiAgICB1c2VySW5mby50ZW1wX3VzZXIgPSAhdXNlckluZm8uZmlyc3RfbmFtZSAmJiAhdXNlckluZm8uZnVsbF9uYW1lO1xuXG4gICAgY2FjaGVkVXNlckluZm8gPSB1c2VySW5mbztcbiAgICBzdG9yZVVzZXJDb29raWVzKHVzZXJJbmZvKTsgLy8gVXBkYXRlIGNvb2tpZXMgd2hlbmV2ZXIgd2UgZ2V0IGEgdXNlciBmcm9tIHRoZSBzZXJ2ZXIuXG59XG5cbi8vIFJldHVybnMgdGhlIGxvZ2dlZC1pbiB1c2VyLCBpZiB3ZSBhbHJlYWR5IGhhdmUgb25lLiBXaWxsIG5vdCB0cmlnZ2VyIGEgbmV0d29yayByZXF1ZXN0LlxuZnVuY3Rpb24gY2FjaGVkVXNlcigpIHtcbiAgICByZXR1cm4gY2FjaGVkVXNlckluZm87XG59XG5cbi8vIEF0dGVtcHRzIHRvIGNyZWF0ZSBhIG5ldyBhdXRob3JpemF0aW9uIHRva2VuIGZvciB0aGUgbG9nZ2VkLWluIHVzZXIuXG5mdW5jdGlvbiByZUF1dGhvcml6ZVVzZXIoZ3JvdXBTZXR0aW5ncywgY2FsbGJhY2spIHtcbiAgICB2YXIgb2xkVG9rZW4gPSBjYWNoZWRVc2VySW5mbyA/IGNhY2hlZFVzZXJJbmZvLmFudF90b2tlbiA6IHVuZGVmaW5lZDtcbiAgICBnZXRVc2VyQ29va2llcyhmdW5jdGlvbihjb29raWVzKSB7XG4gICAgICAgIHVwZGF0ZVVzZXJGcm9tQ29va2llcyhjb29raWVzKTtcbiAgICAgICAgdmFyIHVzZXJUeXBlID0gY29va2llcy51c2VyX3R5cGU7XG4gICAgICAgIGlmICh1c2VyVHlwZSA9PT0gJ2ZhY2Vib29rJykge1xuICAgICAgICAgICAgWERNQ2xpZW50LnNlbmRNZXNzYWdlKCdmYWNlYm9va0dldExvZ2luU3RhdHVzJywgdHJ1ZSwgZnVuY3Rpb24ocmVzcG9uc2UpIHsgLy8gRm9yY2UgYSByb3VuZCB0cmlwIHRvIHJlYXV0aG9yaXplLlxuICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZS5zdGF0dXMgPT09ICdjb25uZWN0ZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgIGdldEFudFRva2VuRm9yRmFjZWJvb2tMb2dpbihyZXNwb25zZS5hdXRoUmVzcG9uc2UsIGdyb3VwU2V0dGluZ3MsIG5vdGlmeUhhc05ld1Rva2VuKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHJlc3BvbnNlLnN0YXR1cyA9PT0gJ25vdF9hdXRob3JpemVkJykge1xuICAgICAgICAgICAgICAgICAgICAvLyBUaGUgdXNlciBkaWRuJ3QgYXV0aG9yaXplIHVzIGZvciBGQiBsb2dpbi4gUmV2ZXJ0IHRoZW0gdG8gYSB0ZW1wIHVzZXIgaW5zdGVhZC5cbiAgICAgICAgICAgICAgICAgICAgZGVBdXRob3JpemVVc2VyKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3JlYXRlVGVtcFVzZXIoZ3JvdXBTZXR0aW5ncywgbm90aWZ5SGFzTmV3VG9rZW4pO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiBNYWtlIHN1cmUgdGhlIEZCIGxvZ2luIHdpbmRvdyBvcGVucyBwcm9wZXJseSB3aGVuIHRyaWdnZXJlZCBmcm9tIHRoZSBiYWNrZ3JvdW5kIGxpa2UgdGhpcy5cbiAgICAgICAgICAgICAgICAgICAgZmFjZWJvb2tMb2dpbihncm91cFNldHRpbmdzLCBub3RpZnlIYXNOZXdUb2tlbik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBGb3IgQW50ZW5uYSB1c2VycywganVzdCByZS1yZWFkIHRoZSBjb29raWVzIGFuZCBzZWUgaWYgdGhleSd2ZSBjaGFuZ2VkLlxuICAgICAgICAgICAgbm90aWZ5SGFzTmV3VG9rZW4oKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgZnVuY3Rpb24gbm90aWZ5SGFzTmV3VG9rZW4oKSB7XG4gICAgICAgIHZhciBoYXNOZXdUb2tlbiA9IGNhY2hlZFVzZXJJbmZvICYmIGNhY2hlZFVzZXJJbmZvLmFudF90b2tlbiAmJiBjYWNoZWRVc2VySW5mby5hbnRfdG9rZW4gIT09IG9sZFRva2VuO1xuICAgICAgICBpZiAoY2FsbGJhY2spIHsgY2FsbGJhY2soaGFzTmV3VG9rZW4pIH07XG4gICAgfVxufVxuXG5mdW5jdGlvbiBmYWNlYm9va0xvZ2luKGdyb3VwU2V0dGluZ3MsIGNhbGxiYWNrKSB7XG4gICAgWERNQ2xpZW50LnNlbmRNZXNzYWdlKCdmYWNlYm9va0xvZ2luJywgeyBzY29wZTogJ2VtYWlsJyB9LCBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICB2YXIgYXV0aFJlc3BvbnNlID0gcmVzcG9uc2UuYXV0aFJlc3BvbnNlO1xuICAgICAgICBpZiAoYXV0aFJlc3BvbnNlKSB7XG4gICAgICAgICAgICBnZXRBbnRUb2tlbkZvckZhY2Vib29rTG9naW4oYXV0aFJlc3BvbnNlLCBncm91cFNldHRpbmdzLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhjYWNoZWRVc2VySW5mbyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKGNhY2hlZFVzZXJJbmZvKTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBnZXRBbnRUb2tlbkZvckZhY2Vib29rTG9naW4oZmFjZWJvb2tBdXRoUmVzcG9uc2UsIGdyb3VwU2V0dGluZ3MsIGNhbGxiYWNrKSB7XG4gICAgdmFyIHNlbmREYXRhID0ge1xuICAgICAgICBmYjogZmFjZWJvb2tBdXRoUmVzcG9uc2UsXG4gICAgICAgIGdyb3VwX2lkOiBncm91cFNldHRpbmdzLmdyb3VwSWQoKSxcbiAgICAgICAgdXNlcl9pZDogY2FjaGVkVXNlckluZm8udXNlcl9pZCwgLy8gbWlnaHQgYmUgdGVtcCwgbWlnaHQgYmUgdGhlIElEIG9mIGEgdmFsaWQgRkItY3JlYXRlZCB1c2VyXG4gICAgICAgIGFudF90b2tlbjogY2FjaGVkVXNlckluZm8uYW50X3Rva2VuXG4gICAgfTtcbiAgICBKU09OUENsaWVudC5kb0dldEpTT05QKFVSTHMuYXBwU2VydmVyVXJsKCksICcvYXBpL2ZiJywgc2VuZERhdGEsIGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICB1cGRhdGVVc2VyRnJvbVJlc3BvbnNlKHJlc3BvbnNlKTtcbiAgICAgICAgY2FsbGJhY2soY2FjaGVkVXNlckluZm8pO1xuICAgIH0sIGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICBjcmVhdGVUZW1wVXNlcihncm91cFNldHRpbmdzLCBjYWxsYmFjayk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGRlQXV0aG9yaXplVXNlcihjYWxsYmFjaykge1xuICAgIGlmIChjYWNoZWRVc2VySW5mbyAmJiAhY2FjaGVkVXNlckluZm8udGVtcF91c2VyKSB7XG4gICAgICAgIHZhciBzZW5kRGF0YSA9IHtcbiAgICAgICAgICAgIHVzZXJfaWQgOiBjYWNoZWRVc2VySW5mby51c2VyX2lkLFxuICAgICAgICAgICAgYW50X3Rva2VuIDogY2FjaGVkVXNlckluZm8uYW50X3Rva2VuXG4gICAgICAgIH07XG4gICAgICAgIEpTT05QQ2xpZW50LmRvR2V0SlNPTlAoVVJMcy5hcHBTZXJ2ZXJVcmwoKSwgJy9hcGkvZGVhdXRob3JpemUnLCBzZW5kRGF0YSwgZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIGRpc2NhcmRVc2VySW5mbyhjYWxsYmFjayk7XG4gICAgICAgIH0pXG4gICAgfSBlbHNlIHtcbiAgICAgICAgZGlzY2FyZFVzZXJJbmZvKGNhbGxiYWNrKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRpc2NhcmRVc2VySW5mbyhjYWxsYmFjaykge1xuICAgIFhETUNsaWVudC5zZW5kTWVzc2FnZSgncmVtb3ZlQ29va2llcycsIFsndXNlcl9pZCcsICd1c2VyX3R5cGUnLCAnYW50X3Rva2VuJywgJ3RlbXBfdXNlciddLCB7fSwgZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgIGNhY2hlZFVzZXJJbmZvID0ge307XG4gICAgICAgIGNhbGxiYWNrKCk7XG4gICAgfSk7XG59XG5cbi8vIFRPRE86IEZpZ3VyZSBvdXQgaG93IG1hbnkgZGlmZmVyZW50IGZvcm1hdHMgb2YgdXNlciBkYXRhIHdlIGhhdmUgYW5kIGVpdGhlciB1bmlmeSB0aGVtIG9yIHByb3ZpZGUgY2xlYXJcbi8vICAgICAgIEFQSSBoZXJlIHRvIHRyYW5zbGF0ZSBlYWNoIHZhcmlhdGlvbiBpbnRvIHNvbWV0aGluZyBzdGFuZGFyZCBmb3IgdGhlIGNsaWVudC5cbmZ1bmN0aW9uIHVzZXJGcm9tQ29tbWVudEpTT04oanNvblVzZXIsIHNvY2lhbFVzZXIpIHsgLy8gVGhpcyBmb3JtYXQgd29ya3MgZm9yIHRoZSB1c2VyIHJldHVybmVkIGZyb20gL2FwaS9jb21tZW50cy9yZXBsaWVzXG4gICAgdmFyIHVzZXIgPSB7fTtcbiAgICBpZiAoanNvblVzZXIudXNlcl9pZCkge1xuICAgICAgICB1c2VyLmlkID0ganNvblVzZXIudXNlcl9pZDtcbiAgICB9XG4gICAgaWYgKHNvY2lhbFVzZXIpIHtcbiAgICAgICAgdXNlci5pbWFnZVVSTCA9IHNvY2lhbFVzZXIuaW1nX3VybDtcbiAgICAgICAgdXNlci5uYW1lID0gc29jaWFsVXNlci5mdWxsX25hbWU7XG4gICAgfVxuICAgIGlmICghdXNlci5uYW1lKSB7XG4gICAgICAgIHVzZXIubmFtZSA9IGpzb25Vc2VyLmZpcnN0X25hbWUgPyAoanNvblVzZXIuZmlyc3RfbmFtZSArICcgJyArIGpzb25Vc2VyLmxhc3RfbmFtZSkgOiAnQW5vbnltb3VzJztcbiAgICB9XG4gICAgaWYgKCF1c2VyLmltYWdlVVJMKSB7XG4gICAgICAgIHVzZXIuaW1hZ2VVUkwgPSBhbm9ueW1vdXNJbWFnZVVSTCgpXG4gICAgfVxuICAgIHJldHVybiB1c2VyO1xufVxuXG5cbi8vIFRPRE86IFJldmlzaXQgdGhlIHVzZXIgdGhhdCB3ZSBwYXNzIGJhY2sgZm9yIG5ldyBjb21tZW50cy4gT3B0aW9ucyBhcmU6XG4vLyAgICAgICAxLiBVc2UgdGhlIGxvZ2dlZCBpbiB1c2VyLCBhc3N1bWluZyB0aGUgY2FjaGVkIHVzZXIgaGFzIHNvY2lhbF91c2VyIGluZm9cbi8vICAgICAgIDIuIFVzZSBhIGdlbmVyaWMgXCJ5b3VcIiByZXByZXNlbnRhdGlvbiBsaWtlIHdlJ3JlIGRvaW5nIG5vdy5cbi8vICAgICAgIDMuIERvbid0IHNob3cgYW55IGluZGljYXRpb24gb2YgdGhlIHVzZXIuIEp1c3Qgc2hvdyB0aGUgY29tbWVudC5cbi8vICAgICAgIEZvciBub3csIHRoaXMgaXMganVzdCBnaXZpbmcgdXMgc29tZSBub3Rpb24gb2YgdXNlciB3aXRob3V0IGEgcm91bmQgdHJpcC5cbmZ1bmN0aW9uIG9wdGltaXN0aWNDb21tZW50VXNlcigpIHtcbiAgICB2YXIgdXNlciA9IHtcbiAgICAgICAgbmFtZTogJ1lvdScsXG4gICAgICAgIGltYWdlVVJMOiBhbm9ueW1vdXNJbWFnZVVSTCgpXG4gICAgfTtcbiAgICByZXR1cm4gdXNlcjtcbn1cblxuZnVuY3Rpb24gYW5vbnltb3VzSW1hZ2VVUkwoKSB7XG4gICAgcmV0dXJuIEFwcE1vZGUub2ZmbGluZSA/ICcvc3RhdGljL3dpZGdldC9pbWFnZXMvYW5vbnltb3VzcGxvZGUucG5nJyA6ICdodHRwOi8vczMuYW1hem9uYXdzLmNvbS9yZWFkcmJvYXJkL3dpZGdldC9pbWFnZXMvYW5vbnltb3VzcGxvZGUucG5nJztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgZnJvbUNvbW1lbnRKU09OOiB1c2VyRnJvbUNvbW1lbnRKU09OLFxuICAgIG9wdGltaXN0aWNDb21tZW50VXNlcjogb3B0aW1pc3RpY0NvbW1lbnRVc2VyLFxuICAgIGZldGNoVXNlcjogZmV0Y2hVc2VyLFxuICAgIHJlZnJlc2hVc2VyRnJvbUNvb2tpZXM6IHJlZnJlc2hVc2VyRnJvbUNvb2tpZXMsXG4gICAgY2FjaGVkVXNlcjogY2FjaGVkVXNlcixcbiAgICByZUF1dGhvcml6ZVVzZXI6IHJlQXV0aG9yaXplVXNlcixcbiAgICBmYWNlYm9va0xvZ2luOiBmYWNlYm9va0xvZ2luXG59OyIsIi8qKlxuICogQXV0aG9yOiBKYXNvbiBGYXJyZWxsXG4gKiBBdXRob3IgVVJJOiBodHRwOi8vdXNlYWxsZml2ZS5jb20vXG4gKlxuICogRGVzY3JpcHRpb246IENoZWNrcyBpZiBhIERPTSBlbGVtZW50IGlzIHRydWx5IHZpc2libGUuXG4gKiBQYWNrYWdlIFVSTDogaHR0cHM6Ly9naXRodWIuY29tL1VzZUFsbEZpdmUvdHJ1ZS12aXNpYmlsaXR5XG4gKi9cbmZ1bmN0aW9uIGlzVmlzaWJsZShlbGVtZW50KSB7XG5cbiAgICAvKipcbiAgICAgKiBDaGVja3MgaWYgYSBET00gZWxlbWVudCBpcyB2aXNpYmxlLiBUYWtlcyBpbnRvXG4gICAgICogY29uc2lkZXJhdGlvbiBpdHMgcGFyZW50cyBhbmQgb3ZlcmZsb3cuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gKGVsKSAgICAgIHRoZSBET00gZWxlbWVudCB0byBjaGVjayBpZiBpcyB2aXNpYmxlXG4gICAgICpcbiAgICAgKiBUaGVzZSBwYXJhbXMgYXJlIG9wdGlvbmFsIHRoYXQgYXJlIHNlbnQgaW4gcmVjdXJzaXZlbHksXG4gICAgICogeW91IHR5cGljYWxseSB3b24ndCB1c2UgdGhlc2U6XG4gICAgICpcbiAgICAgKiBAcGFyYW0gKHQpICAgICAgIFRvcCBjb3JuZXIgcG9zaXRpb24gbnVtYmVyXG4gICAgICogQHBhcmFtIChyKSAgICAgICBSaWdodCBjb3JuZXIgcG9zaXRpb24gbnVtYmVyXG4gICAgICogQHBhcmFtIChiKSAgICAgICBCb3R0b20gY29ybmVyIHBvc2l0aW9uIG51bWJlclxuICAgICAqIEBwYXJhbSAobCkgICAgICAgTGVmdCBjb3JuZXIgcG9zaXRpb24gbnVtYmVyXG4gICAgICogQHBhcmFtICh3KSAgICAgICBFbGVtZW50IHdpZHRoIG51bWJlclxuICAgICAqIEBwYXJhbSAoaCkgICAgICAgRWxlbWVudCBoZWlnaHQgbnVtYmVyXG4gICAgICovXG4gICAgZnVuY3Rpb24gX2lzVmlzaWJsZShlbCwgdCwgciwgYiwgbCwgdywgaCkge1xuICAgICAgICB2YXIgcCA9IGVsLnBhcmVudE5vZGUsXG4gICAgICAgICAgICAgICAgVklTSUJMRV9QQURESU5HID0gMjtcblxuICAgICAgICBpZiAoICFfZWxlbWVudEluRG9jdW1lbnQoZWwpICkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8tLSBSZXR1cm4gdHJ1ZSBmb3IgZG9jdW1lbnQgbm9kZVxuICAgICAgICBpZiAoIDkgPT09IHAubm9kZVR5cGUgKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vLS0gUmV0dXJuIGZhbHNlIGlmIG91ciBlbGVtZW50IGlzIGludmlzaWJsZVxuICAgICAgICBpZiAoXG4gICAgICAgICAgICAgJzAnID09PSBfZ2V0U3R5bGUoZWwsICdvcGFjaXR5JykgfHxcbiAgICAgICAgICAgICAnbm9uZScgPT09IF9nZXRTdHlsZShlbCwgJ2Rpc3BsYXknKSB8fFxuICAgICAgICAgICAgICdoaWRkZW4nID09PSBfZ2V0U3R5bGUoZWwsICd2aXNpYmlsaXR5JylcbiAgICAgICAgKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoXG4gICAgICAgICAgICAndW5kZWZpbmVkJyA9PT0gdHlwZW9mKHQpIHx8XG4gICAgICAgICAgICAndW5kZWZpbmVkJyA9PT0gdHlwZW9mKHIpIHx8XG4gICAgICAgICAgICAndW5kZWZpbmVkJyA9PT0gdHlwZW9mKGIpIHx8XG4gICAgICAgICAgICAndW5kZWZpbmVkJyA9PT0gdHlwZW9mKGwpIHx8XG4gICAgICAgICAgICAndW5kZWZpbmVkJyA9PT0gdHlwZW9mKHcpIHx8XG4gICAgICAgICAgICAndW5kZWZpbmVkJyA9PT0gdHlwZW9mKGgpXG4gICAgICAgICkge1xuICAgICAgICAgICAgdCA9IGVsLm9mZnNldFRvcDtcbiAgICAgICAgICAgIGwgPSBlbC5vZmZzZXRMZWZ0O1xuICAgICAgICAgICAgYiA9IHQgKyBlbC5vZmZzZXRIZWlnaHQ7XG4gICAgICAgICAgICByID0gbCArIGVsLm9mZnNldFdpZHRoO1xuICAgICAgICAgICAgdyA9IGVsLm9mZnNldFdpZHRoO1xuICAgICAgICAgICAgaCA9IGVsLm9mZnNldEhlaWdodDtcbiAgICAgICAgfVxuICAgICAgICAvLy0tIElmIHdlIGhhdmUgYSBwYXJlbnQsIGxldCdzIGNvbnRpbnVlOlxuICAgICAgICBpZiAoIHAgKSB7XG4gICAgICAgICAgICAvLy0tIENoZWNrIGlmIHRoZSBwYXJlbnQgY2FuIGhpZGUgaXRzIGNoaWxkcmVuLlxuICAgICAgICAgICAgaWYgKCBfb3ZlcmZsb3dIaWRkZW4ocCkgKSB7XG4gICAgICAgICAgICAgICAgLy8tLSBPbmx5IGNoZWNrIGlmIHRoZSBvZmZzZXQgaXMgZGlmZmVyZW50IGZvciB0aGUgcGFyZW50XG4gICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAvLy0tIElmIHRoZSB0YXJnZXQgZWxlbWVudCBpcyB0byB0aGUgcmlnaHQgb2YgdGhlIHBhcmVudCBlbG1cbiAgICAgICAgICAgICAgICAgICAgbCArIFZJU0lCTEVfUEFERElORyA+IHAub2Zmc2V0V2lkdGggKyBwLnNjcm9sbExlZnQgfHxcbiAgICAgICAgICAgICAgICAgICAgLy8tLSBJZiB0aGUgdGFyZ2V0IGVsZW1lbnQgaXMgdG8gdGhlIGxlZnQgb2YgdGhlIHBhcmVudCBlbG1cbiAgICAgICAgICAgICAgICAgICAgbCArIHcgLSBWSVNJQkxFX1BBRERJTkcgPCBwLnNjcm9sbExlZnQgfHxcbiAgICAgICAgICAgICAgICAgICAgLy8tLSBJZiB0aGUgdGFyZ2V0IGVsZW1lbnQgaXMgdW5kZXIgdGhlIHBhcmVudCBlbG1cbiAgICAgICAgICAgICAgICAgICAgdCArIFZJU0lCTEVfUEFERElORyA+IHAub2Zmc2V0SGVpZ2h0ICsgcC5zY3JvbGxUb3AgfHxcbiAgICAgICAgICAgICAgICAgICAgLy8tLSBJZiB0aGUgdGFyZ2V0IGVsZW1lbnQgaXMgYWJvdmUgdGhlIHBhcmVudCBlbG1cbiAgICAgICAgICAgICAgICAgICAgdCArIGggLSBWSVNJQkxFX1BBRERJTkcgPCBwLnNjcm9sbFRvcFxuICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAvLy0tIE91ciB0YXJnZXQgZWxlbWVudCBpcyBvdXQgb2YgYm91bmRzOlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIEFOVEVOTkEgbW9kaWZpY2F0aW9uOiB1c2UgdGhlIGJvdW5kaW5nIGNsaWVudCByZWN0LCB3aGljaCBhY2NvdW50cyBmb3IgdGhpbmdzIGxpa2UgQ1NTIHRyYW5zZm9ybXNcbiAgICAgICAgICAgICAgICB2YXIgZWxyID0gZWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgICAgICAgICAgdmFyIHByID0gcC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgICAgICAgICBpZiAoZWxyLmxlZnQgPj0gcHIucmlnaHQgfHxcbiAgICAgICAgICAgICAgICAgICAgZWxyLnJpZ2h0IDw9IHByLmxlZnQgfHxcbiAgICAgICAgICAgICAgICAgICAgZWxyLnRvcCA+PSBwci5ib3R0b20gfHxcbiAgICAgICAgICAgICAgICAgICAgZWxyLmJvdHRvbSA8PSBwci50b3ApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vLS0gQWRkIHRoZSBvZmZzZXQgcGFyZW50J3MgbGVmdC90b3AgY29vcmRzIHRvIG91ciBlbGVtZW50J3Mgb2Zmc2V0OlxuICAgICAgICAgICAgaWYgKCBlbC5vZmZzZXRQYXJlbnQgPT09IHAgKSB7XG4gICAgICAgICAgICAgICAgbCArPSBwLm9mZnNldExlZnQ7XG4gICAgICAgICAgICAgICAgdCArPSBwLm9mZnNldFRvcDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vLS0gTGV0J3MgcmVjdXJzaXZlbHkgY2hlY2sgdXB3YXJkczpcbiAgICAgICAgICAgIHJldHVybiBfaXNWaXNpYmxlKHAsIHQsIHIsIGIsIGwsIHcsIGgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIC8vLS0gQ3Jvc3MgYnJvd3NlciBtZXRob2QgdG8gZ2V0IHN0eWxlIHByb3BlcnRpZXM6XG4gICAgZnVuY3Rpb24gX2dldFN0eWxlKGVsLCBwcm9wZXJ0eSkge1xuICAgICAgICBpZiAoIHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlICkge1xuICAgICAgICAgICAgcmV0dXJuIGRvY3VtZW50LmRlZmF1bHRWaWV3LmdldENvbXB1dGVkU3R5bGUoZWwsbnVsbClbcHJvcGVydHldO1xuICAgICAgICB9XG4gICAgICAgIGlmICggZWwuY3VycmVudFN0eWxlICkge1xuICAgICAgICAgICAgcmV0dXJuIGVsLmN1cnJlbnRTdHlsZVtwcm9wZXJ0eV07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBfZWxlbWVudEluRG9jdW1lbnQoZWxlbWVudCkge1xuICAgICAgICB3aGlsZSAoZWxlbWVudCA9IGVsZW1lbnQucGFyZW50Tm9kZSkge1xuICAgICAgICAgICAgaWYgKGVsZW1lbnQgPT0gZG9jdW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIF9vdmVyZmxvd0hpZGRlbihlbCkge1xuICAgICAgICByZXR1cm4gJ2hpZGRlbicgPT09IF9nZXRTdHlsZShlbCwgJ292ZXJmbG93JykgfHwgJ2hpZGRlbicgPT09IF9nZXRTdHlsZShlbCwgJ292ZXJmbG93LXgnKSB8fCAnaGlkZGVuJyA9PT0gX2dldFN0eWxlKGVsLCAnb3ZlcmZsb3cteScpIHx8XG4gICAgICAgICAgICAgICAgJ3Njcm9sbCcgPT09IF9nZXRTdHlsZShlbCwgJ292ZXJmbG93JykgfHwgJ3Njcm9sbCcgPT09IF9nZXRTdHlsZShlbCwgJ292ZXJmbG93LXgnKSB8fCAnc2Nyb2xsJyA9PT0gX2dldFN0eWxlKGVsLCAnb3ZlcmZsb3cteScpXG4gICAgfVxuXG4gICAgcmV0dXJuIF9pc1Zpc2libGUoZWxlbWVudCk7XG5cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgaXNWaXNpYmxlOiBpc1Zpc2libGVcbn07IiwidmFyIGlkID0gJ2FudGVubmEtd2lkZ2V0LWJ1Y2tldCc7XG5cbmZ1bmN0aW9uIGdldFdpZGdldEJ1Y2tldCgpIHtcbiAgICB2YXIgYnVja2V0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpO1xuICAgIGlmICghYnVja2V0KSB7XG4gICAgICAgIGJ1Y2tldCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBidWNrZXQuc2V0QXR0cmlidXRlKCdpZCcsIGlkKTtcbiAgICAgICAgYnVja2V0LmNsYXNzTGlzdC5hZGQoJ2FudGVubmEtcmVzZXQnLCduby1hbnQnKTtcbiAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChidWNrZXQpO1xuICAgIH1cbiAgICByZXR1cm4gYnVja2V0O1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgZ2V0OiBnZXRXaWRnZXRCdWNrZXQsXG4gICAgc2VsZWN0b3I6IGZ1bmN0aW9uKCkgeyByZXR1cm4gJyMnICsgaWQ7IH1cbn07IiwidmFyIFhkbUxvYWRlciA9IHJlcXVpcmUoJy4veGRtLWxvYWRlcicpO1xuXG4vLyBSZWdpc3RlciBvdXJzZWx2ZXMgdG8gaGVhciBtZXNzYWdlc1xud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIHJlY2VpdmVNZXNzYWdlLCBmYWxzZSk7XG5cbnZhciByZXNwb25zZUhhbmRsZXJzID0geyAneGRtX2xvYWRlZCc6IHhkbUxvYWRlZCB9O1xudmFyIHF1ZXVlZE1lc3NhZ2VzID0gW107XG5cbnZhciBpc1hETUxvYWRlZCA9IGZhbHNlO1xuLy8gVGhlIGluaXRpYWwgbWVzc2FnZSB0aGF0IFhETSBzZW5kcyBvdXQgd2hlbiBpdCBsb2Fkc1xuZnVuY3Rpb24geGRtTG9hZGVkKGRhdGEpIHtcbiAgICBpc1hETUxvYWRlZCA9IHRydWU7XG4gICAgLy8gRmlyZSBhbnkgbWVzc2FnZXMgdGhhdCBoYXZlIGJlZW4gd2FpdGluZyBmb3IgWERNIHRvIGJlIHJlYWR5XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBxdWV1ZWRNZXNzYWdlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgbWVzc2FnZURhdGEgPSBxdWV1ZWRNZXNzYWdlc1tpXTtcbiAgICAgICAgc2VuZE1lc3NhZ2UobWVzc2FnZURhdGEubWVzc2FnZUtleSwgbWVzc2FnZURhdGEubWVzc2FnZVBhcmFtcywgbWVzc2FnZURhdGEuY2FsbGJhY2spO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gc2VuZE1lc3NhZ2UobWVzc2FnZUtleSwgbWVzc2FnZVBhcmFtcywgY2FsbGJhY2spIHtcbiAgICBpZiAoaXNYRE1Mb2FkZWQpIHtcbiAgICAgICAgdmFyIGNhbGxiYWNrS2V5ID0gJ2FudGVubmEnICsgTWF0aC5yYW5kb20oKS50b1N0cmluZygxNikuc2xpY2UoMik7XG4gICAgICAgIGlmIChjYWxsYmFjaykgeyByZXNwb25zZUhhbmRsZXJzW2NhbGxiYWNrS2V5XSA9IGNhbGxiYWNrOyB9XG4gICAgICAgIHBvc3RNZXNzYWdlKHtcbiAgICAgICAgICAgIG1lc3NhZ2VLZXk6IG1lc3NhZ2VLZXksXG4gICAgICAgICAgICBtZXNzYWdlUGFyYW1zOiBtZXNzYWdlUGFyYW1zLFxuICAgICAgICAgICAgY2FsbGJhY2tLZXk6IGNhbGxiYWNrS2V5XG4gICAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHF1ZXVlZE1lc3NhZ2VzLnB1c2goeyBtZXNzYWdlS2V5OiBtZXNzYWdlS2V5LCBtZXNzYWdlUGFyYW1zOiBtZXNzYWdlUGFyYW1zLCBjYWxsYmFjazogY2FsbGJhY2sgfSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiByZWNlaXZlTWVzc2FnZShldmVudCkge1xuICAgIHZhciBldmVudE9yaWdpbiA9IGV2ZW50Lm9yaWdpbjtcbiAgICBpZiAoZXZlbnRPcmlnaW4gPT09IFhkbUxvYWRlci5PUklHSU4pIHtcbiAgICAgICAgdmFyIGRhdGEgPSBldmVudC5kYXRhO1xuICAgICAgICAvLyBUT0RPOiBUaGUgZXZlbnQuc291cmNlIHByb3BlcnR5IGdpdmVzIHVzIHRoZSBzb3VyY2Ugd2luZG93IG9mIHRoZSBtZXNzYWdlIGFuZCBjdXJyZW50bHkgdGhlIFhETSBmcmFtZSBmaXJlcyBvdXRcbiAgICAgICAgLy8gZXZlbnRzIHRoYXQgd2UgcmVjZWl2ZSBiZWZvcmUgd2UgZXZlciB0cnkgdG8gcG9zdCBhbnl0aGluZy4gU28gd2UgKmNvdWxkKiBob2xkIG9udG8gdGhlIHdpbmRvdyBoZXJlIGFuZCB1c2UgaXRcbiAgICAgICAgLy8gZm9yIHBvc3RpbmcgbWVzc2FnZXMgcmF0aGVyIHRoYW4gbG9va2luZyBmb3IgdGhlIFhETSBmcmFtZSBvdXJzZWx2ZXMuIE5lZWQgdG8gbG9vayBhdCB3aGljaCBldmVudHMgdGhlIFhETSBmcmFtZVxuICAgICAgICAvLyBmaXJlcyBvdXQgdG8gYWxsIHdpbmRvd3MgYmVmb3JlIGJlaW5nIGFza2VkLiBDdXJyZW50bHksIGl0J3MgbW9yZSB0aGFuIFwieGRtIGxvYWRlZFwiLiBXaHk/XG4gICAgICAgIC8vdmFyIHNvdXJjZVdpbmRvdyA9IGV2ZW50LnNvdXJjZTtcblxuICAgICAgICB2YXIgY2FsbGJhY2tLZXkgPSBkYXRhLm1lc3NhZ2VLZXk7XG4gICAgICAgIHZhciBjYWxsYmFjayA9IHJlc3BvbnNlSGFuZGxlcnNbY2FsbGJhY2tLZXldO1xuICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKGRhdGEubWVzc2FnZVBhcmFtcyk7XG4gICAgICAgICAgICBkZWxldGUgcmVzcG9uc2VIYW5kbGVyc1tjYWxsYmFja0tleV07XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIHBvc3RNZXNzYWdlKG1lc3NhZ2UpIHtcbiAgICB2YXIgeGRtRnJhbWUgPSBnZXRYRE1GcmFtZSgpO1xuICAgIGlmICh4ZG1GcmFtZSkge1xuICAgICAgICB4ZG1GcmFtZS5wb3N0TWVzc2FnZShtZXNzYWdlLCBYZG1Mb2FkZXIuT1JJR0lOKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGdldFhETUZyYW1lKCkge1xuICAgIC8vIFRPRE86IElzIHRoaXMgYSBzZWN1cml0eSBwcm9ibGVtPyBXaGF0IHByZXZlbnRzIHNvbWVvbmUgZnJvbSB1c2luZyB0aGlzIHNhbWUgbmFtZSBhbmQgaW50ZXJjZXB0aW5nIG91ciBtZXNzYWdlcz9cbiAgICByZXR1cm4gd2luZG93LmZyYW1lc1snYW50LXhkbS1oaWRkZW4nXTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgc2VuZE1lc3NhZ2U6IHNlbmRNZXNzYWdlXG59OyIsInZhciBBcHBNb2RlID0gcmVxdWlyZSgnLi9hcHAtbW9kZScpO1xudmFyIFVSTENvbnN0YW50cyA9IHJlcXVpcmUoJy4vdXJsLWNvbnN0YW50cycpO1xudmFyIFdpZGdldEJ1Y2tldCA9IHJlcXVpcmUoJy4vd2lkZ2V0LWJ1Y2tldCcpO1xuXG52YXIgWERNX09SSUdJTiA9IEFwcE1vZGUub2ZmbGluZSA/IFVSTENvbnN0YW50cy5ERVZFTE9QTUVOVCA6IFVSTENvbnN0YW50cy5QUk9EVUNUSU9OO1xuXG5mdW5jdGlvbiBjcmVhdGVYRE1mcmFtZShncm91cElkKSB7XG4gICAgdmFyIHhkbVVybCA9IFhETV9PUklHSU4gKyAnL3N0YXRpYy93aWRnZXQtbmV3L3hkbS1uZXcuaHRtbCc7XG4gICAgdmFyIHBhcmVudFVybCA9IGVuY29kZVVSSUNvbXBvbmVudCh3aW5kb3cubG9jYXRpb24uaHJlZik7XG4gICAgdmFyIHBhcmVudEhvc3QgPSBlbmNvZGVVUklDb21wb25lbnQod2luZG93LmxvY2F0aW9uLnByb3RvY29sICsgJy8vJyArIHdpbmRvdy5sb2NhdGlvbi5ob3N0KTtcbiAgICB2YXIgeGRtRnJhbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpZnJhbWUnKTtcbiAgICB4ZG1GcmFtZS5zZXRBdHRyaWJ1dGUoJ2lkJywgJ2FudC14ZG0taGlkZGVuJyk7XG4gICAgeGRtRnJhbWUuc2V0QXR0cmlidXRlKCduYW1lJywgJ2FudC14ZG0taGlkZGVuJyk7XG4gICAgeGRtRnJhbWUuc2V0QXR0cmlidXRlKCdzcmMnLCB4ZG1VcmwgKyAnP3BhcmVudFVybD0nICsgcGFyZW50VXJsICsgJyZwYXJlbnRIb3N0PScgKyBwYXJlbnRIb3N0ICsgJyZncm91cF9pZD0nICsgZ3JvdXBJZCk7XG4gICAgeGRtRnJhbWUuc2V0QXR0cmlidXRlKCd3aWR0aCcsIDEpO1xuICAgIHhkbUZyYW1lLnNldEF0dHJpYnV0ZSgnaGVpZ2h0JywgMSk7XG4gICAgeGRtRnJhbWUuc2V0QXR0cmlidXRlKCdzdHlsZScsICdwb3NpdGlvbjphYnNvbHV0ZTt0b3A6LTEwMDBweDtsZWZ0Oi0xMDAwcHg7Jyk7XG5cbiAgICBXaWRnZXRCdWNrZXQuZ2V0KCkuYXBwZW5kQ2hpbGQoeGRtRnJhbWUpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGVYRE1mcmFtZTogY3JlYXRlWERNZnJhbWUsXG4gICAgT1JJR0lOOiBYRE1fT1JJR0lOXG59OyIsInZhciBYRE1DbGllbnQgPSByZXF1aXJlKCcuL3V0aWxzL3hkbS1jbGllbnQnKTtcbnZhciBFdmVudHMgPSByZXF1aXJlKCcuL2V2ZW50cycpO1xudmFyIEdyb3VwU2V0dGluZ3MgPSByZXF1aXJlKCcuL2dyb3VwLXNldHRpbmdzJyk7XG52YXIgUGFnZURhdGEgPSByZXF1aXJlKCcuL3BhZ2UtZGF0YScpO1xuXG5mdW5jdGlvbiBjaGVja0FuYWx5dGljc0Nvb2tpZXMoKSB7XG4gICAgLy8gV2hlbiB0aGUgd2lkZ2V0IGxvYWRzLCBjaGVjayBmb3IgYW55IGNvb2tpZXMgdGhhdCBoYXZlIGJlZW4gd3JpdHRlbiBieSB0aGUgbGVnYWN5IGNvbnRlbnQgcmVjLlxuICAgIC8vIElmIHRob3NlIGNvb2tpZXMgZXhpc3QsIGZpcmUgdGhlIGV2ZW50IGFuZCBjbGVhciB0aGVtLlxuICAgIFhETUNsaWVudC5zZW5kTWVzc2FnZSgnZ2V0Q29va2llcycsIFsgJ3JlZGlyZWN0X3R5cGUnLCAncmVmZXJyaW5nX2ludF9pZCcsICdwYWdlX2hhc2gnIF0sIGZ1bmN0aW9uKGNvb2tpZXMpIHtcbiAgICAgICAgaWYgKGNvb2tpZXMucmVkaXJlY3RfdHlwZSA9PT0gJy9yLycpIHtcbiAgICAgICAgICAgIHZhciByZWFjdGlvbklkID0gY29va2llcy5yZWZlcnJpbmdfaW50X2lkO1xuICAgICAgICAgICAgdmFyIHBhZ2VIYXNoID0gY29va2llcy5wYWdlX2hhc2g7XG4gICAgICAgICAgICBnZXRQYWdlRGF0YShwYWdlSGFzaCwgZnVuY3Rpb24ocGFnZURhdGEpIHtcbiAgICAgICAgICAgICAgICBFdmVudHMucG9zdExlZ2FjeVJlY2lyY0NsaWNrZWQocGFnZURhdGEsIHJlYWN0aW9uSWQsIEdyb3VwU2V0dGluZ3MuZ2V0KCkpO1xuICAgICAgICAgICAgICAgIFhETUNsaWVudC5zZW5kTWVzc2FnZSgncmVtb3ZlQ29va2llcycsIFsgJ3JlZGlyZWN0X3R5cGUnLCAncmVmZXJyaW5nX2ludF9pZCcsICdwYWdlX2hhc2gnIF0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gZ2V0UGFnZURhdGEocGFnZUhhc2gsIGNhbGxiYWNrKSB7XG4gICAgaWYgKHBhZ2VIYXNoKSB7XG4gICAgICAgIC8vIFRoaXMgbW9kdWxlIGxvYWRzIHZlcnkgZWFybHkgaW4gdGhlIGFwcCBsaWZlY3ljbGUgYW5kIG1heSByZWNlaXZlIGV2ZW50cyBmcm9tIHRoZSBYRE0gZnJhbWUgYmVmb3JlIHBhZ2VcbiAgICAgICAgLy8gZGF0YSBoYXMgYmVlbiBsb2FkZWQuIEhvbGQgb250byBhbnkgc3VjaCBldmVudHMgdW50aWwgdGhlIHBhZ2UgZGF0YSBsb2FkcyBvciB3ZSB0aW1lb3V0LlxuICAgICAgICB2YXIgbWF4V2FpdFRpbWUgPSBEYXRlLm5vdygpICsgMTAwMDA7IC8vIEdpdmUgdXAgYWZ0ZXIgMTAgc2Vjb25kc1xuICAgICAgICB2YXIgaW50ZXJ2YWwgPSBzZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgcGFnZURhdGEgPSBQYWdlRGF0YS5nZXRQYWdlRGF0YShwYWdlSGFzaCk7XG4gICAgICAgICAgICBpZiAocGFnZURhdGEpIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhwYWdlRGF0YSk7XG4gICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChpbnRlcnZhbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoRGF0ZS5ub3coKSA+IG1heFdhaXRUaW1lKSB7XG4gICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChpbnRlcnZhbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIDUwKTtcbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHN0YXJ0OiBjaGVja0FuYWx5dGljc0Nvb2tpZXNcbn07IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEgYW50ZW5uYS1hdXRvLWN0YVwifSxcIm9cIjpcImNzc3Jlc2V0XCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtYXV0by1jdGEtaW5uZXJcIixcImFudC1jdGEtZm9yXCI6W3tcInRcIjoyLFwiclwiOlwiYW50SXRlbUlkXCJ9XX0sXCJmXCI6W3tcInRcIjo4LFwiclwiOlwibG9nb1wifSx7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1hdXRvLWN0YS1sYWJlbFwiLFwiYW50LXJlYWN0aW9ucy1sYWJlbC1mb3JcIjpbe1widFwiOjIsXCJyXCI6XCJhbnRJdGVtSWRcIn1dfX0se1widFwiOjQsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImFudC1leHBhbmRlZC1yZWFjdGlvbnMtZm9yXCI6W3tcInRcIjoyLFwiclwiOlwiYW50SXRlbUlkXCJ9XX19XSxcIm5cIjo1MCxcInJcIjpcImV4cGFuZFJlYWN0aW9uc1wifV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXBhZ2UgYW50ZW5uYS1ibG9ja2VkLXBhZ2VcIn0sXCJvXCI6XCJjc3NyZXNldFwiLFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWJvZHlcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJ2XCI6e1widGFwXCI6XCJiYWNrXCJ9LFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWJsb2NrZWQtYmFja1wifSxcImZcIjpbe1widFwiOjgsXCJyXCI6XCJsZWZ0XCJ9LHtcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcInJlYWN0aW9uc193aWRnZXRfX2JhY2tcXFwiKVwifX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWJsb2NrZWQtYm9keVwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1ibG9ja2VkLW1lc3NhZ2VcIn0sXCJmXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcImJsb2NrZWRfcGFnZV9fbWVzc2FnZTFcXFwiKVwifX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWJsb2NrZWQtbWVzc2FnZVwifSxcImZcIjpbe1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwiYmxvY2tlZF9wYWdlX19tZXNzYWdlMlxcXCIpXCJ9fV19XX1dfV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjQsXCJmXCI6W3tcInRcIjoyLFwiclwiOlwiY29udGFpbmVyRGF0YS5yZWFjdGlvblRvdGFsXCJ9XSxcIm5cIjo1MCxcInhcIjp7XCJyXCI6W1wiY29udGFpbmVyRGF0YS5yZWFjdGlvblRvdGFsXCIsXCJjb250YWluZXJEYXRhLmxvYWRlZFwiXSxcInNcIjpcIl8wJiZfMVwifX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NCxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpbXCJhbnRlbm5hLWN0YS1leHBhbmRlZC1yZWFjdGlvbiBcIix7XCJ0XCI6NCxcImZcIjpbXCJhbnRlbm5hLWN0YS1leHBhbmRlZC1maXJzdFwiXSxcIm5cIjo1MCxcInhcIjp7XCJyXCI6W1wiQGluZGV4XCJdLFwic1wiOlwiXzA9PT0wXCJ9fV19LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jdGEtZXhwYW5kZWQtdGV4dFwifSxcImZcIjpbe1widFwiOjIsXCJyXCI6XCIuL3RleHRcIn1dfSx7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jdGEtZXhwYW5kZWQtY291bnRcIn0sXCJmXCI6W3tcInRcIjoyLFwiclwiOlwiLi9jb3VudFwifV19XX1dLFwieFwiOntcInJcIjpbXCJjb21wdXRlRXhwYW5kZWRSZWFjdGlvbnNcIixcImNvbnRhaW5lckRhdGEucmVhY3Rpb25zXCJdLFwic1wiOlwiXzAoXzEpXCJ9fV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo0LFwiZlwiOlt7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJjYWxsX3RvX2FjdGlvbl9sYWJlbF9fcmVzcG9uc2VzXFxcIilcIn19XSxcIm5cIjo1MCxcInhcIjp7XCJyXCI6W1wiY29udGFpbmVyRGF0YS5sb2FkZWRcIixcImNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbFwiXSxcInNcIjpcIiFfMHx8XzE9PT11bmRlZmluZWR8fF8xPT09MFwifX0se1widFwiOjQsXCJuXCI6NTEsXCJmXCI6W3tcInRcIjo0LFwiblwiOjUwLFwieFwiOntcInJcIjpbXCJjb250YWluZXJEYXRhLnJlYWN0aW9uVG90YWxcIl0sXCJzXCI6XCJfMD09PTFcIn0sXCJmXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcImNhbGxfdG9fYWN0aW9uX2xhYmVsX19yZXNwb25zZXNfb25lXFxcIilcIn19XX0se1widFwiOjQsXCJuXCI6NTAsXCJ4XCI6e1wiclwiOltcImNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbFwiXSxcInNcIjpcIiEoXzA9PT0xKVwifSxcImZcIjpbXCIgXCIse1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIixcImNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbFwiXSxcInNcIjpcIl8wKFxcXCJjYWxsX3RvX2FjdGlvbl9sYWJlbF9fcmVzcG9uc2VzX21hbnlcXFwiLFtfMV0pXCJ9fV19XSxcInhcIjp7XCJyXCI6W1wiY29udGFpbmVyRGF0YS5sb2FkZWRcIixcImNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbFwiXSxcInNcIjpcIiFfMHx8XzE9PT11bmRlZmluZWR8fF8xPT09MFwifX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWNvbW1lbnQtYXJlYVwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb21tZW50LXdpZGdldHNcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwidGV4dGFyZWFcIixcInZcIjp7XCJpbnB1dFwiOlwiaW5wdXRjaGFuZ2VkXCJ9LFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWNvbW1lbnQtaW5wdXRcIixcInBsYWNlaG9sZGVyXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcImNvbW1lbnRfYXJlYV9fcGxhY2Vob2xkZXJcXFwiKVwifX1dLFwibWF4bGVuZ3RoXCI6XCI1MDBcIn19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY29tbWVudC1mb290ZXJcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWNvbW1lbnQtbGltaXRcIn0sXCJmXCI6W3tcInRcIjozLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcImNvbW1lbnRfYXJlYV9fY291bnRcXFwiKVwifX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImJ1dHRvblwiLFwiYVwiOntcImlkXCI6XCJhbnRlbm5hLWNvbW1lbnQtc3BhY2VyXCJ9fSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImJ1dHRvblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWNvbW1lbnQtc3VibWl0XCJ9LFwidlwiOntcInRhcFwiOlwiYWRkY29tbWVudFwifSxcImZcIjpbe1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwiY29tbWVudF9hcmVhX19hZGRcXFwiKVwifX1dfV19XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb21tZW50LXdhaXRpbmdcIn0sXCJmXCI6W1wiLi4uXCJdfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWNvbW1lbnQtcmVjZWl2ZWRcIn0sXCJmXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcImNvbW1lbnRfYXJlYV9fdGhhbmtzXFxcIilcIn19XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcGFnZSBhbnRlbm5hLWNvbW1lbnRzLXBhZ2VcIn0sXCJvXCI6XCJjc3NyZXNldFwiLFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWJvZHlcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJ2XCI6e1widGFwXCI6XCJiYWNrXCJ9LFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWNvbW1lbnRzLWJhY2tcIn0sXCJmXCI6W3tcInRcIjo4LFwiclwiOlwibGVmdFwifSx7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJyZWFjdGlvbnNfd2lkZ2V0X19iYWNrXFxcIilcIn19XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb21tZW50cy1oZWFkZXJcIn0sXCJmXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCIsXCJjb21tZW50cy5sZW5ndGhcIl0sXCJzXCI6XCJfMChcXFwiY29tbWVudHNfcGFnZV9faGVhZGVyXFxcIixbXzFdKVwifX1dfSxcIiBcIix7XCJ0XCI6NCxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOltcImFudGVubmEtY29tbWVudC1lbnRyeSBcIix7XCJ0XCI6NCxcImZcIjpbXCJhbnRlbm5hLWNvbW1lbnQtbmV3XCJdLFwiblwiOjUwLFwiclwiOlwiLi9uZXdcIn1dfSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJ0YWJsZVwiLFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInRyXCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwidGRcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb21tZW50LWNlbGxcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiaW1nXCIsXCJhXCI6e1wic3JjXCI6W3tcInRcIjoyLFwiclwiOlwiLi91c2VyLmltYWdlVVJMXCJ9XX19XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJ0ZFwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWNvbW1lbnQtYXV0aG9yXCJ9LFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcIi4vdXNlci5uYW1lXCJ9XX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcInRyXCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwidGRcIixcImZcIjpbXX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJ0ZFwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWNvbW1lbnQtdGV4dFwifSxcImZcIjpbe1widFwiOjIsXCJyXCI6XCIuL3RleHRcIn1dfV19XX1dfV0sXCJpXCI6XCJpbmRleFwiLFwiclwiOlwiY29tbWVudHNcIn0sXCIgXCIse1widFwiOjgsXCJyXCI6XCJjb21tZW50QXJlYVwifV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXBhZ2UgYW50ZW5uYS1jb25maXJtYXRpb24tcGFnZVwifSxcIm9cIjpcImNzc3Jlc2V0XCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtYm9keVwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb25maXJtLXJlYWN0aW9uXCJ9LFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcInRleHRcIn1dfSxcIiBcIix7XCJ0XCI6OCxcInJcIjpcImNvbW1lbnRBcmVhXCJ9XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1mb290ZXIgYW50ZW5uYS1jb25maXJtLWZvb3RlclwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtc2hhcmVcIn0sXCJmXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcImNvbmZpcm1hdGlvbl9wYWdlX19zaGFyZVxcXCIpXCJ9fSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImFcIixcInZcIjp7XCJ0YXBcIjpcInNoYXJlLWZhY2Vib29rXCJ9LFwiYVwiOntcImhyZWZcIjpcIi8vZmFjZWJvb2suY29tXCJ9LFwiZlwiOlt7XCJ0XCI6OCxcInJcIjpcImZhY2Vib29rSWNvblwifV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiYVwiLFwidlwiOntcInRhcFwiOlwic2hhcmUtdHdpdHRlclwifSxcImFcIjp7XCJocmVmXCI6XCIvL3R3aXR0ZXIuY29tXCJ9LFwiZlwiOlt7XCJ0XCI6OCxcInJcIjpcInR3aXR0ZXJJY29uXCJ9XX1dfV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NCxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYSBhbnRlbm5hLWNvbnRlbnRyZWMtaW5uZXJcIn0sXCJvXCI6XCJjc3NyZXNldFwiLFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWNvbnRlbnRyZWMtaGVhZGVyXCJ9LFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcInRpdGxlXCJ9XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb250ZW50cmVjLWVudHJpZXNcIn0sXCJmXCI6W3tcInRcIjo0LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6W1wiYW50ZW5uYS1jb250ZW50cmVjLWVudHJ5IGFudGVubmEtcmVzZXQgXCIse1widFwiOjQsXCJmXCI6W1wiYW50ZW5uYS1kZXNrdG9wXCJdLFwiblwiOjUxLFwiclwiOlwiaXNNb2JpbGVcIn1dLFwic3R5bGVcIjpbXCJ3aWR0aDpcIix7XCJ0XCI6MixcInJcIjpcImVudHJ5V2lkdGhcIn0sXCI7XCJdfSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJhXCIsXCJhXCI6e1wiaHJlZlwiOlt7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiY29tcHV0ZUVudHJ5VXJsXCIsXCIuXCJdLFwic1wiOlwiXzAoXzEpXCJ9fV0sXCJ0YXJnZXRcIjpbe1widFwiOjQsXCJmXCI6W1wiX3NlbGZcIl0sXCJuXCI6NTAsXCJyXCI6XCJpc01vYmlsZVwifSx7XCJ0XCI6NCxcIm5cIjo1MSxcImZcIjpbXCJfdGFyZ2V0XCJdLFwiclwiOlwiaXNNb2JpbGVcIn1dfSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb250ZW50cmVjLWVudHJ5LWlubmVyXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWNvbnRlbnRyZWMtZW50cnktaGVhZGVyXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWNvbnRlbnRyZWMtcmVhY3Rpb24tdGV4dFwifSxcImZcIjpbe1widFwiOjIsXCJyXCI6XCIuL3RvcF9yZWFjdGlvbi50ZXh0XCJ9XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb250ZW50cmVjLWluZGljYXRvci13cmFwcGVyXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWNvbnRlbnRyZWMtcmVhY3Rpb24taW5kaWNhdG9yXCJ9LFwiZlwiOlt7XCJ0XCI6OCxcInJcIjpcImxvZ29cIn0se1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY29udGVudHJlYy1yZWFjdGlvbi1jb3VudFwifSxcImZcIjpbXCIgXCIse1widFwiOjIsXCJyXCI6XCIuL3JlYWN0aW9uX2NvdW50XCJ9XX1dfV19XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb250ZW50cmVjLWJvZHlcIixcInN0eWxlXCI6W1wiYmFja2dyb3VuZDpcIix7XCJ0XCI6MixcInJ4XCI6e1wiclwiOlwiY29sb3JzXCIsXCJtXCI6W3tcInRcIjozMCxcIm5cIjpcImluZGV4XCJ9LFwiYmFja2dyb3VuZFwiXX19LFwiO2NvbG9yOlwiLHtcInRcIjoyLFwicnhcIjp7XCJyXCI6XCJjb2xvcnNcIixcIm1cIjpbe1widFwiOjMwLFwiblwiOlwiaW5kZXhcIn0sXCJmb3JlZ3JvdW5kXCJdfX0sXCI7XCJdfSxcImZcIjpbe1widFwiOjQsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY29udGVudHJlYy1ib2R5LWltYWdlXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImltZ1wiLFwiYVwiOntcInNyY1wiOlt7XCJ0XCI6MixcInJcIjpcIi4vY29udGVudC5ib2R5XCJ9XX19XX1dLFwiblwiOjUwLFwieFwiOntcInJcIjpbXCIuL2NvbnRlbnQudHlwZVwiXSxcInNcIjpcIl8wPT09XFxcImltYWdlXFxcIlwifX0se1widFwiOjQsXCJuXCI6NTEsXCJmXCI6W3tcInRcIjo0LFwiblwiOjUwLFwieFwiOntcInJcIjpbXCIuL2NvbnRlbnQudHlwZVwiXSxcInNcIjpcIl8wPT09XFxcInRleHRcXFwiXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWNvbnRlbnRyZWMtYm9keS10ZXh0XCJ9LFwib1wiOlwicmVuZGVyVGV4dFwiLFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcIi4vY29udGVudC5ib2R5XCJ9XX1dfV0sXCJ4XCI6e1wiclwiOltcIi4vY29udGVudC50eXBlXCJdLFwic1wiOlwiXzA9PT1cXFwiaW1hZ2VcXFwiXCJ9fV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY29udGVudHJlYy1wYWdlLXRpdGxlXCJ9LFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcIi4vcGFnZS50aXRsZVwifV19XX1dfV19XSxcImlcIjpcImluZGV4XCIsXCJyXCI6XCJjb250ZW50RGF0YS5lbnRyaWVzXCJ9XX1dfV0sXCJuXCI6NTAsXCJ4XCI6e1wiclwiOltcInBvcHVsYXRlQ29udGVudEVudHJpZXNcIixcInBhZ2VEYXRhLnN1bW1hcnlMb2FkZWRcIixcImNvbnRlbnREYXRhLmVudHJpZXNcIl0sXCJzXCI6XCJfMChfMSkmJl8yXCJ9fV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcGFnZSBhbnRlbm5hLWVycm9yLXBhZ2VcIn0sXCJvXCI6XCJjc3NyZXNldFwiLFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWJvZHlcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJ2XCI6e1widGFwXCI6XCJiYWNrXCJ9LFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWVycm9yLWJhY2tcIn0sXCJmXCI6W3tcInRcIjo4LFwiclwiOlwibGVmdFwifSx7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJyZWFjdGlvbnNfd2lkZ2V0X19iYWNrXFxcIilcIn19XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1lcnJvci1ib2R5XCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWVycm9yLW1lc3NhZ2VcIn0sXCJmXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcImVycm9yX3BhZ2VfX21lc3NhZ2VcXFwiKVwifX1dfV19XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcGFnZSBhbnRlbm5hLWxvY2F0aW9ucy1wYWdlXCJ9LFwib1wiOlwiY3NzcmVzZXRcIixcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1ib2R5XCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwidlwiOntcInRhcFwiOlwiYmFja1wifSxcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1sb2NhdGlvbnMtYmFja1wifSxcImZcIjpbe1widFwiOjgsXCJyXCI6XCJsZWZ0XCJ9LHtcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcInJlYWN0aW9uc193aWRnZXRfX2JhY2tcXFwiKVwifX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcInRhYmxlXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtbG9jYXRpb25zLXRhYmxlXCJ9LFwiZlwiOlt7XCJ0XCI6NCxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJ0clwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxvY2F0aW9ucy1jb250ZW50LXJvd1wifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJ0ZFwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxvY2F0aW9ucy1jb3VudC1jZWxsXCJ9LFwiZlwiOlt7XCJ0XCI6NCxcImZcIjpbe1widFwiOjMsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwibG9jYXRpb25zX3BhZ2VfX2NvdW50X29uZVxcXCIpXCJ9fV0sXCJuXCI6NTAsXCJ4XCI6e1wiclwiOltcInBhZ2VSZWFjdGlvbkNvdW50XCJdLFwic1wiOlwiXzA9PT0xXCJ9fSx7XCJ0XCI6NCxcIm5cIjo1MSxcImZcIjpbe1widFwiOjMsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIixcInBhZ2VSZWFjdGlvbkNvdW50XCJdLFwic1wiOlwiXzAoXFxcImxvY2F0aW9uc19wYWdlX19jb3VudF9tYW55XFxcIixbXzFdKVwifX1dLFwieFwiOntcInJcIjpbXCJwYWdlUmVhY3Rpb25Db3VudFwiXSxcInNcIjpcIl8wPT09MVwifX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcInRkXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtbG9jYXRpb25zLXBhZ2UtYm9keVwifSxcImZcIjpbe1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwibG9jYXRpb25zX3BhZ2VfX3BhZ2VsZXZlbFxcXCIpXCJ9fV19XX1dLFwiblwiOjUwLFwiclwiOlwicGFnZVJlYWN0aW9uQ291bnRcIn0sXCIgXCIse1widFwiOjQsXCJmXCI6W3tcInRcIjo0LFwiZlwiOltcIiBcIix7XCJ0XCI6NyxcImVcIjpcInRyXCIsXCJ2XCI6e1widGFwXCI6XCJyZXZlYWxcIn0sXCJhXCI6e1wiY2xhc3NcIjpbXCJhbnRlbm5hLWxvY2F0aW9ucy1jb250ZW50LXJvdyBcIix7XCJ0XCI6NCxcImZcIjpbXCJhbnRlbm5hLWxvY2F0ZVwiXSxcIm5cIjo1MCxcInhcIjp7XCJyXCI6W1wiY2FuTG9jYXRlXCIsXCIuL2NvbnRhaW5lckhhc2hcIl0sXCJzXCI6XCJfMChfMSlcIn19XX0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwidGRcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1sb2NhdGlvbnMtY291bnQtY2VsbFwifSxcImZcIjpbe1widFwiOjQsXCJmXCI6W3tcInRcIjozLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcImxvY2F0aW9uc19wYWdlX19jb3VudF9vbmVcXFwiKVwifX1dLFwiblwiOjUwLFwieFwiOntcInJcIjpbXCIuL2NvdW50XCJdLFwic1wiOlwiXzA9PT0xXCJ9fSx7XCJ0XCI6NCxcIm5cIjo1MSxcImZcIjpbe1widFwiOjMsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIixcIi4vY291bnRcIl0sXCJzXCI6XCJfMChcXFwibG9jYXRpb25zX3BhZ2VfX2NvdW50X21hbnlcXFwiLFtfMV0pXCJ9fV0sXCJ4XCI6e1wiclwiOltcIi4vY291bnRcIl0sXCJzXCI6XCJfMD09PTFcIn19XX0sXCIgXCIse1widFwiOjQsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwidGRcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1sb2NhdGlvbnMtdGV4dC1ib2R5XCJ9LFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcIi4vYm9keVwifV19XSxcIm5cIjo1MCxcInhcIjp7XCJyXCI6W1wiLi9raW5kXCJdLFwic1wiOlwiXzA9PT1cXFwidHh0XFxcIlwifX0se1widFwiOjQsXCJuXCI6NTEsXCJmXCI6W3tcInRcIjo0LFwiblwiOjUwLFwieFwiOntcInJcIjpbXCIuL2tpbmRcIl0sXCJzXCI6XCJfMD09PVxcXCJpbWdcXFwiXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInRkXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtbG9jYXRpb25zLWltYWdlLWJvZHlcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiaW1nXCIsXCJhXCI6e1wic3JjXCI6W3tcInRcIjoyLFwiclwiOlwiLi9ib2R5XCJ9XX19XX1dfSx7XCJ0XCI6NCxcIm5cIjo1MCxcInhcIjp7XCJyXCI6W1wiLi9raW5kXCJdLFwic1wiOlwiKCEoXzA9PT1cXFwiaW1nXFxcIikpJiYoXzA9PT1cXFwibWVkXFxcIilcIn0sXCJmXCI6W1wiIFwiLHtcInRcIjo3LFwiZVwiOlwidGRcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1sb2NhdGlvbnMtbWVkaWEtYm9keVwifSxcImZcIjpbe1widFwiOjgsXCJyXCI6XCJmaWxtXCJ9LHtcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxvY2F0aW9ucy12aWRlb1wifSxcImZcIjpbe1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwibG9jYXRpb25zX3BhZ2VfX3ZpZGVvXFxcIilcIn19XX1dfV19LHtcInRcIjo0LFwiblwiOjUwLFwieFwiOntcInJcIjpbXCIuL2tpbmRcIl0sXCJzXCI6XCIoIShfMD09PVxcXCJpbWdcXFwiKSkmJighKF8wPT09XFxcIm1lZFxcXCIpKVwifSxcImZcIjpbXCIgXCIse1widFwiOjcsXCJlXCI6XCJ0ZFwiLFwiZlwiOltcIsKgXCJdfV19XSxcInhcIjp7XCJyXCI6W1wiLi9raW5kXCJdLFwic1wiOlwiXzA9PT1cXFwidHh0XFxcIlwifX1dfV0sXCJuXCI6NTAsXCJ4XCI6e1wiclwiOltcIi4va2luZFwiXSxcInNcIjpcIl8wIT09XFxcInBhZ1xcXCJcIn19XSxcImlcIjpcImlkXCIsXCJyXCI6XCJsb2NhdGlvbkRhdGFcIn1dfV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXBhZ2UgYW50ZW5uYS1sb2dpbi1wYWdlXCJ9LFwib1wiOlwiY3NzcmVzZXRcIixcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1ib2R5XCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwidlwiOntcInRhcFwiOlwiYmFja1wifSxcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1sb2dpbi1iYWNrXCJ9LFwiZlwiOlt7XCJ0XCI6OCxcInJcIjpcImxlZnRcIn0se1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwicmVhY3Rpb25zX3dpZGdldF9fYmFja1xcXCIpXCJ9fV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtbG9naW4tY29udGFpbmVyXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxvZ2luLWNvbnRlbnRcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtbG9naW4tbWVzc2FnZVwifSxcImZcIjpbe1widFwiOjMsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIixcImdyb3VwTmFtZVwiXSxcInNcIjpcIl8wKFxcXCJsb2dpbl9wYWdlX19tZXNzYWdlXzFcXFwiLFtfMV0pXCJ9fV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtbG9naW4tbWVzc2FnZVwifSxcImZcIjpbe1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwibG9naW5fcGFnZV9fbWVzc2FnZV8yXFxcIilcIn19XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1sb2dpbi1idXR0b25zXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJmYi1sb2dpbi1idXR0b25cIn0sXCJ2XCI6e1widGFwXCI6XCJmYWNlYm9va0xvZ2luXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImltZ1wiLFwiYVwiOntcInNyY1wiOlwiL3N0YXRpYy93aWRnZXQvaW1hZ2VzL2ZiLWxvZ2luX3RvX3JlYWRyYm9hcmQucG5nXCJ9fV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtb3JcIn0sXCJmXCI6W1wib3JcIl19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtbG9naW4tYnV0dG9uXCJ9LFwidlwiOntcInRhcFwiOlwiYW50ZW5uYUxvZ2luXCJ9LFwiZlwiOlt7XCJ0XCI6OCxcInJcIjpcImxvZ29cIn0se1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtbG9naW4tdGV4dFwifSxcImZcIjpbXCJMb2dpbiB0byBBbnRlbm5hXCJdfV19XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1wcml2YWN5LXRleHRcIn0sXCJmXCI6W3tcInRcIjozLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcImxvZ2luX3BhZ2VfX3ByaXZhY3lcXFwiKVwifX1dfV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtbG9naW4tcGVuZGluZ1wifSxcImZcIjpbe1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwibG9naW5fcGFnZV9fcGVuZGluZ19wcmVcXFwiKVwifX0se1widFwiOjcsXCJlXCI6XCJhXCIsXCJhXCI6e1wiaHJlZlwiOlwiamF2YXNjcmlwdDp2b2lkKDApO1wifSxcInZcIjp7XCJ0YXBcIjpcInJldHJ5XCJ9LFwiZlwiOlt7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJsb2dpbl9wYWdlX19wZW5kaW5nX2NsaWNrXFxcIilcIn19XX0se1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwibG9naW5fcGFnZV9fcGVuZGluZ19wb3N0XFxcIilcIn19XX1dfV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcIm9cIjpcImNzc3Jlc2V0XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEgYW50ZW5uYS1tZWRpYS1pbmRpY2F0b3Itd3JhcHBlclwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJtXCI6W3tcInRcIjoyLFwiclwiOlwiZXh0cmFBdHRyaWJ1dGVzXCJ9XSxcImFcIjp7XCJjbGFzc1wiOltcImFudGVubmEgYW50ZW5uYS1tZWRpYS1pbmRpY2F0b3Itd2lkZ2V0IFwiLHtcInRcIjo0LFwiZlwiOltcImFudGVubmEtbm90bG9hZGVkXCJdLFwiblwiOjUxLFwiclwiOlwiY29udGFpbmVyRGF0YS5sb2FkZWRcIn0sXCIgYW50ZW5uYS1yZXNldCBcIix7XCJ0XCI6NCxcImZcIjpbXCJhbnRlbm5hLXRvdWNoXCJdLFwiblwiOjUwLFwiclwiOlwic3VwcG9ydHNUb3VjaFwifV19LFwiZlwiOltcIiBcIix7XCJ0XCI6OCxcInJcIjpcImxvZ29cIn0sXCIgXCIse1widFwiOjQsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXJlYWN0aW9uLXRvdGFsXCJ9LFwib1wiOlwiY3NzcmVzZXRcIixcImZcIjpbe1widFwiOjIsXCJyXCI6XCJjb250YWluZXJEYXRhLnJlYWN0aW9uVG90YWxcIn1dfV0sXCJuXCI6NTAsXCJyXCI6XCJjb250YWluZXJEYXRhLnJlYWN0aW9uVG90YWxcIn0se1widFwiOjQsXCJuXCI6NTEsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXJlYWN0aW9uLXByb21wdFwifSxcImZcIjpbe1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwibWVkaWFfaW5kaWNhdG9yX190aGlua1xcXCIpXCJ9fV19XSxcInJcIjpcImNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbFwifV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXBhZ2UgYW50ZW5uYS1wZW5kaW5nLXBhZ2VcIn0sXCJvXCI6XCJjc3NyZXNldFwiLFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWJvZHlcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcGVuZGluZy1yZWFjdGlvblwifSxcImZcIjpbe1widFwiOjIsXCJyXCI6XCJ0ZXh0XCJ9XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1wZW5kaW5nLW1lc3NhZ2VcIn0sXCJmXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcInBlbmRpbmdfcGFnZV9fbWVzc2FnZV9hcHBlYXJcXFwiKVwifX1dfV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXBvcHVwXCJ9LFwib1wiOlwiY3NzcmVzZXRcIixcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1wb3B1cC1ib2R5XCJ9LFwiZlwiOlt7XCJ0XCI6OCxcInJcIjpcImxvZ29cIn0se1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcG9wdXAtdGV4dFwifSxcImZcIjpbe1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwicG9wdXBfd2lkZ2V0X190aGlua1xcXCIpXCJ9fV19XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcGFnZSBhbnRlbm5hLXJlYWN0aW9ucy1wYWdlXCJ9LFwib1wiOlwiY3NzcmVzZXRcIixcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1ib2R5XCJ9LFwiZlwiOlt7XCJ0XCI6NCxcImZcIjpbe1widFwiOjQsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJ2XCI6e1widGFwXCI6XCJyZWFjdFwiLFwibW91c2VlbnRlclwiOlwiaGlnaGxpZ2h0XCIsXCJtb3VzZWxlYXZlXCI6XCJjbGVhcmhpZ2hsaWdodHNcIn0sXCJhXCI6e1wiY2xhc3NcIjpbXCJhbnRlbm5hLXJlYWN0aW9uIFwiLHtcInRcIjoyLFwieFwiOntcInJcIjpbXCJyZWFjdGlvbnNMYXlvdXRDbGFzc1wiLFwiaW5kZXhcIl0sXCJzXCI6XCJfMChfMSlcIn19XX0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcmVhY3Rpb24tYm94XCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6W1wiYW50ZW5uYS1yZWFjdGlvbi10ZXh0IFwiLHtcInRcIjo0LFwiZlwiOltcImFudGVubmEtcmVhY3Rpb24temVyb1wiXSxcIm5cIjo1MSxcInJcIjpcIi4vY291bnRcIn1dfSxcIm9cIjpcInNpemV0b2ZpdFwiLFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcIi4vdGV4dFwifV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcmVhY3Rpb24tY291bnRcIn0sXCJmXCI6W3tcInRcIjoyLFwiclwiOlwiLi9jb3VudFwifV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcGx1c29uZVwifSxcImZcIjpbXCIrMVwiXX0sXCIgXCIse1widFwiOjQsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJ2XCI6e1widGFwXCI6XCJzaG93bG9jYXRpb25zXCJ9LFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXJlYWN0aW9uLWxvY2F0aW9uXCJ9LFwiZlwiOlt7XCJ0XCI6OCxcInJcIjpcImxvY2F0aW9uSWNvblwifV19XSxcIm5cIjo1MCxcInhcIjp7XCJyXCI6W1wiaXNTdW1tYXJ5XCIsXCIuL2NvdW50XCJdLFwic1wiOlwiXzAmJl8xXCJ9fSx7XCJ0XCI6NCxcIm5cIjo1MSxcImZcIjpbe1widFwiOjQsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJ2XCI6e1widGFwXCI6XCJzaG93Y29tbWVudHNcIn0sXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcmVhY3Rpb24tY29tbWVudHMgaGFzY29tbWVudHNcIn0sXCJmXCI6W3tcInRcIjo4LFwiclwiOlwiY29tbWVudHNJY29uXCJ9LFwiIFwiLHtcInRcIjoyLFwiclwiOlwiLi9jb21tZW50Q291bnRcIn1dfV0sXCJuXCI6NTAsXCJyXCI6XCIuL2NvbW1lbnRDb3VudFwifV0sXCJ4XCI6e1wiclwiOltcImlzU3VtbWFyeVwiLFwiLi9jb3VudFwiXSxcInNcIjpcIl8wJiZfMVwifX1dfV19XSxcImlcIjpcImluZGV4XCIsXCJyXCI6XCJyZWFjdGlvbnNcIn1dLFwiblwiOjUwLFwiclwiOlwicmVhY3Rpb25zXCJ9XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1mb290ZXIgYW50ZW5uYS1yZWFjdGlvbnMtZm9vdGVyXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWN1c3RvbS1hcmVhXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImlucHV0XCIsXCJ2XCI6e1wiZm9jdXNcIjpcImN1c3RvbWZvY3VzXCIsXCJrZXlkb3duXCI6XCJpbnB1dGtleWRvd25cIixcImJsdXJcIjpcImN1c3RvbWJsdXJcIn0sXCJhXCI6e1widmFsdWVcIjpbe1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwicmVhY3Rpb25zX3BhZ2VfX2FkZFxcXCIpXCJ9fV0sXCJtYXhsZW5ndGhcIjpcIjI1XCJ9fSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImJ1dHRvblwiLFwidlwiOntcInRhcFwiOlwibmV3Y3VzdG9tXCJ9LFwiZlwiOlt7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJyZWFjdGlvbnNfcGFnZV9fb2tcXFwiKVwifX1dfV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtdGV4dC1sb2dvXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImFcIixcImFcIjp7XCJocmVmXCI6XCIvL3d3dy5hbnRlbm5hLmlzXCJ9LFwiZlwiOltcIkFudGVubmFcIl19XX1dfV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOltcImFudGVubmEgYW50ZW5uYS1yZWFjdGlvbnMtd2lkZ2V0IFwiLHtcInRcIjo0LFwiZlwiOltcImFudGVubmEtdG91Y2hcIl0sXCJuXCI6NTAsXCJyXCI6XCJzdXBwb3J0c1RvdWNoXCJ9XSxcInRhYmluZGV4XCI6XCIwXCJ9LFwib1wiOlwiY3NzcmVzZXRcIixcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1oZWFkZXJcIn0sXCJmXCI6W3tcInRcIjo4LFwiclwiOlwibG9nb1wifSx7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1yZWFjdGlvbnMtdGl0bGVcIn0sXCJmXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcInJlYWN0aW9uc193aWRnZXRfX3RpdGxlXFxcIilcIn19XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJ2XCI6e1widGFwXCI6XCJjbG9zZVwifSxcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1yZWFjdGlvbnMtY2xvc2VcIn0sXCJmXCI6W1wiWFwiXX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXBhZ2UtY29udGFpbmVyXCJ9LFwiZlwiOltcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXByb2dyZXNzLXBhZ2UgYW50ZW5uYS1wYWdlXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWJvZHlcIn0sXCJmXCI6W119LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcHJvZ3Jlc3Mtc3Bpbm5lclwifSxcImZcIjpbe1widFwiOjgsXCJyXCI6XCJsb2dvXCJ9XX1dfV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwib1wiOlwiY3NzcmVzZXRcIixcImFcIjp7XCJjbGFzc1wiOltcImFudGVubmEgYW50ZW5uYS1zdW1tYXJ5LXdpZGdldCBuby1hbnQgXCIse1widFwiOjQsXCJmXCI6W1wiYW50ZW5uYS1ub3Rsb2FkZWRcIl0sXCJuXCI6NTEsXCJyXCI6XCJwYWdlRGF0YS5zdW1tYXJ5TG9hZGVkXCJ9LFwiIGFudGVubmEtcmVzZXQgXCIse1widFwiOjQsXCJmXCI6W1wiYW50ZW5uYS1leHBhbmRlZC1zdW1tYXJ5XCJdLFwiblwiOjUwLFwiclwiOlwiaXNFeHBhbmRlZFN1bW1hcnlcIn1dfSxcImZcIjpbXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1zdW1tYXJ5LWlubmVyXCJ9LFwiZlwiOlt7XCJ0XCI6OCxcInJcIjpcImxvZ29cIn0se1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtc3VtbWFyeS10aXRsZVwifSxcImZcIjpbXCIgXCIse1widFwiOjQsXCJmXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcInN1bW1hcnlfd2lkZ2V0X19yZWFjdGlvbnNcXFwiKVwifX1dLFwiblwiOjUwLFwieFwiOntcInJcIjpbXCJwYWdlRGF0YS5zdW1tYXJ5VG90YWxcIl0sXCJzXCI6XCJfMD09PTBcIn19LHtcInRcIjo0LFwiblwiOjUxLFwiZlwiOlt7XCJ0XCI6NCxcIm5cIjo1MCxcInhcIjp7XCJyXCI6W1wicGFnZURhdGEuc3VtbWFyeVRvdGFsXCJdLFwic1wiOlwiXzA9PT0xXCJ9LFwiZlwiOlt7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJzdW1tYXJ5X3dpZGdldF9fcmVhY3Rpb25zX29uZVxcXCIpXCJ9fV19LHtcInRcIjo0LFwiblwiOjUwLFwieFwiOntcInJcIjpbXCJwYWdlRGF0YS5zdW1tYXJ5VG90YWxcIl0sXCJzXCI6XCIhKF8wPT09MSlcIn0sXCJmXCI6W1wiIFwiLHtcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCIsXCJwYWdlRGF0YS5zdW1tYXJ5VG90YWxcIl0sXCJzXCI6XCJfMChcXFwic3VtbWFyeV93aWRnZXRfX3JlYWN0aW9uc19tYW55XFxcIixbXzFdKVwifX1dfV0sXCJ4XCI6e1wiclwiOltcInBhZ2VEYXRhLnN1bW1hcnlUb3RhbFwiXSxcInNcIjpcIl8wPT09MFwifX1dfSx7XCJ0XCI6NCxcImZcIjpbe1widFwiOjQsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwib1wiOlwiY3NzcmVzZXRcIixcImFcIjp7XCJjbGFzc1wiOltcImFudGVubmEtZXhwYW5kZWQtcmVhY3Rpb24gXCIse1widFwiOjQsXCJmXCI6W1wiYW50ZW5uYS1leHBhbmRlZC1maXJzdFwiXSxcIm5cIjo1MCxcInhcIjp7XCJyXCI6W1wiQGluZGV4XCJdLFwic1wiOlwiXzA9PT0wXCJ9fV19LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1leHBhbmRlZC10ZXh0XCJ9LFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcIi4vdGV4dFwifV19LHtcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWV4cGFuZGVkLWNvdW50XCJ9LFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcIi4vY291bnRcIn1dfV19XSxcInhcIjp7XCJyXCI6W1wiY29tcHV0ZUV4cGFuZGVkUmVhY3Rpb25zXCIsXCJwYWdlRGF0YS5zdW1tYXJ5UmVhY3Rpb25zXCJdLFwic1wiOlwiXzAoXzEpXCJ9fV0sXCJuXCI6NTAsXCJyXCI6XCJpc0V4cGFuZGVkU3VtbWFyeVwifV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb21tZW50c1wifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJzdmdcIixcImZcIjpbe1widFwiOjcsXCJlXCI6XCJ1c2VcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb21tZW50cy1wYXRoXCIsXCJ4bGluazpocmVmXCI6XCIjYW50ZW5uYS1zdmctY29tbWVudFwifX1dfV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtZmFjZWJvb2tcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3ZnXCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwidXNlXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtZmFjZWJvb2stcGF0aFwiLFwieGxpbms6aHJlZlwiOlwiI2FudGVubmEtc3ZnLWZhY2Vib29rXCJ9fV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1maWxtXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInN2Z1wiLFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInVzZVwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWZpbG0tcGF0aFwiLFwieGxpbms6aHJlZlwiOlwiI2FudGVubmEtc3ZnLWZpbG1cIn19XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxlZnRcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3ZnXCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwidXNlXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtbGVmdC1wYXRoXCIsXCJ4bGluazpocmVmXCI6XCIjYW50ZW5uYS1zdmctbGVmdFwifX1dfV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtbG9jYXRpb25cIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3ZnXCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwidXNlXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtbG9jYXRpb24tcGF0aFwiLFwieGxpbms6aHJlZlwiOlwiI2FudGVubmEtc3ZnLXNlYXJjaFwifX1dfV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtbG9nb1wifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJzdmdcIixcImFcIjp7XCJ2aWV3Qm94XCI6XCIwIDAgNTEyIDUxMlwifSxcImZcIjpbXCIgXCIse1widFwiOjcsXCJlXCI6XCJwYXRoXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtbG9nby1wYXRoXCIsXCJkXCI6XCJtMjgzIDUxMGMxMjUtMTcgMjI5LTEyNCAyMjktMjUzIDAtMTQxLTExNS0yNTYtMjU2LTI1Ni0xNDEgMC0yNTYgMTE1LTI1NiAyNTYgMCAxMzAgMTA4IDIzNyAyMzMgMjU0bDAtMTQ5Yy00OC0xNC04NC01MC04NC0xMDIgMC02NSA0My0xMTMgMTA4LTExMyA2NSAwIDEwNyA0OCAxMDcgMTEzIDAgNTItMzMgODgtODEgMTAyelwifX1dfV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtbG9nb1wifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJzdmdcIixcImZcIjpbe1widFwiOjcsXCJlXCI6XCJ1c2VcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1sb2dvLXBhdGhcIixcInhsaW5rOmhyZWZcIjpcIiNhbnRlbm5hLXN2Zy1sb2dvXCJ9fV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS10d2l0dGVyXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInN2Z1wiLFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInVzZVwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXR3aXR0ZXItcGF0aFwiLFwieGxpbms6aHJlZlwiOlwiI2FudGVubmEtc3ZnLXR3aXR0ZXJcIn19XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwic3ZnXCIsXCJhXCI6e1wieG1sbnNcIjpcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIsXCJzdHlsZVwiOlwiZGlzcGxheTogbm9uZTtcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3ltYm9sXCIsXCJhXCI6e1wiaWRcIjpcImFudGVubmEtc3ZnLXR3aXR0ZXJcIixcInZpZXdCb3hcIjpcIjAgMCA1MTIgNTEyXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInBhdGhcIixcImFcIjp7XCJkXCI6XCJtNDUzIDEzNGMtMTQgNi0zMCAxMS00NiAxMmMxNi0xMCAyOS0yNSAzNS00NGMtMTUgOS0zMyAxNi01MSAxOWMtMTUtMTUtMzYtMjUtNTktMjVjLTQ1IDAtODEgMzYtODEgODFjMCA2IDEgMTIgMiAxOGMtNjctMy0xMjctMzUtMTY3LTg0Yy03IDEyLTExIDI1LTExIDQwYzAgMjggMTUgNTMgMzYgNjhjLTEzLTEtMjUtNC0zNi0xMWMwIDEgMCAxIDAgMmMwIDM5IDI4IDcxIDY1IDc5Yy03IDItMTQgMy0yMiAzYy01IDAtMTAtMS0xNS0yYzEwIDMyIDQwIDU2IDc2IDU2Yy0yOCAyMi02MyAzNS0xMDEgMzVjLTYgMC0xMyAwLTE5LTFjMzYgMjMgNzggMzYgMTI0IDM2YzE0OSAwIDIzMC0xMjMgMjMwLTIzMGMwLTMgMC03IDAtMTBjMTYtMTIgMjktMjYgNDAtNDJ6XCJ9fV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwic3ltYm9sXCIsXCJhXCI6e1wiaWRcIjpcImFudGVubmEtc3ZnLWZhY2Vib29rXCIsXCJ2aWV3Qm94XCI6XCIwIDAgNTEyIDUxMlwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJwYXRoXCIsXCJhXCI6e1wiZFwiOlwibTQyMCA3MmwtMzI4IDBjLTExIDAtMjAgOS0yMCAyMGwwIDMyOGMwIDExIDkgMjAgMjAgMjBsMTc3IDBsMC0xNDJsLTQ4IDBsMC01Nmw0OCAwbDAtNDFjMC00OCAyOS03NCA3MS03NGMyMCAwIDM4IDIgNDMgM2wwIDQ5bC0yOSAwYy0yMyAwLTI4IDExLTI4IDI3bDAgMzZsNTUgMGwtNyA1NmwtNDggMGwwIDE0Mmw5NCAwYzExIDAgMjAtOSAyMC0yMGwwLTMyOGMwLTExLTktMjAtMjAtMjB6XCJ9fV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwic3ltYm9sXCIsXCJhXCI6e1wiaWRcIjpcImFudGVubmEtc3ZnLWNvbW1lbnRcIixcInZpZXdCb3hcIjpcIjAgMCA1MTIgNTEyXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInBhdGhcIixcImFcIjp7XCJkXCI6XCJtNTEyIDI1NmMwIDMzLTExIDY0LTM0IDkyYy0yMyAyOC01NCA1MC05MyA2NmMtNDAgMTctODMgMjUtMTI5IDI1Yy0xMyAwLTI3LTEtNDEtMmMtMzggMzMtODIgNTYtMTMyIDY5Yy05IDItMjAgNC0zMiA2Yy00IDAtNyAwLTktM2MtMy0yLTQtNC01LThsMCAwYy0xLTEtMS0yIDAtNGMwLTEgMC0yIDAtMmMwLTEgMS0yIDItM2wxLTNjMCAwIDEtMSAyLTJjMi0yIDItMyAzLTNjMS0xIDQtNSA4LTEwYzUtNSA4LTggMTAtMTBjMi0zIDUtNiA5LTEyYzQtNSA3LTEwIDktMTRjMy01IDUtMTAgOC0xN2MzLTcgNS0xNCA4LTIyYy0zMC0xNy01NC0zOC03MS02M2MtMTctMjUtMjYtNTEtMjYtODBjMC0yNSA3LTQ4IDIwLTcxYzE0LTIzIDMyLTQyIDU1LTU4YzIzLTE3IDUwLTMwIDgyLTM5YzMxLTEwIDY0LTE1IDk5LTE1YzQ2IDAgODkgOCAxMjkgMjVjMzkgMTYgNzAgMzggOTMgNjZjMjMgMjggMzQgNTkgMzQgOTJ6XCJ9fV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwic3ltYm9sXCIsXCJhXCI6e1wiaWRcIjpcImFudGVubmEtc3ZnLXNlYXJjaFwiLFwidmlld0JveFwiOlwiMCAwIDUxMiA1MTJcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwicGF0aFwiLFwiYVwiOntcImRcIjpcIm0zNDcgMjM4YzAtMzYtMTItNjYtMzctOTFjLTI1LTI1LTU1LTM3LTkxLTM3Yy0zNSAwLTY1IDEyLTkwIDM3Yy0yNSAyNS0zOCA1NS0zOCA5MWMwIDM1IDEzIDY1IDM4IDkwYzI1IDI1IDU1IDM4IDkwIDM4YzM2IDAgNjYtMTMgOTEtMzhjMjUtMjUgMzctNTUgMzctOTB6IG0xNDcgMjM3YzAgMTAtNCAxOS0xMSAyNmMtNyA3LTE2IDExLTI2IDExYy0xMCAwLTE5LTQtMjYtMTFsLTk4LTk4Yy0zNCAyNC03MiAzNi0xMTQgMzZjLTI3IDAtNTMtNS03OC0xNmMtMjUtMTEtNDYtMjUtNjQtNDNjLTE4LTE4LTMyLTM5LTQzLTY0Yy0xMC0yNS0xNi01MS0xNi03OGMwLTI4IDYtNTQgMTYtNzhjMTEtMjUgMjUtNDcgNDMtNjVjMTgtMTggMzktMzIgNjQtNDNjMjUtMTAgNTEtMTUgNzgtMTVjMjggMCA1NCA1IDc5IDE1YzI0IDExIDQ2IDI1IDY0IDQzYzE4IDE4IDMyIDQwIDQzIDY1YzEwIDI0IDE2IDUwIDE2IDc4YzAgNDItMTIgODAtMzYgMTE0bDk4IDk4YzcgNyAxMSAxNSAxMSAyNXpcIn19XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJzeW1ib2xcIixcImFcIjp7XCJpZFwiOlwiYW50ZW5uYS1zdmctbGVmdFwiLFwidmlld0JveFwiOlwiMCAwIDUxMiA1MTJcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwicGF0aFwiLFwiYVwiOntcImRcIjpcIm0zNjggMTYwbC02NC02NC0xNjAgMTYwIDE2MCAxNjAgNjQtNjQtOTYtOTZ6XCJ9fV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwic3ltYm9sXCIsXCJhXCI6e1wiaWRcIjpcImFudGVubmEtc3ZnLWxvZ29cIixcInZpZXdCb3hcIjpcIjAgMCA1MTIgNTEyXCJ9LFwiZlwiOltcIiBcIix7XCJ0XCI6NyxcImVcIjpcInBhdGhcIixcImFcIjp7XCJkXCI6XCJtMjgzIDUxMGMxMjUtMTcgMjI5LTEyNCAyMjktMjUzIDAtMTQxLTExNS0yNTYtMjU2LTI1Ni0xNDEgMC0yNTYgMTE1LTI1NiAyNTYgMCAxMzAgMTA4IDIzNyAyMzMgMjU0bDAtMTQ5Yy00OC0xNC04NC01MC04NC0xMDIgMC02NSA0My0xMTMgMTA4LTExMyA2NSAwIDEwNyA0OCAxMDcgMTEzIDAgNTItMzMgODgtODEgMTAyelwifX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcInN5bWJvbFwiLFwiYVwiOntcImlkXCI6XCJhbnRlbm5hLXN2Zy1maWxtXCIsXCJ2aWV3Qm94XCI6XCIwIDAgNTEyIDUxMlwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJwYXRoXCIsXCJhXCI6e1wiZFwiOlwibTkxIDQ1N2wwLTM2YzAtNS0xLTEwLTUtMTMtNC00LTgtNi0xMy02bC0zNiAwYy01IDAtMTAgMi0xMyA2LTQgMy02IDgtNiAxM2wwIDM2YzAgNSAyIDkgNiAxMyAzIDQgOCA1IDEzIDVsMzYgMGM1IDAgOS0xIDEzLTUgNC00IDUtOCA1LTEzeiBtMC0xMTBsMC0zNmMwLTUtMS05LTUtMTMtNC00LTgtNS0xMy01bC0zNiAwYy01IDAtMTAgMS0xMyA1LTQgNC02IDgtNiAxM2wwIDM2YzAgNSAyIDEwIDYgMTMgMyA0IDggNiAxMyA2bDM2IDBjNSAwIDktMiAxMy02IDQtMyA1LTggNS0xM3ogbTAtMTA5bDAtMzdjMC01LTEtOS01LTEzLTQtMy04LTUtMTMtNWwtMzYgMGMtNSAwLTEwIDItMTMgNS00IDQtNiA4LTYgMTNsMCAzN2MwIDUgMiA5IDYgMTMgMyAzIDggNSAxMyA1bDM2IDBjNSAwIDktMiAxMy01IDQtNCA1LTggNS0xM3ogbTI5MyAyMTlsMC0xNDZjMC01LTItOS01LTEzLTQtNC04LTUtMTMtNWwtMjIwIDBjLTUgMC05IDEtMTMgNS0zIDQtNSA4LTUgMTNsMCAxNDZjMCA1IDIgOSA1IDEzIDQgNCA4IDUgMTMgNWwyMjAgMGM1IDAgOS0xIDEzLTUgMy00IDUtOCA1LTEzeiBtLTI5My0zMjlsMC0zN2MwLTUtMS05LTUtMTItNC00LTgtNi0xMy02bC0zNiAwYy01IDAtMTAgMi0xMyA2LTQgMy02IDctNiAxMmwwIDM3YzAgNSAyIDkgNiAxMyAzIDMgOCA1IDEzIDVsMzYgMGM1IDAgOS0yIDEzLTUgNC00IDUtOCA1LTEzeiBtNDAzIDMyOWwwLTM2YzAtNS0yLTEwLTYtMTMtMy00LTgtNi0xMy02bC0zNiAwYy01IDAtOSAyLTEzIDYtNCAzLTUgOC01IDEzbDAgMzZjMCA1IDEgOSA1IDEzIDQgNCA4IDUgMTMgNWwzNiAwYzUgMCAxMC0xIDEzLTUgNC00IDYtOCA2LTEzeiBtLTExMC0yMTlsMC0xNDdjMC01LTItOS01LTEyLTQtNC04LTYtMTMtNmwtMjIwIDBjLTUgMC05IDItMTMgNi0zIDMtNSA3LTUgMTJsMCAxNDdjMCA1IDIgOSA1IDEzIDQgMyA4IDUgMTMgNWwyMjAgMGM1IDAgOS0yIDEzLTUgMy00IDUtOCA1LTEzeiBtMTEwIDEwOWwwLTM2YzAtNS0yLTktNi0xMy0zLTQtOC01LTEzLTVsLTM2IDBjLTUgMC05IDEtMTMgNS00IDQtNSA4LTUgMTNsMCAzNmMwIDUgMSAxMCA1IDEzIDQgNCA4IDYgMTMgNmwzNiAwYzUgMCAxMC0yIDEzLTYgNC0zIDYtOCA2LTEzeiBtMC0xMDlsMC0zN2MwLTUtMi05LTYtMTMtMy0zLTgtNS0xMy01bC0zNiAwYy01IDAtOSAyLTEzIDUtNCA0LTUgOC01IDEzbDAgMzdjMCA1IDEgOSA1IDEzIDQgMyA4IDUgMTMgNWwzNiAwYzUgMCAxMC0yIDEzLTUgNC00IDYtOCA2LTEzeiBtMC0xMTBsMC0zN2MwLTUtMi05LTYtMTItMy00LTgtNi0xMy02bC0zNiAwYy01IDAtOSAyLTEzIDYtNCAzLTUgNy01IDEybDAgMzdjMCA1IDEgOSA1IDEzIDQgMyA4IDUgMTMgNWwzNiAwYzUgMCAxMC0yIDEzLTUgNC00IDYtOCA2LTEzeiBtMzYtNDZsMCAzODRjMCAxMy00IDI0LTEzIDMzLTkgOS0yMCAxMy0zMiAxM2wtNDU4IDBjLTEyIDAtMjMtNC0zMi0xMy05LTktMTMtMjAtMTMtMzNsMC0zODRjMC0xMiA0LTIzIDEzLTMyIDktOSAyMC0xMyAzMi0xM2w0NTggMGMxMiAwIDIzIDQgMzIgMTMgOSA5IDEzIDIwIDEzIDMyelwifX1dfV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcIm9cIjpcImNzc3Jlc2V0XCIsXCJ2XCI6e1widGFwXCI6XCJkaXNtaXNzXCJ9LFwiYVwiOntcImNsYXNzXCI6W1wiYW50ZW5uYSBhbnRlbm5hLXRhcC1oZWxwZXIgXCIse1widFwiOjQsXCJmXCI6W1wiYW50ZW5uYS1oZWxwZXItdG9wXCJdLFwiblwiOjUwLFwiclwiOlwicG9zaXRpb25Ub3BcIn0se1widFwiOjQsXCJuXCI6NTEsXCJmXCI6W1wiYW50ZW5uYS1oZWxwZXItYm90dG9tXCJdLFwiclwiOlwicG9zaXRpb25Ub3BcIn1dfSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS10YXAtaGVscGVyLWlubmVyXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiZlwiOlt7XCJ0XCI6OCxcInJcIjpcImxvZ29cIn0se1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtdGFwLWhlbHBlci1wcm9tcHRcIn0sXCJmXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcInRhcF9oZWxwZXJfX3Byb21wdFxcXCIpXCJ9fV19XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS10YXAtaGVscGVyLWNsb3NlXCJ9LFwiZlwiOlt7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJ0YXBfaGVscGVyX19jbG9zZVxcXCIpXCJ9fV19XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwib1wiOlwiY3NzcmVzZXRcIixcImFcIjp7XCJjbGFzc1wiOltcImFudGVubmEgYW50ZW5uYS10ZXh0LWluZGljYXRvci13aWRnZXQgXCIse1widFwiOjQsXCJmXCI6W1wiYW50ZW5uYS1ub3Rsb2FkZWRcIl0sXCJuXCI6NTEsXCJyXCI6XCJjb250YWluZXJEYXRhLmxvYWRlZFwifSxcIiBhbnRlbm5hLXJlc2V0IFwiLHtcInRcIjo0LFwiZlwiOltcImFudGVubmEtaGFzcmVhY3Rpb25zXCJdLFwiblwiOjUwLFwieFwiOntcInJcIjpbXCJjb250YWluZXJEYXRhLnJlYWN0aW9uVG90YWxcIl0sXCJzXCI6XCJfMD4wXCJ9fSxcIiBcIix7XCJ0XCI6NCxcImZcIjpbXCJhbnRlbm5hLXN1cHByZXNzXCJdLFwiblwiOjUwLFwiclwiOlwiY29udGFpbmVyRGF0YS5zdXBwcmVzc1wifSxcIiBcIix7XCJ0XCI6MixcInJcIjpcImV4dHJhQ2xhc3Nlc1wifV19LFwiZlwiOltcIiBcIix7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS10ZXh0LWluZGljYXRvci1pbm5lclwifSxcImZcIjpbe1widFwiOjgsXCJyXCI6XCJsb2dvXCJ9LHtcInRcIjo0LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1yZWFjdGlvbi10b3RhbFwifSxcIm9cIjpcImNzc3Jlc2V0XCIsXCJmXCI6W3tcInRcIjoyLFwiclwiOlwiY29udGFpbmVyRGF0YS5yZWFjdGlvblRvdGFsXCJ9XX1dLFwiblwiOjUwLFwiclwiOlwiY29udGFpbmVyRGF0YS5yZWFjdGlvblRvdGFsXCJ9XX1dfV19Il19
