var ScriptLoader = require('./script-loader');

var GroupSettings = require('./group-settings');
var PageScanner = require('./page-scanner');
var GroupSettingsLoader = require('./group-settings-loader');

function loadGroupSettings() {
    GroupSettingsLoader.load(scanPage);
}

function scanPage(groupSettingsJson) {
    var groupSettings = GroupSettings.create(groupSettingsJson);
        PageScanner.scan(groupSettings);
}

// TODO the cascade is pretty clear, but can we orchestrate this better?
ScriptLoader.load(loadGroupSettings);