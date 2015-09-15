var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });

var pageSelector = '.antenna-comments-page';

function createPage(reactionData, comments, element, closeWindow) {
    var ractive = Ractive({
        el: element,
        append: true,
        template: require('../templates/comments-page.hbs.html'),
        data: {
            reaction: reactionData,
            comments: comments
        }
    });
    ractive.on('closewindow', closeWindow);
    return {
        selector: pageSelector,
        teardown: function() { ractive.teardown(); }
    }
}

module.exports = {
    create: createPage
};