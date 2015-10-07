var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var Ractive; require('./utils/ractive-provider').onLoad(function(loadedRactive) { Ractive = loadedRactive;});

var pageSelector = '.antenna-locations-page';

function createPage(options) {
    var element = options.element;
    var reactionLocationData = options.reactionLocationData;
    var closeWindow = options.closeWindow;
    var ractive = Ractive({
        el: element,
        append: true,
        data: {
            locationData: reactionLocationData,
            pageReactionCount: pageReactionCount(reactionLocationData),
            contentCountLabel: computeContentCountLabel
        },
        template: require('../templates/locations-page.hbs.html')
    });
    ractive.on('closewindow', closeWindow);
    return {
        selector: pageSelector,
        teardown: function() { ractive.teardown(); }
    }
}

function computePageReactionsLabel(reactionLocationData) {
    for (var contentID in reactionLocationData) {
        if (reactionLocationData.hasOwnProperty(contentID)) {
            var contentLocationData = reactionLocationData[contentID];
            if (contentLocationData.kind === 'pag') {
                var count = contentLocationData.count;
                if (count === 1) {
                    return '<strong>1 reaction</strong> to this <strong>page</strong>';
                } else {
                    return '<strong>' + count + ' reactions</strong> to this <strong>page</strong>';
                }
            }
        }
    }
}

function pageReactionCount(reactionLocationData) {
    for (var contentID in reactionLocationData) {
        if (reactionLocationData.hasOwnProperty(contentID)) {
            var contentLocationData = reactionLocationData[contentID];
            if (contentLocationData.kind === 'pag') {
                return contentLocationData.count;
            }
        }
    }
}

function computeContentCountLabel(count) {
    if (count === 1) {
        return '<div class="antenna-content-count">1</div><div>reaction</div>';
    } else {
        return '<div class="antenna-content-count">' + count + '</div><div>reactions</div>';
    }
}

//noinspection JSUnresolvedVariable
module.exports = {
    create: createPage
};