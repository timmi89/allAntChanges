var Ractive; require('./utils/ractive-provider').onLoad(function(loadedRactive) { Ractive = loadedRactive;});

function createCount(countElement, containerData) {
    var ractive = Ractive({
        el: countElement,
        magic: true,
        data: {
            containerData: containerData
        },
        template: require('../templates/call-to-action-counter.hbs.html')
    });
    countElement.classList.add('no-ant'); // don't show the normal reaction affordance on a cta counter
    return {
        teardown: function() {
            countElement.classList.remove('no-ant');
            ractive.teardown();
        }
    };
}

//noinspection JSUnresolvedVariable
module.exports = {
    create: createCount
};