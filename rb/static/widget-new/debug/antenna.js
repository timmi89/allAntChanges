(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/Users/jburns/antenna/rb/static/widget-new/src/js/antenna.js":[function(require,module,exports){
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
},{"./group-settings":"/Users/jburns/antenna/rb/static/widget-new/src/js/group-settings.js","./group-settings-loader":"/Users/jburns/antenna/rb/static/widget-new/src/js/group-settings-loader.js","./page-scanner":"/Users/jburns/antenna/rb/static/widget-new/src/js/page-scanner.js","./script-loader":"/Users/jburns/antenna/rb/static/widget-new/src/js/script-loader.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/group-settings-loader.js":[function(require,module,exports){

//var $ = require('./jquery');
var PageScanner = require('./page-scanner');
var $;
require('./script-loader').on$(function(jQuery) {
    $=jQuery;
});

// TODO fold this module into group-settings

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

//noinspection JSUnresolvedVariable
module.exports = {
    load: loadSettings
};
},{"./page-scanner":"/Users/jburns/antenna/rb/static/widget-new/src/js/page-scanner.js","./script-loader":"/Users/jburns/antenna/rb/static/widget-new/src/js/script-loader.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/group-settings.js":[function(require,module,exports){

var $;
require('./script-loader').on$(function(jQuery) {
    $=jQuery;
});

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
        summary_widget_selector: '.ant-page-summary', // TODO: this wasn't defined as a default in engage_full, but was in code. why?
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
            var name = data(key);
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

//noinspection JSUnresolvedVariable
module.exports = {
    create: createFromJSON
};
},{"./script-loader":"/Users/jburns/antenna/rb/static/widget-new/src/js/script-loader.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/jquery-provider.js":[function(require,module,exports){


var callbacks = {};
var $;

function onLoad(callback) {
    if ($) {
        callback($);
    } else {
        callbacks.push(callback);
    }
}

function loaded(jQuery) {
    $ = jQuery.noConflict(true);
    while (callbacks.length > 0) {
        callbacks.pop()($);
    }
}

//noinspection JSUnresolvedVariable
module.exports = {
    onLoad: onLoad,
    loaded: loaded
};
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/js/jquery.js":[function(require,module,exports){

// In order to get the version of jQuery that we load, rather than whatever is already loaded in the hosting page, all our
// modules that use jQuery should have a statement at the top that reads "var $ = require('jquery');"

//module.exports = window.Antenna.jQuery;

//module.export = function() {  };
},{}],"/Users/jburns/antenna/rb/static/widget-new/src/js/page-data.js":[function(require,module,exports){

var $;
require('./script-loader').on$(function(jQuery) {
    $=jQuery;
});

// TODO this is totally speculative!

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

//noinspection JSUnresolvedVariable
module.exports = {
    setHash: setHash,
    getHash: getHash,
    getInteractions: getInteractions
};
},{"./script-loader":"/Users/jburns/antenna/rb/static/widget-new/src/js/script-loader.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/page-reactions-loader.js":[function(require,module,exports){

//var $ = require('./jquery');
var $;
require('./script-loader').on$(function(jQuery) {
    $=jQuery;
});

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

//noinspection JSUnresolvedVariable
module.exports = {
    loadPage: loadPage,
    loadPages: loadPages
};
},{"./script-loader":"/Users/jburns/antenna/rb/static/widget-new/src/js/script-loader.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/page-scanner.js":[function(require,module,exports){

//var $ = require('./jquery');
var Templates = require('./templates');
var $;
require('./script-loader').on$(function(jQuery) {
    $=jQuery;
});

var hashes = {};

// Scan the page using the given settings:
// 1. Find all the containers that we care about.
// 2. Insert widget affordances for each.
// 3. Compute hashes for each container.
//    TODO: Also need to compute hashes for any reacted content (i.e. text selections), but we only have that info after
//          We get back the page data. Don't want to wait for that network request before we start doing this work, though.
//          So we should probably just make another pass for those other content pieces later when we get back the page data.
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
        //groupSettings.summaryMethod.call($element, Templates.summary());
        $element.append(Templates.summary());
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
}

function scanForImages($section, groupSettings) {
    // TODO
}

function scanForMedia($section, groupSettings) {
    // TODO
}

//noinspection JSUnresolvedVariable
module.exports = {
   scan: scanPage
};
},{"./script-loader":"/Users/jburns/antenna/rb/static/widget-new/src/js/script-loader.js","./templates":"/Users/jburns/antenna/rb/static/widget-new/src/js/templates.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/script-loader.js":[function(require,module,exports){

var JqueryProvider = require('./jquery-provider');

var baseUrl = 'http://localhost:8081'; // TODO compute this

var $;
var jQueryCallbacks = [];

function on$(callback) {
    if ($) {
        callback($);
    } else {
        jQueryCallbacks.push(callback);
    }
}

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

    while (jQueryCallbacks.length > 0) {
        jQueryCallbacks.pop()($);
    }
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

//noinspection JSUnresolvedVariable
module.exports = {
    load: loadScripts,
    on$: on$
};
},{"./jquery-provider":"/Users/jburns/antenna/rb/static/widget-new/src/js/jquery-provider.js"}],"/Users/jburns/antenna/rb/static/widget-new/src/js/templates.js":[function(require,module,exports){


// TODO use actual templates. :)

function indicator() {
    return $('<div style="width:20px; height: 20px; border-radius:20px; background-color: red; float:right;"></div>');
}

function summary() {
    return $('<div style="width:50px; height: 20px; border-radius:3px; background-color: blue; float:left;"></div>');
}

//noinspection JSUnresolvedVariable
module.exports = {
    indicator: indicator,
    summary: summary
};
},{}]},{},["/Users/jburns/antenna/rb/static/widget-new/src/js/antenna.js","/Users/jburns/antenna/rb/static/widget-new/src/js/group-settings-loader.js","/Users/jburns/antenna/rb/static/widget-new/src/js/group-settings.js","/Users/jburns/antenna/rb/static/widget-new/src/js/jquery-provider.js","/Users/jburns/antenna/rb/static/widget-new/src/js/jquery.js","/Users/jburns/antenna/rb/static/widget-new/src/js/page-data.js","/Users/jburns/antenna/rb/static/widget-new/src/js/page-reactions-loader.js","/Users/jburns/antenna/rb/static/widget-new/src/js/page-scanner.js","/Users/jburns/antenna/rb/static/widget-new/src/js/script-loader.js","/Users/jburns/antenna/rb/static/widget-new/src/js/templates.js"])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi93aWRnZXQtbmV3L3NyYy9qcy9hbnRlbm5hLmpzIiwiLi4vd2lkZ2V0LW5ldy9zcmMvanMvZ3JvdXAtc2V0dGluZ3MtbG9hZGVyLmpzIiwiLi4vd2lkZ2V0LW5ldy9zcmMvanMvZ3JvdXAtc2V0dGluZ3MuanMiLCIuLi93aWRnZXQtbmV3L3NyYy9qcy9qcXVlcnktcHJvdmlkZXIuanMiLCIuLi93aWRnZXQtbmV3L3NyYy9qcy9qcXVlcnkuanMiLCIuLi93aWRnZXQtbmV3L3NyYy9qcy9wYWdlLWRhdGEuanMiLCIuLi93aWRnZXQtbmV3L3NyYy9qcy9wYWdlLXJlYWN0aW9ucy1sb2FkZXIuanMiLCIuLi93aWRnZXQtbmV3L3NyYy9qcy9wYWdlLXNjYW5uZXIuanMiLCIuLi93aWRnZXQtbmV3L3NyYy9qcy9zY3JpcHQtbG9hZGVyLmpzIiwiLi4vd2lkZ2V0LW5ldy9zcmMvanMvdGVtcGxhdGVzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIFNjcmlwdExvYWRlciA9IHJlcXVpcmUoJy4vc2NyaXB0LWxvYWRlcicpO1xuXG52YXIgR3JvdXBTZXR0aW5ncyA9IHJlcXVpcmUoJy4vZ3JvdXAtc2V0dGluZ3MnKTtcbnZhciBQYWdlU2Nhbm5lciA9IHJlcXVpcmUoJy4vcGFnZS1zY2FubmVyJyk7XG52YXIgR3JvdXBTZXR0aW5nc0xvYWRlciA9IHJlcXVpcmUoJy4vZ3JvdXAtc2V0dGluZ3MtbG9hZGVyJyk7XG5cbmZ1bmN0aW9uIGxvYWRHcm91cFNldHRpbmdzKCkge1xuICAgIEdyb3VwU2V0dGluZ3NMb2FkZXIubG9hZChzY2FuUGFnZSk7XG59XG5cbmZ1bmN0aW9uIHNjYW5QYWdlKGdyb3VwU2V0dGluZ3NKc29uKSB7XG4gICAgdmFyIGdyb3VwU2V0dGluZ3MgPSBHcm91cFNldHRpbmdzLmNyZWF0ZShncm91cFNldHRpbmdzSnNvbik7XG4gICAgICAgIFBhZ2VTY2FubmVyLnNjYW4oZ3JvdXBTZXR0aW5ncyk7XG59XG5cbi8vIFRPRE8gdGhlIGNhc2NhZGUgaXMgcHJldHR5IGNsZWFyLCBidXQgY2FuIHdlIG9yY2hlc3RyYXRlIHRoaXMgYmV0dGVyP1xuU2NyaXB0TG9hZGVyLmxvYWQobG9hZEdyb3VwU2V0dGluZ3MpOyIsIlxuLy92YXIgJCA9IHJlcXVpcmUoJy4vanF1ZXJ5Jyk7XG52YXIgUGFnZVNjYW5uZXIgPSByZXF1aXJlKCcuL3BhZ2Utc2Nhbm5lcicpO1xudmFyICQ7XG5yZXF1aXJlKCcuL3NjcmlwdC1sb2FkZXInKS5vbiQoZnVuY3Rpb24oalF1ZXJ5KSB7XG4gICAgJD1qUXVlcnk7XG59KTtcblxuLy8gVE9ETyBmb2xkIHRoaXMgbW9kdWxlIGludG8gZ3JvdXAtc2V0dGluZ3NcblxuZnVuY3Rpb24gbG9hZEFsbChjYWxsYmFjaykge1xuICAgIGxvYWRTZXR0aW5ncyhmdW5jdGlvbihqc29uKSB7XG4gICAgICAgIC8vIE9uY2Ugd2UgaGF2ZSB0aGUgc2V0dGluZ3MsIHdlIGNhbiBraWNrIG9mZiBhIGNvdXBsZSB0aGluZ3MgaW4gcGFyYWxsZWw6XG4gICAgICAgIC8vXG4gICAgICAgIC8vIC0tIHN0YXJ0IGhhc2hpbmcgdGhlIHBhZ2VcbiAgICAgICAgLy8gLS0gc3RhcnQgZmV0Y2hpbmcgdGhlIHBhZ2UgZGF0YVxuICAgICAgICAvLyAtLSBzdGFydCBpbnNlcnRpbmcgdGhlIGFmZm9yZGFuY2VzIChpbiB0aGUgZW1wdHkgc3RhdGUpXG4gICAgICAgIC8vXG4gICAgICAgIC8vICAgIE9uY2UgdGhlc2UgdGhyZWUgdGFza3MgYWxsIGNvbXBsZXRlLCB0aGVuIHdlIGNhbiB1cGRhdGUgdGhlIGFmZm9yZGFuY2VzIHdpdGggdGhlIGRhdGEgYW5kIHdlJ3JlIHJlYWR5XG4gICAgICAgIC8vICAgIGZvciBhY3Rpb24uXG4gICAgICAgIHZhciBncm91cFNldHRpbmdzID0gR3JvdXBTZXR0aW5ncy5jcmVhdGUoanNvbik7XG4gICAgICAgIFBhZ2VTY2FubmVyLnNjYW4oZ3JvdXBTZXR0aW5ncyk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGxvYWRTZXR0aW5ncyhjYWxsYmFjaykge1xuICAgICQuZ2V0SlNPTlAoJy9hcGkvc2V0dGluZ3MnLCB7IGhvc3RfbmFtZTogd2luZG93LmFudGVubmFfaG9zdCB9LCBjYWxsYmFjaywgaGFuZGxlQ29uZmlnTG9hZGluZ0Vycm9yKTtcbn1cblxuZnVuY3Rpb24gaGFuZGxlQ29uZmlnTG9hZGluZ0Vycm9yKG1lc3NhZ2UpIHtcbiAgICAvLyBUT0RPIGhhbmRsZSBlcnJvcnMgdGhhdCBoYXBwZW4gd2hlbiBsb2FkaW5nIGNvbmZpZyBkYXRhXG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBsb2FkOiBsb2FkU2V0dGluZ3Ncbn07IiwiXG52YXIgJDtcbnJlcXVpcmUoJy4vc2NyaXB0LWxvYWRlcicpLm9uJChmdW5jdGlvbihqUXVlcnkpIHtcbiAgICAkPWpRdWVyeTtcbn0pO1xuXG4vLyBUT0RPOiBSZXZpZXcuIFRoZXNlIGFyZSBqdXN0IGNvcGllZCBmcm9tIGVuZ2FnZV9mdWxsLlxudmFyIGRlZmF1bHRzID0ge1xuICAgICAgICBwcmVtaXVtOiBmYWxzZSxcbiAgICAgICAgaW1nX3NlbGVjdG9yOiBcImltZ1wiLFxuICAgICAgICBpbWdfY29udGFpbmVyX3NlbGVjdG9yczpcIiNwcmltYXJ5LXBob3RvXCIsXG4gICAgICAgIGFjdGl2ZV9zZWN0aW9uczogXCJib2R5XCIsXG4gICAgICAgIGFubm9fd2hpdGVsaXN0OiBcImJvZHkgcFwiLFxuICAgICAgICBhY3RpdmVfc2VjdGlvbnNfd2l0aF9hbm5vX3doaXRlbGlzdDpcIlwiLFxuICAgICAgICBtZWRpYV9zZWxlY3RvcjogXCJlbWJlZCwgdmlkZW8sIG9iamVjdCwgaWZyYW1lXCIsXG4gICAgICAgIGNvbW1lbnRfbGVuZ3RoOiA1MDAsXG4gICAgICAgIG5vX2FudDogXCJcIixcbiAgICAgICAgaW1nX2JsYWNrbGlzdDogXCJcIixcbiAgICAgICAgY3VzdG9tX2NzczogXCJcIixcbiAgICAgICAgLy90b2RvOiB0ZW1wIGlubGluZV9pbmRpY2F0b3IgZGVmYXVsdHMgdG8gbWFrZSB0aGVtIHNob3cgdXAgb24gYWxsIG1lZGlhIC0gcmVtb3ZlIHRoaXMgbGF0ZXIuXG4gICAgICAgIGlubGluZV9zZWxlY3RvcjogJ2ltZywgZW1iZWQsIHZpZGVvLCBvYmplY3QsIGlmcmFtZScsXG4gICAgICAgIHBhcmFncmFwaF9oZWxwZXI6IHRydWUsXG4gICAgICAgIG1lZGlhX3VybF9pZ25vcmVfcXVlcnk6IHRydWUsXG4gICAgICAgIHN1bW1hcnlfd2lkZ2V0X3NlbGVjdG9yOiAnLmFudC1wYWdlLXN1bW1hcnknLCAvLyBUT0RPOiB0aGlzIHdhc24ndCBkZWZpbmVkIGFzIGEgZGVmYXVsdCBpbiBlbmdhZ2VfZnVsbCwgYnV0IHdhcyBpbiBjb2RlLiB3aHk/XG4gICAgICAgIHN1bW1hcnlfd2lkZ2V0X21ldGhvZDogJ2FmdGVyJyxcbiAgICAgICAgbGFuZ3VhZ2U6ICdlbicsXG4gICAgICAgIGFiX3Rlc3RfaW1wYWN0OiB0cnVlLFxuICAgICAgICBhYl90ZXN0X3NhbXBsZV9wZXJjZW50YWdlOiAxMCxcbiAgICAgICAgaW1nX2luZGljYXRvcl9zaG93X29ubG9hZDogdHJ1ZSxcbiAgICAgICAgaW1nX2luZGljYXRvcl9zaG93X3NpZGU6ICdsZWZ0JyxcbiAgICAgICAgdGFnX2JveF9iZ19jb2xvcnM6ICcjMTg0MTRjOyMzNzYwNzY7MjE1LCAxNzksIDY5OyNlNjg4NWM7I2U0NjE1NicsXG4gICAgICAgIHRhZ19ib3hfdGV4dF9jb2xvcnM6ICcjZmZmOyNmZmY7I2ZmZjsjZmZmOyNmZmYnLFxuICAgICAgICB0YWdfYm94X2ZvbnRfZmFtaWx5OiAnSGVsdmV0aWNhTmV1ZSxIZWx2ZXRpY2EsQXJpYWwsc2Fucy1zZXJpZicsXG4gICAgICAgIHRhZ3NfYmdfY3NzOiAnJyxcbiAgICAgICAgaWdub3JlX3N1YmRvbWFpbjogZmFsc2UsXG4gICAgICAgIC8vdGhlIHNjb3BlIGluIHdoaWNoIHRvIGZpbmQgcGFyZW50cyBvZiA8YnI+IHRhZ3MuXG4gICAgICAgIC8vVGhvc2UgcGFyZW50cyB3aWxsIGJlIGNvbnZlcnRlZCB0byBhIDxydD4gYmxvY2ssIHNvIHRoZXJlIHdvbid0IGJlIG5lc3RlZCA8cD4gYmxvY2tzLlxuICAgICAgICAvL3RoZW4gaXQgd2lsbCBzcGxpdCB0aGUgcGFyZW50J3MgaHRtbCBvbiA8YnI+IHRhZ3MgYW5kIHdyYXAgdGhlIHNlY3Rpb25zIGluIDxwPiB0YWdzLlxuXG4gICAgICAgIC8vZXhhbXBsZTpcbiAgICAgICAgLy8gYnJfcmVwbGFjZV9zY29wZV9zZWxlY3RvcjogXCIuYW50X2JyX3JlcGxhY2VcIiAvL2UuZy4gXCIjbWFpbnNlY3Rpb25cIiBvciBcInBcIlxuXG4gICAgICAgIGJyX3JlcGxhY2Vfc2NvcGVfc2VsZWN0b3I6IG51bGwgLy9lLmcuIFwiI21haW5zZWN0aW9uXCIgb3IgXCJwXCJcbiAgICB9O1xuXG5mdW5jdGlvbiBjcmVhdGVGcm9tSlNPTihqc29uKSB7XG5cbiAgICBmdW5jdGlvbiBkYXRhKGtleSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBqc29uW2tleV07XG4gICAgICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCB8fCB2YWx1ZSA9PT0gJycpIHsgLy8gVE9ETzogU2hvdWxkIHRoZSBzZXJ2ZXIgYmUgc2VuZGluZyBiYWNrICcnIGhlcmUgb3Igbm90aGluZyBhdCBhbGw/IChJdCBwcmVjbHVkZXMgdGhlIHNlcnZlciBmcm9tIHJlYWxseSBzYXlpbmcgJ25vdGhpbmcnKVxuICAgICAgICAgICAgICAgIHZhbHVlID0gZGVmYXVsdHNba2V5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmdW5jKGtleSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAvLyBTaW5jZSB0aGUgbmFtZXMgd2UgaGF2ZSBpbiB0aGUgREIgbWF0Y2ggdGhlIGpRdWVyeSBmdW5jdGlvbiBuYW1lcywgd2UgKmNvdWxkKiBqdXN0IGFjY2VzcyB0aGUgbWV0aG9kc1xuICAgICAgICAgICAgLy8gdXNpbmcgJFtuYW1lXS4gQnV0IHRoaXMgd2F5LCB3ZSBkZWNvdXBsZSB0aGUgZGF0YSBpbiBvdXIgREIgZnJvbSB0aGUgalF1ZXJ5IEFQSS5cbiAgICAgICAgICAgIHZhciBuYW1lID0gZGF0YShrZXkpO1xuICAgICAgICAgICAgaWYgKG5hbWUgPT09ICdiZWZvcmUnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICQuYmVmb3JlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gVE9ETzogRG8gd2UgaGF2ZSBhbnkgb3RoZXIgbmFtZXMgcGVyc2lzdGVkIG90aGVyIHRoYW4gXCJiZWZvcmVcIiBhbmQgXCJhZnRlclwiP1xuICAgICAgICAgICAgcmV0dXJuICQuYWZ0ZXI7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgZ3JvdXBJZDogZGF0YSgnaWQnKSxcbiAgICAgICAgYWN0aXZlU2VjdGlvbnM6IGRhdGEoJ2FjdGl2ZV9zZWN0aW9ucycpLFxuICAgICAgICBzdW1tYXJ5U2VsZWN0b3I6IGRhdGEoJ3N1bW1hcnlfd2lkZ2V0X3NlbGVjdG9yJyksXG4gICAgICAgIHN1bW1hcnlNZXRob2Q6IGZ1bmMoJ3N1bW1hcnlfd2lkZ2V0X21ldGhvZCcpLFxuICAgICAgICBwb3N0U2VsZWN0b3I6IGRhdGEoJ3Bvc3Rfc2VsZWN0b3InKSxcbiAgICAgICAgcG9zdEhyZWZTZWxlY3RvcjogZGF0YSgncG9zdF9ocmVmX3NlbGVjdG9yJyksXG4gICAgICAgIHRleHRTZWxlY3RvcjogZGF0YSgnYW5ub193aGl0ZWxpc3QnKVxuICAgIH1cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZTogY3JlYXRlRnJvbUpTT05cbn07IiwiXG5cbnZhciBjYWxsYmFja3MgPSB7fTtcbnZhciAkO1xuXG5mdW5jdGlvbiBvbkxvYWQoY2FsbGJhY2spIHtcbiAgICBpZiAoJCkge1xuICAgICAgICBjYWxsYmFjaygkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBjYWxsYmFja3MucHVzaChjYWxsYmFjayk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBsb2FkZWQoalF1ZXJ5KSB7XG4gICAgJCA9IGpRdWVyeS5ub0NvbmZsaWN0KHRydWUpO1xuICAgIHdoaWxlIChjYWxsYmFja3MubGVuZ3RoID4gMCkge1xuICAgICAgICBjYWxsYmFja3MucG9wKCkoJCk7XG4gICAgfVxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgb25Mb2FkOiBvbkxvYWQsXG4gICAgbG9hZGVkOiBsb2FkZWRcbn07IiwiXG4vLyBJbiBvcmRlciB0byBnZXQgdGhlIHZlcnNpb24gb2YgalF1ZXJ5IHRoYXQgd2UgbG9hZCwgcmF0aGVyIHRoYW4gd2hhdGV2ZXIgaXMgYWxyZWFkeSBsb2FkZWQgaW4gdGhlIGhvc3RpbmcgcGFnZSwgYWxsIG91clxuLy8gbW9kdWxlcyB0aGF0IHVzZSBqUXVlcnkgc2hvdWxkIGhhdmUgYSBzdGF0ZW1lbnQgYXQgdGhlIHRvcCB0aGF0IHJlYWRzIFwidmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcIlxuXG4vL21vZHVsZS5leHBvcnRzID0gd2luZG93LkFudGVubmEualF1ZXJ5O1xuXG4vL21vZHVsZS5leHBvcnQgPSBmdW5jdGlvbigpIHsgIH07IiwiXG52YXIgJDtcbnJlcXVpcmUoJy4vc2NyaXB0LWxvYWRlcicpLm9uJChmdW5jdGlvbihqUXVlcnkpIHtcbiAgICAkPWpRdWVyeTtcbn0pO1xuXG4vLyBUT0RPIHRoaXMgaXMgdG90YWxseSBzcGVjdWxhdGl2ZSFcblxudmFyIGVsZW1lbnRzID0ge307IC8vIGhhc2ggLS0+IGVsZW1lbnRcbnZhciBpbnRlcmFjdGlvbnMgPSB7fTsgLy8gaGFzaCAtLT4gaW50ZXJhY3Rpb25zXG5cbmZ1bmN0aW9uIGNvbXB1dGVIYXNoKCRlbGVtZW50KSB7XG4gICAgLy8gVE9ET1xuICAgIHJldHVybiAnYWJjJztcbn1cblxuZnVuY3Rpb24gZ2V0SGFzaChlbGVtZW50KSB7IC8vIFRPRE8gcGFzcyBpbiBET00gbm9kZSBvciBjYW4gd2UgYXNzdW1lIGpRdWVyeT9cbiAgICB2YXIgJGVsZW1lbnQgPSAkKGVsZW1lbnQpO1xuICAgIHZhciBpZCA9ICRlbGVtZW50LmRhdGEoJ2FudC1pZCcpO1xuICAgIHZhciBoYXNoID0gaGFzaGVzW2lkXTtcbiAgICBpZiAoIWhhc2gpIHtcbiAgICAgICAgaGFzaCA9IGNvbXB1dGVIYXNoKCRlbGVtZW50KTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHNldEhhc2goaGFzaCwgZWxlbWVudCkge1xuICAgIGVsZW1lbnRzW2hhc2hdID0gZWxlbWVudDtcbiAgICAvLyBUT0RPXG59XG5cbmZ1bmN0aW9uIGdldEVsZW1lbnQoaGFzaCkge1xuICAgIC8vIFRPRE8gcmV0dXJuIHRoZSBlbGVtZW50IHdpdGggdGhlIGdpdmVuIGhhc2hcbn1cblxuZnVuY3Rpb24gZ2V0SW50ZXJhY3Rpb25zKGNvbnRlbnQpIHtcblxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgc2V0SGFzaDogc2V0SGFzaCxcbiAgICBnZXRIYXNoOiBnZXRIYXNoLFxuICAgIGdldEludGVyYWN0aW9uczogZ2V0SW50ZXJhY3Rpb25zXG59OyIsIlxuLy92YXIgJCA9IHJlcXVpcmUoJy4vanF1ZXJ5Jyk7XG52YXIgJDtcbnJlcXVpcmUoJy4vc2NyaXB0LWxvYWRlcicpLm9uJChmdW5jdGlvbihqUXVlcnkpIHtcbiAgICAkPWpRdWVyeTtcbn0pO1xuXG4vLyBUT0RPIHRoaXMgaXMganVzdCByYW5kb20gaW5jb21wbGV0ZSBzbmlwcGV0c1xuXG5mdW5jdGlvbiBjcmVhdGVQYWdlUGFyYW0oZ3JvdXBTZXR0aW5ncykge1xuICAgIHJldHVybiB7XG4gICAgICAgIGdyb3VwX2lkOiBncm91cFNldHRpbmdzLmlkLFxuICAgICAgICB1cmw6ICcnLFxuICAgICAgICBjYW5vbmljYWxfdXJsOiAnJyxcbiAgICAgICAgdGl0bGU6ICcnLFxuICAgICAgICBpbWFnZTogJydcbiAgICB9O1xufVxuXG5cblxuZnVuY3Rpb24gbG9hZFBhZ2Uoc2V0dGluZ3MpIHtcbiAgICBhbGVydChKU09OLnN0cmluZ2lmeShzZXR0aW5ncywgbnVsbCwgMikpO1xuICAgICQuZ2V0SlNPTlAoJy9hcGkvcGFnZScsIHtcbiAgICAgICAgICAgIHBhZ2VzOiBbe1xuICAgICAgICAgICAgICAgIGdyb3VwX2lkOiBzZXR0aW5ncy5pZCxcblxuICAgICAgICAgICAgfV1cbiAgICAgICAgfSwgZnVuY3Rpb24ocGFnZXMpIHtcbiAgICAgICAgICAgIGFsZXJ0KEpTT04uc3RyaW5naWZ5KHBhZ2VzLCBudWxsLCAyKSk7XG4gICAgICAgIH0pO1xuXG59XG5cbmZ1bmN0aW9uIGxvYWRQYWdlcygpIHtcblxufVxuXG4vL25vaW5zcGVjdGlvbiBKU1VucmVzb2x2ZWRWYXJpYWJsZVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgbG9hZFBhZ2U6IGxvYWRQYWdlLFxuICAgIGxvYWRQYWdlczogbG9hZFBhZ2VzXG59OyIsIlxuLy92YXIgJCA9IHJlcXVpcmUoJy4vanF1ZXJ5Jyk7XG52YXIgVGVtcGxhdGVzID0gcmVxdWlyZSgnLi90ZW1wbGF0ZXMnKTtcbnZhciAkO1xucmVxdWlyZSgnLi9zY3JpcHQtbG9hZGVyJykub24kKGZ1bmN0aW9uKGpRdWVyeSkge1xuICAgICQ9alF1ZXJ5O1xufSk7XG5cbnZhciBoYXNoZXMgPSB7fTtcblxuLy8gU2NhbiB0aGUgcGFnZSB1c2luZyB0aGUgZ2l2ZW4gc2V0dGluZ3M6XG4vLyAxLiBGaW5kIGFsbCB0aGUgY29udGFpbmVycyB0aGF0IHdlIGNhcmUgYWJvdXQuXG4vLyAyLiBJbnNlcnQgd2lkZ2V0IGFmZm9yZGFuY2VzIGZvciBlYWNoLlxuLy8gMy4gQ29tcHV0ZSBoYXNoZXMgZm9yIGVhY2ggY29udGFpbmVyLlxuLy8gICAgVE9ETzogQWxzbyBuZWVkIHRvIGNvbXB1dGUgaGFzaGVzIGZvciBhbnkgcmVhY3RlZCBjb250ZW50IChpLmUuIHRleHQgc2VsZWN0aW9ucyksIGJ1dCB3ZSBvbmx5IGhhdmUgdGhhdCBpbmZvIGFmdGVyXG4vLyAgICAgICAgICBXZSBnZXQgYmFjayB0aGUgcGFnZSBkYXRhLiBEb24ndCB3YW50IHRvIHdhaXQgZm9yIHRoYXQgbmV0d29yayByZXF1ZXN0IGJlZm9yZSB3ZSBzdGFydCBkb2luZyB0aGlzIHdvcmssIHRob3VnaC5cbi8vICAgICAgICAgIFNvIHdlIHNob3VsZCBwcm9iYWJseSBqdXN0IG1ha2UgYW5vdGhlciBwYXNzIGZvciB0aG9zZSBvdGhlciBjb250ZW50IHBpZWNlcyBsYXRlciB3aGVuIHdlIGdldCBiYWNrIHRoZSBwYWdlIGRhdGEuXG5mdW5jdGlvbiBzY2FuUGFnZShncm91cFNldHRpbmdzKSB7XG4gICAgdmFyICRhY3RpdmVTZWN0aW9ucyA9ICQoZ3JvdXBTZXR0aW5ncy5hY3RpdmVTZWN0aW9ucygpKTtcbiAgICAkYWN0aXZlU2VjdGlvbnMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRzZWN0aW9uID0gJCh0aGlzKTtcbiAgICAgICAgLy8gRmlyc3QsIHNjYW4gZm9yIGVsZW1lbnRzIHRoYXQgd291bGQgY2F1c2UgdXMgdG8gaW5zZXJ0IHNvbWV0aGluZyBpbnRvIHRoZSBET00gdGhhdCB0YWtlcyB1cCBzcGFjZS5cbiAgICAgICAgLy8gV2Ugd2FudCB0byBnZXQgYW55IHBhZ2UgcmVzaXppbmcgb3V0IG9mIHRoZSB3YXkgYXMgZWFybHkgYXMgcG9zc2libGUuXG4gICAgICAgIHNjYW5Gb3JTdW1tYXJ5KCRzZWN0aW9uLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgc2NhbkZvclBvc3RzKCRzZWN0aW9uLCBncm91cFNldHRpbmdzKTtcbiAgICAgICAgc2NhbkZvckNhbGxzVG9BY3Rpb24oJHNlY3Rpb24sIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICAvLyBUaGVuIHNjYW4gZm9yIGV2ZXJ5dGhpbmcgZWxzZVxuICAgICAgICBzY2FuRm9yVGV4dCgkc2VjdGlvbiwgZ3JvdXBTZXR0aW5ncyk7XG4gICAgICAgIHNjYW5Gb3JJbWFnZXMoJHNlY3Rpb24sIGdyb3VwU2V0dGluZ3MpO1xuICAgICAgICBzY2FuRm9yTWVkaWEoJHNlY3Rpb24sIGdyb3VwU2V0dGluZ3MpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBzY2FuRm9yU3VtbWFyeSgkc2VjdGlvbiwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciAkc3VtbWFyaWVzID0gJHNlY3Rpb24uZmluZChncm91cFNldHRpbmdzLnN1bW1hcnlTZWxlY3RvcigpKTtcbiAgICAvLyBUT0RPOiBIb3cgZG8gc3VtbWFyaWVzIGFuZCBcInBvc3RzXCIgcmVsYXRlP1xuICAgICRzdW1tYXJpZXMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRlbGVtZW50ID0gJCh0aGlzKTtcbiAgICAgICAgLy8gVE9ETyB0aGlzIGZlZWxzIGNvbnZvbHV0ZWQuIHNob3VsZCB3ZSBqdXN0IGhhdmUgYW4gaWYvZWxzZSBoZXJlIHRvIGNhbGwgYmVmb3JlKCkgb3IgYWZ0ZXIoKT9cbiAgICAgICAgLy9ncm91cFNldHRpbmdzLnN1bW1hcnlNZXRob2QuY2FsbCgkZWxlbWVudCwgVGVtcGxhdGVzLnN1bW1hcnkoKSk7XG4gICAgICAgICRlbGVtZW50LmFwcGVuZChUZW1wbGF0ZXMuc3VtbWFyeSgpKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gc2NhbkZvclBvc3RzKCRzZWN0aW9uLCBncm91cFNldHRpbmdzKSB7XG4gICAgdmFyIHBvc3RzID0gJHNlY3Rpb24uZmluZChncm91cFNldHRpbmdzLnBvc3RTZWxlY3RvcigpKTtcbiAgICAvLyBUT0RPXG59XG5cbmZ1bmN0aW9uIHNjYW5Gb3JDYWxsc1RvQWN0aW9uKCRzZWN0aW9uLCBncm91cFNldHRpbmdzKSB7XG4gICAgLy8gVE9ET1xufVxuXG5mdW5jdGlvbiBzY2FuRm9yVGV4dCgkc2VjdGlvbiwgZ3JvdXBTZXR0aW5ncykge1xuICAgIHZhciAkdGV4dEVsZW1lbnRzID0gJHNlY3Rpb24uZmluZChncm91cFNldHRpbmdzLnRleHRTZWxlY3RvcigpKTtcbiAgICAvLyBUT0RPOiBvbmx5IHNlbGVjdCBcImxlYWZcIiBlbGVtZW50c1xuICAgICR0ZXh0RWxlbWVudHMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRlbGVtZW50ID0gJCh0aGlzKTtcbiAgICAgICAgLy8gVE9ETyBwb3NpdGlvbiBjb3JyZWN0bHlcbiAgICAgICAgJGVsZW1lbnQuYXBwZW5kKFRlbXBsYXRlcy5pbmRpY2F0b3IoKSk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIHNjYW5Gb3JJbWFnZXMoJHNlY3Rpb24sIGdyb3VwU2V0dGluZ3MpIHtcbiAgICAvLyBUT0RPXG59XG5cbmZ1bmN0aW9uIHNjYW5Gb3JNZWRpYSgkc2VjdGlvbiwgZ3JvdXBTZXR0aW5ncykge1xuICAgIC8vIFRPRE9cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgc2Nhbjogc2NhblBhZ2Vcbn07IiwiXG52YXIgSnF1ZXJ5UHJvdmlkZXIgPSByZXF1aXJlKCcuL2pxdWVyeS1wcm92aWRlcicpO1xuXG52YXIgYmFzZVVybCA9ICdodHRwOi8vbG9jYWxob3N0OjgwODEnOyAvLyBUT0RPIGNvbXB1dGUgdGhpc1xuXG52YXIgJDtcbnZhciBqUXVlcnlDYWxsYmFja3MgPSBbXTtcblxuZnVuY3Rpb24gb24kKGNhbGxiYWNrKSB7XG4gICAgaWYgKCQpIHtcbiAgICAgICAgY2FsbGJhY2soJCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgalF1ZXJ5Q2FsbGJhY2tzLnB1c2goY2FsbGJhY2spO1xuICAgIH1cbn1cblxuZnVuY3Rpb24galF1ZXJ5TG9hZGVkKCkge1xuICAgIC8vIFVwZGF0ZSB0aGUgJCB0aGF0IHdlIGRlZmluZSB3aXRoaW4gb3VyIG93biBjbG9zdXJlIHRvIHRoZSB2ZXJzaW9uIG9mIGpRdWVyeSB0aGF0IHdlIHdhbnQgYW5kIHJlc2V0IHRoZSBnbG9iYWwgJFxuICAgICQgPSBqUXVlcnkubm9Db25mbGljdCh0cnVlKTtcblxuICAgICQuZ2V0SlNPTlAgPSBmdW5jdGlvbih1cmwsIGRhdGEsIHN1Y2Nlc3MsIGVycm9yKSB7XG4gICAgICAgIHZhciBvcHRpb25zID0ge1xuICAgICAgICAgICAgdXJsOiBiYXNlVXJsICsgdXJsLCAvLyBUT0RPIGJhc2UgdXJsXG4gICAgICAgICAgICB0eXBlOiBcImdldFwiLFxuICAgICAgICAgICAgY29udGVudFR5cGU6IFwiYXBwbGljYXRpb24vanNvblwiLFxuICAgICAgICAgICAgZGF0YVR5cGU6IFwianNvbnBcIixcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uKHJlc3BvbnNlLCB0ZXh0U3RhdHVzLCBYSFIpIHtcbiAgICAgICAgICAgICAgICAvLyBUT0RPOiBSZXZpc2l0IHdoZXRoZXIgaXQncyByZWFsbHkgY29vbCB0byBrZXkgdGhpcyBvbiB0aGUgdGV4dFN0YXR1cyBvciBpZiB3ZSBzaG91bGQgYmUgbG9va2luZyBhdFxuICAgICAgICAgICAgICAgIC8vICAgICAgIHRoZSBzdGF0dXMgY29kZSBpbiB0aGUgWEhSXG4gICAgICAgICAgICAgICAgaWYgKHRleHRTdGF0dXMgPT09ICdzdWNjZXNzJykge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzKHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEZvciBKU09OUCByZXF1ZXN0cywgalF1ZXJ5IGRvZXNuJ3QgY2FsbCBpdCdzIGVycm9yIGNhbGxiYWNrLiBJdCBjYWxscyBzdWNjZXNzIGluc3RlYWQuXG4gICAgICAgICAgICAgICAgICAgIGVycm9yKHJlc3BvbnNlLm1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgaWYgKGRhdGEpIHtcbiAgICAgICAgICAgIG9wdGlvbnMuZGF0YSA9IHsganNvbjogSlNPTi5zdHJpbmdpZnkoZGF0YSkgfTtcbiAgICAgICAgfVxuICAgICAgICAkLmFqYXgob3B0aW9ucyk7XG4gICAgfTtcblxuICAgIHdoaWxlIChqUXVlcnlDYWxsYmFja3MubGVuZ3RoID4gMCkge1xuICAgICAgICBqUXVlcnlDYWxsYmFja3MucG9wKCkoJCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBsb2FkU2NyaXB0cyhsb2FkZWRDYWxsYmFjaykge1xuICAgIHZhciBzY3JpcHRzID0gW1xuICAgICAgICB7IHNyYzogJy8vY2RuanMuY2xvdWRmbGFyZS5jb20vYWpheC9saWJzL2pxdWVyeS8yLjEuNC9qcXVlcnkubWluLmpzJywgY2FsbGJhY2s6IGpRdWVyeUxvYWRlZCB9LFxuICAgICAgICB7IHNyYzogJy8vY2RuanMuY2xvdWRmbGFyZS5jb20vYWpheC9saWJzL3JhY3RpdmUvMC43LjMvcmFjdGl2ZS5taW4uanMnfVxuICAgIF07XG4gICAgLy8gVE9ETzoga2V5IHRoaXMgb2ZmIHNvbWUga2luZCBvZiBmbGFnLlxuICAgIC8vIFVuY29tbWVudCB0aGUgZm9sbG93aW5nIHRvIHdvcmsgb2ZmbGluZTpcbiAgICBzY3JpcHRzID0gW1xuICAgICAgICB7IHNyYzogYmFzZVVybCArICcvc3RhdGljL2pzL2Nkbi9qcXVlcnkvMi4xLjQvanF1ZXJ5Lm1pbi5qcycsIGNhbGxiYWNrOiBqUXVlcnlMb2FkZWQgfSxcbiAgICAgICAgeyBzcmM6IGJhc2VVcmwgKyAnL3N0YXRpYy9qcy9jZG4vcmFjdGl2ZS8wLjcuMy9yYWN0aXZlLm1pbi5qcyd9XG4gICAgXTtcbiAgICB2YXIgbG9hZGluZ0NvdW50ID0gc2NyaXB0cy5sZW5ndGg7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzY3JpcHRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBzY3JpcHQgPSBzY3JpcHRzW2ldO1xuICAgICAgICBsb2FkU2NyaXB0KHNjcmlwdC5zcmMsIGZ1bmN0aW9uKHNjcmlwdENhbGxiYWNrKSB7XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNjcmlwdENhbGxiYWNrKSBzY3JpcHRDYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgIGxvYWRpbmdDb3VudCA9IGxvYWRpbmdDb3VudCAtIDE7XG4gICAgICAgICAgICAgICAgaWYgKGxvYWRpbmdDb3VudCA9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChsb2FkZWRDYWxsYmFjaykgbG9hZGVkQ2FsbGJhY2soKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICB9IChzY3JpcHQuY2FsbGJhY2spKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGxvYWRTY3JpcHQoc3JjLCBjYWxsYmFjaykge1xuICAgIHZhciBoZWFkID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKVswXTtcbiAgICBpZiAoaGVhZCkge1xuICAgICAgICB2YXIgc2NyaXB0VGFnID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XG4gICAgICAgIHNjcmlwdFRhZy5zZXRBdHRyaWJ1dGUoJ3NyYycsIHNyYyk7XG4gICAgICAgIHNjcmlwdFRhZy5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCd0ZXh0L2phdmFzY3JpcHQnKTtcblxuICAgICAgICBpZiAoc2NyaXB0VGFnLnJlYWR5U3RhdGUpIHsgLy8gSUUsIGluY2wuIElFOVxuICAgICAgICAgICAgc2NyaXB0VGFnLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmIChzY3JpcHRUYWcucmVhZHlTdGF0ZSA9PSBcImxvYWRlZFwiIHx8IHNjcmlwdFRhZy5yZWFkeVN0YXRlID09IFwiY29tcGxldGVcIikge1xuICAgICAgICAgICAgICAgICAgICBzY3JpcHRUYWcub25yZWFkeXN0YXRlY2hhbmdlID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2NyaXB0VGFnLm9ubG9hZCA9IGZ1bmN0aW9uKCkgeyAvLyBPdGhlciBicm93c2Vyc1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgaGVhZC5hcHBlbmRDaGlsZChzY3JpcHRUYWcpO1xuICAgIH1cbn1cblxuLy9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkVmFyaWFibGVcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGxvYWQ6IGxvYWRTY3JpcHRzLFxuICAgIG9uJDogb24kXG59OyIsIlxuXG4vLyBUT0RPIHVzZSBhY3R1YWwgdGVtcGxhdGVzLiA6KVxuXG5mdW5jdGlvbiBpbmRpY2F0b3IoKSB7XG4gICAgcmV0dXJuICQoJzxkaXYgc3R5bGU9XCJ3aWR0aDoyMHB4OyBoZWlnaHQ6IDIwcHg7IGJvcmRlci1yYWRpdXM6MjBweDsgYmFja2dyb3VuZC1jb2xvcjogcmVkOyBmbG9hdDpyaWdodDtcIj48L2Rpdj4nKTtcbn1cblxuZnVuY3Rpb24gc3VtbWFyeSgpIHtcbiAgICByZXR1cm4gJCgnPGRpdiBzdHlsZT1cIndpZHRoOjUwcHg7IGhlaWdodDogMjBweDsgYm9yZGVyLXJhZGl1czozcHg7IGJhY2tncm91bmQtY29sb3I6IGJsdWU7IGZsb2F0OmxlZnQ7XCI+PC9kaXY+Jyk7XG59XG5cbi8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZFZhcmlhYmxlXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBpbmRpY2F0b3I6IGluZGljYXRvcixcbiAgICBzdW1tYXJ5OiBzdW1tYXJ5XG59OyJdfQ==
