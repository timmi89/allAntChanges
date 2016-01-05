
var XdmLoader = require('./xdm-loader');

// Register ourselves to hear messages
window.addEventListener("message", receiveMessage, false);

var callbacks = {
    'xdm loaded': xdmLoaded
};
var cache = {};

var isXDMLoaded = false;
// The initial message that XDM sends out when it loads
function xdmLoaded(data) {
    isXDMLoaded = true;
}

function setMessageHandler(messageKey, callback) {
    callback.persistent = true; // Set the flag which tells us that this isn't a typical one-time callback.
    callbacks[messageKey] = callback;
}

function getUser(callback) {
    var message = 'getUser';
    postMessage(message, 'returning_user', success, validCacheEntry);

    function success(response) {
        var userInfo = response.detail;
        callback(userInfo);
    }

    function validCacheEntry(response) {
        var userInfo = response.detail;
        return userInfo && userInfo.ant_token && userInfo.user_id; // TODO && userInfo.user_type && social_user, etc.?
    }
}

function receiveMessage(event) {
    var eventOrigin = event.origin;
    if (eventOrigin === XdmLoader.ORIGIN) {
        var response = event.data;
        // TODO: The event.source property gives us the source window of the message and currently the XDM frame fires out
        // events that we receive before we ever try to post anything. So we *could* hold onto the window here and use it
        // for posting messages rather than looking for the XDM frame ourselves. Need to look at which events the XDM frame
        // fires out to all windows before being asked. Currently, it's more than "xdm loaded". Why?
        //var sourceWindow = event.source;

        var callbackKey = response.key;
        cache[callbackKey] = response;
        var callback = callbacks[callbackKey];
        if (callback) {
            callback(response);
            if (!callbacks[callbackKey].persistent) {
                delete callbacks[callbackKey];
            }
        }
    }
}

function postMessage(message, callbackKey, callback, validCacheEntry) {
    if (isXDMLoaded) {
        var targetOrigin = XdmLoader.ORIGIN;
        var cachedResponse = cache[callbackKey];
        if (cachedResponse !== undefined && validCacheEntry && validCacheEntry(cache[callbackKey])) {
            callback(cache[callbackKey]);
        } else {
            var xdmFrame = getXDMFrame();
            if (xdmFrame) {
                callbacks[callbackKey] = callback;
                xdmFrame.postMessage(message, targetOrigin);
            }
        }
    } else {
        queueMessage(message, callbackKey, callback, validCacheEntry);
    }
}

var messageQueue = [];
var messageQueueTimer;

function queueMessage(message, callbackKey, callback, validCacheEntry) {
    // TODO: Review this idea. The main message we really need to queue up is the getUser request as part of the "group settings loaded"
    // event which fires very early (possibly "page data loaded" too). But what about the rest of the widget? Should we even show
    // the reaction window if the XDM frame isn't ready? Or should the widget wait to become visible until XDM is ready like the
    // way it waits for page data to load?
    messageQueue.push({message: message, callbackKey: callbackKey, callback: callback, validCacheEntry: validCacheEntry});
    if (!messageQueueTimer) {
        // Start the wait...
        var stopTime = Date.now() + 10000; // Give up after 10 seconds
        messageQueueTimer = setInterval(function() {
            if (isXDMLoaded || Date.now() > stopTime) {
                clearInterval(messageQueueTimer);
            }
            if (isXDMLoaded) {
                // TODO: Consider the timing issue where messages could sneak in and be processed while this loop is sleeping.
                for (var i = 0; i < messageQueue.length; i++) {
                    var dequeued = messageQueue[i];
                    postMessage(dequeued.message, dequeued.callbackKey, dequeued.callback, dequeued.validCacheEntry);
                }
                messageQueue = [];
            }
        }, 50);
    }
}

function getXDMFrame() {
    // TODO: Is this a security problem? What prevents someone from using this same name and intercepting our messages?
    return window.frames['ant-xdm-hidden'];
}

module.exports = {
    getUser: getUser,
    setMessageHandler: setMessageHandler
};