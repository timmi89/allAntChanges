var UrlParams = require('./url-params');

var segments = [ '250', '400', '700' ];
var segment;

function getSegment(groupSettings) {
    if (!segment) {
        segment = computeSegment(groupSettings);
    }
    return segment;
}

function computeSegment(groupSettings) {
    var segmentOverride = UrlParams.getUrlParam('antennaSegment');
    if (segmentOverride) {
        storeSegment(segmentOverride);
        return segmentOverride;
    }
    var segment = readSegment();
    if (!segment && (groupSettings.groupId() === 3714 || groupSettings.groupId() === 2)) {
        segment = createSegment(groupSettings);
        segment = storeSegment(segment);
    }
    return segment;
}

function readSegment() {
    // Returns the stored segment, but only if it is one of the current valid segments.
    var segment = localStorage.getItem('ant_segment');
    if (segment) {
        for (var i = 0; i < segments.length; i++) {
            if (segment === segments[i]) {
                return segment; // Valid segment. Return.
            }
        }
    }
}

function createSegment(groupSettings) {
    return segments[Math.floor(Math.random() * segments.length)];
}

function storeSegment(segment) {
    try {
        localStorage.setItem('ant_segment', segment);
    } catch(error) {
        // Some browsers (mobile Safari) throw an exception when in private browsing mode.
        // If this happens, fall back to a default value that will at least give us stable behavior.
        segment = segments[0];
    }
    return segment;
}


module.exports = {
    getSegment: getSegment
};