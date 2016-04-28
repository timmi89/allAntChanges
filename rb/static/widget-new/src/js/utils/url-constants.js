var ANTENNA_URL = process.env.ANTENNA_URL;
var ANTENNA_API_URL = process.env.ANTENNA_API_URL;
var ANTENNA_STATIC_URL = process.env.ANTENNA_STATIC_URL;
var DEV_ANTENNA_URL = "http://antenna.docker";
var DEV_ANTENNA_STATIC_URL = "http://antenna-static.docker";
var TEST_ANTENNA_URL = 'http://localhost:3001';

var EVENTS_URL = process.env.EVENTS_URL;
var DEV_EVENTS_URL = 'http://nodebq.docker';

//noinspection JSUnresolvedVariable
module.exports = {
    ANTENNA: ANTENNA_URL,
    ANTENNA_API: ANTENNA_API_URL,
    ANTENNA_STATIC: ANTENNA_STATIC_URL,
    DEV_ANTENNA: DEV_ANTENNA_URL,
    DEV_ANTENNA_STATIC: DEV_ANTENNA_STATIC_URL,
    TEST_ANTENNA: TEST_ANTENNA_URL,
    EVENTS: EVENTS_URL,
    DEV_EVENTS: DEV_EVENTS_URL
};
