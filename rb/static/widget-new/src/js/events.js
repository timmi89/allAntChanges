var AjaxClient = require('./utils/ajax-client');

var isTouchBrowser = (navigator.msMaxTouchPoints || "ontouchstart" in window) && ((window.matchMedia("only screen and (max-width: 768px)")).matches);

function postGroupSettingsLoaded(groupSettings) {
    var event = createEvent(eventTypes.script_load, '', groupSettings); // eventValue was historically for A/B testing
    event[attributes.page_id] = 'na';
    event[attributes.article_height] = 'na';
    postEvent(event);
}

function postPageDataLoaded(pageData, groupSettings) {
    var event = createEvent(eventTypes.widget_load, '', groupSettings); // eventValue was historically for A/B testing
    appendPageDataParams(event, pageData);
    // TODO: The existing code (engage_full line 4467) appears to be mostly dead code. Review.
    //event[attributes.content_attributes] = pages.length > 1 ? eventValues.multiple_pages : eventValues.single_summary_bar;
    event[attributes.content_attributes] = pageData.metrics.isMultiPage ? eventValues.multiple_pages : eventValues.single_summary_bar;
    postEvent(event);
}

function postReactionWidgetOpened(isShowReactions, pageData, containerData, contentData, groupSettings) {
    var eventValue = isShowReactions ? eventValues.readmode : eventValues.writemode;
    // TODO: what is "rd-zero" for?
    var event = createEvent(eventTypes.aWindow_show, eventValue, groupSettings);
    appendPageDataParams(event, pageData);
    event[attributes.container_hash] = containerData.hash;
    event[attributes.container_kind] = contentData.type;
    postEvent(event);
}

function postSummaryOpened(isShowReactions, pageData, groupSettings) {
    var eventValue = isShowReactions ? eventValues.viewReactions : eventValues.viewDefaults;
    var event = createEvent(eventTypes.summary_bar, eventValue, groupSettings);
    appendPageDataParams(event, pageData);
    postEvent(event);
}

function postReactionCreated(pageData, containerData, reactionData, groupSettings) {
    var event = createEvent(eventTypes.reaction, reactionData.text, groupSettings);
    appendPageDataParams(event, pageData);
    event[attributes.reaction_body] = reactionData.text;
    event[attributes.container_hash] = containerData.hash;
    event[attributes.container_kind] = containerData.type;
    event[attributes.content_location] = reactionData.content.location;
    event[attributes.content_id] = reactionData.content.id;
    postEvent(event);
}

function postCommentsViewed(pageData, containerData, reactionData, groupSettings) {
    var event = createEvent(eventTypes.view_comments, '', groupSettings);
    appendPageDataParams(event, pageData);
    event[attributes.container_hash] = containerData.hash;
    event[attributes.container_kind] = containerData.type;
    event[attributes.reaction_body] = reactionData.text;
    postEvent(event);
}

function postCommentCreated(pageData, containerData, reactionData, comment, groupSettings) {
    var event = createEvent(eventTypes.comment, comment, groupSettings);
    appendPageDataParams(event, pageData);
    event[attributes.container_hash] = containerData.hash;
    event[attributes.container_kind] = containerData.type;
    event[attributes.reaction_body] = reactionData.text;
    postEvent(event);
}

function toDo(eventType, eventValue, pageData, groupSettings) {

    var event = {};

    event[attributes.user_id] = ''; // TODO
    event[attributes.page_id] = pageData ? pageData.id : 'na';
    event[attributes.long_term_session] = ''; // TODO
    event[attributes.short_term_session] = ''; // TODO


    event[attributes.content_attributes] = ''; // TODO: params.content_attributes || null,  // what is this for?
    event[attributes.page_topics] = ''; // TODO: ANT.group.topics || null,
    event[attributes.author] = ''; // TODO: ANT.group.author || null,
    event[attributes.site_section] = ''; // TODO: ANT.group.section || null,

}

function appendPageDataParams(event, pageData) {
    event[attributes.page_title] = pageData.pageTitle; // TODO: Send pageTitle back on page data
    event[attributes.canonical_url] = ''; // TODO: Send back the canonical URL from the server?
    event[attributes.page_url] = pageData.requestedURL; // TODO: Figure out what we want for page_url and canonical_url here
    event[attributes.article_height] = 0 || pageData.metrics.height;
}

function createEvent(eventType, eventValue, groupSettings) {
    // TODO: engage_full code. Review
    var referrer_url = document.referrer.split('/').splice(2).join('/');
    // end engage_full code

    var event = {};
    event[attributes.event_type] = eventType;
    event[attributes.event_value] = eventValue;
    event[attributes.group_id] = groupSettings.groupId();
    event[attributes.referrer_url] = referrer_url;
    event[attributes.referrer_url_dupe] = referrer_url; // TODO: Resolve the dupe property
    event[attributes.isTouchBrowser] = isTouchBrowser;
    event[attributes.screen_width] = screen.width;
    event[attributes.screen_height] = screen.height;
    event[attributes.pixel_density] = window.devicePixelRatio || Math.round(window.screen.availWidth / document.documentElement.clientWidth); // TODO: review this engage_full code, which doesn't seem correct
    event[attributes.user_agent] = navigator.userAgent;
    return event;
}

function postEvent(event) {
    fillInMissingProperties(event);
    // Send the event to BigQuery
    AjaxClient.postEvent(event); // TODO: do we need to do anything in a success/fail callback?
}

// Fill in any optional properties with null values.
// TODO: review which properties should be null vs other values ('', undefined, false)
// TODO: fix the API to not require this
function fillInMissingProperties(event) {
    for (var attr in attributes) {
        if (event[attributes[attr]] === undefined) {
            event[attributes[attr]] = null;
        }
    }
}

// TODO: Rename these properties to be consistent and meaningful

var attributes = {
    event_type: 'et',
    event_value: 'ev',
    group_id: 'gid',
    user_id: 'uid',
    page_id: 'pid',
    long_term_session: 'lts',
    short_term_session: 'sts',
    referrer_url: 'ref',    // referrer_domain?
    content_id: 'cid',
    article_height: 'ah',
    container_hash: 'ch',
    container_kind: 'ck',
    reaction_body: 'r',
    page_title: 'pt',
    canonical_url: 'cu',
    page_url: 'pu',
    referrer_url_dupe: 'ru', // TODO: Porter?
    content_attributes: 'ca',
    content_location: 'cl',
    page_topics: 'ptop',
    author: 'a',
    site_section: 'sec',
    isTouchBrowser: 'it',
    screen_width: 'sw',
    screen_height: 'sh',
    pixel_density: 'pd',
    user_agent: 'ua'
};

var eventTypes = {
    script_load: 'sl', // TODO: this event isn't listed in the comments
    share: 'sh',
    summary_bar: 'sb',
    aWindow_show: 'rs',
    scroll: 'sc',
    widget_load: 'wl',
    comment: 'c',
    reaction: 're',
    time: 't',
    view_comments: 'vcom' // TODO: review. this was documented as an event value
};

var eventValues = {
    view_content: 'vc',
    //view_comments: 'vcom', // TODO: review. this is an eventType, not a value?
    view_reactions: 'vr',
    writemode: 'wr',
    readmode: 'rd',
    //default_summary_bar: 'def', // TODO: review. this was an old content_attributes value related to the bookmarklet
    single_summary_bar: 'si', // TODO: rename
    multiple_pages: 'mu',
    //unexpected: 'unex'
    viewReactions: 'vw',
    viewDefaults: 'ad'
};

//noinspection JSUnresolvedVariable
module.exports = {
    postGroupSettingsLoaded: postGroupSettingsLoaded,
    postPageDataLoaded: postPageDataLoaded,
    postSummaryOpened: postSummaryOpened,
    postCommentsViewed: postCommentsViewed,
    postCommentCreated: postCommentCreated,
    postReactionWidgetOpened: postReactionWidgetOpened,
    postReactionCreated: postReactionCreated
};