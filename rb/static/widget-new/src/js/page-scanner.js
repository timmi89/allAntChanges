var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var Hash = require('./utils/hash');
var PageUtils = require('./utils/page-utils');
var URLs = require('./utils/urls');
var WidgetBucket = require('./utils/widget-bucket');

var AutoCallToAction = require('./auto-call-to-action');
var CallToActionIndicator = require('./call-to-action-indicator');
var ElementMap = require('./element-map');
var ImageIndicatorWidget = require('./image-indicator-widget');
var PageData = require('./page-data');
var SummaryWidget = require('./summary-widget');
var TextIndicatorWidget = require('./text-indicator-widget');
var TextReactions = require('./text-reactions');


// Scan for all pages at the current browser location. This could just be the current page or it could be a collection
// of pages (aka 'posts').
function scanAllPages(groupSettings) {
    $(groupSettings.exclusionSelector()).addClass('no-ant'); // Add the no-ant class to everything that is flagged for exclusion
    var $pages = $(groupSettings.pageSelector()); // TODO: no-ant?
    if ($pages.length == 0) {
        // If we don't detect any page markers, treat the whole document as the single page
        $pages = $('body'); // TODO: Is this the right behavior? (Keep in sync with the same assumption that's built into page-data-loader.)
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
    var $activeSections = find($page, groupSettings.activeSections());

    // First, scan for elements that would cause us to insert something into the DOM that takes up space.
    // We want to get any page resizing out of the way as early as possible.
    // TODO: Consider doing this with raw Javascript before jQuery loads, to further reduce the delay. We wouldn't
    // save a *ton* of time from this, though, so it's definitely a later optimization.
    scanForSummaries($page, pageData, groupSettings); // TODO: should the summary search be confined to the active sections?
    $activeSections.each(function() {
        var $section = $(this);
        createAutoCallsToAction($section, pageData, groupSettings);
    });

    $activeSections.each(function() {
        var $section = $(this);
        // Then scan for everything else
        scanForCallsToAction($page, pageData, groupSettings); // CTAs have to go first. Text/images/media involved in CTAs will be tagged no-ant.
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
    var ctaTargets = {}; // The elements that the call to actions act on (e.g. the image or video)
    find($section, '[ant-item]').each(function() {
        var $ctaTarget = $(this);
        $ctaTarget.addClass('no-ant'); // don't show the normal reaction affordance on a cta target
        var antItemId = $ctaTarget.attr('ant-item').trim();
        ctaTargets[antItemId] = $ctaTarget;
    });

    var ctaLabels = {}; // The optional elements that report the number of reactions to the cta
    find($section, '[ant-reactions-label-for]').each(function() {
        var $ctaLabel = $(this);
        $ctaLabel.addClass('no-ant'); // don't show the normal reaction affordance on a cta label
        var antItemId = $ctaLabel.attr('ant-reactions-label-for').trim();
        ctaLabels[antItemId] = $ctaLabel;
    });

    var $ctaElements = find($section, '[ant-cta-for]'); // The call to action elements which prompt the user to react
    $ctaElements.each(function() {
        var $ctaElement = $(this);
        var antItemId = $ctaElement.attr('ant-cta-for');
        var $targetElement = ctaTargets[antItemId];
        if ($targetElement) {
            var hash = computeHash($targetElement, groupSettings);
            var contentData = computeContentData($targetElement, groupSettings);
            if (hash && contentData) {
                var containerData = PageData.getContainerData(pageData, hash);
                containerData.type = computeElementType($targetElement); // TODO: revisit whether it makes sense to set the type here
                CallToActionIndicator.create({
                    containerData: containerData,
                    containerElement: $targetElement,
                    contentData: contentData,
                    ctaElement: $ctaElement,
                    ctaLabel: ctaLabels[antItemId],
                    defaultReactions: groupSettings.defaultReactions($targetElement),
                    pageData: pageData,
                    groupSettings: groupSettings
                });
            }
        }
    })
}

function createAutoCallsToAction($section, pageData, groupSettings) {
    var $ctaTargets = find($section, groupSettings.generatedCtaSelector());
    $ctaTargets.each(function() {
        var $ctaTarget = $(this);
        var antItemId = generateAntItemAttribute();
        $ctaTarget.attr('ant-item', antItemId);
        var $cta = AutoCallToAction.create(antItemId);
        $ctaTarget.after($cta); // TODO: make the insert behavior configurable like the summary
    });
}

var generateAntItemAttribute = function(index) {
    return function() {
        return 'antenna_auto_cta_' + index++;
    }
}(0);

function scanForText($element, pageData, groupSettings) {
    var $textElements = find($element, groupSettings.textSelector());
    // TODO: only select "leaf" elements
    $textElements.each(function() {
        var $textElement = $(this);
        if (shouldHashText($textElement, groupSettings)) {
            var hash = computeHash($textElement, groupSettings);
            if (hash) {
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
        }
    });
}

function shouldHashText($textElement, groupSettings) {
    // Don't create an indicator for text elements that contain other text nodes.
    return $textElement.find(groupSettings.textSelector()).length == 0 &&
        !isCta($textElement, groupSettings); // TODO: also consider whether we should hash text elements that *contain* a CTA.
}

function isCta($element, groupSettings) {
    var compositeSelector = groupSettings.generatedCtaSelector() + ',[ant-item]';
    return $element.is(compositeSelector);
}

function scanForImages($section, pageData, groupSettings) {
    var compositeSelector = groupSettings.imageSelector() + ',[ant-item-type="image"]';
    var $imageElements = find($section, compositeSelector);
    $imageElements.each(function() {
        var $imageElement = $(this);
        var imageUrl = URLs.computeImageUrl($imageElement, groupSettings);
        var hash = computeHash($imageElement, groupSettings);
        var containerData = PageData.getContainerData(pageData, hash);
        containerData.type = 'image'; // TODO: revisit whether it makes sense to set the type here
        var defaultReactions = groupSettings.defaultReactions($imageElement);
        var contentData = computeContentData($imageElement, groupSettings);
        if (contentData && contentData.dimensions) {
            if (contentData.dimensions.height >= 100 && contentData.dimensions.width >= 100) { // Don't create indicator on images that are too small
                ImageIndicatorWidget.create({
                        element: WidgetBucket(),
                        imageUrl: imageUrl,
                        containerData: containerData,
                        contentData: contentData,
                        containerElement: $imageElement,
                        defaultReactions: defaultReactions,
                        pageData: pageData,
                        groupSettings: groupSettings
                    }
                );
            }
        }
    });
}

function scanForMedia($section, pageData, groupSettings) {
    // TODO
}

function find($element, selector) {
    return $element.find(selector).filter(function() {
        return $(this).closest('.no-ant').length == 0;
    });
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

function computeHash($element, groupSettings) {
    // TODO: make sure we generate unique hashes using an ordered index in case of collisions
    var hash;
    switch (computeElementType($element)) {
        case 'image':
            var imageUrl = URLs.computeImageUrl($element, groupSettings);
            hash = Hash.hashImage(imageUrl);
            break;
        case 'media':
            // todo
            break;
        case 'text':
            hash = Hash.hashText($element);
            break;
    }
    ElementMap.set(hash, $element); // Record the relationship between the hash and dom element.
    return hash;
}

function computeContentData($element, groupSettings) {
    var contentData;
    switch (computeElementType($element)) {
        case 'image':
            var imageUrl = URLs.computeImageUrl($element, groupSettings);
            var dimensions = {
                height: $element.height(), // TODO: review how we get the image dimensions
                width: $element.width()
            };
            contentData = {
                type: 'img',
                body: imageUrl,
                dimensions: dimensions
            };
        case 'media':
            // TODO
            break;
        case 'text':
            contentData = { type: 'text' };
    }
    return contentData;
}

function computeElementType($element) {
    var itemType = $element.attr('ant-item-type');
    if (itemType && itemType.trim().length > 0) {
        return itemType.trim();
    }
    var tagName = $element.prop('tagName').toLowerCase();
    switch (tagName) {
        case 'img':
            return 'image';
        case 'video':
        case 'iframe':
        case 'embed':
            return 'media';
        default:
            return 'text';
    }
}

//noinspection JSUnresolvedVariable
module.exports = {
   scan: scanAllPages
};