var Ractive; require('./utils/ractive-provider').onLoad(function(loadedRactive) { Ractive = loadedRactive;});

function createLabel(labelElement, containerData) {
    var ractive = Ractive({
        el: labelElement, // TODO: review the structure of the DOM here. Do we want to render an element into $ctaLabel or just text?
        magic: true,
        data: {
            containerData: containerData
        },
        template: require('../templates/call-to-action-label.hbs.html')
    });
    labelElement.classList.add('no-ant'); // Add the no-ant class so we don't add normal indicators
    return {
        teardown: function() {
            labelElement.classList.remove('no-ant');
            ractive.teardown();
        }
    }
}

//noinspection JSUnresolvedVariable
module.exports = {
    create: createLabel
};