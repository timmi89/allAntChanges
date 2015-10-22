var URLs = require('./urls');

var loadedjQuery;
var callbacks = [];

// Notifies the jQuery provider that we've loaded the jQuery library.
function loaded() {
    loadedjQuery = jQuery.noConflict();
    // Add our custom JSONP function
    loadedjQuery.getJSONP = function(url, data, success, error) {
        var options = {
            url: URLs.antennaHome() + url,
            type: "get",
            contentType: "application/json",
            dataType: "jsonp",
            success: function(response, textStatus, XHR) {
                // TODO: Revisit whether it's really cool to key this on the textStatus or if we should be looking at
                //       the status code in the XHR
                // Note: The server comes back with 200 responses with a nested status of "fail"...
                if (textStatus === 'success' && response.status !== 'fail' && (!response.data || response.data.status !== 'fail')) {
                    success(response.data);
                } else {
                    // For JSONP requests, jQuery doesn't call it's error callback. It calls success instead.
                    error(response.message || response.data.message);
                }
            },
            error: function(xhr, textStatus, message) {
                // Okay, apparently jQuery *does* call its error callback for JSONP requests sometimes...
                // Specifically, when the response status is OK but an error occurs client-side processing the response.
                error (message);
            }
        };
        if (data) {
            options.data = { json: JSON.stringify(data) };
        }
        loadedjQuery.ajax(options);
    };
    notifyCallbacks();
}

function notifyCallbacks() {
    for (var i = 0; i < callbacks.length; i++) {
        callbacks[i](loadedjQuery);
    }
    callbacks = [];
}

// Registers the given callback to be notified when our version of jQuery is loaded.
function onLoad(callback) {
    if (loadedjQuery) {
        callback(loadedjQuery);
    } else {
        callbacks.push(callback);
    }
}

//noinspection JSUnresolvedVariable
module.exports = {
    loaded: loaded,
    onLoad: onLoad
};