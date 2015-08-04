
var $; require('./script-loader').on$(function(jQuery) { $=jQuery; });
var ReactionsWidget = require('./reactions-widget');

function createSummaryWidget(container, pageData, groupSettings) {
    //// TODO replace element
    var ractive = Ractive({
        el: container,
        data: pageData,
        magic: true,
        template: require('../templates/summary-widget.html')
    });
    ractive.on('complete', function() {
        $(rootElement(ractive)).on('mouseenter', function(event) {
           openReactionsWindow(pageData, groupSettings, ractive);
        });
    });
}

function rootElement(ractive) {
    // TODO: gotta be a better way to get this
    // TODO: our click handler is getting called twice, so it looks like this somehow gets the wrong element if there are two summary widgets together?
    return ractive.find('div');
}

function openReactionsWindow(pageData, groupSettings, ractive) {
    if (!ractive.reactionsWidget) {
        // TODO: consider prepopulating this
        var bucket = getWidgetBucket();
        var container = document.createElement('div');
        bucket.appendChild(container);
        ractive.reactionsWidget = ReactionsWidget.create(container, pageData, groupSettings);
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
    create: createSummaryWidget
};