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
        return '<div class="antenna-content-count number">1</div><div class="antenna-content-count">reaction</div>';
    } else {
        return '<div class="antenna-content-count number">' + count + '</div><div class="antenna-content-count">reactions</div>';
    }
}

//noinspection JSUnresolvedVariable
module.exports = {
    create: createPage
};