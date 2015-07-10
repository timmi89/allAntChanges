(function() {

    // TODO: How does the closure work when we have multiple files that we concat?
    var $;

    var ScriptLoader = function() {

        function jQueryLoaded() {
            // Update the $ that we define within our own closure to the version of jQuery that we want and reset the global $
            $ = jQuery.noConflict(true);

            $.getJSONP = function(url, data, success, error) {
                var options = {
                    url: 'http://localhost:8081' + url, // TODO base url
                    type: "get",
                    contentType: "application/json",
                    dataType: "jsonp",
                    success: function(response, textStatus, XHR) {
                        // TODO Revisit whether it's really cool to key this on the textStatus or if we should be looking at
                        // the status code in the XHR
                        if (textStatus === 'success') {
                            success(response.data);
                        } else {
                            // For JSONP requests, jQuery doesn't call it's error callback. It calls success instead.
                            error(response.message);
                        }
                    }
                };
                if (data) {
                    options.data = { json: JSON.stringify(data) };
                }
                $.ajax(options);
            };
        }

        function loadScripts(loadedCallback) {
            var scripts = [
                { src: 'https://cdnjs.cloudflare.com/ajax/libs/jquery/2.1.4/jquery.min.js', callback: jQueryLoaded },
                { src: 'https://cdnjs.cloudflare.com/ajax/libs/ractive/0.7.3/ractive.min.js'}
            ];
            var loadingCount = scripts.length;
            for (var i = 0; i < scripts.length; i++) {
                var script = scripts[i];
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
                            callback();
                        }
                    };
                } else {
                    scriptTag.onload = function() { // Other browsers
                        callback();
                    };
                }

                head.appendChild(scriptTag);
            }
        }

        return {
            load: loadScripts
        };

    }();


    var GroupSettings = function() {

        var data;
        // TODO real defaults
        var defaults = {
            'active_sections': 'body'
        };

        function createFromJSON(json) {
            data = json;

            function accessor(key) {
                return function() {
                    var value = data[key];
                    if (value === undefined) { // TODO verifiy this works for boolean values
                        value = defaults[key];
                    }
                };
            }

            return {
                groupId: accessor('id'),
                activeSections: accessor('active_sections'),
                postSelector: accessor('post_selector'),
                postHrefSelector: accessor('post_href_selector')
            }
        }

        return {
            create: createFromJSON
        }

    }();


    var PageScanner = function() {

        function scanPage(groupSettings) {
            // TODO: Is it right to only look inside active sections?
            // TODO: Does find() blow up if you pass undefined?
            var $posts = $(groupSettings.activeSections()).find(groupSettings.postSelector());
            alert('Found ' + $posts.length + ' posts!');
            if ($posts.length == 0) {
                // We're on an individual page
                PageLoader
            } else {
                // We're on a 'blog roll'

            }
        }

        return {
           scan: scanPage
        };
    }();

    var PageReactionsLoader = function() {
        // TODO this is totally incomplete

        function createPageParam(groupSettings) {
            return {
                group_id: groupSettings.id,
                url: '',
                canonical_url: '',
                title: '',
                image: ''
            };
        }



        function loadPage(settings) {
            alert(JSON.stringify(settings, null, 2));
            $.getJSONP('/api/page', {
                    pages: [{
                        group_id: settings.id,

                    }]
                }, function(pages) {
                    alert(JSON.stringify(pages, null, 2));
                });

        }

        function loadPages() {

        }

        return {
            loadPage: loadPage,
            loadPages: loadPages
        }
    }();

    var GroupSettingsLoader = function() {

        function loadAll(callback) {
            loadSettings(function(json) {
                // Once we have the settings, we can kick off a couple things in parallel:
                //
                // -- start hashing the page
                // -- start fetching the page data
                // -- start inserting the affordances (in the empty state)
                //
                //    Once these three tasks all complete, then we can update the affordances with the data and we're ready
                //    for action.
                var groupSettings = GroupSettings.create(json);
                PageScanner.scan(groupSettings);
            });
        }

        function loadSettings(callback) {
            $.getJSONP('/api/settings', { host_name: window.antenna_host }, callback, handleConfigLoadingError);
        }

        function handleConfigLoadingError(message) {
            // TODO handle errors that happen when loading config data
        }

        return {
            load: loadSettings
        };
    }();

    // TODO the cascade is pretty clear, but orchestrate this better?
    ScriptLoader.load(function() {
        GroupSettingsLoader.load(function(json) {
            var groupSettings = GroupSettings.create(json);
            PageScanner.scan(groupSettings);
        });
    });

})();