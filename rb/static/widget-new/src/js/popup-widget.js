var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var WidgetBucket = require('./utils/widget-bucket');

var ractive;
var clickHandler;

function getRootElement(callback) {
    // TODO revisit this, it's kind of goofy and it might have a timing problem
    if (!ractive) {
        var bucket = WidgetBucket();
        ractive = Ractive({
            el: bucket,
            append: true,
            template: require('../templates/popup-widget.html')
        });
        ractive.on('complete', function() {
            var $element = $(ractive.find('.antenna-popup'));
            callback($element);
        })
    } else {
        callback($(ractive.find('.antenna-popup')));
    }
}

function notifyClick(event) {
    if (clickHandler) {
        clickHandler();
    }
}

function showPopup(coordinates, callback) {
    getRootElement(function($element) {
        if (!$element.hasClass('show')) {
            clickHandler = callback;
            $element
                .show() // still has opacity 0 at this point
                .css({
                    top: coordinates.top - $element.outerHeight() - 6, // TODO find a cleaner way to account for the popup 'tail'
                    left: coordinates.left - Math.floor($element.outerWidth() / 2)
                });
            internalSetVisible($element, true, function() {
                // TODO: after the appearance transition is complete, add a handler for mouseenter which then registers
                //       a handler for mouseleave that hides the popup
            });
            // TODO: also take down the popup if the user mouses over another widget (summary or indicator)
            $(document).on('click.antenna-popup', function () {
                hidePopup($element);
            });
        }
    });
}

function hidePopup($element) {
    internalSetVisible($element, false, function() {
        $element.hide(); // after we're at opacity 0, hide the element so it doesn't receive accidental clicks
    });
    $(document).off('click.antenna-popup');
}

function internalSetVisible($element, visible, nextStep) {
    $element.on("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd",
        function(event) {
            // once the CSS transition to opacity:0 is complete, call our next step
            // See: http://stackoverflow.com/questions/9255279/callback-when-css3-transition-finishes
            if (event.target == event.currentTarget) {
                $element.off(event);
                if (nextStep) {
                    nextStep();
                }
            }
        }
    );
    visible ? $element.addClass('show') : $element.removeClass('show');
}

//noinspection JSUnresolvedVariable
module.exports = {
    show: showPopup
};