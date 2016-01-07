(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/Users/jburns/antenna/rb/static/widget-new/src/js/antenna-app.js":[function(require,module,exports){
if (window.ANTENNAIS || window.antenna || window.AntennaApp) {
    // Protect against multiple instances of this script being added to the page (or this script and engage.js)
    return;
}

var ScriptLoader = require('./script-loader');
var CssLoader = require('./css-loader');
var GroupSettingsLoader = require('./group-settings-loader');
var PageDataLoader = require('./page-data-loader');
var PageScanner = require('./page-scanner');
var Reinitializer = require('./reinitializer');
var XDMAnalytics = require('./xdm-analytics');
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
    XDMLoader.createXDMframe(groupSettings.groupId);
}

function fetchPageData(groupSettings) {
    PageDataLoader.load(groupSettings);
}

function scanPage(groupSettings) {
    PageScanner.scan(groupSettings);
}

function setupReinitializer(groupSettings) {
    Reinitializer.setupReinitialization(groupSettings);
}
},{"./css-loader":"/Users/jburns/antenna/rb/static/widget-new/src/js/css-loader.js","./group-settings-loader":"/Users/jburns/antenna/rb/static/widget-new/src/js/group-settings-loader.js","./page-data-loader":"/Users/jburns/antenna/rb/static/widget-new/src/js/page-data-loader.js","./page-scanner":"/Users/jburns/antenna/rb/static/widget-new/src/js/page-scanner.js","./reinitializer":"/Users/jburns/antenna/rb/static/widget-new/src/js/reinitializer.js","./script-loader":"/Users/jburns/antenna/rb/static/widget-new/src/js/script-loader.js","./utils/xdm-loader":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/xdm-loader.js","./xdm-analytics":"/Users/jburns/antenna/rb/static/widget-new/src/js/xdm-analytics.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/auto-call-to-action.js":[function(require,module,exports){
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
},{"../templates/auto-call-to-action.hbs.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/auto-call-to-action.hbs.html","./svgs":"/Users/jburns/antenna/rb/static/widget-new/src/js/svgs.js","./utils/browser-metrics":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/browser-metrics.js","./utils/jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js","./utils/ractive-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/ractive-provider.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/blocked-reaction-page.js":[function(require,module,exports){
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
},{"../templates/blocked-reaction-page.hbs.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/blocked-reaction-page.hbs.html","./svgs":"/Users/jburns/antenna/rb/static/widget-new/src/js/svgs.js","./utils/ractive-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/ractive-provider.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/call-to-action-counter.js":[function(require,module,exports){
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
},{"../templates/call-to-action-counter.hbs.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/call-to-action-counter.hbs.html","./utils/ractive-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/ractive-provider.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/call-to-action-expanded-reactions.js":[function(require,module,exports){
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
                createdWidgets.teardown();
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
},{"./call-to-action-counter":"/Users/jburns/antenna/rb/static/widget-new/src/js/call-to-action-counter.js","./call-to-action-expanded-reactions":"/Users/jburns/antenna/rb/static/widget-new/src/js/call-to-action-expanded-reactions.js","./call-to-action-label":"/Users/jburns/antenna/rb/static/widget-new/src/js/call-to-action-label.js","./reactions-widget":"/Users/jburns/antenna/rb/static/widget-new/src/js/reactions-widget.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/call-to-action-label.js":[function(require,module,exports){
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

function openShareWindow(url) {

}

//noinspection JSUnresolvedVariable
module.exports = {
    create: createPage
};
},{"../templates/comment-area-partial.hbs.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/comment-area-partial.hbs.html","../templates/confirmation-page.hbs.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/confirmation-page.hbs.html","./comment-area-partial":"/Users/jburns/antenna/rb/static/widget-new/src/js/comment-area-partial.js","./events":"/Users/jburns/antenna/rb/static/widget-new/src/js/events.js","./svgs":"/Users/jburns/antenna/rb/static/widget-new/src/js/svgs.js","./utils/ajax-client":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/ajax-client.js","./utils/jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js","./utils/ractive-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/ractive-provider.js","./utils/urls":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/urls.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/css-loader.js":[function(require,module,exports){
var URLs = require('./utils/urls');

function loadCss() {
    // To make sure none of our content renders on the page before our CSS is loaded, we append a simple inline style
    // element that turns off our elements *before* our CSS links. This exploits the cascade rules - our CSS files appear
    // after the inline style in the document, so they take precedence (and make everything appear) once they're loaded.
    injectCss('.antenna{display:none;}');
    var cssHref = URLs.appServerUrl() + '/static/widget-new/debug/antenna.css'; // TODO this needs a final path. CDN for production and local file for development?
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
},{"./utils/urls":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/urls.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/defaults-page.js":[function(require,module,exports){
var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var AjaxClient = require('./utils/ajax-client');
var Ractive; require('./utils/ractive-provider').onLoad(function(loadedRactive) { Ractive = loadedRactive;});
var ReactionsWidgetLayoutUtils = require('./utils/reactions-widget-layout-utils');
var User = require('./utils/user');

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
    var showProgress = options.showProgress;
    var showLogin = options.showLogin;
    var showBlocked = options.showBlocked;
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
            $(event.target).val('');
            $(rootElement(ractive)).focus();
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
            // TODO handle any errors that occur posting a reaction
            console.log("error posting new reaction: " + message);
        }
    }

    function newCustomReaction() {
        var body = $(ractive.find('.antenna-defaults-footer input')).val().trim();
        if (body !== '') {
            showProgress(); // Show progress for custom reactions because the server might reject them for a number of reasons
            var reactionData = { text: body };
            var reactionProvider = createReactionProvider();
            AjaxClient.postNewReaction(reactionData, containerData, pageData, contentData, success, error);
        }

        function success(reaction) {
            showConfirmation(reactionData, reactionProvider); // TODO: review the reactionProvider in this case
            reaction = PageData.registerReaction(reaction, containerData, pageData);
            reactionProvider.reactionLoaded(reaction);
            Events.postReactionCreated(pageData, containerData, reaction, groupSettings);
        }

        function error(message) {
            var retry = function() {
                AjaxClient.postNewReaction(reactionData, containerData, pageData, contentData, success, error);
            };
            handleNewReactionError(message, retry);
        }
    }

    function handleNewReactionError(message, retryCallback) {
        if (message.indexOf('sign in required for organic reactions') !== -1) {
            showLogin(retryCallback);
        } else if (message.indexOf('Group has blocked this tag.') !== -1) {
            showBlocked();
        } else if (isTokenError(message)) {
            User.reAuthorizeUser(function(hasNewToken) {
                if (hasNewToken) {
                    retryCallback();
                } else {
                    showLogin(retryCallback);
                }
            });
        } else {
            // TODO error handling
            // TODO: show some kind of generic error page
            console.log("error posting new reaction: " + message);
        }
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
},{"../templates/defaults-page.hbs.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/defaults-page.hbs.html","./events":"/Users/jburns/antenna/rb/static/widget-new/src/js/events.js","./page-data":"/Users/jburns/antenna/rb/static/widget-new/src/js/page-data.js","./utils/ajax-client":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/ajax-client.js","./utils/jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js","./utils/ractive-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/ractive-provider.js","./utils/reactions-widget-layout-utils":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/reactions-widget-layout-utils.js","./utils/user":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/user.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/events.js":[function(require,module,exports){
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
},{"./utils/ajax-client":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/ajax-client.js","./utils/browser-metrics":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/browser-metrics.js","./utils/user":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/user.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/group-settings-loader.js":[function(require,module,exports){
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
    image_attribute: 'content', // TODO: review what this should be (not from engage_full),
    querystring_content: false,
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

    function dataOrDeprecated(key, deprecatedKey) {
        return function() {
            return data(key)() || data(deprecatedKey)();
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
        groupName: data('name'),
        activeSections: data('active_sections'),
        url: {
            ignoreSubdomain: data('ignore_subdomain'),
            includeQueryString: data('querystring_content'),
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
        exclusionSelector: dataOrDeprecated('no_ant', 'no_readr'),
        language: data('language'),
        twitterAccount: data('twitter')
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
                return HashedElements.getElement(containerHash, pageData.pageHash) !== undefined;
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
        var element = HashedElements.getElement(locationData.containerHash, pageData.pageHash);
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
},{"../templates/locations-page.hbs.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/locations-page.hbs.html","./events":"/Users/jburns/antenna/rb/static/widget-new/src/js/events.js","./hashed-elements":"/Users/jburns/antenna/rb/static/widget-new/src/js/hashed-elements.js","./page-data":"/Users/jburns/antenna/rb/static/widget-new/src/js/page-data.js","./svgs":"/Users/jburns/antenna/rb/static/widget-new/src/js/svgs.js","./utils/jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js","./utils/ractive-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/ractive-provider.js","./utils/range":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/range.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/login-page.js":[function(require,module,exports){
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
},{"../templates/login-page.hbs.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/login-page.hbs.html","./svgs":"/Users/jburns/antenna/rb/static/widget-new/src/js/svgs.js","./utils/ractive-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/ractive-provider.js","./utils/urls":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/urls.js","./utils/xdm-client":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/xdm-client.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/media-indicator-widget.js":[function(require,module,exports){
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
},{"./events":"/Users/jburns/antenna/rb/static/widget-new/src/js/events.js","./hashed-elements":"/Users/jburns/antenna/rb/static/widget-new/src/js/hashed-elements.js","./utils/jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/page-scanner.js":[function(require,module,exports){
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
            var increment = 1;
            while (HashedElements.getElement(hash, pageData.pageHash)) {
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
},{"../templates/popup-widget.hbs.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/popup-widget.hbs.html","./svgs":"/Users/jburns/antenna/rb/static/widget-new/src/js/svgs.js","./utils/jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js","./utils/ractive-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/ractive-provider.js","./utils/transition-util":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/transition-util.js","./utils/widget-bucket":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/widget-bucket.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/reactions-page.js":[function(require,module,exports){
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
var WidgetBucket = require('./utils/widget-bucket');

var BlockedReactionPage = require('./blocked-reaction-page');
var CommentsPage = require('./comments-page');
var ConfirmationPage = require('./confirmation-page');
var DefaultsPage = require('./defaults-page');
var Events = require('./events');
var LocationsPage = require('./locations-page');
var LoginPage = require('./login-page');
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
            showProgress: showProgressPage,
            showLogin: function(retryCallback) {
                // Beware: this function references the 'page' variable which isn't set until after DefaultsPage.create() returns.
                showLoginPage(page.selector, retryCallback);
            },
            showBlocked: function() {
                // Beware: this function references the 'page' variable which isn't set until after DefaultsPage.create() returns.
                showBlockedReactionPage(page.selector);
            },
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

    // Shows the login page, with a prompt to go Back to the page specified by the given page selector.
    function showLoginPage(backPageSelector, retryCallback) {
        setWindowTitle(Messages.getMessage('reactions-widget_title_signin'));
        var options = {
            element: pageContainer(ractive),
            groupSettings: groupSettings,
            goBack: function() {
                setWindowTitle(Messages.getMessage('reactions-widget_title'));
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
        setWindowTitle(Messages.getMessage('reactions-widget_title_blocked'));
        var options = {
            element: pageContainer(ractive),
            groupSettings: groupSettings,
            goBack: function() {
                setWindowTitle(Messages.getMessage('reactions-widget_title'));
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
            $page.focus();
        });
    } else {
        $page.addClass('antenna-page-active');
        $rootElement.find('.antenna-page').not(pageSelector).removeClass('antenna-page-active');
        $page.focus();
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
        var remainingPages = [];
        for (var i = 0; i < pages.length - 1; i++) {
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

            Range.clearHighlights();
            for (var i = 0; i < pages.length; i++) {
                pages[i].teardown();
            }
            ractive.teardown();
        });
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
},{"../templates/reactions-widget.hbs.html":"/Users/jburns/antenna/rb/static/widget-new/src/templates/reactions-widget.hbs.html","./blocked-reaction-page":"/Users/jburns/antenna/rb/static/widget-new/src/js/blocked-reaction-page.js","./comments-page":"/Users/jburns/antenna/rb/static/widget-new/src/js/comments-page.js","./confirmation-page":"/Users/jburns/antenna/rb/static/widget-new/src/js/confirmation-page.js","./defaults-page":"/Users/jburns/antenna/rb/static/widget-new/src/js/defaults-page.js","./events":"/Users/jburns/antenna/rb/static/widget-new/src/js/events.js","./locations-page":"/Users/jburns/antenna/rb/static/widget-new/src/js/locations-page.js","./login-page":"/Users/jburns/antenna/rb/static/widget-new/src/js/login-page.js","./page-data":"/Users/jburns/antenna/rb/static/widget-new/src/js/page-data.js","./reactions-page":"/Users/jburns/antenna/rb/static/widget-new/src/js/reactions-page.js","./svgs":"/Users/jburns/antenna/rb/static/widget-new/src/js/svgs.js","./utils/ajax-client":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/ajax-client.js","./utils/jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js","./utils/messages":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/messages.js","./utils/moveable":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/moveable.js","./utils/ractive-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/ractive-provider.js","./utils/range":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/range.js","./utils/touch-support":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/touch-support.js","./utils/transition-util":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/transition-util.js","./utils/widget-bucket":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/widget-bucket.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/reinitializer.js":[function(require,module,exports){
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
},{"./group-settings":"/Users/jburns/antenna/rb/static/widget-new/src/js/group-settings.js","./hashed-elements":"/Users/jburns/antenna/rb/static/widget-new/src/js/hashed-elements.js","./page-data":"/Users/jburns/antenna/rb/static/widget-new/src/js/page-data.js","./page-data-loader":"/Users/jburns/antenna/rb/static/widget-new/src/js/page-data-loader.js","./page-scanner":"/Users/jburns/antenna/rb/static/widget-new/src/js/page-scanner.js","./popup-widget":"/Users/jburns/antenna/rb/static/widget-new/src/js/popup-widget.js","./reactions-widget":"/Users/jburns/antenna/rb/static/widget-new/src/js/reactions-widget.js","./utils/mutation-observer":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/mutation-observer.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/script-loader.js":[function(require,module,exports){
var RactiveProvider = require('./utils/ractive-provider');
var RangyProvider = require('./utils/rangy-provider');
var JQueryProvider = require('./utils/jquery-provider');
var AppMode = require('./utils/app-mode');
var URLs = require('./utils/urls');

var scripts = [
    {src: '//cdnjs.cloudflare.com/ajax/libs/jquery/2.1.4/jquery.min.js', callback: JQueryProvider.loaded},
    // TODO minify our compiled Ractive and host it on a CDN
    {src: URLs.appServerUrl() + '/static/js/cdn/ractive/0.7.3/ractive.runtime.js', callback: RactiveProvider.loaded, aboutToLoad: RactiveProvider.aboutToLoad},
    // TODO minify our compiled Randy and host it on a CDN
    {src: URLs.appServerUrl() + '/static/widget-new/lib/rangy-compiled.js', callback: RangyProvider.loaded, aboutToLoad: RangyProvider.aboutToLoad}
];
if (AppMode.offline) {
    // Use the offline versions of the libraries for development.
    scripts = [
        {src: URLs.appServerUrl() + '/static/js/cdn/jquery/2.1.4/jquery.js', callback: JQueryProvider.loaded},
        {src: URLs.appServerUrl() + '/static/js/cdn/ractive/0.7.3/ractive.runtime.js', callback: RactiveProvider.loaded, aboutToLoad: RactiveProvider.aboutToLoad},
        {src: URLs.appServerUrl() + '/static/widget-new/lib/rangy-compiled.js', callback: RangyProvider.loaded, aboutToLoad: RangyProvider.aboutToLoad}
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
    var tapSupport = TouchSupport.setupTap($rootElement.get(0), function(event) {
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
    User.fetchUser(function(userInfo) {
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
    User.fetchUser(function(userInfo) {
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
},{"./app-mode":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/app-mode.js","./jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js","./urls":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/urls.js","./user":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/user.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/app-mode.js":[function(require,module,exports){
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
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/messages-en.js":[function(require,module,exports){
//noinspection JSUnresolvedVariable
module.exports = {
    'summary-widget_reactions': 'Reactions',
    'summary-widget_reactions_one': '1 Reaction',
    'summary-widget_reactions_many': '{0} Reactions',

    'reactions-widget_title': 'Reactions',
    'reactions-widget_title_thanks': 'Thanks for your reaction!',
    'reactions-widget_title_signin': 'Sign in Required',
    'reactions-widget_title_blocked': 'Blocked Reaction',

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
    'call-to-action-label_responses_many': '{0} Responses',

    'login-page_back': 'Back',

    'blocked-page_back': 'Back'
};
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/messages-es.js":[function(require,module,exports){
//noinspection JSUnresolvedVariable
module.exports = {
    'summary-widget_reactions': "Reacciones",
    'summary-widget_reactions_one': "1 Reacción",
    'summary-widget_reactions_many': "{0} Reacciones",

    'reactions-widget_title': "Reacciones",
    'reactions-widget_title_thanks': 'Gracias por tu reacción!',
    'reactions-widget_title_signin': 'Sign in Required', // TODO: need a translation
    'reactions-widget_title_blocked': 'Blocked Reaction', // TODO: need a translation

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
    'call-to-action-label_responses_many': '{0} Respuestas', // TODO

    'login-page_back': 'Cerrar', // TODO: need a translation for "Back",

    'blocked-page_back': 'Cerrar' // TODO: need a translation for "Back",
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
},{"./callback-support":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/callback-support.js","./jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/jquery-provider.js","./range":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/range.js","./widget-bucket":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/widget-bucket.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/page-utils.js":[function(require,module,exports){
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
    highlight: highlightLocation,
    HIGHLIGHT_SELECTOR: '.' + highlightClass
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
var TEST_SERVER_URL = window.location.protocol + '//localhost:3001';

var PROD_EVENT_SERVER_URL = window.location.protocol + '//events.readrboard.com'; // TODO: update to events.antenna.is
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

},{"./app-mode":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/app-mode.js","./url-constants":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/url-constants.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/user.js":[function(require,module,exports){
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
},{"./app-mode":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/app-mode.js","./xdm-client":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/xdm-client.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/widget-bucket.js":[function(require,module,exports){
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
},{"./callback-support":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/callback-support.js","./xdm-loader":"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/xdm-loader.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/utils/xdm-loader.js":[function(require,module,exports){
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
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/templates/blocked-reaction-page.hbs.html":[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna-page antenna-blocked-page"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-body"},"f":[{"t":7,"e":"div","v":{"tap":"back"},"a":{"class":"antenna-blocked-back"},"f":[{"t":8,"r":"left"},{"t":2,"x":{"r":["getMessage"],"s":"_0(\"blocked-page_back\")"}}]}," ",{"t":7,"e":"div","a":{"class":"antenna-blocked-body"},"f":[{"t":7,"e":"div","a":{"class":"antenna-blocked-message"},"f":["This site has blocked some or all of the text in that reaction."]}," ",{"t":7,"e":"div","a":{"class":"antenna-blocked-message"},"f":["Please try something that will be more appropriate for this community."]}]}]}]}]}
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
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna-page antenna-confirmation-page"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-body"},"f":[{"t":7,"e":"div","a":{"class":"antenna-comment-reaction"},"f":[{"t":2,"r":"text"}]}," ",{"t":8,"r":"commentArea"}]}," ",{"t":7,"e":"div","a":{"class":"antenna-footer antenna-confirm-footer"},"f":[{"t":7,"e":"span","a":{"class":"antenna-share"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"confirmation-page_share\")"}}," ",{"t":7,"e":"a","v":{"tap":"share-facebook"},"a":{"href":"//facebook.com"},"f":[{"t":8,"r":"facebookIcon"}]}," ",{"t":7,"e":"a","v":{"tap":"share-twitter"},"a":{"href":"//twitter.com"},"f":[{"t":8,"r":"twitterIcon"}]}]}]}]}]}
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/templates/defaults-page.hbs.html":[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","v":{"keydown":"pagekeydown"},"a":{"class":"antenna-page antenna-defaults-page","tabindex":"0"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-body"},"f":[{"t":4,"f":[{"t":7,"e":"div","v":{"tap":"newreaction"},"a":{"class":["antenna-reaction ",{"t":2,"x":{"r":["defaultLayoutClass","index"],"s":"_0(_1)"}}]},"f":[{"t":7,"e":"div","a":{"class":"antenna-reaction-box"},"f":[{"t":7,"e":"div","a":{"class":"antenna-reaction-text"},"o":"sizetofit","f":[{"t":2,"r":"./text"}]}]}]}],"i":"index","r":"defaultReactions"}]}," ",{"t":7,"e":"div","a":{"class":"antenna-footer antenna-defaults-footer"},"f":[{"t":7,"e":"div","a":{"class":"antenna-custom-area"},"f":[{"t":7,"e":"input","v":{"focus":"customfocus","keydown":"inputkeydown","blur":"customblur"},"a":{"value":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"defaults-page_add\")"}}],"maxlength":"25"}}," ",{"t":7,"e":"button","v":{"tap":"newcustom"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"defaults-page_ok\")"}}]}]}," ",{"t":7,"e":"div","a":{"class":"antenna-text-logo"},"f":[{"t":7,"e":"a","a":{"href":"//www.antenna.is"},"f":["Antenna"]}]}]}]}]}
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/templates/locations-page.hbs.html":[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna-page antenna-locations-page"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-body"},"f":[{"t":7,"e":"div","v":{"tap":"back"},"a":{"class":"antenna-locations-back"},"f":[{"t":8,"r":"left"},{"t":2,"x":{"r":["getMessage"],"s":"_0(\"locations-page_back\")"}}]}," ",{"t":7,"e":"table","a":{"class":"antenna-locations-table"},"f":[{"t":4,"f":[{"t":7,"e":"tr","a":{"class":"antenna-locations-content-row"},"f":[{"t":7,"e":"td","a":{"class":"antenna-locations-count-cell"},"f":[{"t":4,"f":[{"t":3,"x":{"r":["getMessage"],"s":"_0(\"locations-page_count_one\")"}}],"n":50,"x":{"r":["pageReactionCount"],"s":"_0===1"}},{"t":4,"n":51,"f":[{"t":3,"x":{"r":["getMessage","pageReactionCount"],"s":"_0(\"locations-page_count_many\",[_1])"}}],"x":{"r":["pageReactionCount"],"s":"_0===1"}}]}," ",{"t":7,"e":"td","a":{"class":"antenna-locations-page-body"},"f":[{"t":2,"x":{"r":["getMessage"],"s":"_0(\"locations-page_pagelevel\")"}}]}]}],"n":50,"r":"pageReactionCount"}," ",{"t":4,"f":[{"t":4,"f":[" ",{"t":7,"e":"tr","v":{"tap":"reveal"},"a":{"class":["antenna-locations-content-row ",{"t":4,"f":["antenna-locate"],"n":50,"x":{"r":["canLocate","./containerHash"],"s":"_0(_1)"}}]},"f":[{"t":7,"e":"td","a":{"class":"antenna-locations-count-cell"},"f":[{"t":4,"f":[{"t":3,"x":{"r":["getMessage"],"s":"_0(\"locations-page_count_one\")"}}],"n":50,"x":{"r":["./count"],"s":"_0===1"}},{"t":4,"n":51,"f":[{"t":3,"x":{"r":["getMessage","./count"],"s":"_0(\"locations-page_count_many\",[_1])"}}],"x":{"r":["./count"],"s":"_0===1"}}]}," ",{"t":4,"f":[{"t":7,"e":"td","a":{"class":"antenna-locations-text-body"},"f":[{"t":2,"r":"./body"}]}],"n":50,"x":{"r":["./kind"],"s":"_0===\"txt\""}},{"t":4,"n":51,"f":[{"t":4,"n":50,"x":{"r":["./kind"],"s":"_0===\"img\""},"f":[{"t":7,"e":"td","a":{"class":"antenna-locations-image-body"},"f":[{"t":7,"e":"img","a":{"src":[{"t":2,"r":"./body"}]}}]}]},{"t":4,"n":50,"x":{"r":["./kind"],"s":"(!(_0===\"img\"))&&(_0===\"med\")"},"f":[" ",{"t":7,"e":"td","a":{"class":"antenna-locations-media-body"},"f":[{"t":7,"e":"img","a":{"src":"/static/widget/images/video_icon.png"}}," Video"]}]},{"t":4,"n":50,"x":{"r":["./kind"],"s":"(!(_0===\"img\"))&&(!(_0===\"med\"))"},"f":[" "]}],"x":{"r":["./kind"],"s":"_0===\"txt\""}}]}],"n":50,"x":{"r":["./kind"],"s":"_0!==\"pag\""}}],"i":"id","r":"locationData"}]}]}]}]}
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/templates/login-page.hbs.html":[function(require,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"div","a":{"class":"antenna-page antenna-login-page"},"o":"cssreset","f":[{"t":7,"e":"div","a":{"class":"antenna-body"},"f":[{"t":7,"e":"div","v":{"tap":"back"},"a":{"class":"antenna-login-back"},"f":[{"t":8,"r":"left"},{"t":2,"x":{"r":["getMessage"],"s":"_0(\"login-page_back\")"}}]}," ",{"t":7,"e":"div","a":{"class":"antenna-login-container"},"f":[{"t":7,"e":"iframe","a":{"class":"antenna-login-iframe","src":[{"t":2,"r":"loginPageUrl"}],"seamless":0}}]}]}]}]}
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
},{}]},{},["/Users/jburns/antenna/rb/static/widget-new/src/js/antenna-app.js","/Users/jburns/antenna/rb/static/widget-new/src/js/auto-call-to-action.js","/Users/jburns/antenna/rb/static/widget-new/src/js/blocked-reaction-page.js","/Users/jburns/antenna/rb/static/widget-new/src/js/call-to-action-counter.js","/Users/jburns/antenna/rb/static/widget-new/src/js/call-to-action-expanded-reactions.js","/Users/jburns/antenna/rb/static/widget-new/src/js/call-to-action-indicator.js","/Users/jburns/antenna/rb/static/widget-new/src/js/call-to-action-label.js","/Users/jburns/antenna/rb/static/widget-new/src/js/comment-area-partial.js","/Users/jburns/antenna/rb/static/widget-new/src/js/comments-page.js","/Users/jburns/antenna/rb/static/widget-new/src/js/confirmation-page.js","/Users/jburns/antenna/rb/static/widget-new/src/js/css-loader.js","/Users/jburns/antenna/rb/static/widget-new/src/js/defaults-page.js","/Users/jburns/antenna/rb/static/widget-new/src/js/events.js","/Users/jburns/antenna/rb/static/widget-new/src/js/group-settings-loader.js","/Users/jburns/antenna/rb/static/widget-new/src/js/group-settings.js","/Users/jburns/antenna/rb/static/widget-new/src/js/hashed-elements.js","/Users/jburns/antenna/rb/static/widget-new/src/js/locations-page.js","/Users/jburns/antenna/rb/static/widget-new/src/js/login-page.js","/Users/jburns/antenna/rb/static/widget-new/src/js/media-indicator-widget.js","/Users/jburns/antenna/rb/static/widget-new/src/js/page-data-loader.js","/Users/jburns/antenna/rb/static/widget-new/src/js/page-data.js","/Users/jburns/antenna/rb/static/widget-new/src/js/page-scanner.js","/Users/jburns/antenna/rb/static/widget-new/src/js/popup-widget.js","/Users/jburns/antenna/rb/static/widget-new/src/js/reactions-page.js","/Users/jburns/antenna/rb/static/widget-new/src/js/reactions-widget.js","/Users/jburns/antenna/rb/static/widget-new/src/js/reinitializer.js","/Users/jburns/antenna/rb/static/widget-new/src/js/script-loader.js","/Users/jburns/antenna/rb/static/widget-new/src/js/summary-widget.js","/Users/jburns/antenna/rb/static/widget-new/src/js/svgs.js","/Users/jburns/antenna/rb/static/widget-new/src/js/text-indicator-widget.js","/Users/jburns/antenna/rb/static/widget-new/src/js/text-reactions.js","/Users/jburns/antenna/rb/static/widget-new/src/js/xdm-analytics.js","/Users/jburns/antenna/rb/static/widget-new/src/templates/auto-call-to-action.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/blocked-reaction-page.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/call-to-action-counter.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/call-to-action-expanded-reactions.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/call-to-action-label.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/comment-area-partial.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/comments-page.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/confirmation-page.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/defaults-page.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/locations-page.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/login-page.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/media-indicator-widget.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/popup-widget.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/reactions-page.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/reactions-widget.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/summary-widget.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/svg-comments.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/svg-facebook.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/svg-left.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/svg-location.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/svg-logo-selectable.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/svg-logo.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/svg-twitter.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/svgs.hbs.html","/Users/jburns/antenna/rb/static/widget-new/src/templates/text-indicator-widget.hbs.html"])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvYW50ZW5uYS1hcHAuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvYXV0by1jYWxsLXRvLWFjdGlvbi5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9ibG9ja2VkLXJlYWN0aW9uLXBhZ2UuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvY2FsbC10by1hY3Rpb24tY291bnRlci5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9jYWxsLXRvLWFjdGlvbi1leHBhbmRlZC1yZWFjdGlvbnMuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvY2FsbC10by1hY3Rpb24taW5kaWNhdG9yLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL2NhbGwtdG8tYWN0aW9uLWxhYmVsLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL2NvbW1lbnQtYXJlYS1wYXJ0aWFsLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL2NvbW1lbnRzLXBhZ2UuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvY29uZmlybWF0aW9uLXBhZ2UuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvY3NzLWxvYWRlci5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9kZWZhdWx0cy1wYWdlLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL2V2ZW50cy5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9ncm91cC1zZXR0aW5ncy1sb2FkZXIuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvZ3JvdXAtc2V0dGluZ3MuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvaGFzaGVkLWVsZW1lbnRzLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL2xvY2F0aW9ucy1wYWdlLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL2xvZ2luLXBhZ2UuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvbWVkaWEtaW5kaWNhdG9yLXdpZGdldC5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9wYWdlLWRhdGEtbG9hZGVyLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3BhZ2UtZGF0YS5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9wYWdlLXNjYW5uZXIuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvcG9wdXAtd2lkZ2V0LmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3JlYWN0aW9ucy1wYWdlLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3JlYWN0aW9ucy13aWRnZXQuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvcmVpbml0aWFsaXplci5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy9zY3JpcHQtbG9hZGVyLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3N1bW1hcnktd2lkZ2V0LmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3N2Z3MuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdGV4dC1pbmRpY2F0b3Itd2lkZ2V0LmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3RleHQtcmVhY3Rpb25zLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL2FqYXgtY2xpZW50LmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL2FwcC1tb2RlLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL2Jyb3dzZXItbWV0cmljcy5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9jYWxsYmFjay1zdXBwb3J0LmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL2hhc2guanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvanF1ZXJ5LXByb3ZpZGVyLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL21kNS5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9tZXNzYWdlcy1lbi5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9tZXNzYWdlcy1lcy5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9tZXNzYWdlcy5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9tb3ZlYWJsZS5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9tdXRhdGlvbi1vYnNlcnZlci5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9wYWdlLXV0aWxzLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL3JhY3RpdmUtZXZlbnRzLXRhcC5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy9yYWN0aXZlLXByb3ZpZGVyLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL3JhbmdlLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL3Jhbmd5LXByb3ZpZGVyLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL3JlYWN0aW9ucy13aWRnZXQtbGF5b3V0LXV0aWxzLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL3Rocm90dGxlZC1ldmVudHMuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvdG91Y2gtc3VwcG9ydC5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy90cmFuc2l0aW9uLXV0aWwuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvdXJsLWNvbnN0YW50cy5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy91cmxzLmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL3VzZXIuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMvdXRpbHMvd2lkZ2V0LWJ1Y2tldC5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy9qcy91dGlscy94ZG0tY2xpZW50LmpzIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL2pzL3V0aWxzL3hkbS1sb2FkZXIuanMiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvanMveGRtLWFuYWx5dGljcy5qcyIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvYXV0by1jYWxsLXRvLWFjdGlvbi5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvYmxvY2tlZC1yZWFjdGlvbi1wYWdlLmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9jYWxsLXRvLWFjdGlvbi1jb3VudGVyLmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9jYWxsLXRvLWFjdGlvbi1leHBhbmRlZC1yZWFjdGlvbnMuaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL2NhbGwtdG8tYWN0aW9uLWxhYmVsLmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9jb21tZW50LWFyZWEtcGFydGlhbC5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvY29tbWVudHMtcGFnZS5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvY29uZmlybWF0aW9uLXBhZ2UuaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL2RlZmF1bHRzLXBhZ2UuaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL2xvY2F0aW9ucy1wYWdlLmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9sb2dpbi1wYWdlLmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9tZWRpYS1pbmRpY2F0b3Itd2lkZ2V0Lmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9wb3B1cC13aWRnZXQuaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL3JlYWN0aW9ucy1wYWdlLmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9yZWFjdGlvbnMtd2lkZ2V0Lmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9zdW1tYXJ5LXdpZGdldC5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvc3ZnLWNvbW1lbnRzLmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9zdmctZmFjZWJvb2suaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL3N2Zy1sZWZ0Lmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9zdmctbG9jYXRpb24uaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL3N2Zy1sb2dvLXNlbGVjdGFibGUuaGJzLmh0bWwiLCIuLi8uLi9yYi9zdGF0aWMvd2lkZ2V0LW5ldy9zcmMvdGVtcGxhdGVzL3N2Zy1sb2dvLmhicy5odG1sIiwiLi4vLi4vcmIvc3RhdGljL3dpZGdldC1uZXcvc3JjL3RlbXBsYXRlcy9zdmctdHdpdHRlci5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvc3Zncy5oYnMuaHRtbCIsIi4uLy4uL3JiL3N0YXRpYy93aWRnZXQtbmV3L3NyYy90ZW1wbGF0ZXMvdGV4dC1pbmRpY2F0b3Itd2lkZ2V0Lmhicy5odG1sIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0UUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvT0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDalNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdFVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUEiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiaWYgKHdpbmRvdy5BTlRFTk5BSVMgfHwgd2luZG93LmFudGVubmEgfHwgd2luZG93LkFudGVubmFBcHApIHtcbiAgICAvLyBQcm90ZWN0IGFnYWluc3QgbXVsdGlwbGUgaW5zdGFuY2VzIG9mIHRoaXMgc2NyaXB0IGJlaW5nIGFkZGVkIHRvIHRoZSBwYWdlIChvciB0aGlzIHNjcmlwdCBhbmQgZW5nYWdlLmpzKVxuICAgIHJldHVybjtcbn1cblxudmFyIFNjcmlwdExvYWRlciA9IHJlcXVpcmUoJy4vc2NyaXB0LWxvYWRlcicpO1xudmFyIENzc0xvYWRlciA9IHJlcXVpcmUoJy4vY3NzLWxvYWRlcicpO1xudmFyIEdyb3VwU2V0dGluZ3NMb2FkZXIgPSByZXF1aXJlKCcuL2dyb3VwLXNldHRpbmdzLWxvYWRlcicpO1xudmFyIFBhZ2VEYXRhTG9hZGVyID0gcmVxdWlyZSgnLi9wYWdlLWRhdGEtbG9hZGVyJyk7XG52YXIgUGFnZVNjYW5uZXIgPSByZXF1aXJlKCcuL3BhZ2Utc2Nhbm5lcicpO1xudmFyIFJlaW5pdGlhbGl6ZXIgPSByZXF1aXJlKCcuL3JlaW5pdGlhbGl6ZXInKTtcbnZhciBYRE1BbmFseXRpY3MgPSByZXF1aXJlKCcuL3hkbS1hbmFseXRpY3MnKTtcbnZhciBYRE1Mb2FkZXIgPSByZXF1aXJlKCcuL3V0aWxzL3hkbS1sb2FkZXInKTtcblxud2luZG93LkFudGVubmFBcHAgPSB7IC8vIFRPRE8gZmxlc2ggb3V0IG91ciBkZXNpcmVkIEFQSVxuICAgIHJlaW5pdGlhbGl6ZTogUmVpbml0aWFsaXplci5yZWluaXRpYWxpemVBbGxcbiAgICAvLyB0ZWFyZG93bj9cbiAgICAvLyB0cmFjZT9cbiAgICAvLyBkZWJ1Zz9cbiAgICAvLyBwYWdlZGF0YT9cbiAgICAvLyBncm91cHNldHRpbmdzP1xuICAgIC8vIG5lZWQgdG8gbWFrZSBzdXJlIG90aGVycyAoZS5nLiBtYWxpY2lvdXMgc2NyaXB0cykgY2FuJ3Qgd3JpdGUgZGF0YVxufTtcblxuLy8gU3RlcCAxIC0ga2ljayBvZmYgdGhlIGFzeW5jaHJvbm91cyBsb2FkaW5nIG9mIHRoZSBKYXZhc2NyaXB0IGFuZCBDU1Mgd2UgbmVlZC5cbkNzc0xvYWRlci5sb2FkKCk7IC8vIEluamVjdCB0aGUgQ1NTIGZpcnN0IGJlY2F1c2Ugd2UgbWF5IHNvb24gYXBwZW5kIG1vcmUgYXN5bmNocm9ub3VzbHksIGluIHRoZSBncm91cFNldHRpbmdzIGNhbGxiYWNrLCBhbmQgd2Ugd2FudCB0aGF0IENTUyB0byBiZSBsb3dlciBpbiB0aGUgZG9jdW1lbnQuXG5TY3JpcHRMb2FkZXIubG9hZChzY3JpcHRMb2FkZWQpO1xuXG5mdW5jdGlvbiBzY3JpcHRMb2FkZWQoKSB7XG4gICAgLy8gU3RlcCAyIC0gT25jZSB3ZSBoYXZlIG91ciByZXF1aXJlZCBzY3JpcHRzLCBmZXRjaCB0aGUgZ3JvdXAgc2V0dGluZ3MgZnJvbSB0aGUgc2VydmVyXG4gICAgR3JvdXBTZXR0aW5nc0xvYWRlci5sb2FkKGZ1bmN0aW9uKGdyb3VwU2V0dGluZ3MpIHtcbiAgICAgICAgLy8gU3RlcCAzIC0gT25jZSB3ZSBoYXZlIHRoZSBzZXR0aW5ncywgd2UgY2FuIGtpY2sgb2ZmIGEgY291cGxlIHRoaW5ncyBpbiBwYXJhbGxlbDpcbiAgICAgICAgLy9cbiAgICAgICAgLy8gLS0gaW5qZWN0IGFueSBjdXN0b20gQ1NTIGZyb20gdGhlIGdyb3VwIHNldHRpbmdzXG4gICAgICAgIC8vIC0tIGNyZWF0ZSB0aGUgaGlkZGVuIGlmcmFtZSB3ZSB1c2UgZm9yIGNyb3NzLWRvbWFpbiBjb29raWVzIChwcmltYXJpbHkgdXNlciBsb2dpbilcbiAgICAgICAgLy8gLS0gc3RhcnQgZmV0Y2hpbmcgdGhlIHBhZ2UgZGF0YVxuICAgICAgICAvLyAtLSBzdGFydCBoYXNoaW5nIHRoZSBwYWdlIGFuZCBpbnNlcnRpbmcgdGhlIGFmZm9yZGFuY2VzIChpbiB0aGUgZW1wdHkgc3RhdGUpXG4gICAgICAgIC8vXG4gICAgICAgIC8vIEFzIHRoZSBwYWdlIGlzIHNjYW5uZWQsIHRoZSB3aWRnZXRzIGFyZSBjcmVhdGVkIGFuZCBib3VuZCB0byB0aGUgcGFnZSBkYXRhIHRoYXQgY29tZXMgaW4uXG4gICAgICAgIGluaXRDdXN0b21DU1MoZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIGluaXRYZG1GcmFtZShncm91cFNldHRpbmdzKTtcbiAgICAgICAgZmV0Y2hQYWdlRGF0YShncm91cFNldHRpbmdzKTtcbiAgICAgICAgc2NhblBhZ2UoZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIHNldHVwUmVpbml0aWFsaXplcihncm91cFNldHRpbmdzKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gaW5pdEN1c3RvbUNTUyhncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGN1c3RvbUNTUyA9IGdyb3VwU2V0dGluZ3MuY3VzdG9tQ1NTKCk7XG4gICAgaWYgKGN1c3RvbUNTUykge1xuICAgICAgICBDc3NMb2FkZXIuaW5qZWN0KGN1c3RvbUNTUyk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBpbml0WGRtRnJhbWUoZ3JvdXBTZXR0aW5ncykge1xuICAgIFhETUFuYWx5dGljcy5zdGFydCgpOyAvLyBUaGUgWERNIGlmcmFtZSBoYXMgYSBudW1iZXIgb2YgbWVzc2FnZXMgaXQgZmlyZXMgb24gbG9hZCByZWxhdGVkIHRvIGFuYWx5dGljcy4gU3RhcnQgbGlzdGVuaW5nLlxuICAgIFhETUxvYWRlci5jcmVhdGVYRE1mcmFtZShncm91cFNldHRpbmdzLmdyb3VwSWQpO1xufVxuXG5mdW5jdGlvbiBmZXRjaFBhZ2VEYXRhKGdyb3VwU2V0dGluZ3MpIHtcbiAgICBQYWdlRGF0YUxvYWRlci5sb2FkKGdyb3VwU2V0dGluZ3MpO1xufVxuXG5mdW5jdGlvbiBzY2FuUGFnZShncm91cFNldHRpbmdzKSB7XG4gICAgUGFnZVNjYW5uZXIuc2Nhbihncm91cFNldHRpbmdzKTtcbn1cblxuZnVuY3Rpb24gc2V0dXBSZWluaXRpYWxpemVyKGdyb3VwU2V0dGluZ3MpIHtcbiAgICBSZWluaXRpYWxpemVyLnNldHVwUmVpbml0aWFsaXphdGlvbihncm91cFNldHRpbmdzKTtcbn0iLCJ2YXIgJDsgcmVxdWlyZSgnLi91dGlscy9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciBCcm93c2VyTWV0cmljcyA9IHJlcXVpcmUoJy4vdXRpbHMvYnJvd3Nlci1tZXRyaWNzJyk7XG52YXIgUmFjdGl2ZTsgcmVxdWlyZSgnLi91dGlscy9yYWN0aXZlLXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGxvYWRlZFJhY3RpdmUpIHsgUmFjdGl2ZT1sb2FkZWRSYWN0aXZlOyB9KTtcbnZhciBTVkdzID0gcmVxdWlyZSgnLi9zdmdzJyk7XG5cbmZ1bmN0aW9uIGNyZWF0ZUNhbGxUb0FjdGlvbihhbnRJdGVtSWQsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIHJhY3RpdmUgPSBSYWN0aXZlKHtcbiAgICAgICAgZWw6ICQoJzxkaXY+JyksXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIGFudEl0ZW1JZDogYW50SXRlbUlkLFxuICAgICAgICAgICAgZXhwYW5kUmVhY3Rpb25zOiBzaG91bGRFeHBhbmRSZWFjdGlvbnMoZ3JvdXBTZXR0aW5ncylcbiAgICAgICAgfSxcbiAgICAgICAgdGVtcGxhdGU6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9hdXRvLWNhbGwtdG8tYWN0aW9uLmhicy5odG1sJyksXG4gICAgICAgIHBhcnRpYWxzOiB7XG4gICAgICAgICAgICBsb2dvOiBTVkdzLmxvZ29cbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiB7XG4gICAgICAgIGVsZW1lbnQ6ICQocmFjdGl2ZS5maW5kKCcuYW50ZW5uYS1hdXRvLWN0YScpKSxcbiAgICAgICAgdGVhcmRvd246IGZ1bmN0aW9uKCkgeyByYWN0aXZlLnRlYXJkb3duKCk7IH1cbiAgICB9O1xufVxuXG5mdW5jdGlvbiBzaG91bGRFeHBhbmRSZWFjdGlvbnMoZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBzZXR0aW5nID0gZ3JvdXBTZXR0aW5ncy5nZW5lcmF0ZWRDdGFFeHBhbmRlZCgpOyAvLyBWYWx1ZXMgYXJlICdub25lJywgJ2JvdGgnLCAnZGVza3RvcCcsIGFuZCAnbW9iaWxlJ1xuICAgIHJldHVybiBzZXR0aW5nID09PSAnYm90aCcgfHxcbiAgICAgICAgKHNldHRpbmcgPT09ICdkZXNrdG9wJyAmJiAhQnJvd3Nlck1ldHJpY3MuaXNNb2JpbGUoKSkgfHxcbiAgICAgICAgKHNldHRpbmcgPT09ICdtb2JpbGUnICYmIEJyb3dzZXJNZXRyaWNzLmlzTW9iaWxlKCkpO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlOiBjcmVhdGVDYWxsVG9BY3Rpb25cbn07IiwidmFyIFJhY3RpdmU7IHJlcXVpcmUoJy4vdXRpbHMvcmFjdGl2ZS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihsb2FkZWRSYWN0aXZlKSB7IFJhY3RpdmUgPSBsb2FkZWRSYWN0aXZlO30pO1xudmFyIFNWR3MgPSByZXF1aXJlKCcuL3N2Z3MnKTtcblxudmFyIHBhZ2VTZWxlY3RvciA9ICcuYW50ZW5uYS1ibG9ja2VkLXBhZ2UnO1xuXG5mdW5jdGlvbiBjcmVhdGVQYWdlKG9wdGlvbnMpIHtcbiAgICB2YXIgZ29CYWNrID0gb3B0aW9ucy5nb0JhY2s7XG4gICAgdmFyIGVsZW1lbnQgPSBvcHRpb25zLmVsZW1lbnQ7XG4gICAgdmFyIHJhY3RpdmUgPSBSYWN0aXZlKHtcbiAgICAgICAgZWw6IGVsZW1lbnQsXG4gICAgICAgIGFwcGVuZDogdHJ1ZSxcbiAgICAgICAgZGF0YToge30sXG4gICAgICAgIHRlbXBsYXRlOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvYmxvY2tlZC1yZWFjdGlvbi1wYWdlLmhicy5odG1sJyksXG4gICAgICAgIHBhcnRpYWxzOiB7XG4gICAgICAgICAgICBsZWZ0OiBTVkdzLmxlZnRcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJhY3RpdmUub24oJ2JhY2snLCBnb0JhY2spO1xuICAgIHJldHVybiB7XG4gICAgICAgIHNlbGVjdG9yOiBwYWdlU2VsZWN0b3IsXG4gICAgICAgIHRlYXJkb3duOiBmdW5jdGlvbigpIHsgcmFjdGl2ZS50ZWFyZG93bigpOyB9XG4gICAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlUGFnZTogY3JlYXRlUGFnZVxufTsiLCJ2YXIgUmFjdGl2ZTsgcmVxdWlyZSgnLi91dGlscy9yYWN0aXZlLXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGxvYWRlZFJhY3RpdmUpIHsgUmFjdGl2ZSA9IGxvYWRlZFJhY3RpdmU7fSk7XG5cbmZ1bmN0aW9uIGNyZWF0ZUNvdW50KCRjb3VudEVsZW1lbnQsIGNvbnRhaW5lckRhdGEpIHtcbiAgICB2YXIgcmFjdGl2ZSA9IFJhY3RpdmUoe1xuICAgICAgICBlbDogJGNvdW50RWxlbWVudCxcbiAgICAgICAgbWFnaWM6IHRydWUsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIGNvbnRhaW5lckRhdGE6IGNvbnRhaW5lckRhdGFcbiAgICAgICAgfSxcbiAgICAgICAgdGVtcGxhdGU6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9jYWxsLXRvLWFjdGlvbi1jb3VudGVyLmhicy5odG1sJylcbiAgICB9KTtcbiAgICByZXR1cm4ge1xuICAgICAgICB0ZWFyZG93bjogZnVuY3Rpb24oKSB7IHJhY3RpdmUudGVhcmRvd24oKTsgfVxuICAgIH07XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGU6IGNyZWF0ZUNvdW50XG59OyIsInZhciBSYWN0aXZlOyByZXF1aXJlKCcuL3V0aWxzL3JhY3RpdmUtcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24obG9hZGVkUmFjdGl2ZSkgeyBSYWN0aXZlID0gbG9hZGVkUmFjdGl2ZTt9KTtcblxuZnVuY3Rpb24gY3JlYXRlRXhwYW5kZWRSZWFjdGlvbnMoJGV4cGFuZGVkUmVhY3Rpb25zRWxlbWVudCwgJGN0YUVsZW1lbnQsIGNvbnRhaW5lckRhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgcmFjdGl2ZSA9IFJhY3RpdmUoe1xuICAgICAgICBlbDogJGV4cGFuZGVkUmVhY3Rpb25zRWxlbWVudCxcbiAgICAgICAgbWFnaWM6IHRydWUsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIGNvbnRhaW5lckRhdGE6IGNvbnRhaW5lckRhdGEsXG4gICAgICAgICAgICBjb21wdXRlRXhwYW5kZWRSZWFjdGlvbnM6IGNvbXB1dGVFeHBhbmRlZFJlYWN0aW9ucyhncm91cFNldHRpbmdzLmRlZmF1bHRSZWFjdGlvbnMoJGN0YUVsZW1lbnQpKVxuICAgICAgICB9LFxuICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL2NhbGwtdG8tYWN0aW9uLWV4cGFuZGVkLXJlYWN0aW9ucy5oYnMuaHRtbCcpXG4gICAgfSk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdGVhcmRvd246IGZ1bmN0aW9uKCkgeyByYWN0aXZlLnRlYXJkb3duKCk7IH1cbiAgICB9O1xufVxuXG5mdW5jdGlvbiBjb21wdXRlRXhwYW5kZWRSZWFjdGlvbnMoZGVmYXVsdFJlYWN0aW9ucykge1xuICAgIHJldHVybiBmdW5jdGlvbihyZWFjdGlvbnNEYXRhKSB7XG4gICAgICAgIHZhciBtYXggPSAyO1xuICAgICAgICB2YXIgZXhwYW5kZWRSZWFjdGlvbnMgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZWFjdGlvbnNEYXRhLmxlbmd0aCAmJiBleHBhbmRlZFJlYWN0aW9ucy5sZW5ndGggPCBtYXg7IGkrKykge1xuICAgICAgICAgICAgdmFyIHJlYWN0aW9uRGF0YSA9IHJlYWN0aW9uc0RhdGFbaV07XG4gICAgICAgICAgICBpZiAoaXNEZWZhdWx0UmVhY3Rpb24ocmVhY3Rpb25EYXRhLCBkZWZhdWx0UmVhY3Rpb25zKSkge1xuICAgICAgICAgICAgICAgIGV4cGFuZGVkUmVhY3Rpb25zLnB1c2gocmVhY3Rpb25EYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZXhwYW5kZWRSZWFjdGlvbnM7XG4gICAgfTtcbn1cblxuZnVuY3Rpb24gaXNEZWZhdWx0UmVhY3Rpb24ocmVhY3Rpb25EYXRhLCBkZWZhdWx0UmVhY3Rpb25zKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkZWZhdWx0UmVhY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChkZWZhdWx0UmVhY3Rpb25zW2ldLnRleHQgPT09IHJlYWN0aW9uRGF0YS50ZXh0KSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGU6IGNyZWF0ZUV4cGFuZGVkUmVhY3Rpb25zXG59OyIsInZhciBDYWxsVG9BY3Rpb25Db3VudGVyID0gcmVxdWlyZSgnLi9jYWxsLXRvLWFjdGlvbi1jb3VudGVyJyk7XG52YXIgQ2FsbFRvQWN0aW9uRXhwYW5kZWRSZWFjdGlvbnMgPSByZXF1aXJlKCcuL2NhbGwtdG8tYWN0aW9uLWV4cGFuZGVkLXJlYWN0aW9ucycpO1xudmFyIENhbGxUb0FjdGlvbkxhYmVsID0gcmVxdWlyZSgnLi9jYWxsLXRvLWFjdGlvbi1sYWJlbCcpO1xudmFyIFJlYWN0aW9uc1dpZGdldCA9IHJlcXVpcmUoJy4vcmVhY3Rpb25zLXdpZGdldCcpO1xuXG5cbmZ1bmN0aW9uIGNyZWF0ZUluZGljYXRvcldpZGdldChvcHRpb25zKSB7XG4gICAgdmFyIGNvbnRhaW5lckRhdGEgPSBvcHRpb25zLmNvbnRhaW5lckRhdGE7XG4gICAgdmFyICRjb250YWluZXJFbGVtZW50ID0gb3B0aW9ucy5jb250YWluZXJFbGVtZW50O1xuICAgIHZhciBjb250ZW50RGF0YSA9IG9wdGlvbnMuY29udGVudERhdGE7XG4gICAgdmFyICRjdGFFbGVtZW50ID0gb3B0aW9ucy5jdGFFbGVtZW50O1xuICAgIHZhciAkY3RhTGFiZWxzID0gb3B0aW9ucy5jdGFMYWJlbHM7IC8vIG9wdGlvbmFsXG4gICAgdmFyICRjdGFDb3VudGVycyA9IG9wdGlvbnMuY3RhQ291bnRlcnM7IC8vIG9wdGlvbmFsXG4gICAgdmFyICRjdGFFeHBhbmRlZFJlYWN0aW9ucyA9IG9wdGlvbnMuY3RhRXhwYW5kZWRSZWFjdGlvbnM7IC8vIG9wdGlvbmFsXG4gICAgdmFyIHBhZ2VEYXRhID0gb3B0aW9ucy5wYWdlRGF0YTtcbiAgICB2YXIgZ3JvdXBTZXR0aW5ncyA9IG9wdGlvbnMuZ3JvdXBTZXR0aW5ncztcbiAgICB2YXIgZGVmYXVsdFJlYWN0aW9ucyA9IG9wdGlvbnMuZGVmYXVsdFJlYWN0aW9ucztcblxuICAgIHZhciByZWFjdGlvbldpZGdldE9wdGlvbnMgPSB7XG4gICAgICAgIHJlYWN0aW9uc0RhdGE6IGNvbnRhaW5lckRhdGEucmVhY3Rpb25zLFxuICAgICAgICBjb250YWluZXJEYXRhOiBjb250YWluZXJEYXRhLFxuICAgICAgICBjb250YWluZXJFbGVtZW50OiAkY29udGFpbmVyRWxlbWVudCxcbiAgICAgICAgY29udGVudERhdGE6IGNvbnRlbnREYXRhLFxuICAgICAgICBkZWZhdWx0UmVhY3Rpb25zOiBkZWZhdWx0UmVhY3Rpb25zLFxuICAgICAgICBzdGFydFBhZ2U6IGNvbXB1dGVTdGFydFBhZ2UoJGN0YUVsZW1lbnQpLFxuICAgICAgICBwYWdlRGF0YTogcGFnZURhdGEsXG4gICAgICAgIGdyb3VwU2V0dGluZ3M6IGdyb3VwU2V0dGluZ3NcbiAgICB9O1xuXG4gICAgJGN0YUVsZW1lbnQub24oJ21vdXNlZW50ZXIuYW50ZW5uYScsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGlmIChldmVudC5idXR0b25zID4gMCB8fCAoZXZlbnQuYnV0dG9ucyA9PSB1bmRlZmluZWQgJiYgZXZlbnQud2hpY2ggPiAwKSkgeyAvLyBPbiBTYWZhcmksIGV2ZW50LmJ1dHRvbnMgaXMgdW5kZWZpbmVkIGJ1dCBldmVudC53aGljaCBnaXZlcyBhIGdvb2QgdmFsdWUuIGV2ZW50LndoaWNoIGlzIGJhZCBvbiBGRlxuICAgICAgICAgICAgLy8gRG9uJ3QgcmVhY3QgaWYgdGhlIHVzZXIgaXMgZHJhZ2dpbmcgb3Igc2VsZWN0aW5nIHRleHQuXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgb3BlblJlYWN0aW9uc1dpbmRvdyhyZWFjdGlvbldpZGdldE9wdGlvbnMsICRjdGFFbGVtZW50KTtcbiAgICB9KTtcblxuICAgIHZhciBjcmVhdGVkV2lkZ2V0cyA9IFtdO1xuXG4gICAgaWYgKCRjdGFMYWJlbHMpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAkY3RhTGFiZWxzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjcmVhdGVkV2lkZ2V0cy5wdXNoKENhbGxUb0FjdGlvbkxhYmVsLmNyZWF0ZSgkY3RhTGFiZWxzW2ldLCBjb250YWluZXJEYXRhKSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoJGN0YUNvdW50ZXJzKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgJGN0YUNvdW50ZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjcmVhdGVkV2lkZ2V0cy5wdXNoKENhbGxUb0FjdGlvbkNvdW50ZXIuY3JlYXRlKCRjdGFDb3VudGVyc1tpXSwgY29udGFpbmVyRGF0YSkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCRjdGFFeHBhbmRlZFJlYWN0aW9ucykge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8ICRjdGFFeHBhbmRlZFJlYWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY3JlYXRlZFdpZGdldHMucHVzaChDYWxsVG9BY3Rpb25FeHBhbmRlZFJlYWN0aW9ucy5jcmVhdGUoJGN0YUV4cGFuZGVkUmVhY3Rpb25zW2ldLCAkY3RhRWxlbWVudCwgY29udGFpbmVyRGF0YSwgZ3JvdXBTZXR0aW5ncykpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgdGVhcmRvd246IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgJGN0YUVsZW1lbnQub2ZmKCcuYW50ZW5uYScpO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjcmVhdGVkV2lkZ2V0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGNyZWF0ZWRXaWRnZXRzLnRlYXJkb3duKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVTdGFydFBhZ2UoJGVsZW1lbnQpIHtcbiAgICB2YXIgdmFsID0gKCRlbGVtZW50LmF0dHIoJ2FudC1tb2RlJykgfHwgJycpLnRyaW0oKTtcbiAgICBpZiAodmFsID09PSAnd3JpdGUnKSB7XG4gICAgICAgIHJldHVybiBSZWFjdGlvbnNXaWRnZXQuUEFHRV9ERUZBVUxUUztcbiAgICB9IGVsc2UgaWYgKHZhbCA9PT0gJ3JlYWQnKSB7XG4gICAgICAgIHJldHVybiBSZWFjdGlvbnNXaWRnZXQuUEFHRV9SRUFDVElPTlM7XG4gICAgfVxuICAgIHJldHVybiBSZWFjdGlvbnNXaWRnZXQuUEFHRV9BVVRPO1xufVxuXG5mdW5jdGlvbiBvcGVuUmVhY3Rpb25zV2luZG93KHJlYWN0aW9uT3B0aW9ucywgJGN0YUVsZW1lbnQpIHtcbiAgICBSZWFjdGlvbnNXaWRnZXQub3BlbihyZWFjdGlvbk9wdGlvbnMsICRjdGFFbGVtZW50KTtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZTogY3JlYXRlSW5kaWNhdG9yV2lkZ2V0XG59OyIsInZhciBSYWN0aXZlOyByZXF1aXJlKCcuL3V0aWxzL3JhY3RpdmUtcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24obG9hZGVkUmFjdGl2ZSkgeyBSYWN0aXZlID0gbG9hZGVkUmFjdGl2ZTt9KTtcblxuZnVuY3Rpb24gY3JlYXRlTGFiZWwoJGxhYmVsRWxlbWVudCwgY29udGFpbmVyRGF0YSkge1xuICAgIHZhciByYWN0aXZlID0gUmFjdGl2ZSh7XG4gICAgICAgIGVsOiAkbGFiZWxFbGVtZW50LCAvLyBUT0RPOiByZXZpZXcgdGhlIHN0cnVjdHVyZSBvZiB0aGUgRE9NIGhlcmUuIERvIHdlIHdhbnQgdG8gcmVuZGVyIGFuIGVsZW1lbnQgaW50byAkY3RhTGFiZWwgb3IganVzdCB0ZXh0P1xuICAgICAgICBtYWdpYzogdHJ1ZSxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgY29udGFpbmVyRGF0YTogY29udGFpbmVyRGF0YVxuICAgICAgICB9LFxuICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL2NhbGwtdG8tYWN0aW9uLWxhYmVsLmhicy5odG1sJylcbiAgICB9KTtcbiAgICByZXR1cm4ge1xuICAgICAgICB0ZWFyZG93bjogZnVuY3Rpb24oKSB7IHJhY3RpdmUudGVhcmRvd24oKTsgfVxuICAgIH1cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZTogY3JlYXRlTGFiZWxcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgQWpheENsaWVudCA9IHJlcXVpcmUoJy4vdXRpbHMvYWpheC1jbGllbnQnKTtcbnZhciBVc2VyID0gcmVxdWlyZSgnLi91dGlscy91c2VyJyk7XG5cbnZhciBFdmVudHMgPSByZXF1aXJlKCcuL2V2ZW50cycpO1xuXG5mdW5jdGlvbiBzZXR1cENvbW1lbnRBcmVhKHJlYWN0aW9uUHJvdmlkZXIsIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzLCBjYWxsYmFjaywgcmFjdGl2ZSkge1xuICAgIHJhY3RpdmUub24oJ2lucHV0Y2hhbmdlZCcsIHVwZGF0ZUlucHV0Q291bnRlcik7XG4gICAgcmFjdGl2ZS5vbignYWRkY29tbWVudCcsIGFkZENvbW1lbnQpO1xuICAgIHVwZGF0ZUlucHV0Q291bnRlcigpO1xuXG4gICAgZnVuY3Rpb24gYWRkQ29tbWVudCgpIHtcbiAgICAgICAgdmFyIGNvbW1lbnQgPSAkKHJhY3RpdmUuZmluZCgnLmFudGVubmEtY29tbWVudC1pbnB1dCcpKS52YWwoKS50cmltKCk7IC8vIFRPRE86IGFkZGl0aW9uYWwgdmFsaWRhdGlvbj8gaW5wdXQgc2FuaXRpemluZz9cbiAgICAgICAgaWYgKGNvbW1lbnQubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgJChyYWN0aXZlLmZpbmQoJy5hbnRlbm5hLWNvbW1lbnQtd2lkZ2V0cycpKS5oaWRlKCk7XG4gICAgICAgICAgICAkKHJhY3RpdmUuZmluZCgnLmFudGVubmEtY29tbWVudC13YWl0aW5nJykpLmZhZGVJbignc2xvdycpO1xuICAgICAgICAgICAgcmVhY3Rpb25Qcm92aWRlci5nZXQoZnVuY3Rpb24gKHJlYWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgQWpheENsaWVudC5wb3N0Q29tbWVudChjb21tZW50LCByZWFjdGlvbiwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgRXZlbnRzLnBvc3RDb21tZW50Q3JlYXRlZChwYWdlRGF0YSwgY29udGFpbmVyRGF0YSwgcmVhY3Rpb24sIGNvbW1lbnQsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgICAgIH0sIGVycm9yKTtcbiAgICAgICAgICAgICAgICAkKHJhY3RpdmUuZmluZCgnLmFudGVubmEtY29tbWVudC13YWl0aW5nJykpLnN0b3AoKS5oaWRlKCk7XG4gICAgICAgICAgICAgICAgJChyYWN0aXZlLmZpbmQoJy5hbnRlbm5hLWNvbW1lbnQtcmVjZWl2ZWQnKSkuZmFkZUluKCk7XG4gICAgICAgICAgICAgICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGNvbW1lbnQsIFVzZXIub3B0aW1pc3RpY0NvbW1lbnRVc2VyKCkpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGVycm9yKG1lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gVE9ETyByZWFsIGVycm9yIGhhbmRsaW5nXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdFcnJvciBwb3N0aW5nIGNvbW1lbnQ6ICcgKyBtZXNzYWdlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHVwZGF0ZUlucHV0Q291bnRlcigpIHtcbiAgICAgICAgdmFyICR0ZXh0YXJlYSA9ICQocmFjdGl2ZS5maW5kKCcuYW50ZW5uYS1jb21tZW50LWlucHV0JykpO1xuICAgICAgICB2YXIgbWF4ID0gcGFyc2VJbnQoJHRleHRhcmVhLmF0dHIoJ21heGxlbmd0aCcpKTtcbiAgICAgICAgdmFyIGxlbmd0aCA9ICR0ZXh0YXJlYS52YWwoKS5sZW5ndGg7XG4gICAgICAgICQocmFjdGl2ZS5maW5kKCcuYW50ZW5uYS1jb21tZW50LWNvdW50JykpLmh0bWwoTWF0aC5tYXgoMCwgbWF4IC0gbGVuZ3RoKSk7XG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgc2V0dXA6IHNldHVwQ29tbWVudEFyZWFcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgUmFjdGl2ZTsgcmVxdWlyZSgnLi91dGlscy9yYWN0aXZlLXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGxvYWRlZFJhY3RpdmUpIHsgUmFjdGl2ZSA9IGxvYWRlZFJhY3RpdmU7fSk7XG52YXIgQ29tbWVudEFyZWFQYXJ0aWFsID0gcmVxdWlyZSgnLi9jb21tZW50LWFyZWEtcGFydGlhbCcpO1xudmFyIFNWR3MgPSByZXF1aXJlKCcuL3N2Z3MnKTtcblxudmFyIHBhZ2VTZWxlY3RvciA9ICcuYW50ZW5uYS1jb21tZW50cy1wYWdlJztcblxuZnVuY3Rpb24gY3JlYXRlUGFnZShvcHRpb25zKSB7XG4gICAgdmFyIHJlYWN0aW9uID0gb3B0aW9ucy5yZWFjdGlvbjtcbiAgICB2YXIgY29tbWVudHMgPSBvcHRpb25zLmNvbW1lbnRzO1xuICAgIHZhciBlbGVtZW50ID0gb3B0aW9ucy5lbGVtZW50O1xuICAgIHZhciBjb250YWluZXJEYXRhID0gb3B0aW9ucy5jb250YWluZXJEYXRhO1xuICAgIHZhciBwYWdlRGF0YSA9IG9wdGlvbnMucGFnZURhdGE7XG4gICAgdmFyIGdyb3VwU2V0dGluZ3MgPSBvcHRpb25zLmdyb3VwU2V0dGluZ3M7XG4gICAgdmFyIGdvQmFjayA9IG9wdGlvbnMuZ29CYWNrO1xuICAgIHZhciByYWN0aXZlID0gUmFjdGl2ZSh7XG4gICAgICAgIGVsOiBlbGVtZW50LFxuICAgICAgICBhcHBlbmQ6IHRydWUsXG4gICAgICAgIG1hZ2ljOiB0cnVlLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICByZWFjdGlvbjogcmVhY3Rpb24sXG4gICAgICAgICAgICBjb21tZW50czogY29tbWVudHNcbiAgICAgICAgfSxcbiAgICAgICAgdGVtcGxhdGU6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9jb21tZW50cy1wYWdlLmhicy5odG1sJyksXG4gICAgICAgIHBhcnRpYWxzOiB7XG4gICAgICAgICAgICBjb21tZW50QXJlYTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL2NvbW1lbnQtYXJlYS1wYXJ0aWFsLmhicy5odG1sJyksXG4gICAgICAgICAgICBsZWZ0OiBTVkdzLmxlZnRcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHZhciByZWFjdGlvblByb3ZpZGVyID0geyAvLyB0aGlzIHJlYWN0aW9uIHByb3ZpZGVyIGlzIGEgbm8tYnJhaW5lciBiZWNhdXNlIHdlIGFscmVhZHkgaGF2ZSBhIHZhbGlkIHJlYWN0aW9uIChvbmUgd2l0aCBhbiBJRClcbiAgICAgICAgZ2V0OiBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICAgICAgY2FsbGJhY2socmVhY3Rpb24pO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBDb21tZW50QXJlYVBhcnRpYWwuc2V0dXAocmVhY3Rpb25Qcm92aWRlciwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MsIGNvbW1lbnRBZGRlZCwgcmFjdGl2ZSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgcmFjdGl2ZS5vbignYmFjaycsIGdvQmFjayk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgc2VsZWN0b3I6IHBhZ2VTZWxlY3RvcixcbiAgICAgICAgdGVhcmRvd246IGZ1bmN0aW9uKCkgeyByYWN0aXZlLnRlYXJkb3duKCk7IH1cbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gY29tbWVudEFkZGVkKGNvbW1lbnQsIHVzZXIpIHtcbiAgICAgICAgY29tbWVudHMudW5zaGlmdCh7IHRleHQ6IGNvbW1lbnQsIHVzZXI6IHVzZXIsIG5ldzogdHJ1ZSB9KTtcbiAgICAgICAgJChyYWN0aXZlLmZpbmQoJy5hbnRlbm5hLWJvZHknKSkuYW5pbWF0ZSh7c2Nyb2xsVG9wOiAwfSk7XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGU6IGNyZWF0ZVBhZ2Vcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgUmFjdGl2ZTsgcmVxdWlyZSgnLi91dGlscy9yYWN0aXZlLXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGxvYWRlZFJhY3RpdmUpIHsgUmFjdGl2ZSA9IGxvYWRlZFJhY3RpdmU7fSk7XG52YXIgQWpheENsaWVudCA9IHJlcXVpcmUoJy4vdXRpbHMvYWpheC1jbGllbnQnKTtcbnZhciBVUkxzID0gcmVxdWlyZSgnLi91dGlscy91cmxzJyk7XG52YXIgQ29tbWVudEFyZWFQYXJ0aWFsID0gcmVxdWlyZSgnLi9jb21tZW50LWFyZWEtcGFydGlhbCcpO1xudmFyIEV2ZW50cyA9IHJlcXVpcmUoJy4vZXZlbnRzJyk7XG52YXIgU1ZHcyA9IHJlcXVpcmUoJy4vc3ZncycpO1xuXG52YXIgcGFnZVNlbGVjdG9yID0gJy5hbnRlbm5hLWNvbmZpcm1hdGlvbi1wYWdlJztcblxuZnVuY3Rpb24gY3JlYXRlUGFnZShyZWFjdGlvblRleHQsIHJlYWN0aW9uUHJvdmlkZXIsIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzLCBlbGVtZW50KSB7XG4gICAgdmFyIHBvcHVwV2luZG93O1xuICAgIHZhciByYWN0aXZlID0gUmFjdGl2ZSh7XG4gICAgICAgIGVsOiBlbGVtZW50LFxuICAgICAgICBhcHBlbmQ6IHRydWUsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIHRleHQ6IHJlYWN0aW9uVGV4dFxuICAgICAgICB9LFxuICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL2NvbmZpcm1hdGlvbi1wYWdlLmhicy5odG1sJyksXG4gICAgICAgIHBhcnRpYWxzOiB7XG4gICAgICAgICAgICBjb21tZW50QXJlYTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL2NvbW1lbnQtYXJlYS1wYXJ0aWFsLmhicy5odG1sJyksXG4gICAgICAgICAgICBmYWNlYm9va0ljb246IFNWR3MuZmFjZWJvb2ssXG4gICAgICAgICAgICB0d2l0dGVySWNvbjogU1ZHcy50d2l0dGVyXG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByYWN0aXZlLm9uKCdzaGFyZS1mYWNlYm9vaycsIHNoYXJlVG9GYWNlYm9vayk7XG4gICAgcmFjdGl2ZS5vbignc2hhcmUtdHdpdHRlcicsIHNoYXJlVG9Ud2l0dGVyKTtcbiAgICBDb21tZW50QXJlYVBhcnRpYWwuc2V0dXAocmVhY3Rpb25Qcm92aWRlciwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MsIG51bGwsIHJhY3RpdmUpO1xuICAgIHJldHVybiB7XG4gICAgICAgIHNlbGVjdG9yOiBwYWdlU2VsZWN0b3IsXG4gICAgICAgIHRlYXJkb3duOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNsb3NlU2hhcmVXaW5kb3coKTtcbiAgICAgICAgICAgIHJhY3RpdmUudGVhcmRvd24oKTtcbiAgICAgICAgfVxuICAgIH07XG5cblxuICAgIGZ1bmN0aW9uIHNoYXJlVG9GYWNlYm9vayhyYWN0aXZlRXZlbnQpIHtcbiAgICAgICAgcmFjdGl2ZUV2ZW50Lm9yaWdpbmFsLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHNoYXJlUmVhY3Rpb24oZnVuY3Rpb24ocmVhY3Rpb25EYXRhLCBzaG9ydFVybCkge1xuICAgICAgICAgICAgRXZlbnRzLnBvc3RSZWFjdGlvblNoYXJlZCgnZmFjZWJvb2snLCBwYWdlRGF0YSwgY29udGFpbmVyRGF0YSwgcmVhY3Rpb25EYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgIHZhciBzaGFyZVRleHQgPSBjb21wdXRlU2hhcmVUZXh0KHJlYWN0aW9uRGF0YSwgMzAwKTtcbiAgICAgICAgICAgIHZhciBpbWFnZVBhcmFtID0gJyc7XG4gICAgICAgICAgICBpZiAoY29udGFpbmVyRGF0YS50eXBlID09PSAnaW1hZ2UnKSB7XG4gICAgICAgICAgICAgICAgaW1hZ2VQYXJhbSA9ICcmcFtpbWFnZXNdWzBdPScgKyBlbmNvZGVVUkkocmVhY3Rpb25EYXRhLmNvbnRlbnQuYm9keSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gJ2h0dHA6Ly93d3cuZmFjZWJvb2suY29tL3NoYXJlci5waHA/cz0xMDAnICtcbiAgICAgICAgICAgICAgICAnJnBbdXJsXT0nICsgc2hvcnRVcmwgK1xuICAgICAgICAgICAgICAgICcmcFt0aXRsZV09JyArIGVuY29kZVVSSShzaGFyZVRleHQpICtcbiAgICAgICAgICAgICAgICAnJnBbc3VtbWFyeV09JyArIGVuY29kZVVSSShzaGFyZVRleHQpICtcbiAgICAgICAgICAgICAgICBpbWFnZVBhcmFtO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzaGFyZVRvVHdpdHRlcihyYWN0aXZlRXZlbnQpIHtcbiAgICAgICAgcmFjdGl2ZUV2ZW50Lm9yaWdpbmFsLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHNoYXJlUmVhY3Rpb24oZnVuY3Rpb24ocmVhY3Rpb25EYXRhLCBzaG9ydFVybCkge1xuICAgICAgICAgICAgRXZlbnRzLnBvc3RSZWFjdGlvblNoYXJlZCgndHdpdHRlcicsIHBhZ2VEYXRhLCBjb250YWluZXJEYXRhLCByZWFjdGlvbkRhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgdmFyIHNoYXJlVGV4dCA9IGNvbXB1dGVTaGFyZVRleHQocmVhY3Rpb25EYXRhLCAxMTApOyAvLyBNYWtlIHN1cmUgd2Ugc3RheSB1bmRlciB0aGUgMTQwIGNoYXIgbGltaXQgKHR3aXR0ZXIgYXBwZW5kcyBhZGRpdGlvbmFsIHRleHQgbGlrZSB0aGUgdXJsKVxuICAgICAgICAgICAgdmFyIHR3aXR0ZXJWaWEgPSBncm91cFNldHRpbmdzLnR3aXR0ZXJBY2NvdW50KCkgPyAnJnZpYT0nICsgZ3JvdXBTZXR0aW5ncy50d2l0dGVyQWNjb3VudCgpIDogJyc7XG4gICAgICAgICAgICByZXR1cm4gJ2h0dHA6Ly90d2l0dGVyLmNvbS9pbnRlbnQvdHdlZXQ/dXJsPScgKyBzaG9ydFVybCArIHR3aXR0ZXJWaWEgKyAnJnRleHQ9JyArIGVuY29kZVVSSShzaGFyZVRleHQpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzaGFyZVJlYWN0aW9uKGNvbXB1dGVXaW5kb3dMb2NhdGlvbikge1xuICAgICAgICBjbG9zZVNoYXJlV2luZG93KCk7XG4gICAgICAgIHJlYWN0aW9uUHJvdmlkZXIuZ2V0KGZ1bmN0aW9uKHJlYWN0aW9uRGF0YSkge1xuICAgICAgICAgICAgdmFyIHdpbmRvdyA9IG9wZW5TaGFyZVdpbmRvdygpO1xuICAgICAgICAgICAgaWYgKHdpbmRvdykge1xuICAgICAgICAgICAgICAgIEFqYXhDbGllbnQucG9zdFNoYXJlUmVhY3Rpb24ocmVhY3Rpb25EYXRhLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB1cmwgPSBjb21wdXRlV2luZG93TG9jYXRpb24ocmVhY3Rpb25EYXRhLCByZXNwb25zZS5zaG9ydF91cmwpO1xuICAgICAgICAgICAgICAgICAgICByZWRpcmVjdFNoYXJlV2luZG93KHVybCk7XG4gICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKG1lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJGYWlsZWQgdG8gc2hhcmUgcmVhY3Rpb246IFwiICsgbWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgICAgIGNsb3NlU2hhcmVXaW5kb3coKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogZW5nYWdlX2Z1bGw6OTgxOFxuICAgICAgICAgICAgICAgICAgICAvL2lmICggcmVzcG9uc2UubWVzc2FnZS5pbmRleE9mKCBcIlRlbXBvcmFyeSB1c2VyIGludGVyYWN0aW9uIGxpbWl0IHJlYWNoZWRcIiApICE9IC0xICkge1xuICAgICAgICAgICAgICAgICAgICAvLyAgICBBTlQuc2Vzc2lvbi5zaG93TG9naW5QYW5lbCggYXJncyApO1xuICAgICAgICAgICAgICAgICAgICAvL30gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vICAgIC8vIGlmIGl0IGZhaWxlZCwgc2VlIGlmIHdlIGNhbiBmaXggaXQsIGFuZCBpZiBzbywgdHJ5IHRoaXMgZnVuY3Rpb24gb25lIG1vcmUgdGltZVxuICAgICAgICAgICAgICAgICAgICAvLyAgICBBTlQuc2Vzc2lvbi5oYW5kbGVHZXRVc2VyRmFpbCggYXJncywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vICAgICAgICBBTlQuYWN0aW9ucy5zaGFyZV9nZXRMaW5rKCBhcmdzICk7XG4gICAgICAgICAgICAgICAgICAgIC8vICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAvL31cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY2xvc2VTaGFyZVdpbmRvdygpIHtcbiAgICAgICAgaWYgKHBvcHVwV2luZG93ICYmICFwb3B1cFdpbmRvdy5jbG9zZWQpIHtcbiAgICAgICAgICAgIHBvcHVwV2luZG93LmNsb3NlKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBvcGVuU2hhcmVXaW5kb3coKSB7XG4gICAgICAgIHBvcHVwV2luZG93ID0gd2luZG93Lm9wZW4oVVJMcy5hcHBTZXJ2ZXJVcmwoKSArIFVSTHMuc2hhcmVXaW5kb3dVcmwoKSwgJ2FudGVubmFfc2hhcmVfd2luZG93JywnbWVudWJhcj0xLHJlc2l6YWJsZT0xLHdpZHRoPTYyNixoZWlnaHQ9NDM2Jyk7XG4gICAgICAgIHJldHVybiBwb3B1cFdpbmRvdztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByZWRpcmVjdFNoYXJlV2luZG93KHVybCkge1xuICAgICAgICBpZiAocG9wdXBXaW5kb3cgJiYgIXBvcHVwV2luZG93LmNsb3NlZCkge1xuICAgICAgICAgICAgcG9wdXBXaW5kb3cubG9jYXRpb24gPSB1cmw7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjb21wdXRlU2hhcmVUZXh0KHJlYWN0aW9uRGF0YSwgbWF4VGV4dExlbmd0aCkge1xuICAgICAgICB2YXIgc2hhcmVUZXh0ID0gcmVhY3Rpb25EYXRhLnRleHQgKyBcIiDCuyBcIiArICcnO1xuICAgICAgICB2YXIgZ3JvdXBOYW1lID0gZ3JvdXBTZXR0aW5ncy5ncm91cE5hbWUoKTtcbiAgICAgICAgc3dpdGNoIChjb250YWluZXJEYXRhLnR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgJ2ltYWdlJzpcbiAgICAgICAgICAgICAgICBzaGFyZVRleHQgKz0gJ1thIHBpY3R1cmUgb24gJyArIGdyb3VwTmFtZSArICddIENoZWNrIGl0IG91dDogJztcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ21lZGlhJzpcbiAgICAgICAgICAgICAgICBzaGFyZVRleHQgKz0gJ1thIHZpZGVvIG9uICcgKyBncm91cE5hbWUgKyAnXSBDaGVjayBpdCBvdXQ6ICc7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdwYWdlJzpcbiAgICAgICAgICAgICAgICBzaGFyZVRleHQgKz0gJ1thbiBhcnRpY2xlIG9uICcgKyBncm91cE5hbWUgKyAnXSBDaGVjayBpdCBvdXQ6ICc7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICd0ZXh0JzpcbiAgICAgICAgICAgICAgICB2YXIgbWF4Qm9keUxlbmd0aCA9IG1heFRleHRMZW5ndGggLSBzaGFyZVRleHQubGVuZ3RoIC0gMjsgLy8gdGhlIGV4dHJhIDIgYWNjb3VudHMgZm9yIHRoZSBxdW90ZXMgd2UgYWRkXG4gICAgICAgICAgICAgICAgdmFyIHRleHRCb2R5ID0gcmVhY3Rpb25EYXRhLmNvbnRlbnQuYm9keTtcbiAgICAgICAgICAgICAgICB0ZXh0Qm9keSA9IHRleHRCb2R5Lmxlbmd0aCA+IG1heEJvZHlMZW5ndGggPyB0ZXh0Qm9keS5zdWJzdHJpbmcoMCwgbWF4Qm9keUxlbmd0aC0zKSArICcuLi4nIDogdGV4dEJvZHk7XG4gICAgICAgICAgICAgICAgc2hhcmVUZXh0ICs9ICdcIicgKyB0ZXh0Qm9keSArICdcIic7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNoYXJlVGV4dDtcbiAgICB9XG5cbn1cblxuZnVuY3Rpb24gb3BlblNoYXJlV2luZG93KHVybCkge1xuXG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGU6IGNyZWF0ZVBhZ2Vcbn07IiwidmFyIFVSTHMgPSByZXF1aXJlKCcuL3V0aWxzL3VybHMnKTtcblxuZnVuY3Rpb24gbG9hZENzcygpIHtcbiAgICAvLyBUbyBtYWtlIHN1cmUgbm9uZSBvZiBvdXIgY29udGVudCByZW5kZXJzIG9uIHRoZSBwYWdlIGJlZm9yZSBvdXIgQ1NTIGlzIGxvYWRlZCwgd2UgYXBwZW5kIGEgc2ltcGxlIGlubGluZSBzdHlsZVxuICAgIC8vIGVsZW1lbnQgdGhhdCB0dXJucyBvZmYgb3VyIGVsZW1lbnRzICpiZWZvcmUqIG91ciBDU1MgbGlua3MuIFRoaXMgZXhwbG9pdHMgdGhlIGNhc2NhZGUgcnVsZXMgLSBvdXIgQ1NTIGZpbGVzIGFwcGVhclxuICAgIC8vIGFmdGVyIHRoZSBpbmxpbmUgc3R5bGUgaW4gdGhlIGRvY3VtZW50LCBzbyB0aGV5IHRha2UgcHJlY2VkZW5jZSAoYW5kIG1ha2UgZXZlcnl0aGluZyBhcHBlYXIpIG9uY2UgdGhleSdyZSBsb2FkZWQuXG4gICAgaW5qZWN0Q3NzKCcuYW50ZW5uYXtkaXNwbGF5Om5vbmU7fScpO1xuICAgIHZhciBjc3NIcmVmID0gVVJMcy5hcHBTZXJ2ZXJVcmwoKSArICcvc3RhdGljL3dpZGdldC1uZXcvZGVidWcvYW50ZW5uYS5jc3MnOyAvLyBUT0RPIHRoaXMgbmVlZHMgYSBmaW5hbCBwYXRoLiBDRE4gZm9yIHByb2R1Y3Rpb24gYW5kIGxvY2FsIGZpbGUgZm9yIGRldmVsb3BtZW50P1xuICAgIGxvYWRGaWxlKGNzc0hyZWYpO1xufVxuXG5mdW5jdGlvbiBsb2FkRmlsZShocmVmKSB7XG4gICAgdmFyIGxpbmtUYWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaW5rJyk7XG4gICAgbGlua1RhZy5zZXRBdHRyaWJ1dGUoJ2hyZWYnLCBocmVmKTtcbiAgICBsaW5rVGFnLnNldEF0dHJpYnV0ZSgncmVsJywgJ3N0eWxlc2hlZXQnKTtcbiAgICBsaW5rVGFnLnNldEF0dHJpYnV0ZSgndHlwZScsICd0ZXh0L2NzcycpO1xuICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQobGlua1RhZyk7XG59XG5cbmZ1bmN0aW9uIGluamVjdENzcyhjc3NTdHJpbmcpIHtcbiAgICB2YXIgc3R5bGVUYWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xuICAgIHN0eWxlVGFnLnNldEF0dHJpYnV0ZSgndHlwZScsICd0ZXh0L2NzcycpO1xuICAgIHN0eWxlVGFnLmlubmVySFRNTCA9IGNzc1N0cmluZztcbiAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHN0eWxlVGFnKTtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGxvYWQgOiBsb2FkQ3NzLFxuICAgIGluamVjdDogaW5qZWN0Q3NzXG59OyIsInZhciAkOyByZXF1aXJlKCcuL3V0aWxzL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIEFqYXhDbGllbnQgPSByZXF1aXJlKCcuL3V0aWxzL2FqYXgtY2xpZW50Jyk7XG52YXIgUmFjdGl2ZTsgcmVxdWlyZSgnLi91dGlscy9yYWN0aXZlLXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGxvYWRlZFJhY3RpdmUpIHsgUmFjdGl2ZSA9IGxvYWRlZFJhY3RpdmU7fSk7XG52YXIgUmVhY3Rpb25zV2lkZ2V0TGF5b3V0VXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzL3JlYWN0aW9ucy13aWRnZXQtbGF5b3V0LXV0aWxzJyk7XG52YXIgVXNlciA9IHJlcXVpcmUoJy4vdXRpbHMvdXNlcicpO1xuXG52YXIgRXZlbnRzID0gcmVxdWlyZSgnLi9ldmVudHMnKTtcbnZhciBQYWdlRGF0YSA9IHJlcXVpcmUoJy4vcGFnZS1kYXRhJyk7XG5cbnZhciBwYWdlU2VsZWN0b3IgPSAnLmFudGVubmEtZGVmYXVsdHMtcGFnZSc7XG5cbmZ1bmN0aW9uIGNyZWF0ZVBhZ2Uob3B0aW9ucykge1xuICAgIHZhciBkZWZhdWx0UmVhY3Rpb25zID0gb3B0aW9ucy5kZWZhdWx0UmVhY3Rpb25zO1xuICAgIHZhciBjb250YWluZXJEYXRhID0gb3B0aW9ucy5jb250YWluZXJEYXRhO1xuICAgIHZhciBwYWdlRGF0YSA9IG9wdGlvbnMucGFnZURhdGE7XG4gICAgdmFyIGdyb3VwU2V0dGluZ3MgPSBvcHRpb25zLmdyb3VwU2V0dGluZ3M7XG4gICAgdmFyIGNvbnRlbnREYXRhID0gb3B0aW9ucy5jb250ZW50RGF0YTtcbiAgICB2YXIgc2hvd0NvbmZpcm1hdGlvbiA9IG9wdGlvbnMuc2hvd0NvbmZpcm1hdGlvbjtcbiAgICB2YXIgc2hvd1Byb2dyZXNzID0gb3B0aW9ucy5zaG93UHJvZ3Jlc3M7XG4gICAgdmFyIHNob3dMb2dpbiA9IG9wdGlvbnMuc2hvd0xvZ2luO1xuICAgIHZhciBzaG93QmxvY2tlZCA9IG9wdGlvbnMuc2hvd0Jsb2NrZWQ7XG4gICAgdmFyIGVsZW1lbnQgPSBvcHRpb25zLmVsZW1lbnQ7XG4gICAgdmFyIGRlZmF1bHRMYXlvdXREYXRhID0gUmVhY3Rpb25zV2lkZ2V0TGF5b3V0VXRpbHMuY29tcHV0ZUxheW91dERhdGEoZGVmYXVsdFJlYWN0aW9ucyk7XG4gICAgdmFyICRyZWFjdGlvbnNXaW5kb3cgPSAkKG9wdGlvbnMucmVhY3Rpb25zV2luZG93KTtcbiAgICB2YXIgcmFjdGl2ZSA9IFJhY3RpdmUoe1xuICAgICAgICBlbDogZWxlbWVudCxcbiAgICAgICAgYXBwZW5kOiB0cnVlLFxuICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL2RlZmF1bHRzLXBhZ2UuaGJzLmh0bWwnKSxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgZGVmYXVsdFJlYWN0aW9uczogZGVmYXVsdFJlYWN0aW9ucyxcbiAgICAgICAgICAgIGRlZmF1bHRMYXlvdXRDbGFzczogYXJyYXlBY2Nlc3NvcihkZWZhdWx0TGF5b3V0RGF0YS5sYXlvdXRDbGFzc2VzKVxuICAgICAgICB9LFxuICAgICAgICBkZWNvcmF0b3JzOiB7XG4gICAgICAgICAgICBzaXpldG9maXQ6IFJlYWN0aW9uc1dpZGdldExheW91dFV0aWxzLnNpemVUb0ZpdCgkcmVhY3Rpb25zV2luZG93KVxuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICByYWN0aXZlLm9uKCduZXdyZWFjdGlvbicsIG5ld0RlZmF1bHRSZWFjdGlvbik7XG4gICAgcmFjdGl2ZS5vbignbmV3Y3VzdG9tJywgbmV3Q3VzdG9tUmVhY3Rpb24pO1xuICAgIHJhY3RpdmUub24oJ2N1c3RvbWZvY3VzJywgY3VzdG9tUmVhY3Rpb25Gb2N1cyk7XG4gICAgcmFjdGl2ZS5vbignY3VzdG9tYmx1cicsIGN1c3RvbVJlYWN0aW9uQmx1cik7XG4gICAgcmFjdGl2ZS5vbigncGFnZWtleWRvd24nLCBrZXlib2FyZElucHV0KTtcbiAgICByYWN0aXZlLm9uKCdpbnB1dGtleWRvd24nLCBjdXN0b21SZWFjdGlvbklucHV0KTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIHNlbGVjdG9yOiBwYWdlU2VsZWN0b3IsXG4gICAgICAgIHRlYXJkb3duOiBmdW5jdGlvbigpIHsgcmFjdGl2ZS50ZWFyZG93bigpOyB9XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIGN1c3RvbVJlYWN0aW9uSW5wdXQocmFjdGl2ZUV2ZW50KSB7XG4gICAgICAgIHZhciBldmVudCA9IHJhY3RpdmVFdmVudC5vcmlnaW5hbDtcbiAgICAgICAgdmFyIGtleSA9IChldmVudC53aGljaCAhPT0gdW5kZWZpbmVkKSA/IGV2ZW50LndoaWNoIDogZXZlbnQua2V5Q29kZTtcbiAgICAgICAgaWYgKGtleSA9PSAxMykgeyAvLyBFbnRlclxuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHsgLy8gbGV0IHRoZSBwcm9jZXNzaW5nIG9mIHRoZSBrZXlib2FyZCBldmVudCBmaW5pc2ggYmVmb3JlIHdlIHNob3cgdGhlIHBhZ2UgKG90aGVyd2lzZSwgdGhlIGNvbmZpcm1hdGlvbiBwYWdlIGFsc28gcmVjZWl2ZXMgdGhlIGtleXN0cm9rZSlcbiAgICAgICAgICAgICAgICBuZXdDdXN0b21SZWFjdGlvbigpO1xuICAgICAgICAgICAgfSwgMCk7XG4gICAgICAgIH0gZWxzZSBpZiAoa2V5ID09IDI3KSB7IC8vIEVzY2FwZVxuICAgICAgICAgICAgJChldmVudC50YXJnZXQpLnZhbCgnJyk7XG4gICAgICAgICAgICAkKHJvb3RFbGVtZW50KHJhY3RpdmUpKS5mb2N1cygpO1xuICAgICAgICB9XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG5ld0RlZmF1bHRSZWFjdGlvbihyYWN0aXZlRXZlbnQpIHtcbiAgICAgICAgdmFyIHJlYWN0aW9uRGF0YSA9IHJhY3RpdmVFdmVudC5jb250ZXh0O1xuICAgICAgICB2YXIgcmVhY3Rpb25Qcm92aWRlciA9IGNyZWF0ZVJlYWN0aW9uUHJvdmlkZXIoKTtcbiAgICAgICAgc2hvd0NvbmZpcm1hdGlvbihyZWFjdGlvbkRhdGEsIHJlYWN0aW9uUHJvdmlkZXIpOyAvLyBPcHRpbWlzdGljYWxseSBzaG93IGNvbmZpcm1hdGlvbiBmb3IgZGVmYXVsdCByZWFjdGlvbnMgYmVjYXVzZSB0aGV5IHNob3VsZCBhbHdheXMgYmUgYWNjZXB0ZWQuXG4gICAgICAgIEFqYXhDbGllbnQucG9zdE5ld1JlYWN0aW9uKHJlYWN0aW9uRGF0YSwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGNvbnRlbnREYXRhLCBzdWNjZXNzLCBlcnJvcik7XG5cbiAgICAgICAgZnVuY3Rpb24gc3VjY2VzcyhyZWFjdGlvbikge1xuICAgICAgICAgICAgcmVhY3Rpb24gPSBQYWdlRGF0YS5yZWdpc3RlclJlYWN0aW9uKHJlYWN0aW9uLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSk7XG4gICAgICAgICAgICByZWFjdGlvblByb3ZpZGVyLnJlYWN0aW9uTG9hZGVkKHJlYWN0aW9uKTtcbiAgICAgICAgICAgIEV2ZW50cy5wb3N0UmVhY3Rpb25DcmVhdGVkKHBhZ2VEYXRhLCBjb250YWluZXJEYXRhLCByZWFjdGlvbiwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBlcnJvcihtZXNzYWdlKSB7XG4gICAgICAgICAgICAvLyBUT0RPIGhhbmRsZSBhbnkgZXJyb3JzIHRoYXQgb2NjdXIgcG9zdGluZyBhIHJlYWN0aW9uXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcImVycm9yIHBvc3RpbmcgbmV3IHJlYWN0aW9uOiBcIiArIG1lc3NhZ2UpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbmV3Q3VzdG9tUmVhY3Rpb24oKSB7XG4gICAgICAgIHZhciBib2R5ID0gJChyYWN0aXZlLmZpbmQoJy5hbnRlbm5hLWRlZmF1bHRzLWZvb3RlciBpbnB1dCcpKS52YWwoKS50cmltKCk7XG4gICAgICAgIGlmIChib2R5ICE9PSAnJykge1xuICAgICAgICAgICAgc2hvd1Byb2dyZXNzKCk7IC8vIFNob3cgcHJvZ3Jlc3MgZm9yIGN1c3RvbSByZWFjdGlvbnMgYmVjYXVzZSB0aGUgc2VydmVyIG1pZ2h0IHJlamVjdCB0aGVtIGZvciBhIG51bWJlciBvZiByZWFzb25zXG4gICAgICAgICAgICB2YXIgcmVhY3Rpb25EYXRhID0geyB0ZXh0OiBib2R5IH07XG4gICAgICAgICAgICB2YXIgcmVhY3Rpb25Qcm92aWRlciA9IGNyZWF0ZVJlYWN0aW9uUHJvdmlkZXIoKTtcbiAgICAgICAgICAgIEFqYXhDbGllbnQucG9zdE5ld1JlYWN0aW9uKHJlYWN0aW9uRGF0YSwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGNvbnRlbnREYXRhLCBzdWNjZXNzLCBlcnJvcik7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBzdWNjZXNzKHJlYWN0aW9uKSB7XG4gICAgICAgICAgICBzaG93Q29uZmlybWF0aW9uKHJlYWN0aW9uRGF0YSwgcmVhY3Rpb25Qcm92aWRlcik7IC8vIFRPRE86IHJldmlldyB0aGUgcmVhY3Rpb25Qcm92aWRlciBpbiB0aGlzIGNhc2VcbiAgICAgICAgICAgIHJlYWN0aW9uID0gUGFnZURhdGEucmVnaXN0ZXJSZWFjdGlvbihyZWFjdGlvbiwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEpO1xuICAgICAgICAgICAgcmVhY3Rpb25Qcm92aWRlci5yZWFjdGlvbkxvYWRlZChyZWFjdGlvbik7XG4gICAgICAgICAgICBFdmVudHMucG9zdFJlYWN0aW9uQ3JlYXRlZChwYWdlRGF0YSwgY29udGFpbmVyRGF0YSwgcmVhY3Rpb24sIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZXJyb3IobWVzc2FnZSkge1xuICAgICAgICAgICAgdmFyIHJldHJ5ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgQWpheENsaWVudC5wb3N0TmV3UmVhY3Rpb24ocmVhY3Rpb25EYXRhLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgY29udGVudERhdGEsIHN1Y2Nlc3MsIGVycm9yKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBoYW5kbGVOZXdSZWFjdGlvbkVycm9yKG1lc3NhZ2UsIHJldHJ5KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGhhbmRsZU5ld1JlYWN0aW9uRXJyb3IobWVzc2FnZSwgcmV0cnlDYWxsYmFjaykge1xuICAgICAgICBpZiAobWVzc2FnZS5pbmRleE9mKCdzaWduIGluIHJlcXVpcmVkIGZvciBvcmdhbmljIHJlYWN0aW9ucycpICE9PSAtMSkge1xuICAgICAgICAgICAgc2hvd0xvZ2luKHJldHJ5Q2FsbGJhY2spO1xuICAgICAgICB9IGVsc2UgaWYgKG1lc3NhZ2UuaW5kZXhPZignR3JvdXAgaGFzIGJsb2NrZWQgdGhpcyB0YWcuJykgIT09IC0xKSB7XG4gICAgICAgICAgICBzaG93QmxvY2tlZCgpO1xuICAgICAgICB9IGVsc2UgaWYgKGlzVG9rZW5FcnJvcihtZXNzYWdlKSkge1xuICAgICAgICAgICAgVXNlci5yZUF1dGhvcml6ZVVzZXIoZnVuY3Rpb24oaGFzTmV3VG9rZW4pIHtcbiAgICAgICAgICAgICAgICBpZiAoaGFzTmV3VG9rZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0cnlDYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHNob3dMb2dpbihyZXRyeUNhbGxiYWNrKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIFRPRE8gZXJyb3IgaGFuZGxpbmdcbiAgICAgICAgICAgIC8vIFRPRE86IHNob3cgc29tZSBraW5kIG9mIGdlbmVyaWMgZXJyb3IgcGFnZVxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJlcnJvciBwb3N0aW5nIG5ldyByZWFjdGlvbjogXCIgKyBtZXNzYWdlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGlzVG9rZW5FcnJvcihtZXNzYWdlKSB7XG4gICAgICAgIHN3aXRjaChtZXNzYWdlKSB7XG4gICAgICAgICAgICBjYXNlIFwiVG9rZW4gd2FzIGludmFsaWRcIjpcbiAgICAgICAgICAgIGNhc2UgXCJGYWNlYm9vayB0b2tlbiBleHBpcmVkXCI6XG4gICAgICAgICAgICBjYXNlIFwiRkIgZ3JhcGggZXJyb3IgLSB0b2tlbiBpbnZhbGlkXCI6XG4gICAgICAgICAgICBjYXNlIFwiU29jaWFsIEF1dGggZG9lcyBub3QgZXhpc3QgZm9yIHVzZXJcIjpcbiAgICAgICAgICAgIGNhc2UgXCJEYXRhIHRvIGNyZWF0ZSB0b2tlbiBpcyBtaXNzaW5nXCI6XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGtleWJvYXJkSW5wdXQocmFjdGl2ZUV2ZW50KSB7XG4gICAgICAgIGlmICgkKHJvb3RFbGVtZW50KHJhY3RpdmUpKS5oYXNDbGFzcygnYW50ZW5uYS1wYWdlLWFjdGl2ZScpKSB7IC8vIG9ubHkgaGFuZGxlIGlucHV0IHdoZW4gdGhpcyBwYWdlIGlzIGFjdGl2ZVxuICAgICAgICAgICAgJChyb290RWxlbWVudChyYWN0aXZlKSkuZmluZCgnLmFudGVubmEtZGVmYXVsdHMtZm9vdGVyIGlucHV0JykuZm9jdXMoKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gcm9vdEVsZW1lbnQocmFjdGl2ZSkge1xuICAgIHJldHVybiByYWN0aXZlLmZpbmQocGFnZVNlbGVjdG9yKTtcbn1cblxuZnVuY3Rpb24gYXJyYXlBY2Nlc3NvcihhcnJheSkge1xuICAgIHJldHVybiBmdW5jdGlvbihpbmRleCkge1xuICAgICAgICByZXR1cm4gYXJyYXlbaW5kZXhdO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gY3VzdG9tUmVhY3Rpb25Gb2N1cyhyYWN0aXZlRXZlbnQpIHtcbiAgICB2YXIgJGZvb3RlciA9ICQocmFjdGl2ZUV2ZW50Lm9yaWdpbmFsLnRhcmdldCkuY2xvc2VzdCgnLmFudGVubmEtZGVmYXVsdHMtZm9vdGVyJyk7XG4gICAgJGZvb3Rlci5maW5kKCdpbnB1dCcpLm5vdCgnLmFjdGl2ZScpLnZhbCgnJykuYWRkQ2xhc3MoJ2FjdGl2ZScpO1xuICAgICRmb290ZXIuZmluZCgnYnV0dG9uJykuc2hvdygpO1xufVxuXG5mdW5jdGlvbiBjdXN0b21SZWFjdGlvbkJsdXIocmFjdGl2ZUV2ZW50KSB7XG4gICAgdmFyIGV2ZW50ID0gcmFjdGl2ZUV2ZW50Lm9yaWdpbmFsO1xuICAgIGlmICgkKGV2ZW50LnJlbGF0ZWRUYXJnZXQpLmNsb3Nlc3QoJy5hbnRlbm5hLWRlZmF1bHRzLWZvb3RlciBidXR0b24nKS5zaXplKCkgPT0gMCkgeyAvLyBEb24ndCBoaWRlIHRoZSBpbnB1dCB3aGVuIHdlIGNsaWNrIG9uIHRoZSBidXR0b25cbiAgICAgICAgdmFyICRmb290ZXIgPSAkKGV2ZW50LnRhcmdldCkuY2xvc2VzdCgnLmFudGVubmEtZGVmYXVsdHMtZm9vdGVyJyk7XG4gICAgICAgIHZhciBpbnB1dCA9ICRmb290ZXIuZmluZCgnaW5wdXQnKTtcbiAgICAgICAgaWYgKGlucHV0LnZhbCgpID09PSAnJykge1xuICAgICAgICAgICAgJGZvb3Rlci5maW5kKCdidXR0b24nKS5oaWRlKCk7XG4gICAgICAgICAgICB2YXIgJGlucHV0ID0gJGZvb3Rlci5maW5kKCdpbnB1dCcpO1xuICAgICAgICAgICAgLy8gUmVzZXQgdGhlIGlucHV0IHZhbHVlIHRvIHRoZSBkZWZhdWx0IGluIHRoZSBodG1sL3RlbXBsYXRlXG4gICAgICAgICAgICAkaW5wdXQudmFsKCRpbnB1dC5hdHRyKCd2YWx1ZScpKS5yZW1vdmVDbGFzcygnYWN0aXZlJyk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVJlYWN0aW9uUHJvdmlkZXIoKSB7XG5cbiAgICB2YXIgbG9hZGVkUmVhY3Rpb247XG4gICAgdmFyIGNhbGxiYWNrcyA9IFtdO1xuXG4gICAgZnVuY3Rpb24gb25SZWFjdGlvbihjYWxsYmFjaykge1xuICAgICAgICBjYWxsYmFja3MucHVzaChjYWxsYmFjayk7XG4gICAgICAgIG5vdGlmeUlmUmVhZHkoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByZWFjdGlvbkxvYWRlZChyZWFjdGlvbikge1xuICAgICAgICBsb2FkZWRSZWFjdGlvbiA9IHJlYWN0aW9uO1xuICAgICAgICBub3RpZnlJZlJlYWR5KCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbm90aWZ5SWZSZWFkeSgpIHtcbiAgICAgICAgaWYgKGxvYWRlZFJlYWN0aW9uKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNhbGxiYWNrcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrc1tpXShsb2FkZWRSZWFjdGlvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYWxsYmFja3MgPSBbXTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIGdldDogb25SZWFjdGlvbiwgLy8gVE9ETyB0ZXJtaW5vbG9neVxuICAgICAgICByZWFjdGlvbkxvYWRlZDogcmVhY3Rpb25Mb2FkZWRcbiAgICB9XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGU6IGNyZWF0ZVBhZ2Vcbn07IiwidmFyIEFqYXhDbGllbnQgPSByZXF1aXJlKCcuL3V0aWxzL2FqYXgtY2xpZW50Jyk7XG52YXIgQnJvd3Nlck1ldHJpY3MgPSByZXF1aXJlKCcuL3V0aWxzL2Jyb3dzZXItbWV0cmljcycpO1xudmFyIFVzZXIgPSByZXF1aXJlKCcuL3V0aWxzL3VzZXInKTtcblxuZnVuY3Rpb24gcG9zdEdyb3VwU2V0dGluZ3NMb2FkZWQoZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBldmVudCA9IGNyZWF0ZUV2ZW50KGV2ZW50VHlwZXMuc2NyaXB0TG9hZCwgJycsIGdyb3VwU2V0dGluZ3MpO1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMucGFnZUlkXSA9ICduYSc7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5hcnRpY2xlSGVpZ2h0XSA9ICduYSc7XG4gICAgcG9zdEV2ZW50KGV2ZW50KTtcbn1cblxuZnVuY3Rpb24gcG9zdFBhZ2VEYXRhTG9hZGVkKHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGV2ZW50ID0gY3JlYXRlRXZlbnQoZXZlbnRUeXBlcy5wYWdlRGF0YUxvYWRlZCwgJycsIGdyb3VwU2V0dGluZ3MpO1xuICAgIGFwcGVuZFBhZ2VEYXRhUGFyYW1zKGV2ZW50LCBwYWdlRGF0YSk7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5jb250ZW50QXR0cmlidXRlc10gPSBwYWdlRGF0YS5tZXRyaWNzLmlzTXVsdGlQYWdlID8gZXZlbnRWYWx1ZXMubXVsdGlwbGVQYWdlcyA6IGV2ZW50VmFsdWVzLnNpbmdsZVBhZ2U7XG4gICAgcG9zdEV2ZW50KGV2ZW50KTtcbn1cblxuZnVuY3Rpb24gcG9zdFJlYWN0aW9uV2lkZ2V0T3BlbmVkKGlzU2hvd1JlYWN0aW9ucywgcGFnZURhdGEsIGNvbnRhaW5lckRhdGEsIGNvbnRlbnREYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGV2ZW50VmFsdWUgPSBpc1Nob3dSZWFjdGlvbnMgPyBldmVudFZhbHVlcy5zaG93UmVhY3Rpb25zIDogZXZlbnRWYWx1ZXMuc2hvd0RlZmF1bHRzO1xuICAgIHZhciBldmVudCA9IGNyZWF0ZUV2ZW50KGV2ZW50VHlwZXMucmVhY3Rpb25XaWRnZXRPcGVuZWQsIGV2ZW50VmFsdWUsIGdyb3VwU2V0dGluZ3MpO1xuICAgIGFwcGVuZFBhZ2VEYXRhUGFyYW1zKGV2ZW50LCBwYWdlRGF0YSk7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5jb250YWluZXJIYXNoXSA9IGNvbnRhaW5lckRhdGEuaGFzaDtcbiAgICBldmVudFthdHRyaWJ1dGVzLmNvbnRhaW5lcktpbmRdID0gY29udGVudERhdGEudHlwZTtcbiAgICBwb3N0RXZlbnQoZXZlbnQpO1xufVxuXG5mdW5jdGlvbiBwb3N0U3VtbWFyeU9wZW5lZChpc1Nob3dSZWFjdGlvbnMsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGV2ZW50VmFsdWUgPSBpc1Nob3dSZWFjdGlvbnMgPyBldmVudFZhbHVlcy52aWV3UmVhY3Rpb25zIDogZXZlbnRWYWx1ZXMudmlld0RlZmF1bHRzO1xuICAgIHZhciBldmVudCA9IGNyZWF0ZUV2ZW50KGV2ZW50VHlwZXMuc3VtbWFyeVdpZGdldCwgZXZlbnRWYWx1ZSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgYXBwZW5kUGFnZURhdGFQYXJhbXMoZXZlbnQsIHBhZ2VEYXRhKTtcbiAgICBwb3N0RXZlbnQoZXZlbnQpO1xufVxuXG5mdW5jdGlvbiBwb3N0UmVhY3Rpb25DcmVhdGVkKHBhZ2VEYXRhLCBjb250YWluZXJEYXRhLCByZWFjdGlvbkRhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgZXZlbnQgPSBjcmVhdGVFdmVudChldmVudFR5cGVzLnJlYWN0aW9uQ3JlYXRlZCwgcmVhY3Rpb25EYXRhLnRleHQsIGdyb3VwU2V0dGluZ3MpO1xuICAgIGFwcGVuZFBhZ2VEYXRhUGFyYW1zKGV2ZW50LCBwYWdlRGF0YSk7XG4gICAgYXBwZW5kQ29udGFpbmVyRGF0YVBhcmFtcyhldmVudCwgY29udGFpbmVyRGF0YSk7XG4gICAgYXBwZW5kUmVhY3Rpb25EYXRhUGFyYW1zKGV2ZW50LCByZWFjdGlvbkRhdGEpO1xuICAgIHBvc3RFdmVudChldmVudCk7XG59XG5cbmZ1bmN0aW9uIHBvc3RSZWFjdGlvblNoYXJlZCh0YXJnZXQsIHBhZ2VEYXRhLCBjb250YWluZXJEYXRhLCByZWFjdGlvbkRhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgZXZlbnRWYWx1ZSA9IHRhcmdldDsgLy8gJ2ZhY2Vib29rJywgJ3R3aXR0ZXInLCBldGNcbiAgICB2YXIgZXZlbnQgPSBjcmVhdGVFdmVudChldmVudFR5cGVzLnJlYWN0aW9uU2hhcmVkLCBldmVudFZhbHVlLCBncm91cFNldHRpbmdzKTtcbiAgICBhcHBlbmRQYWdlRGF0YVBhcmFtcyhldmVudCwgcGFnZURhdGEpO1xuICAgIGFwcGVuZENvbnRhaW5lckRhdGFQYXJhbXMoZXZlbnQsIGNvbnRhaW5lckRhdGEpO1xuICAgIGFwcGVuZFJlYWN0aW9uRGF0YVBhcmFtcyhldmVudCwgcmVhY3Rpb25EYXRhKTtcbiAgICBwb3N0RXZlbnQoZXZlbnQpO1xufVxuXG5mdW5jdGlvbiBwb3N0TG9jYXRpb25zVmlld2VkKHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGV2ZW50ID0gY3JlYXRlRXZlbnQoZXZlbnRUeXBlcy5zdW1tYXJ5V2lkZ2V0LCBldmVudFZhbHVlcy5sb2NhdGlvbnNWaWV3ZWQsIGdyb3VwU2V0dGluZ3MpO1xuICAgIGFwcGVuZFBhZ2VEYXRhUGFyYW1zKGV2ZW50LCBwYWdlRGF0YSk7XG4gICAgcG9zdEV2ZW50KGV2ZW50KTtcbn1cblxuZnVuY3Rpb24gcG9zdENvbnRlbnRWaWV3ZWQocGFnZURhdGEsIGNvbnRhaW5lckRhdGEsIGxvY2F0aW9uRGF0YSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBldmVudCA9IGNyZWF0ZUV2ZW50KGV2ZW50VHlwZXMuc3VtbWFyeVdpZGdldCwgZXZlbnRWYWx1ZXMuY29udGVudFZpZXdlZCwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgYXBwZW5kUGFnZURhdGFQYXJhbXMoZXZlbnQsIHBhZ2VEYXRhKTtcbiAgICBhcHBlbmRDb250YWluZXJEYXRhUGFyYW1zKGV2ZW50LCBjb250YWluZXJEYXRhKTtcbiAgICBldmVudFthdHRyaWJ1dGVzLmNvbnRlbnRJZF0gPSBsb2NhdGlvbkRhdGEuY29udGVudElkO1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMuY29udGVudExvY2F0aW9uXSA9IGxvY2F0aW9uRGF0YS5sb2NhdGlvbjtcbiAgICBwb3N0RXZlbnQoZXZlbnQpO1xufVxuXG5mdW5jdGlvbiBwb3N0Q29tbWVudHNWaWV3ZWQocGFnZURhdGEsIGNvbnRhaW5lckRhdGEsIHJlYWN0aW9uRGF0YSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBldmVudCA9IGNyZWF0ZUV2ZW50KGV2ZW50VHlwZXMuY29tbWVudHNWaWV3ZWQsICcnLCBncm91cFNldHRpbmdzKTtcbiAgICBhcHBlbmRQYWdlRGF0YVBhcmFtcyhldmVudCwgcGFnZURhdGEpO1xuICAgIGFwcGVuZENvbnRhaW5lckRhdGFQYXJhbXMoZXZlbnQsIGNvbnRhaW5lckRhdGEpO1xuICAgIGFwcGVuZFJlYWN0aW9uRGF0YVBhcmFtcyhldmVudCwgcmVhY3Rpb25EYXRhKTtcbiAgICBwb3N0RXZlbnQoZXZlbnQpO1xufVxuXG5mdW5jdGlvbiBwb3N0Q29tbWVudENyZWF0ZWQocGFnZURhdGEsIGNvbnRhaW5lckRhdGEsIHJlYWN0aW9uRGF0YSwgY29tbWVudCwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBldmVudCA9IGNyZWF0ZUV2ZW50KGV2ZW50VHlwZXMuY29tbWVudENyZWF0ZWQsIGNvbW1lbnQsIGdyb3VwU2V0dGluZ3MpO1xuICAgIGFwcGVuZFBhZ2VEYXRhUGFyYW1zKGV2ZW50LCBwYWdlRGF0YSk7XG4gICAgYXBwZW5kQ29udGFpbmVyRGF0YVBhcmFtcyhldmVudCwgY29udGFpbmVyRGF0YSk7XG4gICAgYXBwZW5kUmVhY3Rpb25EYXRhUGFyYW1zKGV2ZW50LCByZWFjdGlvbkRhdGEpO1xuICAgIHBvc3RFdmVudChldmVudCk7XG59XG5cbmZ1bmN0aW9uIHBvc3RSZWNpcmNDbGlja2VkKHBhZ2VEYXRhLCByZWFjdGlvbklkLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGV2ZW50ID0gY3JlYXRlRXZlbnQoZXZlbnRUeXBlcy5yZWNpcmNDbGlja2VkLCByZWFjdGlvbklkLCBncm91cFNldHRpbmdzKTtcbiAgICBhcHBlbmRQYWdlRGF0YVBhcmFtcyhldmVudCwgcGFnZURhdGEpO1xuICAgIHBvc3RFdmVudChldmVudCk7XG59XG5cbmZ1bmN0aW9uIGFwcGVuZFBhZ2VEYXRhUGFyYW1zKGV2ZW50LCBwYWdlRGF0YSkge1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMucGFnZUlkXSA9IHBhZ2VEYXRhLnBhZ2VJZDtcbiAgICBldmVudFthdHRyaWJ1dGVzLnBhZ2VUaXRsZV0gPSBwYWdlRGF0YS50aXRsZTtcbiAgICBldmVudFthdHRyaWJ1dGVzLmNhbm9uaWNhbFVybF0gPSBwYWdlRGF0YS5jYW5vbmljYWxVcmw7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5wYWdlVXJsXSA9IHBhZ2VEYXRhLnJlcXVlc3RlZFVybDtcbiAgICBldmVudFthdHRyaWJ1dGVzLmFydGljbGVIZWlnaHRdID0gMCB8fCBwYWdlRGF0YS5tZXRyaWNzLmhlaWdodDtcbiAgICBldmVudFthdHRyaWJ1dGVzLnBhZ2VUb3BpY3NdID0gcGFnZURhdGEudG9waWNzO1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMuYXV0aG9yXSA9IHBhZ2VEYXRhLmF1dGhvcjtcbiAgICBldmVudFthdHRyaWJ1dGVzLnNpdGVTZWN0aW9uXSA9IHBhZ2VEYXRhLnNlY3Rpb247XG59XG5cbmZ1bmN0aW9uIGFwcGVuZENvbnRhaW5lckRhdGFQYXJhbXMoZXZlbnQsIGNvbnRhaW5lckRhdGEpIHtcbiAgICBldmVudFthdHRyaWJ1dGVzLmNvbnRhaW5lckhhc2hdID0gY29udGFpbmVyRGF0YS5oYXNoO1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMuY29udGFpbmVyS2luZF0gPSBjb250YWluZXJEYXRhLnR5cGU7XG59XG5cbmZ1bmN0aW9uIGFwcGVuZFJlYWN0aW9uRGF0YVBhcmFtcyhldmVudCwgcmVhY3Rpb25EYXRhKSB7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5yZWFjdGlvbkJvZHldID0gcmVhY3Rpb25EYXRhLnRleHQ7XG4gICAgaWYgKHJlYWN0aW9uRGF0YS5jb250ZW50KSB7XG4gICAgICAgIGV2ZW50W2F0dHJpYnV0ZXMuY29udGVudExvY2F0aW9uXSA9IHJlYWN0aW9uRGF0YS5jb250ZW50LmxvY2F0aW9uO1xuICAgICAgICBldmVudFthdHRyaWJ1dGVzLmNvbnRlbnRJZF0gPSByZWFjdGlvbkRhdGEuY29udGVudC5pZDtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUV2ZW50KGV2ZW50VHlwZSwgZXZlbnRWYWx1ZSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciByZWZlcnJlckRvbWFpbiA9IGRvY3VtZW50LnJlZmVycmVyLnNwbGl0KCcvJykuc3BsaWNlKDIpLmpvaW4oJy8nKTsgLy8gVE9ETzogZW5nYWdlX2Z1bGwgY29kZS4gUmV2aWV3XG5cbiAgICB2YXIgZXZlbnQgPSB7fTtcbiAgICBldmVudFthdHRyaWJ1dGVzLmV2ZW50VHlwZV0gPSBldmVudFR5cGU7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5ldmVudFZhbHVlXSA9IGV2ZW50VmFsdWU7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5ncm91cElkXSA9IGdyb3VwU2V0dGluZ3MuZ3JvdXBJZCgpO1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMuc2hvcnRUZXJtU2Vzc2lvbl0gPSBnZXRTaG9ydFRlcm1TZXNzaW9uSWQoKTtcbiAgICBldmVudFthdHRyaWJ1dGVzLmxvbmdUZXJtU2Vzc2lvbl0gPSBnZXRMb25nVGVybVNlc3Npb25JZCgpO1xuICAgIGV2ZW50W2F0dHJpYnV0ZXMucmVmZXJyZXJVcmxdID0gcmVmZXJyZXJEb21haW47XG4gICAgZXZlbnRbYXR0cmlidXRlcy5pc1RvdWNoQnJvd3Nlcl0gPSBCcm93c2VyTWV0cmljcy5zdXBwb3J0c1RvdWNoKCk7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5zY3JlZW5XaWR0aF0gPSBzY3JlZW4ud2lkdGg7XG4gICAgZXZlbnRbYXR0cmlidXRlcy5zY3JlZW5IZWlnaHRdID0gc2NyZWVuLmhlaWdodDtcbiAgICBldmVudFthdHRyaWJ1dGVzLnBpeGVsRGVuc2l0eV0gPSB3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbyB8fCBNYXRoLnJvdW5kKHdpbmRvdy5zY3JlZW4uYXZhaWxXaWR0aCAvIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRXaWR0aCk7IC8vIFRPRE86IHJldmlldyB0aGlzIGVuZ2FnZV9mdWxsIGNvZGUsIHdoaWNoIGRvZXNuJ3Qgc2VlbSBjb3JyZWN0XG4gICAgZXZlbnRbYXR0cmlidXRlcy51c2VyQWdlbnRdID0gbmF2aWdhdG9yLnVzZXJBZ2VudDtcbiAgICByZXR1cm4gZXZlbnQ7XG59XG5cbmZ1bmN0aW9uIHBvc3RFdmVudChldmVudCkge1xuICAgIFVzZXIuY2FjaGVkVXNlcihmdW5jdGlvbih1c2VySW5mbykgeyAvLyBXZSBkb24ndCB3YW50IHRvIGNyZWF0ZSB1c2VycyBqdXN0IGZvciBldmVudHMgKGUuZy4gZXZlcnkgc2NyaXB0IGxvYWQpLCBidXQgYWRkIHVzZXIgaW5mbyBpZiB3ZSBoYXZlIGl0IGFscmVhZHkuXG4gICAgICAgIGlmICh1c2VySW5mbykge1xuICAgICAgICAgICAgZXZlbnRbYXR0cmlidXRlcy51c2VySWRdID0gdXNlckluZm8udXNlcl9pZDtcbiAgICAgICAgfVxuICAgICAgICBmaWxsSW5NaXNzaW5nUHJvcGVydGllcyhldmVudCk7XG4gICAgICAgIC8vIFNlbmQgdGhlIGV2ZW50IHRvIEJpZ1F1ZXJ5XG4gICAgICAgIEFqYXhDbGllbnQucG9zdEV2ZW50KGV2ZW50KTtcbiAgICB9KTtcbn1cblxuLy8gRmlsbCBpbiBhbnkgb3B0aW9uYWwgcHJvcGVydGllcyB3aXRoIG51bGwgdmFsdWVzLlxuZnVuY3Rpb24gZmlsbEluTWlzc2luZ1Byb3BlcnRpZXMoZXZlbnQpIHtcbiAgICBmb3IgKHZhciBhdHRyIGluIGF0dHJpYnV0ZXMpIHtcbiAgICAgICAgaWYgKGV2ZW50W2F0dHJpYnV0ZXNbYXR0cl1dID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGV2ZW50W2F0dHJpYnV0ZXNbYXR0cl1dID0gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gZ2V0TG9uZ1Rlcm1TZXNzaW9uSWQoKSB7XG4gICAgdmFyIGd1aWQgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnYW50X2x0cycpO1xuICAgIGlmICghZ3VpZCkge1xuICAgICAgICBndWlkID0gY3JlYXRlR3VpZCgpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2FudF9sdHMnLCBndWlkKTtcbiAgICAgICAgfSBjYXRjaChlcnJvcikge1xuICAgICAgICAgICAgLy8gU29tZSBicm93c2VycyAobW9iaWxlIFNhZmFyaSkgdGhyb3cgYW4gZXhjZXB0aW9uIHdoZW4gaW4gcHJpdmF0ZSBicm93c2luZyBtb2RlLlxuICAgICAgICAgICAgLy8gTm90aGluZyB3ZSBjYW4gZG8gYWJvdXQgaXQuIEp1c3QgZmFsbCB0aHJvdWdoIGFuZCByZXR1cm4gdGhlIHZhbHVlIHdlIGdlbmVyYXRlZC5cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZ3VpZDtcbn1cblxuZnVuY3Rpb24gZ2V0U2hvcnRUZXJtU2Vzc2lvbklkKCkge1xuICAgIHZhciBzZXNzaW9uO1xuICAgIHZhciBqc29uID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ2FudF9zdHMnKTtcbiAgICBpZiAoanNvbikge1xuICAgICAgICBzZXNzaW9uID0gSlNPTi5wYXJzZShqc29uKTtcbiAgICAgICAgaWYgKERhdGUubm93KCkgPiBzZXNzaW9uLmV4cGlyZXMpIHtcbiAgICAgICAgICAgIHNlc3Npb24gPSBudWxsO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmICghc2Vzc2lvbikge1xuICAgICAgICB2YXIgbWludXRlcyA9IDE1O1xuICAgICAgICBzZXNzaW9uID0ge1xuICAgICAgICAgICAgZ3VpZDogY3JlYXRlR3VpZCgpLFxuICAgICAgICAgICAgZXhwaXJlczogRGF0ZS5ub3coKSArIG1pbnV0ZXMgKiA2MDAwMFxuICAgICAgICB9O1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnYW50X3N0cycsIEpTT04uc3RyaW5naWZ5KHNlc3Npb24pKTtcbiAgICB9IGNhdGNoKGVycm9yKSB7XG4gICAgICAgIC8vIFNvbWUgYnJvd3NlcnMgKG1vYmlsZSBTYWZhcmkpIHRocm93IGFuIGV4Y2VwdGlvbiB3aGVuIGluIHByaXZhdGUgYnJvd3NpbmcgbW9kZS5cbiAgICAgICAgLy8gTm90aGluZyB3ZSBjYW4gZG8gYWJvdXQgaXQuIEp1c3QgZmFsbCB0aHJvdWdoIGFuZCByZXR1cm4gdGhlIHZhbHVlIHdlIGdlbmVyYXRlZC5cbiAgICB9XG4gICAgcmV0dXJuIHNlc3Npb24uZ3VpZDtcbn1cblxuZnVuY3Rpb24gY3JlYXRlR3VpZCgpIHtcbiAgICAvLyBDb2RlIGNvcGllZCBmcm9tIGVuZ2FnZV9mdWxsIChvcmlnaW5hbGx5LCBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzEwNTAzNC9jcmVhdGUtZ3VpZC11dWlkLWluLWphdmFzY3JpcHQpXG4gICAgcmV0dXJuICd4eHh4eHh4eC14eHh4LTR4eHgteXh4eC14eHh4eHh4eHh4eHgnLnJlcGxhY2UoL1t4eV0vZywgZnVuY3Rpb24gKGMpIHtcbiAgICAgICAgdmFyIHIgPSBNYXRoLnJhbmRvbSgpICogMTYgfCAwLCB2ID0gYyA9PSAneCcgPyByIDogKHIgJiAweDMgfCAweDgpO1xuICAgICAgICByZXR1cm4gdi50b1N0cmluZygxNik7XG4gICAgfSk7XG59XG5cbnZhciBhdHRyaWJ1dGVzID0ge1xuICAgIGV2ZW50VHlwZTogJ2V0JyxcbiAgICBldmVudFZhbHVlOiAnZXYnLFxuICAgIGdyb3VwSWQ6ICdnaWQnLFxuICAgIHVzZXJJZDogJ3VpZCcsXG4gICAgcGFnZUlkOiAncGlkJyxcbiAgICBsb25nVGVybVNlc3Npb246ICdsdHMnLFxuICAgIHNob3J0VGVybVNlc3Npb246ICdzdHMnLFxuICAgIHJlZmVycmVyVXJsOiAncmVmJyxcbiAgICBjb250ZW50SWQ6ICdjaWQnLFxuICAgIGFydGljbGVIZWlnaHQ6ICdhaCcsXG4gICAgY29udGFpbmVySGFzaDogJ2NoJyxcbiAgICBjb250YWluZXJLaW5kOiAnY2snLFxuICAgIHJlYWN0aW9uQm9keTogJ3InLFxuICAgIHBhZ2VUaXRsZTogJ3B0JyxcbiAgICBjYW5vbmljYWxVcmw6ICdjdScsXG4gICAgcGFnZVVybDogJ3B1JyxcbiAgICBjb250ZW50QXR0cmlidXRlczogJ2NhJyxcbiAgICBjb250ZW50TG9jYXRpb246ICdjbCcsXG4gICAgcGFnZVRvcGljczogJ3B0b3AnLFxuICAgIGF1dGhvcjogJ2EnLFxuICAgIHNpdGVTZWN0aW9uOiAnc2VjJyxcbiAgICBpc1RvdWNoQnJvd3NlcjogJ2l0JyxcbiAgICBzY3JlZW5XaWR0aDogJ3N3JyxcbiAgICBzY3JlZW5IZWlnaHQ6ICdzaCcsXG4gICAgcGl4ZWxEZW5zaXR5OiAncGQnLFxuICAgIHVzZXJBZ2VudDogJ3VhJ1xufTtcblxudmFyIGV2ZW50VHlwZXMgPSB7XG4gICAgc2NyaXB0TG9hZDogJ3NsJyxcbiAgICByZWFjdGlvblNoYXJlZDogJ3NoJyxcbiAgICBzdW1tYXJ5V2lkZ2V0OiAnc2InLFxuICAgIHJlYWN0aW9uV2lkZ2V0T3BlbmVkOiAncnMnLFxuICAgIHBhZ2VEYXRhTG9hZGVkOiAnd2wnLFxuICAgIGNvbW1lbnRDcmVhdGVkOiAnYycsXG4gICAgcmVhY3Rpb25DcmVhdGVkOiAncmUnLFxuICAgIGNvbW1lbnRzVmlld2VkOiAndmNvbScsXG4gICAgcmVjaXJjQ2xpY2tlZDogJ3JjJ1xufTtcblxudmFyIGV2ZW50VmFsdWVzID0ge1xuICAgIGNvbnRlbnRWaWV3ZWQ6ICd2YycsIC8vIHZpZXdfY29udGVudFxuICAgIGxvY2F0aW9uc1ZpZXdlZDogJ3ZyJywgLy8gdmlld19yZWFjdGlvbnNcbiAgICBzaG93RGVmYXVsdHM6ICd3cicsXG4gICAgc2hvd1JlYWN0aW9uczogJ3JkJyxcbiAgICBzaW5nbGVQYWdlOiAnc2knLFxuICAgIG11bHRpcGxlUGFnZXM6ICdtdScsXG4gICAgdmlld1JlYWN0aW9uczogJ3Z3JyxcbiAgICB2aWV3RGVmYXVsdHM6ICdhZCdcbn07XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBwb3N0R3JvdXBTZXR0aW5nc0xvYWRlZDogcG9zdEdyb3VwU2V0dGluZ3NMb2FkZWQsXG4gICAgcG9zdFBhZ2VEYXRhTG9hZGVkOiBwb3N0UGFnZURhdGFMb2FkZWQsXG4gICAgcG9zdFN1bW1hcnlPcGVuZWQ6IHBvc3RTdW1tYXJ5T3BlbmVkLFxuICAgIHBvc3RDb21tZW50c1ZpZXdlZDogcG9zdENvbW1lbnRzVmlld2VkLFxuICAgIHBvc3RDb21tZW50Q3JlYXRlZDogcG9zdENvbW1lbnRDcmVhdGVkLFxuICAgIHBvc3RSZWFjdGlvbldpZGdldE9wZW5lZDogcG9zdFJlYWN0aW9uV2lkZ2V0T3BlbmVkLFxuICAgIHBvc3RSZWFjdGlvbkNyZWF0ZWQ6IHBvc3RSZWFjdGlvbkNyZWF0ZWQsXG4gICAgcG9zdFJlYWN0aW9uU2hhcmVkOiBwb3N0UmVhY3Rpb25TaGFyZWQsXG4gICAgcG9zdExvY2F0aW9uc1ZpZXdlZDogcG9zdExvY2F0aW9uc1ZpZXdlZCxcbiAgICBwb3N0Q29udGVudFZpZXdlZDogcG9zdENvbnRlbnRWaWV3ZWQsXG4gICAgcG9zdFJlY2lyY0NsaWNrZWQ6IHBvc3RSZWNpcmNDbGlja2VkXG59OyIsInZhciAkOyByZXF1aXJlKCcuL3V0aWxzL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIEFqYXhDbGllbnQgPSByZXF1aXJlKCcuL3V0aWxzL2FqYXgtY2xpZW50Jyk7XG52YXIgVVJMcyA9IHJlcXVpcmUoJy4vdXRpbHMvdXJscycpO1xudmFyIEdyb3VwU2V0dGluZ3MgPSByZXF1aXJlKCcuL2dyb3VwLXNldHRpbmdzJyk7XG5cbi8vIFRPRE8gZm9sZCB0aGlzIG1vZHVsZSBpbnRvIGdyb3VwLXNldHRpbmdzP1xuXG5mdW5jdGlvbiBsb2FkU2V0dGluZ3MoY2FsbGJhY2spIHtcbiAgICBBamF4Q2xpZW50LmdldEpTT05QKFVSTHMuZ3JvdXBTZXR0aW5nc1VybCgpLCB7IGhvc3RfbmFtZTogd2luZG93LmFudGVubmFfaG9zdCB9LCBzdWNjZXNzLCBlcnJvcik7XG5cbiAgICBmdW5jdGlvbiBzdWNjZXNzKGpzb24pIHtcbiAgICAgICAgdmFyIGdyb3VwU2V0dGluZ3MgPSBHcm91cFNldHRpbmdzLmNyZWF0ZShqc29uKTtcbiAgICAgICAgY2FsbGJhY2soZ3JvdXBTZXR0aW5ncyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZXJyb3IobWVzc2FnZSkge1xuICAgICAgICAvLyBUT0RPIGhhbmRsZSBlcnJvcnMgdGhhdCBoYXBwZW4gd2hlbiBsb2FkaW5nIGNvbmZpZyBkYXRhXG4gICAgICAgIGNvbnNvbGUubG9nKCdBbiBlcnJvciBvY2N1cnJlZCBsb2FkaW5nIGdyb3VwIHNldHRpbmdzOiAnICsgbWVzc2FnZSk7XG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgbG9hZDogbG9hZFNldHRpbmdzXG59OyIsInZhciAkOyByZXF1aXJlKCcuL3V0aWxzL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xuXG52YXIgRXZlbnRzID0gcmVxdWlyZSgnLi9ldmVudHMnKTtcblxudmFyIGdyb3VwU2V0dGluZ3M7XG5cbi8vIFRPRE86IFVwZGF0ZSBhbGwgY2xpZW50cyB0aGF0IGFyZSBwYXNzaW5nIGFyb3VuZCBhIGdyb3VwU2V0dGluZ3Mgb2JqZWN0IHRvIGluc3RlYWQgYWNjZXNzIHRoZSAnZ2xvYmFsJyBzZXR0aW5ncyBpbnN0YW5jZVxuZnVuY3Rpb24gZ2V0R3JvdXBTZXR0aW5ncygpIHtcbiAgICByZXR1cm4gZ3JvdXBTZXR0aW5ncztcbn1cblxuZnVuY3Rpb24gdXBkYXRlRnJvbUpTT04oanNvbikge1xuICAgIGdyb3VwU2V0dGluZ3MgPSBjcmVhdGVGcm9tSlNPTihqc29uKTtcbiAgICBFdmVudHMucG9zdEdyb3VwU2V0dGluZ3NMb2FkZWQoZ3JvdXBTZXR0aW5ncyk7XG4gICAgcmV0dXJuIGdyb3VwU2V0dGluZ3M7XG59XG5cblxuLy8gVE9ETzogdHJpbSB0cmFpbGluZyBjb21tYXMgZnJvbSBhbnkgc2VsZWN0b3IgdmFsdWVzXG5cbi8vIFRPRE86IFJldmlldy4gVGhlc2UgYXJlIGp1c3QgY29waWVkIGZyb20gZW5nYWdlX2Z1bGwuXG52YXIgZGVmYXVsdHMgPSB7XG4gICAgcHJlbWl1bTogZmFsc2UsXG4gICAgaW1nX3NlbGVjdG9yOiBcImltZ1wiLCAvLyBUT0RPOiB0aGlzIGlzIHNvbWUgYm9ndXMgb2Jzb2xldGUgcHJvcGVydHkuIHdlIHNob3VsZG4ndCB1c2UgaXQuXG4gICAgaW1nX2NvbnRhaW5lcl9zZWxlY3RvcnM6XCIjcHJpbWFyeS1waG90b1wiLFxuICAgIGFjdGl2ZV9zZWN0aW9uczogXCJib2R5XCIsXG4gICAgLy9hbm5vX3doaXRlbGlzdDogXCJib2R5IHBcIixcbiAgICBhbm5vX3doaXRlbGlzdDogXCJwXCIsIC8vIFRPRE86IFRoZSBjdXJyZW50IGRlZmF1bHQgaXMgXCJib2R5IHBcIiwgd2hpY2ggbWFrZXMgbm8gc2Vuc2Ugd2hlbiB3ZSdyZSBzZWFyY2hpbmcgb25seSB3aXRoaW4gdGhlIGFjdGl2ZSBzZWN0aW9uc1xuICAgIGFjdGl2ZV9zZWN0aW9uc193aXRoX2Fubm9fd2hpdGVsaXN0OlwiXCIsXG4gICAgbWVkaWFfc2VsZWN0b3I6IFwiZW1iZWQsIHZpZGVvLCBvYmplY3QsIGlmcmFtZVwiLFxuICAgIGNvbW1lbnRfbGVuZ3RoOiA1MDAsXG4gICAgbm9fYW50OiBcIlwiLFxuICAgIGltZ19ibGFja2xpc3Q6IFwiXCIsXG4gICAgY3VzdG9tX2NzczogXCJcIixcbiAgICAvL3RvZG86IHRlbXAgaW5saW5lX2luZGljYXRvciBkZWZhdWx0cyB0byBtYWtlIHRoZW0gc2hvdyB1cCBvbiBhbGwgbWVkaWEgLSByZW1vdmUgdGhpcyBsYXRlci5cbiAgICBpbmxpbmVfc2VsZWN0b3I6ICdpbWcsIGVtYmVkLCB2aWRlbywgb2JqZWN0LCBpZnJhbWUnLFxuICAgIHBhcmFncmFwaF9oZWxwZXI6IHRydWUsXG4gICAgbWVkaWFfdXJsX2lnbm9yZV9xdWVyeTogdHJ1ZSxcbiAgICBzdW1tYXJ5X3dpZGdldF9zZWxlY3RvcjogJy5hbnQtcGFnZS1zdW1tYXJ5JywgLy8gVE9ETzogdGhpcyB3YXNuJ3QgZGVmaW5lZCBhcyBhIGRlZmF1bHQgaW4gZW5nYWdlX2Z1bGwsIGJ1dCB3YXMgaW4gY29kZS4gd2h5P1xuICAgIHN1bW1hcnlfd2lkZ2V0X21ldGhvZDogJ2FmdGVyJyxcbiAgICBsYW5ndWFnZTogJ2VuJyxcbiAgICBhYl90ZXN0X2ltcGFjdDogdHJ1ZSxcbiAgICBhYl90ZXN0X3NhbXBsZV9wZXJjZW50YWdlOiAxMCxcbiAgICBpbWdfaW5kaWNhdG9yX3Nob3dfb25sb2FkOiB0cnVlLFxuICAgIGltZ19pbmRpY2F0b3Jfc2hvd19zaWRlOiAnbGVmdCcsXG4gICAgdGFnX2JveF9iZ19jb2xvcnM6ICcnLFxuICAgIHRhZ19ib3hfdGV4dF9jb2xvcnM6ICcnLFxuICAgIHRhZ19ib3hfZm9udF9mYW1pbHk6ICdIZWx2ZXRpY2FOZXVlLEhlbHZldGljYSxBcmlhbCxzYW5zLXNlcmlmJyxcbiAgICB0YWdzX2JnX2NzczogJycsXG4gICAgaWdub3JlX3N1YmRvbWFpbjogZmFsc2UsXG4gICAgaW1hZ2Vfc2VsZWN0b3I6ICdtZXRhW3Byb3BlcnR5PVwib2c6aW1hZ2VcIl0nLCAvLyBUT0RPOiByZXZpZXcgd2hhdCB0aGlzIHNob3VsZCBiZSAobm90IGZyb20gZW5nYWdlX2Z1bGwpXG4gICAgaW1hZ2VfYXR0cmlidXRlOiAnY29udGVudCcsIC8vIFRPRE86IHJldmlldyB3aGF0IHRoaXMgc2hvdWxkIGJlIChub3QgZnJvbSBlbmdhZ2VfZnVsbCksXG4gICAgcXVlcnlzdHJpbmdfY29udGVudDogZmFsc2UsXG4gICAgLy90aGUgc2NvcGUgaW4gd2hpY2ggdG8gZmluZCBwYXJlbnRzIG9mIDxicj4gdGFncy5cbiAgICAvL1Rob3NlIHBhcmVudHMgd2lsbCBiZSBjb252ZXJ0ZWQgdG8gYSA8cnQ+IGJsb2NrLCBzbyB0aGVyZSB3b24ndCBiZSBuZXN0ZWQgPHA+IGJsb2Nrcy5cbiAgICAvL3RoZW4gaXQgd2lsbCBzcGxpdCB0aGUgcGFyZW50J3MgaHRtbCBvbiA8YnI+IHRhZ3MgYW5kIHdyYXAgdGhlIHNlY3Rpb25zIGluIDxwPiB0YWdzLlxuXG4gICAgLy9leGFtcGxlOlxuICAgIC8vIGJyX3JlcGxhY2Vfc2NvcGVfc2VsZWN0b3I6IFwiLmFudF9icl9yZXBsYWNlXCIgLy9lLmcuIFwiI21haW5zZWN0aW9uXCIgb3IgXCJwXCJcblxuICAgIGJyX3JlcGxhY2Vfc2NvcGVfc2VsZWN0b3I6IG51bGwgLy9lLmcuIFwiI21haW5zZWN0aW9uXCIgb3IgXCJwXCJcbn07XG5cbmZ1bmN0aW9uIGNyZWF0ZUZyb21KU09OKGpzb24pIHtcblxuICAgIGZ1bmN0aW9uIGRhdGEoa2V5LCBpZkFic2VudCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgdmFsdWU7XG4gICAgICAgICAgICBpZiAod2luZG93LmFudGVubmFfZXh0ZW5kKSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSB3aW5kb3cuYW50ZW5uYV9leHRlbmRba2V5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IGpzb25ba2V5XTtcbiAgICAgICAgICAgICAgICAvLyBUT0RPOiBvdXIgc2VydmVyIGFwcGFyZW50bHkgc2VuZHMgYmFjayBudWxsIGFzIGEgdmFsdWUgZm9yIHNvbWUgYXR0cmlidXRlcy5cbiAgICAgICAgICAgICAgICAvLyBUT0RPOiBjb25zaWRlciBjaGVja2luZyBmb3IgbnVsbCB3aGVyZXZlciB3ZSdyZSBjaGVja2luZyBmb3IgdW5kZWZpbmVkXG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09ICcnIHx8IHZhbHVlID09PSBudWxsKSB7IC8vIFRPRE86IFNob3VsZCB0aGUgc2VydmVyIGJlIHNlbmRpbmcgYmFjayAnJyBoZXJlIG9yIG5vdGhpbmcgYXQgYWxsPyAoSXQgcHJlY2x1ZGVzIHRoZSBzZXJ2ZXIgZnJvbSByZWFsbHkgc2F5aW5nICdub3RoaW5nJylcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBkZWZhdWx0c1trZXldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaWZBYnNlbnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZGF0YU9yRGVwcmVjYXRlZChrZXksIGRlcHJlY2F0ZWRLZXkpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIGRhdGEoa2V5KSgpIHx8IGRhdGEoZGVwcmVjYXRlZEtleSkoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGJhY2tncm91bmRDb2xvcihhY2Nlc3Nvcikge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgY29sb3JzID0gW107XG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBhY2Nlc3NvcigpO1xuICAgICAgICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgY29sb3JzID0gdmFsdWUuc3BsaXQoJzsnKTtcbiAgICAgICAgICAgICAgICBjb2xvcnMgPSBtaWdyYXRlVmFsdWVzKGNvbG9ycyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gY29sb3JzO1xuXG4gICAgICAgICAgICAvLyBNaWdyYXRlIGFueSBjb2xvcnMgZnJvbSB0aGUgJzEsIDIsIDMnIGZvcm1hdCB0byAncmdiKDEsIDIsIDMpJy4gVGhpcyBjb2RlIGNhbiBiZSBkZWxldGVkIG9uY2Ugd2UndmUgdXBkYXRlZFxuICAgICAgICAgICAgLy8gYWxsIHNpdGVzIHRvIHNwZWNpZnlpbmcgdmFsaWQgQ1NTIGNvbG9yIHZhbHVlc1xuICAgICAgICAgICAgZnVuY3Rpb24gbWlncmF0ZVZhbHVlcyhjb2xvclZhbHVlcykge1xuICAgICAgICAgICAgICAgIHZhciBtaWdyYXRpb25NYXRjaGVyID0gL15cXHMqXFxkK1xccyosXFxzKlxcZCtcXHMqLFxccypcXGQrXFxzKiQvZ2ltO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY29sb3JWYWx1ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gY29sb3JWYWx1ZXNbaV07XG4gICAgICAgICAgICAgICAgICAgIGlmIChtaWdyYXRpb25NYXRjaGVyLnRlc3QodmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xvclZhbHVlc1tpXSA9ICdyZ2IoJyArIHZhbHVlICsgJyknO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBjb2xvclZhbHVlcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRlZmF1bHRSZWFjdGlvbnMoJGVsZW1lbnQpIHtcbiAgICAgICAgLy8gRGVmYXVsdCByZWFjdGlvbnMgYXJlIGF2YWlsYWJsZSBpbiB0aHJlZSBsb2NhdGlvbnMgaW4gdGhyZWUgZGF0YSBmb3JtYXRzOlxuICAgICAgICAvLyAxLiBBcyBhIGNvbW1hLXNlcGFyYXRlZCBhdHRyaWJ1dGUgdmFsdWUgb24gYSBwYXJ0aWN1bGFyIGVsZW1lbnRcbiAgICAgICAgLy8gMi4gQXMgYW4gYXJyYXkgb2Ygc3RyaW5ncyBvbiB0aGUgd2luZG93LmFudGVubmFfZXh0ZW5kIHByb3BlcnR5XG4gICAgICAgIC8vIDMuIEFzIGEganNvbiBvYmplY3Qgd2l0aCBhIGJvZHkgYW5kIGlkIG9uIHRoZSBncm91cCBzZXR0aW5nc1xuICAgICAgICB2YXIgcmVhY3Rpb25zID0gW107XG4gICAgICAgIHZhciByZWFjdGlvblN0cmluZ3M7XG4gICAgICAgIHZhciBlbGVtZW50UmVhY3Rpb25zID0gJGVsZW1lbnQgPyAkZWxlbWVudC5hdHRyKCdhbnQtcmVhY3Rpb25zJykgOiB1bmRlZmluZWQ7XG4gICAgICAgIGlmIChlbGVtZW50UmVhY3Rpb25zKSB7XG4gICAgICAgICAgICByZWFjdGlvblN0cmluZ3MgPSBlbGVtZW50UmVhY3Rpb25zLnNwbGl0KCc7Jyk7XG4gICAgICAgIH0gZWxzZSBpZiAod2luZG93LmFudGVubmFfZXh0ZW5kKSB7XG4gICAgICAgICAgICByZWFjdGlvblN0cmluZ3MgPSB3aW5kb3cuYW50ZW5uYV9leHRlbmRbJ2RlZmF1bHRfcmVhY3Rpb25zJ107XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJlYWN0aW9uU3RyaW5ncykge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZWFjdGlvblN0cmluZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICByZWFjdGlvbnMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIHRleHQ6IHJlYWN0aW9uU3RyaW5nc1tpXSxcbiAgICAgICAgICAgICAgICAgICAgaXNEZWZhdWx0OiB0cnVlXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciB2YWx1ZXMgPSBqc29uWydkZWZhdWx0X3JlYWN0aW9ucyddO1xuICAgICAgICAgICAgaWYgKHZhbHVlcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCB2YWx1ZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gdmFsdWVzW2pdO1xuICAgICAgICAgICAgICAgICAgICByZWFjdGlvbnMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiB2YWx1ZS5ib2R5LFxuICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IHZhbHVlLmlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgaXNEZWZhdWx0OiB0cnVlXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVhY3Rpb25zO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNvbXB1dGVDdXN0b21DU1MoKSB7XG4gICAgICAgIC8vIEZpcnN0IHJlYWQgYW55IHJhdyBjdXN0b20gQ1NTLlxuICAgICAgICB2YXIgY3VzdG9tQ1NTID0gZGF0YSgnY3VzdG9tX2NzcycpKCk7XG4gICAgICAgIC8vIFRoZW4gYXBwZW5kIHJ1bGVzIGZvciBhbnkgc3BlY2lmaWMgQ1NTIG92ZXJyaWRlcy5cbiAgICAgICAgY3VzdG9tQ1NTICs9IGNyZWF0ZUN1c3RvbUNTU1J1bGUoZGF0YSgndGFnc19iZ19jc3MnLCAnJyksICcuYW50ZW5uYS1yZWFjdGlvbnMtcGFnZSAuYW50ZW5uYS1ib2R5LCAuYW50ZW5uYS1kZWZhdWx0cy1wYWdlIC5hbnRlbm5hLWJvZHknKTtcbiAgICAgICAgY3VzdG9tQ1NTICs9IGNyZWF0ZUN1c3RvbUNTU1J1bGUoZGF0YSgndGFnX2JveF9iZ19jb2xvcnMnLCAnJyksICcuYW50ZW5uYS1yZWFjdGlvbi1ib3gnKTtcbiAgICAgICAgY3VzdG9tQ1NTICs9IGNyZWF0ZUN1c3RvbUNTU1J1bGUoZGF0YSgndGFnX2JveF9iZ19jb2xvcnNfaG92ZXInLCAnJyksICcuYW50ZW5uYS1yZWFjdGlvbjpob3ZlciA+IC5hbnRlbm5hLXJlYWN0aW9uLWJveCcpO1xuICAgICAgICBjdXN0b21DU1MgKz0gY3JlYXRlQ3VzdG9tQ1NTUnVsZShtaWdyYXRlVGV4dENvbG9yU2V0dGluZ3MoZGF0YSgndGFnX2JveF90ZXh0X2NvbG9ycycsICcnKSksICcuYW50ZW5uYS1yZWFjdGlvbi1ib3gsIC5hbnRlbm5hLXJlYWN0aW9uLWNvbW1lbnRzIC5hbnRlbm5hLWNvbW1lbnRzLXBhdGgsIC5hbnRlbm5hLXJlYWN0aW9uLWxvY2F0aW9uIC5hbnRlbm5hLWxvY2F0aW9uLXBhdGgnKTtcbiAgICAgICAgY3VzdG9tQ1NTICs9IGNyZWF0ZUN1c3RvbUNTU1J1bGUobWlncmF0ZUZvbnRGYW1pbHlTZXR0aW5nKGRhdGEoJ3RhZ19ib3hfZm9udF9mYW1pbHknLCAnJykpLCAnLmFudGVubmEtcmVhY3Rpb24tYm94Jyk7XG4gICAgICAgIHJldHVybiBjdXN0b21DU1M7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY3JlYXRlQ3VzdG9tQ1NTUnVsZShkZWNsYXJhdGlvbnNBY2Nlc3Nvciwgc2VsZWN0b3IpIHtcbiAgICAgICAgdmFyIGRlY2xhcmF0aW9ucyA9IGRlY2xhcmF0aW9uc0FjY2Vzc29yKCkudHJpbSgpO1xuICAgICAgICBpZiAoZGVjbGFyYXRpb25zKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1xcbicgKyBzZWxlY3RvciArICcge1xcbiAgICAnICsgZGVjbGFyYXRpb25zICsgJ1xcbn0nO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnJztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtaWdyYXRlRm9udEZhbWlseVNldHRpbmcoZm9udEZhbWlseUFjY2Vzc29yKSB7XG4gICAgICAgIC8vIFRPRE86IFRoaXMgaXMgdGVtcG9yYXJ5IGNvZGUgdGhhdCBtaWdyYXRlcyB0aGUgY3VycmVudCB0YWdfYm94X2ZvbnRfZmFtaWx5IHNldHRpbmcgZnJvbSBhIHJhdyB2YWx1ZSB0byBhXG4gICAgICAgIC8vICAgICAgIENTUyBkZWNsYXJhdGlvbi4gV2Ugc2hvdWxkIG1pZ3JhdGUgYWxsIGRlcGxveWVkIHNpdGVzIHRvIHVzZSBhIENTUyBkZWNsYXJhdGlvbiBhbmQgdGhlbiByZW1vdmUgdGhpcy5cbiAgICAgICAgdmFyIGZvbnRGYW1pbHkgPSBmb250RmFtaWx5QWNjZXNzb3IoKS50cmltKCk7XG4gICAgICAgIGlmIChmb250RmFtaWx5ICYmIGZvbnRGYW1pbHkuaW5kZXhPZignZm9udC1mYW1pbHknKSA9PT0gLTEpIHtcbiAgICAgICAgICAgIGZvbnRGYW1pbHkgPSAnZm9udC1mYW1pbHk6ICcgKyBmb250RmFtaWx5O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBmb250RmFtaWx5O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWlncmF0ZVRleHRDb2xvclNldHRpbmdzKHRleHRDb2xvckFjY2Vzc29yKSB7XG4gICAgICAgIC8vIFRPRE86IFRoaXMgaXMgdGVtcG9yYXJ5IGNvZGUgdGhhdCBtaWdyYXRlcyB0aGUgY3VycmVudCB0YWdfYm94X3RleHRfY29sb3JzIHByb3BlcnR5LCB3aGljaCBpcyBhIGRlY2xhcmF0aW9uXG4gICAgICAgIC8vICAgICAgIHRoYXQgb25seSBzZXRzIHRoZSBjb2xvciBwcm9wZXJ0eSwgdG8gc2V0IGJvdGggdGhlIGNvbG9yIGFuZCBmaWxsIHByb3BlcnRpZXMuXG4gICAgICAgIHZhciB0ZXh0Q29sb3IgPSB0ZXh0Q29sb3JBY2Nlc3NvcigpLnRyaW0oKTtcbiAgICAgICAgaWYgKHRleHRDb2xvciAmJiB0ZXh0Q29sb3IuaW5kZXhPZignY29sb3I6JykgPT09IDAgJiYgdGV4dENvbG9yLmluZGV4T2YoJ2ZpbGw6JykgPT09IC0xKSB7XG4gICAgICAgICAgICB0ZXh0Q29sb3IgKz0gdGV4dENvbG9yW3RleHRDb2xvci5sZW5ndGggLSAxXSA9PSAnOycgPyAnJyA6ICc7JzsgLy8gYXBwZW5kIGEgc2VtaWNvbG9uIGlmIG5lZWRlZFxuICAgICAgICAgICAgdGV4dENvbG9yICs9IHRleHRDb2xvci5yZXBsYWNlKCdjb2xvcjonLCAnXFxuICAgIGZpbGw6Jyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRleHRDb2xvcjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIGxlZ2FjeUJlaGF2aW9yOiBkYXRhKCdsZWdhY3lfYmVoYXZpb3InLCBmYWxzZSksIC8vIFRPRE86IG1ha2UgdGhpcyByZWFsIGluIHRoZSBzZW5zZSB0aGF0IGl0IGNvbWVzIGJhY2sgZnJvbSB0aGUgc2VydmVyIGFuZCBwcm9iYWJseSBtb3ZlIHRoZSBmbGFnIHRvIHRoZSBwYWdlIGRhdGEuIFVubGlrZWx5IHRoYXQgd2UgbmVlZCB0byBtYWludGFpbiBsZWdhY3kgYmVoYXZpb3IgZm9yIG5ldyBwYWdlcz9cbiAgICAgICAgZ3JvdXBJZDogZGF0YSgnaWQnKSxcbiAgICAgICAgZ3JvdXBOYW1lOiBkYXRhKCduYW1lJyksXG4gICAgICAgIGFjdGl2ZVNlY3Rpb25zOiBkYXRhKCdhY3RpdmVfc2VjdGlvbnMnKSxcbiAgICAgICAgdXJsOiB7XG4gICAgICAgICAgICBpZ25vcmVTdWJkb21haW46IGRhdGEoJ2lnbm9yZV9zdWJkb21haW4nKSxcbiAgICAgICAgICAgIGluY2x1ZGVRdWVyeVN0cmluZzogZGF0YSgncXVlcnlzdHJpbmdfY29udGVudCcpLFxuICAgICAgICAgICAgY2Fub25pY2FsRG9tYWluOiBkYXRhKCdwYWdlX3RsZCcpIC8vIFRPRE86IHdoYXQgdG8gY2FsbCB0aGlzIGV4YWN0bHkuIGdyb3VwRG9tYWluPyBzaXRlRG9tYWluPyBjYW5vbmljYWxEb21haW4/XG4gICAgICAgIH0sXG4gICAgICAgIHN1bW1hcnlTZWxlY3RvcjogZGF0YSgnc3VtbWFyeV93aWRnZXRfc2VsZWN0b3InKSxcbiAgICAgICAgc3VtbWFyeU1ldGhvZDogZGF0YSgnc3VtbWFyeV93aWRnZXRfbWV0aG9kJyksXG4gICAgICAgIGlzRXhwYW5kZWRNb2JpbGVTdW1tYXJ5OiBkYXRhKCdzdW1tYXJ5X3dpZGdldF9leHBhbmRlZF9tb2JpbGUnKSxcbiAgICAgICAgcGFnZVNlbGVjdG9yOiBkYXRhKCdwb3N0X3NlbGVjdG9yJyksXG4gICAgICAgIHBhZ2VMaW5rU2VsZWN0b3I6IGRhdGEoJ3Bvc3RfaHJlZl9zZWxlY3RvcicpLFxuICAgICAgICBwYWdlSW1hZ2VTZWxlY3RvcjogZGF0YSgnaW1hZ2Vfc2VsZWN0b3InKSxcbiAgICAgICAgcGFnZUltYWdlQXR0cmlidXRlOiBkYXRhKCdpbWFnZV9hdHRyaWJ1dGUnKSxcbiAgICAgICAgcGFnZUF1dGhvclNlbGVjdG9yOiBkYXRhKCdhdXRob3Jfc2VsZWN0b3InKSxcbiAgICAgICAgcGFnZUF1dGhvckF0dHJpYnV0ZTogZGF0YSgnYXV0aG9yX2F0dHJpYnV0ZScpLFxuICAgICAgICBwYWdlVG9waWNzU2VsZWN0b3I6IGRhdGEoJ3RvcGljc19zZWxlY3RvcicpLFxuICAgICAgICBwYWdlVG9waWNzQXR0cmlidXRlOiBkYXRhKCd0b3BpY3NfYXR0cmlidXRlJyksXG4gICAgICAgIHBhZ2VTaXRlU2VjdGlvblNlbGVjdG9yOiBkYXRhKCdzZWN0aW9uX3NlbGVjdG9yJyksXG4gICAgICAgIHBhZ2VTaXRlU2VjdGlvbkF0dHJpYnV0ZTogZGF0YSgnc2VjdGlvbl9hdHRyaWJ1dGUnKSxcbiAgICAgICAgY29udGVudFNlbGVjdG9yOiBkYXRhKCdhbm5vX3doaXRlbGlzdCcpLFxuICAgICAgICB0ZXh0SW5kaWNhdG9yTGltaXQ6IGRhdGEoJ2luaXRpYWxfcGluX2xpbWl0JyksXG4gICAgICAgIGVuYWJsZVRleHRIZWxwZXI6IGRhdGEoJ3BhcmFncmFwaF9oZWxwZXInKSxcbiAgICAgICAgbWVkaWFJbmRpY2F0b3JDb3JuZXI6IGRhdGEoJ2ltZ19pbmRpY2F0b3Jfc2hvd19zaWRlJyksXG4gICAgICAgIGdlbmVyYXRlZEN0YVNlbGVjdG9yOiBkYXRhKCdzZXBhcmF0ZV9jdGEnKSxcbiAgICAgICAgZ2VuZXJhdGVkQ3RhRXhwYW5kZWQ6IGRhdGEoJ3NlcGFyYXRlX2N0YV9leHBhbmRlZCcpLFxuICAgICAgICBkZWZhdWx0UmVhY3Rpb25zOiBkZWZhdWx0UmVhY3Rpb25zLFxuICAgICAgICBjdXN0b21DU1M6IGNvbXB1dGVDdXN0b21DU1MsXG4gICAgICAgIGV4Y2x1c2lvblNlbGVjdG9yOiBkYXRhT3JEZXByZWNhdGVkKCdub19hbnQnLCAnbm9fcmVhZHInKSxcbiAgICAgICAgbGFuZ3VhZ2U6IGRhdGEoJ2xhbmd1YWdlJyksXG4gICAgICAgIHR3aXR0ZXJBY2NvdW50OiBkYXRhKCd0d2l0dGVyJylcbiAgICB9XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGU6IHVwZGF0ZUZyb21KU09OLFxuICAgIGdldDogZ2V0R3JvdXBTZXR0aW5nc1xufTsiLCIvLyBUaGlzIG1vZHVsZSBzdG9yZXMgb3VyIG1hcHBpbmcgZnJvbSBoYXNoIHZhbHVlcyB0byB0aGVpciBjb3JyZXNwb25kaW5nIGVsZW1lbnRzIGluIHRoZSBET00uIFRoZSBkYXRhIGlzIG9yZ2FuaXplZFxuLy8gYnkgcGFnZSBmb3IgdGhlIGJsb2cgcm9sbCBjYXNlLCB3aGVyZSBtdWx0aXBsZSBwYWdlcyBvZiBkYXRhIGNhbiBiZSBsb2FkZWQgYXQgb25jZS5cbnZhciBwYWdlcyA9IHt9O1xuXG5mdW5jdGlvbiBnZXRFbGVtZW50KGNvbnRhaW5lckhhc2gsIHBhZ2VIYXNoKSB7XG4gICAgdmFyIGNvbnRhaW5lcnMgPSBwYWdlc1twYWdlSGFzaF07XG4gICAgaWYgKGNvbnRhaW5lcnMpIHtcbiAgICAgICAgcmV0dXJuIGNvbnRhaW5lcnNbY29udGFpbmVySGFzaF07XG4gICAgfVxufVxuXG5mdW5jdGlvbiBzZXRFbGVtZW50KGNvbnRhaW5lckhhc2gsIHBhZ2VIYXNoLCBlbGVtZW50KSB7XG4gICAgdmFyIGNvbnRhaW5lcnMgPSBwYWdlc1twYWdlSGFzaF07XG4gICAgaWYgKCFjb250YWluZXJzKSB7XG4gICAgICAgIGNvbnRhaW5lcnMgPSBwYWdlc1twYWdlSGFzaF0gPSB7fTtcbiAgICB9XG4gICAgY29udGFpbmVyc1tjb250YWluZXJIYXNoXSA9IGVsZW1lbnQ7XG59XG5cbi8vIFdoZW4gd2UgZmlyc3Qgc2NhbiBhIHBhZ2UsIHRoZSBcImhhc2hcIiBpcyBqdXN0IHRoZSBVUkwgd2hpbGUgd2Ugd2FpdCB0byBoZWFyIGJhY2sgZnJvbSB0aGUgc2VydmVyLCB0aGVuIGl0J3MgdXBkYXRlZFxuLy8gdG8gd2hhdGV2ZXIgdmFsdWUgdGhlIHNlcnZlciBjb21wdXRlZC4gU28gaGVyZSB3ZSBhbGxvdyBvdXIgbWFwcGluZyB0byBiZSB1cGRhdGVkIHdoZW4gdGhhdCBjaGFuZ2UgaGFwcGVucy5cbmZ1bmN0aW9uIHVwZGF0ZVBhZ2VIYXNoKG9sZFBhZ2VIYXNoLCBuZXdQYWdlSGFzaCkge1xuICAgIHBhZ2VzW25ld1BhZ2VIYXNoXSA9IHBhZ2VzW29sZFBhZ2VIYXNoXTtcbiAgICBkZWxldGUgcGFnZXNbb2xkUGFnZUhhc2hdO1xufVxuXG5mdW5jdGlvbiB0ZWFyZG93bigpIHtcbiAgICBwYWdlcyA9IHt9O1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgZ2V0RWxlbWVudDogZ2V0RWxlbWVudCxcbiAgICBzZXRFbGVtZW50OiBzZXRFbGVtZW50LFxuICAgIHVwZGF0ZVBhZ2VIYXNoOiB1cGRhdGVQYWdlSGFzaCxcbiAgICB0ZWFyZG93bjogdGVhcmRvd25cbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgUmFjdGl2ZTsgcmVxdWlyZSgnLi91dGlscy9yYWN0aXZlLXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGxvYWRlZFJhY3RpdmUpIHsgUmFjdGl2ZSA9IGxvYWRlZFJhY3RpdmU7fSk7XG52YXIgUmFuZ2UgPSByZXF1aXJlKCcuL3V0aWxzL3JhbmdlJyk7XG5cbnZhciBFdmVudHMgPSByZXF1aXJlKCcuL2V2ZW50cycpO1xudmFyIEhhc2hlZEVsZW1lbnRzID0gcmVxdWlyZSgnLi9oYXNoZWQtZWxlbWVudHMnKTtcbnZhciBQYWdlRGF0YSA9IHJlcXVpcmUoJy4vcGFnZS1kYXRhJyk7XG52YXIgU1ZHcyA9IHJlcXVpcmUoJy4vc3ZncycpO1xuXG52YXIgcGFnZVNlbGVjdG9yID0gJy5hbnRlbm5hLWxvY2F0aW9ucy1wYWdlJztcblxuZnVuY3Rpb24gY3JlYXRlUGFnZShvcHRpb25zKSB7XG4gICAgdmFyIGVsZW1lbnQgPSBvcHRpb25zLmVsZW1lbnQ7XG4gICAgdmFyIHJlYWN0aW9uTG9jYXRpb25EYXRhID0gb3B0aW9ucy5yZWFjdGlvbkxvY2F0aW9uRGF0YTtcbiAgICB2YXIgcGFnZURhdGEgPSBvcHRpb25zLnBhZ2VEYXRhO1xuICAgIHZhciBncm91cFNldHRpbmdzID0gb3B0aW9ucy5ncm91cFNldHRpbmdzO1xuICAgIHZhciBjbG9zZVdpbmRvdyA9IG9wdGlvbnMuY2xvc2VXaW5kb3c7XG4gICAgdmFyIGdvQmFjayA9IG9wdGlvbnMuZ29CYWNrO1xuICAgIHZhciByYWN0aXZlID0gUmFjdGl2ZSh7XG4gICAgICAgIGVsOiBlbGVtZW50LFxuICAgICAgICBhcHBlbmQ6IHRydWUsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIGxvY2F0aW9uRGF0YTogcmVhY3Rpb25Mb2NhdGlvbkRhdGEsXG4gICAgICAgICAgICBwYWdlUmVhY3Rpb25Db3VudDogcGFnZVJlYWN0aW9uQ291bnQocmVhY3Rpb25Mb2NhdGlvbkRhdGEpLFxuICAgICAgICAgICAgY2FuTG9jYXRlOiBmdW5jdGlvbihjb250YWluZXJIYXNoKSB7XG4gICAgICAgICAgICAgICAgLy8gVE9ETzogaXMgdGhlcmUgYSBiZXR0ZXIgd2F5IHRvIGhhbmRsZSByZWFjdGlvbnMgdG8gaGFzaGVzIHRoYXQgYXJlIG5vIGxvbmdlciBvbiB0aGUgcGFnZT9cbiAgICAgICAgICAgICAgICAvLyAgICAgICBzaG91bGQgd2UgcHJvdmlkZSBzb21lIGtpbmQgb2YgaW5kaWNhdGlvbiB3aGVuIHdlIGZhaWwgdG8gbG9jYXRlIGEgaGFzaCBvciBqdXN0IGxlYXZlIGl0IGFzIGlzP1xuICAgICAgICAgICAgICAgIC8vIFRPRE86IERvZXMgaXQgbWFrZSBzZW5zZSB0byBldmVuIHNob3cgZW50cmllcyB0aGF0IHdlIGNhbid0IGxvY2F0ZT8gUHJvYmFibHkgbm90LlxuICAgICAgICAgICAgICAgIHJldHVybiBIYXNoZWRFbGVtZW50cy5nZXRFbGVtZW50KGNvbnRhaW5lckhhc2gsIHBhZ2VEYXRhLnBhZ2VIYXNoKSAhPT0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL2xvY2F0aW9ucy1wYWdlLmhicy5odG1sJyksXG4gICAgICAgIHBhcnRpYWxzOiB7XG4gICAgICAgICAgICBsZWZ0OiBTVkdzLmxlZnRcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJhY3RpdmUub24oJ2JhY2snLCBnb0JhY2spO1xuICAgIHJhY3RpdmUub24oJ3JldmVhbCcsIHJldmVhbENvbnRlbnQpO1xuICAgIHJldHVybiB7XG4gICAgICAgIHNlbGVjdG9yOiBwYWdlU2VsZWN0b3IsXG4gICAgICAgIHRlYXJkb3duOiBmdW5jdGlvbigpIHsgcmFjdGl2ZS50ZWFyZG93bigpOyB9XG4gICAgfTtcblxuXG4gICAgZnVuY3Rpb24gcmV2ZWFsQ29udGVudChldmVudCkge1xuICAgICAgICB2YXIgbG9jYXRpb25EYXRhID0gZXZlbnQuY29udGV4dDtcbiAgICAgICAgdmFyIGVsZW1lbnQgPSBIYXNoZWRFbGVtZW50cy5nZXRFbGVtZW50KGxvY2F0aW9uRGF0YS5jb250YWluZXJIYXNoLCBwYWdlRGF0YS5wYWdlSGFzaCk7XG4gICAgICAgIGlmIChlbGVtZW50KSB7XG4gICAgICAgICAgICBjbG9zZVdpbmRvdygpO1xuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHsgLy8gTGV0IHRoZSBwcm9jZXNzaW5nIG9mIHRoaXMgY2xpY2sgZXZlbnQgZmluaXNoIGJlZm9yZSB3ZSBhZGQgYW5vdGhlciBjbGljayBoYW5kbGVyIHNvIHRoZSBuZXcgaGFuZGxlciBpc24ndCBpbW1lZGlhdGVseSB0cmlnZ2VyZWRcbiAgICAgICAgICAgICAgICB2YXIgdGFyZ2V0U2Nyb2xsVG9wID0gJChlbGVtZW50KS5vZmZzZXQoKS50b3AgLSAyMDsgLy8gVE9ETzogcmV2aWV3IHRoZSBleGFjdCBsb2NhdGlvblxuICAgICAgICAgICAgICAgICQoJ2JvZHknKS5hbmltYXRlKHtzY3JvbGxUb3A6IHRhcmdldFNjcm9sbFRvcH0pO1xuICAgICAgICAgICAgICAgIGlmIChsb2NhdGlvbkRhdGEua2luZCA9PT0gJ3R4dCcpIHsgLy8gVE9ETzogc29tZXRoaW5nIGJldHRlciB0aGFuIGEgc3RyaW5nIGNvbXBhcmUuIGZpeCB0aGlzIGFsb25nIHdpdGggdGhlIHNhbWUgaXNzdWUgaW4gcGFnZS1kYXRhXG4gICAgICAgICAgICAgICAgICAgIFJhbmdlLmhpZ2hsaWdodChlbGVtZW50LmdldCgwKSwgbG9jYXRpb25EYXRhLmxvY2F0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgJChkb2N1bWVudCkub24oJ2NsaWNrLmFudGVubmEnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFJhbmdlLmNsZWFySGlnaGxpZ2h0cygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJChkb2N1bWVudCkub2ZmKCdjbGljay5hbnRlbm5hJyk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgY29udGFpbmVyRGF0YSA9IFBhZ2VEYXRhLmdldENvbnRhaW5lckRhdGEocGFnZURhdGEsIGxvY2F0aW9uRGF0YS5jb250YWluZXJIYXNoKTtcbiAgICAgICAgICAgICAgICBFdmVudHMucG9zdENvbnRlbnRWaWV3ZWQocGFnZURhdGEsIGNvbnRhaW5lckRhdGEsbG9jYXRpb25EYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgIH0sIDApO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBwYWdlUmVhY3Rpb25Db3VudChyZWFjdGlvbkxvY2F0aW9uRGF0YSkge1xuICAgIGZvciAodmFyIGNvbnRlbnRJRCBpbiByZWFjdGlvbkxvY2F0aW9uRGF0YSkge1xuICAgICAgICBpZiAocmVhY3Rpb25Mb2NhdGlvbkRhdGEuaGFzT3duUHJvcGVydHkoY29udGVudElEKSkge1xuICAgICAgICAgICAgdmFyIGNvbnRlbnRMb2NhdGlvbkRhdGEgPSByZWFjdGlvbkxvY2F0aW9uRGF0YVtjb250ZW50SURdO1xuICAgICAgICAgICAgaWYgKGNvbnRlbnRMb2NhdGlvbkRhdGEua2luZCA9PT0gJ3BhZycpIHsgLy8gVE9ETzogc29tZXRoaW5nIGJldHRlciB0aGFuIGEgc3RyaW5nIGNvbXBhcmUuIGZpeCB0aGlzIGFsb25nIHdpdGggdGhlIHNhbWUgaXNzdWUgaW4gcGFnZS1kYXRhXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRlbnRMb2NhdGlvbkRhdGEuY291bnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGU6IGNyZWF0ZVBhZ2Vcbn07IiwidmFyIFJhY3RpdmU7IHJlcXVpcmUoJy4vdXRpbHMvcmFjdGl2ZS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihsb2FkZWRSYWN0aXZlKSB7IFJhY3RpdmUgPSBsb2FkZWRSYWN0aXZlO30pO1xudmFyIFVSTHMgPSByZXF1aXJlKCcuL3V0aWxzL3VybHMnKTtcbnZhciBYRE1DbGllbnQgPSByZXF1aXJlKCcuL3V0aWxzL3hkbS1jbGllbnQnKTtcbnZhciBTVkdzID0gcmVxdWlyZSgnLi9zdmdzJyk7XG5cbnZhciBwYWdlU2VsZWN0b3IgPSAnLmFudGVubmEtbG9naW4tcGFnZSc7XG5cbmZ1bmN0aW9uIGNyZWF0ZVBhZ2Uob3B0aW9ucykge1xuICAgIHZhciBncm91cFNldHRpbmdzID0gb3B0aW9ucy5ncm91cFNldHRpbmdzO1xuICAgIHZhciBnb0JhY2sgPSBvcHRpb25zLmdvQmFjaztcbiAgICB2YXIgcmV0cnkgPSBvcHRpb25zLnJldHJ5O1xuICAgIHZhciBlbGVtZW50ID0gb3B0aW9ucy5lbGVtZW50O1xuICAgIHZhciByYWN0aXZlID0gUmFjdGl2ZSh7XG4gICAgICAgIGVsOiBlbGVtZW50LFxuICAgICAgICBhcHBlbmQ6IHRydWUsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIGxvZ2luUGFnZVVybDogY29tcHV0ZUxvZ2luUGFnZVVybChncm91cFNldHRpbmdzKVxuICAgICAgICB9LFxuICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL2xvZ2luLXBhZ2UuaGJzLmh0bWwnKSxcbiAgICAgICAgcGFydGlhbHM6IHtcbiAgICAgICAgICAgIGxlZnQ6IFNWR3MubGVmdFxuICAgICAgICB9XG4gICAgfSk7XG4gICAgYWRkUmVzcG9uc2VIYW5kbGVycygpO1xuICAgIHJhY3RpdmUub24oJ2JhY2snLCBmdW5jdGlvbigpIHtcbiAgICAgICAgY2xlYXJSZXNwb25zZUhhbmRsZXJzKCk7XG4gICAgICAgIGdvQmFjaygpO1xuICAgIH0pO1xuICAgIHJldHVybiB7XG4gICAgICAgIHNlbGVjdG9yOiBwYWdlU2VsZWN0b3IsXG4gICAgICAgIHRlYXJkb3duOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNsZWFyUmVzcG9uc2VIYW5kbGVycygpO1xuICAgICAgICAgICAgcmFjdGl2ZS50ZWFyZG93bigpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIGFkZFJlc3BvbnNlSGFuZGxlcnMoKSB7XG4gICAgICAgIFhETUNsaWVudC5hZGRSZXNwb25zZUhhbmRsZXIoXCJjbG9zZSBsb2dpbiBwYW5lbFwiLCBkb1JldHJ5KTtcbiAgICAgICAgWERNQ2xpZW50LmFkZFJlc3BvbnNlSGFuZGxlcihcImdldFVzZXJMb2dpblN0YXRlXCIsIGRvUmV0cnkpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNsZWFyUmVzcG9uc2VIYW5kbGVycygpIHtcbiAgICAgICAgWERNQ2xpZW50LnJlbW92ZVJlc3BvbnNlSGFuZGxlcihcImNsb3NlIGxvZ2luIHBhbmVsXCIsIGRvUmV0cnkpO1xuICAgICAgICBYRE1DbGllbnQucmVtb3ZlUmVzcG9uc2VIYW5kbGVyKFwiZ2V0VXNlckxvZ2luU3RhdGVcIiwgZG9SZXRyeSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZG9SZXRyeSgpIHtcbiAgICAgICAgY2xlYXJSZXNwb25zZUhhbmRsZXJzKCk7XG4gICAgICAgIHJldHJ5KCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBjb21wdXRlTG9naW5QYWdlVXJsKGdyb3VwU2V0dGluZ3MpIHtcbiAgICByZXR1cm4gVVJMcy5hcHBTZXJ2ZXJVcmwoKSArIFVSTHMubG9naW5QYWdlVXJsKCkgK1xuICAgICAgICAnP3BhcmVudFVybD0nICsgd2luZG93LmxvY2F0aW9uLmhyZWYgK1xuICAgICAgICAnJnBhcmVudEhvc3Q9JyArIHdpbmRvdy5sb2NhdGlvbi5wcm90b2NvbCArIFwiLy9cIiArIHdpbmRvdy5sb2NhdGlvbi5ob3N0ICtcbiAgICAgICAgJyZncm91cF9pZD0nICsgZ3JvdXBTZXR0aW5ncy5ncm91cElkKCkgK1xuICAgICAgICAnJmdyb3VwX25hbWU9JyArIGdyb3VwU2V0dGluZ3MuZ3JvdXBOYW1lKCk7XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGVQYWdlOiBjcmVhdGVQYWdlXG59OyIsInZhciAkOyByZXF1aXJlKCcuL3V0aWxzL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIFJhY3RpdmU7IHJlcXVpcmUoJy4vdXRpbHMvcmFjdGl2ZS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihsb2FkZWRSYWN0aXZlKSB7IFJhY3RpdmUgPSBsb2FkZWRSYWN0aXZlO30pO1xudmFyIFJlYWN0aW9uc1dpZGdldCA9IHJlcXVpcmUoJy4vcmVhY3Rpb25zLXdpZGdldCcpO1xudmFyIFNWR3MgPSByZXF1aXJlKCcuL3N2Z3MnKTtcblxudmFyIEFwcE1vZGUgPSByZXF1aXJlKCcuL3V0aWxzL2FwcC1tb2RlJyk7XG52YXIgTXV0YXRpb25PYnNlcnZlciA9IHJlcXVpcmUoJy4vdXRpbHMvbXV0YXRpb24tb2JzZXJ2ZXInKTtcbnZhciBUaHJvdHRsZWRFdmVudHMgPSByZXF1aXJlKCcuL3V0aWxzL3Rocm90dGxlZC1ldmVudHMnKTtcbnZhciBUb3VjaFN1cHBvcnQgPSByZXF1aXJlKCcuL3V0aWxzL3RvdWNoLXN1cHBvcnQnKTtcblxuZnVuY3Rpb24gY3JlYXRlSW5kaWNhdG9yV2lkZ2V0KG9wdGlvbnMpIHtcbiAgICAvLyBUT0RPOiB2YWxpZGF0ZSB0aGF0IG9wdGlvbnMgY29udGFpbnMgYWxsIHJlcXVpcmVkIHByb3BlcnRpZXMgKGFwcGxpZXMgdG8gYWxsIHdpZGdldHMpLlxuICAgIHZhciBlbGVtZW50ID0gb3B0aW9ucy5lbGVtZW50O1xuICAgIHZhciBjb250YWluZXJEYXRhID0gb3B0aW9ucy5jb250YWluZXJEYXRhO1xuICAgIHZhciAkY29udGFpbmVyRWxlbWVudCA9IG9wdGlvbnMuY29udGFpbmVyRWxlbWVudDtcbiAgICB2YXIgcGFnZURhdGEgPSBvcHRpb25zLnBhZ2VEYXRhO1xuICAgIHZhciBncm91cFNldHRpbmdzID0gb3B0aW9ucy5ncm91cFNldHRpbmdzO1xuICAgIHZhciBkZWZhdWx0UmVhY3Rpb25zID0gb3B0aW9ucy5kZWZhdWx0UmVhY3Rpb25zO1xuICAgIHZhciBjb250ZW50RGF0YSA9IG9wdGlvbnMuY29udGVudERhdGE7XG4gICAgdmFyIHJhY3RpdmUgPSBSYWN0aXZlKHtcbiAgICAgICAgZWw6IGVsZW1lbnQsXG4gICAgICAgIGFwcGVuZDogdHJ1ZSxcbiAgICAgICAgbWFnaWM6IHRydWUsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIGNvbnRhaW5lckRhdGE6IGNvbnRhaW5lckRhdGEsXG4gICAgICAgICAgICBleHRyYUF0dHJpYnV0ZXM6IEFwcE1vZGUuZGVidWcgPyAnYW50LWhhc2g9XCInICsgY29udGFpbmVyRGF0YS5oYXNoICsgJ1wiJyA6ICcnIC8vIFRPRE86IHRoaXMgYWJvdXQgbWFraW5nIHRoaXMgYSBkZWNvcmF0b3IgaGFuZGxlZCBieSBhIFwiRGVidWdcIiBtb2R1bGVcbiAgICAgICAgfSxcbiAgICAgICAgdGVtcGxhdGU6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9tZWRpYS1pbmRpY2F0b3Itd2lkZ2V0Lmhicy5odG1sJyksXG4gICAgICAgIHBhcnRpYWxzOiB7XG4gICAgICAgICAgICBsb2dvOiBTVkdzLmxvZ29cbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgdmFyIHJlYWN0aW9uV2lkZ2V0T3B0aW9ucyA9IHtcbiAgICAgICAgcmVhY3Rpb25zRGF0YTogY29udGFpbmVyRGF0YS5yZWFjdGlvbnMsXG4gICAgICAgIGNvbnRhaW5lckRhdGE6IGNvbnRhaW5lckRhdGEsXG4gICAgICAgIGNvbnRhaW5lckVsZW1lbnQ6ICRjb250YWluZXJFbGVtZW50LFxuICAgICAgICBjb250ZW50RGF0YTogY29udGVudERhdGEsXG4gICAgICAgIGRlZmF1bHRSZWFjdGlvbnM6IGRlZmF1bHRSZWFjdGlvbnMsXG4gICAgICAgIHBhZ2VEYXRhOiBwYWdlRGF0YSxcbiAgICAgICAgZ3JvdXBTZXR0aW5nczogZ3JvdXBTZXR0aW5nc1xuICAgIH07XG5cbiAgICB2YXIgaG92ZXJUaW1lb3V0O1xuICAgIHZhciBhY3RpdmVUaW1lb3V0O1xuXG4gICAgdmFyICRyb290RWxlbWVudCA9ICQocm9vdEVsZW1lbnQocmFjdGl2ZSkpO1xuICAgIFRvdWNoU3VwcG9ydC5zZXR1cFRhcCgkcm9vdEVsZW1lbnQuZ2V0KDApLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBvcGVuUmVhY3Rpb25zV2luZG93KHJlYWN0aW9uV2lkZ2V0T3B0aW9ucywgcmFjdGl2ZSlcbiAgICB9KTtcbiAgICAkcm9vdEVsZW1lbnQub24oJ21vdXNlZW50ZXIuYW50ZW5uYScsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGlmIChldmVudC5idXR0b25zID4gMCB8fCAoZXZlbnQuYnV0dG9ucyA9PSB1bmRlZmluZWQgJiYgZXZlbnQud2hpY2ggPiAwKSkgeyAvLyBPbiBTYWZhcmksIGV2ZW50LmJ1dHRvbnMgaXMgdW5kZWZpbmVkIGJ1dCBldmVudC53aGljaCBnaXZlcyBhIGdvb2QgdmFsdWUuIGV2ZW50LndoaWNoIGlzIGJhZCBvbiBGRlxuICAgICAgICAgICAgLy8gRG9uJ3QgcmVhY3QgaWYgdGhlIHVzZXIgaXMgZHJhZ2dpbmcgb3Igc2VsZWN0aW5nIHRleHQuXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvbnRhaW5lckRhdGEucmVhY3Rpb25zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIG9wZW5SZWFjdGlvbnNXaW5kb3cocmVhY3Rpb25XaWRnZXRPcHRpb25zLCByYWN0aXZlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNsZWFyVGltZW91dChob3ZlclRpbWVvdXQpO1xuICAgICAgICAgICAgaG92ZXJUaW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBvcGVuUmVhY3Rpb25zV2luZG93KHJlYWN0aW9uV2lkZ2V0T3B0aW9ucywgcmFjdGl2ZSk7XG4gICAgICAgICAgICB9LCA1MCk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICAkcm9vdEVsZW1lbnQub24oJ21vdXNlbGVhdmUuYW50ZW5uYScsIGZ1bmN0aW9uKCkge1xuICAgICAgICBjbGVhclRpbWVvdXQoaG92ZXJUaW1lb3V0KTtcbiAgICAgICAgY2xlYXJUaW1lb3V0KGFjdGl2ZVRpbWVvdXQpO1xuICAgIH0pO1xuICAgICRjb250YWluZXJFbGVtZW50Lm9uKCdtb3VzZWVudGVyLmFudGVubmEnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KGFjdGl2ZVRpbWVvdXQpO1xuICAgICAgICBhY3RpdmVUaW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICRyb290RWxlbWVudC5hZGRDbGFzcygnYWN0aXZlJyk7XG4gICAgICAgIH0sIDUwMCk7XG4gICAgfSk7XG4gICAgJGNvbnRhaW5lckVsZW1lbnQub24oJ21vdXNlbGVhdmUuYW50ZW5uYScsIGZ1bmN0aW9uKCkge1xuICAgICAgICBjbGVhclRpbWVvdXQoYWN0aXZlVGltZW91dCk7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAkcm9vdEVsZW1lbnQucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpO1xuICAgICAgICB9LCAxMDApOyAvLyBXZSBnZXQgYSBtb3VzZWxlYXZlIGV2ZW50IHdoZW4gdGhlIHVzZXIgaG92ZXJzIHRoZSBpbmRpY2F0b3IuIFBhdXNlIGxvbmcgZW5vdWdoIHRoYXQgdGhlIHJlYWN0aW9uIHdpbmRvdyBjYW4gb3BlbiBpZiB0aGV5IGhvdmVyLlxuICAgIH0pO1xuICAgIHNldHVwUG9zaXRpb25pbmcoJGNvbnRhaW5lckVsZW1lbnQsIGdyb3VwU2V0dGluZ3MsIHJhY3RpdmUpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgdGVhcmRvd246IGZ1bmN0aW9uKCkgeyByYWN0aXZlLnRlYXJkb3duKCk7IH1cbiAgICB9O1xufVxuXG5mdW5jdGlvbiBzZXR1cFBvc2l0aW9uaW5nKCRjb250YWluZXJFbGVtZW50LCBncm91cFNldHRpbmdzLCByYWN0aXZlKSB7XG4gICAgdmFyICR3cmFwcGVyRWxlbWVudCA9ICQod3JhcHBlckVsZW1lbnQocmFjdGl2ZSkpO1xuICAgIHZhciAkcm9vdEVsZW1lbnQgPSAkKHJvb3RFbGVtZW50KHJhY3RpdmUpKTtcbiAgICBwb3NpdGlvbkluZGljYXRvcigpO1xuXG4gICAgVGhyb3R0bGVkRXZlbnRzLm9uKCdyZXNpemUnLCBwb3NpdGlvbklmTmVlZGVkKTtcbiAgICByYWN0aXZlLm9uKCd0ZWFyZG93bicsIGZ1bmN0aW9uKCkge1xuICAgICAgICBUaHJvdHRsZWRFdmVudHMub2ZmKCdyZXNpemUnLCBwb3NpdGlvbklmTmVlZGVkKTtcbiAgICB9KTtcbiAgICBUaHJvdHRsZWRFdmVudHMub24oJ3Njcm9sbCcsIHBvc2l0aW9uSWZOZWVkZWQpO1xuICAgIHJhY3RpdmUub24oJ3RlYXJkb3duJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIFRocm90dGxlZEV2ZW50cy5vZmYoJ3Njcm9sbCcsIHBvc2l0aW9uSWZOZWVkZWQpO1xuICAgIH0pO1xuXG4gICAgLy8gVE9ETzogY29uc2lkZXIgYWxzbyBsaXN0ZW5pbmcgdG8gc3JjIGF0dHJpYnV0ZSBjaGFuZ2VzLCB3aGljaCBtaWdodCBhZmZlY3QgdGhlIGhlaWdodCBvZiBlbGVtZW50cyBvbiB0aGUgcGFnZVxuICAgIE11dGF0aW9uT2JzZXJ2ZXIuYWRkQWRkaXRpb25MaXN0ZW5lcihlbGVtZW50c0FkZGVkT3JSZW1vdmVkKTtcbiAgICBNdXRhdGlvbk9ic2VydmVyLmFkZFJlbW92YWxMaXN0ZW5lcihlbGVtZW50c0FkZGVkT3JSZW1vdmVkKTtcblxuICAgIGZ1bmN0aW9uIGVsZW1lbnRzQWRkZWRPclJlbW92ZWQoJGVsZW1lbnRzKSB7XG4gICAgICAgIC8vIFJlcG9zaXRpb24gdGhlIGluZGljYXRvciBpZiBlbGVtZW50cyB3aGljaCBtaWdodCBhZGp1c3QgdGhlIGNvbnRhaW5lcidzIHBvc2l0aW9uIGFyZSBhZGRlZC9yZW1vdmVkLlxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8ICRlbGVtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyICRlbGVtZW50ID0gJGVsZW1lbnRzW2ldO1xuICAgICAgICAgICAgaWYgKCRlbGVtZW50LmhlaWdodCgpID4gMCkge1xuICAgICAgICAgICAgICAgIHBvc2l0aW9uSWZOZWVkZWQoKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgbGFzdENvbnRhaW5lck9mZnNldCA9ICRjb250YWluZXJFbGVtZW50Lm9mZnNldCgpO1xuICAgIHZhciBsYXN0Q29udGFpbmVySGVpZ2h0ID0gJGNvbnRhaW5lckVsZW1lbnQuaGVpZ2h0KCk7XG5cbiAgICBmdW5jdGlvbiBwb3NpdGlvbklmTmVlZGVkKCkge1xuICAgICAgICB2YXIgY29udGFpbmVyT2Zmc2V0ID0gJGNvbnRhaW5lckVsZW1lbnQub2Zmc2V0KCk7XG4gICAgICAgIHZhciBjb250YWluZXJIZWlnaHQgPSAkY29udGFpbmVyRWxlbWVudC5oZWlnaHQoKTtcbiAgICAgICAgaWYgKGNvbnRhaW5lck9mZnNldC50b3AgPT09IGxhc3RDb250YWluZXJPZmZzZXQudG9wICYmXG4gICAgICAgICAgICBjb250YWluZXJPZmZzZXQubGVmdCA9PT0gbGFzdENvbnRhaW5lck9mZnNldC5sZWZ0ICYmXG4gICAgICAgICAgICBjb250YWluZXJIZWlnaHQgPT09IGxhc3RDb250YWluZXJIZWlnaHQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBsYXN0Q29udGFpbmVyT2Zmc2V0ID0gY29udGFpbmVyT2Zmc2V0O1xuICAgICAgICBsYXN0Q29udGFpbmVySGVpZ2h0ID0gY29udGFpbmVySGVpZ2h0O1xuICAgICAgICBwb3NpdGlvbkluZGljYXRvcigpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBvc2l0aW9uSW5kaWNhdG9yKCkge1xuICAgICAgICAvLyBQb3NpdGlvbiB0aGUgd3JhcHBlciBlbGVtZW50ICh3aGljaCBoYXMgYSBoYXJkY29kZWQgd2lkdGgpIGluIHRoZSBhcHByb3ByaWF0ZSBjb3JuZXIuIFRoZW4gZmxpcCB0aGUgbGVmdC9yaWdodFxuICAgICAgICAvLyBwb3NpdGlvbmluZyBvZiB0aGUgbmVzdGVkIHdpZGdldCBlbGVtZW50IHRvIGFkanVzdCB0aGUgd2F5IGl0IHdpbGwgZXhwYW5kIHdoZW4gdGhlIG1lZGlhIGlzIGhvdmVyZWQuXG4gICAgICAgIHZhciBjb3JuZXIgPSBncm91cFNldHRpbmdzLm1lZGlhSW5kaWNhdG9yQ29ybmVyKCk7XG4gICAgICAgIHZhciBlbGVtZW50T2Zmc2V0ID0gJGNvbnRhaW5lckVsZW1lbnQub2Zmc2V0KCk7XG4gICAgICAgIHZhciBjb29yZHMgPSB7fTtcbiAgICAgICAgaWYgKGNvcm5lci5pbmRleE9mKCd0b3AnKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIGNvb3Jkcy50b3AgPSBlbGVtZW50T2Zmc2V0LnRvcDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvb3Jkcy50b3AgPSBlbGVtZW50T2Zmc2V0LnRvcCArICRjb250YWluZXJFbGVtZW50LmhlaWdodCgpIC0gJHJvb3RFbGVtZW50Lm91dGVySGVpZ2h0KCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvcm5lci5pbmRleE9mKCdyaWdodCcpICE9PSAtMSkge1xuICAgICAgICAgICAgY29vcmRzLmxlZnQgPSBlbGVtZW50T2Zmc2V0LmxlZnQgKyAkY29udGFpbmVyRWxlbWVudC53aWR0aCgpIC0gJHdyYXBwZXJFbGVtZW50Lm91dGVyV2lkdGgoKTtcbiAgICAgICAgICAgICRyb290RWxlbWVudC5jc3Moe3JpZ2h0OjAsbGVmdDonJ30pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29vcmRzLmxlZnQgPSBlbGVtZW50T2Zmc2V0LmxlZnQ7XG4gICAgICAgICAgICAkcm9vdEVsZW1lbnQuY3NzKHtyaWdodDonJyxsZWZ0OjB9KTtcbiAgICAgICAgfVxuICAgICAgICAkd3JhcHBlckVsZW1lbnQuY3NzKGNvb3Jkcyk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiB3cmFwcGVyRWxlbWVudChyYWN0aXZlKSB7XG4gICAgcmV0dXJuIHJhY3RpdmUuZmluZCgnLmFudGVubmEtbWVkaWEtaW5kaWNhdG9yLXdyYXBwZXInKTtcbn1cblxuZnVuY3Rpb24gcm9vdEVsZW1lbnQocmFjdGl2ZSkge1xuICAgIHJldHVybiByYWN0aXZlLmZpbmQoJy5hbnRlbm5hLW1lZGlhLWluZGljYXRvci13aWRnZXQnKTtcbn1cblxuZnVuY3Rpb24gb3BlblJlYWN0aW9uc1dpbmRvdyhyZWFjdGlvbk9wdGlvbnMsIHJhY3RpdmUpIHtcbiAgICBSZWFjdGlvbnNXaWRnZXQub3BlbihyZWFjdGlvbk9wdGlvbnMsIHJvb3RFbGVtZW50KHJhY3RpdmUpKTtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZTogY3JlYXRlSW5kaWNhdG9yV2lkZ2V0XG59OyIsInZhciAkOyByZXF1aXJlKCcuL3V0aWxzL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIEFqYXhDbGllbnQgPSByZXF1aXJlKCcuL3V0aWxzL2FqYXgtY2xpZW50Jyk7XG52YXIgUGFnZVV0aWxzID0gcmVxdWlyZSgnLi91dGlscy9wYWdlLXV0aWxzJyk7XG52YXIgVGhyb3R0bGVkRXZlbnRzID0gcmVxdWlyZSgnLi91dGlscy90aHJvdHRsZWQtZXZlbnRzJyk7XG52YXIgVVJMcyA9IHJlcXVpcmUoJy4vdXRpbHMvdXJscycpO1xudmFyIFBhZ2VEYXRhID0gcmVxdWlyZSgnLi9wYWdlLWRhdGEnKTtcblxuLy8gQ29tcHV0ZSB0aGUgcGFnZXMgdGhhdCB3ZSBuZWVkIHRvIGZldGNoLiBUaGlzIGlzIGVpdGhlcjpcbi8vIDEuIEFueSBuZXN0ZWQgcGFnZXMgd2UgZmluZCB1c2luZyB0aGUgcGFnZSBzZWxlY3RvciBPUlxuLy8gMi4gVGhlIGN1cnJlbnQgd2luZG93IGxvY2F0aW9uXG5mdW5jdGlvbiBjb21wdXRlUGFnZXNQYXJhbSgkcGFnZUVsZW1lbnRBcnJheSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBncm91cElkID0gZ3JvdXBTZXR0aW5ncy5ncm91cElkKCk7XG4gICAgdmFyIHBhZ2VzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCAkcGFnZUVsZW1lbnRBcnJheS5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgJHBhZ2VFbGVtZW50ID0gJHBhZ2VFbGVtZW50QXJyYXlbaV07XG4gICAgICAgIHBhZ2VzLnB1c2goe1xuICAgICAgICAgICAgZ3JvdXBfaWQ6IGdyb3VwSWQsXG4gICAgICAgICAgICB1cmw6IFBhZ2VVdGlscy5jb21wdXRlUGFnZVVybCgkcGFnZUVsZW1lbnQsIGdyb3VwU2V0dGluZ3MpLFxuICAgICAgICAgICAgdGl0bGU6IFBhZ2VVdGlscy5jb21wdXRlUGFnZVRpdGxlKCRwYWdlRWxlbWVudCwgZ3JvdXBTZXR0aW5ncylcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGlmIChwYWdlcy5sZW5ndGggPT0gMSkge1xuICAgICAgICBwYWdlc1swXS5pbWFnZSA9IFBhZ2VVdGlscy5jb21wdXRlVG9wTGV2ZWxQYWdlSW1hZ2UoZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIHBhZ2VzWzBdLmF1dGhvciA9IFBhZ2VVdGlscy5jb21wdXRlUGFnZUF1dGhvcihncm91cFNldHRpbmdzKTtcbiAgICAgICAgcGFnZXNbMF0udG9waWNzID0gUGFnZVV0aWxzLmNvbXB1dGVQYWdlVG9waWNzKGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICBwYWdlc1swXS5zZWN0aW9uID0gUGFnZVV0aWxzLmNvbXB1dGVQYWdlU2l0ZVNlY3Rpb24oZ3JvdXBTZXR0aW5ncyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHsgcGFnZXM6IHBhZ2VzIH07XG59XG5cbmZ1bmN0aW9uIGxvYWRQYWdlRGF0YShwYWdlRGF0YVBhcmFtLCBncm91cFNldHRpbmdzKSB7XG4gICAgQWpheENsaWVudC5nZXRKU09OUChVUkxzLnBhZ2VEYXRhVXJsKCksIHBhZ2VEYXRhUGFyYW0sIHN1Y2Nlc3MsIGVycm9yKTtcblxuICAgIGZ1bmN0aW9uIHN1Y2Nlc3MoanNvbikge1xuICAgICAgICAvL3NldFRpbWVvdXQoZnVuY3Rpb24oKSB7IFBhZ2VEYXRhLnVwZGF0ZUFsbFBhZ2VEYXRhKGpzb24sIGdyb3VwU2V0dGluZ3MpOyB9LCAzMDAwKTtcbiAgICAgICAgUGFnZURhdGEudXBkYXRlQWxsUGFnZURhdGEoanNvbiwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZXJyb3IobWVzc2FnZSkge1xuICAgICAgICAvLyBUT0RPIGhhbmRsZSBlcnJvcnMgdGhhdCBoYXBwZW4gd2hlbiBsb2FkaW5nIHBhZ2UgZGF0YVxuICAgICAgICBjb25zb2xlLmxvZygnQW4gZXJyb3Igb2NjdXJyZWQgbG9hZGluZyBwYWdlIGRhdGE6ICcgKyBtZXNzYWdlKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHN0YXJ0TG9hZGluZ1BhZ2VEYXRhKGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgJHBhZ2VFbGVtZW50cyA9ICQoZ3JvdXBTZXR0aW5ncy5wYWdlU2VsZWN0b3IoKSk7XG4gICAgaWYgKCRwYWdlRWxlbWVudHMubGVuZ3RoID09IDApIHtcbiAgICAgICAgJHBhZ2VFbGVtZW50cyA9ICQoJ2JvZHknKTtcbiAgICB9XG4gICAgcXVldWVQYWdlRGF0YUxvYWQoJHBhZ2VFbGVtZW50cywgZ3JvdXBTZXR0aW5ncyk7XG59XG5cbmZ1bmN0aW9uIHF1ZXVlUGFnZURhdGFMb2FkKCRwYWdlRWxlbWVudHMsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgcGFnZXNUb0xvYWQgPSBbXTtcbiAgICAkcGFnZUVsZW1lbnRzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkcGFnZUVsZW1lbnQgPSAkKHRoaXMpO1xuICAgICAgICBpZiAoaXNJblZpZXcoJHBhZ2VFbGVtZW50KSkge1xuICAgICAgICAgICAgcGFnZXNUb0xvYWQucHVzaCgkcGFnZUVsZW1lbnQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbG9hZFdoZW5WaXNpYmxlKCRwYWdlRWxlbWVudCwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIHZhciBwYWdlRGF0YVBhcmFtID0gY29tcHV0ZVBhZ2VzUGFyYW0ocGFnZXNUb0xvYWQsIGdyb3VwU2V0dGluZ3MpO1xuICAgIC8vIFRPRE86IGRlbGV0ZSB0aGUgY29tbWVudGVkIGxpbmUgYmVsb3csIHdoaWNoIGlzIGZvciB0ZXN0aW5nIHB1cnBvc2VzXG4gICAgLy9wYWdlRGF0YVBhcmFtID0ge3BhZ2VzOiBbe1wiZ3JvdXBfaWRcIjoxMTg0LCBcInVybFwiOlwiaHR0cDovL3d3dy5kdWtlY2hyb25pY2xlLmNvbS9hcnRpY2xlcy8yMDE0LzAyLzE0L3BvcnRyYWl0LXBvcm4tc3RhclwiLFwiY2Fub25pY2FsX3VybFwiOlwic2FtZVwiLFwidGl0bGVcIjpcIlBvcnRyYWl0IG9mIGEgcG9ybiBzdGFyXCIsXCJpbWFnZVwiOlwiXCJ9XX07XG4gICAgbG9hZFBhZ2VEYXRhKHBhZ2VEYXRhUGFyYW0sIGdyb3VwU2V0dGluZ3MpO1xufVxuXG5mdW5jdGlvbiBpc0luVmlldygkZWxlbWVudCkge1xuICAgIHZhciB0cmlnZ2VyRGlzdGFuY2UgPSAzMDA7XG4gICAgcmV0dXJuICRlbGVtZW50Lm9mZnNldCgpLnRvcCA8ICAkKGRvY3VtZW50KS5zY3JvbGxUb3AoKSArICQod2luZG93KS5oZWlnaHQoKSArIHRyaWdnZXJEaXN0YW5jZTtcbn1cblxuZnVuY3Rpb24gbG9hZFdoZW5WaXNpYmxlKCRwYWdlRWxlbWVudCwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBjaGVja1Zpc2liaWxpdHkgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKGlzSW5WaWV3KCRwYWdlRWxlbWVudCkpIHtcbiAgICAgICAgICAgIHZhciBwYWdlRGF0YVBhcmFtID0gY29tcHV0ZVBhZ2VzUGFyYW0oWyRwYWdlRWxlbWVudF0sIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgbG9hZFBhZ2VEYXRhKHBhZ2VEYXRhUGFyYW0sIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgVGhyb3R0bGVkRXZlbnRzLm9mZignc2Nyb2xsJywgY2hlY2tWaXNpYmlsaXR5KTtcbiAgICAgICAgICAgIFRocm90dGxlZEV2ZW50cy5vZmYoJ3Jlc2l6ZScsIGNoZWNrVmlzaWJpbGl0eSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFRocm90dGxlZEV2ZW50cy5vbignc2Nyb2xsJywgY2hlY2tWaXNpYmlsaXR5KTtcbiAgICBUaHJvdHRsZWRFdmVudHMub24oJ3Jlc2l6ZScsIGNoZWNrVmlzaWJpbGl0eSk7XG59XG5cbmZ1bmN0aW9uIHBhZ2VzQWRkZWQoJHBhZ2VFbGVtZW50cywgZ3JvdXBTZXR0aW5ncykge1xuICAgIHF1ZXVlUGFnZURhdGFMb2FkKCRwYWdlRWxlbWVudHMsIGdyb3VwU2V0dGluZ3MpO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgbG9hZDogc3RhcnRMb2FkaW5nUGFnZURhdGEsXG4gICAgcGFnZXNBZGRlZDogcGFnZXNBZGRlZFxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi91dGlscy9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcblxudmFyIEV2ZW50cyA9IHJlcXVpcmUoJy4vZXZlbnRzJyk7XG52YXIgSGFzaGVkRWxlbWVudHMgPSByZXF1aXJlKCcuL2hhc2hlZC1lbGVtZW50cycpO1xuXG4vLyBDb2xsZWN0aW9uIG9mIGFsbCBwYWdlIGRhdGEsIGtleWVkIGJ5IHBhZ2UgaGFzaFxudmFyIHBhZ2VzID0ge307XG4vLyBNYXBwaW5nIG9mIHBhZ2UgVVJMcyB0byBwYWdlIGhhc2hlcywgd2hpY2ggYXJlIGNvbXB1dGVkIG9uIHRoZSBzZXJ2ZXIuXG52YXIgdXJsSGFzaGVzID0ge307XG5cbmZ1bmN0aW9uIGdldFBhZ2VEYXRhKGhhc2gpIHtcbiAgICB2YXIgcGFnZURhdGEgPSBwYWdlc1toYXNoXTtcbiAgICBpZiAoIXBhZ2VEYXRhKSB7XG4gICAgICAgIC8vIFRPRE86IEdpdmUgdGhpcyBzZXJpb3VzIHRob3VnaHQuIEluIG9yZGVyIGZvciBtYWdpYyBtb2RlIHRvIHdvcmssIHRoZSBvYmplY3QgbmVlZHMgdG8gaGF2ZSB2YWx1ZXMgaW4gcGxhY2UgZm9yXG4gICAgICAgIC8vIHRoZSBvYnNlcnZlZCBwcm9wZXJ0aWVzIGF0IHRoZSBtb21lbnQgdGhlIHJhY3RpdmUgaXMgY3JlYXRlZC4gQnV0IHRoaXMgaXMgcHJldHR5IHVudXN1YWwgZm9yIEphdmFzY3JpcHQsIHRvIGhhdmVcbiAgICAgICAgLy8gdG8gZGVmaW5lIHRoZSB3aG9sZSBza2VsZXRvbiBmb3IgdGhlIG9iamVjdCBpbnN0ZWFkIG9mIGp1c3QgYWRkaW5nIHByb3BlcnRpZXMgd2hlbmV2ZXIgeW91IHdhbnQuXG4gICAgICAgIC8vIFRoZSBhbHRlcm5hdGl2ZSB3b3VsZCBiZSBmb3IgdXMgdG8ga2VlcCBvdXIgb3duIFwiZGF0YSBiaW5kaW5nXCIgYmV0d2VlbiB0aGUgcGFnZURhdGEgYW5kIHJhY3RpdmUgaW5zdGFuY2VzICgxIHRvIG1hbnkpXG4gICAgICAgIC8vIGFuZCB0ZWxsIHRoZSByYWN0aXZlcyB0byB1cGRhdGUgd2hlbmV2ZXIgdGhlIGRhdGEgY2hhbmdlcy5cbiAgICAgICAgcGFnZURhdGEgPSB7XG4gICAgICAgICAgICBwYWdlSGFzaDogaGFzaCxcbiAgICAgICAgICAgIHN1bW1hcnlSZWFjdGlvbnM6IFtdLFxuICAgICAgICAgICAgc3VtbWFyeVRvdGFsOiAwLFxuICAgICAgICAgICAgc3VtbWFyeUxvYWRlZDogZmFsc2UsXG4gICAgICAgICAgICBjb250YWluZXJzOiBbXSxcbiAgICAgICAgICAgIG1ldHJpY3M6IHt9IC8vIFRoaXMgaXMgYSBjYXRjaC1hbGwgZmllbGQgd2hlcmUgd2UgY2FuIGF0dGFjaCBjbGllbnQtc2lkZSBtZXRyaWNzIGZvciBhbmFseXRpY3NcbiAgICAgICAgfTtcbiAgICAgICAgcGFnZXNbaGFzaF0gPSBwYWdlRGF0YTtcbiAgICB9XG4gICAgcmV0dXJuIHBhZ2VEYXRhO1xufVxuXG5mdW5jdGlvbiB1cGRhdGVBbGxQYWdlRGF0YShqc29uUGFnZXMsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgYWxsUGFnZXMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGpzb25QYWdlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgcGFnZURhdGEgPSB1cGRhdGVQYWdlRGF0YShqc29uUGFnZXNbaV0sIGdyb3VwU2V0dGluZ3MpXG4gICAgICAgIGFsbFBhZ2VzLnB1c2gocGFnZURhdGEpO1xuICAgICAgICBFdmVudHMucG9zdFBhZ2VEYXRhTG9hZGVkKHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZVBhZ2VEYXRhKGpzb24sIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgcGFnZURhdGEgPSBnZXRQYWdlRGF0YUZvckpzb25SZXNwb25zZShqc29uKTtcbiAgICBwYWdlRGF0YS5wYWdlSWQgPSBqc29uLmlkO1xuICAgIHBhZ2VEYXRhLnBhZ2VIYXNoID0ganNvbi5wYWdlSGFzaDtcbiAgICBwYWdlRGF0YS5ncm91cElkID0gZ3JvdXBTZXR0aW5ncy5ncm91cElkKCk7XG4gICAgcGFnZURhdGEuY2Fub25pY2FsVXJsID0ganNvbi5jYW5vbmljYWxVUkw7XG4gICAgcGFnZURhdGEucmVxdWVzdGVkVXJsID0ganNvbi5yZXF1ZXN0ZWRVUkw7XG4gICAgcGFnZURhdGEuYXV0aG9yID0ganNvbi5hdXRob3I7XG4gICAgcGFnZURhdGEuc2VjdGlvbiA9IGpzb24uc2VjdGlvbjtcbiAgICBwYWdlRGF0YS50b3BpY3MgPSBqc29uLnRvcGljcztcbiAgICBwYWdlRGF0YS50aXRsZSA9IGpzb24udGl0bGU7XG4gICAgcGFnZURhdGEuaW1hZ2UgPSBqc29uLmltYWdlO1xuXG4gICAgdmFyIHN1bW1hcnlSZWFjdGlvbnMgPSBqc29uLnN1bW1hcnlSZWFjdGlvbnM7XG4gICAgcGFnZURhdGEuc3VtbWFyeVJlYWN0aW9ucyA9IHN1bW1hcnlSZWFjdGlvbnM7XG4gICAgc2V0Q29udGFpbmVycyhwYWdlRGF0YSwganNvbi5jb250YWluZXJzKTtcblxuICAgIC8vIFdlIGFkZCB1cCB0aGUgc3VtbWFyeSByZWFjdGlvbiB0b3RhbCBjbGllbnQtc2lkZVxuICAgIHZhciB0b3RhbCA9IDA7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdW1tYXJ5UmVhY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHRvdGFsID0gdG90YWwgKyBzdW1tYXJ5UmVhY3Rpb25zW2ldLmNvdW50O1xuICAgIH1cbiAgICBwYWdlRGF0YS5zdW1tYXJ5VG90YWwgPSB0b3RhbDtcbiAgICBwYWdlRGF0YS5zdW1tYXJ5TG9hZGVkID0gdHJ1ZTtcblxuICAgIC8vIFdlIGFkZCB1cCB0aGUgY29udGFpbmVyIHJlYWN0aW9uIHRvdGFscyBjbGllbnQtc2lkZVxuICAgIHZhciB0b3RhbCA9IDA7XG4gICAgdmFyIGNvbnRhaW5lckNvdW50cyA9IFtdO1xuICAgIHZhciBjb250YWluZXJzID0gcGFnZURhdGEuY29udGFpbmVycztcbiAgICBmb3IgKHZhciBoYXNoIGluIGNvbnRhaW5lcnMpIHtcbiAgICAgICAgaWYgKGNvbnRhaW5lcnMuaGFzT3duUHJvcGVydHkoaGFzaCkpIHtcbiAgICAgICAgICAgIHZhciBjb250YWluZXIgPSBjb250YWluZXJzW2hhc2hdO1xuICAgICAgICAgICAgdmFyIHRvdGFsID0gMDtcbiAgICAgICAgICAgIHZhciBjb250YWluZXJSZWFjdGlvbnMgPSBjb250YWluZXIucmVhY3Rpb25zO1xuICAgICAgICAgICAgaWYgKGNvbnRhaW5lclJlYWN0aW9ucykge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY29udGFpbmVyUmVhY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHRvdGFsID0gdG90YWwgKyBjb250YWluZXJSZWFjdGlvbnNbaV0uY291bnQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29udGFpbmVyLnJlYWN0aW9uVG90YWwgPSB0b3RhbDtcbiAgICAgICAgICAgIGNvbnRhaW5lckNvdW50cy5wdXNoKHsgY291bnQ6IHRvdGFsLCBjb250YWluZXI6IGNvbnRhaW5lciB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICB2YXIgaW5kaWNhdG9yTGltaXQgPSBncm91cFNldHRpbmdzLnRleHRJbmRpY2F0b3JMaW1pdCgpO1xuICAgIGlmIChpbmRpY2F0b3JMaW1pdCkge1xuICAgICAgICAvLyBJZiBhbiBpbmRpY2F0b3IgbGltaXQgaXMgc2V0LCBzb3J0IHRoZSBjb250YWluZXJzIGFuZCBtYXJrIG9ubHkgdGhlIHRvcCBOIHRvIGJlIHZpc2libGUuXG4gICAgICAgIGNvbnRhaW5lckNvdW50cy5zb3J0KGZ1bmN0aW9uKGEsIGIpIHsgcmV0dXJuIGIuY291bnQgLSBhLmNvdW50OyB9KTsgLy8gc29ydCBsYXJnZXN0IGNvdW50IGZpcnN0XG4gICAgICAgIGZvciAodmFyIGkgPSBpbmRpY2F0b3JMaW1pdDsgaSA8IGNvbnRhaW5lckNvdW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29udGFpbmVyQ291bnRzW2ldLmNvbnRhaW5lci5zdXBwcmVzcyA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcGFnZURhdGE7XG59XG5cbmZ1bmN0aW9uIGdldENvbnRhaW5lckRhdGEocGFnZURhdGEsIGNvbnRhaW5lckhhc2gpIHtcbiAgICB2YXIgY29udGFpbmVyRGF0YSA9IHBhZ2VEYXRhLmNvbnRhaW5lcnNbY29udGFpbmVySGFzaF07XG4gICAgaWYgKCFjb250YWluZXJEYXRhKSB7XG4gICAgICAgIGNvbnRhaW5lckRhdGEgPSB7XG4gICAgICAgICAgICBoYXNoOiBjb250YWluZXJIYXNoLFxuICAgICAgICAgICAgcmVhY3Rpb25Ub3RhbDogMCxcbiAgICAgICAgICAgIHJlYWN0aW9uczogW10sXG4gICAgICAgICAgICBsb2FkZWQ6IHBhZ2VEYXRhLnN1bW1hcnlMb2FkZWQsXG4gICAgICAgICAgICBzdXBwcmVzczogZmFsc2VcbiAgICAgICAgfTtcbiAgICAgICAgcGFnZURhdGEuY29udGFpbmVyc1tjb250YWluZXJIYXNoXSA9IGNvbnRhaW5lckRhdGE7XG4gICAgfVxuICAgIHJldHVybiBjb250YWluZXJEYXRhO1xufVxuXG4vLyBNZXJnZSB0aGUgZ2l2ZW4gY29udGFpbmVyIGRhdGEgaW50byB0aGUgcGFnZURhdGEuY29udGFpbmVycyBkYXRhLiBUaGlzIGlzIG5lY2Vzc2FyeSBiZWNhdXNlIHRoZSBza2VsZXRvbiBvZiB0aGUgcGFnZURhdGEuY29udGFpbmVycyBtYXBcbi8vIGlzIHNldCB1cCBhbmQgYm91bmQgdG8gdGhlIFVJIGJlZm9yZSBhbGwgdGhlIGRhdGEgaXMgZmV0Y2hlZCBmcm9tIHRoZSBzZXJ2ZXIgYW5kIHdlIGRvbid0IHdhbnQgdG8gYnJlYWsgdGhlIGRhdGEgYmluZGluZy5cbmZ1bmN0aW9uIHNldENvbnRhaW5lcnMocGFnZURhdGEsIGpzb25Db250YWluZXJzKSB7XG4gICAgZm9yICh2YXIgaGFzaCBpbiBqc29uQ29udGFpbmVycykge1xuICAgICAgICBpZiAoanNvbkNvbnRhaW5lcnMuaGFzT3duUHJvcGVydHkoaGFzaCkpIHtcbiAgICAgICAgICAgIHZhciBjb250YWluZXJEYXRhID0gZ2V0Q29udGFpbmVyRGF0YShwYWdlRGF0YSwgaGFzaCk7XG4gICAgICAgICAgICB2YXIgZmV0Y2hlZENvbnRhaW5lckRhdGEgPSBqc29uQ29udGFpbmVyc1toYXNoXTtcbiAgICAgICAgICAgIGNvbnRhaW5lckRhdGEuaWQgPSBmZXRjaGVkQ29udGFpbmVyRGF0YS5pZDtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZmV0Y2hlZENvbnRhaW5lckRhdGEucmVhY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY29udGFpbmVyRGF0YS5yZWFjdGlvbnMucHVzaChmZXRjaGVkQ29udGFpbmVyRGF0YS5yZWFjdGlvbnNbaV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHZhciBhbGxDb250YWluZXJzID0gcGFnZURhdGEuY29udGFpbmVycztcbiAgICBmb3IgKHZhciBoYXNoIGluIGFsbENvbnRhaW5lcnMpIHtcbiAgICAgICAgaWYgKGFsbENvbnRhaW5lcnMuaGFzT3duUHJvcGVydHkoaGFzaCkpIHtcbiAgICAgICAgICAgIHZhciBjb250YWluZXIgPSBhbGxDb250YWluZXJzW2hhc2hdO1xuICAgICAgICAgICAgY29udGFpbmVyLmxvYWRlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGNsZWFySW5kaWNhdG9yTGltaXQocGFnZURhdGEpIHtcbiAgICB2YXIgY29udGFpbmVycyA9IHBhZ2VEYXRhLmNvbnRhaW5lcnM7XG4gICAgZm9yICh2YXIgaGFzaCBpbiBjb250YWluZXJzKSB7XG4gICAgICAgIGlmIChjb250YWluZXJzLmhhc093blByb3BlcnR5KGhhc2gpKSB7XG4gICAgICAgICAgICB2YXIgY29udGFpbmVyID0gY29udGFpbmVyc1toYXNoXTtcbiAgICAgICAgICAgIGNvbnRhaW5lci5zdXBwcmVzcyA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxufVxuXG4vLyBSZXR1cm5zIHRoZSBsb2NhdGlvbnMgd2hlcmUgdGhlIGdpdmVuIHJlYWN0aW9uIG9jY3VycyBvbiB0aGUgcGFnZS4gVGhlIHJldHVybiBmb3JtYXQgaXM6XG4vLyB7XG4vLyAgIDxjb250ZW50X2lkPiA6IHtcbi8vICAgICBjb3VudDogPG51bWJlcj4sXG4vLyAgICAgaWQ6IDxjb250ZW50X2lkPixcbi8vICAgICBjb250YWluZXJJRDogPGNvbnRhaW5lcl9pZD5cbi8vICAgICBraW5kOiA8Y29udGVudCBraW5kPixcbi8vICAgICBsb2NhdGlvbjogPGxvY2F0aW9uPixcbi8vICAgICBbYm9keTogPGJvZHk+XSBmaWxsZWQgaW4gbGF0ZXIgdmlhIHVwZGF0ZUxvY2F0aW9uRGF0YVxuLy8gICB9XG4vLyB9XG5mdW5jdGlvbiBnZXRSZWFjdGlvbkxvY2F0aW9uRGF0YShyZWFjdGlvbiwgcGFnZURhdGEpIHtcbiAgICBpZiAoIXBhZ2VEYXRhLmxvY2F0aW9uRGF0YSkgeyAvLyBQb3B1bGF0ZSB0aGlzIHRyZWUgbGF6aWx5LCBzaW5jZSBpdCdzIG5vdCBmcmVxdWVudGx5IHVzZWQuXG4gICAgICAgIHBhZ2VEYXRhLmxvY2F0aW9uRGF0YSA9IGNvbXB1dGVMb2NhdGlvbkRhdGEocGFnZURhdGEpO1xuICAgIH1cbiAgICByZXR1cm4gcGFnZURhdGEubG9jYXRpb25EYXRhW3JlYWN0aW9uLmlkXTtcbn1cblxuLy8gUmV0dXJucyBhIHZpZXcgb24gdGhlIGdpdmVuIHRyZWUgc3RydWN0dXJlIHRoYXQncyBvcHRpbWl6ZWQgZm9yIHJlbmRlcmluZyB0aGUgbG9jYXRpb24gb2YgcmVhY3Rpb25zIChhcyBmcm9tIHRoZVxuLy8gc3VtbWFyeSB3aWRnZXQpLiBGb3IgZWFjaCByZWFjdGlvbiwgd2UgY2FuIHF1aWNrbHkgZ2V0IHRvIHRoZSBwaWVjZXMgb2YgY29udGVudCB0aGF0IGhhdmUgdGhhdCByZWFjdGlvbiBhcyB3ZWxsIGFzXG4vLyB0aGUgY291bnQgb2YgdGhvc2UgcmVhY3Rpb25zIGZvciBlYWNoIHBpZWNlIG9mIGNvbnRlbnQuXG4vL1xuLy8gVGhlIHN0cnVjdHVyZSBsb29rcyBsaWtlIHRoaXM6XG4vLyB7XG4vLyAgIDxyZWFjdGlvbl9pZD4gOiB7ICAgKHRoaXMgaXMgdGhlIGludGVyYWN0aW9uX25vZGVfaWQpXG4vLyAgICAgPGNvbnRlbnRfaWQ+IDoge1xuLy8gICAgICAgY291bnQgOiA8bnVtYmVyPixcbi8vICAgICAgIGNvbnRhaW5lcklEOiA8Y29udGFpbmVyX2lkPixcbi8vICAgICAgIGtpbmQ6IDxjb250ZW50IGtpbmQ+LFxuLy8gICAgICAgbG9jYXRpb246IDxsb2NhdGlvbj5cbi8vICAgICAgIFtib2R5OiA8Ym9keT5dIGZpbGxlZCBpbiBsYXRlciB2aWEgdXBkYXRlTG9jYXRpb25EYXRhXG4vLyAgICAgfVxuLy8gICB9XG4vLyB9XG5mdW5jdGlvbiBjb21wdXRlTG9jYXRpb25EYXRhKHBhZ2VEYXRhKSB7XG4gICAgdmFyIGxvY2F0aW9uRGF0YSA9IHt9O1xuICAgIHZhciBjb250YWluZXJzID0gcGFnZURhdGEuY29udGFpbmVycztcbiAgICBmb3IgKHZhciBoYXNoIGluIGNvbnRhaW5lcnMpIHtcbiAgICAgICAgaWYgKGNvbnRhaW5lcnMuaGFzT3duUHJvcGVydHkoaGFzaCkpIHtcbiAgICAgICAgICAgIHZhciBjb250YWluZXJEYXRhID0gY29udGFpbmVyc1toYXNoXTtcbiAgICAgICAgICAgIHZhciByZWFjdGlvbnMgPSBjb250YWluZXJEYXRhLnJlYWN0aW9ucztcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmVhY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJlYWN0aW9uID0gcmVhY3Rpb25zW2ldO1xuICAgICAgICAgICAgICAgIHZhciByZWFjdGlvbklkID0gcmVhY3Rpb24uaWQ7XG4gICAgICAgICAgICAgICAgdmFyIGNvbnRlbnQgPSByZWFjdGlvbi5jb250ZW50O1xuICAgICAgICAgICAgICAgIHZhciBjb250ZW50SWQgPSBjb250ZW50LmlkO1xuICAgICAgICAgICAgICAgIHZhciByZWFjdGlvbkxvY2F0aW9uRGF0YSA9IGxvY2F0aW9uRGF0YVtyZWFjdGlvbklkXTtcbiAgICAgICAgICAgICAgICBpZiAoIXJlYWN0aW9uTG9jYXRpb25EYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlYWN0aW9uTG9jYXRpb25EYXRhID0ge307XG4gICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uRGF0YVtyZWFjdGlvbklkXSA9IHJlYWN0aW9uTG9jYXRpb25EYXRhO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgY29udGVudExvY2F0aW9uRGF0YSA9IHJlYWN0aW9uTG9jYXRpb25EYXRhW2NvbnRlbnRJZF07IC8vIFRPRE86IEl0J3Mgbm90IHJlYWxseSBwb3NzaWJsZSB0byBnZXQgYSBoaXQgaGVyZSwgaXMgaXQ/IFdlIHNob3VsZCBuZXZlciBzZWUgdHdvIGluc3RhbmNlcyBvZiB0aGUgc2FtZSByZWFjdGlvbiBmb3IgdGhlIHNhbWUgY29udGVudD8gKFRoZXJlJ2Qgd291bGQganVzdCBiZSBvbmUgaW5zdGFuY2Ugd2l0aCBhIGNvdW50ID4gMS4pXG4gICAgICAgICAgICAgICAgaWYgKCFjb250ZW50TG9jYXRpb25EYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnRMb2NhdGlvbkRhdGEgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb3VudDogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGtpbmQ6IGNvbnRlbnQua2luZCwgLy8gVE9ETzogV2Ugc2hvdWxkIG5vcm1hbGl6ZSB0aGlzIHZhbHVlIHRvIGEgc2V0IG9mIGNvbnN0YW50cy4gZml4IHRoaXMgaW4gbG9jYXRpb25zLXBhZ2Ugd2hlcmUgdGhlIHZhbHVlIGlzIHJlYWQgYXMgd2VsbC5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRPRE86IGFsc28gY29uc2lkZXIgdHJhbnNsYXRpbmcgdGhpcyBmcm9tIHRoZSByYXcgXCJraW5kXCIgdG8gXCJ0eXBlXCIuIChlLmcuIFwicGFnXCIgPT4gXCJwYWdlXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICBsb2NhdGlvbjogY29udGVudC5sb2NhdGlvbixcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lckhhc2g6IGNvbnRhaW5lckRhdGEuaGFzaCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnRJZDogY29udGVudElkXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIHJlYWN0aW9uTG9jYXRpb25EYXRhW2NvbnRlbnRJZF0gPSBjb250ZW50TG9jYXRpb25EYXRhO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb250ZW50TG9jYXRpb25EYXRhLmNvdW50ICs9IHJlYWN0aW9uLmNvdW50O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBsb2NhdGlvbkRhdGE7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZVJlYWN0aW9uTG9jYXRpb25EYXRhKHJlYWN0aW9uTG9jYXRpb25EYXRhLCBjb250ZW50Qm9kaWVzKSB7XG4gICAgZm9yICh2YXIgY29udGVudElkIGluIGNvbnRlbnRCb2RpZXMpIHtcbiAgICAgICAgaWYgKGNvbnRlbnRCb2RpZXMuaGFzT3duUHJvcGVydHkoY29udGVudElkKSkge1xuICAgICAgICAgICAgdmFyIGNvbnRlbnRMb2NhdGlvbkRhdGEgPSByZWFjdGlvbkxvY2F0aW9uRGF0YVtjb250ZW50SWRdO1xuICAgICAgICAgICAgaWYgKGNvbnRlbnRMb2NhdGlvbkRhdGEpIHtcbiAgICAgICAgICAgICAgICBjb250ZW50TG9jYXRpb25EYXRhLmJvZHkgPSBjb250ZW50Qm9kaWVzW2NvbnRlbnRJZF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIHJlZ2lzdGVyUmVhY3Rpb24ocmVhY3Rpb24sIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhKSB7XG4gICAgdmFyIGV4aXN0aW5nUmVhY3Rpb25zID0gY29udGFpbmVyRGF0YS5yZWFjdGlvbnM7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBleGlzdGluZ1JlYWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoZXhpc3RpbmdSZWFjdGlvbnNbaV0uaWQgPT09IHJlYWN0aW9uLmlkKSB7XG4gICAgICAgICAgICAvLyBUaGlzIHJlYWN0aW9uIGhhcyBhbHJlYWR5IGJlZW4gYWRkZWQgdG8gdGhpcyBjb250YWluZXIuIERvbid0IGFkZCBpdCBhZ2Fpbi5cbiAgICAgICAgICAgIHJldHVybiBleGlzdGluZ1JlYWN0aW9uc1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBjb250YWluZXJEYXRhLnJlYWN0aW9ucy5wdXNoKHJlYWN0aW9uKTtcbiAgICBjb250YWluZXJEYXRhLnJlYWN0aW9uVG90YWwgPSBjb250YWluZXJEYXRhLnJlYWN0aW9uVG90YWwgKyAxO1xuICAgIHZhciBzdW1tYXJ5UmVhY3Rpb24gPSB7XG4gICAgICAgIHRleHQ6IHJlYWN0aW9uLnRleHQsXG4gICAgICAgIGlkOiByZWFjdGlvbi5pZCxcbiAgICAgICAgY291bnQ6IHJlYWN0aW9uLmNvdW50XG4gICAgfTtcbiAgICBwYWdlRGF0YS5zdW1tYXJ5UmVhY3Rpb25zLnB1c2goc3VtbWFyeVJlYWN0aW9uKTtcbiAgICBwYWdlRGF0YS5zdW1tYXJ5VG90YWwgPSBwYWdlRGF0YS5zdW1tYXJ5VG90YWwgKyAxO1xuICAgIHJldHVybiByZWFjdGlvbjtcbn1cblxuLy8gR2V0cyBwYWdlIGRhdGEgYmFzZWQgb24gYSBVUkwuIFRoaXMgYWxsb3dzIG91ciBjbGllbnQgdG8gc3RhcnQgcHJvY2Vzc2luZyBhIHBhZ2UgKGFuZCBiaW5kaW5nIGRhdGEgb2JqZWN0c1xuLy8gdG8gdGhlIFVJKSAqYmVmb3JlKiB3ZSBnZXQgZGF0YSBiYWNrIGZyb20gdGhlIHNlcnZlci5cbmZ1bmN0aW9uIGdldFBhZ2VEYXRhQnlVUkwodXJsKSB7XG4gICAgdmFyIHNlcnZlckhhc2ggPSB1cmxIYXNoZXNbdXJsXTtcbiAgICBpZiAoc2VydmVySGFzaCkge1xuICAgICAgICAvLyBJZiB0aGUgc2VydmVyIGFscmVhZHkgZ2l2ZW4gdXMgdGhlIGhhc2ggZm9yIHRoZSBwYWdlLCB1c2UgaXQuXG4gICAgICAgIHJldHVybiBnZXRQYWdlRGF0YShzZXJ2ZXJIYXNoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBPdGhlcndpc2UsIHRlbXBvcmFyaWx5IHVzZSB0aGUgdXJsIGFzIHRoZSBoYXNoLiBUaGlzIHdpbGwgZ2V0IHVwZGF0ZWQgd2hlbmV2ZXIgd2UgZ2V0IGRhdGEgYmFjayBmcm9tIHRoZSBzZXJ2ZXIuXG4gICAgICAgIHJldHVybiBnZXRQYWdlRGF0YSh1cmwpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZ2V0UGFnZURhdGFGb3JKc29uUmVzcG9uc2UoanNvbikge1xuICAgIHZhciBwYWdlSGFzaCA9IGpzb24ucGFnZUhhc2g7XG4gICAgdmFyIHJlcXVlc3RlZFVSTCA9IGpzb24ucmVxdWVzdGVkVVJMO1xuICAgIHVybEhhc2hlc1tyZXF1ZXN0ZWRVUkxdID0gcGFnZUhhc2g7XG4gICAgdmFyIHVybEJhc2VkRGF0YSA9IHBhZ2VzW3JlcXVlc3RlZFVSTF07XG4gICAgaWYgKHVybEJhc2VkRGF0YSkge1xuICAgICAgICAvLyBJZiB3ZSd2ZSBhbHJlYWR5IGNyZWF0ZWQvYm91bmQgYSBwYWdlRGF0YSBvYmplY3QgdW5kZXIgdGhlIHJlcXVlc3RlZFVybCwgdXBkYXRlIHRoZSBwYWdlSGFzaCBhbmQgbW92ZSB0aGF0XG4gICAgICAgIC8vIGRhdGEgb3ZlciB0byB0aGUgaGFzaCBrZXlcbiAgICAgICAgdXJsQmFzZWREYXRhLnBhZ2VIYXNoID0ganNvbi5wYWdlSGFzaDtcbiAgICAgICAgcGFnZXNbcGFnZUhhc2hdID0gdXJsQmFzZWREYXRhO1xuICAgICAgICBkZWxldGUgcGFnZXNbcmVxdWVzdGVkVVJMXTtcbiAgICAgICAgLy8gVXBkYXRlIHRoZSBtYXBwaW5nIG9mIGhhc2hlcyB0byBwYWdlIGVsZW1lbnRzIHNvIGl0IGFsc28ga25vd3MgYWJvdXQgdGhlIGNoYW5nZSB0byB0aGUgcGFnZSBoYXNoXG4gICAgICAgIEhhc2hlZEVsZW1lbnRzLnVwZGF0ZVBhZ2VIYXNoKHJlcXVlc3RlZFVSTCwgcGFnZUhhc2gpO1xuICAgIH1cbiAgICByZXR1cm4gZ2V0UGFnZURhdGEocGFnZUhhc2gpO1xufVxuXG5mdW5jdGlvbiB0ZWFyZG93bigpIHtcbiAgICBwYWdlcyA9IHt9O1xuICAgIHVybEhhc2hlcyA9IHt9O1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgZ2V0UGFnZURhdGFCeVVSTDogZ2V0UGFnZURhdGFCeVVSTCxcbiAgICBnZXRQYWdlRGF0YTogZ2V0UGFnZURhdGEsXG4gICAgdXBkYXRlQWxsUGFnZURhdGE6IHVwZGF0ZUFsbFBhZ2VEYXRhLFxuICAgIGdldENvbnRhaW5lckRhdGE6IGdldENvbnRhaW5lckRhdGEsXG4gICAgZ2V0UmVhY3Rpb25Mb2NhdGlvbkRhdGE6IGdldFJlYWN0aW9uTG9jYXRpb25EYXRhLFxuICAgIHVwZGF0ZVJlYWN0aW9uTG9jYXRpb25EYXRhOiB1cGRhdGVSZWFjdGlvbkxvY2F0aW9uRGF0YSxcbiAgICByZWdpc3RlclJlYWN0aW9uOiByZWdpc3RlclJlYWN0aW9uLFxuICAgIGNsZWFySW5kaWNhdG9yTGltaXQ6IGNsZWFySW5kaWNhdG9yTGltaXQsXG4gICAgdGVhcmRvd246IHRlYXJkb3duLFxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi91dGlscy9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciBBcHBNb2RlID0gcmVxdWlyZSgnLi91dGlscy9hcHAtbW9kZScpO1xudmFyIEhhc2ggPSByZXF1aXJlKCcuL3V0aWxzL2hhc2gnKTtcbnZhciBNdXRhdGlvbk9ic2VydmVyID0gcmVxdWlyZSgnLi91dGlscy9tdXRhdGlvbi1vYnNlcnZlcicpO1xudmFyIFBhZ2VVdGlscyA9IHJlcXVpcmUoJy4vdXRpbHMvcGFnZS11dGlscycpO1xudmFyIFVSTHMgPSByZXF1aXJlKCcuL3V0aWxzL3VybHMnKTtcbnZhciBXaWRnZXRCdWNrZXQgPSByZXF1aXJlKCcuL3V0aWxzL3dpZGdldC1idWNrZXQnKTtcblxudmFyIEF1dG9DYWxsVG9BY3Rpb24gPSByZXF1aXJlKCcuL2F1dG8tY2FsbC10by1hY3Rpb24nKTtcbnZhciBDYWxsVG9BY3Rpb25JbmRpY2F0b3IgPSByZXF1aXJlKCcuL2NhbGwtdG8tYWN0aW9uLWluZGljYXRvcicpO1xudmFyIEhhc2hlZEVsZW1lbnRzID0gcmVxdWlyZSgnLi9oYXNoZWQtZWxlbWVudHMnKTtcbnZhciBNZWRpYUluZGljYXRvcldpZGdldCA9IHJlcXVpcmUoJy4vbWVkaWEtaW5kaWNhdG9yLXdpZGdldCcpO1xudmFyIFBhZ2VEYXRhID0gcmVxdWlyZSgnLi9wYWdlLWRhdGEnKTtcbnZhciBQYWdlRGF0YUxvYWRlciA9IHJlcXVpcmUoJy4vcGFnZS1kYXRhLWxvYWRlcicpO1xudmFyIFN1bW1hcnlXaWRnZXQgPSByZXF1aXJlKCcuL3N1bW1hcnktd2lkZ2V0Jyk7XG52YXIgVGV4dEluZGljYXRvcldpZGdldCA9IHJlcXVpcmUoJy4vdGV4dC1pbmRpY2F0b3Itd2lkZ2V0Jyk7XG52YXIgVGV4dFJlYWN0aW9ucyA9IHJlcXVpcmUoJy4vdGV4dC1yZWFjdGlvbnMnKTtcblxudmFyIFRZUEVfVEVYVCA9IFwidGV4dFwiO1xudmFyIFRZUEVfSU1BR0UgPSBcImltYWdlXCI7XG52YXIgVFlQRV9NRURJQSA9IFwibWVkaWFcIjtcblxudmFyIEFUVFJfSEFTSCA9IFwiYW50LWhhc2hcIjtcblxudmFyIGNyZWF0ZWRXaWRnZXRzID0gW107XG5cblxuLy8gU2NhbiBmb3IgYWxsIHBhZ2VzIGF0IHRoZSBjdXJyZW50IGJyb3dzZXIgbG9jYXRpb24uIFRoaXMgY291bGQganVzdCBiZSB0aGUgY3VycmVudCBwYWdlIG9yIGl0IGNvdWxkIGJlIGEgY29sbGVjdGlvblxuLy8gb2YgcGFnZXMgKGFrYSAncG9zdHMnKS5cbmZ1bmN0aW9uIHNjYW5BbGxQYWdlcyhncm91cFNldHRpbmdzKSB7XG4gICAgJChncm91cFNldHRpbmdzLmV4Y2x1c2lvblNlbGVjdG9yKCkpLmFkZENsYXNzKCduby1hbnQnKTsgLy8gQWRkIHRoZSBuby1hbnQgY2xhc3MgdG8gZXZlcnl0aGluZyB0aGF0IGlzIGZsYWdnZWQgZm9yIGV4Y2x1c2lvblxuICAgIHZhciAkcGFnZXMgPSAkKGdyb3VwU2V0dGluZ3MucGFnZVNlbGVjdG9yKCkpOyAvLyBUT0RPOiBuby1hbnQ/XG4gICAgaWYgKCRwYWdlcy5sZW5ndGggPT0gMCkge1xuICAgICAgICAvLyBJZiB3ZSBkb24ndCBkZXRlY3QgYW55IHBhZ2UgbWFya2VycywgdHJlYXQgdGhlIHdob2xlIGRvY3VtZW50IGFzIHRoZSBzaW5nbGUgcGFnZVxuICAgICAgICAkcGFnZXMgPSAkKCdib2R5Jyk7IC8vIFRPRE86IElzIHRoaXMgdGhlIHJpZ2h0IGJlaGF2aW9yPyAoS2VlcCBpbiBzeW5jIHdpdGggdGhlIHNhbWUgYXNzdW1wdGlvbiB0aGF0J3MgYnVpbHQgaW50byBwYWdlLWRhdGEtbG9hZGVyLilcbiAgICB9XG4gICAgJHBhZ2VzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkcGFnZSA9ICQodGhpcyk7XG4gICAgICAgIHNjYW5QYWdlKCRwYWdlLCBncm91cFNldHRpbmdzLCAkcGFnZXMubGVuZ3RoID4gMSk7XG4gICAgfSk7XG4gICAgc2V0dXBNdXRhdGlvbk9ic2VydmVyKGdyb3VwU2V0dGluZ3MpO1xufVxuXG4vLyBTY2FuIHRoZSBwYWdlIHVzaW5nIHRoZSBnaXZlbiBzZXR0aW5nczpcbi8vIDEuIEZpbmQgYWxsIHRoZSBjb250YWluZXJzIHRoYXQgd2UgY2FyZSBhYm91dC5cbi8vIDIuIENvbXB1dGUgaGFzaGVzIGZvciBlYWNoIGNvbnRhaW5lci5cbi8vIDMuIEluc2VydCB3aWRnZXQgYWZmb3JkYW5jZXMgZm9yIGVhY2ggd2hpY2ggYXJlIGJvdW5kIHRvIHRoZSBkYXRhIG1vZGVsIGJ5IHRoZSBoYXNoZXMuXG5mdW5jdGlvbiBzY2FuUGFnZSgkcGFnZSwgZ3JvdXBTZXR0aW5ncywgaXNNdWx0aVBhZ2UpIHtcbiAgICB2YXIgdXJsID0gUGFnZVV0aWxzLmNvbXB1dGVQYWdlVXJsKCRwYWdlLCBncm91cFNldHRpbmdzKTtcbiAgICB2YXIgcGFnZURhdGEgPSBQYWdlRGF0YS5nZXRQYWdlRGF0YUJ5VVJMKHVybCk7XG4gICAgdmFyICRhY3RpdmVTZWN0aW9ucyA9IGZpbmQoJHBhZ2UsIGdyb3VwU2V0dGluZ3MuYWN0aXZlU2VjdGlvbnMoKSwgdHJ1ZSk7XG5cbiAgICAvLyBGaXJzdCwgc2NhbiBmb3IgZWxlbWVudHMgdGhhdCB3b3VsZCBjYXVzZSB1cyB0byBpbnNlcnQgc29tZXRoaW5nIGludG8gdGhlIERPTSB0aGF0IHRha2VzIHVwIHNwYWNlLlxuICAgIC8vIFdlIHdhbnQgdG8gZ2V0IGFueSBwYWdlIHJlc2l6aW5nIG91dCBvZiB0aGUgd2F5IGFzIGVhcmx5IGFzIHBvc3NpYmxlLlxuICAgIC8vIFRPRE86IENvbnNpZGVyIGRvaW5nIHRoaXMgd2l0aCByYXcgSmF2YXNjcmlwdCBiZWZvcmUgalF1ZXJ5IGxvYWRzLCB0byBmdXJ0aGVyIHJlZHVjZSB0aGUgZGVsYXkuIFdlIHdvdWxkbid0XG4gICAgLy8gc2F2ZSBhICp0b24qIG9mIHRpbWUgZnJvbSB0aGlzLCB0aG91Z2gsIHNvIGl0J3MgZGVmaW5pdGVseSBhIGxhdGVyIG9wdGltaXphdGlvbi5cbiAgICBzY2FuRm9yU3VtbWFyaWVzKCRwYWdlLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7IC8vIFRPRE86IHNob3VsZCB0aGUgc3VtbWFyeSBzZWFyY2ggYmUgY29uZmluZWQgdG8gdGhlIGFjdGl2ZSBzZWN0aW9ucz9cbiAgICAkYWN0aXZlU2VjdGlvbnMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRzZWN0aW9uID0gJCh0aGlzKTtcbiAgICAgICAgY3JlYXRlQXV0b0NhbGxzVG9BY3Rpb24oJHNlY3Rpb24sIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICB9KTtcbiAgICAvLyBTY2FuIGZvciBDVEFzIGFjcm9zcyB0aGUgZW50aXJlIHBhZ2UgKHRoZXkgY2FuIGJlIG91dHNpZGUgYW4gYWN0aXZlIHNlY3Rpb24pLiBDVEFzIGhhdmUgdG8gZ28gYmVmb3JlIHNjYW5zIGZvclxuICAgIC8vIGNvbnRlbnQgYmVjYXVzZSBjb250ZW50IGludm9sdmVkIGluIENUQXMgd2lsbCBiZSB0YWdnZWQgbm8tYW50LlxuICAgIHNjYW5Gb3JDYWxsc1RvQWN0aW9uKCRwYWdlLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgLy8gVGhlbiBzY2FuIGZvciBldmVyeXRoaW5nIGVsc2VcbiAgICAkYWN0aXZlU2VjdGlvbnMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRzZWN0aW9uID0gJCh0aGlzKTtcbiAgICAgICAgc2NhbkFjdGl2ZUVsZW1lbnQoJHNlY3Rpb24sIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICB9KTtcblxuICAgIHBhZ2VEYXRhLm1ldHJpY3MuaGVpZ2h0ID0gY29tcHV0ZVBhZ2VIZWlnaHQoJGFjdGl2ZVNlY3Rpb25zKTtcbiAgICBwYWdlRGF0YS5tZXRyaWNzLmlzTXVsdGlQYWdlID0gaXNNdWx0aVBhZ2U7XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVQYWdlSGVpZ2h0KCRhY3RpdmVTZWN0aW9ucykge1xuICAgIHZhciBjb250ZW50VG9wO1xuICAgIHZhciBjb250ZW50Qm90dG9tO1xuICAgICRhY3RpdmVTZWN0aW9ucy5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgJHNlY3Rpb24gPSAkKHRoaXMpO1xuICAgICAgICB2YXIgb2Zmc2V0ID0gJHNlY3Rpb24ub2Zmc2V0KCk7XG4gICAgICAgIGNvbnRlbnRUb3AgPSBjb250ZW50VG9wID09PSB1bmRlZmluZWQgPyBvZmZzZXQudG9wIDogTWF0aC5taW4oY29udGVudFRvcCwgb2Zmc2V0LnRvcCk7XG4gICAgICAgIHZhciBib3R0b20gPSBvZmZzZXQudG9wICsgJHNlY3Rpb24ub3V0ZXJIZWlnaHQoKTtcbiAgICAgICAgY29udGVudEJvdHRvbSA9IGNvbnRlbnRCb3R0b20gPT09IHVuZGVmaW5lZCA/IGJvdHRvbSA6IE1hdGgubWF4KGNvbnRlbnRCb3R0b20sIGJvdHRvbSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIGNvbnRlbnRCb3R0b20gLSBjb250ZW50VG9wO1xufVxuXG4vLyBTY2FucyB0aGUgZ2l2ZW4gZWxlbWVudCwgd2hpY2ggYXBwZWFycyBpbnNpZGUgYW4gYWN0aXZlIHNlY3Rpb24uIFRoZSBlbGVtZW50IGNhbiBiZSB0aGUgZW50aXJlIGFjdGl2ZSBzZWN0aW9uLFxuLy8gc29tZSBjb250YWluZXIgd2l0aGluIHRoZSBhY3RpdmUgc2VjdGlvbiwgb3IgYSBsZWFmIG5vZGUgaW4gdGhlIGFjdGl2ZSBzZWN0aW9uLlxuZnVuY3Rpb24gc2NhbkFjdGl2ZUVsZW1lbnQoJGVsZW1lbnQsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgc2NhbkZvckNvbnRlbnQoJGVsZW1lbnQsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbn1cblxuZnVuY3Rpb24gc2NhbkZvclN1bW1hcmllcygkZWxlbWVudCwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgJHN1bW1hcmllcyA9IGZpbmQoJGVsZW1lbnQsIGdyb3VwU2V0dGluZ3Muc3VtbWFyeVNlbGVjdG9yKCksIHRydWUpO1xuICAgICRzdW1tYXJpZXMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRzdW1tYXJ5ID0gJCh0aGlzKTtcbiAgICAgICAgdmFyIGNvbnRhaW5lckRhdGEgPSBQYWdlRGF0YS5nZXRDb250YWluZXJEYXRhKHBhZ2VEYXRhLCAncGFnZScpOyAvLyBNYWdpYyBoYXNoIGZvciBwYWdlIHJlYWN0aW9uc1xuICAgICAgICBjb250YWluZXJEYXRhLnR5cGUgPSAncGFnZSc7IC8vIFRPRE86IHJldmlzaXQgd2hldGhlciBpdCBtYWtlcyBzZW5zZSB0byBzZXQgdGhlIHR5cGUgaGVyZVxuICAgICAgICB2YXIgZGVmYXVsdFJlYWN0aW9ucyA9IGdyb3VwU2V0dGluZ3MuZGVmYXVsdFJlYWN0aW9ucygkc3VtbWFyeSk7IC8vIFRPRE86IGRvIHdlIHN1cHBvcnQgY3VzdG9taXppbmcgdGhlIGRlZmF1bHQgcmVhY3Rpb25zIGF0IHRoaXMgbGV2ZWw/XG4gICAgICAgIHZhciBzdW1tYXJ5V2lkZ2V0ID0gU3VtbWFyeVdpZGdldC5jcmVhdGUoY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGRlZmF1bHRSZWFjdGlvbnMsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICB2YXIgJHN1bW1hcnlFbGVtZW50ID0gc3VtbWFyeVdpZGdldC5lbGVtZW50O1xuICAgICAgICBpbnNlcnRDb250ZW50KCRzdW1tYXJ5LCAkc3VtbWFyeUVsZW1lbnQsIGdyb3VwU2V0dGluZ3Muc3VtbWFyeU1ldGhvZCgpKTtcbiAgICAgICAgY3JlYXRlZFdpZGdldHMucHVzaChzdW1tYXJ5V2lkZ2V0KTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gc2NhbkZvckNhbGxzVG9BY3Rpb24oJGVsZW1lbnQsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGN0YVRhcmdldHMgPSB7fTsgLy8gVGhlIGVsZW1lbnRzIHRoYXQgdGhlIGNhbGwgdG8gYWN0aW9ucyBhY3Qgb24gKGUuZy4gdGhlIGltYWdlIG9yIHZpZGVvKVxuICAgIGZpbmQoJGVsZW1lbnQsICdbYW50LWl0ZW1dJywgdHJ1ZSkuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRjdGFUYXJnZXQgPSAkKHRoaXMpO1xuICAgICAgICAkY3RhVGFyZ2V0LmFkZENsYXNzKCduby1hbnQnKTsgLy8gZG9uJ3Qgc2hvdyB0aGUgbm9ybWFsIHJlYWN0aW9uIGFmZm9yZGFuY2Ugb24gYSBjdGEgdGFyZ2V0XG4gICAgICAgIHZhciBhbnRJdGVtSWQgPSAkY3RhVGFyZ2V0LmF0dHIoJ2FudC1pdGVtJykudHJpbSgpO1xuICAgICAgICBjdGFUYXJnZXRzW2FudEl0ZW1JZF0gPSAkY3RhVGFyZ2V0O1xuICAgIH0pO1xuXG4gICAgdmFyIGN0YUxhYmVscyA9IHt9OyAvLyBPcHRpb25hbCBlbGVtZW50cyB0aGF0IHJlcG9ydCB0aGUgbnVtYmVyIG9mIHJlYWN0aW9ucyB0byB0aGUgY3RhIChlLmcuIFwiMSByZWFjdGlvblwiKVxuICAgIGZpbmQoJGVsZW1lbnQsICdbYW50LXJlYWN0aW9ucy1sYWJlbC1mb3JdJywgdHJ1ZSkuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRjdGFMYWJlbCA9ICQodGhpcyk7XG4gICAgICAgICRjdGFMYWJlbC5hZGRDbGFzcygnbm8tYW50Jyk7IC8vIGRvbid0IHNob3cgdGhlIG5vcm1hbCByZWFjdGlvbiBhZmZvcmRhbmNlIG9uIGEgY3RhIGxhYmVsXG4gICAgICAgIHZhciBhbnRJdGVtSWQgPSAkY3RhTGFiZWwuYXR0cignYW50LXJlYWN0aW9ucy1sYWJlbC1mb3InKS50cmltKCk7XG4gICAgICAgIGN0YUxhYmVsc1thbnRJdGVtSWRdID0gY3RhTGFiZWxzW2FudEl0ZW1JZF0gfHwgW107XG4gICAgICAgIGN0YUxhYmVsc1thbnRJdGVtSWRdLnB1c2goJGN0YUxhYmVsKTtcbiAgICB9KTtcblxuICAgIHZhciBjdGFDb3VudGVycyA9IHt9OyAvLyBPcHRpb25hbCBlbGVtZW50cyB0aGF0IHJlcG9ydCBvbmx5IHRoZSBjb3VudCBvZiByZWFjdGlvbiB0byBhIGN0YSAoZS5nLiBcIjFcIilcbiAgICBmaW5kKCRlbGVtZW50LCAnW2FudC1jb3VudGVyLWZvcl0nLCB0cnVlKS5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgJGN0YUNvdW50ZXIgPSAkKHRoaXMpO1xuICAgICAgICAkY3RhQ291bnRlci5hZGRDbGFzcygnbm8tYW50Jyk7IC8vIGRvbid0IHNob3cgdGhlIG5vcm1hbCByZWFjdGlvbiBhZmZvcmRhbmNlIG9uIGEgY3RhIGNvdW50ZXJcbiAgICAgICAgdmFyIGFudEl0ZW1JZCA9ICRjdGFDb3VudGVyLmF0dHIoJ2FudC1jb3VudGVyLWZvcicpLnRyaW0oKTtcbiAgICAgICAgY3RhQ291bnRlcnNbYW50SXRlbUlkXSA9IGN0YUNvdW50ZXJzW2FudEl0ZW1JZF0gfHwgW107XG4gICAgICAgIGN0YUNvdW50ZXJzW2FudEl0ZW1JZF0ucHVzaCgkY3RhQ291bnRlcik7XG4gICAgfSk7XG5cbiAgICB2YXIgY3RhRXhwYW5kZWRSZWFjdGlvbnMgPSB7fTsgLy8gT3B0aW9uYWwgZWxlbWVudHMgdGhhdCBzaG93IGV4cGFuZGVkIHJlYWN0aW9ucyBmb3IgdGhlIGN0YSAoZS5nLiBcIkludGVyZXN0aW5nICgxNSkgTm8gdGhhbmtzICgxMClcIilcbiAgICBmaW5kKCRlbGVtZW50LCAnW2FudC1leHBhbmRlZC1yZWFjdGlvbnMtZm9yXScsIHRydWUpLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkY3RhRXhwYW5kZWRSZWFjdGlvbkFyZWEgPSAkKHRoaXMpO1xuICAgICAgICAkY3RhRXhwYW5kZWRSZWFjdGlvbkFyZWEuYWRkQ2xhc3MoJ25vLWFudCcpOyAvLyBkb24ndCBzaG93IHRoZSBub3JtYWwgcmVhY3Rpb24gYWZmb3JkYW5jZSBvbiBhIGN0YSBjb3VudGVyXG4gICAgICAgIHZhciBhbnRJdGVtSWQgPSAkY3RhRXhwYW5kZWRSZWFjdGlvbkFyZWEuYXR0cignYW50LWV4cGFuZGVkLXJlYWN0aW9ucy1mb3InKS50cmltKCk7XG4gICAgICAgIGN0YUV4cGFuZGVkUmVhY3Rpb25zW2FudEl0ZW1JZF0gPSBjdGFFeHBhbmRlZFJlYWN0aW9uc1thbnRJdGVtSWRdIHx8IFtdO1xuICAgICAgICBjdGFFeHBhbmRlZFJlYWN0aW9uc1thbnRJdGVtSWRdLnB1c2goJGN0YUV4cGFuZGVkUmVhY3Rpb25BcmVhKTtcbiAgICB9KTtcblxuICAgIHZhciAkY3RhRWxlbWVudHMgPSBmaW5kKCRlbGVtZW50LCAnW2FudC1jdGEtZm9yXScpOyAvLyBUaGUgY2FsbCB0byBhY3Rpb24gZWxlbWVudHMgd2hpY2ggcHJvbXB0IHRoZSB1c2VyIHRvIHJlYWN0XG4gICAgJGN0YUVsZW1lbnRzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkY3RhRWxlbWVudCA9ICQodGhpcyk7XG4gICAgICAgIHZhciBhbnRJdGVtSWQgPSAkY3RhRWxlbWVudC5hdHRyKCdhbnQtY3RhLWZvcicpO1xuICAgICAgICB2YXIgJHRhcmdldEVsZW1lbnQgPSBjdGFUYXJnZXRzW2FudEl0ZW1JZF07XG4gICAgICAgIGlmICgkdGFyZ2V0RWxlbWVudCkge1xuICAgICAgICAgICAgdmFyIGhhc2ggPSBjb21wdXRlSGFzaCgkdGFyZ2V0RWxlbWVudCwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgdmFyIGNvbnRlbnREYXRhID0gY29tcHV0ZUNvbnRlbnREYXRhKCR0YXJnZXRFbGVtZW50LCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgIGlmIChoYXNoICYmIGNvbnRlbnREYXRhKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNvbnRhaW5lckRhdGEgPSBQYWdlRGF0YS5nZXRDb250YWluZXJEYXRhKHBhZ2VEYXRhLCBoYXNoKTtcbiAgICAgICAgICAgICAgICBjb250YWluZXJEYXRhLnR5cGUgPSBjb21wdXRlRWxlbWVudFR5cGUoJHRhcmdldEVsZW1lbnQpOyAvLyBUT0RPOiByZXZpc2l0IHdoZXRoZXIgaXQgbWFrZXMgc2Vuc2UgdG8gc2V0IHRoZSB0eXBlIGhlcmVcbiAgICAgICAgICAgICAgICB2YXIgY2FsbFRvQWN0aW9uID0gQ2FsbFRvQWN0aW9uSW5kaWNhdG9yLmNyZWF0ZSh7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lckRhdGE6IGNvbnRhaW5lckRhdGEsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lckVsZW1lbnQ6ICR0YXJnZXRFbGVtZW50LFxuICAgICAgICAgICAgICAgICAgICBjb250ZW50RGF0YTogY29udGVudERhdGEsXG4gICAgICAgICAgICAgICAgICAgIGN0YUVsZW1lbnQ6ICRjdGFFbGVtZW50LFxuICAgICAgICAgICAgICAgICAgICBjdGFMYWJlbHM6IGN0YUxhYmVsc1thbnRJdGVtSWRdLFxuICAgICAgICAgICAgICAgICAgICBjdGFDb3VudGVyczogY3RhQ291bnRlcnNbYW50SXRlbUlkXSxcbiAgICAgICAgICAgICAgICAgICAgY3RhRXhwYW5kZWRSZWFjdGlvbnM6IGN0YUV4cGFuZGVkUmVhY3Rpb25zW2FudEl0ZW1JZF0sXG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHRSZWFjdGlvbnM6IGdyb3VwU2V0dGluZ3MuZGVmYXVsdFJlYWN0aW9ucygkdGFyZ2V0RWxlbWVudCksXG4gICAgICAgICAgICAgICAgICAgIHBhZ2VEYXRhOiBwYWdlRGF0YSxcbiAgICAgICAgICAgICAgICAgICAgZ3JvdXBTZXR0aW5nczogZ3JvdXBTZXR0aW5nc1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNyZWF0ZWRXaWRnZXRzLnB1c2goY2FsbFRvQWN0aW9uKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pXG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUF1dG9DYWxsc1RvQWN0aW9uKCRzZWN0aW9uLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciAkY3RhVGFyZ2V0cyA9IGZpbmQoJHNlY3Rpb24sIGdyb3VwU2V0dGluZ3MuZ2VuZXJhdGVkQ3RhU2VsZWN0b3IoKSk7XG4gICAgJGN0YVRhcmdldHMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRjdGFUYXJnZXQgPSAkKHRoaXMpO1xuICAgICAgICB2YXIgYW50SXRlbUlkID0gZ2VuZXJhdGVBbnRJdGVtQXR0cmlidXRlKCk7XG4gICAgICAgICRjdGFUYXJnZXQuYXR0cignYW50LWl0ZW0nLCBhbnRJdGVtSWQpO1xuICAgICAgICB2YXIgYXV0b0N0YSA9IEF1dG9DYWxsVG9BY3Rpb24uY3JlYXRlKGFudEl0ZW1JZCwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAkY3RhVGFyZ2V0LmFmdGVyKGF1dG9DdGEuZWxlbWVudCk7IC8vIFRPRE86IG1ha2UgdGhlIGluc2VydCBiZWhhdmlvciBjb25maWd1cmFibGUgbGlrZSB0aGUgc3VtbWFyeVxuICAgICAgICBjcmVhdGVkV2lkZ2V0cy5wdXNoKGF1dG9DdGEpO1xuICAgIH0pO1xufVxuXG52YXIgZ2VuZXJhdGVBbnRJdGVtQXR0cmlidXRlID0gZnVuY3Rpb24oaW5kZXgpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiAnYW50ZW5uYV9hdXRvX2N0YV8nICsgaW5kZXgrKztcbiAgICB9XG59KDApO1xuXG5mdW5jdGlvbiBzY2FuRm9yQ29udGVudCgkZWxlbWVudCwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgJGNvbnRlbnRFbGVtZW50cyA9IGZpbmQoJGVsZW1lbnQsIGdyb3VwU2V0dGluZ3MuY29udGVudFNlbGVjdG9yKCksIHRydWUpO1xuICAgICRjb250ZW50RWxlbWVudHMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRjb250ZW50RWxlbWVudCA9ICQodGhpcyk7XG4gICAgICAgIHZhciB0eXBlID0gY29tcHV0ZUVsZW1lbnRUeXBlKCRjb250ZW50RWxlbWVudCk7XG4gICAgICAgIHN3aXRjaCh0eXBlKSB7XG4gICAgICAgICAgICBjYXNlIFRZUEVfSU1BR0U6XG4gICAgICAgICAgICBjYXNlIFRZUEVfTUVESUE6XG4gICAgICAgICAgICAgICAgc2Nhbk1lZGlhKCRjb250ZW50RWxlbWVudCwgdHlwZSwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBUWVBFX1RFWFQ6XG4gICAgICAgICAgICAgICAgc2NhblRleHQoJGNvbnRlbnRFbGVtZW50LCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gc2NhblRleHQoJHRleHRFbGVtZW50LCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIGlmIChzaG91bGRIYXNoVGV4dCgkdGV4dEVsZW1lbnQsIGdyb3VwU2V0dGluZ3MpKSB7XG4gICAgICAgIHZhciBoYXNoID0gY29tcHV0ZUhhc2goJHRleHRFbGVtZW50LCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIGlmIChoYXNoKSB7XG4gICAgICAgICAgICB2YXIgY29udGFpbmVyRGF0YSA9IFBhZ2VEYXRhLmdldENvbnRhaW5lckRhdGEocGFnZURhdGEsIGhhc2gpO1xuICAgICAgICAgICAgY29udGFpbmVyRGF0YS50eXBlID0gJ3RleHQnOyAvLyBUT0RPOiByZXZpc2l0IHdoZXRoZXIgaXQgbWFrZXMgc2Vuc2UgdG8gc2V0IHRoZSB0eXBlIGhlcmVcbiAgICAgICAgICAgIHZhciBkZWZhdWx0UmVhY3Rpb25zID0gZ3JvdXBTZXR0aW5ncy5kZWZhdWx0UmVhY3Rpb25zKCR0ZXh0RWxlbWVudCk7XG4gICAgICAgICAgICB2YXIgdGV4dEluZGljYXRvciA9IFRleHRJbmRpY2F0b3JXaWRnZXQuY3JlYXRlKHtcbiAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyRGF0YTogY29udGFpbmVyRGF0YSxcbiAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyRWxlbWVudDogJHRleHRFbGVtZW50LFxuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0UmVhY3Rpb25zOiBkZWZhdWx0UmVhY3Rpb25zLFxuICAgICAgICAgICAgICAgICAgICBwYWdlRGF0YTogcGFnZURhdGEsXG4gICAgICAgICAgICAgICAgICAgIGdyb3VwU2V0dGluZ3M6IGdyb3VwU2V0dGluZ3NcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgdmFyICRpbmRpY2F0b3JFbGVtZW50ID0gdGV4dEluZGljYXRvci5lbGVtZW50O1xuICAgICAgICAgICAgdmFyIGxhc3ROb2RlID0gbGFzdENvbnRlbnROb2RlKCR0ZXh0RWxlbWVudC5nZXQoMCkpO1xuICAgICAgICAgICAgaWYgKGxhc3ROb2RlLm5vZGVUeXBlICE9PSAzKSB7XG4gICAgICAgICAgICAgICAgJChsYXN0Tm9kZSkuYmVmb3JlKCRpbmRpY2F0b3JFbGVtZW50KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgJHRleHRFbGVtZW50LmFwcGVuZCgkaW5kaWNhdG9yRWxlbWVudCk7IC8vIFRPRE8gaXMgdGhpcyBjb25maWd1cmFibGUgYWxhIGluc2VydENvbnRlbnQoLi4uKT9cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNyZWF0ZWRXaWRnZXRzLnB1c2godGV4dEluZGljYXRvcik7XG5cbiAgICAgICAgICAgIHZhciB0ZXh0UmVhY3Rpb25zID0gVGV4dFJlYWN0aW9ucy5jcmVhdGVSZWFjdGFibGVUZXh0KHtcbiAgICAgICAgICAgICAgICBjb250YWluZXJEYXRhOiBjb250YWluZXJEYXRhLFxuICAgICAgICAgICAgICAgIGNvbnRhaW5lckVsZW1lbnQ6ICR0ZXh0RWxlbWVudCxcbiAgICAgICAgICAgICAgICBkZWZhdWx0UmVhY3Rpb25zOiBkZWZhdWx0UmVhY3Rpb25zLFxuICAgICAgICAgICAgICAgIHBhZ2VEYXRhOiBwYWdlRGF0YSxcbiAgICAgICAgICAgICAgICBncm91cFNldHRpbmdzOiBncm91cFNldHRpbmdzLFxuICAgICAgICAgICAgICAgIGV4Y2x1ZGVOb2RlOiAkaW5kaWNhdG9yRWxlbWVudC5nZXQoMClcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY3JlYXRlZFdpZGdldHMucHVzaCh0ZXh0UmVhY3Rpb25zKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLy8gV2UgdXNlIHRoaXMgdG8gaGFuZGxlIHRoZSBzaW1wbGUgY2FzZSBvZiB0ZXh0IGNvbnRlbnQgdGhhdCBlbmRzIHdpdGggc29tZSBtZWRpYSBhcyBpblxuLy8gPHA+TXkgdGV4dC4gPGltZyBzcmM9XCJ3aGF0ZXZlclwiPjwvcD4uXG4vLyBUaGlzIGlzIGEgc2ltcGxpc3RpYyBhbGdvcml0aG0sIG5vdCBhIGdlbmVyYWwgc29sdXRpb246XG4vLyBXZSB3YWxrIHRoZSBET00gaW5zaWRlIHRoZSBnaXZlbiBub2RlIGFuZCBrZWVwIHRyYWNrIG9mIHRoZSBsYXN0IFwiY29udGVudFwiIG5vZGUgdGhhdCB3ZSBlbmNvdW50ZXIsIHdoaWNoIGNvdWxkIGJlIGVpdGhlclxuLy8gdGV4dCBvciBzb21lIG1lZGlhLiAgSWYgdGhlIGxhc3QgY29udGVudCBub2RlIGlzIG5vdCB0ZXh0LCB3ZSB3YW50IHRvIGluc2VydCB0aGUgdGV4dCBpbmRpY2F0b3IgYmVmb3JlIHRoZSBtZWRpYS5cbmZ1bmN0aW9uIGxhc3RDb250ZW50Tm9kZShub2RlKSB7XG4gICAgdmFyIGxhc3ROb2RlO1xuICAgIHZhciBjaGlsZE5vZGVzID0gbm9kZS5jaGlsZE5vZGVzO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGROb2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgY2hpbGQgPSBjaGlsZE5vZGVzW2ldO1xuICAgICAgICBpZiAoY2hpbGQubm9kZVR5cGUgPT09IDMpIHtcbiAgICAgICAgICAgIGxhc3ROb2RlID0gY2hpbGQ7XG4gICAgICAgIH0gZWxzZSBpZiAoY2hpbGQubm9kZVR5cGUgPT09IDEpIHtcbiAgICAgICAgICAgIHZhciB0YWdOYW1lID0gY2hpbGQudGFnTmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgc3dpdGNoICh0YWdOYW1lKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAnaW1nJzpcbiAgICAgICAgICAgICAgICBjYXNlICdpZnJhbWUnOlxuICAgICAgICAgICAgICAgIGNhc2UgJ3ZpZGVvJzpcbiAgICAgICAgICAgICAgICBjYXNlICdpZnJhbWUnOlxuICAgICAgICAgICAgICAgICAgICBsYXN0Tm9kZSA9IGNoaWxkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGxhc3ROb2RlID0gbGFzdENvbnRlbnROb2RlKGNoaWxkKSB8fCBsYXN0Tm9kZTtcbiAgICB9XG4gICAgcmV0dXJuIGxhc3ROb2RlO1xufVxuXG5mdW5jdGlvbiBzaG91bGRIYXNoVGV4dCgkdGV4dEVsZW1lbnQsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICBpZiAoKGlzQ3RhKCR0ZXh0RWxlbWVudCwgZ3JvdXBTZXR0aW5ncykpKSB7XG4gICAgICAgIC8vIERvbid0IGhhc2ggdGhlIHRleHQgaWYgaXQgaXMgdGhlIHRhcmdldCBvZiBhIENUQS5cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAvLyBEb24ndCBjcmVhdGUgYW4gaW5kaWNhdG9yIGZvciB0ZXh0IGVsZW1lbnRzIHRoYXQgY29udGFpbiBvdGhlciB0ZXh0IG5vZGVzLlxuICAgIHZhciAkbmVzdGVkRWxlbWVudHMgPSBmaW5kKCR0ZXh0RWxlbWVudCwgZ3JvdXBTZXR0aW5ncy5jb250ZW50U2VsZWN0b3IoKSk7XG4gICAgJG5lc3RlZEVsZW1lbnRzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICgoY29tcHV0ZUVsZW1lbnRUeXBlKCQodGhpcykpID09PSBUWVBFX1RFWFQpKSB7XG4gICAgICAgICAgICAvLyBEb24ndCBoYXNoIGEgdGV4dCBlbGVtZW50IGlmIGl0IGNvbnRhaW5zIGFueSBvdGhlciBtYXRjaGVkIHRleHQgZWxlbWVudHNcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiBpc0N0YSgkZWxlbWVudCwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBjb21wb3NpdGVTZWxlY3RvciA9IGdyb3VwU2V0dGluZ3MuZ2VuZXJhdGVkQ3RhU2VsZWN0b3IoKSArICcsW2FudC1pdGVtXSc7XG4gICAgcmV0dXJuICRlbGVtZW50LmlzKGNvbXBvc2l0ZVNlbGVjdG9yKTtcbn1cblxuLy8gVGhlIFwiaW1hZ2VcIiBhbmQgXCJtZWRpYVwiIHBhdGhzIGNvbnZlcmdlIGhlcmUsIGJlY2F1c2Ugd2UgdXNlIHRoZSBzYW1lIGluZGljYXRvciBtb2R1bGUgZm9yIHRoZW0gYm90aC5cbmZ1bmN0aW9uIHNjYW5NZWRpYSgkbWVkaWFFbGVtZW50LCB0eXBlLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBpbmRpY2F0b3I7XG4gICAgdmFyIGhhc2ggPSBjb21wdXRlSGFzaCgkbWVkaWFFbGVtZW50LCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgaWYgKGhhc2gpIHtcbiAgICAgICAgdmFyIGNvbnRhaW5lckRhdGEgPSBQYWdlRGF0YS5nZXRDb250YWluZXJEYXRhKHBhZ2VEYXRhLCBoYXNoKTtcbiAgICAgICAgY29udGFpbmVyRGF0YS50eXBlID0gdHlwZSA9PT0gVFlQRV9JTUFHRSA/ICdpbWFnZScgOiAnbWVkaWEnO1xuICAgICAgICB2YXIgZGVmYXVsdFJlYWN0aW9ucyA9IGdyb3VwU2V0dGluZ3MuZGVmYXVsdFJlYWN0aW9ucygkbWVkaWFFbGVtZW50KTtcbiAgICAgICAgdmFyIGNvbnRlbnREYXRhID0gY29tcHV0ZUNvbnRlbnREYXRhKCRtZWRpYUVsZW1lbnQsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICBpZiAoY29udGVudERhdGEgJiYgY29udGVudERhdGEuZGltZW5zaW9ucykge1xuICAgICAgICAgICAgaWYgKGNvbnRlbnREYXRhLmRpbWVuc2lvbnMuaGVpZ2h0ID49IDEwMCAmJiBjb250ZW50RGF0YS5kaW1lbnNpb25zLndpZHRoID49IDEwMCkgeyAvLyBEb24ndCBjcmVhdGUgaW5kaWNhdG9yIG9uIGVsZW1lbnRzIHRoYXQgYXJlIHRvbyBzbWFsbFxuICAgICAgICAgICAgICAgIGluZGljYXRvciA9IE1lZGlhSW5kaWNhdG9yV2lkZ2V0LmNyZWF0ZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50OiBXaWRnZXRCdWNrZXQuZ2V0KCksXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250YWluZXJEYXRhOiBjb250YWluZXJEYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudERhdGE6IGNvbnRlbnREYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyRWxlbWVudDogJG1lZGlhRWxlbWVudCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHRSZWFjdGlvbnM6IGRlZmF1bHRSZWFjdGlvbnMsXG4gICAgICAgICAgICAgICAgICAgICAgICBwYWdlRGF0YTogcGFnZURhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICBncm91cFNldHRpbmdzOiBncm91cFNldHRpbmdzXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIGNyZWF0ZWRXaWRnZXRzLnB1c2goaW5kaWNhdG9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICAvLyBMaXN0ZW4gZm9yIGNoYW5nZXMgdG8gdGhlIGltYWdlIGF0dHJpYnV0ZXMgd2hpY2ggY291bGQgaW5kaWNhdGUgY29udGVudCBjaGFuZ2VzLlxuICAgIE11dGF0aW9uT2JzZXJ2ZXIuYWRkT25lVGltZUF0dHJpYnV0ZUxpc3RlbmVyKCRtZWRpYUVsZW1lbnQuZ2V0KDApLCBbJ3NyYycsJ2FudC1pdGVtLWNvbnRlbnQnLCdkYXRhJ10sIGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoaW5kaWNhdG9yKSB7XG4gICAgICAgICAgICAvLyBUT0RPOiB1cGRhdGUgSGFzaGVkRWxlbWVudHMgdG8gcmVtb3ZlIHRoZSBwcmV2aW91cyBoYXNoLT5lbGVtZW50IG1hcHBpbmcuIENvbnNpZGVyIHRoZXJlIGNvdWxkIGJlIG11bHRpcGxlXG4gICAgICAgICAgICAvLyAgICAgICBpbnN0YW5jZXMgb2YgdGhlIHNhbWUgZWxlbWVudCBvbiBhIHBhZ2UuLi4gc28gd2UgbWlnaHQgbmVlZCB0byB1c2UgYSBjb3VudGVyLlxuICAgICAgICAgICAgaW5kaWNhdG9yLnRlYXJkb3duKCk7XG4gICAgICAgIH1cbiAgICAgICAgc2Nhbk1lZGlhKCRtZWRpYUVsZW1lbnQsIHR5cGUsIHBhZ2VEYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gZmluZCgkZWxlbWVudCwgc2VsZWN0b3IsIGFkZEJhY2spIHtcbiAgICB2YXIgcmVzdWx0ID0gJGVsZW1lbnQuZmluZChzZWxlY3Rvcik7XG4gICAgaWYgKGFkZEJhY2sgJiYgc2VsZWN0b3IpIHsgLy8gd2l0aCBhbiB1bmRlZmluZWQgc2VsZWN0b3IsIGFkZEJhY2sgd2lsbCBtYXRjaCBhbmQgYWx3YXlzIHJldHVybiB0aGUgaW5wdXQgZWxlbWVudCAodW5saWtlIGZpbmQoKSB3aGljaCByZXR1cm5zIGFuIGVtcHR5IG1hdGNoKVxuICAgICAgICByZXN1bHQgPSByZXN1bHQuYWRkQmFjayhzZWxlY3Rvcik7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQuZmlsdGVyKGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gJCh0aGlzKS5jbG9zZXN0KCcubm8tYW50JykubGVuZ3RoID09IDA7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGluc2VydENvbnRlbnQoJHBhcmVudCwgY29udGVudCwgbWV0aG9kKSB7XG4gICAgc3dpdGNoIChtZXRob2QpIHtcbiAgICAgICAgY2FzZSAnYXBwZW5kJzpcbiAgICAgICAgICAgICRwYXJlbnQuYXBwZW5kKGNvbnRlbnQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3ByZXBlbmQnOlxuICAgICAgICAgICAgJHBhcmVudC5wcmVwZW5kKGNvbnRlbnQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2JlZm9yZSc6XG4gICAgICAgICAgICAkcGFyZW50LmJlZm9yZShjb250ZW50KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdhZnRlcic6XG4gICAgICAgICAgICAkcGFyZW50LmFmdGVyKGNvbnRlbnQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBjb21wdXRlSGFzaCgkZWxlbWVudCwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgaGFzaDtcbiAgICBzd2l0Y2ggKGNvbXB1dGVFbGVtZW50VHlwZSgkZWxlbWVudCkpIHtcbiAgICAgICAgY2FzZSBUWVBFX0lNQUdFOlxuICAgICAgICAgICAgdmFyIGltYWdlVXJsID0gVVJMcy5jb21wdXRlSW1hZ2VVcmwoJGVsZW1lbnQsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgaGFzaCA9IEhhc2guaGFzaEltYWdlKGltYWdlVXJsKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFRZUEVfTUVESUE6XG4gICAgICAgICAgICB2YXIgbWVkaWFVcmwgPSBVUkxzLmNvbXB1dGVNZWRpYVVybCgkZWxlbWVudCwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICBoYXNoID0gSGFzaC5oYXNoTWVkaWEobWVkaWFVcmwpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgVFlQRV9URVhUOlxuICAgICAgICAgICAgaGFzaCA9IEhhc2guaGFzaFRleHQoJGVsZW1lbnQpO1xuICAgICAgICAgICAgdmFyIGluY3JlbWVudCA9IDE7XG4gICAgICAgICAgICB3aGlsZSAoSGFzaGVkRWxlbWVudHMuZ2V0RWxlbWVudChoYXNoLCBwYWdlRGF0YS5wYWdlSGFzaCkpIHtcbiAgICAgICAgICAgICAgICBoYXNoID0gSGFzaC5oYXNoVGV4dCgkZWxlbWVudCwgaW5jcmVtZW50KyspO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGlmIChoYXNoKSB7XG4gICAgICAgIEhhc2hlZEVsZW1lbnRzLnNldEVsZW1lbnQoaGFzaCwgcGFnZURhdGEucGFnZUhhc2gsICRlbGVtZW50KTsgLy8gUmVjb3JkIHRoZSByZWxhdGlvbnNoaXAgYmV0d2VlbiB0aGUgaGFzaCBhbmQgZG9tIGVsZW1lbnQuXG4gICAgICAgIGlmIChBcHBNb2RlLmRlYnVnKSB7XG4gICAgICAgICAgICAkZWxlbWVudC5hdHRyKEFUVFJfSEFTSCwgaGFzaCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGhhc2g7XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVDb250ZW50RGF0YSgkZWxlbWVudCwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciBjb250ZW50RGF0YTtcbiAgICBzd2l0Y2ggKGNvbXB1dGVFbGVtZW50VHlwZSgkZWxlbWVudCkpIHtcbiAgICAgICAgY2FzZSBUWVBFX0lNQUdFOlxuICAgICAgICAgICAgdmFyIGltYWdlVXJsID0gVVJMcy5jb21wdXRlSW1hZ2VVcmwoJGVsZW1lbnQsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgdmFyIGltYWdlRGltZW5zaW9ucyA9IHtcbiAgICAgICAgICAgICAgICBoZWlnaHQ6ICRlbGVtZW50LmhlaWdodCgpLCAvLyBUT0RPOiByZXZpZXcgaG93IHdlIGdldCB0aGUgaW1hZ2UgZGltZW5zaW9uc1xuICAgICAgICAgICAgICAgIHdpZHRoOiAkZWxlbWVudC53aWR0aCgpXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgY29udGVudERhdGEgPSB7XG4gICAgICAgICAgICAgICAgdHlwZTogJ2ltZycsXG4gICAgICAgICAgICAgICAgYm9keTogaW1hZ2VVcmwsXG4gICAgICAgICAgICAgICAgZGltZW5zaW9uczogaW1hZ2VEaW1lbnNpb25zXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgVFlQRV9NRURJQTpcbiAgICAgICAgICAgIHZhciBtZWRpYVVybCA9IFVSTHMuY29tcHV0ZU1lZGlhVXJsKCRlbGVtZW50LCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgICAgIHZhciBtZWRpYURpbWVuc2lvbnMgPSB7XG4gICAgICAgICAgICAgICAgaGVpZ2h0OiAkZWxlbWVudC5oZWlnaHQoKSwgLy8gVE9ETzogcmV2aWV3IGhvdyB3ZSBnZXQgdGhlIG1lZGlhIGRpbWVuc2lvbnNcbiAgICAgICAgICAgICAgICB3aWR0aDogJGVsZW1lbnQud2lkdGgoKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGNvbnRlbnREYXRhID0ge1xuICAgICAgICAgICAgICAgIHR5cGU6ICdtZWRpYScsXG4gICAgICAgICAgICAgICAgYm9keTogbWVkaWFVcmwsXG4gICAgICAgICAgICAgICAgZGltZW5zaW9uczogbWVkaWFEaW1lbnNpb25zXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgVFlQRV9URVhUOlxuICAgICAgICAgICAgY29udGVudERhdGEgPSB7IHR5cGU6ICd0ZXh0JyB9O1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIHJldHVybiBjb250ZW50RGF0YTtcbn1cblxuZnVuY3Rpb24gY29tcHV0ZUVsZW1lbnRUeXBlKCRlbGVtZW50KSB7XG4gICAgdmFyIGl0ZW1UeXBlID0gJGVsZW1lbnQuYXR0cignYW50LWl0ZW0tdHlwZScpO1xuICAgIGlmIChpdGVtVHlwZSAmJiBpdGVtVHlwZS50cmltKCkubGVuZ3RoID4gMCkge1xuICAgICAgICByZXR1cm4gaXRlbVR5cGUudHJpbSgpO1xuICAgIH1cbiAgICB2YXIgdGFnTmFtZSA9ICRlbGVtZW50LnByb3AoJ3RhZ05hbWUnKS50b0xvd2VyQ2FzZSgpO1xuICAgIHN3aXRjaCAodGFnTmFtZSkge1xuICAgICAgICBjYXNlICdpbWcnOlxuICAgICAgICAgICAgcmV0dXJuIFRZUEVfSU1BR0U7XG4gICAgICAgIGNhc2UgJ3ZpZGVvJzpcbiAgICAgICAgY2FzZSAnaWZyYW1lJzpcbiAgICAgICAgY2FzZSAnZW1iZWQnOlxuICAgICAgICAgICAgcmV0dXJuIFRZUEVfTUVESUE7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICByZXR1cm4gVFlQRV9URVhUO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gc2V0dXBNdXRhdGlvbk9ic2VydmVyKGdyb3VwU2V0dGluZ3MpIHtcbiAgICBNdXRhdGlvbk9ic2VydmVyLmFkZEFkZGl0aW9uTGlzdGVuZXIoZWxlbWVudHNBZGRlZCk7XG5cbiAgICBmdW5jdGlvbiBlbGVtZW50c0FkZGVkKCRlbGVtZW50cykge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8ICRlbGVtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyICRlbGVtZW50ID0gJGVsZW1lbnRzW2ldO1xuICAgICAgICAgICAgJGVsZW1lbnQuZmluZChncm91cFNldHRpbmdzLmV4Y2x1c2lvblNlbGVjdG9yKCkpLmFkZEJhY2soZ3JvdXBTZXR0aW5ncy5leGNsdXNpb25TZWxlY3RvcigpKS5hZGRDbGFzcygnbm8tYW50Jyk7IC8vIEFkZCB0aGUgbm8tYW50IGNsYXNzIHRvIGV2ZXJ5dGhpbmcgdGhhdCBpcyBmbGFnZ2VkIGZvciBleGNsdXNpb25cbiAgICAgICAgICAgIGlmICgkZWxlbWVudC5jbG9zZXN0KCcubm8tYW50JykubGVuZ3RoID09PSAwKSB7IC8vIElnbm9yZSBhbnl0aGluZyB0YWdnZWQgbm8tYW50XG4gICAgICAgICAgICAgICAgLy8gRmlyc3QsIHNlZSBpZiBhbnkgZW50aXJlIHBhZ2VzIHdlcmUgYWRkZWRcbiAgICAgICAgICAgICAgICB2YXIgJHBhZ2VzID0gZmluZCgkZWxlbWVudCwgZ3JvdXBTZXR0aW5ncy5wYWdlU2VsZWN0b3IoKSwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgaWYgKCRwYWdlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIFBhZ2VEYXRhTG9hZGVyLnBhZ2VzQWRkZWQoJHBhZ2VzLCBncm91cFNldHRpbmdzKTsgLy8gVE9ETzogY29uc2lkZXIgaWYgdGhlcmUncyBhIGJldHRlciB3YXkgdG8gYXJjaGl0ZWN0IHRoaXNcbiAgICAgICAgICAgICAgICAgICAgJHBhZ2VzLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2NhblBhZ2UoJCh0aGlzKSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIElmIG5vdCBhbiBlbnRpcmUgcGFnZS9wYWdlcywgc2VlIGlmIGNvbnRlbnQgd2FzIGFkZGVkIHRvIGFuIGV4aXN0aW5nIHBhZ2VcbiAgICAgICAgICAgICAgICAgICAgdmFyICRwYWdlID0gJGVsZW1lbnQuY2xvc2VzdChncm91cFNldHRpbmdzLnBhZ2VTZWxlY3RvcigpKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCRwYWdlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHBhZ2UgPSAkKCdib2R5Jyk7IC8vIFRPRE86IGlzIHRoaXMgcmlnaHQ/IGtlZXAgaW4gc3luYyB3aXRoIHNjYW5BbGxQYWdlc1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHZhciB1cmwgPSBQYWdlVXRpbHMuY29tcHV0ZVBhZ2VVcmwoJHBhZ2UsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgcGFnZURhdGEgPSBQYWdlRGF0YS5nZXRQYWdlRGF0YUJ5VVJMKHVybCk7XG4gICAgICAgICAgICAgICAgICAgIC8vIEZpcnN0LCBjaGVjayBmb3IgYW55IG5ldyBzdW1tYXJ5IHdpZGdldHMuLi5cbiAgICAgICAgICAgICAgICAgICAgc2NhbkZvclN1bW1hcmllcygkZWxlbWVudCwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgICAgICAgICAvLyBOZXh0LCBzZWUgaWYgYW55IGVudGlyZSBhY3RpdmUgc2VjdGlvbnMgd2VyZSBhZGRlZFxuICAgICAgICAgICAgICAgICAgICB2YXIgJGFjdGl2ZVNlY3Rpb25zID0gZmluZCgkZWxlbWVudCwgZ3JvdXBTZXR0aW5ncy5hY3RpdmVTZWN0aW9ucygpKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCRhY3RpdmVTZWN0aW9ucy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkYWN0aXZlU2VjdGlvbnMuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3JlYXRlQXV0b0NhbGxzVG9BY3Rpb24oJCh0aGlzKSwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkYWN0aXZlU2VjdGlvbnMuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyICRzZWN0aW9uID0gJCh0aGlzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY2FuQWN0aXZlRWxlbWVudCgkc2VjdGlvbiwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBGaW5hbGx5LCBzY2FuIGluc2lkZSB0aGUgZWxlbWVudCBmb3IgY29udGVudFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyICRhY3RpdmVTZWN0aW9uID0gJGVsZW1lbnQuY2xvc2VzdChncm91cFNldHRpbmdzLmFjdGl2ZVNlY3Rpb25zKCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCRhY3RpdmVTZWN0aW9uLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjcmVhdGVBdXRvQ2FsbHNUb0FjdGlvbigkZWxlbWVudCwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjYW5BY3RpdmVFbGVtZW50KCRlbGVtZW50LCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIHRoZSBlbGVtZW50IGlzIGFkZGVkIG91dHNpZGUgYW4gYWN0aXZlIHNlY3Rpb24sIGp1c3QgY2hlY2sgaXQgZm9yIENUQXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY2FuRm9yQ2FsbHNUb0FjdGlvbigkZWxlbWVudCwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiB0ZWFyZG93bigpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNyZWF0ZWRXaWRnZXRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNyZWF0ZWRXaWRnZXRzW2ldLnRlYXJkb3duKCk7XG4gICAgfVxuICAgIGNyZWF0ZWRXaWRnZXRzID0gW107XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBzY2FuOiBzY2FuQWxsUGFnZXMsXG4gICAgdGVhcmRvd246IHRlYXJkb3duXG59OyIsInZhciAkOyByZXF1aXJlKCcuL3V0aWxzL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIFJhY3RpdmU7IHJlcXVpcmUoJy4vdXRpbHMvcmFjdGl2ZS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihsb2FkZWRSYWN0aXZlKSB7IFJhY3RpdmUgPSBsb2FkZWRSYWN0aXZlO30pO1xudmFyIFdpZGdldEJ1Y2tldCA9IHJlcXVpcmUoJy4vdXRpbHMvd2lkZ2V0LWJ1Y2tldCcpO1xudmFyIFRyYW5zaXRpb25VdGlsID0gcmVxdWlyZSgnLi91dGlscy90cmFuc2l0aW9uLXV0aWwnKTtcblxudmFyIFNWR3MgPSByZXF1aXJlKCcuL3N2Z3MnKTtcblxudmFyIHJhY3RpdmU7XG52YXIgY2xpY2tIYW5kbGVyO1xuXG5cbmZ1bmN0aW9uIGdldFJvb3RFbGVtZW50KCkge1xuICAgIC8vIFRPRE8gcmV2aXNpdCB0aGlzLCBpdCdzIGtpbmQgb2YgZ29vZnkgYW5kIGl0IG1pZ2h0IGhhdmUgYSB0aW1pbmcgcHJvYmxlbVxuICAgIGlmICghcmFjdGl2ZSkge1xuICAgICAgICB2YXIgYnVja2V0ID0gV2lkZ2V0QnVja2V0LmdldCgpO1xuICAgICAgICByYWN0aXZlID0gUmFjdGl2ZSh7XG4gICAgICAgICAgICBlbDogYnVja2V0LFxuICAgICAgICAgICAgYXBwZW5kOiB0cnVlLFxuICAgICAgICAgICAgdGVtcGxhdGU6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9wb3B1cC13aWRnZXQuaGJzLmh0bWwnKSxcbiAgICAgICAgICAgIHBhcnRpYWxzOiB7XG4gICAgICAgICAgICAgICAgbG9nbzogU1ZHcy5sb2dvXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB2YXIgJGVsZW1lbnQgPSAkKHJhY3RpdmUuZmluZCgnLmFudGVubmEtcG9wdXAnKSk7XG4gICAgICAgICRlbGVtZW50Lm9uKCdtb3VzZWRvd24nLCBmYWxzZSk7IC8vIFByZXZlbnQgbW91c2Vkb3duIGZyb20gcHJvcGFnYXRpbmcsIHNvIHRoZSBicm93c2VyIGRvZXNuJ3QgY2xlYXIgdGhlIHRleHQgc2VsZWN0aW9uLlxuICAgICAgICAkZWxlbWVudC5vbignY2xpY2suYW50ZW5uYS1wb3B1cCcsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIGhpZGVQb3B1cCgkZWxlbWVudCk7XG4gICAgICAgICAgICBpZiAoY2xpY2tIYW5kbGVyKSB7XG4gICAgICAgICAgICAgICAgY2xpY2tIYW5kbGVyKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICAvLyBUaGUgOmhvdmVyIHBzZXVkbyBjbGFzcyBjYW4gYmVjb21lIHN0dWNrIG9uIHRoZSBhbnRlbm5hLXBvcHVwIGVsZW1lbnQgd2hlbiB3ZSBicmluZyB1cCB0aGUgcmVhY3Rpb24gd2luZG93XG4gICAgICAgIC8vIGluIHJlc3BvbnNlIHRvIHRoZSBjbGljay4gU28gaGVyZSB3ZSBhZGQvcmVtb3ZlIG91ciBvd24gaG92ZXIgY2xhc3MgaW5zdGVhZC5cbiAgICAgICAgLy8gU2VlOiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzEwMzIxMjc1L2hvdmVyLXN0YXRlLWlzLXN0aWNreS1hZnRlci1lbGVtZW50LWlzLW1vdmVkLW91dC1mcm9tLXVuZGVyLXRoZS1tb3VzZS1pbi1hbGwtYnJcbiAgICAgICAgJGVsZW1lbnQub24oJ21vdXNlZW50ZXInLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgJGVsZW1lbnQuYWRkQ2xhc3MoJ2hvdmVyJyk7XG4gICAgICAgIH0pO1xuICAgICAgICAkZWxlbWVudC5vbignbW91c2VsZWF2ZScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgJGVsZW1lbnQucmVtb3ZlQ2xhc3MoJ2hvdmVyJyk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gJGVsZW1lbnQ7XG4gICAgfVxuICAgIHJldHVybiAkKHJhY3RpdmUuZmluZCgnLmFudGVubmEtcG9wdXAnKSk7XG59XG5cbmZ1bmN0aW9uIHNob3dQb3B1cChjb29yZGluYXRlcywgY2FsbGJhY2spIHtcbiAgICB2YXIgJGVsZW1lbnQgPSBnZXRSb290RWxlbWVudCgpO1xuICAgIGlmICghJGVsZW1lbnQuaGFzQ2xhc3MoJ3Nob3cnKSkge1xuICAgICAgICBjbGlja0hhbmRsZXIgPSBjYWxsYmFjaztcbiAgICAgICAgJGVsZW1lbnRcbiAgICAgICAgICAgIC5zaG93KCkgLy8gc3RpbGwgaGFzIG9wYWNpdHkgMCBhdCB0aGlzIHBvaW50XG4gICAgICAgICAgICAuY3NzKHtcbiAgICAgICAgICAgICAgICB0b3A6IGNvb3JkaW5hdGVzLnRvcCAtICRlbGVtZW50Lm91dGVySGVpZ2h0KCkgLSA2LCAvLyBUT0RPIGZpbmQgYSBjbGVhbmVyIHdheSB0byBhY2NvdW50IGZvciB0aGUgcG9wdXAgJ3RhaWwnXG4gICAgICAgICAgICAgICAgbGVmdDogY29vcmRpbmF0ZXMubGVmdCAtIE1hdGguZmxvb3IoJGVsZW1lbnQub3V0ZXJXaWR0aCgpIC8gMilcbiAgICAgICAgICAgIH0pO1xuICAgICAgICBUcmFuc2l0aW9uVXRpbC50b2dnbGVDbGFzcygkZWxlbWVudCwgJ3Nob3cnLCB0cnVlLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIFRPRE86IGFmdGVyIHRoZSBhcHBlYXJhbmNlIHRyYW5zaXRpb24gaXMgY29tcGxldGUsIGFkZCBhIGhhbmRsZXIgZm9yIG1vdXNlZW50ZXIgd2hpY2ggdGhlbiByZWdpc3RlcnNcbiAgICAgICAgICAgIC8vICAgICAgIGEgaGFuZGxlciBmb3IgbW91c2VsZWF2ZSB0aGF0IGhpZGVzIHRoZSBwb3B1cFxuXG4gICAgICAgICAgICAvLyBUT0RPOiBhbHNvIHRha2UgZG93biB0aGUgcG9wdXAgaWYgdGhlIHVzZXIgbW91c2VzIG92ZXIgYW5vdGhlciB3aWRnZXQgKHN1bW1hcnkgb3IgaW5kaWNhdG9yKVxuICAgICAgICAgICAgJChkb2N1bWVudCkub24oJ2NsaWNrLmFudGVubmEtcG9wdXAnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaGlkZVBvcHVwKCRlbGVtZW50KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGhpZGVQb3B1cCgkZWxlbWVudCkge1xuICAgIFRyYW5zaXRpb25VdGlsLnRvZ2dsZUNsYXNzKCRlbGVtZW50LCAnc2hvdycsIGZhbHNlLCBmdW5jdGlvbigpIHtcbiAgICAgICAgJGVsZW1lbnQuaGlkZSgpOyAvLyBhZnRlciB3ZSdyZSBhdCBvcGFjaXR5IDAsIGhpZGUgdGhlIGVsZW1lbnQgc28gaXQgZG9lc24ndCByZWNlaXZlIGFjY2lkZW50YWwgY2xpY2tzXG4gICAgfSk7XG4gICAgJChkb2N1bWVudCkub2ZmKCdjbGljay5hbnRlbm5hLXBvcHVwJyk7XG59XG5cbmZ1bmN0aW9uIHRlYXJkb3duKCkge1xuICAgIGlmIChyYWN0aXZlKSB7XG4gICAgICAgIHJhY3RpdmUudGVhcmRvd24oKTtcbiAgICAgICAgcmFjdGl2ZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgY2xpY2tIYW5kbGVyID0gdW5kZWZpbmVkO1xuICAgIH1cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHNob3c6IHNob3dQb3B1cCxcbiAgICB0ZWFyZG93bjogdGVhcmRvd25cbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgUmFjdGl2ZTsgcmVxdWlyZSgnLi91dGlscy9yYWN0aXZlLXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGxvYWRlZFJhY3RpdmUpIHsgUmFjdGl2ZSA9IGxvYWRlZFJhY3RpdmU7fSk7XG5cbnZhciBBamF4Q2xpZW50ID0gcmVxdWlyZSgnLi91dGlscy9hamF4LWNsaWVudCcpO1xudmFyIFJhbmdlID0gcmVxdWlyZSgnLi91dGlscy9yYW5nZScpO1xudmFyIFJlYWN0aW9uc1dpZGdldExheW91dFV0aWxzID0gcmVxdWlyZSgnLi91dGlscy9yZWFjdGlvbnMtd2lkZ2V0LWxheW91dC11dGlscycpO1xuXG52YXIgRXZlbnRzID0gcmVxdWlyZSgnLi9ldmVudHMnKTtcbnZhciBTVkdzID0gcmVxdWlyZSgnLi9zdmdzJyk7XG5cbnZhciBwYWdlU2VsZWN0b3IgPSAnLmFudGVubmEtcmVhY3Rpb25zLXBhZ2UnO1xuXG5mdW5jdGlvbiBjcmVhdGVQYWdlKG9wdGlvbnMpIHtcbiAgICB2YXIgaXNTdW1tYXJ5ID0gb3B0aW9ucy5pc1N1bW1hcnk7XG4gICAgdmFyIHJlYWN0aW9uc0RhdGEgPSBvcHRpb25zLnJlYWN0aW9uc0RhdGE7XG4gICAgdmFyIGNvbnRhaW5lckRhdGEgPSBvcHRpb25zLmNvbnRhaW5lckRhdGE7XG4gICAgdmFyIHBhZ2VEYXRhID0gb3B0aW9ucy5wYWdlRGF0YTtcbiAgICB2YXIgZ3JvdXBTZXR0aW5ncyA9IG9wdGlvbnMuZ3JvdXBTZXR0aW5ncztcbiAgICB2YXIgY29udGVudERhdGEgPSBvcHRpb25zLmNvbnRlbnREYXRhO1xuICAgIHZhciBjb250YWluZXJFbGVtZW50ID0gb3B0aW9ucy5jb250YWluZXJFbGVtZW50OyAvLyBvcHRpb25hbFxuICAgIHZhciBzaG93Q29uZmlybWF0aW9uID0gb3B0aW9ucy5zaG93Q29uZmlybWF0aW9uO1xuICAgIHZhciBzaG93RGVmYXVsdHMgPSBvcHRpb25zLnNob3dEZWZhdWx0cztcbiAgICB2YXIgc2hvd0NvbW1lbnRzID0gb3B0aW9ucy5zaG93Q29tbWVudHM7XG4gICAgdmFyIHNob3dMb2NhdGlvbnMgPSBvcHRpb25zLnNob3dMb2NhdGlvbnM7XG4gICAgdmFyIGVsZW1lbnQgPSBvcHRpb25zLmVsZW1lbnQ7XG4gICAgdmFyIHJlYWN0aW9uc0xheW91dERhdGEgPSBSZWFjdGlvbnNXaWRnZXRMYXlvdXRVdGlscy5jb21wdXRlTGF5b3V0RGF0YShyZWFjdGlvbnNEYXRhKTtcbiAgICB2YXIgJHJlYWN0aW9uc1dpbmRvdyA9ICQob3B0aW9ucy5yZWFjdGlvbnNXaW5kb3cpO1xuICAgIHZhciByYWN0aXZlID0gUmFjdGl2ZSh7XG4gICAgICAgIGVsOiBlbGVtZW50LFxuICAgICAgICBhcHBlbmQ6IHRydWUsXG4gICAgICAgIHRlbXBsYXRlOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvcmVhY3Rpb25zLXBhZ2UuaGJzLmh0bWwnKSxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgcmVhY3Rpb25zOiByZWFjdGlvbnNEYXRhLFxuICAgICAgICAgICAgcmVhY3Rpb25zTGF5b3V0Q2xhc3M6IGFycmF5QWNjZXNzb3IocmVhY3Rpb25zTGF5b3V0RGF0YS5sYXlvdXRDbGFzc2VzKSxcbiAgICAgICAgICAgIGlzU3VtbWFyeTogaXNTdW1tYXJ5XG4gICAgICAgIH0sXG4gICAgICAgIGRlY29yYXRvcnM6IHtcbiAgICAgICAgICAgIHNpemV0b2ZpdDogc2l6ZVRvRml0KCRyZWFjdGlvbnNXaW5kb3cpXG4gICAgICAgIH0sXG4gICAgICAgIHBhcnRpYWxzOiB7XG4gICAgICAgICAgICBsb2NhdGlvbkljb246IFNWR3MubG9jYXRpb24sXG4gICAgICAgICAgICBjb21tZW50c0ljb246IFNWR3MuY29tbWVudHNcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgaWYgKGNvbnRhaW5lckVsZW1lbnQpIHtcbiAgICAgICAgcmFjdGl2ZS5vbignaGlnaGxpZ2h0JywgaGlnaGxpZ2h0Q29udGVudChjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgY29udGFpbmVyRWxlbWVudCkpO1xuICAgICAgICByYWN0aXZlLm9uKCdjbGVhcmhpZ2hsaWdodHMnLCBSYW5nZS5jbGVhckhpZ2hsaWdodHMpO1xuICAgIH1cbiAgICByYWN0aXZlLm9uKCdwbHVzb25lJywgcGx1c09uZShjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgc2hvd0NvbmZpcm1hdGlvbiwgZ3JvdXBTZXR0aW5ncykpO1xuICAgIHJhY3RpdmUub24oJ3Nob3dkZWZhdWx0Jywgc2hvd0RlZmF1bHRzKTtcbiAgICByYWN0aXZlLm9uKCdzaG93Y29tbWVudHMnLCBmdW5jdGlvbihyYWN0aXZlRXZlbnQpIHsgc2hvd0NvbW1lbnRzKHJhY3RpdmVFdmVudC5jb250ZXh0KTsgcmV0dXJuIGZhbHNlOyB9KTsgLy8gVE9ETyBjbGVhbiB1cFxuICAgIHJhY3RpdmUub24oJ3Nob3dsb2NhdGlvbnMnLCBmdW5jdGlvbihyYWN0aXZlRXZlbnQpIHsgc2hvd0xvY2F0aW9ucyhyYWN0aXZlRXZlbnQuY29udGV4dCk7IHJldHVybiBmYWxzZTsgfSk7IC8vIFRPRE8gY2xlYW4gdXBcbiAgICByZXR1cm4ge1xuICAgICAgICBzZWxlY3RvcjogcGFnZVNlbGVjdG9yLFxuICAgICAgICB0ZWFyZG93bjogZnVuY3Rpb24oKSB7IHJhY3RpdmUudGVhcmRvd24oKTsgfVxuICAgIH07XG5cbiAgICBmdW5jdGlvbiBhcnJheUFjY2Vzc29yKGFycmF5KSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbihpbmRleCkge1xuICAgICAgICAgICAgcmV0dXJuIGFycmF5W2luZGV4XTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gc2l6ZVRvRml0KCRyZWFjdGlvbnNXaW5kb3cpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24obm9kZSkge1xuICAgICAgICB2YXIgJGVsZW1lbnQgPSAkKG5vZGUpLmNsb3Nlc3QoJy5hbnRlbm5hLXJlYWN0aW9uLWJveCcpO1xuICAgICAgICAvLyBXaGlsZSB3ZSdyZSBzaXppbmcgdGhlIHRleHQgdG8gZml4IGluIHRoZSByZWFjdGlvbiBib3gsIHdlIGFsc28gZml4IHVwIHRoZSB3aWR0aCBvZiB0aGUgcmVhY3Rpb24gY291bnQgYW5kXG4gICAgICAgIC8vIHBsdXMgb25lIGJ1dHRvbnMgc28gdGhhdCB0aGV5J3JlIHRoZSBzYW1lLiBUaGVzZSB0d28gdmlzdWFsbHkgc3dhcCB3aXRoIGVhY2ggb3RoZXIgb24gaG92ZXI7IG1ha2luZyB0aGVtXG4gICAgICAgIC8vIHRoZSBzYW1lIHdpZHRoIG1ha2VzIHN1cmUgd2UgZG9uJ3QgZ2V0IGp1bXBpbmVzcyBvbiBob3Zlci5cbiAgICAgICAgLy8gVE9ETzogV2Ugc2hvdWxkIHJldmlzaXQgdGhlIGxheW91dCBvZiB0aGUgYWN0aW9ucyB0byBtYWtlIHRoZW0gZWFzaWVyIHRhcCBvbiBtb2JpbGUuIEF0IHRoYXQgdGltZSwgd2Ugc2hvdWxkXG4gICAgICAgIC8vIGVuZCB1cCB3aXRoIHN0YWJsZSB0b3VjaCB0YXJnZXQgYm94ZXMgYW55d2F5LlxuICAgICAgICB2YXIgJHJlYWN0aW9uQ291bnQgPSAkZWxlbWVudC5maW5kKCcuYW50ZW5uYS1yZWFjdGlvbi1jb3VudCcpO1xuICAgICAgICB2YXIgJHBsdXNPbmUgPSAkZWxlbWVudC5maW5kKCcuYW50ZW5uYS1wbHVzb25lJyk7XG4gICAgICAgIHZhciBtaW5XaWR0aCA9IE1hdGgubWF4KCRyZWFjdGlvbkNvdW50LndpZHRoKCksICRwbHVzT25lLndpZHRoKCkpO1xuICAgICAgICAkcmVhY3Rpb25Db3VudC5jc3MoeydtaW4td2lkdGgnOiBtaW5XaWR0aH0pO1xuICAgICAgICAkcGx1c09uZS5jc3MoeydtaW4td2lkdGgnOiBtaW5XaWR0aH0pO1xuICAgICAgICByZXR1cm4gUmVhY3Rpb25zV2lkZ2V0TGF5b3V0VXRpbHMuc2l6ZVRvRml0KCRyZWFjdGlvbnNXaW5kb3cpKG5vZGUpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gaGlnaGxpZ2h0Q29udGVudChjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgJGNvbnRhaW5lckVsZW1lbnQpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdmFyIHJlYWN0aW9uRGF0YSA9IGV2ZW50LmNvbnRleHQ7XG4gICAgICAgIGlmIChyZWFjdGlvbkRhdGEuY29udGVudCkge1xuICAgICAgICAgICAgdmFyIGxvY2F0aW9uID0gcmVhY3Rpb25EYXRhLmNvbnRlbnQubG9jYXRpb247XG4gICAgICAgICAgICBpZiAobG9jYXRpb24pIHtcbiAgICAgICAgICAgICAgICBSYW5nZS5oaWdobGlnaHQoJGNvbnRhaW5lckVsZW1lbnQuZ2V0KDApLCBsb2NhdGlvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIHBsdXNPbmUoY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIHNob3dDb25maXJtYXRpb24sIGdyb3VwU2V0dGluZ3MpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdmFyIHJlYWN0aW9uRGF0YSA9IGV2ZW50LmNvbnRleHQ7XG4gICAgICAgIHZhciByZWFjdGlvblByb3ZpZGVyID0geyAvLyB0aGlzIHJlYWN0aW9uIHByb3ZpZGVyIGlzIGEgbm8tYnJhaW5lciBiZWNhdXNlIHdlIGFscmVhZHkgaGF2ZSBhIHZhbGlkIHJlYWN0aW9uIChvbmUgd2l0aCBhbiBJRClcbiAgICAgICAgICAgIGdldDogZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhyZWFjdGlvbkRhdGEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBzaG93Q29uZmlybWF0aW9uKHJlYWN0aW9uRGF0YSwgcmVhY3Rpb25Qcm92aWRlcik7XG4gICAgICAgIEFqYXhDbGllbnQucG9zdFBsdXNPbmUocmVhY3Rpb25EYXRhLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgZnVuY3Rpb24ocmVhY3Rpb25EYXRhKXtcbiAgICAgICAgICAgIEV2ZW50cy5wb3N0UmVhY3Rpb25DcmVhdGVkKHBhZ2VEYXRhLCBjb250YWluZXJEYXRhLCByZWFjdGlvbkRhdGEsIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICB9LCBlcnJvcik7XG5cbiAgICAgICAgZnVuY3Rpb24gZXJyb3IobWVzc2FnZSkge1xuICAgICAgICAgICAgLy8gVE9ETyBoYW5kbGUgYW55IGVycm9ycyB0aGF0IG9jY3VyIHBvc3RpbmcgYSByZWFjdGlvblxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJlcnJvciBwb3N0aW5nIHBsdXMgb25lOiBcIiArIG1lc3NhZ2UpO1xuICAgICAgICB9XG4gICAgfTtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZTogY3JlYXRlUGFnZVxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi91dGlscy9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciBBamF4Q2xpZW50ID0gcmVxdWlyZSgnLi91dGlscy9hamF4LWNsaWVudCcpO1xudmFyIE1lc3NhZ2VzID0gcmVxdWlyZSgnLi91dGlscy9tZXNzYWdlcycpO1xudmFyIE1vdmVhYmxlID0gcmVxdWlyZSgnLi91dGlscy9tb3ZlYWJsZScpO1xudmFyIFJhY3RpdmU7IHJlcXVpcmUoJy4vdXRpbHMvcmFjdGl2ZS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihsb2FkZWRSYWN0aXZlKSB7IFJhY3RpdmUgPSBsb2FkZWRSYWN0aXZlO30pO1xudmFyIFJhbmdlID0gcmVxdWlyZSgnLi91dGlscy9yYW5nZScpO1xudmFyIFRvdWNoU3VwcG9ydCA9IHJlcXVpcmUoJy4vdXRpbHMvdG91Y2gtc3VwcG9ydCcpO1xudmFyIFRyYW5zaXRpb25VdGlsID0gcmVxdWlyZSgnLi91dGlscy90cmFuc2l0aW9uLXV0aWwnKTtcbnZhciBXaWRnZXRCdWNrZXQgPSByZXF1aXJlKCcuL3V0aWxzL3dpZGdldC1idWNrZXQnKTtcblxudmFyIEJsb2NrZWRSZWFjdGlvblBhZ2UgPSByZXF1aXJlKCcuL2Jsb2NrZWQtcmVhY3Rpb24tcGFnZScpO1xudmFyIENvbW1lbnRzUGFnZSA9IHJlcXVpcmUoJy4vY29tbWVudHMtcGFnZScpO1xudmFyIENvbmZpcm1hdGlvblBhZ2UgPSByZXF1aXJlKCcuL2NvbmZpcm1hdGlvbi1wYWdlJyk7XG52YXIgRGVmYXVsdHNQYWdlID0gcmVxdWlyZSgnLi9kZWZhdWx0cy1wYWdlJyk7XG52YXIgRXZlbnRzID0gcmVxdWlyZSgnLi9ldmVudHMnKTtcbnZhciBMb2NhdGlvbnNQYWdlID0gcmVxdWlyZSgnLi9sb2NhdGlvbnMtcGFnZScpO1xudmFyIExvZ2luUGFnZSA9IHJlcXVpcmUoJy4vbG9naW4tcGFnZScpO1xudmFyIFBhZ2VEYXRhID0gcmVxdWlyZSgnLi9wYWdlLWRhdGEnKTtcbnZhciBSZWFjdGlvbnNQYWdlID0gcmVxdWlyZSgnLi9yZWFjdGlvbnMtcGFnZScpO1xudmFyIFNWR3MgPSByZXF1aXJlKCcuL3N2Z3MnKTtcblxudmFyIFBBR0VfUkVBQ1RJT05TID0gJ3JlYWN0aW9ucyc7XG52YXIgUEFHRV9ERUZBVUxUUyA9ICdkZWZhdWx0cyc7XG52YXIgUEFHRV9BVVRPID0gJ2F1dG8nO1xuXG52YXIgU0VMRUNUT1JfUkVBQ1RJT05TX1dJREdFVCA9ICcuYW50ZW5uYS1yZWFjdGlvbnMtd2lkZ2V0JztcblxudmFyIG9wZW5JbnN0YW5jZXMgPSBbXTtcblxuZnVuY3Rpb24gb3BlblJlYWN0aW9uc1dpZGdldChvcHRpb25zLCBlbGVtZW50T3JDb29yZHMpIHtcbiAgICBjbG9zZUFsbFdpbmRvd3MoKTtcbiAgICB2YXIgZGVmYXVsdFJlYWN0aW9ucyA9IG9wdGlvbnMuZGVmYXVsdFJlYWN0aW9ucztcbiAgICB2YXIgcmVhY3Rpb25zRGF0YSA9IG9wdGlvbnMucmVhY3Rpb25zRGF0YTtcbiAgICB2YXIgY29udGFpbmVyRGF0YSA9IG9wdGlvbnMuY29udGFpbmVyRGF0YTtcbiAgICB2YXIgY29udGFpbmVyRWxlbWVudCA9IG9wdGlvbnMuY29udGFpbmVyRWxlbWVudDsgLy8gb3B0aW9uYWxcbiAgICB2YXIgc3RhcnRQYWdlID0gb3B0aW9ucy5zdGFydFBhZ2UgfHwgUEFHRV9BVVRPOyAvLyBvcHRpb25hbFxuICAgIHZhciBpc1N1bW1hcnkgPSBvcHRpb25zLmlzU3VtbWFyeSA9PT0gdW5kZWZpbmVkID8gZmFsc2UgOiBvcHRpb25zLmlzU3VtbWFyeTsgLy8gb3B0aW9uYWxcbiAgICAvLyBjb250ZW50RGF0YSBjb250YWlucyBkZXRhaWxzIGFib3V0IHRoZSBjb250ZW50IGJlaW5nIHJlYWN0ZWQgdG8gbGlrZSB0ZXh0IHJhbmdlIG9yIGltYWdlIGhlaWdodC93aWR0aC5cbiAgICAvLyB3ZSBwb3RlbnRpYWxseSBtb2RpZnkgdGhpcyBkYXRhIChlLmcuIGluIHRoZSBkZWZhdWx0IHJlYWN0aW9uIGNhc2Ugd2Ugc2VsZWN0IHRoZSB0ZXh0IG91cnNlbHZlcykgc28gd2VcbiAgICAvLyBtYWtlIGEgbG9jYWwgY29weSBvZiBpdCB0byBhdm9pZCB1bmV4cGVjdGVkbHkgY2hhbmdpbmcgZGF0YSBvdXQgZnJvbSB1bmRlciBvbmUgb2YgdGhlIGNsaWVudHNcbiAgICB2YXIgY29udGVudERhdGEgPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KG9wdGlvbnMuY29udGVudERhdGEpKTtcbiAgICB2YXIgcGFnZURhdGEgPSBvcHRpb25zLnBhZ2VEYXRhO1xuICAgIHZhciBncm91cFNldHRpbmdzID0gb3B0aW9ucy5ncm91cFNldHRpbmdzO1xuICAgIHZhciByYWN0aXZlID0gUmFjdGl2ZSh7XG4gICAgICAgIGVsOiBXaWRnZXRCdWNrZXQuZ2V0KCksXG4gICAgICAgIGFwcGVuZDogdHJ1ZSxcbiAgICAgICAgZGF0YToge30sXG4gICAgICAgIHRlbXBsYXRlOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvcmVhY3Rpb25zLXdpZGdldC5oYnMuaHRtbCcpLFxuICAgICAgICBwYXJ0aWFsczoge1xuICAgICAgICAgICAgbG9nbzogU1ZHcy5sb2dvXG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIHJhY3RpdmUub24oJ2Nsb3NlJywgY2xvc2VBbGxXaW5kb3dzKTtcbiAgICB2YXIgJHJvb3RFbGVtZW50ID0gJChyb290RWxlbWVudChyYWN0aXZlKSk7XG4gICAgTW92ZWFibGUubWFrZU1vdmVhYmxlKCRyb290RWxlbWVudCwgJHJvb3RFbGVtZW50LmZpbmQoJy5hbnRlbm5hLWhlYWRlcicpKTtcbiAgICB2YXIgcGFnZXMgPSBbXTtcblxuICAgIG9wZW5XaW5kb3coKTtcblxuICAgIGZ1bmN0aW9uIG9wZW5XaW5kb3coKSB7XG4gICAgICAgIFBhZ2VEYXRhLmNsZWFySW5kaWNhdG9yTGltaXQocGFnZURhdGEpO1xuICAgICAgICB2YXIgY29vcmRzO1xuICAgICAgICBpZiAoZWxlbWVudE9yQ29vcmRzLnRvcCAmJiBlbGVtZW50T3JDb29yZHMubGVmdCkge1xuICAgICAgICAgICAgY29vcmRzID0gZWxlbWVudE9yQ29vcmRzO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyICRyZWxhdGl2ZUVsZW1lbnQgPSAkKGVsZW1lbnRPckNvb3Jkcyk7XG4gICAgICAgICAgICB2YXIgb2Zmc2V0ID0gJHJlbGF0aXZlRWxlbWVudC5vZmZzZXQoKTtcbiAgICAgICAgICAgIGNvb3JkcyA9IHtcbiAgICAgICAgICAgICAgICB0b3A6IG9mZnNldC50b3AsXG4gICAgICAgICAgICAgICAgbGVmdDogb2Zmc2V0LmxlZnRcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGhvcml6b250YWxPdmVyZmxvdyA9IGNvb3Jkcy5sZWZ0ICsgJHJvb3RFbGVtZW50LndpZHRoKCkgLSBNYXRoLm1heChkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50V2lkdGgsIHdpbmRvdy5pbm5lcldpZHRoIHx8IDApOyAvLyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzEyNDgwODEvZ2V0LXRoZS1icm93c2VyLXZpZXdwb3J0LWRpbWVuc2lvbnMtd2l0aC1qYXZhc2NyaXB0Lzg4NzYwNjkjODg3NjA2OVxuICAgICAgICBpZiAoaG9yaXpvbnRhbE92ZXJmbG93ID4gMCkge1xuICAgICAgICAgICAgY29vcmRzLmxlZnQgPSBjb29yZHMubGVmdCAtIGhvcml6b250YWxPdmVyZmxvdztcbiAgICAgICAgfVxuICAgICAgICAkcm9vdEVsZW1lbnQuc3RvcCh0cnVlLCB0cnVlKS5hZGRDbGFzcygnYW50ZW5uYS1yZWFjdGlvbnMtb3BlbicpLmNzcyhjb29yZHMpO1xuXG4gICAgICAgIHZhciBpc1Nob3dSZWFjdGlvbnMgPSBzdGFydFBhZ2UgPT09IFBBR0VfUkVBQ1RJT05TIHx8IChzdGFydFBhZ2UgPT09IFBBR0VfQVVUTyAmJiByZWFjdGlvbnNEYXRhLmxlbmd0aCA+IDApO1xuICAgICAgICBpZiAoaXNTaG93UmVhY3Rpb25zKSB7XG4gICAgICAgICAgICBzaG93UmVhY3Rpb25zKGZhbHNlKTtcbiAgICAgICAgfSBlbHNlIHsgLy8gc3RhcnRQYWdlID09PSBwYWdlRGVmYXVsdHMgfHwgdGhlcmUgYXJlIG5vIHJlYWN0aW9uc1xuICAgICAgICAgICAgc2hvd0RlZmF1bHRSZWFjdGlvbnNQYWdlKGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaXNTdW1tYXJ5KSB7XG4gICAgICAgICAgICBFdmVudHMucG9zdFN1bW1hcnlPcGVuZWQoaXNTaG93UmVhY3Rpb25zLCBwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBFdmVudHMucG9zdFJlYWN0aW9uV2lkZ2V0T3BlbmVkKGlzU2hvd1JlYWN0aW9ucywgcGFnZURhdGEsIGNvbnRhaW5lckRhdGEsIGNvbnRlbnREYXRhLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHNldHVwV2luZG93Q2xvc2UocGFnZXMsIHJhY3RpdmUpO1xuICAgICAgICBwcmV2ZW50RXh0cmFTY3JvbGwoJHJvb3RFbGVtZW50KTtcbiAgICAgICAgb3Blbkluc3RhbmNlcy5wdXNoKHJhY3RpdmUpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNob3dSZWFjdGlvbnMoYW5pbWF0ZSwgcmV2ZXJzZSkge1xuICAgICAgICB2YXIgb3B0aW9ucyA9IHtcbiAgICAgICAgICAgIGlzU3VtbWFyeTogaXNTdW1tYXJ5LFxuICAgICAgICAgICAgcmVhY3Rpb25zRGF0YTogcmVhY3Rpb25zRGF0YSxcbiAgICAgICAgICAgIHBhZ2VEYXRhOiBwYWdlRGF0YSxcbiAgICAgICAgICAgIGdyb3VwU2V0dGluZ3M6IGdyb3VwU2V0dGluZ3MsXG4gICAgICAgICAgICBjb250YWluZXJEYXRhOiBjb250YWluZXJEYXRhLFxuICAgICAgICAgICAgY29udGFpbmVyRWxlbWVudDogY29udGFpbmVyRWxlbWVudCxcbiAgICAgICAgICAgIGNvbnRlbnREYXRhOiBjb250ZW50RGF0YSxcbiAgICAgICAgICAgIHNob3dDb25maXJtYXRpb246IHNob3dDb25maXJtYXRpb24sXG4gICAgICAgICAgICBzaG93RGVmYXVsdHM6IGZ1bmN0aW9uKCkgeyBzaG93RGVmYXVsdFJlYWN0aW9uc1BhZ2UodHJ1ZSkgfSxcbiAgICAgICAgICAgIHNob3dDb21tZW50czogc2hvd0NvbW1lbnRzLFxuICAgICAgICAgICAgc2hvd0xvY2F0aW9uczogc2hvd0xvY2F0aW9ucyxcbiAgICAgICAgICAgIGVsZW1lbnQ6IHBhZ2VDb250YWluZXIocmFjdGl2ZSksXG4gICAgICAgICAgICByZWFjdGlvbnNXaW5kb3c6ICRyb290RWxlbWVudFxuICAgICAgICB9O1xuICAgICAgICB2YXIgcGFnZSA9IFJlYWN0aW9uc1BhZ2UuY3JlYXRlKG9wdGlvbnMpO1xuICAgICAgICBwYWdlcy5wdXNoKHBhZ2UpO1xuICAgICAgICBpZiAocmV2ZXJzZSkge1xuICAgICAgICAgICAgZ29CYWNrVG9QYWdlKHBhZ2VzLCBwYWdlLnNlbGVjdG9yLCAkcm9vdEVsZW1lbnQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2hvd1BhZ2UocGFnZS5zZWxlY3RvciwgJHJvb3RFbGVtZW50LCBhbmltYXRlLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBiYWNrVG9SZWFjdGlvbnMoKSB7XG4gICAgICAgIHNldFdpbmRvd1RpdGxlKE1lc3NhZ2VzLmdldE1lc3NhZ2UoJ3JlYWN0aW9ucy13aWRnZXRfdGl0bGUnKSk7XG4gICAgICAgIHNob3dSZWFjdGlvbnModHJ1ZSwgdHJ1ZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2hvd0RlZmF1bHRSZWFjdGlvbnNQYWdlKGFuaW1hdGUpIHtcbiAgICAgICAgaWYgKGNvbnRhaW5lckVsZW1lbnQgJiYgIWNvbnRlbnREYXRhLmxvY2F0aW9uICYmICFjb250ZW50RGF0YS5ib2R5KSB7XG4gICAgICAgICAgICBSYW5nZS5ncmFiTm9kZShjb250YWluZXJFbGVtZW50LmdldCgwKSwgZnVuY3Rpb24gKHRleHQsIGxvY2F0aW9uKSB7XG4gICAgICAgICAgICAgICAgY29udGVudERhdGEubG9jYXRpb24gPSBsb2NhdGlvbjtcbiAgICAgICAgICAgICAgICBjb250ZW50RGF0YS5ib2R5ID0gdGV4dDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHZhciBvcHRpb25zID0geyAvLyBUT0RPOiBjbGVhbiB1cCB0aGUgbnVtYmVyIG9mIHRoZXNlIFwib3B0aW9uc1wiIG9iamVjdHMgdGhhdCB3ZSBjcmVhdGUuXG4gICAgICAgICAgICBkZWZhdWx0UmVhY3Rpb25zOiBkZWZhdWx0UmVhY3Rpb25zLFxuICAgICAgICAgICAgcGFnZURhdGE6IHBhZ2VEYXRhLFxuICAgICAgICAgICAgZ3JvdXBTZXR0aW5nczogZ3JvdXBTZXR0aW5ncyxcbiAgICAgICAgICAgIGNvbnRhaW5lckRhdGE6IGNvbnRhaW5lckRhdGEsXG4gICAgICAgICAgICBjb250ZW50RGF0YTogY29udGVudERhdGEsXG4gICAgICAgICAgICBzaG93Q29uZmlybWF0aW9uOiBzaG93Q29uZmlybWF0aW9uLFxuICAgICAgICAgICAgc2hvd1Byb2dyZXNzOiBzaG93UHJvZ3Jlc3NQYWdlLFxuICAgICAgICAgICAgc2hvd0xvZ2luOiBmdW5jdGlvbihyZXRyeUNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgLy8gQmV3YXJlOiB0aGlzIGZ1bmN0aW9uIHJlZmVyZW5jZXMgdGhlICdwYWdlJyB2YXJpYWJsZSB3aGljaCBpc24ndCBzZXQgdW50aWwgYWZ0ZXIgRGVmYXVsdHNQYWdlLmNyZWF0ZSgpIHJldHVybnMuXG4gICAgICAgICAgICAgICAgc2hvd0xvZ2luUGFnZShwYWdlLnNlbGVjdG9yLCByZXRyeUNhbGxiYWNrKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzaG93QmxvY2tlZDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgLy8gQmV3YXJlOiB0aGlzIGZ1bmN0aW9uIHJlZmVyZW5jZXMgdGhlICdwYWdlJyB2YXJpYWJsZSB3aGljaCBpc24ndCBzZXQgdW50aWwgYWZ0ZXIgRGVmYXVsdHNQYWdlLmNyZWF0ZSgpIHJldHVybnMuXG4gICAgICAgICAgICAgICAgc2hvd0Jsb2NrZWRSZWFjdGlvblBhZ2UocGFnZS5zZWxlY3Rvcik7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZWxlbWVudDogcGFnZUNvbnRhaW5lcihyYWN0aXZlKSxcbiAgICAgICAgICAgIHJlYWN0aW9uc1dpbmRvdzogJHJvb3RFbGVtZW50XG4gICAgICAgIH07XG4gICAgICAgIHZhciBwYWdlID0gRGVmYXVsdHNQYWdlLmNyZWF0ZShvcHRpb25zKTtcbiAgICAgICAgcGFnZXMucHVzaChwYWdlKTtcbiAgICAgICAgc2hvd1BhZ2UocGFnZS5zZWxlY3RvciwgJHJvb3RFbGVtZW50LCBhbmltYXRlKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzaG93Q29uZmlybWF0aW9uKHJlYWN0aW9uRGF0YSwgcmVhY3Rpb25Qcm92aWRlcikge1xuICAgICAgICBzZXRXaW5kb3dUaXRsZShNZXNzYWdlcy5nZXRNZXNzYWdlKCdyZWFjdGlvbnMtd2lkZ2V0X3RpdGxlX3RoYW5rcycpKTtcbiAgICAgICAgdmFyIHBhZ2UgPSBDb25maXJtYXRpb25QYWdlLmNyZWF0ZShyZWFjdGlvbkRhdGEudGV4dCwgcmVhY3Rpb25Qcm92aWRlciwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGdyb3VwU2V0dGluZ3MsIHBhZ2VDb250YWluZXIocmFjdGl2ZSkpO1xuICAgICAgICBwYWdlcy5wdXNoKHBhZ2UpO1xuXG4gICAgICAgIC8vIFRPRE86IHJldmlzaXQgd2h5IHdlIG5lZWQgdG8gdXNlIHRoZSB0aW1lb3V0IHRyaWNrIGZvciB0aGUgY29uZmlybSBwYWdlLCBidXQgbm90IGZvciB0aGUgZGVmYXVsdHMgcGFnZVxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyAvLyBJbiBvcmRlciBmb3IgdGhlIHBvc2l0aW9uaW5nIGFuaW1hdGlvbiB0byB3b3JrLCB3ZSBuZWVkIHRvIGxldCB0aGUgYnJvd3NlciByZW5kZXIgdGhlIGFwcGVuZGVkIERPTSBlbGVtZW50XG4gICAgICAgICAgICBzaG93UGFnZShwYWdlLnNlbGVjdG9yLCAkcm9vdEVsZW1lbnQsIHRydWUpO1xuICAgICAgICB9LCAxKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzaG93UHJvZ3Jlc3NQYWdlKCkge1xuICAgICAgICBzaG93UGFnZSgnLmFudGVubmEtcHJvZ3Jlc3MtcGFnZScsICRyb290RWxlbWVudCwgZmFsc2UsIHRydWUpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNob3dDb21tZW50cyhyZWFjdGlvbikge1xuICAgICAgICBzaG93UHJvZ3Jlc3NQYWdlKCk7IC8vIFRPRE86IHByb3ZpZGUgc29tZSB3YXkgZm9yIHRoZSB1c2VyIHRvIGdpdmUgdXAgLyBjYW5jZWwuIEFsc28sIGhhbmRsZSBlcnJvcnMgZmV0Y2hpbmcgY29tbWVudHMuXG4gICAgICAgIEFqYXhDbGllbnQuZ2V0Q29tbWVudHMocmVhY3Rpb24sIGZ1bmN0aW9uKGNvbW1lbnRzKSB7XG4gICAgICAgICAgICB2YXIgb3B0aW9ucyA9IHtcbiAgICAgICAgICAgICAgICByZWFjdGlvbjogcmVhY3Rpb24sXG4gICAgICAgICAgICAgICAgY29tbWVudHM6IGNvbW1lbnRzLFxuICAgICAgICAgICAgICAgIGVsZW1lbnQ6IHBhZ2VDb250YWluZXIocmFjdGl2ZSksXG4gICAgICAgICAgICAgICAgZ29CYWNrOiBiYWNrVG9SZWFjdGlvbnMsXG4gICAgICAgICAgICAgICAgY29udGFpbmVyRGF0YTogY29udGFpbmVyRGF0YSxcbiAgICAgICAgICAgICAgICBwYWdlRGF0YTogcGFnZURhdGEsXG4gICAgICAgICAgICAgICAgZ3JvdXBTZXR0aW5nczogZ3JvdXBTZXR0aW5nc1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHZhciBwYWdlID0gQ29tbWVudHNQYWdlLmNyZWF0ZShvcHRpb25zKTtcbiAgICAgICAgICAgIHBhZ2VzLnB1c2gocGFnZSk7XG5cbiAgICAgICAgICAgIC8vIFRPRE86IHJldmlzaXRcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IC8vIEluIG9yZGVyIGZvciB0aGUgcG9zaXRpb25pbmcgYW5pbWF0aW9uIHRvIHdvcmssIHdlIG5lZWQgdG8gbGV0IHRoZSBicm93c2VyIHJlbmRlciB0aGUgYXBwZW5kZWQgRE9NIGVsZW1lbnRcbiAgICAgICAgICAgICAgICBzaG93UGFnZShwYWdlLnNlbGVjdG9yLCAkcm9vdEVsZW1lbnQsIHRydWUpO1xuICAgICAgICAgICAgfSwgMSk7XG5cbiAgICAgICAgICAgIEV2ZW50cy5wb3N0Q29tbWVudHNWaWV3ZWQocGFnZURhdGEsIGNvbnRhaW5lckRhdGEsIHJlYWN0aW9uLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2hvd0xvY2F0aW9ucyhyZWFjdGlvbikge1xuICAgICAgICBzaG93UHJvZ3Jlc3NQYWdlKCk7IC8vIFRPRE86IHByb3ZpZGUgc29tZSB3YXkgZm9yIHRoZSB1c2VyIHRvIGdpdmUgdXAgLyBjYW5jZWwuIEFsc28sIGhhbmRsZSBlcnJvcnMgZmV0Y2hpbmcgY29tbWVudHMuXG4gICAgICAgIHZhciByZWFjdGlvbkxvY2F0aW9uRGF0YSA9IFBhZ2VEYXRhLmdldFJlYWN0aW9uTG9jYXRpb25EYXRhKHJlYWN0aW9uLCBwYWdlRGF0YSk7XG4gICAgICAgIEFqYXhDbGllbnQuZmV0Y2hMb2NhdGlvbkRldGFpbHMocmVhY3Rpb25Mb2NhdGlvbkRhdGEsIHBhZ2VEYXRhLCBmdW5jdGlvbihsb2NhdGlvbkRldGFpbHMpIHtcbiAgICAgICAgICAgIFBhZ2VEYXRhLnVwZGF0ZVJlYWN0aW9uTG9jYXRpb25EYXRhKHJlYWN0aW9uTG9jYXRpb25EYXRhLCBsb2NhdGlvbkRldGFpbHMpO1xuICAgICAgICAgICAgdmFyIG9wdGlvbnMgPSB7IC8vIFRPRE86IGNsZWFuIHVwIHRoZSBudW1iZXIgb2YgdGhlc2UgXCJvcHRpb25zXCIgb2JqZWN0cyB0aGF0IHdlIGNyZWF0ZS5cbiAgICAgICAgICAgICAgICBlbGVtZW50OiBwYWdlQ29udGFpbmVyKHJhY3RpdmUpLFxuICAgICAgICAgICAgICAgIHJlYWN0aW9uTG9jYXRpb25EYXRhOiByZWFjdGlvbkxvY2F0aW9uRGF0YSxcbiAgICAgICAgICAgICAgICBwYWdlRGF0YTogcGFnZURhdGEsXG4gICAgICAgICAgICAgICAgZ3JvdXBTZXR0aW5nczogZ3JvdXBTZXR0aW5ncyxcbiAgICAgICAgICAgICAgICBjbG9zZVdpbmRvdzogY2xvc2VBbGxXaW5kb3dzLFxuICAgICAgICAgICAgICAgIGdvQmFjazogYmFja1RvUmVhY3Rpb25zXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdmFyIHBhZ2UgPSBMb2NhdGlvbnNQYWdlLmNyZWF0ZShvcHRpb25zKTtcbiAgICAgICAgICAgIHBhZ2VzLnB1c2gocGFnZSk7XG4gICAgICAgICAgICBzZXRXaW5kb3dUaXRsZShyZWFjdGlvbi50ZXh0KTtcbiAgICAgICAgICAgIC8vIFRPRE86IHJldmlzaXRcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IC8vIEluIG9yZGVyIGZvciB0aGUgcG9zaXRpb25pbmcgYW5pbWF0aW9uIHRvIHdvcmssIHdlIG5lZWQgdG8gbGV0IHRoZSBicm93c2VyIHJlbmRlciB0aGUgYXBwZW5kZWQgRE9NIGVsZW1lbnRcbiAgICAgICAgICAgICAgICBzaG93UGFnZShwYWdlLnNlbGVjdG9yLCAkcm9vdEVsZW1lbnQsIHRydWUpO1xuICAgICAgICAgICAgfSwgMSk7XG4gICAgICAgICAgICBFdmVudHMucG9zdExvY2F0aW9uc1ZpZXdlZChwYWdlRGF0YSwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIFNob3dzIHRoZSBsb2dpbiBwYWdlLCB3aXRoIGEgcHJvbXB0IHRvIGdvIEJhY2sgdG8gdGhlIHBhZ2Ugc3BlY2lmaWVkIGJ5IHRoZSBnaXZlbiBwYWdlIHNlbGVjdG9yLlxuICAgIGZ1bmN0aW9uIHNob3dMb2dpblBhZ2UoYmFja1BhZ2VTZWxlY3RvciwgcmV0cnlDYWxsYmFjaykge1xuICAgICAgICBzZXRXaW5kb3dUaXRsZShNZXNzYWdlcy5nZXRNZXNzYWdlKCdyZWFjdGlvbnMtd2lkZ2V0X3RpdGxlX3NpZ25pbicpKTtcbiAgICAgICAgdmFyIG9wdGlvbnMgPSB7XG4gICAgICAgICAgICBlbGVtZW50OiBwYWdlQ29udGFpbmVyKHJhY3RpdmUpLFxuICAgICAgICAgICAgZ3JvdXBTZXR0aW5nczogZ3JvdXBTZXR0aW5ncyxcbiAgICAgICAgICAgIGdvQmFjazogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgc2V0V2luZG93VGl0bGUoTWVzc2FnZXMuZ2V0TWVzc2FnZSgncmVhY3Rpb25zLXdpZGdldF90aXRsZScpKTtcbiAgICAgICAgICAgICAgICBnb0JhY2tUb1BhZ2UocGFnZXMsIGJhY2tQYWdlU2VsZWN0b3IsICRyb290RWxlbWVudCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmV0cnk6IHJldHJ5Q2FsbGJhY2tcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIHBhZ2UgPSBMb2dpblBhZ2UuY3JlYXRlUGFnZShvcHRpb25zKTtcbiAgICAgICAgcGFnZXMucHVzaChwYWdlKTtcblxuICAgICAgICAvLyBUT0RPOiByZXZpc2l0IHdoeSB3ZSBuZWVkIHRvIHVzZSB0aGUgdGltZW91dCB0cmljayBmb3IgdGhlIGNvbmZpcm0gcGFnZSwgYnV0IG5vdCBmb3IgdGhlIGRlZmF1bHRzIHBhZ2VcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHsgLy8gSW4gb3JkZXIgZm9yIHRoZSBwb3NpdGlvbmluZyBhbmltYXRpb24gdG8gd29yaywgd2UgbmVlZCB0byBsZXQgdGhlIGJyb3dzZXIgcmVuZGVyIHRoZSBhcHBlbmRlZCBET00gZWxlbWVudFxuICAgICAgICAgICAgc2hvd1BhZ2UocGFnZS5zZWxlY3RvciwgJHJvb3RFbGVtZW50LCB0cnVlKTtcbiAgICAgICAgfSwgMSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2hvd0Jsb2NrZWRSZWFjdGlvblBhZ2UoYmFja1BhZ2VTZWxlY3Rvcikge1xuICAgICAgICBzZXRXaW5kb3dUaXRsZShNZXNzYWdlcy5nZXRNZXNzYWdlKCdyZWFjdGlvbnMtd2lkZ2V0X3RpdGxlX2Jsb2NrZWQnKSk7XG4gICAgICAgIHZhciBvcHRpb25zID0ge1xuICAgICAgICAgICAgZWxlbWVudDogcGFnZUNvbnRhaW5lcihyYWN0aXZlKSxcbiAgICAgICAgICAgIGdyb3VwU2V0dGluZ3M6IGdyb3VwU2V0dGluZ3MsXG4gICAgICAgICAgICBnb0JhY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHNldFdpbmRvd1RpdGxlKE1lc3NhZ2VzLmdldE1lc3NhZ2UoJ3JlYWN0aW9ucy13aWRnZXRfdGl0bGUnKSk7XG4gICAgICAgICAgICAgICAgZ29CYWNrVG9QYWdlKHBhZ2VzLCBiYWNrUGFnZVNlbGVjdG9yLCAkcm9vdEVsZW1lbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICB2YXIgcGFnZSA9IEJsb2NrZWRSZWFjdGlvblBhZ2UuY3JlYXRlUGFnZShvcHRpb25zKTtcbiAgICAgICAgcGFnZXMucHVzaChwYWdlKTtcblxuICAgICAgICAvLyBUT0RPOiByZXZpc2l0IHdoeSB3ZSBuZWVkIHRvIHVzZSB0aGUgdGltZW91dCB0cmljayBmb3IgdGhlIGNvbmZpcm0gcGFnZSwgYnV0IG5vdCBmb3IgdGhlIGRlZmF1bHRzIHBhZ2VcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHsgLy8gSW4gb3JkZXIgZm9yIHRoZSBwb3NpdGlvbmluZyBhbmltYXRpb24gdG8gd29yaywgd2UgbmVlZCB0byBsZXQgdGhlIGJyb3dzZXIgcmVuZGVyIHRoZSBhcHBlbmRlZCBET00gZWxlbWVudFxuICAgICAgICAgICAgc2hvd1BhZ2UocGFnZS5zZWxlY3RvciwgJHJvb3RFbGVtZW50LCB0cnVlKTtcbiAgICAgICAgfSwgMSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2V0V2luZG93VGl0bGUodGl0bGUpIHtcbiAgICAgICAgJChyYWN0aXZlLmZpbmQoJy5hbnRlbm5hLXJlYWN0aW9ucy10aXRsZScpKS5odG1sKHRpdGxlKTtcbiAgICB9XG5cbn1cblxuZnVuY3Rpb24gcm9vdEVsZW1lbnQocmFjdGl2ZSkge1xuICAgIHJldHVybiByYWN0aXZlLmZpbmQoU0VMRUNUT1JfUkVBQ1RJT05TX1dJREdFVCk7XG59XG5cbmZ1bmN0aW9uIHBhZ2VDb250YWluZXIocmFjdGl2ZSkge1xuICAgIHJldHVybiByYWN0aXZlLmZpbmQoJy5hbnRlbm5hLXBhZ2UtY29udGFpbmVyJyk7XG59XG5cbnZhciBwYWdlWiA9IDEwMDA7IC8vIEl0J3Mgc2FmZSBmb3IgdGhpcyB2YWx1ZSB0byBnbyBhY3Jvc3MgaW5zdGFuY2VzLiBXZSBqdXN0IG5lZWQgaXQgdG8gY29udGludW91c2x5IGluY3JlYXNlIChtYXggdmFsdWUgaXMgb3ZlciAyIGJpbGxpb24pLlxuXG5mdW5jdGlvbiBzaG93UGFnZShwYWdlU2VsZWN0b3IsICRyb290RWxlbWVudCwgYW5pbWF0ZSwgb3ZlcmxheSkge1xuICAgIHZhciAkcGFnZSA9ICRyb290RWxlbWVudC5maW5kKHBhZ2VTZWxlY3Rvcik7XG4gICAgJHBhZ2UuY3NzKCd6LWluZGV4JywgcGFnZVopO1xuICAgIHBhZ2VaICs9IDE7XG5cbiAgICAkcGFnZS50b2dnbGVDbGFzcygnYW50ZW5uYS1wYWdlLWFuaW1hdGUnLCBhbmltYXRlKTtcblxuICAgIGlmIChvdmVybGF5KSB7XG4gICAgICAgIC8vIEluIHRoZSBvdmVybGF5IGNhc2UsIHNpemUgdGhlIHBhZ2UgdG8gbWF0Y2ggd2hhdGV2ZXIgcGFnZSBpcyBjdXJyZW50bHkgc2hvd2luZyBhbmQgdGhlbiBtYWtlIGl0IGFjdGl2ZSAodGhlcmUgd2lsbCBiZSB0d28gJ2FjdGl2ZScgcGFnZXMpXG4gICAgICAgIHZhciAkY3VycmVudCA9ICRyb290RWxlbWVudC5maW5kKCcuYW50ZW5uYS1wYWdlLWFjdGl2ZScpO1xuICAgICAgICAkcGFnZS5oZWlnaHQoJGN1cnJlbnQuaGVpZ2h0KCkpO1xuICAgICAgICAkcGFnZS5hZGRDbGFzcygnYW50ZW5uYS1wYWdlLWFjdGl2ZScpO1xuICAgIH0gZWxzZSBpZiAoYW5pbWF0ZSkge1xuICAgICAgICBUcmFuc2l0aW9uVXRpbC50b2dnbGVDbGFzcygkcGFnZSwgJ2FudGVubmEtcGFnZS1hY3RpdmUnLCB0cnVlLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIEFmdGVyIHRoZSBuZXcgcGFnZSBzbGlkZXMgaW50byBwb3NpdGlvbiwgbW92ZSB0aGUgb3RoZXIgcGFnZXMgYmFjayBvdXQgb2YgdGhlIHZpZXdhYmxlIGFyZWFcbiAgICAgICAgICAgICRyb290RWxlbWVudC5maW5kKCcuYW50ZW5uYS1wYWdlJykubm90KHBhZ2VTZWxlY3RvcikucmVtb3ZlQ2xhc3MoJ2FudGVubmEtcGFnZS1hY3RpdmUnKTtcbiAgICAgICAgICAgICRwYWdlLmZvY3VzKCk7XG4gICAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICAgICRwYWdlLmFkZENsYXNzKCdhbnRlbm5hLXBhZ2UtYWN0aXZlJyk7XG4gICAgICAgICRyb290RWxlbWVudC5maW5kKCcuYW50ZW5uYS1wYWdlJykubm90KHBhZ2VTZWxlY3RvcikucmVtb3ZlQ2xhc3MoJ2FudGVubmEtcGFnZS1hY3RpdmUnKTtcbiAgICAgICAgJHBhZ2UuZm9jdXMoKTtcbiAgICB9XG4gICAgc2l6ZUJvZHlUb0ZpdCgkcm9vdEVsZW1lbnQsICRwYWdlLCBhbmltYXRlKTtcbn1cblxuZnVuY3Rpb24gZ29CYWNrVG9QYWdlKHBhZ2VzLCBwYWdlU2VsZWN0b3IsICRyb290RWxlbWVudCkge1xuICAgIHZhciAkdGFyZ2V0UGFnZSA9ICRyb290RWxlbWVudC5maW5kKHBhZ2VTZWxlY3Rvcik7XG4gICAgdmFyICRjdXJyZW50UGFnZSA9ICRyb290RWxlbWVudC5maW5kKCcuYW50ZW5uYS1wYWdlLWFjdGl2ZScpO1xuICAgIC8vIE1vdmUgdGhlIHRhcmdldCBwYWdlIGludG8gcGxhY2UsIHVuZGVyIHRoZSBjdXJyZW50IHBhZ2VcbiAgICAkdGFyZ2V0UGFnZS5jc3MoJ3otaW5kZXgnLCBwYXJzZUludCgkY3VycmVudFBhZ2UuY3NzKCd6LWluZGV4JykpIC0gMSk7XG4gICAgJHRhcmdldFBhZ2UudG9nZ2xlQ2xhc3MoJ2FudGVubmEtcGFnZS1hbmltYXRlJywgZmFsc2UpO1xuICAgICR0YXJnZXRQYWdlLnRvZ2dsZUNsYXNzKCdhbnRlbm5hLXBhZ2UtYWN0aXZlJywgdHJ1ZSk7XG5cbiAgICAvLyBUaGVuIGFuaW1hdGUgdGhlIGN1cnJlbnQgcGFnZSBtb3ZpbmcgYXdheSB0byByZXZlYWwgdGhlIHRhcmdldC5cbiAgICAkY3VycmVudFBhZ2UudG9nZ2xlQ2xhc3MoJ2FudGVubmEtcGFnZS1hbmltYXRlJywgdHJ1ZSk7XG4gICAgVHJhbnNpdGlvblV0aWwudG9nZ2xlQ2xhc3MoJGN1cnJlbnRQYWdlLCAnYW50ZW5uYS1wYWdlLWFjdGl2ZScsIGZhbHNlLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8vIEFmdGVyIHRoZSBjdXJyZW50IHBhZ2Ugc2xpZGVzIGludG8gcG9zaXRpb24sIG1vdmUgYWxsIG90aGVyIHBhZ2VzIGJhY2sgb3V0IG9mIHRoZSB2aWV3YWJsZSBhcmVhXG4gICAgICAgICRyb290RWxlbWVudC5maW5kKCcuYW50ZW5uYS1wYWdlJykubm90KHBhZ2VTZWxlY3RvcikucmVtb3ZlQ2xhc3MoJ2FudGVubmEtcGFnZS1hY3RpdmUnKTtcbiAgICAgICAgJHRhcmdldFBhZ2UuY3NzKCd6LWluZGV4JywgcGFnZVorKyk7IC8vIFdoZW4gdGhlIGFuaW1hdGlvbiBpcyBkb25lLCBtYWtlIHN1cmUgdGhlIGN1cnJlbnQgcGFnZSBoYXMgdGhlIGhpZ2hlc3Qgei1pbmRleCAoanVzdCBmb3IgY29uc2lzdGVuY3kpXG4gICAgICAgIC8vIFRlYXJkb3duIGFsbCBvdGhlciBwYWdlcy4gVGhleSdsbCBiZSByZS1jcmVhdGVkIGlmIG5lY2Vzc2FyeS5cbiAgICAgICAgdmFyIHJlbWFpbmluZ1BhZ2VzID0gW107XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGFnZXMubGVuZ3RoIC0gMTsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgcGFnZSA9IHBhZ2VzW2ldO1xuICAgICAgICAgICAgaWYgKHBhZ2Uuc2VsZWN0b3IgPT09IHBhZ2VTZWxlY3Rvcikge1xuICAgICAgICAgICAgICAgIHJlbWFpbmluZ1BhZ2VzLnB1c2gocGFnZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHBhZ2UudGVhcmRvd24oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBwYWdlcyA9IHJlbWFpbmluZ1BhZ2VzO1xuICAgIH0pO1xuICAgIHNpemVCb2R5VG9GaXQoJHJvb3RFbGVtZW50LCAkdGFyZ2V0UGFnZSwgdHJ1ZSk7XG59XG5cbmZ1bmN0aW9uIHNpemVCb2R5VG9GaXQoJHJvb3RFbGVtZW50LCAkcGFnZSwgYW5pbWF0ZSkge1xuICAgIHZhciAkcGFnZUNvbnRhaW5lciA9ICRyb290RWxlbWVudC5maW5kKCcuYW50ZW5uYS1wYWdlLWNvbnRhaW5lcicpO1xuICAgIHZhciAkYm9keSA9ICRwYWdlLmZpbmQoJy5hbnRlbm5hLWJvZHknKTtcbiAgICB2YXIgY3VycmVudEhlaWdodCA9ICRwYWdlQ29udGFpbmVyLmNzcygnaGVpZ2h0Jyk7XG4gICAgJHBhZ2VDb250YWluZXIuY3NzKHsgaGVpZ2h0OiAnJyB9KTsgLy8gQ2xlYXIgYW55IHByZXZpb3VzbHkgY29tcHV0ZWQgaGVpZ2h0IHNvIHdlIGdldCBhIGZyZXNoIGNvbXB1dGF0aW9uIG9mIHRoZSBjaGlsZCBoZWlnaHRzXG4gICAgdmFyIG5ld0JvZHlIZWlnaHQgPSBNYXRoLm1pbigzMDAsICRib2R5LmdldCgwKS5zY3JvbGxIZWlnaHQpO1xuICAgICRib2R5LmNzcyh7IGhlaWdodDogbmV3Qm9keUhlaWdodCB9KTsgLy8gVE9ETzogZG91YmxlLWNoZWNrIHRoYXQgd2UgY2FuJ3QganVzdCBzZXQgYSBtYXgtaGVpZ2h0IG9mIDMwMHB4IG9uIHRoZSBib2R5LlxuICAgIHZhciBmb290ZXJIZWlnaHQgPSAkcGFnZS5maW5kKCcuYW50ZW5uYS1mb290ZXInKS5vdXRlckhlaWdodCgpOyAvLyByZXR1cm5zICdudWxsJyBpZiB0aGVyZSdzIG5vIGZvb3Rlci4gYWRkZWQgdG8gYW4gaW50ZWdlciwgJ251bGwnIGFjdHMgbGlrZSAwXG4gICAgdmFyIG5ld1BhZ2VIZWlnaHQgPSBuZXdCb2R5SGVpZ2h0ICsgZm9vdGVySGVpZ2h0O1xuICAgIGlmIChhbmltYXRlKSB7XG4gICAgICAgICRwYWdlQ29udGFpbmVyLmNzcyh7IGhlaWdodDogY3VycmVudEhlaWdodCB9KTtcbiAgICAgICAgJHBhZ2VDb250YWluZXIuYW5pbWF0ZSh7IGhlaWdodDogbmV3UGFnZUhlaWdodCB9LCAyMDApO1xuICAgIH0gZWxzZSB7XG4gICAgICAgICRwYWdlQ29udGFpbmVyLmNzcyh7IGhlaWdodDogbmV3UGFnZUhlaWdodCB9KTtcbiAgICB9XG4gICAgLy8gVE9ETzogd2UgbWlnaHQgbm90IG5lZWQgd2lkdGggcmVzaXppbmcgYXQgYWxsLlxuICAgIHZhciBtaW5XaWR0aCA9ICRwYWdlLmNzcygnbWluLXdpZHRoJyk7XG4gICAgdmFyIHdpZHRoID0gcGFyc2VJbnQobWluV2lkdGgpO1xuICAgIGlmICh3aWR0aCA+IDApIHtcbiAgICAgICAgaWYgKGFuaW1hdGUpIHtcbiAgICAgICAgICAgICRyb290RWxlbWVudC5hbmltYXRlKHsgd2lkdGg6IHdpZHRoIH0sIDIwMCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkcm9vdEVsZW1lbnQuY3NzKHsgd2lkdGg6IHdpZHRoIH0pO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBzZXR1cFdpbmRvd0Nsb3NlKHBhZ2VzLCByYWN0aXZlKSB7XG4gICAgdmFyICRyb290RWxlbWVudCA9ICQocm9vdEVsZW1lbnQocmFjdGl2ZSkpO1xuXG4gICAgLy8gVE9ETzogSWYgeW91IG1vdXNlIG92ZXIgdGhlIHRyaWdnZXIgc2xvd2x5IGZyb20gdGhlIHRvcCBsZWZ0LCB0aGUgd2luZG93IG9wZW5zIHdpdGhvdXQgYmVpbmcgdW5kZXIgdGhlIGN1cnNvcixcbiAgICAvLyAgICAgICBzbyBubyBtb3VzZW91dCBldmVudCBpcyByZWNlaXZlZC4gV2hlbiB3ZSBvcGVuIHRoZSB3aW5kb3csIHdlIHNob3VsZCBwcm9iYWJseSBqdXN0IHNjb290IGl0IHVwIHNsaWdodGx5XG4gICAgLy8gICAgICAgaWYgbmVlZGVkIHRvIGFzc3VyZSB0aGF0IGl0J3MgdW5kZXIgdGhlIGN1cnNvci4gQWx0ZXJuYXRpdmVseSwgd2UgY291bGQgYWRqdXN0IHRoZSBtb3VzZW92ZXIgYXJlYSB0byBtYXRjaFxuICAgIC8vICAgICAgIHRoZSByZWdpb24gdGhhdCB0aGUgd2luZG93IG9wZW5zLlxuICAgICRyb290RWxlbWVudFxuICAgICAgICAub24oJ21vdXNlb3V0LmFudGVubmEnLCBkZWxheWVkQ2xvc2VXaW5kb3cpXG4gICAgICAgIC5vbignbW91c2VvdmVyLmFudGVubmEnLCBrZWVwV2luZG93T3BlbilcbiAgICAgICAgLm9uKCdmb2N1c2luLmFudGVubmEnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIE9uY2UgdGhlIHdpbmRvdyBoYXMgZm9jdXMsIGRvbid0IGNsb3NlIGl0IG9uIG1vdXNlb3V0LlxuICAgICAgICAgICAga2VlcFdpbmRvd09wZW4oKTtcbiAgICAgICAgICAgICRyb290RWxlbWVudC5vZmYoJ21vdXNlb3V0LmFudGVubmEnKTtcbiAgICAgICAgICAgICRyb290RWxlbWVudC5vZmYoJ21vdXNlb3Zlci5hbnRlbm5hJyk7XG4gICAgICAgIH0pO1xuICAgICQoZG9jdW1lbnQpLm9uKCdjbGljay5hbnRlbm5hJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgaWYgKCQoZXZlbnQudGFyZ2V0KS5jbG9zZXN0KFNFTEVDVE9SX1JFQUNUSU9OU19XSURHRVQpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgY2xvc2VBbGxXaW5kb3dzKCk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICB2YXIgdGFwTGlzdGVuZXIgPSBUb3VjaFN1cHBvcnQuc2V0dXBUYXAoZG9jdW1lbnQsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGlmICgkKGV2ZW50LnRhcmdldCkuY2xvc2VzdChTRUxFQ1RPUl9SRUFDVElPTlNfV0lER0VUKS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBjbG9zZUFsbFdpbmRvd3MoKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgdmFyIGNsb3NlVGltZXI7XG5cbiAgICBmdW5jdGlvbiBkZWxheWVkQ2xvc2VXaW5kb3coKSB7XG4gICAgICAgIGNsb3NlVGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY2xvc2VUaW1lciA9IG51bGw7XG4gICAgICAgICAgICBjbG9zZUFsbFdpbmRvd3MoKTtcbiAgICAgICAgfSwgNTAwKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBrZWVwV2luZG93T3BlbigpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KGNsb3NlVGltZXIpO1xuICAgIH1cblxuICAgIHJhY3RpdmUub24oJ2ludGVybmFsQ2xvc2VXaW5kb3cnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gQ2xvc2VzIG9uZSBwYXJ0aWN1bGFyIHJlYWN0aW9uIHdpbmRvdy4gVGhpcyBmdW5jdGlvbiBzaG91bGQgb25seSBiZSBjYWxsZWQgZnJvbSBjbG9zZUFsbFdpbmRvd3MsIHdoaWNoIGFsc29cbiAgICAgICAgLy8gY2xlYW5zIHVwIHRoZSBoYW5kbGVzIHdlIG1haW50YWluIHRvIGFsbCB3aW5kb3dzLlxuICAgICAgICBjbGVhclRpbWVvdXQoY2xvc2VUaW1lcik7XG5cbiAgICAgICAgJHJvb3RFbGVtZW50LnN0b3AodHJ1ZSwgdHJ1ZSkuZmFkZU91dCgnZmFzdCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgJHJvb3RFbGVtZW50LmNzcygnZGlzcGxheScsICcnKTsgLy8gQ2xlYXIgdGhlIGRpc3BsYXk6bm9uZSB0aGF0IGZhZGVPdXQgcHV0cyBvbiB0aGUgZWxlbWVudFxuICAgICAgICAgICAgJHJvb3RFbGVtZW50LnJlbW92ZUNsYXNzKCdhbnRlbm5hLXJlYWN0aW9ucy1vcGVuJyk7XG5cbiAgICAgICAgICAgIFJhbmdlLmNsZWFySGlnaGxpZ2h0cygpO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYWdlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHBhZ2VzW2ldLnRlYXJkb3duKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByYWN0aXZlLnRlYXJkb3duKCk7XG4gICAgICAgIH0pO1xuICAgICAgICAkcm9vdEVsZW1lbnQub2ZmKCcuYW50ZW5uYScpOyAvLyBVbmJpbmQgYWxsIG9mIHRoZSBoYW5kbGVycyBpbiBvdXIgbmFtZXNwYWNlXG4gICAgICAgICQoZG9jdW1lbnQpLm9mZignY2xpY2suYW50ZW5uYScpO1xuICAgICAgICB0YXBMaXN0ZW5lci50ZWFyZG93bigpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBjbG9zZUFsbFdpbmRvd3MoKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvcGVuSW5zdGFuY2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIG9wZW5JbnN0YW5jZXNbaV0uZmlyZSgnaW50ZXJuYWxDbG9zZVdpbmRvdycpO1xuICAgIH1cbiAgICBvcGVuSW5zdGFuY2VzID0gW107XG59XG5cbmZ1bmN0aW9uIGlzT3BlbldpbmRvdygpIHtcbiAgICByZXR1cm4gb3Blbkluc3RhbmNlcy5sZW5ndGggPiAwO1xufVxuXG4vLyBQcmV2ZW50IHNjcm9sbGluZyBvZiB0aGUgZG9jdW1lbnQgYWZ0ZXIgd2Ugc2Nyb2xsIHRvIHRoZSB0b3AvYm90dG9tIG9mIHRoZSByZWFjdGlvbnMgd2luZG93XG4vLyBDb2RlIGNvcGllZCBmcm9tOiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzU4MDI0NjcvcHJldmVudC1zY3JvbGxpbmctb2YtcGFyZW50LWVsZW1lbnRcbi8vIFRPRE86IGRvZXMgdGhpcyB3b3JrIG9uIG1vYmlsZT9cbmZ1bmN0aW9uIHByZXZlbnRFeHRyYVNjcm9sbCgkcm9vdEVsZW1lbnQpIHtcbiAgICAkcm9vdEVsZW1lbnQub24oJ0RPTU1vdXNlU2Nyb2xsLmFudGVubmEgbW91c2V3aGVlbC5hbnRlbm5hJywgJy5hbnRlbm5hLWJvZHknLCBmdW5jdGlvbihldikge1xuICAgICAgICB2YXIgJHRoaXMgPSAkKHRoaXMpLFxuICAgICAgICAgICAgc2Nyb2xsVG9wID0gdGhpcy5zY3JvbGxUb3AsXG4gICAgICAgICAgICBzY3JvbGxIZWlnaHQgPSB0aGlzLnNjcm9sbEhlaWdodCxcbiAgICAgICAgICAgIGhlaWdodCA9ICR0aGlzLmhlaWdodCgpLFxuICAgICAgICAgICAgZGVsdGEgPSAoZXYudHlwZSA9PSAnRE9NTW91c2VTY3JvbGwnID9cbiAgICAgICAgICAgICAgICBldi5vcmlnaW5hbEV2ZW50LmRldGFpbCAqIC00MCA6XG4gICAgICAgICAgICAgICAgZXYub3JpZ2luYWxFdmVudC53aGVlbERlbHRhKSxcbiAgICAgICAgICAgIHVwID0gZGVsdGEgPiAwO1xuXG4gICAgICAgIGlmIChzY3JvbGxIZWlnaHQgPD0gaGVpZ2h0KSB7XG4gICAgICAgICAgICAvLyBUaGlzIGlzIGFuIGFkZGl0aW9uIHRvIHRoZSBTdGFja092ZXJmbG93IGNvZGUsIHRvIG1ha2Ugc3VyZSB0aGUgcGFnZSBzY3JvbGxzIGFzIHVzdWFsIGlmIHRoZSB3aW5kb3dcbiAgICAgICAgICAgIC8vIGNvbnRlbnQgZG9lc24ndCBzY3JvbGwuXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcHJldmVudCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgZXYuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICBldi5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgZXYucmV0dXJuVmFsdWUgPSBmYWxzZTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoIXVwICYmIC1kZWx0YSA+IHNjcm9sbEhlaWdodCAtIGhlaWdodCAtIHNjcm9sbFRvcCkge1xuICAgICAgICAgICAgLy8gU2Nyb2xsaW5nIGRvd24sIGJ1dCB0aGlzIHdpbGwgdGFrZSB1cyBwYXN0IHRoZSBib3R0b20uXG4gICAgICAgICAgICAkdGhpcy5zY3JvbGxUb3Aoc2Nyb2xsSGVpZ2h0KTtcbiAgICAgICAgICAgIHJldHVybiBwcmV2ZW50KCk7XG4gICAgICAgIH0gZWxzZSBpZiAodXAgJiYgZGVsdGEgPiBzY3JvbGxUb3ApIHtcbiAgICAgICAgICAgIC8vIFNjcm9sbGluZyB1cCwgYnV0IHRoaXMgd2lsbCB0YWtlIHVzIHBhc3QgdGhlIHRvcC5cbiAgICAgICAgICAgICR0aGlzLnNjcm9sbFRvcCgwKTtcbiAgICAgICAgICAgIHJldHVybiBwcmV2ZW50KCk7XG4gICAgICAgIH1cbiAgICB9KTtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIG9wZW46IG9wZW5SZWFjdGlvbnNXaWRnZXQsXG4gICAgaXNPcGVuOiBpc09wZW5XaW5kb3csXG4gICAgUEFHRV9SRUFDVElPTlM6IFBBR0VfUkVBQ1RJT05TLFxuICAgIFBBR0VfREVGQVVMVFM6IFBBR0VfREVGQVVMVFMsXG4gICAgUEFHRV9BVVRPOiBQQUdFX0FVVE8sXG4gICAgc2VsZWN0b3I6IFNFTEVDVE9SX1JFQUNUSU9OU19XSURHRVQsXG4gICAgdGVhcmRvd246IGNsb3NlQWxsV2luZG93c1xufTsiLCJ2YXIgR3JvdXBTZXR0aW5ncyA9IHJlcXVpcmUoJy4vZ3JvdXAtc2V0dGluZ3MnKTtcbnZhciBIYXNoZWRFbGVtZW50cyA9IHJlcXVpcmUoJy4vaGFzaGVkLWVsZW1lbnRzJyk7XG52YXIgUGFnZURhdGEgPSByZXF1aXJlKCcuL3BhZ2UtZGF0YScpO1xudmFyIFBhZ2VEYXRhTG9hZGVyID0gcmVxdWlyZSgnLi9wYWdlLWRhdGEtbG9hZGVyJyk7XG52YXIgUGFnZVNjYW5uZXIgPSByZXF1aXJlKCcuL3BhZ2Utc2Nhbm5lcicpO1xudmFyIFBvcHVwV2lkZ2V0ID0gcmVxdWlyZSgnLi9wb3B1cC13aWRnZXQnKTtcbnZhciBSZWFjdGlvbnNXaWRnZXQgPSByZXF1aXJlKCcuL3JlYWN0aW9ucy13aWRnZXQnKTtcblxudmFyIE11dGF0aW9uT2JzZXJ2ZXIgPSByZXF1aXJlKCcuL3V0aWxzL211dGF0aW9uLW9ic2VydmVyJyk7XG5cbmZ1bmN0aW9uIHJlaW5pdGlhbGl6ZUFsbCgpIHtcbiAgICB2YXIgZ3JvdXBTZXR0aW5ncyA9IEdyb3VwU2V0dGluZ3MuZ2V0KCk7XG4gICAgaWYgKGdyb3VwU2V0dGluZ3MpIHtcbiAgICAgICAgcmVpbml0aWFsaXplKGdyb3VwU2V0dGluZ3MpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdBbnRlbm5hIGNhbm5vdCBiZSByZWluaXRpYWxpemVkLiBHcm91cCBzZXR0aW5ncyBhcmUgbm90IGxvYWRlZC4nKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHJlaW5pdGlhbGl6ZShncm91cFNldHRpbmdzKSB7XG4gICAgUmVhY3Rpb25zV2lkZ2V0LnRlYXJkb3duKCk7XG4gICAgUG9wdXBXaWRnZXQudGVhcmRvd24oKTtcbiAgICBQYWdlU2Nhbm5lci50ZWFyZG93bigpO1xuICAgIFBhZ2VEYXRhLnRlYXJkb3duKCk7XG4gICAgSGFzaGVkRWxlbWVudHMudGVhcmRvd24oKTtcbiAgICBNdXRhdGlvbk9ic2VydmVyLnRlYXJkb3duKCk7XG5cbiAgICBQYWdlRGF0YUxvYWRlci5sb2FkKGdyb3VwU2V0dGluZ3MpO1xuICAgIFBhZ2VTY2FubmVyLnNjYW4oZ3JvdXBTZXR0aW5ncyk7XG5cbiAgICBzZXR1cFJlaW5pdGlhbGl6YXRpb24oZ3JvdXBTZXR0aW5ncyk7IC8vIG5lZWQgdG8gc2V0dXAgYWdhaW4gYWZ0ZXIgdGVhcmluZyBkb3duIHRoZSBtdXRhdGlvbiBvYnNlcnZlci5cbn1cblxuZnVuY3Rpb24gc2V0dXBSZWluaXRpYWxpemF0aW9uKGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgYnJvd3NlclVybCA9IGNvbXB1dGVCcm93c2VyVXJsKGdyb3VwU2V0dGluZ3MpO1xuICAgIE11dGF0aW9uT2JzZXJ2ZXIuYWRkQWRkaXRpb25MaXN0ZW5lcihmdW5jdGlvbigkZWxlbWVudHMpIHtcbiAgICAgICAgdmFyIG5ld0Jyb3dzZXJVcmwgPSBjb21wdXRlQnJvd3NlclVybChncm91cFNldHRpbmdzKTtcbiAgICAgICAgaWYgKGJyb3dzZXJVcmwgIT0gbmV3QnJvd3NlclVybCkge1xuICAgICAgICAgICAgYnJvd3NlclVybCA9IG5ld0Jyb3dzZXJVcmw7XG4gICAgICAgICAgICByZWluaXRpYWxpemUoZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuXG4gICAgZnVuY3Rpb24gY29tcHV0ZUJyb3dzZXJVcmwoZ3JvdXBTZXR0aW5ncykge1xuICAgICAgICAvLyBXZSBtYW51YWxseSBjb25zdHJ1Y3QgdGhlIFVSTCBzbyB0aGF0IHdlIGNhbiBsZWF2ZSBvdXQgdGhlIHNlYXJjaCBhbmQgaGFzaCBwb3J0aW9ucy5cbiAgICAgICAgdmFyIHBvcnQgPSAod2luZG93LmxvY2F0aW9uLnBvcnQgPyAnOicgKyB3aW5kb3cubG9jYXRpb24ucG9ydCA6ICcnKTtcbiAgICAgICAgdmFyIHF1ZXJ5ID0gZ3JvdXBTZXR0aW5ncy51cmwuaW5jbHVkZVF1ZXJ5U3RyaW5nKCkgJiYgd2luZG93LmxvY2F0aW9uLnNlYXJjaCA/IHdpbmRvdy5sb2NhdGlvbi5zZWFyY2ggOiAnJztcbiAgICAgICAgcmV0dXJuICh3aW5kb3cubG9jYXRpb24ucHJvdG9jb2wgKyAnLy8nICsgd2luZG93LmxvY2F0aW9uLmhvc3RuYW1lICsgcG9ydCArIHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZSkudG9Mb3dlckNhc2UoKSArIHF1ZXJ5O1xuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgc2V0dXBSZWluaXRpYWxpemF0aW9uOiBzZXR1cFJlaW5pdGlhbGl6YXRpb24sXG4gICAgcmVpbml0aWFsaXplQWxsOiByZWluaXRpYWxpemVBbGxcbn07IiwidmFyIFJhY3RpdmVQcm92aWRlciA9IHJlcXVpcmUoJy4vdXRpbHMvcmFjdGl2ZS1wcm92aWRlcicpO1xudmFyIFJhbmd5UHJvdmlkZXIgPSByZXF1aXJlKCcuL3V0aWxzL3Jhbmd5LXByb3ZpZGVyJyk7XG52YXIgSlF1ZXJ5UHJvdmlkZXIgPSByZXF1aXJlKCcuL3V0aWxzL2pxdWVyeS1wcm92aWRlcicpO1xudmFyIEFwcE1vZGUgPSByZXF1aXJlKCcuL3V0aWxzL2FwcC1tb2RlJyk7XG52YXIgVVJMcyA9IHJlcXVpcmUoJy4vdXRpbHMvdXJscycpO1xuXG52YXIgc2NyaXB0cyA9IFtcbiAgICB7c3JjOiAnLy9jZG5qcy5jbG91ZGZsYXJlLmNvbS9hamF4L2xpYnMvanF1ZXJ5LzIuMS40L2pxdWVyeS5taW4uanMnLCBjYWxsYmFjazogSlF1ZXJ5UHJvdmlkZXIubG9hZGVkfSxcbiAgICAvLyBUT0RPIG1pbmlmeSBvdXIgY29tcGlsZWQgUmFjdGl2ZSBhbmQgaG9zdCBpdCBvbiBhIENETlxuICAgIHtzcmM6IFVSTHMuYXBwU2VydmVyVXJsKCkgKyAnL3N0YXRpYy9qcy9jZG4vcmFjdGl2ZS8wLjcuMy9yYWN0aXZlLnJ1bnRpbWUuanMnLCBjYWxsYmFjazogUmFjdGl2ZVByb3ZpZGVyLmxvYWRlZCwgYWJvdXRUb0xvYWQ6IFJhY3RpdmVQcm92aWRlci5hYm91dFRvTG9hZH0sXG4gICAgLy8gVE9ETyBtaW5pZnkgb3VyIGNvbXBpbGVkIFJhbmR5IGFuZCBob3N0IGl0IG9uIGEgQ0ROXG4gICAge3NyYzogVVJMcy5hcHBTZXJ2ZXJVcmwoKSArICcvc3RhdGljL3dpZGdldC1uZXcvbGliL3Jhbmd5LWNvbXBpbGVkLmpzJywgY2FsbGJhY2s6IFJhbmd5UHJvdmlkZXIubG9hZGVkLCBhYm91dFRvTG9hZDogUmFuZ3lQcm92aWRlci5hYm91dFRvTG9hZH1cbl07XG5pZiAoQXBwTW9kZS5vZmZsaW5lKSB7XG4gICAgLy8gVXNlIHRoZSBvZmZsaW5lIHZlcnNpb25zIG9mIHRoZSBsaWJyYXJpZXMgZm9yIGRldmVsb3BtZW50LlxuICAgIHNjcmlwdHMgPSBbXG4gICAgICAgIHtzcmM6IFVSTHMuYXBwU2VydmVyVXJsKCkgKyAnL3N0YXRpYy9qcy9jZG4vanF1ZXJ5LzIuMS40L2pxdWVyeS5qcycsIGNhbGxiYWNrOiBKUXVlcnlQcm92aWRlci5sb2FkZWR9LFxuICAgICAgICB7c3JjOiBVUkxzLmFwcFNlcnZlclVybCgpICsgJy9zdGF0aWMvanMvY2RuL3JhY3RpdmUvMC43LjMvcmFjdGl2ZS5ydW50aW1lLmpzJywgY2FsbGJhY2s6IFJhY3RpdmVQcm92aWRlci5sb2FkZWQsIGFib3V0VG9Mb2FkOiBSYWN0aXZlUHJvdmlkZXIuYWJvdXRUb0xvYWR9LFxuICAgICAgICB7c3JjOiBVUkxzLmFwcFNlcnZlclVybCgpICsgJy9zdGF0aWMvd2lkZ2V0LW5ldy9saWIvcmFuZ3ktY29tcGlsZWQuanMnLCBjYWxsYmFjazogUmFuZ3lQcm92aWRlci5sb2FkZWQsIGFib3V0VG9Mb2FkOiBSYW5neVByb3ZpZGVyLmFib3V0VG9Mb2FkfVxuICAgIF07XG59XG5cbmZ1bmN0aW9uIGxvYWRBbGxTY3JpcHRzKGxvYWRlZENhbGxiYWNrKSB7XG4gICAgbG9hZFNjcmlwdHMoc2NyaXB0cywgbG9hZGVkQ2FsbGJhY2spO1xufVxuXG5mdW5jdGlvbiBsb2FkU2NyaXB0cyhzY3JpcHRzLCBsb2FkZWRDYWxsYmFjaykge1xuICAgIHZhciBsb2FkaW5nQ291bnQgPSBzY3JpcHRzLmxlbmd0aDtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNjcmlwdHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIHNjcmlwdCA9IHNjcmlwdHNbaV07XG4gICAgICAgIGlmIChzY3JpcHQuYWJvdXRUb0xvYWQpIHsgc2NyaXB0LmFib3V0VG9Mb2FkKCk7IH1cbiAgICAgICAgbG9hZFNjcmlwdChzY3JpcHQuc3JjLCBmdW5jdGlvbihzY3JpcHRDYWxsYmFjaykge1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmIChzY3JpcHRDYWxsYmFjaykgc2NyaXB0Q2FsbGJhY2soKTtcbiAgICAgICAgICAgICAgICBsb2FkaW5nQ291bnQgPSBsb2FkaW5nQ291bnQgLSAxO1xuICAgICAgICAgICAgICAgIGlmIChsb2FkaW5nQ291bnQgPT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAobG9hZGVkQ2FsbGJhY2spIGxvYWRlZENhbGxiYWNrKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSAoc2NyaXB0LmNhbGxiYWNrKSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBsb2FkU2NyaXB0KHNyYywgY2FsbGJhY2spIHtcbiAgICB2YXIgaGVhZCA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF07XG4gICAgaWYgKGhlYWQpIHtcbiAgICAgICAgdmFyIHNjcmlwdFRhZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuICAgICAgICBzY3JpcHRUYWcuc2V0QXR0cmlidXRlKCdzcmMnLCBzcmMpO1xuICAgICAgICBzY3JpcHRUYWcuc2V0QXR0cmlidXRlKCd0eXBlJywndGV4dC9qYXZhc2NyaXB0Jyk7XG5cbiAgICAgICAgaWYgKHNjcmlwdFRhZy5yZWFkeVN0YXRlKSB7IC8vIElFLCBpbmNsLiBJRTlcbiAgICAgICAgICAgIHNjcmlwdFRhZy5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBpZiAoc2NyaXB0VGFnLnJlYWR5U3RhdGUgPT0gXCJsb2FkZWRcIiB8fCBzY3JpcHRUYWcucmVhZHlTdGF0ZSA9PSBcImNvbXBsZXRlXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgc2NyaXB0VGFnLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjYWxsYmFjaykgeyBjYWxsYmFjaygpOyB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNjcmlwdFRhZy5vbmxvYWQgPSBmdW5jdGlvbigpIHsgLy8gT3RoZXIgYnJvd3NlcnNcbiAgICAgICAgICAgICAgICBpZiAoY2FsbGJhY2spIHsgY2FsbGJhY2soKTsgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIGhlYWQuYXBwZW5kQ2hpbGQoc2NyaXB0VGFnKTtcbiAgICB9XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBsb2FkOiBsb2FkQWxsU2NyaXB0c1xufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi91dGlscy9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciBCcm93c2VyTWV0cmljcyA9IHJlcXVpcmUoJy4vdXRpbHMvYnJvd3Nlci1tZXRyaWNzJyk7XG52YXIgUmFjdGl2ZTsgcmVxdWlyZSgnLi91dGlscy9yYWN0aXZlLXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGxvYWRlZFJhY3RpdmUpIHsgUmFjdGl2ZSA9IGxvYWRlZFJhY3RpdmU7fSk7XG52YXIgVG91Y2hTdXBwb3J0ID0gcmVxdWlyZSgnLi91dGlscy90b3VjaC1zdXBwb3J0Jyk7XG5cbnZhciBSZWFjdGlvbnNXaWRnZXQgPSByZXF1aXJlKCcuL3JlYWN0aW9ucy13aWRnZXQnKTtcbnZhciBTVkdzID0gcmVxdWlyZSgnLi9zdmdzJyk7XG5cbmZ1bmN0aW9uIGNyZWF0ZVN1bW1hcnlXaWRnZXQoY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGRlZmF1bHRSZWFjdGlvbnMsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgcmFjdGl2ZSA9IFJhY3RpdmUoe1xuICAgICAgICBlbDogJCgnPGRpdj4nKSwgLy8gdGhlIHJlYWwgcm9vdCBub2RlIGlzIGluIHRoZSB0ZW1wbGF0ZS4gaXQncyBleHRyYWN0ZWQgYWZ0ZXIgdGhlIHRlbXBsYXRlIGlzIHJlbmRlcmVkIGludG8gdGhpcyBkdW1teSBlbGVtZW50XG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIHBhZ2VEYXRhOiBwYWdlRGF0YSxcbiAgICAgICAgICAgIGNvbXB1dGVFeHBhbmRlZFJlYWN0aW9uczogY29tcHV0ZUV4cGFuZGVkUmVhY3Rpb25zKGdyb3VwU2V0dGluZ3MpXG4gICAgICAgIH0sXG4gICAgICAgIG1hZ2ljOiB0cnVlLFxuICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL3N1bW1hcnktd2lkZ2V0Lmhicy5odG1sJyksXG4gICAgICAgIHBhcnRpYWxzOiB7XG4gICAgICAgICAgICBsb2dvOiBTVkdzLmxvZ29cbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHZhciAkcm9vdEVsZW1lbnQgPSAkKHJvb3RFbGVtZW50KHJhY3RpdmUpKTtcbiAgICAkcm9vdEVsZW1lbnQub24oJ21vdXNlZW50ZXInLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgIG9wZW5SZWFjdGlvbnNXaW5kb3coY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGRlZmF1bHRSZWFjdGlvbnMsIGdyb3VwU2V0dGluZ3MsIHJhY3RpdmUpO1xuICAgIH0pO1xuICAgIFRvdWNoU3VwcG9ydC5zZXR1cFRhcCgkcm9vdEVsZW1lbnQuZ2V0KDApLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBpZiAoIVJlYWN0aW9uc1dpZGdldC5pc09wZW4oKSkge1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIG9wZW5SZWFjdGlvbnNXaW5kb3coY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGRlZmF1bHRSZWFjdGlvbnMsIGdyb3VwU2V0dGluZ3MsIHJhY3RpdmUpO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZWxlbWVudDogJHJvb3RFbGVtZW50LFxuICAgICAgICB0ZWFyZG93bjogZnVuY3Rpb24oKSB7IHJhY3RpdmUudGVhcmRvd24oKTsgfVxuICAgIH07XG59XG5cbmZ1bmN0aW9uIHJvb3RFbGVtZW50KHJhY3RpdmUpIHtcbiAgICByZXR1cm4gcmFjdGl2ZS5maW5kKCcuYW50ZW5uYS1zdW1tYXJ5LXdpZGdldCcpO1xufVxuXG5mdW5jdGlvbiBvcGVuUmVhY3Rpb25zV2luZG93KGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBkZWZhdWx0UmVhY3Rpb25zLCBncm91cFNldHRpbmdzLCByYWN0aXZlKSB7XG4gICAgdmFyIHJlYWN0aW9uc1dpZGdldE9wdGlvbnMgPSB7XG4gICAgICAgIGlzU3VtbWFyeTogdHJ1ZSxcbiAgICAgICAgcmVhY3Rpb25zRGF0YTogcGFnZURhdGEuc3VtbWFyeVJlYWN0aW9ucyxcbiAgICAgICAgY29udGFpbmVyRGF0YTogY29udGFpbmVyRGF0YSxcbiAgICAgICAgZGVmYXVsdFJlYWN0aW9uczogZGVmYXVsdFJlYWN0aW9ucyxcbiAgICAgICAgcGFnZURhdGE6IHBhZ2VEYXRhLFxuICAgICAgICBncm91cFNldHRpbmdzOiBncm91cFNldHRpbmdzLFxuICAgICAgICBjb250ZW50RGF0YTogeyB0eXBlOiAncGFnZScsIGJvZHk6ICcnIH1cbiAgICB9O1xuICAgIFJlYWN0aW9uc1dpZGdldC5vcGVuKHJlYWN0aW9uc1dpZGdldE9wdGlvbnMsIHJvb3RFbGVtZW50KHJhY3RpdmUpKTtcbn1cblxuZnVuY3Rpb24gc2hvdWxkVXNlRXhwYW5kZWRTdW1tYXJ5KGdyb3VwU2V0dGluZ3MpIHtcbiAgICByZXR1cm4gZ3JvdXBTZXR0aW5ncy5pc0V4cGFuZGVkTW9iaWxlU3VtbWFyeSgpICYmIEJyb3dzZXJNZXRyaWNzLmlzTW9iaWxlKCk7XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVFeHBhbmRlZFJlYWN0aW9ucyhncm91cFNldHRpbmdzKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHJlYWN0aW9uc0RhdGEpIHtcbiAgICAgICAgaWYgKHNob3VsZFVzZUV4cGFuZGVkU3VtbWFyeShncm91cFNldHRpbmdzKSkge1xuICAgICAgICAgICAgdmFyIGRlZmF1bHRSZWFjdGlvbnMgPSBncm91cFNldHRpbmdzLmRlZmF1bHRSZWFjdGlvbnMoKTtcbiAgICAgICAgICAgIHZhciBtYXggPSAyO1xuICAgICAgICAgICAgdmFyIGV4cGFuZGVkUmVhY3Rpb25zID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJlYWN0aW9uc0RhdGEubGVuZ3RoICYmIGV4cGFuZGVkUmVhY3Rpb25zLmxlbmd0aCA8IG1heDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJlYWN0aW9uRGF0YSA9IHJlYWN0aW9uc0RhdGFbaV07XG4gICAgICAgICAgICAgICAgaWYgKGlzRGVmYXVsdFJlYWN0aW9uKHJlYWN0aW9uRGF0YSwgZGVmYXVsdFJlYWN0aW9ucykpIHtcbiAgICAgICAgICAgICAgICAgICAgZXhwYW5kZWRSZWFjdGlvbnMucHVzaChyZWFjdGlvbkRhdGEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBleHBhbmRlZFJlYWN0aW9ucztcbiAgICAgICAgfVxuICAgIH07XG59XG5cbmZ1bmN0aW9uIGlzRGVmYXVsdFJlYWN0aW9uKHJlYWN0aW9uRGF0YSwgZGVmYXVsdFJlYWN0aW9ucykge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGVmYXVsdFJlYWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoZGVmYXVsdFJlYWN0aW9uc1tpXS50ZXh0ID09PSByZWFjdGlvbkRhdGEudGV4dCkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlOiBjcmVhdGVTdW1tYXJ5V2lkZ2V0XG59OyIsInZhciBSYWN0aXZlOyByZXF1aXJlKCcuL3V0aWxzL3JhY3RpdmUtcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24obG9hZGVkUmFjdGl2ZSkgeyBSYWN0aXZlID0gbG9hZGVkUmFjdGl2ZTt9KTtcblxuLy8gQWJvdXQgaG93IHdlIGhhbmRsZSBpY29uczogV2UgaW5zZXJ0IGEgc2luZ2xlIFNWRyBlbGVtZW50IGF0IHRoZSB0b3Agb2YgdGhlIGJvZHkgZWxlbWVudCB3aGljaCBkZWZpbmVzIGFsbCBvZiB0aGVcbi8vIGljb25zIHdlIG5lZWQuIFRoZW4gYWxsIGljb25zIHVzZWQgYnkgdGhlIGFwcGxpY2F0aW9ucyBhcmUgcmVuZGVyZWQgd2l0aCB2ZXJ5IGxpZ2h0d2VpZ2h0IFNWRyBlbGVtZW50cyB0aGF0IHNpbXBseVxuLy8gcG9pbnQgdG8gdGhlIGFwcHJvcHJpYXRlIGljb24gYnkgcmVmZXJlbmNlLlxuXG4vLyBUT0RPOiBsb29rIGludG8gdXNpbmcgYSBzaW5nbGUgdGVtcGxhdGUgZm9yIHRoZSBcInVzZVwiIFNWR3MuIENhbiB3ZSBpbnN0YW50aWF0ZSBhIHBhcnRpYWwgd2l0aCBhIGR5bmFtaWMgY29udGV4dD9cbnZhciB0ZW1wbGF0ZXMgPSB7XG4gICAgbG9nbzogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL3N2Zy1sb2dvLmhicy5odG1sJyksXG4gICAgLy8gVGhlIFwic2VsZWN0YWJsZVwiIGxvZ28gZGVmaW5lcyBhbiBpbmxpbmUgJ3BhdGgnIHJhdGhlciB0aGFuIGEgJ3VzZScgcmVmZXJlbmNlLCBhcyBhIHdvcmthcm91bmQgZm9yIGEgRmlyZWZveCB0ZXh0IHNlbGVjdGlvbiBidWcuXG4gICAgbG9nb1NlbGVjdGFibGU6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9zdmctbG9nby1zZWxlY3RhYmxlLmhicy5odG1sJyksXG4gICAgY29tbWVudHM6IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy9zdmctY29tbWVudHMuaGJzLmh0bWwnKSxcbiAgICBsb2NhdGlvbjogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL3N2Zy1sb2NhdGlvbi5oYnMuaHRtbCcpLFxuICAgIGZhY2Vib29rOiByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvc3ZnLWZhY2Vib29rLmhicy5odG1sJyksXG4gICAgdHdpdHRlcjogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL3N2Zy10d2l0dGVyLmhicy5odG1sJyksXG4gICAgbGVmdDogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL3N2Zy1sZWZ0Lmhicy5odG1sJylcbn07XG5cbnZhciBpc1NldHVwID0gZmFsc2U7XG5cbmZ1bmN0aW9uIGVuc3VyZVNldHVwKCkge1xuICAgIGlmICghaXNTZXR1cCkge1xuICAgICAgICB2YXIgZHVtbXkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgUmFjdGl2ZSh7XG4gICAgICAgICAgICBlbDogZHVtbXksXG4gICAgICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL3N2Z3MuaGJzLmh0bWwnKVxuICAgICAgICB9KTtcbiAgICAgICAgLy8gU2FmYXJpIG9uIGlPUyByZXF1aXJlcyB0aGUgU1ZHIHRoYXQgZGVmaW5lcyB0aGUgaWNvbnMgYXBwZWFyIGJlZm9yZSB0aGUgU1ZHcyB0aGF0IHJlZmVyZW5jZSBpdC5cbiAgICAgICAgZG9jdW1lbnQuYm9keS5pbnNlcnRCZWZvcmUoZHVtbXkuY2hpbGRyZW5bMF0sIGRvY3VtZW50LmJvZHkuZmlyc3RDaGlsZCk7XG4gICAgICAgIGlzU2V0dXAgPSB0cnVlO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZ2V0U1ZHKHRlbXBsYXRlKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICBlbnN1cmVTZXR1cCgpO1xuICAgICAgICByZXR1cm4gdGVtcGxhdGU7XG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgbG9nbzogZ2V0U1ZHKHRlbXBsYXRlcy5sb2dvKSxcbiAgICBsb2dvU2VsZWN0YWJsZTogZ2V0U1ZHKHRlbXBsYXRlcy5sb2dvU2VsZWN0YWJsZSksXG4gICAgY29tbWVudHM6IGdldFNWRyh0ZW1wbGF0ZXMuY29tbWVudHMpLFxuICAgIGxvY2F0aW9uOiBnZXRTVkcodGVtcGxhdGVzLmxvY2F0aW9uKSxcbiAgICBmYWNlYm9vazogZ2V0U1ZHKHRlbXBsYXRlcy5mYWNlYm9vayksXG4gICAgdHdpdHRlcjogZ2V0U1ZHKHRlbXBsYXRlcy50d2l0dGVyKSxcbiAgICBsZWZ0OiBnZXRTVkcodGVtcGxhdGVzLmxlZnQpXG59OyIsInZhciAkOyByZXF1aXJlKCcuL3V0aWxzL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIFJhY3RpdmU7IHJlcXVpcmUoJy4vdXRpbHMvcmFjdGl2ZS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihsb2FkZWRSYWN0aXZlKSB7IFJhY3RpdmUgPSBsb2FkZWRSYWN0aXZlO30pO1xudmFyIFJhbmdlID0gcmVxdWlyZSgnLi91dGlscy9yYW5nZScpO1xudmFyIFRvdWNoU3VwcG9ydCA9IHJlcXVpcmUoJy4vdXRpbHMvdG91Y2gtc3VwcG9ydCcpO1xuXG52YXIgUG9wdXBXaWRnZXQgPSByZXF1aXJlKCcuL3BvcHVwLXdpZGdldCcpO1xudmFyIFJlYWN0aW9uc1dpZGdldCA9IHJlcXVpcmUoJy4vcmVhY3Rpb25zLXdpZGdldCcpO1xudmFyIFNWR3MgPSByZXF1aXJlKCcuL3N2Z3MnKTtcblxuXG5mdW5jdGlvbiBjcmVhdGVJbmRpY2F0b3JXaWRnZXQob3B0aW9ucykge1xuICAgIHZhciBjb250YWluZXJEYXRhID0gb3B0aW9ucy5jb250YWluZXJEYXRhO1xuICAgIHZhciAkY29udGFpbmVyRWxlbWVudCA9IG9wdGlvbnMuY29udGFpbmVyRWxlbWVudDtcbiAgICB2YXIgcGFnZURhdGEgPSBvcHRpb25zLnBhZ2VEYXRhO1xuICAgIHZhciBncm91cFNldHRpbmdzID0gb3B0aW9ucy5ncm91cFNldHRpbmdzO1xuICAgIHZhciBkZWZhdWx0UmVhY3Rpb25zID0gb3B0aW9ucy5kZWZhdWx0UmVhY3Rpb25zO1xuICAgIHZhciBjb29yZHMgPSBvcHRpb25zLmNvb3JkcztcbiAgICB2YXIgcmFjdGl2ZSA9IFJhY3RpdmUoe1xuICAgICAgICBlbDogJCgnPGRpdj4nKSwgLy8gdGhlIHJlYWwgcm9vdCBub2RlIGlzIGluIHRoZSB0ZW1wbGF0ZS4gaXQncyBleHRyYWN0ZWQgYWZ0ZXIgdGhlIHRlbXBsYXRlIGlzIHJlbmRlcmVkIGludG8gdGhpcyBkdW1teSBlbGVtZW50XG4gICAgICAgIGFwcGVuZDogdHJ1ZSxcbiAgICAgICAgbWFnaWM6IHRydWUsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIGNvbnRhaW5lckRhdGE6IGNvbnRhaW5lckRhdGEsXG4gICAgICAgICAgICBleHRyYUNsYXNzZXM6IGdyb3VwU2V0dGluZ3MuZW5hYmxlVGV4dEhlbHBlcigpID8gXCJcIiA6IFwiYW50ZW5uYS1ub2hpbnRcIlxuICAgICAgICB9LFxuICAgICAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi4vdGVtcGxhdGVzL3RleHQtaW5kaWNhdG9yLXdpZGdldC5oYnMuaHRtbCcpLFxuICAgICAgICBwYXJ0aWFsczoge1xuICAgICAgICAgICAgbG9nbzogU1ZHcy5sb2dvU2VsZWN0YWJsZVxuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICB2YXIgcmVhY3Rpb25XaWRnZXRPcHRpb25zID0ge1xuICAgICAgICByZWFjdGlvbnNEYXRhOiBjb250YWluZXJEYXRhLnJlYWN0aW9ucyxcbiAgICAgICAgY29udGFpbmVyRGF0YTogY29udGFpbmVyRGF0YSxcbiAgICAgICAgY29udGFpbmVyRWxlbWVudDogJGNvbnRhaW5lckVsZW1lbnQsXG4gICAgICAgIGNvbnRlbnREYXRhOiB7IHR5cGU6ICd0ZXh0JyB9LFxuICAgICAgICBkZWZhdWx0UmVhY3Rpb25zOiBkZWZhdWx0UmVhY3Rpb25zLFxuICAgICAgICBwYWdlRGF0YTogcGFnZURhdGEsXG4gICAgICAgIGdyb3VwU2V0dGluZ3M6IGdyb3VwU2V0dGluZ3NcbiAgICB9O1xuXG4gICAgdmFyICRyb290RWxlbWVudCA9ICQocm9vdEVsZW1lbnQocmFjdGl2ZSkpO1xuICAgIGlmIChjb29yZHMpIHtcbiAgICAgICAgJHJvb3RFbGVtZW50LmNzcyh7XG4gICAgICAgICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcbiAgICAgICAgICAgIHRvcDogY29vcmRzLnRvcCAtICRyb290RWxlbWVudC5oZWlnaHQoKSxcbiAgICAgICAgICAgIGJvdHRvbTogY29vcmRzLmJvdHRvbSxcbiAgICAgICAgICAgIGxlZnQ6IGNvb3Jkcy5sZWZ0LFxuICAgICAgICAgICAgcmlnaHQ6IGNvb3Jkcy5yaWdodCxcbiAgICAgICAgICAgICd6LWluZGV4JzogMTAwMCAvLyBUT0RPOiBjb21wdXRlIGEgcmVhbCB2YWx1ZT9cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHZhciBob3ZlclRpbWVvdXQ7XG4gICAgdmFyIHRhcFN1cHBvcnQgPSBUb3VjaFN1cHBvcnQuc2V0dXBUYXAoJHJvb3RFbGVtZW50LmdldCgwKSwgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgb3BlblJlYWN0aW9uc1dpbmRvdyhyZWFjdGlvbldpZGdldE9wdGlvbnMsIHJhY3RpdmUpXG4gICAgfSk7XG4gICAgJHJvb3RFbGVtZW50Lm9uKCdtb3VzZWVudGVyLmFudGVubmEnLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBpZiAoZXZlbnQuYnV0dG9ucyA+IDAgfHwgKGV2ZW50LmJ1dHRvbnMgPT0gdW5kZWZpbmVkICYmIGV2ZW50LndoaWNoID4gMCkpIHsgLy8gT24gU2FmYXJpLCBldmVudC5idXR0b25zIGlzIHVuZGVmaW5lZCBidXQgZXZlbnQud2hpY2ggZ2l2ZXMgYSBnb29kIHZhbHVlLiBldmVudC53aGljaCBpcyBiYWQgb24gRkZcbiAgICAgICAgICAgIC8vIERvbid0IHJlYWN0IGlmIHRoZSB1c2VyIGlzIGRyYWdnaW5nIG9yIHNlbGVjdGluZyB0ZXh0LlxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNsZWFyVGltZW91dChob3ZlclRpbWVvdXQpOyAvLyBvbmx5IG9uZSB0aW1lb3V0IGF0IGEgdGltZVxuICAgICAgICBob3ZlclRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKGNvbnRhaW5lckRhdGEucmVhY3Rpb25zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBvcGVuUmVhY3Rpb25zV2luZG93KHJlYWN0aW9uV2lkZ2V0T3B0aW9ucywgcmFjdGl2ZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhciAkaWNvbiA9ICQocm9vdEVsZW1lbnQocmFjdGl2ZSkpLmZpbmQoJy5hbnRlbm5hLWxvZ28nKTtcbiAgICAgICAgICAgICAgICB2YXIgb2Zmc2V0ID0gJGljb24ub2Zmc2V0KCk7XG4gICAgICAgICAgICAgICAgdmFyIGNvb3JkaW5hdGVzID0ge1xuICAgICAgICAgICAgICAgICAgICB0b3A6IG9mZnNldC50b3AgKyBNYXRoLmZsb29yKCRpY29uLmhlaWdodCgpIC8gMiksIC8vIFRPRE8gdGhpcyBudW1iZXIgaXMgYSBsaXR0bGUgb2ZmIGJlY2F1c2UgdGhlIGRpdiBkb2Vzbid0IHRpZ2h0bHkgd3JhcCB0aGUgaW5zZXJ0ZWQgZm9udCBjaGFyYWN0ZXJcbiAgICAgICAgICAgICAgICAgICAgbGVmdDogb2Zmc2V0LmxlZnQgKyBNYXRoLmZsb29yKCRpY29uLndpZHRoKCkgLyAyKVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgUG9wdXBXaWRnZXQuc2hvdyhjb29yZGluYXRlcywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIG9wZW5SZWFjdGlvbnNXaW5kb3cocmVhY3Rpb25XaWRnZXRPcHRpb25zLCByYWN0aXZlKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgMjAwKTtcbiAgICB9KTtcbiAgICAkcm9vdEVsZW1lbnQub24oJ21vdXNlbGVhdmUuYW50ZW5uYScsIGZ1bmN0aW9uKCkge1xuICAgICAgICBjbGVhclRpbWVvdXQoaG92ZXJUaW1lb3V0KTtcbiAgICB9KTtcbiAgICAkY29udGFpbmVyRWxlbWVudC5vbignbW91c2VlbnRlci5hbnRlbm5hJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICRyb290RWxlbWVudC5hZGRDbGFzcygnYWN0aXZlJyk7XG4gICAgfSk7XG4gICAgJGNvbnRhaW5lckVsZW1lbnQub24oJ21vdXNlbGVhdmUuYW50ZW5uYScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAkcm9vdEVsZW1lbnQucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpO1xuICAgIH0pO1xuICAgIHJldHVybiB7XG4gICAgICAgIGVsZW1lbnQ6ICRyb290RWxlbWVudCxcbiAgICAgICAgdGVhcmRvd246IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgJGNvbnRhaW5lckVsZW1lbnQub2ZmKCcuYW50ZW5uYScpO1xuICAgICAgICAgICAgcmFjdGl2ZS50ZWFyZG93bigpO1xuICAgICAgICAgICAgdGFwU3VwcG9ydC50ZWFyZG93bigpO1xuICAgICAgICB9XG4gICAgfTtcbn1cblxuZnVuY3Rpb24gcm9vdEVsZW1lbnQocmFjdGl2ZSkge1xuICAgIHJldHVybiByYWN0aXZlLmZpbmQoJy5hbnRlbm5hLXRleHQtaW5kaWNhdG9yLXdpZGdldCcpO1xufVxuXG5mdW5jdGlvbiBvcGVuUmVhY3Rpb25zV2luZG93KHJlYWN0aW9uT3B0aW9ucywgcmFjdGl2ZSkge1xuICAgIFJlYWN0aW9uc1dpZGdldC5vcGVuKHJlYWN0aW9uT3B0aW9ucywgcm9vdEVsZW1lbnQocmFjdGl2ZSkpO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlOiBjcmVhdGVJbmRpY2F0b3JXaWRnZXRcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vdXRpbHMvanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgUG9wdXBXaWRnZXQgPSByZXF1aXJlKCcuL3BvcHVwLXdpZGdldCcpO1xudmFyIFJhbmdlID0gcmVxdWlyZSgnLi91dGlscy9yYW5nZScpO1xudmFyIFJlYWN0aW9uc1dpZGdldCA9IHJlcXVpcmUoJy4vcmVhY3Rpb25zLXdpZGdldCcpO1xudmFyIFRvdWNoU3VwcG9ydCA9IHJlcXVpcmUoJy4vdXRpbHMvdG91Y2gtc3VwcG9ydCcpO1xuXG5cbmZ1bmN0aW9uIGNyZWF0ZVJlYWN0YWJsZVRleHQob3B0aW9ucykge1xuICAgIC8vIFRPRE86IGltcG9zZSBhbiB1cHBlciBsaW1pdCBvbiB0aGUgbGVuZ3RoIG9mIHRleHQgdGhhdCBjYW4gYmUgcmVhY3RlZCB0bz8gKGFwcGxpZXMgdG8gdGhlIGluZGljYXRvci13aWRnZXQgdG9vKVxuICAgIHZhciAkY29udGFpbmVyRWxlbWVudCA9IG9wdGlvbnMuY29udGFpbmVyRWxlbWVudDtcbiAgICB2YXIgY29udGFpbmVyRGF0YSA9IG9wdGlvbnMuY29udGFpbmVyRGF0YTtcbiAgICB2YXIgZXhjbHVkZU5vZGUgPSBvcHRpb25zLmV4Y2x1ZGVOb2RlO1xuICAgIHZhciByZWFjdGlvbnNXaWRnZXRPcHRpb25zID0ge1xuICAgICAgICByZWFjdGlvbnNEYXRhOiBbXSwgLy8gQWx3YXlzIG9wZW4gd2l0aCB0aGUgZGVmYXVsdCByZWFjdGlvbnNcbiAgICAgICAgY29udGFpbmVyRGF0YTogY29udGFpbmVyRGF0YSxcbiAgICAgICAgY29udGVudERhdGE6IHsgdHlwZTogJ3RleHQnIH0sXG4gICAgICAgIGNvbnRhaW5lckVsZW1lbnQ6ICRjb250YWluZXJFbGVtZW50LFxuICAgICAgICBkZWZhdWx0UmVhY3Rpb25zOiBvcHRpb25zLmRlZmF1bHRSZWFjdGlvbnMsXG4gICAgICAgIHBhZ2VEYXRhOiBvcHRpb25zLnBhZ2VEYXRhLFxuICAgICAgICBncm91cFNldHRpbmdzOiBvcHRpb25zLmdyb3VwU2V0dGluZ3NcbiAgICB9O1xuXG4gICAgdmFyIHRhcEV2ZW50cyA9IHNldHVwVGFwRXZlbnRzKCRjb250YWluZXJFbGVtZW50LmdldCgwKSwgcmVhY3Rpb25zV2lkZ2V0T3B0aW9ucyk7XG4gICAgJGNvbnRhaW5lckVsZW1lbnQub24oJ21vdXNldXAuYW50ZW5uYScsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGlmIChjb250YWluZXJEYXRhLmxvYWRlZCkge1xuICAgICAgICAgICAgdmFyIG5vZGUgPSAkY29udGFpbmVyRWxlbWVudC5nZXQoMCk7XG4gICAgICAgICAgICB2YXIgcG9pbnQgPSBSYW5nZS5nZXRTZWxlY3Rpb25FbmRQb2ludChub2RlLCBldmVudCwgZXhjbHVkZU5vZGUpO1xuICAgICAgICAgICAgaWYgKHBvaW50KSB7XG4gICAgICAgICAgICAgICAgdmFyIGNvb3JkaW5hdGVzID0ge3RvcDogcG9pbnQueSwgbGVmdDogcG9pbnQueH07XG4gICAgICAgICAgICAgICAgUG9wdXBXaWRnZXQuc2hvdyhjb29yZGluYXRlcywgZ3JhYlNlbGVjdGlvbkFuZE9wZW4obm9kZSwgY29vcmRpbmF0ZXMsIHJlYWN0aW9uc1dpZGdldE9wdGlvbnMsIGV4Y2x1ZGVOb2RlKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4ge1xuICAgICAgICB0ZWFyZG93bjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB0YXBFdmVudHMudGVhcmRvd24oKTtcbiAgICAgICAgICAgICRjb250YWluZXJFbGVtZW50Lm9mZignLmFudGVubmEnKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gZ3JhYlNlbGVjdGlvbkFuZE9wZW4obm9kZSwgY29vcmRpbmF0ZXMsIHJlYWN0aW9uc1dpZGdldE9wdGlvbnMsIGV4Y2x1ZGVOb2RlKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICBSYW5nZS5ncmFiU2VsZWN0aW9uKG5vZGUsIGZ1bmN0aW9uKHRleHQsIGxvY2F0aW9uKSB7XG4gICAgICAgICAgICByZWFjdGlvbnNXaWRnZXRPcHRpb25zLmNvbnRlbnREYXRhLmxvY2F0aW9uID0gbG9jYXRpb247XG4gICAgICAgICAgICByZWFjdGlvbnNXaWRnZXRPcHRpb25zLmNvbnRlbnREYXRhLmJvZHkgPSB0ZXh0O1xuICAgICAgICAgICAgUmVhY3Rpb25zV2lkZ2V0Lm9wZW4ocmVhY3Rpb25zV2lkZ2V0T3B0aW9ucywgY29vcmRpbmF0ZXMpO1xuICAgICAgICB9LCBleGNsdWRlTm9kZSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBncmFiTm9kZUFuZE9wZW4obm9kZSwgcmVhY3Rpb25zV2lkZ2V0T3B0aW9ucywgY29vcmRzKSB7XG4gICAgUmFuZ2UuZ3JhYk5vZGUobm9kZSwgZnVuY3Rpb24odGV4dCwgbG9jYXRpb24pIHtcbiAgICAgICAgcmVhY3Rpb25zV2lkZ2V0T3B0aW9ucy5jb250ZW50RGF0YS5sb2NhdGlvbiA9IGxvY2F0aW9uO1xuICAgICAgICByZWFjdGlvbnNXaWRnZXRPcHRpb25zLmNvbnRlbnREYXRhLmJvZHkgPSB0ZXh0O1xuICAgICAgICBSZWFjdGlvbnNXaWRnZXQub3BlbihyZWFjdGlvbnNXaWRnZXRPcHRpb25zLCBjb29yZHMpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBzZXR1cFRhcEV2ZW50cyhlbGVtZW50LCByZWFjdGlvbnNXaWRnZXRPcHRpb25zKSB7XG4gICAgcmV0dXJuIFRvdWNoU3VwcG9ydC5zZXR1cFRhcChlbGVtZW50LCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBpZiAoIVJlYWN0aW9uc1dpZGdldC5pc09wZW4oKSAmJiAkKGV2ZW50LnRhcmdldCkuY2xvc2VzdCgnYScpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIHZhciB0b3VjaCA9IGV2ZW50LmNoYW5nZWRUb3VjaGVzWzBdO1xuICAgICAgICAgICAgdmFyIGNvb3JkcyA9IHsgdG9wOiB0b3VjaC5wYWdlWSwgbGVmdDogdG91Y2gucGFnZVggfTtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IC8vIExldCB0aGlzIGV2ZW50IGZpbmlzaCBwcm9jZXNzaW5nIGJlZm9yZSBvcGVuaW5nIHRoZSByZWFjdGlvbnMgd2luZG93IHNvIHRoZSB3aW5kb3cgZG9lc24ndCBhbHNvIHByb2Nlc3MgdGhlIGV2ZW50LlxuICAgICAgICAgICAgICAgIGdyYWJOb2RlQW5kT3BlbihlbGVtZW50LCByZWFjdGlvbnNXaWRnZXRPcHRpb25zLCBjb29yZHMpO1xuICAgICAgICAgICAgfSwgMCk7XG4gICAgICAgIH1cbiAgICB9KTtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZVJlYWN0YWJsZVRleHQ6IGNyZWF0ZVJlYWN0YWJsZVRleHRcbn07IiwiLy8gVE9ETzogbmVlZHMgYSBiZXR0ZXIgbmFtZSBvbmNlIHRoZSBzY29wZSBpcyBjbGVhclxuXG52YXIgJDsgcmVxdWlyZSgnLi9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcbnZhciBBcHBNb2RlID0gcmVxdWlyZSgnLi9hcHAtbW9kZScpO1xudmFyIFVSTHMgPSByZXF1aXJlKCcuL3VybHMnKTtcbnZhciBVc2VyID0gcmVxdWlyZSgnLi91c2VyJyk7XG5cblxuZnVuY3Rpb24gcG9zdE5ld1JlYWN0aW9uKHJlYWN0aW9uRGF0YSwgY29udGFpbmVyRGF0YSwgcGFnZURhdGEsIGNvbnRlbnREYXRhLCBzdWNjZXNzLCBlcnJvcikge1xuICAgIHZhciBjb250ZW50Qm9keSA9IGNvbnRlbnREYXRhLmJvZHk7XG4gICAgdmFyIGNvbnRlbnRUeXBlID0gY29udGVudERhdGEudHlwZTtcbiAgICB2YXIgY29udGVudExvY2F0aW9uID0gY29udGVudERhdGEubG9jYXRpb247XG4gICAgdmFyIGNvbnRlbnREaW1lbnNpb25zID0gY29udGVudERhdGEuZGltZW5zaW9ucztcbiAgICBVc2VyLmZldGNoVXNlcihmdW5jdGlvbih1c2VySW5mbykge1xuICAgICAgICAvLyBUT0RPIGV4dHJhY3QgdGhlIHNoYXBlIG9mIHRoaXMgZGF0YSBhbmQgcG9zc2libHkgdGhlIHdob2xlIEFQSSBjYWxsXG4gICAgICAgIHZhciBkYXRhID0ge1xuICAgICAgICAgICAgdGFnOiB7XG4gICAgICAgICAgICAgICAgYm9keTogcmVhY3Rpb25EYXRhLnRleHQsXG4gICAgICAgICAgICAgICAgaXNfZGVmYXVsdDogcmVhY3Rpb25EYXRhLmlzRGVmYXVsdCAhPT0gdW5kZWZpbmVkICYmIHJlYWN0aW9uRGF0YS5pc0RlZmF1bHQgLy8gZmFsc2UgdW5sZXNzIHNwZWNpZmllZFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGhhc2g6IGNvbnRhaW5lckRhdGEuaGFzaCxcbiAgICAgICAgICAgIHVzZXJfaWQ6IHVzZXJJbmZvLnVzZXJfaWQsXG4gICAgICAgICAgICBhbnRfdG9rZW46IHVzZXJJbmZvLmFudF90b2tlbixcbiAgICAgICAgICAgIHBhZ2VfaWQ6IHBhZ2VEYXRhLnBhZ2VJZCxcbiAgICAgICAgICAgIGdyb3VwX2lkOiBwYWdlRGF0YS5ncm91cElkLFxuICAgICAgICAgICAgY29udGFpbmVyX2tpbmQ6IGNvbnRlbnRUeXBlLCAvLyBPbmUgb2YgJ3BhZ2UnLCAndGV4dCcsICdtZWRpYScsICdpbWcnXG4gICAgICAgICAgICBjb250ZW50X25vZGVfZGF0YToge1xuICAgICAgICAgICAgICAgIGJvZHk6IGNvbnRlbnRCb2R5LFxuICAgICAgICAgICAgICAgIGtpbmQ6IGNvbnRlbnRUeXBlLFxuICAgICAgICAgICAgICAgIGl0ZW1fdHlwZTogJycgLy8gVE9ETzogbG9va3MgdW51c2VkIGJ1dCBUYWdIYW5kbGVyIGJsb3dzIHVwIHdpdGhvdXQgaXQuIEN1cnJlbnQgY2xpZW50IHBhc3NlcyBpbiBcInBhZ2VcIiBmb3IgcGFnZSByZWFjdGlvbnMuXG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIGlmIChjb250ZW50TG9jYXRpb24pIHtcbiAgICAgICAgICAgIGRhdGEuY29udGVudF9ub2RlX2RhdGEubG9jYXRpb24gPSBjb250ZW50TG9jYXRpb247XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvbnRlbnREaW1lbnNpb25zKSB7XG4gICAgICAgICAgICBkYXRhLmNvbnRlbnRfbm9kZV9kYXRhLmhlaWdodCA9IGNvbnRlbnREaW1lbnNpb25zLmhlaWdodDtcbiAgICAgICAgICAgIGRhdGEuY29udGVudF9ub2RlX2RhdGEud2lkdGggPSBjb250ZW50RGltZW5zaW9ucy53aWR0aDtcbiAgICAgICAgfVxuICAgICAgICBpZiAocmVhY3Rpb25EYXRhLmlkKSB7XG4gICAgICAgICAgICBkYXRhLnRhZy5pZCA9IHJlYWN0aW9uRGF0YS5pZDsgLy8gVE9ETyB0aGUgY3VycmVudCBjbGllbnQgc2VuZHMgXCItMTAxXCIgaWYgdGhlcmUncyBubyBpZC4gaXMgdGhpcyBuZWNlc3Nhcnk/XG4gICAgICAgIH1cbiAgICAgICAgZ2V0SlNPTlAoVVJMcy5jcmVhdGVSZWFjdGlvblVybCgpLCBkYXRhLCBuZXdSZWFjdGlvblN1Y2Nlc3MoY29udGVudExvY2F0aW9uLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgc3VjY2VzcyksIGVycm9yKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gcG9zdFBsdXNPbmUocmVhY3Rpb25EYXRhLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgc3VjY2VzcywgZXJyb3IpIHtcbiAgICBVc2VyLmZldGNoVXNlcihmdW5jdGlvbih1c2VySW5mbykge1xuICAgICAgICAvLyBUT0RPIGV4dHJhY3QgdGhlIHNoYXBlIG9mIHRoaXMgZGF0YSBhbmQgcG9zc2libHkgdGhlIHdob2xlIEFQSSBjYWxsXG4gICAgICAgIGlmICghcmVhY3Rpb25EYXRhLmNvbnRlbnQpIHtcbiAgICAgICAgICAgIC8vIFRoaXMgaXMgYSBzdW1tYXJ5IHJlYWN0aW9uLiBTZWUgaWYgd2UgaGF2ZSBhbnkgY29udGFpbmVyIGRhdGEgdGhhdCB3ZSBjYW4gbGluayB0byBpdC5cbiAgICAgICAgICAgIHZhciBjb250YWluZXJSZWFjdGlvbnMgPSBjb250YWluZXJEYXRhLnJlYWN0aW9ucztcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY29udGFpbmVyUmVhY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNvbnRhaW5lclJlYWN0aW9uID0gY29udGFpbmVyUmVhY3Rpb25zW2ldO1xuICAgICAgICAgICAgICAgIGlmIChjb250YWluZXJSZWFjdGlvbi5pZCA9PT0gcmVhY3Rpb25EYXRhLmlkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlYWN0aW9uRGF0YS5wYXJlbnRJRCA9IGNvbnRhaW5lclJlYWN0aW9uLnBhcmVudElEO1xuICAgICAgICAgICAgICAgICAgICByZWFjdGlvbkRhdGEuY29udGVudCA9IGNvbnRhaW5lclJlYWN0aW9uLmNvbnRlbnQ7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB2YXIgZGF0YSA9IHtcbiAgICAgICAgICAgIHRhZzoge1xuICAgICAgICAgICAgICAgIGJvZHk6IHJlYWN0aW9uRGF0YS50ZXh0LFxuICAgICAgICAgICAgICAgIGlkOiByZWFjdGlvbkRhdGEuaWRcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBoYXNoOiBjb250YWluZXJEYXRhLmhhc2gsXG4gICAgICAgICAgICB1c2VyX2lkOiB1c2VySW5mby51c2VyX2lkLFxuICAgICAgICAgICAgYW50X3Rva2VuOiB1c2VySW5mby5hbnRfdG9rZW4sXG4gICAgICAgICAgICBwYWdlX2lkOiBwYWdlRGF0YS5wYWdlSWQsXG4gICAgICAgICAgICBncm91cF9pZDogcGFnZURhdGEuZ3JvdXBJZCxcbiAgICAgICAgICAgIGNvbnRhaW5lcl9raW5kOiBjb250YWluZXJEYXRhLnR5cGUsIC8vICdwYWdlJywgJ3RleHQnLCAnbWVkaWEnLCAnaW1nJ1xuICAgICAgICAgICAgY29udGVudF9ub2RlX2RhdGE6IHtcbiAgICAgICAgICAgICAgICBib2R5OiAnJywgLy8gVE9ETzogZG8gd2UgbmVlZCB0aGlzIGZvciArMXM/IGxvb2tzIGxpa2Ugb25seSB0aGUgaWQgZmllbGQgaXMgdXNlZCwgaWYgb25lIGlzIHNldFxuICAgICAgICAgICAgICAgIGtpbmQ6IGNvbnRlbnROb2RlRGF0YUtpbmQoY29udGFpbmVyRGF0YS50eXBlKSxcbiAgICAgICAgICAgICAgICBpdGVtX3R5cGU6ICcnIC8vIFRPRE86IGxvb2tzIHVudXNlZCBidXQgVGFnSGFuZGxlciBibG93cyB1cCB3aXRob3V0IGl0XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIGlmIChyZWFjdGlvbkRhdGEuY29udGVudCkge1xuICAgICAgICAgICAgZGF0YS5jb250ZW50X25vZGVfZGF0YS5pZCA9IHJlYWN0aW9uRGF0YS5jb250ZW50LmlkO1xuICAgICAgICAgICAgZGF0YS5jb250ZW50X25vZGVfZGF0YS5sb2NhdGlvbiA9IHJlYWN0aW9uRGF0YS5jb250ZW50LmxvY2F0aW9uO1xuICAgICAgICB9XG4gICAgICAgIC8vIFRPRE86IHNob3VsZCB3ZSBiYWlsIGlmIHRoZXJlJ3Mgbm8gcGFyZW50IElEPyBJdCdzIG5vdCByZWFsbHkgYSArMSB3aXRob3V0IG9uZS5cbiAgICAgICAgaWYgKHJlYWN0aW9uRGF0YS5wYXJlbnRJRCkge1xuICAgICAgICAgICAgZGF0YS50YWcucGFyZW50X2lkID0gcmVhY3Rpb25EYXRhLnBhcmVudElEO1xuICAgICAgICB9XG4gICAgICAgIGdldEpTT05QKFVSTHMuY3JlYXRlUmVhY3Rpb25VcmwoKSwgZGF0YSwgcGx1c09uZVN1Y2Nlc3MocmVhY3Rpb25EYXRhLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgc3VjY2VzcyksIGVycm9yKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gcG9zdENvbW1lbnQoY29tbWVudCwgcmVhY3Rpb25EYXRhLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgc3VjY2VzcywgZXJyb3IpIHtcbiAgICAvLyBUT0RPOiByZWZhY3RvciB0aGUgcG9zdCBmdW5jdGlvbnMgdG8gZWxpbWluYXRlIGFsbCB0aGUgY29waWVkIGNvZGVcbiAgICBVc2VyLmZldGNoVXNlcihmdW5jdGlvbih1c2VySW5mbykge1xuICAgICAgICAvLyBUT0RPIGV4dHJhY3QgdGhlIHNoYXBlIG9mIHRoaXMgZGF0YSBhbmQgcG9zc2libHkgdGhlIHdob2xlIEFQSSBjYWxsXG4gICAgICAgIGlmICghcmVhY3Rpb25EYXRhLmNvbnRlbnQpIHtcbiAgICAgICAgICAgIC8vIFRoaXMgaXMgYSBzdW1tYXJ5IHJlYWN0aW9uLiBTZWUgaWYgd2UgaGF2ZSBhbnkgY29udGFpbmVyIGRhdGEgdGhhdCB3ZSBjYW4gbGluayB0byBpdC5cbiAgICAgICAgICAgIHZhciBjb250YWluZXJSZWFjdGlvbnMgPSBjb250YWluZXJEYXRhLnJlYWN0aW9ucztcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY29udGFpbmVyUmVhY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNvbnRhaW5lclJlYWN0aW9uID0gY29udGFpbmVyUmVhY3Rpb25zW2ldO1xuICAgICAgICAgICAgICAgIGlmIChjb250YWluZXJSZWFjdGlvbi5pZCA9PT0gcmVhY3Rpb25EYXRhLmlkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlYWN0aW9uRGF0YS5wYXJlbnRJRCA9IGNvbnRhaW5lclJlYWN0aW9uLnBhcmVudElEO1xuICAgICAgICAgICAgICAgICAgICByZWFjdGlvbkRhdGEuY29udGVudCA9IGNvbnRhaW5lclJlYWN0aW9uLmNvbnRlbnQ7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB2YXIgZGF0YSA9IHtcbiAgICAgICAgICAgIGNvbW1lbnQ6IGNvbW1lbnQsXG4gICAgICAgICAgICB0YWc6IHtcbiAgICAgICAgICAgICAgICBwYXJlbnRfaWQ6IHJlYWN0aW9uRGF0YS5wYXJlbnRJRFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHVzZXJfaWQ6IHVzZXJJbmZvLnVzZXJfaWQsXG4gICAgICAgICAgICBhbnRfdG9rZW46IHVzZXJJbmZvLmFudF90b2tlbixcbiAgICAgICAgICAgIHBhZ2VfaWQ6IHBhZ2VEYXRhLnBhZ2VJZCxcbiAgICAgICAgICAgIGdyb3VwX2lkOiBwYWdlRGF0YS5ncm91cElkXG4gICAgICAgIH07XG4gICAgICAgIGdldEpTT05QKFVSTHMuY3JlYXRlQ29tbWVudFVybCgpLCBkYXRhLCBjb21tZW50U3VjY2VzcyhyZWFjdGlvbkRhdGEsIGNvbnRhaW5lckRhdGEsIHBhZ2VEYXRhLCBzdWNjZXNzKSwgZXJyb3IpO1xuICAgIH0pO1xufVxuXG4vLyBUT0RPOiBXZSBuZWVkIHRvIHJldmlldyB0aGUgQVBJIHNvIHRoYXQgaXQgcmV0dXJucy9hY2NlcHRzIGEgdW5pZm9ybSBzZXQgb2YgdmFsdWVzLlxuZnVuY3Rpb24gY29udGVudE5vZGVEYXRhS2luZCh0eXBlKSB7XG4gICAgaWYgKHR5cGUgPT09ICdpbWFnZScpIHtcbiAgICAgICAgcmV0dXJuICdpbWcnO1xuICAgIH1cbiAgICByZXR1cm4gdHlwZTtcbn1cblxuZnVuY3Rpb24gY29tbWVudFN1Y2Nlc3MocmVhY3Rpb25EYXRhLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgY2FsbGJhY2spIHtcbiAgICByZXR1cm4gZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgLy8gVE9ETzogaW4gdGhlIGNhc2UgdGhhdCBzb21lb25lIHJlYWN0cyBhbmQgdGhlbiBpbW1lZGlhdGVseSBjb21tZW50cywgd2UgaGF2ZSBhIHJhY2UgY29uZGl0aW9uIHdoZXJlIHRoZVxuICAgICAgICAvLyAgICAgICBjb21tZW50IHJlc3BvbnNlIGNvdWxkIGNvbWUgYmFjayBiZWZvcmUgdGhlIHJlYWN0aW9uLiB3ZSBuZWVkIHRvOlxuICAgICAgICAvLyAgICAgICAxLiBNYWtlIHN1cmUgdGhlIHNlcnZlciBvbmx5IGNyZWF0ZXMgYSBzaW5nbGUgcmVhY3Rpb24gaW4gdGhpcyBjYXNlIChub3QgYSBIVUdFIGRlYWwgaWYgaXQgbWFrZXMgdHdvKVxuICAgICAgICAvLyAgICAgICAyLiBSZXNvbHZlIHRoZSB0d28gcmVzcG9uc2VzIHRoYXQgYm90aCB0aGVvcmV0aWNhbGx5IGNvbWUgYmFjayB3aXRoIHRoZSBzYW1lIHJlYWN0aW9uIGRhdGEgYXQgdGhlIHNhbWVcbiAgICAgICAgLy8gICAgICAgICAgdGltZS4gTWFrZSBzdXJlIHdlIGRvbid0IGVuZCB1cCB3aXRoIHR3byBjb3BpZXMgb2YgdGhlIHNhbWUgZGF0YSBpbiB0aGUgbW9kZWwuXG4gICAgICAgIHZhciByZWFjdGlvbkNyZWF0ZWQgPSAhcmVzcG9uc2UuZXhpc3Rpbmc7XG4gICAgICAgIGlmIChyZWFjdGlvbkNyZWF0ZWQpIHtcbiAgICAgICAgICAgIGlmICghcmVhY3Rpb25EYXRhLmNvbW1lbnRDb3VudCkge1xuICAgICAgICAgICAgICAgIHJlYWN0aW9uRGF0YS5jb21tZW50Q291bnQgPSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVhY3Rpb25EYXRhLmNvbW1lbnRDb3VudCArPSAxO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gVE9ETzogZG8gd2UgZXZlciBnZXQgYSByZXNwb25zZSB0byBhIG5ldyByZWFjdGlvbiB0ZWxsaW5nIHVzIHRoYXQgaXQncyBhbHJlYWR5IGV4aXN0aW5nPyBJZiBzbywgY291bGQgdGhlIGNvdW50IG5lZWQgdG8gYmUgdXBkYXRlZD9cbiAgICAgICAgfVxuICAgICAgICBjYWxsYmFjayhyZWFjdGlvbkNyZWF0ZWQpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gcGx1c09uZVN1Y2Nlc3MocmVhY3Rpb25EYXRhLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgY2FsbGJhY2spIHtcbiAgICByZXR1cm4gZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgLy8gVE9ETzogRG8gd2UgY2FyZSBhYm91dCByZXNwb25zZS5leGlzdGluZyBhbnltb3JlICh3ZSB1c2VkIHRvIHNob3cgZGlmZmVyZW50IGZlZWRiYWNrIGluIHRoZSBVSSwgYnV0IG5vIGxvbmdlci4uLilcbiAgICAgICAgdmFyIHJlYWN0aW9uQ3JlYXRlZCA9ICFyZXNwb25zZS5leGlzdGluZztcbiAgICAgICAgaWYgKHJlYWN0aW9uQ3JlYXRlZCkge1xuICAgICAgICAgICAgLy8gVE9ETzogd2Ugc2hvdWxkIGdldCBiYWNrIGEgcmVzcG9uc2Ugd2l0aCBkYXRhIGluIHRoZSBcIm5ldyBmb3JtYXRcIiBhbmQgdXBkYXRlIHRoZSBtb2RlbCBmcm9tIHRoZSByZXNwb25zZVxuICAgICAgICAgICAgcmVhY3Rpb25EYXRhLmNvdW50ID0gcmVhY3Rpb25EYXRhLmNvdW50ICsgMTtcbiAgICAgICAgICAgIGNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbCA9IGNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbCArIDE7XG4gICAgICAgICAgICBwYWdlRGF0YS5zdW1tYXJ5VG90YWwgPSBwYWdlRGF0YS5zdW1tYXJ5VG90YWwgKyAxO1xuICAgICAgICB9XG4gICAgICAgIGNhbGxiYWNrKHJlYWN0aW9uRGF0YSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBuZXdSZWFjdGlvblN1Y2Nlc3MoY29udGVudExvY2F0aW9uLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgY2FsbGJhY2spIHtcbiAgICByZXR1cm4gZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgLy8gVE9ETzogQ2FuIHJlc3BvbnNlLmV4aXN0aW5nIGV2ZXIgY29tZSBiYWNrIHRydWUgZm9yIGEgJ25ldycgcmVhY3Rpb24/IFNob3VsZCB3ZSBiZWhhdmUgYW55IGRpZmZlcmVudGx5IGlmIGl0IGRvZXM/XG4gICAgICAgIHZhciByZWFjdGlvbiA9IHJlYWN0aW9uRnJvbVJlc3BvbnNlKHJlc3BvbnNlLCBjb250ZW50TG9jYXRpb24pO1xuICAgICAgICBjYWxsYmFjayhyZWFjdGlvbik7XG4gICAgfTtcbn1cblxuZnVuY3Rpb24gcmVhY3Rpb25Gcm9tUmVzcG9uc2UocmVzcG9uc2UsIGNvbnRlbnRMb2NhdGlvbikge1xuICAgIC8vIFRPRE86IHRoZSBzZXJ2ZXIgc2hvdWxkIGdpdmUgdXMgYmFjayBhIHJlYWN0aW9uIG1hdGNoaW5nIHRoZSBuZXcgQVBJIGZvcm1hdC5cbiAgICAvLyAgICAgICB3ZSdyZSBqdXN0IGZha2luZyBpdCBvdXQgZm9yIG5vdzsgdGhpcyBjb2RlIGlzIHRlbXBvcmFyeVxuICAgIHZhciByZWFjdGlvbiA9IHtcbiAgICAgICAgdGV4dDogcmVzcG9uc2UuaW50ZXJhY3Rpb24uaW50ZXJhY3Rpb25fbm9kZS5ib2R5LFxuICAgICAgICBpZDogcmVzcG9uc2UuaW50ZXJhY3Rpb24uaW50ZXJhY3Rpb25fbm9kZS5pZCxcbiAgICAgICAgY291bnQ6IDEsXG4gICAgICAgIHBhcmVudElEOiByZXNwb25zZS5pbnRlcmFjdGlvbi5pZFxuICAgIH07XG4gICAgaWYgKHJlc3BvbnNlLmNvbnRlbnRfbm9kZSkge1xuICAgICAgICByZWFjdGlvbi5jb250ZW50ID0ge1xuICAgICAgICAgICAgaWQ6IHJlc3BvbnNlLmNvbnRlbnRfbm9kZS5pZCxcbiAgICAgICAgICAgIGtpbmQ6IHJlc3BvbnNlLmNvbnRlbnRfbm9kZS5raW5kLFxuICAgICAgICAgICAgYm9keTogcmVzcG9uc2UuY29udGVudF9ub2RlLmJvZHlcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKHJlc3BvbnNlLmNvbnRlbnRfbm9kZS5sb2NhdGlvbikge1xuICAgICAgICAgICAgcmVhY3Rpb24uY29udGVudC5sb2NhdGlvbiA9IHJlc3BvbnNlLmNvbnRlbnRfbm9kZS5sb2NhdGlvbjtcbiAgICAgICAgfSBlbHNlIGlmIChjb250ZW50TG9jYXRpb24pIHtcbiAgICAgICAgICAgIC8vIFRPRE86IGVuc3VyZSB0aGF0IHRoZSBBUEkgYWx3YXlzIHJldHVybnMgYSBsb2NhdGlvbiBhbmQgcmVtb3ZlIHRoZSBcImNvbnRlbnRMb2NhdGlvblwiIHRoYXQncyBiZWluZyBwYXNzZWQgYXJvdW5kLlxuICAgICAgICAgICAgLy8gRm9yIG5vdywganVzdCBwYXRjaCB0aGUgcmVzcG9uc2Ugd2l0aCB0aGUgZGF0YSB3ZSBrbm93IHdlIHNlbnQgb3Zlci5cbiAgICAgICAgICAgIHJlYWN0aW9uLmNvbnRlbnQubG9jYXRpb24gPSBjb250ZW50TG9jYXRpb247XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlYWN0aW9uO1xufVxuXG5mdW5jdGlvbiBnZXRDb21tZW50cyhyZWFjdGlvbiwgY2FsbGJhY2spIHtcbiAgICBVc2VyLmZldGNoVXNlcihmdW5jdGlvbih1c2VySW5mbykge1xuICAgICAgICB2YXIgZGF0YSA9IHtcbiAgICAgICAgICAgIHJlYWN0aW9uX2lkOiByZWFjdGlvbi5wYXJlbnRJRCxcbiAgICAgICAgICAgIHVzZXJfaWQ6IHVzZXJJbmZvLnVzZXJfaWQsXG4gICAgICAgICAgICBhbnRfdG9rZW46IHVzZXJJbmZvLmFudF90b2tlblxuICAgICAgICB9O1xuICAgICAgICBnZXRKU09OUChVUkxzLmZldGNoQ29tbWVudFVybCgpLCBkYXRhLCBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAgICAgY2FsbGJhY2soY29tbWVudHNGcm9tUmVzcG9uc2UocmVzcG9uc2UpKTtcbiAgICAgICAgfSwgZnVuY3Rpb24obWVzc2FnZSkge1xuICAgICAgICAgICAgLy8gVE9ETzogZXJyb3IgaGFuZGxpbmdcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdBbiBlcnJvciBvY2N1cnJlZCBmZXRjaGluZyBjb21tZW50czogJyArIG1lc3NhZ2UpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gZmV0Y2hMb2NhdGlvbkRldGFpbHMocmVhY3Rpb25Mb2NhdGlvbkRhdGEsIHBhZ2VEYXRhLCBjYWxsYmFjaykge1xuICAgIHZhciBjb250ZW50SURzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMocmVhY3Rpb25Mb2NhdGlvbkRhdGEpO1xuICAgIFVzZXIuZmV0Y2hVc2VyKGZ1bmN0aW9uKHVzZXJJbmZvKSB7XG4gICAgICAgIHZhciBkYXRhID0ge1xuICAgICAgICAgICAgdXNlcl9pZDogdXNlckluZm8udXNlcl9pZCxcbiAgICAgICAgICAgIGFudF90b2tlbjogdXNlckluZm8uYW50X3Rva2VuLFxuICAgICAgICAgICAgY29udGVudF9pZHM6IGNvbnRlbnRJRHNcbiAgICAgICAgfTtcbiAgICAgICAgZ2V0SlNPTlAoVVJMcy5mZXRjaENvbnRlbnRCb2RpZXNVcmwoKSwgZGF0YSwgZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKHJlc3BvbnNlKTtcbiAgICAgICAgfSwgZnVuY3Rpb24obWVzc2FnZSkge1xuICAgICAgICAgICAgLy8gVE9ETzogZXJyb3IgaGFuZGxpbmdcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdBbiBlcnJvciBvY2N1cnJlZCBmZXRjaGluZyBjb250ZW50IGJvZGllczogJyArIG1lc3NhZ2UpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gY29tbWVudHNGcm9tUmVzcG9uc2UoanNvbkNvbW1lbnRzKSB7XG4gICAgdmFyIGNvbW1lbnRzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBqc29uQ29tbWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGpzb25Db21tZW50ID0ganNvbkNvbW1lbnRzW2ldO1xuICAgICAgICB2YXIgY29tbWVudCA9IHtcbiAgICAgICAgICAgIHRleHQ6IGpzb25Db21tZW50LnRleHQsXG4gICAgICAgICAgICBpZDoganNvbkNvbW1lbnQuaWQsIC8vIFRPRE86IHdlIHByb2JhYmx5IG9ubHkgbmVlZCB0aGlzIGZvciArMSdpbmcgY29tbWVudHNcbiAgICAgICAgICAgIGNvbnRlbnRJRDoganNvbkNvbW1lbnQuY29udGVudElELCAvLyBUT0RPOiBEbyB3ZSByZWFsbHkgbmVlZCB0aGlzP1xuICAgICAgICAgICAgdXNlcjogVXNlci5mcm9tQ29tbWVudEpTT04oanNvbkNvbW1lbnQudXNlciwganNvbkNvbW1lbnQuc29jaWFsX3VzZXIpXG4gICAgICAgIH07XG4gICAgICAgIGNvbW1lbnRzLnB1c2goY29tbWVudCk7XG4gICAgfVxuICAgIHJldHVybiBjb21tZW50cztcbn1cblxuZnVuY3Rpb24gcG9zdFNoYXJlUmVhY3Rpb24ocmVhY3Rpb25EYXRhLCBjb250YWluZXJEYXRhLCBwYWdlRGF0YSwgc3VjY2VzcywgZmFpbHVyZSkge1xuICAgIFVzZXIuZmV0Y2hVc2VyKGZ1bmN0aW9uKHVzZXJJbmZvKSB7XG4gICAgICAgIHZhciBjb250ZW50RGF0YSA9IHJlYWN0aW9uRGF0YS5jb250ZW50O1xuICAgICAgICB2YXIgZGF0YSA9IHtcbiAgICAgICAgICAgIHRhZzogeyAvLyBUT0RPOiB3aHkgZG9lcyB0aGUgU2hhcmVIYW5kbGVyIGNyZWF0ZSBhIHJlYWN0aW9uIGlmIGl0IGRvZXNuJ3QgZXhpc3Q/IEhvdyBjYW4geW91IHNoYXJlIGEgcmVhY3Rpb24gdGhhdCBoYXNuJ3QgaGFwcGVuZWQ/XG4gICAgICAgICAgICAgICAgaWQ6IHJlYWN0aW9uRGF0YS5pZCxcbiAgICAgICAgICAgICAgICBib2R5OiByZWFjdGlvbkRhdGEudGV4dFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGhhc2g6IGNvbnRhaW5lckRhdGEuaGFzaCxcbiAgICAgICAgICAgIGNvbnRhaW5lcl9raW5kOiBjb250YWluZXJEYXRhLnR5cGUsXG4gICAgICAgICAgICBjb250ZW50X25vZGVfZGF0YTogeyAvLyBUT0RPOiB3aHkgZG9lcyB0aGUgU2hhcmVIYW5kbGVyIGNyZWF0ZSBhIGNvbnRlbnQgaWYgaXQgZG9lc24ndCBleGlzdD8gSG93IGNhbiB5b3Ugc2hhcmUgYSByZWFjdGlvbiB0aGF0IGhhc24ndCBoYXBwZW5lZD9cbiAgICAgICAgICAgICAgICBpZDogY29udGVudERhdGEuaWQsXG4gICAgICAgICAgICAgICAgYm9keTogY29udGVudERhdGEudGV4dCxcbiAgICAgICAgICAgICAgICBsb2NhdGlvbjogY29udGVudERhdGEubG9jYXRpb24sXG4gICAgICAgICAgICAgICAga2luZDogY29udGVudE5vZGVEYXRhS2luZChjb250YWluZXJEYXRhLnR5cGUpXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdXNlcl9pZDogdXNlckluZm8udXNlcl9pZCxcbiAgICAgICAgICAgIGFudF90b2tlbjogdXNlckluZm8uYW50X3Rva2VuLFxuICAgICAgICAgICAgZ3JvdXBfaWQ6IHBhZ2VEYXRhLmdyb3VwSWQsXG4gICAgICAgICAgICBwYWdlX2lkOiBwYWdlRGF0YS5wYWdlSWQsXG4gICAgICAgICAgICByZWZlcnJpbmdfaW50X2lkOiByZWFjdGlvbkRhdGEucGFyZW50SURcbiAgICAgICAgfTtcbiAgICAgICAgZ2V0SlNPTlAoVVJMcy5zaGFyZVJlYWN0aW9uVXJsKCksIGRhdGEsIHN1Y2Nlc3MsIGZhaWx1cmUpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBnZXRKU09OUCh1cmwsIGRhdGEsIHN1Y2Nlc3MsIGVycm9yKSB7XG4gICAgdmFyIGJhc2VVcmwgPSBVUkxzLmFwcFNlcnZlclVybCgpO1xuICAgIGRvR2V0SlNPTlAoYmFzZVVybCwgdXJsLCBkYXRhLCBzdWNjZXNzLCBlcnJvcik7XG59XG5cbmZ1bmN0aW9uIHBvc3RFdmVudChldmVudCkge1xuICAgIHZhciBiYXNlVXJsID0gVVJMcy5ldmVudHNTZXJ2ZXJVcmwoKTtcbiAgICBpZiAoQXBwTW9kZS5kZWJ1Zykge1xuICAgICAgICBjb25zb2xlLmxvZygnQU5URU5OQSBQb3N0aW5nIGV2ZW50OiAnICsgSlNPTi5zdHJpbmdpZnkoZXZlbnQpKTtcbiAgICB9XG4gICAgZG9HZXRKU09OUChiYXNlVXJsLCBVUkxzLmV2ZW50VXJsKCksIGV2ZW50LCBmdW5jdGlvbigpIHsgLypzdWNjZXNzKi8gfSwgZnVuY3Rpb24oZXJyb3IpIHtcbiAgICAgICAgLy8gVE9ETzogZXJyb3IgaGFuZGxpbmdcbiAgICAgICAgY29uc29sZS5sb2coJ0FuIGVycm9yIG9jY3VycmVkIHBvc3RpbmcgZXZlbnQ6ICcsIGVycm9yKTtcbiAgICB9KTtcbn1cblxuLy8gSXNzdWVzIGEgSlNPTlAgcmVxdWVzdCB0byBhIGdpdmVuIHNlcnZlci4gVG8gc2VuZCBhIHJlcXVlc3QgdG8gdGhlIGFwcGxpY2F0aW9uIHNlcnZlciwgdXNlIGdldEpTT05QIGluc3RlYWQuXG5mdW5jdGlvbiBkb0dldEpTT05QKGJhc2VVcmwsIHVybCwgZGF0YSwgc3VjY2VzcywgZXJyb3IpIHtcbiAgICB2YXIgb3B0aW9ucyA9IHtcbiAgICAgICAgdXJsOiBiYXNlVXJsICsgdXJsLFxuICAgICAgICB0eXBlOiBcImdldFwiLFxuICAgICAgICBjb250ZW50VHlwZTogXCJhcHBsaWNhdGlvbi9qc29uXCIsXG4gICAgICAgIGRhdGFUeXBlOiBcImpzb25wXCIsXG4gICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uKHJlc3BvbnNlLCB0ZXh0U3RhdHVzLCBYSFIpIHtcbiAgICAgICAgICAgIC8vIFRPRE86IFJldmlzaXQgd2hldGhlciBpdCdzIHJlYWxseSBjb29sIHRvIGtleSB0aGlzIG9uIHRoZSB0ZXh0U3RhdHVzIG9yIGlmIHdlIHNob3VsZCBiZSBsb29raW5nIGF0XG4gICAgICAgICAgICAvLyAgICAgICB0aGUgc3RhdHVzIGNvZGUgaW4gdGhlIFhIUlxuICAgICAgICAgICAgLy8gTm90ZTogVGhlIHNlcnZlciBjb21lcyBiYWNrIHdpdGggMjAwIHJlc3BvbnNlcyB3aXRoIGEgbmVzdGVkIHN0YXR1cyBvZiBcImZhaWxcIi4uLlxuICAgICAgICAgICAgaWYgKHRleHRTdGF0dXMgPT09ICdzdWNjZXNzJyAmJiByZXNwb25zZS5zdGF0dXMgIT09ICdmYWlsJyAmJiAoIXJlc3BvbnNlLmRhdGEgfHwgcmVzcG9uc2UuZGF0YS5zdGF0dXMgIT09ICdmYWlsJykpIHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBGb3IgSlNPTlAgcmVxdWVzdHMsIGpRdWVyeSBkb2Vzbid0IGNhbGwgaXQncyBlcnJvciBjYWxsYmFjay4gSXQgY2FsbHMgc3VjY2VzcyBpbnN0ZWFkLlxuICAgICAgICAgICAgICAgIGVycm9yKHJlc3BvbnNlLm1lc3NhZ2UgfHwgcmVzcG9uc2UuZGF0YS5tZXNzYWdlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgZXJyb3I6IGZ1bmN0aW9uKHhociwgdGV4dFN0YXR1cywgbWVzc2FnZSkge1xuICAgICAgICAgICAgLy8gT2theSwgYXBwYXJlbnRseSBqUXVlcnkgKmRvZXMqIGNhbGwgaXRzIGVycm9yIGNhbGxiYWNrIGZvciBKU09OUCByZXF1ZXN0cyBzb21ldGltZXMuLi5cbiAgICAgICAgICAgIC8vIFNwZWNpZmljYWxseSwgd2hlbiB0aGUgcmVzcG9uc2Ugc3RhdHVzIGlzIE9LIGJ1dCBhbiBlcnJvciBvY2N1cnMgY2xpZW50LXNpZGUgcHJvY2Vzc2luZyB0aGUgcmVzcG9uc2UuXG4gICAgICAgICAgICBlcnJvciAobWVzc2FnZSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIGlmIChkYXRhKSB7XG4gICAgICAgIG9wdGlvbnMuZGF0YSA9IHsganNvbjogSlNPTi5zdHJpbmdpZnkoZGF0YSkgfTtcbiAgICB9XG4gICAgJC5hamF4KG9wdGlvbnMpO1xufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgZ2V0SlNPTlA6IGdldEpTT05QLFxuICAgIHBvc3RQbHVzT25lOiBwb3N0UGx1c09uZSxcbiAgICBwb3N0TmV3UmVhY3Rpb246IHBvc3ROZXdSZWFjdGlvbixcbiAgICBwb3N0Q29tbWVudDogcG9zdENvbW1lbnQsXG4gICAgZ2V0Q29tbWVudHM6IGdldENvbW1lbnRzLFxuICAgIHBvc3RTaGFyZVJlYWN0aW9uOiBwb3N0U2hhcmVSZWFjdGlvbixcbiAgICBmZXRjaExvY2F0aW9uRGV0YWlsczogZmV0Y2hMb2NhdGlvbkRldGFpbHMsXG4gICAgcG9zdEV2ZW50OiBwb3N0RXZlbnRcbn07IiwidmFyIFVSTENvbnN0YW50cyA9IHJlcXVpcmUoJy4vdXJsLWNvbnN0YW50cycpO1xuXG5mdW5jdGlvbiBjb21wdXRlQ3VycmVudFNjcmlwdFNyYygpIHtcbiAgICBpZiAoZG9jdW1lbnQuY3VycmVudFNjcmlwdCkge1xuICAgICAgICByZXR1cm4gZG9jdW1lbnQuY3VycmVudFNjcmlwdC5zcmM7XG4gICAgfVxuICAgIC8vIElFIGZhbGxiYWNrLi4uXG4gICAgdmFyIHNjcmlwdHMgPSBkb2N1bWVudC5ib2R5LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdzY3JpcHQnKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNjcmlwdHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIHNjcmlwdCA9IHNjcmlwdHNbaV07XG4gICAgICAgIGlmIChzY3JpcHQuaGFzQXR0cmlidXRlKCdzcmMnKSkge1xuICAgICAgICAgICAgdmFyIHNjcmlwdFNyYyA9IHNjcmlwdC5nZXRBdHRyaWJ1dGUoJ3NyYycpO1xuICAgICAgICAgICAgLy8gVE9ETzogdXNlIGEgcmVnZXhwIGhlcmVcbiAgICAgICAgICAgIGlmIChzY3JpcHRTcmMuaW5kZXhPZignL2FudGVubmEuanMnKSAhPT0gLTEgfHwgc2NyaXB0U3JjLmluZGV4T2YoJy9lbmdhZ2UuanMnKSAhPSAtMSB8fCBzY3JpcHRTcmMuaW5kZXhPZignL2VuZ2FnZV9mdWxsLmpzJykgIT0gLTEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2NyaXB0U3JjO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuXG52YXIgY3VycmVudFNjcmlwdFNyYyA9IGNvbXB1dGVDdXJyZW50U2NyaXB0U3JjKCkgfHwgJyc7XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBvZmZsaW5lOiBjdXJyZW50U2NyaXB0U3JjLmluZGV4T2YoVVJMQ29uc3RhbnRzLkRFVkVMT1BNRU5UKSAhPT0gLTEgfHwgY3VycmVudFNjcmlwdFNyYy5pbmRleE9mKFVSTENvbnN0YW50cy5URVNUKSAhPT0gLTEsXG4gICAgdGVzdDogY3VycmVudFNjcmlwdFNyYy5pbmRleE9mKFVSTENvbnN0YW50cy5URVNUKSAhPT0gLTEsXG4gICAgZGVidWc6IGN1cnJlbnRTY3JpcHRTcmMuaW5kZXhPZignP2RlYnVnJykgIT09IC0xXG59OyIsIlxudmFyIGlzVG91Y2hCcm93c2VyO1xudmFyIGlzTW9iaWxlRGV2aWNlO1xuXG5mdW5jdGlvbiBzdXBwb3J0c1RvdWNoKCkge1xuICAgIGlmIChpc1RvdWNoQnJvd3NlciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGlzVG91Y2hCcm93c2VyID0gKG5hdmlnYXRvci5tc01heFRvdWNoUG9pbnRzIHx8IFwib250b3VjaHN0YXJ0XCIgaW4gd2luZG93KSAmJiAoKHdpbmRvdy5tYXRjaE1lZGlhKFwib25seSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KVwiKSkubWF0Y2hlcyk7XG4gICAgfVxuICAgIHJldHVybiBpc1RvdWNoQnJvd3Nlcjtcbn1cblxuZnVuY3Rpb24gaXNNb2JpbGUoKSB7XG4gICAgaWYgKGlzTW9iaWxlRGV2aWNlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgaXNNb2JpbGVEZXZpY2UgPSBzdXBwb3J0c1RvdWNoKCkgJiYgKCh3aW5kb3cubWF0Y2hNZWRpYShcIm9ubHkgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA0ODBweClcIikpLm1hdGNoZXMpO1xuICAgIH1cbiAgICByZXR1cm4gaXNNb2JpbGVEZXZpY2U7XG59XG5cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgc3VwcG9ydHNUb3VjaDogc3VwcG9ydHNUb3VjaCxcbiAgICBpc01vYmlsZTogaXNNb2JpbGVcbn07IiwiXG4vLyBSZS11c2FibGUgc3VwcG9ydCBmb3IgbWFuYWdpbmcgYSBjb2xsZWN0aW9uIG9mIGNhbGxiYWNrIGZ1bmN0aW9ucy5cblxudmFyIGFudHVpZCA9IDA7IC8vIFwiZ2xvYmFsbHlcIiB1bmlxdWUgSUQgdGhhdCB3ZSB1c2UgdG8gdGFnIGNhbGxiYWNrIGZ1bmN0aW9ucyBmb3IgbGF0ZXIgcmV0cmlldmFsLiAoVGhpcyBpcyBob3cgXCJvZmZcIiB3b3Jrcy4pXG5cbmZ1bmN0aW9uIGNyZWF0ZUNhbGxiYWNrcygpIHtcblxuICAgIHZhciBjYWxsYmFja3MgPSB7fTtcblxuICAgIGZ1bmN0aW9uIGFkZENhbGxiYWNrKGNhbGxiYWNrKSB7XG4gICAgICAgIGlmIChjYWxsYmFjay5hbnR1aWQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY2FsbGJhY2suYW50dWlkID0gYW50dWlkKys7XG4gICAgICAgIH1cbiAgICAgICAgY2FsbGJhY2tzW2NhbGxiYWNrLmFudHVpZF0gPSBjYWxsYmFjaztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByZW1vdmVDYWxsYmFjayhjYWxsYmFjaykge1xuICAgICAgICBpZiAoY2FsbGJhY2suYW50dWlkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGRlbGV0ZSBjYWxsYmFja3NbY2FsbGJhY2suYW50dWlkXTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldENhbGxiYWNrcygpIHtcbiAgICAgICAgdmFyIGFsbENhbGxiYWNrcyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBrZXkgaW4gY2FsbGJhY2tzKSB7XG4gICAgICAgICAgICBpZiAoY2FsbGJhY2tzLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgICBhbGxDYWxsYmFja3MucHVzaChjYWxsYmFja3Nba2V5XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGFsbENhbGxiYWNrcztcbiAgICB9XG5cbiAgICAvLyBDb252ZW5pZW5jZSBmdW5jdGlvbiB0aGF0IGludm9rZXMgYWxsIGNhbGxiYWNrcyB3aXRoIG5vIHBhcmFtZXRlcnMuIEFueSBjYWxsYmFja3MgdGhhdCBuZWVkIHBhcmFtcyBjYW4gYmUgY2FsbGVkXG4gICAgLy8gYnkgY2xpZW50cyB1c2luZyBnZXRDYWxsYmFja3MoKVxuICAgIGZ1bmN0aW9uIGludm9rZUFsbCgpIHtcbiAgICAgICAgdmFyIGNhbGxiYWNrcyA9IGdldENhbGxiYWNrcygpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNhbGxiYWNrcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY2FsbGJhY2tzW2ldKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpc0VtcHR5KCkge1xuICAgICAgICByZXR1cm4gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMoY2FsbGJhY2tzKS5sZW5ndGggPT09IDA7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdGVhcmRvd24oKSB7XG4gICAgICAgIGNhbGxiYWNrcyA9IHt9O1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIGFkZDogYWRkQ2FsbGJhY2ssXG4gICAgICAgIHJlbW92ZTogcmVtb3ZlQ2FsbGJhY2ssXG4gICAgICAgIGdldDogZ2V0Q2FsbGJhY2tzLFxuICAgICAgICBpc0VtcHR5OiBpc0VtcHR5LFxuICAgICAgICBpbnZva2VBbGw6IGludm9rZUFsbCxcbiAgICAgICAgdGVhcmRvd246IHRlYXJkb3duXG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlOiBjcmVhdGVDYWxsYmFja3Ncbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgTUQ1ID0gcmVxdWlyZSgnLi9tZDUnKTtcblxuLy8gVE9ETzogVGhpcyBpcyBqdXN0IGNvcHkvcGFzdGVkIGZyb20gZW5nYWdlX2Z1bGxcbi8vIFRPRE86IFRoZSBjb2RlIGlzIGxvb2tpbmcgZm9yIC5hbnRfaW5kaWNhdG9yIHRvIHNlZSBpZiBpdCdzIGFscmVhZHkgYmVlbiBoYXNoZWQuIFJldmlldy5cbi8vIFRPRE86IENhbiB3ZSBpbXBsZW1lbnQgYSBzaW1wbGVyIHZlcnNpb24gb2YgdGhpcyBmb3Igbm9uLWxlZ2FjeSBjb2RlIHVzaW5nICRlbGVtZW50LnRleHQoKT9cbmZ1bmN0aW9uIGdldENsZWFuVGV4dCgkZG9tTm9kZSkge1xuICAgIC8vIEFOVC51dGlsLmdldENsZWFuVGV4dFxuICAgIC8vIGNvbW1vbiBmdW5jdGlvbiBmb3IgY2xlYW5pbmcgdGhlIHRleHQgbm9kZSB0ZXh0LiAgcmlnaHQgbm93LCBpdCdzIHJlbW92aW5nIHNwYWNlcywgdGFicywgbmV3bGluZXMsIGFuZCB0aGVuIGRvdWJsZSBzcGFjZXNcblxuICAgIHZhciAkbm9kZSA9ICRkb21Ob2RlLmNsb25lKCk7XG5cbiAgICAkbm9kZS5maW5kKCcuYW50LCAuYW50LWN1c3RvbS1jdGEtY29udGFpbmVyJykucmVtb3ZlKCk7XG5cbiAgICAvL21ha2Ugc3VyZSBpdCBkb2VzbnQgYWxyZWR5IGhhdmUgaW4gaW5kaWNhdG9yIC0gaXQgc2hvdWxkbid0LlxuICAgIHZhciAkaW5kaWNhdG9yID0gJG5vZGUuZmluZCgnLmFudF9pbmRpY2F0b3InKTtcbiAgICBpZigkaW5kaWNhdG9yLmxlbmd0aCl7XG4gICAgICAgIC8vdG9kbzogc2VuZCB1cyBhbiBlcnJvciByZXBvcnQgLSB0aGlzIG1heSBzdGlsbCBiZSBoYXBwZW5pbmcgZm9yIHNsaWRlc2hvd3MuXG4gICAgICAgIC8vVGhpcyBmaXggd29ya3MgZmluZSwgYnV0IHdlIHNob3VsZCBmaXggdGhlIGNvZGUgdG8gaGFuZGxlIGl0IGJlZm9yZSBoZXJlLlxuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gZ2V0IHRoZSBub2RlJ3MgdGV4dCBhbmQgc21hc2ggY2FzZVxuICAgIC8vIFRPRE86IDxicj4gdGFncyBhbmQgYmxvY2stbGV2ZWwgdGFncyBjYW4gc2NyZXcgdXAgd29yZHMuICBleDpcbiAgICAvLyBoZWxsbzxicj5ob3cgYXJlIHlvdT8gICBoZXJlIGJlY29tZXNcbiAgICAvLyBoZWxsb2hvdyBhcmUgeW91PyAgICA8LS0gbm8gc3BhY2Ugd2hlcmUgdGhlIDxicj4gd2FzLiAgYmFkLlxuICAgIHZhciBub2RlX3RleHQgPSAkLnRyaW0oICRub2RlLmh0bWwoKS5yZXBsYWNlKC88ICpiciAqXFwvPz4vZ2ksICcgJykgKTtcbiAgICB2YXIgYm9keSA9ICQudHJpbSggJCggXCI8ZGl2PlwiICsgbm9kZV90ZXh0ICsgXCI8L2Rpdj5cIiApLnRleHQoKS50b0xvd2VyQ2FzZSgpICk7XG5cbiAgICBpZiggYm9keSAmJiB0eXBlb2YgYm9keSA9PSBcInN0cmluZ1wiICYmIGJvZHkgIT09IFwiXCIgKSB7XG4gICAgICAgIHZhciBmaXJzdHBhc3MgPSBib2R5LnJlcGxhY2UoL1tcXG5cXHJcXHRdKy9naSwnICcpLnJlcGxhY2UoKS5yZXBsYWNlKC9cXHN7Mix9L2csJyAnKTtcbiAgICAgICAgLy8gc2VlaW5nIGlmIHRoaXMgaGVscHMgdGhlIHByb3B1YiBpc3N1ZSAtIHRvIHRyaW0gYWdhaW4uICBXaGVuIGkgcnVuIHRoaXMgbGluZSBhYm92ZSBpdCBsb29rcyBsaWtlIHRoZXJlIGlzIHN0aWxsIHdoaXRlIHNwYWNlLlxuICAgICAgICByZXR1cm4gJC50cmltKGZpcnN0cGFzcyk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBoYXNoVGV4dChlbGVtZW50LCBzdWZmaXgpIHtcbiAgICB2YXIgdGV4dCA9IGdldENsZWFuVGV4dChlbGVtZW50KTtcbiAgICBpZiAodGV4dCkge1xuICAgICAgICB2YXIgaGFzaFRleHQgPSBcInJkci10ZXh0LVwiICsgdGV4dDtcbiAgICAgICAgaWYgKHN1ZmZpeCAhPT0gdW5kZWZpbmVkKSB7IC8vIEFwcGVuZCB0aGUgb3B0aW9uYWwgc3VmZml4XG4gICAgICAgICAgICBoYXNoVGV4dCArPSAnLScgKyBzdWZmaXg7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIE1ENS5oZXhfbWQ1KGhhc2hUZXh0KTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGhhc2hVcmwodXJsKSB7XG4gICAgcmV0dXJuIE1ENS5oZXhfbWQ1KHVybCk7XG59XG5cbmZ1bmN0aW9uIGhhc2hJbWFnZShpbWFnZVVybCkge1xuICAgIGlmIChpbWFnZVVybCAmJiBpbWFnZVVybC5sZW5ndGggPiAwKSB7XG4gICAgICAgIHZhciBoYXNoVGV4dCA9ICdyZHItaW1nLScgKyBpbWFnZVVybDtcbiAgICAgICAgcmV0dXJuIE1ENS5oZXhfbWQ1KGhhc2hUZXh0KTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGhhc2hNZWRpYShtZWRpYVVybCkge1xuICAgIGlmIChtZWRpYVVybCAmJiBtZWRpYVVybC5sZW5ndGggPiAwKSB7XG4gICAgICAgIHZhciBoYXNoVGV4dCA9ICdyZHItbWVkaWEtJyArIG1lZGlhVXJsO1xuICAgICAgICByZXR1cm4gTUQ1LmhleF9tZDUoaGFzaFRleHQpO1xuICAgIH1cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGhhc2hUZXh0OiBoYXNoVGV4dCxcbiAgICBoYXNoSW1hZ2U6IGhhc2hJbWFnZSxcbiAgICBoYXNoTWVkaWE6IGhhc2hNZWRpYSxcbiAgICBoYXNoVXJsOiBoYXNoVXJsXG59OyIsIlxudmFyIGxvYWRlZGpRdWVyeTtcbnZhciBjYWxsYmFja3MgPSBbXTtcblxuLy8gTm90aWZpZXMgdGhlIGpRdWVyeSBwcm92aWRlciB0aGF0IHdlJ3ZlIGxvYWRlZCB0aGUgalF1ZXJ5IGxpYnJhcnkuXG5mdW5jdGlvbiBsb2FkZWQoKSB7XG4gICAgbG9hZGVkalF1ZXJ5ID0galF1ZXJ5Lm5vQ29uZmxpY3QoKTtcbiAgICBub3RpZnlDYWxsYmFja3MoKTtcbn1cblxuZnVuY3Rpb24gbm90aWZ5Q2FsbGJhY2tzKCkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2FsbGJhY2tzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNhbGxiYWNrc1tpXShsb2FkZWRqUXVlcnkpO1xuICAgIH1cbiAgICBjYWxsYmFja3MgPSBbXTtcbn1cblxuLy8gUmVnaXN0ZXJzIHRoZSBnaXZlbiBjYWxsYmFjayB0byBiZSBub3RpZmllZCB3aGVuIG91ciB2ZXJzaW9uIG9mIGpRdWVyeSBpcyBsb2FkZWQuXG5mdW5jdGlvbiBvbkxvYWQoY2FsbGJhY2spIHtcbiAgICBpZiAobG9hZGVkalF1ZXJ5KSB7XG4gICAgICAgIGNhbGxiYWNrKGxvYWRlZGpRdWVyeSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgY2FsbGJhY2tzLnB1c2goY2FsbGJhY2spO1xuICAgIH1cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGxvYWRlZDogbG9hZGVkLFxuICAgIG9uTG9hZDogb25Mb2FkXG59OyIsIi8qXG4gKiBBIEphdmFTY3JpcHQgaW1wbGVtZW50YXRpb24gb2YgdGhlIFJTQSBEYXRhIFNlY3VyaXR5LCBJbmMuIE1ENSBNZXNzYWdlXG4gKiBEaWdlc3QgQWxnb3JpdGhtLCBhcyBkZWZpbmVkIGluIFJGQyAxMzIxLlxuICogVmVyc2lvbiAyLjEgQ29weXJpZ2h0IChDKSBQYXVsIEpvaG5zdG9uIDE5OTkgLSAyMDAyLlxuICogT3RoZXIgY29udHJpYnV0b3JzOiBHcmVnIEhvbHQsIEFuZHJldyBLZXBlcnQsIFlkbmFyLCBMb3N0aW5ldFxuICogRGlzdHJpYnV0ZWQgdW5kZXIgdGhlIEJTRCBMaWNlbnNlXG4gKiBTZWUgaHR0cDovL3BhamhvbWUub3JnLnVrL2NyeXB0L21kNSBmb3IgbW9yZSBpbmZvLlxuICovXG5cbnZhciBoZXhjYXNlID0gMDtcbnZhciBiNjRwYWQgID0gXCJcIjtcbnZhciBjaHJzeiA9IDg7XG5cbmZ1bmN0aW9uIGhleF9tZDUocykge1xuICAgIHJldHVybiBiaW5sMmhleChjb3JlX21kNShzdHIyYmlubChzKSwgcy5sZW5ndGggKiBjaHJzeikpO1xufVxuXG5mdW5jdGlvbiBjb3JlX21kNSh4LCBsZW4pIHtcbiAgICB4W2xlbiA+PiA1XSB8PSAweDgwIDw8ICgobGVuKSAlIDMyKTtcbiAgICB4WygoKGxlbiArIDY0KSA+Pj4gOSkgPDwgNCkgKyAxNF0gPSBsZW47XG4gICAgdmFyIGEgPSAxNzMyNTg0MTkzO1xuICAgIHZhciBiID0gLTI3MTczMzg3OTtcbiAgICB2YXIgYyA9IC0xNzMyNTg0MTk0O1xuICAgIHZhciBkID0gMjcxNzMzODc4O1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgeC5sZW5ndGg7IGkgKz0gMTYpIHtcbiAgICAgICAgdmFyIG9sZGEgPSBhO1xuICAgICAgICB2YXIgb2xkYiA9IGI7XG4gICAgICAgIHZhciBvbGRjID0gYztcbiAgICAgICAgdmFyIG9sZGQgPSBkO1xuXG4gICAgICAgIGEgPSBtZDVfZmYoYSwgYiwgYywgZCwgeFtpICsgMF0sIDcsIC02ODA4NzY5MzYpO1xuICAgICAgICBkID0gbWQ1X2ZmKGQsIGEsIGIsIGMsIHhbaSArIDFdLCAxMiwgLTM4OTU2NDU4Nik7XG4gICAgICAgIGMgPSBtZDVfZmYoYywgZCwgYSwgYiwgeFtpICsgMl0sIDE3LCA2MDYxMDU4MTkpO1xuICAgICAgICBiID0gbWQ1X2ZmKGIsIGMsIGQsIGEsIHhbaSArIDNdLCAyMiwgLTEwNDQ1MjUzMzApO1xuICAgICAgICBhID0gbWQ1X2ZmKGEsIGIsIGMsIGQsIHhbaSArIDRdLCA3LCAtMTc2NDE4ODk3KTtcbiAgICAgICAgZCA9IG1kNV9mZihkLCBhLCBiLCBjLCB4W2kgKyA1XSwgMTIsIDEyMDAwODA0MjYpO1xuICAgICAgICBjID0gbWQ1X2ZmKGMsIGQsIGEsIGIsIHhbaSArIDZdLCAxNywgLTE0NzMyMzEzNDEpO1xuICAgICAgICBiID0gbWQ1X2ZmKGIsIGMsIGQsIGEsIHhbaSArIDddLCAyMiwgLTQ1NzA1OTgzKTtcbiAgICAgICAgYSA9IG1kNV9mZihhLCBiLCBjLCBkLCB4W2kgKyA4XSwgNywgMTc3MDAzNTQxNik7XG4gICAgICAgIGQgPSBtZDVfZmYoZCwgYSwgYiwgYywgeFtpICsgOV0sIDEyLCAtMTk1ODQxNDQxNyk7XG4gICAgICAgIGMgPSBtZDVfZmYoYywgZCwgYSwgYiwgeFtpICsgMTBdLCAxNywgLTQyMDYzKTtcbiAgICAgICAgYiA9IG1kNV9mZihiLCBjLCBkLCBhLCB4W2kgKyAxMV0sIDIyLCAtMTk5MDQwNDE2Mik7XG4gICAgICAgIGEgPSBtZDVfZmYoYSwgYiwgYywgZCwgeFtpICsgMTJdLCA3LCAxODA0NjAzNjgyKTtcbiAgICAgICAgZCA9IG1kNV9mZihkLCBhLCBiLCBjLCB4W2kgKyAxM10sIDEyLCAtNDAzNDExMDEpO1xuICAgICAgICBjID0gbWQ1X2ZmKGMsIGQsIGEsIGIsIHhbaSArIDE0XSwgMTcsIC0xNTAyMDAyMjkwKTtcbiAgICAgICAgYiA9IG1kNV9mZihiLCBjLCBkLCBhLCB4W2kgKyAxNV0sIDIyLCAxMjM2NTM1MzI5KTtcblxuICAgICAgICBhID0gbWQ1X2dnKGEsIGIsIGMsIGQsIHhbaSArIDFdLCA1LCAtMTY1Nzk2NTEwKTtcbiAgICAgICAgZCA9IG1kNV9nZyhkLCBhLCBiLCBjLCB4W2kgKyA2XSwgOSwgLTEwNjk1MDE2MzIpO1xuICAgICAgICBjID0gbWQ1X2dnKGMsIGQsIGEsIGIsIHhbaSArIDExXSwgMTQsIDY0MzcxNzcxMyk7XG4gICAgICAgIGIgPSBtZDVfZ2coYiwgYywgZCwgYSwgeFtpICsgMF0sIDIwLCAtMzczODk3MzAyKTtcbiAgICAgICAgYSA9IG1kNV9nZyhhLCBiLCBjLCBkLCB4W2kgKyA1XSwgNSwgLTcwMTU1ODY5MSk7XG4gICAgICAgIGQgPSBtZDVfZ2coZCwgYSwgYiwgYywgeFtpICsgMTBdLCA5LCAzODAxNjA4Myk7XG4gICAgICAgIGMgPSBtZDVfZ2coYywgZCwgYSwgYiwgeFtpICsgMTVdLCAxNCwgLTY2MDQ3ODMzNSk7XG4gICAgICAgIGIgPSBtZDVfZ2coYiwgYywgZCwgYSwgeFtpICsgNF0sIDIwLCAtNDA1NTM3ODQ4KTtcbiAgICAgICAgYSA9IG1kNV9nZyhhLCBiLCBjLCBkLCB4W2kgKyA5XSwgNSwgNTY4NDQ2NDM4KTtcbiAgICAgICAgZCA9IG1kNV9nZyhkLCBhLCBiLCBjLCB4W2kgKyAxNF0sIDksIC0xMDE5ODAzNjkwKTtcbiAgICAgICAgYyA9IG1kNV9nZyhjLCBkLCBhLCBiLCB4W2kgKyAzXSwgMTQsIC0xODczNjM5NjEpO1xuICAgICAgICBiID0gbWQ1X2dnKGIsIGMsIGQsIGEsIHhbaSArIDhdLCAyMCwgMTE2MzUzMTUwMSk7XG4gICAgICAgIGEgPSBtZDVfZ2coYSwgYiwgYywgZCwgeFtpICsgMTNdLCA1LCAtMTQ0NDY4MTQ2Nyk7XG4gICAgICAgIGQgPSBtZDVfZ2coZCwgYSwgYiwgYywgeFtpICsgMl0sIDksIC01MTQwMzc4NCk7XG4gICAgICAgIGMgPSBtZDVfZ2coYywgZCwgYSwgYiwgeFtpICsgN10sIDE0LCAxNzM1MzI4NDczKTtcbiAgICAgICAgYiA9IG1kNV9nZyhiLCBjLCBkLCBhLCB4W2kgKyAxMl0sIDIwLCAtMTkyNjYwNzczNCk7XG5cbiAgICAgICAgYSA9IG1kNV9oaChhLCBiLCBjLCBkLCB4W2kgKyA1XSwgNCwgLTM3ODU1OCk7XG4gICAgICAgIGQgPSBtZDVfaGgoZCwgYSwgYiwgYywgeFtpICsgOF0sIDExLCAtMjAyMjU3NDQ2Myk7XG4gICAgICAgIGMgPSBtZDVfaGgoYywgZCwgYSwgYiwgeFtpICsgMTFdLCAxNiwgMTgzOTAzMDU2Mik7XG4gICAgICAgIGIgPSBtZDVfaGgoYiwgYywgZCwgYSwgeFtpICsgMTRdLCAyMywgLTM1MzA5NTU2KTtcbiAgICAgICAgYSA9IG1kNV9oaChhLCBiLCBjLCBkLCB4W2kgKyAxXSwgNCwgLTE1MzA5OTIwNjApO1xuICAgICAgICBkID0gbWQ1X2hoKGQsIGEsIGIsIGMsIHhbaSArIDRdLCAxMSwgMTI3Mjg5MzM1Myk7XG4gICAgICAgIGMgPSBtZDVfaGgoYywgZCwgYSwgYiwgeFtpICsgN10sIDE2LCAtMTU1NDk3NjMyKTtcbiAgICAgICAgYiA9IG1kNV9oaChiLCBjLCBkLCBhLCB4W2kgKyAxMF0sIDIzLCAtMTA5NDczMDY0MCk7XG4gICAgICAgIGEgPSBtZDVfaGgoYSwgYiwgYywgZCwgeFtpICsgMTNdLCA0LCA2ODEyNzkxNzQpO1xuICAgICAgICBkID0gbWQ1X2hoKGQsIGEsIGIsIGMsIHhbaSArIDBdLCAxMSwgLTM1ODUzNzIyMik7XG4gICAgICAgIGMgPSBtZDVfaGgoYywgZCwgYSwgYiwgeFtpICsgM10sIDE2LCAtNzIyNTIxOTc5KTtcbiAgICAgICAgYiA9IG1kNV9oaChiLCBjLCBkLCBhLCB4W2kgKyA2XSwgMjMsIDc2MDI5MTg5KTtcbiAgICAgICAgYSA9IG1kNV9oaChhLCBiLCBjLCBkLCB4W2kgKyA5XSwgNCwgLTY0MDM2NDQ4Nyk7XG4gICAgICAgIGQgPSBtZDVfaGgoZCwgYSwgYiwgYywgeFtpICsgMTJdLCAxMSwgLTQyMTgxNTgzNSk7XG4gICAgICAgIGMgPSBtZDVfaGgoYywgZCwgYSwgYiwgeFtpICsgMTVdLCAxNiwgNTMwNzQyNTIwKTtcbiAgICAgICAgYiA9IG1kNV9oaChiLCBjLCBkLCBhLCB4W2kgKyAyXSwgMjMsIC05OTUzMzg2NTEpO1xuXG4gICAgICAgIGEgPSBtZDVfaWkoYSwgYiwgYywgZCwgeFtpICsgMF0sIDYsIC0xOTg2MzA4NDQpO1xuICAgICAgICBkID0gbWQ1X2lpKGQsIGEsIGIsIGMsIHhbaSArIDddLCAxMCwgMTEyNjg5MTQxNSk7XG4gICAgICAgIGMgPSBtZDVfaWkoYywgZCwgYSwgYiwgeFtpICsgMTRdLCAxNSwgLTE0MTYzNTQ5MDUpO1xuICAgICAgICBiID0gbWQ1X2lpKGIsIGMsIGQsIGEsIHhbaSArIDVdLCAyMSwgLTU3NDM0MDU1KTtcbiAgICAgICAgYSA9IG1kNV9paShhLCBiLCBjLCBkLCB4W2kgKyAxMl0sIDYsIDE3MDA0ODU1NzEpO1xuICAgICAgICBkID0gbWQ1X2lpKGQsIGEsIGIsIGMsIHhbaSArIDNdLCAxMCwgLTE4OTQ5ODY2MDYpO1xuICAgICAgICBjID0gbWQ1X2lpKGMsIGQsIGEsIGIsIHhbaSArIDEwXSwgMTUsIC0xMDUxNTIzKTtcbiAgICAgICAgYiA9IG1kNV9paShiLCBjLCBkLCBhLCB4W2kgKyAxXSwgMjEsIC0yMDU0OTIyNzk5KTtcbiAgICAgICAgYSA9IG1kNV9paShhLCBiLCBjLCBkLCB4W2kgKyA4XSwgNiwgMTg3MzMxMzM1OSk7XG4gICAgICAgIGQgPSBtZDVfaWkoZCwgYSwgYiwgYywgeFtpICsgMTVdLCAxMCwgLTMwNjExNzQ0KTtcbiAgICAgICAgYyA9IG1kNV9paShjLCBkLCBhLCBiLCB4W2kgKyA2XSwgMTUsIC0xNTYwMTk4MzgwKTtcbiAgICAgICAgYiA9IG1kNV9paShiLCBjLCBkLCBhLCB4W2kgKyAxM10sIDIxLCAxMzA5MTUxNjQ5KTtcbiAgICAgICAgYSA9IG1kNV9paShhLCBiLCBjLCBkLCB4W2kgKyA0XSwgNiwgLTE0NTUyMzA3MCk7XG4gICAgICAgIGQgPSBtZDVfaWkoZCwgYSwgYiwgYywgeFtpICsgMTFdLCAxMCwgLTExMjAyMTAzNzkpO1xuICAgICAgICBjID0gbWQ1X2lpKGMsIGQsIGEsIGIsIHhbaSArIDJdLCAxNSwgNzE4Nzg3MjU5KTtcbiAgICAgICAgYiA9IG1kNV9paShiLCBjLCBkLCBhLCB4W2kgKyA5XSwgMjEsIC0zNDM0ODU1NTEpO1xuXG4gICAgICAgIGEgPSBzYWZlX2FkZChhLCBvbGRhKTtcbiAgICAgICAgYiA9IHNhZmVfYWRkKGIsIG9sZGIpO1xuICAgICAgICBjID0gc2FmZV9hZGQoYywgb2xkYyk7XG4gICAgICAgIGQgPSBzYWZlX2FkZChkLCBvbGRkKTtcbiAgICB9XG4gICAgcmV0dXJuIFthLCBiLCBjLCBkXTtcbn1cblxuZnVuY3Rpb24gbWQ1X2NtbihxLCBhLCBiLCB4LCBzLCB0KSB7XG4gICAgcmV0dXJuIHNhZmVfYWRkKGJpdF9yb2woc2FmZV9hZGQoc2FmZV9hZGQoYSwgcSksIHNhZmVfYWRkKHgsIHQpKSwgcyksIGIpO1xufVxuXG5mdW5jdGlvbiBtZDVfZmYoYSwgYiwgYywgZCwgeCwgcywgdCkge1xuICAgIHJldHVybiBtZDVfY21uKChiICYgYykgfCAoKH5iKSAmIGQpLCBhLCBiLCB4LCBzLCB0KTtcbn1cblxuZnVuY3Rpb24gbWQ1X2dnKGEsIGIsIGMsIGQsIHgsIHMsIHQpIHtcbiAgICByZXR1cm4gbWQ1X2NtbigoYiAmIGQpIHwgKGMgJiAofmQpKSwgYSwgYiwgeCwgcywgdCk7XG59XG5cbmZ1bmN0aW9uIG1kNV9oaChhLCBiLCBjLCBkLCB4LCBzLCB0KSB7XG4gICAgcmV0dXJuIG1kNV9jbW4oYiBeIGMgXiBkLCBhLCBiLCB4LCBzLCB0KTtcbn1cblxuZnVuY3Rpb24gbWQ1X2lpKGEsIGIsIGMsIGQsIHgsIHMsIHQpIHtcbiAgICByZXR1cm4gbWQ1X2NtbihjIF4gKGIgfCAofmQpKSwgYSwgYiwgeCwgcywgdCk7XG59XG5cbmZ1bmN0aW9uIHNhZmVfYWRkKHgsIHkpIHtcbiAgICB2YXIgbHN3ID0gKHggJiAweEZGRkYpICsgKHkgJiAweEZGRkYpO1xuICAgIHZhciBtc3cgPSAoeCA+PiAxNikgKyAoeSA+PiAxNikgKyAobHN3ID4+IDE2KTtcbiAgICByZXR1cm4gKG1zdyA8PCAxNikgfCAobHN3ICYgMHhGRkZGKTtcbn1cblxuZnVuY3Rpb24gYml0X3JvbChudW0sIGNudCkge1xuICAgIHJldHVybiAobnVtIDw8IGNudCkgfCAobnVtID4+PiAoMzIgLSBjbnQpKTtcbn1cblxuZnVuY3Rpb24gc3RyMmJpbmwoc3RyKSB7XG4gICAgdmFyIGJpbiA9IFtdO1xuICAgIHZhciBtYXNrID0gKDEgPDwgY2hyc3opIC0gMTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN0ci5sZW5ndGggKiBjaHJzejsgaSArPSBjaHJzeikge1xuICAgICAgICBiaW5baSA+PiA1XSB8PSAoc3RyLmNoYXJDb2RlQXQoaSAvIGNocnN6KSAmIG1hc2spIDw8IChpICUgMzIpO1xuICAgIH1cbiAgICByZXR1cm4gYmluO1xufVxuXG5mdW5jdGlvbiBiaW5sMmhleChiaW5hcnJheSkge1xuICAgIHZhciBoZXhfdGFiID0gaGV4Y2FzZSA/IFwiMDEyMzQ1Njc4OUFCQ0RFRlwiIDogXCIwMTIzNDU2Nzg5YWJjZGVmXCI7XG4gICAgdmFyIHN0ciA9IFwiXCI7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBiaW5hcnJheS5sZW5ndGggKiA0OyBpKyspIHtcbiAgICAgICAgc3RyICs9IGhleF90YWIuY2hhckF0KChiaW5hcnJheVtpID4+IDJdID4+ICgoaSAlIDQpICogOCArIDQpKSAmIDB4RikgKyBoZXhfdGFiLmNoYXJBdCgoYmluYXJyYXlbaSA+PiAyXSA+PiAoKGkgJSA0KSAqIDgpKSAmIDB4Rik7XG4gICAgfVxuICAgIHJldHVybiBzdHI7XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBoZXhfbWQ1OiBoZXhfbWQ1XG59OyIsIi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAnc3VtbWFyeS13aWRnZXRfcmVhY3Rpb25zJzogJ1JlYWN0aW9ucycsXG4gICAgJ3N1bW1hcnktd2lkZ2V0X3JlYWN0aW9uc19vbmUnOiAnMSBSZWFjdGlvbicsXG4gICAgJ3N1bW1hcnktd2lkZ2V0X3JlYWN0aW9uc19tYW55JzogJ3swfSBSZWFjdGlvbnMnLFxuXG4gICAgJ3JlYWN0aW9ucy13aWRnZXRfdGl0bGUnOiAnUmVhY3Rpb25zJyxcbiAgICAncmVhY3Rpb25zLXdpZGdldF90aXRsZV90aGFua3MnOiAnVGhhbmtzIGZvciB5b3VyIHJlYWN0aW9uIScsXG4gICAgJ3JlYWN0aW9ucy13aWRnZXRfdGl0bGVfc2lnbmluJzogJ1NpZ24gaW4gUmVxdWlyZWQnLFxuICAgICdyZWFjdGlvbnMtd2lkZ2V0X3RpdGxlX2Jsb2NrZWQnOiAnQmxvY2tlZCBSZWFjdGlvbicsXG5cbiAgICAncmVhY3Rpb25zLXBhZ2Vfbm9fcmVhY3Rpb25zJzogJ05vIHJlYWN0aW9ucyB5ZXQhJyxcbiAgICAncmVhY3Rpb25zLXBhZ2VfdGhpbmsnOiAnV2hhdCBkbyB5b3UgdGhpbms/JyxcblxuICAgICdtZWRpYS1pbmRpY2F0b3JfdGhpbmsnOiAnV2hhdCBkbyB5b3UgdGhpbms/JyxcblxuICAgICdwb3B1cC13aWRnZXRfdGhpbmsnOiAnV2hhdCBkbyB5b3UgdGhpbms/JyxcblxuICAgICdkZWZhdWx0cy1wYWdlX2FkZCc6ICcrIEFkZCBZb3VyIE93bicsXG4gICAgJ2RlZmF1bHRzLXBhZ2Vfb2snOiAnb2snLFxuXG4gICAgJ2NvbmZpcm1hdGlvbi1wYWdlX3NoYXJlJzogJ1NoYXJlIHlvdXIgcmVhY3Rpb246JyxcblxuICAgICdjb21tZW50cy1wYWdlX2JhY2snOiAnQmFjaycsXG4gICAgJ2NvbW1lbnRzLXBhZ2VfaGVhZGVyJzogJyh7MH0pIENvbW1lbnRzOicsXG5cbiAgICAnY29tbWVudC1hcmVhX2FkZCc6ICdDb21tZW50JyxcbiAgICAnY29tbWVudC1hcmVhX3BsYWNlaG9sZGVyJzogJ0FkZCBjb21tZW50cyBvciAjaGFzaHRhZ3MnLFxuICAgICdjb21tZW50LWFyZWFfdGhhbmtzJzogJ1RoYW5rcyBmb3IgeW91ciBjb21tZW50LicsXG4gICAgJ2NvbW1lbnQtYXJlYV9jb3VudCc6ICc8c3BhbiBjbGFzcz1cImFudGVubmEtY29tbWVudC1jb3VudFwiPjwvc3Bhbj4gY2hhcmFjdGVycyBsZWZ0JyxcblxuICAgICdsb2NhdGlvbnMtcGFnZV9wYWdlbGV2ZWwnOiAnVG8gdGhpcyB3aG9sZSBwYWdlJyxcbiAgICAnbG9jYXRpb25zLXBhZ2VfY291bnRfb25lJzogJzxzcGFuIGNsYXNzPVwiYW50ZW5uYS1sb2NhdGlvbi1jb3VudFwiPjE8L3NwYW4+PGJyPnJlYWN0aW9uJyxcbiAgICAnbG9jYXRpb25zLXBhZ2VfY291bnRfbWFueSc6ICc8c3BhbiBjbGFzcz1cImFudGVubmEtbG9jYXRpb24tY291bnRcIj57MH08L3NwYW4+PGJyPnJlYWN0aW9ucycsXG4gICAgJ2xvY2F0aW9ucy1wYWdlX2JhY2snOiAnQmFjaycsXG5cbiAgICAnY2FsbC10by1hY3Rpb24tbGFiZWxfcmVzcG9uc2VzJzogJ1Jlc3BvbnNlcycsXG4gICAgJ2NhbGwtdG8tYWN0aW9uLWxhYmVsX3Jlc3BvbnNlc19vbmUnOiAnMSBSZXNwb25zZScsXG4gICAgJ2NhbGwtdG8tYWN0aW9uLWxhYmVsX3Jlc3BvbnNlc19tYW55JzogJ3swfSBSZXNwb25zZXMnLFxuXG4gICAgJ2xvZ2luLXBhZ2VfYmFjayc6ICdCYWNrJyxcblxuICAgICdibG9ja2VkLXBhZ2VfYmFjayc6ICdCYWNrJ1xufTsiLCIvL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgJ3N1bW1hcnktd2lkZ2V0X3JlYWN0aW9ucyc6IFwiUmVhY2Npb25lc1wiLFxuICAgICdzdW1tYXJ5LXdpZGdldF9yZWFjdGlvbnNfb25lJzogXCIxIFJlYWNjacOzblwiLFxuICAgICdzdW1tYXJ5LXdpZGdldF9yZWFjdGlvbnNfbWFueSc6IFwiezB9IFJlYWNjaW9uZXNcIixcblxuICAgICdyZWFjdGlvbnMtd2lkZ2V0X3RpdGxlJzogXCJSZWFjY2lvbmVzXCIsXG4gICAgJ3JlYWN0aW9ucy13aWRnZXRfdGl0bGVfdGhhbmtzJzogJ0dyYWNpYXMgcG9yIHR1IHJlYWNjacOzbiEnLFxuICAgICdyZWFjdGlvbnMtd2lkZ2V0X3RpdGxlX3NpZ25pbic6ICdTaWduIGluIFJlcXVpcmVkJywgLy8gVE9ETzogbmVlZCBhIHRyYW5zbGF0aW9uXG4gICAgJ3JlYWN0aW9ucy13aWRnZXRfdGl0bGVfYmxvY2tlZCc6ICdCbG9ja2VkIFJlYWN0aW9uJywgLy8gVE9ETzogbmVlZCBhIHRyYW5zbGF0aW9uXG5cbiAgICAncmVhY3Rpb25zLXBhZ2Vfbm9fcmVhY3Rpb25zJzogJ05vIHJlYWNjaW9uZXMhJywgLy8gVE9ETzogbmVlZCBhIHRyYW5zbGF0aW9uIG9mIFwiTm8gcmVhY3Rpb25zIHlldCFcIlxuICAgICdyZWFjdGlvbnMtcGFnZV90aGluayc6ICfCv1F1w6kgcGllbnNhcz8nLFxuXG4gICAgJ21lZGlhLWluZGljYXRvcl90aGluayc6ICfCv1F1w6kgcGllbnNhcz8nLFxuXG4gICAgJ3BvcHVwLXdpZGdldF90aGluayc6ICfCv1F1w6kgcGllbnNhcz8nLFxuXG4gICAgJ2RlZmF1bHRzLXBhZ2VfYWRkJzogJysgQcOxYWRlIGxvIHR1eW8nLFxuICAgICdkZWZhdWx0cy1wYWdlX29rJzogJ29rJywgLy8gVE9ETzogaXMgdGhpcyByaWdodD8gJ2FjY2VwdGFyJz9cblxuICAgICdjb25maXJtYXRpb24tcGFnZV9zaGFyZSc6ICdDb21wYXJ0ZSB0dSByZWFjY2nDs246JyxcblxuICAgICdjb21tZW50cy1wYWdlX2JhY2snOiAnQ2VycmFyJywgLy8gVE9ETzogbmVlZCBhIHRyYW5zbGF0aW9uIGZvciBcIkJhY2tcIlxuICAgICdjb21tZW50cy1wYWdlX2hlYWRlcic6ICcoezB9KSBDb21lbnRhczonLFxuXG4gICAgJ2NvbW1lbnQtYXJlYV9hZGQnOiAnQ29tZW50YScsXG4gICAgJ2NvbW1lbnQtYXJlYV9wbGFjZWhvbGRlcic6ICdBw7FhZGUgY29tZW50YXJpb3MgbyAjaGFzaHRhZ3MnLFxuICAgICdjb21tZW50LWFyZWFfdGhhbmtzJzogJ0dyYWNpYXMgcG9yIHR1IHJlYWNjacOzbi4nLFxuICAgICdjb21tZW50LWFyZWFfY291bnQnOiAnUXVlZGFuIDxzcGFuIGNsYXNzPVwiYW50ZW5uYS1jb21tZW50LWNvdW50XCI+PC9zcGFuPiBjYXJhY3RlcmVzJyxcblxuICAgICdsb2NhdGlvbnMtcGFnZV9wYWdlbGV2ZWwnOiAnQSBlc3RhIHDDoWdpbmEnLCAvLyBUT0RPOiBuZWVkIGEgdHJhbnNsYXRpb24gb2YgXCJUbyB0aGlzIHdob2xlIHBhZ2VcIlxuICAgICdsb2NhdGlvbnMtcGFnZV9jb3VudF9vbmUnOiAnPHNwYW4gY2xhc3M9XCJhbnRlbm5hLWxvY2F0aW9uLWNvdW50XCI+MTwvc3Bhbj48YnI+cmVhY2Npw7NuJyxcbiAgICAnbG9jYXRpb25zLXBhZ2VfY291bnRfbWFueSc6ICc8c3BhbiBjbGFzcz1cImFudGVubmEtbG9jYXRpb24tY291bnRcIj57MH08L3NwYW4+PGJyPnJlYWNjaW9uZXMnLFxuICAgICdsb2NhdGlvbnMtcGFnZV9iYWNrJzogJ0NlcnJhcicsIC8vIFRPRE86IG5lZWQgYSB0cmFuc2xhdGlvbiBmb3IgXCJCYWNrXCJcblxuICAgICdjYWxsLXRvLWFjdGlvbi1sYWJlbF9yZXNwb25zZXMnOiAnUmVzcHVlc3RhcycsIC8vIFRPRE86IG5lZWQgYSB0cmFuc2xhdGlvbiBvZiBcIlJlc3BvbnNlc1wiXG4gICAgJ2NhbGwtdG8tYWN0aW9uLWxhYmVsX3Jlc3BvbnNlc19vbmUnOiAnMSBSZXNwdWVzdGEnLCAvLyBUT0RPXG4gICAgJ2NhbGwtdG8tYWN0aW9uLWxhYmVsX3Jlc3BvbnNlc19tYW55JzogJ3swfSBSZXNwdWVzdGFzJywgLy8gVE9ET1xuXG4gICAgJ2xvZ2luLXBhZ2VfYmFjayc6ICdDZXJyYXInLCAvLyBUT0RPOiBuZWVkIGEgdHJhbnNsYXRpb24gZm9yIFwiQmFja1wiLFxuXG4gICAgJ2Jsb2NrZWQtcGFnZV9iYWNrJzogJ0NlcnJhcicgLy8gVE9ETzogbmVlZCBhIHRyYW5zbGF0aW9uIGZvciBcIkJhY2tcIixcbn07IiwidmFyIEdyb3VwU2V0dGluZ3MgPSByZXF1aXJlKCcuLi9ncm91cC1zZXR0aW5ncycpO1xuXG52YXIgRW5nbGlzaE1lc3NhZ2VzID0gcmVxdWlyZSgnLi9tZXNzYWdlcy1lbicpO1xudmFyIFNwYW5pc2hNZXNzYWdlcyA9IHJlcXVpcmUoJy4vbWVzc2FnZXMtZXMnKTtcbnZhbGlkYXRlVHJhbnNsYXRpb25zKCk7XG5cbmZ1bmN0aW9uIHZhbGlkYXRlVHJhbnNsYXRpb25zKCkge1xuICAgIGZvciAodmFyIGVuZ2xpc2hLZXkgaW4gRW5nbGlzaE1lc3NhZ2VzKSB7XG4gICAgICAgIGlmIChFbmdsaXNoTWVzc2FnZXMuaGFzT3duUHJvcGVydHkoZW5nbGlzaEtleSkpIHtcbiAgICAgICAgICAgIGlmICghU3BhbmlzaE1lc3NhZ2VzLmhhc093blByb3BlcnR5KGVuZ2xpc2hLZXkpKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnQW50ZW5uYSB3YXJuaW5nOiBTcGFuaXNoIHRyYW5zbGF0aW9uIG1pc3NpbmcgZm9yIGtleSAnICsgZW5nbGlzaEtleSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGdldE1lc3NhZ2Uoa2V5LCB2YWx1ZXMpIHtcbiAgICB2YXIgc3RyaW5nID0gZ2V0TG9jYWxpemVkU3RyaW5nKGtleSwgR3JvdXBTZXR0aW5ncy5nZXQoKS5sYW5ndWFnZSgpKTtcbiAgICBpZiAodmFsdWVzKSB7XG4gICAgICAgIHJldHVybiBmb3JtYXQoc3RyaW5nLCB2YWx1ZXMpO1xuICAgIH1cbiAgICByZXR1cm4gc3RyaW5nO1xufVxuXG5mdW5jdGlvbiBnZXRMb2NhbGl6ZWRTdHJpbmcoa2V5LCBsYW5nKSB7XG4gICAgdmFyIHN0cmluZztcbiAgICBzd2l0Y2gobGFuZykge1xuICAgICAgICBjYXNlICdlbic6XG4gICAgICAgICAgICBzdHJpbmcgPSBFbmdsaXNoTWVzc2FnZXNba2V5XTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdlcyc6XG4gICAgICAgICAgICBzdHJpbmcgPSBTcGFuaXNoTWVzc2FnZXNba2V5XTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgLy8gVE9ETzogcmV2aWV3XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnSW52YWxpZCBsYW5ndWFnZSBzcGVjaWZpZWQgaW4gQW50ZW5uYSBncm91cCBzZXR0aW5ncy4nKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBpZiAoIXN0cmluZykgeyAvLyBEZWZhdWx0IHRvIEVuZ2xpc2hcbiAgICAgICAgc3RyaW5nID0gRW5nbGlzaE1lc3NhZ2VzW2tleV07XG4gICAgfVxuICAgIC8vIFRPRE86IGhhbmRsZSBtaXNzaW5nIGtleVxuICAgIHJldHVybiBzdHJpbmc7XG59XG5cbmZ1bmN0aW9uIGZvcm1hdChzdHJpbmcsIHZhbHVlcykge1xuICAgIC8vIFBvcHVsYXIsIHNpbXBsZSBhbGdvcml0aG0gZnJvbSBodHRwOi8vamF2YXNjcmlwdC5jcm9ja2ZvcmQuY29tL3JlbWVkaWFsLmh0bWxcbiAgICByZXR1cm4gc3RyaW5nLnJlcGxhY2UoXG4gICAgICAgIC9cXHsoW157fV0qKVxcfS9nLFxuICAgICAgICBmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICAgICAgdmFyIHIgPSB2YWx1ZXNbYl07XG4gICAgICAgICAgICByZXR1cm4gdHlwZW9mIHIgPT09ICdzdHJpbmcnIHx8IHR5cGVvZiByID09PSAnbnVtYmVyJyA/IHIgOiBhO1xuICAgICAgICB9XG4gICAgKTtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGdldE1lc3NhZ2U6IGdldE1lc3NhZ2Vcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG5cbmZ1bmN0aW9uIG1ha2VNb3ZlYWJsZSgkZWxlbWVudCwgJGRyYWdIYW5kbGUpIHtcbiAgICAkZHJhZ0hhbmRsZS5vbignbW91c2Vkb3duLmFudGVubmEnLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICB2YXIgb2Zmc2V0WCA9IGV2ZW50LnBhZ2VYIC0gJGRyYWdIYW5kbGUub2Zmc2V0KCkubGVmdDtcbiAgICAgICAgdmFyIG9mZnNldFkgPSBldmVudC5wYWdlWSAtICRkcmFnSGFuZGxlLm9mZnNldCgpLnRvcDtcbiAgICAgICAgJChkb2N1bWVudCkub24oJ21vdXNldXAuYW50ZW5uYScsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICAkKGRvY3VtZW50KS5vZmYoJ21vdXNlbW92ZS5hbnRlbm5hJyk7XG4gICAgICAgIH0pO1xuICAgICAgICAkKGRvY3VtZW50KS5vbignbW91c2Vtb3ZlLmFudGVubmEnLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgJGVsZW1lbnQuY3NzKHtcbiAgICAgICAgICAgICAgICB0b3A6IGV2ZW50LnBhZ2VZIC0gb2Zmc2V0WSxcbiAgICAgICAgICAgICAgICBsZWZ0OiBldmVudC5wYWdlWCAtIG9mZnNldFhcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgbWFrZU1vdmVhYmxlOiBtYWtlTW92ZWFibGVcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgQ2FsbGJhY2tTdXBwb3J0ID0gcmVxdWlyZSgnLi9jYWxsYmFjay1zdXBwb3J0Jyk7XG52YXIgUmFuZ2UgPSByZXF1aXJlKCcuL3JhbmdlJyk7XG52YXIgV2lkZ2V0QnVja2V0ID0gcmVxdWlyZSgnLi93aWRnZXQtYnVja2V0Jyk7XG5cbi8vIFRPRE86IGRldGVjdCB3aGV0aGVyIHRoZSBicm93c2VyIHN1cHBvcnRzIE11dGF0aW9uT2JzZXJ2ZXIgYW5kIGZhbGxiYWNrIHRvIE11dGF0aW9ucyBFdmVudHNcblxudmFyIGFkZGl0aW9uTGlzdGVuZXI7XG52YXIgcmVtb3ZhbExpc3RlbmVyO1xuXG52YXIgYXR0cmlidXRlT2JzZXJ2ZXJzID0gW107XG5cbmZ1bmN0aW9uIGFkZEFkZGl0aW9uTGlzdGVuZXIoY2FsbGJhY2spIHtcbiAgICBpZiAoIWFkZGl0aW9uTGlzdGVuZXIpIHtcbiAgICAgICAgYWRkaXRpb25MaXN0ZW5lciA9IGNyZWF0ZUFkZGl0aW9uTGlzdGVuZXIoKTtcbiAgICB9XG4gICAgYWRkaXRpb25MaXN0ZW5lci5hZGRDYWxsYmFjayhjYWxsYmFjayk7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUFkZGl0aW9uTGlzdGVuZXIoKSB7XG4gICAgdmFyIGNhbGxiYWNrU3VwcG9ydCA9IENhbGxiYWNrU3VwcG9ydC5jcmVhdGUoKTtcbiAgICB2YXIgb2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcihmdW5jdGlvbihtdXRhdGlvblJlY29yZHMpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtdXRhdGlvblJlY29yZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBhZGRlZEVsZW1lbnRzID0gZmlsdGVyZWRFbGVtZW50cyhtdXRhdGlvblJlY29yZHNbaV0uYWRkZWROb2Rlcyk7XG4gICAgICAgICAgICBpZiAoYWRkZWRFbGVtZW50cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNhbGxiYWNrcyA9IGNhbGxiYWNrU3VwcG9ydC5nZXQoKTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGNhbGxiYWNrcy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFja3Nbal0oYWRkZWRFbGVtZW50cyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG4gICAgdmFyIGJvZHkgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnYm9keScpWzBdO1xuICAgIG9ic2VydmVyLm9ic2VydmUoYm9keSwge1xuICAgICAgICBjaGlsZExpc3Q6IHRydWUsXG4gICAgICAgIGF0dHJpYnV0ZXM6IGZhbHNlLFxuICAgICAgICBjaGFyYWN0ZXJEYXRhOiBmYWxzZSxcbiAgICAgICAgc3VidHJlZTogdHJ1ZSxcbiAgICAgICAgYXR0cmlidXRlT2xkVmFsdWU6IGZhbHNlLFxuICAgICAgICBjaGFyYWN0ZXJEYXRhT2xkVmFsdWU6IGZhbHNlXG4gICAgfSk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdGVhcmRvd246IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY2FsbGJhY2tTdXBwb3J0LnRlYXJkb3duKCk7XG4gICAgICAgICAgICBvYnNlcnZlci5kaXNjb25uZWN0KCk7XG4gICAgICAgIH0sXG4gICAgICAgIGFkZENhbGxiYWNrOiBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICAgICAgY2FsbGJhY2tTdXBwb3J0LmFkZChjYWxsYmFjayk7XG4gICAgICAgIH0sXG4gICAgICAgIHJlbW92ZUNhbGxiYWNrOiBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICAgICAgY2FsbGJhY2tTdXBwb3J0LnJlbW92ZShjYWxsYmFjayk7XG4gICAgICAgIH1cbiAgICB9O1xufVxuXG5mdW5jdGlvbiBhZGRSZW1vdmFsTGlzdGVuZXIoY2FsbGJhY2spIHtcbiAgICBpZiAoIXJlbW92YWxMaXN0ZW5lcikge1xuICAgICAgICByZW1vdmFsTGlzdGVuZXIgPSBjcmVhdGVSZW1vdmFsTGlzdGVuZXIoKTtcbiAgICB9XG4gICAgcmVtb3ZhbExpc3RlbmVyLmFkZENhbGxiYWNrKGNhbGxiYWNrKTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlUmVtb3ZhbExpc3RlbmVyKCkge1xuICAgIHZhciBjYWxsYmFja1N1cHBvcnQgPSBDYWxsYmFja1N1cHBvcnQuY3JlYXRlKCk7XG4gICAgdmFyIG9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoZnVuY3Rpb24obXV0YXRpb25SZWNvcmRzKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbXV0YXRpb25SZWNvcmRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgcmVtb3ZlZEVsZW1lbnRzID0gZmlsdGVyZWRFbGVtZW50cyhtdXRhdGlvblJlY29yZHNbaV0ucmVtb3ZlZE5vZGVzKTtcbiAgICAgICAgICAgIGlmIChyZW1vdmVkRWxlbWVudHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHZhciBjYWxsYmFja3MgPSBjYWxsYmFja1N1cHBvcnQuZ2V0KCk7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBjYWxsYmFja3MubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2tzW2pdKHJlbW92ZWRFbGVtZW50cyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG4gICAgdmFyIGJvZHkgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnYm9keScpWzBdO1xuICAgIG9ic2VydmVyLm9ic2VydmUoYm9keSwge1xuICAgICAgICBjaGlsZExpc3Q6IHRydWUsXG4gICAgICAgIGF0dHJpYnV0ZXM6IGZhbHNlLFxuICAgICAgICBjaGFyYWN0ZXJEYXRhOiBmYWxzZSxcbiAgICAgICAgc3VidHJlZTogdHJ1ZSxcbiAgICAgICAgYXR0cmlidXRlT2xkVmFsdWU6IGZhbHNlLFxuICAgICAgICBjaGFyYWN0ZXJEYXRhT2xkVmFsdWU6IGZhbHNlXG4gICAgfSk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdGVhcmRvd246IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY2FsbGJhY2tTdXBwb3J0LnRlYXJkb3duKCk7XG4gICAgICAgICAgICBvYnNlcnZlci5kaXNjb25uZWN0KCk7XG4gICAgICAgIH0sXG4gICAgICAgIGFkZENhbGxiYWNrOiBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICAgICAgY2FsbGJhY2tTdXBwb3J0LmFkZChjYWxsYmFjayk7XG4gICAgICAgIH0sXG4gICAgICAgIHJlbW92ZUNhbGxiYWNrOiBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICAgICAgY2FsbGJhY2tTdXBwb3J0LnJlbW92ZShjYWxsYmFjayk7XG4gICAgICAgIH1cbiAgICB9O1xufVxuXG4vLyBGaWx0ZXIgdGhlIHNldCBvZiBub2RlcyB0byBlbGltaW5hdGUgYW55dGhpbmcgaW5zaWRlIG91ciBvd24gRE9NIGVsZW1lbnRzIChvdGhlcndpc2UsIHdlIGdlbmVyYXRlIGEgdG9uIG9mIGNoYXR0ZXIpXG5mdW5jdGlvbiBmaWx0ZXJlZEVsZW1lbnRzKG5vZGVMaXN0KSB7XG4gICAgdmFyIGZpbHRlcmVkID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBub2RlTGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgbm9kZSA9IG5vZGVMaXN0W2ldO1xuICAgICAgICBpZiAobm9kZS5ub2RlVHlwZSA9PT0gMSkgeyAvLyBPbmx5IGVsZW1lbnQgbm9kZXMuIChodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvTm9kZS9ub2RlVHlwZSlcbiAgICAgICAgICAgIHZhciAkZWxlbWVudCA9ICQobm9kZSk7XG4gICAgICAgICAgICBpZiAoJGVsZW1lbnQuY2xvc2VzdChSYW5nZS5ISUdITElHSFRfU0VMRUNUT1IgKyAnLCAuYW50ZW5uYSwgJyArIFdpZGdldEJ1Y2tldC5zZWxlY3RvcigpKS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICBmaWx0ZXJlZC5wdXNoKCRlbGVtZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmlsdGVyZWQ7XG59XG5cbmZ1bmN0aW9uIGFkZE9uZVRpbWVBdHRyaWJ1dGVMaXN0ZW5lcihub2RlLCBhdHRyaWJ1dGVzLCBjYWxsYmFjaykge1xuICAgIHZhciBvYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKGZ1bmN0aW9uKG11dGF0aW9uUmVjb3Jkcykge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG11dGF0aW9uUmVjb3Jkcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIHRhcmdldCA9IG11dGF0aW9uUmVjb3Jkc1tpXS50YXJnZXQ7XG4gICAgICAgICAgICBjYWxsYmFjayh0YXJnZXQpO1xuICAgICAgICAgICAgb2JzZXJ2ZXIuZGlzY29ubmVjdCgpO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgb2JzZXJ2ZXIub2JzZXJ2ZShub2RlLCB7XG4gICAgICAgIGNoaWxkTGlzdDogZmFsc2UsXG4gICAgICAgIGF0dHJpYnV0ZXM6IHRydWUsXG4gICAgICAgIGNoYXJhY3RlckRhdGE6IGZhbHNlLFxuICAgICAgICBzdWJ0cmVlOiBmYWxzZSxcbiAgICAgICAgYXR0cmlidXRlT2xkVmFsdWU6IGZhbHNlLFxuICAgICAgICBjaGFyYWN0ZXJEYXRhT2xkVmFsdWU6IGZhbHNlLFxuICAgICAgICBhdHRyaWJ1dGVGaWx0ZXI6IGF0dHJpYnV0ZXNcbiAgICB9KTtcbiAgICBhdHRyaWJ1dGVPYnNlcnZlcnMucHVzaChvYnNlcnZlcik7XG59XG5cbmZ1bmN0aW9uIHRlYXJkb3duKCkge1xuICAgIGlmIChhZGRpdGlvbkxpc3RlbmVyKSB7XG4gICAgICAgIGFkZGl0aW9uTGlzdGVuZXIudGVhcmRvd24oKTtcbiAgICAgICAgYWRkaXRpb25MaXN0ZW5lciA9IHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBpZiAocmVtb3ZhbExpc3RlbmVyKSB7XG4gICAgICAgIHJlbW92YWxMaXN0ZW5lci50ZWFyZG93bigpO1xuICAgICAgICByZW1vdmFsTGlzdGVuZXIgPSB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhdHRyaWJ1dGVPYnNlcnZlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgYXR0cmlidXRlT2JzZXJ2ZXJzW2ldLmRpc2Nvbm5lY3QoKTtcbiAgICB9XG4gICAgYXR0cmlidXRlT2JzZXJ2ZXJzID0gW107XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBhZGRBZGRpdGlvbkxpc3RlbmVyOiBhZGRBZGRpdGlvbkxpc3RlbmVyLFxuICAgIGFkZFJlbW92YWxMaXN0ZW5lcjogYWRkUmVtb3ZhbExpc3RlbmVyLFxuICAgIGFkZE9uZVRpbWVBdHRyaWJ1dGVMaXN0ZW5lcjogYWRkT25lVGltZUF0dHJpYnV0ZUxpc3RlbmVyLFxuICAgIHRlYXJkb3duOiB0ZWFyZG93blxufTsiLCJ2YXIgJDsgcmVxdWlyZSgnLi9qcXVlcnktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24oalF1ZXJ5KSB7ICQ9alF1ZXJ5OyB9KTtcblxuZnVuY3Rpb24gY29tcHV0ZVRvcExldmVsUGFnZVRpdGxlKCkge1xuICAgIC8vIFRPRE86IFRoaXMgc2hvdWxkIGJlIGEgY29uZmlndXJhYmxlIGdyb3VwIHNldHRpbmcgbGlrZSB0aGUgb3RoZXIgcGFnZSBwcm9wZXJ0aWVzLlxuICAgIHJldHVybiBnZXRBdHRyaWJ1dGVWYWx1ZSgnbWV0YVtwcm9wZXJ0eT1cIm9nOnRpdGxlXCJdJywgJ2NvbnRlbnQnKSB8fCAkKCd0aXRsZScpLnRleHQoKS50cmltKCk7XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVQYWdlVGl0bGUoJHBhZ2UsIGdyb3VwU2V0dGluZ3MpIHtcbiAgICB2YXIgcGFnZVRpdGxlID0gJHBhZ2UuZmluZChncm91cFNldHRpbmdzLnBhZ2VMaW5rU2VsZWN0b3IoKSkudGV4dCgpLnRyaW0oKTtcbiAgICBpZiAocGFnZVRpdGxlID09PSAnJykge1xuICAgICAgICBwYWdlVGl0bGUgPSBjb21wdXRlVG9wTGV2ZWxQYWdlVGl0bGUoKTtcbiAgICB9XG4gICAgcmV0dXJuIHBhZ2VUaXRsZTtcbn1cblxuZnVuY3Rpb24gY29tcHV0ZVRvcExldmVsUGFnZUltYWdlKGdyb3VwU2V0dGluZ3MpIHtcbiAgICByZXR1cm4gZ2V0QXR0cmlidXRlVmFsdWUoZ3JvdXBTZXR0aW5ncy5wYWdlSW1hZ2VTZWxlY3RvcigpLCBncm91cFNldHRpbmdzLnBhZ2VJbWFnZUF0dHJpYnV0ZSgpKTtcbn1cblxuZnVuY3Rpb24gY29tcHV0ZVBhZ2VBdXRob3IoZ3JvdXBTZXR0aW5ncykge1xuICAgIHJldHVybiBnZXRBdHRyaWJ1dGVWYWx1ZShncm91cFNldHRpbmdzLnBhZ2VBdXRob3JTZWxlY3RvcigpLCBncm91cFNldHRpbmdzLnBhZ2VBdXRob3JBdHRyaWJ1dGUoKSk7XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVQYWdlVG9waWNzKGdyb3VwU2V0dGluZ3MpIHtcbiAgICByZXR1cm4gZ2V0QXR0cmlidXRlVmFsdWUoZ3JvdXBTZXR0aW5ncy5wYWdlVG9waWNzU2VsZWN0b3IoKSwgZ3JvdXBTZXR0aW5ncy5wYWdlVG9waWNzQXR0cmlidXRlKCkpO1xufVxuXG5mdW5jdGlvbiBjb21wdXRlUGFnZVNpdGVTZWN0aW9uKGdyb3VwU2V0dGluZ3MpIHtcbiAgICByZXR1cm4gZ2V0QXR0cmlidXRlVmFsdWUoZ3JvdXBTZXR0aW5ncy5wYWdlU2l0ZVNlY3Rpb25TZWxlY3RvcigpLCBncm91cFNldHRpbmdzLnBhZ2VTaXRlU2VjdGlvbkF0dHJpYnV0ZSgpKTtcbn1cblxuZnVuY3Rpb24gZ2V0QXR0cmlidXRlVmFsdWUoZWxlbWVudFNlbGVjdG9yLCBhdHRyaWJ1dGVTZWxlY3Rvcikge1xuICAgIHZhciB2YWx1ZSA9ICcnO1xuICAgIGlmIChlbGVtZW50U2VsZWN0b3IgJiYgYXR0cmlidXRlU2VsZWN0b3IpIHtcbiAgICAgICAgdmFsdWUgPSAkKGVsZW1lbnRTZWxlY3RvcikuYXR0cihhdHRyaWJ1dGVTZWxlY3RvcikgfHwgJyc7XG4gICAgfVxuICAgIHJldHVybiB2YWx1ZS50cmltKCk7XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVUb3BMZXZlbENhbm9uaWNhbFVybChncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIGNhbm9uaWNhbFVybCA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmLnNwbGl0KCcjJylbMF0udG9Mb3dlckNhc2UoKTtcbiAgICB2YXIgJGNhbm9uaWNhbExpbmsgPSAkKCdsaW5rW3JlbD1cImNhbm9uaWNhbFwiXScpO1xuICAgIGlmICgkY2Fub25pY2FsTGluay5sZW5ndGggPiAwKSB7XG4gICAgICAgIHZhciBvdmVycmlkZVVybCA9ICRjYW5vbmljYWxMaW5rLmF0dHIoJ2hyZWYnKS50cmltKCkudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgdmFyIGRvbWFpbiA9ICh3aW5kb3cubG9jYXRpb24ucHJvdG9jb2wrJy8vJyt3aW5kb3cubG9jYXRpb24uaG9zdG5hbWUrJy8nKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICBpZiAob3ZlcnJpZGVVcmwgIT09IGRvbWFpbikgeyAvLyBmYXN0Y28gZml4IChzaW5jZSB0aGV5IHNvbWV0aW1lcyByZXdyaXRlIHRoZWlyIGNhbm9uaWNhbCB0byBzaW1wbHkgYmUgdGhlaXIgZG9tYWluLilcbiAgICAgICAgICAgIGNhbm9uaWNhbFVybCA9IG92ZXJyaWRlVXJsO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZW1vdmVTdWJkb21haW5Gcm9tUGFnZVVybChjYW5vbmljYWxVcmwsIGdyb3VwU2V0dGluZ3MpO1xufVxuXG5mdW5jdGlvbiBjb21wdXRlUGFnZUVsZW1lbnRVcmwoJHBhZ2VFbGVtZW50LCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIHVybCA9ICRwYWdlRWxlbWVudC5maW5kKGdyb3VwU2V0dGluZ3MucGFnZUxpbmtTZWxlY3RvcigpKS5hdHRyKCdocmVmJyk7XG4gICAgaWYgKHVybCkge1xuICAgICAgICByZXR1cm4gcmVtb3ZlU3ViZG9tYWluRnJvbVBhZ2VVcmwodXJsLCBncm91cFNldHRpbmdzKTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbXB1dGVUb3BMZXZlbENhbm9uaWNhbFVybChncm91cFNldHRpbmdzKTtcbn1cblxuLy8gVE9ETyBjb3BpZWQgZnJvbSBlbmdhZ2VfZnVsbC4gUmV2aWV3LlxuZnVuY3Rpb24gcmVtb3ZlU3ViZG9tYWluRnJvbVBhZ2VVcmwodXJsLCBncm91cFNldHRpbmdzKSB7XG4gICAgLy8gQU5ULmFjdGlvbnMucmVtb3ZlU3ViZG9tYWluRnJvbVBhZ2VVcmw6XG4gICAgLy8gaWYgXCJpZ25vcmVfc3ViZG9tYWluXCIgaXMgY2hlY2tlZCBpbiBzZXR0aW5ncywgQU5EIHRoZXkgc3VwcGx5IGEgVExELFxuICAgIC8vIHRoZW4gbW9kaWZ5IHRoZSBwYWdlIGFuZCBjYW5vbmljYWwgVVJMcyBoZXJlLlxuICAgIC8vIGhhdmUgdG8gaGF2ZSB0aGVtIHN1cHBseSBvbmUgYmVjYXVzZSB0aGVyZSBhcmUgdG9vIG1hbnkgdmFyaWF0aW9ucyB0byByZWxpYWJseSBzdHJpcCBzdWJkb21haW5zICAoLmNvbSwgLmlzLCAuY29tLmFyLCAuY28udWssIGV0YylcbiAgICBpZiAoZ3JvdXBTZXR0aW5ncy51cmwuaWdub3JlU3ViZG9tYWluKCkgPT0gdHJ1ZSAmJiBncm91cFNldHRpbmdzLnVybC5jYW5vbmljYWxEb21haW4oKSkge1xuICAgICAgICB2YXIgSE9TVERPTUFJTiA9IC9bLVxcd10rXFwuKD86Wy1cXHddK1xcLnhuLS1bLVxcd10rfFstXFx3XXsyLH18Wy1cXHddK1xcLlstXFx3XXsyfSkkL2k7XG4gICAgICAgIHZhciBzcmNBcnJheSA9IHVybC5zcGxpdCgnLycpO1xuXG4gICAgICAgIHZhciBwcm90b2NvbCA9IHNyY0FycmF5WzBdO1xuICAgICAgICBzcmNBcnJheS5zcGxpY2UoMCwzKTtcblxuICAgICAgICB2YXIgcmV0dXJuVXJsID0gcHJvdG9jb2wgKyAnLy8nICsgZ3JvdXBTZXR0aW5ncy51cmwuY2Fub25pY2FsRG9tYWluKCkgKyAnLycgKyBzcmNBcnJheS5qb2luKCcvJyk7XG5cbiAgICAgICAgcmV0dXJuIHJldHVyblVybDtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdXJsO1xuICAgIH1cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNvbXB1dGVQYWdlVXJsOiBjb21wdXRlUGFnZUVsZW1lbnRVcmwsXG4gICAgY29tcHV0ZVBhZ2VUaXRsZTogY29tcHV0ZVBhZ2VUaXRsZSxcbiAgICBjb21wdXRlVG9wTGV2ZWxQYWdlSW1hZ2U6IGNvbXB1dGVUb3BMZXZlbFBhZ2VJbWFnZSxcbiAgICBjb21wdXRlUGFnZUF1dGhvcjogY29tcHV0ZVBhZ2VBdXRob3IsXG4gICAgY29tcHV0ZVBhZ2VUb3BpY3M6IGNvbXB1dGVQYWdlVG9waWNzLFxuICAgIGNvbXB1dGVQYWdlU2l0ZVNlY3Rpb246IGNvbXB1dGVQYWdlU2l0ZVNlY3Rpb25cbn07IiwiLy8gVGFwL2Zhc3RjbGljayBldmVudCBwbHVnaW4gZm9yIFJhY3RpdmUuanMgLSBlbGltaW5hdGVzIHRoZSAzMDBtcyBkZWxheSBvbiB0b3VjaC1lbmFibGVkIGRldmljZXMsIGFuZCBub3JtYWxpc2VzXG4vLyBhY3Jvc3MgbW91c2UsIHRvdWNoIGFuZCBwb2ludGVyIGV2ZW50cy5cbi8vIEF1dGhvcjogUmljaCBIYXJyaXNcbi8vIExpY2Vuc2U6IE1JVFxuLy8gU291cmNlOiBodHRwczovL2dpdGh1Yi5jb20vcmFjdGl2ZWpzL3JhY3RpdmUtZXZlbnRzLXRhcFxuKGZ1bmN0aW9uIChnbG9iYWwsIGZhY3RvcnkpIHtcblx0bW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7XG59KHRoaXMsIGZ1bmN0aW9uICgpIHsgJ3VzZSBzdHJpY3QnO1xuXG5cdHZhciBESVNUQU5DRV9USFJFU0hPTEQgPSA1OyAvLyBtYXhpbXVtIHBpeGVscyBwb2ludGVyIGNhbiBtb3ZlIGJlZm9yZSBjYW5jZWxcblx0dmFyIFRJTUVfVEhSRVNIT0xEID0gNDAwOyAvLyBtYXhpbXVtIG1pbGxpc2Vjb25kcyBiZXR3ZWVuIGRvd24gYW5kIHVwIGJlZm9yZSBjYW5jZWxcblxuXHRmdW5jdGlvbiB0YXAobm9kZSwgY2FsbGJhY2spIHtcblx0XHRyZXR1cm4gbmV3IFRhcEhhbmRsZXIobm9kZSwgY2FsbGJhY2spO1xuXHR9XG5cblx0ZnVuY3Rpb24gVGFwSGFuZGxlcihub2RlLCBjYWxsYmFjaykge1xuXHRcdHRoaXMubm9kZSA9IG5vZGU7XG5cdFx0dGhpcy5jYWxsYmFjayA9IGNhbGxiYWNrO1xuXG5cdFx0dGhpcy5wcmV2ZW50TW91c2Vkb3duRXZlbnRzID0gZmFsc2U7XG5cblx0XHR0aGlzLmJpbmQobm9kZSk7XG5cdH1cblxuXHRUYXBIYW5kbGVyLnByb3RvdHlwZSA9IHtcblx0XHRiaW5kOiBmdW5jdGlvbiBiaW5kKG5vZGUpIHtcblx0XHRcdC8vIGxpc3RlbiBmb3IgbW91c2UvcG9pbnRlciBldmVudHMuLi5cblx0XHRcdGlmICh3aW5kb3cubmF2aWdhdG9yLnBvaW50ZXJFbmFibGVkKSB7XG5cdFx0XHRcdG5vZGUuYWRkRXZlbnRMaXN0ZW5lcigncG9pbnRlcmRvd24nLCBoYW5kbGVNb3VzZWRvd24sIGZhbHNlKTtcblx0XHRcdH0gZWxzZSBpZiAod2luZG93Lm5hdmlnYXRvci5tc1BvaW50ZXJFbmFibGVkKSB7XG5cdFx0XHRcdG5vZGUuYWRkRXZlbnRMaXN0ZW5lcignTVNQb2ludGVyRG93bicsIGhhbmRsZU1vdXNlZG93biwgZmFsc2UpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0bm9kZS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBoYW5kbGVNb3VzZWRvd24sIGZhbHNlKTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gLi4uYW5kIHRvdWNoIGV2ZW50c1xuXHRcdFx0bm9kZS5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgaGFuZGxlVG91Y2hzdGFydCwgZmFsc2UpO1xuXG5cdFx0XHQvLyBuYXRpdmUgYnV0dG9ucywgYW5kIDxpbnB1dCB0eXBlPSdidXR0b24nPiBlbGVtZW50cywgc2hvdWxkIGZpcmUgYSB0YXAgZXZlbnRcblx0XHRcdC8vIHdoZW4gdGhlIHNwYWNlIGtleSBpcyBwcmVzc2VkXG5cdFx0XHRpZiAobm9kZS50YWdOYW1lID09PSAnQlVUVE9OJyB8fCBub2RlLnR5cGUgPT09ICdidXR0b24nKSB7XG5cdFx0XHRcdG5vZGUuYWRkRXZlbnRMaXN0ZW5lcignZm9jdXMnLCBoYW5kbGVGb2N1cywgZmFsc2UpO1xuXHRcdFx0fVxuXG5cdFx0XHRub2RlLl9fdGFwX2hhbmRsZXJfXyA9IHRoaXM7XG5cdFx0fSxcblx0XHRmaXJlOiBmdW5jdGlvbiBmaXJlKGV2ZW50LCB4LCB5KSB7XG5cdFx0XHR0aGlzLmNhbGxiYWNrKHtcblx0XHRcdFx0bm9kZTogdGhpcy5ub2RlLFxuXHRcdFx0XHRvcmlnaW5hbDogZXZlbnQsXG5cdFx0XHRcdHg6IHgsXG5cdFx0XHRcdHk6IHlcblx0XHRcdH0pO1xuXHRcdH0sXG5cdFx0bW91c2Vkb3duOiBmdW5jdGlvbiBtb3VzZWRvd24oZXZlbnQpIHtcblx0XHRcdHZhciBfdGhpcyA9IHRoaXM7XG5cblx0XHRcdGlmICh0aGlzLnByZXZlbnRNb3VzZWRvd25FdmVudHMpIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZXZlbnQud2hpY2ggIT09IHVuZGVmaW5lZCAmJiBldmVudC53aGljaCAhPT0gMSkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdHZhciB4ID0gZXZlbnQuY2xpZW50WDtcblx0XHRcdHZhciB5ID0gZXZlbnQuY2xpZW50WTtcblxuXHRcdFx0Ly8gVGhpcyB3aWxsIGJlIG51bGwgZm9yIG1vdXNlIGV2ZW50cy5cblx0XHRcdHZhciBwb2ludGVySWQgPSBldmVudC5wb2ludGVySWQ7XG5cblx0XHRcdHZhciBoYW5kbGVNb3VzZXVwID0gZnVuY3Rpb24gaGFuZGxlTW91c2V1cChldmVudCkge1xuXHRcdFx0XHRpZiAoZXZlbnQucG9pbnRlcklkICE9IHBvaW50ZXJJZCkge1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdF90aGlzLmZpcmUoZXZlbnQsIHgsIHkpO1xuXHRcdFx0XHRjYW5jZWwoKTtcblx0XHRcdH07XG5cblx0XHRcdHZhciBoYW5kbGVNb3VzZW1vdmUgPSBmdW5jdGlvbiBoYW5kbGVNb3VzZW1vdmUoZXZlbnQpIHtcblx0XHRcdFx0aWYgKGV2ZW50LnBvaW50ZXJJZCAhPSBwb2ludGVySWQpIHtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoTWF0aC5hYnMoZXZlbnQuY2xpZW50WCAtIHgpID49IERJU1RBTkNFX1RIUkVTSE9MRCB8fCBNYXRoLmFicyhldmVudC5jbGllbnRZIC0geSkgPj0gRElTVEFOQ0VfVEhSRVNIT0xEKSB7XG5cdFx0XHRcdFx0Y2FuY2VsKCk7XG5cdFx0XHRcdH1cblx0XHRcdH07XG5cblx0XHRcdHZhciBjYW5jZWwgPSBmdW5jdGlvbiBjYW5jZWwoKSB7XG5cdFx0XHRcdF90aGlzLm5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcignTVNQb2ludGVyVXAnLCBoYW5kbGVNb3VzZXVwLCBmYWxzZSk7XG5cdFx0XHRcdGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ01TUG9pbnRlck1vdmUnLCBoYW5kbGVNb3VzZW1vdmUsIGZhbHNlKTtcblx0XHRcdFx0ZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignTVNQb2ludGVyQ2FuY2VsJywgY2FuY2VsLCBmYWxzZSk7XG5cdFx0XHRcdF90aGlzLm5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcigncG9pbnRlcnVwJywgaGFuZGxlTW91c2V1cCwgZmFsc2UpO1xuXHRcdFx0XHRkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdwb2ludGVybW92ZScsIGhhbmRsZU1vdXNlbW92ZSwgZmFsc2UpO1xuXHRcdFx0XHRkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdwb2ludGVyY2FuY2VsJywgY2FuY2VsLCBmYWxzZSk7XG5cdFx0XHRcdF90aGlzLm5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVNb3VzZXVwLCBmYWxzZSk7XG5cdFx0XHRcdGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIGhhbmRsZU1vdXNlbW92ZSwgZmFsc2UpO1xuXHRcdFx0fTtcblxuXHRcdFx0aWYgKHdpbmRvdy5uYXZpZ2F0b3IucG9pbnRlckVuYWJsZWQpIHtcblx0XHRcdFx0dGhpcy5ub2RlLmFkZEV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJ1cCcsIGhhbmRsZU1vdXNldXAsIGZhbHNlKTtcblx0XHRcdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigncG9pbnRlcm1vdmUnLCBoYW5kbGVNb3VzZW1vdmUsIGZhbHNlKTtcblx0XHRcdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigncG9pbnRlcmNhbmNlbCcsIGNhbmNlbCwgZmFsc2UpO1xuXHRcdFx0fSBlbHNlIGlmICh3aW5kb3cubmF2aWdhdG9yLm1zUG9pbnRlckVuYWJsZWQpIHtcblx0XHRcdFx0dGhpcy5ub2RlLmFkZEV2ZW50TGlzdGVuZXIoJ01TUG9pbnRlclVwJywgaGFuZGxlTW91c2V1cCwgZmFsc2UpO1xuXHRcdFx0XHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdNU1BvaW50ZXJNb3ZlJywgaGFuZGxlTW91c2Vtb3ZlLCBmYWxzZSk7XG5cdFx0XHRcdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ01TUG9pbnRlckNhbmNlbCcsIGNhbmNlbCwgZmFsc2UpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhpcy5ub2RlLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlTW91c2V1cCwgZmFsc2UpO1xuXHRcdFx0XHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBoYW5kbGVNb3VzZW1vdmUsIGZhbHNlKTtcblx0XHRcdH1cblxuXHRcdFx0c2V0VGltZW91dChjYW5jZWwsIFRJTUVfVEhSRVNIT0xEKTtcblx0XHR9LFxuXHRcdHRvdWNoZG93bjogZnVuY3Rpb24gdG91Y2hkb3duKCkge1xuXHRcdFx0dmFyIF90aGlzMiA9IHRoaXM7XG5cblx0XHRcdHZhciB0b3VjaCA9IGV2ZW50LnRvdWNoZXNbMF07XG5cblx0XHRcdHZhciB4ID0gdG91Y2guY2xpZW50WDtcblx0XHRcdHZhciB5ID0gdG91Y2guY2xpZW50WTtcblxuXHRcdFx0dmFyIGZpbmdlciA9IHRvdWNoLmlkZW50aWZpZXI7XG5cblx0XHRcdHZhciBoYW5kbGVUb3VjaHVwID0gZnVuY3Rpb24gaGFuZGxlVG91Y2h1cChldmVudCkge1xuXHRcdFx0XHR2YXIgdG91Y2ggPSBldmVudC5jaGFuZ2VkVG91Y2hlc1swXTtcblxuXHRcdFx0XHRpZiAodG91Y2guaWRlbnRpZmllciAhPT0gZmluZ2VyKSB7XG5cdFx0XHRcdFx0Y2FuY2VsKCk7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTsgLy8gcHJldmVudCBjb21wYXRpYmlsaXR5IG1vdXNlIGV2ZW50XG5cblx0XHRcdFx0Ly8gZm9yIHRoZSBiZW5lZml0IG9mIG1vYmlsZSBGaXJlZm94IGFuZCBvbGQgQW5kcm9pZCBicm93c2Vycywgd2UgbmVlZCB0aGlzIGFic3VyZCBoYWNrLlxuXHRcdFx0XHRfdGhpczIucHJldmVudE1vdXNlZG93bkV2ZW50cyA9IHRydWU7XG5cdFx0XHRcdGNsZWFyVGltZW91dChfdGhpczIucHJldmVudE1vdXNlZG93blRpbWVvdXQpO1xuXG5cdFx0XHRcdF90aGlzMi5wcmV2ZW50TW91c2Vkb3duVGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdF90aGlzMi5wcmV2ZW50TW91c2Vkb3duRXZlbnRzID0gZmFsc2U7XG5cdFx0XHRcdH0sIDQwMCk7XG5cblx0XHRcdFx0X3RoaXMyLmZpcmUoZXZlbnQsIHgsIHkpO1xuXHRcdFx0XHRjYW5jZWwoKTtcblx0XHRcdH07XG5cblx0XHRcdHZhciBoYW5kbGVUb3VjaG1vdmUgPSBmdW5jdGlvbiBoYW5kbGVUb3VjaG1vdmUoZXZlbnQpIHtcblx0XHRcdFx0aWYgKGV2ZW50LnRvdWNoZXMubGVuZ3RoICE9PSAxIHx8IGV2ZW50LnRvdWNoZXNbMF0uaWRlbnRpZmllciAhPT0gZmluZ2VyKSB7XG5cdFx0XHRcdFx0Y2FuY2VsKCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR2YXIgdG91Y2ggPSBldmVudC50b3VjaGVzWzBdO1xuXHRcdFx0XHRpZiAoTWF0aC5hYnModG91Y2guY2xpZW50WCAtIHgpID49IERJU1RBTkNFX1RIUkVTSE9MRCB8fCBNYXRoLmFicyh0b3VjaC5jbGllbnRZIC0geSkgPj0gRElTVEFOQ0VfVEhSRVNIT0xEKSB7XG5cdFx0XHRcdFx0Y2FuY2VsKCk7XG5cdFx0XHRcdH1cblx0XHRcdH07XG5cblx0XHRcdHZhciBjYW5jZWwgPSBmdW5jdGlvbiBjYW5jZWwoKSB7XG5cdFx0XHRcdF90aGlzMi5ub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgaGFuZGxlVG91Y2h1cCwgZmFsc2UpO1xuXHRcdFx0XHR3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgaGFuZGxlVG91Y2htb3ZlLCBmYWxzZSk7XG5cdFx0XHRcdHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaGNhbmNlbCcsIGNhbmNlbCwgZmFsc2UpO1xuXHRcdFx0fTtcblxuXHRcdFx0dGhpcy5ub2RlLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgaGFuZGxlVG91Y2h1cCwgZmFsc2UpO1xuXHRcdFx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIGhhbmRsZVRvdWNobW92ZSwgZmFsc2UpO1xuXHRcdFx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoY2FuY2VsJywgY2FuY2VsLCBmYWxzZSk7XG5cblx0XHRcdHNldFRpbWVvdXQoY2FuY2VsLCBUSU1FX1RIUkVTSE9MRCk7XG5cdFx0fSxcblx0XHR0ZWFyZG93bjogZnVuY3Rpb24gdGVhcmRvd24oKSB7XG5cdFx0XHR2YXIgbm9kZSA9IHRoaXMubm9kZTtcblxuXHRcdFx0bm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKCdwb2ludGVyZG93bicsIGhhbmRsZU1vdXNlZG93biwgZmFsc2UpO1xuXHRcdFx0bm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKCdNU1BvaW50ZXJEb3duJywgaGFuZGxlTW91c2Vkb3duLCBmYWxzZSk7XG5cdFx0XHRub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIGhhbmRsZU1vdXNlZG93biwgZmFsc2UpO1xuXHRcdFx0bm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgaGFuZGxlVG91Y2hzdGFydCwgZmFsc2UpO1xuXHRcdFx0bm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKCdmb2N1cycsIGhhbmRsZUZvY3VzLCBmYWxzZSk7XG5cdFx0fVxuXHR9O1xuXG5cdGZ1bmN0aW9uIGhhbmRsZU1vdXNlZG93bihldmVudCkge1xuXHRcdHRoaXMuX190YXBfaGFuZGxlcl9fLm1vdXNlZG93bihldmVudCk7XG5cdH1cblxuXHRmdW5jdGlvbiBoYW5kbGVUb3VjaHN0YXJ0KGV2ZW50KSB7XG5cdFx0dGhpcy5fX3RhcF9oYW5kbGVyX18udG91Y2hkb3duKGV2ZW50KTtcblx0fVxuXG5cdGZ1bmN0aW9uIGhhbmRsZUZvY3VzKCkge1xuXHRcdHRoaXMuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGhhbmRsZUtleWRvd24sIGZhbHNlKTtcblx0XHR0aGlzLmFkZEV2ZW50TGlzdGVuZXIoJ2JsdXInLCBoYW5kbGVCbHVyLCBmYWxzZSk7XG5cdH1cblxuXHRmdW5jdGlvbiBoYW5kbGVCbHVyKCkge1xuXHRcdHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGhhbmRsZUtleWRvd24sIGZhbHNlKTtcblx0XHR0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2JsdXInLCBoYW5kbGVCbHVyLCBmYWxzZSk7XG5cdH1cblxuXHRmdW5jdGlvbiBoYW5kbGVLZXlkb3duKGV2ZW50KSB7XG5cdFx0aWYgKGV2ZW50LndoaWNoID09PSAzMikge1xuXHRcdFx0Ly8gc3BhY2Uga2V5XG5cdFx0XHR0aGlzLl9fdGFwX2hhbmRsZXJfXy5maXJlKCk7XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIHRhcDtcblxufSkpOyIsInZhciAkOyByZXF1aXJlKCcuL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIFJhY3RpdmVFdmVudHNUYXAgPSByZXF1aXJlKCcuL3JhY3RpdmUtZXZlbnRzLXRhcCcpO1xuXG52YXIgTWVzc2FnZXMgPSByZXF1aXJlKCcuL21lc3NhZ2VzJyk7XG5cbnZhciBub0NvbmZsaWN0O1xudmFyIGxvYWRlZFJhY3RpdmU7XG52YXIgY2FsbGJhY2tzID0gW107XG5cbi8vIENhcHR1cmUgYW55IGdsb2JhbCBpbnN0YW5jZSBvZiBSYWN0aXZlIHdoaWNoIGFscmVhZHkgZXhpc3RzIGJlZm9yZSB3ZSBsb2FkIG91ciBvd24uXG5mdW5jdGlvbiBhYm91dFRvTG9hZCgpIHtcbiAgICBub0NvbmZsaWN0ID0gd2luZG93LlJhY3RpdmU7XG59XG5cbi8vIFJlc3RvcmUgdGhlIGdsb2JhbCBpbnN0YW5jZSBvZiBSYWN0aXZlIChpZiBhbnkpIGFuZCBwYXNzIG91dCBvdXIgdmVyc2lvbiB0byBvdXIgY2FsbGJhY2tzXG5mdW5jdGlvbiBsb2FkZWQoKSB7XG4gICAgbG9hZGVkUmFjdGl2ZSA9IFJhY3RpdmU7XG4gICAgd2luZG93LlJhY3RpdmUgPSBub0NvbmZsaWN0O1xuICAgIGxvYWRlZFJhY3RpdmUuZGVjb3JhdG9ycy5jc3NyZXNldCA9IGNzc1Jlc2V0RGVjb3JhdG9yOyAvLyBNYWtlIG91ciBjc3MgcmVzZXQgZGVjb3JhdG9yIGF2YWlsYWJsZSB0byBhbGwgaW5zdGFuY2VzXG4gICAgbG9hZGVkUmFjdGl2ZS5ldmVudHMudGFwID0gUmFjdGl2ZUV2ZW50c1RhcDsgLy8gTWFrZSB0aGUgJ29uLXRhcCcgZXZlbnQgcGx1Z2luIGF2YWlsYWJsZSB0byBhbGwgaW5zdGFuY2VzXG4gICAgbG9hZGVkUmFjdGl2ZS5kZWZhdWx0cy5kYXRhLmdldE1lc3NhZ2UgPSBNZXNzYWdlcy5nZXRNZXNzYWdlOyAvLyBNYWtlIGdldE1lc3NhZ2UgYXZhaWxhYmxlIHRvIGFsbCBpbnN0YW5jZXNcbiAgICBsb2FkZWRSYWN0aXZlLmRlZmF1bHRzLnR3b3dheSA9IGZhbHNlOyAvLyBDaGFuZ2UgdGhlIGRlZmF1bHQgdG8gZGlzYWJsZSB0d28td2F5IGRhdGEgYmluZGluZ3MuXG4gICAgbm90aWZ5Q2FsbGJhY2tzKCk7XG59XG5cbmZ1bmN0aW9uIGNzc1Jlc2V0RGVjb3JhdG9yKG5vZGUpIHtcbiAgICB0YWdDaGlsZHJlbihub2RlLCAnYW50ZW5uYS1yZXNldCcpO1xuICAgIHJldHVybiB7IHRlYXJkb3duOiBmdW5jdGlvbigpIHt9IH07XG59XG5cbmZ1bmN0aW9uIHRhZ0NoaWxkcmVuKGVsZW1lbnQsIGNsYXp6KSB7XG4gICAgaWYgKGVsZW1lbnQuY2hpbGRyZW4pIHsgLy8gU2FmYXJpIHJldHVybnMgdW5kZWZpbmVkIHdoZW4gYXNraW5nIGZvciBjaGlsZHJlbiBvbiBhbiBTVkcgZWxlbWVudFxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGVsZW1lbnQuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHRhZ0NoaWxkcmVuKGVsZW1lbnQuY2hpbGRyZW5baV0sIGNsYXp6KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAkKGVsZW1lbnQpLmFkZENsYXNzKGNsYXp6KTtcbn1cblxuZnVuY3Rpb24gbm90aWZ5Q2FsbGJhY2tzKCkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2FsbGJhY2tzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNhbGxiYWNrc1tpXShsb2FkZWRSYWN0aXZlKTtcbiAgICB9XG4gICAgY2FsbGJhY2tzID0gW107XG59XG5cbi8vIFJlZ2lzdGVycyB0aGUgZ2l2ZW4gY2FsbGJhY2sgdG8gYmUgbm90aWZpZWQgd2hlbiBvdXIgdmVyc2lvbiBvZiBSYWN0aXZlIGlzIGxvYWRlZC5cbmZ1bmN0aW9uIG9uTG9hZChjYWxsYmFjaykge1xuICAgIGlmIChsb2FkZWRSYWN0aXZlKSB7XG4gICAgICAgIGNhbGxiYWNrKGxvYWRlZFJhY3RpdmUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGNhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKTtcbiAgICB9XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBhYm91dFRvTG9hZDogYWJvdXRUb0xvYWQsXG4gICAgbG9hZGVkOiBsb2FkZWQsXG4gICAgb25Mb2FkOiBvbkxvYWRcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG52YXIgcmFuZ3k7IHJlcXVpcmUoJy4vcmFuZ3ktcHJvdmlkZXInKS5vbkxvYWQoZnVuY3Rpb24obG9hZGVkUmFuZ3kpIHsgcmFuZ3kgPSBsb2FkZWRSYW5neTsgfSk7XG5cbnZhciBoaWdobGlnaHRDbGFzcyA9ICdhbnRlbm5hLWhpZ2hsaWdodCc7XG52YXIgaGlnaGxpZ2h0ZWRSYW5nZXMgPSBbXTtcblxudmFyIGNsYXNzQXBwbGllcjtcbmZ1bmN0aW9uIGdldENsYXNzQXBwbGllcigpIHtcbiAgICBpZiAoIWNsYXNzQXBwbGllcikge1xuICAgICAgICBjbGFzc0FwcGxpZXIgPSByYW5neS5jcmVhdGVDbGFzc0FwcGxpZXIoaGlnaGxpZ2h0Q2xhc3MpO1xuICAgIH1cbiAgICByZXR1cm4gY2xhc3NBcHBsaWVyO1xufVxuXG4vLyBSZXR1cm5zIGFuIGFkanVzdGVkIGVuZCBwb2ludCBmb3IgdGhlIHNlbGVjdGlvbiB3aXRoaW4gdGhlIGdpdmVuIG5vZGUsIGFzIHRyaWdnZXJlZCBieSB0aGUgZ2l2ZW4gbW91c2UgdXAgZXZlbnQuXG4vLyBUaGUgcmV0dXJuZWQgcG9pbnQgKHgsIHkpIHRha2VzIGludG8gYWNjb3VudCB0aGUgbG9jYXRpb24gb2YgdGhlIG1vdXNlIHVwIGV2ZW50IGFzIHdlbGwgYXMgdGhlIGRpcmVjdGlvbiBvZiB0aGVcbi8vIHNlbGVjdGlvbiAoZm9yd2FyZC9iYWNrKS5cbmZ1bmN0aW9uIGdldFNlbGVjdGlvbkVuZFBvaW50KG5vZGUsIGV2ZW50LCBleGNsdWRlTm9kZSkge1xuICAgIC8vIFRPRE86IENvbnNpZGVyIHVzaW5nIHRoZSBlbGVtZW50IGNyZWF0ZWQgd2l0aCB0aGUgJ2NsYXNzaWZpZXInIHJhdGhlciB0aGFuIHRoZSBtb3VzZSBsb2NhdGlvblxuICAgIHZhciBzZWxlY3Rpb24gPSByYW5neS5nZXRTZWxlY3Rpb24oKTtcbiAgICBpZiAoaXNWYWxpZFNlbGVjdGlvbihzZWxlY3Rpb24sIG5vZGUsIGV4Y2x1ZGVOb2RlKSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgeDogZXZlbnQucGFnZVggLSAoIHNlbGVjdGlvbi5pc0JhY2t3YXJkcygpID8gLTUgOiA1KSxcbiAgICAgICAgICAgIHk6IGV2ZW50LnBhZ2VZIC0gOCAvLyBUT0RPOiBleGFjdCBjb29yZHNcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbn1cblxuLy8gQXR0ZW1wdHMgdG8gZ2V0IGEgcmFuZ2UgZnJvbSB0aGUgY3VycmVudCBzZWxlY3Rpb24uIFRoaXMgZXhwYW5kcyB0aGVcbi8vIHNlbGVjdGVkIHJlZ2lvbiB0byBpbmNsdWRlIHdvcmQgYm91bmRhcmllcy5cbmZ1bmN0aW9uIGdyYWJTZWxlY3Rpb24obm9kZSwgY2FsbGJhY2ssIGV4Y2x1ZGVOb2RlKSB7XG4gICAgdmFyIHNlbGVjdGlvbiA9IHJhbmd5LmdldFNlbGVjdGlvbigpO1xuICAgIGlmIChpc1ZhbGlkU2VsZWN0aW9uKHNlbGVjdGlvbiwgbm9kZSwgZXhjbHVkZU5vZGUpKSB7XG4gICAgICAgIHNlbGVjdGlvbi5leHBhbmQoJ3dvcmQnLCB7IHRyaW06IHRydWUgfSk7XG4gICAgICAgIGlmIChzZWxlY3Rpb24uY29udGFpbnNOb2RlKGV4Y2x1ZGVOb2RlKSkge1xuICAgICAgICAgICAgdmFyIHJhbmdlID0gc2VsZWN0aW9uLmdldFJhbmdlQXQoMCk7XG4gICAgICAgICAgICByYW5nZS5zZXRFbmRCZWZvcmUoZXhjbHVkZU5vZGUpO1xuICAgICAgICAgICAgc2VsZWN0aW9uLnNldFNpbmdsZVJhbmdlKHJhbmdlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaXNWYWxpZFNlbGVjdGlvbihzZWxlY3Rpb24sIG5vZGUsIGV4Y2x1ZGVOb2RlKSkge1xuICAgICAgICAgICAgdmFyIGxvY2F0aW9uID0gcmFuZ3kuc2VyaWFsaXplU2VsZWN0aW9uKHNlbGVjdGlvbiwgdHJ1ZSwgbm9kZSk7XG4gICAgICAgICAgICB2YXIgdGV4dCA9IHNlbGVjdGlvbi50b1N0cmluZygpO1xuICAgICAgICAgICAgaGlnaGxpZ2h0U2VsZWN0aW9uKHNlbGVjdGlvbik7IC8vIEhpZ2hsaWdodGluZyBkZXNlbGVjdHMgdGhlIHRleHQsIHNvIGRvIHRoaXMgbGFzdC5cbiAgICAgICAgICAgIGNhbGxiYWNrKHRleHQsIGxvY2F0aW9uKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gaXNWYWxpZFNlbGVjdGlvbihzZWxlY3Rpb24sIG5vZGUsIGV4Y2x1ZGVOb2RlKSB7XG4gICAgcmV0dXJuICFzZWxlY3Rpb24uaXNDb2xsYXBzZWQgJiYgIC8vIE5vbi1lbXB0eSBzZWxlY3Rpb25cbiAgICAgICAgc2VsZWN0aW9uLnJhbmdlQ291bnQgPT09IDEgJiYgLy8gU2luZ2xlIHNlbGVjdGlvblxuICAgICAgICAoIWV4Y2x1ZGVOb2RlIHx8ICFzZWxlY3Rpb24uY29udGFpbnNOb2RlKGV4Y2x1ZGVOb2RlLCB0cnVlKSkgJiYgLy8gU2VsZWN0aW9uIGRvZXNuJ3QgY29udGFpbiBhbnl0aGluZyB3ZSd2ZSBzYWlkIHdlIGRvbid0IHdhbnQgKGUuZy4gdGhlIGluZGljYXRvcilcbiAgICAgICAgbm9kZS5jb250YWlucyhzZWxlY3Rpb24uZ2V0UmFuZ2VBdCgwKS5jb21tb25BbmNlc3RvckNvbnRhaW5lcik7IC8vIFNlbGVjdGlvbiBpcyBjb250YWluZWQgZW50aXJlbHkgd2l0aGluIHRoZSBub2RlXG59XG5cbmZ1bmN0aW9uIGdyYWJOb2RlKG5vZGUsIGNhbGxiYWNrKSB7XG4gICAgdmFyIHJhbmdlID0gcmFuZ3kuY3JlYXRlUmFuZ2UoZG9jdW1lbnQpO1xuICAgIHJhbmdlLnNlbGVjdE5vZGVDb250ZW50cyhub2RlKTtcbiAgICB2YXIgJGV4Y2x1ZGVkID0gJChub2RlKS5maW5kKCcuYW50ZW5uYS10ZXh0LWluZGljYXRvci13aWRnZXQnKTtcbiAgICBpZiAoJGV4Y2x1ZGVkLnNpemUoKSA+IDApIHsgLy8gUmVtb3ZlIHRoZSBpbmRpY2F0b3IgZnJvbSB0aGUgZW5kIG9mIHRoZSBzZWxlY3RlZCByYW5nZS5cbiAgICAgICAgcmFuZ2Uuc2V0RW5kQmVmb3JlKCRleGNsdWRlZC5nZXQoMCkpO1xuICAgIH1cbiAgICB2YXIgc2VsZWN0aW9uID0gcmFuZ3kuZ2V0U2VsZWN0aW9uKCk7XG4gICAgc2VsZWN0aW9uLnNldFNpbmdsZVJhbmdlKHJhbmdlKTtcbiAgICB2YXIgbG9jYXRpb24gPSByYW5neS5zZXJpYWxpemVTZWxlY3Rpb24oc2VsZWN0aW9uLCB0cnVlLCBub2RlKTtcbiAgICB2YXIgdGV4dCA9IHNlbGVjdGlvbi50b1N0cmluZygpO1xuICAgIGlmICh0ZXh0LnRyaW0oKS5sZW5ndGggPiAwKSB7XG4gICAgICAgIGhpZ2hsaWdodFNlbGVjdGlvbihzZWxlY3Rpb24pOyAvLyBIaWdobGlnaHRpbmcgZGVzZWxlY3RzIHRoZSB0ZXh0LCBzbyBkbyB0aGlzIGxhc3QuXG4gICAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICAgICAgY2FsbGJhY2sodGV4dCwgbG9jYXRpb24pO1xuICAgICAgICB9XG4gICAgfVxuICAgIHNlbGVjdGlvbi5yZW1vdmVBbGxSYW5nZXMoKTsgLy8gRG9uJ3QgYWN0dWFsbHkgbGVhdmUgdGhlIGVsZW1lbnQgc2VsZWN0ZWQuXG4gICAgc2VsZWN0aW9uLnJlZnJlc2goKTtcbn1cblxuLy8gSGlnaGxpZ2h0cyB0aGUgZ2l2ZW4gbG9jYXRpb24gaW5zaWRlIHRoZSBnaXZlbiBub2RlLlxuZnVuY3Rpb24gaGlnaGxpZ2h0TG9jYXRpb24obm9kZSwgbG9jYXRpb24pIHtcbiAgICAvLyBUT0RPIGVycm9yIGhhbmRsaW5nIGluIGNhc2UgdGhlIHJhbmdlIGlzIG5vdCB2YWxpZD9cbiAgICBpZiAocmFuZ3kuY2FuRGVzZXJpYWxpemVSYW5nZShsb2NhdGlvbiwgbm9kZSwgZG9jdW1lbnQpKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB2YXIgcmFuZ2UgPSByYW5neS5kZXNlcmlhbGl6ZVJhbmdlKGxvY2F0aW9uLCBub2RlLCBkb2N1bWVudCk7XG4gICAgICAgICAgICBoaWdobGlnaHRSYW5nZShyYW5nZSk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAvLyBUT0RPOiBDb25zaWRlciBsb2dnaW5nIHNvbWUga2luZCBvZiBldmVudCBzZXJ2ZXItc2lkZT9cbiAgICAgICAgICAgIC8vIFRPRE86IENvbnNpZGVyIGhpZ2hsaWdodGluZyB0aGUgd2hvbGUgbm9kZT8gT3IgaXMgaXQgYmV0dGVyIHRvIGp1c3QgaGlnaGxpZ2h0IG5vdGhpbmc/XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGhpZ2hsaWdodFNlbGVjdGlvbihzZWxlY3Rpb24pIHtcbiAgICBoaWdobGlnaHRSYW5nZShzZWxlY3Rpb24uZ2V0UmFuZ2VBdCgwKSk7XG59XG5cbmZ1bmN0aW9uIGhpZ2hsaWdodFJhbmdlKHJhbmdlKSB7XG4gICAgZ2V0Q2xhc3NBcHBsaWVyKCkuYXBwbHlUb1JhbmdlKHJhbmdlKTtcbiAgICBoaWdobGlnaHRlZFJhbmdlcy5wdXNoKHJhbmdlKTtcbn1cblxuLy8gQ2xlYXJzIGFsbCBoaWdobGlnaHRzIHRoYXQgaGF2ZSBiZWVuIGNyZWF0ZWQgb24gdGhlIHBhZ2UuXG5mdW5jdGlvbiBjbGVhckhpZ2hsaWdodHMoKSB7XG4gICAgdmFyIGNsYXNzQXBwbGllciA9IGdldENsYXNzQXBwbGllcigpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaGlnaGxpZ2h0ZWRSYW5nZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIHJhbmdlID0gaGlnaGxpZ2h0ZWRSYW5nZXNbaV07XG4gICAgICAgIGlmIChjbGFzc0FwcGxpZXIuaXNBcHBsaWVkVG9SYW5nZShyYW5nZSkpIHtcbiAgICAgICAgICAgIGNsYXNzQXBwbGllci51bmRvVG9SYW5nZShyYW5nZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaGlnaGxpZ2h0ZWRSYW5nZXMgPSBbXTtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGdldFNlbGVjdGlvbkVuZFBvaW50OiBnZXRTZWxlY3Rpb25FbmRQb2ludCxcbiAgICBncmFiU2VsZWN0aW9uOiBncmFiU2VsZWN0aW9uLFxuICAgIGdyYWJOb2RlOiBncmFiTm9kZSxcbiAgICBjbGVhckhpZ2hsaWdodHM6IGNsZWFySGlnaGxpZ2h0cyxcbiAgICBoaWdobGlnaHQ6IGhpZ2hsaWdodExvY2F0aW9uLFxuICAgIEhJR0hMSUdIVF9TRUxFQ1RPUjogJy4nICsgaGlnaGxpZ2h0Q2xhc3Ncbn07IiwiXG52YXIgbm9Db25mbGljdDtcbnZhciBsb2FkZWRSYW5neTtcbnZhciBjYWxsYmFja3MgPSBbXTtcblxuLy8gQ2FwdHVyZSBhbnkgZ2xvYmFsIGluc3RhbmNlIG9mIHJhbmd5IHdoaWNoIGFscmVhZHkgZXhpc3RzIGJlZm9yZSB3ZSBsb2FkIG91ciBvd24uXG5mdW5jdGlvbiBhYm91dFRvTG9hZCgpIHtcbiAgICBub0NvbmZsaWN0ID0gd2luZG93LnJhbmd5O1xufVxuXG4vLyBSZXN0b3JlIHRoZSBnbG9iYWwgaW5zdGFuY2Ugb2YgcmFuZ3kgKGlmIGFueSkgYW5kIHBhc3Mgb3V0IG91ciB2ZXJzaW9uIHRvIG91ciBjYWxsYmFja3NcbmZ1bmN0aW9uIGxvYWRlZCgpIHtcbiAgICBsb2FkZWRSYW5neSA9IHJhbmd5O1xuICAgIGxvYWRlZFJhbmd5LmluaXQoKTtcbiAgICB3aW5kb3cucmFuZ3kgPSBub0NvbmZsaWN0O1xuICAgIG5vdGlmeUNhbGxiYWNrcygpO1xufVxuXG5mdW5jdGlvbiBub3RpZnlDYWxsYmFja3MoKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjYWxsYmFja3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY2FsbGJhY2tzW2ldKGxvYWRlZFJhbmd5KTtcbiAgICB9XG4gICAgY2FsbGJhY2tzID0gW107XG59XG5cbi8vIFJlZ2lzdGVycyB0aGUgZ2l2ZW4gY2FsbGJhY2sgdG8gYmUgbm90aWZpZWQgd2hlbiBvdXIgdmVyc2lvbiBvZiBSYW5neSBpcyBsb2FkZWQuXG5mdW5jdGlvbiBvbkxvYWQoY2FsbGJhY2spIHtcbiAgICBpZiAobG9hZGVkUmFuZ3kpIHtcbiAgICAgICAgY2FsbGJhY2sobG9hZGVkUmFuZ3kpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGNhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKTtcbiAgICB9XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBhYm91dFRvTG9hZDogYWJvdXRUb0xvYWQsXG4gICAgbG9hZGVkOiBsb2FkZWQsXG4gICAgb25Mb2FkOiBvbkxvYWRcbn07IiwidmFyICQ7IHJlcXVpcmUoJy4vanF1ZXJ5LXByb3ZpZGVyJykub25Mb2FkKGZ1bmN0aW9uKGpRdWVyeSkgeyAkPWpRdWVyeTsgfSk7XG5cbnZhciBDTEFTU19GVUxMID0gJ2FudGVubmEtZnVsbCc7XG52YXIgQ0xBU1NfSEFMRiA9ICdhbnRlbm5hLWhhbGYnO1xuXG5mdW5jdGlvbiBjb21wdXRlTGF5b3V0RGF0YShyZWFjdGlvbnNEYXRhKSB7XG4gICAgdmFyIG51bVJlYWN0aW9ucyA9IHJlYWN0aW9uc0RhdGEubGVuZ3RoO1xuICAgIGlmIChudW1SZWFjdGlvbnMgPT0gMCkge1xuICAgICAgICByZXR1cm4ge307IC8vIFRPRE8gY2xlYW4gdGhpcyB1cFxuICAgIH1cbiAgICAvLyBUT0RPOiBDb3BpZWQgY29kZSBmcm9tIGVuZ2FnZV9mdWxsLmNyZWF0ZVRhZ0J1Y2tldHNcbiAgICB2YXIgbWF4ID0gcmVhY3Rpb25zRGF0YVswXS5jb3VudDtcbiAgICB2YXIgbWVkaWFuID0gcmVhY3Rpb25zRGF0YVsgTWF0aC5mbG9vcihyZWFjdGlvbnNEYXRhLmxlbmd0aC8yKSBdLmNvdW50O1xuICAgIHZhciBtaW4gPSByZWFjdGlvbnNEYXRhWyByZWFjdGlvbnNEYXRhLmxlbmd0aC0xIF0uY291bnQ7XG4gICAgdmFyIHRvdGFsID0gMDtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG51bVJlYWN0aW9uczsgaSsrKSB7XG4gICAgICAgIHRvdGFsICs9IHJlYWN0aW9uc0RhdGFbaV0uY291bnQ7XG4gICAgfVxuICAgIHZhciBhdmVyYWdlID0gTWF0aC5mbG9vcih0b3RhbCAvIG51bVJlYWN0aW9ucyk7XG4gICAgdmFyIG1pZFZhbHVlID0gKCBtZWRpYW4gPiBhdmVyYWdlICkgPyBtZWRpYW4gOiBhdmVyYWdlO1xuXG4gICAgdmFyIGxheW91dENsYXNzZXMgPSBbXTtcbiAgICB2YXIgbnVtSGFsZnNpZXMgPSAwO1xuICAgIHZhciBudW1GdWxsID0gMDtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG51bVJlYWN0aW9uczsgaSsrKSB7XG4gICAgICAgIGlmIChyZWFjdGlvbnNEYXRhW2ldLmNvdW50ID4gbWlkVmFsdWUpIHtcbiAgICAgICAgICAgIGxheW91dENsYXNzZXNbaV0gPSBDTEFTU19GVUxMO1xuICAgICAgICAgICAgbnVtRnVsbCsrO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbGF5b3V0Q2xhc3Nlc1tpXSA9IENMQVNTX0hBTEY7XG4gICAgICAgICAgICBudW1IYWxmc2llcysrO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChudW1IYWxmc2llcyAlIDIgIT09MCkge1xuICAgICAgICBsYXlvdXRDbGFzc2VzW251bVJlYWN0aW9ucyAtIDFdID0gQ0xBU1NfRlVMTDsgLy8gSWYgdGhlcmUgYXJlIGFuIG9kZCBudW1iZXIsIHRoZSBsYXN0IG9uZSBnb2VzIGZ1bGwuXG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgbGF5b3V0Q2xhc3NlczogbGF5b3V0Q2xhc3Nlc1xuICAgIH07XG59XG5cbmZ1bmN0aW9uIHNpemVSZWFjdGlvblRleHRUb0ZpdCgkcmVhY3Rpb25zV2luZG93KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIHNpemVSZWFjdGlvblRleHRUb0ZpdChub2RlKSB7XG4gICAgICAgIHZhciAkZWxlbWVudCA9ICQobm9kZSk7XG4gICAgICAgIHZhciBvcmlnaW5hbERpc3BsYXkgPSAkcmVhY3Rpb25zV2luZG93LmNzcygnZGlzcGxheScpO1xuICAgICAgICBpZiAob3JpZ2luYWxEaXNwbGF5ID09PSAnbm9uZScpIHsgLy8gSWYgd2UncmUgc2l6aW5nIHRoZSBib3hlcyBiZWZvcmUgdGhlIHdpZGdldCBpcyBkaXNwbGF5ZWQsIHRlbXBvcmFyaWx5IGRpc3BsYXkgaXQgb2Zmc2NyZWVuLlxuICAgICAgICAgICAgJHJlYWN0aW9uc1dpbmRvdy5jc3Moe2Rpc3BsYXk6ICdibG9jaycsIGxlZnQ6ICcxMDAlJ30pO1xuICAgICAgICB9XG4gICAgICAgIHZhciBob3Jpem9udGFsUmF0aW8gPSBub2RlLmNsaWVudFdpZHRoIC8gbm9kZS5zY3JvbGxXaWR0aDtcbiAgICAgICAgaWYgKGhvcml6b250YWxSYXRpbyA8IDEuMCkgeyAvLyBJZiB0aGUgdGV4dCBkb2Vzbid0IGZpdCwgZmlyc3QgdHJ5IHRvIHdyYXAgaXQgdG8gdHdvIGxpbmVzLiBUaGVuIHNjYWxlIGl0IGRvd24gaWYgc3RpbGwgbmVjZXNzYXJ5LlxuICAgICAgICAgICAgdmFyIHRleHQgPSBub2RlLmlubmVySFRNTDtcbiAgICAgICAgICAgIHZhciBtaWQgPSBNYXRoLmNlaWwodGV4dC5sZW5ndGggLyAyKTsgLy8gTG9vayBmb3IgdGhlIGNsb3Nlc3Qgc3BhY2UgdG8gdGhlIG1pZGRsZSwgd2VpZ2h0ZWQgc2xpZ2h0bHkgKE1hdGguY2VpbCkgdG93YXJkIGEgc3BhY2UgaW4gdGhlIHNlY29uZCBoYWxmLlxuICAgICAgICAgICAgdmFyIHNlY29uZEhhbGZJbmRleCA9IHRleHQuaW5kZXhPZignICcsIG1pZCk7XG4gICAgICAgICAgICB2YXIgZmlyc3RIYWxmSW5kZXggPSB0ZXh0Lmxhc3RJbmRleE9mKCcgJywgbWlkKTtcbiAgICAgICAgICAgIHZhciBzcGxpdEluZGV4ID0gTWF0aC5hYnMoc2Vjb25kSGFsZkluZGV4IC0gbWlkKSA8IE1hdGguYWJzKG1pZCAtIGZpcnN0SGFsZkluZGV4KSA/IHNlY29uZEhhbGZJbmRleCA6IGZpcnN0SGFsZkluZGV4O1xuICAgICAgICAgICAgdmFyIHZlcnRpY2FsUmF0aW87XG4gICAgICAgICAgICBpZiAoc3BsaXRJbmRleCA+IDEpIHtcbiAgICAgICAgICAgICAgICAvLyBTcGxpdCB0aGUgdGV4dCBhbmQgdGhlbiBzZWUgaG93IGl0IGZpdHMuXG4gICAgICAgICAgICAgICAgbm9kZS5pbm5lckhUTUwgPSB0ZXh0LnNsaWNlKDAsIHNwbGl0SW5kZXgpICsgJzxicj4nICsgdGV4dC5zbGljZShzcGxpdEluZGV4KTtcbiAgICAgICAgICAgICAgICB2YXIgd3JhcHBlZEhvcml6b250YWxSYXRpbyA9IG5vZGUuY2xpZW50V2lkdGggLyBub2RlLnNjcm9sbFdpZHRoO1xuICAgICAgICAgICAgICAgIHZhciBwYXJlbnRBdmFpbGFibGVIZWlnaHQgPSBjb21wdXRlQXZhaWxhYmxlQ2xpZW50QXJlYShub2RlLnBhcmVudE5vZGUpO1xuICAgICAgICAgICAgICAgIHZlcnRpY2FsUmF0aW8gPSBub2RlLnNjcm9sbEhlaWdodCAvIHBhcmVudEF2YWlsYWJsZUhlaWdodDtcblxuICAgICAgICAgICAgICAgIHZhciB2ZXJ0aWNhbFJhdGlvTWF4ID0gMC40O1xuICAgICAgICAgICAgICAgIGlmICh2ZXJ0aWNhbFJhdGlvICYmIHZlcnRpY2FsUmF0aW8gPiB2ZXJ0aWNhbFJhdGlvTWF4KSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzY2FsZUZhY3RvciA9IHZlcnRpY2FsUmF0aW9NYXggLyB2ZXJ0aWNhbFJhdGlvO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAod3JhcHBlZEhvcml6b250YWxSYXRpbyA8IDEuMCkge1xuICAgICAgICAgICAgICAgICAgICBzY2FsZUZhY3RvciA9IE1hdGgubWluKHNjYWxlRmFjdG9yLCB3cmFwcGVkSG9yaXpvbnRhbFJhdGlvKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHNjYWxlRmFjdG9yIDw9IGhvcml6b250YWxSYXRpbykge1xuICAgICAgICAgICAgICAgICAgICAvLyBJZiB3ZSBlbmRlZCB1cCBoYXZpbmcgdG8gbWFrZSB0aGUgdGV4dCBzbWFsbFxuICAgICAgICAgICAgICAgICAgICBub2RlLmlubmVySFRNTCA9IHRleHQ7XG4gICAgICAgICAgICAgICAgICAgIHNjYWxlRmFjdG9yID0gaG9yaXpvbnRhbFJhdGlvO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAkZWxlbWVudC5jc3MoJ2ZvbnQtc2l6ZScsIE1hdGgubWF4KDEwLCBNYXRoLmZsb29yKHBhcnNlSW50KCRlbGVtZW50LmNzcygnZm9udC1zaXplJykpICogc2NhbGVGYWN0b3IpIC0gMSkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAkZWxlbWVudC5jc3MoJ2ZvbnQtc2l6ZScsIE1hdGgubWF4KDEwLCBNYXRoLmZsb29yKHBhcnNlSW50KCRlbGVtZW50LmNzcygnZm9udC1zaXplJykpICogaG9yaXpvbnRhbFJhdGlvKSAtIDEpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAob3JpZ2luYWxEaXNwbGF5ID09PSAnbm9uZScpIHtcbiAgICAgICAgICAgICRyZWFjdGlvbnNXaW5kb3cuY3NzKHtkaXNwbGF5OiAnJywgbGVmdDogJyd9KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdGVhcmRvd246IGZ1bmN0aW9uKCkge31cbiAgICAgICAgfTtcbiAgICB9O1xufVxuXG5mdW5jdGlvbiBjb21wdXRlQXZhaWxhYmxlQ2xpZW50QXJlYShub2RlKSB7XG4gICAgdmFyIG5vZGVTdHlsZSA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKG5vZGUpO1xuICAgIHJldHVybiBwYXJzZUludChub2RlU3R5bGUuaGVpZ2h0KSAtIHBhcnNlSW50KG5vZGVTdHlsZS5wYWRkaW5nVG9wKSAtIHBhcnNlSW50KG5vZGVTdHlsZS5wYWRkaW5nQm90dG9tKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgc2l6ZVRvRml0OiBzaXplUmVhY3Rpb25UZXh0VG9GaXQsXG4gICAgY29tcHV0ZUxheW91dERhdGE6IGNvbXB1dGVMYXlvdXREYXRhXG59OyIsInZhciBDYWxsYmFja1N1cHBvcnQgPSByZXF1aXJlKCcuL2NhbGxiYWNrLXN1cHBvcnQnKTtcblxuLy8gVGhpcyBtb2R1bGUgYWxsb3dzIHVzIHRvIHJlZ2lzdGVyIGNhbGxiYWNrcyB0aGF0IGFyZSB0aHJvdHRsZWQgaW4gdGhlaXIgZnJlcXVlbmN5LiBUaGlzIGlzIHVzZWZ1bCBmb3IgZXZlbnRzIGxpa2Vcbi8vIHJlc2l6ZSBhbmQgc2Nyb2xsLCB3aGljaCBjYW4gYmUgZmlyZWQgYXQgYW4gZXh0cmVtZWx5IGhpZ2ggcmF0ZS5cblxudmFyIHRocm90dGxlZExpc3RlbmVycyA9IHt9O1xuXG5mdW5jdGlvbiBvbih0eXBlLCBjYWxsYmFjaykge1xuICAgIHRocm90dGxlZExpc3RlbmVyc1t0eXBlXSA9IHRocm90dGxlZExpc3RlbmVyc1t0eXBlXSB8fCBjcmVhdGVUaHJvdHRsZWRMaXN0ZW5lcih0eXBlKTtcbiAgICB0aHJvdHRsZWRMaXN0ZW5lcnNbdHlwZV0uYWRkQ2FsbGJhY2soY2FsbGJhY2spO1xufVxuXG5mdW5jdGlvbiBvZmYodHlwZSwgY2FsbGJhY2spIHtcbiAgICB2YXIgZXZlbnRMaXN0ZW5lciA9IHRocm90dGxlZExpc3RlbmVyc1t0eXBlXTtcbiAgICBpZiAoZXZlbnRMaXN0ZW5lcikge1xuICAgICAgICBldmVudExpc3RlbmVyLnJlbW92ZUNhbGxiYWNrKGNhbGxiYWNrKTtcbiAgICAgICAgaWYgKGV2ZW50TGlzdGVuZXIuaXNFbXB0eSgpKSB7XG4gICAgICAgICAgICBldmVudExpc3RlbmVyLnRlYXJkb3duKCk7XG4gICAgICAgICAgICBkZWxldGUgdGhyb3R0bGVkTGlzdGVuZXJzW3R5cGVdO1xuICAgICAgICB9XG4gICAgfVxufVxuXG4vLyBDcmVhdGVzIGEgbGlzdGVuZXIgb24gdGhlIHBhcnRpY3VsYXIgZXZlbnQgdHlwZS4gQ2FsbGJhY2tzIGFkZGVkIHRvIHRoaXMgbGlzdGVuZXIgd2lsbCBiZSB0aHJvdHRsZWQuXG5mdW5jdGlvbiBjcmVhdGVUaHJvdHRsZWRMaXN0ZW5lcih0eXBlKSB7XG4gICAgdmFyIGNhbGxiYWNrcyA9IENhbGxiYWNrU3VwcG9ydC5jcmVhdGUoKTtcbiAgICB2YXIgZXZlbnRUaW1lb3V0O1xuICAgIHNldHVwKCk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgYWRkQ2FsbGJhY2s6IGNhbGxiYWNrcy5hZGQsXG4gICAgICAgIHJlbW92ZUNhbGxiYWNrOiBjYWxsYmFja3MucmVtb3ZlLFxuICAgICAgICBpc0VtcHR5OiBjYWxsYmFja3MuaXNFbXB0eSxcbiAgICAgICAgdGVhcmRvd246IHRlYXJkb3duXG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIGhhbmRsZUV2ZW50KCkge1xuICAgICAgIGlmICghZXZlbnRUaW1lb3V0KSB7XG4gICAgICAgICAgIGV2ZW50VGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICBjYWxsYmFja3MuaW52b2tlQWxsKCk7XG4gICAgICAgICAgICAgICBldmVudFRpbWVvdXQgPSBudWxsO1xuICAgICAgICAgICB9LCA2Nik7IC8vIDE1IEZQU1xuICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzZXR1cCgpIHtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIodHlwZSwgaGFuZGxlRXZlbnQpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHRlYXJkb3duKCkge1xuICAgICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcih0eXBlLCBoYW5kbGVFdmVudCk7XG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgb246IG9uLFxuICAgIG9mZjogb2ZmXG59OyIsIlxuLy8gU2V0cyB1cCB0aGUgZ2l2ZW4gZWxlbWVudCB0byBiZSBjYWxsZWQgd2l0aCBhIFRvdWNoRXZlbnQgdGhhdCB3ZSByZWNvZ25pemUgYXMgYSB0YXAuXG5mdW5jdGlvbiBzZXR1cFRvdWNoVGFwRXZlbnRzKGVsZW1lbnQsIGNhbGxiYWNrKSB7XG4gICAgdmFyIHRpbWVvdXQgPSA0MDA7IC8vIFRoaXMgaXMgdGhlIHRpbWUgYmV0d2VlbiB0b3VjaHN0YXJ0IGFuZCB0b3VjaGVuZCB0aGF0IHdlIHVzZSB0byBkaXN0aW5ndWlzaCBhIHRhcCBmcm9tIGEgbG9uZyBwcmVzcy5cbiAgICB2YXIgdmFsaWRUYXAgPSBmYWxzZTtcbiAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0b3VjaFN0YXJ0KTtcbiAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIHRvdWNoTW92ZSk7XG4gICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGNhbmNlbCcsIHRvdWNoQ2FuY2VsKTtcbiAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgdG91Y2hFbmQpO1xuICAgIHJldHVybiB7XG4gICAgICAgIHRlYXJkb3duOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRvdWNoU3RhcnQpO1xuICAgICAgICAgICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCB0b3VjaE1vdmUpO1xuICAgICAgICAgICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaGNhbmNlbCcsIHRvdWNoQ2FuY2VsKTtcbiAgICAgICAgICAgIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCB0b3VjaEVuZCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gdG91Y2hTdGFydChldmVudCkge1xuICAgICAgICB2YWxpZFRhcCA9IHRydWU7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YWxpZFRhcCA9IGZhbHNlO1xuICAgICAgICB9LCB0aW1lb3V0KTtcbiAgICB9XG4gICAgZnVuY3Rpb24gdG91Y2hFbmQoZXZlbnQpIHtcbiAgICAgICAgaWYgKHZhbGlkVGFwICYmIGV2ZW50LmNoYW5nZWRUb3VjaGVzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgY2FsbGJhY2soZXZlbnQpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIHRvdWNoTW92ZShldmVudCkge1xuICAgICAgICB2YWxpZFRhcCA9IGZhbHNlO1xuICAgIH1cbiAgICBmdW5jdGlvbiB0b3VjaENhbmNlbChldmVudCkge1xuICAgICAgICB2YWxpZFRhcCA9IGZhbHNlO1xuICAgIH1cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHNldHVwVGFwOiBzZXR1cFRvdWNoVGFwRXZlbnRzXG59OyIsIlxuXG5mdW5jdGlvbiB0b2dnbGVUcmFuc2l0aW9uQ2xhc3MoJGVsZW1lbnQsIGNsYXNzTmFtZSwgc3RhdGUsIG5leHRTdGVwKSB7XG4gICAgJGVsZW1lbnQub24oXCJ0cmFuc2l0aW9uZW5kIHdlYmtpdFRyYW5zaXRpb25FbmQgb1RyYW5zaXRpb25FbmQgTVNUcmFuc2l0aW9uRW5kXCIsXG4gICAgICAgIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICAvLyBvbmNlIHRoZSBDU1MgdHJhbnNpdGlvbiBpcyBjb21wbGV0ZSwgY2FsbCBvdXIgbmV4dCBzdGVwXG4gICAgICAgICAgICAvLyBTZWU6IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvOTI1NTI3OS9jYWxsYmFjay13aGVuLWNzczMtdHJhbnNpdGlvbi1maW5pc2hlc1xuICAgICAgICAgICAgaWYgKGV2ZW50LnRhcmdldCA9PSBldmVudC5jdXJyZW50VGFyZ2V0KSB7XG4gICAgICAgICAgICAgICAgJGVsZW1lbnQub2ZmKFwidHJhbnNpdGlvbmVuZCB3ZWJraXRUcmFuc2l0aW9uRW5kIG9UcmFuc2l0aW9uRW5kIE1TVHJhbnNpdGlvbkVuZFwiKTtcbiAgICAgICAgICAgICAgICBpZiAobmV4dFN0ZXApIHtcbiAgICAgICAgICAgICAgICAgICAgbmV4dFN0ZXAoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICApO1xuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIFRoaXMgd29ya2Fyb3VuZCBnZXRzIHVzIGNvbnNpc3RlbnQgdHJhbnNpdGlvbmVuZCBldmVudHMsIHdoaWNoIGNhbiBvdGhlcndpc2UgYmUgZmxha3kgaWYgd2UncmUgc2V0dGluZyBvdGhlclxuICAgICAgICAvLyBjbGFzc2VzIGF0IHRoZSBzYW1lIHRpbWUgYXMgdHJhbnNpdGlvbiBjbGFzc2VzLlxuICAgICAgICAkZWxlbWVudC50b2dnbGVDbGFzcyhjbGFzc05hbWUsIHN0YXRlKTtcbiAgICB9LCAyMCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHRvZ2dsZUNsYXNzOiB0b2dnbGVUcmFuc2l0aW9uQ2xhc3Ncbn07IiwidmFyIFBST0RfU0VSVkVSX1VSTCA9IFwiaHR0cHM6Ly93d3cuYW50ZW5uYS5pc1wiOyAvLyBUT0RPOiB3d3c/IGhvdyBhYm91dCBhbnRlbm5hLmlzIG9yIGFwaS5hbnRlbm5hLmlzP1xudmFyIERFVl9TRVJWRVJfVVJMID0gd2luZG93LmxvY2F0aW9uLnByb3RvY29sICsgXCIvL2xvY2FsLXN0YXRpYy5hbnRlbm5hLmlzOjgwODFcIjtcbnZhciBURVNUX1NFUlZFUl9VUkwgPSB3aW5kb3cubG9jYXRpb24ucHJvdG9jb2wgKyAnLy9sb2NhbGhvc3Q6MzAwMSc7XG5cbnZhciBQUk9EX0VWRU5UX1NFUlZFUl9VUkwgPSB3aW5kb3cubG9jYXRpb24ucHJvdG9jb2wgKyAnLy9ldmVudHMucmVhZHJib2FyZC5jb20nOyAvLyBUT0RPOiB1cGRhdGUgdG8gZXZlbnRzLmFudGVubmEuaXNcbnZhciBERVZfRVZFTlRfU0VSVkVSX1VSTCA9IHdpbmRvdy5sb2NhdGlvbi5wcm90b2NvbCArICcvL25vZGVicS5kb2NrZXI6MzAwMCc7XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBQUk9EVUNUSU9OOiBQUk9EX1NFUlZFUl9VUkwsXG4gICAgREVWRUxPUE1FTlQ6IERFVl9TRVJWRVJfVVJMLFxuICAgIFRFU1Q6IFRFU1RfU0VSVkVSX1VSTCxcbiAgICBQUk9EVUNUSU9OX0VWRU5UUzogUFJPRF9FVkVOVF9TRVJWRVJfVVJMLFxuICAgIERFVkVMT1BNRU5UX0VWRU5UUzogREVWX0VWRU5UX1NFUlZFUl9VUkxcbn07IiwidmFyIEFwcE1vZGUgPSByZXF1aXJlKCcuL2FwcC1tb2RlJyk7XG52YXIgVVJMQ29uc3RhbnRzID0gcmVxdWlyZSgnLi91cmwtY29uc3RhbnRzJyk7XG5cbmZ1bmN0aW9uIGdldEdyb3VwU2V0dGluZ3NVcmwoKSB7XG4gICAgcmV0dXJuICcvYXBpL3NldHRpbmdzLyc7XG59XG5cbmZ1bmN0aW9uIGdldFBhZ2VEYXRhVXJsKCkge1xuICAgIHJldHVybiAnL2FwaS9wYWdlbmV3ZXIvJztcbn1cblxuZnVuY3Rpb24gZ2V0Q3JlYXRlUmVhY3Rpb25VcmwoKSB7XG4gICAgcmV0dXJuICcvYXBpL3RhZy9jcmVhdGUvJztcbn1cblxuZnVuY3Rpb24gZ2V0Q3JlYXRlQ29tbWVudFVybCgpIHtcbiAgICByZXR1cm4gJy9hcGkvY29tbWVudC9jcmVhdGUvJztcbn1cblxuZnVuY3Rpb24gZ2V0RmV0Y2hDb21tZW50VXJsKCkge1xuICAgIHJldHVybiAnL2FwaS9jb21tZW50L3JlcGxpZXMvJztcbn1cblxuZnVuY3Rpb24gZ2V0RmV0Y2hDb250ZW50Qm9kaWVzVXJsKCkge1xuICAgIHJldHVybiAnL2FwaS9jb250ZW50L2JvZGllcy8nO1xufVxuXG5mdW5jdGlvbiBnZXRTaGFyZVJlYWN0aW9uVXJsKCkge1xuICAgIHJldHVybiAnL2FwaS9zaGFyZS87J1xufVxuXG5mdW5jdGlvbiBnZXRTaGFyZVdpbmRvd1VybCgpIHtcbiAgICByZXR1cm4gJy9zdGF0aWMvc2hhcmUuaHRtbCc7XG59XG5cbmZ1bmN0aW9uIGdldEV2ZW50VXJsKCkge1xuICAgIHJldHVybiAnL2luc2VydCc7IC8vIE5vdGUgdGhhdCB0aGlzIFVSTCBpcyBmb3IgdGhlIGV2ZW50IHNlcnZlciwgbm90IHRoZSBhcHAgc2VydmVyLlxufVxuXG5mdW5jdGlvbiBnZXRMb2dpblBhZ2VVcmwoKSB7XG4gICAgcmV0dXJuICcvc3RhdGljL3dpZGdldC1uZXcvZmJfbG9naW4uaHRtbCc7XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVJbWFnZVVybCgkZWxlbWVudCwgZ3JvdXBTZXR0aW5ncykge1xuICAgIGlmIChncm91cFNldHRpbmdzLmxlZ2FjeUJlaGF2aW9yKCkpIHtcbiAgICAgICAgcmV0dXJuIGxlZ2FjeUNvbXB1dGVJbWFnZVVybCgkZWxlbWVudCk7XG4gICAgfVxuICAgIHZhciBjb250ZW50ID0gJGVsZW1lbnQuYXR0cignYW50LWl0ZW0tY29udGVudCcpIHx8ICRlbGVtZW50LmF0dHIoJ3NyYycpO1xuICAgIGlmIChjb250ZW50ICYmIGNvbnRlbnQuaW5kZXhPZignLy8nKSAhPT0gMCAmJiBjb250ZW50LmluZGV4T2YoJ2h0dHAnKSAhPT0gMCkgeyAvLyBwcm90b2NvbC1yZWxhdGl2ZSBvciBhYnNvbHV0ZSB1cmwsIGUuZy4gLy9kb21haW4uY29tL2Zvby9iYXIucG5nIG9yIGh0dHA6Ly9kb21haW4uY29tL2Zvby9iYXIvcG5nXG4gICAgICAgIGlmIChjb250ZW50LmluZGV4T2YoJy8nKSA9PT0gMCkgeyAvLyBkb21haW4tcmVsYXRpdmUgdXJsLCBlLmcuIC9mb28vYmFyLnBuZyA9PiBkb21haW4uY29tL2Zvby9iYXIucG5nXG4gICAgICAgICAgICBjb250ZW50ID0gd2luZG93LmxvY2F0aW9uLm9yaWdpbiArIGNvbnRlbnQ7XG4gICAgICAgIH0gZWxzZSB7IC8vIHBhdGgtcmVsYXRpdmUgdXJsLCBlLmcuIGJhci5wbmcgPT4gZG9tYWluLmNvbS9iYXovYmFyLnBuZ1xuICAgICAgICAgICAgdmFyIHBhdGggPSB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWU7XG4gICAgICAgICAgICB2YXIgaW5kZXggPSBwYXRoLmxhc3RJbmRleE9mKCcvJykgKyAxO1xuICAgICAgICAgICAgaWYgKHBhdGgubGVuZ3RoID4gaW5kZXgpIHtcbiAgICAgICAgICAgICAgICBwYXRoID0gcGF0aC5zdWJzdHJpbmcoMCwgaW5kZXgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29udGVudCA9IHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4gKyBwYXRoICsgY29udGVudDtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gY29udGVudDtcbn1cblxuLy8gTGVnYWN5IGltcGxlbWVudGF0aW9uIHdoaWNoIG1haW50YWlucyB0aGUgb2xkIGJlaGF2aW9yIG9mIGVuZ2FnZV9mdWxsXG4vLyBUaGlzIGNvZGUgaXMgd3JvbmcgZm9yIFVSTHMgdGhhdCBzdGFydCB3aXRoIFwiLy9cIi4gSXQgYWxzbyBnaXZlcyBwcmVjZWRlbmNlIHRvIHRoZSBzcmMgYXR0IGluc3RlYWQgb2YgYW50LWl0ZW0tY29udGVudFxuZnVuY3Rpb24gbGVnYWN5Q29tcHV0ZUltYWdlVXJsKCRlbGVtZW50KSB7XG4gICAgdmFyIGNvbnRlbnQgPSAkZWxlbWVudC5hdHRyKCdzcmMnKSB8fCAkZWxlbWVudC5hdHRyKCdhbnQtaXRlbS1jb250ZW50Jyk7XG4gICAgaWYgKGNvbnRlbnQpIHtcbiAgICAgICAgaWYgKGNvbnRlbnQuaW5kZXhPZignLycpID09PSAwKSB7XG4gICAgICAgICAgICBjb250ZW50ID0gd2luZG93LmxvY2F0aW9uLm9yaWdpbiArIGNvbnRlbnQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvbnRlbnQuaW5kZXhPZignaHR0cCcpICE9PSAwKSB7XG4gICAgICAgICAgICBjb250ZW50ID0gd2luZG93LmxvY2F0aW9uLm9yaWdpbiArIHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZSArIGNvbnRlbnQ7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGNvbnRlbnQ7XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVNZWRpYVVybCgkZWxlbWVudCwgZ3JvdXBTZXR0aW5ncykge1xuICAgIGlmIChncm91cFNldHRpbmdzLmxlZ2FjeUJlaGF2aW9yKCkpIHtcbiAgICAgICAgcmV0dXJuIGxlZ2FjeUNvbXB1dGVNZWRpYVVybCgkZWxlbWVudCk7XG4gICAgfVxuICAgIHZhciBjb250ZW50ID0gJGVsZW1lbnQuYXR0cignYW50LWl0ZW0tY29udGVudCcpIHx8ICRlbGVtZW50LmF0dHIoJ3NyYycpIHx8ICRlbGVtZW50LmF0dHIoJ2RhdGEnKTtcbiAgICBpZiAoY29udGVudCAmJiBjb250ZW50LmluZGV4T2YoJy8vJykgIT09IDAgJiYgY29udGVudC5pbmRleE9mKCdodHRwJykgIT09IDApIHsgLy8gcHJvdG9jb2wtcmVsYXRpdmUgb3IgYWJzb2x1dGUgdXJsLCBlLmcuIC8vZG9tYWluLmNvbS9mb28vYmFyLnBuZyBvciBodHRwOi8vZG9tYWluLmNvbS9mb28vYmFyL3BuZ1xuICAgICAgICBpZiAoY29udGVudC5pbmRleE9mKCcvJykgPT09IDApIHsgLy8gZG9tYWluLXJlbGF0aXZlIHVybCwgZS5nLiAvZm9vL2Jhci5wbmcgPT4gZG9tYWluLmNvbS9mb28vYmFyLnBuZ1xuICAgICAgICAgICAgY29udGVudCA9IHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4gKyBjb250ZW50O1xuICAgICAgICB9IGVsc2UgeyAvLyBwYXRoLXJlbGF0aXZlIHVybCwgZS5nLiBiYXIucG5nID0+IGRvbWFpbi5jb20vYmF6L2Jhci5wbmdcbiAgICAgICAgICAgIHZhciBwYXRoID0gd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lO1xuICAgICAgICAgICAgdmFyIGluZGV4ID0gcGF0aC5sYXN0SW5kZXhPZignLycpICsgMTtcbiAgICAgICAgICAgIGlmIChwYXRoLmxlbmd0aCA+IGluZGV4KSB7XG4gICAgICAgICAgICAgICAgcGF0aCA9IHBhdGguc3Vic3RyaW5nKDAsIGluZGV4KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnRlbnQgPSB3aW5kb3cubG9jYXRpb24ub3JpZ2luICsgcGF0aCArIGNvbnRlbnQ7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGNvbnRlbnQ7XG59XG5cbi8vIExlZ2FjeSBpbXBsZW1lbnRhdGlvbiB3aGljaCBtYWludGFpbnMgdGhlIG9sZCBiZWhhdmlvciBvZiBlbmdhZ2VfZnVsbFxuLy8gVGhpcyBjb2RlIGlzIHdyb25nIGZvciBVUkxzIHRoYXQgc3RhcnQgd2l0aCBcIi8vXCIuIEl0IGFsc28gZ2l2ZXMgcHJlY2VkZW5jZSB0byB0aGUgc3JjIGF0dCBpbnN0ZWFkIG9mIGFudC1pdGVtLWNvbnRlbnRcbmZ1bmN0aW9uIGxlZ2FjeUNvbXB1dGVNZWRpYVVybCgkZWxlbWVudCkge1xuICAgIHZhciBjb250ZW50ID0gJGVsZW1lbnQuYXR0cignYW50LWl0ZW0tY29udGVudCcpIHx8ICRlbGVtZW50LmF0dHIoJ3NyYycpIHx8ICRlbGVtZW50LmF0dHIoJ2RhdGEnKSB8fCAnJztcbiAgICBpZiAoY29udGVudCkge1xuICAgICAgICBpZiAoY29udGVudC5pbmRleE9mKCcvJykgPT09IDApIHtcbiAgICAgICAgICAgIGNvbnRlbnQgPSB3aW5kb3cubG9jYXRpb24ub3JpZ2luICsgY29udGVudDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY29udGVudC5pbmRleE9mKCdodHRwJykgIT09IDApIHtcbiAgICAgICAgICAgIGNvbnRlbnQgPSB3aW5kb3cubG9jYXRpb24ub3JpZ2luICsgd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lICsgY29udGVudDtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gY29udGVudDtcbn1cblxuLy8gVE9ETzogcmVmYWN0b3IgdXNhZ2Ugb2YgYXBwIHNlcnZlciB1cmwgKyByZWxhdGl2ZSByb3V0ZXNcbmZ1bmN0aW9uIGFwcFNlcnZlclVybCgpIHtcbiAgICBpZiAoQXBwTW9kZS50ZXN0KSB7XG4gICAgICAgIHJldHVybiBVUkxDb25zdGFudHMuVEVTVDtcbiAgICB9IGVsc2UgaWYgKEFwcE1vZGUub2ZmbGluZSkge1xuICAgICAgICByZXR1cm4gVVJMQ29uc3RhbnRzLkRFVkVMT1BNRU5UO1xuICAgIH1cbiAgICByZXR1cm4gVVJMQ29uc3RhbnRzLlBST0RVQ1RJT047XG59XG5cbi8vIFRPRE86IHJlZmFjdG9yIHVzYWdlIG9mIGV2ZW50cyBzZXJ2ZXIgdXJsICsgcmVsYXRpdmUgcm91dGVzXG5mdW5jdGlvbiBldmVudHNTZXJ2ZXJVcmwoKSB7XG4gICAgaWYgKEFwcE1vZGUub2ZmbGluZSkge1xuICAgICAgICByZXR1cm4gVVJMQ29uc3RhbnRzLkRFVkVMT1BNRU5UX0VWRU5UUztcbiAgICB9XG4gICAgcmV0dXJuIFVSTENvbnN0YW50cy5QUk9EVUNUSU9OX0VWRU5UUztcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGFwcFNlcnZlclVybDogYXBwU2VydmVyVXJsLFxuICAgIGV2ZW50c1NlcnZlclVybDogZXZlbnRzU2VydmVyVXJsLFxuICAgIGdyb3VwU2V0dGluZ3NVcmw6IGdldEdyb3VwU2V0dGluZ3NVcmwsXG4gICAgcGFnZURhdGFVcmw6IGdldFBhZ2VEYXRhVXJsLFxuICAgIGNyZWF0ZVJlYWN0aW9uVXJsOiBnZXRDcmVhdGVSZWFjdGlvblVybCxcbiAgICBjcmVhdGVDb21tZW50VXJsOiBnZXRDcmVhdGVDb21tZW50VXJsLFxuICAgIGZldGNoQ29tbWVudFVybDogZ2V0RmV0Y2hDb21tZW50VXJsLFxuICAgIGZldGNoQ29udGVudEJvZGllc1VybDogZ2V0RmV0Y2hDb250ZW50Qm9kaWVzVXJsLFxuICAgIHNoYXJlUmVhY3Rpb25Vcmw6IGdldFNoYXJlUmVhY3Rpb25VcmwsXG4gICAgc2hhcmVXaW5kb3dVcmw6IGdldFNoYXJlV2luZG93VXJsLFxuICAgIGxvZ2luUGFnZVVybDogZ2V0TG9naW5QYWdlVXJsLFxuICAgIGNvbXB1dGVJbWFnZVVybDogY29tcHV0ZUltYWdlVXJsLFxuICAgIGNvbXB1dGVNZWRpYVVybDogY29tcHV0ZU1lZGlhVXJsLFxuICAgIGV2ZW50VXJsOiBnZXRFdmVudFVybFxufTtcbiIsInZhciBBcHBNb2RlID0gcmVxdWlyZSgnLi9hcHAtbW9kZScpO1xudmFyIFhETUNsaWVudCA9IHJlcXVpcmUoJy4veGRtLWNsaWVudCcpO1xuXG52YXIgY2FjaGVkVXNlckluZm87XG5cbi8vIEZldGNoIHRoZSBsb2dnZWQgaW4gdXNlci4gV2lsbCB0cmlnZ2VyIGEgbmV0d29yayByZXF1ZXN0IHRvIGNyZWF0ZSBhIHRlbXBvcmFyeSB1c2VyIGlmIG5lZWRlZC5cbmZ1bmN0aW9uIGZldGNoVXNlcihjYWxsYmFjaykge1xuICAgIFhETUNsaWVudC5mZXRjaFVzZXIoZnVuY3Rpb24gKHVzZXJJbmZvKSB7XG4gICAgICAgIGNhY2hlZFVzZXJJbmZvID0gdXNlckluZm87XG4gICAgICAgIGNhbGxiYWNrKHVzZXJJbmZvKTtcbiAgICB9KTtcbn1cblxuLy8gUmV0dXJucyB0aGUgbG9nZ2VkLWluIHVzZXIsIGlmIHdlIGFscmVhZHkgaGF2ZSBvbmUuIFdpbGwgbm90IHRyaWdnZXIgYSBuZXR3b3JrIHJlcXVlc3QuXG5mdW5jdGlvbiBjYWNoZWRVc2VyKGNhbGxiYWNrKSB7XG4gICAgY2FsbGJhY2soY2FjaGVkVXNlckluZm8pO1xufVxuXG4vLyBBdHRlbXB0cyB0byBjcmVhdGUgYSBuZXcgYXV0aG9yaXphdGlvbiB0b2tlbiBmb3IgdGhlIGxvZ2dlZC1pbiB1c2VyLlxuZnVuY3Rpb24gcmVBdXRob3JpemVVc2VyKGNhbGxiYWNrKSB7XG4gICAgdmFyIG9sZFRva2VuID0gY2FjaGVkVXNlckluZm8gPyBjYWNoZWRVc2VySW5mby5hbnRfdG9rZW4gOiB1bmRlZmluZWQ7XG4gICAgWERNQ2xpZW50LnJlQXV0aG9yaXplVXNlcihmdW5jdGlvbiAodXNlckluZm8pIHtcbiAgICAgICAgY2FjaGVkVXNlckluZm8gPSB1c2VySW5mbztcbiAgICAgICAgdmFyIGhhc05ld1Rva2VuID0gdXNlckluZm8gJiYgdXNlckluZm8uYW50X3Rva2VuICYmIHVzZXJJbmZvLmFudF90b2tlbiAhPT0gb2xkVG9rZW47XG4gICAgICAgIGNhbGxiYWNrKGhhc05ld1Rva2VuKTtcbiAgICB9KTtcbn1cblxuLy8gVE9ETzogRmlndXJlIG91dCBob3cgbWFueSBkaWZmZXJlbnQgZm9ybWF0cyBvZiB1c2VyIGRhdGEgd2UgaGF2ZSBhbmQgZWl0aGVyIHVuaWZ5IHRoZW0gb3IgcHJvdmlkZSBjbGVhclxuLy8gICAgICAgQVBJIGhlcmUgdG8gdHJhbnNsYXRlIGVhY2ggdmFyaWF0aW9uIGludG8gc29tZXRoaW5nIHN0YW5kYXJkIGZvciB0aGUgY2xpZW50LlxuLy8gVE9ETzogSGF2ZSBYRE1DbGllbnQgcGFzcyB0aHJvdWdoIHRoaXMgbW9kdWxlIGFzIHdlbGwuXG5mdW5jdGlvbiB1c2VyRnJvbUNvbW1lbnRKU09OKGpzb25Vc2VyLCBzb2NpYWxVc2VyKSB7IC8vIFRoaXMgZm9ybWF0IHdvcmtzIGZvciB0aGUgdXNlciByZXR1cm5lZCBmcm9tIC9hcGkvY29tbWVudHMvcmVwbGllc1xuICAgIHZhciB1c2VyID0ge307XG4gICAgaWYgKGpzb25Vc2VyLnVzZXJfaWQpIHtcbiAgICAgICAgdXNlci5pZCA9IGpzb25Vc2VyLnVzZXJfaWQ7XG4gICAgfVxuICAgIGlmIChzb2NpYWxVc2VyKSB7XG4gICAgICAgIHVzZXIuaW1hZ2VVUkwgPSBzb2NpYWxVc2VyLmltZ191cmw7XG4gICAgICAgIHVzZXIubmFtZSA9IHNvY2lhbFVzZXIuZnVsbF9uYW1lO1xuICAgIH1cbiAgICBpZiAoIXVzZXIubmFtZSkge1xuICAgICAgICB1c2VyLm5hbWUgPSBqc29uVXNlci5maXJzdF9uYW1lID8gKGpzb25Vc2VyLmZpcnN0X25hbWUgKyAnICcgKyBqc29uVXNlci5sYXN0X25hbWUpIDogJ0Fub255bW91cyc7XG4gICAgfVxuICAgIGlmICghdXNlci5pbWFnZVVSTCkge1xuICAgICAgICB1c2VyLmltYWdlVVJMID0gYW5vbnltb3VzSW1hZ2VVUkwoKVxuICAgIH1cbiAgICByZXR1cm4gdXNlcjtcbn1cblxuXG4vLyBUT0RPOiBSZXZpc2l0IHRoZSB1c2VyIHRoYXQgd2UgcGFzcyBiYWNrIGZvciBuZXcgY29tbWVudHMuIE9wdGlvbnMgYXJlOlxuLy8gICAgICAgMS4gVXNlIHRoZSBsb2dnZWQgaW4gdXNlciwgYXNzdW1pbmcgdGhlIGNhY2hlZCB1c2VyIGhhcyBzb2NpYWxfdXNlciBpbmZvXG4vLyAgICAgICAyLiBVc2UgYSBnZW5lcmljIFwieW91XCIgcmVwcmVzZW50YXRpb24gbGlrZSB3ZSdyZSBkb2luZyBub3cuXG4vLyAgICAgICAzLiBEb24ndCBzaG93IGFueSBpbmRpY2F0aW9uIG9mIHRoZSB1c2VyLiBKdXN0IHNob3cgdGhlIGNvbW1lbnQuXG4vLyAgICAgICBGb3Igbm93LCB0aGlzIGlzIGp1c3QgZ2l2aW5nIHVzIHNvbWUgbm90aW9uIG9mIHVzZXIgd2l0aG91dCBhIHJvdW5kIHRyaXAuXG5mdW5jdGlvbiBvcHRpbWlzdGljQ29tbWVudFVzZXIoKSB7XG4gICAgdmFyIHVzZXIgPSB7XG4gICAgICAgIG5hbWU6ICdZb3UnLFxuICAgICAgICBpbWFnZVVSTDogYW5vbnltb3VzSW1hZ2VVUkwoKVxuICAgIH07XG4gICAgcmV0dXJuIHVzZXI7XG59XG5cbmZ1bmN0aW9uIGFub255bW91c0ltYWdlVVJMKCkge1xuICAgIHJldHVybiBBcHBNb2RlLm9mZmxpbmUgPyAnL3N0YXRpYy93aWRnZXQvaW1hZ2VzL2Fub255bW91c3Bsb2RlLnBuZycgOiAnaHR0cDovL3MzLmFtYXpvbmF3cy5jb20vcmVhZHJib2FyZC93aWRnZXQvaW1hZ2VzL2Fub255bW91c3Bsb2RlLnBuZyc7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGZyb21Db21tZW50SlNPTjogdXNlckZyb21Db21tZW50SlNPTixcbiAgICBvcHRpbWlzdGljQ29tbWVudFVzZXI6IG9wdGltaXN0aWNDb21tZW50VXNlcixcbiAgICBmZXRjaFVzZXI6IGZldGNoVXNlcixcbiAgICBjYWNoZWRVc2VyOiBjYWNoZWRVc2VyLFxuICAgIHJlQXV0aG9yaXplVXNlcjogcmVBdXRob3JpemVVc2VyXG59OyIsInZhciBpZCA9ICdhbnRlbm5hLXdpZGdldC1idWNrZXQnO1xuXG5mdW5jdGlvbiBnZXRXaWRnZXRCdWNrZXQoKSB7XG4gICAgdmFyIGJ1Y2tldCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKTtcbiAgICBpZiAoIWJ1Y2tldCkge1xuICAgICAgICBidWNrZXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgYnVja2V0LnNldEF0dHJpYnV0ZSgnaWQnLCBpZCk7XG4gICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoYnVja2V0KTtcbiAgICB9XG4gICAgcmV0dXJuIGJ1Y2tldDtcbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGdldDogZ2V0V2lkZ2V0QnVja2V0LFxuICAgIHNlbGVjdG9yOiBmdW5jdGlvbigpIHsgcmV0dXJuICcjJyArIGlkOyB9XG59OyIsInZhciBDYWxsYmFja1N1cHBvcnQgPSByZXF1aXJlKCcuL2NhbGxiYWNrLXN1cHBvcnQnKTtcbnZhciBYZG1Mb2FkZXIgPSByZXF1aXJlKCcuL3hkbS1sb2FkZXInKTtcblxuLy8gUmVnaXN0ZXIgb3Vyc2VsdmVzIHRvIGhlYXIgbWVzc2FnZXNcbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwibWVzc2FnZVwiLCByZWNlaXZlTWVzc2FnZSwgZmFsc2UpO1xuXG52YXIgcmVzcG9uc2VIYW5kbGVycyA9IHt9O1xuXG5hZGRSZXNwb25zZUhhbmRsZXIoJ3hkbSBsb2FkZWQnLCB4ZG1Mb2FkZWQpO1xuXG5mdW5jdGlvbiBhZGRSZXNwb25zZUhhbmRsZXIobWVzc2FnZUtleSwgY2FsbGJhY2spIHtcbiAgICB2YXIgaGFuZGxlcnMgPSBnZXRSZXNwb25zZUhhbmRsZXJzKG1lc3NhZ2VLZXkpO1xuICAgIGhhbmRsZXJzLmFkZChjYWxsYmFjayk7XG59XG5cbmZ1bmN0aW9uIHJlbW92ZVJlc3BvbnNlSGFuZGxlcihtZXNzYWdlS2V5LCBjYWxsYmFjaykge1xuICAgIHZhciBoYW5kbGVycyA9IGdldFJlc3BvbnNlSGFuZGxlcnMobWVzc2FnZUtleSk7XG4gICAgaGFuZGxlcnMucmVtb3ZlKGNhbGxiYWNrKTtcbn1cblxudmFyIGlzWERNTG9hZGVkID0gZmFsc2U7XG4vLyBUaGUgaW5pdGlhbCBtZXNzYWdlIHRoYXQgWERNIHNlbmRzIG91dCB3aGVuIGl0IGxvYWRzXG5mdW5jdGlvbiB4ZG1Mb2FkZWQoZGF0YSkge1xuICAgIGlzWERNTG9hZGVkID0gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gc2V0TWVzc2FnZUhhbmRsZXIobWVzc2FnZUtleSwgY2FsbGJhY2spIHtcbiAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgY2FsbGJhY2sucGVyc2lzdGVudCA9IHRydWU7IC8vIFNldCB0aGUgZmxhZyB3aGljaCB0ZWxscyB1cyB0aGF0IHRoaXMgaXNuJ3QgYSB0eXBpY2FsIG9uZS10aW1lIGNhbGxiYWNrLlxuICAgIH1cbiAgICBhZGRSZXNwb25zZUhhbmRsZXIobWVzc2FnZUtleSwgY2FsbGJhY2spO1xufVxuXG5mdW5jdGlvbiBmZXRjaFVzZXIoY2FsbGJhY2spIHtcbiAgICBwb3N0TWVzc2FnZSgnZ2V0VXNlcicsICdzZW5kVXNlcicsIHN1Y2Nlc3MpO1xuXG4gICAgZnVuY3Rpb24gc3VjY2VzcyhyZXNwb25zZSkge1xuICAgICAgICB2YXIgdXNlckluZm8gPSByZXNwb25zZS5kZXRhaWw7XG4gICAgICAgIGNhbGxiYWNrKHVzZXJJbmZvKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHJlQXV0aG9yaXplVXNlcihjYWxsYmFjaykge1xuICAgIHBvc3RNZXNzYWdlKCdyZWF1dGhVc2VyJywgJ3NlbmRVc2VyJywgc3VjY2Vzcyk7XG5cbiAgICBmdW5jdGlvbiBzdWNjZXNzKHJlc3BvbnNlKSB7XG4gICAgICAgIHZhciB1c2VySW5mbyA9IHJlc3BvbnNlLmRldGFpbDtcbiAgICAgICAgY2FsbGJhY2sodXNlckluZm8pO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZ2V0UmVzcG9uc2VIYW5kbGVycyhtZXNzYWdlS2V5KSB7XG4gICAgdmFyIGhhbmRsZXJzID0gcmVzcG9uc2VIYW5kbGVyc1ttZXNzYWdlS2V5XTtcbiAgICBpZiAoIWhhbmRsZXJzKSB7XG4gICAgICAgIGhhbmRsZXJzID0gQ2FsbGJhY2tTdXBwb3J0LmNyZWF0ZSgpO1xuICAgICAgICByZXNwb25zZUhhbmRsZXJzW21lc3NhZ2VLZXldID0gaGFuZGxlcnM7XG4gICAgfVxuICAgIHJldHVybiBoYW5kbGVycztcbn1cblxuZnVuY3Rpb24gcmVjZWl2ZU1lc3NhZ2UoZXZlbnQpIHtcbiAgICB2YXIgZXZlbnRPcmlnaW4gPSBldmVudC5vcmlnaW47XG4gICAgaWYgKGV2ZW50T3JpZ2luID09PSBYZG1Mb2FkZXIuT1JJR0lOKSB7XG4gICAgICAgIHZhciByZXNwb25zZSA9IGV2ZW50LmRhdGE7XG4gICAgICAgIC8vIFRPRE86IFRoZSBldmVudC5zb3VyY2UgcHJvcGVydHkgZ2l2ZXMgdXMgdGhlIHNvdXJjZSB3aW5kb3cgb2YgdGhlIG1lc3NhZ2UgYW5kIGN1cnJlbnRseSB0aGUgWERNIGZyYW1lIGZpcmVzIG91dFxuICAgICAgICAvLyBldmVudHMgdGhhdCB3ZSByZWNlaXZlIGJlZm9yZSB3ZSBldmVyIHRyeSB0byBwb3N0IGFueXRoaW5nLiBTbyB3ZSAqY291bGQqIGhvbGQgb250byB0aGUgd2luZG93IGhlcmUgYW5kIHVzZSBpdFxuICAgICAgICAvLyBmb3IgcG9zdGluZyBtZXNzYWdlcyByYXRoZXIgdGhhbiBsb29raW5nIGZvciB0aGUgWERNIGZyYW1lIG91cnNlbHZlcy4gTmVlZCB0byBsb29rIGF0IHdoaWNoIGV2ZW50cyB0aGUgWERNIGZyYW1lXG4gICAgICAgIC8vIGZpcmVzIG91dCB0byBhbGwgd2luZG93cyBiZWZvcmUgYmVpbmcgYXNrZWQuIEN1cnJlbnRseSwgaXQncyBtb3JlIHRoYW4gXCJ4ZG0gbG9hZGVkXCIuIFdoeT9cbiAgICAgICAgLy92YXIgc291cmNlV2luZG93ID0gZXZlbnQuc291cmNlO1xuXG4gICAgICAgIHZhciBtZXNzYWdlS2V5ID0gcmVzcG9uc2Uua2V5O1xuICAgICAgICB2YXIgaGFuZGxlcnMgPSBnZXRSZXNwb25zZUhhbmRsZXJzKG1lc3NhZ2VLZXkpO1xuICAgICAgICB2YXIgY2FsbGJhY2tzID0gaGFuZGxlcnMuZ2V0KCk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2FsbGJhY2tzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgY2FsbGJhY2sgPSBjYWxsYmFja3NbaV07XG4gICAgICAgICAgICBjYWxsYmFjayhyZXNwb25zZSk7XG4gICAgICAgICAgICBpZiAoIWNhbGxiYWNrLnBlcnNpc3RlbnQpIHtcbiAgICAgICAgICAgICAgICByZW1vdmVSZXNwb25zZUhhbmRsZXIobWVzc2FnZUtleSwgY2FsbGJhY2spO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBwb3N0TWVzc2FnZShzZW5kS2V5LCByZXNwb25zZUtleSwgY2FsbGJhY2spIHtcbiAgICBpZiAoaXNYRE1Mb2FkZWQpIHtcbiAgICAgICAgdmFyIHhkbUZyYW1lID0gZ2V0WERNRnJhbWUoKTtcbiAgICAgICAgaWYgKHhkbUZyYW1lKSB7XG4gICAgICAgICAgICBhZGRSZXNwb25zZUhhbmRsZXIocmVzcG9uc2VLZXksIGNhbGxiYWNrKTtcbiAgICAgICAgICAgIHhkbUZyYW1lLnBvc3RNZXNzYWdlKHNlbmRLZXksIFhkbUxvYWRlci5PUklHSU4pO1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcXVldWVNZXNzYWdlKHNlbmRLZXksIHJlc3BvbnNlS2V5LCBjYWxsYmFjayk7XG4gICAgfVxufVxuXG52YXIgbWVzc2FnZVF1ZXVlID0gW107XG52YXIgbWVzc2FnZVF1ZXVlVGltZXI7XG5cbmZ1bmN0aW9uIHF1ZXVlTWVzc2FnZShzZW5kS2V5LCByZXNwb25zZUtleSwgY2FsbGJhY2spIHtcbiAgICAvLyBUT0RPOiBSZXZpZXcgdGhpcyBpZGVhLiBUaGUgbWFpbiBtZXNzYWdlIHdlIHJlYWxseSBuZWVkIHRvIHF1ZXVlIHVwIGlzIHRoZSBnZXRVc2VyIHJlcXVlc3QgYXMgcGFydCBvZiB0aGUgXCJncm91cCBzZXR0aW5ncyBsb2FkZWRcIlxuICAgIC8vIGV2ZW50IHdoaWNoIGZpcmVzIHZlcnkgZWFybHkgKHBvc3NpYmx5IFwicGFnZSBkYXRhIGxvYWRlZFwiIHRvbykuIEJ1dCB3aGF0IGFib3V0IHRoZSByZXN0IG9mIHRoZSB3aWRnZXQ/IFNob3VsZCB3ZSBldmVuIHNob3dcbiAgICAvLyB0aGUgcmVhY3Rpb24gd2luZG93IGlmIHRoZSBYRE0gZnJhbWUgaXNuJ3QgcmVhZHk/IE9yIHNob3VsZCB0aGUgd2lkZ2V0IHdhaXQgdG8gYmVjb21lIHZpc2libGUgdW50aWwgWERNIGlzIHJlYWR5IGxpa2UgdGhlXG4gICAgLy8gd2F5IGl0IHdhaXRzIGZvciBwYWdlIGRhdGEgdG8gbG9hZD9cbiAgICBtZXNzYWdlUXVldWUucHVzaCh7c2VuZEtleTogc2VuZEtleSwgcmVzcG9uc2VLZXk6IHJlc3BvbnNlS2V5LCBjYWxsYmFjazogY2FsbGJhY2t9KTtcbiAgICBpZiAoIW1lc3NhZ2VRdWV1ZVRpbWVyKSB7XG4gICAgICAgIC8vIFN0YXJ0IHRoZSB3YWl0Li4uXG4gICAgICAgIHZhciBzdG9wVGltZSA9IERhdGUubm93KCkgKyAxMDAwMDsgLy8gR2l2ZSB1cCBhZnRlciAxMCBzZWNvbmRzXG4gICAgICAgIG1lc3NhZ2VRdWV1ZVRpbWVyID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAoaXNYRE1Mb2FkZWQgfHwgRGF0ZS5ub3coKSA+IHN0b3BUaW1lKSB7XG4gICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChtZXNzYWdlUXVldWVUaW1lcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaXNYRE1Mb2FkZWQpIHtcbiAgICAgICAgICAgICAgICAvLyBUT0RPOiBDb25zaWRlciB0aGUgdGltaW5nIGlzc3VlIHdoZXJlIG1lc3NhZ2VzIGNvdWxkIHNuZWFrIGluIGFuZCBiZSBwcm9jZXNzZWQgd2hpbGUgdGhpcyBsb29wIGlzIHNsZWVwaW5nLlxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbWVzc2FnZVF1ZXVlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkZXF1ZXVlZCA9IG1lc3NhZ2VRdWV1ZVtpXTtcbiAgICAgICAgICAgICAgICAgICAgcG9zdE1lc3NhZ2UoZGVxdWV1ZWQuc2VuZEtleSwgZGVxdWV1ZWQucmVzcG9uc2VLZXksIGRlcXVldWVkLmNhbGxiYWNrKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbWVzc2FnZVF1ZXVlID0gW107XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIDUwKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGdldFhETUZyYW1lKCkge1xuICAgIC8vIFRPRE86IElzIHRoaXMgYSBzZWN1cml0eSBwcm9ibGVtPyBXaGF0IHByZXZlbnRzIHNvbWVvbmUgZnJvbSB1c2luZyB0aGlzIHNhbWUgbmFtZSBhbmQgaW50ZXJjZXB0aW5nIG91ciBtZXNzYWdlcz9cbiAgICByZXR1cm4gd2luZG93LmZyYW1lc1snYW50LXhkbS1oaWRkZW4nXTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgZmV0Y2hVc2VyOiBmZXRjaFVzZXIsXG4gICAgcmVBdXRob3JpemVVc2VyOiByZUF1dGhvcml6ZVVzZXIsXG4gICAgc2V0TWVzc2FnZUhhbmRsZXI6IHNldE1lc3NhZ2VIYW5kbGVyLFxuICAgIGFkZFJlc3BvbnNlSGFuZGxlcjogYWRkUmVzcG9uc2VIYW5kbGVyLFxuICAgIHJlbW92ZVJlc3BvbnNlSGFuZGxlcjogcmVtb3ZlUmVzcG9uc2VIYW5kbGVyXG59OyIsInZhciAkOyByZXF1aXJlKCcuL2pxdWVyeS1wcm92aWRlcicpLm9uTG9hZChmdW5jdGlvbihqUXVlcnkpIHsgJD1qUXVlcnk7IH0pO1xudmFyIEFwcE1vZGUgPSByZXF1aXJlKCcuL2FwcC1tb2RlJyk7XG52YXIgVVJMQ29uc3RhbnRzID0gcmVxdWlyZSgnLi91cmwtY29uc3RhbnRzJyk7XG52YXIgV2lkZ2V0QnVja2V0ID0gcmVxdWlyZSgnLi93aWRnZXQtYnVja2V0Jyk7XG5cbnZhciBYRE1fT1JJR0lOID0gQXBwTW9kZS5vZmZsaW5lID8gVVJMQ29uc3RhbnRzLkRFVkVMT1BNRU5UIDogVVJMQ29uc3RhbnRzLlBST0RVQ1RJT047XG5cbmZ1bmN0aW9uIGNyZWF0ZVhETWZyYW1lKGdyb3VwSWQpIHtcbiAgICAvL0FOVC5zZXNzaW9uLnJlY2VpdmVNZXNzYWdlKHt9LCBmdW5jdGlvbigpIHtcbiAgICAvLyAgICBBTlQudXRpbC51c2VyTG9naW5TdGF0ZSgpO1xuICAgIC8vfSk7XG5cbiAgICB2YXIgaWZyYW1lVXJsID0gWERNX09SSUdJTiArIFwiL3N0YXRpYy93aWRnZXQtbmV3L3hkbS94ZG0uaHRtbFwiLFxuICAgIHBhcmVudFVybCA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmLFxuICAgIHBhcmVudEhvc3QgPSB3aW5kb3cubG9jYXRpb24ucHJvdG9jb2wgKyBcIi8vXCIgKyB3aW5kb3cubG9jYXRpb24uaG9zdCxcbiAgICAvLyBUT0RPOiBSZXN0b3JlIHRoZSBib29rbWFya2xldCBhdHRyaWJ1dGUgb24gdGhlIGlGcmFtZT9cbiAgICAvL2Jvb2ttYXJrbGV0ID0gKCBBTlQuZW5nYWdlU2NyaXB0UGFyYW1zLmJvb2ttYXJrbGV0ICkgPyBcImJvb2ttYXJrbGV0PXRydWVcIjpcIlwiLFxuICAgIGJvb2ttYXJrbGV0ID0gXCJcIixcbiAgICAvLyBUT0RPOiBSZXN0b3JlIHRoZSBncm91cE5hbWUgYXR0cmlidXRlLiAoV2hhdCBpcyBpdCBmb3I/KVxuICAgICR4ZG1JZnJhbWUgPSAkKCc8aWZyYW1lIGlkPVwiYW50LXhkbS1oaWRkZW5cIiBuYW1lPVwiYW50LXhkbS1oaWRkZW5cIiBzcmM9XCInICsgaWZyYW1lVXJsICsgJz9wYXJlbnRVcmw9JyArIHBhcmVudFVybCArICcmcGFyZW50SG9zdD0nICsgcGFyZW50SG9zdCArICcmZ3JvdXBfaWQ9Jytncm91cElkKydcIiB3aWR0aD1cIjFcIiBoZWlnaHQ9XCIxXCIgc3R5bGU9XCJwb3NpdGlvbjphYnNvbHV0ZTt0b3A6LTEwMDBweDtsZWZ0Oi0xMDAwcHg7XCIgLz4nKTtcbiAgICAvLyR4ZG1JZnJhbWUgPSAkKCc8aWZyYW1lIGlkPVwiYW50LXhkbS1oaWRkZW5cIiBuYW1lPVwiYW50LXhkbS1oaWRkZW5cIiBzcmM9XCInICsgaWZyYW1lVXJsICsgJz9wYXJlbnRVcmw9JyArIHBhcmVudFVybCArICcmcGFyZW50SG9zdD0nICsgcGFyZW50SG9zdCArICcmZ3JvdXBfaWQ9Jytncm91cElkKycmZ3JvdXBfbmFtZT0nK2VuY29kZVVSSUNvbXBvbmVudChncm91cE5hbWUpKycmJytib29rbWFya2xldCsnXCIgd2lkdGg9XCIxXCIgaGVpZ2h0PVwiMVwiIHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGU7dG9wOi0xMDAwcHg7bGVmdDotMTAwMHB4O1wiIC8+Jyk7XG4gICAgJChXaWRnZXRCdWNrZXQuZ2V0KCkpLmFwcGVuZCggJHhkbUlmcmFtZSApO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGVYRE1mcmFtZTogY3JlYXRlWERNZnJhbWUsXG4gICAgT1JJR0lOOiBYRE1fT1JJR0lOXG59OyIsInZhciBYRE1DbGllbnQgPSByZXF1aXJlKCcuL3V0aWxzL3hkbS1jbGllbnQnKTtcbnZhciBFdmVudHMgPSByZXF1aXJlKCcuL2V2ZW50cycpO1xudmFyIEdyb3VwU2V0dGluZ3MgPSByZXF1aXJlKCcuL2dyb3VwLXNldHRpbmdzJyk7XG52YXIgUGFnZURhdGEgPSByZXF1aXJlKCcuL3BhZ2UtZGF0YScpO1xuXG5mdW5jdGlvbiBzdGFydExpc3RlbmluZygpIHtcbiAgICBYRE1DbGllbnQuc2V0TWVzc2FnZUhhbmRsZXIoJ3JlY2lyY0NsaWNrJywgcmVjaXJjQ2xpY2tlZCk7XG59XG5cbmZ1bmN0aW9uIHJlY2lyY0NsaWNrZWQocmVzcG9uc2UpIHtcbiAgICB2YXIgcmVhY3Rpb25JZCA9IHJlc3BvbnNlLmRldGFpbC5yZWZlcnJpbmdfaW50X2lkO1xuICAgIGdldFBhZ2VEYXRhKHJlc3BvbnNlLmRldGFpbC5wYWdlX2hhc2gsIGZ1bmN0aW9uKHBhZ2VEYXRhKSB7XG4gICAgICAgIEV2ZW50cy5wb3N0UmVjaXJjQ2xpY2tlZChwYWdlRGF0YSwgcmVhY3Rpb25JZCwgR3JvdXBTZXR0aW5ncy5nZXQoKSk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGdldFBhZ2VEYXRhKHBhZ2VIYXNoLCBjYWxsYmFjaykge1xuICAgIGlmIChwYWdlSGFzaCkge1xuICAgICAgICAvLyBUaGlzIG1vZHVsZSBsb2FkcyB2ZXJ5IGVhcmx5IGluIHRoZSBhcHAgbGlmZWN5Y2xlIGFuZCBtYXkgcmVjZWl2ZSBldmVudHMgZnJvbSB0aGUgWERNIGZyYW1lIGJlZm9yZSBwYWdlXG4gICAgICAgIC8vIGRhdGEgaGFzIGJlZW4gbG9hZGVkLiBIb2xkIG9udG8gYW55IHN1Y2ggZXZlbnRzIHVudGlsIHRoZSBwYWdlIGRhdGEgbG9hZHMgb3Igd2UgdGltZW91dC5cbiAgICAgICAgdmFyIG1heFdhaXRUaW1lID0gRGF0ZS5ub3coKSArIDEwMDAwOyAvLyBHaXZlIHVwIGFmdGVyIDEwIHNlY29uZHNcbiAgICAgICAgdmFyIGludGVydmFsID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHBhZ2VEYXRhID0gUGFnZURhdGEuZ2V0UGFnZURhdGEocGFnZUhhc2gpO1xuICAgICAgICAgICAgaWYgKHBhZ2VEYXRhKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2socGFnZURhdGEpO1xuICAgICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoaW50ZXJ2YWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKERhdGUubm93KCkgPiBtYXhXYWl0VGltZSkge1xuICAgICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoaW50ZXJ2YWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCA1MCk7XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBzdGFydDogc3RhcnRMaXN0ZW5pbmdcbn07IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEgYW50ZW5uYS1hdXRvLWN0YVwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1hdXRvLWN0YS1pbm5lclwiLFwiYW50LWN0YS1mb3JcIjpbe1widFwiOjIsXCJyXCI6XCJhbnRJdGVtSWRcIn1dfSxcImZcIjpbe1widFwiOjgsXCJyXCI6XCJsb2dvXCJ9LHtcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWF1dG8tY3RhLWxhYmVsXCIsXCJhbnQtcmVhY3Rpb25zLWxhYmVsLWZvclwiOlt7XCJ0XCI6MixcInJcIjpcImFudEl0ZW1JZFwifV19fSx7XCJ0XCI6NCxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiYW50LWV4cGFuZGVkLXJlYWN0aW9ucy1mb3JcIjpbe1widFwiOjIsXCJyXCI6XCJhbnRJdGVtSWRcIn1dfX1dLFwiblwiOjUwLFwiclwiOlwiZXhwYW5kUmVhY3Rpb25zXCJ9XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcGFnZSBhbnRlbm5hLWJsb2NrZWQtcGFnZVwifSxcIm9cIjpcImNzc3Jlc2V0XCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtYm9keVwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcInZcIjp7XCJ0YXBcIjpcImJhY2tcIn0sXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtYmxvY2tlZC1iYWNrXCJ9LFwiZlwiOlt7XCJ0XCI6OCxcInJcIjpcImxlZnRcIn0se1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwiYmxvY2tlZC1wYWdlX2JhY2tcXFwiKVwifX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWJsb2NrZWQtYm9keVwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1ibG9ja2VkLW1lc3NhZ2VcIn0sXCJmXCI6W1wiVGhpcyBzaXRlIGhhcyBibG9ja2VkIHNvbWUgb3IgYWxsIG9mIHRoZSB0ZXh0IGluIHRoYXQgcmVhY3Rpb24uXCJdfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWJsb2NrZWQtbWVzc2FnZVwifSxcImZcIjpbXCJQbGVhc2UgdHJ5IHNvbWV0aGluZyB0aGF0IHdpbGwgYmUgbW9yZSBhcHByb3ByaWF0ZSBmb3IgdGhpcyBjb21tdW5pdHkuXCJdfV19XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo0LFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcImNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbFwifV0sXCJuXCI6NTAsXCJ4XCI6e1wiclwiOltcImNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbFwiLFwiY29udGFpbmVyRGF0YS5sb2FkZWRcIl0sXCJzXCI6XCJfMCE9PXVuZGVmaW5lZCYmXzFcIn19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjQsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6W1wiYW50ZW5uYS1jdGEtZXhwYW5kZWQtcmVhY3Rpb24gXCIse1widFwiOjQsXCJmXCI6W1wiYW50ZW5uYS1jdGEtZXhwYW5kZWQtZmlyc3RcIl0sXCJuXCI6NTAsXCJ4XCI6e1wiclwiOltcIkBpbmRleFwiXSxcInNcIjpcIl8wPT09MFwifX1dfSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY3RhLWV4cGFuZGVkLXRleHRcIn0sXCJmXCI6W3tcInRcIjoyLFwiclwiOlwiLi90ZXh0XCJ9XX0se1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY3RhLWV4cGFuZGVkLWNvdW50XCJ9LFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcIi4vY291bnRcIn1dfV19XSxcInhcIjp7XCJyXCI6W1wiY29tcHV0ZUV4cGFuZGVkUmVhY3Rpb25zXCIsXCJjb250YWluZXJEYXRhLnJlYWN0aW9uc1wiXSxcInNcIjpcIl8wKF8xKVwifX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NCxcImZcIjpbe1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwiY2FsbC10by1hY3Rpb24tbGFiZWxfcmVzcG9uc2VzXFxcIilcIn19XSxcIm5cIjo1MCxcInhcIjp7XCJyXCI6W1wiY29udGFpbmVyRGF0YS5yZWFjdGlvblRvdGFsXCIsXCJjb250YWluZXJEYXRhLmxvYWRlZFwiXSxcInNcIjpcIl8wPT09dW5kZWZpbmVkfHwhXzFcIn19LHtcInRcIjo0LFwiblwiOjUxLFwiZlwiOlt7XCJ0XCI6NCxcIm5cIjo1MCxcInhcIjp7XCJyXCI6W1wiY29udGFpbmVyRGF0YS5yZWFjdGlvblRvdGFsXCJdLFwic1wiOlwiXzA9PT0xXCJ9LFwiZlwiOlt7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJjYWxsLXRvLWFjdGlvbi1sYWJlbF9yZXNwb25zZXNfb25lXFxcIilcIn19XX0se1widFwiOjQsXCJuXCI6NTAsXCJ4XCI6e1wiclwiOltcImNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbFwiXSxcInNcIjpcIiEoXzA9PT0xKVwifSxcImZcIjpbXCIgXCIse1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIixcImNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbFwiXSxcInNcIjpcIl8wKFxcXCJjYWxsLXRvLWFjdGlvbi1sYWJlbF9yZXNwb25zZXNfbWFueVxcXCIsW18xXSlcIn19XX1dLFwieFwiOntcInJcIjpbXCJjb250YWluZXJEYXRhLnJlYWN0aW9uVG90YWxcIixcImNvbnRhaW5lckRhdGEubG9hZGVkXCJdLFwic1wiOlwiXzA9PT11bmRlZmluZWR8fCFfMVwifX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWNvbW1lbnQtYXJlYVwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb21tZW50LXdpZGdldHNcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwidGV4dGFyZWFcIixcInZcIjp7XCJpbnB1dFwiOlwiaW5wdXRjaGFuZ2VkXCJ9LFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWNvbW1lbnQtaW5wdXRcIixcInBsYWNlaG9sZGVyXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcImNvbW1lbnQtYXJlYV9wbGFjZWhvbGRlclxcXCIpXCJ9fV0sXCJtYXhsZW5ndGhcIjpcIjUwMFwifX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb21tZW50LWZvb3RlclwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY29tbWVudC1saW1pdFwifSxcImZcIjpbe1widFwiOjMsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwiY29tbWVudC1hcmVhX2NvdW50XFxcIilcIn19XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJidXR0b25cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb21tZW50LXN1Ym1pdFwifSxcInZcIjp7XCJ0YXBcIjpcImFkZGNvbW1lbnRcIn0sXCJmXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcImNvbW1lbnQtYXJlYV9hZGRcXFwiKVwifX1dfV19XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb21tZW50LXdhaXRpbmdcIn0sXCJmXCI6W1wiLi4uXCJdfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWNvbW1lbnQtcmVjZWl2ZWRcIn0sXCJmXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcImNvbW1lbnQtYXJlYV90aGFua3NcXFwiKVwifX1dfV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1wYWdlIGFudGVubmEtY29tbWVudHMtcGFnZVwifSxcIm9cIjpcImNzc3Jlc2V0XCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtYm9keVwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcInZcIjp7XCJ0YXBcIjpcImJhY2tcIn0sXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY29tbWVudHMtYmFja1wifSxcImZcIjpbe1widFwiOjgsXCJyXCI6XCJsZWZ0XCJ9LHtcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcImNvbW1lbnRzLXBhZ2VfYmFja1xcXCIpXCJ9fV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtY29tbWVudHMtaGVhZGVyXCJ9LFwiZlwiOlt7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiLFwiY29tbWVudHMubGVuZ3RoXCJdLFwic1wiOlwiXzAoXFxcImNvbW1lbnRzLXBhZ2VfaGVhZGVyXFxcIixbXzFdKVwifX1dfSxcIiBcIix7XCJ0XCI6NCxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOltcImFudGVubmEtY29tbWVudC1lbnRyeSBcIix7XCJ0XCI6NCxcImZcIjpbXCJhbnRlbm5hLWNvbW1lbnQtbmV3XCJdLFwiblwiOjUwLFwiclwiOlwiLi9uZXdcIn1dfSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJ0YWJsZVwiLFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInRyXCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwidGRcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb21tZW50LWNlbGxcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiaW1nXCIsXCJhXCI6e1wic3JjXCI6W3tcInRcIjoyLFwiclwiOlwiLi91c2VyLmltYWdlVVJMXCJ9XX19XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJ0ZFwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWNvbW1lbnQtYXV0aG9yXCJ9LFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcIi4vdXNlci5uYW1lXCJ9XX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcInRyXCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwidGRcIixcImZcIjpbXX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJ0ZFwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWNvbW1lbnQtdGV4dFwifSxcImZcIjpbe1widFwiOjIsXCJyXCI6XCIuL3RleHRcIn1dfV19XX1dfV0sXCJpXCI6XCJpbmRleFwiLFwiclwiOlwiY29tbWVudHNcIn0sXCIgXCIse1widFwiOjgsXCJyXCI6XCJjb21tZW50QXJlYVwifV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXBhZ2UgYW50ZW5uYS1jb25maXJtYXRpb24tcGFnZVwifSxcIm9cIjpcImNzc3Jlc2V0XCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtYm9keVwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb21tZW50LXJlYWN0aW9uXCJ9LFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcInRleHRcIn1dfSxcIiBcIix7XCJ0XCI6OCxcInJcIjpcImNvbW1lbnRBcmVhXCJ9XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1mb290ZXIgYW50ZW5uYS1jb25maXJtLWZvb3RlclwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtc2hhcmVcIn0sXCJmXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcImNvbmZpcm1hdGlvbi1wYWdlX3NoYXJlXFxcIilcIn19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiYVwiLFwidlwiOntcInRhcFwiOlwic2hhcmUtZmFjZWJvb2tcIn0sXCJhXCI6e1wiaHJlZlwiOlwiLy9mYWNlYm9vay5jb21cIn0sXCJmXCI6W3tcInRcIjo4LFwiclwiOlwiZmFjZWJvb2tJY29uXCJ9XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJhXCIsXCJ2XCI6e1widGFwXCI6XCJzaGFyZS10d2l0dGVyXCJ9LFwiYVwiOntcImhyZWZcIjpcIi8vdHdpdHRlci5jb21cIn0sXCJmXCI6W3tcInRcIjo4LFwiclwiOlwidHdpdHRlckljb25cIn1dfV19XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJ2XCI6e1wia2V5ZG93blwiOlwicGFnZWtleWRvd25cIn0sXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcGFnZSBhbnRlbm5hLWRlZmF1bHRzLXBhZ2VcIixcInRhYmluZGV4XCI6XCIwXCJ9LFwib1wiOlwiY3NzcmVzZXRcIixcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1ib2R5XCJ9LFwiZlwiOlt7XCJ0XCI6NCxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcInZcIjp7XCJ0YXBcIjpcIm5ld3JlYWN0aW9uXCJ9LFwiYVwiOntcImNsYXNzXCI6W1wiYW50ZW5uYS1yZWFjdGlvbiBcIix7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZGVmYXVsdExheW91dENsYXNzXCIsXCJpbmRleFwiXSxcInNcIjpcIl8wKF8xKVwifX1dfSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1yZWFjdGlvbi1ib3hcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcmVhY3Rpb24tdGV4dFwifSxcIm9cIjpcInNpemV0b2ZpdFwiLFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcIi4vdGV4dFwifV19XX1dfV0sXCJpXCI6XCJpbmRleFwiLFwiclwiOlwiZGVmYXVsdFJlYWN0aW9uc1wifV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtZm9vdGVyIGFudGVubmEtZGVmYXVsdHMtZm9vdGVyXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWN1c3RvbS1hcmVhXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImlucHV0XCIsXCJ2XCI6e1wiZm9jdXNcIjpcImN1c3RvbWZvY3VzXCIsXCJrZXlkb3duXCI6XCJpbnB1dGtleWRvd25cIixcImJsdXJcIjpcImN1c3RvbWJsdXJcIn0sXCJhXCI6e1widmFsdWVcIjpbe1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwiZGVmYXVsdHMtcGFnZV9hZGRcXFwiKVwifX1dLFwibWF4bGVuZ3RoXCI6XCIyNVwifX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJidXR0b25cIixcInZcIjp7XCJ0YXBcIjpcIm5ld2N1c3RvbVwifSxcImZcIjpbe1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwiZGVmYXVsdHMtcGFnZV9va1xcXCIpXCJ9fV19XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS10ZXh0LWxvZ29cIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiYVwiLFwiYVwiOntcImhyZWZcIjpcIi8vd3d3LmFudGVubmEuaXNcIn0sXCJmXCI6W1wiQW50ZW5uYVwiXX1dfV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXBhZ2UgYW50ZW5uYS1sb2NhdGlvbnMtcGFnZVwifSxcIm9cIjpcImNzc3Jlc2V0XCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtYm9keVwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcInZcIjp7XCJ0YXBcIjpcImJhY2tcIn0sXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtbG9jYXRpb25zLWJhY2tcIn0sXCJmXCI6W3tcInRcIjo4LFwiclwiOlwibGVmdFwifSx7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJsb2NhdGlvbnMtcGFnZV9iYWNrXFxcIilcIn19XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJ0YWJsZVwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxvY2F0aW9ucy10YWJsZVwifSxcImZcIjpbe1widFwiOjQsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwidHJcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1sb2NhdGlvbnMtY29udGVudC1yb3dcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwidGRcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1sb2NhdGlvbnMtY291bnQtY2VsbFwifSxcImZcIjpbe1widFwiOjQsXCJmXCI6W3tcInRcIjozLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcImxvY2F0aW9ucy1wYWdlX2NvdW50X29uZVxcXCIpXCJ9fV0sXCJuXCI6NTAsXCJ4XCI6e1wiclwiOltcInBhZ2VSZWFjdGlvbkNvdW50XCJdLFwic1wiOlwiXzA9PT0xXCJ9fSx7XCJ0XCI6NCxcIm5cIjo1MSxcImZcIjpbe1widFwiOjMsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIixcInBhZ2VSZWFjdGlvbkNvdW50XCJdLFwic1wiOlwiXzAoXFxcImxvY2F0aW9ucy1wYWdlX2NvdW50X21hbnlcXFwiLFtfMV0pXCJ9fV0sXCJ4XCI6e1wiclwiOltcInBhZ2VSZWFjdGlvbkNvdW50XCJdLFwic1wiOlwiXzA9PT0xXCJ9fV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwidGRcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1sb2NhdGlvbnMtcGFnZS1ib2R5XCJ9LFwiZlwiOlt7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJsb2NhdGlvbnMtcGFnZV9wYWdlbGV2ZWxcXFwiKVwifX1dfV19XSxcIm5cIjo1MCxcInJcIjpcInBhZ2VSZWFjdGlvbkNvdW50XCJ9LFwiIFwiLHtcInRcIjo0LFwiZlwiOlt7XCJ0XCI6NCxcImZcIjpbXCIgXCIse1widFwiOjcsXCJlXCI6XCJ0clwiLFwidlwiOntcInRhcFwiOlwicmV2ZWFsXCJ9LFwiYVwiOntcImNsYXNzXCI6W1wiYW50ZW5uYS1sb2NhdGlvbnMtY29udGVudC1yb3cgXCIse1widFwiOjQsXCJmXCI6W1wiYW50ZW5uYS1sb2NhdGVcIl0sXCJuXCI6NTAsXCJ4XCI6e1wiclwiOltcImNhbkxvY2F0ZVwiLFwiLi9jb250YWluZXJIYXNoXCJdLFwic1wiOlwiXzAoXzEpXCJ9fV19LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInRkXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtbG9jYXRpb25zLWNvdW50LWNlbGxcIn0sXCJmXCI6W3tcInRcIjo0LFwiZlwiOlt7XCJ0XCI6MyxcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJsb2NhdGlvbnMtcGFnZV9jb3VudF9vbmVcXFwiKVwifX1dLFwiblwiOjUwLFwieFwiOntcInJcIjpbXCIuL2NvdW50XCJdLFwic1wiOlwiXzA9PT0xXCJ9fSx7XCJ0XCI6NCxcIm5cIjo1MSxcImZcIjpbe1widFwiOjMsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIixcIi4vY291bnRcIl0sXCJzXCI6XCJfMChcXFwibG9jYXRpb25zLXBhZ2VfY291bnRfbWFueVxcXCIsW18xXSlcIn19XSxcInhcIjp7XCJyXCI6W1wiLi9jb3VudFwiXSxcInNcIjpcIl8wPT09MVwifX1dfSxcIiBcIix7XCJ0XCI6NCxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJ0ZFwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxvY2F0aW9ucy10ZXh0LWJvZHlcIn0sXCJmXCI6W3tcInRcIjoyLFwiclwiOlwiLi9ib2R5XCJ9XX1dLFwiblwiOjUwLFwieFwiOntcInJcIjpbXCIuL2tpbmRcIl0sXCJzXCI6XCJfMD09PVxcXCJ0eHRcXFwiXCJ9fSx7XCJ0XCI6NCxcIm5cIjo1MSxcImZcIjpbe1widFwiOjQsXCJuXCI6NTAsXCJ4XCI6e1wiclwiOltcIi4va2luZFwiXSxcInNcIjpcIl8wPT09XFxcImltZ1xcXCJcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwidGRcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1sb2NhdGlvbnMtaW1hZ2UtYm9keVwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJpbWdcIixcImFcIjp7XCJzcmNcIjpbe1widFwiOjIsXCJyXCI6XCIuL2JvZHlcIn1dfX1dfV19LHtcInRcIjo0LFwiblwiOjUwLFwieFwiOntcInJcIjpbXCIuL2tpbmRcIl0sXCJzXCI6XCIoIShfMD09PVxcXCJpbWdcXFwiKSkmJihfMD09PVxcXCJtZWRcXFwiKVwifSxcImZcIjpbXCIgXCIse1widFwiOjcsXCJlXCI6XCJ0ZFwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxvY2F0aW9ucy1tZWRpYS1ib2R5XCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImltZ1wiLFwiYVwiOntcInNyY1wiOlwiL3N0YXRpYy93aWRnZXQvaW1hZ2VzL3ZpZGVvX2ljb24ucG5nXCJ9fSxcIiBWaWRlb1wiXX1dfSx7XCJ0XCI6NCxcIm5cIjo1MCxcInhcIjp7XCJyXCI6W1wiLi9raW5kXCJdLFwic1wiOlwiKCEoXzA9PT1cXFwiaW1nXFxcIikpJiYoIShfMD09PVxcXCJtZWRcXFwiKSlcIn0sXCJmXCI6W1wiIFwiXX1dLFwieFwiOntcInJcIjpbXCIuL2tpbmRcIl0sXCJzXCI6XCJfMD09PVxcXCJ0eHRcXFwiXCJ9fV19XSxcIm5cIjo1MCxcInhcIjp7XCJyXCI6W1wiLi9raW5kXCJdLFwic1wiOlwiXzAhPT1cXFwicGFnXFxcIlwifX1dLFwiaVwiOlwiaWRcIixcInJcIjpcImxvY2F0aW9uRGF0YVwifV19XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcGFnZSBhbnRlbm5hLWxvZ2luLXBhZ2VcIn0sXCJvXCI6XCJjc3NyZXNldFwiLFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWJvZHlcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJ2XCI6e1widGFwXCI6XCJiYWNrXCJ9LFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxvZ2luLWJhY2tcIn0sXCJmXCI6W3tcInRcIjo4LFwiclwiOlwibGVmdFwifSx7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJsb2dpbi1wYWdlX2JhY2tcXFwiKVwifX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxvZ2luLWNvbnRhaW5lclwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJpZnJhbWVcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1sb2dpbi1pZnJhbWVcIixcInNyY1wiOlt7XCJ0XCI6MixcInJcIjpcImxvZ2luUGFnZVVybFwifV0sXCJzZWFtbGVzc1wiOjB9fV19XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwib1wiOlwiY3NzcmVzZXRcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYSBhbnRlbm5hLW1lZGlhLWluZGljYXRvci13cmFwcGVyXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOltcImFudGVubmEgYW50ZW5uYS1tZWRpYS1pbmRpY2F0b3Itd2lkZ2V0IFwiLHtcInRcIjo0LFwiZlwiOltcIm5vdGxvYWRlZFwiXSxcIm5cIjo1MSxcInJcIjpcImNvbnRhaW5lckRhdGEubG9hZGVkXCJ9LFwiIFwiLHtcInRcIjo0LFwiZlwiOltcImhhc3JlYWN0aW9uc1wiXSxcIm5cIjo1MCxcInhcIjp7XCJyXCI6W1wiY29udGFpbmVyRGF0YS5yZWFjdGlvblRvdGFsXCJdLFwic1wiOlwiXzA+MFwifX1dfSxcIm1cIjpbe1widFwiOjIsXCJyXCI6XCJleHRyYUF0dHJpYnV0ZXNcIn1dLFwiZlwiOlt7XCJ0XCI6OCxcInJcIjpcImxvZ29cIn0sXCIgXCIse1widFwiOjQsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXJlYWN0aW9uLXRvdGFsXCJ9LFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcImNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbFwifV19XSxcIm5cIjo1MCxcInJcIjpcImNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbFwifSx7XCJ0XCI6NCxcIm5cIjo1MSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcmVhY3Rpb24tcHJvbXB0XCJ9LFwiZlwiOlt7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJtZWRpYS1pbmRpY2F0b3JfdGhpbmtcXFwiKVwifX1dfV0sXCJyXCI6XCJjb250YWluZXJEYXRhLnJlYWN0aW9uVG90YWxcIn1dfV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1wb3B1cFwifSxcIm9cIjpcImNzc3Jlc2V0XCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcG9wdXAtYm9keVwifSxcImZcIjpbe1widFwiOjgsXCJyXCI6XCJsb2dvXCJ9LHtcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXBvcHVwLXRleHRcIn0sXCJmXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcInBvcHVwLXdpZGdldF90aGlua1xcXCIpXCJ9fV19XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcGFnZSBhbnRlbm5hLXJlYWN0aW9ucy1wYWdlXCJ9LFwib1wiOlwiY3NzcmVzZXRcIixcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1ib2R5XCJ9LFwiZlwiOlt7XCJ0XCI6NCxcImZcIjpbe1widFwiOjQsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJ2XCI6e1widGFwXCI6XCJwbHVzb25lXCIsXCJtb3VzZWVudGVyXCI6XCJoaWdobGlnaHRcIixcIm1vdXNlbGVhdmVcIjpcImNsZWFyaGlnaGxpZ2h0c1wifSxcImFcIjp7XCJjbGFzc1wiOltcImFudGVubmEtcmVhY3Rpb24gXCIse1widFwiOjIsXCJ4XCI6e1wiclwiOltcInJlYWN0aW9uc0xheW91dENsYXNzXCIsXCJpbmRleFwiLFwiLi9jb3VudFwiXSxcInNcIjpcIl8wKF8xLF8yKVwifX1dfSxcImZcIjpbXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1yZWFjdGlvbi1ib3hcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcmVhY3Rpb24tdGV4dFwifSxcIm9cIjpcInNpemV0b2ZpdFwiLFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcIi4vdGV4dFwifV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcmVhY3Rpb24tY291bnRcIn0sXCJmXCI6W3tcInRcIjoyLFwiclwiOlwiLi9jb3VudFwifV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcGx1c29uZVwifSxcImZcIjpbXCIrMVwiXX0sXCIgXCIse1widFwiOjQsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJ2XCI6e1widGFwXCI6XCJzaG93bG9jYXRpb25zXCJ9LFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXJlYWN0aW9uLWxvY2F0aW9uXCJ9LFwiZlwiOlt7XCJ0XCI6OCxcInJcIjpcImxvY2F0aW9uSWNvblwifV19XSxcIm5cIjo1MCxcInJcIjpcImlzU3VtbWFyeVwifSx7XCJ0XCI6NCxcIm5cIjo1MSxcImZcIjpbe1widFwiOjQsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJ2XCI6e1widGFwXCI6XCJzaG93Y29tbWVudHNcIn0sXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcmVhY3Rpb24tY29tbWVudHMgaGFzY29tbWVudHNcIn0sXCJmXCI6W3tcInRcIjo4LFwiclwiOlwiY29tbWVudHNJY29uXCJ9LFwiIFwiLHtcInRcIjoyLFwiclwiOlwiLi9jb21tZW50Q291bnRcIn1dfV0sXCJuXCI6NTAsXCJyXCI6XCIuL2NvbW1lbnRDb3VudFwifSx7XCJ0XCI6NCxcIm5cIjo1MSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1yZWFjdGlvbi1jb21tZW50c1wifSxcImZcIjpbe1widFwiOjgsXCJyXCI6XCJjb21tZW50c0ljb25cIn1dfV0sXCJyXCI6XCIuL2NvbW1lbnRDb3VudFwifV0sXCJyXCI6XCJpc1N1bW1hcnlcIn1dfV19XSxcImlcIjpcImluZGV4XCIsXCJyXCI6XCJyZWFjdGlvbnNcIn1dLFwiblwiOjUwLFwiclwiOlwicmVhY3Rpb25zXCJ9XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1mb290ZXIgYW50ZW5uYS1yZWFjdGlvbnMtZm9vdGVyXCJ9LFwiZlwiOlt7XCJ0XCI6NCxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcInZcIjp7XCJ0YXBcIjpcInNob3dkZWZhdWx0XCJ9LFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXRoaW5rXCJ9LFwiZlwiOlt7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJyZWFjdGlvbnMtcGFnZV90aGlua1xcXCIpXCJ9fV19XSxcIm5cIjo1MCxcInJcIjpcInJlYWN0aW9uc1wifSx7XCJ0XCI6NCxcIm5cIjo1MSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1uby1yZWFjdGlvbnNcIn0sXCJmXCI6W3tcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCJdLFwic1wiOlwiXzAoXFxcInJlYWN0aW9ucy1wYWdlX25vX3JlYWN0aW9uc1xcXCIpXCJ9fV19XSxcInJcIjpcInJlYWN0aW9uc1wifSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXRleHQtbG9nb1wifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJhXCIsXCJhXCI6e1wiaHJlZlwiOlwiLy93d3cuYW50ZW5uYS5pc1wifSxcImZcIjpbXCJBbnRlbm5hXCJdfV19XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEgYW50ZW5uYS1yZWFjdGlvbnMtd2lkZ2V0XCIsXCJ0YWJpbmRleFwiOlwiMFwifSxcIm9cIjpcImNzc3Jlc2V0XCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwiZGl2XCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtaGVhZGVyXCJ9LFwiZlwiOlt7XCJ0XCI6OCxcInJcIjpcImxvZ29cIn0se1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtcmVhY3Rpb25zLXRpdGxlXCJ9LFwiZlwiOlt7XCJ0XCI6MixcInhcIjp7XCJyXCI6W1wiZ2V0TWVzc2FnZVwiXSxcInNcIjpcIl8wKFxcXCJyZWFjdGlvbnMtd2lkZ2V0X3RpdGxlXFxcIilcIn19XX0sXCIgXCIse1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJ2XCI6e1widGFwXCI6XCJjbG9zZVwifSxcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1yZWFjdGlvbnMtY2xvc2VcIn0sXCJmXCI6W1wiWFwiXX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXBhZ2UtY29udGFpbmVyXCJ9LFwiZlwiOltcIiBcIix7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXByb2dyZXNzLXBhZ2UgYW50ZW5uYS1wYWdlXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWJvZHlcIn19XX1dfV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJkaXZcIixcImFcIjp7XCJjbGFzc1wiOltcImFudGVubmEgYW50ZW5uYS1zdW1tYXJ5LXdpZGdldCBcIix7XCJ0XCI6NCxcImZcIjpbXCJub3Rsb2FkZWRcIl0sXCJuXCI6NTEsXCJyXCI6XCJwYWdlRGF0YS5zdW1tYXJ5TG9hZGVkXCJ9XX0sXCJvXCI6XCJjc3NyZXNldFwiLFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcImRpdlwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXN1bW1hcnktaW5uZXJcIn0sXCJmXCI6W3tcInRcIjo4LFwiclwiOlwibG9nb1wifSx7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1zdW1tYXJ5LXRpdGxlXCJ9LFwiZlwiOltcIiBcIix7XCJ0XCI6NCxcImZcIjpbe1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwic3VtbWFyeS13aWRnZXRfcmVhY3Rpb25zXFxcIilcIn19XSxcIm5cIjo1MCxcInhcIjp7XCJyXCI6W1wicGFnZURhdGEuc3VtbWFyeVRvdGFsXCJdLFwic1wiOlwiXzA9PT0wXCJ9fSx7XCJ0XCI6NCxcIm5cIjo1MSxcImZcIjpbe1widFwiOjQsXCJuXCI6NTAsXCJ4XCI6e1wiclwiOltcInBhZ2VEYXRhLnN1bW1hcnlUb3RhbFwiXSxcInNcIjpcIl8wPT09MVwifSxcImZcIjpbe1widFwiOjIsXCJ4XCI6e1wiclwiOltcImdldE1lc3NhZ2VcIl0sXCJzXCI6XCJfMChcXFwic3VtbWFyeS13aWRnZXRfcmVhY3Rpb25zX29uZVxcXCIpXCJ9fV19LHtcInRcIjo0LFwiblwiOjUwLFwieFwiOntcInJcIjpbXCJwYWdlRGF0YS5zdW1tYXJ5VG90YWxcIl0sXCJzXCI6XCIhKF8wPT09MSlcIn0sXCJmXCI6W1wiIFwiLHtcInRcIjoyLFwieFwiOntcInJcIjpbXCJnZXRNZXNzYWdlXCIsXCJwYWdlRGF0YS5zdW1tYXJ5VG90YWxcIl0sXCJzXCI6XCJfMChcXFwic3VtbWFyeS13aWRnZXRfcmVhY3Rpb25zX21hbnlcXFwiLFtfMV0pXCJ9fV19XSxcInhcIjp7XCJyXCI6W1wicGFnZURhdGEuc3VtbWFyeVRvdGFsXCJdLFwic1wiOlwiXzA9PT0wXCJ9fV19LHtcInRcIjo0LFwiZlwiOltcIiBcIix7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOltcImFudGVubmEtZXhwYW5kZWQtcmVhY3Rpb24gXCIse1widFwiOjQsXCJmXCI6W1wiYW50ZW5uYS1leHBhbmRlZC1maXJzdFwiXSxcIm5cIjo1MCxcInhcIjp7XCJyXCI6W1wiQGluZGV4XCJdLFwic1wiOlwiXzA9PT0wXCJ9fV19LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1leHBhbmRlZC10ZXh0XCJ9LFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcIi4vdGV4dFwifV19LHtcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWV4cGFuZGVkLWNvdW50XCJ9LFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcIi4vY291bnRcIn1dfV19XSxcInhcIjp7XCJyXCI6W1wiY29tcHV0ZUV4cGFuZGVkUmVhY3Rpb25zXCIsXCJwYWdlRGF0YS5zdW1tYXJ5UmVhY3Rpb25zXCJdLFwic1wiOlwiXzAoXzEpXCJ9fV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb21tZW50c1wifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJzdmdcIixcImZcIjpbe1widFwiOjcsXCJlXCI6XCJ1c2VcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1jb21tZW50cy1wYXRoXCIsXCJ4bGluazpocmVmXCI6XCIjYW50ZW5uYS1zdmctY29tbWVudFwifX1dfV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtZmFjZWJvb2tcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3ZnXCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwidXNlXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtZmFjZWJvb2stcGF0aFwiLFwieGxpbms6aHJlZlwiOlwiI2FudGVubmEtc3ZnLWZhY2Vib29rXCJ9fV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcInNwYW5cIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS1sZWZ0XCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInN2Z1wiLFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInVzZVwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxlZnQtcGF0aFwiLFwieGxpbms6aHJlZlwiOlwiI2FudGVubmEtc3ZnLWxlZnRcIn19XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxvY2F0aW9uXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInN2Z1wiLFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInVzZVwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxvY2F0aW9uLXBhdGhcIixcInhsaW5rOmhyZWZcIjpcIiNhbnRlbm5hLXN2Zy1zZWFyY2hcIn19XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxvZ29cIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3ZnXCIsXCJhXCI6e1widmlld0JveFwiOlwiMCAwIDUxMiA1MTJcIn0sXCJmXCI6W1wiIFwiLHtcInRcIjo3LFwiZVwiOlwicGF0aFwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxvZ28tcGF0aFwiLFwiZFwiOlwibTI4MyA1MTBjMTI1LTE3IDIyOS0xMjQgMjI5LTI1MyAwLTE0MS0xMTUtMjU2LTI1Ni0yNTYtMTQxIDAtMjU2IDExNS0yNTYgMjU2IDAgMTMwIDEwOCAyMzcgMjMzIDI1NGwwLTE0OWMtNDgtMTQtODQtNTAtODQtMTAyIDAtNjUgNDMtMTEzIDEwOC0xMTMgNjUgMCAxMDcgNDggMTA3IDExMyAwIDUyLTMzIDg4LTgxIDEwMnpcIn19XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLWxvZ29cIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3ZnXCIsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwidXNlXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtbG9nby1wYXRoXCIsXCJ4bGluazpocmVmXCI6XCIjYW50ZW5uYS1zdmctbG9nb1wifX1dfV19XX0iLCJtb2R1bGUuZXhwb3J0cz17XCJ2XCI6MyxcInRcIjpbe1widFwiOjcsXCJlXCI6XCJzcGFuXCIsXCJhXCI6e1wiY2xhc3NcIjpcImFudGVubmEtdHdpdHRlclwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJzdmdcIixcImZcIjpbe1widFwiOjcsXCJlXCI6XCJ1c2VcIixcImFcIjp7XCJjbGFzc1wiOlwiYW50ZW5uYS10d2l0dGVyLXBhdGhcIixcInhsaW5rOmhyZWZcIjpcIiNhbnRlbm5hLXN2Zy10d2l0dGVyXCJ9fV19XX1dfSIsIm1vZHVsZS5leHBvcnRzPXtcInZcIjozLFwidFwiOlt7XCJ0XCI6NyxcImVcIjpcInN2Z1wiLFwiYVwiOntcInhtbG5zXCI6XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLFwic3R5bGVcIjpcImRpc3BsYXk6IG5vbmU7XCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInN5bWJvbFwiLFwiYVwiOntcImlkXCI6XCJhbnRlbm5hLXN2Zy10d2l0dGVyXCIsXCJ2aWV3Qm94XCI6XCIwIDAgNTEyIDUxMlwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJwYXRoXCIsXCJhXCI6e1wiZFwiOlwibTQ1MyAxMzRjLTE0IDYtMzAgMTEtNDYgMTJjMTYtMTAgMjktMjUgMzUtNDRjLTE1IDktMzMgMTYtNTEgMTljLTE1LTE1LTM2LTI1LTU5LTI1Yy00NSAwLTgxIDM2LTgxIDgxYzAgNiAxIDEyIDIgMThjLTY3LTMtMTI3LTM1LTE2Ny04NGMtNyAxMi0xMSAyNS0xMSA0MGMwIDI4IDE1IDUzIDM2IDY4Yy0xMy0xLTI1LTQtMzYtMTFjMCAxIDAgMSAwIDJjMCAzOSAyOCA3MSA2NSA3OWMtNyAyLTE0IDMtMjIgM2MtNSAwLTEwLTEtMTUtMmMxMCAzMiA0MCA1NiA3NiA1NmMtMjggMjItNjMgMzUtMTAxIDM1Yy02IDAtMTMgMC0xOS0xYzM2IDIzIDc4IDM2IDEyNCAzNmMxNDkgMCAyMzAtMTIzIDIzMC0yMzBjMC0zIDAtNyAwLTEwYzE2LTEyIDI5LTI2IDQwLTQyelwifX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcInN5bWJvbFwiLFwiYVwiOntcImlkXCI6XCJhbnRlbm5hLXN2Zy1mYWNlYm9va1wiLFwidmlld0JveFwiOlwiMCAwIDUxMiA1MTJcIn0sXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwicGF0aFwiLFwiYVwiOntcImRcIjpcIm00MjAgNzJsLTMyOCAwYy0xMSAwLTIwIDktMjAgMjBsMCAzMjhjMCAxMSA5IDIwIDIwIDIwbDE3NyAwbDAtMTQybC00OCAwbDAtNTZsNDggMGwwLTQxYzAtNDggMjktNzQgNzEtNzRjMjAgMCAzOCAyIDQzIDNsMCA0OWwtMjkgMGMtMjMgMC0yOCAxMS0yOCAyN2wwIDM2bDU1IDBsLTcgNTZsLTQ4IDBsMCAxNDJsOTQgMGMxMSAwIDIwLTkgMjAtMjBsMC0zMjhjMC0xMS05LTIwLTIwLTIwelwifX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcInN5bWJvbFwiLFwiYVwiOntcImlkXCI6XCJhbnRlbm5hLXN2Zy1jb21tZW50XCIsXCJ2aWV3Qm94XCI6XCIwIDAgNTEyIDUxMlwifSxcImZcIjpbe1widFwiOjcsXCJlXCI6XCJwYXRoXCIsXCJhXCI6e1wiZFwiOlwibTUxMiAyNTZjMCAzMy0xMSA2NC0zNCA5MmMtMjMgMjgtNTQgNTAtOTMgNjZjLTQwIDE3LTgzIDI1LTEyOSAyNWMtMTMgMC0yNy0xLTQxLTJjLTM4IDMzLTgyIDU2LTEzMiA2OWMtOSAyLTIwIDQtMzIgNmMtNCAwLTcgMC05LTNjLTMtMi00LTQtNS04bDAgMGMtMS0xLTEtMiAwLTRjMC0xIDAtMiAwLTJjMC0xIDEtMiAyLTNsMS0zYzAgMCAxLTEgMi0yYzItMiAyLTMgMy0zYzEtMSA0LTUgOC0xMGM1LTUgOC04IDEwLTEwYzItMyA1LTYgOS0xMmM0LTUgNy0xMCA5LTE0YzMtNSA1LTEwIDgtMTdjMy03IDUtMTQgOC0yMmMtMzAtMTctNTQtMzgtNzEtNjNjLTE3LTI1LTI2LTUxLTI2LTgwYzAtMjUgNy00OCAyMC03MWMxNC0yMyAzMi00MiA1NS01OGMyMy0xNyA1MC0zMCA4Mi0zOWMzMS0xMCA2NC0xNSA5OS0xNWM0NiAwIDg5IDggMTI5IDI1YzM5IDE2IDcwIDM4IDkzIDY2YzIzIDI4IDM0IDU5IDM0IDkyelwifX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcInN5bWJvbFwiLFwiYVwiOntcImlkXCI6XCJhbnRlbm5hLXN2Zy1zZWFyY2hcIixcInZpZXdCb3hcIjpcIjAgMCA1MTIgNTEyXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInBhdGhcIixcImFcIjp7XCJkXCI6XCJtMzQ3IDIzOGMwLTM2LTEyLTY2LTM3LTkxYy0yNS0yNS01NS0zNy05MS0zN2MtMzUgMC02NSAxMi05MCAzN2MtMjUgMjUtMzggNTUtMzggOTFjMCAzNSAxMyA2NSAzOCA5MGMyNSAyNSA1NSAzOCA5MCAzOGMzNiAwIDY2LTEzIDkxLTM4YzI1LTI1IDM3LTU1IDM3LTkweiBtMTQ3IDIzN2MwIDEwLTQgMTktMTEgMjZjLTcgNy0xNiAxMS0yNiAxMWMtMTAgMC0xOS00LTI2LTExbC05OC05OGMtMzQgMjQtNzIgMzYtMTE0IDM2Yy0yNyAwLTUzLTUtNzgtMTZjLTI1LTExLTQ2LTI1LTY0LTQzYy0xOC0xOC0zMi0zOS00My02NGMtMTAtMjUtMTYtNTEtMTYtNzhjMC0yOCA2LTU0IDE2LTc4YzExLTI1IDI1LTQ3IDQzLTY1YzE4LTE4IDM5LTMyIDY0LTQzYzI1LTEwIDUxLTE1IDc4LTE1YzI4IDAgNTQgNSA3OSAxNWMyNCAxMSA0NiAyNSA2NCA0M2MxOCAxOCAzMiA0MCA0MyA2NWMxMCAyNCAxNiA1MCAxNiA3OGMwIDQyLTEyIDgwLTM2IDExNGw5OCA5OGM3IDcgMTEgMTUgMTEgMjV6XCJ9fV19LFwiIFwiLHtcInRcIjo3LFwiZVwiOlwic3ltYm9sXCIsXCJhXCI6e1wiaWRcIjpcImFudGVubmEtc3ZnLWxlZnRcIixcInZpZXdCb3hcIjpcIjAgMCA1MTIgNTEyXCJ9LFwiZlwiOlt7XCJ0XCI6NyxcImVcIjpcInBhdGhcIixcImFcIjp7XCJkXCI6XCJtMzY4IDE2MGwtNjQtNjQtMTYwIDE2MCAxNjAgMTYwIDY0LTY0LTk2LTk2elwifX1dfSxcIiBcIix7XCJ0XCI6NyxcImVcIjpcInN5bWJvbFwiLFwiYVwiOntcImlkXCI6XCJhbnRlbm5hLXN2Zy1sb2dvXCIsXCJ2aWV3Qm94XCI6XCIwIDAgNTEyIDUxMlwifSxcImZcIjpbXCIgXCIse1widFwiOjcsXCJlXCI6XCJwYXRoXCIsXCJhXCI6e1wiZFwiOlwibTI4MyA1MTBjMTI1LTE3IDIyOS0xMjQgMjI5LTI1MyAwLTE0MS0xMTUtMjU2LTI1Ni0yNTYtMTQxIDAtMjU2IDExNS0yNTYgMjU2IDAgMTMwIDEwOCAyMzcgMjMzIDI1NGwwLTE0OWMtNDgtMTQtODQtNTAtODQtMTAyIDAtNjUgNDMtMTEzIDEwOC0xMTMgNjUgMCAxMDcgNDggMTA3IDExMyAwIDUyLTMzIDg4LTgxIDEwMnpcIn19XX1dfV19IiwibW9kdWxlLmV4cG9ydHM9e1widlwiOjMsXCJ0XCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwib1wiOlwiY3NzcmVzZXRcIixcImFcIjp7XCJjbGFzc1wiOltcImFudGVubmEgYW50ZW5uYS10ZXh0LWluZGljYXRvci13aWRnZXQgXCIse1widFwiOjQsXCJmXCI6W1wibm90bG9hZGVkXCJdLFwiblwiOjUxLFwiclwiOlwiY29udGFpbmVyRGF0YS5sb2FkZWRcIn0sXCIgXCIse1widFwiOjQsXCJmXCI6W1wiaGFzcmVhY3Rpb25zXCJdLFwiblwiOjUwLFwieFwiOntcInJcIjpbXCJjb250YWluZXJEYXRhLnJlYWN0aW9uVG90YWxcIl0sXCJzXCI6XCJfMD4wXCJ9fSxcIiBcIix7XCJ0XCI6NCxcImZcIjpbXCJhbnRlbm5hLXN1cHByZXNzXCJdLFwiblwiOjUwLFwiclwiOlwiY29udGFpbmVyRGF0YS5zdXBwcmVzc1wifSxcIiBcIix7XCJ0XCI6MixcInJcIjpcImV4dHJhQ2xhc3Nlc1wifV19LFwiZlwiOlt7XCJ0XCI6OCxcInJcIjpcImxvZ29cIn0sXCIgXCIse1widFwiOjQsXCJmXCI6W3tcInRcIjo3LFwiZVwiOlwic3BhblwiLFwiYVwiOntcImNsYXNzXCI6XCJhbnRlbm5hLXJlYWN0aW9uLXRvdGFsXCJ9LFwiZlwiOlt7XCJ0XCI6MixcInJcIjpcImNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbFwifV19XSxcIm5cIjo1MCxcInJcIjpcImNvbnRhaW5lckRhdGEucmVhY3Rpb25Ub3RhbFwifV19XX0iXX0=
