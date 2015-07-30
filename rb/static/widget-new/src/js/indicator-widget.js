
var $; require('./script-loader').on$(function(jQuery) { $=jQuery; });


function createIndicatorWidget(container, containerData) {
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
}


module.exports = {
    create: createIndicatorWidget
};