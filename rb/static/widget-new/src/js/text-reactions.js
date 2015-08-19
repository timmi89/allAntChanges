var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var PopupWidget = require('./popup-widget');
var Range = require('./utils/range');
var ReactionsWidget = require('./reactions-widget');


function createReactableText(options) {
    // TODO: impose an upper limit on the length of text that can be reacted to? (applies to the indicator-widget too)
    var $containerElement = options.containerElement;
    var reactionsWidgetOptions = {
        reactionsData: [], // Always open with the default reactions
        containerData: options.containerData,
        containerElement: $containerElement,
        defaultReactions: options.defaultReactions,
        pageData: options.pageData,
        groupSettings: options.groupSettings
    };

    $containerElement.on('mouseup', function(event) {
        var node = $containerElement.get(0);
        var point = Range.getSelectionEndPoint(node, event);
        if (point) {
            var coordinates = { top: point.y, left: point.x };
            PopupWidget.show(coordinates, grabSelectionAndOpen(node, coordinates, reactionsWidgetOptions));
        }
    });
}

function grabSelectionAndOpen(node, coordinates, reactionsWidgetOptions) {
    return function() {
        Range.grabSelection(node, function(text, location) {
            // TODO: open the reaction widget showing the default reactions
            reactionsWidgetOptions.location = location;
            reactionsWidgetOptions.body = text;
            var reactionsWidget = ReactionsWidget.create(reactionsWidgetOptions);
            // TODO: don't leak. need to either clean up the reactions widgets that we create or reuse.
            reactionsWidget.open(coordinates);
        });
    }
}

//noinspection JSUnresolvedVariable
module.exports = {
    createReactableText: createReactableText
};