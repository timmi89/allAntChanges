
//var $ = require('./jquery');
var PageScanner = require('./page-scanner');
var $;
require('./script-loader').on$(function(jQuery) {
    $=jQuery;
});

// TODO fold this module into group-settings

function loadAll(callback) {
    loadSettings(function(json) {
        // Once we have the settings, we can kick off a couple things in parallel:
        //
        // -- start hashing the page
        // -- start fetching the page data
        // -- start inserting the affordances (in the empty state)
        //
        //    Once these three tasks all complete, then we can update the affordances with the data and we're ready
        //    for action.
        var groupSettings = GroupSettings.create(json);
        PageScanner.scan(groupSettings);
    });
}

function loadSettings(callback) {
    $.getJSONP('/api/settings', { host_name: window.antenna_host }, callback, handleConfigLoadingError);
}

function handleConfigLoadingError(message) {
    // TODO handle errors that happen when loading config data
}

//noinspection JSUnresolvedVariable
module.exports = {
    load: loadSettings
};