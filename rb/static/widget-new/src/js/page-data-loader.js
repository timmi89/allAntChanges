
var $; require('./script-loader').on$(function(jQuery) { $=jQuery; });
var URLs = require('./utils/urls');
var PageData = require('./page-data');


function computePageTitle() {
    // TODO: How are page titles computed with multiple pages? The code below computes the title for a top-level page.
    var title = $('meta[property="og:title"]').attr('content');
    if (!title) {
        title = $('title').text() || '';
    }
    return $.trim(title);
}


// Compute the pages that we need to fetch. This is either:
// 1. Any nested pages we find using the page selector OR
// 2. The current window location
function computePagesParam(groupSettings) {
    var pages = [];

    var groupId = groupSettings.groupId();
    var $pageElements = $(groupSettings.pageSelector());
    // TODO: Compare this execution flow to what happens in engage_full.js. Here we treat the body element as a page so
    // the flow is the same for both cases. Is there a reason engage_full.js branches here instead and treats these so differently?
    if ($pageElements.length == 0) {
        $pageElements = $('body');
    }
    $pageElements.each(function() {
        var $pageElement = $(this);
        pages.push({
            group_id: groupId,
            url: URLs.computePageUrl($pageElement, groupSettings),
            canonical_url: URLs.computeCanonicalUrl($pageElement, groupSettings),
            image: '', // TODO
            title: computePageTitle() // TODO: This code only works for the top-level page. See computePageTitle()
        });
    });

    return pages;
}

function loadPageData(groupSettings) {
    var pagesParam = computePagesParam(groupSettings);
    $.getJSONP('/api/page', { pages: pagesParam }, success, error);
    $.getJSONP('/api/pagenew', { pages: pagesParam }, function(json) {
        console.log(json);
    }, error);

    function success(json) {
        PageData.updateAllPageData(json, groupSettings, function(updatedPages) {
            // TODO revisit this. we probably don't want to go out and aggressively load all data for all pages
            for (var i = 0; i < updatedPages.length; i++) {
                loadContainerData(updatedPages[i]);
            }
        });
    }

    function error(message) {
        // TODO handle errors that happen when loading page data
    }
}

function loadContainerData(pageData) {
    var containers = pageData.containers;
    // TODO consider optimizing the data storage so we don't have to iterate like this
    var hashes = [];
    for (var hash in containers) {
        if (containers.hasOwnProperty(hash)) {
            hashes.push(hash);
        }
    }
    var data = {
        short_name: '', // TODO
        pageID: pageData.pageId,
        hashes: hashes,
        crossPageHashes: [] // TODO
    };
    $.getJSONP('/api/summary/containers', data, success, error);

    function success(json) {
        PageData.updateAllContainerData(json, pageData);
    }

    function error(message) {
        // TODO handle errors that happen when loading container data
    }
}

//noinspection JSUnresolvedVariable
module.exports = {
    load: loadPageData
};