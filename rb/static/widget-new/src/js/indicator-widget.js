var $; require('./script-loader').on$(function(jQuery) { $=jQuery; });
var ReactionsWidget = require('./reactions-widget');


function createIndicatorWidget(container, containerData, pageData, defaultReactions, groupSettings) {
    // TODO: Basically everything.
    // Actually get container data.
    // Adjust visibility based on whether there are reactions on the content (honoring the flag about how many to show at once).
    // Show the reaction widget on hover.
    // etc.
    var ractive = Ractive({
        el: container,
        magic: true,
        data: {
            containerData: containerData
        },
        template: require('../templates/indicator-widget.html')
    });
    ractive.on('complete', function() {
        $(rootElement(ractive)).on('mouseenter', function(event) {
           openReactionsWindow(containerData, pageData, groupSettings, ractive);
        });
    });
}

function rootElement(ractive) {
    // TODO: gotta be a better way to get this
    return ractive.find('span');
}

// TODO refactor this duplicated code from summary-widget.js
function openReactionsWindow(containerData, pageData, groupSettings, ractive) {
    if (!ractive.reactionsWidget) {
        // TODO: consider prepopulating this
        var bucket = getWidgetBucket();
        var element = document.createElement('div');
        bucket.appendChild(element);
        ractive.reactionsWidget = ReactionsWidget.create(element, containerData.reactions, pageData, containerData, groupSettings);
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


module.exports = {
    create: createIndicatorWidget
};