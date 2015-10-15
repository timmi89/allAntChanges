(function() {

    // TODO: How does the closure work when we have multiple files that we concat?
    var $;

    var Templates = function() {

        function indicator() {
            return $('<div style="width:20px; height: 20px; border-radius:20px; background-color: red; float:right;"></div>');
        }

        function summary() {
            return $('<div style="width:50px; height: 20px; border-radius:3px; background-color: blue; float:right;"></div>');
        }

        return {
            indicator: indicator,
            summary: summary
        };
    }();

    var ScriptLoader = function() {

        var baseUrl = 'http://localhost:8081'; // TODO compute this

        function jQueryLoaded() {
            // Update the $ that we define within our own closure to the version of jQuery that we want and reset the global $
            $ = jQuery.noConflict(true);

            $.getJSONP = function(url, data, success, error) {
                var options = {
                    url: baseUrl + url, // TODO base url
                    type: "get",
                    contentType: "application/json",
                    dataType: "jsonp",
                    success: function(response, textStatus, XHR) {
                        // TODO: Revisit whether it's really cool to key this on the textStatus or if we should be looking at
                        //       the status code in the XHR
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
                { src: '//cdnjs.cloudflare.com/ajax/libs/jquery/2.1.4/jquery.min.js', callback: jQueryLoaded },
                { src: '//cdnjs.cloudflare.com/ajax/libs/ractive/0.7.3/ractive.min.js'}
            ];
            // TODO: key this off some kind of flag.
            // Uncomment the following to work offline:
            scripts = [
                { src: baseUrl + '/static/js/cdn/jquery/2.1.4/jquery.min.js', callback: jQueryLoaded },
                { src: baseUrl + '/static/js/cdn/ractive/0.7.3/ractive.min.js'}
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

        // TODO: Review. These are just copied from engage_full.
        var defaults = {
                premium: false,
                img_selector: "img",
                img_container_selectors:"#primary-photo",
                active_sections: "body",
                anno_whitelist: "body p",
                active_sections_with_anno_whitelist:"",
                media_selector: "embed, video, object, iframe",
                comment_length: 500,
                no_ant: "",
                img_blacklist: "",
                custom_css: "",
                //todo: temp inline_indicator defaults to make them show up on all media - remove this later.
                inline_selector: 'img, embed, video, object, iframe',
                paragraph_helper: true,
                media_url_ignore_query: true,
                summary_widget_method: 'after',
                language: 'en',
                ab_test_impact: true,
                ab_test_sample_percentage: 10,
                img_indicator_show_onload: true,
                img_indicator_show_side: 'left',
                tag_box_bg_colors: '#18414c;#376076;215, 179, 69;#e6885c;#e46156',
                tag_box_text_colors: '#fff;#fff;#fff;#fff;#fff',
                tag_box_font_family: 'HelveticaNeue,Helvetica,Arial,sans-serif',
                tags_bg_css: '',
                ignore_subdomain: false,
                //the scope in which to find parents of <br> tags.
                //Those parents will be converted to a <rt> block, so there won't be nested <p> blocks.
                //then it will split the parent's html on <br> tags and wrap the sections in <p> tags.

                //example:
                // br_replace_scope_selector: ".ant_br_replace" //e.g. "#mainsection" or "p"

                br_replace_scope_selector: null //e.g. "#mainsection" or "p"
            };

        function createFromJSON(json) {

            function data(key) {
                return function() {
                    var value = json[key];
                    if (value === undefined || value === '') { // TODO: Should the server be sending back '' here or nothing at all? (It precludes the server from really saying 'nothing')
                        value = defaults[key];
                    }
                    return value;
                };
            }

            function func(key) {
                return function() {
                    // Since the names we have in the DB match the jQuery function names, we *could* just access the methods
                    // using $[name]. But this way, we decouple the data in our DB from the jQuery API.
                    var name = get(key);
                    if (name === 'before') {
                        return $.before;
                    }
                    // TODO: Do we have any other names persisted other than "before" and "after"?
                    return $.after;
                };
            }

            return {
                groupId: data('id'),
                activeSections: data('active_sections'),
                summarySelector: data('summary_widget_selector'),
                summaryMethod: func('summary_widget_method'),
                postSelector: data('post_selector'),
                postHrefSelector: data('post_href_selector'),
                textSelector: data('anno_whitelist')
            }
        }

        return {
            create: createFromJSON
        }

    }();


    var PageData = function() {
        // TODO this is totally speculative

        var elements = {}; // hash --> element
        var interactions = {}; // hash --> interactions

        function computeHash($element) {
            // TODO
            return 'abc';
        }

        function getHash(element) { // TODO pass in DOM node or can we assume jQuery?
            var $element = $(element);
            var id = $element.data('ant-id');
            var hash = hashes[id];
            if (!hash) {
                hash = computeHash($element);
            }
        }

        function setHash(hash, element) {
            elements[hash] = element;
            // TODO
        }

        function getElement(hash) {
            // TODO return the element with the given hash
        }

        function getInteractions(content) {

        }


        return {
            setHash: setHash,
            getHash: getHash,
            getInteractions: getInteractions
        };
    };


    var PageScanner = function() {

        var hashes = {};

        function scanPage(groupSettings) {
            var $activeSections = $(groupSettings.activeSections());
            $activeSections.each(function() {
                var $section = $(this);
                // First, scan for elements that would cause us to insert something into the DOM that takes up space.
                // We want to get any page resizing out of the way as early as possible.
                scanForSummary($section, groupSettings);
                scanForPosts($section, groupSettings);
                scanForCallsToAction($section, groupSettings);
                // Then scan for everything else
                scanForText($section, groupSettings);
                scanForImages($section, groupSettings);
                scanForMedia($section, groupSettings);
            });
        }

        function scanForSummary($section, groupSettings) {
            var $summaries = $section.find(groupSettings.summarySelector());
            // TODO: How do summaries and "posts" relate?
            $summaries.each(function() {
                var $element = $(this);
                // TODO this feels convoluted. should we just have an if/else here to call before() or after()?
                groupSettings.summaryMethod.call($element, Templates.summary());
                //$element.append(Templates.summary());
            });
        }

        function scanForPosts($section, groupSettings) {
            var posts = $section.find(groupSettings.postSelector());
            // TODO
        }

        function scanForCallsToAction($section, groupSettings) {
            // TODO
        }

        function scanForText($section, groupSettings) {
            var $textElements = $section.find(groupSettings.textSelector());
            // TODO: only select "leaf" elements
            $textElements.each(function() {
                var $element = $(this);
                // TODO position correctly
                $element.append(Templates.indicator());
            });
            alert('Found ' + $textElements.length + ' text elements.');
        }

        function scanForImages($section, groupSettings) {
            // TODO
        }

        function scanForMedia($section, groupSettings) {
            // TODO
        }

        return {
           scan: scanPage
        };
    }();

    var PageReactionsLoader = function() {
        // TODO this is just random incomplete snippets

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