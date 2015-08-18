var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var PopupWidget = require('./popup-widget');
var Range = require('./utils/range');
var ReactionsWidget = require('./reactions-widget');


function createReactableText(options) {
    // TODO: impose an upper limit on the length of text that can be reacted to?
    var containerData = options.containerData; // TODO delete?
    var $containerElement = options.containerElement;
    var pageData = options.pageData;
    var groupSettings = options.groupSettings;
    var defaultReactions = options.defaultReactions;

    $containerElement.on('mouseup', function(event) {
        var node = $containerElement.get(0);
        var point = Range.getSelectionEndPoint(node, event);
        if (point) {
            var coordinates = {
                top: point.y,
                left: point.x
            };
            PopupWidget.show(coordinates, function() {
                Range.grab($containerElement.get(0), function(text, location) {
                    // TODO: open the reaction widget showing the default reactions
                    // TODO: clear the highlighted range when the reaction window closes
                    console.log('text: "' + text + '" location: ' + location);
                    var reactionsWidget = ReactionsWidget.create({
                        //reactionsData: containerData.reactions,
                        containerData: containerData,
                        containerElement: $containerElement,
                        defaultReactions: defaultReactions,
                        pageData: pageData,
                        groupSettings: groupSettings
                    });
                    // TODO: don't leak. need to either clean up the reactions widget that we create or reuse.
                    reactionsWidget.open(coordinates);
                    // TODO: the below click handling is temporary
                    $(document).on('click.antenna-text', function(event) {
                        Range.clear();
                        $(document).off('click.antenna-text');
                    });
                });
            });
        }
    });
}

//noinspection JSUnresolvedVariable
module.exports = {
    createReactableText: createReactableText
};