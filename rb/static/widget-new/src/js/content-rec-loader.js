var AjaxClient = require('./utils/ajax-client');

var contentFetchTriggerSize = 0; // The size of the pool at which we'll proactively fetch more content.
var freshContentPool = [];
var pendingCallbacks = []; // The callback model in this module is unusual because of the way content is served from a pool.

function getRecommendedContent(count, groupSettings, callback) {
    if (freshContentPool.length > count) {
        callback(freshContentPool.splice(-count));
    } else {
        pendingCallbacks.push({ callback: callback, count: count });
    }
    contentFetchTriggerSize = Math.max(contentFetchTriggerSize, count); // Update the trigger size to the most we've been asked for.
    if (freshContentPool.length <= contentFetchTriggerSize) {
        fetchRecommendedContent(groupSettings);
    }
}

function fetchRecommendedContent(groupSettings) {
    // TODO: Extract URL
    AjaxClient.getJSONPNative('/api/contentrec', { group_id: groupSettings.groupId()} , function(response) {
        if (response.status !== 'fail' && response.data) {
            // Update the fresh content pool with the new data. Append any existing content to the end, so it is pulled first.
            var newArray = shuffleArray(response.data);
            for (var i = 0; i < freshContentPool.length; i++) {
                newArray.push(freshContentPool[i]);
            }
            freshContentPool = newArray;
            serveContent(groupSettings);
        }
    });
}

function serveContent(groupSettings) {
    for (var i = 0; i < pendingCallbacks.length; i++) {
        var entry = pendingCallbacks[i];
        if (freshContentPool.length > entry.count) {
            entry.callback(freshContentPool.splice(-entry.count));
        } else {
            // Ran out of content. Go get more
            fetchRecommendedContent(groupSettings);
            break;
        }
    }
    pendingCallbacks = pendingCallbacks.splice(i); // Trim any callbacks that we notified.
}

// Durstenfeld shuffle algorithm from: http://stackoverflow.com/a/12646864/4135431
function shuffleArray(array) {
    var copy = array.slice(0);
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = copy[i];
        copy[i] = copy[j];
        copy[j] = temp;
    }
    return copy;
}

module.exports = {
    getRecommendedContent: getRecommendedContent
};