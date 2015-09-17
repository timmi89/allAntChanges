var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var CommentAreaPartial = require('./comment-area-partial');

var pageSelector = '.antenna-comments-page';

function createPage(options) {
    var reaction = options.reaction;
    var comments = options.comments;
    var element = options.element;
    var containerData = options.containerData;
    var pageData = options.pageData;
    var closeWindow = options.closeWindow;
    var ractive = Ractive({
        el: element,
        append: true,
        data: {
            reaction: reaction,
            comments: comments
        },
        template: require('../templates/comments-page.hbs.html'),
        partials: {
            commentArea: require('../templates/comment-area-partial.hbs.html')
        }
    });
    var reactionProvider = { // this reaction provider is a no-brainer because we already have a valid reaction (one with an ID)
        get: function(callback) {
            callback(reaction);
        }
    };
    // TODO: consider updating the page with the new comment. In order to not have to wait for the server round trip to come back,
    //       we'd want to show the comment in a simpler form (no user name + image). Probably just echo it back in the "thanks" area.
    CommentAreaPartial.setup(reactionProvider, containerData, pageData, ractive);
    ractive.on('closewindow', closeWindow);
    return {
        selector: pageSelector,
        teardown: function() { ractive.teardown(); }
    };
}

module.exports = {
    create: createPage
};