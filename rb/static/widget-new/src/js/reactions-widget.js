var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var AjaxClient = require('./utils/ajax-client');
var Moveable = require('./utils/moveable');
var Range = require('./utils/range');
var TransitionUtil = require('./utils/transition-util');
var URLs = require('./utils/urls');
var WidgetBucket = require('./utils/widget-bucket');
var XDMClient = require('./utils/xdm-client');

function createReactionsWidget(options) {
    var reactionsData = options.reactionsData;
    var containerData = options.containerData;
    var containerElement = options.containerElement;
    var contentLocation = options.location;
    var contentType = options.contentType || "text"; // TODO
    var contentBody = options.body;
    var defaultReactions = options.defaultReactions;
    var pageData = options.pageData;
    var groupSettings = options.groupSettings;
    var colors = groupSettings.reactionBackgroundColors();
    var reactionsLayoutData = computeLayoutData(reactionsData, colors);
    var defaultLayoutData = computeLayoutData(defaultReactions, colors);
    var ractive = Ractive({
        el: WidgetBucket(),
        append: true,
        magic: true,
        data: {
            reactions: reactionsData,
            reactionsLayoutClass: arrayAccessor(reactionsLayoutData.layoutClasses),
            reactionsBackgroundColor: arrayAccessor(reactionsLayoutData.backgroundColors),
            defaultReactions: defaultReactions,
            defaultLayoutClass: arrayAccessor(defaultLayoutData.layoutClasses),
            defaultBackgroundColor: arrayAccessor(defaultLayoutData.backgroundColors),
            response: {}
        },
        template: require('../templates/reactions-widget.html'),
        decorators: {
            sizetofit: sizeToFit
        },
        antenna: {} // create our own property bucket on the instance
    });
    ractive.on('complete', function() {
        var $rootElement = $(rootElement(ractive));
        Moveable.makeMoveable($rootElement, $rootElement.find('.antenna-header'));
    });
    ractive.on('change', function() {
        reactionsLayoutData = computeLayoutData(reactionsData, colors);
    });
    if (containerElement) {
        ractive.on('highlight', highlightContent(containerData, pageData, ractive, containerElement));
        ractive.on('clearhighlights', Range.clearHighlights);
    }
    ractive.on('plusone', plusOne(containerData, pageData, ractive));
    ractive.on('newreaction', newDefaultReaction(containerData, pageData, contentBody, contentLocation, contentType, ractive));
    return {
        open: openWindow(reactionsData, ractive)
    };
}

function arrayAccessor(array) {
    return function(index) {
        return array[index];
    }
}

function sizeToFit(node) {
    var $element = $(node);
    var $rootElement = $element.closest('.antenna-reactions-widget');
    if ($rootElement.length > 0) {
        $rootElement.css({display: 'block', left: '100%'});
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
        $rootElement.css({display: '', left: ''});
    }
    return { teardown: function() {} };
}

function highlightContent(containerData, pageData, ractive, $containerElement) {
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

function newDefaultReaction(containerData, pageData, contentBody, contentLocation, contentType, ractive) {
    return function(event) {
        var defaultReactionData = event.context;
        // TODO: consider whether this should be abstracted away from the widget
        // TODO: update the ractive instance to populate with the new reactions data (i.e. just this one reaction)
        // TODO: propagate the data change to the container indicator widget so it can update its count/visibility
        containerData.reactions.push(defaultReactionData);
        // TODO: check back on this as the way to propogate data changes back to the summary
        pageData.summaryTotal = pageData.summaryTotal + 1;

        var success = function(response) {
            if (response.existing) {
                // TODO: Decrement the reaction counts if the response was a dup.
                //       Simply decrementing the count causes the full/half classes to get re-evaluated and screwed up
                //reactionData.count = reactionData.count - 1;
                //pageData.summaryTotal = pageData.summaryTotal - 1;
                // TODO: We can either access this data through the ractive keypath or by passing the data object around. Pick one.
                ractive.set('response.existing', response.existing);
            }
            showPage('.antenna-confirm-page', ractive, true);
        };
        var error = function(message) {
            // TODO handle any errors that occur posting a reaction
            console.log("error posting new reaction: " + message);
        };
        AjaxClient.postNewReaction(defaultReactionData, containerData, pageData, contentLocation, contentBody, contentType, success, error);
    }
}

function plusOne(containerData, pageData, ractive) {
    return function(event) {
        // Optimistically update our local data store and the UI. Then send the request to the server.
        var reactionData = event.context;
        reactionData.count = reactionData.count + 1;
        // TODO: check back on this as the way to propogate data changes back to the summary
        pageData.summaryTotal = pageData.summaryTotal + 1;

        var success = function(response) {
            if (response.existing) {
                // TODO: Decrement the reaction counts if the response was a dup.
                //       Simply decrementing the count causes the full/half classes to get re-evaluated and screwed up
                //reactionData.count = reactionData.count - 1;
                //pageData.summaryTotal = pageData.summaryTotal - 1;
                // TODO: We can either access this data through the ractive keypath or by passing the data object around. Pick one.
                ractive.set('response.existing', response.existing);
            }
            showPage('.antenna-confirm-page', ractive, true);
        };
        var error = function(message) {
            // TODO handle any errors that occur posting a reaction
            console.log("error posting plus one: " + message);
        };
        AjaxClient.postPlusOne(reactionData, containerData, pageData, success, error);
    };
}

function computeLayoutData(reactionsData, colors) {
    // TODO Verify that the reactionsData is coming back from the server sorted. If not, sort it after its fetched.

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

function rootElement(ractive) {
    return ractive.find('.antenna-reactions-widget');
}

var pageZ = 1000; // It's safe for this value to go across instances. We just need it to continuously increase (max value is over 2 billion).

function showPage(pageSelector, ractive, animate) {
    var $root = $(rootElement(ractive));
    var $page = $root.find(pageSelector);
    $page.css('z-index', pageZ);
    pageZ += 1;

    $page.toggleClass('antenna-page-animate', animate);
    if (animate) {
        TransitionUtil.toggleClass($page, 'antenna-page-active', true, function() {
            // After the new page slides into position, move the other pages back out of the viewable area
            $root.find('.antenna-page:not(.antenna-page-active)').removeClass('antenna-page-active');
        });
    } else {
        $root.find('.antenna-page').removeClass('antenna-page-active');
        $page.addClass('antenna-page-active');
    }
    sizeBodyToFit(ractive, $page, animate);
}

function sizeBodyToFit(ractive, $element, animate) {
    var $root = $(rootElement(ractive));
    var $body = $root.find('.antenna-body');
    var currentHeight = $body.css('height');
    $body.css({ height: '' }); // Clear any previously computed height so we get a fresh computation of the child heights
    var newHeight = Math.min(300, $element.get(0).scrollHeight);
    if (animate) {
        $body.css({ height: currentHeight });
        $body.animate({ height: newHeight });
    } else {
        $body.css({ height: newHeight });
    }
    // TODO: we might not need width resizing at all.
    var minWidth = $element.css('min-width');
    var width = (parseInt(minWidth) > 0) ? minWidth: '';
    if (animate) {
        $root.animate({ width: width });
    } else {
        $root.css({ width: width });
    }
}

function openWindow(reactionsData, ractive) {
    return function(elementOrCoords) {
        $('.antenna-reactions-widget').trigger('focusout'); // Prompt any other open windows to close.
        var coords;
        if (elementOrCoords.top && elementOrCoords.left) {
            coords = elementOrCoords;
        } else {
            var $relativeElement = $(elementOrCoords);
            var offset = $relativeElement.offset();
            coords = {
                top: offset.top + 5,
                left: offset.left + 5
            };
        }
        // TODO: Look at whether we're opening off screen and adjust the coords if needed
        var $rootElement = $(rootElement(ractive));
        $rootElement.stop(true, true).addClass('open').css(coords);

        if (reactionsData.length > 0) {
            showPage('.antenna-reactions-page', ractive, false);
        } else {
            // TODO allow to override and force showing of default
            showPage('.antenna-default-page', ractive, false);
        }

        setupWindowClose(ractive);
    };
}

function setupWindowClose(ractive) {
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
        })
        .on('focusout.antenna', function() {
            closeWindow();
        });
    $(document).on('click.antenna', function(event) {
        if ($(event.target).closest('.antenna-reactions-widget').length === 0) {
            closeWindow();
        }
    });

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
        Range.clearHighlights();
    }
}

//noinspection JSUnresolvedVariable
module.exports = {
    create: createReactionsWidget
};