
/*
 * Returns whether or not the given selector matches the given element.
 */
function matchesSelector(element, selector) {
    if (!Element.matches) {
        // Polyfill for browsers that don't support Element.matches.
        var parent = element.parentElement;
        if (parent) {
            var allMatches = parent.querySelectorAll(selector);
            for (var i = 0; i < allMatches.length; i++) {
                if (allMatches[i] === element) {
                    return true;
                }
            }
        }
        return false;
    }
    return element.matches(selector);
}

/*
 * Removes any child elements matching the given selector from the given element.
 */
function removeElements(element, selector) {
    var elementsToRemove = element.querySelectorAll(selector);
    for (var i = 0; i < elementsToRemove.length; i++) {
        var removeElement = elementsToRemove[i];
        if (removeElement.parentNode) {
            removeElement.parentNode.removeChild(removeElement);
        }
    }
}

module.exports = {
    matchesSelector: matchesSelector,
    removeElements: removeElements
};