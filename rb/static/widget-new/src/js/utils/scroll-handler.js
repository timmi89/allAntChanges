// TODO: refactor this with resize-handler. they're basically duplicate.
var callbacks = {};
var asuid = 0;

function onScroll(callback) {
    if (asuid == 0) {
        setupScrollListener();
    }
    callback.asuid = asuid; // store an "antenna scroll-ally unique identifier" on the handler so we can find it later
    callbacks[asuid++] = callback;
}

function offScroll(callback) {
    var asuid = callback.asuid;
    if (asuid !== undefined) {
        delete callbacks[asuid];
    }
    // TODO: remove the event listener if there are no more callbacks
}

function notifyCallbacks() {
    for (key in callbacks) {
        if (callbacks.hasOwnProperty(key)) {
            callbacks[key]();
        }
    }
}

function setupScrollListener() {
    var scrollTimeout;
    window.addEventListener('scroll', function() {
        if (!scrollTimeout) {
            scrollTimeout = setTimeout(function() {
                notifyCallbacks();
                scrollTimeout = null;
            }, 66); // TODO: dynamically scale the timeout by the number of listeners?
        }
    });
}

module.exports = {
    onScroll: onScroll,
    offScroll: offScroll
};