var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var AjaxClient = require('./utils/ajax-client');
var User = require('./utils/user');

function setupCommentArea(reactionProvider, containerData, pageData, callback, ractive) {
    $(ractive.find('.antenna-comment-input')).focus(); // TODO: decide whether we really want to start with focus in the textarea
    ractive.on('inputchanged', updateInputCounter(ractive));
    ractive.on('addcomment', addComment(reactionProvider, containerData, pageData, callback, ractive));
}

function addComment(reactionProvider, containerData, pageData, callback, ractive) {
    return function() {
        var comment = $(ractive.find('.antenna-comment-input')).val().trim(); // TODO: additional validation? input sanitizing?
        if (comment.length > 0) {
            $(ractive.find('.antenna-comment-widgets')).hide();
            $(ractive.find('.antenna-comment-waiting')).fadeIn('slow');
            reactionProvider.get(function (reaction) {
                AjaxClient.postComment(comment, reaction, containerData, pageData, function () {/*TODO*/
                }, error);
                $(ractive.find('.antenna-comment-waiting')).stop().hide();
                $(ractive.find('.antenna-comment-received')).fadeIn();
                callback(comment, User.optimisticUser());

                function error(message) {
                    // TODO real error handling
                    console.log('Error posting comment: ' + message);
                }
            });
        }
    }
}

function updateInputCounter(ractive) {
    return function(ractiveEvent) {
        var $textarea = $(ractiveEvent.original.target);
        var max = parseInt($textarea.attr('maxlength'));
        var length = $textarea.val().length;
        $(ractive.find('.antenna-comment-count')).html(Math.max(0, max - length));
    };
}

//noinspection JSUnresolvedVariable
module.exports = {
    setup: setupCommentArea
};