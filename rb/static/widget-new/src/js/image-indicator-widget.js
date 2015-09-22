var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var ReactionsWidget = require('./reactions-widget');
var ResizeHandler = require('./utils/resize-handler');


function createIndicatorWidget(options) {
    // TODO: validate that options contains all required properties (applies to all widgets).
    var element = options.element;
    var containerData = options.containerData;
    var $containerElement = options.containerElement;
    var pageData = options.pageData;
    var groupSettings = options.groupSettings;
    var defaultReactions = options.defaultReactions;
    var coords = options.coords;
    var imageUrl = options.imageUrl;
    var imageDimensions = options.imageDimensions;
    var ractive = Ractive({
        el: element,
        append: true,
        magic: true,
        data: {
            containerData: containerData
        },
        template: require('../templates/image-indicator-widget.hbs.html')
    });

    var reactionWidgetOptions = {
        reactionsData: containerData.reactions,
        containerData: containerData,
        containerElement: $containerElement,
        contentData: {
            type: 'img',
            body: imageUrl,
            dimensions: imageDimensions
        },
        defaultReactions: defaultReactions,
        pageData: pageData,
        groupSettings: groupSettings
    };

    var hoverTimeout;
    var activeTimeout;

    var $rootElement = $(rootElement(ractive));
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
            }, 200);
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
        $rootElement.removeClass('active');
    });
    setupPositioning($containerElement, ractive);
}

function setupPositioning($imageElement, ractive) {
    var $rootElement = $(rootElement(ractive));
    positionIndicator($imageElement, $rootElement);

    var reposition = function() {
        positionIndicator($imageElement, $rootElement);
    };
    ResizeHandler.onResize(reposition);
    ractive.on('teardown', function() {
        ResizeHandler.offResize(reposition);
    });

    function positionIndicator() {
        // TODO: let this be configured
        // TODO: Review how we handle image positioning. Currently, 'top' and 'bottom' pin the widget's top and bottom to those coordinates,
        //       as measured from the top (not the same as CSS positioning which measures bottom from the bottom of the relative parent)
        var imageOffset = $imageElement.offset();
        $rootElement.css({
            top: imageOffset.top + $imageElement.height() - $rootElement.outerHeight(),
            left: imageOffset.left
        });
    }
}

function rootElement(ractive) {
    return ractive.find('.antenna-image-indicator-widget');
}

function openReactionsWindow(reactionOptions, ractive) {
    ReactionsWidget.open(reactionOptions, rootElement(ractive));
}

//noinspection JSUnresolvedVariable
module.exports = {
    create: createIndicatorWidget
};