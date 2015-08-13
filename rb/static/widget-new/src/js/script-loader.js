var RangyProvider = require('./utils/rangy-provider');
var JQueryProvider = require('./utils/jquery-provider');
var isOffline = require('./utils/offline');
var URLs = require('./utils/urls');

var baseUrl = URLs.antennaHome();

var scripts = [
    {src: '//cdnjs.cloudflare.com/ajax/libs/jquery/2.1.4/jquery.min.js', callback: JQueryProvider.loaded},
    {src: '//cdnjs.cloudflare.com/ajax/libs/ractive/0.7.3/ractive.runtime.min.js'},
    {src: baseUrl + '/static/js/cdn/rangy/1.3.0/rangy-core.js', callback: rangyLoaded, aboutToLoad: RangyProvider.aboutToLoad} // TODO: get from cdn or host ourselves
];
if (isOffline) {
    // Use the offline versions of the libraries for development.
    scripts = [
        {src: baseUrl + '/static/js/cdn/jquery/2.1.4/jquery.js', callback: JQueryProvider.loaded},
        {src: baseUrl + '/static/js/cdn/ractive/0.7.3/ractive.runtime.js'},
        {src: baseUrl + '/static/js/cdn/rangy/1.3.0/uncompressed/rangy-core.js', callback: rangyLoaded, aboutToLoad: RangyProvider.aboutToLoad}
    ];
}

function loadAllScripts(loadedCallback) {
    loadScripts(scripts, loadedCallback);
}

function loadScripts(scripts, loadedCallback) {
    var loadingCount = scripts.length;
    for (var i = 0; i < scripts.length; i++) {
        var script = scripts[i];
        if (script.aboutToLoad) { script.aboutToLoad(); };
        loadScript(script.src, function(scriptCallback) {
            return function() {
                if (scriptCallback) scriptCallback();
                loadingCount = loadingCount - 1;
                if (loadingCount == 0) {
                    if (loadedCallback) loadedCallback();
                }
            };
        } (script.callback));
    }
}

function loadScript(src, callback) {
    var head = document.getElementsByTagName('head')[0];
    if (head) {
        var scriptTag = document.createElement('script');
        scriptTag.setAttribute('src', src);
        scriptTag.setAttribute('type','text/javascript');

        if (scriptTag.readyState) { // IE, incl. IE9
            scriptTag.onreadystatechange = function() {
                if (scriptTag.readyState == "loaded" || scriptTag.readyState == "complete") {
                    scriptTag.onreadystatechange = null;
                    if (callback) { callback(); }
                }
            };
        } else {
            scriptTag.onload = function() { // Other browsers
                if (callback) { callback(); }
            };
        }

        head.appendChild(scriptTag);
    }
}

// After the core Rangy is loaded, load the additional modules.
function rangyLoaded() {
    // TODO: Clean this up majorly. Need a good way to package these, load them, and call back when they're ready.
    //       Would be best if we could just include the modules with the main Rangy library?
    var scripts = [
        {src: baseUrl + '/static/js/cdn/rangy/1.3.0/uncompressed/rangy-classapplier.js'},
        {src: baseUrl + '/static/js/cdn/rangy/1.3.0/uncompressed/rangy-textrange.js'},
        {src: baseUrl + '/static/js/cdn/rangy/1.3.0/uncompressed/rangy-serializer.js'}
    ];
    loadScripts(scripts, function() {
        RangyProvider.loaded();
    });
}

//noinspection JSUnresolvedVariable
module.exports = {
    load: loadAllScripts
};