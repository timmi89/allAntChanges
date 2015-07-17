
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

function createPage(json) {
    var numReactions = 0;
    var numComments = 0;
    var numShares = 0;

    var summaryEntries = json.summary;
    if (summaryEntries) {
        for (var i = 0; i < summaryEntries.length; i++) {
            var summaryEntry = summaryEntries[i];
            if (summaryEntry.kind === 'tag') {
                numReactions = summaryEntry.count;
            } else if (summaryEntry.kind === 'com') {
                numComments = summaryEntry.count;
            } else if (summaryEntry.kind === 'shr') {
                numShares = summaryEntry.count;
            }
        }
    }

    var topReactions = [];
    var reactionsData = json.toptags;
    if (reactionsData) {
        for (var j = 0; j < reactionsData.length; j++) {
            var reaction = reactionsData[j];
            topReactions[j] = {
                id: reaction.id,
                count: reaction.tag_count,
                text: reaction.body
            }
        }
    }

    return {
        pageId: json.id,
        pageHash: json.urlhash,
        summary: {
            totalReactions: numReactions,
            totalComments: numComments,
            totalShares: numShares
        },
        topReactions: topReactions,
        containers: json.containers // array of objects with 'id' and 'hash' properties, including the magic 'page' hash value
    };
}

function createFromJSON(jsonPages) {
    // TODO Put more structure around this? e.g. Lookup functions?
    pages = [];
    for (var i = 0; i < jsonPages.length; i++) {
        pages[i] = createPage(jsonPages[i]);
    }
    return pages;

}

//noinspection JSUnresolvedVariable
module.exports = {
    create: createFromJSON,
    setHash: setHash,
    getHash: getHash,
    getInteractions: getInteractions
};