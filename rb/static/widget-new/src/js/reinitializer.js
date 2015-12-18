var GroupSettings = require('./group-settings');
var HashedElements = require('./hashed-elements');
var PageData = require('./page-data');
var PageDataLoader = require('./page-data-loader');
var PageScanner = require('./page-scanner');
var PopupWidget = require('./popup-widget');
var ReactionsWidget = require('./reactions-widget');

var MutationObserver = require('./utils/mutation-observer');

function reinitializeAll() {
    var groupSettings = GroupSettings.get();
    if (groupSettings) {
        reinitialize(groupSettings);
    } else {
        console.log('Antenna cannot be reinitialized. Group settings are not loaded.');
    }
}

function reinitialize(groupSettings) {
    ReactionsWidget.teardown();
    PopupWidget.teardown();
    PageScanner.teardown();
    PageData.teardown();
    HashedElements.teardown();
    MutationObserver.teardown();

    PageDataLoader.load(groupSettings);
    PageScanner.scan(groupSettings);

    setupReinitialization(groupSettings); // need to setup again after tearing down the mutation observer.
}

function setupReinitialization(groupSettings) {
    var browserUrl = computeBrowserUrl();
    MutationObserver.addAdditionListener(function($elements) {
        var newBrowserUrl = computeBrowserUrl();
        if (browserUrl != newBrowserUrl) {
            browserUrl = newBrowserUrl;
            reinitialize(groupSettings);
        }
    });


    function computeBrowserUrl() {
        // We manually construct the URL so that we can leave out the search and hash portions.
        // TODO: The search part of the URL is meaningful for some sites. We should consider either always including the
        //       search property (and accepting the increase in false positives) or sending the group setting back to the
        //       client so we can at least include it for sites that need it.
        var port = (window.location.port ? ':' + window.location.port : '');
        return (window.location.protocol + '//' + window.location.hostname + port + window.location.pathname).toLowerCase();
    }
}

module.exports = {
    setupReinitialization: setupReinitialization,
    reinitializeAll: reinitializeAll
};