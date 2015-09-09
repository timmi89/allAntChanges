var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var AjaxClient = require('./utils/ajax-client');

var pageSelector = '.antenna-confirmation-page';

function createPage(reaction, element) {
    var ractive = Ractive({
        el: element,
        append: true,
        data: {
            text: reaction.text
        },
        template: require('../templates/confirmation-page.hbs.html')
    });
    ractive.on('addcomment', addComment(reaction, ractive));
    return {
        selector: pageSelector,
        teardown: function() { ractive.teardown(); }
    };
}

function addComment(reaction, ractive) {
    return function() {
        // TODO: send the comment to the server and figure out how to link it to the reaction.
        //       in particular, how do we link to a default reaction that might not even have an
        //       ID yet (we show this UI potentially before we're done posting the reaction to the server)
        var $textarea = $(ractive.find('textarea'));
        alert('add comment: ' + $textarea.val());
    }
}

module.exports = {
    create: createPage
};