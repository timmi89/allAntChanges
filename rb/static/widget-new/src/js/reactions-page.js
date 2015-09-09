var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var AjaxClient = require('./utils/ajax-client');
var Range = require('./utils/range');
var ReactionsWidgetLayoutUtils = require('./utils/reactions-widget-layout-utils');

var pageSelector = '.antenna-reactions-page';

function createPage(options) {
    var reactionsData = options.reactionsData;
    var containerData = options.containerData;
    var pageData = options.pageData;
    var contentData = options.contentData;
    var containerElement = options.containerElement;
    //var showProgress = options.showProgress;
    var showConfirmation = options.showConfirmation;
    var showDefaults = options.showDefaults;
    var element = options.element;
    var colors = options.colors;
    sortReactionData(reactionsData);
    var reactionsLayoutData = ReactionsWidgetLayoutUtils.computeLayoutData(reactionsData, colors);
    var ractive = Ractive({
        el: element,
        append: true,
        template: require('../templates/reactions-page.hbs.html'),
        data: {
            reactions: reactionsData,
            reactionsLayoutClass: arrayAccessor(reactionsLayoutData.layoutClasses),
            reactionsBackgroundColor: arrayAccessor(reactionsLayoutData.backgroundColors)
        },
        decorators: {
            sizetofit: ReactionsWidgetLayoutUtils.sizeToFit
        }
    });

    if (containerElement) {
        ractive.on('highlight', highlightContent(containerData, pageData, containerElement));
        ractive.on('clearhighlights', Range.clearHighlights);
    }
    ractive.on('plusone', plusOne(containerData, pageData, showConfirmation));
    ractive.on('showdefault', showDefaults);
    return {
        selector: pageSelector,
        teardown: function() { ractive.teardown(); }
    };

    function arrayAccessor(array) {
        return function(index) {
            return array[index];
        }
    }

    function sortReactionData(reactions) {
        reactions.sort(function(reactionA, reactionB) {
           return reactionB.count - reactionA.count;
        });
    }
}

function rootElement(ractive) {
    return ractive.find(pageSelector);
}

function highlightContent(containerData, pageData, $containerElement) {
    return function(event) {
        var reactionData = event.context;
        if (reactionData.content) {
            var location = reactionData.content.location;
            if (location) {
                Range.highlight($containerElement.get(0), location);
            }
        }
    }
}

function plusOne(containerData, pageData, showConfirmation) {
    return function(event) {
        var reactionData = event.context;
        //showProgress();
        showConfirmation(reactionData);
        AjaxClient.postPlusOne(reactionData, containerData, pageData, function(){}/*TODO*/, error);

        function error(message) {
            // TODO handle any errors that occur posting a reaction
            console.log("error posting plus one: " + message);
        }
    };
}


module.exports = {
    create: createPage
};