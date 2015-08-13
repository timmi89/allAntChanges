
var noConflict;
var loadedRangy;
var callbacks = [];

// Notifies the rangy provider that we're about to load the Rangy library.
function aboutToLoad() {
    noConflict = window.rangy;
}

// Notifies the rangy provider that we've loaded the Rangy library.
function loaded() {
    loadedRangy = rangy;
    window.rangy = noConflict;
    notifyCallbacks();
}

function notifyCallbacks() {
    for (var i = 0; i < callbacks.length; i++) {
        callbacks[i](loadedRangy);
    }
    callbacks = [];
}

// Registers the given callback to be notified when our version of Rangy is loaded.
function onLoad(callback) {
    if (loadedRangy) {
        callback(loadedRangy);
    } else {
        callbacks.push(callback);
    }
}

module.exports = {
    aboutToLoad: aboutToLoad,
    loaded: loaded,
    onLoad: onLoad
};