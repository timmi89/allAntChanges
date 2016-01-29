(function() {
    var urlParams = getUrlParams();
    var currentWidgetUrl = computeCurrentScriptUrl(urlParams);
    var newWidgetUrl = computeNewScriptUrl(urlParams);
    var scriptUrl = currentWidgetUrl;
    if (urlParams['antennaNewWidget'] === 'true') {
        // Manual override to use the new widget
        scriptUrl = newWidgetUrl;
    } else if (urlParams['antennaOldWidget'] === 'true') {
        scriptUrl = currentWidgetUrl;
    } else {
        // Otherwise, check if we're on one of the sites that's ready and load the new widget some percentage of the time
        var groups = [
            { domain: 'local.antenna.is', percentage: 100 },
            { domain: 'mobi.perezhilton.com', percentage: 100 },
            { domain: 'perezhilton.com', percentage: 100 },
            { domain: 'dlisted.com', percentage: 100 },
            { domain: 'wral.com', percentage: 100 },
            { domain: 'bustle.com', percentage: 100 },
            { domain: 'channel3000.com', percentage: 100 },
            { domain: 'wktv.com', percentage: 0 },
            { domain: 'fox13news.com', percentage: 0 },
            { domain: 'dukechronicle.com', percentage: 0 },
            { domain: 'jewishboston.com', percentage: 0 },
            { domain: 'kezi.com', percentage: 0 },
            { domain: 'kdrv.com', percentage: 0 },
            { domain: 'ntrsctn.com', percentage: 0 },
            { domain: 'exitevent.com', percentage: 0 }
        ];
        var hostname = window.antenna_host || window.location.hostname;
        for (var i = 0; i < groups.length; i++) {
            var group = groups[i];
            if (hostname.indexOf(group.domain) !== -1) {
                if (Math.random() * 100 < group.percentage) {
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