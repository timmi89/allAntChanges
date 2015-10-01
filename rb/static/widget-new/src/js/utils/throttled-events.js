// This module allows us to register callbacks that are throttled in their frequency. This is useful for events like
// resize and scroll, which can be fired at an extremely high rate.

var throttledListeners = {};

function on(type, callback) {
    throttledListeners[type] = throttledListeners[type] || createThrottledListener(type);
    throttledListeners[type].addCallback(callback);
}

function off(type, callback) {
    var eventListener = throttledListeners[type];
    if (eventListener) {
        eventListener.removeCallback(callback);
        if (!eventListener.hasCallbacks()) {
            eventListener.teardown();
            delete throttledListeners[type];
        }
    }
}

function createThrottledListener(type) {
    var callbacks = {};
    var eventTimeout;
    setup();
    return {
        addCallback: addCallback(0),
        removeCallback: removeCallback,
        hasCallbacks: hasCallbacks,
        teardown: teardown
    };

    function handleEvent() {
       if (!eventTimeout) {
           eventTimeout = setTimeout(function() {
               notifyCallbacks();
               eventTimeout = null;
           }, 66); // 15 FPS
       }
    }

    function addCallback(antuid) { // create a 'curried' function with an initial ant uuid value (just a unique id that we use internally to tag functions for later retrieval)
        return function (callback) {
            if (callback.antuid == undefined) {
                callback.antuid = antuid++;
            }
            callbacks[callback.antuid] = callback;
        }
    }

    function removeCallback(callback) {
        if (callback.antuid !== undefined) {
            delete callbacks[callback.antuid];
        }
    }

    function notifyCallbacks() {
        for (var key in callbacks) {
            if (callbacks.hasOwnProperty(key)) {
                callbacks[key]();
            }
        }
    }

    function hasCallbacks() {
        return Object.getOwnPropertyNames(callbacks).length > 0;
    }

    function setup() {
        window.addEventListener(type, handleEvent);
    }

    function teardown() {
        window.removeEventListener(type, handleEvent);
    }
}

//noinspection JSUnresolvedVariable
module.exports = {
    on: on,
    off: off
};