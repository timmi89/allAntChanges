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
},{"./css-loader":11,"./group-settings-loader":14,"./page-data-loader":20,"./page-scanner":22,"./reinitializer":28,"./script-loader":29,"./tap-helper":32,"./utils/browser-metrics":37,"./utils/xdm-loader":68,"./xdm-analytics":69}],2:[function(require,module,exports){
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
},{"../templates/auto-call-to-action.hbs.html":70,"./svgs":31,"./utils/browser-metrics":37,"./utils/jquery-provider":40,"./utils/ractive-provider":52}],3:[function(require,module,exports){
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
},{"../templates/blocked-reaction-page.hbs.html":71,"./svgs":31,"./utils/ractive-provider":52}],4:[function(require,module,exports){
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
},{"../templates/call-to-action-counter.hbs.html":72,"./utils/ractive-provider":52}],5:[function(require,module,exports){
var Ractive; require('./utils/ractive-provider').onLoad(function(loadedRactive) { Ractive = loadedRactive;});

function createExpandedReactions($expandedReactionsElement, $containerElement, containerData, groupSettings) {
    var containerElement = $containerElement.get(0);
    var ractive = Ractive({
        el: $expandedReactionsElement,
        magic: true,
        data: {
            containerData: containerData,
            computeExpandedReactions: computeExpandedReactions(groupSettings.defaultReactions(containerElement))
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
},{"../templates/call-to-action-expanded-reactions.hbs.html":73,"./utils/ractive-provider":52}],6:[function(require,module,exports){
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
},{"./call-to-action-counter":4,"./call-to-action-expanded-reactions":5,"./call-to-action-label":7,"./reactions-widget":26,"./utils/touch-support":59}],7:[function(require,module,exports){
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
},{"../templates/call-to-action-label.hbs.html":74,"./utils/ractive-provider":52}],8:[function(require,module,exports){
var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var Ractive; require('./utils/ractive-provider').onLoad(function(loadedRactive) { Ractive = loadedRactive;});
var AjaxClient = require('./utils/ajax-client');
var URLs = require('./utils/urls');
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
            facebookIcon: SVGs.facebook,
            twitterIcon: SVGs.twitter
        }
    });
    ractive.on('share-facebook', shareToFacebook);
    ractive.on('share-twitter', shareToTwitter);
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
},{"../templates/confirmation-page.hbs.html":75,"./events":12,"./svgs":31,"./utils/ajax-client":35,"./utils/jquery-provider":40,"./utils/ractive-provider":52,"./utils/urls":63}],9:[function(require,module,exports){
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
},{"./utils/ajax-client":35,"./utils/urls":63}],10:[function(require,module,exports){
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
},{"../templates/content-rec-widget.hbs.html":76,"./content-rec-loader":9,"./events":12,"./svgs":31,"./utils/browser-metrics":37,"./utils/json-utils":41,"./utils/messages":47,"./utils/ractive-provider":52,"./utils/throttled-events":58,"./utils/urls":63}],11:[function(require,module,exports){
var AppMode = require('./utils/app-mode');
var URLs = require('./utils/urls');

function loadCss() {
    // To make sure none of our content renders on the page before our CSS is loaded, we append a simple inline style
    // element that turns off our elements *before* our CSS links. This exploits the cascade rules - our CSS files appear
    // after the inline style in the document, so they take precedence (and make everything appear) once they're loaded.
    injectCss('.antenna{display:none;}');
    var cssHref = URLs.amazonS3Url() + '/widget-new/antenna.css?v=4';
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
},{"./utils/app-mode":36,"./utils/urls":63}],12:[function(require,module,exports){
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
    // commentCreated: 'c',
    reactionCreated: 're',
    // commentsViewed: 'vcom',
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
    readMoreLoad: 'antenna.readMoreLoad',
    readMoreView: 'antenna.readMoreView',
    readMoreClick: 'antenna.readMoreClick'
};

//noinspection JSUnresolvedVariable
module.exports = {
    postGroupSettingsLoaded: postGroupSettingsLoaded,
    postPageDataLoaded: postPageDataLoaded,
    postSummaryOpened: postSummaryOpened,
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

},{"./utils/ajax-client":35,"./utils/browser-metrics":37,"./utils/logging":43,"./utils/segment":56,"./utils/session-data":57,"./utils/user":64}],13:[function(require,module,exports){
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
},{"../templates/generic-error-page.hbs.html":77,"./svgs":31,"./utils/ractive-provider":52}],14:[function(require,module,exports){
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
},{"./group-settings":15,"./utils/ajax-client":35,"./utils/jquery-provider":40,"./utils/urls":63}],15:[function(require,module,exports){
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

    function defaultReactions(element) {
        // Default reactions are available in three locations in three data formats:
        // 1. As a comma-separated attribute value on a particular element
        // 2. As an array of strings on the window.antenna_extend property
        // 3. As a json object with a body and id on the group settings
        var reactions = [];
        var reactionStrings;
        var elementReactions = element ? element.getAttribute('ant-reactions') : undefined;
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
        customCSS += createCustomCSSRule(migrateReactionsBackgroundColorSettings(data('tags_bg_css', '')), '.antenna-reactions-page .antenna-body, .antenna-confirmation-page .antenna-body');
        customCSS += createCustomCSSRule(data('tag_box_bg_colors', ''), '.antenna-reaction-box');
        customCSS += createCustomCSSRule(data('tag_box_bg_colors_hover', ''), '.antenna-reaction:hover > .antenna-reaction-box');
        customCSS += createCustomCSSRule(migrateTextColorSettings(data('tag_box_text_colors', '')), '.antenna-reaction-box, .antenna-reaction-location .antenna-location-path, .antenna-confirm-reaction');
        customCSS += createCustomCSSRule(migrateFontFamilySetting(data('tag_box_font_family', '')), '.antenna-reaction-box .antenna-reset, .antenna-confirm-reaction');
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
},{"./events":12}],16:[function(require,module,exports){
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
},{}],17:[function(require,module,exports){
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
},{"../templates/locations-page.hbs.html":78,"./events":12,"./hashed-elements":16,"./page-data":21,"./svgs":31,"./utils/jquery-provider":40,"./utils/ractive-provider":52,"./utils/range":53}],18:[function(require,module,exports){
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
},{"../templates/login-page.hbs.html":79,"./events":12,"./svgs":31,"./utils/ractive-provider":52,"./utils/urls":63,"./utils/user":64}],19:[function(require,module,exports){
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
},{"../templates/media-indicator-widget.hbs.html":80,"./reactions-widget":26,"./svgs":31,"./utils/app-mode":36,"./utils/browser-metrics":37,"./utils/jquery-provider":40,"./utils/mutation-observer":49,"./utils/ractive-provider":52,"./utils/throttled-events":58,"./utils/touch-support":59,"./utils/visibility":65}],20:[function(require,module,exports){
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
},{"./page-data":21,"./utils/ajax-client":35,"./utils/jquery-provider":40,"./utils/page-utils":50,"./utils/throttled-events":58,"./utils/urls":63}],21:[function(require,module,exports){
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
},{"./events":12,"./hashed-elements":16,"./utils/jquery-provider":40}],22:[function(require,module,exports){
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
        var defaultReactions = groupSettings.defaultReactions($summary.get(0)); // TODO: do we support customizing the default reactions at this level?
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
                    defaultReactions: groupSettings.defaultReactions($targetElement.get(0)),
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
            var defaultReactions = groupSettings.defaultReactions($textElement.get(0));
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
                var defaultReactions = groupSettings.defaultReactions($mediaElement.get(0));
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
},{"./auto-call-to-action":2,"./call-to-action-indicator":6,"./content-rec-widget":10,"./hashed-elements":16,"./media-indicator-widget":19,"./page-data":21,"./page-data-loader":20,"./readmore-events":27,"./summary-widget":30,"./text-indicator-widget":33,"./text-reactions":34,"./utils/app-mode":36,"./utils/browser-metrics":37,"./utils/hash":39,"./utils/jquery-provider":40,"./utils/mutation-observer":49,"./utils/page-utils":50,"./utils/segment":56,"./utils/urls":63,"./utils/widget-bucket":66}],23:[function(require,module,exports){
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
},{"../templates/pending-reaction-page.hbs.html":81,"./svgs":31,"./utils/ractive-provider":52}],24:[function(require,module,exports){
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
},{"../templates/popup-widget.hbs.html":82,"./svgs":31,"./utils/jquery-provider":40,"./utils/ractive-provider":52,"./utils/transition-util":60,"./utils/widget-bucket":66}],25:[function(require,module,exports){
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
            locationIcon: SVGs.location
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
},{"../templates/reactions-page.hbs.html":83,"./events":12,"./page-data":21,"./svgs":31,"./utils/ajax-client":35,"./utils/jquery-provider":40,"./utils/ractive-provider":52,"./utils/range":53,"./utils/reactions-widget-layout-utils":55}],26:[function(require,module,exports){
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

    function showLocations(reaction, backPageSelector) {
        showProgressPage(); // TODO: provide some way for the user to give up / cancel.
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
},{"../templates/reactions-widget.hbs.html":84,"./blocked-reaction-page":3,"./confirmation-page":8,"./events":12,"./generic-error-page":13,"./locations-page":17,"./login-page":18,"./page-data":21,"./pending-reaction-page":23,"./reactions-page":25,"./svgs":31,"./utils/ajax-client":35,"./utils/browser-metrics":37,"./utils/jquery-provider":40,"./utils/json-utils":41,"./utils/messages":47,"./utils/moveable":48,"./utils/ractive-provider":52,"./utils/range":53,"./utils/touch-support":59,"./utils/transition-util":60,"./utils/user":64,"./utils/widget-bucket":66}],27:[function(require,module,exports){
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
},{"./events":12,"./utils/throttled-events":58}],28:[function(require,module,exports){
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
},{"./group-settings":15,"./hashed-elements":16,"./page-data":21,"./page-data-loader":20,"./page-scanner":22,"./popup-widget":24,"./reactions-widget":26,"./utils/mutation-observer":49}],29:[function(require,module,exports){
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
},{"./utils/app-mode":36,"./utils/jquery-provider":40,"./utils/ractive-provider":52,"./utils/rangy-provider":54,"./utils/urls":63}],30:[function(require,module,exports){
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
            computeExpandedReactions: computeExpandedReactions(defaultReactions)
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
    create: createSummaryWidget
};
},{"../templates/summary-widget.hbs.html":85,"./reactions-widget":26,"./svgs":31,"./utils/browser-metrics":37,"./utils/jquery-provider":40,"./utils/ractive-provider":52,"./utils/segment":56,"./utils/touch-support":59}],31:[function(require,module,exports){
var Ractive; require('./utils/ractive-provider').onLoad(function(loadedRactive) { Ractive = loadedRactive;});

// About how we handle icons: We insert a single SVG element at the top of the body element which defines all of the
// icons we need. Then all icons used by the applications are rendered with very lightweight SVG elements that simply
// point to the appropriate icon by reference.

// TODO: look into using a single template for the "use" SVGs. Can we instantiate a partial with a dynamic context?
var templates = {
    logo: require('../templates/svg-logo.hbs.html'),
    // The "selectable" logo defines an inline 'path' rather than a 'use' reference, as a workaround for a Firefox text selection bug.
    logoSelectable: require('../templates/svg-logo-selectable.hbs.html'),
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
    location: getSVG(templates.location),
    facebook: getSVG(templates.facebook),
    twitter: getSVG(templates.twitter),
    left: getSVG(templates.left),
    film: getSVG(templates.film)
};
},{"../templates/svg-facebook.hbs.html":86,"../templates/svg-film.hbs.html":87,"../templates/svg-left.hbs.html":88,"../templates/svg-location.hbs.html":89,"../templates/svg-logo-selectable.hbs.html":90,"../templates/svg-logo.hbs.html":91,"../templates/svg-twitter.hbs.html":92,"../templates/svgs.hbs.html":93,"./utils/ractive-provider":52}],32:[function(require,module,exports){
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
},{"../templates/tap-helper.hbs.html":94,"./svgs":31,"./utils/browser-metrics":37,"./utils/ractive-provider":52,"./utils/widget-bucket":66}],33:[function(require,module,exports){
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
},{"../templates/text-indicator-widget.hbs.html":95,"./popup-widget":24,"./reactions-widget":26,"./svgs":31,"./utils/jquery-provider":40,"./utils/ractive-provider":52,"./utils/touch-support":59}],34:[function(require,module,exports){
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
},{"./popup-widget":24,"./reactions-widget":26,"./utils/jquery-provider":40,"./utils/range":53,"./utils/touch-support":59}],35:[function(require,module,exports){
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

// TODO: We need to review the API so that it returns/accepts a uniform set of values.
function contentNodeDataKind(type) {
    if (type === 'image') {
        return 'img';
    }
    return type;
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
    postShareReaction: postShareReaction,
    fetchLocationDetails: fetchLocationDetails,
    postEvent: postEvent,
    postTrackingEvent: postTrackingEvent
};
},{"./json-utils":41,"./jsonp-client":42,"./logging":43,"./urls":63,"./user":64}],36:[function(require,module,exports){
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
},{"./url-constants":61,"./url-params":62}],37:[function(require,module,exports){

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
},{"./jquery-provider":40,"./md5":44}],40:[function(require,module,exports){

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
},{}],41:[function(require,module,exports){

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
},{}],42:[function(require,module,exports){
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
},{"./json-utils":41}],43:[function(require,module,exports){
var AppMode = require('./app-mode');

function logDebugMessage(message) {
    if (AppMode.debug) {
        console.debug('AntennaDebug: ' + message);
    }
}

module.exports = {
    debugMessage: logDebugMessage
};
},{"./app-mode":36}],44:[function(require,module,exports){
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
},{}],45:[function(require,module,exports){
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
},{}],46:[function(require,module,exports){
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
},{}],47:[function(require,module,exports){
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
},{"../group-settings":15,"./app-mode":36,"./messages-en":45,"./messages-es":46}],48:[function(require,module,exports){
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
},{"./jquery-provider":40}],49:[function(require,module,exports){
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
},{"./callback-support":38,"./jquery-provider":40,"./range":53,"./widget-bucket":66}],50:[function(require,module,exports){
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
},{"./jquery-provider":40}],51:[function(require,module,exports){
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
},{}],52:[function(require,module,exports){
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
},{"./messages":47,"./ractive-events-tap":51}],53:[function(require,module,exports){
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
},{"./jquery-provider":40,"./rangy-provider":54}],54:[function(require,module,exports){

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
},{}],55:[function(require,module,exports){
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
},{"./jquery-provider":40}],56:[function(require,module,exports){
var UrlParams = require('./url-params');

var segment;

function getSegment(groupSettings) {
    if (segment === undefined) { // 'null' is the opt-out value
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
            // If this happens, opt out of segmenting
            return null;
        }
        return null;
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
},{"./url-params":62}],57:[function(require,module,exports){
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
},{"./json-utils":41}],58:[function(require,module,exports){
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
},{"./callback-support":38}],59:[function(require,module,exports){

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
},{}],62:[function(require,module,exports){

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
},{}],63:[function(require,module,exports){
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

},{"./app-mode":36,"./json-utils":41,"./url-constants":61}],64:[function(require,module,exports){
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

module.exports = {
    fetchUser: fetchUser,
    refreshUserFromCookies: refreshUserFromCookies,
    cachedUser: cachedUser,
    reAuthorizeUser: reAuthorizeUser,
    facebookLogin: facebookLogin
};
},{"./jsonp-client":42,"./urls":63,"./xdm-client":67}],65:[function(require,module,exports){
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
},{"./xdm-loader":68}],68:[function(require,module,exports){
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
},{"./app-mode":36,"./url-constants":61,"./widget-bucket":66}],69:[function(require,module,exports){
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
},{"./events":12,"./group-settings":15,"./page-data":21,"./utils/xdm-client":67}],70:[function(require,module,exports){
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
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna-page antenna-confirmation-page"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-body"},"f":[{"t":7,"e":"div","a":{"class":"antenna-confirm-wrapper"},"f":[{"t":7,"e":"div","a":{"class":"antenna-confirm-reaction"},"f":[{"t":2,"r":"text"}]}]}]}," ",{"t":7,"e":"div","a":{"class":"antenna-footer antenna-confirm-footer"},"f":[{"t":7,"e":"span","a":{"class":"antenna-share"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"confirmation_page__share\")"}}," ",{"t":7,"e":"a","v":{"tap":"share-facebook"},"a":{"href":"//facebook.com"},"f":[{"t":8,"r":"facebookIcon"}]}," ",{"t":7,"e":"a","v":{"tap":"share-twitter"},"a":{"href":"//twitter.com"},"f":[{"t":8,"r":"twitterIcon"}]}]}]}]}]}
},{}],76:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":4,"f":[{"t":7,"e":"div","a":{"class":"antenna antenna-contentrec-inner"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-contentrec-header"},"f":[{"t":2,"r":"title"}]}," ",{"t":7,"e":"div","a":{"class":"antenna-contentrec-entries"},"f":[{"t":4,"f":[{"t":7,"e":"div","a":{"class":["antenna-contentrec-entry antenna-reset ",{"t":4,"f":["antenna-desktop"],"n":51,"r":"isMobile"}],"style":["width:",{"t":2,"r":"entryWidth"},";"]},"f":[{"t":7,"e":"a","a":{"href":[{"t":2,"x":{"r":["computeEntryUrl","."],"s":"_0(_1)"}}],"target":[{"t":4,"f":["_self"],"n":50,"r":"isMobile"},{"t":4,"n":51,"f":["_target"],"r":"isMobile"}]},"f":[{"t":7,"e":"div","a":{"class":"antenna-contentrec-entry-inner"},"f":[{"t":7,"e":"div","a":{"class":"antenna-contentrec-entry-header"},"f":[{"t":7,"e":"div","a":{"class":"antenna-contentrec-reaction-text"},"f":[{"t":2,"r":"./top_reaction.text"}]}," ",{"t":7,"e":"div","a":{"class":"antenna-contentrec-indicator-wrapper"},"f":[{"t":7,"e":"div","a":{"class":"antenna-contentrec-reaction-indicator"},"f":[{"t":8,"r":"logo"},{"t":7,"e":"span","a":{"class":"antenna-contentrec-reaction-count"},"f":[" ",{"t":2,"r":"./reaction_count"}]}]}]}]}," ",{"t":7,"e":"div","a":{"class":"antenna-contentrec-body","style":["background:",{"t":2,"rx":{"r":"colors","m":[{"t":30,"n":"index"},"background"]}},";color:",{"t":2,"rx":{"r":"colors","m":[{"t":30,"n":"index"},"foreground"]}},";"]},"f":[{"t":4,"f":[{"t":7,"e":"div","a":{"class":"antenna-contentrec-body-image"},"f":[{"t":7,"e":"img","a":{"src":[{"t":2,"r":"./content.body"}]}}]}],"n":50,"x":{"r":["./content.type"],"s":"_0===\"image\""}},{"t":4,"n":51,"f":[{"t":4,"n":50,"x":{"r":["./content.type"],"s":"_0===\"text\""},"f":[{"t":7,"e":"div","a":{"class":"antenna-contentrec-body-text"},"o":"renderText","f":[{"t":2,"r":"./content.body"}]}]}],"x":{"r":["./content.type"],"s":"_0===\"image\""}}]}," ",{"t":7,"e":"div","a":{"class":"antenna-contentrec-page-title"},"f":[{"t":2,"r":"./page.title"}]}]}]}]}],"i":"index","r":"contentData.entries"}]}]}],"n":50,"x":{"r":["populateContentEntries","pageData.summaryLoaded","contentData.entries"],"s":"_0(_1)&&_2"}}]}
},{}],77:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna-page antenna-error-page"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-body"},"f":[{"t":7,"e":"div","v":{"tap":"back"},"a":{"class":"antenna-error-back"},"f":[{"t":8,"r":"left"},{"t":2,"x":{"r":["getMessage"],"s":"_0(\"reactions_widget__back\")"}}]}," ",{"t":7,"e":"div","a":{"class":"antenna-error-body"},"f":[{"t":7,"e":"div","a":{"class":"antenna-error-message"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"error_page__message\")"}}]}]}]}]}]}
},{}],78:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna-page antenna-locations-page"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-body"},"f":[{"t":7,"e":"div","v":{"tap":"back"},"a":{"class":"antenna-locations-back"},"f":[{"t":8,"r":"left"},{"t":2,"x":{"r":["getMessage"],"s":"_0(\"reactions_widget__back\")"}}]}," ",{"t":7,"e":"table","a":{"class":"antenna-locations-table"},"f":[{"t":4,"f":[{"t":7,"e":"tr","a":{"class":"antenna-locations-content-row"},"f":[{"t":7,"e":"td","a":{"class":"antenna-locations-count-cell"},"f":[{"t":4,"f":[{"t":3,"x":{"r":["getMessage"],"s":"_0(\"locations_page__count_one\")"}}],"n":50,"x":{"r":["pageReactionCount"],"s":"_0===1"}},{"t":4,"n":51,"f":[{"t":3,"x":{"r":["getMessage","pageReactionCount"],"s":"_0(\"locations_page__count_many\",[_1])"}}],"x":{"r":["pageReactionCount"],"s":"_0===1"}}]}," ",{"t":7,"e":"td","a":{"class":"antenna-locations-page-body"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"locations_page__pagelevel\")"}}]}]}],"n":50,"r":"pageReactionCount"}," ",{"t":4,"f":[{"t":4,"f":[" ",{"t":7,"e":"tr","v":{"tap":"reveal"},"a":{"class":["antenna-locations-content-row ",{"t":4,"f":["antenna-locate"],"n":50,"x":{"r":["canLocate","./containerHash"],"s":"_0(_1)"}}]},"f":[{"t":7,"e":"td","a":{"class":"antenna-locations-count-cell"},"f":[{"t":4,"f":[{"t":3,"x":{"r":["getMessage"],"s":"_0(\"locations_page__count_one\")"}}],"n":50,"x":{"r":["./count"],"s":"_0===1"}},{"t":4,"n":51,"f":[{"t":3,"x":{"r":["getMessage","./count"],"s":"_0(\"locations_page__count_many\",[_1])"}}],"x":{"r":["./count"],"s":"_0===1"}}]}," ",{"t":4,"f":[{"t":7,"e":"td","a":{"class":"antenna-locations-text-body"},"f":[{"t":2,"r":"./body"}]}],"n":50,"x":{"r":["./kind"],"s":"_0===\"txt\""}},{"t":4,"n":51,"f":[{"t":4,"n":50,"x":{"r":["./kind"],"s":"_0===\"img\""},"f":[{"t":7,"e":"td","a":{"class":"antenna-locations-image-body"},"f":[{"t":7,"e":"img","a":{"src":[{"t":2,"r":"./body"}]}}]}]},{"t":4,"n":50,"x":{"r":["./kind"],"s":"(!(_0===\"img\"))&&(_0===\"med\")"},"f":[" ",{"t":7,"e":"td","a":{"class":"antenna-locations-media-body"},"f":[{"t":8,"r":"film"},{"t":7,"e":"span","a":{"class":"antenna-locations-video"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"locations_page__video\")"}}]}]}]},{"t":4,"n":50,"x":{"r":["./kind"],"s":"(!(_0===\"img\"))&&(!(_0===\"med\"))"},"f":[" ",{"t":7,"e":"td","f":[" "]}]}],"x":{"r":["./kind"],"s":"_0===\"txt\""}}]}],"n":50,"x":{"r":["./kind"],"s":"_0!==\"pag\""}}],"i":"id","r":"locationData"}]}]}]}]}
},{}],79:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna-page antenna-login-page"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-body"},"f":[{"t":7,"e":"div","v":{"tap":"back"},"a":{"class":"antenna-login-back"},"f":[{"t":8,"r":"left"},{"t":2,"x":{"r":["getMessage"],"s":"_0(\"reactions_widget__back\")"}}]}," ",{"t":7,"e":"div","a":{"class":"antenna-login-container"},"f":[{"t":7,"e":"div","a":{"class":"antenna-login-content"},"f":[{"t":7,"e":"div","a":{"class":"antenna-login-message"},"f":[{"t":3,"x":{"r":["getMessage","groupName"],"s":"_0(\"login_page__message_1\",[_1])"}}]}," ",{"t":7,"e":"div","a":{"class":"antenna-login-message"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"login_page__message_2\")"}}]}," ",{"t":7,"e":"div","a":{"class":"antenna-login-buttons"},"f":[{"t":7,"e":"div","a":{"class":"fb-login-button"},"v":{"tap":"facebookLogin"},"f":[{"t":7,"e":"img","a":{"src":"/static/widget/images/fb-login_to_readrboard.png"}}]}," ",{"t":7,"e":"div","a":{"class":"antenna-or"},"f":["or"]}," ",{"t":7,"e":"div","a":{"class":"antenna-login-button"},"v":{"tap":"antennaLogin"},"f":[{"t":8,"r":"logo"},{"t":7,"e":"span","a":{"class":"antenna-login-text"},"f":["Login to Antenna"]}]}]}," ",{"t":7,"e":"div","a":{"class":"antenna-privacy-text"},"f":[{"t":3,"x":{"r":["getMessage"],"s":"_0(\"login_page__privacy\")"}}]}]}," ",{"t":7,"e":"div","a":{"class":"antenna-login-pending"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"login_page__pending_pre\")"}},{"t":7,"e":"a","a":{"href":"javascript:void(0);"},"v":{"tap":"retry"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"login_page__pending_click\")"}}]},{"t":2,"x":{"r":["getMessage"],"s":"_0(\"login_page__pending_post\")"}}]}]}]}]}]}
},{}],80:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"span","o":"cssreset","a":{"class":"antenna antenna-media-indicator-wrapper"},"f":[{"t":7,"e":"span","m":[{"t":2,"r":"extraAttributes"}],"a":{"class":["antenna antenna-media-indicator-widget ",{"t":4,"f":["antenna-notloaded"],"n":51,"r":"containerData.loaded"}," antenna-reset ",{"t":4,"f":["antenna-touch"],"n":50,"r":"supportsTouch"}]},"f":[" ",{"t":8,"r":"logo"}," ",{"t":4,"f":[{"t":7,"e":"span","a":{"class":"antenna-reaction-total"},"o":"cssreset","f":[{"t":2,"r":"containerData.reactionTotal"}]}],"n":50,"r":"containerData.reactionTotal"},{"t":4,"n":51,"f":[{"t":7,"e":"span","a":{"class":"antenna-reaction-prompt"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"media_indicator__think\")"}}]}],"r":"containerData.reactionTotal"}]}]}]}
},{}],81:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna-page antenna-pending-page"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-body"},"f":[{"t":7,"e":"div","a":{"class":"antenna-pending-reaction"},"f":[{"t":2,"r":"text"}]}," ",{"t":7,"e":"div","a":{"class":"antenna-pending-message"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"pending_page__message_appear\")"}}]}]}]}]}
},{}],82:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna-popup"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-popup-body"},"f":[{"t":8,"r":"logo"},{"t":7,"e":"span","a":{"class":"antenna-popup-text"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"popup_widget__think\")"}}]}]}]}]}
},{}],83:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna-page antenna-reactions-page"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-body"},"f":[{"t":4,"f":[{"t":4,"f":[{"t":7,"e":"div","v":{"tap":"react","mouseenter":"highlight","mouseleave":"clearhighlights"},"a":{"class":["antenna-reaction ",{"t":2,"x":{"r":["reactionsLayoutClass","index"],"s":"_0(_1)"}}]},"f":[{"t":7,"e":"div","a":{"class":"antenna-reaction-box"},"f":[{"t":7,"e":"div","a":{"class":["antenna-reaction-text ",{"t":4,"f":["antenna-reaction-zero"],"n":51,"r":"./count"}]},"o":"sizetofit","f":[{"t":2,"r":"./text"}]}," ",{"t":7,"e":"div","a":{"class":"antenna-reaction-count"},"f":[{"t":2,"r":"./count"}]}," ",{"t":7,"e":"div","a":{"class":"antenna-plusone"},"f":["+1"]}," ",{"t":4,"f":[{"t":7,"e":"div","v":{"tap":"showlocations"},"a":{"class":"antenna-reaction-location"},"f":[{"t":8,"r":"locationIcon"}]}],"n":50,"x":{"r":["isSummary","./count"],"s":"_0&&_1"}}]}]}],"i":"index","r":"reactions"}],"n":50,"r":"reactions"}]}," ",{"t":7,"e":"div","a":{"class":"antenna-footer antenna-reactions-footer"},"f":[{"t":7,"e":"div","a":{"class":"antenna-custom-area"},"f":[{"t":7,"e":"input","v":{"focus":"customfocus","keydown":"inputkeydown","blur":"customblur"},"a":{"value":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"reactions_page__add\")"}}],"maxlength":"25"}}," ",{"t":7,"e":"button","v":{"tap":"newcustom"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"reactions_page__ok\")"}}]}]}," ",{"t":7,"e":"div","a":{"class":"antenna-text-logo"},"f":[{"t":7,"e":"a","a":{"href":"//www.antenna.is"},"f":["Antenna"]}]}]}]}]}
},{}],84:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":["antenna antenna-reactions-widget ",{"t":4,"f":["antenna-touch"],"n":50,"r":"supportsTouch"}],"tabindex":"0"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-header"},"f":[{"t":8,"r":"logo"},{"t":7,"e":"span","a":{"class":"antenna-reactions-title"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"reactions_widget__title\")"}}]}," ",{"t":7,"e":"span","v":{"tap":"close"},"a":{"class":"antenna-reactions-close"},"f":["X"]}]}," ",{"t":7,"e":"div","a":{"class":"antenna-page-container"},"f":[" ",{"t":7,"e":"div","a":{"class":"antenna-progress-page antenna-page"},"f":[{"t":7,"e":"div","a":{"class":"antenna-body"},"f":[]}," ",{"t":7,"e":"div","a":{"class":"antenna-progress-spinner"},"f":[{"t":8,"r":"logo"}]}]}]}]}]}
},{}],85:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","o":"cssreset","a":{"class":["antenna antenna-summary-widget no-ant ",{"t":4,"f":["antenna-notloaded"],"n":51,"r":"pageData.summaryLoaded"}," antenna-reset ",{"t":4,"f":["antenna-expanded-summary"],"n":50,"r":"isExpandedSummary"}]},"f":[" ",{"t":7,"e":"div","a":{"class":"antenna-summary-inner"},"f":[{"t":8,"r":"logo"},{"t":7,"e":"span","a":{"class":"antenna-summary-title"},"f":[" ",{"t":4,"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"summary_widget__reactions\")"}}],"n":50,"x":{"r":["pageData.summaryTotal"],"s":"_0===0"}},{"t":4,"n":51,"f":[{"t":4,"n":50,"x":{"r":["pageData.summaryTotal"],"s":"_0===1"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"summary_widget__reactions_one\")"}}]},{"t":4,"n":50,"x":{"r":["pageData.summaryTotal"],"s":"!(_0===1)"},"f":[" ",{"t":2,"x":{"r":["getMessage","pageData.summaryTotal"],"s":"_0(\"summary_widget__reactions_many\",[_1])"}}]}],"x":{"r":["pageData.summaryTotal"],"s":"_0===0"}}]},{"t":4,"f":[{"t":4,"f":[{"t":7,"e":"span","o":"cssreset","a":{"class":["antenna-expanded-reaction ",{"t":4,"f":["antenna-expanded-first"],"n":50,"x":{"r":["@index"],"s":"_0===0"}}]},"f":[{"t":7,"e":"span","a":{"class":"antenna-expanded-text"},"f":[{"t":2,"r":"./text"}]},{"t":7,"e":"span","a":{"class":"antenna-expanded-count"},"f":[{"t":2,"r":"./count"}]}]}],"x":{"r":["computeExpandedReactions","pageData.summaryReactions"],"s":"_0(_1)"}}],"n":50,"r":"isExpandedSummary"}]}]}]}
},{}],86:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"span","a":{"class":"antenna-facebook"},"f":[{"t":7,"e":"svg","f":[{"t":7,"e":"use","a":{"class":"antenna-facebook-path","xlink:href":"#antenna-svg-facebook"}}]}]}]}
},{}],87:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"span","a":{"class":"antenna-film"},"f":[{"t":7,"e":"svg","f":[{"t":7,"e":"use","a":{"class":"antenna-film-path","xlink:href":"#antenna-svg-film"}}]}]}]}
},{}],88:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"span","a":{"class":"antenna-left"},"f":[{"t":7,"e":"svg","f":[{"t":7,"e":"use","a":{"class":"antenna-left-path","xlink:href":"#antenna-svg-left"}}]}]}]}
},{}],89:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"span","a":{"class":"antenna-location"},"f":[{"t":7,"e":"svg","f":[{"t":7,"e":"use","a":{"class":"antenna-location-path","xlink:href":"#antenna-svg-search"}}]}]}]}
},{}],90:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"span","a":{"class":"antenna-logo"},"f":[{"t":7,"e":"svg","a":{"viewBox":"0 0 512 512"},"f":[" ",{"t":7,"e":"path","a":{"class":"antenna-logo-path","d":"m283 510c125-17 229-124 229-253 0-141-115-256-256-256-141 0-256 115-256 256 0 130 108 237 233 254l0-149c-48-14-84-50-84-102 0-65 43-113 108-113 65 0 107 48 107 113 0 52-33 88-81 102z"}}]}]}]}
},{}],91:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"span","a":{"class":"antenna-logo"},"f":[{"t":7,"e":"svg","f":[{"t":7,"e":"use","a":{"class":"antenna-logo-path","xlink:href":"#antenna-svg-logo"}}]}]}]}
},{}],92:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"span","a":{"class":"antenna-twitter"},"f":[{"t":7,"e":"svg","f":[{"t":7,"e":"use","a":{"class":"antenna-twitter-path","xlink:href":"#antenna-svg-twitter"}}]}]}]}
},{}],93:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"svg","a":{"xmlns":"http://www.w3.org/2000/svg","style":"display: none;"},"f":[{"t":7,"e":"symbol","a":{"id":"antenna-svg-twitter","viewBox":"0 0 512 512"},"f":[{"t":7,"e":"path","a":{"d":"m453 134c-14 6-30 11-46 12c16-10 29-25 35-44c-15 9-33 16-51 19c-15-15-36-25-59-25c-45 0-81 36-81 81c0 6 1 12 2 18c-67-3-127-35-167-84c-7 12-11 25-11 40c0 28 15 53 36 68c-13-1-25-4-36-11c0 1 0 1 0 2c0 39 28 71 65 79c-7 2-14 3-22 3c-5 0-10-1-15-2c10 32 40 56 76 56c-28 22-63 35-101 35c-6 0-13 0-19-1c36 23 78 36 124 36c149 0 230-123 230-230c0-3 0-7 0-10c16-12 29-26 40-42z"}}]}," ",{"t":7,"e":"symbol","a":{"id":"antenna-svg-facebook","viewBox":"0 0 512 512"},"f":[{"t":7,"e":"path","a":{"d":"m420 72l-328 0c-11 0-20 9-20 20l0 328c0 11 9 20 20 20l177 0l0-142l-48 0l0-56l48 0l0-41c0-48 29-74 71-74c20 0 38 2 43 3l0 49l-29 0c-23 0-28 11-28 27l0 36l55 0l-7 56l-48 0l0 142l94 0c11 0 20-9 20-20l0-328c0-11-9-20-20-20z"}}]}," ",{"t":7,"e":"symbol","a":{"id":"antenna-svg-search","viewBox":"0 0 512 512"},"f":[{"t":7,"e":"path","a":{"d":"m347 238c0-36-12-66-37-91c-25-25-55-37-91-37c-35 0-65 12-90 37c-25 25-38 55-38 91c0 35 13 65 38 90c25 25 55 38 90 38c36 0 66-13 91-38c25-25 37-55 37-90z m147 237c0 10-4 19-11 26c-7 7-16 11-26 11c-10 0-19-4-26-11l-98-98c-34 24-72 36-114 36c-27 0-53-5-78-16c-25-11-46-25-64-43c-18-18-32-39-43-64c-10-25-16-51-16-78c0-28 6-54 16-78c11-25 25-47 43-65c18-18 39-32 64-43c25-10 51-15 78-15c28 0 54 5 79 15c24 11 46 25 64 43c18 18 32 40 43 65c10 24 16 50 16 78c0 42-12 80-36 114l98 98c7 7 11 15 11 25z"}}]}," ",{"t":7,"e":"symbol","a":{"id":"antenna-svg-left","viewBox":"0 0 512 512"},"f":[{"t":7,"e":"path","a":{"d":"m368 160l-64-64-160 160 160 160 64-64-96-96z"}}]}," ",{"t":7,"e":"symbol","a":{"id":"antenna-svg-logo","viewBox":"0 0 512 512"},"f":[" ",{"t":7,"e":"path","a":{"d":"m283 510c125-17 229-124 229-253 0-141-115-256-256-256-141 0-256 115-256 256 0 130 108 237 233 254l0-149c-48-14-84-50-84-102 0-65 43-113 108-113 65 0 107 48 107 113 0 52-33 88-81 102z"}}]}," ",{"t":7,"e":"symbol","a":{"id":"antenna-svg-film","viewBox":"0 0 512 512"},"f":[{"t":7,"e":"path","a":{"d":"m91 457l0-36c0-5-1-10-5-13-4-4-8-6-13-6l-36 0c-5 0-10 2-13 6-4 3-6 8-6 13l0 36c0 5 2 9 6 13 3 4 8 5 13 5l36 0c5 0 9-1 13-5 4-4 5-8 5-13z m0-110l0-36c0-5-1-9-5-13-4-4-8-5-13-5l-36 0c-5 0-10 1-13 5-4 4-6 8-6 13l0 36c0 5 2 10 6 13 3 4 8 6 13 6l36 0c5 0 9-2 13-6 4-3 5-8 5-13z m0-109l0-37c0-5-1-9-5-13-4-3-8-5-13-5l-36 0c-5 0-10 2-13 5-4 4-6 8-6 13l0 37c0 5 2 9 6 13 3 3 8 5 13 5l36 0c5 0 9-2 13-5 4-4 5-8 5-13z m293 219l0-146c0-5-2-9-5-13-4-4-8-5-13-5l-220 0c-5 0-9 1-13 5-3 4-5 8-5 13l0 146c0 5 2 9 5 13 4 4 8 5 13 5l220 0c5 0 9-1 13-5 3-4 5-8 5-13z m-293-329l0-37c0-5-1-9-5-12-4-4-8-6-13-6l-36 0c-5 0-10 2-13 6-4 3-6 7-6 12l0 37c0 5 2 9 6 13 3 3 8 5 13 5l36 0c5 0 9-2 13-5 4-4 5-8 5-13z m403 329l0-36c0-5-2-10-6-13-3-4-8-6-13-6l-36 0c-5 0-9 2-13 6-4 3-5 8-5 13l0 36c0 5 1 9 5 13 4 4 8 5 13 5l36 0c5 0 10-1 13-5 4-4 6-8 6-13z m-110-219l0-147c0-5-2-9-5-12-4-4-8-6-13-6l-220 0c-5 0-9 2-13 6-3 3-5 7-5 12l0 147c0 5 2 9 5 13 4 3 8 5 13 5l220 0c5 0 9-2 13-5 3-4 5-8 5-13z m110 109l0-36c0-5-2-9-6-13-3-4-8-5-13-5l-36 0c-5 0-9 1-13 5-4 4-5 8-5 13l0 36c0 5 1 10 5 13 4 4 8 6 13 6l36 0c5 0 10-2 13-6 4-3 6-8 6-13z m0-109l0-37c0-5-2-9-6-13-3-3-8-5-13-5l-36 0c-5 0-9 2-13 5-4 4-5 8-5 13l0 37c0 5 1 9 5 13 4 3 8 5 13 5l36 0c5 0 10-2 13-5 4-4 6-8 6-13z m0-110l0-37c0-5-2-9-6-12-3-4-8-6-13-6l-36 0c-5 0-9 2-13 6-4 3-5 7-5 12l0 37c0 5 1 9 5 13 4 3 8 5 13 5l36 0c5 0 10-2 13-5 4-4 6-8 6-13z m36-46l0 384c0 13-4 24-13 33-9 9-20 13-32 13l-458 0c-12 0-23-4-32-13-9-9-13-20-13-33l0-384c0-12 4-23 13-32 9-9 20-13 32-13l458 0c12 0 23 4 32 13 9 9 13 20 13 32z"}}]}]}]}
},{}],94:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","o":"cssreset","v":{"tap":"dismiss"},"a":{"class":["antenna antenna-tap-helper ",{"t":4,"f":["antenna-helper-top"],"n":50,"r":"positionTop"},{"t":4,"n":51,"f":["antenna-helper-bottom"],"r":"positionTop"}]},"f":[{"t":7,"e":"div","a":{"class":"antenna-tap-helper-inner"},"f":[{"t":7,"e":"div","f":[{"t":8,"r":"logo"},{"t":7,"e":"span","a":{"class":"antenna-tap-helper-prompt"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"tap_helper__prompt\")"}}]}]}," ",{"t":7,"e":"div","a":{"class":"antenna-tap-helper-close"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"tap_helper__close\")"}}]}]}]}]}
},{}],95:[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"span","o":"cssreset","a":{"class":["antenna antenna-text-indicator-widget ",{"t":4,"f":["antenna-notloaded"],"n":51,"r":"containerData.loaded"}," antenna-reset ",{"t":4,"f":["antenna-hasreactions"],"n":50,"x":{"r":["containerData.reactionTotal"],"s":"_0>0"}}," ",{"t":4,"f":["antenna-suppress"],"n":50,"r":"containerData.suppress"}," ",{"t":2,"r":"extraClasses"}]},"f":[" ",{"t":7,"e":"span","a":{"class":"antenna-text-indicator-inner"},"f":[{"t":8,"r":"logo"},{"t":4,"f":[{"t":7,"e":"span","a":{"class":"antenna-reaction-total"},"o":"cssreset","f":[{"t":2,"r":"containerData.reactionTotal"}]}],"n":50,"r":"containerData.reactionTotal"}]}]}]}
},{}]},{},[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvYW50ZW5uYS1hcHAuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvYXV0by1jYWxsLXRvLWFjdGlvbi5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9ibG9ja2VkLXJlYWN0aW9uLXBhZ2UuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvY2FsbC10by1hY3Rpb24tY291bnRlci5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9jYWxsLXRvLWFjdGlvbi1leHBhbmRlZC1yZWFjdGlvbnMuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvY2FsbC10by1hY3Rpb24taW5kaWNhdG9yLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL2NhbGwtdG8tYWN0aW9uLWxhYmVsLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL2NvbmZpcm1hdGlvbi1wYWdlLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL2NvbnRlbnQtcmVjLWxvYWRlci5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9jb250ZW50LXJlYy13aWRnZXQuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvY3NzLWxvYWRlci5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9ldmVudHMuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvZ2VuZXJpYy1lcnJvci1wYWdlLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL2dyb3VwLXNldHRpbmdzLWxvYWRlci5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9ncm91cC1zZXR0aW5ncy5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9oYXNoZWQtZWxlbWVudHMuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvbG9jYXRpb25zLXBhZ2UuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvbG9naW4tcGFnZS5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9tZWRpYS1pbmRpY2F0b3Itd2lkZ2V0LmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3BhZ2UtZGF0YS1sb2FkZXIuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvcGFnZS1kYXRhLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3BhZ2Utc2Nhbm5lci5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9wZW5kaW5nLXJlYWN0aW9uLXBhZ2UuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvcG9wdXAtd2lkZ2V0LmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3JlYWN0aW9ucy1wYWdlLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3JlYWN0aW9ucy13aWRnZXQuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvcmVhZG1vcmUtZXZlbnRzLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3JlaW5pdGlhbGl6ZXIuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvc2NyaXB0LWxvYWRlci5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9zdW1tYXJ5LXdpZGdldC5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9zdmdzLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3RhcC1oZWxwZXIuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdGV4dC1pbmRpY2F0b3Itd2lkZ2V0LmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3RleHQtcmVhY3Rpb25zLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL2FqYXgtY2xpZW50LmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL2FwcC1tb2RlLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL2Jyb3dzZXItbWV0cmljcy5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9jYWxsYmFjay1zdXBwb3J0LmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL2hhc2guanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvanF1ZXJ5LXByb3ZpZGVyLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL2pzb24tdXRpbHMuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvanNvbnAtY2xpZW50LmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL2xvZ2dpbmcuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvbWQ1LmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL21lc3NhZ2VzLWVuLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL21lc3NhZ2VzLWVzLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL21lc3NhZ2VzLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL21vdmVhYmxlLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL211dGF0aW9uLW9ic2VydmVyLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL3BhZ2UtdXRpbHMuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvcmFjdGl2ZS1ldmVudHMtdGFwLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL3JhY3RpdmUtcHJvdmlkZXIuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvcmFuZ2UuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvcmFuZ3ktcHJvdmlkZXIuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvcmVhY3Rpb25zLXdpZGdldC1sYXlvdXQtdXRpbHMuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvc2VnbWVudC5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9zZXNzaW9uLWRhdGEuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvdGhyb3R0bGVkLWV2ZW50cy5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy90b3VjaC1zdXBwb3J0LmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL3RyYW5zaXRpb24tdXRpbC5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy91cmwtY29uc3RhbnRzLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL3VybC1wYXJhbXMuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvdXJscy5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy91c2VyLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL3Zpc2liaWxpdHkuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvd2lkZ2V0LWJ1Y2tldC5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy94ZG0tY2xpZW50LmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL3hkbS1sb2FkZXIuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMveGRtLWFuYWx5dGljcy5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvYXV0by1jYWxsLXRvLWFjdGlvbi5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvYmxvY2tlZC1yZWFjdGlvbi1wYWdlLmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9jYWxsLXRvLWFjdGlvbi1jb3VudGVyLmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9jYWxsLXRvLWFjdGlvbi1leHBhbmRlZC1yZWFjdGlvbnMuaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL2NhbGwtdG8tYWN0aW9uLWxhYmVsLmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9jb25maXJtYXRpb24tcGFnZS5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvY29udGVudC1yZWMtd2lkZ2V0Lmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9nZW5lcmljLWVycm9yLXBhZ2UuaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL2xvY2F0aW9ucy1wYWdlLmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9sb2dpbi1wYWdlLmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9tZWRpYS1pbmRpY2F0b3Itd2lkZ2V0Lmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9wZW5kaW5nLXJlYWN0aW9uLXBhZ2UuaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL3BvcHVwLXdpZGdldC5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvcmVhY3Rpb25zLXBhZ2UuaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL3JlYWN0aW9ucy13aWRnZXQuaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL3N1bW1hcnktd2lkZ2V0Lmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9zdmctZmFjZWJvb2suaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL3N2Zy1maWxtLmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9zdmctbGVmdC5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvc3ZnLWxvY2F0aW9uLmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9zdmctbG9nby1zZWxlY3RhYmxlLmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9zdmctbG9nby5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvc3ZnLXR3aXR0ZXIuaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL3N2Z3MuaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL3RhcC1oZWxwZXIuaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL3RleHQtaW5kaWNhdG9yLXdpZGdldC5oYnMuaHRtbCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcE5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL1dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3U0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3a0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2UkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xlQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2TkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25JQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUEiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiaWYgKHdpbmRvdy5BTlRFTk5BSVMgfHwgd2luZG93LmFudGVubmEgfHwgd2luZG93LkFudGVubmFBcHApIHtcbiAgICAvLyBQcm90ZWN0IGFnYWluc3QgbXVsdGlwbGUgaW5zdGFuY2VzIG9mIHRoaXMgc2NyaXB0IGJlaW5nIGFkZGVkIHRvIHRoZSBwYWdlIChvciB0aGlzIHNjcmlwdCBhbmQgZW5nYWdlLmpzKVxuICAgIHJldHVybjtcbn1cbmlmICghd2luZG93Lk11dGF0aW9uT2JzZXJ2ZXIgfHwgIUVsZW1lbnQucHJvdG90eXBlLmFkZEV2ZW50TGlzdGVuZXIgfHwgISgnY2xhc3NMaXN0JyBpbiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSkpIHtcbiAgICAvLyBCYWlsIG91dCBvbiBsZWdhY3kgYnJvd3NlcnMuXG4gICAgcmV0dXJuO1xufVxuXG52YXIgU2NyaXB0TG9hZGVyID0gcmVxdWlyZSgnLi9zY3JpcHQtbG9hZGVyJyk7XG52YXIgQ3NzTG9hZGVyID0gcmVxdWlyZSgnLi9jc3MtbG9hZGVyJyk7XG52YXIgR3JvdXBTZXR0aW5nc0xvYWRlciA9IHJlcXVpcmUoJy4vZ3JvdXAtc2V0dGluZ3MtbG9hZGVyJyk7XG52YXIgVGFwSGVscGVyID0gcmVxdWlyZSgnLi90YXAtaGVscGVyJyk7XG52YXIgUGFnZURhdGFMb2FkZXIgPSByZXF1aXJlKCcuL3BhZ2UtZGF0YS1sb2FkZXInKTtcbnZhciBQYWdlU2Nhbm5lciA9IHJlcXVpcmUoJy4vcGFnZS1zY2FubmVyJyk7XG52YXIgUmVpbml0aWFsaXplciA9IHJlcXVpcmUoJy4vcmVpbml0aWFsaXplcicpO1xudmFyIFhETUFuYWx5dGljcyA9IHJlcXVpcmUoJy4veGRtLWFuYWx5dGljcycpO1xudmFyIEJyb3dzZXJNZXRyaWNzID0gcmVxdWlyZSgnLi91dGlscy9icm93c2VyLW1ldHJpY3MnKTtcbnZhciBYRE1Mb2FkZXIgPSByZXF1aXJlKCcuL3V0aWxzL3hkbS1sb2FkZXInKTtcblxud2luZG93LkFudGVubmFBcHAgPSB7IC8vIFRPRE8gZmxlc2ggb3V0IG91ciBkZXNpcmVkIEFQSVxuICAgIHJlaW5pdGlhbGl6ZTogUmVpbml0aWFsaXplci5yZWluaXRpYWxpemVBbGxcbiAgICAvLyB0ZWFyZG93bj9cbiAgICAvLyB0cmFjZT9cbiAgICAvLyBkZWJ1Zz9cbiAgICAvLyBwYWdlZGF0YT9cbiAgICAvLyBncm91cHNldHRpbmdzP1xuICAgIC8vIG5lZWQgdG8gbWFrZSBzdXJlIG90aGVycyAoZS5nLiBtYWxpY2lvdXMgc2NyaXB0cykgY2FuJ3Qgd3JpdGUgZGF0YVxufTtcblxuLy8gU3RlcCAxIC0ga2ljayBvZmYgdGhlIGFzeW5jaHJvbm91cyBsb2FkaW5nIG9mIHRoZSBKYXZhc2NyaXB0IGFuZCBDU1Mgd2UgbmVlZC5cbkNzc0xvYWRlci5sb2FkKCk7IC8vIEluamVjdCB0aGUgQ1NTIGZpcnN0IGJlY2F1c2Ugd2UgbWF5IHNvb24gYXBwZW5kIG1vcmUgYXN5bmNocm9ub3VzbHksIGluIHRoZSBncm91cFNldHRpbmdzIGNhbGxiYWNrLCBhbmQgd2Ugd2FudCB0aGF0IENTUyB0byBiZSBsb3dlciBpbiB0aGUgZG9jdW1lbnQuXG5TY3JpcHRMb2FkZXIubG9hZChzY3JpcHRMb2FkZWQpO1xuXG5mdW5jdGlvbiBzY3JpcHRMb2FkZWQoKSB7XG4gICAgLy8gU3RlcCAyIC0gT25jZSB3ZSBoYXZlIG91ciByZXF1aXJlZCBzY3JpcHRzLCBmZXRjaCB0aGUgZ3JvdXAgc2V0dGluZ3MgZnJvbSB0aGUgc2VydmVyXG4gICAgR3JvdXBTZXR0aW5nc0xvYWRlci5sb2FkKGZ1bmN0aW9uKGdyb3VwU2V0dGluZ3MpIHtcbiAgICAgICAgaWYgKGdyb3VwU2V0dGluZ3MuaXNIaWRlT25Nb2JpbGUoKSAmJiBCcm93c2VyTWV0cmljcy5pc01vYmlsZSgpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgLy8gU3RlcCAzIC0gT25jZSB3ZSBoYXZlIHRoZSBzZXR0aW5ncywgd2UgY2FuIGtpY2sgb2ZmIGEgY291cGxlIHRoaW5ncyBpbiBwYXJhbGxlbDpcbiAgICAgICAgLy9cbiAgICAgICAgLy8gLS0gaW5qZWN0IGFueSBjdXN0b20gQ1NTIGZyb20gdGhlIGdyb3VwIHNldHRpbmdzXG4gICAgICAgIC8vIC0tIGNyZWF0ZSB0aGUgaGlkZGVuIGlmcmFtZSB3ZSB1c2UgZm9yIGNyb3NzLWRvbWFpbiBjb29raWVzIChwcmltYXJpbHkgdXNlciBsb2dpbilcbiAgICAgICAgLy8gLS0gc3RhcnQgZmV0Y2hpbmcgdGhlIHBhZ2UgZGF0YVxuICAgICAgICAvLyAtLSBzdGFydCBoYXNoaW5nIHRoZSBwYWdlIGFuZCBpbnNlcnRpbmcgdGhlIGFmZm9yZGFuY2VzIChpbiB0aGUgZW1wdHkgc3RhdGUpXG4gICAgICAgIC8vXG4gICAgICAgIC8vIEFzIHRoZSBwYWdlIGlzIHNjYW5uZWQsIHRoZSB3aWRnZXRzIGFyZSBjcmVhdGVkIGFuZCBib3VuZCB0byB0aGUgcGFnZSBkYXRhIHRoYXQgY29tZXMgaW4uXG4gICAgICAgIGluaXRDdXN0b21DU1MoZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIGluaXRYZG1GcmFtZShncm91cFNldHRpbmdzKTtcbiAgICAgICAgZmV0Y2hQYWdlRGF0YShncm91cFNldHRpbmdzKTtcbiAgICAgICAgc2NhblBhZ2UoZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIHNldHVwTW9iaWxlSGVscGVyKGdyb3VwU2V0dGluZ3MpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBpbml0Q3VzdG9tQ1NTKGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgY3VzdG9tQ1NTID0gZ3JvdXBTZXR0aW5ncy5jdXN0b21DU1MoKTtcbiAgICBpZiAoY3VzdG9tQ1NTKSB7XG4gICAgICAgIENzc0xvYWRlci5pbmplY3QoY3VzdG9tQ1NTKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGluaXRYZG1GcmFtZShncm91cFNldHRpbmdzKSB7XG4gICAgWERNQW5hbHl0aWNzLnN0YXJ0KCk7XG4gICAgWERNTG9hZGVyLmNyZWF0ZVhETWZyYW1lKGdyb3VwU2V0dGluZ3MuZ3JvdXBJZCgpKTtcbn1cblxuZnVuY3Rpb24gZmV0Y2hQYWdlRGF0YShncm91cFNldHRpbmdzKSB7XG4gICAgUGFnZURhdGFMb2FkZXIubG9hZChncm91cFNldHRpbmdzKTtcbn1cblxuZnVuY3Rpb24gc2NhblBhZ2UoZ3JvdXBTZXR0aW5ncykge1xuICAgIFBhZ2VTY2FubmVyLnNjYW4oZ3JvdXBTZXR0aW5ncywgUmVpbml0aWFsaXplci5yZWluaXRpYWxpemUpO1xufVxuXG5mdW5jdGlvbiBzZXR1cE1vYmlsZUhlbHBlcihncm91cFNldHRpbmdzKSB7XG4gICAgVGFwSGVscGVyLnNldHVwSGVscGVyKGdyb3VwU2V0dGluZ3MpO1xufSIsInZhciAkOyByZXF1aXJlKCcuL3V0aWxzL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIEJyb3dzZXJNZXRyaWNzID0gcmVxdWlyZSgnLi91dGlscy9icm93c2VyLW1ldHJpY3MnKTtcbnZhciBSYWN0aXZlOyByZXF1aXJlKCcuL3V0aWxzL3JhY3RpdmUtcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24obG9hZGVkUmFjdGl2ZSkgeyBSYWN0aXZlPWxvYWRlZFJhY3RpdmU7IH0pO1xudmFyIFNWR3MgPSByZXF1aXJlKCcuL3N2Z3MnKTtcblxuZnVuY3Rpb24gY3JlYXRlQ2FsbFRvQWN0aW9uKGFudEl0ZW1JZCwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgcmFjdGl2ZSA9IFJhY3RpdmUoe1xuICAgICAgICBlbDogJCgnPGRpdj4nKSxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgYW50SXRlbUlkOiBhbnRJdGVtSWQsXG4gICAgICAgICAgICBleHBhbmRSZWFjdGlvbnM6IHNob3VsZEV4cGFuZFJlYWN0aW9ucyhncm91cFNldHRpbmdzKVxuICAgICAgICB9LFxuICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL2F1dG8tY2FsbC10by1hY3Rpb24uaGJzLmh0bWwnKSxcbiAgICAgICAgcGFydGlhbHM6IHtcbiAgICAgICAgICAgIGxvZ286IFNWR3MubG9nb1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZWxlbWVudDogJChyYWN0aXZlLmZpbmQoJy5hbnRlbm5hLWF1dG8tY3RhJykpLFxuICAgICAgICB0ZWFyZG93bjogZnVuY3Rpb24oKSB7IHJhY3RpdmUudGVhcmRvd24oKTsgfVxuICAgIH07XG59XG5cbmZ1bmN0aW9uIHNob3VsZEV4cGFuZFJlYWN0aW9ucyhncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIHNldHRpbmcgPSBncm91cFNldHRpbmdzLmdlbmVyYXRlZEN0YUV4cGFuZGVkKCk7IC8vIFZhbHVlcyBhcmUgJ25vbmUnLCAnYm90aCcsICdkZXNrdG9wJywgYW5kICdtb2JpbGUnXG4gICAgcmV0dXJuIHNldHRpbmcgPT09ICdib3RoJyB8fFxuICAgICAgICAoc2V0dGluZyA9PT0gJ2Rlc2t0b3AnICYmICFCcm93c2VyTWV0cmljcy5pc01vYmlsZSgpKSB8fFxuICAgICAgICAoc2V0dGluZyA9PT0gJ21vYmlsZScgJiYgQnJvd3Nlck1ldHJpY3MuaXNNb2JpbGUoKSk7XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGU6IGNyZWF0ZUNhbGxUb0FjdGlvblxufTsiLCJ2YXIgUmFjdGl2ZTsgcmVxdWlyZSgnLi91dGlscy9yYWN0aXZlLXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGxvYWRlZFJhY3RpdmUpIHsgUmFjdGl2ZSA9IGxvYWRlZFJhY3RpdmU7fSk7XG52YXIgU1ZHcyA9IHJlcXVpcmUoJy4vc3ZncycpO1xuXG52YXIgcGFnZVNlbGVjdG9yID0gJy5hbnRlbm5hLWJsb2NrZWQtcGFnZSc7XG5cbmZ1bmN0aW9uIGNyZWF0ZVBhZ2Uob3B0aW9ucykge1xuICAgIHZhciBnb0JhY2sgPSBvcHRpb25zLmdvQmFjaztcbiAgICB2YXIgZWxlbWVudCA9IG9wdGlvbnMuZWxlbWVudDtcbiAgICB2YXIgcmFjdGl2ZSA9IFJhY3RpdmUoe1xuICAgICAgICBlbDogZWxlbWVudCxcbiAgICAgICAgYXBwZW5kOiB0cnVlLFxuICAgICAgICBkYXRhOiB7fSxcbiAgICAgICAgdGVtcGxhdGU6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9ibG9ja2VkLXJlYWN0aW9uLXBhZ2UuaGJzLmh0bWwnKSxcbiAgICAgICAgcGFydGlhbHM6IHtcbiAgICAgICAgICAgIGxlZnQ6IFNWR3MubGVmdFxuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmFjdGl2ZS5vbignYmFjaycsIGdvQmFjayk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgc2VsZWN0b3I6IHBhZ2VTZWxlY3RvcixcbiAgICAgICAgdGVhcmRvd246IGZ1bmN0aW9uKCkgeyByYWN0aXZlLnRlYXJkb3duKCk7IH1cbiAgICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGVQYWdlOiBjcmVhdGVQYWdlXG59OyIsInZhciBSYWN0aXZlOyByZXF1aXJlKCcuL3V0aWxzL3JhY3RpdmUtcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24obG9hZGVkUmFjdGl2ZSkgeyBSYWN0aXZlID0gbG9hZGVkUmFjdGl2ZTt9KTtcblxuZnVuY3Rpb24gY3JlYXRlQ291bnQoJGNvdW50RWxlbWVudCwgY29udGFpbmVyRGF0YSkge1xuICAgIHZhciByYWN0aXZlID0gUmFjdGl2ZSh7XG4gICAgICAgIGVsOiAkY291bnRFbGVtZW50LFxuICAgICAgICBtYWdpYzogdHJ1ZSxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgY29udGFpbmVyRGF0YTogY29udGFpbmVyRGF0YVxuICAgICAgICB9LFxuICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL2NhbGwtdG8tYWN0aW9uLWNvdW50ZXIuaGJzLmh0bWwnKVxuICAgIH0pO1xuICAgIHJldHVybiB7XG4gICAgICAgIHRlYXJkb3duOiBmdW5jdGlvbigpIHsgcmFjdGl2ZS50ZWFyZG93bigpOyB9XG4gICAgfTtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZTogY3JlYXRlQ291bnRcbn07IiwidmFyIFJhY3RpdmU7IHJlcXVpcmUoJy4vdXRpbHMvcmFjdGl2ZS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihsb2FkZWRSYWN0aXZlKSB7IFJhY3RpdmUgPSBsb2FkZWRSYWN0aXZlO30pO1xuXG5mdW5jdGlvbiBjcmVhdGVFeHBhbmRlZFJlYWN0aW9ucygkZXhwYW5kZWRSZWFjdGlvbnNFbGVtZW50LCAkY29udGFpbmVyRWxlbWVudCwgY29udGFpbmVyRGF0YSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBjb250YWluZXJFbGVtZW50ID0gJGNvbnRhaW5lckVsZW1lbnQuZ2V0KDApO1xuICAgIHZhciByYWN0aXZlID0gUmFjdGl2ZSh7XG4gICAgICAgIGVsOiAkZXhwYW5kZWRSZWFjdGlvbnNFbGVtZW50LFxuICAgICAgICBtYWdpYzogdHJ1ZSxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgY29udGFpbmVyRGF0YTogY29udGFpbmVyRGF0YSxcbiAgICAgICAgICAgIGNvbXB1dGVFeHBhbmRlZFJlYWN0aW9uczogY29tcHV0ZUV4cGFuZGVkUmVhY3Rpb25zKGdyb3VwU2V0dGluZ3MuZGVmYXVsdFJlYWN0aW9ucyhjb250YWluZXJFbGVtZW50KSlcbiAgICAgICAgfSxcbiAgICAgICAgdGVtcGxhdGU6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9jYWxsLXRvLWFjdGlvbi1leHBhbmRlZC1yZWFjdGlvbnMuaGJzLmh0bWwnKVxuICAgIH0pO1xuICAgIHJldHVybiB7XG4gICAgICAgIHRlYXJkb3duOiBmdW5jdGlvbigpIHsgcmFjdGl2ZS50ZWFyZG93bigpOyB9XG4gICAgfTtcbn1cblxuZnVuY3Rpb24gY29tcHV0ZUV4cGFuZGVkUmVhY3Rpb25zKGRlZmF1bHRSZWFjdGlvbnMpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24ocmVhY3Rpb25zRGF0YSkge1xuICAgICAgICB2YXIgbWF4ID0gMjtcbiAgICAgICAgdmFyIGV4cGFuZGVkUmVhY3Rpb25zID0gW107XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmVhY3Rpb25zRGF0YS5sZW5ndGggJiYgZXhwYW5kZWRSZWFjdGlvbnMubGVuZ3RoIDwgbWF4OyBpKyspIHtcbiAgICAgICAgICAgIHZhciByZWFjdGlvbkRhdGEgPSByZWFjdGlvbnNEYXRhW2ldO1xuICAgICAgICAgICAgaWYgKGlzRGVmYXVsdFJlYWN0aW9uKHJlYWN0aW9uRGF0YSwgZGVmYXVsdFJlYWN0aW9ucykpIHtcbiAgICAgICAgICAgICAgICBleHBhbmRlZFJlYWN0aW9ucy5wdXNoKHJlYWN0aW9uRGF0YSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGV4cGFuZGVkUmVhY3Rpb25zO1xuICAgIH07XG59XG5cbmZ1bmN0aW9uIGlzRGVmYXVsdFJlYWN0aW9uKHJlYWN0aW9uRGF0YSwgZGVmYXVsdFJlYWN0aW9ucykge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGVmYXVsdFJlYWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoZGVmYXVsdFJlYWN0aW9uc1tpXS50ZXh0ID09PSByZWFjdGlvbkRhdGEudGV4dCkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlOiBjcmVhdGVFeHBhbmRlZFJlYWN0aW9uc1xufTsiLCJ2YXIgQ2FsbFRvQWN0aW9uQ291bnRlciA9IHJlcXVpcmUoJy4vY2FsbC10by1hY3Rpb24tY291bnRlcicpO1xudmFyIENhbGxUb0FjdGlvbkV4cGFuZGVkUmVhY3Rpb25zID0gcmVxdWlyZSgnLi9jYWxsLXRvLWFjdGlvbi1leHBhbmRlZC1yZWFjdGlvbnMnKTtcbnZhciBDYWxsVG9BY3Rpb25MYWJlbCA9IHJlcXVpcmUoJy4vY2FsbC10by1hY3Rpb24tbGFiZWwnKTtcbnZhciBSZWFjdGlvbnNXaWRnZXQgPSByZXF1aXJlKCcuL3JlYWN0aW9ucy13aWRnZXQnKTtcbnZhciBUb3VjaFN1cHBvcnQgPSByZXF1aXJlKCcuL3V0aWxzL3RvdWNoLXN1cHBvcnQnKTtcblxuXG5mdW5jdGlvbiBjcmVhdGVJbmRpY2F0b3JXaWRnZXQob3B0aW9ucykge1xuICAgIHZhciBjb250YWluZXJEYXRhID0gb3B0aW9ucy5jb250YWluZXJEYXRhO1xuICAgIHZhciAkY29udGFpbmVyRWxlbWVudCA9IG9wdGlvbnMuY29udGFpbmVyRWxlbWVudDtcbiAgICB2YXIgY29udGVudERhdGEgPSBvcHRpb25zLmNvbnRlbnREYXRhO1xuICAgIHZhciAkY3RhRWxlbWVudCA9IG9wdGlvbnMuY3RhRWxlbWVudDtcbiAgICB2YXIgJGN0YUxhYmVscyA9IG9wdGlvbnMuY3RhTGFiZWxzOyAvLyBvcHRpb25hbFxuICAgIHZhciAkY3RhQ291bnRlcnMgPSBvcHRpb25zLmN0YUNvdW50ZXJzOyAvLyBvcHRpb25hbFxuICAgIHZhciAkY3RhRXhwYW5kZWRSZWFjdGlvbnMgPSBvcHRpb25zLmN0YUV4cGFuZGVkUmVhY3Rpb25zOyAvLyBvcHRpb25hbFxuICAgIHZhciBwYWdlRGF0YSA9IG9wdGlvbnMucGFnZURhdGE7XG4gICAgdmFyIGdyb3VwU2V0dGluZ3MgPSBvcHRpb25zLmdyb3VwU2V0dGluZ3M7XG4gICAgdmFyIGRlZmF1bHRSZWFjdGlvbnMgPSBvcHRpb25zLmRlZmF1bHRSZWFjdGlvbnM7XG5cbiAgICB2YXIgcmVhY3Rpb25XaWRnZXRPcHRpb25zID0ge1xuICAgICAgICByZWFjdGlvbnNEYXRhOiBjb250YWluZXJEYXRhLnJlYWN0aW9ucyxcbiAgICAgICAgY29udGFpbmVyRGF0YTogY29udGFpbmVyRGF0YSxcbiAgICAgICAgY29udGFpbmVyRWxlbWVudDogJGNvbnRhaW5lckVsZW1lbnQsXG4gICAgICAgIGNvbnRlbnREYXRhOiBjb250ZW50RGF0YSxcbiAgICAgICAgZGVmYXVsdFJlYWN0aW9uczogZGVmYXVsdFJlYWN0aW9ucyxcbiAgICAgICAgcGFnZURhdGE6IHBhZ2VEYXRhLFxuICAgICAgICBncm91cFNldHRpbmdzOiBncm91cFNldHRpbmdzXG4gICAgfTtcblxuICAgIFRvdWNoU3VwcG9ydC5zZXR1cFRhcCgkY3RhRWxlbWVudC5nZXQoMCksIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBvcGVuUmVhY3Rpb25zV2luZG93KHJlYWN0aW9uV2lkZ2V0T3B0aW9ucywgJGN0YUVsZW1lbnQpO1xuICAgIH0pO1xuICAgICRjdGFFbGVtZW50Lm9uKCdtb3VzZWVudGVyLmFudGVubmEnLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBpZiAoZXZlbnQuYnV0dG9ucyA+IDAgfHwgKGV2ZW50LmJ1dHRvbnMgPT0gdW5kZWZpbmVkICYmIGV2ZW50LndoaWNoID4gMCkpIHsgLy8gT24gU2FmYXJpLCBldmVudC5idXR0b25zIGlzIHVuZGVmaW5lZCBidXQgZXZlbnQud2hpY2ggZ2l2ZXMgYSBnb29kIHZhbHVlLiBldmVudC53aGljaCBpcyBiYWQgb24gRkZcbiAgICAgICAgICAgIC8vIERvbid0IHJlYWN0IGlmIHRoZSB1c2VyIGlzIGRyYWdnaW5nIG9yIHNlbGVjdGluZyB0ZXh0LlxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIG9wZW5SZWFjdGlvbnNXaW5kb3cocmVhY3Rpb25XaWRnZXRPcHRpb25zLCAkY3RhRWxlbWVudCk7XG4gICAgfSk7XG5cbiAgICB2YXIgY3JlYXRlZFdpZGdldHMgPSBbXTtcblxuICAgIGlmICgkY3RhTGFiZWxzKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgJGN0YUxhYmVscy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY3JlYXRlZFdpZGdldHMucHVzaChDYWxsVG9BY3Rpb25MYWJlbC5jcmVhdGUoJGN0YUxhYmVsc1tpXSwgY29udGFpbmVyRGF0YSkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCRjdGFDb3VudGVycykge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8ICRjdGFDb3VudGVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY3JlYXRlZFdpZGdldHMucHVzaChDYWxsVG9BY3Rpb25Db3VudGVyLmNyZWF0ZSgkY3RhQ291bnRlcnNbaV0sIGNvbnRhaW5lckRhdGEpKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmICgkY3RhRXhwYW5kZWRSZWFjdGlvbnMpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAkY3RhRXhwYW5kZWRSZWFjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNyZWF0ZWRXaWRnZXRzLnB1c2goQ2FsbFRvQWN0aW9uRXhwYW5kZWRSZWFjdGlvbnMuY3JlYXRlKCRjdGFFeHBhbmRlZFJlYWN0aW9uc1tpXSwgJGNvbnRhaW5lckVsZW1lbnQsIGNvbnRhaW5lckRhdGEsIGdyb3VwU2V0dGluZ3MpKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIHRlYXJkb3duOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICRjdGFFbGVtZW50Lm9mZignLmFudGVubmEnKTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY3JlYXRlZFdpZGdldHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjcmVhdGVkV2lkZ2V0c1tpXS50ZWFyZG93bigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBvcGVuUmVhY3Rpb25zV2luZG93KHJlYWN0aW9uT3B0aW9ucywgJGN0YUVsZW1lbnQpIHtcbiAgICBSZWFjdGlvbnNXaWRnZXQub3BlbihyZWFjdGlvbk9wdGlvbnMsICRjdGFFbGVtZW50KTtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZTogY3JlYXRlSW5kaWNhdG9yV2lkZ2V0XG59OyIsInZhciBSYWN0aXZlOyByZXF1aXJlKCcuL3V0aWxzL3JhY3RpdmUtcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24obG9hZGVkUmFjdGl2ZSkgeyBSYWN0aXZlID0gbG9hZGVkUmFjdGl2ZTt9KTtcblxuZnVuY3Rpb24gY3JlYXRlTGFiZWwoJGxhYmVsRWxlbWVudCwgY29udGFpbmVyRGF0YSkge1xuICAgIHZhciByYWN0aXZlID0gUmFjdGl2ZSh7XG4gICAgICAgIGVsOiAkbGFiZWxFbGVtZW50LCAvLyBUT0RPOiByZXZpZXcgdGhlIHN0cnVjdHVyZSBvZiB0aGUgRE9NIGhlcmUuIERvIHdlIHdhbnQgdG8gcmVuZGVyIGFuIGVsZW1lbnQgaW50byAkY3RhTGFiZWwgb3IganVzdCB0ZXh0P1xuICAgICAgICBtYWdpYzogdHJ1ZSxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgY29udGFpbmVyRGF0YTogY29udGFpbmVyRGF0YVxuICAgICAgICB9LFxuICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL2NhbGwtdG8tYWN0aW9uLWxhYmVsLmhicy5odG1sJylcbiAgICB9KTtcbiAgICByZXR1cm4ge1xuICAgICAgICB0ZWFyZG93bjogZnVuY3Rpb24oKSB7IHJhY3RpdmUudGVhcmRvd24oKTsgfVxuICAgIH1cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZTogY3JlYXRlTGFiZWxcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgUmFjdGl2ZTsgcmVxdWlyZSgnLi91dGlscy9yYWN0aXZlLXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGxvYWRlZFJhY3RpdmUpIHsgUmFjdGl2ZSA9IGxvYWRlZFJhY3RpdmU7fSk7XG52YXIgQWpheENsaWVudCA9IHJlcXVpcmUoJy4vdXRpbHMvYWpheC1jbGllbnQnKTtcbnZhciBVUkxzID0gcmVxdWlyZSgnLi91dGlscy91cmxzJyk7XG52YXIgRXZlbnRzID0gcmVxdWlyZSgnLi9ldmVudHMnKTtcbnZhciBTVkdzID0gcmVxdWlyZSgnLi9zdmdzJyk7XG5cbnZhciBwYWdlU2VsZWN0b3IgPSAnLmFudGVubmEtY29uZmlybWF0aW9uLXBhZ2UnO1xuXG5mdW5jdGlvbiBjcmVhdGVQYWdlKHJlYWN0aW9uVGV4dCwgcmVhY3Rpb25Qcm92aWRlciwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MsIGVsZW1lbnQpIHtcbiAgICB2YXIgcG9wdXBXaW5kb3c7XG4gICAgdmFyIHJhY3RpdmUgPSBSYWN0aXZlKHtcbiAgICAgICAgZWw6IGVsZW1lbnQsXG4gICAgICAgIGFwcGVuZDogdHJ1ZSxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgdGV4dDogcmVhY3Rpb25UZXh0XG4gICAgICAgIH0sXG4gICAgICAgIHRlbXBsYXRlOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvY29uZmlybWF0aW9uLXBhZ2UuaGJzLmh0bWwnKSxcbiAgICAgICAgcGFydGlhbHM6IHtcbiAgICAgICAgICAgIGZhY2Vib29rSWNvbjogU1ZHcy5mYWNlYm9vayxcbiAgICAgICAgICAgIHR3aXR0ZXJJY29uOiBTVkdzLnR3aXR0ZXJcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJhY3RpdmUub24oJ3NoYXJlLWZhY2Vib29rJywgc2hhcmVUb0ZhY2Vib29rKTtcbiAgICByYWN0aXZlLm9uKCdzaGFyZS10d2l0dGVyJywgc2hhcmVUb1R3aXR0ZXIpO1xuICAgIHJldHVybiB7XG4gICAgICAgIHNlbGVjdG9yOiBwYWdlU2VsZWN0b3IsXG4gICAgICAgIHRlYXJkb3duOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNsb3NlU2hhcmVXaW5kb3coKTtcbiAgICAgICAgICAgIHJhY3RpdmUudGVhcmRvd24oKTtcbiAgICAgICAgfVxuICAgIH07XG5cblxuICAgIGZ1bmN0aW9uIHNoYXJlVG9GYWNlYm9vayhyYWN0aXZlRXZlbnQpIHtcbiAgICAgICAgcmFjdGl2ZUV2ZW50Lm9yaWdpbmFsLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHNoYXJlUmVhY3Rpb24oZnVuY3Rpb24ocmVhY3Rpb25EYXRhLCBzaG9ydFVybCkge1xuICAgICAgICAgICAgRXZlbnRzLnBvc3RSZWFjdGlvblNoYXJlZCgnZmFjZWJvb2snLCBwYWdlRGF0YSwgY29udGFpbmVyRGF0YSwgcmVhY3Rpb25EYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgIHZhciBzaGFyZVRleHQgPSBjb21wdXRlU2hhcmVUZXh0KHJlYWN0aW9uRGF0YSwgMzAwKTtcbiAgICAgICAgICAgIHZhciBpbWFnZVBhcmFtID0gJyc7XG4gICAgICAgICAgICBpZiAoY29udGFpbmVyRGF0YS50eXBlID09PSAnaW1hZ2UnKSB7XG4gICAgICAgICAgICAgICAgaW1hZ2VQYXJhbSA9ICcmcFtpbWFnZXNdWzBdPScgKyBlbmNvZGVVUkkocmVhY3Rpb25EYXRhLmNvbnRlbnQuYm9keSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gJ2h0dHA6Ly93d3cuZmFjZWJvb2suY29tL3NoYXJlci5waHA/cz0xMDAnICtcbiAgICAgICAgICAgICAgICAnJnBbdXJsXT0nICsgc2hvcnRVcmwgK1xuICAgICAgICAgICAgICAgICcmcFt0aXRsZV09JyArIGVuY29kZVVSSShzaGFyZVRleHQpICtcbiAgICAgICAgICAgICAgICAnJnBbc3VtbWFyeV09JyArIGVuY29kZVVSSShzaGFyZVRleHQpICtcbiAgICAgICAgICAgICAgICBpbWFnZVBhcmFtO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzaGFyZVRvVHdpdHRlcihyYWN0aXZlRXZlbnQpIHtcbiAgICAgICAgcmFjdGl2ZUV2ZW50Lm9yaWdpbmFsLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHNoYXJlUmVhY3Rpb24oZnVuY3Rpb24ocmVhY3Rpb25EYXRhLCBzaG9ydFVybCkge1xuICAgICAgICAgICAgRXZlbnRzLnBvc3RSZWFjdGlvblNoYXJlZCgndHdpdHRlcicsIHBhZ2VEYXRhLCBjb250YWluZXJEYXRhLCByZWFjdGlvbkRhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgdmFyIHNoYXJlVGV4dCA9IGNvbXB1dGVTaGFyZVRleHQocmVhY3Rpb25EYXRhLCAxMTApOyAvLyBNYWtlIHN1cmUgd2Ugc3RheSB1bmRlciB0aGUgMTQwIGNoYXIgbGltaXQgKHR3aXR0ZXIgYXBwZW5kcyBhZGRpdGlvbmFsIHRleHQgbGlrZSB0aGUgdXJsKVxuICAgICAgICAgICAgdmFyIHR3aXR0ZXJWaWEgPSBncm91cFNldHRpbmdzLnR3aXR0ZXJBY2NvdW50KCkgPyAnJnZpYT0nICsgZ3JvdXBTZXR0aW5ncy50d2l0dGVyQWNjb3VudCgpIDogJyc7XG4gICAgICAgICAgICByZXR1cm4gJ2h0dHA6Ly90d2l0dGVyLmNvbS9pbnRlbnQvdHdlZXQ/dXJsPScgKyBzaG9ydFVybCArIHR3aXR0ZXJWaWEgKyAnJnRleHQ9JyArIGVuY29kZVVSSShzaGFyZVRleHQpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzaGFyZVJlYWN0aW9uKGNvbXB1dGVXaW5kb3dMb2NhdGlvbikge1xuICAgICAgICBjbG9zZVNoYXJlV2luZG93KCk7XG4gICAgICAgIHJlYWN0aW9uUHJvdmlkZXIuZ2V0KGZ1bmN0aW9uKHJlYWN0aW9uRGF0YSkge1xuICAgICAgICAgICAgdmFyIHdpbmRvdyA9IG9wZW5TaGFyZVdpbmRvdygpO1xuICAgICAgICAgICAgaWYgKHdpbmRvdykge1xuICAgICAgICAgICAgICAgIEFqYXhDbGllbnQucG9zdFNoYXJlUmVhY3Rpb24ocmVhY3Rpb25EYXRhLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncywgZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB1cmwgPSBjb21wdXRlV2luZG93TG9jYXRpb24ocmVhY3Rpb25EYXRhLCByZXNwb25zZS5zaG9ydF91cmwpO1xuICAgICAgICAgICAgICAgICAgICByZWRpcmVjdFNoYXJlV2luZG93KHVybCk7XG4gICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKG1lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJGYWlsZWQgdG8gc2hhcmUgcmVhY3Rpb246IFwiICsgbWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgICAgIGNsb3NlU2hhcmVXaW5kb3coKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogZW5nYWdlX2Z1bGw6OTgxOFxuICAgICAgICAgICAgICAgICAgICAvL2lmICggcmVzcG9uc2UubWVzc2FnZS5pbmRleE9mKCBcIlRlbXBvcmFyeSB1c2VyIGludGVyYWN0aW9uIGxpbWl0IHJlYWNoZWRcIiApICE9IC0xICkge1xuICAgICAgICAgICAgICAgICAgICAvLyAgICBBTlQuc2Vzc2lvbi5zaG93TG9naW5QYW5lbCggYXJncyApO1xuICAgICAgICAgICAgICAgICAgICAvL30gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vICAgIC8vIGlmIGl0IGZhaWxlZCwgc2VlIGlmIHdlIGNhbiBmaXggaXQsIGFuZCBpZiBzbywgdHJ5IHRoaXMgZnVuY3Rpb24gb25lIG1vcmUgdGltZVxuICAgICAgICAgICAgICAgICAgICAvLyAgICBBTlQuc2Vzc2lvbi5oYW5kbGVHZXRVc2VyRmFpbCggYXJncywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vICAgICAgICBBTlQuYWN0aW9ucy5zaGFyZV9nZXRMaW5rKCBhcmdzICk7XG4gICAgICAgICAgICAgICAgICAgIC8vICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAvL31cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY2xvc2VTaGFyZVdpbmRvdygpIHtcbiAgICAgICAgaWYgKHBvcHVwV2luZG93ICYmICFwb3B1cFdpbmRvdy5jbG9zZWQpIHtcbiAgICAgICAgICAgIHBvcHVwV2luZG93LmNsb3NlKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBvcGVuU2hhcmVXaW5kb3coKSB7XG4gICAgICAgIHBvcHVwV2luZG93ID0gd2luZG93Lm9wZW4oVVJMcy5hcHBTZXJ2ZXJVcmwoKSArIFVSTHMuc2hhcmVXaW5kb3dVcmwoKSwgJ2FudGVubmFfc2hhcmVfd2luZG93JywnbWVudWJhcj0xLHJlc2l6YWJsZT0xLHdpZHRoPTYyNixoZWlnaHQ9NDM2Jyk7XG4gICAgICAgIHJldHVybiBwb3B1cFdpbmRvdztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByZWRpcmVjdFNoYXJlV2luZG93KHVybCkge1xuICAgICAgICBpZiAocG9wdXBXaW5kb3cgJiYgIXBvcHVwV2luZG93LmNsb3NlZCkge1xuICAgICAgICAgICAgcG9wdXBXaW5kb3cubG9jYXRpb24gPSB1cmw7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjb21wdXRlU2hhcmVUZXh0KHJlYWN0aW9uRGF0YSwgbWF4VGV4dExlbmd0aCkge1xuICAgICAgICB2YXIgc2hhcmVUZXh0ID0gcmVhY3Rpb25EYXRhLnRleHQgKyBcIiDCuyBcIiArICcnO1xuICAgICAgICB2YXIgZ3JvdXBOYW1lID0gZ3JvdXBTZXR0aW5ncy5ncm91cE5hbWUoKTtcbiAgICAgICAgc3dpdGNoIChjb250YWluZXJEYXRhLnR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgJ2ltYWdlJzpcbiAgICAgICAgICAgICAgICBzaGFyZVRleHQgKz0gJ1thIHBpY3R1cmUgb24gJyArIGdyb3VwTmFtZSArICddIENoZWNrIGl0IG91dDogJztcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ21lZGlhJzpcbiAgICAgICAgICAgICAgICBzaGFyZVRleHQgKz0gJ1thIHZpZGVvIG9uICcgKyBncm91cE5hbWUgKyAnXSBDaGVjayBpdCBvdXQ6ICc7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdwYWdlJzpcbiAgICAgICAgICAgICAgICBzaGFyZVRleHQgKz0gJ1thbiBhcnRpY2xlIG9uICcgKyBncm91cE5hbWUgKyAnXSBDaGVjayBpdCBvdXQ6ICc7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICd0ZXh0JzpcbiAgICAgICAgICAgICAgICB2YXIgbWF4Qm9keUxlbmd0aCA9IG1heFRleHRMZW5ndGggLSBzaGFyZVRleHQubGVuZ3RoIC0gMjsgLy8gdGhlIGV4dHJhIDIgYWNjb3VudHMgZm9yIHRoZSBxdW90ZXMgd2UgYWRkXG4gICAgICAgICAgICAgICAgdmFyIHRleHRCb2R5ID0gcmVhY3Rpb25EYXRhLmNvbnRlbnQuYm9keTtcbiAgICAgICAgICAgICAgICB0ZXh0Qm9keSA9IHRleHRCb2R5Lmxlbmd0aCA+IG1heEJvZHlMZW5ndGggPyB0ZXh0Qm9keS5zdWJzdHJpbmcoMCwgbWF4Qm9keUxlbmd0aC0zKSArICcuLi4nIDogdGV4dEJvZHk7XG4gICAgICAgICAgICAgICAgc2hhcmVUZXh0ICs9ICdcIicgKyB0ZXh0Qm9keSArICdcIic7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNoYXJlVGV4dDtcbiAgICB9XG5cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZTogY3JlYXRlUGFnZVxufTsiLCJ2YXIgQWpheENsaWVudCA9IHJlcXVpcmUoJy4vdXRpbHMvYWpheC1jbGllbnQnKTtcbnZhciBVUkxzID0gcmVxdWlyZSgnLi91dGlscy91cmxzJyk7XG5cbnZhciBjb250ZW50RmV0Y2hUcmlnZ2VyU2l6ZSA9IDA7IC8vIFRoZSBzaXplIG9mIHRoZSBwb29sIGF0IHdoaWNoIHdlJ2xsIHByb2FjdGl2ZWx5IGZldGNoIG1vcmUgY29udGVudC5cbnZhciBmcmVzaENvbnRlbnRQb29sID0gW107XG52YXIgcGVuZGluZ0NhbGxiYWNrcyA9IFtdOyAvLyBUaGUgY2FsbGJhY2sgbW9kZWwgaW4gdGhpcyBtb2R1bGUgaXMgdW51c3VhbCBiZWNhdXNlIG9mIHRoZSB3YXkgY29udGVudCBpcyBzZXJ2ZWQgZnJvbSBhIHBvb2wuXG52YXIgcHJlZmV0Y2hlZEdyb3VwcyA9IHt9OyAvL1xuXG5mdW5jdGlvbiBwcmVmZXRjaElmTmVlZGVkKGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgZ3JvdXBJZCA9IGdyb3VwU2V0dGluZ3MuZ3JvdXBJZCgpO1xuICAgIGlmICghcHJlZmV0Y2hlZEdyb3Vwc1tncm91cElkXSkge1xuICAgICAgICBwcmVmZXRjaGVkR3JvdXBzW2dyb3VwSWRdID0gdHJ1ZTtcbiAgICAgICAgZmV0Y2hSZWNvbW1lbmRlZENvbnRlbnQoZ3JvdXBTZXR0aW5ncyk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBnZXRSZWNvbW1lbmRlZENvbnRlbnQoY291bnQsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzLCBjYWxsYmFjaykge1xuICAgIGNvbnRlbnRGZXRjaFRyaWdnZXJTaXplID0gTWF0aC5tYXgoY29udGVudEZldGNoVHJpZ2dlclNpemUsIGNvdW50KTsgLy8gVXBkYXRlIHRoZSB0cmlnZ2VyIHNpemUgdG8gdGhlIG1vc3Qgd2UndmUgYmVlbiBhc2tlZCBmb3IuXG4gICAgLy8gUXVldWUgdXAgdGhlIGNhbGxiYWNrIGFuZCB0cnkgdG8gc2VydmUuIElmIG1vcmUgY29udGVudCBpcyBuZWVkZWQsIGl0IHdpbGxcbiAgICAvLyBiZSBhdXRvbWF0aWNhbGx5IGZldGNoZWQuXG4gICAgcGVuZGluZ0NhbGxiYWNrcy5wdXNoKHsgY2FsbGJhY2s6IGNhbGxiYWNrLCBjb3VudDogY291bnQgfSk7XG4gICAgc2VydmVDb250ZW50KHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbn1cblxuZnVuY3Rpb24gZmV0Y2hSZWNvbW1lbmRlZENvbnRlbnQoZ3JvdXBTZXR0aW5ncywgY2FsbGJhY2spIHtcbiAgICBBamF4Q2xpZW50LmdldEpTT05QKFVSTHMuZmV0Y2hDb250ZW50UmVjb21tZW5kYXRpb25VcmwoKSwgeyBncm91cF9pZDogZ3JvdXBTZXR0aW5ncy5ncm91cElkKCl9ICwgZnVuY3Rpb24oanNvbkRhdGEpIHtcbiAgICAgICAgLy8gVXBkYXRlIHRoZSBmcmVzaCBjb250ZW50IHBvb2wgd2l0aCB0aGUgbmV3IGRhdGEuIEFwcGVuZCBhbnkgZXhpc3RpbmcgY29udGVudCB0byB0aGUgZW5kLCBzbyBpdCBpcyBwdWxsZWQgZmlyc3QuXG4gICAgICAgIHZhciBjb250ZW50RGF0YSA9IGpzb25EYXRhIHx8IFtdO1xuICAgICAgICBjb250ZW50RGF0YSA9IG1hc3NhZ2VDb250ZW50KGNvbnRlbnREYXRhKTtcbiAgICAgICAgdmFyIG5ld0FycmF5ID0gc2h1ZmZsZUFycmF5KGNvbnRlbnREYXRhKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBmcmVzaENvbnRlbnRQb29sLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBuZXdBcnJheS5wdXNoKGZyZXNoQ29udGVudFBvb2xbaV0pO1xuICAgICAgICB9XG4gICAgICAgIGZyZXNoQ29udGVudFBvb2wgPSBuZXdBcnJheTtcbiAgICAgICAgaWYgKGNhbGxiYWNrKSB7IGNhbGxiYWNrKGdyb3VwU2V0dGluZ3MpOyB9XG4gICAgfSwgZnVuY3Rpb24oZXJyb3JNZXNzYWdlKSB7XG4gICAgICAgIC8qIFRPRE86IEVycm9yIGhhbmRsaW5nICovXG4gICAgICAgIGNvbnNvbGUubG9nKCdBbiBlcnJvciBvY2N1cnJlZCBmZXRjaGluZyByZWNvbW1lbmRlZCBjb250ZW50OiAnICsgZXJyb3JNZXNzYWdlKTtcbiAgICB9KTtcbn1cblxuLy8gQXBwbHkgYW55IGNsaWVudC1zaWRlIGZpbHRlcmluZy9tb2RpZmljYXRpb25zIHRvIHRoZSBjb250ZW50IHJlYyBkYXRhLlxuZnVuY3Rpb24gbWFzc2FnZUNvbnRlbnQoY29udGVudERhdGEpIHtcbiAgICB2YXIgbWFzc2FnZWRDb250ZW50ID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb250ZW50RGF0YS5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgZGF0YSA9IGNvbnRlbnREYXRhW2ldO1xuICAgICAgICBpZiAoZGF0YS5jb250ZW50LnR5cGUgPT09ICdtZWRpYScpIHtcbiAgICAgICAgICAgIC8vIEZvciBub3csIHRoZSBvbmx5IHZpZGVvIHdlIGhhbmRsZSBpcyBZb3VUdWJlLCB3aGljaCBoYXMgYSBrbm93biBmb3JtYXRcbiAgICAgICAgICAgIC8vIGZvciBjb252ZXJ0aW5nIHZpZGVvIFVSTHMgaW50byBpbWFnZXMuXG4gICAgICAgICAgICB2YXIgeW91dHViZU1hdGNoZXIgPSAvXigoaHR0cHxodHRwcyk6KT9cXC9cXC8od3d3XFwuKT95b3V0dWJlXFwuY29tLiovO1xuICAgICAgICAgICAgaWYgKHlvdXR1YmVNYXRjaGVyLnRlc3QoZGF0YS5jb250ZW50LmJvZHkpKSB7IC8vIElzIHRoaXMgYSB5b3V0dWJlIFVSTD8gKHRoZSBJRCBtYXRjaGVyIGJlbG93IGRvZXNuJ3QgZ3VhcmFudGVlIHRoaXMpXG4gICAgICAgICAgICAgICAgLy8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8zNDUyNTQ2L2phdmFzY3JpcHQtcmVnZXgtaG93LXRvLWdldC15b3V0dWJlLXZpZGVvLWlkLWZyb20tdXJsLzI3NzI4NDE3IzI3NzI4NDE3XG4gICAgICAgICAgICAgICAgdmFyIHZpZGVvSURNYXRjaGVyID0gL14uKig/Oig/OnlvdXR1XFwuYmVcXC98dlxcL3x2aVxcL3x1XFwvXFx3XFwvfGVtYmVkXFwvKXwoPzooPzp3YXRjaCk/XFw/dig/OmkpPz18XFwmdig/OmkpPz0pKShbXiNcXCZcXD9dKikuKi87XG4gICAgICAgICAgICAgICAgdmFyIG1hdGNoID0gdmlkZW9JRE1hdGNoZXIuZXhlYyhkYXRhLmNvbnRlbnQuYm9keSk7XG4gICAgICAgICAgICAgICAgaWYgKG1hdGNoLmxlbmd0aCA9PT0gMikge1xuICAgICAgICAgICAgICAgICAgICAvLyBDb252ZXJ0IHRoZSBjb250ZW50IGludG8gYW4gaW1hZ2UuXG4gICAgICAgICAgICAgICAgICAgIGRhdGEuY29udGVudC5ib2R5ID0gJ2h0dHBzOi8vaW1nLnlvdXR1YmUuY29tL3ZpLycgKyBtYXRjaFsxXSArICcvbXFkZWZhdWx0LmpwZyc7IC8qIDE2OjkgcmF0aW8gdGh1bWJuYWlsLCBzbyB3ZSBnZXQgbm8gYmxhY2sgYmFycy4gKi9cbiAgICAgICAgICAgICAgICAgICAgZGF0YS5jb250ZW50LnR5cGUgPSAnaW1hZ2UnO1xuICAgICAgICAgICAgICAgICAgICBtYXNzYWdlZENvbnRlbnQucHVzaChkYXRhKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBtYXNzYWdlZENvbnRlbnQucHVzaChkYXRhKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbWFzc2FnZWRDb250ZW50O1xufVxuXG5mdW5jdGlvbiBzZXJ2ZUNvbnRlbnQocGFnZURhdGEsIGdyb3VwU2V0dGluZ3MsIHByZXZlbnRMb29wLypvbmx5IHVzZWQgcmVjdXJzaXZlbHkqLykge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGVuZGluZ0NhbGxiYWNrcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgZW50cnkgPSBwZW5kaW5nQ2FsbGJhY2tzW2ldO1xuICAgICAgICB2YXIgY2hvc2VuQ29udGVudCA9IFtdO1xuICAgICAgICB2YXIgdXJsc1RvQXZvaWQgPSBbIHBhZ2VEYXRhLmNhbm9uaWNhbFVybCBdO1xuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGVudHJ5LmNvdW50OyBqKyspIHtcbiAgICAgICAgICAgIHZhciBwcmVmZXJyZWRUeXBlID0gaiAlIDIgPT09IDAgPyAnaW1hZ2UnOid0ZXh0JztcbiAgICAgICAgICAgIHZhciBkYXRhID0gY2hvb3NlQ29udGVudChwcmVmZXJyZWRUeXBlLCB1cmxzVG9Bdm9pZCk7XG4gICAgICAgICAgICBpZiAoZGF0YSkge1xuICAgICAgICAgICAgICAgIGNob3NlbkNvbnRlbnQucHVzaChkYXRhKTtcbiAgICAgICAgICAgICAgICB1cmxzVG9Bdm9pZC5wdXNoKGRhdGEucGFnZS51cmwpOyAvLyBkb24ndCBsaW5rIHRvIHRoZSBzYW1lIHBhZ2UgdHdpY2VcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoY2hvc2VuQ29udGVudC5sZW5ndGggPj0gZW50cnkuY291bnQpIHtcbiAgICAgICAgICAgIGVudHJ5LmNhbGxiYWNrKGNob3NlbkNvbnRlbnQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKCFwcmV2ZW50TG9vcCkge1xuICAgICAgICAgICAgICAgIC8vIFJhbiBvdXQgb2YgY29udGVudC4gR28gZ2V0IG1vcmUuIFRoZSBcInByZXZlbnRMb29wXCIgZmxhZyB0ZWxscyB1cyB3aGV0aGVyXG4gICAgICAgICAgICAgICAgLy8gd2UndmUgYWxyZWFkeSB0cmllZCB0byBmZXRjaCBidXQgd2UganVzdCBoYXZlIG5vIGdvb2QgY29udGVudCB0byBjaG9vc2UuXG4gICAgICAgICAgICAgICAgZmV0Y2hSZWNvbW1lbmRlZENvbnRlbnQoZ3JvdXBTZXR0aW5ncywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlcnZlQ29udGVudChwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncywgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cbiAgICBwZW5kaW5nQ2FsbGJhY2tzID0gcGVuZGluZ0NhbGxiYWNrcy5zcGxpY2UoaSk7IC8vIFRyaW0gYW55IGNhbGxiYWNrcyB0aGF0IHdlIG5vdGlmaWVkLlxufVxuXG5mdW5jdGlvbiBjaG9vc2VDb250ZW50KHByZWZlcnJlZFR5cGUsIHVybHNUb0F2b2lkKSB7XG4gICAgdmFyIGFsdGVybmF0ZUluZGV4O1xuICAgIGZvciAodmFyIGkgPSBmcmVzaENvbnRlbnRQb29sLmxlbmd0aC0xOyBpID49IDA7IGktLSkge1xuICAgICAgICB2YXIgY29udGVudERhdGEgPSBmcmVzaENvbnRlbnRQb29sW2ldO1xuICAgICAgICBpZiAoIWFycmF5Q29udGFpbnModXJsc1RvQXZvaWQsIGNvbnRlbnREYXRhLnBhZ2UudXJsKSkge1xuICAgICAgICAgICAgaWYgKGNvbnRlbnREYXRhLmNvbnRlbnQudHlwZSA9PT0gcHJlZmVycmVkVHlwZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmcmVzaENvbnRlbnRQb29sLnNwbGljZShpLCAxKVswXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGFsdGVybmF0ZUluZGV4ID0gaTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAoYWx0ZXJuYXRlSW5kZXggIT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gZnJlc2hDb250ZW50UG9vbC5zcGxpY2UoYWx0ZXJuYXRlSW5kZXgsIDEpWzBdO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gYXJyYXlDb250YWlucyhhcnJheSwgZWxlbWVudCkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJyYXkubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGFycmF5W2ldID09PSBlbGVtZW50KSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG59XG5cbi8vIER1cnN0ZW5mZWxkIHNodWZmbGUgYWxnb3JpdGhtIGZyb206IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzEyNjQ2ODY0LzQxMzU0MzFcbmZ1bmN0aW9uIHNodWZmbGVBcnJheShhcnJheSkge1xuICAgIHZhciBjb3B5ID0gYXJyYXkuc2xpY2UoMCk7XG4gICAgZm9yICh2YXIgaSA9IGFycmF5Lmxlbmd0aCAtIDE7IGkgPiAwOyBpLS0pIHtcbiAgICAgICAgdmFyIGogPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAoaSArIDEpKTtcbiAgICAgICAgdmFyIHRlbXAgPSBjb3B5W2ldO1xuICAgICAgICBjb3B5W2ldID0gY29weVtqXTtcbiAgICAgICAgY29weVtqXSA9IHRlbXA7XG4gICAgfVxuICAgIHJldHVybiBjb3B5O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBwcmVmZXRjaElmTmVlZGVkOiBwcmVmZXRjaElmTmVlZGVkLFxuICAgIGdldFJlY29tbWVuZGVkQ29udGVudDogZ2V0UmVjb21tZW5kZWRDb250ZW50XG59OyIsInZhciBSYWN0aXZlOyByZXF1aXJlKCcuL3V0aWxzL3JhY3RpdmUtcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24obG9hZGVkUmFjdGl2ZSkgeyBSYWN0aXZlID0gbG9hZGVkUmFjdGl2ZTt9KTtcbnZhciBCcm93c2VyTWV0cmljcyA9IHJlcXVpcmUoJy4vdXRpbHMvYnJvd3Nlci1tZXRyaWNzJyk7XG52YXIgSlNPTlV0aWxzID0gcmVxdWlyZSgnLi91dGlscy9qc29uLXV0aWxzJyk7XG52YXIgTWVzc2FnZXMgPSByZXF1aXJlKCcuL3V0aWxzL21lc3NhZ2VzJyk7XG52YXIgVGhyb3R0bGVkRXZlbnRzID0gcmVxdWlyZSgnLi91dGlscy90aHJvdHRsZWQtZXZlbnRzJyk7XG52YXIgVVJMcyA9IHJlcXVpcmUoJy4vdXRpbHMvdXJscycpO1xuXG52YXIgQ29udGVudFJlY0xvYWRlciA9IHJlcXVpcmUoJy4vY29udGVudC1yZWMtbG9hZGVyJyk7XG52YXIgRXZlbnRzID0gcmVxdWlyZSgnLi9ldmVudHMnKTtcbnZhciBTVkdzID0gcmVxdWlyZSgnLi9zdmdzJyk7XG5cbmZ1bmN0aW9uIGNyZWF0ZUNvbnRlbnRSZWMocGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgY29udGVudFJlY0NvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGNvbnRlbnRSZWNDb250YWluZXIuY2xhc3NOYW1lID0gJ2FudGVubmEgYW50ZW5uYS1jb250ZW50LXJlYyc7XG4gICAgLy8gV2UgY2FuJ3QgcmVhbGx5IHJlcXVlc3QgY29udGVudCB1bnRpbCB0aGUgZnVsbCBwYWdlIGRhdGEgaXMgbG9hZGVkIChiZWNhdXNlIHdlIG5lZWQgdG8ga25vdyB0aGUgc2VydmVyLXNpZGUgY29tcHV0ZWRcbiAgICAvLyBjYW5vbmljYWwgVVJMKSwgYnV0IHdlIGNhbiBzdGFydCBwcmVmZXRjaGluZyB0aGUgY29udGVudCBwb29sIGZvciB0aGUgZ3JvdXAuXG4gICAgQ29udGVudFJlY0xvYWRlci5wcmVmZXRjaElmTmVlZGVkKGdyb3VwU2V0dGluZ3MpO1xuICAgIHZhciBudW1FbnRyaWVzID0gQnJvd3Nlck1ldHJpY3MuaXNNb2JpbGUoKSA/IGdyb3VwU2V0dGluZ3MuY29udGVudFJlY0NvdW50TW9iaWxlKCkgOiBncm91cFNldHRpbmdzLmNvbnRlbnRSZWNDb3VudERlc2t0b3AoKTtcbiAgICB2YXIgbnVtRW50cmllc1BlclJvdyA9IEJyb3dzZXJNZXRyaWNzLmlzTW9iaWxlKCkgPyBncm91cFNldHRpbmdzLmNvbnRlbnRSZWNSb3dDb3VudE1vYmlsZSgpIDogZ3JvdXBTZXR0aW5ncy5jb250ZW50UmVjUm93Q291bnREZXNrdG9wKCk7XG4gICAgdmFyIGVudHJ5V2lkdGggPSBNYXRoLmZsb29yKDEwMC9udW1FbnRyaWVzUGVyUm93KSArICclJztcbiAgICB2YXIgY29udGVudERhdGEgPSB7IGVudHJpZXM6IHVuZGVmaW5lZCB9OyAvLyBOZWVkIHRvIHN0dWIgb3V0IHRoZSBkYXRhIHNvIFJhY3RpdmUgY2FuIGJpbmQgdG8gaXRcbiAgICB2YXIgcmFjdGl2ZSA9IFJhY3RpdmUoe1xuICAgICAgICBlbDogY29udGVudFJlY0NvbnRhaW5lcixcbiAgICAgICAgbWFnaWM6IHRydWUsXG4gICAgICAgIGFwcGVuZDogdHJ1ZSxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgdGl0bGU6IGdyb3VwU2V0dGluZ3MuY29udGVudFJlY1RpdGxlKCkgfHwgTWVzc2FnZXMuZ2V0TWVzc2FnZSgnY29udGVudF9yZWNfd2lkZ2V0X190aXRsZScpLFxuICAgICAgICAgICAgcGFnZURhdGE6IHBhZ2VEYXRhLFxuICAgICAgICAgICAgY29udGVudERhdGE6IGNvbnRlbnREYXRhLFxuICAgICAgICAgICAgcG9wdWxhdGVDb250ZW50RW50cmllczogcG9wdWxhdGVDb250ZW50RW50cmllcyhudW1FbnRyaWVzLCBjb250ZW50RGF0YSwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpLFxuICAgICAgICAgICAgY29sb3JzOiBwaWNrQ29sb3JzKG51bUVudHJpZXMsIGdyb3VwU2V0dGluZ3MpLFxuICAgICAgICAgICAgaXNNb2JpbGU6IEJyb3dzZXJNZXRyaWNzLmlzTW9iaWxlKCksXG4gICAgICAgICAgICBlbnRyeVdpZHRoOiBlbnRyeVdpZHRoLFxuICAgICAgICAgICAgY29tcHV0ZUVudHJ5VXJsOiBjb21wdXRlRW50cnlVcmxcbiAgICAgICAgfSxcbiAgICAgICAgdGVtcGxhdGU6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9jb250ZW50LXJlYy13aWRnZXQuaGJzLmh0bWwnKSxcbiAgICAgICAgcGFydGlhbHM6IHtcbiAgICAgICAgICAgIGxvZ286IFNWR3MubG9nb1xuICAgICAgICB9LFxuICAgICAgICBkZWNvcmF0b3JzOiB7XG4gICAgICAgICAgICByZW5kZXJUZXh0OiByZW5kZXJUZXh0XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICBzZXR1cFZpc2liaWxpdHlIYW5kbGVyKCk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBlbGVtZW50OiBjb250ZW50UmVjQ29udGFpbmVyLFxuICAgICAgICB0ZWFyZG93bjogZnVuY3Rpb24oKSB7IHJhY3RpdmUudGVhcmRvd24oKTsgfVxuICAgIH07XG5cbiAgICBmdW5jdGlvbiBjb21wdXRlRW50cnlVcmwoY29udGVudEVudHJ5KSB7XG4gICAgICAgIHZhciB0YXJnZXRVcmwgPSBjb250ZW50RW50cnkucGFnZS51cmw7XG4gICAgICAgIHZhciBjb250ZW50SWQgPSBjb250ZW50RW50cnkuY29udGVudC5pZDtcbiAgICAgICAgdmFyIGV2ZW50ID0gRXZlbnRzLmNyZWF0ZUNvbnRlbnRSZWNDbGlja2VkRXZlbnQocGFnZURhdGEsIHRhcmdldFVybCwgY29udGVudElkLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgcmV0dXJuIFVSTHMuY29tcHV0ZUNvbnRlbnRSZWNVcmwodGFyZ2V0VXJsLCBldmVudCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2V0dXBWaXNpYmlsaXR5SGFuZGxlcigpIHtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIFdoZW4gY29udGVudCByZWMgbG9hZHMsIGdpdmUgaXQgYSBtb21lbnQgYW5kIHRoZW4gc2VlIGlmIHdlJ3JlXG4gICAgICAgICAgICAvLyB2aXNpYmxlLiBJZiBub3QsIHN0YXJ0IHRyYWNraW5nIHNjcm9sbCBldmVudHMuXG4gICAgICAgICAgICBpZiAoaXNDb250ZW50UmVjVmlzaWJsZSgpKSB7XG4gICAgICAgICAgICAgICAgRXZlbnRzLnBvc3RDb250ZW50UmVjVmlzaWJsZShwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIFRocm90dGxlZEV2ZW50cy5vbignc2Nyb2xsJywgaGFuZGxlU2Nyb2xsRXZlbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCAyMDApO1xuXG4gICAgICAgIGZ1bmN0aW9uIGhhbmRsZVNjcm9sbEV2ZW50KCkge1xuICAgICAgICAgICAgaWYgKGlzQ29udGVudFJlY1Zpc2libGUoKSkge1xuICAgICAgICAgICAgICAgIEV2ZW50cy5wb3N0Q29udGVudFJlY1Zpc2libGUocGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgICAgIFRocm90dGxlZEV2ZW50cy5vZmYoJ3Njcm9sbCcsIGhhbmRsZVNjcm9sbEV2ZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGlzQ29udGVudFJlY1Zpc2libGUoKSB7XG4gICAgICAgIC8vIEJlY2F1c2UgdGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgb24gc2Nyb2xsLCB3ZSB0cnkgdG8gYXZvaWQgdW5uZWNlc3NhcnlcbiAgICAgICAgLy8gY29tcHV0YXRpb24gYXMgbXVjaCBhcyBwb3NzaWJsZSBoZXJlLCBiYWlsaW5nIG91dCBhcyBlYXJseSBhcyBwb3NzaWJsZS5cbiAgICAgICAgLy8gRmlyc3QsIGNoZWNrIHdoZXRoZXIgd2UgZXZlbiBoYXZlIHBhZ2UgZGF0YS5cbiAgICAgICAgaWYgKHBhZ2VEYXRhLnN1bW1hcnlMb2FkZWQpIHtcbiAgICAgICAgICAgIC8vIFRoZW4gY2hlY2sgaWYgdGhlIG91dGVyIGNvbnRlbnQgcmVjIGlzIGluIHRoZSB2aWV3cG9ydCBhdCBhbGwuXG4gICAgICAgICAgICB2YXIgY29udGVudEJveCA9IGNvbnRlbnRSZWNDb250YWluZXIuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgICAgICB2YXIgdmlld3BvcnRCb3R0b20gPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50SGVpZ2h0O1xuICAgICAgICAgICAgaWYgKGNvbnRlbnRCb3gudG9wID4gMCAmJiBjb250ZW50Qm94LnRvcCA8IHZpZXdwb3J0Qm90dG9tIHx8XG4gICAgICAgICAgICAgICAgY29udGVudEJveC5ib3R0b20gPiAwICYmIGNvbnRlbnRCb3guYm90dG9tIDwgdmlld3BvcnRCb3R0b20pIHtcbiAgICAgICAgICAgICAgICAvLyBGaW5hbGx5LCBsb29rIHRvIHNlZSB3aGV0aGVyIGFueSByZWNvbW1lbmRlZCBjb250ZW50IGhhcyBiZWVuXG4gICAgICAgICAgICAgICAgLy8gcmVuZGVyZWQgb250byB0aGUgcGFnZSBhbmQgaXMgb24gc2NyZWVuIGVub3VnaCB0byBiZSBjb25zaWRlcmVkXG4gICAgICAgICAgICAgICAgLy8gdmlzaWJsZS5cbiAgICAgICAgICAgICAgICB2YXIgZW50cmllcyA9IHJhY3RpdmUuZmluZEFsbCgnLmFudGVubmEtY29udGVudHJlYy1lbnRyeScpO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZW50cmllcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZW50cnkgPSBlbnRyaWVzW2ldO1xuICAgICAgICAgICAgICAgICAgICB2YXIgZW50cnlCb3ggPSBlbnRyeS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVudHJ5Qm94LnRvcCA+IDAgJiYgZW50cnlCb3guYm90dG9tIDwgdmlld3BvcnRCb3R0b20pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRoZSBlbnRyeSBpcyBmdWxseSB2aXNpYmxlXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxufVxuXG4vLyBUaGlzIGZ1bmN0aW9uIGlzIHRyaWdnZXJlZCBmcm9tIHdpdGhpbiB0aGUgUmFjdGl2ZSB0ZW1wbGF0ZSB3aGVuIHRoZSBwYWdlIGRhdGEgaXMgbG9hZGVkLiBPbmNlIHBhZ2UgZGF0YSBpcyBsb2FkZWQsXG4vLyB3ZSdyZSByZWFkeSB0byBhc2sgZm9yIGNvbnRlbnQuXG5mdW5jdGlvbiBwb3B1bGF0ZUNvbnRlbnRFbnRyaWVzKG51bUVudHJpZXMsIGNvbnRlbnREYXRhLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHJldHVybiBmdW5jdGlvbihwYWdlRGF0YUlzTG9hZGVkKSB7XG4gICAgICAgIGlmIChwYWdlRGF0YUlzTG9hZGVkICYmICFjb250ZW50RGF0YS5lbnRyaWVzKSB7XG4gICAgICAgICAgICAvLyBTaW5jZSB0aGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCBieSBSYWN0aXZlIHdoZW4gcGFnZURhdGEuc3VtbWFyeUxvYWRlZCBjaGFuZ2VzIGFuZCBpdCBjYW4gcG90ZW50aWFsbHlcbiAgICAgICAgICAgIC8vICp0cmlnZ2VyKiBhIFJhY3RpdmUgdXBkYXRlIChpZiBjb250ZW50IGRhdGEgaXMgcmVhZHkgdG8gYmUgc2VydmVkLCB3ZSBtb2RpZnkgY29udGVudERhdGEuZW50cmllcyksXG4gICAgICAgICAgICAvLyB3ZSBuZWVkIHRvIHdyYXAgaW4gYSB0aW1lb3V0IHNvIHRoYXQgdGhlIGZpcnN0IFJhY3RpdmUgdXBkYXRlIGNhbiBjb21wbGV0ZSBiZWZvcmUgd2UgdHJpZ2dlciBhbm90aGVyLlxuICAgICAgICAgICAgLy8gT3RoZXJ3aXNlLCBSYWN0aXZlIGJhaWxzIG91dCBiZWNhdXNlIGl0IHRoaW5rcyB3ZSdyZSB0cmlnZ2VyaW5nIGFuIGluZmluaXRlIHVwZGF0ZSBsb29wLlxuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBDb250ZW50UmVjTG9hZGVyLmdldFJlY29tbWVuZGVkQ29udGVudChudW1FbnRyaWVzLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncywgZnVuY3Rpb24gKGZldGNoZWRDb250ZW50RW50cmllcykge1xuICAgICAgICAgICAgICAgICAgICBjb250ZW50RGF0YS5lbnRyaWVzID0gZmV0Y2hlZENvbnRlbnRFbnRyaWVzO1xuICAgICAgICAgICAgICAgICAgICBFdmVudHMucG9zdENvbnRlbnRSZWNMb2FkZWQocGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSwgMCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHBhZ2VEYXRhSXNMb2FkZWQ7XG4gICAgfVxufVxuXG5mdW5jdGlvbiByZW5kZXJUZXh0KG5vZGUpIHtcbiAgICB2YXIgdGV4dCA9IGNyb3BJZk5lZWRlZChub2RlKTtcbiAgICBpZiAodGV4dC5sZW5ndGggIT09IG5vZGUuaW5uZXJIVE1MLmxlbmd0aCkge1xuICAgICAgICB0ZXh0ICs9ICcuLi4nO1xuICAgIH1cbiAgICB0ZXh0ID0gYXBwbHlCb2xkaW5nKHRleHQpO1xuICAgIGlmICh0ZXh0Lmxlbmd0aCAhPT0gbm9kZS5pbm5lckhUTUwubGVuZ3RoKSB7XG4gICAgICAgIG5vZGUuaW5uZXJIVE1MID0gdGV4dDtcbiAgICAgICAgLy8gQ2hlY2sgYWdhaW4sIGp1c3QgdG8gbWFrZSBzdXJlIHRoZSB0ZXh0IGZpdHMgYWZ0ZXIgYm9sZGluZy5cbiAgICAgICAgdGV4dCA9IGNyb3BJZk5lZWRlZChub2RlKTtcbiAgICAgICAgaWYgKHRleHQubGVuZ3RoICE9PSBub2RlLmlubmVySFRNTC5sZW5ndGgpIHsgLy9cbiAgICAgICAgICAgIG5vZGUuaW5uZXJIVE1MID0gdGV4dCArICcuLi4nO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHsgdGVhcmRvd246IGZ1bmN0aW9uKCkge30gfTtcblxuICAgIGZ1bmN0aW9uIGNyb3BJZk5lZWRlZChub2RlKSB7XG4gICAgICAgIHZhciB0ZXh0ID0gbm9kZS5pbm5lckhUTUw7XG4gICAgICAgIHZhciByYXRpbyA9IG5vZGUuY2xpZW50SGVpZ2h0IC8gbm9kZS5zY3JvbGxIZWlnaHQ7XG4gICAgICAgIGlmIChyYXRpbyA8IDEpIHsgLy8gSWYgdGhlIHRleHQgaXMgbGFyZ2VyIHRoYW4gdGhlIGNsaWVudCBhcmVhLCBjcm9wIHRoZSB0ZXh0LlxuICAgICAgICAgICAgdmFyIGNyb3BXb3JkQnJlYWsgPSB0ZXh0Lmxhc3RJbmRleE9mKCcgJywgdGV4dC5sZW5ndGggKiByYXRpbyAtIDMpOyAvLyBhY2NvdW50IGZvciB0aGUgJy4uLicgdGhhdCB3ZSdsbCBhZGRcbiAgICAgICAgICAgIHRleHQgPSB0ZXh0LnN1YnN0cmluZygwLCBjcm9wV29yZEJyZWFrKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGV4dDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBhcHBseUJvbGRpbmcodGV4dCkge1xuICAgICAgICB2YXIgYm9sZFN0YXJ0UG9pbnQgPSBNYXRoLmZsb29yKHRleHQubGVuZ3RoICogLjI1KTtcbiAgICAgICAgdmFyIGJvbGRFbmRQb2ludCA9IE1hdGguZmxvb3IodGV4dC5sZW5ndGggKi44KTtcbiAgICAgICAgdmFyIG1hdGNoZXMgPSB0ZXh0LnN1YnN0cmluZyhib2xkU3RhcnRQb2ludCwgYm9sZEVuZFBvaW50KS5tYXRjaCgvLHxcXC58XFw/fFwiL2dpKTtcbiAgICAgICAgaWYgKG1hdGNoZXMpIHtcbiAgICAgICAgICAgIHZhciBib2xkUG9pbnQgPSB0ZXh0Lmxhc3RJbmRleE9mKG1hdGNoZXNbbWF0Y2hlcy5sZW5ndGggLSAxXSwgYm9sZEVuZFBvaW50KSArIDE7XG4gICAgICAgICAgICB0ZXh0ID0gJzxzdHJvbmc+JyArIHRleHQuc3Vic3RyaW5nKDAsIGJvbGRQb2ludCkgKyAnPC9zdHJvbmc+JyArIHRleHQuc3Vic3RyaW5nKGJvbGRQb2ludCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRleHQ7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBwaWNrQ29sb3JzKGNvdW50LCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGNvbG9yUGFsbGV0ZSA9IFtdO1xuICAgIHZhciBjb2xvckRhdGEgPSBncm91cFNldHRpbmdzLmNvbnRlbnRSZWNDb2xvcnMoKTtcbiAgICBpZiAoY29sb3JEYXRhKSB7XG4gICAgICAgIHZhciBjb2xvclBhaXJzID0gY29sb3JEYXRhLnNwbGl0KCc7Jyk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY29sb3JQYWlycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGNvbG9ycyA9IGNvbG9yUGFpcnNbaV0uc3BsaXQoJy8nKTtcbiAgICAgICAgICAgIGlmIChjb2xvcnMubGVuZ3RoID09PSAyKSB7XG4gICAgICAgICAgICAgICAgY29sb3JQYWxsZXRlLnB1c2goeyBiYWNrZ3JvdW5kOiBjb2xvcnNbMF0sIGZvcmVncm91bmQ6IGNvbG9yc1sxXSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAoY29sb3JQYWxsZXRlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICBjb2xvclBhbGxldGUucHVzaCh7IGJhY2tncm91bmQ6ICcjMDAwMDAwJywgZm9yZWdyb3VuZDogJyNGRkZGRkYnIH0pO1xuICAgIH1cbiAgICBpZiAoY291bnQgPCBjb2xvclBhbGxldGUubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBzaHVmZmxlQXJyYXkoY29sb3JQYWxsZXRlKS5zbGljZSgwLCBjb3VudCk7XG4gICAgfSBlbHNlIHsgLy8gSWYgd2UncmUgYXNraW5nIGZvciBtb3JlIGNvbG9ycyB0aGFuIHdlIGhhdmUsIGp1c3QgcmVwZWF0IHRoZSBzYW1lIGNvbG9ycyBhcyBuZWNlc3NhcnkuXG4gICAgICAgIHZhciBvdXRwdXQgPSBbXTtcbiAgICAgICAgdmFyIGNob3NlbkluZGV4O1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvdW50OyBpKyspIHtcbiAgICAgICAgICAgIGNob3NlbkluZGV4ID0gcmFuZG9tSW5kZXgoY2hvc2VuSW5kZXgpO1xuICAgICAgICAgICAgb3V0cHV0LnB1c2goY29sb3JQYWxsZXRlW2Nob3NlbkluZGV4XSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG91dHB1dDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByYW5kb21JbmRleChhdm9pZCkge1xuICAgICAgICBkbyB7XG4gICAgICAgICAgICB2YXIgcGlja2VkID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogY29sb3JQYWxsZXRlLmxlbmd0aCk7XG4gICAgICAgIH0gd2hpbGUgKHBpY2tlZCA9PT0gYXZvaWQgJiYgY29sb3JQYWxsZXRlLmxlbmd0aCA+IDEpO1xuICAgICAgICByZXR1cm4gcGlja2VkO1xuICAgIH1cbn1cblxuLy8gRHVyc3RlbmZlbGQgc2h1ZmZsZSBhbGdvcml0aG0gZnJvbTogaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMTI2NDY4NjQvNDEzNTQzMVxuZnVuY3Rpb24gc2h1ZmZsZUFycmF5KGFycmF5KSB7XG4gICAgdmFyIGNvcHkgPSBhcnJheS5zbGljZSgwKTtcbiAgICBmb3IgKHZhciBpID0gYXJyYXkubGVuZ3RoIC0gMTsgaSA+IDA7IGktLSkge1xuICAgICAgICB2YXIgaiA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIChpICsgMSkpO1xuICAgICAgICB2YXIgdGVtcCA9IGNvcHlbaV07XG4gICAgICAgIGNvcHlbaV0gPSBjb3B5W2pdO1xuICAgICAgICBjb3B5W2pdID0gdGVtcDtcbiAgICB9XG4gICAgcmV0dXJuIGNvcHk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZUNvbnRlbnRSZWM6IGNyZWF0ZUNvbnRlbnRSZWNcbn07IiwidmFyIEFwcE1vZGUgPSByZXF1aXJlKCcuL3V0aWxzL2FwcC1tb2RlJyk7XG52YXIgVVJMcyA9IHJlcXVpcmUoJy4vdXRpbHMvdXJscycpO1xuXG5mdW5jdGlvbiBsb2FkQ3NzKCkge1xuICAgIC8vIFRvIG1ha2Ugc3VyZSBub25lIG9mIG91ciBjb250ZW50IHJlbmRlcnMgb24gdGhlIHBhZ2UgYmVmb3JlIG91ciBDU1MgaXMgbG9hZGVkLCB3ZSBhcHBlbmQgYSBzaW1wbGUgaW5saW5lIHN0eWxlXG4gICAgLy8gZWxlbWVudCB0aGF0IHR1cm5zIG9mZiBvdXIgZWxlbWVudHMgKmJlZm9yZSogb3VyIENTUyBsaW5rcy4gVGhpcyBleHBsb2l0cyB0aGUgY2FzY2FkZSBydWxlcyAtIG91ciBDU1MgZmlsZXMgYXBwZWFyXG4gICAgLy8gYWZ0ZXIgdGhlIGlubGluZSBzdHlsZSBpbiB0aGUgZG9jdW1lbnQsIHNvIHRoZXkgdGFrZSBwcmVjZWRlbmNlIChhbmQgbWFrZSBldmVyeXRoaW5nIGFwcGVhcikgb25jZSB0aGV5J3JlIGxvYWRlZC5cbiAgICBpbmplY3RDc3MoJy5hbnRlbm5he2Rpc3BsYXk6bm9uZTt9Jyk7XG4gICAgdmFyIGNzc0hyZWYgPSBVUkxzLmFtYXpvblMzVXJsKCkgKyAnL3dpZGdldC1uZXcvYW50ZW5uYS5jc3M/dj00JztcbiAgICBpZiAoQXBwTW9kZS5vZmZsaW5lKSB7XG4gICAgICAgIGNzc0hyZWYgPSBVUkxzLmFwcFNlcnZlclVybCgpICsgJy9zdGF0aWMvd2lkZ2V0LW5ldy9hbnRlbm5hLmNzcyc7XG4gICAgfVxuICAgIGxvYWRGaWxlKGNzc0hyZWYpO1xufVxuXG5mdW5jdGlvbiBsb2FkRmlsZShocmVmKSB7XG4gICAgdmFyIGxpbmtUYWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaW5rJyk7XG4gICAgbGlua1RhZy5zZXRBdHRyaWJ1dGUoJ2hyZWYnLCBocmVmKTtcbiAgICBsaW5rVGFnLnNldEF0dHJpYnV0ZSgncmVsJywgJ3N0eWxlc2hlZXQnKTtcbiAgICBsaW5rVGFnLnNldEF0dHJpYnV0ZSgndHlwZScsICd0ZXh0L2NzcycpO1xuICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQobGlua1RhZyk7XG59XG5cbmZ1bmN0aW9uIGluamVjdENzcyhjc3NTdHJpbmcpIHtcbiAgICB2YXIgc3R5bGVUYWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xuICAgIHN0eWxlVGFnLnNldEF0dHJpYnV0ZSgndHlwZScsICd0ZXh0L2NzcycpO1xuICAgIHN0eWxlVGFnLmlubmVySFRNTCA9IGNzc1N0cmluZztcbiAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHN0eWxlVGFnKTtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGxvYWQgOiBsb2FkQ3NzLFxuICAgIGluamVjdDogaW5qZWN0Q3NzXG59OyIsInZhciBBamF4Q2xpZW50ID0gcmVxdWlyZSgnLi91dGlscy9hamF4LWNsaWVudCcpO1xudmFyIEJyb3dzZXJNZXRyaWNzID0gcmVxdWlyZSgnLi91dGlscy9icm93c2VyLW1ldHJpY3MnKTtcbnZhciBMb2dnaW5nID0gcmVxdWlyZSgnLi91dGlscy9sb2dnaW5nJyk7XG52YXIgU2VnbWVudCA9IHJlcXVpcmUoJy4vdXRpbHMvc2VnbWVudCcpO1xudmFyIFNlc3Npb25EYXRhID0gcmVxdWlyZSgnLi91dGlscy9zZXNzaW9uLWRhdGEnKTtcbnZhciBVc2VyID0gcmVxdWlyZSgnLi91dGlscy91c2VyJyk7XG5cbmZ1bmN0aW9uIHBvc3RHcm91cFNldHRpbmdzTG9hZGVkKGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgZXZlbnQgPSBjcmVhdGVFdmVudChldmVudFR5cGVzLnNjcmlwdExvYWQsICcnLCBncm91cFNldHRpbmdzKTtcbiAgICBldmVudFthdHRyaWJ1dGVzLnBhZ2VJZF0gPSAnbmEnO1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMuYXJ0aWNsZUhlaWdodF0gPSAnbmEnO1xuICAgIHBvc3RFdmVudChldmVudCk7XG59XG5cbmZ1bmN0aW9uIHBvc3RQYWdlRGF0YUxvYWRlZChwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBldmVudCA9IGNyZWF0ZUV2ZW50KGV2ZW50VHlwZXMucGFnZURhdGFMb2FkZWQsICcnLCBncm91cFNldHRpbmdzKTtcbiAgICBhcHBlbmRQYWdlRGF0YVBhcmFtcyhldmVudCwgcGFnZURhdGEpO1xuICAgIC8vIFRPRE86IHJlY29yZGluZyBvZiBzaW5nbGUvbXVsdGkgaXMgZGlzYWJsZWQgc28gd2UgY2FuIGluc3RlYWQgcmVjb3JkIEEvQi9DIHNlZ21lbnQgZGF0YVxuICAgIC8vIGV2ZW50W2F0dHJpYnV0ZXMuY29udGVudEF0dHJpYnV0ZXNdID0gcGFnZURhdGEubWV0cmljcy5pc011bHRpUGFnZSA/IGV2ZW50VmFsdWVzLm11bHRpcGxlUGFnZXMgOiBldmVudFZhbHVlcy5zaW5nbGVQYWdlO1xuICAgIHBvc3RFdmVudChldmVudCk7XG59XG5cbmZ1bmN0aW9uIHBvc3RSZWFjdGlvbldpZGdldE9wZW5lZChwYWdlRGF0YSwgY29udGFpbmVyRGF0YSwgY29udGVudERhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgZXZlbnQgPSBjcmVhdGVFdmVudChldmVudFR5cGVzLnJlYWN0aW9uV2lkZ2V0T3BlbmVkLCAnJywgZ3JvdXBTZXR0aW5ncyk7XG4gICAgYXBwZW5kUGFnZURhdGFQYXJhbXMoZXZlbnQsIHBhZ2VEYXRhKTtcbiAgICBldmVudFthdHRyaWJ1dGVzLmNvbnRhaW5lckhhc2hdID0gY29udGFpbmVyRGF0YS5oYXNoO1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMuY29udGFpbmVyS2luZF0gPSBjb250ZW50RGF0YS50eXBlO1xuICAgIHBvc3RFdmVudChldmVudCk7XG5cbiAgICB2YXIgY3VzdG9tRXZlbnQgPSBjcmVhdGVDdXN0b21FdmVudChlbWl0RXZlbnRUeXBlcy5yZWFjdGlvblZpZXcpO1xuICAgIGVtaXRFdmVudChjdXN0b21FdmVudCk7XG59XG5cbmZ1bmN0aW9uIHBvc3RTdW1tYXJ5T3BlbmVkKHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGV2ZW50ID0gY3JlYXRlRXZlbnQoZXZlbnRUeXBlcy5zdW1tYXJ5V2lkZ2V0LCAnJywgZ3JvdXBTZXR0aW5ncyk7XG4gICAgYXBwZW5kUGFnZURhdGFQYXJhbXMoZXZlbnQsIHBhZ2VEYXRhKTtcbiAgICBwb3N0RXZlbnQoZXZlbnQpO1xuXG4gICAgdmFyIGN1c3RvbUV2ZW50ID0gY3JlYXRlQ3VzdG9tRXZlbnQoZW1pdEV2ZW50VHlwZXMucmVhY3Rpb25WaWV3KTtcbiAgICBlbWl0RXZlbnQoY3VzdG9tRXZlbnQpO1xufVxuXG5mdW5jdGlvbiBwb3N0UmVhY3Rpb25DcmVhdGVkKHBhZ2VEYXRhLCBjb250YWluZXJEYXRhLCByZWFjdGlvbkRhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgZXZlbnQgPSBjcmVhdGVFdmVudChldmVudFR5cGVzLnJlYWN0aW9uQ3JlYXRlZCwgcmVhY3Rpb25EYXRhLnRleHQsIGdyb3VwU2V0dGluZ3MpO1xuICAgIGFwcGVuZFBhZ2VEYXRhUGFyYW1zKGV2ZW50LCBwYWdlRGF0YSk7XG4gICAgYXBwZW5kQ29udGFpbmVyRGF0YVBhcmFtcyhldmVudCwgY29udGFpbmVyRGF0YSk7XG4gICAgYXBwZW5kUmVhY3Rpb25EYXRhUGFyYW1zKGV2ZW50LCByZWFjdGlvbkRhdGEpO1xuICAgIHBvc3RFdmVudChldmVudCk7XG5cbiAgICB2YXIgZXZlbnREZXRhaWwgPSB7XG4gICAgICAgIHJlYWN0aW9uOiByZWFjdGlvbkRhdGEudGV4dCxcbiAgICAgICAgY29udGVudDogcmVhY3Rpb25EYXRhLmNvbnRlbnQuYm9keVxuICAgIH07XG4gICAgc3dpdGNoIChyZWFjdGlvbkRhdGEuY29udGVudC5raW5kKSB7IC8vIE1hcCBvdXIgaW50ZXJuYWwgY29udGVudCB0eXBlcyB0byBiZXR0ZXIgdmFsdWVzIGZvciBjb25zdW1lcnNcbiAgICAgICAgY2FzZSAndHh0JzpcbiAgICAgICAgICAgIGV2ZW50RGV0YWlsLmNvbnRlbnRUeXBlID0gJ3RleHQnO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2ltZyc6XG4gICAgICAgICAgICBldmVudERldGFpbC5jb250ZW50VHlwZSA9ICdpbWFnZSc7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnbWVkJzpcbiAgICAgICAgICAgIGV2ZW50RGV0YWlsLmNvbnRlbnRUeXBlID0gJ21lZGlhJztcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgZXZlbnREZXRhaWwuY29udGVudFR5cGUgPSByZWFjdGlvbkRhdGEuY29udGVudC5raW5kO1xuICAgIH1cbiAgICB2YXIgY3VzdG9tRXZlbnQgPSBjcmVhdGVDdXN0b21FdmVudChlbWl0RXZlbnRUeXBlcy5yZWFjdGlvbkNyZWF0ZSwgZXZlbnREZXRhaWwpO1xuICAgIGVtaXRFdmVudChjdXN0b21FdmVudCk7XG59XG5cbmZ1bmN0aW9uIHBvc3RSZWFjdGlvblNoYXJlZCh0YXJnZXQsIHBhZ2VEYXRhLCBjb250YWluZXJEYXRhLCByZWFjdGlvbkRhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgZXZlbnRWYWx1ZSA9IHRhcmdldDsgLy8gJ2ZhY2Vib29rJywgJ3R3aXR0ZXInLCBldGNcbiAgICB2YXIgZXZlbnQgPSBjcmVhdGVFdmVudChldmVudFR5cGVzLnJlYWN0aW9uU2hhcmVkLCBldmVudFZhbHVlLCBncm91cFNldHRpbmdzKTtcbiAgICBhcHBlbmRQYWdlRGF0YVBhcmFtcyhldmVudCwgcGFnZURhdGEpO1xuICAgIGFwcGVuZENvbnRhaW5lckRhdGFQYXJhbXMoZXZlbnQsIGNvbnRhaW5lckRhdGEpO1xuICAgIGFwcGVuZFJlYWN0aW9uRGF0YVBhcmFtcyhldmVudCwgcmVhY3Rpb25EYXRhKTtcbiAgICBwb3N0RXZlbnQoZXZlbnQpO1xuXG4gICAgdmFyIGN1c3RvbUV2ZW50ID0gY3JlYXRlQ3VzdG9tRXZlbnQoZW1pdEV2ZW50VHlwZXMucmVhY3Rpb25TaGFyZSk7XG4gICAgZW1pdEV2ZW50KGN1c3RvbUV2ZW50KTtcbn1cblxuZnVuY3Rpb24gcG9zdExvY2F0aW9uc1ZpZXdlZChwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBldmVudCA9IGNyZWF0ZUV2ZW50KGV2ZW50VHlwZXMuc3VtbWFyeVdpZGdldCwgZXZlbnRWYWx1ZXMubG9jYXRpb25zVmlld2VkLCBncm91cFNldHRpbmdzKTtcbiAgICBhcHBlbmRQYWdlRGF0YVBhcmFtcyhldmVudCwgcGFnZURhdGEpO1xuICAgIHBvc3RFdmVudChldmVudCk7XG5cbiAgICB2YXIgY3VzdG9tRXZlbnQgPSBjcmVhdGVDdXN0b21FdmVudChlbWl0RXZlbnRUeXBlcy5jb250ZW50V2l0aFJlYWN0aW9uVmlldyk7XG4gICAgZW1pdEV2ZW50KGN1c3RvbUV2ZW50KTtcbn1cblxuZnVuY3Rpb24gcG9zdENvbnRlbnRWaWV3ZWQocGFnZURhdGEsIGNvbnRhaW5lckRhdGEsIGxvY2F0aW9uRGF0YSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBldmVudCA9IGNyZWF0ZUV2ZW50KGV2ZW50VHlwZXMuc3VtbWFyeVdpZGdldCwgZXZlbnRWYWx1ZXMuY29udGVudFZpZXdlZCwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgYXBwZW5kUGFnZURhdGFQYXJhbXMoZXZlbnQsIHBhZ2VEYXRhKTtcbiAgICBhcHBlbmRDb250YWluZXJEYXRhUGFyYW1zKGV2ZW50LCBjb250YWluZXJEYXRhKTtcbiAgICBldmVudFthdHRyaWJ1dGVzLmNvbnRlbnRJZF0gPSBsb2NhdGlvbkRhdGEuY29udGVudElkO1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMuY29udGVudExvY2F0aW9uXSA9IGxvY2F0aW9uRGF0YS5sb2NhdGlvbjtcbiAgICBwb3N0RXZlbnQoZXZlbnQpO1xuXG4gICAgdmFyIGN1c3RvbUV2ZW50ID0gY3JlYXRlQ3VzdG9tRXZlbnQoZW1pdEV2ZW50VHlwZXMuY29udGVudFdpdGhSZWFjdGlvbkZpbmQpO1xuICAgIGVtaXRFdmVudChjdXN0b21FdmVudCk7XG59XG5cbmZ1bmN0aW9uIHBvc3RMZWdhY3lSZWNpcmNDbGlja2VkKHBhZ2VEYXRhLCByZWFjdGlvbklkLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGV2ZW50ID0gY3JlYXRlRXZlbnQoZXZlbnRUeXBlcy5yZWNpcmNDbGlja2VkLCByZWFjdGlvbklkLCBncm91cFNldHRpbmdzKTtcbiAgICBhcHBlbmRQYWdlRGF0YVBhcmFtcyhldmVudCwgcGFnZURhdGEpO1xuICAgIHBvc3RFdmVudChldmVudCk7XG59XG5cbmZ1bmN0aW9uIHBvc3RDb250ZW50UmVjTG9hZGVkKHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGV2ZW50ID0gY3JlYXRlRXZlbnQoZXZlbnRUeXBlcy5jb250ZW50UmVjTG9hZGVkLCAnJywgZ3JvdXBTZXR0aW5ncyk7XG4gICAgYXBwZW5kUGFnZURhdGFQYXJhbXMoZXZlbnQsIHBhZ2VEYXRhKTtcbiAgICBwb3N0RXZlbnQoZXZlbnQpO1xufVxuXG5mdW5jdGlvbiBwb3N0Q29udGVudFJlY1Zpc2libGUocGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgZXZlbnQgPSBjcmVhdGVFdmVudChldmVudFR5cGVzLmNvbnRlbnRSZWNWaXNpYmxlLCAnJywgZ3JvdXBTZXR0aW5ncyk7XG4gICAgYXBwZW5kUGFnZURhdGFQYXJhbXMoZXZlbnQsIHBhZ2VEYXRhKTtcbiAgICBwb3N0RXZlbnQoZXZlbnQpO1xufVxuXG5mdW5jdGlvbiBwb3N0Q29udGVudFJlY0NsaWNrZWQocGFnZURhdGEsIHRhcmdldFVybCwgY29udGVudElkLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGV2ZW50ID0gY3JlYXRlRXZlbnQoZXZlbnRUeXBlcy5jb250ZW50UmVjQ2xpY2tlZCwgdGFyZ2V0VXJsLCBncm91cFNldHRpbmdzKTtcbiAgICBldmVudFthdHRyaWJ1dGVzLmNvbnRlbnRJZF0gPSBjb250ZW50SWQ7XG4gICAgYXBwZW5kUGFnZURhdGFQYXJhbXMoZXZlbnQsIHBhZ2VEYXRhKTtcbiAgICBwb3N0RXZlbnQoZXZlbnQsIHRydWUpO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVDb250ZW50UmVjQ2xpY2tlZEV2ZW50KHBhZ2VEYXRhLCB0YXJnZXRVcmwsIGNvbnRlbnRJZCwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBldmVudCA9IGNyZWF0ZUV2ZW50KGV2ZW50VHlwZXMuY29udGVudFJlY0NsaWNrZWQsIHRhcmdldFVybCwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5jb250ZW50SWRdID0gY29udGVudElkO1xuICAgIGFwcGVuZFBhZ2VEYXRhUGFyYW1zKGV2ZW50LCBwYWdlRGF0YSk7XG4gICAgcmV0dXJuIGV2ZW50O1xufVxuXG5mdW5jdGlvbiBwb3N0UmVhZE1vcmVMb2FkZWQocGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgZXZlbnQgPSBjcmVhdGVFdmVudChldmVudFR5cGVzLnJlYWRNb3JlTG9hZGVkLCAnJywgZ3JvdXBTZXR0aW5ncyk7XG4gICAgYXBwZW5kUGFnZURhdGFQYXJhbXMoZXZlbnQsIHBhZ2VEYXRhKTtcbiAgICBwb3N0RXZlbnQoZXZlbnQpO1xuXG4gICAgdmFyIGN1c3RvbUV2ZW50ID0gY3JlYXRlQ3VzdG9tRXZlbnQoZW1pdEV2ZW50VHlwZXMucmVhZE1vcmVMb2FkKTtcbiAgICBlbWl0RXZlbnQoY3VzdG9tRXZlbnQpO1xufVxuXG5mdW5jdGlvbiBwb3N0UmVhZE1vcmVWaXNpYmxlKHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGV2ZW50ID0gY3JlYXRlRXZlbnQoZXZlbnRUeXBlcy5yZWFkTW9yZVZpc2libGUsICcnLCBncm91cFNldHRpbmdzKTtcbiAgICBhcHBlbmRQYWdlRGF0YVBhcmFtcyhldmVudCwgcGFnZURhdGEpO1xuICAgIHBvc3RFdmVudChldmVudCk7XG5cbiAgICB2YXIgY3VzdG9tRXZlbnQgPSBjcmVhdGVDdXN0b21FdmVudChlbWl0RXZlbnRUeXBlcy5yZWFkTW9yZVZpZXcpO1xuICAgIGVtaXRFdmVudChjdXN0b21FdmVudCk7XG59XG5cbmZ1bmN0aW9uIHBvc3RSZWFkTW9yZUNsaWNrZWQocGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgZXZlbnQgPSBjcmVhdGVFdmVudChldmVudFR5cGVzLnJlYWRNb3JlQ2xpY2tlZCwgJycsIGdyb3VwU2V0dGluZ3MpO1xuICAgIGFwcGVuZFBhZ2VEYXRhUGFyYW1zKGV2ZW50LCBwYWdlRGF0YSk7XG4gICAgcG9zdEV2ZW50KGV2ZW50KTtcblxuICAgIHZhciBjdXN0b21FdmVudCA9IGNyZWF0ZUN1c3RvbUV2ZW50KGVtaXRFdmVudFR5cGVzLnJlYWRNb3JlQ2xpY2spO1xuICAgIGVtaXRFdmVudChjdXN0b21FdmVudCk7XG59XG5cbmZ1bmN0aW9uIHBvc3RGYWNlYm9va0xvZ2luU3RhcnQoZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBldmVudCA9IGNyZWF0ZUV2ZW50KGV2ZW50VHlwZXMuZmFjZWJvb2tMb2dpbkF0dGVtcHQsIGV2ZW50VmFsdWVzLnN0YXJ0LCBncm91cFNldHRpbmdzKTtcbiAgICBwb3N0RXZlbnQoZXZlbnQpO1xufVxuXG5mdW5jdGlvbiBwb3N0RmFjZWJvb2tMb2dpbkZhaWwoZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBldmVudCA9IGNyZWF0ZUV2ZW50KGV2ZW50VHlwZXMuZmFjZWJvb2tMb2dpbkF0dGVtcHQsIGV2ZW50VmFsdWVzLmZhaWwsIGdyb3VwU2V0dGluZ3MpO1xuICAgIHBvc3RFdmVudChldmVudCk7XG59XG5cbmZ1bmN0aW9uIHBvc3RBbnRlbm5hTG9naW5TdGFydChncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGV2ZW50ID0gY3JlYXRlRXZlbnQoZXZlbnRUeXBlcy5hbnRlbm5hTG9naW5BdHRlbXB0LCBldmVudFZhbHVlcy5zdGFydCwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgcG9zdEV2ZW50KGV2ZW50KTtcbn1cblxuZnVuY3Rpb24gcG9zdEFudGVubmFMb2dpbkZhaWwoZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBldmVudCA9IGNyZWF0ZUV2ZW50KGV2ZW50VHlwZXMuYW50ZW5uYUxvZ2luQXR0ZW1wdCwgZXZlbnRWYWx1ZXMuZmFpbCwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgcG9zdEV2ZW50KGV2ZW50KTtcbn1cblxuZnVuY3Rpb24gYXBwZW5kUGFnZURhdGFQYXJhbXMoZXZlbnQsIHBhZ2VEYXRhKSB7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5wYWdlSWRdID0gcGFnZURhdGEucGFnZUlkO1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMucGFnZVRpdGxlXSA9IHBhZ2VEYXRhLnRpdGxlO1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMuY2Fub25pY2FsVXJsXSA9IHBhZ2VEYXRhLmNhbm9uaWNhbFVybDtcbiAgICBldmVudFthdHRyaWJ1dGVzLnBhZ2VVcmxdID0gcGFnZURhdGEucmVxdWVzdGVkVXJsO1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMuYXJ0aWNsZUhlaWdodF0gPSAwIHx8IHBhZ2VEYXRhLm1ldHJpY3MuaGVpZ2h0O1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMucGFnZVRvcGljc10gPSBwYWdlRGF0YS50b3BpY3M7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5hdXRob3JdID0gcGFnZURhdGEuYXV0aG9yO1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMuc2l0ZVNlY3Rpb25dID0gcGFnZURhdGEuc2VjdGlvbjtcbn1cblxuZnVuY3Rpb24gYXBwZW5kQ29udGFpbmVyRGF0YVBhcmFtcyhldmVudCwgY29udGFpbmVyRGF0YSkge1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMuY29udGFpbmVySGFzaF0gPSBjb250YWluZXJEYXRhLmhhc2g7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5jb250YWluZXJLaW5kXSA9IGNvbnRhaW5lckRhdGEudHlwZTtcbn1cblxuZnVuY3Rpb24gYXBwZW5kUmVhY3Rpb25EYXRhUGFyYW1zKGV2ZW50LCByZWFjdGlvbkRhdGEpIHtcbiAgICBldmVudFthdHRyaWJ1dGVzLnJlYWN0aW9uQm9keV0gPSByZWFjdGlvbkRhdGEudGV4dDtcbiAgICBpZiAocmVhY3Rpb25EYXRhLmNvbnRlbnQpIHtcbiAgICAgICAgZXZlbnRbYXR0cmlidXRlcy5jb250ZW50TG9jYXRpb25dID0gcmVhY3Rpb25EYXRhLmNvbnRlbnQubG9jYXRpb247XG4gICAgICAgIGV2ZW50W2F0dHJpYnV0ZXMuY29udGVudElkXSA9IHJlYWN0aW9uRGF0YS5jb250ZW50LmlkO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gY3JlYXRlRXZlbnQoZXZlbnRUeXBlLCBldmVudFZhbHVlLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIHJlZmVycmVyRG9tYWluID0gZG9jdW1lbnQucmVmZXJyZXIuc3BsaXQoJy8nKS5zcGxpY2UoMikuam9pbignLycpOyAvLyBUT0RPOiBlbmdhZ2VfZnVsbCBjb2RlLiBSZXZpZXdcblxuICAgIHZhciBldmVudCA9IHt9O1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMuZXZlbnRUeXBlXSA9IGV2ZW50VHlwZTtcbiAgICBldmVudFthdHRyaWJ1dGVzLmV2ZW50VmFsdWVdID0gZXZlbnRWYWx1ZTtcbiAgICBldmVudFthdHRyaWJ1dGVzLmdyb3VwSWRdID0gZ3JvdXBTZXR0aW5ncy5ncm91cElkKCk7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5zaG9ydFRlcm1TZXNzaW9uXSA9IFNlc3Npb25EYXRhLmdldFNob3J0VGVybVNlc3Npb24oKTtcbiAgICBldmVudFthdHRyaWJ1dGVzLmxvbmdUZXJtU2Vzc2lvbl0gPSBTZXNzaW9uRGF0YS5nZXRMb25nVGVybVNlc3Npb24oKTtcbiAgICBldmVudFthdHRyaWJ1dGVzLnJlZmVycmVyVXJsXSA9IHJlZmVycmVyRG9tYWluO1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMuaXNUb3VjaEJyb3dzZXJdID0gQnJvd3Nlck1ldHJpY3Muc3VwcG9ydHNUb3VjaCgpO1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMuc2NyZWVuV2lkdGhdID0gc2NyZWVuLndpZHRoO1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMuc2NyZWVuSGVpZ2h0XSA9IHNjcmVlbi5oZWlnaHQ7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5waXhlbERlbnNpdHldID0gd2luZG93LmRldmljZVBpeGVsUmF0aW8gfHwgTWF0aC5yb3VuZCh3aW5kb3cuc2NyZWVuLmF2YWlsV2lkdGggLyBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50V2lkdGgpOyAvLyBUT0RPOiByZXZpZXcgdGhpcyBlbmdhZ2VfZnVsbCBjb2RlLCB3aGljaCBkb2Vzbid0IHNlZW0gY29ycmVjdFxuICAgIGV2ZW50W2F0dHJpYnV0ZXMudXNlckFnZW50XSA9IG5hdmlnYXRvci51c2VyQWdlbnQ7XG4gICAgdmFyIHNlZ21lbnQgPSBTZWdtZW50LmdldFNlZ21lbnQoZ3JvdXBTZXR0aW5ncyk7XG4gICAgaWYgKHNlZ21lbnQpIHtcbiAgICAgICAgZXZlbnRbYXR0cmlidXRlcy5jb250ZW50QXR0cmlidXRlc10gPSBzZWdtZW50O1xuICAgIH1cbiAgICByZXR1cm4gZXZlbnQ7XG59XG5cbmZ1bmN0aW9uIHBvc3RFdmVudChldmVudCwgc2VuZEFzVHJhY2tpbmdFdmVudCkge1xuICAgIHZhciB1c2VySW5mbyA9IFVzZXIuY2FjaGVkVXNlcigpOyAvLyBXZSBkb24ndCB3YW50IHRvIGNyZWF0ZSB1c2VycyBqdXN0IGZvciBldmVudHMgKGUuZy4gZXZlcnkgc2NyaXB0IGxvYWQpLCBidXQgYWRkIHVzZXIgaW5mbyBpZiB3ZSBoYXZlIGl0IGFscmVhZHkuXG4gICAgaWYgKHVzZXJJbmZvKSB7XG4gICAgICAgIGV2ZW50W2F0dHJpYnV0ZXMudXNlcklkXSA9IHVzZXJJbmZvLnVzZXJfaWQ7XG4gICAgfVxuICAgIGZpbGxJbk1pc3NpbmdQcm9wZXJ0aWVzKGV2ZW50KTtcbiAgICAvLyBTZW5kIHRoZSBldmVudCB0byBCaWdRdWVyeVxuICAgIGlmIChzZW5kQXNUcmFja2luZ0V2ZW50KSB7XG4gICAgICAgIEFqYXhDbGllbnQucG9zdFRyYWNraW5nRXZlbnQoZXZlbnQpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIEFqYXhDbGllbnQucG9zdEV2ZW50KGV2ZW50KTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUN1c3RvbUV2ZW50KGV2ZW50VHlwZSwgZXZlbnREZXRhaWwpIHtcbiAgICBldmVudERldGFpbCA9IGV2ZW50RGV0YWlsIHx8IHt9O1xuICAgIGV2ZW50RGV0YWlsLnVzZXJJZCA9IFNlc3Npb25EYXRhLmdldExvbmdUZXJtU2Vzc2lvbigpO1xuXG4gICAgdmFyIGN1c3RvbUV2ZW50O1xuICAgIGlmICh0eXBlb2Ygd2luZG93LkN1c3RvbUV2ZW50ID09PSBcImZ1bmN0aW9uXCIgKSB7XG4gICAgICAgIGN1c3RvbUV2ZW50ID0gbmV3IEN1c3RvbUV2ZW50KGV2ZW50VHlwZSwgeyBkZXRhaWw6IGV2ZW50RGV0YWlsIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIERlcHJlY2F0ZWQgQVBJIGZvciBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eSArIElFXG4gICAgICAgIGN1c3RvbUV2ZW50ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ0N1c3RvbUV2ZW50Jyk7XG4gICAgICAgIGN1c3RvbUV2ZW50LmluaXRDdXN0b21FdmVudChldmVudFR5cGUsIHRydWUsIHRydWUsIGV2ZW50RGV0YWlsKTtcbiAgICB9XG4gICAgTG9nZ2luZy5kZWJ1Z01lc3NhZ2UoJ0VtaXR0aW5nIGV2ZW50LiB0eXBlOiAnICsgZXZlbnRUeXBlICsgJyBkZXRhaWw6ICcgKyBKU09OLnN0cmluZ2lmeShldmVudERldGFpbCkpO1xuICAgIHJldHVybiBjdXN0b21FdmVudDtcbn1cblxuZnVuY3Rpb24gZW1pdEV2ZW50KGN1c3RvbUV2ZW50KSB7XG4gICAgZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChjdXN0b21FdmVudCk7XG59XG5cbi8vIEZpbGwgaW4gYW55IG9wdGlvbmFsIHByb3BlcnRpZXMgd2l0aCBudWxsIHZhbHVlcy5cbmZ1bmN0aW9uIGZpbGxJbk1pc3NpbmdQcm9wZXJ0aWVzKGV2ZW50KSB7XG4gICAgZm9yICh2YXIgYXR0ciBpbiBhdHRyaWJ1dGVzKSB7XG4gICAgICAgIGlmIChldmVudFthdHRyaWJ1dGVzW2F0dHJdXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBldmVudFthdHRyaWJ1dGVzW2F0dHJdXSA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbnZhciBhdHRyaWJ1dGVzID0ge1xuICAgIGV2ZW50VHlwZTogJ2V0JyxcbiAgICBldmVudFZhbHVlOiAnZXYnLFxuICAgIGdyb3VwSWQ6ICdnaWQnLFxuICAgIHVzZXJJZDogJ3VpZCcsXG4gICAgcGFnZUlkOiAncGlkJyxcbiAgICBsb25nVGVybVNlc3Npb246ICdsdHMnLFxuICAgIHNob3J0VGVybVNlc3Npb246ICdzdHMnLFxuICAgIHJlZmVycmVyVXJsOiAncmVmJyxcbiAgICBjb250ZW50SWQ6ICdjaWQnLFxuICAgIGFydGljbGVIZWlnaHQ6ICdhaCcsXG4gICAgY29udGFpbmVySGFzaDogJ2NoJyxcbiAgICBjb250YWluZXJLaW5kOiAnY2snLFxuICAgIHJlYWN0aW9uQm9keTogJ3InLFxuICAgIHBhZ2VUaXRsZTogJ3B0JyxcbiAgICBjYW5vbmljYWxVcmw6ICdjdScsXG4gICAgcGFnZVVybDogJ3B1JyxcbiAgICBjb250ZW50QXR0cmlidXRlczogJ2NhJyxcbiAgICBjb250ZW50TG9jYXRpb246ICdjbCcsXG4gICAgcGFnZVRvcGljczogJ3B0b3AnLFxuICAgIGF1dGhvcjogJ2EnLFxuICAgIHNpdGVTZWN0aW9uOiAnc2VjJyxcbiAgICBpc1RvdWNoQnJvd3NlcjogJ2l0JyxcbiAgICBzY3JlZW5XaWR0aDogJ3N3JyxcbiAgICBzY3JlZW5IZWlnaHQ6ICdzaCcsXG4gICAgcGl4ZWxEZW5zaXR5OiAncGQnLFxuICAgIHVzZXJBZ2VudDogJ3VhJ1xufTtcblxudmFyIGV2ZW50VHlwZXMgPSB7XG4gICAgc2NyaXB0TG9hZDogJ3NsJyxcbiAgICByZWFjdGlvblNoYXJlZDogJ3NoJyxcbiAgICBzdW1tYXJ5V2lkZ2V0OiAnc2InLFxuICAgIHJlYWN0aW9uV2lkZ2V0T3BlbmVkOiAncnMnLFxuICAgIHBhZ2VEYXRhTG9hZGVkOiAnd2wnLFxuICAgIC8vIGNvbW1lbnRDcmVhdGVkOiAnYycsXG4gICAgcmVhY3Rpb25DcmVhdGVkOiAncmUnLFxuICAgIC8vIGNvbW1lbnRzVmlld2VkOiAndmNvbScsXG4gICAgcmVjaXJjQ2xpY2tlZDogJ3JjJyxcbiAgICBjb250ZW50UmVjTG9hZGVkOiAnY3JsJyxcbiAgICBjb250ZW50UmVjVmlzaWJsZTogJ2NydicsXG4gICAgY29udGVudFJlY0NsaWNrZWQ6ICdjcmMnLFxuICAgIHJlYWRNb3JlTG9hZGVkOiAncm1sJyxcbiAgICByZWFkTW9yZVZpc2libGU6ICdybXYnLFxuICAgIHJlYWRNb3JlQ2xpY2tlZDogJ3JtYycsXG4gICAgZmFjZWJvb2tMb2dpbkF0dGVtcHQ6ICdsb2dpbiBhdHRlbXB0IGZhY2Vib29rJyxcbiAgICBhbnRlbm5hTG9naW5BdHRlbXB0OiAnbG9naW4gYXR0ZW1wdCBhbnRlbm5hJ1xufTtcblxudmFyIGV2ZW50VmFsdWVzID0ge1xuICAgIGNvbnRlbnRWaWV3ZWQ6ICd2YycsIC8vIHZpZXdfY29udGVudFxuICAgIGxvY2F0aW9uc1ZpZXdlZDogJ3ZyJywgLy8gdmlld19yZWFjdGlvbnNcbiAgICAvLyBzaG93RGVmYXVsdHM6ICd3cicsXG4gICAgLy8gc2hvd1JlYWN0aW9uczogJ3JkJyxcbiAgICBzaW5nbGVQYWdlOiAnc2knLFxuICAgIG11bHRpcGxlUGFnZXM6ICdtdScsXG4gICAgdmlld1JlYWN0aW9uczogJ3Z3JyxcbiAgICB2aWV3RGVmYXVsdHM6ICdhZCcsXG4gICAgc3RhcnQ6ICdzdGFydCcsXG4gICAgZmFpbDogJ2ZhaWwnXG59O1xuXG52YXIgZW1pdEV2ZW50VHlwZXMgPSB7XG4gICAgcmVhY3Rpb25WaWV3OiAnYW50ZW5uYS5yZWFjdGlvblZpZXcnLFxuICAgIHJlYWN0aW9uQ3JlYXRlOiAnYW50ZW5uYS5yZWFjdGlvbkNyZWF0ZScsXG4gICAgcmVhY3Rpb25TaGFyZTogJ2FudGVubmEucmVhY3Rpb25TaGFyZScsXG4gICAgY29udGVudFdpdGhSZWFjdGlvblZpZXc6ICdhbnRlbm5hLmNvbnRlbnRXaXRoUmVhY3Rpb25WaWV3JyxcbiAgICBjb250ZW50V2l0aFJlYWN0aW9uRmluZDogJ2FudGVubmEuY29udGVudFdpdGhSZWFjdGlvbkZpbmQnLFxuICAgIHJlYWRNb3JlTG9hZDogJ2FudGVubmEucmVhZE1vcmVMb2FkJyxcbiAgICByZWFkTW9yZVZpZXc6ICdhbnRlbm5hLnJlYWRNb3JlVmlldycsXG4gICAgcmVhZE1vcmVDbGljazogJ2FudGVubmEucmVhZE1vcmVDbGljaydcbn07XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBwb3N0R3JvdXBTZXR0aW5nc0xvYWRlZDogcG9zdEdyb3VwU2V0dGluZ3NMb2FkZWQsXG4gICAgcG9zdFBhZ2VEYXRhTG9hZGVkOiBwb3N0UGFnZURhdGFMb2FkZWQsXG4gICAgcG9zdFN1bW1hcnlPcGVuZWQ6IHBvc3RTdW1tYXJ5T3BlbmVkLFxuICAgIHBvc3RSZWFjdGlvbldpZGdldE9wZW5lZDogcG9zdFJlYWN0aW9uV2lkZ2V0T3BlbmVkLFxuICAgIHBvc3RSZWFjdGlvbkNyZWF0ZWQ6IHBvc3RSZWFjdGlvbkNyZWF0ZWQsXG4gICAgcG9zdFJlYWN0aW9uU2hhcmVkOiBwb3N0UmVhY3Rpb25TaGFyZWQsXG4gICAgcG9zdExvY2F0aW9uc1ZpZXdlZDogcG9zdExvY2F0aW9uc1ZpZXdlZCxcbiAgICBwb3N0Q29udGVudFZpZXdlZDogcG9zdENvbnRlbnRWaWV3ZWQsXG4gICAgcG9zdExlZ2FjeVJlY2lyY0NsaWNrZWQ6IHBvc3RMZWdhY3lSZWNpcmNDbGlja2VkLFxuICAgIHBvc3RDb250ZW50UmVjTG9hZGVkOiBwb3N0Q29udGVudFJlY0xvYWRlZCxcbiAgICBwb3N0Q29udGVudFJlY1Zpc2libGU6IHBvc3RDb250ZW50UmVjVmlzaWJsZSxcbiAgICBwb3N0Q29udGVudFJlY0NsaWNrZWQ6IHBvc3RDb250ZW50UmVjQ2xpY2tlZCxcbiAgICBjcmVhdGVDb250ZW50UmVjQ2xpY2tlZEV2ZW50OiBjcmVhdGVDb250ZW50UmVjQ2xpY2tlZEV2ZW50LFxuICAgIHBvc3RSZWFkTW9yZUxvYWRlZDogcG9zdFJlYWRNb3JlTG9hZGVkLFxuICAgIHBvc3RSZWFkTW9yZVZpc2libGU6IHBvc3RSZWFkTW9yZVZpc2libGUsXG4gICAgcG9zdFJlYWRNb3JlQ2xpY2tlZDogcG9zdFJlYWRNb3JlQ2xpY2tlZCxcbiAgICBwb3N0RmFjZWJvb2tMb2dpblN0YXJ0OiBwb3N0RmFjZWJvb2tMb2dpblN0YXJ0LFxuICAgIHBvc3RGYWNlYm9va0xvZ2luRmFpbDogcG9zdEZhY2Vib29rTG9naW5GYWlsLFxuICAgIHBvc3RBbnRlbm5hTG9naW5TdGFydDogcG9zdEFudGVubmFMb2dpblN0YXJ0LFxuICAgIHBvc3RBbnRlbm5hTG9naW5GYWlsOiBwb3N0QW50ZW5uYUxvZ2luRmFpbFxufTtcbiIsInZhciBSYWN0aXZlOyByZXF1aXJlKCcuL3V0aWxzL3JhY3RpdmUtcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24obG9hZGVkUmFjdGl2ZSkgeyBSYWN0aXZlID0gbG9hZGVkUmFjdGl2ZTt9KTtcbnZhciBTVkdzID0gcmVxdWlyZSgnLi9zdmdzJyk7XG5cbnZhciBwYWdlU2VsZWN0b3IgPSAnLmFudGVubmEtZXJyb3ItcGFnZSc7XG5cbmZ1bmN0aW9uIGNyZWF0ZVBhZ2Uob3B0aW9ucykge1xuICAgIHZhciBlbGVtZW50ID0gb3B0aW9ucy5lbGVtZW50O1xuICAgIHZhciBnb0JhY2sgPSBvcHRpb25zLmdvQmFjaztcbiAgICB2YXIgcmFjdGl2ZSA9IFJhY3RpdmUoe1xuICAgICAgICBlbDogZWxlbWVudCxcbiAgICAgICAgYXBwZW5kOiB0cnVlLFxuICAgICAgICBkYXRhOiB7fSxcbiAgICAgICAgdGVtcGxhdGU6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9nZW5lcmljLWVycm9yLXBhZ2UuaGJzLmh0bWwnKSxcbiAgICAgICAgcGFydGlhbHM6IHtcbiAgICAgICAgICAgIGxlZnQ6IFNWR3MubGVmdFxuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmFjdGl2ZS5vbignYmFjaycsIGdvQmFjayk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgc2VsZWN0b3I6IHBhZ2VTZWxlY3RvcixcbiAgICAgICAgdGVhcmRvd246IGZ1bmN0aW9uKCkgeyByYWN0aXZlLnRlYXJkb3duKCk7IH1cbiAgICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGVQYWdlOiBjcmVhdGVQYWdlXG59OyIsInZhciAkOyByZXF1aXJlKCcuL3V0aWxzL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIEFqYXhDbGllbnQgPSByZXF1aXJlKCcuL3V0aWxzL2FqYXgtY2xpZW50Jyk7XG52YXIgVVJMcyA9IHJlcXVpcmUoJy4vdXRpbHMvdXJscycpO1xudmFyIEdyb3VwU2V0dGluZ3MgPSByZXF1aXJlKCcuL2dyb3VwLXNldHRpbmdzJyk7XG5cbi8vIFRPRE8gZm9sZCB0aGlzIG1vZHVsZSBpbnRvIGdyb3VwLXNldHRpbmdzP1xuXG5mdW5jdGlvbiBsb2FkU2V0dGluZ3MoY2FsbGJhY2spIHtcbiAgICBBamF4Q2xpZW50LmdldEpTT05QKFVSTHMuZ3JvdXBTZXR0aW5nc1VybCgpLCB7IGhvc3RfbmFtZTogd2luZG93LmFudGVubmFfaG9zdCB9LCBzdWNjZXNzLCBlcnJvcik7XG5cbiAgICBmdW5jdGlvbiBzdWNjZXNzKGpzb24pIHtcbiAgICAgICAgdmFyIGdyb3VwU2V0dGluZ3MgPSBHcm91cFNldHRpbmdzLmNyZWF0ZShqc29uKTtcbiAgICAgICAgY2FsbGJhY2soZ3JvdXBTZXR0aW5ncyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZXJyb3IobWVzc2FnZSkge1xuICAgICAgICAvLyBUT0RPIGhhbmRsZSBlcnJvcnMgdGhhdCBoYXBwZW4gd2hlbiBsb2FkaW5nIGNvbmZpZyBkYXRhXG4gICAgICAgIGNvbnNvbGUubG9nKCdBbiBlcnJvciBvY2N1cnJlZCBsb2FkaW5nIGdyb3VwIHNldHRpbmdzOiAnICsgbWVzc2FnZSk7XG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgbG9hZDogbG9hZFNldHRpbmdzXG59OyIsInZhciBFdmVudHMgPSByZXF1aXJlKCcuL2V2ZW50cycpO1xuXG52YXIgZ3JvdXBTZXR0aW5ncztcblxuLy8gVE9ETzogVXBkYXRlIGFsbCBjbGllbnRzIHRoYXQgYXJlIHBhc3NpbmcgYXJvdW5kIGEgZ3JvdXBTZXR0aW5ncyBvYmplY3QgdG8gaW5zdGVhZCBhY2Nlc3MgdGhlICdnbG9iYWwnIHNldHRpbmdzIGluc3RhbmNlXG5mdW5jdGlvbiBnZXRHcm91cFNldHRpbmdzKCkge1xuICAgIHJldHVybiBncm91cFNldHRpbmdzO1xufVxuXG5mdW5jdGlvbiB1cGRhdGVGcm9tSlNPTihqc29uKSB7XG4gICAgZ3JvdXBTZXR0aW5ncyA9IGNyZWF0ZUZyb21KU09OKGpzb24pO1xuICAgIEV2ZW50cy5wb3N0R3JvdXBTZXR0aW5nc0xvYWRlZChncm91cFNldHRpbmdzKTtcbiAgICByZXR1cm4gZ3JvdXBTZXR0aW5ncztcbn1cblxudmFyIGRlZmF1bHRzID0ge1xuICAgIGFjdGl2ZV9zZWN0aW9uczogXCJib2R5XCIsXG4gICAgYW5ub193aGl0ZWxpc3Q6IFwicFwiLFxuICAgIG5vX2FudDogXCJcIixcbiAgICBjdXN0b21fY3NzOiBcIlwiLFxuICAgIHBhcmFncmFwaF9oZWxwZXI6IHRydWUsXG4gICAgbWVkaWFfdXJsX2lnbm9yZV9xdWVyeTogdHJ1ZSxcbiAgICBzdW1tYXJ5X3dpZGdldF9zZWxlY3RvcjogJy5hbnQtcGFnZS1zdW1tYXJ5JywgLy8gVE9ETzogdGhpcyB3YXNuJ3QgZGVmaW5lZCBhcyBhIGRlZmF1bHQgaW4gZW5nYWdlX2Z1bGwsIGJ1dCB3YXMgaW4gY29kZS4gd2h5P1xuICAgIHN1bW1hcnlfd2lkZ2V0X21ldGhvZDogJ2FmdGVyJyxcbiAgICBsYW5ndWFnZTogJ2VuJyxcbiAgICBpbWdfaW5kaWNhdG9yX3Nob3dfb25sb2FkOiB0cnVlLFxuICAgIGltZ19pbmRpY2F0b3Jfc2hvd19zaWRlOiAnbGVmdCcsXG4gICAgdGFnX2JveF9iZ19jb2xvcnM6ICcnLFxuICAgIHRhZ19ib3hfdGV4dF9jb2xvcnM6ICcnLFxuICAgIHRhZ19ib3hfZm9udF9mYW1pbHk6ICdIZWx2ZXRpY2FOZXVlLEhlbHZldGljYSxBcmlhbCxzYW5zLXNlcmlmJyxcbiAgICB0YWdzX2JnX2NzczogJycsXG4gICAgaWdub3JlX3N1YmRvbWFpbjogZmFsc2UsXG4gICAgaW1hZ2Vfc2VsZWN0b3I6ICdtZXRhW3Byb3BlcnR5PVwib2c6aW1hZ2VcIl0nLCAvLyBUT0RPOiByZXZpZXcgd2hhdCB0aGlzIHNob3VsZCBiZSAobm90IGZyb20gZW5nYWdlX2Z1bGwpXG4gICAgaW1hZ2VfYXR0cmlidXRlOiAnY29udGVudCcsIC8vIFRPRE86IHJldmlldyB3aGF0IHRoaXMgc2hvdWxkIGJlIChub3QgZnJvbSBlbmdhZ2VfZnVsbCksXG4gICAgcXVlcnlzdHJpbmdfY29udGVudDogZmFsc2UsXG4gICAgaW5pdGlhbF9waW5fbGltaXQ6IDNcbn07XG5cbmZ1bmN0aW9uIGNyZWF0ZUZyb21KU09OKGpzb24pIHtcblxuICAgIGZ1bmN0aW9uIGRhdGEoa2V5LCBpZkFic2VudCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgdmFsdWU7XG4gICAgICAgICAgICBpZiAod2luZG93LmFudGVubmFfZXh0ZW5kKSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSB3aW5kb3cuYW50ZW5uYV9leHRlbmRba2V5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IGpzb25ba2V5XTtcbiAgICAgICAgICAgICAgICAvLyBUT0RPOiBvdXIgc2VydmVyIGFwcGFyZW50bHkgc2VuZHMgYmFjayBudWxsIGFzIGEgdmFsdWUgZm9yIHNvbWUgYXR0cmlidXRlcy5cbiAgICAgICAgICAgICAgICAvLyBUT0RPOiBjb25zaWRlciBjaGVja2luZyBmb3IgbnVsbCB3aGVyZXZlciB3ZSdyZSBjaGVja2luZyBmb3IgdW5kZWZpbmVkXG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09ICcnIHx8IHZhbHVlID09PSBudWxsKSB7IC8vIFRPRE86IFNob3VsZCB0aGUgc2VydmVyIGJlIHNlbmRpbmcgYmFjayAnJyBoZXJlIG9yIG5vdGhpbmcgYXQgYWxsPyAoSXQgcHJlY2x1ZGVzIHRoZSBzZXJ2ZXIgZnJvbSByZWFsbHkgc2F5aW5nICdub3RoaW5nJylcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBkZWZhdWx0c1trZXldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaWZBYnNlbnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZXhjbHVzaW9uU2VsZWN0b3Ioa2V5LCBkZXByZWNhdGVkS2V5KSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBzZWxlY3RvcnMgPSBbXTtcbiAgICAgICAgICAgIHZhciBub0FudCA9IGRhdGEoJ25vX2FudCcpKCk7XG4gICAgICAgICAgICBpZiAobm9BbnQpIHtcbiAgICAgICAgICAgICAgICBzZWxlY3RvcnMucHVzaChub0FudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgbm9SZWFkciA9IGRhdGEoJ25vX3JlYWRyJykoKTtcbiAgICAgICAgICAgIGlmIChub1JlYWRyKSB7XG4gICAgICAgICAgICAgICAgc2VsZWN0b3JzLnB1c2gobm9SZWFkcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gc2VsZWN0b3JzLmpvaW4oJywnKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGJhY2tncm91bmRDb2xvcihhY2Nlc3Nvcikge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgY29sb3JzID0gW107XG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBhY2Nlc3NvcigpO1xuICAgICAgICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgY29sb3JzID0gdmFsdWUuc3BsaXQoJzsnKTtcbiAgICAgICAgICAgICAgICBjb2xvcnMgPSBtaWdyYXRlVmFsdWVzKGNvbG9ycyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gY29sb3JzO1xuXG4gICAgICAgICAgICAvLyBNaWdyYXRlIGFueSBjb2xvcnMgZnJvbSB0aGUgJzEsIDIsIDMnIGZvcm1hdCB0byAncmdiKDEsIDIsIDMpJy4gVGhpcyBjb2RlIGNhbiBiZSBkZWxldGVkIG9uY2Ugd2UndmUgdXBkYXRlZFxuICAgICAgICAgICAgLy8gYWxsIHNpdGVzIHRvIHNwZWNpZnlpbmcgdmFsaWQgQ1NTIGNvbG9yIHZhbHVlc1xuICAgICAgICAgICAgZnVuY3Rpb24gbWlncmF0ZVZhbHVlcyhjb2xvclZhbHVlcykge1xuICAgICAgICAgICAgICAgIHZhciBtaWdyYXRpb25NYXRjaGVyID0gL15cXHMqXFxkK1xccyosXFxzKlxcZCtcXHMqLFxccypcXGQrXFxzKiQvZ2ltO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY29sb3JWYWx1ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gY29sb3JWYWx1ZXNbaV07XG4gICAgICAgICAgICAgICAgICAgIGlmIChtaWdyYXRpb25NYXRjaGVyLnRlc3QodmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xvclZhbHVlc1tpXSA9ICdyZ2IoJyArIHZhbHVlICsgJyknO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBjb2xvclZhbHVlcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRlZmF1bHRSZWFjdGlvbnMoZWxlbWVudCkge1xuICAgICAgICAvLyBEZWZhdWx0IHJlYWN0aW9ucyBhcmUgYXZhaWxhYmxlIGluIHRocmVlIGxvY2F0aW9ucyBpbiB0aHJlZSBkYXRhIGZvcm1hdHM6XG4gICAgICAgIC8vIDEuIEFzIGEgY29tbWEtc2VwYXJhdGVkIGF0dHJpYnV0ZSB2YWx1ZSBvbiBhIHBhcnRpY3VsYXIgZWxlbWVudFxuICAgICAgICAvLyAyLiBBcyBhbiBhcnJheSBvZiBzdHJpbmdzIG9uIHRoZSB3aW5kb3cuYW50ZW5uYV9leHRlbmQgcHJvcGVydHlcbiAgICAgICAgLy8gMy4gQXMgYSBqc29uIG9iamVjdCB3aXRoIGEgYm9keSBhbmQgaWQgb24gdGhlIGdyb3VwIHNldHRpbmdzXG4gICAgICAgIHZhciByZWFjdGlvbnMgPSBbXTtcbiAgICAgICAgdmFyIHJlYWN0aW9uU3RyaW5ncztcbiAgICAgICAgdmFyIGVsZW1lbnRSZWFjdGlvbnMgPSBlbGVtZW50ID8gZWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2FudC1yZWFjdGlvbnMnKSA6IHVuZGVmaW5lZDtcbiAgICAgICAgaWYgKGVsZW1lbnRSZWFjdGlvbnMpIHtcbiAgICAgICAgICAgIHJlYWN0aW9uU3RyaW5ncyA9IGVsZW1lbnRSZWFjdGlvbnMuc3BsaXQoJzsnKTtcbiAgICAgICAgfSBlbHNlIGlmICh3aW5kb3cuYW50ZW5uYV9leHRlbmQpIHtcbiAgICAgICAgICAgIHJlYWN0aW9uU3RyaW5ncyA9IHdpbmRvdy5hbnRlbm5hX2V4dGVuZFsnZGVmYXVsdF9yZWFjdGlvbnMnXTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocmVhY3Rpb25TdHJpbmdzKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJlYWN0aW9uU3RyaW5ncy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHJlYWN0aW9ucy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgdGV4dDogcmVhY3Rpb25TdHJpbmdzW2ldLFxuICAgICAgICAgICAgICAgICAgICBpc0RlZmF1bHQ6IHRydWVcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyIHZhbHVlcyA9IGpzb25bJ2RlZmF1bHRfcmVhY3Rpb25zJ107XG4gICAgICAgICAgICBpZiAodmFsdWVzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHZhbHVlcy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgdmFsdWUgPSB2YWx1ZXNbal07XG4gICAgICAgICAgICAgICAgICAgIHJlYWN0aW9ucy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6IHZhbHVlLmJvZHksXG4gICAgICAgICAgICAgICAgICAgICAgICBpZDogdmFsdWUuaWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBpc0RlZmF1bHQ6IHRydWVcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZWFjdGlvbnM7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY29tcHV0ZUN1c3RvbUNTUygpIHtcbiAgICAgICAgLy8gRmlyc3QgcmVhZCBhbnkgcmF3IGN1c3RvbSBDU1MuXG4gICAgICAgIHZhciBjdXN0b21DU1MgPSBkYXRhKCdjdXN0b21fY3NzJykoKTtcbiAgICAgICAgLy8gVGhlbiBhcHBlbmQgcnVsZXMgZm9yIGFueSBzcGVjaWZpYyBDU1Mgb3ZlcnJpZGVzLlxuICAgICAgICBjdXN0b21DU1MgKz0gY3JlYXRlQ3VzdG9tQ1NTUnVsZShtaWdyYXRlUmVhY3Rpb25zQmFja2dyb3VuZENvbG9yU2V0dGluZ3MoZGF0YSgndGFnc19iZ19jc3MnLCAnJykpLCAnLmFudGVubmEtcmVhY3Rpb25zLXBhZ2UgLmFudGVubmEtYm9keSwgLmFudGVubmEtY29uZmlybWF0aW9uLXBhZ2UgLmFudGVubmEtYm9keScpO1xuICAgICAgICBjdXN0b21DU1MgKz0gY3JlYXRlQ3VzdG9tQ1NTUnVsZShkYXRhKCd0YWdfYm94X2JnX2NvbG9ycycsICcnKSwgJy5hbnRlbm5hLXJlYWN0aW9uLWJveCcpO1xuICAgICAgICBjdXN0b21DU1MgKz0gY3JlYXRlQ3VzdG9tQ1NTUnVsZShkYXRhKCd0YWdfYm94X2JnX2NvbG9yc19ob3ZlcicsICcnKSwgJy5hbnRlbm5hLXJlYWN0aW9uOmhvdmVyID4gLmFudGVubmEtcmVhY3Rpb24tYm94Jyk7XG4gICAgICAgIGN1c3RvbUNTUyArPSBjcmVhdGVDdXN0b21DU1NSdWxlKG1pZ3JhdGVUZXh0Q29sb3JTZXR0aW5ncyhkYXRhKCd0YWdfYm94X3RleHRfY29sb3JzJywgJycpKSwgJy5hbnRlbm5hLXJlYWN0aW9uLWJveCwgLmFudGVubmEtcmVhY3Rpb24tbG9jYXRpb24gLmFudGVubmEtbG9jYXRpb24tcGF0aCwgLmFudGVubmEtY29uZmlybS1yZWFjdGlvbicpO1xuICAgICAgICBjdXN0b21DU1MgKz0gY3JlYXRlQ3VzdG9tQ1NTUnVsZShtaWdyYXRlRm9udEZhbWlseVNldHRpbmcoZGF0YSgndGFnX2JveF9mb250X2ZhbWlseScsICcnKSksICcuYW50ZW5uYS1yZWFjdGlvbi1ib3ggLmFudGVubmEtcmVzZXQsIC5hbnRlbm5hLWNvbmZpcm0tcmVhY3Rpb24nKTtcbiAgICAgICAgcmV0dXJuIGN1c3RvbUNTUztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjcmVhdGVDdXN0b21DU1NSdWxlKGRlY2xhcmF0aW9uc0FjY2Vzc29yLCBzZWxlY3Rvcikge1xuICAgICAgICB2YXIgZGVjbGFyYXRpb25zID0gZGVjbGFyYXRpb25zQWNjZXNzb3IoKS50cmltKCk7XG4gICAgICAgIGlmIChkZWNsYXJhdGlvbnMpIHtcbiAgICAgICAgICAgIHJldHVybiAnXFxuJyArIHNlbGVjdG9yICsgJyB7XFxuICAgICcgKyBkZWNsYXJhdGlvbnMgKyAnXFxufSc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICcnO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1pZ3JhdGVSZWFjdGlvbnNCYWNrZ3JvdW5kQ29sb3JTZXR0aW5ncyhiYWNrZ3JvdW5kQ29sb3JBY2Nlc3Nvcikge1xuICAgICAgICAvLyBUT0RPOiBUaGlzIGlzIHRlbXBvcmFyeSBjb2RlIHRoYXQgbWlncmF0ZXMgdGhlIGN1cnJlbnQgdGFnc19iZ19jc3Mgc2V0dGluZyBmcm9tIGEgcmF3IHZhbHVlIHRvIGFcbiAgICAgICAgLy8gICAgICAgQ1NTIGRlY2xhcmF0aW9uLiBXZSBzaG91bGQgbWlncmF0ZSBhbGwgZGVwbG95ZWQgc2l0ZXMgdG8gdXNlIGEgQ1NTIGRlY2xhcmF0aW9uIGFuZCB0aGVuIHJlbW92ZSB0aGlzLlxuICAgICAgICB2YXIgYmFja2dyb3VuZENvbG9yID0gYmFja2dyb3VuZENvbG9yQWNjZXNzb3IoKS50cmltKCk7XG4gICAgICAgIGlmIChiYWNrZ3JvdW5kQ29sb3IgJiYgYmFja2dyb3VuZENvbG9yLmluZGV4T2YoJ2JhY2tncm91bmQnKSA9PT0gLTEpIHtcbiAgICAgICAgICAgIGJhY2tncm91bmRDb2xvciA9ICdiYWNrZ3JvdW5kLWltYWdlOiAnICsgYmFja2dyb3VuZENvbG9yO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBiYWNrZ3JvdW5kQ29sb3I7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtaWdyYXRlRm9udEZhbWlseVNldHRpbmcoZm9udEZhbWlseUFjY2Vzc29yKSB7XG4gICAgICAgIC8vIFRPRE86IFRoaXMgaXMgdGVtcG9yYXJ5IGNvZGUgdGhhdCBtaWdyYXRlcyB0aGUgY3VycmVudCB0YWdfYm94X2ZvbnRfZmFtaWx5IHNldHRpbmcgZnJvbSBhIHJhdyB2YWx1ZSB0byBhXG4gICAgICAgIC8vICAgICAgIENTUyBkZWNsYXJhdGlvbi4gV2Ugc2hvdWxkIG1pZ3JhdGUgYWxsIGRlcGxveWVkIHNpdGVzIHRvIHVzZSBhIENTUyBkZWNsYXJhdGlvbiBhbmQgdGhlbiByZW1vdmUgdGhpcy5cbiAgICAgICAgdmFyIGZvbnRGYW1pbHkgPSBmb250RmFtaWx5QWNjZXNzb3IoKS50cmltKCk7XG4gICAgICAgIGlmIChmb250RmFtaWx5ICYmIGZvbnRGYW1pbHkuaW5kZXhPZignZm9udC1mYW1pbHknKSA9PT0gLTEpIHtcbiAgICAgICAgICAgIGZvbnRGYW1pbHkgPSAnZm9udC1mYW1pbHk6ICcgKyBmb250RmFtaWx5O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBmb250RmFtaWx5O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWlncmF0ZVRleHRDb2xvclNldHRpbmdzKHRleHRDb2xvckFjY2Vzc29yKSB7XG4gICAgICAgIC8vIFRPRE86IFRoaXMgaXMgdGVtcG9yYXJ5IGNvZGUgdGhhdCBtaWdyYXRlcyB0aGUgY3VycmVudCB0YWdfYm94X3RleHRfY29sb3JzIHByb3BlcnR5LCB3aGljaCBpcyBhIGRlY2xhcmF0aW9uXG4gICAgICAgIC8vICAgICAgIHRoYXQgb25seSBzZXRzIHRoZSBjb2xvciBwcm9wZXJ0eSwgdG8gc2V0IGJvdGggdGhlIGNvbG9yIGFuZCBmaWxsIHByb3BlcnRpZXMuXG4gICAgICAgIHZhciB0ZXh0Q29sb3IgPSB0ZXh0Q29sb3JBY2Nlc3NvcigpLnRyaW0oKTtcbiAgICAgICAgaWYgKHRleHRDb2xvciAmJiB0ZXh0Q29sb3IuaW5kZXhPZignY29sb3I6JykgPT09IDAgJiYgdGV4dENvbG9yLmluZGV4T2YoJ2ZpbGw6JykgPT09IC0xKSB7XG4gICAgICAgICAgICB0ZXh0Q29sb3IgKz0gdGV4dENvbG9yW3RleHRDb2xvci5sZW5ndGggLSAxXSA9PSAnOycgPyAnJyA6ICc7JzsgLy8gYXBwZW5kIGEgc2VtaWNvbG9uIGlmIG5lZWRlZFxuICAgICAgICAgICAgdGV4dENvbG9yICs9IHRleHRDb2xvci5yZXBsYWNlKCdjb2xvcjonLCAnXFxuICAgIGZpbGw6Jyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRleHRDb2xvcjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIGxlZ2FjeUJlaGF2aW9yOiBkYXRhKCdsZWdhY3lfYmVoYXZpb3InLCBmYWxzZSksIC8vIFRPRE86IG1ha2UgdGhpcyByZWFsIGluIHRoZSBzZW5zZSB0aGF0IGl0IGNvbWVzIGJhY2sgZnJvbSB0aGUgc2VydmVyIGFuZCBwcm9iYWJseSBtb3ZlIHRoZSBmbGFnIHRvIHRoZSBwYWdlIGRhdGEuIFVubGlrZWx5IHRoYXQgd2UgbmVlZCB0byBtYWludGFpbiBsZWdhY3kgYmVoYXZpb3IgZm9yIG5ldyBwYWdlcz9cbiAgICAgICAgZ3JvdXBJZDogZGF0YSgnaWQnKSxcbiAgICAgICAgZ3JvdXBOYW1lOiBkYXRhKCduYW1lJyksXG4gICAgICAgIGFjdGl2ZVNlY3Rpb25zOiBkYXRhKCdhY3RpdmVfc2VjdGlvbnMnKSxcbiAgICAgICAgdXJsOiB7XG4gICAgICAgICAgICBpZ25vcmVTdWJkb21haW46IGRhdGEoJ2lnbm9yZV9zdWJkb21haW4nKSxcbiAgICAgICAgICAgIGluY2x1ZGVRdWVyeVN0cmluZzogZGF0YSgncXVlcnlzdHJpbmdfY29udGVudCcpLFxuICAgICAgICAgICAgaWdub3JlTWVkaWFVcmxRdWVyeTogZGF0YSgnbWVkaWFfdXJsX2lnbm9yZV9xdWVyeScpLFxuICAgICAgICAgICAgY2Fub25pY2FsRG9tYWluOiBkYXRhKCdwYWdlX3RsZCcpIC8vIFRPRE86IHdoYXQgdG8gY2FsbCB0aGlzIGV4YWN0bHkuIGdyb3VwRG9tYWluPyBzaXRlRG9tYWluPyBjYW5vbmljYWxEb21haW4/XG4gICAgICAgIH0sXG4gICAgICAgIHN1bW1hcnlTZWxlY3RvcjogZGF0YSgnc3VtbWFyeV93aWRnZXRfc2VsZWN0b3InKSxcbiAgICAgICAgc3VtbWFyeU1ldGhvZDogZGF0YSgnc3VtbWFyeV93aWRnZXRfbWV0aG9kJyksXG4gICAgICAgIGlzSGlkZU9uTW9iaWxlOiBkYXRhKCdoaWRlT25Nb2JpbGUnKSxcbiAgICAgICAgaXNFeHBhbmRlZE1vYmlsZVN1bW1hcnk6IGRhdGEoJ3N1bW1hcnlfd2lkZ2V0X2V4cGFuZGVkX21vYmlsZScpLFxuICAgICAgICBpc0hpZGVUYXBIZWxwZXI6IGRhdGEoJ2hpZGVEb3VibGVUYXBNZXNzYWdlJyksXG4gICAgICAgIHRhcEhlbHBlclBvc2l0aW9uOiBkYXRhKCdkb3VibGVUYXBNZXNzYWdlUG9zaXRpb24nKSxcbiAgICAgICAgcGFnZVNlbGVjdG9yOiBkYXRhKCdwb3N0X3NlbGVjdG9yJyksXG4gICAgICAgIHBhZ2VVcmxTZWxlY3RvcjogZGF0YSgncG9zdF9ocmVmX3NlbGVjdG9yJyksXG4gICAgICAgIHBhZ2VVcmxBdHRyaWJ1dGU6IGRhdGEoJ3Bvc3RfaHJlZl9hdHRyaWJ1dGUnLCAnaHJlZicpLFxuICAgICAgICBwYWdlVGl0bGVTZWxlY3RvcjogZGF0YSgncG9zdF90aXRsZV9zZWxlY3RvcicpLFxuICAgICAgICBwYWdlSW1hZ2VTZWxlY3RvcjogZGF0YSgnaW1hZ2Vfc2VsZWN0b3InKSxcbiAgICAgICAgcGFnZUltYWdlQXR0cmlidXRlOiBkYXRhKCdpbWFnZV9hdHRyaWJ1dGUnKSxcbiAgICAgICAgcGFnZUF1dGhvclNlbGVjdG9yOiBkYXRhKCdhdXRob3Jfc2VsZWN0b3InKSxcbiAgICAgICAgcGFnZUF1dGhvckF0dHJpYnV0ZTogZGF0YSgnYXV0aG9yX2F0dHJpYnV0ZScpLFxuICAgICAgICBwYWdlVG9waWNzU2VsZWN0b3I6IGRhdGEoJ3RvcGljc19zZWxlY3RvcicpLFxuICAgICAgICBwYWdlVG9waWNzQXR0cmlidXRlOiBkYXRhKCd0b3BpY3NfYXR0cmlidXRlJyksXG4gICAgICAgIHBhZ2VTaXRlU2VjdGlvblNlbGVjdG9yOiBkYXRhKCdzZWN0aW9uX3NlbGVjdG9yJyksXG4gICAgICAgIHBhZ2VTaXRlU2VjdGlvbkF0dHJpYnV0ZTogZGF0YSgnc2VjdGlvbl9hdHRyaWJ1dGUnKSxcbiAgICAgICAgY29udGVudFNlbGVjdG9yOiBkYXRhKCdhbm5vX3doaXRlbGlzdCcpLFxuICAgICAgICB0ZXh0SW5kaWNhdG9yTGltaXQ6IGRhdGEoJ2luaXRpYWxfcGluX2xpbWl0JyksXG4gICAgICAgIGVuYWJsZVRleHRIZWxwZXI6IGRhdGEoJ3BhcmFncmFwaF9oZWxwZXInKSxcbiAgICAgICAgbWVkaWFJbmRpY2F0b3JDb3JuZXI6IGRhdGEoJ2ltZ19pbmRpY2F0b3Jfc2hvd19zaWRlJyksXG4gICAgICAgIGdlbmVyYXRlZEN0YVNlbGVjdG9yOiBkYXRhKCdzZXBhcmF0ZV9jdGEnKSxcbiAgICAgICAgZ2VuZXJhdGVkQ3RhRXhwYW5kZWQ6IGRhdGEoJ3NlcGFyYXRlX2N0YV9leHBhbmRlZCcpLFxuICAgICAgICByZXF1aXJlc0FwcHJvdmFsOiBkYXRhKCdyZXF1aXJlc19hcHByb3ZhbCcpLFxuICAgICAgICBkZWZhdWx0UmVhY3Rpb25zOiBkZWZhdWx0UmVhY3Rpb25zLFxuICAgICAgICBjdXN0b21DU1M6IGNvbXB1dGVDdXN0b21DU1MsXG4gICAgICAgIGV4Y2x1c2lvblNlbGVjdG9yOiBleGNsdXNpb25TZWxlY3RvcigpLFxuICAgICAgICBsYW5ndWFnZTogZGF0YSgnbGFuZ3VhZ2UnKSxcbiAgICAgICAgdHdpdHRlckFjY291bnQ6IGRhdGEoJ3R3aXR0ZXInKSxcbiAgICAgICAgaXNTaG93Q29udGVudFJlYzogZGF0YSgnc2hvd19yZWNpcmMnKSxcbiAgICAgICAgY29udGVudFJlY1NlbGVjdG9yOiBkYXRhKCdyZWNpcmNfc2VsZWN0b3InKSxcbiAgICAgICAgY29udGVudFJlY1RpdGxlOiBkYXRhKCdyZWNpcmNfdGl0bGUnKSxcbiAgICAgICAgY29udGVudFJlY01ldGhvZDogZGF0YSgncmVjaXJjX2pxdWVyeV9tZXRob2QnKSxcbiAgICAgICAgY29udGVudFJlY0NvbG9yczogZGF0YSgncmVjaXJjX2JhY2tncm91bmQnKSxcbiAgICAgICAgY29udGVudFJlY0NvdW50RGVza3RvcDogZGF0YSgncmVjaXJjX2NvdW50X2Rlc2t0b3AnKSxcbiAgICAgICAgY29udGVudFJlY0NvdW50TW9iaWxlOiBkYXRhKCdyZWNpcmNfY291bnRfbW9iaWxlJyksXG4gICAgICAgIGNvbnRlbnRSZWNSb3dDb3VudERlc2t0b3A6IGRhdGEoJ3JlY2lyY19yb3djb3VudF9kZXNrdG9wJyksXG4gICAgICAgIGNvbnRlbnRSZWNSb3dDb3VudE1vYmlsZTogZGF0YSgncmVjaXJjX3Jvd2NvdW50X21vYmlsZScpXG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlOiB1cGRhdGVGcm9tSlNPTixcbiAgICBnZXQ6IGdldEdyb3VwU2V0dGluZ3Ncbn07IiwiLy8gVGhpcyBtb2R1bGUgc3RvcmVzIG91ciBtYXBwaW5nIGZyb20gaGFzaCB2YWx1ZXMgdG8gdGhlaXIgY29ycmVzcG9uZGluZyBlbGVtZW50cyBpbiB0aGUgRE9NLiBUaGUgZGF0YSBpcyBvcmdhbml6ZWRcbi8vIGJ5IHBhZ2UgZm9yIHRoZSBibG9nIHJvbGwgY2FzZSwgd2hlcmUgbXVsdGlwbGUgcGFnZXMgb2YgZGF0YSBjYW4gYmUgbG9hZGVkIGF0IG9uY2UuXG52YXIgcGFnZXMgPSB7fTtcblxuLy8gVGhpcyBtb2R1bGUgcHJvdmlkZXMgYSBnZXQvc2V0IGludGVyZmFjZSwgYnV0IGl0IGFsbG93cyBtdWx0aXBsZSBlbGVtZW50cyB3aXRoIHRoZSBzYW1lIGtleS4gVGhpcyBhcHBsaWVzIGZvciBpbWFnZVxuLy8gZWxlbWVudHMsIHdoZXJlIHdlIGFsbG93IG11bHRpcGxlIGluc3RhbmNlcyBvbiB0aGUgc2FtZSBwYWdlIHdpdGggdGhlIHNhbWUgaGFzaC5cblxuZnVuY3Rpb24gZ2V0RWxlbWVudChjb250YWluZXJIYXNoLCBwYWdlSGFzaCkge1xuICAgIHZhciBjb250YWluZXJzID0gcGFnZXNbcGFnZUhhc2hdO1xuICAgIGlmIChjb250YWluZXJzKSB7XG4gICAgICAgIHZhciBlbGVtZW50cyA9IGNvbnRhaW5lcnNbY29udGFpbmVySGFzaF07XG4gICAgICAgIGlmIChlbGVtZW50cykge1xuICAgICAgICAgICAgcmV0dXJuIGVsZW1lbnRzWzBdO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBzZXRFbGVtZW50KGNvbnRhaW5lckhhc2gsIHBhZ2VIYXNoLCAkZWxlbWVudCkge1xuICAgIHZhciBjb250YWluZXJzID0gcGFnZXNbcGFnZUhhc2hdO1xuICAgIGlmICghY29udGFpbmVycykge1xuICAgICAgICBjb250YWluZXJzID0gcGFnZXNbcGFnZUhhc2hdID0ge307XG4gICAgfVxuICAgIGNvbnRhaW5lcnNbY29udGFpbmVySGFzaF0gPSBjb250YWluZXJzW2NvbnRhaW5lckhhc2hdIHx8IFtdO1xuICAgIHZhciBlbGVtZW50cyA9IGNvbnRhaW5lcnNbY29udGFpbmVySGFzaF07XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBlbGVtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoZWxlbWVudHNbaV0uZ2V0KDApID09PSAkZWxlbWVudC5nZXQoMCkpIHtcbiAgICAgICAgICAgIHJldHVybjsgLy8gV2UndmUgYWxyZWFkeSBnb3QgdGhpcyBhc3NvY2lhdGlvblxuICAgICAgICB9XG4gICAgfVxuICAgIGVsZW1lbnRzLnB1c2goJGVsZW1lbnQpO1xufVxuXG5mdW5jdGlvbiByZW1vdmVFbGVtZW50KGNvbnRhaW5lckhhc2gsIHBhZ2VIYXNoLCAkZWxlbWVudCkge1xuICAgIHZhciBjb250YWluZXJzID0gcGFnZXNbcGFnZUhhc2hdIHx8IHt9O1xuICAgIHZhciBlbGVtZW50cyA9IGNvbnRhaW5lcnNbY29udGFpbmVySGFzaF0gfHwgW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBlbGVtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoZWxlbWVudHNbaV0uZ2V0KDApID09PSAkZWxlbWVudC5nZXQoMCkpIHtcbiAgICAgICAgICAgIGVsZW1lbnRzLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgIGlmIChlbGVtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICBkZWxldGUgY29udGFpbmVyc1tjb250YWluZXJIYXNoXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLy8gV2hlbiB3ZSBmaXJzdCBzY2FuIGEgcGFnZSwgdGhlIFwiaGFzaFwiIGlzIGp1c3QgdGhlIFVSTCB3aGlsZSB3ZSB3YWl0IHRvIGhlYXIgYmFjayBmcm9tIHRoZSBzZXJ2ZXIsIHRoZW4gaXQncyB1cGRhdGVkXG4vLyB0byB3aGF0ZXZlciB2YWx1ZSB0aGUgc2VydmVyIGNvbXB1dGVkLiBTbyBoZXJlIHdlIGFsbG93IG91ciBtYXBwaW5nIHRvIGJlIHVwZGF0ZWQgd2hlbiB0aGF0IGNoYW5nZSBoYXBwZW5zLlxuZnVuY3Rpb24gdXBkYXRlUGFnZUhhc2gob2xkUGFnZUhhc2gsIG5ld1BhZ2VIYXNoKSB7XG4gICAgcGFnZXNbbmV3UGFnZUhhc2hdID0gcGFnZXNbb2xkUGFnZUhhc2hdO1xuICAgIGRlbGV0ZSBwYWdlc1tvbGRQYWdlSGFzaF07XG59XG5cbmZ1bmN0aW9uIHRlYXJkb3duKCkge1xuICAgIHBhZ2VzID0ge307XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBnZXRFbGVtZW50OiBnZXRFbGVtZW50LFxuICAgIHNldEVsZW1lbnQ6IHNldEVsZW1lbnQsXG4gICAgcmVtb3ZlRWxlbWVudDogcmVtb3ZlRWxlbWVudCxcbiAgICB1cGRhdGVQYWdlSGFzaDogdXBkYXRlUGFnZUhhc2gsXG4gICAgdGVhcmRvd246IHRlYXJkb3duXG59OyIsInZhciAkOyByZXF1aXJlKCcuL3V0aWxzL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIFJhY3RpdmU7IHJlcXVpcmUoJy4vdXRpbHMvcmFjdGl2ZS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihsb2FkZWRSYWN0aXZlKSB7IFJhY3RpdmUgPSBsb2FkZWRSYWN0aXZlO30pO1xudmFyIFJhbmdlID0gcmVxdWlyZSgnLi91dGlscy9yYW5nZScpO1xuXG52YXIgRXZlbnRzID0gcmVxdWlyZSgnLi9ldmVudHMnKTtcbnZhciBIYXNoZWRFbGVtZW50cyA9IHJlcXVpcmUoJy4vaGFzaGVkLWVsZW1lbnRzJyk7XG52YXIgUGFnZURhdGEgPSByZXF1aXJlKCcuL3BhZ2UtZGF0YScpO1xudmFyIFNWR3MgPSByZXF1aXJlKCcuL3N2Z3MnKTtcblxudmFyIHBhZ2VTZWxlY3RvciA9ICcuYW50ZW5uYS1sb2NhdGlvbnMtcGFnZSc7XG5cbmZ1bmN0aW9uIGNyZWF0ZVBhZ2Uob3B0aW9ucykge1xuICAgIHZhciBlbGVtZW50ID0gb3B0aW9ucy5lbGVtZW50O1xuICAgIHZhciByZWFjdGlvbkxvY2F0aW9uRGF0YSA9IG9wdGlvbnMucmVhY3Rpb25Mb2NhdGlvbkRhdGE7XG4gICAgdmFyIHBhZ2VEYXRhID0gb3B0aW9ucy5wYWdlRGF0YTtcbiAgICB2YXIgZ3JvdXBTZXR0aW5ncyA9IG9wdGlvbnMuZ3JvdXBTZXR0aW5ncztcbiAgICB2YXIgY2xvc2VXaW5kb3cgPSBvcHRpb25zLmNsb3NlV2luZG93O1xuICAgIHZhciBnb0JhY2sgPSBvcHRpb25zLmdvQmFjaztcbiAgICB2YXIgcmFjdGl2ZSA9IFJhY3RpdmUoe1xuICAgICAgICBlbDogZWxlbWVudCxcbiAgICAgICAgYXBwZW5kOiB0cnVlLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICBsb2NhdGlvbkRhdGE6IHJlYWN0aW9uTG9jYXRpb25EYXRhLFxuICAgICAgICAgICAgcGFnZVJlYWN0aW9uQ291bnQ6IHBhZ2VSZWFjdGlvbkNvdW50KHJlYWN0aW9uTG9jYXRpb25EYXRhKSxcbiAgICAgICAgICAgIGNhbkxvY2F0ZTogZnVuY3Rpb24oY29udGFpbmVySGFzaCkge1xuICAgICAgICAgICAgICAgIC8vIFRPRE86IGlzIHRoZXJlIGEgYmV0dGVyIHdheSB0byBoYW5kbGUgcmVhY3Rpb25zIHRvIGhhc2hlcyB0aGF0IGFyZSBubyBsb25nZXIgb24gdGhlIHBhZ2U/XG4gICAgICAgICAgICAgICAgLy8gICAgICAgc2hvdWxkIHdlIHByb3ZpZGUgc29tZSBraW5kIG9mIGluZGljYXRpb24gd2hlbiB3ZSBmYWlsIHRvIGxvY2F0ZSBhIGhhc2ggb3IganVzdCBsZWF2ZSBpdCBhcyBpcz9cbiAgICAgICAgICAgICAgICAvLyBUT0RPOiBEb2VzIGl0IG1ha2Ugc2Vuc2UgdG8gZXZlbiBzaG93IGVudHJpZXMgdGhhdCB3ZSBjYW4ndCBsb2NhdGU/IFByb2JhYmx5IG5vdC5cbiAgICAgICAgICAgICAgICByZXR1cm4gSGFzaGVkRWxlbWVudHMuZ2V0RWxlbWVudChjb250YWluZXJIYXNoLCBwYWdlRGF0YS5wYWdlSGFzaCkgIT09IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgdGVtcGxhdGU6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9sb2NhdGlvbnMtcGFnZS5oYnMuaHRtbCcpLFxuICAgICAgICBwYXJ0aWFsczoge1xuICAgICAgICAgICAgbGVmdDogU1ZHcy5sZWZ0LFxuICAgICAgICAgICAgZmlsbTogU1ZHcy5maWxtXG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByYWN0aXZlLm9uKCdiYWNrJywgZ29CYWNrKTtcbiAgICByYWN0aXZlLm9uKCdyZXZlYWwnLCByZXZlYWxDb250ZW50KTtcbiAgICByZXR1cm4ge1xuICAgICAgICBzZWxlY3RvcjogcGFnZVNlbGVjdG9yLFxuICAgICAgICB0ZWFyZG93bjogZnVuY3Rpb24oKSB7IHJhY3RpdmUudGVhcmRvd24oKTsgfVxuICAgIH07XG5cblxuICAgIGZ1bmN0aW9uIHJldmVhbENvbnRlbnQocmFjdGl2ZUV2ZW50KSB7XG4gICAgICAgIHZhciBsb2NhdGlvbkRhdGEgPSByYWN0aXZlRXZlbnQuY29udGV4dDtcbiAgICAgICAgdmFyIGVsZW1lbnQgPSBIYXNoZWRFbGVtZW50cy5nZXRFbGVtZW50KGxvY2F0aW9uRGF0YS5jb250YWluZXJIYXNoLCBwYWdlRGF0YS5wYWdlSGFzaCk7XG4gICAgICAgIGlmIChlbGVtZW50KSB7XG4gICAgICAgICAgICB2YXIgZXZlbnQgPSByYWN0aXZlRXZlbnQub3JpZ2luYWw7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICBjbG9zZVdpbmRvdygpO1xuICAgICAgICAgICAgdmFyIHRhcmdldFNjcm9sbFRvcCA9ICQoZWxlbWVudCkub2Zmc2V0KCkudG9wIC0gMTMwO1xuICAgICAgICAgICAgJCgnaHRtbCxib2R5JykuYW5pbWF0ZSh7c2Nyb2xsVG9wOiB0YXJnZXRTY3JvbGxUb3B9LCAxMDAwKTtcbiAgICAgICAgICAgIGlmIChsb2NhdGlvbkRhdGEua2luZCA9PT0gJ3R4dCcpIHsgLy8gVE9ETzogc29tZXRoaW5nIGJldHRlciB0aGFuIGEgc3RyaW5nIGNvbXBhcmUuIGZpeCB0aGlzIGFsb25nIHdpdGggdGhlIHNhbWUgaXNzdWUgaW4gcGFnZS1kYXRhXG4gICAgICAgICAgICAgICAgUmFuZ2UuaGlnaGxpZ2h0KGVsZW1lbnQuZ2V0KDApLCBsb2NhdGlvbkRhdGEubG9jYXRpb24pO1xuICAgICAgICAgICAgICAgICQoZG9jdW1lbnQpLm9uKCdjbGljay5hbnRlbm5hJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIFJhbmdlLmNsZWFySGlnaGxpZ2h0cygpO1xuICAgICAgICAgICAgICAgICAgICAkKGRvY3VtZW50KS5vZmYoJ2NsaWNrLmFudGVubmEnKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBjb250YWluZXJEYXRhID0gUGFnZURhdGEuZ2V0Q29udGFpbmVyRGF0YShwYWdlRGF0YSwgbG9jYXRpb25EYXRhLmNvbnRhaW5lckhhc2gpO1xuICAgICAgICAgICAgRXZlbnRzLnBvc3RDb250ZW50Vmlld2VkKHBhZ2VEYXRhLCBjb250YWluZXJEYXRhLGxvY2F0aW9uRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIHBhZ2VSZWFjdGlvbkNvdW50KHJlYWN0aW9uTG9jYXRpb25EYXRhKSB7XG4gICAgZm9yICh2YXIgY29udGVudElEIGluIHJlYWN0aW9uTG9jYXRpb25EYXRhKSB7XG4gICAgICAgIGlmIChyZWFjdGlvbkxvY2F0aW9uRGF0YS5oYXNPd25Qcm9wZXJ0eShjb250ZW50SUQpKSB7XG4gICAgICAgICAgICB2YXIgY29udGVudExvY2F0aW9uRGF0YSA9IHJlYWN0aW9uTG9jYXRpb25EYXRhW2NvbnRlbnRJRF07XG4gICAgICAgICAgICBpZiAoY29udGVudExvY2F0aW9uRGF0YS5raW5kID09PSAncGFnJykgeyAvLyBUT0RPOiBzb21ldGhpbmcgYmV0dGVyIHRoYW4gYSBzdHJpbmcgY29tcGFyZS4gZml4IHRoaXMgYWxvbmcgd2l0aCB0aGUgc2FtZSBpc3N1ZSBpbiBwYWdlLWRhdGFcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udGVudExvY2F0aW9uRGF0YS5jb3VudDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZTogY3JlYXRlUGFnZVxufTsiLCJ2YXIgUmFjdGl2ZTsgcmVxdWlyZSgnLi91dGlscy9yYWN0aXZlLXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGxvYWRlZFJhY3RpdmUpIHsgUmFjdGl2ZSA9IGxvYWRlZFJhY3RpdmU7fSk7XG52YXIgVVJMcyA9IHJlcXVpcmUoJy4vdXRpbHMvdXJscycpO1xudmFyIFVzZXIgPSByZXF1aXJlKCcuL3V0aWxzL3VzZXInKTtcblxudmFyIEV2ZW50cyA9IHJlcXVpcmUoJy4vZXZlbnRzJyk7XG52YXIgU1ZHcyA9IHJlcXVpcmUoJy4vc3ZncycpO1xuXG52YXIgcGFnZVNlbGVjdG9yID0gJy5hbnRlbm5hLWxvZ2luLXBhZ2UnO1xuXG5mdW5jdGlvbiBjcmVhdGVQYWdlKG9wdGlvbnMpIHtcbiAgICB2YXIgZ3JvdXBTZXR0aW5ncyA9IG9wdGlvbnMuZ3JvdXBTZXR0aW5ncztcbiAgICB2YXIgZ29CYWNrID0gb3B0aW9ucy5nb0JhY2s7XG4gICAgdmFyIHJldHJ5ID0gb3B0aW9ucy5yZXRyeTtcbiAgICB2YXIgZWxlbWVudCA9IG9wdGlvbnMuZWxlbWVudDtcbiAgICB2YXIgcmFjdGl2ZSA9IFJhY3RpdmUoe1xuICAgICAgICBlbDogZWxlbWVudCxcbiAgICAgICAgYXBwZW5kOiB0cnVlLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICBncm91cE5hbWU6IGVuY29kZVVSSShncm91cFNldHRpbmdzLmdyb3VwTmFtZSgpKVxuICAgICAgICB9LFxuICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL2xvZ2luLXBhZ2UuaGJzLmh0bWwnKSxcbiAgICAgICAgcGFydGlhbHM6IHtcbiAgICAgICAgICAgIGxlZnQ6IFNWR3MubGVmdCxcbiAgICAgICAgICAgIGxvZ286IFNWR3MubG9nb1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmFjdGl2ZS5vbignYmFjaycsIGZ1bmN0aW9uKCkge1xuICAgICAgICBnb0JhY2soKTtcbiAgICB9KTtcbiAgICByYWN0aXZlLm9uKCdmYWNlYm9va0xvZ2luJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIHNob3dMb2dpblBlbmRpbmcoKTtcbiAgICAgICAgRXZlbnRzLnBvc3RGYWNlYm9va0xvZ2luU3RhcnQoZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIFVzZXIuZmFjZWJvb2tMb2dpbihncm91cFNldHRpbmdzLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciB1c2VySW5mbyA9IFVzZXIuY2FjaGVkVXNlcigpO1xuICAgICAgICAgICAgaWYgKHVzZXJJbmZvLnVzZXJfdHlwZSAhPT0gJ2ZhY2Vib29rJykge1xuICAgICAgICAgICAgICAgIEV2ZW50cy5wb3N0RmFjZWJvb2tMb2dpbkZhaWwoZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkb1JldHJ5KCk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICAgIHJhY3RpdmUub24oJ2FudGVubmFMb2dpbicsIGZ1bmN0aW9uKCkge1xuICAgICAgICBzaG93TG9naW5QZW5kaW5nKCk7XG4gICAgICAgIG9wZW5BbnRlbm5hTG9naW5XaW5kb3coZG9SZXRyeSk7XG4gICAgfSk7XG4gICAgcmFjdGl2ZS5vbigncmV0cnknLCBmdW5jdGlvbigpIHtcbiAgICAgICAgZG9SZXRyeSgpO1xuICAgIH0pO1xuICAgIHZhciBhbnRlbm5hTG9naW5XaW5kb3c7XG4gICAgdmFyIGFudGVubmFMb2dpbkNhbmNlbGxlZCA9IGZhbHNlO1xuICAgIHJldHVybiB7XG4gICAgICAgIHNlbGVjdG9yOiBwYWdlU2VsZWN0b3IsXG4gICAgICAgIHRlYXJkb3duOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJhY3RpdmUudGVhcmRvd24oKTtcbiAgICAgICAgICAgIGNhbmNlbEFudGVubmFMb2dpbigpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIGRvUmV0cnkoKSB7XG4gICAgICAgIHJldHJ5KCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gb3BlbkFudGVubmFMb2dpbldpbmRvdyhjYWxsYmFjaykge1xuICAgICAgICBpZiAoYW50ZW5uYUxvZ2luV2luZG93ICYmICFhbnRlbm5hTG9naW5XaW5kb3cuY2xvc2VkKSB7XG4gICAgICAgICAgICBhbnRlbm5hTG9naW5XaW5kb3cuZm9jdXMoKTsgLy8gQnJpbmcgdGhlIHdpbmRvdyB0byB0aGUgZnJvbnQgaWYgaXQncyBhbHJlYWR5IG9wZW4uXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBFdmVudHMucG9zdEFudGVubmFMb2dpblN0YXJ0KGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgdmFyIHdpbmRvd0lkID0gJ2FudGVubmFfbG9naW4nO1xuICAgICAgICAgICAgdmFyIHdpbmRvd1Byb3BlcnRpZXMgPSBjb21wdXRlV2luZG93UHJvcGVydGllcygpO1xuICAgICAgICAgICAgYW50ZW5uYUxvZ2luV2luZG93ID0gd2luZG93Lm9wZW4oVVJMcy5hcHBTZXJ2ZXJVcmwoKSArIFVSTHMuYW50ZW5uYUxvZ2luVXJsKCksIHdpbmRvd0lkLCB3aW5kb3dQcm9wZXJ0aWVzKTtcbiAgICAgICAgICAgIHZhciBpbnRlcnZhbCA9IHNldEludGVydmFsKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIC8vIFdhdGNoIGZvciB0aGUgd2luZG93IHRvIGNsb3NlLCB0aGVuIGdvIHJlYWQgdGhlIGxhdGVzdCBjb29raWVzLlxuICAgICAgICAgICAgICAgIGlmIChhbnRlbm5hTG9naW5XaW5kb3cgJiYgYW50ZW5uYUxvZ2luV2luZG93LmNsb3NlZCkge1xuICAgICAgICAgICAgICAgICAgICBjbGVhckludGVydmFsKGludGVydmFsKTtcbiAgICAgICAgICAgICAgICAgICAgYW50ZW5uYUxvZ2luV2luZG93ID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFhbnRlbm5hTG9naW5DYW5jZWxsZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBvbGRVc2VySW5mbyA9IFVzZXIuY2FjaGVkVXNlcigpIHx8IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgVXNlci5yZWZyZXNoVXNlckZyb21Db29raWVzKGZ1bmN0aW9uICh1c2VySW5mbykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh1c2VySW5mbyAmJiB1c2VySW5mby50ZW1wX3VzZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgRXZlbnRzLnBvc3RBbnRlbm5hTG9naW5GYWlsKGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCA1MCk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBjb21wdXRlV2luZG93UHJvcGVydGllcygpIHtcbiAgICAgICAgICAgIHZhciB3ID0gNDAwO1xuICAgICAgICAgICAgdmFyIGggPSAzNTA7XG4gICAgICAgICAgICB2YXIgbCA9ICh3aW5kb3cuc2NyZWVuLndpZHRoLzIpLSh3LzIpO1xuICAgICAgICAgICAgdmFyIHQgPSAod2luZG93LnNjcmVlbi5oZWlnaHQvMiktKGgvMik7XG4gICAgICAgICAgICByZXR1cm4gJ21lbnViYXI9MSxyZXNpemFibGU9MSxzY3JvbGxiYXJzPXllcyx3aWR0aD0nK3crJyxoZWlnaHQ9JytoKycsdG9wPScrdCsnLGxlZnQ9JytsO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY2FuY2VsQW50ZW5uYUxvZ2luKCkge1xuICAgICAgICAvLyBDbG9zZS9jYW5jZWwgYW55IGxvZ2luIHdpbmRvd3MgdGhhdCB3ZSBoYXZlIG9wZW4uXG4gICAgICAgIGlmIChhbnRlbm5hTG9naW5XaW5kb3cgJiYgIWFudGVubmFMb2dpbldpbmRvdy5jbG9zZWQpIHtcbiAgICAgICAgICAgIGFudGVubmFMb2dpbkNhbmNlbGxlZCA9IHRydWU7XG4gICAgICAgICAgICBhbnRlbm5hTG9naW5XaW5kb3cuY2xvc2UoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNob3dMb2dpblBlbmRpbmcoKSB7XG4gICAgICAgICQocmFjdGl2ZS5maW5kKCcuYW50ZW5uYS1sb2dpbi1jb250ZW50JykpLmhpZGUoKTtcbiAgICAgICAgJChyYWN0aXZlLmZpbmQoJy5hbnRlbm5hLWxvZ2luLXBlbmRpbmcnKSkuc2hvdygpO1xuICAgIH1cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZVBhZ2U6IGNyZWF0ZVBhZ2Vcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgUmFjdGl2ZTsgcmVxdWlyZSgnLi91dGlscy9yYWN0aXZlLXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGxvYWRlZFJhY3RpdmUpIHsgUmFjdGl2ZSA9IGxvYWRlZFJhY3RpdmU7fSk7XG52YXIgUmVhY3Rpb25zV2lkZ2V0ID0gcmVxdWlyZSgnLi9yZWFjdGlvbnMtd2lkZ2V0Jyk7XG52YXIgU1ZHcyA9IHJlcXVpcmUoJy4vc3ZncycpO1xuXG52YXIgQXBwTW9kZSA9IHJlcXVpcmUoJy4vdXRpbHMvYXBwLW1vZGUnKTtcbnZhciBCcm93c2VyTWV0cmljcyA9IHJlcXVpcmUoJy4vdXRpbHMvYnJvd3Nlci1tZXRyaWNzJyk7XG52YXIgTXV0YXRpb25PYnNlcnZlciA9IHJlcXVpcmUoJy4vdXRpbHMvbXV0YXRpb24tb2JzZXJ2ZXInKTtcbnZhciBUaHJvdHRsZWRFdmVudHMgPSByZXF1aXJlKCcuL3V0aWxzL3Rocm90dGxlZC1ldmVudHMnKTtcbnZhciBUb3VjaFN1cHBvcnQgPSByZXF1aXJlKCcuL3V0aWxzL3RvdWNoLXN1cHBvcnQnKTtcbnZhciBWaXNpYmlsaXR5ID0gcmVxdWlyZSgnLi91dGlscy92aXNpYmlsaXR5Jyk7XG5cbnZhciBDTEFTU19BQ1RJVkUgPSAnYW50ZW5uYS1hY3RpdmUnO1xuXG5mdW5jdGlvbiBjcmVhdGVJbmRpY2F0b3JXaWRnZXQob3B0aW9ucykge1xuICAgIC8vIFRPRE86IHZhbGlkYXRlIHRoYXQgb3B0aW9ucyBjb250YWlucyBhbGwgcmVxdWlyZWQgcHJvcGVydGllcyAoYXBwbGllcyB0byBhbGwgd2lkZ2V0cykuXG4gICAgdmFyIGVsZW1lbnQgPSBvcHRpb25zLmVsZW1lbnQ7XG4gICAgdmFyIGNvbnRhaW5lckRhdGEgPSBvcHRpb25zLmNvbnRhaW5lckRhdGE7XG4gICAgdmFyICRjb250YWluZXJFbGVtZW50ID0gb3B0aW9ucy5jb250YWluZXJFbGVtZW50O1xuICAgIHZhciBwYWdlRGF0YSA9IG9wdGlvbnMucGFnZURhdGE7XG4gICAgdmFyIGdyb3VwU2V0dGluZ3MgPSBvcHRpb25zLmdyb3VwU2V0dGluZ3M7XG4gICAgdmFyIGRlZmF1bHRSZWFjdGlvbnMgPSBvcHRpb25zLmRlZmF1bHRSZWFjdGlvbnM7XG4gICAgdmFyIGNvbnRlbnREYXRhID0gb3B0aW9ucy5jb250ZW50RGF0YTtcbiAgICB2YXIgcmFjdGl2ZSA9IFJhY3RpdmUoe1xuICAgICAgICBlbDogZWxlbWVudCxcbiAgICAgICAgYXBwZW5kOiB0cnVlLFxuICAgICAgICBtYWdpYzogdHJ1ZSxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgY29udGFpbmVyRGF0YTogY29udGFpbmVyRGF0YSxcbiAgICAgICAgICAgIHN1cHBvcnRzVG91Y2g6IEJyb3dzZXJNZXRyaWNzLnN1cHBvcnRzVG91Y2goKSxcbiAgICAgICAgICAgIGV4dHJhQXR0cmlidXRlczogQXBwTW9kZS5kZWJ1ZyA/ICdhbnQtaGFzaD1cIicgKyBjb250YWluZXJEYXRhLmhhc2ggKyAnXCInIDogJycgLy8gVE9ETzogdGhpcyBhYm91dCBtYWtpbmcgdGhpcyBhIGRlY29yYXRvciBoYW5kbGVkIGJ5IGEgXCJEZWJ1Z1wiIG1vZHVsZVxuICAgICAgICB9LFxuICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL21lZGlhLWluZGljYXRvci13aWRnZXQuaGJzLmh0bWwnKSxcbiAgICAgICAgcGFydGlhbHM6IHtcbiAgICAgICAgICAgIGxvZ286IFNWR3MubG9nb1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICB2YXIgcmVhY3Rpb25XaWRnZXRPcHRpb25zID0ge1xuICAgICAgICByZWFjdGlvbnNEYXRhOiBjb250YWluZXJEYXRhLnJlYWN0aW9ucyxcbiAgICAgICAgY29udGFpbmVyRGF0YTogY29udGFpbmVyRGF0YSxcbiAgICAgICAgY29udGFpbmVyRWxlbWVudDogJGNvbnRhaW5lckVsZW1lbnQsXG4gICAgICAgIGNvbnRlbnREYXRhOiBjb250ZW50RGF0YSxcbiAgICAgICAgZGVmYXVsdFJlYWN0aW9uczogZGVmYXVsdFJlYWN0aW9ucyxcbiAgICAgICAgcGFnZURhdGE6IHBhZ2VEYXRhLFxuICAgICAgICBncm91cFNldHRpbmdzOiBncm91cFNldHRpbmdzXG4gICAgfTtcblxuICAgIHZhciBob3ZlclRpbWVvdXQ7XG4gICAgdmFyIGFjdGl2ZVRpbWVvdXQ7XG5cbiAgICB2YXIgJHJvb3RFbGVtZW50ID0gJChyb290RWxlbWVudChyYWN0aXZlKSk7XG4gICAgVG91Y2hTdXBwb3J0LnNldHVwVGFwKCRyb290RWxlbWVudC5nZXQoMCksIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBvcGVuUmVhY3Rpb25zV2luZG93KHJlYWN0aW9uV2lkZ2V0T3B0aW9ucywgcmFjdGl2ZSk7XG4gICAgfSk7XG4gICAgJHJvb3RFbGVtZW50Lm9uKCdtb3VzZWVudGVyLmFudGVubmEnLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBpZiAoZXZlbnQuYnV0dG9ucyA+IDAgfHwgKGV2ZW50LmJ1dHRvbnMgPT0gdW5kZWZpbmVkICYmIGV2ZW50LndoaWNoID4gMCkpIHsgLy8gT24gU2FmYXJpLCBldmVudC5idXR0b25zIGlzIHVuZGVmaW5lZCBidXQgZXZlbnQud2hpY2ggZ2l2ZXMgYSBnb29kIHZhbHVlLiBldmVudC53aGljaCBpcyBiYWQgb24gRkZcbiAgICAgICAgICAgIC8vIERvbid0IHJlYWN0IGlmIHRoZSB1c2VyIGlzIGRyYWdnaW5nIG9yIHNlbGVjdGluZyB0ZXh0LlxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjb250YWluZXJEYXRhLnJlYWN0aW9ucy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBvcGVuUmVhY3Rpb25zV2luZG93KHJlYWN0aW9uV2lkZ2V0T3B0aW9ucywgcmFjdGl2ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjbGVhclRpbWVvdXQoaG92ZXJUaW1lb3V0KTtcbiAgICAgICAgICAgIGhvdmVyVGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgb3BlblJlYWN0aW9uc1dpbmRvdyhyZWFjdGlvbldpZGdldE9wdGlvbnMsIHJhY3RpdmUpO1xuICAgICAgICAgICAgfSwgNTApO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgJHJvb3RFbGVtZW50Lm9uKCdtb3VzZWxlYXZlLmFudGVubmEnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KGhvdmVyVGltZW91dCk7XG4gICAgICAgIGNsZWFyVGltZW91dChhY3RpdmVUaW1lb3V0KTtcbiAgICB9KTtcbiAgICAkY29udGFpbmVyRWxlbWVudC5vbignbW91c2VlbnRlci5hbnRlbm5hJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIGNsZWFyVGltZW91dChhY3RpdmVUaW1lb3V0KTtcbiAgICAgICAgYWN0aXZlVGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAkcm9vdEVsZW1lbnQuYWRkQ2xhc3MoQ0xBU1NfQUNUSVZFKTtcbiAgICAgICAgfSwgNTAwKTtcbiAgICB9KTtcbiAgICAkY29udGFpbmVyRWxlbWVudC5vbignbW91c2VsZWF2ZS5hbnRlbm5hJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIGNsZWFyVGltZW91dChhY3RpdmVUaW1lb3V0KTtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICRyb290RWxlbWVudC5yZW1vdmVDbGFzcyhDTEFTU19BQ1RJVkUpO1xuICAgICAgICB9LCAxMDApOyAvLyBXZSBnZXQgYSBtb3VzZWxlYXZlIGV2ZW50IHdoZW4gdGhlIHVzZXIgaG92ZXJzIHRoZSBpbmRpY2F0b3IuIFBhdXNlIGxvbmcgZW5vdWdoIHRoYXQgdGhlIHJlYWN0aW9uIHdpbmRvdyBjYW4gb3BlbiBpZiB0aGV5IGhvdmVyLlxuICAgIH0pO1xuICAgIHNldHVwUG9zaXRpb25pbmcoJGNvbnRhaW5lckVsZW1lbnQsIGdyb3VwU2V0dGluZ3MsIHJhY3RpdmUpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgdGVhcmRvd246IGZ1bmN0aW9uKCkgeyByYWN0aXZlLnRlYXJkb3duKCk7IH1cbiAgICB9O1xufVxuXG5mdW5jdGlvbiBzZXR1cFBvc2l0aW9uaW5nKCRjb250YWluZXJFbGVtZW50LCBncm91cFNldHRpbmdzLCByYWN0aXZlKSB7XG4gICAgdmFyICR3cmFwcGVyRWxlbWVudCA9ICQod3JhcHBlckVsZW1lbnQocmFjdGl2ZSkpO1xuICAgIHZhciAkcm9vdEVsZW1lbnQgPSAkKHJvb3RFbGVtZW50KHJhY3RpdmUpKTtcbiAgICBwb3NpdGlvbkluZGljYXRvcigpO1xuXG4gICAgVGhyb3R0bGVkRXZlbnRzLm9uKCdyZXNpemUnLCBwb3NpdGlvbklmTmVlZGVkKTtcbiAgICByYWN0aXZlLm9uKCd0ZWFyZG93bicsIGZ1bmN0aW9uKCkge1xuICAgICAgICBUaHJvdHRsZWRFdmVudHMub2ZmKCdyZXNpemUnLCBwb3NpdGlvbklmTmVlZGVkKTtcbiAgICB9KTtcbiAgICBUaHJvdHRsZWRFdmVudHMub24oJ3Njcm9sbCcsIHBvc2l0aW9uSWZOZWVkZWQpO1xuICAgIHJhY3RpdmUub24oJ3RlYXJkb3duJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIFRocm90dGxlZEV2ZW50cy5vZmYoJ3Njcm9sbCcsIHBvc2l0aW9uSWZOZWVkZWQpO1xuICAgIH0pO1xuXG4gICAgLy8gVE9ETzogY29uc2lkZXIgYWxzbyBsaXN0ZW5pbmcgdG8gc3JjIGF0dHJpYnV0ZSBjaGFuZ2VzLCB3aGljaCBtaWdodCBhZmZlY3QgdGhlIGhlaWdodCBvZiBlbGVtZW50cyBvbiB0aGUgcGFnZVxuICAgIE11dGF0aW9uT2JzZXJ2ZXIuYWRkQWRkaXRpb25MaXN0ZW5lcihlbGVtZW50c0FkZGVkT3JSZW1vdmVkKTtcbiAgICBNdXRhdGlvbk9ic2VydmVyLmFkZFJlbW92YWxMaXN0ZW5lcihlbGVtZW50c1JlbW92ZWQpO1xuXG4gICAgZnVuY3Rpb24gZWxlbWVudHNSZW1vdmVkKCRlbGVtZW50cykge1xuICAgICAgICAvLyBTcGVjaWFsIGNhc2U6IElmIHdlIHNlZSB0aGF0IG91ciBvd24gcmVhZG1vcmUgZWxlbWVudHMgYXJlIHJlbW92ZWQsXG4gICAgICAgIC8vIGFsd2F5cyB1cGRhdGUgb3VyIGluZGljYXRvcnMgYmVjYXVzZSB0aGVpciB2aXNpYmlsaXR5IG1pZ2h0IGhhdmUgY2hhbmdlZC5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAkZWxlbWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciAkZWxlbWVudCA9ICRlbGVtZW50c1tpXTtcbiAgICAgICAgICAgIGlmICgkZWxlbWVudC5oYXNDbGFzcygnYW50ZW5uYS1yZWFkbW9yZScpfHwgJGVsZW1lbnQuaGFzQ2xhc3MoJ2FudGVubmEtY29udGVudC1yZWMtcmVhZG1vcmUnKSkge1xuICAgICAgICAgICAgICAgIHBvc2l0aW9uSW5kaWNhdG9yKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsZW1lbnRzQWRkZWRPclJlbW92ZWQoJGVsZW1lbnRzKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBlbGVtZW50c0FkZGVkT3JSZW1vdmVkKCRlbGVtZW50cykge1xuICAgICAgICAvLyBSZXBvc2l0aW9uIHRoZSBpbmRpY2F0b3IgaWYgZWxlbWVudHMgd2hpY2ggbWlnaHQgYWRqdXN0IHRoZSBjb250YWluZXIncyBwb3NpdGlvbiBhcmUgYWRkZWQvcmVtb3ZlZC5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAkZWxlbWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciAkZWxlbWVudCA9ICRlbGVtZW50c1tpXTtcbiAgICAgICAgICAgIGlmICgkZWxlbWVudC5oZWlnaHQoKSA+IDApIHtcbiAgICAgICAgICAgICAgICBwb3NpdGlvbklmTmVlZGVkKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgdmFyIGxhc3RDb250YWluZXJPZmZzZXQgPSAkY29udGFpbmVyRWxlbWVudC5vZmZzZXQoKTtcbiAgICB2YXIgbGFzdENvbnRhaW5lckhlaWdodCA9ICRjb250YWluZXJFbGVtZW50LmhlaWdodCgpO1xuICAgIHZhciBsYXN0Q29udGFpbmVyVmlzaWJpbGl0eSA9IFZpc2liaWxpdHkuaXNWaXNpYmxlKCRjb250YWluZXJFbGVtZW50LmdldCgwKSk7XG5cbiAgICBmdW5jdGlvbiBwb3NpdGlvbklmTmVlZGVkKCkge1xuICAgICAgICB2YXIgY29udGFpbmVyT2Zmc2V0ID0gJGNvbnRhaW5lckVsZW1lbnQub2Zmc2V0KCk7XG4gICAgICAgIHZhciBjb250YWluZXJIZWlnaHQgPSAkY29udGFpbmVyRWxlbWVudC5oZWlnaHQoKTtcbiAgICAgICAgdmFyIGNvbnRhaW5lclZpc2liaWxpdHkgPSBWaXNpYmlsaXR5LmlzVmlzaWJsZSgkY29udGFpbmVyRWxlbWVudC5nZXQoMCkpO1xuICAgICAgICBpZiAoY29udGFpbmVyT2Zmc2V0LnRvcCA9PT0gbGFzdENvbnRhaW5lck9mZnNldC50b3AgJiZcbiAgICAgICAgICAgIGNvbnRhaW5lck9mZnNldC5sZWZ0ID09PSBsYXN0Q29udGFpbmVyT2Zmc2V0LmxlZnQgJiZcbiAgICAgICAgICAgIGNvbnRhaW5lckhlaWdodCA9PT0gbGFzdENvbnRhaW5lckhlaWdodCAmJlxuICAgICAgICAgICAgY29udGFpbmVyVmlzaWJpbGl0eSA9PT0gbGFzdENvbnRhaW5lclZpc2liaWxpdHkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBsYXN0Q29udGFpbmVyT2Zmc2V0ID0gY29udGFpbmVyT2Zmc2V0O1xuICAgICAgICBsYXN0Q29udGFpbmVySGVpZ2h0ID0gY29udGFpbmVySGVpZ2h0O1xuICAgICAgICBsYXN0Q29udGFpbmVyVmlzaWJpbGl0eSA9IGNvbnRhaW5lclZpc2liaWxpdHk7XG4gICAgICAgIHBvc2l0aW9uSW5kaWNhdG9yKCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcG9zaXRpb25JbmRpY2F0b3IoKSB7XG4gICAgICAgIHVwZGF0ZURpc3BsYXlGb3JWaXNpYmlsaXR5KCk7IC8vIFVwZGF0ZSB2aXNpYmlsaXR5IHdoZW5ldmVyIHdlIHBvc2l0aW9uIHRoZSBlbGVtZW50LlxuICAgICAgICAvLyBQb3NpdGlvbiB0aGUgd3JhcHBlciBlbGVtZW50ICh3aGljaCBoYXMgYSBoYXJkY29kZWQgd2lkdGgpIGluIHRoZSBhcHByb3ByaWF0ZSBjb3JuZXIuIFRoZW4gZmxpcCB0aGUgbGVmdC9yaWdodFxuICAgICAgICAvLyBwb3NpdGlvbmluZyBvZiB0aGUgbmVzdGVkIHdpZGdldCBlbGVtZW50IHRvIGFkanVzdCB0aGUgd2F5IGl0IHdpbGwgZXhwYW5kIHdoZW4gdGhlIG1lZGlhIGlzIGhvdmVyZWQuXG4gICAgICAgIHZhciBjb3JuZXIgPSBncm91cFNldHRpbmdzLm1lZGlhSW5kaWNhdG9yQ29ybmVyKCk7XG4gICAgICAgIHZhciBlbGVtZW50T2Zmc2V0ID0gJGNvbnRhaW5lckVsZW1lbnQub2Zmc2V0KCk7XG4gICAgICAgIHZhciBjb29yZHMgPSB7fTtcbiAgICAgICAgaWYgKGNvcm5lci5pbmRleE9mKCd0b3AnKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIGNvb3Jkcy50b3AgPSBlbGVtZW50T2Zmc2V0LnRvcDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciBib3JkZXJUb3AgPSBwYXJzZUludCgkY29udGFpbmVyRWxlbWVudC5jc3MoJ2JvcmRlci10b3AnKSkgfHwgMDtcbiAgICAgICAgICAgIGNvb3Jkcy50b3AgPSBlbGVtZW50T2Zmc2V0LnRvcCArICRjb250YWluZXJFbGVtZW50LmhlaWdodCgpICsgYm9yZGVyVG9wIC0gJHJvb3RFbGVtZW50Lm91dGVySGVpZ2h0KCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvcm5lci5pbmRleE9mKCdyaWdodCcpICE9PSAtMSkge1xuICAgICAgICAgICAgY29vcmRzLmxlZnQgPSBlbGVtZW50T2Zmc2V0LmxlZnQgKyAkY29udGFpbmVyRWxlbWVudC53aWR0aCgpIC0gJHdyYXBwZXJFbGVtZW50Lm91dGVyV2lkdGgoKTtcbiAgICAgICAgICAgICRyb290RWxlbWVudC5jc3Moe3JpZ2h0OjAsbGVmdDonJ30pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyIGJvcmRlckxlZnQgPSBwYXJzZUludCgkY29udGFpbmVyRWxlbWVudC5jc3MoJ2JvcmRlci1sZWZ0JykpIHx8IDA7XG4gICAgICAgICAgICBjb29yZHMubGVmdCA9IGVsZW1lbnRPZmZzZXQubGVmdCArIGJvcmRlckxlZnQ7XG4gICAgICAgICAgICAkcm9vdEVsZW1lbnQuY3NzKHtyaWdodDonJyxsZWZ0OjB9KTtcbiAgICAgICAgfVxuICAgICAgICAkd3JhcHBlckVsZW1lbnQuY3NzKGNvb3Jkcyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdXBkYXRlRGlzcGxheUZvclZpc2liaWxpdHkoKSB7XG4gICAgICAgIC8vIEhpZGUvc2hvdyB0aGUgaW5kaWNhdG9yIGJhc2VkIG9uIHdoZXRoZXIgdGhlIGNvbnRhaW5lciBlbGVtZW50IGlzIHZpc2libGUuXG4gICAgICAgIC8vIEV4YW1wbGVzIG9mIHdoZXJlIHdlIG5lZWQgdGhlcmUgYXJlIGNhcm91c2VscyBhbmQgb3VyIG93biByZWFkbW9yZSB3aWRnZXQuXG4gICAgICAgICRyb290RWxlbWVudC5jc3Moe2Rpc3BsYXk6IFZpc2liaWxpdHkuaXNWaXNpYmxlKCRjb250YWluZXJFbGVtZW50LmdldCgwKSkgPyAnJzogJ25vbmUnfSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiB3cmFwcGVyRWxlbWVudChyYWN0aXZlKSB7XG4gICAgcmV0dXJuIHJhY3RpdmUuZmluZCgnLmFudGVubmEtbWVkaWEtaW5kaWNhdG9yLXdyYXBwZXInKTtcbn1cblxuZnVuY3Rpb24gcm9vdEVsZW1lbnQocmFjdGl2ZSkge1xuICAgIHJldHVybiByYWN0aXZlLmZpbmQoJy5hbnRlbm5hLW1lZGlhLWluZGljYXRvci13aWRnZXQnKTtcbn1cblxuZnVuY3Rpb24gb3BlblJlYWN0aW9uc1dpbmRvdyhyZWFjdGlvbk9wdGlvbnMsIHJhY3RpdmUpIHtcbiAgICBSZWFjdGlvbnNXaWRnZXQub3BlbihyZWFjdGlvbk9wdGlvbnMsIHJvb3RFbGVtZW50KHJhY3RpdmUpKTtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZTogY3JlYXRlSW5kaWNhdG9yV2lkZ2V0XG59OyIsInZhciAkOyByZXF1aXJlKCcuL3V0aWxzL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIEFqYXhDbGllbnQgPSByZXF1aXJlKCcuL3V0aWxzL2FqYXgtY2xpZW50Jyk7XG52YXIgUGFnZVV0aWxzID0gcmVxdWlyZSgnLi91dGlscy9wYWdlLXV0aWxzJyk7XG52YXIgVGhyb3R0bGVkRXZlbnRzID0gcmVxdWlyZSgnLi91dGlscy90aHJvdHRsZWQtZXZlbnRzJyk7XG52YXIgVVJMcyA9IHJlcXVpcmUoJy4vdXRpbHMvdXJscycpO1xudmFyIFBhZ2VEYXRhID0gcmVxdWlyZSgnLi9wYWdlLWRhdGEnKTtcblxuLy8gQ29tcHV0ZSB0aGUgcGFnZXMgdGhhdCB3ZSBuZWVkIHRvIGZldGNoLiBUaGlzIGlzIGVpdGhlcjpcbi8vIDEuIEFueSBuZXN0ZWQgcGFnZXMgd2UgZmluZCB1c2luZyB0aGUgcGFnZSBzZWxlY3RvciBPUlxuLy8gMi4gVGhlIGN1cnJlbnQgd2luZG93IGxvY2F0aW9uXG5mdW5jdGlvbiBjb21wdXRlUGFnZXNQYXJhbSgkcGFnZUVsZW1lbnRBcnJheSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBncm91cElkID0gZ3JvdXBTZXR0aW5ncy5ncm91cElkKCk7XG4gICAgdmFyIHBhZ2VzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCAkcGFnZUVsZW1lbnRBcnJheS5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgJHBhZ2VFbGVtZW50ID0gJHBhZ2VFbGVtZW50QXJyYXlbaV07XG4gICAgICAgIHBhZ2VzLnB1c2goe1xuICAgICAgICAgICAgZ3JvdXBfaWQ6IGdyb3VwSWQsXG4gICAgICAgICAgICB1cmw6IFBhZ2VVdGlscy5jb21wdXRlUGFnZVVybCgkcGFnZUVsZW1lbnQsIGdyb3VwU2V0dGluZ3MpLFxuICAgICAgICAgICAgdGl0bGU6IFBhZ2VVdGlscy5jb21wdXRlUGFnZVRpdGxlKCRwYWdlRWxlbWVudCwgZ3JvdXBTZXR0aW5ncylcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGlmIChwYWdlcy5sZW5ndGggPT0gMSkge1xuICAgICAgICBwYWdlc1swXS5pbWFnZSA9IFBhZ2VVdGlscy5jb21wdXRlVG9wTGV2ZWxQYWdlSW1hZ2UoZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIHBhZ2VzWzBdLmF1dGhvciA9IFBhZ2VVdGlscy5jb21wdXRlUGFnZUF1dGhvcihncm91cFNldHRpbmdzKTtcbiAgICAgICAgcGFnZXNbMF0udG9waWNzID0gUGFnZVV0aWxzLmNvbXB1dGVQYWdlVG9waWNzKGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICBwYWdlc1swXS5zZWN0aW9uID0gUGFnZVV0aWxzLmNvbXB1dGVQYWdlU2l0ZVNlY3Rpb24oZ3JvdXBTZXR0aW5ncyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHsgcGFnZXM6IHBhZ2VzIH07XG59XG5cbmZ1bmN0aW9uIGxvYWRQYWdlRGF0YShwYWdlRGF0YVBhcmFtLCBncm91cFNldHRpbmdzKSB7XG4gICAgQWpheENsaWVudC5nZXRKU09OUChVUkxzLnBhZ2VEYXRhVXJsKCksIHBhZ2VEYXRhUGFyYW0sIHN1Y2Nlc3MsIGVycm9yKTtcblxuICAgIGZ1bmN0aW9uIHN1Y2Nlc3MoanNvbikge1xuICAgICAgICAvL3NldFRpbWVvdXQoZnVuY3Rpb24oKSB7IFBhZ2VEYXRhLnVwZGF0ZUFsbFBhZ2VEYXRhKGpzb24sIGdyb3VwU2V0dGluZ3MpOyB9LCAzMDAwKTtcbiAgICAgICAgUGFnZURhdGEudXBkYXRlQWxsUGFnZURhdGEoanNvbiwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZXJyb3IobWVzc2FnZSkge1xuICAgICAgICAvLyBUT0RPIGhhbmRsZSBlcnJvcnMgdGhhdCBoYXBwZW4gd2hlbiBsb2FkaW5nIHBhZ2UgZGF0YVxuICAgICAgICBjb25zb2xlLmxvZygnQW4gZXJyb3Igb2NjdXJyZWQgbG9hZGluZyBwYWdlIGRhdGE6ICcgKyBtZXNzYWdlKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHN0YXJ0TG9hZGluZ1BhZ2VEYXRhKGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgJHBhZ2VFbGVtZW50cyA9ICQoZ3JvdXBTZXR0aW5ncy5wYWdlU2VsZWN0b3IoKSk7XG4gICAgaWYgKCRwYWdlRWxlbWVudHMubGVuZ3RoID09IDApIHtcbiAgICAgICAgJHBhZ2VFbGVtZW50cyA9ICQoJ2JvZHknKTtcbiAgICB9XG4gICAgcXVldWVQYWdlRGF0YUxvYWQoJHBhZ2VFbGVtZW50cywgZ3JvdXBTZXR0aW5ncyk7XG59XG5cbmZ1bmN0aW9uIHF1ZXVlUGFnZURhdGFMb2FkKCRwYWdlRWxlbWVudHMsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgcGFnZXNUb0xvYWQgPSBbXTtcbiAgICAkcGFnZUVsZW1lbnRzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkcGFnZUVsZW1lbnQgPSAkKHRoaXMpO1xuICAgICAgICBpZiAoaXNJblZpZXcoJHBhZ2VFbGVtZW50KSkge1xuICAgICAgICAgICAgcGFnZXNUb0xvYWQucHVzaCgkcGFnZUVsZW1lbnQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbG9hZFdoZW5WaXNpYmxlKCRwYWdlRWxlbWVudCwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIGlmIChwYWdlc1RvTG9hZC5sZW5ndGggPiAwKSB7XG4gICAgICAgIHZhciBwYWdlRGF0YVBhcmFtID0gY29tcHV0ZVBhZ2VzUGFyYW0ocGFnZXNUb0xvYWQsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICBsb2FkUGFnZURhdGEocGFnZURhdGFQYXJhbSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBpc0luVmlldygkZWxlbWVudCkge1xuICAgIHZhciB0cmlnZ2VyRGlzdGFuY2UgPSAzMDA7XG4gICAgcmV0dXJuICRlbGVtZW50Lm9mZnNldCgpLnRvcCA8ICAkKGRvY3VtZW50KS5zY3JvbGxUb3AoKSArICQod2luZG93KS5oZWlnaHQoKSArIHRyaWdnZXJEaXN0YW5jZTtcbn1cblxuZnVuY3Rpb24gbG9hZFdoZW5WaXNpYmxlKCRwYWdlRWxlbWVudCwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBjaGVja1Zpc2liaWxpdHkgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKGlzSW5WaWV3KCRwYWdlRWxlbWVudCkpIHtcbiAgICAgICAgICAgIHZhciBwYWdlRGF0YVBhcmFtID0gY29tcHV0ZVBhZ2VzUGFyYW0oWyRwYWdlRWxlbWVudF0sIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgbG9hZFBhZ2VEYXRhKHBhZ2VEYXRhUGFyYW0sIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgVGhyb3R0bGVkRXZlbnRzLm9mZignc2Nyb2xsJywgY2hlY2tWaXNpYmlsaXR5KTtcbiAgICAgICAgICAgIFRocm90dGxlZEV2ZW50cy5vZmYoJ3Jlc2l6ZScsIGNoZWNrVmlzaWJpbGl0eSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFRocm90dGxlZEV2ZW50cy5vbignc2Nyb2xsJywgY2hlY2tWaXNpYmlsaXR5KTtcbiAgICBUaHJvdHRsZWRFdmVudHMub24oJ3Jlc2l6ZScsIGNoZWNrVmlzaWJpbGl0eSk7XG59XG5cbmZ1bmN0aW9uIHBhZ2VzQWRkZWQoJHBhZ2VFbGVtZW50cywgZ3JvdXBTZXR0aW5ncykge1xuICAgIHF1ZXVlUGFnZURhdGFMb2FkKCRwYWdlRWxlbWVudHMsIGdyb3VwU2V0dGluZ3MpO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgbG9hZDogc3RhcnRMb2FkaW5nUGFnZURhdGEsXG4gICAgcGFnZXNBZGRlZDogcGFnZXNBZGRlZFxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi91dGlscy9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcblxudmFyIEV2ZW50cyA9IHJlcXVpcmUoJy4vZXZlbnRzJyk7XG52YXIgSGFzaGVkRWxlbWVudHMgPSByZXF1aXJlKCcuL2hhc2hlZC1lbGVtZW50cycpO1xuXG4vLyBDb2xsZWN0aW9uIG9mIGFsbCBwYWdlIGRhdGEsIGtleWVkIGJ5IHBhZ2UgaGFzaFxudmFyIHBhZ2VzID0ge307XG4vLyBNYXBwaW5nIG9mIHBhZ2UgVVJMcyB0byBwYWdlIGhhc2hlcywgd2hpY2ggYXJlIGNvbXB1dGVkIG9uIHRoZSBzZXJ2ZXIuXG52YXIgdXJsSGFzaGVzID0ge307XG5cbmZ1bmN0aW9uIGdldFBhZ2VEYXRhKGhhc2gpIHtcbiAgICB2YXIgcGFnZURhdGEgPSBwYWdlc1toYXNoXTtcbiAgICBpZiAoIXBhZ2VEYXRhKSB7XG4gICAgICAgIC8vIFRPRE86IEdpdmUgdGhpcyBzZXJpb3VzIHRob3VnaHQuIEluIG9yZGVyIGZvciBtYWdpYyBtb2RlIHRvIHdvcmssIHRoZSBvYmplY3QgbmVlZHMgdG8gaGF2ZSB2YWx1ZXMgaW4gcGxhY2UgZm9yXG4gICAgICAgIC8vIHRoZSBvYnNlcnZlZCBwcm9wZXJ0aWVzIGF0IHRoZSBtb21lbnQgdGhlIHJhY3RpdmUgaXMgY3JlYXRlZC4gQnV0IHRoaXMgaXMgcHJldHR5IHVudXN1YWwgZm9yIEphdmFzY3JpcHQsIHRvIGhhdmVcbiAgICAgICAgLy8gdG8gZGVmaW5lIHRoZSB3aG9sZSBza2VsZXRvbiBmb3IgdGhlIG9iamVjdCBpbnN0ZWFkIG9mIGp1c3QgYWRkaW5nIHByb3BlcnRpZXMgd2hlbmV2ZXIgeW91IHdhbnQuXG4gICAgICAgIC8vIFRoZSBhbHRlcm5hdGl2ZSB3b3VsZCBiZSBmb3IgdXMgdG8ga2VlcCBvdXIgb3duIFwiZGF0YSBiaW5kaW5nXCIgYmV0d2VlbiB0aGUgcGFnZURhdGEgYW5kIHJhY3RpdmUgaW5zdGFuY2VzICgxIHRvIG1hbnkpXG4gICAgICAgIC8vIGFuZCB0ZWxsIHRoZSByYWN0aXZlcyB0byB1cGRhdGUgd2hlbmV2ZXIgdGhlIGRhdGEgY2hhbmdlcy5cbiAgICAgICAgcGFnZURhdGEgPSB7XG4gICAgICAgICAgICBwYWdlSGFzaDogaGFzaCxcbiAgICAgICAgICAgIHN1bW1hcnlSZWFjdGlvbnM6IFtdLFxuICAgICAgICAgICAgc3VtbWFyeVRvdGFsOiAwLFxuICAgICAgICAgICAgc3VtbWFyeUxvYWRlZDogZmFsc2UsXG4gICAgICAgICAgICBjb250YWluZXJzOiBbXSxcbiAgICAgICAgICAgIG1ldHJpY3M6IHt9IC8vIFRoaXMgaXMgYSBjYXRjaC1hbGwgZmllbGQgd2hlcmUgd2UgY2FuIGF0dGFjaCBjbGllbnQtc2lkZSBtZXRyaWNzIGZvciBhbmFseXRpY3NcbiAgICAgICAgfTtcbiAgICAgICAgcGFnZXNbaGFzaF0gPSBwYWdlRGF0YTtcbiAgICB9XG4gICAgcmV0dXJuIHBhZ2VEYXRhO1xufVxuXG5mdW5jdGlvbiB1cGRhdGVBbGxQYWdlRGF0YShqc29uUGFnZXMsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgYWxsUGFnZXMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGpzb25QYWdlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgcGFnZURhdGEgPSB1cGRhdGVQYWdlRGF0YShqc29uUGFnZXNbaV0sIGdyb3VwU2V0dGluZ3MpXG4gICAgICAgIGFsbFBhZ2VzLnB1c2gocGFnZURhdGEpO1xuICAgICAgICBFdmVudHMucG9zdFBhZ2VEYXRhTG9hZGVkKHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZVBhZ2VEYXRhKGpzb24sIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgcGFnZURhdGEgPSBnZXRQYWdlRGF0YUZvckpzb25SZXNwb25zZShqc29uKTtcbiAgICBwYWdlRGF0YS5wYWdlSWQgPSBqc29uLmlkO1xuICAgIHBhZ2VEYXRhLnBhZ2VIYXNoID0ganNvbi5wYWdlSGFzaDtcbiAgICBwYWdlRGF0YS5ncm91cElkID0gZ3JvdXBTZXR0aW5ncy5ncm91cElkKCk7XG4gICAgcGFnZURhdGEuY2Fub25pY2FsVXJsID0ganNvbi5jYW5vbmljYWxVUkw7XG4gICAgcGFnZURhdGEucmVxdWVzdGVkVXJsID0ganNvbi5yZXF1ZXN0ZWRVUkw7XG4gICAgcGFnZURhdGEuYXV0aG9yID0ganNvbi5hdXRob3I7XG4gICAgcGFnZURhdGEuc2VjdGlvbiA9IGpzb24uc2VjdGlvbjtcbiAgICBwYWdlRGF0YS50b3BpY3MgPSBqc29uLnRvcGljcztcbiAgICBwYWdlRGF0YS50aXRsZSA9IGpzb24udGl0bGU7XG4gICAgcGFnZURhdGEuaW1hZ2UgPSBqc29uLmltYWdlO1xuXG4gICAgdmFyIHN1bW1hcnlSZWFjdGlvbnMgPSBqc29uLnN1bW1hcnlSZWFjdGlvbnM7XG4gICAgcGFnZURhdGEuc3VtbWFyeVJlYWN0aW9ucyA9IHN1bW1hcnlSZWFjdGlvbnM7XG4gICAgc2V0Q29udGFpbmVycyhwYWdlRGF0YSwganNvbi5jb250YWluZXJzKTtcblxuICAgIC8vIFdlIGFkZCB1cCB0aGUgc3VtbWFyeSByZWFjdGlvbiB0b3RhbCBjbGllbnQtc2lkZVxuICAgIHZhciB0b3RhbCA9IDA7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdW1tYXJ5UmVhY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHRvdGFsID0gdG90YWwgKyBzdW1tYXJ5UmVhY3Rpb25zW2ldLmNvdW50O1xuICAgIH1cbiAgICBwYWdlRGF0YS5zdW1tYXJ5VG90YWwgPSB0b3RhbDtcbiAgICBwYWdlRGF0YS5zdW1tYXJ5TG9hZGVkID0gdHJ1ZTtcblxuICAgIC8vIFdlIGFkZCB1cCB0aGUgY29udGFpbmVyIHJlYWN0aW9uIHRvdGFscyBjbGllbnQtc2lkZVxuICAgIHZhciB0b3RhbCA9IDA7XG4gICAgdmFyIGNvbnRhaW5lckNvdW50cyA9IFtdO1xuICAgIHZhciBjb250YWluZXJzID0gcGFnZURhdGEuY29udGFpbmVycztcbiAgICBmb3IgKHZhciBoYXNoIGluIGpzb24uY29udGFpbmVycykge1xuICAgICAgICBpZiAoY29udGFpbmVycy5oYXNPd25Qcm9wZXJ0eShoYXNoKSkge1xuICAgICAgICAgICAgdmFyIGNvbnRhaW5lciA9IGNvbnRhaW5lcnNbaGFzaF07XG4gICAgICAgICAgICB2YXIgdG90YWwgPSAwO1xuICAgICAgICAgICAgdmFyIGNvbnRhaW5lclJlYWN0aW9ucyA9IGNvbnRhaW5lci5yZWFjdGlvbnM7XG4gICAgICAgICAgICBpZiAoY29udGFpbmVyUmVhY3Rpb25zKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb250YWluZXJSZWFjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdG90YWwgPSB0b3RhbCArIGNvbnRhaW5lclJlYWN0aW9uc1tpXS5jb3VudDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb250YWluZXIucmVhY3Rpb25Ub3RhbCA9IHRvdGFsO1xuICAgICAgICAgICAgY29udGFpbmVyQ291bnRzLnB1c2goeyBjb3VudDogdG90YWwsIGNvbnRhaW5lcjogY29udGFpbmVyIH0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIHZhciBpbmRpY2F0b3JMaW1pdCA9IGdyb3VwU2V0dGluZ3MudGV4dEluZGljYXRvckxpbWl0KCk7XG4gICAgaWYgKGluZGljYXRvckxpbWl0KSB7XG4gICAgICAgIC8vIElmIGFuIGluZGljYXRvciBsaW1pdCBpcyBzZXQsIHNvcnQgdGhlIGNvbnRhaW5lcnMgYW5kIG1hcmsgb25seSB0aGUgdG9wIE4gdG8gYmUgdmlzaWJsZS5cbiAgICAgICAgY29udGFpbmVyQ291bnRzLnNvcnQoZnVuY3Rpb24oYSwgYikgeyByZXR1cm4gYi5jb3VudCAtIGEuY291bnQ7IH0pOyAvLyBzb3J0IGxhcmdlc3QgY291bnQgZmlyc3RcbiAgICAgICAgZm9yICh2YXIgaSA9IGluZGljYXRvckxpbWl0OyBpIDwgY29udGFpbmVyQ291bnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb250YWluZXJDb3VudHNbaV0uY29udGFpbmVyLnN1cHByZXNzID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBwYWdlRGF0YTtcbn1cblxuZnVuY3Rpb24gZ2V0Q29udGFpbmVyRGF0YShwYWdlRGF0YSwgY29udGFpbmVySGFzaCkge1xuICAgIHZhciBjb250YWluZXJEYXRhID0gcGFnZURhdGEuY29udGFpbmVyc1tjb250YWluZXJIYXNoXTtcbiAgICBpZiAoIWNvbnRhaW5lckRhdGEpIHtcbiAgICAgICAgY29udGFpbmVyRGF0YSA9IHtcbiAgICAgICAgICAgIGhhc2g6IGNvbnRhaW5lckhhc2gsXG4gICAgICAgICAgICByZWFjdGlvblRvdGFsOiAwLFxuICAgICAgICAgICAgcmVhY3Rpb25zOiBbXSxcbiAgICAgICAgICAgIGxvYWRlZDogcGFnZURhdGEuc3VtbWFyeUxvYWRlZCxcbiAgICAgICAgICAgIHN1cHByZXNzOiBmYWxzZVxuICAgICAgICB9O1xuICAgICAgICBwYWdlRGF0YS5jb250YWluZXJzW2NvbnRhaW5lckhhc2hdID0gY29udGFpbmVyRGF0YTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbnRhaW5lckRhdGE7XG59XG5cbi8vIE1lcmdlIHRoZSBnaXZlbiBjb250YWluZXIgZGF0YSBpbnRvIHRoZSBwYWdlRGF0YS5jb250YWluZXJzIGRhdGEuIFRoaXMgaXMgbmVjZXNzYXJ5IGJlY2F1c2UgdGhlIHNrZWxldG9uIG9mIHRoZSBwYWdlRGF0YS5jb250YWluZXJzIG1hcFxuLy8gaXMgc2V0IHVwIGFuZCBib3VuZCB0byB0aGUgVUkgYmVmb3JlIGFsbCB0aGUgZGF0YSBpcyBmZXRjaGVkIGZyb20gdGhlIHNlcnZlciBhbmQgd2UgZG9uJ3Qgd2FudCB0byBicmVhayB0aGUgZGF0YSBiaW5kaW5nLlxuZnVuY3Rpb24gc2V0Q29udGFpbmVycyhwYWdlRGF0YSwganNvbkNvbnRhaW5lcnMpIHtcbiAgICBmb3IgKHZhciBoYXNoIGluIGpzb25Db250YWluZXJzKSB7XG4gICAgICAgIGlmIChqc29uQ29udGFpbmVycy5oYXNPd25Qcm9wZXJ0eShoYXNoKSkge1xuICAgICAgICAgICAgdmFyIGNvbnRhaW5lckRhdGEgPSBnZXRDb250YWluZXJEYXRhKHBhZ2VEYXRhLCBoYXNoKTtcbiAgICAgICAgICAgIHZhciBmZXRjaGVkQ29udGFpbmVyRGF0YSA9IGpzb25Db250YWluZXJzW2hhc2hdO1xuICAgICAgICAgICAgY29udGFpbmVyRGF0YS5pZCA9IGZldGNoZWRDb250YWluZXJEYXRhLmlkO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBmZXRjaGVkQ29udGFpbmVyRGF0YS5yZWFjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjb250YWluZXJEYXRhLnJlYWN0aW9ucy5wdXNoKGZldGNoZWRDb250YWluZXJEYXRhLnJlYWN0aW9uc1tpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgdmFyIGFsbENvbnRhaW5lcnMgPSBwYWdlRGF0YS5jb250YWluZXJzO1xuICAgIGZvciAodmFyIGhhc2ggaW4gYWxsQ29udGFpbmVycykge1xuICAgICAgICBpZiAoYWxsQ29udGFpbmVycy5oYXNPd25Qcm9wZXJ0eShoYXNoKSkge1xuICAgICAgICAgICAgdmFyIGNvbnRhaW5lciA9IGFsbENvbnRhaW5lcnNbaGFzaF07XG4gICAgICAgICAgICBjb250YWluZXIubG9hZGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gY2xlYXJJbmRpY2F0b3JMaW1pdChwYWdlRGF0YSkge1xuICAgIHZhciBjb250YWluZXJzID0gcGFnZURhdGEuY29udGFpbmVycztcbiAgICBmb3IgKHZhciBoYXNoIGluIGNvbnRhaW5lcnMpIHtcbiAgICAgICAgaWYgKGNvbnRhaW5lcnMuaGFzT3duUHJvcGVydHkoaGFzaCkpIHtcbiAgICAgICAgICAgIHZhciBjb250YWluZXIgPSBjb250YWluZXJzW2hhc2hdO1xuICAgICAgICAgICAgY29udGFpbmVyLnN1cHByZXNzID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8vIFJldHVybnMgdGhlIGxvY2F0aW9ucyB3aGVyZSB0aGUgZ2l2ZW4gcmVhY3Rpb24gb2NjdXJzIG9uIHRoZSBwYWdlLiBUaGUgcmV0dXJuIGZvcm1hdCBpczpcbi8vIHtcbi8vICAgPGNvbnRlbnRfaWQ+IDoge1xuLy8gICAgIGNvdW50OiA8bnVtYmVyPixcbi8vICAgICBpZDogPGNvbnRlbnRfaWQ+LFxuLy8gICAgIGNvbnRhaW5lcklEOiA8Y29udGFpbmVyX2lkPlxuLy8gICAgIGtpbmQ6IDxjb250ZW50IGtpbmQ+LFxuLy8gICAgIGxvY2F0aW9uOiA8bG9jYXRpb24+LFxuLy8gICAgIFtib2R5OiA8Ym9keT5dIGZpbGxlZCBpbiBsYXRlciB2aWEgdXBkYXRlTG9jYXRpb25EYXRhXG4vLyAgIH1cbi8vIH1cbmZ1bmN0aW9uIGdldFJlYWN0aW9uTG9jYXRpb25EYXRhKHJlYWN0aW9uLCBwYWdlRGF0YSkge1xuICAgIGlmICghcGFnZURhdGEubG9jYXRpb25EYXRhKSB7IC8vIFBvcHVsYXRlIHRoaXMgdHJlZSBsYXppbHksIHNpbmNlIGl0J3Mgbm90IGZyZXF1ZW50bHkgdXNlZC5cbiAgICAgICAgcGFnZURhdGEubG9jYXRpb25EYXRhID0gY29tcHV0ZUxvY2F0aW9uRGF0YShwYWdlRGF0YSk7XG4gICAgfVxuICAgIHJldHVybiBwYWdlRGF0YS5sb2NhdGlvbkRhdGFbcmVhY3Rpb24uaWRdO1xufVxuXG4vLyBSZXR1cm5zIGEgdmlldyBvbiB0aGUgZ2l2ZW4gdHJlZSBzdHJ1Y3R1cmUgdGhhdCdzIG9wdGltaXplZCBmb3IgcmVuZGVyaW5nIHRoZSBsb2NhdGlvbiBvZiByZWFjdGlvbnMgKGFzIGZyb20gdGhlXG4vLyBzdW1tYXJ5IHdpZGdldCkuIEZvciBlYWNoIHJlYWN0aW9uLCB3ZSBjYW4gcXVpY2tseSBnZXQgdG8gdGhlIHBpZWNlcyBvZiBjb250ZW50IHRoYXQgaGF2ZSB0aGF0IHJlYWN0aW9uIGFzIHdlbGwgYXNcbi8vIHRoZSBjb3VudCBvZiB0aG9zZSByZWFjdGlvbnMgZm9yIGVhY2ggcGllY2Ugb2YgY29udGVudC5cbi8vXG4vLyBUaGUgc3RydWN0dXJlIGxvb2tzIGxpa2UgdGhpczpcbi8vIHtcbi8vICAgPHJlYWN0aW9uX2lkPiA6IHsgICAodGhpcyBpcyB0aGUgaW50ZXJhY3Rpb25fbm9kZV9pZClcbi8vICAgICA8Y29udGVudF9pZD4gOiB7XG4vLyAgICAgICBjb3VudCA6IDxudW1iZXI+LFxuLy8gICAgICAgY29udGFpbmVySUQ6IDxjb250YWluZXJfaWQ+LFxuLy8gICAgICAga2luZDogPGNvbnRlbnQga2luZD4sXG4vLyAgICAgICBsb2NhdGlvbjogPGxvY2F0aW9uPlxuLy8gICAgICAgW2JvZHk6IDxib2R5Pl0gZmlsbGVkIGluIGxhdGVyIHZpYSB1cGRhdGVMb2NhdGlvbkRhdGFcbi8vICAgICB9XG4vLyAgIH1cbi8vIH1cbmZ1bmN0aW9uIGNvbXB1dGVMb2NhdGlvbkRhdGEocGFnZURhdGEpIHtcbiAgICB2YXIgbG9jYXRpb25EYXRhID0ge307XG4gICAgdmFyIGNvbnRhaW5lcnMgPSBwYWdlRGF0YS5jb250YWluZXJzO1xuICAgIGZvciAodmFyIGhhc2ggaW4gY29udGFpbmVycykge1xuICAgICAgICBpZiAoY29udGFpbmVycy5oYXNPd25Qcm9wZXJ0eShoYXNoKSkge1xuICAgICAgICAgICAgdmFyIGNvbnRhaW5lckRhdGEgPSBjb250YWluZXJzW2hhc2hdO1xuICAgICAgICAgICAgdmFyIHJlYWN0aW9ucyA9IGNvbnRhaW5lckRhdGEucmVhY3Rpb25zO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZWFjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgcmVhY3Rpb24gPSByZWFjdGlvbnNbaV07XG4gICAgICAgICAgICAgICAgdmFyIHJlYWN0aW9uSWQgPSByZWFjdGlvbi5pZDtcbiAgICAgICAgICAgICAgICB2YXIgY29udGVudCA9IHJlYWN0aW9uLmNvbnRlbnQ7XG4gICAgICAgICAgICAgICAgdmFyIGNvbnRlbnRJZCA9IGNvbnRlbnQuaWQ7XG4gICAgICAgICAgICAgICAgdmFyIHJlYWN0aW9uTG9jYXRpb25EYXRhID0gbG9jYXRpb25EYXRhW3JlYWN0aW9uSWRdO1xuICAgICAgICAgICAgICAgIGlmICghcmVhY3Rpb25Mb2NhdGlvbkRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVhY3Rpb25Mb2NhdGlvbkRhdGEgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgbG9jYXRpb25EYXRhW3JlYWN0aW9uSWRdID0gcmVhY3Rpb25Mb2NhdGlvbkRhdGE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBjb250ZW50TG9jYXRpb25EYXRhID0gcmVhY3Rpb25Mb2NhdGlvbkRhdGFbY29udGVudElkXTsgLy8gVE9ETzogSXQncyBub3QgcmVhbGx5IHBvc3NpYmxlIHRvIGdldCBhIGhpdCBoZXJlLCBpcyBpdD8gV2Ugc2hvdWxkIG5ldmVyIHNlZSB0d28gaW5zdGFuY2VzIG9mIHRoZSBzYW1lIHJlYWN0aW9uIGZvciB0aGUgc2FtZSBjb250ZW50PyAoVGhlcmUnZCB3b3VsZCBqdXN0IGJlIG9uZSBpbnN0YW5jZSB3aXRoIGEgY291bnQgPiAxLilcbiAgICAgICAgICAgICAgICBpZiAoIWNvbnRlbnRMb2NhdGlvbkRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGVudExvY2F0aW9uRGF0YSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50OiAwLFxuICAgICAgICAgICAgICAgICAgICAgICAga2luZDogY29udGVudC5raW5kLCAvLyBUT0RPOiBXZSBzaG91bGQgbm9ybWFsaXplIHRoaXMgdmFsdWUgdG8gYSBzZXQgb2YgY29uc3RhbnRzLiBmaXggdGhpcyBpbiBsb2NhdGlvbnMtcGFnZSB3aGVyZSB0aGUgdmFsdWUgaXMgcmVhZCBhcyB3ZWxsLlxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogYWxzbyBjb25zaWRlciB0cmFuc2xhdGluZyB0aGlzIGZyb20gdGhlIHJhdyBcImtpbmRcIiB0byBcInR5cGVcIi4gKGUuZy4gXCJwYWdcIiA9PiBcInBhZ2VcIilcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uOiBjb250ZW50LmxvY2F0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGFpbmVySGFzaDogY29udGFpbmVyRGF0YS5oYXNoLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudElkOiBjb250ZW50SWRcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgcmVhY3Rpb25Mb2NhdGlvbkRhdGFbY29udGVudElkXSA9IGNvbnRlbnRMb2NhdGlvbkRhdGE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnRlbnRMb2NhdGlvbkRhdGEuY291bnQgKz0gcmVhY3Rpb24uY291bnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGxvY2F0aW9uRGF0YTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlUmVhY3Rpb25Mb2NhdGlvbkRhdGEocmVhY3Rpb25Mb2NhdGlvbkRhdGEsIGNvbnRlbnRCb2RpZXMpIHtcbiAgICBmb3IgKHZhciBjb250ZW50SWQgaW4gY29udGVudEJvZGllcykge1xuICAgICAgICBpZiAoY29udGVudEJvZGllcy5oYXNPd25Qcm9wZXJ0eShjb250ZW50SWQpKSB7XG4gICAgICAgICAgICB2YXIgY29udGVudExvY2F0aW9uRGF0YSA9IHJlYWN0aW9uTG9jYXRpb25EYXRhW2NvbnRlbnRJZF07XG4gICAgICAgICAgICBpZiAoY29udGVudExvY2F0aW9uRGF0YSkge1xuICAgICAgICAgICAgICAgIGNvbnRlbnRMb2NhdGlvbkRhdGEuYm9keSA9IGNvbnRlbnRCb2RpZXNbY29udGVudElkXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gcmVnaXN0ZXJSZWFjdGlvbihyZWFjdGlvbiwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEpIHtcbiAgICB2YXIgZXhpc3RpbmdSZWFjdGlvbnMgPSBjb250YWluZXJEYXRhLnJlYWN0aW9ucztcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGV4aXN0aW5nUmVhY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChleGlzdGluZ1JlYWN0aW9uc1tpXS5pZCA9PT0gcmVhY3Rpb24uaWQpIHtcbiAgICAgICAgICAgIC8vIFRoaXMgcmVhY3Rpb24gaGFzIGFscmVhZHkgYmVlbiBhZGRlZCB0byB0aGlzIGNvbnRhaW5lci4gRG9uJ3QgYWRkIGl0IGFnYWluLlxuICAgICAgICAgICAgcmV0dXJuIGV4aXN0aW5nUmVhY3Rpb25zW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIGNvbnRhaW5lckRhdGEucmVhY3Rpb25zLnB1c2gocmVhY3Rpb24pO1xuICAgIGNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbCA9IGNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbCArIDE7XG4gICAgdmFyIGV4aXN0c0luU3VtbWFyeSA9IGZhbHNlO1xuICAgIHZhciBleGlzdGluZ1N1bW1hcnlSZWFjdGlvbnMgPSBwYWdlRGF0YS5zdW1tYXJ5UmVhY3Rpb25zO1xuICAgIGZvciAodmFyIGogPSAwOyBqIDwgZXhpc3RpbmdTdW1tYXJ5UmVhY3Rpb25zLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIGlmIChleGlzdGluZ1N1bW1hcnlSZWFjdGlvbnNbal0uaWQgPT09IHJlYWN0aW9uLmlkKSB7XG4gICAgICAgICAgICAvLyBJZiB0aGlzIHJlYWN0aW9uIGFscmVhZHkgZXhpc3RzIGluIHRoZSBzdW1tYXJ5LCBpbmNyZW1lbnQgdGhlIGNvdW50LlxuICAgICAgICAgICAgZXhpc3RpbmdTdW1tYXJ5UmVhY3Rpb25zW2pdLmNvdW50ICs9IDE7XG4gICAgICAgICAgICBleGlzdHNJblN1bW1hcnkgPSB0cnVlO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKCFleGlzdHNJblN1bW1hcnkpIHtcbiAgICAgICAgdmFyIHN1bW1hcnlSZWFjdGlvbiA9IHtcbiAgICAgICAgICAgIHRleHQ6IHJlYWN0aW9uLnRleHQsXG4gICAgICAgICAgICBpZDogcmVhY3Rpb24uaWQsXG4gICAgICAgICAgICBjb3VudDogcmVhY3Rpb24uY291bnRcbiAgICAgICAgfTtcbiAgICAgICAgcGFnZURhdGEuc3VtbWFyeVJlYWN0aW9ucy5wdXNoKHN1bW1hcnlSZWFjdGlvbik7XG4gICAgfVxuICAgIHBhZ2VEYXRhLnN1bW1hcnlUb3RhbCA9IHBhZ2VEYXRhLnN1bW1hcnlUb3RhbCArIDE7XG4gICAgcmV0dXJuIHJlYWN0aW9uO1xufVxuXG4vLyBHZXRzIHBhZ2UgZGF0YSBiYXNlZCBvbiBhIFVSTC4gVGhpcyBhbGxvd3Mgb3VyIGNsaWVudCB0byBzdGFydCBwcm9jZXNzaW5nIGEgcGFnZSAoYW5kIGJpbmRpbmcgZGF0YSBvYmplY3RzXG4vLyB0byB0aGUgVUkpICpiZWZvcmUqIHdlIGdldCBkYXRhIGJhY2sgZnJvbSB0aGUgc2VydmVyLlxuZnVuY3Rpb24gZ2V0UGFnZURhdGFCeVVSTCh1cmwpIHtcbiAgICB2YXIgc2VydmVySGFzaCA9IHVybEhhc2hlc1t1cmxdO1xuICAgIGlmIChzZXJ2ZXJIYXNoKSB7XG4gICAgICAgIC8vIElmIHRoZSBzZXJ2ZXIgYWxyZWFkeSBnaXZlbiB1cyB0aGUgaGFzaCBmb3IgdGhlIHBhZ2UsIHVzZSBpdC5cbiAgICAgICAgcmV0dXJuIGdldFBhZ2VEYXRhKHNlcnZlckhhc2gpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIE90aGVyd2lzZSwgdGVtcG9yYXJpbHkgdXNlIHRoZSB1cmwgYXMgdGhlIGhhc2guIFRoaXMgd2lsbCBnZXQgdXBkYXRlZCB3aGVuZXZlciB3ZSBnZXQgZGF0YSBiYWNrIGZyb20gdGhlIHNlcnZlci5cbiAgICAgICAgcmV0dXJuIGdldFBhZ2VEYXRhKHVybCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBnZXRQYWdlRGF0YUZvckpzb25SZXNwb25zZShqc29uKSB7XG4gICAgdmFyIHBhZ2VIYXNoID0ganNvbi5wYWdlSGFzaDtcbiAgICB2YXIgcmVxdWVzdGVkVVJMID0ganNvbi5yZXF1ZXN0ZWRVUkw7XG4gICAgdXJsSGFzaGVzW3JlcXVlc3RlZFVSTF0gPSBwYWdlSGFzaDtcbiAgICB2YXIgdXJsQmFzZWREYXRhID0gcGFnZXNbcmVxdWVzdGVkVVJMXTtcbiAgICBpZiAodXJsQmFzZWREYXRhKSB7XG4gICAgICAgIC8vIElmIHdlJ3ZlIGFscmVhZHkgY3JlYXRlZC9ib3VuZCBhIHBhZ2VEYXRhIG9iamVjdCB1bmRlciB0aGUgcmVxdWVzdGVkVXJsLCB1cGRhdGUgdGhlIHBhZ2VIYXNoIGFuZCBtb3ZlIHRoYXRcbiAgICAgICAgLy8gZGF0YSBvdmVyIHRvIHRoZSBoYXNoIGtleVxuICAgICAgICB1cmxCYXNlZERhdGEucGFnZUhhc2ggPSBqc29uLnBhZ2VIYXNoO1xuICAgICAgICBwYWdlc1twYWdlSGFzaF0gPSB1cmxCYXNlZERhdGE7XG4gICAgICAgIGRlbGV0ZSBwYWdlc1tyZXF1ZXN0ZWRVUkxdO1xuICAgICAgICAvLyBVcGRhdGUgdGhlIG1hcHBpbmcgb2YgaGFzaGVzIHRvIHBhZ2UgZWxlbWVudHMgc28gaXQgYWxzbyBrbm93cyBhYm91dCB0aGUgY2hhbmdlIHRvIHRoZSBwYWdlIGhhc2hcbiAgICAgICAgSGFzaGVkRWxlbWVudHMudXBkYXRlUGFnZUhhc2gocmVxdWVzdGVkVVJMLCBwYWdlSGFzaCk7XG4gICAgfVxuICAgIHJldHVybiBnZXRQYWdlRGF0YShwYWdlSGFzaCk7XG59XG5cbmZ1bmN0aW9uIHRlYXJkb3duKCkge1xuICAgIHBhZ2VzID0ge307XG4gICAgdXJsSGFzaGVzID0ge307XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBnZXRQYWdlRGF0YUJ5VVJMOiBnZXRQYWdlRGF0YUJ5VVJMLFxuICAgIGdldFBhZ2VEYXRhOiBnZXRQYWdlRGF0YSxcbiAgICB1cGRhdGVBbGxQYWdlRGF0YTogdXBkYXRlQWxsUGFnZURhdGEsXG4gICAgZ2V0Q29udGFpbmVyRGF0YTogZ2V0Q29udGFpbmVyRGF0YSxcbiAgICBnZXRSZWFjdGlvbkxvY2F0aW9uRGF0YTogZ2V0UmVhY3Rpb25Mb2NhdGlvbkRhdGEsXG4gICAgdXBkYXRlUmVhY3Rpb25Mb2NhdGlvbkRhdGE6IHVwZGF0ZVJlYWN0aW9uTG9jYXRpb25EYXRhLFxuICAgIHJlZ2lzdGVyUmVhY3Rpb246IHJlZ2lzdGVyUmVhY3Rpb24sXG4gICAgY2xlYXJJbmRpY2F0b3JMaW1pdDogY2xlYXJJbmRpY2F0b3JMaW1pdCxcbiAgICB0ZWFyZG93bjogdGVhcmRvd24sXG59OyIsInZhciAkOyByZXF1aXJlKCcuL3V0aWxzL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIEFwcE1vZGUgPSByZXF1aXJlKCcuL3V0aWxzL2FwcC1tb2RlJyk7XG52YXIgQnJvd3Nlck1ldHJpY3MgPSByZXF1aXJlKCcuL3V0aWxzL2Jyb3dzZXItbWV0cmljcycpO1xudmFyIEhhc2ggPSByZXF1aXJlKCcuL3V0aWxzL2hhc2gnKTtcbnZhciBNdXRhdGlvbk9ic2VydmVyID0gcmVxdWlyZSgnLi91dGlscy9tdXRhdGlvbi1vYnNlcnZlcicpO1xudmFyIFBhZ2VVdGlscyA9IHJlcXVpcmUoJy4vdXRpbHMvcGFnZS11dGlscycpO1xudmFyIFNlZ21lbnQgPSByZXF1aXJlKCcuL3V0aWxzL3NlZ21lbnQnKTtcbnZhciBVUkxzID0gcmVxdWlyZSgnLi91dGlscy91cmxzJyk7XG52YXIgV2lkZ2V0QnVja2V0ID0gcmVxdWlyZSgnLi91dGlscy93aWRnZXQtYnVja2V0Jyk7XG5cbnZhciBBdXRvQ2FsbFRvQWN0aW9uID0gcmVxdWlyZSgnLi9hdXRvLWNhbGwtdG8tYWN0aW9uJyk7XG52YXIgQ2FsbFRvQWN0aW9uSW5kaWNhdG9yID0gcmVxdWlyZSgnLi9jYWxsLXRvLWFjdGlvbi1pbmRpY2F0b3InKTtcbnZhciBDb250ZW50UmVjID0gcmVxdWlyZSgnLi9jb250ZW50LXJlYy13aWRnZXQnKTtcbnZhciBIYXNoZWRFbGVtZW50cyA9IHJlcXVpcmUoJy4vaGFzaGVkLWVsZW1lbnRzJyk7XG52YXIgTWVkaWFJbmRpY2F0b3JXaWRnZXQgPSByZXF1aXJlKCcuL21lZGlhLWluZGljYXRvci13aWRnZXQnKTtcbnZhciBQYWdlRGF0YSA9IHJlcXVpcmUoJy4vcGFnZS1kYXRhJyk7XG52YXIgUGFnZURhdGFMb2FkZXIgPSByZXF1aXJlKCcuL3BhZ2UtZGF0YS1sb2FkZXInKTtcbnZhciBSZWFkTW9yZUV2ZW50cyA9IHJlcXVpcmUoJy4vcmVhZG1vcmUtZXZlbnRzJyk7XG52YXIgU3VtbWFyeVdpZGdldCA9IHJlcXVpcmUoJy4vc3VtbWFyeS13aWRnZXQnKTtcbnZhciBUZXh0SW5kaWNhdG9yV2lkZ2V0ID0gcmVxdWlyZSgnLi90ZXh0LWluZGljYXRvci13aWRnZXQnKTtcbnZhciBUZXh0UmVhY3Rpb25zID0gcmVxdWlyZSgnLi90ZXh0LXJlYWN0aW9ucycpO1xuXG52YXIgVFlQRV9URVhUID0gXCJ0ZXh0XCI7XG52YXIgVFlQRV9JTUFHRSA9IFwiaW1hZ2VcIjtcbnZhciBUWVBFX01FRElBID0gXCJtZWRpYVwiO1xuXG52YXIgQVRUUl9IQVNIID0gXCJhbnQtaGFzaFwiO1xuXG52YXIgY3JlYXRlZFdpZGdldHMgPSBbXTtcblxuXG4vLyBTY2FuIGZvciBhbGwgcGFnZXMgYXQgdGhlIGN1cnJlbnQgYnJvd3NlciBsb2NhdGlvbi4gVGhpcyBjb3VsZCBqdXN0IGJlIHRoZSBjdXJyZW50IHBhZ2Ugb3IgaXQgY291bGQgYmUgYSBjb2xsZWN0aW9uXG4vLyBvZiBwYWdlcyAoYWthICdwb3N0cycpLlxuZnVuY3Rpb24gc2NhbkFsbFBhZ2VzKGdyb3VwU2V0dGluZ3MsIHJlaW5pdGlhbGl6ZUNhbGxiYWNrKSB7XG4gICAgJChncm91cFNldHRpbmdzLmV4Y2x1c2lvblNlbGVjdG9yKCkpLmFkZENsYXNzKCduby1hbnQnKTsgLy8gQWRkIHRoZSBuby1hbnQgY2xhc3MgdG8gZXZlcnl0aGluZyB0aGF0IGlzIGZsYWdnZWQgZm9yIGV4Y2x1c2lvblxuICAgIHZhciAkcGFnZXMgPSAkKGdyb3VwU2V0dGluZ3MucGFnZVNlbGVjdG9yKCkpOyAvLyBUT0RPOiBuby1hbnQ/XG4gICAgaWYgKCRwYWdlcy5sZW5ndGggPT0gMCkge1xuICAgICAgICAvLyBJZiB3ZSBkb24ndCBkZXRlY3QgYW55IHBhZ2UgbWFya2VycywgdHJlYXQgdGhlIHdob2xlIGRvY3VtZW50IGFzIHRoZSBzaW5nbGUgcGFnZVxuICAgICAgICAkcGFnZXMgPSAkKCdib2R5Jyk7IC8vIFRPRE86IElzIHRoaXMgdGhlIHJpZ2h0IGJlaGF2aW9yPyAoS2VlcCBpbiBzeW5jIHdpdGggdGhlIHNhbWUgYXNzdW1wdGlvbiB0aGF0J3MgYnVpbHQgaW50byBwYWdlLWRhdGEtbG9hZGVyLilcbiAgICB9XG4gICAgJHBhZ2VzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkcGFnZSA9ICQodGhpcyk7XG4gICAgICAgIHNjYW5QYWdlKCRwYWdlLCBncm91cFNldHRpbmdzLCAkcGFnZXMubGVuZ3RoID4gMSk7XG4gICAgfSk7XG4gICAgc2V0dXBNdXRhdGlvbk9ic2VydmVyKGdyb3VwU2V0dGluZ3MsIHJlaW5pdGlhbGl6ZUNhbGxiYWNrKTtcbn1cblxuLy8gU2NhbiB0aGUgcGFnZSB1c2luZyB0aGUgZ2l2ZW4gc2V0dGluZ3M6XG4vLyAxLiBGaW5kIGFsbCB0aGUgY29udGFpbmVycyB0aGF0IHdlIGNhcmUgYWJvdXQuXG4vLyAyLiBDb21wdXRlIGhhc2hlcyBmb3IgZWFjaCBjb250YWluZXIuXG4vLyAzLiBJbnNlcnQgd2lkZ2V0IGFmZm9yZGFuY2VzIGZvciBlYWNoIHdoaWNoIGFyZSBib3VuZCB0byB0aGUgZGF0YSBtb2RlbCBieSB0aGUgaGFzaGVzLlxuZnVuY3Rpb24gc2NhblBhZ2UoJHBhZ2UsIGdyb3VwU2V0dGluZ3MsIGlzTXVsdGlQYWdlKSB7XG4gICAgdmFyIHVybCA9IFBhZ2VVdGlscy5jb21wdXRlUGFnZVVybCgkcGFnZSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgdmFyIHBhZ2VEYXRhID0gUGFnZURhdGEuZ2V0UGFnZURhdGFCeVVSTCh1cmwpO1xuICAgIHZhciAkYWN0aXZlU2VjdGlvbnMgPSBmaW5kKCRwYWdlLCBncm91cFNldHRpbmdzLmFjdGl2ZVNlY3Rpb25zKCksIHRydWUpO1xuXG4gICAgLy8gRmlyc3QsIHNjYW4gZm9yIGVsZW1lbnRzIHRoYXQgd291bGQgY2F1c2UgdXMgdG8gaW5zZXJ0IHNvbWV0aGluZyBpbnRvIHRoZSBET00gdGhhdCB0YWtlcyB1cCBzcGFjZS5cbiAgICAvLyBXZSB3YW50IHRvIGdldCBhbnkgcGFnZSByZXNpemluZyBvdXQgb2YgdGhlIHdheSBhcyBlYXJseSBhcyBwb3NzaWJsZS5cbiAgICAvLyBUT0RPOiBDb25zaWRlciBkb2luZyB0aGlzIHdpdGggcmF3IEphdmFzY3JpcHQgYmVmb3JlIGpRdWVyeSBsb2FkcywgdG8gZnVydGhlciByZWR1Y2UgdGhlIGRlbGF5LiBXZSB3b3VsZG4ndFxuICAgIC8vIHNhdmUgYSAqdG9uKiBvZiB0aW1lIGZyb20gdGhpcywgdGhvdWdoLCBzbyBpdCdzIGRlZmluaXRlbHkgYSBsYXRlciBvcHRpbWl6YXRpb24uXG4gICAgc2NhbkZvclN1bW1hcmllcygkcGFnZSwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpOyAvLyBTdW1tYXJ5IHdpZGdldCBtYXkgYmUgb24gdGhlIHBhZ2UsIGJ1dCBvdXRzaWRlIHRoZSBhY3RpdmUgc2VjdGlvblxuICAgIHNjYW5Gb3JSZWFkTW9yZSgkcGFnZSwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgIHNjYW5Gb3JDb250ZW50UmVjKCRwYWdlLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgJGFjdGl2ZVNlY3Rpb25zLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkc2VjdGlvbiA9ICQodGhpcyk7XG4gICAgICAgIGNyZWF0ZUF1dG9DYWxsc1RvQWN0aW9uKCRzZWN0aW9uLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgfSk7XG4gICAgLy8gU2NhbiBmb3IgQ1RBcyBhY3Jvc3MgdGhlIGVudGlyZSBwYWdlICh0aGV5IGNhbiBiZSBvdXRzaWRlIGFuIGFjdGl2ZSBzZWN0aW9uKS4gQ1RBcyBoYXZlIHRvIGdvIGJlZm9yZSBzY2FucyBmb3JcbiAgICAvLyBjb250ZW50IGJlY2F1c2UgY29udGVudCBpbnZvbHZlZCBpbiBDVEFzIHdpbGwgYmUgdGFnZ2VkIG5vLWFudC5cbiAgICBzY2FuRm9yQ2FsbHNUb0FjdGlvbigkcGFnZSwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgIC8vIFRoZW4gc2NhbiBmb3IgZXZlcnl0aGluZyBlbHNlXG4gICAgJGFjdGl2ZVNlY3Rpb25zLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkc2VjdGlvbiA9ICQodGhpcyk7XG4gICAgICAgIHNjYW5BY3RpdmVFbGVtZW50KCRzZWN0aW9uLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgfSk7XG5cbiAgICBwYWdlRGF0YS5tZXRyaWNzLmhlaWdodCA9IGNvbXB1dGVQYWdlSGVpZ2h0KCRhY3RpdmVTZWN0aW9ucyk7XG4gICAgcGFnZURhdGEubWV0cmljcy5pc011bHRpUGFnZSA9IGlzTXVsdGlQYWdlO1xufVxuXG5mdW5jdGlvbiBjb21wdXRlUGFnZUhlaWdodCgkYWN0aXZlU2VjdGlvbnMpIHtcbiAgICB2YXIgY29udGVudFRvcDtcbiAgICB2YXIgY29udGVudEJvdHRvbTtcbiAgICAkYWN0aXZlU2VjdGlvbnMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRzZWN0aW9uID0gJCh0aGlzKTtcbiAgICAgICAgdmFyIG9mZnNldCA9ICRzZWN0aW9uLm9mZnNldCgpO1xuICAgICAgICBjb250ZW50VG9wID0gY29udGVudFRvcCA9PT0gdW5kZWZpbmVkID8gb2Zmc2V0LnRvcCA6IE1hdGgubWluKGNvbnRlbnRUb3AsIG9mZnNldC50b3ApO1xuICAgICAgICB2YXIgYm90dG9tID0gb2Zmc2V0LnRvcCArICRzZWN0aW9uLm91dGVySGVpZ2h0KCk7XG4gICAgICAgIGNvbnRlbnRCb3R0b20gPSBjb250ZW50Qm90dG9tID09PSB1bmRlZmluZWQgPyBib3R0b20gOiBNYXRoLm1heChjb250ZW50Qm90dG9tLCBib3R0b20pO1xuICAgIH0pO1xuICAgIHJldHVybiBjb250ZW50Qm90dG9tIC0gY29udGVudFRvcDtcbn1cblxuLy8gU2NhbnMgdGhlIGdpdmVuIGVsZW1lbnQsIHdoaWNoIGFwcGVhcnMgaW5zaWRlIGFuIGFjdGl2ZSBzZWN0aW9uLiBUaGUgZWxlbWVudCBjYW4gYmUgdGhlIGVudGlyZSBhY3RpdmUgc2VjdGlvbixcbi8vIHNvbWUgY29udGFpbmVyIHdpdGhpbiB0aGUgYWN0aXZlIHNlY3Rpb24sIG9yIGEgbGVhZiBub2RlIGluIHRoZSBhY3RpdmUgc2VjdGlvbi5cbmZ1bmN0aW9uIHNjYW5BY3RpdmVFbGVtZW50KCRlbGVtZW50LCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHNjYW5Gb3JDb250ZW50KCRlbGVtZW50LCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG59XG5cbmZ1bmN0aW9uIHNjYW5Gb3JTdW1tYXJpZXMoJGVsZW1lbnQsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyICRzdW1tYXJpZXMgPSBmaW5kKCRlbGVtZW50LCBncm91cFNldHRpbmdzLnN1bW1hcnlTZWxlY3RvcigpLCB0cnVlLCB0cnVlKTsgLy8gc3VtbWFyeSB3aWRnZXRzIGNhbiBiZSBpbnNpZGUgbm8tYW50IHNlY3Rpb25zXG4gICAgJHN1bW1hcmllcy5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgJHN1bW1hcnkgPSAkKHRoaXMpO1xuICAgICAgICB2YXIgY29udGFpbmVyRGF0YSA9IFBhZ2VEYXRhLmdldENvbnRhaW5lckRhdGEocGFnZURhdGEsICdwYWdlJyk7IC8vIE1hZ2ljIGhhc2ggZm9yIHBhZ2UgcmVhY3Rpb25zXG4gICAgICAgIGNvbnRhaW5lckRhdGEudHlwZSA9ICdwYWdlJzsgLy8gVE9ETzogcmV2aXNpdCB3aGV0aGVyIGl0IG1ha2VzIHNlbnNlIHRvIHNldCB0aGUgdHlwZSBoZXJlXG4gICAgICAgIHZhciBkZWZhdWx0UmVhY3Rpb25zID0gZ3JvdXBTZXR0aW5ncy5kZWZhdWx0UmVhY3Rpb25zKCRzdW1tYXJ5LmdldCgwKSk7IC8vIFRPRE86IGRvIHdlIHN1cHBvcnQgY3VzdG9taXppbmcgdGhlIGRlZmF1bHQgcmVhY3Rpb25zIGF0IHRoaXMgbGV2ZWw/XG4gICAgICAgIHZhciBzdW1tYXJ5V2lkZ2V0ID0gU3VtbWFyeVdpZGdldC5jcmVhdGUoY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGRlZmF1bHRSZWFjdGlvbnMsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICB2YXIgJHN1bW1hcnlFbGVtZW50ID0gc3VtbWFyeVdpZGdldC5lbGVtZW50O1xuICAgICAgICBpbnNlcnRDb250ZW50KCRzdW1tYXJ5LCAkc3VtbWFyeUVsZW1lbnQsIGdyb3VwU2V0dGluZ3Muc3VtbWFyeU1ldGhvZCgpKTtcbiAgICAgICAgY3JlYXRlZFdpZGdldHMucHVzaChzdW1tYXJ5V2lkZ2V0KTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gc2NhbkZvclJlYWRNb3JlKCRlbGVtZW50LCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIFJlYWRNb3JlRXZlbnRzLnNldHVwUmVhZE1vcmVFdmVudHMoJGVsZW1lbnQuZ2V0KDApLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG59XG5cbmZ1bmN0aW9uIHNjYW5Gb3JDb250ZW50UmVjKCRlbGVtZW50LCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIGlmIChncm91cFNldHRpbmdzLmlzU2hvd0NvbnRlbnRSZWMoKSAmJlxuICAgICAgICAgICAgKEJyb3dzZXJNZXRyaWNzLmlzTW9iaWxlKCkgfHwgQXBwTW9kZS5kZWJ1ZykpIHtcbiAgICAgICAgdmFyICRjb250ZW50UmVjTG9jYXRpb25zID0gZmluZCgkZWxlbWVudCwgZ3JvdXBTZXR0aW5ncy5jb250ZW50UmVjU2VsZWN0b3IoKSwgdHJ1ZSwgdHJ1ZSk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgJGNvbnRlbnRSZWNMb2NhdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBjb250ZW50UmVjTG9jYXRpb24gPSAkY29udGVudFJlY0xvY2F0aW9uc1tpXTtcbiAgICAgICAgICAgIHZhciBjb250ZW50UmVjID0gQ29udGVudFJlYy5jcmVhdGVDb250ZW50UmVjKHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgIHZhciBjb250ZW50UmVjRWxlbWVudCA9IGNvbnRlbnRSZWMuZWxlbWVudDtcbiAgICAgICAgICAgIHZhciBtZXRob2QgPSBncm91cFNldHRpbmdzLmNvbnRlbnRSZWNNZXRob2QoKTtcbiAgICAgICAgICAgIHN3aXRjaCAobWV0aG9kKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAnYXBwZW5kJzpcbiAgICAgICAgICAgICAgICAgICAgY29udGVudFJlY0xvY2F0aW9uLmFwcGVuZENoaWxkKGNvbnRlbnRSZWNFbGVtZW50KTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAncHJlcGVuZCc6XG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnRSZWNMb2NhdGlvbi5pbnNlcnRCZWZvcmUoY29udGVudFJlY0VsZW1lbnQsIGNvbnRlbnRSZWNMb2NhdGlvbi5maXJzdENoaWxkKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnYmVmb3JlJzpcbiAgICAgICAgICAgICAgICAgICAgY29udGVudFJlY0xvY2F0aW9uLnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKGNvbnRlbnRSZWNFbGVtZW50LCBjb250ZW50UmVjTG9jYXRpb24pO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdhZnRlcic6XG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgY29udGVudFJlY0xvY2F0aW9uLnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKGNvbnRlbnRSZWNFbGVtZW50LCBjb250ZW50UmVjTG9jYXRpb24ubmV4dFNpYmxpbmcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY3JlYXRlZFdpZGdldHMucHVzaChjb250ZW50UmVjKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gc2NhbkZvckNhbGxzVG9BY3Rpb24oJGVsZW1lbnQsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGN0YVRhcmdldHMgPSB7fTsgLy8gVGhlIGVsZW1lbnRzIHRoYXQgdGhlIGNhbGwgdG8gYWN0aW9ucyBhY3Qgb24gKGUuZy4gdGhlIGltYWdlIG9yIHZpZGVvKVxuICAgIGZpbmQoJGVsZW1lbnQsICdbYW50LWl0ZW1dJywgdHJ1ZSkuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRjdGFUYXJnZXQgPSAkKHRoaXMpO1xuICAgICAgICAkY3RhVGFyZ2V0LmFkZENsYXNzKCduby1hbnQnKTsgLy8gZG9uJ3Qgc2hvdyB0aGUgbm9ybWFsIHJlYWN0aW9uIGFmZm9yZGFuY2Ugb24gYSBjdGEgdGFyZ2V0XG4gICAgICAgIHZhciBhbnRJdGVtSWQgPSAkY3RhVGFyZ2V0LmF0dHIoJ2FudC1pdGVtJykudHJpbSgpO1xuICAgICAgICBjdGFUYXJnZXRzW2FudEl0ZW1JZF0gPSAkY3RhVGFyZ2V0O1xuICAgIH0pO1xuXG4gICAgdmFyIGN0YUxhYmVscyA9IHt9OyAvLyBPcHRpb25hbCBlbGVtZW50cyB0aGF0IHJlcG9ydCB0aGUgbnVtYmVyIG9mIHJlYWN0aW9ucyB0byB0aGUgY3RhIChlLmcuIFwiMSByZWFjdGlvblwiKVxuICAgIGZpbmQoJGVsZW1lbnQsICdbYW50LXJlYWN0aW9ucy1sYWJlbC1mb3JdJywgdHJ1ZSkuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRjdGFMYWJlbCA9ICQodGhpcyk7XG4gICAgICAgICRjdGFMYWJlbC5hZGRDbGFzcygnbm8tYW50Jyk7IC8vIGRvbid0IHNob3cgdGhlIG5vcm1hbCByZWFjdGlvbiBhZmZvcmRhbmNlIG9uIGEgY3RhIGxhYmVsXG4gICAgICAgIHZhciBhbnRJdGVtSWQgPSAkY3RhTGFiZWwuYXR0cignYW50LXJlYWN0aW9ucy1sYWJlbC1mb3InKS50cmltKCk7XG4gICAgICAgIGN0YUxhYmVsc1thbnRJdGVtSWRdID0gY3RhTGFiZWxzW2FudEl0ZW1JZF0gfHwgW107XG4gICAgICAgIGN0YUxhYmVsc1thbnRJdGVtSWRdLnB1c2goJGN0YUxhYmVsKTtcbiAgICB9KTtcblxuICAgIHZhciBjdGFDb3VudGVycyA9IHt9OyAvLyBPcHRpb25hbCBlbGVtZW50cyB0aGF0IHJlcG9ydCBvbmx5IHRoZSBjb3VudCBvZiByZWFjdGlvbiB0byBhIGN0YSAoZS5nLiBcIjFcIilcbiAgICBmaW5kKCRlbGVtZW50LCAnW2FudC1jb3VudGVyLWZvcl0nLCB0cnVlKS5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgJGN0YUNvdW50ZXIgPSAkKHRoaXMpO1xuICAgICAgICAkY3RhQ291bnRlci5hZGRDbGFzcygnbm8tYW50Jyk7IC8vIGRvbid0IHNob3cgdGhlIG5vcm1hbCByZWFjdGlvbiBhZmZvcmRhbmNlIG9uIGEgY3RhIGNvdW50ZXJcbiAgICAgICAgdmFyIGFudEl0ZW1JZCA9ICRjdGFDb3VudGVyLmF0dHIoJ2FudC1jb3VudGVyLWZvcicpLnRyaW0oKTtcbiAgICAgICAgY3RhQ291bnRlcnNbYW50SXRlbUlkXSA9IGN0YUNvdW50ZXJzW2FudEl0ZW1JZF0gfHwgW107XG4gICAgICAgIGN0YUNvdW50ZXJzW2FudEl0ZW1JZF0ucHVzaCgkY3RhQ291bnRlcik7XG4gICAgfSk7XG5cbiAgICB2YXIgY3RhRXhwYW5kZWRSZWFjdGlvbnMgPSB7fTsgLy8gT3B0aW9uYWwgZWxlbWVudHMgdGhhdCBzaG93IGV4cGFuZGVkIHJlYWN0aW9ucyBmb3IgdGhlIGN0YSAoZS5nLiBcIkludGVyZXN0aW5nICgxNSkgTm8gdGhhbmtzICgxMClcIilcbiAgICBmaW5kKCRlbGVtZW50LCAnW2FudC1leHBhbmRlZC1yZWFjdGlvbnMtZm9yXScsIHRydWUpLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkY3RhRXhwYW5kZWRSZWFjdGlvbkFyZWEgPSAkKHRoaXMpO1xuICAgICAgICAkY3RhRXhwYW5kZWRSZWFjdGlvbkFyZWEuYWRkQ2xhc3MoJ25vLWFudCcpOyAvLyBkb24ndCBzaG93IHRoZSBub3JtYWwgcmVhY3Rpb24gYWZmb3JkYW5jZSBvbiBhIGN0YSBjb3VudGVyXG4gICAgICAgIHZhciBhbnRJdGVtSWQgPSAkY3RhRXhwYW5kZWRSZWFjdGlvbkFyZWEuYXR0cignYW50LWV4cGFuZGVkLXJlYWN0aW9ucy1mb3InKS50cmltKCk7XG4gICAgICAgIGN0YUV4cGFuZGVkUmVhY3Rpb25zW2FudEl0ZW1JZF0gPSBjdGFFeHBhbmRlZFJlYWN0aW9uc1thbnRJdGVtSWRdIHx8IFtdO1xuICAgICAgICBjdGFFeHBhbmRlZFJlYWN0aW9uc1thbnRJdGVtSWRdLnB1c2goJGN0YUV4cGFuZGVkUmVhY3Rpb25BcmVhKTtcbiAgICB9KTtcblxuICAgIHZhciAkY3RhRWxlbWVudHMgPSBmaW5kKCRlbGVtZW50LCAnW2FudC1jdGEtZm9yXScpOyAvLyBUaGUgY2FsbCB0byBhY3Rpb24gZWxlbWVudHMgd2hpY2ggcHJvbXB0IHRoZSB1c2VyIHRvIHJlYWN0XG4gICAgJGN0YUVsZW1lbnRzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkY3RhRWxlbWVudCA9ICQodGhpcyk7XG4gICAgICAgIHZhciBhbnRJdGVtSWQgPSAkY3RhRWxlbWVudC5hdHRyKCdhbnQtY3RhLWZvcicpO1xuICAgICAgICB2YXIgJHRhcmdldEVsZW1lbnQgPSBjdGFUYXJnZXRzW2FudEl0ZW1JZF07XG4gICAgICAgIGlmICgkdGFyZ2V0RWxlbWVudCkge1xuICAgICAgICAgICAgdmFyIGhhc2ggPSBjb21wdXRlSGFzaCgkdGFyZ2V0RWxlbWVudCwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgdmFyIGNvbnRlbnREYXRhID0gY29tcHV0ZUNvbnRlbnREYXRhKCR0YXJnZXRFbGVtZW50LCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgIGlmIChoYXNoICYmIGNvbnRlbnREYXRhKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNvbnRhaW5lckRhdGEgPSBQYWdlRGF0YS5nZXRDb250YWluZXJEYXRhKHBhZ2VEYXRhLCBoYXNoKTtcbiAgICAgICAgICAgICAgICBjb250YWluZXJEYXRhLnR5cGUgPSBjb21wdXRlRWxlbWVudFR5cGUoJHRhcmdldEVsZW1lbnQpOyAvLyBUT0RPOiByZXZpc2l0IHdoZXRoZXIgaXQgbWFrZXMgc2Vuc2UgdG8gc2V0IHRoZSB0eXBlIGhlcmVcbiAgICAgICAgICAgICAgICB2YXIgY2FsbFRvQWN0aW9uID0gQ2FsbFRvQWN0aW9uSW5kaWNhdG9yLmNyZWF0ZSh7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lckRhdGE6IGNvbnRhaW5lckRhdGEsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lckVsZW1lbnQ6ICR0YXJnZXRFbGVtZW50LFxuICAgICAgICAgICAgICAgICAgICBjb250ZW50RGF0YTogY29udGVudERhdGEsXG4gICAgICAgICAgICAgICAgICAgIGN0YUVsZW1lbnQ6ICRjdGFFbGVtZW50LFxuICAgICAgICAgICAgICAgICAgICBjdGFMYWJlbHM6IGN0YUxhYmVsc1thbnRJdGVtSWRdLFxuICAgICAgICAgICAgICAgICAgICBjdGFDb3VudGVyczogY3RhQ291bnRlcnNbYW50SXRlbUlkXSxcbiAgICAgICAgICAgICAgICAgICAgY3RhRXhwYW5kZWRSZWFjdGlvbnM6IGN0YUV4cGFuZGVkUmVhY3Rpb25zW2FudEl0ZW1JZF0sXG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHRSZWFjdGlvbnM6IGdyb3VwU2V0dGluZ3MuZGVmYXVsdFJlYWN0aW9ucygkdGFyZ2V0RWxlbWVudC5nZXQoMCkpLFxuICAgICAgICAgICAgICAgICAgICBwYWdlRGF0YTogcGFnZURhdGEsXG4gICAgICAgICAgICAgICAgICAgIGdyb3VwU2V0dGluZ3M6IGdyb3VwU2V0dGluZ3NcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjcmVhdGVkV2lkZ2V0cy5wdXNoKGNhbGxUb0FjdGlvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KVxufVxuXG5mdW5jdGlvbiBjcmVhdGVBdXRvQ2FsbHNUb0FjdGlvbigkc2VjdGlvbiwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgJGN0YVRhcmdldHMgPSBmaW5kKCRzZWN0aW9uLCBncm91cFNldHRpbmdzLmdlbmVyYXRlZEN0YVNlbGVjdG9yKCkpO1xuICAgICRjdGFUYXJnZXRzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkY3RhVGFyZ2V0ID0gJCh0aGlzKTtcbiAgICAgICAgdmFyIGFudEl0ZW1JZCA9IGdlbmVyYXRlQW50SXRlbUF0dHJpYnV0ZSgpO1xuICAgICAgICAkY3RhVGFyZ2V0LmF0dHIoJ2FudC1pdGVtJywgYW50SXRlbUlkKTtcbiAgICAgICAgdmFyIGF1dG9DdGEgPSBBdXRvQ2FsbFRvQWN0aW9uLmNyZWF0ZShhbnRJdGVtSWQsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgJGN0YVRhcmdldC5hZnRlcihhdXRvQ3RhLmVsZW1lbnQpOyAvLyBUT0RPOiBtYWtlIHRoZSBpbnNlcnQgYmVoYXZpb3IgY29uZmlndXJhYmxlIGxpa2UgdGhlIHN1bW1hcnlcbiAgICAgICAgY3JlYXRlZFdpZGdldHMucHVzaChhdXRvQ3RhKTtcbiAgICB9KTtcbn1cblxudmFyIGdlbmVyYXRlQW50SXRlbUF0dHJpYnV0ZSA9IGZ1bmN0aW9uKGluZGV4KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gJ2FudGVubmFfYXV0b19jdGFfJyArIGluZGV4Kys7XG4gICAgfVxufSgwKTtcblxuZnVuY3Rpb24gc2NhbkZvckNvbnRlbnQoJGVsZW1lbnQsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyICRjb250ZW50RWxlbWVudHMgPSBmaW5kKCRlbGVtZW50LCBncm91cFNldHRpbmdzLmNvbnRlbnRTZWxlY3RvcigpLCB0cnVlKTtcbiAgICAkY29udGVudEVsZW1lbnRzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkY29udGVudEVsZW1lbnQgPSAkKHRoaXMpO1xuICAgICAgICB2YXIgdHlwZSA9IGNvbXB1dGVFbGVtZW50VHlwZSgkY29udGVudEVsZW1lbnQpO1xuICAgICAgICBzd2l0Y2godHlwZSkge1xuICAgICAgICAgICAgY2FzZSBUWVBFX0lNQUdFOlxuICAgICAgICAgICAgY2FzZSBUWVBFX01FRElBOlxuICAgICAgICAgICAgICAgIHNjYW5NZWRpYSgkY29udGVudEVsZW1lbnQsIHR5cGUsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgVFlQRV9URVhUOlxuICAgICAgICAgICAgICAgIHNjYW5UZXh0KCRjb250ZW50RWxlbWVudCwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIHNjYW5UZXh0KCR0ZXh0RWxlbWVudCwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICBpZiAoc2hvdWxkSGFzaFRleHQoJHRleHRFbGVtZW50LCBncm91cFNldHRpbmdzKSkge1xuICAgICAgICB2YXIgaGFzaCA9IGNvbXB1dGVIYXNoKCR0ZXh0RWxlbWVudCwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICBpZiAoaGFzaCkge1xuICAgICAgICAgICAgdmFyIGNvbnRhaW5lckRhdGEgPSBQYWdlRGF0YS5nZXRDb250YWluZXJEYXRhKHBhZ2VEYXRhLCBoYXNoKTtcbiAgICAgICAgICAgIGNvbnRhaW5lckRhdGEudHlwZSA9ICd0ZXh0JzsgLy8gVE9ETzogcmV2aXNpdCB3aGV0aGVyIGl0IG1ha2VzIHNlbnNlIHRvIHNldCB0aGUgdHlwZSBoZXJlXG4gICAgICAgICAgICB2YXIgZGVmYXVsdFJlYWN0aW9ucyA9IGdyb3VwU2V0dGluZ3MuZGVmYXVsdFJlYWN0aW9ucygkdGV4dEVsZW1lbnQuZ2V0KDApKTtcbiAgICAgICAgICAgIHZhciB0ZXh0SW5kaWNhdG9yID0gVGV4dEluZGljYXRvcldpZGdldC5jcmVhdGUoe1xuICAgICAgICAgICAgICAgICAgICBjb250YWluZXJEYXRhOiBjb250YWluZXJEYXRhLFxuICAgICAgICAgICAgICAgICAgICBjb250YWluZXJFbGVtZW50OiAkdGV4dEVsZW1lbnQsXG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHRSZWFjdGlvbnM6IGRlZmF1bHRSZWFjdGlvbnMsXG4gICAgICAgICAgICAgICAgICAgIHBhZ2VEYXRhOiBwYWdlRGF0YSxcbiAgICAgICAgICAgICAgICAgICAgZ3JvdXBTZXR0aW5nczogZ3JvdXBTZXR0aW5nc1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICB2YXIgJGluZGljYXRvckVsZW1lbnQgPSB0ZXh0SW5kaWNhdG9yLmVsZW1lbnQ7XG4gICAgICAgICAgICB2YXIgbGFzdE5vZGUgPSBsYXN0Q29udGVudE5vZGUoJHRleHRFbGVtZW50LmdldCgwKSk7XG4gICAgICAgICAgICBpZiAobGFzdE5vZGUubm9kZVR5cGUgIT09IDMpIHtcbiAgICAgICAgICAgICAgICAkKGxhc3ROb2RlKS5iZWZvcmUoJGluZGljYXRvckVsZW1lbnQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAkdGV4dEVsZW1lbnQuYXBwZW5kKCRpbmRpY2F0b3JFbGVtZW50KTsgLy8gVE9ETyBpcyB0aGlzIGNvbmZpZ3VyYWJsZSBhbGEgaW5zZXJ0Q29udGVudCguLi4pP1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY3JlYXRlZFdpZGdldHMucHVzaCh0ZXh0SW5kaWNhdG9yKTtcblxuICAgICAgICAgICAgdmFyIHRleHRSZWFjdGlvbnMgPSBUZXh0UmVhY3Rpb25zLmNyZWF0ZVJlYWN0YWJsZVRleHQoe1xuICAgICAgICAgICAgICAgIGNvbnRhaW5lckRhdGE6IGNvbnRhaW5lckRhdGEsXG4gICAgICAgICAgICAgICAgY29udGFpbmVyRWxlbWVudDogJHRleHRFbGVtZW50LFxuICAgICAgICAgICAgICAgIGRlZmF1bHRSZWFjdGlvbnM6IGRlZmF1bHRSZWFjdGlvbnMsXG4gICAgICAgICAgICAgICAgcGFnZURhdGE6IHBhZ2VEYXRhLFxuICAgICAgICAgICAgICAgIGdyb3VwU2V0dGluZ3M6IGdyb3VwU2V0dGluZ3MsXG4gICAgICAgICAgICAgICAgZXhjbHVkZU5vZGU6ICRpbmRpY2F0b3JFbGVtZW50LmdldCgwKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjcmVhdGVkV2lkZ2V0cy5wdXNoKHRleHRSZWFjdGlvbnMpO1xuXG4gICAgICAgICAgICBNdXRhdGlvbk9ic2VydmVyLmFkZE9uZVRpbWVFbGVtZW50UmVtb3ZhbExpc3RlbmVyKCR0ZXh0RWxlbWVudC5nZXQoMCksIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIEhhc2hlZEVsZW1lbnRzLnJlbW92ZUVsZW1lbnQoaGFzaCwgcGFnZURhdGEucGFnZUhhc2gsICR0ZXh0RWxlbWVudCk7XG4gICAgICAgICAgICAgICAgdGV4dEluZGljYXRvci50ZWFyZG93bigpO1xuICAgICAgICAgICAgICAgIHRleHRSZWFjdGlvbnMudGVhcmRvd24oKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gV2UgdXNlIHRoaXMgdG8gaGFuZGxlIHRoZSBjYXNlIG9mIHRleHQgY29udGVudCB0aGF0IGVuZHMgd2l0aCBzb21lIG5vbi10ZXh0IG5vZGUgYXMgaW5cbiAgICAvLyA8cD5NeSB0ZXh0LiA8aW1nIHNyYz1cIndoYXRldmVyXCI+PC9wPiBvclxuICAgIC8vIDxwPk15IGxvbmcgcGFyYWdyYXBoIHRleHQgd2l0aCBhIGNvbW1vbiBDTVMgcHJvYmxlbS48YnI+PC9wPlxuICAgIC8vIFRoaXMgaXMgYSBzaW1wbGlzdGljIGFsZ29yaXRobSwgbm90IGEgZ2VuZXJhbCBzb2x1dGlvbjpcbiAgICAvLyBXZSB3YWxrIHRoZSBET00gaW5zaWRlIHRoZSBnaXZlbiBub2RlIGFuZCBrZWVwIHRyYWNrIG9mIHRoZSBsYXN0IFwiY29udGVudFwiIG5vZGUgdGhhdCB3ZSBlbmNvdW50ZXIsIHdoaWNoIGNvdWxkIGJlIGVpdGhlclxuICAgIC8vIHRleHQgb3Igc29tZSBtZWRpYS4gIElmIHRoZSBsYXN0IGNvbnRlbnQgbm9kZSBpcyBub3QgdGV4dCwgd2Ugd2FudCB0byBpbnNlcnQgdGhlIHRleHQgaW5kaWNhdG9yIGJlZm9yZSB0aGUgbWVkaWEuXG4gICAgZnVuY3Rpb24gbGFzdENvbnRlbnROb2RlKG5vZGUpIHtcbiAgICAgICAgdmFyIGxhc3ROb2RlO1xuICAgICAgICB2YXIgY2hpbGROb2RlcyA9IG5vZGUuY2hpbGROb2RlcztcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGlsZE5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgY2hpbGQgPSBjaGlsZE5vZGVzW2ldO1xuICAgICAgICAgICAgaWYgKGNoaWxkLm5vZGVUeXBlID09PSAzKSB7XG4gICAgICAgICAgICAgICAgbGFzdE5vZGUgPSBjaGlsZDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY2hpbGQubm9kZVR5cGUgPT09IDEpIHtcbiAgICAgICAgICAgICAgICB2YXIgdGFnTmFtZSA9IGNoaWxkLnRhZ05hbWUudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKHRhZ05hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnaW1nJzpcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnaWZyYW1lJzpcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAndmlkZW8nOlxuICAgICAgICAgICAgICAgICAgICBjYXNlICdpZnJhbWUnOlxuICAgICAgICAgICAgICAgICAgICBjYXNlICdicic6XG4gICAgICAgICAgICAgICAgICAgICAgICBsYXN0Tm9kZSA9IGNoaWxkO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxhc3ROb2RlID0gbGFzdENvbnRlbnROb2RlKGNoaWxkKSB8fCBsYXN0Tm9kZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbGFzdE5vZGU7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBzaG91bGRIYXNoVGV4dCgkdGV4dEVsZW1lbnQsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICBpZiAoKGlzQ3RhKCR0ZXh0RWxlbWVudCwgZ3JvdXBTZXR0aW5ncykpKSB7XG4gICAgICAgIC8vIERvbid0IGhhc2ggdGhlIHRleHQgaWYgaXQgaXMgdGhlIHRhcmdldCBvZiBhIENUQS5cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAvLyBEb24ndCBjcmVhdGUgYW4gaW5kaWNhdG9yIGZvciB0ZXh0IGVsZW1lbnRzIHRoYXQgY29udGFpbiBvdGhlciB0ZXh0IG5vZGVzLlxuICAgIHZhciAkbmVzdGVkRWxlbWVudHMgPSBmaW5kKCR0ZXh0RWxlbWVudCwgZ3JvdXBTZXR0aW5ncy5jb250ZW50U2VsZWN0b3IoKSk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCAkbmVzdGVkRWxlbWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKChjb21wdXRlRWxlbWVudFR5cGUoJCgkbmVzdGVkRWxlbWVudHNbaV0pKSA9PT0gVFlQRV9URVhUKSkge1xuICAgICAgICAgICAgLy8gRG9uJ3QgaGFzaCBhIHRleHQgZWxlbWVudCBpZiBpdCBjb250YWlucyBhbnkgb3RoZXIgbWF0Y2hlZCB0ZXh0IGVsZW1lbnRzXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIGlzQ3RhKCRlbGVtZW50LCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGNvbXBvc2l0ZVNlbGVjdG9yID0gZ3JvdXBTZXR0aW5ncy5nZW5lcmF0ZWRDdGFTZWxlY3RvcigpICsgJyxbYW50LWl0ZW1dJztcbiAgICByZXR1cm4gJGVsZW1lbnQuaXMoY29tcG9zaXRlU2VsZWN0b3IpO1xufVxuXG4vLyBUaGUgXCJpbWFnZVwiIGFuZCBcIm1lZGlhXCIgcGF0aHMgY29udmVyZ2UgaGVyZSwgYmVjYXVzZSB3ZSB1c2UgdGhlIHNhbWUgaW5kaWNhdG9yIG1vZHVsZSBmb3IgdGhlbSBib3RoLlxuZnVuY3Rpb24gc2Nhbk1lZGlhKCRtZWRpYUVsZW1lbnQsIHR5cGUsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGluZGljYXRvcjtcbiAgICB2YXIgY29udGVudERhdGEgPSBjb21wdXRlQ29udGVudERhdGEoJG1lZGlhRWxlbWVudCwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgaWYgKGNvbnRlbnREYXRhICYmIGNvbnRlbnREYXRhLmRpbWVuc2lvbnMpIHtcbiAgICAgICAgaWYgKGNvbnRlbnREYXRhLmRpbWVuc2lvbnMuaGVpZ2h0ID49IDEwMCAmJiBjb250ZW50RGF0YS5kaW1lbnNpb25zLndpZHRoID49IDEwMCkgeyAvLyBEb24ndCBjcmVhdGUgaW5kaWNhdG9yIG9uIGVsZW1lbnRzIHRoYXQgYXJlIHRvbyBzbWFsbFxuICAgICAgICAgICAgdmFyIGhhc2ggPSBjb21wdXRlSGFzaCgkbWVkaWFFbGVtZW50LCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICBpZiAoaGFzaCkge1xuICAgICAgICAgICAgICAgIHZhciBjb250YWluZXJEYXRhID0gUGFnZURhdGEuZ2V0Q29udGFpbmVyRGF0YShwYWdlRGF0YSwgaGFzaCk7XG4gICAgICAgICAgICAgICAgY29udGFpbmVyRGF0YS50eXBlID0gdHlwZSA9PT0gVFlQRV9JTUFHRSA/ICdpbWFnZScgOiAnbWVkaWEnO1xuICAgICAgICAgICAgICAgIHZhciBkZWZhdWx0UmVhY3Rpb25zID0gZ3JvdXBTZXR0aW5ncy5kZWZhdWx0UmVhY3Rpb25zKCRtZWRpYUVsZW1lbnQuZ2V0KDApKTtcbiAgICAgICAgICAgICAgICBpbmRpY2F0b3IgPSBNZWRpYUluZGljYXRvcldpZGdldC5jcmVhdGUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudDogV2lkZ2V0QnVja2V0LmdldCgpLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyRGF0YTogY29udGFpbmVyRGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnREYXRhOiBjb250ZW50RGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lckVsZW1lbnQ6ICRtZWRpYUVsZW1lbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0UmVhY3Rpb25zOiBkZWZhdWx0UmVhY3Rpb25zLFxuICAgICAgICAgICAgICAgICAgICAgICAgcGFnZURhdGE6IHBhZ2VEYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgZ3JvdXBTZXR0aW5nczogZ3JvdXBTZXR0aW5nc1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBjcmVhdGVkV2lkZ2V0cy5wdXNoKGluZGljYXRvcik7XG5cbiAgICAgICAgICAgICAgICBNdXRhdGlvbk9ic2VydmVyLmFkZE9uZVRpbWVFbGVtZW50UmVtb3ZhbExpc3RlbmVyKCRtZWRpYUVsZW1lbnQuZ2V0KDApLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgSGFzaGVkRWxlbWVudHMucmVtb3ZlRWxlbWVudChoYXNoLCBwYWdlRGF0YS5wYWdlSGFzaCwgJG1lZGlhRWxlbWVudCk7XG4gICAgICAgICAgICAgICAgICAgIGluZGljYXRvci50ZWFyZG93bigpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIC8vIExpc3RlbiBmb3IgY2hhbmdlcyB0byB0aGUgaW1hZ2UgYXR0cmlidXRlcyB3aGljaCBjb3VsZCBpbmRpY2F0ZSBjb250ZW50IGNoYW5nZXMuXG4gICAgTXV0YXRpb25PYnNlcnZlci5hZGRPbmVUaW1lQXR0cmlidXRlTGlzdGVuZXIoJG1lZGlhRWxlbWVudC5nZXQoMCksIFsnc3JjJywnYW50LWl0ZW0tY29udGVudCcsJ2RhdGEnXSwgZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmIChpbmRpY2F0b3IpIHtcbiAgICAgICAgICAgIC8vIFRPRE86IHVwZGF0ZSBIYXNoZWRFbGVtZW50cyB0byByZW1vdmUgdGhlIHByZXZpb3VzIGhhc2gtPmVsZW1lbnQgbWFwcGluZy4gQ29uc2lkZXIgdGhlcmUgY291bGQgYmUgbXVsdGlwbGVcbiAgICAgICAgICAgIC8vICAgICAgIGluc3RhbmNlcyBvZiB0aGUgc2FtZSBlbGVtZW50IG9uIGEgcGFnZS4uLiBzbyB3ZSBtaWdodCBuZWVkIHRvIHVzZSBhIGNvdW50ZXIuXG4gICAgICAgICAgICBpbmRpY2F0b3IudGVhcmRvd24oKTtcbiAgICAgICAgfVxuICAgICAgICBzY2FuTWVkaWEoJG1lZGlhRWxlbWVudCwgdHlwZSwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBmaW5kKCRlbGVtZW50LCBzZWxlY3RvciwgYWRkQmFjaywgaWdub3JlTm9BbnQpIHtcbiAgICB2YXIgcmVzdWx0ID0gJGVsZW1lbnQuZmluZChzZWxlY3Rvcik7XG4gICAgaWYgKGFkZEJhY2sgJiYgc2VsZWN0b3IpIHsgLy8gd2l0aCBhbiB1bmRlZmluZWQgc2VsZWN0b3IsIGFkZEJhY2sgd2lsbCBtYXRjaCBhbmQgYWx3YXlzIHJldHVybiB0aGUgaW5wdXQgZWxlbWVudCAodW5saWtlIGZpbmQoKSB3aGljaCByZXR1cm5zIGFuIGVtcHR5IG1hdGNoKVxuICAgICAgICByZXN1bHQgPSByZXN1bHQuYWRkQmFjayhzZWxlY3Rvcik7XG4gICAgfVxuICAgIGlmIChpZ25vcmVOb0FudCkgeyAvLyBTb21lIHBpZWNlcyBvZiBjb250ZW50IChlLmcuIHRoZSBzdW1tYXJ5IHdpZGdldCkgY2FuIGFjdHVhbGx5IGdvIGluc2lkZSBzZWN0aW9ucyB0YWdnZWQgbm8tYW50XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQuZmlsdGVyKGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gJCh0aGlzKS5jbG9zZXN0KCcubm8tYW50JykubGVuZ3RoID09IDA7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGluc2VydENvbnRlbnQoJHBhcmVudCwgY29udGVudCwgbWV0aG9kKSB7XG4gICAgc3dpdGNoIChtZXRob2QpIHtcbiAgICAgICAgY2FzZSAnYXBwZW5kJzpcbiAgICAgICAgICAgICRwYXJlbnQuYXBwZW5kKGNvbnRlbnQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3ByZXBlbmQnOlxuICAgICAgICAgICAgJHBhcmVudC5wcmVwZW5kKGNvbnRlbnQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2JlZm9yZSc6XG4gICAgICAgICAgICAkcGFyZW50LmJlZm9yZShjb250ZW50KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdhZnRlcic6XG4gICAgICAgICAgICAkcGFyZW50LmFmdGVyKGNvbnRlbnQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBjb21wdXRlSGFzaCgkZWxlbWVudCwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgaGFzaDtcbiAgICBzd2l0Y2ggKGNvbXB1dGVFbGVtZW50VHlwZSgkZWxlbWVudCkpIHtcbiAgICAgICAgY2FzZSBUWVBFX0lNQUdFOlxuICAgICAgICAgICAgdmFyIGltYWdlVXJsID0gVVJMcy5jb21wdXRlSW1hZ2VVcmwoJGVsZW1lbnQsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgaGFzaCA9IEhhc2guaGFzaEltYWdlKGltYWdlVXJsLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFRZUEVfTUVESUE6XG4gICAgICAgICAgICB2YXIgbWVkaWFVcmwgPSBVUkxzLmNvbXB1dGVNZWRpYVVybCgkZWxlbWVudCwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICBoYXNoID0gSGFzaC5oYXNoTWVkaWEobWVkaWFVcmwsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgVFlQRV9URVhUOlxuICAgICAgICAgICAgaGFzaCA9IEhhc2guaGFzaFRleHQoJGVsZW1lbnQpO1xuICAgICAgICAgICAgdmFyIGluY3JlbWVudCA9IDE7XG4gICAgICAgICAgICB3aGlsZSAoaGFzaCAmJiBIYXNoZWRFbGVtZW50cy5nZXRFbGVtZW50KGhhc2gsIHBhZ2VEYXRhLnBhZ2VIYXNoKSkge1xuICAgICAgICAgICAgICAgIGhhc2ggPSBIYXNoLmhhc2hUZXh0KCRlbGVtZW50LCBpbmNyZW1lbnQrKyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICB9XG4gICAgaWYgKGhhc2gpIHtcbiAgICAgICAgSGFzaGVkRWxlbWVudHMuc2V0RWxlbWVudChoYXNoLCBwYWdlRGF0YS5wYWdlSGFzaCwgJGVsZW1lbnQpOyAvLyBSZWNvcmQgdGhlIHJlbGF0aW9uc2hpcCBiZXR3ZWVuIHRoZSBoYXNoIGFuZCBkb20gZWxlbWVudC5cbiAgICAgICAgaWYgKEFwcE1vZGUuZGVidWcpIHtcbiAgICAgICAgICAgICRlbGVtZW50LmF0dHIoQVRUUl9IQVNILCBoYXNoKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gaGFzaDtcbn1cblxuZnVuY3Rpb24gY29tcHV0ZUNvbnRlbnREYXRhKCRlbGVtZW50LCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGNvbnRlbnREYXRhO1xuICAgIHN3aXRjaCAoY29tcHV0ZUVsZW1lbnRUeXBlKCRlbGVtZW50KSkge1xuICAgICAgICBjYXNlIFRZUEVfSU1BR0U6XG4gICAgICAgICAgICB2YXIgaW1hZ2VVcmwgPSBVUkxzLmNvbXB1dGVJbWFnZVVybCgkZWxlbWVudCwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICB2YXIgaW1hZ2VEaW1lbnNpb25zID0ge1xuICAgICAgICAgICAgICAgIGhlaWdodDogcGFyc2VJbnQoJGVsZW1lbnQuYXR0cignaGVpZ2h0JykpIHx8ICRlbGVtZW50LmhlaWdodCgpIHx8IDAsXG4gICAgICAgICAgICAgICAgd2lkdGg6IHBhcnNlSW50KCRlbGVtZW50LmF0dHIoJ3dpZHRoJykpIHx8ICRlbGVtZW50LndpZHRoKCkgfHwgMFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGNvbnRlbnREYXRhID0ge1xuICAgICAgICAgICAgICAgIHR5cGU6ICdpbWcnLFxuICAgICAgICAgICAgICAgIGJvZHk6IGltYWdlVXJsLFxuICAgICAgICAgICAgICAgIGRpbWVuc2lvbnM6IGltYWdlRGltZW5zaW9uc1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFRZUEVfTUVESUE6XG4gICAgICAgICAgICB2YXIgbWVkaWFVcmwgPSBVUkxzLmNvbXB1dGVNZWRpYVVybCgkZWxlbWVudCwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICB2YXIgbWVkaWFEaW1lbnNpb25zID0ge1xuICAgICAgICAgICAgICAgIGhlaWdodDogcGFyc2VJbnQoJGVsZW1lbnQuYXR0cignaGVpZ2h0JykpIHx8ICRlbGVtZW50LmhlaWdodCgpIHx8IDAsXG4gICAgICAgICAgICAgICAgd2lkdGg6IHBhcnNlSW50KCRlbGVtZW50LmF0dHIoJ3dpZHRoJykpIHx8ICRlbGVtZW50LndpZHRoKCkgfHwgMFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGNvbnRlbnREYXRhID0ge1xuICAgICAgICAgICAgICAgIHR5cGU6ICdtZWRpYScsXG4gICAgICAgICAgICAgICAgYm9keTogbWVkaWFVcmwsXG4gICAgICAgICAgICAgICAgZGltZW5zaW9uczogbWVkaWFEaW1lbnNpb25zXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgVFlQRV9URVhUOlxuICAgICAgICAgICAgY29udGVudERhdGEgPSB7IHR5cGU6ICd0ZXh0JyB9O1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIHJldHVybiBjb250ZW50RGF0YTtcbn1cblxuZnVuY3Rpb24gY29tcHV0ZUVsZW1lbnRUeXBlKCRlbGVtZW50KSB7XG4gICAgdmFyIGl0ZW1UeXBlID0gJGVsZW1lbnQuYXR0cignYW50LWl0ZW0tdHlwZScpO1xuICAgIGlmIChpdGVtVHlwZSAmJiBpdGVtVHlwZS50cmltKCkubGVuZ3RoID4gMCkge1xuICAgICAgICByZXR1cm4gaXRlbVR5cGUudHJpbSgpO1xuICAgIH1cbiAgICB2YXIgdGFnTmFtZSA9ICRlbGVtZW50LnByb3AoJ3RhZ05hbWUnKS50b0xvd2VyQ2FzZSgpO1xuICAgIHN3aXRjaCAodGFnTmFtZSkge1xuICAgICAgICBjYXNlICdpbWcnOlxuICAgICAgICAgICAgcmV0dXJuIFRZUEVfSU1BR0U7XG4gICAgICAgIGNhc2UgJ3ZpZGVvJzpcbiAgICAgICAgY2FzZSAnaWZyYW1lJzpcbiAgICAgICAgY2FzZSAnZW1iZWQnOlxuICAgICAgICAgICAgcmV0dXJuIFRZUEVfTUVESUE7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICByZXR1cm4gVFlQRV9URVhUO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gc2V0dXBNdXRhdGlvbk9ic2VydmVyKGdyb3VwU2V0dGluZ3MsIHJlaW5pdGlhbGl6ZUNhbGxiYWNrKSB7XG4gICAgdmFyIGNvdWxkQmVTaW5nbGVQYWdlQXBwID0gdHJ1ZTtcbiAgICB2YXIgb3JpZ2luYWxQYXRobmFtZSA9IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZTtcbiAgICB2YXIgb3JpZ2luYWxTZWFyY2ggPSB3aW5kb3cubG9jYXRpb24uc2VhcmNoO1xuICAgIE11dGF0aW9uT2JzZXJ2ZXIuYWRkQWRkaXRpb25MaXN0ZW5lcihlbGVtZW50c0FkZGVkKTtcblxuICAgIGZ1bmN0aW9uIGVsZW1lbnRzQWRkZWQoJGVsZW1lbnRzKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgJGVsZW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgJGVsZW1lbnQgPSAkZWxlbWVudHNbaV07XG4gICAgICAgICAgICAkZWxlbWVudC5maW5kKGdyb3VwU2V0dGluZ3MuZXhjbHVzaW9uU2VsZWN0b3IoKSkuYWRkQmFjayhncm91cFNldHRpbmdzLmV4Y2x1c2lvblNlbGVjdG9yKCkpLmFkZENsYXNzKCduby1hbnQnKTsgLy8gQWRkIHRoZSBuby1hbnQgY2xhc3MgdG8gZXZlcnl0aGluZyB0aGF0IGlzIGZsYWdnZWQgZm9yIGV4Y2x1c2lvblxuICAgICAgICAgICAgaWYgKCRlbGVtZW50LmNsb3Nlc3QoJy5uby1hbnQnKS5sZW5ndGggPT09IDApIHsgLy8gSWdub3JlIGFueXRoaW5nIHRhZ2dlZCBuby1hbnRcbiAgICAgICAgICAgICAgICAvLyBGaXJzdCwgc2VlIGlmIGFueSBlbnRpcmUgcGFnZXMgd2VyZSBhZGRlZFxuICAgICAgICAgICAgICAgIHZhciAkcGFnZXMgPSBmaW5kKCRlbGVtZW50LCBncm91cFNldHRpbmdzLnBhZ2VTZWxlY3RvcigpLCB0cnVlKTtcbiAgICAgICAgICAgICAgICBpZiAoJHBhZ2VzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgUGFnZURhdGFMb2FkZXIucGFnZXNBZGRlZCgkcGFnZXMsIGdyb3VwU2V0dGluZ3MpOyAvLyBUT0RPOiBjb25zaWRlciBpZiB0aGVyZSdzIGEgYmV0dGVyIHdheSB0byBhcmNoaXRlY3QgdGhpc1xuICAgICAgICAgICAgICAgICAgICAkcGFnZXMuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzY2FuUGFnZSgkKHRoaXMpLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIC8vIElmIGFuIGVudGlyZSBwYWdlIGlzIGFkZGVkLCBhc3N1bWUgdGhhdCB0aGlzIGlzIGFuIFwiaW5maW5pdGUgc2Nyb2xsXCIgc2l0ZSBhbmQgc3RvcCBjaGVja2luZyBmb3JcbiAgICAgICAgICAgICAgICAgICAgLy8gc2luZ2xlIHBhZ2UgYXBwcy4gVGhpcyBpcyBuZWNlc3NhcnkgYmVjYXVzZSBzb21lIGluZmluaXRlIHNjcm9sbCBzaXRlcyB1cGRhdGUgdGhlIGxvY2F0aW9uLCB3aGljaFxuICAgICAgICAgICAgICAgICAgICAvLyBjYW4gdHJpZ2dlciBhbiB1bm5lY2Vzc2FyeSByZWluaXRpYWxpemF0aW9uLlxuICAgICAgICAgICAgICAgICAgICBjb3VsZEJlU2luZ2xlUGFnZUFwcCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIElmIG5vdCBhbiBlbnRpcmUgcGFnZS9wYWdlcywgc2VlIGlmIGNvbnRlbnQgd2FzIGFkZGVkIHRvIGFuIGV4aXN0aW5nIHBhZ2VcbiAgICAgICAgICAgICAgICAgICAgdmFyICRwYWdlID0gJGVsZW1lbnQuY2xvc2VzdChncm91cFNldHRpbmdzLnBhZ2VTZWxlY3RvcigpKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCRwYWdlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHBhZ2UgPSAkKCdib2R5Jyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvdWxkQmVTaW5nbGVQYWdlQXBwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgJHBhZ2VJbmRpY2F0b3IgPSBmaW5kKCRwYWdlLCBncm91cFNldHRpbmdzLnBhZ2VVcmxTZWxlY3RvcigpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgkcGFnZUluZGljYXRvci5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBXaGVuZXZlciBuZXcgY29udGVudCBpcyBhZGRlZCwgY2hlY2sgaWYgd2UgbmVlZCB0byByZWluaXRpYWxpemUgYWxsIG91ciBkYXRhIGJhc2VkIG9uIHRoZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHdpbmRvdy5sb2NhdGlvbi4gVGhpcyBhY2NvbW9kYXRlcyBzaW5nbGUgcGFnZSBhcHBzIHRoYXQgZG9uJ3QgdXNlIGJyb3dzZXIgbmF2aWdhdGlvbi5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAoQXMgYW4gb3B0aW1pemF0aW9uLCB3ZSBkb24ndCBkbyB0aGlzIGNoZWNrIGlmIHRoZSBhZGRlZCBlbGVtZW50IGNvbnRhaW5zIGFuIGVudGlyZSBwYWdlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gd2l0aCBhIFVSTCBzcGVjaWZpZWQgaW5zaWRlIHRoZSBjb250ZW50LilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2hvdWxkUmVpbml0aWFsaXplRm9yTG9jYXRpb25DaGFuZ2UoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWluaXRpYWxpemVDYWxsYmFjayhncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB2YXIgdXJsID0gUGFnZVV0aWxzLmNvbXB1dGVQYWdlVXJsKCRwYWdlLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBhZ2VEYXRhID0gUGFnZURhdGEuZ2V0UGFnZURhdGFCeVVSTCh1cmwpO1xuICAgICAgICAgICAgICAgICAgICAvLyBGaXJzdCwgY2hlY2sgZm9yIGFueSBuZXcgc3VtbWFyeSB3aWRnZXRzLi4uXG4gICAgICAgICAgICAgICAgICAgIHNjYW5Gb3JTdW1tYXJpZXMoJGVsZW1lbnQsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgICAgICAgICAgc2NhbkZvclJlYWRNb3JlKCRlbGVtZW50LCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICAgICAgICAgIHNjYW5Gb3JDb250ZW50UmVjKCRlbGVtZW50LCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICAgICAgICAgIC8vIE5leHQsIHNlZSBpZiBhbnkgZW50aXJlIGFjdGl2ZSBzZWN0aW9ucyB3ZXJlIGFkZGVkXG4gICAgICAgICAgICAgICAgICAgIHZhciAkYWN0aXZlU2VjdGlvbnMgPSBmaW5kKCRlbGVtZW50LCBncm91cFNldHRpbmdzLmFjdGl2ZVNlY3Rpb25zKCksIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoJGFjdGl2ZVNlY3Rpb25zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRhY3RpdmVTZWN0aW9ucy5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgJHNlY3Rpb24gPSAkKHRoaXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNyZWF0ZUF1dG9DYWxsc1RvQWN0aW9uKCRzZWN0aW9uLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjYW5Gb3JDYWxsc1RvQWN0aW9uKCRlbGVtZW50LCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkYWN0aXZlU2VjdGlvbnMuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyICRzZWN0aW9uID0gJCh0aGlzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY2FuQWN0aXZlRWxlbWVudCgkc2VjdGlvbiwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBGaW5hbGx5LCBzY2FuIGluc2lkZSB0aGUgZWxlbWVudCBmb3IgY29udGVudFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyICRhY3RpdmVTZWN0aW9uID0gJGVsZW1lbnQuY2xvc2VzdChncm91cFNldHRpbmdzLmFjdGl2ZVNlY3Rpb25zKCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCRhY3RpdmVTZWN0aW9uLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjcmVhdGVBdXRvQ2FsbHNUb0FjdGlvbigkZWxlbWVudCwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjYW5Gb3JDYWxsc1RvQWN0aW9uKCRlbGVtZW50LCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NhbkFjdGl2ZUVsZW1lbnQoJGVsZW1lbnQsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGhlIGVsZW1lbnQgaXMgYWRkZWQgb3V0c2lkZSBhbiBhY3RpdmUgc2VjdGlvbiwganVzdCBjaGVjayBpdCBmb3IgQ1RBc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjYW5Gb3JDYWxsc1RvQWN0aW9uKCRlbGVtZW50LCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzaG91bGRSZWluaXRpYWxpemVGb3JMb2NhdGlvbkNoYW5nZSgpIHtcbiAgICAgICAgLy8gUmVpbml0aWFsaXplIHdoZW4gdGhlIGxvY2F0aW9uIGNoYW5nZXMgaW4gYSB3YXkgdGhhdCB3ZSBiZWxpZXZlIGlzIG1lYW5pbmdmdWwuXG4gICAgICAgIC8vIFRoZSBoZXVyaXN0aWMgd2UgdXNlIGlzIHRoYXQgZWl0aGVyOlxuICAgICAgICAvLyAxLiBUaGUgcXVlcnkgc3RyaW5nIGNoYW5nZXMgYW5kIHdlJ3JlIG9uIGEgc2l0ZSB0aGF0IHNheXMgdGhlIHF1ZXJ5IHN0cmluZyBtYXR0ZXJzIG9yXG4gICAgICAgIC8vIDIuIFRoZSBwYXRoIGNoYW5nZXMuLi5cbiAgICAgICAgLy8gICAgMmEuIEJ1dCBub3QgaWYgdGhlIGNoYW5nZSBpcyBhbiBleHRlbnNpb24gb2YgdGhlIHBhdGguXG4gICAgICAgIC8vICAgICAgICAyYWEuIFVubGVzcyB3ZSdyZSBnb2luZyBmcm9tIGFuIGVtcHR5IHBhdGggKCcvJykgdG8gc29tZSBvdGhlciBwYXRoLlxuICAgICAgICB2YXIgbmV3TG9jYXRpb25QYXRobmFtZSA9IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZTtcbiAgICAgICAgcmV0dXJuIGdyb3VwU2V0dGluZ3MudXJsLmluY2x1ZGVRdWVyeVN0cmluZygpICYmIG9yaWdpbmFsU2VhcmNoICE9IHdpbmRvdy5sb2NhdGlvbi5zZWFyY2ggfHxcbiAgICAgICAgICAgICAgICBuZXdMb2NhdGlvblBhdGhuYW1lICE9IG9yaWdpbmFsUGF0aG5hbWUgJiYgKG9yaWdpbmFsUGF0aG5hbWUgPT09ICcvJyB8fCBuZXdMb2NhdGlvblBhdGhuYW1lLmluZGV4T2Yob3JpZ2luYWxQYXRobmFtZSkgPT09IC0xKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHRlYXJkb3duKCkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY3JlYXRlZFdpZGdldHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY3JlYXRlZFdpZGdldHNbaV0udGVhcmRvd24oKTtcbiAgICB9XG4gICAgY3JlYXRlZFdpZGdldHMgPSBbXTtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHNjYW46IHNjYW5BbGxQYWdlcyxcbiAgICB0ZWFyZG93bjogdGVhcmRvd25cbn07IiwidmFyIFJhY3RpdmU7IHJlcXVpcmUoJy4vdXRpbHMvcmFjdGl2ZS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihsb2FkZWRSYWN0aXZlKSB7IFJhY3RpdmUgPSBsb2FkZWRSYWN0aXZlO30pO1xudmFyIFNWR3MgPSByZXF1aXJlKCcuL3N2Z3MnKTtcblxudmFyIHBhZ2VTZWxlY3RvciA9ICcuYW50ZW5uYS1wZW5kaW5nLXBhZ2UnO1xuXG5mdW5jdGlvbiBjcmVhdGVQYWdlKHJlYWN0aW9uVGV4dCwgZWxlbWVudCkge1xuICAgIHZhciByYWN0aXZlID0gUmFjdGl2ZSh7XG4gICAgICAgIGVsOiBlbGVtZW50LFxuICAgICAgICBhcHBlbmQ6IHRydWUsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIHRleHQ6IHJlYWN0aW9uVGV4dFxuICAgICAgICB9LFxuICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL3BlbmRpbmctcmVhY3Rpb24tcGFnZS5oYnMuaHRtbCcpLFxuICAgICAgICBwYXJ0aWFsczoge1xuICAgICAgICAgICAgbGVmdDogU1ZHcy5sZWZ0XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4ge1xuICAgICAgICBzZWxlY3RvcjogcGFnZVNlbGVjdG9yLFxuICAgICAgICB0ZWFyZG93bjogZnVuY3Rpb24oKSB7IHJhY3RpdmUudGVhcmRvd24oKTsgfVxuICAgIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZVBhZ2U6IGNyZWF0ZVBhZ2Vcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgUmFjdGl2ZTsgcmVxdWlyZSgnLi91dGlscy9yYWN0aXZlLXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGxvYWRlZFJhY3RpdmUpIHsgUmFjdGl2ZSA9IGxvYWRlZFJhY3RpdmU7fSk7XG52YXIgV2lkZ2V0QnVja2V0ID0gcmVxdWlyZSgnLi91dGlscy93aWRnZXQtYnVja2V0Jyk7XG52YXIgVHJhbnNpdGlvblV0aWwgPSByZXF1aXJlKCcuL3V0aWxzL3RyYW5zaXRpb24tdXRpbCcpO1xuXG52YXIgU1ZHcyA9IHJlcXVpcmUoJy4vc3ZncycpO1xuXG52YXIgcmFjdGl2ZTtcbnZhciBjbGlja0hhbmRsZXI7XG5cblxuZnVuY3Rpb24gZ2V0Um9vdEVsZW1lbnQoKSB7XG4gICAgLy8gVE9ETyByZXZpc2l0IHRoaXMsIGl0J3Mga2luZCBvZiBnb29meSBhbmQgaXQgbWlnaHQgaGF2ZSBhIHRpbWluZyBwcm9ibGVtXG4gICAgaWYgKCFyYWN0aXZlKSB7XG4gICAgICAgIHZhciBidWNrZXQgPSBXaWRnZXRCdWNrZXQuZ2V0KCk7XG4gICAgICAgIHJhY3RpdmUgPSBSYWN0aXZlKHtcbiAgICAgICAgICAgIGVsOiBidWNrZXQsXG4gICAgICAgICAgICBhcHBlbmQ6IHRydWUsXG4gICAgICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL3BvcHVwLXdpZGdldC5oYnMuaHRtbCcpLFxuICAgICAgICAgICAgcGFydGlhbHM6IHtcbiAgICAgICAgICAgICAgICBsb2dvOiBTVkdzLmxvZ29cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHZhciAkZWxlbWVudCA9ICQocmFjdGl2ZS5maW5kKCcuYW50ZW5uYS1wb3B1cCcpKTtcbiAgICAgICAgJGVsZW1lbnQub24oJ21vdXNlZG93bicsIGZhbHNlKTsgLy8gUHJldmVudCBtb3VzZWRvd24gZnJvbSBwcm9wYWdhdGluZywgc28gdGhlIGJyb3dzZXIgZG9lc24ndCBjbGVhciB0aGUgdGV4dCBzZWxlY3Rpb24uXG4gICAgICAgICRlbGVtZW50Lm9uKCdjbGljay5hbnRlbm5hLXBvcHVwJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIGhpZGVQb3B1cCgkZWxlbWVudCk7XG4gICAgICAgICAgICBpZiAoY2xpY2tIYW5kbGVyKSB7XG4gICAgICAgICAgICAgICAgY2xpY2tIYW5kbGVyKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBzZXR1cE1vdXNlT3ZlcigkZWxlbWVudCk7XG4gICAgICAgIHJldHVybiAkZWxlbWVudDtcbiAgICB9XG4gICAgcmV0dXJuICQocmFjdGl2ZS5maW5kKCcuYW50ZW5uYS1wb3B1cCcpKTtcbn1cblxuZnVuY3Rpb24gc2V0dXBNb3VzZU92ZXIoJGVsZW1lbnQpIHtcbiAgICB2YXIgY2xvc2VUaW1lcjtcblxuICAgIC8vIFRoZSA6aG92ZXIgcHNldWRvIGNsYXNzIGNhbiBiZWNvbWUgc3R1Y2sgb24gdGhlIGFudGVubmEtcG9wdXAgZWxlbWVudCB3aGVuIHdlIGJyaW5nIHVwIHRoZSByZWFjdGlvbiB3aW5kb3dcbiAgICAvLyBpbiByZXNwb25zZSB0byB0aGUgY2xpY2suIFNvIGhlcmUgd2UgYWRkL3JlbW92ZSBvdXIgb3duIGhvdmVyIGNsYXNzIGluc3RlYWQuXG4gICAgLy8gU2VlOiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzEwMzIxMjc1L2hvdmVyLXN0YXRlLWlzLXN0aWNreS1hZnRlci1lbGVtZW50LWlzLW1vdmVkLW91dC1mcm9tLXVuZGVyLXRoZS1tb3VzZS1pbi1hbGwtYnJcbiAgICB2YXIgaG92ZXJDbGFzcyA9ICdhbnRlbm5hLWhvdmVyJztcbiAgICAkZWxlbWVudC5vbignbW91c2VlbnRlcicsIGZ1bmN0aW9uKCkge1xuICAgICAgICAkZWxlbWVudC5hZGRDbGFzcyhob3ZlckNsYXNzKTtcbiAgICAgICAga2VlcE9wZW4oKTtcbiAgICB9KTtcbiAgICAkZWxlbWVudC5vbignbW91c2VsZWF2ZScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAkZWxlbWVudC5yZW1vdmVDbGFzcyhob3ZlckNsYXNzKTtcbiAgICAgICAgZGVsYXllZENsb3NlKCk7XG4gICAgfSk7XG5cbiAgICBmdW5jdGlvbiBkZWxheWVkQ2xvc2UoKSB7XG4gICAgICAgIGNsb3NlVGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY2xvc2VUaW1lciA9IG51bGw7XG4gICAgICAgICAgICBoaWRlUG9wdXAoJGVsZW1lbnQpO1xuICAgICAgICB9LCA1MDApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGtlZXBPcGVuKCkge1xuICAgICAgICBpZiAoY2xvc2VUaW1lcikge1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KGNsb3NlVGltZXIpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBpc1Nob3dpbmcoKSB7XG4gICAgaWYgKCFyYWN0aXZlKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdmFyICRlbGVtZW50ID0gZ2V0Um9vdEVsZW1lbnQoKTtcbiAgICByZXR1cm4gJGVsZW1lbnQuaGFzQ2xhc3MoJ2FudGVubmEtc2hvdycpO1xufVxuXG5mdW5jdGlvbiBzaG93UG9wdXAoY29vcmRpbmF0ZXMsIGNhbGxiYWNrKSB7XG4gICAgdmFyICRlbGVtZW50ID0gZ2V0Um9vdEVsZW1lbnQoKTtcbiAgICBpZiAoISRlbGVtZW50Lmhhc0NsYXNzKCdhbnRlbm5hLXNob3cnKSkge1xuICAgICAgICBjbGlja0hhbmRsZXIgPSBjYWxsYmFjaztcbiAgICAgICAgdmFyIGJvZHlPZmZzZXQgPSAkKCdib2R5Jykub2Zmc2V0KCk7IC8vIGFjY291bnQgZm9yIGFueSBvZmZzZXQgdGhhdCBzaXRlcyBhcHBseSB0byB0aGUgZW50aXJlIGJvZHlcbiAgICAgICAgdmFyIHRhaWwgPSA2OyAvLyBUT0RPIGZpbmQgYSBjbGVhbmVyIHdheSB0byBhY2NvdW50IGZvciB0aGUgcG9wdXAgJ3RhaWwnXG4gICAgICAgICRlbGVtZW50XG4gICAgICAgICAgICAuc2hvdygpIC8vIHN0aWxsIGhhcyBvcGFjaXR5IDAgYXQgdGhpcyBwb2ludFxuICAgICAgICAgICAgLmNzcyh7XG4gICAgICAgICAgICAgICAgdG9wOiBjb29yZGluYXRlcy50b3AgLSAkZWxlbWVudC5vdXRlckhlaWdodCgpIC0gdGFpbCAtIGJvZHlPZmZzZXQudG9wLFxuICAgICAgICAgICAgICAgIGxlZnQ6IGNvb3JkaW5hdGVzLmxlZnQgLSBib2R5T2Zmc2V0LmxlZnQgLSBNYXRoLmZsb29yKCRlbGVtZW50Lm91dGVyV2lkdGgoKSAvIDIpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgVHJhbnNpdGlvblV0aWwudG9nZ2xlQ2xhc3MoJGVsZW1lbnQsICdhbnRlbm5hLXNob3cnLCB0cnVlLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIFRPRE86IGFmdGVyIHRoZSBhcHBlYXJhbmNlIHRyYW5zaXRpb24gaXMgY29tcGxldGUsIGFkZCBhIGhhbmRsZXIgZm9yIG1vdXNlZW50ZXIgd2hpY2ggdGhlbiByZWdpc3RlcnNcbiAgICAgICAgICAgIC8vICAgICAgIGEgaGFuZGxlciBmb3IgbW91c2VsZWF2ZSB0aGF0IGhpZGVzIHRoZSBwb3B1cFxuXG4gICAgICAgICAgICAvLyBUT0RPOiBhbHNvIHRha2UgZG93biB0aGUgcG9wdXAgaWYgdGhlIHVzZXIgbW91c2VzIG92ZXIgYW5vdGhlciB3aWRnZXQgKHN1bW1hcnkgb3IgaW5kaWNhdG9yKVxuICAgICAgICAgICAgJChkb2N1bWVudCkub24oJ2NsaWNrLmFudGVubmEtcG9wdXAnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaGlkZVBvcHVwKCRlbGVtZW50KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGhpZGVQb3B1cCgkZWxlbWVudCkge1xuICAgIFRyYW5zaXRpb25VdGlsLnRvZ2dsZUNsYXNzKCRlbGVtZW50LCAnYW50ZW5uYS1zaG93JywgZmFsc2UsIGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoISRlbGVtZW50Lmhhc0NsYXNzKCdhbnRlbm5hLXNob3cnKSkgeyAvLyBCeSB0aGUgdGltZSB0aGUgdHJhbnNpdGlvbiBmaW5pc2hlcywgdGhlIHdpZGdldCBjb3VsZCBiZSBzaG93aW5nIGFnYWluLlxuICAgICAgICAgICAgJGVsZW1lbnQuaGlkZSgpOyAvLyBhZnRlciB3ZSdyZSBhdCBvcGFjaXR5IDAsIGhpZGUgdGhlIGVsZW1lbnQgc28gaXQgZG9lc24ndCByZWNlaXZlIGFjY2lkZW50YWwgY2xpY2tzXG4gICAgICAgIH1cbiAgICB9KTtcbiAgICAkKGRvY3VtZW50KS5vZmYoJ2NsaWNrLmFudGVubmEtcG9wdXAnKTtcbn1cblxuZnVuY3Rpb24gdGVhcmRvd24oKSB7XG4gICAgaWYgKHJhY3RpdmUpIHtcbiAgICAgICAgcmFjdGl2ZS50ZWFyZG93bigpO1xuICAgICAgICByYWN0aXZlID0gdW5kZWZpbmVkO1xuICAgICAgICBjbGlja0hhbmRsZXIgPSB1bmRlZmluZWQ7XG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgaXNTaG93aW5nOiBpc1Nob3dpbmcsXG4gICAgc2hvdzogc2hvd1BvcHVwLFxuICAgIHRlYXJkb3duOiB0ZWFyZG93blxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi91dGlscy9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciBSYWN0aXZlOyByZXF1aXJlKCcuL3V0aWxzL3JhY3RpdmUtcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24obG9hZGVkUmFjdGl2ZSkgeyBSYWN0aXZlID0gbG9hZGVkUmFjdGl2ZTt9KTtcblxudmFyIEFqYXhDbGllbnQgPSByZXF1aXJlKCcuL3V0aWxzL2FqYXgtY2xpZW50Jyk7XG52YXIgUmFuZ2UgPSByZXF1aXJlKCcuL3V0aWxzL3JhbmdlJyk7XG52YXIgUmVhY3Rpb25zV2lkZ2V0TGF5b3V0VXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzL3JlYWN0aW9ucy13aWRnZXQtbGF5b3V0LXV0aWxzJyk7XG5cbnZhciBFdmVudHMgPSByZXF1aXJlKCcuL2V2ZW50cycpO1xudmFyIFBhZ2VEYXRhID0gcmVxdWlyZSgnLi9wYWdlLWRhdGEnKTtcbnZhciBTVkdzID0gcmVxdWlyZSgnLi9zdmdzJyk7XG5cbnZhciBwYWdlU2VsZWN0b3IgPSAnLmFudGVubmEtcmVhY3Rpb25zLXBhZ2UnO1xuXG5mdW5jdGlvbiBjcmVhdGVQYWdlKG9wdGlvbnMpIHtcbiAgICB2YXIgaXNTdW1tYXJ5ID0gb3B0aW9ucy5pc1N1bW1hcnk7XG4gICAgdmFyIHJlYWN0aW9uc0RhdGEgPSBvcHRpb25zLnJlYWN0aW9uc0RhdGE7XG4gICAgdmFyIGRlZmF1bHRSZWFjdGlvbnMgPSBvcHRpb25zLmRlZmF1bHRSZWFjdGlvbnM7XG4gICAgdmFyIGNvbnRhaW5lckRhdGEgPSBvcHRpb25zLmNvbnRhaW5lckRhdGE7XG4gICAgdmFyIHBhZ2VEYXRhID0gb3B0aW9ucy5wYWdlRGF0YTtcbiAgICB2YXIgZ3JvdXBTZXR0aW5ncyA9IG9wdGlvbnMuZ3JvdXBTZXR0aW5ncztcbiAgICB2YXIgY29udGVudERhdGEgPSBvcHRpb25zLmNvbnRlbnREYXRhO1xuICAgIHZhciBjb250YWluZXJFbGVtZW50ID0gb3B0aW9ucy5jb250YWluZXJFbGVtZW50OyAvLyBvcHRpb25hbFxuICAgIHZhciBzaG93Q29uZmlybWF0aW9uID0gb3B0aW9ucy5zaG93Q29uZmlybWF0aW9uO1xuICAgIHZhciBzaG93TG9jYXRpb25zID0gb3B0aW9ucy5zaG93TG9jYXRpb25zO1xuICAgIHZhciBzaG93UGVuZGluZ0FwcHJvdmFsID0gb3B0aW9ucy5zaG93UGVuZGluZ0FwcHJvdmFsO1xuICAgIHZhciBzaG93UHJvZ3Jlc3MgPSBvcHRpb25zLnNob3dQcm9ncmVzcztcbiAgICB2YXIgaGFuZGxlUmVhY3Rpb25FcnJvciA9IG9wdGlvbnMuaGFuZGxlUmVhY3Rpb25FcnJvcjtcbiAgICB2YXIgZWxlbWVudCA9IG9wdGlvbnMuZWxlbWVudDtcblxuICAgIHZhciBjb21iaW5lZFJlYWN0aW9uc0RhdGEgPSBjb21iaW5lUmVhY3Rpb25EYXRhKHJlYWN0aW9uc0RhdGEsIGRlZmF1bHRSZWFjdGlvbnMpO1xuICAgIHZhciByZWFjdGlvbnNMYXlvdXREYXRhID0gUmVhY3Rpb25zV2lkZ2V0TGF5b3V0VXRpbHMuY29tcHV0ZUxheW91dERhdGEoY29tYmluZWRSZWFjdGlvbnNEYXRhKTtcbiAgICB2YXIgJHJlYWN0aW9uc1dpbmRvdyA9ICQob3B0aW9ucy5yZWFjdGlvbnNXaW5kb3cpO1xuICAgIHZhciByYWN0aXZlID0gUmFjdGl2ZSh7XG4gICAgICAgIGVsOiBlbGVtZW50LFxuICAgICAgICBhcHBlbmQ6IHRydWUsXG4gICAgICAgIHRlbXBsYXRlOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvcmVhY3Rpb25zLXBhZ2UuaGJzLmh0bWwnKSxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgcmVhY3Rpb25zOiBjb21iaW5lZFJlYWN0aW9uc0RhdGEsXG4gICAgICAgICAgICByZWFjdGlvbnNMYXlvdXRDbGFzczogYXJyYXlBY2Nlc3NvcihyZWFjdGlvbnNMYXlvdXREYXRhLmxheW91dENsYXNzZXMpLFxuICAgICAgICAgICAgaXNTdW1tYXJ5OiBpc1N1bW1hcnlcbiAgICAgICAgfSxcbiAgICAgICAgZGVjb3JhdG9yczoge1xuICAgICAgICAgICAgc2l6ZXRvZml0OiBzaXplVG9GaXQoJHJlYWN0aW9uc1dpbmRvdylcbiAgICAgICAgfSxcbiAgICAgICAgcGFydGlhbHM6IHtcbiAgICAgICAgICAgIGxvY2F0aW9uSWNvbjogU1ZHcy5sb2NhdGlvblxuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICBpZiAoY29udGFpbmVyRWxlbWVudCkge1xuICAgICAgICByYWN0aXZlLm9uKCdoaWdobGlnaHQnLCBoaWdobGlnaHRDb250ZW50KGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBjb250YWluZXJFbGVtZW50KSk7XG4gICAgICAgIHJhY3RpdmUub24oJ2NsZWFyaGlnaGxpZ2h0cycsIFJhbmdlLmNsZWFySGlnaGxpZ2h0cyk7XG4gICAgfVxuICAgIHJhY3RpdmUub24oJ3JlYWN0JywgZnVuY3Rpb24ocmFjdGl2ZUV2ZW50KSB7XG4gICAgICAgIGlmIChyYWN0aXZlRXZlbnQuY29udGV4dC5pc0RlZmF1bHQpIHtcbiAgICAgICAgICAgIG5ld0RlZmF1bHRSZWFjdGlvbihyYWN0aXZlRXZlbnQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcGx1c09uZShyYWN0aXZlRXZlbnQpO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmFjdGl2ZS5vbignbmV3Y3VzdG9tJywgbmV3Q3VzdG9tUmVhY3Rpb24pO1xuICAgIHJhY3RpdmUub24oJ2N1c3RvbWZvY3VzJywgY3VzdG9tUmVhY3Rpb25Gb2N1cyk7XG4gICAgcmFjdGl2ZS5vbignY3VzdG9tYmx1cicsIGN1c3RvbVJlYWN0aW9uQmx1cik7XG4gICAgcmFjdGl2ZS5vbigncGFnZWtleWRvd24nLCBrZXlib2FyZElucHV0KTtcbiAgICByYWN0aXZlLm9uKCdpbnB1dGtleWRvd24nLCBjdXN0b21SZWFjdGlvbklucHV0KTtcbiAgICByYWN0aXZlLm9uKCdzaG93bG9jYXRpb25zJywgZnVuY3Rpb24ocmFjdGl2ZUV2ZW50KSB7IHNob3dMb2NhdGlvbnMocmFjdGl2ZUV2ZW50LmNvbnRleHQsIHBhZ2VTZWxlY3Rvcik7IHJldHVybiBmYWxzZTsgfSk7IC8vIFRPRE8gY2xlYW4gdXBcbiAgICByZXR1cm4ge1xuICAgICAgICBzZWxlY3RvcjogcGFnZVNlbGVjdG9yLFxuICAgICAgICB0ZWFyZG93bjogZnVuY3Rpb24oKSB7IHJhY3RpdmUudGVhcmRvd24oKTsgfVxuICAgIH07XG5cbiAgICBmdW5jdGlvbiBhcnJheUFjY2Vzc29yKGFycmF5KSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbihpbmRleCkge1xuICAgICAgICAgICAgcmV0dXJuIGFycmF5W2luZGV4XTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBsdXNPbmUocmFjdGl2ZUV2ZW50KSB7XG4gICAgICAgIHZhciByZWFjdGlvbkRhdGEgPSByYWN0aXZlRXZlbnQuY29udGV4dDtcbiAgICAgICAgdmFyIHJlYWN0aW9uUHJvdmlkZXIgPSB7IC8vIHRoaXMgcmVhY3Rpb24gcHJvdmlkZXIgaXMgYSBuby1icmFpbmVyIGJlY2F1c2Ugd2UgYWxyZWFkeSBoYXZlIGEgdmFsaWQgcmVhY3Rpb24gKG9uZSB3aXRoIGFuIElEKVxuICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKHJlYWN0aW9uRGF0YSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHNob3dDb25maXJtYXRpb24ocmVhY3Rpb25EYXRhLCByZWFjdGlvblByb3ZpZGVyKTtcbiAgICAgICAgQWpheENsaWVudC5wb3N0UGx1c09uZShyZWFjdGlvbkRhdGEsIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzLCBzdWNjZXNzLCBlcnJvcik7XG5cbiAgICAgICAgZnVuY3Rpb24gc3VjY2VzcyhyZWFjdGlvbkRhdGEsIGV4aXN0aW5nKSB7XG4gICAgICAgICAgICBpZiAoIWV4aXN0aW5nKSB7XG4gICAgICAgICAgICAgICAgRXZlbnRzLnBvc3RSZWFjdGlvbkNyZWF0ZWQocGFnZURhdGEsIGNvbnRhaW5lckRhdGEsIHJlYWN0aW9uRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBlcnJvcihtZXNzYWdlKSB7XG4gICAgICAgICAgICB2YXIgcmV0cnkgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBBamF4Q2xpZW50LnBvc3RQbHVzT25lKHJlYWN0aW9uRGF0YSwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MsIHN1Y2Nlc3MsIGVycm9yKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBoYW5kbGVSZWFjdGlvbkVycm9yKG1lc3NhZ2UsIHJldHJ5LCBwYWdlU2VsZWN0b3IpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbmV3RGVmYXVsdFJlYWN0aW9uKHJhY3RpdmVFdmVudCkge1xuICAgICAgICB2YXIgcmVhY3Rpb25EYXRhID0gcmFjdGl2ZUV2ZW50LmNvbnRleHQ7XG4gICAgICAgIHZhciByZWFjdGlvblByb3ZpZGVyID0gY3JlYXRlUmVhY3Rpb25Qcm92aWRlcigpO1xuICAgICAgICBzaG93Q29uZmlybWF0aW9uKHJlYWN0aW9uRGF0YSwgcmVhY3Rpb25Qcm92aWRlcik7IC8vIE9wdGltaXN0aWNhbGx5IHNob3cgY29uZmlybWF0aW9uIGZvciBkZWZhdWx0IHJlYWN0aW9ucyBiZWNhdXNlIHRoZXkgc2hvdWxkIGFsd2F5cyBiZSBhY2NlcHRlZC5cbiAgICAgICAgQWpheENsaWVudC5wb3N0TmV3UmVhY3Rpb24ocmVhY3Rpb25EYXRhLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgY29udGVudERhdGEsIGdyb3VwU2V0dGluZ3MsIHN1Y2Nlc3MsIGVycm9yKTtcblxuICAgICAgICBmdW5jdGlvbiBzdWNjZXNzKHJlYWN0aW9uKSB7XG4gICAgICAgICAgICByZWFjdGlvbiA9IFBhZ2VEYXRhLnJlZ2lzdGVyUmVhY3Rpb24ocmVhY3Rpb24sIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhKTtcbiAgICAgICAgICAgIHJlYWN0aW9uUHJvdmlkZXIucmVhY3Rpb25Mb2FkZWQocmVhY3Rpb24pO1xuICAgICAgICAgICAgRXZlbnRzLnBvc3RSZWFjdGlvbkNyZWF0ZWQocGFnZURhdGEsIGNvbnRhaW5lckRhdGEsIHJlYWN0aW9uLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGVycm9yKG1lc3NhZ2UpIHtcbiAgICAgICAgICAgIHZhciByZXRyeSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIEFqYXhDbGllbnQucG9zdE5ld1JlYWN0aW9uKHJlYWN0aW9uRGF0YSwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGNvbnRlbnREYXRhLCBncm91cFNldHRpbmdzLCBzdWNjZXNzLCBlcnJvcik7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaGFuZGxlUmVhY3Rpb25FcnJvcihtZXNzYWdlLCByZXRyeSwgcGFnZVNlbGVjdG9yKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIG5ld0N1c3RvbVJlYWN0aW9uKCkge1xuICAgICAgICB2YXIgaW5wdXQgPSByYWN0aXZlLmZpbmQoJy5hbnRlbm5hLXJlYWN0aW9ucy1mb290ZXIgaW5wdXQnKTtcbiAgICAgICAgdmFyIGJvZHkgPSBpbnB1dC52YWx1ZS50cmltKCk7XG4gICAgICAgIGlmIChib2R5ICE9PSAnJykge1xuICAgICAgICAgICAgc2hvd1Byb2dyZXNzKCk7IC8vIFNob3cgcHJvZ3Jlc3MgZm9yIGN1c3RvbSByZWFjdGlvbnMgYmVjYXVzZSB0aGUgc2VydmVyIG1pZ2h0IHJlamVjdCB0aGVtIGZvciBhIG51bWJlciBvZiByZWFzb25zXG4gICAgICAgICAgICB2YXIgcmVhY3Rpb25EYXRhID0geyB0ZXh0OiBib2R5IH07XG4gICAgICAgICAgICB2YXIgcmVhY3Rpb25Qcm92aWRlciA9IGNyZWF0ZVJlYWN0aW9uUHJvdmlkZXIoKTtcbiAgICAgICAgICAgIGlucHV0LmJsdXIoKTtcbiAgICAgICAgICAgIEFqYXhDbGllbnQucG9zdE5ld1JlYWN0aW9uKHJlYWN0aW9uRGF0YSwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGNvbnRlbnREYXRhLCBncm91cFNldHRpbmdzLCBzdWNjZXNzLCBlcnJvcik7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBzdWNjZXNzKHJlYWN0aW9uKSB7XG4gICAgICAgICAgICBpZiAocmVhY3Rpb24uYXBwcm92ZWQpIHtcbiAgICAgICAgICAgICAgICBzaG93Q29uZmlybWF0aW9uKHJlYWN0aW9uRGF0YSwgcmVhY3Rpb25Qcm92aWRlcik7XG4gICAgICAgICAgICAgICAgcmVhY3Rpb24gPSBQYWdlRGF0YS5yZWdpc3RlclJlYWN0aW9uKHJlYWN0aW9uLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSk7XG4gICAgICAgICAgICAgICAgcmVhY3Rpb25Qcm92aWRlci5yZWFjdGlvbkxvYWRlZChyZWFjdGlvbik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIElmIHRoZSByZWFjdGlvbiBpc24ndCBhcHByb3ZlZCwgZG9uJ3QgYWRkIGl0IHRvIG91ciBkYXRhIG1vZGVsLiBKdXN0IHNob3cgZmVlZGJhY2sgYW5kIGZpcmUgYW4gZXZlbnQuXG4gICAgICAgICAgICAgICAgc2hvd1BlbmRpbmdBcHByb3ZhbChyZWFjdGlvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBFdmVudHMucG9zdFJlYWN0aW9uQ3JlYXRlZChwYWdlRGF0YSwgY29udGFpbmVyRGF0YSwgcmVhY3Rpb24sIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZXJyb3IobWVzc2FnZSkge1xuICAgICAgICAgICAgdmFyIHJldHJ5ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgQWpheENsaWVudC5wb3N0TmV3UmVhY3Rpb24ocmVhY3Rpb25EYXRhLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgY29udGVudERhdGEsIGdyb3VwU2V0dGluZ3MsIHN1Y2Nlc3MsIGVycm9yKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBoYW5kbGVSZWFjdGlvbkVycm9yKG1lc3NhZ2UsIHJldHJ5LCBwYWdlU2VsZWN0b3IpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY3VzdG9tUmVhY3Rpb25JbnB1dChyYWN0aXZlRXZlbnQpIHtcbiAgICAgICAgdmFyIGV2ZW50ID0gcmFjdGl2ZUV2ZW50Lm9yaWdpbmFsO1xuICAgICAgICB2YXIga2V5ID0gKGV2ZW50LndoaWNoICE9PSB1bmRlZmluZWQpID8gZXZlbnQud2hpY2ggOiBldmVudC5rZXlDb2RlO1xuICAgICAgICBpZiAoa2V5ID09IDEzKSB7IC8vIEVudGVyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyAvLyBsZXQgdGhlIHByb2Nlc3Npbmcgb2YgdGhlIGtleWJvYXJkIGV2ZW50IGZpbmlzaCBiZWZvcmUgd2Ugc2hvdyB0aGUgcGFnZSAob3RoZXJ3aXNlLCB0aGUgY29uZmlybWF0aW9uIHBhZ2UgYWxzbyByZWNlaXZlcyB0aGUga2V5c3Ryb2tlKVxuICAgICAgICAgICAgICAgIG5ld0N1c3RvbVJlYWN0aW9uKCk7XG4gICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgfSBlbHNlIGlmIChrZXkgPT0gMjcpIHsgLy8gRXNjYXBlXG4gICAgICAgICAgICBldmVudC50YXJnZXQudmFsdWUgPSAnJztcbiAgICAgICAgICAgIHJvb3RFbGVtZW50KHJhY3RpdmUpLmZvY3VzKCk7XG4gICAgICAgIH1cbiAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24ga2V5Ym9hcmRJbnB1dChyYWN0aXZlRXZlbnQpIHtcbiAgICAgICAgaWYgKCQocm9vdEVsZW1lbnQocmFjdGl2ZSkpLmhhc0NsYXNzKCdhbnRlbm5hLXBhZ2UtYWN0aXZlJykpIHsgLy8gb25seSBoYW5kbGUgaW5wdXQgd2hlbiB0aGlzIHBhZ2UgaXMgYWN0aXZlXG4gICAgICAgICAgICAkKHJvb3RFbGVtZW50KHJhY3RpdmUpKS5maW5kKCcuYW50ZW5uYS1yZWFjdGlvbnMtZm9vdGVyIGlucHV0JykuZm9jdXMoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJvb3RFbGVtZW50KHJhY3RpdmUpIHtcbiAgICAgICAgcmV0dXJuIHJhY3RpdmUuZmluZChwYWdlU2VsZWN0b3IpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gc2l6ZVRvRml0KCRyZWFjdGlvbnNXaW5kb3cpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24obm9kZSkge1xuICAgICAgICB2YXIgJGVsZW1lbnQgPSAkKG5vZGUpLmNsb3Nlc3QoJy5hbnRlbm5hLXJlYWN0aW9uLWJveCcpO1xuICAgICAgICAvLyBXaGlsZSB3ZSdyZSBzaXppbmcgdGhlIHRleHQgdG8gZml4IGluIHRoZSByZWFjdGlvbiBib3gsIHdlIGFsc28gZml4IHVwIHRoZSB3aWR0aCBvZiB0aGUgcmVhY3Rpb24gY291bnQgYW5kXG4gICAgICAgIC8vIHBsdXMgb25lIGJ1dHRvbnMgc28gdGhhdCB0aGV5J3JlIHRoZSBzYW1lLiBUaGVzZSB0d28gdmlzdWFsbHkgc3dhcCB3aXRoIGVhY2ggb3RoZXIgb24gaG92ZXI7IG1ha2luZyB0aGVtXG4gICAgICAgIC8vIHRoZSBzYW1lIHdpZHRoIG1ha2VzIHN1cmUgd2UgZG9uJ3QgZ2V0IGp1bXBpbmVzcyBvbiBob3Zlci5cbiAgICAgICAgdmFyICRyZWFjdGlvbkNvdW50ID0gJGVsZW1lbnQuZmluZCgnLmFudGVubmEtcmVhY3Rpb24tY291bnQnKTtcbiAgICAgICAgdmFyICRwbHVzT25lID0gJGVsZW1lbnQuZmluZCgnLmFudGVubmEtcGx1c29uZScpO1xuICAgICAgICB2YXIgbWluV2lkdGggPSBNYXRoLm1heCgkcmVhY3Rpb25Db3VudC53aWR0aCgpLCAkcGx1c09uZS53aWR0aCgpKTtcbiAgICAgICAgbWluV2lkdGgrKzsgLy8gQWRkIGFuIGV4dHJhIHBpeGVsIGZvciByb3VuZGluZyBiZWNhdXNlIGVsZW1lbnRzIHRoYXQgbWVhc3VyZSwgZm9yIGV4YW1wbGUsIDE3LjE4NzVweCBjYW4gY29tZSBiYWNrIHdpdGggMTcgYXMgdGhlIHdpZHRoKClcbiAgICAgICAgJHJlYWN0aW9uQ291bnQuY3NzKHsnbWluLXdpZHRoJzogbWluV2lkdGh9KTtcbiAgICAgICAgJHBsdXNPbmUuY3NzKHsnbWluLXdpZHRoJzogbWluV2lkdGh9KTtcbiAgICAgICAgcmV0dXJuIFJlYWN0aW9uc1dpZGdldExheW91dFV0aWxzLnNpemVUb0ZpdCgkcmVhY3Rpb25zV2luZG93KShub2RlKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGhpZ2hsaWdodENvbnRlbnQoY29udGFpbmVyRGF0YSwgcGFnZURhdGEsICRjb250YWluZXJFbGVtZW50KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHZhciByZWFjdGlvbkRhdGEgPSBldmVudC5jb250ZXh0O1xuICAgICAgICBpZiAocmVhY3Rpb25EYXRhLmNvbnRlbnQpIHtcbiAgICAgICAgICAgIHZhciBsb2NhdGlvbiA9IHJlYWN0aW9uRGF0YS5jb250ZW50LmxvY2F0aW9uO1xuICAgICAgICAgICAgaWYgKGxvY2F0aW9uKSB7XG4gICAgICAgICAgICAgICAgUmFuZ2UuaGlnaGxpZ2h0KCRjb250YWluZXJFbGVtZW50LmdldCgwKSwgbG9jYXRpb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBjdXN0b21SZWFjdGlvbkZvY3VzKHJhY3RpdmVFdmVudCkge1xuICAgIHZhciAkZm9vdGVyID0gJChyYWN0aXZlRXZlbnQub3JpZ2luYWwudGFyZ2V0KS5jbG9zZXN0KCcuYW50ZW5uYS1yZWFjdGlvbnMtZm9vdGVyJyk7XG4gICAgJGZvb3Rlci5maW5kKCdpbnB1dCcpLm5vdCgnLmFjdGl2ZScpLnZhbCgnJykuYWRkQ2xhc3MoJ2FjdGl2ZScpO1xuICAgICRmb290ZXIuZmluZCgnYnV0dG9uJykuc2hvdygpO1xufVxuXG5mdW5jdGlvbiBjdXN0b21SZWFjdGlvbkJsdXIocmFjdGl2ZUV2ZW50KSB7XG4gICAgdmFyIGV2ZW50ID0gcmFjdGl2ZUV2ZW50Lm9yaWdpbmFsO1xuICAgIGlmICgkKGV2ZW50LnJlbGF0ZWRUYXJnZXQpLmNsb3Nlc3QoJy5hbnRlbm5hLXJlYWN0aW9ucy1mb290ZXIgYnV0dG9uJykuc2l6ZSgpID09IDApIHsgLy8gRG9uJ3QgaGlkZSB0aGUgaW5wdXQgd2hlbiB3ZSBjbGljayBvbiB0aGUgYnV0dG9uXG4gICAgICAgIHZhciAkZm9vdGVyID0gJChldmVudC50YXJnZXQpLmNsb3Nlc3QoJy5hbnRlbm5hLXJlYWN0aW9ucy1mb290ZXInKTtcbiAgICAgICAgdmFyIGlucHV0ID0gJGZvb3Rlci5maW5kKCdpbnB1dCcpO1xuICAgICAgICBpZiAoaW5wdXQudmFsKCkgPT09ICcnKSB7XG4gICAgICAgICAgICAkZm9vdGVyLmZpbmQoJ2J1dHRvbicpLmhpZGUoKTtcbiAgICAgICAgICAgIHZhciAkaW5wdXQgPSAkZm9vdGVyLmZpbmQoJ2lucHV0Jyk7XG4gICAgICAgICAgICAvLyBSZXNldCB0aGUgaW5wdXQgdmFsdWUgdG8gdGhlIGRlZmF1bHQgaW4gdGhlIGh0bWwvdGVtcGxhdGVcbiAgICAgICAgICAgICRpbnB1dC52YWwoJGlucHV0LmF0dHIoJ3ZhbHVlJykpLnJlbW92ZUNsYXNzKCdhY3RpdmUnKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gY3JlYXRlUmVhY3Rpb25Qcm92aWRlcigpIHtcblxuICAgIHZhciBsb2FkZWRSZWFjdGlvbjtcbiAgICB2YXIgY2FsbGJhY2tzID0gW107XG5cbiAgICBmdW5jdGlvbiBvblJlYWN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgIGNhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKTtcbiAgICAgICAgbm90aWZ5SWZSZWFkeSgpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJlYWN0aW9uTG9hZGVkKHJlYWN0aW9uKSB7XG4gICAgICAgIGxvYWRlZFJlYWN0aW9uID0gcmVhY3Rpb247XG4gICAgICAgIG5vdGlmeUlmUmVhZHkoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBub3RpZnlJZlJlYWR5KCkge1xuICAgICAgICBpZiAobG9hZGVkUmVhY3Rpb24pIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2FsbGJhY2tzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2tzW2ldKGxvYWRlZFJlYWN0aW9uKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhbGxiYWNrcyA9IFtdO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgZ2V0OiBvblJlYWN0aW9uLCAvLyBUT0RPIHRlcm1pbm9sb2d5XG4gICAgICAgIHJlYWN0aW9uTG9hZGVkOiByZWFjdGlvbkxvYWRlZFxuICAgIH1cbn1cblxuZnVuY3Rpb24gY29tYmluZVJlYWN0aW9uRGF0YShyZWFjdGlvbnNEYXRhLCBkZWZhdWx0UmVhY3Rpb25zKSB7XG4gICAgdmFyIGNvbWJpbmVkUmVhY3Rpb25zID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZWFjdGlvbnNEYXRhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbWJpbmVkUmVhY3Rpb25zLnB1c2gocmVhY3Rpb25zRGF0YVtpXSk7XG4gICAgfVxuICAgIGZvciAodmFyIGogPSAwOyBqIDwgZGVmYXVsdFJlYWN0aW9ucy5sZW5ndGg7IGorKykge1xuICAgICAgICB2YXIgZGVmYXVsdFJlYWN0aW9uID0gZGVmYXVsdFJlYWN0aW9uc1tqXTtcbiAgICAgICAgdmFyIGV4aXN0aW5nID0gZmFsc2U7XG4gICAgICAgIGZvciAodmFyIGsgPSAwOyBrIDwgcmVhY3Rpb25zRGF0YS5sZW5ndGg7IGsrKykge1xuICAgICAgICAgICAgaWYgKHJlYWN0aW9uc0RhdGFba10udGV4dCA9PT0gZGVmYXVsdFJlYWN0aW9uLnRleHQpIHtcbiAgICAgICAgICAgICAgICBleGlzdGluZyA9IHRydWU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFleGlzdGluZykge1xuICAgICAgICAgICAgY29tYmluZWRSZWFjdGlvbnMucHVzaChkZWZhdWx0UmVhY3Rpb24pO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBjb21iaW5lZFJlYWN0aW9ucztcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZTogY3JlYXRlUGFnZVxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi91dGlscy9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciBBamF4Q2xpZW50ID0gcmVxdWlyZSgnLi91dGlscy9hamF4LWNsaWVudCcpO1xudmFyIEJyb3dzZXJNZXRyaWNzID0gcmVxdWlyZSgnLi91dGlscy9icm93c2VyLW1ldHJpY3MnKTtcbnZhciBKU09OVXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzL2pzb24tdXRpbHMnKTtcbnZhciBNZXNzYWdlcyA9IHJlcXVpcmUoJy4vdXRpbHMvbWVzc2FnZXMnKTtcbnZhciBNb3ZlYWJsZSA9IHJlcXVpcmUoJy4vdXRpbHMvbW92ZWFibGUnKTtcbnZhciBSYWN0aXZlOyByZXF1aXJlKCcuL3V0aWxzL3JhY3RpdmUtcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24obG9hZGVkUmFjdGl2ZSkgeyBSYWN0aXZlID0gbG9hZGVkUmFjdGl2ZTt9KTtcbnZhciBSYW5nZSA9IHJlcXVpcmUoJy4vdXRpbHMvcmFuZ2UnKTtcbnZhciBUb3VjaFN1cHBvcnQgPSByZXF1aXJlKCcuL3V0aWxzL3RvdWNoLXN1cHBvcnQnKTtcbnZhciBUcmFuc2l0aW9uVXRpbCA9IHJlcXVpcmUoJy4vdXRpbHMvdHJhbnNpdGlvbi11dGlsJyk7XG52YXIgVXNlciA9IHJlcXVpcmUoJy4vdXRpbHMvdXNlcicpO1xudmFyIFdpZGdldEJ1Y2tldCA9IHJlcXVpcmUoJy4vdXRpbHMvd2lkZ2V0LWJ1Y2tldCcpO1xuXG52YXIgQmxvY2tlZFJlYWN0aW9uUGFnZSA9IHJlcXVpcmUoJy4vYmxvY2tlZC1yZWFjdGlvbi1wYWdlJyk7XG52YXIgQ29uZmlybWF0aW9uUGFnZSA9IHJlcXVpcmUoJy4vY29uZmlybWF0aW9uLXBhZ2UnKTtcbnZhciBFdmVudHMgPSByZXF1aXJlKCcuL2V2ZW50cycpO1xudmFyIEdlbmVyaWNFcnJvclBhZ2UgPSByZXF1aXJlKCcuL2dlbmVyaWMtZXJyb3ItcGFnZScpO1xudmFyIExvY2F0aW9uc1BhZ2UgPSByZXF1aXJlKCcuL2xvY2F0aW9ucy1wYWdlJyk7XG52YXIgTG9naW5QYWdlID0gcmVxdWlyZSgnLi9sb2dpbi1wYWdlJyk7XG52YXIgUGFnZURhdGEgPSByZXF1aXJlKCcuL3BhZ2UtZGF0YScpO1xudmFyIFBlbmRpbmdSZWFjdGlvblBhZ2UgPSByZXF1aXJlKCcuL3BlbmRpbmctcmVhY3Rpb24tcGFnZScpO1xudmFyIFJlYWN0aW9uc1BhZ2UgPSByZXF1aXJlKCcuL3JlYWN0aW9ucy1wYWdlJyk7XG52YXIgU1ZHcyA9IHJlcXVpcmUoJy4vc3ZncycpO1xuXG52YXIgU0VMRUNUT1JfUkVBQ1RJT05TX1dJREdFVCA9ICcuYW50ZW5uYS1yZWFjdGlvbnMtd2lkZ2V0JztcblxudmFyIG9wZW5JbnN0YW5jZXMgPSBbXTtcblxuZnVuY3Rpb24gb3BlblJlYWN0aW9uc1dpZGdldChvcHRpb25zLCBlbGVtZW50T3JDb29yZHMpIHtcbiAgICBjbG9zZUFsbFdpbmRvd3MoKTtcbiAgICB2YXIgZGVmYXVsdFJlYWN0aW9ucyA9IG9wdGlvbnMuZGVmYXVsdFJlYWN0aW9ucztcbiAgICB2YXIgcmVhY3Rpb25zRGF0YSA9IG9wdGlvbnMucmVhY3Rpb25zRGF0YTtcbiAgICB2YXIgY29udGFpbmVyRGF0YSA9IG9wdGlvbnMuY29udGFpbmVyRGF0YTtcbiAgICB2YXIgY29udGFpbmVyRWxlbWVudCA9IG9wdGlvbnMuY29udGFpbmVyRWxlbWVudDsgLy8gb3B0aW9uYWxcbiAgICB2YXIgaXNTdW1tYXJ5ID0gb3B0aW9ucy5pc1N1bW1hcnkgPT09IHVuZGVmaW5lZCA/IGZhbHNlIDogb3B0aW9ucy5pc1N1bW1hcnk7IC8vIG9wdGlvbmFsXG4gICAgLy8gY29udGVudERhdGEgY29udGFpbnMgZGV0YWlscyBhYm91dCB0aGUgY29udGVudCBiZWluZyByZWFjdGVkIHRvIGxpa2UgdGV4dCByYW5nZSBvciBpbWFnZSBoZWlnaHQvd2lkdGguXG4gICAgLy8gd2UgcG90ZW50aWFsbHkgbW9kaWZ5IHRoaXMgZGF0YSAoZS5nLiBpbiB0aGUgZGVmYXVsdCByZWFjdGlvbiBjYXNlIHdlIHNlbGVjdCB0aGUgdGV4dCBvdXJzZWx2ZXMpIHNvIHdlXG4gICAgLy8gbWFrZSBhIGxvY2FsIGNvcHkgb2YgaXQgdG8gYXZvaWQgdW5leHBlY3RlZGx5IGNoYW5naW5nIGRhdGEgb3V0IGZyb20gdW5kZXIgb25lIG9mIHRoZSBjbGllbnRzXG4gICAgdmFyIGNvbnRlbnREYXRhID0gSlNPTi5wYXJzZShKU09OVXRpbHMuc3RyaW5naWZ5KG9wdGlvbnMuY29udGVudERhdGEpKTtcbiAgICB2YXIgcGFnZURhdGEgPSBvcHRpb25zLnBhZ2VEYXRhO1xuICAgIHZhciBncm91cFNldHRpbmdzID0gb3B0aW9ucy5ncm91cFNldHRpbmdzO1xuICAgIHZhciByYWN0aXZlID0gUmFjdGl2ZSh7XG4gICAgICAgIGVsOiBXaWRnZXRCdWNrZXQuZ2V0KCksXG4gICAgICAgIGFwcGVuZDogdHJ1ZSxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgc3VwcG9ydHNUb3VjaDogQnJvd3Nlck1ldHJpY3Muc3VwcG9ydHNUb3VjaCgpXG4gICAgICAgIH0sXG4gICAgICAgIHRlbXBsYXRlOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvcmVhY3Rpb25zLXdpZGdldC5oYnMuaHRtbCcpLFxuICAgICAgICBwYXJ0aWFsczoge1xuICAgICAgICAgICAgbG9nbzogU1ZHcy5sb2dvXG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIHJhY3RpdmUub24oJ2Nsb3NlJywgY2xvc2VBbGxXaW5kb3dzKTtcbiAgICB2YXIgJHJvb3RFbGVtZW50ID0gJChyb290RWxlbWVudChyYWN0aXZlKSk7XG4gICAgTW92ZWFibGUubWFrZU1vdmVhYmxlKCRyb290RWxlbWVudCwgJHJvb3RFbGVtZW50LmZpbmQoJy5hbnRlbm5hLWhlYWRlcicpKTtcbiAgICB2YXIgcGFnZXMgPSBbXTtcblxuICAgIG9wZW5XaW5kb3coKTtcblxuICAgIGZ1bmN0aW9uIG9wZW5XaW5kb3coKSB7XG4gICAgICAgIFBhZ2VEYXRhLmNsZWFySW5kaWNhdG9yTGltaXQocGFnZURhdGEpO1xuICAgICAgICB2YXIgY29vcmRzO1xuICAgICAgICBpZiAoZWxlbWVudE9yQ29vcmRzLnRvcCAmJiBlbGVtZW50T3JDb29yZHMubGVmdCkge1xuICAgICAgICAgICAgY29vcmRzID0gZWxlbWVudE9yQ29vcmRzO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyICRyZWxhdGl2ZUVsZW1lbnQgPSAkKGVsZW1lbnRPckNvb3Jkcyk7XG4gICAgICAgICAgICB2YXIgb2Zmc2V0ID0gJHJlbGF0aXZlRWxlbWVudC5vZmZzZXQoKTtcbiAgICAgICAgICAgIHZhciBib2R5T2Zmc2V0ID0gJCgnYm9keScpLm9mZnNldCgpOyAvLyBhY2NvdW50IGZvciBhbnkgb2Zmc2V0IHRoYXQgc2l0ZXMgYXBwbHkgdG8gdGhlIGVudGlyZSBib2R5XG4gICAgICAgICAgICBjb29yZHMgPSB7XG4gICAgICAgICAgICAgICAgdG9wOiBvZmZzZXQudG9wIC0gYm9keU9mZnNldC50b3AsXG4gICAgICAgICAgICAgICAgbGVmdDogb2Zmc2V0LmxlZnQgLSBib2R5T2Zmc2V0LmxlZnRcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGhvcml6b250YWxPdmVyZmxvdyA9IGNvb3Jkcy5sZWZ0ICsgJHJvb3RFbGVtZW50LndpZHRoKCkgLSBNYXRoLm1heChkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50V2lkdGgsIHdpbmRvdy5pbm5lcldpZHRoIHx8IDApOyAvLyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzEyNDgwODEvZ2V0LXRoZS1icm93c2VyLXZpZXdwb3J0LWRpbWVuc2lvbnMtd2l0aC1qYXZhc2NyaXB0Lzg4NzYwNjkjODg3NjA2OVxuICAgICAgICBpZiAoaG9yaXpvbnRhbE92ZXJmbG93ID4gMCkge1xuICAgICAgICAgICAgY29vcmRzLmxlZnQgPSBjb29yZHMubGVmdCAtIGhvcml6b250YWxPdmVyZmxvdztcbiAgICAgICAgfVxuICAgICAgICAkcm9vdEVsZW1lbnQuc3RvcCh0cnVlLCB0cnVlKS5hZGRDbGFzcygnYW50ZW5uYS1yZWFjdGlvbnMtb3BlbicpLmNzcyhjb29yZHMpO1xuXG4gICAgICAgIHNob3dSZWFjdGlvbnMoZmFsc2UpO1xuICAgICAgICBpZiAoaXNTdW1tYXJ5KSB7XG4gICAgICAgICAgICBFdmVudHMucG9zdFN1bW1hcnlPcGVuZWQocGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgRXZlbnRzLnBvc3RSZWFjdGlvbldpZGdldE9wZW5lZChwYWdlRGF0YSwgY29udGFpbmVyRGF0YSwgY29udGVudERhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICB9XG5cbiAgICAgICAgc2V0dXBXaW5kb3dDbG9zZShwYWdlcywgcmFjdGl2ZSk7XG4gICAgICAgIHByZXZlbnRFeHRyYVNjcm9sbCgkcm9vdEVsZW1lbnQpO1xuICAgICAgICBvcGVuSW5zdGFuY2VzLnB1c2gocmFjdGl2ZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2hvd1JlYWN0aW9ucyhhbmltYXRlKSB7XG4gICAgICAgIGlmIChjb250YWluZXJFbGVtZW50ICYmICFjb250ZW50RGF0YS5sb2NhdGlvbiAmJiAhY29udGVudERhdGEuYm9keSkge1xuICAgICAgICAgICAgUmFuZ2UuZ3JhYk5vZGUoY29udGFpbmVyRWxlbWVudC5nZXQoMCksIGZ1bmN0aW9uICh0ZXh0LCBsb2NhdGlvbikge1xuICAgICAgICAgICAgICAgIGNvbnRlbnREYXRhLmxvY2F0aW9uID0gbG9jYXRpb247XG4gICAgICAgICAgICAgICAgY29udGVudERhdGEuYm9keSA9IHRleHQ7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgb3B0aW9ucyA9IHtcbiAgICAgICAgICAgIGlzU3VtbWFyeTogaXNTdW1tYXJ5LFxuICAgICAgICAgICAgcmVhY3Rpb25zRGF0YTogcmVhY3Rpb25zRGF0YSxcbiAgICAgICAgICAgIGRlZmF1bHRSZWFjdGlvbnM6IGRlZmF1bHRSZWFjdGlvbnMsXG4gICAgICAgICAgICBwYWdlRGF0YTogcGFnZURhdGEsXG4gICAgICAgICAgICBncm91cFNldHRpbmdzOiBncm91cFNldHRpbmdzLFxuICAgICAgICAgICAgY29udGFpbmVyRGF0YTogY29udGFpbmVyRGF0YSxcbiAgICAgICAgICAgIGNvbnRlbnREYXRhOiBjb250ZW50RGF0YSxcbiAgICAgICAgICAgIGNvbnRhaW5lckVsZW1lbnQ6IGNvbnRhaW5lckVsZW1lbnQsXG4gICAgICAgICAgICBzaG93Q29uZmlybWF0aW9uOiBzaG93Q29uZmlybWF0aW9uLFxuICAgICAgICAgICAgc2hvd1BlbmRpbmdBcHByb3ZhbDogc2hvd1BlbmRpbmdBcHByb3ZhbCxcbiAgICAgICAgICAgIHNob3dQcm9ncmVzczogc2hvd1Byb2dyZXNzUGFnZSxcbiAgICAgICAgICAgIHNob3dMb2NhdGlvbnM6IHNob3dMb2NhdGlvbnMsXG4gICAgICAgICAgICBoYW5kbGVSZWFjdGlvbkVycm9yOiBoYW5kbGVSZWFjdGlvbkVycm9yLFxuICAgICAgICAgICAgZWxlbWVudDogcGFnZUNvbnRhaW5lcihyYWN0aXZlKSxcbiAgICAgICAgICAgIHJlYWN0aW9uc1dpbmRvdzogJHJvb3RFbGVtZW50XG4gICAgICAgIH07XG4gICAgICAgIHZhciBwYWdlID0gUmVhY3Rpb25zUGFnZS5jcmVhdGUob3B0aW9ucyk7XG4gICAgICAgIHBhZ2VzLnB1c2gocGFnZSk7XG4gICAgICAgIHNob3dQYWdlKHBhZ2Uuc2VsZWN0b3IsICRyb290RWxlbWVudCwgYW5pbWF0ZSwgZmFsc2UpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNob3dDb25maXJtYXRpb24ocmVhY3Rpb25EYXRhLCByZWFjdGlvblByb3ZpZGVyKSB7XG4gICAgICAgIHNldFdpbmRvd1RpdGxlKE1lc3NhZ2VzLmdldE1lc3NhZ2UoJ3JlYWN0aW9uc193aWRnZXRfX3RpdGxlX3RoYW5rcycpKTtcbiAgICAgICAgdmFyIHBhZ2UgPSBDb25maXJtYXRpb25QYWdlLmNyZWF0ZShyZWFjdGlvbkRhdGEudGV4dCwgcmVhY3Rpb25Qcm92aWRlciwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MsIHBhZ2VDb250YWluZXIocmFjdGl2ZSkpO1xuICAgICAgICBwYWdlcy5wdXNoKHBhZ2UpO1xuICAgICAgICAvLyBUT0RPOiByZXZpc2l0IHdoeSB3ZSBuZWVkIHRvIHVzZSB0aGUgdGltZW91dCB0cmljayBmb3IgdGhlIGNvbmZpcm0gcGFnZSwgYnV0IG5vdCBmb3IgdGhlIGRlZmF1bHRzIHBhZ2VcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHsgLy8gSW4gb3JkZXIgZm9yIHRoZSBwb3NpdGlvbmluZyBhbmltYXRpb24gdG8gd29yaywgd2UgbmVlZCB0byBsZXQgdGhlIGJyb3dzZXIgcmVuZGVyIHRoZSBhcHBlbmRlZCBET00gZWxlbWVudFxuICAgICAgICAgICAgc2hvd1BhZ2UocGFnZS5zZWxlY3RvciwgJHJvb3RFbGVtZW50LCB0cnVlKTtcbiAgICAgICAgfSwgMSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2hvd1BlbmRpbmdBcHByb3ZhbChyZWFjdGlvbikge1xuICAgICAgICBzZXRXaW5kb3dUaXRsZShNZXNzYWdlcy5nZXRNZXNzYWdlKCdyZWFjdGlvbnNfd2lkZ2V0X190aXRsZV90aGFua3MnKSk7XG4gICAgICAgIHZhciBwYWdlID0gUGVuZGluZ1JlYWN0aW9uUGFnZS5jcmVhdGVQYWdlKHJlYWN0aW9uLnRleHQsIHBhZ2VDb250YWluZXIocmFjdGl2ZSkpO1xuICAgICAgICBwYWdlcy5wdXNoKHBhZ2UpO1xuICAgICAgICAvLyBUT0RPOiByZXZpc2l0IHdoeSB3ZSBuZWVkIHRvIHVzZSB0aGUgdGltZW91dCB0cmljayBmb3IgdGhlIGNvbmZpcm0gcGFnZSwgYnV0IG5vdCBmb3IgdGhlIGRlZmF1bHRzIHBhZ2VcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHsgLy8gSW4gb3JkZXIgZm9yIHRoZSBwb3NpdGlvbmluZyBhbmltYXRpb24gdG8gd29yaywgd2UgbmVlZCB0byBsZXQgdGhlIGJyb3dzZXIgcmVuZGVyIHRoZSBhcHBlbmRlZCBET00gZWxlbWVudFxuICAgICAgICAgICAgc2hvd1BhZ2UocGFnZS5zZWxlY3RvciwgJHJvb3RFbGVtZW50LCB0cnVlKTtcbiAgICAgICAgfSwgMSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2hvd1Byb2dyZXNzUGFnZSgpIHtcbiAgICAgICAgc2hvd1BhZ2UoJy5hbnRlbm5hLXByb2dyZXNzLXBhZ2UnLCAkcm9vdEVsZW1lbnQsIGZhbHNlLCB0cnVlKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzaG93TG9jYXRpb25zKHJlYWN0aW9uLCBiYWNrUGFnZVNlbGVjdG9yKSB7XG4gICAgICAgIHNob3dQcm9ncmVzc1BhZ2UoKTsgLy8gVE9ETzogcHJvdmlkZSBzb21lIHdheSBmb3IgdGhlIHVzZXIgdG8gZ2l2ZSB1cCAvIGNhbmNlbC5cbiAgICAgICAgdmFyIHJlYWN0aW9uTG9jYXRpb25EYXRhID0gUGFnZURhdGEuZ2V0UmVhY3Rpb25Mb2NhdGlvbkRhdGEocmVhY3Rpb24sIHBhZ2VEYXRhKTtcbiAgICAgICAgdmFyIHN1Y2Nlc3MgPSBmdW5jdGlvbihsb2NhdGlvbkRldGFpbHMpIHtcbiAgICAgICAgICAgIFBhZ2VEYXRhLnVwZGF0ZVJlYWN0aW9uTG9jYXRpb25EYXRhKHJlYWN0aW9uTG9jYXRpb25EYXRhLCBsb2NhdGlvbkRldGFpbHMpO1xuICAgICAgICAgICAgdmFyIG9wdGlvbnMgPSB7IC8vIFRPRE86IGNsZWFuIHVwIHRoZSBudW1iZXIgb2YgdGhlc2UgXCJvcHRpb25zXCIgb2JqZWN0cyB0aGF0IHdlIGNyZWF0ZS5cbiAgICAgICAgICAgICAgICBlbGVtZW50OiBwYWdlQ29udGFpbmVyKHJhY3RpdmUpLFxuICAgICAgICAgICAgICAgIHJlYWN0aW9uTG9jYXRpb25EYXRhOiByZWFjdGlvbkxvY2F0aW9uRGF0YSxcbiAgICAgICAgICAgICAgICBwYWdlRGF0YTogcGFnZURhdGEsXG4gICAgICAgICAgICAgICAgZ3JvdXBTZXR0aW5nczogZ3JvdXBTZXR0aW5ncyxcbiAgICAgICAgICAgICAgICBjbG9zZVdpbmRvdzogY2xvc2VBbGxXaW5kb3dzLFxuICAgICAgICAgICAgICAgIGdvQmFjazogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHNldFdpbmRvd1RpdGxlKE1lc3NhZ2VzLmdldE1lc3NhZ2UoJ3JlYWN0aW9uc193aWRnZXRfX3RpdGxlJykpO1xuICAgICAgICAgICAgICAgICAgICBnb0JhY2tUb1BhZ2UocGFnZXMsIGJhY2tQYWdlU2VsZWN0b3IsICRyb290RWxlbWVudCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHZhciBwYWdlID0gTG9jYXRpb25zUGFnZS5jcmVhdGUob3B0aW9ucyk7XG4gICAgICAgICAgICBwYWdlcy5wdXNoKHBhZ2UpO1xuICAgICAgICAgICAgc2V0V2luZG93VGl0bGUocmVhY3Rpb24udGV4dCk7XG4gICAgICAgICAgICAvLyBUT0RPOiByZXZpc2l0XG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyAvLyBJbiBvcmRlciBmb3IgdGhlIHBvc2l0aW9uaW5nIGFuaW1hdGlvbiB0byB3b3JrLCB3ZSBuZWVkIHRvIGxldCB0aGUgYnJvd3NlciByZW5kZXIgdGhlIGFwcGVuZGVkIERPTSBlbGVtZW50XG4gICAgICAgICAgICAgICAgc2hvd1BhZ2UocGFnZS5zZWxlY3RvciwgJHJvb3RFbGVtZW50LCB0cnVlKTtcbiAgICAgICAgICAgIH0sIDEpO1xuICAgICAgICAgICAgRXZlbnRzLnBvc3RMb2NhdGlvbnNWaWV3ZWQocGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgZXJyb3IgPSBmdW5jdGlvbihtZXNzYWdlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnQW4gZXJyb3Igb2NjdXJyZWQgZmV0Y2hpbmcgY29udGVudCBib2RpZXM6ICcgKyBtZXNzYWdlKTtcbiAgICAgICAgICAgIHNob3dHZW5lcmljRXJyb3JQYWdlKGJhY2tQYWdlU2VsZWN0b3IpO1xuICAgICAgICB9O1xuICAgICAgICBBamF4Q2xpZW50LmZldGNoTG9jYXRpb25EZXRhaWxzKHJlYWN0aW9uTG9jYXRpb25EYXRhLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncywgc3VjY2VzcywgZXJyb3IpO1xuICAgIH1cblxuICAgIC8vIFNob3dzIHRoZSBsb2dpbiBwYWdlLCB3aXRoIGEgcHJvbXB0IHRvIGdvIEJhY2sgdG8gdGhlIHBhZ2Ugc3BlY2lmaWVkIGJ5IHRoZSBnaXZlbiBwYWdlIHNlbGVjdG9yLlxuICAgIGZ1bmN0aW9uIHNob3dMb2dpblBhZ2UoYmFja1BhZ2VTZWxlY3RvciwgcmV0cnlDYWxsYmFjaykge1xuICAgICAgICBzZXRXaW5kb3dUaXRsZShNZXNzYWdlcy5nZXRNZXNzYWdlKCdyZWFjdGlvbnNfd2lkZ2V0X190aXRsZV9zaWduaW4nKSk7XG4gICAgICAgIHZhciBvcHRpb25zID0ge1xuICAgICAgICAgICAgZWxlbWVudDogcGFnZUNvbnRhaW5lcihyYWN0aXZlKSxcbiAgICAgICAgICAgIGdyb3VwU2V0dGluZ3M6IGdyb3VwU2V0dGluZ3MsXG4gICAgICAgICAgICBnb0JhY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHNldFdpbmRvd1RpdGxlKE1lc3NhZ2VzLmdldE1lc3NhZ2UoJ3JlYWN0aW9uc193aWRnZXRfX3RpdGxlJykpO1xuICAgICAgICAgICAgICAgIGdvQmFja1RvUGFnZShwYWdlcywgYmFja1BhZ2VTZWxlY3RvciwgJHJvb3RFbGVtZW50KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZXRyeTogcmV0cnlDYWxsYmFja1xuICAgICAgICB9O1xuICAgICAgICB2YXIgcGFnZSA9IExvZ2luUGFnZS5jcmVhdGVQYWdlKG9wdGlvbnMpO1xuICAgICAgICBwYWdlcy5wdXNoKHBhZ2UpO1xuXG4gICAgICAgIC8vIFRPRE86IHJldmlzaXQgd2h5IHdlIG5lZWQgdG8gdXNlIHRoZSB0aW1lb3V0IHRyaWNrIGZvciB0aGUgY29uZmlybSBwYWdlLCBidXQgbm90IGZvciB0aGUgZGVmYXVsdHMgcGFnZVxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyAvLyBJbiBvcmRlciBmb3IgdGhlIHBvc2l0aW9uaW5nIGFuaW1hdGlvbiB0byB3b3JrLCB3ZSBuZWVkIHRvIGxldCB0aGUgYnJvd3NlciByZW5kZXIgdGhlIGFwcGVuZGVkIERPTSBlbGVtZW50XG4gICAgICAgICAgICBzaG93UGFnZShwYWdlLnNlbGVjdG9yLCAkcm9vdEVsZW1lbnQsIHRydWUpO1xuICAgICAgICB9LCAxKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzaG93QmxvY2tlZFJlYWN0aW9uUGFnZShiYWNrUGFnZVNlbGVjdG9yKSB7XG4gICAgICAgIHNldFdpbmRvd1RpdGxlKE1lc3NhZ2VzLmdldE1lc3NhZ2UoJ3JlYWN0aW9uc193aWRnZXRfX3RpdGxlX2Jsb2NrZWQnKSk7XG4gICAgICAgIHZhciBvcHRpb25zID0ge1xuICAgICAgICAgICAgZWxlbWVudDogcGFnZUNvbnRhaW5lcihyYWN0aXZlKSxcbiAgICAgICAgICAgIGdyb3VwU2V0dGluZ3M6IGdyb3VwU2V0dGluZ3MsXG4gICAgICAgICAgICBnb0JhY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHNldFdpbmRvd1RpdGxlKE1lc3NhZ2VzLmdldE1lc3NhZ2UoJ3JlYWN0aW9uc193aWRnZXRfX3RpdGxlJykpO1xuICAgICAgICAgICAgICAgIGdvQmFja1RvUGFnZShwYWdlcywgYmFja1BhZ2VTZWxlY3RvciwgJHJvb3RFbGVtZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgdmFyIHBhZ2UgPSBCbG9ja2VkUmVhY3Rpb25QYWdlLmNyZWF0ZVBhZ2Uob3B0aW9ucyk7XG4gICAgICAgIHBhZ2VzLnB1c2gocGFnZSk7XG5cbiAgICAgICAgLy8gVE9ETzogcmV2aXNpdCB3aHkgd2UgbmVlZCB0byB1c2UgdGhlIHRpbWVvdXQgdHJpY2sgZm9yIHRoZSBjb25maXJtIHBhZ2UsIGJ1dCBub3QgZm9yIHRoZSBkZWZhdWx0cyBwYWdlXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IC8vIEluIG9yZGVyIGZvciB0aGUgcG9zaXRpb25pbmcgYW5pbWF0aW9uIHRvIHdvcmssIHdlIG5lZWQgdG8gbGV0IHRoZSBicm93c2VyIHJlbmRlciB0aGUgYXBwZW5kZWQgRE9NIGVsZW1lbnRcbiAgICAgICAgICAgIHNob3dQYWdlKHBhZ2Uuc2VsZWN0b3IsICRyb290RWxlbWVudCwgdHJ1ZSk7XG4gICAgICAgIH0sIDEpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNob3dHZW5lcmljRXJyb3JQYWdlKGJhY2tQYWdlU2VsZWN0b3IpIHtcbiAgICAgICAgc2V0V2luZG93VGl0bGUoTWVzc2FnZXMuZ2V0TWVzc2FnZSgncmVhY3Rpb25zX3dpZGdldF9fdGl0bGVfZXJyb3InKSk7XG4gICAgICAgIHZhciBvcHRpb25zID0ge1xuICAgICAgICAgICAgZWxlbWVudDogcGFnZUNvbnRhaW5lcihyYWN0aXZlKSxcbiAgICAgICAgICAgIGdvQmFjazogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgc2V0V2luZG93VGl0bGUoTWVzc2FnZXMuZ2V0TWVzc2FnZSgncmVhY3Rpb25zX3dpZGdldF9fdGl0bGUnKSk7XG4gICAgICAgICAgICAgICAgZ29CYWNrVG9QYWdlKHBhZ2VzLCBiYWNrUGFnZVNlbGVjdG9yLCAkcm9vdEVsZW1lbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICB2YXIgcGFnZSA9IEdlbmVyaWNFcnJvclBhZ2UuY3JlYXRlUGFnZShvcHRpb25zKTtcbiAgICAgICAgcGFnZXMucHVzaChwYWdlKTtcblxuICAgICAgICAvLyBUT0RPOiByZXZpc2l0IHdoeSB3ZSBuZWVkIHRvIHVzZSB0aGUgdGltZW91dCB0cmljayBmb3IgdGhlIGNvbmZpcm0gcGFnZSwgYnV0IG5vdCBmb3IgdGhlIGRlZmF1bHRzIHBhZ2VcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHsgLy8gSW4gb3JkZXIgZm9yIHRoZSBwb3NpdGlvbmluZyBhbmltYXRpb24gdG8gd29yaywgd2UgbmVlZCB0byBsZXQgdGhlIGJyb3dzZXIgcmVuZGVyIHRoZSBhcHBlbmRlZCBET00gZWxlbWVudFxuICAgICAgICAgICAgc2hvd1BhZ2UocGFnZS5zZWxlY3RvciwgJHJvb3RFbGVtZW50LCB0cnVlKTtcbiAgICAgICAgfSwgMSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaGFuZGxlUmVhY3Rpb25FcnJvcihtZXNzYWdlLCByZXRyeUNhbGxiYWNrLCBiYWNrUGFnZVNlbGVjdG9yKSB7XG4gICAgICAgIGlmIChtZXNzYWdlLmluZGV4T2YoJ3NpZ24gaW4gcmVxdWlyZWQgZm9yIG9yZ2FuaWMgcmVhY3Rpb25zJykgIT09IC0xKSB7XG4gICAgICAgICAgICBzaG93TG9naW5QYWdlKGJhY2tQYWdlU2VsZWN0b3IsIHJldHJ5Q2FsbGJhY2spO1xuICAgICAgICB9IGVsc2UgaWYgKG1lc3NhZ2UuaW5kZXhPZignR3JvdXAgaGFzIGJsb2NrZWQgdGhpcyB0YWcuJykgIT09IC0xKSB7XG4gICAgICAgICAgICBzaG93QmxvY2tlZFJlYWN0aW9uUGFnZShiYWNrUGFnZVNlbGVjdG9yKTtcbiAgICAgICAgfSBlbHNlIGlmIChpc1Rva2VuRXJyb3IobWVzc2FnZSkpIHtcbiAgICAgICAgICAgIFVzZXIucmVBdXRob3JpemVVc2VyKGZ1bmN0aW9uKGhhc05ld1Rva2VuKSB7XG4gICAgICAgICAgICAgICAgaWYgKGhhc05ld1Rva2VuKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHJ5Q2FsbGJhY2soKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBzaG93TG9naW5QYWdlKGJhY2tQYWdlU2VsZWN0b3IsIHJldHJ5Q2FsbGJhY2spO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJlcnJvciBwb3N0aW5nIHJlYWN0aW9uOiBcIiArIG1lc3NhZ2UpO1xuICAgICAgICAgICAgc2hvd0dlbmVyaWNFcnJvclBhZ2UoYmFja1BhZ2VTZWxlY3Rvcik7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBpc1Rva2VuRXJyb3IobWVzc2FnZSkge1xuICAgICAgICAgICAgc3dpdGNoKG1lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgICBjYXNlIFwiVG9rZW4gd2FzIGludmFsaWRcIjpcbiAgICAgICAgICAgICAgICBjYXNlIFwiRmFjZWJvb2sgdG9rZW4gZXhwaXJlZFwiOlxuICAgICAgICAgICAgICAgIGNhc2UgXCJGQiBncmFwaCBlcnJvciAtIHRva2VuIGludmFsaWRcIjpcbiAgICAgICAgICAgICAgICBjYXNlIFwiU29jaWFsIEF1dGggZG9lcyBub3QgZXhpc3QgZm9yIHVzZXJcIjpcbiAgICAgICAgICAgICAgICBjYXNlIFwiRGF0YSB0byBjcmVhdGUgdG9rZW4gaXMgbWlzc2luZ1wiOlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNldFdpbmRvd1RpdGxlKHRpdGxlKSB7XG4gICAgICAgICQocmFjdGl2ZS5maW5kKCcuYW50ZW5uYS1yZWFjdGlvbnMtdGl0bGUnKSkuaHRtbCh0aXRsZSk7XG4gICAgfVxuXG59XG5cbmZ1bmN0aW9uIHJvb3RFbGVtZW50KHJhY3RpdmUpIHtcbiAgICByZXR1cm4gcmFjdGl2ZS5maW5kKFNFTEVDVE9SX1JFQUNUSU9OU19XSURHRVQpO1xufVxuXG5mdW5jdGlvbiBwYWdlQ29udGFpbmVyKHJhY3RpdmUpIHtcbiAgICByZXR1cm4gcmFjdGl2ZS5maW5kKCcuYW50ZW5uYS1wYWdlLWNvbnRhaW5lcicpO1xufVxuXG52YXIgcGFnZVogPSAxMDAwOyAvLyBJdCdzIHNhZmUgZm9yIHRoaXMgdmFsdWUgdG8gZ28gYWNyb3NzIGluc3RhbmNlcy4gV2UganVzdCBuZWVkIGl0IHRvIGNvbnRpbnVvdXNseSBpbmNyZWFzZSAobWF4IHZhbHVlIGlzIG92ZXIgMiBiaWxsaW9uKS5cblxuZnVuY3Rpb24gc2hvd1BhZ2UocGFnZVNlbGVjdG9yLCAkcm9vdEVsZW1lbnQsIGFuaW1hdGUsIG92ZXJsYXkpIHtcbiAgICB2YXIgJHBhZ2UgPSAkcm9vdEVsZW1lbnQuZmluZChwYWdlU2VsZWN0b3IpO1xuICAgICRwYWdlLmNzcygnei1pbmRleCcsIHBhZ2VaKTtcbiAgICBwYWdlWiArPSAxO1xuXG4gICAgJHBhZ2UudG9nZ2xlQ2xhc3MoJ2FudGVubmEtcGFnZS1hbmltYXRlJywgYW5pbWF0ZSk7XG5cbiAgICB2YXIgJGN1cnJlbnQgPSAkcm9vdEVsZW1lbnQuZmluZCgnLmFudGVubmEtcGFnZS1hY3RpdmUnKS5ub3QocGFnZVNlbGVjdG9yKTtcbiAgICBpZiAob3ZlcmxheSkge1xuICAgICAgICAvLyBJbiB0aGUgb3ZlcmxheSBjYXNlLCBzaXplIHRoZSBwYWdlIHRvIG1hdGNoIHdoYXRldmVyIHBhZ2UgaXMgY3VycmVudGx5IHNob3dpbmcgYW5kIHRoZW4gbWFrZSBpdCBhY3RpdmUgKHRoZXJlIHdpbGwgYmUgdHdvICdhY3RpdmUnIHBhZ2VzKVxuICAgICAgICAkcGFnZS5oZWlnaHQoJGN1cnJlbnQuaGVpZ2h0KCkpO1xuICAgICAgICAkcGFnZS5hZGRDbGFzcygnYW50ZW5uYS1wYWdlLWFjdGl2ZScpO1xuICAgIH0gZWxzZSBpZiAoYW5pbWF0ZSkge1xuICAgICAgICBUcmFuc2l0aW9uVXRpbC50b2dnbGVDbGFzcygkcGFnZSwgJ2FudGVubmEtcGFnZS1hY3RpdmUnLCB0cnVlLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIEFmdGVyIHRoZSBuZXcgcGFnZSBzbGlkZXMgaW50byBwb3NpdGlvbiwgbW92ZSB0aGUgb3RoZXIgcGFnZXMgYmFjayBvdXQgb2YgdGhlIHZpZXdhYmxlIGFyZWFcbiAgICAgICAgICAgICRjdXJyZW50LnJlbW92ZUNsYXNzKCdhbnRlbm5hLXBhZ2UtYWN0aXZlJyk7XG4gICAgICAgICAgICAkcGFnZS5mb2N1cygpO1xuICAgICAgICB9KTtcbiAgICAgICAgc2l6ZUJvZHlUb0ZpdCgkcm9vdEVsZW1lbnQsICRwYWdlLCBhbmltYXRlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAkcGFnZS5hZGRDbGFzcygnYW50ZW5uYS1wYWdlLWFjdGl2ZScpO1xuICAgICAgICAkY3VycmVudC5yZW1vdmVDbGFzcygnYW50ZW5uYS1wYWdlLWFjdGl2ZScpO1xuICAgICAgICAkcGFnZS5mb2N1cygpO1xuICAgICAgICBzaXplQm9keVRvRml0KCRyb290RWxlbWVudCwgJHBhZ2UsIGFuaW1hdGUpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZ29CYWNrVG9QYWdlKHBhZ2VzLCBwYWdlU2VsZWN0b3IsICRyb290RWxlbWVudCkge1xuICAgIHZhciAkdGFyZ2V0UGFnZSA9ICRyb290RWxlbWVudC5maW5kKHBhZ2VTZWxlY3Rvcik7XG4gICAgdmFyICRjdXJyZW50UGFnZSA9ICRyb290RWxlbWVudC5maW5kKCcuYW50ZW5uYS1wYWdlLWFjdGl2ZScpO1xuICAgIC8vIE1vdmUgdGhlIHRhcmdldCBwYWdlIGludG8gcGxhY2UsIHVuZGVyIHRoZSBjdXJyZW50IHBhZ2VcbiAgICAkdGFyZ2V0UGFnZS5jc3MoJ3otaW5kZXgnLCBwYXJzZUludCgkY3VycmVudFBhZ2UuY3NzKCd6LWluZGV4JykpIC0gMSk7XG4gICAgJHRhcmdldFBhZ2UudG9nZ2xlQ2xhc3MoJ2FudGVubmEtcGFnZS1hbmltYXRlJywgZmFsc2UpO1xuICAgICR0YXJnZXRQYWdlLnRvZ2dsZUNsYXNzKCdhbnRlbm5hLXBhZ2UtYWN0aXZlJywgdHJ1ZSk7XG5cbiAgICAvLyBUaGVuIGFuaW1hdGUgdGhlIGN1cnJlbnQgcGFnZSBtb3ZpbmcgYXdheSB0byByZXZlYWwgdGhlIHRhcmdldC5cbiAgICAkY3VycmVudFBhZ2UudG9nZ2xlQ2xhc3MoJ2FudGVubmEtcGFnZS1hbmltYXRlJywgdHJ1ZSk7XG4gICAgVHJhbnNpdGlvblV0aWwudG9nZ2xlQ2xhc3MoJGN1cnJlbnRQYWdlLCAnYW50ZW5uYS1wYWdlLWFjdGl2ZScsIGZhbHNlLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8vIEFmdGVyIHRoZSBjdXJyZW50IHBhZ2Ugc2xpZGVzIGludG8gcG9zaXRpb24sIG1vdmUgYWxsIG90aGVyIHBhZ2VzIGJhY2sgb3V0IG9mIHRoZSB2aWV3YWJsZSBhcmVhXG4gICAgICAgICRyb290RWxlbWVudC5maW5kKCcuYW50ZW5uYS1wYWdlJykubm90KHBhZ2VTZWxlY3RvcikucmVtb3ZlQ2xhc3MoJ2FudGVubmEtcGFnZS1hY3RpdmUnKTtcbiAgICAgICAgJHRhcmdldFBhZ2UuY3NzKCd6LWluZGV4JywgcGFnZVorKyk7IC8vIFdoZW4gdGhlIGFuaW1hdGlvbiBpcyBkb25lLCBtYWtlIHN1cmUgdGhlIGN1cnJlbnQgcGFnZSBoYXMgdGhlIGhpZ2hlc3Qgei1pbmRleCAoanVzdCBmb3IgY29uc2lzdGVuY3kpXG4gICAgICAgIC8vIFRlYXJkb3duIGFsbCBvdGhlciBwYWdlcy4gVGhleSdsbCBiZSByZS1jcmVhdGVkIGlmIG5lY2Vzc2FyeS5cbiAgICAgICAgdmFyIHJlbWFpbmluZ1BhZ2VzID0gW107XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGFnZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBwYWdlID0gcGFnZXNbaV07XG4gICAgICAgICAgICBpZiAocGFnZS5zZWxlY3RvciA9PT0gcGFnZVNlbGVjdG9yKSB7XG4gICAgICAgICAgICAgICAgcmVtYWluaW5nUGFnZXMucHVzaChwYWdlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcGFnZS50ZWFyZG93bigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHBhZ2VzID0gcmVtYWluaW5nUGFnZXM7XG4gICAgfSk7XG4gICAgc2l6ZUJvZHlUb0ZpdCgkcm9vdEVsZW1lbnQsICR0YXJnZXRQYWdlLCB0cnVlKTtcbn1cblxuZnVuY3Rpb24gc2l6ZUJvZHlUb0ZpdCgkcm9vdEVsZW1lbnQsICRwYWdlLCBhbmltYXRlKSB7XG4gICAgdmFyICRwYWdlQ29udGFpbmVyID0gJHJvb3RFbGVtZW50LmZpbmQoJy5hbnRlbm5hLXBhZ2UtY29udGFpbmVyJyk7XG4gICAgdmFyICRib2R5ID0gJHBhZ2UuZmluZCgnLmFudGVubmEtYm9keScpO1xuICAgIHZhciBjdXJyZW50SGVpZ2h0ID0gJHBhZ2VDb250YWluZXIuY3NzKCdoZWlnaHQnKTtcbiAgICAkcGFnZUNvbnRhaW5lci5jc3MoeyBoZWlnaHQ6ICcnIH0pOyAvLyBDbGVhciBhbnkgcHJldmlvdXNseSBjb21wdXRlZCBoZWlnaHQgc28gd2UgZ2V0IGEgZnJlc2ggY29tcHV0YXRpb24gb2YgdGhlIGNoaWxkIGhlaWdodHNcbiAgICB2YXIgbmV3Qm9keUhlaWdodCA9IE1hdGgubWluKDMwMCwgJGJvZHkuZ2V0KDApLnNjcm9sbEhlaWdodCk7XG4gICAgJGJvZHkuY3NzKHsgaGVpZ2h0OiBuZXdCb2R5SGVpZ2h0IH0pO1xuICAgIHZhciBmb290ZXJIZWlnaHQgPSAkcGFnZS5maW5kKCcuYW50ZW5uYS1mb290ZXInKS5vdXRlckhlaWdodCgpOyAvLyByZXR1cm5zICdudWxsJyBpZiB0aGVyZSdzIG5vIGZvb3Rlci4gYWRkZWQgdG8gYW4gaW50ZWdlciwgJ251bGwnIGFjdHMgbGlrZSAwXG4gICAgdmFyIG5ld1BhZ2VIZWlnaHQgPSBuZXdCb2R5SGVpZ2h0ICsgZm9vdGVySGVpZ2h0O1xuICAgIGlmIChhbmltYXRlKSB7XG4gICAgICAgICRwYWdlQ29udGFpbmVyLmNzcyh7IGhlaWdodDogY3VycmVudEhlaWdodCB9KTtcbiAgICAgICAgJHBhZ2VDb250YWluZXIuYW5pbWF0ZSh7IGhlaWdodDogbmV3UGFnZUhlaWdodCB9LCAyMDApO1xuICAgIH0gZWxzZSB7XG4gICAgICAgICRwYWdlQ29udGFpbmVyLmNzcyh7IGhlaWdodDogbmV3UGFnZUhlaWdodCB9KTtcbiAgICB9XG4gICAgdmFyIG1pbldpZHRoID0gJHBhZ2UuY3NzKCdtaW4td2lkdGgnKTtcbiAgICB2YXIgd2lkdGggPSBwYXJzZUludChtaW5XaWR0aCk7XG4gICAgaWYgKHdpZHRoID4gMCkge1xuICAgICAgICBpZiAoYW5pbWF0ZSkge1xuICAgICAgICAgICAgJHJvb3RFbGVtZW50LmFuaW1hdGUoeyB3aWR0aDogd2lkdGggfSwgMjAwKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICRyb290RWxlbWVudC5jc3MoeyB3aWR0aDogd2lkdGggfSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIHNldHVwV2luZG93Q2xvc2UocGFnZXMsIHJhY3RpdmUpIHtcbiAgICB2YXIgJHJvb3RFbGVtZW50ID0gJChyb290RWxlbWVudChyYWN0aXZlKSk7XG5cbiAgICAvLyBUT0RPOiBJZiB5b3UgbW91c2Ugb3ZlciB0aGUgdHJpZ2dlciBzbG93bHkgZnJvbSB0aGUgdG9wIGxlZnQsIHRoZSB3aW5kb3cgb3BlbnMgd2l0aG91dCBiZWluZyB1bmRlciB0aGUgY3Vyc29yLFxuICAgIC8vICAgICAgIHNvIG5vIG1vdXNlb3V0IGV2ZW50IGlzIHJlY2VpdmVkLiBXaGVuIHdlIG9wZW4gdGhlIHdpbmRvdywgd2Ugc2hvdWxkIHByb2JhYmx5IGp1c3Qgc2Nvb3QgaXQgdXAgc2xpZ2h0bHlcbiAgICAvLyAgICAgICBpZiBuZWVkZWQgdG8gYXNzdXJlIHRoYXQgaXQncyB1bmRlciB0aGUgY3Vyc29yLiBBbHRlcm5hdGl2ZWx5LCB3ZSBjb3VsZCBhZGp1c3QgdGhlIG1vdXNlb3ZlciBhcmVhIHRvIG1hdGNoXG4gICAgLy8gICAgICAgdGhlIHJlZ2lvbiB0aGF0IHRoZSB3aW5kb3cgb3BlbnMuXG4gICAgJHJvb3RFbGVtZW50XG4gICAgICAgIC5vbignbW91c2VvdXQuYW50ZW5uYScsIGRlbGF5ZWRDbG9zZVdpbmRvdylcbiAgICAgICAgLm9uKCdtb3VzZW92ZXIuYW50ZW5uYScsIGtlZXBXaW5kb3dPcGVuKVxuICAgICAgICAub24oJ2ZvY3VzaW4uYW50ZW5uYScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy8gT25jZSB0aGUgd2luZG93IGhhcyBmb2N1cywgZG9uJ3QgY2xvc2UgaXQgb24gbW91c2VvdXQuXG4gICAgICAgICAgICBrZWVwV2luZG93T3BlbigpO1xuICAgICAgICAgICAgJHJvb3RFbGVtZW50Lm9mZignbW91c2VvdXQuYW50ZW5uYScpO1xuICAgICAgICAgICAgJHJvb3RFbGVtZW50Lm9mZignbW91c2VvdmVyLmFudGVubmEnKTtcbiAgICAgICAgfSk7XG4gICAgJChkb2N1bWVudCkub24oJ2NsaWNrLmFudGVubmEnLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBpZiAoJChldmVudC50YXJnZXQpLmNsb3Nlc3QoU0VMRUNUT1JfUkVBQ1RJT05TX1dJREdFVCkubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICBjbG9zZUFsbFdpbmRvd3MoKTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHZhciB0YXBMaXN0ZW5lciA9IFRvdWNoU3VwcG9ydC5zZXR1cFRhcChkb2N1bWVudCwgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgaWYgKCQoZXZlbnQudGFyZ2V0KS5jbG9zZXN0KFNFTEVDVE9SX1JFQUNUSU9OU19XSURHRVQpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgY2xvc2VBbGxXaW5kb3dzKCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIHZhciBjbG9zZVRpbWVyO1xuXG4gICAgZnVuY3Rpb24gZGVsYXllZENsb3NlV2luZG93KCkge1xuICAgICAgICBjbG9zZVRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNsb3NlVGltZXIgPSBudWxsO1xuICAgICAgICAgICAgY2xvc2VBbGxXaW5kb3dzKCk7XG4gICAgICAgIH0sIDUwMCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24ga2VlcFdpbmRvd09wZW4oKSB7XG4gICAgICAgIGNsZWFyVGltZW91dChjbG9zZVRpbWVyKTtcbiAgICB9XG5cbiAgICByYWN0aXZlLm9uKCdpbnRlcm5hbENsb3NlV2luZG93JywgZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIENsb3NlcyBvbmUgcGFydGljdWxhciByZWFjdGlvbiB3aW5kb3cuIFRoaXMgZnVuY3Rpb24gc2hvdWxkIG9ubHkgYmUgY2FsbGVkIGZyb20gY2xvc2VBbGxXaW5kb3dzLCB3aGljaCBhbHNvXG4gICAgICAgIC8vIGNsZWFucyB1cCB0aGUgaGFuZGxlcyB3ZSBtYWludGFpbiB0byBhbGwgd2luZG93cy5cbiAgICAgICAgY2xlYXJUaW1lb3V0KGNsb3NlVGltZXIpO1xuXG4gICAgICAgICRyb290RWxlbWVudC5zdG9wKHRydWUsIHRydWUpLmZhZGVPdXQoJ2Zhc3QnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICRyb290RWxlbWVudC5jc3MoJ2Rpc3BsYXknLCAnJyk7IC8vIENsZWFyIHRoZSBkaXNwbGF5Om5vbmUgdGhhdCBmYWRlT3V0IHB1dHMgb24gdGhlIGVsZW1lbnRcbiAgICAgICAgICAgICRyb290RWxlbWVudC5yZW1vdmVDbGFzcygnYW50ZW5uYS1yZWFjdGlvbnMtb3BlbicpO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBhZ2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgcGFnZXNbaV0udGVhcmRvd24oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJhY3RpdmUudGVhcmRvd24oKTtcbiAgICAgICAgfSk7XG4gICAgICAgIFJhbmdlLmNsZWFySGlnaGxpZ2h0cygpO1xuICAgICAgICAkcm9vdEVsZW1lbnQub2ZmKCcuYW50ZW5uYScpOyAvLyBVbmJpbmQgYWxsIG9mIHRoZSBoYW5kbGVycyBpbiBvdXIgbmFtZXNwYWNlXG4gICAgICAgICQoZG9jdW1lbnQpLm9mZignY2xpY2suYW50ZW5uYScpO1xuICAgICAgICB0YXBMaXN0ZW5lci50ZWFyZG93bigpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBjbG9zZUFsbFdpbmRvd3MoKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvcGVuSW5zdGFuY2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIG9wZW5JbnN0YW5jZXNbaV0uZmlyZSgnaW50ZXJuYWxDbG9zZVdpbmRvdycpO1xuICAgIH1cbiAgICBvcGVuSW5zdGFuY2VzID0gW107XG59XG5cbmZ1bmN0aW9uIGlzT3BlbldpbmRvdygpIHtcbiAgICByZXR1cm4gb3Blbkluc3RhbmNlcy5sZW5ndGggPiAwO1xufVxuXG4vLyBQcmV2ZW50IHNjcm9sbGluZyBvZiB0aGUgZG9jdW1lbnQgYWZ0ZXIgd2Ugc2Nyb2xsIHRvIHRoZSB0b3AvYm90dG9tIG9mIHRoZSByZWFjdGlvbnMgd2luZG93XG4vLyBDb2RlIGNvcGllZCBmcm9tOiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzU4MDI0NjcvcHJldmVudC1zY3JvbGxpbmctb2YtcGFyZW50LWVsZW1lbnRcbmZ1bmN0aW9uIHByZXZlbnRFeHRyYVNjcm9sbCgkcm9vdEVsZW1lbnQpIHtcbiAgICAkcm9vdEVsZW1lbnQub24oJ0RPTU1vdXNlU2Nyb2xsLmFudGVubmEgbW91c2V3aGVlbC5hbnRlbm5hJywgJy5hbnRlbm5hLWJvZHknLCBmdW5jdGlvbihldikge1xuICAgICAgICB2YXIgJHRoaXMgPSAkKHRoaXMpLFxuICAgICAgICAgICAgc2Nyb2xsVG9wID0gdGhpcy5zY3JvbGxUb3AsXG4gICAgICAgICAgICBzY3JvbGxIZWlnaHQgPSB0aGlzLnNjcm9sbEhlaWdodCxcbiAgICAgICAgICAgIGhlaWdodCA9ICR0aGlzLmhlaWdodCgpLFxuICAgICAgICAgICAgZGVsdGEgPSAoZXYudHlwZSA9PSAnRE9NTW91c2VTY3JvbGwnID9cbiAgICAgICAgICAgICAgICBldi5vcmlnaW5hbEV2ZW50LmRldGFpbCAqIC00MCA6XG4gICAgICAgICAgICAgICAgZXYub3JpZ2luYWxFdmVudC53aGVlbERlbHRhKSxcbiAgICAgICAgICAgIHVwID0gZGVsdGEgPiAwO1xuXG4gICAgICAgIGlmIChzY3JvbGxIZWlnaHQgPD0gaGVpZ2h0KSB7XG4gICAgICAgICAgICAvLyBUaGlzIGlzIGFuIGFkZGl0aW9uIHRvIHRoZSBTdGFja092ZXJmbG93IGNvZGUsIHRvIG1ha2Ugc3VyZSB0aGUgcGFnZSBzY3JvbGxzIGFzIHVzdWFsIGlmIHRoZSB3aW5kb3dcbiAgICAgICAgICAgIC8vIGNvbnRlbnQgZG9lc24ndCBzY3JvbGwuXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcHJldmVudCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgZXYuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICBldi5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgZXYucmV0dXJuVmFsdWUgPSBmYWxzZTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoIXVwICYmIC1kZWx0YSA+IHNjcm9sbEhlaWdodCAtIGhlaWdodCAtIHNjcm9sbFRvcCkge1xuICAgICAgICAgICAgLy8gU2Nyb2xsaW5nIGRvd24sIGJ1dCB0aGlzIHdpbGwgdGFrZSB1cyBwYXN0IHRoZSBib3R0b20uXG4gICAgICAgICAgICAkdGhpcy5zY3JvbGxUb3Aoc2Nyb2xsSGVpZ2h0KTtcbiAgICAgICAgICAgIHJldHVybiBwcmV2ZW50KCk7XG4gICAgICAgIH0gZWxzZSBpZiAodXAgJiYgZGVsdGEgPiBzY3JvbGxUb3ApIHtcbiAgICAgICAgICAgIC8vIFNjcm9sbGluZyB1cCwgYnV0IHRoaXMgd2lsbCB0YWtlIHVzIHBhc3QgdGhlIHRvcC5cbiAgICAgICAgICAgICR0aGlzLnNjcm9sbFRvcCgwKTtcbiAgICAgICAgICAgIHJldHVybiBwcmV2ZW50KCk7XG4gICAgICAgIH1cbiAgICB9KTtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIG9wZW46IG9wZW5SZWFjdGlvbnNXaWRnZXQsXG4gICAgaXNPcGVuOiBpc09wZW5XaW5kb3csXG4gICAgc2VsZWN0b3I6IFNFTEVDVE9SX1JFQUNUSU9OU19XSURHRVQsXG4gICAgdGVhcmRvd246IGNsb3NlQWxsV2luZG93c1xufTsiLCIvLyBUaGlzIG1vZHVsZSBzZXRzIHVwIGxpc3RlbmVycyBvbiB0aGUgcmVhZG1vcmUgd2lkZ2V0IGluIG9yZGVyIHRvIHJlY29yZCBldmVudHMgdXNpbmcgYWxsIHRoZSBkYXRhIGF2YWlsYWJsZSB0b1xuLy8gdGhlIHJlYWN0aW9uIHdpZGdldC5cblxudmFyIFRocm90dGxlZEV2ZW50cyA9IHJlcXVpcmUoJy4vdXRpbHMvdGhyb3R0bGVkLWV2ZW50cycpO1xudmFyIEV2ZW50cyA9IHJlcXVpcmUoJy4vZXZlbnRzJyk7XG5cbmZ1bmN0aW9uIHNldHVwUmVhZE1vcmVFdmVudHMoZWxlbWVudCwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgdmlzaWJpbGl0eUZpcmVkID0gZmFsc2U7XG4gICAgdmFyIHJlYWRNb3JlRWxlbWVudCA9IGVsZW1lbnQucXVlcnlTZWxlY3RvcignLmFudGVubmEtcmVhZG1vcmUnKTtcbiAgICBpZiAocmVhZE1vcmVFbGVtZW50KSB7XG4gICAgICAgIHZhciByZWFkTW9yZUFjdGlvbiA9IHJlYWRNb3JlRWxlbWVudC5xdWVyeVNlbGVjdG9yKCcuYW50ZW5uYS1yZWFkbW9yZS1hY3Rpb24nKTtcbiAgICAgICAgaWYgKHJlYWRNb3JlQWN0aW9uKSB7XG4gICAgICAgICAgICBFdmVudHMucG9zdFJlYWRNb3JlTG9hZGVkKHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgIHNldHVwVmlzaWJpbGl0eUxpc3RlbmVyKCk7XG4gICAgICAgICAgICAvLyBUT0RPOiBCb3RoIHRoZSByZWFkbW9yZSB3aWRnZXQgYW5kIHRoaXMgY29kZSBzaG91bGQgYmUgbW92ZWQgdG8gdXNpbmcgdG91Y2ggZXZlbnRzXG4gICAgICAgICAgICByZWFkTW9yZUFjdGlvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZpcmVDbGlja2VkKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNldHVwVmlzaWJpbGl0eUxpc3RlbmVyKCkge1xuICAgICAgICBpZiAoaXNWaXNpYmxlKCkpIHtcbiAgICAgICAgICAgIGZpcmVWaXNpYmxlKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBUaHJvdHRsZWRFdmVudHMub24oJ3Njcm9sbCcsIGhhbmRsZVNjcm9sbEV2ZW50KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGhhbmRsZVNjcm9sbEV2ZW50KCkge1xuICAgICAgICBpZiAoaXNWaXNpYmxlKCkpIHtcbiAgICAgICAgICAgIGZpcmVWaXNpYmxlKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpc1Zpc2libGUoKSB7XG4gICAgICAgIHZhciBjb250ZW50Qm94ID0gcmVhZE1vcmVFbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICB2YXIgdmlld3BvcnRCb3R0b20gPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50SGVpZ2h0O1xuICAgICAgICByZXR1cm4gY29udGVudEJveC50b3AgPiAwICYmIGNvbnRlbnRCb3gudG9wIDwgdmlld3BvcnRCb3R0b20gJiZcbiAgICAgICAgICAgICAgICBjb250ZW50Qm94LmJvdHRvbSA+IDAgJiYgY29udGVudEJveC5ib3R0b20gPCB2aWV3cG9ydEJvdHRvbTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmaXJlQ2xpY2tlZCgpIHtcbiAgICAgICAgaWYgKCF2aXNpYmlsaXR5RmlyZWQpIHsgLy8gRGF0YSBpbnRlZ3JpdHkgLSBtYWtlIHN1cmUgd2UgYWx3YXlzIGZpcmUgYSB2aXNpYmlsaXR5IGV2ZW50IGJlZm9yZSBmaXJpbmcgYSBjbGljay5cbiAgICAgICAgICAgIGZpcmVWaXNpYmxlKCk7XG4gICAgICAgIH1cbiAgICAgICAgRXZlbnRzLnBvc3RSZWFkTW9yZUNsaWNrZWQocGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGZpcmVWaXNpYmxlKCkge1xuICAgICAgICBpZiAoIXZpc2liaWxpdHlGaXJlZCkgeyAvLyBkb24ndCBmaXJlIG1vcmUgdGhhbiBvbmNlXG4gICAgICAgICAgICBFdmVudHMucG9zdFJlYWRNb3JlVmlzaWJsZShwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICBUaHJvdHRsZWRFdmVudHMub2ZmKCdzY3JvbGwnLCBoYW5kbGVTY3JvbGxFdmVudCk7XG4gICAgICAgIH1cbiAgICAgICAgdmlzaWJpbGl0eUZpcmVkID0gdHJ1ZTtcbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHNldHVwUmVhZE1vcmVFdmVudHM6IHNldHVwUmVhZE1vcmVFdmVudHNcbn07IiwidmFyIEdyb3VwU2V0dGluZ3MgPSByZXF1aXJlKCcuL2dyb3VwLXNldHRpbmdzJyk7XG52YXIgSGFzaGVkRWxlbWVudHMgPSByZXF1aXJlKCcuL2hhc2hlZC1lbGVtZW50cycpO1xudmFyIFBhZ2VEYXRhID0gcmVxdWlyZSgnLi9wYWdlLWRhdGEnKTtcbnZhciBQYWdlRGF0YUxvYWRlciA9IHJlcXVpcmUoJy4vcGFnZS1kYXRhLWxvYWRlcicpO1xudmFyIFBhZ2VTY2FubmVyID0gcmVxdWlyZSgnLi9wYWdlLXNjYW5uZXInKTtcbnZhciBQb3B1cFdpZGdldCA9IHJlcXVpcmUoJy4vcG9wdXAtd2lkZ2V0Jyk7XG52YXIgUmVhY3Rpb25zV2lkZ2V0ID0gcmVxdWlyZSgnLi9yZWFjdGlvbnMtd2lkZ2V0Jyk7XG5cbnZhciBNdXRhdGlvbk9ic2VydmVyID0gcmVxdWlyZSgnLi91dGlscy9tdXRhdGlvbi1vYnNlcnZlcicpO1xuXG5mdW5jdGlvbiByZWluaXRpYWxpemVBbGwoKSB7XG4gICAgdmFyIGdyb3VwU2V0dGluZ3MgPSBHcm91cFNldHRpbmdzLmdldCgpO1xuICAgIGlmIChncm91cFNldHRpbmdzKSB7XG4gICAgICAgIHJlaW5pdGlhbGl6ZShncm91cFNldHRpbmdzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmxvZygnQW50ZW5uYSBjYW5ub3QgYmUgcmVpbml0aWFsaXplZC4gR3JvdXAgc2V0dGluZ3MgYXJlIG5vdCBsb2FkZWQuJyk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiByZWluaXRpYWxpemUoZ3JvdXBTZXR0aW5ncykge1xuICAgIFJlYWN0aW9uc1dpZGdldC50ZWFyZG93bigpO1xuICAgIFBvcHVwV2lkZ2V0LnRlYXJkb3duKCk7XG4gICAgUGFnZVNjYW5uZXIudGVhcmRvd24oKTtcbiAgICBQYWdlRGF0YS50ZWFyZG93bigpO1xuICAgIEhhc2hlZEVsZW1lbnRzLnRlYXJkb3duKCk7XG4gICAgTXV0YXRpb25PYnNlcnZlci50ZWFyZG93bigpO1xuXG4gICAgUGFnZURhdGFMb2FkZXIubG9hZChncm91cFNldHRpbmdzKTtcbiAgICBQYWdlU2Nhbm5lci5zY2FuKGdyb3VwU2V0dGluZ3MsIHJlaW5pdGlhbGl6ZSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHJlaW5pdGlhbGl6ZTogcmVpbml0aWFsaXplLFxuICAgIHJlaW5pdGlhbGl6ZUFsbDogcmVpbml0aWFsaXplQWxsLFxufTsiLCJ2YXIgUmFjdGl2ZVByb3ZpZGVyID0gcmVxdWlyZSgnLi91dGlscy9yYWN0aXZlLXByb3ZpZGVyJyk7XG52YXIgUmFuZ3lQcm92aWRlciA9IHJlcXVpcmUoJy4vdXRpbHMvcmFuZ3ktcHJvdmlkZXInKTtcbnZhciBKUXVlcnlQcm92aWRlciA9IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJyk7XG52YXIgQXBwTW9kZSA9IHJlcXVpcmUoJy4vdXRpbHMvYXBwLW1vZGUnKTtcbnZhciBVUkxzID0gcmVxdWlyZSgnLi91dGlscy91cmxzJyk7XG5cbnZhciBzY3JpcHRzID0gW1xuICAgIHtzcmM6ICcvL2NkbmpzLmNsb3VkZmxhcmUuY29tL2FqYXgvbGlicy9qcXVlcnkvMi4xLjQvanF1ZXJ5Lm1pbi5qcycsIGNhbGxiYWNrOiBKUXVlcnlQcm92aWRlci5sb2FkZWR9LFxuICAgIC8vIFRPRE8gbWluaWZ5IG91ciBjb21waWxlZCBSYWN0aXZlIGFuZCBob3N0IGl0IG9uIGEgQ0ROXG4gICAge3NyYzogVVJMcy5hbWF6b25TM1VybCgpICsgJy93aWRnZXQtbmV3L2xpYi9yYWN0aXZlLnJ1bnRpbWUtMC43LjMubWluLmpzJywgY2FsbGJhY2s6IFJhY3RpdmVQcm92aWRlci5sb2FkZWQsIGFib3V0VG9Mb2FkOiBSYWN0aXZlUHJvdmlkZXIuYWJvdXRUb0xvYWR9LFxuICAgIC8vIFRPRE8gbWluaWZ5IG91ciBjb21waWxlZCBSYW5keSBhbmQgaG9zdCBpdCBvbiBhIENETlxuICAgIHtzcmM6IFVSTHMuYW1hem9uUzNVcmwoKSArICcvd2lkZ2V0LW5ldy9saWIvcmFuZ3kuY29tcGlsZWQtMS4zLjAubWluLmpzJywgY2FsbGJhY2s6IFJhbmd5UHJvdmlkZXIubG9hZGVkLCBhYm91dFRvTG9hZDogUmFuZ3lQcm92aWRlci5hYm91dFRvTG9hZH1cbl07XG5pZiAoQXBwTW9kZS5vZmZsaW5lKSB7XG4gICAgLy8gVXNlIHRoZSBvZmZsaW5lIHZlcnNpb25zIG9mIHRoZSBsaWJyYXJpZXMgZm9yIGRldmVsb3BtZW50LlxuICAgIHNjcmlwdHMgPSBbXG4gICAgICAgIHtzcmM6IFVSTHMuYXBwU2VydmVyVXJsKCkgKyAnL3N0YXRpYy9qcy9jZG4vanF1ZXJ5LzIuMS40L2pxdWVyeS5qcycsIGNhbGxiYWNrOiBKUXVlcnlQcm92aWRlci5sb2FkZWR9LFxuICAgICAgICB7c3JjOiBVUkxzLmFwcFNlcnZlclVybCgpICsgJy9zdGF0aWMvd2lkZ2V0LW5ldy9saWIvcmFjdGl2ZS5ydW50aW1lLTAuNy4zLmpzJywgY2FsbGJhY2s6IFJhY3RpdmVQcm92aWRlci5sb2FkZWQsIGFib3V0VG9Mb2FkOiBSYWN0aXZlUHJvdmlkZXIuYWJvdXRUb0xvYWR9LFxuICAgICAgICB7c3JjOiBVUkxzLmFwcFNlcnZlclVybCgpICsgJy9zdGF0aWMvd2lkZ2V0LW5ldy9saWIvcmFuZ3kuY29tcGlsZWQtMS4zLjAuanMnLCBjYWxsYmFjazogUmFuZ3lQcm92aWRlci5sb2FkZWQsIGFib3V0VG9Mb2FkOiBSYW5neVByb3ZpZGVyLmFib3V0VG9Mb2FkfVxuICAgIF07XG59XG5cbmZ1bmN0aW9uIGxvYWRBbGxTY3JpcHRzKGxvYWRlZENhbGxiYWNrKSB7XG4gICAgbG9hZFNjcmlwdHMoc2NyaXB0cywgbG9hZGVkQ2FsbGJhY2spO1xufVxuXG5mdW5jdGlvbiBsb2FkU2NyaXB0cyhzY3JpcHRzLCBsb2FkZWRDYWxsYmFjaykge1xuICAgIHZhciBsb2FkaW5nQ291bnQgPSBzY3JpcHRzLmxlbmd0aDtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNjcmlwdHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIHNjcmlwdCA9IHNjcmlwdHNbaV07XG4gICAgICAgIGlmIChzY3JpcHQuYWJvdXRUb0xvYWQpIHsgc2NyaXB0LmFib3V0VG9Mb2FkKCk7IH1cbiAgICAgICAgbG9hZFNjcmlwdChzY3JpcHQuc3JjLCBmdW5jdGlvbihzY3JpcHRDYWxsYmFjaykge1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmIChzY3JpcHRDYWxsYmFjaykgc2NyaXB0Q2FsbGJhY2soKTtcbiAgICAgICAgICAgICAgICBsb2FkaW5nQ291bnQgPSBsb2FkaW5nQ291bnQgLSAxO1xuICAgICAgICAgICAgICAgIGlmIChsb2FkaW5nQ291bnQgPT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAobG9hZGVkQ2FsbGJhY2spIGxvYWRlZENhbGxiYWNrKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSAoc2NyaXB0LmNhbGxiYWNrKSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBsb2FkU2NyaXB0KHNyYywgY2FsbGJhY2spIHtcbiAgICB2YXIgaGVhZCA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF07XG4gICAgaWYgKGhlYWQpIHtcbiAgICAgICAgdmFyIHNjcmlwdFRhZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuICAgICAgICBzY3JpcHRUYWcuc2V0QXR0cmlidXRlKCdzcmMnLCBzcmMpO1xuICAgICAgICBzY3JpcHRUYWcuc2V0QXR0cmlidXRlKCd0eXBlJywndGV4dC9qYXZhc2NyaXB0Jyk7XG5cbiAgICAgICAgaWYgKHNjcmlwdFRhZy5yZWFkeVN0YXRlKSB7IC8vIElFLCBpbmNsLiBJRTlcbiAgICAgICAgICAgIHNjcmlwdFRhZy5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBpZiAoc2NyaXB0VGFnLnJlYWR5U3RhdGUgPT0gXCJsb2FkZWRcIiB8fCBzY3JpcHRUYWcucmVhZHlTdGF0ZSA9PSBcImNvbXBsZXRlXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgc2NyaXB0VGFnLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjYWxsYmFjaykgeyBjYWxsYmFjaygpOyB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNjcmlwdFRhZy5vbmxvYWQgPSBmdW5jdGlvbigpIHsgLy8gT3RoZXIgYnJvd3NlcnNcbiAgICAgICAgICAgICAgICBpZiAoY2FsbGJhY2spIHsgY2FsbGJhY2soKTsgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIGhlYWQuYXBwZW5kQ2hpbGQoc2NyaXB0VGFnKTtcbiAgICB9XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBsb2FkOiBsb2FkQWxsU2NyaXB0c1xufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi91dGlscy9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciBCcm93c2VyTWV0cmljcyA9IHJlcXVpcmUoJy4vdXRpbHMvYnJvd3Nlci1tZXRyaWNzJyk7XG52YXIgUmFjdGl2ZTsgcmVxdWlyZSgnLi91dGlscy9yYWN0aXZlLXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGxvYWRlZFJhY3RpdmUpIHsgUmFjdGl2ZSA9IGxvYWRlZFJhY3RpdmU7fSk7XG52YXIgU2VnbWVudCA9IHJlcXVpcmUoJy4vdXRpbHMvc2VnbWVudCcpO1xudmFyIFRvdWNoU3VwcG9ydCA9IHJlcXVpcmUoJy4vdXRpbHMvdG91Y2gtc3VwcG9ydCcpO1xuXG52YXIgUmVhY3Rpb25zV2lkZ2V0ID0gcmVxdWlyZSgnLi9yZWFjdGlvbnMtd2lkZ2V0Jyk7XG52YXIgU1ZHcyA9IHJlcXVpcmUoJy4vc3ZncycpO1xuXG5mdW5jdGlvbiBjcmVhdGVTdW1tYXJ5V2lkZ2V0KGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBkZWZhdWx0UmVhY3Rpb25zLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIHJhY3RpdmUgPSBSYWN0aXZlKHtcbiAgICAgICAgZWw6ICQoJzxkaXY+JyksIC8vIHRoZSByZWFsIHJvb3Qgbm9kZSBpcyBpbiB0aGUgdGVtcGxhdGUuIGl0J3MgZXh0cmFjdGVkIGFmdGVyIHRoZSB0ZW1wbGF0ZSBpcyByZW5kZXJlZCBpbnRvIHRoaXMgZHVtbXkgZWxlbWVudFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICBwYWdlRGF0YTogcGFnZURhdGEsXG4gICAgICAgICAgICBpc0V4cGFuZGVkU3VtbWFyeTogc2hvdWxkVXNlRXhwYW5kZWRTdW1tYXJ5KGdyb3VwU2V0dGluZ3MpLFxuICAgICAgICAgICAgY29tcHV0ZUV4cGFuZGVkUmVhY3Rpb25zOiBjb21wdXRlRXhwYW5kZWRSZWFjdGlvbnMoZGVmYXVsdFJlYWN0aW9ucylcbiAgICAgICAgfSxcbiAgICAgICAgbWFnaWM6IHRydWUsXG4gICAgICAgIHRlbXBsYXRlOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvc3VtbWFyeS13aWRnZXQuaGJzLmh0bWwnKSxcbiAgICAgICAgcGFydGlhbHM6IHtcbiAgICAgICAgICAgIGxvZ286IFNWR3MubG9nb1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgdmFyICRyb290RWxlbWVudCA9ICQocm9vdEVsZW1lbnQocmFjdGl2ZSkpO1xuICAgICRyb290RWxlbWVudC5vbignbW91c2VlbnRlcicsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgb3BlblJlYWN0aW9uc1dpbmRvdyhjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgZGVmYXVsdFJlYWN0aW9ucywgZ3JvdXBTZXR0aW5ncywgcmFjdGl2ZSk7XG4gICAgfSk7XG4gICAgVG91Y2hTdXBwb3J0LnNldHVwVGFwKCRyb290RWxlbWVudC5nZXQoMCksIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGlmICghUmVhY3Rpb25zV2lkZ2V0LmlzT3BlbigpKSB7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICBvcGVuUmVhY3Rpb25zV2luZG93KGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBkZWZhdWx0UmVhY3Rpb25zLCBncm91cFNldHRpbmdzLCByYWN0aXZlKTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiB7XG4gICAgICAgIGVsZW1lbnQ6ICRyb290RWxlbWVudCxcbiAgICAgICAgdGVhcmRvd246IGZ1bmN0aW9uKCkgeyByYWN0aXZlLnRlYXJkb3duKCk7IH1cbiAgICB9O1xufVxuXG5mdW5jdGlvbiByb290RWxlbWVudChyYWN0aXZlKSB7XG4gICAgcmV0dXJuIHJhY3RpdmUuZmluZCgnLmFudGVubmEtc3VtbWFyeS13aWRnZXQnKTtcbn1cblxuZnVuY3Rpb24gb3BlblJlYWN0aW9uc1dpbmRvdyhjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgZGVmYXVsdFJlYWN0aW9ucywgZ3JvdXBTZXR0aW5ncywgcmFjdGl2ZSkge1xuICAgIHZhciByZWFjdGlvbnNXaWRnZXRPcHRpb25zID0ge1xuICAgICAgICBpc1N1bW1hcnk6IHRydWUsXG4gICAgICAgIHJlYWN0aW9uc0RhdGE6IHBhZ2VEYXRhLnN1bW1hcnlSZWFjdGlvbnMsXG4gICAgICAgIGNvbnRhaW5lckRhdGE6IGNvbnRhaW5lckRhdGEsXG4gICAgICAgIGRlZmF1bHRSZWFjdGlvbnM6IGRlZmF1bHRSZWFjdGlvbnMsXG4gICAgICAgIHBhZ2VEYXRhOiBwYWdlRGF0YSxcbiAgICAgICAgZ3JvdXBTZXR0aW5nczogZ3JvdXBTZXR0aW5ncyxcbiAgICAgICAgY29udGVudERhdGE6IHsgdHlwZTogJ3BhZ2UnLCBib2R5OiAnJyB9XG4gICAgfTtcbiAgICBSZWFjdGlvbnNXaWRnZXQub3BlbihyZWFjdGlvbnNXaWRnZXRPcHRpb25zLCByb290RWxlbWVudChyYWN0aXZlKSk7XG59XG5cbmZ1bmN0aW9uIHNob3VsZFVzZUV4cGFuZGVkU3VtbWFyeShncm91cFNldHRpbmdzKSB7XG4gICAgcmV0dXJuIEJyb3dzZXJNZXRyaWNzLmlzTW9iaWxlKCkgJiYgKGdyb3VwU2V0dGluZ3MuaXNFeHBhbmRlZE1vYmlsZVN1bW1hcnkoKSB8fCBTZWdtZW50LmlzRXhwYW5kZWRTdW1tYXJ5U2VnbWVudChncm91cFNldHRpbmdzKSk7XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVFeHBhbmRlZFJlYWN0aW9ucyhkZWZhdWx0UmVhY3Rpb25zKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHJlYWN0aW9uc0RhdGEpIHtcbiAgICAgICAgdmFyIG1heCA9IDI7XG4gICAgICAgIHZhciBleHBhbmRlZFJlYWN0aW9ucyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJlYWN0aW9uc0RhdGEubGVuZ3RoICYmIGV4cGFuZGVkUmVhY3Rpb25zLmxlbmd0aCA8IG1heDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgcmVhY3Rpb25EYXRhID0gcmVhY3Rpb25zRGF0YVtpXTtcbiAgICAgICAgICAgIGlmIChpc0RlZmF1bHRSZWFjdGlvbihyZWFjdGlvbkRhdGEsIGRlZmF1bHRSZWFjdGlvbnMpKSB7XG4gICAgICAgICAgICAgICAgZXhwYW5kZWRSZWFjdGlvbnMucHVzaChyZWFjdGlvbkRhdGEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBleHBhbmRlZFJlYWN0aW9ucztcbiAgICB9O1xufVxuXG5mdW5jdGlvbiBpc0RlZmF1bHRSZWFjdGlvbihyZWFjdGlvbkRhdGEsIGRlZmF1bHRSZWFjdGlvbnMpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRlZmF1bHRSZWFjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGRlZmF1bHRSZWFjdGlvbnNbaV0udGV4dCA9PT0gcmVhY3Rpb25EYXRhLnRleHQpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZTogY3JlYXRlU3VtbWFyeVdpZGdldFxufTsiLCJ2YXIgUmFjdGl2ZTsgcmVxdWlyZSgnLi91dGlscy9yYWN0aXZlLXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGxvYWRlZFJhY3RpdmUpIHsgUmFjdGl2ZSA9IGxvYWRlZFJhY3RpdmU7fSk7XG5cbi8vIEFib3V0IGhvdyB3ZSBoYW5kbGUgaWNvbnM6IFdlIGluc2VydCBhIHNpbmdsZSBTVkcgZWxlbWVudCBhdCB0aGUgdG9wIG9mIHRoZSBib2R5IGVsZW1lbnQgd2hpY2ggZGVmaW5lcyBhbGwgb2YgdGhlXG4vLyBpY29ucyB3ZSBuZWVkLiBUaGVuIGFsbCBpY29ucyB1c2VkIGJ5IHRoZSBhcHBsaWNhdGlvbnMgYXJlIHJlbmRlcmVkIHdpdGggdmVyeSBsaWdodHdlaWdodCBTVkcgZWxlbWVudHMgdGhhdCBzaW1wbHlcbi8vIHBvaW50IHRvIHRoZSBhcHByb3ByaWF0ZSBpY29uIGJ5IHJlZmVyZW5jZS5cblxuLy8gVE9ETzogbG9vayBpbnRvIHVzaW5nIGEgc2luZ2xlIHRlbXBsYXRlIGZvciB0aGUgXCJ1c2VcIiBTVkdzLiBDYW4gd2UgaW5zdGFudGlhdGUgYSBwYXJ0aWFsIHdpdGggYSBkeW5hbWljIGNvbnRleHQ/XG52YXIgdGVtcGxhdGVzID0ge1xuICAgIGxvZ286IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9zdmctbG9nby5oYnMuaHRtbCcpLFxuICAgIC8vIFRoZSBcInNlbGVjdGFibGVcIiBsb2dvIGRlZmluZXMgYW4gaW5saW5lICdwYXRoJyByYXRoZXIgdGhhbiBhICd1c2UnIHJlZmVyZW5jZSwgYXMgYSB3b3JrYXJvdW5kIGZvciBhIEZpcmVmb3ggdGV4dCBzZWxlY3Rpb24gYnVnLlxuICAgIGxvZ29TZWxlY3RhYmxlOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvc3ZnLWxvZ28tc2VsZWN0YWJsZS5oYnMuaHRtbCcpLFxuICAgIGxvY2F0aW9uOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvc3ZnLWxvY2F0aW9uLmhicy5odG1sJyksXG4gICAgZmFjZWJvb2s6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9zdmctZmFjZWJvb2suaGJzLmh0bWwnKSxcbiAgICB0d2l0dGVyOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvc3ZnLXR3aXR0ZXIuaGJzLmh0bWwnKSxcbiAgICBsZWZ0OiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvc3ZnLWxlZnQuaGJzLmh0bWwnKSxcbiAgICBmaWxtOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvc3ZnLWZpbG0uaGJzLmh0bWwnKVxufTtcblxudmFyIGlzU2V0dXAgPSBmYWxzZTtcblxuZnVuY3Rpb24gZW5zdXJlU2V0dXAoKSB7XG4gICAgaWYgKCFpc1NldHVwKSB7XG4gICAgICAgIHZhciBkdW1teSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBSYWN0aXZlKHtcbiAgICAgICAgICAgIGVsOiBkdW1teSxcbiAgICAgICAgICAgIHRlbXBsYXRlOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvc3Zncy5oYnMuaHRtbCcpXG4gICAgICAgIH0pO1xuICAgICAgICAvLyBTYWZhcmkgb24gaU9TIHJlcXVpcmVzIHRoZSBTVkcgdGhhdCBkZWZpbmVzIHRoZSBpY29ucyBhcHBlYXIgYmVmb3JlIHRoZSBTVkdzIHRoYXQgcmVmZXJlbmNlIGl0LlxuICAgICAgICBkb2N1bWVudC5ib2R5Lmluc2VydEJlZm9yZShkdW1teS5jaGlsZHJlblswXSwgZG9jdW1lbnQuYm9keS5maXJzdENoaWxkKTtcbiAgICAgICAgaXNTZXR1cCA9IHRydWU7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBnZXRTVkcodGVtcGxhdGUpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgIGVuc3VyZVNldHVwKCk7XG4gICAgICAgIHJldHVybiB0ZW1wbGF0ZTtcbiAgICB9XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBsb2dvOiBnZXRTVkcodGVtcGxhdGVzLmxvZ28pLFxuICAgIGxvZ29TZWxlY3RhYmxlOiBnZXRTVkcodGVtcGxhdGVzLmxvZ29TZWxlY3RhYmxlKSxcbiAgICBsb2NhdGlvbjogZ2V0U1ZHKHRlbXBsYXRlcy5sb2NhdGlvbiksXG4gICAgZmFjZWJvb2s6IGdldFNWRyh0ZW1wbGF0ZXMuZmFjZWJvb2spLFxuICAgIHR3aXR0ZXI6IGdldFNWRyh0ZW1wbGF0ZXMudHdpdHRlciksXG4gICAgbGVmdDogZ2V0U1ZHKHRlbXBsYXRlcy5sZWZ0KSxcbiAgICBmaWxtOiBnZXRTVkcodGVtcGxhdGVzLmZpbG0pXG59OyIsInZhciBSYWN0aXZlOyByZXF1aXJlKCcuL3V0aWxzL3JhY3RpdmUtcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24obG9hZGVkUmFjdGl2ZSkgeyBSYWN0aXZlID0gbG9hZGVkUmFjdGl2ZTt9KTtcbnZhciBCcm93c2VyTWV0cmljcyA9IHJlcXVpcmUoJy4vdXRpbHMvYnJvd3Nlci1tZXRyaWNzJyk7XG52YXIgU1ZHcyA9IHJlcXVpcmUoJy4vc3ZncycpO1xudmFyIFdpZGdldEJ1Y2tldCA9IHJlcXVpcmUoJy4vdXRpbHMvd2lkZ2V0LWJ1Y2tldCcpO1xuXG5mdW5jdGlvbiBzZXR1cEhlbHBlcihncm91cFNldHRpbmdzKSB7XG4gICAgaWYgKCFpc0Rpc21pc3NlZCgpICYmICFncm91cFNldHRpbmdzLmlzSGlkZVRhcEhlbHBlcigpICYmIEJyb3dzZXJNZXRyaWNzLnN1cHBvcnRzVG91Y2goKSkge1xuICAgICAgICB2YXIgcmFjdGl2ZSA9IFJhY3RpdmUoe1xuICAgICAgICAgICAgZWw6IFdpZGdldEJ1Y2tldC5nZXQoKSxcbiAgICAgICAgICAgIGFwcGVuZDogdHJ1ZSxcbiAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICBwb3NpdGlvblRvcDogZ3JvdXBTZXR0aW5ncy50YXBIZWxwZXJQb3NpdGlvbigpID09PSAndG9wJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlbXBsYXRlOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvdGFwLWhlbHBlci5oYnMuaHRtbCcpLFxuICAgICAgICAgICAgcGFydGlhbHM6IHtcbiAgICAgICAgICAgICAgICBsb2dvOiBTVkdzLmxvZ29cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJhY3RpdmUub24oJ2Rpc21pc3MnLCBkaXNtaXNzKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkaXNtaXNzKCkge1xuICAgICAgICByYWN0aXZlLnRlYXJkb3duKCk7XG4gICAgICAgIHNldERpc21pc3NlZCh0cnVlKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHNldERpc21pc3NlZChkaXNtaXNzZWQpIHtcbiAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnaGlkZURvdWJsZVRhcE1lc3NhZ2UnLCBkaXNtaXNzZWQpO1xufVxuXG5mdW5jdGlvbiBpc0Rpc21pc3NlZCgpIHtcbiAgICByZXR1cm4gbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ2hpZGVEb3VibGVUYXBNZXNzYWdlJyk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHNldHVwSGVscGVyOiBzZXR1cEhlbHBlclxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi91dGlscy9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciBSYWN0aXZlOyByZXF1aXJlKCcuL3V0aWxzL3JhY3RpdmUtcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24obG9hZGVkUmFjdGl2ZSkgeyBSYWN0aXZlID0gbG9hZGVkUmFjdGl2ZTt9KTtcbnZhciBUb3VjaFN1cHBvcnQgPSByZXF1aXJlKCcuL3V0aWxzL3RvdWNoLXN1cHBvcnQnKTtcblxudmFyIFBvcHVwV2lkZ2V0ID0gcmVxdWlyZSgnLi9wb3B1cC13aWRnZXQnKTtcbnZhciBSZWFjdGlvbnNXaWRnZXQgPSByZXF1aXJlKCcuL3JlYWN0aW9ucy13aWRnZXQnKTtcbnZhciBTVkdzID0gcmVxdWlyZSgnLi9zdmdzJyk7XG5cbnZhciBDTEFTU19BQ1RJVkUgPSAnYW50ZW5uYS1hY3RpdmUnO1xuXG5mdW5jdGlvbiBjcmVhdGVJbmRpY2F0b3JXaWRnZXQob3B0aW9ucykge1xuICAgIHZhciBjb250YWluZXJEYXRhID0gb3B0aW9ucy5jb250YWluZXJEYXRhO1xuICAgIHZhciAkY29udGFpbmVyRWxlbWVudCA9IG9wdGlvbnMuY29udGFpbmVyRWxlbWVudDtcbiAgICB2YXIgcGFnZURhdGEgPSBvcHRpb25zLnBhZ2VEYXRhO1xuICAgIHZhciBncm91cFNldHRpbmdzID0gb3B0aW9ucy5ncm91cFNldHRpbmdzO1xuICAgIHZhciBkZWZhdWx0UmVhY3Rpb25zID0gb3B0aW9ucy5kZWZhdWx0UmVhY3Rpb25zO1xuICAgIHZhciBjb29yZHMgPSBvcHRpb25zLmNvb3JkcztcbiAgICB2YXIgcmFjdGl2ZSA9IFJhY3RpdmUoe1xuICAgICAgICBlbDogJCgnPGRpdj4nKSwgLy8gdGhlIHJlYWwgcm9vdCBub2RlIGlzIGluIHRoZSB0ZW1wbGF0ZS4gaXQncyBleHRyYWN0ZWQgYWZ0ZXIgdGhlIHRlbXBsYXRlIGlzIHJlbmRlcmVkIGludG8gdGhpcyBkdW1teSBlbGVtZW50XG4gICAgICAgIGFwcGVuZDogdHJ1ZSxcbiAgICAgICAgbWFnaWM6IHRydWUsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIGNvbnRhaW5lckRhdGE6IGNvbnRhaW5lckRhdGEsXG4gICAgICAgICAgICBleHRyYUNsYXNzZXM6IGdyb3VwU2V0dGluZ3MuZW5hYmxlVGV4dEhlbHBlcigpID8gXCJcIiA6IFwiYW50ZW5uYS1ub2hpbnRcIlxuICAgICAgICB9LFxuICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL3RleHQtaW5kaWNhdG9yLXdpZGdldC5oYnMuaHRtbCcpLFxuICAgICAgICBwYXJ0aWFsczoge1xuICAgICAgICAgICAgbG9nbzogU1ZHcy5sb2dvU2VsZWN0YWJsZVxuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICB2YXIgcmVhY3Rpb25XaWRnZXRPcHRpb25zID0ge1xuICAgICAgICByZWFjdGlvbnNEYXRhOiBjb250YWluZXJEYXRhLnJlYWN0aW9ucyxcbiAgICAgICAgY29udGFpbmVyRGF0YTogY29udGFpbmVyRGF0YSxcbiAgICAgICAgY29udGFpbmVyRWxlbWVudDogJGNvbnRhaW5lckVsZW1lbnQsXG4gICAgICAgIGNvbnRlbnREYXRhOiB7IHR5cGU6ICd0ZXh0JyB9LFxuICAgICAgICBkZWZhdWx0UmVhY3Rpb25zOiBkZWZhdWx0UmVhY3Rpb25zLFxuICAgICAgICBwYWdlRGF0YTogcGFnZURhdGEsXG4gICAgICAgIGdyb3VwU2V0dGluZ3M6IGdyb3VwU2V0dGluZ3NcbiAgICB9O1xuXG4gICAgdmFyICRyb290RWxlbWVudCA9ICQocm9vdEVsZW1lbnQocmFjdGl2ZSkpO1xuICAgIGlmIChjb29yZHMpIHtcbiAgICAgICAgJHJvb3RFbGVtZW50LmNzcyh7XG4gICAgICAgICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcbiAgICAgICAgICAgIHRvcDogY29vcmRzLnRvcCAtICRyb290RWxlbWVudC5oZWlnaHQoKSxcbiAgICAgICAgICAgIGJvdHRvbTogY29vcmRzLmJvdHRvbSxcbiAgICAgICAgICAgIGxlZnQ6IGNvb3Jkcy5sZWZ0LFxuICAgICAgICAgICAgcmlnaHQ6IGNvb3Jkcy5yaWdodCxcbiAgICAgICAgICAgICd6LWluZGV4JzogMTAwMCAvLyBUT0RPOiBjb21wdXRlIGEgcmVhbCB2YWx1ZT9cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHZhciBob3ZlclRpbWVvdXQ7XG4gICAgdmFyIHRhcFN1cHBvcnQgPSBUb3VjaFN1cHBvcnQuc2V0dXBUYXAoJHJvb3RFbGVtZW50LmdldCgwKSwgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIG9wZW5SZWFjdGlvbnNXaW5kb3cocmVhY3Rpb25XaWRnZXRPcHRpb25zLCByYWN0aXZlKTtcbiAgICB9KTtcbiAgICAkcm9vdEVsZW1lbnQub24oJ21vdXNlZW50ZXIuYW50ZW5uYScsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGlmIChldmVudC5idXR0b25zID4gMCB8fCAoZXZlbnQuYnV0dG9ucyA9PSB1bmRlZmluZWQgJiYgZXZlbnQud2hpY2ggPiAwKSkgeyAvLyBPbiBTYWZhcmksIGV2ZW50LmJ1dHRvbnMgaXMgdW5kZWZpbmVkIGJ1dCBldmVudC53aGljaCBnaXZlcyBhIGdvb2QgdmFsdWUuIGV2ZW50LndoaWNoIGlzIGJhZCBvbiBGRlxuICAgICAgICAgICAgLy8gRG9uJ3QgcmVhY3QgaWYgdGhlIHVzZXIgaXMgZHJhZ2dpbmcgb3Igc2VsZWN0aW5nIHRleHQuXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY2xlYXJUaW1lb3V0KGhvdmVyVGltZW91dCk7IC8vIG9ubHkgb25lIHRpbWVvdXQgYXQgYSB0aW1lXG4gICAgICAgIGhvdmVyVGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAoY29udGFpbmVyRGF0YS5yZWFjdGlvbnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIG9wZW5SZWFjdGlvbnNXaW5kb3cocmVhY3Rpb25XaWRnZXRPcHRpb25zLCByYWN0aXZlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFyICRpY29uID0gJChyb290RWxlbWVudChyYWN0aXZlKSkuZmluZCgnLmFudGVubmEtbG9nbycpO1xuICAgICAgICAgICAgICAgIHZhciBvZmZzZXQgPSAkaWNvbi5vZmZzZXQoKTtcbiAgICAgICAgICAgICAgICB2YXIgY29vcmRpbmF0ZXMgPSB7XG4gICAgICAgICAgICAgICAgICAgIHRvcDogb2Zmc2V0LnRvcCArIE1hdGguZmxvb3IoJGljb24uaGVpZ2h0KCkgLyAyKSwgLy8gVE9ETyB0aGlzIG51bWJlciBpcyBhIGxpdHRsZSBvZmYgYmVjYXVzZSB0aGUgZGl2IGRvZXNuJ3QgdGlnaHRseSB3cmFwIHRoZSBpbnNlcnRlZCBmb250IGNoYXJhY3RlclxuICAgICAgICAgICAgICAgICAgICBsZWZ0OiBvZmZzZXQubGVmdCArIE1hdGguZmxvb3IoJGljb24ud2lkdGgoKSAvIDIpXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBQb3B1cFdpZGdldC5zaG93KGNvb3JkaW5hdGVzLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgb3BlblJlYWN0aW9uc1dpbmRvdyhyZWFjdGlvbldpZGdldE9wdGlvbnMsIHJhY3RpdmUpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCAyMDApO1xuICAgIH0pO1xuICAgICRyb290RWxlbWVudC5vbignbW91c2VsZWF2ZS5hbnRlbm5hJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIGNsZWFyVGltZW91dChob3ZlclRpbWVvdXQpO1xuICAgIH0pO1xuICAgICRjb250YWluZXJFbGVtZW50Lm9uKCdtb3VzZWVudGVyLmFudGVubmEnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgJHJvb3RFbGVtZW50LmFkZENsYXNzKENMQVNTX0FDVElWRSk7XG4gICAgfSk7XG4gICAgJGNvbnRhaW5lckVsZW1lbnQub24oJ21vdXNlbGVhdmUuYW50ZW5uYScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAkcm9vdEVsZW1lbnQucmVtb3ZlQ2xhc3MoQ0xBU1NfQUNUSVZFKTtcbiAgICB9KTtcbiAgICByZXR1cm4ge1xuICAgICAgICBlbGVtZW50OiAkcm9vdEVsZW1lbnQsXG4gICAgICAgIHRlYXJkb3duOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICRjb250YWluZXJFbGVtZW50Lm9mZignLmFudGVubmEnKTtcbiAgICAgICAgICAgIHJhY3RpdmUudGVhcmRvd24oKTtcbiAgICAgICAgICAgIHRhcFN1cHBvcnQudGVhcmRvd24oKTtcbiAgICAgICAgfVxuICAgIH07XG59XG5cbmZ1bmN0aW9uIHJvb3RFbGVtZW50KHJhY3RpdmUpIHtcbiAgICByZXR1cm4gcmFjdGl2ZS5maW5kKCcuYW50ZW5uYS10ZXh0LWluZGljYXRvci13aWRnZXQnKTtcbn1cblxuZnVuY3Rpb24gb3BlblJlYWN0aW9uc1dpbmRvdyhyZWFjdGlvbk9wdGlvbnMsIHJhY3RpdmUpIHtcbiAgICBSZWFjdGlvbnNXaWRnZXQub3BlbihyZWFjdGlvbk9wdGlvbnMsIHJvb3RFbGVtZW50KHJhY3RpdmUpKTtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZTogY3JlYXRlSW5kaWNhdG9yV2lkZ2V0XG59OyIsInZhciAkOyByZXF1aXJlKCcuL3V0aWxzL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIFBvcHVwV2lkZ2V0ID0gcmVxdWlyZSgnLi9wb3B1cC13aWRnZXQnKTtcbnZhciBSYW5nZSA9IHJlcXVpcmUoJy4vdXRpbHMvcmFuZ2UnKTtcbnZhciBSZWFjdGlvbnNXaWRnZXQgPSByZXF1aXJlKCcuL3JlYWN0aW9ucy13aWRnZXQnKTtcbnZhciBUb3VjaFN1cHBvcnQgPSByZXF1aXJlKCcuL3V0aWxzL3RvdWNoLXN1cHBvcnQnKTtcblxuXG5mdW5jdGlvbiBjcmVhdGVSZWFjdGFibGVUZXh0KG9wdGlvbnMpIHtcbiAgICAvLyBUT0RPOiBpbXBvc2UgYW4gdXBwZXIgbGltaXQgb24gdGhlIGxlbmd0aCBvZiB0ZXh0IHRoYXQgY2FuIGJlIHJlYWN0ZWQgdG8/IChhcHBsaWVzIHRvIHRoZSBpbmRpY2F0b3Itd2lkZ2V0IHRvbylcbiAgICB2YXIgJGNvbnRhaW5lckVsZW1lbnQgPSBvcHRpb25zLmNvbnRhaW5lckVsZW1lbnQ7XG4gICAgdmFyIGNvbnRhaW5lckRhdGEgPSBvcHRpb25zLmNvbnRhaW5lckRhdGE7XG4gICAgdmFyIGV4Y2x1ZGVOb2RlID0gb3B0aW9ucy5leGNsdWRlTm9kZTtcbiAgICB2YXIgcmVhY3Rpb25zV2lkZ2V0T3B0aW9ucyA9IHtcbiAgICAgICAgcmVhY3Rpb25zRGF0YTogW10sIC8vIEFsd2F5cyBvcGVuIHdpdGggdGhlIGRlZmF1bHQgcmVhY3Rpb25zXG4gICAgICAgIGNvbnRhaW5lckRhdGE6IGNvbnRhaW5lckRhdGEsXG4gICAgICAgIGNvbnRlbnREYXRhOiB7IHR5cGU6ICd0ZXh0JyB9LFxuICAgICAgICBjb250YWluZXJFbGVtZW50OiAkY29udGFpbmVyRWxlbWVudCxcbiAgICAgICAgZGVmYXVsdFJlYWN0aW9uczogb3B0aW9ucy5kZWZhdWx0UmVhY3Rpb25zLFxuICAgICAgICBwYWdlRGF0YTogb3B0aW9ucy5wYWdlRGF0YSxcbiAgICAgICAgZ3JvdXBTZXR0aW5nczogb3B0aW9ucy5ncm91cFNldHRpbmdzXG4gICAgfTtcblxuICAgIHZhciB0YXBFdmVudHMgPSBzZXR1cFRhcEV2ZW50cygkY29udGFpbmVyRWxlbWVudC5nZXQoMCksIHJlYWN0aW9uc1dpZGdldE9wdGlvbnMpO1xuICAgICRjb250YWluZXJFbGVtZW50Lm9uKCdtb3VzZXVwLmFudGVubmEnLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAvLyBOb3RlIHRoYXQgd2UgaGF2ZSB0byBkbyBhIHByZWVtcHRpdmUgY2hlY2sgaWYgdGhlIHBvcHVwIGlzIHNob3dpbmcgYmVjYXVzZSBvZiBhIHRpbWluZyBkaWZmZXJlbmNlIGluIFNhZmFyaS5cbiAgICAgICAgLy8gV2Ugd2VyZSBzZWVpbmcgdGhlIGRvY3VtZW50IGNsaWNrIGhhbmRsZXIgY2xvc2luZyB0aGUgcG9wdXAgd2hpbGUgdGhlIHNlbGVjdGlvbiB3YXMgYmVpbmcgY29tcHV0ZWQsIHdoaWNoXG4gICAgICAgIC8vIG1lYW50IHRoYXQgY2FsbGluZyBQb3B1cFdpZGdldC5zaG93IHdvdWxkIHRoaW5rIGl0IG5lZWRlZCB0byByZW9wZW4gdGhlIHBvcHVwIChpbnN0ZWFkIG9mIHF1aWV0bHkgZG9pbmcgbm90aGluZyBhcyBpdCBzaG91bGQpLlxuICAgICAgICBpZiAoY29udGFpbmVyRGF0YS5sb2FkZWQgJiYgIVBvcHVwV2lkZ2V0LmlzU2hvd2luZygpKSB7XG4gICAgICAgICAgICB2YXIgbm9kZSA9ICRjb250YWluZXJFbGVtZW50LmdldCgwKTtcbiAgICAgICAgICAgIHZhciBwb2ludCA9IFJhbmdlLmdldFNlbGVjdGlvbkVuZFBvaW50KG5vZGUsIGV2ZW50LCBleGNsdWRlTm9kZSk7XG4gICAgICAgICAgICBpZiAocG9pbnQpIHtcbiAgICAgICAgICAgICAgICB2YXIgY29vcmRpbmF0ZXMgPSB7dG9wOiBwb2ludC55LCBsZWZ0OiBwb2ludC54fTtcbiAgICAgICAgICAgICAgICBQb3B1cFdpZGdldC5zaG93KGNvb3JkaW5hdGVzLCBncmFiU2VsZWN0aW9uQW5kT3Blbihub2RlLCBjb29yZGluYXRlcywgcmVhY3Rpb25zV2lkZ2V0T3B0aW9ucywgZXhjbHVkZU5vZGUpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiB7XG4gICAgICAgIHRlYXJkb3duOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHRhcEV2ZW50cy50ZWFyZG93bigpO1xuICAgICAgICAgICAgJGNvbnRhaW5lckVsZW1lbnQub2ZmKCcuYW50ZW5uYScpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBncmFiU2VsZWN0aW9uQW5kT3Blbihub2RlLCBjb29yZGluYXRlcywgcmVhY3Rpb25zV2lkZ2V0T3B0aW9ucywgZXhjbHVkZU5vZGUpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgIFJhbmdlLmdyYWJTZWxlY3Rpb24obm9kZSwgZnVuY3Rpb24odGV4dCwgbG9jYXRpb24pIHtcbiAgICAgICAgICAgIHJlYWN0aW9uc1dpZGdldE9wdGlvbnMuY29udGVudERhdGEubG9jYXRpb24gPSBsb2NhdGlvbjtcbiAgICAgICAgICAgIHJlYWN0aW9uc1dpZGdldE9wdGlvbnMuY29udGVudERhdGEuYm9keSA9IHRleHQ7XG4gICAgICAgICAgICBSZWFjdGlvbnNXaWRnZXQub3BlbihyZWFjdGlvbnNXaWRnZXRPcHRpb25zLCBjb29yZGluYXRlcyk7XG4gICAgICAgIH0sIGV4Y2x1ZGVOb2RlKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGdyYWJOb2RlQW5kT3Blbihub2RlLCByZWFjdGlvbnNXaWRnZXRPcHRpb25zLCBjb29yZHMpIHtcbiAgICBSYW5nZS5ncmFiTm9kZShub2RlLCBmdW5jdGlvbih0ZXh0LCBsb2NhdGlvbikge1xuICAgICAgICByZWFjdGlvbnNXaWRnZXRPcHRpb25zLmNvbnRlbnREYXRhLmxvY2F0aW9uID0gbG9jYXRpb247XG4gICAgICAgIHJlYWN0aW9uc1dpZGdldE9wdGlvbnMuY29udGVudERhdGEuYm9keSA9IHRleHQ7XG4gICAgICAgIFJlYWN0aW9uc1dpZGdldC5vcGVuKHJlYWN0aW9uc1dpZGdldE9wdGlvbnMsIGNvb3Jkcyk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIHNldHVwVGFwRXZlbnRzKGVsZW1lbnQsIHJlYWN0aW9uc1dpZGdldE9wdGlvbnMpIHtcbiAgICByZXR1cm4gVG91Y2hTdXBwb3J0LnNldHVwVGFwKGVsZW1lbnQsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGlmICghUmVhY3Rpb25zV2lkZ2V0LmlzT3BlbigpICYmICQoZXZlbnQudGFyZ2V0KS5jbG9zZXN0KCdhLC5uby1hbnQnKS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIHZhciB0b3VjaCA9IGV2ZW50LmNoYW5nZWRUb3VjaGVzWzBdO1xuICAgICAgICAgICAgdmFyIGNvb3JkcyA9IHsgdG9wOiB0b3VjaC5wYWdlWSwgbGVmdDogdG91Y2gucGFnZVggfTtcbiAgICAgICAgICAgIGdyYWJOb2RlQW5kT3BlbihlbGVtZW50LCByZWFjdGlvbnNXaWRnZXRPcHRpb25zLCBjb29yZHMpO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGVSZWFjdGFibGVUZXh0OiBjcmVhdGVSZWFjdGFibGVUZXh0XG59OyIsInZhciBKU09OUENsaWVudCA9IHJlcXVpcmUoJy4vanNvbnAtY2xpZW50Jyk7XG52YXIgSlNPTlV0aWxzID0gcmVxdWlyZSgnLi9qc29uLXV0aWxzJyk7XG52YXIgTG9nZ2luZyA9IHJlcXVpcmUoJy4vbG9nZ2luZycpO1xudmFyIFVSTHMgPSByZXF1aXJlKCcuL3VybHMnKTtcbnZhciBVc2VyID0gcmVxdWlyZSgnLi91c2VyJyk7XG5cbmZ1bmN0aW9uIHBvc3ROZXdSZWFjdGlvbihyZWFjdGlvbkRhdGEsIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBjb250ZW50RGF0YSwgZ3JvdXBTZXR0aW5ncywgc3VjY2VzcywgZXJyb3IpIHtcbiAgICB2YXIgY29udGVudEJvZHkgPSBjb250ZW50RGF0YS5ib2R5O1xuICAgIHZhciBjb250ZW50VHlwZSA9IGNvbnRlbnREYXRhLnR5cGU7XG4gICAgdmFyIGNvbnRlbnRMb2NhdGlvbiA9IGNvbnRlbnREYXRhLmxvY2F0aW9uO1xuICAgIHZhciBjb250ZW50RGltZW5zaW9ucyA9IGNvbnRlbnREYXRhLmRpbWVuc2lvbnM7XG4gICAgVXNlci5mZXRjaFVzZXIoZ3JvdXBTZXR0aW5ncywgZnVuY3Rpb24odXNlckluZm8pIHtcbiAgICAgICAgLy8gVE9ETyBleHRyYWN0IHRoZSBzaGFwZSBvZiB0aGlzIGRhdGEgYW5kIHBvc3NpYmx5IHRoZSB3aG9sZSBBUEkgY2FsbFxuICAgICAgICB2YXIgZGF0YSA9IHtcbiAgICAgICAgICAgIHRhZzoge1xuICAgICAgICAgICAgICAgIGJvZHk6IHJlYWN0aW9uRGF0YS50ZXh0LFxuICAgICAgICAgICAgICAgIGlzX2RlZmF1bHQ6IHJlYWN0aW9uRGF0YS5pc0RlZmF1bHQgIT09IHVuZGVmaW5lZCAmJiByZWFjdGlvbkRhdGEuaXNEZWZhdWx0IC8vIGZhbHNlIHVubGVzcyBzcGVjaWZpZWRcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBoYXNoOiBjb250YWluZXJEYXRhLmhhc2gsXG4gICAgICAgICAgICB1c2VyX2lkOiB1c2VySW5mby51c2VyX2lkLFxuICAgICAgICAgICAgYW50X3Rva2VuOiB1c2VySW5mby5hbnRfdG9rZW4sXG4gICAgICAgICAgICBwYWdlX2lkOiBwYWdlRGF0YS5wYWdlSWQsXG4gICAgICAgICAgICBncm91cF9pZDogcGFnZURhdGEuZ3JvdXBJZCxcbiAgICAgICAgICAgIGNvbnRhaW5lcl9raW5kOiBjb250ZW50VHlwZSwgLy8gT25lIG9mICdwYWdlJywgJ3RleHQnLCAnbWVkaWEnLCAnaW1nJ1xuICAgICAgICAgICAgY29udGVudF9ub2RlX2RhdGE6IHtcbiAgICAgICAgICAgICAgICBib2R5OiBjb250ZW50Qm9keSxcbiAgICAgICAgICAgICAgICBraW5kOiBjb250ZW50VHlwZSxcbiAgICAgICAgICAgICAgICBpdGVtX3R5cGU6ICcnIC8vIFRPRE86IGxvb2tzIHVudXNlZCBidXQgVGFnSGFuZGxlciBibG93cyB1cCB3aXRob3V0IGl0LiBDdXJyZW50IGNsaWVudCBwYXNzZXMgaW4gXCJwYWdlXCIgZm9yIHBhZ2UgcmVhY3Rpb25zLlxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBpZiAoY29udGVudExvY2F0aW9uKSB7XG4gICAgICAgICAgICBkYXRhLmNvbnRlbnRfbm9kZV9kYXRhLmxvY2F0aW9uID0gY29udGVudExvY2F0aW9uO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjb250ZW50RGltZW5zaW9ucykge1xuICAgICAgICAgICAgZGF0YS5jb250ZW50X25vZGVfZGF0YS5oZWlnaHQgPSBjb250ZW50RGltZW5zaW9ucy5oZWlnaHQ7XG4gICAgICAgICAgICBkYXRhLmNvbnRlbnRfbm9kZV9kYXRhLndpZHRoID0gY29udGVudERpbWVuc2lvbnMud2lkdGg7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJlYWN0aW9uRGF0YS5pZCkge1xuICAgICAgICAgICAgZGF0YS50YWcuaWQgPSByZWFjdGlvbkRhdGEuaWQ7IC8vIFRPRE8gdGhlIGN1cnJlbnQgY2xpZW50IHNlbmRzIFwiLTEwMVwiIGlmIHRoZXJlJ3Mgbm8gaWQuIGlzIHRoaXMgbmVjZXNzYXJ5P1xuICAgICAgICB9XG4gICAgICAgIGdldEpTT05QKFVSTHMuY3JlYXRlUmVhY3Rpb25VcmwoKSwgZGF0YSwgbmV3UmVhY3Rpb25TdWNjZXNzKGNvbnRlbnRMb2NhdGlvbiwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIHN1Y2Nlc3MpLCBlcnJvcik7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIHBvc3RQbHVzT25lKHJlYWN0aW9uRGF0YSwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MsIHN1Y2Nlc3MsIGVycm9yKSB7XG4gICAgVXNlci5mZXRjaFVzZXIoZ3JvdXBTZXR0aW5ncywgZnVuY3Rpb24odXNlckluZm8pIHtcbiAgICAgICAgLy8gVE9ETyBleHRyYWN0IHRoZSBzaGFwZSBvZiB0aGlzIGRhdGEgYW5kIHBvc3NpYmx5IHRoZSB3aG9sZSBBUEkgY2FsbFxuICAgICAgICBpZiAoIXJlYWN0aW9uRGF0YS5jb250ZW50KSB7XG4gICAgICAgICAgICAvLyBUaGlzIGlzIGEgc3VtbWFyeSByZWFjdGlvbi4gU2VlIGlmIHdlIGhhdmUgYW55IGNvbnRhaW5lciBkYXRhIHRoYXQgd2UgY2FuIGxpbmsgdG8gaXQuXG4gICAgICAgICAgICB2YXIgY29udGFpbmVyUmVhY3Rpb25zID0gY29udGFpbmVyRGF0YS5yZWFjdGlvbnM7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvbnRhaW5lclJlYWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBjb250YWluZXJSZWFjdGlvbiA9IGNvbnRhaW5lclJlYWN0aW9uc1tpXTtcbiAgICAgICAgICAgICAgICBpZiAoY29udGFpbmVyUmVhY3Rpb24uaWQgPT09IHJlYWN0aW9uRGF0YS5pZCkge1xuICAgICAgICAgICAgICAgICAgICByZWFjdGlvbkRhdGEucGFyZW50SUQgPSBjb250YWluZXJSZWFjdGlvbi5wYXJlbnRJRDtcbiAgICAgICAgICAgICAgICAgICAgcmVhY3Rpb25EYXRhLmNvbnRlbnQgPSBjb250YWluZXJSZWFjdGlvbi5jb250ZW50O1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGRhdGEgPSB7XG4gICAgICAgICAgICB0YWc6IHtcbiAgICAgICAgICAgICAgICBib2R5OiByZWFjdGlvbkRhdGEudGV4dCxcbiAgICAgICAgICAgICAgICBpZDogcmVhY3Rpb25EYXRhLmlkXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaGFzaDogY29udGFpbmVyRGF0YS5oYXNoLFxuICAgICAgICAgICAgdXNlcl9pZDogdXNlckluZm8udXNlcl9pZCxcbiAgICAgICAgICAgIGFudF90b2tlbjogdXNlckluZm8uYW50X3Rva2VuLFxuICAgICAgICAgICAgcGFnZV9pZDogcGFnZURhdGEucGFnZUlkLFxuICAgICAgICAgICAgZ3JvdXBfaWQ6IHBhZ2VEYXRhLmdyb3VwSWQsXG4gICAgICAgICAgICBjb250YWluZXJfa2luZDogY29udGFpbmVyRGF0YS50eXBlLCAvLyAncGFnZScsICd0ZXh0JywgJ21lZGlhJywgJ2ltZydcbiAgICAgICAgICAgIGNvbnRlbnRfbm9kZV9kYXRhOiB7XG4gICAgICAgICAgICAgICAgYm9keTogJycsIC8vIFRPRE86IGRvIHdlIG5lZWQgdGhpcyBmb3IgKzFzPyBsb29rcyBsaWtlIG9ubHkgdGhlIGlkIGZpZWxkIGlzIHVzZWQsIGlmIG9uZSBpcyBzZXRcbiAgICAgICAgICAgICAgICBraW5kOiBjb250ZW50Tm9kZURhdGFLaW5kKGNvbnRhaW5lckRhdGEudHlwZSksXG4gICAgICAgICAgICAgICAgaXRlbV90eXBlOiAnJyAvLyBUT0RPOiBsb29rcyB1bnVzZWQgYnV0IFRhZ0hhbmRsZXIgYmxvd3MgdXAgd2l0aG91dCBpdFxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBpZiAocmVhY3Rpb25EYXRhLmNvbnRlbnQpIHtcbiAgICAgICAgICAgIGRhdGEuY29udGVudF9ub2RlX2RhdGEuaWQgPSByZWFjdGlvbkRhdGEuY29udGVudC5pZDtcbiAgICAgICAgICAgIGRhdGEuY29udGVudF9ub2RlX2RhdGEubG9jYXRpb24gPSByZWFjdGlvbkRhdGEuY29udGVudC5sb2NhdGlvbjtcbiAgICAgICAgfVxuICAgICAgICAvLyBUT0RPOiBzaG91bGQgd2UgYmFpbCBpZiB0aGVyZSdzIG5vIHBhcmVudCBJRD8gSXQncyBub3QgcmVhbGx5IGEgKzEgd2l0aG91dCBvbmUuXG4gICAgICAgIGlmIChyZWFjdGlvbkRhdGEucGFyZW50SUQpIHtcbiAgICAgICAgICAgIGRhdGEudGFnLnBhcmVudF9pZCA9IHJlYWN0aW9uRGF0YS5wYXJlbnRJRDtcbiAgICAgICAgfVxuICAgICAgICBnZXRKU09OUChVUkxzLmNyZWF0ZVJlYWN0aW9uVXJsKCksIGRhdGEsIHBsdXNPbmVTdWNjZXNzKHJlYWN0aW9uRGF0YSwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIHN1Y2Nlc3MpLCBlcnJvcik7XG4gICAgfSk7XG59XG5cbi8vIFRPRE86IFdlIG5lZWQgdG8gcmV2aWV3IHRoZSBBUEkgc28gdGhhdCBpdCByZXR1cm5zL2FjY2VwdHMgYSB1bmlmb3JtIHNldCBvZiB2YWx1ZXMuXG5mdW5jdGlvbiBjb250ZW50Tm9kZURhdGFLaW5kKHR5cGUpIHtcbiAgICBpZiAodHlwZSA9PT0gJ2ltYWdlJykge1xuICAgICAgICByZXR1cm4gJ2ltZyc7XG4gICAgfVxuICAgIHJldHVybiB0eXBlO1xufVxuXG5mdW5jdGlvbiBwbHVzT25lU3VjY2VzcyhyZWFjdGlvbkRhdGEsIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBjYWxsYmFjaykge1xuICAgIHJldHVybiBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICB2YXIgcmVhY3Rpb25DcmVhdGVkID0gIXJlc3BvbnNlLmV4aXN0aW5nO1xuICAgICAgICBpZiAocmVhY3Rpb25DcmVhdGVkKSB7XG4gICAgICAgICAgICAvLyBUT0RPOiB3ZSBzaG91bGQgZ2V0IGJhY2sgYSByZXNwb25zZSB3aXRoIGRhdGEgaW4gdGhlIFwibmV3IGZvcm1hdFwiIGFuZCB1cGRhdGUgdGhlIG1vZGVsIGZyb20gdGhlIHJlc3BvbnNlXG4gICAgICAgICAgICByZWFjdGlvbkRhdGEuY291bnQgPSByZWFjdGlvbkRhdGEuY291bnQgKyAxO1xuICAgICAgICAgICAgY29udGFpbmVyRGF0YS5yZWFjdGlvblRvdGFsID0gY29udGFpbmVyRGF0YS5yZWFjdGlvblRvdGFsICsgMTtcbiAgICAgICAgICAgIHBhZ2VEYXRhLnN1bW1hcnlUb3RhbCA9IHBhZ2VEYXRhLnN1bW1hcnlUb3RhbCArIDE7XG4gICAgICAgICAgICBjb250YWluZXJEYXRhLnJlYWN0aW9ucy5zb3J0KGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYi5jb3VudCAtIGEuY291bnQ7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBjYWxsYmFjayhyZWFjdGlvbkRhdGEsIHJlc3BvbnNlLmV4aXN0aW5nKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIG5ld1JlYWN0aW9uU3VjY2Vzcyhjb250ZW50TG9jYXRpb24sIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBjYWxsYmFjaykge1xuICAgIHJldHVybiBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAvLyBUT0RPOiBDYW4gcmVzcG9uc2UuZXhpc3RpbmcgZXZlciBjb21lIGJhY2sgdHJ1ZSBmb3IgYSAnbmV3JyByZWFjdGlvbj8gU2hvdWxkIHdlIGJlaGF2ZSBhbnkgZGlmZmVyZW50bHkgaWYgaXQgZG9lcz9cbiAgICAgICAgdmFyIHJlYWN0aW9uID0gcmVhY3Rpb25Gcm9tUmVzcG9uc2UocmVzcG9uc2UsIGNvbnRlbnRMb2NhdGlvbik7XG4gICAgICAgIGNhbGxiYWNrKHJlYWN0aW9uKTtcbiAgICB9O1xufVxuXG5mdW5jdGlvbiByZWFjdGlvbkZyb21SZXNwb25zZShyZXNwb25zZSwgY29udGVudExvY2F0aW9uKSB7XG4gICAgLy8gVE9ETzogdGhlIHNlcnZlciBzaG91bGQgZ2l2ZSB1cyBiYWNrIGEgcmVhY3Rpb24gbWF0Y2hpbmcgdGhlIG5ldyBBUEkgZm9ybWF0LlxuICAgIC8vICAgICAgIHdlJ3JlIGp1c3QgZmFraW5nIGl0IG91dCBmb3Igbm93OyB0aGlzIGNvZGUgaXMgdGVtcG9yYXJ5XG4gICAgdmFyIHJlYWN0aW9uID0ge1xuICAgICAgICB0ZXh0OiByZXNwb25zZS5pbnRlcmFjdGlvbi5pbnRlcmFjdGlvbl9ub2RlLmJvZHksXG4gICAgICAgIGlkOiByZXNwb25zZS5pbnRlcmFjdGlvbi5pbnRlcmFjdGlvbl9ub2RlLmlkLFxuICAgICAgICBjb3VudDogMSxcbiAgICAgICAgcGFyZW50SUQ6IHJlc3BvbnNlLmludGVyYWN0aW9uLmlkLFxuICAgICAgICBhcHByb3ZlZDogcmVzcG9uc2UuYXBwcm92ZWQgPT09IHVuZGVmaW5lZCB8fCByZXNwb25zZS5hcHByb3ZlZFxuICAgIH07XG4gICAgaWYgKHJlc3BvbnNlLmNvbnRlbnRfbm9kZSkge1xuICAgICAgICByZWFjdGlvbi5jb250ZW50ID0ge1xuICAgICAgICAgICAgaWQ6IHJlc3BvbnNlLmNvbnRlbnRfbm9kZS5pZCxcbiAgICAgICAgICAgIGtpbmQ6IHJlc3BvbnNlLmNvbnRlbnRfbm9kZS5raW5kLFxuICAgICAgICAgICAgYm9keTogcmVzcG9uc2UuY29udGVudF9ub2RlLmJvZHlcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKHJlc3BvbnNlLmNvbnRlbnRfbm9kZS5sb2NhdGlvbikge1xuICAgICAgICAgICAgcmVhY3Rpb24uY29udGVudC5sb2NhdGlvbiA9IHJlc3BvbnNlLmNvbnRlbnRfbm9kZS5sb2NhdGlvbjtcbiAgICAgICAgfSBlbHNlIGlmIChjb250ZW50TG9jYXRpb24pIHtcbiAgICAgICAgICAgIC8vIFRPRE86IGVuc3VyZSB0aGF0IHRoZSBBUEkgYWx3YXlzIHJldHVybnMgYSBsb2NhdGlvbiBhbmQgcmVtb3ZlIHRoZSBcImNvbnRlbnRMb2NhdGlvblwiIHRoYXQncyBiZWluZyBwYXNzZWQgYXJvdW5kLlxuICAgICAgICAgICAgLy8gRm9yIG5vdywganVzdCBwYXRjaCB0aGUgcmVzcG9uc2Ugd2l0aCB0aGUgZGF0YSB3ZSBrbm93IHdlIHNlbnQgb3Zlci5cbiAgICAgICAgICAgIHJlYWN0aW9uLmNvbnRlbnQubG9jYXRpb24gPSBjb250ZW50TG9jYXRpb247XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlYWN0aW9uO1xufVxuXG5mdW5jdGlvbiBmZXRjaExvY2F0aW9uRGV0YWlscyhyZWFjdGlvbkxvY2F0aW9uRGF0YSwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MsIHN1Y2Nlc3NDYWxsYmFjaywgZXJyb3JDYWxsYmFjaykge1xuICAgIHZhciBjb250ZW50SURzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMocmVhY3Rpb25Mb2NhdGlvbkRhdGEpO1xuICAgIFVzZXIuZmV0Y2hVc2VyKGdyb3VwU2V0dGluZ3MsIGZ1bmN0aW9uKHVzZXJJbmZvKSB7XG4gICAgICAgIHZhciBkYXRhID0ge1xuICAgICAgICAgICAgdXNlcl9pZDogdXNlckluZm8udXNlcl9pZCxcbiAgICAgICAgICAgIGFudF90b2tlbjogdXNlckluZm8uYW50X3Rva2VuLFxuICAgICAgICAgICAgY29udGVudF9pZHM6IGNvbnRlbnRJRHNcbiAgICAgICAgfTtcbiAgICAgICAgZ2V0SlNPTlAoVVJMcy5mZXRjaENvbnRlbnRCb2RpZXNVcmwoKSwgZGF0YSwgc3VjY2Vzc0NhbGxiYWNrLCBlcnJvckNhbGxiYWNrKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gcG9zdFNoYXJlUmVhY3Rpb24ocmVhY3Rpb25EYXRhLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncywgc3VjY2VzcywgZmFpbHVyZSkge1xuICAgIFVzZXIuZmV0Y2hVc2VyKGdyb3VwU2V0dGluZ3MsIGZ1bmN0aW9uKHVzZXJJbmZvKSB7XG4gICAgICAgIHZhciBjb250ZW50RGF0YSA9IHJlYWN0aW9uRGF0YS5jb250ZW50O1xuICAgICAgICB2YXIgZGF0YSA9IHtcbiAgICAgICAgICAgIHRhZzogeyAvLyBUT0RPOiB3aHkgZG9lcyB0aGUgU2hhcmVIYW5kbGVyIGNyZWF0ZSBhIHJlYWN0aW9uIGlmIGl0IGRvZXNuJ3QgZXhpc3Q/IEhvdyBjYW4geW91IHNoYXJlIGEgcmVhY3Rpb24gdGhhdCBoYXNuJ3QgaGFwcGVuZWQ/XG4gICAgICAgICAgICAgICAgaWQ6IHJlYWN0aW9uRGF0YS5pZCxcbiAgICAgICAgICAgICAgICBib2R5OiByZWFjdGlvbkRhdGEudGV4dFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGhhc2g6IGNvbnRhaW5lckRhdGEuaGFzaCxcbiAgICAgICAgICAgIGNvbnRhaW5lcl9raW5kOiBjb250YWluZXJEYXRhLnR5cGUsXG4gICAgICAgICAgICBjb250ZW50X25vZGVfZGF0YTogeyAvLyBUT0RPOiB3aHkgZG9lcyB0aGUgU2hhcmVIYW5kbGVyIGNyZWF0ZSBhIGNvbnRlbnQgaWYgaXQgZG9lc24ndCBleGlzdD8gSG93IGNhbiB5b3Ugc2hhcmUgYSByZWFjdGlvbiB0aGF0IGhhc24ndCBoYXBwZW5lZD9cbiAgICAgICAgICAgICAgICBpZDogY29udGVudERhdGEuaWQsXG4gICAgICAgICAgICAgICAgYm9keTogY29udGVudERhdGEudGV4dCxcbiAgICAgICAgICAgICAgICBsb2NhdGlvbjogY29udGVudERhdGEubG9jYXRpb24sXG4gICAgICAgICAgICAgICAga2luZDogY29udGVudE5vZGVEYXRhS2luZChjb250YWluZXJEYXRhLnR5cGUpXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdXNlcl9pZDogdXNlckluZm8udXNlcl9pZCxcbiAgICAgICAgICAgIGFudF90b2tlbjogdXNlckluZm8uYW50X3Rva2VuLFxuICAgICAgICAgICAgZ3JvdXBfaWQ6IHBhZ2VEYXRhLmdyb3VwSWQsXG4gICAgICAgICAgICBwYWdlX2lkOiBwYWdlRGF0YS5wYWdlSWQsXG4gICAgICAgICAgICByZWZlcnJpbmdfaW50X2lkOiByZWFjdGlvbkRhdGEucGFyZW50SURcbiAgICAgICAgfTtcbiAgICAgICAgZ2V0SlNPTlAoVVJMcy5zaGFyZVJlYWN0aW9uVXJsKCksIGRhdGEsIHN1Y2Nlc3MsIGZhaWx1cmUpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBnZXRKU09OUCh1cmwsIGRhdGEsIHN1Y2Nlc3MsIGVycm9yKSB7XG4gICAgdmFyIGJhc2VVcmwgPSBVUkxzLmFwcFNlcnZlclVybCgpO1xuICAgIGRvR2V0SlNPTlAoYmFzZVVybCwgdXJsLCBkYXRhLCBzdWNjZXNzLCBlcnJvcik7XG59XG5cbmZ1bmN0aW9uIHBvc3RFdmVudChldmVudCkge1xuICAgIHZhciBiYXNlVXJsID0gVVJMcy5ldmVudHNTZXJ2ZXJVcmwoKTtcbiAgICBkb0dldEpTT05QKGJhc2VVcmwsIFVSTHMuZXZlbnRVcmwoKSwgZXZlbnQsIGZ1bmN0aW9uKCkgeyAvKnN1Y2Nlc3MqLyB9LCBmdW5jdGlvbihlcnJvcikge1xuICAgICAgICAvLyBUT0RPOiBlcnJvciBoYW5kbGluZ1xuICAgICAgICBMb2dnaW5nLmRlYnVnTWVzc2FnZSgnQW4gZXJyb3Igb2NjdXJyZWQgcG9zdGluZyBldmVudDogJywgZXJyb3IpO1xuICAgIH0pO1xufVxuXG4vLyBJc3N1ZXMgYSBKU09OUCByZXF1ZXN0IHRvIGEgZ2l2ZW4gc2VydmVyLiBUbyBzZW5kIGEgcmVxdWVzdCB0byB0aGUgYXBwbGljYXRpb24gc2VydmVyLCB1c2UgZ2V0SlNPTlAgaW5zdGVhZC5cbmZ1bmN0aW9uIGRvR2V0SlNPTlAoYmFzZVVybCwgdXJsLCBwYXJhbXMsIHN1Y2Nlc3MsIGVycm9yKSB7XG4gICAgSlNPTlBDbGllbnQuZG9HZXRKU09OUChiYXNlVXJsLCB1cmwsIHBhcmFtcywgc3VjY2VzcywgZXJyb3IpO1xufVxuXG5mdW5jdGlvbiBwb3N0VHJhY2tpbmdFdmVudChldmVudCkge1xuICAgIHZhciBiYXNlVXJsID0gVVJMcy5ldmVudHNTZXJ2ZXJVcmwoKTtcbiAgICB2YXIgdHJhY2tpbmdVcmwgPSBiYXNlVXJsICsgVVJMcy5ldmVudFVybCgpICsgJy9ldmVudC5naWYnO1xuICAgIGlmIChldmVudCkge1xuICAgICAgICB0cmFja2luZ1VybCArPSAnP2pzb249JyArIGVuY29kZVVSSShKU09OVXRpbHMuc3RyaW5naWZ5KGV2ZW50KSk7XG4gICAgfVxuICAgIHZhciBpbWFnZVRhZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2ltZycpO1xuICAgIGltYWdlVGFnLnNldEF0dHJpYnV0ZSgnaGVpZ2h0JywgMSk7XG4gICAgaW1hZ2VUYWcuc2V0QXR0cmlidXRlKCd3aWR0aCcsIDEpO1xuICAgIGltYWdlVGFnLnNldEF0dHJpYnV0ZSgnc3JjJywgdHJhY2tpbmdVcmwpO1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdib2R5JylbMF0uYXBwZW5kQ2hpbGQoaW1hZ2VUYWcpO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgZ2V0SlNPTlA6IGdldEpTT05QLFxuICAgIHBvc3RQbHVzT25lOiBwb3N0UGx1c09uZSxcbiAgICBwb3N0TmV3UmVhY3Rpb246IHBvc3ROZXdSZWFjdGlvbixcbiAgICBwb3N0U2hhcmVSZWFjdGlvbjogcG9zdFNoYXJlUmVhY3Rpb24sXG4gICAgZmV0Y2hMb2NhdGlvbkRldGFpbHM6IGZldGNoTG9jYXRpb25EZXRhaWxzLFxuICAgIHBvc3RFdmVudDogcG9zdEV2ZW50LFxuICAgIHBvc3RUcmFja2luZ0V2ZW50OiBwb3N0VHJhY2tpbmdFdmVudFxufTsiLCJ2YXIgVVJMQ29uc3RhbnRzID0gcmVxdWlyZSgnLi91cmwtY29uc3RhbnRzJyk7XG52YXIgVVJMUGFyYW1zID0gcmVxdWlyZSgnLi91cmwtcGFyYW1zJyk7XG5cbmZ1bmN0aW9uIGNvbXB1dGVDdXJyZW50U2NyaXB0U3JjKCkge1xuICAgIGlmIChkb2N1bWVudC5jdXJyZW50U2NyaXB0KSB7XG4gICAgICAgIHJldHVybiBkb2N1bWVudC5jdXJyZW50U2NyaXB0LnNyYztcbiAgICB9XG4gICAgLy8gSUUgZmFsbGJhY2suLi5cbiAgICB2YXIgc2NyaXB0cyA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdzY3JpcHQnKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNjcmlwdHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIHNjcmlwdCA9IHNjcmlwdHNbaV07XG4gICAgICAgIGlmIChzY3JpcHQuaGFzQXR0cmlidXRlKCdzcmMnKSkge1xuICAgICAgICAgICAgdmFyIHNjcmlwdFNyYyA9IHNjcmlwdC5nZXRBdHRyaWJ1dGUoJ3NyYycpO1xuICAgICAgICAgICAgdmFyIGFudGVubmFTY3JpcHRzID0gWyAnYW50ZW5uYS5qcycsICdhbnRlbm5hLm1pbi5qcycsICdlbmdhZ2UuanMnLCAnZW5nYWdlX2Z1bGwuanMnIF07XG4gICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGFudGVubmFTY3JpcHRzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNjcmlwdFNyYy5pbmRleE9mKGFudGVubmFTY3JpcHRzW2pdKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNjcmlwdFNyYztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbnZhciBjdXJyZW50U2NyaXB0U3JjID0gY29tcHV0ZUN1cnJlbnRTY3JpcHRTcmMoKSB8fCAnJztcblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIG9mZmxpbmU6IGN1cnJlbnRTY3JpcHRTcmMuaW5kZXhPZihVUkxDb25zdGFudHMuREVWRUxPUE1FTlQpICE9PSAtMSB8fCBjdXJyZW50U2NyaXB0U3JjLmluZGV4T2YoVVJMQ29uc3RhbnRzLlRFU1QpICE9PSAtMSxcbiAgICB0ZXN0OiBjdXJyZW50U2NyaXB0U3JjLmluZGV4T2YoVVJMQ29uc3RhbnRzLlRFU1QpICE9PSAtMSxcbiAgICBkZWJ1ZzogVVJMUGFyYW1zLmdldFVybFBhcmFtKCdhbnRlbm5hRGVidWcnKSA9PT0gJ3RydWUnXG59OyIsIlxudmFyIGlzVG91Y2hCcm93c2VyO1xudmFyIGlzTW9iaWxlRGV2aWNlO1xuXG5mdW5jdGlvbiBzdXBwb3J0c1RvdWNoKCkge1xuICAgIGlmIChpc1RvdWNoQnJvd3NlciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIC8vaXNUb3VjaEJyb3dzZXIgPSAobmF2aWdhdG9yLm1zTWF4VG91Y2hQb2ludHMgfHwgXCJvbnRvdWNoc3RhcnRcIiBpbiB3aW5kb3cpICYmICgod2luZG93Lm1hdGNoTWVkaWEoXCJvbmx5IHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpXCIpKS5tYXRjaGVzKTtcbiAgICAgICAgaXNUb3VjaEJyb3dzZXIgPSBcIm9udG91Y2hzdGFydFwiIGluIHdpbmRvdztcbiAgICB9XG4gICAgcmV0dXJuIGlzVG91Y2hCcm93c2VyO1xufVxuXG5mdW5jdGlvbiBpc01vYmlsZSgpIHtcbiAgICBpZiAoaXNNb2JpbGVEZXZpY2UgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBpc01vYmlsZURldmljZSA9IHN1cHBvcnRzVG91Y2goKSAmJlxuICAgICAgICAgICAgKCh3aW5kb3cubWF0Y2hNZWRpYShcInNjcmVlbiBhbmQgKG1heC1kZXZpY2Utd2lkdGg6IDQ4MHB4KSBhbmQgKG9yaWVudGF0aW9uOiBwb3J0cmFpdClcIikpLm1hdGNoZXMgfHxcbiAgICAgICAgICAgICh3aW5kb3cubWF0Y2hNZWRpYShcInNjcmVlbiBhbmQgKG1heC1kZXZpY2Utd2lkdGg6IDc2OHB4KSBhbmQgKG9yaWVudGF0aW9uOiBsYW5kc2NhcGUpXCIpKS5tYXRjaGVzKTtcbiAgICB9XG4gICAgcmV0dXJuIGlzTW9iaWxlRGV2aWNlO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBzdXBwb3J0c1RvdWNoOiBzdXBwb3J0c1RvdWNoLFxuICAgIGlzTW9iaWxlOiBpc01vYmlsZVxufTsiLCJcbi8vIFJlLXVzYWJsZSBzdXBwb3J0IGZvciBtYW5hZ2luZyBhIGNvbGxlY3Rpb24gb2YgY2FsbGJhY2sgZnVuY3Rpb25zLlxuXG52YXIgYW50dWlkID0gMDsgLy8gXCJnbG9iYWxseVwiIHVuaXF1ZSBJRCB0aGF0IHdlIHVzZSB0byB0YWcgY2FsbGJhY2sgZnVuY3Rpb25zIGZvciBsYXRlciByZXRyaWV2YWwuIChUaGlzIGlzIGhvdyBcIm9mZlwiIHdvcmtzLilcblxuZnVuY3Rpb24gY3JlYXRlQ2FsbGJhY2tzKCkge1xuXG4gICAgdmFyIGNhbGxiYWNrcyA9IHt9O1xuXG4gICAgZnVuY3Rpb24gYWRkQ2FsbGJhY2soY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKGNhbGxiYWNrLmFudHVpZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBjYWxsYmFjay5hbnR1aWQgPSBhbnR1aWQrKztcbiAgICAgICAgfVxuICAgICAgICBjYWxsYmFja3NbY2FsbGJhY2suYW50dWlkXSA9IGNhbGxiYWNrO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJlbW92ZUNhbGxiYWNrKGNhbGxiYWNrKSB7XG4gICAgICAgIGlmIChjYWxsYmFjay5hbnR1aWQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgZGVsZXRlIGNhbGxiYWNrc1tjYWxsYmFjay5hbnR1aWRdO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0Q2FsbGJhY2tzKCkge1xuICAgICAgICB2YXIgYWxsQ2FsbGJhY2tzID0gW107XG4gICAgICAgIGZvciAodmFyIGtleSBpbiBjYWxsYmFja3MpIHtcbiAgICAgICAgICAgIGlmIChjYWxsYmFja3MuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgICAgIGFsbENhbGxiYWNrcy5wdXNoKGNhbGxiYWNrc1trZXldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYWxsQ2FsbGJhY2tzO1xuICAgIH1cblxuICAgIC8vIENvbnZlbmllbmNlIGZ1bmN0aW9uIHRoYXQgaW52b2tlcyBhbGwgY2FsbGJhY2tzIHdpdGggbm8gcGFyYW1ldGVycy4gQW55IGNhbGxiYWNrcyB0aGF0IG5lZWQgcGFyYW1zIGNhbiBiZSBjYWxsZWRcbiAgICAvLyBieSBjbGllbnRzIHVzaW5nIGdldENhbGxiYWNrcygpXG4gICAgZnVuY3Rpb24gaW52b2tlQWxsKCkge1xuICAgICAgICB2YXIgY2FsbGJhY2tzID0gZ2V0Q2FsbGJhY2tzKCk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2FsbGJhY2tzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjYWxsYmFja3NbaV0oKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGlzRW1wdHkoKSB7XG4gICAgICAgIHJldHVybiBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhjYWxsYmFja3MpLmxlbmd0aCA9PT0gMDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB0ZWFyZG93bigpIHtcbiAgICAgICAgY2FsbGJhY2tzID0ge307XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgYWRkOiBhZGRDYWxsYmFjayxcbiAgICAgICAgcmVtb3ZlOiByZW1vdmVDYWxsYmFjayxcbiAgICAgICAgZ2V0OiBnZXRDYWxsYmFja3MsXG4gICAgICAgIGlzRW1wdHk6IGlzRW1wdHksXG4gICAgICAgIGludm9rZUFsbDogaW52b2tlQWxsLFxuICAgICAgICB0ZWFyZG93bjogdGVhcmRvd25cbiAgICB9XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGU6IGNyZWF0ZUNhbGxiYWNrc1xufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciBNRDUgPSByZXF1aXJlKCcuL21kNScpO1xuXG5mdW5jdGlvbiBnZXRDbGVhblRleHQoJGVsZW1lbnQpIHtcbiAgICB2YXIgJGNsb25lID0gJGVsZW1lbnQuY2xvbmUoKTtcbiAgICAvLyBSZW1vdmUgYW55IGVsZW1lbnRzIHRoYXQgd2UgZG9uJ3Qgd2FudCBpbmNsdWRlZCBpbiB0aGUgdGV4dCBjYWxjdWxhdGlvblxuICAgICRjbG9uZS5maW5kKCdpZnJhbWUsIGltZywgc2NyaXB0LCB2aWRlbywgLmFudGVubmEsIC5uby1hbnQnKS5yZW1vdmUoKS5lbmQoKTtcbiAgICAvLyBUaGVuIG1hbnVhbGx5IGNvbnZlcnQgYW55IDxicj4gdGFncyBpbnRvIHNwYWNlcyAob3RoZXJ3aXNlLCB3b3JkcyB3aWxsIGdldCBhcHBlbmRlZCBieSB0aGUgdGV4dCgpIGNhbGwpXG4gICAgdmFyIGh0bWwgPSAkY2xvbmUuaHRtbCgpLnJlcGxhY2UoLzxcXFNiclxcU1xcLz8+L2dpLCAnICcpO1xuICAgIC8vIFB1dCB0aGUgSFRNTCBiYWNrIGludG8gYSBkaXYgYW5kIGNhbGwgdGV4dCgpLCB3aGljaCBkb2VzIG1vc3Qgb2YgdGhlIGhlYXZ5IGxpZnRpbmdcbiAgICB2YXIgdGV4dCA9ICQoJzxkaXY+JyArIGh0bWwgKyAnPC9kaXY+JykudGV4dCgpLnRvTG93ZXJDYXNlKCkudHJpbSgpO1xuICAgIHRleHQgPSB0ZXh0LnJlcGxhY2UoL1tcXG5cXHJcXHRdL2dpLCAnICcpOyAvLyBSZXBsYWNlIGFueSBuZXdsaW5lcy90YWJzIHdpdGggc3BhY2VzXG4gICAgcmV0dXJuIHRleHQ7XG59XG5cbmZ1bmN0aW9uIGhhc2hUZXh0KGVsZW1lbnQsIHN1ZmZpeCkge1xuICAgIHZhciB0ZXh0ID0gZ2V0Q2xlYW5UZXh0KGVsZW1lbnQpO1xuICAgIGlmICh0ZXh0KSB7XG4gICAgICAgIHZhciBoYXNoVGV4dCA9IFwicmRyLXRleHQtXCIgKyB0ZXh0O1xuICAgICAgICBpZiAoc3VmZml4ICE9PSB1bmRlZmluZWQpIHsgLy8gQXBwZW5kIHRoZSBvcHRpb25hbCBzdWZmaXhcbiAgICAgICAgICAgIGhhc2hUZXh0ICs9ICctJyArIHN1ZmZpeDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gTUQ1LmhleF9tZDUoaGFzaFRleHQpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gaGFzaFVybCh1cmwpIHtcbiAgICByZXR1cm4gTUQ1LmhleF9tZDUodXJsKTtcbn1cblxuZnVuY3Rpb24gaGFzaEltYWdlKGltYWdlVXJsLCBncm91cFNldHRpbmdzKSB7XG4gICAgaWYgKGltYWdlVXJsICYmIGltYWdlVXJsLmxlbmd0aCA+IDApIHtcbiAgICAgICAgaW1hZ2VVcmwgPSBmaWRkbGVXaXRoSW1hZ2VBbmRNZWRpYVVybHMoaW1hZ2VVcmwsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICB2YXIgaGFzaFRleHQgPSAncmRyLWltZy0nICsgaW1hZ2VVcmw7XG4gICAgICAgIHJldHVybiBNRDUuaGV4X21kNShoYXNoVGV4dCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBoYXNoTWVkaWEobWVkaWFVcmwsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICBpZiAobWVkaWFVcmwgJiYgbWVkaWFVcmwubGVuZ3RoID4gMCkge1xuICAgICAgICBtZWRpYVVybCA9IGZpZGRsZVdpdGhJbWFnZUFuZE1lZGlhVXJscyhtZWRpYVVybCwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIHZhciBoYXNoVGV4dCA9ICdyZHItbWVkaWEtJyArIG1lZGlhVXJsO1xuICAgICAgICByZXR1cm4gTUQ1LmhleF9tZDUoaGFzaFRleHQpO1xuICAgIH1cbn1cblxuLy8gVE9ETzogcmV2aWV3LiBjb3BpZWQgZnJvbSBlbmdhZ2VfZnVsbFxuZnVuY3Rpb24gZmlkZGxlV2l0aEltYWdlQW5kTWVkaWFVcmxzKHVybCwgZ3JvdXBTZXR0aW5ncykge1xuICAgIC8vIGZpZGRsZSB3aXRoIHRoZSB1cmwgdG8gYWNjb3VudCBmb3Igcm90YXRpbmcgc3ViZG9tYWlucyAoaS5lLiwgZGlmZmVyaW5nIENETiBuYW1lcyBmb3IgaW1hZ2UgaG9zdHMpXG4gICAgLy8gcmVnZXggZnJvbSBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzY0NDkzNDAvaG93LXRvLWdldC10b3AtbGV2ZWwtZG9tYWluLWJhc2UtZG9tYWluLWZyb20tdGhlLXVybC1pbi1qYXZhc2NyaXB0XG4gICAgLy8gbW9kaWZpZWQgdG8gc3VwcG9ydCAyIGNoYXJhY3RlciBzdWZmaXhlcywgbGlrZSAuZm0gb3IgLmlvXG4gICAgdmFyIEhPU1RET01BSU4gPSAvWy1cXHddK1xcLig/OlstXFx3XStcXC54bi0tWy1cXHddK3xbLVxcd117Mix9fFstXFx3XStcXC5bLVxcd117Mn0pJC9pO1xuICAgIHZhciBzcmNBcnJheSA9IHVybC5zcGxpdCgnLycpO1xuICAgIHNyY0FycmF5LnNwbGljZSgwLDIpO1xuXG4gICAgdmFyIGRvbWFpbldpdGhQb3J0ID0gc3JjQXJyYXkuc2hpZnQoKTtcbiAgICBpZiAoIWRvbWFpbldpdGhQb3J0KSB7IC8vdGhpcyBjb3VsZCBiZSB1bmRlZmluZWQgaWYgdGhlIHVybCBub3QgdmFsaWQgb3IgaXMgc29tZXRoaW5nIGxpa2UgamF2YXNjcmlwdDp2b2lkXG4gICAgICAgIHJldHVybiB1cmw7XG4gICAgfVxuICAgIHZhciBkb21haW4gPSBkb21haW5XaXRoUG9ydC5zcGxpdCgnOicpWzBdOyAvLyBnZXQgZG9tYWluLCBzdHJpcCBwb3J0XG5cbiAgICB2YXIgZmlsZW5hbWUgPSBzcmNBcnJheS5qb2luKCcvJyk7XG5cbiAgICAvLyB0ZXN0IGV4YW1wbGVzOlxuICAgIC8vIHZhciBtYXRjaCA9IEhPU1RET01BSU4uZXhlYygnaHR0cDovL21lZGlhMS5hYi5jZC5vbi10aGUtdGVsbHkuYmJjLmNvLnVrLycpOyAvLyBmYWlsczogdHJhaWxpbmcgc2xhc2hcbiAgICAvLyB2YXIgbWF0Y2ggPSBIT1NURE9NQUlOLmV4ZWMoJ2h0dHA6Ly9tZWRpYTEuYWIuY2Qub24tdGhlLXRlbGx5LmJiYy5jby51aycpOyAvLyBzdWNjZXNzXG4gICAgLy8gdmFyIG1hdGNoID0gSE9TVERPTUFJTi5leGVjKCdtZWRpYTEuYWIuY2Qub24tdGhlLXRlbGx5LmJiYy5jby51aycpOyAvLyBzdWNjZXNzXG4gICAgdmFyIG1hdGNoID0gSE9TVERPTUFJTi5leGVjKGRvbWFpbik7XG4gICAgaWYgKG1hdGNoID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIHVybDtcbiAgICB9IGVsc2Uge1xuICAgICAgICB1cmwgPSBtYXRjaFswXSArICcvJyArIGZpbGVuYW1lO1xuICAgIH1cbiAgICBpZiAoZ3JvdXBTZXR0aW5ncy51cmwuaWdub3JlTWVkaWFVcmxRdWVyeSgpICYmIHVybC5pbmRleE9mKCc/JykpIHtcbiAgICAgICAgdXJsID0gdXJsLnNwbGl0KCc/JylbMF07XG4gICAgfVxuICAgIHJldHVybiB1cmw7XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBoYXNoVGV4dDogaGFzaFRleHQsXG4gICAgaGFzaEltYWdlOiBoYXNoSW1hZ2UsXG4gICAgaGFzaE1lZGlhOiBoYXNoTWVkaWEsXG4gICAgaGFzaFVybDogaGFzaFVybFxufTsiLCJcbnZhciBsb2FkZWRqUXVlcnk7XG52YXIgY2FsbGJhY2tzID0gW107XG5cbi8vIE5vdGlmaWVzIHRoZSBqUXVlcnkgcHJvdmlkZXIgdGhhdCB3ZSd2ZSBsb2FkZWQgdGhlIGpRdWVyeSBsaWJyYXJ5LlxuZnVuY3Rpb24gbG9hZGVkKCkge1xuICAgIGxvYWRlZGpRdWVyeSA9IGpRdWVyeS5ub0NvbmZsaWN0KHRydWUpO1xuICAgIG5vdGlmeUNhbGxiYWNrcygpO1xufVxuXG5mdW5jdGlvbiBub3RpZnlDYWxsYmFja3MoKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjYWxsYmFja3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY2FsbGJhY2tzW2ldKGxvYWRlZGpRdWVyeSk7XG4gICAgfVxuICAgIGNhbGxiYWNrcyA9IFtdO1xufVxuXG4vLyBSZWdpc3RlcnMgdGhlIGdpdmVuIGNhbGxiYWNrIHRvIGJlIG5vdGlmaWVkIHdoZW4gb3VyIHZlcnNpb24gb2YgalF1ZXJ5IGlzIGxvYWRlZC5cbmZ1bmN0aW9uIG9uTG9hZChjYWxsYmFjaykge1xuICAgIGlmIChsb2FkZWRqUXVlcnkpIHtcbiAgICAgICAgY2FsbGJhY2sobG9hZGVkalF1ZXJ5KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBjYWxsYmFja3MucHVzaChjYWxsYmFjayk7XG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgbG9hZGVkOiBsb2FkZWQsXG4gICAgb25Mb2FkOiBvbkxvYWRcbn07IiwiXG4vLyBUaGVyZSBhcmUgbGlicmFyaWVzIGluIHRoZSB3aWxkIHRoYXQgbW9kaWZ5IEFycmF5LnByb3RvdHlwZSB3aXRoIGEgdG9KU09OIGZ1bmN0aW9uIHRoYXQgYnJlYWtzIEpTT04uc3RyaW5naWZ5LlxuLy8gV29ya2Fyb3VuZCB0aGlzIHByb2JsZW0gYnkgdGVtcG9yYXJpbHkgcmVtb3ZpbmcgdGhlIGZ1bmN0aW9uIHdoZW4gd2Ugc3RyaW5naWZ5IG91ciBvYmplY3RzLlxuZnVuY3Rpb24gc3RyaW5naWZ5KGpzb25PYmplY3QpIHtcbiAgICB2YXIgdG9KU09OID0gQXJyYXkucHJvdG90eXBlLnRvSlNPTjtcbiAgICBkZWxldGUgQXJyYXkucHJvdG90eXBlLnRvSlNPTjtcbiAgICB2YXIgc3RyaW5nID0gSlNPTi5zdHJpbmdpZnkoanNvbk9iamVjdCk7XG4gICAgaWYgKHRvSlNPTikge1xuICAgICAgICBBcnJheS5wcm90b3R5cGUudG9KU09OID0gdG9KU09OO1xuICAgIH1cbiAgICByZXR1cm4gc3RyaW5nO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBzdHJpbmdpZnk6IHN0cmluZ2lmeVxufTsiLCJ2YXIgSlNPTlV0aWxzID0gcmVxdWlyZSgnLi9qc29uLXV0aWxzJyk7XG5cbi8vIElzc3VlcyBhIEpTT05QIHJlcXVlc3QgdG8gYSBnaXZlbiBzZXJ2ZXIuIE1vc3QgaGlnaGVyLWxldmVsIGZ1bmN0aW9uYWxpdHkgaXMgaW4gYWpheC1jbGllbnQuXG5mdW5jdGlvbiBkb0dldEpTT05QKGJhc2VVcmwsIHVybCwgcGFyYW1zLCBzdWNjZXNzLCBlcnJvcikge1xuICAgIHZhciBzY3JpcHRUYWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKTtcbiAgICB2YXIgcmVzcG9uc2VDYWxsYmFjayA9ICdhbnRlbm5hJyArIE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMTYpLnNsaWNlKDIpO1xuICAgIHdpbmRvd1tyZXNwb25zZUNhbGxiYWNrXSA9IGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBUT0RPOiBSZXZpc2l0IHdoZXRoZXIgaXQncyByZWFsbHkgY29vbCB0byBrZXkgdGhpcyBvbiB0aGUgdGV4dFN0YXR1cyBvciBpZiB3ZSBzaG91bGQgYmUgbG9va2luZyBhdFxuICAgICAgICAgICAgLy8gICAgICAgdGhlIHN0YXR1cyBjb2RlIGluIHRoZSBYSFJcbiAgICAgICAgICAgIC8vIE5vdGU6IFRoZSBzZXJ2ZXIgY29tZXMgYmFjayB3aXRoIDIwMCByZXNwb25zZXMgd2l0aCBhIG5lc3RlZCBzdGF0dXMgb2YgXCJmYWlsXCIuLi5cbiAgICAgICAgICAgIGlmIChyZXNwb25zZS5zdGF0dXMgIT09ICdmYWlsJyAmJiAoIXJlc3BvbnNlLmRhdGEgfHwgcmVzcG9uc2UuZGF0YS5zdGF0dXMgIT09ICdmYWlsJykpIHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyb3IpIHsgZXJyb3IocmVzcG9uc2UubWVzc2FnZSB8fCByZXNwb25zZS5kYXRhLm1lc3NhZ2UpOyB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICBkZWxldGUgd2luZG93W3Jlc3BvbnNlQ2FsbGJhY2tdO1xuICAgICAgICAgICAgc2NyaXB0VGFnLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoc2NyaXB0VGFnKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgdmFyIGpzb25wVXJsID0gYmFzZVVybCArIHVybCArICc/Y2FsbGJhY2s9JyArIHJlc3BvbnNlQ2FsbGJhY2s7XG4gICAgaWYgKHBhcmFtcykge1xuICAgICAgICBqc29ucFVybCArPSAnJmpzb249JyArIGVuY29kZVVSSUNvbXBvbmVudChKU09OVXRpbHMuc3RyaW5naWZ5KHBhcmFtcykpO1xuICAgIH1cbiAgICBzY3JpcHRUYWcuc2V0QXR0cmlidXRlKCd0eXBlJywgJ2FwcGxpY2F0aW9uL2phdmFzY3JpcHQnKTtcbiAgICBzY3JpcHRUYWcuc2V0QXR0cmlidXRlKCdzcmMnLCBqc29ucFVybCk7XG4gICAgKGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF0gfHwgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2JvZHknKVswXSkuYXBwZW5kQ2hpbGQoc2NyaXB0VGFnKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgZG9HZXRKU09OUDogZG9HZXRKU09OUFxufTsiLCJ2YXIgQXBwTW9kZSA9IHJlcXVpcmUoJy4vYXBwLW1vZGUnKTtcblxuZnVuY3Rpb24gbG9nRGVidWdNZXNzYWdlKG1lc3NhZ2UpIHtcbiAgICBpZiAoQXBwTW9kZS5kZWJ1Zykge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdBbnRlbm5hRGVidWc6ICcgKyBtZXNzYWdlKTtcbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGRlYnVnTWVzc2FnZTogbG9nRGVidWdNZXNzYWdlXG59OyIsIi8qXG4gKiBBIEphdmFTY3JpcHQgaW1wbGVtZW50YXRpb24gb2YgdGhlIFJTQSBEYXRhIFNlY3VyaXR5LCBJbmMuIE1ENSBNZXNzYWdlXG4gKiBEaWdlc3QgQWxnb3JpdGhtLCBhcyBkZWZpbmVkIGluIFJGQyAxMzIxLlxuICogVmVyc2lvbiAyLjEgQ29weXJpZ2h0IChDKSBQYXVsIEpvaG5zdG9uIDE5OTkgLSAyMDAyLlxuICogT3RoZXIgY29udHJpYnV0b3JzOiBHcmVnIEhvbHQsIEFuZHJldyBLZXBlcnQsIFlkbmFyLCBMb3N0aW5ldFxuICogRGlzdHJpYnV0ZWQgdW5kZXIgdGhlIEJTRCBMaWNlbnNlXG4gKiBTZWUgaHR0cDovL3BhamhvbWUub3JnLnVrL2NyeXB0L21kNSBmb3IgbW9yZSBpbmZvLlxuICovXG5cbnZhciBoZXhjYXNlID0gMDtcbnZhciBiNjRwYWQgID0gXCJcIjtcbnZhciBjaHJzeiA9IDg7XG5cbmZ1bmN0aW9uIGhleF9tZDUocykge1xuICAgIHJldHVybiBiaW5sMmhleChjb3JlX21kNShzdHIyYmlubChzKSwgcy5sZW5ndGggKiBjaHJzeikpO1xufVxuXG5mdW5jdGlvbiBjb3JlX21kNSh4LCBsZW4pIHtcbiAgICB4W2xlbiA+PiA1XSB8PSAweDgwIDw8ICgobGVuKSAlIDMyKTtcbiAgICB4WygoKGxlbiArIDY0KSA+Pj4gOSkgPDwgNCkgKyAxNF0gPSBsZW47XG4gICAgdmFyIGEgPSAxNzMyNTg0MTkzO1xuICAgIHZhciBiID0gLTI3MTczMzg3OTtcbiAgICB2YXIgYyA9IC0xNzMyNTg0MTk0O1xuICAgIHZhciBkID0gMjcxNzMzODc4O1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgeC5sZW5ndGg7IGkgKz0gMTYpIHtcbiAgICAgICAgdmFyIG9sZGEgPSBhO1xuICAgICAgICB2YXIgb2xkYiA9IGI7XG4gICAgICAgIHZhciBvbGRjID0gYztcbiAgICAgICAgdmFyIG9sZGQgPSBkO1xuXG4gICAgICAgIGEgPSBtZDVfZmYoYSwgYiwgYywgZCwgeFtpICsgMF0sIDcsIC02ODA4NzY5MzYpO1xuICAgICAgICBkID0gbWQ1X2ZmKGQsIGEsIGIsIGMsIHhbaSArIDFdLCAxMiwgLTM4OTU2NDU4Nik7XG4gICAgICAgIGMgPSBtZDVfZmYoYywgZCwgYSwgYiwgeFtpICsgMl0sIDE3LCA2MDYxMDU4MTkpO1xuICAgICAgICBiID0gbWQ1X2ZmKGIsIGMsIGQsIGEsIHhbaSArIDNdLCAyMiwgLTEwNDQ1MjUzMzApO1xuICAgICAgICBhID0gbWQ1X2ZmKGEsIGIsIGMsIGQsIHhbaSArIDRdLCA3LCAtMTc2NDE4ODk3KTtcbiAgICAgICAgZCA9IG1kNV9mZihkLCBhLCBiLCBjLCB4W2kgKyA1XSwgMTIsIDEyMDAwODA0MjYpO1xuICAgICAgICBjID0gbWQ1X2ZmKGMsIGQsIGEsIGIsIHhbaSArIDZdLCAxNywgLTE0NzMyMzEzNDEpO1xuICAgICAgICBiID0gbWQ1X2ZmKGIsIGMsIGQsIGEsIHhbaSArIDddLCAyMiwgLTQ1NzA1OTgzKTtcbiAgICAgICAgYSA9IG1kNV9mZihhLCBiLCBjLCBkLCB4W2kgKyA4XSwgNywgMTc3MDAzNTQxNik7XG4gICAgICAgIGQgPSBtZDVfZmYoZCwgYSwgYiwgYywgeFtpICsgOV0sIDEyLCAtMTk1ODQxNDQxNyk7XG4gICAgICAgIGMgPSBtZDVfZmYoYywgZCwgYSwgYiwgeFtpICsgMTBdLCAxNywgLTQyMDYzKTtcbiAgICAgICAgYiA9IG1kNV9mZihiLCBjLCBkLCBhLCB4W2kgKyAxMV0sIDIyLCAtMTk5MDQwNDE2Mik7XG4gICAgICAgIGEgPSBtZDVfZmYoYSwgYiwgYywgZCwgeFtpICsgMTJdLCA3LCAxODA0NjAzNjgyKTtcbiAgICAgICAgZCA9IG1kNV9mZihkLCBhLCBiLCBjLCB4W2kgKyAxM10sIDEyLCAtNDAzNDExMDEpO1xuICAgICAgICBjID0gbWQ1X2ZmKGMsIGQsIGEsIGIsIHhbaSArIDE0XSwgMTcsIC0xNTAyMDAyMjkwKTtcbiAgICAgICAgYiA9IG1kNV9mZihiLCBjLCBkLCBhLCB4W2kgKyAxNV0sIDIyLCAxMjM2NTM1MzI5KTtcblxuICAgICAgICBhID0gbWQ1X2dnKGEsIGIsIGMsIGQsIHhbaSArIDFdLCA1LCAtMTY1Nzk2NTEwKTtcbiAgICAgICAgZCA9IG1kNV9nZyhkLCBhLCBiLCBjLCB4W2kgKyA2XSwgOSwgLTEwNjk1MDE2MzIpO1xuICAgICAgICBjID0gbWQ1X2dnKGMsIGQsIGEsIGIsIHhbaSArIDExXSwgMTQsIDY0MzcxNzcxMyk7XG4gICAgICAgIGIgPSBtZDVfZ2coYiwgYywgZCwgYSwgeFtpICsgMF0sIDIwLCAtMzczODk3MzAyKTtcbiAgICAgICAgYSA9IG1kNV9nZyhhLCBiLCBjLCBkLCB4W2kgKyA1XSwgNSwgLTcwMTU1ODY5MSk7XG4gICAgICAgIGQgPSBtZDVfZ2coZCwgYSwgYiwgYywgeFtpICsgMTBdLCA5LCAzODAxNjA4Myk7XG4gICAgICAgIGMgPSBtZDVfZ2coYywgZCwgYSwgYiwgeFtpICsgMTVdLCAxNCwgLTY2MDQ3ODMzNSk7XG4gICAgICAgIGIgPSBtZDVfZ2coYiwgYywgZCwgYSwgeFtpICsgNF0sIDIwLCAtNDA1NTM3ODQ4KTtcbiAgICAgICAgYSA9IG1kNV9nZyhhLCBiLCBjLCBkLCB4W2kgKyA5XSwgNSwgNTY4NDQ2NDM4KTtcbiAgICAgICAgZCA9IG1kNV9nZyhkLCBhLCBiLCBjLCB4W2kgKyAxNF0sIDksIC0xMDE5ODAzNjkwKTtcbiAgICAgICAgYyA9IG1kNV9nZyhjLCBkLCBhLCBiLCB4W2kgKyAzXSwgMTQsIC0xODczNjM5NjEpO1xuICAgICAgICBiID0gbWQ1X2dnKGIsIGMsIGQsIGEsIHhbaSArIDhdLCAyMCwgMTE2MzUzMTUwMSk7XG4gICAgICAgIGEgPSBtZDVfZ2coYSwgYiwgYywgZCwgeFtpICsgMTNdLCA1LCAtMTQ0NDY4MTQ2Nyk7XG4gICAgICAgIGQgPSBtZDVfZ2coZCwgYSwgYiwgYywgeFtpICsgMl0sIDksIC01MTQwMzc4NCk7XG4gICAgICAgIGMgPSBtZDVfZ2coYywgZCwgYSwgYiwgeFtpICsgN10sIDE0LCAxNzM1MzI4NDczKTtcbiAgICAgICAgYiA9IG1kNV9nZyhiLCBjLCBkLCBhLCB4W2kgKyAxMl0sIDIwLCAtMTkyNjYwNzczNCk7XG5cbiAgICAgICAgYSA9IG1kNV9oaChhLCBiLCBjLCBkLCB4W2kgKyA1XSwgNCwgLTM3ODU1OCk7XG4gICAgICAgIGQgPSBtZDVfaGgoZCwgYSwgYiwgYywgeFtpICsgOF0sIDExLCAtMjAyMjU3NDQ2Myk7XG4gICAgICAgIGMgPSBtZDVfaGgoYywgZCwgYSwgYiwgeFtpICsgMTFdLCAxNiwgMTgzOTAzMDU2Mik7XG4gICAgICAgIGIgPSBtZDVfaGgoYiwgYywgZCwgYSwgeFtpICsgMTRdLCAyMywgLTM1MzA5NTU2KTtcbiAgICAgICAgYSA9IG1kNV9oaChhLCBiLCBjLCBkLCB4W2kgKyAxXSwgNCwgLTE1MzA5OTIwNjApO1xuICAgICAgICBkID0gbWQ1X2hoKGQsIGEsIGIsIGMsIHhbaSArIDRdLCAxMSwgMTI3Mjg5MzM1Myk7XG4gICAgICAgIGMgPSBtZDVfaGgoYywgZCwgYSwgYiwgeFtpICsgN10sIDE2LCAtMTU1NDk3NjMyKTtcbiAgICAgICAgYiA9IG1kNV9oaChiLCBjLCBkLCBhLCB4W2kgKyAxMF0sIDIzLCAtMTA5NDczMDY0MCk7XG4gICAgICAgIGEgPSBtZDVfaGgoYSwgYiwgYywgZCwgeFtpICsgMTNdLCA0LCA2ODEyNzkxNzQpO1xuICAgICAgICBkID0gbWQ1X2hoKGQsIGEsIGIsIGMsIHhbaSArIDBdLCAxMSwgLTM1ODUzNzIyMik7XG4gICAgICAgIGMgPSBtZDVfaGgoYywgZCwgYSwgYiwgeFtpICsgM10sIDE2LCAtNzIyNTIxOTc5KTtcbiAgICAgICAgYiA9IG1kNV9oaChiLCBjLCBkLCBhLCB4W2kgKyA2XSwgMjMsIDc2MDI5MTg5KTtcbiAgICAgICAgYSA9IG1kNV9oaChhLCBiLCBjLCBkLCB4W2kgKyA5XSwgNCwgLTY0MDM2NDQ4Nyk7XG4gICAgICAgIGQgPSBtZDVfaGgoZCwgYSwgYiwgYywgeFtpICsgMTJdLCAxMSwgLTQyMTgxNTgzNSk7XG4gICAgICAgIGMgPSBtZDVfaGgoYywgZCwgYSwgYiwgeFtpICsgMTVdLCAxNiwgNTMwNzQyNTIwKTtcbiAgICAgICAgYiA9IG1kNV9oaChiLCBjLCBkLCBhLCB4W2kgKyAyXSwgMjMsIC05OTUzMzg2NTEpO1xuXG4gICAgICAgIGEgPSBtZDVfaWkoYSwgYiwgYywgZCwgeFtpICsgMF0sIDYsIC0xOTg2MzA4NDQpO1xuICAgICAgICBkID0gbWQ1X2lpKGQsIGEsIGIsIGMsIHhbaSArIDddLCAxMCwgMTEyNjg5MTQxNSk7XG4gICAgICAgIGMgPSBtZDVfaWkoYywgZCwgYSwgYiwgeFtpICsgMTRdLCAxNSwgLTE0MTYzNTQ5MDUpO1xuICAgICAgICBiID0gbWQ1X2lpKGIsIGMsIGQsIGEsIHhbaSArIDVdLCAyMSwgLTU3NDM0MDU1KTtcbiAgICAgICAgYSA9IG1kNV9paShhLCBiLCBjLCBkLCB4W2kgKyAxMl0sIDYsIDE3MDA0ODU1NzEpO1xuICAgICAgICBkID0gbWQ1X2lpKGQsIGEsIGIsIGMsIHhbaSArIDNdLCAxMCwgLTE4OTQ5ODY2MDYpO1xuICAgICAgICBjID0gbWQ1X2lpKGMsIGQsIGEsIGIsIHhbaSArIDEwXSwgMTUsIC0xMDUxNTIzKTtcbiAgICAgICAgYiA9IG1kNV9paShiLCBjLCBkLCBhLCB4W2kgKyAxXSwgMjEsIC0yMDU0OTIyNzk5KTtcbiAgICAgICAgYSA9IG1kNV9paShhLCBiLCBjLCBkLCB4W2kgKyA4XSwgNiwgMTg3MzMxMzM1OSk7XG4gICAgICAgIGQgPSBtZDVfaWkoZCwgYSwgYiwgYywgeFtpICsgMTVdLCAxMCwgLTMwNjExNzQ0KTtcbiAgICAgICAgYyA9IG1kNV9paShjLCBkLCBhLCBiLCB4W2kgKyA2XSwgMTUsIC0xNTYwMTk4MzgwKTtcbiAgICAgICAgYiA9IG1kNV9paShiLCBjLCBkLCBhLCB4W2kgKyAxM10sIDIxLCAxMzA5MTUxNjQ5KTtcbiAgICAgICAgYSA9IG1kNV9paShhLCBiLCBjLCBkLCB4W2kgKyA0XSwgNiwgLTE0NTUyMzA3MCk7XG4gICAgICAgIGQgPSBtZDVfaWkoZCwgYSwgYiwgYywgeFtpICsgMTFdLCAxMCwgLTExMjAyMTAzNzkpO1xuICAgICAgICBjID0gbWQ1X2lpKGMsIGQsIGEsIGIsIHhbaSArIDJdLCAxNSwgNzE4Nzg3MjU5KTtcbiAgICAgICAgYiA9IG1kNV9paShiLCBjLCBkLCBhLCB4W2kgKyA5XSwgMjEsIC0zNDM0ODU1NTEpO1xuXG4gICAgICAgIGEgPSBzYWZlX2FkZChhLCBvbGRhKTtcbiAgICAgICAgYiA9IHNhZmVfYWRkKGIsIG9sZGIpO1xuICAgICAgICBjID0gc2FmZV9hZGQoYywgb2xkYyk7XG4gICAgICAgIGQgPSBzYWZlX2FkZChkLCBvbGRkKTtcbiAgICB9XG4gICAgcmV0dXJuIFthLCBiLCBjLCBkXTtcbn1cblxuZnVuY3Rpb24gbWQ1X2NtbihxLCBhLCBiLCB4LCBzLCB0KSB7XG4gICAgcmV0dXJuIHNhZmVfYWRkKGJpdF9yb2woc2FmZV9hZGQoc2FmZV9hZGQoYSwgcSksIHNhZmVfYWRkKHgsIHQpKSwgcyksIGIpO1xufVxuXG5mdW5jdGlvbiBtZDVfZmYoYSwgYiwgYywgZCwgeCwgcywgdCkge1xuICAgIHJldHVybiBtZDVfY21uKChiICYgYykgfCAoKH5iKSAmIGQpLCBhLCBiLCB4LCBzLCB0KTtcbn1cblxuZnVuY3Rpb24gbWQ1X2dnKGEsIGIsIGMsIGQsIHgsIHMsIHQpIHtcbiAgICByZXR1cm4gbWQ1X2NtbigoYiAmIGQpIHwgKGMgJiAofmQpKSwgYSwgYiwgeCwgcywgdCk7XG59XG5cbmZ1bmN0aW9uIG1kNV9oaChhLCBiLCBjLCBkLCB4LCBzLCB0KSB7XG4gICAgcmV0dXJuIG1kNV9jbW4oYiBeIGMgXiBkLCBhLCBiLCB4LCBzLCB0KTtcbn1cblxuZnVuY3Rpb24gbWQ1X2lpKGEsIGIsIGMsIGQsIHgsIHMsIHQpIHtcbiAgICByZXR1cm4gbWQ1X2NtbihjIF4gKGIgfCAofmQpKSwgYSwgYiwgeCwgcywgdCk7XG59XG5cbmZ1bmN0aW9uIHNhZmVfYWRkKHgsIHkpIHtcbiAgICB2YXIgbHN3ID0gKHggJiAweEZGRkYpICsgKHkgJiAweEZGRkYpO1xuICAgIHZhciBtc3cgPSAoeCA+PiAxNikgKyAoeSA+PiAxNikgKyAobHN3ID4+IDE2KTtcbiAgICByZXR1cm4gKG1zdyA8PCAxNikgfCAobHN3ICYgMHhGRkZGKTtcbn1cblxuZnVuY3Rpb24gYml0X3JvbChudW0sIGNudCkge1xuICAgIHJldHVybiAobnVtIDw8IGNudCkgfCAobnVtID4+PiAoMzIgLSBjbnQpKTtcbn1cblxuZnVuY3Rpb24gc3RyMmJpbmwoc3RyKSB7XG4gICAgdmFyIGJpbiA9IFtdO1xuICAgIHZhciBtYXNrID0gKDEgPDwgY2hyc3opIC0gMTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN0ci5sZW5ndGggKiBjaHJzejsgaSArPSBjaHJzeikge1xuICAgICAgICBiaW5baSA+PiA1XSB8PSAoc3RyLmNoYXJDb2RlQXQoaSAvIGNocnN6KSAmIG1hc2spIDw8IChpICUgMzIpO1xuICAgIH1cbiAgICByZXR1cm4gYmluO1xufVxuXG5mdW5jdGlvbiBiaW5sMmhleChiaW5hcnJheSkge1xuICAgIHZhciBoZXhfdGFiID0gaGV4Y2FzZSA/IFwiMDEyMzQ1Njc4OUFCQ0RFRlwiIDogXCIwMTIzNDU2Nzg5YWJjZGVmXCI7XG4gICAgdmFyIHN0ciA9IFwiXCI7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBiaW5hcnJheS5sZW5ndGggKiA0OyBpKyspIHtcbiAgICAgICAgc3RyICs9IGhleF90YWIuY2hhckF0KChiaW5hcnJheVtpID4+IDJdID4+ICgoaSAlIDQpICogOCArIDQpKSAmIDB4RikgKyBoZXhfdGFiLmNoYXJBdCgoYmluYXJyYXlbaSA+PiAyXSA+PiAoKGkgJSA0KSAqIDgpKSAmIDB4Rik7XG4gICAgfVxuICAgIHJldHVybiBzdHI7XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBoZXhfbWQ1OiBoZXhfbWQ1XG59OyIsIi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAnc3VtbWFyeV93aWRnZXRfX3JlYWN0aW9ucyc6ICdSZWFjdGlvbnMnLFxuICAgICdzdW1tYXJ5X3dpZGdldF9fcmVhY3Rpb25zX29uZSc6ICcxIFJlYWN0aW9uJyxcbiAgICAnc3VtbWFyeV93aWRnZXRfX3JlYWN0aW9uc19tYW55JzogJ3swfSBSZWFjdGlvbnMnLFxuXG4gICAgJ3JlYWN0aW9uc193aWRnZXRfX3RpdGxlJzogJ1JlYWN0aW9ucycsXG4gICAgJ3JlYWN0aW9uc193aWRnZXRfX3RpdGxlX3RoYW5rcyc6ICdUaGFua3MgZm9yIHlvdXIgcmVhY3Rpb24hJyxcbiAgICAncmVhY3Rpb25zX3dpZGdldF9fdGl0bGVfc2lnbmluJzogJ1NpZ24gaW4gUmVxdWlyZWQnLFxuICAgICdyZWFjdGlvbnNfd2lkZ2V0X190aXRsZV9ibG9ja2VkJzogJ0Jsb2NrZWQgUmVhY3Rpb24nLFxuICAgICdyZWFjdGlvbnNfd2lkZ2V0X190aXRsZV9lcnJvcic6ICdFcnJvcicsXG4gICAgJ3JlYWN0aW9uc193aWRnZXRfX2JhY2snOiAnQmFjaycsXG5cbiAgICAnbWVkaWFfaW5kaWNhdG9yX190aGluayc6ICdXaGF0IGRvIHlvdSB0aGluaz8nLFxuXG4gICAgJ3BvcHVwX3dpZGdldF9fdGhpbmsnOiAnV2hhdCBkbyB5b3UgdGhpbms/JyxcblxuICAgICdyZWFjdGlvbnNfcGFnZV9fYWRkJzogJysgQWRkIFlvdXIgT3duJyxcbiAgICAncmVhY3Rpb25zX3BhZ2VfX29rJzogJ29rJyxcblxuICAgICdjb25maXJtYXRpb25fcGFnZV9fc2hhcmUnOiAnU2hhcmUgeW91ciByZWFjdGlvbjonLFxuXG4gICAgJ2xvY2F0aW9uc19wYWdlX19wYWdlbGV2ZWwnOiAnVG8gdGhpcyB3aG9sZSBwYWdlJyxcbiAgICAnbG9jYXRpb25zX3BhZ2VfX2NvdW50X29uZSc6ICc8c3BhbiBjbGFzcz1cImFudGVubmEtbG9jYXRpb24tY291bnRcIj4xPC9zcGFuPjxicj5yZWFjdGlvbicsXG4gICAgJ2xvY2F0aW9uc19wYWdlX19jb3VudF9tYW55JzogJzxzcGFuIGNsYXNzPVwiYW50ZW5uYS1sb2NhdGlvbi1jb3VudFwiPnswfTwvc3Bhbj48YnI+cmVhY3Rpb25zJyxcbiAgICAnbG9jYXRpb25zX3BhZ2VfX3ZpZGVvJzogJ1ZpZGVvJyxcblxuICAgICdjYWxsX3RvX2FjdGlvbl9sYWJlbF9fcmVzcG9uc2VzJzogJ1JlYWN0aW9ucycsXG4gICAgJ2NhbGxfdG9fYWN0aW9uX2xhYmVsX19yZXNwb25zZXNfb25lJzogJzEgUmVhY3Rpb24nLFxuICAgICdjYWxsX3RvX2FjdGlvbl9sYWJlbF9fcmVzcG9uc2VzX21hbnknOiAnezB9IFJlYWN0aW9ucycsXG5cbiAgICAnYmxvY2tlZF9wYWdlX19tZXNzYWdlMSc6ICdUaGlzIHNpdGUgaGFzIGJsb2NrZWQgc29tZSBvciBhbGwgb2YgdGhlIHRleHQgaW4gdGhhdCByZWFjdGlvbi4nLFxuICAgICdibG9ja2VkX3BhZ2VfX21lc3NhZ2UyJzogJ1BsZWFzZSB0cnkgc29tZXRoaW5nIHRoYXQgd2lsbCBiZSBtb3JlIGFwcHJvcHJpYXRlIGZvciB0aGlzIGNvbW11bml0eS4nLFxuXG4gICAgJ3BlbmRpbmdfcGFnZV9fbWVzc2FnZV9hcHBlYXInOiAnWW91ciByZWFjdGlvbiB3aWxsIGFwcGVhciBvbmNlIGl0IGlzIHJldmlld2VkLiBBbGwgbmV3IHJlYWN0aW9ucyBtdXN0IG1lZXQgb3VyIGNvbW11bml0eSBndWlkZWxpbmVzLicsXG5cbiAgICAnZXJyb3JfcGFnZV9fbWVzc2FnZSc6ICdPb3BzISBXZSByZWFsbHkgdmFsdWUgeW91ciBmZWVkYmFjaywgYnV0IHNvbWV0aGluZyB3ZW50IHdyb25nLicsXG5cbiAgICAndGFwX2hlbHBlcl9fcHJvbXB0JzogJ1RhcCBhbnkgcGFyYWdyYXBoIHRvIHJlc3BvbmQhJyxcbiAgICAndGFwX2hlbHBlcl9fY2xvc2UnOiAnQ2xvc2UnLFxuXG4gICAgJ2NvbnRlbnRfcmVjX3dpZGdldF9fdGl0bGUnOiAnUmVhZGVyIFJlYWN0aW9ucycsXG5cbiAgICAnbG9naW5fcGFnZV9fbWVzc2FnZV8xJzogJzxzcGFuIGNsYXNzPVwiYW50ZW5uYS1sb2dpbi1ncm91cFwiPnswfTwvc3Bhbj4gdXNlcyA8YSBocmVmPVwiaHR0cDovL3d3dy5hbnRlbm5hLmlzL1wiIHRhcmdldD1cIl9ibGFua1wiPkFudGVubmE8L2E+IHNvIHlvdSBjYW4gcmVhY3QgdG8gY29udGVudCBlYXNpbHkgYW5kIHNhZmVseS4nLFxuICAgICdsb2dpbl9wYWdlX19tZXNzYWdlXzInOiAnVG8ga2VlcCBwYXJ0aWNpcGF0aW5nLCBqdXN0IGxvZyBpbjonLFxuICAgICdsb2dpbl9wYWdlX19wcml2YWN5JzogJ0FudGVubmEgdmFsdWVzIHlvdXIgcHJpdmFjeS4gPGEgaHJlZj1cImh0dHA6Ly93d3cuYW50ZW5uYS5pcy9mYXEvXCIgdGFyZ2V0PVwiX2JsYW5rXCI+TGVhcm4gbW9yZTwvYT4uJyxcbiAgICAnbG9naW5fcGFnZV9fcGVuZGluZ19wcmUnOiAnWW91IG1pZ2h0IG5lZWQgdG8gJyxcbiAgICAnbG9naW5fcGFnZV9fcGVuZGluZ19jbGljayc6ICdjbGljayBoZXJlJyxcbiAgICAnbG9naW5fcGFnZV9fcGVuZGluZ19wb3N0JzogJyBvbmNlIHlvdVxcJ3ZlIGxvZ2dlZCBpbi4nXG59OyIsIi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAnc3VtbWFyeV93aWRnZXRfX3JlYWN0aW9ucyc6ICdSZWFjY2lvbmVzJyxcbiAgICAnc3VtbWFyeV93aWRnZXRfX3JlYWN0aW9uc19vbmUnOiAnMSBSZWFjY2nDs24nLFxuICAgICdzdW1tYXJ5X3dpZGdldF9fcmVhY3Rpb25zX21hbnknOiAnezB9IFJlYWNjaW9uZXMnLFxuXG4gICAgJ3JlYWN0aW9uc193aWRnZXRfX3RpdGxlJzogJ1JlYWNjaW9uZXMnLFxuICAgICdyZWFjdGlvbnNfd2lkZ2V0X190aXRsZV90aGFua3MnOiAnwqFHcmFjaWFzIHBvciB0dSByZWFjY2nDs24hJyxcbiAgICAncmVhY3Rpb25zX3dpZGdldF9fdGl0bGVfc2lnbmluJzogJ0VzIG5lY2VzYXJpbyBpbmljaWFyIHNlc2nDs24nLCAvLyBUT0RPOiBjaGVjayB0cmFuc2xhdGlvblxuICAgICdyZWFjdGlvbnNfd2lkZ2V0X190aXRsZV9ibG9ja2VkJzogJ1JlYWNjacOzbiBibG9xdWVhZG8nLCAvLyBUT0RPOiBjaGVjayB0cmFuc2xhdGlvblxuICAgICdyZWFjdGlvbnNfd2lkZ2V0X190aXRsZV9lcnJvcic6ICdFcnJvcicsIC8vIFRPRE86IGNoZWNrIHRyYW5zbGF0aW9uXG4gICAgJ3JlYWN0aW9uc193aWRnZXRfX2JhY2snOiAnVm9sdmVyJyxcblxuICAgICdtZWRpYV9pbmRpY2F0b3JfX3RoaW5rJzogJ8K/UXXDqSBwaWVuc2FzPycsXG5cbiAgICAncG9wdXBfd2lkZ2V0X190aGluayc6ICfCv1F1w6kgcGllbnNhcz8nLFxuXG4gICAgJ3JlYWN0aW9uc19wYWdlX19hZGQnOiAnKyBBw7FhZGUgbG8gdHV5bycsXG4gICAgJ3JlYWN0aW9uc19wYWdlX19vayc6ICdvaycsXG5cbiAgICAnY29uZmlybWF0aW9uX3BhZ2VfX3NoYXJlJzogJ0NvbXBhcnRlIHR1IHJlYWNjacOzbjonLFxuXG4gICAgJ2xvY2F0aW9uc19wYWdlX19wYWdlbGV2ZWwnOiAnQSBlc3RhIHDDoWdpbmEnLCAvLyBUT0RPOiBuZWVkIGEgdHJhbnNsYXRpb24gb2YgXCJUbyB0aGlzIHdob2xlIHBhZ2VcIlxuICAgICdsb2NhdGlvbnNfcGFnZV9fY291bnRfb25lJzogJzxzcGFuIGNsYXNzPVwiYW50ZW5uYS1sb2NhdGlvbi1jb3VudFwiPjE8L3NwYW4+PGJyPnJlYWNjacOzbicsXG4gICAgJ2xvY2F0aW9uc19wYWdlX19jb3VudF9tYW55JzogJzxzcGFuIGNsYXNzPVwiYW50ZW5uYS1sb2NhdGlvbi1jb3VudFwiPnswfTwvc3Bhbj48YnI+cmVhY2Npb25lcycsXG4gICAgJ2xvY2F0aW9uc19wYWdlX192aWRlbyc6ICdWaWRlbycsXG5cbiAgICAnY2FsbF90b19hY3Rpb25fbGFiZWxfX3Jlc3BvbnNlcyc6ICdSZWFjY2lvbmVzJyxcbiAgICAnY2FsbF90b19hY3Rpb25fbGFiZWxfX3Jlc3BvbnNlc19vbmUnOiAnMSBSZWFjY2nDs24nLFxuICAgICdjYWxsX3RvX2FjdGlvbl9sYWJlbF9fcmVzcG9uc2VzX21hbnknOiAnezB9IFJlYWNjaW9uZXMnLFxuXG4gICAgJ2Jsb2NrZWRfcGFnZV9fbWVzc2FnZTEnOiAnRXN0ZSBzaXRpbyB3ZWIgaGEgYmxvcXVlYWRvIGVzYSByZWFjY2nDs24uJywgLy8gVE9ETzogY2hlY2sgdHJhbnNsYXRpb25cbiAgICAnYmxvY2tlZF9wYWdlX19tZXNzYWdlMic6ICdQb3IgZmF2b3IsIGludGVudGUgYWxnbyBxdWUgc2Vyw6EgbcOhcyBhcHJvcGlhZG8gcGFyYSBlc3RhIGNvbXVuaWRhZC4nLCAvLyBUT0RPOiBjaGVjayB0cmFuc2xhdGlvblxuICAgICdwZW5kaW5nX3BhZ2VfX21lc3NhZ2VfYXBwZWFyJzogJ0FwYXJlY2Vyw6Egc3UgcmVhY2Npw7NuIHVuYSB2ZXogcXVlIHNlIHJldmlzYS4gVG9kYXMgbGFzIG51ZXZhcyByZWFjY2lvbmVzIGRlYmVuIGN1bXBsaXIgY29uIG5vcm1hcyBkZSBsYSBjb211bmlkYWQuJywgLy8gVE9ETzogY2hlY2sgdHJhbnNsYXRpb25cbiAgICAnZXJyb3JfcGFnZV9fbWVzc2FnZSc6ICfCoUxvIHNpZW50byEgVmFsb3JhbW9zIHN1cyBjb21lbnRhcmlvcywgcGVybyBhbGdvIHNhbGnDsyBtYWwuJywgLy8gVE9ETzogY2hlY2sgdHJhbnNsYXRpb25cbiAgICAndGFwX2hlbHBlcl9fcHJvbXB0JzogJ8KhVG9jYSB1biBww6FycmFmbyBwYXJhIG9waW5hciEnLFxuICAgICd0YXBfaGVscGVyX19jbG9zZSc6ICdWb2x2ZXInLFxuICAgICdjb250ZW50X3JlY193aWRnZXRfX3RpdGxlJzogJ1JlYWNjaW9uZXMgZGUgbGEgZ2VudGUnIC8vIFRPRE86IGNoZWNrIHRyYW5zbGF0aW9uXG59OyIsInZhciBBcHBNb2RlID0gcmVxdWlyZSgnLi9hcHAtbW9kZScpO1xudmFyIEdyb3VwU2V0dGluZ3MgPSByZXF1aXJlKCcuLi9ncm91cC1zZXR0aW5ncycpO1xuXG52YXIgRW5nbGlzaE1lc3NhZ2VzID0gcmVxdWlyZSgnLi9tZXNzYWdlcy1lbicpO1xudmFyIFNwYW5pc2hNZXNzYWdlcyA9IHJlcXVpcmUoJy4vbWVzc2FnZXMtZXMnKTtcbnZhbGlkYXRlVHJhbnNsYXRpb25zKCk7XG5cbmZ1bmN0aW9uIHZhbGlkYXRlVHJhbnNsYXRpb25zKCkge1xuICAgIGZvciAodmFyIGVuZ2xpc2hLZXkgaW4gRW5nbGlzaE1lc3NhZ2VzKSB7XG4gICAgICAgIGlmIChFbmdsaXNoTWVzc2FnZXMuaGFzT3duUHJvcGVydHkoZW5nbGlzaEtleSkpIHtcbiAgICAgICAgICAgIGlmICghU3BhbmlzaE1lc3NhZ2VzLmhhc093blByb3BlcnR5KGVuZ2xpc2hLZXkpKSB7XG4gICAgICAgICAgICAgICAgaWYgKEFwcE1vZGUub2ZmbGluZSB8fCBBcHBNb2RlLmRlYnVnKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ0FudGVubmEgd2FybmluZzogU3BhbmlzaCB0cmFuc2xhdGlvbiBtaXNzaW5nIGZvciBrZXkgJyArIGVuZ2xpc2hLZXkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gZ2V0TWVzc2FnZShrZXksIHZhbHVlcykge1xuICAgIHZhciBzdHJpbmcgPSBnZXRMb2NhbGl6ZWRTdHJpbmcoa2V5LCBHcm91cFNldHRpbmdzLmdldCgpLmxhbmd1YWdlKCkpO1xuICAgIGlmICh2YWx1ZXMpIHtcbiAgICAgICAgcmV0dXJuIGZvcm1hdChzdHJpbmcsIHZhbHVlcyk7XG4gICAgfVxuICAgIHJldHVybiBzdHJpbmc7XG59XG5cbmZ1bmN0aW9uIGdldExvY2FsaXplZFN0cmluZyhrZXksIGxhbmcpIHtcbiAgICB2YXIgc3RyaW5nO1xuICAgIHN3aXRjaChsYW5nKSB7XG4gICAgICAgIGNhc2UgJ2VuJzpcbiAgICAgICAgICAgIHN0cmluZyA9IEVuZ2xpc2hNZXNzYWdlc1trZXldO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2VzJzpcbiAgICAgICAgICAgIHN0cmluZyA9IFNwYW5pc2hNZXNzYWdlc1trZXldO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAvLyBUT0RPOiByZXZpZXdcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdJbnZhbGlkIGxhbmd1YWdlIHNwZWNpZmllZCBpbiBBbnRlbm5hIGdyb3VwIHNldHRpbmdzLicpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGlmICghc3RyaW5nKSB7IC8vIERlZmF1bHQgdG8gRW5nbGlzaFxuICAgICAgICBzdHJpbmcgPSBFbmdsaXNoTWVzc2FnZXNba2V5XTtcbiAgICB9XG4gICAgLy8gVE9ETzogaGFuZGxlIG1pc3Npbmcga2V5XG4gICAgcmV0dXJuIHN0cmluZztcbn1cblxuZnVuY3Rpb24gZm9ybWF0KHN0cmluZywgdmFsdWVzKSB7XG4gICAgLy8gUG9wdWxhciwgc2ltcGxlIGFsZ29yaXRobSBmcm9tIGh0dHA6Ly9qYXZhc2NyaXB0LmNyb2NrZm9yZC5jb20vcmVtZWRpYWwuaHRtbFxuICAgIHJldHVybiBzdHJpbmcucmVwbGFjZShcbiAgICAgICAgL1xceyhbXnt9XSopXFx9L2csXG4gICAgICAgIGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgICAgICB2YXIgciA9IHZhbHVlc1tiXTtcbiAgICAgICAgICAgIHJldHVybiB0eXBlb2YgciA9PT0gJ3N0cmluZycgfHwgdHlwZW9mIHIgPT09ICdudW1iZXInID8gciA6IGE7XG4gICAgICAgIH1cbiAgICApO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgZ2V0TWVzc2FnZTogZ2V0TWVzc2FnZVxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcblxuZnVuY3Rpb24gbWFrZU1vdmVhYmxlKCRlbGVtZW50LCAkZHJhZ0hhbmRsZSkge1xuICAgICRkcmFnSGFuZGxlLm9uKCdtb3VzZWRvd24uYW50ZW5uYScsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHZhciBvZmZzZXRYID0gZXZlbnQucGFnZVggLSAkZHJhZ0hhbmRsZS5vZmZzZXQoKS5sZWZ0O1xuICAgICAgICB2YXIgb2Zmc2V0WSA9IGV2ZW50LnBhZ2VZIC0gJGRyYWdIYW5kbGUub2Zmc2V0KCkudG9wO1xuICAgICAgICAkKGRvY3VtZW50KS5vbignbW91c2V1cC5hbnRlbm5hJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgICQoZG9jdW1lbnQpLm9mZignbW91c2Vtb3ZlLmFudGVubmEnKTtcbiAgICAgICAgfSk7XG4gICAgICAgICQoZG9jdW1lbnQpLm9uKCdtb3VzZW1vdmUuYW50ZW5uYScsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICAkZWxlbWVudC5jc3Moe1xuICAgICAgICAgICAgICAgIHRvcDogZXZlbnQucGFnZVkgLSBvZmZzZXRZLFxuICAgICAgICAgICAgICAgIGxlZnQ6IGV2ZW50LnBhZ2VYIC0gb2Zmc2V0WFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBtYWtlTW92ZWFibGU6IG1ha2VNb3ZlYWJsZVxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciBDYWxsYmFja1N1cHBvcnQgPSByZXF1aXJlKCcuL2NhbGxiYWNrLXN1cHBvcnQnKTtcbnZhciBSYW5nZSA9IHJlcXVpcmUoJy4vcmFuZ2UnKTtcbnZhciBXaWRnZXRCdWNrZXQgPSByZXF1aXJlKCcuL3dpZGdldC1idWNrZXQnKTtcblxuLy8gVE9ETzogZGV0ZWN0IHdoZXRoZXIgdGhlIGJyb3dzZXIgc3VwcG9ydHMgTXV0YXRpb25PYnNlcnZlciBhbmQgZmFsbGJhY2sgdG8gTXV0YXRpb25zIEV2ZW50c1xuXG52YXIgYWRkaXRpb25MaXN0ZW5lcjtcbnZhciByZW1vdmFsTGlzdGVuZXI7XG5cbnZhciBhdHRyaWJ1dGVPYnNlcnZlcnMgPSBbXTtcblxuZnVuY3Rpb24gYWRkQWRkaXRpb25MaXN0ZW5lcihjYWxsYmFjaykge1xuICAgIGlmICghYWRkaXRpb25MaXN0ZW5lcikge1xuICAgICAgICBhZGRpdGlvbkxpc3RlbmVyID0gY3JlYXRlQWRkaXRpb25MaXN0ZW5lcigpO1xuICAgIH1cbiAgICBhZGRpdGlvbkxpc3RlbmVyLmFkZENhbGxiYWNrKGNhbGxiYWNrKTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlQWRkaXRpb25MaXN0ZW5lcigpIHtcbiAgICB2YXIgY2FsbGJhY2tTdXBwb3J0ID0gQ2FsbGJhY2tTdXBwb3J0LmNyZWF0ZSgpO1xuICAgIHZhciBvYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKGZ1bmN0aW9uKG11dGF0aW9uUmVjb3Jkcykge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG11dGF0aW9uUmVjb3Jkcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGFkZGVkRWxlbWVudHMgPSBmaWx0ZXJlZEVsZW1lbnRzKG11dGF0aW9uUmVjb3Jkc1tpXS5hZGRlZE5vZGVzKTtcbiAgICAgICAgICAgIGlmIChhZGRlZEVsZW1lbnRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICB2YXIgY2FsbGJhY2tzID0gY2FsbGJhY2tTdXBwb3J0LmdldCgpO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgY2FsbGJhY2tzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrc1tqXShhZGRlZEVsZW1lbnRzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICB2YXIgYm9keSA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdib2R5JylbMF07XG4gICAgb2JzZXJ2ZXIub2JzZXJ2ZShib2R5LCB7XG4gICAgICAgIGNoaWxkTGlzdDogdHJ1ZSxcbiAgICAgICAgYXR0cmlidXRlczogZmFsc2UsXG4gICAgICAgIGNoYXJhY3RlckRhdGE6IGZhbHNlLFxuICAgICAgICBzdWJ0cmVlOiB0cnVlLFxuICAgICAgICBhdHRyaWJ1dGVPbGRWYWx1ZTogZmFsc2UsXG4gICAgICAgIGNoYXJhY3RlckRhdGFPbGRWYWx1ZTogZmFsc2VcbiAgICB9KTtcbiAgICByZXR1cm4ge1xuICAgICAgICB0ZWFyZG93bjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBjYWxsYmFja1N1cHBvcnQudGVhcmRvd24oKTtcbiAgICAgICAgICAgIG9ic2VydmVyLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgfSxcbiAgICAgICAgYWRkQ2FsbGJhY2s6IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBjYWxsYmFja1N1cHBvcnQuYWRkKGNhbGxiYWNrKTtcbiAgICAgICAgfSxcbiAgICAgICAgcmVtb3ZlQ2FsbGJhY2s6IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBjYWxsYmFja1N1cHBvcnQucmVtb3ZlKGNhbGxiYWNrKTtcbiAgICAgICAgfVxuICAgIH07XG59XG5cbmZ1bmN0aW9uIGFkZFJlbW92YWxMaXN0ZW5lcihjYWxsYmFjaykge1xuICAgIGlmICghcmVtb3ZhbExpc3RlbmVyKSB7XG4gICAgICAgIHJlbW92YWxMaXN0ZW5lciA9IGNyZWF0ZVJlbW92YWxMaXN0ZW5lcigpO1xuICAgIH1cbiAgICByZW1vdmFsTGlzdGVuZXIuYWRkQ2FsbGJhY2soY2FsbGJhY2spO1xufVxuXG5mdW5jdGlvbiByZW1vdmVSZW1vdmFsTGlzdGVuZXIoY2FsbGJhY2spIHtcbiAgICBpZiAocmVtb3ZhbExpc3RlbmVyKSB7XG4gICAgICAgIHJlbW92YWxMaXN0ZW5lci5yZW1vdmVDYWxsYmFjayhjYWxsYmFjayk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBjcmVhdGVSZW1vdmFsTGlzdGVuZXIoKSB7XG4gICAgdmFyIGNhbGxiYWNrU3VwcG9ydCA9IENhbGxiYWNrU3VwcG9ydC5jcmVhdGUoKTtcbiAgICB2YXIgb2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcihmdW5jdGlvbihtdXRhdGlvblJlY29yZHMpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtdXRhdGlvblJlY29yZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciByZW1vdmVkRWxlbWVudHMgPSBmaWx0ZXJlZEVsZW1lbnRzKG11dGF0aW9uUmVjb3Jkc1tpXS5yZW1vdmVkTm9kZXMpO1xuICAgICAgICAgICAgaWYgKHJlbW92ZWRFbGVtZW50cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNhbGxiYWNrcyA9IGNhbGxiYWNrU3VwcG9ydC5nZXQoKTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGNhbGxiYWNrcy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFja3Nbal0ocmVtb3ZlZEVsZW1lbnRzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICB2YXIgYm9keSA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdib2R5JylbMF07XG4gICAgb2JzZXJ2ZXIub2JzZXJ2ZShib2R5LCB7XG4gICAgICAgIGNoaWxkTGlzdDogdHJ1ZSxcbiAgICAgICAgYXR0cmlidXRlczogZmFsc2UsXG4gICAgICAgIGNoYXJhY3RlckRhdGE6IGZhbHNlLFxuICAgICAgICBzdWJ0cmVlOiB0cnVlLFxuICAgICAgICBhdHRyaWJ1dGVPbGRWYWx1ZTogZmFsc2UsXG4gICAgICAgIGNoYXJhY3RlckRhdGFPbGRWYWx1ZTogZmFsc2VcbiAgICB9KTtcbiAgICByZXR1cm4ge1xuICAgICAgICB0ZWFyZG93bjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBjYWxsYmFja1N1cHBvcnQudGVhcmRvd24oKTtcbiAgICAgICAgICAgIG9ic2VydmVyLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgfSxcbiAgICAgICAgYWRkQ2FsbGJhY2s6IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBjYWxsYmFja1N1cHBvcnQuYWRkKGNhbGxiYWNrKTtcbiAgICAgICAgfSxcbiAgICAgICAgcmVtb3ZlQ2FsbGJhY2s6IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBjYWxsYmFja1N1cHBvcnQucmVtb3ZlKGNhbGxiYWNrKTtcbiAgICAgICAgfVxuICAgIH07XG59XG5cbi8vIEZpbHRlciB0aGUgc2V0IG9mIG5vZGVzIHRvIGVsaW1pbmF0ZSBhbnl0aGluZyBpbnNpZGUgb3VyIG93biBET00gZWxlbWVudHMgKG90aGVyd2lzZSwgd2UgZ2VuZXJhdGUgYSB0b24gb2YgY2hhdHRlcilcbmZ1bmN0aW9uIGZpbHRlcmVkRWxlbWVudHMobm9kZUxpc3QpIHtcbiAgICB2YXIgZmlsdGVyZWQgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG5vZGVMaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBub2RlID0gbm9kZUxpc3RbaV07XG4gICAgICAgIGlmIChub2RlLm5vZGVUeXBlID09PSAxKSB7IC8vIE9ubHkgZWxlbWVudCBub2Rlcy4gKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9Ob2RlL25vZGVUeXBlKVxuICAgICAgICAgICAgdmFyICRlbGVtZW50ID0gJChub2RlKTtcbiAgICAgICAgICAgIGlmICgkZWxlbWVudC5jbG9zZXN0KFJhbmdlLkhJR0hMSUdIVF9TRUxFQ1RPUiArICcsIC5hbnRlbm5hLCAnICsgV2lkZ2V0QnVja2V0LnNlbGVjdG9yKCkpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGZpbHRlcmVkLnB1c2goJGVsZW1lbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmaWx0ZXJlZDtcbn1cblxuZnVuY3Rpb24gYWRkT25lVGltZUVsZW1lbnRSZW1vdmFsTGlzdGVuZXIobm9kZSwgY2FsbGJhY2spIHtcbiAgICB2YXIgbGlzdGVuZXIgPSBmdW5jdGlvbihyZW1vdmVkRWxlbWVudHMpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZW1vdmVkRWxlbWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciByZW1vdmVkRWxlbWVudCA9IHJlbW92ZWRFbGVtZW50c1tpXS5nZXQoMCk7XG4gICAgICAgICAgICBpZiAocmVtb3ZlZEVsZW1lbnQuY29udGFpbnMobm9kZSkpIHtcbiAgICAgICAgICAgICAgICByZW1vdmVSZW1vdmFsTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIGFkZFJlbW92YWxMaXN0ZW5lcihsaXN0ZW5lcik7XG59XG5cbmZ1bmN0aW9uIGFkZE9uZVRpbWVBdHRyaWJ1dGVMaXN0ZW5lcihub2RlLCBhdHRyaWJ1dGVzLCBjYWxsYmFjaykge1xuICAgIHZhciBvYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKGZ1bmN0aW9uKG11dGF0aW9uUmVjb3Jkcykge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG11dGF0aW9uUmVjb3Jkcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIHRhcmdldCA9IG11dGF0aW9uUmVjb3Jkc1tpXS50YXJnZXQ7XG4gICAgICAgICAgICBjYWxsYmFjayh0YXJnZXQpO1xuICAgICAgICAgICAgb2JzZXJ2ZXIuZGlzY29ubmVjdCgpO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgb2JzZXJ2ZXIub2JzZXJ2ZShub2RlLCB7XG4gICAgICAgIGNoaWxkTGlzdDogZmFsc2UsXG4gICAgICAgIGF0dHJpYnV0ZXM6IHRydWUsXG4gICAgICAgIGNoYXJhY3RlckRhdGE6IGZhbHNlLFxuICAgICAgICBzdWJ0cmVlOiBmYWxzZSxcbiAgICAgICAgYXR0cmlidXRlT2xkVmFsdWU6IGZhbHNlLFxuICAgICAgICBjaGFyYWN0ZXJEYXRhT2xkVmFsdWU6IGZhbHNlLFxuICAgICAgICBhdHRyaWJ1dGVGaWx0ZXI6IGF0dHJpYnV0ZXNcbiAgICB9KTtcbiAgICBhdHRyaWJ1dGVPYnNlcnZlcnMucHVzaChvYnNlcnZlcik7XG59XG5cbmZ1bmN0aW9uIHRlYXJkb3duKCkge1xuICAgIGlmIChhZGRpdGlvbkxpc3RlbmVyKSB7XG4gICAgICAgIGFkZGl0aW9uTGlzdGVuZXIudGVhcmRvd24oKTtcbiAgICAgICAgYWRkaXRpb25MaXN0ZW5lciA9IHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBpZiAocmVtb3ZhbExpc3RlbmVyKSB7XG4gICAgICAgIHJlbW92YWxMaXN0ZW5lci50ZWFyZG93bigpO1xuICAgICAgICByZW1vdmFsTGlzdGVuZXIgPSB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhdHRyaWJ1dGVPYnNlcnZlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgYXR0cmlidXRlT2JzZXJ2ZXJzW2ldLmRpc2Nvbm5lY3QoKTtcbiAgICB9XG4gICAgYXR0cmlidXRlT2JzZXJ2ZXJzID0gW107XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBhZGRBZGRpdGlvbkxpc3RlbmVyOiBhZGRBZGRpdGlvbkxpc3RlbmVyLFxuICAgIGFkZFJlbW92YWxMaXN0ZW5lcjogYWRkUmVtb3ZhbExpc3RlbmVyLFxuICAgIGFkZE9uZVRpbWVFbGVtZW50UmVtb3ZhbExpc3RlbmVyOiBhZGRPbmVUaW1lRWxlbWVudFJlbW92YWxMaXN0ZW5lcixcbiAgICBhZGRPbmVUaW1lQXR0cmlidXRlTGlzdGVuZXI6IGFkZE9uZVRpbWVBdHRyaWJ1dGVMaXN0ZW5lcixcbiAgICB0ZWFyZG93bjogdGVhcmRvd25cbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG5cbmZ1bmN0aW9uIGNvbXB1dGVQYWdlVGl0bGUoJHBhZ2UsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgdGl0bGVTZWxlY3RvciA9IGdyb3VwU2V0dGluZ3MucGFnZVRpdGxlU2VsZWN0b3IoKTtcbiAgICBpZiAoIXRpdGxlU2VsZWN0b3IpIHtcbiAgICAgICAgLy8gQmFja3dhcmRzIGNvbXBhdGliaWxpdHkgZm9yIHNpdGVzIHdoaWNoIGRlcGxveWVkIGJlZm9yZSB3ZSBoYWQgYSBzZXBhcmF0ZSB0aXRsZSBzZWxlY3Rvci5cbiAgICAgICAgdGl0bGVTZWxlY3RvciA9IGdyb3VwU2V0dGluZ3MucGFnZVVybFNlbGVjdG9yKCk7XG4gICAgfVxuICAgIHZhciBwYWdlVGl0bGUgPSAkcGFnZS5maW5kKHRpdGxlU2VsZWN0b3IpLnRleHQoKS50cmltKCk7XG4gICAgaWYgKHBhZ2VUaXRsZSA9PT0gJycpIHtcbiAgICAgICAgLy8gSWYgd2UgY291bGRuJ3QgZmluZCBhIHRpdGxlIGJhc2VkIG9uIHRoZSBncm91cCBzZXR0aW5ncywgZmFsbGJhY2sgdG8gc29tZSBoYXJkLWNvZGVkIGJlaGF2aW9yLlxuICAgICAgICBwYWdlVGl0bGUgPSBnZXRBdHRyaWJ1dGVWYWx1ZSgnbWV0YVtwcm9wZXJ0eT1cIm9nOnRpdGxlXCJdJywgJ2NvbnRlbnQnKSB8fCAkKCd0aXRsZScpLnRleHQoKS50cmltKCk7XG4gICAgfVxuICAgIHJldHVybiBwYWdlVGl0bGU7XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVUb3BMZXZlbFBhZ2VJbWFnZShncm91cFNldHRpbmdzKSB7XG4gICAgcmV0dXJuIGdldEF0dHJpYnV0ZVZhbHVlKGdyb3VwU2V0dGluZ3MucGFnZUltYWdlU2VsZWN0b3IoKSwgZ3JvdXBTZXR0aW5ncy5wYWdlSW1hZ2VBdHRyaWJ1dGUoKSk7XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVQYWdlQXV0aG9yKGdyb3VwU2V0dGluZ3MpIHtcbiAgICByZXR1cm4gZ2V0QXR0cmlidXRlVmFsdWUoZ3JvdXBTZXR0aW5ncy5wYWdlQXV0aG9yU2VsZWN0b3IoKSwgZ3JvdXBTZXR0aW5ncy5wYWdlQXV0aG9yQXR0cmlidXRlKCkpO1xufVxuXG5mdW5jdGlvbiBjb21wdXRlUGFnZVRvcGljcyhncm91cFNldHRpbmdzKSB7XG4gICAgcmV0dXJuIGdldEF0dHJpYnV0ZVZhbHVlKGdyb3VwU2V0dGluZ3MucGFnZVRvcGljc1NlbGVjdG9yKCksIGdyb3VwU2V0dGluZ3MucGFnZVRvcGljc0F0dHJpYnV0ZSgpKTtcbn1cblxuZnVuY3Rpb24gY29tcHV0ZVBhZ2VTaXRlU2VjdGlvbihncm91cFNldHRpbmdzKSB7XG4gICAgcmV0dXJuIGdldEF0dHJpYnV0ZVZhbHVlKGdyb3VwU2V0dGluZ3MucGFnZVNpdGVTZWN0aW9uU2VsZWN0b3IoKSwgZ3JvdXBTZXR0aW5ncy5wYWdlU2l0ZVNlY3Rpb25BdHRyaWJ1dGUoKSk7XG59XG5cbmZ1bmN0aW9uIGdldEF0dHJpYnV0ZVZhbHVlKGVsZW1lbnRTZWxlY3RvciwgYXR0cmlidXRlU2VsZWN0b3IpIHtcbiAgICB2YXIgdmFsdWUgPSAnJztcbiAgICBpZiAoZWxlbWVudFNlbGVjdG9yICYmIGF0dHJpYnV0ZVNlbGVjdG9yKSB7XG4gICAgICAgIHZhbHVlID0gJChlbGVtZW50U2VsZWN0b3IpLmF0dHIoYXR0cmlidXRlU2VsZWN0b3IpIHx8ICcnO1xuICAgIH1cbiAgICByZXR1cm4gdmFsdWUudHJpbSgpO1xufVxuXG5mdW5jdGlvbiBjb21wdXRlVG9wTGV2ZWxDYW5vbmljYWxVcmwoZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBjYW5vbmljYWxVcmwgPSB3aW5kb3cubG9jYXRpb24uaHJlZi5zcGxpdCgnIycpWzBdLnRvTG93ZXJDYXNlKCk7XG4gICAgdmFyICRjYW5vbmljYWxMaW5rID0gJCgnbGlua1tyZWw9XCJjYW5vbmljYWxcIl0nKTtcbiAgICBpZiAoJGNhbm9uaWNhbExpbmsubGVuZ3RoID4gMCAmJiAkY2Fub25pY2FsTGluay5hdHRyKCdocmVmJykpIHtcbiAgICAgICAgdmFyIG92ZXJyaWRlVXJsID0gJGNhbm9uaWNhbExpbmsuYXR0cignaHJlZicpLnRyaW0oKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICB2YXIgZG9tYWluID0gKHdpbmRvdy5sb2NhdGlvbi5wcm90b2NvbCsnLy8nK3dpbmRvdy5sb2NhdGlvbi5ob3N0bmFtZSsnLycpLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIGlmIChvdmVycmlkZVVybCAhPT0gZG9tYWluKSB7IC8vIGZhc3RjbyBmaXggKHNpbmNlIHRoZXkgc29tZXRpbWVzIHJld3JpdGUgdGhlaXIgY2Fub25pY2FsIHRvIHNpbXBseSBiZSB0aGVpciBkb21haW4uKVxuICAgICAgICAgICAgY2Fub25pY2FsVXJsID0gb3ZlcnJpZGVVcmw7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlbW92ZVN1YmRvbWFpbkZyb21QYWdlVXJsKGNhbm9uaWNhbFVybCwgZ3JvdXBTZXR0aW5ncyk7XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVQYWdlRWxlbWVudFVybCgkcGFnZUVsZW1lbnQsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgcGFnZVVybFNlbGVjdG9yID0gZ3JvdXBTZXR0aW5ncy5wYWdlVXJsU2VsZWN0b3IoKTtcbiAgICB2YXIgJHBhZ2VVcmxFbGVtZW50ID0gJHBhZ2VFbGVtZW50LmZpbmQocGFnZVVybFNlbGVjdG9yKTtcbiAgICBpZiAocGFnZVVybFNlbGVjdG9yKSB7IC8vIHdpdGggYW4gdW5kZWZpbmVkIHNlbGVjdG9yLCBhZGRCYWNrIHdpbGwgbWF0Y2ggYW5kIGFsd2F5cyByZXR1cm4gdGhlIGlucHV0IGVsZW1lbnQgKHVubGlrZSBmaW5kKCkgd2hpY2ggcmV0dXJucyBhbiBlbXB0eSBtYXRjaClcbiAgICAgICAgJHBhZ2VVcmxFbGVtZW50ID0gJHBhZ2VVcmxFbGVtZW50LmFkZEJhY2socGFnZVVybFNlbGVjdG9yKTtcbiAgICB9XG4gICAgdmFyIHVybCA9ICRwYWdlVXJsRWxlbWVudC5hdHRyKGdyb3VwU2V0dGluZ3MucGFnZVVybEF0dHJpYnV0ZSgpKTtcbiAgICBpZiAodXJsKSB7XG4gICAgICAgIHVybCA9IHJlbW92ZVN1YmRvbWFpbkZyb21QYWdlVXJsKHVybCwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIHZhciBvcmlnaW4gPSB3aW5kb3cubG9jYXRpb24ub3JpZ2luIHx8IHdpbmRvdy5sb2NhdGlvbi5wcm90b2NvbCArIFwiLy9cIiArIHdpbmRvdy5sb2NhdGlvbi5ob3N0bmFtZSArICh3aW5kb3cubG9jYXRpb24ucG9ydCA/ICc6JyArIHdpbmRvdy5sb2NhdGlvbi5wb3J0OiAnJyk7XG4gICAgICAgIGlmICh1cmwuaW5kZXhPZihvcmlnaW4pICE9PSAwICYmIC8vIE5vdCBhbiBhYnNvbHV0ZSBVUkxcbiAgICAgICAgICAgICAgICAhdXJsLnN1YnN0cigwLDIpICE9PSAnLy8nICYmIC8vIE5vdCBwcm90b2NvbCByZWxhdGl2ZVxuICAgICAgICAgICAgICAgICFncm91cFNldHRpbmdzLnVybC5pZ25vcmVTdWJkb21haW4oKSkgeyAvLyBBbmQgd2Ugd2VyZW4ndCBub3QgaWdub3JpbmcgdGhlIHN1YmRvbWFpblxuICAgICAgICAgICAgaWYgKHVybC5zdWJzdHIoMCwxKSA9PSAnLycpIHtcbiAgICAgICAgICAgICAgICB1cmwgPSBvcmlnaW4gKyB1cmw7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHVybCA9IG9yaWdpbiArIHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZSArIHVybDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdXJsO1xuICAgIH1cbiAgICByZXR1cm4gY29tcHV0ZVRvcExldmVsQ2Fub25pY2FsVXJsKGdyb3VwU2V0dGluZ3MpO1xufVxuXG4vLyBUT0RPIGNvcGllZCBmcm9tIGVuZ2FnZV9mdWxsLiBSZXZpZXcuXG5mdW5jdGlvbiByZW1vdmVTdWJkb21haW5Gcm9tUGFnZVVybCh1cmwsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICAvLyBBTlQuYWN0aW9ucy5yZW1vdmVTdWJkb21haW5Gcm9tUGFnZVVybDpcbiAgICAvLyBpZiBcImlnbm9yZV9zdWJkb21haW5cIiBpcyBjaGVja2VkIGluIHNldHRpbmdzLCBBTkQgdGhleSBzdXBwbHkgYSBUTEQsXG4gICAgLy8gdGhlbiBtb2RpZnkgdGhlIHBhZ2UgYW5kIGNhbm9uaWNhbCBVUkxzIGhlcmUuXG4gICAgLy8gaGF2ZSB0byBoYXZlIHRoZW0gc3VwcGx5IG9uZSBiZWNhdXNlIHRoZXJlIGFyZSB0b28gbWFueSB2YXJpYXRpb25zIHRvIHJlbGlhYmx5IHN0cmlwIHN1YmRvbWFpbnMgICguY29tLCAuaXMsIC5jb20uYXIsIC5jby51aywgZXRjKVxuICAgIGlmIChncm91cFNldHRpbmdzLnVybC5pZ25vcmVTdWJkb21haW4oKSA9PSB0cnVlICYmIGdyb3VwU2V0dGluZ3MudXJsLmNhbm9uaWNhbERvbWFpbigpKSB7XG4gICAgICAgIHZhciBIT1NURE9NQUlOID0gL1stXFx3XStcXC4oPzpbLVxcd10rXFwueG4tLVstXFx3XSt8Wy1cXHddezIsfXxbLVxcd10rXFwuWy1cXHddezJ9KSQvaTtcbiAgICAgICAgdmFyIHNyY0FycmF5ID0gdXJsLnNwbGl0KCcvJyk7XG5cbiAgICAgICAgdmFyIHByb3RvY29sID0gc3JjQXJyYXlbMF07XG4gICAgICAgIHNyY0FycmF5LnNwbGljZSgwLDMpO1xuXG4gICAgICAgIHZhciByZXR1cm5VcmwgPSBwcm90b2NvbCArICcvLycgKyBncm91cFNldHRpbmdzLnVybC5jYW5vbmljYWxEb21haW4oKSArICcvJyArIHNyY0FycmF5LmpvaW4oJy8nKTtcblxuICAgICAgICByZXR1cm4gcmV0dXJuVXJsO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB1cmw7XG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY29tcHV0ZVBhZ2VVcmw6IGNvbXB1dGVQYWdlRWxlbWVudFVybCxcbiAgICBjb21wdXRlUGFnZVRpdGxlOiBjb21wdXRlUGFnZVRpdGxlLFxuICAgIGNvbXB1dGVUb3BMZXZlbFBhZ2VJbWFnZTogY29tcHV0ZVRvcExldmVsUGFnZUltYWdlLFxuICAgIGNvbXB1dGVQYWdlQXV0aG9yOiBjb21wdXRlUGFnZUF1dGhvcixcbiAgICBjb21wdXRlUGFnZVRvcGljczogY29tcHV0ZVBhZ2VUb3BpY3MsXG4gICAgY29tcHV0ZVBhZ2VTaXRlU2VjdGlvbjogY29tcHV0ZVBhZ2VTaXRlU2VjdGlvblxufTsiLCIvLyBBbnRlbm5hIGNoYW5nZXMgZnJvbSBvcmlnaW5hbCBzb3VyY2UgbWFya2VkIHdpdGggT1JJR0lOQUxcbi8vIFNlZSB0aGUgaXNzdWUgd2UgbmVlZGVkIHRvIHdvcmsgYXJvdW5kIGhlcmU6IGh0dHBzOi8vZ2l0aHViLmNvbS9yYWN0aXZlanMvcmFjdGl2ZS1ldmVudHMtdGFwL2lzc3Vlcy84XG5cbi8vIFRhcC9mYXN0Y2xpY2sgZXZlbnQgcGx1Z2luIGZvciBSYWN0aXZlLmpzIC0gZWxpbWluYXRlcyB0aGUgMzAwbXMgZGVsYXkgb24gdG91Y2gtZW5hYmxlZCBkZXZpY2VzLCBhbmQgbm9ybWFsaXNlc1xuLy8gYWNyb3NzIG1vdXNlLCB0b3VjaCBhbmQgcG9pbnRlciBldmVudHMuXG4vLyBBdXRob3I6IFJpY2ggSGFycmlzXG4vLyBMaWNlbnNlOiBNSVRcbi8vIFNvdXJjZTogaHR0cHM6Ly9naXRodWIuY29tL3JhY3RpdmVqcy9yYWN0aXZlLWV2ZW50cy10YXBcbihmdW5jdGlvbiAoZ2xvYmFsLCBmYWN0b3J5KSB7XG5cdG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpO1xufSh0aGlzLCBmdW5jdGlvbiAoKSB7ICd1c2Ugc3RyaWN0JztcblxuXHR2YXIgRElTVEFOQ0VfVEhSRVNIT0xEID0gNTsgLy8gbWF4aW11bSBwaXhlbHMgcG9pbnRlciBjYW4gbW92ZSBiZWZvcmUgY2FuY2VsXG5cdHZhciBUSU1FX1RIUkVTSE9MRCA9IDQwMDsgLy8gbWF4aW11bSBtaWxsaXNlY29uZHMgYmV0d2VlbiBkb3duIGFuZCB1cCBiZWZvcmUgY2FuY2VsXG5cblx0ZnVuY3Rpb24gdGFwKG5vZGUsIGNhbGxiYWNrKSB7XG5cdFx0cmV0dXJuIG5ldyBUYXBIYW5kbGVyKG5vZGUsIGNhbGxiYWNrKTtcblx0fVxuXG5cdGZ1bmN0aW9uIFRhcEhhbmRsZXIobm9kZSwgY2FsbGJhY2spIHtcblx0XHR0aGlzLm5vZGUgPSBub2RlO1xuXHRcdHRoaXMuY2FsbGJhY2sgPSBjYWxsYmFjaztcblxuXHRcdHRoaXMucHJldmVudE1vdXNlZG93bkV2ZW50cyA9IGZhbHNlO1xuXG5cdFx0dGhpcy5iaW5kKG5vZGUpO1xuXHR9XG5cblx0VGFwSGFuZGxlci5wcm90b3R5cGUgPSB7XG5cdFx0YmluZDogZnVuY3Rpb24gYmluZChub2RlKSB7XG5cdFx0XHQvLyBsaXN0ZW4gZm9yIG1vdXNlL3BvaW50ZXIgZXZlbnRzLi4uXG5cdFx0XHQvLyBPUklHSU5BTCBpZiAod2luZG93Lm5hdmlnYXRvci5wb2ludGVyRW5hYmxlZCkge1xuXHRcdFx0aWYgKHdpbmRvdy5uYXZpZ2F0b3IucG9pbnRlckVuYWJsZWQgJiYgISgnb250b3VjaHN0YXJ0JyBpbiB3aW5kb3cpKSB7XG5cdFx0XHRcdG5vZGUuYWRkRXZlbnRMaXN0ZW5lcigncG9pbnRlcmRvd24nLCBoYW5kbGVNb3VzZWRvd24sIGZhbHNlKTtcblx0XHRcdC8vIE9SSUdJTkFMIH0gZWxzZSBpZiAod2luZG93Lm5hdmlnYXRvci5tc1BvaW50ZXJFbmFibGVkKSB7XG5cdFx0XHR9IGVsc2UgaWYgKHdpbmRvdy5uYXZpZ2F0b3IubXNQb2ludGVyRW5hYmxlZCAmJiAhKCdvbnRvdWNoc3RhcnQnIGluIHdpbmRvdykpIHtcblx0XHRcdFx0bm9kZS5hZGRFdmVudExpc3RlbmVyKCdNU1BvaW50ZXJEb3duJywgaGFuZGxlTW91c2Vkb3duLCBmYWxzZSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRub2RlLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIGhhbmRsZU1vdXNlZG93biwgZmFsc2UpO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyAuLi5hbmQgdG91Y2ggZXZlbnRzXG5cdFx0XHRub2RlLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCBoYW5kbGVUb3VjaHN0YXJ0LCBmYWxzZSk7XG5cblx0XHRcdC8vIG5hdGl2ZSBidXR0b25zLCBhbmQgPGlucHV0IHR5cGU9J2J1dHRvbic+IGVsZW1lbnRzLCBzaG91bGQgZmlyZSBhIHRhcCBldmVudFxuXHRcdFx0Ly8gd2hlbiB0aGUgc3BhY2Uga2V5IGlzIHByZXNzZWRcblx0XHRcdGlmIChub2RlLnRhZ05hbWUgPT09ICdCVVRUT04nIHx8IG5vZGUudHlwZSA9PT0gJ2J1dHRvbicpIHtcblx0XHRcdFx0bm9kZS5hZGRFdmVudExpc3RlbmVyKCdmb2N1cycsIGhhbmRsZUZvY3VzLCBmYWxzZSk7XG5cdFx0XHR9XG5cblx0XHRcdG5vZGUuX190YXBfaGFuZGxlcl9fID0gdGhpcztcblx0XHR9LFxuXHRcdGZpcmU6IGZ1bmN0aW9uIGZpcmUoZXZlbnQsIHgsIHkpIHtcblx0XHRcdHRoaXMuY2FsbGJhY2soe1xuXHRcdFx0XHRub2RlOiB0aGlzLm5vZGUsXG5cdFx0XHRcdG9yaWdpbmFsOiBldmVudCxcblx0XHRcdFx0eDogeCxcblx0XHRcdFx0eTogeVxuXHRcdFx0fSk7XG5cdFx0fSxcblx0XHRtb3VzZWRvd246IGZ1bmN0aW9uIG1vdXNlZG93bihldmVudCkge1xuXHRcdFx0dmFyIF90aGlzID0gdGhpcztcblxuXHRcdFx0aWYgKHRoaXMucHJldmVudE1vdXNlZG93bkV2ZW50cykge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdGlmIChldmVudC53aGljaCAhPT0gdW5kZWZpbmVkICYmIGV2ZW50LndoaWNoICE9PSAxKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0dmFyIHggPSBldmVudC5jbGllbnRYO1xuXHRcdFx0dmFyIHkgPSBldmVudC5jbGllbnRZO1xuXG5cdFx0XHQvLyBUaGlzIHdpbGwgYmUgbnVsbCBmb3IgbW91c2UgZXZlbnRzLlxuXHRcdFx0dmFyIHBvaW50ZXJJZCA9IGV2ZW50LnBvaW50ZXJJZDtcblxuXHRcdFx0dmFyIGhhbmRsZU1vdXNldXAgPSBmdW5jdGlvbiBoYW5kbGVNb3VzZXVwKGV2ZW50KSB7XG5cdFx0XHRcdGlmIChldmVudC5wb2ludGVySWQgIT0gcG9pbnRlcklkKSB7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0X3RoaXMuZmlyZShldmVudCwgeCwgeSk7XG5cdFx0XHRcdGNhbmNlbCgpO1xuXHRcdFx0fTtcblxuXHRcdFx0dmFyIGhhbmRsZU1vdXNlbW92ZSA9IGZ1bmN0aW9uIGhhbmRsZU1vdXNlbW92ZShldmVudCkge1xuXHRcdFx0XHRpZiAoZXZlbnQucG9pbnRlcklkICE9IHBvaW50ZXJJZCkge1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmIChNYXRoLmFicyhldmVudC5jbGllbnRYIC0geCkgPj0gRElTVEFOQ0VfVEhSRVNIT0xEIHx8IE1hdGguYWJzKGV2ZW50LmNsaWVudFkgLSB5KSA+PSBESVNUQU5DRV9USFJFU0hPTEQpIHtcblx0XHRcdFx0XHRjYW5jZWwoKTtcblx0XHRcdFx0fVxuXHRcdFx0fTtcblxuXHRcdFx0dmFyIGNhbmNlbCA9IGZ1bmN0aW9uIGNhbmNlbCgpIHtcblx0XHRcdFx0X3RoaXMubm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKCdNU1BvaW50ZXJVcCcsIGhhbmRsZU1vdXNldXAsIGZhbHNlKTtcblx0XHRcdFx0ZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignTVNQb2ludGVyTW92ZScsIGhhbmRsZU1vdXNlbW92ZSwgZmFsc2UpO1xuXHRcdFx0XHRkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdNU1BvaW50ZXJDYW5jZWwnLCBjYW5jZWwsIGZhbHNlKTtcblx0XHRcdFx0X3RoaXMubm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKCdwb2ludGVydXAnLCBoYW5kbGVNb3VzZXVwLCBmYWxzZSk7XG5cdFx0XHRcdGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJtb3ZlJywgaGFuZGxlTW91c2Vtb3ZlLCBmYWxzZSk7XG5cdFx0XHRcdGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJjYW5jZWwnLCBjYW5jZWwsIGZhbHNlKTtcblx0XHRcdFx0X3RoaXMubm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZU1vdXNldXAsIGZhbHNlKTtcblx0XHRcdFx0ZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgaGFuZGxlTW91c2Vtb3ZlLCBmYWxzZSk7XG5cdFx0XHR9O1xuXG5cdFx0XHRpZiAod2luZG93Lm5hdmlnYXRvci5wb2ludGVyRW5hYmxlZCkge1xuXHRcdFx0XHR0aGlzLm5vZGUuYWRkRXZlbnRMaXN0ZW5lcigncG9pbnRlcnVwJywgaGFuZGxlTW91c2V1cCwgZmFsc2UpO1xuXHRcdFx0XHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdwb2ludGVybW92ZScsIGhhbmRsZU1vdXNlbW92ZSwgZmFsc2UpO1xuXHRcdFx0XHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdwb2ludGVyY2FuY2VsJywgY2FuY2VsLCBmYWxzZSk7XG5cdFx0XHR9IGVsc2UgaWYgKHdpbmRvdy5uYXZpZ2F0b3IubXNQb2ludGVyRW5hYmxlZCkge1xuXHRcdFx0XHR0aGlzLm5vZGUuYWRkRXZlbnRMaXN0ZW5lcignTVNQb2ludGVyVXAnLCBoYW5kbGVNb3VzZXVwLCBmYWxzZSk7XG5cdFx0XHRcdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ01TUG9pbnRlck1vdmUnLCBoYW5kbGVNb3VzZW1vdmUsIGZhbHNlKTtcblx0XHRcdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignTVNQb2ludGVyQ2FuY2VsJywgY2FuY2VsLCBmYWxzZSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0aGlzLm5vZGUuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVNb3VzZXVwLCBmYWxzZSk7XG5cdFx0XHRcdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIGhhbmRsZU1vdXNlbW92ZSwgZmFsc2UpO1xuXHRcdFx0fVxuXG5cdFx0XHRzZXRUaW1lb3V0KGNhbmNlbCwgVElNRV9USFJFU0hPTEQpO1xuXHRcdH0sXG5cdFx0dG91Y2hkb3duOiBmdW5jdGlvbiB0b3VjaGRvd24oKSB7XG5cdFx0XHR2YXIgX3RoaXMyID0gdGhpcztcblxuXHRcdFx0dmFyIHRvdWNoID0gZXZlbnQudG91Y2hlc1swXTtcblxuXHRcdFx0dmFyIHggPSB0b3VjaC5jbGllbnRYO1xuXHRcdFx0dmFyIHkgPSB0b3VjaC5jbGllbnRZO1xuXG5cdFx0XHR2YXIgZmluZ2VyID0gdG91Y2guaWRlbnRpZmllcjtcblxuXHRcdFx0dmFyIGhhbmRsZVRvdWNodXAgPSBmdW5jdGlvbiBoYW5kbGVUb3VjaHVwKGV2ZW50KSB7XG5cdFx0XHRcdHZhciB0b3VjaCA9IGV2ZW50LmNoYW5nZWRUb3VjaGVzWzBdO1xuXG5cdFx0XHRcdGlmICh0b3VjaC5pZGVudGlmaWVyICE9PSBmaW5nZXIpIHtcblx0XHRcdFx0XHRjYW5jZWwoKTtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpOyAvLyBwcmV2ZW50IGNvbXBhdGliaWxpdHkgbW91c2UgZXZlbnRcblxuXHRcdFx0XHQvLyBmb3IgdGhlIGJlbmVmaXQgb2YgbW9iaWxlIEZpcmVmb3ggYW5kIG9sZCBBbmRyb2lkIGJyb3dzZXJzLCB3ZSBuZWVkIHRoaXMgYWJzdXJkIGhhY2suXG5cdFx0XHRcdF90aGlzMi5wcmV2ZW50TW91c2Vkb3duRXZlbnRzID0gdHJ1ZTtcblx0XHRcdFx0Y2xlYXJUaW1lb3V0KF90aGlzMi5wcmV2ZW50TW91c2Vkb3duVGltZW91dCk7XG5cblx0XHRcdFx0X3RoaXMyLnByZXZlbnRNb3VzZWRvd25UaW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0X3RoaXMyLnByZXZlbnRNb3VzZWRvd25FdmVudHMgPSBmYWxzZTtcblx0XHRcdFx0fSwgNDAwKTtcblxuXHRcdFx0XHRfdGhpczIuZmlyZShldmVudCwgeCwgeSk7XG5cdFx0XHRcdGNhbmNlbCgpO1xuXHRcdFx0fTtcblxuXHRcdFx0dmFyIGhhbmRsZVRvdWNobW92ZSA9IGZ1bmN0aW9uIGhhbmRsZVRvdWNobW92ZShldmVudCkge1xuXHRcdFx0XHRpZiAoZXZlbnQudG91Y2hlcy5sZW5ndGggIT09IDEgfHwgZXZlbnQudG91Y2hlc1swXS5pZGVudGlmaWVyICE9PSBmaW5nZXIpIHtcblx0XHRcdFx0XHRjYW5jZWwoKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHZhciB0b3VjaCA9IGV2ZW50LnRvdWNoZXNbMF07XG5cdFx0XHRcdGlmIChNYXRoLmFicyh0b3VjaC5jbGllbnRYIC0geCkgPj0gRElTVEFOQ0VfVEhSRVNIT0xEIHx8IE1hdGguYWJzKHRvdWNoLmNsaWVudFkgLSB5KSA+PSBESVNUQU5DRV9USFJFU0hPTEQpIHtcblx0XHRcdFx0XHRjYW5jZWwoKTtcblx0XHRcdFx0fVxuXHRcdFx0fTtcblxuXHRcdFx0dmFyIGNhbmNlbCA9IGZ1bmN0aW9uIGNhbmNlbCgpIHtcblx0XHRcdFx0X3RoaXMyLm5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCBoYW5kbGVUb3VjaHVwLCBmYWxzZSk7XG5cdFx0XHRcdHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCBoYW5kbGVUb3VjaG1vdmUsIGZhbHNlKTtcblx0XHRcdFx0d2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoY2FuY2VsJywgY2FuY2VsLCBmYWxzZSk7XG5cdFx0XHR9O1xuXG5cdFx0XHR0aGlzLm5vZGUuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCBoYW5kbGVUb3VjaHVwLCBmYWxzZSk7XG5cdFx0XHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgaGFuZGxlVG91Y2htb3ZlLCBmYWxzZSk7XG5cdFx0XHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hjYW5jZWwnLCBjYW5jZWwsIGZhbHNlKTtcblxuXHRcdFx0c2V0VGltZW91dChjYW5jZWwsIFRJTUVfVEhSRVNIT0xEKTtcblx0XHR9LFxuXHRcdHRlYXJkb3duOiBmdW5jdGlvbiB0ZWFyZG93bigpIHtcblx0XHRcdHZhciBub2RlID0gdGhpcy5ub2RlO1xuXG5cdFx0XHRub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJkb3duJywgaGFuZGxlTW91c2Vkb3duLCBmYWxzZSk7XG5cdFx0XHRub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ01TUG9pbnRlckRvd24nLCBoYW5kbGVNb3VzZWRvd24sIGZhbHNlKTtcblx0XHRcdG5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgaGFuZGxlTW91c2Vkb3duLCBmYWxzZSk7XG5cdFx0XHRub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCBoYW5kbGVUb3VjaHN0YXJ0LCBmYWxzZSk7XG5cdFx0XHRub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2ZvY3VzJywgaGFuZGxlRm9jdXMsIGZhbHNlKTtcblx0XHR9XG5cdH07XG5cblx0ZnVuY3Rpb24gaGFuZGxlTW91c2Vkb3duKGV2ZW50KSB7XG5cdFx0dGhpcy5fX3RhcF9oYW5kbGVyX18ubW91c2Vkb3duKGV2ZW50KTtcblx0fVxuXG5cdGZ1bmN0aW9uIGhhbmRsZVRvdWNoc3RhcnQoZXZlbnQpIHtcblx0XHR0aGlzLl9fdGFwX2hhbmRsZXJfXy50b3VjaGRvd24oZXZlbnQpO1xuXHR9XG5cblx0ZnVuY3Rpb24gaGFuZGxlRm9jdXMoKSB7XG5cdFx0dGhpcy5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgaGFuZGxlS2V5ZG93biwgZmFsc2UpO1xuXHRcdHRoaXMuYWRkRXZlbnRMaXN0ZW5lcignYmx1cicsIGhhbmRsZUJsdXIsIGZhbHNlKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGhhbmRsZUJsdXIoKSB7XG5cdFx0dGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKCdrZXlkb3duJywgaGFuZGxlS2V5ZG93biwgZmFsc2UpO1xuXHRcdHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcignYmx1cicsIGhhbmRsZUJsdXIsIGZhbHNlKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGhhbmRsZUtleWRvd24oZXZlbnQpIHtcblx0XHRpZiAoZXZlbnQud2hpY2ggPT09IDMyKSB7XG5cdFx0XHQvLyBzcGFjZSBrZXlcblx0XHRcdHRoaXMuX190YXBfaGFuZGxlcl9fLmZpcmUoKTtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gdGFwO1xuXG59KSk7IiwidmFyIFJhY3RpdmVFdmVudHNUYXAgPSByZXF1aXJlKCcuL3JhY3RpdmUtZXZlbnRzLXRhcCcpO1xuXG52YXIgTWVzc2FnZXMgPSByZXF1aXJlKCcuL21lc3NhZ2VzJyk7XG5cbnZhciBub0NvbmZsaWN0O1xudmFyIGxvYWRlZFJhY3RpdmU7XG52YXIgY2FsbGJhY2tzID0gW107XG5cbi8vIENhcHR1cmUgYW55IGdsb2JhbCBpbnN0YW5jZSBvZiBSYWN0aXZlIHdoaWNoIGFscmVhZHkgZXhpc3RzIGJlZm9yZSB3ZSBsb2FkIG91ciBvd24uXG5mdW5jdGlvbiBhYm91dFRvTG9hZCgpIHtcbiAgICBub0NvbmZsaWN0ID0gd2luZG93LlJhY3RpdmU7XG59XG5cbi8vIFJlc3RvcmUgdGhlIGdsb2JhbCBpbnN0YW5jZSBvZiBSYWN0aXZlIChpZiBhbnkpIGFuZCBwYXNzIG91dCBvdXIgdmVyc2lvbiB0byBvdXIgY2FsbGJhY2tzXG5mdW5jdGlvbiBsb2FkZWQoKSB7XG4gICAgbG9hZGVkUmFjdGl2ZSA9IFJhY3RpdmU7XG4gICAgd2luZG93LlJhY3RpdmUgPSBub0NvbmZsaWN0O1xuICAgIGxvYWRlZFJhY3RpdmUuZGVjb3JhdG9ycy5jc3NyZXNldCA9IGNzc1Jlc2V0RGVjb3JhdG9yOyAvLyBNYWtlIG91ciBjc3MgcmVzZXQgZGVjb3JhdG9yIGF2YWlsYWJsZSB0byBhbGwgaW5zdGFuY2VzXG4gICAgbG9hZGVkUmFjdGl2ZS5ldmVudHMudGFwID0gUmFjdGl2ZUV2ZW50c1RhcDsgLy8gTWFrZSB0aGUgJ29uLXRhcCcgZXZlbnQgcGx1Z2luIGF2YWlsYWJsZSB0byBhbGwgaW5zdGFuY2VzXG4gICAgbG9hZGVkUmFjdGl2ZS5kZWZhdWx0cy5kYXRhLmdldE1lc3NhZ2UgPSBNZXNzYWdlcy5nZXRNZXNzYWdlOyAvLyBNYWtlIGdldE1lc3NhZ2UgYXZhaWxhYmxlIHRvIGFsbCBpbnN0YW5jZXNcbiAgICBsb2FkZWRSYWN0aXZlLmRlZmF1bHRzLnR3b3dheSA9IGZhbHNlOyAvLyBDaGFuZ2UgdGhlIGRlZmF1bHQgdG8gZGlzYWJsZSB0d28td2F5IGRhdGEgYmluZGluZ3MuXG4gICAgbG9hZGVkUmFjdGl2ZS5ERUJVRyA9IGZhbHNlO1xuICAgIG5vdGlmeUNhbGxiYWNrcygpO1xufVxuXG5mdW5jdGlvbiBjc3NSZXNldERlY29yYXRvcihub2RlKSB7XG4gICAgdGFnTm9kZUFuZENoaWxkcmVuKG5vZGUsICdhbnRlbm5hLXJlc2V0Jyk7XG4gICAgcmV0dXJuIHsgdGVhcmRvd246IGZ1bmN0aW9uKCkge30gfTtcbn1cblxuZnVuY3Rpb24gdGFnTm9kZUFuZENoaWxkcmVuKG5vZGUsIGNsYXp6KSB7XG4gICAgaWYgKG5vZGUudGFnTmFtZS50b0xvd2VyQ2FzZSgpICE9ICdzdmcnKSB7IC8vIElFIHJldHVybnMgbm8gY2xhc3NMaXN0IGZvciBTVkcgZWxlbWVudHMgYW5kIFNhZmFyaSBjYW4ndCBjb21wdXRlIFNWRyBlbGVtZW50IGNoaWxkcmVuXG4gICAgICAgIG5vZGUuY2xhc3NMaXN0LmFkZChjbGF6eik7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbm9kZS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdGFnTm9kZUFuZENoaWxkcmVuKG5vZGUuY2hpbGRyZW5baV0sIGNsYXp6KTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gbm90aWZ5Q2FsbGJhY2tzKCkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2FsbGJhY2tzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNhbGxiYWNrc1tpXShsb2FkZWRSYWN0aXZlKTtcbiAgICB9XG4gICAgY2FsbGJhY2tzID0gW107XG59XG5cbi8vIFJlZ2lzdGVycyB0aGUgZ2l2ZW4gY2FsbGJhY2sgdG8gYmUgbm90aWZpZWQgd2hlbiBvdXIgdmVyc2lvbiBvZiBSYWN0aXZlIGlzIGxvYWRlZC5cbmZ1bmN0aW9uIG9uTG9hZChjYWxsYmFjaykge1xuICAgIGlmIChsb2FkZWRSYWN0aXZlKSB7XG4gICAgICAgIGNhbGxiYWNrKGxvYWRlZFJhY3RpdmUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGNhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKTtcbiAgICB9XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBhYm91dFRvTG9hZDogYWJvdXRUb0xvYWQsXG4gICAgbG9hZGVkOiBsb2FkZWQsXG4gICAgb25Mb2FkOiBvbkxvYWRcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgcmFuZ3k7IHJlcXVpcmUoJy4vcmFuZ3ktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24obG9hZGVkUmFuZ3kpIHsgcmFuZ3kgPSBsb2FkZWRSYW5neTsgfSk7XG5cbnZhciBoaWdobGlnaHRDbGFzcyA9ICdhbnRlbm5hLWhpZ2hsaWdodCc7XG52YXIgaGlnaGxpZ2h0ZWRSYW5nZXMgPSBbXTtcblxudmFyIGNsYXNzQXBwbGllcjtcbmZ1bmN0aW9uIGdldENsYXNzQXBwbGllcigpIHtcbiAgICBpZiAoIWNsYXNzQXBwbGllcikge1xuICAgICAgICBjbGFzc0FwcGxpZXIgPSByYW5neS5jcmVhdGVDbGFzc0FwcGxpZXIoaGlnaGxpZ2h0Q2xhc3MsIHsgZWxlbWVudFRhZ05hbWU6ICdpbnMnIH0pO1xuICAgIH1cbiAgICByZXR1cm4gY2xhc3NBcHBsaWVyO1xufVxuXG4vLyBSZXR1cm5zIGFuIGFkanVzdGVkIGVuZCBwb2ludCBmb3IgdGhlIHNlbGVjdGlvbiB3aXRoaW4gdGhlIGdpdmVuIG5vZGUsIGFzIHRyaWdnZXJlZCBieSB0aGUgZ2l2ZW4gbW91c2UgdXAgZXZlbnQuXG4vLyBUaGUgcmV0dXJuZWQgcG9pbnQgKHgsIHkpIHRha2VzIGludG8gYWNjb3VudCB0aGUgbG9jYXRpb24gb2YgdGhlIG1vdXNlIHVwIGV2ZW50IGFzIHdlbGwgYXMgdGhlIGRpcmVjdGlvbiBvZiB0aGVcbi8vIHNlbGVjdGlvbiAoZm9yd2FyZC9iYWNrKS5cbmZ1bmN0aW9uIGdldFNlbGVjdGlvbkVuZFBvaW50KG5vZGUsIGV2ZW50LCBleGNsdWRlTm9kZSkge1xuICAgIC8vIFRPRE86IENvbnNpZGVyIHVzaW5nIHRoZSBlbGVtZW50IGNyZWF0ZWQgd2l0aCB0aGUgJ2NsYXNzaWZpZXInIHJhdGhlciB0aGFuIHRoZSBtb3VzZSBsb2NhdGlvblxuICAgIHZhciBzZWxlY3Rpb24gPSByYW5neS5nZXRTZWxlY3Rpb24oKTtcbiAgICBpZiAoaXNWYWxpZFNlbGVjdGlvbihzZWxlY3Rpb24sIG5vZGUsIGV4Y2x1ZGVOb2RlKSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgeDogZXZlbnQucGFnZVggLSAoIHNlbGVjdGlvbi5pc0JhY2t3YXJkcygpID8gLTUgOiA1KSxcbiAgICAgICAgICAgIHk6IGV2ZW50LnBhZ2VZIC0gOCAvLyBUT0RPOiBleGFjdCBjb29yZHNcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbn1cblxuLy8gQXR0ZW1wdHMgdG8gZ2V0IGEgcmFuZ2UgZnJvbSB0aGUgY3VycmVudCBzZWxlY3Rpb24uIFRoaXMgZXhwYW5kcyB0aGVcbi8vIHNlbGVjdGVkIHJlZ2lvbiB0byBpbmNsdWRlIHdvcmQgYm91bmRhcmllcy5cbmZ1bmN0aW9uIGdyYWJTZWxlY3Rpb24obm9kZSwgY2FsbGJhY2ssIGV4Y2x1ZGVOb2RlKSB7XG4gICAgdmFyIHNlbGVjdGlvbiA9IHJhbmd5LmdldFNlbGVjdGlvbigpO1xuICAgIGlmIChpc1ZhbGlkU2VsZWN0aW9uKHNlbGVjdGlvbiwgbm9kZSwgZXhjbHVkZU5vZGUpKSB7XG4gICAgICAgIGV4cGFuZEFuZFRyaW1SYW5nZShzZWxlY3Rpb24pO1xuICAgICAgICBpZiAoc2VsZWN0aW9uLmNvbnRhaW5zTm9kZShleGNsdWRlTm9kZSkpIHtcbiAgICAgICAgICAgIHZhciByYW5nZSA9IHNlbGVjdGlvbi5nZXRSYW5nZUF0KDApO1xuICAgICAgICAgICAgcmFuZ2Uuc2V0RW5kQmVmb3JlKGV4Y2x1ZGVOb2RlKTtcbiAgICAgICAgICAgIHNlbGVjdGlvbi5zZXRTaW5nbGVSYW5nZShyYW5nZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlzVmFsaWRTZWxlY3Rpb24oc2VsZWN0aW9uLCBub2RlLCBleGNsdWRlTm9kZSkpIHtcbiAgICAgICAgICAgIHZhciBsb2NhdGlvbjtcbiAgICAgICAgICAgIGlmIChzZWxlY3Rpb25FbmNvbXBhc3Nlc05vZGUoc2VsZWN0aW9uLCBub2RlKSkge1xuICAgICAgICAgICAgICAgIGxvY2F0aW9uID0gJzowLDoxJzsgLy8gVGhlIHVzZXIgaGFzIG1hbnVhbGx5IHNlbGVjdGVkIHRoZSBlbnRpcmUgbm9kZS4gTm9ybWFsaXplIHRoZSBsb2NhdGlvbi5cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbG9jYXRpb24gPSByYW5neS5zZXJpYWxpemVTZWxlY3Rpb24oc2VsZWN0aW9uLCB0cnVlLCBub2RlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciB0ZXh0ID0gc2VsZWN0aW9uLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICBoaWdobGlnaHRTZWxlY3Rpb24oc2VsZWN0aW9uKTsgLy8gSGlnaGxpZ2h0aW5nIGRlc2VsZWN0cyB0aGUgdGV4dCwgc28gZG8gdGhpcyBsYXN0LlxuICAgICAgICAgICAgY2FsbGJhY2sodGV4dCwgbG9jYXRpb24pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZXhwYW5kQW5kVHJpbVJhbmdlKHJhbmdlT3JTZWxlY3Rpb24pIHtcbiAgICAgICAgcmFuZ2VPclNlbGVjdGlvbi5leHBhbmQoJ3dvcmQnLCB7IHRyaW06IHRydWUsIHdvcmRPcHRpb25zOiB7IHdvcmRSZWdleDogL1xcUytcXFMqL2dpIH0gfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2VsZWN0aW9uRW5jb21wYXNzZXNOb2RlKHNlbGVjdGlvbiwgbm9kZSkge1xuICAgICAgICB2YXIgcmFuZ2UgPSBnZXROb2RlUmFuZ2Uobm9kZSk7XG4gICAgICAgIGV4cGFuZEFuZFRyaW1SYW5nZShyYW5nZSk7XG4gICAgICAgIHJldHVybiByYW5nZS50b1N0cmluZygpID09PSBzZWxlY3Rpb24udG9TdHJpbmcoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGlzVmFsaWRTZWxlY3Rpb24oc2VsZWN0aW9uLCBub2RlLCBleGNsdWRlTm9kZSkge1xuICAgIHJldHVybiAhc2VsZWN0aW9uLmlzQ29sbGFwc2VkICYmICAvLyBOb24tZW1wdHkgc2VsZWN0aW9uXG4gICAgICAgIHNlbGVjdGlvbi5yYW5nZUNvdW50ID09PSAxICYmIC8vIFNpbmdsZSBzZWxlY3Rpb25cbiAgICAgICAgKCFleGNsdWRlTm9kZSB8fCAhc2VsZWN0aW9uLmNvbnRhaW5zTm9kZShleGNsdWRlTm9kZSwgdHJ1ZSkpICYmIC8vIFNlbGVjdGlvbiBkb2Vzbid0IGNvbnRhaW4gYW55dGhpbmcgd2UndmUgc2FpZCB3ZSBkb24ndCB3YW50IChlLmcuIHRoZSBpbmRpY2F0b3IpXG4gICAgICAgIG5vZGVDb250YWluc1NlbGVjdGlvbihub2RlLCBzZWxlY3Rpb24pOyAvLyBTZWxlY3Rpb24gaXMgY29udGFpbmVkIGVudGlyZWx5IHdpdGhpbiB0aGUgbm9kZVxufVxuXG5mdW5jdGlvbiBub2RlQ29udGFpbnNTZWxlY3Rpb24obm9kZSwgc2VsZWN0aW9uKSB7XG4gICAgdmFyIGNvbW1vbkFuY2VzdG9yID0gc2VsZWN0aW9uLmdldFJhbmdlQXQoMCkuY29tbW9uQW5jZXN0b3JDb250YWluZXI7IC8vIGNvbW1vbkFuY2VzdG9yIGNvdWxkIGJlIGEgdGV4dCBub2RlIG9yIHNvbWUgcGFyZW50IGVsZW1lbnRcbiAgICByZXR1cm4gbm9kZS5jb250YWlucyhjb21tb25BbmNlc3RvcikgfHxcbiAgICAgICAgICAgIC8vIFRoZSBmb2xsb3dpbmcgY2hlY2sgaXMgZm9yIElFLCB3aGljaCBkb2Vzbid0IGltcGxlbWVudCBcImNvbnRhaW5zXCIgcHJvcGVybHkgZm9yIHRleHQgbm9kZXMuXG4gICAgICAgIChjb21tb25BbmNlc3Rvci5ub2RlVHlwZSA9PT0gMyAmJiBub2RlLmNvbnRhaW5zKGNvbW1vbkFuY2VzdG9yLnBhcmVudE5vZGUpKTtcbn1cblxuZnVuY3Rpb24gZ2V0Tm9kZVJhbmdlKG5vZGUpIHtcbiAgICB2YXIgcmFuZ2UgPSByYW5neS5jcmVhdGVSYW5nZShkb2N1bWVudCk7XG4gICAgcmFuZ2Uuc2VsZWN0Tm9kZUNvbnRlbnRzKG5vZGUpO1xuICAgIHZhciAkZXhjbHVkZWQgPSAkKG5vZGUpLmZpbmQoJy5hbnRlbm5hLXRleHQtaW5kaWNhdG9yLXdpZGdldCcpO1xuICAgIGlmICgkZXhjbHVkZWQuc2l6ZSgpID4gMCkgeyAvLyBSZW1vdmUgdGhlIGluZGljYXRvciBmcm9tIHRoZSBlbmQgb2YgdGhlIHNlbGVjdGVkIHJhbmdlLlxuICAgICAgICByYW5nZS5zZXRFbmRCZWZvcmUoJGV4Y2x1ZGVkLmdldCgwKSk7XG4gICAgfVxuICAgIHJldHVybiByYW5nZTtcbn1cblxuZnVuY3Rpb24gZ3JhYk5vZGUobm9kZSwgY2FsbGJhY2spIHtcbiAgICB2YXIgcmFuZ2UgPSBnZXROb2RlUmFuZ2Uobm9kZSk7XG4gICAgdmFyIHNlbGVjdGlvbiA9IHJhbmd5LmdldFNlbGVjdGlvbigpO1xuICAgIHNlbGVjdGlvbi5zZXRTaW5nbGVSYW5nZShyYW5nZSk7XG4gICAgLy8gV2Ugc2hvdWxkIGp1c3QgYmUgYWJsZSB0byBzZXJpYWxpemUgdGhlIHNlbGVjdGlvbiwgYnV0IHRoaXMgZ2l2ZXMgdXMgaW5jb25zaXN0ZW50IHZhbHVlcyBpbiBTYWZhcmkuXG4gICAgLy8gVGhlIHZhbHVlICpzaG91bGQqIGFsd2F5cyBiZSA6MCw6MSB3aGVuIHdlIHNlbGVjdCBhbiBlbnRpcmUgbm9kZSwgc28gd2UganVzdCBoYXJkY29kZSBpdC5cbiAgICAvL3ZhciBsb2NhdGlvbiA9IHJhbmd5LnNlcmlhbGl6ZVNlbGVjdGlvbihzZWxlY3Rpb24sIHRydWUsIG5vZGUpO1xuICAgIHZhciBsb2NhdGlvbiA9ICc6MCw6MSc7XG4gICAgdmFyIHRleHQgPSBzZWxlY3Rpb24udG9TdHJpbmcoKS50cmltKCk7XG4gICAgaWYgKHRleHQubGVuZ3RoID4gMCkge1xuICAgICAgICBoaWdobGlnaHRTZWxlY3Rpb24oc2VsZWN0aW9uKTsgLy8gSGlnaGxpZ2h0aW5nIGRlc2VsZWN0cyB0aGUgdGV4dCwgc28gZG8gdGhpcyBsYXN0LlxuICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKHRleHQsIGxvY2F0aW9uKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBzZWxlY3Rpb24ucmVtb3ZlQWxsUmFuZ2VzKCk7IC8vIERvbid0IGFjdHVhbGx5IGxlYXZlIHRoZSBlbGVtZW50IHNlbGVjdGVkLlxuICAgIHNlbGVjdGlvbi5yZWZyZXNoKCk7XG59XG5cbi8vIEhpZ2hsaWdodHMgdGhlIGdpdmVuIGxvY2F0aW9uIGluc2lkZSB0aGUgZ2l2ZW4gbm9kZS5cbmZ1bmN0aW9uIGhpZ2hsaWdodExvY2F0aW9uKG5vZGUsIGxvY2F0aW9uKSB7XG4gICAgLy8gVE9ETyBlcnJvciBoYW5kbGluZyBpbiBjYXNlIHRoZSByYW5nZSBpcyBub3QgdmFsaWQ/XG4gICAgaWYgKGxvY2F0aW9uID09PSAnOjAsOjEnKSB7XG4gICAgICAgIGdyYWJOb2RlKG5vZGUpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChyYW5neS5jYW5EZXNlcmlhbGl6ZVJhbmdlKGxvY2F0aW9uLCBub2RlLCBkb2N1bWVudCkpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHZhciByYW5nZSA9IHJhbmd5LmRlc2VyaWFsaXplUmFuZ2UobG9jYXRpb24sIG5vZGUsIGRvY3VtZW50KTtcbiAgICAgICAgICAgIGhpZ2hsaWdodFJhbmdlKHJhbmdlKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIC8vIFRPRE86IENvbnNpZGVyIGxvZ2dpbmcgc29tZSBraW5kIG9mIGV2ZW50IHNlcnZlci1zaWRlP1xuICAgICAgICAgICAgLy8gVE9ETzogQ29uc2lkZXIgaGlnaGxpZ2h0aW5nIHRoZSB3aG9sZSBub2RlPyBPciBpcyBpdCBiZXR0ZXIgdG8ganVzdCBoaWdobGlnaHQgbm90aGluZz9cbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gaGlnaGxpZ2h0U2VsZWN0aW9uKHNlbGVjdGlvbikge1xuICAgIGhpZ2hsaWdodFJhbmdlKHNlbGVjdGlvbi5nZXRSYW5nZUF0KDApKTtcbn1cblxuZnVuY3Rpb24gaGlnaGxpZ2h0UmFuZ2UocmFuZ2UpIHtcbiAgICBjbGVhckhpZ2hsaWdodHMoKTtcbiAgICBnZXRDbGFzc0FwcGxpZXIoKS5hcHBseVRvUmFuZ2UocmFuZ2UpO1xuICAgIGhpZ2hsaWdodGVkUmFuZ2VzLnB1c2gocmFuZ2UpO1xufVxuXG4vLyBDbGVhcnMgYWxsIGhpZ2hsaWdodHMgdGhhdCBoYXZlIGJlZW4gY3JlYXRlZCBvbiB0aGUgcGFnZS5cbmZ1bmN0aW9uIGNsZWFySGlnaGxpZ2h0cygpIHtcbiAgICB2YXIgY2xhc3NBcHBsaWVyID0gZ2V0Q2xhc3NBcHBsaWVyKCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBoaWdobGlnaHRlZFJhbmdlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgcmFuZ2UgPSBoaWdobGlnaHRlZFJhbmdlc1tpXTtcbiAgICAgICAgaWYgKGNsYXNzQXBwbGllci5pc0FwcGxpZWRUb1JhbmdlKHJhbmdlKSkge1xuICAgICAgICAgICAgY2xhc3NBcHBsaWVyLnVuZG9Ub1JhbmdlKHJhbmdlKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBoaWdobGlnaHRlZFJhbmdlcyA9IFtdO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgZ2V0U2VsZWN0aW9uRW5kUG9pbnQ6IGdldFNlbGVjdGlvbkVuZFBvaW50LFxuICAgIGdyYWJTZWxlY3Rpb246IGdyYWJTZWxlY3Rpb24sXG4gICAgZ3JhYk5vZGU6IGdyYWJOb2RlLFxuICAgIGNsZWFySGlnaGxpZ2h0czogY2xlYXJIaWdobGlnaHRzLFxuICAgIGhpZ2hsaWdodDogaGlnaGxpZ2h0TG9jYXRpb24sXG4gICAgSElHSExJR0hUX1NFTEVDVE9SOiAnLicgKyBoaWdobGlnaHRDbGFzc1xufTsiLCJcbnZhciBub0NvbmZsaWN0O1xudmFyIGxvYWRlZFJhbmd5O1xudmFyIGNhbGxiYWNrcyA9IFtdO1xuXG4vLyBDYXB0dXJlIGFueSBnbG9iYWwgaW5zdGFuY2Ugb2YgcmFuZ3kgd2hpY2ggYWxyZWFkeSBleGlzdHMgYmVmb3JlIHdlIGxvYWQgb3VyIG93bi5cbmZ1bmN0aW9uIGFib3V0VG9Mb2FkKCkge1xuICAgIG5vQ29uZmxpY3QgPSB3aW5kb3cucmFuZ3k7XG59XG5cbi8vIFJlc3RvcmUgdGhlIGdsb2JhbCBpbnN0YW5jZSBvZiByYW5neSAoaWYgYW55KSBhbmQgcGFzcyBvdXQgb3VyIHZlcnNpb24gdG8gb3VyIGNhbGxiYWNrc1xuZnVuY3Rpb24gbG9hZGVkKCkge1xuICAgIGxvYWRlZFJhbmd5ID0gcmFuZ3k7XG4gICAgbG9hZGVkUmFuZ3kuaW5pdCgpO1xuICAgIHdpbmRvdy5yYW5neSA9IG5vQ29uZmxpY3Q7XG4gICAgbm90aWZ5Q2FsbGJhY2tzKCk7XG59XG5cbmZ1bmN0aW9uIG5vdGlmeUNhbGxiYWNrcygpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNhbGxiYWNrcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjYWxsYmFja3NbaV0obG9hZGVkUmFuZ3kpO1xuICAgIH1cbiAgICBjYWxsYmFja3MgPSBbXTtcbn1cblxuLy8gUmVnaXN0ZXJzIHRoZSBnaXZlbiBjYWxsYmFjayB0byBiZSBub3RpZmllZCB3aGVuIG91ciB2ZXJzaW9uIG9mIFJhbmd5IGlzIGxvYWRlZC5cbmZ1bmN0aW9uIG9uTG9hZChjYWxsYmFjaykge1xuICAgIGlmIChsb2FkZWRSYW5neSkge1xuICAgICAgICBjYWxsYmFjayhsb2FkZWRSYW5neSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgY2FsbGJhY2tzLnB1c2goY2FsbGJhY2spO1xuICAgIH1cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGFib3V0VG9Mb2FkOiBhYm91dFRvTG9hZCxcbiAgICBsb2FkZWQ6IGxvYWRlZCxcbiAgICBvbkxvYWQ6IG9uTG9hZFxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcblxudmFyIENMQVNTX0ZVTEwgPSAnYW50ZW5uYS1mdWxsJztcbnZhciBDTEFTU19IQUxGID0gJ2FudGVubmEtaGFsZic7XG52YXIgQ0xBU1NfSEFMRl9TVFJFVENIID0gQ0xBU1NfSEFMRiArICcgYW50ZW5uYS1zdHJldGNoJztcblxuZnVuY3Rpb24gY29tcHV0ZUxheW91dERhdGEocmVhY3Rpb25zRGF0YSkge1xuICAgIHZhciBudW1SZWFjdGlvbnMgPSByZWFjdGlvbnNEYXRhLmxlbmd0aDtcbiAgICBpZiAobnVtUmVhY3Rpb25zID09IDApIHtcbiAgICAgICAgcmV0dXJuIHt9OyAvLyBUT0RPIGNsZWFuIHRoaXMgdXBcbiAgICB9XG4gICAgLy8gVE9ETzogQ29waWVkIGNvZGUgZnJvbSBlbmdhZ2VfZnVsbC5jcmVhdGVUYWdCdWNrZXRzXG4gICAgdmFyIG1lZGlhbiA9IHJlYWN0aW9uc0RhdGFbIE1hdGguZmxvb3IocmVhY3Rpb25zRGF0YS5sZW5ndGgvMikgXS5jb3VudDtcbiAgICB2YXIgdG90YWwgPSAwO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbnVtUmVhY3Rpb25zOyBpKyspIHtcbiAgICAgICAgdG90YWwgKz0gcmVhY3Rpb25zRGF0YVtpXS5jb3VudDtcbiAgICB9XG4gICAgdmFyIGF2ZXJhZ2UgPSBNYXRoLmZsb29yKHRvdGFsIC8gbnVtUmVhY3Rpb25zKTtcbiAgICB2YXIgbWlkVmFsdWUgPSAoIG1lZGlhbiA+IGF2ZXJhZ2UgKSA/IG1lZGlhbiA6IGF2ZXJhZ2U7XG5cbiAgICB2YXIgbGF5b3V0Q2xhc3NlcyA9IFtdO1xuICAgIHZhciBudW1IYWxmc2llcyA9IDA7XG4gICAgdmFyIG51bUZ1bGwgPSAwO1xuICAgIGZvciAodmFyIGogPSAwOyBqIDwgbnVtUmVhY3Rpb25zOyBqKyspIHtcbiAgICAgICAgaWYgKHJlYWN0aW9uc0RhdGFbal0uY291bnQgPiBtaWRWYWx1ZSkge1xuICAgICAgICAgICAgbGF5b3V0Q2xhc3Nlc1tqXSA9IENMQVNTX0ZVTEw7XG4gICAgICAgICAgICBudW1GdWxsKys7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsYXlvdXRDbGFzc2VzW2pdID0gQ0xBU1NfSEFMRjtcbiAgICAgICAgICAgIG51bUhhbGZzaWVzKys7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKG51bUhhbGZzaWVzICUgMiAhPT0gMCkge1xuICAgICAgICAvLyBJZiB0aGVyZSBhcmUgYW4gb2RkIG51bWJlciBvZiBoYWxmLXNpemVkIGJveGVzLCBtYWtlIG9uZSBvZiB0aGVtIGZ1bGwuXG4gICAgICAgIGlmIChudW1GdWxsID09PSAwKSB7XG4gICAgICAgICAgICAvLyBJZiB0aGVyZSBhcmUgbm8gb3RoZXIgZnVsbC1zaXplIGJveGVzLCBtYWtlIHRoZSBmaXJzdCBvbmUgZnVsbC1zaXplLlxuICAgICAgICAgICAgbGF5b3V0Q2xhc3Nlc1swXSA9IENMQVNTX0ZVTEw7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBPdGhlcndpc2UsIHNpbXBseSBzdHJldGNoIHRoZSBsYXN0IGJveCB0byBmaWxsIHRoZSBhdmFpbGFibGUgd2lkdGggKHRoaXMga2VlcHMgdGhlIHNtYWxsZXIgZm9udCBzaXplKS5cbiAgICAgICAgICAgIGxheW91dENsYXNzZXNbbnVtUmVhY3Rpb25zIC0gMV0gPSBDTEFTU19IQUxGX1NUUkVUQ0g7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBsYXlvdXRDbGFzc2VzOiBsYXlvdXRDbGFzc2VzXG4gICAgfTtcbn1cblxuZnVuY3Rpb24gc2l6ZVJlYWN0aW9uVGV4dFRvRml0KCRyZWFjdGlvbnNXaW5kb3cpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gc2l6ZVJlYWN0aW9uVGV4dFRvRml0KG5vZGUpIHtcbiAgICAgICAgdmFyICRlbGVtZW50ID0gJChub2RlKTtcbiAgICAgICAgdmFyIG9yaWdpbmFsRGlzcGxheSA9ICRyZWFjdGlvbnNXaW5kb3cuY3NzKCdkaXNwbGF5Jyk7XG4gICAgICAgIGlmIChvcmlnaW5hbERpc3BsYXkgPT09ICdub25lJykgeyAvLyBJZiB3ZSdyZSBzaXppbmcgdGhlIGJveGVzIGJlZm9yZSB0aGUgd2lkZ2V0IGlzIGRpc3BsYXllZCwgdGVtcG9yYXJpbHkgZGlzcGxheSBpdCBvZmZzY3JlZW4uXG4gICAgICAgICAgICAkcmVhY3Rpb25zV2luZG93LmNzcyh7ZGlzcGxheTogJ2Jsb2NrJywgbGVmdDogJzEwMCUnfSk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGhvcml6b250YWxSYXRpbyA9IG5vZGUuY2xpZW50V2lkdGggLyBub2RlLnNjcm9sbFdpZHRoO1xuICAgICAgICBpZiAoaG9yaXpvbnRhbFJhdGlvIDwgMS4wKSB7IC8vIElmIHRoZSB0ZXh0IGRvZXNuJ3QgZml0LCBmaXJzdCB0cnkgdG8gd3JhcCBpdCB0byB0d28gbGluZXMuIFRoZW4gc2NhbGUgaXQgZG93biBpZiBzdGlsbCBuZWNlc3NhcnkuXG4gICAgICAgICAgICB2YXIgdGV4dCA9IG5vZGUuaW5uZXJIVE1MO1xuICAgICAgICAgICAgdmFyIG1pZCA9IE1hdGguY2VpbCh0ZXh0Lmxlbmd0aCAvIDIpOyAvLyBMb29rIGZvciB0aGUgY2xvc2VzdCBzcGFjZSB0byB0aGUgbWlkZGxlLCB3ZWlnaHRlZCBzbGlnaHRseSAoTWF0aC5jZWlsKSB0b3dhcmQgYSBzcGFjZSBpbiB0aGUgc2Vjb25kIGhhbGYuXG4gICAgICAgICAgICB2YXIgc2Vjb25kSGFsZkluZGV4ID0gdGV4dC5pbmRleE9mKCcgJywgbWlkKTtcbiAgICAgICAgICAgIHZhciBmaXJzdEhhbGZJbmRleCA9IHRleHQubGFzdEluZGV4T2YoJyAnLCBtaWQpO1xuICAgICAgICAgICAgdmFyIHNwbGl0SW5kZXggPSBNYXRoLmFicyhzZWNvbmRIYWxmSW5kZXggLSBtaWQpIDwgTWF0aC5hYnMobWlkIC0gZmlyc3RIYWxmSW5kZXgpID8gc2Vjb25kSGFsZkluZGV4IDogZmlyc3RIYWxmSW5kZXg7XG4gICAgICAgICAgICBpZiAoc3BsaXRJbmRleCA8IDEpIHtcbiAgICAgICAgICAgICAgICAvLyBJZiB0aGVyZSdzIG5vIHNwYWNlIGluIHRoZSB0ZXh0LCBqdXN0IHNwbGl0IHRoZSB0ZXh0LiBTcGxpdCBvbiB0aGUgb3ZlcmZsb3cgcmF0aW8gaWYgdGhlIHRvcCBsaW5lIHdpbGxcbiAgICAgICAgICAgICAgICAvLyBoYXZlIG1vcmUgY2hhcmFjdGVycyB0aGFuIHRoZSBib3R0b20gKHNvIGl0IGxvb2tzIGxpa2UgdGhlIHRleHQgbmF0dXJhbGx5IHdyYXBzKSBvciBvdGhlcndpc2UgaW4gdGhlIG1pZGRsZS5cbiAgICAgICAgICAgICAgICBzcGxpdEluZGV4ID0gaG9yaXpvbnRhbFJhdGlvID4gMC41ID8gTWF0aC5jZWlsKHRleHQubGVuZ3RoICogaG9yaXpvbnRhbFJhdGlvKSA6IE1hdGguY2VpbCh0ZXh0Lmxlbmd0aCAvIDIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gU3BsaXQgdGhlIHRleHQgYW5kIHRoZW4gc2VlIGhvdyBpdCBmaXRzLlxuICAgICAgICAgICAgbm9kZS5pbm5lckhUTUwgPSB0ZXh0LnNsaWNlKDAsIHNwbGl0SW5kZXgpICsgJzxicj4nICsgdGV4dC5zbGljZShzcGxpdEluZGV4KTtcbiAgICAgICAgICAgIHZhciB3cmFwcGVkSG9yaXpvbnRhbFJhdGlvID0gbm9kZS5jbGllbnRXaWR0aCAvIG5vZGUuc2Nyb2xsV2lkdGg7XG4gICAgICAgICAgICBpZiAod3JhcHBlZEhvcml6b250YWxSYXRpbyA8IDEpIHtcbiAgICAgICAgICAgICAgICAkZWxlbWVudC5jc3MoJ2ZvbnQtc2l6ZScsIE1hdGgubWF4KDEwLCBNYXRoLmZsb29yKHBhcnNlSW50KCRlbGVtZW50LmNzcygnZm9udC1zaXplJykpICogd3JhcHBlZEhvcml6b250YWxSYXRpbykpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIFNocmluayB0aGUgY29udGFpbmluZyBib3ggcGFkZGluZyBpZiBuZWNlc3NhcnkgdG8gZml0IHRoZSAnY291bnQnXG4gICAgICAgICAgICB2YXIgY291bnQgPSBub2RlLnBhcmVudE5vZGUucXVlcnlTZWxlY3RvcignLmFudGVubmEtcmVhY3Rpb24tY291bnQnKTtcbiAgICAgICAgICAgIGlmIChjb3VudCkge1xuICAgICAgICAgICAgICAgIHZhciBhcHByb3hIZWlnaHQgPSBwYXJzZUludCgkZWxlbWVudC5jc3MoJ2ZvbnQtc2l6ZScpKSAqIDI7IC8vIEF0IHRoaXMgcG9pbnQgdGhlIGJyb3dzZXIgd29uJ3QgZ2l2ZSB1cyBhIHJlYWwgaGVpZ2h0LCBzbyB3ZSBuZWVkIHRvIGVzdGltYXRlIG91cnNlbHZlc1xuICAgICAgICAgICAgICAgIHZhciBjbGllbnRBcmVhID0gY29tcHV0ZUF2YWlsYWJsZUNsaWVudEFyZWEobm9kZS5wYXJlbnROb2RlKTtcbiAgICAgICAgICAgICAgICB2YXIgcmVtYWluaW5nU3BhY2UgPSBjbGllbnRBcmVhIC0gYXBwcm94SGVpZ2h0O1xuICAgICAgICAgICAgICAgIHZhciBjb3VudEhlaWdodCA9IGNvbXB1dGVOZWVkZWRIZWlnaHQoY291bnQpO1xuICAgICAgICAgICAgICAgIGlmIChyZW1haW5pbmdTcGFjZSA8IGNvdW50SGVpZ2h0KSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciAkcGFyZW50ID0gJChub2RlLnBhcmVudE5vZGUpO1xuICAgICAgICAgICAgICAgICAgICAkcGFyZW50LmNzcygncGFkZGluZy10b3AnLCBwYXJzZUludCgkcGFyZW50LmNzcygncGFkZGluZy10b3AnKSkgLSAoKGNvdW50SGVpZ2h0LXJlbWFpbmluZ1NwYWNlKS8yKSApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAob3JpZ2luYWxEaXNwbGF5ID09PSAnbm9uZScpIHtcbiAgICAgICAgICAgICRyZWFjdGlvbnNXaW5kb3cuY3NzKHtkaXNwbGF5OiAnJywgbGVmdDogJyd9KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdGVhcmRvd246IGZ1bmN0aW9uKCkge31cbiAgICAgICAgfTtcbiAgICB9O1xufVxuXG5mdW5jdGlvbiBjb21wdXRlQXZhaWxhYmxlQ2xpZW50QXJlYShub2RlKSB7XG4gICAgdmFyIG5vZGVTdHlsZSA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKG5vZGUpO1xuICAgIHJldHVybiBwYXJzZUludChub2RlU3R5bGUuaGVpZ2h0KSAtIHBhcnNlSW50KG5vZGVTdHlsZS5wYWRkaW5nVG9wKSAtIHBhcnNlSW50KG5vZGVTdHlsZS5wYWRkaW5nQm90dG9tKTtcbn1cblxuZnVuY3Rpb24gY29tcHV0ZU5lZWRlZEhlaWdodChub2RlKSB7XG4gICAgdmFyIG5vZGVTdHlsZSA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKG5vZGUpO1xuICAgIHJldHVybiBwYXJzZUludChub2RlU3R5bGUuaGVpZ2h0KSArIHBhcnNlSW50KG5vZGVTdHlsZS5tYXJnaW5Ub3ApICsgcGFyc2VJbnQobm9kZVN0eWxlLm1hcmdpbkJvdHRvbSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHNpemVUb0ZpdDogc2l6ZVJlYWN0aW9uVGV4dFRvRml0LFxuICAgIGNvbXB1dGVMYXlvdXREYXRhOiBjb21wdXRlTGF5b3V0RGF0YVxufTsiLCJ2YXIgVXJsUGFyYW1zID0gcmVxdWlyZSgnLi91cmwtcGFyYW1zJyk7XG5cbnZhciBzZWdtZW50O1xuXG5mdW5jdGlvbiBnZXRTZWdtZW50KGdyb3VwU2V0dGluZ3MpIHtcbiAgICBpZiAoc2VnbWVudCA9PT0gdW5kZWZpbmVkKSB7IC8vICdudWxsJyBpcyB0aGUgb3B0LW91dCB2YWx1ZVxuICAgICAgICBzZWdtZW50ID0gY29tcHV0ZVNlZ21lbnQoZ3JvdXBTZXR0aW5ncyk7XG4gICAgfVxuICAgIHJldHVybiBzZWdtZW50O1xufVxuXG5mdW5jdGlvbiBjb21wdXRlU2VnbWVudChncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIHNlZ21lbnRzID0gWyAnc3cnLCAneHN3JyBdO1xuICAgIHZhciBzZWdtZW50T3ZlcnJpZGUgPSBVcmxQYXJhbXMuZ2V0VXJsUGFyYW0oJ2FudGVubmFTZWdtZW50Jyk7XG4gICAgaWYgKHNlZ21lbnRPdmVycmlkZSkge1xuICAgICAgICBzdG9yZVNlZ21lbnQoc2VnbWVudE92ZXJyaWRlKTtcbiAgICAgICAgcmV0dXJuIHNlZ21lbnRPdmVycmlkZTtcbiAgICB9XG4gICAgdmFyIHNlZ21lbnQ7XG4gICAgaWYgKGlzU2VnbWVudEdyb3VwKCkpIHtcbiAgICAgICAgc2VnbWVudCA9IHJlYWRTZWdtZW50KCk7XG4gICAgICAgIGlmICghc2VnbWVudCkge1xuICAgICAgICAgICAgc2VnbWVudCA9IGNyZWF0ZVNlZ21lbnQoZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICBzZWdtZW50ID0gc3RvcmVTZWdtZW50KHNlZ21lbnQpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzZWdtZW50O1xuXG4gICAgZnVuY3Rpb24gcmVhZFNlZ21lbnQoKSB7XG4gICAgICAgIC8vIFJldHVybnMgdGhlIHN0b3JlZCBzZWdtZW50LCBidXQgb25seSBpZiBpdCBpcyBvbmUgb2YgdGhlIGN1cnJlbnQgdmFsaWQgc2VnbWVudHMuXG4gICAgICAgIHZhciBzZWdtZW50ID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ2FudF9zZWdtZW50Jyk7XG4gICAgICAgIGlmIChzZWdtZW50KSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNlZ21lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNlZ21lbnQgPT09IHNlZ21lbnRzW2ldKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzZWdtZW50OyAvLyBWYWxpZCBzZWdtZW50LiBSZXR1cm4uXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY3JlYXRlU2VnbWVudChncm91cFNldHRpbmdzKSB7XG4gICAgICAgIHJldHVybiBzZWdtZW50c1tNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBzZWdtZW50cy5sZW5ndGgpXTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzdG9yZVNlZ21lbnQoc2VnbWVudCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2FudF9zZWdtZW50Jywgc2VnbWVudCk7XG4gICAgICAgIH0gY2F0Y2goZXJyb3IpIHtcbiAgICAgICAgICAgIC8vIFNvbWUgYnJvd3NlcnMgKG1vYmlsZSBTYWZhcmkpIHRocm93IGFuIGV4Y2VwdGlvbiB3aGVuIGluIHByaXZhdGUgYnJvd3NpbmcgbW9kZS5cbiAgICAgICAgICAgIC8vIElmIHRoaXMgaGFwcGVucywgb3B0IG91dCBvZiBzZWdtZW50aW5nXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgcmV0dXJuIHNlZ21lbnQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNTZWdtZW50R3JvdXAoKSB7XG4gICAgICAgIHZhciBncm91cE5hbWUgPSBncm91cFNldHRpbmdzLmdyb3VwTmFtZSgpO1xuICAgICAgICB2YXIgdGVzdEdyb3VwcyA9IFsgJ2J1c3RsZS5jb20nLCAnbG9jYWwuYW50ZW5uYS5pczo4MDgxJyBdO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRlc3RHcm91cHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmICh0ZXN0R3JvdXBzW2ldID09PSBncm91cE5hbWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBpc0V4cGFuZGVkU3VtbWFyeVNlZ21lbnQoZ3JvdXBTZXR0aW5ncykge1xuICAgIHJldHVybiBnZXRTZWdtZW50KGdyb3VwU2V0dGluZ3MpID09PSAneHN3Jztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgZ2V0U2VnbWVudDogZ2V0U2VnbWVudCxcbiAgICBpc0V4cGFuZGVkU3VtbWFyeVNlZ21lbnQ6IGlzRXhwYW5kZWRTdW1tYXJ5U2VnbWVudFxufTsiLCJ2YXIgSlNPTlV0aWxzID0gcmVxdWlyZSgnLi9qc29uLXV0aWxzJyk7XG5cbnZhciBsdHNEYXRhO1xudmFyIHN0c0RhdGE7XG5cbmZ1bmN0aW9uIGdldExvbmdUZXJtU2Vzc2lvbklkKCkge1xuICAgIGlmICghbHRzRGF0YSkge1xuICAgICAgICBsdHNEYXRhID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ2FudF9sdHMnKTtcbiAgICAgICAgaWYgKCFsdHNEYXRhKSB7XG4gICAgICAgICAgICBsdHNEYXRhID0gY3JlYXRlR3VpZCgpO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnYW50X2x0cycsIGx0c0RhdGEpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAvLyBTb21lIGJyb3dzZXJzIChtb2JpbGUgU2FmYXJpKSB0aHJvdyBhbiBleGNlcHRpb24gd2hlbiBpbiBwcml2YXRlIGJyb3dzaW5nIG1vZGUuXG4gICAgICAgICAgICAgICAgLy8gTm90aGluZyB3ZSBjYW4gZG8gYWJvdXQgaXQuIEp1c3QgZmFsbCB0aHJvdWdoIGFuZCByZXR1cm4gdGhlIGRhdGEgd2UgaGF2ZSBpbiBtZW1vcnkuXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGx0c0RhdGE7XG59XG5cbmZ1bmN0aW9uIGdldFNob3J0VGVybVNlc3Npb25JZCgpIHtcbiAgICBpZiAoIXN0c0RhdGEpIHtcbiAgICAgICAgdmFyIGpzb24gPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnYW50X3N0cycpO1xuICAgICAgICBpZiAoanNvbikge1xuICAgICAgICAgICAgc3RzRGF0YSA9IEpTT04ucGFyc2UoanNvbik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKHN0c0RhdGEgJiYgRGF0ZS5ub3coKSA+IHN0c0RhdGEuZXhwaXJlcykge1xuICAgICAgICBzdHNEYXRhID0gbnVsbDsgLy8gZXhwaXJlIHRoZSBzZXNzaW9uXG4gICAgfVxuICAgIGlmICghc3RzRGF0YSkge1xuICAgICAgICBzdHNEYXRhID0geyBndWlkOiBjcmVhdGVHdWlkKCkgfTsgLy8gY3JlYXRlIGEgbmV3IHNlc3Npb25cbiAgICB9XG4gICAgLy8gQWx3YXlzIHNldCBhIG5ldyBleHBpcmVzIHRpbWUsIHNvIHRoYXQgd2Uga2VlcCBleHRlbmRpbmcgdGhlIHRpbWUgYXMgbG9uZyBhcyB0aGUgdXNlciBpcyBhY3RpdmVcbiAgICB2YXIgbWludXRlcyA9IDE1O1xuICAgIHN0c0RhdGEuZXhwaXJlcyA9IERhdGUubm93KCkgKyBtaW51dGVzICogNjAwMDA7XG4gICAgdHJ5IHtcbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2FudF9zdHMnLCBKU09OVXRpbHMuc3RyaW5naWZ5KHN0c0RhdGEpKTtcbiAgICB9IGNhdGNoKGVycm9yKSB7XG4gICAgICAgIC8vIFNvbWUgYnJvd3NlcnMgKG1vYmlsZSBTYWZhcmkpIHRocm93IGFuIGV4Y2VwdGlvbiB3aGVuIGluIHByaXZhdGUgYnJvd3NpbmcgbW9kZS5cbiAgICAgICAgLy8gTm90aGluZyB3ZSBjYW4gZG8gYWJvdXQgaXQuIEp1c3QgZmFsbCB0aHJvdWdoIGFuZCByZXR1cm4gdGhlIGRhdGEgd2UgaGF2ZSBpbiBtZW1vcnkuXG4gICAgfVxuICAgIHJldHVybiBzdHNEYXRhLmd1aWQ7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUd1aWQoKSB7XG4gICAgLy8gQ29kZSBjb3BpZWQgZnJvbSBlbmdhZ2VfZnVsbCAob3JpZ2luYWxseSwgaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xMDUwMzQvY3JlYXRlLWd1aWQtdXVpZC1pbi1qYXZhc2NyaXB0KVxuICAgIHJldHVybiAneHh4eHh4eHgteHh4eC00eHh4LXl4eHgteHh4eHh4eHh4eHh4Jy5yZXBsYWNlKC9beHldL2csIGZ1bmN0aW9uIChjKSB7XG4gICAgICAgIHZhciByID0gTWF0aC5yYW5kb20oKSAqIDE2IHwgMCwgdiA9IGMgPT0gJ3gnID8gciA6IChyICYgMHgzIHwgMHg4KTtcbiAgICAgICAgcmV0dXJuIHYudG9TdHJpbmcoMTYpO1xuICAgIH0pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBnZXRMb25nVGVybVNlc3Npb246IGdldExvbmdUZXJtU2Vzc2lvbklkLFxuICAgIGdldFNob3J0VGVybVNlc3Npb246IGdldFNob3J0VGVybVNlc3Npb25JZFxufTsiLCJ2YXIgQ2FsbGJhY2tTdXBwb3J0ID0gcmVxdWlyZSgnLi9jYWxsYmFjay1zdXBwb3J0Jyk7XG5cbi8vIFRoaXMgbW9kdWxlIGFsbG93cyB1cyB0byByZWdpc3RlciBjYWxsYmFja3MgdGhhdCBhcmUgdGhyb3R0bGVkIGluIHRoZWlyIGZyZXF1ZW5jeS4gVGhpcyBpcyB1c2VmdWwgZm9yIGV2ZW50cyBsaWtlXG4vLyByZXNpemUgYW5kIHNjcm9sbCwgd2hpY2ggY2FuIGJlIGZpcmVkIGF0IGFuIGV4dHJlbWVseSBoaWdoIHJhdGUuXG5cbnZhciB0aHJvdHRsZWRMaXN0ZW5lcnMgPSB7fTtcblxuZnVuY3Rpb24gb24odHlwZSwgY2FsbGJhY2spIHtcbiAgICB0aHJvdHRsZWRMaXN0ZW5lcnNbdHlwZV0gPSB0aHJvdHRsZWRMaXN0ZW5lcnNbdHlwZV0gfHwgY3JlYXRlVGhyb3R0bGVkTGlzdGVuZXIodHlwZSk7XG4gICAgdGhyb3R0bGVkTGlzdGVuZXJzW3R5cGVdLmFkZENhbGxiYWNrKGNhbGxiYWNrKTtcbn1cblxuZnVuY3Rpb24gb2ZmKHR5cGUsIGNhbGxiYWNrKSB7XG4gICAgdmFyIGV2ZW50TGlzdGVuZXIgPSB0aHJvdHRsZWRMaXN0ZW5lcnNbdHlwZV07XG4gICAgaWYgKGV2ZW50TGlzdGVuZXIpIHtcbiAgICAgICAgZXZlbnRMaXN0ZW5lci5yZW1vdmVDYWxsYmFjayhjYWxsYmFjayk7XG4gICAgICAgIGlmIChldmVudExpc3RlbmVyLmlzRW1wdHkoKSkge1xuICAgICAgICAgICAgZXZlbnRMaXN0ZW5lci50ZWFyZG93bigpO1xuICAgICAgICAgICAgZGVsZXRlIHRocm90dGxlZExpc3RlbmVyc1t0eXBlXTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLy8gQ3JlYXRlcyBhIGxpc3RlbmVyIG9uIHRoZSBwYXJ0aWN1bGFyIGV2ZW50IHR5cGUuIENhbGxiYWNrcyBhZGRlZCB0byB0aGlzIGxpc3RlbmVyIHdpbGwgYmUgdGhyb3R0bGVkLlxuZnVuY3Rpb24gY3JlYXRlVGhyb3R0bGVkTGlzdGVuZXIodHlwZSkge1xuICAgIHZhciBjYWxsYmFja3MgPSBDYWxsYmFja1N1cHBvcnQuY3JlYXRlKCk7XG4gICAgdmFyIGV2ZW50VGltZW91dDtcbiAgICBzZXR1cCgpO1xuICAgIHJldHVybiB7XG4gICAgICAgIGFkZENhbGxiYWNrOiBjYWxsYmFja3MuYWRkLFxuICAgICAgICByZW1vdmVDYWxsYmFjazogY2FsbGJhY2tzLnJlbW92ZSxcbiAgICAgICAgaXNFbXB0eTogY2FsbGJhY2tzLmlzRW1wdHksXG4gICAgICAgIHRlYXJkb3duOiB0ZWFyZG93blxuICAgIH07XG5cbiAgICBmdW5jdGlvbiBoYW5kbGVFdmVudCgpIHtcbiAgICAgICBpZiAoIWV2ZW50VGltZW91dCkge1xuICAgICAgICAgICBldmVudFRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgY2FsbGJhY2tzLmludm9rZUFsbCgpO1xuICAgICAgICAgICAgICAgZXZlbnRUaW1lb3V0ID0gbnVsbDtcbiAgICAgICAgICAgfSwgNjYpOyAvLyAxNSBGUFNcbiAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2V0dXAoKSB7XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKHR5cGUsIGhhbmRsZUV2ZW50KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB0ZWFyZG93bigpIHtcbiAgICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIodHlwZSwgaGFuZGxlRXZlbnQpO1xuICAgIH1cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIG9uOiBvbixcbiAgICBvZmY6IG9mZlxufTsiLCJcbi8vIFRPRE86IENvbnNpZGVyIGFkZGluZyBzdXBwb3J0IGZvciB0aGUgTVMgcHJvcHJpZXRhcnkgXCJQb2ludGVyIEV2ZW50c1wiIEFQSS5cblxuLy8gU2V0cyB1cCB0aGUgZ2l2ZW4gZWxlbWVudCB0byBiZSBjYWxsZWQgd2l0aCBhIFRvdWNoRXZlbnQgdGhhdCB3ZSByZWNvZ25pemUgYXMgYSB0YXAuXG5mdW5jdGlvbiBzZXR1cFRvdWNoVGFwRXZlbnRzKGVsZW1lbnQsIGNhbGxiYWNrKSB7XG4gICAgdmFyIHRpbWVvdXQgPSA0MDA7IC8vIFRoaXMgaXMgdGhlIHRpbWUgYmV0d2VlbiB0b3VjaHN0YXJ0IGFuZCB0b3VjaGVuZCB0aGF0IHdlIHVzZSB0byBkaXN0aW5ndWlzaCBhIHRhcCBmcm9tIGEgbG9uZyBwcmVzcy5cbiAgICB2YXIgdmFsaWRUYXAgPSBmYWxzZTtcbiAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0b3VjaFN0YXJ0KTtcbiAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIHRvdWNoTW92ZSk7XG4gICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGNhbmNlbCcsIHRvdWNoQ2FuY2VsKTtcbiAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgdG91Y2hFbmQpO1xuICAgIHJldHVybiB7XG4gICAgICAgIHRlYXJkb3duOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRvdWNoU3RhcnQpO1xuICAgICAgICAgICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCB0b3VjaE1vdmUpO1xuICAgICAgICAgICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaGNhbmNlbCcsIHRvdWNoQ2FuY2VsKTtcbiAgICAgICAgICAgIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCB0b3VjaEVuZCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gdG91Y2hTdGFydChldmVudCkge1xuICAgICAgICB2YWxpZFRhcCA9IHRydWU7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YWxpZFRhcCA9IGZhbHNlO1xuICAgICAgICB9LCB0aW1lb3V0KTtcbiAgICB9XG4gICAgZnVuY3Rpb24gdG91Y2hFbmQoZXZlbnQpIHtcbiAgICAgICAgaWYgKHZhbGlkVGFwICYmIGV2ZW50LmNoYW5nZWRUb3VjaGVzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgY2FsbGJhY2soZXZlbnQpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIHRvdWNoTW92ZShldmVudCkge1xuICAgICAgICB2YWxpZFRhcCA9IGZhbHNlO1xuICAgIH1cbiAgICBmdW5jdGlvbiB0b3VjaENhbmNlbChldmVudCkge1xuICAgICAgICB2YWxpZFRhcCA9IGZhbHNlO1xuICAgIH1cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHNldHVwVGFwOiBzZXR1cFRvdWNoVGFwRXZlbnRzXG59OyIsIlxuXG5mdW5jdGlvbiB0b2dnbGVUcmFuc2l0aW9uQ2xhc3MoJGVsZW1lbnQsIGNsYXNzTmFtZSwgc3RhdGUsIG5leHRTdGVwKSB7XG4gICAgJGVsZW1lbnQub24oXCJ0cmFuc2l0aW9uZW5kIHdlYmtpdFRyYW5zaXRpb25FbmQgb1RyYW5zaXRpb25FbmQgTVNUcmFuc2l0aW9uRW5kXCIsXG4gICAgICAgIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICAvLyBvbmNlIHRoZSBDU1MgdHJhbnNpdGlvbiBpcyBjb21wbGV0ZSwgY2FsbCBvdXIgbmV4dCBzdGVwXG4gICAgICAgICAgICAvLyBTZWU6IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvOTI1NTI3OS9jYWxsYmFjay13aGVuLWNzczMtdHJhbnNpdGlvbi1maW5pc2hlc1xuICAgICAgICAgICAgaWYgKGV2ZW50LnRhcmdldCA9PSBldmVudC5jdXJyZW50VGFyZ2V0KSB7XG4gICAgICAgICAgICAgICAgJGVsZW1lbnQub2ZmKFwidHJhbnNpdGlvbmVuZCB3ZWJraXRUcmFuc2l0aW9uRW5kIG9UcmFuc2l0aW9uRW5kIE1TVHJhbnNpdGlvbkVuZFwiKTtcbiAgICAgICAgICAgICAgICBpZiAobmV4dFN0ZXApIHtcbiAgICAgICAgICAgICAgICAgICAgbmV4dFN0ZXAoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICApO1xuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIFRoaXMgd29ya2Fyb3VuZCBnZXRzIHVzIGNvbnNpc3RlbnQgdHJhbnNpdGlvbmVuZCBldmVudHMsIHdoaWNoIGNhbiBvdGhlcndpc2UgYmUgZmxha3kgaWYgd2UncmUgc2V0dGluZyBvdGhlclxuICAgICAgICAvLyBjbGFzc2VzIGF0IHRoZSBzYW1lIHRpbWUgYXMgdHJhbnNpdGlvbiBjbGFzc2VzLlxuICAgICAgICAkZWxlbWVudC50b2dnbGVDbGFzcyhjbGFzc05hbWUsIHN0YXRlKTtcbiAgICB9LCAyMCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHRvZ2dsZUNsYXNzOiB0b2dnbGVUcmFuc2l0aW9uQ2xhc3Ncbn07IiwidmFyIFBST0RfU0VSVkVSX1VSTCA9IFwiaHR0cHM6Ly93d3cuYW50ZW5uYS5pc1wiOyAvLyBUT0RPOiB3d3c/IGhvdyBhYm91dCBhbnRlbm5hLmlzIG9yIGFwaS5hbnRlbm5hLmlzP1xudmFyIERFVl9TRVJWRVJfVVJMID0gXCJodHRwOi8vbG9jYWwtc3RhdGljLmFudGVubmEuaXM6ODA4MVwiO1xudmFyIFRFU1RfU0VSVkVSX1VSTCA9ICdodHRwOi8vbG9jYWxob3N0OjMwMDEnO1xudmFyIEFNQVpPTl9TM19VUkwgPSAnLy9jZG4uYW50ZW5uYS5pcyc7XG5cbnZhciBQUk9EX0VWRU5UX1NFUlZFUl9VUkwgPSAnaHR0cHM6Ly9ldmVudHMuYW50ZW5uYS5pcyc7XG52YXIgREVWX0VWRU5UX1NFUlZFUl9VUkwgPSAnaHR0cDovL25vZGVicS5kb2NrZXI6MzAwMCc7XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBQUk9EVUNUSU9OOiBQUk9EX1NFUlZFUl9VUkwsXG4gICAgREVWRUxPUE1FTlQ6IERFVl9TRVJWRVJfVVJMLFxuICAgIFRFU1Q6IFRFU1RfU0VSVkVSX1VSTCxcbiAgICBBTUFaT05fUzM6IEFNQVpPTl9TM19VUkwsXG4gICAgUFJPRFVDVElPTl9FVkVOVFM6IFBST0RfRVZFTlRfU0VSVkVSX1VSTCxcbiAgICBERVZFTE9QTUVOVF9FVkVOVFM6IERFVl9FVkVOVF9TRVJWRVJfVVJMXG59OyIsIlxudmFyIHVybFBhcmFtcztcblxuZnVuY3Rpb24gZ2V0VXJsUGFyYW0oa2V5KSB7XG4gICAgaWYgKCF1cmxQYXJhbXMpIHtcbiAgICAgICAgdXJsUGFyYW1zID0gcGFyc2VVcmxQYXJhbXMoKTtcbiAgICB9XG4gICAgcmV0dXJuIHVybFBhcmFtc1trZXldO1xufVxuXG5mdW5jdGlvbiBwYXJzZVVybFBhcmFtcygpIHtcbiAgICB2YXIgcXVlcnlTdHJpbmcgPSB3aW5kb3cubG9jYXRpb24uc2VhcmNoO1xuICAgIHZhciB1cmxQYXJhbXMgPSB7fTtcbiAgICB2YXIgZSxcbiAgICBhID0gL1xcKy9nLCAgLy8gUmVnZXggZm9yIHJlcGxhY2luZyBhZGRpdGlvbiBzeW1ib2wgd2l0aCBhIHNwYWNlXG4gICAgciA9IC8oW14mPV0rKT0/KFteJl0qKS9nLFxuICAgIGQgPSBmdW5jdGlvbiAocykgeyByZXR1cm4gZGVjb2RlVVJJQ29tcG9uZW50KHMucmVwbGFjZShhLCBcIiBcIikpOyB9LFxuICAgIHEgPSBxdWVyeVN0cmluZy5zdWJzdHJpbmcoMSk7XG5cbiAgICB3aGlsZSAoZSA9IHIuZXhlYyhxKSkge1xuICAgICAgICB1cmxQYXJhbXNbZChlWzFdKV0gPSBkKGVbMl0pO1xuICAgIH1cbiAgICByZXR1cm4gdXJsUGFyYW1zO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBnZXRVcmxQYXJhbTogZ2V0VXJsUGFyYW1cbn07IiwidmFyIEFwcE1vZGUgPSByZXF1aXJlKCcuL2FwcC1tb2RlJyk7XG52YXIgSlNPTlV0aWxzID0gcmVxdWlyZSgnLi9qc29uLXV0aWxzJyk7XG52YXIgVVJMQ29uc3RhbnRzID0gcmVxdWlyZSgnLi91cmwtY29uc3RhbnRzJyk7XG5cbmZ1bmN0aW9uIGdldEdyb3VwU2V0dGluZ3NVcmwoKSB7XG4gICAgcmV0dXJuICcvYXBpL3NldHRpbmdzLyc7XG59XG5cbmZ1bmN0aW9uIGdldFBhZ2VEYXRhVXJsKCkge1xuICAgIHJldHVybiAnL2FwaS9wYWdlbmV3ZXIvJztcbn1cblxuZnVuY3Rpb24gZ2V0Q3JlYXRlUmVhY3Rpb25VcmwoKSB7XG4gICAgcmV0dXJuICcvYXBpL3RhZy9jcmVhdGUvJztcbn1cblxuZnVuY3Rpb24gZ2V0RmV0Y2hDb250ZW50Qm9kaWVzVXJsKCkge1xuICAgIHJldHVybiAnL2FwaS9jb250ZW50L2JvZGllcy8nO1xufVxuXG5mdW5jdGlvbiBnZXRGZXRjaENvbnRlbnRSZWNvbW1lbmRhdGlvblVybCgpIHtcbiAgICByZXR1cm4gJy9hcGkvY29udGVudHJlYy8nO1xufVxuXG5mdW5jdGlvbiBnZXRTaGFyZVJlYWN0aW9uVXJsKCkge1xuICAgIHJldHVybiAnL2FwaS9zaGFyZS87J1xufVxuXG5mdW5jdGlvbiBnZXRDcmVhdGVUZW1wVXNlclVybCgpIHtcbiAgICByZXR1cm4gJy9hcGkvdGVtcHVzZXIvJztcbn1cblxuZnVuY3Rpb24gZ2V0U2hhcmVXaW5kb3dVcmwoKSB7XG4gICAgcmV0dXJuICcvc3RhdGljL3NoYXJlLmh0bWwnO1xufVxuXG5mdW5jdGlvbiBnZXRFdmVudFVybCgpIHtcbiAgICByZXR1cm4gJy9pbnNlcnQnOyAvLyBOb3RlIHRoYXQgdGhpcyBVUkwgaXMgZm9yIHRoZSBldmVudCBzZXJ2ZXIsIG5vdCB0aGUgYXBwIHNlcnZlci5cbn1cblxuZnVuY3Rpb24gYW50ZW5uYUxvZ2luVXJsKCkge1xuICAgIHJldHVybiAnL2FudF9sb2dpbi8nO1xufVxuXG5mdW5jdGlvbiBjb21wdXRlSW1hZ2VVcmwoJGVsZW1lbnQsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgdHJhbnNmb3JtID0gZ2V0SW1hZ2VVUkxUcmFuc2Zvcm0oZ3JvdXBTZXR0aW5ncyk7XG4gICAgaWYgKHRyYW5zZm9ybSkge1xuICAgICAgICByZXR1cm4gdHJhbnNmb3JtKCRlbGVtZW50LmdldCgwKSk7XG4gICAgfVxuICAgIGlmIChncm91cFNldHRpbmdzLmxlZ2FjeUJlaGF2aW9yKCkpIHtcbiAgICAgICAgcmV0dXJuIGxlZ2FjeUNvbXB1dGVJbWFnZVVybCgkZWxlbWVudCk7XG4gICAgfVxuICAgIHZhciBjb250ZW50ID0gJGVsZW1lbnQuYXR0cignYW50LWl0ZW0tY29udGVudCcpIHx8ICRlbGVtZW50LmF0dHIoJ3NyYycpO1xuICAgIGlmIChjb250ZW50ICYmIGNvbnRlbnQuaW5kZXhPZignLy8nKSAhPT0gMCAmJiBjb250ZW50LmluZGV4T2YoJ2h0dHAnKSAhPT0gMCkgeyAvLyBwcm90b2NvbC1yZWxhdGl2ZSBvciBhYnNvbHV0ZSB1cmwsIGUuZy4gLy9kb21haW4uY29tL2Zvby9iYXIucG5nIG9yIGh0dHA6Ly9kb21haW4uY29tL2Zvby9iYXIvcG5nXG4gICAgICAgIGlmIChjb250ZW50LmluZGV4T2YoJy8nKSA9PT0gMCkgeyAvLyBkb21haW4tcmVsYXRpdmUgdXJsLCBlLmcuIC9mb28vYmFyLnBuZyA9PiBkb21haW4uY29tL2Zvby9iYXIucG5nXG4gICAgICAgICAgICBjb250ZW50ID0gd2luZG93LmxvY2F0aW9uLm9yaWdpbiArIGNvbnRlbnQ7XG4gICAgICAgIH0gZWxzZSB7IC8vIHBhdGgtcmVsYXRpdmUgdXJsLCBlLmcuIGJhci5wbmcgPT4gZG9tYWluLmNvbS9iYXovYmFyLnBuZ1xuICAgICAgICAgICAgdmFyIHBhdGggPSB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWU7XG4gICAgICAgICAgICB2YXIgaW5kZXggPSBwYXRoLmxhc3RJbmRleE9mKCcvJykgKyAxO1xuICAgICAgICAgICAgaWYgKHBhdGgubGVuZ3RoID4gaW5kZXgpIHtcbiAgICAgICAgICAgICAgICBwYXRoID0gcGF0aC5zdWJzdHJpbmcoMCwgaW5kZXgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29udGVudCA9IHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4gKyBwYXRoICsgY29udGVudDtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gY29udGVudDtcbn1cblxuZnVuY3Rpb24gZ2V0SW1hZ2VVUkxUcmFuc2Zvcm0oZ3JvdXBTZXR0aW5ncykge1xuICAgIGlmIChncm91cFNldHRpbmdzLmdyb3VwTmFtZSgpLmluZGV4T2YoJy5hYm91dC5jb20nKSAhPT0gLTEpIHtcbiAgICAgICAgdmFyIHBhdHRlcm4gPSAvKGh0dHA6XFwvXFwvZlxcLnRxblxcLmNvbVxcL3lcXC9bXlxcL10qXFwvMSlcXC9bTFddXFwvKFteXFwvXVxcL1teXFwvXVxcL1teXFwvXVxcL1teXFwvXVxcL1teXFwvXSopL2dpO1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oZWxlbWVudCkge1xuICAgICAgICAgICAgdmFyIHNyYyA9IGVsZW1lbnQuZ2V0QXR0cmlidXRlKCdzcmMnKTtcbiAgICAgICAgICAgIGlmIChzcmMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3JjLnJlcGxhY2UocGF0dGVybiwgJyQxL1MvJDInKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuLy8gTGVnYWN5IGltcGxlbWVudGF0aW9uIHdoaWNoIG1haW50YWlucyB0aGUgb2xkIGJlaGF2aW9yIG9mIGVuZ2FnZV9mdWxsXG4vLyBUaGlzIGNvZGUgaXMgd3JvbmcgZm9yIFVSTHMgdGhhdCBzdGFydCB3aXRoIFwiLy9cIi4gSXQgYWxzbyBnaXZlcyBwcmVjZWRlbmNlIHRvIHRoZSBzcmMgYXR0IGluc3RlYWQgb2YgYW50LWl0ZW0tY29udGVudFxuZnVuY3Rpb24gbGVnYWN5Q29tcHV0ZUltYWdlVXJsKCRlbGVtZW50KSB7XG4gICAgdmFyIGNvbnRlbnQgPSAkZWxlbWVudC5hdHRyKCdzcmMnKSB8fCAkZWxlbWVudC5hdHRyKCdhbnQtaXRlbS1jb250ZW50Jyk7XG4gICAgaWYgKGNvbnRlbnQpIHtcbiAgICAgICAgaWYgKGNvbnRlbnQuaW5kZXhPZignLycpID09PSAwKSB7XG4gICAgICAgICAgICBjb250ZW50ID0gd2luZG93LmxvY2F0aW9uLm9yaWdpbiArIGNvbnRlbnQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvbnRlbnQuaW5kZXhPZignaHR0cCcpICE9PSAwKSB7XG4gICAgICAgICAgICBjb250ZW50ID0gd2luZG93LmxvY2F0aW9uLm9yaWdpbiArIHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZSArIGNvbnRlbnQ7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGNvbnRlbnQ7XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVNZWRpYVVybCgkZWxlbWVudCwgZ3JvdXBTZXR0aW5ncykge1xuICAgIGlmIChncm91cFNldHRpbmdzLmxlZ2FjeUJlaGF2aW9yKCkpIHtcbiAgICAgICAgcmV0dXJuIGxlZ2FjeUNvbXB1dGVNZWRpYVVybCgkZWxlbWVudCk7XG4gICAgfVxuICAgIHZhciBjb250ZW50ID0gJGVsZW1lbnQuYXR0cignYW50LWl0ZW0tY29udGVudCcpIHx8ICRlbGVtZW50LmF0dHIoJ3NyYycpIHx8ICRlbGVtZW50LmF0dHIoJ2RhdGEnKTtcbiAgICBpZiAoY29udGVudCAmJiBjb250ZW50LmluZGV4T2YoJy8vJykgIT09IDAgJiYgY29udGVudC5pbmRleE9mKCdodHRwJykgIT09IDApIHsgLy8gcHJvdG9jb2wtcmVsYXRpdmUgb3IgYWJzb2x1dGUgdXJsLCBlLmcuIC8vZG9tYWluLmNvbS9mb28vYmFyLnBuZyBvciBodHRwOi8vZG9tYWluLmNvbS9mb28vYmFyL3BuZ1xuICAgICAgICBpZiAoY29udGVudC5pbmRleE9mKCcvJykgPT09IDApIHsgLy8gZG9tYWluLXJlbGF0aXZlIHVybCwgZS5nLiAvZm9vL2Jhci5wbmcgPT4gZG9tYWluLmNvbS9mb28vYmFyLnBuZ1xuICAgICAgICAgICAgY29udGVudCA9IHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4gKyBjb250ZW50O1xuICAgICAgICB9IGVsc2UgeyAvLyBwYXRoLXJlbGF0aXZlIHVybCwgZS5nLiBiYXIucG5nID0+IGRvbWFpbi5jb20vYmF6L2Jhci5wbmdcbiAgICAgICAgICAgIHZhciBwYXRoID0gd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lO1xuICAgICAgICAgICAgdmFyIGluZGV4ID0gcGF0aC5sYXN0SW5kZXhPZignLycpICsgMTtcbiAgICAgICAgICAgIGlmIChwYXRoLmxlbmd0aCA+IGluZGV4KSB7XG4gICAgICAgICAgICAgICAgcGF0aCA9IHBhdGguc3Vic3RyaW5nKDAsIGluZGV4KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnRlbnQgPSB3aW5kb3cubG9jYXRpb24ub3JpZ2luICsgcGF0aCArIGNvbnRlbnQ7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGNvbnRlbnQ7XG59XG5cbi8vIExlZ2FjeSBpbXBsZW1lbnRhdGlvbiB3aGljaCBtYWludGFpbnMgdGhlIG9sZCBiZWhhdmlvciBvZiBlbmdhZ2VfZnVsbFxuLy8gVGhpcyBjb2RlIGlzIHdyb25nIGZvciBVUkxzIHRoYXQgc3RhcnQgd2l0aCBcIi8vXCIuIEl0IGFsc28gZ2l2ZXMgcHJlY2VkZW5jZSB0byB0aGUgc3JjIGF0dCBpbnN0ZWFkIG9mIGFudC1pdGVtLWNvbnRlbnRcbmZ1bmN0aW9uIGxlZ2FjeUNvbXB1dGVNZWRpYVVybCgkZWxlbWVudCkge1xuICAgIHZhciBjb250ZW50ID0gJGVsZW1lbnQuYXR0cignYW50LWl0ZW0tY29udGVudCcpIHx8ICRlbGVtZW50LmF0dHIoJ3NyYycpIHx8ICRlbGVtZW50LmF0dHIoJ2RhdGEnKSB8fCAnJztcbiAgICBpZiAoY29udGVudCkge1xuICAgICAgICBpZiAoY29udGVudC5pbmRleE9mKCcvJykgPT09IDApIHtcbiAgICAgICAgICAgIGNvbnRlbnQgPSB3aW5kb3cubG9jYXRpb24ub3JpZ2luICsgY29udGVudDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY29udGVudC5pbmRleE9mKCdodHRwJykgIT09IDApIHtcbiAgICAgICAgICAgIGNvbnRlbnQgPSB3aW5kb3cubG9jYXRpb24ub3JpZ2luICsgd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lICsgY29udGVudDtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gY29udGVudDtcbn1cblxuLy8gUmV0dXJucyBhIFVSTCBmb3IgY29udGVudCByZWMgd2hpY2ggd2lsbCB0YWtlIHRoZSB1c2VyIHRvIHRoZSB0YXJnZXQgdXJsIGFuZCByZWNvcmQgdGhlIGdpdmVuIGNsaWNrIGV2ZW50XG5mdW5jdGlvbiBjb21wdXRlQ29udGVudFJlY1VybCh0YXJnZXRVcmwsIGNsaWNrRXZlbnQpIHtcbiAgICByZXR1cm4gYXBwU2VydmVyVXJsKCkgKyAnL2NyLz90YXJnZXRVcmw9JyArIGVuY29kZVVSSUNvbXBvbmVudCh0YXJnZXRVcmwpICsgJyZldmVudD0nICsgZW5jb2RlVVJJQ29tcG9uZW50KEpTT05VdGlscy5zdHJpbmdpZnkoY2xpY2tFdmVudCkpXG59XG5cbmZ1bmN0aW9uIGFtYXpvblMzVXJsKCkge1xuICAgIHJldHVybiBVUkxDb25zdGFudHMuQU1BWk9OX1MzO1xufVxuXG4vLyBUT0RPOiByZWZhY3RvciB1c2FnZSBvZiBhcHAgc2VydmVyIHVybCArIHJlbGF0aXZlIHJvdXRlc1xuZnVuY3Rpb24gYXBwU2VydmVyVXJsKCkge1xuICAgIGlmIChBcHBNb2RlLnRlc3QpIHtcbiAgICAgICAgcmV0dXJuIFVSTENvbnN0YW50cy5URVNUO1xuICAgIH0gZWxzZSBpZiAoQXBwTW9kZS5vZmZsaW5lKSB7XG4gICAgICAgIHJldHVybiBVUkxDb25zdGFudHMuREVWRUxPUE1FTlQ7XG4gICAgfVxuICAgIHJldHVybiBVUkxDb25zdGFudHMuUFJPRFVDVElPTjtcbn1cblxuLy8gVE9ETzogcmVmYWN0b3IgdXNhZ2Ugb2YgZXZlbnRzIHNlcnZlciB1cmwgKyByZWxhdGl2ZSByb3V0ZXNcbmZ1bmN0aW9uIGV2ZW50c1NlcnZlclVybCgpIHtcbiAgICBpZiAoQXBwTW9kZS5vZmZsaW5lKSB7XG4gICAgICAgIHJldHVybiBVUkxDb25zdGFudHMuREVWRUxPUE1FTlRfRVZFTlRTO1xuICAgIH1cbiAgICByZXR1cm4gVVJMQ29uc3RhbnRzLlBST0RVQ1RJT05fRVZFTlRTO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgYXBwU2VydmVyVXJsOiBhcHBTZXJ2ZXJVcmwsXG4gICAgZXZlbnRzU2VydmVyVXJsOiBldmVudHNTZXJ2ZXJVcmwsXG4gICAgYW1hem9uUzNVcmw6IGFtYXpvblMzVXJsLFxuICAgIGdyb3VwU2V0dGluZ3NVcmw6IGdldEdyb3VwU2V0dGluZ3NVcmwsXG4gICAgcGFnZURhdGFVcmw6IGdldFBhZ2VEYXRhVXJsLFxuICAgIGNyZWF0ZVJlYWN0aW9uVXJsOiBnZXRDcmVhdGVSZWFjdGlvblVybCxcbiAgICBmZXRjaENvbnRlbnRCb2RpZXNVcmw6IGdldEZldGNoQ29udGVudEJvZGllc1VybCxcbiAgICBmZXRjaENvbnRlbnRSZWNvbW1lbmRhdGlvblVybDogZ2V0RmV0Y2hDb250ZW50UmVjb21tZW5kYXRpb25VcmwsXG4gICAgc2hhcmVSZWFjdGlvblVybDogZ2V0U2hhcmVSZWFjdGlvblVybCxcbiAgICBjcmVhdGVUZW1wVXNlclVybDogZ2V0Q3JlYXRlVGVtcFVzZXJVcmwsXG4gICAgc2hhcmVXaW5kb3dVcmw6IGdldFNoYXJlV2luZG93VXJsLFxuICAgIGFudGVubmFMb2dpblVybDogYW50ZW5uYUxvZ2luVXJsLFxuICAgIGNvbXB1dGVJbWFnZVVybDogY29tcHV0ZUltYWdlVXJsLFxuICAgIGNvbXB1dGVNZWRpYVVybDogY29tcHV0ZU1lZGlhVXJsLFxuICAgIGNvbXB1dGVDb250ZW50UmVjVXJsOiBjb21wdXRlQ29udGVudFJlY1VybCxcbiAgICBldmVudFVybDogZ2V0RXZlbnRVcmxcbn07XG4iLCJ2YXIgSlNPTlBDbGllbnQgPSByZXF1aXJlKCcuL2pzb25wLWNsaWVudCcpO1xudmFyIFVSTHMgPSByZXF1aXJlKCcuL3VybHMnKTtcbnZhciBYRE1DbGllbnQgPSByZXF1aXJlKCcuL3hkbS1jbGllbnQnKTtcblxudmFyIGNhY2hlZFVzZXJJbmZvO1xuXG4vLyBGZXRjaCB0aGUgbG9nZ2VkIGluIHVzZXIuIFdpbGwgdHJpZ2dlciBhIG5ldHdvcmsgcmVxdWVzdCB0byBjcmVhdGUgYSB0ZW1wb3JhcnkgdXNlciBpZiBuZWVkZWQuXG5mdW5jdGlvbiBmZXRjaFVzZXIoZ3JvdXBTZXR0aW5ncywgY2FsbGJhY2spIHtcbiAgICBnZXRVc2VyQ29va2llcyhmdW5jdGlvbihjb29raWVzKSB7XG4gICAgICAgIGlmICghY29va2llcy5hbnRfdG9rZW4pIHtcbiAgICAgICAgICAgIGNyZWF0ZVRlbXBVc2VyKGdyb3VwU2V0dGluZ3MsIGNhbGxiYWNrKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHVwZGF0ZVVzZXJGcm9tQ29va2llcyhjb29raWVzKTtcbiAgICAgICAgICAgIGNhbGxiYWNrKGNhY2hlZFVzZXJJbmZvKTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG5mdW5jdGlvbiByZWZyZXNoVXNlckZyb21Db29raWVzKGNhbGxiYWNrKSB7XG4gICAgZ2V0VXNlckNvb2tpZXMoZnVuY3Rpb24oY29va2llcykge1xuICAgICAgICB1cGRhdGVVc2VyRnJvbUNvb2tpZXMoY29va2llcyk7XG4gICAgICAgIGNhbGxiYWNrKGNhY2hlZFVzZXJJbmZvKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gZ2V0VXNlckNvb2tpZXMoY2FsbGJhY2spIHtcbiAgICBYRE1DbGllbnQuc2VuZE1lc3NhZ2UoJ2dldENvb2tpZXMnLCBbICd1c2VyX2lkJywgJ3VzZXJfdHlwZScsICdhbnRfdG9rZW4nLCAndGVtcF91c2VyJyBdLCBmdW5jdGlvbihjb29raWVzKSB7XG4gICAgICAgIGNhbGxiYWNrKGNvb2tpZXMpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBzdG9yZVVzZXJDb29raWVzKHVzZXJJbmZvKSB7XG4gICAgdmFyIGNvb2tpZXMgPSB7XG4gICAgICAgICd1c2VyX2lkJzogdXNlckluZm8udXNlcl9pZCxcbiAgICAgICAgJ3VzZXJfdHlwZSc6IHVzZXJJbmZvLnVzZXJfdHlwZSxcbiAgICAgICAgJ2FudF90b2tlbic6IHVzZXJJbmZvLmFudF90b2tlbixcbiAgICAgICAgJ3RlbXBfdXNlcic6IHVzZXJJbmZvLnRlbXBfdXNlclxuICAgIH07XG4gICAgWERNQ2xpZW50LnNlbmRNZXNzYWdlKCdzZXRDb29raWVzJywgY29va2llcyk7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVRlbXBVc2VyKGdyb3VwU2V0dGluZ3MsIGNhbGxiYWNrKSB7XG4gICAgdmFyIHNlbmREYXRhID0ge1xuICAgICAgICBncm91cF9pZCA6IGdyb3VwU2V0dGluZ3MuZ3JvdXBJZCgpXG4gICAgfTtcbiAgICAvLyBUaGlzIG1vZHVsZSB1c2VzIHRoZSBsb3ctbGV2ZWwgSlNPTlBDbGllbnQgaW5zdGVhZCBvZiBBamF4Q2xpZW50IGluIG9yZGVyIHRvIGF2b2lkIGEgY2lyY3VsYXIgZGVwZW5kZW5jeS5cbiAgICBKU09OUENsaWVudC5kb0dldEpTT05QKFVSTHMuYXBwU2VydmVyVXJsKCksIFVSTHMuY3JlYXRlVGVtcFVzZXJVcmwoKSwgc2VuZERhdGEsIGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICBpZiAoIWNhY2hlZFVzZXJJbmZvIHx8ICFjYWNoZWRVc2VySW5mby51c2VyX2lkIHx8ICFjYWNoZWRVc2VySW5mby5hbnRfdG9rZW4gfHwgIWNhY2hlZFVzZXJJbmZvLnRlbXBfdXNlcikge1xuICAgICAgICAgICAgLy8gSXQncyBwb3NzaWJsZSB0aGF0IG11bHRpcGxlIG9mIHRoZXNlIGFqYXggcmVxdWVzdHMgZ290IGZpcmVkIGluIHBhcmFsbGVsLiBXaGljaGV2ZXIgb25lXG4gICAgICAgICAgICAvLyBjb21lcyBiYWNrIGZpcnN0IHdpbnMuXG4gICAgICAgICAgICB1cGRhdGVVc2VyRnJvbVJlc3BvbnNlKHJlc3BvbnNlKTtcbiAgICAgICAgfVxuICAgICAgICBjYWxsYmFjayhjYWNoZWRVc2VySW5mbyk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZVVzZXJGcm9tQ29va2llcyhjb29raWVzKSB7XG4gICAgdmFyIHVzZXJJbmZvID0ge307XG4gICAgdXNlckluZm8udXNlcl9pZCA9IGNvb2tpZXMudXNlcl9pZDtcbiAgICB1c2VySW5mby51c2VyX3R5cGUgPSBjb29raWVzLnVzZXJfdHlwZTtcbiAgICB1c2VySW5mby5hbnRfdG9rZW4gPSBjb29raWVzLmFudF90b2tlbjtcbiAgICB1c2VySW5mby50ZW1wX3VzZXIgPSBjb29raWVzLnRlbXBfdXNlcjtcblxuICAgIGNhY2hlZFVzZXJJbmZvID0gdXNlckluZm87XG4gICAgcmV0dXJuIGNhY2hlZFVzZXJJbmZvO1xuXG59XG5cbmZ1bmN0aW9uIHVwZGF0ZVVzZXJGcm9tUmVzcG9uc2UocmVzcG9uc2UpIHtcbiAgICByZXNwb25zZSA9IHJlc3BvbnNlIHx8IHt9O1xuXG4gICAgdmFyIHVzZXJJbmZvID0ge307XG4gICAgdXNlckluZm8uYW50X3Rva2VuID0gcmVzcG9uc2UuYW50X3Rva2VuO1xuICAgIHVzZXJJbmZvLnVzZXJfaWQgPSByZXNwb25zZS51c2VyX2lkO1xuICAgIHVzZXJJbmZvLmZ1bGxfbmFtZSA9IHJlc3BvbnNlLmZ1bGxfbmFtZTtcbiAgICB1c2VySW5mby5maXJzdF9uYW1lID0gcmVzcG9uc2UuZnVsbF9uYW1lO1xuICAgIHVzZXJJbmZvLmltZ191cmwgPSByZXNwb25zZS5pbWdfdXJsO1xuICAgIHVzZXJJbmZvLnVzZXJfdHlwZSA9IHJlc3BvbnNlLnVzZXJfdHlwZTtcbiAgICB1c2VySW5mby50ZW1wX3VzZXIgPSAhdXNlckluZm8uZmlyc3RfbmFtZSAmJiAhdXNlckluZm8uZnVsbF9uYW1lO1xuXG4gICAgY2FjaGVkVXNlckluZm8gPSB1c2VySW5mbztcbiAgICBzdG9yZVVzZXJDb29raWVzKHVzZXJJbmZvKTsgLy8gVXBkYXRlIGNvb2tpZXMgd2hlbmV2ZXIgd2UgZ2V0IGEgdXNlciBmcm9tIHRoZSBzZXJ2ZXIuXG59XG5cbi8vIFJldHVybnMgdGhlIGxvZ2dlZC1pbiB1c2VyLCBpZiB3ZSBhbHJlYWR5IGhhdmUgb25lLiBXaWxsIG5vdCB0cmlnZ2VyIGEgbmV0d29yayByZXF1ZXN0LlxuZnVuY3Rpb24gY2FjaGVkVXNlcigpIHtcbiAgICByZXR1cm4gY2FjaGVkVXNlckluZm87XG59XG5cbi8vIEF0dGVtcHRzIHRvIGNyZWF0ZSBhIG5ldyBhdXRob3JpemF0aW9uIHRva2VuIGZvciB0aGUgbG9nZ2VkLWluIHVzZXIuXG5mdW5jdGlvbiByZUF1dGhvcml6ZVVzZXIoZ3JvdXBTZXR0aW5ncywgY2FsbGJhY2spIHtcbiAgICB2YXIgb2xkVG9rZW4gPSBjYWNoZWRVc2VySW5mbyA/IGNhY2hlZFVzZXJJbmZvLmFudF90b2tlbiA6IHVuZGVmaW5lZDtcbiAgICBnZXRVc2VyQ29va2llcyhmdW5jdGlvbihjb29raWVzKSB7XG4gICAgICAgIHVwZGF0ZVVzZXJGcm9tQ29va2llcyhjb29raWVzKTtcbiAgICAgICAgdmFyIHVzZXJUeXBlID0gY29va2llcy51c2VyX3R5cGU7XG4gICAgICAgIGlmICh1c2VyVHlwZSA9PT0gJ2ZhY2Vib29rJykge1xuICAgICAgICAgICAgWERNQ2xpZW50LnNlbmRNZXNzYWdlKCdmYWNlYm9va0dldExvZ2luU3RhdHVzJywgdHJ1ZSwgZnVuY3Rpb24ocmVzcG9uc2UpIHsgLy8gRm9yY2UgYSByb3VuZCB0cmlwIHRvIHJlYXV0aG9yaXplLlxuICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZS5zdGF0dXMgPT09ICdjb25uZWN0ZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgIGdldEFudFRva2VuRm9yRmFjZWJvb2tMb2dpbihyZXNwb25zZS5hdXRoUmVzcG9uc2UsIGdyb3VwU2V0dGluZ3MsIG5vdGlmeUhhc05ld1Rva2VuKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHJlc3BvbnNlLnN0YXR1cyA9PT0gJ25vdF9hdXRob3JpemVkJykge1xuICAgICAgICAgICAgICAgICAgICAvLyBUaGUgdXNlciBkaWRuJ3QgYXV0aG9yaXplIHVzIGZvciBGQiBsb2dpbi4gUmV2ZXJ0IHRoZW0gdG8gYSB0ZW1wIHVzZXIgaW5zdGVhZC5cbiAgICAgICAgICAgICAgICAgICAgZGVBdXRob3JpemVVc2VyKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3JlYXRlVGVtcFVzZXIoZ3JvdXBTZXR0aW5ncywgbm90aWZ5SGFzTmV3VG9rZW4pO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiBNYWtlIHN1cmUgdGhlIEZCIGxvZ2luIHdpbmRvdyBvcGVucyBwcm9wZXJseSB3aGVuIHRyaWdnZXJlZCBmcm9tIHRoZSBiYWNrZ3JvdW5kIGxpa2UgdGhpcy5cbiAgICAgICAgICAgICAgICAgICAgZmFjZWJvb2tMb2dpbihncm91cFNldHRpbmdzLCBub3RpZnlIYXNOZXdUb2tlbik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBGb3IgQW50ZW5uYSB1c2VycywganVzdCByZS1yZWFkIHRoZSBjb29raWVzIGFuZCBzZWUgaWYgdGhleSd2ZSBjaGFuZ2VkLlxuICAgICAgICAgICAgbm90aWZ5SGFzTmV3VG9rZW4oKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgZnVuY3Rpb24gbm90aWZ5SGFzTmV3VG9rZW4oKSB7XG4gICAgICAgIHZhciBoYXNOZXdUb2tlbiA9IGNhY2hlZFVzZXJJbmZvICYmIGNhY2hlZFVzZXJJbmZvLmFudF90b2tlbiAmJiBjYWNoZWRVc2VySW5mby5hbnRfdG9rZW4gIT09IG9sZFRva2VuO1xuICAgICAgICBpZiAoY2FsbGJhY2spIHsgY2FsbGJhY2soaGFzTmV3VG9rZW4pIH07XG4gICAgfVxufVxuXG5mdW5jdGlvbiBmYWNlYm9va0xvZ2luKGdyb3VwU2V0dGluZ3MsIGNhbGxiYWNrKSB7XG4gICAgWERNQ2xpZW50LnNlbmRNZXNzYWdlKCdmYWNlYm9va0xvZ2luJywgeyBzY29wZTogJ2VtYWlsJyB9LCBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICB2YXIgYXV0aFJlc3BvbnNlID0gcmVzcG9uc2UuYXV0aFJlc3BvbnNlO1xuICAgICAgICBpZiAoYXV0aFJlc3BvbnNlKSB7XG4gICAgICAgICAgICBnZXRBbnRUb2tlbkZvckZhY2Vib29rTG9naW4oYXV0aFJlc3BvbnNlLCBncm91cFNldHRpbmdzLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhjYWNoZWRVc2VySW5mbyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKGNhY2hlZFVzZXJJbmZvKTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBnZXRBbnRUb2tlbkZvckZhY2Vib29rTG9naW4oZmFjZWJvb2tBdXRoUmVzcG9uc2UsIGdyb3VwU2V0dGluZ3MsIGNhbGxiYWNrKSB7XG4gICAgdmFyIHNlbmREYXRhID0ge1xuICAgICAgICBmYjogZmFjZWJvb2tBdXRoUmVzcG9uc2UsXG4gICAgICAgIGdyb3VwX2lkOiBncm91cFNldHRpbmdzLmdyb3VwSWQoKSxcbiAgICAgICAgdXNlcl9pZDogY2FjaGVkVXNlckluZm8udXNlcl9pZCwgLy8gbWlnaHQgYmUgdGVtcCwgbWlnaHQgYmUgdGhlIElEIG9mIGEgdmFsaWQgRkItY3JlYXRlZCB1c2VyXG4gICAgICAgIGFudF90b2tlbjogY2FjaGVkVXNlckluZm8uYW50X3Rva2VuXG4gICAgfTtcbiAgICBKU09OUENsaWVudC5kb0dldEpTT05QKFVSTHMuYXBwU2VydmVyVXJsKCksICcvYXBpL2ZiJywgc2VuZERhdGEsIGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICB1cGRhdGVVc2VyRnJvbVJlc3BvbnNlKHJlc3BvbnNlKTtcbiAgICAgICAgY2FsbGJhY2soY2FjaGVkVXNlckluZm8pO1xuICAgIH0sIGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICBjcmVhdGVUZW1wVXNlcihncm91cFNldHRpbmdzLCBjYWxsYmFjayk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGRlQXV0aG9yaXplVXNlcihjYWxsYmFjaykge1xuICAgIGlmIChjYWNoZWRVc2VySW5mbyAmJiAhY2FjaGVkVXNlckluZm8udGVtcF91c2VyKSB7XG4gICAgICAgIHZhciBzZW5kRGF0YSA9IHtcbiAgICAgICAgICAgIHVzZXJfaWQgOiBjYWNoZWRVc2VySW5mby51c2VyX2lkLFxuICAgICAgICAgICAgYW50X3Rva2VuIDogY2FjaGVkVXNlckluZm8uYW50X3Rva2VuXG4gICAgICAgIH07XG4gICAgICAgIEpTT05QQ2xpZW50LmRvR2V0SlNPTlAoVVJMcy5hcHBTZXJ2ZXJVcmwoKSwgJy9hcGkvZGVhdXRob3JpemUnLCBzZW5kRGF0YSwgZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIGRpc2NhcmRVc2VySW5mbyhjYWxsYmFjayk7XG4gICAgICAgIH0pXG4gICAgfSBlbHNlIHtcbiAgICAgICAgZGlzY2FyZFVzZXJJbmZvKGNhbGxiYWNrKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRpc2NhcmRVc2VySW5mbyhjYWxsYmFjaykge1xuICAgIFhETUNsaWVudC5zZW5kTWVzc2FnZSgncmVtb3ZlQ29va2llcycsIFsndXNlcl9pZCcsICd1c2VyX3R5cGUnLCAnYW50X3Rva2VuJywgJ3RlbXBfdXNlciddLCB7fSwgZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgIGNhY2hlZFVzZXJJbmZvID0ge307XG4gICAgICAgIGNhbGxiYWNrKCk7XG4gICAgfSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGZldGNoVXNlcjogZmV0Y2hVc2VyLFxuICAgIHJlZnJlc2hVc2VyRnJvbUNvb2tpZXM6IHJlZnJlc2hVc2VyRnJvbUNvb2tpZXMsXG4gICAgY2FjaGVkVXNlcjogY2FjaGVkVXNlcixcbiAgICByZUF1dGhvcml6ZVVzZXI6IHJlQXV0aG9yaXplVXNlcixcbiAgICBmYWNlYm9va0xvZ2luOiBmYWNlYm9va0xvZ2luXG59OyIsIi8qKlxuICogQXV0aG9yOiBKYXNvbiBGYXJyZWxsXG4gKiBBdXRob3IgVVJJOiBodHRwOi8vdXNlYWxsZml2ZS5jb20vXG4gKlxuICogRGVzY3JpcHRpb246IENoZWNrcyBpZiBhIERPTSBlbGVtZW50IGlzIHRydWx5IHZpc2libGUuXG4gKiBQYWNrYWdlIFVSTDogaHR0cHM6Ly9naXRodWIuY29tL1VzZUFsbEZpdmUvdHJ1ZS12aXNpYmlsaXR5XG4gKi9cbmZ1bmN0aW9uIGlzVmlzaWJsZShlbGVtZW50KSB7XG5cbiAgICAvKipcbiAgICAgKiBDaGVja3MgaWYgYSBET00gZWxlbWVudCBpcyB2aXNpYmxlLiBUYWtlcyBpbnRvXG4gICAgICogY29uc2lkZXJhdGlvbiBpdHMgcGFyZW50cyBhbmQgb3ZlcmZsb3cuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gKGVsKSAgICAgIHRoZSBET00gZWxlbWVudCB0byBjaGVjayBpZiBpcyB2aXNpYmxlXG4gICAgICpcbiAgICAgKiBUaGVzZSBwYXJhbXMgYXJlIG9wdGlvbmFsIHRoYXQgYXJlIHNlbnQgaW4gcmVjdXJzaXZlbHksXG4gICAgICogeW91IHR5cGljYWxseSB3b24ndCB1c2UgdGhlc2U6XG4gICAgICpcbiAgICAgKiBAcGFyYW0gKHQpICAgICAgIFRvcCBjb3JuZXIgcG9zaXRpb24gbnVtYmVyXG4gICAgICogQHBhcmFtIChyKSAgICAgICBSaWdodCBjb3JuZXIgcG9zaXRpb24gbnVtYmVyXG4gICAgICogQHBhcmFtIChiKSAgICAgICBCb3R0b20gY29ybmVyIHBvc2l0aW9uIG51bWJlclxuICAgICAqIEBwYXJhbSAobCkgICAgICAgTGVmdCBjb3JuZXIgcG9zaXRpb24gbnVtYmVyXG4gICAgICogQHBhcmFtICh3KSAgICAgICBFbGVtZW50IHdpZHRoIG51bWJlclxuICAgICAqIEBwYXJhbSAoaCkgICAgICAgRWxlbWVudCBoZWlnaHQgbnVtYmVyXG4gICAgICovXG4gICAgZnVuY3Rpb24gX2lzVmlzaWJsZShlbCwgdCwgciwgYiwgbCwgdywgaCkge1xuICAgICAgICB2YXIgcCA9IGVsLnBhcmVudE5vZGUsXG4gICAgICAgICAgICAgICAgVklTSUJMRV9QQURESU5HID0gMjtcblxuICAgICAgICBpZiAoICFfZWxlbWVudEluRG9jdW1lbnQoZWwpICkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8tLSBSZXR1cm4gdHJ1ZSBmb3IgZG9jdW1lbnQgbm9kZVxuICAgICAgICBpZiAoIDkgPT09IHAubm9kZVR5cGUgKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vLS0gUmV0dXJuIGZhbHNlIGlmIG91ciBlbGVtZW50IGlzIGludmlzaWJsZVxuICAgICAgICBpZiAoXG4gICAgICAgICAgICAgJzAnID09PSBfZ2V0U3R5bGUoZWwsICdvcGFjaXR5JykgfHxcbiAgICAgICAgICAgICAnbm9uZScgPT09IF9nZXRTdHlsZShlbCwgJ2Rpc3BsYXknKSB8fFxuICAgICAgICAgICAgICdoaWRkZW4nID09PSBfZ2V0U3R5bGUoZWwsICd2aXNpYmlsaXR5JylcbiAgICAgICAgKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoXG4gICAgICAgICAgICAndW5kZWZpbmVkJyA9PT0gdHlwZW9mKHQpIHx8XG4gICAgICAgICAgICAndW5kZWZpbmVkJyA9PT0gdHlwZW9mKHIpIHx8XG4gICAgICAgICAgICAndW5kZWZpbmVkJyA9PT0gdHlwZW9mKGIpIHx8XG4gICAgICAgICAgICAndW5kZWZpbmVkJyA9PT0gdHlwZW9mKGwpIHx8XG4gICAgICAgICAgICAndW5kZWZpbmVkJyA9PT0gdHlwZW9mKHcpIHx8XG4gICAgICAgICAgICAndW5kZWZpbmVkJyA9PT0gdHlwZW9mKGgpXG4gICAgICAgICkge1xuICAgICAgICAgICAgdCA9IGVsLm9mZnNldFRvcDtcbiAgICAgICAgICAgIGwgPSBlbC5vZmZzZXRMZWZ0O1xuICAgICAgICAgICAgYiA9IHQgKyBlbC5vZmZzZXRIZWlnaHQ7XG4gICAgICAgICAgICByID0gbCArIGVsLm9mZnNldFdpZHRoO1xuICAgICAgICAgICAgdyA9IGVsLm9mZnNldFdpZHRoO1xuICAgICAgICAgICAgaCA9IGVsLm9mZnNldEhlaWdodDtcbiAgICAgICAgfVxuICAgICAgICAvLy0tIElmIHdlIGhhdmUgYSBwYXJlbnQsIGxldCdzIGNvbnRpbnVlOlxuICAgICAgICBpZiAoIHAgKSB7XG4gICAgICAgICAgICAvLy0tIENoZWNrIGlmIHRoZSBwYXJlbnQgY2FuIGhpZGUgaXRzIGNoaWxkcmVuLlxuICAgICAgICAgICAgaWYgKCBfb3ZlcmZsb3dIaWRkZW4ocCkgKSB7XG4gICAgICAgICAgICAgICAgLy8tLSBPbmx5IGNoZWNrIGlmIHRoZSBvZmZzZXQgaXMgZGlmZmVyZW50IGZvciB0aGUgcGFyZW50XG4gICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAvLy0tIElmIHRoZSB0YXJnZXQgZWxlbWVudCBpcyB0byB0aGUgcmlnaHQgb2YgdGhlIHBhcmVudCBlbG1cbiAgICAgICAgICAgICAgICAgICAgbCArIFZJU0lCTEVfUEFERElORyA+IHAub2Zmc2V0V2lkdGggKyBwLnNjcm9sbExlZnQgfHxcbiAgICAgICAgICAgICAgICAgICAgLy8tLSBJZiB0aGUgdGFyZ2V0IGVsZW1lbnQgaXMgdG8gdGhlIGxlZnQgb2YgdGhlIHBhcmVudCBlbG1cbiAgICAgICAgICAgICAgICAgICAgbCArIHcgLSBWSVNJQkxFX1BBRERJTkcgPCBwLnNjcm9sbExlZnQgfHxcbiAgICAgICAgICAgICAgICAgICAgLy8tLSBJZiB0aGUgdGFyZ2V0IGVsZW1lbnQgaXMgdW5kZXIgdGhlIHBhcmVudCBlbG1cbiAgICAgICAgICAgICAgICAgICAgdCArIFZJU0lCTEVfUEFERElORyA+IHAub2Zmc2V0SGVpZ2h0ICsgcC5zY3JvbGxUb3AgfHxcbiAgICAgICAgICAgICAgICAgICAgLy8tLSBJZiB0aGUgdGFyZ2V0IGVsZW1lbnQgaXMgYWJvdmUgdGhlIHBhcmVudCBlbG1cbiAgICAgICAgICAgICAgICAgICAgdCArIGggLSBWSVNJQkxFX1BBRERJTkcgPCBwLnNjcm9sbFRvcFxuICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAvLy0tIE91ciB0YXJnZXQgZWxlbWVudCBpcyBvdXQgb2YgYm91bmRzOlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIEFOVEVOTkEgbW9kaWZpY2F0aW9uOiB1c2UgdGhlIGJvdW5kaW5nIGNsaWVudCByZWN0LCB3aGljaCBhY2NvdW50cyBmb3IgdGhpbmdzIGxpa2UgQ1NTIHRyYW5zZm9ybXNcbiAgICAgICAgICAgICAgICB2YXIgZWxyID0gZWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgICAgICAgICAgdmFyIHByID0gcC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgICAgICAgICBpZiAoZWxyLmxlZnQgPj0gcHIucmlnaHQgfHxcbiAgICAgICAgICAgICAgICAgICAgZWxyLnJpZ2h0IDw9IHByLmxlZnQgfHxcbiAgICAgICAgICAgICAgICAgICAgZWxyLnRvcCA+PSBwci5ib3R0b20gfHxcbiAgICAgICAgICAgICAgICAgICAgZWxyLmJvdHRvbSA8PSBwci50b3ApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vLS0gQWRkIHRoZSBvZmZzZXQgcGFyZW50J3MgbGVmdC90b3AgY29vcmRzIHRvIG91ciBlbGVtZW50J3Mgb2Zmc2V0OlxuICAgICAgICAgICAgaWYgKCBlbC5vZmZzZXRQYXJlbnQgPT09IHAgKSB7XG4gICAgICAgICAgICAgICAgbCArPSBwLm9mZnNldExlZnQ7XG4gICAgICAgICAgICAgICAgdCArPSBwLm9mZnNldFRvcDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vLS0gTGV0J3MgcmVjdXJzaXZlbHkgY2hlY2sgdXB3YXJkczpcbiAgICAgICAgICAgIHJldHVybiBfaXNWaXNpYmxlKHAsIHQsIHIsIGIsIGwsIHcsIGgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIC8vLS0gQ3Jvc3MgYnJvd3NlciBtZXRob2QgdG8gZ2V0IHN0eWxlIHByb3BlcnRpZXM6XG4gICAgZnVuY3Rpb24gX2dldFN0eWxlKGVsLCBwcm9wZXJ0eSkge1xuICAgICAgICBpZiAoIHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlICkge1xuICAgICAgICAgICAgcmV0dXJuIGRvY3VtZW50LmRlZmF1bHRWaWV3LmdldENvbXB1dGVkU3R5bGUoZWwsbnVsbClbcHJvcGVydHldO1xuICAgICAgICB9XG4gICAgICAgIGlmICggZWwuY3VycmVudFN0eWxlICkge1xuICAgICAgICAgICAgcmV0dXJuIGVsLmN1cnJlbnRTdHlsZVtwcm9wZXJ0eV07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBfZWxlbWVudEluRG9jdW1lbnQoZWxlbWVudCkge1xuICAgICAgICB3aGlsZSAoZWxlbWVudCA9IGVsZW1lbnQucGFyZW50Tm9kZSkge1xuICAgICAgICAgICAgaWYgKGVsZW1lbnQgPT0gZG9jdW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIF9vdmVyZmxvd0hpZGRlbihlbCkge1xuICAgICAgICByZXR1cm4gJ2hpZGRlbicgPT09IF9nZXRTdHlsZShlbCwgJ292ZXJmbG93JykgfHwgJ2hpZGRlbicgPT09IF9nZXRTdHlsZShlbCwgJ292ZXJmbG93LXgnKSB8fCAnaGlkZGVuJyA9PT0gX2dldFN0eWxlKGVsLCAnb3ZlcmZsb3cteScpIHx8XG4gICAgICAgICAgICAgICAgJ3Njcm9sbCcgPT09IF9nZXRTdHlsZShlbCwgJ292ZXJmbG93JykgfHwgJ3Njcm9sbCcgPT09IF9nZXRTdHlsZShlbCwgJ292ZXJmbG93LXgnKSB8fCAnc2Nyb2xsJyA9PT0gX2dldFN0eWxlKGVsLCAnb3ZlcmZsb3cteScpXG4gICAgfVxuXG4gICAgcmV0dXJuIF9pc1Zpc2libGUoZWxlbWVudCk7XG5cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgaXNWaXNpYmxlOiBpc1Zpc2libGVcbn07IiwidmFyIGlkID0gJ2FudGVubmEtd2lkZ2V0LWJ1Y2tldCc7XG5cbmZ1bmN0aW9uIGdldFdpZGdldEJ1Y2tldCgpIHtcbiAgICB2YXIgYnVja2V0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpO1xuICAgIGlmICghYnVja2V0KSB7XG4gICAgICAgIGJ1Y2tldCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBidWNrZXQuc2V0QXR0cmlidXRlKCdpZCcsIGlkKTtcbiAgICAgICAgYnVja2V0LmNsYXNzTGlzdC5hZGQoJ2FudGVubmEtcmVzZXQnLCduby1hbnQnKTtcbiAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChidWNrZXQpO1xuICAgIH1cbiAgICByZXR1cm4gYnVja2V0O1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgZ2V0OiBnZXRXaWRnZXRCdWNrZXQsXG4gICAgc2VsZWN0b3I6IGZ1bmN0aW9uKCkgeyByZXR1cm4gJyMnICsgaWQ7IH1cbn07IiwidmFyIFhkbUxvYWRlciA9IHJlcXVpcmUoJy4veGRtLWxvYWRlcicpO1xuXG4vLyBSZWdpc3RlciBvdXJzZWx2ZXMgdG8gaGVhciBtZXNzYWdlc1xud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIHJlY2VpdmVNZXNzYWdlLCBmYWxzZSk7XG5cbnZhciByZXNwb25zZUhhbmRsZXJzID0geyAneGRtX2xvYWRlZCc6IHhkbUxvYWRlZCB9O1xudmFyIHF1ZXVlZE1lc3NhZ2VzID0gW107XG5cbnZhciBpc1hETUxvYWRlZCA9IGZhbHNlO1xuLy8gVGhlIGluaXRpYWwgbWVzc2FnZSB0aGF0IFhETSBzZW5kcyBvdXQgd2hlbiBpdCBsb2Fkc1xuZnVuY3Rpb24geGRtTG9hZGVkKGRhdGEpIHtcbiAgICBpc1hETUxvYWRlZCA9IHRydWU7XG4gICAgLy8gRmlyZSBhbnkgbWVzc2FnZXMgdGhhdCBoYXZlIGJlZW4gd2FpdGluZyBmb3IgWERNIHRvIGJlIHJlYWR5XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBxdWV1ZWRNZXNzYWdlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgbWVzc2FnZURhdGEgPSBxdWV1ZWRNZXNzYWdlc1tpXTtcbiAgICAgICAgc2VuZE1lc3NhZ2UobWVzc2FnZURhdGEubWVzc2FnZUtleSwgbWVzc2FnZURhdGEubWVzc2FnZVBhcmFtcywgbWVzc2FnZURhdGEuY2FsbGJhY2spO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gc2VuZE1lc3NhZ2UobWVzc2FnZUtleSwgbWVzc2FnZVBhcmFtcywgY2FsbGJhY2spIHtcbiAgICBpZiAoaXNYRE1Mb2FkZWQpIHtcbiAgICAgICAgdmFyIGNhbGxiYWNrS2V5ID0gJ2FudGVubmEnICsgTWF0aC5yYW5kb20oKS50b1N0cmluZygxNikuc2xpY2UoMik7XG4gICAgICAgIGlmIChjYWxsYmFjaykgeyByZXNwb25zZUhhbmRsZXJzW2NhbGxiYWNrS2V5XSA9IGNhbGxiYWNrOyB9XG4gICAgICAgIHBvc3RNZXNzYWdlKHtcbiAgICAgICAgICAgIG1lc3NhZ2VLZXk6IG1lc3NhZ2VLZXksXG4gICAgICAgICAgICBtZXNzYWdlUGFyYW1zOiBtZXNzYWdlUGFyYW1zLFxuICAgICAgICAgICAgY2FsbGJhY2tLZXk6IGNhbGxiYWNrS2V5XG4gICAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHF1ZXVlZE1lc3NhZ2VzLnB1c2goeyBtZXNzYWdlS2V5OiBtZXNzYWdlS2V5LCBtZXNzYWdlUGFyYW1zOiBtZXNzYWdlUGFyYW1zLCBjYWxsYmFjazogY2FsbGJhY2sgfSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiByZWNlaXZlTWVzc2FnZShldmVudCkge1xuICAgIHZhciBldmVudE9yaWdpbiA9IGV2ZW50Lm9yaWdpbjtcbiAgICBpZiAoZXZlbnRPcmlnaW4gPT09IFhkbUxvYWRlci5PUklHSU4pIHtcbiAgICAgICAgdmFyIGRhdGEgPSBldmVudC5kYXRhO1xuICAgICAgICAvLyBUT0RPOiBUaGUgZXZlbnQuc291cmNlIHByb3BlcnR5IGdpdmVzIHVzIHRoZSBzb3VyY2Ugd2luZG93IG9mIHRoZSBtZXNzYWdlIGFuZCBjdXJyZW50bHkgdGhlIFhETSBmcmFtZSBmaXJlcyBvdXRcbiAgICAgICAgLy8gZXZlbnRzIHRoYXQgd2UgcmVjZWl2ZSBiZWZvcmUgd2UgZXZlciB0cnkgdG8gcG9zdCBhbnl0aGluZy4gU28gd2UgKmNvdWxkKiBob2xkIG9udG8gdGhlIHdpbmRvdyBoZXJlIGFuZCB1c2UgaXRcbiAgICAgICAgLy8gZm9yIHBvc3RpbmcgbWVzc2FnZXMgcmF0aGVyIHRoYW4gbG9va2luZyBmb3IgdGhlIFhETSBmcmFtZSBvdXJzZWx2ZXMuIE5lZWQgdG8gbG9vayBhdCB3aGljaCBldmVudHMgdGhlIFhETSBmcmFtZVxuICAgICAgICAvLyBmaXJlcyBvdXQgdG8gYWxsIHdpbmRvd3MgYmVmb3JlIGJlaW5nIGFza2VkLiBDdXJyZW50bHksIGl0J3MgbW9yZSB0aGFuIFwieGRtIGxvYWRlZFwiLiBXaHk/XG4gICAgICAgIC8vdmFyIHNvdXJjZVdpbmRvdyA9IGV2ZW50LnNvdXJjZTtcblxuICAgICAgICB2YXIgY2FsbGJhY2tLZXkgPSBkYXRhLm1lc3NhZ2VLZXk7XG4gICAgICAgIHZhciBjYWxsYmFjayA9IHJlc3BvbnNlSGFuZGxlcnNbY2FsbGJhY2tLZXldO1xuICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKGRhdGEubWVzc2FnZVBhcmFtcyk7XG4gICAgICAgICAgICBkZWxldGUgcmVzcG9uc2VIYW5kbGVyc1tjYWxsYmFja0tleV07XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIHBvc3RNZXNzYWdlKG1lc3NhZ2UpIHtcbiAgICB2YXIgeGRtRnJhbWUgPSBnZXRYRE1GcmFtZSgpO1xuICAgIGlmICh4ZG1GcmFtZSkge1xuICAgICAgICB4ZG1GcmFtZS5wb3N0TWVzc2FnZShtZXNzYWdlLCBYZG1Mb2FkZXIuT1JJR0lOKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGdldFhETUZyYW1lKCkge1xuICAgIC8vIFRPRE86IElzIHRoaXMgYSBzZWN1cml0eSBwcm9ibGVtPyBXaGF0IHByZXZlbnRzIHNvbWVvbmUgZnJvbSB1c2luZyB0aGlzIHNhbWUgbmFtZSBhbmQgaW50ZXJjZXB0aW5nIG91ciBtZXNzYWdlcz9cbiAgICByZXR1cm4gd2luZG93LmZyYW1lc1snYW50LXhkbS1oaWRkZW4nXTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgc2VuZE1lc3NhZ2U6IHNlbmRNZXNzYWdlXG59OyIsInZhciBBcHBNb2RlID0gcmVxdWlyZSgnLi9hcHAtbW9kZScpO1xudmFyIFVSTENvbnN0YW50cyA9IHJlcXVpcmUoJy4vdXJsLWNvbnN0YW50cycpO1xudmFyIFdpZGdldEJ1Y2tldCA9IHJlcXVpcmUoJy4vd2lkZ2V0LWJ1Y2tldCcpO1xuXG52YXIgWERNX09SSUdJTiA9IEFwcE1vZGUub2ZmbGluZSA/IFVSTENvbnN0YW50cy5ERVZFTE9QTUVOVCA6IFVSTENvbnN0YW50cy5QUk9EVUNUSU9OO1xuXG5mdW5jdGlvbiBjcmVhdGVYRE1mcmFtZShncm91cElkKSB7XG4gICAgdmFyIHhkbVVybCA9IFhETV9PUklHSU4gKyAnL3N0YXRpYy93aWRnZXQtbmV3L3hkbS1uZXcuaHRtbCc7XG4gICAgdmFyIHBhcmVudFVybCA9IGVuY29kZVVSSUNvbXBvbmVudCh3aW5kb3cubG9jYXRpb24uaHJlZik7XG4gICAgdmFyIHBhcmVudEhvc3QgPSBlbmNvZGVVUklDb21wb25lbnQod2luZG93LmxvY2F0aW9uLnByb3RvY29sICsgJy8vJyArIHdpbmRvdy5sb2NhdGlvbi5ob3N0KTtcbiAgICB2YXIgeGRtRnJhbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpZnJhbWUnKTtcbiAgICB4ZG1GcmFtZS5zZXRBdHRyaWJ1dGUoJ2lkJywgJ2FudC14ZG0taGlkZGVuJyk7XG4gICAgeGRtRnJhbWUuc2V0QXR0cmlidXRlKCduYW1lJywgJ2FudC14ZG0taGlkZGVuJyk7XG4gICAgeGRtRnJhbWUuc2V0QXR0cmlidXRlKCdzcmMnLCB4ZG1VcmwgKyAnP3BhcmVudFVybD0nICsgcGFyZW50VXJsICsgJyZwYXJlbnRIb3N0PScgKyBwYXJlbnRIb3N0ICsgJyZncm91cF9pZD0nICsgZ3JvdXBJZCk7XG4gICAgeGRtRnJhbWUuc2V0QXR0cmlidXRlKCd3aWR0aCcsIDEpO1xuICAgIHhkbUZyYW1lLnNldEF0dHJpYnV0ZSgnaGVpZ2h0JywgMSk7XG4gICAgeGRtRnJhbWUuc2V0QXR0cmlidXRlKCdzdHlsZScsICdwb3NpdGlvbjphYnNvbHV0ZTt0b3A6LTEwMDBweDtsZWZ0Oi0xMDAwcHg7Jyk7XG5cbiAgICBXaWRnZXRCdWNrZXQuZ2V0KCkuYXBwZW5kQ2hpbGQoeGRtRnJhbWUpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGVYRE1mcmFtZTogY3JlYXRlWERNZnJhbWUsXG4gICAgT1JJR0lOOiBYRE1fT1JJR0lOXG59OyIsInZhciBYRE1DbGllbnQgPSByZXF1aXJlKCcuL3V0aWxzL3hkbS1jbGllbnQnKTtcbnZhciBFdmVudHMgPSByZXF1aXJlKCcuL2V2ZW50cycpO1xudmFyIEdyb3VwU2V0dGluZ3MgPSByZXF1aXJlKCcuL2dyb3VwLXNldHRpbmdzJyk7XG52YXIgUGFnZURhdGEgPSByZXF1aXJlKCcuL3BhZ2UtZGF0YScpO1xuXG5mdW5jdGlvbiBjaGVja0FuYWx5dGljc0Nvb2tpZXMoKSB7XG4gICAgLy8gV2hlbiB0aGUgd2lkZ2V0IGxvYWRzLCBjaGVjayBmb3IgYW55IGNvb2tpZXMgdGhhdCBoYXZlIGJlZW4gd3JpdHRlbiBieSB0aGUgbGVnYWN5IGNvbnRlbnQgcmVjLlxuICAgIC8vIElmIHRob3NlIGNvb2tpZXMgZXhpc3QsIGZpcmUgdGhlIGV2ZW50IGFuZCBjbGVhciB0aGVtLlxuICAgIFhETUNsaWVudC5zZW5kTWVzc2FnZSgnZ2V0Q29va2llcycsIFsgJ3JlZGlyZWN0X3R5cGUnLCAncmVmZXJyaW5nX2ludF9pZCcsICdwYWdlX2hhc2gnIF0sIGZ1bmN0aW9uKGNvb2tpZXMpIHtcbiAgICAgICAgaWYgKGNvb2tpZXMucmVkaXJlY3RfdHlwZSA9PT0gJy9yLycpIHtcbiAgICAgICAgICAgIHZhciByZWFjdGlvbklkID0gY29va2llcy5yZWZlcnJpbmdfaW50X2lkO1xuICAgICAgICAgICAgdmFyIHBhZ2VIYXNoID0gY29va2llcy5wYWdlX2hhc2g7XG4gICAgICAgICAgICBnZXRQYWdlRGF0YShwYWdlSGFzaCwgZnVuY3Rpb24ocGFnZURhdGEpIHtcbiAgICAgICAgICAgICAgICBFdmVudHMucG9zdExlZ2FjeVJlY2lyY0NsaWNrZWQocGFnZURhdGEsIHJlYWN0aW9uSWQsIEdyb3VwU2V0dGluZ3MuZ2V0KCkpO1xuICAgICAgICAgICAgICAgIFhETUNsaWVudC5zZW5kTWVzc2FnZSgncmVtb3ZlQ29va2llcycsIFsgJ3JlZGlyZWN0X3R5cGUnLCAncmVmZXJyaW5nX2ludF9pZCcsICdwYWdlX2hhc2gnIF0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gZ2V0UGFnZURhdGEocGFnZUhhc2gsIGNhbGxiYWNrKSB7XG4gICAgaWYgKHBhZ2VIYXNoKSB7XG4gICAgICAgIC8vIFRoaXMgbW9kdWxlIGxvYWRzIHZlcnkgZWFybHkgaW4gdGhlIGFwcCBsaWZlY3ljbGUgYW5kIG1heSByZWNlaXZlIGV2ZW50cyBmcm9tIHRoZSBYRE0gZnJhbWUgYmVmb3JlIHBhZ2VcbiAgICAgICAgLy8gZGF0YSBoYXMgYmVlbiBsb2FkZWQuIEhvbGQgb250byBhbnkgc3VjaCBldmVudHMgdW50aWwgdGhlIHBhZ2UgZGF0YSBsb2FkcyBvciB3ZSB0aW1lb3V0LlxuICAgICAgICB2YXIgbWF4V2FpdFRpbWUgPSBEYXRlLm5vdygpICsgMTAwMDA7IC8vIEdpdmUgdXAgYWZ0ZXIgMTAgc2Vjb25kc1xuICAgICAgICB2YXIgaW50ZXJ2YWwgPSBzZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgcGFnZURhdGEgPSBQYWdlRGF0YS5nZXRQYWdlRGF0YShwYWdlSGFzaCk7XG4gICAgICAgICAgICBpZiAocGFnZURhdGEpIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhwYWdlRGF0YSk7XG4gICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChpbnRlcnZhbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoRGF0ZS5ub3coKSA+IG1heFdhaXRUaW1lKSB7XG4gICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChpbnRlcnZhbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIDUwKTtcbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHN0YXJ0OiBjaGVja0FuYWx5dGljc0Nvb2tpZXNcbn07IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEgYW50ZW5uYS1hdXRvLWN0YVwifSxcIm9cIjpcImNzc3Jlc2V0XCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtYXV0by1jdGEtaW5uZXJcIixcImFudC1jdGEtZm9yXCI6W3tcInRcIjoyLFwiclwiOlwiYW50SXRlbUlkXCJ9XX0sXCJmXCI6W3tcInRcIjo4LFwiclwiOlwibG9nb1wifSx7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1hdXRvLWN0YS1sYWJlbFwiLFwiYW50LXJlYWN0aW9ucy1sYWJlbC1mb3JcIjpbe1widFwiOjIsXCJyXCI6XCJhbnRJdGVtSWRcIn1dfX0se1widFwiOjQsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImFudC1leHBhbmRlZC1yZWFjdGlvbnMtZm9yXCI6W3tcInRcIjoyLFwiclwiOlwiYW50SXRlbUlkXCJ9XX19XSxcIm5cIjo1MCxcInJcIjpcImV4cGFuZFJlYWN0aW9uc1wifV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXBhZ2UgYW50ZW5uYS1ibG9ja2VkLXBhZ2VcIn0sXCJvXCI6XCJjc3NyZXNldFwiLFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWJvZHlcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJ2XCI6e1widGFwXCI6XCJiYWNrXCJ9LFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWJsb2NrZWQtYmFja1wifSxcImZcIjpbe1widFwiOjgsXCJyXCI6XCJsZWZ0XCJ9LHtcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcInJlYWN0aW9uc193aWRnZXRfX2JhY2tcXFwiKVwifX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWJsb2NrZWQtYm9keVwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1ibG9ja2VkLW1lc3NhZ2VcIn0sXCJmXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcImJsb2NrZWRfcGFnZV9fbWVzc2FnZTFcXFwiKVwifX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWJsb2NrZWQtbWVzc2FnZVwifSxcImZcIjpbe1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwiYmxvY2tlZF9wYWdlX19tZXNzYWdlMlxcXCIpXCJ9fV19XX1dfV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjQsXCJmXCI6W3tcInRcIjoyLFwiclwiOlwiY29udGFpbmVyRGF0YS5yZWFjdGlvblRvdGFsXCJ9XSxcIm5cIjo1MCxcInhcIjp7XCJyXCI6W1wiY29udGFpbmVyRGF0YS5yZWFjdGlvblRvdGFsXCIsXCJjb250YWluZXJEYXRhLmxvYWRlZFwiXSxcInNcIjpcIl8wJiZfMVwifX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NCxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpbXCJhbnRlbm5hLWN0YS1leHBhbmRlZC1yZWFjdGlvbiBcIix7XCJ0XCI6NCxcImZcIjpbXCJhbnRlbm5hLWN0YS1leHBhbmRlZC1maXJzdFwiXSxcIm5cIjo1MCxcInhcIjp7XCJyXCI6W1wiQGluZGV4XCJdLFwic1wiOlwiXzA9PT0wXCJ9fV19LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jdGEtZXhwYW5kZWQtdGV4dFwifSxcImZcIjpbe1widFwiOjIsXCJyXCI6XCIuL3RleHRcIn1dfSx7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jdGEtZXhwYW5kZWQtY291bnRcIn0sXCJmXCI6W3tcInRcIjoyLFwiclwiOlwiLi9jb3VudFwifV19XX1dLFwieFwiOntcInJcIjpbXCJjb21wdXRlRXhwYW5kZWRSZWFjdGlvbnNcIixcImNvbnRhaW5lckRhdGEucmVhY3Rpb25zXCJdLFwic1wiOlwiXzAoXzEpXCJ9fV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo0LFwiZlwiOlt7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJjYWxsX3RvX2FjdGlvbl9sYWJlbF9fcmVzcG9uc2VzXFxcIilcIn19XSxcIm5cIjo1MCxcInhcIjp7XCJyXCI6W1wiY29udGFpbmVyRGF0YS5sb2FkZWRcIixcImNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbFwiXSxcInNcIjpcIiFfMHx8XzE9PT11bmRlZmluZWR8fF8xPT09MFwifX0se1widFwiOjQsXCJuXCI6NTEsXCJmXCI6W3tcInRcIjo0LFwiblwiOjUwLFwieFwiOntcInJcIjpbXCJjb250YWluZXJEYXRhLnJlYWN0aW9uVG90YWxcIl0sXCJzXCI6XCJfMD09PTFcIn0sXCJmXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcImNhbGxfdG9fYWN0aW9uX2xhYmVsX19yZXNwb25zZXNfb25lXFxcIilcIn19XX0se1widFwiOjQsXCJuXCI6NTAsXCJ4XCI6e1wiclwiOltcImNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbFwiXSxcInNcIjpcIiEoXzA9PT0xKVwifSxcImZcIjpbXCIgXCIse1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIixcImNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbFwiXSxcInNcIjpcIl8wKFxcXCJjYWxsX3RvX2FjdGlvbl9sYWJlbF9fcmVzcG9uc2VzX21hbnlcXFwiLFtfMV0pXCJ9fV19XSxcInhcIjp7XCJyXCI6W1wiY29udGFpbmVyRGF0YS5sb2FkZWRcIixcImNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbFwiXSxcInNcIjpcIiFfMHx8XzE9PT11bmRlZmluZWR8fF8xPT09MFwifX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXBhZ2UgYW50ZW5uYS1jb25maXJtYXRpb24tcGFnZVwifSxcIm9cIjpcImNzc3Jlc2V0XCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtYm9keVwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb25maXJtLXdyYXBwZXJcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY29uZmlybS1yZWFjdGlvblwifSxcImZcIjpbe1widFwiOjIsXCJyXCI6XCJ0ZXh0XCJ9XX1dfV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtZm9vdGVyIGFudGVubmEtY29uZmlybS1mb290ZXJcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXNoYXJlXCJ9LFwiZlwiOlt7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJjb25maXJtYXRpb25fcGFnZV9fc2hhcmVcXFwiKVwifX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJhXCIsXCJ2XCI6e1widGFwXCI6XCJzaGFyZS1mYWNlYm9va1wifSxcImFcIjp7XCJocmVmXCI6XCIvL2ZhY2Vib29rLmNvbVwifSxcImZcIjpbe1widFwiOjgsXCJyXCI6XCJmYWNlYm9va0ljb25cIn1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImFcIixcInZcIjp7XCJ0YXBcIjpcInNoYXJlLXR3aXR0ZXJcIn0sXCJhXCI6e1wiaHJlZlwiOlwiLy90d2l0dGVyLmNvbVwifSxcImZcIjpbe1widFwiOjgsXCJyXCI6XCJ0d2l0dGVySWNvblwifV19XX1dfV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjQsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEgYW50ZW5uYS1jb250ZW50cmVjLWlubmVyXCJ9LFwib1wiOlwiY3NzcmVzZXRcIixcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb250ZW50cmVjLWhlYWRlclwifSxcImZcIjpbe1widFwiOjIsXCJyXCI6XCJ0aXRsZVwifV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY29udGVudHJlYy1lbnRyaWVzXCJ9LFwiZlwiOlt7XCJ0XCI6NCxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOltcImFudGVubmEtY29udGVudHJlYy1lbnRyeSBhbnRlbm5hLXJlc2V0IFwiLHtcInRcIjo0LFwiZlwiOltcImFudGVubmEtZGVza3RvcFwiXSxcIm5cIjo1MSxcInJcIjpcImlzTW9iaWxlXCJ9XSxcInN0eWxlXCI6W1wid2lkdGg6XCIse1widFwiOjIsXCJyXCI6XCJlbnRyeVdpZHRoXCJ9LFwiO1wiXX0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiYVwiLFwiYVwiOntcImhyZWZcIjpbe1widFwiOjIsXCJ4XCI6e1wiclwiOltcImNvbXB1dGVFbnRyeVVybFwiLFwiLlwiXSxcInNcIjpcIl8wKF8xKVwifX1dLFwidGFyZ2V0XCI6W3tcInRcIjo0LFwiZlwiOltcIl9zZWxmXCJdLFwiblwiOjUwLFwiclwiOlwiaXNNb2JpbGVcIn0se1widFwiOjQsXCJuXCI6NTEsXCJmXCI6W1wiX3RhcmdldFwiXSxcInJcIjpcImlzTW9iaWxlXCJ9XX0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY29udGVudHJlYy1lbnRyeS1pbm5lclwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb250ZW50cmVjLWVudHJ5LWhlYWRlclwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb250ZW50cmVjLXJlYWN0aW9uLXRleHRcIn0sXCJmXCI6W3tcInRcIjoyLFwiclwiOlwiLi90b3BfcmVhY3Rpb24udGV4dFwifV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY29udGVudHJlYy1pbmRpY2F0b3Itd3JhcHBlclwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb250ZW50cmVjLXJlYWN0aW9uLWluZGljYXRvclwifSxcImZcIjpbe1widFwiOjgsXCJyXCI6XCJsb2dvXCJ9LHtcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWNvbnRlbnRyZWMtcmVhY3Rpb24tY291bnRcIn0sXCJmXCI6W1wiIFwiLHtcInRcIjoyLFwiclwiOlwiLi9yZWFjdGlvbl9jb3VudFwifV19XX1dfV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY29udGVudHJlYy1ib2R5XCIsXCJzdHlsZVwiOltcImJhY2tncm91bmQ6XCIse1widFwiOjIsXCJyeFwiOntcInJcIjpcImNvbG9yc1wiLFwibVwiOlt7XCJ0XCI6MzAsXCJuXCI6XCJpbmRleFwifSxcImJhY2tncm91bmRcIl19fSxcIjtjb2xvcjpcIix7XCJ0XCI6MixcInJ4XCI6e1wiclwiOlwiY29sb3JzXCIsXCJtXCI6W3tcInRcIjozMCxcIm5cIjpcImluZGV4XCJ9LFwiZm9yZWdyb3VuZFwiXX19LFwiO1wiXX0sXCJmXCI6W3tcInRcIjo0LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWNvbnRlbnRyZWMtYm9keS1pbWFnZVwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJpbWdcIixcImFcIjp7XCJzcmNcIjpbe1widFwiOjIsXCJyXCI6XCIuL2NvbnRlbnQuYm9keVwifV19fV19XSxcIm5cIjo1MCxcInhcIjp7XCJyXCI6W1wiLi9jb250ZW50LnR5cGVcIl0sXCJzXCI6XCJfMD09PVxcXCJpbWFnZVxcXCJcIn19LHtcInRcIjo0LFwiblwiOjUxLFwiZlwiOlt7XCJ0XCI6NCxcIm5cIjo1MCxcInhcIjp7XCJyXCI6W1wiLi9jb250ZW50LnR5cGVcIl0sXCJzXCI6XCJfMD09PVxcXCJ0ZXh0XFxcIlwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb250ZW50cmVjLWJvZHktdGV4dFwifSxcIm9cIjpcInJlbmRlclRleHRcIixcImZcIjpbe1widFwiOjIsXCJyXCI6XCIuL2NvbnRlbnQuYm9keVwifV19XX1dLFwieFwiOntcInJcIjpbXCIuL2NvbnRlbnQudHlwZVwiXSxcInNcIjpcIl8wPT09XFxcImltYWdlXFxcIlwifX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWNvbnRlbnRyZWMtcGFnZS10aXRsZVwifSxcImZcIjpbe1widFwiOjIsXCJyXCI6XCIuL3BhZ2UudGl0bGVcIn1dfV19XX1dfV0sXCJpXCI6XCJpbmRleFwiLFwiclwiOlwiY29udGVudERhdGEuZW50cmllc1wifV19XX1dLFwiblwiOjUwLFwieFwiOntcInJcIjpbXCJwb3B1bGF0ZUNvbnRlbnRFbnRyaWVzXCIsXCJwYWdlRGF0YS5zdW1tYXJ5TG9hZGVkXCIsXCJjb250ZW50RGF0YS5lbnRyaWVzXCJdLFwic1wiOlwiXzAoXzEpJiZfMlwifX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXBhZ2UgYW50ZW5uYS1lcnJvci1wYWdlXCJ9LFwib1wiOlwiY3NzcmVzZXRcIixcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1ib2R5XCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwidlwiOntcInRhcFwiOlwiYmFja1wifSxcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1lcnJvci1iYWNrXCJ9LFwiZlwiOlt7XCJ0XCI6OCxcInJcIjpcImxlZnRcIn0se1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwicmVhY3Rpb25zX3dpZGdldF9fYmFja1xcXCIpXCJ9fV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtZXJyb3ItYm9keVwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1lcnJvci1tZXNzYWdlXCJ9LFwiZlwiOlt7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJlcnJvcl9wYWdlX19tZXNzYWdlXFxcIilcIn19XX1dfV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXBhZ2UgYW50ZW5uYS1sb2NhdGlvbnMtcGFnZVwifSxcIm9cIjpcImNzc3Jlc2V0XCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtYm9keVwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcInZcIjp7XCJ0YXBcIjpcImJhY2tcIn0sXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtbG9jYXRpb25zLWJhY2tcIn0sXCJmXCI6W3tcInRcIjo4LFwiclwiOlwibGVmdFwifSx7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJyZWFjdGlvbnNfd2lkZ2V0X19iYWNrXFxcIilcIn19XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJ0YWJsZVwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxvY2F0aW9ucy10YWJsZVwifSxcImZcIjpbe1widFwiOjQsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwidHJcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1sb2NhdGlvbnMtY29udGVudC1yb3dcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwidGRcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1sb2NhdGlvbnMtY291bnQtY2VsbFwifSxcImZcIjpbe1widFwiOjQsXCJmXCI6W3tcInRcIjozLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcImxvY2F0aW9uc19wYWdlX19jb3VudF9vbmVcXFwiKVwifX1dLFwiblwiOjUwLFwieFwiOntcInJcIjpbXCJwYWdlUmVhY3Rpb25Db3VudFwiXSxcInNcIjpcIl8wPT09MVwifX0se1widFwiOjQsXCJuXCI6NTEsXCJmXCI6W3tcInRcIjozLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCIsXCJwYWdlUmVhY3Rpb25Db3VudFwiXSxcInNcIjpcIl8wKFxcXCJsb2NhdGlvbnNfcGFnZV9fY291bnRfbWFueVxcXCIsW18xXSlcIn19XSxcInhcIjp7XCJyXCI6W1wicGFnZVJlYWN0aW9uQ291bnRcIl0sXCJzXCI6XCJfMD09PTFcIn19XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJ0ZFwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxvY2F0aW9ucy1wYWdlLWJvZHlcIn0sXCJmXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcImxvY2F0aW9uc19wYWdlX19wYWdlbGV2ZWxcXFwiKVwifX1dfV19XSxcIm5cIjo1MCxcInJcIjpcInBhZ2VSZWFjdGlvbkNvdW50XCJ9LFwiIFwiLHtcInRcIjo0LFwiZlwiOlt7XCJ0XCI6NCxcImZcIjpbXCIgXCIse1widFwiOjcsXCJlXCI6XCJ0clwiLFwidlwiOntcInRhcFwiOlwicmV2ZWFsXCJ9LFwiYVwiOntcImNsYXNzXCI6W1wiYW50ZW5uYS1sb2NhdGlvbnMtY29udGVudC1yb3cgXCIse1widFwiOjQsXCJmXCI6W1wiYW50ZW5uYS1sb2NhdGVcIl0sXCJuXCI6NTAsXCJ4XCI6e1wiclwiOltcImNhbkxvY2F0ZVwiLFwiLi9jb250YWluZXJIYXNoXCJdLFwic1wiOlwiXzAoXzEpXCJ9fV19LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInRkXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtbG9jYXRpb25zLWNvdW50LWNlbGxcIn0sXCJmXCI6W3tcInRcIjo0LFwiZlwiOlt7XCJ0XCI6MyxcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJsb2NhdGlvbnNfcGFnZV9fY291bnRfb25lXFxcIilcIn19XSxcIm5cIjo1MCxcInhcIjp7XCJyXCI6W1wiLi9jb3VudFwiXSxcInNcIjpcIl8wPT09MVwifX0se1widFwiOjQsXCJuXCI6NTEsXCJmXCI6W3tcInRcIjozLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCIsXCIuL2NvdW50XCJdLFwic1wiOlwiXzAoXFxcImxvY2F0aW9uc19wYWdlX19jb3VudF9tYW55XFxcIixbXzFdKVwifX1dLFwieFwiOntcInJcIjpbXCIuL2NvdW50XCJdLFwic1wiOlwiXzA9PT0xXCJ9fV19LFwiIFwiLHtcInRcIjo0LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInRkXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtbG9jYXRpb25zLXRleHQtYm9keVwifSxcImZcIjpbe1widFwiOjIsXCJyXCI6XCIuL2JvZHlcIn1dfV0sXCJuXCI6NTAsXCJ4XCI6e1wiclwiOltcIi4va2luZFwiXSxcInNcIjpcIl8wPT09XFxcInR4dFxcXCJcIn19LHtcInRcIjo0LFwiblwiOjUxLFwiZlwiOlt7XCJ0XCI6NCxcIm5cIjo1MCxcInhcIjp7XCJyXCI6W1wiLi9raW5kXCJdLFwic1wiOlwiXzA9PT1cXFwiaW1nXFxcIlwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJ0ZFwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxvY2F0aW9ucy1pbWFnZS1ib2R5XCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImltZ1wiLFwiYVwiOntcInNyY1wiOlt7XCJ0XCI6MixcInJcIjpcIi4vYm9keVwifV19fV19XX0se1widFwiOjQsXCJuXCI6NTAsXCJ4XCI6e1wiclwiOltcIi4va2luZFwiXSxcInNcIjpcIighKF8wPT09XFxcImltZ1xcXCIpKSYmKF8wPT09XFxcIm1lZFxcXCIpXCJ9LFwiZlwiOltcIiBcIix7XCJ0XCI6NyxcImVcIjpcInRkXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtbG9jYXRpb25zLW1lZGlhLWJvZHlcIn0sXCJmXCI6W3tcInRcIjo4LFwiclwiOlwiZmlsbVwifSx7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1sb2NhdGlvbnMtdmlkZW9cIn0sXCJmXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcImxvY2F0aW9uc19wYWdlX192aWRlb1xcXCIpXCJ9fV19XX1dfSx7XCJ0XCI6NCxcIm5cIjo1MCxcInhcIjp7XCJyXCI6W1wiLi9raW5kXCJdLFwic1wiOlwiKCEoXzA9PT1cXFwiaW1nXFxcIikpJiYoIShfMD09PVxcXCJtZWRcXFwiKSlcIn0sXCJmXCI6W1wiIFwiLHtcInRcIjo3LFwiZVwiOlwidGRcIixcImZcIjpbXCLCoFwiXX1dfV0sXCJ4XCI6e1wiclwiOltcIi4va2luZFwiXSxcInNcIjpcIl8wPT09XFxcInR4dFxcXCJcIn19XX1dLFwiblwiOjUwLFwieFwiOntcInJcIjpbXCIuL2tpbmRcIl0sXCJzXCI6XCJfMCE9PVxcXCJwYWdcXFwiXCJ9fV0sXCJpXCI6XCJpZFwiLFwiclwiOlwibG9jYXRpb25EYXRhXCJ9XX1dfV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1wYWdlIGFudGVubmEtbG9naW4tcGFnZVwifSxcIm9cIjpcImNzc3Jlc2V0XCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtYm9keVwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcInZcIjp7XCJ0YXBcIjpcImJhY2tcIn0sXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtbG9naW4tYmFja1wifSxcImZcIjpbe1widFwiOjgsXCJyXCI6XCJsZWZ0XCJ9LHtcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcInJlYWN0aW9uc193aWRnZXRfX2JhY2tcXFwiKVwifX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxvZ2luLWNvbnRhaW5lclwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1sb2dpbi1jb250ZW50XCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxvZ2luLW1lc3NhZ2VcIn0sXCJmXCI6W3tcInRcIjozLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCIsXCJncm91cE5hbWVcIl0sXCJzXCI6XCJfMChcXFwibG9naW5fcGFnZV9fbWVzc2FnZV8xXFxcIixbXzFdKVwifX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxvZ2luLW1lc3NhZ2VcIn0sXCJmXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcImxvZ2luX3BhZ2VfX21lc3NhZ2VfMlxcXCIpXCJ9fV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtbG9naW4tYnV0dG9uc1wifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiZmItbG9naW4tYnV0dG9uXCJ9LFwidlwiOntcInRhcFwiOlwiZmFjZWJvb2tMb2dpblwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJpbWdcIixcImFcIjp7XCJzcmNcIjpcIi9zdGF0aWMvd2lkZ2V0L2ltYWdlcy9mYi1sb2dpbl90b19yZWFkcmJvYXJkLnBuZ1wifX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLW9yXCJ9LFwiZlwiOltcIm9yXCJdfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxvZ2luLWJ1dHRvblwifSxcInZcIjp7XCJ0YXBcIjpcImFudGVubmFMb2dpblwifSxcImZcIjpbe1widFwiOjgsXCJyXCI6XCJsb2dvXCJ9LHtcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxvZ2luLXRleHRcIn0sXCJmXCI6W1wiTG9naW4gdG8gQW50ZW5uYVwiXX1dfV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcHJpdmFjeS10ZXh0XCJ9LFwiZlwiOlt7XCJ0XCI6MyxcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJsb2dpbl9wYWdlX19wcml2YWN5XFxcIilcIn19XX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxvZ2luLXBlbmRpbmdcIn0sXCJmXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcImxvZ2luX3BhZ2VfX3BlbmRpbmdfcHJlXFxcIilcIn19LHtcInRcIjo3LFwiZVwiOlwiYVwiLFwiYVwiOntcImhyZWZcIjpcImphdmFzY3JpcHQ6dm9pZCgwKTtcIn0sXCJ2XCI6e1widGFwXCI6XCJyZXRyeVwifSxcImZcIjpbe1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwibG9naW5fcGFnZV9fcGVuZGluZ19jbGlja1xcXCIpXCJ9fV19LHtcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcImxvZ2luX3BhZ2VfX3BlbmRpbmdfcG9zdFxcXCIpXCJ9fV19XX1dfV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJvXCI6XCJjc3NyZXNldFwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hIGFudGVubmEtbWVkaWEtaW5kaWNhdG9yLXdyYXBwZXJcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwibVwiOlt7XCJ0XCI6MixcInJcIjpcImV4dHJhQXR0cmlidXRlc1wifV0sXCJhXCI6e1wiY2xhc3NcIjpbXCJhbnRlbm5hIGFudGVubmEtbWVkaWEtaW5kaWNhdG9yLXdpZGdldCBcIix7XCJ0XCI6NCxcImZcIjpbXCJhbnRlbm5hLW5vdGxvYWRlZFwiXSxcIm5cIjo1MSxcInJcIjpcImNvbnRhaW5lckRhdGEubG9hZGVkXCJ9LFwiIGFudGVubmEtcmVzZXQgXCIse1widFwiOjQsXCJmXCI6W1wiYW50ZW5uYS10b3VjaFwiXSxcIm5cIjo1MCxcInJcIjpcInN1cHBvcnRzVG91Y2hcIn1dfSxcImZcIjpbXCIgXCIse1widFwiOjgsXCJyXCI6XCJsb2dvXCJ9LFwiIFwiLHtcInRcIjo0LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1yZWFjdGlvbi10b3RhbFwifSxcIm9cIjpcImNzc3Jlc2V0XCIsXCJmXCI6W3tcInRcIjoyLFwiclwiOlwiY29udGFpbmVyRGF0YS5yZWFjdGlvblRvdGFsXCJ9XX1dLFwiblwiOjUwLFwiclwiOlwiY29udGFpbmVyRGF0YS5yZWFjdGlvblRvdGFsXCJ9LHtcInRcIjo0LFwiblwiOjUxLFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1yZWFjdGlvbi1wcm9tcHRcIn0sXCJmXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcIm1lZGlhX2luZGljYXRvcl9fdGhpbmtcXFwiKVwifX1dfV0sXCJyXCI6XCJjb250YWluZXJEYXRhLnJlYWN0aW9uVG90YWxcIn1dfV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1wYWdlIGFudGVubmEtcGVuZGluZy1wYWdlXCJ9LFwib1wiOlwiY3NzcmVzZXRcIixcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1ib2R5XCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXBlbmRpbmctcmVhY3Rpb25cIn0sXCJmXCI6W3tcInRcIjoyLFwiclwiOlwidGV4dFwifV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcGVuZGluZy1tZXNzYWdlXCJ9LFwiZlwiOlt7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJwZW5kaW5nX3BhZ2VfX21lc3NhZ2VfYXBwZWFyXFxcIilcIn19XX1dfV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1wb3B1cFwifSxcIm9cIjpcImNzc3Jlc2V0XCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcG9wdXAtYm9keVwifSxcImZcIjpbe1widFwiOjgsXCJyXCI6XCJsb2dvXCJ9LHtcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXBvcHVwLXRleHRcIn0sXCJmXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcInBvcHVwX3dpZGdldF9fdGhpbmtcXFwiKVwifX1dfV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXBhZ2UgYW50ZW5uYS1yZWFjdGlvbnMtcGFnZVwifSxcIm9cIjpcImNzc3Jlc2V0XCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtYm9keVwifSxcImZcIjpbe1widFwiOjQsXCJmXCI6W3tcInRcIjo0LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwidlwiOntcInRhcFwiOlwicmVhY3RcIixcIm1vdXNlZW50ZXJcIjpcImhpZ2hsaWdodFwiLFwibW91c2VsZWF2ZVwiOlwiY2xlYXJoaWdobGlnaHRzXCJ9LFwiYVwiOntcImNsYXNzXCI6W1wiYW50ZW5uYS1yZWFjdGlvbiBcIix7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wicmVhY3Rpb25zTGF5b3V0Q2xhc3NcIixcImluZGV4XCJdLFwic1wiOlwiXzAoXzEpXCJ9fV19LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXJlYWN0aW9uLWJveFwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOltcImFudGVubmEtcmVhY3Rpb24tdGV4dCBcIix7XCJ0XCI6NCxcImZcIjpbXCJhbnRlbm5hLXJlYWN0aW9uLXplcm9cIl0sXCJuXCI6NTEsXCJyXCI6XCIuL2NvdW50XCJ9XX0sXCJvXCI6XCJzaXpldG9maXRcIixcImZcIjpbe1widFwiOjIsXCJyXCI6XCIuL3RleHRcIn1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXJlYWN0aW9uLWNvdW50XCJ9LFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcIi4vY291bnRcIn1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXBsdXNvbmVcIn0sXCJmXCI6W1wiKzFcIl19LFwiIFwiLHtcInRcIjo0LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwidlwiOntcInRhcFwiOlwic2hvd2xvY2F0aW9uc1wifSxcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1yZWFjdGlvbi1sb2NhdGlvblwifSxcImZcIjpbe1widFwiOjgsXCJyXCI6XCJsb2NhdGlvbkljb25cIn1dfV0sXCJuXCI6NTAsXCJ4XCI6e1wiclwiOltcImlzU3VtbWFyeVwiLFwiLi9jb3VudFwiXSxcInNcIjpcIl8wJiZfMVwifX1dfV19XSxcImlcIjpcImluZGV4XCIsXCJyXCI6XCJyZWFjdGlvbnNcIn1dLFwiblwiOjUwLFwiclwiOlwicmVhY3Rpb25zXCJ9XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1mb290ZXIgYW50ZW5uYS1yZWFjdGlvbnMtZm9vdGVyXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWN1c3RvbS1hcmVhXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImlucHV0XCIsXCJ2XCI6e1wiZm9jdXNcIjpcImN1c3RvbWZvY3VzXCIsXCJrZXlkb3duXCI6XCJpbnB1dGtleWRvd25cIixcImJsdXJcIjpcImN1c3RvbWJsdXJcIn0sXCJhXCI6e1widmFsdWVcIjpbe1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwicmVhY3Rpb25zX3BhZ2VfX2FkZFxcXCIpXCJ9fV0sXCJtYXhsZW5ndGhcIjpcIjI1XCJ9fSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImJ1dHRvblwiLFwidlwiOntcInRhcFwiOlwibmV3Y3VzdG9tXCJ9LFwiZlwiOlt7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJyZWFjdGlvbnNfcGFnZV9fb2tcXFwiKVwifX1dfV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtdGV4dC1sb2dvXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImFcIixcImFcIjp7XCJocmVmXCI6XCIvL3d3dy5hbnRlbm5hLmlzXCJ9LFwiZlwiOltcIkFudGVubmFcIl19XX1dfV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOltcImFudGVubmEgYW50ZW5uYS1yZWFjdGlvbnMtd2lkZ2V0IFwiLHtcInRcIjo0LFwiZlwiOltcImFudGVubmEtdG91Y2hcIl0sXCJuXCI6NTAsXCJyXCI6XCJzdXBwb3J0c1RvdWNoXCJ9XSxcInRhYmluZGV4XCI6XCIwXCJ9LFwib1wiOlwiY3NzcmVzZXRcIixcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1oZWFkZXJcIn0sXCJmXCI6W3tcInRcIjo4LFwiclwiOlwibG9nb1wifSx7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1yZWFjdGlvbnMtdGl0bGVcIn0sXCJmXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcInJlYWN0aW9uc193aWRnZXRfX3RpdGxlXFxcIilcIn19XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJ2XCI6e1widGFwXCI6XCJjbG9zZVwifSxcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1yZWFjdGlvbnMtY2xvc2VcIn0sXCJmXCI6W1wiWFwiXX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXBhZ2UtY29udGFpbmVyXCJ9LFwiZlwiOltcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXByb2dyZXNzLXBhZ2UgYW50ZW5uYS1wYWdlXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWJvZHlcIn0sXCJmXCI6W119LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcHJvZ3Jlc3Mtc3Bpbm5lclwifSxcImZcIjpbe1widFwiOjgsXCJyXCI6XCJsb2dvXCJ9XX1dfV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwib1wiOlwiY3NzcmVzZXRcIixcImFcIjp7XCJjbGFzc1wiOltcImFudGVubmEgYW50ZW5uYS1zdW1tYXJ5LXdpZGdldCBuby1hbnQgXCIse1widFwiOjQsXCJmXCI6W1wiYW50ZW5uYS1ub3Rsb2FkZWRcIl0sXCJuXCI6NTEsXCJyXCI6XCJwYWdlRGF0YS5zdW1tYXJ5TG9hZGVkXCJ9LFwiIGFudGVubmEtcmVzZXQgXCIse1widFwiOjQsXCJmXCI6W1wiYW50ZW5uYS1leHBhbmRlZC1zdW1tYXJ5XCJdLFwiblwiOjUwLFwiclwiOlwiaXNFeHBhbmRlZFN1bW1hcnlcIn1dfSxcImZcIjpbXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1zdW1tYXJ5LWlubmVyXCJ9LFwiZlwiOlt7XCJ0XCI6OCxcInJcIjpcImxvZ29cIn0se1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtc3VtbWFyeS10aXRsZVwifSxcImZcIjpbXCIgXCIse1widFwiOjQsXCJmXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcInN1bW1hcnlfd2lkZ2V0X19yZWFjdGlvbnNcXFwiKVwifX1dLFwiblwiOjUwLFwieFwiOntcInJcIjpbXCJwYWdlRGF0YS5zdW1tYXJ5VG90YWxcIl0sXCJzXCI6XCJfMD09PTBcIn19LHtcInRcIjo0LFwiblwiOjUxLFwiZlwiOlt7XCJ0XCI6NCxcIm5cIjo1MCxcInhcIjp7XCJyXCI6W1wicGFnZURhdGEuc3VtbWFyeVRvdGFsXCJdLFwic1wiOlwiXzA9PT0xXCJ9LFwiZlwiOlt7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJzdW1tYXJ5X3dpZGdldF9fcmVhY3Rpb25zX29uZVxcXCIpXCJ9fV19LHtcInRcIjo0LFwiblwiOjUwLFwieFwiOntcInJcIjpbXCJwYWdlRGF0YS5zdW1tYXJ5VG90YWxcIl0sXCJzXCI6XCIhKF8wPT09MSlcIn0sXCJmXCI6W1wiIFwiLHtcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCIsXCJwYWdlRGF0YS5zdW1tYXJ5VG90YWxcIl0sXCJzXCI6XCJfMChcXFwic3VtbWFyeV93aWRnZXRfX3JlYWN0aW9uc19tYW55XFxcIixbXzFdKVwifX1dfV0sXCJ4XCI6e1wiclwiOltcInBhZ2VEYXRhLnN1bW1hcnlUb3RhbFwiXSxcInNcIjpcIl8wPT09MFwifX1dfSx7XCJ0XCI6NCxcImZcIjpbe1widFwiOjQsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwib1wiOlwiY3NzcmVzZXRcIixcImFcIjp7XCJjbGFzc1wiOltcImFudGVubmEtZXhwYW5kZWQtcmVhY3Rpb24gXCIse1widFwiOjQsXCJmXCI6W1wiYW50ZW5uYS1leHBhbmRlZC1maXJzdFwiXSxcIm5cIjo1MCxcInhcIjp7XCJyXCI6W1wiQGluZGV4XCJdLFwic1wiOlwiXzA9PT0wXCJ9fV19LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1leHBhbmRlZC10ZXh0XCJ9LFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcIi4vdGV4dFwifV19LHtcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWV4cGFuZGVkLWNvdW50XCJ9LFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcIi4vY291bnRcIn1dfV19XSxcInhcIjp7XCJyXCI6W1wiY29tcHV0ZUV4cGFuZGVkUmVhY3Rpb25zXCIsXCJwYWdlRGF0YS5zdW1tYXJ5UmVhY3Rpb25zXCJdLFwic1wiOlwiXzAoXzEpXCJ9fV0sXCJuXCI6NTAsXCJyXCI6XCJpc0V4cGFuZGVkU3VtbWFyeVwifV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1mYWNlYm9va1wifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJzdmdcIixcImZcIjpbe1widFwiOjcsXCJlXCI6XCJ1c2VcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1mYWNlYm9vay1wYXRoXCIsXCJ4bGluazpocmVmXCI6XCIjYW50ZW5uYS1zdmctZmFjZWJvb2tcIn19XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWZpbG1cIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3ZnXCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwidXNlXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtZmlsbS1wYXRoXCIsXCJ4bGluazpocmVmXCI6XCIjYW50ZW5uYS1zdmctZmlsbVwifX1dfV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtbGVmdFwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJzdmdcIixcImZcIjpbe1widFwiOjcsXCJlXCI6XCJ1c2VcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1sZWZ0LXBhdGhcIixcInhsaW5rOmhyZWZcIjpcIiNhbnRlbm5hLXN2Zy1sZWZ0XCJ9fV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1sb2NhdGlvblwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJzdmdcIixcImZcIjpbe1widFwiOjcsXCJlXCI6XCJ1c2VcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1sb2NhdGlvbi1wYXRoXCIsXCJ4bGluazpocmVmXCI6XCIjYW50ZW5uYS1zdmctc2VhcmNoXCJ9fV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1sb2dvXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInN2Z1wiLFwiYVwiOntcInZpZXdCb3hcIjpcIjAgMCA1MTIgNTEyXCJ9LFwiZlwiOltcIiBcIix7XCJ0XCI6NyxcImVcIjpcInBhdGhcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1sb2dvLXBhdGhcIixcImRcIjpcIm0yODMgNTEwYzEyNS0xNyAyMjktMTI0IDIyOS0yNTMgMC0xNDEtMTE1LTI1Ni0yNTYtMjU2LTE0MSAwLTI1NiAxMTUtMjU2IDI1NiAwIDEzMCAxMDggMjM3IDIzMyAyNTRsMC0xNDljLTQ4LTE0LTg0LTUwLTg0LTEwMiAwLTY1IDQzLTExMyAxMDgtMTEzIDY1IDAgMTA3IDQ4IDEwNyAxMTMgMCA1Mi0zMyA4OC04MSAxMDJ6XCJ9fV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1sb2dvXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInN2Z1wiLFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInVzZVwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxvZ28tcGF0aFwiLFwieGxpbms6aHJlZlwiOlwiI2FudGVubmEtc3ZnLWxvZ29cIn19XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXR3aXR0ZXJcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3ZnXCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwidXNlXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtdHdpdHRlci1wYXRoXCIsXCJ4bGluazpocmVmXCI6XCIjYW50ZW5uYS1zdmctdHdpdHRlclwifX1dfV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJzdmdcIixcImFcIjp7XCJ4bWxuc1wiOlwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIixcInN0eWxlXCI6XCJkaXNwbGF5OiBub25lO1wifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJzeW1ib2xcIixcImFcIjp7XCJpZFwiOlwiYW50ZW5uYS1zdmctdHdpdHRlclwiLFwidmlld0JveFwiOlwiMCAwIDUxMiA1MTJcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwicGF0aFwiLFwiYVwiOntcImRcIjpcIm00NTMgMTM0Yy0xNCA2LTMwIDExLTQ2IDEyYzE2LTEwIDI5LTI1IDM1LTQ0Yy0xNSA5LTMzIDE2LTUxIDE5Yy0xNS0xNS0zNi0yNS01OS0yNWMtNDUgMC04MSAzNi04MSA4MWMwIDYgMSAxMiAyIDE4Yy02Ny0zLTEyNy0zNS0xNjctODRjLTcgMTItMTEgMjUtMTEgNDBjMCAyOCAxNSA1MyAzNiA2OGMtMTMtMS0yNS00LTM2LTExYzAgMSAwIDEgMCAyYzAgMzkgMjggNzEgNjUgNzljLTcgMi0xNCAzLTIyIDNjLTUgMC0xMC0xLTE1LTJjMTAgMzIgNDAgNTYgNzYgNTZjLTI4IDIyLTYzIDM1LTEwMSAzNWMtNiAwLTEzIDAtMTktMWMzNiAyMyA3OCAzNiAxMjQgMzZjMTQ5IDAgMjMwLTEyMyAyMzAtMjMwYzAtMyAwLTcgMC0xMGMxNi0xMiAyOS0yNiA0MC00MnpcIn19XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJzeW1ib2xcIixcImFcIjp7XCJpZFwiOlwiYW50ZW5uYS1zdmctZmFjZWJvb2tcIixcInZpZXdCb3hcIjpcIjAgMCA1MTIgNTEyXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInBhdGhcIixcImFcIjp7XCJkXCI6XCJtNDIwIDcybC0zMjggMGMtMTEgMC0yMCA5LTIwIDIwbDAgMzI4YzAgMTEgOSAyMCAyMCAyMGwxNzcgMGwwLTE0MmwtNDggMGwwLTU2bDQ4IDBsMC00MWMwLTQ4IDI5LTc0IDcxLTc0YzIwIDAgMzggMiA0MyAzbDAgNDlsLTI5IDBjLTIzIDAtMjggMTEtMjggMjdsMCAzNmw1NSAwbC03IDU2bC00OCAwbDAgMTQybDk0IDBjMTEgMCAyMC05IDIwLTIwbDAtMzI4YzAtMTEtOS0yMC0yMC0yMHpcIn19XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJzeW1ib2xcIixcImFcIjp7XCJpZFwiOlwiYW50ZW5uYS1zdmctc2VhcmNoXCIsXCJ2aWV3Qm94XCI6XCIwIDAgNTEyIDUxMlwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJwYXRoXCIsXCJhXCI6e1wiZFwiOlwibTM0NyAyMzhjMC0zNi0xMi02Ni0zNy05MWMtMjUtMjUtNTUtMzctOTEtMzdjLTM1IDAtNjUgMTItOTAgMzdjLTI1IDI1LTM4IDU1LTM4IDkxYzAgMzUgMTMgNjUgMzggOTBjMjUgMjUgNTUgMzggOTAgMzhjMzYgMCA2Ni0xMyA5MS0zOGMyNS0yNSAzNy01NSAzNy05MHogbTE0NyAyMzdjMCAxMC00IDE5LTExIDI2Yy03IDctMTYgMTEtMjYgMTFjLTEwIDAtMTktNC0yNi0xMWwtOTgtOThjLTM0IDI0LTcyIDM2LTExNCAzNmMtMjcgMC01My01LTc4LTE2Yy0yNS0xMS00Ni0yNS02NC00M2MtMTgtMTgtMzItMzktNDMtNjRjLTEwLTI1LTE2LTUxLTE2LTc4YzAtMjggNi01NCAxNi03OGMxMS0yNSAyNS00NyA0My02NWMxOC0xOCAzOS0zMiA2NC00M2MyNS0xMCA1MS0xNSA3OC0xNWMyOCAwIDU0IDUgNzkgMTVjMjQgMTEgNDYgMjUgNjQgNDNjMTggMTggMzIgNDAgNDMgNjVjMTAgMjQgMTYgNTAgMTYgNzhjMCA0Mi0xMiA4MC0zNiAxMTRsOTggOThjNyA3IDExIDE1IDExIDI1elwifX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcInN5bWJvbFwiLFwiYVwiOntcImlkXCI6XCJhbnRlbm5hLXN2Zy1sZWZ0XCIsXCJ2aWV3Qm94XCI6XCIwIDAgNTEyIDUxMlwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJwYXRoXCIsXCJhXCI6e1wiZFwiOlwibTM2OCAxNjBsLTY0LTY0LTE2MCAxNjAgMTYwIDE2MCA2NC02NC05Ni05NnpcIn19XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJzeW1ib2xcIixcImFcIjp7XCJpZFwiOlwiYW50ZW5uYS1zdmctbG9nb1wiLFwidmlld0JveFwiOlwiMCAwIDUxMiA1MTJcIn0sXCJmXCI6W1wiIFwiLHtcInRcIjo3LFwiZVwiOlwicGF0aFwiLFwiYVwiOntcImRcIjpcIm0yODMgNTEwYzEyNS0xNyAyMjktMTI0IDIyOS0yNTMgMC0xNDEtMTE1LTI1Ni0yNTYtMjU2LTE0MSAwLTI1NiAxMTUtMjU2IDI1NiAwIDEzMCAxMDggMjM3IDIzMyAyNTRsMC0xNDljLTQ4LTE0LTg0LTUwLTg0LTEwMiAwLTY1IDQzLTExMyAxMDgtMTEzIDY1IDAgMTA3IDQ4IDEwNyAxMTMgMCA1Mi0zMyA4OC04MSAxMDJ6XCJ9fV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwic3ltYm9sXCIsXCJhXCI6e1wiaWRcIjpcImFudGVubmEtc3ZnLWZpbG1cIixcInZpZXdCb3hcIjpcIjAgMCA1MTIgNTEyXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInBhdGhcIixcImFcIjp7XCJkXCI6XCJtOTEgNDU3bDAtMzZjMC01LTEtMTAtNS0xMy00LTQtOC02LTEzLTZsLTM2IDBjLTUgMC0xMCAyLTEzIDYtNCAzLTYgOC02IDEzbDAgMzZjMCA1IDIgOSA2IDEzIDMgNCA4IDUgMTMgNWwzNiAwYzUgMCA5LTEgMTMtNSA0LTQgNS04IDUtMTN6IG0wLTExMGwwLTM2YzAtNS0xLTktNS0xMy00LTQtOC01LTEzLTVsLTM2IDBjLTUgMC0xMCAxLTEzIDUtNCA0LTYgOC02IDEzbDAgMzZjMCA1IDIgMTAgNiAxMyAzIDQgOCA2IDEzIDZsMzYgMGM1IDAgOS0yIDEzLTYgNC0zIDUtOCA1LTEzeiBtMC0xMDlsMC0zN2MwLTUtMS05LTUtMTMtNC0zLTgtNS0xMy01bC0zNiAwYy01IDAtMTAgMi0xMyA1LTQgNC02IDgtNiAxM2wwIDM3YzAgNSAyIDkgNiAxMyAzIDMgOCA1IDEzIDVsMzYgMGM1IDAgOS0yIDEzLTUgNC00IDUtOCA1LTEzeiBtMjkzIDIxOWwwLTE0NmMwLTUtMi05LTUtMTMtNC00LTgtNS0xMy01bC0yMjAgMGMtNSAwLTkgMS0xMyA1LTMgNC01IDgtNSAxM2wwIDE0NmMwIDUgMiA5IDUgMTMgNCA0IDggNSAxMyA1bDIyMCAwYzUgMCA5LTEgMTMtNSAzLTQgNS04IDUtMTN6IG0tMjkzLTMyOWwwLTM3YzAtNS0xLTktNS0xMi00LTQtOC02LTEzLTZsLTM2IDBjLTUgMC0xMCAyLTEzIDYtNCAzLTYgNy02IDEybDAgMzdjMCA1IDIgOSA2IDEzIDMgMyA4IDUgMTMgNWwzNiAwYzUgMCA5LTIgMTMtNSA0LTQgNS04IDUtMTN6IG00MDMgMzI5bDAtMzZjMC01LTItMTAtNi0xMy0zLTQtOC02LTEzLTZsLTM2IDBjLTUgMC05IDItMTMgNi00IDMtNSA4LTUgMTNsMCAzNmMwIDUgMSA5IDUgMTMgNCA0IDggNSAxMyA1bDM2IDBjNSAwIDEwLTEgMTMtNSA0LTQgNi04IDYtMTN6IG0tMTEwLTIxOWwwLTE0N2MwLTUtMi05LTUtMTItNC00LTgtNi0xMy02bC0yMjAgMGMtNSAwLTkgMi0xMyA2LTMgMy01IDctNSAxMmwwIDE0N2MwIDUgMiA5IDUgMTMgNCAzIDggNSAxMyA1bDIyMCAwYzUgMCA5LTIgMTMtNSAzLTQgNS04IDUtMTN6IG0xMTAgMTA5bDAtMzZjMC01LTItOS02LTEzLTMtNC04LTUtMTMtNWwtMzYgMGMtNSAwLTkgMS0xMyA1LTQgNC01IDgtNSAxM2wwIDM2YzAgNSAxIDEwIDUgMTMgNCA0IDggNiAxMyA2bDM2IDBjNSAwIDEwLTIgMTMtNiA0LTMgNi04IDYtMTN6IG0wLTEwOWwwLTM3YzAtNS0yLTktNi0xMy0zLTMtOC01LTEzLTVsLTM2IDBjLTUgMC05IDItMTMgNS00IDQtNSA4LTUgMTNsMCAzN2MwIDUgMSA5IDUgMTMgNCAzIDggNSAxMyA1bDM2IDBjNSAwIDEwLTIgMTMtNSA0LTQgNi04IDYtMTN6IG0wLTExMGwwLTM3YzAtNS0yLTktNi0xMi0zLTQtOC02LTEzLTZsLTM2IDBjLTUgMC05IDItMTMgNi00IDMtNSA3LTUgMTJsMCAzN2MwIDUgMSA5IDUgMTMgNCAzIDggNSAxMyA1bDM2IDBjNSAwIDEwLTIgMTMtNSA0LTQgNi04IDYtMTN6IG0zNi00NmwwIDM4NGMwIDEzLTQgMjQtMTMgMzMtOSA5LTIwIDEzLTMyIDEzbC00NTggMGMtMTIgMC0yMy00LTMyLTEzLTktOS0xMy0yMC0xMy0zM2wwLTM4NGMwLTEyIDQtMjMgMTMtMzIgOS05IDIwLTEzIDMyLTEzbDQ1OCAwYzEyIDAgMjMgNCAzMiAxMyA5IDkgMTMgMjAgMTMgMzJ6XCJ9fV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwib1wiOlwiY3NzcmVzZXRcIixcInZcIjp7XCJ0YXBcIjpcImRpc21pc3NcIn0sXCJhXCI6e1wiY2xhc3NcIjpbXCJhbnRlbm5hIGFudGVubmEtdGFwLWhlbHBlciBcIix7XCJ0XCI6NCxcImZcIjpbXCJhbnRlbm5hLWhlbHBlci10b3BcIl0sXCJuXCI6NTAsXCJyXCI6XCJwb3NpdGlvblRvcFwifSx7XCJ0XCI6NCxcIm5cIjo1MSxcImZcIjpbXCJhbnRlbm5hLWhlbHBlci1ib3R0b21cIl0sXCJyXCI6XCJwb3NpdGlvblRvcFwifV19LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXRhcC1oZWxwZXItaW5uZXJcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJmXCI6W3tcInRcIjo4LFwiclwiOlwibG9nb1wifSx7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS10YXAtaGVscGVyLXByb21wdFwifSxcImZcIjpbe1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwidGFwX2hlbHBlcl9fcHJvbXB0XFxcIilcIn19XX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXRhcC1oZWxwZXItY2xvc2VcIn0sXCJmXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcInRhcF9oZWxwZXJfX2Nsb3NlXFxcIilcIn19XX1dfV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJvXCI6XCJjc3NyZXNldFwiLFwiYVwiOntcImNsYXNzXCI6W1wiYW50ZW5uYSBhbnRlbm5hLXRleHQtaW5kaWNhdG9yLXdpZGdldCBcIix7XCJ0XCI6NCxcImZcIjpbXCJhbnRlbm5hLW5vdGxvYWRlZFwiXSxcIm5cIjo1MSxcInJcIjpcImNvbnRhaW5lckRhdGEubG9hZGVkXCJ9LFwiIGFudGVubmEtcmVzZXQgXCIse1widFwiOjQsXCJmXCI6W1wiYW50ZW5uYS1oYXNyZWFjdGlvbnNcIl0sXCJuXCI6NTAsXCJ4XCI6e1wiclwiOltcImNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbFwiXSxcInNcIjpcIl8wPjBcIn19LFwiIFwiLHtcInRcIjo0LFwiZlwiOltcImFudGVubmEtc3VwcHJlc3NcIl0sXCJuXCI6NTAsXCJyXCI6XCJjb250YWluZXJEYXRhLnN1cHByZXNzXCJ9LFwiIFwiLHtcInRcIjoyLFwiclwiOlwiZXh0cmFDbGFzc2VzXCJ9XX0sXCJmXCI6W1wiIFwiLHtcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXRleHQtaW5kaWNhdG9yLWlubmVyXCJ9LFwiZlwiOlt7XCJ0XCI6OCxcInJcIjpcImxvZ29cIn0se1widFwiOjQsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXJlYWN0aW9uLXRvdGFsXCJ9LFwib1wiOlwiY3NzcmVzZXRcIixcImZcIjpbe1widFwiOjIsXCJyXCI6XCJjb250YWluZXJEYXRhLnJlYWN0aW9uVG90YWxcIn1dfV0sXCJuXCI6NTAsXCJyXCI6XCJjb250YWluZXJEYXRhLnJlYWN0aW9uVG90YWxcIn1dfV19XX0iXX0=
