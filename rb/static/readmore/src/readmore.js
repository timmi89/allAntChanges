(function() {

    function fetchGroupSettings(callback) {
        fetchJSONP('/api/settings', { json: '{}' }, function(json) {
            var groupSettings = GroupSettings.create(json);
            callback(groupSettings);
        });
    }

    function insertReadMore(groupSettings) {
        var containerSelector = groupSettings.readMoreSelector();
        var container = document.querySelector(containerSelector);
        if (container) {
            var cropHeight = computeCropHeight(container, groupSettings);
            if (cropHeight) {
                insertReadMoreCSS(groupSettings);
                var croppingWrapper = createCroppingWrapper(cropHeight);
                wrapElement(container, croppingWrapper);
                var readMoreElement = createReadMoreElement(groupSettings);
                croppingWrapper.appendChild(readMoreElement);
                var contentRecElement = createContentRecElement();
                Utils.insertAfter(contentRecElement, croppingWrapper);
                readMoreElement.addEventListener('click', function () { // TODO: touch support to remove 300ms delay? CSS?
                    unwrapElement(container, croppingWrapper);
                    contentRecElement.parentNode.removeChild(contentRecElement);
                });
            }
        }
    }

    function createReadMoreElement(groupSettings) {
        var dummy = document.createElement('div');
        dummy.innerHTML = Templates.readMoreHtml;
        var customLabel = groupSettings.readMoreLabel();
        if (customLabel) {
            dummy.querySelector('.antenna-readmore-action').innerHTML = customLabel;
        }
        return dummy.firstChild;
    }

    function createContentRecElement() {
        var dummy = document.createElement('div');
        dummy.innerHTML = Templates.contentRecHtml;
        return dummy.firstChild;
    }

    function createCroppingWrapper(cropHeight) {
        var wrapper = document.createElement('div');
        wrapper.className = 'antenna-readmore-crop';
        Utils.setStyles(wrapper, {maxHeight: cropHeight + 'px'});
        return wrapper;
    }

    function wrapElement(originalElement, wrappingElement) {
        originalElement.parentNode.replaceChild(wrappingElement, originalElement)
        wrappingElement.appendChild(originalElement);
    }

    function unwrapElement(nestedElement, wrappingElement) {
        wrappingElement.removeChild(nestedElement);
        wrappingElement.parentNode.replaceChild(nestedChild, wrappingElement);
    }

    function computeCropHeight(container, groupSettings) {
        var cropSelector = groupSettings.cropSelector();
        var maxHeight = groupSettings.cropMaxHeight();
        if (cropSelector) {
            var cropElement = container.querySelector(cropSelector);
            if (cropElement) {
                var contentHeight = cropElement.getBoundingClientRect().bottom - container.getBoundingClientRect().top;
                return Math.min(contentHeight, maxHeight);
            }
        }
    }

    function insertReadMoreCSS(groupSettings) {
        var css = Templates.readMoreCSS;
        var customCSS = groupSettings.readMoreCSS();
        if (customCSS) {
            css += customCSS;
        }
        var styleTag = document.createElement('style');
        styleTag.setAttribute('type', 'text/css');
        styleTag.innerHTML = css;
        (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(styleTag);
    }

    function fetchJSONP(relativeUrl, params, callback) {
        var serverUrl = window.location.host === 'local.antenna.is:8081' ? 'http://local-static.antenna.is:8081' : 'https://www.antenna.is';
        Utils.getJSONP(serverUrl + relativeUrl, params, function(response) {
            if (response.status === 'success') {
                callback(response.data);
            }
        });
    }

    // Generic browser utils.
    var Utils = (function() {

        function insertAfter(newNode, referenceNode) {
            referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
        }

        function removeNodes(selector) {
            var nodeList = document.querySelectorAll(selector);
            for (var i = 0; i < nodeList.length; i++) {
                var node = nodeList[i];
                node.parentNode.removeChild(node);
            }
        }

        function setStyles(element, properties) {
            var style = element.style;
            for (var property in properties) {
                style[property] = properties[property];
            }
        }

        function getJSONP(url, params, callback) {
            var scriptTag = document.createElement('script');
            var responseCallback = 'antenna' + Math.random().toString(16).slice(2);
            window[responseCallback] = function(response) {
                try {
                    callback(response);
                } finally {
                    delete window[responseCallback];
                    scriptTag.parentNode.removeChild(scriptTag);
                }
            };
            var jsonpUrl = url + '?callback=' + responseCallback;
            for (var param in params) {
                if (params.hasOwnProperty(param)) {
                    jsonpUrl += '&' + encodeURI(param) + '=' + encodeURI(params[param]);
                }
            }
            scriptTag.setAttribute('type', 'application/javascript');
            scriptTag.setAttribute('src', jsonpUrl);
            (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(scriptTag);
        }

        function isMobile() {
            return 'ontouchstart' in window &&
                    (window.matchMedia("screen and (max-device-width: 480px) and (orientation: portrait)").matches ||
                    window.matchMedia("screen and (max-device-width: 768px) and (orientation: landscape)").matches);
        }

        return {
            insertAfter: insertAfter,
            removeNodes: removeNodes,
            setStyles: setStyles,
            getJSONP: getJSONP,
            isMobile: isMobile
        };
    })();

    var GroupSettings = (function() {

        var offline = window.location.host === 'local.antenna.is:8081';
        var defaults = {
             // TODO: get rid of the site-specific defaults
            readmore_selector: offline ? '.entry-post' : 'article.article-page div.container',
            readmore_crop_selector: offline ? 'p:nth-of-type(2)' : '.article-body p:nth-of-type(1)',
            readmore_crop_max: offline ? 1400 : 1200
        };

        function createFromJSON(json) {

            function data(key) {
                return function() {
                    var value;
                    if (window.antenna_extend && window.antenna_extend.hasOwnProperty(key)) {
                        value = window.antenna_extend[key];
                    } else if (json.hasOwnProperty(key)) {
                        value = json[key];
                    } else {
                        value = defaults[key];
                    }
                    return value;
                };
            }

            return {
                readMoreSelector: data('readmore_selector'),
                readMoreLabel: data('readmore_label'),
                readMoreCSS: data('readmore_css'),
                cropSelector: data('readmore_crop_selector'),
                cropMaxHeight: data('readmore_crop_max')
            };
        }

        return {
            create: createFromJSON
        };
    })();

    var Templates = (function() {
        var readMoreHtml =
            '<div class="antenna-readmore">\n' +
            '    <div class="antenna-readmore-fade"></div>\n' +
            '    <div class="antenna-readmore-body">\n' +
            '        <div class="antenna-readmore-action">Read More</div>\n' +
            '    </div>\n' +
            '</div>\n';
        var contentRecHtml =
            '<div class="antenna-content-rec antenna-content-rec-readmore">\n' +
            '</div>\n';
        var readMoreCss =
            '.antenna-readmore {\n' +
            '    position: absolute;\n' +
            '    left: 0;\n' +
            '    bottom: 0;\n' +
            '    width: 100%\n' +
            '}\n' +
            '.antenna-readmore-fade {\n' +
            '    height: 100px;\n' +
            '    background-image: linear-gradient(to bottom,rgba(255,255,255,0),rgba(255,255,255,1));\n' +
            '}\n' +
            '.antenna-readmore-body {\n' +
            '    padding: 20px;\n' +
            '    text-align: left;\n' +
            '    background: #FFFFFF;\n' +
            '}\n' +
            '.antenna-readmore-action {\n' +
            '    display: inline-block;\n' +
            '    padding: 10px;\n' +
            '    border: 2px solid black;\n' +
            '    text-align: center;\n' +
            '    font-weight: bold;\n' +
            '    cursor: pointer;\n' +
            '    ms-touch-action: manipulation;\n' +
            '    touch-action: manipulation;\n' +
            '}\n' +
            '.antenna-readmore-crop {\n' +
            '    position: relative;\n' +
            '    overflow-y: hidden;\n' +
            '}\n';

        return {
            readMoreHtml: readMoreHtml,
            contentRecHtml: contentRecHtml,
            readMoreCSS: readMoreCss
        };
    })();


    // Check browser requirements
    if (!document.querySelector || !Element.prototype.addEventListener || !Utils.isMobile()) {
        return;
    }

    // Kick things off by fetching the group settings.
    fetchGroupSettings(insertReadMore);

})();