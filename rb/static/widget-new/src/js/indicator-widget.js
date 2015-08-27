var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var PopupWidget = require('./popup-widget');
var ReactionsWidget = require('./reactions-widget');
var Range = require('./utils/range');


function createIndicatorWidget(options) {
    // TODO: Adjust visibility based on whether there are reactions on the content (honoring the flag about how many to show at once).
    // TODO: Show intermediate popup thingy when there are no reactions
    var element = options.element;
    var containerData = options.containerData;
    var $containerElement = options.containerElement;
    var pageData = options.pageData;
    var groupSettings = options.groupSettings;
    var defaultReactions = options.defaultReactions;
    var ractive = Ractive({
        el: element,
        magic: true,
        data: {
            containerData: containerData
        },
        template: require('../templates/indicator-widget.hbs.html')
    });

    var reactionWidgetOptions = {
        reactionsData: containerData.reactions,
        containerData: containerData,
        containerElement: $containerElement,
        defaultReactions: defaultReactions,
        pageData: pageData,
        groupSettings: groupSettings
    };

    var hoverTimeout;
    ractive.on('complete', function() {
        var $rootElement = $(rootElement(ractive));
        $rootElement.on('mouseenter.antenna', function(event) {
            if (event.buttons !== 0) {
                // Don't react if the user is dragging or selecting text.
                return;
            }
            if (containerData.reactions.length > 0) {
                openReactionsWindow(reactionWidgetOptions, ractive);
            } else {
                clearTimeout(hoverTimeout); // only one timeout at a time
                hoverTimeout = setTimeout(function() {
                    var $icon = $(rootElement(ractive)).find('.ant-antenna-logo');
                    var offset = $icon.offset();
                    var coordinates = {
                        top: offset.top + Math.floor($icon.height() / 2), // TODO this number is a little off because the div doesn't tightly wrap the inserted font character
                        left: offset.left + Math.floor($icon.width() / 2)
                    };
                    PopupWidget.show(coordinates, grabNodeAndOpenOnSelection($containerElement.get(0), reactionWidgetOptions, ractive));
                }, 200);
            }
        });
        $rootElement.on('mouseleave.antenna', function() {
            clearTimeout(hoverTimeout);
        });
        $containerElement.on('mouseenter.antenna', function() {
            $rootElement.addClass('active');
        });
        $containerElement.on('mouseleave.antenna', function() {
            $rootElement.removeClass('active');
        })
    });
}

function grabNodeAndOpenOnSelection(node, reactionWidgetOptions, ractive) {
    return function() {
        Range.grabNode(node, function(text, location) {
            reactionWidgetOptions.location = location;
            reactionWidgetOptions.body = text;
            openReactionsWindow(reactionWidgetOptions, ractive);
        });
    }
}

function rootElement(ractive) {
    return ractive.find('.antenna-indicator-widget');
}

// TODO refactor this duplicated code from summary-widget.js
function openReactionsWindow(reactionOptions, ractive) {
    if (!ractive.reactionsWidget) {
        ractive.reactionsWidget = ReactionsWidget.create(reactionOptions);
    }
    ractive.reactionsWidget.open(rootElement(ractive));
}

//noinspection JSUnresolvedVariable
module.exports = {
    create: createIndicatorWidget
};