var XDMClient = require('./utils/xdm-client');
var Events = require('./events');
var GroupSettings = require('./group-settings');
var PageData = require('./page-data');

function checkAnalyticsCookies() {
    // When the widget loads, check for any cookies that have been written by the legacy content rec.
    // If those cookies exist, fire the event and clear them.
    XDMClient.sendMessage('getCookies', [ 'redirect_type', 'referring_int_id', 'page_hash' ], function(cookies) {
        if (cookies.redirect_type) {
            var reactionId = cookies.referring_int_id;
            var pageHash = cookies.page_hash;
            getPageData(pageHash, function(pageData) {
                Events.postLegacyRecircClicked(pageData, reactionId, GroupSettings.get());
                XDMNewClient.sendMessage('removeCookies', [ 'redirect_type', 'referring_int_id', 'page_hash' ]);
            });
        }
    });
}

function getPageData(pageHash, callback) {
    if (pageHash) {
        // This module loads very early in the app lifecycle and may receive events from the XDM frame before page
        // data has been loaded. Hold onto any such events until the page data loads or we timeout.
        var maxWaitTime = Date.now() + 10000; // Give up after 10 seconds
        var interval = setInterval(function () {
            var pageData = PageData.getPageData(pageHash);
            if (pageData) {
                callback(pageData);
                clearInterval(interval);
            }
            if (Date.now() > maxWaitTime) {
                clearInterval(interval);
            }
        }, 50);
    }
}

module.exports = {
    start: checkAnalyticsCookies
};