var Ractive; require('./utils/ractive-provider').onLoad(function(loadedRactive) { Ractive = loadedRactive;});

var ContentRecLoader = require('./content-rec-loader');
var SVGs = require('./svgs');

var ractiveInstances = [];

function createContentRec(element, groupSettings) {
    var numEntries = 2;
    ContentRecLoader.getRecommendedContent(numEntries, groupSettings, function(contentEntries) {
        var ractive = Ractive({
            el: element,
            append: true,
            data: {
                entries: contentEntries,
                colors: pickColors(numEntries, groupSettings)
            },
            template: require('../templates/content-rec-widget.hbs.html'),
            partials: {
                logo: SVGs.logo
            }
        });
        ractiveInstances.push(ractive);
        ractive.on('goToContent', goToContent);
    });
    return {
        // TODO: Consider integrating this teardown into our reinitialization
        teardown: function() {
            for (var i = 0; i < ractiveInstances.length; i++) {
                ractiveInstances[i].teardown();
            }
            ractiveInstances = [];
        }
    }

    function goToContent(ractiveEvent, url) {
        window.location.href = url;
        // TODO: fire an event
        // TODO: consider navigation within single page apps
    }
}

function pickColors(count, groupSettings) {
    var colorPallete = [ // TODO: get this from groupsettings
        { background: '#41e7d0', foreground: '#333333' },
        { background: '#86bbfd', foreground: '#333333' },
        { background: '#FF6666', foreground: '#FFFFFF' },
        { background: '#979797', foreground: '#FFFFFF' }
    ];
    var colors = shuffleArray(colorPallete); // shuffleArray(groupSettings.whatever())
    if (count < colors.length) {
        return colors.slice(0, count);
    } else { // If we're asking for more colors than we have, just repeat the same colors as necessary.
        var output = [];
        for (var i = 0; i < count; i++) {
            output.push(colors[i%colors.length]);
        }
    }
}

// Durstenfeld shuffle algorithm from: http://stackoverflow.com/a/12646864/4135431
function shuffleArray(array) {
    var copy = array.slice(0);
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = copy[i];
        copy[i] = copy[j];
        copy[j] = temp;
    }
    return copy;
}

module.exports = {
    createContentRec: createContentRec
};