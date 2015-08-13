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

// Attempts to get a range from the current selection. This expands the
// selected region to include word boundaries.
function grabRange(node, callback) {
    if (rangy) {
        // TODO: make sure the selection is within the given node
        var selection = rangy.getSelection();
        if (!selection.isCollapsed && selection.rangeCount === 1) {
            var range = selection.getRangeAt(0);
            range.expand('word');
            getClassApplier().applyToRange(range);
            highlightedRanges.push(range);

            var location = rangy.serializeRange(range, true, node);
            var text = range.toString();
            callback(text, location);
        }
    }
}

// Highlights the given location inside the given node.
function highlightLocation(node, location) {
    // TODO error handling in case the range is not valid?
    if (rangy && rangy.canDeserializeRange(location, node, document)) {
        var range = rangy.deserializeRange(location, node, document);
        getClassApplier().applyToRange(range);
        highlightedRanges.push(range);
    }
}

// Clears all highlights that have been created on the page.
function clearHighlights() {
    if (rangy) {
        var classApplier = getClassApplier();
        for (var i = 0; i < highlightedRanges.length; i++) {
            var range = highlightedRanges[i];
            if (classApplier.isAppliedToRange(range)) {
                classApplier.undoToRange(range);
            }
        }
        highlightedRanges = [];
    }
}

//noinspection JSUnresolvedVariable
module.exports = {
    grab: grabRange,
    clear: clearHighlights,
    highlight: highlightLocation
};