var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var AjaxClient = require('./utils/ajax-client');

function setupCommentArea(reaction, containerData, pageData, ractive) {
    $(ractive.find('.antenna-comment-input')).focus(); // TODO: decide whether we really want to start with focus in the textarea
    ractive.on('addcomment', addComment(reaction, containerData, pageData, ractive));
}

function addComment(reaction, containerData, pageData, ractive) {
    return function() {
        // TODO: send the comment to the server and figure out how to link it to the reaction.
        //       in particular, how do we link to a reaction that might not even have an
        //       ID yet (we show this UI potentially before we're done posting the reaction to the server)
        var comment = $(ractive.find('.antenna-comment-input')).val().trim(); // TODO: additional validation? input sanitizing?
        if (comment.length > 0) {
            AjaxClient.postComment(comment, reaction, containerData, pageData, function(){/*TODO*/}, error);
            $(ractive.find('.antenna-comment-widgets')).hide();
            $(ractive.find('.antenna-comment-received')).fadeIn();
        }

        function error(message) {
            // TODO real error handling
            console.log('Error posting comment: ' + message);
        }
    }
}

//noinspection JSUnresolvedVariable
module.exports = {
    setup: setupCommentArea
};