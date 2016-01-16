var Ractive; require('./utils/ractive-provider').onLoad(function(loadedRactive) { Ractive = loadedRactive;});
var BrowserMetrics = require('./utils/browser-metrics');
var SVGs = require('./svgs');
var WidgetBucket = require('./utils/widget-bucket');

function setupMobileHelper(groupSettings) {
    if (!isDismissed() && !groupSettings.isHideMobileHelper() && BrowserMetrics.isMobile()) {
        var ractive = Ractive({
            el: WidgetBucket.get(),
            append: true,
            data: {},
            template: require('../templates/mobile-helper.hbs.html'),
            partials: {
                logo: SVGs.logo
            }
        });
        ractive.on('dismiss', dismiss);
    }

    function dismiss() {
        ractive.teardown();
        setDismissed(true);
    }
}

function setDismissed(dismissed) {
    localStorage.setItem('hideDoubleTapMessage', dismissed);
}

function isDismissed() {
    return localStorage.getItem('hideDoubleTapMessage');
}

module.exports = {
    setupMobileHelper: setupMobileHelper
};