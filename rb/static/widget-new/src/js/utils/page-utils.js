var DomUtils = require('./dom-utils');

function computePageTitle(pageElement, groupSettings) {
    var titleSelector = groupSettings.pageTitleSelector();
    if (!titleSelector) {
        // Backwards compatibility for sites which deployed before we had a separate title selector.
        titleSelector = groupSettings.pageUrlSelector();
    }
    var titleElement = pageElement.querySelector(titleSelector);
    var pageTitle = titleElement ? titleElement.innerText.trim() : '';
    if (!pageTitle) {
        // If we couldn't find a title based on the group settings, fallback to some hard-coded behavior.
        pageTitle = getAttributeValue('meta[property="og:title"]', 'content');
        if (!pageTitle) {
            var titleElements = document.getElementsByTagName('title');
            for (var i = 0; i < titleElements.length; i++) {
                pageTitle = pageTitle || titleElements[i].innerText.trim();
            }
        }
    }
    return pageTitle;
}

function computeTopLevelPageImage(groupSettings) {
    return getAttributeValue(groupSettings.pageImageSelector(), groupSettings.pageImageAttribute());
}

function computePageAuthor(groupSettings) {
    return getAttributeValue(groupSettings.pageAuthorSelector(), groupSettings.pageAuthorAttribute());
}

function computePageTopics(groupSettings) {
    return getAttributeValue(groupSettings.pageTopicsSelector(), groupSettings.pageTopicsAttribute());
}

function computePageSiteSection(groupSettings) {
    return getAttributeValue(groupSettings.pageSiteSectionSelector(), groupSettings.pageSiteSectionAttribute());
}

function getAttributeValue(elementSelector, attributeSelector) {
    var value = '';
    if (elementSelector && attributeSelector) {
        var element = document.querySelector(elementSelector);
        value = element ? element.getAttribute(attributeSelector) : '';
    }
    return value.trim();
}

function computeTopLevelCanonicalUrl(groupSettings) {
    var canonicalUrl = getAttributeValue('link[rel="canonical"]', 'href').toLowerCase();
    // Check for invalid value (seen in the wild where a site wrote all canonical url links as their domain)
    var domain = (window.location.protocol+'//'+window.location.hostname+'/').toLowerCase();
    if (!canonicalUrl || canonicalUrl === domain) {
        canonicalUrl = window.location.href.split('#')[0].toLowerCase();
    }
    return removeSubdomainFromPageUrl(canonicalUrl, groupSettings);
}

function computePageElementUrl(pageElement, groupSettings) {
    var pageUrlSelector = groupSettings.pageUrlSelector();
    if (pageUrlSelector) {
        var pageUrlElement = pageElement.querySelector(pageUrlSelector);
        if (!pageUrlElement && DomUtils.matchesSelector(pageElement, pageUrlSelector)) {
            pageUrlElement = pageElement;
        }
        if (pageUrlElement) {
            var url = pageUrlElement.getAttribute(groupSettings.pageUrlAttribute());
            if (url) {
                url = removeSubdomainFromPageUrl(url, groupSettings);
                var origin = window.location.origin || window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port: '');
                if (url.indexOf(origin) !== 0 && // Not an absolute URL
                        !url.substr(0,2) !== '//' && // Not protocol relative
                        !groupSettings.url.ignoreSubdomain()) { // And we weren't not ignoring the subdomain
                    if (url.substr(0,1) == '/') {
                        url = origin + url;
                    } else {
                        url = origin + window.location.pathname + url;
                    }
                }
                return url;
            }
        }
    }
    return computeTopLevelCanonicalUrl(groupSettings);
}

// TODO copied from engage_full. Review.
function removeSubdomainFromPageUrl(url, groupSettings) {
    // ANT.actions.removeSubdomainFromPageUrl:
    // if "ignore_subdomain" is checked in settings, AND they supply a TLD,
    // then modify the page and canonical URLs here.
    // have to have them supply one because there are too many variations to reliably strip subdomains  (.com, .is, .com.ar, .co.uk, etc)
    if (groupSettings.url.ignoreSubdomain() == true && groupSettings.url.canonicalDomain()) {
        var HOSTDOMAIN = /[-\w]+\.(?:[-\w]+\.xn--[-\w]+|[-\w]{2,}|[-\w]+\.[-\w]{2})$/i;
        var srcArray = url.split('/');

        var protocol = srcArray[0];
        srcArray.splice(0,3);

        var returnUrl = protocol + '//' + groupSettings.url.canonicalDomain() + '/' + srcArray.join('/');

        return returnUrl;
    } else {
        return url;
    }
}

//noinspection JSUnresolvedVariable
module.exports = {
    computePageUrl: computePageElementUrl,
    computePageTitle: computePageTitle,
    computeTopLevelPageImage: computeTopLevelPageImage,
    computePageAuthor: computePageAuthor,
    computePageTopics: computePageTopics,
    computePageSiteSection: computePageSiteSection
};