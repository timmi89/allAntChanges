var UrlParams = require('./url-params');

var segment;

function getSegment(groupSettings) {
    if (!segment) {
        segment = computeSegment(groupSettings);
    }
    return segment;
}

function computeSegment(groupSettings) {
    var segments = [ '2p', '1p' ];
    if (groupSettings.groupId() === 3714) {
        segments = [ '250', '400', '700' ];
    }
    var segmentOverride = UrlParams.getUrlParam('antennaSegment');
    if (segmentOverride) {
        storeSegment(segmentOverride);
        return segmentOverride;
    }
    var segment = readSegment();
    if (!segment && groupSettings.groupId() === 3714 || groupSettings.groupId() === 2 || groupSettings.groupId() === 2504 || groupSettings.groupId() === 2471) {
        segment = createSegment(groupSettings);
        segment = storeSegment(segment);
    }
    return segment;

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
}

function isInOnePageSegment(groupSettings) {
    return getSegment(groupSettings) === '1p';
}

module.exports = {
    getSegment: getSegment,
    isOnePage: isInOnePageSegment
};