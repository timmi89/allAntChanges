

var ractive;

function createReactionsWidget(container, reactionsData) {
    var layoutClasses = computeLayoutClasses(reactionsData);
    ractive = Ractive({
        el: container,
        data: {
            reactions: reactionsData,
            layoutClass: function(index) {
                return layoutClasses[index];
            }
        },
        template: require('../templates/reactions-widget.html'),
        oncomplete: function() {
            var that = this;
            $(rootElement())
                .on('mouseover', keepWindowOpen)
                .on('mouseout', delayedCloseWindow);
        }
    });
    return {
        open: openWindow,
        close: closeWindow,
        delayedClose: delayedCloseWindow
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
        total += reactionsData[i];
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
        var offset = $(relativeElement).offset();
        var coords = {
            top: offset.top,
            left: offset.left
        };
        var $element = $(rootElement());
        $element.stop(true, true).addClass('open').css(coords);
    }

}

var closeTimer;

function keepWindowOpen() {
    if (closeTimer) { closeTimer.clearTimeout(); }
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