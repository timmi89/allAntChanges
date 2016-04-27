var PROD_SERVER_URL = computeProductionServerUrl();
var DEV_SERVER_URL = "http://local-static.antenna.is:8081";
var TEST_SERVER_URL = 'http://localhost:3001';
var AMAZON_S3_URL = '//cdn.antenna.is';

var PROD_EVENT_SERVER_URL = 'https://events.antenna.is';
var DEV_EVENT_SERVER_URL = 'http://nodebq.docker:3000';

function computeProductionServerUrl() {
    var newApiUrl = 'https://api.antenna.is';
    var oldApiUrl = 'https://www.antenna.is';
    var serverUrl = oldApiUrl;
    var groups = [
        { domain: 'local.antenna.is', percentage: 100 },
        { domain: 'www.antenna.is', percentage: 100 },
        { domain: 'mobi.perezhilton.com', percentage: 100 },
        { domain: 'perezhilton.com', percentage: 100 },
        { domain: 'dlisted.com', percentage: 100 },
        //{ domain: 'wral.com', percentage: 100 },
        //{ domain: 'bustle.com', percentage: 100 },
        //{ domain: 'channel3000.com', percentage: 100 },
        //{ domain: 'wktv.com', percentage: 100 },
        //{ domain: 'fox13news.com', percentage: 100 },
        //{ domain: 'dukechronicle.com', percentage: 100 },
        //{ domain: 'kezi.com', percentage: 100 },
        //{ domain: 'kdrv.com', percentage: 100 },
        //{ domain: 'ntrsctn.com', percentage: 100 },
        //{ domain: 'geekwire.com', percentage: 100 },
        //{ domain: 'blog.antenna.is', percentage: 100 },
        //{ domain: 'exitevent.com', percentage: 100 }
    ];
    var hostname = window.antenna_host || window.location.hostname;
    for (var i = 0; i < groups.length; i++) {
        var group = groups[i];
        if (hostname.indexOf(group.domain) !== -1) {
            if (Math.random() * 100 < group.percentage) {
                serverUrl = newApiUrl;
            }
            break;
        }
    }
    return serverUrl;
}

//noinspection JSUnresolvedVariable
module.exports = {
    PRODUCTION: PROD_SERVER_URL,
    DEVELOPMENT: DEV_SERVER_URL,
    TEST: TEST_SERVER_URL,
    AMAZON_S3: AMAZON_S3_URL,
    PRODUCTION_EVENTS: PROD_EVENT_SERVER_URL,
    DEVELOPMENT_EVENTS: DEV_EVENT_SERVER_URL
};