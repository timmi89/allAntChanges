

var callbacks = {};
var $;

function onLoad(callback) {
    if ($) {
        callback($);
    } else {
        callbacks.push(callback);
    }
}

function loaded(jQuery) {
    $ = jQuery.noConflict(true);
    while (callbacks.length > 0) {
        callbacks.pop()($);
    }
}

//noinspection JSUnresolvedVariable
module.exports = {
    onLoad: onLoad,
    loaded: loaded
};