var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var XDMClient = require('./utils/xdm-client');
var URLs = require('./utils/urls');
var Moveable = require('./utils/moveable');
var Range = require('./utils/range');
var WidgetBucket = require('./utils/widget-bucket');

function createReactionsWidget(options) {
    var reactionsData = options.reactionsData;
    var containerData = options.containerData;
    var containerElement = options.containerElement;
    var pageData = options.pageData;
    var groupSettings = options.groupSettings;
    if (!reactionsData) {
        // TODO handle the case of no reactions (show default reactions)
        return { open: function(){} };
    }
    var colors = groupSettings.reactionBackgroundColors();
    var layoutData = computeLayoutData(reactionsData, colors);
    var ractive = Ractive({
        el: WidgetBucket(),
        append: true,
        magic: true,
        data: {
            reactions: reactionsData,
            response: {},
            layoutClass: function(index) {
                return layoutData.layoutClasses[index];
            },
            backgroundColor: function(index) {
                return layoutData.backgroundColors[index];
            }
        },
        template: require('../templates/reactions-widget.html'),
        decorators: {
            sizetofit: sizeToFit
        }
    });
    ractive.on('complete', function() {
        var $rootElement = $(rootElement(ractive));
        Moveable.makeMoveable($rootElement, $rootElement.find('.antenna-header'));
        showReactions(ractive, false); // Make sure the window is sized properly.
    });
    ractive.on('change', function() {
        layoutData = computeLayoutData(reactionsData, colors);
    });
    ractive.on('update', function() {
        console.log('update!');
    });
    if (containerElement) {
        ractive.on('highlight', highlightContent(containerData, pageData, ractive, containerElement));
        ractive.on('clearhighlights', Range.clear);
    }
    ractive.on('plusone', plusOne(containerData, pageData, ractive));
    return {
        open: openWindow(ractive)
    };
}

function sizeToFit(node) {
    var $element = $(node);
    var $rootElement = $element.closest('.antenna-reactions-widget');
    if ($rootElement.length > 0) {
        $rootElement.css({display: 'block', left: '100%'});
        var $parent = $element.closest('.antenna-reaction-box');
        var ratio = $parent.outerWidth() / node.scrollWidth;
        if (ratio < 1.0) { // If the text doesn't fit, first try to wrap it to two lines. Then scale it down if still necessary.
            var text = node.innerHTML;
            var mid = Math.ceil(text.length / 2); // Look for the closest space to the middle, weighted slightly (Math.ceil) toward a space in the second half.
            var secondHalfIndex = text.indexOf(' ', mid);
            var firstHalfIndex = text.lastIndexOf(' ', mid);
            var splitIndex = Math.abs(secondHalfIndex - mid) < Math.abs(mid - firstHalfIndex) ? secondHalfIndex : firstHalfIndex;
            if (splitIndex > 1) {
                node.innerHTML = text.slice(0, splitIndex) + '<br>' + text.slice(splitIndex);
                ratio = $parent.outerWidth() / node.scrollWidth;
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

function plusOne(containerData, pageData, ractive) {
    return function(event) {
        // Optimistically update our local data store and the UI. Then send the request to the server.
        var reactionData = event.context;
        reactionData.count = reactionData.count + 1;
        // TODO: check back on this as the way to propogate data changes back to the summary
        pageData.summaryTotal = pageData.summaryTotal + 1;

        XDMClient.getUser(function(response) {
            var userInfo = response.data;
            postPlusOne(reactionData, userInfo, containerData, pageData, ractive);
        });
    };
}

function postPlusOne(reactionData, userInfo, containerData, pageData, ractive) {
    // TODO extract the shape of this data and possibly the whole API call
    // TODO figure out which parts don't get passed for a new reaction
    // TODO compute field values (e.g. container_kind and content info) for new reactions
    if (!reactionData.content) {
        // This is a summary reaction. See if we have any container data that we can link to it.
        var containerReactions = containerData.reactions;
        for (var i = 0; i < containerData.reactions.length; i++) {
            var containerReaction = containerData.reactions[i];
            if (containerReaction.id == reactionData.id) {
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
        is_default: 'true', // TODO
        hash: containerData.hash,
        user_id: userInfo.user_id,
        ant_token: userInfo.ant_token,
        page_id: pageData.pageId,
        group_id: pageData.groupId,
        container_kind: containerData.type, // 'page', 'text', 'media', 'img'
        content_node_data: {
            id: reactionData.content.id,
            location: reactionData.content.location,
            body: '', // TODO: this is needed to create new content reactions
            kind: reactionData.content.kind, // 'pag', 'txt', 'med', 'img'
            item_type: '' // TODO: looks unused but TagHandler blows up without it
        }
    };
    var success = function(json) {
        var response = { // TODO: just capturing the api format...
            existing: json.existing,
            interaction: {
                id: json.interaction.id,
                interaction_node: {
                    body: json.interaction.interaction_node.body,
                    id: json.interaction.interaction_node.id
                }
            }
        };
        //if (json.existing) {
        //    handleDuplicateReaction(reactionData);
        //} else {
        //    handleNewReaction(reactionData);
        //}
        if (response.existing) {
            // TODO: Decrement the reaction counts if the response was a dup.
            //       Simply decrementing the count causes the full/half classes to get re-evaluated and screwed up
            //reactionData.count = reactionData.count - 1;
            //pageData.summaryTotal = pageData.summaryTotal - 1;
            // TODO: We can either access this data through the ractive keypath or by passing the data object around. Pick one.
            ractive.set('response.existing', response.existing);
        }
        showReactionResult(ractive);
    };
    var error = function(message) {
        // TODO handle any errors that occur posting a reaction
    };
    $.getJSONP(URLs.createReactionUrl(), data, success, error);
}

function computeLayoutData(reactionsData, colors) {
    // TODO Verify that the reactionsData is coming back from the server sorted. If not, sort it after its fetched.

    var numReactions = reactionsData.length;
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

    var numColors = colors.length;
    var backgroundColors = [];
    var colorIndex = 0;
    var pairWithNext = 0;
    for (var i = 0; i < numReactions; i++) {
        backgroundColors[i] = colors[colorIndex%numColors];
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

function showReactionResult(ractive) {
    var $root = $(rootElement(ractive));
    // TODO: This is probably where a Ractive partial comes in. Need a nested template here for showing the result.
    $root.find('.antenna-confirm-page').animate({ left: 0 });
    sizeBodyToFit(ractive, $root.find('.antenna-confirm-page'), true);
    $root.animate({ width: 300 }, { delay: 100 }); // TODO this is just a dummy to show resizing
    setTimeout(function() {
        showReactions(ractive, true);
    }, 1000);
}

function showReactions(ractive, animate) {
    var $root = $(rootElement(ractive));
    if (animate) {
        $root.find('.antenna-confirm-page').animate({ left: '100%' });
        $root.animate({ width: 200 });
    } else {
        $root.find('.antenna-confirm-page').css({ left: '100%' });
        $root.css({ width: 200 });
    }
    sizeBodyToFit(ractive, $root.find('.antenna-reactions-page'), animate);
}

function sizeBodyToFit(ractive, $element, animate) {
    var $body = $(ractive.find('.antenna-body'));
    if (animate) {
        $body.animate({ height: Math.min(300, $element.get(0).scrollHeight) });
    } else {
        $body.css({ height: Math.min(300, $element.get(0).scrollHeight) });
    }
}

function openWindow(ractive) {
    return function(relativeElement) {
        $('.antenna-reactions-widget').trigger('focusout'); // Prompt any other open windows to close.
        var $relativeElement = $(relativeElement);
        var offset = $relativeElement.offset();
        var coords = {
            top: offset.top + 5,//$relativeElement.height(),
            left: offset.left + 5
        };
        var $rootElement = $(rootElement(ractive));
        $rootElement.stop(true, true).addClass('open').css(coords);

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
    }
}

//noinspection JSUnresolvedVariable
module.exports = {
    create: createReactionsWidget
};