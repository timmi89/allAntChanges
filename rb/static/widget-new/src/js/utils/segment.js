
function isInContentRecSegment(groupSettings) {
    var segment = getSegment(groupSettings);
    return segment === 'rm_cr';
}

function getSegment(groupSettings) {
    var segment = localStorage.getItem('ant_segment');
    if (!segment && (groupSettings.groupId() === 3714 || groupSettings.groupId() === 2)) {
        segment = createSegment(groupSettings);
        try {
            localStorage.setItem('ant_segment', segment);
        } catch(error) {
            // Some browsers (mobile Safari) throw an exception when in private browsing mode.
            // Nothing we can do about it. Just fall through and return the value we generated.
        }
    }
    return segment;
}

function createSegment(groupSettings) {
    // TODO: let group settings control the segments
    var segments = [ 'ao', 'rm', 'rm_cr' ];
    return segments[Math.floor(Math.random() * 3)];
}

module.exports = {
    getSegment: getSegment,
    isInContentRecSegment: isInContentRecSegment
};