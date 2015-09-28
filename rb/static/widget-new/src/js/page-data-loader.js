var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var PageUtils = require('./utils/page-utils');
var URLs = require('./utils/urls');
var PageData = require('./page-data');


// TODO: move these functions to page-utils
function computeTopLevelPageTitle() {
    // TODO: Why is this hard-coded, when the equivalent for the image is configurable? (Unify them.)
    var title = $('meta[property="og:title"]').attr('content') || $('title').text() || '';
    return title.trim();
}

function computePageTitle($page, groupSettings) {
    var pageTitle = $page.find(groupSettings.pageLinkSelector()).text().trim();
    if (pageTitle === '') {
        pageTitle = computeTopLevelPageTitle();
    }
    return pageTitle;
}

function computeTopLevelPageImage(groupSettings) {
    // TODO: This is currently just reproducing what engage_full does. But do we really need to look inside the 'html'
    //       element like this? Can we just use a selector like the one for the page title (meta[property="og:image"])?
    //       Can/should we look inside the head element instead of the whole html document?
    var image = $('html').find(groupSettings.pageImageSelector()).attr(groupSettings.pageImageAttribute()) || '';
    return image.trim();
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
        // TODO: only ask for the pages that are "above the fold" then install a scroll listener which fetches more pages as needed
        var $pageElement = $(this);
        pages.push({
            group_id: groupId,
            url: PageUtils.computePageUrl($pageElement, groupSettings),
            title: computePageTitle($pageElement, groupSettings)
        });
    });
    if (pages.length == 1) {
        pages[0].image = computeTopLevelPageImage(groupSettings);
    }

    return pages;
}

function loadPageData(groupSettings) {
    var pagesParam = computePagesParam(groupSettings);
    // TODO: delete the commented line below, which is for testing purposes
    //pagesParam = [{"group_id":2834, "url":"http://www.cheatsheet.com/entertainment/14-tv-shows-likely-to-get-the-axe-after-this-season.html/?a=viewall"}]
    $.getJSONP(URLs.pageDataUrl(), { pages: pagesParam }, success, error);

    function success(json) {
        // TODO: if the page data indicates that the server doesn't know about the page yet, compute the page title and image
        //       and send them to the server. (use computePageTitle())
        //setTimeout(function() { PageData.updateAllPageData(json, groupSettings); }, 3000);
        PageData.updateAllPageData(json, groupSettings);
    }

    function error(message) {
        // TODO handle errors that happen when loading page data
        console.log('An error occurred loading page data: ' + message);
    }
}

//noinspection JSUnresolvedVariable
module.exports = {
    load: loadPageData
};