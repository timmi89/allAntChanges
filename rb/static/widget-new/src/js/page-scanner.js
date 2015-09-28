var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var Hash = require('./utils/hash');
var PageUtils = require('./utils/page-utils');
var URLs = require('./utils/urls');
var WidgetBucket = require('./utils/widget-bucket');

var TextIndicatorWidget = require('./text-indicator-widget');
var ImageIndicatorWidget = require('./image-indicator-widget');
var PageData = require('./page-data');
var SummaryWidget = require('./summary-widget');
var TextReactions = require('./text-reactions');


// Scan for all pages at the current browser location. This could just be the current page or it could be a collection
// of pages (aka 'posts').
function scanAllPages(groupSettings) {
    $(groupSettings.exclusionSelector()).addClass('no-ant'); // Add the no-ant class to everything that is flagged for exclusion
    var $pages = $(groupSettings.pageSelector()); // TODO: no-ant?
    if ($pages.length == 0) {
        // If we don't detect any page markers, treat the whole document as the single page
        $pages = $('body'); // TODO Is this the right behavior?
    }
    $pages.each(function() {
        var $page = $(this);
        scanPage($page, groupSettings);
    });
}

// Scan the page using the given settings:
// 1. Find all the containers that we care about.
// 2. Compute hashes for each container.
// 3. Insert widget affordances for each which are bound to the data model by the hashes.
function scanPage($page, groupSettings) {
    var url = PageUtils.computePageUrl($page, groupSettings);
    var urlHash = Hash.hashUrl(url);
    var pageData = PageData.getPageData(urlHash);

    // First, scan for elements that would cause us to insert something into the DOM that takes up space.
    // We want to get any page resizing out of the way as early as possible.
    // TODO: Consider doing this with raw Javascript before jQuery loads, to further reduce the delay. We wouldn't
    // save a *ton* of time from this, though, so it's definitely a later optimization.
    scanForSummaries($page, pageData, groupSettings);
    scanForCallsToAction($page, pageData, groupSettings);

    var $activeSections = find($page, groupSettings.activeSections());
    $activeSections.each(function() {
        var $section = $(this);
        // Then scan for everything else
        scanForText($section, pageData, groupSettings);
        scanForImages($section, pageData, groupSettings);
        scanForMedia($section, pageData, groupSettings);
    });
}

function scanForSummaries($element, pageData, groupSettings) {
    var $summaries = find($element, groupSettings.summarySelector());
    $summaries.each(function() {
        var $summary = $(this);
        var containerData = PageData.getContainerData(pageData, 'page'); // Magic hash for page reactions
        containerData.type = 'page'; // TODO: revisit whether it makes sense to set the type here
        var defaultReactions = groupSettings.defaultReactions($summary); // TODO: do we support customizing the default reactions at this level?
        var $summaryElement = SummaryWidget.create(containerData, pageData, defaultReactions, groupSettings);
        insertContent($summary, $summaryElement, groupSettings.summaryMethod());
    });
}

function scanForCallsToAction($section, pageData, groupSettings) {
    // TODO
}

function scanForText($section, pageData, groupSettings) {
    var $textElements = find($section, groupSettings.textSelector());
    // TODO: only select "leaf" elements
    $textElements.each(function() {
        var $textElement = $(this);
        if (!containsMatchingElement($textElement, groupSettings)) { // Don't allow nested containers
            var hash = Hash.hashText($textElement);
            var containerData = PageData.getContainerData(pageData, hash);
            containerData.type = 'text'; // TODO: revisit whether it makes sense to set the type here
            var defaultReactions = groupSettings.defaultReactions($textElement);
            var $indicatorElement = TextIndicatorWidget.create({
                    containerData: containerData,
                    containerElement: $textElement,
                    defaultReactions: defaultReactions,
                    pageData: pageData,
                    groupSettings: groupSettings
                }
            );
            $textElement.append($indicatorElement); // TODO is this configurable ala insertContent(...)?

            // TODO: Do we need to wait until the reaction data is loaded before making this active?
            //       What happens if someone reacts before the data is loaded?
            TextReactions.createReactableText({
                containerData: containerData,
                containerElement: $textElement,
                defaultReactions: defaultReactions,
                pageData: pageData,
                groupSettings: groupSettings,
                excludeNode: $indicatorElement.get(0)
            });
        }
    });
}

function find($element, selector) {
    return $element.find(selector).filter(function() {
        return $(this).closest('.no-ant').length == 0;
    });
}

// Returns whether the given element contains any other elements that match our selection criteria.
function containsMatchingElement($element, groupSettings) {
    // TODO: test this thoroughly
    var compositeSelector = [ groupSettings.textSelector(), groupSettings.imageSelector()].join(',');
    return $element.find(compositeSelector).length > 0;
}

function scanForImages($section, pageData, groupSettings) {
    var compositeSelector = groupSettings.imageSelector() + ',[ant-item-type="image"]';
    var $imageElements = find($section, compositeSelector);
    $imageElements.each(function() {
        var $imageElement = $(this);
        var imageUrl = URLs.computeImageUrl($imageElement, groupSettings);
        var hash = Hash.hashImage(imageUrl);
        var containerData = PageData.getContainerData(pageData, hash);
        containerData.type = 'image'; // TODO: revisit whether it makes sense to set the type here
        var defaultReactions = groupSettings.defaultReactions($imageElement);
        var imageOffset = $imageElement.offset();
        var coords = {
            bottom: imageOffset.top + $imageElement.height(), // TODO pull from settings/element
            left: imageOffset.left
        };
        var dimensions = {
            height: $imageElement.height(), // TODO: review how we get the image dimensions
            width: $imageElement.width()
        };
        if (dimensions.height >= 100 && dimensions.width >= 100) { // Don't create indicator on images that are too small
            ImageIndicatorWidget.create({
                    element: WidgetBucket(),
                    coords: coords,
                    imageUrl: imageUrl,
                    imageDimensions: dimensions,
                    containerData: containerData,
                    containerElement: $imageElement,
                    defaultReactions: defaultReactions,
                    pageData: pageData,
                    groupSettings: groupSettings
                }
            );
        }
    });
}

function scanForMedia($section, pageData, groupSettings) {
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
   scan: scanAllPages
};