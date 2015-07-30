
var ReactionsWidget = require('./reactions-widget');

var ractive;
var reactionsWidget;

function createSummaryWidget(container, pageData, groupSettings) {
    //// TODO replace element
    ractive = Ractive({
        el: container,
        data: pageData,
        magic: true,
        template: require('../templates/summary-widget.html'),
        oncomplete: function() {
            var that = this;
            $(rootElement()).on('click', function(event) { // TODO: delete. this is just toy
               that.add('summary.totalReactions');
            });
            $(rootElement()).on('mouseenter', function(event) {
               openReactionsWindow(pageData, groupSettings);
            });
        }
    });
    return ractive;
}

function rootElement() {
    // TODO: gotta be a better way to get this
    // TODO: our click handler is getting called twice, so it looks like this somehow gets the wrong element if there are two summary widgets together?
    return ractive.find('div');
}

function openReactionsWindow(pageData, groupSettings) {
    if (!reactionsWidget) {
        // TODO: consider prepopulating this
        var bucket = getWidgetBucket();
        var container = document.createElement('div');
        bucket.appendChild(container);
        reactionsWidget = ReactionsWidget.create(container, pageData, groupSettings);
    }
    reactionsWidget.open(rootElement());
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