
var $; require('./script-loader').on$(function(jQuery) { $=jQuery; });
var XDMClient = require('./utils/xdm-client');
var URLs = require('./utils/urls');

var ractive;

function createReactionsWidget(container, pageData) {
    var reactionsData = pageData.topReactions;
    var layoutClasses = computeLayoutClasses(reactionsData);
    ractive = Ractive({
        el: container,
        magic: true,
        data: {
            reactions: reactionsData,
            layoutClass: function(index) {
                console.log(reactionsData);
                return layoutClasses[index];
            }
        },
        template: require('../templates/reactions-widget.html')
    });
    ractive.on('complete', function() {
        $(rootElement())
                .on('mouseover', keepWindowOpen)
                .on('mouseout', delayedCloseWindow);
    });
    ractive.on('change', function() {
        layoutClasses = computeLayoutClasses(reactionsData);
    });
    ractive.on('plusone', function(event) {
        var reactionData = event.context;
        reactionData.count = reactionData.count + 1;
        // TODO: check back on this as the way to propogate data changes back to the summary
        pageData.summary.totalReactions = pageData.summary.totalReactions + 1;


        // TODO send the click to the server

        XDMClient.getUser(function(response) {
            var userInfo = response.data;
            // TODO extract the shape of this data and possibly the whole API call
            // TODO this is only handling the summary case. need to generalize the widget to handle containers/content
            var data = {
                tag: {
                    body: reactionData.text,
                    id: reactionData.id,
                    tag_count: reactionData.count // TODO why??
                },
                hash: 'page',
                kind: 'page',
                content_node: '',
                user: {
                    img_url: '', // TODO why?
                    ant_token: userInfo.ant_token,
                    user_id: userInfo.user_id,
                    sts: '', // TODO ??
                    lts: '', // TODO ??
                    user_type: userInfo.user_type // TODO what is this?
                },
                user_id: userInfo.user_id

            };
            var success = function(json) {
                console.log('success!');
            };
            var error = function(message) {
                console.log("error!");
            };
            $.getJSONP(URLs.createReactionUrl(), data, success, error);
        });
    });
    return {
        open: openWindow
    };
}

function computeLayoutClasses(reactionsData) {
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
    for (var i = 0; i < numReactions; i++) {
        if (reactionsData[i].count > midValue) {
            layoutClasses[i] = 'full';
        } else {
            layoutClasses[i] = 'half';
        }
    }
    return layoutClasses;
}

function rootElement() {
    // TODO: gotta be a better way to get this
    return ractive.find('div');
}

function openWindow(relativeElement) {
    if (ractive) {
        var $relativeElement = $(relativeElement);
        var offset = $relativeElement.offset();
        var coords = {
            top: offset.top + $relativeElement.height(),
            left: offset.left
        };
        var $element = $(rootElement());
        $element.stop(true, true).addClass('open').css(coords);
    }

}

var closeTimer;

function keepWindowOpen() {
    if (closeTimer) { clearTimeout(closeTimer); }
}

function delayedCloseWindow() {
    closeTimer = setTimeout(function() {
        closeTimer = null;
        closeWindow();
    }, 1500);
}

function closeWindow() {
    var $element = $(ractive.find('div'));
    $element.stop(true, true).fadeOut('fast', function() {
        $element.css('display', ''); // Clear the display:none that fadeOut puts on the element
        $element.removeClass('open');
    });
}

module.exports = {
    create: createReactionsWidget
};