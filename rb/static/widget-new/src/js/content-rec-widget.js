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
                title: 'Reader Reactions', // TODO: get from group settings. fall back to internationalized message. (consider that group setting might need to specify message per language)
                entries: contentEntries,
                colors: pickColors(numEntries, groupSettings)
            },
            template: require('../templates/content-rec-widget.hbs.html'),
            partials: {
                logo: SVGs.logo
            },
            decorators: {
                'rendertext': renderText
            }
        });
        ractiveInstances.push(ractive);
        ractive.on('navigate', handleNavigate);
    });
    return {
        // TODO: Consider integrating this teardown into our reinitialization
        teardown: function() {
            for (var i = 0; i < ractiveInstances.length; i++) {
                ractiveInstances[i].teardown();
            }
            ractiveInstances = [];
        }
    };

    function handleNavigate(ractiveEvent) {
        // TODO: fire an event
        console.log('navigate');
    }
}

function renderText(node) {
    var text = cropIfNeeded(node);
    if (text.length !== node.innerHTML.length) {
        text += '...';
    }
    text = applyBolding(text);
    if (text.length !== node.innerHTML.length) {
        node.innerHTML = text;
        // Check again, just to make sure the text fits after bolding.
        text = cropIfNeeded(node);
        if (text.length !== node.innerHTML.length) { //
            node.innerHTML = text + '...';
        }
    }

    return { teardown: function() {} };

    function cropIfNeeded(node) {
        var text = node.innerHTML;
        var ratio = node.clientHeight / node.scrollHeight;
        if (ratio < 1) { // If the text is larger than the client area, crop the text.
            var cropWordBreak = text.lastIndexOf(' ', text.length * ratio - 3); // account for the '...' that we'll add
            text = text.substring(0, cropWordBreak);
        }
        return text;
    }

    function applyBolding(text) {
        var boldStartPoint = Math.floor(text.length * .25);
        var boldEndPoint = Math.floor(text.length *.66);
        var matches = text.substring(boldStartPoint, boldEndPoint).match(/,|\.|\?|"/gi);
        if (matches) {
            var boldPoint = text.lastIndexOf(matches[matches.length - 1], boldEndPoint);
            text = '<strong>' + text.substring(0, boldPoint) + '</strong>' + text.substring(boldPoint);
        }
        return text;
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