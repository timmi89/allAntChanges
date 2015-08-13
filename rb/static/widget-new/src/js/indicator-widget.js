var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var ReactionsWidget = require('./reactions-widget');


function createIndicatorWidget(options) {
    // TODO: Adjust visibility based on whether there are reactions on the content (honoring the flag about how many to show at once).
    // TODO: Show intermediate popup thingy when there are no reactions
    var element = options.element;
    var containerData = options.containerData;
    var containerElement = options.containerElement;
    var pageData = options.pageData;
    var groupSettings = options.groupSettings;
    var defaultReactions = groupSettings.defaultReactions(containerElement);
    var ractive = Ractive({
        el: element,
        magic: true,
        data: {
            containerData: containerData
        },
        template: require('../templates/indicator-widget.html')
    });
    ractive.on('complete', function() {
        $(rootElement(ractive)).on('mouseenter', function(event) {
           openReactionsWindow(containerData, pageData, groupSettings, ractive, containerElement);
        });
    });
}

function rootElement(ractive) {
    return ractive.find('.antenna-indicator-widget');
}

// TODO refactor this duplicated code from summary-widget.js
function openReactionsWindow(containerData, pageData, groupSettings, ractive, containerElement) {
    if (!ractive.reactionsWidget) {
        // TODO: consider prepopulating this
        var bucket = getWidgetBucket();
        var element = document.createElement('div');
        bucket.appendChild(element);
        //ractive.reactionsWidget = ReactionsWidget.create(element, containerData.reactions, pageData, containerData, groupSettings, containerElement);
        ractive.reactionsWidget = ReactionsWidget.create({
            element: element,
            reactionsData: containerData.reactions,
            containerData: containerData,
            containerElement: containerElement,
            pageData: pageData,
            groupSettings: groupSettings
        });
    }
    ractive.reactionsWidget.open(rootElement(ractive));
}

function getWidgetBucket() {
    var bucket = document.getElementById('antenna-widget-bucket');
    if (!bucket) {
        bucket = document.createElement('div');
        bucket.setAttribute('id', 'antenna-widget-bucket');
        document.body.appendChild(bucket);
    }
    return bucket;
}

//noinspection JSUnresolvedVariable
module.exports = {
    create: createIndicatorWidget
};