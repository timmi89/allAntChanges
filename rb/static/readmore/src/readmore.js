(function() {

    function fetchGroupSettings(callback) {
        fetchJSONP('/api/settings/', {}, function(json) {
            var groupSettings = GroupSettings.create(json);
            callback(groupSettings);
        });
    }

    function groupSettingsLoaded(groupSettings) {
        if (groupSettings.showReadMore()) {
            insertReadMore(groupSettings);
            insertCustomCSS(groupSettings);
        }
    }

    function insertCustomCSS(groupSettings) {
        var customCSS = groupSettings.customCSS();
        if (customCSS) {
            var styleTag = document.createElement('style');
            styleTag.setAttribute('type', 'text/css');
            styleTag.id = 'antenna-readmore-styles';
            styleTag.innerHTML = customCSS;
            (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(styleTag);
        }
    }

    function insertReadMore(groupSettings) {
        var containerSelector = groupSettings.readMoreSelector();
        if (containerSelector) {
            var container = document.querySelector(containerSelector);
            if (container) {
                var cropHeight = computeCropHeight(container, groupSettings);
                if (cropHeight) {
                    insertReadMoreCSS(groupSettings);
                    Utils.setStyles(container, { maxHeight: cropHeight + 'px' });
                    Utils.addClass(container, 'antenna-readmore-crop');
                    var readMoreElement = createReadMoreElement(groupSettings);
                    container.appendChild(readMoreElement);
                    var readMoreAction = readMoreElement.querySelector('.antenna-readmore-action');
                    if (readMoreAction) {
                        readMoreAction.addEventListener('click', function () {
                            Utils.setStyles(container, { maxHeight: '' });
                            Utils.removeClass(container, 'antenna-readmore-crop');
                            readMoreElement.parentNode.removeChild(readMoreElement);
                        });
                    }
                }
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

    function computeCropHeight(container, groupSettings) {
        var cropSelector = groupSettings.cropSelector();
        var minHeight = groupSettings.cropMinHeight();
        if (cropSelector) {
            var cropElements = container.querySelectorAll(cropSelector);
            if (cropElements.length > 0) {
                for (var i = 0; i < cropElements.length; i++) {
                    // Compute which element we should crop at based on the amount of visible content.
                    // (Typically, this means measuring from the first P tag.)
                    var contentHeight = cropElements[i].getBoundingClientRect().bottom - cropElements[0].getBoundingClientRect().top;
                    if (contentHeight > minHeight) {
                        // Compute the crop height of the container by measuring the bottom of the crop element within
                        // the container.
                        var cropHeight = cropElements[i].getBoundingClientRect().bottom - container.getBoundingClientRect().top;
                        return cropHeight;
                    }
                }
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
        var serverUrl = process.env.ANTENNA_URL;
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

        function addClass(element, className) {
            element.classList.add(className);
        }

        function removeClass(element, className) {
            element.classList.remove(className);
        }

        function getJSONP(url, params, callback) {
            var scriptTag = document.createElement('script');
            var responseCallback = 'antenna' + Math.random().toString(16).slice(2);
            window[responseCallback] = function(response) {
                try {
                    if (callback) { callback(response) };
                } finally {
                    delete window[responseCallback];
                    scriptTag.parentNode.removeChild(scriptTag);
                }
            };
            var jsonpUrl = url + '?callback=' + responseCallback;
            if (params) {
                jsonpUrl += '&json=' + encodeURIComponent(JSON.stringify(params));
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

        return {
            insertAfter: insertAfter,
            removeNodes: removeNodes,
            setStyles: setStyles,
            addClass: addClass,
            removeClass: removeClass,
            getJSONP: getJSONP,
            isMobile: isMobile,
            getUrlParams: getUrlParams
        };
    })();

    var GroupSettings = (function() {

        var defaults = {
            readmore_crop_min: 400
        };

        function createFromJSON(json) {

            function data(key, ifAbsent) {
                return function() {
                    var value;
                    if (window.antenna_extend) {
                        value = window.antenna_extend[key];
                    }
                    if (value === undefined) {
                        value = json[key];
                        if (value === undefined || value === '' || value === null) {
                            value = defaults[key];
                        }
                    }
                    if (value === undefined) {
                        return ifAbsent;
                    }
                    return value;
                };
            }

            return {
                groupId: data('id'),
                showReadMore: data('show_readmore'),
                readMoreSelector: data('readmore_selector'),
                readMoreLabel: data('readmore_label'),
                readMoreCSS: data('readmore_css'),
                cropSelector: data('readmore_crop_selector'),
                cropMinHeight: data('readmore_crop_min'),
                customCSS: data('custom_css')
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
        var readMoreCss =
            '.antenna-readmore {\n' +
            '    position: absolute;\n' +
            '    left: 0;\n' +
            '    bottom: 0;\n' +
            '    width: 100%;\n' +
            '    z-index: 999999;\n' +
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
            '    overflow-y: hidden !important;\n' +
            '}\n';

        return {
            readMoreHtml: readMoreHtml,
            readMoreCSS: readMoreCss
        };
    })();


    // Check browser requirements
    if (!document.querySelector || !Element.prototype.addEventListener || !('classList' in document.createElement('div')) || !Utils.isMobile()) {
        return;
    }

    // check that we haven't already loaded this
    // crappy check by PB.
    if ( document.querySelector('#antenna-readmore-styles') ) {
        return;
    }

    // Kick things off by fetching the group settings.
    fetchGroupSettings(groupSettingsLoaded);

})();
