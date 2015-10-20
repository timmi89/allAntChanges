
var offline;

function isOffline() {
    if (offline === undefined) {
        // TODO: Do something cross-browser here. This won't work in IE.
        // TODO: Make this more flexible so it works in everyone's dev environment
        offline = document.currentScript.src.indexOf('localhost') !== -1;;
    }
    return offline;
}

module.exports = isOffline();