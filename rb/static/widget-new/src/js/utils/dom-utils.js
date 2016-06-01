
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

module.exports = {
    matchesSelector: matchesSelector
};