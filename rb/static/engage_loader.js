(function() {
    var urlParams = getUrlParams();
    if (urlParams['antennaDisabled'] === 'true') {
        return;
    }
    var serverUrl = computeServerUrl(urlParams);
    var scriptUrl = computeNewScriptUrl(serverUrl, urlParams);
    if (urlParams['antennaOldWidget'] === 'true') {
        scriptUrl = computeOldScriptUrl(serverUrl, urlParams);
    }
    loadScript(scriptUrl);

    function loadScript(scriptUrl) {
        var scriptTag = document.createElement('script');
        scriptTag.setAttribute('src', scriptUrl);
        scriptTag.setAttribute('type', 'text/javascript');
        scriptTag.setAttribute('async', 'true');
        (document.getElementsByTagName('head')[0] || document.body).appendChild(scriptTag);
    }

    function getUrlParams() {
        var queryString = window.location.search;
        var urlParams = {};
        var e,
        a = /\+/g,  // Regex for replacing addition symbol with a space
        r = /([^&=]+)=?([^&]*)/g,
        d = function (s) { return decodeURIComponent(s.replace(a, " ")); },
        q = queryString.substring(1);

        while (e = r.exec(q)) {
            urlParams[d(e[1])] = d(e[2]);
        }
        return urlParams;
    }

    function computeServerUrl(urlParams) {
        var serverUrl = urlParams['antennaUrl'];
        if (!serverUrl) {
            serverUrl = process.env.ANTENNA_STATIC_URL;
        }
        return serverUrl;
    }

    function computeNewScriptUrl(serverUrl, urlParams) {
        var debug = urlParams['antennaDebug'] === 'true';
        if (debug) {
            return serverUrl + '/widget-new/debug/antenna.js';
        } else {
            return serverUrl + '/widget-new/antenna.min.js';
        }
    }

    function computeOldScriptUrl(serverUrl, urlParams) {
        var debug = urlParams['antennaDebug'] === 'true';
        if (debug) {
            return serverUrl + '/engage_full.js';
        } else {
            return serverUrl + '/engage.min.js';
        }
    }
})();
