(function() {
    var urlParams = getUrlParams();
    var currentWidgetUrl = computeCurrentScriptUrl(urlParams);
    var newWidgetUrl = computeNewScriptUrl(urlParams);
    var scriptUrl = currentWidgetUrl;
    if (urlParams['antennaNewWidget'] === 'true') {
        // Manual override to use the new widget
        scriptUrl = newWidgetUrl;
    } else {
        // Otherwise, check if we're on one of the sites that's ready and load the new widget some percentage of the time
        var readyDomains = [
            'local.antenna.is',
            'perezhilton.com',
            'mobi.perezhilton.com',
            'dlisted.com',
            'wral.com',
            'channel3000.com'
        ];
        var hostname = window.antenna_host || window.location.hostname;
        for (var i = 0; i < readyDomains.length; i++) {
            if (hostname === readyDomains[i]) {
                var percentage = 0;
                if (Math.random() * 100 < percentage) {
                    scriptUrl = newWidgetUrl;
                }
                break;
            }
        }
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

    function computeNewScriptUrl(urlParams) {
        var offline = window.location.hostname === 'local.antenna.is';
        var debug = urlParams['antennaDebug'] === 'true';
        var serverUrl = offline ? 'http://local-static.antenna.is:8081' : 'http://www.antenna.is';
        if (debug) {
            return serverUrl + '/static/widget-new/debug/antenna.js';
        } else {
            return serverUrl + '/static/widget-new/antenna.min.js';
        }
    }

    function computeCurrentScriptUrl(urlParams) {
        var offline = window.location.hostname === 'local.antenna.is';
        var debug = urlParams['antennaDebug'] === 'true';
        var serverUrl = offline ? 'http://local-static.antenna.is:8081' : 'http://www.antenna.is';
        if (debug) {
            return serverUrl + '/static/engage_full.js';
        } else {
            return serverUrl + '/static/engage.min.js';
        }
    }
})();