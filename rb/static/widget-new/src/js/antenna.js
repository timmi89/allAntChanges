var ScriptLoader = require('./script-loader');

var GroupSettingsLoader = require('./group-settings-loader');
var PageDataLoader = require('./page-data-loader');
var PageScanner = require('./page-scanner');
var SummaryWidget = require('./summary-widget');

function loadGroupSettings() {
    // Once we have the settings, we can kick off a couple things in parallel:
    //
    // -- start fetching the page data
    // -- start hashing the page
    // -- start inserting the affordances (in the empty state)
    //
    //    Once these three tasks all complete, then we can update the affordances with the data and we're ready
    //    for action.
    GroupSettingsLoader.load(function(groupSettings) {
        fetchPageData(groupSettings);
        scanPage(groupSettings);
    });
}

function fetchPageData(groupSettings) {
    PageDataLoader.load(groupSettings, dataLoaded);
}

function scanPage(groupSettings) {
    PageScanner.scan(groupSettings, pageScanned);
}

var pageData;
var isPageScanned = false;

function dataLoaded(data) {
    pageData = data;
    if (pageData && isPageScanned) {
        pageReady();
    }
}

function pageScanned() {
    isPageScanned = true;
    if (pageData && isPageScanned) {
        pageReady();
    }
}

function pageReady() {
    // At this point, the container hashes have been computed, the affordances inserted, and the page data fetched.
    // Now update the summary widgets and affordances.
    for (var i = 0; i < pageData.length; i++) {
        var page = pageData[i];
        var hash = page.pageHash;
        // TODO extract attribute constants
        var $summaries = $('[ant-hash=\'' + hash + '\']');
        $summaries.each(function() {
            var $summary = $(this);
            var summaryRactive = SummaryWidget.create($summary, page); // TODO: multiple instances
        })
    }
}

// TODO the cascade is pretty clear, but can we orchestrate this better?
ScriptLoader.load(loadGroupSettings);