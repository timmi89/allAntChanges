var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var AjaxClient = require('./utils/ajax-client');

var pageSelector = '.antenna-confirmation-page';

function createPage(reaction, containerData, pageData, element) {
    var ractive = Ractive({
        el: element,
        append: true,
        data: {
            text: reaction.text
        },
        template: require('../templates/confirmation-page.hbs.html')
    });
    ractive.on('addcomment', addComment(reaction, containerData, pageData, ractive));
    return {
        selector: pageSelector,
        teardown: function() { ractive.teardown(); }
    };
}

function addComment(reaction, containerData, pageData, ractive) {
    return function() {
        // TODO: send the comment to the server and figure out how to link it to the reaction.
        //       in particular, how do we link to a reaction that might not even have an
        //       ID yet (we show this UI potentially before we're done posting the reaction to the server)
        var $textarea = $(ractive.find('textarea'));
        var comment = $textarea.val().trim(); // TODO: additional validation? input sanitizing?
        if (comment.length > 0) {
            AjaxClient.postComment(comment, reaction, containerData, pageData, function(){/*TODO*/}, error);
        }

        function error(message) {
            // TODO real error handling
            console.log('Error posting comment: ' + message);
        }
    }
}

module.exports = {
    create: createPage
};