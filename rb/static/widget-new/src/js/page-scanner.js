
//var $ = require('./jquery');
var Templates = require('./templates');
var $;
require('./script-loader').on$(function(jQuery) {
    $=jQuery;
});

var hashes = {};

// Scan the page using the given settings:
// 1. Find all the containers that we care about.
// 2. Insert widget affordances for each.
// 3. Compute hashes for each container.
//    TODO: Also need to compute hashes for any reacted content (i.e. text selections), but we only have that info after
//          We get back the page data. Don't want to wait for that network request before we start doing this work, though.
//          So we should probably just make another pass for those other content pieces later when we get back the page data.
function scanPage(groupSettings) {
    var $activeSections = $(groupSettings.activeSections());
    $activeSections.each(function() {
        var $section = $(this);
        // First, scan for elements that would cause us to insert something into the DOM that takes up space.
        // We want to get any page resizing out of the way as early as possible.
        scanForSummary($section, groupSettings);
        scanForPosts($section, groupSettings);
        scanForCallsToAction($section, groupSettings);
        // Then scan for everything else
        scanForText($section, groupSettings);
        scanForImages($section, groupSettings);
        scanForMedia($section, groupSettings);
    });
}

function scanForSummary($section, groupSettings) {
    var $summaries = $section.find(groupSettings.summarySelector());
    // TODO: How do summaries and "posts" relate?
    $summaries.each(function() {
        var $element = $(this);
        // TODO this feels convoluted. should we just have an if/else here to call before() or after()?
        //groupSettings.summaryMethod.call($element, Templates.summary());
        $element.append(Templates.summary());
    });
}

function scanForPosts($section, groupSettings) {
    var posts = $section.find(groupSettings.postSelector());
    // TODO
}

function scanForCallsToAction($section, groupSettings) {
    // TODO
}

function scanForText($section, groupSettings) {
    var $textElements = $section.find(groupSettings.textSelector());
    // TODO: only select "leaf" elements
    $textElements.each(function() {
        var $element = $(this);
        // TODO position correctly
        $element.append(Templates.indicator());
    });
}

function scanForImages($section, groupSettings) {
    // TODO
}

function scanForMedia($section, groupSettings) {
    // TODO
}

//noinspection JSUnresolvedVariable
module.exports = {
   scan: scanPage
};