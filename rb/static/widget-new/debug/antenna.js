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
},{"./css-loader":13,"./group-settings-loader":17,"./page-data-loader":23,"./page-scanner":25,"./reinitializer":31,"./script-loader":32,"./tap-helper":35,"./utils/browser-metrics":40,"./utils/xdm-loader":71,"./xdm-analytics":72}],2:[function(require,module,exports){
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
},{"../templates/auto-call-to-action.hbs.html":73,"./svgs":34,"./utils/browser-metrics":40,"./utils/jquery-provider":43,"./utils/ractive-provider":55}],3:[function(require,module,exports){
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
},{"../templates/blocked-reaction-page.hbs.html":74,"./svgs":34,"./utils/ractive-provider":55}],4:[function(require,module,exports){
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
},{"../templates/call-to-action-counter.hbs.html":75,"./utils/ractive-provider":55}],5:[function(require,module,exports){
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
},{"../templates/call-to-action-expanded-reactions.hbs.html":76,"./utils/ractive-provider":55}],6:[function(require,module,exports){
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
},{"./call-to-action-counter":4,"./call-to-action-expanded-reactions":5,"./call-to-action-label":7,"./reactions-widget":29,"./utils/touch-support":62}],7:[function(require,module,exports){
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
},{"../templates/call-to-action-label.hbs.html":77,"./utils/ractive-provider":55}],8:[function(require,module,exports){
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
},{"./events":15,"./utils/ajax-client":38,"./utils/jquery-provider":43,"./utils/user":67}],9:[function(require,module,exports){
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
},{"../templates/comment-area-partial.hbs.html":78,"../templates/comments-page.hbs.html":79,"./comment-area-partial":8,"./svgs":34,"./utils/jquery-provider":43,"./utils/ractive-provider":55}],10:[function(require,module,exports){
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
},{"../templates/comment-area-partial.hbs.html":78,"../templates/confirmation-page.hbs.html":80,"./comment-area-partial":8,"./events":15,"./svgs":34,"./utils/ajax-client":38,"./utils/jquery-provider":43,"./utils/ractive-provider":55,"./utils/urls":66}],11:[function(require,module,exports){
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
},{"./utils/ajax-client":38,"./utils/urls":66}],12:[function(require,module,exports){
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
},{"../templates/content-rec-widget.hbs.html":81,"./content-rec-loader":11,"./events":15,"./svgs":34,"./utils/browser-metrics":40,"./utils/json-utils":44,"./utils/messages":50,"./utils/ractive-provider":55,"./utils/throttled-events":61,"./utils/urls":66}],13:[function(require,module,exports){
var AppMode = require('./utils/app-mode');
var URLs = require('./utils/urls');

function loadCss() {
    // To make sure none of our content renders on the page before our CSS is loaded, we append a simple inline style
    // element that turns off our elements *before* our CSS links. This exploits the cascade rules - our CSS files appear
    // after the inline style in the document, so they take precedence (and make everything appear) once they're loaded.
    injectCss('.antenna{display:none;}');
    var cssHref = URLs.amazonS3Url() + '/widget-new/antenna.css?v=2';
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
},{"./utils/app-mode":39,"./utils/urls":66}],14:[function(require,module,exports){
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
        var input = ractive.find('.antenna-defaults-footer input');
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
},{"../templates/defaults-page.hbs.html":82,"./events":15,"./page-data":24,"./utils/ajax-client":38,"./utils/jquery-provider":43,"./utils/ractive-provider":55,"./utils/reactions-widget-layout-utils":58}],15:[function(require,module,exports){
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

function postReactionWidgetOpened(isShowReactions, pageData, containerData, contentData, groupSettings) {
    var eventValue = isShowReactions ? eventValues.showReactions : eventValues.showDefaults;
    var event = createEvent(eventTypes.reactionWidgetOpened, eventValue, groupSettings);
    appendPageDataParams(event, pageData);
    event[attributes.containerHash] = containerData.hash;
    event[attributes.containerKind] = contentData.type;
    postEvent(event);

    var customEvent = createCustomEvent(emitEventTypes.reactionView);
    emitEvent(customEvent);
}

function postSummaryOpened(isShowReactions, pageData, groupSettings) {
    var eventValue = isShowReactions ? eventValues.viewReactions : eventValues.viewDefaults;
    var event = createEvent(eventTypes.summaryWidget, eventValue, groupSettings);
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
        content: reactionData.content.body,
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
    showDefaults: 'wr',
    showReactions: 'rd',
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
},{"./utils/ajax-client":38,"./utils/browser-metrics":40,"./utils/logging":46,"./utils/segment":59,"./utils/session-data":60,"./utils/user":67}],16:[function(require,module,exports){
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
},{"../templates/generic-error-page.hbs.html":83,"./svgs":34,"./utils/ractive-provider":55}],17:[function(require,module,exports){
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
},{"./group-settings":18,"./utils/ajax-client":38,"./utils/jquery-provider":43,"./utils/urls":66}],18:[function(require,module,exports){
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
},{"./events":15,"./utils/jquery-provider":43}],19:[function(require,module,exports){
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
},{"../templates/locations-page.hbs.html":84,"./events":15,"./hashed-elements":19,"./page-data":24,"./svgs":34,"./utils/jquery-provider":43,"./utils/ractive-provider":55,"./utils/range":56}],21:[function(require,module,exports){
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
},{"../templates/login-page.hbs.html":85,"./events":15,"./svgs":34,"./utils/ractive-provider":55,"./utils/urls":66,"./utils/user":67}],22:[function(require,module,exports){
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
},{"../templates/media-indicator-widget.hbs.html":86,"./reactions-widget":29,"./svgs":34,"./utils/app-mode":39,"./utils/browser-metrics":40,"./utils/jquery-provider":43,"./utils/mutation-observer":52,"./utils/ractive-provider":55,"./utils/throttled-events":61,"./utils/touch-support":62,"./utils/visibility":68}],23:[function(require,module,exports){
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
},{"./page-data":24,"./utils/ajax-client":38,"./utils/jquery-provider":43,"./utils/page-utils":53,"./utils/throttled-events":61,"./utils/urls":66}],24:[function(require,module,exports){
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
},{"./auto-call-to-action":2,"./call-to-action-indicator":6,"./content-rec-widget":12,"./hashed-elements":19,"./media-indicator-widget":22,"./page-data":24,"./page-data-loader":23,"./readmore-events":30,"./summary-widget":33,"./text-indicator-widget":36,"./text-reactions":37,"./utils/app-mode":39,"./utils/browser-metrics":40,"./utils/hash":42,"./utils/jquery-provider":43,"./utils/mutation-observer":52,"./utils/page-utils":53,"./utils/segment":59,"./utils/urls":66,"./utils/widget-bucket":69}],26:[function(require,module,exports){
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
},{"../templates/pending-reaction-page.hbs.html":87,"./svgs":34,"./utils/ractive-provider":55}],27:[function(require,module,exports){
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
},{"../templates/popup-widget.hbs.html":88,"./svgs":34,"./utils/jquery-provider":43,"./utils/ractive-provider":55,"./utils/transition-util":63,"./utils/widget-bucket":69}],28:[function(require,module,exports){
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
        AjaxClient.postPlusOne(reactionData, containerData, pageData, groupSettings, success, error);

        function success(reactionData) {
            Events.postReactionCreated(pageData, containerData, reactionData, groupSettings);
        }

        function error(message) {
            var retry = function() {
                AjaxClient.postPlusOne(reactionData, containerData, pageData, groupSettings, success, error);
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
},{"../templates/reactions-page.hbs.html":89,"./events":15,"./svgs":34,"./utils/ajax-client":38,"./utils/jquery-provider":43,"./utils/ractive-provider":55,"./utils/range":56,"./utils/reactions-widget-layout-utils":58}],29:[function(require,module,exports){
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
},{"../templates/reactions-widget.hbs.html":90,"./blocked-reaction-page":3,"./comments-page":9,"./confirmation-page":10,"./defaults-page":14,"./events":15,"./generic-error-page":16,"./locations-page":20,"./login-page":21,"./page-data":24,"./pending-reaction-page":26,"./reactions-page":28,"./svgs":34,"./utils/ajax-client":38,"./utils/browser-metrics":40,"./utils/jquery-provider":43,"./utils/json-utils":44,"./utils/messages":50,"./utils/moveable":51,"./utils/ractive-provider":55,"./utils/range":56,"./utils/touch-support":62,"./utils/transition-util":63,"./utils/user":67,"./utils/widget-bucket":69}],30:[function(require,module,exports){
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
},{"./events":15,"./utils/throttled-events":61}],31:[function(require,module,exports){
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
},{"./group-settings":18,"./hashed-elements":19,"./page-data":24,"./page-data-loader":23,"./page-scanner":25,"./popup-widget":27,"./reactions-widget":29,"./utils/mutation-observer":52}],32:[function(require,module,exports){
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
},{"./utils/app-mode":39,"./utils/jquery-provider":43,"./utils/ractive-provider":55,"./utils/rangy-provider":57,"./utils/urls":66}],33:[function(require,module,exports){
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
},{"../templates/summary-widget.hbs.html":91,"./reactions-widget":29,"./svgs":34,"./utils/browser-metrics":40,"./utils/jquery-provider":43,"./utils/ractive-provider":55,"./utils/touch-support":62}],34:[function(require,module,exports){
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
},{"../templates/svg-comments.hbs.html":92,"../templates/svg-facebook.hbs.html":93,"../templates/svg-film.hbs.html":94,"../templates/svg-left.hbs.html":95,"../templates/svg-location.hbs.html":96,"../templates/svg-logo-selectable.hbs.html":97,"../templates/svg-logo.hbs.html":98,"../templates/svg-twitter.hbs.html":99,"../templates/svgs.hbs.html":100,"./utils/ractive-provider":55}],35:[function(require,module,exports){
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
},{"../templates/tap-helper.hbs.html":101,"./svgs":34,"./utils/browser-metrics":40,"./utils/ractive-provider":55,"./utils/widget-bucket":69}],36:[function(require,module,exports){
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
},{"../templates/text-indicator-widget.hbs.html":102,"./popup-widget":27,"./reactions-widget":29,"./svgs":34,"./utils/jquery-provider":43,"./utils/ractive-provider":55,"./utils/touch-support":62}],37:[function(require,module,exports){
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
},{"./popup-widget":27,"./reactions-widget":29,"./utils/jquery-provider":43,"./utils/range":56,"./utils/touch-support":62}],38:[function(require,module,exports){
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
},{"./app-mode":39,"./json-utils":44,"./jsonp-client":45,"./logging":46,"./urls":66,"./user":67}],39:[function(require,module,exports){
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
},{"./url-constants":64,"./url-params":65}],40:[function(require,module,exports){

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
},{"./jquery-provider":43,"./md5":47}],43:[function(require,module,exports){

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
},{"./json-utils":44}],46:[function(require,module,exports){
var AppMode = require('./app-mode');

function logDebugMessage(message) {
    if (AppMode.debug) {
        console.debug('AntennaDebug: ' + message);
    }
}

module.exports = {
    debugMessage: logDebugMessage
};
},{"./app-mode":39}],47:[function(require,module,exports){
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
},{}],48:[function(require,module,exports){
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

    'content_rec_widget__title': 'Reader Reactions',

    'login_page__message_1': '<span class="antenna-login-group">{0}</span> uses <a href="http://www.antenna.is/" target="_blank">Antenna</a> so you can react to content easily and safely.',
    'login_page__message_2': 'To keep participating, just log in:',
    'login_page__privacy': 'Antenna values your privacy. <a href="http://www.antenna.is/faq/" target="_blank">Learn more</a>.',
    'login_page__pending_pre': 'You might need to ',
    'login_page__pending_click': 'click here',
    'login_page__pending_post': ' once you\'ve logged in.'
};
},{}],49:[function(require,module,exports){
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
},{}],50:[function(require,module,exports){
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
},{"../group-settings":18,"./app-mode":39,"./messages-en":48,"./messages-es":49}],51:[function(require,module,exports){
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
},{"./jquery-provider":43}],52:[function(require,module,exports){
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
},{"./callback-support":41,"./jquery-provider":43,"./range":56,"./widget-bucket":69}],53:[function(require,module,exports){
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
},{"./jquery-provider":43}],54:[function(require,module,exports){
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
},{}],55:[function(require,module,exports){
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
},{"./messages":50,"./ractive-events-tap":54}],56:[function(require,module,exports){
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
},{"./jquery-provider":43,"./rangy-provider":57}],57:[function(require,module,exports){

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
},{}],58:[function(require,module,exports){
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
},{"./jquery-provider":43}],59:[function(require,module,exports){
var UrlParams = require('./url-params');

var segments = [ '250', '400', '700' ];
var segment;

function getSegment(groupSettings) {
    if (!segment) {
        segment = computeSegment(groupSettings);
    }
    return segment;
}

function computeSegment(groupSettings) {
    var segmentOverride = UrlParams.getUrlParam('antennaSegment');
    if (segmentOverride) {
        storeSegment(segmentOverride);
        return segmentOverride;
    }
    var segment = readSegment();
    if (!segment && (groupSettings.groupId() === 3714 || groupSettings.groupId() === 2)) {
        segment = createSegment(groupSettings);
        segment = storeSegment(segment);
    }
    return segment;
}

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


module.exports = {
    getSegment: getSegment
};
},{"./url-params":65}],60:[function(require,module,exports){
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
},{"./json-utils":44}],61:[function(require,module,exports){
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
},{"./callback-support":41}],62:[function(require,module,exports){

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
},{}],63:[function(require,module,exports){


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
},{}],64:[function(require,module,exports){
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
},{}],65:[function(require,module,exports){

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
},{}],66:[function(require,module,exports){
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
    return '/api/contentrec';
}

function getShareReactionUrl() {
    return '/api/share/;'
}

function getCreateTempUserUrl() {
    return '/api/tempuser';
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

},{"./app-mode":39,"./json-utils":44,"./url-constants":64}],67:[function(require,module,exports){
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
},{"./app-mode":39,"./jsonp-client":45,"./urls":66,"./xdm-client":70}],68:[function(require,module,exports){
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
},{}],69:[function(require,module,exports){
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
},{}],70:[function(require,module,exports){
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
},{"./xdm-loader":71}],71:[function(require,module,exports){
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
},{"./app-mode":39,"./url-constants":64,"./widget-bucket":69}],72:[function(require,module,exports){
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
},{"./events":15,"./group-settings":18,"./page-data":24,"./utils/xdm-client":70}],73:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna antenna-auto-cta"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-auto-cta-inner","ant-cta-for":[{"t":2,"r":"antItemId"}]},"f":[{"t":8,"r":"logo"},{"t":7,"e":"span","a":{"class":"antenna-auto-cta-label","ant-reactions-label-for":[{"t":2,"r":"antItemId"}]}},{"t":4,"f":[{"t":7,"e":"span","a":{"ant-expanded-reactions-for":[{"t":2,"r":"antItemId"}]}}],"n":50,"r":"expandReactions"}]}]}]}
},{}],74:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna-page antenna-blocked-page"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-body"},"f":[{"t":7,"e":"div","v":{"tap":"back"},"a":{"class":"antenna-blocked-back"},"f":[{"t":8,"r":"left"},{"t":2,"x":{"r":["getMessage"],"s":"_0(\"reactions_widget__back\")"}}]}," ",{"t":7,"e":"div","a":{"class":"antenna-blocked-body"},"f":[{"t":7,"e":"div","a":{"class":"antenna-blocked-message"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"blocked_page__message1\")"}}]}," ",{"t":7,"e":"div","a":{"class":"antenna-blocked-message"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"blocked_page__message2\")"}}]}]}]}]}]}
},{}],75:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":4,"f":[{"t":2,"r":"containerData.reactionTotal"}],"n":50,"x":{"r":["containerData.reactionTotal","containerData.loaded"],"s":"_0&&_1"}}]}
},{}],76:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":4,"f":[{"t":7,"e":"span","a":{"class":["antenna-cta-expanded-reaction ",{"t":4,"f":["antenna-cta-expanded-first"],"n":50,"x":{"r":["@index"],"s":"_0===0"}}]},"f":[{"t":7,"e":"span","a":{"class":"antenna-cta-expanded-text"},"f":[{"t":2,"r":"./text"}]},{"t":7,"e":"span","a":{"class":"antenna-cta-expanded-count"},"f":[{"t":2,"r":"./count"}]}]}],"x":{"r":["computeExpandedReactions","containerData.reactions"],"s":"_0(_1)"}}]}
},{}],77:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":4,"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"call_to_action_label__responses\")"}}],"n":50,"x":{"r":["containerData.loaded","containerData.reactionTotal"],"s":"!_0||_1===undefined||_1===0"}},{"t":4,"n":51,"f":[{"t":4,"n":50,"x":{"r":["containerData.reactionTotal"],"s":"_0===1"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"call_to_action_label__responses_one\")"}}]},{"t":4,"n":50,"x":{"r":["containerData.reactionTotal"],"s":"!(_0===1)"},"f":[" ",{"t":2,"x":{"r":["getMessage","containerData.reactionTotal"],"s":"_0(\"call_to_action_label__responses_many\",[_1])"}}]}],"x":{"r":["containerData.loaded","containerData.reactionTotal"],"s":"!_0||_1===undefined||_1===0"}}]}
},{}],78:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna-comment-area"},"f":[{"t":7,"e":"div","a":{"class":"antenna-comment-widgets"},"f":[{"t":7,"e":"textarea","v":{"input":"inputchanged"},"a":{"class":"antenna-comment-input","placeholder":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"comment_area__placeholder\")"}}],"maxlength":"500"}}," ",{"t":7,"e":"div","a":{"class":"antenna-comment-footer"},"f":[{"t":7,"e":"span","a":{"class":"antenna-comment-limit"},"f":[{"t":3,"x":{"r":["getMessage"],"s":"_0(\"comment_area__count\")"}}]}," ",{"t":7,"e":"button","a":{"id":"antenna-comment-spacer"}}," ",{"t":7,"e":"button","a":{"class":"antenna-comment-submit"},"v":{"tap":"addcomment"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"comment_area__add\")"}}]}]}]}," ",{"t":7,"e":"div","a":{"class":"antenna-comment-waiting"},"f":["..."]}," ",{"t":7,"e":"div","a":{"class":"antenna-comment-received"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"comment_area__thanks\")"}}]}]}]}
},{}],79:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna-page antenna-comments-page"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-body"},"f":[{"t":7,"e":"div","v":{"tap":"back"},"a":{"class":"antenna-comments-back"},"f":[{"t":8,"r":"left"},{"t":2,"x":{"r":["getMessage"],"s":"_0(\"reactions_widget__back\")"}}]}," ",{"t":7,"e":"div","a":{"class":"antenna-comments-header"},"f":[{"t":2,"x":{"r":["getMessage","comments.length"],"s":"_0(\"comments_page__header\",[_1])"}}]}," ",{"t":4,"f":[{"t":7,"e":"div","a":{"class":["antenna-comment-entry ",{"t":4,"f":["antenna-comment-new"],"n":50,"r":"./new"}]},"f":[{"t":7,"e":"table","f":[{"t":7,"e":"tr","f":[{"t":7,"e":"td","a":{"class":"antenna-comment-cell"},"f":[{"t":7,"e":"img","a":{"src":[{"t":2,"r":"./user.imageURL"}]}}]}," ",{"t":7,"e":"td","a":{"class":"antenna-comment-author"},"f":[{"t":2,"r":"./user.name"}]}]}," ",{"t":7,"e":"tr","f":[{"t":7,"e":"td","f":[]}," ",{"t":7,"e":"td","a":{"class":"antenna-comment-text"},"f":[{"t":2,"r":"./text"}]}]}]}]}],"i":"index","r":"comments"}," ",{"t":8,"r":"commentArea"}]}]}]}
},{}],80:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna-page antenna-confirmation-page"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-body"},"f":[{"t":7,"e":"div","a":{"class":"antenna-confirm-reaction"},"f":[{"t":2,"r":"text"}]}," ",{"t":8,"r":"commentArea"}]}," ",{"t":7,"e":"div","a":{"class":"antenna-footer antenna-confirm-footer"},"f":[{"t":7,"e":"span","a":{"class":"antenna-share"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"confirmation_page__share\")"}}," ",{"t":7,"e":"a","v":{"tap":"share-facebook"},"a":{"href":"//facebook.com"},"f":[{"t":8,"r":"facebookIcon"}]}," ",{"t":7,"e":"a","v":{"tap":"share-twitter"},"a":{"href":"//twitter.com"},"f":[{"t":8,"r":"twitterIcon"}]}]}]}]}]}
},{}],81:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":4,"f":[{"t":7,"e":"div","a":{"class":"antenna antenna-contentrec-inner"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-contentrec-header"},"f":[{"t":2,"r":"title"}]}," ",{"t":7,"e":"div","a":{"class":"antenna-contentrec-entries"},"f":[{"t":4,"f":[{"t":7,"e":"div","a":{"class":["antenna-contentrec-entry antenna-reset ",{"t":4,"f":["antenna-desktop"],"n":51,"r":"isMobile"}],"style":["width:",{"t":2,"r":"entryWidth"},";"]},"f":[{"t":7,"e":"a","a":{"href":[{"t":2,"x":{"r":["computeEntryUrl","."],"s":"_0(_1)"}}],"target":[{"t":4,"f":["_self"],"n":50,"r":"isMobile"},{"t":4,"n":51,"f":["_target"],"r":"isMobile"}]},"f":[{"t":7,"e":"div","a":{"class":"antenna-contentrec-entry-inner"},"f":[{"t":7,"e":"div","a":{"class":"antenna-contentrec-entry-header"},"f":[{"t":7,"e":"div","a":{"class":"antenna-contentrec-reaction-text"},"f":[{"t":2,"r":"./top_reaction.text"}]}," ",{"t":7,"e":"div","a":{"class":"antenna-contentrec-indicator-wrapper"},"f":[{"t":7,"e":"div","a":{"class":"antenna-contentrec-reaction-indicator"},"f":[{"t":8,"r":"logo"},{"t":7,"e":"span","a":{"class":"antenna-contentrec-reaction-count"},"f":[" ",{"t":2,"r":"./reaction_count"}]}]}]}]}," ",{"t":7,"e":"div","a":{"class":"antenna-contentrec-body","style":["background:",{"t":2,"rx":{"r":"colors","m":[{"t":30,"n":"index"},"background"]}},";color:",{"t":2,"rx":{"r":"colors","m":[{"t":30,"n":"index"},"foreground"]}},";"]},"f":[{"t":4,"f":[{"t":7,"e":"div","a":{"class":"antenna-contentrec-body-image"},"f":[{"t":7,"e":"img","a":{"src":[{"t":2,"r":"./content.body"}]}}]}],"n":50,"x":{"r":["./content.type"],"s":"_0===\"image\""}},{"t":4,"n":51,"f":[{"t":4,"n":50,"x":{"r":["./content.type"],"s":"_0===\"text\""},"f":[{"t":7,"e":"div","a":{"class":"antenna-contentrec-body-text"},"o":"renderText","f":[{"t":2,"r":"./content.body"}]}]}],"x":{"r":["./content.type"],"s":"_0===\"image\""}}]}," ",{"t":7,"e":"div","a":{"class":"antenna-contentrec-page-title"},"f":[{"t":2,"r":"./page.title"}]}]}]}]}],"i":"index","r":"contentData.entries"}]}]}],"n":50,"x":{"r":["populateContentEntries","pageData.summaryLoaded","contentData.entries"],"s":"_0(_1)&&_2"}}]}
},{}],82:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","v":{"keydown":"pagekeydown"},"a":{"class":"antenna-page antenna-defaults-page","tabindex":"0"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-body"},"f":[{"t":4,"f":[{"t":7,"e":"div","v":{"tap":"newreaction"},"a":{"class":["antenna-reaction ",{"t":2,"x":{"r":["defaultLayoutClass","index"],"s":"_0(_1)"}}]},"f":[{"t":7,"e":"div","a":{"class":"antenna-reaction-box"},"f":[{"t":7,"e":"div","a":{"class":"antenna-reaction-text"},"o":"sizetofit","f":[{"t":2,"r":"./text"}]}]}]}],"i":"index","r":"defaultReactions"}]}," ",{"t":7,"e":"div","a":{"class":"antenna-footer antenna-defaults-footer"},"f":[{"t":7,"e":"div","a":{"class":"antenna-custom-area"},"f":[{"t":7,"e":"input","v":{"focus":"customfocus","keydown":"inputkeydown","blur":"customblur"},"a":{"value":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"defaults_page__add\")"}}],"maxlength":"25"}}," ",{"t":7,"e":"button","v":{"tap":"newcustom"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"defaults_page__ok\")"}}]}]}," ",{"t":7,"e":"div","a":{"class":"antenna-text-logo"},"f":[{"t":7,"e":"a","a":{"href":"//www.antenna.is"},"f":["Antenna"]}]}]}]}]}
},{}],83:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna-page antenna-error-page"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-body"},"f":[{"t":7,"e":"div","v":{"tap":"back"},"a":{"class":"antenna-error-back"},"f":[{"t":8,"r":"left"},{"t":2,"x":{"r":["getMessage"],"s":"_0(\"reactions_widget__back\")"}}]}," ",{"t":7,"e":"div","a":{"class":"antenna-error-body"},"f":[{"t":7,"e":"div","a":{"class":"antenna-error-message"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"error_page__message\")"}}]}]}]}]}]}
},{}],84:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna-page antenna-locations-page"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-body"},"f":[{"t":7,"e":"div","v":{"tap":"back"},"a":{"class":"antenna-locations-back"},"f":[{"t":8,"r":"left"},{"t":2,"x":{"r":["getMessage"],"s":"_0(\"reactions_widget__back\")"}}]}," ",{"t":7,"e":"table","a":{"class":"antenna-locations-table"},"f":[{"t":4,"f":[{"t":7,"e":"tr","a":{"class":"antenna-locations-content-row"},"f":[{"t":7,"e":"td","a":{"class":"antenna-locations-count-cell"},"f":[{"t":4,"f":[{"t":3,"x":{"r":["getMessage"],"s":"_0(\"locations_page__count_one\")"}}],"n":50,"x":{"r":["pageReactionCount"],"s":"_0===1"}},{"t":4,"n":51,"f":[{"t":3,"x":{"r":["getMessage","pageReactionCount"],"s":"_0(\"locations_page__count_many\",[_1])"}}],"x":{"r":["pageReactionCount"],"s":"_0===1"}}]}," ",{"t":7,"e":"td","a":{"class":"antenna-locations-page-body"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"locations_page__pagelevel\")"}}]}]}],"n":50,"r":"pageReactionCount"}," ",{"t":4,"f":[{"t":4,"f":[" ",{"t":7,"e":"tr","v":{"tap":"reveal"},"a":{"class":["antenna-locations-content-row ",{"t":4,"f":["antenna-locate"],"n":50,"x":{"r":["canLocate","./containerHash"],"s":"_0(_1)"}}]},"f":[{"t":7,"e":"td","a":{"class":"antenna-locations-count-cell"},"f":[{"t":4,"f":[{"t":3,"x":{"r":["getMessage"],"s":"_0(\"locations_page__count_one\")"}}],"n":50,"x":{"r":["./count"],"s":"_0===1"}},{"t":4,"n":51,"f":[{"t":3,"x":{"r":["getMessage","./count"],"s":"_0(\"locations_page__count_many\",[_1])"}}],"x":{"r":["./count"],"s":"_0===1"}}]}," ",{"t":4,"f":[{"t":7,"e":"td","a":{"class":"antenna-locations-text-body"},"f":[{"t":2,"r":"./body"}]}],"n":50,"x":{"r":["./kind"],"s":"_0===\"txt\""}},{"t":4,"n":51,"f":[{"t":4,"n":50,"x":{"r":["./kind"],"s":"_0===\"img\""},"f":[{"t":7,"e":"td","a":{"class":"antenna-locations-image-body"},"f":[{"t":7,"e":"img","a":{"src":[{"t":2,"r":"./body"}]}}]}]},{"t":4,"n":50,"x":{"r":["./kind"],"s":"(!(_0===\"img\"))&&(_0===\"med\")"},"f":[" ",{"t":7,"e":"td","a":{"class":"antenna-locations-media-body"},"f":[{"t":8,"r":"film"},{"t":7,"e":"span","a":{"class":"antenna-locations-video"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"locations_page__video\")"}}]}]}]},{"t":4,"n":50,"x":{"r":["./kind"],"s":"(!(_0===\"img\"))&&(!(_0===\"med\"))"},"f":[" ",{"t":7,"e":"td","f":[" "]}]}],"x":{"r":["./kind"],"s":"_0===\"txt\""}}]}],"n":50,"x":{"r":["./kind"],"s":"_0!==\"pag\""}}],"i":"id","r":"locationData"}]}]}]}]}
},{}],85:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna-page antenna-login-page"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-body"},"f":[{"t":7,"e":"div","v":{"tap":"back"},"a":{"class":"antenna-login-back"},"f":[{"t":8,"r":"left"},{"t":2,"x":{"r":["getMessage"],"s":"_0(\"reactions_widget__back\")"}}]}," ",{"t":7,"e":"div","a":{"class":"antenna-login-container"},"f":[{"t":7,"e":"div","a":{"class":"antenna-login-content"},"f":[{"t":7,"e":"div","a":{"class":"antenna-login-message"},"f":[{"t":3,"x":{"r":["getMessage","groupName"],"s":"_0(\"login_page__message_1\",[_1])"}}]}," ",{"t":7,"e":"div","a":{"class":"antenna-login-message"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"login_page__message_2\")"}}]}," ",{"t":7,"e":"div","a":{"class":"antenna-login-buttons"},"f":[{"t":7,"e":"div","a":{"class":"fb-login-button"},"v":{"tap":"facebookLogin"},"f":[{"t":7,"e":"img","a":{"src":"/static/widget/images/fb-login_to_readrboard.png"}}]}," ",{"t":7,"e":"div","a":{"class":"antenna-or"},"f":["or"]}," ",{"t":7,"e":"div","a":{"class":"antenna-login-button"},"v":{"tap":"antennaLogin"},"f":[{"t":8,"r":"logo"},{"t":7,"e":"span","a":{"class":"antenna-login-text"},"f":["Login to Antenna"]}]}]}," ",{"t":7,"e":"div","a":{"class":"antenna-privacy-text"},"f":[{"t":3,"x":{"r":["getMessage"],"s":"_0(\"login_page__privacy\")"}}]}]}," ",{"t":7,"e":"div","a":{"class":"antenna-login-pending"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"login_page__pending_pre\")"}},{"t":7,"e":"a","a":{"href":"javascript:void(0);"},"v":{"tap":"retry"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"login_page__pending_click\")"}}]},{"t":2,"x":{"r":["getMessage"],"s":"_0(\"login_page__pending_post\")"}}]}]}]}]}]}
},{}],86:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"span","o":"cssreset","a":{"class":"antenna antenna-media-indicator-wrapper"},"f":[{"t":7,"e":"span","m":[{"t":2,"r":"extraAttributes"}],"a":{"class":["antenna antenna-media-indicator-widget ",{"t":4,"f":["antenna-notloaded"],"n":51,"r":"containerData.loaded"}," antenna-reset ",{"t":4,"f":["antenna-touch"],"n":50,"r":"supportsTouch"}]},"f":[" ",{"t":8,"r":"logo"}," ",{"t":4,"f":[{"t":7,"e":"span","a":{"class":"antenna-reaction-total"},"o":"cssreset","f":[{"t":2,"r":"containerData.reactionTotal"}]}],"n":50,"r":"containerData.reactionTotal"},{"t":4,"n":51,"f":[{"t":7,"e":"span","a":{"class":"antenna-reaction-prompt"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"media_indicator__think\")"}}]}],"r":"containerData.reactionTotal"}]}]}]}
},{}],87:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna-page antenna-pending-page"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-body"},"f":[{"t":7,"e":"div","a":{"class":"antenna-pending-reaction"},"f":[{"t":2,"r":"text"}]}," ",{"t":7,"e":"div","a":{"class":"antenna-pending-message"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"pending_page__message_appear\")"}}]}]}]}]}
},{}],88:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna-popup"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-popup-body"},"f":[{"t":8,"r":"logo"},{"t":7,"e":"span","a":{"class":"antenna-popup-text"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"popup_widget__think\")"}}]}]}]}]}
},{}],89:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna-page antenna-reactions-page"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-body"},"f":[{"t":4,"f":[{"t":4,"f":[{"t":7,"e":"div","v":{"tap":"plusone","mouseenter":"highlight","mouseleave":"clearhighlights"},"a":{"class":["antenna-reaction ",{"t":2,"x":{"r":["reactionsLayoutClass","index"],"s":"_0(_1)"}}]},"f":[{"t":7,"e":"div","a":{"class":"antenna-reaction-box"},"f":[{"t":7,"e":"div","a":{"class":"antenna-reaction-text"},"o":"sizetofit","f":[{"t":2,"r":"./text"}]}," ",{"t":7,"e":"div","a":{"class":"antenna-reaction-count"},"f":[{"t":2,"r":"./count"}]}," ",{"t":7,"e":"div","a":{"class":"antenna-plusone"},"f":["+1"]}," ",{"t":4,"f":[{"t":7,"e":"div","v":{"tap":"showlocations"},"a":{"class":"antenna-reaction-location"},"f":[{"t":8,"r":"locationIcon"}]}],"n":50,"r":"isSummary"},{"t":4,"n":51,"f":[{"t":4,"f":[{"t":7,"e":"div","v":{"tap":"showcomments"},"a":{"class":"antenna-reaction-comments hascomments"},"f":[{"t":8,"r":"commentsIcon"}," ",{"t":2,"r":"./commentCount"}]}],"n":50,"r":"./commentCount"},{"t":4,"n":51,"f":[{"t":4,"f":[{"t":7,"e":"div","a":{"class":"antenna-reaction-comments"},"f":[{"t":8,"r":"commentsIcon"}]}],"n":50,"x":{"r":["hideCommentInput"],"s":"!_0"}}],"r":"./commentCount"}],"r":"isSummary"}]}]}],"i":"index","r":"reactions"}],"n":50,"r":"reactions"}]}," ",{"t":7,"e":"div","a":{"class":"antenna-footer antenna-reactions-footer"},"f":[{"t":4,"f":[{"t":7,"e":"div","v":{"tap":"showdefault"},"a":{"class":"antenna-think"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"reactions_page__think\")"}}]}],"n":50,"r":"reactions"},{"t":4,"n":51,"f":[{"t":7,"e":"div","a":{"class":"antenna-no-reactions"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"reactions_page__no_reactions\")"}}]}],"r":"reactions"}," ",{"t":7,"e":"div","a":{"class":"antenna-text-logo"},"f":[{"t":7,"e":"a","a":{"href":"//www.antenna.is","target":"_blank"},"f":["Antenna"]}]}]}]}]}
},{}],90:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":["antenna antenna-reactions-widget ",{"t":4,"f":["antenna-touch"],"n":50,"r":"supportsTouch"}],"tabindex":"0"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-header"},"f":[{"t":8,"r":"logo"},{"t":7,"e":"span","a":{"class":"antenna-reactions-title"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"reactions_widget__title\")"}}]}," ",{"t":7,"e":"span","v":{"tap":"close"},"a":{"class":"antenna-reactions-close"},"f":["X"]}]}," ",{"t":7,"e":"div","a":{"class":"antenna-page-container"},"f":[" ",{"t":7,"e":"div","a":{"class":"antenna-progress-page antenna-page"},"f":[{"t":7,"e":"div","a":{"class":"antenna-body"},"f":[]}," ",{"t":7,"e":"div","a":{"class":"antenna-progress-spinner"},"f":[{"t":8,"r":"logo"}]}]}]}]}]}
},{}],91:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","o":"cssreset","a":{"class":["antenna antenna-summary-widget no-ant ",{"t":4,"f":["antenna-notloaded"],"n":51,"r":"pageData.summaryLoaded"}," antenna-reset ",{"t":4,"f":["antenna-expanded-summary"],"n":50,"r":"isExpandedSummary"}]},"f":[" ",{"t":7,"e":"div","a":{"class":"antenna-summary-inner"},"f":[{"t":8,"r":"logo"},{"t":7,"e":"span","a":{"class":"antenna-summary-title"},"f":[" ",{"t":4,"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"summary_widget__reactions\")"}}],"n":50,"x":{"r":["pageData.summaryTotal"],"s":"_0===0"}},{"t":4,"n":51,"f":[{"t":4,"n":50,"x":{"r":["pageData.summaryTotal"],"s":"_0===1"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"summary_widget__reactions_one\")"}}]},{"t":4,"n":50,"x":{"r":["pageData.summaryTotal"],"s":"!(_0===1)"},"f":[" ",{"t":2,"x":{"r":["getMessage","pageData.summaryTotal"],"s":"_0(\"summary_widget__reactions_many\",[_1])"}}]}],"x":{"r":["pageData.summaryTotal"],"s":"_0===0"}}]},{"t":4,"f":[{"t":4,"f":[{"t":7,"e":"span","o":"cssreset","a":{"class":["antenna-expanded-reaction ",{"t":4,"f":["antenna-expanded-first"],"n":50,"x":{"r":["@index"],"s":"_0===0"}}]},"f":[{"t":7,"e":"span","a":{"class":"antenna-expanded-text"},"f":[{"t":2,"r":"./text"}]},{"t":7,"e":"span","a":{"class":"antenna-expanded-count"},"f":[{"t":2,"r":"./count"}]}]}],"x":{"r":["computeExpandedReactions","pageData.summaryReactions"],"s":"_0(_1)"}}],"n":50,"r":"isExpandedSummary"}]}]}]}
},{}],92:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"span","a":{"class":"antenna-comments"},"f":[{"t":7,"e":"svg","f":[{"t":7,"e":"use","a":{"class":"antenna-comments-path","xlink:href":"#antenna-svg-comment"}}]}]}]}
},{}],93:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"span","a":{"class":"antenna-facebook"},"f":[{"t":7,"e":"svg","f":[{"t":7,"e":"use","a":{"class":"antenna-facebook-path","xlink:href":"#antenna-svg-facebook"}}]}]}]}
},{}],94:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"span","a":{"class":"antenna-film"},"f":[{"t":7,"e":"svg","f":[{"t":7,"e":"use","a":{"class":"antenna-film-path","xlink:href":"#antenna-svg-film"}}]}]}]}
},{}],95:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"span","a":{"class":"antenna-left"},"f":[{"t":7,"e":"svg","f":[{"t":7,"e":"use","a":{"class":"antenna-left-path","xlink:href":"#antenna-svg-left"}}]}]}]}
},{}],96:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"span","a":{"class":"antenna-location"},"f":[{"t":7,"e":"svg","f":[{"t":7,"e":"use","a":{"class":"antenna-location-path","xlink:href":"#antenna-svg-search"}}]}]}]}
},{}],97:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"span","a":{"class":"antenna-logo"},"f":[{"t":7,"e":"svg","a":{"viewBox":"0 0 512 512"},"f":[" ",{"t":7,"e":"path","a":{"class":"antenna-logo-path","d":"m283 510c125-17 229-124 229-253 0-141-115-256-256-256-141 0-256 115-256 256 0 130 108 237 233 254l0-149c-48-14-84-50-84-102 0-65 43-113 108-113 65 0 107 48 107 113 0 52-33 88-81 102z"}}]}]}]}
},{}],98:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"span","a":{"class":"antenna-logo"},"f":[{"t":7,"e":"svg","f":[{"t":7,"e":"use","a":{"class":"antenna-logo-path","xlink:href":"#antenna-svg-logo"}}]}]}]}
},{}],99:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"span","a":{"class":"antenna-twitter"},"f":[{"t":7,"e":"svg","f":[{"t":7,"e":"use","a":{"class":"antenna-twitter-path","xlink:href":"#antenna-svg-twitter"}}]}]}]}
},{}],100:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"svg","a":{"xmlns":"http://www.w3.org/2000/svg","style":"display: none;"},"f":[{"t":7,"e":"symbol","a":{"id":"antenna-svg-twitter","viewBox":"0 0 512 512"},"f":[{"t":7,"e":"path","a":{"d":"m453 134c-14 6-30 11-46 12c16-10 29-25 35-44c-15 9-33 16-51 19c-15-15-36-25-59-25c-45 0-81 36-81 81c0 6 1 12 2 18c-67-3-127-35-167-84c-7 12-11 25-11 40c0 28 15 53 36 68c-13-1-25-4-36-11c0 1 0 1 0 2c0 39 28 71 65 79c-7 2-14 3-22 3c-5 0-10-1-15-2c10 32 40 56 76 56c-28 22-63 35-101 35c-6 0-13 0-19-1c36 23 78 36 124 36c149 0 230-123 230-230c0-3 0-7 0-10c16-12 29-26 40-42z"}}]}," ",{"t":7,"e":"symbol","a":{"id":"antenna-svg-facebook","viewBox":"0 0 512 512"},"f":[{"t":7,"e":"path","a":{"d":"m420 72l-328 0c-11 0-20 9-20 20l0 328c0 11 9 20 20 20l177 0l0-142l-48 0l0-56l48 0l0-41c0-48 29-74 71-74c20 0 38 2 43 3l0 49l-29 0c-23 0-28 11-28 27l0 36l55 0l-7 56l-48 0l0 142l94 0c11 0 20-9 20-20l0-328c0-11-9-20-20-20z"}}]}," ",{"t":7,"e":"symbol","a":{"id":"antenna-svg-comment","viewBox":"0 0 512 512"},"f":[{"t":7,"e":"path","a":{"d":"m512 256c0 33-11 64-34 92c-23 28-54 50-93 66c-40 17-83 25-129 25c-13 0-27-1-41-2c-38 33-82 56-132 69c-9 2-20 4-32 6c-4 0-7 0-9-3c-3-2-4-4-5-8l0 0c-1-1-1-2 0-4c0-1 0-2 0-2c0-1 1-2 2-3l1-3c0 0 1-1 2-2c2-2 2-3 3-3c1-1 4-5 8-10c5-5 8-8 10-10c2-3 5-6 9-12c4-5 7-10 9-14c3-5 5-10 8-17c3-7 5-14 8-22c-30-17-54-38-71-63c-17-25-26-51-26-80c0-25 7-48 20-71c14-23 32-42 55-58c23-17 50-30 82-39c31-10 64-15 99-15c46 0 89 8 129 25c39 16 70 38 93 66c23 28 34 59 34 92z"}}]}," ",{"t":7,"e":"symbol","a":{"id":"antenna-svg-search","viewBox":"0 0 512 512"},"f":[{"t":7,"e":"path","a":{"d":"m347 238c0-36-12-66-37-91c-25-25-55-37-91-37c-35 0-65 12-90 37c-25 25-38 55-38 91c0 35 13 65 38 90c25 25 55 38 90 38c36 0 66-13 91-38c25-25 37-55 37-90z m147 237c0 10-4 19-11 26c-7 7-16 11-26 11c-10 0-19-4-26-11l-98-98c-34 24-72 36-114 36c-27 0-53-5-78-16c-25-11-46-25-64-43c-18-18-32-39-43-64c-10-25-16-51-16-78c0-28 6-54 16-78c11-25 25-47 43-65c18-18 39-32 64-43c25-10 51-15 78-15c28 0 54 5 79 15c24 11 46 25 64 43c18 18 32 40 43 65c10 24 16 50 16 78c0 42-12 80-36 114l98 98c7 7 11 15 11 25z"}}]}," ",{"t":7,"e":"symbol","a":{"id":"antenna-svg-left","viewBox":"0 0 512 512"},"f":[{"t":7,"e":"path","a":{"d":"m368 160l-64-64-160 160 160 160 64-64-96-96z"}}]}," ",{"t":7,"e":"symbol","a":{"id":"antenna-svg-logo","viewBox":"0 0 512 512"},"f":[" ",{"t":7,"e":"path","a":{"d":"m283 510c125-17 229-124 229-253 0-141-115-256-256-256-141 0-256 115-256 256 0 130 108 237 233 254l0-149c-48-14-84-50-84-102 0-65 43-113 108-113 65 0 107 48 107 113 0 52-33 88-81 102z"}}]}," ",{"t":7,"e":"symbol","a":{"id":"antenna-svg-film","viewBox":"0 0 512 512"},"f":[{"t":7,"e":"path","a":{"d":"m91 457l0-36c0-5-1-10-5-13-4-4-8-6-13-6l-36 0c-5 0-10 2-13 6-4 3-6 8-6 13l0 36c0 5 2 9 6 13 3 4 8 5 13 5l36 0c5 0 9-1 13-5 4-4 5-8 5-13z m0-110l0-36c0-5-1-9-5-13-4-4-8-5-13-5l-36 0c-5 0-10 1-13 5-4 4-6 8-6 13l0 36c0 5 2 10 6 13 3 4 8 6 13 6l36 0c5 0 9-2 13-6 4-3 5-8 5-13z m0-109l0-37c0-5-1-9-5-13-4-3-8-5-13-5l-36 0c-5 0-10 2-13 5-4 4-6 8-6 13l0 37c0 5 2 9 6 13 3 3 8 5 13 5l36 0c5 0 9-2 13-5 4-4 5-8 5-13z m293 219l0-146c0-5-2-9-5-13-4-4-8-5-13-5l-220 0c-5 0-9 1-13 5-3 4-5 8-5 13l0 146c0 5 2 9 5 13 4 4 8 5 13 5l220 0c5 0 9-1 13-5 3-4 5-8 5-13z m-293-329l0-37c0-5-1-9-5-12-4-4-8-6-13-6l-36 0c-5 0-10 2-13 6-4 3-6 7-6 12l0 37c0 5 2 9 6 13 3 3 8 5 13 5l36 0c5 0 9-2 13-5 4-4 5-8 5-13z m403 329l0-36c0-5-2-10-6-13-3-4-8-6-13-6l-36 0c-5 0-9 2-13 6-4 3-5 8-5 13l0 36c0 5 1 9 5 13 4 4 8 5 13 5l36 0c5 0 10-1 13-5 4-4 6-8 6-13z m-110-219l0-147c0-5-2-9-5-12-4-4-8-6-13-6l-220 0c-5 0-9 2-13 6-3 3-5 7-5 12l0 147c0 5 2 9 5 13 4 3 8 5 13 5l220 0c5 0 9-2 13-5 3-4 5-8 5-13z m110 109l0-36c0-5-2-9-6-13-3-4-8-5-13-5l-36 0c-5 0-9 1-13 5-4 4-5 8-5 13l0 36c0 5 1 10 5 13 4 4 8 6 13 6l36 0c5 0 10-2 13-6 4-3 6-8 6-13z m0-109l0-37c0-5-2-9-6-13-3-3-8-5-13-5l-36 0c-5 0-9 2-13 5-4 4-5 8-5 13l0 37c0 5 1 9 5 13 4 3 8 5 13 5l36 0c5 0 10-2 13-5 4-4 6-8 6-13z m0-110l0-37c0-5-2-9-6-12-3-4-8-6-13-6l-36 0c-5 0-9 2-13 6-4 3-5 7-5 12l0 37c0 5 1 9 5 13 4 3 8 5 13 5l36 0c5 0 10-2 13-5 4-4 6-8 6-13z m36-46l0 384c0 13-4 24-13 33-9 9-20 13-32 13l-458 0c-12 0-23-4-32-13-9-9-13-20-13-33l0-384c0-12 4-23 13-32 9-9 20-13 32-13l458 0c12 0 23 4 32 13 9 9 13 20 13 32z"}}]}]}]}
},{}],101:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","o":"cssreset","v":{"tap":"dismiss"},"a":{"class":["antenna antenna-tap-helper ",{"t":4,"f":["antenna-helper-top"],"n":50,"r":"positionTop"},{"t":4,"n":51,"f":["antenna-helper-bottom"],"r":"positionTop"}]},"f":[{"t":7,"e":"div","a":{"class":"antenna-tap-helper-inner"},"f":[{"t":7,"e":"div","f":[{"t":8,"r":"logo"},{"t":7,"e":"span","a":{"class":"antenna-tap-helper-prompt"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"tap_helper__prompt\")"}}]}]}," ",{"t":7,"e":"div","a":{"class":"antenna-tap-helper-close"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"tap_helper__close\")"}}]}]}]}]}
},{}],102:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"span","o":"cssreset","a":{"class":["antenna antenna-text-indicator-widget ",{"t":4,"f":["antenna-notloaded"],"n":51,"r":"containerData.loaded"}," antenna-reset ",{"t":4,"f":["antenna-hasreactions"],"n":50,"x":{"r":["containerData.reactionTotal"],"s":"_0>0"}}," ",{"t":4,"f":["antenna-suppress"],"n":50,"r":"containerData.suppress"}," ",{"t":2,"r":"extraClasses"}]},"f":[" ",{"t":7,"e":"span","a":{"class":"antenna-text-indicator-inner"},"f":[{"t":8,"r":"logo"},{"t":4,"f":[{"t":7,"e":"span","a":{"class":"antenna-reaction-total"},"o":"cssreset","f":[{"t":2,"r":"containerData.reactionTotal"}]}],"n":50,"r":"containerData.reactionTotal"}]}]}]}
},{}]},{},[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvYW50ZW5uYS1hcHAuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvYXV0by1jYWxsLXRvLWFjdGlvbi5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9ibG9ja2VkLXJlYWN0aW9uLXBhZ2UuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvY2FsbC10by1hY3Rpb24tY291bnRlci5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9jYWxsLXRvLWFjdGlvbi1leHBhbmRlZC1yZWFjdGlvbnMuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvY2FsbC10by1hY3Rpb24taW5kaWNhdG9yLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL2NhbGwtdG8tYWN0aW9uLWxhYmVsLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL2NvbW1lbnQtYXJlYS1wYXJ0aWFsLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL2NvbW1lbnRzLXBhZ2UuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvY29uZmlybWF0aW9uLXBhZ2UuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvY29udGVudC1yZWMtbG9hZGVyLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL2NvbnRlbnQtcmVjLXdpZGdldC5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9jc3MtbG9hZGVyLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL2RlZmF1bHRzLXBhZ2UuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvZXZlbnRzLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL2dlbmVyaWMtZXJyb3ItcGFnZS5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9ncm91cC1zZXR0aW5ncy1sb2FkZXIuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvZ3JvdXAtc2V0dGluZ3MuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvaGFzaGVkLWVsZW1lbnRzLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL2xvY2F0aW9ucy1wYWdlLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL2xvZ2luLXBhZ2UuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvbWVkaWEtaW5kaWNhdG9yLXdpZGdldC5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9wYWdlLWRhdGEtbG9hZGVyLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3BhZ2UtZGF0YS5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9wYWdlLXNjYW5uZXIuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvcGVuZGluZy1yZWFjdGlvbi1wYWdlLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3BvcHVwLXdpZGdldC5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9yZWFjdGlvbnMtcGFnZS5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9yZWFjdGlvbnMtd2lkZ2V0LmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3JlYWRtb3JlLWV2ZW50cy5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9yZWluaXRpYWxpemVyLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3NjcmlwdC1sb2FkZXIuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvc3VtbWFyeS13aWRnZXQuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvc3Zncy5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy90YXAtaGVscGVyLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3RleHQtaW5kaWNhdG9yLXdpZGdldC5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy90ZXh0LXJlYWN0aW9ucy5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9hamF4LWNsaWVudC5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9hcHAtbW9kZS5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9icm93c2VyLW1ldHJpY3MuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvY2FsbGJhY2stc3VwcG9ydC5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9oYXNoLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL2pxdWVyeS1wcm92aWRlci5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9qc29uLXV0aWxzLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL2pzb25wLWNsaWVudC5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9sb2dnaW5nLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL21kNS5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9tZXNzYWdlcy1lbi5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9tZXNzYWdlcy1lcy5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9tZXNzYWdlcy5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9tb3ZlYWJsZS5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9tdXRhdGlvbi1vYnNlcnZlci5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9wYWdlLXV0aWxzLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL3JhY3RpdmUtZXZlbnRzLXRhcC5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9yYWN0aXZlLXByb3ZpZGVyLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL3JhbmdlLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL3Jhbmd5LXByb3ZpZGVyLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL3JlYWN0aW9ucy13aWRnZXQtbGF5b3V0LXV0aWxzLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL3NlZ21lbnQuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvc2Vzc2lvbi1kYXRhLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL3Rocm90dGxlZC1ldmVudHMuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvdG91Y2gtc3VwcG9ydC5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy90cmFuc2l0aW9uLXV0aWwuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvdXJsLWNvbnN0YW50cy5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy91cmwtcGFyYW1zLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL3VybHMuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvdXNlci5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy92aXNpYmlsaXR5LmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL3dpZGdldC1idWNrZXQuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMveGRtLWNsaWVudC5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy94ZG0tbG9hZGVyLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3hkbS1hbmFseXRpY3MuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL2F1dG8tY2FsbC10by1hY3Rpb24uaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL2Jsb2NrZWQtcmVhY3Rpb24tcGFnZS5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvY2FsbC10by1hY3Rpb24tY291bnRlci5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvY2FsbC10by1hY3Rpb24tZXhwYW5kZWQtcmVhY3Rpb25zLmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9jYWxsLXRvLWFjdGlvbi1sYWJlbC5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvY29tbWVudC1hcmVhLXBhcnRpYWwuaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL2NvbW1lbnRzLXBhZ2UuaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL2NvbmZpcm1hdGlvbi1wYWdlLmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9jb250ZW50LXJlYy13aWRnZXQuaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL2RlZmF1bHRzLXBhZ2UuaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL2dlbmVyaWMtZXJyb3ItcGFnZS5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvbG9jYXRpb25zLXBhZ2UuaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL2xvZ2luLXBhZ2UuaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL21lZGlhLWluZGljYXRvci13aWRnZXQuaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL3BlbmRpbmctcmVhY3Rpb24tcGFnZS5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvcG9wdXAtd2lkZ2V0Lmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9yZWFjdGlvbnMtcGFnZS5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvcmVhY3Rpb25zLXdpZGdldC5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvc3VtbWFyeS13aWRnZXQuaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL3N2Zy1jb21tZW50cy5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvc3ZnLWZhY2Vib29rLmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9zdmctZmlsbS5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvc3ZnLWxlZnQuaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL3N2Zy1sb2NhdGlvbi5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvc3ZnLWxvZ28tc2VsZWN0YWJsZS5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvc3ZnLWxvZ28uaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL3N2Zy10d2l0dGVyLmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9zdmdzLmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy90YXAtaGVscGVyLmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy90ZXh0LWluZGljYXRvci13aWRnZXQuaGJzLmh0bWwiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMVlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDclJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN1NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN2tCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyaUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDblRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6TkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25JQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUEiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiaWYgKHdpbmRvdy5BTlRFTk5BSVMgfHwgd2luZG93LmFudGVubmEgfHwgd2luZG93LkFudGVubmFBcHApIHtcbiAgICAvLyBQcm90ZWN0IGFnYWluc3QgbXVsdGlwbGUgaW5zdGFuY2VzIG9mIHRoaXMgc2NyaXB0IGJlaW5nIGFkZGVkIHRvIHRoZSBwYWdlIChvciB0aGlzIHNjcmlwdCBhbmQgZW5nYWdlLmpzKVxuICAgIHJldHVybjtcbn1cbmlmICghd2luZG93Lk11dGF0aW9uT2JzZXJ2ZXIgfHwgIUVsZW1lbnQucHJvdG90eXBlLmFkZEV2ZW50TGlzdGVuZXIgfHwgISgnY2xhc3NMaXN0JyBpbiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSkpIHtcbiAgICAvLyBCYWlsIG91dCBvbiBsZWdhY3kgYnJvd3NlcnMuXG4gICAgcmV0dXJuO1xufVxuXG52YXIgU2NyaXB0TG9hZGVyID0gcmVxdWlyZSgnLi9zY3JpcHQtbG9hZGVyJyk7XG52YXIgQ3NzTG9hZGVyID0gcmVxdWlyZSgnLi9jc3MtbG9hZGVyJyk7XG52YXIgR3JvdXBTZXR0aW5nc0xvYWRlciA9IHJlcXVpcmUoJy4vZ3JvdXAtc2V0dGluZ3MtbG9hZGVyJyk7XG52YXIgVGFwSGVscGVyID0gcmVxdWlyZSgnLi90YXAtaGVscGVyJyk7XG52YXIgUGFnZURhdGFMb2FkZXIgPSByZXF1aXJlKCcuL3BhZ2UtZGF0YS1sb2FkZXInKTtcbnZhciBQYWdlU2Nhbm5lciA9IHJlcXVpcmUoJy4vcGFnZS1zY2FubmVyJyk7XG52YXIgUmVpbml0aWFsaXplciA9IHJlcXVpcmUoJy4vcmVpbml0aWFsaXplcicpO1xudmFyIFhETUFuYWx5dGljcyA9IHJlcXVpcmUoJy4veGRtLWFuYWx5dGljcycpO1xudmFyIEJyb3dzZXJNZXRyaWNzID0gcmVxdWlyZSgnLi91dGlscy9icm93c2VyLW1ldHJpY3MnKTtcbnZhciBYRE1Mb2FkZXIgPSByZXF1aXJlKCcuL3V0aWxzL3hkbS1sb2FkZXInKTtcblxud2luZG93LkFudGVubmFBcHAgPSB7IC8vIFRPRE8gZmxlc2ggb3V0IG91ciBkZXNpcmVkIEFQSVxuICAgIHJlaW5pdGlhbGl6ZTogUmVpbml0aWFsaXplci5yZWluaXRpYWxpemVBbGxcbiAgICAvLyB0ZWFyZG93bj9cbiAgICAvLyB0cmFjZT9cbiAgICAvLyBkZWJ1Zz9cbiAgICAvLyBwYWdlZGF0YT9cbiAgICAvLyBncm91cHNldHRpbmdzP1xuICAgIC8vIG5lZWQgdG8gbWFrZSBzdXJlIG90aGVycyAoZS5nLiBtYWxpY2lvdXMgc2NyaXB0cykgY2FuJ3Qgd3JpdGUgZGF0YVxufTtcblxuLy8gU3RlcCAxIC0ga2ljayBvZmYgdGhlIGFzeW5jaHJvbm91cyBsb2FkaW5nIG9mIHRoZSBKYXZhc2NyaXB0IGFuZCBDU1Mgd2UgbmVlZC5cbkNzc0xvYWRlci5sb2FkKCk7IC8vIEluamVjdCB0aGUgQ1NTIGZpcnN0IGJlY2F1c2Ugd2UgbWF5IHNvb24gYXBwZW5kIG1vcmUgYXN5bmNocm9ub3VzbHksIGluIHRoZSBncm91cFNldHRpbmdzIGNhbGxiYWNrLCBhbmQgd2Ugd2FudCB0aGF0IENTUyB0byBiZSBsb3dlciBpbiB0aGUgZG9jdW1lbnQuXG5TY3JpcHRMb2FkZXIubG9hZChzY3JpcHRMb2FkZWQpO1xuXG5mdW5jdGlvbiBzY3JpcHRMb2FkZWQoKSB7XG4gICAgLy8gU3RlcCAyIC0gT25jZSB3ZSBoYXZlIG91ciByZXF1aXJlZCBzY3JpcHRzLCBmZXRjaCB0aGUgZ3JvdXAgc2V0dGluZ3MgZnJvbSB0aGUgc2VydmVyXG4gICAgR3JvdXBTZXR0aW5nc0xvYWRlci5sb2FkKGZ1bmN0aW9uKGdyb3VwU2V0dGluZ3MpIHtcbiAgICAgICAgaWYgKGdyb3VwU2V0dGluZ3MuaXNIaWRlT25Nb2JpbGUoKSAmJiBCcm93c2VyTWV0cmljcy5pc01vYmlsZSgpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgLy8gU3RlcCAzIC0gT25jZSB3ZSBoYXZlIHRoZSBzZXR0aW5ncywgd2UgY2FuIGtpY2sgb2ZmIGEgY291cGxlIHRoaW5ncyBpbiBwYXJhbGxlbDpcbiAgICAgICAgLy9cbiAgICAgICAgLy8gLS0gaW5qZWN0IGFueSBjdXN0b20gQ1NTIGZyb20gdGhlIGdyb3VwIHNldHRpbmdzXG4gICAgICAgIC8vIC0tIGNyZWF0ZSB0aGUgaGlkZGVuIGlmcmFtZSB3ZSB1c2UgZm9yIGNyb3NzLWRvbWFpbiBjb29raWVzIChwcmltYXJpbHkgdXNlciBsb2dpbilcbiAgICAgICAgLy8gLS0gc3RhcnQgZmV0Y2hpbmcgdGhlIHBhZ2UgZGF0YVxuICAgICAgICAvLyAtLSBzdGFydCBoYXNoaW5nIHRoZSBwYWdlIGFuZCBpbnNlcnRpbmcgdGhlIGFmZm9yZGFuY2VzIChpbiB0aGUgZW1wdHkgc3RhdGUpXG4gICAgICAgIC8vXG4gICAgICAgIC8vIEFzIHRoZSBwYWdlIGlzIHNjYW5uZWQsIHRoZSB3aWRnZXRzIGFyZSBjcmVhdGVkIGFuZCBib3VuZCB0byB0aGUgcGFnZSBkYXRhIHRoYXQgY29tZXMgaW4uXG4gICAgICAgIGluaXRDdXN0b21DU1MoZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIGluaXRYZG1GcmFtZShncm91cFNldHRpbmdzKTtcbiAgICAgICAgZmV0Y2hQYWdlRGF0YShncm91cFNldHRpbmdzKTtcbiAgICAgICAgc2NhblBhZ2UoZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIHNldHVwTW9iaWxlSGVscGVyKGdyb3VwU2V0dGluZ3MpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBpbml0Q3VzdG9tQ1NTKGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgY3VzdG9tQ1NTID0gZ3JvdXBTZXR0aW5ncy5jdXN0b21DU1MoKTtcbiAgICBpZiAoY3VzdG9tQ1NTKSB7XG4gICAgICAgIENzc0xvYWRlci5pbmplY3QoY3VzdG9tQ1NTKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGluaXRYZG1GcmFtZShncm91cFNldHRpbmdzKSB7XG4gICAgWERNQW5hbHl0aWNzLnN0YXJ0KCk7XG4gICAgWERNTG9hZGVyLmNyZWF0ZVhETWZyYW1lKGdyb3VwU2V0dGluZ3MuZ3JvdXBJZCgpKTtcbn1cblxuZnVuY3Rpb24gZmV0Y2hQYWdlRGF0YShncm91cFNldHRpbmdzKSB7XG4gICAgUGFnZURhdGFMb2FkZXIubG9hZChncm91cFNldHRpbmdzKTtcbn1cblxuZnVuY3Rpb24gc2NhblBhZ2UoZ3JvdXBTZXR0aW5ncykge1xuICAgIFBhZ2VTY2FubmVyLnNjYW4oZ3JvdXBTZXR0aW5ncywgUmVpbml0aWFsaXplci5yZWluaXRpYWxpemUpO1xufVxuXG5mdW5jdGlvbiBzZXR1cE1vYmlsZUhlbHBlcihncm91cFNldHRpbmdzKSB7XG4gICAgVGFwSGVscGVyLnNldHVwSGVscGVyKGdyb3VwU2V0dGluZ3MpO1xufSIsInZhciAkOyByZXF1aXJlKCcuL3V0aWxzL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIEJyb3dzZXJNZXRyaWNzID0gcmVxdWlyZSgnLi91dGlscy9icm93c2VyLW1ldHJpY3MnKTtcbnZhciBSYWN0aXZlOyByZXF1aXJlKCcuL3V0aWxzL3JhY3RpdmUtcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24obG9hZGVkUmFjdGl2ZSkgeyBSYWN0aXZlPWxvYWRlZFJhY3RpdmU7IH0pO1xudmFyIFNWR3MgPSByZXF1aXJlKCcuL3N2Z3MnKTtcblxuZnVuY3Rpb24gY3JlYXRlQ2FsbFRvQWN0aW9uKGFudEl0ZW1JZCwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgcmFjdGl2ZSA9IFJhY3RpdmUoe1xuICAgICAgICBlbDogJCgnPGRpdj4nKSxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgYW50SXRlbUlkOiBhbnRJdGVtSWQsXG4gICAgICAgICAgICBleHBhbmRSZWFjdGlvbnM6IHNob3VsZEV4cGFuZFJlYWN0aW9ucyhncm91cFNldHRpbmdzKVxuICAgICAgICB9LFxuICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL2F1dG8tY2FsbC10by1hY3Rpb24uaGJzLmh0bWwnKSxcbiAgICAgICAgcGFydGlhbHM6IHtcbiAgICAgICAgICAgIGxvZ286IFNWR3MubG9nb1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZWxlbWVudDogJChyYWN0aXZlLmZpbmQoJy5hbnRlbm5hLWF1dG8tY3RhJykpLFxuICAgICAgICB0ZWFyZG93bjogZnVuY3Rpb24oKSB7IHJhY3RpdmUudGVhcmRvd24oKTsgfVxuICAgIH07XG59XG5cbmZ1bmN0aW9uIHNob3VsZEV4cGFuZFJlYWN0aW9ucyhncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIHNldHRpbmcgPSBncm91cFNldHRpbmdzLmdlbmVyYXRlZEN0YUV4cGFuZGVkKCk7IC8vIFZhbHVlcyBhcmUgJ25vbmUnLCAnYm90aCcsICdkZXNrdG9wJywgYW5kICdtb2JpbGUnXG4gICAgcmV0dXJuIHNldHRpbmcgPT09ICdib3RoJyB8fFxuICAgICAgICAoc2V0dGluZyA9PT0gJ2Rlc2t0b3AnICYmICFCcm93c2VyTWV0cmljcy5pc01vYmlsZSgpKSB8fFxuICAgICAgICAoc2V0dGluZyA9PT0gJ21vYmlsZScgJiYgQnJvd3Nlck1ldHJpY3MuaXNNb2JpbGUoKSk7XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGU6IGNyZWF0ZUNhbGxUb0FjdGlvblxufTsiLCJ2YXIgUmFjdGl2ZTsgcmVxdWlyZSgnLi91dGlscy9yYWN0aXZlLXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGxvYWRlZFJhY3RpdmUpIHsgUmFjdGl2ZSA9IGxvYWRlZFJhY3RpdmU7fSk7XG52YXIgU1ZHcyA9IHJlcXVpcmUoJy4vc3ZncycpO1xuXG52YXIgcGFnZVNlbGVjdG9yID0gJy5hbnRlbm5hLWJsb2NrZWQtcGFnZSc7XG5cbmZ1bmN0aW9uIGNyZWF0ZVBhZ2Uob3B0aW9ucykge1xuICAgIHZhciBnb0JhY2sgPSBvcHRpb25zLmdvQmFjaztcbiAgICB2YXIgZWxlbWVudCA9IG9wdGlvbnMuZWxlbWVudDtcbiAgICB2YXIgcmFjdGl2ZSA9IFJhY3RpdmUoe1xuICAgICAgICBlbDogZWxlbWVudCxcbiAgICAgICAgYXBwZW5kOiB0cnVlLFxuICAgICAgICBkYXRhOiB7fSxcbiAgICAgICAgdGVtcGxhdGU6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9ibG9ja2VkLXJlYWN0aW9uLXBhZ2UuaGJzLmh0bWwnKSxcbiAgICAgICAgcGFydGlhbHM6IHtcbiAgICAgICAgICAgIGxlZnQ6IFNWR3MubGVmdFxuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmFjdGl2ZS5vbignYmFjaycsIGdvQmFjayk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgc2VsZWN0b3I6IHBhZ2VTZWxlY3RvcixcbiAgICAgICAgdGVhcmRvd246IGZ1bmN0aW9uKCkgeyByYWN0aXZlLnRlYXJkb3duKCk7IH1cbiAgICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGVQYWdlOiBjcmVhdGVQYWdlXG59OyIsInZhciBSYWN0aXZlOyByZXF1aXJlKCcuL3V0aWxzL3JhY3RpdmUtcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24obG9hZGVkUmFjdGl2ZSkgeyBSYWN0aXZlID0gbG9hZGVkUmFjdGl2ZTt9KTtcblxuZnVuY3Rpb24gY3JlYXRlQ291bnQoJGNvdW50RWxlbWVudCwgY29udGFpbmVyRGF0YSkge1xuICAgIHZhciByYWN0aXZlID0gUmFjdGl2ZSh7XG4gICAgICAgIGVsOiAkY291bnRFbGVtZW50LFxuICAgICAgICBtYWdpYzogdHJ1ZSxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgY29udGFpbmVyRGF0YTogY29udGFpbmVyRGF0YVxuICAgICAgICB9LFxuICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL2NhbGwtdG8tYWN0aW9uLWNvdW50ZXIuaGJzLmh0bWwnKVxuICAgIH0pO1xuICAgIHJldHVybiB7XG4gICAgICAgIHRlYXJkb3duOiBmdW5jdGlvbigpIHsgcmFjdGl2ZS50ZWFyZG93bigpOyB9XG4gICAgfTtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZTogY3JlYXRlQ291bnRcbn07IiwidmFyIFJhY3RpdmU7IHJlcXVpcmUoJy4vdXRpbHMvcmFjdGl2ZS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihsb2FkZWRSYWN0aXZlKSB7IFJhY3RpdmUgPSBsb2FkZWRSYWN0aXZlO30pO1xuXG5mdW5jdGlvbiBjcmVhdGVFeHBhbmRlZFJlYWN0aW9ucygkZXhwYW5kZWRSZWFjdGlvbnNFbGVtZW50LCAkY29udGFpbmVyRWxlbWVudCwgY29udGFpbmVyRGF0YSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciByYWN0aXZlID0gUmFjdGl2ZSh7XG4gICAgICAgIGVsOiAkZXhwYW5kZWRSZWFjdGlvbnNFbGVtZW50LFxuICAgICAgICBtYWdpYzogdHJ1ZSxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgY29udGFpbmVyRGF0YTogY29udGFpbmVyRGF0YSxcbiAgICAgICAgICAgIGNvbXB1dGVFeHBhbmRlZFJlYWN0aW9uczogY29tcHV0ZUV4cGFuZGVkUmVhY3Rpb25zKGdyb3VwU2V0dGluZ3MuZGVmYXVsdFJlYWN0aW9ucygkY29udGFpbmVyRWxlbWVudCkpXG4gICAgICAgIH0sXG4gICAgICAgIHRlbXBsYXRlOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvY2FsbC10by1hY3Rpb24tZXhwYW5kZWQtcmVhY3Rpb25zLmhicy5odG1sJylcbiAgICB9KTtcbiAgICByZXR1cm4ge1xuICAgICAgICB0ZWFyZG93bjogZnVuY3Rpb24oKSB7IHJhY3RpdmUudGVhcmRvd24oKTsgfVxuICAgIH07XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVFeHBhbmRlZFJlYWN0aW9ucyhkZWZhdWx0UmVhY3Rpb25zKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHJlYWN0aW9uc0RhdGEpIHtcbiAgICAgICAgdmFyIG1heCA9IDI7XG4gICAgICAgIHZhciBleHBhbmRlZFJlYWN0aW9ucyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJlYWN0aW9uc0RhdGEubGVuZ3RoICYmIGV4cGFuZGVkUmVhY3Rpb25zLmxlbmd0aCA8IG1heDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgcmVhY3Rpb25EYXRhID0gcmVhY3Rpb25zRGF0YVtpXTtcbiAgICAgICAgICAgIGlmIChpc0RlZmF1bHRSZWFjdGlvbihyZWFjdGlvbkRhdGEsIGRlZmF1bHRSZWFjdGlvbnMpKSB7XG4gICAgICAgICAgICAgICAgZXhwYW5kZWRSZWFjdGlvbnMucHVzaChyZWFjdGlvbkRhdGEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBleHBhbmRlZFJlYWN0aW9ucztcbiAgICB9O1xufVxuXG5mdW5jdGlvbiBpc0RlZmF1bHRSZWFjdGlvbihyZWFjdGlvbkRhdGEsIGRlZmF1bHRSZWFjdGlvbnMpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRlZmF1bHRSZWFjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGRlZmF1bHRSZWFjdGlvbnNbaV0udGV4dCA9PT0gcmVhY3Rpb25EYXRhLnRleHQpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZTogY3JlYXRlRXhwYW5kZWRSZWFjdGlvbnNcbn07IiwidmFyIENhbGxUb0FjdGlvbkNvdW50ZXIgPSByZXF1aXJlKCcuL2NhbGwtdG8tYWN0aW9uLWNvdW50ZXInKTtcbnZhciBDYWxsVG9BY3Rpb25FeHBhbmRlZFJlYWN0aW9ucyA9IHJlcXVpcmUoJy4vY2FsbC10by1hY3Rpb24tZXhwYW5kZWQtcmVhY3Rpb25zJyk7XG52YXIgQ2FsbFRvQWN0aW9uTGFiZWwgPSByZXF1aXJlKCcuL2NhbGwtdG8tYWN0aW9uLWxhYmVsJyk7XG52YXIgUmVhY3Rpb25zV2lkZ2V0ID0gcmVxdWlyZSgnLi9yZWFjdGlvbnMtd2lkZ2V0Jyk7XG52YXIgVG91Y2hTdXBwb3J0ID0gcmVxdWlyZSgnLi91dGlscy90b3VjaC1zdXBwb3J0Jyk7XG5cblxuZnVuY3Rpb24gY3JlYXRlSW5kaWNhdG9yV2lkZ2V0KG9wdGlvbnMpIHtcbiAgICB2YXIgY29udGFpbmVyRGF0YSA9IG9wdGlvbnMuY29udGFpbmVyRGF0YTtcbiAgICB2YXIgJGNvbnRhaW5lckVsZW1lbnQgPSBvcHRpb25zLmNvbnRhaW5lckVsZW1lbnQ7XG4gICAgdmFyIGNvbnRlbnREYXRhID0gb3B0aW9ucy5jb250ZW50RGF0YTtcbiAgICB2YXIgJGN0YUVsZW1lbnQgPSBvcHRpb25zLmN0YUVsZW1lbnQ7XG4gICAgdmFyICRjdGFMYWJlbHMgPSBvcHRpb25zLmN0YUxhYmVsczsgLy8gb3B0aW9uYWxcbiAgICB2YXIgJGN0YUNvdW50ZXJzID0gb3B0aW9ucy5jdGFDb3VudGVyczsgLy8gb3B0aW9uYWxcbiAgICB2YXIgJGN0YUV4cGFuZGVkUmVhY3Rpb25zID0gb3B0aW9ucy5jdGFFeHBhbmRlZFJlYWN0aW9uczsgLy8gb3B0aW9uYWxcbiAgICB2YXIgcGFnZURhdGEgPSBvcHRpb25zLnBhZ2VEYXRhO1xuICAgIHZhciBncm91cFNldHRpbmdzID0gb3B0aW9ucy5ncm91cFNldHRpbmdzO1xuICAgIHZhciBkZWZhdWx0UmVhY3Rpb25zID0gb3B0aW9ucy5kZWZhdWx0UmVhY3Rpb25zO1xuXG4gICAgdmFyIHJlYWN0aW9uV2lkZ2V0T3B0aW9ucyA9IHtcbiAgICAgICAgcmVhY3Rpb25zRGF0YTogY29udGFpbmVyRGF0YS5yZWFjdGlvbnMsXG4gICAgICAgIGNvbnRhaW5lckRhdGE6IGNvbnRhaW5lckRhdGEsXG4gICAgICAgIGNvbnRhaW5lckVsZW1lbnQ6ICRjb250YWluZXJFbGVtZW50LFxuICAgICAgICBjb250ZW50RGF0YTogY29udGVudERhdGEsXG4gICAgICAgIGRlZmF1bHRSZWFjdGlvbnM6IGRlZmF1bHRSZWFjdGlvbnMsXG4gICAgICAgIHN0YXJ0UGFnZTogY29tcHV0ZVN0YXJ0UGFnZSgkY3RhRWxlbWVudCksXG4gICAgICAgIHBhZ2VEYXRhOiBwYWdlRGF0YSxcbiAgICAgICAgZ3JvdXBTZXR0aW5nczogZ3JvdXBTZXR0aW5nc1xuICAgIH07XG5cbiAgICBUb3VjaFN1cHBvcnQuc2V0dXBUYXAoJGN0YUVsZW1lbnQuZ2V0KDApLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgb3BlblJlYWN0aW9uc1dpbmRvdyhyZWFjdGlvbldpZGdldE9wdGlvbnMsICRjdGFFbGVtZW50KTtcbiAgICB9KTtcbiAgICAkY3RhRWxlbWVudC5vbignbW91c2VlbnRlci5hbnRlbm5hJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgaWYgKGV2ZW50LmJ1dHRvbnMgPiAwIHx8IChldmVudC5idXR0b25zID09IHVuZGVmaW5lZCAmJiBldmVudC53aGljaCA+IDApKSB7IC8vIE9uIFNhZmFyaSwgZXZlbnQuYnV0dG9ucyBpcyB1bmRlZmluZWQgYnV0IGV2ZW50LndoaWNoIGdpdmVzIGEgZ29vZCB2YWx1ZS4gZXZlbnQud2hpY2ggaXMgYmFkIG9uIEZGXG4gICAgICAgICAgICAvLyBEb24ndCByZWFjdCBpZiB0aGUgdXNlciBpcyBkcmFnZ2luZyBvciBzZWxlY3RpbmcgdGV4dC5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBvcGVuUmVhY3Rpb25zV2luZG93KHJlYWN0aW9uV2lkZ2V0T3B0aW9ucywgJGN0YUVsZW1lbnQpO1xuICAgIH0pO1xuXG4gICAgdmFyIGNyZWF0ZWRXaWRnZXRzID0gW107XG5cbiAgICBpZiAoJGN0YUxhYmVscykge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8ICRjdGFMYWJlbHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNyZWF0ZWRXaWRnZXRzLnB1c2goQ2FsbFRvQWN0aW9uTGFiZWwuY3JlYXRlKCRjdGFMYWJlbHNbaV0sIGNvbnRhaW5lckRhdGEpKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmICgkY3RhQ291bnRlcnMpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAkY3RhQ291bnRlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNyZWF0ZWRXaWRnZXRzLnB1c2goQ2FsbFRvQWN0aW9uQ291bnRlci5jcmVhdGUoJGN0YUNvdW50ZXJzW2ldLCBjb250YWluZXJEYXRhKSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoJGN0YUV4cGFuZGVkUmVhY3Rpb25zKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgJGN0YUV4cGFuZGVkUmVhY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjcmVhdGVkV2lkZ2V0cy5wdXNoKENhbGxUb0FjdGlvbkV4cGFuZGVkUmVhY3Rpb25zLmNyZWF0ZSgkY3RhRXhwYW5kZWRSZWFjdGlvbnNbaV0sICRjb250YWluZXJFbGVtZW50LCBjb250YWluZXJEYXRhLCBncm91cFNldHRpbmdzKSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICB0ZWFyZG93bjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAkY3RhRWxlbWVudC5vZmYoJy5hbnRlbm5hJyk7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNyZWF0ZWRXaWRnZXRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY3JlYXRlZFdpZGdldHNbaV0udGVhcmRvd24oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gY29tcHV0ZVN0YXJ0UGFnZSgkZWxlbWVudCkge1xuICAgIHZhciB2YWwgPSAoJGVsZW1lbnQuYXR0cignYW50LW1vZGUnKSB8fCAnJykudHJpbSgpO1xuICAgIGlmICh2YWwgPT09ICd3cml0ZScpIHtcbiAgICAgICAgcmV0dXJuIFJlYWN0aW9uc1dpZGdldC5QQUdFX0RFRkFVTFRTO1xuICAgIH0gZWxzZSBpZiAodmFsID09PSAncmVhZCcpIHtcbiAgICAgICAgcmV0dXJuIFJlYWN0aW9uc1dpZGdldC5QQUdFX1JFQUNUSU9OUztcbiAgICB9XG4gICAgcmV0dXJuIFJlYWN0aW9uc1dpZGdldC5QQUdFX0FVVE87XG59XG5cbmZ1bmN0aW9uIG9wZW5SZWFjdGlvbnNXaW5kb3cocmVhY3Rpb25PcHRpb25zLCAkY3RhRWxlbWVudCkge1xuICAgIFJlYWN0aW9uc1dpZGdldC5vcGVuKHJlYWN0aW9uT3B0aW9ucywgJGN0YUVsZW1lbnQpO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlOiBjcmVhdGVJbmRpY2F0b3JXaWRnZXRcbn07IiwidmFyIFJhY3RpdmU7IHJlcXVpcmUoJy4vdXRpbHMvcmFjdGl2ZS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihsb2FkZWRSYWN0aXZlKSB7IFJhY3RpdmUgPSBsb2FkZWRSYWN0aXZlO30pO1xuXG5mdW5jdGlvbiBjcmVhdGVMYWJlbCgkbGFiZWxFbGVtZW50LCBjb250YWluZXJEYXRhKSB7XG4gICAgdmFyIHJhY3RpdmUgPSBSYWN0aXZlKHtcbiAgICAgICAgZWw6ICRsYWJlbEVsZW1lbnQsIC8vIFRPRE86IHJldmlldyB0aGUgc3RydWN0dXJlIG9mIHRoZSBET00gaGVyZS4gRG8gd2Ugd2FudCB0byByZW5kZXIgYW4gZWxlbWVudCBpbnRvICRjdGFMYWJlbCBvciBqdXN0IHRleHQ/XG4gICAgICAgIG1hZ2ljOiB0cnVlLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICBjb250YWluZXJEYXRhOiBjb250YWluZXJEYXRhXG4gICAgICAgIH0sXG4gICAgICAgIHRlbXBsYXRlOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvY2FsbC10by1hY3Rpb24tbGFiZWwuaGJzLmh0bWwnKVxuICAgIH0pO1xuICAgIHJldHVybiB7XG4gICAgICAgIHRlYXJkb3duOiBmdW5jdGlvbigpIHsgcmFjdGl2ZS50ZWFyZG93bigpOyB9XG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlOiBjcmVhdGVMYWJlbFxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi91dGlscy9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciBBamF4Q2xpZW50ID0gcmVxdWlyZSgnLi91dGlscy9hamF4LWNsaWVudCcpO1xudmFyIFVzZXIgPSByZXF1aXJlKCcuL3V0aWxzL3VzZXInKTtcblxudmFyIEV2ZW50cyA9IHJlcXVpcmUoJy4vZXZlbnRzJyk7XG5cbmZ1bmN0aW9uIHNldHVwQ29tbWVudEFyZWEocmVhY3Rpb25Qcm92aWRlciwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MsIGNhbGxiYWNrLCByYWN0aXZlKSB7XG4gICAgaWYgKGdyb3VwU2V0dGluZ3MucmVxdWlyZXNBcHByb3ZhbCgpIHx8IGNvbnRhaW5lckRhdGEudHlwZSA9PT0gJ3BhZ2UnKSB7XG4gICAgICAgIC8vIEN1cnJlbnRseSwgc2l0ZXMgdGhhdCByZXF1aXJlIGFwcHJvdmFsIGRvbid0IHN1cHBvcnQgY29tbWVudCBpbnB1dC5cbiAgICAgICAgJChyYWN0aXZlLmZpbmQoJy5hbnRlbm5hLWNvbW1lbnQtd2lkZ2V0cycpKS5oaWRlKCk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgcmFjdGl2ZS5vbignaW5wdXRjaGFuZ2VkJywgdXBkYXRlSW5wdXRDb3VudGVyKTtcbiAgICByYWN0aXZlLm9uKCdhZGRjb21tZW50JywgYWRkQ29tbWVudCk7XG4gICAgdXBkYXRlSW5wdXRDb3VudGVyKCk7XG5cbiAgICBmdW5jdGlvbiBhZGRDb21tZW50KCkge1xuICAgICAgICB2YXIgY29tbWVudCA9ICQocmFjdGl2ZS5maW5kKCcuYW50ZW5uYS1jb21tZW50LWlucHV0JykpLnZhbCgpLnRyaW0oKTsgLy8gVE9ETzogYWRkaXRpb25hbCB2YWxpZGF0aW9uPyBpbnB1dCBzYW5pdGl6aW5nP1xuICAgICAgICBpZiAoY29tbWVudC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAkKHJhY3RpdmUuZmluZCgnLmFudGVubmEtY29tbWVudC13aWRnZXRzJykpLmhpZGUoKTtcbiAgICAgICAgICAgICQocmFjdGl2ZS5maW5kKCcuYW50ZW5uYS1jb21tZW50LXdhaXRpbmcnKSkuZmFkZUluKCdzbG93Jyk7XG4gICAgICAgICAgICByZWFjdGlvblByb3ZpZGVyLmdldChmdW5jdGlvbiAocmVhY3Rpb24pIHtcbiAgICAgICAgICAgICAgICBBamF4Q2xpZW50LnBvc3RDb21tZW50KGNvbW1lbnQsIHJlYWN0aW9uLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBFdmVudHMucG9zdENvbW1lbnRDcmVhdGVkKHBhZ2VEYXRhLCBjb250YWluZXJEYXRhLCByZWFjdGlvbiwgY29tbWVudCwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICAgICAgfSwgZXJyb3IpO1xuICAgICAgICAgICAgICAgICQocmFjdGl2ZS5maW5kKCcuYW50ZW5uYS1jb21tZW50LXdhaXRpbmcnKSkuc3RvcCgpLmhpZGUoKTtcbiAgICAgICAgICAgICAgICAkKHJhY3RpdmUuZmluZCgnLmFudGVubmEtY29tbWVudC1yZWNlaXZlZCcpKS5mYWRlSW4oKTtcbiAgICAgICAgICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soY29tbWVudCwgVXNlci5vcHRpbWlzdGljQ29tbWVudFVzZXIoKSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gZXJyb3IobWVzc2FnZSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBUT0RPIHJlYWwgZXJyb3IgaGFuZGxpbmdcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0Vycm9yIHBvc3RpbmcgY29tbWVudDogJyArIG1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdXBkYXRlSW5wdXRDb3VudGVyKCkge1xuICAgICAgICB2YXIgJHRleHRhcmVhID0gJChyYWN0aXZlLmZpbmQoJy5hbnRlbm5hLWNvbW1lbnQtaW5wdXQnKSk7XG4gICAgICAgIHZhciBtYXggPSBwYXJzZUludCgkdGV4dGFyZWEuYXR0cignbWF4bGVuZ3RoJykpO1xuICAgICAgICB2YXIgbGVuZ3RoID0gJHRleHRhcmVhLnZhbCgpLmxlbmd0aDtcbiAgICAgICAgJChyYWN0aXZlLmZpbmQoJy5hbnRlbm5hLWNvbW1lbnQtY291bnQnKSkuaHRtbChNYXRoLm1heCgwLCBtYXggLSBsZW5ndGgpKTtcbiAgICB9XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBzZXR1cDogc2V0dXBDb21tZW50QXJlYVxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi91dGlscy9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciBSYWN0aXZlOyByZXF1aXJlKCcuL3V0aWxzL3JhY3RpdmUtcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24obG9hZGVkUmFjdGl2ZSkgeyBSYWN0aXZlID0gbG9hZGVkUmFjdGl2ZTt9KTtcbnZhciBDb21tZW50QXJlYVBhcnRpYWwgPSByZXF1aXJlKCcuL2NvbW1lbnQtYXJlYS1wYXJ0aWFsJyk7XG52YXIgU1ZHcyA9IHJlcXVpcmUoJy4vc3ZncycpO1xuXG52YXIgcGFnZVNlbGVjdG9yID0gJy5hbnRlbm5hLWNvbW1lbnRzLXBhZ2UnO1xuXG5mdW5jdGlvbiBjcmVhdGVQYWdlKG9wdGlvbnMpIHtcbiAgICB2YXIgcmVhY3Rpb24gPSBvcHRpb25zLnJlYWN0aW9uO1xuICAgIHZhciBjb21tZW50cyA9IG9wdGlvbnMuY29tbWVudHM7XG4gICAgdmFyIGVsZW1lbnQgPSBvcHRpb25zLmVsZW1lbnQ7XG4gICAgdmFyIGNvbnRhaW5lckRhdGEgPSBvcHRpb25zLmNvbnRhaW5lckRhdGE7XG4gICAgdmFyIHBhZ2VEYXRhID0gb3B0aW9ucy5wYWdlRGF0YTtcbiAgICB2YXIgZ3JvdXBTZXR0aW5ncyA9IG9wdGlvbnMuZ3JvdXBTZXR0aW5ncztcbiAgICB2YXIgZ29CYWNrID0gb3B0aW9ucy5nb0JhY2s7XG4gICAgdmFyIHJhY3RpdmUgPSBSYWN0aXZlKHtcbiAgICAgICAgZWw6IGVsZW1lbnQsXG4gICAgICAgIGFwcGVuZDogdHJ1ZSxcbiAgICAgICAgbWFnaWM6IHRydWUsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIHJlYWN0aW9uOiByZWFjdGlvbixcbiAgICAgICAgICAgIGNvbW1lbnRzOiBjb21tZW50c1xuICAgICAgICB9LFxuICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL2NvbW1lbnRzLXBhZ2UuaGJzLmh0bWwnKSxcbiAgICAgICAgcGFydGlhbHM6IHtcbiAgICAgICAgICAgIGNvbW1lbnRBcmVhOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvY29tbWVudC1hcmVhLXBhcnRpYWwuaGJzLmh0bWwnKSxcbiAgICAgICAgICAgIGxlZnQ6IFNWR3MubGVmdFxuICAgICAgICB9XG4gICAgfSk7XG4gICAgdmFyIHJlYWN0aW9uUHJvdmlkZXIgPSB7IC8vIHRoaXMgcmVhY3Rpb24gcHJvdmlkZXIgaXMgYSBuby1icmFpbmVyIGJlY2F1c2Ugd2UgYWxyZWFkeSBoYXZlIGEgdmFsaWQgcmVhY3Rpb24gKG9uZSB3aXRoIGFuIElEKVxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhyZWFjdGlvbik7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIENvbW1lbnRBcmVhUGFydGlhbC5zZXR1cChyZWFjdGlvblByb3ZpZGVyLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncywgY29tbWVudEFkZGVkLCByYWN0aXZlLCBncm91cFNldHRpbmdzKTtcbiAgICByYWN0aXZlLm9uKCdiYWNrJywgZ29CYWNrKTtcbiAgICByZXR1cm4ge1xuICAgICAgICBzZWxlY3RvcjogcGFnZVNlbGVjdG9yLFxuICAgICAgICB0ZWFyZG93bjogZnVuY3Rpb24oKSB7IHJhY3RpdmUudGVhcmRvd24oKTsgfVxuICAgIH07XG5cbiAgICBmdW5jdGlvbiBjb21tZW50QWRkZWQoY29tbWVudCwgdXNlcikge1xuICAgICAgICBjb21tZW50cy51bnNoaWZ0KHsgdGV4dDogY29tbWVudCwgdXNlcjogdXNlciwgbmV3OiB0cnVlIH0pO1xuICAgICAgICAkKHJhY3RpdmUuZmluZCgnLmFudGVubmEtYm9keScpKS5hbmltYXRlKHtzY3JvbGxUb3A6IDB9KTtcbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZTogY3JlYXRlUGFnZVxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi91dGlscy9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciBSYWN0aXZlOyByZXF1aXJlKCcuL3V0aWxzL3JhY3RpdmUtcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24obG9hZGVkUmFjdGl2ZSkgeyBSYWN0aXZlID0gbG9hZGVkUmFjdGl2ZTt9KTtcbnZhciBBamF4Q2xpZW50ID0gcmVxdWlyZSgnLi91dGlscy9hamF4LWNsaWVudCcpO1xudmFyIFVSTHMgPSByZXF1aXJlKCcuL3V0aWxzL3VybHMnKTtcbnZhciBDb21tZW50QXJlYVBhcnRpYWwgPSByZXF1aXJlKCcuL2NvbW1lbnQtYXJlYS1wYXJ0aWFsJyk7XG52YXIgRXZlbnRzID0gcmVxdWlyZSgnLi9ldmVudHMnKTtcbnZhciBTVkdzID0gcmVxdWlyZSgnLi9zdmdzJyk7XG5cbnZhciBwYWdlU2VsZWN0b3IgPSAnLmFudGVubmEtY29uZmlybWF0aW9uLXBhZ2UnO1xuXG5mdW5jdGlvbiBjcmVhdGVQYWdlKHJlYWN0aW9uVGV4dCwgcmVhY3Rpb25Qcm92aWRlciwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MsIGVsZW1lbnQpIHtcbiAgICB2YXIgcG9wdXBXaW5kb3c7XG4gICAgdmFyIHJhY3RpdmUgPSBSYWN0aXZlKHtcbiAgICAgICAgZWw6IGVsZW1lbnQsXG4gICAgICAgIGFwcGVuZDogdHJ1ZSxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgdGV4dDogcmVhY3Rpb25UZXh0XG4gICAgICAgIH0sXG4gICAgICAgIHRlbXBsYXRlOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvY29uZmlybWF0aW9uLXBhZ2UuaGJzLmh0bWwnKSxcbiAgICAgICAgcGFydGlhbHM6IHtcbiAgICAgICAgICAgIGNvbW1lbnRBcmVhOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvY29tbWVudC1hcmVhLXBhcnRpYWwuaGJzLmh0bWwnKSxcbiAgICAgICAgICAgIGZhY2Vib29rSWNvbjogU1ZHcy5mYWNlYm9vayxcbiAgICAgICAgICAgIHR3aXR0ZXJJY29uOiBTVkdzLnR3aXR0ZXJcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJhY3RpdmUub24oJ3NoYXJlLWZhY2Vib29rJywgc2hhcmVUb0ZhY2Vib29rKTtcbiAgICByYWN0aXZlLm9uKCdzaGFyZS10d2l0dGVyJywgc2hhcmVUb1R3aXR0ZXIpO1xuICAgIENvbW1lbnRBcmVhUGFydGlhbC5zZXR1cChyZWFjdGlvblByb3ZpZGVyLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncywgbnVsbCwgcmFjdGl2ZSk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgc2VsZWN0b3I6IHBhZ2VTZWxlY3RvcixcbiAgICAgICAgdGVhcmRvd246IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY2xvc2VTaGFyZVdpbmRvdygpO1xuICAgICAgICAgICAgcmFjdGl2ZS50ZWFyZG93bigpO1xuICAgICAgICB9XG4gICAgfTtcblxuXG4gICAgZnVuY3Rpb24gc2hhcmVUb0ZhY2Vib29rKHJhY3RpdmVFdmVudCkge1xuICAgICAgICByYWN0aXZlRXZlbnQub3JpZ2luYWwucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgc2hhcmVSZWFjdGlvbihmdW5jdGlvbihyZWFjdGlvbkRhdGEsIHNob3J0VXJsKSB7XG4gICAgICAgICAgICBFdmVudHMucG9zdFJlYWN0aW9uU2hhcmVkKCdmYWNlYm9vaycsIHBhZ2VEYXRhLCBjb250YWluZXJEYXRhLCByZWFjdGlvbkRhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgdmFyIHNoYXJlVGV4dCA9IGNvbXB1dGVTaGFyZVRleHQocmVhY3Rpb25EYXRhLCAzMDApO1xuICAgICAgICAgICAgdmFyIGltYWdlUGFyYW0gPSAnJztcbiAgICAgICAgICAgIGlmIChjb250YWluZXJEYXRhLnR5cGUgPT09ICdpbWFnZScpIHtcbiAgICAgICAgICAgICAgICBpbWFnZVBhcmFtID0gJyZwW2ltYWdlc11bMF09JyArIGVuY29kZVVSSShyZWFjdGlvbkRhdGEuY29udGVudC5ib2R5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiAnaHR0cDovL3d3dy5mYWNlYm9vay5jb20vc2hhcmVyLnBocD9zPTEwMCcgK1xuICAgICAgICAgICAgICAgICcmcFt1cmxdPScgKyBzaG9ydFVybCArXG4gICAgICAgICAgICAgICAgJyZwW3RpdGxlXT0nICsgZW5jb2RlVVJJKHNoYXJlVGV4dCkgK1xuICAgICAgICAgICAgICAgICcmcFtzdW1tYXJ5XT0nICsgZW5jb2RlVVJJKHNoYXJlVGV4dCkgK1xuICAgICAgICAgICAgICAgIGltYWdlUGFyYW07XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNoYXJlVG9Ud2l0dGVyKHJhY3RpdmVFdmVudCkge1xuICAgICAgICByYWN0aXZlRXZlbnQub3JpZ2luYWwucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgc2hhcmVSZWFjdGlvbihmdW5jdGlvbihyZWFjdGlvbkRhdGEsIHNob3J0VXJsKSB7XG4gICAgICAgICAgICBFdmVudHMucG9zdFJlYWN0aW9uU2hhcmVkKCd0d2l0dGVyJywgcGFnZURhdGEsIGNvbnRhaW5lckRhdGEsIHJlYWN0aW9uRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICB2YXIgc2hhcmVUZXh0ID0gY29tcHV0ZVNoYXJlVGV4dChyZWFjdGlvbkRhdGEsIDExMCk7IC8vIE1ha2Ugc3VyZSB3ZSBzdGF5IHVuZGVyIHRoZSAxNDAgY2hhciBsaW1pdCAodHdpdHRlciBhcHBlbmRzIGFkZGl0aW9uYWwgdGV4dCBsaWtlIHRoZSB1cmwpXG4gICAgICAgICAgICB2YXIgdHdpdHRlclZpYSA9IGdyb3VwU2V0dGluZ3MudHdpdHRlckFjY291bnQoKSA/ICcmdmlhPScgKyBncm91cFNldHRpbmdzLnR3aXR0ZXJBY2NvdW50KCkgOiAnJztcbiAgICAgICAgICAgIHJldHVybiAnaHR0cDovL3R3aXR0ZXIuY29tL2ludGVudC90d2VldD91cmw9JyArIHNob3J0VXJsICsgdHdpdHRlclZpYSArICcmdGV4dD0nICsgZW5jb2RlVVJJKHNoYXJlVGV4dCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNoYXJlUmVhY3Rpb24oY29tcHV0ZVdpbmRvd0xvY2F0aW9uKSB7XG4gICAgICAgIGNsb3NlU2hhcmVXaW5kb3coKTtcbiAgICAgICAgcmVhY3Rpb25Qcm92aWRlci5nZXQoZnVuY3Rpb24ocmVhY3Rpb25EYXRhKSB7XG4gICAgICAgICAgICB2YXIgd2luZG93ID0gb3BlblNoYXJlV2luZG93KCk7XG4gICAgICAgICAgICBpZiAod2luZG93KSB7XG4gICAgICAgICAgICAgICAgQWpheENsaWVudC5wb3N0U2hhcmVSZWFjdGlvbihyZWFjdGlvbkRhdGEsIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzLCBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHVybCA9IGNvbXB1dGVXaW5kb3dMb2NhdGlvbihyZWFjdGlvbkRhdGEsIHJlc3BvbnNlLnNob3J0X3VybCk7XG4gICAgICAgICAgICAgICAgICAgIHJlZGlyZWN0U2hhcmVXaW5kb3codXJsKTtcbiAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAobWVzc2FnZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkZhaWxlZCB0byBzaGFyZSByZWFjdGlvbjogXCIgKyBtZXNzYWdlKTtcbiAgICAgICAgICAgICAgICAgICAgY2xvc2VTaGFyZVdpbmRvdygpO1xuICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiBlbmdhZ2VfZnVsbDo5ODE4XG4gICAgICAgICAgICAgICAgICAgIC8vaWYgKCByZXNwb25zZS5tZXNzYWdlLmluZGV4T2YoIFwiVGVtcG9yYXJ5IHVzZXIgaW50ZXJhY3Rpb24gbGltaXQgcmVhY2hlZFwiICkgIT0gLTEgKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vICAgIEFOVC5zZXNzaW9uLnNob3dMb2dpblBhbmVsKCBhcmdzICk7XG4gICAgICAgICAgICAgICAgICAgIC8vfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgLy8gaWYgaXQgZmFpbGVkLCBzZWUgaWYgd2UgY2FuIGZpeCBpdCwgYW5kIGlmIHNvLCB0cnkgdGhpcyBmdW5jdGlvbiBvbmUgbW9yZSB0aW1lXG4gICAgICAgICAgICAgICAgICAgIC8vICAgIEFOVC5zZXNzaW9uLmhhbmRsZUdldFVzZXJGYWlsKCBhcmdzLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgICAgIEFOVC5hY3Rpb25zLnNoYXJlX2dldExpbmsoIGFyZ3MgKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIC8vfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjbG9zZVNoYXJlV2luZG93KCkge1xuICAgICAgICBpZiAocG9wdXBXaW5kb3cgJiYgIXBvcHVwV2luZG93LmNsb3NlZCkge1xuICAgICAgICAgICAgcG9wdXBXaW5kb3cuY2xvc2UoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIG9wZW5TaGFyZVdpbmRvdygpIHtcbiAgICAgICAgcG9wdXBXaW5kb3cgPSB3aW5kb3cub3BlbihVUkxzLmFwcFNlcnZlclVybCgpICsgVVJMcy5zaGFyZVdpbmRvd1VybCgpLCAnYW50ZW5uYV9zaGFyZV93aW5kb3cnLCdtZW51YmFyPTEscmVzaXphYmxlPTEsd2lkdGg9NjI2LGhlaWdodD00MzYnKTtcbiAgICAgICAgcmV0dXJuIHBvcHVwV2luZG93O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJlZGlyZWN0U2hhcmVXaW5kb3codXJsKSB7XG4gICAgICAgIGlmIChwb3B1cFdpbmRvdyAmJiAhcG9wdXBXaW5kb3cuY2xvc2VkKSB7XG4gICAgICAgICAgICBwb3B1cFdpbmRvdy5sb2NhdGlvbiA9IHVybDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNvbXB1dGVTaGFyZVRleHQocmVhY3Rpb25EYXRhLCBtYXhUZXh0TGVuZ3RoKSB7XG4gICAgICAgIHZhciBzaGFyZVRleHQgPSByZWFjdGlvbkRhdGEudGV4dCArIFwiIMK7IFwiICsgJyc7XG4gICAgICAgIHZhciBncm91cE5hbWUgPSBncm91cFNldHRpbmdzLmdyb3VwTmFtZSgpO1xuICAgICAgICBzd2l0Y2ggKGNvbnRhaW5lckRhdGEudHlwZSkge1xuICAgICAgICAgICAgY2FzZSAnaW1hZ2UnOlxuICAgICAgICAgICAgICAgIHNoYXJlVGV4dCArPSAnW2EgcGljdHVyZSBvbiAnICsgZ3JvdXBOYW1lICsgJ10gQ2hlY2sgaXQgb3V0OiAnO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnbWVkaWEnOlxuICAgICAgICAgICAgICAgIHNoYXJlVGV4dCArPSAnW2EgdmlkZW8gb24gJyArIGdyb3VwTmFtZSArICddIENoZWNrIGl0IG91dDogJztcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ3BhZ2UnOlxuICAgICAgICAgICAgICAgIHNoYXJlVGV4dCArPSAnW2FuIGFydGljbGUgb24gJyArIGdyb3VwTmFtZSArICddIENoZWNrIGl0IG91dDogJztcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ3RleHQnOlxuICAgICAgICAgICAgICAgIHZhciBtYXhCb2R5TGVuZ3RoID0gbWF4VGV4dExlbmd0aCAtIHNoYXJlVGV4dC5sZW5ndGggLSAyOyAvLyB0aGUgZXh0cmEgMiBhY2NvdW50cyBmb3IgdGhlIHF1b3RlcyB3ZSBhZGRcbiAgICAgICAgICAgICAgICB2YXIgdGV4dEJvZHkgPSByZWFjdGlvbkRhdGEuY29udGVudC5ib2R5O1xuICAgICAgICAgICAgICAgIHRleHRCb2R5ID0gdGV4dEJvZHkubGVuZ3RoID4gbWF4Qm9keUxlbmd0aCA/IHRleHRCb2R5LnN1YnN0cmluZygwLCBtYXhCb2R5TGVuZ3RoLTMpICsgJy4uLicgOiB0ZXh0Qm9keTtcbiAgICAgICAgICAgICAgICBzaGFyZVRleHQgKz0gJ1wiJyArIHRleHRCb2R5ICsgJ1wiJztcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc2hhcmVUZXh0O1xuICAgIH1cblxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlOiBjcmVhdGVQYWdlXG59OyIsInZhciBBamF4Q2xpZW50ID0gcmVxdWlyZSgnLi91dGlscy9hamF4LWNsaWVudCcpO1xudmFyIFVSTHMgPSByZXF1aXJlKCcuL3V0aWxzL3VybHMnKTtcblxudmFyIGNvbnRlbnRGZXRjaFRyaWdnZXJTaXplID0gMDsgLy8gVGhlIHNpemUgb2YgdGhlIHBvb2wgYXQgd2hpY2ggd2UnbGwgcHJvYWN0aXZlbHkgZmV0Y2ggbW9yZSBjb250ZW50LlxudmFyIGZyZXNoQ29udGVudFBvb2wgPSBbXTtcbnZhciBwZW5kaW5nQ2FsbGJhY2tzID0gW107IC8vIFRoZSBjYWxsYmFjayBtb2RlbCBpbiB0aGlzIG1vZHVsZSBpcyB1bnVzdWFsIGJlY2F1c2Ugb2YgdGhlIHdheSBjb250ZW50IGlzIHNlcnZlZCBmcm9tIGEgcG9vbC5cbnZhciBwcmVmZXRjaGVkR3JvdXBzID0ge307IC8vXG5cbmZ1bmN0aW9uIHByZWZldGNoSWZOZWVkZWQoZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBncm91cElkID0gZ3JvdXBTZXR0aW5ncy5ncm91cElkKCk7XG4gICAgaWYgKCFwcmVmZXRjaGVkR3JvdXBzW2dyb3VwSWRdKSB7XG4gICAgICAgIHByZWZldGNoZWRHcm91cHNbZ3JvdXBJZF0gPSB0cnVlO1xuICAgICAgICBmZXRjaFJlY29tbWVuZGVkQ29udGVudChncm91cFNldHRpbmdzKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGdldFJlY29tbWVuZGVkQ29udGVudChjb3VudCwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MsIGNhbGxiYWNrKSB7XG4gICAgY29udGVudEZldGNoVHJpZ2dlclNpemUgPSBNYXRoLm1heChjb250ZW50RmV0Y2hUcmlnZ2VyU2l6ZSwgY291bnQpOyAvLyBVcGRhdGUgdGhlIHRyaWdnZXIgc2l6ZSB0byB0aGUgbW9zdCB3ZSd2ZSBiZWVuIGFza2VkIGZvci5cbiAgICAvLyBRdWV1ZSB1cCB0aGUgY2FsbGJhY2sgYW5kIHRyeSB0byBzZXJ2ZS4gSWYgbW9yZSBjb250ZW50IGlzIG5lZWRlZCwgaXQgd2lsbFxuICAgIC8vIGJlIGF1dG9tYXRpY2FsbHkgZmV0Y2hlZC5cbiAgICBwZW5kaW5nQ2FsbGJhY2tzLnB1c2goeyBjYWxsYmFjazogY2FsbGJhY2ssIGNvdW50OiBjb3VudCB9KTtcbiAgICBzZXJ2ZUNvbnRlbnQocGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpO1xufVxuXG5mdW5jdGlvbiBmZXRjaFJlY29tbWVuZGVkQ29udGVudChncm91cFNldHRpbmdzLCBjYWxsYmFjaykge1xuICAgIEFqYXhDbGllbnQuZ2V0SlNPTlAoVVJMcy5mZXRjaENvbnRlbnRSZWNvbW1lbmRhdGlvblVybCgpLCB7IGdyb3VwX2lkOiBncm91cFNldHRpbmdzLmdyb3VwSWQoKX0gLCBmdW5jdGlvbihqc29uRGF0YSkge1xuICAgICAgICAvLyBVcGRhdGUgdGhlIGZyZXNoIGNvbnRlbnQgcG9vbCB3aXRoIHRoZSBuZXcgZGF0YS4gQXBwZW5kIGFueSBleGlzdGluZyBjb250ZW50IHRvIHRoZSBlbmQsIHNvIGl0IGlzIHB1bGxlZCBmaXJzdC5cbiAgICAgICAgdmFyIGNvbnRlbnREYXRhID0ganNvbkRhdGEgfHwgW107XG4gICAgICAgIGNvbnRlbnREYXRhID0gbWFzc2FnZUNvbnRlbnQoY29udGVudERhdGEpO1xuICAgICAgICB2YXIgbmV3QXJyYXkgPSBzaHVmZmxlQXJyYXkoY29udGVudERhdGEpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGZyZXNoQ29udGVudFBvb2wubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIG5ld0FycmF5LnB1c2goZnJlc2hDb250ZW50UG9vbFtpXSk7XG4gICAgICAgIH1cbiAgICAgICAgZnJlc2hDb250ZW50UG9vbCA9IG5ld0FycmF5O1xuICAgICAgICBpZiAoY2FsbGJhY2spIHsgY2FsbGJhY2soZ3JvdXBTZXR0aW5ncyk7IH1cbiAgICB9LCBmdW5jdGlvbihlcnJvck1lc3NhZ2UpIHtcbiAgICAgICAgLyogVE9ETzogRXJyb3IgaGFuZGxpbmcgKi9cbiAgICAgICAgY29uc29sZS5sb2coJ0FuIGVycm9yIG9jY3VycmVkIGZldGNoaW5nIHJlY29tbWVuZGVkIGNvbnRlbnQ6ICcgKyBlcnJvck1lc3NhZ2UpO1xuICAgIH0pO1xufVxuXG4vLyBBcHBseSBhbnkgY2xpZW50LXNpZGUgZmlsdGVyaW5nL21vZGlmaWNhdGlvbnMgdG8gdGhlIGNvbnRlbnQgcmVjIGRhdGEuXG5mdW5jdGlvbiBtYXNzYWdlQ29udGVudChjb250ZW50RGF0YSkge1xuICAgIHZhciBtYXNzYWdlZENvbnRlbnQgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvbnRlbnREYXRhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBkYXRhID0gY29udGVudERhdGFbaV07XG4gICAgICAgIGlmIChkYXRhLmNvbnRlbnQudHlwZSA9PT0gJ21lZGlhJykge1xuICAgICAgICAgICAgLy8gRm9yIG5vdywgdGhlIG9ubHkgdmlkZW8gd2UgaGFuZGxlIGlzIFlvdVR1YmUsIHdoaWNoIGhhcyBhIGtub3duIGZvcm1hdFxuICAgICAgICAgICAgLy8gZm9yIGNvbnZlcnRpbmcgdmlkZW8gVVJMcyBpbnRvIGltYWdlcy5cbiAgICAgICAgICAgIHZhciB5b3V0dWJlTWF0Y2hlciA9IC9eKChodHRwfGh0dHBzKTopP1xcL1xcLyh3d3dcXC4pP3lvdXR1YmVcXC5jb20uKi87XG4gICAgICAgICAgICBpZiAoeW91dHViZU1hdGNoZXIudGVzdChkYXRhLmNvbnRlbnQuYm9keSkpIHsgLy8gSXMgdGhpcyBhIHlvdXR1YmUgVVJMPyAodGhlIElEIG1hdGNoZXIgYmVsb3cgZG9lc24ndCBndWFyYW50ZWUgdGhpcylcbiAgICAgICAgICAgICAgICAvLyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzM0NTI1NDYvamF2YXNjcmlwdC1yZWdleC1ob3ctdG8tZ2V0LXlvdXR1YmUtdmlkZW8taWQtZnJvbS11cmwvMjc3Mjg0MTcjMjc3Mjg0MTdcbiAgICAgICAgICAgICAgICB2YXIgdmlkZW9JRE1hdGNoZXIgPSAvXi4qKD86KD86eW91dHVcXC5iZVxcL3x2XFwvfHZpXFwvfHVcXC9cXHdcXC98ZW1iZWRcXC8pfCg/Oig/OndhdGNoKT9cXD92KD86aSk/PXxcXCZ2KD86aSk/PSkpKFteI1xcJlxcP10qKS4qLztcbiAgICAgICAgICAgICAgICB2YXIgbWF0Y2ggPSB2aWRlb0lETWF0Y2hlci5leGVjKGRhdGEuY29udGVudC5ib2R5KTtcbiAgICAgICAgICAgICAgICBpZiAobWF0Y2gubGVuZ3RoID09PSAyKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIENvbnZlcnQgdGhlIGNvbnRlbnQgaW50byBhbiBpbWFnZS5cbiAgICAgICAgICAgICAgICAgICAgZGF0YS5jb250ZW50LmJvZHkgPSAnaHR0cHM6Ly9pbWcueW91dHViZS5jb20vdmkvJyArIG1hdGNoWzFdICsgJy9tcWRlZmF1bHQuanBnJzsgLyogMTY6OSByYXRpbyB0aHVtYm5haWwsIHNvIHdlIGdldCBubyBibGFjayBiYXJzLiAqL1xuICAgICAgICAgICAgICAgICAgICBkYXRhLmNvbnRlbnQudHlwZSA9ICdpbWFnZSc7XG4gICAgICAgICAgICAgICAgICAgIG1hc3NhZ2VkQ29udGVudC5wdXNoKGRhdGEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG1hc3NhZ2VkQ29udGVudC5wdXNoKGRhdGEpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBtYXNzYWdlZENvbnRlbnQ7XG59XG5cbmZ1bmN0aW9uIHNlcnZlQ29udGVudChwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncywgcHJldmVudExvb3AvKm9ubHkgdXNlZCByZWN1cnNpdmVseSovKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwZW5kaW5nQ2FsbGJhY2tzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBlbnRyeSA9IHBlbmRpbmdDYWxsYmFja3NbaV07XG4gICAgICAgIHZhciBjaG9zZW5Db250ZW50ID0gW107XG4gICAgICAgIHZhciB1cmxzVG9Bdm9pZCA9IFsgcGFnZURhdGEuY2Fub25pY2FsVXJsIF07XG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgZW50cnkuY291bnQ7IGorKykge1xuICAgICAgICAgICAgdmFyIHByZWZlcnJlZFR5cGUgPSBqICUgMiA9PT0gMCA/ICdpbWFnZSc6J3RleHQnO1xuICAgICAgICAgICAgdmFyIGRhdGEgPSBjaG9vc2VDb250ZW50KHByZWZlcnJlZFR5cGUsIHVybHNUb0F2b2lkKTtcbiAgICAgICAgICAgIGlmIChkYXRhKSB7XG4gICAgICAgICAgICAgICAgY2hvc2VuQ29udGVudC5wdXNoKGRhdGEpO1xuICAgICAgICAgICAgICAgIHVybHNUb0F2b2lkLnB1c2goZGF0YS5wYWdlLnVybCk7IC8vIGRvbid0IGxpbmsgdG8gdGhlIHNhbWUgcGFnZSB0d2ljZVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChjaG9zZW5Db250ZW50Lmxlbmd0aCA+PSBlbnRyeS5jb3VudCkge1xuICAgICAgICAgICAgZW50cnkuY2FsbGJhY2soY2hvc2VuQ29udGVudCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoIXByZXZlbnRMb29wKSB7XG4gICAgICAgICAgICAgICAgLy8gUmFuIG91dCBvZiBjb250ZW50LiBHbyBnZXQgbW9yZS4gVGhlIFwicHJldmVudExvb3BcIiBmbGFnIHRlbGxzIHVzIHdoZXRoZXJcbiAgICAgICAgICAgICAgICAvLyB3ZSd2ZSBhbHJlYWR5IHRyaWVkIHRvIGZldGNoIGJ1dCB3ZSBqdXN0IGhhdmUgbm8gZ29vZCBjb250ZW50IHRvIGNob29zZS5cbiAgICAgICAgICAgICAgICBmZXRjaFJlY29tbWVuZGVkQ29udGVudChncm91cFNldHRpbmdzLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VydmVDb250ZW50KHBhZ2VEYXRhLCBncm91cFNldHRpbmdzLCB0cnVlKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuICAgIHBlbmRpbmdDYWxsYmFja3MgPSBwZW5kaW5nQ2FsbGJhY2tzLnNwbGljZShpKTsgLy8gVHJpbSBhbnkgY2FsbGJhY2tzIHRoYXQgd2Ugbm90aWZpZWQuXG59XG5cbmZ1bmN0aW9uIGNob29zZUNvbnRlbnQocHJlZmVycmVkVHlwZSwgdXJsc1RvQXZvaWQpIHtcbiAgICB2YXIgYWx0ZXJuYXRlSW5kZXg7XG4gICAgZm9yICh2YXIgaSA9IGZyZXNoQ29udGVudFBvb2wubGVuZ3RoLTE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgIHZhciBjb250ZW50RGF0YSA9IGZyZXNoQ29udGVudFBvb2xbaV07XG4gICAgICAgIGlmICghYXJyYXlDb250YWlucyh1cmxzVG9Bdm9pZCwgY29udGVudERhdGEucGFnZS51cmwpKSB7XG4gICAgICAgICAgICBpZiAoY29udGVudERhdGEuY29udGVudC50eXBlID09PSBwcmVmZXJyZWRUeXBlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZyZXNoQ29udGVudFBvb2wuc3BsaWNlKGksIDEpWzBdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYWx0ZXJuYXRlSW5kZXggPSBpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChhbHRlcm5hdGVJbmRleCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiBmcmVzaENvbnRlbnRQb29sLnNwbGljZShhbHRlcm5hdGVJbmRleCwgMSlbMF07XG4gICAgfVxufVxuXG5mdW5jdGlvbiBhcnJheUNvbnRhaW5zKGFycmF5LCBlbGVtZW50KSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcnJheS5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoYXJyYXlbaV0gPT09IGVsZW1lbnQpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbn1cblxuLy8gRHVyc3RlbmZlbGQgc2h1ZmZsZSBhbGdvcml0aG0gZnJvbTogaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMTI2NDY4NjQvNDEzNTQzMVxuZnVuY3Rpb24gc2h1ZmZsZUFycmF5KGFycmF5KSB7XG4gICAgdmFyIGNvcHkgPSBhcnJheS5zbGljZSgwKTtcbiAgICBmb3IgKHZhciBpID0gYXJyYXkubGVuZ3RoIC0gMTsgaSA+IDA7IGktLSkge1xuICAgICAgICB2YXIgaiA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIChpICsgMSkpO1xuICAgICAgICB2YXIgdGVtcCA9IGNvcHlbaV07XG4gICAgICAgIGNvcHlbaV0gPSBjb3B5W2pdO1xuICAgICAgICBjb3B5W2pdID0gdGVtcDtcbiAgICB9XG4gICAgcmV0dXJuIGNvcHk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHByZWZldGNoSWZOZWVkZWQ6IHByZWZldGNoSWZOZWVkZWQsXG4gICAgZ2V0UmVjb21tZW5kZWRDb250ZW50OiBnZXRSZWNvbW1lbmRlZENvbnRlbnRcbn07IiwidmFyIFJhY3RpdmU7IHJlcXVpcmUoJy4vdXRpbHMvcmFjdGl2ZS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihsb2FkZWRSYWN0aXZlKSB7IFJhY3RpdmUgPSBsb2FkZWRSYWN0aXZlO30pO1xudmFyIEJyb3dzZXJNZXRyaWNzID0gcmVxdWlyZSgnLi91dGlscy9icm93c2VyLW1ldHJpY3MnKTtcbnZhciBKU09OVXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzL2pzb24tdXRpbHMnKTtcbnZhciBNZXNzYWdlcyA9IHJlcXVpcmUoJy4vdXRpbHMvbWVzc2FnZXMnKTtcbnZhciBUaHJvdHRsZWRFdmVudHMgPSByZXF1aXJlKCcuL3V0aWxzL3Rocm90dGxlZC1ldmVudHMnKTtcbnZhciBVUkxzID0gcmVxdWlyZSgnLi91dGlscy91cmxzJyk7XG5cbnZhciBDb250ZW50UmVjTG9hZGVyID0gcmVxdWlyZSgnLi9jb250ZW50LXJlYy1sb2FkZXInKTtcbnZhciBFdmVudHMgPSByZXF1aXJlKCcuL2V2ZW50cycpO1xudmFyIFNWR3MgPSByZXF1aXJlKCcuL3N2Z3MnKTtcblxuZnVuY3Rpb24gY3JlYXRlQ29udGVudFJlYyhwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBjb250ZW50UmVjQ29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgY29udGVudFJlY0NvbnRhaW5lci5jbGFzc05hbWUgPSAnYW50ZW5uYSBhbnRlbm5hLWNvbnRlbnQtcmVjJztcbiAgICAvLyBXZSBjYW4ndCByZWFsbHkgcmVxdWVzdCBjb250ZW50IHVudGlsIHRoZSBmdWxsIHBhZ2UgZGF0YSBpcyBsb2FkZWQgKGJlY2F1c2Ugd2UgbmVlZCB0byBrbm93IHRoZSBzZXJ2ZXItc2lkZSBjb21wdXRlZFxuICAgIC8vIGNhbm9uaWNhbCBVUkwpLCBidXQgd2UgY2FuIHN0YXJ0IHByZWZldGNoaW5nIHRoZSBjb250ZW50IHBvb2wgZm9yIHRoZSBncm91cC5cbiAgICBDb250ZW50UmVjTG9hZGVyLnByZWZldGNoSWZOZWVkZWQoZ3JvdXBTZXR0aW5ncyk7XG4gICAgdmFyIG51bUVudHJpZXMgPSBCcm93c2VyTWV0cmljcy5pc01vYmlsZSgpID8gZ3JvdXBTZXR0aW5ncy5jb250ZW50UmVjQ291bnRNb2JpbGUoKSA6IGdyb3VwU2V0dGluZ3MuY29udGVudFJlY0NvdW50RGVza3RvcCgpO1xuICAgIHZhciBudW1FbnRyaWVzUGVyUm93ID0gQnJvd3Nlck1ldHJpY3MuaXNNb2JpbGUoKSA/IGdyb3VwU2V0dGluZ3MuY29udGVudFJlY1Jvd0NvdW50TW9iaWxlKCkgOiBncm91cFNldHRpbmdzLmNvbnRlbnRSZWNSb3dDb3VudERlc2t0b3AoKTtcbiAgICB2YXIgZW50cnlXaWR0aCA9IE1hdGguZmxvb3IoMTAwL251bUVudHJpZXNQZXJSb3cpICsgJyUnO1xuICAgIHZhciBjb250ZW50RGF0YSA9IHsgZW50cmllczogdW5kZWZpbmVkIH07IC8vIE5lZWQgdG8gc3R1YiBvdXQgdGhlIGRhdGEgc28gUmFjdGl2ZSBjYW4gYmluZCB0byBpdFxuICAgIHZhciByYWN0aXZlID0gUmFjdGl2ZSh7XG4gICAgICAgIGVsOiBjb250ZW50UmVjQ29udGFpbmVyLFxuICAgICAgICBtYWdpYzogdHJ1ZSxcbiAgICAgICAgYXBwZW5kOiB0cnVlLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICB0aXRsZTogZ3JvdXBTZXR0aW5ncy5jb250ZW50UmVjVGl0bGUoKSB8fCBNZXNzYWdlcy5nZXRNZXNzYWdlKCdjb250ZW50X3JlY193aWRnZXRfX3RpdGxlJyksXG4gICAgICAgICAgICBwYWdlRGF0YTogcGFnZURhdGEsXG4gICAgICAgICAgICBjb250ZW50RGF0YTogY29udGVudERhdGEsXG4gICAgICAgICAgICBwb3B1bGF0ZUNvbnRlbnRFbnRyaWVzOiBwb3B1bGF0ZUNvbnRlbnRFbnRyaWVzKG51bUVudHJpZXMsIGNvbnRlbnREYXRhLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyksXG4gICAgICAgICAgICBjb2xvcnM6IHBpY2tDb2xvcnMobnVtRW50cmllcywgZ3JvdXBTZXR0aW5ncyksXG4gICAgICAgICAgICBpc01vYmlsZTogQnJvd3Nlck1ldHJpY3MuaXNNb2JpbGUoKSxcbiAgICAgICAgICAgIGVudHJ5V2lkdGg6IGVudHJ5V2lkdGgsXG4gICAgICAgICAgICBjb21wdXRlRW50cnlVcmw6IGNvbXB1dGVFbnRyeVVybFxuICAgICAgICB9LFxuICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL2NvbnRlbnQtcmVjLXdpZGdldC5oYnMuaHRtbCcpLFxuICAgICAgICBwYXJ0aWFsczoge1xuICAgICAgICAgICAgbG9nbzogU1ZHcy5sb2dvXG4gICAgICAgIH0sXG4gICAgICAgIGRlY29yYXRvcnM6IHtcbiAgICAgICAgICAgIHJlbmRlclRleHQ6IHJlbmRlclRleHRcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHNldHVwVmlzaWJpbGl0eUhhbmRsZXIoKTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIGVsZW1lbnQ6IGNvbnRlbnRSZWNDb250YWluZXIsXG4gICAgICAgIHRlYXJkb3duOiBmdW5jdGlvbigpIHsgcmFjdGl2ZS50ZWFyZG93bigpOyB9XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIGNvbXB1dGVFbnRyeVVybChjb250ZW50RW50cnkpIHtcbiAgICAgICAgdmFyIHRhcmdldFVybCA9IGNvbnRlbnRFbnRyeS5wYWdlLnVybDtcbiAgICAgICAgdmFyIGNvbnRlbnRJZCA9IGNvbnRlbnRFbnRyeS5jb250ZW50LmlkO1xuICAgICAgICB2YXIgZXZlbnQgPSBFdmVudHMuY3JlYXRlQ29udGVudFJlY0NsaWNrZWRFdmVudChwYWdlRGF0YSwgdGFyZ2V0VXJsLCBjb250ZW50SWQsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICByZXR1cm4gVVJMcy5jb21wdXRlQ29udGVudFJlY1VybCh0YXJnZXRVcmwsIGV2ZW50KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzZXR1cFZpc2liaWxpdHlIYW5kbGVyKCkge1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy8gV2hlbiBjb250ZW50IHJlYyBsb2FkcywgZ2l2ZSBpdCBhIG1vbWVudCBhbmQgdGhlbiBzZWUgaWYgd2UncmVcbiAgICAgICAgICAgIC8vIHZpc2libGUuIElmIG5vdCwgc3RhcnQgdHJhY2tpbmcgc2Nyb2xsIGV2ZW50cy5cbiAgICAgICAgICAgIGlmIChpc0NvbnRlbnRSZWNWaXNpYmxlKCkpIHtcbiAgICAgICAgICAgICAgICBFdmVudHMucG9zdENvbnRlbnRSZWNWaXNpYmxlKHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgVGhyb3R0bGVkRXZlbnRzLm9uKCdzY3JvbGwnLCBoYW5kbGVTY3JvbGxFdmVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIDIwMCk7XG5cbiAgICAgICAgZnVuY3Rpb24gaGFuZGxlU2Nyb2xsRXZlbnQoKSB7XG4gICAgICAgICAgICBpZiAoaXNDb250ZW50UmVjVmlzaWJsZSgpKSB7XG4gICAgICAgICAgICAgICAgRXZlbnRzLnBvc3RDb250ZW50UmVjVmlzaWJsZShwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICAgICAgVGhyb3R0bGVkRXZlbnRzLm9mZignc2Nyb2xsJywgaGFuZGxlU2Nyb2xsRXZlbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNDb250ZW50UmVjVmlzaWJsZSgpIHtcbiAgICAgICAgLy8gQmVjYXVzZSB0aGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCBvbiBzY3JvbGwsIHdlIHRyeSB0byBhdm9pZCB1bm5lY2Vzc2FyeVxuICAgICAgICAvLyBjb21wdXRhdGlvbiBhcyBtdWNoIGFzIHBvc3NpYmxlIGhlcmUsIGJhaWxpbmcgb3V0IGFzIGVhcmx5IGFzIHBvc3NpYmxlLlxuICAgICAgICAvLyBGaXJzdCwgY2hlY2sgd2hldGhlciB3ZSBldmVuIGhhdmUgcGFnZSBkYXRhLlxuICAgICAgICBpZiAocGFnZURhdGEuc3VtbWFyeUxvYWRlZCkge1xuICAgICAgICAgICAgLy8gVGhlbiBjaGVjayBpZiB0aGUgb3V0ZXIgY29udGVudCByZWMgaXMgaW4gdGhlIHZpZXdwb3J0IGF0IGFsbC5cbiAgICAgICAgICAgIHZhciBjb250ZW50Qm94ID0gY29udGVudFJlY0NvbnRhaW5lci5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgICAgIHZhciB2aWV3cG9ydEJvdHRvbSA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRIZWlnaHQ7XG4gICAgICAgICAgICBpZiAoY29udGVudEJveC50b3AgPiAwICYmIGNvbnRlbnRCb3gudG9wIDwgdmlld3BvcnRCb3R0b20gfHxcbiAgICAgICAgICAgICAgICBjb250ZW50Qm94LmJvdHRvbSA+IDAgJiYgY29udGVudEJveC5ib3R0b20gPCB2aWV3cG9ydEJvdHRvbSkge1xuICAgICAgICAgICAgICAgIC8vIEZpbmFsbHksIGxvb2sgdG8gc2VlIHdoZXRoZXIgYW55IHJlY29tbWVuZGVkIGNvbnRlbnQgaGFzIGJlZW5cbiAgICAgICAgICAgICAgICAvLyByZW5kZXJlZCBvbnRvIHRoZSBwYWdlIGFuZCBpcyBvbiBzY3JlZW4gZW5vdWdoIHRvIGJlIGNvbnNpZGVyZWRcbiAgICAgICAgICAgICAgICAvLyB2aXNpYmxlLlxuICAgICAgICAgICAgICAgIHZhciBlbnRyaWVzID0gcmFjdGl2ZS5maW5kQWxsKCcuYW50ZW5uYS1jb250ZW50cmVjLWVudHJ5Jyk7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBlbnRyaWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBlbnRyeSA9IGVudHJpZXNbaV07XG4gICAgICAgICAgICAgICAgICAgIHZhciBlbnRyeUJveCA9IGVudHJ5LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZW50cnlCb3gudG9wID4gMCAmJiBlbnRyeUJveC5ib3R0b20gPCB2aWV3cG9ydEJvdHRvbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVGhlIGVudHJ5IGlzIGZ1bGx5IHZpc2libGVcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG59XG5cbi8vIFRoaXMgZnVuY3Rpb24gaXMgdHJpZ2dlcmVkIGZyb20gd2l0aGluIHRoZSBSYWN0aXZlIHRlbXBsYXRlIHdoZW4gdGhlIHBhZ2UgZGF0YSBpcyBsb2FkZWQuIE9uY2UgcGFnZSBkYXRhIGlzIGxvYWRlZCxcbi8vIHdlJ3JlIHJlYWR5IHRvIGFzayBmb3IgY29udGVudC5cbmZ1bmN0aW9uIHBvcHVsYXRlQ29udGVudEVudHJpZXMobnVtRW50cmllcywgY29udGVudERhdGEsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHBhZ2VEYXRhSXNMb2FkZWQpIHtcbiAgICAgICAgaWYgKHBhZ2VEYXRhSXNMb2FkZWQgJiYgIWNvbnRlbnREYXRhLmVudHJpZXMpIHtcbiAgICAgICAgICAgIC8vIFNpbmNlIHRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkIGJ5IFJhY3RpdmUgd2hlbiBwYWdlRGF0YS5zdW1tYXJ5TG9hZGVkIGNoYW5nZXMgYW5kIGl0IGNhbiBwb3RlbnRpYWxseVxuICAgICAgICAgICAgLy8gKnRyaWdnZXIqIGEgUmFjdGl2ZSB1cGRhdGUgKGlmIGNvbnRlbnQgZGF0YSBpcyByZWFkeSB0byBiZSBzZXJ2ZWQsIHdlIG1vZGlmeSBjb250ZW50RGF0YS5lbnRyaWVzKSxcbiAgICAgICAgICAgIC8vIHdlIG5lZWQgdG8gd3JhcCBpbiBhIHRpbWVvdXQgc28gdGhhdCB0aGUgZmlyc3QgUmFjdGl2ZSB1cGRhdGUgY2FuIGNvbXBsZXRlIGJlZm9yZSB3ZSB0cmlnZ2VyIGFub3RoZXIuXG4gICAgICAgICAgICAvLyBPdGhlcndpc2UsIFJhY3RpdmUgYmFpbHMgb3V0IGJlY2F1c2UgaXQgdGhpbmtzIHdlJ3JlIHRyaWdnZXJpbmcgYW4gaW5maW5pdGUgdXBkYXRlIGxvb3AuXG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIENvbnRlbnRSZWNMb2FkZXIuZ2V0UmVjb21tZW5kZWRDb250ZW50KG51bUVudHJpZXMsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzLCBmdW5jdGlvbiAoZmV0Y2hlZENvbnRlbnRFbnRyaWVzKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnREYXRhLmVudHJpZXMgPSBmZXRjaGVkQ29udGVudEVudHJpZXM7XG4gICAgICAgICAgICAgICAgICAgIEV2ZW50cy5wb3N0Q29udGVudFJlY0xvYWRlZChwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcGFnZURhdGFJc0xvYWRlZDtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHJlbmRlclRleHQobm9kZSkge1xuICAgIHZhciB0ZXh0ID0gY3JvcElmTmVlZGVkKG5vZGUpO1xuICAgIGlmICh0ZXh0Lmxlbmd0aCAhPT0gbm9kZS5pbm5lckhUTUwubGVuZ3RoKSB7XG4gICAgICAgIHRleHQgKz0gJy4uLic7XG4gICAgfVxuICAgIHRleHQgPSBhcHBseUJvbGRpbmcodGV4dCk7XG4gICAgaWYgKHRleHQubGVuZ3RoICE9PSBub2RlLmlubmVySFRNTC5sZW5ndGgpIHtcbiAgICAgICAgbm9kZS5pbm5lckhUTUwgPSB0ZXh0O1xuICAgICAgICAvLyBDaGVjayBhZ2FpbiwganVzdCB0byBtYWtlIHN1cmUgdGhlIHRleHQgZml0cyBhZnRlciBib2xkaW5nLlxuICAgICAgICB0ZXh0ID0gY3JvcElmTmVlZGVkKG5vZGUpO1xuICAgICAgICBpZiAodGV4dC5sZW5ndGggIT09IG5vZGUuaW5uZXJIVE1MLmxlbmd0aCkgeyAvL1xuICAgICAgICAgICAgbm9kZS5pbm5lckhUTUwgPSB0ZXh0ICsgJy4uLic7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4geyB0ZWFyZG93bjogZnVuY3Rpb24oKSB7fSB9O1xuXG4gICAgZnVuY3Rpb24gY3JvcElmTmVlZGVkKG5vZGUpIHtcbiAgICAgICAgdmFyIHRleHQgPSBub2RlLmlubmVySFRNTDtcbiAgICAgICAgdmFyIHJhdGlvID0gbm9kZS5jbGllbnRIZWlnaHQgLyBub2RlLnNjcm9sbEhlaWdodDtcbiAgICAgICAgaWYgKHJhdGlvIDwgMSkgeyAvLyBJZiB0aGUgdGV4dCBpcyBsYXJnZXIgdGhhbiB0aGUgY2xpZW50IGFyZWEsIGNyb3AgdGhlIHRleHQuXG4gICAgICAgICAgICB2YXIgY3JvcFdvcmRCcmVhayA9IHRleHQubGFzdEluZGV4T2YoJyAnLCB0ZXh0Lmxlbmd0aCAqIHJhdGlvIC0gMyk7IC8vIGFjY291bnQgZm9yIHRoZSAnLi4uJyB0aGF0IHdlJ2xsIGFkZFxuICAgICAgICAgICAgdGV4dCA9IHRleHQuc3Vic3RyaW5nKDAsIGNyb3BXb3JkQnJlYWspO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0ZXh0O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGFwcGx5Qm9sZGluZyh0ZXh0KSB7XG4gICAgICAgIHZhciBib2xkU3RhcnRQb2ludCA9IE1hdGguZmxvb3IodGV4dC5sZW5ndGggKiAuMjUpO1xuICAgICAgICB2YXIgYm9sZEVuZFBvaW50ID0gTWF0aC5mbG9vcih0ZXh0Lmxlbmd0aCAqLjgpO1xuICAgICAgICB2YXIgbWF0Y2hlcyA9IHRleHQuc3Vic3RyaW5nKGJvbGRTdGFydFBvaW50LCBib2xkRW5kUG9pbnQpLm1hdGNoKC8sfFxcLnxcXD98XCIvZ2kpO1xuICAgICAgICBpZiAobWF0Y2hlcykge1xuICAgICAgICAgICAgdmFyIGJvbGRQb2ludCA9IHRleHQubGFzdEluZGV4T2YobWF0Y2hlc1ttYXRjaGVzLmxlbmd0aCAtIDFdLCBib2xkRW5kUG9pbnQpICsgMTtcbiAgICAgICAgICAgIHRleHQgPSAnPHN0cm9uZz4nICsgdGV4dC5zdWJzdHJpbmcoMCwgYm9sZFBvaW50KSArICc8L3N0cm9uZz4nICsgdGV4dC5zdWJzdHJpbmcoYm9sZFBvaW50KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGV4dDtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHBpY2tDb2xvcnMoY291bnQsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgY29sb3JQYWxsZXRlID0gW107XG4gICAgdmFyIGNvbG9yRGF0YSA9IGdyb3VwU2V0dGluZ3MuY29udGVudFJlY0NvbG9ycygpO1xuICAgIGlmIChjb2xvckRhdGEpIHtcbiAgICAgICAgdmFyIGNvbG9yUGFpcnMgPSBjb2xvckRhdGEuc3BsaXQoJzsnKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb2xvclBhaXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgY29sb3JzID0gY29sb3JQYWlyc1tpXS5zcGxpdCgnLycpO1xuICAgICAgICAgICAgaWYgKGNvbG9ycy5sZW5ndGggPT09IDIpIHtcbiAgICAgICAgICAgICAgICBjb2xvclBhbGxldGUucHVzaCh7IGJhY2tncm91bmQ6IGNvbG9yc1swXSwgZm9yZWdyb3VuZDogY29sb3JzWzFdIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChjb2xvclBhbGxldGUubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIGNvbG9yUGFsbGV0ZS5wdXNoKHsgYmFja2dyb3VuZDogJyMwMDAwMDAnLCBmb3JlZ3JvdW5kOiAnI0ZGRkZGRicgfSk7XG4gICAgfVxuICAgIGlmIChjb3VudCA8IGNvbG9yUGFsbGV0ZS5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIHNodWZmbGVBcnJheShjb2xvclBhbGxldGUpLnNsaWNlKDAsIGNvdW50KTtcbiAgICB9IGVsc2UgeyAvLyBJZiB3ZSdyZSBhc2tpbmcgZm9yIG1vcmUgY29sb3JzIHRoYW4gd2UgaGF2ZSwganVzdCByZXBlYXQgdGhlIHNhbWUgY29sb3JzIGFzIG5lY2Vzc2FyeS5cbiAgICAgICAgdmFyIG91dHB1dCA9IFtdO1xuICAgICAgICB2YXIgY2hvc2VuSW5kZXg7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xuICAgICAgICAgICAgY2hvc2VuSW5kZXggPSByYW5kb21JbmRleChjaG9zZW5JbmRleCk7XG4gICAgICAgICAgICBvdXRwdXQucHVzaChjb2xvclBhbGxldGVbY2hvc2VuSW5kZXhdKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gb3V0cHV0O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJhbmRvbUluZGV4KGF2b2lkKSB7XG4gICAgICAgIGRvIHtcbiAgICAgICAgICAgIHZhciBwaWNrZWQgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBjb2xvclBhbGxldGUubGVuZ3RoKTtcbiAgICAgICAgfSB3aGlsZSAocGlja2VkID09PSBhdm9pZCAmJiBjb2xvclBhbGxldGUubGVuZ3RoID4gMSk7XG4gICAgICAgIHJldHVybiBwaWNrZWQ7XG4gICAgfVxufVxuXG4vLyBEdXJzdGVuZmVsZCBzaHVmZmxlIGFsZ29yaXRobSBmcm9tOiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8xMjY0Njg2NC80MTM1NDMxXG5mdW5jdGlvbiBzaHVmZmxlQXJyYXkoYXJyYXkpIHtcbiAgICB2YXIgY29weSA9IGFycmF5LnNsaWNlKDApO1xuICAgIGZvciAodmFyIGkgPSBhcnJheS5sZW5ndGggLSAxOyBpID4gMDsgaS0tKSB7XG4gICAgICAgIHZhciBqID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKGkgKyAxKSk7XG4gICAgICAgIHZhciB0ZW1wID0gY29weVtpXTtcbiAgICAgICAgY29weVtpXSA9IGNvcHlbal07XG4gICAgICAgIGNvcHlbal0gPSB0ZW1wO1xuICAgIH1cbiAgICByZXR1cm4gY29weTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlQ29udGVudFJlYzogY3JlYXRlQ29udGVudFJlY1xufTsiLCJ2YXIgQXBwTW9kZSA9IHJlcXVpcmUoJy4vdXRpbHMvYXBwLW1vZGUnKTtcbnZhciBVUkxzID0gcmVxdWlyZSgnLi91dGlscy91cmxzJyk7XG5cbmZ1bmN0aW9uIGxvYWRDc3MoKSB7XG4gICAgLy8gVG8gbWFrZSBzdXJlIG5vbmUgb2Ygb3VyIGNvbnRlbnQgcmVuZGVycyBvbiB0aGUgcGFnZSBiZWZvcmUgb3VyIENTUyBpcyBsb2FkZWQsIHdlIGFwcGVuZCBhIHNpbXBsZSBpbmxpbmUgc3R5bGVcbiAgICAvLyBlbGVtZW50IHRoYXQgdHVybnMgb2ZmIG91ciBlbGVtZW50cyAqYmVmb3JlKiBvdXIgQ1NTIGxpbmtzLiBUaGlzIGV4cGxvaXRzIHRoZSBjYXNjYWRlIHJ1bGVzIC0gb3VyIENTUyBmaWxlcyBhcHBlYXJcbiAgICAvLyBhZnRlciB0aGUgaW5saW5lIHN0eWxlIGluIHRoZSBkb2N1bWVudCwgc28gdGhleSB0YWtlIHByZWNlZGVuY2UgKGFuZCBtYWtlIGV2ZXJ5dGhpbmcgYXBwZWFyKSBvbmNlIHRoZXkncmUgbG9hZGVkLlxuICAgIGluamVjdENzcygnLmFudGVubmF7ZGlzcGxheTpub25lO30nKTtcbiAgICB2YXIgY3NzSHJlZiA9IFVSTHMuYW1hem9uUzNVcmwoKSArICcvd2lkZ2V0LW5ldy9hbnRlbm5hLmNzcz92PTInO1xuICAgIGlmIChBcHBNb2RlLm9mZmxpbmUpIHtcbiAgICAgICAgY3NzSHJlZiA9IFVSTHMuYXBwU2VydmVyVXJsKCkgKyAnL3N0YXRpYy93aWRnZXQtbmV3L2FudGVubmEuY3NzJztcbiAgICB9XG4gICAgbG9hZEZpbGUoY3NzSHJlZik7XG59XG5cbmZ1bmN0aW9uIGxvYWRGaWxlKGhyZWYpIHtcbiAgICB2YXIgbGlua1RhZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpbmsnKTtcbiAgICBsaW5rVGFnLnNldEF0dHJpYnV0ZSgnaHJlZicsIGhyZWYpO1xuICAgIGxpbmtUYWcuc2V0QXR0cmlidXRlKCdyZWwnLCAnc3R5bGVzaGVldCcpO1xuICAgIGxpbmtUYWcuc2V0QXR0cmlidXRlKCd0eXBlJywgJ3RleHQvY3NzJyk7XG4gICAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChsaW5rVGFnKTtcbn1cblxuZnVuY3Rpb24gaW5qZWN0Q3NzKGNzc1N0cmluZykge1xuICAgIHZhciBzdHlsZVRhZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XG4gICAgc3R5bGVUYWcuc2V0QXR0cmlidXRlKCd0eXBlJywgJ3RleHQvY3NzJyk7XG4gICAgc3R5bGVUYWcuaW5uZXJIVE1MID0gY3NzU3RyaW5nO1xuICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc3R5bGVUYWcpO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgbG9hZCA6IGxvYWRDc3MsXG4gICAgaW5qZWN0OiBpbmplY3RDc3Ncbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgQWpheENsaWVudCA9IHJlcXVpcmUoJy4vdXRpbHMvYWpheC1jbGllbnQnKTtcbnZhciBSYWN0aXZlOyByZXF1aXJlKCcuL3V0aWxzL3JhY3RpdmUtcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24obG9hZGVkUmFjdGl2ZSkgeyBSYWN0aXZlID0gbG9hZGVkUmFjdGl2ZTt9KTtcbnZhciBSZWFjdGlvbnNXaWRnZXRMYXlvdXRVdGlscyA9IHJlcXVpcmUoJy4vdXRpbHMvcmVhY3Rpb25zLXdpZGdldC1sYXlvdXQtdXRpbHMnKTtcblxudmFyIEV2ZW50cyA9IHJlcXVpcmUoJy4vZXZlbnRzJyk7XG52YXIgUGFnZURhdGEgPSByZXF1aXJlKCcuL3BhZ2UtZGF0YScpO1xuXG52YXIgcGFnZVNlbGVjdG9yID0gJy5hbnRlbm5hLWRlZmF1bHRzLXBhZ2UnO1xuXG5mdW5jdGlvbiBjcmVhdGVQYWdlKG9wdGlvbnMpIHtcbiAgICB2YXIgZGVmYXVsdFJlYWN0aW9ucyA9IG9wdGlvbnMuZGVmYXVsdFJlYWN0aW9ucztcbiAgICB2YXIgY29udGFpbmVyRGF0YSA9IG9wdGlvbnMuY29udGFpbmVyRGF0YTtcbiAgICB2YXIgcGFnZURhdGEgPSBvcHRpb25zLnBhZ2VEYXRhO1xuICAgIHZhciBncm91cFNldHRpbmdzID0gb3B0aW9ucy5ncm91cFNldHRpbmdzO1xuICAgIHZhciBjb250ZW50RGF0YSA9IG9wdGlvbnMuY29udGVudERhdGE7XG4gICAgdmFyIHNob3dDb25maXJtYXRpb24gPSBvcHRpb25zLnNob3dDb25maXJtYXRpb247XG4gICAgdmFyIHNob3dQZW5kaW5nQXBwcm92YWwgPSBvcHRpb25zLnNob3dQZW5kaW5nQXBwcm92YWw7XG4gICAgdmFyIHNob3dQcm9ncmVzcyA9IG9wdGlvbnMuc2hvd1Byb2dyZXNzO1xuICAgIHZhciBoYW5kbGVSZWFjdGlvbkVycm9yID0gb3B0aW9ucy5oYW5kbGVSZWFjdGlvbkVycm9yO1xuICAgIHZhciBlbGVtZW50ID0gb3B0aW9ucy5lbGVtZW50O1xuICAgIHZhciBkZWZhdWx0TGF5b3V0RGF0YSA9IFJlYWN0aW9uc1dpZGdldExheW91dFV0aWxzLmNvbXB1dGVMYXlvdXREYXRhKGRlZmF1bHRSZWFjdGlvbnMpO1xuICAgIHZhciAkcmVhY3Rpb25zV2luZG93ID0gJChvcHRpb25zLnJlYWN0aW9uc1dpbmRvdyk7XG4gICAgdmFyIHJhY3RpdmUgPSBSYWN0aXZlKHtcbiAgICAgICAgZWw6IGVsZW1lbnQsXG4gICAgICAgIGFwcGVuZDogdHJ1ZSxcbiAgICAgICAgdGVtcGxhdGU6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9kZWZhdWx0cy1wYWdlLmhicy5odG1sJyksXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIGRlZmF1bHRSZWFjdGlvbnM6IGRlZmF1bHRSZWFjdGlvbnMsXG4gICAgICAgICAgICBkZWZhdWx0TGF5b3V0Q2xhc3M6IGFycmF5QWNjZXNzb3IoZGVmYXVsdExheW91dERhdGEubGF5b3V0Q2xhc3NlcylcbiAgICAgICAgfSxcbiAgICAgICAgZGVjb3JhdG9yczoge1xuICAgICAgICAgICAgc2l6ZXRvZml0OiBSZWFjdGlvbnNXaWRnZXRMYXlvdXRVdGlscy5zaXplVG9GaXQoJHJlYWN0aW9uc1dpbmRvdylcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmFjdGl2ZS5vbignbmV3cmVhY3Rpb24nLCBuZXdEZWZhdWx0UmVhY3Rpb24pO1xuICAgIHJhY3RpdmUub24oJ25ld2N1c3RvbScsIG5ld0N1c3RvbVJlYWN0aW9uKTtcbiAgICByYWN0aXZlLm9uKCdjdXN0b21mb2N1cycsIGN1c3RvbVJlYWN0aW9uRm9jdXMpO1xuICAgIHJhY3RpdmUub24oJ2N1c3RvbWJsdXInLCBjdXN0b21SZWFjdGlvbkJsdXIpO1xuICAgIHJhY3RpdmUub24oJ3BhZ2VrZXlkb3duJywga2V5Ym9hcmRJbnB1dCk7XG4gICAgcmFjdGl2ZS5vbignaW5wdXRrZXlkb3duJywgY3VzdG9tUmVhY3Rpb25JbnB1dCk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBzZWxlY3RvcjogcGFnZVNlbGVjdG9yLFxuICAgICAgICB0ZWFyZG93bjogZnVuY3Rpb24oKSB7IHJhY3RpdmUudGVhcmRvd24oKTsgfVxuICAgIH07XG5cbiAgICBmdW5jdGlvbiBjdXN0b21SZWFjdGlvbklucHV0KHJhY3RpdmVFdmVudCkge1xuICAgICAgICB2YXIgZXZlbnQgPSByYWN0aXZlRXZlbnQub3JpZ2luYWw7XG4gICAgICAgIHZhciBrZXkgPSAoZXZlbnQud2hpY2ggIT09IHVuZGVmaW5lZCkgPyBldmVudC53aGljaCA6IGV2ZW50LmtleUNvZGU7XG4gICAgICAgIGlmIChrZXkgPT0gMTMpIHsgLy8gRW50ZXJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IC8vIGxldCB0aGUgcHJvY2Vzc2luZyBvZiB0aGUga2V5Ym9hcmQgZXZlbnQgZmluaXNoIGJlZm9yZSB3ZSBzaG93IHRoZSBwYWdlIChvdGhlcndpc2UsIHRoZSBjb25maXJtYXRpb24gcGFnZSBhbHNvIHJlY2VpdmVzIHRoZSBrZXlzdHJva2UpXG4gICAgICAgICAgICAgICAgbmV3Q3VzdG9tUmVhY3Rpb24oKTtcbiAgICAgICAgICAgIH0sIDApO1xuICAgICAgICB9IGVsc2UgaWYgKGtleSA9PSAyNykgeyAvLyBFc2NhcGVcbiAgICAgICAgICAgIGV2ZW50LnRhcmdldC52YWx1ZSA9ICcnO1xuICAgICAgICAgICAgcm9vdEVsZW1lbnQocmFjdGl2ZSkuZm9jdXMoKTtcbiAgICAgICAgfVxuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBuZXdEZWZhdWx0UmVhY3Rpb24ocmFjdGl2ZUV2ZW50KSB7XG4gICAgICAgIHZhciByZWFjdGlvbkRhdGEgPSByYWN0aXZlRXZlbnQuY29udGV4dDtcbiAgICAgICAgdmFyIHJlYWN0aW9uUHJvdmlkZXIgPSBjcmVhdGVSZWFjdGlvblByb3ZpZGVyKCk7XG4gICAgICAgIHNob3dDb25maXJtYXRpb24ocmVhY3Rpb25EYXRhLCByZWFjdGlvblByb3ZpZGVyKTsgLy8gT3B0aW1pc3RpY2FsbHkgc2hvdyBjb25maXJtYXRpb24gZm9yIGRlZmF1bHQgcmVhY3Rpb25zIGJlY2F1c2UgdGhleSBzaG91bGQgYWx3YXlzIGJlIGFjY2VwdGVkLlxuICAgICAgICBBamF4Q2xpZW50LnBvc3ROZXdSZWFjdGlvbihyZWFjdGlvbkRhdGEsIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBjb250ZW50RGF0YSwgZ3JvdXBTZXR0aW5ncywgc3VjY2VzcywgZXJyb3IpO1xuXG4gICAgICAgIGZ1bmN0aW9uIHN1Y2Nlc3MocmVhY3Rpb24pIHtcbiAgICAgICAgICAgIHJlYWN0aW9uID0gUGFnZURhdGEucmVnaXN0ZXJSZWFjdGlvbihyZWFjdGlvbiwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEpO1xuICAgICAgICAgICAgcmVhY3Rpb25Qcm92aWRlci5yZWFjdGlvbkxvYWRlZChyZWFjdGlvbik7XG4gICAgICAgICAgICBFdmVudHMucG9zdFJlYWN0aW9uQ3JlYXRlZChwYWdlRGF0YSwgY29udGFpbmVyRGF0YSwgcmVhY3Rpb24sIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZXJyb3IobWVzc2FnZSkge1xuICAgICAgICAgICAgdmFyIHJldHJ5ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgQWpheENsaWVudC5wb3N0TmV3UmVhY3Rpb24ocmVhY3Rpb25EYXRhLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgY29udGVudERhdGEsIGdyb3VwU2V0dGluZ3MsIHN1Y2Nlc3MsIGVycm9yKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBoYW5kbGVSZWFjdGlvbkVycm9yKG1lc3NhZ2UsIHJldHJ5LCBwYWdlU2VsZWN0b3IpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbmV3Q3VzdG9tUmVhY3Rpb24oKSB7XG4gICAgICAgIHZhciBpbnB1dCA9IHJhY3RpdmUuZmluZCgnLmFudGVubmEtZGVmYXVsdHMtZm9vdGVyIGlucHV0Jyk7XG4gICAgICAgIHZhciBib2R5ID0gaW5wdXQudmFsdWUudHJpbSgpO1xuICAgICAgICBpZiAoYm9keSAhPT0gJycpIHtcbiAgICAgICAgICAgIHNob3dQcm9ncmVzcygpOyAvLyBTaG93IHByb2dyZXNzIGZvciBjdXN0b20gcmVhY3Rpb25zIGJlY2F1c2UgdGhlIHNlcnZlciBtaWdodCByZWplY3QgdGhlbSBmb3IgYSBudW1iZXIgb2YgcmVhc29uc1xuICAgICAgICAgICAgdmFyIHJlYWN0aW9uRGF0YSA9IHsgdGV4dDogYm9keSB9O1xuICAgICAgICAgICAgdmFyIHJlYWN0aW9uUHJvdmlkZXIgPSBjcmVhdGVSZWFjdGlvblByb3ZpZGVyKCk7XG4gICAgICAgICAgICBpbnB1dC5ibHVyKCk7XG4gICAgICAgICAgICBBamF4Q2xpZW50LnBvc3ROZXdSZWFjdGlvbihyZWFjdGlvbkRhdGEsIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBjb250ZW50RGF0YSwgZ3JvdXBTZXR0aW5ncywgc3VjY2VzcywgZXJyb3IpO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gc3VjY2VzcyhyZWFjdGlvbikge1xuICAgICAgICAgICAgaWYgKHJlYWN0aW9uLmFwcHJvdmVkKSB7XG4gICAgICAgICAgICAgICAgc2hvd0NvbmZpcm1hdGlvbihyZWFjdGlvbkRhdGEsIHJlYWN0aW9uUHJvdmlkZXIpO1xuICAgICAgICAgICAgICAgIHJlYWN0aW9uID0gUGFnZURhdGEucmVnaXN0ZXJSZWFjdGlvbihyZWFjdGlvbiwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEpO1xuICAgICAgICAgICAgICAgIHJlYWN0aW9uUHJvdmlkZXIucmVhY3Rpb25Mb2FkZWQocmVhY3Rpb24pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBJZiB0aGUgcmVhY3Rpb24gaXNuJ3QgYXBwcm92ZWQsIGRvbid0IGFkZCBpdCB0byBvdXIgZGF0YSBtb2RlbC4gSnVzdCBzaG93IGZlZWRiYWNrIGFuZCBmaXJlIGFuIGV2ZW50LlxuICAgICAgICAgICAgICAgIHNob3dQZW5kaW5nQXBwcm92YWwocmVhY3Rpb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgRXZlbnRzLnBvc3RSZWFjdGlvbkNyZWF0ZWQocGFnZURhdGEsIGNvbnRhaW5lckRhdGEsIHJlYWN0aW9uLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGVycm9yKG1lc3NhZ2UpIHtcbiAgICAgICAgICAgIHZhciByZXRyeSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIEFqYXhDbGllbnQucG9zdE5ld1JlYWN0aW9uKHJlYWN0aW9uRGF0YSwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGNvbnRlbnREYXRhLCBncm91cFNldHRpbmdzLCBzdWNjZXNzLCBlcnJvcik7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaGFuZGxlUmVhY3Rpb25FcnJvcihtZXNzYWdlLCByZXRyeSwgcGFnZVNlbGVjdG9yKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGtleWJvYXJkSW5wdXQocmFjdGl2ZUV2ZW50KSB7XG4gICAgICAgIGlmICgkKHJvb3RFbGVtZW50KHJhY3RpdmUpKS5oYXNDbGFzcygnYW50ZW5uYS1wYWdlLWFjdGl2ZScpKSB7IC8vIG9ubHkgaGFuZGxlIGlucHV0IHdoZW4gdGhpcyBwYWdlIGlzIGFjdGl2ZVxuICAgICAgICAgICAgJChyb290RWxlbWVudChyYWN0aXZlKSkuZmluZCgnLmFudGVubmEtZGVmYXVsdHMtZm9vdGVyIGlucHV0JykuZm9jdXMoKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gcm9vdEVsZW1lbnQocmFjdGl2ZSkge1xuICAgIHJldHVybiByYWN0aXZlLmZpbmQocGFnZVNlbGVjdG9yKTtcbn1cblxuZnVuY3Rpb24gYXJyYXlBY2Nlc3NvcihhcnJheSkge1xuICAgIHJldHVybiBmdW5jdGlvbihpbmRleCkge1xuICAgICAgICByZXR1cm4gYXJyYXlbaW5kZXhdO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gY3VzdG9tUmVhY3Rpb25Gb2N1cyhyYWN0aXZlRXZlbnQpIHtcbiAgICB2YXIgJGZvb3RlciA9ICQocmFjdGl2ZUV2ZW50Lm9yaWdpbmFsLnRhcmdldCkuY2xvc2VzdCgnLmFudGVubmEtZGVmYXVsdHMtZm9vdGVyJyk7XG4gICAgJGZvb3Rlci5maW5kKCdpbnB1dCcpLm5vdCgnLmFjdGl2ZScpLnZhbCgnJykuYWRkQ2xhc3MoJ2FjdGl2ZScpO1xuICAgICRmb290ZXIuZmluZCgnYnV0dG9uJykuc2hvdygpO1xufVxuXG5mdW5jdGlvbiBjdXN0b21SZWFjdGlvbkJsdXIocmFjdGl2ZUV2ZW50KSB7XG4gICAgdmFyIGV2ZW50ID0gcmFjdGl2ZUV2ZW50Lm9yaWdpbmFsO1xuICAgIGlmICgkKGV2ZW50LnJlbGF0ZWRUYXJnZXQpLmNsb3Nlc3QoJy5hbnRlbm5hLWRlZmF1bHRzLWZvb3RlciBidXR0b24nKS5zaXplKCkgPT0gMCkgeyAvLyBEb24ndCBoaWRlIHRoZSBpbnB1dCB3aGVuIHdlIGNsaWNrIG9uIHRoZSBidXR0b25cbiAgICAgICAgdmFyICRmb290ZXIgPSAkKGV2ZW50LnRhcmdldCkuY2xvc2VzdCgnLmFudGVubmEtZGVmYXVsdHMtZm9vdGVyJyk7XG4gICAgICAgIHZhciBpbnB1dCA9ICRmb290ZXIuZmluZCgnaW5wdXQnKTtcbiAgICAgICAgaWYgKGlucHV0LnZhbCgpID09PSAnJykge1xuICAgICAgICAgICAgJGZvb3Rlci5maW5kKCdidXR0b24nKS5oaWRlKCk7XG4gICAgICAgICAgICB2YXIgJGlucHV0ID0gJGZvb3Rlci5maW5kKCdpbnB1dCcpO1xuICAgICAgICAgICAgLy8gUmVzZXQgdGhlIGlucHV0IHZhbHVlIHRvIHRoZSBkZWZhdWx0IGluIHRoZSBodG1sL3RlbXBsYXRlXG4gICAgICAgICAgICAkaW5wdXQudmFsKCRpbnB1dC5hdHRyKCd2YWx1ZScpKS5yZW1vdmVDbGFzcygnYWN0aXZlJyk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVJlYWN0aW9uUHJvdmlkZXIoKSB7XG5cbiAgICB2YXIgbG9hZGVkUmVhY3Rpb247XG4gICAgdmFyIGNhbGxiYWNrcyA9IFtdO1xuXG4gICAgZnVuY3Rpb24gb25SZWFjdGlvbihjYWxsYmFjaykge1xuICAgICAgICBjYWxsYmFja3MucHVzaChjYWxsYmFjayk7XG4gICAgICAgIG5vdGlmeUlmUmVhZHkoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByZWFjdGlvbkxvYWRlZChyZWFjdGlvbikge1xuICAgICAgICBsb2FkZWRSZWFjdGlvbiA9IHJlYWN0aW9uO1xuICAgICAgICBub3RpZnlJZlJlYWR5KCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbm90aWZ5SWZSZWFkeSgpIHtcbiAgICAgICAgaWYgKGxvYWRlZFJlYWN0aW9uKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNhbGxiYWNrcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrc1tpXShsb2FkZWRSZWFjdGlvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYWxsYmFja3MgPSBbXTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIGdldDogb25SZWFjdGlvbiwgLy8gVE9ETyB0ZXJtaW5vbG9neVxuICAgICAgICByZWFjdGlvbkxvYWRlZDogcmVhY3Rpb25Mb2FkZWRcbiAgICB9XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGU6IGNyZWF0ZVBhZ2Vcbn07IiwidmFyIEFqYXhDbGllbnQgPSByZXF1aXJlKCcuL3V0aWxzL2FqYXgtY2xpZW50Jyk7XG52YXIgQnJvd3Nlck1ldHJpY3MgPSByZXF1aXJlKCcuL3V0aWxzL2Jyb3dzZXItbWV0cmljcycpO1xudmFyIExvZ2dpbmcgPSByZXF1aXJlKCcuL3V0aWxzL2xvZ2dpbmcnKTtcbnZhciBTZWdtZW50ID0gcmVxdWlyZSgnLi91dGlscy9zZWdtZW50Jyk7XG52YXIgU2Vzc2lvbkRhdGEgPSByZXF1aXJlKCcuL3V0aWxzL3Nlc3Npb24tZGF0YScpO1xudmFyIFVzZXIgPSByZXF1aXJlKCcuL3V0aWxzL3VzZXInKTtcblxuZnVuY3Rpb24gcG9zdEdyb3VwU2V0dGluZ3NMb2FkZWQoZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBldmVudCA9IGNyZWF0ZUV2ZW50KGV2ZW50VHlwZXMuc2NyaXB0TG9hZCwgJycsIGdyb3VwU2V0dGluZ3MpO1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMucGFnZUlkXSA9ICduYSc7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5hcnRpY2xlSGVpZ2h0XSA9ICduYSc7XG4gICAgcG9zdEV2ZW50KGV2ZW50KTtcbn1cblxuZnVuY3Rpb24gcG9zdFBhZ2VEYXRhTG9hZGVkKHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGV2ZW50ID0gY3JlYXRlRXZlbnQoZXZlbnRUeXBlcy5wYWdlRGF0YUxvYWRlZCwgJycsIGdyb3VwU2V0dGluZ3MpO1xuICAgIGFwcGVuZFBhZ2VEYXRhUGFyYW1zKGV2ZW50LCBwYWdlRGF0YSk7XG4gICAgLy8gVE9ETzogcmVjb3JkaW5nIG9mIHNpbmdsZS9tdWx0aSBpcyBkaXNhYmxlZCBzbyB3ZSBjYW4gaW5zdGVhZCByZWNvcmQgQS9CL0Mgc2VnbWVudCBkYXRhXG4gICAgLy8gZXZlbnRbYXR0cmlidXRlcy5jb250ZW50QXR0cmlidXRlc10gPSBwYWdlRGF0YS5tZXRyaWNzLmlzTXVsdGlQYWdlID8gZXZlbnRWYWx1ZXMubXVsdGlwbGVQYWdlcyA6IGV2ZW50VmFsdWVzLnNpbmdsZVBhZ2U7XG4gICAgcG9zdEV2ZW50KGV2ZW50KTtcbn1cblxuZnVuY3Rpb24gcG9zdFJlYWN0aW9uV2lkZ2V0T3BlbmVkKGlzU2hvd1JlYWN0aW9ucywgcGFnZURhdGEsIGNvbnRhaW5lckRhdGEsIGNvbnRlbnREYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGV2ZW50VmFsdWUgPSBpc1Nob3dSZWFjdGlvbnMgPyBldmVudFZhbHVlcy5zaG93UmVhY3Rpb25zIDogZXZlbnRWYWx1ZXMuc2hvd0RlZmF1bHRzO1xuICAgIHZhciBldmVudCA9IGNyZWF0ZUV2ZW50KGV2ZW50VHlwZXMucmVhY3Rpb25XaWRnZXRPcGVuZWQsIGV2ZW50VmFsdWUsIGdyb3VwU2V0dGluZ3MpO1xuICAgIGFwcGVuZFBhZ2VEYXRhUGFyYW1zKGV2ZW50LCBwYWdlRGF0YSk7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5jb250YWluZXJIYXNoXSA9IGNvbnRhaW5lckRhdGEuaGFzaDtcbiAgICBldmVudFthdHRyaWJ1dGVzLmNvbnRhaW5lcktpbmRdID0gY29udGVudERhdGEudHlwZTtcbiAgICBwb3N0RXZlbnQoZXZlbnQpO1xuXG4gICAgdmFyIGN1c3RvbUV2ZW50ID0gY3JlYXRlQ3VzdG9tRXZlbnQoZW1pdEV2ZW50VHlwZXMucmVhY3Rpb25WaWV3KTtcbiAgICBlbWl0RXZlbnQoY3VzdG9tRXZlbnQpO1xufVxuXG5mdW5jdGlvbiBwb3N0U3VtbWFyeU9wZW5lZChpc1Nob3dSZWFjdGlvbnMsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGV2ZW50VmFsdWUgPSBpc1Nob3dSZWFjdGlvbnMgPyBldmVudFZhbHVlcy52aWV3UmVhY3Rpb25zIDogZXZlbnRWYWx1ZXMudmlld0RlZmF1bHRzO1xuICAgIHZhciBldmVudCA9IGNyZWF0ZUV2ZW50KGV2ZW50VHlwZXMuc3VtbWFyeVdpZGdldCwgZXZlbnRWYWx1ZSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgYXBwZW5kUGFnZURhdGFQYXJhbXMoZXZlbnQsIHBhZ2VEYXRhKTtcbiAgICBwb3N0RXZlbnQoZXZlbnQpO1xuXG4gICAgdmFyIGN1c3RvbUV2ZW50ID0gY3JlYXRlQ3VzdG9tRXZlbnQoZW1pdEV2ZW50VHlwZXMucmVhY3Rpb25WaWV3KTtcbiAgICBlbWl0RXZlbnQoY3VzdG9tRXZlbnQpO1xufVxuXG5mdW5jdGlvbiBwb3N0UmVhY3Rpb25DcmVhdGVkKHBhZ2VEYXRhLCBjb250YWluZXJEYXRhLCByZWFjdGlvbkRhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgZXZlbnQgPSBjcmVhdGVFdmVudChldmVudFR5cGVzLnJlYWN0aW9uQ3JlYXRlZCwgcmVhY3Rpb25EYXRhLnRleHQsIGdyb3VwU2V0dGluZ3MpO1xuICAgIGFwcGVuZFBhZ2VEYXRhUGFyYW1zKGV2ZW50LCBwYWdlRGF0YSk7XG4gICAgYXBwZW5kQ29udGFpbmVyRGF0YVBhcmFtcyhldmVudCwgY29udGFpbmVyRGF0YSk7XG4gICAgYXBwZW5kUmVhY3Rpb25EYXRhUGFyYW1zKGV2ZW50LCByZWFjdGlvbkRhdGEpO1xuICAgIHBvc3RFdmVudChldmVudCk7XG5cbiAgICB2YXIgZXZlbnREZXRhaWwgPSB7XG4gICAgICAgIHJlYWN0aW9uOiByZWFjdGlvbkRhdGEudGV4dCxcbiAgICAgICAgY29udGVudDogcmVhY3Rpb25EYXRhLmNvbnRlbnQuYm9keSxcbiAgICB9O1xuICAgIHN3aXRjaCAocmVhY3Rpb25EYXRhLmNvbnRlbnQua2luZCkgeyAvLyBNYXAgb3VyIGludGVybmFsIGNvbnRlbnQgdHlwZXMgdG8gYmV0dGVyIHZhbHVlcyBmb3IgY29uc3VtZXJzXG4gICAgICAgIGNhc2UgJ3R4dCc6XG4gICAgICAgICAgICBldmVudERldGFpbC5jb250ZW50VHlwZSA9ICd0ZXh0JztcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdpbWcnOlxuICAgICAgICAgICAgZXZlbnREZXRhaWwuY29udGVudFR5cGUgPSAnaW1hZ2UnO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ21lZCc6XG4gICAgICAgICAgICBldmVudERldGFpbC5jb250ZW50VHlwZSA9ICdtZWRpYSc7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIGV2ZW50RGV0YWlsLmNvbnRlbnRUeXBlID0gcmVhY3Rpb25EYXRhLmNvbnRlbnQua2luZDtcbiAgICB9XG4gICAgdmFyIGN1c3RvbUV2ZW50ID0gY3JlYXRlQ3VzdG9tRXZlbnQoZW1pdEV2ZW50VHlwZXMucmVhY3Rpb25DcmVhdGUsIGV2ZW50RGV0YWlsKTtcbiAgICBlbWl0RXZlbnQoY3VzdG9tRXZlbnQpO1xufVxuXG5mdW5jdGlvbiBwb3N0UmVhY3Rpb25TaGFyZWQodGFyZ2V0LCBwYWdlRGF0YSwgY29udGFpbmVyRGF0YSwgcmVhY3Rpb25EYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGV2ZW50VmFsdWUgPSB0YXJnZXQ7IC8vICdmYWNlYm9vaycsICd0d2l0dGVyJywgZXRjXG4gICAgdmFyIGV2ZW50ID0gY3JlYXRlRXZlbnQoZXZlbnRUeXBlcy5yZWFjdGlvblNoYXJlZCwgZXZlbnRWYWx1ZSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgYXBwZW5kUGFnZURhdGFQYXJhbXMoZXZlbnQsIHBhZ2VEYXRhKTtcbiAgICBhcHBlbmRDb250YWluZXJEYXRhUGFyYW1zKGV2ZW50LCBjb250YWluZXJEYXRhKTtcbiAgICBhcHBlbmRSZWFjdGlvbkRhdGFQYXJhbXMoZXZlbnQsIHJlYWN0aW9uRGF0YSk7XG4gICAgcG9zdEV2ZW50KGV2ZW50KTtcblxuICAgIHZhciBjdXN0b21FdmVudCA9IGNyZWF0ZUN1c3RvbUV2ZW50KGVtaXRFdmVudFR5cGVzLnJlYWN0aW9uU2hhcmUpO1xuICAgIGVtaXRFdmVudChjdXN0b21FdmVudCk7XG59XG5cbmZ1bmN0aW9uIHBvc3RMb2NhdGlvbnNWaWV3ZWQocGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgZXZlbnQgPSBjcmVhdGVFdmVudChldmVudFR5cGVzLnN1bW1hcnlXaWRnZXQsIGV2ZW50VmFsdWVzLmxvY2F0aW9uc1ZpZXdlZCwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgYXBwZW5kUGFnZURhdGFQYXJhbXMoZXZlbnQsIHBhZ2VEYXRhKTtcbiAgICBwb3N0RXZlbnQoZXZlbnQpO1xuXG4gICAgdmFyIGN1c3RvbUV2ZW50ID0gY3JlYXRlQ3VzdG9tRXZlbnQoZW1pdEV2ZW50VHlwZXMuY29udGVudFdpdGhSZWFjdGlvblZpZXcpO1xuICAgIGVtaXRFdmVudChjdXN0b21FdmVudCk7XG59XG5cbmZ1bmN0aW9uIHBvc3RDb250ZW50Vmlld2VkKHBhZ2VEYXRhLCBjb250YWluZXJEYXRhLCBsb2NhdGlvbkRhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgZXZlbnQgPSBjcmVhdGVFdmVudChldmVudFR5cGVzLnN1bW1hcnlXaWRnZXQsIGV2ZW50VmFsdWVzLmNvbnRlbnRWaWV3ZWQsIGdyb3VwU2V0dGluZ3MpO1xuICAgIGFwcGVuZFBhZ2VEYXRhUGFyYW1zKGV2ZW50LCBwYWdlRGF0YSk7XG4gICAgYXBwZW5kQ29udGFpbmVyRGF0YVBhcmFtcyhldmVudCwgY29udGFpbmVyRGF0YSk7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5jb250ZW50SWRdID0gbG9jYXRpb25EYXRhLmNvbnRlbnRJZDtcbiAgICBldmVudFthdHRyaWJ1dGVzLmNvbnRlbnRMb2NhdGlvbl0gPSBsb2NhdGlvbkRhdGEubG9jYXRpb247XG4gICAgcG9zdEV2ZW50KGV2ZW50KTtcblxuICAgIHZhciBjdXN0b21FdmVudCA9IGNyZWF0ZUN1c3RvbUV2ZW50KGVtaXRFdmVudFR5cGVzLmNvbnRlbnRXaXRoUmVhY3Rpb25GaW5kKTtcbiAgICBlbWl0RXZlbnQoY3VzdG9tRXZlbnQpO1xufVxuXG5mdW5jdGlvbiBwb3N0Q29tbWVudHNWaWV3ZWQocGFnZURhdGEsIGNvbnRhaW5lckRhdGEsIHJlYWN0aW9uRGF0YSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBldmVudCA9IGNyZWF0ZUV2ZW50KGV2ZW50VHlwZXMuY29tbWVudHNWaWV3ZWQsICcnLCBncm91cFNldHRpbmdzKTtcbiAgICBhcHBlbmRQYWdlRGF0YVBhcmFtcyhldmVudCwgcGFnZURhdGEpO1xuICAgIGFwcGVuZENvbnRhaW5lckRhdGFQYXJhbXMoZXZlbnQsIGNvbnRhaW5lckRhdGEpO1xuICAgIGFwcGVuZFJlYWN0aW9uRGF0YVBhcmFtcyhldmVudCwgcmVhY3Rpb25EYXRhKTtcbiAgICBwb3N0RXZlbnQoZXZlbnQpO1xuXG4gICAgdmFyIGN1c3RvbUV2ZW50ID0gY3JlYXRlQ3VzdG9tRXZlbnQoZW1pdEV2ZW50VHlwZXMuY29tbWVudFZpZXcpO1xuICAgIGVtaXRFdmVudChjdXN0b21FdmVudCk7XG59XG5cbmZ1bmN0aW9uIHBvc3RDb21tZW50Q3JlYXRlZChwYWdlRGF0YSwgY29udGFpbmVyRGF0YSwgcmVhY3Rpb25EYXRhLCBjb21tZW50LCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGV2ZW50ID0gY3JlYXRlRXZlbnQoZXZlbnRUeXBlcy5jb21tZW50Q3JlYXRlZCwgY29tbWVudCwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgYXBwZW5kUGFnZURhdGFQYXJhbXMoZXZlbnQsIHBhZ2VEYXRhKTtcbiAgICBhcHBlbmRDb250YWluZXJEYXRhUGFyYW1zKGV2ZW50LCBjb250YWluZXJEYXRhKTtcbiAgICBhcHBlbmRSZWFjdGlvbkRhdGFQYXJhbXMoZXZlbnQsIHJlYWN0aW9uRGF0YSk7XG4gICAgcG9zdEV2ZW50KGV2ZW50KTtcblxuICAgIHZhciBjdXN0b21FdmVudCA9IGNyZWF0ZUN1c3RvbUV2ZW50KGVtaXRFdmVudFR5cGVzLmNvbW1lbnRDcmVhdGUpO1xuICAgIGVtaXRFdmVudChjdXN0b21FdmVudCk7XG59XG5cbmZ1bmN0aW9uIHBvc3RMZWdhY3lSZWNpcmNDbGlja2VkKHBhZ2VEYXRhLCByZWFjdGlvbklkLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGV2ZW50ID0gY3JlYXRlRXZlbnQoZXZlbnRUeXBlcy5yZWNpcmNDbGlja2VkLCByZWFjdGlvbklkLCBncm91cFNldHRpbmdzKTtcbiAgICBhcHBlbmRQYWdlRGF0YVBhcmFtcyhldmVudCwgcGFnZURhdGEpO1xuICAgIHBvc3RFdmVudChldmVudCk7XG59XG5cbmZ1bmN0aW9uIHBvc3RDb250ZW50UmVjTG9hZGVkKHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGV2ZW50ID0gY3JlYXRlRXZlbnQoZXZlbnRUeXBlcy5jb250ZW50UmVjTG9hZGVkLCAnJywgZ3JvdXBTZXR0aW5ncyk7XG4gICAgYXBwZW5kUGFnZURhdGFQYXJhbXMoZXZlbnQsIHBhZ2VEYXRhKTtcbiAgICBwb3N0RXZlbnQoZXZlbnQpO1xufVxuXG5mdW5jdGlvbiBwb3N0Q29udGVudFJlY1Zpc2libGUocGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgZXZlbnQgPSBjcmVhdGVFdmVudChldmVudFR5cGVzLmNvbnRlbnRSZWNWaXNpYmxlLCAnJywgZ3JvdXBTZXR0aW5ncyk7XG4gICAgYXBwZW5kUGFnZURhdGFQYXJhbXMoZXZlbnQsIHBhZ2VEYXRhKTtcbiAgICBwb3N0RXZlbnQoZXZlbnQpO1xufVxuXG5mdW5jdGlvbiBwb3N0Q29udGVudFJlY0NsaWNrZWQocGFnZURhdGEsIHRhcmdldFVybCwgY29udGVudElkLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGV2ZW50ID0gY3JlYXRlRXZlbnQoZXZlbnRUeXBlcy5jb250ZW50UmVjQ2xpY2tlZCwgdGFyZ2V0VXJsLCBncm91cFNldHRpbmdzKTtcbiAgICBldmVudFthdHRyaWJ1dGVzLmNvbnRlbnRJZF0gPSBjb250ZW50SWQ7XG4gICAgYXBwZW5kUGFnZURhdGFQYXJhbXMoZXZlbnQsIHBhZ2VEYXRhKTtcbiAgICBwb3N0RXZlbnQoZXZlbnQsIHRydWUpO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVDb250ZW50UmVjQ2xpY2tlZEV2ZW50KHBhZ2VEYXRhLCB0YXJnZXRVcmwsIGNvbnRlbnRJZCwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBldmVudCA9IGNyZWF0ZUV2ZW50KGV2ZW50VHlwZXMuY29udGVudFJlY0NsaWNrZWQsIHRhcmdldFVybCwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5jb250ZW50SWRdID0gY29udGVudElkO1xuICAgIGFwcGVuZFBhZ2VEYXRhUGFyYW1zKGV2ZW50LCBwYWdlRGF0YSk7XG4gICAgcmV0dXJuIGV2ZW50O1xufVxuXG5mdW5jdGlvbiBwb3N0UmVhZE1vcmVMb2FkZWQocGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgZXZlbnQgPSBjcmVhdGVFdmVudChldmVudFR5cGVzLnJlYWRNb3JlTG9hZGVkLCAnJywgZ3JvdXBTZXR0aW5ncyk7XG4gICAgYXBwZW5kUGFnZURhdGFQYXJhbXMoZXZlbnQsIHBhZ2VEYXRhKTtcbiAgICBwb3N0RXZlbnQoZXZlbnQpO1xuXG4gICAgdmFyIGN1c3RvbUV2ZW50ID0gY3JlYXRlQ3VzdG9tRXZlbnQoZW1pdEV2ZW50VHlwZXMucmVhZE1vcmVMb2FkKTtcbiAgICBlbWl0RXZlbnQoY3VzdG9tRXZlbnQpO1xufVxuXG5mdW5jdGlvbiBwb3N0UmVhZE1vcmVWaXNpYmxlKHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGV2ZW50ID0gY3JlYXRlRXZlbnQoZXZlbnRUeXBlcy5yZWFkTW9yZVZpc2libGUsICcnLCBncm91cFNldHRpbmdzKTtcbiAgICBhcHBlbmRQYWdlRGF0YVBhcmFtcyhldmVudCwgcGFnZURhdGEpO1xuICAgIHBvc3RFdmVudChldmVudCk7XG5cbiAgICB2YXIgY3VzdG9tRXZlbnQgPSBjcmVhdGVDdXN0b21FdmVudChlbWl0RXZlbnRUeXBlcy5yZWFkTW9yZVZpZXcpO1xuICAgIGVtaXRFdmVudChjdXN0b21FdmVudCk7XG59XG5cbmZ1bmN0aW9uIHBvc3RSZWFkTW9yZUNsaWNrZWQocGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgZXZlbnQgPSBjcmVhdGVFdmVudChldmVudFR5cGVzLnJlYWRNb3JlQ2xpY2tlZCwgJycsIGdyb3VwU2V0dGluZ3MpO1xuICAgIGFwcGVuZFBhZ2VEYXRhUGFyYW1zKGV2ZW50LCBwYWdlRGF0YSk7XG4gICAgcG9zdEV2ZW50KGV2ZW50KTtcblxuICAgIHZhciBjdXN0b21FdmVudCA9IGNyZWF0ZUN1c3RvbUV2ZW50KGVtaXRFdmVudFR5cGVzLnJlYWRNb3JlQ2xpY2spO1xuICAgIGVtaXRFdmVudChjdXN0b21FdmVudCk7XG59XG5cbmZ1bmN0aW9uIHBvc3RGYWNlYm9va0xvZ2luU3RhcnQoZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBldmVudCA9IGNyZWF0ZUV2ZW50KGV2ZW50VHlwZXMuZmFjZWJvb2tMb2dpbkF0dGVtcHQsIGV2ZW50VmFsdWVzLnN0YXJ0LCBncm91cFNldHRpbmdzKTtcbiAgICBwb3N0RXZlbnQoZXZlbnQpO1xufVxuXG5mdW5jdGlvbiBwb3N0RmFjZWJvb2tMb2dpbkZhaWwoZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBldmVudCA9IGNyZWF0ZUV2ZW50KGV2ZW50VHlwZXMuZmFjZWJvb2tMb2dpbkF0dGVtcHQsIGV2ZW50VmFsdWVzLmZhaWwsIGdyb3VwU2V0dGluZ3MpO1xuICAgIHBvc3RFdmVudChldmVudCk7XG59XG5cbmZ1bmN0aW9uIHBvc3RBbnRlbm5hTG9naW5TdGFydChncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGV2ZW50ID0gY3JlYXRlRXZlbnQoZXZlbnRUeXBlcy5hbnRlbm5hTG9naW5BdHRlbXB0LCBldmVudFZhbHVlcy5zdGFydCwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgcG9zdEV2ZW50KGV2ZW50KTtcbn1cblxuZnVuY3Rpb24gcG9zdEFudGVubmFMb2dpbkZhaWwoZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBldmVudCA9IGNyZWF0ZUV2ZW50KGV2ZW50VHlwZXMuYW50ZW5uYUxvZ2luQXR0ZW1wdCwgZXZlbnRWYWx1ZXMuZmFpbCwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgcG9zdEV2ZW50KGV2ZW50KTtcbn1cblxuZnVuY3Rpb24gYXBwZW5kUGFnZURhdGFQYXJhbXMoZXZlbnQsIHBhZ2VEYXRhKSB7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5wYWdlSWRdID0gcGFnZURhdGEucGFnZUlkO1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMucGFnZVRpdGxlXSA9IHBhZ2VEYXRhLnRpdGxlO1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMuY2Fub25pY2FsVXJsXSA9IHBhZ2VEYXRhLmNhbm9uaWNhbFVybDtcbiAgICBldmVudFthdHRyaWJ1dGVzLnBhZ2VVcmxdID0gcGFnZURhdGEucmVxdWVzdGVkVXJsO1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMuYXJ0aWNsZUhlaWdodF0gPSAwIHx8IHBhZ2VEYXRhLm1ldHJpY3MuaGVpZ2h0O1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMucGFnZVRvcGljc10gPSBwYWdlRGF0YS50b3BpY3M7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5hdXRob3JdID0gcGFnZURhdGEuYXV0aG9yO1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMuc2l0ZVNlY3Rpb25dID0gcGFnZURhdGEuc2VjdGlvbjtcbn1cblxuZnVuY3Rpb24gYXBwZW5kQ29udGFpbmVyRGF0YVBhcmFtcyhldmVudCwgY29udGFpbmVyRGF0YSkge1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMuY29udGFpbmVySGFzaF0gPSBjb250YWluZXJEYXRhLmhhc2g7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5jb250YWluZXJLaW5kXSA9IGNvbnRhaW5lckRhdGEudHlwZTtcbn1cblxuZnVuY3Rpb24gYXBwZW5kUmVhY3Rpb25EYXRhUGFyYW1zKGV2ZW50LCByZWFjdGlvbkRhdGEpIHtcbiAgICBldmVudFthdHRyaWJ1dGVzLnJlYWN0aW9uQm9keV0gPSByZWFjdGlvbkRhdGEudGV4dDtcbiAgICBpZiAocmVhY3Rpb25EYXRhLmNvbnRlbnQpIHtcbiAgICAgICAgZXZlbnRbYXR0cmlidXRlcy5jb250ZW50TG9jYXRpb25dID0gcmVhY3Rpb25EYXRhLmNvbnRlbnQubG9jYXRpb247XG4gICAgICAgIGV2ZW50W2F0dHJpYnV0ZXMuY29udGVudElkXSA9IHJlYWN0aW9uRGF0YS5jb250ZW50LmlkO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gY3JlYXRlRXZlbnQoZXZlbnRUeXBlLCBldmVudFZhbHVlLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIHJlZmVycmVyRG9tYWluID0gZG9jdW1lbnQucmVmZXJyZXIuc3BsaXQoJy8nKS5zcGxpY2UoMikuam9pbignLycpOyAvLyBUT0RPOiBlbmdhZ2VfZnVsbCBjb2RlLiBSZXZpZXdcblxuICAgIHZhciBldmVudCA9IHt9O1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMuZXZlbnRUeXBlXSA9IGV2ZW50VHlwZTtcbiAgICBldmVudFthdHRyaWJ1dGVzLmV2ZW50VmFsdWVdID0gZXZlbnRWYWx1ZTtcbiAgICBldmVudFthdHRyaWJ1dGVzLmdyb3VwSWRdID0gZ3JvdXBTZXR0aW5ncy5ncm91cElkKCk7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5zaG9ydFRlcm1TZXNzaW9uXSA9IFNlc3Npb25EYXRhLmdldFNob3J0VGVybVNlc3Npb24oKTtcbiAgICBldmVudFthdHRyaWJ1dGVzLmxvbmdUZXJtU2Vzc2lvbl0gPSBTZXNzaW9uRGF0YS5nZXRMb25nVGVybVNlc3Npb24oKTtcbiAgICBldmVudFthdHRyaWJ1dGVzLnJlZmVycmVyVXJsXSA9IHJlZmVycmVyRG9tYWluO1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMuaXNUb3VjaEJyb3dzZXJdID0gQnJvd3Nlck1ldHJpY3Muc3VwcG9ydHNUb3VjaCgpO1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMuc2NyZWVuV2lkdGhdID0gc2NyZWVuLndpZHRoO1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMuc2NyZWVuSGVpZ2h0XSA9IHNjcmVlbi5oZWlnaHQ7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5waXhlbERlbnNpdHldID0gd2luZG93LmRldmljZVBpeGVsUmF0aW8gfHwgTWF0aC5yb3VuZCh3aW5kb3cuc2NyZWVuLmF2YWlsV2lkdGggLyBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50V2lkdGgpOyAvLyBUT0RPOiByZXZpZXcgdGhpcyBlbmdhZ2VfZnVsbCBjb2RlLCB3aGljaCBkb2Vzbid0IHNlZW0gY29ycmVjdFxuICAgIGV2ZW50W2F0dHJpYnV0ZXMudXNlckFnZW50XSA9IG5hdmlnYXRvci51c2VyQWdlbnQ7XG4gICAgdmFyIHNlZ21lbnQgPSBTZWdtZW50LmdldFNlZ21lbnQoZ3JvdXBTZXR0aW5ncyk7XG4gICAgaWYgKHNlZ21lbnQpIHtcbiAgICAgICAgZXZlbnRbYXR0cmlidXRlcy5jb250ZW50QXR0cmlidXRlc10gPSBzZWdtZW50O1xuICAgIH1cbiAgICByZXR1cm4gZXZlbnQ7XG59XG5cbmZ1bmN0aW9uIHBvc3RFdmVudChldmVudCwgc2VuZEFzVHJhY2tpbmdFdmVudCkge1xuICAgIHZhciB1c2VySW5mbyA9IFVzZXIuY2FjaGVkVXNlcigpOyAvLyBXZSBkb24ndCB3YW50IHRvIGNyZWF0ZSB1c2VycyBqdXN0IGZvciBldmVudHMgKGUuZy4gZXZlcnkgc2NyaXB0IGxvYWQpLCBidXQgYWRkIHVzZXIgaW5mbyBpZiB3ZSBoYXZlIGl0IGFscmVhZHkuXG4gICAgaWYgKHVzZXJJbmZvKSB7XG4gICAgICAgIGV2ZW50W2F0dHJpYnV0ZXMudXNlcklkXSA9IHVzZXJJbmZvLnVzZXJfaWQ7XG4gICAgfVxuICAgIGZpbGxJbk1pc3NpbmdQcm9wZXJ0aWVzKGV2ZW50KTtcbiAgICAvLyBTZW5kIHRoZSBldmVudCB0byBCaWdRdWVyeVxuICAgIGlmIChzZW5kQXNUcmFja2luZ0V2ZW50KSB7XG4gICAgICAgIEFqYXhDbGllbnQucG9zdFRyYWNraW5nRXZlbnQoZXZlbnQpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIEFqYXhDbGllbnQucG9zdEV2ZW50KGV2ZW50KTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUN1c3RvbUV2ZW50KGV2ZW50VHlwZSwgZXZlbnREZXRhaWwpIHtcbiAgICBldmVudERldGFpbCA9IGV2ZW50RGV0YWlsIHx8IHt9O1xuICAgIGV2ZW50RGV0YWlsLnVzZXJJZCA9IFNlc3Npb25EYXRhLmdldExvbmdUZXJtU2Vzc2lvbigpO1xuXG4gICAgdmFyIGN1c3RvbUV2ZW50O1xuICAgIGlmICh0eXBlb2Ygd2luZG93LkN1c3RvbUV2ZW50ID09PSBcImZ1bmN0aW9uXCIgKSB7XG4gICAgICAgIGN1c3RvbUV2ZW50ID0gbmV3IEN1c3RvbUV2ZW50KGV2ZW50VHlwZSwgeyBkZXRhaWw6IGV2ZW50RGV0YWlsIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIERlcHJlY2F0ZWQgQVBJIGZvciBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eSArIElFXG4gICAgICAgIGN1c3RvbUV2ZW50ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ0N1c3RvbUV2ZW50Jyk7XG4gICAgICAgIGN1c3RvbUV2ZW50LmluaXRDdXN0b21FdmVudChldmVudFR5cGUsIHRydWUsIHRydWUsIGV2ZW50RGV0YWlsKTtcbiAgICB9XG4gICAgTG9nZ2luZy5kZWJ1Z01lc3NhZ2UoJ0VtaXR0aW5nIGV2ZW50LiB0eXBlOiAnICsgZXZlbnRUeXBlICsgJyBkZXRhaWw6ICcgKyBKU09OLnN0cmluZ2lmeShldmVudERldGFpbCkpO1xuICAgIHJldHVybiBjdXN0b21FdmVudDtcbn1cblxuZnVuY3Rpb24gZW1pdEV2ZW50KGN1c3RvbUV2ZW50KSB7XG4gICAgZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChjdXN0b21FdmVudCk7XG59XG5cbi8vIEZpbGwgaW4gYW55IG9wdGlvbmFsIHByb3BlcnRpZXMgd2l0aCBudWxsIHZhbHVlcy5cbmZ1bmN0aW9uIGZpbGxJbk1pc3NpbmdQcm9wZXJ0aWVzKGV2ZW50KSB7XG4gICAgZm9yICh2YXIgYXR0ciBpbiBhdHRyaWJ1dGVzKSB7XG4gICAgICAgIGlmIChldmVudFthdHRyaWJ1dGVzW2F0dHJdXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBldmVudFthdHRyaWJ1dGVzW2F0dHJdXSA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbnZhciBhdHRyaWJ1dGVzID0ge1xuICAgIGV2ZW50VHlwZTogJ2V0JyxcbiAgICBldmVudFZhbHVlOiAnZXYnLFxuICAgIGdyb3VwSWQ6ICdnaWQnLFxuICAgIHVzZXJJZDogJ3VpZCcsXG4gICAgcGFnZUlkOiAncGlkJyxcbiAgICBsb25nVGVybVNlc3Npb246ICdsdHMnLFxuICAgIHNob3J0VGVybVNlc3Npb246ICdzdHMnLFxuICAgIHJlZmVycmVyVXJsOiAncmVmJyxcbiAgICBjb250ZW50SWQ6ICdjaWQnLFxuICAgIGFydGljbGVIZWlnaHQ6ICdhaCcsXG4gICAgY29udGFpbmVySGFzaDogJ2NoJyxcbiAgICBjb250YWluZXJLaW5kOiAnY2snLFxuICAgIHJlYWN0aW9uQm9keTogJ3InLFxuICAgIHBhZ2VUaXRsZTogJ3B0JyxcbiAgICBjYW5vbmljYWxVcmw6ICdjdScsXG4gICAgcGFnZVVybDogJ3B1JyxcbiAgICBjb250ZW50QXR0cmlidXRlczogJ2NhJyxcbiAgICBjb250ZW50TG9jYXRpb246ICdjbCcsXG4gICAgcGFnZVRvcGljczogJ3B0b3AnLFxuICAgIGF1dGhvcjogJ2EnLFxuICAgIHNpdGVTZWN0aW9uOiAnc2VjJyxcbiAgICBpc1RvdWNoQnJvd3NlcjogJ2l0JyxcbiAgICBzY3JlZW5XaWR0aDogJ3N3JyxcbiAgICBzY3JlZW5IZWlnaHQ6ICdzaCcsXG4gICAgcGl4ZWxEZW5zaXR5OiAncGQnLFxuICAgIHVzZXJBZ2VudDogJ3VhJ1xufTtcblxudmFyIGV2ZW50VHlwZXMgPSB7XG4gICAgc2NyaXB0TG9hZDogJ3NsJyxcbiAgICByZWFjdGlvblNoYXJlZDogJ3NoJyxcbiAgICBzdW1tYXJ5V2lkZ2V0OiAnc2InLFxuICAgIHJlYWN0aW9uV2lkZ2V0T3BlbmVkOiAncnMnLFxuICAgIHBhZ2VEYXRhTG9hZGVkOiAnd2wnLFxuICAgIGNvbW1lbnRDcmVhdGVkOiAnYycsXG4gICAgcmVhY3Rpb25DcmVhdGVkOiAncmUnLFxuICAgIGNvbW1lbnRzVmlld2VkOiAndmNvbScsXG4gICAgcmVjaXJjQ2xpY2tlZDogJ3JjJyxcbiAgICBjb250ZW50UmVjTG9hZGVkOiAnY3JsJyxcbiAgICBjb250ZW50UmVjVmlzaWJsZTogJ2NydicsXG4gICAgY29udGVudFJlY0NsaWNrZWQ6ICdjcmMnLFxuICAgIHJlYWRNb3JlTG9hZGVkOiAncm1sJyxcbiAgICByZWFkTW9yZVZpc2libGU6ICdybXYnLFxuICAgIHJlYWRNb3JlQ2xpY2tlZDogJ3JtYycsXG4gICAgZmFjZWJvb2tMb2dpbkF0dGVtcHQ6ICdsb2dpbiBhdHRlbXB0IGZhY2Vib29rJyxcbiAgICBhbnRlbm5hTG9naW5BdHRlbXB0OiAnbG9naW4gYXR0ZW1wdCBhbnRlbm5hJ1xufTtcblxudmFyIGV2ZW50VmFsdWVzID0ge1xuICAgIGNvbnRlbnRWaWV3ZWQ6ICd2YycsIC8vIHZpZXdfY29udGVudFxuICAgIGxvY2F0aW9uc1ZpZXdlZDogJ3ZyJywgLy8gdmlld19yZWFjdGlvbnNcbiAgICBzaG93RGVmYXVsdHM6ICd3cicsXG4gICAgc2hvd1JlYWN0aW9uczogJ3JkJyxcbiAgICBzaW5nbGVQYWdlOiAnc2knLFxuICAgIG11bHRpcGxlUGFnZXM6ICdtdScsXG4gICAgdmlld1JlYWN0aW9uczogJ3Z3JyxcbiAgICB2aWV3RGVmYXVsdHM6ICdhZCcsXG4gICAgc3RhcnQ6ICdzdGFydCcsXG4gICAgZmFpbDogJ2ZhaWwnXG59O1xuXG52YXIgZW1pdEV2ZW50VHlwZXMgPSB7XG4gICAgcmVhY3Rpb25WaWV3OiAnYW50ZW5uYS5yZWFjdGlvblZpZXcnLFxuICAgIHJlYWN0aW9uQ3JlYXRlOiAnYW50ZW5uYS5yZWFjdGlvbkNyZWF0ZScsXG4gICAgcmVhY3Rpb25TaGFyZTogJ2FudGVubmEucmVhY3Rpb25TaGFyZScsXG4gICAgY29udGVudFdpdGhSZWFjdGlvblZpZXc6ICdhbnRlbm5hLmNvbnRlbnRXaXRoUmVhY3Rpb25WaWV3JyxcbiAgICBjb250ZW50V2l0aFJlYWN0aW9uRmluZDogJ2FudGVubmEuY29udGVudFdpdGhSZWFjdGlvbkZpbmQnLFxuICAgIGNvbW1lbnRWaWV3OiAnYW50ZW5uYS5jb21tZW50VmlldycsXG4gICAgY29tbWVudENyZWF0ZTogJ2FudGVubmEuY29tbWVudENyZWF0ZScsXG4gICAgcmVhZE1vcmVMb2FkOiAnYW50ZW5uYS5yZWFkTW9yZUxvYWQnLFxuICAgIHJlYWRNb3JlVmlldzogJ2FudGVubmEucmVhZE1vcmVWaWV3JyxcbiAgICByZWFkTW9yZUNsaWNrOiAnYW50ZW5uYS5yZWFkTW9yZUNsaWNrJ1xufTtcblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHBvc3RHcm91cFNldHRpbmdzTG9hZGVkOiBwb3N0R3JvdXBTZXR0aW5nc0xvYWRlZCxcbiAgICBwb3N0UGFnZURhdGFMb2FkZWQ6IHBvc3RQYWdlRGF0YUxvYWRlZCxcbiAgICBwb3N0U3VtbWFyeU9wZW5lZDogcG9zdFN1bW1hcnlPcGVuZWQsXG4gICAgcG9zdENvbW1lbnRzVmlld2VkOiBwb3N0Q29tbWVudHNWaWV3ZWQsXG4gICAgcG9zdENvbW1lbnRDcmVhdGVkOiBwb3N0Q29tbWVudENyZWF0ZWQsXG4gICAgcG9zdFJlYWN0aW9uV2lkZ2V0T3BlbmVkOiBwb3N0UmVhY3Rpb25XaWRnZXRPcGVuZWQsXG4gICAgcG9zdFJlYWN0aW9uQ3JlYXRlZDogcG9zdFJlYWN0aW9uQ3JlYXRlZCxcbiAgICBwb3N0UmVhY3Rpb25TaGFyZWQ6IHBvc3RSZWFjdGlvblNoYXJlZCxcbiAgICBwb3N0TG9jYXRpb25zVmlld2VkOiBwb3N0TG9jYXRpb25zVmlld2VkLFxuICAgIHBvc3RDb250ZW50Vmlld2VkOiBwb3N0Q29udGVudFZpZXdlZCxcbiAgICBwb3N0TGVnYWN5UmVjaXJjQ2xpY2tlZDogcG9zdExlZ2FjeVJlY2lyY0NsaWNrZWQsXG4gICAgcG9zdENvbnRlbnRSZWNMb2FkZWQ6IHBvc3RDb250ZW50UmVjTG9hZGVkLFxuICAgIHBvc3RDb250ZW50UmVjVmlzaWJsZTogcG9zdENvbnRlbnRSZWNWaXNpYmxlLFxuICAgIHBvc3RDb250ZW50UmVjQ2xpY2tlZDogcG9zdENvbnRlbnRSZWNDbGlja2VkLFxuICAgIGNyZWF0ZUNvbnRlbnRSZWNDbGlja2VkRXZlbnQ6IGNyZWF0ZUNvbnRlbnRSZWNDbGlja2VkRXZlbnQsXG4gICAgcG9zdFJlYWRNb3JlTG9hZGVkOiBwb3N0UmVhZE1vcmVMb2FkZWQsXG4gICAgcG9zdFJlYWRNb3JlVmlzaWJsZTogcG9zdFJlYWRNb3JlVmlzaWJsZSxcbiAgICBwb3N0UmVhZE1vcmVDbGlja2VkOiBwb3N0UmVhZE1vcmVDbGlja2VkLFxuICAgIHBvc3RGYWNlYm9va0xvZ2luU3RhcnQ6IHBvc3RGYWNlYm9va0xvZ2luU3RhcnQsXG4gICAgcG9zdEZhY2Vib29rTG9naW5GYWlsOiBwb3N0RmFjZWJvb2tMb2dpbkZhaWwsXG4gICAgcG9zdEFudGVubmFMb2dpblN0YXJ0OiBwb3N0QW50ZW5uYUxvZ2luU3RhcnQsXG4gICAgcG9zdEFudGVubmFMb2dpbkZhaWw6IHBvc3RBbnRlbm5hTG9naW5GYWlsXG59OyIsInZhciBSYWN0aXZlOyByZXF1aXJlKCcuL3V0aWxzL3JhY3RpdmUtcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24obG9hZGVkUmFjdGl2ZSkgeyBSYWN0aXZlID0gbG9hZGVkUmFjdGl2ZTt9KTtcbnZhciBTVkdzID0gcmVxdWlyZSgnLi9zdmdzJyk7XG5cbnZhciBwYWdlU2VsZWN0b3IgPSAnLmFudGVubmEtZXJyb3ItcGFnZSc7XG5cbmZ1bmN0aW9uIGNyZWF0ZVBhZ2Uob3B0aW9ucykge1xuICAgIHZhciBlbGVtZW50ID0gb3B0aW9ucy5lbGVtZW50O1xuICAgIHZhciBnb0JhY2sgPSBvcHRpb25zLmdvQmFjaztcbiAgICB2YXIgcmFjdGl2ZSA9IFJhY3RpdmUoe1xuICAgICAgICBlbDogZWxlbWVudCxcbiAgICAgICAgYXBwZW5kOiB0cnVlLFxuICAgICAgICBkYXRhOiB7fSxcbiAgICAgICAgdGVtcGxhdGU6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9nZW5lcmljLWVycm9yLXBhZ2UuaGJzLmh0bWwnKSxcbiAgICAgICAgcGFydGlhbHM6IHtcbiAgICAgICAgICAgIGxlZnQ6IFNWR3MubGVmdFxuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmFjdGl2ZS5vbignYmFjaycsIGdvQmFjayk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgc2VsZWN0b3I6IHBhZ2VTZWxlY3RvcixcbiAgICAgICAgdGVhcmRvd246IGZ1bmN0aW9uKCkgeyByYWN0aXZlLnRlYXJkb3duKCk7IH1cbiAgICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGVQYWdlOiBjcmVhdGVQYWdlXG59OyIsInZhciAkOyByZXF1aXJlKCcuL3V0aWxzL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIEFqYXhDbGllbnQgPSByZXF1aXJlKCcuL3V0aWxzL2FqYXgtY2xpZW50Jyk7XG52YXIgVVJMcyA9IHJlcXVpcmUoJy4vdXRpbHMvdXJscycpO1xudmFyIEdyb3VwU2V0dGluZ3MgPSByZXF1aXJlKCcuL2dyb3VwLXNldHRpbmdzJyk7XG5cbi8vIFRPRE8gZm9sZCB0aGlzIG1vZHVsZSBpbnRvIGdyb3VwLXNldHRpbmdzP1xuXG5mdW5jdGlvbiBsb2FkU2V0dGluZ3MoY2FsbGJhY2spIHtcbiAgICBBamF4Q2xpZW50LmdldEpTT05QKFVSTHMuZ3JvdXBTZXR0aW5nc1VybCgpLCB7IGhvc3RfbmFtZTogd2luZG93LmFudGVubmFfaG9zdCB9LCBzdWNjZXNzLCBlcnJvcik7XG5cbiAgICBmdW5jdGlvbiBzdWNjZXNzKGpzb24pIHtcbiAgICAgICAgdmFyIGdyb3VwU2V0dGluZ3MgPSBHcm91cFNldHRpbmdzLmNyZWF0ZShqc29uKTtcbiAgICAgICAgY2FsbGJhY2soZ3JvdXBTZXR0aW5ncyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZXJyb3IobWVzc2FnZSkge1xuICAgICAgICAvLyBUT0RPIGhhbmRsZSBlcnJvcnMgdGhhdCBoYXBwZW4gd2hlbiBsb2FkaW5nIGNvbmZpZyBkYXRhXG4gICAgICAgIGNvbnNvbGUubG9nKCdBbiBlcnJvciBvY2N1cnJlZCBsb2FkaW5nIGdyb3VwIHNldHRpbmdzOiAnICsgbWVzc2FnZSk7XG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgbG9hZDogbG9hZFNldHRpbmdzXG59OyIsInZhciAkOyByZXF1aXJlKCcuL3V0aWxzL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xuXG52YXIgRXZlbnRzID0gcmVxdWlyZSgnLi9ldmVudHMnKTtcblxudmFyIGdyb3VwU2V0dGluZ3M7XG5cbi8vIFRPRE86IFVwZGF0ZSBhbGwgY2xpZW50cyB0aGF0IGFyZSBwYXNzaW5nIGFyb3VuZCBhIGdyb3VwU2V0dGluZ3Mgb2JqZWN0IHRvIGluc3RlYWQgYWNjZXNzIHRoZSAnZ2xvYmFsJyBzZXR0aW5ncyBpbnN0YW5jZVxuZnVuY3Rpb24gZ2V0R3JvdXBTZXR0aW5ncygpIHtcbiAgICByZXR1cm4gZ3JvdXBTZXR0aW5ncztcbn1cblxuZnVuY3Rpb24gdXBkYXRlRnJvbUpTT04oanNvbikge1xuICAgIGdyb3VwU2V0dGluZ3MgPSBjcmVhdGVGcm9tSlNPTihqc29uKTtcbiAgICBFdmVudHMucG9zdEdyb3VwU2V0dGluZ3NMb2FkZWQoZ3JvdXBTZXR0aW5ncyk7XG4gICAgcmV0dXJuIGdyb3VwU2V0dGluZ3M7XG59XG5cblxuLy8gVE9ETzogdHJpbSB0cmFpbGluZyBjb21tYXMgZnJvbSBhbnkgc2VsZWN0b3IgdmFsdWVzXG5cbi8vIFRPRE86IFJldmlldy4gVGhlc2UgYXJlIGp1c3QgY29waWVkIGZyb20gZW5nYWdlX2Z1bGwuXG52YXIgZGVmYXVsdHMgPSB7XG4gICAgcHJlbWl1bTogZmFsc2UsXG4gICAgaW1nX3NlbGVjdG9yOiBcImltZ1wiLCAvLyBUT0RPOiB0aGlzIGlzIHNvbWUgYm9ndXMgb2Jzb2xldGUgcHJvcGVydHkuIHdlIHNob3VsZG4ndCB1c2UgaXQuXG4gICAgaW1nX2NvbnRhaW5lcl9zZWxlY3RvcnM6XCIjcHJpbWFyeS1waG90b1wiLFxuICAgIGFjdGl2ZV9zZWN0aW9uczogXCJib2R5XCIsXG4gICAgLy9hbm5vX3doaXRlbGlzdDogXCJib2R5IHBcIixcbiAgICBhbm5vX3doaXRlbGlzdDogXCJwXCIsIC8vIFRPRE86IFRoZSBjdXJyZW50IGRlZmF1bHQgaXMgXCJib2R5IHBcIiwgd2hpY2ggbWFrZXMgbm8gc2Vuc2Ugd2hlbiB3ZSdyZSBzZWFyY2hpbmcgb25seSB3aXRoaW4gdGhlIGFjdGl2ZSBzZWN0aW9uc1xuICAgIGFjdGl2ZV9zZWN0aW9uc193aXRoX2Fubm9fd2hpdGVsaXN0OlwiXCIsXG4gICAgbWVkaWFfc2VsZWN0b3I6IFwiZW1iZWQsIHZpZGVvLCBvYmplY3QsIGlmcmFtZVwiLFxuICAgIGNvbW1lbnRfbGVuZ3RoOiA1MDAsXG4gICAgbm9fYW50OiBcIlwiLFxuICAgIGltZ19ibGFja2xpc3Q6IFwiXCIsXG4gICAgY3VzdG9tX2NzczogXCJcIixcbiAgICAvL3RvZG86IHRlbXAgaW5saW5lX2luZGljYXRvciBkZWZhdWx0cyB0byBtYWtlIHRoZW0gc2hvdyB1cCBvbiBhbGwgbWVkaWEgLSByZW1vdmUgdGhpcyBsYXRlci5cbiAgICBpbmxpbmVfc2VsZWN0b3I6ICdpbWcsIGVtYmVkLCB2aWRlbywgb2JqZWN0LCBpZnJhbWUnLFxuICAgIHBhcmFncmFwaF9oZWxwZXI6IHRydWUsXG4gICAgbWVkaWFfdXJsX2lnbm9yZV9xdWVyeTogdHJ1ZSxcbiAgICBzdW1tYXJ5X3dpZGdldF9zZWxlY3RvcjogJy5hbnQtcGFnZS1zdW1tYXJ5JywgLy8gVE9ETzogdGhpcyB3YXNuJ3QgZGVmaW5lZCBhcyBhIGRlZmF1bHQgaW4gZW5nYWdlX2Z1bGwsIGJ1dCB3YXMgaW4gY29kZS4gd2h5P1xuICAgIHN1bW1hcnlfd2lkZ2V0X21ldGhvZDogJ2FmdGVyJyxcbiAgICBsYW5ndWFnZTogJ2VuJyxcbiAgICBhYl90ZXN0X2ltcGFjdDogdHJ1ZSxcbiAgICBhYl90ZXN0X3NhbXBsZV9wZXJjZW50YWdlOiAxMCxcbiAgICBpbWdfaW5kaWNhdG9yX3Nob3dfb25sb2FkOiB0cnVlLFxuICAgIGltZ19pbmRpY2F0b3Jfc2hvd19zaWRlOiAnbGVmdCcsXG4gICAgdGFnX2JveF9iZ19jb2xvcnM6ICcnLFxuICAgIHRhZ19ib3hfdGV4dF9jb2xvcnM6ICcnLFxuICAgIHRhZ19ib3hfZm9udF9mYW1pbHk6ICdIZWx2ZXRpY2FOZXVlLEhlbHZldGljYSxBcmlhbCxzYW5zLXNlcmlmJyxcbiAgICB0YWdzX2JnX2NzczogJycsXG4gICAgaWdub3JlX3N1YmRvbWFpbjogZmFsc2UsXG4gICAgaW1hZ2Vfc2VsZWN0b3I6ICdtZXRhW3Byb3BlcnR5PVwib2c6aW1hZ2VcIl0nLCAvLyBUT0RPOiByZXZpZXcgd2hhdCB0aGlzIHNob3VsZCBiZSAobm90IGZyb20gZW5nYWdlX2Z1bGwpXG4gICAgaW1hZ2VfYXR0cmlidXRlOiAnY29udGVudCcsIC8vIFRPRE86IHJldmlldyB3aGF0IHRoaXMgc2hvdWxkIGJlIChub3QgZnJvbSBlbmdhZ2VfZnVsbCksXG4gICAgcXVlcnlzdHJpbmdfY29udGVudDogZmFsc2UsXG4gICAgaW5pdGlhbF9waW5fbGltaXQ6IDMsXG4gICAgLy90aGUgc2NvcGUgaW4gd2hpY2ggdG8gZmluZCBwYXJlbnRzIG9mIDxicj4gdGFncy5cbiAgICAvL1Rob3NlIHBhcmVudHMgd2lsbCBiZSBjb252ZXJ0ZWQgdG8gYSA8cnQ+IGJsb2NrLCBzbyB0aGVyZSB3b24ndCBiZSBuZXN0ZWQgPHA+IGJsb2Nrcy5cbiAgICAvL3RoZW4gaXQgd2lsbCBzcGxpdCB0aGUgcGFyZW50J3MgaHRtbCBvbiA8YnI+IHRhZ3MgYW5kIHdyYXAgdGhlIHNlY3Rpb25zIGluIDxwPiB0YWdzLlxuXG4gICAgLy9leGFtcGxlOlxuICAgIC8vIGJyX3JlcGxhY2Vfc2NvcGVfc2VsZWN0b3I6IFwiLmFudF9icl9yZXBsYWNlXCIgLy9lLmcuIFwiI21haW5zZWN0aW9uXCIgb3IgXCJwXCJcblxuICAgIGJyX3JlcGxhY2Vfc2NvcGVfc2VsZWN0b3I6IG51bGwgLy9lLmcuIFwiI21haW5zZWN0aW9uXCIgb3IgXCJwXCJcbn07XG5cbmZ1bmN0aW9uIGNyZWF0ZUZyb21KU09OKGpzb24pIHtcblxuICAgIGZ1bmN0aW9uIGRhdGEoa2V5LCBpZkFic2VudCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgdmFsdWU7XG4gICAgICAgICAgICBpZiAod2luZG93LmFudGVubmFfZXh0ZW5kKSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSB3aW5kb3cuYW50ZW5uYV9leHRlbmRba2V5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IGpzb25ba2V5XTtcbiAgICAgICAgICAgICAgICAvLyBUT0RPOiBvdXIgc2VydmVyIGFwcGFyZW50bHkgc2VuZHMgYmFjayBudWxsIGFzIGEgdmFsdWUgZm9yIHNvbWUgYXR0cmlidXRlcy5cbiAgICAgICAgICAgICAgICAvLyBUT0RPOiBjb25zaWRlciBjaGVja2luZyBmb3IgbnVsbCB3aGVyZXZlciB3ZSdyZSBjaGVja2luZyBmb3IgdW5kZWZpbmVkXG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09ICcnIHx8IHZhbHVlID09PSBudWxsKSB7IC8vIFRPRE86IFNob3VsZCB0aGUgc2VydmVyIGJlIHNlbmRpbmcgYmFjayAnJyBoZXJlIG9yIG5vdGhpbmcgYXQgYWxsPyAoSXQgcHJlY2x1ZGVzIHRoZSBzZXJ2ZXIgZnJvbSByZWFsbHkgc2F5aW5nICdub3RoaW5nJylcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBkZWZhdWx0c1trZXldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaWZBYnNlbnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZXhjbHVzaW9uU2VsZWN0b3Ioa2V5LCBkZXByZWNhdGVkS2V5KSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBzZWxlY3RvcnMgPSBbXTtcbiAgICAgICAgICAgIHZhciBub0FudCA9IGRhdGEoJ25vX2FudCcpKCk7XG4gICAgICAgICAgICBpZiAobm9BbnQpIHtcbiAgICAgICAgICAgICAgICBzZWxlY3RvcnMucHVzaChub0FudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgbm9SZWFkciA9IGRhdGEoJ25vX3JlYWRyJykoKTtcbiAgICAgICAgICAgIGlmIChub1JlYWRyKSB7XG4gICAgICAgICAgICAgICAgc2VsZWN0b3JzLnB1c2gobm9SZWFkcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gc2VsZWN0b3JzLmpvaW4oJywnKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGJhY2tncm91bmRDb2xvcihhY2Nlc3Nvcikge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgY29sb3JzID0gW107XG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBhY2Nlc3NvcigpO1xuICAgICAgICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgY29sb3JzID0gdmFsdWUuc3BsaXQoJzsnKTtcbiAgICAgICAgICAgICAgICBjb2xvcnMgPSBtaWdyYXRlVmFsdWVzKGNvbG9ycyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gY29sb3JzO1xuXG4gICAgICAgICAgICAvLyBNaWdyYXRlIGFueSBjb2xvcnMgZnJvbSB0aGUgJzEsIDIsIDMnIGZvcm1hdCB0byAncmdiKDEsIDIsIDMpJy4gVGhpcyBjb2RlIGNhbiBiZSBkZWxldGVkIG9uY2Ugd2UndmUgdXBkYXRlZFxuICAgICAgICAgICAgLy8gYWxsIHNpdGVzIHRvIHNwZWNpZnlpbmcgdmFsaWQgQ1NTIGNvbG9yIHZhbHVlc1xuICAgICAgICAgICAgZnVuY3Rpb24gbWlncmF0ZVZhbHVlcyhjb2xvclZhbHVlcykge1xuICAgICAgICAgICAgICAgIHZhciBtaWdyYXRpb25NYXRjaGVyID0gL15cXHMqXFxkK1xccyosXFxzKlxcZCtcXHMqLFxccypcXGQrXFxzKiQvZ2ltO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY29sb3JWYWx1ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gY29sb3JWYWx1ZXNbaV07XG4gICAgICAgICAgICAgICAgICAgIGlmIChtaWdyYXRpb25NYXRjaGVyLnRlc3QodmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xvclZhbHVlc1tpXSA9ICdyZ2IoJyArIHZhbHVlICsgJyknO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBjb2xvclZhbHVlcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRlZmF1bHRSZWFjdGlvbnMoJGVsZW1lbnQpIHtcbiAgICAgICAgLy8gRGVmYXVsdCByZWFjdGlvbnMgYXJlIGF2YWlsYWJsZSBpbiB0aHJlZSBsb2NhdGlvbnMgaW4gdGhyZWUgZGF0YSBmb3JtYXRzOlxuICAgICAgICAvLyAxLiBBcyBhIGNvbW1hLXNlcGFyYXRlZCBhdHRyaWJ1dGUgdmFsdWUgb24gYSBwYXJ0aWN1bGFyIGVsZW1lbnRcbiAgICAgICAgLy8gMi4gQXMgYW4gYXJyYXkgb2Ygc3RyaW5ncyBvbiB0aGUgd2luZG93LmFudGVubmFfZXh0ZW5kIHByb3BlcnR5XG4gICAgICAgIC8vIDMuIEFzIGEganNvbiBvYmplY3Qgd2l0aCBhIGJvZHkgYW5kIGlkIG9uIHRoZSBncm91cCBzZXR0aW5nc1xuICAgICAgICB2YXIgcmVhY3Rpb25zID0gW107XG4gICAgICAgIHZhciByZWFjdGlvblN0cmluZ3M7XG4gICAgICAgIHZhciBlbGVtZW50UmVhY3Rpb25zID0gJGVsZW1lbnQgPyAkZWxlbWVudC5hdHRyKCdhbnQtcmVhY3Rpb25zJykgOiB1bmRlZmluZWQ7XG4gICAgICAgIGlmIChlbGVtZW50UmVhY3Rpb25zKSB7XG4gICAgICAgICAgICByZWFjdGlvblN0cmluZ3MgPSBlbGVtZW50UmVhY3Rpb25zLnNwbGl0KCc7Jyk7XG4gICAgICAgIH0gZWxzZSBpZiAod2luZG93LmFudGVubmFfZXh0ZW5kKSB7XG4gICAgICAgICAgICByZWFjdGlvblN0cmluZ3MgPSB3aW5kb3cuYW50ZW5uYV9leHRlbmRbJ2RlZmF1bHRfcmVhY3Rpb25zJ107XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJlYWN0aW9uU3RyaW5ncykge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZWFjdGlvblN0cmluZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICByZWFjdGlvbnMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIHRleHQ6IHJlYWN0aW9uU3RyaW5nc1tpXSxcbiAgICAgICAgICAgICAgICAgICAgaXNEZWZhdWx0OiB0cnVlXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciB2YWx1ZXMgPSBqc29uWydkZWZhdWx0X3JlYWN0aW9ucyddO1xuICAgICAgICAgICAgaWYgKHZhbHVlcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCB2YWx1ZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gdmFsdWVzW2pdO1xuICAgICAgICAgICAgICAgICAgICByZWFjdGlvbnMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiB2YWx1ZS5ib2R5LFxuICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IHZhbHVlLmlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgaXNEZWZhdWx0OiB0cnVlXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVhY3Rpb25zO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNvbXB1dGVDdXN0b21DU1MoKSB7XG4gICAgICAgIC8vIEZpcnN0IHJlYWQgYW55IHJhdyBjdXN0b20gQ1NTLlxuICAgICAgICB2YXIgY3VzdG9tQ1NTID0gZGF0YSgnY3VzdG9tX2NzcycpKCk7XG4gICAgICAgIC8vIFRoZW4gYXBwZW5kIHJ1bGVzIGZvciBhbnkgc3BlY2lmaWMgQ1NTIG92ZXJyaWRlcy5cbiAgICAgICAgY3VzdG9tQ1NTICs9IGNyZWF0ZUN1c3RvbUNTU1J1bGUobWlncmF0ZVJlYWN0aW9uc0JhY2tncm91bmRDb2xvclNldHRpbmdzKGRhdGEoJ3RhZ3NfYmdfY3NzJywgJycpKSwgJy5hbnRlbm5hLXJlYWN0aW9ucy1wYWdlIC5hbnRlbm5hLWJvZHksIC5hbnRlbm5hLWRlZmF1bHRzLXBhZ2UgLmFudGVubmEtYm9keScpO1xuICAgICAgICBjdXN0b21DU1MgKz0gY3JlYXRlQ3VzdG9tQ1NTUnVsZShkYXRhKCd0YWdfYm94X2JnX2NvbG9ycycsICcnKSwgJy5hbnRlbm5hLXJlYWN0aW9uLWJveCcpO1xuICAgICAgICBjdXN0b21DU1MgKz0gY3JlYXRlQ3VzdG9tQ1NTUnVsZShkYXRhKCd0YWdfYm94X2JnX2NvbG9yc19ob3ZlcicsICcnKSwgJy5hbnRlbm5hLXJlYWN0aW9uOmhvdmVyID4gLmFudGVubmEtcmVhY3Rpb24tYm94Jyk7XG4gICAgICAgIGN1c3RvbUNTUyArPSBjcmVhdGVDdXN0b21DU1NSdWxlKG1pZ3JhdGVUZXh0Q29sb3JTZXR0aW5ncyhkYXRhKCd0YWdfYm94X3RleHRfY29sb3JzJywgJycpKSwgJy5hbnRlbm5hLXJlYWN0aW9uLWJveCwgLmFudGVubmEtcmVhY3Rpb24tY29tbWVudHMgLmFudGVubmEtY29tbWVudHMtcGF0aCwgLmFudGVubmEtcmVhY3Rpb24tbG9jYXRpb24gLmFudGVubmEtbG9jYXRpb24tcGF0aCcpO1xuICAgICAgICBjdXN0b21DU1MgKz0gY3JlYXRlQ3VzdG9tQ1NTUnVsZShtaWdyYXRlRm9udEZhbWlseVNldHRpbmcoZGF0YSgndGFnX2JveF9mb250X2ZhbWlseScsICcnKSksICcuYW50ZW5uYS1yZWFjdGlvbi1ib3ggLmFudGVubmEtcmVzZXQnKTtcbiAgICAgICAgcmV0dXJuIGN1c3RvbUNTUztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjcmVhdGVDdXN0b21DU1NSdWxlKGRlY2xhcmF0aW9uc0FjY2Vzc29yLCBzZWxlY3Rvcikge1xuICAgICAgICB2YXIgZGVjbGFyYXRpb25zID0gZGVjbGFyYXRpb25zQWNjZXNzb3IoKS50cmltKCk7XG4gICAgICAgIGlmIChkZWNsYXJhdGlvbnMpIHtcbiAgICAgICAgICAgIHJldHVybiAnXFxuJyArIHNlbGVjdG9yICsgJyB7XFxuICAgICcgKyBkZWNsYXJhdGlvbnMgKyAnXFxufSc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICcnO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1pZ3JhdGVSZWFjdGlvbnNCYWNrZ3JvdW5kQ29sb3JTZXR0aW5ncyhiYWNrZ3JvdW5kQ29sb3JBY2Nlc3Nvcikge1xuICAgICAgICAvLyBUT0RPOiBUaGlzIGlzIHRlbXBvcmFyeSBjb2RlIHRoYXQgbWlncmF0ZXMgdGhlIGN1cnJlbnQgdGFnc19iZ19jc3Mgc2V0dGluZyBmcm9tIGEgcmF3IHZhbHVlIHRvIGFcbiAgICAgICAgLy8gICAgICAgQ1NTIGRlY2xhcmF0aW9uLiBXZSBzaG91bGQgbWlncmF0ZSBhbGwgZGVwbG95ZWQgc2l0ZXMgdG8gdXNlIGEgQ1NTIGRlY2xhcmF0aW9uIGFuZCB0aGVuIHJlbW92ZSB0aGlzLlxuICAgICAgICB2YXIgYmFja2dyb3VuZENvbG9yID0gYmFja2dyb3VuZENvbG9yQWNjZXNzb3IoKS50cmltKCk7XG4gICAgICAgIGlmIChiYWNrZ3JvdW5kQ29sb3IgJiYgYmFja2dyb3VuZENvbG9yLmluZGV4T2YoJ2JhY2tncm91bmQnKSA9PT0gLTEpIHtcbiAgICAgICAgICAgIGJhY2tncm91bmRDb2xvciA9ICdiYWNrZ3JvdW5kLWltYWdlOiAnICsgYmFja2dyb3VuZENvbG9yO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBiYWNrZ3JvdW5kQ29sb3I7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtaWdyYXRlRm9udEZhbWlseVNldHRpbmcoZm9udEZhbWlseUFjY2Vzc29yKSB7XG4gICAgICAgIC8vIFRPRE86IFRoaXMgaXMgdGVtcG9yYXJ5IGNvZGUgdGhhdCBtaWdyYXRlcyB0aGUgY3VycmVudCB0YWdfYm94X2ZvbnRfZmFtaWx5IHNldHRpbmcgZnJvbSBhIHJhdyB2YWx1ZSB0byBhXG4gICAgICAgIC8vICAgICAgIENTUyBkZWNsYXJhdGlvbi4gV2Ugc2hvdWxkIG1pZ3JhdGUgYWxsIGRlcGxveWVkIHNpdGVzIHRvIHVzZSBhIENTUyBkZWNsYXJhdGlvbiBhbmQgdGhlbiByZW1vdmUgdGhpcy5cbiAgICAgICAgdmFyIGZvbnRGYW1pbHkgPSBmb250RmFtaWx5QWNjZXNzb3IoKS50cmltKCk7XG4gICAgICAgIGlmIChmb250RmFtaWx5ICYmIGZvbnRGYW1pbHkuaW5kZXhPZignZm9udC1mYW1pbHknKSA9PT0gLTEpIHtcbiAgICAgICAgICAgIGZvbnRGYW1pbHkgPSAnZm9udC1mYW1pbHk6ICcgKyBmb250RmFtaWx5O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBmb250RmFtaWx5O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWlncmF0ZVRleHRDb2xvclNldHRpbmdzKHRleHRDb2xvckFjY2Vzc29yKSB7XG4gICAgICAgIC8vIFRPRE86IFRoaXMgaXMgdGVtcG9yYXJ5IGNvZGUgdGhhdCBtaWdyYXRlcyB0aGUgY3VycmVudCB0YWdfYm94X3RleHRfY29sb3JzIHByb3BlcnR5LCB3aGljaCBpcyBhIGRlY2xhcmF0aW9uXG4gICAgICAgIC8vICAgICAgIHRoYXQgb25seSBzZXRzIHRoZSBjb2xvciBwcm9wZXJ0eSwgdG8gc2V0IGJvdGggdGhlIGNvbG9yIGFuZCBmaWxsIHByb3BlcnRpZXMuXG4gICAgICAgIHZhciB0ZXh0Q29sb3IgPSB0ZXh0Q29sb3JBY2Nlc3NvcigpLnRyaW0oKTtcbiAgICAgICAgaWYgKHRleHRDb2xvciAmJiB0ZXh0Q29sb3IuaW5kZXhPZignY29sb3I6JykgPT09IDAgJiYgdGV4dENvbG9yLmluZGV4T2YoJ2ZpbGw6JykgPT09IC0xKSB7XG4gICAgICAgICAgICB0ZXh0Q29sb3IgKz0gdGV4dENvbG9yW3RleHRDb2xvci5sZW5ndGggLSAxXSA9PSAnOycgPyAnJyA6ICc7JzsgLy8gYXBwZW5kIGEgc2VtaWNvbG9uIGlmIG5lZWRlZFxuICAgICAgICAgICAgdGV4dENvbG9yICs9IHRleHRDb2xvci5yZXBsYWNlKCdjb2xvcjonLCAnXFxuICAgIGZpbGw6Jyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRleHRDb2xvcjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIGxlZ2FjeUJlaGF2aW9yOiBkYXRhKCdsZWdhY3lfYmVoYXZpb3InLCBmYWxzZSksIC8vIFRPRE86IG1ha2UgdGhpcyByZWFsIGluIHRoZSBzZW5zZSB0aGF0IGl0IGNvbWVzIGJhY2sgZnJvbSB0aGUgc2VydmVyIGFuZCBwcm9iYWJseSBtb3ZlIHRoZSBmbGFnIHRvIHRoZSBwYWdlIGRhdGEuIFVubGlrZWx5IHRoYXQgd2UgbmVlZCB0byBtYWludGFpbiBsZWdhY3kgYmVoYXZpb3IgZm9yIG5ldyBwYWdlcz9cbiAgICAgICAgZ3JvdXBJZDogZGF0YSgnaWQnKSxcbiAgICAgICAgZ3JvdXBOYW1lOiBkYXRhKCduYW1lJyksXG4gICAgICAgIGFjdGl2ZVNlY3Rpb25zOiBkYXRhKCdhY3RpdmVfc2VjdGlvbnMnKSxcbiAgICAgICAgdXJsOiB7XG4gICAgICAgICAgICBpZ25vcmVTdWJkb21haW46IGRhdGEoJ2lnbm9yZV9zdWJkb21haW4nKSxcbiAgICAgICAgICAgIGluY2x1ZGVRdWVyeVN0cmluZzogZGF0YSgncXVlcnlzdHJpbmdfY29udGVudCcpLFxuICAgICAgICAgICAgaWdub3JlTWVkaWFVcmxRdWVyeTogZGF0YSgnbWVkaWFfdXJsX2lnbm9yZV9xdWVyeScpLFxuICAgICAgICAgICAgY2Fub25pY2FsRG9tYWluOiBkYXRhKCdwYWdlX3RsZCcpIC8vIFRPRE86IHdoYXQgdG8gY2FsbCB0aGlzIGV4YWN0bHkuIGdyb3VwRG9tYWluPyBzaXRlRG9tYWluPyBjYW5vbmljYWxEb21haW4/XG4gICAgICAgIH0sXG4gICAgICAgIHN1bW1hcnlTZWxlY3RvcjogZGF0YSgnc3VtbWFyeV93aWRnZXRfc2VsZWN0b3InKSxcbiAgICAgICAgc3VtbWFyeU1ldGhvZDogZGF0YSgnc3VtbWFyeV93aWRnZXRfbWV0aG9kJyksXG4gICAgICAgIGlzSGlkZU9uTW9iaWxlOiBkYXRhKCdoaWRlT25Nb2JpbGUnKSxcbiAgICAgICAgaXNFeHBhbmRlZE1vYmlsZVN1bW1hcnk6IGRhdGEoJ3N1bW1hcnlfd2lkZ2V0X2V4cGFuZGVkX21vYmlsZScpLFxuICAgICAgICBpc0hpZGVUYXBIZWxwZXI6IGRhdGEoJ2hpZGVEb3VibGVUYXBNZXNzYWdlJyksXG4gICAgICAgIHRhcEhlbHBlclBvc2l0aW9uOiBkYXRhKCdkb3VibGVUYXBNZXNzYWdlUG9zaXRpb24nKSxcbiAgICAgICAgcGFnZVNlbGVjdG9yOiBkYXRhKCdwb3N0X3NlbGVjdG9yJyksXG4gICAgICAgIHBhZ2VVcmxTZWxlY3RvcjogZGF0YSgncG9zdF9ocmVmX3NlbGVjdG9yJyksXG4gICAgICAgIHBhZ2VVcmxBdHRyaWJ1dGU6IGRhdGEoJ3Bvc3RfaHJlZl9hdHRyaWJ1dGUnLCAnaHJlZicpLFxuICAgICAgICBwYWdlVGl0bGVTZWxlY3RvcjogZGF0YSgncG9zdF90aXRsZV9zZWxlY3RvcicpLFxuICAgICAgICBwYWdlSW1hZ2VTZWxlY3RvcjogZGF0YSgnaW1hZ2Vfc2VsZWN0b3InKSxcbiAgICAgICAgcGFnZUltYWdlQXR0cmlidXRlOiBkYXRhKCdpbWFnZV9hdHRyaWJ1dGUnKSxcbiAgICAgICAgcGFnZUF1dGhvclNlbGVjdG9yOiBkYXRhKCdhdXRob3Jfc2VsZWN0b3InKSxcbiAgICAgICAgcGFnZUF1dGhvckF0dHJpYnV0ZTogZGF0YSgnYXV0aG9yX2F0dHJpYnV0ZScpLFxuICAgICAgICBwYWdlVG9waWNzU2VsZWN0b3I6IGRhdGEoJ3RvcGljc19zZWxlY3RvcicpLFxuICAgICAgICBwYWdlVG9waWNzQXR0cmlidXRlOiBkYXRhKCd0b3BpY3NfYXR0cmlidXRlJyksXG4gICAgICAgIHBhZ2VTaXRlU2VjdGlvblNlbGVjdG9yOiBkYXRhKCdzZWN0aW9uX3NlbGVjdG9yJyksXG4gICAgICAgIHBhZ2VTaXRlU2VjdGlvbkF0dHJpYnV0ZTogZGF0YSgnc2VjdGlvbl9hdHRyaWJ1dGUnKSxcbiAgICAgICAgY29udGVudFNlbGVjdG9yOiBkYXRhKCdhbm5vX3doaXRlbGlzdCcpLFxuICAgICAgICB0ZXh0SW5kaWNhdG9yTGltaXQ6IGRhdGEoJ2luaXRpYWxfcGluX2xpbWl0JyksXG4gICAgICAgIGVuYWJsZVRleHRIZWxwZXI6IGRhdGEoJ3BhcmFncmFwaF9oZWxwZXInKSxcbiAgICAgICAgbWVkaWFJbmRpY2F0b3JDb3JuZXI6IGRhdGEoJ2ltZ19pbmRpY2F0b3Jfc2hvd19zaWRlJyksXG4gICAgICAgIGdlbmVyYXRlZEN0YVNlbGVjdG9yOiBkYXRhKCdzZXBhcmF0ZV9jdGEnKSxcbiAgICAgICAgZ2VuZXJhdGVkQ3RhRXhwYW5kZWQ6IGRhdGEoJ3NlcGFyYXRlX2N0YV9leHBhbmRlZCcpLFxuICAgICAgICByZXF1aXJlc0FwcHJvdmFsOiBkYXRhKCdyZXF1aXJlc19hcHByb3ZhbCcpLFxuICAgICAgICBkZWZhdWx0UmVhY3Rpb25zOiBkZWZhdWx0UmVhY3Rpb25zLFxuICAgICAgICBjdXN0b21DU1M6IGNvbXB1dGVDdXN0b21DU1MsXG4gICAgICAgIGV4Y2x1c2lvblNlbGVjdG9yOiBleGNsdXNpb25TZWxlY3RvcigpLFxuICAgICAgICBsYW5ndWFnZTogZGF0YSgnbGFuZ3VhZ2UnKSxcbiAgICAgICAgdHdpdHRlckFjY291bnQ6IGRhdGEoJ3R3aXR0ZXInKSxcbiAgICAgICAgaXNTaG93Q29udGVudFJlYzogZGF0YSgnc2hvd19yZWNpcmMnKSxcbiAgICAgICAgY29udGVudFJlY1NlbGVjdG9yOiBkYXRhKCdyZWNpcmNfc2VsZWN0b3InKSxcbiAgICAgICAgY29udGVudFJlY1RpdGxlOiBkYXRhKCdyZWNpcmNfdGl0bGUnKSxcbiAgICAgICAgY29udGVudFJlY01ldGhvZDogZGF0YSgncmVjaXJjX2pxdWVyeV9tZXRob2QnKSxcbiAgICAgICAgY29udGVudFJlY0NvbG9yczogZGF0YSgncmVjaXJjX2JhY2tncm91bmQnKSxcbiAgICAgICAgY29udGVudFJlY0NvdW50RGVza3RvcDogZGF0YSgncmVjaXJjX2NvdW50X2Rlc2t0b3AnKSxcbiAgICAgICAgY29udGVudFJlY0NvdW50TW9iaWxlOiBkYXRhKCdyZWNpcmNfY291bnRfbW9iaWxlJyksXG4gICAgICAgIGNvbnRlbnRSZWNSb3dDb3VudERlc2t0b3A6IGRhdGEoJ3JlY2lyY19yb3djb3VudF9kZXNrdG9wJyksXG4gICAgICAgIGNvbnRlbnRSZWNSb3dDb3VudE1vYmlsZTogZGF0YSgncmVjaXJjX3Jvd2NvdW50X21vYmlsZScpXG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlOiB1cGRhdGVGcm9tSlNPTixcbiAgICBnZXQ6IGdldEdyb3VwU2V0dGluZ3Ncbn07IiwiLy8gVGhpcyBtb2R1bGUgc3RvcmVzIG91ciBtYXBwaW5nIGZyb20gaGFzaCB2YWx1ZXMgdG8gdGhlaXIgY29ycmVzcG9uZGluZyBlbGVtZW50cyBpbiB0aGUgRE9NLiBUaGUgZGF0YSBpcyBvcmdhbml6ZWRcbi8vIGJ5IHBhZ2UgZm9yIHRoZSBibG9nIHJvbGwgY2FzZSwgd2hlcmUgbXVsdGlwbGUgcGFnZXMgb2YgZGF0YSBjYW4gYmUgbG9hZGVkIGF0IG9uY2UuXG52YXIgcGFnZXMgPSB7fTtcblxuLy8gVGhpcyBtb2R1bGUgcHJvdmlkZXMgYSBnZXQvc2V0IGludGVyZmFjZSwgYnV0IGl0IGFsbG93cyBtdWx0aXBsZSBlbGVtZW50cyB3aXRoIHRoZSBzYW1lIGtleS4gVGhpcyBhcHBsaWVzIGZvciBpbWFnZVxuLy8gZWxlbWVudHMsIHdoZXJlIHdlIGFsbG93IG11bHRpcGxlIGluc3RhbmNlcyBvbiB0aGUgc2FtZSBwYWdlIHdpdGggdGhlIHNhbWUgaGFzaC5cblxuZnVuY3Rpb24gZ2V0RWxlbWVudChjb250YWluZXJIYXNoLCBwYWdlSGFzaCkge1xuICAgIHZhciBjb250YWluZXJzID0gcGFnZXNbcGFnZUhhc2hdO1xuICAgIGlmIChjb250YWluZXJzKSB7XG4gICAgICAgIHZhciBlbGVtZW50cyA9IGNvbnRhaW5lcnNbY29udGFpbmVySGFzaF07XG4gICAgICAgIGlmIChlbGVtZW50cykge1xuICAgICAgICAgICAgcmV0dXJuIGVsZW1lbnRzWzBdO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBzZXRFbGVtZW50KGNvbnRhaW5lckhhc2gsIHBhZ2VIYXNoLCAkZWxlbWVudCkge1xuICAgIHZhciBjb250YWluZXJzID0gcGFnZXNbcGFnZUhhc2hdO1xuICAgIGlmICghY29udGFpbmVycykge1xuICAgICAgICBjb250YWluZXJzID0gcGFnZXNbcGFnZUhhc2hdID0ge307XG4gICAgfVxuICAgIGNvbnRhaW5lcnNbY29udGFpbmVySGFzaF0gPSBjb250YWluZXJzW2NvbnRhaW5lckhhc2hdIHx8IFtdO1xuICAgIHZhciBlbGVtZW50cyA9IGNvbnRhaW5lcnNbY29udGFpbmVySGFzaF07XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBlbGVtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoZWxlbWVudHNbaV0uZ2V0KDApID09PSAkZWxlbWVudC5nZXQoMCkpIHtcbiAgICAgICAgICAgIHJldHVybjsgLy8gV2UndmUgYWxyZWFkeSBnb3QgdGhpcyBhc3NvY2lhdGlvblxuICAgICAgICB9XG4gICAgfVxuICAgIGVsZW1lbnRzLnB1c2goJGVsZW1lbnQpO1xufVxuXG5mdW5jdGlvbiByZW1vdmVFbGVtZW50KGNvbnRhaW5lckhhc2gsIHBhZ2VIYXNoLCAkZWxlbWVudCkge1xuICAgIHZhciBjb250YWluZXJzID0gcGFnZXNbcGFnZUhhc2hdIHx8IHt9O1xuICAgIHZhciBlbGVtZW50cyA9IGNvbnRhaW5lcnNbY29udGFpbmVySGFzaF0gfHwgW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBlbGVtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoZWxlbWVudHNbaV0uZ2V0KDApID09PSAkZWxlbWVudC5nZXQoMCkpIHtcbiAgICAgICAgICAgIGVsZW1lbnRzLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgIGlmIChlbGVtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICBkZWxldGUgY29udGFpbmVyc1tjb250YWluZXJIYXNoXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLy8gV2hlbiB3ZSBmaXJzdCBzY2FuIGEgcGFnZSwgdGhlIFwiaGFzaFwiIGlzIGp1c3QgdGhlIFVSTCB3aGlsZSB3ZSB3YWl0IHRvIGhlYXIgYmFjayBmcm9tIHRoZSBzZXJ2ZXIsIHRoZW4gaXQncyB1cGRhdGVkXG4vLyB0byB3aGF0ZXZlciB2YWx1ZSB0aGUgc2VydmVyIGNvbXB1dGVkLiBTbyBoZXJlIHdlIGFsbG93IG91ciBtYXBwaW5nIHRvIGJlIHVwZGF0ZWQgd2hlbiB0aGF0IGNoYW5nZSBoYXBwZW5zLlxuZnVuY3Rpb24gdXBkYXRlUGFnZUhhc2gob2xkUGFnZUhhc2gsIG5ld1BhZ2VIYXNoKSB7XG4gICAgcGFnZXNbbmV3UGFnZUhhc2hdID0gcGFnZXNbb2xkUGFnZUhhc2hdO1xuICAgIGRlbGV0ZSBwYWdlc1tvbGRQYWdlSGFzaF07XG59XG5cbmZ1bmN0aW9uIHRlYXJkb3duKCkge1xuICAgIHBhZ2VzID0ge307XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBnZXRFbGVtZW50OiBnZXRFbGVtZW50LFxuICAgIHNldEVsZW1lbnQ6IHNldEVsZW1lbnQsXG4gICAgcmVtb3ZlRWxlbWVudDogcmVtb3ZlRWxlbWVudCxcbiAgICB1cGRhdGVQYWdlSGFzaDogdXBkYXRlUGFnZUhhc2gsXG4gICAgdGVhcmRvd246IHRlYXJkb3duXG59OyIsInZhciAkOyByZXF1aXJlKCcuL3V0aWxzL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIFJhY3RpdmU7IHJlcXVpcmUoJy4vdXRpbHMvcmFjdGl2ZS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihsb2FkZWRSYWN0aXZlKSB7IFJhY3RpdmUgPSBsb2FkZWRSYWN0aXZlO30pO1xudmFyIFJhbmdlID0gcmVxdWlyZSgnLi91dGlscy9yYW5nZScpO1xuXG52YXIgRXZlbnRzID0gcmVxdWlyZSgnLi9ldmVudHMnKTtcbnZhciBIYXNoZWRFbGVtZW50cyA9IHJlcXVpcmUoJy4vaGFzaGVkLWVsZW1lbnRzJyk7XG52YXIgUGFnZURhdGEgPSByZXF1aXJlKCcuL3BhZ2UtZGF0YScpO1xudmFyIFNWR3MgPSByZXF1aXJlKCcuL3N2Z3MnKTtcblxudmFyIHBhZ2VTZWxlY3RvciA9ICcuYW50ZW5uYS1sb2NhdGlvbnMtcGFnZSc7XG5cbmZ1bmN0aW9uIGNyZWF0ZVBhZ2Uob3B0aW9ucykge1xuICAgIHZhciBlbGVtZW50ID0gb3B0aW9ucy5lbGVtZW50O1xuICAgIHZhciByZWFjdGlvbkxvY2F0aW9uRGF0YSA9IG9wdGlvbnMucmVhY3Rpb25Mb2NhdGlvbkRhdGE7XG4gICAgdmFyIHBhZ2VEYXRhID0gb3B0aW9ucy5wYWdlRGF0YTtcbiAgICB2YXIgZ3JvdXBTZXR0aW5ncyA9IG9wdGlvbnMuZ3JvdXBTZXR0aW5ncztcbiAgICB2YXIgY2xvc2VXaW5kb3cgPSBvcHRpb25zLmNsb3NlV2luZG93O1xuICAgIHZhciBnb0JhY2sgPSBvcHRpb25zLmdvQmFjaztcbiAgICB2YXIgcmFjdGl2ZSA9IFJhY3RpdmUoe1xuICAgICAgICBlbDogZWxlbWVudCxcbiAgICAgICAgYXBwZW5kOiB0cnVlLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICBsb2NhdGlvbkRhdGE6IHJlYWN0aW9uTG9jYXRpb25EYXRhLFxuICAgICAgICAgICAgcGFnZVJlYWN0aW9uQ291bnQ6IHBhZ2VSZWFjdGlvbkNvdW50KHJlYWN0aW9uTG9jYXRpb25EYXRhKSxcbiAgICAgICAgICAgIGNhbkxvY2F0ZTogZnVuY3Rpb24oY29udGFpbmVySGFzaCkge1xuICAgICAgICAgICAgICAgIC8vIFRPRE86IGlzIHRoZXJlIGEgYmV0dGVyIHdheSB0byBoYW5kbGUgcmVhY3Rpb25zIHRvIGhhc2hlcyB0aGF0IGFyZSBubyBsb25nZXIgb24gdGhlIHBhZ2U/XG4gICAgICAgICAgICAgICAgLy8gICAgICAgc2hvdWxkIHdlIHByb3ZpZGUgc29tZSBraW5kIG9mIGluZGljYXRpb24gd2hlbiB3ZSBmYWlsIHRvIGxvY2F0ZSBhIGhhc2ggb3IganVzdCBsZWF2ZSBpdCBhcyBpcz9cbiAgICAgICAgICAgICAgICAvLyBUT0RPOiBEb2VzIGl0IG1ha2Ugc2Vuc2UgdG8gZXZlbiBzaG93IGVudHJpZXMgdGhhdCB3ZSBjYW4ndCBsb2NhdGU/IFByb2JhYmx5IG5vdC5cbiAgICAgICAgICAgICAgICByZXR1cm4gSGFzaGVkRWxlbWVudHMuZ2V0RWxlbWVudChjb250YWluZXJIYXNoLCBwYWdlRGF0YS5wYWdlSGFzaCkgIT09IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgdGVtcGxhdGU6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9sb2NhdGlvbnMtcGFnZS5oYnMuaHRtbCcpLFxuICAgICAgICBwYXJ0aWFsczoge1xuICAgICAgICAgICAgbGVmdDogU1ZHcy5sZWZ0LFxuICAgICAgICAgICAgZmlsbTogU1ZHcy5maWxtXG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByYWN0aXZlLm9uKCdiYWNrJywgZ29CYWNrKTtcbiAgICByYWN0aXZlLm9uKCdyZXZlYWwnLCByZXZlYWxDb250ZW50KTtcbiAgICByZXR1cm4ge1xuICAgICAgICBzZWxlY3RvcjogcGFnZVNlbGVjdG9yLFxuICAgICAgICB0ZWFyZG93bjogZnVuY3Rpb24oKSB7IHJhY3RpdmUudGVhcmRvd24oKTsgfVxuICAgIH07XG5cblxuICAgIGZ1bmN0aW9uIHJldmVhbENvbnRlbnQocmFjdGl2ZUV2ZW50KSB7XG4gICAgICAgIHZhciBsb2NhdGlvbkRhdGEgPSByYWN0aXZlRXZlbnQuY29udGV4dDtcbiAgICAgICAgdmFyIGVsZW1lbnQgPSBIYXNoZWRFbGVtZW50cy5nZXRFbGVtZW50KGxvY2F0aW9uRGF0YS5jb250YWluZXJIYXNoLCBwYWdlRGF0YS5wYWdlSGFzaCk7XG4gICAgICAgIGlmIChlbGVtZW50KSB7XG4gICAgICAgICAgICB2YXIgZXZlbnQgPSByYWN0aXZlRXZlbnQub3JpZ2luYWw7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICBjbG9zZVdpbmRvdygpO1xuICAgICAgICAgICAgdmFyIHRhcmdldFNjcm9sbFRvcCA9ICQoZWxlbWVudCkub2Zmc2V0KCkudG9wIC0gMTMwO1xuICAgICAgICAgICAgJCgnaHRtbCxib2R5JykuYW5pbWF0ZSh7c2Nyb2xsVG9wOiB0YXJnZXRTY3JvbGxUb3B9LCAxMDAwKTtcbiAgICAgICAgICAgIGlmIChsb2NhdGlvbkRhdGEua2luZCA9PT0gJ3R4dCcpIHsgLy8gVE9ETzogc29tZXRoaW5nIGJldHRlciB0aGFuIGEgc3RyaW5nIGNvbXBhcmUuIGZpeCB0aGlzIGFsb25nIHdpdGggdGhlIHNhbWUgaXNzdWUgaW4gcGFnZS1kYXRhXG4gICAgICAgICAgICAgICAgUmFuZ2UuaGlnaGxpZ2h0KGVsZW1lbnQuZ2V0KDApLCBsb2NhdGlvbkRhdGEubG9jYXRpb24pO1xuICAgICAgICAgICAgICAgICQoZG9jdW1lbnQpLm9uKCdjbGljay5hbnRlbm5hJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIFJhbmdlLmNsZWFySGlnaGxpZ2h0cygpO1xuICAgICAgICAgICAgICAgICAgICAkKGRvY3VtZW50KS5vZmYoJ2NsaWNrLmFudGVubmEnKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBjb250YWluZXJEYXRhID0gUGFnZURhdGEuZ2V0Q29udGFpbmVyRGF0YShwYWdlRGF0YSwgbG9jYXRpb25EYXRhLmNvbnRhaW5lckhhc2gpO1xuICAgICAgICAgICAgRXZlbnRzLnBvc3RDb250ZW50Vmlld2VkKHBhZ2VEYXRhLCBjb250YWluZXJEYXRhLGxvY2F0aW9uRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIHBhZ2VSZWFjdGlvbkNvdW50KHJlYWN0aW9uTG9jYXRpb25EYXRhKSB7XG4gICAgZm9yICh2YXIgY29udGVudElEIGluIHJlYWN0aW9uTG9jYXRpb25EYXRhKSB7XG4gICAgICAgIGlmIChyZWFjdGlvbkxvY2F0aW9uRGF0YS5oYXNPd25Qcm9wZXJ0eShjb250ZW50SUQpKSB7XG4gICAgICAgICAgICB2YXIgY29udGVudExvY2F0aW9uRGF0YSA9IHJlYWN0aW9uTG9jYXRpb25EYXRhW2NvbnRlbnRJRF07XG4gICAgICAgICAgICBpZiAoY29udGVudExvY2F0aW9uRGF0YS5raW5kID09PSAncGFnJykgeyAvLyBUT0RPOiBzb21ldGhpbmcgYmV0dGVyIHRoYW4gYSBzdHJpbmcgY29tcGFyZS4gZml4IHRoaXMgYWxvbmcgd2l0aCB0aGUgc2FtZSBpc3N1ZSBpbiBwYWdlLWRhdGFcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udGVudExvY2F0aW9uRGF0YS5jb3VudDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZTogY3JlYXRlUGFnZVxufTsiLCJ2YXIgUmFjdGl2ZTsgcmVxdWlyZSgnLi91dGlscy9yYWN0aXZlLXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGxvYWRlZFJhY3RpdmUpIHsgUmFjdGl2ZSA9IGxvYWRlZFJhY3RpdmU7fSk7XG52YXIgVVJMcyA9IHJlcXVpcmUoJy4vdXRpbHMvdXJscycpO1xudmFyIFVzZXIgPSByZXF1aXJlKCcuL3V0aWxzL3VzZXInKTtcblxudmFyIEV2ZW50cyA9IHJlcXVpcmUoJy4vZXZlbnRzJyk7XG52YXIgU1ZHcyA9IHJlcXVpcmUoJy4vc3ZncycpO1xuXG52YXIgcGFnZVNlbGVjdG9yID0gJy5hbnRlbm5hLWxvZ2luLXBhZ2UnO1xuXG5mdW5jdGlvbiBjcmVhdGVQYWdlKG9wdGlvbnMpIHtcbiAgICB2YXIgZ3JvdXBTZXR0aW5ncyA9IG9wdGlvbnMuZ3JvdXBTZXR0aW5ncztcbiAgICB2YXIgZ29CYWNrID0gb3B0aW9ucy5nb0JhY2s7XG4gICAgdmFyIHJldHJ5ID0gb3B0aW9ucy5yZXRyeTtcbiAgICB2YXIgZWxlbWVudCA9IG9wdGlvbnMuZWxlbWVudDtcbiAgICB2YXIgcmFjdGl2ZSA9IFJhY3RpdmUoe1xuICAgICAgICBlbDogZWxlbWVudCxcbiAgICAgICAgYXBwZW5kOiB0cnVlLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICBncm91cE5hbWU6IGVuY29kZVVSSShncm91cFNldHRpbmdzLmdyb3VwTmFtZSgpKVxuICAgICAgICB9LFxuICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL2xvZ2luLXBhZ2UuaGJzLmh0bWwnKSxcbiAgICAgICAgcGFydGlhbHM6IHtcbiAgICAgICAgICAgIGxlZnQ6IFNWR3MubGVmdCxcbiAgICAgICAgICAgIGxvZ286IFNWR3MubG9nb1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmFjdGl2ZS5vbignYmFjaycsIGZ1bmN0aW9uKCkge1xuICAgICAgICBnb0JhY2soKTtcbiAgICB9KTtcbiAgICByYWN0aXZlLm9uKCdmYWNlYm9va0xvZ2luJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIHNob3dMb2dpblBlbmRpbmcoKTtcbiAgICAgICAgRXZlbnRzLnBvc3RGYWNlYm9va0xvZ2luU3RhcnQoZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIFVzZXIuZmFjZWJvb2tMb2dpbihncm91cFNldHRpbmdzLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciB1c2VySW5mbyA9IFVzZXIuY2FjaGVkVXNlcigpO1xuICAgICAgICAgICAgaWYgKHVzZXJJbmZvLnVzZXJfdHlwZSAhPT0gJ2ZhY2Vib29rJykge1xuICAgICAgICAgICAgICAgIEV2ZW50cy5wb3N0RmFjZWJvb2tMb2dpbkZhaWwoZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkb1JldHJ5KCk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICAgIHJhY3RpdmUub24oJ2FudGVubmFMb2dpbicsIGZ1bmN0aW9uKCkge1xuICAgICAgICBzaG93TG9naW5QZW5kaW5nKCk7XG4gICAgICAgIG9wZW5BbnRlbm5hTG9naW5XaW5kb3coZG9SZXRyeSk7XG4gICAgfSk7XG4gICAgcmFjdGl2ZS5vbigncmV0cnknLCBmdW5jdGlvbigpIHtcbiAgICAgICAgZG9SZXRyeSgpO1xuICAgIH0pO1xuICAgIHZhciBhbnRlbm5hTG9naW5XaW5kb3c7XG4gICAgdmFyIGFudGVubmFMb2dpbkNhbmNlbGxlZCA9IGZhbHNlO1xuICAgIHJldHVybiB7XG4gICAgICAgIHNlbGVjdG9yOiBwYWdlU2VsZWN0b3IsXG4gICAgICAgIHRlYXJkb3duOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJhY3RpdmUudGVhcmRvd24oKTtcbiAgICAgICAgICAgIGNhbmNlbEFudGVubmFMb2dpbigpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIGRvUmV0cnkoKSB7XG4gICAgICAgIHJldHJ5KCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gb3BlbkFudGVubmFMb2dpbldpbmRvdyhjYWxsYmFjaykge1xuICAgICAgICBpZiAoYW50ZW5uYUxvZ2luV2luZG93ICYmICFhbnRlbm5hTG9naW5XaW5kb3cuY2xvc2VkKSB7XG4gICAgICAgICAgICBhbnRlbm5hTG9naW5XaW5kb3cuZm9jdXMoKTsgLy8gQnJpbmcgdGhlIHdpbmRvdyB0byB0aGUgZnJvbnQgaWYgaXQncyBhbHJlYWR5IG9wZW4uXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBFdmVudHMucG9zdEFudGVubmFMb2dpblN0YXJ0KGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgdmFyIHdpbmRvd0lkID0gJ2FudGVubmFfbG9naW4nO1xuICAgICAgICAgICAgdmFyIHdpbmRvd1Byb3BlcnRpZXMgPSBjb21wdXRlV2luZG93UHJvcGVydGllcygpO1xuICAgICAgICAgICAgYW50ZW5uYUxvZ2luV2luZG93ID0gd2luZG93Lm9wZW4oVVJMcy5hcHBTZXJ2ZXJVcmwoKSArIFVSTHMuYW50ZW5uYUxvZ2luVXJsKCksIHdpbmRvd0lkLCB3aW5kb3dQcm9wZXJ0aWVzKTtcbiAgICAgICAgICAgIHZhciBpbnRlcnZhbCA9IHNldEludGVydmFsKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIC8vIFdhdGNoIGZvciB0aGUgd2luZG93IHRvIGNsb3NlLCB0aGVuIGdvIHJlYWQgdGhlIGxhdGVzdCBjb29raWVzLlxuICAgICAgICAgICAgICAgIGlmIChhbnRlbm5hTG9naW5XaW5kb3cgJiYgYW50ZW5uYUxvZ2luV2luZG93LmNsb3NlZCkge1xuICAgICAgICAgICAgICAgICAgICBjbGVhckludGVydmFsKGludGVydmFsKTtcbiAgICAgICAgICAgICAgICAgICAgYW50ZW5uYUxvZ2luV2luZG93ID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFhbnRlbm5hTG9naW5DYW5jZWxsZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBvbGRVc2VySW5mbyA9IFVzZXIuY2FjaGVkVXNlcigpIHx8IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgVXNlci5yZWZyZXNoVXNlckZyb21Db29raWVzKGZ1bmN0aW9uICh1c2VySW5mbykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh1c2VySW5mbyAmJiB1c2VySW5mby50ZW1wX3VzZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgRXZlbnRzLnBvc3RBbnRlbm5hTG9naW5GYWlsKGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCA1MCk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBjb21wdXRlV2luZG93UHJvcGVydGllcygpIHtcbiAgICAgICAgICAgIHZhciB3ID0gNDAwO1xuICAgICAgICAgICAgdmFyIGggPSAzNTA7XG4gICAgICAgICAgICB2YXIgbCA9ICh3aW5kb3cuc2NyZWVuLndpZHRoLzIpLSh3LzIpO1xuICAgICAgICAgICAgdmFyIHQgPSAod2luZG93LnNjcmVlbi5oZWlnaHQvMiktKGgvMik7XG4gICAgICAgICAgICByZXR1cm4gJ21lbnViYXI9MSxyZXNpemFibGU9MSxzY3JvbGxiYXJzPXllcyx3aWR0aD0nK3crJyxoZWlnaHQ9JytoKycsdG9wPScrdCsnLGxlZnQ9JytsO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY2FuY2VsQW50ZW5uYUxvZ2luKCkge1xuICAgICAgICAvLyBDbG9zZS9jYW5jZWwgYW55IGxvZ2luIHdpbmRvd3MgdGhhdCB3ZSBoYXZlIG9wZW4uXG4gICAgICAgIGlmIChhbnRlbm5hTG9naW5XaW5kb3cgJiYgIWFudGVubmFMb2dpbldpbmRvdy5jbG9zZWQpIHtcbiAgICAgICAgICAgIGFudGVubmFMb2dpbkNhbmNlbGxlZCA9IHRydWU7XG4gICAgICAgICAgICBhbnRlbm5hTG9naW5XaW5kb3cuY2xvc2UoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNob3dMb2dpblBlbmRpbmcoKSB7XG4gICAgICAgICQocmFjdGl2ZS5maW5kKCcuYW50ZW5uYS1sb2dpbi1jb250ZW50JykpLmhpZGUoKTtcbiAgICAgICAgJChyYWN0aXZlLmZpbmQoJy5hbnRlbm5hLWxvZ2luLXBlbmRpbmcnKSkuc2hvdygpO1xuICAgIH1cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZVBhZ2U6IGNyZWF0ZVBhZ2Vcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgUmFjdGl2ZTsgcmVxdWlyZSgnLi91dGlscy9yYWN0aXZlLXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGxvYWRlZFJhY3RpdmUpIHsgUmFjdGl2ZSA9IGxvYWRlZFJhY3RpdmU7fSk7XG52YXIgUmVhY3Rpb25zV2lkZ2V0ID0gcmVxdWlyZSgnLi9yZWFjdGlvbnMtd2lkZ2V0Jyk7XG52YXIgU1ZHcyA9IHJlcXVpcmUoJy4vc3ZncycpO1xuXG52YXIgQXBwTW9kZSA9IHJlcXVpcmUoJy4vdXRpbHMvYXBwLW1vZGUnKTtcbnZhciBCcm93c2VyTWV0cmljcyA9IHJlcXVpcmUoJy4vdXRpbHMvYnJvd3Nlci1tZXRyaWNzJyk7XG52YXIgTXV0YXRpb25PYnNlcnZlciA9IHJlcXVpcmUoJy4vdXRpbHMvbXV0YXRpb24tb2JzZXJ2ZXInKTtcbnZhciBUaHJvdHRsZWRFdmVudHMgPSByZXF1aXJlKCcuL3V0aWxzL3Rocm90dGxlZC1ldmVudHMnKTtcbnZhciBUb3VjaFN1cHBvcnQgPSByZXF1aXJlKCcuL3V0aWxzL3RvdWNoLXN1cHBvcnQnKTtcbnZhciBWaXNpYmlsaXR5ID0gcmVxdWlyZSgnLi91dGlscy92aXNpYmlsaXR5Jyk7XG5cbnZhciBDTEFTU19BQ1RJVkUgPSAnYW50ZW5uYS1hY3RpdmUnO1xuXG5mdW5jdGlvbiBjcmVhdGVJbmRpY2F0b3JXaWRnZXQob3B0aW9ucykge1xuICAgIC8vIFRPRE86IHZhbGlkYXRlIHRoYXQgb3B0aW9ucyBjb250YWlucyBhbGwgcmVxdWlyZWQgcHJvcGVydGllcyAoYXBwbGllcyB0byBhbGwgd2lkZ2V0cykuXG4gICAgdmFyIGVsZW1lbnQgPSBvcHRpb25zLmVsZW1lbnQ7XG4gICAgdmFyIGNvbnRhaW5lckRhdGEgPSBvcHRpb25zLmNvbnRhaW5lckRhdGE7XG4gICAgdmFyICRjb250YWluZXJFbGVtZW50ID0gb3B0aW9ucy5jb250YWluZXJFbGVtZW50O1xuICAgIHZhciBwYWdlRGF0YSA9IG9wdGlvbnMucGFnZURhdGE7XG4gICAgdmFyIGdyb3VwU2V0dGluZ3MgPSBvcHRpb25zLmdyb3VwU2V0dGluZ3M7XG4gICAgdmFyIGRlZmF1bHRSZWFjdGlvbnMgPSBvcHRpb25zLmRlZmF1bHRSZWFjdGlvbnM7XG4gICAgdmFyIGNvbnRlbnREYXRhID0gb3B0aW9ucy5jb250ZW50RGF0YTtcbiAgICB2YXIgcmFjdGl2ZSA9IFJhY3RpdmUoe1xuICAgICAgICBlbDogZWxlbWVudCxcbiAgICAgICAgYXBwZW5kOiB0cnVlLFxuICAgICAgICBtYWdpYzogdHJ1ZSxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgY29udGFpbmVyRGF0YTogY29udGFpbmVyRGF0YSxcbiAgICAgICAgICAgIHN1cHBvcnRzVG91Y2g6IEJyb3dzZXJNZXRyaWNzLnN1cHBvcnRzVG91Y2goKSxcbiAgICAgICAgICAgIGV4dHJhQXR0cmlidXRlczogQXBwTW9kZS5kZWJ1ZyA/ICdhbnQtaGFzaD1cIicgKyBjb250YWluZXJEYXRhLmhhc2ggKyAnXCInIDogJycgLy8gVE9ETzogdGhpcyBhYm91dCBtYWtpbmcgdGhpcyBhIGRlY29yYXRvciBoYW5kbGVkIGJ5IGEgXCJEZWJ1Z1wiIG1vZHVsZVxuICAgICAgICB9LFxuICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL21lZGlhLWluZGljYXRvci13aWRnZXQuaGJzLmh0bWwnKSxcbiAgICAgICAgcGFydGlhbHM6IHtcbiAgICAgICAgICAgIGxvZ286IFNWR3MubG9nb1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICB2YXIgcmVhY3Rpb25XaWRnZXRPcHRpb25zID0ge1xuICAgICAgICByZWFjdGlvbnNEYXRhOiBjb250YWluZXJEYXRhLnJlYWN0aW9ucyxcbiAgICAgICAgY29udGFpbmVyRGF0YTogY29udGFpbmVyRGF0YSxcbiAgICAgICAgY29udGFpbmVyRWxlbWVudDogJGNvbnRhaW5lckVsZW1lbnQsXG4gICAgICAgIGNvbnRlbnREYXRhOiBjb250ZW50RGF0YSxcbiAgICAgICAgZGVmYXVsdFJlYWN0aW9uczogZGVmYXVsdFJlYWN0aW9ucyxcbiAgICAgICAgcGFnZURhdGE6IHBhZ2VEYXRhLFxuICAgICAgICBncm91cFNldHRpbmdzOiBncm91cFNldHRpbmdzXG4gICAgfTtcblxuICAgIHZhciBob3ZlclRpbWVvdXQ7XG4gICAgdmFyIGFjdGl2ZVRpbWVvdXQ7XG5cbiAgICB2YXIgJHJvb3RFbGVtZW50ID0gJChyb290RWxlbWVudChyYWN0aXZlKSk7XG4gICAgVG91Y2hTdXBwb3J0LnNldHVwVGFwKCRyb290RWxlbWVudC5nZXQoMCksIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBvcGVuUmVhY3Rpb25zV2luZG93KHJlYWN0aW9uV2lkZ2V0T3B0aW9ucywgcmFjdGl2ZSk7XG4gICAgfSk7XG4gICAgJHJvb3RFbGVtZW50Lm9uKCdtb3VzZWVudGVyLmFudGVubmEnLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBpZiAoZXZlbnQuYnV0dG9ucyA+IDAgfHwgKGV2ZW50LmJ1dHRvbnMgPT0gdW5kZWZpbmVkICYmIGV2ZW50LndoaWNoID4gMCkpIHsgLy8gT24gU2FmYXJpLCBldmVudC5idXR0b25zIGlzIHVuZGVmaW5lZCBidXQgZXZlbnQud2hpY2ggZ2l2ZXMgYSBnb29kIHZhbHVlLiBldmVudC53aGljaCBpcyBiYWQgb24gRkZcbiAgICAgICAgICAgIC8vIERvbid0IHJlYWN0IGlmIHRoZSB1c2VyIGlzIGRyYWdnaW5nIG9yIHNlbGVjdGluZyB0ZXh0LlxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjb250YWluZXJEYXRhLnJlYWN0aW9ucy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBvcGVuUmVhY3Rpb25zV2luZG93KHJlYWN0aW9uV2lkZ2V0T3B0aW9ucywgcmFjdGl2ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjbGVhclRpbWVvdXQoaG92ZXJUaW1lb3V0KTtcbiAgICAgICAgICAgIGhvdmVyVGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgb3BlblJlYWN0aW9uc1dpbmRvdyhyZWFjdGlvbldpZGdldE9wdGlvbnMsIHJhY3RpdmUpO1xuICAgICAgICAgICAgfSwgNTApO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgJHJvb3RFbGVtZW50Lm9uKCdtb3VzZWxlYXZlLmFudGVubmEnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KGhvdmVyVGltZW91dCk7XG4gICAgICAgIGNsZWFyVGltZW91dChhY3RpdmVUaW1lb3V0KTtcbiAgICB9KTtcbiAgICAkY29udGFpbmVyRWxlbWVudC5vbignbW91c2VlbnRlci5hbnRlbm5hJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIGNsZWFyVGltZW91dChhY3RpdmVUaW1lb3V0KTtcbiAgICAgICAgYWN0aXZlVGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAkcm9vdEVsZW1lbnQuYWRkQ2xhc3MoQ0xBU1NfQUNUSVZFKTtcbiAgICAgICAgfSwgNTAwKTtcbiAgICB9KTtcbiAgICAkY29udGFpbmVyRWxlbWVudC5vbignbW91c2VsZWF2ZS5hbnRlbm5hJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIGNsZWFyVGltZW91dChhY3RpdmVUaW1lb3V0KTtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICRyb290RWxlbWVudC5yZW1vdmVDbGFzcyhDTEFTU19BQ1RJVkUpO1xuICAgICAgICB9LCAxMDApOyAvLyBXZSBnZXQgYSBtb3VzZWxlYXZlIGV2ZW50IHdoZW4gdGhlIHVzZXIgaG92ZXJzIHRoZSBpbmRpY2F0b3IuIFBhdXNlIGxvbmcgZW5vdWdoIHRoYXQgdGhlIHJlYWN0aW9uIHdpbmRvdyBjYW4gb3BlbiBpZiB0aGV5IGhvdmVyLlxuICAgIH0pO1xuICAgIHNldHVwUG9zaXRpb25pbmcoJGNvbnRhaW5lckVsZW1lbnQsIGdyb3VwU2V0dGluZ3MsIHJhY3RpdmUpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgdGVhcmRvd246IGZ1bmN0aW9uKCkgeyByYWN0aXZlLnRlYXJkb3duKCk7IH1cbiAgICB9O1xufVxuXG5mdW5jdGlvbiBzZXR1cFBvc2l0aW9uaW5nKCRjb250YWluZXJFbGVtZW50LCBncm91cFNldHRpbmdzLCByYWN0aXZlKSB7XG4gICAgdmFyICR3cmFwcGVyRWxlbWVudCA9ICQod3JhcHBlckVsZW1lbnQocmFjdGl2ZSkpO1xuICAgIHZhciAkcm9vdEVsZW1lbnQgPSAkKHJvb3RFbGVtZW50KHJhY3RpdmUpKTtcbiAgICBwb3NpdGlvbkluZGljYXRvcigpO1xuXG4gICAgVGhyb3R0bGVkRXZlbnRzLm9uKCdyZXNpemUnLCBwb3NpdGlvbklmTmVlZGVkKTtcbiAgICByYWN0aXZlLm9uKCd0ZWFyZG93bicsIGZ1bmN0aW9uKCkge1xuICAgICAgICBUaHJvdHRsZWRFdmVudHMub2ZmKCdyZXNpemUnLCBwb3NpdGlvbklmTmVlZGVkKTtcbiAgICB9KTtcbiAgICBUaHJvdHRsZWRFdmVudHMub24oJ3Njcm9sbCcsIHBvc2l0aW9uSWZOZWVkZWQpO1xuICAgIHJhY3RpdmUub24oJ3RlYXJkb3duJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIFRocm90dGxlZEV2ZW50cy5vZmYoJ3Njcm9sbCcsIHBvc2l0aW9uSWZOZWVkZWQpO1xuICAgIH0pO1xuXG4gICAgLy8gVE9ETzogY29uc2lkZXIgYWxzbyBsaXN0ZW5pbmcgdG8gc3JjIGF0dHJpYnV0ZSBjaGFuZ2VzLCB3aGljaCBtaWdodCBhZmZlY3QgdGhlIGhlaWdodCBvZiBlbGVtZW50cyBvbiB0aGUgcGFnZVxuICAgIE11dGF0aW9uT2JzZXJ2ZXIuYWRkQWRkaXRpb25MaXN0ZW5lcihlbGVtZW50c0FkZGVkT3JSZW1vdmVkKTtcbiAgICBNdXRhdGlvbk9ic2VydmVyLmFkZFJlbW92YWxMaXN0ZW5lcihlbGVtZW50c1JlbW92ZWQpO1xuXG4gICAgZnVuY3Rpb24gZWxlbWVudHNSZW1vdmVkKCRlbGVtZW50cykge1xuICAgICAgICAvLyBTcGVjaWFsIGNhc2U6IElmIHdlIHNlZSB0aGF0IG91ciBvd24gcmVhZG1vcmUgZWxlbWVudHMgYXJlIHJlbW92ZWQsXG4gICAgICAgIC8vIGFsd2F5cyB1cGRhdGUgb3VyIGluZGljYXRvcnMgYmVjYXVzZSB0aGVpciB2aXNpYmlsaXR5IG1pZ2h0IGhhdmUgY2hhbmdlZC5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAkZWxlbWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciAkZWxlbWVudCA9ICRlbGVtZW50c1tpXTtcbiAgICAgICAgICAgIGlmICgkZWxlbWVudC5oYXNDbGFzcygnYW50ZW5uYS1yZWFkbW9yZScpfHwgJGVsZW1lbnQuaGFzQ2xhc3MoJ2FudGVubmEtY29udGVudC1yZWMtcmVhZG1vcmUnKSkge1xuICAgICAgICAgICAgICAgIHBvc2l0aW9uSW5kaWNhdG9yKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsZW1lbnRzQWRkZWRPclJlbW92ZWQoJGVsZW1lbnRzKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBlbGVtZW50c0FkZGVkT3JSZW1vdmVkKCRlbGVtZW50cykge1xuICAgICAgICAvLyBSZXBvc2l0aW9uIHRoZSBpbmRpY2F0b3IgaWYgZWxlbWVudHMgd2hpY2ggbWlnaHQgYWRqdXN0IHRoZSBjb250YWluZXIncyBwb3NpdGlvbiBhcmUgYWRkZWQvcmVtb3ZlZC5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAkZWxlbWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciAkZWxlbWVudCA9ICRlbGVtZW50c1tpXTtcbiAgICAgICAgICAgIGlmICgkZWxlbWVudC5oZWlnaHQoKSA+IDApIHtcbiAgICAgICAgICAgICAgICBwb3NpdGlvbklmTmVlZGVkKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgdmFyIGxhc3RDb250YWluZXJPZmZzZXQgPSAkY29udGFpbmVyRWxlbWVudC5vZmZzZXQoKTtcbiAgICB2YXIgbGFzdENvbnRhaW5lckhlaWdodCA9ICRjb250YWluZXJFbGVtZW50LmhlaWdodCgpO1xuICAgIHZhciBsYXN0Q29udGFpbmVyVmlzaWJpbGl0eSA9IFZpc2liaWxpdHkuaXNWaXNpYmxlKCRjb250YWluZXJFbGVtZW50LmdldCgwKSk7XG5cbiAgICBmdW5jdGlvbiBwb3NpdGlvbklmTmVlZGVkKCkge1xuICAgICAgICB2YXIgY29udGFpbmVyT2Zmc2V0ID0gJGNvbnRhaW5lckVsZW1lbnQub2Zmc2V0KCk7XG4gICAgICAgIHZhciBjb250YWluZXJIZWlnaHQgPSAkY29udGFpbmVyRWxlbWVudC5oZWlnaHQoKTtcbiAgICAgICAgdmFyIGNvbnRhaW5lclZpc2liaWxpdHkgPSBWaXNpYmlsaXR5LmlzVmlzaWJsZSgkY29udGFpbmVyRWxlbWVudC5nZXQoMCkpO1xuICAgICAgICBpZiAoY29udGFpbmVyT2Zmc2V0LnRvcCA9PT0gbGFzdENvbnRhaW5lck9mZnNldC50b3AgJiZcbiAgICAgICAgICAgIGNvbnRhaW5lck9mZnNldC5sZWZ0ID09PSBsYXN0Q29udGFpbmVyT2Zmc2V0LmxlZnQgJiZcbiAgICAgICAgICAgIGNvbnRhaW5lckhlaWdodCA9PT0gbGFzdENvbnRhaW5lckhlaWdodCAmJlxuICAgICAgICAgICAgY29udGFpbmVyVmlzaWJpbGl0eSA9PT0gbGFzdENvbnRhaW5lclZpc2liaWxpdHkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBsYXN0Q29udGFpbmVyT2Zmc2V0ID0gY29udGFpbmVyT2Zmc2V0O1xuICAgICAgICBsYXN0Q29udGFpbmVySGVpZ2h0ID0gY29udGFpbmVySGVpZ2h0O1xuICAgICAgICBsYXN0Q29udGFpbmVyVmlzaWJpbGl0eSA9IGNvbnRhaW5lclZpc2liaWxpdHk7XG4gICAgICAgIHBvc2l0aW9uSW5kaWNhdG9yKCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcG9zaXRpb25JbmRpY2F0b3IoKSB7XG4gICAgICAgIHVwZGF0ZURpc3BsYXlGb3JWaXNpYmlsaXR5KCk7IC8vIFVwZGF0ZSB2aXNpYmlsaXR5IHdoZW5ldmVyIHdlIHBvc2l0aW9uIHRoZSBlbGVtZW50LlxuICAgICAgICAvLyBQb3NpdGlvbiB0aGUgd3JhcHBlciBlbGVtZW50ICh3aGljaCBoYXMgYSBoYXJkY29kZWQgd2lkdGgpIGluIHRoZSBhcHByb3ByaWF0ZSBjb3JuZXIuIFRoZW4gZmxpcCB0aGUgbGVmdC9yaWdodFxuICAgICAgICAvLyBwb3NpdGlvbmluZyBvZiB0aGUgbmVzdGVkIHdpZGdldCBlbGVtZW50IHRvIGFkanVzdCB0aGUgd2F5IGl0IHdpbGwgZXhwYW5kIHdoZW4gdGhlIG1lZGlhIGlzIGhvdmVyZWQuXG4gICAgICAgIHZhciBjb3JuZXIgPSBncm91cFNldHRpbmdzLm1lZGlhSW5kaWNhdG9yQ29ybmVyKCk7XG4gICAgICAgIHZhciBlbGVtZW50T2Zmc2V0ID0gJGNvbnRhaW5lckVsZW1lbnQub2Zmc2V0KCk7XG4gICAgICAgIHZhciBjb29yZHMgPSB7fTtcbiAgICAgICAgaWYgKGNvcm5lci5pbmRleE9mKCd0b3AnKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIGNvb3Jkcy50b3AgPSBlbGVtZW50T2Zmc2V0LnRvcDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciBib3JkZXJUb3AgPSBwYXJzZUludCgkY29udGFpbmVyRWxlbWVudC5jc3MoJ2JvcmRlci10b3AnKSkgfHwgMDtcbiAgICAgICAgICAgIGNvb3Jkcy50b3AgPSBlbGVtZW50T2Zmc2V0LnRvcCArICRjb250YWluZXJFbGVtZW50LmhlaWdodCgpICsgYm9yZGVyVG9wIC0gJHJvb3RFbGVtZW50Lm91dGVySGVpZ2h0KCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvcm5lci5pbmRleE9mKCdyaWdodCcpICE9PSAtMSkge1xuICAgICAgICAgICAgY29vcmRzLmxlZnQgPSBlbGVtZW50T2Zmc2V0LmxlZnQgKyAkY29udGFpbmVyRWxlbWVudC53aWR0aCgpIC0gJHdyYXBwZXJFbGVtZW50Lm91dGVyV2lkdGgoKTtcbiAgICAgICAgICAgICRyb290RWxlbWVudC5jc3Moe3JpZ2h0OjAsbGVmdDonJ30pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyIGJvcmRlckxlZnQgPSBwYXJzZUludCgkY29udGFpbmVyRWxlbWVudC5jc3MoJ2JvcmRlci1sZWZ0JykpIHx8IDA7XG4gICAgICAgICAgICBjb29yZHMubGVmdCA9IGVsZW1lbnRPZmZzZXQubGVmdCArIGJvcmRlckxlZnQ7XG4gICAgICAgICAgICAkcm9vdEVsZW1lbnQuY3NzKHtyaWdodDonJyxsZWZ0OjB9KTtcbiAgICAgICAgfVxuICAgICAgICAkd3JhcHBlckVsZW1lbnQuY3NzKGNvb3Jkcyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdXBkYXRlRGlzcGxheUZvclZpc2liaWxpdHkoKSB7XG4gICAgICAgIC8vIEhpZGUvc2hvdyB0aGUgaW5kaWNhdG9yIGJhc2VkIG9uIHdoZXRoZXIgdGhlIGNvbnRhaW5lciBlbGVtZW50IGlzIHZpc2libGUuXG4gICAgICAgIC8vIEV4YW1wbGVzIG9mIHdoZXJlIHdlIG5lZWQgdGhlcmUgYXJlIGNhcm91c2VscyBhbmQgb3VyIG93biByZWFkbW9yZSB3aWRnZXQuXG4gICAgICAgICRyb290RWxlbWVudC5jc3Moe2Rpc3BsYXk6IFZpc2liaWxpdHkuaXNWaXNpYmxlKCRjb250YWluZXJFbGVtZW50LmdldCgwKSkgPyAnJzogJ25vbmUnfSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiB3cmFwcGVyRWxlbWVudChyYWN0aXZlKSB7XG4gICAgcmV0dXJuIHJhY3RpdmUuZmluZCgnLmFudGVubmEtbWVkaWEtaW5kaWNhdG9yLXdyYXBwZXInKTtcbn1cblxuZnVuY3Rpb24gcm9vdEVsZW1lbnQocmFjdGl2ZSkge1xuICAgIHJldHVybiByYWN0aXZlLmZpbmQoJy5hbnRlbm5hLW1lZGlhLWluZGljYXRvci13aWRnZXQnKTtcbn1cblxuZnVuY3Rpb24gb3BlblJlYWN0aW9uc1dpbmRvdyhyZWFjdGlvbk9wdGlvbnMsIHJhY3RpdmUpIHtcbiAgICBSZWFjdGlvbnNXaWRnZXQub3BlbihyZWFjdGlvbk9wdGlvbnMsIHJvb3RFbGVtZW50KHJhY3RpdmUpKTtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZTogY3JlYXRlSW5kaWNhdG9yV2lkZ2V0XG59OyIsInZhciAkOyByZXF1aXJlKCcuL3V0aWxzL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIEFqYXhDbGllbnQgPSByZXF1aXJlKCcuL3V0aWxzL2FqYXgtY2xpZW50Jyk7XG52YXIgUGFnZVV0aWxzID0gcmVxdWlyZSgnLi91dGlscy9wYWdlLXV0aWxzJyk7XG52YXIgVGhyb3R0bGVkRXZlbnRzID0gcmVxdWlyZSgnLi91dGlscy90aHJvdHRsZWQtZXZlbnRzJyk7XG52YXIgVVJMcyA9IHJlcXVpcmUoJy4vdXRpbHMvdXJscycpO1xudmFyIFBhZ2VEYXRhID0gcmVxdWlyZSgnLi9wYWdlLWRhdGEnKTtcblxuLy8gQ29tcHV0ZSB0aGUgcGFnZXMgdGhhdCB3ZSBuZWVkIHRvIGZldGNoLiBUaGlzIGlzIGVpdGhlcjpcbi8vIDEuIEFueSBuZXN0ZWQgcGFnZXMgd2UgZmluZCB1c2luZyB0aGUgcGFnZSBzZWxlY3RvciBPUlxuLy8gMi4gVGhlIGN1cnJlbnQgd2luZG93IGxvY2F0aW9uXG5mdW5jdGlvbiBjb21wdXRlUGFnZXNQYXJhbSgkcGFnZUVsZW1lbnRBcnJheSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBncm91cElkID0gZ3JvdXBTZXR0aW5ncy5ncm91cElkKCk7XG4gICAgdmFyIHBhZ2VzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCAkcGFnZUVsZW1lbnRBcnJheS5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgJHBhZ2VFbGVtZW50ID0gJHBhZ2VFbGVtZW50QXJyYXlbaV07XG4gICAgICAgIHBhZ2VzLnB1c2goe1xuICAgICAgICAgICAgZ3JvdXBfaWQ6IGdyb3VwSWQsXG4gICAgICAgICAgICB1cmw6IFBhZ2VVdGlscy5jb21wdXRlUGFnZVVybCgkcGFnZUVsZW1lbnQsIGdyb3VwU2V0dGluZ3MpLFxuICAgICAgICAgICAgdGl0bGU6IFBhZ2VVdGlscy5jb21wdXRlUGFnZVRpdGxlKCRwYWdlRWxlbWVudCwgZ3JvdXBTZXR0aW5ncylcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGlmIChwYWdlcy5sZW5ndGggPT0gMSkge1xuICAgICAgICBwYWdlc1swXS5pbWFnZSA9IFBhZ2VVdGlscy5jb21wdXRlVG9wTGV2ZWxQYWdlSW1hZ2UoZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIHBhZ2VzWzBdLmF1dGhvciA9IFBhZ2VVdGlscy5jb21wdXRlUGFnZUF1dGhvcihncm91cFNldHRpbmdzKTtcbiAgICAgICAgcGFnZXNbMF0udG9waWNzID0gUGFnZVV0aWxzLmNvbXB1dGVQYWdlVG9waWNzKGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICBwYWdlc1swXS5zZWN0aW9uID0gUGFnZVV0aWxzLmNvbXB1dGVQYWdlU2l0ZVNlY3Rpb24oZ3JvdXBTZXR0aW5ncyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHsgcGFnZXM6IHBhZ2VzIH07XG59XG5cbmZ1bmN0aW9uIGxvYWRQYWdlRGF0YShwYWdlRGF0YVBhcmFtLCBncm91cFNldHRpbmdzKSB7XG4gICAgQWpheENsaWVudC5nZXRKU09OUChVUkxzLnBhZ2VEYXRhVXJsKCksIHBhZ2VEYXRhUGFyYW0sIHN1Y2Nlc3MsIGVycm9yKTtcblxuICAgIGZ1bmN0aW9uIHN1Y2Nlc3MoanNvbikge1xuICAgICAgICAvL3NldFRpbWVvdXQoZnVuY3Rpb24oKSB7IFBhZ2VEYXRhLnVwZGF0ZUFsbFBhZ2VEYXRhKGpzb24sIGdyb3VwU2V0dGluZ3MpOyB9LCAzMDAwKTtcbiAgICAgICAgUGFnZURhdGEudXBkYXRlQWxsUGFnZURhdGEoanNvbiwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZXJyb3IobWVzc2FnZSkge1xuICAgICAgICAvLyBUT0RPIGhhbmRsZSBlcnJvcnMgdGhhdCBoYXBwZW4gd2hlbiBsb2FkaW5nIHBhZ2UgZGF0YVxuICAgICAgICBjb25zb2xlLmxvZygnQW4gZXJyb3Igb2NjdXJyZWQgbG9hZGluZyBwYWdlIGRhdGE6ICcgKyBtZXNzYWdlKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHN0YXJ0TG9hZGluZ1BhZ2VEYXRhKGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgJHBhZ2VFbGVtZW50cyA9ICQoZ3JvdXBTZXR0aW5ncy5wYWdlU2VsZWN0b3IoKSk7XG4gICAgaWYgKCRwYWdlRWxlbWVudHMubGVuZ3RoID09IDApIHtcbiAgICAgICAgJHBhZ2VFbGVtZW50cyA9ICQoJ2JvZHknKTtcbiAgICB9XG4gICAgcXVldWVQYWdlRGF0YUxvYWQoJHBhZ2VFbGVtZW50cywgZ3JvdXBTZXR0aW5ncyk7XG59XG5cbmZ1bmN0aW9uIHF1ZXVlUGFnZURhdGFMb2FkKCRwYWdlRWxlbWVudHMsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgcGFnZXNUb0xvYWQgPSBbXTtcbiAgICAkcGFnZUVsZW1lbnRzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkcGFnZUVsZW1lbnQgPSAkKHRoaXMpO1xuICAgICAgICBpZiAoaXNJblZpZXcoJHBhZ2VFbGVtZW50KSkge1xuICAgICAgICAgICAgcGFnZXNUb0xvYWQucHVzaCgkcGFnZUVsZW1lbnQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbG9hZFdoZW5WaXNpYmxlKCRwYWdlRWxlbWVudCwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIGlmIChwYWdlc1RvTG9hZC5sZW5ndGggPiAwKSB7XG4gICAgICAgIHZhciBwYWdlRGF0YVBhcmFtID0gY29tcHV0ZVBhZ2VzUGFyYW0ocGFnZXNUb0xvYWQsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICBsb2FkUGFnZURhdGEocGFnZURhdGFQYXJhbSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBpc0luVmlldygkZWxlbWVudCkge1xuICAgIHZhciB0cmlnZ2VyRGlzdGFuY2UgPSAzMDA7XG4gICAgcmV0dXJuICRlbGVtZW50Lm9mZnNldCgpLnRvcCA8ICAkKGRvY3VtZW50KS5zY3JvbGxUb3AoKSArICQod2luZG93KS5oZWlnaHQoKSArIHRyaWdnZXJEaXN0YW5jZTtcbn1cblxuZnVuY3Rpb24gbG9hZFdoZW5WaXNpYmxlKCRwYWdlRWxlbWVudCwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBjaGVja1Zpc2liaWxpdHkgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKGlzSW5WaWV3KCRwYWdlRWxlbWVudCkpIHtcbiAgICAgICAgICAgIHZhciBwYWdlRGF0YVBhcmFtID0gY29tcHV0ZVBhZ2VzUGFyYW0oWyRwYWdlRWxlbWVudF0sIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgbG9hZFBhZ2VEYXRhKHBhZ2VEYXRhUGFyYW0sIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgVGhyb3R0bGVkRXZlbnRzLm9mZignc2Nyb2xsJywgY2hlY2tWaXNpYmlsaXR5KTtcbiAgICAgICAgICAgIFRocm90dGxlZEV2ZW50cy5vZmYoJ3Jlc2l6ZScsIGNoZWNrVmlzaWJpbGl0eSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFRocm90dGxlZEV2ZW50cy5vbignc2Nyb2xsJywgY2hlY2tWaXNpYmlsaXR5KTtcbiAgICBUaHJvdHRsZWRFdmVudHMub24oJ3Jlc2l6ZScsIGNoZWNrVmlzaWJpbGl0eSk7XG59XG5cbmZ1bmN0aW9uIHBhZ2VzQWRkZWQoJHBhZ2VFbGVtZW50cywgZ3JvdXBTZXR0aW5ncykge1xuICAgIHF1ZXVlUGFnZURhdGFMb2FkKCRwYWdlRWxlbWVudHMsIGdyb3VwU2V0dGluZ3MpO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgbG9hZDogc3RhcnRMb2FkaW5nUGFnZURhdGEsXG4gICAgcGFnZXNBZGRlZDogcGFnZXNBZGRlZFxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi91dGlscy9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcblxudmFyIEV2ZW50cyA9IHJlcXVpcmUoJy4vZXZlbnRzJyk7XG52YXIgSGFzaGVkRWxlbWVudHMgPSByZXF1aXJlKCcuL2hhc2hlZC1lbGVtZW50cycpO1xuXG4vLyBDb2xsZWN0aW9uIG9mIGFsbCBwYWdlIGRhdGEsIGtleWVkIGJ5IHBhZ2UgaGFzaFxudmFyIHBhZ2VzID0ge307XG4vLyBNYXBwaW5nIG9mIHBhZ2UgVVJMcyB0byBwYWdlIGhhc2hlcywgd2hpY2ggYXJlIGNvbXB1dGVkIG9uIHRoZSBzZXJ2ZXIuXG52YXIgdXJsSGFzaGVzID0ge307XG5cbmZ1bmN0aW9uIGdldFBhZ2VEYXRhKGhhc2gpIHtcbiAgICB2YXIgcGFnZURhdGEgPSBwYWdlc1toYXNoXTtcbiAgICBpZiAoIXBhZ2VEYXRhKSB7XG4gICAgICAgIC8vIFRPRE86IEdpdmUgdGhpcyBzZXJpb3VzIHRob3VnaHQuIEluIG9yZGVyIGZvciBtYWdpYyBtb2RlIHRvIHdvcmssIHRoZSBvYmplY3QgbmVlZHMgdG8gaGF2ZSB2YWx1ZXMgaW4gcGxhY2UgZm9yXG4gICAgICAgIC8vIHRoZSBvYnNlcnZlZCBwcm9wZXJ0aWVzIGF0IHRoZSBtb21lbnQgdGhlIHJhY3RpdmUgaXMgY3JlYXRlZC4gQnV0IHRoaXMgaXMgcHJldHR5IHVudXN1YWwgZm9yIEphdmFzY3JpcHQsIHRvIGhhdmVcbiAgICAgICAgLy8gdG8gZGVmaW5lIHRoZSB3aG9sZSBza2VsZXRvbiBmb3IgdGhlIG9iamVjdCBpbnN0ZWFkIG9mIGp1c3QgYWRkaW5nIHByb3BlcnRpZXMgd2hlbmV2ZXIgeW91IHdhbnQuXG4gICAgICAgIC8vIFRoZSBhbHRlcm5hdGl2ZSB3b3VsZCBiZSBmb3IgdXMgdG8ga2VlcCBvdXIgb3duIFwiZGF0YSBiaW5kaW5nXCIgYmV0d2VlbiB0aGUgcGFnZURhdGEgYW5kIHJhY3RpdmUgaW5zdGFuY2VzICgxIHRvIG1hbnkpXG4gICAgICAgIC8vIGFuZCB0ZWxsIHRoZSByYWN0aXZlcyB0byB1cGRhdGUgd2hlbmV2ZXIgdGhlIGRhdGEgY2hhbmdlcy5cbiAgICAgICAgcGFnZURhdGEgPSB7XG4gICAgICAgICAgICBwYWdlSGFzaDogaGFzaCxcbiAgICAgICAgICAgIHN1bW1hcnlSZWFjdGlvbnM6IFtdLFxuICAgICAgICAgICAgc3VtbWFyeVRvdGFsOiAwLFxuICAgICAgICAgICAgc3VtbWFyeUxvYWRlZDogZmFsc2UsXG4gICAgICAgICAgICBjb250YWluZXJzOiBbXSxcbiAgICAgICAgICAgIG1ldHJpY3M6IHt9IC8vIFRoaXMgaXMgYSBjYXRjaC1hbGwgZmllbGQgd2hlcmUgd2UgY2FuIGF0dGFjaCBjbGllbnQtc2lkZSBtZXRyaWNzIGZvciBhbmFseXRpY3NcbiAgICAgICAgfTtcbiAgICAgICAgcGFnZXNbaGFzaF0gPSBwYWdlRGF0YTtcbiAgICB9XG4gICAgcmV0dXJuIHBhZ2VEYXRhO1xufVxuXG5mdW5jdGlvbiB1cGRhdGVBbGxQYWdlRGF0YShqc29uUGFnZXMsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgYWxsUGFnZXMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGpzb25QYWdlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgcGFnZURhdGEgPSB1cGRhdGVQYWdlRGF0YShqc29uUGFnZXNbaV0sIGdyb3VwU2V0dGluZ3MpXG4gICAgICAgIGFsbFBhZ2VzLnB1c2gocGFnZURhdGEpO1xuICAgICAgICBFdmVudHMucG9zdFBhZ2VEYXRhTG9hZGVkKHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZVBhZ2VEYXRhKGpzb24sIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgcGFnZURhdGEgPSBnZXRQYWdlRGF0YUZvckpzb25SZXNwb25zZShqc29uKTtcbiAgICBwYWdlRGF0YS5wYWdlSWQgPSBqc29uLmlkO1xuICAgIHBhZ2VEYXRhLnBhZ2VIYXNoID0ganNvbi5wYWdlSGFzaDtcbiAgICBwYWdlRGF0YS5ncm91cElkID0gZ3JvdXBTZXR0aW5ncy5ncm91cElkKCk7XG4gICAgcGFnZURhdGEuY2Fub25pY2FsVXJsID0ganNvbi5jYW5vbmljYWxVUkw7XG4gICAgcGFnZURhdGEucmVxdWVzdGVkVXJsID0ganNvbi5yZXF1ZXN0ZWRVUkw7XG4gICAgcGFnZURhdGEuYXV0aG9yID0ganNvbi5hdXRob3I7XG4gICAgcGFnZURhdGEuc2VjdGlvbiA9IGpzb24uc2VjdGlvbjtcbiAgICBwYWdlRGF0YS50b3BpY3MgPSBqc29uLnRvcGljcztcbiAgICBwYWdlRGF0YS50aXRsZSA9IGpzb24udGl0bGU7XG4gICAgcGFnZURhdGEuaW1hZ2UgPSBqc29uLmltYWdlO1xuXG4gICAgdmFyIHN1bW1hcnlSZWFjdGlvbnMgPSBqc29uLnN1bW1hcnlSZWFjdGlvbnM7XG4gICAgcGFnZURhdGEuc3VtbWFyeVJlYWN0aW9ucyA9IHN1bW1hcnlSZWFjdGlvbnM7XG4gICAgc2V0Q29udGFpbmVycyhwYWdlRGF0YSwganNvbi5jb250YWluZXJzKTtcblxuICAgIC8vIFdlIGFkZCB1cCB0aGUgc3VtbWFyeSByZWFjdGlvbiB0b3RhbCBjbGllbnQtc2lkZVxuICAgIHZhciB0b3RhbCA9IDA7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdW1tYXJ5UmVhY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHRvdGFsID0gdG90YWwgKyBzdW1tYXJ5UmVhY3Rpb25zW2ldLmNvdW50O1xuICAgIH1cbiAgICBwYWdlRGF0YS5zdW1tYXJ5VG90YWwgPSB0b3RhbDtcbiAgICBwYWdlRGF0YS5zdW1tYXJ5TG9hZGVkID0gdHJ1ZTtcblxuICAgIC8vIFdlIGFkZCB1cCB0aGUgY29udGFpbmVyIHJlYWN0aW9uIHRvdGFscyBjbGllbnQtc2lkZVxuICAgIHZhciB0b3RhbCA9IDA7XG4gICAgdmFyIGNvbnRhaW5lckNvdW50cyA9IFtdO1xuICAgIHZhciBjb250YWluZXJzID0gcGFnZURhdGEuY29udGFpbmVycztcbiAgICBmb3IgKHZhciBoYXNoIGluIGpzb24uY29udGFpbmVycykge1xuICAgICAgICBpZiAoY29udGFpbmVycy5oYXNPd25Qcm9wZXJ0eShoYXNoKSkge1xuICAgICAgICAgICAgdmFyIGNvbnRhaW5lciA9IGNvbnRhaW5lcnNbaGFzaF07XG4gICAgICAgICAgICB2YXIgdG90YWwgPSAwO1xuICAgICAgICAgICAgdmFyIGNvbnRhaW5lclJlYWN0aW9ucyA9IGNvbnRhaW5lci5yZWFjdGlvbnM7XG4gICAgICAgICAgICBpZiAoY29udGFpbmVyUmVhY3Rpb25zKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb250YWluZXJSZWFjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdG90YWwgPSB0b3RhbCArIGNvbnRhaW5lclJlYWN0aW9uc1tpXS5jb3VudDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb250YWluZXIucmVhY3Rpb25Ub3RhbCA9IHRvdGFsO1xuICAgICAgICAgICAgY29udGFpbmVyQ291bnRzLnB1c2goeyBjb3VudDogdG90YWwsIGNvbnRhaW5lcjogY29udGFpbmVyIH0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIHZhciBpbmRpY2F0b3JMaW1pdCA9IGdyb3VwU2V0dGluZ3MudGV4dEluZGljYXRvckxpbWl0KCk7XG4gICAgaWYgKGluZGljYXRvckxpbWl0KSB7XG4gICAgICAgIC8vIElmIGFuIGluZGljYXRvciBsaW1pdCBpcyBzZXQsIHNvcnQgdGhlIGNvbnRhaW5lcnMgYW5kIG1hcmsgb25seSB0aGUgdG9wIE4gdG8gYmUgdmlzaWJsZS5cbiAgICAgICAgY29udGFpbmVyQ291bnRzLnNvcnQoZnVuY3Rpb24oYSwgYikgeyByZXR1cm4gYi5jb3VudCAtIGEuY291bnQ7IH0pOyAvLyBzb3J0IGxhcmdlc3QgY291bnQgZmlyc3RcbiAgICAgICAgZm9yICh2YXIgaSA9IGluZGljYXRvckxpbWl0OyBpIDwgY29udGFpbmVyQ291bnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb250YWluZXJDb3VudHNbaV0uY29udGFpbmVyLnN1cHByZXNzID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBwYWdlRGF0YTtcbn1cblxuZnVuY3Rpb24gZ2V0Q29udGFpbmVyRGF0YShwYWdlRGF0YSwgY29udGFpbmVySGFzaCkge1xuICAgIHZhciBjb250YWluZXJEYXRhID0gcGFnZURhdGEuY29udGFpbmVyc1tjb250YWluZXJIYXNoXTtcbiAgICBpZiAoIWNvbnRhaW5lckRhdGEpIHtcbiAgICAgICAgY29udGFpbmVyRGF0YSA9IHtcbiAgICAgICAgICAgIGhhc2g6IGNvbnRhaW5lckhhc2gsXG4gICAgICAgICAgICByZWFjdGlvblRvdGFsOiAwLFxuICAgICAgICAgICAgcmVhY3Rpb25zOiBbXSxcbiAgICAgICAgICAgIGxvYWRlZDogcGFnZURhdGEuc3VtbWFyeUxvYWRlZCxcbiAgICAgICAgICAgIHN1cHByZXNzOiBmYWxzZVxuICAgICAgICB9O1xuICAgICAgICBwYWdlRGF0YS5jb250YWluZXJzW2NvbnRhaW5lckhhc2hdID0gY29udGFpbmVyRGF0YTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbnRhaW5lckRhdGE7XG59XG5cbi8vIE1lcmdlIHRoZSBnaXZlbiBjb250YWluZXIgZGF0YSBpbnRvIHRoZSBwYWdlRGF0YS5jb250YWluZXJzIGRhdGEuIFRoaXMgaXMgbmVjZXNzYXJ5IGJlY2F1c2UgdGhlIHNrZWxldG9uIG9mIHRoZSBwYWdlRGF0YS5jb250YWluZXJzIG1hcFxuLy8gaXMgc2V0IHVwIGFuZCBib3VuZCB0byB0aGUgVUkgYmVmb3JlIGFsbCB0aGUgZGF0YSBpcyBmZXRjaGVkIGZyb20gdGhlIHNlcnZlciBhbmQgd2UgZG9uJ3Qgd2FudCB0byBicmVhayB0aGUgZGF0YSBiaW5kaW5nLlxuZnVuY3Rpb24gc2V0Q29udGFpbmVycyhwYWdlRGF0YSwganNvbkNvbnRhaW5lcnMpIHtcbiAgICBmb3IgKHZhciBoYXNoIGluIGpzb25Db250YWluZXJzKSB7XG4gICAgICAgIGlmIChqc29uQ29udGFpbmVycy5oYXNPd25Qcm9wZXJ0eShoYXNoKSkge1xuICAgICAgICAgICAgdmFyIGNvbnRhaW5lckRhdGEgPSBnZXRDb250YWluZXJEYXRhKHBhZ2VEYXRhLCBoYXNoKTtcbiAgICAgICAgICAgIHZhciBmZXRjaGVkQ29udGFpbmVyRGF0YSA9IGpzb25Db250YWluZXJzW2hhc2hdO1xuICAgICAgICAgICAgY29udGFpbmVyRGF0YS5pZCA9IGZldGNoZWRDb250YWluZXJEYXRhLmlkO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBmZXRjaGVkQ29udGFpbmVyRGF0YS5yZWFjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjb250YWluZXJEYXRhLnJlYWN0aW9ucy5wdXNoKGZldGNoZWRDb250YWluZXJEYXRhLnJlYWN0aW9uc1tpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgdmFyIGFsbENvbnRhaW5lcnMgPSBwYWdlRGF0YS5jb250YWluZXJzO1xuICAgIGZvciAodmFyIGhhc2ggaW4gYWxsQ29udGFpbmVycykge1xuICAgICAgICBpZiAoYWxsQ29udGFpbmVycy5oYXNPd25Qcm9wZXJ0eShoYXNoKSkge1xuICAgICAgICAgICAgdmFyIGNvbnRhaW5lciA9IGFsbENvbnRhaW5lcnNbaGFzaF07XG4gICAgICAgICAgICBjb250YWluZXIubG9hZGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gY2xlYXJJbmRpY2F0b3JMaW1pdChwYWdlRGF0YSkge1xuICAgIHZhciBjb250YWluZXJzID0gcGFnZURhdGEuY29udGFpbmVycztcbiAgICBmb3IgKHZhciBoYXNoIGluIGNvbnRhaW5lcnMpIHtcbiAgICAgICAgaWYgKGNvbnRhaW5lcnMuaGFzT3duUHJvcGVydHkoaGFzaCkpIHtcbiAgICAgICAgICAgIHZhciBjb250YWluZXIgPSBjb250YWluZXJzW2hhc2hdO1xuICAgICAgICAgICAgY29udGFpbmVyLnN1cHByZXNzID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8vIFJldHVybnMgdGhlIGxvY2F0aW9ucyB3aGVyZSB0aGUgZ2l2ZW4gcmVhY3Rpb24gb2NjdXJzIG9uIHRoZSBwYWdlLiBUaGUgcmV0dXJuIGZvcm1hdCBpczpcbi8vIHtcbi8vICAgPGNvbnRlbnRfaWQ+IDoge1xuLy8gICAgIGNvdW50OiA8bnVtYmVyPixcbi8vICAgICBpZDogPGNvbnRlbnRfaWQ+LFxuLy8gICAgIGNvbnRhaW5lcklEOiA8Y29udGFpbmVyX2lkPlxuLy8gICAgIGtpbmQ6IDxjb250ZW50IGtpbmQ+LFxuLy8gICAgIGxvY2F0aW9uOiA8bG9jYXRpb24+LFxuLy8gICAgIFtib2R5OiA8Ym9keT5dIGZpbGxlZCBpbiBsYXRlciB2aWEgdXBkYXRlTG9jYXRpb25EYXRhXG4vLyAgIH1cbi8vIH1cbmZ1bmN0aW9uIGdldFJlYWN0aW9uTG9jYXRpb25EYXRhKHJlYWN0aW9uLCBwYWdlRGF0YSkge1xuICAgIGlmICghcGFnZURhdGEubG9jYXRpb25EYXRhKSB7IC8vIFBvcHVsYXRlIHRoaXMgdHJlZSBsYXppbHksIHNpbmNlIGl0J3Mgbm90IGZyZXF1ZW50bHkgdXNlZC5cbiAgICAgICAgcGFnZURhdGEubG9jYXRpb25EYXRhID0gY29tcHV0ZUxvY2F0aW9uRGF0YShwYWdlRGF0YSk7XG4gICAgfVxuICAgIHJldHVybiBwYWdlRGF0YS5sb2NhdGlvbkRhdGFbcmVhY3Rpb24uaWRdO1xufVxuXG4vLyBSZXR1cm5zIGEgdmlldyBvbiB0aGUgZ2l2ZW4gdHJlZSBzdHJ1Y3R1cmUgdGhhdCdzIG9wdGltaXplZCBmb3IgcmVuZGVyaW5nIHRoZSBsb2NhdGlvbiBvZiByZWFjdGlvbnMgKGFzIGZyb20gdGhlXG4vLyBzdW1tYXJ5IHdpZGdldCkuIEZvciBlYWNoIHJlYWN0aW9uLCB3ZSBjYW4gcXVpY2tseSBnZXQgdG8gdGhlIHBpZWNlcyBvZiBjb250ZW50IHRoYXQgaGF2ZSB0aGF0IHJlYWN0aW9uIGFzIHdlbGwgYXNcbi8vIHRoZSBjb3VudCBvZiB0aG9zZSByZWFjdGlvbnMgZm9yIGVhY2ggcGllY2Ugb2YgY29udGVudC5cbi8vXG4vLyBUaGUgc3RydWN0dXJlIGxvb2tzIGxpa2UgdGhpczpcbi8vIHtcbi8vICAgPHJlYWN0aW9uX2lkPiA6IHsgICAodGhpcyBpcyB0aGUgaW50ZXJhY3Rpb25fbm9kZV9pZClcbi8vICAgICA8Y29udGVudF9pZD4gOiB7XG4vLyAgICAgICBjb3VudCA6IDxudW1iZXI+LFxuLy8gICAgICAgY29udGFpbmVySUQ6IDxjb250YWluZXJfaWQ+LFxuLy8gICAgICAga2luZDogPGNvbnRlbnQga2luZD4sXG4vLyAgICAgICBsb2NhdGlvbjogPGxvY2F0aW9uPlxuLy8gICAgICAgW2JvZHk6IDxib2R5Pl0gZmlsbGVkIGluIGxhdGVyIHZpYSB1cGRhdGVMb2NhdGlvbkRhdGFcbi8vICAgICB9XG4vLyAgIH1cbi8vIH1cbmZ1bmN0aW9uIGNvbXB1dGVMb2NhdGlvbkRhdGEocGFnZURhdGEpIHtcbiAgICB2YXIgbG9jYXRpb25EYXRhID0ge307XG4gICAgdmFyIGNvbnRhaW5lcnMgPSBwYWdlRGF0YS5jb250YWluZXJzO1xuICAgIGZvciAodmFyIGhhc2ggaW4gY29udGFpbmVycykge1xuICAgICAgICBpZiAoY29udGFpbmVycy5oYXNPd25Qcm9wZXJ0eShoYXNoKSkge1xuICAgICAgICAgICAgdmFyIGNvbnRhaW5lckRhdGEgPSBjb250YWluZXJzW2hhc2hdO1xuICAgICAgICAgICAgdmFyIHJlYWN0aW9ucyA9IGNvbnRhaW5lckRhdGEucmVhY3Rpb25zO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZWFjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgcmVhY3Rpb24gPSByZWFjdGlvbnNbaV07XG4gICAgICAgICAgICAgICAgdmFyIHJlYWN0aW9uSWQgPSByZWFjdGlvbi5pZDtcbiAgICAgICAgICAgICAgICB2YXIgY29udGVudCA9IHJlYWN0aW9uLmNvbnRlbnQ7XG4gICAgICAgICAgICAgICAgdmFyIGNvbnRlbnRJZCA9IGNvbnRlbnQuaWQ7XG4gICAgICAgICAgICAgICAgdmFyIHJlYWN0aW9uTG9jYXRpb25EYXRhID0gbG9jYXRpb25EYXRhW3JlYWN0aW9uSWRdO1xuICAgICAgICAgICAgICAgIGlmICghcmVhY3Rpb25Mb2NhdGlvbkRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVhY3Rpb25Mb2NhdGlvbkRhdGEgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgbG9jYXRpb25EYXRhW3JlYWN0aW9uSWRdID0gcmVhY3Rpb25Mb2NhdGlvbkRhdGE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBjb250ZW50TG9jYXRpb25EYXRhID0gcmVhY3Rpb25Mb2NhdGlvbkRhdGFbY29udGVudElkXTsgLy8gVE9ETzogSXQncyBub3QgcmVhbGx5IHBvc3NpYmxlIHRvIGdldCBhIGhpdCBoZXJlLCBpcyBpdD8gV2Ugc2hvdWxkIG5ldmVyIHNlZSB0d28gaW5zdGFuY2VzIG9mIHRoZSBzYW1lIHJlYWN0aW9uIGZvciB0aGUgc2FtZSBjb250ZW50PyAoVGhlcmUnZCB3b3VsZCBqdXN0IGJlIG9uZSBpbnN0YW5jZSB3aXRoIGEgY291bnQgPiAxLilcbiAgICAgICAgICAgICAgICBpZiAoIWNvbnRlbnRMb2NhdGlvbkRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGVudExvY2F0aW9uRGF0YSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50OiAwLFxuICAgICAgICAgICAgICAgICAgICAgICAga2luZDogY29udGVudC5raW5kLCAvLyBUT0RPOiBXZSBzaG91bGQgbm9ybWFsaXplIHRoaXMgdmFsdWUgdG8gYSBzZXQgb2YgY29uc3RhbnRzLiBmaXggdGhpcyBpbiBsb2NhdGlvbnMtcGFnZSB3aGVyZSB0aGUgdmFsdWUgaXMgcmVhZCBhcyB3ZWxsLlxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogYWxzbyBjb25zaWRlciB0cmFuc2xhdGluZyB0aGlzIGZyb20gdGhlIHJhdyBcImtpbmRcIiB0byBcInR5cGVcIi4gKGUuZy4gXCJwYWdcIiA9PiBcInBhZ2VcIilcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uOiBjb250ZW50LmxvY2F0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGFpbmVySGFzaDogY29udGFpbmVyRGF0YS5oYXNoLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudElkOiBjb250ZW50SWRcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgcmVhY3Rpb25Mb2NhdGlvbkRhdGFbY29udGVudElkXSA9IGNvbnRlbnRMb2NhdGlvbkRhdGE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnRlbnRMb2NhdGlvbkRhdGEuY291bnQgKz0gcmVhY3Rpb24uY291bnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGxvY2F0aW9uRGF0YTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlUmVhY3Rpb25Mb2NhdGlvbkRhdGEocmVhY3Rpb25Mb2NhdGlvbkRhdGEsIGNvbnRlbnRCb2RpZXMpIHtcbiAgICBmb3IgKHZhciBjb250ZW50SWQgaW4gY29udGVudEJvZGllcykge1xuICAgICAgICBpZiAoY29udGVudEJvZGllcy5oYXNPd25Qcm9wZXJ0eShjb250ZW50SWQpKSB7XG4gICAgICAgICAgICB2YXIgY29udGVudExvY2F0aW9uRGF0YSA9IHJlYWN0aW9uTG9jYXRpb25EYXRhW2NvbnRlbnRJZF07XG4gICAgICAgICAgICBpZiAoY29udGVudExvY2F0aW9uRGF0YSkge1xuICAgICAgICAgICAgICAgIGNvbnRlbnRMb2NhdGlvbkRhdGEuYm9keSA9IGNvbnRlbnRCb2RpZXNbY29udGVudElkXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gcmVnaXN0ZXJSZWFjdGlvbihyZWFjdGlvbiwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEpIHtcbiAgICB2YXIgZXhpc3RpbmdSZWFjdGlvbnMgPSBjb250YWluZXJEYXRhLnJlYWN0aW9ucztcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGV4aXN0aW5nUmVhY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChleGlzdGluZ1JlYWN0aW9uc1tpXS5pZCA9PT0gcmVhY3Rpb24uaWQpIHtcbiAgICAgICAgICAgIC8vIFRoaXMgcmVhY3Rpb24gaGFzIGFscmVhZHkgYmVlbiBhZGRlZCB0byB0aGlzIGNvbnRhaW5lci4gRG9uJ3QgYWRkIGl0IGFnYWluLlxuICAgICAgICAgICAgcmV0dXJuIGV4aXN0aW5nUmVhY3Rpb25zW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIGNvbnRhaW5lckRhdGEucmVhY3Rpb25zLnB1c2gocmVhY3Rpb24pO1xuICAgIGNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbCA9IGNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbCArIDE7XG4gICAgdmFyIGV4aXN0c0luU3VtbWFyeSA9IGZhbHNlO1xuICAgIHZhciBleGlzdGluZ1N1bW1hcnlSZWFjdGlvbnMgPSBwYWdlRGF0YS5zdW1tYXJ5UmVhY3Rpb25zO1xuICAgIGZvciAodmFyIGogPSAwOyBqIDwgZXhpc3RpbmdTdW1tYXJ5UmVhY3Rpb25zLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIGlmIChleGlzdGluZ1N1bW1hcnlSZWFjdGlvbnNbal0uaWQgPT09IHJlYWN0aW9uLmlkKSB7XG4gICAgICAgICAgICAvLyBJZiB0aGlzIHJlYWN0aW9uIGFscmVhZHkgZXhpc3RzIGluIHRoZSBzdW1tYXJ5LCBpbmNyZW1lbnQgdGhlIGNvdW50LlxuICAgICAgICAgICAgZXhpc3RpbmdTdW1tYXJ5UmVhY3Rpb25zW2pdLmNvdW50ICs9IDE7XG4gICAgICAgICAgICBleGlzdHNJblN1bW1hcnkgPSB0cnVlO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKCFleGlzdHNJblN1bW1hcnkpIHtcbiAgICAgICAgdmFyIHN1bW1hcnlSZWFjdGlvbiA9IHtcbiAgICAgICAgICAgIHRleHQ6IHJlYWN0aW9uLnRleHQsXG4gICAgICAgICAgICBpZDogcmVhY3Rpb24uaWQsXG4gICAgICAgICAgICBjb3VudDogcmVhY3Rpb24uY291bnRcbiAgICAgICAgfTtcbiAgICAgICAgcGFnZURhdGEuc3VtbWFyeVJlYWN0aW9ucy5wdXNoKHN1bW1hcnlSZWFjdGlvbik7XG4gICAgfVxuICAgIHBhZ2VEYXRhLnN1bW1hcnlUb3RhbCA9IHBhZ2VEYXRhLnN1bW1hcnlUb3RhbCArIDE7XG4gICAgcmV0dXJuIHJlYWN0aW9uO1xufVxuXG4vLyBHZXRzIHBhZ2UgZGF0YSBiYXNlZCBvbiBhIFVSTC4gVGhpcyBhbGxvd3Mgb3VyIGNsaWVudCB0byBzdGFydCBwcm9jZXNzaW5nIGEgcGFnZSAoYW5kIGJpbmRpbmcgZGF0YSBvYmplY3RzXG4vLyB0byB0aGUgVUkpICpiZWZvcmUqIHdlIGdldCBkYXRhIGJhY2sgZnJvbSB0aGUgc2VydmVyLlxuZnVuY3Rpb24gZ2V0UGFnZURhdGFCeVVSTCh1cmwpIHtcbiAgICB2YXIgc2VydmVySGFzaCA9IHVybEhhc2hlc1t1cmxdO1xuICAgIGlmIChzZXJ2ZXJIYXNoKSB7XG4gICAgICAgIC8vIElmIHRoZSBzZXJ2ZXIgYWxyZWFkeSBnaXZlbiB1cyB0aGUgaGFzaCBmb3IgdGhlIHBhZ2UsIHVzZSBpdC5cbiAgICAgICAgcmV0dXJuIGdldFBhZ2VEYXRhKHNlcnZlckhhc2gpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIE90aGVyd2lzZSwgdGVtcG9yYXJpbHkgdXNlIHRoZSB1cmwgYXMgdGhlIGhhc2guIFRoaXMgd2lsbCBnZXQgdXBkYXRlZCB3aGVuZXZlciB3ZSBnZXQgZGF0YSBiYWNrIGZyb20gdGhlIHNlcnZlci5cbiAgICAgICAgcmV0dXJuIGdldFBhZ2VEYXRhKHVybCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBnZXRQYWdlRGF0YUZvckpzb25SZXNwb25zZShqc29uKSB7XG4gICAgdmFyIHBhZ2VIYXNoID0ganNvbi5wYWdlSGFzaDtcbiAgICB2YXIgcmVxdWVzdGVkVVJMID0ganNvbi5yZXF1ZXN0ZWRVUkw7XG4gICAgdXJsSGFzaGVzW3JlcXVlc3RlZFVSTF0gPSBwYWdlSGFzaDtcbiAgICB2YXIgdXJsQmFzZWREYXRhID0gcGFnZXNbcmVxdWVzdGVkVVJMXTtcbiAgICBpZiAodXJsQmFzZWREYXRhKSB7XG4gICAgICAgIC8vIElmIHdlJ3ZlIGFscmVhZHkgY3JlYXRlZC9ib3VuZCBhIHBhZ2VEYXRhIG9iamVjdCB1bmRlciB0aGUgcmVxdWVzdGVkVXJsLCB1cGRhdGUgdGhlIHBhZ2VIYXNoIGFuZCBtb3ZlIHRoYXRcbiAgICAgICAgLy8gZGF0YSBvdmVyIHRvIHRoZSBoYXNoIGtleVxuICAgICAgICB1cmxCYXNlZERhdGEucGFnZUhhc2ggPSBqc29uLnBhZ2VIYXNoO1xuICAgICAgICBwYWdlc1twYWdlSGFzaF0gPSB1cmxCYXNlZERhdGE7XG4gICAgICAgIGRlbGV0ZSBwYWdlc1tyZXF1ZXN0ZWRVUkxdO1xuICAgICAgICAvLyBVcGRhdGUgdGhlIG1hcHBpbmcgb2YgaGFzaGVzIHRvIHBhZ2UgZWxlbWVudHMgc28gaXQgYWxzbyBrbm93cyBhYm91dCB0aGUgY2hhbmdlIHRvIHRoZSBwYWdlIGhhc2hcbiAgICAgICAgSGFzaGVkRWxlbWVudHMudXBkYXRlUGFnZUhhc2gocmVxdWVzdGVkVVJMLCBwYWdlSGFzaCk7XG4gICAgfVxuICAgIHJldHVybiBnZXRQYWdlRGF0YShwYWdlSGFzaCk7XG59XG5cbmZ1bmN0aW9uIHRlYXJkb3duKCkge1xuICAgIHBhZ2VzID0ge307XG4gICAgdXJsSGFzaGVzID0ge307XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBnZXRQYWdlRGF0YUJ5VVJMOiBnZXRQYWdlRGF0YUJ5VVJMLFxuICAgIGdldFBhZ2VEYXRhOiBnZXRQYWdlRGF0YSxcbiAgICB1cGRhdGVBbGxQYWdlRGF0YTogdXBkYXRlQWxsUGFnZURhdGEsXG4gICAgZ2V0Q29udGFpbmVyRGF0YTogZ2V0Q29udGFpbmVyRGF0YSxcbiAgICBnZXRSZWFjdGlvbkxvY2F0aW9uRGF0YTogZ2V0UmVhY3Rpb25Mb2NhdGlvbkRhdGEsXG4gICAgdXBkYXRlUmVhY3Rpb25Mb2NhdGlvbkRhdGE6IHVwZGF0ZVJlYWN0aW9uTG9jYXRpb25EYXRhLFxuICAgIHJlZ2lzdGVyUmVhY3Rpb246IHJlZ2lzdGVyUmVhY3Rpb24sXG4gICAgY2xlYXJJbmRpY2F0b3JMaW1pdDogY2xlYXJJbmRpY2F0b3JMaW1pdCxcbiAgICB0ZWFyZG93bjogdGVhcmRvd24sXG59OyIsInZhciAkOyByZXF1aXJlKCcuL3V0aWxzL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIEFwcE1vZGUgPSByZXF1aXJlKCcuL3V0aWxzL2FwcC1tb2RlJyk7XG52YXIgQnJvd3Nlck1ldHJpY3MgPSByZXF1aXJlKCcuL3V0aWxzL2Jyb3dzZXItbWV0cmljcycpO1xudmFyIEhhc2ggPSByZXF1aXJlKCcuL3V0aWxzL2hhc2gnKTtcbnZhciBNdXRhdGlvbk9ic2VydmVyID0gcmVxdWlyZSgnLi91dGlscy9tdXRhdGlvbi1vYnNlcnZlcicpO1xudmFyIFBhZ2VVdGlscyA9IHJlcXVpcmUoJy4vdXRpbHMvcGFnZS11dGlscycpO1xudmFyIFNlZ21lbnQgPSByZXF1aXJlKCcuL3V0aWxzL3NlZ21lbnQnKTtcbnZhciBVUkxzID0gcmVxdWlyZSgnLi91dGlscy91cmxzJyk7XG52YXIgV2lkZ2V0QnVja2V0ID0gcmVxdWlyZSgnLi91dGlscy93aWRnZXQtYnVja2V0Jyk7XG5cbnZhciBBdXRvQ2FsbFRvQWN0aW9uID0gcmVxdWlyZSgnLi9hdXRvLWNhbGwtdG8tYWN0aW9uJyk7XG52YXIgQ2FsbFRvQWN0aW9uSW5kaWNhdG9yID0gcmVxdWlyZSgnLi9jYWxsLXRvLWFjdGlvbi1pbmRpY2F0b3InKTtcbnZhciBDb250ZW50UmVjID0gcmVxdWlyZSgnLi9jb250ZW50LXJlYy13aWRnZXQnKTtcbnZhciBIYXNoZWRFbGVtZW50cyA9IHJlcXVpcmUoJy4vaGFzaGVkLWVsZW1lbnRzJyk7XG52YXIgTWVkaWFJbmRpY2F0b3JXaWRnZXQgPSByZXF1aXJlKCcuL21lZGlhLWluZGljYXRvci13aWRnZXQnKTtcbnZhciBQYWdlRGF0YSA9IHJlcXVpcmUoJy4vcGFnZS1kYXRhJyk7XG52YXIgUGFnZURhdGFMb2FkZXIgPSByZXF1aXJlKCcuL3BhZ2UtZGF0YS1sb2FkZXInKTtcbnZhciBSZWFkTW9yZUV2ZW50cyA9IHJlcXVpcmUoJy4vcmVhZG1vcmUtZXZlbnRzJyk7XG52YXIgU3VtbWFyeVdpZGdldCA9IHJlcXVpcmUoJy4vc3VtbWFyeS13aWRnZXQnKTtcbnZhciBUZXh0SW5kaWNhdG9yV2lkZ2V0ID0gcmVxdWlyZSgnLi90ZXh0LWluZGljYXRvci13aWRnZXQnKTtcbnZhciBUZXh0UmVhY3Rpb25zID0gcmVxdWlyZSgnLi90ZXh0LXJlYWN0aW9ucycpO1xuXG52YXIgVFlQRV9URVhUID0gXCJ0ZXh0XCI7XG52YXIgVFlQRV9JTUFHRSA9IFwiaW1hZ2VcIjtcbnZhciBUWVBFX01FRElBID0gXCJtZWRpYVwiO1xuXG52YXIgQVRUUl9IQVNIID0gXCJhbnQtaGFzaFwiO1xuXG52YXIgY3JlYXRlZFdpZGdldHMgPSBbXTtcblxuXG4vLyBTY2FuIGZvciBhbGwgcGFnZXMgYXQgdGhlIGN1cnJlbnQgYnJvd3NlciBsb2NhdGlvbi4gVGhpcyBjb3VsZCBqdXN0IGJlIHRoZSBjdXJyZW50IHBhZ2Ugb3IgaXQgY291bGQgYmUgYSBjb2xsZWN0aW9uXG4vLyBvZiBwYWdlcyAoYWthICdwb3N0cycpLlxuZnVuY3Rpb24gc2NhbkFsbFBhZ2VzKGdyb3VwU2V0dGluZ3MsIHJlaW5pdGlhbGl6ZUNhbGxiYWNrKSB7XG4gICAgJChncm91cFNldHRpbmdzLmV4Y2x1c2lvblNlbGVjdG9yKCkpLmFkZENsYXNzKCduby1hbnQnKTsgLy8gQWRkIHRoZSBuby1hbnQgY2xhc3MgdG8gZXZlcnl0aGluZyB0aGF0IGlzIGZsYWdnZWQgZm9yIGV4Y2x1c2lvblxuICAgIHZhciAkcGFnZXMgPSAkKGdyb3VwU2V0dGluZ3MucGFnZVNlbGVjdG9yKCkpOyAvLyBUT0RPOiBuby1hbnQ/XG4gICAgaWYgKCRwYWdlcy5sZW5ndGggPT0gMCkge1xuICAgICAgICAvLyBJZiB3ZSBkb24ndCBkZXRlY3QgYW55IHBhZ2UgbWFya2VycywgdHJlYXQgdGhlIHdob2xlIGRvY3VtZW50IGFzIHRoZSBzaW5nbGUgcGFnZVxuICAgICAgICAkcGFnZXMgPSAkKCdib2R5Jyk7IC8vIFRPRE86IElzIHRoaXMgdGhlIHJpZ2h0IGJlaGF2aW9yPyAoS2VlcCBpbiBzeW5jIHdpdGggdGhlIHNhbWUgYXNzdW1wdGlvbiB0aGF0J3MgYnVpbHQgaW50byBwYWdlLWRhdGEtbG9hZGVyLilcbiAgICB9XG4gICAgJHBhZ2VzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkcGFnZSA9ICQodGhpcyk7XG4gICAgICAgIHNjYW5QYWdlKCRwYWdlLCBncm91cFNldHRpbmdzLCAkcGFnZXMubGVuZ3RoID4gMSk7XG4gICAgfSk7XG4gICAgc2V0dXBNdXRhdGlvbk9ic2VydmVyKGdyb3VwU2V0dGluZ3MsIHJlaW5pdGlhbGl6ZUNhbGxiYWNrKTtcbn1cblxuLy8gU2NhbiB0aGUgcGFnZSB1c2luZyB0aGUgZ2l2ZW4gc2V0dGluZ3M6XG4vLyAxLiBGaW5kIGFsbCB0aGUgY29udGFpbmVycyB0aGF0IHdlIGNhcmUgYWJvdXQuXG4vLyAyLiBDb21wdXRlIGhhc2hlcyBmb3IgZWFjaCBjb250YWluZXIuXG4vLyAzLiBJbnNlcnQgd2lkZ2V0IGFmZm9yZGFuY2VzIGZvciBlYWNoIHdoaWNoIGFyZSBib3VuZCB0byB0aGUgZGF0YSBtb2RlbCBieSB0aGUgaGFzaGVzLlxuZnVuY3Rpb24gc2NhblBhZ2UoJHBhZ2UsIGdyb3VwU2V0dGluZ3MsIGlzTXVsdGlQYWdlKSB7XG4gICAgdmFyIHVybCA9IFBhZ2VVdGlscy5jb21wdXRlUGFnZVVybCgkcGFnZSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgdmFyIHBhZ2VEYXRhID0gUGFnZURhdGEuZ2V0UGFnZURhdGFCeVVSTCh1cmwpO1xuICAgIHZhciAkYWN0aXZlU2VjdGlvbnMgPSBmaW5kKCRwYWdlLCBncm91cFNldHRpbmdzLmFjdGl2ZVNlY3Rpb25zKCksIHRydWUpO1xuXG4gICAgLy8gRmlyc3QsIHNjYW4gZm9yIGVsZW1lbnRzIHRoYXQgd291bGQgY2F1c2UgdXMgdG8gaW5zZXJ0IHNvbWV0aGluZyBpbnRvIHRoZSBET00gdGhhdCB0YWtlcyB1cCBzcGFjZS5cbiAgICAvLyBXZSB3YW50IHRvIGdldCBhbnkgcGFnZSByZXNpemluZyBvdXQgb2YgdGhlIHdheSBhcyBlYXJseSBhcyBwb3NzaWJsZS5cbiAgICAvLyBUT0RPOiBDb25zaWRlciBkb2luZyB0aGlzIHdpdGggcmF3IEphdmFzY3JpcHQgYmVmb3JlIGpRdWVyeSBsb2FkcywgdG8gZnVydGhlciByZWR1Y2UgdGhlIGRlbGF5LiBXZSB3b3VsZG4ndFxuICAgIC8vIHNhdmUgYSAqdG9uKiBvZiB0aW1lIGZyb20gdGhpcywgdGhvdWdoLCBzbyBpdCdzIGRlZmluaXRlbHkgYSBsYXRlciBvcHRpbWl6YXRpb24uXG4gICAgc2NhbkZvclN1bW1hcmllcygkcGFnZSwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpOyAvLyBTdW1tYXJ5IHdpZGdldCBtYXkgYmUgb24gdGhlIHBhZ2UsIGJ1dCBvdXRzaWRlIHRoZSBhY3RpdmUgc2VjdGlvblxuICAgIHNjYW5Gb3JSZWFkTW9yZSgkcGFnZSwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgIHNjYW5Gb3JDb250ZW50UmVjKCRwYWdlLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgJGFjdGl2ZVNlY3Rpb25zLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkc2VjdGlvbiA9ICQodGhpcyk7XG4gICAgICAgIGNyZWF0ZUF1dG9DYWxsc1RvQWN0aW9uKCRzZWN0aW9uLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgfSk7XG4gICAgLy8gU2NhbiBmb3IgQ1RBcyBhY3Jvc3MgdGhlIGVudGlyZSBwYWdlICh0aGV5IGNhbiBiZSBvdXRzaWRlIGFuIGFjdGl2ZSBzZWN0aW9uKS4gQ1RBcyBoYXZlIHRvIGdvIGJlZm9yZSBzY2FucyBmb3JcbiAgICAvLyBjb250ZW50IGJlY2F1c2UgY29udGVudCBpbnZvbHZlZCBpbiBDVEFzIHdpbGwgYmUgdGFnZ2VkIG5vLWFudC5cbiAgICBzY2FuRm9yQ2FsbHNUb0FjdGlvbigkcGFnZSwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgIC8vIFRoZW4gc2NhbiBmb3IgZXZlcnl0aGluZyBlbHNlXG4gICAgJGFjdGl2ZVNlY3Rpb25zLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkc2VjdGlvbiA9ICQodGhpcyk7XG4gICAgICAgIHNjYW5BY3RpdmVFbGVtZW50KCRzZWN0aW9uLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgfSk7XG5cbiAgICBwYWdlRGF0YS5tZXRyaWNzLmhlaWdodCA9IGNvbXB1dGVQYWdlSGVpZ2h0KCRhY3RpdmVTZWN0aW9ucyk7XG4gICAgcGFnZURhdGEubWV0cmljcy5pc011bHRpUGFnZSA9IGlzTXVsdGlQYWdlO1xufVxuXG5mdW5jdGlvbiBjb21wdXRlUGFnZUhlaWdodCgkYWN0aXZlU2VjdGlvbnMpIHtcbiAgICB2YXIgY29udGVudFRvcDtcbiAgICB2YXIgY29udGVudEJvdHRvbTtcbiAgICAkYWN0aXZlU2VjdGlvbnMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRzZWN0aW9uID0gJCh0aGlzKTtcbiAgICAgICAgdmFyIG9mZnNldCA9ICRzZWN0aW9uLm9mZnNldCgpO1xuICAgICAgICBjb250ZW50VG9wID0gY29udGVudFRvcCA9PT0gdW5kZWZpbmVkID8gb2Zmc2V0LnRvcCA6IE1hdGgubWluKGNvbnRlbnRUb3AsIG9mZnNldC50b3ApO1xuICAgICAgICB2YXIgYm90dG9tID0gb2Zmc2V0LnRvcCArICRzZWN0aW9uLm91dGVySGVpZ2h0KCk7XG4gICAgICAgIGNvbnRlbnRCb3R0b20gPSBjb250ZW50Qm90dG9tID09PSB1bmRlZmluZWQgPyBib3R0b20gOiBNYXRoLm1heChjb250ZW50Qm90dG9tLCBib3R0b20pO1xuICAgIH0pO1xuICAgIHJldHVybiBjb250ZW50Qm90dG9tIC0gY29udGVudFRvcDtcbn1cblxuLy8gU2NhbnMgdGhlIGdpdmVuIGVsZW1lbnQsIHdoaWNoIGFwcGVhcnMgaW5zaWRlIGFuIGFjdGl2ZSBzZWN0aW9uLiBUaGUgZWxlbWVudCBjYW4gYmUgdGhlIGVudGlyZSBhY3RpdmUgc2VjdGlvbixcbi8vIHNvbWUgY29udGFpbmVyIHdpdGhpbiB0aGUgYWN0aXZlIHNlY3Rpb24sIG9yIGEgbGVhZiBub2RlIGluIHRoZSBhY3RpdmUgc2VjdGlvbi5cbmZ1bmN0aW9uIHNjYW5BY3RpdmVFbGVtZW50KCRlbGVtZW50LCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHNjYW5Gb3JDb250ZW50KCRlbGVtZW50LCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG59XG5cbmZ1bmN0aW9uIHNjYW5Gb3JTdW1tYXJpZXMoJGVsZW1lbnQsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyICRzdW1tYXJpZXMgPSBmaW5kKCRlbGVtZW50LCBncm91cFNldHRpbmdzLnN1bW1hcnlTZWxlY3RvcigpLCB0cnVlLCB0cnVlKTsgLy8gc3VtbWFyeSB3aWRnZXRzIGNhbiBiZSBpbnNpZGUgbm8tYW50IHNlY3Rpb25zXG4gICAgJHN1bW1hcmllcy5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgJHN1bW1hcnkgPSAkKHRoaXMpO1xuICAgICAgICB2YXIgY29udGFpbmVyRGF0YSA9IFBhZ2VEYXRhLmdldENvbnRhaW5lckRhdGEocGFnZURhdGEsICdwYWdlJyk7IC8vIE1hZ2ljIGhhc2ggZm9yIHBhZ2UgcmVhY3Rpb25zXG4gICAgICAgIGNvbnRhaW5lckRhdGEudHlwZSA9ICdwYWdlJzsgLy8gVE9ETzogcmV2aXNpdCB3aGV0aGVyIGl0IG1ha2VzIHNlbnNlIHRvIHNldCB0aGUgdHlwZSBoZXJlXG4gICAgICAgIHZhciBkZWZhdWx0UmVhY3Rpb25zID0gZ3JvdXBTZXR0aW5ncy5kZWZhdWx0UmVhY3Rpb25zKCRzdW1tYXJ5KTsgLy8gVE9ETzogZG8gd2Ugc3VwcG9ydCBjdXN0b21pemluZyB0aGUgZGVmYXVsdCByZWFjdGlvbnMgYXQgdGhpcyBsZXZlbD9cbiAgICAgICAgdmFyIHN1bW1hcnlXaWRnZXQgPSBTdW1tYXJ5V2lkZ2V0LmNyZWF0ZShjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgZGVmYXVsdFJlYWN0aW9ucywgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIHZhciAkc3VtbWFyeUVsZW1lbnQgPSBzdW1tYXJ5V2lkZ2V0LmVsZW1lbnQ7XG4gICAgICAgIGluc2VydENvbnRlbnQoJHN1bW1hcnksICRzdW1tYXJ5RWxlbWVudCwgZ3JvdXBTZXR0aW5ncy5zdW1tYXJ5TWV0aG9kKCkpO1xuICAgICAgICBjcmVhdGVkV2lkZ2V0cy5wdXNoKHN1bW1hcnlXaWRnZXQpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBzY2FuRm9yUmVhZE1vcmUoJGVsZW1lbnQsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgUmVhZE1vcmVFdmVudHMuc2V0dXBSZWFkTW9yZUV2ZW50cygkZWxlbWVudC5nZXQoMCksIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbn1cblxuZnVuY3Rpb24gc2NhbkZvckNvbnRlbnRSZWMoJGVsZW1lbnQsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgaWYgKGdyb3VwU2V0dGluZ3MuaXNTaG93Q29udGVudFJlYygpICYmXG4gICAgICAgICAgICAoQnJvd3Nlck1ldHJpY3MuaXNNb2JpbGUoKSB8fCBBcHBNb2RlLmRlYnVnKSkge1xuICAgICAgICB2YXIgJGNvbnRlbnRSZWNMb2NhdGlvbnMgPSBmaW5kKCRlbGVtZW50LCBncm91cFNldHRpbmdzLmNvbnRlbnRSZWNTZWxlY3RvcigpLCB0cnVlLCB0cnVlKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAkY29udGVudFJlY0xvY2F0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGNvbnRlbnRSZWNMb2NhdGlvbiA9ICRjb250ZW50UmVjTG9jYXRpb25zW2ldO1xuICAgICAgICAgICAgdmFyIGNvbnRlbnRSZWMgPSBDb250ZW50UmVjLmNyZWF0ZUNvbnRlbnRSZWMocGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgdmFyIGNvbnRlbnRSZWNFbGVtZW50ID0gY29udGVudFJlYy5lbGVtZW50O1xuICAgICAgICAgICAgdmFyIG1ldGhvZCA9IGdyb3VwU2V0dGluZ3MuY29udGVudFJlY01ldGhvZCgpO1xuICAgICAgICAgICAgc3dpdGNoIChtZXRob2QpIHtcbiAgICAgICAgICAgICAgICBjYXNlICdhcHBlbmQnOlxuICAgICAgICAgICAgICAgICAgICBjb250ZW50UmVjTG9jYXRpb24uYXBwZW5kQ2hpbGQoY29udGVudFJlY0VsZW1lbnQpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdwcmVwZW5kJzpcbiAgICAgICAgICAgICAgICAgICAgY29udGVudFJlY0xvY2F0aW9uLmluc2VydEJlZm9yZShjb250ZW50UmVjRWxlbWVudCwgY29udGVudFJlY0xvY2F0aW9uLmZpcnN0Q2hpbGQpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdiZWZvcmUnOlxuICAgICAgICAgICAgICAgICAgICBjb250ZW50UmVjTG9jYXRpb24ucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoY29udGVudFJlY0VsZW1lbnQsIGNvbnRlbnRSZWNMb2NhdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ2FmdGVyJzpcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICBjb250ZW50UmVjTG9jYXRpb24ucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoY29udGVudFJlY0VsZW1lbnQsIGNvbnRlbnRSZWNMb2NhdGlvbi5uZXh0U2libGluZyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjcmVhdGVkV2lkZ2V0cy5wdXNoKGNvbnRlbnRSZWMpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBzY2FuRm9yQ2FsbHNUb0FjdGlvbigkZWxlbWVudCwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgY3RhVGFyZ2V0cyA9IHt9OyAvLyBUaGUgZWxlbWVudHMgdGhhdCB0aGUgY2FsbCB0byBhY3Rpb25zIGFjdCBvbiAoZS5nLiB0aGUgaW1hZ2Ugb3IgdmlkZW8pXG4gICAgZmluZCgkZWxlbWVudCwgJ1thbnQtaXRlbV0nLCB0cnVlKS5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgJGN0YVRhcmdldCA9ICQodGhpcyk7XG4gICAgICAgICRjdGFUYXJnZXQuYWRkQ2xhc3MoJ25vLWFudCcpOyAvLyBkb24ndCBzaG93IHRoZSBub3JtYWwgcmVhY3Rpb24gYWZmb3JkYW5jZSBvbiBhIGN0YSB0YXJnZXRcbiAgICAgICAgdmFyIGFudEl0ZW1JZCA9ICRjdGFUYXJnZXQuYXR0cignYW50LWl0ZW0nKS50cmltKCk7XG4gICAgICAgIGN0YVRhcmdldHNbYW50SXRlbUlkXSA9ICRjdGFUYXJnZXQ7XG4gICAgfSk7XG5cbiAgICB2YXIgY3RhTGFiZWxzID0ge307IC8vIE9wdGlvbmFsIGVsZW1lbnRzIHRoYXQgcmVwb3J0IHRoZSBudW1iZXIgb2YgcmVhY3Rpb25zIHRvIHRoZSBjdGEgKGUuZy4gXCIxIHJlYWN0aW9uXCIpXG4gICAgZmluZCgkZWxlbWVudCwgJ1thbnQtcmVhY3Rpb25zLWxhYmVsLWZvcl0nLCB0cnVlKS5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgJGN0YUxhYmVsID0gJCh0aGlzKTtcbiAgICAgICAgJGN0YUxhYmVsLmFkZENsYXNzKCduby1hbnQnKTsgLy8gZG9uJ3Qgc2hvdyB0aGUgbm9ybWFsIHJlYWN0aW9uIGFmZm9yZGFuY2Ugb24gYSBjdGEgbGFiZWxcbiAgICAgICAgdmFyIGFudEl0ZW1JZCA9ICRjdGFMYWJlbC5hdHRyKCdhbnQtcmVhY3Rpb25zLWxhYmVsLWZvcicpLnRyaW0oKTtcbiAgICAgICAgY3RhTGFiZWxzW2FudEl0ZW1JZF0gPSBjdGFMYWJlbHNbYW50SXRlbUlkXSB8fCBbXTtcbiAgICAgICAgY3RhTGFiZWxzW2FudEl0ZW1JZF0ucHVzaCgkY3RhTGFiZWwpO1xuICAgIH0pO1xuXG4gICAgdmFyIGN0YUNvdW50ZXJzID0ge307IC8vIE9wdGlvbmFsIGVsZW1lbnRzIHRoYXQgcmVwb3J0IG9ubHkgdGhlIGNvdW50IG9mIHJlYWN0aW9uIHRvIGEgY3RhIChlLmcuIFwiMVwiKVxuICAgIGZpbmQoJGVsZW1lbnQsICdbYW50LWNvdW50ZXItZm9yXScsIHRydWUpLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkY3RhQ291bnRlciA9ICQodGhpcyk7XG4gICAgICAgICRjdGFDb3VudGVyLmFkZENsYXNzKCduby1hbnQnKTsgLy8gZG9uJ3Qgc2hvdyB0aGUgbm9ybWFsIHJlYWN0aW9uIGFmZm9yZGFuY2Ugb24gYSBjdGEgY291bnRlclxuICAgICAgICB2YXIgYW50SXRlbUlkID0gJGN0YUNvdW50ZXIuYXR0cignYW50LWNvdW50ZXItZm9yJykudHJpbSgpO1xuICAgICAgICBjdGFDb3VudGVyc1thbnRJdGVtSWRdID0gY3RhQ291bnRlcnNbYW50SXRlbUlkXSB8fCBbXTtcbiAgICAgICAgY3RhQ291bnRlcnNbYW50SXRlbUlkXS5wdXNoKCRjdGFDb3VudGVyKTtcbiAgICB9KTtcblxuICAgIHZhciBjdGFFeHBhbmRlZFJlYWN0aW9ucyA9IHt9OyAvLyBPcHRpb25hbCBlbGVtZW50cyB0aGF0IHNob3cgZXhwYW5kZWQgcmVhY3Rpb25zIGZvciB0aGUgY3RhIChlLmcuIFwiSW50ZXJlc3RpbmcgKDE1KSBObyB0aGFua3MgKDEwKVwiKVxuICAgIGZpbmQoJGVsZW1lbnQsICdbYW50LWV4cGFuZGVkLXJlYWN0aW9ucy1mb3JdJywgdHJ1ZSkuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRjdGFFeHBhbmRlZFJlYWN0aW9uQXJlYSA9ICQodGhpcyk7XG4gICAgICAgICRjdGFFeHBhbmRlZFJlYWN0aW9uQXJlYS5hZGRDbGFzcygnbm8tYW50Jyk7IC8vIGRvbid0IHNob3cgdGhlIG5vcm1hbCByZWFjdGlvbiBhZmZvcmRhbmNlIG9uIGEgY3RhIGNvdW50ZXJcbiAgICAgICAgdmFyIGFudEl0ZW1JZCA9ICRjdGFFeHBhbmRlZFJlYWN0aW9uQXJlYS5hdHRyKCdhbnQtZXhwYW5kZWQtcmVhY3Rpb25zLWZvcicpLnRyaW0oKTtcbiAgICAgICAgY3RhRXhwYW5kZWRSZWFjdGlvbnNbYW50SXRlbUlkXSA9IGN0YUV4cGFuZGVkUmVhY3Rpb25zW2FudEl0ZW1JZF0gfHwgW107XG4gICAgICAgIGN0YUV4cGFuZGVkUmVhY3Rpb25zW2FudEl0ZW1JZF0ucHVzaCgkY3RhRXhwYW5kZWRSZWFjdGlvbkFyZWEpO1xuICAgIH0pO1xuXG4gICAgdmFyICRjdGFFbGVtZW50cyA9IGZpbmQoJGVsZW1lbnQsICdbYW50LWN0YS1mb3JdJyk7IC8vIFRoZSBjYWxsIHRvIGFjdGlvbiBlbGVtZW50cyB3aGljaCBwcm9tcHQgdGhlIHVzZXIgdG8gcmVhY3RcbiAgICAkY3RhRWxlbWVudHMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRjdGFFbGVtZW50ID0gJCh0aGlzKTtcbiAgICAgICAgdmFyIGFudEl0ZW1JZCA9ICRjdGFFbGVtZW50LmF0dHIoJ2FudC1jdGEtZm9yJyk7XG4gICAgICAgIHZhciAkdGFyZ2V0RWxlbWVudCA9IGN0YVRhcmdldHNbYW50SXRlbUlkXTtcbiAgICAgICAgaWYgKCR0YXJnZXRFbGVtZW50KSB7XG4gICAgICAgICAgICB2YXIgaGFzaCA9IGNvbXB1dGVIYXNoKCR0YXJnZXRFbGVtZW50LCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICB2YXIgY29udGVudERhdGEgPSBjb21wdXRlQ29udGVudERhdGEoJHRhcmdldEVsZW1lbnQsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgaWYgKGhhc2ggJiYgY29udGVudERhdGEpIHtcbiAgICAgICAgICAgICAgICB2YXIgY29udGFpbmVyRGF0YSA9IFBhZ2VEYXRhLmdldENvbnRhaW5lckRhdGEocGFnZURhdGEsIGhhc2gpO1xuICAgICAgICAgICAgICAgIGNvbnRhaW5lckRhdGEudHlwZSA9IGNvbXB1dGVFbGVtZW50VHlwZSgkdGFyZ2V0RWxlbWVudCk7IC8vIFRPRE86IHJldmlzaXQgd2hldGhlciBpdCBtYWtlcyBzZW5zZSB0byBzZXQgdGhlIHR5cGUgaGVyZVxuICAgICAgICAgICAgICAgIHZhciBjYWxsVG9BY3Rpb24gPSBDYWxsVG9BY3Rpb25JbmRpY2F0b3IuY3JlYXRlKHtcbiAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyRGF0YTogY29udGFpbmVyRGF0YSxcbiAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyRWxlbWVudDogJHRhcmdldEVsZW1lbnQsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnREYXRhOiBjb250ZW50RGF0YSxcbiAgICAgICAgICAgICAgICAgICAgY3RhRWxlbWVudDogJGN0YUVsZW1lbnQsXG4gICAgICAgICAgICAgICAgICAgIGN0YUxhYmVsczogY3RhTGFiZWxzW2FudEl0ZW1JZF0sXG4gICAgICAgICAgICAgICAgICAgIGN0YUNvdW50ZXJzOiBjdGFDb3VudGVyc1thbnRJdGVtSWRdLFxuICAgICAgICAgICAgICAgICAgICBjdGFFeHBhbmRlZFJlYWN0aW9uczogY3RhRXhwYW5kZWRSZWFjdGlvbnNbYW50SXRlbUlkXSxcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdFJlYWN0aW9uczogZ3JvdXBTZXR0aW5ncy5kZWZhdWx0UmVhY3Rpb25zKCR0YXJnZXRFbGVtZW50KSxcbiAgICAgICAgICAgICAgICAgICAgcGFnZURhdGE6IHBhZ2VEYXRhLFxuICAgICAgICAgICAgICAgICAgICBncm91cFNldHRpbmdzOiBncm91cFNldHRpbmdzXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY3JlYXRlZFdpZGdldHMucHVzaChjYWxsVG9BY3Rpb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSlcbn1cblxuZnVuY3Rpb24gY3JlYXRlQXV0b0NhbGxzVG9BY3Rpb24oJHNlY3Rpb24sIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyICRjdGFUYXJnZXRzID0gZmluZCgkc2VjdGlvbiwgZ3JvdXBTZXR0aW5ncy5nZW5lcmF0ZWRDdGFTZWxlY3RvcigpKTtcbiAgICAkY3RhVGFyZ2V0cy5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgJGN0YVRhcmdldCA9ICQodGhpcyk7XG4gICAgICAgIHZhciBhbnRJdGVtSWQgPSBnZW5lcmF0ZUFudEl0ZW1BdHRyaWJ1dGUoKTtcbiAgICAgICAgJGN0YVRhcmdldC5hdHRyKCdhbnQtaXRlbScsIGFudEl0ZW1JZCk7XG4gICAgICAgIHZhciBhdXRvQ3RhID0gQXV0b0NhbGxUb0FjdGlvbi5jcmVhdGUoYW50SXRlbUlkLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICRjdGFUYXJnZXQuYWZ0ZXIoYXV0b0N0YS5lbGVtZW50KTsgLy8gVE9ETzogbWFrZSB0aGUgaW5zZXJ0IGJlaGF2aW9yIGNvbmZpZ3VyYWJsZSBsaWtlIHRoZSBzdW1tYXJ5XG4gICAgICAgIGNyZWF0ZWRXaWRnZXRzLnB1c2goYXV0b0N0YSk7XG4gICAgfSk7XG59XG5cbnZhciBnZW5lcmF0ZUFudEl0ZW1BdHRyaWJ1dGUgPSBmdW5jdGlvbihpbmRleCkge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuICdhbnRlbm5hX2F1dG9fY3RhXycgKyBpbmRleCsrO1xuICAgIH1cbn0oMCk7XG5cbmZ1bmN0aW9uIHNjYW5Gb3JDb250ZW50KCRlbGVtZW50LCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciAkY29udGVudEVsZW1lbnRzID0gZmluZCgkZWxlbWVudCwgZ3JvdXBTZXR0aW5ncy5jb250ZW50U2VsZWN0b3IoKSwgdHJ1ZSk7XG4gICAgJGNvbnRlbnRFbGVtZW50cy5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgJGNvbnRlbnRFbGVtZW50ID0gJCh0aGlzKTtcbiAgICAgICAgdmFyIHR5cGUgPSBjb21wdXRlRWxlbWVudFR5cGUoJGNvbnRlbnRFbGVtZW50KTtcbiAgICAgICAgc3dpdGNoKHR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgVFlQRV9JTUFHRTpcbiAgICAgICAgICAgIGNhc2UgVFlQRV9NRURJQTpcbiAgICAgICAgICAgICAgICBzY2FuTWVkaWEoJGNvbnRlbnRFbGVtZW50LCB0eXBlLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFRZUEVfVEVYVDpcbiAgICAgICAgICAgICAgICBzY2FuVGV4dCgkY29udGVudEVsZW1lbnQsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBzY2FuVGV4dCgkdGV4dEVsZW1lbnQsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgaWYgKHNob3VsZEhhc2hUZXh0KCR0ZXh0RWxlbWVudCwgZ3JvdXBTZXR0aW5ncykpIHtcbiAgICAgICAgdmFyIGhhc2ggPSBjb21wdXRlSGFzaCgkdGV4dEVsZW1lbnQsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgaWYgKGhhc2gpIHtcbiAgICAgICAgICAgIHZhciBjb250YWluZXJEYXRhID0gUGFnZURhdGEuZ2V0Q29udGFpbmVyRGF0YShwYWdlRGF0YSwgaGFzaCk7XG4gICAgICAgICAgICBjb250YWluZXJEYXRhLnR5cGUgPSAndGV4dCc7IC8vIFRPRE86IHJldmlzaXQgd2hldGhlciBpdCBtYWtlcyBzZW5zZSB0byBzZXQgdGhlIHR5cGUgaGVyZVxuICAgICAgICAgICAgdmFyIGRlZmF1bHRSZWFjdGlvbnMgPSBncm91cFNldHRpbmdzLmRlZmF1bHRSZWFjdGlvbnMoJHRleHRFbGVtZW50KTtcbiAgICAgICAgICAgIHZhciB0ZXh0SW5kaWNhdG9yID0gVGV4dEluZGljYXRvcldpZGdldC5jcmVhdGUoe1xuICAgICAgICAgICAgICAgICAgICBjb250YWluZXJEYXRhOiBjb250YWluZXJEYXRhLFxuICAgICAgICAgICAgICAgICAgICBjb250YWluZXJFbGVtZW50OiAkdGV4dEVsZW1lbnQsXG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHRSZWFjdGlvbnM6IGRlZmF1bHRSZWFjdGlvbnMsXG4gICAgICAgICAgICAgICAgICAgIHBhZ2VEYXRhOiBwYWdlRGF0YSxcbiAgICAgICAgICAgICAgICAgICAgZ3JvdXBTZXR0aW5nczogZ3JvdXBTZXR0aW5nc1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICB2YXIgJGluZGljYXRvckVsZW1lbnQgPSB0ZXh0SW5kaWNhdG9yLmVsZW1lbnQ7XG4gICAgICAgICAgICB2YXIgbGFzdE5vZGUgPSBsYXN0Q29udGVudE5vZGUoJHRleHRFbGVtZW50LmdldCgwKSk7XG4gICAgICAgICAgICBpZiAobGFzdE5vZGUubm9kZVR5cGUgIT09IDMpIHtcbiAgICAgICAgICAgICAgICAkKGxhc3ROb2RlKS5iZWZvcmUoJGluZGljYXRvckVsZW1lbnQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAkdGV4dEVsZW1lbnQuYXBwZW5kKCRpbmRpY2F0b3JFbGVtZW50KTsgLy8gVE9ETyBpcyB0aGlzIGNvbmZpZ3VyYWJsZSBhbGEgaW5zZXJ0Q29udGVudCguLi4pP1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY3JlYXRlZFdpZGdldHMucHVzaCh0ZXh0SW5kaWNhdG9yKTtcblxuICAgICAgICAgICAgdmFyIHRleHRSZWFjdGlvbnMgPSBUZXh0UmVhY3Rpb25zLmNyZWF0ZVJlYWN0YWJsZVRleHQoe1xuICAgICAgICAgICAgICAgIGNvbnRhaW5lckRhdGE6IGNvbnRhaW5lckRhdGEsXG4gICAgICAgICAgICAgICAgY29udGFpbmVyRWxlbWVudDogJHRleHRFbGVtZW50LFxuICAgICAgICAgICAgICAgIGRlZmF1bHRSZWFjdGlvbnM6IGRlZmF1bHRSZWFjdGlvbnMsXG4gICAgICAgICAgICAgICAgcGFnZURhdGE6IHBhZ2VEYXRhLFxuICAgICAgICAgICAgICAgIGdyb3VwU2V0dGluZ3M6IGdyb3VwU2V0dGluZ3MsXG4gICAgICAgICAgICAgICAgZXhjbHVkZU5vZGU6ICRpbmRpY2F0b3JFbGVtZW50LmdldCgwKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjcmVhdGVkV2lkZ2V0cy5wdXNoKHRleHRSZWFjdGlvbnMpO1xuXG4gICAgICAgICAgICBNdXRhdGlvbk9ic2VydmVyLmFkZE9uZVRpbWVFbGVtZW50UmVtb3ZhbExpc3RlbmVyKCR0ZXh0RWxlbWVudC5nZXQoMCksIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIEhhc2hlZEVsZW1lbnRzLnJlbW92ZUVsZW1lbnQoaGFzaCwgcGFnZURhdGEucGFnZUhhc2gsICR0ZXh0RWxlbWVudCk7XG4gICAgICAgICAgICAgICAgdGV4dEluZGljYXRvci50ZWFyZG93bigpO1xuICAgICAgICAgICAgICAgIHRleHRSZWFjdGlvbnMudGVhcmRvd24oKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gV2UgdXNlIHRoaXMgdG8gaGFuZGxlIHRoZSBjYXNlIG9mIHRleHQgY29udGVudCB0aGF0IGVuZHMgd2l0aCBzb21lIG5vbi10ZXh0IG5vZGUgYXMgaW5cbiAgICAvLyA8cD5NeSB0ZXh0LiA8aW1nIHNyYz1cIndoYXRldmVyXCI+PC9wPiBvclxuICAgIC8vIDxwPk15IGxvbmcgcGFyYWdyYXBoIHRleHQgd2l0aCBhIGNvbW1vbiBDTVMgcHJvYmxlbS48YnI+PC9wPlxuICAgIC8vIFRoaXMgaXMgYSBzaW1wbGlzdGljIGFsZ29yaXRobSwgbm90IGEgZ2VuZXJhbCBzb2x1dGlvbjpcbiAgICAvLyBXZSB3YWxrIHRoZSBET00gaW5zaWRlIHRoZSBnaXZlbiBub2RlIGFuZCBrZWVwIHRyYWNrIG9mIHRoZSBsYXN0IFwiY29udGVudFwiIG5vZGUgdGhhdCB3ZSBlbmNvdW50ZXIsIHdoaWNoIGNvdWxkIGJlIGVpdGhlclxuICAgIC8vIHRleHQgb3Igc29tZSBtZWRpYS4gIElmIHRoZSBsYXN0IGNvbnRlbnQgbm9kZSBpcyBub3QgdGV4dCwgd2Ugd2FudCB0byBpbnNlcnQgdGhlIHRleHQgaW5kaWNhdG9yIGJlZm9yZSB0aGUgbWVkaWEuXG4gICAgZnVuY3Rpb24gbGFzdENvbnRlbnROb2RlKG5vZGUpIHtcbiAgICAgICAgdmFyIGxhc3ROb2RlO1xuICAgICAgICB2YXIgY2hpbGROb2RlcyA9IG5vZGUuY2hpbGROb2RlcztcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGlsZE5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgY2hpbGQgPSBjaGlsZE5vZGVzW2ldO1xuICAgICAgICAgICAgaWYgKGNoaWxkLm5vZGVUeXBlID09PSAzKSB7XG4gICAgICAgICAgICAgICAgbGFzdE5vZGUgPSBjaGlsZDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY2hpbGQubm9kZVR5cGUgPT09IDEpIHtcbiAgICAgICAgICAgICAgICB2YXIgdGFnTmFtZSA9IGNoaWxkLnRhZ05hbWUudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKHRhZ05hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnaW1nJzpcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnaWZyYW1lJzpcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAndmlkZW8nOlxuICAgICAgICAgICAgICAgICAgICBjYXNlICdpZnJhbWUnOlxuICAgICAgICAgICAgICAgICAgICBjYXNlICdicic6XG4gICAgICAgICAgICAgICAgICAgICAgICBsYXN0Tm9kZSA9IGNoaWxkO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxhc3ROb2RlID0gbGFzdENvbnRlbnROb2RlKGNoaWxkKSB8fCBsYXN0Tm9kZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbGFzdE5vZGU7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBzaG91bGRIYXNoVGV4dCgkdGV4dEVsZW1lbnQsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICBpZiAoKGlzQ3RhKCR0ZXh0RWxlbWVudCwgZ3JvdXBTZXR0aW5ncykpKSB7XG4gICAgICAgIC8vIERvbid0IGhhc2ggdGhlIHRleHQgaWYgaXQgaXMgdGhlIHRhcmdldCBvZiBhIENUQS5cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAvLyBEb24ndCBjcmVhdGUgYW4gaW5kaWNhdG9yIGZvciB0ZXh0IGVsZW1lbnRzIHRoYXQgY29udGFpbiBvdGhlciB0ZXh0IG5vZGVzLlxuICAgIHZhciAkbmVzdGVkRWxlbWVudHMgPSBmaW5kKCR0ZXh0RWxlbWVudCwgZ3JvdXBTZXR0aW5ncy5jb250ZW50U2VsZWN0b3IoKSk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCAkbmVzdGVkRWxlbWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKChjb21wdXRlRWxlbWVudFR5cGUoJCgkbmVzdGVkRWxlbWVudHNbaV0pKSA9PT0gVFlQRV9URVhUKSkge1xuICAgICAgICAgICAgLy8gRG9uJ3QgaGFzaCBhIHRleHQgZWxlbWVudCBpZiBpdCBjb250YWlucyBhbnkgb3RoZXIgbWF0Y2hlZCB0ZXh0IGVsZW1lbnRzXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIGlzQ3RhKCRlbGVtZW50LCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGNvbXBvc2l0ZVNlbGVjdG9yID0gZ3JvdXBTZXR0aW5ncy5nZW5lcmF0ZWRDdGFTZWxlY3RvcigpICsgJyxbYW50LWl0ZW1dJztcbiAgICByZXR1cm4gJGVsZW1lbnQuaXMoY29tcG9zaXRlU2VsZWN0b3IpO1xufVxuXG4vLyBUaGUgXCJpbWFnZVwiIGFuZCBcIm1lZGlhXCIgcGF0aHMgY29udmVyZ2UgaGVyZSwgYmVjYXVzZSB3ZSB1c2UgdGhlIHNhbWUgaW5kaWNhdG9yIG1vZHVsZSBmb3IgdGhlbSBib3RoLlxuZnVuY3Rpb24gc2Nhbk1lZGlhKCRtZWRpYUVsZW1lbnQsIHR5cGUsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGluZGljYXRvcjtcbiAgICB2YXIgY29udGVudERhdGEgPSBjb21wdXRlQ29udGVudERhdGEoJG1lZGlhRWxlbWVudCwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgaWYgKGNvbnRlbnREYXRhICYmIGNvbnRlbnREYXRhLmRpbWVuc2lvbnMpIHtcbiAgICAgICAgaWYgKGNvbnRlbnREYXRhLmRpbWVuc2lvbnMuaGVpZ2h0ID49IDEwMCAmJiBjb250ZW50RGF0YS5kaW1lbnNpb25zLndpZHRoID49IDEwMCkgeyAvLyBEb24ndCBjcmVhdGUgaW5kaWNhdG9yIG9uIGVsZW1lbnRzIHRoYXQgYXJlIHRvbyBzbWFsbFxuICAgICAgICAgICAgdmFyIGhhc2ggPSBjb21wdXRlSGFzaCgkbWVkaWFFbGVtZW50LCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICBpZiAoaGFzaCkge1xuICAgICAgICAgICAgICAgIHZhciBjb250YWluZXJEYXRhID0gUGFnZURhdGEuZ2V0Q29udGFpbmVyRGF0YShwYWdlRGF0YSwgaGFzaCk7XG4gICAgICAgICAgICAgICAgY29udGFpbmVyRGF0YS50eXBlID0gdHlwZSA9PT0gVFlQRV9JTUFHRSA/ICdpbWFnZScgOiAnbWVkaWEnO1xuICAgICAgICAgICAgICAgIHZhciBkZWZhdWx0UmVhY3Rpb25zID0gZ3JvdXBTZXR0aW5ncy5kZWZhdWx0UmVhY3Rpb25zKCRtZWRpYUVsZW1lbnQpO1xuICAgICAgICAgICAgICAgIGluZGljYXRvciA9IE1lZGlhSW5kaWNhdG9yV2lkZ2V0LmNyZWF0ZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50OiBXaWRnZXRCdWNrZXQuZ2V0KCksXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250YWluZXJEYXRhOiBjb250YWluZXJEYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudERhdGE6IGNvbnRlbnREYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyRWxlbWVudDogJG1lZGlhRWxlbWVudCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHRSZWFjdGlvbnM6IGRlZmF1bHRSZWFjdGlvbnMsXG4gICAgICAgICAgICAgICAgICAgICAgICBwYWdlRGF0YTogcGFnZURhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICBncm91cFNldHRpbmdzOiBncm91cFNldHRpbmdzXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIGNyZWF0ZWRXaWRnZXRzLnB1c2goaW5kaWNhdG9yKTtcblxuICAgICAgICAgICAgICAgIE11dGF0aW9uT2JzZXJ2ZXIuYWRkT25lVGltZUVsZW1lbnRSZW1vdmFsTGlzdGVuZXIoJG1lZGlhRWxlbWVudC5nZXQoMCksIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBIYXNoZWRFbGVtZW50cy5yZW1vdmVFbGVtZW50KGhhc2gsIHBhZ2VEYXRhLnBhZ2VIYXNoLCAkbWVkaWFFbGVtZW50KTtcbiAgICAgICAgICAgICAgICAgICAgaW5kaWNhdG9yLnRlYXJkb3duKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgLy8gTGlzdGVuIGZvciBjaGFuZ2VzIHRvIHRoZSBpbWFnZSBhdHRyaWJ1dGVzIHdoaWNoIGNvdWxkIGluZGljYXRlIGNvbnRlbnQgY2hhbmdlcy5cbiAgICBNdXRhdGlvbk9ic2VydmVyLmFkZE9uZVRpbWVBdHRyaWJ1dGVMaXN0ZW5lcigkbWVkaWFFbGVtZW50LmdldCgwKSwgWydzcmMnLCdhbnQtaXRlbS1jb250ZW50JywnZGF0YSddLCBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKGluZGljYXRvcikge1xuICAgICAgICAgICAgLy8gVE9ETzogdXBkYXRlIEhhc2hlZEVsZW1lbnRzIHRvIHJlbW92ZSB0aGUgcHJldmlvdXMgaGFzaC0+ZWxlbWVudCBtYXBwaW5nLiBDb25zaWRlciB0aGVyZSBjb3VsZCBiZSBtdWx0aXBsZVxuICAgICAgICAgICAgLy8gICAgICAgaW5zdGFuY2VzIG9mIHRoZSBzYW1lIGVsZW1lbnQgb24gYSBwYWdlLi4uIHNvIHdlIG1pZ2h0IG5lZWQgdG8gdXNlIGEgY291bnRlci5cbiAgICAgICAgICAgIGluZGljYXRvci50ZWFyZG93bigpO1xuICAgICAgICB9XG4gICAgICAgIHNjYW5NZWRpYSgkbWVkaWFFbGVtZW50LCB0eXBlLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGZpbmQoJGVsZW1lbnQsIHNlbGVjdG9yLCBhZGRCYWNrLCBpZ25vcmVOb0FudCkge1xuICAgIHZhciByZXN1bHQgPSAkZWxlbWVudC5maW5kKHNlbGVjdG9yKTtcbiAgICBpZiAoYWRkQmFjayAmJiBzZWxlY3RvcikgeyAvLyB3aXRoIGFuIHVuZGVmaW5lZCBzZWxlY3RvciwgYWRkQmFjayB3aWxsIG1hdGNoIGFuZCBhbHdheXMgcmV0dXJuIHRoZSBpbnB1dCBlbGVtZW50ICh1bmxpa2UgZmluZCgpIHdoaWNoIHJldHVybnMgYW4gZW1wdHkgbWF0Y2gpXG4gICAgICAgIHJlc3VsdCA9IHJlc3VsdC5hZGRCYWNrKHNlbGVjdG9yKTtcbiAgICB9XG4gICAgaWYgKGlnbm9yZU5vQW50KSB7IC8vIFNvbWUgcGllY2VzIG9mIGNvbnRlbnQgKGUuZy4gdGhlIHN1bW1hcnkgd2lkZ2V0KSBjYW4gYWN0dWFsbHkgZ28gaW5zaWRlIHNlY3Rpb25zIHRhZ2dlZCBuby1hbnRcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdC5maWx0ZXIoZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiAkKHRoaXMpLmNsb3Nlc3QoJy5uby1hbnQnKS5sZW5ndGggPT0gMDtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gaW5zZXJ0Q29udGVudCgkcGFyZW50LCBjb250ZW50LCBtZXRob2QpIHtcbiAgICBzd2l0Y2ggKG1ldGhvZCkge1xuICAgICAgICBjYXNlICdhcHBlbmQnOlxuICAgICAgICAgICAgJHBhcmVudC5hcHBlbmQoY29udGVudCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAncHJlcGVuZCc6XG4gICAgICAgICAgICAkcGFyZW50LnByZXBlbmQoY29udGVudCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnYmVmb3JlJzpcbiAgICAgICAgICAgICRwYXJlbnQuYmVmb3JlKGNvbnRlbnQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2FmdGVyJzpcbiAgICAgICAgICAgICRwYXJlbnQuYWZ0ZXIoY29udGVudCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVIYXNoKCRlbGVtZW50LCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBoYXNoO1xuICAgIHN3aXRjaCAoY29tcHV0ZUVsZW1lbnRUeXBlKCRlbGVtZW50KSkge1xuICAgICAgICBjYXNlIFRZUEVfSU1BR0U6XG4gICAgICAgICAgICB2YXIgaW1hZ2VVcmwgPSBVUkxzLmNvbXB1dGVJbWFnZVVybCgkZWxlbWVudCwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICBoYXNoID0gSGFzaC5oYXNoSW1hZ2UoaW1hZ2VVcmwsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgVFlQRV9NRURJQTpcbiAgICAgICAgICAgIHZhciBtZWRpYVVybCA9IFVSTHMuY29tcHV0ZU1lZGlhVXJsKCRlbGVtZW50LCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgIGhhc2ggPSBIYXNoLmhhc2hNZWRpYShtZWRpYVVybCwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBUWVBFX1RFWFQ6XG4gICAgICAgICAgICBoYXNoID0gSGFzaC5oYXNoVGV4dCgkZWxlbWVudCk7XG4gICAgICAgICAgICB2YXIgaW5jcmVtZW50ID0gMTtcbiAgICAgICAgICAgIHdoaWxlIChoYXNoICYmIEhhc2hlZEVsZW1lbnRzLmdldEVsZW1lbnQoaGFzaCwgcGFnZURhdGEucGFnZUhhc2gpKSB7XG4gICAgICAgICAgICAgICAgaGFzaCA9IEhhc2guaGFzaFRleHQoJGVsZW1lbnQsIGluY3JlbWVudCsrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBpZiAoaGFzaCkge1xuICAgICAgICBIYXNoZWRFbGVtZW50cy5zZXRFbGVtZW50KGhhc2gsIHBhZ2VEYXRhLnBhZ2VIYXNoLCAkZWxlbWVudCk7IC8vIFJlY29yZCB0aGUgcmVsYXRpb25zaGlwIGJldHdlZW4gdGhlIGhhc2ggYW5kIGRvbSBlbGVtZW50LlxuICAgICAgICBpZiAoQXBwTW9kZS5kZWJ1Zykge1xuICAgICAgICAgICAgJGVsZW1lbnQuYXR0cihBVFRSX0hBU0gsIGhhc2gpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBoYXNoO1xufVxuXG5mdW5jdGlvbiBjb21wdXRlQ29udGVudERhdGEoJGVsZW1lbnQsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgY29udGVudERhdGE7XG4gICAgc3dpdGNoIChjb21wdXRlRWxlbWVudFR5cGUoJGVsZW1lbnQpKSB7XG4gICAgICAgIGNhc2UgVFlQRV9JTUFHRTpcbiAgICAgICAgICAgIHZhciBpbWFnZVVybCA9IFVSTHMuY29tcHV0ZUltYWdlVXJsKCRlbGVtZW50LCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgIHZhciBpbWFnZURpbWVuc2lvbnMgPSB7XG4gICAgICAgICAgICAgICAgaGVpZ2h0OiBwYXJzZUludCgkZWxlbWVudC5hdHRyKCdoZWlnaHQnKSkgfHwgJGVsZW1lbnQuaGVpZ2h0KCkgfHwgMCxcbiAgICAgICAgICAgICAgICB3aWR0aDogcGFyc2VJbnQoJGVsZW1lbnQuYXR0cignd2lkdGgnKSkgfHwgJGVsZW1lbnQud2lkdGgoKSB8fCAwXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgY29udGVudERhdGEgPSB7XG4gICAgICAgICAgICAgICAgdHlwZTogJ2ltZycsXG4gICAgICAgICAgICAgICAgYm9keTogaW1hZ2VVcmwsXG4gICAgICAgICAgICAgICAgZGltZW5zaW9uczogaW1hZ2VEaW1lbnNpb25zXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgVFlQRV9NRURJQTpcbiAgICAgICAgICAgIHZhciBtZWRpYVVybCA9IFVSTHMuY29tcHV0ZU1lZGlhVXJsKCRlbGVtZW50LCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgIHZhciBtZWRpYURpbWVuc2lvbnMgPSB7XG4gICAgICAgICAgICAgICAgaGVpZ2h0OiBwYXJzZUludCgkZWxlbWVudC5hdHRyKCdoZWlnaHQnKSkgfHwgJGVsZW1lbnQuaGVpZ2h0KCkgfHwgMCxcbiAgICAgICAgICAgICAgICB3aWR0aDogcGFyc2VJbnQoJGVsZW1lbnQuYXR0cignd2lkdGgnKSkgfHwgJGVsZW1lbnQud2lkdGgoKSB8fCAwXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgY29udGVudERhdGEgPSB7XG4gICAgICAgICAgICAgICAgdHlwZTogJ21lZGlhJyxcbiAgICAgICAgICAgICAgICBib2R5OiBtZWRpYVVybCxcbiAgICAgICAgICAgICAgICBkaW1lbnNpb25zOiBtZWRpYURpbWVuc2lvbnNcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBUWVBFX1RFWFQ6XG4gICAgICAgICAgICBjb250ZW50RGF0YSA9IHsgdHlwZTogJ3RleHQnIH07XG4gICAgICAgICAgICBicmVhaztcbiAgICB9XG4gICAgcmV0dXJuIGNvbnRlbnREYXRhO1xufVxuXG5mdW5jdGlvbiBjb21wdXRlRWxlbWVudFR5cGUoJGVsZW1lbnQpIHtcbiAgICB2YXIgaXRlbVR5cGUgPSAkZWxlbWVudC5hdHRyKCdhbnQtaXRlbS10eXBlJyk7XG4gICAgaWYgKGl0ZW1UeXBlICYmIGl0ZW1UeXBlLnRyaW0oKS5sZW5ndGggPiAwKSB7XG4gICAgICAgIHJldHVybiBpdGVtVHlwZS50cmltKCk7XG4gICAgfVxuICAgIHZhciB0YWdOYW1lID0gJGVsZW1lbnQucHJvcCgndGFnTmFtZScpLnRvTG93ZXJDYXNlKCk7XG4gICAgc3dpdGNoICh0YWdOYW1lKSB7XG4gICAgICAgIGNhc2UgJ2ltZyc6XG4gICAgICAgICAgICByZXR1cm4gVFlQRV9JTUFHRTtcbiAgICAgICAgY2FzZSAndmlkZW8nOlxuICAgICAgICBjYXNlICdpZnJhbWUnOlxuICAgICAgICBjYXNlICdlbWJlZCc6XG4gICAgICAgICAgICByZXR1cm4gVFlQRV9NRURJQTtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHJldHVybiBUWVBFX1RFWFQ7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBzZXR1cE11dGF0aW9uT2JzZXJ2ZXIoZ3JvdXBTZXR0aW5ncywgcmVpbml0aWFsaXplQ2FsbGJhY2spIHtcbiAgICB2YXIgY291bGRCZVNpbmdsZVBhZ2VBcHAgPSB0cnVlO1xuICAgIHZhciBvcmlnaW5hbFBhdGhuYW1lID0gd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lO1xuICAgIHZhciBvcmlnaW5hbFNlYXJjaCA9IHdpbmRvdy5sb2NhdGlvbi5zZWFyY2g7XG4gICAgTXV0YXRpb25PYnNlcnZlci5hZGRBZGRpdGlvbkxpc3RlbmVyKGVsZW1lbnRzQWRkZWQpO1xuXG4gICAgZnVuY3Rpb24gZWxlbWVudHNBZGRlZCgkZWxlbWVudHMpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAkZWxlbWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciAkZWxlbWVudCA9ICRlbGVtZW50c1tpXTtcbiAgICAgICAgICAgICRlbGVtZW50LmZpbmQoZ3JvdXBTZXR0aW5ncy5leGNsdXNpb25TZWxlY3RvcigpKS5hZGRCYWNrKGdyb3VwU2V0dGluZ3MuZXhjbHVzaW9uU2VsZWN0b3IoKSkuYWRkQ2xhc3MoJ25vLWFudCcpOyAvLyBBZGQgdGhlIG5vLWFudCBjbGFzcyB0byBldmVyeXRoaW5nIHRoYXQgaXMgZmxhZ2dlZCBmb3IgZXhjbHVzaW9uXG4gICAgICAgICAgICBpZiAoJGVsZW1lbnQuY2xvc2VzdCgnLm5vLWFudCcpLmxlbmd0aCA9PT0gMCkgeyAvLyBJZ25vcmUgYW55dGhpbmcgdGFnZ2VkIG5vLWFudFxuICAgICAgICAgICAgICAgIC8vIEZpcnN0LCBzZWUgaWYgYW55IGVudGlyZSBwYWdlcyB3ZXJlIGFkZGVkXG4gICAgICAgICAgICAgICAgdmFyICRwYWdlcyA9IGZpbmQoJGVsZW1lbnQsIGdyb3VwU2V0dGluZ3MucGFnZVNlbGVjdG9yKCksIHRydWUpO1xuICAgICAgICAgICAgICAgIGlmICgkcGFnZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICBQYWdlRGF0YUxvYWRlci5wYWdlc0FkZGVkKCRwYWdlcywgZ3JvdXBTZXR0aW5ncyk7IC8vIFRPRE86IGNvbnNpZGVyIGlmIHRoZXJlJ3MgYSBiZXR0ZXIgd2F5IHRvIGFyY2hpdGVjdCB0aGlzXG4gICAgICAgICAgICAgICAgICAgICRwYWdlcy5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjYW5QYWdlKCQodGhpcyksIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgLy8gSWYgYW4gZW50aXJlIHBhZ2UgaXMgYWRkZWQsIGFzc3VtZSB0aGF0IHRoaXMgaXMgYW4gXCJpbmZpbml0ZSBzY3JvbGxcIiBzaXRlIGFuZCBzdG9wIGNoZWNraW5nIGZvclxuICAgICAgICAgICAgICAgICAgICAvLyBzaW5nbGUgcGFnZSBhcHBzLiBUaGlzIGlzIG5lY2Vzc2FyeSBiZWNhdXNlIHNvbWUgaW5maW5pdGUgc2Nyb2xsIHNpdGVzIHVwZGF0ZSB0aGUgbG9jYXRpb24sIHdoaWNoXG4gICAgICAgICAgICAgICAgICAgIC8vIGNhbiB0cmlnZ2VyIGFuIHVubmVjZXNzYXJ5IHJlaW5pdGlhbGl6YXRpb24uXG4gICAgICAgICAgICAgICAgICAgIGNvdWxkQmVTaW5nbGVQYWdlQXBwID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gSWYgbm90IGFuIGVudGlyZSBwYWdlL3BhZ2VzLCBzZWUgaWYgY29udGVudCB3YXMgYWRkZWQgdG8gYW4gZXhpc3RpbmcgcGFnZVxuICAgICAgICAgICAgICAgICAgICB2YXIgJHBhZ2UgPSAkZWxlbWVudC5jbG9zZXN0KGdyb3VwU2V0dGluZ3MucGFnZVNlbGVjdG9yKCkpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoJHBhZ2UubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkcGFnZSA9ICQoJ2JvZHknKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoY291bGRCZVNpbmdsZVBhZ2VBcHApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciAkcGFnZUluZGljYXRvciA9IGZpbmQoJHBhZ2UsIGdyb3VwU2V0dGluZ3MucGFnZVVybFNlbGVjdG9yKCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCRwYWdlSW5kaWNhdG9yLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFdoZW5ldmVyIG5ldyBjb250ZW50IGlzIGFkZGVkLCBjaGVjayBpZiB3ZSBuZWVkIHRvIHJlaW5pdGlhbGl6ZSBhbGwgb3VyIGRhdGEgYmFzZWQgb24gdGhlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gd2luZG93LmxvY2F0aW9uLiBUaGlzIGFjY29tb2RhdGVzIHNpbmdsZSBwYWdlIGFwcHMgdGhhdCBkb24ndCB1c2UgYnJvd3NlciBuYXZpZ2F0aW9uLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIChBcyBhbiBvcHRpbWl6YXRpb24sIHdlIGRvbid0IGRvIHRoaXMgY2hlY2sgaWYgdGhlIGFkZGVkIGVsZW1lbnQgY29udGFpbnMgYW4gZW50aXJlIHBhZ2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB3aXRoIGEgVVJMIHNwZWNpZmllZCBpbnNpZGUgdGhlIGNvbnRlbnQuKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzaG91bGRSZWluaXRpYWxpemVGb3JMb2NhdGlvbkNoYW5nZSgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlaW5pdGlhbGl6ZUNhbGxiYWNrKGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHZhciB1cmwgPSBQYWdlVXRpbHMuY29tcHV0ZVBhZ2VVcmwoJHBhZ2UsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgcGFnZURhdGEgPSBQYWdlRGF0YS5nZXRQYWdlRGF0YUJ5VVJMKHVybCk7XG4gICAgICAgICAgICAgICAgICAgIC8vIEZpcnN0LCBjaGVjayBmb3IgYW55IG5ldyBzdW1tYXJ5IHdpZGdldHMuLi5cbiAgICAgICAgICAgICAgICAgICAgc2NhbkZvclN1bW1hcmllcygkZWxlbWVudCwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgICAgICAgICBzY2FuRm9yUmVhZE1vcmUoJGVsZW1lbnQsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgICAgICAgICAgc2NhbkZvckNvbnRlbnRSZWMoJGVsZW1lbnQsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gTmV4dCwgc2VlIGlmIGFueSBlbnRpcmUgYWN0aXZlIHNlY3Rpb25zIHdlcmUgYWRkZWRcbiAgICAgICAgICAgICAgICAgICAgdmFyICRhY3RpdmVTZWN0aW9ucyA9IGZpbmQoJGVsZW1lbnQsIGdyb3VwU2V0dGluZ3MuYWN0aXZlU2VjdGlvbnMoKSwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmICgkYWN0aXZlU2VjdGlvbnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJGFjdGl2ZVNlY3Rpb25zLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciAkc2VjdGlvbiA9ICQodGhpcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3JlYXRlQXV0b0NhbGxzVG9BY3Rpb24oJHNlY3Rpb24sIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2NhbkZvckNhbGxzVG9BY3Rpb24oJGVsZW1lbnQsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRhY3RpdmVTZWN0aW9ucy5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgJHNlY3Rpb24gPSAkKHRoaXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjYW5BY3RpdmVFbGVtZW50KCRzZWN0aW9uLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZpbmFsbHksIHNjYW4gaW5zaWRlIHRoZSBlbGVtZW50IGZvciBjb250ZW50XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgJGFjdGl2ZVNlY3Rpb24gPSAkZWxlbWVudC5jbG9zZXN0KGdyb3VwU2V0dGluZ3MuYWN0aXZlU2VjdGlvbnMoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoJGFjdGl2ZVNlY3Rpb24ubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNyZWF0ZUF1dG9DYWxsc1RvQWN0aW9uKCRlbGVtZW50LCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NhbkZvckNhbGxzVG9BY3Rpb24oJGVsZW1lbnQsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY2FuQWN0aXZlRWxlbWVudCgkZWxlbWVudCwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiB0aGUgZWxlbWVudCBpcyBhZGRlZCBvdXRzaWRlIGFuIGFjdGl2ZSBzZWN0aW9uLCBqdXN0IGNoZWNrIGl0IGZvciBDVEFzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NhbkZvckNhbGxzVG9BY3Rpb24oJGVsZW1lbnQsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNob3VsZFJlaW5pdGlhbGl6ZUZvckxvY2F0aW9uQ2hhbmdlKCkge1xuICAgICAgICAvLyBSZWluaXRpYWxpemUgd2hlbiB0aGUgbG9jYXRpb24gY2hhbmdlcyBpbiBhIHdheSB0aGF0IHdlIGJlbGlldmUgaXMgbWVhbmluZ2Z1bC5cbiAgICAgICAgLy8gVGhlIGhldXJpc3RpYyB3ZSB1c2UgaXMgdGhhdCBlaXRoZXI6XG4gICAgICAgIC8vIDEuIFRoZSBxdWVyeSBzdHJpbmcgY2hhbmdlcyBhbmQgd2UncmUgb24gYSBzaXRlIHRoYXQgc2F5cyB0aGUgcXVlcnkgc3RyaW5nIG1hdHRlcnMgb3JcbiAgICAgICAgLy8gMi4gVGhlIHBhdGggY2hhbmdlcy4uLlxuICAgICAgICAvLyAgICAyYS4gQnV0IG5vdCBpZiB0aGUgY2hhbmdlIGlzIGFuIGV4dGVuc2lvbiBvZiB0aGUgcGF0aC5cbiAgICAgICAgLy8gICAgICAgIDJhYS4gVW5sZXNzIHdlJ3JlIGdvaW5nIGZyb20gYW4gZW1wdHkgcGF0aCAoJy8nKSB0byBzb21lIG90aGVyIHBhdGguXG4gICAgICAgIHZhciBuZXdMb2NhdGlvblBhdGhuYW1lID0gd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lO1xuICAgICAgICByZXR1cm4gZ3JvdXBTZXR0aW5ncy51cmwuaW5jbHVkZVF1ZXJ5U3RyaW5nKCkgJiYgb3JpZ2luYWxTZWFyY2ggIT0gd2luZG93LmxvY2F0aW9uLnNlYXJjaCB8fFxuICAgICAgICAgICAgICAgIG5ld0xvY2F0aW9uUGF0aG5hbWUgIT0gb3JpZ2luYWxQYXRobmFtZSAmJiAob3JpZ2luYWxQYXRobmFtZSA9PT0gJy8nIHx8IG5ld0xvY2F0aW9uUGF0aG5hbWUuaW5kZXhPZihvcmlnaW5hbFBhdGhuYW1lKSA9PT0gLTEpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gdGVhcmRvd24oKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjcmVhdGVkV2lkZ2V0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjcmVhdGVkV2lkZ2V0c1tpXS50ZWFyZG93bigpO1xuICAgIH1cbiAgICBjcmVhdGVkV2lkZ2V0cyA9IFtdO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgc2Nhbjogc2NhbkFsbFBhZ2VzLFxuICAgIHRlYXJkb3duOiB0ZWFyZG93blxufTsiLCJ2YXIgUmFjdGl2ZTsgcmVxdWlyZSgnLi91dGlscy9yYWN0aXZlLXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGxvYWRlZFJhY3RpdmUpIHsgUmFjdGl2ZSA9IGxvYWRlZFJhY3RpdmU7fSk7XG52YXIgU1ZHcyA9IHJlcXVpcmUoJy4vc3ZncycpO1xuXG52YXIgcGFnZVNlbGVjdG9yID0gJy5hbnRlbm5hLXBlbmRpbmctcGFnZSc7XG5cbmZ1bmN0aW9uIGNyZWF0ZVBhZ2UocmVhY3Rpb25UZXh0LCBlbGVtZW50KSB7XG4gICAgdmFyIHJhY3RpdmUgPSBSYWN0aXZlKHtcbiAgICAgICAgZWw6IGVsZW1lbnQsXG4gICAgICAgIGFwcGVuZDogdHJ1ZSxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgdGV4dDogcmVhY3Rpb25UZXh0XG4gICAgICAgIH0sXG4gICAgICAgIHRlbXBsYXRlOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvcGVuZGluZy1yZWFjdGlvbi1wYWdlLmhicy5odG1sJyksXG4gICAgICAgIHBhcnRpYWxzOiB7XG4gICAgICAgICAgICBsZWZ0OiBTVkdzLmxlZnRcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiB7XG4gICAgICAgIHNlbGVjdG9yOiBwYWdlU2VsZWN0b3IsXG4gICAgICAgIHRlYXJkb3duOiBmdW5jdGlvbigpIHsgcmFjdGl2ZS50ZWFyZG93bigpOyB9XG4gICAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlUGFnZTogY3JlYXRlUGFnZVxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi91dGlscy9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciBSYWN0aXZlOyByZXF1aXJlKCcuL3V0aWxzL3JhY3RpdmUtcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24obG9hZGVkUmFjdGl2ZSkgeyBSYWN0aXZlID0gbG9hZGVkUmFjdGl2ZTt9KTtcbnZhciBXaWRnZXRCdWNrZXQgPSByZXF1aXJlKCcuL3V0aWxzL3dpZGdldC1idWNrZXQnKTtcbnZhciBUcmFuc2l0aW9uVXRpbCA9IHJlcXVpcmUoJy4vdXRpbHMvdHJhbnNpdGlvbi11dGlsJyk7XG5cbnZhciBTVkdzID0gcmVxdWlyZSgnLi9zdmdzJyk7XG5cbnZhciByYWN0aXZlO1xudmFyIGNsaWNrSGFuZGxlcjtcblxuXG5mdW5jdGlvbiBnZXRSb290RWxlbWVudCgpIHtcbiAgICAvLyBUT0RPIHJldmlzaXQgdGhpcywgaXQncyBraW5kIG9mIGdvb2Z5IGFuZCBpdCBtaWdodCBoYXZlIGEgdGltaW5nIHByb2JsZW1cbiAgICBpZiAoIXJhY3RpdmUpIHtcbiAgICAgICAgdmFyIGJ1Y2tldCA9IFdpZGdldEJ1Y2tldC5nZXQoKTtcbiAgICAgICAgcmFjdGl2ZSA9IFJhY3RpdmUoe1xuICAgICAgICAgICAgZWw6IGJ1Y2tldCxcbiAgICAgICAgICAgIGFwcGVuZDogdHJ1ZSxcbiAgICAgICAgICAgIHRlbXBsYXRlOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvcG9wdXAtd2lkZ2V0Lmhicy5odG1sJyksXG4gICAgICAgICAgICBwYXJ0aWFsczoge1xuICAgICAgICAgICAgICAgIGxvZ286IFNWR3MubG9nb1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdmFyICRlbGVtZW50ID0gJChyYWN0aXZlLmZpbmQoJy5hbnRlbm5hLXBvcHVwJykpO1xuICAgICAgICAkZWxlbWVudC5vbignbW91c2Vkb3duJywgZmFsc2UpOyAvLyBQcmV2ZW50IG1vdXNlZG93biBmcm9tIHByb3BhZ2F0aW5nLCBzbyB0aGUgYnJvd3NlciBkb2Vzbid0IGNsZWFyIHRoZSB0ZXh0IHNlbGVjdGlvbi5cbiAgICAgICAgJGVsZW1lbnQub24oJ2NsaWNrLmFudGVubmEtcG9wdXAnLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgaGlkZVBvcHVwKCRlbGVtZW50KTtcbiAgICAgICAgICAgIGlmIChjbGlja0hhbmRsZXIpIHtcbiAgICAgICAgICAgICAgICBjbGlja0hhbmRsZXIoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHNldHVwTW91c2VPdmVyKCRlbGVtZW50KTtcbiAgICAgICAgcmV0dXJuICRlbGVtZW50O1xuICAgIH1cbiAgICByZXR1cm4gJChyYWN0aXZlLmZpbmQoJy5hbnRlbm5hLXBvcHVwJykpO1xufVxuXG5mdW5jdGlvbiBzZXR1cE1vdXNlT3ZlcigkZWxlbWVudCkge1xuICAgIHZhciBjbG9zZVRpbWVyO1xuXG4gICAgLy8gVGhlIDpob3ZlciBwc2V1ZG8gY2xhc3MgY2FuIGJlY29tZSBzdHVjayBvbiB0aGUgYW50ZW5uYS1wb3B1cCBlbGVtZW50IHdoZW4gd2UgYnJpbmcgdXAgdGhlIHJlYWN0aW9uIHdpbmRvd1xuICAgIC8vIGluIHJlc3BvbnNlIHRvIHRoZSBjbGljay4gU28gaGVyZSB3ZSBhZGQvcmVtb3ZlIG91ciBvd24gaG92ZXIgY2xhc3MgaW5zdGVhZC5cbiAgICAvLyBTZWU6IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTAzMjEyNzUvaG92ZXItc3RhdGUtaXMtc3RpY2t5LWFmdGVyLWVsZW1lbnQtaXMtbW92ZWQtb3V0LWZyb20tdW5kZXItdGhlLW1vdXNlLWluLWFsbC1iclxuICAgIHZhciBob3ZlckNsYXNzID0gJ2FudGVubmEtaG92ZXInO1xuICAgICRlbGVtZW50Lm9uKCdtb3VzZWVudGVyJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICRlbGVtZW50LmFkZENsYXNzKGhvdmVyQ2xhc3MpO1xuICAgICAgICBrZWVwT3BlbigpO1xuICAgIH0pO1xuICAgICRlbGVtZW50Lm9uKCdtb3VzZWxlYXZlJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICRlbGVtZW50LnJlbW92ZUNsYXNzKGhvdmVyQ2xhc3MpO1xuICAgICAgICBkZWxheWVkQ2xvc2UoKTtcbiAgICB9KTtcblxuICAgIGZ1bmN0aW9uIGRlbGF5ZWRDbG9zZSgpIHtcbiAgICAgICAgY2xvc2VUaW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBjbG9zZVRpbWVyID0gbnVsbDtcbiAgICAgICAgICAgIGhpZGVQb3B1cCgkZWxlbWVudCk7XG4gICAgICAgIH0sIDUwMCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24ga2VlcE9wZW4oKSB7XG4gICAgICAgIGlmIChjbG9zZVRpbWVyKSB7XG4gICAgICAgICAgICBjbGVhclRpbWVvdXQoY2xvc2VUaW1lcik7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGlzU2hvd2luZygpIHtcbiAgICBpZiAoIXJhY3RpdmUpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB2YXIgJGVsZW1lbnQgPSBnZXRSb290RWxlbWVudCgpO1xuICAgIHJldHVybiAkZWxlbWVudC5oYXNDbGFzcygnYW50ZW5uYS1zaG93Jyk7XG59XG5cbmZ1bmN0aW9uIHNob3dQb3B1cChjb29yZGluYXRlcywgY2FsbGJhY2spIHtcbiAgICB2YXIgJGVsZW1lbnQgPSBnZXRSb290RWxlbWVudCgpO1xuICAgIGlmICghJGVsZW1lbnQuaGFzQ2xhc3MoJ2FudGVubmEtc2hvdycpKSB7XG4gICAgICAgIGNsaWNrSGFuZGxlciA9IGNhbGxiYWNrO1xuICAgICAgICB2YXIgYm9keU9mZnNldCA9ICQoJ2JvZHknKS5vZmZzZXQoKTsgLy8gYWNjb3VudCBmb3IgYW55IG9mZnNldCB0aGF0IHNpdGVzIGFwcGx5IHRvIHRoZSBlbnRpcmUgYm9keVxuICAgICAgICB2YXIgdGFpbCA9IDY7IC8vIFRPRE8gZmluZCBhIGNsZWFuZXIgd2F5IHRvIGFjY291bnQgZm9yIHRoZSBwb3B1cCAndGFpbCdcbiAgICAgICAgJGVsZW1lbnRcbiAgICAgICAgICAgIC5zaG93KCkgLy8gc3RpbGwgaGFzIG9wYWNpdHkgMCBhdCB0aGlzIHBvaW50XG4gICAgICAgICAgICAuY3NzKHtcbiAgICAgICAgICAgICAgICB0b3A6IGNvb3JkaW5hdGVzLnRvcCAtICRlbGVtZW50Lm91dGVySGVpZ2h0KCkgLSB0YWlsIC0gYm9keU9mZnNldC50b3AsXG4gICAgICAgICAgICAgICAgbGVmdDogY29vcmRpbmF0ZXMubGVmdCAtIGJvZHlPZmZzZXQubGVmdCAtIE1hdGguZmxvb3IoJGVsZW1lbnQub3V0ZXJXaWR0aCgpIC8gMilcbiAgICAgICAgICAgIH0pO1xuICAgICAgICBUcmFuc2l0aW9uVXRpbC50b2dnbGVDbGFzcygkZWxlbWVudCwgJ2FudGVubmEtc2hvdycsIHRydWUsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy8gVE9ETzogYWZ0ZXIgdGhlIGFwcGVhcmFuY2UgdHJhbnNpdGlvbiBpcyBjb21wbGV0ZSwgYWRkIGEgaGFuZGxlciBmb3IgbW91c2VlbnRlciB3aGljaCB0aGVuIHJlZ2lzdGVyc1xuICAgICAgICAgICAgLy8gICAgICAgYSBoYW5kbGVyIGZvciBtb3VzZWxlYXZlIHRoYXQgaGlkZXMgdGhlIHBvcHVwXG5cbiAgICAgICAgICAgIC8vIFRPRE86IGFsc28gdGFrZSBkb3duIHRoZSBwb3B1cCBpZiB0aGUgdXNlciBtb3VzZXMgb3ZlciBhbm90aGVyIHdpZGdldCAoc3VtbWFyeSBvciBpbmRpY2F0b3IpXG4gICAgICAgICAgICAkKGRvY3VtZW50KS5vbignY2xpY2suYW50ZW5uYS1wb3B1cCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBoaWRlUG9wdXAoJGVsZW1lbnQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gaGlkZVBvcHVwKCRlbGVtZW50KSB7XG4gICAgVHJhbnNpdGlvblV0aWwudG9nZ2xlQ2xhc3MoJGVsZW1lbnQsICdhbnRlbm5hLXNob3cnLCBmYWxzZSwgZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICghJGVsZW1lbnQuaGFzQ2xhc3MoJ2FudGVubmEtc2hvdycpKSB7IC8vIEJ5IHRoZSB0aW1lIHRoZSB0cmFuc2l0aW9uIGZpbmlzaGVzLCB0aGUgd2lkZ2V0IGNvdWxkIGJlIHNob3dpbmcgYWdhaW4uXG4gICAgICAgICAgICAkZWxlbWVudC5oaWRlKCk7IC8vIGFmdGVyIHdlJ3JlIGF0IG9wYWNpdHkgMCwgaGlkZSB0aGUgZWxlbWVudCBzbyBpdCBkb2Vzbid0IHJlY2VpdmUgYWNjaWRlbnRhbCBjbGlja3NcbiAgICAgICAgfVxuICAgIH0pO1xuICAgICQoZG9jdW1lbnQpLm9mZignY2xpY2suYW50ZW5uYS1wb3B1cCcpO1xufVxuXG5mdW5jdGlvbiB0ZWFyZG93bigpIHtcbiAgICBpZiAocmFjdGl2ZSkge1xuICAgICAgICByYWN0aXZlLnRlYXJkb3duKCk7XG4gICAgICAgIHJhY3RpdmUgPSB1bmRlZmluZWQ7XG4gICAgICAgIGNsaWNrSGFuZGxlciA9IHVuZGVmaW5lZDtcbiAgICB9XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBpc1Nob3dpbmc6IGlzU2hvd2luZyxcbiAgICBzaG93OiBzaG93UG9wdXAsXG4gICAgdGVhcmRvd246IHRlYXJkb3duXG59OyIsInZhciAkOyByZXF1aXJlKCcuL3V0aWxzL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIFJhY3RpdmU7IHJlcXVpcmUoJy4vdXRpbHMvcmFjdGl2ZS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihsb2FkZWRSYWN0aXZlKSB7IFJhY3RpdmUgPSBsb2FkZWRSYWN0aXZlO30pO1xuXG52YXIgQWpheENsaWVudCA9IHJlcXVpcmUoJy4vdXRpbHMvYWpheC1jbGllbnQnKTtcbnZhciBSYW5nZSA9IHJlcXVpcmUoJy4vdXRpbHMvcmFuZ2UnKTtcbnZhciBSZWFjdGlvbnNXaWRnZXRMYXlvdXRVdGlscyA9IHJlcXVpcmUoJy4vdXRpbHMvcmVhY3Rpb25zLXdpZGdldC1sYXlvdXQtdXRpbHMnKTtcblxudmFyIEV2ZW50cyA9IHJlcXVpcmUoJy4vZXZlbnRzJyk7XG52YXIgU1ZHcyA9IHJlcXVpcmUoJy4vc3ZncycpO1xuXG52YXIgcGFnZVNlbGVjdG9yID0gJy5hbnRlbm5hLXJlYWN0aW9ucy1wYWdlJztcblxuZnVuY3Rpb24gY3JlYXRlUGFnZShvcHRpb25zKSB7XG4gICAgdmFyIGlzU3VtbWFyeSA9IG9wdGlvbnMuaXNTdW1tYXJ5O1xuICAgIHZhciByZWFjdGlvbnNEYXRhID0gb3B0aW9ucy5yZWFjdGlvbnNEYXRhO1xuICAgIHZhciBjb250YWluZXJEYXRhID0gb3B0aW9ucy5jb250YWluZXJEYXRhO1xuICAgIHZhciBwYWdlRGF0YSA9IG9wdGlvbnMucGFnZURhdGE7XG4gICAgdmFyIGdyb3VwU2V0dGluZ3MgPSBvcHRpb25zLmdyb3VwU2V0dGluZ3M7XG4gICAgdmFyIGNvbnRhaW5lckVsZW1lbnQgPSBvcHRpb25zLmNvbnRhaW5lckVsZW1lbnQ7IC8vIG9wdGlvbmFsXG4gICAgdmFyIHNob3dDb25maXJtYXRpb24gPSBvcHRpb25zLnNob3dDb25maXJtYXRpb247XG4gICAgdmFyIHNob3dEZWZhdWx0cyA9IG9wdGlvbnMuc2hvd0RlZmF1bHRzO1xuICAgIHZhciBzaG93Q29tbWVudHMgPSBvcHRpb25zLnNob3dDb21tZW50cztcbiAgICB2YXIgc2hvd0xvY2F0aW9ucyA9IG9wdGlvbnMuc2hvd0xvY2F0aW9ucztcbiAgICB2YXIgaGFuZGxlUmVhY3Rpb25FcnJvciA9IG9wdGlvbnMuaGFuZGxlUmVhY3Rpb25FcnJvcjtcbiAgICB2YXIgZWxlbWVudCA9IG9wdGlvbnMuZWxlbWVudDtcbiAgICB2YXIgcmVhY3Rpb25zTGF5b3V0RGF0YSA9IFJlYWN0aW9uc1dpZGdldExheW91dFV0aWxzLmNvbXB1dGVMYXlvdXREYXRhKHJlYWN0aW9uc0RhdGEpO1xuICAgIHZhciAkcmVhY3Rpb25zV2luZG93ID0gJChvcHRpb25zLnJlYWN0aW9uc1dpbmRvdyk7XG4gICAgdmFyIHJhY3RpdmUgPSBSYWN0aXZlKHtcbiAgICAgICAgZWw6IGVsZW1lbnQsXG4gICAgICAgIGFwcGVuZDogdHJ1ZSxcbiAgICAgICAgdGVtcGxhdGU6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9yZWFjdGlvbnMtcGFnZS5oYnMuaHRtbCcpLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICByZWFjdGlvbnM6IHJlYWN0aW9uc0RhdGEsXG4gICAgICAgICAgICByZWFjdGlvbnNMYXlvdXRDbGFzczogYXJyYXlBY2Nlc3NvcihyZWFjdGlvbnNMYXlvdXREYXRhLmxheW91dENsYXNzZXMpLFxuICAgICAgICAgICAgaXNTdW1tYXJ5OiBpc1N1bW1hcnksXG4gICAgICAgICAgICBoaWRlQ29tbWVudElucHV0OiBncm91cFNldHRpbmdzLnJlcXVpcmVzQXBwcm92YWwoKSAvLyBDdXJyZW50bHksIHNpdGVzIHRoYXQgcmVxdWlyZSBhcHByb3ZhbCBkb24ndCBzdXBwb3J0IGNvbW1lbnQgaW5wdXQuXG4gICAgICAgIH0sXG4gICAgICAgIGRlY29yYXRvcnM6IHtcbiAgICAgICAgICAgIHNpemV0b2ZpdDogc2l6ZVRvRml0KCRyZWFjdGlvbnNXaW5kb3cpXG4gICAgICAgIH0sXG4gICAgICAgIHBhcnRpYWxzOiB7XG4gICAgICAgICAgICBsb2NhdGlvbkljb246IFNWR3MubG9jYXRpb24sXG4gICAgICAgICAgICBjb21tZW50c0ljb246IFNWR3MuY29tbWVudHNcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgaWYgKGNvbnRhaW5lckVsZW1lbnQpIHtcbiAgICAgICAgcmFjdGl2ZS5vbignaGlnaGxpZ2h0JywgaGlnaGxpZ2h0Q29udGVudChjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgY29udGFpbmVyRWxlbWVudCkpO1xuICAgICAgICByYWN0aXZlLm9uKCdjbGVhcmhpZ2hsaWdodHMnLCBSYW5nZS5jbGVhckhpZ2hsaWdodHMpO1xuICAgIH1cbiAgICByYWN0aXZlLm9uKCdwbHVzb25lJywgcGx1c09uZSk7XG4gICAgcmFjdGl2ZS5vbignc2hvd2RlZmF1bHQnLCBzaG93RGVmYXVsdHMpO1xuICAgIHJhY3RpdmUub24oJ3Nob3djb21tZW50cycsIGZ1bmN0aW9uKHJhY3RpdmVFdmVudCkgeyBzaG93Q29tbWVudHMocmFjdGl2ZUV2ZW50LmNvbnRleHQsIHBhZ2VTZWxlY3Rvcik7IHJldHVybiBmYWxzZTsgfSk7IC8vIFRPRE8gY2xlYW4gdXBcbiAgICByYWN0aXZlLm9uKCdzaG93bG9jYXRpb25zJywgZnVuY3Rpb24ocmFjdGl2ZUV2ZW50KSB7IHNob3dMb2NhdGlvbnMocmFjdGl2ZUV2ZW50LmNvbnRleHQsIHBhZ2VTZWxlY3Rvcik7IHJldHVybiBmYWxzZTsgfSk7IC8vIFRPRE8gY2xlYW4gdXBcbiAgICByZXR1cm4ge1xuICAgICAgICBzZWxlY3RvcjogcGFnZVNlbGVjdG9yLFxuICAgICAgICB0ZWFyZG93bjogZnVuY3Rpb24oKSB7IHJhY3RpdmUudGVhcmRvd24oKTsgfVxuICAgIH07XG5cbiAgICBmdW5jdGlvbiBhcnJheUFjY2Vzc29yKGFycmF5KSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbihpbmRleCkge1xuICAgICAgICAgICAgcmV0dXJuIGFycmF5W2luZGV4XTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBsdXNPbmUocmFjdGl2ZUV2ZW50KSB7XG4gICAgICAgIHZhciByZWFjdGlvbkRhdGEgPSByYWN0aXZlRXZlbnQuY29udGV4dDtcbiAgICAgICAgdmFyIHJlYWN0aW9uUHJvdmlkZXIgPSB7IC8vIHRoaXMgcmVhY3Rpb24gcHJvdmlkZXIgaXMgYSBuby1icmFpbmVyIGJlY2F1c2Ugd2UgYWxyZWFkeSBoYXZlIGEgdmFsaWQgcmVhY3Rpb24gKG9uZSB3aXRoIGFuIElEKVxuICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKHJlYWN0aW9uRGF0YSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHNob3dDb25maXJtYXRpb24ocmVhY3Rpb25EYXRhLCByZWFjdGlvblByb3ZpZGVyKTtcbiAgICAgICAgQWpheENsaWVudC5wb3N0UGx1c09uZShyZWFjdGlvbkRhdGEsIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzLCBzdWNjZXNzLCBlcnJvcik7XG5cbiAgICAgICAgZnVuY3Rpb24gc3VjY2VzcyhyZWFjdGlvbkRhdGEpIHtcbiAgICAgICAgICAgIEV2ZW50cy5wb3N0UmVhY3Rpb25DcmVhdGVkKHBhZ2VEYXRhLCBjb250YWluZXJEYXRhLCByZWFjdGlvbkRhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZXJyb3IobWVzc2FnZSkge1xuICAgICAgICAgICAgdmFyIHJldHJ5ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgQWpheENsaWVudC5wb3N0UGx1c09uZShyZWFjdGlvbkRhdGEsIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzLCBzdWNjZXNzLCBlcnJvcik7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaGFuZGxlUmVhY3Rpb25FcnJvcihtZXNzYWdlLCByZXRyeSwgcGFnZVNlbGVjdG9yKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gc2l6ZVRvRml0KCRyZWFjdGlvbnNXaW5kb3cpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24obm9kZSkge1xuICAgICAgICB2YXIgJGVsZW1lbnQgPSAkKG5vZGUpLmNsb3Nlc3QoJy5hbnRlbm5hLXJlYWN0aW9uLWJveCcpO1xuICAgICAgICAvLyBXaGlsZSB3ZSdyZSBzaXppbmcgdGhlIHRleHQgdG8gZml4IGluIHRoZSByZWFjdGlvbiBib3gsIHdlIGFsc28gZml4IHVwIHRoZSB3aWR0aCBvZiB0aGUgcmVhY3Rpb24gY291bnQgYW5kXG4gICAgICAgIC8vIHBsdXMgb25lIGJ1dHRvbnMgc28gdGhhdCB0aGV5J3JlIHRoZSBzYW1lLiBUaGVzZSB0d28gdmlzdWFsbHkgc3dhcCB3aXRoIGVhY2ggb3RoZXIgb24gaG92ZXI7IG1ha2luZyB0aGVtXG4gICAgICAgIC8vIHRoZSBzYW1lIHdpZHRoIG1ha2VzIHN1cmUgd2UgZG9uJ3QgZ2V0IGp1bXBpbmVzcyBvbiBob3Zlci5cbiAgICAgICAgdmFyICRyZWFjdGlvbkNvdW50ID0gJGVsZW1lbnQuZmluZCgnLmFudGVubmEtcmVhY3Rpb24tY291bnQnKTtcbiAgICAgICAgdmFyICRwbHVzT25lID0gJGVsZW1lbnQuZmluZCgnLmFudGVubmEtcGx1c29uZScpO1xuICAgICAgICB2YXIgbWluV2lkdGggPSBNYXRoLm1heCgkcmVhY3Rpb25Db3VudC53aWR0aCgpLCAkcGx1c09uZS53aWR0aCgpKTtcbiAgICAgICAgbWluV2lkdGgrKzsgLy8gQWRkIGFuIGV4dHJhIHBpeGVsIGZvciByb3VuZGluZyBiZWNhdXNlIGVsZW1lbnRzIHRoYXQgbWVhc3VyZSwgZm9yIGV4YW1wbGUsIDE3LjE4NzVweCBjYW4gY29tZSBiYWNrIHdpdGggMTcgYXMgdGhlIHdpZHRoKClcbiAgICAgICAgJHJlYWN0aW9uQ291bnQuY3NzKHsnbWluLXdpZHRoJzogbWluV2lkdGh9KTtcbiAgICAgICAgJHBsdXNPbmUuY3NzKHsnbWluLXdpZHRoJzogbWluV2lkdGh9KTtcbiAgICAgICAgcmV0dXJuIFJlYWN0aW9uc1dpZGdldExheW91dFV0aWxzLnNpemVUb0ZpdCgkcmVhY3Rpb25zV2luZG93KShub2RlKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGhpZ2hsaWdodENvbnRlbnQoY29udGFpbmVyRGF0YSwgcGFnZURhdGEsICRjb250YWluZXJFbGVtZW50KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHZhciByZWFjdGlvbkRhdGEgPSBldmVudC5jb250ZXh0O1xuICAgICAgICBpZiAocmVhY3Rpb25EYXRhLmNvbnRlbnQpIHtcbiAgICAgICAgICAgIHZhciBsb2NhdGlvbiA9IHJlYWN0aW9uRGF0YS5jb250ZW50LmxvY2F0aW9uO1xuICAgICAgICAgICAgaWYgKGxvY2F0aW9uKSB7XG4gICAgICAgICAgICAgICAgUmFuZ2UuaGlnaGxpZ2h0KCRjb250YWluZXJFbGVtZW50LmdldCgwKSwgbG9jYXRpb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlOiBjcmVhdGVQYWdlXG59OyIsInZhciAkOyByZXF1aXJlKCcuL3V0aWxzL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIEFqYXhDbGllbnQgPSByZXF1aXJlKCcuL3V0aWxzL2FqYXgtY2xpZW50Jyk7XG52YXIgQnJvd3Nlck1ldHJpY3MgPSByZXF1aXJlKCcuL3V0aWxzL2Jyb3dzZXItbWV0cmljcycpO1xudmFyIEpTT05VdGlscyA9IHJlcXVpcmUoJy4vdXRpbHMvanNvbi11dGlscycpO1xudmFyIE1lc3NhZ2VzID0gcmVxdWlyZSgnLi91dGlscy9tZXNzYWdlcycpO1xudmFyIE1vdmVhYmxlID0gcmVxdWlyZSgnLi91dGlscy9tb3ZlYWJsZScpO1xudmFyIFJhY3RpdmU7IHJlcXVpcmUoJy4vdXRpbHMvcmFjdGl2ZS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihsb2FkZWRSYWN0aXZlKSB7IFJhY3RpdmUgPSBsb2FkZWRSYWN0aXZlO30pO1xudmFyIFJhbmdlID0gcmVxdWlyZSgnLi91dGlscy9yYW5nZScpO1xudmFyIFRvdWNoU3VwcG9ydCA9IHJlcXVpcmUoJy4vdXRpbHMvdG91Y2gtc3VwcG9ydCcpO1xudmFyIFRyYW5zaXRpb25VdGlsID0gcmVxdWlyZSgnLi91dGlscy90cmFuc2l0aW9uLXV0aWwnKTtcbnZhciBVc2VyID0gcmVxdWlyZSgnLi91dGlscy91c2VyJyk7XG52YXIgV2lkZ2V0QnVja2V0ID0gcmVxdWlyZSgnLi91dGlscy93aWRnZXQtYnVja2V0Jyk7XG5cbnZhciBCbG9ja2VkUmVhY3Rpb25QYWdlID0gcmVxdWlyZSgnLi9ibG9ja2VkLXJlYWN0aW9uLXBhZ2UnKTtcbnZhciBDb21tZW50c1BhZ2UgPSByZXF1aXJlKCcuL2NvbW1lbnRzLXBhZ2UnKTtcbnZhciBDb25maXJtYXRpb25QYWdlID0gcmVxdWlyZSgnLi9jb25maXJtYXRpb24tcGFnZScpO1xudmFyIERlZmF1bHRzUGFnZSA9IHJlcXVpcmUoJy4vZGVmYXVsdHMtcGFnZScpO1xudmFyIEV2ZW50cyA9IHJlcXVpcmUoJy4vZXZlbnRzJyk7XG52YXIgR2VuZXJpY0Vycm9yUGFnZSA9IHJlcXVpcmUoJy4vZ2VuZXJpYy1lcnJvci1wYWdlJyk7XG52YXIgTG9jYXRpb25zUGFnZSA9IHJlcXVpcmUoJy4vbG9jYXRpb25zLXBhZ2UnKTtcbnZhciBMb2dpblBhZ2UgPSByZXF1aXJlKCcuL2xvZ2luLXBhZ2UnKTtcbnZhciBQYWdlRGF0YSA9IHJlcXVpcmUoJy4vcGFnZS1kYXRhJyk7XG52YXIgUGVuZGluZ1JlYWN0aW9uUGFnZSA9IHJlcXVpcmUoJy4vcGVuZGluZy1yZWFjdGlvbi1wYWdlJyk7XG52YXIgUmVhY3Rpb25zUGFnZSA9IHJlcXVpcmUoJy4vcmVhY3Rpb25zLXBhZ2UnKTtcbnZhciBTVkdzID0gcmVxdWlyZSgnLi9zdmdzJyk7XG5cbnZhciBQQUdFX1JFQUNUSU9OUyA9ICdyZWFjdGlvbnMnO1xudmFyIFBBR0VfREVGQVVMVFMgPSAnZGVmYXVsdHMnO1xudmFyIFBBR0VfQVVUTyA9ICdhdXRvJztcblxudmFyIFNFTEVDVE9SX1JFQUNUSU9OU19XSURHRVQgPSAnLmFudGVubmEtcmVhY3Rpb25zLXdpZGdldCc7XG5cbnZhciBvcGVuSW5zdGFuY2VzID0gW107XG5cbmZ1bmN0aW9uIG9wZW5SZWFjdGlvbnNXaWRnZXQob3B0aW9ucywgZWxlbWVudE9yQ29vcmRzKSB7XG4gICAgY2xvc2VBbGxXaW5kb3dzKCk7XG4gICAgdmFyIGRlZmF1bHRSZWFjdGlvbnMgPSBvcHRpb25zLmRlZmF1bHRSZWFjdGlvbnM7XG4gICAgdmFyIHJlYWN0aW9uc0RhdGEgPSBvcHRpb25zLnJlYWN0aW9uc0RhdGE7XG4gICAgdmFyIGNvbnRhaW5lckRhdGEgPSBvcHRpb25zLmNvbnRhaW5lckRhdGE7XG4gICAgdmFyIGNvbnRhaW5lckVsZW1lbnQgPSBvcHRpb25zLmNvbnRhaW5lckVsZW1lbnQ7IC8vIG9wdGlvbmFsXG4gICAgdmFyIHN0YXJ0UGFnZSA9IG9wdGlvbnMuc3RhcnRQYWdlIHx8IFBBR0VfQVVUTzsgLy8gb3B0aW9uYWxcbiAgICB2YXIgaXNTdW1tYXJ5ID0gb3B0aW9ucy5pc1N1bW1hcnkgPT09IHVuZGVmaW5lZCA/IGZhbHNlIDogb3B0aW9ucy5pc1N1bW1hcnk7IC8vIG9wdGlvbmFsXG4gICAgLy8gY29udGVudERhdGEgY29udGFpbnMgZGV0YWlscyBhYm91dCB0aGUgY29udGVudCBiZWluZyByZWFjdGVkIHRvIGxpa2UgdGV4dCByYW5nZSBvciBpbWFnZSBoZWlnaHQvd2lkdGguXG4gICAgLy8gd2UgcG90ZW50aWFsbHkgbW9kaWZ5IHRoaXMgZGF0YSAoZS5nLiBpbiB0aGUgZGVmYXVsdCByZWFjdGlvbiBjYXNlIHdlIHNlbGVjdCB0aGUgdGV4dCBvdXJzZWx2ZXMpIHNvIHdlXG4gICAgLy8gbWFrZSBhIGxvY2FsIGNvcHkgb2YgaXQgdG8gYXZvaWQgdW5leHBlY3RlZGx5IGNoYW5naW5nIGRhdGEgb3V0IGZyb20gdW5kZXIgb25lIG9mIHRoZSBjbGllbnRzXG4gICAgdmFyIGNvbnRlbnREYXRhID0gSlNPTi5wYXJzZShKU09OVXRpbHMuc3RyaW5naWZ5KG9wdGlvbnMuY29udGVudERhdGEpKTtcbiAgICB2YXIgcGFnZURhdGEgPSBvcHRpb25zLnBhZ2VEYXRhO1xuICAgIHZhciBncm91cFNldHRpbmdzID0gb3B0aW9ucy5ncm91cFNldHRpbmdzO1xuICAgIHZhciByYWN0aXZlID0gUmFjdGl2ZSh7XG4gICAgICAgIGVsOiBXaWRnZXRCdWNrZXQuZ2V0KCksXG4gICAgICAgIGFwcGVuZDogdHJ1ZSxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgc3VwcG9ydHNUb3VjaDogQnJvd3Nlck1ldHJpY3Muc3VwcG9ydHNUb3VjaCgpXG4gICAgICAgIH0sXG4gICAgICAgIHRlbXBsYXRlOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvcmVhY3Rpb25zLXdpZGdldC5oYnMuaHRtbCcpLFxuICAgICAgICBwYXJ0aWFsczoge1xuICAgICAgICAgICAgbG9nbzogU1ZHcy5sb2dvXG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIHJhY3RpdmUub24oJ2Nsb3NlJywgY2xvc2VBbGxXaW5kb3dzKTtcbiAgICB2YXIgJHJvb3RFbGVtZW50ID0gJChyb290RWxlbWVudChyYWN0aXZlKSk7XG4gICAgTW92ZWFibGUubWFrZU1vdmVhYmxlKCRyb290RWxlbWVudCwgJHJvb3RFbGVtZW50LmZpbmQoJy5hbnRlbm5hLWhlYWRlcicpKTtcbiAgICB2YXIgcGFnZXMgPSBbXTtcblxuICAgIG9wZW5XaW5kb3coKTtcblxuICAgIGZ1bmN0aW9uIG9wZW5XaW5kb3coKSB7XG4gICAgICAgIFBhZ2VEYXRhLmNsZWFySW5kaWNhdG9yTGltaXQocGFnZURhdGEpO1xuICAgICAgICB2YXIgY29vcmRzO1xuICAgICAgICBpZiAoZWxlbWVudE9yQ29vcmRzLnRvcCAmJiBlbGVtZW50T3JDb29yZHMubGVmdCkge1xuICAgICAgICAgICAgY29vcmRzID0gZWxlbWVudE9yQ29vcmRzO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyICRyZWxhdGl2ZUVsZW1lbnQgPSAkKGVsZW1lbnRPckNvb3Jkcyk7XG4gICAgICAgICAgICB2YXIgb2Zmc2V0ID0gJHJlbGF0aXZlRWxlbWVudC5vZmZzZXQoKTtcbiAgICAgICAgICAgIHZhciBib2R5T2Zmc2V0ID0gJCgnYm9keScpLm9mZnNldCgpOyAvLyBhY2NvdW50IGZvciBhbnkgb2Zmc2V0IHRoYXQgc2l0ZXMgYXBwbHkgdG8gdGhlIGVudGlyZSBib2R5XG4gICAgICAgICAgICBjb29yZHMgPSB7XG4gICAgICAgICAgICAgICAgdG9wOiBvZmZzZXQudG9wIC0gYm9keU9mZnNldC50b3AsXG4gICAgICAgICAgICAgICAgbGVmdDogb2Zmc2V0LmxlZnQgLSBib2R5T2Zmc2V0LmxlZnRcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGhvcml6b250YWxPdmVyZmxvdyA9IGNvb3Jkcy5sZWZ0ICsgJHJvb3RFbGVtZW50LndpZHRoKCkgLSBNYXRoLm1heChkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50V2lkdGgsIHdpbmRvdy5pbm5lcldpZHRoIHx8IDApOyAvLyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzEyNDgwODEvZ2V0LXRoZS1icm93c2VyLXZpZXdwb3J0LWRpbWVuc2lvbnMtd2l0aC1qYXZhc2NyaXB0Lzg4NzYwNjkjODg3NjA2OVxuICAgICAgICBpZiAoaG9yaXpvbnRhbE92ZXJmbG93ID4gMCkge1xuICAgICAgICAgICAgY29vcmRzLmxlZnQgPSBjb29yZHMubGVmdCAtIGhvcml6b250YWxPdmVyZmxvdztcbiAgICAgICAgfVxuICAgICAgICAkcm9vdEVsZW1lbnQuc3RvcCh0cnVlLCB0cnVlKS5hZGRDbGFzcygnYW50ZW5uYS1yZWFjdGlvbnMtb3BlbicpLmNzcyhjb29yZHMpO1xuXG4gICAgICAgIHZhciBpc1Nob3dSZWFjdGlvbnMgPSBzdGFydFBhZ2UgPT09IFBBR0VfUkVBQ1RJT05TIHx8IChzdGFydFBhZ2UgPT09IFBBR0VfQVVUTyAmJiByZWFjdGlvbnNEYXRhLmxlbmd0aCA+IDApO1xuICAgICAgICBpZiAoaXNTaG93UmVhY3Rpb25zKSB7XG4gICAgICAgICAgICBzaG93UmVhY3Rpb25zKGZhbHNlKTtcbiAgICAgICAgfSBlbHNlIHsgLy8gc3RhcnRQYWdlID09PSBwYWdlRGVmYXVsdHMgfHwgdGhlcmUgYXJlIG5vIHJlYWN0aW9uc1xuICAgICAgICAgICAgc2hvd0RlZmF1bHRSZWFjdGlvbnNQYWdlKGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaXNTdW1tYXJ5KSB7XG4gICAgICAgICAgICBFdmVudHMucG9zdFN1bW1hcnlPcGVuZWQoaXNTaG93UmVhY3Rpb25zLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBFdmVudHMucG9zdFJlYWN0aW9uV2lkZ2V0T3BlbmVkKGlzU2hvd1JlYWN0aW9ucywgcGFnZURhdGEsIGNvbnRhaW5lckRhdGEsIGNvbnRlbnREYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHNldHVwV2luZG93Q2xvc2UocGFnZXMsIHJhY3RpdmUpO1xuICAgICAgICBwcmV2ZW50RXh0cmFTY3JvbGwoJHJvb3RFbGVtZW50KTtcbiAgICAgICAgb3Blbkluc3RhbmNlcy5wdXNoKHJhY3RpdmUpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNob3dSZWFjdGlvbnMoYW5pbWF0ZSkge1xuICAgICAgICB2YXIgb3B0aW9ucyA9IHtcbiAgICAgICAgICAgIGlzU3VtbWFyeTogaXNTdW1tYXJ5LFxuICAgICAgICAgICAgcmVhY3Rpb25zRGF0YTogcmVhY3Rpb25zRGF0YSxcbiAgICAgICAgICAgIHBhZ2VEYXRhOiBwYWdlRGF0YSxcbiAgICAgICAgICAgIGdyb3VwU2V0dGluZ3M6IGdyb3VwU2V0dGluZ3MsXG4gICAgICAgICAgICBjb250YWluZXJEYXRhOiBjb250YWluZXJEYXRhLFxuICAgICAgICAgICAgY29udGFpbmVyRWxlbWVudDogY29udGFpbmVyRWxlbWVudCxcbiAgICAgICAgICAgIHNob3dDb25maXJtYXRpb246IHNob3dDb25maXJtYXRpb24sXG4gICAgICAgICAgICBzaG93RGVmYXVsdHM6IGZ1bmN0aW9uKCkgeyBzaG93RGVmYXVsdFJlYWN0aW9uc1BhZ2UodHJ1ZSkgfSxcbiAgICAgICAgICAgIHNob3dDb21tZW50czogc2hvd0NvbW1lbnRzLFxuICAgICAgICAgICAgc2hvd0xvY2F0aW9uczogc2hvd0xvY2F0aW9ucyxcbiAgICAgICAgICAgIGhhbmRsZVJlYWN0aW9uRXJyb3I6IGhhbmRsZVJlYWN0aW9uRXJyb3IsXG4gICAgICAgICAgICBlbGVtZW50OiBwYWdlQ29udGFpbmVyKHJhY3RpdmUpLFxuICAgICAgICAgICAgcmVhY3Rpb25zV2luZG93OiAkcm9vdEVsZW1lbnRcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIHBhZ2UgPSBSZWFjdGlvbnNQYWdlLmNyZWF0ZShvcHRpb25zKTtcbiAgICAgICAgcGFnZXMucHVzaChwYWdlKTtcbiAgICAgICAgc2hvd1BhZ2UocGFnZS5zZWxlY3RvciwgJHJvb3RFbGVtZW50LCBhbmltYXRlLCBmYWxzZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2hvd0RlZmF1bHRSZWFjdGlvbnNQYWdlKGFuaW1hdGUpIHtcbiAgICAgICAgaWYgKGNvbnRhaW5lckVsZW1lbnQgJiYgIWNvbnRlbnREYXRhLmxvY2F0aW9uICYmICFjb250ZW50RGF0YS5ib2R5KSB7XG4gICAgICAgICAgICBSYW5nZS5ncmFiTm9kZShjb250YWluZXJFbGVtZW50LmdldCgwKSwgZnVuY3Rpb24gKHRleHQsIGxvY2F0aW9uKSB7XG4gICAgICAgICAgICAgICAgY29udGVudERhdGEubG9jYXRpb24gPSBsb2NhdGlvbjtcbiAgICAgICAgICAgICAgICBjb250ZW50RGF0YS5ib2R5ID0gdGV4dDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHZhciBvcHRpb25zID0geyAvLyBUT0RPOiBjbGVhbiB1cCB0aGUgbnVtYmVyIG9mIHRoZXNlIFwib3B0aW9uc1wiIG9iamVjdHMgdGhhdCB3ZSBjcmVhdGUuXG4gICAgICAgICAgICBkZWZhdWx0UmVhY3Rpb25zOiBkZWZhdWx0UmVhY3Rpb25zLFxuICAgICAgICAgICAgcGFnZURhdGE6IHBhZ2VEYXRhLFxuICAgICAgICAgICAgZ3JvdXBTZXR0aW5nczogZ3JvdXBTZXR0aW5ncyxcbiAgICAgICAgICAgIGNvbnRhaW5lckRhdGE6IGNvbnRhaW5lckRhdGEsXG4gICAgICAgICAgICBjb250ZW50RGF0YTogY29udGVudERhdGEsXG4gICAgICAgICAgICBzaG93Q29uZmlybWF0aW9uOiBzaG93Q29uZmlybWF0aW9uLFxuICAgICAgICAgICAgc2hvd1BlbmRpbmdBcHByb3ZhbDogc2hvd1BlbmRpbmdBcHByb3ZhbCxcbiAgICAgICAgICAgIHNob3dQcm9ncmVzczogc2hvd1Byb2dyZXNzUGFnZSxcbiAgICAgICAgICAgIGhhbmRsZVJlYWN0aW9uRXJyb3I6IGhhbmRsZVJlYWN0aW9uRXJyb3IsXG4gICAgICAgICAgICBlbGVtZW50OiBwYWdlQ29udGFpbmVyKHJhY3RpdmUpLFxuICAgICAgICAgICAgcmVhY3Rpb25zV2luZG93OiAkcm9vdEVsZW1lbnRcbiAgICAgICAgfTtcbiAgICAgICAgc2V0V2luZG93VGl0bGUoTWVzc2FnZXMuZ2V0TWVzc2FnZSgncmVhY3Rpb25zX3dpZGdldF9fdGl0bGVfdGhpbmsnKSk7XG4gICAgICAgIHZhciBwYWdlID0gRGVmYXVsdHNQYWdlLmNyZWF0ZShvcHRpb25zKTtcbiAgICAgICAgcGFnZXMucHVzaChwYWdlKTtcbiAgICAgICAgc2hvd1BhZ2UocGFnZS5zZWxlY3RvciwgJHJvb3RFbGVtZW50LCBhbmltYXRlKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzaG93Q29uZmlybWF0aW9uKHJlYWN0aW9uRGF0YSwgcmVhY3Rpb25Qcm92aWRlcikge1xuICAgICAgICBzZXRXaW5kb3dUaXRsZShNZXNzYWdlcy5nZXRNZXNzYWdlKCdyZWFjdGlvbnNfd2lkZ2V0X190aXRsZV90aGFua3MnKSk7XG4gICAgICAgIHZhciBwYWdlID0gQ29uZmlybWF0aW9uUGFnZS5jcmVhdGUocmVhY3Rpb25EYXRhLnRleHQsIHJlYWN0aW9uUHJvdmlkZXIsIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzLCBwYWdlQ29udGFpbmVyKHJhY3RpdmUpKTtcbiAgICAgICAgcGFnZXMucHVzaChwYWdlKTtcbiAgICAgICAgLy8gVE9ETzogcmV2aXNpdCB3aHkgd2UgbmVlZCB0byB1c2UgdGhlIHRpbWVvdXQgdHJpY2sgZm9yIHRoZSBjb25maXJtIHBhZ2UsIGJ1dCBub3QgZm9yIHRoZSBkZWZhdWx0cyBwYWdlXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IC8vIEluIG9yZGVyIGZvciB0aGUgcG9zaXRpb25pbmcgYW5pbWF0aW9uIHRvIHdvcmssIHdlIG5lZWQgdG8gbGV0IHRoZSBicm93c2VyIHJlbmRlciB0aGUgYXBwZW5kZWQgRE9NIGVsZW1lbnRcbiAgICAgICAgICAgIHNob3dQYWdlKHBhZ2Uuc2VsZWN0b3IsICRyb290RWxlbWVudCwgdHJ1ZSk7XG4gICAgICAgIH0sIDEpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNob3dQZW5kaW5nQXBwcm92YWwocmVhY3Rpb24pIHtcbiAgICAgICAgc2V0V2luZG93VGl0bGUoTWVzc2FnZXMuZ2V0TWVzc2FnZSgncmVhY3Rpb25zX3dpZGdldF9fdGl0bGVfdGhhbmtzJykpO1xuICAgICAgICB2YXIgcGFnZSA9IFBlbmRpbmdSZWFjdGlvblBhZ2UuY3JlYXRlUGFnZShyZWFjdGlvbi50ZXh0LCBwYWdlQ29udGFpbmVyKHJhY3RpdmUpKTtcbiAgICAgICAgcGFnZXMucHVzaChwYWdlKTtcbiAgICAgICAgLy8gVE9ETzogcmV2aXNpdCB3aHkgd2UgbmVlZCB0byB1c2UgdGhlIHRpbWVvdXQgdHJpY2sgZm9yIHRoZSBjb25maXJtIHBhZ2UsIGJ1dCBub3QgZm9yIHRoZSBkZWZhdWx0cyBwYWdlXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IC8vIEluIG9yZGVyIGZvciB0aGUgcG9zaXRpb25pbmcgYW5pbWF0aW9uIHRvIHdvcmssIHdlIG5lZWQgdG8gbGV0IHRoZSBicm93c2VyIHJlbmRlciB0aGUgYXBwZW5kZWQgRE9NIGVsZW1lbnRcbiAgICAgICAgICAgIHNob3dQYWdlKHBhZ2Uuc2VsZWN0b3IsICRyb290RWxlbWVudCwgdHJ1ZSk7XG4gICAgICAgIH0sIDEpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNob3dQcm9ncmVzc1BhZ2UoKSB7XG4gICAgICAgIHNob3dQYWdlKCcuYW50ZW5uYS1wcm9ncmVzcy1wYWdlJywgJHJvb3RFbGVtZW50LCBmYWxzZSwgdHJ1ZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2hvd0NvbW1lbnRzKHJlYWN0aW9uLCBiYWNrUGFnZVNlbGVjdG9yKSB7XG4gICAgICAgIHNob3dQcm9ncmVzc1BhZ2UoKTsgLy8gVE9ETzogcHJvdmlkZSBzb21lIHdheSBmb3IgdGhlIHVzZXIgdG8gZ2l2ZSB1cCAvIGNhbmNlbC4gQWxzbywgaGFuZGxlIGVycm9ycyBmZXRjaGluZyBjb21tZW50cy5cbiAgICAgICAgdmFyIHN1Y2Nlc3MgPSBmdW5jdGlvbihjb21tZW50cykge1xuICAgICAgICAgICAgdmFyIG9wdGlvbnMgPSB7XG4gICAgICAgICAgICAgICAgcmVhY3Rpb246IHJlYWN0aW9uLFxuICAgICAgICAgICAgICAgIGNvbW1lbnRzOiBjb21tZW50cyxcbiAgICAgICAgICAgICAgICBlbGVtZW50OiBwYWdlQ29udGFpbmVyKHJhY3RpdmUpLFxuICAgICAgICAgICAgICAgIGdvQmFjazogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHNldFdpbmRvd1RpdGxlKE1lc3NhZ2VzLmdldE1lc3NhZ2UoJ3JlYWN0aW9uc193aWRnZXRfX3RpdGxlJykpO1xuICAgICAgICAgICAgICAgICAgICBnb0JhY2tUb1BhZ2UocGFnZXMsIGJhY2tQYWdlU2VsZWN0b3IsICRyb290RWxlbWVudCk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBjb250YWluZXJEYXRhOiBjb250YWluZXJEYXRhLFxuICAgICAgICAgICAgICAgIHBhZ2VEYXRhOiBwYWdlRGF0YSxcbiAgICAgICAgICAgICAgICBncm91cFNldHRpbmdzOiBncm91cFNldHRpbmdzXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdmFyIHBhZ2UgPSBDb21tZW50c1BhZ2UuY3JlYXRlKG9wdGlvbnMpO1xuICAgICAgICAgICAgcGFnZXMucHVzaChwYWdlKTtcblxuICAgICAgICAgICAgLy8gVE9ETzogcmV2aXNpdFxuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHsgLy8gSW4gb3JkZXIgZm9yIHRoZSBwb3NpdGlvbmluZyBhbmltYXRpb24gdG8gd29yaywgd2UgbmVlZCB0byBsZXQgdGhlIGJyb3dzZXIgcmVuZGVyIHRoZSBhcHBlbmRlZCBET00gZWxlbWVudFxuICAgICAgICAgICAgICAgIHNob3dQYWdlKHBhZ2Uuc2VsZWN0b3IsICRyb290RWxlbWVudCwgdHJ1ZSk7XG4gICAgICAgICAgICB9LCAxKTtcblxuICAgICAgICAgICAgRXZlbnRzLnBvc3RDb21tZW50c1ZpZXdlZChwYWdlRGF0YSwgY29udGFpbmVyRGF0YSwgcmVhY3Rpb24sIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgZXJyb3IgPSBmdW5jdGlvbihtZXNzYWdlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnQW4gZXJyb3Igb2NjdXJyZWQgZmV0Y2hpbmcgY29tbWVudHM6ICcgKyBtZXNzYWdlKTtcbiAgICAgICAgICAgIHNob3dHZW5lcmljRXJyb3JQYWdlKGJhY2tQYWdlU2VsZWN0b3IpO1xuICAgICAgICB9O1xuICAgICAgICBBamF4Q2xpZW50LmdldENvbW1lbnRzKHJlYWN0aW9uLCBncm91cFNldHRpbmdzLCBzdWNjZXNzLCBlcnJvcik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2hvd0xvY2F0aW9ucyhyZWFjdGlvbiwgYmFja1BhZ2VTZWxlY3Rvcikge1xuICAgICAgICBzaG93UHJvZ3Jlc3NQYWdlKCk7IC8vIFRPRE86IHByb3ZpZGUgc29tZSB3YXkgZm9yIHRoZSB1c2VyIHRvIGdpdmUgdXAgLyBjYW5jZWwuIEFsc28sIGhhbmRsZSBlcnJvcnMgZmV0Y2hpbmcgY29tbWVudHMuXG4gICAgICAgIHZhciByZWFjdGlvbkxvY2F0aW9uRGF0YSA9IFBhZ2VEYXRhLmdldFJlYWN0aW9uTG9jYXRpb25EYXRhKHJlYWN0aW9uLCBwYWdlRGF0YSk7XG4gICAgICAgIHZhciBzdWNjZXNzID0gZnVuY3Rpb24obG9jYXRpb25EZXRhaWxzKSB7XG4gICAgICAgICAgICBQYWdlRGF0YS51cGRhdGVSZWFjdGlvbkxvY2F0aW9uRGF0YShyZWFjdGlvbkxvY2F0aW9uRGF0YSwgbG9jYXRpb25EZXRhaWxzKTtcbiAgICAgICAgICAgIHZhciBvcHRpb25zID0geyAvLyBUT0RPOiBjbGVhbiB1cCB0aGUgbnVtYmVyIG9mIHRoZXNlIFwib3B0aW9uc1wiIG9iamVjdHMgdGhhdCB3ZSBjcmVhdGUuXG4gICAgICAgICAgICAgICAgZWxlbWVudDogcGFnZUNvbnRhaW5lcihyYWN0aXZlKSxcbiAgICAgICAgICAgICAgICByZWFjdGlvbkxvY2F0aW9uRGF0YTogcmVhY3Rpb25Mb2NhdGlvbkRhdGEsXG4gICAgICAgICAgICAgICAgcGFnZURhdGE6IHBhZ2VEYXRhLFxuICAgICAgICAgICAgICAgIGdyb3VwU2V0dGluZ3M6IGdyb3VwU2V0dGluZ3MsXG4gICAgICAgICAgICAgICAgY2xvc2VXaW5kb3c6IGNsb3NlQWxsV2luZG93cyxcbiAgICAgICAgICAgICAgICBnb0JhY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBzZXRXaW5kb3dUaXRsZShNZXNzYWdlcy5nZXRNZXNzYWdlKCdyZWFjdGlvbnNfd2lkZ2V0X190aXRsZScpKTtcbiAgICAgICAgICAgICAgICAgICAgZ29CYWNrVG9QYWdlKHBhZ2VzLCBiYWNrUGFnZVNlbGVjdG9yLCAkcm9vdEVsZW1lbnQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB2YXIgcGFnZSA9IExvY2F0aW9uc1BhZ2UuY3JlYXRlKG9wdGlvbnMpO1xuICAgICAgICAgICAgcGFnZXMucHVzaChwYWdlKTtcbiAgICAgICAgICAgIHNldFdpbmRvd1RpdGxlKHJlYWN0aW9uLnRleHQpO1xuICAgICAgICAgICAgLy8gVE9ETzogcmV2aXNpdFxuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHsgLy8gSW4gb3JkZXIgZm9yIHRoZSBwb3NpdGlvbmluZyBhbmltYXRpb24gdG8gd29yaywgd2UgbmVlZCB0byBsZXQgdGhlIGJyb3dzZXIgcmVuZGVyIHRoZSBhcHBlbmRlZCBET00gZWxlbWVudFxuICAgICAgICAgICAgICAgIHNob3dQYWdlKHBhZ2Uuc2VsZWN0b3IsICRyb290RWxlbWVudCwgdHJ1ZSk7XG4gICAgICAgICAgICB9LCAxKTtcbiAgICAgICAgICAgIEV2ZW50cy5wb3N0TG9jYXRpb25zVmlld2VkKHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIGVycm9yID0gZnVuY3Rpb24obWVzc2FnZSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ0FuIGVycm9yIG9jY3VycmVkIGZldGNoaW5nIGNvbnRlbnQgYm9kaWVzOiAnICsgbWVzc2FnZSk7XG4gICAgICAgICAgICBzaG93R2VuZXJpY0Vycm9yUGFnZShiYWNrUGFnZVNlbGVjdG9yKTtcbiAgICAgICAgfTtcbiAgICAgICAgQWpheENsaWVudC5mZXRjaExvY2F0aW9uRGV0YWlscyhyZWFjdGlvbkxvY2F0aW9uRGF0YSwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MsIHN1Y2Nlc3MsIGVycm9yKTtcbiAgICB9XG5cbiAgICAvLyBTaG93cyB0aGUgbG9naW4gcGFnZSwgd2l0aCBhIHByb21wdCB0byBnbyBCYWNrIHRvIHRoZSBwYWdlIHNwZWNpZmllZCBieSB0aGUgZ2l2ZW4gcGFnZSBzZWxlY3Rvci5cbiAgICBmdW5jdGlvbiBzaG93TG9naW5QYWdlKGJhY2tQYWdlU2VsZWN0b3IsIHJldHJ5Q2FsbGJhY2spIHtcbiAgICAgICAgc2V0V2luZG93VGl0bGUoTWVzc2FnZXMuZ2V0TWVzc2FnZSgncmVhY3Rpb25zX3dpZGdldF9fdGl0bGVfc2lnbmluJykpO1xuICAgICAgICB2YXIgb3B0aW9ucyA9IHtcbiAgICAgICAgICAgIGVsZW1lbnQ6IHBhZ2VDb250YWluZXIocmFjdGl2ZSksXG4gICAgICAgICAgICBncm91cFNldHRpbmdzOiBncm91cFNldHRpbmdzLFxuICAgICAgICAgICAgZ29CYWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBzZXRXaW5kb3dUaXRsZShNZXNzYWdlcy5nZXRNZXNzYWdlKCdyZWFjdGlvbnNfd2lkZ2V0X190aXRsZScpKTtcbiAgICAgICAgICAgICAgICBnb0JhY2tUb1BhZ2UocGFnZXMsIGJhY2tQYWdlU2VsZWN0b3IsICRyb290RWxlbWVudCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmV0cnk6IHJldHJ5Q2FsbGJhY2tcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIHBhZ2UgPSBMb2dpblBhZ2UuY3JlYXRlUGFnZShvcHRpb25zKTtcbiAgICAgICAgcGFnZXMucHVzaChwYWdlKTtcblxuICAgICAgICAvLyBUT0RPOiByZXZpc2l0IHdoeSB3ZSBuZWVkIHRvIHVzZSB0aGUgdGltZW91dCB0cmljayBmb3IgdGhlIGNvbmZpcm0gcGFnZSwgYnV0IG5vdCBmb3IgdGhlIGRlZmF1bHRzIHBhZ2VcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHsgLy8gSW4gb3JkZXIgZm9yIHRoZSBwb3NpdGlvbmluZyBhbmltYXRpb24gdG8gd29yaywgd2UgbmVlZCB0byBsZXQgdGhlIGJyb3dzZXIgcmVuZGVyIHRoZSBhcHBlbmRlZCBET00gZWxlbWVudFxuICAgICAgICAgICAgc2hvd1BhZ2UocGFnZS5zZWxlY3RvciwgJHJvb3RFbGVtZW50LCB0cnVlKTtcbiAgICAgICAgfSwgMSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2hvd0Jsb2NrZWRSZWFjdGlvblBhZ2UoYmFja1BhZ2VTZWxlY3Rvcikge1xuICAgICAgICBzZXRXaW5kb3dUaXRsZShNZXNzYWdlcy5nZXRNZXNzYWdlKCdyZWFjdGlvbnNfd2lkZ2V0X190aXRsZV9ibG9ja2VkJykpO1xuICAgICAgICB2YXIgb3B0aW9ucyA9IHtcbiAgICAgICAgICAgIGVsZW1lbnQ6IHBhZ2VDb250YWluZXIocmFjdGl2ZSksXG4gICAgICAgICAgICBncm91cFNldHRpbmdzOiBncm91cFNldHRpbmdzLFxuICAgICAgICAgICAgZ29CYWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBzZXRXaW5kb3dUaXRsZShNZXNzYWdlcy5nZXRNZXNzYWdlKCdyZWFjdGlvbnNfd2lkZ2V0X190aXRsZScpKTtcbiAgICAgICAgICAgICAgICBnb0JhY2tUb1BhZ2UocGFnZXMsIGJhY2tQYWdlU2VsZWN0b3IsICRyb290RWxlbWVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHZhciBwYWdlID0gQmxvY2tlZFJlYWN0aW9uUGFnZS5jcmVhdGVQYWdlKG9wdGlvbnMpO1xuICAgICAgICBwYWdlcy5wdXNoKHBhZ2UpO1xuXG4gICAgICAgIC8vIFRPRE86IHJldmlzaXQgd2h5IHdlIG5lZWQgdG8gdXNlIHRoZSB0aW1lb3V0IHRyaWNrIGZvciB0aGUgY29uZmlybSBwYWdlLCBidXQgbm90IGZvciB0aGUgZGVmYXVsdHMgcGFnZVxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyAvLyBJbiBvcmRlciBmb3IgdGhlIHBvc2l0aW9uaW5nIGFuaW1hdGlvbiB0byB3b3JrLCB3ZSBuZWVkIHRvIGxldCB0aGUgYnJvd3NlciByZW5kZXIgdGhlIGFwcGVuZGVkIERPTSBlbGVtZW50XG4gICAgICAgICAgICBzaG93UGFnZShwYWdlLnNlbGVjdG9yLCAkcm9vdEVsZW1lbnQsIHRydWUpO1xuICAgICAgICB9LCAxKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzaG93R2VuZXJpY0Vycm9yUGFnZShiYWNrUGFnZVNlbGVjdG9yKSB7XG4gICAgICAgIHNldFdpbmRvd1RpdGxlKE1lc3NhZ2VzLmdldE1lc3NhZ2UoJ3JlYWN0aW9uc193aWRnZXRfX3RpdGxlX2Vycm9yJykpO1xuICAgICAgICB2YXIgb3B0aW9ucyA9IHtcbiAgICAgICAgICAgIGVsZW1lbnQ6IHBhZ2VDb250YWluZXIocmFjdGl2ZSksXG4gICAgICAgICAgICBnb0JhY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHNldFdpbmRvd1RpdGxlKE1lc3NhZ2VzLmdldE1lc3NhZ2UoJ3JlYWN0aW9uc193aWRnZXRfX3RpdGxlJykpO1xuICAgICAgICAgICAgICAgIGdvQmFja1RvUGFnZShwYWdlcywgYmFja1BhZ2VTZWxlY3RvciwgJHJvb3RFbGVtZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgdmFyIHBhZ2UgPSBHZW5lcmljRXJyb3JQYWdlLmNyZWF0ZVBhZ2Uob3B0aW9ucyk7XG4gICAgICAgIHBhZ2VzLnB1c2gocGFnZSk7XG5cbiAgICAgICAgLy8gVE9ETzogcmV2aXNpdCB3aHkgd2UgbmVlZCB0byB1c2UgdGhlIHRpbWVvdXQgdHJpY2sgZm9yIHRoZSBjb25maXJtIHBhZ2UsIGJ1dCBub3QgZm9yIHRoZSBkZWZhdWx0cyBwYWdlXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IC8vIEluIG9yZGVyIGZvciB0aGUgcG9zaXRpb25pbmcgYW5pbWF0aW9uIHRvIHdvcmssIHdlIG5lZWQgdG8gbGV0IHRoZSBicm93c2VyIHJlbmRlciB0aGUgYXBwZW5kZWQgRE9NIGVsZW1lbnRcbiAgICAgICAgICAgIHNob3dQYWdlKHBhZ2Uuc2VsZWN0b3IsICRyb290RWxlbWVudCwgdHJ1ZSk7XG4gICAgICAgIH0sIDEpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGhhbmRsZVJlYWN0aW9uRXJyb3IobWVzc2FnZSwgcmV0cnlDYWxsYmFjaywgYmFja1BhZ2VTZWxlY3Rvcikge1xuICAgICAgICBpZiAobWVzc2FnZS5pbmRleE9mKCdzaWduIGluIHJlcXVpcmVkIGZvciBvcmdhbmljIHJlYWN0aW9ucycpICE9PSAtMSkge1xuICAgICAgICAgICAgc2hvd0xvZ2luUGFnZShiYWNrUGFnZVNlbGVjdG9yLCByZXRyeUNhbGxiYWNrKTtcbiAgICAgICAgfSBlbHNlIGlmIChtZXNzYWdlLmluZGV4T2YoJ0dyb3VwIGhhcyBibG9ja2VkIHRoaXMgdGFnLicpICE9PSAtMSkge1xuICAgICAgICAgICAgc2hvd0Jsb2NrZWRSZWFjdGlvblBhZ2UoYmFja1BhZ2VTZWxlY3Rvcik7XG4gICAgICAgIH0gZWxzZSBpZiAoaXNUb2tlbkVycm9yKG1lc3NhZ2UpKSB7XG4gICAgICAgICAgICBVc2VyLnJlQXV0aG9yaXplVXNlcihmdW5jdGlvbihoYXNOZXdUb2tlbikge1xuICAgICAgICAgICAgICAgIGlmIChoYXNOZXdUb2tlbikge1xuICAgICAgICAgICAgICAgICAgICByZXRyeUNhbGxiYWNrKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgc2hvd0xvZ2luUGFnZShiYWNrUGFnZVNlbGVjdG9yLCByZXRyeUNhbGxiYWNrKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiZXJyb3IgcG9zdGluZyByZWFjdGlvbjogXCIgKyBtZXNzYWdlKTtcbiAgICAgICAgICAgIHNob3dHZW5lcmljRXJyb3JQYWdlKGJhY2tQYWdlU2VsZWN0b3IpO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gaXNUb2tlbkVycm9yKG1lc3NhZ2UpIHtcbiAgICAgICAgICAgIHN3aXRjaChtZXNzYWdlKSB7XG4gICAgICAgICAgICAgICAgY2FzZSBcIlRva2VuIHdhcyBpbnZhbGlkXCI6XG4gICAgICAgICAgICAgICAgY2FzZSBcIkZhY2Vib29rIHRva2VuIGV4cGlyZWRcIjpcbiAgICAgICAgICAgICAgICBjYXNlIFwiRkIgZ3JhcGggZXJyb3IgLSB0b2tlbiBpbnZhbGlkXCI6XG4gICAgICAgICAgICAgICAgY2FzZSBcIlNvY2lhbCBBdXRoIGRvZXMgbm90IGV4aXN0IGZvciB1c2VyXCI6XG4gICAgICAgICAgICAgICAgY2FzZSBcIkRhdGEgdG8gY3JlYXRlIHRva2VuIGlzIG1pc3NpbmdcIjpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzZXRXaW5kb3dUaXRsZSh0aXRsZSkge1xuICAgICAgICAkKHJhY3RpdmUuZmluZCgnLmFudGVubmEtcmVhY3Rpb25zLXRpdGxlJykpLmh0bWwodGl0bGUpO1xuICAgIH1cblxufVxuXG5mdW5jdGlvbiByb290RWxlbWVudChyYWN0aXZlKSB7XG4gICAgcmV0dXJuIHJhY3RpdmUuZmluZChTRUxFQ1RPUl9SRUFDVElPTlNfV0lER0VUKTtcbn1cblxuZnVuY3Rpb24gcGFnZUNvbnRhaW5lcihyYWN0aXZlKSB7XG4gICAgcmV0dXJuIHJhY3RpdmUuZmluZCgnLmFudGVubmEtcGFnZS1jb250YWluZXInKTtcbn1cblxudmFyIHBhZ2VaID0gMTAwMDsgLy8gSXQncyBzYWZlIGZvciB0aGlzIHZhbHVlIHRvIGdvIGFjcm9zcyBpbnN0YW5jZXMuIFdlIGp1c3QgbmVlZCBpdCB0byBjb250aW51b3VzbHkgaW5jcmVhc2UgKG1heCB2YWx1ZSBpcyBvdmVyIDIgYmlsbGlvbikuXG5cbmZ1bmN0aW9uIHNob3dQYWdlKHBhZ2VTZWxlY3RvciwgJHJvb3RFbGVtZW50LCBhbmltYXRlLCBvdmVybGF5KSB7XG4gICAgdmFyICRwYWdlID0gJHJvb3RFbGVtZW50LmZpbmQocGFnZVNlbGVjdG9yKTtcbiAgICAkcGFnZS5jc3MoJ3otaW5kZXgnLCBwYWdlWik7XG4gICAgcGFnZVogKz0gMTtcblxuICAgICRwYWdlLnRvZ2dsZUNsYXNzKCdhbnRlbm5hLXBhZ2UtYW5pbWF0ZScsIGFuaW1hdGUpO1xuXG4gICAgdmFyICRjdXJyZW50ID0gJHJvb3RFbGVtZW50LmZpbmQoJy5hbnRlbm5hLXBhZ2UtYWN0aXZlJykubm90KHBhZ2VTZWxlY3Rvcik7XG4gICAgaWYgKG92ZXJsYXkpIHtcbiAgICAgICAgLy8gSW4gdGhlIG92ZXJsYXkgY2FzZSwgc2l6ZSB0aGUgcGFnZSB0byBtYXRjaCB3aGF0ZXZlciBwYWdlIGlzIGN1cnJlbnRseSBzaG93aW5nIGFuZCB0aGVuIG1ha2UgaXQgYWN0aXZlICh0aGVyZSB3aWxsIGJlIHR3byAnYWN0aXZlJyBwYWdlcylcbiAgICAgICAgJHBhZ2UuaGVpZ2h0KCRjdXJyZW50LmhlaWdodCgpKTtcbiAgICAgICAgJHBhZ2UuYWRkQ2xhc3MoJ2FudGVubmEtcGFnZS1hY3RpdmUnKTtcbiAgICB9IGVsc2UgaWYgKGFuaW1hdGUpIHtcbiAgICAgICAgVHJhbnNpdGlvblV0aWwudG9nZ2xlQ2xhc3MoJHBhZ2UsICdhbnRlbm5hLXBhZ2UtYWN0aXZlJywgdHJ1ZSwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAvLyBBZnRlciB0aGUgbmV3IHBhZ2Ugc2xpZGVzIGludG8gcG9zaXRpb24sIG1vdmUgdGhlIG90aGVyIHBhZ2VzIGJhY2sgb3V0IG9mIHRoZSB2aWV3YWJsZSBhcmVhXG4gICAgICAgICAgICAkY3VycmVudC5yZW1vdmVDbGFzcygnYW50ZW5uYS1wYWdlLWFjdGl2ZScpO1xuICAgICAgICAgICAgJHBhZ2UuZm9jdXMoKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHNpemVCb2R5VG9GaXQoJHJvb3RFbGVtZW50LCAkcGFnZSwgYW5pbWF0ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgJHBhZ2UuYWRkQ2xhc3MoJ2FudGVubmEtcGFnZS1hY3RpdmUnKTtcbiAgICAgICAgJGN1cnJlbnQucmVtb3ZlQ2xhc3MoJ2FudGVubmEtcGFnZS1hY3RpdmUnKTtcbiAgICAgICAgJHBhZ2UuZm9jdXMoKTtcbiAgICAgICAgc2l6ZUJvZHlUb0ZpdCgkcm9vdEVsZW1lbnQsICRwYWdlLCBhbmltYXRlKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGdvQmFja1RvUGFnZShwYWdlcywgcGFnZVNlbGVjdG9yLCAkcm9vdEVsZW1lbnQpIHtcbiAgICB2YXIgJHRhcmdldFBhZ2UgPSAkcm9vdEVsZW1lbnQuZmluZChwYWdlU2VsZWN0b3IpO1xuICAgIHZhciAkY3VycmVudFBhZ2UgPSAkcm9vdEVsZW1lbnQuZmluZCgnLmFudGVubmEtcGFnZS1hY3RpdmUnKTtcbiAgICAvLyBNb3ZlIHRoZSB0YXJnZXQgcGFnZSBpbnRvIHBsYWNlLCB1bmRlciB0aGUgY3VycmVudCBwYWdlXG4gICAgJHRhcmdldFBhZ2UuY3NzKCd6LWluZGV4JywgcGFyc2VJbnQoJGN1cnJlbnRQYWdlLmNzcygnei1pbmRleCcpKSAtIDEpO1xuICAgICR0YXJnZXRQYWdlLnRvZ2dsZUNsYXNzKCdhbnRlbm5hLXBhZ2UtYW5pbWF0ZScsIGZhbHNlKTtcbiAgICAkdGFyZ2V0UGFnZS50b2dnbGVDbGFzcygnYW50ZW5uYS1wYWdlLWFjdGl2ZScsIHRydWUpO1xuXG4gICAgLy8gVGhlbiBhbmltYXRlIHRoZSBjdXJyZW50IHBhZ2UgbW92aW5nIGF3YXkgdG8gcmV2ZWFsIHRoZSB0YXJnZXQuXG4gICAgJGN1cnJlbnRQYWdlLnRvZ2dsZUNsYXNzKCdhbnRlbm5hLXBhZ2UtYW5pbWF0ZScsIHRydWUpO1xuICAgIFRyYW5zaXRpb25VdGlsLnRvZ2dsZUNsYXNzKCRjdXJyZW50UGFnZSwgJ2FudGVubmEtcGFnZS1hY3RpdmUnLCBmYWxzZSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAvLyBBZnRlciB0aGUgY3VycmVudCBwYWdlIHNsaWRlcyBpbnRvIHBvc2l0aW9uLCBtb3ZlIGFsbCBvdGhlciBwYWdlcyBiYWNrIG91dCBvZiB0aGUgdmlld2FibGUgYXJlYVxuICAgICAgICAkcm9vdEVsZW1lbnQuZmluZCgnLmFudGVubmEtcGFnZScpLm5vdChwYWdlU2VsZWN0b3IpLnJlbW92ZUNsYXNzKCdhbnRlbm5hLXBhZ2UtYWN0aXZlJyk7XG4gICAgICAgICR0YXJnZXRQYWdlLmNzcygnei1pbmRleCcsIHBhZ2VaKyspOyAvLyBXaGVuIHRoZSBhbmltYXRpb24gaXMgZG9uZSwgbWFrZSBzdXJlIHRoZSBjdXJyZW50IHBhZ2UgaGFzIHRoZSBoaWdoZXN0IHotaW5kZXggKGp1c3QgZm9yIGNvbnNpc3RlbmN5KVxuICAgICAgICAvLyBUZWFyZG93biBhbGwgb3RoZXIgcGFnZXMuIFRoZXknbGwgYmUgcmUtY3JlYXRlZCBpZiBuZWNlc3NhcnkuXG4gICAgICAgIHZhciByZW1haW5pbmdQYWdlcyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBhZ2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgcGFnZSA9IHBhZ2VzW2ldO1xuICAgICAgICAgICAgaWYgKHBhZ2Uuc2VsZWN0b3IgPT09IHBhZ2VTZWxlY3Rvcikge1xuICAgICAgICAgICAgICAgIHJlbWFpbmluZ1BhZ2VzLnB1c2gocGFnZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHBhZ2UudGVhcmRvd24oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBwYWdlcyA9IHJlbWFpbmluZ1BhZ2VzO1xuICAgIH0pO1xuICAgIHNpemVCb2R5VG9GaXQoJHJvb3RFbGVtZW50LCAkdGFyZ2V0UGFnZSwgdHJ1ZSk7XG59XG5cbmZ1bmN0aW9uIHNpemVCb2R5VG9GaXQoJHJvb3RFbGVtZW50LCAkcGFnZSwgYW5pbWF0ZSkge1xuICAgIHZhciAkcGFnZUNvbnRhaW5lciA9ICRyb290RWxlbWVudC5maW5kKCcuYW50ZW5uYS1wYWdlLWNvbnRhaW5lcicpO1xuICAgIHZhciAkYm9keSA9ICRwYWdlLmZpbmQoJy5hbnRlbm5hLWJvZHknKTtcbiAgICB2YXIgY3VycmVudEhlaWdodCA9ICRwYWdlQ29udGFpbmVyLmNzcygnaGVpZ2h0Jyk7XG4gICAgJHBhZ2VDb250YWluZXIuY3NzKHsgaGVpZ2h0OiAnJyB9KTsgLy8gQ2xlYXIgYW55IHByZXZpb3VzbHkgY29tcHV0ZWQgaGVpZ2h0IHNvIHdlIGdldCBhIGZyZXNoIGNvbXB1dGF0aW9uIG9mIHRoZSBjaGlsZCBoZWlnaHRzXG4gICAgdmFyIG5ld0JvZHlIZWlnaHQgPSBNYXRoLm1pbigzMDAsICRib2R5LmdldCgwKS5zY3JvbGxIZWlnaHQpO1xuICAgICRib2R5LmNzcyh7IGhlaWdodDogbmV3Qm9keUhlaWdodCB9KTsgLy8gVE9ETzogZG91YmxlLWNoZWNrIHRoYXQgd2UgY2FuJ3QganVzdCBzZXQgYSBtYXgtaGVpZ2h0IG9mIDMwMHB4IG9uIHRoZSBib2R5LlxuICAgIHZhciBmb290ZXJIZWlnaHQgPSAkcGFnZS5maW5kKCcuYW50ZW5uYS1mb290ZXInKS5vdXRlckhlaWdodCgpOyAvLyByZXR1cm5zICdudWxsJyBpZiB0aGVyZSdzIG5vIGZvb3Rlci4gYWRkZWQgdG8gYW4gaW50ZWdlciwgJ251bGwnIGFjdHMgbGlrZSAwXG4gICAgdmFyIG5ld1BhZ2VIZWlnaHQgPSBuZXdCb2R5SGVpZ2h0ICsgZm9vdGVySGVpZ2h0O1xuICAgIGlmIChhbmltYXRlKSB7XG4gICAgICAgICRwYWdlQ29udGFpbmVyLmNzcyh7IGhlaWdodDogY3VycmVudEhlaWdodCB9KTtcbiAgICAgICAgJHBhZ2VDb250YWluZXIuYW5pbWF0ZSh7IGhlaWdodDogbmV3UGFnZUhlaWdodCB9LCAyMDApO1xuICAgIH0gZWxzZSB7XG4gICAgICAgICRwYWdlQ29udGFpbmVyLmNzcyh7IGhlaWdodDogbmV3UGFnZUhlaWdodCB9KTtcbiAgICB9XG4gICAgLy8gVE9ETzogd2UgbWlnaHQgbm90IG5lZWQgd2lkdGggcmVzaXppbmcgYXQgYWxsLlxuICAgIHZhciBtaW5XaWR0aCA9ICRwYWdlLmNzcygnbWluLXdpZHRoJyk7XG4gICAgdmFyIHdpZHRoID0gcGFyc2VJbnQobWluV2lkdGgpO1xuICAgIGlmICh3aWR0aCA+IDApIHtcbiAgICAgICAgaWYgKGFuaW1hdGUpIHtcbiAgICAgICAgICAgICRyb290RWxlbWVudC5hbmltYXRlKHsgd2lkdGg6IHdpZHRoIH0sIDIwMCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkcm9vdEVsZW1lbnQuY3NzKHsgd2lkdGg6IHdpZHRoIH0pO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBzZXR1cFdpbmRvd0Nsb3NlKHBhZ2VzLCByYWN0aXZlKSB7XG4gICAgdmFyICRyb290RWxlbWVudCA9ICQocm9vdEVsZW1lbnQocmFjdGl2ZSkpO1xuXG4gICAgLy8gVE9ETzogSWYgeW91IG1vdXNlIG92ZXIgdGhlIHRyaWdnZXIgc2xvd2x5IGZyb20gdGhlIHRvcCBsZWZ0LCB0aGUgd2luZG93IG9wZW5zIHdpdGhvdXQgYmVpbmcgdW5kZXIgdGhlIGN1cnNvcixcbiAgICAvLyAgICAgICBzbyBubyBtb3VzZW91dCBldmVudCBpcyByZWNlaXZlZC4gV2hlbiB3ZSBvcGVuIHRoZSB3aW5kb3csIHdlIHNob3VsZCBwcm9iYWJseSBqdXN0IHNjb290IGl0IHVwIHNsaWdodGx5XG4gICAgLy8gICAgICAgaWYgbmVlZGVkIHRvIGFzc3VyZSB0aGF0IGl0J3MgdW5kZXIgdGhlIGN1cnNvci4gQWx0ZXJuYXRpdmVseSwgd2UgY291bGQgYWRqdXN0IHRoZSBtb3VzZW92ZXIgYXJlYSB0byBtYXRjaFxuICAgIC8vICAgICAgIHRoZSByZWdpb24gdGhhdCB0aGUgd2luZG93IG9wZW5zLlxuICAgICRyb290RWxlbWVudFxuICAgICAgICAub24oJ21vdXNlb3V0LmFudGVubmEnLCBkZWxheWVkQ2xvc2VXaW5kb3cpXG4gICAgICAgIC5vbignbW91c2VvdmVyLmFudGVubmEnLCBrZWVwV2luZG93T3BlbilcbiAgICAgICAgLm9uKCdmb2N1c2luLmFudGVubmEnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIE9uY2UgdGhlIHdpbmRvdyBoYXMgZm9jdXMsIGRvbid0IGNsb3NlIGl0IG9uIG1vdXNlb3V0LlxuICAgICAgICAgICAga2VlcFdpbmRvd09wZW4oKTtcbiAgICAgICAgICAgICRyb290RWxlbWVudC5vZmYoJ21vdXNlb3V0LmFudGVubmEnKTtcbiAgICAgICAgICAgICRyb290RWxlbWVudC5vZmYoJ21vdXNlb3Zlci5hbnRlbm5hJyk7XG4gICAgICAgIH0pO1xuICAgICQoZG9jdW1lbnQpLm9uKCdjbGljay5hbnRlbm5hJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgaWYgKCQoZXZlbnQudGFyZ2V0KS5jbG9zZXN0KFNFTEVDVE9SX1JFQUNUSU9OU19XSURHRVQpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgY2xvc2VBbGxXaW5kb3dzKCk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICB2YXIgdGFwTGlzdGVuZXIgPSBUb3VjaFN1cHBvcnQuc2V0dXBUYXAoZG9jdW1lbnQsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGlmICgkKGV2ZW50LnRhcmdldCkuY2xvc2VzdChTRUxFQ1RPUl9SRUFDVElPTlNfV0lER0VUKS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIGNsb3NlQWxsV2luZG93cygpO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICB2YXIgY2xvc2VUaW1lcjtcblxuICAgIGZ1bmN0aW9uIGRlbGF5ZWRDbG9zZVdpbmRvdygpIHtcbiAgICAgICAgY2xvc2VUaW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBjbG9zZVRpbWVyID0gbnVsbDtcbiAgICAgICAgICAgIGNsb3NlQWxsV2luZG93cygpO1xuICAgICAgICB9LCA1MDApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGtlZXBXaW5kb3dPcGVuKCkge1xuICAgICAgICBjbGVhclRpbWVvdXQoY2xvc2VUaW1lcik7XG4gICAgfVxuXG4gICAgcmFjdGl2ZS5vbignaW50ZXJuYWxDbG9zZVdpbmRvdycsIGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBDbG9zZXMgb25lIHBhcnRpY3VsYXIgcmVhY3Rpb24gd2luZG93LiBUaGlzIGZ1bmN0aW9uIHNob3VsZCBvbmx5IGJlIGNhbGxlZCBmcm9tIGNsb3NlQWxsV2luZG93cywgd2hpY2ggYWxzb1xuICAgICAgICAvLyBjbGVhbnMgdXAgdGhlIGhhbmRsZXMgd2UgbWFpbnRhaW4gdG8gYWxsIHdpbmRvd3MuXG4gICAgICAgIGNsZWFyVGltZW91dChjbG9zZVRpbWVyKTtcblxuICAgICAgICAkcm9vdEVsZW1lbnQuc3RvcCh0cnVlLCB0cnVlKS5mYWRlT3V0KCdmYXN0JywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAkcm9vdEVsZW1lbnQuY3NzKCdkaXNwbGF5JywgJycpOyAvLyBDbGVhciB0aGUgZGlzcGxheTpub25lIHRoYXQgZmFkZU91dCBwdXRzIG9uIHRoZSBlbGVtZW50XG4gICAgICAgICAgICAkcm9vdEVsZW1lbnQucmVtb3ZlQ2xhc3MoJ2FudGVubmEtcmVhY3Rpb25zLW9wZW4nKTtcblxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYWdlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHBhZ2VzW2ldLnRlYXJkb3duKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByYWN0aXZlLnRlYXJkb3duKCk7XG4gICAgICAgIH0pO1xuICAgICAgICBSYW5nZS5jbGVhckhpZ2hsaWdodHMoKTtcbiAgICAgICAgJHJvb3RFbGVtZW50Lm9mZignLmFudGVubmEnKTsgLy8gVW5iaW5kIGFsbCBvZiB0aGUgaGFuZGxlcnMgaW4gb3VyIG5hbWVzcGFjZVxuICAgICAgICAkKGRvY3VtZW50KS5vZmYoJ2NsaWNrLmFudGVubmEnKTtcbiAgICAgICAgdGFwTGlzdGVuZXIudGVhcmRvd24oKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gY2xvc2VBbGxXaW5kb3dzKCkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb3Blbkluc3RhbmNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBvcGVuSW5zdGFuY2VzW2ldLmZpcmUoJ2ludGVybmFsQ2xvc2VXaW5kb3cnKTtcbiAgICB9XG4gICAgb3Blbkluc3RhbmNlcyA9IFtdO1xufVxuXG5mdW5jdGlvbiBpc09wZW5XaW5kb3coKSB7XG4gICAgcmV0dXJuIG9wZW5JbnN0YW5jZXMubGVuZ3RoID4gMDtcbn1cblxuLy8gUHJldmVudCBzY3JvbGxpbmcgb2YgdGhlIGRvY3VtZW50IGFmdGVyIHdlIHNjcm9sbCB0byB0aGUgdG9wL2JvdHRvbSBvZiB0aGUgcmVhY3Rpb25zIHdpbmRvd1xuLy8gQ29kZSBjb3BpZWQgZnJvbTogaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy81ODAyNDY3L3ByZXZlbnQtc2Nyb2xsaW5nLW9mLXBhcmVudC1lbGVtZW50XG4vLyBUT0RPOiBkb2VzIHRoaXMgd29yayBvbiBtb2JpbGU/XG5mdW5jdGlvbiBwcmV2ZW50RXh0cmFTY3JvbGwoJHJvb3RFbGVtZW50KSB7XG4gICAgJHJvb3RFbGVtZW50Lm9uKCdET01Nb3VzZVNjcm9sbC5hbnRlbm5hIG1vdXNld2hlZWwuYW50ZW5uYScsICcuYW50ZW5uYS1ib2R5JywgZnVuY3Rpb24oZXYpIHtcbiAgICAgICAgdmFyICR0aGlzID0gJCh0aGlzKSxcbiAgICAgICAgICAgIHNjcm9sbFRvcCA9IHRoaXMuc2Nyb2xsVG9wLFxuICAgICAgICAgICAgc2Nyb2xsSGVpZ2h0ID0gdGhpcy5zY3JvbGxIZWlnaHQsXG4gICAgICAgICAgICBoZWlnaHQgPSAkdGhpcy5oZWlnaHQoKSxcbiAgICAgICAgICAgIGRlbHRhID0gKGV2LnR5cGUgPT0gJ0RPTU1vdXNlU2Nyb2xsJyA/XG4gICAgICAgICAgICAgICAgZXYub3JpZ2luYWxFdmVudC5kZXRhaWwgKiAtNDAgOlxuICAgICAgICAgICAgICAgIGV2Lm9yaWdpbmFsRXZlbnQud2hlZWxEZWx0YSksXG4gICAgICAgICAgICB1cCA9IGRlbHRhID4gMDtcblxuICAgICAgICBpZiAoc2Nyb2xsSGVpZ2h0IDw9IGhlaWdodCkge1xuICAgICAgICAgICAgLy8gVGhpcyBpcyBhbiBhZGRpdGlvbiB0byB0aGUgU3RhY2tPdmVyZmxvdyBjb2RlLCB0byBtYWtlIHN1cmUgdGhlIHBhZ2Ugc2Nyb2xscyBhcyB1c3VhbCBpZiB0aGUgd2luZG93XG4gICAgICAgICAgICAvLyBjb250ZW50IGRvZXNuJ3Qgc2Nyb2xsLlxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHByZXZlbnQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGV2LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgZXYucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIGV2LnJldHVyblZhbHVlID0gZmFsc2U7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKCF1cCAmJiAtZGVsdGEgPiBzY3JvbGxIZWlnaHQgLSBoZWlnaHQgLSBzY3JvbGxUb3ApIHtcbiAgICAgICAgICAgIC8vIFNjcm9sbGluZyBkb3duLCBidXQgdGhpcyB3aWxsIHRha2UgdXMgcGFzdCB0aGUgYm90dG9tLlxuICAgICAgICAgICAgJHRoaXMuc2Nyb2xsVG9wKHNjcm9sbEhlaWdodCk7XG4gICAgICAgICAgICByZXR1cm4gcHJldmVudCgpO1xuICAgICAgICB9IGVsc2UgaWYgKHVwICYmIGRlbHRhID4gc2Nyb2xsVG9wKSB7XG4gICAgICAgICAgICAvLyBTY3JvbGxpbmcgdXAsIGJ1dCB0aGlzIHdpbGwgdGFrZSB1cyBwYXN0IHRoZSB0b3AuXG4gICAgICAgICAgICAkdGhpcy5zY3JvbGxUb3AoMCk7XG4gICAgICAgICAgICByZXR1cm4gcHJldmVudCgpO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBvcGVuOiBvcGVuUmVhY3Rpb25zV2lkZ2V0LFxuICAgIGlzT3BlbjogaXNPcGVuV2luZG93LFxuICAgIFBBR0VfUkVBQ1RJT05TOiBQQUdFX1JFQUNUSU9OUyxcbiAgICBQQUdFX0RFRkFVTFRTOiBQQUdFX0RFRkFVTFRTLFxuICAgIFBBR0VfQVVUTzogUEFHRV9BVVRPLFxuICAgIHNlbGVjdG9yOiBTRUxFQ1RPUl9SRUFDVElPTlNfV0lER0VULFxuICAgIHRlYXJkb3duOiBjbG9zZUFsbFdpbmRvd3Ncbn07IiwiLy8gVGhpcyBtb2R1bGUgc2V0cyB1cCBsaXN0ZW5lcnMgb24gdGhlIHJlYWRtb3JlIHdpZGdldCBpbiBvcmRlciB0byByZWNvcmQgZXZlbnRzIHVzaW5nIGFsbCB0aGUgZGF0YSBhdmFpbGFibGUgdG9cbi8vIHRoZSByZWFjdGlvbiB3aWRnZXQuXG5cbnZhciBUaHJvdHRsZWRFdmVudHMgPSByZXF1aXJlKCcuL3V0aWxzL3Rocm90dGxlZC1ldmVudHMnKTtcbnZhciBFdmVudHMgPSByZXF1aXJlKCcuL2V2ZW50cycpO1xuXG5mdW5jdGlvbiBzZXR1cFJlYWRNb3JlRXZlbnRzKGVsZW1lbnQsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIHZpc2liaWxpdHlGaXJlZCA9IGZhbHNlO1xuICAgIHZhciByZWFkTW9yZUVsZW1lbnQgPSBlbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy5hbnRlbm5hLXJlYWRtb3JlJyk7XG4gICAgaWYgKHJlYWRNb3JlRWxlbWVudCkge1xuICAgICAgICB2YXIgcmVhZE1vcmVBY3Rpb24gPSByZWFkTW9yZUVsZW1lbnQucXVlcnlTZWxlY3RvcignLmFudGVubmEtcmVhZG1vcmUtYWN0aW9uJyk7XG4gICAgICAgIGlmIChyZWFkTW9yZUFjdGlvbikge1xuICAgICAgICAgICAgRXZlbnRzLnBvc3RSZWFkTW9yZUxvYWRlZChwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICBzZXR1cFZpc2liaWxpdHlMaXN0ZW5lcigpO1xuICAgICAgICAgICAgLy8gVE9ETzogQm90aCB0aGUgcmVhZG1vcmUgd2lkZ2V0IGFuZCB0aGlzIGNvZGUgc2hvdWxkIGJlIG1vdmVkIHRvIHVzaW5nIHRvdWNoIGV2ZW50c1xuICAgICAgICAgICAgcmVhZE1vcmVBY3Rpb24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmaXJlQ2xpY2tlZCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzZXR1cFZpc2liaWxpdHlMaXN0ZW5lcigpIHtcbiAgICAgICAgaWYgKGlzVmlzaWJsZSgpKSB7XG4gICAgICAgICAgICBmaXJlVmlzaWJsZSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgVGhyb3R0bGVkRXZlbnRzLm9uKCdzY3JvbGwnLCBoYW5kbGVTY3JvbGxFdmVudCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBoYW5kbGVTY3JvbGxFdmVudCgpIHtcbiAgICAgICAgaWYgKGlzVmlzaWJsZSgpKSB7XG4gICAgICAgICAgICBmaXJlVmlzaWJsZSgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNWaXNpYmxlKCkge1xuICAgICAgICB2YXIgY29udGVudEJveCA9IHJlYWRNb3JlRWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgdmFyIHZpZXdwb3J0Qm90dG9tID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudEhlaWdodDtcbiAgICAgICAgcmV0dXJuIGNvbnRlbnRCb3gudG9wID4gMCAmJiBjb250ZW50Qm94LnRvcCA8IHZpZXdwb3J0Qm90dG9tICYmXG4gICAgICAgICAgICAgICAgY29udGVudEJveC5ib3R0b20gPiAwICYmIGNvbnRlbnRCb3guYm90dG9tIDwgdmlld3BvcnRCb3R0b207XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZmlyZUNsaWNrZWQoKSB7XG4gICAgICAgIGlmICghdmlzaWJpbGl0eUZpcmVkKSB7IC8vIERhdGEgaW50ZWdyaXR5IC0gbWFrZSBzdXJlIHdlIGFsd2F5cyBmaXJlIGEgdmlzaWJpbGl0eSBldmVudCBiZWZvcmUgZmlyaW5nIGEgY2xpY2suXG4gICAgICAgICAgICBmaXJlVmlzaWJsZSgpO1xuICAgICAgICB9XG4gICAgICAgIEV2ZW50cy5wb3N0UmVhZE1vcmVDbGlja2VkKHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmaXJlVmlzaWJsZSgpIHtcbiAgICAgICAgaWYgKCF2aXNpYmlsaXR5RmlyZWQpIHsgLy8gZG9uJ3QgZmlyZSBtb3JlIHRoYW4gb25jZVxuICAgICAgICAgICAgRXZlbnRzLnBvc3RSZWFkTW9yZVZpc2libGUocGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgVGhyb3R0bGVkRXZlbnRzLm9mZignc2Nyb2xsJywgaGFuZGxlU2Nyb2xsRXZlbnQpO1xuICAgICAgICB9XG4gICAgICAgIHZpc2liaWxpdHlGaXJlZCA9IHRydWU7XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBzZXR1cFJlYWRNb3JlRXZlbnRzOiBzZXR1cFJlYWRNb3JlRXZlbnRzXG59OyIsInZhciBHcm91cFNldHRpbmdzID0gcmVxdWlyZSgnLi9ncm91cC1zZXR0aW5ncycpO1xudmFyIEhhc2hlZEVsZW1lbnRzID0gcmVxdWlyZSgnLi9oYXNoZWQtZWxlbWVudHMnKTtcbnZhciBQYWdlRGF0YSA9IHJlcXVpcmUoJy4vcGFnZS1kYXRhJyk7XG52YXIgUGFnZURhdGFMb2FkZXIgPSByZXF1aXJlKCcuL3BhZ2UtZGF0YS1sb2FkZXInKTtcbnZhciBQYWdlU2Nhbm5lciA9IHJlcXVpcmUoJy4vcGFnZS1zY2FubmVyJyk7XG52YXIgUG9wdXBXaWRnZXQgPSByZXF1aXJlKCcuL3BvcHVwLXdpZGdldCcpO1xudmFyIFJlYWN0aW9uc1dpZGdldCA9IHJlcXVpcmUoJy4vcmVhY3Rpb25zLXdpZGdldCcpO1xuXG52YXIgTXV0YXRpb25PYnNlcnZlciA9IHJlcXVpcmUoJy4vdXRpbHMvbXV0YXRpb24tb2JzZXJ2ZXInKTtcblxuZnVuY3Rpb24gcmVpbml0aWFsaXplQWxsKCkge1xuICAgIHZhciBncm91cFNldHRpbmdzID0gR3JvdXBTZXR0aW5ncy5nZXQoKTtcbiAgICBpZiAoZ3JvdXBTZXR0aW5ncykge1xuICAgICAgICByZWluaXRpYWxpemUoZ3JvdXBTZXR0aW5ncyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5sb2coJ0FudGVubmEgY2Fubm90IGJlIHJlaW5pdGlhbGl6ZWQuIEdyb3VwIHNldHRpbmdzIGFyZSBub3QgbG9hZGVkLicpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gcmVpbml0aWFsaXplKGdyb3VwU2V0dGluZ3MpIHtcbiAgICBSZWFjdGlvbnNXaWRnZXQudGVhcmRvd24oKTtcbiAgICBQb3B1cFdpZGdldC50ZWFyZG93bigpO1xuICAgIFBhZ2VTY2FubmVyLnRlYXJkb3duKCk7XG4gICAgUGFnZURhdGEudGVhcmRvd24oKTtcbiAgICBIYXNoZWRFbGVtZW50cy50ZWFyZG93bigpO1xuICAgIE11dGF0aW9uT2JzZXJ2ZXIudGVhcmRvd24oKTtcblxuICAgIFBhZ2VEYXRhTG9hZGVyLmxvYWQoZ3JvdXBTZXR0aW5ncyk7XG4gICAgUGFnZVNjYW5uZXIuc2Nhbihncm91cFNldHRpbmdzLCByZWluaXRpYWxpemUpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICByZWluaXRpYWxpemU6IHJlaW5pdGlhbGl6ZSxcbiAgICByZWluaXRpYWxpemVBbGw6IHJlaW5pdGlhbGl6ZUFsbCxcbn07IiwidmFyIFJhY3RpdmVQcm92aWRlciA9IHJlcXVpcmUoJy4vdXRpbHMvcmFjdGl2ZS1wcm92aWRlcicpO1xudmFyIFJhbmd5UHJvdmlkZXIgPSByZXF1aXJlKCcuL3V0aWxzL3Jhbmd5LXByb3ZpZGVyJyk7XG52YXIgSlF1ZXJ5UHJvdmlkZXIgPSByZXF1aXJlKCcuL3V0aWxzL2pxdWVyeS1wcm92aWRlcicpO1xudmFyIEFwcE1vZGUgPSByZXF1aXJlKCcuL3V0aWxzL2FwcC1tb2RlJyk7XG52YXIgVVJMcyA9IHJlcXVpcmUoJy4vdXRpbHMvdXJscycpO1xuXG52YXIgc2NyaXB0cyA9IFtcbiAgICB7c3JjOiAnLy9jZG5qcy5jbG91ZGZsYXJlLmNvbS9hamF4L2xpYnMvanF1ZXJ5LzIuMS40L2pxdWVyeS5taW4uanMnLCBjYWxsYmFjazogSlF1ZXJ5UHJvdmlkZXIubG9hZGVkfSxcbiAgICAvLyBUT0RPIG1pbmlmeSBvdXIgY29tcGlsZWQgUmFjdGl2ZSBhbmQgaG9zdCBpdCBvbiBhIENETlxuICAgIHtzcmM6IFVSTHMuYW1hem9uUzNVcmwoKSArICcvd2lkZ2V0LW5ldy9saWIvcmFjdGl2ZS5ydW50aW1lLTAuNy4zLm1pbi5qcycsIGNhbGxiYWNrOiBSYWN0aXZlUHJvdmlkZXIubG9hZGVkLCBhYm91dFRvTG9hZDogUmFjdGl2ZVByb3ZpZGVyLmFib3V0VG9Mb2FkfSxcbiAgICAvLyBUT0RPIG1pbmlmeSBvdXIgY29tcGlsZWQgUmFuZHkgYW5kIGhvc3QgaXQgb24gYSBDRE5cbiAgICB7c3JjOiBVUkxzLmFtYXpvblMzVXJsKCkgKyAnL3dpZGdldC1uZXcvbGliL3Jhbmd5LmNvbXBpbGVkLTEuMy4wLm1pbi5qcycsIGNhbGxiYWNrOiBSYW5neVByb3ZpZGVyLmxvYWRlZCwgYWJvdXRUb0xvYWQ6IFJhbmd5UHJvdmlkZXIuYWJvdXRUb0xvYWR9XG5dO1xuaWYgKEFwcE1vZGUub2ZmbGluZSkge1xuICAgIC8vIFVzZSB0aGUgb2ZmbGluZSB2ZXJzaW9ucyBvZiB0aGUgbGlicmFyaWVzIGZvciBkZXZlbG9wbWVudC5cbiAgICBzY3JpcHRzID0gW1xuICAgICAgICB7c3JjOiBVUkxzLmFwcFNlcnZlclVybCgpICsgJy9zdGF0aWMvanMvY2RuL2pxdWVyeS8yLjEuNC9qcXVlcnkuanMnLCBjYWxsYmFjazogSlF1ZXJ5UHJvdmlkZXIubG9hZGVkfSxcbiAgICAgICAge3NyYzogVVJMcy5hcHBTZXJ2ZXJVcmwoKSArICcvc3RhdGljL3dpZGdldC1uZXcvbGliL3JhY3RpdmUucnVudGltZS0wLjcuMy5qcycsIGNhbGxiYWNrOiBSYWN0aXZlUHJvdmlkZXIubG9hZGVkLCBhYm91dFRvTG9hZDogUmFjdGl2ZVByb3ZpZGVyLmFib3V0VG9Mb2FkfSxcbiAgICAgICAge3NyYzogVVJMcy5hcHBTZXJ2ZXJVcmwoKSArICcvc3RhdGljL3dpZGdldC1uZXcvbGliL3Jhbmd5LmNvbXBpbGVkLTEuMy4wLmpzJywgY2FsbGJhY2s6IFJhbmd5UHJvdmlkZXIubG9hZGVkLCBhYm91dFRvTG9hZDogUmFuZ3lQcm92aWRlci5hYm91dFRvTG9hZH1cbiAgICBdO1xufVxuXG5mdW5jdGlvbiBsb2FkQWxsU2NyaXB0cyhsb2FkZWRDYWxsYmFjaykge1xuICAgIGxvYWRTY3JpcHRzKHNjcmlwdHMsIGxvYWRlZENhbGxiYWNrKTtcbn1cblxuZnVuY3Rpb24gbG9hZFNjcmlwdHMoc2NyaXB0cywgbG9hZGVkQ2FsbGJhY2spIHtcbiAgICB2YXIgbG9hZGluZ0NvdW50ID0gc2NyaXB0cy5sZW5ndGg7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzY3JpcHRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBzY3JpcHQgPSBzY3JpcHRzW2ldO1xuICAgICAgICBpZiAoc2NyaXB0LmFib3V0VG9Mb2FkKSB7IHNjcmlwdC5hYm91dFRvTG9hZCgpOyB9XG4gICAgICAgIGxvYWRTY3JpcHQoc2NyaXB0LnNyYywgZnVuY3Rpb24oc2NyaXB0Q2FsbGJhY2spIHtcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBpZiAoc2NyaXB0Q2FsbGJhY2spIHNjcmlwdENhbGxiYWNrKCk7XG4gICAgICAgICAgICAgICAgbG9hZGluZ0NvdW50ID0gbG9hZGluZ0NvdW50IC0gMTtcbiAgICAgICAgICAgICAgICBpZiAobG9hZGluZ0NvdW50ID09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxvYWRlZENhbGxiYWNrKSBsb2FkZWRDYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gKHNjcmlwdC5jYWxsYmFjaykpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gbG9hZFNjcmlwdChzcmMsIGNhbGxiYWNrKSB7XG4gICAgdmFyIGhlYWQgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaGVhZCcpWzBdO1xuICAgIGlmIChoZWFkKSB7XG4gICAgICAgIHZhciBzY3JpcHRUYWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKTtcbiAgICAgICAgc2NyaXB0VGFnLnNldEF0dHJpYnV0ZSgnc3JjJywgc3JjKTtcbiAgICAgICAgc2NyaXB0VGFnLnNldEF0dHJpYnV0ZSgndHlwZScsJ3RleHQvamF2YXNjcmlwdCcpO1xuXG4gICAgICAgIGlmIChzY3JpcHRUYWcucmVhZHlTdGF0ZSkgeyAvLyBJRSwgaW5jbC4gSUU5XG4gICAgICAgICAgICBzY3JpcHRUYWcub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNjcmlwdFRhZy5yZWFkeVN0YXRlID09IFwibG9hZGVkXCIgfHwgc2NyaXB0VGFnLnJlYWR5U3RhdGUgPT0gXCJjb21wbGV0ZVwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHNjcmlwdFRhZy5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICBpZiAoY2FsbGJhY2spIHsgY2FsbGJhY2soKTsgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzY3JpcHRUYWcub25sb2FkID0gZnVuY3Rpb24oKSB7IC8vIE90aGVyIGJyb3dzZXJzXG4gICAgICAgICAgICAgICAgaWYgKGNhbGxiYWNrKSB7IGNhbGxiYWNrKCk7IH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICBoZWFkLmFwcGVuZENoaWxkKHNjcmlwdFRhZyk7XG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgbG9hZDogbG9hZEFsbFNjcmlwdHNcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgQnJvd3Nlck1ldHJpY3MgPSByZXF1aXJlKCcuL3V0aWxzL2Jyb3dzZXItbWV0cmljcycpO1xudmFyIFJhY3RpdmU7IHJlcXVpcmUoJy4vdXRpbHMvcmFjdGl2ZS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihsb2FkZWRSYWN0aXZlKSB7IFJhY3RpdmUgPSBsb2FkZWRSYWN0aXZlO30pO1xudmFyIFRvdWNoU3VwcG9ydCA9IHJlcXVpcmUoJy4vdXRpbHMvdG91Y2gtc3VwcG9ydCcpO1xuXG52YXIgUmVhY3Rpb25zV2lkZ2V0ID0gcmVxdWlyZSgnLi9yZWFjdGlvbnMtd2lkZ2V0Jyk7XG52YXIgU1ZHcyA9IHJlcXVpcmUoJy4vc3ZncycpO1xuXG5mdW5jdGlvbiBjcmVhdGVTdW1tYXJ5V2lkZ2V0KGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBkZWZhdWx0UmVhY3Rpb25zLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIHJhY3RpdmUgPSBSYWN0aXZlKHtcbiAgICAgICAgZWw6ICQoJzxkaXY+JyksIC8vIHRoZSByZWFsIHJvb3Qgbm9kZSBpcyBpbiB0aGUgdGVtcGxhdGUuIGl0J3MgZXh0cmFjdGVkIGFmdGVyIHRoZSB0ZW1wbGF0ZSBpcyByZW5kZXJlZCBpbnRvIHRoaXMgZHVtbXkgZWxlbWVudFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICBwYWdlRGF0YTogcGFnZURhdGEsXG4gICAgICAgICAgICBpc0V4cGFuZGVkU3VtbWFyeTogc2hvdWxkVXNlRXhwYW5kZWRTdW1tYXJ5KGdyb3VwU2V0dGluZ3MpLFxuICAgICAgICAgICAgY29tcHV0ZUV4cGFuZGVkUmVhY3Rpb25zOiBjb21wdXRlRXhwYW5kZWRSZWFjdGlvbnMoZ3JvdXBTZXR0aW5ncylcbiAgICAgICAgfSxcbiAgICAgICAgbWFnaWM6IHRydWUsXG4gICAgICAgIHRlbXBsYXRlOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvc3VtbWFyeS13aWRnZXQuaGJzLmh0bWwnKSxcbiAgICAgICAgcGFydGlhbHM6IHtcbiAgICAgICAgICAgIGxvZ286IFNWR3MubG9nb1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgdmFyICRyb290RWxlbWVudCA9ICQocm9vdEVsZW1lbnQocmFjdGl2ZSkpO1xuICAgICRyb290RWxlbWVudC5vbignbW91c2VlbnRlcicsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgb3BlblJlYWN0aW9uc1dpbmRvdyhjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgZGVmYXVsdFJlYWN0aW9ucywgZ3JvdXBTZXR0aW5ncywgcmFjdGl2ZSk7XG4gICAgfSk7XG4gICAgVG91Y2hTdXBwb3J0LnNldHVwVGFwKCRyb290RWxlbWVudC5nZXQoMCksIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGlmICghUmVhY3Rpb25zV2lkZ2V0LmlzT3BlbigpKSB7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICBvcGVuUmVhY3Rpb25zV2luZG93KGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBkZWZhdWx0UmVhY3Rpb25zLCBncm91cFNldHRpbmdzLCByYWN0aXZlKTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiB7XG4gICAgICAgIGVsZW1lbnQ6ICRyb290RWxlbWVudCxcbiAgICAgICAgdGVhcmRvd246IGZ1bmN0aW9uKCkgeyByYWN0aXZlLnRlYXJkb3duKCk7IH1cbiAgICB9O1xufVxuXG5mdW5jdGlvbiByb290RWxlbWVudChyYWN0aXZlKSB7XG4gICAgcmV0dXJuIHJhY3RpdmUuZmluZCgnLmFudGVubmEtc3VtbWFyeS13aWRnZXQnKTtcbn1cblxuZnVuY3Rpb24gb3BlblJlYWN0aW9uc1dpbmRvdyhjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgZGVmYXVsdFJlYWN0aW9ucywgZ3JvdXBTZXR0aW5ncywgcmFjdGl2ZSkge1xuICAgIHZhciByZWFjdGlvbnNXaWRnZXRPcHRpb25zID0ge1xuICAgICAgICBpc1N1bW1hcnk6IHRydWUsXG4gICAgICAgIHJlYWN0aW9uc0RhdGE6IHBhZ2VEYXRhLnN1bW1hcnlSZWFjdGlvbnMsXG4gICAgICAgIGNvbnRhaW5lckRhdGE6IGNvbnRhaW5lckRhdGEsXG4gICAgICAgIGRlZmF1bHRSZWFjdGlvbnM6IGRlZmF1bHRSZWFjdGlvbnMsXG4gICAgICAgIHBhZ2VEYXRhOiBwYWdlRGF0YSxcbiAgICAgICAgZ3JvdXBTZXR0aW5nczogZ3JvdXBTZXR0aW5ncyxcbiAgICAgICAgY29udGVudERhdGE6IHsgdHlwZTogJ3BhZ2UnLCBib2R5OiAnJyB9XG4gICAgfTtcbiAgICBSZWFjdGlvbnNXaWRnZXQub3BlbihyZWFjdGlvbnNXaWRnZXRPcHRpb25zLCByb290RWxlbWVudChyYWN0aXZlKSk7XG59XG5cbmZ1bmN0aW9uIHNob3VsZFVzZUV4cGFuZGVkU3VtbWFyeShncm91cFNldHRpbmdzKSB7XG4gICAgcmV0dXJuIGdyb3VwU2V0dGluZ3MuaXNFeHBhbmRlZE1vYmlsZVN1bW1hcnkoKSAmJiBCcm93c2VyTWV0cmljcy5pc01vYmlsZSgpO1xufVxuXG5mdW5jdGlvbiBjb21wdXRlRXhwYW5kZWRSZWFjdGlvbnMoZ3JvdXBTZXR0aW5ncykge1xuICAgIHJldHVybiBmdW5jdGlvbihyZWFjdGlvbnNEYXRhKSB7XG4gICAgICAgIHZhciBkZWZhdWx0UmVhY3Rpb25zID0gZ3JvdXBTZXR0aW5ncy5kZWZhdWx0UmVhY3Rpb25zKCk7XG4gICAgICAgIHZhciBtYXggPSAyO1xuICAgICAgICB2YXIgZXhwYW5kZWRSZWFjdGlvbnMgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZWFjdGlvbnNEYXRhLmxlbmd0aCAmJiBleHBhbmRlZFJlYWN0aW9ucy5sZW5ndGggPCBtYXg7IGkrKykge1xuICAgICAgICAgICAgdmFyIHJlYWN0aW9uRGF0YSA9IHJlYWN0aW9uc0RhdGFbaV07XG4gICAgICAgICAgICBpZiAoaXNEZWZhdWx0UmVhY3Rpb24ocmVhY3Rpb25EYXRhLCBkZWZhdWx0UmVhY3Rpb25zKSkge1xuICAgICAgICAgICAgICAgIGV4cGFuZGVkUmVhY3Rpb25zLnB1c2gocmVhY3Rpb25EYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZXhwYW5kZWRSZWFjdGlvbnM7XG4gICAgfTtcbn1cblxuZnVuY3Rpb24gaXNEZWZhdWx0UmVhY3Rpb24ocmVhY3Rpb25EYXRhLCBkZWZhdWx0UmVhY3Rpb25zKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkZWZhdWx0UmVhY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChkZWZhdWx0UmVhY3Rpb25zW2ldLnRleHQgPT09IHJlYWN0aW9uRGF0YS50ZXh0KSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGU6IGNyZWF0ZVN1bW1hcnlXaWRnZXRcbn07IiwidmFyIFJhY3RpdmU7IHJlcXVpcmUoJy4vdXRpbHMvcmFjdGl2ZS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihsb2FkZWRSYWN0aXZlKSB7IFJhY3RpdmUgPSBsb2FkZWRSYWN0aXZlO30pO1xuXG4vLyBBYm91dCBob3cgd2UgaGFuZGxlIGljb25zOiBXZSBpbnNlcnQgYSBzaW5nbGUgU1ZHIGVsZW1lbnQgYXQgdGhlIHRvcCBvZiB0aGUgYm9keSBlbGVtZW50IHdoaWNoIGRlZmluZXMgYWxsIG9mIHRoZVxuLy8gaWNvbnMgd2UgbmVlZC4gVGhlbiBhbGwgaWNvbnMgdXNlZCBieSB0aGUgYXBwbGljYXRpb25zIGFyZSByZW5kZXJlZCB3aXRoIHZlcnkgbGlnaHR3ZWlnaHQgU1ZHIGVsZW1lbnRzIHRoYXQgc2ltcGx5XG4vLyBwb2ludCB0byB0aGUgYXBwcm9wcmlhdGUgaWNvbiBieSByZWZlcmVuY2UuXG5cbi8vIFRPRE86IGxvb2sgaW50byB1c2luZyBhIHNpbmdsZSB0ZW1wbGF0ZSBmb3IgdGhlIFwidXNlXCIgU1ZHcy4gQ2FuIHdlIGluc3RhbnRpYXRlIGEgcGFydGlhbCB3aXRoIGEgZHluYW1pYyBjb250ZXh0P1xudmFyIHRlbXBsYXRlcyA9IHtcbiAgICBsb2dvOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvc3ZnLWxvZ28uaGJzLmh0bWwnKSxcbiAgICAvLyBUaGUgXCJzZWxlY3RhYmxlXCIgbG9nbyBkZWZpbmVzIGFuIGlubGluZSAncGF0aCcgcmF0aGVyIHRoYW4gYSAndXNlJyByZWZlcmVuY2UsIGFzIGEgd29ya2Fyb3VuZCBmb3IgYSBGaXJlZm94IHRleHQgc2VsZWN0aW9uIGJ1Zy5cbiAgICBsb2dvU2VsZWN0YWJsZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL3N2Zy1sb2dvLXNlbGVjdGFibGUuaGJzLmh0bWwnKSxcbiAgICBjb21tZW50czogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL3N2Zy1jb21tZW50cy5oYnMuaHRtbCcpLFxuICAgIGxvY2F0aW9uOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvc3ZnLWxvY2F0aW9uLmhicy5odG1sJyksXG4gICAgZmFjZWJvb2s6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9zdmctZmFjZWJvb2suaGJzLmh0bWwnKSxcbiAgICB0d2l0dGVyOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvc3ZnLXR3aXR0ZXIuaGJzLmh0bWwnKSxcbiAgICBsZWZ0OiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvc3ZnLWxlZnQuaGJzLmh0bWwnKSxcbiAgICBmaWxtOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvc3ZnLWZpbG0uaGJzLmh0bWwnKVxufTtcblxudmFyIGlzU2V0dXAgPSBmYWxzZTtcblxuZnVuY3Rpb24gZW5zdXJlU2V0dXAoKSB7XG4gICAgaWYgKCFpc1NldHVwKSB7XG4gICAgICAgIHZhciBkdW1teSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBSYWN0aXZlKHtcbiAgICAgICAgICAgIGVsOiBkdW1teSxcbiAgICAgICAgICAgIHRlbXBsYXRlOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvc3Zncy5oYnMuaHRtbCcpXG4gICAgICAgIH0pO1xuICAgICAgICAvLyBTYWZhcmkgb24gaU9TIHJlcXVpcmVzIHRoZSBTVkcgdGhhdCBkZWZpbmVzIHRoZSBpY29ucyBhcHBlYXIgYmVmb3JlIHRoZSBTVkdzIHRoYXQgcmVmZXJlbmNlIGl0LlxuICAgICAgICBkb2N1bWVudC5ib2R5Lmluc2VydEJlZm9yZShkdW1teS5jaGlsZHJlblswXSwgZG9jdW1lbnQuYm9keS5maXJzdENoaWxkKTtcbiAgICAgICAgaXNTZXR1cCA9IHRydWU7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBnZXRTVkcodGVtcGxhdGUpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgIGVuc3VyZVNldHVwKCk7XG4gICAgICAgIHJldHVybiB0ZW1wbGF0ZTtcbiAgICB9XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBsb2dvOiBnZXRTVkcodGVtcGxhdGVzLmxvZ28pLFxuICAgIGxvZ29TZWxlY3RhYmxlOiBnZXRTVkcodGVtcGxhdGVzLmxvZ29TZWxlY3RhYmxlKSxcbiAgICBjb21tZW50czogZ2V0U1ZHKHRlbXBsYXRlcy5jb21tZW50cyksXG4gICAgbG9jYXRpb246IGdldFNWRyh0ZW1wbGF0ZXMubG9jYXRpb24pLFxuICAgIGZhY2Vib29rOiBnZXRTVkcodGVtcGxhdGVzLmZhY2Vib29rKSxcbiAgICB0d2l0dGVyOiBnZXRTVkcodGVtcGxhdGVzLnR3aXR0ZXIpLFxuICAgIGxlZnQ6IGdldFNWRyh0ZW1wbGF0ZXMubGVmdCksXG4gICAgZmlsbTogZ2V0U1ZHKHRlbXBsYXRlcy5maWxtKVxufTsiLCJ2YXIgUmFjdGl2ZTsgcmVxdWlyZSgnLi91dGlscy9yYWN0aXZlLXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGxvYWRlZFJhY3RpdmUpIHsgUmFjdGl2ZSA9IGxvYWRlZFJhY3RpdmU7fSk7XG52YXIgQnJvd3Nlck1ldHJpY3MgPSByZXF1aXJlKCcuL3V0aWxzL2Jyb3dzZXItbWV0cmljcycpO1xudmFyIFNWR3MgPSByZXF1aXJlKCcuL3N2Z3MnKTtcbnZhciBXaWRnZXRCdWNrZXQgPSByZXF1aXJlKCcuL3V0aWxzL3dpZGdldC1idWNrZXQnKTtcblxuZnVuY3Rpb24gc2V0dXBIZWxwZXIoZ3JvdXBTZXR0aW5ncykge1xuICAgIGlmICghaXNEaXNtaXNzZWQoKSAmJiAhZ3JvdXBTZXR0aW5ncy5pc0hpZGVUYXBIZWxwZXIoKSAmJiBCcm93c2VyTWV0cmljcy5zdXBwb3J0c1RvdWNoKCkpIHtcbiAgICAgICAgdmFyIHJhY3RpdmUgPSBSYWN0aXZlKHtcbiAgICAgICAgICAgIGVsOiBXaWRnZXRCdWNrZXQuZ2V0KCksXG4gICAgICAgICAgICBhcHBlbmQ6IHRydWUsXG4gICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgcG9zaXRpb25Ub3A6IGdyb3VwU2V0dGluZ3MudGFwSGVscGVyUG9zaXRpb24oKSA9PT0gJ3RvcCdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL3RhcC1oZWxwZXIuaGJzLmh0bWwnKSxcbiAgICAgICAgICAgIHBhcnRpYWxzOiB7XG4gICAgICAgICAgICAgICAgbG9nbzogU1ZHcy5sb2dvXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByYWN0aXZlLm9uKCdkaXNtaXNzJywgZGlzbWlzcyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZGlzbWlzcygpIHtcbiAgICAgICAgcmFjdGl2ZS50ZWFyZG93bigpO1xuICAgICAgICBzZXREaXNtaXNzZWQodHJ1ZSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBzZXREaXNtaXNzZWQoZGlzbWlzc2VkKSB7XG4gICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2hpZGVEb3VibGVUYXBNZXNzYWdlJywgZGlzbWlzc2VkKTtcbn1cblxuZnVuY3Rpb24gaXNEaXNtaXNzZWQoKSB7XG4gICAgcmV0dXJuIGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdoaWRlRG91YmxlVGFwTWVzc2FnZScpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBzZXR1cEhlbHBlcjogc2V0dXBIZWxwZXJcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgUmFjdGl2ZTsgcmVxdWlyZSgnLi91dGlscy9yYWN0aXZlLXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGxvYWRlZFJhY3RpdmUpIHsgUmFjdGl2ZSA9IGxvYWRlZFJhY3RpdmU7fSk7XG52YXIgVG91Y2hTdXBwb3J0ID0gcmVxdWlyZSgnLi91dGlscy90b3VjaC1zdXBwb3J0Jyk7XG5cbnZhciBQb3B1cFdpZGdldCA9IHJlcXVpcmUoJy4vcG9wdXAtd2lkZ2V0Jyk7XG52YXIgUmVhY3Rpb25zV2lkZ2V0ID0gcmVxdWlyZSgnLi9yZWFjdGlvbnMtd2lkZ2V0Jyk7XG52YXIgU1ZHcyA9IHJlcXVpcmUoJy4vc3ZncycpO1xuXG52YXIgQ0xBU1NfQUNUSVZFID0gJ2FudGVubmEtYWN0aXZlJztcblxuZnVuY3Rpb24gY3JlYXRlSW5kaWNhdG9yV2lkZ2V0KG9wdGlvbnMpIHtcbiAgICB2YXIgY29udGFpbmVyRGF0YSA9IG9wdGlvbnMuY29udGFpbmVyRGF0YTtcbiAgICB2YXIgJGNvbnRhaW5lckVsZW1lbnQgPSBvcHRpb25zLmNvbnRhaW5lckVsZW1lbnQ7XG4gICAgdmFyIHBhZ2VEYXRhID0gb3B0aW9ucy5wYWdlRGF0YTtcbiAgICB2YXIgZ3JvdXBTZXR0aW5ncyA9IG9wdGlvbnMuZ3JvdXBTZXR0aW5ncztcbiAgICB2YXIgZGVmYXVsdFJlYWN0aW9ucyA9IG9wdGlvbnMuZGVmYXVsdFJlYWN0aW9ucztcbiAgICB2YXIgY29vcmRzID0gb3B0aW9ucy5jb29yZHM7XG4gICAgdmFyIHJhY3RpdmUgPSBSYWN0aXZlKHtcbiAgICAgICAgZWw6ICQoJzxkaXY+JyksIC8vIHRoZSByZWFsIHJvb3Qgbm9kZSBpcyBpbiB0aGUgdGVtcGxhdGUuIGl0J3MgZXh0cmFjdGVkIGFmdGVyIHRoZSB0ZW1wbGF0ZSBpcyByZW5kZXJlZCBpbnRvIHRoaXMgZHVtbXkgZWxlbWVudFxuICAgICAgICBhcHBlbmQ6IHRydWUsXG4gICAgICAgIG1hZ2ljOiB0cnVlLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICBjb250YWluZXJEYXRhOiBjb250YWluZXJEYXRhLFxuICAgICAgICAgICAgZXh0cmFDbGFzc2VzOiBncm91cFNldHRpbmdzLmVuYWJsZVRleHRIZWxwZXIoKSA/IFwiXCIgOiBcImFudGVubmEtbm9oaW50XCJcbiAgICAgICAgfSxcbiAgICAgICAgdGVtcGxhdGU6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy90ZXh0LWluZGljYXRvci13aWRnZXQuaGJzLmh0bWwnKSxcbiAgICAgICAgcGFydGlhbHM6IHtcbiAgICAgICAgICAgIGxvZ286IFNWR3MubG9nb1NlbGVjdGFibGVcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgdmFyIHJlYWN0aW9uV2lkZ2V0T3B0aW9ucyA9IHtcbiAgICAgICAgcmVhY3Rpb25zRGF0YTogY29udGFpbmVyRGF0YS5yZWFjdGlvbnMsXG4gICAgICAgIGNvbnRhaW5lckRhdGE6IGNvbnRhaW5lckRhdGEsXG4gICAgICAgIGNvbnRhaW5lckVsZW1lbnQ6ICRjb250YWluZXJFbGVtZW50LFxuICAgICAgICBjb250ZW50RGF0YTogeyB0eXBlOiAndGV4dCcgfSxcbiAgICAgICAgZGVmYXVsdFJlYWN0aW9uczogZGVmYXVsdFJlYWN0aW9ucyxcbiAgICAgICAgcGFnZURhdGE6IHBhZ2VEYXRhLFxuICAgICAgICBncm91cFNldHRpbmdzOiBncm91cFNldHRpbmdzXG4gICAgfTtcblxuICAgIHZhciAkcm9vdEVsZW1lbnQgPSAkKHJvb3RFbGVtZW50KHJhY3RpdmUpKTtcbiAgICBpZiAoY29vcmRzKSB7XG4gICAgICAgICRyb290RWxlbWVudC5jc3Moe1xuICAgICAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXG4gICAgICAgICAgICB0b3A6IGNvb3Jkcy50b3AgLSAkcm9vdEVsZW1lbnQuaGVpZ2h0KCksXG4gICAgICAgICAgICBib3R0b206IGNvb3Jkcy5ib3R0b20sXG4gICAgICAgICAgICBsZWZ0OiBjb29yZHMubGVmdCxcbiAgICAgICAgICAgIHJpZ2h0OiBjb29yZHMucmlnaHQsXG4gICAgICAgICAgICAnei1pbmRleCc6IDEwMDAgLy8gVE9ETzogY29tcHV0ZSBhIHJlYWwgdmFsdWU/XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICB2YXIgaG92ZXJUaW1lb3V0O1xuICAgIHZhciB0YXBTdXBwb3J0ID0gVG91Y2hTdXBwb3J0LnNldHVwVGFwKCRyb290RWxlbWVudC5nZXQoMCksIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBvcGVuUmVhY3Rpb25zV2luZG93KHJlYWN0aW9uV2lkZ2V0T3B0aW9ucywgcmFjdGl2ZSk7XG4gICAgfSk7XG4gICAgJHJvb3RFbGVtZW50Lm9uKCdtb3VzZWVudGVyLmFudGVubmEnLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBpZiAoZXZlbnQuYnV0dG9ucyA+IDAgfHwgKGV2ZW50LmJ1dHRvbnMgPT0gdW5kZWZpbmVkICYmIGV2ZW50LndoaWNoID4gMCkpIHsgLy8gT24gU2FmYXJpLCBldmVudC5idXR0b25zIGlzIHVuZGVmaW5lZCBidXQgZXZlbnQud2hpY2ggZ2l2ZXMgYSBnb29kIHZhbHVlLiBldmVudC53aGljaCBpcyBiYWQgb24gRkZcbiAgICAgICAgICAgIC8vIERvbid0IHJlYWN0IGlmIHRoZSB1c2VyIGlzIGRyYWdnaW5nIG9yIHNlbGVjdGluZyB0ZXh0LlxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNsZWFyVGltZW91dChob3ZlclRpbWVvdXQpOyAvLyBvbmx5IG9uZSB0aW1lb3V0IGF0IGEgdGltZVxuICAgICAgICBob3ZlclRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKGNvbnRhaW5lckRhdGEucmVhY3Rpb25zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBvcGVuUmVhY3Rpb25zV2luZG93KHJlYWN0aW9uV2lkZ2V0T3B0aW9ucywgcmFjdGl2ZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhciAkaWNvbiA9ICQocm9vdEVsZW1lbnQocmFjdGl2ZSkpLmZpbmQoJy5hbnRlbm5hLWxvZ28nKTtcbiAgICAgICAgICAgICAgICB2YXIgb2Zmc2V0ID0gJGljb24ub2Zmc2V0KCk7XG4gICAgICAgICAgICAgICAgdmFyIGNvb3JkaW5hdGVzID0ge1xuICAgICAgICAgICAgICAgICAgICB0b3A6IG9mZnNldC50b3AgKyBNYXRoLmZsb29yKCRpY29uLmhlaWdodCgpIC8gMiksIC8vIFRPRE8gdGhpcyBudW1iZXIgaXMgYSBsaXR0bGUgb2ZmIGJlY2F1c2UgdGhlIGRpdiBkb2Vzbid0IHRpZ2h0bHkgd3JhcCB0aGUgaW5zZXJ0ZWQgZm9udCBjaGFyYWN0ZXJcbiAgICAgICAgICAgICAgICAgICAgbGVmdDogb2Zmc2V0LmxlZnQgKyBNYXRoLmZsb29yKCRpY29uLndpZHRoKCkgLyAyKVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgUG9wdXBXaWRnZXQuc2hvdyhjb29yZGluYXRlcywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIG9wZW5SZWFjdGlvbnNXaW5kb3cocmVhY3Rpb25XaWRnZXRPcHRpb25zLCByYWN0aXZlKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgMjAwKTtcbiAgICB9KTtcbiAgICAkcm9vdEVsZW1lbnQub24oJ21vdXNlbGVhdmUuYW50ZW5uYScsIGZ1bmN0aW9uKCkge1xuICAgICAgICBjbGVhclRpbWVvdXQoaG92ZXJUaW1lb3V0KTtcbiAgICB9KTtcbiAgICAkY29udGFpbmVyRWxlbWVudC5vbignbW91c2VlbnRlci5hbnRlbm5hJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICRyb290RWxlbWVudC5hZGRDbGFzcyhDTEFTU19BQ1RJVkUpO1xuICAgIH0pO1xuICAgICRjb250YWluZXJFbGVtZW50Lm9uKCdtb3VzZWxlYXZlLmFudGVubmEnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgJHJvb3RFbGVtZW50LnJlbW92ZUNsYXNzKENMQVNTX0FDVElWRSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZWxlbWVudDogJHJvb3RFbGVtZW50LFxuICAgICAgICB0ZWFyZG93bjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAkY29udGFpbmVyRWxlbWVudC5vZmYoJy5hbnRlbm5hJyk7XG4gICAgICAgICAgICByYWN0aXZlLnRlYXJkb3duKCk7XG4gICAgICAgICAgICB0YXBTdXBwb3J0LnRlYXJkb3duKCk7XG4gICAgICAgIH1cbiAgICB9O1xufVxuXG5mdW5jdGlvbiByb290RWxlbWVudChyYWN0aXZlKSB7XG4gICAgcmV0dXJuIHJhY3RpdmUuZmluZCgnLmFudGVubmEtdGV4dC1pbmRpY2F0b3Itd2lkZ2V0Jyk7XG59XG5cbmZ1bmN0aW9uIG9wZW5SZWFjdGlvbnNXaW5kb3cocmVhY3Rpb25PcHRpb25zLCByYWN0aXZlKSB7XG4gICAgUmVhY3Rpb25zV2lkZ2V0Lm9wZW4ocmVhY3Rpb25PcHRpb25zLCByb290RWxlbWVudChyYWN0aXZlKSk7XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGU6IGNyZWF0ZUluZGljYXRvcldpZGdldFxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi91dGlscy9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciBQb3B1cFdpZGdldCA9IHJlcXVpcmUoJy4vcG9wdXAtd2lkZ2V0Jyk7XG52YXIgUmFuZ2UgPSByZXF1aXJlKCcuL3V0aWxzL3JhbmdlJyk7XG52YXIgUmVhY3Rpb25zV2lkZ2V0ID0gcmVxdWlyZSgnLi9yZWFjdGlvbnMtd2lkZ2V0Jyk7XG52YXIgVG91Y2hTdXBwb3J0ID0gcmVxdWlyZSgnLi91dGlscy90b3VjaC1zdXBwb3J0Jyk7XG5cblxuZnVuY3Rpb24gY3JlYXRlUmVhY3RhYmxlVGV4dChvcHRpb25zKSB7XG4gICAgLy8gVE9ETzogaW1wb3NlIGFuIHVwcGVyIGxpbWl0IG9uIHRoZSBsZW5ndGggb2YgdGV4dCB0aGF0IGNhbiBiZSByZWFjdGVkIHRvPyAoYXBwbGllcyB0byB0aGUgaW5kaWNhdG9yLXdpZGdldCB0b28pXG4gICAgdmFyICRjb250YWluZXJFbGVtZW50ID0gb3B0aW9ucy5jb250YWluZXJFbGVtZW50O1xuICAgIHZhciBjb250YWluZXJEYXRhID0gb3B0aW9ucy5jb250YWluZXJEYXRhO1xuICAgIHZhciBleGNsdWRlTm9kZSA9IG9wdGlvbnMuZXhjbHVkZU5vZGU7XG4gICAgdmFyIHJlYWN0aW9uc1dpZGdldE9wdGlvbnMgPSB7XG4gICAgICAgIHJlYWN0aW9uc0RhdGE6IFtdLCAvLyBBbHdheXMgb3BlbiB3aXRoIHRoZSBkZWZhdWx0IHJlYWN0aW9uc1xuICAgICAgICBjb250YWluZXJEYXRhOiBjb250YWluZXJEYXRhLFxuICAgICAgICBjb250ZW50RGF0YTogeyB0eXBlOiAndGV4dCcgfSxcbiAgICAgICAgY29udGFpbmVyRWxlbWVudDogJGNvbnRhaW5lckVsZW1lbnQsXG4gICAgICAgIGRlZmF1bHRSZWFjdGlvbnM6IG9wdGlvbnMuZGVmYXVsdFJlYWN0aW9ucyxcbiAgICAgICAgcGFnZURhdGE6IG9wdGlvbnMucGFnZURhdGEsXG4gICAgICAgIGdyb3VwU2V0dGluZ3M6IG9wdGlvbnMuZ3JvdXBTZXR0aW5nc1xuICAgIH07XG5cbiAgICB2YXIgdGFwRXZlbnRzID0gc2V0dXBUYXBFdmVudHMoJGNvbnRhaW5lckVsZW1lbnQuZ2V0KDApLCByZWFjdGlvbnNXaWRnZXRPcHRpb25zKTtcbiAgICAkY29udGFpbmVyRWxlbWVudC5vbignbW91c2V1cC5hbnRlbm5hJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgLy8gTm90ZSB0aGF0IHdlIGhhdmUgdG8gZG8gYSBwcmVlbXB0aXZlIGNoZWNrIGlmIHRoZSBwb3B1cCBpcyBzaG93aW5nIGJlY2F1c2Ugb2YgYSB0aW1pbmcgZGlmZmVyZW5jZSBpbiBTYWZhcmkuXG4gICAgICAgIC8vIFdlIHdlcmUgc2VlaW5nIHRoZSBkb2N1bWVudCBjbGljayBoYW5kbGVyIGNsb3NpbmcgdGhlIHBvcHVwIHdoaWxlIHRoZSBzZWxlY3Rpb24gd2FzIGJlaW5nIGNvbXB1dGVkLCB3aGljaFxuICAgICAgICAvLyBtZWFudCB0aGF0IGNhbGxpbmcgUG9wdXBXaWRnZXQuc2hvdyB3b3VsZCB0aGluayBpdCBuZWVkZWQgdG8gcmVvcGVuIHRoZSBwb3B1cCAoaW5zdGVhZCBvZiBxdWlldGx5IGRvaW5nIG5vdGhpbmcgYXMgaXQgc2hvdWxkKS5cbiAgICAgICAgaWYgKGNvbnRhaW5lckRhdGEubG9hZGVkICYmICFQb3B1cFdpZGdldC5pc1Nob3dpbmcoKSkge1xuICAgICAgICAgICAgdmFyIG5vZGUgPSAkY29udGFpbmVyRWxlbWVudC5nZXQoMCk7XG4gICAgICAgICAgICB2YXIgcG9pbnQgPSBSYW5nZS5nZXRTZWxlY3Rpb25FbmRQb2ludChub2RlLCBldmVudCwgZXhjbHVkZU5vZGUpO1xuICAgICAgICAgICAgaWYgKHBvaW50KSB7XG4gICAgICAgICAgICAgICAgdmFyIGNvb3JkaW5hdGVzID0ge3RvcDogcG9pbnQueSwgbGVmdDogcG9pbnQueH07XG4gICAgICAgICAgICAgICAgUG9wdXBXaWRnZXQuc2hvdyhjb29yZGluYXRlcywgZ3JhYlNlbGVjdGlvbkFuZE9wZW4obm9kZSwgY29vcmRpbmF0ZXMsIHJlYWN0aW9uc1dpZGdldE9wdGlvbnMsIGV4Y2x1ZGVOb2RlKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4ge1xuICAgICAgICB0ZWFyZG93bjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB0YXBFdmVudHMudGVhcmRvd24oKTtcbiAgICAgICAgICAgICRjb250YWluZXJFbGVtZW50Lm9mZignLmFudGVubmEnKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gZ3JhYlNlbGVjdGlvbkFuZE9wZW4obm9kZSwgY29vcmRpbmF0ZXMsIHJlYWN0aW9uc1dpZGdldE9wdGlvbnMsIGV4Y2x1ZGVOb2RlKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICBSYW5nZS5ncmFiU2VsZWN0aW9uKG5vZGUsIGZ1bmN0aW9uKHRleHQsIGxvY2F0aW9uKSB7XG4gICAgICAgICAgICByZWFjdGlvbnNXaWRnZXRPcHRpb25zLmNvbnRlbnREYXRhLmxvY2F0aW9uID0gbG9jYXRpb247XG4gICAgICAgICAgICByZWFjdGlvbnNXaWRnZXRPcHRpb25zLmNvbnRlbnREYXRhLmJvZHkgPSB0ZXh0O1xuICAgICAgICAgICAgUmVhY3Rpb25zV2lkZ2V0Lm9wZW4ocmVhY3Rpb25zV2lkZ2V0T3B0aW9ucywgY29vcmRpbmF0ZXMpO1xuICAgICAgICB9LCBleGNsdWRlTm9kZSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBncmFiTm9kZUFuZE9wZW4obm9kZSwgcmVhY3Rpb25zV2lkZ2V0T3B0aW9ucywgY29vcmRzKSB7XG4gICAgUmFuZ2UuZ3JhYk5vZGUobm9kZSwgZnVuY3Rpb24odGV4dCwgbG9jYXRpb24pIHtcbiAgICAgICAgcmVhY3Rpb25zV2lkZ2V0T3B0aW9ucy5jb250ZW50RGF0YS5sb2NhdGlvbiA9IGxvY2F0aW9uO1xuICAgICAgICByZWFjdGlvbnNXaWRnZXRPcHRpb25zLmNvbnRlbnREYXRhLmJvZHkgPSB0ZXh0O1xuICAgICAgICBSZWFjdGlvbnNXaWRnZXQub3BlbihyZWFjdGlvbnNXaWRnZXRPcHRpb25zLCBjb29yZHMpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBzZXR1cFRhcEV2ZW50cyhlbGVtZW50LCByZWFjdGlvbnNXaWRnZXRPcHRpb25zKSB7XG4gICAgcmV0dXJuIFRvdWNoU3VwcG9ydC5zZXR1cFRhcChlbGVtZW50LCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBpZiAoIVJlYWN0aW9uc1dpZGdldC5pc09wZW4oKSAmJiAkKGV2ZW50LnRhcmdldCkuY2xvc2VzdCgnYSwubm8tYW50JykubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICB2YXIgdG91Y2ggPSBldmVudC5jaGFuZ2VkVG91Y2hlc1swXTtcbiAgICAgICAgICAgIHZhciBjb29yZHMgPSB7IHRvcDogdG91Y2gucGFnZVksIGxlZnQ6IHRvdWNoLnBhZ2VYIH07XG4gICAgICAgICAgICBncmFiTm9kZUFuZE9wZW4oZWxlbWVudCwgcmVhY3Rpb25zV2lkZ2V0T3B0aW9ucywgY29vcmRzKTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlUmVhY3RhYmxlVGV4dDogY3JlYXRlUmVhY3RhYmxlVGV4dFxufTsiLCJ2YXIgQXBwTW9kZSA9IHJlcXVpcmUoJy4vYXBwLW1vZGUnKTtcbnZhciBKU09OUENsaWVudCA9IHJlcXVpcmUoJy4vanNvbnAtY2xpZW50Jyk7XG52YXIgSlNPTlV0aWxzID0gcmVxdWlyZSgnLi9qc29uLXV0aWxzJyk7XG52YXIgTG9nZ2luZyA9IHJlcXVpcmUoJy4vbG9nZ2luZycpO1xudmFyIFVSTHMgPSByZXF1aXJlKCcuL3VybHMnKTtcbnZhciBVc2VyID0gcmVxdWlyZSgnLi91c2VyJyk7XG5cbmZ1bmN0aW9uIHBvc3ROZXdSZWFjdGlvbihyZWFjdGlvbkRhdGEsIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBjb250ZW50RGF0YSwgZ3JvdXBTZXR0aW5ncywgc3VjY2VzcywgZXJyb3IpIHtcbiAgICB2YXIgY29udGVudEJvZHkgPSBjb250ZW50RGF0YS5ib2R5O1xuICAgIHZhciBjb250ZW50VHlwZSA9IGNvbnRlbnREYXRhLnR5cGU7XG4gICAgdmFyIGNvbnRlbnRMb2NhdGlvbiA9IGNvbnRlbnREYXRhLmxvY2F0aW9uO1xuICAgIHZhciBjb250ZW50RGltZW5zaW9ucyA9IGNvbnRlbnREYXRhLmRpbWVuc2lvbnM7XG4gICAgVXNlci5mZXRjaFVzZXIoZ3JvdXBTZXR0aW5ncywgZnVuY3Rpb24odXNlckluZm8pIHtcbiAgICAgICAgLy8gVE9ETyBleHRyYWN0IHRoZSBzaGFwZSBvZiB0aGlzIGRhdGEgYW5kIHBvc3NpYmx5IHRoZSB3aG9sZSBBUEkgY2FsbFxuICAgICAgICB2YXIgZGF0YSA9IHtcbiAgICAgICAgICAgIHRhZzoge1xuICAgICAgICAgICAgICAgIGJvZHk6IHJlYWN0aW9uRGF0YS50ZXh0LFxuICAgICAgICAgICAgICAgIGlzX2RlZmF1bHQ6IHJlYWN0aW9uRGF0YS5pc0RlZmF1bHQgIT09IHVuZGVmaW5lZCAmJiByZWFjdGlvbkRhdGEuaXNEZWZhdWx0IC8vIGZhbHNlIHVubGVzcyBzcGVjaWZpZWRcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBoYXNoOiBjb250YWluZXJEYXRhLmhhc2gsXG4gICAgICAgICAgICB1c2VyX2lkOiB1c2VySW5mby51c2VyX2lkLFxuICAgICAgICAgICAgYW50X3Rva2VuOiB1c2VySW5mby5hbnRfdG9rZW4sXG4gICAgICAgICAgICBwYWdlX2lkOiBwYWdlRGF0YS5wYWdlSWQsXG4gICAgICAgICAgICBncm91cF9pZDogcGFnZURhdGEuZ3JvdXBJZCxcbiAgICAgICAgICAgIGNvbnRhaW5lcl9raW5kOiBjb250ZW50VHlwZSwgLy8gT25lIG9mICdwYWdlJywgJ3RleHQnLCAnbWVkaWEnLCAnaW1nJ1xuICAgICAgICAgICAgY29udGVudF9ub2RlX2RhdGE6IHtcbiAgICAgICAgICAgICAgICBib2R5OiBjb250ZW50Qm9keSxcbiAgICAgICAgICAgICAgICBraW5kOiBjb250ZW50VHlwZSxcbiAgICAgICAgICAgICAgICBpdGVtX3R5cGU6ICcnIC8vIFRPRE86IGxvb2tzIHVudXNlZCBidXQgVGFnSGFuZGxlciBibG93cyB1cCB3aXRob3V0IGl0LiBDdXJyZW50IGNsaWVudCBwYXNzZXMgaW4gXCJwYWdlXCIgZm9yIHBhZ2UgcmVhY3Rpb25zLlxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBpZiAoY29udGVudExvY2F0aW9uKSB7XG4gICAgICAgICAgICBkYXRhLmNvbnRlbnRfbm9kZV9kYXRhLmxvY2F0aW9uID0gY29udGVudExvY2F0aW9uO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjb250ZW50RGltZW5zaW9ucykge1xuICAgICAgICAgICAgZGF0YS5jb250ZW50X25vZGVfZGF0YS5oZWlnaHQgPSBjb250ZW50RGltZW5zaW9ucy5oZWlnaHQ7XG4gICAgICAgICAgICBkYXRhLmNvbnRlbnRfbm9kZV9kYXRhLndpZHRoID0gY29udGVudERpbWVuc2lvbnMud2lkdGg7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJlYWN0aW9uRGF0YS5pZCkge1xuICAgICAgICAgICAgZGF0YS50YWcuaWQgPSByZWFjdGlvbkRhdGEuaWQ7IC8vIFRPRE8gdGhlIGN1cnJlbnQgY2xpZW50IHNlbmRzIFwiLTEwMVwiIGlmIHRoZXJlJ3Mgbm8gaWQuIGlzIHRoaXMgbmVjZXNzYXJ5P1xuICAgICAgICB9XG4gICAgICAgIGdldEpTT05QKFVSTHMuY3JlYXRlUmVhY3Rpb25VcmwoKSwgZGF0YSwgbmV3UmVhY3Rpb25TdWNjZXNzKGNvbnRlbnRMb2NhdGlvbiwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIHN1Y2Nlc3MpLCBlcnJvcik7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIHBvc3RQbHVzT25lKHJlYWN0aW9uRGF0YSwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MsIHN1Y2Nlc3MsIGVycm9yKSB7XG4gICAgVXNlci5mZXRjaFVzZXIoZ3JvdXBTZXR0aW5ncywgZnVuY3Rpb24odXNlckluZm8pIHtcbiAgICAgICAgLy8gVE9ETyBleHRyYWN0IHRoZSBzaGFwZSBvZiB0aGlzIGRhdGEgYW5kIHBvc3NpYmx5IHRoZSB3aG9sZSBBUEkgY2FsbFxuICAgICAgICBpZiAoIXJlYWN0aW9uRGF0YS5jb250ZW50KSB7XG4gICAgICAgICAgICAvLyBUaGlzIGlzIGEgc3VtbWFyeSByZWFjdGlvbi4gU2VlIGlmIHdlIGhhdmUgYW55IGNvbnRhaW5lciBkYXRhIHRoYXQgd2UgY2FuIGxpbmsgdG8gaXQuXG4gICAgICAgICAgICB2YXIgY29udGFpbmVyUmVhY3Rpb25zID0gY29udGFpbmVyRGF0YS5yZWFjdGlvbnM7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvbnRhaW5lclJlYWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBjb250YWluZXJSZWFjdGlvbiA9IGNvbnRhaW5lclJlYWN0aW9uc1tpXTtcbiAgICAgICAgICAgICAgICBpZiAoY29udGFpbmVyUmVhY3Rpb24uaWQgPT09IHJlYWN0aW9uRGF0YS5pZCkge1xuICAgICAgICAgICAgICAgICAgICByZWFjdGlvbkRhdGEucGFyZW50SUQgPSBjb250YWluZXJSZWFjdGlvbi5wYXJlbnRJRDtcbiAgICAgICAgICAgICAgICAgICAgcmVhY3Rpb25EYXRhLmNvbnRlbnQgPSBjb250YWluZXJSZWFjdGlvbi5jb250ZW50O1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGRhdGEgPSB7XG4gICAgICAgICAgICB0YWc6IHtcbiAgICAgICAgICAgICAgICBib2R5OiByZWFjdGlvbkRhdGEudGV4dCxcbiAgICAgICAgICAgICAgICBpZDogcmVhY3Rpb25EYXRhLmlkXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaGFzaDogY29udGFpbmVyRGF0YS5oYXNoLFxuICAgICAgICAgICAgdXNlcl9pZDogdXNlckluZm8udXNlcl9pZCxcbiAgICAgICAgICAgIGFudF90b2tlbjogdXNlckluZm8uYW50X3Rva2VuLFxuICAgICAgICAgICAgcGFnZV9pZDogcGFnZURhdGEucGFnZUlkLFxuICAgICAgICAgICAgZ3JvdXBfaWQ6IHBhZ2VEYXRhLmdyb3VwSWQsXG4gICAgICAgICAgICBjb250YWluZXJfa2luZDogY29udGFpbmVyRGF0YS50eXBlLCAvLyAncGFnZScsICd0ZXh0JywgJ21lZGlhJywgJ2ltZydcbiAgICAgICAgICAgIGNvbnRlbnRfbm9kZV9kYXRhOiB7XG4gICAgICAgICAgICAgICAgYm9keTogJycsIC8vIFRPRE86IGRvIHdlIG5lZWQgdGhpcyBmb3IgKzFzPyBsb29rcyBsaWtlIG9ubHkgdGhlIGlkIGZpZWxkIGlzIHVzZWQsIGlmIG9uZSBpcyBzZXRcbiAgICAgICAgICAgICAgICBraW5kOiBjb250ZW50Tm9kZURhdGFLaW5kKGNvbnRhaW5lckRhdGEudHlwZSksXG4gICAgICAgICAgICAgICAgaXRlbV90eXBlOiAnJyAvLyBUT0RPOiBsb29rcyB1bnVzZWQgYnV0IFRhZ0hhbmRsZXIgYmxvd3MgdXAgd2l0aG91dCBpdFxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBpZiAocmVhY3Rpb25EYXRhLmNvbnRlbnQpIHtcbiAgICAgICAgICAgIGRhdGEuY29udGVudF9ub2RlX2RhdGEuaWQgPSByZWFjdGlvbkRhdGEuY29udGVudC5pZDtcbiAgICAgICAgICAgIGRhdGEuY29udGVudF9ub2RlX2RhdGEubG9jYXRpb24gPSByZWFjdGlvbkRhdGEuY29udGVudC5sb2NhdGlvbjtcbiAgICAgICAgfVxuICAgICAgICAvLyBUT0RPOiBzaG91bGQgd2UgYmFpbCBpZiB0aGVyZSdzIG5vIHBhcmVudCBJRD8gSXQncyBub3QgcmVhbGx5IGEgKzEgd2l0aG91dCBvbmUuXG4gICAgICAgIGlmIChyZWFjdGlvbkRhdGEucGFyZW50SUQpIHtcbiAgICAgICAgICAgIGRhdGEudGFnLnBhcmVudF9pZCA9IHJlYWN0aW9uRGF0YS5wYXJlbnRJRDtcbiAgICAgICAgfVxuICAgICAgICBnZXRKU09OUChVUkxzLmNyZWF0ZVJlYWN0aW9uVXJsKCksIGRhdGEsIHBsdXNPbmVTdWNjZXNzKHJlYWN0aW9uRGF0YSwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIHN1Y2Nlc3MpLCBlcnJvcik7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIHBvc3RDb21tZW50KGNvbW1lbnQsIHJlYWN0aW9uRGF0YSwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MsIHN1Y2Nlc3MsIGVycm9yKSB7XG4gICAgLy8gVE9ETzogcmVmYWN0b3IgdGhlIHBvc3QgZnVuY3Rpb25zIHRvIGVsaW1pbmF0ZSBhbGwgdGhlIGNvcGllZCBjb2RlXG4gICAgVXNlci5mZXRjaFVzZXIoZ3JvdXBTZXR0aW5ncywgZnVuY3Rpb24odXNlckluZm8pIHtcbiAgICAgICAgLy8gVE9ETyBleHRyYWN0IHRoZSBzaGFwZSBvZiB0aGlzIGRhdGEgYW5kIHBvc3NpYmx5IHRoZSB3aG9sZSBBUEkgY2FsbFxuICAgICAgICBpZiAoIXJlYWN0aW9uRGF0YS5jb250ZW50KSB7XG4gICAgICAgICAgICAvLyBUaGlzIGlzIGEgc3VtbWFyeSByZWFjdGlvbi4gU2VlIGlmIHdlIGhhdmUgYW55IGNvbnRhaW5lciBkYXRhIHRoYXQgd2UgY2FuIGxpbmsgdG8gaXQuXG4gICAgICAgICAgICB2YXIgY29udGFpbmVyUmVhY3Rpb25zID0gY29udGFpbmVyRGF0YS5yZWFjdGlvbnM7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvbnRhaW5lclJlYWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBjb250YWluZXJSZWFjdGlvbiA9IGNvbnRhaW5lclJlYWN0aW9uc1tpXTtcbiAgICAgICAgICAgICAgICBpZiAoY29udGFpbmVyUmVhY3Rpb24uaWQgPT09IHJlYWN0aW9uRGF0YS5pZCkge1xuICAgICAgICAgICAgICAgICAgICByZWFjdGlvbkRhdGEucGFyZW50SUQgPSBjb250YWluZXJSZWFjdGlvbi5wYXJlbnRJRDtcbiAgICAgICAgICAgICAgICAgICAgcmVhY3Rpb25EYXRhLmNvbnRlbnQgPSBjb250YWluZXJSZWFjdGlvbi5jb250ZW50O1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGRhdGEgPSB7XG4gICAgICAgICAgICBjb21tZW50OiBjb21tZW50LFxuICAgICAgICAgICAgdGFnOiB7XG4gICAgICAgICAgICAgICAgcGFyZW50X2lkOiByZWFjdGlvbkRhdGEucGFyZW50SURcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB1c2VyX2lkOiB1c2VySW5mby51c2VyX2lkLFxuICAgICAgICAgICAgYW50X3Rva2VuOiB1c2VySW5mby5hbnRfdG9rZW4sXG4gICAgICAgICAgICBwYWdlX2lkOiBwYWdlRGF0YS5wYWdlSWQsXG4gICAgICAgICAgICBncm91cF9pZDogcGFnZURhdGEuZ3JvdXBJZFxuICAgICAgICB9O1xuICAgICAgICBnZXRKU09OUChVUkxzLmNyZWF0ZUNvbW1lbnRVcmwoKSwgZGF0YSwgY29tbWVudFN1Y2Nlc3MocmVhY3Rpb25EYXRhLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgc3VjY2VzcyksIGVycm9yKTtcbiAgICB9KTtcbn1cblxuLy8gVE9ETzogV2UgbmVlZCB0byByZXZpZXcgdGhlIEFQSSBzbyB0aGF0IGl0IHJldHVybnMvYWNjZXB0cyBhIHVuaWZvcm0gc2V0IG9mIHZhbHVlcy5cbmZ1bmN0aW9uIGNvbnRlbnROb2RlRGF0YUtpbmQodHlwZSkge1xuICAgIGlmICh0eXBlID09PSAnaW1hZ2UnKSB7XG4gICAgICAgIHJldHVybiAnaW1nJztcbiAgICB9XG4gICAgcmV0dXJuIHR5cGU7XG59XG5cbmZ1bmN0aW9uIGNvbW1lbnRTdWNjZXNzKHJlYWN0aW9uRGF0YSwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGNhbGxiYWNrKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgIC8vIFRPRE86IGluIHRoZSBjYXNlIHRoYXQgc29tZW9uZSByZWFjdHMgYW5kIHRoZW4gaW1tZWRpYXRlbHkgY29tbWVudHMsIHdlIGhhdmUgYSByYWNlIGNvbmRpdGlvbiB3aGVyZSB0aGVcbiAgICAgICAgLy8gICAgICAgY29tbWVudCByZXNwb25zZSBjb3VsZCBjb21lIGJhY2sgYmVmb3JlIHRoZSByZWFjdGlvbi4gd2UgbmVlZCB0bzpcbiAgICAgICAgLy8gICAgICAgMS4gTWFrZSBzdXJlIHRoZSBzZXJ2ZXIgb25seSBjcmVhdGVzIGEgc2luZ2xlIHJlYWN0aW9uIGluIHRoaXMgY2FzZSAobm90IGEgSFVHRSBkZWFsIGlmIGl0IG1ha2VzIHR3bylcbiAgICAgICAgLy8gICAgICAgMi4gUmVzb2x2ZSB0aGUgdHdvIHJlc3BvbnNlcyB0aGF0IGJvdGggdGhlb3JldGljYWxseSBjb21lIGJhY2sgd2l0aCB0aGUgc2FtZSByZWFjdGlvbiBkYXRhIGF0IHRoZSBzYW1lXG4gICAgICAgIC8vICAgICAgICAgIHRpbWUuIE1ha2Ugc3VyZSB3ZSBkb24ndCBlbmQgdXAgd2l0aCB0d28gY29waWVzIG9mIHRoZSBzYW1lIGRhdGEgaW4gdGhlIG1vZGVsLlxuICAgICAgICB2YXIgcmVhY3Rpb25DcmVhdGVkID0gIXJlc3BvbnNlLmV4aXN0aW5nO1xuICAgICAgICBpZiAocmVhY3Rpb25DcmVhdGVkKSB7XG4gICAgICAgICAgICBpZiAoIXJlYWN0aW9uRGF0YS5jb21tZW50Q291bnQpIHtcbiAgICAgICAgICAgICAgICByZWFjdGlvbkRhdGEuY29tbWVudENvdW50ID0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlYWN0aW9uRGF0YS5jb21tZW50Q291bnQgKz0gMTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIFRPRE86IGRvIHdlIGV2ZXIgZ2V0IGEgcmVzcG9uc2UgdG8gYSBuZXcgcmVhY3Rpb24gdGVsbGluZyB1cyB0aGF0IGl0J3MgYWxyZWFkeSBleGlzdGluZz8gSWYgc28sIGNvdWxkIHRoZSBjb3VudCBuZWVkIHRvIGJlIHVwZGF0ZWQ/XG4gICAgICAgIH1cbiAgICAgICAgY2FsbGJhY2socmVhY3Rpb25DcmVhdGVkKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHBsdXNPbmVTdWNjZXNzKHJlYWN0aW9uRGF0YSwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGNhbGxiYWNrKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgIC8vIFRPRE86IERvIHdlIGNhcmUgYWJvdXQgcmVzcG9uc2UuZXhpc3RpbmcgYW55bW9yZSAod2UgdXNlZCB0byBzaG93IGRpZmZlcmVudCBmZWVkYmFjayBpbiB0aGUgVUksIGJ1dCBubyBsb25nZXIuLi4pXG4gICAgICAgIHZhciByZWFjdGlvbkNyZWF0ZWQgPSAhcmVzcG9uc2UuZXhpc3Rpbmc7XG4gICAgICAgIGlmIChyZWFjdGlvbkNyZWF0ZWQpIHtcbiAgICAgICAgICAgIC8vIFRPRE86IHdlIHNob3VsZCBnZXQgYmFjayBhIHJlc3BvbnNlIHdpdGggZGF0YSBpbiB0aGUgXCJuZXcgZm9ybWF0XCIgYW5kIHVwZGF0ZSB0aGUgbW9kZWwgZnJvbSB0aGUgcmVzcG9uc2VcbiAgICAgICAgICAgIHJlYWN0aW9uRGF0YS5jb3VudCA9IHJlYWN0aW9uRGF0YS5jb3VudCArIDE7XG4gICAgICAgICAgICBjb250YWluZXJEYXRhLnJlYWN0aW9uVG90YWwgPSBjb250YWluZXJEYXRhLnJlYWN0aW9uVG90YWwgKyAxO1xuICAgICAgICAgICAgcGFnZURhdGEuc3VtbWFyeVRvdGFsID0gcGFnZURhdGEuc3VtbWFyeVRvdGFsICsgMTtcbiAgICAgICAgICAgIGNvbnRhaW5lckRhdGEucmVhY3Rpb25zLnNvcnQoZnVuY3Rpb24oYSwgYikge1xuICAgICAgICAgICAgICAgIHJldHVybiBiLmNvdW50IC0gYS5jb3VudDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGNhbGxiYWNrKHJlYWN0aW9uRGF0YSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBuZXdSZWFjdGlvblN1Y2Nlc3MoY29udGVudExvY2F0aW9uLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgY2FsbGJhY2spIHtcbiAgICByZXR1cm4gZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgLy8gVE9ETzogQ2FuIHJlc3BvbnNlLmV4aXN0aW5nIGV2ZXIgY29tZSBiYWNrIHRydWUgZm9yIGEgJ25ldycgcmVhY3Rpb24/IFNob3VsZCB3ZSBiZWhhdmUgYW55IGRpZmZlcmVudGx5IGlmIGl0IGRvZXM/XG4gICAgICAgIHZhciByZWFjdGlvbiA9IHJlYWN0aW9uRnJvbVJlc3BvbnNlKHJlc3BvbnNlLCBjb250ZW50TG9jYXRpb24pO1xuICAgICAgICBjYWxsYmFjayhyZWFjdGlvbik7XG4gICAgfTtcbn1cblxuZnVuY3Rpb24gcmVhY3Rpb25Gcm9tUmVzcG9uc2UocmVzcG9uc2UsIGNvbnRlbnRMb2NhdGlvbikge1xuICAgIC8vIFRPRE86IHRoZSBzZXJ2ZXIgc2hvdWxkIGdpdmUgdXMgYmFjayBhIHJlYWN0aW9uIG1hdGNoaW5nIHRoZSBuZXcgQVBJIGZvcm1hdC5cbiAgICAvLyAgICAgICB3ZSdyZSBqdXN0IGZha2luZyBpdCBvdXQgZm9yIG5vdzsgdGhpcyBjb2RlIGlzIHRlbXBvcmFyeVxuICAgIHZhciByZWFjdGlvbiA9IHtcbiAgICAgICAgdGV4dDogcmVzcG9uc2UuaW50ZXJhY3Rpb24uaW50ZXJhY3Rpb25fbm9kZS5ib2R5LFxuICAgICAgICBpZDogcmVzcG9uc2UuaW50ZXJhY3Rpb24uaW50ZXJhY3Rpb25fbm9kZS5pZCxcbiAgICAgICAgY291bnQ6IDEsXG4gICAgICAgIHBhcmVudElEOiByZXNwb25zZS5pbnRlcmFjdGlvbi5pZCxcbiAgICAgICAgYXBwcm92ZWQ6IHJlc3BvbnNlLmFwcHJvdmVkID09PSB1bmRlZmluZWQgfHwgcmVzcG9uc2UuYXBwcm92ZWRcbiAgICB9O1xuICAgIGlmIChyZXNwb25zZS5jb250ZW50X25vZGUpIHtcbiAgICAgICAgcmVhY3Rpb24uY29udGVudCA9IHtcbiAgICAgICAgICAgIGlkOiByZXNwb25zZS5jb250ZW50X25vZGUuaWQsXG4gICAgICAgICAgICBraW5kOiByZXNwb25zZS5jb250ZW50X25vZGUua2luZCxcbiAgICAgICAgICAgIGJvZHk6IHJlc3BvbnNlLmNvbnRlbnRfbm9kZS5ib2R5XG4gICAgICAgIH07XG4gICAgICAgIGlmIChyZXNwb25zZS5jb250ZW50X25vZGUubG9jYXRpb24pIHtcbiAgICAgICAgICAgIHJlYWN0aW9uLmNvbnRlbnQubG9jYXRpb24gPSByZXNwb25zZS5jb250ZW50X25vZGUubG9jYXRpb247XG4gICAgICAgIH0gZWxzZSBpZiAoY29udGVudExvY2F0aW9uKSB7XG4gICAgICAgICAgICAvLyBUT0RPOiBlbnN1cmUgdGhhdCB0aGUgQVBJIGFsd2F5cyByZXR1cm5zIGEgbG9jYXRpb24gYW5kIHJlbW92ZSB0aGUgXCJjb250ZW50TG9jYXRpb25cIiB0aGF0J3MgYmVpbmcgcGFzc2VkIGFyb3VuZC5cbiAgICAgICAgICAgIC8vIEZvciBub3csIGp1c3QgcGF0Y2ggdGhlIHJlc3BvbnNlIHdpdGggdGhlIGRhdGEgd2Uga25vdyB3ZSBzZW50IG92ZXIuXG4gICAgICAgICAgICByZWFjdGlvbi5jb250ZW50LmxvY2F0aW9uID0gY29udGVudExvY2F0aW9uO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZWFjdGlvbjtcbn1cblxuZnVuY3Rpb24gZ2V0Q29tbWVudHMocmVhY3Rpb24sIGdyb3VwU2V0dGluZ3MsIHN1Y2Nlc3NDYWxsYmFjaywgZXJyb3JDYWxsYmFjaykge1xuICAgIFVzZXIuZmV0Y2hVc2VyKGdyb3VwU2V0dGluZ3MsIGZ1bmN0aW9uKHVzZXJJbmZvKSB7XG4gICAgICAgIHZhciBkYXRhID0ge1xuICAgICAgICAgICAgcmVhY3Rpb25faWQ6IHJlYWN0aW9uLnBhcmVudElELFxuICAgICAgICAgICAgdXNlcl9pZDogdXNlckluZm8udXNlcl9pZCxcbiAgICAgICAgICAgIGFudF90b2tlbjogdXNlckluZm8uYW50X3Rva2VuXG4gICAgICAgIH07XG4gICAgICAgIGdldEpTT05QKFVSTHMuZmV0Y2hDb21tZW50VXJsKCksIGRhdGEsIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICBzdWNjZXNzQ2FsbGJhY2soY29tbWVudHNGcm9tUmVzcG9uc2UocmVzcG9uc2UpKTtcbiAgICAgICAgfSwgZXJyb3JDYWxsYmFjayk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGZldGNoTG9jYXRpb25EZXRhaWxzKHJlYWN0aW9uTG9jYXRpb25EYXRhLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncywgc3VjY2Vzc0NhbGxiYWNrLCBlcnJvckNhbGxiYWNrKSB7XG4gICAgdmFyIGNvbnRlbnRJRHMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhyZWFjdGlvbkxvY2F0aW9uRGF0YSk7XG4gICAgVXNlci5mZXRjaFVzZXIoZ3JvdXBTZXR0aW5ncywgZnVuY3Rpb24odXNlckluZm8pIHtcbiAgICAgICAgdmFyIGRhdGEgPSB7XG4gICAgICAgICAgICB1c2VyX2lkOiB1c2VySW5mby51c2VyX2lkLFxuICAgICAgICAgICAgYW50X3Rva2VuOiB1c2VySW5mby5hbnRfdG9rZW4sXG4gICAgICAgICAgICBjb250ZW50X2lkczogY29udGVudElEc1xuICAgICAgICB9O1xuICAgICAgICBnZXRKU09OUChVUkxzLmZldGNoQ29udGVudEJvZGllc1VybCgpLCBkYXRhLCBzdWNjZXNzQ2FsbGJhY2ssIGVycm9yQ2FsbGJhY2spO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBjb21tZW50c0Zyb21SZXNwb25zZShqc29uQ29tbWVudHMpIHtcbiAgICB2YXIgY29tbWVudHMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGpzb25Db21tZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIganNvbkNvbW1lbnQgPSBqc29uQ29tbWVudHNbaV07XG4gICAgICAgIHZhciBjb21tZW50ID0ge1xuICAgICAgICAgICAgdGV4dDoganNvbkNvbW1lbnQudGV4dCxcbiAgICAgICAgICAgIGlkOiBqc29uQ29tbWVudC5pZCwgLy8gVE9ETzogd2UgcHJvYmFibHkgb25seSBuZWVkIHRoaXMgZm9yICsxJ2luZyBjb21tZW50c1xuICAgICAgICAgICAgY29udGVudElEOiBqc29uQ29tbWVudC5jb250ZW50SUQsIC8vIFRPRE86IERvIHdlIHJlYWxseSBuZWVkIHRoaXM/XG4gICAgICAgICAgICB1c2VyOiBVc2VyLmZyb21Db21tZW50SlNPTihqc29uQ29tbWVudC51c2VyLCBqc29uQ29tbWVudC5zb2NpYWxfdXNlcilcbiAgICAgICAgfTtcbiAgICAgICAgY29tbWVudHMucHVzaChjb21tZW50KTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbW1lbnRzO1xufVxuXG5mdW5jdGlvbiBwb3N0U2hhcmVSZWFjdGlvbihyZWFjdGlvbkRhdGEsIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzLCBzdWNjZXNzLCBmYWlsdXJlKSB7XG4gICAgVXNlci5mZXRjaFVzZXIoZ3JvdXBTZXR0aW5ncywgZnVuY3Rpb24odXNlckluZm8pIHtcbiAgICAgICAgdmFyIGNvbnRlbnREYXRhID0gcmVhY3Rpb25EYXRhLmNvbnRlbnQ7XG4gICAgICAgIHZhciBkYXRhID0ge1xuICAgICAgICAgICAgdGFnOiB7IC8vIFRPRE86IHdoeSBkb2VzIHRoZSBTaGFyZUhhbmRsZXIgY3JlYXRlIGEgcmVhY3Rpb24gaWYgaXQgZG9lc24ndCBleGlzdD8gSG93IGNhbiB5b3Ugc2hhcmUgYSByZWFjdGlvbiB0aGF0IGhhc24ndCBoYXBwZW5lZD9cbiAgICAgICAgICAgICAgICBpZDogcmVhY3Rpb25EYXRhLmlkLFxuICAgICAgICAgICAgICAgIGJvZHk6IHJlYWN0aW9uRGF0YS50ZXh0XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaGFzaDogY29udGFpbmVyRGF0YS5oYXNoLFxuICAgICAgICAgICAgY29udGFpbmVyX2tpbmQ6IGNvbnRhaW5lckRhdGEudHlwZSxcbiAgICAgICAgICAgIGNvbnRlbnRfbm9kZV9kYXRhOiB7IC8vIFRPRE86IHdoeSBkb2VzIHRoZSBTaGFyZUhhbmRsZXIgY3JlYXRlIGEgY29udGVudCBpZiBpdCBkb2Vzbid0IGV4aXN0PyBIb3cgY2FuIHlvdSBzaGFyZSBhIHJlYWN0aW9uIHRoYXQgaGFzbid0IGhhcHBlbmVkP1xuICAgICAgICAgICAgICAgIGlkOiBjb250ZW50RGF0YS5pZCxcbiAgICAgICAgICAgICAgICBib2R5OiBjb250ZW50RGF0YS50ZXh0LFxuICAgICAgICAgICAgICAgIGxvY2F0aW9uOiBjb250ZW50RGF0YS5sb2NhdGlvbixcbiAgICAgICAgICAgICAgICBraW5kOiBjb250ZW50Tm9kZURhdGFLaW5kKGNvbnRhaW5lckRhdGEudHlwZSlcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB1c2VyX2lkOiB1c2VySW5mby51c2VyX2lkLFxuICAgICAgICAgICAgYW50X3Rva2VuOiB1c2VySW5mby5hbnRfdG9rZW4sXG4gICAgICAgICAgICBncm91cF9pZDogcGFnZURhdGEuZ3JvdXBJZCxcbiAgICAgICAgICAgIHBhZ2VfaWQ6IHBhZ2VEYXRhLnBhZ2VJZCxcbiAgICAgICAgICAgIHJlZmVycmluZ19pbnRfaWQ6IHJlYWN0aW9uRGF0YS5wYXJlbnRJRFxuICAgICAgICB9O1xuICAgICAgICBnZXRKU09OUChVUkxzLnNoYXJlUmVhY3Rpb25VcmwoKSwgZGF0YSwgc3VjY2VzcywgZmFpbHVyZSk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGdldEpTT05QKHVybCwgZGF0YSwgc3VjY2VzcywgZXJyb3IpIHtcbiAgICB2YXIgYmFzZVVybCA9IFVSTHMuYXBwU2VydmVyVXJsKCk7XG4gICAgZG9HZXRKU09OUChiYXNlVXJsLCB1cmwsIGRhdGEsIHN1Y2Nlc3MsIGVycm9yKTtcbn1cblxuZnVuY3Rpb24gcG9zdEV2ZW50KGV2ZW50KSB7XG4gICAgdmFyIGJhc2VVcmwgPSBVUkxzLmV2ZW50c1NlcnZlclVybCgpO1xuICAgIGRvR2V0SlNPTlAoYmFzZVVybCwgVVJMcy5ldmVudFVybCgpLCBldmVudCwgZnVuY3Rpb24oKSB7IC8qc3VjY2VzcyovIH0sIGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgICAgIC8vIFRPRE86IGVycm9yIGhhbmRsaW5nXG4gICAgICAgIExvZ2dpbmcuZGVidWdNZXNzYWdlKCdBbiBlcnJvciBvY2N1cnJlZCBwb3N0aW5nIGV2ZW50OiAnLCBlcnJvcik7XG4gICAgfSk7XG59XG5cbi8vIElzc3VlcyBhIEpTT05QIHJlcXVlc3QgdG8gYSBnaXZlbiBzZXJ2ZXIuIFRvIHNlbmQgYSByZXF1ZXN0IHRvIHRoZSBhcHBsaWNhdGlvbiBzZXJ2ZXIsIHVzZSBnZXRKU09OUCBpbnN0ZWFkLlxuZnVuY3Rpb24gZG9HZXRKU09OUChiYXNlVXJsLCB1cmwsIHBhcmFtcywgc3VjY2VzcywgZXJyb3IpIHtcbiAgICBKU09OUENsaWVudC5kb0dldEpTT05QKGJhc2VVcmwsIHVybCwgcGFyYW1zLCBzdWNjZXNzLCBlcnJvcik7XG59XG5cbmZ1bmN0aW9uIHBvc3RUcmFja2luZ0V2ZW50KGV2ZW50KSB7XG4gICAgdmFyIGJhc2VVcmwgPSBVUkxzLmV2ZW50c1NlcnZlclVybCgpO1xuICAgIHZhciB0cmFja2luZ1VybCA9IGJhc2VVcmwgKyBVUkxzLmV2ZW50VXJsKCkgKyAnL2V2ZW50LmdpZic7XG4gICAgaWYgKGV2ZW50KSB7XG4gICAgICAgIHRyYWNraW5nVXJsICs9ICc/anNvbj0nICsgZW5jb2RlVVJJKEpTT05VdGlscy5zdHJpbmdpZnkoZXZlbnQpKTtcbiAgICB9XG4gICAgdmFyIGltYWdlVGFnID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW1nJyk7XG4gICAgaW1hZ2VUYWcuc2V0QXR0cmlidXRlKCdoZWlnaHQnLCAxKTtcbiAgICBpbWFnZVRhZy5zZXRBdHRyaWJ1dGUoJ3dpZHRoJywgMSk7XG4gICAgaW1hZ2VUYWcuc2V0QXR0cmlidXRlKCdzcmMnLCB0cmFja2luZ1VybCk7XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2JvZHknKVswXS5hcHBlbmRDaGlsZChpbWFnZVRhZyk7XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBnZXRKU09OUDogZ2V0SlNPTlAsXG4gICAgcG9zdFBsdXNPbmU6IHBvc3RQbHVzT25lLFxuICAgIHBvc3ROZXdSZWFjdGlvbjogcG9zdE5ld1JlYWN0aW9uLFxuICAgIHBvc3RDb21tZW50OiBwb3N0Q29tbWVudCxcbiAgICBnZXRDb21tZW50czogZ2V0Q29tbWVudHMsXG4gICAgcG9zdFNoYXJlUmVhY3Rpb246IHBvc3RTaGFyZVJlYWN0aW9uLFxuICAgIGZldGNoTG9jYXRpb25EZXRhaWxzOiBmZXRjaExvY2F0aW9uRGV0YWlscyxcbiAgICBwb3N0RXZlbnQ6IHBvc3RFdmVudCxcbiAgICBwb3N0VHJhY2tpbmdFdmVudDogcG9zdFRyYWNraW5nRXZlbnRcbn07IiwidmFyIFVSTENvbnN0YW50cyA9IHJlcXVpcmUoJy4vdXJsLWNvbnN0YW50cycpO1xudmFyIFVSTFBhcmFtcyA9IHJlcXVpcmUoJy4vdXJsLXBhcmFtcycpO1xuXG5mdW5jdGlvbiBjb21wdXRlQ3VycmVudFNjcmlwdFNyYygpIHtcbiAgICBpZiAoZG9jdW1lbnQuY3VycmVudFNjcmlwdCkge1xuICAgICAgICByZXR1cm4gZG9jdW1lbnQuY3VycmVudFNjcmlwdC5zcmM7XG4gICAgfVxuICAgIC8vIElFIGZhbGxiYWNrLi4uXG4gICAgdmFyIHNjcmlwdHMgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnc2NyaXB0Jyk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzY3JpcHRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBzY3JpcHQgPSBzY3JpcHRzW2ldO1xuICAgICAgICBpZiAoc2NyaXB0Lmhhc0F0dHJpYnV0ZSgnc3JjJykpIHtcbiAgICAgICAgICAgIHZhciBzY3JpcHRTcmMgPSBzY3JpcHQuZ2V0QXR0cmlidXRlKCdzcmMnKTtcbiAgICAgICAgICAgIHZhciBhbnRlbm5hU2NyaXB0cyA9IFsgJ2FudGVubmEuanMnLCAnYW50ZW5uYS5taW4uanMnLCAnZW5nYWdlLmpzJywgJ2VuZ2FnZV9mdWxsLmpzJyBdO1xuICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBhbnRlbm5hU2NyaXB0cy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgIGlmIChzY3JpcHRTcmMuaW5kZXhPZihhbnRlbm5hU2NyaXB0c1tqXSkgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzY3JpcHRTcmM7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuXG52YXIgY3VycmVudFNjcmlwdFNyYyA9IGNvbXB1dGVDdXJyZW50U2NyaXB0U3JjKCkgfHwgJyc7XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBvZmZsaW5lOiBjdXJyZW50U2NyaXB0U3JjLmluZGV4T2YoVVJMQ29uc3RhbnRzLkRFVkVMT1BNRU5UKSAhPT0gLTEgfHwgY3VycmVudFNjcmlwdFNyYy5pbmRleE9mKFVSTENvbnN0YW50cy5URVNUKSAhPT0gLTEsXG4gICAgdGVzdDogY3VycmVudFNjcmlwdFNyYy5pbmRleE9mKFVSTENvbnN0YW50cy5URVNUKSAhPT0gLTEsXG4gICAgZGVidWc6IFVSTFBhcmFtcy5nZXRVcmxQYXJhbSgnYW50ZW5uYURlYnVnJykgPT09ICd0cnVlJ1xufTsiLCJcbnZhciBpc1RvdWNoQnJvd3NlcjtcbnZhciBpc01vYmlsZURldmljZTtcblxuZnVuY3Rpb24gc3VwcG9ydHNUb3VjaCgpIHtcbiAgICBpZiAoaXNUb3VjaEJyb3dzZXIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAvL2lzVG91Y2hCcm93c2VyID0gKG5hdmlnYXRvci5tc01heFRvdWNoUG9pbnRzIHx8IFwib250b3VjaHN0YXJ0XCIgaW4gd2luZG93KSAmJiAoKHdpbmRvdy5tYXRjaE1lZGlhKFwib25seSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KVwiKSkubWF0Y2hlcyk7XG4gICAgICAgIGlzVG91Y2hCcm93c2VyID0gXCJvbnRvdWNoc3RhcnRcIiBpbiB3aW5kb3c7XG4gICAgfVxuICAgIHJldHVybiBpc1RvdWNoQnJvd3Nlcjtcbn1cblxuZnVuY3Rpb24gaXNNb2JpbGUoKSB7XG4gICAgaWYgKGlzTW9iaWxlRGV2aWNlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgaXNNb2JpbGVEZXZpY2UgPSBzdXBwb3J0c1RvdWNoKCkgJiZcbiAgICAgICAgICAgICgod2luZG93Lm1hdGNoTWVkaWEoXCJzY3JlZW4gYW5kIChtYXgtZGV2aWNlLXdpZHRoOiA0ODBweCkgYW5kIChvcmllbnRhdGlvbjogcG9ydHJhaXQpXCIpKS5tYXRjaGVzIHx8XG4gICAgICAgICAgICAod2luZG93Lm1hdGNoTWVkaWEoXCJzY3JlZW4gYW5kIChtYXgtZGV2aWNlLXdpZHRoOiA3NjhweCkgYW5kIChvcmllbnRhdGlvbjogbGFuZHNjYXBlKVwiKSkubWF0Y2hlcyk7XG4gICAgfVxuICAgIHJldHVybiBpc01vYmlsZURldmljZTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgc3VwcG9ydHNUb3VjaDogc3VwcG9ydHNUb3VjaCxcbiAgICBpc01vYmlsZTogaXNNb2JpbGVcbn07IiwiXG4vLyBSZS11c2FibGUgc3VwcG9ydCBmb3IgbWFuYWdpbmcgYSBjb2xsZWN0aW9uIG9mIGNhbGxiYWNrIGZ1bmN0aW9ucy5cblxudmFyIGFudHVpZCA9IDA7IC8vIFwiZ2xvYmFsbHlcIiB1bmlxdWUgSUQgdGhhdCB3ZSB1c2UgdG8gdGFnIGNhbGxiYWNrIGZ1bmN0aW9ucyBmb3IgbGF0ZXIgcmV0cmlldmFsLiAoVGhpcyBpcyBob3cgXCJvZmZcIiB3b3Jrcy4pXG5cbmZ1bmN0aW9uIGNyZWF0ZUNhbGxiYWNrcygpIHtcblxuICAgIHZhciBjYWxsYmFja3MgPSB7fTtcblxuICAgIGZ1bmN0aW9uIGFkZENhbGxiYWNrKGNhbGxiYWNrKSB7XG4gICAgICAgIGlmIChjYWxsYmFjay5hbnR1aWQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY2FsbGJhY2suYW50dWlkID0gYW50dWlkKys7XG4gICAgICAgIH1cbiAgICAgICAgY2FsbGJhY2tzW2NhbGxiYWNrLmFudHVpZF0gPSBjYWxsYmFjaztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByZW1vdmVDYWxsYmFjayhjYWxsYmFjaykge1xuICAgICAgICBpZiAoY2FsbGJhY2suYW50dWlkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGRlbGV0ZSBjYWxsYmFja3NbY2FsbGJhY2suYW50dWlkXTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldENhbGxiYWNrcygpIHtcbiAgICAgICAgdmFyIGFsbENhbGxiYWNrcyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBrZXkgaW4gY2FsbGJhY2tzKSB7XG4gICAgICAgICAgICBpZiAoY2FsbGJhY2tzLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgICBhbGxDYWxsYmFja3MucHVzaChjYWxsYmFja3Nba2V5XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGFsbENhbGxiYWNrcztcbiAgICB9XG5cbiAgICAvLyBDb252ZW5pZW5jZSBmdW5jdGlvbiB0aGF0IGludm9rZXMgYWxsIGNhbGxiYWNrcyB3aXRoIG5vIHBhcmFtZXRlcnMuIEFueSBjYWxsYmFja3MgdGhhdCBuZWVkIHBhcmFtcyBjYW4gYmUgY2FsbGVkXG4gICAgLy8gYnkgY2xpZW50cyB1c2luZyBnZXRDYWxsYmFja3MoKVxuICAgIGZ1bmN0aW9uIGludm9rZUFsbCgpIHtcbiAgICAgICAgdmFyIGNhbGxiYWNrcyA9IGdldENhbGxiYWNrcygpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNhbGxiYWNrcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY2FsbGJhY2tzW2ldKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpc0VtcHR5KCkge1xuICAgICAgICByZXR1cm4gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMoY2FsbGJhY2tzKS5sZW5ndGggPT09IDA7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdGVhcmRvd24oKSB7XG4gICAgICAgIGNhbGxiYWNrcyA9IHt9O1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIGFkZDogYWRkQ2FsbGJhY2ssXG4gICAgICAgIHJlbW92ZTogcmVtb3ZlQ2FsbGJhY2ssXG4gICAgICAgIGdldDogZ2V0Q2FsbGJhY2tzLFxuICAgICAgICBpc0VtcHR5OiBpc0VtcHR5LFxuICAgICAgICBpbnZva2VBbGw6IGludm9rZUFsbCxcbiAgICAgICAgdGVhcmRvd246IHRlYXJkb3duXG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlOiBjcmVhdGVDYWxsYmFja3Ncbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgTUQ1ID0gcmVxdWlyZSgnLi9tZDUnKTtcblxuZnVuY3Rpb24gZ2V0Q2xlYW5UZXh0KCRlbGVtZW50KSB7XG4gICAgdmFyICRjbG9uZSA9ICRlbGVtZW50LmNsb25lKCk7XG4gICAgLy8gUmVtb3ZlIGFueSBlbGVtZW50cyB0aGF0IHdlIGRvbid0IHdhbnQgaW5jbHVkZWQgaW4gdGhlIHRleHQgY2FsY3VsYXRpb25cbiAgICAkY2xvbmUuZmluZCgnaWZyYW1lLCBpbWcsIHNjcmlwdCwgdmlkZW8sIC5hbnRlbm5hLCAubm8tYW50JykucmVtb3ZlKCkuZW5kKCk7XG4gICAgLy8gVGhlbiBtYW51YWxseSBjb252ZXJ0IGFueSA8YnI+IHRhZ3MgaW50byBzcGFjZXMgKG90aGVyd2lzZSwgd29yZHMgd2lsbCBnZXQgYXBwZW5kZWQgYnkgdGhlIHRleHQoKSBjYWxsKVxuICAgIHZhciBodG1sID0gJGNsb25lLmh0bWwoKS5yZXBsYWNlKC88XFxTYnJcXFNcXC8/Pi9naSwgJyAnKTtcbiAgICAvLyBQdXQgdGhlIEhUTUwgYmFjayBpbnRvIGEgZGl2IGFuZCBjYWxsIHRleHQoKSwgd2hpY2ggZG9lcyBtb3N0IG9mIHRoZSBoZWF2eSBsaWZ0aW5nXG4gICAgdmFyIHRleHQgPSAkKCc8ZGl2PicgKyBodG1sICsgJzwvZGl2PicpLnRleHQoKS50b0xvd2VyQ2FzZSgpLnRyaW0oKTtcbiAgICB0ZXh0ID0gdGV4dC5yZXBsYWNlKC9bXFxuXFxyXFx0XS9naSwgJyAnKTsgLy8gUmVwbGFjZSBhbnkgbmV3bGluZXMvdGFicyB3aXRoIHNwYWNlc1xuICAgIHJldHVybiB0ZXh0O1xufVxuXG5mdW5jdGlvbiBoYXNoVGV4dChlbGVtZW50LCBzdWZmaXgpIHtcbiAgICB2YXIgdGV4dCA9IGdldENsZWFuVGV4dChlbGVtZW50KTtcbiAgICBpZiAodGV4dCkge1xuICAgICAgICB2YXIgaGFzaFRleHQgPSBcInJkci10ZXh0LVwiICsgdGV4dDtcbiAgICAgICAgaWYgKHN1ZmZpeCAhPT0gdW5kZWZpbmVkKSB7IC8vIEFwcGVuZCB0aGUgb3B0aW9uYWwgc3VmZml4XG4gICAgICAgICAgICBoYXNoVGV4dCArPSAnLScgKyBzdWZmaXg7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIE1ENS5oZXhfbWQ1KGhhc2hUZXh0KTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGhhc2hVcmwodXJsKSB7XG4gICAgcmV0dXJuIE1ENS5oZXhfbWQ1KHVybCk7XG59XG5cbmZ1bmN0aW9uIGhhc2hJbWFnZShpbWFnZVVybCwgZ3JvdXBTZXR0aW5ncykge1xuICAgIGlmIChpbWFnZVVybCAmJiBpbWFnZVVybC5sZW5ndGggPiAwKSB7XG4gICAgICAgIGltYWdlVXJsID0gZmlkZGxlV2l0aEltYWdlQW5kTWVkaWFVcmxzKGltYWdlVXJsLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgdmFyIGhhc2hUZXh0ID0gJ3Jkci1pbWctJyArIGltYWdlVXJsO1xuICAgICAgICByZXR1cm4gTUQ1LmhleF9tZDUoaGFzaFRleHQpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gaGFzaE1lZGlhKG1lZGlhVXJsLCBncm91cFNldHRpbmdzKSB7XG4gICAgaWYgKG1lZGlhVXJsICYmIG1lZGlhVXJsLmxlbmd0aCA+IDApIHtcbiAgICAgICAgbWVkaWFVcmwgPSBmaWRkbGVXaXRoSW1hZ2VBbmRNZWRpYVVybHMobWVkaWFVcmwsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICB2YXIgaGFzaFRleHQgPSAncmRyLW1lZGlhLScgKyBtZWRpYVVybDtcbiAgICAgICAgcmV0dXJuIE1ENS5oZXhfbWQ1KGhhc2hUZXh0KTtcbiAgICB9XG59XG5cbi8vIFRPRE86IHJldmlldy4gY29waWVkIGZyb20gZW5nYWdlX2Z1bGxcbmZ1bmN0aW9uIGZpZGRsZVdpdGhJbWFnZUFuZE1lZGlhVXJscyh1cmwsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICAvLyBmaWRkbGUgd2l0aCB0aGUgdXJsIHRvIGFjY291bnQgZm9yIHJvdGF0aW5nIHN1YmRvbWFpbnMgKGkuZS4sIGRpZmZlcmluZyBDRE4gbmFtZXMgZm9yIGltYWdlIGhvc3RzKVxuICAgIC8vIHJlZ2V4IGZyb20gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy82NDQ5MzQwL2hvdy10by1nZXQtdG9wLWxldmVsLWRvbWFpbi1iYXNlLWRvbWFpbi1mcm9tLXRoZS11cmwtaW4tamF2YXNjcmlwdFxuICAgIC8vIG1vZGlmaWVkIHRvIHN1cHBvcnQgMiBjaGFyYWN0ZXIgc3VmZml4ZXMsIGxpa2UgLmZtIG9yIC5pb1xuICAgIHZhciBIT1NURE9NQUlOID0gL1stXFx3XStcXC4oPzpbLVxcd10rXFwueG4tLVstXFx3XSt8Wy1cXHddezIsfXxbLVxcd10rXFwuWy1cXHddezJ9KSQvaTtcbiAgICB2YXIgc3JjQXJyYXkgPSB1cmwuc3BsaXQoJy8nKTtcbiAgICBzcmNBcnJheS5zcGxpY2UoMCwyKTtcblxuICAgIHZhciBkb21haW5XaXRoUG9ydCA9IHNyY0FycmF5LnNoaWZ0KCk7XG4gICAgaWYgKCFkb21haW5XaXRoUG9ydCkgeyAvL3RoaXMgY291bGQgYmUgdW5kZWZpbmVkIGlmIHRoZSB1cmwgbm90IHZhbGlkIG9yIGlzIHNvbWV0aGluZyBsaWtlIGphdmFzY3JpcHQ6dm9pZFxuICAgICAgICByZXR1cm4gdXJsO1xuICAgIH1cbiAgICB2YXIgZG9tYWluID0gZG9tYWluV2l0aFBvcnQuc3BsaXQoJzonKVswXTsgLy8gZ2V0IGRvbWFpbiwgc3RyaXAgcG9ydFxuXG4gICAgdmFyIGZpbGVuYW1lID0gc3JjQXJyYXkuam9pbignLycpO1xuXG4gICAgLy8gdGVzdCBleGFtcGxlczpcbiAgICAvLyB2YXIgbWF0Y2ggPSBIT1NURE9NQUlOLmV4ZWMoJ2h0dHA6Ly9tZWRpYTEuYWIuY2Qub24tdGhlLXRlbGx5LmJiYy5jby51ay8nKTsgLy8gZmFpbHM6IHRyYWlsaW5nIHNsYXNoXG4gICAgLy8gdmFyIG1hdGNoID0gSE9TVERPTUFJTi5leGVjKCdodHRwOi8vbWVkaWExLmFiLmNkLm9uLXRoZS10ZWxseS5iYmMuY28udWsnKTsgLy8gc3VjY2Vzc1xuICAgIC8vIHZhciBtYXRjaCA9IEhPU1RET01BSU4uZXhlYygnbWVkaWExLmFiLmNkLm9uLXRoZS10ZWxseS5iYmMuY28udWsnKTsgLy8gc3VjY2Vzc1xuICAgIHZhciBtYXRjaCA9IEhPU1RET01BSU4uZXhlYyhkb21haW4pO1xuICAgIGlmIChtYXRjaCA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiB1cmw7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdXJsID0gbWF0Y2hbMF0gKyAnLycgKyBmaWxlbmFtZTtcbiAgICB9XG4gICAgaWYgKGdyb3VwU2V0dGluZ3MudXJsLmlnbm9yZU1lZGlhVXJsUXVlcnkoKSAmJiB1cmwuaW5kZXhPZignPycpKSB7XG4gICAgICAgIHVybCA9IHVybC5zcGxpdCgnPycpWzBdO1xuICAgIH1cbiAgICByZXR1cm4gdXJsO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgaGFzaFRleHQ6IGhhc2hUZXh0LFxuICAgIGhhc2hJbWFnZTogaGFzaEltYWdlLFxuICAgIGhhc2hNZWRpYTogaGFzaE1lZGlhLFxuICAgIGhhc2hVcmw6IGhhc2hVcmxcbn07IiwiXG52YXIgbG9hZGVkalF1ZXJ5O1xudmFyIGNhbGxiYWNrcyA9IFtdO1xuXG4vLyBOb3RpZmllcyB0aGUgalF1ZXJ5IHByb3ZpZGVyIHRoYXQgd2UndmUgbG9hZGVkIHRoZSBqUXVlcnkgbGlicmFyeS5cbmZ1bmN0aW9uIGxvYWRlZCgpIHtcbiAgICBsb2FkZWRqUXVlcnkgPSBqUXVlcnkubm9Db25mbGljdCh0cnVlKTtcbiAgICBub3RpZnlDYWxsYmFja3MoKTtcbn1cblxuZnVuY3Rpb24gbm90aWZ5Q2FsbGJhY2tzKCkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2FsbGJhY2tzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNhbGxiYWNrc1tpXShsb2FkZWRqUXVlcnkpO1xuICAgIH1cbiAgICBjYWxsYmFja3MgPSBbXTtcbn1cblxuLy8gUmVnaXN0ZXJzIHRoZSBnaXZlbiBjYWxsYmFjayB0byBiZSBub3RpZmllZCB3aGVuIG91ciB2ZXJzaW9uIG9mIGpRdWVyeSBpcyBsb2FkZWQuXG5mdW5jdGlvbiBvbkxvYWQoY2FsbGJhY2spIHtcbiAgICBpZiAobG9hZGVkalF1ZXJ5KSB7XG4gICAgICAgIGNhbGxiYWNrKGxvYWRlZGpRdWVyeSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgY2FsbGJhY2tzLnB1c2goY2FsbGJhY2spO1xuICAgIH1cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGxvYWRlZDogbG9hZGVkLFxuICAgIG9uTG9hZDogb25Mb2FkXG59OyIsIlxuLy8gVGhlcmUgYXJlIGxpYnJhcmllcyBpbiB0aGUgd2lsZCB0aGF0IG1vZGlmeSBBcnJheS5wcm90b3R5cGUgd2l0aCBhIHRvSlNPTiBmdW5jdGlvbiB0aGF0IGJyZWFrcyBKU09OLnN0cmluZ2lmeS5cbi8vIFdvcmthcm91bmQgdGhpcyBwcm9ibGVtIGJ5IHRlbXBvcmFyaWx5IHJlbW92aW5nIHRoZSBmdW5jdGlvbiB3aGVuIHdlIHN0cmluZ2lmeSBvdXIgb2JqZWN0cy5cbmZ1bmN0aW9uIHN0cmluZ2lmeShqc29uT2JqZWN0KSB7XG4gICAgdmFyIHRvSlNPTiA9IEFycmF5LnByb3RvdHlwZS50b0pTT047XG4gICAgZGVsZXRlIEFycmF5LnByb3RvdHlwZS50b0pTT047XG4gICAgdmFyIHN0cmluZyA9IEpTT04uc3RyaW5naWZ5KGpzb25PYmplY3QpO1xuICAgIGlmICh0b0pTT04pIHtcbiAgICAgICAgQXJyYXkucHJvdG90eXBlLnRvSlNPTiA9IHRvSlNPTjtcbiAgICB9XG4gICAgcmV0dXJuIHN0cmluZztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgc3RyaW5naWZ5OiBzdHJpbmdpZnlcbn07IiwidmFyIEpTT05VdGlscyA9IHJlcXVpcmUoJy4vanNvbi11dGlscycpO1xuXG4vLyBJc3N1ZXMgYSBKU09OUCByZXF1ZXN0IHRvIGEgZ2l2ZW4gc2VydmVyLiBNb3N0IGhpZ2hlci1sZXZlbCBmdW5jdGlvbmFsaXR5IGlzIGluIGFqYXgtY2xpZW50LlxuZnVuY3Rpb24gZG9HZXRKU09OUChiYXNlVXJsLCB1cmwsIHBhcmFtcywgc3VjY2VzcywgZXJyb3IpIHtcbiAgICB2YXIgc2NyaXB0VGFnID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XG4gICAgdmFyIHJlc3BvbnNlQ2FsbGJhY2sgPSAnYW50ZW5uYScgKyBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDE2KS5zbGljZSgyKTtcbiAgICB3aW5kb3dbcmVzcG9uc2VDYWxsYmFja10gPSBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gVE9ETzogUmV2aXNpdCB3aGV0aGVyIGl0J3MgcmVhbGx5IGNvb2wgdG8ga2V5IHRoaXMgb24gdGhlIHRleHRTdGF0dXMgb3IgaWYgd2Ugc2hvdWxkIGJlIGxvb2tpbmcgYXRcbiAgICAgICAgICAgIC8vICAgICAgIHRoZSBzdGF0dXMgY29kZSBpbiB0aGUgWEhSXG4gICAgICAgICAgICAvLyBOb3RlOiBUaGUgc2VydmVyIGNvbWVzIGJhY2sgd2l0aCAyMDAgcmVzcG9uc2VzIHdpdGggYSBuZXN0ZWQgc3RhdHVzIG9mIFwiZmFpbFwiLi4uXG4gICAgICAgICAgICBpZiAocmVzcG9uc2Uuc3RhdHVzICE9PSAnZmFpbCcgJiYgKCFyZXNwb25zZS5kYXRhIHx8IHJlc3BvbnNlLmRhdGEuc3RhdHVzICE9PSAnZmFpbCcpKSB7XG4gICAgICAgICAgICAgICAgc3VjY2VzcyhyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKGVycm9yKSB7IGVycm9yKHJlc3BvbnNlLm1lc3NhZ2UgfHwgcmVzcG9uc2UuZGF0YS5tZXNzYWdlKTsgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgZGVsZXRlIHdpbmRvd1tyZXNwb25zZUNhbGxiYWNrXTtcbiAgICAgICAgICAgIHNjcmlwdFRhZy5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHNjcmlwdFRhZyk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHZhciBqc29ucFVybCA9IGJhc2VVcmwgKyB1cmwgKyAnP2NhbGxiYWNrPScgKyByZXNwb25zZUNhbGxiYWNrO1xuICAgIGlmIChwYXJhbXMpIHtcbiAgICAgICAganNvbnBVcmwgKz0gJyZqc29uPScgKyBlbmNvZGVVUklDb21wb25lbnQoSlNPTlV0aWxzLnN0cmluZ2lmeShwYXJhbXMpKTtcbiAgICB9XG4gICAgc2NyaXB0VGFnLnNldEF0dHJpYnV0ZSgndHlwZScsICdhcHBsaWNhdGlvbi9qYXZhc2NyaXB0Jyk7XG4gICAgc2NyaXB0VGFnLnNldEF0dHJpYnV0ZSgnc3JjJywganNvbnBVcmwpO1xuICAgIChkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaGVhZCcpWzBdIHx8IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdib2R5JylbMF0pLmFwcGVuZENoaWxkKHNjcmlwdFRhZyk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGRvR2V0SlNPTlA6IGRvR2V0SlNPTlBcbn07IiwidmFyIEFwcE1vZGUgPSByZXF1aXJlKCcuL2FwcC1tb2RlJyk7XG5cbmZ1bmN0aW9uIGxvZ0RlYnVnTWVzc2FnZShtZXNzYWdlKSB7XG4gICAgaWYgKEFwcE1vZGUuZGVidWcpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnQW50ZW5uYURlYnVnOiAnICsgbWVzc2FnZSk7XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBkZWJ1Z01lc3NhZ2U6IGxvZ0RlYnVnTWVzc2FnZVxufTsiLCIvKlxuICogQSBKYXZhU2NyaXB0IGltcGxlbWVudGF0aW9uIG9mIHRoZSBSU0EgRGF0YSBTZWN1cml0eSwgSW5jLiBNRDUgTWVzc2FnZVxuICogRGlnZXN0IEFsZ29yaXRobSwgYXMgZGVmaW5lZCBpbiBSRkMgMTMyMS5cbiAqIFZlcnNpb24gMi4xIENvcHlyaWdodCAoQykgUGF1bCBKb2huc3RvbiAxOTk5IC0gMjAwMi5cbiAqIE90aGVyIGNvbnRyaWJ1dG9yczogR3JlZyBIb2x0LCBBbmRyZXcgS2VwZXJ0LCBZZG5hciwgTG9zdGluZXRcbiAqIERpc3RyaWJ1dGVkIHVuZGVyIHRoZSBCU0QgTGljZW5zZVxuICogU2VlIGh0dHA6Ly9wYWpob21lLm9yZy51ay9jcnlwdC9tZDUgZm9yIG1vcmUgaW5mby5cbiAqL1xuXG52YXIgaGV4Y2FzZSA9IDA7XG52YXIgYjY0cGFkICA9IFwiXCI7XG52YXIgY2hyc3ogPSA4O1xuXG5mdW5jdGlvbiBoZXhfbWQ1KHMpIHtcbiAgICByZXR1cm4gYmlubDJoZXgoY29yZV9tZDUoc3RyMmJpbmwocyksIHMubGVuZ3RoICogY2hyc3opKTtcbn1cblxuZnVuY3Rpb24gY29yZV9tZDUoeCwgbGVuKSB7XG4gICAgeFtsZW4gPj4gNV0gfD0gMHg4MCA8PCAoKGxlbikgJSAzMik7XG4gICAgeFsoKChsZW4gKyA2NCkgPj4+IDkpIDw8IDQpICsgMTRdID0gbGVuO1xuICAgIHZhciBhID0gMTczMjU4NDE5MztcbiAgICB2YXIgYiA9IC0yNzE3MzM4Nzk7XG4gICAgdmFyIGMgPSAtMTczMjU4NDE5NDtcbiAgICB2YXIgZCA9IDI3MTczMzg3ODtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHgubGVuZ3RoOyBpICs9IDE2KSB7XG4gICAgICAgIHZhciBvbGRhID0gYTtcbiAgICAgICAgdmFyIG9sZGIgPSBiO1xuICAgICAgICB2YXIgb2xkYyA9IGM7XG4gICAgICAgIHZhciBvbGRkID0gZDtcblxuICAgICAgICBhID0gbWQ1X2ZmKGEsIGIsIGMsIGQsIHhbaSArIDBdLCA3LCAtNjgwODc2OTM2KTtcbiAgICAgICAgZCA9IG1kNV9mZihkLCBhLCBiLCBjLCB4W2kgKyAxXSwgMTIsIC0zODk1NjQ1ODYpO1xuICAgICAgICBjID0gbWQ1X2ZmKGMsIGQsIGEsIGIsIHhbaSArIDJdLCAxNywgNjA2MTA1ODE5KTtcbiAgICAgICAgYiA9IG1kNV9mZihiLCBjLCBkLCBhLCB4W2kgKyAzXSwgMjIsIC0xMDQ0NTI1MzMwKTtcbiAgICAgICAgYSA9IG1kNV9mZihhLCBiLCBjLCBkLCB4W2kgKyA0XSwgNywgLTE3NjQxODg5Nyk7XG4gICAgICAgIGQgPSBtZDVfZmYoZCwgYSwgYiwgYywgeFtpICsgNV0sIDEyLCAxMjAwMDgwNDI2KTtcbiAgICAgICAgYyA9IG1kNV9mZihjLCBkLCBhLCBiLCB4W2kgKyA2XSwgMTcsIC0xNDczMjMxMzQxKTtcbiAgICAgICAgYiA9IG1kNV9mZihiLCBjLCBkLCBhLCB4W2kgKyA3XSwgMjIsIC00NTcwNTk4Myk7XG4gICAgICAgIGEgPSBtZDVfZmYoYSwgYiwgYywgZCwgeFtpICsgOF0sIDcsIDE3NzAwMzU0MTYpO1xuICAgICAgICBkID0gbWQ1X2ZmKGQsIGEsIGIsIGMsIHhbaSArIDldLCAxMiwgLTE5NTg0MTQ0MTcpO1xuICAgICAgICBjID0gbWQ1X2ZmKGMsIGQsIGEsIGIsIHhbaSArIDEwXSwgMTcsIC00MjA2Myk7XG4gICAgICAgIGIgPSBtZDVfZmYoYiwgYywgZCwgYSwgeFtpICsgMTFdLCAyMiwgLTE5OTA0MDQxNjIpO1xuICAgICAgICBhID0gbWQ1X2ZmKGEsIGIsIGMsIGQsIHhbaSArIDEyXSwgNywgMTgwNDYwMzY4Mik7XG4gICAgICAgIGQgPSBtZDVfZmYoZCwgYSwgYiwgYywgeFtpICsgMTNdLCAxMiwgLTQwMzQxMTAxKTtcbiAgICAgICAgYyA9IG1kNV9mZihjLCBkLCBhLCBiLCB4W2kgKyAxNF0sIDE3LCAtMTUwMjAwMjI5MCk7XG4gICAgICAgIGIgPSBtZDVfZmYoYiwgYywgZCwgYSwgeFtpICsgMTVdLCAyMiwgMTIzNjUzNTMyOSk7XG5cbiAgICAgICAgYSA9IG1kNV9nZyhhLCBiLCBjLCBkLCB4W2kgKyAxXSwgNSwgLTE2NTc5NjUxMCk7XG4gICAgICAgIGQgPSBtZDVfZ2coZCwgYSwgYiwgYywgeFtpICsgNl0sIDksIC0xMDY5NTAxNjMyKTtcbiAgICAgICAgYyA9IG1kNV9nZyhjLCBkLCBhLCBiLCB4W2kgKyAxMV0sIDE0LCA2NDM3MTc3MTMpO1xuICAgICAgICBiID0gbWQ1X2dnKGIsIGMsIGQsIGEsIHhbaSArIDBdLCAyMCwgLTM3Mzg5NzMwMik7XG4gICAgICAgIGEgPSBtZDVfZ2coYSwgYiwgYywgZCwgeFtpICsgNV0sIDUsIC03MDE1NTg2OTEpO1xuICAgICAgICBkID0gbWQ1X2dnKGQsIGEsIGIsIGMsIHhbaSArIDEwXSwgOSwgMzgwMTYwODMpO1xuICAgICAgICBjID0gbWQ1X2dnKGMsIGQsIGEsIGIsIHhbaSArIDE1XSwgMTQsIC02NjA0NzgzMzUpO1xuICAgICAgICBiID0gbWQ1X2dnKGIsIGMsIGQsIGEsIHhbaSArIDRdLCAyMCwgLTQwNTUzNzg0OCk7XG4gICAgICAgIGEgPSBtZDVfZ2coYSwgYiwgYywgZCwgeFtpICsgOV0sIDUsIDU2ODQ0NjQzOCk7XG4gICAgICAgIGQgPSBtZDVfZ2coZCwgYSwgYiwgYywgeFtpICsgMTRdLCA5LCAtMTAxOTgwMzY5MCk7XG4gICAgICAgIGMgPSBtZDVfZ2coYywgZCwgYSwgYiwgeFtpICsgM10sIDE0LCAtMTg3MzYzOTYxKTtcbiAgICAgICAgYiA9IG1kNV9nZyhiLCBjLCBkLCBhLCB4W2kgKyA4XSwgMjAsIDExNjM1MzE1MDEpO1xuICAgICAgICBhID0gbWQ1X2dnKGEsIGIsIGMsIGQsIHhbaSArIDEzXSwgNSwgLTE0NDQ2ODE0NjcpO1xuICAgICAgICBkID0gbWQ1X2dnKGQsIGEsIGIsIGMsIHhbaSArIDJdLCA5LCAtNTE0MDM3ODQpO1xuICAgICAgICBjID0gbWQ1X2dnKGMsIGQsIGEsIGIsIHhbaSArIDddLCAxNCwgMTczNTMyODQ3Myk7XG4gICAgICAgIGIgPSBtZDVfZ2coYiwgYywgZCwgYSwgeFtpICsgMTJdLCAyMCwgLTE5MjY2MDc3MzQpO1xuXG4gICAgICAgIGEgPSBtZDVfaGgoYSwgYiwgYywgZCwgeFtpICsgNV0sIDQsIC0zNzg1NTgpO1xuICAgICAgICBkID0gbWQ1X2hoKGQsIGEsIGIsIGMsIHhbaSArIDhdLCAxMSwgLTIwMjI1NzQ0NjMpO1xuICAgICAgICBjID0gbWQ1X2hoKGMsIGQsIGEsIGIsIHhbaSArIDExXSwgMTYsIDE4MzkwMzA1NjIpO1xuICAgICAgICBiID0gbWQ1X2hoKGIsIGMsIGQsIGEsIHhbaSArIDE0XSwgMjMsIC0zNTMwOTU1Nik7XG4gICAgICAgIGEgPSBtZDVfaGgoYSwgYiwgYywgZCwgeFtpICsgMV0sIDQsIC0xNTMwOTkyMDYwKTtcbiAgICAgICAgZCA9IG1kNV9oaChkLCBhLCBiLCBjLCB4W2kgKyA0XSwgMTEsIDEyNzI4OTMzNTMpO1xuICAgICAgICBjID0gbWQ1X2hoKGMsIGQsIGEsIGIsIHhbaSArIDddLCAxNiwgLTE1NTQ5NzYzMik7XG4gICAgICAgIGIgPSBtZDVfaGgoYiwgYywgZCwgYSwgeFtpICsgMTBdLCAyMywgLTEwOTQ3MzA2NDApO1xuICAgICAgICBhID0gbWQ1X2hoKGEsIGIsIGMsIGQsIHhbaSArIDEzXSwgNCwgNjgxMjc5MTc0KTtcbiAgICAgICAgZCA9IG1kNV9oaChkLCBhLCBiLCBjLCB4W2kgKyAwXSwgMTEsIC0zNTg1MzcyMjIpO1xuICAgICAgICBjID0gbWQ1X2hoKGMsIGQsIGEsIGIsIHhbaSArIDNdLCAxNiwgLTcyMjUyMTk3OSk7XG4gICAgICAgIGIgPSBtZDVfaGgoYiwgYywgZCwgYSwgeFtpICsgNl0sIDIzLCA3NjAyOTE4OSk7XG4gICAgICAgIGEgPSBtZDVfaGgoYSwgYiwgYywgZCwgeFtpICsgOV0sIDQsIC02NDAzNjQ0ODcpO1xuICAgICAgICBkID0gbWQ1X2hoKGQsIGEsIGIsIGMsIHhbaSArIDEyXSwgMTEsIC00MjE4MTU4MzUpO1xuICAgICAgICBjID0gbWQ1X2hoKGMsIGQsIGEsIGIsIHhbaSArIDE1XSwgMTYsIDUzMDc0MjUyMCk7XG4gICAgICAgIGIgPSBtZDVfaGgoYiwgYywgZCwgYSwgeFtpICsgMl0sIDIzLCAtOTk1MzM4NjUxKTtcblxuICAgICAgICBhID0gbWQ1X2lpKGEsIGIsIGMsIGQsIHhbaSArIDBdLCA2LCAtMTk4NjMwODQ0KTtcbiAgICAgICAgZCA9IG1kNV9paShkLCBhLCBiLCBjLCB4W2kgKyA3XSwgMTAsIDExMjY4OTE0MTUpO1xuICAgICAgICBjID0gbWQ1X2lpKGMsIGQsIGEsIGIsIHhbaSArIDE0XSwgMTUsIC0xNDE2MzU0OTA1KTtcbiAgICAgICAgYiA9IG1kNV9paShiLCBjLCBkLCBhLCB4W2kgKyA1XSwgMjEsIC01NzQzNDA1NSk7XG4gICAgICAgIGEgPSBtZDVfaWkoYSwgYiwgYywgZCwgeFtpICsgMTJdLCA2LCAxNzAwNDg1NTcxKTtcbiAgICAgICAgZCA9IG1kNV9paShkLCBhLCBiLCBjLCB4W2kgKyAzXSwgMTAsIC0xODk0OTg2NjA2KTtcbiAgICAgICAgYyA9IG1kNV9paShjLCBkLCBhLCBiLCB4W2kgKyAxMF0sIDE1LCAtMTA1MTUyMyk7XG4gICAgICAgIGIgPSBtZDVfaWkoYiwgYywgZCwgYSwgeFtpICsgMV0sIDIxLCAtMjA1NDkyMjc5OSk7XG4gICAgICAgIGEgPSBtZDVfaWkoYSwgYiwgYywgZCwgeFtpICsgOF0sIDYsIDE4NzMzMTMzNTkpO1xuICAgICAgICBkID0gbWQ1X2lpKGQsIGEsIGIsIGMsIHhbaSArIDE1XSwgMTAsIC0zMDYxMTc0NCk7XG4gICAgICAgIGMgPSBtZDVfaWkoYywgZCwgYSwgYiwgeFtpICsgNl0sIDE1LCAtMTU2MDE5ODM4MCk7XG4gICAgICAgIGIgPSBtZDVfaWkoYiwgYywgZCwgYSwgeFtpICsgMTNdLCAyMSwgMTMwOTE1MTY0OSk7XG4gICAgICAgIGEgPSBtZDVfaWkoYSwgYiwgYywgZCwgeFtpICsgNF0sIDYsIC0xNDU1MjMwNzApO1xuICAgICAgICBkID0gbWQ1X2lpKGQsIGEsIGIsIGMsIHhbaSArIDExXSwgMTAsIC0xMTIwMjEwMzc5KTtcbiAgICAgICAgYyA9IG1kNV9paShjLCBkLCBhLCBiLCB4W2kgKyAyXSwgMTUsIDcxODc4NzI1OSk7XG4gICAgICAgIGIgPSBtZDVfaWkoYiwgYywgZCwgYSwgeFtpICsgOV0sIDIxLCAtMzQzNDg1NTUxKTtcblxuICAgICAgICBhID0gc2FmZV9hZGQoYSwgb2xkYSk7XG4gICAgICAgIGIgPSBzYWZlX2FkZChiLCBvbGRiKTtcbiAgICAgICAgYyA9IHNhZmVfYWRkKGMsIG9sZGMpO1xuICAgICAgICBkID0gc2FmZV9hZGQoZCwgb2xkZCk7XG4gICAgfVxuICAgIHJldHVybiBbYSwgYiwgYywgZF07XG59XG5cbmZ1bmN0aW9uIG1kNV9jbW4ocSwgYSwgYiwgeCwgcywgdCkge1xuICAgIHJldHVybiBzYWZlX2FkZChiaXRfcm9sKHNhZmVfYWRkKHNhZmVfYWRkKGEsIHEpLCBzYWZlX2FkZCh4LCB0KSksIHMpLCBiKTtcbn1cblxuZnVuY3Rpb24gbWQ1X2ZmKGEsIGIsIGMsIGQsIHgsIHMsIHQpIHtcbiAgICByZXR1cm4gbWQ1X2NtbigoYiAmIGMpIHwgKCh+YikgJiBkKSwgYSwgYiwgeCwgcywgdCk7XG59XG5cbmZ1bmN0aW9uIG1kNV9nZyhhLCBiLCBjLCBkLCB4LCBzLCB0KSB7XG4gICAgcmV0dXJuIG1kNV9jbW4oKGIgJiBkKSB8IChjICYgKH5kKSksIGEsIGIsIHgsIHMsIHQpO1xufVxuXG5mdW5jdGlvbiBtZDVfaGgoYSwgYiwgYywgZCwgeCwgcywgdCkge1xuICAgIHJldHVybiBtZDVfY21uKGIgXiBjIF4gZCwgYSwgYiwgeCwgcywgdCk7XG59XG5cbmZ1bmN0aW9uIG1kNV9paShhLCBiLCBjLCBkLCB4LCBzLCB0KSB7XG4gICAgcmV0dXJuIG1kNV9jbW4oYyBeIChiIHwgKH5kKSksIGEsIGIsIHgsIHMsIHQpO1xufVxuXG5mdW5jdGlvbiBzYWZlX2FkZCh4LCB5KSB7XG4gICAgdmFyIGxzdyA9ICh4ICYgMHhGRkZGKSArICh5ICYgMHhGRkZGKTtcbiAgICB2YXIgbXN3ID0gKHggPj4gMTYpICsgKHkgPj4gMTYpICsgKGxzdyA+PiAxNik7XG4gICAgcmV0dXJuIChtc3cgPDwgMTYpIHwgKGxzdyAmIDB4RkZGRik7XG59XG5cbmZ1bmN0aW9uIGJpdF9yb2wobnVtLCBjbnQpIHtcbiAgICByZXR1cm4gKG51bSA8PCBjbnQpIHwgKG51bSA+Pj4gKDMyIC0gY250KSk7XG59XG5cbmZ1bmN0aW9uIHN0cjJiaW5sKHN0cikge1xuICAgIHZhciBiaW4gPSBbXTtcbiAgICB2YXIgbWFzayA9ICgxIDw8IGNocnN6KSAtIDE7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHIubGVuZ3RoICogY2hyc3o7IGkgKz0gY2hyc3opIHtcbiAgICAgICAgYmluW2kgPj4gNV0gfD0gKHN0ci5jaGFyQ29kZUF0KGkgLyBjaHJzeikgJiBtYXNrKSA8PCAoaSAlIDMyKTtcbiAgICB9XG4gICAgcmV0dXJuIGJpbjtcbn1cblxuZnVuY3Rpb24gYmlubDJoZXgoYmluYXJyYXkpIHtcbiAgICB2YXIgaGV4X3RhYiA9IGhleGNhc2UgPyBcIjAxMjM0NTY3ODlBQkNERUZcIiA6IFwiMDEyMzQ1Njc4OWFiY2RlZlwiO1xuICAgIHZhciBzdHIgPSBcIlwiO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYmluYXJyYXkubGVuZ3RoICogNDsgaSsrKSB7XG4gICAgICAgIHN0ciArPSBoZXhfdGFiLmNoYXJBdCgoYmluYXJyYXlbaSA+PiAyXSA+PiAoKGkgJSA0KSAqIDggKyA0KSkgJiAweEYpICsgaGV4X3RhYi5jaGFyQXQoKGJpbmFycmF5W2kgPj4gMl0gPj4gKChpICUgNCkgKiA4KSkgJiAweEYpO1xuICAgIH1cbiAgICByZXR1cm4gc3RyO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgaGV4X21kNTogaGV4X21kNVxufTsiLCIvL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgJ3N1bW1hcnlfd2lkZ2V0X19yZWFjdGlvbnMnOiAnUmVhY3Rpb25zJyxcbiAgICAnc3VtbWFyeV93aWRnZXRfX3JlYWN0aW9uc19vbmUnOiAnMSBSZWFjdGlvbicsXG4gICAgJ3N1bW1hcnlfd2lkZ2V0X19yZWFjdGlvbnNfbWFueSc6ICd7MH0gUmVhY3Rpb25zJyxcblxuICAgICdyZWFjdGlvbnNfd2lkZ2V0X190aXRsZSc6ICdSZWFjdGlvbnMnLFxuICAgICdyZWFjdGlvbnNfd2lkZ2V0X190aXRsZV90aGluayc6ICdXaGF0IGRvIHlvdSB0aGluaz8nLFxuICAgICdyZWFjdGlvbnNfd2lkZ2V0X190aXRsZV90aGFua3MnOiAnVGhhbmtzIGZvciB5b3VyIHJlYWN0aW9uIScsXG4gICAgJ3JlYWN0aW9uc193aWRnZXRfX3RpdGxlX3NpZ25pbic6ICdTaWduIGluIFJlcXVpcmVkJyxcbiAgICAncmVhY3Rpb25zX3dpZGdldF9fdGl0bGVfYmxvY2tlZCc6ICdCbG9ja2VkIFJlYWN0aW9uJyxcbiAgICAncmVhY3Rpb25zX3dpZGdldF9fdGl0bGVfZXJyb3InOiAnRXJyb3InLFxuICAgICdyZWFjdGlvbnNfd2lkZ2V0X19iYWNrJzogJ0JhY2snLFxuXG4gICAgJ3JlYWN0aW9uc19wYWdlX19ub19yZWFjdGlvbnMnOiAnTm8gcmVhY3Rpb25zIHlldCEnLFxuICAgICdyZWFjdGlvbnNfcGFnZV9fdGhpbmsnOiAnV2hhdCBkbyB5b3UgdGhpbms/JyxcblxuICAgICdtZWRpYV9pbmRpY2F0b3JfX3RoaW5rJzogJ1doYXQgZG8geW91IHRoaW5rPycsXG5cbiAgICAncG9wdXBfd2lkZ2V0X190aGluayc6ICdXaGF0IGRvIHlvdSB0aGluaz8nLFxuXG4gICAgJ2RlZmF1bHRzX3BhZ2VfX2FkZCc6ICcrIEFkZCBZb3VyIE93bicsXG4gICAgJ2RlZmF1bHRzX3BhZ2VfX29rJzogJ29rJyxcblxuICAgICdjb25maXJtYXRpb25fcGFnZV9fc2hhcmUnOiAnU2hhcmUgeW91ciByZWFjdGlvbjonLFxuXG4gICAgJ2NvbW1lbnRzX3BhZ2VfX2hlYWRlcic6ICcoezB9KSBDb21tZW50czonLFxuXG4gICAgJ2NvbW1lbnRfYXJlYV9fYWRkJzogJ0NvbW1lbnQnLFxuICAgICdjb21tZW50X2FyZWFfX3BsYWNlaG9sZGVyJzogJ0FkZCBjb21tZW50cyBvciAjaGFzaHRhZ3MnLFxuICAgICdjb21tZW50X2FyZWFfX3RoYW5rcyc6ICdUaGFua3MgZm9yIHlvdXIgY29tbWVudC4nLFxuICAgICdjb21tZW50X2FyZWFfX2NvdW50JzogJzxzcGFuIGNsYXNzPVwiYW50ZW5uYS1jb21tZW50LWNvdW50XCI+PC9zcGFuPiBjaGFyYWN0ZXJzIGxlZnQnLFxuXG4gICAgJ2xvY2F0aW9uc19wYWdlX19wYWdlbGV2ZWwnOiAnVG8gdGhpcyB3aG9sZSBwYWdlJyxcbiAgICAnbG9jYXRpb25zX3BhZ2VfX2NvdW50X29uZSc6ICc8c3BhbiBjbGFzcz1cImFudGVubmEtbG9jYXRpb24tY291bnRcIj4xPC9zcGFuPjxicj5yZWFjdGlvbicsXG4gICAgJ2xvY2F0aW9uc19wYWdlX19jb3VudF9tYW55JzogJzxzcGFuIGNsYXNzPVwiYW50ZW5uYS1sb2NhdGlvbi1jb3VudFwiPnswfTwvc3Bhbj48YnI+cmVhY3Rpb25zJyxcbiAgICAnbG9jYXRpb25zX3BhZ2VfX3ZpZGVvJzogJ1ZpZGVvJyxcblxuICAgICdjYWxsX3RvX2FjdGlvbl9sYWJlbF9fcmVzcG9uc2VzJzogJ1JlYWN0aW9ucycsXG4gICAgJ2NhbGxfdG9fYWN0aW9uX2xhYmVsX19yZXNwb25zZXNfb25lJzogJzEgUmVhY3Rpb24nLFxuICAgICdjYWxsX3RvX2FjdGlvbl9sYWJlbF9fcmVzcG9uc2VzX21hbnknOiAnezB9IFJlYWN0aW9ucycsXG5cbiAgICAnYmxvY2tlZF9wYWdlX19tZXNzYWdlMSc6ICdUaGlzIHNpdGUgaGFzIGJsb2NrZWQgc29tZSBvciBhbGwgb2YgdGhlIHRleHQgaW4gdGhhdCByZWFjdGlvbi4nLFxuICAgICdibG9ja2VkX3BhZ2VfX21lc3NhZ2UyJzogJ1BsZWFzZSB0cnkgc29tZXRoaW5nIHRoYXQgd2lsbCBiZSBtb3JlIGFwcHJvcHJpYXRlIGZvciB0aGlzIGNvbW11bml0eS4nLFxuXG4gICAgJ3BlbmRpbmdfcGFnZV9fbWVzc2FnZV9hcHBlYXInOiAnWW91ciByZWFjdGlvbiB3aWxsIGFwcGVhciBvbmNlIGl0IGlzIHJldmlld2VkLiBBbGwgbmV3IHJlYWN0aW9ucyBtdXN0IG1lZXQgb3VyIGNvbW11bml0eSBndWlkZWxpbmVzLicsXG5cbiAgICAnZXJyb3JfcGFnZV9fbWVzc2FnZSc6ICdPb3BzISBXZSByZWFsbHkgdmFsdWUgeW91ciBmZWVkYmFjaywgYnV0IHNvbWV0aGluZyB3ZW50IHdyb25nLicsXG5cbiAgICAndGFwX2hlbHBlcl9fcHJvbXB0JzogJ1RhcCBhbnkgcGFyYWdyYXBoIHRvIHJlc3BvbmQhJyxcbiAgICAndGFwX2hlbHBlcl9fY2xvc2UnOiAnQ2xvc2UnLFxuXG4gICAgJ2NvbnRlbnRfcmVjX3dpZGdldF9fdGl0bGUnOiAnUmVhZGVyIFJlYWN0aW9ucycsXG5cbiAgICAnbG9naW5fcGFnZV9fbWVzc2FnZV8xJzogJzxzcGFuIGNsYXNzPVwiYW50ZW5uYS1sb2dpbi1ncm91cFwiPnswfTwvc3Bhbj4gdXNlcyA8YSBocmVmPVwiaHR0cDovL3d3dy5hbnRlbm5hLmlzL1wiIHRhcmdldD1cIl9ibGFua1wiPkFudGVubmE8L2E+IHNvIHlvdSBjYW4gcmVhY3QgdG8gY29udGVudCBlYXNpbHkgYW5kIHNhZmVseS4nLFxuICAgICdsb2dpbl9wYWdlX19tZXNzYWdlXzInOiAnVG8ga2VlcCBwYXJ0aWNpcGF0aW5nLCBqdXN0IGxvZyBpbjonLFxuICAgICdsb2dpbl9wYWdlX19wcml2YWN5JzogJ0FudGVubmEgdmFsdWVzIHlvdXIgcHJpdmFjeS4gPGEgaHJlZj1cImh0dHA6Ly93d3cuYW50ZW5uYS5pcy9mYXEvXCIgdGFyZ2V0PVwiX2JsYW5rXCI+TGVhcm4gbW9yZTwvYT4uJyxcbiAgICAnbG9naW5fcGFnZV9fcGVuZGluZ19wcmUnOiAnWW91IG1pZ2h0IG5lZWQgdG8gJyxcbiAgICAnbG9naW5fcGFnZV9fcGVuZGluZ19jbGljayc6ICdjbGljayBoZXJlJyxcbiAgICAnbG9naW5fcGFnZV9fcGVuZGluZ19wb3N0JzogJyBvbmNlIHlvdVxcJ3ZlIGxvZ2dlZCBpbi4nXG59OyIsIi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAnc3VtbWFyeV93aWRnZXRfX3JlYWN0aW9ucyc6ICdSZWFjY2lvbmVzJyxcbiAgICAnc3VtbWFyeV93aWRnZXRfX3JlYWN0aW9uc19vbmUnOiAnMSBSZWFjY2nDs24nLFxuICAgICdzdW1tYXJ5X3dpZGdldF9fcmVhY3Rpb25zX21hbnknOiAnezB9IFJlYWNjaW9uZXMnLFxuXG4gICAgJ3JlYWN0aW9uc193aWRnZXRfX3RpdGxlJzogJ1JlYWNjaW9uZXMnLFxuICAgICdyZWFjdGlvbnNfd2lkZ2V0X190aXRsZV90aGluayc6ICfCv1F1w6kgcGllbnNhcz8nLFxuICAgICdyZWFjdGlvbnNfd2lkZ2V0X190aXRsZV90aGFua3MnOiAnwqFHcmFjaWFzIHBvciB0dSByZWFjY2nDs24hJyxcbiAgICAncmVhY3Rpb25zX3dpZGdldF9fdGl0bGVfc2lnbmluJzogJ0VzIG5lY2VzYXJpbyBpbmljaWFyIHNlc2nDs24nLCAvLyBUT0RPOiBjaGVjayB0cmFuc2xhdGlvblxuICAgICdyZWFjdGlvbnNfd2lkZ2V0X190aXRsZV9ibG9ja2VkJzogJ1JlYWNjacOzbiBibG9xdWVhZG8nLCAvLyBUT0RPOiBjaGVjayB0cmFuc2xhdGlvblxuICAgICdyZWFjdGlvbnNfd2lkZ2V0X190aXRsZV9lcnJvcic6ICdFcnJvcicsIC8vIFRPRE86IGNoZWNrIHRyYW5zbGF0aW9uXG4gICAgJ3JlYWN0aW9uc193aWRnZXRfX2JhY2snOiAnVm9sdmVyJyxcbiAgICAncmVhY3Rpb25zX3BhZ2VfX25vX3JlYWN0aW9ucyc6ICfCoU5vIHJlYWNjaW9uZXMgeWEhJywgLy8gVE9ETzogY2hlY2sgdHJhbnNsYXRpb24gXG4gICAgJ3JlYWN0aW9uc19wYWdlX190aGluayc6ICfCv1F1w6kgcGllbnNhcz8nLFxuXG4gICAgJ21lZGlhX2luZGljYXRvcl9fdGhpbmsnOiAnwr9RdcOpIHBpZW5zYXM/JyxcblxuICAgICdwb3B1cF93aWRnZXRfX3RoaW5rJzogJ8K/UXXDqSBwaWVuc2FzPycsXG5cbiAgICAnZGVmYXVsdHNfcGFnZV9fYWRkJzogJysgQcOxYWRlIGxvIHR1eW8nLFxuICAgICdkZWZhdWx0c19wYWdlX19vayc6ICdvaycsXG5cbiAgICAnY29uZmlybWF0aW9uX3BhZ2VfX3NoYXJlJzogJ0NvbXBhcnRlIHR1IHJlYWNjacOzbjonLFxuXG4gICAgJ2NvbW1lbnRzX3BhZ2VfX2hlYWRlcic6ICcoezB9KSBDb21lbnRhczonLFxuXG4gICAgJ2NvbW1lbnRfYXJlYV9fYWRkJzogJ0NvbWVudGEnLFxuICAgICdjb21tZW50X2FyZWFfX3BsYWNlaG9sZGVyJzogJ0HDsWFkZSBjb21lbnRhcmlvcyBvICNoYXNodGFncycsXG4gICAgJ2NvbW1lbnRfYXJlYV9fdGhhbmtzJzogJ0dyYWNpYXMgcG9yIHR1IHJlYWNjacOzbi4nLFxuICAgICdjb21tZW50X2FyZWFfX2NvdW50JzogJ1F1ZWRhbiA8c3BhbiBjbGFzcz1cImFudGVubmEtY29tbWVudC1jb3VudFwiPjwvc3Bhbj4gY2FyYWN0ZXJlcycsXG5cbiAgICAnbG9jYXRpb25zX3BhZ2VfX3BhZ2VsZXZlbCc6ICdBIGVzdGEgcMOhZ2luYScsIC8vIFRPRE86IG5lZWQgYSB0cmFuc2xhdGlvbiBvZiBcIlRvIHRoaXMgd2hvbGUgcGFnZVwiXG4gICAgJ2xvY2F0aW9uc19wYWdlX19jb3VudF9vbmUnOiAnPHNwYW4gY2xhc3M9XCJhbnRlbm5hLWxvY2F0aW9uLWNvdW50XCI+MTwvc3Bhbj48YnI+cmVhY2Npw7NuJyxcbiAgICAnbG9jYXRpb25zX3BhZ2VfX2NvdW50X21hbnknOiAnPHNwYW4gY2xhc3M9XCJhbnRlbm5hLWxvY2F0aW9uLWNvdW50XCI+ezB9PC9zcGFuPjxicj5yZWFjY2lvbmVzJyxcbiAgICAnbG9jYXRpb25zX3BhZ2VfX3ZpZGVvJzogJ1ZpZGVvJyxcblxuICAgICdjYWxsX3RvX2FjdGlvbl9sYWJlbF9fcmVzcG9uc2VzJzogJ1JlYWNjaW9uZXMnLFxuICAgICdjYWxsX3RvX2FjdGlvbl9sYWJlbF9fcmVzcG9uc2VzX29uZSc6ICcxIFJlYWNjacOzbicsXG4gICAgJ2NhbGxfdG9fYWN0aW9uX2xhYmVsX19yZXNwb25zZXNfbWFueSc6ICd7MH0gUmVhY2Npb25lcycsXG5cbiAgICAnYmxvY2tlZF9wYWdlX19tZXNzYWdlMSc6ICdFc3RlIHNpdGlvIHdlYiBoYSBibG9xdWVhZG8gZXNhIHJlYWNjacOzbi4nLCAvLyBUT0RPOiBjaGVjayB0cmFuc2xhdGlvblxuICAgICdibG9ja2VkX3BhZ2VfX21lc3NhZ2UyJzogJ1BvciBmYXZvciwgaW50ZW50ZSBhbGdvIHF1ZSBzZXLDoSBtw6FzIGFwcm9waWFkbyBwYXJhIGVzdGEgY29tdW5pZGFkLicsIC8vIFRPRE86IGNoZWNrIHRyYW5zbGF0aW9uXG4gICAgJ3BlbmRpbmdfcGFnZV9fbWVzc2FnZV9hcHBlYXInOiAnQXBhcmVjZXLDoSBzdSByZWFjY2nDs24gdW5hIHZleiBxdWUgc2UgcmV2aXNhLiBUb2RhcyBsYXMgbnVldmFzIHJlYWNjaW9uZXMgZGViZW4gY3VtcGxpciBjb24gbm9ybWFzIGRlIGxhIGNvbXVuaWRhZC4nLCAvLyBUT0RPOiBjaGVjayB0cmFuc2xhdGlvblxuICAgICdlcnJvcl9wYWdlX19tZXNzYWdlJzogJ8KhTG8gc2llbnRvISBWYWxvcmFtb3Mgc3VzIGNvbWVudGFyaW9zLCBwZXJvIGFsZ28gc2FsacOzIG1hbC4nLCAvLyBUT0RPOiBjaGVjayB0cmFuc2xhdGlvblxuICAgICd0YXBfaGVscGVyX19wcm9tcHQnOiAnwqFUb2NhIHVuIHDDoXJyYWZvIHBhcmEgb3BpbmFyIScsXG4gICAgJ3RhcF9oZWxwZXJfX2Nsb3NlJzogJ1ZvbHZlcicsXG4gICAgJ2NvbnRlbnRfcmVjX3dpZGdldF9fdGl0bGUnOiAnUmVhY2Npb25lcyBkZSBsYSBnZW50ZScgLy8gVE9ETzogY2hlY2sgdHJhbnNsYXRpb25cbn07IiwidmFyIEFwcE1vZGUgPSByZXF1aXJlKCcuL2FwcC1tb2RlJyk7XG52YXIgR3JvdXBTZXR0aW5ncyA9IHJlcXVpcmUoJy4uL2dyb3VwLXNldHRpbmdzJyk7XG5cbnZhciBFbmdsaXNoTWVzc2FnZXMgPSByZXF1aXJlKCcuL21lc3NhZ2VzLWVuJyk7XG52YXIgU3BhbmlzaE1lc3NhZ2VzID0gcmVxdWlyZSgnLi9tZXNzYWdlcy1lcycpO1xudmFsaWRhdGVUcmFuc2xhdGlvbnMoKTtcblxuZnVuY3Rpb24gdmFsaWRhdGVUcmFuc2xhdGlvbnMoKSB7XG4gICAgZm9yICh2YXIgZW5nbGlzaEtleSBpbiBFbmdsaXNoTWVzc2FnZXMpIHtcbiAgICAgICAgaWYgKEVuZ2xpc2hNZXNzYWdlcy5oYXNPd25Qcm9wZXJ0eShlbmdsaXNoS2V5KSkge1xuICAgICAgICAgICAgaWYgKCFTcGFuaXNoTWVzc2FnZXMuaGFzT3duUHJvcGVydHkoZW5nbGlzaEtleSkpIHtcbiAgICAgICAgICAgICAgICBpZiAoQXBwTW9kZS5vZmZsaW5lIHx8IEFwcE1vZGUuZGVidWcpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnQW50ZW5uYSB3YXJuaW5nOiBTcGFuaXNoIHRyYW5zbGF0aW9uIG1pc3NpbmcgZm9yIGtleSAnICsgZW5nbGlzaEtleSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBnZXRNZXNzYWdlKGtleSwgdmFsdWVzKSB7XG4gICAgdmFyIHN0cmluZyA9IGdldExvY2FsaXplZFN0cmluZyhrZXksIEdyb3VwU2V0dGluZ3MuZ2V0KCkubGFuZ3VhZ2UoKSk7XG4gICAgaWYgKHZhbHVlcykge1xuICAgICAgICByZXR1cm4gZm9ybWF0KHN0cmluZywgdmFsdWVzKTtcbiAgICB9XG4gICAgcmV0dXJuIHN0cmluZztcbn1cblxuZnVuY3Rpb24gZ2V0TG9jYWxpemVkU3RyaW5nKGtleSwgbGFuZykge1xuICAgIHZhciBzdHJpbmc7XG4gICAgc3dpdGNoKGxhbmcpIHtcbiAgICAgICAgY2FzZSAnZW4nOlxuICAgICAgICAgICAgc3RyaW5nID0gRW5nbGlzaE1lc3NhZ2VzW2tleV07XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnZXMnOlxuICAgICAgICAgICAgc3RyaW5nID0gU3BhbmlzaE1lc3NhZ2VzW2tleV07XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIC8vIFRPRE86IHJldmlld1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ0ludmFsaWQgbGFuZ3VhZ2Ugc3BlY2lmaWVkIGluIEFudGVubmEgZ3JvdXAgc2V0dGluZ3MuJyk7XG4gICAgICAgICAgICBicmVhaztcbiAgICB9XG4gICAgaWYgKCFzdHJpbmcpIHsgLy8gRGVmYXVsdCB0byBFbmdsaXNoXG4gICAgICAgIHN0cmluZyA9IEVuZ2xpc2hNZXNzYWdlc1trZXldO1xuICAgIH1cbiAgICAvLyBUT0RPOiBoYW5kbGUgbWlzc2luZyBrZXlcbiAgICByZXR1cm4gc3RyaW5nO1xufVxuXG5mdW5jdGlvbiBmb3JtYXQoc3RyaW5nLCB2YWx1ZXMpIHtcbiAgICAvLyBQb3B1bGFyLCBzaW1wbGUgYWxnb3JpdGhtIGZyb20gaHR0cDovL2phdmFzY3JpcHQuY3JvY2tmb3JkLmNvbS9yZW1lZGlhbC5odG1sXG4gICAgcmV0dXJuIHN0cmluZy5yZXBsYWNlKFxuICAgICAgICAvXFx7KFtee31dKilcXH0vZyxcbiAgICAgICAgZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgICAgIHZhciByID0gdmFsdWVzW2JdO1xuICAgICAgICAgICAgcmV0dXJuIHR5cGVvZiByID09PSAnc3RyaW5nJyB8fCB0eXBlb2YgciA9PT0gJ251bWJlcicgPyByIDogYTtcbiAgICAgICAgfVxuICAgICk7XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBnZXRNZXNzYWdlOiBnZXRNZXNzYWdlXG59OyIsInZhciAkOyByZXF1aXJlKCcuL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xuXG5mdW5jdGlvbiBtYWtlTW92ZWFibGUoJGVsZW1lbnQsICRkcmFnSGFuZGxlKSB7XG4gICAgJGRyYWdIYW5kbGUub24oJ21vdXNlZG93bi5hbnRlbm5hJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdmFyIG9mZnNldFggPSBldmVudC5wYWdlWCAtICRkcmFnSGFuZGxlLm9mZnNldCgpLmxlZnQ7XG4gICAgICAgIHZhciBvZmZzZXRZID0gZXZlbnQucGFnZVkgLSAkZHJhZ0hhbmRsZS5vZmZzZXQoKS50b3A7XG4gICAgICAgICQoZG9jdW1lbnQpLm9uKCdtb3VzZXVwLmFudGVubmEnLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgJChkb2N1bWVudCkub2ZmKCdtb3VzZW1vdmUuYW50ZW5uYScpO1xuICAgICAgICB9KTtcbiAgICAgICAgJChkb2N1bWVudCkub24oJ21vdXNlbW92ZS5hbnRlbm5hJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgICRlbGVtZW50LmNzcyh7XG4gICAgICAgICAgICAgICAgdG9wOiBldmVudC5wYWdlWSAtIG9mZnNldFksXG4gICAgICAgICAgICAgICAgbGVmdDogZXZlbnQucGFnZVggLSBvZmZzZXRYXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIG1ha2VNb3ZlYWJsZTogbWFrZU1vdmVhYmxlXG59OyIsInZhciAkOyByZXF1aXJlKCcuL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIENhbGxiYWNrU3VwcG9ydCA9IHJlcXVpcmUoJy4vY2FsbGJhY2stc3VwcG9ydCcpO1xudmFyIFJhbmdlID0gcmVxdWlyZSgnLi9yYW5nZScpO1xudmFyIFdpZGdldEJ1Y2tldCA9IHJlcXVpcmUoJy4vd2lkZ2V0LWJ1Y2tldCcpO1xuXG4vLyBUT0RPOiBkZXRlY3Qgd2hldGhlciB0aGUgYnJvd3NlciBzdXBwb3J0cyBNdXRhdGlvbk9ic2VydmVyIGFuZCBmYWxsYmFjayB0byBNdXRhdGlvbnMgRXZlbnRzXG5cbnZhciBhZGRpdGlvbkxpc3RlbmVyO1xudmFyIHJlbW92YWxMaXN0ZW5lcjtcblxudmFyIGF0dHJpYnV0ZU9ic2VydmVycyA9IFtdO1xuXG5mdW5jdGlvbiBhZGRBZGRpdGlvbkxpc3RlbmVyKGNhbGxiYWNrKSB7XG4gICAgaWYgKCFhZGRpdGlvbkxpc3RlbmVyKSB7XG4gICAgICAgIGFkZGl0aW9uTGlzdGVuZXIgPSBjcmVhdGVBZGRpdGlvbkxpc3RlbmVyKCk7XG4gICAgfVxuICAgIGFkZGl0aW9uTGlzdGVuZXIuYWRkQ2FsbGJhY2soY2FsbGJhY2spO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVBZGRpdGlvbkxpc3RlbmVyKCkge1xuICAgIHZhciBjYWxsYmFja1N1cHBvcnQgPSBDYWxsYmFja1N1cHBvcnQuY3JlYXRlKCk7XG4gICAgdmFyIG9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoZnVuY3Rpb24obXV0YXRpb25SZWNvcmRzKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbXV0YXRpb25SZWNvcmRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgYWRkZWRFbGVtZW50cyA9IGZpbHRlcmVkRWxlbWVudHMobXV0YXRpb25SZWNvcmRzW2ldLmFkZGVkTm9kZXMpO1xuICAgICAgICAgICAgaWYgKGFkZGVkRWxlbWVudHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHZhciBjYWxsYmFja3MgPSBjYWxsYmFja1N1cHBvcnQuZ2V0KCk7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBjYWxsYmFja3MubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2tzW2pdKGFkZGVkRWxlbWVudHMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHZhciBib2R5ID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2JvZHknKVswXTtcbiAgICBvYnNlcnZlci5vYnNlcnZlKGJvZHksIHtcbiAgICAgICAgY2hpbGRMaXN0OiB0cnVlLFxuICAgICAgICBhdHRyaWJ1dGVzOiBmYWxzZSxcbiAgICAgICAgY2hhcmFjdGVyRGF0YTogZmFsc2UsXG4gICAgICAgIHN1YnRyZWU6IHRydWUsXG4gICAgICAgIGF0dHJpYnV0ZU9sZFZhbHVlOiBmYWxzZSxcbiAgICAgICAgY2hhcmFjdGVyRGF0YU9sZFZhbHVlOiBmYWxzZVxuICAgIH0pO1xuICAgIHJldHVybiB7XG4gICAgICAgIHRlYXJkb3duOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrU3VwcG9ydC50ZWFyZG93bigpO1xuICAgICAgICAgICAgb2JzZXJ2ZXIuZGlzY29ubmVjdCgpO1xuICAgICAgICB9LFxuICAgICAgICBhZGRDYWxsYmFjazogZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGNhbGxiYWNrU3VwcG9ydC5hZGQoY2FsbGJhY2spO1xuICAgICAgICB9LFxuICAgICAgICByZW1vdmVDYWxsYmFjazogZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGNhbGxiYWNrU3VwcG9ydC5yZW1vdmUoY2FsbGJhY2spO1xuICAgICAgICB9XG4gICAgfTtcbn1cblxuZnVuY3Rpb24gYWRkUmVtb3ZhbExpc3RlbmVyKGNhbGxiYWNrKSB7XG4gICAgaWYgKCFyZW1vdmFsTGlzdGVuZXIpIHtcbiAgICAgICAgcmVtb3ZhbExpc3RlbmVyID0gY3JlYXRlUmVtb3ZhbExpc3RlbmVyKCk7XG4gICAgfVxuICAgIHJlbW92YWxMaXN0ZW5lci5hZGRDYWxsYmFjayhjYWxsYmFjayk7XG59XG5cbmZ1bmN0aW9uIHJlbW92ZVJlbW92YWxMaXN0ZW5lcihjYWxsYmFjaykge1xuICAgIGlmIChyZW1vdmFsTGlzdGVuZXIpIHtcbiAgICAgICAgcmVtb3ZhbExpc3RlbmVyLnJlbW92ZUNhbGxiYWNrKGNhbGxiYWNrKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVJlbW92YWxMaXN0ZW5lcigpIHtcbiAgICB2YXIgY2FsbGJhY2tTdXBwb3J0ID0gQ2FsbGJhY2tTdXBwb3J0LmNyZWF0ZSgpO1xuICAgIHZhciBvYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKGZ1bmN0aW9uKG11dGF0aW9uUmVjb3Jkcykge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG11dGF0aW9uUmVjb3Jkcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIHJlbW92ZWRFbGVtZW50cyA9IGZpbHRlcmVkRWxlbWVudHMobXV0YXRpb25SZWNvcmRzW2ldLnJlbW92ZWROb2Rlcyk7XG4gICAgICAgICAgICBpZiAocmVtb3ZlZEVsZW1lbnRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICB2YXIgY2FsbGJhY2tzID0gY2FsbGJhY2tTdXBwb3J0LmdldCgpO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgY2FsbGJhY2tzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrc1tqXShyZW1vdmVkRWxlbWVudHMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHZhciBib2R5ID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2JvZHknKVswXTtcbiAgICBvYnNlcnZlci5vYnNlcnZlKGJvZHksIHtcbiAgICAgICAgY2hpbGRMaXN0OiB0cnVlLFxuICAgICAgICBhdHRyaWJ1dGVzOiBmYWxzZSxcbiAgICAgICAgY2hhcmFjdGVyRGF0YTogZmFsc2UsXG4gICAgICAgIHN1YnRyZWU6IHRydWUsXG4gICAgICAgIGF0dHJpYnV0ZU9sZFZhbHVlOiBmYWxzZSxcbiAgICAgICAgY2hhcmFjdGVyRGF0YU9sZFZhbHVlOiBmYWxzZVxuICAgIH0pO1xuICAgIHJldHVybiB7XG4gICAgICAgIHRlYXJkb3duOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrU3VwcG9ydC50ZWFyZG93bigpO1xuICAgICAgICAgICAgb2JzZXJ2ZXIuZGlzY29ubmVjdCgpO1xuICAgICAgICB9LFxuICAgICAgICBhZGRDYWxsYmFjazogZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGNhbGxiYWNrU3VwcG9ydC5hZGQoY2FsbGJhY2spO1xuICAgICAgICB9LFxuICAgICAgICByZW1vdmVDYWxsYmFjazogZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGNhbGxiYWNrU3VwcG9ydC5yZW1vdmUoY2FsbGJhY2spO1xuICAgICAgICB9XG4gICAgfTtcbn1cblxuLy8gRmlsdGVyIHRoZSBzZXQgb2Ygbm9kZXMgdG8gZWxpbWluYXRlIGFueXRoaW5nIGluc2lkZSBvdXIgb3duIERPTSBlbGVtZW50cyAob3RoZXJ3aXNlLCB3ZSBnZW5lcmF0ZSBhIHRvbiBvZiBjaGF0dGVyKVxuZnVuY3Rpb24gZmlsdGVyZWRFbGVtZW50cyhub2RlTGlzdCkge1xuICAgIHZhciBmaWx0ZXJlZCA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbm9kZUxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIG5vZGUgPSBub2RlTGlzdFtpXTtcbiAgICAgICAgaWYgKG5vZGUubm9kZVR5cGUgPT09IDEpIHsgLy8gT25seSBlbGVtZW50IG5vZGVzLiAoaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL05vZGUvbm9kZVR5cGUpXG4gICAgICAgICAgICB2YXIgJGVsZW1lbnQgPSAkKG5vZGUpO1xuICAgICAgICAgICAgaWYgKCRlbGVtZW50LmNsb3Nlc3QoUmFuZ2UuSElHSExJR0hUX1NFTEVDVE9SICsgJywgLmFudGVubmEsICcgKyBXaWRnZXRCdWNrZXQuc2VsZWN0b3IoKSkubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgZmlsdGVyZWQucHVzaCgkZWxlbWVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZpbHRlcmVkO1xufVxuXG5mdW5jdGlvbiBhZGRPbmVUaW1lRWxlbWVudFJlbW92YWxMaXN0ZW5lcihub2RlLCBjYWxsYmFjaykge1xuICAgIHZhciBsaXN0ZW5lciA9IGZ1bmN0aW9uKHJlbW92ZWRFbGVtZW50cykge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJlbW92ZWRFbGVtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIHJlbW92ZWRFbGVtZW50ID0gcmVtb3ZlZEVsZW1lbnRzW2ldLmdldCgwKTtcbiAgICAgICAgICAgIGlmIChyZW1vdmVkRWxlbWVudC5jb250YWlucyhub2RlKSkge1xuICAgICAgICAgICAgICAgIHJlbW92ZVJlbW92YWxMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG4gICAgYWRkUmVtb3ZhbExpc3RlbmVyKGxpc3RlbmVyKTtcbn1cblxuZnVuY3Rpb24gYWRkT25lVGltZUF0dHJpYnV0ZUxpc3RlbmVyKG5vZGUsIGF0dHJpYnV0ZXMsIGNhbGxiYWNrKSB7XG4gICAgdmFyIG9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoZnVuY3Rpb24obXV0YXRpb25SZWNvcmRzKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbXV0YXRpb25SZWNvcmRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgdGFyZ2V0ID0gbXV0YXRpb25SZWNvcmRzW2ldLnRhcmdldDtcbiAgICAgICAgICAgIGNhbGxiYWNrKHRhcmdldCk7XG4gICAgICAgICAgICBvYnNlcnZlci5kaXNjb25uZWN0KCk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICBvYnNlcnZlci5vYnNlcnZlKG5vZGUsIHtcbiAgICAgICAgY2hpbGRMaXN0OiBmYWxzZSxcbiAgICAgICAgYXR0cmlidXRlczogdHJ1ZSxcbiAgICAgICAgY2hhcmFjdGVyRGF0YTogZmFsc2UsXG4gICAgICAgIHN1YnRyZWU6IGZhbHNlLFxuICAgICAgICBhdHRyaWJ1dGVPbGRWYWx1ZTogZmFsc2UsXG4gICAgICAgIGNoYXJhY3RlckRhdGFPbGRWYWx1ZTogZmFsc2UsXG4gICAgICAgIGF0dHJpYnV0ZUZpbHRlcjogYXR0cmlidXRlc1xuICAgIH0pO1xuICAgIGF0dHJpYnV0ZU9ic2VydmVycy5wdXNoKG9ic2VydmVyKTtcbn1cblxuZnVuY3Rpb24gdGVhcmRvd24oKSB7XG4gICAgaWYgKGFkZGl0aW9uTGlzdGVuZXIpIHtcbiAgICAgICAgYWRkaXRpb25MaXN0ZW5lci50ZWFyZG93bigpO1xuICAgICAgICBhZGRpdGlvbkxpc3RlbmVyID0gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIGlmIChyZW1vdmFsTGlzdGVuZXIpIHtcbiAgICAgICAgcmVtb3ZhbExpc3RlbmVyLnRlYXJkb3duKCk7XG4gICAgICAgIHJlbW92YWxMaXN0ZW5lciA9IHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGF0dHJpYnV0ZU9ic2VydmVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICBhdHRyaWJ1dGVPYnNlcnZlcnNbaV0uZGlzY29ubmVjdCgpO1xuICAgIH1cbiAgICBhdHRyaWJ1dGVPYnNlcnZlcnMgPSBbXTtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGFkZEFkZGl0aW9uTGlzdGVuZXI6IGFkZEFkZGl0aW9uTGlzdGVuZXIsXG4gICAgYWRkUmVtb3ZhbExpc3RlbmVyOiBhZGRSZW1vdmFsTGlzdGVuZXIsXG4gICAgYWRkT25lVGltZUVsZW1lbnRSZW1vdmFsTGlzdGVuZXI6IGFkZE9uZVRpbWVFbGVtZW50UmVtb3ZhbExpc3RlbmVyLFxuICAgIGFkZE9uZVRpbWVBdHRyaWJ1dGVMaXN0ZW5lcjogYWRkT25lVGltZUF0dHJpYnV0ZUxpc3RlbmVyLFxuICAgIHRlYXJkb3duOiB0ZWFyZG93blxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcblxuZnVuY3Rpb24gY29tcHV0ZVBhZ2VUaXRsZSgkcGFnZSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciB0aXRsZVNlbGVjdG9yID0gZ3JvdXBTZXR0aW5ncy5wYWdlVGl0bGVTZWxlY3RvcigpO1xuICAgIGlmICghdGl0bGVTZWxlY3Rvcikge1xuICAgICAgICAvLyBCYWNrd2FyZHMgY29tcGF0aWJpbGl0eSBmb3Igc2l0ZXMgd2hpY2ggZGVwbG95ZWQgYmVmb3JlIHdlIGhhZCBhIHNlcGFyYXRlIHRpdGxlIHNlbGVjdG9yLlxuICAgICAgICB0aXRsZVNlbGVjdG9yID0gZ3JvdXBTZXR0aW5ncy5wYWdlVXJsU2VsZWN0b3IoKTtcbiAgICB9XG4gICAgdmFyIHBhZ2VUaXRsZSA9ICRwYWdlLmZpbmQodGl0bGVTZWxlY3RvcikudGV4dCgpLnRyaW0oKTtcbiAgICBpZiAocGFnZVRpdGxlID09PSAnJykge1xuICAgICAgICAvLyBJZiB3ZSBjb3VsZG4ndCBmaW5kIGEgdGl0bGUgYmFzZWQgb24gdGhlIGdyb3VwIHNldHRpbmdzLCBmYWxsYmFjayB0byBzb21lIGhhcmQtY29kZWQgYmVoYXZpb3IuXG4gICAgICAgIHBhZ2VUaXRsZSA9IGdldEF0dHJpYnV0ZVZhbHVlKCdtZXRhW3Byb3BlcnR5PVwib2c6dGl0bGVcIl0nLCAnY29udGVudCcpIHx8ICQoJ3RpdGxlJykudGV4dCgpLnRyaW0oKTtcbiAgICB9XG4gICAgcmV0dXJuIHBhZ2VUaXRsZTtcbn1cblxuZnVuY3Rpb24gY29tcHV0ZVRvcExldmVsUGFnZUltYWdlKGdyb3VwU2V0dGluZ3MpIHtcbiAgICByZXR1cm4gZ2V0QXR0cmlidXRlVmFsdWUoZ3JvdXBTZXR0aW5ncy5wYWdlSW1hZ2VTZWxlY3RvcigpLCBncm91cFNldHRpbmdzLnBhZ2VJbWFnZUF0dHJpYnV0ZSgpKTtcbn1cblxuZnVuY3Rpb24gY29tcHV0ZVBhZ2VBdXRob3IoZ3JvdXBTZXR0aW5ncykge1xuICAgIHJldHVybiBnZXRBdHRyaWJ1dGVWYWx1ZShncm91cFNldHRpbmdzLnBhZ2VBdXRob3JTZWxlY3RvcigpLCBncm91cFNldHRpbmdzLnBhZ2VBdXRob3JBdHRyaWJ1dGUoKSk7XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVQYWdlVG9waWNzKGdyb3VwU2V0dGluZ3MpIHtcbiAgICByZXR1cm4gZ2V0QXR0cmlidXRlVmFsdWUoZ3JvdXBTZXR0aW5ncy5wYWdlVG9waWNzU2VsZWN0b3IoKSwgZ3JvdXBTZXR0aW5ncy5wYWdlVG9waWNzQXR0cmlidXRlKCkpO1xufVxuXG5mdW5jdGlvbiBjb21wdXRlUGFnZVNpdGVTZWN0aW9uKGdyb3VwU2V0dGluZ3MpIHtcbiAgICByZXR1cm4gZ2V0QXR0cmlidXRlVmFsdWUoZ3JvdXBTZXR0aW5ncy5wYWdlU2l0ZVNlY3Rpb25TZWxlY3RvcigpLCBncm91cFNldHRpbmdzLnBhZ2VTaXRlU2VjdGlvbkF0dHJpYnV0ZSgpKTtcbn1cblxuZnVuY3Rpb24gZ2V0QXR0cmlidXRlVmFsdWUoZWxlbWVudFNlbGVjdG9yLCBhdHRyaWJ1dGVTZWxlY3Rvcikge1xuICAgIHZhciB2YWx1ZSA9ICcnO1xuICAgIGlmIChlbGVtZW50U2VsZWN0b3IgJiYgYXR0cmlidXRlU2VsZWN0b3IpIHtcbiAgICAgICAgdmFsdWUgPSAkKGVsZW1lbnRTZWxlY3RvcikuYXR0cihhdHRyaWJ1dGVTZWxlY3RvcikgfHwgJyc7XG4gICAgfVxuICAgIHJldHVybiB2YWx1ZS50cmltKCk7XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVUb3BMZXZlbENhbm9uaWNhbFVybChncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGNhbm9uaWNhbFVybCA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmLnNwbGl0KCcjJylbMF0udG9Mb3dlckNhc2UoKTtcbiAgICB2YXIgJGNhbm9uaWNhbExpbmsgPSAkKCdsaW5rW3JlbD1cImNhbm9uaWNhbFwiXScpO1xuICAgIGlmICgkY2Fub25pY2FsTGluay5sZW5ndGggPiAwICYmICRjYW5vbmljYWxMaW5rLmF0dHIoJ2hyZWYnKSkge1xuICAgICAgICB2YXIgb3ZlcnJpZGVVcmwgPSAkY2Fub25pY2FsTGluay5hdHRyKCdocmVmJykudHJpbSgpLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIHZhciBkb21haW4gPSAod2luZG93LmxvY2F0aW9uLnByb3RvY29sKycvLycrd2luZG93LmxvY2F0aW9uLmhvc3RuYW1lKycvJykudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgaWYgKG92ZXJyaWRlVXJsICE9PSBkb21haW4pIHsgLy8gZmFzdGNvIGZpeCAoc2luY2UgdGhleSBzb21ldGltZXMgcmV3cml0ZSB0aGVpciBjYW5vbmljYWwgdG8gc2ltcGx5IGJlIHRoZWlyIGRvbWFpbi4pXG4gICAgICAgICAgICBjYW5vbmljYWxVcmwgPSBvdmVycmlkZVVybDtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVtb3ZlU3ViZG9tYWluRnJvbVBhZ2VVcmwoY2Fub25pY2FsVXJsLCBncm91cFNldHRpbmdzKTtcbn1cblxuZnVuY3Rpb24gY29tcHV0ZVBhZ2VFbGVtZW50VXJsKCRwYWdlRWxlbWVudCwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBwYWdlVXJsU2VsZWN0b3IgPSBncm91cFNldHRpbmdzLnBhZ2VVcmxTZWxlY3RvcigpO1xuICAgIHZhciAkcGFnZVVybEVsZW1lbnQgPSAkcGFnZUVsZW1lbnQuZmluZChwYWdlVXJsU2VsZWN0b3IpO1xuICAgIGlmIChwYWdlVXJsU2VsZWN0b3IpIHsgLy8gd2l0aCBhbiB1bmRlZmluZWQgc2VsZWN0b3IsIGFkZEJhY2sgd2lsbCBtYXRjaCBhbmQgYWx3YXlzIHJldHVybiB0aGUgaW5wdXQgZWxlbWVudCAodW5saWtlIGZpbmQoKSB3aGljaCByZXR1cm5zIGFuIGVtcHR5IG1hdGNoKVxuICAgICAgICAkcGFnZVVybEVsZW1lbnQgPSAkcGFnZVVybEVsZW1lbnQuYWRkQmFjayhwYWdlVXJsU2VsZWN0b3IpO1xuICAgIH1cbiAgICB2YXIgdXJsID0gJHBhZ2VVcmxFbGVtZW50LmF0dHIoZ3JvdXBTZXR0aW5ncy5wYWdlVXJsQXR0cmlidXRlKCkpO1xuICAgIGlmICh1cmwpIHtcbiAgICAgICAgdXJsID0gcmVtb3ZlU3ViZG9tYWluRnJvbVBhZ2VVcmwodXJsLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgdmFyIG9yaWdpbiA9IHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4gfHwgd2luZG93LmxvY2F0aW9uLnByb3RvY29sICsgXCIvL1wiICsgd2luZG93LmxvY2F0aW9uLmhvc3RuYW1lICsgKHdpbmRvdy5sb2NhdGlvbi5wb3J0ID8gJzonICsgd2luZG93LmxvY2F0aW9uLnBvcnQ6ICcnKTtcbiAgICAgICAgaWYgKHVybC5pbmRleE9mKG9yaWdpbikgIT09IDAgJiYgLy8gTm90IGFuIGFic29sdXRlIFVSTFxuICAgICAgICAgICAgICAgICF1cmwuc3Vic3RyKDAsMikgIT09ICcvLycgJiYgLy8gTm90IHByb3RvY29sIHJlbGF0aXZlXG4gICAgICAgICAgICAgICAgIWdyb3VwU2V0dGluZ3MudXJsLmlnbm9yZVN1YmRvbWFpbigpKSB7IC8vIEFuZCB3ZSB3ZXJlbid0IG5vdCBpZ25vcmluZyB0aGUgc3ViZG9tYWluXG4gICAgICAgICAgICBpZiAodXJsLnN1YnN0cigwLDEpID09ICcvJykge1xuICAgICAgICAgICAgICAgIHVybCA9IG9yaWdpbiArIHVybDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdXJsID0gb3JpZ2luICsgd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lICsgdXJsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB1cmw7XG4gICAgfVxuICAgIHJldHVybiBjb21wdXRlVG9wTGV2ZWxDYW5vbmljYWxVcmwoZ3JvdXBTZXR0aW5ncyk7XG59XG5cbi8vIFRPRE8gY29waWVkIGZyb20gZW5nYWdlX2Z1bGwuIFJldmlldy5cbmZ1bmN0aW9uIHJlbW92ZVN1YmRvbWFpbkZyb21QYWdlVXJsKHVybCwgZ3JvdXBTZXR0aW5ncykge1xuICAgIC8vIEFOVC5hY3Rpb25zLnJlbW92ZVN1YmRvbWFpbkZyb21QYWdlVXJsOlxuICAgIC8vIGlmIFwiaWdub3JlX3N1YmRvbWFpblwiIGlzIGNoZWNrZWQgaW4gc2V0dGluZ3MsIEFORCB0aGV5IHN1cHBseSBhIFRMRCxcbiAgICAvLyB0aGVuIG1vZGlmeSB0aGUgcGFnZSBhbmQgY2Fub25pY2FsIFVSTHMgaGVyZS5cbiAgICAvLyBoYXZlIHRvIGhhdmUgdGhlbSBzdXBwbHkgb25lIGJlY2F1c2UgdGhlcmUgYXJlIHRvbyBtYW55IHZhcmlhdGlvbnMgdG8gcmVsaWFibHkgc3RyaXAgc3ViZG9tYWlucyAgKC5jb20sIC5pcywgLmNvbS5hciwgLmNvLnVrLCBldGMpXG4gICAgaWYgKGdyb3VwU2V0dGluZ3MudXJsLmlnbm9yZVN1YmRvbWFpbigpID09IHRydWUgJiYgZ3JvdXBTZXR0aW5ncy51cmwuY2Fub25pY2FsRG9tYWluKCkpIHtcbiAgICAgICAgdmFyIEhPU1RET01BSU4gPSAvWy1cXHddK1xcLig/OlstXFx3XStcXC54bi0tWy1cXHddK3xbLVxcd117Mix9fFstXFx3XStcXC5bLVxcd117Mn0pJC9pO1xuICAgICAgICB2YXIgc3JjQXJyYXkgPSB1cmwuc3BsaXQoJy8nKTtcblxuICAgICAgICB2YXIgcHJvdG9jb2wgPSBzcmNBcnJheVswXTtcbiAgICAgICAgc3JjQXJyYXkuc3BsaWNlKDAsMyk7XG5cbiAgICAgICAgdmFyIHJldHVyblVybCA9IHByb3RvY29sICsgJy8vJyArIGdyb3VwU2V0dGluZ3MudXJsLmNhbm9uaWNhbERvbWFpbigpICsgJy8nICsgc3JjQXJyYXkuam9pbignLycpO1xuXG4gICAgICAgIHJldHVybiByZXR1cm5Vcmw7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHVybDtcbiAgICB9XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjb21wdXRlUGFnZVVybDogY29tcHV0ZVBhZ2VFbGVtZW50VXJsLFxuICAgIGNvbXB1dGVQYWdlVGl0bGU6IGNvbXB1dGVQYWdlVGl0bGUsXG4gICAgY29tcHV0ZVRvcExldmVsUGFnZUltYWdlOiBjb21wdXRlVG9wTGV2ZWxQYWdlSW1hZ2UsXG4gICAgY29tcHV0ZVBhZ2VBdXRob3I6IGNvbXB1dGVQYWdlQXV0aG9yLFxuICAgIGNvbXB1dGVQYWdlVG9waWNzOiBjb21wdXRlUGFnZVRvcGljcyxcbiAgICBjb21wdXRlUGFnZVNpdGVTZWN0aW9uOiBjb21wdXRlUGFnZVNpdGVTZWN0aW9uXG59OyIsIi8vIEFudGVubmEgY2hhbmdlcyBmcm9tIG9yaWdpbmFsIHNvdXJjZSBtYXJrZWQgd2l0aCBPUklHSU5BTFxuLy8gU2VlIHRoZSBpc3N1ZSB3ZSBuZWVkZWQgdG8gd29yayBhcm91bmQgaGVyZTogaHR0cHM6Ly9naXRodWIuY29tL3JhY3RpdmVqcy9yYWN0aXZlLWV2ZW50cy10YXAvaXNzdWVzLzhcblxuLy8gVGFwL2Zhc3RjbGljayBldmVudCBwbHVnaW4gZm9yIFJhY3RpdmUuanMgLSBlbGltaW5hdGVzIHRoZSAzMDBtcyBkZWxheSBvbiB0b3VjaC1lbmFibGVkIGRldmljZXMsIGFuZCBub3JtYWxpc2VzXG4vLyBhY3Jvc3MgbW91c2UsIHRvdWNoIGFuZCBwb2ludGVyIGV2ZW50cy5cbi8vIEF1dGhvcjogUmljaCBIYXJyaXNcbi8vIExpY2Vuc2U6IE1JVFxuLy8gU291cmNlOiBodHRwczovL2dpdGh1Yi5jb20vcmFjdGl2ZWpzL3JhY3RpdmUtZXZlbnRzLXRhcFxuKGZ1bmN0aW9uIChnbG9iYWwsIGZhY3RvcnkpIHtcblx0bW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7XG59KHRoaXMsIGZ1bmN0aW9uICgpIHsgJ3VzZSBzdHJpY3QnO1xuXG5cdHZhciBESVNUQU5DRV9USFJFU0hPTEQgPSA1OyAvLyBtYXhpbXVtIHBpeGVscyBwb2ludGVyIGNhbiBtb3ZlIGJlZm9yZSBjYW5jZWxcblx0dmFyIFRJTUVfVEhSRVNIT0xEID0gNDAwOyAvLyBtYXhpbXVtIG1pbGxpc2Vjb25kcyBiZXR3ZWVuIGRvd24gYW5kIHVwIGJlZm9yZSBjYW5jZWxcblxuXHRmdW5jdGlvbiB0YXAobm9kZSwgY2FsbGJhY2spIHtcblx0XHRyZXR1cm4gbmV3IFRhcEhhbmRsZXIobm9kZSwgY2FsbGJhY2spO1xuXHR9XG5cblx0ZnVuY3Rpb24gVGFwSGFuZGxlcihub2RlLCBjYWxsYmFjaykge1xuXHRcdHRoaXMubm9kZSA9IG5vZGU7XG5cdFx0dGhpcy5jYWxsYmFjayA9IGNhbGxiYWNrO1xuXG5cdFx0dGhpcy5wcmV2ZW50TW91c2Vkb3duRXZlbnRzID0gZmFsc2U7XG5cblx0XHR0aGlzLmJpbmQobm9kZSk7XG5cdH1cblxuXHRUYXBIYW5kbGVyLnByb3RvdHlwZSA9IHtcblx0XHRiaW5kOiBmdW5jdGlvbiBiaW5kKG5vZGUpIHtcblx0XHRcdC8vIGxpc3RlbiBmb3IgbW91c2UvcG9pbnRlciBldmVudHMuLi5cblx0XHRcdC8vIE9SSUdJTkFMIGlmICh3aW5kb3cubmF2aWdhdG9yLnBvaW50ZXJFbmFibGVkKSB7XG5cdFx0XHRpZiAod2luZG93Lm5hdmlnYXRvci5wb2ludGVyRW5hYmxlZCAmJiAhKCdvbnRvdWNoc3RhcnQnIGluIHdpbmRvdykpIHtcblx0XHRcdFx0bm9kZS5hZGRFdmVudExpc3RlbmVyKCdwb2ludGVyZG93bicsIGhhbmRsZU1vdXNlZG93biwgZmFsc2UpO1xuXHRcdFx0Ly8gT1JJR0lOQUwgfSBlbHNlIGlmICh3aW5kb3cubmF2aWdhdG9yLm1zUG9pbnRlckVuYWJsZWQpIHtcblx0XHRcdH0gZWxzZSBpZiAod2luZG93Lm5hdmlnYXRvci5tc1BvaW50ZXJFbmFibGVkICYmICEoJ29udG91Y2hzdGFydCcgaW4gd2luZG93KSkge1xuXHRcdFx0XHRub2RlLmFkZEV2ZW50TGlzdGVuZXIoJ01TUG9pbnRlckRvd24nLCBoYW5kbGVNb3VzZWRvd24sIGZhbHNlKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdG5vZGUuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgaGFuZGxlTW91c2Vkb3duLCBmYWxzZSk7XG5cdFx0XHR9XG5cblx0XHRcdC8vIC4uLmFuZCB0b3VjaCBldmVudHNcblx0XHRcdG5vZGUuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIGhhbmRsZVRvdWNoc3RhcnQsIGZhbHNlKTtcblxuXHRcdFx0Ly8gbmF0aXZlIGJ1dHRvbnMsIGFuZCA8aW5wdXQgdHlwZT0nYnV0dG9uJz4gZWxlbWVudHMsIHNob3VsZCBmaXJlIGEgdGFwIGV2ZW50XG5cdFx0XHQvLyB3aGVuIHRoZSBzcGFjZSBrZXkgaXMgcHJlc3NlZFxuXHRcdFx0aWYgKG5vZGUudGFnTmFtZSA9PT0gJ0JVVFRPTicgfHwgbm9kZS50eXBlID09PSAnYnV0dG9uJykge1xuXHRcdFx0XHRub2RlLmFkZEV2ZW50TGlzdGVuZXIoJ2ZvY3VzJywgaGFuZGxlRm9jdXMsIGZhbHNlKTtcblx0XHRcdH1cblxuXHRcdFx0bm9kZS5fX3RhcF9oYW5kbGVyX18gPSB0aGlzO1xuXHRcdH0sXG5cdFx0ZmlyZTogZnVuY3Rpb24gZmlyZShldmVudCwgeCwgeSkge1xuXHRcdFx0dGhpcy5jYWxsYmFjayh7XG5cdFx0XHRcdG5vZGU6IHRoaXMubm9kZSxcblx0XHRcdFx0b3JpZ2luYWw6IGV2ZW50LFxuXHRcdFx0XHR4OiB4LFxuXHRcdFx0XHR5OiB5XG5cdFx0XHR9KTtcblx0XHR9LFxuXHRcdG1vdXNlZG93bjogZnVuY3Rpb24gbW91c2Vkb3duKGV2ZW50KSB7XG5cdFx0XHR2YXIgX3RoaXMgPSB0aGlzO1xuXG5cdFx0XHRpZiAodGhpcy5wcmV2ZW50TW91c2Vkb3duRXZlbnRzKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGV2ZW50LndoaWNoICE9PSB1bmRlZmluZWQgJiYgZXZlbnQud2hpY2ggIT09IDEpIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHR2YXIgeCA9IGV2ZW50LmNsaWVudFg7XG5cdFx0XHR2YXIgeSA9IGV2ZW50LmNsaWVudFk7XG5cblx0XHRcdC8vIFRoaXMgd2lsbCBiZSBudWxsIGZvciBtb3VzZSBldmVudHMuXG5cdFx0XHR2YXIgcG9pbnRlcklkID0gZXZlbnQucG9pbnRlcklkO1xuXG5cdFx0XHR2YXIgaGFuZGxlTW91c2V1cCA9IGZ1bmN0aW9uIGhhbmRsZU1vdXNldXAoZXZlbnQpIHtcblx0XHRcdFx0aWYgKGV2ZW50LnBvaW50ZXJJZCAhPSBwb2ludGVySWQpIHtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRfdGhpcy5maXJlKGV2ZW50LCB4LCB5KTtcblx0XHRcdFx0Y2FuY2VsKCk7XG5cdFx0XHR9O1xuXG5cdFx0XHR2YXIgaGFuZGxlTW91c2Vtb3ZlID0gZnVuY3Rpb24gaGFuZGxlTW91c2Vtb3ZlKGV2ZW50KSB7XG5cdFx0XHRcdGlmIChldmVudC5wb2ludGVySWQgIT0gcG9pbnRlcklkKSB7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKE1hdGguYWJzKGV2ZW50LmNsaWVudFggLSB4KSA+PSBESVNUQU5DRV9USFJFU0hPTEQgfHwgTWF0aC5hYnMoZXZlbnQuY2xpZW50WSAtIHkpID49IERJU1RBTkNFX1RIUkVTSE9MRCkge1xuXHRcdFx0XHRcdGNhbmNlbCgpO1xuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXG5cdFx0XHR2YXIgY2FuY2VsID0gZnVuY3Rpb24gY2FuY2VsKCkge1xuXHRcdFx0XHRfdGhpcy5ub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ01TUG9pbnRlclVwJywgaGFuZGxlTW91c2V1cCwgZmFsc2UpO1xuXHRcdFx0XHRkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdNU1BvaW50ZXJNb3ZlJywgaGFuZGxlTW91c2Vtb3ZlLCBmYWxzZSk7XG5cdFx0XHRcdGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ01TUG9pbnRlckNhbmNlbCcsIGNhbmNlbCwgZmFsc2UpO1xuXHRcdFx0XHRfdGhpcy5ub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJ1cCcsIGhhbmRsZU1vdXNldXAsIGZhbHNlKTtcblx0XHRcdFx0ZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigncG9pbnRlcm1vdmUnLCBoYW5kbGVNb3VzZW1vdmUsIGZhbHNlKTtcblx0XHRcdFx0ZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigncG9pbnRlcmNhbmNlbCcsIGNhbmNlbCwgZmFsc2UpO1xuXHRcdFx0XHRfdGhpcy5ub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlTW91c2V1cCwgZmFsc2UpO1xuXHRcdFx0XHRkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBoYW5kbGVNb3VzZW1vdmUsIGZhbHNlKTtcblx0XHRcdH07XG5cblx0XHRcdGlmICh3aW5kb3cubmF2aWdhdG9yLnBvaW50ZXJFbmFibGVkKSB7XG5cdFx0XHRcdHRoaXMubm9kZS5hZGRFdmVudExpc3RlbmVyKCdwb2ludGVydXAnLCBoYW5kbGVNb3VzZXVwLCBmYWxzZSk7XG5cdFx0XHRcdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJtb3ZlJywgaGFuZGxlTW91c2Vtb3ZlLCBmYWxzZSk7XG5cdFx0XHRcdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJjYW5jZWwnLCBjYW5jZWwsIGZhbHNlKTtcblx0XHRcdH0gZWxzZSBpZiAod2luZG93Lm5hdmlnYXRvci5tc1BvaW50ZXJFbmFibGVkKSB7XG5cdFx0XHRcdHRoaXMubm9kZS5hZGRFdmVudExpc3RlbmVyKCdNU1BvaW50ZXJVcCcsIGhhbmRsZU1vdXNldXAsIGZhbHNlKTtcblx0XHRcdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignTVNQb2ludGVyTW92ZScsIGhhbmRsZU1vdXNlbW92ZSwgZmFsc2UpO1xuXHRcdFx0XHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdNU1BvaW50ZXJDYW5jZWwnLCBjYW5jZWwsIGZhbHNlKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRoaXMubm9kZS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZU1vdXNldXAsIGZhbHNlKTtcblx0XHRcdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgaGFuZGxlTW91c2Vtb3ZlLCBmYWxzZSk7XG5cdFx0XHR9XG5cblx0XHRcdHNldFRpbWVvdXQoY2FuY2VsLCBUSU1FX1RIUkVTSE9MRCk7XG5cdFx0fSxcblx0XHR0b3VjaGRvd246IGZ1bmN0aW9uIHRvdWNoZG93bigpIHtcblx0XHRcdHZhciBfdGhpczIgPSB0aGlzO1xuXG5cdFx0XHR2YXIgdG91Y2ggPSBldmVudC50b3VjaGVzWzBdO1xuXG5cdFx0XHR2YXIgeCA9IHRvdWNoLmNsaWVudFg7XG5cdFx0XHR2YXIgeSA9IHRvdWNoLmNsaWVudFk7XG5cblx0XHRcdHZhciBmaW5nZXIgPSB0b3VjaC5pZGVudGlmaWVyO1xuXG5cdFx0XHR2YXIgaGFuZGxlVG91Y2h1cCA9IGZ1bmN0aW9uIGhhbmRsZVRvdWNodXAoZXZlbnQpIHtcblx0XHRcdFx0dmFyIHRvdWNoID0gZXZlbnQuY2hhbmdlZFRvdWNoZXNbMF07XG5cblx0XHRcdFx0aWYgKHRvdWNoLmlkZW50aWZpZXIgIT09IGZpbmdlcikge1xuXHRcdFx0XHRcdGNhbmNlbCgpO1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7IC8vIHByZXZlbnQgY29tcGF0aWJpbGl0eSBtb3VzZSBldmVudFxuXG5cdFx0XHRcdC8vIGZvciB0aGUgYmVuZWZpdCBvZiBtb2JpbGUgRmlyZWZveCBhbmQgb2xkIEFuZHJvaWQgYnJvd3NlcnMsIHdlIG5lZWQgdGhpcyBhYnN1cmQgaGFjay5cblx0XHRcdFx0X3RoaXMyLnByZXZlbnRNb3VzZWRvd25FdmVudHMgPSB0cnVlO1xuXHRcdFx0XHRjbGVhclRpbWVvdXQoX3RoaXMyLnByZXZlbnRNb3VzZWRvd25UaW1lb3V0KTtcblxuXHRcdFx0XHRfdGhpczIucHJldmVudE1vdXNlZG93blRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHRfdGhpczIucHJldmVudE1vdXNlZG93bkV2ZW50cyA9IGZhbHNlO1xuXHRcdFx0XHR9LCA0MDApO1xuXG5cdFx0XHRcdF90aGlzMi5maXJlKGV2ZW50LCB4LCB5KTtcblx0XHRcdFx0Y2FuY2VsKCk7XG5cdFx0XHR9O1xuXG5cdFx0XHR2YXIgaGFuZGxlVG91Y2htb3ZlID0gZnVuY3Rpb24gaGFuZGxlVG91Y2htb3ZlKGV2ZW50KSB7XG5cdFx0XHRcdGlmIChldmVudC50b3VjaGVzLmxlbmd0aCAhPT0gMSB8fCBldmVudC50b3VjaGVzWzBdLmlkZW50aWZpZXIgIT09IGZpbmdlcikge1xuXHRcdFx0XHRcdGNhbmNlbCgpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dmFyIHRvdWNoID0gZXZlbnQudG91Y2hlc1swXTtcblx0XHRcdFx0aWYgKE1hdGguYWJzKHRvdWNoLmNsaWVudFggLSB4KSA+PSBESVNUQU5DRV9USFJFU0hPTEQgfHwgTWF0aC5hYnModG91Y2guY2xpZW50WSAtIHkpID49IERJU1RBTkNFX1RIUkVTSE9MRCkge1xuXHRcdFx0XHRcdGNhbmNlbCgpO1xuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXG5cdFx0XHR2YXIgY2FuY2VsID0gZnVuY3Rpb24gY2FuY2VsKCkge1xuXHRcdFx0XHRfdGhpczIubm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIGhhbmRsZVRvdWNodXAsIGZhbHNlKTtcblx0XHRcdFx0d2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIGhhbmRsZVRvdWNobW92ZSwgZmFsc2UpO1xuXHRcdFx0XHR3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hjYW5jZWwnLCBjYW5jZWwsIGZhbHNlKTtcblx0XHRcdH07XG5cblx0XHRcdHRoaXMubm9kZS5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIGhhbmRsZVRvdWNodXAsIGZhbHNlKTtcblx0XHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCBoYW5kbGVUb3VjaG1vdmUsIGZhbHNlKTtcblx0XHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGNhbmNlbCcsIGNhbmNlbCwgZmFsc2UpO1xuXG5cdFx0XHRzZXRUaW1lb3V0KGNhbmNlbCwgVElNRV9USFJFU0hPTEQpO1xuXHRcdH0sXG5cdFx0dGVhcmRvd246IGZ1bmN0aW9uIHRlYXJkb3duKCkge1xuXHRcdFx0dmFyIG5vZGUgPSB0aGlzLm5vZGU7XG5cblx0XHRcdG5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcigncG9pbnRlcmRvd24nLCBoYW5kbGVNb3VzZWRvd24sIGZhbHNlKTtcblx0XHRcdG5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcignTVNQb2ludGVyRG93bicsIGhhbmRsZU1vdXNlZG93biwgZmFsc2UpO1xuXHRcdFx0bm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBoYW5kbGVNb3VzZWRvd24sIGZhbHNlKTtcblx0XHRcdG5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIGhhbmRsZVRvdWNoc3RhcnQsIGZhbHNlKTtcblx0XHRcdG5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcignZm9jdXMnLCBoYW5kbGVGb2N1cywgZmFsc2UpO1xuXHRcdH1cblx0fTtcblxuXHRmdW5jdGlvbiBoYW5kbGVNb3VzZWRvd24oZXZlbnQpIHtcblx0XHR0aGlzLl9fdGFwX2hhbmRsZXJfXy5tb3VzZWRvd24oZXZlbnQpO1xuXHR9XG5cblx0ZnVuY3Rpb24gaGFuZGxlVG91Y2hzdGFydChldmVudCkge1xuXHRcdHRoaXMuX190YXBfaGFuZGxlcl9fLnRvdWNoZG93bihldmVudCk7XG5cdH1cblxuXHRmdW5jdGlvbiBoYW5kbGVGb2N1cygpIHtcblx0XHR0aGlzLmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBoYW5kbGVLZXlkb3duLCBmYWxzZSk7XG5cdFx0dGhpcy5hZGRFdmVudExpc3RlbmVyKCdibHVyJywgaGFuZGxlQmx1ciwgZmFsc2UpO1xuXHR9XG5cblx0ZnVuY3Rpb24gaGFuZGxlQmx1cigpIHtcblx0XHR0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBoYW5kbGVLZXlkb3duLCBmYWxzZSk7XG5cdFx0dGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKCdibHVyJywgaGFuZGxlQmx1ciwgZmFsc2UpO1xuXHR9XG5cblx0ZnVuY3Rpb24gaGFuZGxlS2V5ZG93bihldmVudCkge1xuXHRcdGlmIChldmVudC53aGljaCA9PT0gMzIpIHtcblx0XHRcdC8vIHNwYWNlIGtleVxuXHRcdFx0dGhpcy5fX3RhcF9oYW5kbGVyX18uZmlyZSgpO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiB0YXA7XG5cbn0pKTsiLCJ2YXIgUmFjdGl2ZUV2ZW50c1RhcCA9IHJlcXVpcmUoJy4vcmFjdGl2ZS1ldmVudHMtdGFwJyk7XG5cbnZhciBNZXNzYWdlcyA9IHJlcXVpcmUoJy4vbWVzc2FnZXMnKTtcblxudmFyIG5vQ29uZmxpY3Q7XG52YXIgbG9hZGVkUmFjdGl2ZTtcbnZhciBjYWxsYmFja3MgPSBbXTtcblxuLy8gQ2FwdHVyZSBhbnkgZ2xvYmFsIGluc3RhbmNlIG9mIFJhY3RpdmUgd2hpY2ggYWxyZWFkeSBleGlzdHMgYmVmb3JlIHdlIGxvYWQgb3VyIG93bi5cbmZ1bmN0aW9uIGFib3V0VG9Mb2FkKCkge1xuICAgIG5vQ29uZmxpY3QgPSB3aW5kb3cuUmFjdGl2ZTtcbn1cblxuLy8gUmVzdG9yZSB0aGUgZ2xvYmFsIGluc3RhbmNlIG9mIFJhY3RpdmUgKGlmIGFueSkgYW5kIHBhc3Mgb3V0IG91ciB2ZXJzaW9uIHRvIG91ciBjYWxsYmFja3NcbmZ1bmN0aW9uIGxvYWRlZCgpIHtcbiAgICBsb2FkZWRSYWN0aXZlID0gUmFjdGl2ZTtcbiAgICB3aW5kb3cuUmFjdGl2ZSA9IG5vQ29uZmxpY3Q7XG4gICAgbG9hZGVkUmFjdGl2ZS5kZWNvcmF0b3JzLmNzc3Jlc2V0ID0gY3NzUmVzZXREZWNvcmF0b3I7IC8vIE1ha2Ugb3VyIGNzcyByZXNldCBkZWNvcmF0b3IgYXZhaWxhYmxlIHRvIGFsbCBpbnN0YW5jZXNcbiAgICBsb2FkZWRSYWN0aXZlLmV2ZW50cy50YXAgPSBSYWN0aXZlRXZlbnRzVGFwOyAvLyBNYWtlIHRoZSAnb24tdGFwJyBldmVudCBwbHVnaW4gYXZhaWxhYmxlIHRvIGFsbCBpbnN0YW5jZXNcbiAgICBsb2FkZWRSYWN0aXZlLmRlZmF1bHRzLmRhdGEuZ2V0TWVzc2FnZSA9IE1lc3NhZ2VzLmdldE1lc3NhZ2U7IC8vIE1ha2UgZ2V0TWVzc2FnZSBhdmFpbGFibGUgdG8gYWxsIGluc3RhbmNlc1xuICAgIGxvYWRlZFJhY3RpdmUuZGVmYXVsdHMudHdvd2F5ID0gZmFsc2U7IC8vIENoYW5nZSB0aGUgZGVmYXVsdCB0byBkaXNhYmxlIHR3by13YXkgZGF0YSBiaW5kaW5ncy5cbiAgICBsb2FkZWRSYWN0aXZlLkRFQlVHID0gZmFsc2U7XG4gICAgbm90aWZ5Q2FsbGJhY2tzKCk7XG59XG5cbmZ1bmN0aW9uIGNzc1Jlc2V0RGVjb3JhdG9yKG5vZGUpIHtcbiAgICB0YWdOb2RlQW5kQ2hpbGRyZW4obm9kZSwgJ2FudGVubmEtcmVzZXQnKTtcbiAgICByZXR1cm4geyB0ZWFyZG93bjogZnVuY3Rpb24oKSB7fSB9O1xufVxuXG5mdW5jdGlvbiB0YWdOb2RlQW5kQ2hpbGRyZW4obm9kZSwgY2xhenopIHtcbiAgICBpZiAobm9kZS50YWdOYW1lLnRvTG93ZXJDYXNlKCkgIT0gJ3N2ZycpIHsgLy8gSUUgcmV0dXJucyBubyBjbGFzc0xpc3QgZm9yIFNWRyBlbGVtZW50cyBhbmQgU2FmYXJpIGNhbid0IGNvbXB1dGUgU1ZHIGVsZW1lbnQgY2hpbGRyZW5cbiAgICAgICAgbm9kZS5jbGFzc0xpc3QuYWRkKGNsYXp6KTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBub2RlLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB0YWdOb2RlQW5kQ2hpbGRyZW4obm9kZS5jaGlsZHJlbltpXSwgY2xhenopO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBub3RpZnlDYWxsYmFja3MoKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjYWxsYmFja3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY2FsbGJhY2tzW2ldKGxvYWRlZFJhY3RpdmUpO1xuICAgIH1cbiAgICBjYWxsYmFja3MgPSBbXTtcbn1cblxuLy8gUmVnaXN0ZXJzIHRoZSBnaXZlbiBjYWxsYmFjayB0byBiZSBub3RpZmllZCB3aGVuIG91ciB2ZXJzaW9uIG9mIFJhY3RpdmUgaXMgbG9hZGVkLlxuZnVuY3Rpb24gb25Mb2FkKGNhbGxiYWNrKSB7XG4gICAgaWYgKGxvYWRlZFJhY3RpdmUpIHtcbiAgICAgICAgY2FsbGJhY2sobG9hZGVkUmFjdGl2ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgY2FsbGJhY2tzLnB1c2goY2FsbGJhY2spO1xuICAgIH1cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGFib3V0VG9Mb2FkOiBhYm91dFRvTG9hZCxcbiAgICBsb2FkZWQ6IGxvYWRlZCxcbiAgICBvbkxvYWQ6IG9uTG9hZFxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciByYW5neTsgcmVxdWlyZSgnLi9yYW5neS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihsb2FkZWRSYW5neSkgeyByYW5neSA9IGxvYWRlZFJhbmd5OyB9KTtcblxudmFyIGhpZ2hsaWdodENsYXNzID0gJ2FudGVubmEtaGlnaGxpZ2h0JztcbnZhciBoaWdobGlnaHRlZFJhbmdlcyA9IFtdO1xuXG52YXIgY2xhc3NBcHBsaWVyO1xuZnVuY3Rpb24gZ2V0Q2xhc3NBcHBsaWVyKCkge1xuICAgIGlmICghY2xhc3NBcHBsaWVyKSB7XG4gICAgICAgIGNsYXNzQXBwbGllciA9IHJhbmd5LmNyZWF0ZUNsYXNzQXBwbGllcihoaWdobGlnaHRDbGFzcywgeyBlbGVtZW50VGFnTmFtZTogJ2lucycgfSk7XG4gICAgfVxuICAgIHJldHVybiBjbGFzc0FwcGxpZXI7XG59XG5cbi8vIFJldHVybnMgYW4gYWRqdXN0ZWQgZW5kIHBvaW50IGZvciB0aGUgc2VsZWN0aW9uIHdpdGhpbiB0aGUgZ2l2ZW4gbm9kZSwgYXMgdHJpZ2dlcmVkIGJ5IHRoZSBnaXZlbiBtb3VzZSB1cCBldmVudC5cbi8vIFRoZSByZXR1cm5lZCBwb2ludCAoeCwgeSkgdGFrZXMgaW50byBhY2NvdW50IHRoZSBsb2NhdGlvbiBvZiB0aGUgbW91c2UgdXAgZXZlbnQgYXMgd2VsbCBhcyB0aGUgZGlyZWN0aW9uIG9mIHRoZVxuLy8gc2VsZWN0aW9uIChmb3J3YXJkL2JhY2spLlxuZnVuY3Rpb24gZ2V0U2VsZWN0aW9uRW5kUG9pbnQobm9kZSwgZXZlbnQsIGV4Y2x1ZGVOb2RlKSB7XG4gICAgLy8gVE9ETzogQ29uc2lkZXIgdXNpbmcgdGhlIGVsZW1lbnQgY3JlYXRlZCB3aXRoIHRoZSAnY2xhc3NpZmllcicgcmF0aGVyIHRoYW4gdGhlIG1vdXNlIGxvY2F0aW9uXG4gICAgdmFyIHNlbGVjdGlvbiA9IHJhbmd5LmdldFNlbGVjdGlvbigpO1xuICAgIGlmIChpc1ZhbGlkU2VsZWN0aW9uKHNlbGVjdGlvbiwgbm9kZSwgZXhjbHVkZU5vZGUpKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB4OiBldmVudC5wYWdlWCAtICggc2VsZWN0aW9uLmlzQmFja3dhcmRzKCkgPyAtNSA6IDUpLFxuICAgICAgICAgICAgeTogZXZlbnQucGFnZVkgLSA4IC8vIFRPRE86IGV4YWN0IGNvb3Jkc1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xufVxuXG4vLyBBdHRlbXB0cyB0byBnZXQgYSByYW5nZSBmcm9tIHRoZSBjdXJyZW50IHNlbGVjdGlvbi4gVGhpcyBleHBhbmRzIHRoZVxuLy8gc2VsZWN0ZWQgcmVnaW9uIHRvIGluY2x1ZGUgd29yZCBib3VuZGFyaWVzLlxuZnVuY3Rpb24gZ3JhYlNlbGVjdGlvbihub2RlLCBjYWxsYmFjaywgZXhjbHVkZU5vZGUpIHtcbiAgICB2YXIgc2VsZWN0aW9uID0gcmFuZ3kuZ2V0U2VsZWN0aW9uKCk7XG4gICAgaWYgKGlzVmFsaWRTZWxlY3Rpb24oc2VsZWN0aW9uLCBub2RlLCBleGNsdWRlTm9kZSkpIHtcbiAgICAgICAgZXhwYW5kQW5kVHJpbVJhbmdlKHNlbGVjdGlvbik7XG4gICAgICAgIGlmIChzZWxlY3Rpb24uY29udGFpbnNOb2RlKGV4Y2x1ZGVOb2RlKSkge1xuICAgICAgICAgICAgdmFyIHJhbmdlID0gc2VsZWN0aW9uLmdldFJhbmdlQXQoMCk7XG4gICAgICAgICAgICByYW5nZS5zZXRFbmRCZWZvcmUoZXhjbHVkZU5vZGUpO1xuICAgICAgICAgICAgc2VsZWN0aW9uLnNldFNpbmdsZVJhbmdlKHJhbmdlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaXNWYWxpZFNlbGVjdGlvbihzZWxlY3Rpb24sIG5vZGUsIGV4Y2x1ZGVOb2RlKSkge1xuICAgICAgICAgICAgdmFyIGxvY2F0aW9uO1xuICAgICAgICAgICAgaWYgKHNlbGVjdGlvbkVuY29tcGFzc2VzTm9kZShzZWxlY3Rpb24sIG5vZGUpKSB7XG4gICAgICAgICAgICAgICAgbG9jYXRpb24gPSAnOjAsOjEnOyAvLyBUaGUgdXNlciBoYXMgbWFudWFsbHkgc2VsZWN0ZWQgdGhlIGVudGlyZSBub2RlLiBOb3JtYWxpemUgdGhlIGxvY2F0aW9uLlxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBsb2NhdGlvbiA9IHJhbmd5LnNlcmlhbGl6ZVNlbGVjdGlvbihzZWxlY3Rpb24sIHRydWUsIG5vZGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHRleHQgPSBzZWxlY3Rpb24udG9TdHJpbmcoKTtcbiAgICAgICAgICAgIGhpZ2hsaWdodFNlbGVjdGlvbihzZWxlY3Rpb24pOyAvLyBIaWdobGlnaHRpbmcgZGVzZWxlY3RzIHRoZSB0ZXh0LCBzbyBkbyB0aGlzIGxhc3QuXG4gICAgICAgICAgICBjYWxsYmFjayh0ZXh0LCBsb2NhdGlvbik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBleHBhbmRBbmRUcmltUmFuZ2UocmFuZ2VPclNlbGVjdGlvbikge1xuICAgICAgICByYW5nZU9yU2VsZWN0aW9uLmV4cGFuZCgnd29yZCcsIHsgdHJpbTogdHJ1ZSwgd29yZE9wdGlvbnM6IHsgd29yZFJlZ2V4OiAvXFxTK1xcUyovZ2kgfSB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzZWxlY3Rpb25FbmNvbXBhc3Nlc05vZGUoc2VsZWN0aW9uLCBub2RlKSB7XG4gICAgICAgIHZhciByYW5nZSA9IGdldE5vZGVSYW5nZShub2RlKTtcbiAgICAgICAgZXhwYW5kQW5kVHJpbVJhbmdlKHJhbmdlKTtcbiAgICAgICAgcmV0dXJuIHJhbmdlLnRvU3RyaW5nKCkgPT09IHNlbGVjdGlvbi50b1N0cmluZygpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gaXNWYWxpZFNlbGVjdGlvbihzZWxlY3Rpb24sIG5vZGUsIGV4Y2x1ZGVOb2RlKSB7XG4gICAgcmV0dXJuICFzZWxlY3Rpb24uaXNDb2xsYXBzZWQgJiYgIC8vIE5vbi1lbXB0eSBzZWxlY3Rpb25cbiAgICAgICAgc2VsZWN0aW9uLnJhbmdlQ291bnQgPT09IDEgJiYgLy8gU2luZ2xlIHNlbGVjdGlvblxuICAgICAgICAoIWV4Y2x1ZGVOb2RlIHx8ICFzZWxlY3Rpb24uY29udGFpbnNOb2RlKGV4Y2x1ZGVOb2RlLCB0cnVlKSkgJiYgLy8gU2VsZWN0aW9uIGRvZXNuJ3QgY29udGFpbiBhbnl0aGluZyB3ZSd2ZSBzYWlkIHdlIGRvbid0IHdhbnQgKGUuZy4gdGhlIGluZGljYXRvcilcbiAgICAgICAgbm9kZUNvbnRhaW5zU2VsZWN0aW9uKG5vZGUsIHNlbGVjdGlvbik7IC8vIFNlbGVjdGlvbiBpcyBjb250YWluZWQgZW50aXJlbHkgd2l0aGluIHRoZSBub2RlXG59XG5cbmZ1bmN0aW9uIG5vZGVDb250YWluc1NlbGVjdGlvbihub2RlLCBzZWxlY3Rpb24pIHtcbiAgICB2YXIgY29tbW9uQW5jZXN0b3IgPSBzZWxlY3Rpb24uZ2V0UmFuZ2VBdCgwKS5jb21tb25BbmNlc3RvckNvbnRhaW5lcjsgLy8gY29tbW9uQW5jZXN0b3IgY291bGQgYmUgYSB0ZXh0IG5vZGUgb3Igc29tZSBwYXJlbnQgZWxlbWVudFxuICAgIHJldHVybiBub2RlLmNvbnRhaW5zKGNvbW1vbkFuY2VzdG9yKSB8fFxuICAgICAgICAgICAgLy8gVGhlIGZvbGxvd2luZyBjaGVjayBpcyBmb3IgSUUsIHdoaWNoIGRvZXNuJ3QgaW1wbGVtZW50IFwiY29udGFpbnNcIiBwcm9wZXJseSBmb3IgdGV4dCBub2Rlcy5cbiAgICAgICAgKGNvbW1vbkFuY2VzdG9yLm5vZGVUeXBlID09PSAzICYmIG5vZGUuY29udGFpbnMoY29tbW9uQW5jZXN0b3IucGFyZW50Tm9kZSkpO1xufVxuXG5mdW5jdGlvbiBnZXROb2RlUmFuZ2Uobm9kZSkge1xuICAgIHZhciByYW5nZSA9IHJhbmd5LmNyZWF0ZVJhbmdlKGRvY3VtZW50KTtcbiAgICByYW5nZS5zZWxlY3ROb2RlQ29udGVudHMobm9kZSk7XG4gICAgdmFyICRleGNsdWRlZCA9ICQobm9kZSkuZmluZCgnLmFudGVubmEtdGV4dC1pbmRpY2F0b3Itd2lkZ2V0Jyk7XG4gICAgaWYgKCRleGNsdWRlZC5zaXplKCkgPiAwKSB7IC8vIFJlbW92ZSB0aGUgaW5kaWNhdG9yIGZyb20gdGhlIGVuZCBvZiB0aGUgc2VsZWN0ZWQgcmFuZ2UuXG4gICAgICAgIHJhbmdlLnNldEVuZEJlZm9yZSgkZXhjbHVkZWQuZ2V0KDApKTtcbiAgICB9XG4gICAgcmV0dXJuIHJhbmdlO1xufVxuXG5mdW5jdGlvbiBncmFiTm9kZShub2RlLCBjYWxsYmFjaykge1xuICAgIHZhciByYW5nZSA9IGdldE5vZGVSYW5nZShub2RlKTtcbiAgICB2YXIgc2VsZWN0aW9uID0gcmFuZ3kuZ2V0U2VsZWN0aW9uKCk7XG4gICAgc2VsZWN0aW9uLnNldFNpbmdsZVJhbmdlKHJhbmdlKTtcbiAgICAvLyBXZSBzaG91bGQganVzdCBiZSBhYmxlIHRvIHNlcmlhbGl6ZSB0aGUgc2VsZWN0aW9uLCBidXQgdGhpcyBnaXZlcyB1cyBpbmNvbnNpc3RlbnQgdmFsdWVzIGluIFNhZmFyaS5cbiAgICAvLyBUaGUgdmFsdWUgKnNob3VsZCogYWx3YXlzIGJlIDowLDoxIHdoZW4gd2Ugc2VsZWN0IGFuIGVudGlyZSBub2RlLCBzbyB3ZSBqdXN0IGhhcmRjb2RlIGl0LlxuICAgIC8vdmFyIGxvY2F0aW9uID0gcmFuZ3kuc2VyaWFsaXplU2VsZWN0aW9uKHNlbGVjdGlvbiwgdHJ1ZSwgbm9kZSk7XG4gICAgdmFyIGxvY2F0aW9uID0gJzowLDoxJztcbiAgICB2YXIgdGV4dCA9IHNlbGVjdGlvbi50b1N0cmluZygpLnRyaW0oKTtcbiAgICBpZiAodGV4dC5sZW5ndGggPiAwKSB7XG4gICAgICAgIGhpZ2hsaWdodFNlbGVjdGlvbihzZWxlY3Rpb24pOyAvLyBIaWdobGlnaHRpbmcgZGVzZWxlY3RzIHRoZSB0ZXh0LCBzbyBkbyB0aGlzIGxhc3QuXG4gICAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICAgICAgY2FsbGJhY2sodGV4dCwgbG9jYXRpb24pO1xuICAgICAgICB9XG4gICAgfVxuICAgIHNlbGVjdGlvbi5yZW1vdmVBbGxSYW5nZXMoKTsgLy8gRG9uJ3QgYWN0dWFsbHkgbGVhdmUgdGhlIGVsZW1lbnQgc2VsZWN0ZWQuXG4gICAgc2VsZWN0aW9uLnJlZnJlc2goKTtcbn1cblxuLy8gSGlnaGxpZ2h0cyB0aGUgZ2l2ZW4gbG9jYXRpb24gaW5zaWRlIHRoZSBnaXZlbiBub2RlLlxuZnVuY3Rpb24gaGlnaGxpZ2h0TG9jYXRpb24obm9kZSwgbG9jYXRpb24pIHtcbiAgICAvLyBUT0RPIGVycm9yIGhhbmRsaW5nIGluIGNhc2UgdGhlIHJhbmdlIGlzIG5vdCB2YWxpZD9cbiAgICBpZiAobG9jYXRpb24gPT09ICc6MCw6MScpIHtcbiAgICAgICAgZ3JhYk5vZGUobm9kZSk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHJhbmd5LmNhbkRlc2VyaWFsaXplUmFuZ2UobG9jYXRpb24sIG5vZGUsIGRvY3VtZW50KSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdmFyIHJhbmdlID0gcmFuZ3kuZGVzZXJpYWxpemVSYW5nZShsb2NhdGlvbiwgbm9kZSwgZG9jdW1lbnQpO1xuICAgICAgICAgICAgaGlnaGxpZ2h0UmFuZ2UocmFuZ2UpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgLy8gVE9ETzogQ29uc2lkZXIgbG9nZ2luZyBzb21lIGtpbmQgb2YgZXZlbnQgc2VydmVyLXNpZGU/XG4gICAgICAgICAgICAvLyBUT0RPOiBDb25zaWRlciBoaWdobGlnaHRpbmcgdGhlIHdob2xlIG5vZGU/IE9yIGlzIGl0IGJldHRlciB0byBqdXN0IGhpZ2hsaWdodCBub3RoaW5nP1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBoaWdobGlnaHRTZWxlY3Rpb24oc2VsZWN0aW9uKSB7XG4gICAgaGlnaGxpZ2h0UmFuZ2Uoc2VsZWN0aW9uLmdldFJhbmdlQXQoMCkpO1xufVxuXG5mdW5jdGlvbiBoaWdobGlnaHRSYW5nZShyYW5nZSkge1xuICAgIGNsZWFySGlnaGxpZ2h0cygpO1xuICAgIGdldENsYXNzQXBwbGllcigpLmFwcGx5VG9SYW5nZShyYW5nZSk7XG4gICAgaGlnaGxpZ2h0ZWRSYW5nZXMucHVzaChyYW5nZSk7XG59XG5cbi8vIENsZWFycyBhbGwgaGlnaGxpZ2h0cyB0aGF0IGhhdmUgYmVlbiBjcmVhdGVkIG9uIHRoZSBwYWdlLlxuZnVuY3Rpb24gY2xlYXJIaWdobGlnaHRzKCkge1xuICAgIHZhciBjbGFzc0FwcGxpZXIgPSBnZXRDbGFzc0FwcGxpZXIoKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGhpZ2hsaWdodGVkUmFuZ2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciByYW5nZSA9IGhpZ2hsaWdodGVkUmFuZ2VzW2ldO1xuICAgICAgICBpZiAoY2xhc3NBcHBsaWVyLmlzQXBwbGllZFRvUmFuZ2UocmFuZ2UpKSB7XG4gICAgICAgICAgICBjbGFzc0FwcGxpZXIudW5kb1RvUmFuZ2UocmFuZ2UpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGhpZ2hsaWdodGVkUmFuZ2VzID0gW107XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBnZXRTZWxlY3Rpb25FbmRQb2ludDogZ2V0U2VsZWN0aW9uRW5kUG9pbnQsXG4gICAgZ3JhYlNlbGVjdGlvbjogZ3JhYlNlbGVjdGlvbixcbiAgICBncmFiTm9kZTogZ3JhYk5vZGUsXG4gICAgY2xlYXJIaWdobGlnaHRzOiBjbGVhckhpZ2hsaWdodHMsXG4gICAgaGlnaGxpZ2h0OiBoaWdobGlnaHRMb2NhdGlvbixcbiAgICBISUdITElHSFRfU0VMRUNUT1I6ICcuJyArIGhpZ2hsaWdodENsYXNzXG59OyIsIlxudmFyIG5vQ29uZmxpY3Q7XG52YXIgbG9hZGVkUmFuZ3k7XG52YXIgY2FsbGJhY2tzID0gW107XG5cbi8vIENhcHR1cmUgYW55IGdsb2JhbCBpbnN0YW5jZSBvZiByYW5neSB3aGljaCBhbHJlYWR5IGV4aXN0cyBiZWZvcmUgd2UgbG9hZCBvdXIgb3duLlxuZnVuY3Rpb24gYWJvdXRUb0xvYWQoKSB7XG4gICAgbm9Db25mbGljdCA9IHdpbmRvdy5yYW5neTtcbn1cblxuLy8gUmVzdG9yZSB0aGUgZ2xvYmFsIGluc3RhbmNlIG9mIHJhbmd5IChpZiBhbnkpIGFuZCBwYXNzIG91dCBvdXIgdmVyc2lvbiB0byBvdXIgY2FsbGJhY2tzXG5mdW5jdGlvbiBsb2FkZWQoKSB7XG4gICAgbG9hZGVkUmFuZ3kgPSByYW5neTtcbiAgICBsb2FkZWRSYW5neS5pbml0KCk7XG4gICAgd2luZG93LnJhbmd5ID0gbm9Db25mbGljdDtcbiAgICBub3RpZnlDYWxsYmFja3MoKTtcbn1cblxuZnVuY3Rpb24gbm90aWZ5Q2FsbGJhY2tzKCkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2FsbGJhY2tzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNhbGxiYWNrc1tpXShsb2FkZWRSYW5neSk7XG4gICAgfVxuICAgIGNhbGxiYWNrcyA9IFtdO1xufVxuXG4vLyBSZWdpc3RlcnMgdGhlIGdpdmVuIGNhbGxiYWNrIHRvIGJlIG5vdGlmaWVkIHdoZW4gb3VyIHZlcnNpb24gb2YgUmFuZ3kgaXMgbG9hZGVkLlxuZnVuY3Rpb24gb25Mb2FkKGNhbGxiYWNrKSB7XG4gICAgaWYgKGxvYWRlZFJhbmd5KSB7XG4gICAgICAgIGNhbGxiYWNrKGxvYWRlZFJhbmd5KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBjYWxsYmFja3MucHVzaChjYWxsYmFjayk7XG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgYWJvdXRUb0xvYWQ6IGFib3V0VG9Mb2FkLFxuICAgIGxvYWRlZDogbG9hZGVkLFxuICAgIG9uTG9hZDogb25Mb2FkXG59OyIsInZhciAkOyByZXF1aXJlKCcuL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xuXG52YXIgQ0xBU1NfRlVMTCA9ICdhbnRlbm5hLWZ1bGwnO1xudmFyIENMQVNTX0hBTEYgPSAnYW50ZW5uYS1oYWxmJztcbnZhciBDTEFTU19IQUxGX1NUUkVUQ0ggPSBDTEFTU19IQUxGICsgJyBhbnRlbm5hLXN0cmV0Y2gnO1xuXG5mdW5jdGlvbiBjb21wdXRlTGF5b3V0RGF0YShyZWFjdGlvbnNEYXRhKSB7XG4gICAgdmFyIG51bVJlYWN0aW9ucyA9IHJlYWN0aW9uc0RhdGEubGVuZ3RoO1xuICAgIGlmIChudW1SZWFjdGlvbnMgPT0gMCkge1xuICAgICAgICByZXR1cm4ge307IC8vIFRPRE8gY2xlYW4gdGhpcyB1cFxuICAgIH1cbiAgICAvLyBUT0RPOiBDb3BpZWQgY29kZSBmcm9tIGVuZ2FnZV9mdWxsLmNyZWF0ZVRhZ0J1Y2tldHNcbiAgICB2YXIgbWVkaWFuID0gcmVhY3Rpb25zRGF0YVsgTWF0aC5mbG9vcihyZWFjdGlvbnNEYXRhLmxlbmd0aC8yKSBdLmNvdW50O1xuICAgIHZhciB0b3RhbCA9IDA7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBudW1SZWFjdGlvbnM7IGkrKykge1xuICAgICAgICB0b3RhbCArPSByZWFjdGlvbnNEYXRhW2ldLmNvdW50O1xuICAgIH1cbiAgICB2YXIgYXZlcmFnZSA9IE1hdGguZmxvb3IodG90YWwgLyBudW1SZWFjdGlvbnMpO1xuICAgIHZhciBtaWRWYWx1ZSA9ICggbWVkaWFuID4gYXZlcmFnZSApID8gbWVkaWFuIDogYXZlcmFnZTtcblxuICAgIHZhciBsYXlvdXRDbGFzc2VzID0gW107XG4gICAgdmFyIG51bUhhbGZzaWVzID0gMDtcbiAgICB2YXIgbnVtRnVsbCA9IDA7XG4gICAgZm9yICh2YXIgaiA9IDA7IGogPCBudW1SZWFjdGlvbnM7IGorKykge1xuICAgICAgICBpZiAocmVhY3Rpb25zRGF0YVtqXS5jb3VudCA+IG1pZFZhbHVlKSB7XG4gICAgICAgICAgICBsYXlvdXRDbGFzc2VzW2pdID0gQ0xBU1NfRlVMTDtcbiAgICAgICAgICAgIG51bUZ1bGwrKztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGxheW91dENsYXNzZXNbal0gPSBDTEFTU19IQUxGO1xuICAgICAgICAgICAgbnVtSGFsZnNpZXMrKztcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAobnVtSGFsZnNpZXMgJSAyICE9PSAwKSB7XG4gICAgICAgIC8vIElmIHRoZXJlIGFyZSBhbiBvZGQgbnVtYmVyIG9mIGhhbGYtc2l6ZWQgYm94ZXMsIG1ha2Ugb25lIG9mIHRoZW0gZnVsbC5cbiAgICAgICAgaWYgKG51bUZ1bGwgPT09IDApIHtcbiAgICAgICAgICAgIC8vIElmIHRoZXJlIGFyZSBubyBvdGhlciBmdWxsLXNpemUgYm94ZXMsIG1ha2UgdGhlIGZpcnN0IG9uZSBmdWxsLXNpemUuXG4gICAgICAgICAgICBsYXlvdXRDbGFzc2VzWzBdID0gQ0xBU1NfRlVMTDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIE90aGVyd2lzZSwgc2ltcGx5IHN0cmV0Y2ggdGhlIGxhc3QgYm94IHRvIGZpbGwgdGhlIGF2YWlsYWJsZSB3aWR0aCAodGhpcyBrZWVwcyB0aGUgc21hbGxlciBmb250IHNpemUpLlxuICAgICAgICAgICAgbGF5b3V0Q2xhc3Nlc1tudW1SZWFjdGlvbnMgLSAxXSA9IENMQVNTX0hBTEZfU1RSRVRDSDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIGxheW91dENsYXNzZXM6IGxheW91dENsYXNzZXNcbiAgICB9O1xufVxuXG5mdW5jdGlvbiBzaXplUmVhY3Rpb25UZXh0VG9GaXQoJHJlYWN0aW9uc1dpbmRvdykge1xuICAgIHJldHVybiBmdW5jdGlvbiBzaXplUmVhY3Rpb25UZXh0VG9GaXQobm9kZSkge1xuICAgICAgICB2YXIgJGVsZW1lbnQgPSAkKG5vZGUpO1xuICAgICAgICB2YXIgb3JpZ2luYWxEaXNwbGF5ID0gJHJlYWN0aW9uc1dpbmRvdy5jc3MoJ2Rpc3BsYXknKTtcbiAgICAgICAgaWYgKG9yaWdpbmFsRGlzcGxheSA9PT0gJ25vbmUnKSB7IC8vIElmIHdlJ3JlIHNpemluZyB0aGUgYm94ZXMgYmVmb3JlIHRoZSB3aWRnZXQgaXMgZGlzcGxheWVkLCB0ZW1wb3JhcmlseSBkaXNwbGF5IGl0IG9mZnNjcmVlbi5cbiAgICAgICAgICAgICRyZWFjdGlvbnNXaW5kb3cuY3NzKHtkaXNwbGF5OiAnYmxvY2snLCBsZWZ0OiAnMTAwJSd9KTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgaG9yaXpvbnRhbFJhdGlvID0gbm9kZS5jbGllbnRXaWR0aCAvIG5vZGUuc2Nyb2xsV2lkdGg7XG4gICAgICAgIGlmIChob3Jpem9udGFsUmF0aW8gPCAxLjApIHsgLy8gSWYgdGhlIHRleHQgZG9lc24ndCBmaXQsIGZpcnN0IHRyeSB0byB3cmFwIGl0IHRvIHR3byBsaW5lcy4gVGhlbiBzY2FsZSBpdCBkb3duIGlmIHN0aWxsIG5lY2Vzc2FyeS5cbiAgICAgICAgICAgIHZhciB0ZXh0ID0gbm9kZS5pbm5lckhUTUw7XG4gICAgICAgICAgICB2YXIgbWlkID0gTWF0aC5jZWlsKHRleHQubGVuZ3RoIC8gMik7IC8vIExvb2sgZm9yIHRoZSBjbG9zZXN0IHNwYWNlIHRvIHRoZSBtaWRkbGUsIHdlaWdodGVkIHNsaWdodGx5IChNYXRoLmNlaWwpIHRvd2FyZCBhIHNwYWNlIGluIHRoZSBzZWNvbmQgaGFsZi5cbiAgICAgICAgICAgIHZhciBzZWNvbmRIYWxmSW5kZXggPSB0ZXh0LmluZGV4T2YoJyAnLCBtaWQpO1xuICAgICAgICAgICAgdmFyIGZpcnN0SGFsZkluZGV4ID0gdGV4dC5sYXN0SW5kZXhPZignICcsIG1pZCk7XG4gICAgICAgICAgICB2YXIgc3BsaXRJbmRleCA9IE1hdGguYWJzKHNlY29uZEhhbGZJbmRleCAtIG1pZCkgPCBNYXRoLmFicyhtaWQgLSBmaXJzdEhhbGZJbmRleCkgPyBzZWNvbmRIYWxmSW5kZXggOiBmaXJzdEhhbGZJbmRleDtcbiAgICAgICAgICAgIGlmIChzcGxpdEluZGV4IDwgMSkge1xuICAgICAgICAgICAgICAgIC8vIElmIHRoZXJlJ3Mgbm8gc3BhY2UgaW4gdGhlIHRleHQsIGp1c3Qgc3BsaXQgdGhlIHRleHQuIFNwbGl0IG9uIHRoZSBvdmVyZmxvdyByYXRpbyBpZiB0aGUgdG9wIGxpbmUgd2lsbFxuICAgICAgICAgICAgICAgIC8vIGhhdmUgbW9yZSBjaGFyYWN0ZXJzIHRoYW4gdGhlIGJvdHRvbSAoc28gaXQgbG9va3MgbGlrZSB0aGUgdGV4dCBuYXR1cmFsbHkgd3JhcHMpIG9yIG90aGVyd2lzZSBpbiB0aGUgbWlkZGxlLlxuICAgICAgICAgICAgICAgIHNwbGl0SW5kZXggPSBob3Jpem9udGFsUmF0aW8gPiAwLjUgPyBNYXRoLmNlaWwodGV4dC5sZW5ndGggKiBob3Jpem9udGFsUmF0aW8pIDogTWF0aC5jZWlsKHRleHQubGVuZ3RoIC8gMik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBTcGxpdCB0aGUgdGV4dCBhbmQgdGhlbiBzZWUgaG93IGl0IGZpdHMuXG4gICAgICAgICAgICBub2RlLmlubmVySFRNTCA9IHRleHQuc2xpY2UoMCwgc3BsaXRJbmRleCkgKyAnPGJyPicgKyB0ZXh0LnNsaWNlKHNwbGl0SW5kZXgpO1xuICAgICAgICAgICAgdmFyIHdyYXBwZWRIb3Jpem9udGFsUmF0aW8gPSBub2RlLmNsaWVudFdpZHRoIC8gbm9kZS5zY3JvbGxXaWR0aDtcbiAgICAgICAgICAgIGlmICh3cmFwcGVkSG9yaXpvbnRhbFJhdGlvIDwgMSkge1xuICAgICAgICAgICAgICAgICRlbGVtZW50LmNzcygnZm9udC1zaXplJywgTWF0aC5tYXgoMTAsIE1hdGguZmxvb3IocGFyc2VJbnQoJGVsZW1lbnQuY3NzKCdmb250LXNpemUnKSkgKiB3cmFwcGVkSG9yaXpvbnRhbFJhdGlvKSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gU2hyaW5rIHRoZSBjb250YWluaW5nIGJveCBwYWRkaW5nIGlmIG5lY2Vzc2FyeSB0byBmaXQgdGhlICdjb3VudCdcbiAgICAgICAgICAgIHZhciBjb3VudCA9IG5vZGUucGFyZW50Tm9kZS5xdWVyeVNlbGVjdG9yKCcuYW50ZW5uYS1yZWFjdGlvbi1jb3VudCcpO1xuICAgICAgICAgICAgaWYgKGNvdW50KSB7XG4gICAgICAgICAgICAgICAgdmFyIGFwcHJveEhlaWdodCA9IHBhcnNlSW50KCRlbGVtZW50LmNzcygnZm9udC1zaXplJykpICogMjsgLy8gQXQgdGhpcyBwb2ludCB0aGUgYnJvd3NlciB3b24ndCBnaXZlIHVzIGEgcmVhbCBoZWlnaHQsIHNvIHdlIG5lZWQgdG8gZXN0aW1hdGUgb3Vyc2VsdmVzXG4gICAgICAgICAgICAgICAgdmFyIGNsaWVudEFyZWEgPSBjb21wdXRlQXZhaWxhYmxlQ2xpZW50QXJlYShub2RlLnBhcmVudE5vZGUpO1xuICAgICAgICAgICAgICAgIHZhciByZW1haW5pbmdTcGFjZSA9IGNsaWVudEFyZWEgLSBhcHByb3hIZWlnaHQ7XG4gICAgICAgICAgICAgICAgdmFyIGNvdW50SGVpZ2h0ID0gY29tcHV0ZU5lZWRlZEhlaWdodChjb3VudCk7XG4gICAgICAgICAgICAgICAgaWYgKHJlbWFpbmluZ1NwYWNlIDwgY291bnRIZWlnaHQpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyICRwYXJlbnQgPSAkKG5vZGUucGFyZW50Tm9kZSk7XG4gICAgICAgICAgICAgICAgICAgICRwYXJlbnQuY3NzKCdwYWRkaW5nLXRvcCcsIHBhcnNlSW50KCRwYXJlbnQuY3NzKCdwYWRkaW5nLXRvcCcpKSAtICgoY291bnRIZWlnaHQtcmVtYWluaW5nU3BhY2UpLzIpICk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChvcmlnaW5hbERpc3BsYXkgPT09ICdub25lJykge1xuICAgICAgICAgICAgJHJlYWN0aW9uc1dpbmRvdy5jc3Moe2Rpc3BsYXk6ICcnLCBsZWZ0OiAnJ30pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0ZWFyZG93bjogZnVuY3Rpb24oKSB7fVxuICAgICAgICB9O1xuICAgIH07XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVBdmFpbGFibGVDbGllbnRBcmVhKG5vZGUpIHtcbiAgICB2YXIgbm9kZVN0eWxlID0gd2luZG93LmdldENvbXB1dGVkU3R5bGUobm9kZSk7XG4gICAgcmV0dXJuIHBhcnNlSW50KG5vZGVTdHlsZS5oZWlnaHQpIC0gcGFyc2VJbnQobm9kZVN0eWxlLnBhZGRpbmdUb3ApIC0gcGFyc2VJbnQobm9kZVN0eWxlLnBhZGRpbmdCb3R0b20pO1xufVxuXG5mdW5jdGlvbiBjb21wdXRlTmVlZGVkSGVpZ2h0KG5vZGUpIHtcbiAgICB2YXIgbm9kZVN0eWxlID0gd2luZG93LmdldENvbXB1dGVkU3R5bGUobm9kZSk7XG4gICAgcmV0dXJuIHBhcnNlSW50KG5vZGVTdHlsZS5oZWlnaHQpICsgcGFyc2VJbnQobm9kZVN0eWxlLm1hcmdpblRvcCkgKyBwYXJzZUludChub2RlU3R5bGUubWFyZ2luQm90dG9tKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgc2l6ZVRvRml0OiBzaXplUmVhY3Rpb25UZXh0VG9GaXQsXG4gICAgY29tcHV0ZUxheW91dERhdGE6IGNvbXB1dGVMYXlvdXREYXRhXG59OyIsInZhciBVcmxQYXJhbXMgPSByZXF1aXJlKCcuL3VybC1wYXJhbXMnKTtcblxudmFyIHNlZ21lbnRzID0gWyAnMjUwJywgJzQwMCcsICc3MDAnIF07XG52YXIgc2VnbWVudDtcblxuZnVuY3Rpb24gZ2V0U2VnbWVudChncm91cFNldHRpbmdzKSB7XG4gICAgaWYgKCFzZWdtZW50KSB7XG4gICAgICAgIHNlZ21lbnQgPSBjb21wdXRlU2VnbWVudChncm91cFNldHRpbmdzKTtcbiAgICB9XG4gICAgcmV0dXJuIHNlZ21lbnQ7XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVTZWdtZW50KGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgc2VnbWVudE92ZXJyaWRlID0gVXJsUGFyYW1zLmdldFVybFBhcmFtKCdhbnRlbm5hU2VnbWVudCcpO1xuICAgIGlmIChzZWdtZW50T3ZlcnJpZGUpIHtcbiAgICAgICAgc3RvcmVTZWdtZW50KHNlZ21lbnRPdmVycmlkZSk7XG4gICAgICAgIHJldHVybiBzZWdtZW50T3ZlcnJpZGU7XG4gICAgfVxuICAgIHZhciBzZWdtZW50ID0gcmVhZFNlZ21lbnQoKTtcbiAgICBpZiAoIXNlZ21lbnQgJiYgKGdyb3VwU2V0dGluZ3MuZ3JvdXBJZCgpID09PSAzNzE0IHx8IGdyb3VwU2V0dGluZ3MuZ3JvdXBJZCgpID09PSAyKSkge1xuICAgICAgICBzZWdtZW50ID0gY3JlYXRlU2VnbWVudChncm91cFNldHRpbmdzKTtcbiAgICAgICAgc2VnbWVudCA9IHN0b3JlU2VnbWVudChzZWdtZW50KTtcbiAgICB9XG4gICAgcmV0dXJuIHNlZ21lbnQ7XG59XG5cbmZ1bmN0aW9uIHJlYWRTZWdtZW50KCkge1xuICAgIC8vIFJldHVybnMgdGhlIHN0b3JlZCBzZWdtZW50LCBidXQgb25seSBpZiBpdCBpcyBvbmUgb2YgdGhlIGN1cnJlbnQgdmFsaWQgc2VnbWVudHMuXG4gICAgdmFyIHNlZ21lbnQgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnYW50X3NlZ21lbnQnKTtcbiAgICBpZiAoc2VnbWVudCkge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNlZ21lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoc2VnbWVudCA9PT0gc2VnbWVudHNbaV0pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2VnbWVudDsgLy8gVmFsaWQgc2VnbWVudC4gUmV0dXJuLlxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBjcmVhdGVTZWdtZW50KGdyb3VwU2V0dGluZ3MpIHtcbiAgICByZXR1cm4gc2VnbWVudHNbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogc2VnbWVudHMubGVuZ3RoKV07XG59XG5cbmZ1bmN0aW9uIHN0b3JlU2VnbWVudChzZWdtZW50KSB7XG4gICAgdHJ5IHtcbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2FudF9zZWdtZW50Jywgc2VnbWVudCk7XG4gICAgfSBjYXRjaChlcnJvcikge1xuICAgICAgICAvLyBTb21lIGJyb3dzZXJzIChtb2JpbGUgU2FmYXJpKSB0aHJvdyBhbiBleGNlcHRpb24gd2hlbiBpbiBwcml2YXRlIGJyb3dzaW5nIG1vZGUuXG4gICAgICAgIC8vIElmIHRoaXMgaGFwcGVucywgZmFsbCBiYWNrIHRvIGEgZGVmYXVsdCB2YWx1ZSB0aGF0IHdpbGwgYXQgbGVhc3QgZ2l2ZSB1cyBzdGFibGUgYmVoYXZpb3IuXG4gICAgICAgIHNlZ21lbnQgPSBzZWdtZW50c1swXTtcbiAgICB9XG4gICAgcmV0dXJuIHNlZ21lbnQ7XG59XG5cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgZ2V0U2VnbWVudDogZ2V0U2VnbWVudFxufTsiLCJ2YXIgSlNPTlV0aWxzID0gcmVxdWlyZSgnLi9qc29uLXV0aWxzJyk7XG5cbnZhciBsdHNEYXRhO1xudmFyIHN0c0RhdGE7XG5cbmZ1bmN0aW9uIGdldExvbmdUZXJtU2Vzc2lvbklkKCkge1xuICAgIGlmICghbHRzRGF0YSkge1xuICAgICAgICBsdHNEYXRhID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ2FudF9sdHMnKTtcbiAgICAgICAgaWYgKCFsdHNEYXRhKSB7XG4gICAgICAgICAgICBsdHNEYXRhID0gY3JlYXRlR3VpZCgpO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnYW50X2x0cycsIGx0c0RhdGEpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAvLyBTb21lIGJyb3dzZXJzIChtb2JpbGUgU2FmYXJpKSB0aHJvdyBhbiBleGNlcHRpb24gd2hlbiBpbiBwcml2YXRlIGJyb3dzaW5nIG1vZGUuXG4gICAgICAgICAgICAgICAgLy8gTm90aGluZyB3ZSBjYW4gZG8gYWJvdXQgaXQuIEp1c3QgZmFsbCB0aHJvdWdoIGFuZCByZXR1cm4gdGhlIGRhdGEgd2UgaGF2ZSBpbiBtZW1vcnkuXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGx0c0RhdGE7XG59XG5cbmZ1bmN0aW9uIGdldFNob3J0VGVybVNlc3Npb25JZCgpIHtcbiAgICBpZiAoIXN0c0RhdGEpIHtcbiAgICAgICAgdmFyIGpzb24gPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnYW50X3N0cycpO1xuICAgICAgICBpZiAoanNvbikge1xuICAgICAgICAgICAgc3RzRGF0YSA9IEpTT04ucGFyc2UoanNvbik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKHN0c0RhdGEgJiYgRGF0ZS5ub3coKSA+IHN0c0RhdGEuZXhwaXJlcykge1xuICAgICAgICBzdHNEYXRhID0gbnVsbDsgLy8gZXhwaXJlIHRoZSBzZXNzaW9uXG4gICAgfVxuICAgIGlmICghc3RzRGF0YSkge1xuICAgICAgICBzdHNEYXRhID0geyBndWlkOiBjcmVhdGVHdWlkKCkgfTsgLy8gY3JlYXRlIGEgbmV3IHNlc3Npb25cbiAgICB9XG4gICAgLy8gQWx3YXlzIHNldCBhIG5ldyBleHBpcmVzIHRpbWUsIHNvIHRoYXQgd2Uga2VlcCBleHRlbmRpbmcgdGhlIHRpbWUgYXMgbG9uZyBhcyB0aGUgdXNlciBpcyBhY3RpdmVcbiAgICB2YXIgbWludXRlcyA9IDE1O1xuICAgIHN0c0RhdGEuZXhwaXJlcyA9IERhdGUubm93KCkgKyBtaW51dGVzICogNjAwMDA7XG4gICAgdHJ5IHtcbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2FudF9zdHMnLCBKU09OVXRpbHMuc3RyaW5naWZ5KHN0c0RhdGEpKTtcbiAgICB9IGNhdGNoKGVycm9yKSB7XG4gICAgICAgIC8vIFNvbWUgYnJvd3NlcnMgKG1vYmlsZSBTYWZhcmkpIHRocm93IGFuIGV4Y2VwdGlvbiB3aGVuIGluIHByaXZhdGUgYnJvd3NpbmcgbW9kZS5cbiAgICAgICAgLy8gTm90aGluZyB3ZSBjYW4gZG8gYWJvdXQgaXQuIEp1c3QgZmFsbCB0aHJvdWdoIGFuZCByZXR1cm4gdGhlIGRhdGEgd2UgaGF2ZSBpbiBtZW1vcnkuXG4gICAgfVxuICAgIHJldHVybiBzdHNEYXRhLmd1aWQ7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUd1aWQoKSB7XG4gICAgLy8gQ29kZSBjb3BpZWQgZnJvbSBlbmdhZ2VfZnVsbCAob3JpZ2luYWxseSwgaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xMDUwMzQvY3JlYXRlLWd1aWQtdXVpZC1pbi1qYXZhc2NyaXB0KVxuICAgIHJldHVybiAneHh4eHh4eHgteHh4eC00eHh4LXl4eHgteHh4eHh4eHh4eHh4Jy5yZXBsYWNlKC9beHldL2csIGZ1bmN0aW9uIChjKSB7XG4gICAgICAgIHZhciByID0gTWF0aC5yYW5kb20oKSAqIDE2IHwgMCwgdiA9IGMgPT0gJ3gnID8gciA6IChyICYgMHgzIHwgMHg4KTtcbiAgICAgICAgcmV0dXJuIHYudG9TdHJpbmcoMTYpO1xuICAgIH0pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBnZXRMb25nVGVybVNlc3Npb246IGdldExvbmdUZXJtU2Vzc2lvbklkLFxuICAgIGdldFNob3J0VGVybVNlc3Npb246IGdldFNob3J0VGVybVNlc3Npb25JZFxufTsiLCJ2YXIgQ2FsbGJhY2tTdXBwb3J0ID0gcmVxdWlyZSgnLi9jYWxsYmFjay1zdXBwb3J0Jyk7XG5cbi8vIFRoaXMgbW9kdWxlIGFsbG93cyB1cyB0byByZWdpc3RlciBjYWxsYmFja3MgdGhhdCBhcmUgdGhyb3R0bGVkIGluIHRoZWlyIGZyZXF1ZW5jeS4gVGhpcyBpcyB1c2VmdWwgZm9yIGV2ZW50cyBsaWtlXG4vLyByZXNpemUgYW5kIHNjcm9sbCwgd2hpY2ggY2FuIGJlIGZpcmVkIGF0IGFuIGV4dHJlbWVseSBoaWdoIHJhdGUuXG5cbnZhciB0aHJvdHRsZWRMaXN0ZW5lcnMgPSB7fTtcblxuZnVuY3Rpb24gb24odHlwZSwgY2FsbGJhY2spIHtcbiAgICB0aHJvdHRsZWRMaXN0ZW5lcnNbdHlwZV0gPSB0aHJvdHRsZWRMaXN0ZW5lcnNbdHlwZV0gfHwgY3JlYXRlVGhyb3R0bGVkTGlzdGVuZXIodHlwZSk7XG4gICAgdGhyb3R0bGVkTGlzdGVuZXJzW3R5cGVdLmFkZENhbGxiYWNrKGNhbGxiYWNrKTtcbn1cblxuZnVuY3Rpb24gb2ZmKHR5cGUsIGNhbGxiYWNrKSB7XG4gICAgdmFyIGV2ZW50TGlzdGVuZXIgPSB0aHJvdHRsZWRMaXN0ZW5lcnNbdHlwZV07XG4gICAgaWYgKGV2ZW50TGlzdGVuZXIpIHtcbiAgICAgICAgZXZlbnRMaXN0ZW5lci5yZW1vdmVDYWxsYmFjayhjYWxsYmFjayk7XG4gICAgICAgIGlmIChldmVudExpc3RlbmVyLmlzRW1wdHkoKSkge1xuICAgICAgICAgICAgZXZlbnRMaXN0ZW5lci50ZWFyZG93bigpO1xuICAgICAgICAgICAgZGVsZXRlIHRocm90dGxlZExpc3RlbmVyc1t0eXBlXTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLy8gQ3JlYXRlcyBhIGxpc3RlbmVyIG9uIHRoZSBwYXJ0aWN1bGFyIGV2ZW50IHR5cGUuIENhbGxiYWNrcyBhZGRlZCB0byB0aGlzIGxpc3RlbmVyIHdpbGwgYmUgdGhyb3R0bGVkLlxuZnVuY3Rpb24gY3JlYXRlVGhyb3R0bGVkTGlzdGVuZXIodHlwZSkge1xuICAgIHZhciBjYWxsYmFja3MgPSBDYWxsYmFja1N1cHBvcnQuY3JlYXRlKCk7XG4gICAgdmFyIGV2ZW50VGltZW91dDtcbiAgICBzZXR1cCgpO1xuICAgIHJldHVybiB7XG4gICAgICAgIGFkZENhbGxiYWNrOiBjYWxsYmFja3MuYWRkLFxuICAgICAgICByZW1vdmVDYWxsYmFjazogY2FsbGJhY2tzLnJlbW92ZSxcbiAgICAgICAgaXNFbXB0eTogY2FsbGJhY2tzLmlzRW1wdHksXG4gICAgICAgIHRlYXJkb3duOiB0ZWFyZG93blxuICAgIH07XG5cbiAgICBmdW5jdGlvbiBoYW5kbGVFdmVudCgpIHtcbiAgICAgICBpZiAoIWV2ZW50VGltZW91dCkge1xuICAgICAgICAgICBldmVudFRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgY2FsbGJhY2tzLmludm9rZUFsbCgpO1xuICAgICAgICAgICAgICAgZXZlbnRUaW1lb3V0ID0gbnVsbDtcbiAgICAgICAgICAgfSwgNjYpOyAvLyAxNSBGUFNcbiAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2V0dXAoKSB7XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKHR5cGUsIGhhbmRsZUV2ZW50KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB0ZWFyZG93bigpIHtcbiAgICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIodHlwZSwgaGFuZGxlRXZlbnQpO1xuICAgIH1cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIG9uOiBvbixcbiAgICBvZmY6IG9mZlxufTsiLCJcbi8vIFRPRE86IENvbnNpZGVyIGFkZGluZyBzdXBwb3J0IGZvciB0aGUgTVMgcHJvcHJpZXRhcnkgXCJQb2ludGVyIEV2ZW50c1wiIEFQSS5cblxuLy8gU2V0cyB1cCB0aGUgZ2l2ZW4gZWxlbWVudCB0byBiZSBjYWxsZWQgd2l0aCBhIFRvdWNoRXZlbnQgdGhhdCB3ZSByZWNvZ25pemUgYXMgYSB0YXAuXG5mdW5jdGlvbiBzZXR1cFRvdWNoVGFwRXZlbnRzKGVsZW1lbnQsIGNhbGxiYWNrKSB7XG4gICAgdmFyIHRpbWVvdXQgPSA0MDA7IC8vIFRoaXMgaXMgdGhlIHRpbWUgYmV0d2VlbiB0b3VjaHN0YXJ0IGFuZCB0b3VjaGVuZCB0aGF0IHdlIHVzZSB0byBkaXN0aW5ndWlzaCBhIHRhcCBmcm9tIGEgbG9uZyBwcmVzcy5cbiAgICB2YXIgdmFsaWRUYXAgPSBmYWxzZTtcbiAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0b3VjaFN0YXJ0KTtcbiAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIHRvdWNoTW92ZSk7XG4gICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGNhbmNlbCcsIHRvdWNoQ2FuY2VsKTtcbiAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgdG91Y2hFbmQpO1xuICAgIHJldHVybiB7XG4gICAgICAgIHRlYXJkb3duOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRvdWNoU3RhcnQpO1xuICAgICAgICAgICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCB0b3VjaE1vdmUpO1xuICAgICAgICAgICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaGNhbmNlbCcsIHRvdWNoQ2FuY2VsKTtcbiAgICAgICAgICAgIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCB0b3VjaEVuZCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gdG91Y2hTdGFydChldmVudCkge1xuICAgICAgICB2YWxpZFRhcCA9IHRydWU7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YWxpZFRhcCA9IGZhbHNlO1xuICAgICAgICB9LCB0aW1lb3V0KTtcbiAgICB9XG4gICAgZnVuY3Rpb24gdG91Y2hFbmQoZXZlbnQpIHtcbiAgICAgICAgaWYgKHZhbGlkVGFwICYmIGV2ZW50LmNoYW5nZWRUb3VjaGVzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgY2FsbGJhY2soZXZlbnQpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIHRvdWNoTW92ZShldmVudCkge1xuICAgICAgICB2YWxpZFRhcCA9IGZhbHNlO1xuICAgIH1cbiAgICBmdW5jdGlvbiB0b3VjaENhbmNlbChldmVudCkge1xuICAgICAgICB2YWxpZFRhcCA9IGZhbHNlO1xuICAgIH1cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHNldHVwVGFwOiBzZXR1cFRvdWNoVGFwRXZlbnRzXG59OyIsIlxuXG5mdW5jdGlvbiB0b2dnbGVUcmFuc2l0aW9uQ2xhc3MoJGVsZW1lbnQsIGNsYXNzTmFtZSwgc3RhdGUsIG5leHRTdGVwKSB7XG4gICAgJGVsZW1lbnQub24oXCJ0cmFuc2l0aW9uZW5kIHdlYmtpdFRyYW5zaXRpb25FbmQgb1RyYW5zaXRpb25FbmQgTVNUcmFuc2l0aW9uRW5kXCIsXG4gICAgICAgIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICAvLyBvbmNlIHRoZSBDU1MgdHJhbnNpdGlvbiBpcyBjb21wbGV0ZSwgY2FsbCBvdXIgbmV4dCBzdGVwXG4gICAgICAgICAgICAvLyBTZWU6IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvOTI1NTI3OS9jYWxsYmFjay13aGVuLWNzczMtdHJhbnNpdGlvbi1maW5pc2hlc1xuICAgICAgICAgICAgaWYgKGV2ZW50LnRhcmdldCA9PSBldmVudC5jdXJyZW50VGFyZ2V0KSB7XG4gICAgICAgICAgICAgICAgJGVsZW1lbnQub2ZmKFwidHJhbnNpdGlvbmVuZCB3ZWJraXRUcmFuc2l0aW9uRW5kIG9UcmFuc2l0aW9uRW5kIE1TVHJhbnNpdGlvbkVuZFwiKTtcbiAgICAgICAgICAgICAgICBpZiAobmV4dFN0ZXApIHtcbiAgICAgICAgICAgICAgICAgICAgbmV4dFN0ZXAoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICApO1xuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIFRoaXMgd29ya2Fyb3VuZCBnZXRzIHVzIGNvbnNpc3RlbnQgdHJhbnNpdGlvbmVuZCBldmVudHMsIHdoaWNoIGNhbiBvdGhlcndpc2UgYmUgZmxha3kgaWYgd2UncmUgc2V0dGluZyBvdGhlclxuICAgICAgICAvLyBjbGFzc2VzIGF0IHRoZSBzYW1lIHRpbWUgYXMgdHJhbnNpdGlvbiBjbGFzc2VzLlxuICAgICAgICAkZWxlbWVudC50b2dnbGVDbGFzcyhjbGFzc05hbWUsIHN0YXRlKTtcbiAgICB9LCAyMCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHRvZ2dsZUNsYXNzOiB0b2dnbGVUcmFuc2l0aW9uQ2xhc3Ncbn07IiwidmFyIFBST0RfU0VSVkVSX1VSTCA9IFwiaHR0cHM6Ly93d3cuYW50ZW5uYS5pc1wiOyAvLyBUT0RPOiB3d3c/IGhvdyBhYm91dCBhbnRlbm5hLmlzIG9yIGFwaS5hbnRlbm5hLmlzP1xudmFyIERFVl9TRVJWRVJfVVJMID0gXCJodHRwOi8vbG9jYWwtc3RhdGljLmFudGVubmEuaXM6ODA4MVwiO1xudmFyIFRFU1RfU0VSVkVSX1VSTCA9ICdodHRwOi8vbG9jYWxob3N0OjMwMDEnO1xudmFyIEFNQVpPTl9TM19VUkwgPSAnLy9jZG4uYW50ZW5uYS5pcyc7XG5cbnZhciBQUk9EX0VWRU5UX1NFUlZFUl9VUkwgPSAnaHR0cHM6Ly9ldmVudHMuYW50ZW5uYS5pcyc7XG52YXIgREVWX0VWRU5UX1NFUlZFUl9VUkwgPSAnaHR0cDovL25vZGVicS5kb2NrZXI6MzAwMCc7XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBQUk9EVUNUSU9OOiBQUk9EX1NFUlZFUl9VUkwsXG4gICAgREVWRUxPUE1FTlQ6IERFVl9TRVJWRVJfVVJMLFxuICAgIFRFU1Q6IFRFU1RfU0VSVkVSX1VSTCxcbiAgICBBTUFaT05fUzM6IEFNQVpPTl9TM19VUkwsXG4gICAgUFJPRFVDVElPTl9FVkVOVFM6IFBST0RfRVZFTlRfU0VSVkVSX1VSTCxcbiAgICBERVZFTE9QTUVOVF9FVkVOVFM6IERFVl9FVkVOVF9TRVJWRVJfVVJMXG59OyIsIlxudmFyIHVybFBhcmFtcztcblxuZnVuY3Rpb24gZ2V0VXJsUGFyYW0oa2V5KSB7XG4gICAgaWYgKCF1cmxQYXJhbXMpIHtcbiAgICAgICAgdXJsUGFyYW1zID0gcGFyc2VVcmxQYXJhbXMoKTtcbiAgICB9XG4gICAgcmV0dXJuIHVybFBhcmFtc1trZXldO1xufVxuXG5mdW5jdGlvbiBwYXJzZVVybFBhcmFtcygpIHtcbiAgICB2YXIgcXVlcnlTdHJpbmcgPSB3aW5kb3cubG9jYXRpb24uc2VhcmNoO1xuICAgIHZhciB1cmxQYXJhbXMgPSB7fTtcbiAgICB2YXIgZSxcbiAgICBhID0gL1xcKy9nLCAgLy8gUmVnZXggZm9yIHJlcGxhY2luZyBhZGRpdGlvbiBzeW1ib2wgd2l0aCBhIHNwYWNlXG4gICAgciA9IC8oW14mPV0rKT0/KFteJl0qKS9nLFxuICAgIGQgPSBmdW5jdGlvbiAocykgeyByZXR1cm4gZGVjb2RlVVJJQ29tcG9uZW50KHMucmVwbGFjZShhLCBcIiBcIikpOyB9LFxuICAgIHEgPSBxdWVyeVN0cmluZy5zdWJzdHJpbmcoMSk7XG5cbiAgICB3aGlsZSAoZSA9IHIuZXhlYyhxKSkge1xuICAgICAgICB1cmxQYXJhbXNbZChlWzFdKV0gPSBkKGVbMl0pO1xuICAgIH1cbiAgICByZXR1cm4gdXJsUGFyYW1zO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBnZXRVcmxQYXJhbTogZ2V0VXJsUGFyYW1cbn07IiwidmFyIEFwcE1vZGUgPSByZXF1aXJlKCcuL2FwcC1tb2RlJyk7XG52YXIgSlNPTlV0aWxzID0gcmVxdWlyZSgnLi9qc29uLXV0aWxzJyk7XG52YXIgVVJMQ29uc3RhbnRzID0gcmVxdWlyZSgnLi91cmwtY29uc3RhbnRzJyk7XG5cbmZ1bmN0aW9uIGdldEdyb3VwU2V0dGluZ3NVcmwoKSB7XG4gICAgcmV0dXJuICcvYXBpL3NldHRpbmdzLyc7XG59XG5cbmZ1bmN0aW9uIGdldFBhZ2VEYXRhVXJsKCkge1xuICAgIHJldHVybiAnL2FwaS9wYWdlbmV3ZXIvJztcbn1cblxuZnVuY3Rpb24gZ2V0Q3JlYXRlUmVhY3Rpb25VcmwoKSB7XG4gICAgcmV0dXJuICcvYXBpL3RhZy9jcmVhdGUvJztcbn1cblxuZnVuY3Rpb24gZ2V0Q3JlYXRlQ29tbWVudFVybCgpIHtcbiAgICByZXR1cm4gJy9hcGkvY29tbWVudC9jcmVhdGUvJztcbn1cblxuZnVuY3Rpb24gZ2V0RmV0Y2hDb21tZW50VXJsKCkge1xuICAgIHJldHVybiAnL2FwaS9jb21tZW50L3JlcGxpZXMvJztcbn1cblxuZnVuY3Rpb24gZ2V0RmV0Y2hDb250ZW50Qm9kaWVzVXJsKCkge1xuICAgIHJldHVybiAnL2FwaS9jb250ZW50L2JvZGllcy8nO1xufVxuXG5mdW5jdGlvbiBnZXRGZXRjaENvbnRlbnRSZWNvbW1lbmRhdGlvblVybCgpIHtcbiAgICByZXR1cm4gJy9hcGkvY29udGVudHJlYyc7XG59XG5cbmZ1bmN0aW9uIGdldFNoYXJlUmVhY3Rpb25VcmwoKSB7XG4gICAgcmV0dXJuICcvYXBpL3NoYXJlLzsnXG59XG5cbmZ1bmN0aW9uIGdldENyZWF0ZVRlbXBVc2VyVXJsKCkge1xuICAgIHJldHVybiAnL2FwaS90ZW1wdXNlcic7XG59XG5cbmZ1bmN0aW9uIGdldFNoYXJlV2luZG93VXJsKCkge1xuICAgIHJldHVybiAnL3N0YXRpYy9zaGFyZS5odG1sJztcbn1cblxuZnVuY3Rpb24gZ2V0RXZlbnRVcmwoKSB7XG4gICAgcmV0dXJuICcvaW5zZXJ0JzsgLy8gTm90ZSB0aGF0IHRoaXMgVVJMIGlzIGZvciB0aGUgZXZlbnQgc2VydmVyLCBub3QgdGhlIGFwcCBzZXJ2ZXIuXG59XG5cbmZ1bmN0aW9uIGFudGVubmFMb2dpblVybCgpIHtcbiAgICByZXR1cm4gJy9hbnRfbG9naW4vJztcbn1cblxuZnVuY3Rpb24gY29tcHV0ZUltYWdlVXJsKCRlbGVtZW50LCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIHRyYW5zZm9ybSA9IGdldEltYWdlVVJMVHJhbnNmb3JtKGdyb3VwU2V0dGluZ3MpO1xuICAgIGlmICh0cmFuc2Zvcm0pIHtcbiAgICAgICAgcmV0dXJuIHRyYW5zZm9ybSgkZWxlbWVudC5nZXQoMCkpO1xuICAgIH1cbiAgICBpZiAoZ3JvdXBTZXR0aW5ncy5sZWdhY3lCZWhhdmlvcigpKSB7XG4gICAgICAgIHJldHVybiBsZWdhY3lDb21wdXRlSW1hZ2VVcmwoJGVsZW1lbnQpO1xuICAgIH1cbiAgICB2YXIgY29udGVudCA9ICRlbGVtZW50LmF0dHIoJ2FudC1pdGVtLWNvbnRlbnQnKSB8fCAkZWxlbWVudC5hdHRyKCdzcmMnKTtcbiAgICBpZiAoY29udGVudCAmJiBjb250ZW50LmluZGV4T2YoJy8vJykgIT09IDAgJiYgY29udGVudC5pbmRleE9mKCdodHRwJykgIT09IDApIHsgLy8gcHJvdG9jb2wtcmVsYXRpdmUgb3IgYWJzb2x1dGUgdXJsLCBlLmcuIC8vZG9tYWluLmNvbS9mb28vYmFyLnBuZyBvciBodHRwOi8vZG9tYWluLmNvbS9mb28vYmFyL3BuZ1xuICAgICAgICBpZiAoY29udGVudC5pbmRleE9mKCcvJykgPT09IDApIHsgLy8gZG9tYWluLXJlbGF0aXZlIHVybCwgZS5nLiAvZm9vL2Jhci5wbmcgPT4gZG9tYWluLmNvbS9mb28vYmFyLnBuZ1xuICAgICAgICAgICAgY29udGVudCA9IHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4gKyBjb250ZW50O1xuICAgICAgICB9IGVsc2UgeyAvLyBwYXRoLXJlbGF0aXZlIHVybCwgZS5nLiBiYXIucG5nID0+IGRvbWFpbi5jb20vYmF6L2Jhci5wbmdcbiAgICAgICAgICAgIHZhciBwYXRoID0gd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lO1xuICAgICAgICAgICAgdmFyIGluZGV4ID0gcGF0aC5sYXN0SW5kZXhPZignLycpICsgMTtcbiAgICAgICAgICAgIGlmIChwYXRoLmxlbmd0aCA+IGluZGV4KSB7XG4gICAgICAgICAgICAgICAgcGF0aCA9IHBhdGguc3Vic3RyaW5nKDAsIGluZGV4KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnRlbnQgPSB3aW5kb3cubG9jYXRpb24ub3JpZ2luICsgcGF0aCArIGNvbnRlbnQ7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGNvbnRlbnQ7XG59XG5cbmZ1bmN0aW9uIGdldEltYWdlVVJMVHJhbnNmb3JtKGdyb3VwU2V0dGluZ3MpIHtcbiAgICBpZiAoZ3JvdXBTZXR0aW5ncy5ncm91cE5hbWUoKS5pbmRleE9mKCcuYWJvdXQuY29tJykgIT09IC0xKSB7XG4gICAgICAgIHZhciBwYXR0ZXJuID0gLyhodHRwOlxcL1xcL2ZcXC50cW5cXC5jb21cXC95XFwvW15cXC9dKlxcLzEpXFwvW0xXXVxcLyhbXlxcL11cXC9bXlxcL11cXC9bXlxcL11cXC9bXlxcL11cXC9bXlxcL10qKS9naTtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICAgICAgICAgIHZhciBzcmMgPSBlbGVtZW50LmdldEF0dHJpYnV0ZSgnc3JjJyk7XG4gICAgICAgICAgICBpZiAoc3JjKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNyYy5yZXBsYWNlKHBhdHRlcm4sICckMS9TLyQyJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8vIExlZ2FjeSBpbXBsZW1lbnRhdGlvbiB3aGljaCBtYWludGFpbnMgdGhlIG9sZCBiZWhhdmlvciBvZiBlbmdhZ2VfZnVsbFxuLy8gVGhpcyBjb2RlIGlzIHdyb25nIGZvciBVUkxzIHRoYXQgc3RhcnQgd2l0aCBcIi8vXCIuIEl0IGFsc28gZ2l2ZXMgcHJlY2VkZW5jZSB0byB0aGUgc3JjIGF0dCBpbnN0ZWFkIG9mIGFudC1pdGVtLWNvbnRlbnRcbmZ1bmN0aW9uIGxlZ2FjeUNvbXB1dGVJbWFnZVVybCgkZWxlbWVudCkge1xuICAgIHZhciBjb250ZW50ID0gJGVsZW1lbnQuYXR0cignc3JjJykgfHwgJGVsZW1lbnQuYXR0cignYW50LWl0ZW0tY29udGVudCcpO1xuICAgIGlmIChjb250ZW50KSB7XG4gICAgICAgIGlmIChjb250ZW50LmluZGV4T2YoJy8nKSA9PT0gMCkge1xuICAgICAgICAgICAgY29udGVudCA9IHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4gKyBjb250ZW50O1xuICAgICAgICB9XG4gICAgICAgIGlmIChjb250ZW50LmluZGV4T2YoJ2h0dHAnKSAhPT0gMCkge1xuICAgICAgICAgICAgY29udGVudCA9IHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4gKyB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUgKyBjb250ZW50O1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBjb250ZW50O1xufVxuXG5mdW5jdGlvbiBjb21wdXRlTWVkaWFVcmwoJGVsZW1lbnQsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICBpZiAoZ3JvdXBTZXR0aW5ncy5sZWdhY3lCZWhhdmlvcigpKSB7XG4gICAgICAgIHJldHVybiBsZWdhY3lDb21wdXRlTWVkaWFVcmwoJGVsZW1lbnQpO1xuICAgIH1cbiAgICB2YXIgY29udGVudCA9ICRlbGVtZW50LmF0dHIoJ2FudC1pdGVtLWNvbnRlbnQnKSB8fCAkZWxlbWVudC5hdHRyKCdzcmMnKSB8fCAkZWxlbWVudC5hdHRyKCdkYXRhJyk7XG4gICAgaWYgKGNvbnRlbnQgJiYgY29udGVudC5pbmRleE9mKCcvLycpICE9PSAwICYmIGNvbnRlbnQuaW5kZXhPZignaHR0cCcpICE9PSAwKSB7IC8vIHByb3RvY29sLXJlbGF0aXZlIG9yIGFic29sdXRlIHVybCwgZS5nLiAvL2RvbWFpbi5jb20vZm9vL2Jhci5wbmcgb3IgaHR0cDovL2RvbWFpbi5jb20vZm9vL2Jhci9wbmdcbiAgICAgICAgaWYgKGNvbnRlbnQuaW5kZXhPZignLycpID09PSAwKSB7IC8vIGRvbWFpbi1yZWxhdGl2ZSB1cmwsIGUuZy4gL2Zvby9iYXIucG5nID0+IGRvbWFpbi5jb20vZm9vL2Jhci5wbmdcbiAgICAgICAgICAgIGNvbnRlbnQgPSB3aW5kb3cubG9jYXRpb24ub3JpZ2luICsgY29udGVudDtcbiAgICAgICAgfSBlbHNlIHsgLy8gcGF0aC1yZWxhdGl2ZSB1cmwsIGUuZy4gYmFyLnBuZyA9PiBkb21haW4uY29tL2Jhei9iYXIucG5nXG4gICAgICAgICAgICB2YXIgcGF0aCA9IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZTtcbiAgICAgICAgICAgIHZhciBpbmRleCA9IHBhdGgubGFzdEluZGV4T2YoJy8nKSArIDE7XG4gICAgICAgICAgICBpZiAocGF0aC5sZW5ndGggPiBpbmRleCkge1xuICAgICAgICAgICAgICAgIHBhdGggPSBwYXRoLnN1YnN0cmluZygwLCBpbmRleCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb250ZW50ID0gd2luZG93LmxvY2F0aW9uLm9yaWdpbiArIHBhdGggKyBjb250ZW50O1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBjb250ZW50O1xufVxuXG4vLyBMZWdhY3kgaW1wbGVtZW50YXRpb24gd2hpY2ggbWFpbnRhaW5zIHRoZSBvbGQgYmVoYXZpb3Igb2YgZW5nYWdlX2Z1bGxcbi8vIFRoaXMgY29kZSBpcyB3cm9uZyBmb3IgVVJMcyB0aGF0IHN0YXJ0IHdpdGggXCIvL1wiLiBJdCBhbHNvIGdpdmVzIHByZWNlZGVuY2UgdG8gdGhlIHNyYyBhdHQgaW5zdGVhZCBvZiBhbnQtaXRlbS1jb250ZW50XG5mdW5jdGlvbiBsZWdhY3lDb21wdXRlTWVkaWFVcmwoJGVsZW1lbnQpIHtcbiAgICB2YXIgY29udGVudCA9ICRlbGVtZW50LmF0dHIoJ2FudC1pdGVtLWNvbnRlbnQnKSB8fCAkZWxlbWVudC5hdHRyKCdzcmMnKSB8fCAkZWxlbWVudC5hdHRyKCdkYXRhJykgfHwgJyc7XG4gICAgaWYgKGNvbnRlbnQpIHtcbiAgICAgICAgaWYgKGNvbnRlbnQuaW5kZXhPZignLycpID09PSAwKSB7XG4gICAgICAgICAgICBjb250ZW50ID0gd2luZG93LmxvY2F0aW9uLm9yaWdpbiArIGNvbnRlbnQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvbnRlbnQuaW5kZXhPZignaHR0cCcpICE9PSAwKSB7XG4gICAgICAgICAgICBjb250ZW50ID0gd2luZG93LmxvY2F0aW9uLm9yaWdpbiArIHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZSArIGNvbnRlbnQ7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGNvbnRlbnQ7XG59XG5cbi8vIFJldHVybnMgYSBVUkwgZm9yIGNvbnRlbnQgcmVjIHdoaWNoIHdpbGwgdGFrZSB0aGUgdXNlciB0byB0aGUgdGFyZ2V0IHVybCBhbmQgcmVjb3JkIHRoZSBnaXZlbiBjbGljayBldmVudFxuZnVuY3Rpb24gY29tcHV0ZUNvbnRlbnRSZWNVcmwodGFyZ2V0VXJsLCBjbGlja0V2ZW50KSB7XG4gICAgcmV0dXJuIGFwcFNlcnZlclVybCgpICsgJy9jci8/dGFyZ2V0VXJsPScgKyBlbmNvZGVVUklDb21wb25lbnQodGFyZ2V0VXJsKSArICcmZXZlbnQ9JyArIGVuY29kZVVSSUNvbXBvbmVudChKU09OVXRpbHMuc3RyaW5naWZ5KGNsaWNrRXZlbnQpKVxufVxuXG5mdW5jdGlvbiBhbWF6b25TM1VybCgpIHtcbiAgICByZXR1cm4gVVJMQ29uc3RhbnRzLkFNQVpPTl9TMztcbn1cblxuLy8gVE9ETzogcmVmYWN0b3IgdXNhZ2Ugb2YgYXBwIHNlcnZlciB1cmwgKyByZWxhdGl2ZSByb3V0ZXNcbmZ1bmN0aW9uIGFwcFNlcnZlclVybCgpIHtcbiAgICBpZiAoQXBwTW9kZS50ZXN0KSB7XG4gICAgICAgIHJldHVybiBVUkxDb25zdGFudHMuVEVTVDtcbiAgICB9IGVsc2UgaWYgKEFwcE1vZGUub2ZmbGluZSkge1xuICAgICAgICByZXR1cm4gVVJMQ29uc3RhbnRzLkRFVkVMT1BNRU5UO1xuICAgIH1cbiAgICByZXR1cm4gVVJMQ29uc3RhbnRzLlBST0RVQ1RJT047XG59XG5cbi8vIFRPRE86IHJlZmFjdG9yIHVzYWdlIG9mIGV2ZW50cyBzZXJ2ZXIgdXJsICsgcmVsYXRpdmUgcm91dGVzXG5mdW5jdGlvbiBldmVudHNTZXJ2ZXJVcmwoKSB7XG4gICAgaWYgKEFwcE1vZGUub2ZmbGluZSkge1xuICAgICAgICByZXR1cm4gVVJMQ29uc3RhbnRzLkRFVkVMT1BNRU5UX0VWRU5UUztcbiAgICB9XG4gICAgcmV0dXJuIFVSTENvbnN0YW50cy5QUk9EVUNUSU9OX0VWRU5UUztcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGFwcFNlcnZlclVybDogYXBwU2VydmVyVXJsLFxuICAgIGV2ZW50c1NlcnZlclVybDogZXZlbnRzU2VydmVyVXJsLFxuICAgIGFtYXpvblMzVXJsOiBhbWF6b25TM1VybCxcbiAgICBncm91cFNldHRpbmdzVXJsOiBnZXRHcm91cFNldHRpbmdzVXJsLFxuICAgIHBhZ2VEYXRhVXJsOiBnZXRQYWdlRGF0YVVybCxcbiAgICBjcmVhdGVSZWFjdGlvblVybDogZ2V0Q3JlYXRlUmVhY3Rpb25VcmwsXG4gICAgY3JlYXRlQ29tbWVudFVybDogZ2V0Q3JlYXRlQ29tbWVudFVybCxcbiAgICBmZXRjaENvbW1lbnRVcmw6IGdldEZldGNoQ29tbWVudFVybCxcbiAgICBmZXRjaENvbnRlbnRCb2RpZXNVcmw6IGdldEZldGNoQ29udGVudEJvZGllc1VybCxcbiAgICBmZXRjaENvbnRlbnRSZWNvbW1lbmRhdGlvblVybDogZ2V0RmV0Y2hDb250ZW50UmVjb21tZW5kYXRpb25VcmwsXG4gICAgc2hhcmVSZWFjdGlvblVybDogZ2V0U2hhcmVSZWFjdGlvblVybCxcbiAgICBjcmVhdGVUZW1wVXNlclVybDogZ2V0Q3JlYXRlVGVtcFVzZXJVcmwsXG4gICAgc2hhcmVXaW5kb3dVcmw6IGdldFNoYXJlV2luZG93VXJsLFxuICAgIGFudGVubmFMb2dpblVybDogYW50ZW5uYUxvZ2luVXJsLFxuICAgIGNvbXB1dGVJbWFnZVVybDogY29tcHV0ZUltYWdlVXJsLFxuICAgIGNvbXB1dGVNZWRpYVVybDogY29tcHV0ZU1lZGlhVXJsLFxuICAgIGNvbXB1dGVDb250ZW50UmVjVXJsOiBjb21wdXRlQ29udGVudFJlY1VybCxcbiAgICBldmVudFVybDogZ2V0RXZlbnRVcmxcbn07XG4iLCJ2YXIgQXBwTW9kZSA9IHJlcXVpcmUoJy4vYXBwLW1vZGUnKTtcbnZhciBKU09OUENsaWVudCA9IHJlcXVpcmUoJy4vanNvbnAtY2xpZW50Jyk7XG52YXIgVVJMcyA9IHJlcXVpcmUoJy4vdXJscycpO1xudmFyIFhETUNsaWVudCA9IHJlcXVpcmUoJy4veGRtLWNsaWVudCcpO1xuXG52YXIgY2FjaGVkVXNlckluZm87XG5cbi8vIEZldGNoIHRoZSBsb2dnZWQgaW4gdXNlci4gV2lsbCB0cmlnZ2VyIGEgbmV0d29yayByZXF1ZXN0IHRvIGNyZWF0ZSBhIHRlbXBvcmFyeSB1c2VyIGlmIG5lZWRlZC5cbmZ1bmN0aW9uIGZldGNoVXNlcihncm91cFNldHRpbmdzLCBjYWxsYmFjaykge1xuICAgIGdldFVzZXJDb29raWVzKGZ1bmN0aW9uKGNvb2tpZXMpIHtcbiAgICAgICAgaWYgKCFjb29raWVzLmFudF90b2tlbikge1xuICAgICAgICAgICAgY3JlYXRlVGVtcFVzZXIoZ3JvdXBTZXR0aW5ncywgY2FsbGJhY2spO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdXBkYXRlVXNlckZyb21Db29raWVzKGNvb2tpZXMpO1xuICAgICAgICAgICAgY2FsbGJhY2soY2FjaGVkVXNlckluZm8pO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIHJlZnJlc2hVc2VyRnJvbUNvb2tpZXMoY2FsbGJhY2spIHtcbiAgICBnZXRVc2VyQ29va2llcyhmdW5jdGlvbihjb29raWVzKSB7XG4gICAgICAgIHVwZGF0ZVVzZXJGcm9tQ29va2llcyhjb29raWVzKTtcbiAgICAgICAgY2FsbGJhY2soY2FjaGVkVXNlckluZm8pO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBnZXRVc2VyQ29va2llcyhjYWxsYmFjaykge1xuICAgIFhETUNsaWVudC5zZW5kTWVzc2FnZSgnZ2V0Q29va2llcycsIFsgJ3VzZXJfaWQnLCAndXNlcl90eXBlJywgJ2FudF90b2tlbicsICd0ZW1wX3VzZXInIF0sIGZ1bmN0aW9uKGNvb2tpZXMpIHtcbiAgICAgICAgY2FsbGJhY2soY29va2llcyk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIHN0b3JlVXNlckNvb2tpZXModXNlckluZm8pIHtcbiAgICB2YXIgY29va2llcyA9IHtcbiAgICAgICAgJ3VzZXJfaWQnOiB1c2VySW5mby51c2VyX2lkLFxuICAgICAgICAndXNlcl90eXBlJzogdXNlckluZm8udXNlcl90eXBlLFxuICAgICAgICAnYW50X3Rva2VuJzogdXNlckluZm8uYW50X3Rva2VuLFxuICAgICAgICAndGVtcF91c2VyJzogdXNlckluZm8udGVtcF91c2VyXG4gICAgfTtcbiAgICBYRE1DbGllbnQuc2VuZE1lc3NhZ2UoJ3NldENvb2tpZXMnLCBjb29raWVzKTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlVGVtcFVzZXIoZ3JvdXBTZXR0aW5ncywgY2FsbGJhY2spIHtcbiAgICB2YXIgc2VuZERhdGEgPSB7XG4gICAgICAgIGdyb3VwX2lkIDogZ3JvdXBTZXR0aW5ncy5ncm91cElkKClcbiAgICB9O1xuICAgIC8vIFRoaXMgbW9kdWxlIHVzZXMgdGhlIGxvdy1sZXZlbCBKU09OUENsaWVudCBpbnN0ZWFkIG9mIEFqYXhDbGllbnQgaW4gb3JkZXIgdG8gYXZvaWQgYSBjaXJjdWxhciBkZXBlbmRlbmN5LlxuICAgIEpTT05QQ2xpZW50LmRvR2V0SlNPTlAoVVJMcy5hcHBTZXJ2ZXJVcmwoKSwgVVJMcy5jcmVhdGVUZW1wVXNlclVybCgpLCBzZW5kRGF0YSwgZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgIGlmICghY2FjaGVkVXNlckluZm8gfHwgIWNhY2hlZFVzZXJJbmZvLnVzZXJfaWQgfHwgIWNhY2hlZFVzZXJJbmZvLmFudF90b2tlbiB8fCAhY2FjaGVkVXNlckluZm8udGVtcF91c2VyKSB7XG4gICAgICAgICAgICAvLyBJdCdzIHBvc3NpYmxlIHRoYXQgbXVsdGlwbGUgb2YgdGhlc2UgYWpheCByZXF1ZXN0cyBnb3QgZmlyZWQgaW4gcGFyYWxsZWwuIFdoaWNoZXZlciBvbmVcbiAgICAgICAgICAgIC8vIGNvbWVzIGJhY2sgZmlyc3Qgd2lucy5cbiAgICAgICAgICAgIHVwZGF0ZVVzZXJGcm9tUmVzcG9uc2UocmVzcG9uc2UpO1xuICAgICAgICB9XG4gICAgICAgIGNhbGxiYWNrKGNhY2hlZFVzZXJJbmZvKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlVXNlckZyb21Db29raWVzKGNvb2tpZXMpIHtcbiAgICB2YXIgdXNlckluZm8gPSB7fTtcbiAgICB1c2VySW5mby51c2VyX2lkID0gY29va2llcy51c2VyX2lkO1xuICAgIHVzZXJJbmZvLnVzZXJfdHlwZSA9IGNvb2tpZXMudXNlcl90eXBlO1xuICAgIHVzZXJJbmZvLmFudF90b2tlbiA9IGNvb2tpZXMuYW50X3Rva2VuO1xuICAgIHVzZXJJbmZvLnRlbXBfdXNlciA9IGNvb2tpZXMudGVtcF91c2VyO1xuXG4gICAgY2FjaGVkVXNlckluZm8gPSB1c2VySW5mbztcbiAgICByZXR1cm4gY2FjaGVkVXNlckluZm87XG5cbn1cblxuZnVuY3Rpb24gdXBkYXRlVXNlckZyb21SZXNwb25zZShyZXNwb25zZSkge1xuICAgIHJlc3BvbnNlID0gcmVzcG9uc2UgfHwge307XG5cbiAgICB2YXIgdXNlckluZm8gPSB7fTtcbiAgICB1c2VySW5mby5hbnRfdG9rZW4gPSByZXNwb25zZS5hbnRfdG9rZW47XG4gICAgdXNlckluZm8udXNlcl9pZCA9IHJlc3BvbnNlLnVzZXJfaWQ7XG4gICAgdXNlckluZm8uZnVsbF9uYW1lID0gcmVzcG9uc2UuZnVsbF9uYW1lO1xuICAgIHVzZXJJbmZvLmZpcnN0X25hbWUgPSByZXNwb25zZS5mdWxsX25hbWU7XG4gICAgdXNlckluZm8uaW1nX3VybCA9IHJlc3BvbnNlLmltZ191cmw7XG4gICAgdXNlckluZm8udXNlcl90eXBlID0gcmVzcG9uc2UudXNlcl90eXBlO1xuICAgIHVzZXJJbmZvLnRlbXBfdXNlciA9ICF1c2VySW5mby5maXJzdF9uYW1lICYmICF1c2VySW5mby5mdWxsX25hbWU7XG5cbiAgICBjYWNoZWRVc2VySW5mbyA9IHVzZXJJbmZvO1xuICAgIHN0b3JlVXNlckNvb2tpZXModXNlckluZm8pOyAvLyBVcGRhdGUgY29va2llcyB3aGVuZXZlciB3ZSBnZXQgYSB1c2VyIGZyb20gdGhlIHNlcnZlci5cbn1cblxuLy8gUmV0dXJucyB0aGUgbG9nZ2VkLWluIHVzZXIsIGlmIHdlIGFscmVhZHkgaGF2ZSBvbmUuIFdpbGwgbm90IHRyaWdnZXIgYSBuZXR3b3JrIHJlcXVlc3QuXG5mdW5jdGlvbiBjYWNoZWRVc2VyKCkge1xuICAgIHJldHVybiBjYWNoZWRVc2VySW5mbztcbn1cblxuLy8gQXR0ZW1wdHMgdG8gY3JlYXRlIGEgbmV3IGF1dGhvcml6YXRpb24gdG9rZW4gZm9yIHRoZSBsb2dnZWQtaW4gdXNlci5cbmZ1bmN0aW9uIHJlQXV0aG9yaXplVXNlcihncm91cFNldHRpbmdzLCBjYWxsYmFjaykge1xuICAgIHZhciBvbGRUb2tlbiA9IGNhY2hlZFVzZXJJbmZvID8gY2FjaGVkVXNlckluZm8uYW50X3Rva2VuIDogdW5kZWZpbmVkO1xuICAgIGdldFVzZXJDb29raWVzKGZ1bmN0aW9uKGNvb2tpZXMpIHtcbiAgICAgICAgdXBkYXRlVXNlckZyb21Db29raWVzKGNvb2tpZXMpO1xuICAgICAgICB2YXIgdXNlclR5cGUgPSBjb29raWVzLnVzZXJfdHlwZTtcbiAgICAgICAgaWYgKHVzZXJUeXBlID09PSAnZmFjZWJvb2snKSB7XG4gICAgICAgICAgICBYRE1DbGllbnQuc2VuZE1lc3NhZ2UoJ2ZhY2Vib29rR2V0TG9naW5TdGF0dXMnLCB0cnVlLCBmdW5jdGlvbihyZXNwb25zZSkgeyAvLyBGb3JjZSBhIHJvdW5kIHRyaXAgdG8gcmVhdXRob3JpemUuXG4gICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlLnN0YXR1cyA9PT0gJ2Nvbm5lY3RlZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgZ2V0QW50VG9rZW5Gb3JGYWNlYm9va0xvZ2luKHJlc3BvbnNlLmF1dGhSZXNwb25zZSwgZ3JvdXBTZXR0aW5ncywgbm90aWZ5SGFzTmV3VG9rZW4pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocmVzcG9uc2Uuc3RhdHVzID09PSAnbm90X2F1dGhvcml6ZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFRoZSB1c2VyIGRpZG4ndCBhdXRob3JpemUgdXMgZm9yIEZCIGxvZ2luLiBSZXZlcnQgdGhlbSB0byBhIHRlbXAgdXNlciBpbnN0ZWFkLlxuICAgICAgICAgICAgICAgICAgICBkZUF1dGhvcml6ZVVzZXIoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjcmVhdGVUZW1wVXNlcihncm91cFNldHRpbmdzLCBub3RpZnlIYXNOZXdUb2tlbik7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFRPRE86IE1ha2Ugc3VyZSB0aGUgRkIgbG9naW4gd2luZG93IG9wZW5zIHByb3Blcmx5IHdoZW4gdHJpZ2dlcmVkIGZyb20gdGhlIGJhY2tncm91bmQgbGlrZSB0aGlzLlxuICAgICAgICAgICAgICAgICAgICBmYWNlYm9va0xvZ2luKGdyb3VwU2V0dGluZ3MsIG5vdGlmeUhhc05ld1Rva2VuKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIEZvciBBbnRlbm5hIHVzZXJzLCBqdXN0IHJlLXJlYWQgdGhlIGNvb2tpZXMgYW5kIHNlZSBpZiB0aGV5J3ZlIGNoYW5nZWQuXG4gICAgICAgICAgICBub3RpZnlIYXNOZXdUb2tlbigpO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICBmdW5jdGlvbiBub3RpZnlIYXNOZXdUb2tlbigpIHtcbiAgICAgICAgdmFyIGhhc05ld1Rva2VuID0gY2FjaGVkVXNlckluZm8gJiYgY2FjaGVkVXNlckluZm8uYW50X3Rva2VuICYmIGNhY2hlZFVzZXJJbmZvLmFudF90b2tlbiAhPT0gb2xkVG9rZW47XG4gICAgICAgIGlmIChjYWxsYmFjaykgeyBjYWxsYmFjayhoYXNOZXdUb2tlbikgfTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGZhY2Vib29rTG9naW4oZ3JvdXBTZXR0aW5ncywgY2FsbGJhY2spIHtcbiAgICBYRE1DbGllbnQuc2VuZE1lc3NhZ2UoJ2ZhY2Vib29rTG9naW4nLCB7IHNjb3BlOiAnZW1haWwnIH0sIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgIHZhciBhdXRoUmVzcG9uc2UgPSByZXNwb25zZS5hdXRoUmVzcG9uc2U7XG4gICAgICAgIGlmIChhdXRoUmVzcG9uc2UpIHtcbiAgICAgICAgICAgIGdldEFudFRva2VuRm9yRmFjZWJvb2tMb2dpbihhdXRoUmVzcG9uc2UsIGdyb3VwU2V0dGluZ3MsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKGNhY2hlZFVzZXJJbmZvKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FsbGJhY2soY2FjaGVkVXNlckluZm8pO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGdldEFudFRva2VuRm9yRmFjZWJvb2tMb2dpbihmYWNlYm9va0F1dGhSZXNwb25zZSwgZ3JvdXBTZXR0aW5ncywgY2FsbGJhY2spIHtcbiAgICB2YXIgc2VuZERhdGEgPSB7XG4gICAgICAgIGZiOiBmYWNlYm9va0F1dGhSZXNwb25zZSxcbiAgICAgICAgZ3JvdXBfaWQ6IGdyb3VwU2V0dGluZ3MuZ3JvdXBJZCgpLFxuICAgICAgICB1c2VyX2lkOiBjYWNoZWRVc2VySW5mby51c2VyX2lkLCAvLyBtaWdodCBiZSB0ZW1wLCBtaWdodCBiZSB0aGUgSUQgb2YgYSB2YWxpZCBGQi1jcmVhdGVkIHVzZXJcbiAgICAgICAgYW50X3Rva2VuOiBjYWNoZWRVc2VySW5mby5hbnRfdG9rZW5cbiAgICB9O1xuICAgIEpTT05QQ2xpZW50LmRvR2V0SlNPTlAoVVJMcy5hcHBTZXJ2ZXJVcmwoKSwgJy9hcGkvZmInLCBzZW5kRGF0YSwgZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgIHVwZGF0ZVVzZXJGcm9tUmVzcG9uc2UocmVzcG9uc2UpO1xuICAgICAgICBjYWxsYmFjayhjYWNoZWRVc2VySW5mbyk7XG4gICAgfSwgZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgIGNyZWF0ZVRlbXBVc2VyKGdyb3VwU2V0dGluZ3MsIGNhbGxiYWNrKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gZGVBdXRob3JpemVVc2VyKGNhbGxiYWNrKSB7XG4gICAgaWYgKGNhY2hlZFVzZXJJbmZvICYmICFjYWNoZWRVc2VySW5mby50ZW1wX3VzZXIpIHtcbiAgICAgICAgdmFyIHNlbmREYXRhID0ge1xuICAgICAgICAgICAgdXNlcl9pZCA6IGNhY2hlZFVzZXJJbmZvLnVzZXJfaWQsXG4gICAgICAgICAgICBhbnRfdG9rZW4gOiBjYWNoZWRVc2VySW5mby5hbnRfdG9rZW5cbiAgICAgICAgfTtcbiAgICAgICAgSlNPTlBDbGllbnQuZG9HZXRKU09OUChVUkxzLmFwcFNlcnZlclVybCgpLCAnL2FwaS9kZWF1dGhvcml6ZScsIHNlbmREYXRhLCBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAgICAgZGlzY2FyZFVzZXJJbmZvKGNhbGxiYWNrKTtcbiAgICAgICAgfSlcbiAgICB9IGVsc2Uge1xuICAgICAgICBkaXNjYXJkVXNlckluZm8oY2FsbGJhY2spO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZGlzY2FyZFVzZXJJbmZvKGNhbGxiYWNrKSB7XG4gICAgWERNQ2xpZW50LnNlbmRNZXNzYWdlKCdyZW1vdmVDb29raWVzJywgWyd1c2VyX2lkJywgJ3VzZXJfdHlwZScsICdhbnRfdG9rZW4nLCAndGVtcF91c2VyJ10sIHt9LCBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgY2FjaGVkVXNlckluZm8gPSB7fTtcbiAgICAgICAgY2FsbGJhY2soKTtcbiAgICB9KTtcbn1cblxuLy8gVE9ETzogRmlndXJlIG91dCBob3cgbWFueSBkaWZmZXJlbnQgZm9ybWF0cyBvZiB1c2VyIGRhdGEgd2UgaGF2ZSBhbmQgZWl0aGVyIHVuaWZ5IHRoZW0gb3IgcHJvdmlkZSBjbGVhclxuLy8gICAgICAgQVBJIGhlcmUgdG8gdHJhbnNsYXRlIGVhY2ggdmFyaWF0aW9uIGludG8gc29tZXRoaW5nIHN0YW5kYXJkIGZvciB0aGUgY2xpZW50LlxuZnVuY3Rpb24gdXNlckZyb21Db21tZW50SlNPTihqc29uVXNlciwgc29jaWFsVXNlcikgeyAvLyBUaGlzIGZvcm1hdCB3b3JrcyBmb3IgdGhlIHVzZXIgcmV0dXJuZWQgZnJvbSAvYXBpL2NvbW1lbnRzL3JlcGxpZXNcbiAgICB2YXIgdXNlciA9IHt9O1xuICAgIGlmIChqc29uVXNlci51c2VyX2lkKSB7XG4gICAgICAgIHVzZXIuaWQgPSBqc29uVXNlci51c2VyX2lkO1xuICAgIH1cbiAgICBpZiAoc29jaWFsVXNlcikge1xuICAgICAgICB1c2VyLmltYWdlVVJMID0gc29jaWFsVXNlci5pbWdfdXJsO1xuICAgICAgICB1c2VyLm5hbWUgPSBzb2NpYWxVc2VyLmZ1bGxfbmFtZTtcbiAgICB9XG4gICAgaWYgKCF1c2VyLm5hbWUpIHtcbiAgICAgICAgdXNlci5uYW1lID0ganNvblVzZXIuZmlyc3RfbmFtZSA/IChqc29uVXNlci5maXJzdF9uYW1lICsgJyAnICsganNvblVzZXIubGFzdF9uYW1lKSA6ICdBbm9ueW1vdXMnO1xuICAgIH1cbiAgICBpZiAoIXVzZXIuaW1hZ2VVUkwpIHtcbiAgICAgICAgdXNlci5pbWFnZVVSTCA9IGFub255bW91c0ltYWdlVVJMKClcbiAgICB9XG4gICAgcmV0dXJuIHVzZXI7XG59XG5cblxuLy8gVE9ETzogUmV2aXNpdCB0aGUgdXNlciB0aGF0IHdlIHBhc3MgYmFjayBmb3IgbmV3IGNvbW1lbnRzLiBPcHRpb25zIGFyZTpcbi8vICAgICAgIDEuIFVzZSB0aGUgbG9nZ2VkIGluIHVzZXIsIGFzc3VtaW5nIHRoZSBjYWNoZWQgdXNlciBoYXMgc29jaWFsX3VzZXIgaW5mb1xuLy8gICAgICAgMi4gVXNlIGEgZ2VuZXJpYyBcInlvdVwiIHJlcHJlc2VudGF0aW9uIGxpa2Ugd2UncmUgZG9pbmcgbm93LlxuLy8gICAgICAgMy4gRG9uJ3Qgc2hvdyBhbnkgaW5kaWNhdGlvbiBvZiB0aGUgdXNlci4gSnVzdCBzaG93IHRoZSBjb21tZW50LlxuLy8gICAgICAgRm9yIG5vdywgdGhpcyBpcyBqdXN0IGdpdmluZyB1cyBzb21lIG5vdGlvbiBvZiB1c2VyIHdpdGhvdXQgYSByb3VuZCB0cmlwLlxuZnVuY3Rpb24gb3B0aW1pc3RpY0NvbW1lbnRVc2VyKCkge1xuICAgIHZhciB1c2VyID0ge1xuICAgICAgICBuYW1lOiAnWW91JyxcbiAgICAgICAgaW1hZ2VVUkw6IGFub255bW91c0ltYWdlVVJMKClcbiAgICB9O1xuICAgIHJldHVybiB1c2VyO1xufVxuXG5mdW5jdGlvbiBhbm9ueW1vdXNJbWFnZVVSTCgpIHtcbiAgICByZXR1cm4gQXBwTW9kZS5vZmZsaW5lID8gJy9zdGF0aWMvd2lkZ2V0L2ltYWdlcy9hbm9ueW1vdXNwbG9kZS5wbmcnIDogJ2h0dHA6Ly9zMy5hbWF6b25hd3MuY29tL3JlYWRyYm9hcmQvd2lkZ2V0L2ltYWdlcy9hbm9ueW1vdXNwbG9kZS5wbmcnO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBmcm9tQ29tbWVudEpTT046IHVzZXJGcm9tQ29tbWVudEpTT04sXG4gICAgb3B0aW1pc3RpY0NvbW1lbnRVc2VyOiBvcHRpbWlzdGljQ29tbWVudFVzZXIsXG4gICAgZmV0Y2hVc2VyOiBmZXRjaFVzZXIsXG4gICAgcmVmcmVzaFVzZXJGcm9tQ29va2llczogcmVmcmVzaFVzZXJGcm9tQ29va2llcyxcbiAgICBjYWNoZWRVc2VyOiBjYWNoZWRVc2VyLFxuICAgIHJlQXV0aG9yaXplVXNlcjogcmVBdXRob3JpemVVc2VyLFxuICAgIGZhY2Vib29rTG9naW46IGZhY2Vib29rTG9naW5cbn07IiwiLyoqXG4gKiBBdXRob3I6IEphc29uIEZhcnJlbGxcbiAqIEF1dGhvciBVUkk6IGh0dHA6Ly91c2VhbGxmaXZlLmNvbS9cbiAqXG4gKiBEZXNjcmlwdGlvbjogQ2hlY2tzIGlmIGEgRE9NIGVsZW1lbnQgaXMgdHJ1bHkgdmlzaWJsZS5cbiAqIFBhY2thZ2UgVVJMOiBodHRwczovL2dpdGh1Yi5jb20vVXNlQWxsRml2ZS90cnVlLXZpc2liaWxpdHlcbiAqL1xuZnVuY3Rpb24gaXNWaXNpYmxlKGVsZW1lbnQpIHtcblxuICAgIC8qKlxuICAgICAqIENoZWNrcyBpZiBhIERPTSBlbGVtZW50IGlzIHZpc2libGUuIFRha2VzIGludG9cbiAgICAgKiBjb25zaWRlcmF0aW9uIGl0cyBwYXJlbnRzIGFuZCBvdmVyZmxvdy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSAoZWwpICAgICAgdGhlIERPTSBlbGVtZW50IHRvIGNoZWNrIGlmIGlzIHZpc2libGVcbiAgICAgKlxuICAgICAqIFRoZXNlIHBhcmFtcyBhcmUgb3B0aW9uYWwgdGhhdCBhcmUgc2VudCBpbiByZWN1cnNpdmVseSxcbiAgICAgKiB5b3UgdHlwaWNhbGx5IHdvbid0IHVzZSB0aGVzZTpcbiAgICAgKlxuICAgICAqIEBwYXJhbSAodCkgICAgICAgVG9wIGNvcm5lciBwb3NpdGlvbiBudW1iZXJcbiAgICAgKiBAcGFyYW0gKHIpICAgICAgIFJpZ2h0IGNvcm5lciBwb3NpdGlvbiBudW1iZXJcbiAgICAgKiBAcGFyYW0gKGIpICAgICAgIEJvdHRvbSBjb3JuZXIgcG9zaXRpb24gbnVtYmVyXG4gICAgICogQHBhcmFtIChsKSAgICAgICBMZWZ0IGNvcm5lciBwb3NpdGlvbiBudW1iZXJcbiAgICAgKiBAcGFyYW0gKHcpICAgICAgIEVsZW1lbnQgd2lkdGggbnVtYmVyXG4gICAgICogQHBhcmFtIChoKSAgICAgICBFbGVtZW50IGhlaWdodCBudW1iZXJcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBfaXNWaXNpYmxlKGVsLCB0LCByLCBiLCBsLCB3LCBoKSB7XG4gICAgICAgIHZhciBwID0gZWwucGFyZW50Tm9kZSxcbiAgICAgICAgICAgICAgICBWSVNJQkxFX1BBRERJTkcgPSAyO1xuXG4gICAgICAgIGlmICggIV9lbGVtZW50SW5Eb2N1bWVudChlbCkgKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICAvLy0tIFJldHVybiB0cnVlIGZvciBkb2N1bWVudCBub2RlXG4gICAgICAgIGlmICggOSA9PT0gcC5ub2RlVHlwZSApIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8tLSBSZXR1cm4gZmFsc2UgaWYgb3VyIGVsZW1lbnQgaXMgaW52aXNpYmxlXG4gICAgICAgIGlmIChcbiAgICAgICAgICAgICAnMCcgPT09IF9nZXRTdHlsZShlbCwgJ29wYWNpdHknKSB8fFxuICAgICAgICAgICAgICdub25lJyA9PT0gX2dldFN0eWxlKGVsLCAnZGlzcGxheScpIHx8XG4gICAgICAgICAgICAgJ2hpZGRlbicgPT09IF9nZXRTdHlsZShlbCwgJ3Zpc2liaWxpdHknKVxuICAgICAgICApIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChcbiAgICAgICAgICAgICd1bmRlZmluZWQnID09PSB0eXBlb2YodCkgfHxcbiAgICAgICAgICAgICd1bmRlZmluZWQnID09PSB0eXBlb2YocikgfHxcbiAgICAgICAgICAgICd1bmRlZmluZWQnID09PSB0eXBlb2YoYikgfHxcbiAgICAgICAgICAgICd1bmRlZmluZWQnID09PSB0eXBlb2YobCkgfHxcbiAgICAgICAgICAgICd1bmRlZmluZWQnID09PSB0eXBlb2YodykgfHxcbiAgICAgICAgICAgICd1bmRlZmluZWQnID09PSB0eXBlb2YoaClcbiAgICAgICAgKSB7XG4gICAgICAgICAgICB0ID0gZWwub2Zmc2V0VG9wO1xuICAgICAgICAgICAgbCA9IGVsLm9mZnNldExlZnQ7XG4gICAgICAgICAgICBiID0gdCArIGVsLm9mZnNldEhlaWdodDtcbiAgICAgICAgICAgIHIgPSBsICsgZWwub2Zmc2V0V2lkdGg7XG4gICAgICAgICAgICB3ID0gZWwub2Zmc2V0V2lkdGg7XG4gICAgICAgICAgICBoID0gZWwub2Zmc2V0SGVpZ2h0O1xuICAgICAgICB9XG4gICAgICAgIC8vLS0gSWYgd2UgaGF2ZSBhIHBhcmVudCwgbGV0J3MgY29udGludWU6XG4gICAgICAgIGlmICggcCApIHtcbiAgICAgICAgICAgIC8vLS0gQ2hlY2sgaWYgdGhlIHBhcmVudCBjYW4gaGlkZSBpdHMgY2hpbGRyZW4uXG4gICAgICAgICAgICBpZiAoIF9vdmVyZmxvd0hpZGRlbihwKSApIHtcbiAgICAgICAgICAgICAgICAvLy0tIE9ubHkgY2hlY2sgaWYgdGhlIG9mZnNldCBpcyBkaWZmZXJlbnQgZm9yIHRoZSBwYXJlbnRcbiAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgIC8vLS0gSWYgdGhlIHRhcmdldCBlbGVtZW50IGlzIHRvIHRoZSByaWdodCBvZiB0aGUgcGFyZW50IGVsbVxuICAgICAgICAgICAgICAgICAgICBsICsgVklTSUJMRV9QQURESU5HID4gcC5vZmZzZXRXaWR0aCArIHAuc2Nyb2xsTGVmdCB8fFxuICAgICAgICAgICAgICAgICAgICAvLy0tIElmIHRoZSB0YXJnZXQgZWxlbWVudCBpcyB0byB0aGUgbGVmdCBvZiB0aGUgcGFyZW50IGVsbVxuICAgICAgICAgICAgICAgICAgICBsICsgdyAtIFZJU0lCTEVfUEFERElORyA8IHAuc2Nyb2xsTGVmdCB8fFxuICAgICAgICAgICAgICAgICAgICAvLy0tIElmIHRoZSB0YXJnZXQgZWxlbWVudCBpcyB1bmRlciB0aGUgcGFyZW50IGVsbVxuICAgICAgICAgICAgICAgICAgICB0ICsgVklTSUJMRV9QQURESU5HID4gcC5vZmZzZXRIZWlnaHQgKyBwLnNjcm9sbFRvcCB8fFxuICAgICAgICAgICAgICAgICAgICAvLy0tIElmIHRoZSB0YXJnZXQgZWxlbWVudCBpcyBhYm92ZSB0aGUgcGFyZW50IGVsbVxuICAgICAgICAgICAgICAgICAgICB0ICsgaCAtIFZJU0lCTEVfUEFERElORyA8IHAuc2Nyb2xsVG9wXG4gICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vLS0gT3VyIHRhcmdldCBlbGVtZW50IGlzIG91dCBvZiBib3VuZHM6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gQU5URU5OQSBtb2RpZmljYXRpb246IHVzZSB0aGUgYm91bmRpbmcgY2xpZW50IHJlY3QsIHdoaWNoIGFjY291bnRzIGZvciB0aGluZ3MgbGlrZSBDU1MgdHJhbnNmb3Jtc1xuICAgICAgICAgICAgICAgIHZhciBlbHIgPSBlbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgICAgICAgICB2YXIgcHIgPSBwLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICAgICAgICAgIGlmIChlbHIubGVmdCA+PSBwci5yaWdodCB8fFxuICAgICAgICAgICAgICAgICAgICBlbHIucmlnaHQgPD0gcHIubGVmdCB8fFxuICAgICAgICAgICAgICAgICAgICBlbHIudG9wID49IHByLmJvdHRvbSB8fFxuICAgICAgICAgICAgICAgICAgICBlbHIuYm90dG9tIDw9IHByLnRvcCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8tLSBBZGQgdGhlIG9mZnNldCBwYXJlbnQncyBsZWZ0L3RvcCBjb29yZHMgdG8gb3VyIGVsZW1lbnQncyBvZmZzZXQ6XG4gICAgICAgICAgICBpZiAoIGVsLm9mZnNldFBhcmVudCA9PT0gcCApIHtcbiAgICAgICAgICAgICAgICBsICs9IHAub2Zmc2V0TGVmdDtcbiAgICAgICAgICAgICAgICB0ICs9IHAub2Zmc2V0VG9wO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8tLSBMZXQncyByZWN1cnNpdmVseSBjaGVjayB1cHdhcmRzOlxuICAgICAgICAgICAgcmV0dXJuIF9pc1Zpc2libGUocCwgdCwgciwgYiwgbCwgdywgaCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgLy8tLSBDcm9zcyBicm93c2VyIG1ldGhvZCB0byBnZXQgc3R5bGUgcHJvcGVydGllczpcbiAgICBmdW5jdGlvbiBfZ2V0U3R5bGUoZWwsIHByb3BlcnR5KSB7XG4gICAgICAgIGlmICggd2luZG93LmdldENvbXB1dGVkU3R5bGUgKSB7XG4gICAgICAgICAgICByZXR1cm4gZG9jdW1lbnQuZGVmYXVsdFZpZXcuZ2V0Q29tcHV0ZWRTdHlsZShlbCxudWxsKVtwcm9wZXJ0eV07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCBlbC5jdXJyZW50U3R5bGUgKSB7XG4gICAgICAgICAgICByZXR1cm4gZWwuY3VycmVudFN0eWxlW3Byb3BlcnR5XTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIF9lbGVtZW50SW5Eb2N1bWVudChlbGVtZW50KSB7XG4gICAgICAgIHdoaWxlIChlbGVtZW50ID0gZWxlbWVudC5wYXJlbnROb2RlKSB7XG4gICAgICAgICAgICBpZiAoZWxlbWVudCA9PSBkb2N1bWVudCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX292ZXJmbG93SGlkZGVuKGVsKSB7XG4gICAgICAgIHJldHVybiAnaGlkZGVuJyA9PT0gX2dldFN0eWxlKGVsLCAnb3ZlcmZsb3cnKSB8fCAnaGlkZGVuJyA9PT0gX2dldFN0eWxlKGVsLCAnb3ZlcmZsb3cteCcpIHx8ICdoaWRkZW4nID09PSBfZ2V0U3R5bGUoZWwsICdvdmVyZmxvdy15JykgfHxcbiAgICAgICAgICAgICAgICAnc2Nyb2xsJyA9PT0gX2dldFN0eWxlKGVsLCAnb3ZlcmZsb3cnKSB8fCAnc2Nyb2xsJyA9PT0gX2dldFN0eWxlKGVsLCAnb3ZlcmZsb3cteCcpIHx8ICdzY3JvbGwnID09PSBfZ2V0U3R5bGUoZWwsICdvdmVyZmxvdy15JylcbiAgICB9XG5cbiAgICByZXR1cm4gX2lzVmlzaWJsZShlbGVtZW50KTtcblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBpc1Zpc2libGU6IGlzVmlzaWJsZVxufTsiLCJ2YXIgaWQgPSAnYW50ZW5uYS13aWRnZXQtYnVja2V0JztcblxuZnVuY3Rpb24gZ2V0V2lkZ2V0QnVja2V0KCkge1xuICAgIHZhciBidWNrZXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7XG4gICAgaWYgKCFidWNrZXQpIHtcbiAgICAgICAgYnVja2V0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIGJ1Y2tldC5zZXRBdHRyaWJ1dGUoJ2lkJywgaWQpO1xuICAgICAgICBidWNrZXQuY2xhc3NMaXN0LmFkZCgnYW50ZW5uYS1yZXNldCcsJ25vLWFudCcpO1xuICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGJ1Y2tldCk7XG4gICAgfVxuICAgIHJldHVybiBidWNrZXQ7XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBnZXQ6IGdldFdpZGdldEJ1Y2tldCxcbiAgICBzZWxlY3RvcjogZnVuY3Rpb24oKSB7IHJldHVybiAnIycgKyBpZDsgfVxufTsiLCJ2YXIgWGRtTG9hZGVyID0gcmVxdWlyZSgnLi94ZG0tbG9hZGVyJyk7XG5cbi8vIFJlZ2lzdGVyIG91cnNlbHZlcyB0byBoZWFyIG1lc3NhZ2VzXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcIm1lc3NhZ2VcIiwgcmVjZWl2ZU1lc3NhZ2UsIGZhbHNlKTtcblxudmFyIHJlc3BvbnNlSGFuZGxlcnMgPSB7ICd4ZG1fbG9hZGVkJzogeGRtTG9hZGVkIH07XG52YXIgcXVldWVkTWVzc2FnZXMgPSBbXTtcblxudmFyIGlzWERNTG9hZGVkID0gZmFsc2U7XG4vLyBUaGUgaW5pdGlhbCBtZXNzYWdlIHRoYXQgWERNIHNlbmRzIG91dCB3aGVuIGl0IGxvYWRzXG5mdW5jdGlvbiB4ZG1Mb2FkZWQoZGF0YSkge1xuICAgIGlzWERNTG9hZGVkID0gdHJ1ZTtcbiAgICAvLyBGaXJlIGFueSBtZXNzYWdlcyB0aGF0IGhhdmUgYmVlbiB3YWl0aW5nIGZvciBYRE0gdG8gYmUgcmVhZHlcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHF1ZXVlZE1lc3NhZ2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBtZXNzYWdlRGF0YSA9IHF1ZXVlZE1lc3NhZ2VzW2ldO1xuICAgICAgICBzZW5kTWVzc2FnZShtZXNzYWdlRGF0YS5tZXNzYWdlS2V5LCBtZXNzYWdlRGF0YS5tZXNzYWdlUGFyYW1zLCBtZXNzYWdlRGF0YS5jYWxsYmFjayk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBzZW5kTWVzc2FnZShtZXNzYWdlS2V5LCBtZXNzYWdlUGFyYW1zLCBjYWxsYmFjaykge1xuICAgIGlmIChpc1hETUxvYWRlZCkge1xuICAgICAgICB2YXIgY2FsbGJhY2tLZXkgPSAnYW50ZW5uYScgKyBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDE2KS5zbGljZSgyKTtcbiAgICAgICAgaWYgKGNhbGxiYWNrKSB7IHJlc3BvbnNlSGFuZGxlcnNbY2FsbGJhY2tLZXldID0gY2FsbGJhY2s7IH1cbiAgICAgICAgcG9zdE1lc3NhZ2Uoe1xuICAgICAgICAgICAgbWVzc2FnZUtleTogbWVzc2FnZUtleSxcbiAgICAgICAgICAgIG1lc3NhZ2VQYXJhbXM6IG1lc3NhZ2VQYXJhbXMsXG4gICAgICAgICAgICBjYWxsYmFja0tleTogY2FsbGJhY2tLZXlcbiAgICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcXVldWVkTWVzc2FnZXMucHVzaCh7IG1lc3NhZ2VLZXk6IG1lc3NhZ2VLZXksIG1lc3NhZ2VQYXJhbXM6IG1lc3NhZ2VQYXJhbXMsIGNhbGxiYWNrOiBjYWxsYmFjayB9KTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHJlY2VpdmVNZXNzYWdlKGV2ZW50KSB7XG4gICAgdmFyIGV2ZW50T3JpZ2luID0gZXZlbnQub3JpZ2luO1xuICAgIGlmIChldmVudE9yaWdpbiA9PT0gWGRtTG9hZGVyLk9SSUdJTikge1xuICAgICAgICB2YXIgZGF0YSA9IGV2ZW50LmRhdGE7XG4gICAgICAgIC8vIFRPRE86IFRoZSBldmVudC5zb3VyY2UgcHJvcGVydHkgZ2l2ZXMgdXMgdGhlIHNvdXJjZSB3aW5kb3cgb2YgdGhlIG1lc3NhZ2UgYW5kIGN1cnJlbnRseSB0aGUgWERNIGZyYW1lIGZpcmVzIG91dFxuICAgICAgICAvLyBldmVudHMgdGhhdCB3ZSByZWNlaXZlIGJlZm9yZSB3ZSBldmVyIHRyeSB0byBwb3N0IGFueXRoaW5nLiBTbyB3ZSAqY291bGQqIGhvbGQgb250byB0aGUgd2luZG93IGhlcmUgYW5kIHVzZSBpdFxuICAgICAgICAvLyBmb3IgcG9zdGluZyBtZXNzYWdlcyByYXRoZXIgdGhhbiBsb29raW5nIGZvciB0aGUgWERNIGZyYW1lIG91cnNlbHZlcy4gTmVlZCB0byBsb29rIGF0IHdoaWNoIGV2ZW50cyB0aGUgWERNIGZyYW1lXG4gICAgICAgIC8vIGZpcmVzIG91dCB0byBhbGwgd2luZG93cyBiZWZvcmUgYmVpbmcgYXNrZWQuIEN1cnJlbnRseSwgaXQncyBtb3JlIHRoYW4gXCJ4ZG0gbG9hZGVkXCIuIFdoeT9cbiAgICAgICAgLy92YXIgc291cmNlV2luZG93ID0gZXZlbnQuc291cmNlO1xuXG4gICAgICAgIHZhciBjYWxsYmFja0tleSA9IGRhdGEubWVzc2FnZUtleTtcbiAgICAgICAgdmFyIGNhbGxiYWNrID0gcmVzcG9uc2VIYW5kbGVyc1tjYWxsYmFja0tleV07XG4gICAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICAgICAgY2FsbGJhY2soZGF0YS5tZXNzYWdlUGFyYW1zKTtcbiAgICAgICAgICAgIGRlbGV0ZSByZXNwb25zZUhhbmRsZXJzW2NhbGxiYWNrS2V5XTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gcG9zdE1lc3NhZ2UobWVzc2FnZSkge1xuICAgIHZhciB4ZG1GcmFtZSA9IGdldFhETUZyYW1lKCk7XG4gICAgaWYgKHhkbUZyYW1lKSB7XG4gICAgICAgIHhkbUZyYW1lLnBvc3RNZXNzYWdlKG1lc3NhZ2UsIFhkbUxvYWRlci5PUklHSU4pO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZ2V0WERNRnJhbWUoKSB7XG4gICAgLy8gVE9ETzogSXMgdGhpcyBhIHNlY3VyaXR5IHByb2JsZW0/IFdoYXQgcHJldmVudHMgc29tZW9uZSBmcm9tIHVzaW5nIHRoaXMgc2FtZSBuYW1lIGFuZCBpbnRlcmNlcHRpbmcgb3VyIG1lc3NhZ2VzP1xuICAgIHJldHVybiB3aW5kb3cuZnJhbWVzWydhbnQteGRtLWhpZGRlbiddO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBzZW5kTWVzc2FnZTogc2VuZE1lc3NhZ2Vcbn07IiwidmFyIEFwcE1vZGUgPSByZXF1aXJlKCcuL2FwcC1tb2RlJyk7XG52YXIgVVJMQ29uc3RhbnRzID0gcmVxdWlyZSgnLi91cmwtY29uc3RhbnRzJyk7XG52YXIgV2lkZ2V0QnVja2V0ID0gcmVxdWlyZSgnLi93aWRnZXQtYnVja2V0Jyk7XG5cbnZhciBYRE1fT1JJR0lOID0gQXBwTW9kZS5vZmZsaW5lID8gVVJMQ29uc3RhbnRzLkRFVkVMT1BNRU5UIDogVVJMQ29uc3RhbnRzLlBST0RVQ1RJT047XG5cbmZ1bmN0aW9uIGNyZWF0ZVhETWZyYW1lKGdyb3VwSWQpIHtcbiAgICB2YXIgeGRtVXJsID0gWERNX09SSUdJTiArICcvc3RhdGljL3dpZGdldC1uZXcveGRtLW5ldy5odG1sJztcbiAgICB2YXIgcGFyZW50VXJsID0gZW5jb2RlVVJJQ29tcG9uZW50KHdpbmRvdy5sb2NhdGlvbi5ocmVmKTtcbiAgICB2YXIgcGFyZW50SG9zdCA9IGVuY29kZVVSSUNvbXBvbmVudCh3aW5kb3cubG9jYXRpb24ucHJvdG9jb2wgKyAnLy8nICsgd2luZG93LmxvY2F0aW9uLmhvc3QpO1xuICAgIHZhciB4ZG1GcmFtZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lmcmFtZScpO1xuICAgIHhkbUZyYW1lLnNldEF0dHJpYnV0ZSgnaWQnLCAnYW50LXhkbS1oaWRkZW4nKTtcbiAgICB4ZG1GcmFtZS5zZXRBdHRyaWJ1dGUoJ25hbWUnLCAnYW50LXhkbS1oaWRkZW4nKTtcbiAgICB4ZG1GcmFtZS5zZXRBdHRyaWJ1dGUoJ3NyYycsIHhkbVVybCArICc/cGFyZW50VXJsPScgKyBwYXJlbnRVcmwgKyAnJnBhcmVudEhvc3Q9JyArIHBhcmVudEhvc3QgKyAnJmdyb3VwX2lkPScgKyBncm91cElkKTtcbiAgICB4ZG1GcmFtZS5zZXRBdHRyaWJ1dGUoJ3dpZHRoJywgMSk7XG4gICAgeGRtRnJhbWUuc2V0QXR0cmlidXRlKCdoZWlnaHQnLCAxKTtcbiAgICB4ZG1GcmFtZS5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgJ3Bvc2l0aW9uOmFic29sdXRlO3RvcDotMTAwMHB4O2xlZnQ6LTEwMDBweDsnKTtcblxuICAgIFdpZGdldEJ1Y2tldC5nZXQoKS5hcHBlbmRDaGlsZCh4ZG1GcmFtZSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZVhETWZyYW1lOiBjcmVhdGVYRE1mcmFtZSxcbiAgICBPUklHSU46IFhETV9PUklHSU5cbn07IiwidmFyIFhETUNsaWVudCA9IHJlcXVpcmUoJy4vdXRpbHMveGRtLWNsaWVudCcpO1xudmFyIEV2ZW50cyA9IHJlcXVpcmUoJy4vZXZlbnRzJyk7XG52YXIgR3JvdXBTZXR0aW5ncyA9IHJlcXVpcmUoJy4vZ3JvdXAtc2V0dGluZ3MnKTtcbnZhciBQYWdlRGF0YSA9IHJlcXVpcmUoJy4vcGFnZS1kYXRhJyk7XG5cbmZ1bmN0aW9uIGNoZWNrQW5hbHl0aWNzQ29va2llcygpIHtcbiAgICAvLyBXaGVuIHRoZSB3aWRnZXQgbG9hZHMsIGNoZWNrIGZvciBhbnkgY29va2llcyB0aGF0IGhhdmUgYmVlbiB3cml0dGVuIGJ5IHRoZSBsZWdhY3kgY29udGVudCByZWMuXG4gICAgLy8gSWYgdGhvc2UgY29va2llcyBleGlzdCwgZmlyZSB0aGUgZXZlbnQgYW5kIGNsZWFyIHRoZW0uXG4gICAgWERNQ2xpZW50LnNlbmRNZXNzYWdlKCdnZXRDb29raWVzJywgWyAncmVkaXJlY3RfdHlwZScsICdyZWZlcnJpbmdfaW50X2lkJywgJ3BhZ2VfaGFzaCcgXSwgZnVuY3Rpb24oY29va2llcykge1xuICAgICAgICBpZiAoY29va2llcy5yZWRpcmVjdF90eXBlID09PSAnL3IvJykge1xuICAgICAgICAgICAgdmFyIHJlYWN0aW9uSWQgPSBjb29raWVzLnJlZmVycmluZ19pbnRfaWQ7XG4gICAgICAgICAgICB2YXIgcGFnZUhhc2ggPSBjb29raWVzLnBhZ2VfaGFzaDtcbiAgICAgICAgICAgIGdldFBhZ2VEYXRhKHBhZ2VIYXNoLCBmdW5jdGlvbihwYWdlRGF0YSkge1xuICAgICAgICAgICAgICAgIEV2ZW50cy5wb3N0TGVnYWN5UmVjaXJjQ2xpY2tlZChwYWdlRGF0YSwgcmVhY3Rpb25JZCwgR3JvdXBTZXR0aW5ncy5nZXQoKSk7XG4gICAgICAgICAgICAgICAgWERNQ2xpZW50LnNlbmRNZXNzYWdlKCdyZW1vdmVDb29raWVzJywgWyAncmVkaXJlY3RfdHlwZScsICdyZWZlcnJpbmdfaW50X2lkJywgJ3BhZ2VfaGFzaCcgXSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBnZXRQYWdlRGF0YShwYWdlSGFzaCwgY2FsbGJhY2spIHtcbiAgICBpZiAocGFnZUhhc2gpIHtcbiAgICAgICAgLy8gVGhpcyBtb2R1bGUgbG9hZHMgdmVyeSBlYXJseSBpbiB0aGUgYXBwIGxpZmVjeWNsZSBhbmQgbWF5IHJlY2VpdmUgZXZlbnRzIGZyb20gdGhlIFhETSBmcmFtZSBiZWZvcmUgcGFnZVxuICAgICAgICAvLyBkYXRhIGhhcyBiZWVuIGxvYWRlZC4gSG9sZCBvbnRvIGFueSBzdWNoIGV2ZW50cyB1bnRpbCB0aGUgcGFnZSBkYXRhIGxvYWRzIG9yIHdlIHRpbWVvdXQuXG4gICAgICAgIHZhciBtYXhXYWl0VGltZSA9IERhdGUubm93KCkgKyAxMDAwMDsgLy8gR2l2ZSB1cCBhZnRlciAxMCBzZWNvbmRzXG4gICAgICAgIHZhciBpbnRlcnZhbCA9IHNldEludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBwYWdlRGF0YSA9IFBhZ2VEYXRhLmdldFBhZ2VEYXRhKHBhZ2VIYXNoKTtcbiAgICAgICAgICAgIGlmIChwYWdlRGF0YSkge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKHBhZ2VEYXRhKTtcbiAgICAgICAgICAgICAgICBjbGVhckludGVydmFsKGludGVydmFsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChEYXRlLm5vdygpID4gbWF4V2FpdFRpbWUpIHtcbiAgICAgICAgICAgICAgICBjbGVhckludGVydmFsKGludGVydmFsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgNTApO1xuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgc3RhcnQ6IGNoZWNrQW5hbHl0aWNzQ29va2llc1xufTsiLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYSBhbnRlbm5hLWF1dG8tY3RhXCJ9LFwib1wiOlwiY3NzcmVzZXRcIixcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1hdXRvLWN0YS1pbm5lclwiLFwiYW50LWN0YS1mb3JcIjpbe1widFwiOjIsXCJyXCI6XCJhbnRJdGVtSWRcIn1dfSxcImZcIjpbe1widFwiOjgsXCJyXCI6XCJsb2dvXCJ9LHtcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWF1dG8tY3RhLWxhYmVsXCIsXCJhbnQtcmVhY3Rpb25zLWxhYmVsLWZvclwiOlt7XCJ0XCI6MixcInJcIjpcImFudEl0ZW1JZFwifV19fSx7XCJ0XCI6NCxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiYW50LWV4cGFuZGVkLXJlYWN0aW9ucy1mb3JcIjpbe1widFwiOjIsXCJyXCI6XCJhbnRJdGVtSWRcIn1dfX1dLFwiblwiOjUwLFwiclwiOlwiZXhwYW5kUmVhY3Rpb25zXCJ9XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcGFnZSBhbnRlbm5hLWJsb2NrZWQtcGFnZVwifSxcIm9cIjpcImNzc3Jlc2V0XCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtYm9keVwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcInZcIjp7XCJ0YXBcIjpcImJhY2tcIn0sXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtYmxvY2tlZC1iYWNrXCJ9LFwiZlwiOlt7XCJ0XCI6OCxcInJcIjpcImxlZnRcIn0se1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwicmVhY3Rpb25zX3dpZGdldF9fYmFja1xcXCIpXCJ9fV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtYmxvY2tlZC1ib2R5XCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWJsb2NrZWQtbWVzc2FnZVwifSxcImZcIjpbe1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwiYmxvY2tlZF9wYWdlX19tZXNzYWdlMVxcXCIpXCJ9fV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtYmxvY2tlZC1tZXNzYWdlXCJ9LFwiZlwiOlt7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJibG9ja2VkX3BhZ2VfX21lc3NhZ2UyXFxcIilcIn19XX1dfV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NCxcImZcIjpbe1widFwiOjIsXCJyXCI6XCJjb250YWluZXJEYXRhLnJlYWN0aW9uVG90YWxcIn1dLFwiblwiOjUwLFwieFwiOntcInJcIjpbXCJjb250YWluZXJEYXRhLnJlYWN0aW9uVG90YWxcIixcImNvbnRhaW5lckRhdGEubG9hZGVkXCJdLFwic1wiOlwiXzAmJl8xXCJ9fV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo0LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOltcImFudGVubmEtY3RhLWV4cGFuZGVkLXJlYWN0aW9uIFwiLHtcInRcIjo0LFwiZlwiOltcImFudGVubmEtY3RhLWV4cGFuZGVkLWZpcnN0XCJdLFwiblwiOjUwLFwieFwiOntcInJcIjpbXCJAaW5kZXhcIl0sXCJzXCI6XCJfMD09PTBcIn19XX0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWN0YS1leHBhbmRlZC10ZXh0XCJ9LFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcIi4vdGV4dFwifV19LHtcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWN0YS1leHBhbmRlZC1jb3VudFwifSxcImZcIjpbe1widFwiOjIsXCJyXCI6XCIuL2NvdW50XCJ9XX1dfV0sXCJ4XCI6e1wiclwiOltcImNvbXB1dGVFeHBhbmRlZFJlYWN0aW9uc1wiLFwiY29udGFpbmVyRGF0YS5yZWFjdGlvbnNcIl0sXCJzXCI6XCJfMChfMSlcIn19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjQsXCJmXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcImNhbGxfdG9fYWN0aW9uX2xhYmVsX19yZXNwb25zZXNcXFwiKVwifX1dLFwiblwiOjUwLFwieFwiOntcInJcIjpbXCJjb250YWluZXJEYXRhLmxvYWRlZFwiLFwiY29udGFpbmVyRGF0YS5yZWFjdGlvblRvdGFsXCJdLFwic1wiOlwiIV8wfHxfMT09PXVuZGVmaW5lZHx8XzE9PT0wXCJ9fSx7XCJ0XCI6NCxcIm5cIjo1MSxcImZcIjpbe1widFwiOjQsXCJuXCI6NTAsXCJ4XCI6e1wiclwiOltcImNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbFwiXSxcInNcIjpcIl8wPT09MVwifSxcImZcIjpbe1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwiY2FsbF90b19hY3Rpb25fbGFiZWxfX3Jlc3BvbnNlc19vbmVcXFwiKVwifX1dfSx7XCJ0XCI6NCxcIm5cIjo1MCxcInhcIjp7XCJyXCI6W1wiY29udGFpbmVyRGF0YS5yZWFjdGlvblRvdGFsXCJdLFwic1wiOlwiIShfMD09PTEpXCJ9LFwiZlwiOltcIiBcIix7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiLFwiY29udGFpbmVyRGF0YS5yZWFjdGlvblRvdGFsXCJdLFwic1wiOlwiXzAoXFxcImNhbGxfdG9fYWN0aW9uX2xhYmVsX19yZXNwb25zZXNfbWFueVxcXCIsW18xXSlcIn19XX1dLFwieFwiOntcInJcIjpbXCJjb250YWluZXJEYXRhLmxvYWRlZFwiLFwiY29udGFpbmVyRGF0YS5yZWFjdGlvblRvdGFsXCJdLFwic1wiOlwiIV8wfHxfMT09PXVuZGVmaW5lZHx8XzE9PT0wXCJ9fV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY29tbWVudC1hcmVhXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWNvbW1lbnQtd2lkZ2V0c1wifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJ0ZXh0YXJlYVwiLFwidlwiOntcImlucHV0XCI6XCJpbnB1dGNoYW5nZWRcIn0sXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY29tbWVudC1pbnB1dFwiLFwicGxhY2Vob2xkZXJcIjpbe1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwiY29tbWVudF9hcmVhX19wbGFjZWhvbGRlclxcXCIpXCJ9fV0sXCJtYXhsZW5ndGhcIjpcIjUwMFwifX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb21tZW50LWZvb3RlclwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY29tbWVudC1saW1pdFwifSxcImZcIjpbe1widFwiOjMsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwiY29tbWVudF9hcmVhX19jb3VudFxcXCIpXCJ9fV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiYnV0dG9uXCIsXCJhXCI6e1wiaWRcIjpcImFudGVubmEtY29tbWVudC1zcGFjZXJcIn19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiYnV0dG9uXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY29tbWVudC1zdWJtaXRcIn0sXCJ2XCI6e1widGFwXCI6XCJhZGRjb21tZW50XCJ9LFwiZlwiOlt7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJjb21tZW50X2FyZWFfX2FkZFxcXCIpXCJ9fV19XX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWNvbW1lbnQtd2FpdGluZ1wifSxcImZcIjpbXCIuLi5cIl19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY29tbWVudC1yZWNlaXZlZFwifSxcImZcIjpbe1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwiY29tbWVudF9hcmVhX190aGFua3NcXFwiKVwifX1dfV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1wYWdlIGFudGVubmEtY29tbWVudHMtcGFnZVwifSxcIm9cIjpcImNzc3Jlc2V0XCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtYm9keVwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcInZcIjp7XCJ0YXBcIjpcImJhY2tcIn0sXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY29tbWVudHMtYmFja1wifSxcImZcIjpbe1widFwiOjgsXCJyXCI6XCJsZWZ0XCJ9LHtcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcInJlYWN0aW9uc193aWRnZXRfX2JhY2tcXFwiKVwifX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWNvbW1lbnRzLWhlYWRlclwifSxcImZcIjpbe1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIixcImNvbW1lbnRzLmxlbmd0aFwiXSxcInNcIjpcIl8wKFxcXCJjb21tZW50c19wYWdlX19oZWFkZXJcXFwiLFtfMV0pXCJ9fV19LFwiIFwiLHtcInRcIjo0LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6W1wiYW50ZW5uYS1jb21tZW50LWVudHJ5IFwiLHtcInRcIjo0LFwiZlwiOltcImFudGVubmEtY29tbWVudC1uZXdcIl0sXCJuXCI6NTAsXCJyXCI6XCIuL25ld1wifV19LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInRhYmxlXCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwidHJcIixcImZcIjpbe1widFwiOjcsXCJlXCI6XCJ0ZFwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWNvbW1lbnQtY2VsbFwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJpbWdcIixcImFcIjp7XCJzcmNcIjpbe1widFwiOjIsXCJyXCI6XCIuL3VzZXIuaW1hZ2VVUkxcIn1dfX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcInRkXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY29tbWVudC1hdXRob3JcIn0sXCJmXCI6W3tcInRcIjoyLFwiclwiOlwiLi91c2VyLm5hbWVcIn1dfV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwidHJcIixcImZcIjpbe1widFwiOjcsXCJlXCI6XCJ0ZFwiLFwiZlwiOltdfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcInRkXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY29tbWVudC10ZXh0XCJ9LFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcIi4vdGV4dFwifV19XX1dfV19XSxcImlcIjpcImluZGV4XCIsXCJyXCI6XCJjb21tZW50c1wifSxcIiBcIix7XCJ0XCI6OCxcInJcIjpcImNvbW1lbnRBcmVhXCJ9XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcGFnZSBhbnRlbm5hLWNvbmZpcm1hdGlvbi1wYWdlXCJ9LFwib1wiOlwiY3NzcmVzZXRcIixcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1ib2R5XCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWNvbmZpcm0tcmVhY3Rpb25cIn0sXCJmXCI6W3tcInRcIjoyLFwiclwiOlwidGV4dFwifV19LFwiIFwiLHtcInRcIjo4LFwiclwiOlwiY29tbWVudEFyZWFcIn1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWZvb3RlciBhbnRlbm5hLWNvbmZpcm0tZm9vdGVyXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1zaGFyZVwifSxcImZcIjpbe1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwiY29uZmlybWF0aW9uX3BhZ2VfX3NoYXJlXFxcIilcIn19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiYVwiLFwidlwiOntcInRhcFwiOlwic2hhcmUtZmFjZWJvb2tcIn0sXCJhXCI6e1wiaHJlZlwiOlwiLy9mYWNlYm9vay5jb21cIn0sXCJmXCI6W3tcInRcIjo4LFwiclwiOlwiZmFjZWJvb2tJY29uXCJ9XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJhXCIsXCJ2XCI6e1widGFwXCI6XCJzaGFyZS10d2l0dGVyXCJ9LFwiYVwiOntcImhyZWZcIjpcIi8vdHdpdHRlci5jb21cIn0sXCJmXCI6W3tcInRcIjo4LFwiclwiOlwidHdpdHRlckljb25cIn1dfV19XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo0LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hIGFudGVubmEtY29udGVudHJlYy1pbm5lclwifSxcIm9cIjpcImNzc3Jlc2V0XCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY29udGVudHJlYy1oZWFkZXJcIn0sXCJmXCI6W3tcInRcIjoyLFwiclwiOlwidGl0bGVcIn1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWNvbnRlbnRyZWMtZW50cmllc1wifSxcImZcIjpbe1widFwiOjQsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpbXCJhbnRlbm5hLWNvbnRlbnRyZWMtZW50cnkgYW50ZW5uYS1yZXNldCBcIix7XCJ0XCI6NCxcImZcIjpbXCJhbnRlbm5hLWRlc2t0b3BcIl0sXCJuXCI6NTEsXCJyXCI6XCJpc01vYmlsZVwifV0sXCJzdHlsZVwiOltcIndpZHRoOlwiLHtcInRcIjoyLFwiclwiOlwiZW50cnlXaWR0aFwifSxcIjtcIl19LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImFcIixcImFcIjp7XCJocmVmXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJjb21wdXRlRW50cnlVcmxcIixcIi5cIl0sXCJzXCI6XCJfMChfMSlcIn19XSxcInRhcmdldFwiOlt7XCJ0XCI6NCxcImZcIjpbXCJfc2VsZlwiXSxcIm5cIjo1MCxcInJcIjpcImlzTW9iaWxlXCJ9LHtcInRcIjo0LFwiblwiOjUxLFwiZlwiOltcIl90YXJnZXRcIl0sXCJyXCI6XCJpc01vYmlsZVwifV19LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWNvbnRlbnRyZWMtZW50cnktaW5uZXJcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY29udGVudHJlYy1lbnRyeS1oZWFkZXJcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY29udGVudHJlYy1yZWFjdGlvbi10ZXh0XCJ9LFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcIi4vdG9wX3JlYWN0aW9uLnRleHRcIn1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWNvbnRlbnRyZWMtaW5kaWNhdG9yLXdyYXBwZXJcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY29udGVudHJlYy1yZWFjdGlvbi1pbmRpY2F0b3JcIn0sXCJmXCI6W3tcInRcIjo4LFwiclwiOlwibG9nb1wifSx7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb250ZW50cmVjLXJlYWN0aW9uLWNvdW50XCJ9LFwiZlwiOltcIiBcIix7XCJ0XCI6MixcInJcIjpcIi4vcmVhY3Rpb25fY291bnRcIn1dfV19XX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWNvbnRlbnRyZWMtYm9keVwiLFwic3R5bGVcIjpbXCJiYWNrZ3JvdW5kOlwiLHtcInRcIjoyLFwicnhcIjp7XCJyXCI6XCJjb2xvcnNcIixcIm1cIjpbe1widFwiOjMwLFwiblwiOlwiaW5kZXhcIn0sXCJiYWNrZ3JvdW5kXCJdfX0sXCI7Y29sb3I6XCIse1widFwiOjIsXCJyeFwiOntcInJcIjpcImNvbG9yc1wiLFwibVwiOlt7XCJ0XCI6MzAsXCJuXCI6XCJpbmRleFwifSxcImZvcmVncm91bmRcIl19fSxcIjtcIl19LFwiZlwiOlt7XCJ0XCI6NCxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb250ZW50cmVjLWJvZHktaW1hZ2VcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiaW1nXCIsXCJhXCI6e1wic3JjXCI6W3tcInRcIjoyLFwiclwiOlwiLi9jb250ZW50LmJvZHlcIn1dfX1dfV0sXCJuXCI6NTAsXCJ4XCI6e1wiclwiOltcIi4vY29udGVudC50eXBlXCJdLFwic1wiOlwiXzA9PT1cXFwiaW1hZ2VcXFwiXCJ9fSx7XCJ0XCI6NCxcIm5cIjo1MSxcImZcIjpbe1widFwiOjQsXCJuXCI6NTAsXCJ4XCI6e1wiclwiOltcIi4vY29udGVudC50eXBlXCJdLFwic1wiOlwiXzA9PT1cXFwidGV4dFxcXCJcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY29udGVudHJlYy1ib2R5LXRleHRcIn0sXCJvXCI6XCJyZW5kZXJUZXh0XCIsXCJmXCI6W3tcInRcIjoyLFwiclwiOlwiLi9jb250ZW50LmJvZHlcIn1dfV19XSxcInhcIjp7XCJyXCI6W1wiLi9jb250ZW50LnR5cGVcIl0sXCJzXCI6XCJfMD09PVxcXCJpbWFnZVxcXCJcIn19XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb250ZW50cmVjLXBhZ2UtdGl0bGVcIn0sXCJmXCI6W3tcInRcIjoyLFwiclwiOlwiLi9wYWdlLnRpdGxlXCJ9XX1dfV19XX1dLFwiaVwiOlwiaW5kZXhcIixcInJcIjpcImNvbnRlbnREYXRhLmVudHJpZXNcIn1dfV19XSxcIm5cIjo1MCxcInhcIjp7XCJyXCI6W1wicG9wdWxhdGVDb250ZW50RW50cmllc1wiLFwicGFnZURhdGEuc3VtbWFyeUxvYWRlZFwiLFwiY29udGVudERhdGEuZW50cmllc1wiXSxcInNcIjpcIl8wKF8xKSYmXzJcIn19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcInZcIjp7XCJrZXlkb3duXCI6XCJwYWdla2V5ZG93blwifSxcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1wYWdlIGFudGVubmEtZGVmYXVsdHMtcGFnZVwiLFwidGFiaW5kZXhcIjpcIjBcIn0sXCJvXCI6XCJjc3NyZXNldFwiLFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWJvZHlcIn0sXCJmXCI6W3tcInRcIjo0LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwidlwiOntcInRhcFwiOlwibmV3cmVhY3Rpb25cIn0sXCJhXCI6e1wiY2xhc3NcIjpbXCJhbnRlbm5hLXJlYWN0aW9uIFwiLHtcInRcIjoyLFwieFwiOntcInJcIjpbXCJkZWZhdWx0TGF5b3V0Q2xhc3NcIixcImluZGV4XCJdLFwic1wiOlwiXzAoXzEpXCJ9fV19LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXJlYWN0aW9uLWJveFwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1yZWFjdGlvbi10ZXh0XCJ9LFwib1wiOlwic2l6ZXRvZml0XCIsXCJmXCI6W3tcInRcIjoyLFwiclwiOlwiLi90ZXh0XCJ9XX1dfV19XSxcImlcIjpcImluZGV4XCIsXCJyXCI6XCJkZWZhdWx0UmVhY3Rpb25zXCJ9XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1mb290ZXIgYW50ZW5uYS1kZWZhdWx0cy1mb290ZXJcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY3VzdG9tLWFyZWFcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiaW5wdXRcIixcInZcIjp7XCJmb2N1c1wiOlwiY3VzdG9tZm9jdXNcIixcImtleWRvd25cIjpcImlucHV0a2V5ZG93blwiLFwiYmx1clwiOlwiY3VzdG9tYmx1clwifSxcImFcIjp7XCJ2YWx1ZVwiOlt7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJkZWZhdWx0c19wYWdlX19hZGRcXFwiKVwifX1dLFwibWF4bGVuZ3RoXCI6XCIyNVwifX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJidXR0b25cIixcInZcIjp7XCJ0YXBcIjpcIm5ld2N1c3RvbVwifSxcImZcIjpbe1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwiZGVmYXVsdHNfcGFnZV9fb2tcXFwiKVwifX1dfV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtdGV4dC1sb2dvXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImFcIixcImFcIjp7XCJocmVmXCI6XCIvL3d3dy5hbnRlbm5hLmlzXCJ9LFwiZlwiOltcIkFudGVubmFcIl19XX1dfV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1wYWdlIGFudGVubmEtZXJyb3ItcGFnZVwifSxcIm9cIjpcImNzc3Jlc2V0XCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtYm9keVwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcInZcIjp7XCJ0YXBcIjpcImJhY2tcIn0sXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtZXJyb3ItYmFja1wifSxcImZcIjpbe1widFwiOjgsXCJyXCI6XCJsZWZ0XCJ9LHtcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcInJlYWN0aW9uc193aWRnZXRfX2JhY2tcXFwiKVwifX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWVycm9yLWJvZHlcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtZXJyb3ItbWVzc2FnZVwifSxcImZcIjpbe1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwiZXJyb3JfcGFnZV9fbWVzc2FnZVxcXCIpXCJ9fV19XX1dfV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1wYWdlIGFudGVubmEtbG9jYXRpb25zLXBhZ2VcIn0sXCJvXCI6XCJjc3NyZXNldFwiLFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWJvZHlcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJ2XCI6e1widGFwXCI6XCJiYWNrXCJ9LFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxvY2F0aW9ucy1iYWNrXCJ9LFwiZlwiOlt7XCJ0XCI6OCxcInJcIjpcImxlZnRcIn0se1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwicmVhY3Rpb25zX3dpZGdldF9fYmFja1xcXCIpXCJ9fV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwidGFibGVcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1sb2NhdGlvbnMtdGFibGVcIn0sXCJmXCI6W3tcInRcIjo0LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInRyXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtbG9jYXRpb25zLWNvbnRlbnQtcm93XCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInRkXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtbG9jYXRpb25zLWNvdW50LWNlbGxcIn0sXCJmXCI6W3tcInRcIjo0LFwiZlwiOlt7XCJ0XCI6MyxcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJsb2NhdGlvbnNfcGFnZV9fY291bnRfb25lXFxcIilcIn19XSxcIm5cIjo1MCxcInhcIjp7XCJyXCI6W1wicGFnZVJlYWN0aW9uQ291bnRcIl0sXCJzXCI6XCJfMD09PTFcIn19LHtcInRcIjo0LFwiblwiOjUxLFwiZlwiOlt7XCJ0XCI6MyxcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiLFwicGFnZVJlYWN0aW9uQ291bnRcIl0sXCJzXCI6XCJfMChcXFwibG9jYXRpb25zX3BhZ2VfX2NvdW50X21hbnlcXFwiLFtfMV0pXCJ9fV0sXCJ4XCI6e1wiclwiOltcInBhZ2VSZWFjdGlvbkNvdW50XCJdLFwic1wiOlwiXzA9PT0xXCJ9fV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwidGRcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1sb2NhdGlvbnMtcGFnZS1ib2R5XCJ9LFwiZlwiOlt7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJsb2NhdGlvbnNfcGFnZV9fcGFnZWxldmVsXFxcIilcIn19XX1dfV0sXCJuXCI6NTAsXCJyXCI6XCJwYWdlUmVhY3Rpb25Db3VudFwifSxcIiBcIix7XCJ0XCI6NCxcImZcIjpbe1widFwiOjQsXCJmXCI6W1wiIFwiLHtcInRcIjo3LFwiZVwiOlwidHJcIixcInZcIjp7XCJ0YXBcIjpcInJldmVhbFwifSxcImFcIjp7XCJjbGFzc1wiOltcImFudGVubmEtbG9jYXRpb25zLWNvbnRlbnQtcm93IFwiLHtcInRcIjo0LFwiZlwiOltcImFudGVubmEtbG9jYXRlXCJdLFwiblwiOjUwLFwieFwiOntcInJcIjpbXCJjYW5Mb2NhdGVcIixcIi4vY29udGFpbmVySGFzaFwiXSxcInNcIjpcIl8wKF8xKVwifX1dfSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJ0ZFwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxvY2F0aW9ucy1jb3VudC1jZWxsXCJ9LFwiZlwiOlt7XCJ0XCI6NCxcImZcIjpbe1widFwiOjMsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwibG9jYXRpb25zX3BhZ2VfX2NvdW50X29uZVxcXCIpXCJ9fV0sXCJuXCI6NTAsXCJ4XCI6e1wiclwiOltcIi4vY291bnRcIl0sXCJzXCI6XCJfMD09PTFcIn19LHtcInRcIjo0LFwiblwiOjUxLFwiZlwiOlt7XCJ0XCI6MyxcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiLFwiLi9jb3VudFwiXSxcInNcIjpcIl8wKFxcXCJsb2NhdGlvbnNfcGFnZV9fY291bnRfbWFueVxcXCIsW18xXSlcIn19XSxcInhcIjp7XCJyXCI6W1wiLi9jb3VudFwiXSxcInNcIjpcIl8wPT09MVwifX1dfSxcIiBcIix7XCJ0XCI6NCxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJ0ZFwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxvY2F0aW9ucy10ZXh0LWJvZHlcIn0sXCJmXCI6W3tcInRcIjoyLFwiclwiOlwiLi9ib2R5XCJ9XX1dLFwiblwiOjUwLFwieFwiOntcInJcIjpbXCIuL2tpbmRcIl0sXCJzXCI6XCJfMD09PVxcXCJ0eHRcXFwiXCJ9fSx7XCJ0XCI6NCxcIm5cIjo1MSxcImZcIjpbe1widFwiOjQsXCJuXCI6NTAsXCJ4XCI6e1wiclwiOltcIi4va2luZFwiXSxcInNcIjpcIl8wPT09XFxcImltZ1xcXCJcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwidGRcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1sb2NhdGlvbnMtaW1hZ2UtYm9keVwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJpbWdcIixcImFcIjp7XCJzcmNcIjpbe1widFwiOjIsXCJyXCI6XCIuL2JvZHlcIn1dfX1dfV19LHtcInRcIjo0LFwiblwiOjUwLFwieFwiOntcInJcIjpbXCIuL2tpbmRcIl0sXCJzXCI6XCIoIShfMD09PVxcXCJpbWdcXFwiKSkmJihfMD09PVxcXCJtZWRcXFwiKVwifSxcImZcIjpbXCIgXCIse1widFwiOjcsXCJlXCI6XCJ0ZFwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxvY2F0aW9ucy1tZWRpYS1ib2R5XCJ9LFwiZlwiOlt7XCJ0XCI6OCxcInJcIjpcImZpbG1cIn0se1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtbG9jYXRpb25zLXZpZGVvXCJ9LFwiZlwiOlt7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJsb2NhdGlvbnNfcGFnZV9fdmlkZW9cXFwiKVwifX1dfV19XX0se1widFwiOjQsXCJuXCI6NTAsXCJ4XCI6e1wiclwiOltcIi4va2luZFwiXSxcInNcIjpcIighKF8wPT09XFxcImltZ1xcXCIpKSYmKCEoXzA9PT1cXFwibWVkXFxcIikpXCJ9LFwiZlwiOltcIiBcIix7XCJ0XCI6NyxcImVcIjpcInRkXCIsXCJmXCI6W1wiwqBcIl19XX1dLFwieFwiOntcInJcIjpbXCIuL2tpbmRcIl0sXCJzXCI6XCJfMD09PVxcXCJ0eHRcXFwiXCJ9fV19XSxcIm5cIjo1MCxcInhcIjp7XCJyXCI6W1wiLi9raW5kXCJdLFwic1wiOlwiXzAhPT1cXFwicGFnXFxcIlwifX1dLFwiaVwiOlwiaWRcIixcInJcIjpcImxvY2F0aW9uRGF0YVwifV19XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcGFnZSBhbnRlbm5hLWxvZ2luLXBhZ2VcIn0sXCJvXCI6XCJjc3NyZXNldFwiLFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWJvZHlcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJ2XCI6e1widGFwXCI6XCJiYWNrXCJ9LFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxvZ2luLWJhY2tcIn0sXCJmXCI6W3tcInRcIjo4LFwiclwiOlwibGVmdFwifSx7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJyZWFjdGlvbnNfd2lkZ2V0X19iYWNrXFxcIilcIn19XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1sb2dpbi1jb250YWluZXJcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtbG9naW4tY29udGVudFwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1sb2dpbi1tZXNzYWdlXCJ9LFwiZlwiOlt7XCJ0XCI6MyxcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiLFwiZ3JvdXBOYW1lXCJdLFwic1wiOlwiXzAoXFxcImxvZ2luX3BhZ2VfX21lc3NhZ2VfMVxcXCIsW18xXSlcIn19XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1sb2dpbi1tZXNzYWdlXCJ9LFwiZlwiOlt7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJsb2dpbl9wYWdlX19tZXNzYWdlXzJcXFwiKVwifX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxvZ2luLWJ1dHRvbnNcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImZiLWxvZ2luLWJ1dHRvblwifSxcInZcIjp7XCJ0YXBcIjpcImZhY2Vib29rTG9naW5cIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiaW1nXCIsXCJhXCI6e1wic3JjXCI6XCIvc3RhdGljL3dpZGdldC9pbWFnZXMvZmItbG9naW5fdG9fcmVhZHJib2FyZC5wbmdcIn19XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1vclwifSxcImZcIjpbXCJvclwiXX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1sb2dpbi1idXR0b25cIn0sXCJ2XCI6e1widGFwXCI6XCJhbnRlbm5hTG9naW5cIn0sXCJmXCI6W3tcInRcIjo4LFwiclwiOlwibG9nb1wifSx7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1sb2dpbi10ZXh0XCJ9LFwiZlwiOltcIkxvZ2luIHRvIEFudGVubmFcIl19XX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXByaXZhY3ktdGV4dFwifSxcImZcIjpbe1widFwiOjMsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwibG9naW5fcGFnZV9fcHJpdmFjeVxcXCIpXCJ9fV19XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1sb2dpbi1wZW5kaW5nXCJ9LFwiZlwiOlt7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJsb2dpbl9wYWdlX19wZW5kaW5nX3ByZVxcXCIpXCJ9fSx7XCJ0XCI6NyxcImVcIjpcImFcIixcImFcIjp7XCJocmVmXCI6XCJqYXZhc2NyaXB0OnZvaWQoMCk7XCJ9LFwidlwiOntcInRhcFwiOlwicmV0cnlcIn0sXCJmXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcImxvZ2luX3BhZ2VfX3BlbmRpbmdfY2xpY2tcXFwiKVwifX1dfSx7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJsb2dpbl9wYWdlX19wZW5kaW5nX3Bvc3RcXFwiKVwifX1dfV19XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwib1wiOlwiY3NzcmVzZXRcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYSBhbnRlbm5hLW1lZGlhLWluZGljYXRvci13cmFwcGVyXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcIm1cIjpbe1widFwiOjIsXCJyXCI6XCJleHRyYUF0dHJpYnV0ZXNcIn1dLFwiYVwiOntcImNsYXNzXCI6W1wiYW50ZW5uYSBhbnRlbm5hLW1lZGlhLWluZGljYXRvci13aWRnZXQgXCIse1widFwiOjQsXCJmXCI6W1wiYW50ZW5uYS1ub3Rsb2FkZWRcIl0sXCJuXCI6NTEsXCJyXCI6XCJjb250YWluZXJEYXRhLmxvYWRlZFwifSxcIiBhbnRlbm5hLXJlc2V0IFwiLHtcInRcIjo0LFwiZlwiOltcImFudGVubmEtdG91Y2hcIl0sXCJuXCI6NTAsXCJyXCI6XCJzdXBwb3J0c1RvdWNoXCJ9XX0sXCJmXCI6W1wiIFwiLHtcInRcIjo4LFwiclwiOlwibG9nb1wifSxcIiBcIix7XCJ0XCI6NCxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcmVhY3Rpb24tdG90YWxcIn0sXCJvXCI6XCJjc3NyZXNldFwiLFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcImNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbFwifV19XSxcIm5cIjo1MCxcInJcIjpcImNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbFwifSx7XCJ0XCI6NCxcIm5cIjo1MSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcmVhY3Rpb24tcHJvbXB0XCJ9LFwiZlwiOlt7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJtZWRpYV9pbmRpY2F0b3JfX3RoaW5rXFxcIilcIn19XX1dLFwiclwiOlwiY29udGFpbmVyRGF0YS5yZWFjdGlvblRvdGFsXCJ9XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcGFnZSBhbnRlbm5hLXBlbmRpbmctcGFnZVwifSxcIm9cIjpcImNzc3Jlc2V0XCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtYm9keVwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1wZW5kaW5nLXJlYWN0aW9uXCJ9LFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcInRleHRcIn1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXBlbmRpbmctbWVzc2FnZVwifSxcImZcIjpbe1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwicGVuZGluZ19wYWdlX19tZXNzYWdlX2FwcGVhclxcXCIpXCJ9fV19XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcG9wdXBcIn0sXCJvXCI6XCJjc3NyZXNldFwiLFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXBvcHVwLWJvZHlcIn0sXCJmXCI6W3tcInRcIjo4LFwiclwiOlwibG9nb1wifSx7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1wb3B1cC10ZXh0XCJ9LFwiZlwiOlt7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJwb3B1cF93aWRnZXRfX3RoaW5rXFxcIilcIn19XX1dfV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1wYWdlIGFudGVubmEtcmVhY3Rpb25zLXBhZ2VcIn0sXCJvXCI6XCJjc3NyZXNldFwiLFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWJvZHlcIn0sXCJmXCI6W3tcInRcIjo0LFwiZlwiOlt7XCJ0XCI6NCxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcInZcIjp7XCJ0YXBcIjpcInBsdXNvbmVcIixcIm1vdXNlZW50ZXJcIjpcImhpZ2hsaWdodFwiLFwibW91c2VsZWF2ZVwiOlwiY2xlYXJoaWdobGlnaHRzXCJ9LFwiYVwiOntcImNsYXNzXCI6W1wiYW50ZW5uYS1yZWFjdGlvbiBcIix7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wicmVhY3Rpb25zTGF5b3V0Q2xhc3NcIixcImluZGV4XCJdLFwic1wiOlwiXzAoXzEpXCJ9fV19LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXJlYWN0aW9uLWJveFwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1yZWFjdGlvbi10ZXh0XCJ9LFwib1wiOlwic2l6ZXRvZml0XCIsXCJmXCI6W3tcInRcIjoyLFwiclwiOlwiLi90ZXh0XCJ9XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1yZWFjdGlvbi1jb3VudFwifSxcImZcIjpbe1widFwiOjIsXCJyXCI6XCIuL2NvdW50XCJ9XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1wbHVzb25lXCJ9LFwiZlwiOltcIisxXCJdfSxcIiBcIix7XCJ0XCI6NCxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcInZcIjp7XCJ0YXBcIjpcInNob3dsb2NhdGlvbnNcIn0sXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcmVhY3Rpb24tbG9jYXRpb25cIn0sXCJmXCI6W3tcInRcIjo4LFwiclwiOlwibG9jYXRpb25JY29uXCJ9XX1dLFwiblwiOjUwLFwiclwiOlwiaXNTdW1tYXJ5XCJ9LHtcInRcIjo0LFwiblwiOjUxLFwiZlwiOlt7XCJ0XCI6NCxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcInZcIjp7XCJ0YXBcIjpcInNob3djb21tZW50c1wifSxcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1yZWFjdGlvbi1jb21tZW50cyBoYXNjb21tZW50c1wifSxcImZcIjpbe1widFwiOjgsXCJyXCI6XCJjb21tZW50c0ljb25cIn0sXCIgXCIse1widFwiOjIsXCJyXCI6XCIuL2NvbW1lbnRDb3VudFwifV19XSxcIm5cIjo1MCxcInJcIjpcIi4vY29tbWVudENvdW50XCJ9LHtcInRcIjo0LFwiblwiOjUxLFwiZlwiOlt7XCJ0XCI6NCxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1yZWFjdGlvbi1jb21tZW50c1wifSxcImZcIjpbe1widFwiOjgsXCJyXCI6XCJjb21tZW50c0ljb25cIn1dfV0sXCJuXCI6NTAsXCJ4XCI6e1wiclwiOltcImhpZGVDb21tZW50SW5wdXRcIl0sXCJzXCI6XCIhXzBcIn19XSxcInJcIjpcIi4vY29tbWVudENvdW50XCJ9XSxcInJcIjpcImlzU3VtbWFyeVwifV19XX1dLFwiaVwiOlwiaW5kZXhcIixcInJcIjpcInJlYWN0aW9uc1wifV0sXCJuXCI6NTAsXCJyXCI6XCJyZWFjdGlvbnNcIn1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWZvb3RlciBhbnRlbm5hLXJlYWN0aW9ucy1mb290ZXJcIn0sXCJmXCI6W3tcInRcIjo0LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwidlwiOntcInRhcFwiOlwic2hvd2RlZmF1bHRcIn0sXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtdGhpbmtcIn0sXCJmXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcInJlYWN0aW9uc19wYWdlX190aGlua1xcXCIpXCJ9fV19XSxcIm5cIjo1MCxcInJcIjpcInJlYWN0aW9uc1wifSx7XCJ0XCI6NCxcIm5cIjo1MSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1uby1yZWFjdGlvbnNcIn0sXCJmXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcInJlYWN0aW9uc19wYWdlX19ub19yZWFjdGlvbnNcXFwiKVwifX1dfV0sXCJyXCI6XCJyZWFjdGlvbnNcIn0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS10ZXh0LWxvZ29cIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiYVwiLFwiYVwiOntcImhyZWZcIjpcIi8vd3d3LmFudGVubmEuaXNcIixcInRhcmdldFwiOlwiX2JsYW5rXCJ9LFwiZlwiOltcIkFudGVubmFcIl19XX1dfV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOltcImFudGVubmEgYW50ZW5uYS1yZWFjdGlvbnMtd2lkZ2V0IFwiLHtcInRcIjo0LFwiZlwiOltcImFudGVubmEtdG91Y2hcIl0sXCJuXCI6NTAsXCJyXCI6XCJzdXBwb3J0c1RvdWNoXCJ9XSxcInRhYmluZGV4XCI6XCIwXCJ9LFwib1wiOlwiY3NzcmVzZXRcIixcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1oZWFkZXJcIn0sXCJmXCI6W3tcInRcIjo4LFwiclwiOlwibG9nb1wifSx7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1yZWFjdGlvbnMtdGl0bGVcIn0sXCJmXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcInJlYWN0aW9uc193aWRnZXRfX3RpdGxlXFxcIilcIn19XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJ2XCI6e1widGFwXCI6XCJjbG9zZVwifSxcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1yZWFjdGlvbnMtY2xvc2VcIn0sXCJmXCI6W1wiWFwiXX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXBhZ2UtY29udGFpbmVyXCJ9LFwiZlwiOltcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXByb2dyZXNzLXBhZ2UgYW50ZW5uYS1wYWdlXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWJvZHlcIn0sXCJmXCI6W119LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcHJvZ3Jlc3Mtc3Bpbm5lclwifSxcImZcIjpbe1widFwiOjgsXCJyXCI6XCJsb2dvXCJ9XX1dfV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwib1wiOlwiY3NzcmVzZXRcIixcImFcIjp7XCJjbGFzc1wiOltcImFudGVubmEgYW50ZW5uYS1zdW1tYXJ5LXdpZGdldCBuby1hbnQgXCIse1widFwiOjQsXCJmXCI6W1wiYW50ZW5uYS1ub3Rsb2FkZWRcIl0sXCJuXCI6NTEsXCJyXCI6XCJwYWdlRGF0YS5zdW1tYXJ5TG9hZGVkXCJ9LFwiIGFudGVubmEtcmVzZXQgXCIse1widFwiOjQsXCJmXCI6W1wiYW50ZW5uYS1leHBhbmRlZC1zdW1tYXJ5XCJdLFwiblwiOjUwLFwiclwiOlwiaXNFeHBhbmRlZFN1bW1hcnlcIn1dfSxcImZcIjpbXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1zdW1tYXJ5LWlubmVyXCJ9LFwiZlwiOlt7XCJ0XCI6OCxcInJcIjpcImxvZ29cIn0se1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtc3VtbWFyeS10aXRsZVwifSxcImZcIjpbXCIgXCIse1widFwiOjQsXCJmXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcInN1bW1hcnlfd2lkZ2V0X19yZWFjdGlvbnNcXFwiKVwifX1dLFwiblwiOjUwLFwieFwiOntcInJcIjpbXCJwYWdlRGF0YS5zdW1tYXJ5VG90YWxcIl0sXCJzXCI6XCJfMD09PTBcIn19LHtcInRcIjo0LFwiblwiOjUxLFwiZlwiOlt7XCJ0XCI6NCxcIm5cIjo1MCxcInhcIjp7XCJyXCI6W1wicGFnZURhdGEuc3VtbWFyeVRvdGFsXCJdLFwic1wiOlwiXzA9PT0xXCJ9LFwiZlwiOlt7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJzdW1tYXJ5X3dpZGdldF9fcmVhY3Rpb25zX29uZVxcXCIpXCJ9fV19LHtcInRcIjo0LFwiblwiOjUwLFwieFwiOntcInJcIjpbXCJwYWdlRGF0YS5zdW1tYXJ5VG90YWxcIl0sXCJzXCI6XCIhKF8wPT09MSlcIn0sXCJmXCI6W1wiIFwiLHtcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCIsXCJwYWdlRGF0YS5zdW1tYXJ5VG90YWxcIl0sXCJzXCI6XCJfMChcXFwic3VtbWFyeV93aWRnZXRfX3JlYWN0aW9uc19tYW55XFxcIixbXzFdKVwifX1dfV0sXCJ4XCI6e1wiclwiOltcInBhZ2VEYXRhLnN1bW1hcnlUb3RhbFwiXSxcInNcIjpcIl8wPT09MFwifX1dfSx7XCJ0XCI6NCxcImZcIjpbe1widFwiOjQsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwib1wiOlwiY3NzcmVzZXRcIixcImFcIjp7XCJjbGFzc1wiOltcImFudGVubmEtZXhwYW5kZWQtcmVhY3Rpb24gXCIse1widFwiOjQsXCJmXCI6W1wiYW50ZW5uYS1leHBhbmRlZC1maXJzdFwiXSxcIm5cIjo1MCxcInhcIjp7XCJyXCI6W1wiQGluZGV4XCJdLFwic1wiOlwiXzA9PT0wXCJ9fV19LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1leHBhbmRlZC10ZXh0XCJ9LFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcIi4vdGV4dFwifV19LHtcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWV4cGFuZGVkLWNvdW50XCJ9LFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcIi4vY291bnRcIn1dfV19XSxcInhcIjp7XCJyXCI6W1wiY29tcHV0ZUV4cGFuZGVkUmVhY3Rpb25zXCIsXCJwYWdlRGF0YS5zdW1tYXJ5UmVhY3Rpb25zXCJdLFwic1wiOlwiXzAoXzEpXCJ9fV0sXCJuXCI6NTAsXCJyXCI6XCJpc0V4cGFuZGVkU3VtbWFyeVwifV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb21tZW50c1wifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJzdmdcIixcImZcIjpbe1widFwiOjcsXCJlXCI6XCJ1c2VcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb21tZW50cy1wYXRoXCIsXCJ4bGluazpocmVmXCI6XCIjYW50ZW5uYS1zdmctY29tbWVudFwifX1dfV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtZmFjZWJvb2tcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3ZnXCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwidXNlXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtZmFjZWJvb2stcGF0aFwiLFwieGxpbms6aHJlZlwiOlwiI2FudGVubmEtc3ZnLWZhY2Vib29rXCJ9fV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1maWxtXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInN2Z1wiLFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInVzZVwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWZpbG0tcGF0aFwiLFwieGxpbms6aHJlZlwiOlwiI2FudGVubmEtc3ZnLWZpbG1cIn19XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxlZnRcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3ZnXCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwidXNlXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtbGVmdC1wYXRoXCIsXCJ4bGluazpocmVmXCI6XCIjYW50ZW5uYS1zdmctbGVmdFwifX1dfV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtbG9jYXRpb25cIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3ZnXCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwidXNlXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtbG9jYXRpb24tcGF0aFwiLFwieGxpbms6aHJlZlwiOlwiI2FudGVubmEtc3ZnLXNlYXJjaFwifX1dfV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtbG9nb1wifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJzdmdcIixcImFcIjp7XCJ2aWV3Qm94XCI6XCIwIDAgNTEyIDUxMlwifSxcImZcIjpbXCIgXCIse1widFwiOjcsXCJlXCI6XCJwYXRoXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtbG9nby1wYXRoXCIsXCJkXCI6XCJtMjgzIDUxMGMxMjUtMTcgMjI5LTEyNCAyMjktMjUzIDAtMTQxLTExNS0yNTYtMjU2LTI1Ni0xNDEgMC0yNTYgMTE1LTI1NiAyNTYgMCAxMzAgMTA4IDIzNyAyMzMgMjU0bDAtMTQ5Yy00OC0xNC04NC01MC04NC0xMDIgMC02NSA0My0xMTMgMTA4LTExMyA2NSAwIDEwNyA0OCAxMDcgMTEzIDAgNTItMzMgODgtODEgMTAyelwifX1dfV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtbG9nb1wifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJzdmdcIixcImZcIjpbe1widFwiOjcsXCJlXCI6XCJ1c2VcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1sb2dvLXBhdGhcIixcInhsaW5rOmhyZWZcIjpcIiNhbnRlbm5hLXN2Zy1sb2dvXCJ9fV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS10d2l0dGVyXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInN2Z1wiLFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInVzZVwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXR3aXR0ZXItcGF0aFwiLFwieGxpbms6aHJlZlwiOlwiI2FudGVubmEtc3ZnLXR3aXR0ZXJcIn19XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwic3ZnXCIsXCJhXCI6e1wieG1sbnNcIjpcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIsXCJzdHlsZVwiOlwiZGlzcGxheTogbm9uZTtcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3ltYm9sXCIsXCJhXCI6e1wiaWRcIjpcImFudGVubmEtc3ZnLXR3aXR0ZXJcIixcInZpZXdCb3hcIjpcIjAgMCA1MTIgNTEyXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInBhdGhcIixcImFcIjp7XCJkXCI6XCJtNDUzIDEzNGMtMTQgNi0zMCAxMS00NiAxMmMxNi0xMCAyOS0yNSAzNS00NGMtMTUgOS0zMyAxNi01MSAxOWMtMTUtMTUtMzYtMjUtNTktMjVjLTQ1IDAtODEgMzYtODEgODFjMCA2IDEgMTIgMiAxOGMtNjctMy0xMjctMzUtMTY3LTg0Yy03IDEyLTExIDI1LTExIDQwYzAgMjggMTUgNTMgMzYgNjhjLTEzLTEtMjUtNC0zNi0xMWMwIDEgMCAxIDAgMmMwIDM5IDI4IDcxIDY1IDc5Yy03IDItMTQgMy0yMiAzYy01IDAtMTAtMS0xNS0yYzEwIDMyIDQwIDU2IDc2IDU2Yy0yOCAyMi02MyAzNS0xMDEgMzVjLTYgMC0xMyAwLTE5LTFjMzYgMjMgNzggMzYgMTI0IDM2YzE0OSAwIDIzMC0xMjMgMjMwLTIzMGMwLTMgMC03IDAtMTBjMTYtMTIgMjktMjYgNDAtNDJ6XCJ9fV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwic3ltYm9sXCIsXCJhXCI6e1wiaWRcIjpcImFudGVubmEtc3ZnLWZhY2Vib29rXCIsXCJ2aWV3Qm94XCI6XCIwIDAgNTEyIDUxMlwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJwYXRoXCIsXCJhXCI6e1wiZFwiOlwibTQyMCA3MmwtMzI4IDBjLTExIDAtMjAgOS0yMCAyMGwwIDMyOGMwIDExIDkgMjAgMjAgMjBsMTc3IDBsMC0xNDJsLTQ4IDBsMC01Nmw0OCAwbDAtNDFjMC00OCAyOS03NCA3MS03NGMyMCAwIDM4IDIgNDMgM2wwIDQ5bC0yOSAwYy0yMyAwLTI4IDExLTI4IDI3bDAgMzZsNTUgMGwtNyA1NmwtNDggMGwwIDE0Mmw5NCAwYzExIDAgMjAtOSAyMC0yMGwwLTMyOGMwLTExLTktMjAtMjAtMjB6XCJ9fV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwic3ltYm9sXCIsXCJhXCI6e1wiaWRcIjpcImFudGVubmEtc3ZnLWNvbW1lbnRcIixcInZpZXdCb3hcIjpcIjAgMCA1MTIgNTEyXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInBhdGhcIixcImFcIjp7XCJkXCI6XCJtNTEyIDI1NmMwIDMzLTExIDY0LTM0IDkyYy0yMyAyOC01NCA1MC05MyA2NmMtNDAgMTctODMgMjUtMTI5IDI1Yy0xMyAwLTI3LTEtNDEtMmMtMzggMzMtODIgNTYtMTMyIDY5Yy05IDItMjAgNC0zMiA2Yy00IDAtNyAwLTktM2MtMy0yLTQtNC01LThsMCAwYy0xLTEtMS0yIDAtNGMwLTEgMC0yIDAtMmMwLTEgMS0yIDItM2wxLTNjMCAwIDEtMSAyLTJjMi0yIDItMyAzLTNjMS0xIDQtNSA4LTEwYzUtNSA4LTggMTAtMTBjMi0zIDUtNiA5LTEyYzQtNSA3LTEwIDktMTRjMy01IDUtMTAgOC0xN2MzLTcgNS0xNCA4LTIyYy0zMC0xNy01NC0zOC03MS02M2MtMTctMjUtMjYtNTEtMjYtODBjMC0yNSA3LTQ4IDIwLTcxYzE0LTIzIDMyLTQyIDU1LTU4YzIzLTE3IDUwLTMwIDgyLTM5YzMxLTEwIDY0LTE1IDk5LTE1YzQ2IDAgODkgOCAxMjkgMjVjMzkgMTYgNzAgMzggOTMgNjZjMjMgMjggMzQgNTkgMzQgOTJ6XCJ9fV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwic3ltYm9sXCIsXCJhXCI6e1wiaWRcIjpcImFudGVubmEtc3ZnLXNlYXJjaFwiLFwidmlld0JveFwiOlwiMCAwIDUxMiA1MTJcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwicGF0aFwiLFwiYVwiOntcImRcIjpcIm0zNDcgMjM4YzAtMzYtMTItNjYtMzctOTFjLTI1LTI1LTU1LTM3LTkxLTM3Yy0zNSAwLTY1IDEyLTkwIDM3Yy0yNSAyNS0zOCA1NS0zOCA5MWMwIDM1IDEzIDY1IDM4IDkwYzI1IDI1IDU1IDM4IDkwIDM4YzM2IDAgNjYtMTMgOTEtMzhjMjUtMjUgMzctNTUgMzctOTB6IG0xNDcgMjM3YzAgMTAtNCAxOS0xMSAyNmMtNyA3LTE2IDExLTI2IDExYy0xMCAwLTE5LTQtMjYtMTFsLTk4LTk4Yy0zNCAyNC03MiAzNi0xMTQgMzZjLTI3IDAtNTMtNS03OC0xNmMtMjUtMTEtNDYtMjUtNjQtNDNjLTE4LTE4LTMyLTM5LTQzLTY0Yy0xMC0yNS0xNi01MS0xNi03OGMwLTI4IDYtNTQgMTYtNzhjMTEtMjUgMjUtNDcgNDMtNjVjMTgtMTggMzktMzIgNjQtNDNjMjUtMTAgNTEtMTUgNzgtMTVjMjggMCA1NCA1IDc5IDE1YzI0IDExIDQ2IDI1IDY0IDQzYzE4IDE4IDMyIDQwIDQzIDY1YzEwIDI0IDE2IDUwIDE2IDc4YzAgNDItMTIgODAtMzYgMTE0bDk4IDk4YzcgNyAxMSAxNSAxMSAyNXpcIn19XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJzeW1ib2xcIixcImFcIjp7XCJpZFwiOlwiYW50ZW5uYS1zdmctbGVmdFwiLFwidmlld0JveFwiOlwiMCAwIDUxMiA1MTJcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwicGF0aFwiLFwiYVwiOntcImRcIjpcIm0zNjggMTYwbC02NC02NC0xNjAgMTYwIDE2MCAxNjAgNjQtNjQtOTYtOTZ6XCJ9fV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwic3ltYm9sXCIsXCJhXCI6e1wiaWRcIjpcImFudGVubmEtc3ZnLWxvZ29cIixcInZpZXdCb3hcIjpcIjAgMCA1MTIgNTEyXCJ9LFwiZlwiOltcIiBcIix7XCJ0XCI6NyxcImVcIjpcInBhdGhcIixcImFcIjp7XCJkXCI6XCJtMjgzIDUxMGMxMjUtMTcgMjI5LTEyNCAyMjktMjUzIDAtMTQxLTExNS0yNTYtMjU2LTI1Ni0xNDEgMC0yNTYgMTE1LTI1NiAyNTYgMCAxMzAgMTA4IDIzNyAyMzMgMjU0bDAtMTQ5Yy00OC0xNC04NC01MC04NC0xMDIgMC02NSA0My0xMTMgMTA4LTExMyA2NSAwIDEwNyA0OCAxMDcgMTEzIDAgNTItMzMgODgtODEgMTAyelwifX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcInN5bWJvbFwiLFwiYVwiOntcImlkXCI6XCJhbnRlbm5hLXN2Zy1maWxtXCIsXCJ2aWV3Qm94XCI6XCIwIDAgNTEyIDUxMlwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJwYXRoXCIsXCJhXCI6e1wiZFwiOlwibTkxIDQ1N2wwLTM2YzAtNS0xLTEwLTUtMTMtNC00LTgtNi0xMy02bC0zNiAwYy01IDAtMTAgMi0xMyA2LTQgMy02IDgtNiAxM2wwIDM2YzAgNSAyIDkgNiAxMyAzIDQgOCA1IDEzIDVsMzYgMGM1IDAgOS0xIDEzLTUgNC00IDUtOCA1LTEzeiBtMC0xMTBsMC0zNmMwLTUtMS05LTUtMTMtNC00LTgtNS0xMy01bC0zNiAwYy01IDAtMTAgMS0xMyA1LTQgNC02IDgtNiAxM2wwIDM2YzAgNSAyIDEwIDYgMTMgMyA0IDggNiAxMyA2bDM2IDBjNSAwIDktMiAxMy02IDQtMyA1LTggNS0xM3ogbTAtMTA5bDAtMzdjMC01LTEtOS01LTEzLTQtMy04LTUtMTMtNWwtMzYgMGMtNSAwLTEwIDItMTMgNS00IDQtNiA4LTYgMTNsMCAzN2MwIDUgMiA5IDYgMTMgMyAzIDggNSAxMyA1bDM2IDBjNSAwIDktMiAxMy01IDQtNCA1LTggNS0xM3ogbTI5MyAyMTlsMC0xNDZjMC01LTItOS01LTEzLTQtNC04LTUtMTMtNWwtMjIwIDBjLTUgMC05IDEtMTMgNS0zIDQtNSA4LTUgMTNsMCAxNDZjMCA1IDIgOSA1IDEzIDQgNCA4IDUgMTMgNWwyMjAgMGM1IDAgOS0xIDEzLTUgMy00IDUtOCA1LTEzeiBtLTI5My0zMjlsMC0zN2MwLTUtMS05LTUtMTItNC00LTgtNi0xMy02bC0zNiAwYy01IDAtMTAgMi0xMyA2LTQgMy02IDctNiAxMmwwIDM3YzAgNSAyIDkgNiAxMyAzIDMgOCA1IDEzIDVsMzYgMGM1IDAgOS0yIDEzLTUgNC00IDUtOCA1LTEzeiBtNDAzIDMyOWwwLTM2YzAtNS0yLTEwLTYtMTMtMy00LTgtNi0xMy02bC0zNiAwYy01IDAtOSAyLTEzIDYtNCAzLTUgOC01IDEzbDAgMzZjMCA1IDEgOSA1IDEzIDQgNCA4IDUgMTMgNWwzNiAwYzUgMCAxMC0xIDEzLTUgNC00IDYtOCA2LTEzeiBtLTExMC0yMTlsMC0xNDdjMC01LTItOS01LTEyLTQtNC04LTYtMTMtNmwtMjIwIDBjLTUgMC05IDItMTMgNi0zIDMtNSA3LTUgMTJsMCAxNDdjMCA1IDIgOSA1IDEzIDQgMyA4IDUgMTMgNWwyMjAgMGM1IDAgOS0yIDEzLTUgMy00IDUtOCA1LTEzeiBtMTEwIDEwOWwwLTM2YzAtNS0yLTktNi0xMy0zLTQtOC01LTEzLTVsLTM2IDBjLTUgMC05IDEtMTMgNS00IDQtNSA4LTUgMTNsMCAzNmMwIDUgMSAxMCA1IDEzIDQgNCA4IDYgMTMgNmwzNiAwYzUgMCAxMC0yIDEzLTYgNC0zIDYtOCA2LTEzeiBtMC0xMDlsMC0zN2MwLTUtMi05LTYtMTMtMy0zLTgtNS0xMy01bC0zNiAwYy01IDAtOSAyLTEzIDUtNCA0LTUgOC01IDEzbDAgMzdjMCA1IDEgOSA1IDEzIDQgMyA4IDUgMTMgNWwzNiAwYzUgMCAxMC0yIDEzLTUgNC00IDYtOCA2LTEzeiBtMC0xMTBsMC0zN2MwLTUtMi05LTYtMTItMy00LTgtNi0xMy02bC0zNiAwYy01IDAtOSAyLTEzIDYtNCAzLTUgNy01IDEybDAgMzdjMCA1IDEgOSA1IDEzIDQgMyA4IDUgMTMgNWwzNiAwYzUgMCAxMC0yIDEzLTUgNC00IDYtOCA2LTEzeiBtMzYtNDZsMCAzODRjMCAxMy00IDI0LTEzIDMzLTkgOS0yMCAxMy0zMiAxM2wtNDU4IDBjLTEyIDAtMjMtNC0zMi0xMy05LTktMTMtMjAtMTMtMzNsMC0zODRjMC0xMiA0LTIzIDEzLTMyIDktOSAyMC0xMyAzMi0xM2w0NTggMGMxMiAwIDIzIDQgMzIgMTMgOSA5IDEzIDIwIDEzIDMyelwifX1dfV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcIm9cIjpcImNzc3Jlc2V0XCIsXCJ2XCI6e1widGFwXCI6XCJkaXNtaXNzXCJ9LFwiYVwiOntcImNsYXNzXCI6W1wiYW50ZW5uYSBhbnRlbm5hLXRhcC1oZWxwZXIgXCIse1widFwiOjQsXCJmXCI6W1wiYW50ZW5uYS1oZWxwZXItdG9wXCJdLFwiblwiOjUwLFwiclwiOlwicG9zaXRpb25Ub3BcIn0se1widFwiOjQsXCJuXCI6NTEsXCJmXCI6W1wiYW50ZW5uYS1oZWxwZXItYm90dG9tXCJdLFwiclwiOlwicG9zaXRpb25Ub3BcIn1dfSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS10YXAtaGVscGVyLWlubmVyXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiZlwiOlt7XCJ0XCI6OCxcInJcIjpcImxvZ29cIn0se1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtdGFwLWhlbHBlci1wcm9tcHRcIn0sXCJmXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcInRhcF9oZWxwZXJfX3Byb21wdFxcXCIpXCJ9fV19XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS10YXAtaGVscGVyLWNsb3NlXCJ9LFwiZlwiOlt7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJ0YXBfaGVscGVyX19jbG9zZVxcXCIpXCJ9fV19XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwib1wiOlwiY3NzcmVzZXRcIixcImFcIjp7XCJjbGFzc1wiOltcImFudGVubmEgYW50ZW5uYS10ZXh0LWluZGljYXRvci13aWRnZXQgXCIse1widFwiOjQsXCJmXCI6W1wiYW50ZW5uYS1ub3Rsb2FkZWRcIl0sXCJuXCI6NTEsXCJyXCI6XCJjb250YWluZXJEYXRhLmxvYWRlZFwifSxcIiBhbnRlbm5hLXJlc2V0IFwiLHtcInRcIjo0LFwiZlwiOltcImFudGVubmEtaGFzcmVhY3Rpb25zXCJdLFwiblwiOjUwLFwieFwiOntcInJcIjpbXCJjb250YWluZXJEYXRhLnJlYWN0aW9uVG90YWxcIl0sXCJzXCI6XCJfMD4wXCJ9fSxcIiBcIix7XCJ0XCI6NCxcImZcIjpbXCJhbnRlbm5hLXN1cHByZXNzXCJdLFwiblwiOjUwLFwiclwiOlwiY29udGFpbmVyRGF0YS5zdXBwcmVzc1wifSxcIiBcIix7XCJ0XCI6MixcInJcIjpcImV4dHJhQ2xhc3Nlc1wifV19LFwiZlwiOltcIiBcIix7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS10ZXh0LWluZGljYXRvci1pbm5lclwifSxcImZcIjpbe1widFwiOjgsXCJyXCI6XCJsb2dvXCJ9LHtcInRcIjo0LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1yZWFjdGlvbi10b3RhbFwifSxcIm9cIjpcImNzc3Jlc2V0XCIsXCJmXCI6W3tcInRcIjoyLFwiclwiOlwiY29udGFpbmVyRGF0YS5yZWFjdGlvblRvdGFsXCJ9XX1dLFwiblwiOjUwLFwiclwiOlwiY29udGFpbmVyRGF0YS5yZWFjdGlvblRvdGFsXCJ9XX1dfV19Il19
