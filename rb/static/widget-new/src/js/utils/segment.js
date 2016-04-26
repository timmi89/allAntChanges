var UrlParams = require('./url-params');

var segment;

function getSegment(groupSettings) {
    if (segment === undefined) { // 'null' is the opt-out value
        segment = computeSegment(groupSettings);
    }
    return segment;
}

function computeSegment(groupSettings) {
    var segments = [ 'sw', 'xsw' ];
    var segmentOverride = UrlParams.getUrlParam('antennaSegment');
    if (segmentOverride) {
        storeSegment(segmentOverride);
        return segmentOverride;
    }
    var segment;
    if (isSegmentGroup()) {
        segment = readSegment();
        if (!segment) {
            segment = createSegment(groupSettings);
            segment = storeSegment(segment);
        }
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
            // If this happens, opt out of segmenting
            return null;
        }
        return null;
        return segment;
    }

    function isSegmentGroup() {
        var groupName = groupSettings.groupName();
        var testGroups = [ 'bustle.com', 'local.antenna.is:8081' ];
        for (var i = 0; i < testGroups.length; i++) {
            if (testGroups[i] === groupName) {
                return true;
            }
        }
        return false;
    }
}

function isExpandedSummarySegment(groupSettings) {
    return getSegment(groupSettings) === 'xsw';
}

module.exports = {
    getSegment: getSegment,
    isExpandedSummarySegment: isExpandedSummarySegment
};