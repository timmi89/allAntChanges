
var $;
require('./script-loader').on$(function(jQuery) {
    $=jQuery;
});

// TODO this is totally speculative!

var elements = {}; // hash --> element
var interactions = {}; // hash --> interactions

function computeHash($element) {
    // TODO
    return 'abc';
}

function getHash(element) { // TODO pass in DOM node or can we assume jQuery?
    var $element = $(element);
    var id = $element.data('ant-id');
    var hash = hashes[id];
    if (!hash) {
        hash = computeHash($element);
    }
}

function setHash(hash, element) {
    elements[hash] = element;
    // TODO
}

function getElement(hash) {
    // TODO return the element with the given hash
}

function getInteractions(content) {

}

//noinspection JSUnresolvedVariable
module.exports = {
    setHash: setHash,
    getHash: getHash,
    getInteractions: getInteractions
};