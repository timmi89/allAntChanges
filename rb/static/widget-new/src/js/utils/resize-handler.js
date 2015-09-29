
var callbacks = {};
var aruid = 0;

function onResize(callback) {
    if (aruid == 0) {
        setupResizeListener();
    }
    callback.aruid = aruid; // store an "antenna resize-ally unique identifier" on the handler so we can find it later
    callbacks[aruid++] = callback;
}

function offResize(callback) {
    var aruid = callback.aruid;
    if (aruid !== undefined) {
        delete callbacks[aruid];
    }
}

function notifyCallbacks() {
    for (key in callbacks) {
        if (callbacks.hasOwnProperty(key)) {
            callbacks[key]();
        }
    }
}

function setupResizeListener() {
    var resizeTimeout;
    window.addEventListener('resize', function() {
        if (!resizeTimeout) {
            resizeTimeout = setTimeout(function() {
                notifyCallbacks();
                resizeTimeout = null;
            }, 66); // TODO: dynamically scale the timeout by the number of listeners?
        }
    });
}

module.exports = {
    onResize: onResize,
    offResize: offResize
};