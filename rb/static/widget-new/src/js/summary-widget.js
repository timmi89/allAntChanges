

function createSummaryWidget(container, pageData) {
    //// TODO replace element
    return Ractive({
        el: container,
        data: pageData,
        magic: true,
        template: require('../templates/summary-widget.html'),
        complete: function() {
            var that = this;
            $(that.find('div')).on('click', function(event) {
               that.add('summary.totalReactions');
            });
        }
    });
}

module.exports = {
    create: createSummaryWidget
};