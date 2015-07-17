
//var $ = require('./jquery');
var Templates = require('./templates');
var Hash = require('./hash');
//var SummaryWidget = require('./summary-widget');
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
function scanPage(groupSettings, callback) {
    var $activeSections = $(groupSettings.activeSections());
    $activeSections.each(function() {
        var $section = $(this);
        // First, scan for elements that would cause us to insert something into the DOM that takes up space.
        // We want to get any page resizing out of the way as early as possible.
        scanForSummary($section, groupSettings);
        scanForPages($section, groupSettings);
        scanForCallsToAction($section, groupSettings);
        // Then scan for everything else
        scanForText($section, groupSettings);
        scanForImages($section, groupSettings);
        scanForMedia($section, groupSettings);
    });
    callback();
}

function scanForSummary($section, groupSettings) {
    var $summaries = $section.find(groupSettings.summarySelector());
    $summaries.each(function() {
        var container = $('<div></div>');
        insertContent($(this), Templates.summary(), groupSettings.summaryMethod());
        //insertContent($(this), container, groupSettings.summaryMethod());
        //var summaryWidget = SummaryWidget.create(container, {});
    });
}

function scanForPages($section, groupSettings) {
    var pages = $section.find(groupSettings.pageSelector());
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
        // TODO hash and add hash data to indicator
        var hash = Hash.hashText($element);
        $element.append(Templates.indicator(hash));
    });
}

function scanForImages($section, groupSettings) {
    // TODO
}

function scanForMedia($section, groupSettings) {
    // TODO
}

function insertContent($parent, content, method) {
    switch (method) {
        case 'append':
            $parent.append(content);
            break;
        case 'prepend':
            $parent.prepend(content);
            break;
        case 'before':
            $parent.before(content);
            break;
        case 'after':
            $parent.after(content);
            break;
    }
}

//noinspection JSUnresolvedVariable
module.exports = {
   scan: scanPage
};