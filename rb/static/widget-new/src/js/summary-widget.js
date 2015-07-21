
//var Ractive = require('ractive');

var PageData = require('./page-data');

function createSummaryWidget(container, pageData) {
    //// TODO replace element
    return new Ractive({
        el: container,
        data: pageData,
        magic: true,
        template: '<div style="min-width:50px; height: 20px; border-radius:3px; background-color: blue; float:left;" ant-hash="{{pageHash}}">{{summary.totalReactions}}</div>',
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