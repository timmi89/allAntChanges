
//var Ractive = require('ractive');

var SummaryWidget = Ractive.extend({
    template: '<div style="width:50px; height: 20px; border-radius:3px; background-color: blue; float:left;" ant-hash="{{pageData.pageHash}}">{{pageData.summary.numReactions}}</div>'
});

function createSummaryWidget(container, pageData) {
    var ractive = new SummaryWidget({
        el: container,
        data: pageData
    });
    return ractive;
}

module.exports = {
    create: createSummaryWidget
};