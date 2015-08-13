var $; require('./utils/jquery-provider').onLoad(function(jQuery) { $=jQuery; });
var PopupWidget = require('./popup-widget');
var ReactionsWidget = require('./reactions-widget');


function createIndicatorWidget(options) {
    // TODO: Adjust visibility based on whether there are reactions on the content (honoring the flag about how many to show at once).
    // TODO: Show intermediate popup thingy when there are no reactions
    var element = options.element;
    var containerData = options.containerData;
    var containerElement = options.containerElement;
    var pageData = options.pageData;
    var groupSettings = options.groupSettings;
    var defaultReactions = groupSettings.defaultReactions(containerElement);
    var ractive = Ractive({
        el: element,
        magic: true,
        data: {
            containerData: containerData
        },
        template: require('../templates/indicator-widget.html')
    });
    var hoverTimeout;
    ractive.on('complete', function() {
        var $rootElement = $(rootElement(ractive));
        $rootElement.on('mouseenter.antenna', function(event) {
            if (containerData.reactions) {
                openReactionsWindow(containerData, containerElement, pageData, groupSettings, ractive);
            } else {
                clearTimeout(hoverTimeout); // only one timeout at a time
                hoverTimeout = setTimeout(function() {
                    showPopup(containerData, containerElement, pageData, groupSettings, ractive);
                }, 200);
            }
        });
        $rootElement.on('mouseleave.antenna', function() {
            clearTimeout(hoverTimeout);
        });
    });
}

function rootElement(ractive) {
    return ractive.find('.antenna-indicator-widget');
}

function showPopup(containerData, containerElement, pageData, groupSettings, ractive) {
    var $icon = $(rootElement(ractive)).find('.ant-antenna-logo');
    var offset = $icon.offset();
    var coordinates = {
        top: offset.top + Math.floor($icon.height() / 2), // TODO this number is a little off because the div doesn't tightly wrap the inserted font character
        left: offset.left + Math.floor($icon.width() / 2)
    };
    PopupWidget.show(coordinates, function() {
        // TODO: open the reactions window
        console.log('popup clicked!');
    })
}

// TODO refactor this duplicated code from summary-widget.js
function openReactionsWindow(containerData, containerElement, pageData, groupSettings, ractive) {
    if (!ractive.reactionsWidget) {
        ractive.reactionsWidget = ReactionsWidget.create({
            reactionsData: containerData.reactions,
            containerData: containerData,
            containerElement: containerElement,
            pageData: pageData,
            groupSettings: groupSettings
        });
    }
    ractive.reactionsWidget.open(rootElement(ractive));
}

//noinspection JSUnresolvedVariable
module.exports = {
    create: createIndicatorWidget
};