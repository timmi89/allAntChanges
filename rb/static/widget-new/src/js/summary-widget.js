var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var ReactionsWidget = require('./reactions-widget');

function createSummaryWidget(container, containerData, pageData, defaultReactions, groupSettings) {
    //// TODO replace element
    var ractive = Ractive({
        el: container,
        data: pageData,
        magic: true,
        template: require('../templates/summary-widget.hbs.html')
    });
    ractive.on('complete', function() {
        $(rootElement(ractive)).on('mouseenter', function(event) {
           openReactionsWindow(containerData, pageData, defaultReactions, groupSettings, ractive);
        });
    });
}

function rootElement(ractive) {
    // TODO: gotta be a better way to get this
    // TODO: our click handler is getting called twice, so it looks like this somehow gets the wrong element if there are two summary widgets together?
    return ractive.find('div');
}

function openReactionsWindow(containerData, pageData, defaultReactions, groupSettings, ractive) {
    if (!ractive.reactionsWidget) {
        ractive.reactionsWidget = ReactionsWidget.create({
            reactionsData: pageData.summaryReactions,
            containerData: containerData,
            defaultReactions: defaultReactions,
            pageData: pageData,
            groupSettings: groupSettings
        });
    }
    // TODO: Unclear if it's safe to immediately start making calls on the ractive instance after its instantiated or if
    //       we need to structure everything with callbacks/promises.
    ractive.reactionsWidget.open(rootElement(ractive));
}

//noinspection JSUnresolvedVariable
module.exports = {
    create: createSummaryWidget
};