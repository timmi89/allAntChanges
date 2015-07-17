
var PageData = require('./page-data');
var URLs = require('./utils/urls');
var $; require('./script-loader').on$(function(jQuery) { $=jQuery; });


function computePageTitle() {
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
    if ($pageElements.length > 0) {
        $pageElements.each(function() {
            var $pageElement = $(this);
            var url = $pageElement.find(groupSettings.pageHrefSelector()).attr('href');
            pages.push({
                group_id: groupId,
                url: url,
                canonical_url: '', // TODO
                image: '', // TODO
                title: '' // TODO
            });
        });
    } else {
        pages.push({
            group_id: groupId,
            url: URLs.computePageUrl(groupSettings),
            canonical_url: URLs.computeCanonicalUrl(groupSettings),
            image: '', // TODO
            title: computePageTitle()
        });
    }

    return pages;
}

function loadPageData(groupSettings, callback) {
    var pagesParam = computePagesParam(groupSettings);
    $.getJSONP('/api/page', { pages: pagesParam }, success, error);

    function success(json) {
        var pageData = PageData.create(json);
        callback(pageData);
    }

    function error(message) {
        // TODO handle errors that happen when loading page data
    }
}

//noinspection JSUnresolvedVariable
module.exports = {
    load: loadPageData
};